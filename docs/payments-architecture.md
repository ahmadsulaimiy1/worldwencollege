# WEC-LC — Payments Architecture

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

1. A real FX data feed gets connected (e.g. openexchangerates.org),
   updating `fx_rate_to_usd` / `fx_rate_source` / `fx_rate_as_of` on a
   schedule, or
2. WEC-LC sets a **policy-fixed** rate (common for tuition — many
   institutions intentionally don't float tuition with daily FX) and
   an admin sets it once, with `fx_rate_source = 'policy_fixed'`.

Either way is a config change (`UPDATE currencies SET is_active=1,
fx_rate_to_usd=..., fx_rate_source=... WHERE code=...`), never a code
change. **Decision #2 (currency policy) determines which of the two
approaches to use for GBP** specifically, since it's listed as
"Primary" — I haven't picked one, because that's a pricing policy
decision, not a technical one.

---

## Feature-by-feature status

| Feature | Status | Where |
|---|---|---|
| Level-by-level (one-time, single-level) payment | **Working** | `create-checkout.js` (`kind='single_level'`, tested against the seeded 6 levels) |
| Full-programme (one-time, all six levels) payment | Schema-ready, not implemented | `payments.kind='full_programme'` and a `NULL` `level_id` are real, valid schema states, but no code path can currently create one — `create-checkout.js` requires `levelId` and hardcodes `kind='single_level'`. Deferred deliberately: it's not a mechanical gap but an undecided one — does paying for the full programme up front create all six `enrolments` rows immediately, or unlock them progressively as the student completes each level? That's a product decision, not something to guess at. `enrolment/confirm.js` does defensively reject a `NULL`-`level_id` payment with a clear 422 rather than crashing, so this stays a safe no-op until the decision is made — see the executive decision brief. |
| Instalment plans | Schema-ready | `instalment_plans` table exists; no endpoint creates/advances a plan yet — needs a decision on instalment count/cadence, which isn't in any decision list yet (worth adding) |
| Scholarships | Schema-ready | `scholarships` table, `payments.scholarship_id` FK exist; discount application logic is a `TODO` in `create-checkout.js`, deliberately not implemented — see below |
| Promo codes | Schema-ready | `promo_codes` table, `payments.promo_code` FK exist; same TODO |
| Corporate invoicing | Schema-ready | `corporate_accounts` / `corporate_seats` tables exist; no invoicing endpoint yet — needs a real corporate client to design against (see `master-roadmap.md` Phase 4's Corporate Portal reasoning) |
| Receipts | **Working** (record only) | `webhook-handler.js` issues a sequential receipt number on every successful payment (atomically, via the `counters` table — see below), only if one doesn't already exist for that payment; `receipts.pdf_url` stays null — no PDF generation step built |
| Refund workflow | Partially working | `refund()` is implemented for Stripe/Paystack/Flutterwave (Opay explicitly throws — see its adapter's confidence flag); nothing calls it yet, because refund *policy* (who approves, under what circumstances) doesn't exist — `refunds.approved_by` is there waiting for it |
| Financial reporting | **Working** | `GET /api/admin/reports/revenue` (staff/admin only) — totals, and breakdowns by status/currency/level/provider/day, all in USD via `amount_usd_cents` (see `functions/_lib/reports/revenue.js`) |
| Payment reconciliation | **Working**, scoped to what the schema can prove | `GET /api/admin/reports/reconciliation` (staff/admin only) — webhook volume by provider/type/verification, unverified-signature attempts, orphaned webhooks (a verified event naming a payment id that doesn't exist), stale pending/processing payments, succeeded payments missing a receipt. Does **not** cross-check against a gateway's own dashboard — no such integration exists (see below) |
| Secure payment status tracking | **Working** | `verify.js` (student-facing poll) + the `payments.status` state machine (`pending → processing → succeeded/failed → refunded`) |

**Why discounts (scholarships/promo codes) are schema-ready but not
wired into `create-checkout.js`:** applying a discount changes the
amount a student is legally charged. Guessing at stacking rules
("can a promo code apply on top of a scholarship?"), eligibility, or
maximum discount without an institutional policy would mean the
platform silently making a pricing decision — the financial-data
equivalent of inventing an exchange rate. The schema is ready so
wiring this in later is an endpoint change, not a migration.

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
`users.role IN ('staff','admin')`, a WEC-LC-owned field, not anything
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

**What this deliberately does not do:** compare WEC-LC's own records
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
