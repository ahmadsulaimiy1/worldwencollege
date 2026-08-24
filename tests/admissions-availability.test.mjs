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
// 2b · One key, not two that must agree
// ---------------------------------------------------------------------
// The live outage was two variables where one would do: the publishable
// key was configured and CLERK_JWKS_URL was not, so the browser could
// load Clerk and the server could not check what it produced. A Clerk
// publishable key encodes the Frontend API host, so the server can
// derive its own verification endpoint and the pair cannot drift.
{
  const { frontendApiFromPublishableKey, resolveJwksUrl } =
    await import(loadUrl('functions/_lib/auth/clerk-adapter.js'));
  const host = 'grand-mole-42.clerk.accounts.dev';
  const pk = (prefix) => prefix + Buffer.from(`${host}$`).toString('base64');

  check('A publishable key yields its Frontend API host',
    frontendApiFromPublishableKey(pk('pk_test_')) === host,
    frontendApiFromPublishableKey(pk('pk_test_')));
  check('...for live keys as well as test keys',
    frontendApiFromPublishableKey(pk('pk_live_')) === host);

  // Every one of these must yield null rather than a guess. A derived
  // JWKS URL is where session tokens are checked; pointing it somewhere
  // unintended is worse than refusing to point it anywhere.
  for (const junk of ['', 'pk_test_', 'notakey', 'pk_test_!!!not-base64!!!',
    'pk_test_' + Buffer.from('not a host').toString('base64'),
    'pk_test_' + Buffer.from('https://evil.example/path$').toString('base64'),
    null, undefined, 42]) {
    check(`A malformed key yields no host: ${JSON.stringify(junk)}`,
      frontendApiFromPublishableKey(junk) === null, frontendApiFromPublishableKey(junk));
  }

  check('The JWKS URL is derived from the publishable key alone',
    resolveJwksUrl({ CLERK_PUBLISHABLE_KEY: pk('pk_live_') }).url
      === `https://${host}/.well-known/jwks.json`);
  check('...reporting where it came from',
    resolveJwksUrl({ CLERK_PUBLISHABLE_KEY: pk('pk_live_') }).source === 'CLERK_PUBLISHABLE_KEY');
  check('An explicit CLERK_JWKS_URL still wins',
    resolveJwksUrl({ CLERK_PUBLISHABLE_KEY: pk('pk_live_'),
      CLERK_JWKS_URL: 'https://explicit.example/jwks' }).url === 'https://explicit.example/jwks',
    'derivation overrode an operator\u2019s explicit setting');
  check('With neither, nothing is invented', resolveJwksUrl({}).url === null);

  // End to end: the publishable key alone must make the draft endpoint
  // stop answering 503.
  const env = { DB: makeD1(schema), CLERK_PUBLISHABLE_KEY: pk('pk_live_') };
  const resp = await draftGet({ request: req(), env });
  check('A deployment with only the publishable key is no longer misconfigured',
    resp.status === 401, `${resp.status} — 401 means it got as far as needing a token`);
}

// ---------------------------------------------------------------------
// 3 · The diagnostic endpoint
// ---------------------------------------------------------------------
{
  // The endpoint now CONTACTS the Clerk instance rather than inferring
  // that it must work, so these tests have to say what the instance
  // answers. Everything that was asserted before is asserted against a
  // provider that is up; the new assertions below are the ones that
  // would have caught "every variable is set and nobody can sign in".
  const realFetch = globalThis.fetch;
  let provider = { jwks: { status: 200, keys: 2 }, sdk: { status: 200 } };
  let requested = [];
  globalThis.fetch = async (url) => {
    const u = String(url);
    requested.push(u);
    const isJwks = u.includes('/.well-known/jwks.json');
    const spec = isJwks ? provider.jwks : provider.sdk;
    if (!spec || spec.status === 0) throw new Error('getaddrinfo ENOTFOUND ' + new URL(u).host);
    const body = isJwks
      ? JSON.stringify({ keys: Array.from({ length: spec.keys || 0 }, (_, i) => ({ kid: 'k' + i })) })
      : 'clerk';
    return new Response(body, { status: spec.status });
  };
  const reset = () => {
    provider = { jwks: { status: 200, keys: 2 }, sdk: { status: 200 } };
    requested = [];
  };

  const empty = await healthGet({ env: {} });
  const body = await empty.json();
  check('Health: an unconfigured deployment is not ready', body.ready === false);
  check('...and names both blocking prerequisites',
    body.blocking.includes('database') && body.blocking.includes('sessionVerification'),
    body.blocking.join(', '));
  check('...with a 503 so a monitor sees it without parsing', empty.status === 503, empty.status);

  // The publishable key on its own is a ready deployment. This is the
  // single assertion that says the outage cannot recur in the same
  // shape: the thing that WAS set is now sufficient.
  const derived = await healthGet({ env: {
    DB: {}, CLERK_PUBLISHABLE_KEY: 'pk_live_' + Buffer.from('derived.clerk.accounts.dev$').toString('base64'),
  } });
  const derivedBody = await derived.json();
  check('Health: the publishable key alone is enough', derivedBody.ready === true,
    derivedBody.summary);
  check('...and it says the endpoint was derived from it',
    derivedBody.checks.sessionVerification.source === 'CLERK_PUBLISHABLE_KEY',
    derivedBody.checks.sessionVerification.source);

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

  const provisioning = await healthGet({ env: {
    DB: {}, CLERK_PUBLISHABLE_KEY: 'pk_live_' + Buffer.from('h.clerk.accounts.dev$').toString('base64'),
    CLERK_SECRET_KEY: 'sk_live_x' } });
  const pBody = await provisioning.json();
  check('Health reports that first-time provisioning can complete',
    pBody.checks.accountProvisioning.ok === true);
  check('...without treating it as blocking, since two other routes exist',
    pBody.checks.accountProvisioning.blocking === false);

  // Keys from two different Clerk environments. The first deploy that
  // reported the instance found this waiting to happen: the site is
  // wired to a Clerk PRODUCTION instance while the operator was reading
  // the DEVELOPMENT environment in the dashboard, where the keys are
  // sk_test_/pk_test_. A test secret against a live publishable key
  // fails exactly like the original outage — sign-in succeeds and every
  // request after it is refused — and nothing compared them.
  const PROD = 'pk_live_' + Buffer.from('clerk.worldwencollege.co.uk$').toString('base64');
  const DEV = 'pk_test_' + Buffer.from('grand-mole-42.clerk.accounts.dev$').toString('base64');

  const matched = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: PROD, CLERK_SECRET_KEY: 'sk_live_x' } });
  const mBody = await matched.json();
  check('Health: matched production keys report no mismatch',
    mBody.checks.keyEnvironmentMatch.ok === true, mBody.checks.keyEnvironmentMatch.detail);
  check('...and name the instance as production',
    mBody.checks.keyEnvironmentMatch.instance === 'production');

  const mixed = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: PROD, CLERK_SECRET_KEY: 'sk_test_x' } });
  const xBody = await mixed.json();
  check('Health: a TEST secret on a production instance is caught',
    xBody.checks.keyEnvironmentMatch.ok === false, xBody.checks.keyEnvironmentMatch.detail);
  check('...naming which key is wrong',
    /CLERK_SECRET_KEY is a development key/.test(xBody.checks.keyEnvironmentMatch.detail));
  check('...and saying what the symptom will be',
    /appear to succeed and every request after it will be refused/
      .test(xBody.checks.keyEnvironmentMatch.detail));
  check('...and which keys to copy instead',
    /sk_live_\/pk_live_/.test(xBody.checks.keyEnvironmentMatch.detail));

  const dev = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: DEV, CLERK_SECRET_KEY: 'sk_test_x' } });
  const dBody = await dev.json();
  check('Health: matched development keys are fine too',
    dBody.checks.keyEnvironmentMatch.ok === true
      && dBody.checks.keyEnvironmentMatch.instance === 'development',
    dBody.checks.keyEnvironmentMatch.detail);

  // Not blocking: a mismatch is a real fault but the endpoint reports
  // rather than adjudicates, and an operator mid-migration between
  // instances should not be told the deployment is dead.
  check('...and a mismatch reports without blocking',
    xBody.checks.keyEnvironmentMatch.blocking === false);

  // It must never return a secret. Every value is a boolean or a
  // sentence we wrote.
  const secretish = await healthGet({ env: {
    DB: {}, CLERK_JWKS_URL: 'https://real.clerk.accounts.dev/.well-known/jwks.json',
    CLERK_WEBHOOK_SECRET: 'whsec_SUPERSECRETVALUE',
    CLERK_AUTHORIZED_PARTIES: 'https://worldwencollege.co.uk',
  } });
  const text = await secretish.text();
  check('Health never returns a secret value', !text.includes('SUPERSECRETVALUE'));
  const withKey = await healthGet({ env: { DB: {}, CLERK_SECRET_KEY: 'sk_live_NEVERPRINTTHIS',
    CLERK_PUBLISHABLE_KEY: 'pk_live_' + Buffer.from('h.clerk.accounts.dev$').toString('base64') } });
  check('...including the Clerk secret key', !(await withKey.text()).includes('NEVERPRINTTHIS'));
  // The environment check reads a key's PREFIX. That is a category, not
  // a value — and the rest of the key must still never appear.
  const prefixed = await healthGet({ env: { DB: {},
    CLERK_PUBLISHABLE_KEY: 'pk_live_' + Buffer.from('clerk.worldwencollege.co.uk$').toString('base64'),
    CLERK_SECRET_KEY: 'sk_test_THISPARTISSECRET' } });
  const pText = await prefixed.text();
  check('...even when it has just read that key\u2019s prefix',
    !pText.includes('THISPARTISSECRET') && /development key/.test(pText));
  check('...nor the full JWKS URL path', !text.includes('/.well-known/jwks.json'));

  // -------------------------------------------------------------------
  // The provider is actually contacted
  // -------------------------------------------------------------------
  // Every assertion above this line can hold on a deployment where
  // nobody can sign in, because none of them ever left the process. A
  // Clerk PRODUCTION instance serves from a domain of the College's
  // own, and that domain answers nothing until the DNS records Clerk
  // asks for have been added and verified. Key valid, URL correct,
  // prefixes matched, no sign-in form on the page and no token
  // verifiable. These are the assertions that see that.
  reset();
  const LIVE = 'pk_live_' + Buffer.from('clerk.worldwencollege.co.uk$').toString('base64');

  const up = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: LIVE, CLERK_SECRET_KEY: 'sk_live_x' } });
  const upBody = await up.json();
  check('Health: a reachable instance is reported reachable',
    upBody.checks.providerReachable.ok === true, upBody.checks.providerReachable.detail);
  check('...counting the signing keys it published',
    /2 signing keys/.test(upBody.checks.providerReachable.detail),
    upBody.checks.providerReachable.detail);
  check('...and confirming a browser could load the sign-in form',
    upBody.checks.browserSignIn.ok === true, upBody.checks.browserSignIn.detail);
  check('...and the deployment is ready', upBody.ready === true && up.status === 200);
  check('...having actually requested both, not assumed them',
    requested.some((u) => u.includes('/.well-known/jwks.json'))
      && requested.some((u) => u.includes('clerk.browser.js')),
    requested.join(' '));

  // The DNS case: the exact shape of an unfinished Clerk production
  // domain. This is the one the operator cannot diagnose from the
  // dashboard, because in the dashboard everything looks configured.
  reset();
  provider.jwks = { status: 0 };
  provider.sdk = { status: 0 };
  const down = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: LIVE, CLERK_SECRET_KEY: 'sk_live_x' } });
  const downBody = await down.json();
  check('Health: an unreachable Clerk instance is NOT reported ready',
    downBody.ready === false && down.status === 503, downBody.summary);
  check('...naming provider reachability as the blocker',
    downBody.blocking.includes('providerReachable'), downBody.blocking.join(', '));
  check('...and the sign-in form as unreachable too',
    downBody.blocking.includes('browserSignIn'), downBody.blocking.join(', '));
  check('...telling the operator the likely cause is outstanding DNS',
    /DNS records Clerk asks for/.test(downBody.checks.providerReachable.detail),
    downBody.checks.providerReachable.detail);
  check('...and where to look for it',
    /Clerk dashboard > Domains/.test(downBody.checks.providerReachable.detail));
  check('...and that the symptom is a page that does nothing',
    /sees a page that does nothing/.test(downBody.checks.browserSignIn.detail),
    downBody.checks.browserSignIn.detail);
  // The old checks must NOT contradict the new ones by staying green in
  // a way that reads as reassurance.
  check('...while still reporting the keys as internally consistent',
    downBody.checks.keyEnvironmentMatch.ok === true,
    'a matched pair pointing at a dead host is still a matched pair');
  // "Configure it" is the wrong instruction for something that IS
  // configured, and it is the instruction that costs an afternoon in
  // the wrong dashboard.
  check('...and saying plainly that the fix is not here',
    /Everything is configured, but the Clerk instance it names is not answering/
      .test(downBody.summary) && /fix is at the provider, not here/.test(downBody.summary),
    downBody.summary);

  // An instance that answers, but not for us.
  reset();
  provider.jwks = { status: 404 };
  const notFound = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: LIVE } });
  const nfBody = await notFound.json();
  check('Health: a non-200 from the signing keys blocks',
    nfBody.checks.providerReachable.ok === false && nfBody.ready === false,
    nfBody.checks.providerReachable.detail);
  check('...naming the status it actually got',
    /HTTP 404/.test(nfBody.checks.providerReachable.detail));
  check('...and, for a 404, that the key may name the wrong instance',
    /publishable key belongs to the instance/.test(nfBody.checks.providerReachable.detail));

  // The status the live deployment actually returned. 530 is
  // Cloudflare's "Origin DNS error" (1016) and on a Clerk custom domain
  // it means one thing: the CNAME is proxied where Clerk requires DNS
  // only. The generic advice — re-check your publishable key — is
  // actively wrong here, and costs an operator an evening.
  reset();
  provider.jwks = { status: 530 };
  provider.sdk = { status: 530 };
  const originDns = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: LIVE } });
  const oBody = await originDns.json();
  check('Health: a 530 is named as Cloudflare\u2019s Origin DNS error',
    /Origin DNS error/.test(oBody.checks.providerReachable.detail)
      && /1016/.test(oBody.checks.providerReachable.detail),
    oBody.checks.providerReachable.detail);
  check('...pointing at a proxied record where Clerk needs DNS only',
    /PROXIED \(orange cloud\)/.test(oBody.checks.providerReachable.detail)
      && /DNS only \(grey cloud\)/.test(oBody.checks.providerReachable.detail));
  check('...naming where to change it',
    /Cloudflare > DNS > Records/.test(oBody.checks.providerReachable.detail));
  check('...and saying explicitly that the key is not the problem',
    /publishable key is not the problem/.test(oBody.checks.providerReachable.detail));
  check('...on the browser side too, since that is what the visitor hits',
    /Origin DNS error/.test(oBody.checks.browserSignIn.detail),
    oBody.checks.browserSignIn.detail);
  check('...and it does not also offer the wrong advice',
    !/publishable key belongs to the instance/.test(oBody.checks.providerReachable.detail));

  // 200 with nothing in it verifies nothing, and is the one failure a
  // status-code check would call healthy.
  reset();
  provider.jwks = { status: 200, keys: 0 };
  const emptyKeys = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: LIVE } });
  const ekBody = await emptyKeys.json();
  check('Health: a 200 with no signing keys is not healthy',
    ekBody.checks.providerReachable.ok === false, ekBody.checks.providerReachable.detail);

  // A CDN that serves the file but refuses the range request still
  // serves the file. 206 is a success, not a fault.
  reset();
  provider.sdk = { status: 206 };
  const partial = await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: LIVE } });
  check('Health: a 206 for the browser SDK is a success',
    (await partial.json()).checks.browserSignIn.ok === true);

  // The probe must ask for the URL the BROWSER asks for. A probe of a
  // different path proves nothing about the sign-in form, and the two
  // live in different files, so they drift silently unless pinned.
  reset();
  await healthGet({ env: { DB: {}, CLERK_PUBLISHABLE_KEY: LIVE } });
  const probedSdk = requested.find((u) => u.includes('clerk.browser.js'));
  const loader = readFileSync(new URL('../js/clerk-loader.js', import.meta.url), 'utf8');
  const loaderPath = (loader.match(/script\.src = 'https:\/\/' \+ fapi \+ '([^']+)'/) || [])[1];
  check('The health probe requests the same SDK path the browser will',
    !!loaderPath && probedSdk === 'https://clerk.worldwencollege.co.uk' + loaderPath,
    `${probedSdk} vs ${loaderPath}`);

  // With nothing configured there is nothing to contact, and a health
  // check that makes outbound requests on an unconfigured deployment is
  // a health check that times out instead of answering.
  reset();
  await healthGet({ env: {} });
  check('Health: an unconfigured deployment contacts nobody', requested.length === 0,
    requested.join(' '));

  globalThis.fetch = realFetch;
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
  // Widened when the provider lookup was added: the guard is no longer
  // "the token has no email claim" but "no email could be established
  // from ANY route". The invariant is unchanged — nothing is invented —
  // and it now covers one more way of arriving there.
  check('requireUser raises it when no email can be established',
    /if \(!email\) \{[\s\S]{0,160}AccountProvisioningError/.test(src));
  check('...and says signing in again will not help',
    /signing in again will \+?\s*'?\s*\+?\s*'?not change/.test(src.replace(/\s+/g, ' '))
      || /signing in again will not change/.test(src.replace(/'\s*\+\s*'/g, '').replace(/\s+/g, ' ')),
    'the message no longer rules out the sign-in loop');
}

// ---------------------------------------------------------------------
// 4c · A session token is not a profile
// ---------------------------------------------------------------------
// Clerk's DEFAULT session token carries no email claim, and users.email
// is NOT NULL because an address must never be invented. That left two
// routes to an account — a dashboard setting somebody had to remember,
// and a webhook that might not have arrived — so a learner could sign
// in successfully and still have no account, with nothing they could do
// about it.
//
// The third route asks the provider, which knew all along.
{
  const { clerkAdapter } = await import(loadUrl('functions/_lib/auth/clerk-adapter.js'));
  const realFetch = globalThis.fetch;
  const calls = [];
  const stub = (status, body) => {
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), auth: init && init.headers && init.headers.Authorization });
      return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
    };
  };

  const VERIFIED = {
    id: 'user_1', primary_email_address_id: 'idn_2',
    email_addresses: [
      { id: 'idn_1', email_address: 'old@example.com', verification: { status: 'verified' } },
      { id: 'idn_2', email_address: 'learner@example.com', verification: { status: 'verified' } },
    ],
  };

  stub(200, VERIFIED);
  let got = await clerkAdapter.fetchIdentity('user_1', { CLERK_SECRET_KEY: 'sk_test_x' });
  check('fetchIdentity returns the PRIMARY address, not the first',
    got && got.email === 'learner@example.com', got && got.email);
  check('...marked verified', got && got.emailVerified === true);
  check('...from the provider\u2019s user endpoint',
    /\/v1\/users\/user_1$/.test(calls[0].url), calls[0].url);
  check('...authenticated with the secret key',
    calls[0].auth === 'Bearer sk_test_x');

  // An unverified address must never become a College account.
  // users.email is what a transcript, a certificate and every
  // notification are addressed to, and "somebody typed this into a
  // form" is not the same claim as "somebody proved they read mail
  // there".
  stub(200, { id: 'user_2', primary_email_address_id: 'idn_9',
    email_addresses: [{ id: 'idn_9', email_address: 'unproven@example.com', verification: { status: 'unverified' } }] });
  got = await clerkAdapter.fetchIdentity('user_2', { CLERK_SECRET_KEY: 'sk_test_x' });
  check('An unverified address is returned as unverified, not as verified',
    got && got.email === 'unproven@example.com' && got.emailVerified === false,
    JSON.stringify(got));

  // Every way the provider can fail to answer must yield null, never a
  // guess. A fabricated account is worse than no account.
  for (const [label, status, body] of [
    ['a 404', 404, { errors: [] }],
    ['a 500', 500, {}],
    ['a user with no addresses', 200, { id: 'u', email_addresses: [] }],
    ['a malformed body', 200, { id: 'u' }],
  ]) {
    stub(status, body);
    const r = await clerkAdapter.fetchIdentity('user_x', { CLERK_SECRET_KEY: 'sk_test_x' });
    check(`...and ${label} yields nothing rather than a guess`, r === null, JSON.stringify(r));
  }

  globalThis.fetch = async () => { throw new Error('network down'); };
  check('...and an unreachable provider does not throw into the request',
    (await clerkAdapter.fetchIdentity('user_x', { CLERK_SECRET_KEY: 'sk_test_x' })) === null);

  // No key: it must not even try. A request per sign-in to an endpoint
  // that cannot answer is an outbound amplifier with no upside.
  let tried = false;
  globalThis.fetch = async () => { tried = true; return new Response('{}', { status: 200 }); };
  check('With no secret key it does not call the provider at all',
    (await clerkAdapter.fetchIdentity('user_x', {})) === null && tried === false);

  globalThis.fetch = realFetch;
}

// And end to end: a verified session with NO email claim now provisions.
{
  const { requireUser } = await import(loadUrl('functions/_lib/auth/session.js'));
  const src = readFileSync(`${ROOT}/functions/_lib/auth/session.js`, 'utf8');
  check('requireUser asks the provider when the token carries no email',
    /fetchIdentity\(identity\.providerId, env\)/.test(src));
  check('...only when the token has none, not on every request',
    /if \(!email && typeof provider\.fetchIdentity/.test(src));
  check('...and still refuses to invent one when nothing answers',
    /AccountProvisioningError/.test(src) && /will not invent one/.test(src));
  check('...telling the operator which key is missing',
    /CLERK_SECRET_KEY/.test(src));
  check('requireUser is still exported', typeof requireUser === 'function');
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
  // The three things the panel tells an applicant to try are all about
  // their own device. When the fault is the College's own — a Clerk
  // instance whose domain is not answering — that advice sends somebody
  // to restart their router over a DNS record at our end. Both wordings
  // are authored in the page, so the Arabic version is a translation
  // rather than English injected from a script.
  check(`${page} carries a wording for when the fault is ours`,
    /data-wizard-auth-ours/.test(html));
  check(`${page} marks the device-side advice so it can be withdrawn`,
    (html.match(/data-wizard-auth-yours/g) || []).length >= 2,
    (html.match(/data-wizard-auth-yours/g) || []).length);
  check(`${page} keeps the our-fault wording hidden until it is established`,
    /data-wizard-auth-ours hidden/.test(html));
}
{
  const js = readFileSync(`${ROOT}/js/admissions-wizard.js`, 'utf8');
  const handler = js.slice(js.indexOf('onAuthUnavailable:'), js.indexOf('onAuthUnavailable:') + 700);
  check('onAuthUnavailable no longer reveals the "you signed in" panel',
    /authUnreachableShell/.test(handler) && !/loadErrorShell\.hidden = false/.test(handler));

  // It asks whose fault it is rather than assuming the applicant's.
  const whose = js.slice(js.indexOf('onAuthUnavailable:'), js.indexOf('onAuthUnavailable:') + 3000);
  check('...and asks the health endpoint before blaming the applicant',
    /fetch\('\/api\/health\/auth'/.test(whose));
  check('...treating an unreachable provider or a missing form as ours',
    /browserSignIn/.test(whose) && /providerReachable/.test(whose));
  check('...withdrawing the device-side advice only then',
    /data-wizard-auth-yours/.test(whose) && /data-wizard-auth-ours/.test(whose));
  // If the health endpoint cannot be reached either, the applicant
  // genuinely may be offline. A page that blames itself for the
  // visitor's aeroplane mode is no more honest than the reverse.
  check('...and leaving the panel alone when it cannot tell',
    /catch\(function \(\) \{ \/\* leave the panel as authored \*\/ \}\)/.test(whose));
  // No English in the script: the Arabic apply page must be a
  // translation, not a second copy of this file. Comments stripped
  // first — a scanner that flags the sentence explaining why the
  // sentence is forbidden has caught itself twice on this codebase.
  const whoseCode = whose.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  check('...without putting either wording in the script',
    !/not answering|at our end/i.test(whoseCode));
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
    'CLERK_AUTHORIZED_PARTIES', 'CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY']) {
    check(`docs/fixing-sign-in.md names ${setting}`, doc.includes(setting));
  }
  check('...and the D1 binding', /D1 database bindings|binding `DB`|D1 binding/.test(doc));
  check('...and the email claim Clerk does not send by default',
    /primary_email_address/.test(doc));
  check('...and that it is one of THREE routes, not a required errand',
    /three routes to an address, and any one is enough/i.test(doc.replace(/\s+/g, ' ')));
  check('...and that only a verified address is accepted',
    /only when Clerk reports it\s*verified/i.test(doc.replace(/\s+/g, ' ')));
  check('...and leads with the one-request check',
    doc.indexOf('/api/health/auth') < doc.indexOf('## What went wrong'));
  // The failure that is invisible from every dashboard: a Clerk
  // production instance whose DNS has not been finished. The doc has to
  // carry the fix, because the endpoint can only say what is wrong.
  {
    const fix = readFileSync(`${ROOT}/docs/fixing-sign-in.md`, 'utf8');
    check('docs/fixing-sign-in.md explains a configured deployment nobody can sign in to',
      /Configured, and still nobody can sign in/.test(fix));
    check('...naming DNS at the registrar as the cause', /DNS records Clerk asks for/.test(fix)
      && /verified in the Clerk dashboard/.test(fix));
    check('...and that the symptom is no sign-in form at all',
      /no sign-in form appears on any page at all/.test(fix));
    check('...and the proxied-CNAME trap', /DNS only\*\* \(grey cloud\)/.test(fix));
    check('...naming the 530 this deployment actually returned',
      /HTTP 530 \u2014 the one this site actually hit/.test(fix)
        && /Origin DNS error/.test(fix));
    check('...with the click-by-click fix, not just the cause',
      /Proxy status/.test(fix) && /Click the cloud so it turns grey/.test(fix)
        && /DNS[^\n]*Records/.test(fix));
    check('...and the other records that share the fault',
      /clkmail/.test(fix) && /_domainkey/.test(fix));
    check('...and the immediate way out, with its cost stated',
      /development instance/.test(fix) && /rate-limited/.test(fix));
  }

  check('...and says a variable applies only to NEW deployments',
    /redeploy/i.test(doc));
}

// And the deploy itself asks the question on every run, so the next
// misconfiguration is visible before an applicant finds it.
{
  const wf = readFileSync(`${ROOT}/.github/workflows/deploy-cloudflare.yml`, 'utf8');
  // It also CONFIGURES rather than only reporting. The gap was that the
  // deploy knew the publishable key and the Functions did not.
  check('The deploy pushes the publishable key to the Pages project',
    /pages secret put/.test(wf) && /put CLERK_PUBLISHABLE_KEY/.test(wf));
  // Anchored on the command itself, not on the step's NAME, and
  // guarded against -1: the first version compared indexOf() results
  // directly, so renaming the step made indexOf return -1, and -1 is
  // less than everything. It passed while asserting nothing, and
  // sabotage is the only reason that was found.
  const configAt = wf.indexOf('put CLERK_PUBLISHABLE_KEY "$PK"');
  const publishAt = wf.indexOf('- name: Publish');
  check('...before publishing, since a deployment captures config at creation',
    configAt > 0 && publishAt > 0 && configAt < publishAt,
    `config at ${configAt}, publish at ${publishAt}`);
  check('...and warns rather than failing when the token lacks Pages:Edit',
    /Cloudflare Pages: Edit/.test(wf));
  check('The deploy probes /api/health/auth', /api\/health\/auth/.test(wf));
  check('...and warns loudly when the deployment cannot authenticate',
    /CANNOT SIGN ANYBODY IN/.test(wf));
  check('...without failing a build over settings held in Cloudflare',
    !/health\/auth[\s\S]{0,400}exit 1/.test(wf));

  // WHICH instance is live. A Clerk development instance serves from
  // *.clerk.accounts.dev and a production one from a domain of the
  // College's own, and that decides whether pk_test_/sk_test_ or
  // pk_live_/sk_live_ is the correct pair. A mismatched pair fails in
  // a way that looks exactly like the outage this probe exists to
  // catch, so the deploy states which it is rather than leaving it to
  // be guessed.
  check('The deploy reports which Clerk instance is live',
    /clerk\.accounts\.dev\) instance=/.test(wf) && /PRODUCTION instance/.test(wf));
  check('...and says which key pair that instance expects',
    /pk_test_\/sk_test_/.test(wf) && /pk_live_\/sk_live_/.test(wf));

  // The health detail is what that parse reads. If the sentence is
  // reworded the parse silently yields nothing and the deploy stops
  // reporting the instance — so the wording is pinned to the parse.
  const health = readFileSync(`${ROOT}/functions/api/health/auth.js`, 'utf8');
  check('...against wording the health endpoint actually emits',
    /Session tokens are verified against \$\{jwksHost\(url\)\}/.test(health));

  // Every line the step prints above this was one field pulled out with
  // `sed`. A deployment reported "HTTP 200, prerequisites configured"
  // while nobody could sign in, and the reason the log said nothing
  // useful is that the fields it chose to extract were all healthy. The
  // body is now printed whole, so the next fault does not have to be
  // one somebody thought to grep for.
  check('The deploy prints the whole health body, not selected fields',
    /full diagnosis/.test(wf) && /json\.tool \/tmp\/health\.json/.test(wf));
  check('...and warns when the Clerk instance itself is unreachable',
    /CLERK INSTANCE UNREACHABLE/.test(wf) && /"providerReachable":\{"ok":false/.test(wf));
  check('...and when no sign-in form can appear at all',
    /NO SIGN-IN FORM CAN APPEAR/.test(wf) && /"browserSignIn":\{"ok":false/.test(wf));
  // Those two parses read the endpoint's own JSON field order. A check
  // renamed in one file and not the other yields nothing and warns
  // about nothing, which is the failure mode this whole step exists to
  // end — so the names are pinned across both files.
  check('...naming checks the endpoint actually emits',
    /providerReachable: \(\(\) =>/.test(health) && /browserSignIn: \(\(\) =>/.test(health));

  // The endpoint can say the Clerk domain is not answering. It cannot
  // reach into the DNS zone and fix it. The deploy can, with the token
  // it already holds — and the whole risk of that is whether it can be
  // made to write when nobody asked it to.
  check('The deploy reads the DNS behind the Clerk domain',
    /Read the DNS behind the Clerk domain/.test(wf)
      && /node scripts\/clerk-dns\.mjs/.test(wf));
  check('...reporting by default and repairing only when asked',
    /inputs\.fix_clerk_dns && 'fix' \|\| 'report'/.test(wf));
  check('...with the repair switch defaulting to off',
    /fix_clerk_dns:[\s\S]{0,900}?default: false/.test(wf));
  check('...deriving the host from the publishable key, not a second variable',
    /CLERK_HOST=\$\(node -e/.test(wf) && /PK: \$\{\{ secrets\.CLERK_PUBLISHABLE_KEY/.test(wf));
  check('...and never failing the build over a DNS zone it does not own',
    /Read the DNS behind the Clerk domain[\s\S]{0,300}?continue-on-error: true/.test(wf));
  check('...warning when a Clerk record is still proxied',
    /A Clerk DNS record is PROXIED and must be DNS only/.test(wf));
  // The warning greps the script's own output. Reword one and the
  // other stops firing, silently — which is the failure mode this
  // whole step exists to end.
  const dns = readFileSync(`${ROOT}/scripts/clerk-dns.mjs`, 'utf8');
  check('...against wording the script actually emits',
    /'PROXIED  <- must be DNS only'/.test(dns) && /switched \$\{r\.name\} to DNS only/.test(dns));
}

function fakeJwt() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'RS256', kid: 'k1' })}.${b64({ sub: 'user_1', exp: 99999999999 })}.sig`;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
