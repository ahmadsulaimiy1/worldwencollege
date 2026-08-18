/**
 * Approval grants for protected operations.
 *
 * ### What this can and cannot guarantee
 *
 * An MCP server speaks to a *client*, not to a person. Nothing arriving
 * on the transport proves a human saw it. Three layers therefore stand in
 * for human authentication, and it is worth being exact about each:
 *
 *   1. **The host's own permission prompt.** Claude Code, Claude Desktop
 *      and comparable hosts ask the operator before invoking a tool. This
 *      is the strongest layer and this server does not implement it — it
 *      relies on it, and the `destructiveHint` annotation on every
 *      protected tool is what tells the host to ask.
 *
 *   2. **Elicitation.** When the client declares the `elicitation`
 *      capability, the server asks the client to put a specific question
 *      to the user — naming the resource and requiring the exact
 *      confirmation phrase back. The host renders that to a person.
 *
 *   3. **Out-of-band grants.** When elicitation is unavailable, the
 *      server writes a pending request to disk and refuses the operation
 *      until `stromex-mcp approve <id>` is run. This defends against an
 *      *accident* — a mistaken tool call, a runaway loop, a
 *      misinterpreted instruction. It does **not** defend against an
 *      agent that also holds a shell on the same machine, because such an
 *      agent can run the approve command itself. Where that matters, run
 *      the server with `protectedOperations=deny` and perform deletions
 *      by hand.
 *
 * A grant is bound to the exact arguments it was requested for, so an
 * approval for "delete the staging bucket" cannot be replayed against the
 * production one.
 */

import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { StromexError } from './errors.js';
import { canonicalJson } from './audit.js';

export type ApprovalStatus = 'pending' | 'approved' | 'consumed' | 'expired' | 'rejected';

export interface ApprovalRequest {
  id: string;
  tool: string;
  provider: string;
  resource?: string;
  /** Human-readable statement of exactly what will happen. */
  description: string;
  /** Binds the grant to one specific set of arguments. */
  argumentsDigest: string;
  confirmationPhrase: string;
  status: ApprovalStatus;
  createdAt: string;
  expiresAt: string;
  approvedAt?: string;
  approvedBy?: string;
  approvalChannel?: 'elicitation' | 'cli';
  consumedAt?: string;
  /** Id of the pre-image recorded before a destructive step, when one was. */
  journalEntryId?: string;
}

export interface ApprovalStoreOptions {
  path: string;
  ttlSeconds?: number;
  now?: () => Date;
  /** Injected in tests. */
  io?: { read: () => string; write: (contents: string) => void };
}

export function digestArguments(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex').slice(0, 32);
}

export class ApprovalStore {
  private readonly ttlSeconds: number;
  private readonly now: () => Date;
  private readonly io: { read: () => string; write: (contents: string) => void };

  constructor(options: ApprovalStoreOptions) {
    this.ttlSeconds = options.ttlSeconds ?? 900;
    this.now = options.now ?? (() => new Date());
    this.io = options.io ?? fileIo(options.path);
  }

  create(input: {
    tool: string;
    provider: string;
    resource?: string;
    description: string;
    argumentsDigest: string;
  }): ApprovalRequest {
    const now = this.now();
    const request: ApprovalRequest = {
      id: `apr_${randomUUID().replaceAll('-', '').slice(0, 20)}`,
      tool: input.tool,
      provider: input.provider,
      resource: input.resource,
      description: input.description,
      argumentsDigest: input.argumentsDigest,
      // Deterministic and specific: an operator typing this back has read
      // the resource name, which a generic "yes" would never prove.
      confirmationPhrase: buildPhrase(input.tool, input.resource),
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.ttlSeconds * 1000).toISOString(),
    };
    const all = this.readAll();
    all[request.id] = request;
    this.writeAll(all);
    return request;
  }

  get(id: string): ApprovalRequest | undefined {
    return this.readAll()[id];
  }

  list(filter: { status?: ApprovalStatus } = {}): ApprovalRequest[] {
    const all = Object.values(this.readAll()).map((r) => this.withExpiry(r));
    const filtered = filter.status ? all.filter((r) => r.status === filter.status) : all;
    return filtered.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  /** Records a human's approval, from the CLI or from an elicitation reply. */
  approve(id: string, options: { approvedBy: string; channel: 'elicitation' | 'cli'; phrase: string }): ApprovalRequest {
    const all = this.readAll();
    const existing = all[id];
    if (!existing) {
      throw new StromexError({
        code: 'POLICY_APPROVAL_INVALID',
        message: `No approval request with id ${id}.`,
        remediation: 'Run `stromex-mcp approvals` to list pending requests; ids expire and are single-use.',
      });
    }
    const current = this.withExpiry(existing);
    if (current.status === 'expired') {
      throw new StromexError({
        code: 'POLICY_APPROVAL_EXPIRED',
        message: `Approval ${id} expired at ${current.expiresAt}.`,
        remediation: 'Call the tool again to raise a fresh approval request.',
      });
    }
    if (current.status !== 'pending') {
      throw new StromexError({
        code: 'POLICY_APPROVAL_INVALID',
        message: `Approval ${id} is ${current.status} and cannot be approved again.`,
        remediation: 'Approvals are single-use. Call the tool again to raise a fresh request.',
      });
    }
    if (options.phrase.trim() !== current.confirmationPhrase) {
      throw new StromexError({
        code: 'POLICY_APPROVAL_INVALID',
        message: 'The confirmation phrase does not match.',
        remediation: `Type the phrase exactly: ${current.confirmationPhrase}`,
      });
    }
    const approved: ApprovalRequest = {
      ...current,
      status: 'approved',
      approvedAt: this.now().toISOString(),
      approvedBy: options.approvedBy,
      approvalChannel: options.channel,
    };
    all[id] = approved;
    this.writeAll(all);
    return approved;
  }

  reject(id: string, reason: string): ApprovalRequest {
    const all = this.readAll();
    const existing = all[id];
    if (!existing) {
      throw new StromexError({
        code: 'POLICY_APPROVAL_INVALID',
        message: `No approval request with id ${id}.`,
        remediation: 'Run `stromex-mcp approvals` to list pending requests.',
      });
    }
    const rejected: ApprovalRequest = { ...existing, status: 'rejected', description: `${existing.description} (rejected: ${reason})` };
    all[id] = rejected;
    this.writeAll(all);
    return rejected;
  }

  /**
   * Spends a grant. Fails unless it is approved, unexpired, unspent, and
   * for exactly these arguments.
   */
  consume(id: string, argumentsDigest: string): ApprovalRequest {
    const all = this.readAll();
    const existing = all[id];
    if (!existing) {
      throw new StromexError({
        code: 'POLICY_APPROVAL_INVALID',
        message: `No approval request with id ${id}.`,
        remediation: 'Call the tool without an approval id to raise a fresh request.',
      });
    }
    const current = this.withExpiry(existing);
    if (current.status === 'expired') {
      throw new StromexError({
        code: 'POLICY_APPROVAL_EXPIRED',
        message: `Approval ${id} expired at ${current.expiresAt}.`,
        remediation: 'Call the tool without an approval id to raise a fresh request.',
      });
    }
    if (current.status !== 'approved') {
      throw new StromexError({
        code: 'POLICY_APPROVAL_INVALID',
        message: `Approval ${id} is ${current.status}; only an approved grant can be used.`,
        remediation: current.status === 'pending'
          ? `A human must approve it first: stromex-mcp approve ${id} --phrase "${current.confirmationPhrase}"`
          : 'Approvals are single-use. Call the tool again to raise a fresh request.',
      });
    }
    if (current.argumentsDigest !== argumentsDigest) {
      throw new StromexError({
        code: 'POLICY_APPROVAL_INVALID',
        message: 'The approval was granted for different arguments than the ones now supplied.',
        remediation: 'A grant is bound to the exact arguments it was requested for. Call the tool again to raise a request for these arguments.',
      });
    }
    const consumed: ApprovalRequest = { ...current, status: 'consumed', consumedAt: this.now().toISOString() };
    all[id] = consumed;
    this.writeAll(all);
    return consumed;
  }

  attachJournalEntry(id: string, journalEntryId: string): void {
    const all = this.readAll();
    const existing = all[id];
    if (!existing) return;
    all[id] = { ...existing, journalEntryId };
    this.writeAll(all);
  }

  /** Drops consumed and expired grants older than the given age. */
  prune(olderThanSeconds = 86_400): number {
    const all = this.readAll();
    const cutoff = this.now().getTime() - olderThanSeconds * 1000;
    let removed = 0;
    for (const [id, request] of Object.entries(all)) {
      const settled = request.status === 'consumed' || request.status === 'rejected' || this.withExpiry(request).status === 'expired';
      if (settled && Date.parse(request.createdAt) < cutoff) {
        delete all[id];
        removed += 1;
      }
    }
    if (removed > 0) this.writeAll(all);
    return removed;
  }

  private withExpiry(request: ApprovalRequest): ApprovalRequest {
    if (request.status === 'pending' || request.status === 'approved') {
      if (Date.parse(request.expiresAt) < this.now().getTime()) return { ...request, status: 'expired' };
    }
    return request;
  }

  private readAll(): Record<string, ApprovalRequest> {
    const raw = this.io.read();
    if (!raw.trim()) return {};
    try {
      return JSON.parse(raw) as Record<string, ApprovalRequest>;
    } catch {
      // A corrupt approvals file must not be silently replaced with an
      // empty one: that would turn corruption into a free pass.
      throw new StromexError({
        code: 'IO_ERROR',
        message: 'The approvals file is not valid JSON.',
        remediation: 'Inspect it, then move it aside deliberately. See mcp/docs/recovery.md § Approvals.',
      });
    }
  }

  private writeAll(all: Record<string, ApprovalRequest>): void {
    this.io.write(JSON.stringify(all, null, 2));
  }
}

function buildPhrase(tool: string, resource: string | undefined): string {
  const verb = tool.split('.').at(-1) ?? tool;
  const noun = resource ?? tool.split('.').slice(0, -1).join('.');
  return `${verb} ${noun}`.toUpperCase().replace(/\s+/g, ' ').trim();
}

function fileIo(path: string): { read: () => string; write: (contents: string) => void } {
  mkdirSync(dirname(path), { recursive: true });
  return {
    read: () => (existsSync(path) ? readFileSync(path, 'utf8') : ''),
    write: (contents) => writeFileSync(path, contents, { encoding: 'utf8', mode: 0o600 }),
  };
}

/** In-memory store for tests. */
export function memoryIo(initial = ''): { read: () => string; write: (contents: string) => void } {
  let state = initial;
  return { read: () => state, write: (contents) => { state = contents; } };
}
