# WEC-LC — API Reference

*Companion to `technical-architecture.md`, `payments-architecture.md`,
`auth-architecture.md`. Every endpoint below is real code in
`functions/api/`; none is deployed anywhere.*

---

## Admissions

### `POST /api/admissions/apply`
Public, no auth. Step 2 of the public admissions journey. On success,
sends the applicant a confirmation email and — separately — alerts WEC-LC
staff at `env.NOTIFICATION_EMAIL` (`notifyStaff()` in
`functions/_lib/notifications/events.js`; see `.env.example`). That
address is deploy-time config, not hardcoded, specifically so it can
point at a working inbox during early operations and move to an
official mailbox later with no code change. If unset, the staff alert is
skipped (logged, not thrown) — it never blocks the applicant's
submission.

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
**Requires auth.** Body — exactly one of `levelId`, `fullProgramme`, or
`instalmentPlanId`, plus optional `currency`/`gateway`:
- `{ levelId, currency?, gateway?, promoCode?, scholarshipId? }` — a
  single-level payment.
- `{ fullProgramme: true, currency?, gateway?, promoCode?,
  scholarshipId? }` — a full-programme payment (Executive Decision
  #1 — priced from `platform_config.full_programme_price_usd_cents`).
- `{ instalmentPlanId, currency?, gateway? }` — pays the next
  instalment of a plan created via `POST /api/payments/instalment-plan`
  (Executive Decision #5). Cannot be combined with `promoCode`/
  `scholarshipId`.

`promoCode`/`scholarshipId` (single-level and full-programme modes
only) apply a discount via `functions/_lib/payments/discounts.js` —
both together are rejected with a 422 unless
`platform_config.discount_stacking_policy` explicitly allows it.

Returns `{ paymentId, checkoutUrl, gateway, currency, amountMinor }`.
`currency`/`gateway` are optional — omitted, they're inferred from the
account's country via `_lib/currency.js`'s routing suggestion, per
`payments-architecture.md` § UX.

### `POST /api/payments/instalment-plan`
**Requires auth.** Body: `{ levelId }` or `{ fullProgramme: true }`.
Creates an instalment plan — instalment count from
`platform_config.instalment_default_count` (default 4), equal-split
amounts. Returns `{ id, userId, levelId, totalAmountUsdCents,
instalmentCount, status, amounts }`. Pay each instalment in turn via
`POST /api/payments/create-checkout` with `{ instalmentPlanId: id }`.

### `GET /api/payments/verify?id=pay_xxx`
**Requires auth**, and the payment must belong to the caller. Returns
`{ id, status, currency, amountCents, levelId }` — polled by the
checkout success page while waiting for the webhook. `levelId` is
`null` for a full-programme payment.

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
— called from `js/portal-auth.js` (see `docs/auth-architecture.md` §
Client-side integration) to layer WEC-LC's own record on top of Clerk's
`user` object once a real Clerk key is configured. Today, with no key
configured, it's never called — the Student Portal preview stays static.

---

## Admin Reports

Both require auth **and** staff/admin role (`requireStaff()` — 403 for
a signed-in student, 401 for no/invalid session). See
`docs/payments-architecture.md` § Financial reporting & reconciliation
for what each one covers and deliberately doesn't.

### `GET /api/admin/reports/revenue?from=<ISO>&to=<ISO>`
```jsonc
{
  "range": { "from": null, "to": null },
  "totals": { "succeededCount": 18, "grossUsdCents": 5699986, "refundedUsdCents": 100000, "netUsdCents": 5599986 },
  "byStatus": [{ "status": "succeeded", "count": 18, "amountUsdCents": 5699986 }],
  "byCurrency": [{ "currency": "USD", "count": 18, "amountUsdCents": 5699986 }],
  "byLevel": [{ "levelId": 3, "levelName": "Intermediate Programme", "count": 9, "amountUsdCents": 2850003 }],
  "byProvider": [{ "provider": "stripe", "count": 11, "amountUsdCents": 3483337 }],
  "byDay": [{ "date": "2026-07-01", "count": 2, "amountUsdCents": 633334 }]
}
```

### `GET /api/admin/reports/reconciliation`
```jsonc
{
  "generatedAt": "2026-08-01T12:00:00.000Z",
  "staleAfterMinutes": 60,
  "webhookVolume": [{ "provider": "stripe", "event_type": "checkout.session.completed", "signature_verified": 1, "count": 12 }],
  "unverifiedWebhooks": [{ "id": "whe_...", "provider": "paystack", "event_type": "charge.success", "received_at": "..." }],
  "orphanedWebhooks": [{ "id": "whe_...", "provider": "stripe", "event_type": "...", "payment_id": "pay_unknown", "received_at": "..." }],
  "stalePayments": [{ "id": "pay_...", "user_id": "usr_...", "provider": "stripe", "amount_usd_cents": 316667, "status": "pending", "created_at": "..." }],
  "succeededPaymentsMissingReceipts": [{ "id": "pay_...", "user_id": "usr_...", "amount_usd_cents": 316667, "confirmed_at": "..." }]
}
```

---

## Admin Currency

Both require auth **and** staff/admin role. See
`docs/payments-architecture.md` § Multi-currency for the mechanism.

### `POST /api/admin/currency/set-rate`
Body: `{ code, rateToUsd, activate? }`. Sets a policy-fixed exchange
rate. `activate` (default `false`) additionally flips `is_active` —
kept separate so a rate can be staged before going live at checkout.
Returns `{ code, rateToUsd, activated, updated }`.

### `POST /api/admin/currency/refresh-rates`
Body: `{ codes: string[] }`. Fetches current rates for the given codes
from the configured live feed (Frankfurter/ECB today) and applies
whichever ones it actually covers. Returns `{ updated, skipped,
notReturnedByProvider }` — a code the feed doesn't carry (NGN, SAR,
AED, QAR, KWD today) comes back in `notReturnedByProvider`, never a
fabricated rate.

---

## Student

### `GET /api/student/dashboard`
**Requires auth.** No id/user parameter accepted — always the caller's
own data, by construction, so this endpoint can never be used to look
up another student's enrolment or payment history.
```jsonc
{
  "enrolments": [{ "id": "enr_...", "levelId": 3, "levelName": "Intermediate Programme", "roman": "III", "cefr": "B1", "status": "active", "startedAt": "...", "completedAt": null }],
  "payments": [{ "id": "pay_...", "levelId": 3, "levelName": "Intermediate Programme", "amountCents": 316667, "currency": "USD", "status": "succeeded", "provider": "stripe", "createdAt": "...", "confirmedAt": "...", "receiptNumber": "WEC-R-000001" }],
  "activeLevelId": 3,
  "completedLevelIds": [1, 2]
}
```
Called from `js/portal-auth.js` to replace the Student Portal's
illustrative programme-progress stepper, "Current Level" stat tile, and
a real "Payment History" panel with this student's actual data once
signed in. Stops there deliberately — classes, assignments, digital
library, attendance and units-completed still show the existing
illustrative preview data regardless of auth state: the LMS backend
now exists (see § LMS below) but `js/portal-auth.js` doesn't call it
yet — that frontend wiring is LMS Milestone 3, see
`docs/lms-architecture.md`.

---

## Enrolment

### `POST /api/enrolment/confirm`
**Requires auth.** Body: `{ paymentId }`. Idempotent — safe to call
more than once for the same payment. Creates the `enrolments` row
(Level I, for a full-programme payment's first confirmation — see
Executive Decision #1) and sends the `enrolment_confirmed` notification.

---

## LMS

*Milestone 1 — see `docs/lms-architecture.md` for the entity model and
roadmap. Every endpoint below requires auth; the read/write ones also
enforce that the caller holds an active/completed enrolment for the
relevant level (403 otherwise) — see that document's § Access control.
No real curriculum content is seeded anywhere yet.*

### `GET /api/lms/units?levelId=<n>`
Returns `{ levelId, units: [{ id, sequence, title, progressStatus, completedAt }] }`, ordered.

### `GET /api/lms/unit?id=unt_xxx`
Full detail: ordered `learning_items`, each with `{ id, sequence, kind, title, body }`.
A `kind:'quiz'` item additionally carries `questions: [{ id, sequence, prompt, choices }]`
— never the correct answer, which is scored server-side only. A
`kind:'assignment'` item carries `mySubmission` (the caller's own
latest submission, or `null`).

### `POST /api/lms/quiz-attempt`
Body: `{ learningItemId, answers: number[] }` (one choice index per
question, in question order). Returns `{ id, score, correctCount,
totalQuestions, passed, submittedAt }`. Append-only — every attempt is
its own row; a later low score never un-completes a unit already
passed.

### `POST /api/lms/assignment-submission`
Body: `{ learningItemId, content }`. Returns `{ id, status:'submitted', submittedAt }`.
Marks the unit `in_progress`, not `completed` — grading is what can complete it.

### `POST /api/lms/grade-assignment`
**Staff/admin only.** Body: `{ submissionId, grade, feedback? }` —
`grade` is a fraction 0..1. Returns `{ id, status:'graded', grade,
feedback, gradedAt }`. A grade at or above
`platform_config.lms_pass_threshold` (default 0.7) marks the unit
`completed`.

### `GET /api/lms/live-sessions?levelId=<n>`
Returns `{ levelId, sessions: [{ id, title, startsAt, durationMinutes, joinUrl, unitId }] }`.
External join links (Zoom/Meet/Teams) — no custom video infrastructure.

### `POST /api/lms/complete-level`
**Staff/admin only.** Body: `{ userId, levelId }`. Marks that
enrolment `completed`; if the student holds a succeeded full-programme
payment, automatically creates the next level's `enrolments` row as
`active` (Executive Decision #1's progressive unlock —
`functions/_lib/student/progression.js`). Idempotent.

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

Every claim of "working" above was checked, not assumed — and, unlike
earlier in this project's history, that's no longer something you have
to take on faith: **`npm test`** runs the real backend test suite
committed at `tests/` (see `tests/README.md`) against the actual,
unmodified `functions/**` source. Run it yourself:

```
npm test
# 50 files import-checked cleanly
# 790 functional assertions, 0 failures
```

What it covers, briefly (full breakdown in `tests/README.md`):
application submission/validation, currency conversion/routing and the
configurable FX service (policy-fixed rates, a stubbed live-feed
refresh), financial reporting and reconciliation query logic
(including every reconciliation signal — orphaned webhooks,
unverified-signature attempts, stale payments, missing receipts),
`assertStaffRole()`'s role gate, the student dashboard's per-student
data isolation, the payment webhook handler's race-condition and
partial-failure-recovery fixes (via real HMAC-SHA256 signed requests),
the input-validation/HTML-escaping/timing-safe-comparison hardening
added during the production-readiness audit, the progressive
full-programme unlock (Executive Decision #1), and the LMS's access
control, quiz scoring, and assignment grading (Executive Decision #4,
Milestone 1).

**What `npm test` can't cover, and why:** anything requiring a real
Clerk/Stripe/Paystack/Flutterwave/Opay/Resend account — signature
verification logic is implemented against each provider's publicly
documented scheme (see `auth-architecture.md` § What's genuinely
untested), not exercised against a live account. Every authenticated
endpoint's test confirms the 401 boundary holds on an invalid token,
not what happens past `requireUser()`'s full JWT-verification path,
which needs a real Clerk-signed token to reach.

**What's verified but not committed:** the frontend (`js/portal-auth.js`,
`js/finance-dashboard.js`, `js/portal-guard.js`, and the admissions
form's try-API-then-fallback flow) was checked this session with
Playwright — real browser automation, not eyeballed — confirming zero
behavior change with no Clerk key configured, correct gate/redirect
behavior once one is set, and (via a functional fake Clerk global, not
just the unreachable-Clerk path) that real enrolment/payment/report
data correctly overrides every illustrative default. Those Playwright
scripts are not yet part of this repository — `npm test` today is
backend-only. Adding a committed frontend test suite (Playwright as a
devDependency, scripts under e.g. `tests/e2e/`) is a reasonable next
step, not done here to avoid taking on a large new dependency without
that being asked for.
