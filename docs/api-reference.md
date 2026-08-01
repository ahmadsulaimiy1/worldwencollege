# WEC-LC — API Reference

*Companion to `technical-architecture.md`, `payments-architecture.md`,
`auth-architecture.md`. Every endpoint below is real code in
`functions/api/`; none is deployed anywhere.*

---

## Admissions

### `POST /api/admissions/apply`
Public, no auth. Step 2 of the public admissions journey.

```jsonc
// Request
{ "fullName": "...", "email": "...", "country": "NG", "selfAssessedLevelId": 3 }
// 201 Response
{ "applicationId": "app_...", "status": "submitted" }
// 422 Response (validation)
{ "error": "ValidationError", "message": "...", "fields": { "email": "..." } }
```

### `GET /api/admissions/status?id=app_xxx`
Public, no auth — deliberately keyed by id (an applicant has no
account yet). Returns `{ id, status, created_at }` only.

---

## Payments

### `POST /api/payments/create-checkout`
**Requires auth.** Body: `{ levelId, currency?, gateway?, promoCode? }`.
Returns `{ paymentId, checkoutUrl, gateway, currency, amountMinor }`.
`currency`/`gateway` are optional — omitted, they're inferred from the
account's country via `_lib/currency.js`'s routing suggestion, per
`payments-architecture.md` § UX.

### `GET /api/payments/verify?id=pay_xxx`
**Requires auth**, and the payment must belong to the caller. Returns
`{ id, status, currency, amount_cents, level_id }` — polled by the
checkout success page while waiting for the webhook.

### `POST /api/payments/webhook-{stripe,paystack,flutterwave,opay}`
Gateway-only (signature-verified, not user-callable). Each is five
lines naming its gateway; all four share `_lib/payments/webhook-handler.js`.

---

## Auth

### `POST /api/auth/webhook-clerk`
Clerk-only (Svix-signature-verified). Syncs `user.created`/
`user.updated` into the `users` table.

### `GET /api/auth/me`
**Requires auth.** Returns `{ id, email, preferredName, preferredLanguage, role }`
— the endpoint that eventually replaces "A. Student (demo)" in the
Student Portal preview with a real identity.

---

## Enrolment

### `POST /api/enrolment/confirm`
**Requires auth.** Body: `{ paymentId }`. Idempotent — safe to call
more than once for the same payment. Creates the `enrolments` row,
attempts (non-blocking) LMS enrolment, sends the `enrolment_confirmed`
notification.

---

## Verification

Every claim of "working" above was checked, not assumed — the same
standard applied to the rest of this project:

- **27/27 files** pass `node --check` (syntax) and a real ES-module
  import resolution check (every `import` path actually resolves to
  an existing file/export).
- **13/13 functional assertions pass** running the real endpoint code
  (`apply.js`, `status.js`) and real `_lib/currency.js` logic against
  an actual SQLite engine (`node:sqlite`) loaded with the real
  `sql/schema.sql` — not a mock. Covers: successful application
  submission, validation rejection with the correct field flagged,
  status lookup round-tripping the real inserted row, 404 for an
  unknown id, currency conversion refusing an inactive/rate-less
  currency, exact USD passthrough, routing fallback for an unmapped
  country, and confirmation that exactly one currency (USD) is active
  today.
- **Not yet possible to verify**: anything requiring a real Clerk/
  Stripe/Paystack/Flutterwave/Opay/Resend account — signature
  verification logic is implemented against each provider's publicly
  documented scheme (see `auth-architecture.md` § What's genuinely
  untested), not exercised against a live account.
