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
import { resolveJwksUrl, frontendApiFromPublishableKey } from '../../_lib/auth/clerk-adapter.js';

// The exact URL js/clerk-loader.js asks the browser to fetch. Kept in
// one place and pinned by a test, because a health check that probes a
// DIFFERENT url than the browser uses proves nothing about the browser.
export const CLERK_BROWSER_SDK_PATH = '/npm/@clerk/clerk-js@5/dist/clerk.browser.js';

// Five seconds is long enough for a working endpoint and short enough
// that a dead one answers the operator rather than hanging on them.
const PROBE_TIMEOUT_MS = 5000;

// DOES THE HOSTNAME EXIST IN DNS AT ALL?
//
// This exists because of a wrong answer given confidently.
//
// The probe found HTTP 530 and this file explained it as Cloudflare's
// "Origin DNS error" (1016) caused by a CNAME left PROXIED where Clerk
// requires DNS only. That is *a* cause of 530. It was not this one.
// clerk.worldwencollege.co.uk had no DNS record whatsoever, and a
// Worker fetching a hostname inside a Cloudflare zone that holds no
// record for it is answered 530 by the edge — indistinguishable, at the
// HTTP layer, from the proxied case. The operator was sent to look for
// an orange cloud on a record that did not exist.
//
// A status code cannot tell those apart, so this stops trying to and
// asks DNS directly. Cloudflare's public resolver answers over HTTPS,
// which is the one kind of outbound call a Worker can always make.
//
//   NXDOMAIN  -> the record was never added. A different fault with a
//                different fix, and no amount of looking at proxy
//                settings will ever find it.
//   an answer -> the record exists; say what it points at, and only
//                then is the proxy setting worth suspecting.
//
// Best-effort throughout. A resolver that does not answer must not
// downgrade the diagnosis into a guess, so it returns null and the
// caller says less rather than more.
const DOH = 'https://cloudflare-dns.com/dns-query';

async function resolves(host) {
  try {
    const resp = await fetch(`${DOH}?name=${encodeURIComponent(host)}&type=A`, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    if (!resp.ok) return null;
    const body = await resp.json();
    // dns-json: Status 3 is NXDOMAIN. An empty Answer under NOERROR
    // means the name exists but carries no address record, which for
    // this purpose is the same as nothing being there.
    if (body.Status === 3) return { exists: false, points: null };
    const answers = Array.isArray(body.Answer) ? body.Answer : [];
    if (!answers.length) return { exists: false, points: null };
    // Type 5 is CNAME, and for a Clerk record that is the interesting
    // half: what the College's hostname was pointed at.
    const cname = answers.find((a) => a.type === 5);
    return { exists: true, points: cname ? String(cname.data).replace(/\.$/, '') : null };
  } catch {
    return null;
  }
}

// What a status code from the Clerk host means — given what DNS said,
// because on its own it does not mean enough.
function explainStatus(status, host, dns) {
  if (dns && dns.exists === false) {
    return `Nothing in DNS answers for ${host}: the hostname has no record at all. `
      + 'The records Clerk asks for have not been added, so the Frontend API for this '
      + 'production instance has nowhere to live. Clerk dashboard > Domains lists the exact '
      + 'records for this instance \u2014 add each one in Cloudflare > DNS > Records with proxy '
      + 'status DNS only (grey cloud), then verify in Clerk. Nothing in this deployment, and '
      + 'neither key, is at fault.';
  }
  if (status === 530) {
    let where = 'HTTP 530 is Cloudflare\u2019s "Origin DNS error" (1016): Cloudflare is answering '
      + `for ${host} and cannot resolve what sits behind it. `;
    if (dns && dns.exists && dns.points) {
      where += `The hostname does resolve, by CNAME to ${dns.points}. `;
    }
    return where
      + 'On a Clerk custom domain this has two causes needing different fixes: the record was '
      + 'never added, or it was added PROXIED (orange cloud) where Clerk requires DNS only '
      + '(grey cloud). Compare what Clerk dashboard > Domains lists against Cloudflare > DNS > '
      + 'Records. The publishable key is not the problem.';
  }
  if (status === 404) {
    return 'The host is serving, but not this path. Check that the publishable key belongs '
      + 'to the instance you intend to use.';
  }
  if (status >= 500) {
    return 'The instance is reachable but erroring. If this persists, check Clerk\u2019s status page.';
  }
  return 'The instance exists but is not serving this deployment. Check that the publishable '
    + 'key belongs to the instance you intend to use.';
}

async function probe(url, headers) {
  try {
    const resp = await fetch(url, {
      headers: headers || {},
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return { status: resp.status, resp };
  } catch (cause) {
    // The host, the DNS failure and the timeout are all public facts
    // about a public endpoint. None of them is a secret, and the
    // operator cannot fix what the check will not name.
    return { status: 0, error: String((cause && cause.message) || cause) };
  }
}

function jwksHost(url) {
  if (!url) return null;
  try { return new URL(url).host; } catch { return 'unparseable'; }
}

export async function onRequestGet({ env }) {
  // MEASURE, DO NOT ASSERT.
  //
  // Every check below this endpoint's first version was a check on the
  // CONTENTS OF THE ENVIRONMENT: is the variable set, do the prefixes
  // agree, can a URL be built from the key. All of that can be true of
  // a deployment on which nobody can sign in, because none of it ever
  // contacted Clerk.
  //
  // That gap matters most on exactly the configuration this site now
  // runs. A Clerk PRODUCTION instance serves its Frontend API from a
  // domain of the College's own — clerk.worldwencollege.co.uk — and
  // that domain only answers once the DNS records Clerk asks for have
  // been added and verified. Until they are, the publishable key is
  // valid, the derived URL is correct, the key prefixes match, and:
  //
  //   * the browser's <script> for clerk.browser.js never loads, so
  //     there is no sign-in form at all; and
  //   * the Functions cannot fetch the JWKS, so any token that did
  //     exist could not be verified.
  //
  // "Everything is configured and nothing works" is the failure this
  // endpoint was built to end, so it now asks the provider directly.
  const jwks = resolveJwksUrl(env);
  const fapi = frontendApiFromPublishableKey(env.CLERK_PUBLISHABLE_KEY);
  const sdkUrl = fapi ? `https://${fapi}${CLERK_BROWSER_SDK_PATH}` : null;

  const [jwksProbe, sdkProbe, dns] = await Promise.all([
    jwks.url ? probe(jwks.url) : Promise.resolve(null),
    // Range-limited: this asks whether the file is SERVED, not for the
    // half-megabyte of it. A HEAD would risk a 405 from a CDN that
    // serves the GET perfectly well, which would report a working
    // deployment as broken.
    sdkUrl ? probe(sdkUrl, { Range: 'bytes=0-0' }) : Promise.resolve(null),
    fapi ? resolves(fapi) : Promise.resolve(null),
  ]);

  // A JWKS that answers 200 with no signing keys in it verifies nothing.
  let jwksKeyCount = null;
  if (jwksProbe && jwksProbe.resp && jwksProbe.resp.ok) {
    try {
      const body = await jwksProbe.resp.json();
      jwksKeyCount = Array.isArray(body && body.keys) ? body.keys.length : 0;
    } catch {
      jwksKeyCount = 0;
    }
  }

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
    // Does the Clerk instance this deployment names actually answer?
    //
    // Blocking, and deliberately so. If the JWKS endpoint cannot be
    // reached, no session token can be verified, and every signed-in
    // request fails — which is indistinguishable, to the applicant,
    // from the outage that started all of this. A health check that
    // reports "ready" through that is worse than no health check,
    // because it sends the operator to look somewhere else.
    providerReachable: (() => {
      if (!jwks.url) {
        return {
          ok: true,
          detail: 'No Clerk instance is configured, so there was nothing to reach. '
            + 'sessionVerification above is the check that matters.',
          blocking: false,
        };
      }
      const host = jwksHost(jwks.url);
      if (!jwksProbe || jwksProbe.status === 0) {
        return {
          ok: false,
          detail: `${host} could not be reached at all (${(jwksProbe && jwksProbe.error) || 'no response'}). `
            + (dns && dns.exists === false
              ? 'It has no DNS record at all: the records Clerk asks for have not been added. '
                + 'Clerk dashboard > Domains lists them; each goes into Cloudflare > DNS > '
                + 'Records as DNS only (grey cloud).'
              : 'If this is a Clerk PRODUCTION instance, the usual cause is that the DNS '
                + 'records Clerk asks for have not been added or have not finished verifying '
                + 'yet: the key is right, the URL is right, and the domain is not serving. '
                + 'Clerk dashboard > Domains shows which records are still outstanding.'),
          host,
        };
      }
      if (jwksProbe.status !== 200) {
        return {
          ok: false,
          detail: `${host} answered HTTP ${jwksProbe.status} instead of 200 for its signing keys. `
            + explainStatus(jwksProbe.status, host, dns),
          host,
          status: jwksProbe.status,
        };
      }
      if (!jwksKeyCount) {
        return {
          ok: false,
          detail: `${host} answered, but published no signing keys. No session token can be verified.`,
          host,
        };
      }
      return {
        ok: true,
        detail: `${host} answered with ${jwksKeyCount} signing key${jwksKeyCount === 1 ? '' : 's'}. `
          + 'Session tokens from it can be verified.',
        host,
        status: 200,
      };
    })(),
    // Can a visitor's BROWSER load Clerk at all?
    //
    // This is the half of sign-in that no server-side check touches.
    // js/clerk-loader.js loads clerk.browser.js from the same Frontend
    // API host; if that request fails there is no sign-in form on the
    // page, and the site's own symptom is not "sign-in refused" but
    // "nothing happens" — which reads to everybody involved as the
    // site being broken rather than the auth domain being unfinished.
    //
    // The exact URL the browser will request, not an approximation.
    browserSignIn: (() => {
      if (!sdkUrl) {
        return {
          ok: true,
          detail: 'No publishable key is configured, so no sign-in form is expected.',
          blocking: false,
        };
      }
      if (!sdkProbe || sdkProbe.status === 0) {
        return {
          ok: false,
          detail: `The browser would load Clerk from ${fapi}, and that host could not be reached `
            + `(${(sdkProbe && sdkProbe.error) || 'no response'}). No sign-in form can appear on any `
            + 'page: the visitor sees a page that does nothing rather than a sign-in that fails. '
            + 'Same cause and same fix as providerReachable above.',
          url: sdkUrl,
        };
      }
      if (sdkProbe.status !== 200 && sdkProbe.status !== 206) {
        return {
          ok: false,
          detail: `The browser would load Clerk from ${fapi}, and that request answers HTTP `
            + `${sdkProbe.status}. No sign-in form can appear on any page. `
            + explainStatus(sdkProbe.status, fapi, dns),
          url: sdkUrl,
          status: sdkProbe.status,
        };
      }
      return {
        ok: true,
        detail: `A browser can load Clerk from ${fapi}, so the sign-in form can appear.`,
        url: sdkUrl,
        status: sdkProbe.status,
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
    // Whether the configured keys belong to the SAME Clerk instance.
    //
    // This check exists because the very first deploy that reported the
    // instance found a mismatch waiting to happen: the site is wired to
    // a Clerk PRODUCTION instance (clerk.worldwencollege.co.uk) while
    // the operator was reading the DEVELOPMENT environment in Clerk's
    // dashboard, where the keys are sk_test_/pk_test_.
    //
    // A test secret against a live publishable key fails exactly like
    // the outage this endpoint was built for: sign-in succeeds and
    // every request after it is refused. The difference is invisible
    // unless something compares them, so something does.
    //
    // Only the PREFIX is read — sk_test_ versus sk_live_ is a category,
    // not a value, and no part of a key is ever returned.
    keyEnvironmentMatch: (() => {
      const { url } = resolveJwksUrl(env);
      if (!url) return { ok: true, detail: 'No instance resolved yet; nothing to compare.', blocking: false };
      const host = jwksHost(url);
      const instance = /\.clerk\.accounts\.dev$/.test(host || '') ? 'development' : 'production';
      const envOf = (key) => {
        if (typeof key !== 'string') return null;
        if (/^(pk|sk)_test_/.test(key)) return 'development';
        if (/^(pk|sk)_live_/.test(key)) return 'production';
        return null;
      };
      const pk = envOf(env.CLERK_PUBLISHABLE_KEY);
      const sk = envOf(env.CLERK_SECRET_KEY);
      const wrong = [];
      if (pk && pk !== instance) wrong.push(`CLERK_PUBLISHABLE_KEY is a ${pk} key`);
      if (sk && sk !== instance) wrong.push(`CLERK_SECRET_KEY is a ${sk} key`);
      return {
        ok: wrong.length === 0,
        detail: wrong.length === 0
          ? `This is a Clerk ${instance} instance (${host}), and every key configured for it `
            + `is a ${instance} key.`
          : `This is a Clerk ${instance} instance (${host}), but ${wrong.join(' and ')}. `
            + `Sign-in will appear to succeed and every request after it will be refused. `
            + `Copy the ${instance === 'production' ? 'sk_live_/pk_live_' : 'sk_test_/pk_test_'} `
            + `keys from the ${instance} environment in the Clerk dashboard.`,
        instance,
        blocking: false,
      };
    })(),
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
    // The wording distinguishes the two failures, because the fix is
    // different and the operator will act on this sentence. Something
    // MISSING is fixed by setting it here; something UNREACHABLE is
    // fixed at the provider, and telling an operator to "configure"
    // a check that is already configured sends them to the wrong
    // dashboard for the rest of the afternoon.
    summary: blocking.length === 0
      ? 'This deployment can verify a session, reach its authentication provider, and read the record.'
      : (blocking.every((n) => n === 'providerReachable' || n === 'browserSignIn')
        ? `Sign-in cannot work on this deployment. Everything is configured, but the Clerk `
          + `instance it names is not answering (${blocking.join(', ')}). The fix is at the `
          + `provider, not here.`
        : `Sign-in cannot work on this deployment until these are configured: ${blocking.join(', ')}.`),
    checks,
  }, { status: blocking.length === 0 ? 200 : 503 });
}
