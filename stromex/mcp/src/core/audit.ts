/**
 * The audit trail.
 *
 * Append-only JSONL, hash-chained. Each record carries the hash of the
 * one before it, so a record cannot be edited or removed after the fact
 * without breaking every hash that follows — and `stromex.audit.verify`
 * says exactly which sequence number broke.
 *
 * This is a *tamper-evident* log, not a tamper-proof one: anyone who can
 * write the file can rewrite the whole chain from a chosen point. Making
 * it tamper-proof requires an append-only sink this process cannot rewrite
 * (a WORM bucket, a syslog collector). See docs/security.md § 6 for the
 * supported way to do that; the honest claim here is evidence of
 * tampering, not prevention of it.
 */

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { StromexError } from './errors.js';
import { redactValue } from './redact.js';

export type AuditOutcome = 'ok' | 'error' | 'denied' | 'approval_required' | 'dry_run';

export interface AuditRecordInput {
  actor: string;
  tool: string;
  provider: string;
  operation: string;
  /** The authority class the policy engine assigned. */
  operationClass: string;
  outcome: AuditOutcome;
  durationMs: number;
  /** Already-redacted arguments. Never pass raw arguments here. */
  arguments?: unknown;
  resource?: string;
  errorCode?: string;
  errorMessage?: string;
  approvalId?: string;
  workflowRunId?: string;
  /** Fingerprint of the credential used, never the credential. */
  credentialFingerprint?: string;
  requestId: string;
}

export interface AuditRecord extends AuditRecordInput {
  seq: number;
  ts: string;
  prevHash: string;
  hash: string;
}

export const GENESIS_HASH = '0'.repeat(64);

/**
 * Canonical JSON: keys sorted, no incidental whitespace. Without this the
 * chain would depend on key insertion order and verification would fail
 * for records that are in fact untouched.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export function hashRecord(record: Omit<AuditRecord, 'hash'>): string {
  return createHash('sha256').update(canonicalJson(record)).digest('hex');
}

export interface AuditLogOptions {
  path: string;
  now?: () => Date;
  /** Injected in tests to avoid touching a filesystem. */
  sink?: { append: (line: string) => void; readAll: () => string };
}

export class AuditLog {
  private readonly path: string;
  private readonly now: () => Date;
  private readonly sink: { append: (line: string) => void; readAll: () => string };
  private lastHash: string;
  private lastSeq: number;

  constructor(options: AuditLogOptions) {
    this.path = options.path;
    this.now = options.now ?? (() => new Date());
    this.sink = options.sink ?? fileSink(options.path);
    const tail = this.readTail();
    this.lastHash = tail?.hash ?? GENESIS_HASH;
    this.lastSeq = tail?.seq ?? 0;
  }

  get file(): string {
    return this.path;
  }

  /**
   * Appends one record and returns it. Arguments are redacted again here
   * even though callers are asked to redact: defence in depth on the one
   * file most likely to be read by a person later.
   */
  append(input: AuditRecordInput): AuditRecord {
    const base: Omit<AuditRecord, 'hash'> = {
      ...input,
      arguments: input.arguments === undefined ? undefined : redactValue(input.arguments),
      errorMessage: input.errorMessage === undefined ? undefined : redactValue(input.errorMessage),
      seq: this.lastSeq + 1,
      ts: this.now().toISOString(),
      prevHash: this.lastHash,
    };
    const record: AuditRecord = { ...base, hash: hashRecord(base) };
    this.sink.append(JSON.stringify(record));
    this.lastSeq = record.seq;
    this.lastHash = record.hash;
    return record;
  }

  read(): AuditRecord[] {
    const raw = this.sink.readAll();
    if (!raw.trim()) return [];
    const records: AuditRecord[] = [];
    for (const [index, line] of raw.split('\n').entries()) {
      if (!line.trim()) continue;
      try {
        records.push(JSON.parse(line) as AuditRecord);
      } catch (cause) {
        throw new StromexError({
          code: 'AUDIT_CHAIN_BROKEN',
          message: `Audit line ${index + 1} of ${this.path} is not valid JSON.`,
          remediation: 'Do not edit the audit log by hand. Recover it from backup and see mcp/docs/recovery.md § Audit log.',
          cause,
        });
      }
    }
    return records;
  }

  query(filter: AuditQuery = {}): AuditRecord[] {
    let records = this.read();
    if (filter.since) {
      const since = Date.parse(filter.since);
      records = records.filter((r) => Date.parse(r.ts) >= since);
    }
    if (filter.until) {
      const until = Date.parse(filter.until);
      records = records.filter((r) => Date.parse(r.ts) <= until);
    }
    if (filter.tool) records = records.filter((r) => r.tool === filter.tool);
    if (filter.provider) records = records.filter((r) => r.provider === filter.provider);
    if (filter.outcome) records = records.filter((r) => r.outcome === filter.outcome);
    if (filter.operationClass) records = records.filter((r) => r.operationClass === filter.operationClass);
    if (filter.workflowRunId) records = records.filter((r) => r.workflowRunId === filter.workflowRunId);
    // Newest first: the question asked of an audit log is nearly always
    // "what just happened", not "what happened first".
    records.reverse();
    return records.slice(0, filter.limit ?? 50);
  }

  /** Recomputes the whole chain. Returns the first break, if any. */
  verify(): AuditVerification {
    const records = this.read();
    let prevHash = GENESIS_HASH;
    let expectedSeq = 1;

    for (const record of records) {
      const { hash, ...withoutHash } = record;
      if (record.seq !== expectedSeq) {
        return { ok: false, checked: expectedSeq - 1, total: records.length, brokenAtSeq: record.seq, reason: `Expected sequence ${expectedSeq} but found ${record.seq}: a record was removed or reordered.` };
      }
      if (record.prevHash !== prevHash) {
        return { ok: false, checked: expectedSeq - 1, total: records.length, brokenAtSeq: record.seq, reason: 'The recorded previous hash does not match the preceding record: a record was inserted, removed or edited.' };
      }
      if (hashRecord(withoutHash) !== hash) {
        return { ok: false, checked: expectedSeq - 1, total: records.length, brokenAtSeq: record.seq, reason: 'The record hash does not match its contents: this record was edited after it was written.' };
      }
      prevHash = hash;
      expectedSeq += 1;
    }
    return { ok: true, checked: records.length, total: records.length, headHash: prevHash };
  }

  private readTail(): AuditRecord | undefined {
    const records = this.read();
    return records.at(-1);
  }
}

export interface AuditQuery {
  since?: string;
  until?: string;
  tool?: string;
  provider?: string;
  outcome?: AuditOutcome;
  operationClass?: string;
  workflowRunId?: string;
  limit?: number;
}

export interface AuditVerification {
  ok: boolean;
  checked: number;
  total: number;
  brokenAtSeq?: number;
  reason?: string;
  headHash?: string;
}

function fileSink(path: string): { append: (line: string) => void; readAll: () => string } {
  mkdirSync(dirname(path), { recursive: true });
  return {
    append(line: string) {
      // 0o600: the audit log names resources and operators. It is not a
      // secret store, but it is nobody else's business either.
      appendFileSync(path, line + '\n', { encoding: 'utf8', mode: 0o600 });
    },
    readAll() {
      if (!existsSync(path)) return '';
      return readFileSync(path, 'utf8');
    },
  };
}

/** An in-memory sink, for tests and for `--audit-log=off`. */
export function memorySink(): { append: (line: string) => void; readAll: () => string; lines: string[] } {
  const lines: string[] = [];
  return {
    lines,
    append: (line) => { lines.push(line); },
    readAll: () => lines.join('\n'),
  };
}
