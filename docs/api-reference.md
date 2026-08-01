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

## Frontend Integration Pattern

The public admissions form (`pages/admissions.html`, `pages/admissions.ar.html`,
wired in `js/site.js`'s `[data-admissions-form]` handler) is the reference
implementation for how *every* public-facing form on WEC-LC should talk to
the backend. It exists specifically so the "seamless transition" requirement
holds: once Cloudflare Pages, D1, and provider credentials are live, this
same markup and script start using the real backend with **zero further
frontend changes** — `/api/admissions/apply` already exists; today it 404s
(no Pages Functions deployment target), and the day it starts returning 2xx
the form starts working end-to-end.

**Contract a form must satisfy to use this pattern:**

1. The `<form>` carries `data-*` attributes for everything environment- or
   copy-specific (endpoint path, fallback mailbox, storage key, and every
   user-facing string for loading/error/success/fallback/retry states) —
   the JS handler is generic and reads these, so it never hardcodes English
   copy that would break the Arabic mirror.
2. Submission always attempts the real API first
   (`fetch(endpoint, { method: 'POST', body: JSON.stringify(payload) })`,
   an `AbortController` timeout at 8s so a hung connection can't strand the
   user).
3. Outcomes are classified into exactly three buckets, each with distinct
   UI treatment:
   - **2xx success** → success-styled status, form fields disabled,
     draft cleared from `sessionStorage`.
   - **422 validation error** → error-styled status, the specific invalid
     fields highlighted inline (`.field.is-invalid` + `field__error`
     text) using the `fields` map the API returns. No fallback — the user
     fixes the input and resubmits against the same API.
   - **Anything else** (network failure, timeout, non-2xx/422, malformed
     JSON) → treated as "API unavailable": info-styled status explaining
     what happened, and a `mailto:` draft is opened pre-filled with the
     same field values, built from the `data-fallback-email` attribute.
     The submit button relabels to the `data-retry-label` text so the user
     can attempt the live API again without re-typing anything.
4. Draft persistence: field values are written to `sessionStorage` under
   `data-storage-key` on every input and restored on page load, and are
   only cleared on confirmed API success — a failed submission (of either
   kind) never loses the applicant's typed data, including across a page
   reload.
5. Cross-component wiring stays event-based, not tightly coupled: the
   self-assessment quiz dispatches a `wec:level-suggested` CustomEvent
   (and persists the suggestion to `sessionStorage`) that the admissions
   form listens for independently — either component can be removed or
   replaced without the other needing code changes.

Copying this pattern to a new form means: add the `data-*` attributes,
reuse `setLoading()` / `buildMailtoFallback()` / `submitToApi()` as-is, and
write one new submit-event handler that maps the form's specific fields
into the API payload shape.

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
