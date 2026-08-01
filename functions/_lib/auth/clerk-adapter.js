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

let jwksCache = { keys: null, fetchedAt: 0 };
const JWKS_TTL_MS = 10 * 60 * 1000;

async function getJwks(env) {
  if (!env.CLERK_JWKS_URL) {
    throw new Error('CLERK_JWKS_URL is not configured.');
  }
  const fresh = Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS;
  if (jwksCache.keys && fresh) return jwksCache.keys;

  const resp = await fetch(env.CLERK_JWKS_URL);
  if (!resp.ok) throw new Error(`Failed to fetch Clerk JWKS: ${resp.status}`);
  const { keys } = await resp.json();
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
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

    const keys = await getJwks(env);
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const key = await importJwk(jwk);
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToUint8Array(sigB64);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signedData);
    if (!valid) return null;

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && nowSec >= payload.exp) return null;
    if (payload.nbf && nowSec < payload.nbf) return null;

    return {
      providerId: payload.sub,
      email: payload.email || null,
      emailVerified: payload.email_verified === true,
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

    return svixSignature.split(' ').some((entry) => entry.split(',')[1] === expected);
  },

  parseWebhookEvent(rawBody) {
    const body = JSON.parse(rawBody);
    return { type: body.type, data: body.data };
  },
};
