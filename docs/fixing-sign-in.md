# Making sign-in work on the live deployment

Written after an applicant signed in successfully at 08:21 and was told
their application could not be loaded. Nothing was wrong with their
application, their account or their device.

**Check this first, before reading anything else:**

    https://worldwencollege.co.uk/api/health/auth

It answers in one request. `"ready": true` means this deployment can
verify a session and read the record. `"ready": false` lists exactly
what is missing, by name.

---

## What went wrong, precisely

Four things, and each was individually defensible.

1. **`CLERK_JWKS_URL` was not set** on the Cloudflare Pages project.
   Without it no session token can be verified, so every authenticated
   request fails — *after* sign-in has already succeeded. Clerk signs
   the applicant in; the College cannot check the resulting token.

2. **The adapter threw a plain `Error`** for that missing variable.

3. **`errorResponse()` masks every 500** as "Something went wrong." That
   is correct for an unexpected error, whose message might carry a query
   or a row value. It was applied to a configuration fault too, whose
   message names only which variable is absent.

4. **The wizard summarised instead of classifying.** Every failure — a
   dropped connection, an expired token, a misconfigured deployment —
   produced the same sentence: *"this is usually temporary."* For a
   missing environment variable it is never temporary, and the page
   offered a **Try again** button that could not have worked on any
   attempt.

The applicant did the only thing available to them, repeatedly, and
nothing in the system could tell them or us why.

## What has changed

- A configuration fault is now a **503 with its own message**, not a
  masked 500. Unexpected errors are still masked.
- `/api/health/auth` reports which prerequisites are present. It is
  unauthenticated by necessity: an endpoint reachable only once sign-in
  works cannot explain why sign-in does not work. It returns booleans
  and fixed sentences — no secret, no environment value.
- The wizard **classifies**: offline, session expired, wrong account,
  deployment not configured, server error. Each gets its own sentence
  and its own action, and only the genuinely transient cases offer a
  retry.
- A stale token is **retried once** with a freshly minted one. Clerk
  tokens last about a minute; a phone that slept between sign-in and
  the first request produced a hard failure for a perfectly valid
  session.
- "Could not reach the sign-in service" is now **its own state**. It
  used to show the panel beginning *"You signed in, but…"* — to people
  who had not signed in.
- Every deploy now probes `/api/health/auth` and writes the verdict into
  the run summary. It warns rather than fails, because these variables
  are set in Cloudflare and not in this repository — but it can never
  again be silent.

---

## The settings

### 1 · Cloudflare Pages → environment variables

**Workers & Pages → `wec-lc` → Settings → Environment variables →
Production.** Add, then redeploy (variables apply to *new* deployments —
setting one does not fix the deployment already live).

| Variable | Value | Without it |
|---|---|---|
| `CLERK_JWKS_URL` | `https://<instance>.clerk.accounts.dev/.well-known/jwks.json` | **Nobody can be signed in.** Sign-in appears to succeed and every page then fails. |
| `CLERK_WEBHOOK_SECRET` | the `whsec_…` from Clerk → Webhooks | Accounts still work — they are provisioned from the verified token — but Clerk profile changes never reconcile. |
| `CLERK_AUTHORIZED_PARTIES` | `https://worldwencollege.co.uk` | Optional. Without it, any token signed by that Clerk instance is accepted, whichever application minted it. |

Find the instance host by decoding the publishable key: everything after
the last `_` is base64 of the Frontend API host. `js/clerk-loader.js`
does exactly this in the browser, so the host is already public.

### 2 · Cloudflare Pages → D1 binding

**Settings → Functions → D1 database bindings.** Variable name `DB`,
bound to the `wec-lc` database. Without it every endpoint answers 503.

### 3 · GitHub → the publishable key

**Settings → Secrets and variables → Actions.**
`CLERK_PUBLISHABLE_KEY` = `pk_live_…` or `pk_test_…`.

The deploy writes it into `js/auth-config.js`. Without it the site
deploys as a design preview and the wizard says so — that is the
"Sign-in is not switched on yet" state, which is a different and more
honest failure than the one this document is about.

### 4 · Clerk → the session token

**Clerk dashboard → Sessions → Customize session token.** Add the email
claim:

```json
{ "email": "{{user.primary_email_address}}" }
```

Clerk's default session token carries no email. `users.email` is
`NOT NULL` and an email address must never be invented, so without this
claim an applicant whose webhook has not yet arrived gets an explicit
error instead of an account. With it, first sign-in provisions
immediately and the webhook reconciles afterwards.

**This one produced a loop.** The error was a plain 401, which every
client reads as "your session expired, sign in again" — so the applicant
signs in again, Clerk succeeds again, the token still carries no email,
and they arrive at the same message. Nothing they could do resolved it
and the instruction they were given guaranteed they kept trying. It now
has its own error class, its own message, and no sign-in button.

---

## Reading the health response

```json
{
  "ready": false,
  "blocking": ["sessionVerification"],
  "summary": "Sign-in cannot work on this deployment until these are configured: sessionVerification.",
  "checks": { "...": "..." }
}
```

- `ready: true`, HTTP 200 — a session can be verified and the record read.
- `ready: false`, HTTP 503 — `blocking` names what to set.
- HTTP 404 — Pages Functions are not running on this project at all.
  Check that `functions/` reached the deploy surface.

`accountWebhook` and `authorizedParties` report but never block: the
first degrades reconciliation, the second is optional hardening.

---

## What an applicant now sees

| What actually happened | What they are told | What they can do |
|---|---|---|
| Device offline | "We could not reach the College" | Try again |
| Sign-in service unreachable | "We could not reach the sign-in service" — with what to check | Reload |
| Token expired | "Your session has expired" | Sign in again |
| Wrong account | "This account cannot open an application" | Sign in again |
| Signed in, but no email claim | "Your account is not finished being set up" — and that signing in again will not change it | Write to Admissions |
| Deployment misconfigured | The deployment's own explanation, plus: this is not something you can fix by trying again | Write to Admissions, with a reference to quote |
| Server error | "This is usually temporary" | Try again |

Only the last two rows are the sentence that used to be shown for all
six.

---

## Held by

`tests/admissions-availability.test.mjs` — 43 assertions covering the
error-status contract, the health endpoint including that it never
returns a secret, every branch of the client classifier, the distinct
auth-unreachable state, and that a 401 is retried exactly once.

Sabotage-verified: re-mask `ConfigError`, throw a bare `Error` for the
missing variable, let the misconfigured branch offer a retry again,
point the unreachable handler back at the "you signed in" panel, and
leak a secret from the health endpoint. Each fails by name.
