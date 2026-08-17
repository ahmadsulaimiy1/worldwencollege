// functions/_lib/auth/clerk-adapter.js — session-token verification,
// exercised with GENUINELY SIGNED tokens.
//
// WHY THIS FILE EXISTS, AND WHAT CHANGED.
//
// Until now the whole of `verifySessionToken()` past the "is there a
// token at all" check was untested, and honestly disclosed as such: a
// real Clerk-signed JWT needs a real Clerk account. Every other test
// confirmed the 401 boundary held and stopped there.
//
// That disclosure conflated two different things. Getting a token
// *from Clerk* needs an account. Getting a *real RS256 JWT* does not —
// Web Crypto will generate an RSA keypair, publish it as a JWKS and
// sign a token, and the adapter cannot tell the difference, because
// there is no difference: the signature algorithm, the key format and
// the verification path are identical. What stays untested is Clerk's
// specific claim set and its rotation cadence, not the cryptography.
//
// This matters right now because the recording work produced a defect
// of exactly this shape: 62 unit tests passed against a content type
// the tests invented, and the code rejected the one every real browser
// actually sends. A test that supplies its own inputs can only ever
// discover what its author already imagined. So: a real keypair, a
// real signature, and adversarial cases an attacker would actually try.
//
// The stubbed JWKS endpoint is the ONLY stub here.
import { loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

async function makeKeypair(kid) {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  return { ...pair, jwk: { ...jwk, kid, alg: 'RS256', use: 'sig' }, kid };
}

async function sign(keypair, payload, header = {}) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: keypair.kid, ...header });
  const p = enc(payload);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keypair.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}

const nowSec = () => Math.floor(Date.now() / 1000);
const claims = (over = {}) => ({
  sub: 'user_2abcdef', email: 'learner@example.com', email_verified: true,
  iat: nowSec() - 10, exp: nowSec() + 600, azp: 'https://worldwencollege.co.uk', ...over,
});

// A fresh module instance per scenario: the JWKS cache is module-level
// (deliberately — a Worker isolate should reuse it across requests), so
// scenarios would otherwise contaminate each other.
let instance = 0;
async function freshAdapter() {
  const { clerkAdapter } = await import(`${loadUrl('functions/_lib/auth/clerk-adapter.js')}?v=${++instance}`);
  return clerkAdapter;
}

// Stubbed JWKS endpoint. Counts calls, so cache and rotation behaviour
// can be asserted rather than assumed.
let jwksKeys = [], jwksCalls = 0, jwksStatus = 200;
globalThis.fetch = async (url) => {
  if (String(url).includes('jwks')) {
    jwksCalls++;
    return { ok: jwksStatus === 200, status: jwksStatus, json: async () => ({ keys: jwksKeys }) };
  }
  throw new Error('unexpected fetch: ' + url);
};
const ENV = { CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };

// ---------------------------------------------------------------------
// A genuinely signed token verifies
// ---------------------------------------------------------------------
{
  const kp = await makeKeypair('kid-primary');
  jwksKeys = [kp.jwk]; jwksCalls = 0;
  const adapter = await freshAdapter();

  const identity = await adapter.verifySessionToken(await sign(kp, claims()), ENV);
  check('A real RS256 token signed by the published key verifies', !!identity, JSON.stringify(identity));
  check('...and yields the provider id from the sub claim', identity && identity.providerId === 'user_2abcdef', identity && identity.providerId);
  check('...the email', identity && identity.email === 'learner@example.com', identity && identity.email);
  check('...and the verified flag as a real boolean', identity && identity.emailVerified === true, identity && identity.emailVerified);

  await adapter.verifySessionToken(await sign(kp, claims()), ENV);
  check('The JWKS is cached, not refetched on every request', jwksCalls === 1, jwksCalls);
}

// ---------------------------------------------------------------------
// The email_verified claim, in whichever shape Clerk sends it
// ---------------------------------------------------------------------
{
  // The claim comes from a Clerk JWT template written as
  //   "email_verified": "{{user.email_verified}}"
  // — a shortcode inside JSON quotes. Whether Clerk preserves the
  // boolean or substitutes the string "true" is the vendor's choice,
  // invisible from our side, and exactly the sort of thing a dashboard
  // release changes. A strict === true would have recorded every
  // learner as unverified with nothing appearing broken.
  const kp = await makeKeypair('kid-primary');
  jwksKeys = [kp.jwk];
  const adapter = await freshAdapter();
  const verified = async (v) => (await adapter.verifySessionToken(await sign(kp, claims({ email_verified: v })), ENV)).emailVerified;

  check('email_verified as a boolean true is verified', await verified(true) === true);
  check('email_verified as the string "true" is verified', await verified('true') === true);
  check('email_verified as boolean false is not verified', await verified(false) === false);
  check('email_verified as the string "false" is NOT verified — Boolean() would get this wrong',
    await verified('false') === false);
  check('a missing email_verified claim is not verified', await verified(undefined) === false);
  check('email_verified as null is not verified', await verified(null) === false);
}

// ---------------------------------------------------------------------
// Forgery — the cases that decide whether this is security or theatre
// ---------------------------------------------------------------------
{
  const real = await makeKeypair('kid-primary');
  const attacker = await makeKeypair('kid-primary');   // same kid, different key
  jwksKeys = [real.jwk]; jwksCalls = 0;
  const adapter = await freshAdapter();

  const forged = await sign(attacker, claims({ sub: 'user_admin' }));
  check('A token signed by a different key is rejected', await adapter.verifySessionToken(forged, ENV) === null);

  // Tamper with the payload of an otherwise valid token.
  const good = await sign(real, claims());
  const [h, , s] = good.split('.');
  const tampered = `${h}.${enc(claims({ sub: 'user_someone_else' }))}.${s}`;
  check('A tampered payload is rejected — the signature covers it',
    await adapter.verifySessionToken(tampered, ENV) === null);

  // alg: none — the oldest JWT forgery there is.
  const none = `${enc({ alg: 'none', typ: 'JWT', kid: 'kid-primary' })}.${enc(claims())}.`;
  check('An "alg: none" token is rejected', await adapter.verifySessionToken(none, ENV) === null);

  // alg confusion: HS256 signed with the PUBLIC key as the HMAC secret.
  // The public key is public, so if the header's alg were trusted this
  // would be a complete auth bypass.
  const pubPem = Buffer.from(JSON.stringify(real.jwk));
  const hkey = await crypto.subtle.importKey('raw', pubPem, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const hh = enc({ alg: 'HS256', typ: 'JWT', kid: 'kid-primary' });
  const hp = enc(claims({ sub: 'user_admin' }));
  const hsig = await crypto.subtle.sign('HMAC', hkey, new TextEncoder().encode(`${hh}.${hp}`));
  check('An HS256 token signed with the public key is rejected (alg confusion)',
    await adapter.verifySessionToken(`${hh}.${hp}.${b64url(new Uint8Array(hsig))}`, ENV) === null);

  const unknownKid = await sign({ ...real, kid: 'kid-never-published' }, claims());
  check('A token naming an unpublished key id is rejected',
    await adapter.verifySessionToken(unknownKid, ENV) === null);
}

// ---------------------------------------------------------------------
// Lifetime
// ---------------------------------------------------------------------
{
  const kp = await makeKeypair('kid-primary');
  jwksKeys = [kp.jwk];
  const adapter = await freshAdapter();

  check('An expired token is rejected',
    await adapter.verifySessionToken(await sign(kp, claims({ exp: nowSec() - 1 })), ENV) === null);
  check('A token not yet valid (nbf in the future) is rejected',
    await adapter.verifySessionToken(await sign(kp, claims({ nbf: nowSec() + 300 })), ENV) === null);
  check('A token one second from expiry is still accepted',
    await adapter.verifySessionToken(await sign(kp, claims({ exp: nowSec() + 1 })), ENV) !== null);
}

// ---------------------------------------------------------------------
// Authorized party
// ---------------------------------------------------------------------
{
  const kp = await makeKeypair('kid-primary');
  jwksKeys = [kp.jwk];
  const adapter = await freshAdapter();
  const withAzp = { ...ENV, CLERK_AUTHORIZED_PARTIES: 'https://worldwencollege.co.uk, https://www.worldwencollege.co.uk' };

  check('An allowed azp passes',
    await adapter.verifySessionToken(await sign(kp, claims()), withAzp) !== null);
  check('A token minted for another application is rejected',
    await adapter.verifySessionToken(await sign(kp, claims({ azp: 'https://someone-elses-app.example' })), withAzp) === null);
  check('A token with no azp at all is rejected once the check is on',
    await adapter.verifySessionToken(await sign(kp, claims({ azp: undefined })), withAzp) === null);
  check('With the check unset, azp is ignored (the shipped default)',
    await adapter.verifySessionToken(await sign(kp, claims({ azp: 'https://anything.example' })), ENV) !== null);
}

// ---------------------------------------------------------------------
// Key rotation — found by writing this file, not by reading the code
// ---------------------------------------------------------------------
{
  // Clerk rotates its signing keys. With a cache-only lookup, the moment
  // it does, every live token names a kid this isolate has never seen
  // and is rejected until the 10-minute TTL lapses: every signed-in
  // learner thrown out at once, self-healing but indistinguishable from
  // an outage. The adapter now refetches once on an unknown kid.
  const oldKey = await makeKeypair('kid-2026-a');
  jwksKeys = [oldKey.jwk]; jwksCalls = 0;
  const adapter = await freshAdapter();
  check('Baseline: the pre-rotation key works',
    await adapter.verifySessionToken(await sign(oldKey, claims()), ENV) !== null);

  const newKey = await makeKeypair('kid-2026-b');
  jwksKeys = [oldKey.jwk, newKey.jwk];              // Clerk rotates
  const callsBefore = jwksCalls;
  check('A token from a newly rotated key is accepted immediately, not after the cache expires',
    await adapter.verifySessionToken(await sign(newKey, claims()), ENV) !== null);
  check('...via exactly one extra JWKS fetch', jwksCalls === callsBefore + 1, `${callsBefore} -> ${jwksCalls}`);

  const after = jwksCalls;
  await adapter.verifySessionToken(await sign(newKey, claims()), ENV);
  check('...and the refreshed JWKS is then cached, so it is not fetched again', jwksCalls === after, jwksCalls);

  const junkBefore = jwksCalls;
  await adapter.verifySessionToken(await sign({ ...oldKey, kid: 'kid-garbage' }, claims()), ENV);
  await adapter.verifySessionToken(await sign({ ...oldKey, kid: 'kid-garbage' }, claims()), ENV);
  check('A garbage kid cannot be used to hammer the JWKS endpoint',
    jwksCalls - junkBefore <= 1, `${junkBefore} -> ${jwksCalls}`);
}

// ---------------------------------------------------------------------
// Malformed input is unauthenticated, never a 500
// ---------------------------------------------------------------------
{
  const kp = await makeKeypair('kid-primary');
  jwksKeys = [kp.jwk];
  const adapter = await freshAdapter();
  for (const [label, token] of [
    ['null', null], ['empty', ''], ['not a JWT', 'hello'],
    ['two segments', 'a.b'], ['four segments', 'a.b.c.d'],
    ['non-base64 header', '!!!.###.$$$'], ['valid base64, not JSON', `${b64url(Buffer.from('nope'))}.${b64url(Buffer.from('nope'))}.x`],
  ]) {
    let threw = null, result;
    try { result = await adapter.verifySessionToken(token, ENV); } catch (e) { threw = e; }
    check(`Malformed token (${label}) returns null rather than throwing`, !threw && result === null, threw && threw.message);
  }
}

// ---------------------------------------------------------------------
// Misconfiguration
// ---------------------------------------------------------------------
{
  const kp = await makeKeypair('kid-primary');
  jwksKeys = [kp.jwk];
  const adapter = await freshAdapter();
  const token = await sign(kp, claims());

  let err = null;
  try { await adapter.verifySessionToken(token, {}); } catch (e) { err = e; }
  check('A missing CLERK_JWKS_URL is a loud configuration error, not a silent reject',
    err && /CLERK_JWKS_URL/.test(err.message), err && err.message);

  jwksStatus = 503;
  const adapter2 = await freshAdapter();
  err = null;
  try { await adapter2.verifySessionToken(token, ENV); } catch (e) { err = e; }
  check('An unreachable JWKS endpoint fails loudly rather than authenticating nobody quietly',
    err && /JWKS/.test(err.message), err && err.message);
  jwksStatus = 200;
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
