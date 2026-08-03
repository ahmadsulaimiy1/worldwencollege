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
  (Intermediate, B1), now covering the complete, 10-module curriculum:
  every module loads with a reading/quiz/assignment, every quiz's own
  seeded correct answers (fetched directly from the DB) score 100%
  when submitted, no quiz ever leaks its answer key to the client,
  every assignment can be submitted and graded, and a weak attempt
  correctly fails rather than falsely passing.
- `curriculum-level-4.test.mjs` — the same sweep pattern for Level IV
  (Upper Intermediate, B2), now covering the complete, 10-module
  curriculum: every module loads with a reading/quiz/assignment, every
  quiz's own seeded correct answers (fetched directly from the DB)
  score 100% when submitted, no quiz ever leaks its answer key to the
  client, every assignment can be submitted and graded, and a weak
  attempt correctly fails rather than falsely passing.
- `curriculum-level-5.test.mjs` — the same sweep pattern for Level V
  (Advanced, C1), now covering the complete, 10-module curriculum:
  every module loads with a reading/quiz/assignment, every quiz's own
  seeded correct answers (fetched directly from the DB) score 100%
  when submitted, no quiz ever leaks its answer key to the client,
  every assignment can be submitted and graded, and a weak attempt
  correctly fails rather than falsely passing.
- `curriculum-level-6.test.mjs` — the same sweep pattern for Level VI
  (English Mastery, C2), the programme's capstone level, covering the
  complete 10-module curriculum: every module loads with a
  reading/quiz/assignment, every quiz's own seeded correct answers
  (fetched directly from the DB) score 100% when submitted, no quiz
  ever leaks its answer key to the client, every assignment can be
  submitted and graded, and a weak attempt correctly fails rather than
  falsely passing. Module 10 is the capstone plus the 20-question
  Mastery Examination, and the sweep asserts that count explicitly
  rather than assuming the 10-question default.
- `curriculum-consistency.test.mjs` — the programme-wide consistency
  harness. Where the six per-level sweeps verify that each level
  *works*, this verifies the six levels agree with **each other** and
  with the normative rubric policy in `docs/curriculum-framework.md`:
  the core three criteria on all 60 assignments, each level's signature
  criterion on every assignment of that level, every end-of-level exam
  carrying each signature still live at its level, no undeclared
  criterion names, uniform quiz lengths, well-formed answer keys, and
  balanced answer-key distribution (no quiz over half at one position;
  each position 20-30% programme-wide). It exists because
  `docs/curriculum-programme-review.md` found cross-level
  inconsistencies no per-level test could see — and it immediately
  found one more that no per-level test *could* see, since submitting
  the real answer key scores 100% however skewed that key is.
- `lms-audio.test.mjs` — the audio layer: listening items, synchronised
  transcript cues, pronunciation drill targets, learner voice
  recordings with attempt history, instructor spoken feedback,
  automated-scorer feedback stored distinguishably alongside it, and
  the per-dimension pronunciation profile. Covers the layer's central
  design decision explicitly: a script with no recording yet is a
  first-class usable state (`isRecorded: false`), never an error and
  never a placeholder file.
- `recording-storage.test.mjs` — object storage for learner voice
  (`functions/_lib/lms/recording-storage.js`) against the real SQLite
  engine and `r2-shim.mjs`. Weighted towards what must NEVER happen —
  another learner reading a recording, a gap in the parts assembling
  into a plausible-looking take, an unset retention policy being read
  as "delete" — because those are the failures that are silent in
  production. Also covers resumption after a dropped connection,
  re-uploading a part, the size cap being enforced against bytes
  received rather than declared, attempt history surviving a re-record,
  purge keeping the assessment row while destroying the audio, and the
  content types real browsers actually emit.
- `r2-shim.mjs` — the in-memory R2 stand-in, in the spirit of
  `d1-shim.mjs`. It enforces the two multipart rules that bite in
  production (no gaps; non-final parts ≥ 5 MiB) rather than accepting
  anything — a shim more permissive than the real service tests nothing
  where it matters.
- `clerk-jwt.test.mjs` — session-token verification with GENUINELY
  signed tokens. The earlier disclosure that "a real Clerk JWT needs a
  real Clerk account" conflated two things: getting a token *from
  Clerk* needs an account; producing a *real RS256 JWT* does not — Web
  Crypto generates the keypair, publishes it as a JWKS and signs, and
  the adapter cannot tell the difference because there isn't one.
  Covers forgery by a different key, payload tampering, `alg: none`,
  HS256 alg-confusion using the public key as the HMAC secret, expiry
  and nbf, azp enforcement, malformed input returning null rather than
  throwing, and key rotation. The rotation cases found two real
  defects: an unknown `kid` was rejected without refetching (Clerk
  rotating keys would have signed out every learner for up to ten
  minutes), and the first fix made an attacker-controlled `kid` into a
  request amplifier against Clerk's own endpoint. 31 assertions. What
  remains untested is Clerk's specific claim set and rotation cadence,
  not the cryptography.
- `run.mjs` — runs everything above and reports a combined summary.

**Browser tests** (not in `run.mjs` — they need Chromium and a server,
so run them explicitly):

```
node tests/browser/listening-lab.mjs
node tests/browser/lab-auth.mjs
node tests/browser/route-audit.mjs
```

- `browser/listening-lab.mjs` — 40 assertions covering the Listening
  Lab and the instructor review workspace. It starts
  `browser/lab-server.mjs`, which serves the real static files and runs
  the real `functions/_lib/lms/content.js` against the real seeded
  curriculum, so the pages under test are driven by production logic and
  production content — only the HTTP shell is local. It asserts
  behaviour rather than appearance: both rendering modes, transcript
  interaction, bookmark/note persistence across a reload, server-side
  grading with no answer-key leakage, the progress panel's null
  handling, download management, and a real instructor review clearing
  an item from the queue. Screenshots land in `browser/screenshots/`
  (gitignored) for human review.
  In this sandbox Google Fonts is unreachable, so the test splits script
  errors from failed requests and tolerates exactly the two font hosts —
  any other failure still fails.
- `browser/lab-auth.mjs` — the auth-contract test, and a cautionary
  tale. `listening-lab.mjs` passed 40 assertions against two pages that
  sent no `Authorization` header at all and would therefore have 401'd
  on every request against a real deployment. It could not see that,
  because `lab-server.mjs` hard-coded `userId: 'usr_demo'` and never
  looked at request headers — the harness was easier than production
  exactly where production has a check. This file runs the same harness
  with `LAB_REQUIRE_AUTH=1`, so any `/api/` request without a Bearer
  token gets a 401, and asserts the contract rather than the rendering:
  the no-key state degrades to a clear "sign in" message rather than a
  blank page; every API request from a signed-in page carries a token;
  the token is minted **per request**, not captured at page load (Clerk
  tokens expire in about a minute, and a learner sits on the Lab for
  much longer); the instructor workspace authenticates its queue; and
  the offline cache is namespaced per learner, since the Cache API keys
  on URL alone and those responses carry the asker's own recordings and
  attempt history. 14 assertions. Removing the fix fails 8 of them —
  checked, not assumed. The token is a stub: verifying a real Clerk JWT
  still needs a real Clerk instance and remains untested from here.
- `browser/recording-upload.mjs` — record → upload → play back, in a
  real browser with Chromium's fake microphone driving a real
  `MediaRecorder`. It exists because `recording-storage.test.mjs` can
  prove the storage layer is correct while proving nothing about
  whether the Lab ever calls it — unit-testing a subsystem and never
  exercising its only caller is exactly how both pages shipped with no
  `Authorization` header and a green suite. It earned its keep on the
  first run by finding that the content-type allow-list rejected
  `audio/webm;codecs=opus` — every recording any real browser makes.
  13 assertions.
- `browser/route-audit.mjs` — the pre-deployment sweep. Walks every
  built HTML file and loads each one, checking the things that break a
  deployment rather than a unit test: broken routes, missing first-party
  assets, uncaught script errors, and the accessibility basics (title,
  lang, exactly one h1, alt on every image) on EVERY route rather than a
  sample. 8 assertions across all 27 routes. Webfont requests are
  aborted, so every page is verified rendering on the brand.css fallback
  stack — the state a visitor with a blocked CDN actually sees.
- `browser/gallery.mjs` — not an assertion suite. Captures every key
  route at 1440px and 390px into `browser/screenshots/gallery/` for
  visual review.

## Adding a new test

Match the existing style: plain `console.log((cond ? 'PASS ' : 'FAIL ') + label)`
assertions, no test framework, `process.exit(fail ? 1 : 0)` at the end,
named `<subject>.test.mjs` so `run.mjs` picks it up automatically.
