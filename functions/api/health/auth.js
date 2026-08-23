// GET /api/health/auth
//
// WHY THIS EXISTS.
//
// An applicant signed in successfully and the admissions wizard said
// "Your application could not be loaded — this is usually temporary."
// It was not temporary, and nothing in the system could say what it
// actually was. The endpoint answered a masked 500; the wizard mapped
// every failure to one sentence; and diagnosing it required reading the
// source with a screenshot in the other hand.
//
// This endpoint answers the question directly: which of the things this
// deployment needs in order to authenticate anybody are actually
// present, right now, on this deployment.
//
// WHAT IT DELIBERATELY DOES NOT DO.
//
// It never returns a secret, a key, a token, or any value from the
// environment. Every field is a boolean or a fixed string. The one
// piece of environment-derived text is the JWKS *host*, which is public
// by construction — it is derivable from the Clerk publishable key that
// ships in the source of every page on the site — and it is the single
// most useful thing an operator can see, because "configured, but
// pointing at the wrong instance" and "not configured" are different
// problems with the same symptom.
//
// It is unauthenticated, and it has to be: the failure it diagnoses is
// precisely the failure to authenticate. An endpoint you can only reach
// once auth works cannot tell you why auth does not work.

import { jsonResponse } from '../../_lib/db.js';
import { resolveJwksUrl } from '../../_lib/auth/clerk-adapter.js';

function jwksHost(url) {
  if (!url) return null;
  try { return new URL(url).host; } catch { return 'unparseable'; }
}

export async function onRequestGet({ env }) {
  const checks = {
    // The record. Without it every endpoint 503s regardless of auth.
    database: {
      ok: !!env.DB,
      detail: env.DB ? 'D1 binding "DB" is present.' : 'D1 binding "DB" is not configured.',
    },
    // Session verification. Without it every authenticated request
    // fails, and the failure is permanent rather than transient.
    //
    // Reported with its SOURCE, because "configured" and "derived from
    // the publishable key" are both fine and an operator debugging a
    // wrong instance needs to know which one is in force.
    sessionVerification: (() => {
      const { url, source } = resolveJwksUrl(env);
      return {
        ok: !!url,
        detail: url
          ? `Session tokens are verified against ${jwksHost(url)}, resolved from ${source}.`
          : 'Neither CLERK_PUBLISHABLE_KEY nor CLERK_JWKS_URL is set for the Functions. '
            + 'No session token can be verified, so every signed-in page fails after '
            + 'sign-in succeeds. Setting the publishable key alone is enough.',
        source,
      };
    })(),
    // Account reconciliation. Its absence degrades rather than blocks:
    // requireUser() provisions from the verified token when the session
    // carries an email claim.
    accountWebhook: {
      ok: !!env.CLERK_WEBHOOK_SECRET,
      detail: env.CLERK_WEBHOOK_SECRET
        ? 'CLERK_WEBHOOK_SECRET is set.'
        : 'CLERK_WEBHOOK_SECRET is not set. Accounts are still provisioned from the '
          + 'verified session token when it carries an email claim, but Clerk profile '
          + 'changes will not reconcile.',
      blocking: false,
    },
    // Whether a first-time learner can be given an account.
    //
    // Clerk's DEFAULT session token carries no email claim, and
    // users.email is NOT NULL because an address must never be
    // invented. There are three routes to one, and this reports which
    // are open. Not blocking: with the claim configured, or a webhook
    // that has already arrived, provisioning works without the key.
    accountProvisioning: {
      ok: !!env.CLERK_SECRET_KEY,
      detail: env.CLERK_SECRET_KEY
        ? 'CLERK_SECRET_KEY is set, so a first-time learner is provisioned from the '
          + 'provider directly. No session-token customisation is required.'
        : 'CLERK_SECRET_KEY is not set. A first-time learner can still be provisioned if '
          + 'the session token carries an email claim (Clerk > Sessions > Customize '
          + 'session token) or the sign-in webhook has already delivered them. With none '
          + 'of the three, sign-in succeeds and the learner has no account.',
      blocking: false,
    },
    // Optional hardening. Absence is a choice, not a fault.
    authorizedParties: {
      ok: true,
      detail: env.CLERK_AUTHORIZED_PARTIES
        ? 'CLERK_AUTHORIZED_PARTIES is set; tokens from other Clerk applications are rejected.'
        : 'CLERK_AUTHORIZED_PARTIES is not set; any token signed by the configured '
          + 'instance is accepted. Optional, and worth setting.',
      blocking: false,
    },
  };

  // Can this deployment actually sign somebody in and serve them?
  const blocking = Object.entries(checks)
    .filter(([, c]) => c.blocking !== false && !c.ok)
    .map(([name]) => name);

  return jsonResponse({
    service: 'authentication',
    ready: blocking.length === 0,
    blocking,
    summary: blocking.length === 0
      ? 'This deployment can verify a session and read the record.'
      : `Sign-in cannot work on this deployment until these are configured: ${blocking.join(', ')}.`,
    checks,
  }, { status: blocking.length === 0 ? 200 : 503 });
}
