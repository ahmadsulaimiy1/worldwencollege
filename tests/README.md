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

**Now covered, and previously mis-disclosed** — the JWT verification
path. Earlier revisions of this file said it needed a real Clerk
account. That conflated two things: getting a token *from Clerk* needs
an account, but producing a *real RS256 JWT* does not. `clerk-jwt.test.mjs`
generates real keypairs with Web Crypto, publishes them as a JWKS and
signs real tokens — the adapter cannot tell the difference, because
there isn't one. Writing it found two real defects (see that file).
The claim "closing that gap requires provisioning real credentials, not
more test code" was wrong, and is corrected here rather than quietly
dropped.

**Not covered, and can't be from here** — anything that genuinely
requires a live third-party account: end-to-end checkout against a real
gateway, captured real webhook payloads, Clerk's *specific claim set
and rotation cadence* (the cryptography is covered; the vendor's exact
claims are not), real R2 semantics beyond what `r2-shim.mjs` models,
the FX provider feed, and Resend delivery. `docs/engineering-principles.md`
§ 3 keeps the authoritative register, with what would close each row.

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
- `auth-provisioning.test.mjs` — `requireUser()` end to end with real
  signed tokens and a real database: the account-provisioning path
  every learner hits on their first request after signing up. Asserts
  that a verified token with no local row provisions the account
  instead of failing, that a token with NO email claim provisions
  nothing (an email address must never be invented), that a forged or
  expired token provisions nothing, that a provisioned account is a
  student and is refused by the staff guard, and that a webhook racing
  a first request produces one account rather than a UNIQUE violation.
  Confirmed to detect its own regression by sabotaging
  `requireUser()` — which also revealed that the happy-path assertions
  crashed rather than reporting, now fixed.
- `admin-enrolments.test.mjs` — staff enrolment management
  (`functions/_lib/admin/enrolments.js`). Weighted towards the two
  things that turn an admin tool into a liability: granting yourself
  access, and changing someone's access without leaving a trace. Also
  covers the integrity defect that prompted it — before migration 002
  the enrolments table had no uniqueness, so running the manual SQL
  twice (exactly how the platform's first learner was enrolled) created
  two live enrolments in one level, after which `completeLevel()` would
  mark one completed and leave the other active. 39 assertions;
  confirmed by sabotage to detect both the missing self-guard and the
  missing index.
- `admin-roles.test.mjs` — appointments
  (`functions/_lib/admin/roles.js`). Every assertion corresponds to a
  specific way a permission system goes wrong: staff appointing staff,
  self-promotion, an administrator locking themselves out mid-mistake,
  and the last administrator being removed (from which the only
  recovery is editing the live database by hand — precisely the
  situation the module exists to end). 32 assertions; each of the three
  guards confirmed by removal.
- `time-on-task.test.mjs` — the measurement behind the College's
  measured-hours commitment (`docs/academic-framework.md` § I). Almost
  every assertion is about a way a measurement becomes a lie, because
  that is the only interesting failure mode: publishing *measured*
  Guided Learning Hours is the strongest claim available to an
  institution with no accreditation, and a measurement anybody can edit
  is worth less than none at all — it invites belief it has not earned.
  So the client never supplies a duration (asserted against
  `js/time-on-task.js` itself, not just the server); a beat can only
  credit the real interval since the last one, taken from the server's
  clock; a tab left open for eight hours credits one interval and says
  it was capped; a backwards clock credits nothing rather than a
  negative; one runaway row is capped so it cannot move an average; and
  a figure from four learners is computed but **not publishable**, with
  the reason in words so nobody publishes a null. The published figure
  is the **median**, and the test proves why — one extreme outlier moves
  the mean and leaves the median alone. Also asserts the beacon treats
  playing audio as activity, because an idle rule built only on keyboard
  and pointer input would score the programme's core listening practice
  at zero. `now` is injected throughout: a test that reads the clock
  measures the test runner. 28 assertions.
- `published-claims.test.mjs` — the numbers on the public site,
  measured against the database that is meant to back them. It exists
  because of a real one: `/academics/iefc/` publishes a Units column of
  120 per level and "seven hundred and twenty learning units", and the
  curriculum holds 49 per level, 294 in total — 41%. Nobody wrote that
  as a lie; it **drifted**, because the framework was written first, the
  copy took its figures, and the authoring caught up more slowly than
  the copy implied. Drift is the ordinary way an institution ends up
  misrepresenting itself, and a document asking people to remember does
  not stop it. The rule enforced: a page may publish a design figure,
  but not silently — where a number is not backed by the database, the
  page carrying it must also carry an explicit design-versus-delivered
  statement, positioned with the claim rather than elsewhere. Claims the
  database *can* confirm (six levels, sixty modules, a quiz and an
  assignment per module) are simply asserted true. The test also prints
  the real figures on every run, so the shortfall is visible rather than
  filed, and it flips to "the disclosure can be retired" automatically
  once the content catches up. 12 assertions; confirmed by deleting the
  disclosure and watching four of them fail.
- `study-plan.test.mjs` — where a learner is and what they should open
  next (`functions/_lib/student/study-plan.js`). The gap it closes was
  invisible from inside the code and obvious to anyone trying to be a
  student: `/listening-lab.html` requires `?unit=<id>` and without it
  says "No unit specified. Open this page from a module." **There was no
  module page.** A signed-in learner could not reach a lesson at all.
  Most of the assertions are about states nobody thinks to build for —
  no enrolment, a level whose units are not loaded, every unit finished,
  two active levels at once, a withdrawn enrolment — because those are
  what a platform meets in its first months and each has a different
  honest answer. Also asserts the two judgement calls: a unit in
  progress is **resumed** rather than skipped, and finishing every unit
  reports `units_complete` and stops, never claiming the level is passed
  (that is governance B4, undecided — and a dashboard is the one place a
  learner would believe it). Also covers **pace** — the learner's own
  rate against the published four months a level, which is a real figure
  from `programme_levels.duration_months` rather than an invented target.
  Measured in modules, because all sixty exist, whereas the
  120-units-per-level figure is a design the content has not caught up
  with; measuring against a number the platform cannot show would be
  wrong for everybody. The pace assertions are mostly about refusing to
  speak: two modules in three days is not a rate, a rate implying four
  times the designed length produces no date rather than "you will
  finish in 2031", and expected-by-now is capped at the size of the level
  because "expected 14 of 10" is nonsense a learner would rightly
  distrust. One asserts an absence — pace carries no deadline, expiry or
  penalty field, because no such policy exists and each would carry
  contractual weight. `now` is injected throughout: a test that reads the
  clock passes on Tuesday and fails on the last day of February.
  48 assertions.
- `registry.test.mjs` — the Graduate Register: conferral, verification,
  withdrawal, replacement and the hash chain that makes the whole thing
  worth trusting. The chain assertions are the point, and they are
  written as attacks rather than as confirmations: edit a conferred
  award's honour directly in the database and `verifyChain()` must name
  that row; delete a row from the middle and it must notice the gap
  rather than walking happily past it; confer two awards against the
  same chain head and the second must be **refused**, because a register
  that forks is a register with two versions of the truth. That last one
  is enforced by `prev_digest UNIQUE`, not by application code, so it
  holds even if a future request path forgets to care.
  The scope assertions guard the other promise: the verification
  response is checked against an allowlist of keys, so it fails when a
  refactor starts returning a field nobody approved rather than only
  when someone leaks a field a test author happened to imagine. The
  audit log is checked for the *absence* of columns — no IP, no user
  agent, no referrer, no session — because the portal tells every
  checker it does not record who is checking, and that sentence has to
  be enforced by the schema rather than by good intentions. Consent is
  tested to scope the browsable register and **not** verification: a
  code is something the graduate chose to hand someone. 59 assertions.
- `migrate.test.mjs` — the migration runner (`scripts/migrate.mjs`).
  The runner it replaced applied every file in `sql/migrations/`
  unconditionally, which works on exactly one database state — a fresh
  one with none applied — and fails on every other. The production
  database had two of three, so shipping the third was impossible:
  migration 001's `ALTER TABLE ADD COLUMN` errors on a duplicate column
  long before 003 is reached, and the deploy reports a broken migration
  when the truth is a runner that cannot count. The replacement keeps a
  `schema_migrations` ledger and asks each file's declared **probe**
  whether its effect is already present, so an existing database is
  adopted without anybody hand-editing a ledger. Tested against the four
  states a real database is in: built from `schema.sql` (everything
  baselined, nothing run), the production state (only the missing one
  runs), a new migration arriving next week (only that one runs — done
  against a real extra file in a temp directory, not by faking ledger
  rows), and a genuinely pre-migration database (all three applied in
  order, for real). Two further assertions: a migration declaring no
  probe is a hard error rather than a guess, and a half-applied
  migration stops the run instead of being recorded as done. The last
  test asserts that the **old** behaviour still fails against a real
  database — without it, the passing tests above would not be measuring
  anything. 29 assertions.
- `admin-route-guards.test.mjs` — who may call each administrative
  endpoint, asserted **at the route**, with real signed tokens. It
  exists because of a defect the rest of the suite was structurally
  incapable of seeing: `GET /api/admin/role` shipped under a comment
  reading "Administrator only" and a guard reading `requireStaff()`, so
  every tutor could pull the complete register of who can read student
  records. `admin-roles.test.mjs` could not catch it — `listAppointees()`
  takes no actor, so there was no actor to get wrong — and the browser
  suite only ever opens the page as an administrator. The rule lived in
  one place, the guard, and the guard was the thing that was wrong.
  The contract is now a table in the file, and each row is asserted in
  **both** directions: the intended role gets past the guard, and the
  role one step below is refused with 403 — a one-directional test
  would pass against an endpoint that refuses everybody. An
  unauthenticated caller must get 401, not 403, because "who are you"
  and "not you" are different answers. Two further assertions stop the
  table going stale: every file under `functions/api/admin/` must
  appear in it, and so must every method each of them exports. 36
  assertions; confirmed by restoring the original guard and watching
  exactly the one row fail with `200` where `403` was required.
- `demo-people.test.mjs` — the guard on `sql/seed-demo-people.sql`, the
  fictional eighteen-person staff list used to design the
  administration screens (`docs/org-chart-placeholders.md`). The
  arrangement is only acceptable while two promises hold: the invented
  people never reach production, and they never reach a page the public
  can load — and a promise that nothing checks lasts until the first
  person in a hurry. So it scans every `.html`/`.js`/`.css`/`.json` the
  site serves for every placeholder name, surname, address and id;
  asserts the three properties that make an accidental application
  survivable (`usr_demo_*` ids, `.invalid` addresses that can never
  receive mail, `demo_*` auth ids that no real Clerk token can match);
  and asserts that neither the migrations directory nor the deploy
  workflow can carry the file remote — including that the seed step
  still names its files rather than globbing `sql/seed-*.sql`. It also
  refuses to run its derived assertions if the seed loads zero rows,
  since `[].every(...)` is true and a scan for nothing finds nothing.
  23 assertions; the leak scan confirmed by pasting a placeholder name
  into `faculty/index.html` and watching it fail.
- `run.mjs` — runs everything above and reports a combined summary.
  It discovers `*.test.mjs` by directory listing, so a new backend test
  is picked up by `npm test` and by the CI verify job without either
  being edited.

**Browser tests** (not in `run.mjs` — they need Chromium and a server,
so run them explicitly):

```
node tests/browser/listening-lab.mjs
node tests/browser/lab-auth.mjs
node tests/browser/route-audit.mjs
node tests/browser/verify.mjs
node tests/browser/register.mjs
```

- `browser/listening-lab.mjs` — 43 assertions covering the Listening
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
- `browser/admin-enrolments.mjs` — the enrolment administration page in
  a real browser, against the real enrolment module: search, open a
  learner, withdraw a level, re-enrol, read the audit trail back, and
  confirm that dismissing the reason prompt changes nothing. It found a
  real defect on its first run — the page mapped every 403 to "you do
  not have staff access", so a staff member refused for enrolling
  *themselves* was told they were not staff, which would have sent them
  to ask for access they already had. It also drives the appointment
  controls: that they are offered to an administrator on someone
  else's record and *not* on their own (a control that can only ever
  fail is not a control), that appointing asks two distinct questions —
  why this person, and under whose decision — and that the change lands
  on the record. It then reads the appointment back off the page: the
  transition, who made it, the reason, and the authority on its own
  line. `role_events` was written and unit-tested from the day it was
  added and for that whole time no page displayed it — an accountability
  record nobody can read without a database query does not do the job it
  exists for. Same for the access register ("who can see student
  records"), which is asserted **on arrival**, before anything else
  happens: `appoint()` refreshes the register itself, so a check placed
  after the appointment passes even when the page never renders it on
  load. Found by sabotaging exactly that. 37 assertions.
- `browser/my-programme.mjs` — the route from signing in to a lesson,
  in a real browser. The assertion it exists for is not that the page
  renders: it follows the "Begin" link and checks the Lab does **not**
  show "No unit specified", because a button leading to that error would
  look identical to a working one in every screenshot. Confirmed by
  sabotage — stripping the unit id from the link reproduces exactly that
  message. Also covers the resume-not-restart case, the unenrolled
  state, that the progress bar carries the same sentence for a screen
  reader as the visible count, and that on a 390px viewport the primary
  action is above the fold and at least 44px tall — the defect class
  that already shipped once on the quiz result card. The pace assertions
  include one on wording — no deadline, expiry or penalty language —
  which initially passed against an empty string, so a page rendering no
  pace at all would have reported that its pace wording was admirably
  non-threatening. Found by sabotage and fixed with a length check.
  27 assertions.
- `browser/verify.mjs` — the Award Verification portal, in a real
  browser. It runs with `LAB_REQUIRE_AUTH=1` — the harness mode that
  401s everything — deliberately, because the one property that matters
  most here is that verification works with **no session at all**, and
  the only way to prove that is to run it in a harness hostile to
  anonymous requests.
  The decisive assertion is that a **withdrawn** award still resolves
  and says "withdrawn", with a date and a reason. If a revoked
  certificate produced an error or an empty page, its holder could
  present it and say the portal was down, and every screenshot of a
  working page would look identical. Confirmed by sabotage: making
  `verifyCode()` treat a non-conferred award as "no such code" — the
  obvious, plausible bug — fails nine assertions, including the
  superseded case that would otherwise dead-end a checker holding a
  corrected certificate.
  The scope assertion was rewritten after it was caught being vacuous:
  it originally scanned the page for `@example.com`, an address that
  appears nowhere in the fixture and that the `awards` table has no
  column to hold, so it could never fail. It now allowlists the keys of
  the JSON the page is actually *sent*, which fails the moment
  `publicView()` spreads the database row — the real form the leak would
  take, and one that leaks 17 fields without changing a single pixel.
  Also covered: the QR/permalink path (a scan must land on the record,
  not on a form the scanner has to fill in from the certificate in their
  hand), lower-case and space-separated codes because people retype
  these from print, and the 390px phone case — a phone camera on a
  printed certificate is the overwhelmingly common way this page is
  opened. 39 assertions.
- `browser/register.mjs` — the browsable Graduate Register. Also run
  under `LAB_REQUIRE_AUTH=1`: a roll of award holders published behind a
  login is not published.
  Two failure modes drove the assertions. The page can publish somebody
  who did not consent — the query is tested, but a page that called the
  endpoint without the filter would leak a name while every backend
  assertion stayed green, so the fixture contains a real graduate who
  really declined and the page is checked for their absence. And it can
  look **broken** when it is merely **empty**, which is the state every
  visitor sees until the first conferral: "0 results" on the College's
  own register reads as a fault, so the empty state is asserted to say
  what it means and why the page exists in advance of any award.
  Holder names are transcribed from certificates by people, so one
  assertion feeds a name containing markup through the renderer and
  checks it is displayed rather than executed. Truncation is asserted to
  be *disclosed*: a silently capped roll invites "they only have two
  graduates", a conclusion the visitor never learns is wrong.
  This suite is also why `textOf()` exists here rather than bare
  `page.textContent()`. Sabotaging the empty-state render made the suite
  **crash** on a 30-second locator timeout instead of failing — one line
  of stack in place of the twelve results that would have located the
  regression, with every later assertion silently skipped. Detection is
  not enough on its own; the shape of the failure is part of the test.
  28 assertions.
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
