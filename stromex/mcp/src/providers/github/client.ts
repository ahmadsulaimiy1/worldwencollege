/**
 * GitHub REST client.
 *
 * Covers repositories, branches, contents, multi-file commits, pull
 * requests, issues, releases, tags, Actions, and repository secrets and
 * variables.
 *
 * The only cryptographically interesting part is `putRepoSecret`: GitHub
 * requires the value to be encrypted client-side with the repository's
 * public key using a libsodium **sealed box**, so the plaintext never
 * reaches GitHub's API surface. That is implemented here properly rather
 * than approximated — a secret sent in the wrong envelope is a secret
 * sent in the clear.
 */

import sodium from 'libsodium-wrappers';
import { HttpClient, type FetchLike } from '../../core/http.js';
import type { Logger } from '../../core/logger.js';
import type { SecretRef } from '../../core/secret.js';

export interface GitHubClientOptions {
  token: SecretRef;
  logger?: Logger;
  fetchImpl?: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
}

export interface RepoRef {
  owner: string;
  repo: string;
}

export class GitHubClient {
  readonly http: HttpClient;
  private readonly token: SecretRef;

  constructor(options: GitHubClientOptions) {
    this.token = options.token;
    this.http = new HttpClient({
      provider: 'github',
      baseUrl: options.baseUrl ?? 'https://api.github.com',
      authHeaders: () => ({ authorization: `Bearer ${this.token.reveal()}` }),
      defaultHeaders: {
        accept: 'application/vnd.github+json',
        'x-github-api-version': '2022-11-28',
      },
      logger: options.logger,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs ?? 30_000,
      rateLimit: options.rateLimit,
      errorMessage: (_status, body) => {
        const payload = body as { message?: string; errors?: Array<{ message?: string; field?: string }> } | undefined;
        if (!payload?.message) return undefined;
        const detail = payload.errors?.map((e) => e.message ?? e.field).filter(Boolean).join('; ');
        return detail ? `${payload.message} (${detail})` : payload.message;
      },
    });
  }

  credentialFingerprint(): string {
    return this.token.fingerprint();
  }

  // ── Identity ───────────────────────────────────────────────────────

  async viewer(): Promise<{ login: string; id: number; type: string }> {
    const response = await this.http.request<{ login: string; id: number; type: string }>({
      method: 'GET',
      path: '/user',
      operation: 'viewer',
    });
    return response.body;
  }

  // ── Repositories ───────────────────────────────────────────────────

  async listRepos(params: { affiliation?: string; perPage?: number; page?: number; sort?: string } = {}): Promise<unknown[]> {
    const response = await this.http.request<unknown[]>({
      method: 'GET',
      path: '/user/repos',
      query: {
        affiliation: params.affiliation ?? 'owner,collaborator,organization_member',
        per_page: params.perPage ?? 50,
        page: params.page ?? 1,
        sort: params.sort ?? 'pushed',
      },
      operation: 'repo.list',
    });
    return response.body;
  }

  async getRepo(ref: RepoRef): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}`,
      operation: 'repo.get',
    });
    return response.body;
  }

  async createRepo(params: {
    name: string;
    org?: string;
    description?: string;
    private?: boolean;
    autoInit?: boolean;
  }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: params.org ? `/orgs/${enc(params.org)}/repos` : '/user/repos',
      body: {
        kind: 'json',
        value: {
          name: params.name,
          description: params.description,
          private: params.private ?? true,
          auto_init: params.autoInit ?? true,
        },
      },
      operation: 'repo.create',
    });
    return response.body;
  }

  // ── Branches and refs ──────────────────────────────────────────────

  async listBranches(ref: RepoRef, perPage = 50): Promise<unknown[]> {
    const response = await this.http.request<unknown[]>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/branches`,
      query: { per_page: perPage },
      operation: 'branch.list',
    });
    return response.body;
  }

  async getRef(ref: RepoRef, gitRef: string): Promise<{ ref: string; object: { sha: string } }> {
    const response = await this.http.request<{ ref: string; object: { sha: string } }>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/git/ref/${gitRef}`,
      operation: 'ref.get',
    });
    return response.body;
  }

  async createRef(ref: RepoRef, params: { ref: string; sha: string }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/git/refs`,
      body: { kind: 'json', value: params },
      operation: 'ref.create',
    });
    return response.body;
  }

  async updateRef(ref: RepoRef, params: { ref: string; sha: string; force?: boolean }): Promise<unknown> {
    const response = await this.http.request({
      method: 'PATCH',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/git/refs/${params.ref}`,
      body: { kind: 'json', value: { sha: params.sha, force: params.force ?? false } },
      operation: 'ref.update',
    });
    return response.body;
  }

  // ── Contents and commits ───────────────────────────────────────────

  async getFile(ref: RepoRef, path: string, gitRef?: string): Promise<{ path: string; sha: string; size: number; content: string; encoding: string }> {
    const response = await this.http.request<{ path: string; sha: string; size: number; content: string; encoding: string }>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/contents/${encodePath(path)}`,
      query: { ref: gitRef },
      operation: 'file.get',
    });
    return response.body;
  }

  /**
   * Creates a real multi-file commit through the git data API — blobs,
   * one tree, one commit, one ref update. The contents API would need one
   * commit per file, which produces a history nobody can review.
   */
  async pushFiles(
    ref: RepoRef,
    params: { branch: string; message: string; files: Array<{ path: string; content: string }> },
  ): Promise<{ commitSha: string; treeSha: string; files: number }> {
    const head = await this.getRef(ref, `heads/${params.branch}`);
    const baseCommit = await this.http.request<{ tree: { sha: string } }>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/git/commits/${head.object.sha}`,
      operation: 'commit.get',
    });

    const blobs = [];
    for (const file of params.files) {
      const blob = await this.http.request<{ sha: string }>({
        method: 'POST',
        path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/git/blobs`,
        body: { kind: 'json', value: { content: Buffer.from(file.content, 'utf8').toString('base64'), encoding: 'base64' } },
        operation: 'blob.create',
      });
      blobs.push({ path: file.path, mode: '100644' as const, type: 'blob' as const, sha: blob.body.sha });
    }

    const tree = await this.http.request<{ sha: string }>({
      method: 'POST',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/git/trees`,
      body: { kind: 'json', value: { base_tree: baseCommit.body.tree.sha, tree: blobs } },
      operation: 'tree.create',
    });

    const commit = await this.http.request<{ sha: string }>({
      method: 'POST',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/git/commits`,
      body: { kind: 'json', value: { message: params.message, tree: tree.body.sha, parents: [head.object.sha] } },
      operation: 'commit.create',
    });

    await this.updateRef(ref, { ref: `heads/${params.branch}`, sha: commit.body.sha });
    return { commitSha: commit.body.sha, treeSha: tree.body.sha, files: params.files.length };
  }

  // ── Pull requests ──────────────────────────────────────────────────

  async listPullRequests(ref: RepoRef, params: { state?: string; perPage?: number } = {}): Promise<unknown[]> {
    const response = await this.http.request<unknown[]>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/pulls`,
      query: { state: params.state ?? 'open', per_page: params.perPage ?? 30 },
      operation: 'pull.list',
    });
    return response.body;
  }

  async createPullRequest(ref: RepoRef, params: { title: string; head: string; base: string; body?: string; draft?: boolean }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/pulls`,
      body: { kind: 'json', value: params },
      operation: 'pull.create',
    });
    return response.body;
  }

  async mergePullRequest(ref: RepoRef, params: { number: number; method?: 'merge' | 'squash' | 'rebase'; title?: string }): Promise<unknown> {
    const response = await this.http.request({
      method: 'PUT',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/pulls/${params.number}/merge`,
      body: { kind: 'json', value: { merge_method: params.method ?? 'squash', commit_title: params.title } },
      operation: 'pull.merge',
      idempotent: false,
    });
    return response.body;
  }

  // ── Issues ─────────────────────────────────────────────────────────

  async listIssues(ref: RepoRef, params: { state?: string; perPage?: number } = {}): Promise<unknown[]> {
    const response = await this.http.request<unknown[]>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/issues`,
      query: { state: params.state ?? 'open', per_page: params.perPage ?? 30 },
      operation: 'issue.list',
    });
    return response.body;
  }

  async createIssue(ref: RepoRef, params: { title: string; body?: string; labels?: string[] }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/issues`,
      body: { kind: 'json', value: params },
      operation: 'issue.create',
    });
    return response.body;
  }

  // ── Actions ────────────────────────────────────────────────────────

  async listWorkflows(ref: RepoRef): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/workflows`,
      operation: 'workflow.list',
    });
    return response.body;
  }

  async dispatchWorkflow(ref: RepoRef, params: { workflowId: string; gitRef: string; inputs?: Record<string, string> }): Promise<void> {
    await this.http.request({
      method: 'POST',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/workflows/${enc(params.workflowId)}/dispatches`,
      body: { kind: 'json', value: { ref: params.gitRef, inputs: params.inputs } },
      operation: 'workflow.dispatch',
      expect: 'none',
    });
  }

  async listWorkflowRuns(ref: RepoRef, params: { branch?: string; status?: string; perPage?: number } = {}): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/runs`,
      query: { branch: params.branch, status: params.status, per_page: params.perPage ?? 10 },
      operation: 'workflow.runs',
    });
    return response.body;
  }

  // ── Releases and tags ──────────────────────────────────────────────

  async listReleases(ref: RepoRef, perPage = 20): Promise<unknown[]> {
    const response = await this.http.request<unknown[]>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/releases`,
      query: { per_page: perPage },
      operation: 'release.list',
    });
    return response.body;
  }

  async createRelease(ref: RepoRef, params: { tagName: string; name?: string; body?: string; draft?: boolean; prerelease?: boolean; targetCommitish?: string }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/releases`,
      body: {
        kind: 'json',
        value: {
          tag_name: params.tagName,
          name: params.name ?? params.tagName,
          body: params.body,
          draft: params.draft ?? false,
          prerelease: params.prerelease ?? false,
          target_commitish: params.targetCommitish,
        },
      },
      operation: 'release.create',
    });
    return response.body;
  }

  async listTags(ref: RepoRef, perPage = 30): Promise<unknown[]> {
    const response = await this.http.request<unknown[]>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/tags`,
      query: { per_page: perPage },
      operation: 'tag.list',
    });
    return response.body;
  }

  // ── Secrets and variables ──────────────────────────────────────────

  async listRepoSecrets(ref: RepoRef): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/secrets`,
      operation: 'secret.list',
    });
    return response.body;
  }

  /**
   * Encrypts with the repository's public key using a libsodium sealed
   * box, exactly as GitHub requires, then PUTs the ciphertext. The
   * plaintext is never sent.
   */
  async putRepoSecret(ref: RepoRef, params: { name: string; value: string }): Promise<{ keyId: string }> {
    const key = await this.http.request<{ key: string; key_id: string }>({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/secrets/public-key`,
      operation: 'secret.public-key',
    });

    await sodium.ready;
    const sealed = sodium.crypto_box_seal(
      sodium.from_string(params.value),
      sodium.from_base64(key.body.key, sodium.base64_variants.ORIGINAL),
    );

    await this.http.request({
      method: 'PUT',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/secrets/${enc(params.name)}`,
      body: {
        kind: 'json',
        value: {
          encrypted_value: sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL),
          key_id: key.body.key_id,
        },
      },
      operation: 'secret.put',
      expect: 'none',
      idempotent: true,
    });
    return { keyId: key.body.key_id };
  }

  async listRepoVariables(ref: RepoRef): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/variables`,
      operation: 'variable.list',
    });
    return response.body;
  }

  /** Creates or updates — GitHub splits these across POST and PATCH. */
  async putRepoVariable(ref: RepoRef, params: { name: string; value: string }): Promise<{ created: boolean }> {
    const existing = await this.http.request({
      method: 'GET',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/variables/${enc(params.name)}`,
      operation: 'variable.get',
      tolerateStatuses: [404],
    });
    const exists = existing.status === 200;
    await this.http.request({
      method: exists ? 'PATCH' : 'POST',
      path: exists
        ? `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/variables/${enc(params.name)}`
        : `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/variables`,
      body: { kind: 'json', value: { name: params.name, value: params.value } },
      operation: 'variable.put',
      expect: 'none',
      idempotent: true,
    });
    return { created: !exists };
  }

  async deleteRepoSecret(ref: RepoRef, name: string): Promise<void> {
    await this.http.request({
      method: 'DELETE',
      path: `/repos/${enc(ref.owner)}/${enc(ref.repo)}/actions/secrets/${enc(name)}`,
      operation: 'secret.delete',
      expect: 'none',
    });
  }
}

function enc(segment: string): string {
  return encodeURIComponent(segment);
}

/** Paths keep their slashes; each segment is escaped. */
function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}
