/**
 * GitHub tool surface.
 *
 * Authority classes follow `SEB §20.6`: the verb tells the class.
 * `repo.delete` does not exist here at all — a repository is an
 * institutional record under `SEB §26.1`, and archiving is the supported
 * operation. GitHub's own archive endpoint is exposed instead.
 */

import { z } from 'zod';
import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { resolveSecretArgument } from '../../core/vault.js';
import { clientFor, listPayload, plan } from '../support.js';
import type { GitHubClient } from './client.js';

const repoArgs = {
  owner: z.string().min(1).describe('Repository owner — a user or an organisation.'),
  repo: z.string().min(1).describe('Repository name.'),
} as const;

const github = (ctx: Parameters<typeof clientFor>[0]) => clientFor<GitHubClient>(ctx, 'github');

export function githubTools(): ToolDefinition[] {
  return [
    defineTool({
      name: 'github.viewer.get',
      title: 'GitHub — identify the credential',
      description: 'Returns the account the configured GitHub token authenticates as. The cheapest way to confirm a credential works and to see whose it is.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const viewer = await github(ctx).viewer();
        return { summary: `Authenticated as ${viewer.login} (${viewer.type})`, data: viewer };
      },
    }),

    defineTool({
      name: 'github.repo.list',
      title: 'GitHub — list repositories',
      description: 'Lists repositories the credential can see, most recently pushed first.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: {
        perPage: z.number().int().min(1).max(100).optional(),
        page: z.number().int().min(1).optional(),
      },
      handler: async (args, ctx) => {
        const repos = await github(ctx).listRepos({ perPage: args.perPage, page: args.page });
        return listPayload('repositories', repos, ['full_name', 'private', 'archived', 'default_branch', 'pushed_at', 'html_url']);
      },
    }),

    defineTool({
      name: 'github.repo.get',
      title: 'GitHub — get a repository',
      description: 'Returns one repository, including its default branch, visibility and archive state.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: repoArgs,
      handler: async (args, ctx) => {
        const repo = await github(ctx).getRepo(args);
        return { summary: `${args.owner}/${args.repo}`, data: repo };
      },
    }),

    defineTool({
      name: 'github.repo.create',
      title: 'GitHub — create a repository',
      description: 'Creates a repository under a user or an organisation. Private by default, and initialised so a first commit has somewhere to land.',
      provider: 'github',
      operationClass: 'write',
      inputSchema: {
        name: z.string().min(1),
        org: z.string().optional().describe('Create under this organisation instead of the authenticated user.'),
        description: z.string().optional(),
        private: z.boolean().optional().describe('Defaults to true.'),
        autoInit: z.boolean().optional().describe('Defaults to true.'),
      },
      resource: (args) => `${args.org ?? ''}/${args.name}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create repository ${args.org ?? '(user)'}/${args.name}`, args);
        const repo = await github(ctx).createRepo(args);
        return { summary: `Created repository ${args.name}`, data: repo };
      },
    }),

    defineTool({
      name: 'github.branch.list',
      title: 'GitHub — list branches',
      description: 'Lists branches in a repository.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: { ...repoArgs, perPage: z.number().int().min(1).max(100).optional() },
      handler: async (args, ctx) => {
        const branches = await github(ctx).listBranches(args, args.perPage);
        return listPayload('branches', branches, ['name', 'protected']);
      },
    }),

    defineTool({
      name: 'github.branch.create',
      title: 'GitHub — create a branch',
      description: 'Creates a branch from the tip of another branch.',
      provider: 'github',
      operationClass: 'write',
      inputSchema: {
        ...repoArgs,
        branch: z.string().min(1).describe('New branch name, without refs/heads/.'),
        from: z.string().min(1).describe('Existing branch to branch from.'),
      },
      resource: (args) => `${args.owner}/${args.repo}#${args.branch}`,
      handler: async (args, ctx) => {
        const client = github(ctx);
        const base = await client.getRef(args, `heads/${args.from}`);
        if (ctx.dryRun) return plan(`Would create ${args.branch} at ${base.object.sha.slice(0, 7)}`, { ref: `refs/heads/${args.branch}`, sha: base.object.sha });
        const created = await client.createRef(args, { ref: `refs/heads/${args.branch}`, sha: base.object.sha });
        return { summary: `Created ${args.branch} from ${args.from} at ${base.object.sha.slice(0, 7)}`, data: created };
      },
    }),

    defineTool({
      name: 'github.file.get',
      title: 'GitHub — read a file',
      description: 'Reads one file from a repository at a branch, tag or commit.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: { ...repoArgs, path: z.string().min(1), ref: z.string().optional() },
      handler: async (args, ctx) => {
        const file = await github(ctx).getFile(args, args.path, args.ref);
        const decoded = file.encoding === 'base64' ? Buffer.from(file.content, 'base64').toString('utf8') : file.content;
        return {
          summary: `${args.path} (${file.size} bytes)`,
          data: { path: file.path, sha: file.sha, size: file.size, content: decoded },
        };
      },
    }),

    defineTool({
      name: 'github.commit.push',
      title: 'GitHub — commit files',
      description:
        'Commits one or more files to a branch as a single commit, through the git data API. Multiple files land in one reviewable commit rather than one commit each.',
      provider: 'github',
      operationClass: 'write',
      inputSchema: {
        ...repoArgs,
        branch: z.string().min(1),
        message: z.string().min(1),
        files: z
          .array(z.object({ path: z.string().min(1), content: z.string() }))
          .min(1)
          .describe('Full file contents, not a diff. Existing files are replaced.'),
      },
      resource: (args) => `${args.owner}/${args.repo}#${args.branch}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) {
          return plan(`Would commit ${args.files.length} file(s) to ${args.branch}`, {
            message: args.message,
            paths: args.files.map((f) => f.path),
          });
        }
        const result = await github(ctx).pushFiles(args, args);
        return { summary: `Committed ${result.files} file(s) to ${args.branch} as ${result.commitSha.slice(0, 7)}`, data: result };
      },
    }),

    defineTool({
      name: 'github.pull.list',
      title: 'GitHub — list pull requests',
      description: 'Lists pull requests by state.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: { ...repoArgs, state: z.enum(['open', 'closed', 'all']).optional() },
      handler: async (args, ctx) => {
        const pulls = await github(ctx).listPullRequests(args, { state: args.state });
        return listPayload('pull requests', pulls, ['number', 'title', 'state', 'draft', 'head', 'base', 'html_url']);
      },
    }),

    defineTool({
      name: 'github.pull.create',
      title: 'GitHub — open a pull request',
      description: 'Opens a pull request from one branch into another.',
      provider: 'github',
      operationClass: 'write',
      inputSchema: {
        ...repoArgs,
        title: z.string().min(1),
        head: z.string().min(1),
        base: z.string().min(1),
        body: z.string().optional(),
        draft: z.boolean().optional(),
      },
      resource: (args) => `${args.owner}/${args.repo}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would open a pull request ${args.head} → ${args.base}`, args);
        const pull = await github(ctx).createPullRequest(args, args);
        return { summary: `Opened pull request ${args.head} → ${args.base}`, data: pull };
      },
    }),

    defineTool({
      name: 'github.pull.merge',
      title: 'GitHub — merge a pull request',
      description:
        'Merges a pull request. Squash by default. This is a write rather than a protected operation because a merge is revertible; it is not, however, idempotent, so it is never retried automatically.',
      provider: 'github',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: {
        ...repoArgs,
        number: z.number().int().min(1),
        method: z.enum(['merge', 'squash', 'rebase']).optional(),
        title: z.string().optional(),
      },
      resource: (args) => `${args.owner}/${args.repo}#${args.number}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would merge pull request #${args.number} by ${args.method ?? 'squash'}`, args);
        const result = await github(ctx).mergePullRequest(args, args);
        return { summary: `Merged pull request #${args.number}`, data: result };
      },
    }),

    defineTool({
      name: 'github.issue.list',
      title: 'GitHub — list issues',
      description: 'Lists issues by state.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: { ...repoArgs, state: z.enum(['open', 'closed', 'all']).optional() },
      handler: async (args, ctx) => {
        const issues = await github(ctx).listIssues(args, { state: args.state });
        return listPayload('issues', issues, ['number', 'title', 'state', 'labels', 'html_url']);
      },
    }),

    defineTool({
      name: 'github.issue.create',
      title: 'GitHub — create an issue',
      description: 'Creates an issue.',
      provider: 'github',
      operationClass: 'write',
      inputSchema: { ...repoArgs, title: z.string().min(1), body: z.string().optional(), labels: z.array(z.string()).optional() },
      resource: (args) => `${args.owner}/${args.repo}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create issue "${args.title}"`, args);
        const issue = await github(ctx).createIssue(args, args);
        return { summary: `Created issue "${args.title}"`, data: issue };
      },
    }),

    defineTool({
      name: 'github.workflow.list',
      title: 'GitHub — list workflows',
      description: 'Lists the Actions workflows defined in a repository.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: repoArgs,
      handler: async (args, ctx) => {
        const workflows = await github(ctx).listWorkflows(args);
        return { summary: 'Workflows', data: workflows };
      },
    }),

    defineTool({
      name: 'github.workflow.run',
      title: 'GitHub — trigger a workflow',
      description: 'Triggers a workflow_dispatch run on a ref. The workflow must declare a workflow_dispatch trigger; GitHub returns 404 if it does not.',
      provider: 'github',
      operationClass: 'write',
      inputSchema: {
        ...repoArgs,
        workflowId: z.string().min(1).describe('Workflow file name (deploy.yml) or numeric id.'),
        ref: z.string().min(1),
        inputs: z.record(z.string(), z.string()).optional(),
      },
      resource: (args) => `${args.owner}/${args.repo}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would dispatch ${args.workflowId} on ${args.ref}`, args);
        await github(ctx).dispatchWorkflow(args, { workflowId: args.workflowId, gitRef: args.ref, inputs: args.inputs });
        return {
          summary: `Dispatched ${args.workflowId} on ${args.ref}`,
          warnings: ['GitHub returns no run id from a dispatch. Poll github.workflow.status to find the run this created.'],
        };
      },
    }),

    defineTool({
      name: 'github.workflow.status',
      title: 'GitHub — workflow run status',
      description: 'Lists recent workflow runs, newest first, with their conclusion.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: { ...repoArgs, branch: z.string().optional(), status: z.string().optional(), perPage: z.number().int().min(1).max(50).optional() },
      handler: async (args, ctx) => {
        const runs = await github(ctx).listWorkflowRuns(args, args);
        return { summary: 'Workflow runs', data: runs };
      },
    }),

    defineTool({
      name: 'github.release.list',
      title: 'GitHub — list releases',
      description: 'Lists releases, newest first.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: repoArgs,
      handler: async (args, ctx) => {
        const releases = await github(ctx).listReleases(args);
        return listPayload('releases', releases, ['tag_name', 'name', 'draft', 'prerelease', 'published_at', 'html_url']);
      },
    }),

    defineTool({
      name: 'github.release.create',
      title: 'GitHub — create a release',
      description: 'Creates a release, tagging the target commitish if the tag does not exist.',
      provider: 'github',
      operationClass: 'write',
      inputSchema: {
        ...repoArgs,
        tagName: z.string().min(1),
        name: z.string().optional(),
        body: z.string().optional(),
        draft: z.boolean().optional(),
        prerelease: z.boolean().optional(),
        targetCommitish: z.string().optional(),
      },
      resource: (args) => `${args.owner}/${args.repo}@${args.tagName}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create release ${args.tagName}`, args);
        const release = await github(ctx).createRelease(args, args);
        return { summary: `Created release ${args.tagName}`, data: release };
      },
    }),

    defineTool({
      name: 'github.tag.list',
      title: 'GitHub — list tags',
      description: 'Lists tags.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: repoArgs,
      handler: async (args, ctx) => {
        const tags = await github(ctx).listTags(args);
        return listPayload('tags', tags, ['name', 'commit']);
      },
    }),

    defineTool({
      name: 'github.secret.list',
      title: 'GitHub — list repository secrets',
      description: 'Lists repository Actions secret NAMES. GitHub never returns a secret value, and neither does this server.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: repoArgs,
      handler: async (args, ctx) => {
        const secrets = await github(ctx).listRepoSecrets(args);
        return { summary: 'Repository secrets (names only)', data: secrets };
      },
    }),

    defineTool({
      name: 'github.secret.put',
      title: 'GitHub — set a repository secret',
      description:
        'Creates or updates a repository Actions secret. The value is encrypted client-side with the repository public key using a libsodium sealed box before it leaves this process, and is never written to the audit log or returned in the result.',
      provider: 'github',
      operationClass: 'write',
      // The caller may pass the secret literally; the registry masks it
      // out of the audit record because of this line (SEB-D 31).
      secretArgs: ['value'],
      inputSchema: {
        ...repoArgs,
        name: z.string().regex(/^[A-Z_][A-Z0-9_]*$/, 'Secret names must match /^[A-Z_][A-Z0-9_]*$/.'),
        value: z.string().min(1).optional().describe('The plaintext secret. Encrypted before transmission; never logged.'),
        valueFromHandle: z
          .string()
          .optional()
          .describe('A vault handle issued by a tool such as neon.connection.get, used instead of `value` so the credential never passes through the transcript.'),
      },
      resource: (args) => `${args.owner}/${args.repo}:${args.name}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) {
          return plan(`Would set repository secret ${args.name}`, { owner: args.owner, repo: args.repo, name: args.name, value: '«redacted»' });
        }
        const value = resolveSecretArgument(args, ctx.vault);
        const result = await github(ctx).putRepoSecret(args, { name: args.name, value });
        return { summary: `Set repository secret ${args.name}`, data: { name: args.name, keyId: result.keyId } };
      },
    }),

    defineTool({
      name: 'github.variable.list',
      title: 'GitHub — list repository variables',
      description: 'Lists repository Actions variables and their values. Variables are not secrets; do not put credentials in them.',
      provider: 'github',
      operationClass: 'read',
      inputSchema: repoArgs,
      handler: async (args, ctx) => {
        const variables = await github(ctx).listRepoVariables(args);
        return { summary: 'Repository variables', data: variables };
      },
    }),

    defineTool({
      name: 'github.variable.put',
      title: 'GitHub — set a repository variable',
      description: 'Creates or updates a repository Actions variable. Values are visible to anyone who can read the repository settings — use github.secret.put for anything sensitive.',
      provider: 'github',
      operationClass: 'write',
      inputSchema: { ...repoArgs, name: z.string().min(1), value: z.string() },
      resource: (args) => `${args.owner}/${args.repo}:${args.name}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would set variable ${args.name}`, args);
        const result = await github(ctx).putRepoVariable(args, args);
        return { summary: `${result.created ? 'Created' : 'Updated'} variable ${args.name}`, data: { name: args.name, ...result } };
      },
    }),

    defineTool({
      name: 'github.secret.delete',
      title: 'GitHub — delete a repository secret',
      description:
        'Removes a repository Actions secret. Protected: workflows depending on it will fail immediately and the value cannot be recovered from GitHub. The pre-image records only that the secret existed — GitHub never discloses the value, so nothing can restore it.',
      provider: 'github',
      operationClass: 'protected',
      inputSchema: { ...repoArgs, name: z.string().min(1) },
      resource: (args) => `${args.owner}/${args.repo}:${args.name}`,
      preImage: async (args, ctx) => {
        const secrets = await github(ctx).listRepoSecrets(args);
        return {
          preImage: { existed: true, name: args.name, repositorySecrets: secrets },
          restoreHint:
            `GitHub does not disclose secret values, so this pre-image cannot restore ${args.name}. ` +
            'Recreate it from the original source of the credential with github.secret.put.',
        };
      },
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete repository secret ${args.name}`, args);
        await github(ctx).deleteRepoSecret(args, args.name);
        return { summary: `Deleted repository secret ${args.name}`, warnings: ['The value cannot be recovered from GitHub. Any workflow using it will now fail.'] };
      },
    }),
  ];
}
