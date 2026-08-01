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
| One-time / full-programme payment | **Working** | `create-checkout.js` (`kind='full_programme'` — level omitted) |
| Level-by-level payment | **Working** | `create-checkout.js` (`kind='single_level'`, tested against the seeded 6 levels) |
| Instalment plans | Schema-ready | `instalment_plans` table exists; no endpoint creates/advances a plan yet — needs a decision on instalment count/cadence, which isn't in any decision list yet (worth adding) |
| Scholarships | Schema-ready | `scholarships` table, `payments.scholarship_id` FK exist; discount application logic is a `TODO` in `create-checkout.js`, deliberately not implemented — see below |
| Promo codes | Schema-ready | `promo_codes` table, `payments.promo_code` FK exist; same TODO |
| Corporate invoicing | Schema-ready | `corporate_accounts` / `corporate_seats` tables exist; no invoicing endpoint yet — needs a real corporate client to design against (see `master-roadmap.md` Phase 4's Corporate Portal reasoning) |
| Receipts | **Working** (record only) | `webhook-handler.js` issues a sequential receipt number on every successful payment; `receipts.pdf_url` stays null — no PDF generation step built |
| Refund workflow | Partially working | `refund()` is implemented for Stripe/Paystack/Flutterwave (Opay explicitly throws — see its adapter's confidence flag); nothing calls it yet, because refund *policy* (who approves, under what circumstances) doesn't exist — `refunds.approved_by` is there waiting for it |
| Financial reporting | Schema-ready | `amount_usd_cents` is captured on every payment specifically so a future report can sum across currencies; no report/dashboard built |
| Payment reconciliation | Schema-ready | `payment_webhook_events` logs every inbound webhook (verified or not) with idempotency; no reconciliation *report* comparing that log against gateway dashboards exists yet |
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
  or double-enrol a student.
- Amounts are stored in minor units (cents/kobo) as integers
  throughout — no floating-point currency math anywhere in the payment
  path.
- No payment gateway secret key is ever read from anywhere but
  `env` (Cloudflare Pages secrets) — none are hardcoded, none are in
  `wrangler.toml`, none are in this repo's git history.

This satisfies "provider-agnostic, scalable, secure, and easy to
maintain" as a design property proven by tests, not asserted as a
claim about an unbuilt system.
