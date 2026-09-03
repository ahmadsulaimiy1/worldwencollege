# WEC-LC — Technical Architecture

*Companion to `master-roadmap.md` Phase 11 and the Stage C entry in its
Recommended Sequencing table. Written the same session Stage C began —
this is the "implementation-first" build, not a plan for one.*

**Status: real, tested code — zero real deployments.** Every claim in
this document about behaviour is backed by either a passing syntax/
import check or an end-to-end test against a real (in-memory) SQLite
database (see `docs/api-reference.md` § Verification). Every claim
about a *live* Cloudflare/Stripe/Clerk/etc. account is explicitly
false until Decisions #1–#7 in `master-roadmap.md` are resolved and
someone runs the setup steps below.

---

## Deployment target: Cloudflare Pages, designed to stay portable

**Provisional assumption (per your instruction), not yet actioned:**
Cloudflare Pages + Pages Functions + D1.

Why this fits without over-committing:

- The public site is already a static build (`scripts/build.js` → flat
  HTML) — Pages serves that unchanged, no migration needed.
- **Pages Functions are just files that export `onRequestGet`/
  `onRequestPost`, importing plain ES modules.** Nothing in
  `functions/` imports a Cloudflare-specific SDK — the only
  Cloudflare-specific surface is `context.env.DB` (the D1 binding) and
  the global `crypto`/`fetch` APIs, both of which are also natively
  available in Vercel Edge Functions and (with light adapter work)
  Netlify Functions. Moving platforms means rewriting the thin
  `onRequestX` export signatures and the D1 binding access in `db.js`
  — not the business logic in `_lib/`.
- D1 is SQLite. The entire test suite behind this build runs the exact
  same `sql/schema.sql` against Node's `node:sqlite` — meaning the
  schema and every query in `functions/` is already proven
  SQLite-compatible, which is what actually matters for portability
  (Turso, LiteFS, and plain SQLite-on-a-VM are all drop-in alternatives
  to D1 specifically because of this).

### Setup sequence (not yet run — needs Decision #1 + #7)

```
wrangler d1 create wec-lc                                  # get a real database_id
# paste that id into wrangler.toml's database_id field
npm run db:provision                                       # schema AND the curriculum
wrangler pages secret put STRIPE_SECRET_KEY                # repeat per .env.example
wrangler pages deploy .
```

**`db:provision`, not `db:schema`.** This line used to read
`npm run db:schema`, and that was the single most consequential
sentence in this document, because it was wrong in a way nothing
caught.

`sql/schema.sql` creates every table and seeds six rows into `courses`
— and nothing at all into `units` or `learning_items`. The programme
itself, all 60 modules, 294 learning items and 660 quiz questions,
lives in `sql/seed-curriculum-level-1.sql` … `-6.sql`. Sixteen scripts
in this repository read those files; the provisioning step did not. A
College set up exactly as this page instructed would have taken a
learner's money and handed them a programme page listing six levels
with nothing inside any of them.

`scripts/provision-db.mjs` loads both, in the order the foreign keys
require, stops on the first failure rather than skipping past it, and
then asks the database level by level whether modules actually arrived
— exiting non-zero if any level came out empty. `npm run
db:provision:local` does the same against the local D1, so nobody has
to try it on the real one first.

`tests/provisioning.test.mjs` holds it: it builds a database from
exactly the file list that script exports and fails if any level is an
empty shell, if a quiz has no questions, if a reading has no text, or
if an answer key points past the end of its own choices.

**One thing is deliberately not provisioned:** the level examination
papers. A paper is an academic decision, authored and published by the
Registrar at `/staff-papers.html`; seeding one would be the platform
setting its own standard. Until a paper is published for a level,
learners can study that level but cannot sit it — which is also
asserted, so it stays a decision rather than becoming an oversight.

---

## System map

```
Public website (existing, static)
        │  reads programme facts, links to
        ▼
Admissions apply (functions/api/admissions/apply.js)  ──► D1: applications
        │  (offline: Admissions reviews, sets placement_level_id)
        ▼
Account creation (Clerk, client-side — js/clerk-loader.js + js/portal-guard.js,
                   wired into every portal page; a no-op until a real
                   publishable key is configured — see auth-architecture.md)
        │  Clerk webhook syncs the user
        ▼
functions/api/auth/webhook-clerk.js  ──► D1: users
        │
        ▼
Payment checkout (functions/api/payments/create-checkout.js)
        │  picks currency + gateway via _lib/payments/router.js
        ▼
Stripe / Paystack / Flutterwave / Opay  ──►  webhook  ──►  D1: payments, receipts
        │
        ▼
Enrolment (functions/api/enrolment/confirm.js)  ──►  D1: enrolments
        │  full-programme payments start at Level I; later levels unlock
        │  automatically via progression.completeLevel() — see
        │  docs/lms-architecture.md and docs/payments-architecture.md
        ▼
Student Portal (js/portal-auth.js — with a real Clerk key configured,
                GET /api/auth/me + GET /api/student/dashboard replace
                the illustrative stepper/stat-tiles/payment history
                with this student's real data; with no key, the
                preview pages stay exactly the static demo they ship as)

Admin Reports (separately, administrator only — js/staff-finance.js
               + requireStaff() ──► GET /api/admin/reports/{revenue,reconciliation}
               ──► D1: payments, payment_webhook_events, receipts — see
               payments-architecture.md § Financial reporting & reconciliation)
```

Every arrow above that isn't yet backed by a real third-party account
is still backed by real, tested code — see `docs/api-reference.md` for
which endpoints are fully exercised vs. which throw a clear
"not configured" error until secrets exist, and `tests/README.md` for
how to run that verification yourself.

---

## Directory layout

```
functions/
  _lib/                    Shared logic — nothing here is Cloudflare-specific
    db.js                  D1 helper + shared error types
    currency.js            Config-driven currency/FX/routing (no hardcoded rates)
    auth/
      provider-interface.js  The contract every auth provider must meet
      clerk-adapter.js       Clerk, via JWKS + Svix — no SDK dependency
      session.js              requireUser() — the ONLY import endpoints use for auth
    payments/
      provider-interface.js  The contract every gateway must meet
      stripe-adapter.js / paystack-adapter.js / flutterwave-adapter.js / opay-adapter.js
      router.js               Picks a gateway, exposes one createCheckout() call
      webhook-handler.js       Shared verify→idempotency→update logic, used by all 4 webhooks
    notifications/
      provider-interface.js
      resend-adapter.js
      events.js                notify() — the ONLY import endpoints use for email
    lms/
      provider-interface.js  Contract only — no vendor chosen (Decision #6 provisional)
    reports/
      revenue.js              buildRevenueReport() — totals/breakdowns, USD-normalised
      reconciliation.js       buildReconciliationReport() — webhook/payment integrity checks
    student/
      dashboard.js            buildStudentDashboard() — a student's own enrolment/payment data
  api/                     Thin HTTP handlers — validate input, call _lib/, return JSON
    admissions/            apply.js, status.js
    payments/              create-checkout.js, verify.js, webhook-{stripe,paystack,flutterwave,opay}.js
    auth/                  webhook-clerk.js, me.js
    enrolment/              confirm.js
    admin/reports/          revenue.js, reconciliation.js — administrator only (requireAdmin())
    student/                dashboard.js — the caller's own data only, no id param accepted
sql/schema.sql             The full data model — see its own header comments
wrangler.toml               Cloudflare Pages + D1 config (placeholder database_id)
.env.example                 Every secret this platform needs, none of them set
tests/                        npm test — functional tests against a real SQLite engine
                              (see tests/README.md for what's covered vs. still can't be
                              from here without a live third-party account)
```

**Design rule enforced throughout:** an `api/` file never imports a
provider adapter directly, and a provider adapter never imports
another provider's adapter. The only files that know how many
payment gateways or auth providers exist are `router.js` and
`session.js`, respectively. That's the whole mechanism behind
"minimal rework when a decision changes" — swapping Clerk for Auth0
touches one `import` line in `session.js`; adding a fifth payment
gateway touches one line in `router.js`'s `GATEWAYS` map.

---

## Data flow: where money is never double-counted

- `payments.amount_cents` is in whatever currency the student paid in.
- `payments.amount_usd_cents` is always also stored, computed at
  checkout time from the (real, policy-set) FX rate — so financial
  reporting (`GET /api/admin/reports/revenue`, working — see
  `docs/payments-architecture.md` § Financial reporting &
  reconciliation) can sum across currencies without re-deriving
  historical rates later.
- `payment_webhook_events` logs every webhook received, verified or
  not, keyed on `(provider, event_id)` — a gateway retry is a 200
  response, not a duplicate `payments` update or a duplicate
  enrolment.

---

## What this document is not

It is not a claim that WEC-LC has a working payment system. It's a
claim that the *shape* of the payment system — where currency
conversion happens, how a gateway's webhook maps back to our own
record, what happens when two webhooks for the same event arrive — has
already been decided and tested, so that plugging in real credentials
later is configuration, not design work.
