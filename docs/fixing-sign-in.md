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

### 1 · GitHub → one secret, and the deploy does the rest

**Settings → Secrets and variables → Actions → `CLERK_PUBLISHABLE_KEY`**
= `pk_live_…` (or `pk_test_…`).

That single value is now sufficient for both halves:

- the deploy writes it into `js/auth-config.js`, so the **browser** can
  load Clerk;
- the deploy also pushes it to the **Pages project**, so the
  **Functions** can verify what Clerk produces.

A Clerk publishable key encodes the Frontend API host — everything after
the last `_` is base64 of `<host>$`, which is how Clerk's own browser SDK
finds where to load itself from. The server derives
`https://<host>/.well-known/jwks.json` from it.

**This is the fix for the outage, not a convenience.** Two variables that
had to agree, one of which nobody set, is exactly what took admissions
down: the publishable key was configured, `CLERK_JWKS_URL` was not, so
sign-in worked and everything after it failed. One source of truth
cannot disagree with itself.

Add two more to the same place and the deploy pushes those too:

- **`CLERK_SECRET_KEY`** (`sk_live_…`) — lets the College ask Clerk for a
  first-time learner's email address, so no dashboard setting has to be
  remembered. See §4.
- **`CLERK_WEBHOOK_SECRET`** (the `whsec_…` from Clerk → Webhooks) — so
  profile changes reconcile afterwards.

### 2 · Cloudflare Pages → environment variables

**You should not need to touch these.** The deploy sets them before it
publishes, using the Cloudflare credentials it already holds. Set them by
hand only if the deploy warns that it could not — which happens when
`CLOUDFLARE_API_TOKEN` has *Cloudflare Pages: Deploy* but not
*Cloudflare Pages: Edit*. A deploy-only token can publish files and
cannot change project settings.

**Workers & Pages → `wec-lc` → Settings → Environment variables →
Production**, then redeploy (variables apply to *new* deployments; setting
one does not fix the deployment already live).

| Variable | Value | Without it |
|---|---|---|
| `CLERK_PUBLISHABLE_KEY` | the same `pk_…` | **Nobody can be signed in**, unless `CLERK_JWKS_URL` is set instead. |
| `CLERK_JWKS_URL` | `https://<instance>.clerk.accounts.dev/.well-known/jwks.json` | Optional. An explicit setting always wins over the derived one — set it only to point at a specific instance. |
| `CLERK_SECRET_KEY` | the `sk_live_…` from Clerk → API keys | A first-time learner gets an account only if the session token carries an email claim or the webhook already delivered them. |
| `CLERK_WEBHOOK_SECRET` | the `whsec_…` from Clerk → Webhooks | Accounts still work — they are provisioned from the verified token — but Clerk profile changes never reconcile. |
| `CLERK_AUTHORIZED_PARTIES` | `https://worldwencollege.co.uk` | Optional. Without it, any token signed by that Clerk instance is accepted, whichever application minted it. |

### 3 · Cloudflare Pages → D1 binding

**Settings → Functions → D1 database bindings.** Variable name `DB`,
bound to the `wec-lc` database. Without it every endpoint answers 503.

### 4 · Giving a first-time learner an account

Clerk's default session token carries no email address. `users.email` is
`NOT NULL` and an address must never be invented, so a learner can sign
in perfectly and still have no account.

**There are three routes to an address, and any one is enough.** They are
listed in the order they are tried:

1. **The session token carries it.** Clerk dashboard → Sessions →
   Customize session token:
   `{ "email": "{{user.primary_email_address}}" }`
2. **The College asks Clerk directly.** With `CLERK_SECRET_KEY` set, the
   Functions call `GET /v1/users/{id}` on the provisioning path — once
   per learner, ever — and read the primary verified address.
3. **The sign-in webhook already delivered them.** Best-effort and
   retried, so it may or may not have arrived by first use.

**Route 2 is why this is no longer a dashboard errand.** It needs a key
you already have from Clerk, added in the same place as the publishable
key — Settings → Secrets and variables → Actions → `CLERK_SECRET_KEY` —
and the deploy pushes it to the Pages project like the rest. Nobody has
to remember a setting in a second console, which is exactly how the
original outage happened.

Only the primary address is taken, and only when Clerk reports it
verified. `users.email` is what a transcript, a certificate and every
notification are addressed to, and "somebody typed this into a form" is
not the same claim as "somebody proved they read mail there". If the
provider cannot answer — no key, a 404, an outage, a user with no
verified address — nothing is invented and the learner gets an honest
error naming the missing key.

`GET /api/health/auth` reports which of the three routes are open under
`accountProvisioning`. It is not blocking: any one suffices.

**This case once produced a loop.** The error was a plain 401, which
every client reads as "your session expired, sign in again" — so the
applicant signs in again, Clerk succeeds again, the token still carries
no email, and they arrive at the same message. Nothing they could do
resolved it and the instruction they were given guaranteed they kept
trying. It now has its own error class, its own message, and no sign-in
button.

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

- `ready: true`, HTTP 200 — a session can be verified, the provider
  answers, and the record can be read.
- `ready: false`, HTTP 503 — `blocking` names what is wrong.
- HTTP 404 — Pages Functions are not running on this project at all.
  Check that `functions/` reached the deploy surface.

`accountProvisioning`, `accountWebhook` and `authorizedParties` report
but never block. Provisioning has three routes and any one is enough;
the webhook only degrades reconciliation; authorized parties is optional
hardening.

### Configured, and still nobody can sign in

Two of the checks — `providerReachable` and `browserSignIn` — do not read
the environment. They contact the Clerk instance this deployment names:
one fetches its signing keys, the other requests the exact
`clerk.browser.js` URL `js/clerk-loader.js` puts in the page.

They exist because every other check on this endpoint can pass on a
deployment where sign-in is completely dead. A Clerk **production**
instance serves its Frontend API from a domain of the College's own —
`clerk.worldwencollege.co.uk` — and that domain answers nothing until
the DNS records Clerk asks for have been added at the registrar and
verified in the Clerk dashboard. In that state:

- the publishable key is valid,
- the derived JWKS URL is correct,
- the key prefixes match the instance,
- **and no sign-in form appears on any page at all**, because the
  browser's `<script>` for Clerk never loads.

The symptom is not "sign-in refused". It is a page that does nothing,
which reads to everybody as the site being broken.

```json
{
  "ready": false,
  "blocking": ["providerReachable", "browserSignIn"],
  "summary": "Sign-in cannot work on this deployment. Everything is configured, but the Clerk instance it names is not answering (providerReachable, browserSignIn). The fix is at the provider, not here."
}
```

**The fix is not in this repository and not in Cloudflare.** Open the
Clerk dashboard → **Domains** (or **Configure → Domains**) for the
**Production** instance and read the DNS records it lists. Each one has
to exist at whoever hosts DNS for `worldwencollege.co.uk` — for a domain
on Cloudflare that is Cloudflare → **DNS → Records** — and each must show
as *verified* in Clerk. Records for `clerk`, `accounts`, `clkmail` and
two `clk*._domainkey` subdomains are the usual set. Clerk verifies them
itself once they resolve; nothing needs redeploying afterwards, though a
redeploy is a quick way to make this endpoint say so.

#### HTTP 530 — the one this site actually hit

On 24 August 2026 the live deployment reported:

```
"providerReachable": { "ok": false, "status": 530 }
"browserSignIn":     { "ok": false, "status": 530 }
```

Everything else was correct: production instance, matched
`pk_live_`/`sk_live_` keys, D1 bound, authorized parties set. **530 is
Cloudflare's "Origin DNS error" (1016)**: a DNS record for
`clerk.worldwencollege.co.uk` exists and points at Cloudflare, and
Cloudflare cannot resolve what is behind it.

A CNAME on Cloudflare DNS must be **DNS only** (grey cloud), not
proxied. A proxied record answers with Cloudflare's certificate rather
than Clerk's and the browser refuses the script — and when the target
behind it does not resolve, Cloudflare returns 530 instead.

**The fix, in full:**

1. Cloudflare dashboard → the `worldwencollege.co.uk` zone → **DNS →
   Records**.
2. Find the record whose name is `clerk`.
3. Its **Proxy status** column will read *Proxied* with an orange cloud.
   Click the cloud so it turns grey and reads **DNS only**. Save.
4. Do the same for every other record Clerk asked for — `accounts`,
   `clkmail`, and the two `clk*._domainkey` records. All of them are
   DNS-only.
5. If a record Clerk lists is missing entirely, add it exactly as Clerk
   states it, DNS only.
6. Clerk dashboard → **Domains** → verify. Clerk re-checks the records
   itself; nothing needs redeploying, though a redeploy makes
   `/api/health/auth` say so.

Re-read `/api/health/auth` afterwards. `providerReachable` and
`browserSignIn` both reporting `ok: true` is the proof — the first
counts the signing keys it received, the second requests the exact
`clerk.browser.js` URL the browser will.

#### Can the deploy do this itself?

Not with the token it has today. Every deploy runs
`scripts/clerk-dns.mjs`, which reads the Cloudflare zone behind the
Clerk host and prints each record with its proxy status; a run
dispatched with **fix_clerk_dns** enabled switches the proxied ones to
DNS only. It only ever touches CNAMEs whose target is a Clerk-owned
host, so the site's own proxied records are never altered.

On 24 August 2026 it reported:

```
This API token can be used, but it can see no DNS zones at all — which is
what a token scoped to Pages, D1 and R2 looks like. That is a statement
about the TOKEN, not about clerk.worldwencollege.co.uk.
```

`CLOUDFLARE_API_TOKEN` holds Pages, D1 and R2 permissions and no Zone
permissions, and Cloudflare answers a zone query from such a token with
an empty list rather than a refusal. To let the deploy do the repair,
add **Zone → Zone → Read** and **Zone → DNS → Edit**, scoped to
`worldwencollege.co.uk`, to that token — or leave the token as it is and
make the change by hand. Both routes end in the same place; the manual
one is faster once.

Switching the site back to the Clerk **development** instance —
`pk_test_`/`sk_test_` keys, a `*.clerk.accounts.dev` Frontend API that
needs no DNS at all — is the other way out, and it works immediately.
It is the right choice for a preview and the wrong one for a live
admissions round: development instances are rate-limited and their
sessions are not meant to carry real applicants.

---

## What an applicant now sees

| What actually happened | What they are told | What they can do |
|---|---|---|
| Device offline | "We could not reach the College" | Try again |
| Sign-in service unreachable | "We could not reach the sign-in service" — with what to check | Reload |
| Token expired | "Your session has expired" | Sign in again |
| Wrong account | "This account cannot open an application" | Sign in again |
| Signed in, and no address obtainable by any of the three routes | "Your account is not finished being set up" — naming the missing key, and saying signing in again will not change it | Write to Admissions |
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
