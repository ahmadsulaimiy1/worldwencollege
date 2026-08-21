/**
 * The Project Registry — what stops this server being one project's tool.
 *
 * ### Why this exists
 *
 * The StromeX MCP is a **collective** capability: one automation layer over
 * the estate's providers, serving every project — Albalagh, Al-Madeenah,
 * Sultan Hanafi Royal Schools, and whatever the estate builds next. It is
 * not any one institution's private server wearing a general name.
 *
 * The first build did not honour that. There was one flat configuration,
 * one set of credentials and one undifferentiated audit log, so nothing in
 * a record said WHICH project an action was taken for. Three consequences,
 * and each is a real failure rather than an aesthetic one:
 *
 *   1. **The audit trail could not answer "what was done for whom."** A
 *      deploy, a database branch and a domain purchase all looked alike.
 *      `SEB §21` requires an audit trail somebody can actually read, and a
 *      log that cannot attribute an action to the project it served is not
 *      one.
 *   2. **Protected-resource patterns were global.** One project's
 *      production store had to be protected by a pattern that also bound
 *      every other project, so the list grew to the union of everyone's
 *      fears and matched things nobody meant.
 *   3. **Spending could not be attributed.** `SEB §26.6` caps the estate's
 *      spend, but with no project on the record, no one could say which
 *      project spent it.
 *
 * This module is the seam that fixes all three, and it is deliberately the
 * same shape as the verifiable-document engine's *issuer profile*
 * (`SEB-D 47`): the general engine owns nothing project-specific; it is
 * TOLD which project it acts for, and refuses to guess.
 *
 * ### What a project is here
 *
 * Only what the automation layer needs to act on a project's behalf and to
 * account for what it did. It is deliberately NOT a description of the
 * institution — the estate has volumes for that. A project entry answers:
 * what is it called, what does it own, and what must never be destroyed
 * inside it.
 */

import { StromexError } from './errors.js';

/** A registered estate project the server may act for. */
export interface ProjectProfile {
  /** Short slug. Appears on every audit record taken for this project. */
  readonly key: string;
  /** Human name, for reports a person reads. */
  readonly name: string;
  /**
   * Extra protected-resource glob patterns that apply ONLY to this
   * project. Added to the estate-wide defaults, never substituted for
   * them — the same rule `config.ts` applies to the global list, for the
   * same reason: shrinking protection is a recorded decision, not a
   * configuration value.
   */
  readonly protectedResources: readonly string[];
  /**
   * Free-form provider account identifiers this project owns — a Neon
   * project id, a Vercel team, a Cloudflare account. Recorded so a human
   * reading the register can tell whose resource a given id is. NEVER a
   * credential: this is an inventory, not a keyring.
   */
  readonly resources: Readonly<Record<string, string>>;
}

export interface ProjectProfileInput {
  key: string;
  name: string;
  protectedResources?: readonly string[];
  resources?: Record<string, string>;
}

/**
 * Build and validate a project profile.
 *
 * The key is validated rather than sanitised: it is written into audit
 * records and compared across them, so a key that differs from what the
 * caller meant would silently mis-attribute actions — the one thing this
 * module exists to prevent.
 */
export function defineProject(input: ProjectProfileInput): ProjectProfile {
  const key = String(input?.key ?? '').toLowerCase();
  if (!/^[a-z][a-z0-9-]{1,31}$/.test(key)) {
    throw new StromexError({
      code: 'CONFIG_INVALID',
      message: `Project key ${JSON.stringify(input?.key)} must be a lowercase slug of 2–32 characters, e.g. "al-madeenah".`,
      remediation: 'The key is written onto every audit record for this project; it must be stable and unambiguous.',
    });
  }
  const name = String(input?.name ?? '').trim();
  if (name.length < 2) {
    throw new StromexError({
      code: 'CONFIG_INVALID',
      message: `Project ${key} needs a human-readable name.`,
      remediation: 'A register nobody can read is not a register.',
    });
  }
  for (const pattern of input.protectedResources ?? []) {
    if (typeof pattern !== 'string' || !pattern.trim()) {
      throw new StromexError({
        code: 'CONFIG_INVALID',
        message: `Project ${key} has an empty protected-resource pattern.`,
        remediation: 'An empty pattern protects nothing and hides the fact. Remove it or write the pattern you meant.',
      });
    }
  }
  return Object.freeze({
    key,
    name,
    protectedResources: Object.freeze([...(input.protectedResources ?? [])]),
    resources: Object.freeze({ ...(input.resources ?? {}) }),
  });
}

/**
 * The registry of projects this server may act for.
 *
 * Empty by default, and that is deliberate: an estate that has not
 * declared its projects gets a server that attributes nothing, rather
 * than one that quietly attributes everything to a project it invented.
 */
export class ProjectRegistry {
  private readonly projects = new Map<string, ProjectProfile>();

  constructor(profiles: readonly ProjectProfileInput[] = []) {
    for (const profile of profiles) this.register(profile);
  }

  register(input: ProjectProfileInput): ProjectProfile {
    const profile = defineProject(input);
    if (this.projects.has(profile.key)) {
      throw new StromexError({
        code: 'CONFIG_INVALID',
        message: `Project ${profile.key} is already registered.`,
        remediation: 'Two entries under one key would make audit attribution ambiguous, which is what the register exists to prevent.',
      });
    }
    this.projects.set(profile.key, profile);
    return profile;
  }

  get(key: string): ProjectProfile | undefined {
    return this.projects.get(String(key ?? '').toLowerCase());
  }

  list(): ProjectProfile[] {
    return [...this.projects.values()];
  }

  get size(): number {
    return this.projects.size;
  }

  /**
   * Resolve the project a call names, refusing an unknown one.
   *
   * An unrecognised key is NEVER treated as "no project": that would file
   * a real action under the wrong heading, or under none, precisely when
   * somebody took the trouble to say who it was for.
   */
  require(key: string): ProjectProfile {
    const found = this.get(key);
    if (found) return found;
    throw new StromexError({
      code: 'CONFIG_INVALID',
      message: `Unknown project ${JSON.stringify(key)}.`,
      remediation: this.size
        ? `Registered projects: ${this.list().map((p) => p.key).join(', ')}. Register a new one before acting for it.`
        : 'No projects are registered on this instance. Declare them with STROMEX_MCP_PROJECTS before attributing work to one.',
    });
  }

  /**
   * The protected-resource patterns in force for a call: the estate-wide
   * ones, PLUS the named project's own. Union, never replacement — a
   * project cannot narrow the estate's protection, only add to it.
   */
  protectedResourcesFor(key: string | undefined, base: readonly string[]): string[] {
    if (!key) return [...base];
    const project = this.get(key);
    return project ? [...base, ...project.protectedResources] : [...base];
  }
}

/**
 * Parse the `STROMEX_MCP_PROJECTS` declaration.
 *
 * JSON, because a project carries structure — patterns and a resource
 * inventory — that a comma-separated string cannot express without
 * inventing a second syntax nobody can validate. A malformed declaration
 * is a startup failure rather than an empty registry, since silently
 * running with no projects would restore exactly the unattributed
 * behaviour this module replaces.
 */
export function parseProjects(raw: string | undefined): ProjectProfileInput[] {
  if (!raw || !raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new StromexError({
      code: 'CONFIG_INVALID',
      message: 'STROMEX_MCP_PROJECTS is not valid JSON.',
      remediation: 'Expected an array, e.g. [{"key":"aipc","name":"Albalagh International Premium College","protectedResources":["aipc-production*"]}]',
      cause,
    });
  }
  if (!Array.isArray(parsed)) {
    throw new StromexError({
      code: 'CONFIG_INVALID',
      message: 'STROMEX_MCP_PROJECTS must be a JSON array of project objects.',
      remediation: 'Even a single project is declared as a one-element array, so adding the second needs no change of shape.',
    });
  }
  return parsed as ProjectProfileInput[];
}
