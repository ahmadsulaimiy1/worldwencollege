# WEC — Payments Architecture

*Companion to `technical-architecture.md`. Answers, specifically: which
of the requested payment features exist as working code today, which
exist as a ready-to-build schema, and why the split falls where it
does.*

---

## The provider-agnostic core

Every payment, regardless of gateway, is one row in `payments` with
exactly two gateway-specific fields: `provider` and `provider_ref`.
Everything else — status, amount, currency, which level/instalment it
paid for — is uniform. This is enforced by
`functions/_lib/payments/provider-interface.js`: every adapter
(`stripe-adapter.js`, `paystack-adapter.js`, `flutterwave-adapter.js`,
`opay-adapter.js`) implements the same four methods
(`createCheckout`, `verifyWebhookSignature`, `parseWebhookEvent`,
`refund`), so `functions/api/payments/create-checkout.js` and the four
`webhook-*.js` endpoints don't contain a single `if (gateway ===
'stripe')` branch anywhere.

**No gateway is tightly coupled to the core application** — the
literal instruction — is true today in the sense that matters: delete
any one adapter file and only `router.js`'s `GATEWAYS` map needs a
one-line edit. The rest of the platform doesn't know it existed.

---

## Multi-currency, without inventing exchange rates

`currencies` is a database table, not a constant in code. Today it
holds all seven requested currencies (GBP, USD, NGN, SAR, AED, QAR,
KWD) — but only **USD is `is_active`**, because it's the only one with
a real, confirmed rate (1.0, itself). Every other currency has
`fx_rate_to_usd = NULL`, and `currency.js`'s `convertFromUsdCents()`
**refuses** to convert into a currency with a null rate — tested
explicitly (see `docs/api-reference.md` § Verification, "currency:
refuses to convert to an inactive currency").

This means: right now, the platform will only ever offer USD at
checkout. That's not a limitation I ran out of time on — it's the
direct consequence of not fabricating exchange rates. Activating GBP,
NGN, SAR, AED, QAR, or KWD means one of:

1. A real FX data feed gets connected, updating `fx_rate_to_usd` /
   `fx_rate_source` / `fx_rate_as_of` on a schedule, or
2. WEC sets a **policy-fixed** rate (common for tuition — many
   institutions intentionally don't float tuition with daily FX) and
   an admin sets it once, with `fx_rate_source = 'policy_fixed'`.

Both paths are now real, working code — `functions/_lib/currency/`:

- **`fx-provider-interface.js`** — the swappable contract (one method,
  `getRates`), the same pattern as the payment-gateway and auth
  provider interfaces. Nothing outside this directory imports a
  provider adapter directly.
- **`frankfurter-adapter.js`** — a real adapter against Frankfurter
  (frankfurter.app), a free, no-API-key ECB reference-rate feed.
  **Genuine limitation, stated in its own header rather than hidden:**
  ECB reference rates cover GBP but not NGN, SAR, AED, QAR, or KWD —
  those five need a different provider (a straightforward future
  adapter behind the same interface) or a policy-fixed rate. Like
  every payment gateway adapter, this is implemented against
  Frankfurter's documented API shape but not exercised against the
  live endpoint — this environment's network policy blocks outbound
  calls to arbitrary third-party hosts (confirmed during this session).
- **`fx-service.js`** — `refreshFromLiveFeed()` (calls a provider,
  applies whatever rates it actually returns — a currency the feed
  doesn't cover is reported back, never guessed) and
  `setPolicyFixedRate()` (the staff-driven path for the five Gulf/
  Nigeria currencies, and an alternative for GBP too if WEC prefers
  a fixed tuition-equivalent rate over a floating one). Neither
  function ever flips `is_active` implicitly — activation is always a
  separate, explicit `activate: true`, so a rate can be staged before
  a currency goes live at checkout.
- **`POST /api/admin/currency/set-rate`** / **`POST
  /api/admin/currency/refresh-rates`** — administrator-only endpoints (governance A5, adopted 14 Aug 2026)
  over the above. 18 fixture-based assertions in
  `tests/currency-fx.test.mjs` cover the DB-writing logic directly
  (including the "provider doesn't cover this currency" and "rate is
  invalid" rejection paths) and a stubbed-provider version of the
  live-feed path, since the real feed can't be reached from this
  environment.

Either way is now a config change through a real endpoint (`UPDATE
currencies SET is_active=1, fx_rate_to_usd=..., fx_rate_source=...
WHERE code=...`, or the endpoints above), never a code change.
**Decision #2 (currency policy) confirms GBP/USD as the primary
display currencies** — activating GBP specifically (Frankfurter can
serve it) is now a same-day operational task once a real Cloudflare D1
database exists, not a pricing policy question anymore; the five
Gulf/Nigeria currencies still need either a policy-fixed rate decision
or a second FX provider.

---

## Business policy lives in `platform_config`, not in code

Executive Decision #5 requires refunds, promo codes, scholarships,
corporate invoicing, instalment schedules, and discount rules to stay
"configurable wherever practical." `platform_config` (a generic
`key`/`value` table, JSON-encoded values, read via
`functions/_lib/config.js`) is that mechanism for policy values that
are scalars or small objects rather than full relational records —
today: `full_programme_price_usd_cents` (1900000 — the already-
published $19,000 figure), `full_programme_unlock_mode`
(`"progressive"`), `discount_stacking_policy`
(`{"allowPromoAndScholarship":false}`, a conservative default), and
`instalment_default_count`. A policy that needs real relational
structure keeps its own table instead — `promo_codes`, `scholarships`,
`instalment_plans` above are exactly that.

---

## Feature-by-feature status

| Feature | Status | Where |
|---|---|---|
| Level-by-level (one-time, single-level) payment | **Working** | `create-checkout.js` (`kind='single_level'`, tested against the seeded 6 levels) |
| Full-programme (one-time, all six levels) payment | **Working** — progressive unlock (Executive Decision #1) | `create-checkout.js` accepts `{ fullProgramme: true }` in place of `levelId`, priced from `platform_config.full_programme_price_usd_cents` (see below) rather than a hardcoded constant. `enrolment/confirm.js` creates Level I's enrolment on first confirmation. Levels II-VI are **not** created up front — each unlocks automatically only once the level before it is marked completed, via `functions/_lib/student/progression.js`'s `completeLevel()`. Today `completeLevel()` is called only from the staff-only `POST /api/lms/complete-level` — WEC has no automated grading engine yet, so a human confirms a level is finished; once the LMS's own assessment engine exists (see `docs/lms-architecture.md`), it can call the same function programmatically. 19 fixture-based assertions in `tests/progression-and-config.test.mjs` cover the auto-unlock, its idempotency (no duplicate enrolment on a replayed completion), and that a single-level-only student never gets an unrequested auto-unlock. |
| Instalment plans | **Working** (Executive Decision #5) | `POST /api/payments/instalment-plan` creates a plan (`platform_config.instalment_default_count`, default 4, equal-split cadence — real per-level/currency cadence policy still undecided); `POST /api/payments/create-checkout` accepts `{ instalmentPlanId }` to pay the next instalment; `webhook-handler.js` marks the plan `completed` once every instalment has succeeded. See `functions/_lib/payments/instalments.js`. |
| Scholarships | **Working** (Executive Decision #5) | `scholarships` table; `create-checkout.js` accepts `{ scholarshipId }` (ownership-checked — only the awarded student can use it) and applies it via `functions/_lib/payments/discounts.js`. Real eligibility/award policy is still an institutional decision — this is the *mechanism*, not a policy. |
| Promo codes | **Working** (Executive Decision #5) | `promo_codes` table; `create-checkout.js` accepts `{ promoCode }` and applies it the same way. Stacking a promo code with a scholarship on one payment is governed by `platform_config.discount_stacking_policy` — off by default (conservative), until a real institutional stacking policy is set. |
| Corporate invoicing | Schema-ready | `corporate_accounts` / `corporate_seats` tables exist; no invoicing endpoint yet — needs a real corporate client to design against (see `master-roadmap.md` Phase 4's Corporate Portal reasoning) |
| Receipts | **Working** (record only) | `webhook-handler.js` issues a sequential receipt number on every successful payment (atomically, via the `counters` table — see below), only if one doesn't already exist for that payment; `receipts.pdf_url` stays null — no PDF generation step built |
| Refund workflow | Partially working | `refund()` is implemented for Stripe/Paystack/Flutterwave (Opay explicitly throws — see its adapter's confidence flag); nothing calls it yet, because refund *policy* (who approves, under what circumstances) doesn't exist — `refunds.approved_by` is there waiting for it |
| Financial reporting | **Working** | `GET /api/admin/reports/revenue` (administrator only — governance A5) — totals, and breakdowns by status/currency/level/provider/day, all in USD via `amount_usd_cents` (see `functions/_lib/reports/revenue.js`) |
| Payment reconciliation | **Working**, scoped to what the schema can prove | `GET /api/admin/reports/reconciliation` (administrator only — governance A5) — webhook volume by provider/type/verification, unverified-signature attempts, orphaned webhooks (a verified event naming a payment id that doesn't exist), stale pending/processing payments, succeeded payments missing a receipt. Does **not** cross-check against a gateway's own dashboard — no such integration exists (see below) |
| Secure payment status tracking | **Working** | `verify.js` (student-facing poll) + the `payments.status` state machine (`pending → processing → succeeded/failed → refunded`) |

**How discount stacking avoids silently making a pricing decision:**
applying a discount changes the amount a student is legally charged, so
the stacking rule itself — can a promo code apply on top of a
scholarship? — is read from `platform_config.discount_stacking_policy`
(`functions/_lib/payments/discounts.js`) rather than assumed in code.
The shipped default is conservative (no stacking): a checkout request
supplying both a promo code and a scholarship is rejected with a clear
422 unless a real institutional policy has explicitly turned stacking
on. This is the mechanism Executive Decision #5 asked for
("configurable wherever practical, do not hard-code institutional
policy") — what's still genuinely undecided is the real eligibility
and maximum-discount policy for both scholarships and promo codes,
which stays an operational/admissions decision, not a schema or code
gap. 27 fixture-based assertions in
`tests/discounts-and-instalments.test.mjs` cover the discount math
(including that it never goes negative and that a full scholarship
zeroes the amount regardless of any other discount present), the
ownership boundary on scholarships, and the instalment plan's
per-instalment amount breakdown, retry-safe next-instalment lookup, and
completion tracking.

---

## Executive Decision #3: the phased gateway rollout needs no code change

The requested rollout order — Phase 1: Stripe, Phase 2: Paystack +
Flutterwave, Phase 3: Opay "where appropriate" — is already how
`router.js`'s `suggestGateway()` behaves, without any change: it
filters a country's `preferred_gateways` list down to `isConfigured()`
gateways (those with real env-var credentials actually set), and
suggests the first surviving one. During Phase 1, only
`STRIPE_SECRET_KEY` exists anywhere, so `configured` is `['stripe']`
for every country regardless of that country's routing preference —
Stripe is suggested everywhere, by construction, not because anything
special-cases Phase 1. Once Paystack/Flutterwave credentials are added
(Phase 2), a country whose `preferred_gateways` lists them ahead of
Stripe (e.g. Nigeria: `["paystack","flutterwave","opay","stripe"]`)
starts suggesting Paystack automatically — no deploy, no code change,
just setting the two new Pages secrets. Opay's phase-3 arrival works
the same way. **What this means operationally: the rollout order isn't
something to implement — it's a direct consequence of the order real
merchant credentials get added as Pages secrets.** The one thing worth
confirming before Phase 3: Opay's adapter has its own low-confidence
flag (its field names are implemented against publicly-documented
conventions, not a verified merchant dashboard — see the adapter's own
header) and should be checked against Opay's current docs before its
credentials go live.

---

## UX: suggested, never forced

`functions/_lib/payments/router.js`'s `suggestGateway()` and
`currency.js`'s `suggestRouting()` return a *suggestion* based on
`country_payment_routing` (e.g. Nigeria → NGN/Paystack first). The
checkout endpoint accepts an explicit `currency`/`gateway` in the
request body that always overrides the suggestion — matching "still
allowing the user to choose another supported payment method if
desired" exactly. No endpoint anywhere hard-codes "Nigerian IP address
⇒ must use Paystack."

---

## Security posture already built in, not deferred

- Every webhook is signature-verified **before** its payload is
  trusted (`webhook-handler.js` returns 400 on a failed check, before
  `parseWebhookEvent` even runs).
- Every webhook is logged with a `(provider, event_id)` idempotency
  key — a gateway retrying a webhook cannot double-confirm a payment
  or double-enrol a student. This goes further than same-event-id
  retries: a `handled_at` column (only set once processing completes
  without throwing) means a *partial* failure — e.g. the payment status
  updates but receipt issuance then throws — doesn't get silently
  swallowed by the idempotency check either. A retry of that same event
  re-attempts the remaining steps, which are each individually
  idempotent (receipt issuance checks-before-inserting; the payment
  status UPDATE is a single conditional statement, not read-then-write).
  Receipt numbering itself is drawn from an atomic
  `UPDATE counters ... RETURNING value`, not a `SELECT count(*)` —
  the latter is a real race under concurrent webhook deliveries. See
  `functions/_lib/payments/webhook-handler.js`'s header comment and
  `tests/webhook-handler.test.mjs` for the fixture-proof of all of this.
- Amounts are stored in minor units (cents/kobo) as integers
  throughout — no floating-point currency math anywhere in the payment
  path.
- No payment gateway secret key is ever read from anywhere but
  `env` (Cloudflare Pages secrets) — none are hardcoded, none are in
  `wrangler.toml`, none are in this repo's git history.

This satisfies "provider-agnostic, scalable, secure, and easy to
maintain" as a design property proven by tests, not asserted as a
claim about an unbuilt system.

---

## Financial reporting & reconciliation

Two staff/admin-only endpoints, both role-gated by
`requireStaff()` (`functions/_lib/auth/session.js` — checks
`users.role IN ('staff','admin')`, a WEC-owned field, not anything
Clerk-asserted). Their query logic lives in `functions/_lib/reports/`,
deliberately separated from the HTTP/auth wrapper so it can be
functionally tested directly against fixture data (21 assertions
against a real SQLite engine — successful-payment totals, refund
netting, currency/level/provider/day breakdowns, date-range filtering,
and every reconciliation signal below — rather than only import-checked
like most of the rest of this untested-against-a-real-account backend).

**`GET /api/admin/reports/revenue`** — totals plus breakdowns by
status, currency, level and provider, all summed via
`amount_usd_cents` so nothing here ever needs a display exchange rate
(see § Multi-currency above). Accepts optional `from`/`to` ISO-date
query params.

**`GET /api/admin/reports/reconciliation`** — surfaces exactly what
`payment_webhook_events` and `payments` can prove against each other:

- Webhook volume by provider/event type/signature-verification state.
- Webhooks whose signature failed verification (potential probing or a
  rotated/misconfigured secret).
- **Orphaned webhooks** — a signature-verified event naming a payment
  id that doesn't exist in `payments`. Made possible by a schema
  addition: `payment_webhook_events.payment_id`, populated at log time
  from the event's own reference (`webhook-handler.js`). It is
  deliberately **not** a `REFERENCES payments(id)` foreign key — with
  `PRAGMA foreign_keys = ON` (set at the top of `sql/schema.sql`), a
  hard FK would make logging exactly this case throw instead of insert,
  which would break the very webhook it's supposed to help diagnose.
- Payments stuck in `pending`/`processing` for over an hour — a
  checkout was started but never resolved, gateway-lost-webhook or
  abandoned-by-the-student either way.
- Succeeded payments with no matching `receipts` row — `issueReceipt()`
  runs unconditionally on every successful webhook today, so a gap here
  means that step silently failed.

**What this deliberately does not do:** compare WEC's own records
against a payment gateway's own dashboard (Stripe/Paystack/Flutterwave/
Opay). No such integration exists — building one means calling each
gateway's read API to pull their transaction list, which is a real,
separate piece of work, not something to fake by asserting the two
already agree.

A preview UI for both reports lives at `finance/preview/` — the same
"static illustrative demo, wired to real data the moment a Clerk key is
configured" pattern as the Student Portal (see
`docs/auth-architecture.md`), with one addition: it's role-gated, so a
signed-in Clerk user who isn't staff/admin sees an access-denied state
rather than financial data. That client-side gate is defense-in-depth
only — the real boundary is `requireStaff()` on the API itself, which
rejects a non-staff caller regardless of what the frontend does.
