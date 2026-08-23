// Run with: node --experimental-sqlite tests/admissions-availability.test.mjs
//
// THE INCIDENT THIS FILE EXISTS FOR.
//
// An applicant signed in successfully and the admissions wizard showed:
//
//   "Your application could not be loaded — You signed in, but the
//    application itself did not load — this is usually temporary.
//    Nothing you have already entered is lost.  [Try again]"
//
// It was not temporary. The deployment had no CLERK_JWKS_URL, so no
// session token could be verified; the adapter threw a bare Error;
// errorResponse() masked every 500 as "Something went wrong."; and the
// wizard mapped every failure to that one sentence. "Try again" could
// not have succeeded on any attempt, ever, and neither the applicant
// nor anyone reading their email could tell that.
//
// Three separate faults, each individually reasonable:
//
//   1. A configuration fault reported as an unexpected one.
//   2. An unexpected one masked, correctly — but the mask applied to
//      the configuration fault too.
//   3. A client that summarised instead of classifying.
//
// This file holds all three closed, and holds the diagnostic endpoint
// that makes the next one answerable in one request.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const { ConfigError, errorResponse } = await import(loadUrl('functions/_lib/db.js'));
const { onRequestGet: draftGet } = await import(loadUrl('functions/api/admissions/draft.js'));
const { onRequestGet: healthGet } = await import(loadUrl('functions/api/health/auth.js'));

const req = (headers = {}) => new Request('https://wec.test/api/admissions/draft', { headers });

// ---------------------------------------------------------------------
// 1 · A configuration fault is reported, not masked
// ---------------------------------------------------------------------
{
  const err = new ConfigError('CLERK_JWKS_URL is not configured.');
  check('ConfigError is a 503, not a 500', err.httpStatus === 503, err.httpStatus);

  const resp = errorResponse(err);
  const body = await resp.json();
  check('...and errorResponse reports it', resp.status === 503, resp.status);
  check('...naming what is missing', /CLERK_JWKS_URL/.test(body.message), body.message);
  check('...under a code the client can branch on', body.error === 'ConfigError', body.error);

  // The mask must still apply to everything unexpected. A ConfigError
  // message is written by us and names a binding; an unexpected error's
  // message can carry a query, a row value or a path.
  const leak = new Error('SELECT * FROM users WHERE email = \'someone@example.com\'');
  const masked = errorResponse(leak);
  const maskedBody = await masked.json();
  check('An unexpected error is still masked', masked.status === 500
    && maskedBody.message === 'Something went wrong.', maskedBody.message);
}

// ---------------------------------------------------------------------
// 2 · The draft endpoint, on a deployment that cannot verify a session
// ---------------------------------------------------------------------
{
  // No CLERK_JWKS_URL. This is the live deployment's exact state.
  const env = { DB: makeD1(schema) };
  const resp = await draftGet({ request: req({ authorization: 'Bearer ' + fakeJwt() }), env });
  const body = await resp.json();
  check('An unconfigured deployment answers 503, not 500', resp.status === 503, resp.status);
  check('...and says sign-in is not finished being set up',
    /not finished being set up|CLERK_JWKS_URL/.test(body.message), body.message);
  check('...so a client can tell it apart from a crash', body.error === 'ConfigError', body.error);
}

{
  // No D1 binding — the other blocking prerequisite.
  const env = { CLERK_JWKS_URL: 'https://x.clerk.accounts.dev/.well-known/jwks.json' };
  const resp = await draftGet({ request: req(), env });
  const body = await resp.json();
  check('A missing database binding is also a reported 503', resp.status === 503
    || resp.status === 401, `${resp.status} ${body.message}`);
}

{
  // No token at all is still a plain 401 — an unauthenticated request
  // is not a configuration fault and must not be reported as one.
  const env = { DB: makeD1(schema), CLERK_JWKS_URL: 'https://x.clerk.accounts.dev/.well-known/jwks.json' };
  const resp = await draftGet({ request: req(), env });
  check('A request with no token is a 401, not a 503', resp.status === 401, resp.status);
}

// ---------------------------------------------------------------------
// 3 · The diagnostic endpoint
// ---------------------------------------------------------------------
{
  const empty = await healthGet({ env: {} });
  const body = await empty.json();
  check('Health: an unconfigured deployment is not ready', body.ready === false);
  check('...and names both blocking prerequisites',
    body.blocking.includes('database') && body.blocking.includes('sessionVerification'),
    body.blocking.join(', '));
  check('...with a 503 so a monitor sees it without parsing', empty.status === 503, empty.status);

  const ready = await healthGet({ env: {
    DB: {}, CLERK_JWKS_URL: 'https://real.clerk.accounts.dev/.well-known/jwks.json',
    CLERK_WEBHOOK_SECRET: 'whsec_x', CLERK_AUTHORIZED_PARTIES: 'https://worldwencollege.co.uk',
  } });
  const readyBody = await ready.json();
  check('Health: a configured deployment is ready', readyBody.ready === true && ready.status === 200);
  check('...and shows the JWKS host so a wrong instance is visible',
    /real\.clerk\.accounts\.dev/.test(readyBody.checks.sessionVerification.detail),
    readyBody.checks.sessionVerification.detail);

  // The webhook is not blocking: requireUser() provisions from the
  // verified token when it carries an email claim. Treating it as
  // blocking would report a working deployment as broken.
  const noWebhook = await healthGet({ env: {
    DB: {}, CLERK_JWKS_URL: 'https://real.clerk.accounts.dev/.well-known/jwks.json' } });
  const nwBody = await noWebhook.json();
  check('Health: a missing webhook secret does not block', nwBody.ready === true,
    nwBody.blocking.join(', '));
  check('...but is reported', nwBody.checks.accountWebhook.ok === false);

  // It must never return a secret. Every value is a boolean or a
  // sentence we wrote.
  const secretish = await healthGet({ env: {
    DB: {}, CLERK_JWKS_URL: 'https://real.clerk.accounts.dev/.well-known/jwks.json',
    CLERK_WEBHOOK_SECRET: 'whsec_SUPERSECRETVALUE',
    CLERK_AUTHORIZED_PARTIES: 'https://worldwencollege.co.uk',
  } });
  const text = await secretish.text();
  check('Health never returns a secret value', !text.includes('SUPERSECRETVALUE'));
  check('...nor the full JWKS URL path', !text.includes('/.well-known/jwks.json'));
}

// ---------------------------------------------------------------------
// 4 · The client classifies rather than summarises
// ---------------------------------------------------------------------
// classify() is a pure function inside an IIFE, so it is extracted and
// evaluated rather than imported. Extracting by source is a real
// limitation and it is the reason the extraction itself is asserted
// below: if the function is renamed, this fails loudly instead of
// silently testing nothing.
{
  const src = readFileSync(`${ROOT}/js/admissions-wizard.js`, 'utf8');
  const start = src.indexOf('function classify(err) {');
  const end = src.indexOf('\n  function showLoadError(');
  check('classify() was found in the wizard source', start > 0 && end > start);
  const classify = new Function(src.slice(start, end) + '\nreturn classify;')();

  const offline = classify({ offline: true, status: 0 });
  check('Offline: says the device could not reach the College',
    /could not reach/i.test(offline.title) && offline.retry === true, offline.title);

  const expired = classify({ status: 401, message: 'Authentication required.' });
  check('401: says the session expired, not that the application is broken',
    /session has expired/i.test(expired.title), expired.title);
  check('...and offers sign-in rather than a retry',
    expired.signIn === true && expired.retry === false);

  const forbidden = classify({ status: 403 });
  check('403: says this account cannot open an application',
    /cannot open an application/i.test(forbidden.title), forbidden.title);

  const config = classify({ status: 503, code: 'ConfigError',
    message: 'Sign-in is not finished being set up on this deployment: CLERK_JWKS_URL is not configured.' });
  check('503 ConfigError: does NOT offer a retry that cannot work',
    config.retry === false, 'retry was offered');
  check('...and does not call it temporary',
    !/temporary/i.test(config.message), config.message);
  check('...and passes the deployment\'s own explanation through',
    /CLERK_JWKS_URL/.test(config.message), config.message);
  check('...and gives the applicant a reference to quote',
    typeof config.reference === 'string' && config.reference.length > 0);
  check('...and tells them what to do instead',
    /write to admissions/i.test(config.message), config.message);

  // The loop this closes: a verified session the College cannot make an
  // account for. As a plain 401 it read as "sign in again", which
  // produces the same token with the same missing claim, forever.
  const unprovisioned = classify({ status: 401, code: 'AccountProvisioningError',
    message: 'Your sign-in worked, but the College could not finish setting up your account.' });
  check('Unprovisioned account: is NOT reported as an expired session',
    !/expired/i.test(unprovisioned.title), unprovisioned.title);
  check('...and does not send the applicant round the sign-in loop',
    unprovisioned.signIn !== true && unprovisioned.retry === false);
  check('...and gives Admissions something to act on',
    /account provisioning/i.test(unprovisioned.reference || ''), unprovisioned.reference);

  const server = classify({ status: 500 });
  check('500: is the one case that IS usually temporary',
    server.retry === true && /temporary/i.test(server.message), server.message);

  // Every branch must produce a title, a message and a defined action.
  const cases = [undefined, { offline: true }, { status: 401 }, { status: 403 },
    { status: 401, code: 'AccountProvisioningError' },
    { status: 503, code: 'ConfigError' }, { status: 500 }, { status: 418 }];
  const bad = cases.filter((c) => {
    const r = classify(c);
    return !r || !r.title || !r.message || typeof r.retry !== 'boolean';
  });
  check('Every classified failure has a title, a message and an action',
    bad.length === 0, `${bad.length} incomplete`);

  // And no branch may claim the applicant signed in when the failure is
  // that they could not.
  check('No branch tells an offline applicant they signed in',
    !/signed in/i.test(classify({ offline: true }).message));
}

// ---------------------------------------------------------------------
// 4b · The endpoint actually produces that distinct code
// ---------------------------------------------------------------------
// The classifier branch above is worth nothing if requireUser() still
// raises a plain AuthError for this case — the client would never see
// the code it branches on.
{
  const { AccountProvisioningError } = await import(loadUrl('functions/_lib/auth/session.js'));
  const err = new AccountProvisioningError('no email claim');
  check('AccountProvisioningError is a 401 with its own name',
    err.httpStatus === 401 && err.name === 'AccountProvisioningError');
  const resp = errorResponse(err);
  const body = await resp.json();
  check('...and reaches the client under that name', body.error === 'AccountProvisioningError',
    body.error);

  const src = readFileSync(`${ROOT}/functions/_lib/auth/session.js`, 'utf8');
  check('requireUser raises it for a session with no email claim',
    /if \(!identity\.email\) \{[\s\S]{0,120}AccountProvisioningError/.test(src));
  check('...and says signing in again will not help',
    /signing in again will \+?\s*'?\s*\+?\s*'?not change/.test(src.replace(/\s+/g, ' '))
      || /signing in again will not change/.test(src.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ')),
    'the message no longer rules out the sign-in loop');
}

// ---------------------------------------------------------------------
// 5 · The page has a state for "could not reach sign-in at all"
// ---------------------------------------------------------------------
// This was the actual mis-wiring behind the screenshot's wording: the
// handler for "Clerk's SDK never loaded" revealed the panel that opens
// "You signed in, but...". The applicant had not signed in.
for (const page of ['admissions/apply/index.html', 'ar/admissions/apply/index.html']) {
  const html = readFileSync(`${ROOT}/${page}`, 'utf8');
  check(`${page} has a distinct auth-unreachable state`,
    /data-wizard-auth-unreachable/.test(html));
  check(`${page} has a fillable error title and message`,
    /data-wizard-error-title/.test(html) && /data-wizard-error-message/.test(html));
  check(`${page} has a sign-in-again action`, /data-wizard-signin/.test(html));
  check(`${page} has a reference line for Admissions`, /data-wizard-error-ref/.test(html));
}
{
  const js = readFileSync(`${ROOT}/js/admissions-wizard.js`, 'utf8');
  const handler = js.slice(js.indexOf('onAuthUnavailable:'), js.indexOf('onAuthUnavailable:') + 700);
  check('onAuthUnavailable no longer reveals the "you signed in" panel',
    /authUnreachableShell/.test(handler) && !/loadErrorShell\.hidden = false/.test(handler));
}

// ---------------------------------------------------------------------
// 6 · A stale token is retried exactly once
// ---------------------------------------------------------------------
{
  const js = readFileSync(`${ROOT}/js/admissions-wizard.js`, 'utf8');
  const start = js.indexOf('function api(path, opts, retryOn401)');
  const body = js.slice(start, js.indexOf('\n  }', start));
  check('api() retries a 401', /err\.status !== 401/.test(body) && /requestOnce/.test(body));
  check('...exactly once, not in a loop',
    (body.match(/requestOnce/g) || []).length === 2, 'more than one retry path');
}

// ---------------------------------------------------------------------
// 7 · The operator can find out what to set
// ---------------------------------------------------------------------
// The fix is only finished when somebody who has never read this code
// can act on it. The four settings below are the ones that were
// actually missing, and a document that names three of them is a
// document that leaves the deployment broken.
{
  const doc = readFileSync(`${ROOT}/docs/fixing-sign-in.md`, 'utf8');
  for (const setting of ['CLERK_JWKS_URL', 'CLERK_WEBHOOK_SECRET',
    'CLERK_AUTHORIZED_PARTIES', 'CLERK_PUBLISHABLE_KEY']) {
    check(`docs/fixing-sign-in.md names ${setting}`, doc.includes(setting));
  }
  check('...and the D1 binding', /D1 database bindings|binding `DB`|D1 binding/.test(doc));
  check('...and the email claim Clerk does not send by default',
    /primary_email_address/.test(doc));
  check('...and leads with the one-request check',
    doc.indexOf('/api/health/auth') < doc.indexOf('## What went wrong'));
  check('...and says a variable applies only to NEW deployments',
    /redeploy/i.test(doc));
}

// And the deploy itself asks the question on every run, so the next
// misconfiguration is visible before an applicant finds it.
{
  const wf = readFileSync(`${ROOT}/.github/workflows/deploy-cloudflare.yml`, 'utf8');
  check('The deploy probes /api/health/auth', /api\/health\/auth/.test(wf));
  check('...and warns loudly when the deployment cannot authenticate',
    /CANNOT SIGN ANYBODY IN/.test(wf));
  check('...without failing a build over settings held in Cloudflare',
    !/health\/auth[\s\S]{0,400}exit 1/.test(wf));
}

function fakeJwt() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'RS256', kid: 'k1' })}.${b64({ sub: 'user_1', exp: 99999999999 })}.sig`;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
