/**
 * The authority model.
 *
 * Every tool declares one of three classes, and the class — not the
 * tool's own code — decides whether a call proceeds:
 *
 *   read       Observation only. Always permitted.
 *   write      Creates or changes a resource, reversibly. Permitted
 *              autonomously: this is the delegated authority the server
 *              exists to exercise.
 *   protected  Permanently destroys or removes something. Never permitted
 *              autonomously.
 *
 * Two further rules sit above the classes:
 *
 *   * A **protected resource** can never be destroyed by this server at
 *     all, with or without approval. Institutional records — transcripts,
 *     certificates, student records, the audit log itself — are treated as
 *     permanent assets, so the tool that would delete them does not have a
 *     path that ends in success. Archiving, revoking and superseding are
 *     `write` operations and remain available.
 *
 *   * A **purchase** is gated separately from destruction, by an explicit
 *     spending policy that is off until an operator turns it on.
 *
 * What this module cannot do is authenticate a human. See
 * `approval.ts` and docs/security.md § 3 for the three layers that stand
 * in for that, and for a plain statement of what each one does and does
 * not defend against.
 */

import { StromexError } from './errors.js';

export type OperationClass = 'read' | 'write' | 'protected';

export type ProtectedOperationMode =
  /** Refuse every protected operation outright. The safest posture. */
  | 'deny'
  /** Require an approval grant. The default. */
  | 'approval'
  /**
   * Execute protected operations without approval. Requires an explicit
   * opt-in and is logged at warn level on every single call, because a
   * server in this mode can permanently destroy data unattended.
   */
  | 'allow';

export interface SpendingPolicy {
  /** Off until an operator turns it on. */
  enabled: boolean;
  currency: string;
  /** Any single purchase above this needs approval even when enabled. */
  maxSinglePurchase: number;
  /** Total the server may spend in a rolling 30 days. */
  monthlyCap: number;
}

export const DEFAULT_SPENDING_POLICY: SpendingPolicy = {
  enabled: false,
  currency: 'USD',
  maxSinglePurchase: 0,
  monthlyCap: 0,
};

/**
 * Resources this server will not destroy under any authority.
 *
 * The defaults name the institutional assets of the estate this server
 * was built for, plus its own audit trail. They are glob patterns matched
 * case-insensitively against the resource identifier a tool declares.
 * Operators are expected to extend this list, never to shrink it without
 * a recorded decision — see docs/security.md § 5.
 */
export const DEFAULT_PROTECTED_RESOURCES: readonly string[] = [
  // This server's own evidence.
  '*audit*',
  '*stromex-audit*',
  // Institutional records treated as permanent under the safety principle.
  '*transcript*',
  '*certificate*',
  '*registrar*',
  '*student-record*',
  '*student_records*',
  '*enrolment*',
  '*enrollment*',
  '*academic-history*',
  // The estate's production stores.
  'aipc',
  'aipc-*',
  '*-production',
  'prod',
  'production',
];

export interface PolicyConfig {
  protectedOperations: ProtectedOperationMode;
  /** Globally refuse every `write` and `protected` tool. */
  readOnly: boolean;
  protectedResources: readonly string[];
  spending: SpendingPolicy;
  /** When set, only these providers may be called at all. */
  allowedProviders?: readonly string[];
}

export const DEFAULT_POLICY: PolicyConfig = {
  protectedOperations: 'approval',
  readOnly: false,
  protectedResources: DEFAULT_PROTECTED_RESOURCES,
  spending: DEFAULT_SPENDING_POLICY,
};

export interface PolicyRequest {
  tool: string;
  provider: string;
  operationClass: OperationClass;
  /** The thing being acted on: a bucket name, a repo, a database, a domain. */
  resource?: string;
  /** Set by tools that spend money. */
  purchase?: { amount: number; currency: string; description: string };
  /** True when the caller asked for a dry run; dry runs never mutate. */
  dryRun?: boolean;
  /** An approval grant the caller has already obtained. */
  approvalId?: string;
}

export type PolicyDecision =
  | { decision: 'allow'; reason: string }
  | { decision: 'approval_required'; reason: string; requiresBackup: boolean }
  | { decision: 'deny'; reason: string; code: StromexError['code'] };

export class PolicyEngine {
  readonly config: PolicyConfig;

  constructor(config: Partial<PolicyConfig> = {}) {
    this.config = {
      ...DEFAULT_POLICY,
      ...config,
      spending: { ...DEFAULT_SPENDING_POLICY, ...(config.spending ?? {}) },
      protectedResources: config.protectedResources ?? DEFAULT_PROTECTED_RESOURCES,
    };
  }

  evaluate(request: PolicyRequest): PolicyDecision {
    if (this.config.allowedProviders && !this.config.allowedProviders.includes(request.provider)) {
      return {
        decision: 'deny',
        code: 'POLICY_FORBIDDEN',
        reason: `The ${request.provider} provider is not in the allowed provider list for this server instance.`,
      };
    }

    if (request.operationClass === 'read') {
      return { decision: 'allow', reason: 'Read operations are always permitted.' };
    }

    if (this.config.readOnly) {
      return {
        decision: 'deny',
        code: 'POLICY_FORBIDDEN',
        reason: 'This server instance is running in read-only mode; no mutating operation is permitted.',
      };
    }

    // A dry run is evaluated as a read: it constructs the request and
    // returns it without sending it. Requiring approval for a dry run
    // would train operators to approve things reflexively.
    if (request.dryRun) {
      return { decision: 'allow', reason: 'Dry run: the request is constructed and returned, never sent.' };
    }

    if (request.purchase) {
      const spendDecision = this.evaluatePurchase(request.purchase);
      if (spendDecision) return spendDecision;
    }

    if (request.operationClass === 'write') {
      return { decision: 'allow', reason: 'Reversible write operations are within delegated authority.' };
    }

    // Protected from here down.
    const matched = this.matchProtectedResource(request.resource);
    if (matched) {
      return {
        decision: 'deny',
        code: 'POLICY_PROTECTED_RESOURCE',
        reason:
          `${request.resource} matches the protected-resource pattern ${JSON.stringify(matched)}. ` +
          'This server does not destroy institutional records under any authority. ' +
          'Archive, revoke, supersede or deactivate instead — those remain available as ordinary write operations.',
      };
    }

    if (this.config.protectedOperations === 'deny') {
      return {
        decision: 'deny',
        code: 'POLICY_FORBIDDEN',
        reason: 'Protected operations are disabled on this server instance (protectedOperations=deny).',
      };
    }

    if (this.config.protectedOperations === 'allow') {
      return {
        decision: 'allow',
        reason: 'Protected operations are unattended on this instance (protectedOperations=allow). This is an explicitly configured, audited exception.',
      };
    }

    return {
      decision: 'approval_required',
      requiresBackup: true,
      reason: `${request.tool} permanently destroys or removes ${request.resource ?? 'a resource'}, so it requires an explicit approval grant.`,
    };
  }

  /** Returns the pattern that matched, or undefined. */
  matchProtectedResource(resource: string | undefined): string | undefined {
    if (!resource) return undefined;
    const subject = resource.toLowerCase();
    for (const pattern of this.config.protectedResources) {
      if (globMatch(pattern.toLowerCase(), subject)) return pattern;
    }
    return undefined;
  }

  private evaluatePurchase(purchase: NonNullable<PolicyRequest['purchase']>): PolicyDecision | undefined {
    const spending = this.config.spending;
    if (!spending.enabled) {
      return {
        decision: 'deny',
        code: 'POLICY_SPEND_LIMIT',
        reason:
          'Automatic purchasing is disabled. Nothing that costs money is bought without an operator turning on the spending policy first ' +
          '(STROMEX_SPEND_ENABLED=true with a maximum), which is a deliberate one-time decision.',
      };
    }
    if (purchase.currency.toUpperCase() !== spending.currency.toUpperCase()) {
      return {
        decision: 'deny',
        code: 'POLICY_SPEND_LIMIT',
        reason: `The purchase is priced in ${purchase.currency} but the spending policy is denominated in ${spending.currency}. This server does not convert currencies to decide whether a limit is met.`,
      };
    }
    if (purchase.amount > spending.maxSinglePurchase) {
      return {
        decision: 'approval_required',
        requiresBackup: false,
        reason: `${purchase.description} costs ${purchase.amount} ${purchase.currency}, above the ${spending.maxSinglePurchase} ${spending.currency} single-purchase limit.`,
      };
    }
    return undefined;
  }
}

/**
 * A deliberately small glob: `*` matches any run of characters, `?`
 * matches one. No `**`, no brace expansion, no character classes — a
 * pattern language nobody can misread is worth more here than an
 * expressive one, because a mistake in this list is a deleted transcript.
 */
export function globMatch(pattern: string, subject: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const expression = '^' + escaped.replaceAll('*', '.*').replaceAll('?', '.') + '$';
  return new RegExp(expression).test(subject);
}
