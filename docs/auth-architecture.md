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

## Client-side integration and the portal pattern

Three shared scripts, loaded in this order, form a "flagship" pattern
every portal page after the Student Portal (Faculty, Administration,
Executive, Corporate, Alumni — see `docs/master-roadmap.md`) should
build on rather than reimplement:

1. **`js/auth-config.js`** — one config value, `clerkPublishableKey`,
   shipped empty. The single line that needs a real value at
   deployment; see the file's own comment for why it's safe to ship
   publicly.
2. **`js/clerk-loader.js`** — `window.WEC_LC_loadClerk(publishableKey, done)`.
   Decodes the key to find Clerk's Frontend API host, loads
   `clerk.browser.js` from it, calls `Clerk.load()`, and hands back the
   ready `Clerk` instance. The one place this project's Clerk
   CDN-loading approach lives.
3. **`js/portal-guard.js`** — `window.WEC_LC_guardPortal({ signOutRedirect, onAuthenticated })`.
   The reusable shell: with no key configured, it's a no-op (returns
   `false`) and the page stays whatever static preview it already is.
   With a key configured, it shows a full-page `.auth-gate` loading
   overlay, loads Clerk, redirects to Clerk's hosted sign-in if no
   session exists, wires the page's `[data-sign-out]` link to a real
   `Clerk.signOut()`, and then calls `onAuthenticated(clerk, done)` —
   the one part every portal actually differs on.

A new portal's own script (`js/portal-auth.js` for the Student Portal,
`js/finance-dashboard.js` for Finance — see
`docs/payments-architecture.md` § Financial reporting &
reconciliation) is only ever the `onAuthenticated` callback: what
identity/role check to run and what data to fetch and render. Nothing
about the gate, the redirect, or sign-out needs to be rewritten per
portal — that's the entire point of "flagship implementation other
portals inherit."

**Role-gating is opt-in per portal, not part of the shared shell.**
The Student Portal's callback (`js/portal-auth.js`) trusts any signed-in
Clerk user (it's the student's own account). The Finance dashboard's
callback (`js/finance-dashboard.js`) additionally calls `/api/auth/me`
and checks `role`, showing an access-denied state for a non-staff
account — because *that* page's data is sensitive across users, not
because the shared guard enforces it. A future Faculty or Executive
portal would follow the same choice its own data calls for. In every
case the client-side check is defense-in-depth only: the actual
authorization boundary is server-side (`requireUser()` /
`requireStaff()` in `functions/_lib/auth/session.js`), which rejects an
unauthorized caller regardless of what any frontend script does.

The Student Portal preview pages (`student-portal/preview/` and
`student-portal/preview/profile/`) load all three shared scripts plus
`js/portal-auth.js`.

**Empty (shipped default):** `portal-auth.js` does nothing at all. Both
pages behave exactly as they always have — a static, illustrative
design preview, `noindex`ed, no auth calls attempted. This is verified
by a Playwright regression check, not assumed.

**Set to a real key:** the same markup and script begin gating the page
behind a real Clerk session with no further frontend changes, the same
"provisional building, seamless transition" pattern used for the
admissions form (`docs/api-reference.md` § Frontend Integration
Pattern):

1. A full-page `.auth-gate` overlay (`css/dashboard.css`) appears while
   the Clerk client SDK loads and checks for a session.
2. No session → `Clerk.redirectToSignIn({ redirectUrl: <this page> })`.
   WEC-LC does not build or maintain a custom sign-in form — Clerk's own
   hosted Account Portal handles sign-in/sign-up, and returns the
   browser here once authenticated.
3. A session exists → `[data-user-name]` / `[data-user-initials]` /
   `[data-user-email]` elements across the page (the sidebar avatar, the
   topline greeting, the Profile screen's name/email fields) are
   populated from `clerk.user`, the `(demo)`/`(preview)` tags
   (`[data-demo-tag]`) are hidden, and the Sign Out link becomes live
   (`clerk.signOut()`).
4. `GET /api/auth/me` is then called with the session token to layer in
   WEC-LC's own record (today: `preferredName`) beyond what Clerk's
   `user` object knows. This call is best-effort: if it isn't reachable
   yet, Clerk auth has still genuinely succeeded, so the page keeps
   working with Clerk-only identity data rather than showing an error
   over a secondary fetch failing.
5. The Security panel's "Change" (password) and "View" (active
   sessions) buttons deep-link into Clerk's own hosted account UI via
   `clerk.openUserProfile()` — WEC-LC doesn't rebuild password/2FA/
   session-management screens Clerk already provides.

**What this now does, beyond identity:** `GET /api/student/dashboard`
(`docs/api-reference.md` § Student) is also called from
`js/portal-auth.js`, and its response replaces several previously-always-
illustrative pieces with this student's real data: the programme-progress
stepper's completed/current level markers, the "Current Level" stat
tile, the sidebar's level line, and a new "Payment History" panel. A
student with no enrolments yet, or no payments yet, sees a real "not
yet enrolled" / "no payments on record" state rather than fabricated
numbers.

**What this still does *not* do:** classes, assignments, digital
library content, attendance and units-completed remain the existing
illustrative data regardless of auth state — no LMS integration exists
to back them with something real (see `docs/master-roadmap.md`,
Decision: LMS), and `/api/student/dashboard`'s response shape
deliberately doesn't invent fields for them either.

**Implemented against, not tested against:** the CDN-loading approach
(decode the publishable key to find the Frontend API host, then load
`clerk.browser.js` from it) is Clerk's documented framework-less
integration path, chosen specifically because it needs no bundler,
matching this site's zero-build-step philosophy. It has not been
exercised against a real Clerk instance — same caveat as the rest of
this section.

## Request flow

```
Browser (now carries js/portal-auth.js on Student Portal pages — see
above)
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

## Security hardening added during the production-readiness audit

- **Timing-safe signature comparison.** `verifyWebhookSignature`'s Svix
  check (and every payment gateway adapter's own signature check) now
  compares the computed vs. received signature with `timingSafeEqual()`
  (`functions/_lib/db.js`) instead of plain `===` — a naive
  early-exit string comparison leaks timing information proportional
  to how many leading bytes match, a real (if narrow) attack surface
  for anything guarding a secret.
- **Optional authorized-party check.** `verifySessionToken` now also
  checks `payload.azp` against `env.CLERK_AUTHORIZED_PARTIES`
  (comma-separated allowed origins) *if that env var is set* — off by
  default, so it changes nothing until deployment deliberately
  configures it. Without it, any token signed by keys behind
  `CLERK_JWKS_URL` is accepted regardless of which Clerk-connected
  application minted it — worth setting once this Clerk instance backs
  more than one frontend (a real future case, per the
  Faculty/Administration/Executive/Corporate/Alumni portal pattern
  described above).

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
