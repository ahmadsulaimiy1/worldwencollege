/**
 * The recovery journal: what a resource looked like immediately before
 * something irreversible happened to it.
 *
 * "Back up before deletion" is only a policy if something enforces it.
 * Protected operations capture a pre-image here first, and the policy
 * layer refuses to proceed when a pre-image was required and not
 * recorded. `stromex.recovery.list` and `stromex.recovery.get` then let an
 * operator read back exactly what was removed, which is often enough to
 * recreate it.
 *
 * A pre-image is what the provider's API can tell us — a DNS record's
 * fields, a bucket's configuration, an environment variable's metadata.
 * It is *not* a data backup: nothing here copies the objects inside an R2
 * bucket or the rows inside a database. Where a real backup is possible
 * through the provider (a Neon branch, a D1 export) the workflow that
 * needs it takes one, and says so.
 */

import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { redactValue } from './redact.js';

export interface JournalEntry {
  id: string;
  ts: string;
  tool: string;
  provider: string;
  operation: string;
  resource: string;
  /** What the provider reported about the resource before the operation. */
  preImage: unknown;
  /** How to put it back, in words, when the API alone cannot. */
  restoreHint: string;
  approvalId?: string;
}

export interface RecoveryJournalOptions {
  path: string;
  now?: () => Date;
  sink?: { append: (line: string) => void; readAll: () => string };
}

export class RecoveryJournal {
  private readonly now: () => Date;
  private readonly sink: { append: (line: string) => void; readAll: () => string };

  constructor(options: RecoveryJournalOptions) {
    this.now = options.now ?? (() => new Date());
    this.sink = options.sink ?? fileSink(options.path);
  }

  record(input: Omit<JournalEntry, 'id' | 'ts'>): JournalEntry {
    const entry: JournalEntry = {
      ...input,
      preImage: redactValue(input.preImage),
      id: `jrn_${randomUUID().replaceAll('-', '').slice(0, 20)}`,
      ts: this.now().toISOString(),
    };
    this.sink.append(JSON.stringify(entry));
    return entry;
  }

  list(limit = 50): JournalEntry[] {
    return this.readAll().reverse().slice(0, limit);
  }

  get(id: string): JournalEntry | undefined {
    return this.readAll().find((entry) => entry.id === id);
  }

  private readAll(): JournalEntry[] {
    const raw = this.sink.readAll();
    if (!raw.trim()) return [];
    const out: JournalEntry[] = [];
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line) as JournalEntry);
      } catch {
        // One unreadable line must not hide the rest of the journal:
        // during a recovery the other entries are what you came for.
        continue;
      }
    }
    return out;
  }
}

function fileSink(path: string): { append: (line: string) => void; readAll: () => string } {
  mkdirSync(dirname(path), { recursive: true });
  return {
    append: (line) => appendFileSync(path, line + '\n', { encoding: 'utf8', mode: 0o600 }),
    readAll: () => (existsSync(path) ? readFileSync(path, 'utf8') : ''),
  };
}
