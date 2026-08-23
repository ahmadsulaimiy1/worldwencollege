// Clerk adapter — implements provider-interface.js using only Clerk's
// public REST/JWKS endpoints and the Web Crypto API already available
// in the Workers runtime. Deliberately not using @clerk/backend: that
// SDK is Node-oriented and pulls in a dependency tree for what's
// fundamentally "verify a JWT" and "verify an HMAC webhook signature"
// — both doable natively, which keeps this Cloudflare-Pages-Functions
// build dependency-free and Netlify/Vercel-portable (see
// docs/technical-architecture.md § Portability).
//
// Requires (none set anywhere real yet):
//   CLERK_JWKS_URL        e.g. https://<your-instance>.clerk.accounts.dev/.well-known/jwks.json
//   CLERK_WEBHOOK_SECRET  the "whsec_..." signing secret from the Clerk dashboard

import { timingSafeEqual, ConfigError } from '../db.js';

let jwksCache = { keys: null, fetchedAt: 0, lastForcedAt: 0 };
const JWKS_TTL_MS = 10 * 60 * 1000;
// Floor between rotation-triggered refetches. See findSigningKey().
const JWKS_FORCE_MIN_INTERVAL_MS = 30 * 1000;

// A Clerk publishable key ENCODES the Frontend API host: everything
// after the last underscore is base64 of `<host>$`. Clerk's own browser
// SDK does exactly this to find where to load itself from, and
// js/clerk-loader.js has done it on this site since the beginning.
//
// It is reproduced here so the server can DERIVE its JWKS URL from the
// same single key the browser already uses.
//
// This is not a convenience. Two variables that had to agree, one of
// which nobody set, is what took admissions down: the publishable key
// was configured and CLERK_JWKS_URL was not, so sign-in succeeded and
// every request after it failed. One source of truth cannot disagree
// with itself.
export function frontendApiFromPublishableKey(key) {
  if (typeof key !== 'string' || !key.includes('_')) return null;
  const encoded = key.split('_').pop();
  if (!encoded) return null;
  let decoded;
  try {
    decoded = atob(encoded);
  } catch {
    return null;
  }
  const host = decoded.replace(/\$+$/, '').trim();
  // A host, not a URL and not a path: anything else means the key was
  // malformed or truncated, and guessing at it would point session
  // verification somewhere unintended.
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host)) return null;
  return host;
}

// Where this deployment verifies session tokens, and how it worked that
// out. Explicit configuration always wins — an operator pointing at a
// specific instance must not be silently overridden — and derivation is
// the fallback that means one key is enough.
export function resolveJwksUrl(env) {
  if (env.CLERK_JWKS_URL) return { url: env.CLERK_JWKS_URL, source: 'CLERK_JWKS_URL' };
  const host = frontendApiFromPublishableKey(env.CLERK_PUBLISHABLE_KEY);
  if (host) {
    return { url: `https://${host}/.well-known/jwks.json`, source: 'CLERK_PUBLISHABLE_KEY' };
  }
  return { url: null, source: null };
}

// Both failures here are ConfigError, not Error, and the distinction is
// the whole reason the admissions wizard was undiagnosable: a bare
// Error becomes a masked 500 "Something went wrong.", which the client
// correctly reads as "unexpected — retry might help". Neither of these
// is helped by retrying. An unset variable is helped by setting it; an
// unreachable JWKS endpoint is helped by waiting for Clerk, and the
// applicant should be told which.
async function getJwks(env, { force = false } = {}) {
  const { url } = resolveJwksUrl(env);
  if (!url) {
    throw new ConfigError('Sign-in is not finished being set up on this deployment: '
      + 'no session token can be verified, because neither CLERK_PUBLISHABLE_KEY nor '
      + 'CLERK_JWKS_URL is configured for the Functions. Setting the publishable key '
      + 'alone is enough — the verification endpoint is derived from it. '
      + 'See docs/fixing-sign-in.md and GET /api/health/auth.');
  }
  const fresh = Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS;
  if (jwksCache.keys && fresh && !force) return jwksCache.keys;

  let resp;
  try {
    resp = await fetch(url);
  } catch (cause) {
    throw new ConfigError('The authentication provider could not be reached to verify '
      + 'your session. This is an outage rather than a fault in your application.');
  }
  if (!resp.ok) {
    throw new ConfigError(`The authentication provider answered ${resp.status} when asked `
      + 'for its signing keys, so no session can be verified right now.');
  }
  const { keys } = await resp.json();
  jwksCache = { keys, fetchedAt: Date.now(), lastForcedAt: force ? Date.now() : jwksCache.lastForcedAt };
  return keys;
}

// Resolves a token's `kid` against the JWKS, refetching ONCE if the key
// is unknown.
//
// Without that refetch, key rotation signs everyone out. Clerk rotates
// its signing keys; the moment it does, every token carries a kid this
// isolate has never seen, and a cache-only lookup rejects all of them
// for the remaining TTL — up to ten minutes of "your session expired"
// across every signed-in learner, self-healing but indistinguishable
// from an outage while it lasts.
//
// The refetch is then rate-limited, because "unknown kid" is fully
// attacker-controlled: anyone can send a token naming a key id that
// does not exist, and an unconditional refetch turns each such request
// into an outbound request to Clerk. That is a request amplifier
// pointed at our own auth provider, and rate-limiting it is the whole
// reason this floor exists. (Written after a test proved the first
// version of this function did exactly that — the code comment here
// previously claimed it was safe, and was wrong.)
//
// Cost of the floor: if a junk kid forces a refetch and Clerk rotates
// its keys moments later, real tokens are rejected for up to
// JWKS_FORCE_MIN_INTERVAL_MS. Thirty seconds against the ten minutes a
// cache-only lookup would cost is the trade being made deliberately.
async function findSigningKey(env, kid) {
  const cached = await getJwks(env);
  const hit = cached.find((k) => k.kid === kid);
  if (hit) return hit;
  if (!jwksCache.keys || jwksCache.fetchedAt === 0) return null;
  if (Date.now() - jwksCache.lastForcedAt < JWKS_FORCE_MIN_INTERVAL_MS) return null;
  const refreshed = await getJwks(env, { force: true });
  return refreshed.find((k) => k.kid === kid) || null;
}

function base64UrlToUint8Array(b64url) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeJson(b64url) {
  return JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(b64url)));
}

async function importJwk(jwk) {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
}

export const clerkAdapter = {
  async verifySessionToken(token, env) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    let header, payload;
    try {
      header = base64UrlDecodeJson(headerB64);
      payload = base64UrlDecodeJson(payloadB64);
    } catch {
      return null; // malformed token — treat as unauthenticated, not an error
    }

    // Only RS256 is accepted, and it is checked BEFORE the key lookup.
    // Two classic forgeries die here: `alg: "none"`, and an HS256 token
    // whose "signature" is an HMAC computed with the public key as the
    // secret — a public key being, by definition, something an attacker
    // has. Trusting the header's own alg is how both work.
    if (header.alg !== 'RS256') return null;

    const jwk = await findSigningKey(env, header.kid);
    if (!jwk) return null;

    const key = await importJwk(jwk);
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToUint8Array(sigB64);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedData);
    if (!valid) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && nowSec >= payload.exp) return null;
    if (payload.nbf && nowSec < payload.nbf) return null;

    // Optional authorized-party check: if CLERK_AUTHORIZED_PARTIES is
    // set (comma-separated origins, e.g. "https://worldwencollege.co.uk"),
    // a token whose azp claim isn't in that list is rejected. Off by
    // default (unset = skip this check) so it never blocks anything
    // until deployment deliberately configures it — but worth setting
    // at deploy time: without it, any token signed by keys behind
    // CLERK_JWKS_URL is accepted regardless of which Clerk-connected
    // application minted it, which matters the moment more than one
    // frontend shares this Clerk instance (e.g. a future portal on a
    // different subdomain). See docs/auth-architecture.md.
    if (env.CLERK_AUTHORIZED_PARTIES) {
      const allowed = env.CLERK_AUTHORIZED_PARTIES.split(',').map((s) => s.trim()).filter(Boolean);
      if (allowed.length && (!payload.azp || !allowed.includes(payload.azp))) return null;
    }

    return {
      providerId: payload.sub,
      email: payload.email || null,
      // Not `=== true`. The claim is produced by a Clerk JWT template
      // written as `"email_verified": "{{user.email_verified}}"` —
      // a shortcode inside JSON quotes. Whether the substitution keeps
      // the boolean type or yields the string "true" is the vendor's
      // choice, it is not visible from our side, and it is the kind of
      // thing that changes in a dashboard release. A strict comparison
      // would silently record every learner as unverified and nothing
      // would look broken.
      //
      // So: accept the value in whichever shape it arrives, and treat
      // anything else — absent, null, "false", 0 — as not verified.
      // Deliberately not `Boolean(...)`, which would read the string
      // "false" as true.
      emailVerified: payload.email_verified === true || payload.email_verified === 'true',
    };
  },

  // Clerk delivers webhooks via Svix. Signature scheme:
  //   signedContent = `${svix-id}.${svix-timestamp}.${rawBody}`
  //   expected = base64(HMAC-SHA256(secret bytes, signedContent))
  // compared against any value in the space-separated svix-signature header.
  async verifyWebhookSignature(request, rawBody, env) {
    if (!env.CLERK_WEBHOOK_SECRET) {
      throw new Error('CLERK_WEBHOOK_SECRET is not configured.');
    }
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');
    if (!svixId || !svixTimestamp || !svixSignature) return false;

    const secretBytes = base64UrlToUint8Array(env.CLERK_WEBHOOK_SECRET.replace(/^whsec_/, ''));
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
    const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

    return svixSignature.split(' ').some((entry) => timingSafeEqual(entry.split(',')[1], expected));
  },

  parseWebhookEvent(rawBody) {
    const body = JSON.parse(rawBody);
    return { type: body.type, data: body.data };
  },
};
