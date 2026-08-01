# WEC-LC — Authentication Architecture

*Companion to `technical-architecture.md`. Clerk is the provisional
choice (per your instruction); this document is what makes "another
provider can be substituted if required" true in practice rather than
aspiration.*

---

## The boundary

`functions/_lib/auth/session.js` is the only file any API endpoint
imports for authentication. It exports two things:

- `requireUser(request, env)` — verifies the bearer token, looks up
  (never creates) the corresponding `users` row, throws `AuthError`
  (401) if either step fails.
- `upsertUserFromProviderEvent(env, {...})` — called only from the
  provider's webhook handler, the sole place a `users` row is written
  from provider-supplied data.

Everything Clerk-specific — JWT structure, JWKS fetching, Svix webhook
signatures — lives in `clerk-adapter.js`, which implements
`provider-interface.js`. `session.js` imports `clerkAdapter` on a
single line:

```js
const provider = clerkAdapter;
```

Substituting Auth0 (or anything else) means writing an
`auth0-adapter.js` implementing the same three-method interface
(`verifySessionToken`, `verifyWebhookSignature`, `parseWebhookEvent`)
and changing that one line. No endpoint file changes.

---

## Why no `@clerk/backend` SDK

Clerk's official Node SDK works, but it's Node-oriented and adds a
dependency tree to what is, underneath, two well-documented, standard
operations:

1. **Verify a JWT** — decode the header, fetch Clerk's JWKS, find the
   matching key by `kid`, verify the RS256 signature with the Web
   Crypto API (`crypto.subtle.verify`), check `exp`/`nbf`. All native
   to the Workers/Pages Functions runtime.
2. **Verify a webhook** — Clerk uses Svix, whose signature scheme is a
   standard HMAC-SHA256 over `${svix-id}.${svix-timestamp}.${rawBody}`,
   also native via `crypto.subtle`.

Implementing both directly (`clerk-adapter.js`) keeps the whole
backend dependency-free — consistent with the public site's existing
zero-framework philosophy — and keeps every other Pages/Workers-style
platform (Vercel Edge Functions, Netlify Edge Functions) able to run
this same file unchanged, since none of them special-case a Clerk SDK
either.

---

## Request flow

```
Browser (Clerk's own client-side SDK — not yet added to any page)
  → gets a session JWT from Clerk
  → sends it as `Authorization: Bearer <jwt>` to any WEC-LC API endpoint

functions/api/.../whatever.js
  → requireUser(request, env)
      → clerkAdapter.verifySessionToken(jwt, env)   [signature + expiry check, no network call
                                                       once JWKS is cached — see JWKS_TTL_MS]
      → look up users WHERE auth_provider_id = jwt.sub
      → return the row, or throw 401
```

```
Clerk Dashboard → user.created / user.updated webhook
  → functions/api/auth/webhook-clerk.js
      → clerkAdapter.verifyWebhookSignature(...)     [Svix HMAC check]
      → upsertUserFromProviderEvent(...)              [writes/updates the `users` row]
```

**Deliberate asymmetry:** a user record is never created from a
client-presented JWT, only from a verified webhook. A forged or replayed
JWT for a `sub` that was never actually provisioned by Clerk simply
finds no matching `users` row and gets a 401 — it can't cause an
account to spring into existence.

---

## What's genuinely untested here

JWT/JWKS verification and Svix signature verification are implemented
against Clerk's publicly documented schemes, but neither has been
exercised against a **real** Clerk instance (no account exists) — only
syntax-checked and import-checked (see `docs/api-reference.md`
§ Verification). The cryptographic primitives (`crypto.subtle.verify`
with RSASSA-PKCS1-v1_5/SHA-256, HMAC-SHA256) are standard and correctly
used, but "correctly used against the spec" and "verified against a
real Clerk session token" are different claims — only the first is
true today. Confirming the second is a five-minute check once a real
Clerk instance exists, not a redesign.
