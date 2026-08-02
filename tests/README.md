# WEC-LC backend tests

Functional tests for `functions/**` against a **real SQLite engine**
(Node's built-in `node:sqlite`, wrapped in `d1-shim.mjs` to present the
same `.prepare().bind().first()/.all()/.run()` shape Cloudflare D1
exposes) loaded with the real `sql/schema.sql` — not mocks. Every
endpoint file under test is the actual, unmodified source that ships
to Cloudflare Pages Functions.

## Requirements

Node **22+**, run with the `--experimental-sqlite` flag (`node:sqlite`
is experimental in Node 22; no other dependency is needed — no test
framework, no `npm install` required for the tests themselves).

## Running

```
npm test
# or directly:
node --experimental-sqlite tests/run.mjs
# or one file at a time:
node --experimental-sqlite tests/webhook-handler.test.mjs
```

`tests/run.mjs` runs `import-check.mjs` (syntax + import-resolution
check for every file under `functions/`) followed by every
`*.test.mjs` file, each as its own subprocess, and reports a combined
pass/fail summary.

## What's covered, and what isn't

**Covered** — everything reachable without a live third-party account:
input validation, response shapes, D1 query logic (currency
conversion/routing, financial reports, reconciliation, student
dashboard), authorization boundaries that don't require a real Clerk
JWT (`assertStaffRole()`'s role check, and confirming every
authenticated endpoint 401s with no/invalid token), the webhook
race-condition and partial-failure-recovery fixes (via real HMAC-SHA256
signed requests, computed the same way `stripe-adapter.js` verifies
one), and the HTML-escaping/timing-safe-comparison security fixes.

**Not covered, and can't be from here** — anything that requires a
real Stripe/Paystack/Flutterwave/Opay/Clerk/Resend account: end-to-end
checkout against a live gateway, real webhook payloads from a real
gateway, `requireUser()`'s full JWT-verification path with a real
Clerk-signed token (every test that needs to be authenticated
confirms the 401 boundary holds, not what happens past it — see the
inline comments in `validation-and-security.test.mjs`). This mirrors
the disclosure already in `docs/api-reference.md` § Verification and
`docs/auth-architecture.md` § What's genuinely untested — closing that
gap requires provisioning real credentials, not more test code.

## Files

- `d1-shim.mjs` — the D1-compatible SQLite wrapper every test loads
  `sql/schema.sql` into.
- `helpers.mjs` — portable `ROOT`/`loadUrl()` path resolution (no
  hardcoded absolute paths — the suite runs correctly from any
  checkout location).
- `import-check.mjs` — auto-discovers and import-checks every `.js`
  file under `functions/`.
- `admissions-and-currency.test.mjs` — `POST /api/admissions/apply`,
  `GET /api/admissions/status`, `functions/_lib/currency.js`.
- `admin-reports.test.mjs` — `functions/_lib/reports/{revenue,reconciliation}.js`,
  `assertStaffRole()`, and both `/api/admin/reports/*` endpoints' 401
  boundary.
- `student-dashboard.test.mjs` — `functions/_lib/student/dashboard.js`
  and `/api/student/dashboard`'s own-data-only guarantee.
- `webhook-handler.test.mjs` — `functions/_lib/payments/webhook-handler.js`'s
  race-condition and partial-failure-recovery fixes, via real signed
  requests.
- `validation-and-security.test.mjs` — `timingSafeEqual()`,
  `readJsonBody()`, `escapeHtml()`/`sanitizeHeaderText()`, and the
  input-validation hardening added to `apply.js`/`create-checkout.js`.
- `progression-and-config.test.mjs` — `platform_config` (`config.js`)
  and the progressive full-programme unlock
  (`student/progression.js`'s `completeLevel()`, Executive Decision #1).
- `currency-fx.test.mjs` — `functions/_lib/currency/fx-service.js`'s
  rate-writing logic and a stubbed-provider version of the live-feed
  refresh path (Executive Decision #2).
- `lms-content.test.mjs` — `functions/_lib/lms/content.js`: level-based
  access control, quiz scoring and retake history, assignment
  submission/grading, live-session listing (Executive Decision #4,
  Milestone 1). Fixture content is placeholder mechanism-testing data,
  not real curriculum.
- `discounts-and-instalments.test.mjs` — `functions/_lib/payments/
  discounts.js` (discount math, stacking-policy enforcement, the
  scholarship ownership boundary) and `functions/_lib/payments/
  instalments.js` (per-instalment amount breakdown, next-instalment
  lookup, plan completion) — Executive Decision #5.
- `curriculum-level-1.test.mjs` — loads `sql/seed-curriculum-level-1.sql`
  (the real, authored Level I curriculum — see
  `docs/curriculum-level-1-foundation.md`) on top of the schema and
  does a deep, independently hand-verified check of Module 1
  specifically: the real quiz scores correctly against its real answer
  key, a wrong attempt correctly fails, and the real assignment can be
  submitted and staff-graded.
- `curriculum-level-1-complete.test.mjs` — sweeps all 10 modules of
  the now-complete Level I curriculum: every module loads with a
  reading/quiz/assignment, every quiz's own seeded correct answers
  (fetched directly from the DB) score 100% when submitted, no quiz
  ever leaks its answer key to the client, every assignment can be
  submitted and graded, and a weak attempt on the Module 10 mock exam
  correctly fails rather than falsely passing.
- `curriculum-level-2.test.mjs` — the same sweep pattern for Level II
  (Elementary, A2), now covering the complete, 10-module curriculum:
  every module loads with a reading/quiz/assignment, every quiz's own
  seeded correct answers (fetched directly from the DB) score 100%
  when submitted, no quiz ever leaks its answer key to the client,
  every assignment can be submitted and graded, and a weak attempt
  correctly fails rather than falsely passing.
- `curriculum-level-3.test.mjs` — the same sweep pattern for Level III
  (Intermediate, B1) — currently Modules 1-3 (see
  `docs/curriculum-level-3-intermediate.md`'s module map; Modules 4-10
  are mapped but not yet authored).
- `run.mjs` — runs everything above and reports a combined summary.

## Adding a new test

Match the existing style: plain `console.log((cond ? 'PASS ' : 'FAIL ') + label)`
assertions, no test framework, `process.exit(fail ? 1 : 0)` at the end,
named `<subject>.test.mjs` so `run.mjs` picks it up automatically.
