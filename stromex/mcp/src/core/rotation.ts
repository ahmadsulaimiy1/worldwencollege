/**
 * The rotation-due register.
 *
 * ### Why this exists
 *
 * `SEB-D 45` (StromeX Editorial Bible, decision 45) reversed the earlier
 * choice to expire the estate's provider keys after a year: the Founder
 * ruled that working keys **never expire**, because a full-write
 * infrastructure key that lapses at an unattended moment takes the whole
 * automation layer down. That ruling carried one obligation, recorded in
 * the same decision: *"never expire" must not become "never rotate."* This
 * register is that obligation made real. It is the deliberate, human-driven
 * replacement for the automatic timer the estate gave up.
 *
 * ### What it actually measures, and what it cannot
 *
 * No provider API tells us when a key was minted. A token is just a bearer
 * string; it has no birthday you can read back. So this register measures
 * the only thing it honestly can: **how long THIS server has been seeing
 * the current value of each credential.** The clock starts the first time
 * the register observes a fingerprint, and it resets to zero the moment the
 * fingerprint changes — because a changed fingerprint is exactly what a
 * rotation looks like from here.
 *
 * A `fingerprint` is the same non-reversible 12-hex SHA-256 prefix the
 * audit log already stores (`SecretRef.fingerprint()`): it says *which*
 * value is in force and whether it changed, and it reveals nothing about
 * what the value is. Storing it here is therefore no more sensitive than
 * the audit trail already is.
 *
 * ### The honest gaps
 *
 *   · A key rotated in the vault but never yet resolved by this server
 *     shows its OLD age until the next resolution refreshes the
 *     fingerprint. The register lags reality by at most one observation.
 *   · A brand-new install sees every key as "age 0" on day one, because
 *     that is the first time it saw them. The due date is therefore "one
 *     interval from first sight," not "one interval from key creation." For
 *     a key that is genuinely old this is optimistic, and the register says
 *     so rather than pretending precision it does not have.
 *
 * These are stated plainly because a rotation register that overstates its
 * own certainty is the same failure mode `SEB-D 27` was written to prevent.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { StromexError } from './errors.js';

/** One interval, in days, if the operator sets none. `SEB-D 45`: twelve months. */
export const DEFAULT_ROTATION_INTERVAL_DAYS = 365;

const MS_PER_DAY = 86_400_000;

interface RegisterEntry {
  /** The 12-hex fingerprint of the value in force when it was first seen. */
  fingerprint: string;
  /** ISO-8601 instant this fingerprint was first observed by this server. */
  firstObservedAt: string;
}

export interface RotationObservation {
  /** ISO-8601 instant the current fingerprint was first seen here. */
  firstObservedAt: string;
  /**
   * True only when a PREVIOUS, DIFFERENT fingerprint was on record for this
   * name — i.e. a real rotation was witnessed, not a first sighting.
   */
  rotated: boolean;
}

export interface RotationStatus {
  name: string;
  fingerprint: string;
  firstObservedAt: string;
  ageDays: number;
  dueAt: string;
  /** Whole days until due; negative once overdue. */
  daysUntilDue: number;
  overdue: boolean;
  /** True the first time this server ever saw the credential (age is a floor, not a fact). */
  firstSighting: boolean;
}

export interface RotationRegisterOptions {
  path: string;
  intervalDays?: number;
  now?: () => Date;
  /** Injected in tests, mirroring ApprovalStore. */
  io?: { read: () => string; write: (contents: string) => void };
}

export class RotationRegister {
  readonly intervalDays: number;
  private readonly now: () => Date;
  private readonly io: { read: () => string; write: (contents: string) => void };

  constructor(options: RotationRegisterOptions) {
    this.intervalDays =
      options.intervalDays && options.intervalDays > 0 ? options.intervalDays : DEFAULT_ROTATION_INTERVAL_DAYS;
    this.now = options.now ?? (() => new Date());
    this.io = options.io ?? fileIo(options.path);
  }

  /**
   * Record that `fingerprint` is the value now in force for `name`.
   *
   * Writes to disk ONLY when something changed — a name never seen before,
   * or a fingerprint that differs from the stored one. A steady-state
   * observation of an unchanged credential touches nothing, so calling this
   * from a read-class tool does not turn that tool into a writer of
   * anything a caller would notice: it updates local bookkeeping about the
   * server's own credentials and reaches no provider.
   */
  observe(name: string, fingerprint: string): RotationObservation {
    const all = this.readAll();
    const existing = all[name];
    if (existing && existing.fingerprint === fingerprint) {
      return { firstObservedAt: existing.firstObservedAt, rotated: false };
    }
    const firstObservedAt = this.now().toISOString();
    all[name] = { fingerprint, firstObservedAt };
    this.writeAll(all);
    return { firstObservedAt, rotated: existing !== undefined };
  }

  /** What is on record for a name, without recording anything. */
  peek(name: string): RegisterEntry | undefined {
    return this.readAll()[name];
  }

  /**
   * Observe `fingerprint` for `name` and return its full rotation status.
   * The one call a tool needs: it both keeps the register current and
   * answers "is this key due?"
   */
  assess(name: string, fingerprint: string): RotationStatus {
    const before = this.peek(name);
    const observation = this.observe(name, fingerprint);
    const firstSighting = before === undefined;
    const firstObservedMs = Date.parse(observation.firstObservedAt);
    const nowMs = this.now().getTime();
    const dueMs = firstObservedMs + this.intervalDays * MS_PER_DAY;
    return {
      name,
      fingerprint,
      firstObservedAt: observation.firstObservedAt,
      ageDays: Math.floor((nowMs - firstObservedMs) / MS_PER_DAY),
      dueAt: new Date(dueMs).toISOString(),
      daysUntilDue: Math.floor((dueMs - nowMs) / MS_PER_DAY),
      overdue: dueMs <= nowMs,
      firstSighting,
    };
  }

  private readAll(): Record<string, RegisterEntry> {
    const raw = this.io.read();
    if (!raw.trim()) return {};
    try {
      return JSON.parse(raw) as Record<string, RegisterEntry>;
    } catch {
      // A corrupt register is not silently reset to empty: that would
      // restart every key's clock at zero and hide overdue keys, the exact
      // outcome this register exists to prevent.
      throw new StromexError({
        code: 'IO_ERROR',
        message: 'The rotation register is not valid JSON.',
        remediation: 'Inspect it, then move it aside deliberately. It rebuilds itself from the next observation of each credential.',
      });
    }
  }

  private writeAll(all: Record<string, RegisterEntry>): void {
    this.io.write(JSON.stringify(all, null, 2));
  }
}

function fileIo(path: string): { read: () => string; write: (contents: string) => void } {
  mkdirSync(dirname(path), { recursive: true });
  return {
    read: () => (existsSync(path) ? readFileSync(path, 'utf8') : ''),
    write: (contents) => writeFileSync(path, contents, { encoding: 'utf8', mode: 0o600 }),
  };
}

/** In-memory register for tests, mirroring `memoryIo`. */
export function memoryRotationIo(initial = ''): { read: () => string; write: (contents: string) => void } {
  let state = initial;
  return { read: () => state, write: (contents) => { state = contents; } };
}
