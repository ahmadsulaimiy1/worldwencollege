# The Platform Capability Map

*What the College can now do, what serves it, what it reads, and
whether a person can reach it. Compiled 20 August 2026 at the close of
the foundation pass, from `functions/api/` and `sql/` as they stand —
not from a plan.*

---

## Why this document exists

Nine domains landed in parallel and none of them could see the others.
The result is a platform with **seventy-seven route files** carrying
**one hundred and one request handlers**, against **twenty served pages
that call an endpoint at all** — and every one of those twenty predates
this pass. Not one of the nine domains that landed has a screen. The
gap between those two numbers is the whole subject of this file.

That gap is not a defect. It is what a foundation pass is: the
machinery is built first, because an interface over machinery that does
not exist is a mock-up, and a mock-up is the one artefact that cannot
be tested. But a gap nobody has written down behaves exactly like a
gap nobody knows about. Six months from now the honest question — "does
the platform do X?" — has three plausible answers (yes and there is a
screen; yes and there is not; no) and no way to tell them apart short
of reading eighty files.

So every capability is listed once, with:

- **the endpoint** that serves it, and the method,
- **who may call it** — the authorisation boundary, exactly as
  `tests/route-guard-census.test.mjs` enumerates it,
- **the tables it reads or writes**, so a schema change can be traced
  to the surfaces it moves,
- **the interface**, if there is one, named by file — and where there
  is none, that cell says so in as many words.

**"No interface" is a statement about the platform, not a criticism of
it.** It is the backlog the next pass builds from, and it is reproduced
in full at the end.

### How to read the authorisation column

Four categories, and they are not interchangeable. The census file
explains each at length; in short:

| | |
|---|---|
| **learner** | `requireUser()`. The subject is taken from the session. No learner endpoint accepts a user id or student id parameter — several refuse one with 422 rather than ignoring it. |
| **staff** / **admin** | `requireStaff()` / `requireAdmin()`, and for the staff routes a further relation check: a tutor reaches the learners they actually teach, an administrator reaches everybody, and the payload says on which basis. |
| **public** | Reachable with no credential at all, deliberately, with the reason recorded in the census. A credential a checker must register for is a credential nobody checks. |
| **reference** | No session — an applicant has no account and cannot be given one. The application reference is a bearer credential: constant-time compare, one identical refusal for unknown and malformed alike, and a per-address lookup allowance. |
| **key** / **signature** | An API key (registered institutions) or a webhook signature (payment gateways). Never anonymous, never a session. |

---

## 1 · Admissions and the applicant

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| Submit an application | `POST /api/admissions/apply` | public | `applications` w, `application_documents` r | **Yes** — `/admissions/apply/` (`js/admissions-wizard.js`) |
| Save and resume a part-finished application | `GET`,`PUT /api/admissions/draft` | public | `application_drafts` rw | **Yes** — the same wizard |
| Attach and remove an identity document | `GET`,`POST`,`DELETE /api/admissions/document` | public | `application_documents` rw, R2 | **Yes** — the same wizard |
| Look up an application's state, short form | `GET /api/admissions/status?id=` | reference | `applications` r | **No interface** |
| Track an application in full — five published stages, audited timeline, what is outstanding and whose it is, the live offer and its expiry | `GET /api/admissions/track?ref=` | reference | `applications` r, `application_events` r, `offers` r | **Yes** — `/admissions/track/` (`js/admissions-track.js`) |
| Issue an offer, conditional or unconditional, with an expiry | `POST /api/admissions/offer` | staff | `offers` w, `application_events` w, `applications` w | **No interface** |
| Accept, decline or withdraw — by the applicant, holding only their reference | `POST /api/admissions/offer?action=` | reference | `offers` w, `application_events` w, `enrolments` w | **Yes** — the same page |
| The admissions queue: filter by status, source, country, level or free text; oldest first; counts by status that the filter does not narrow | `GET /api/staff/applications` | staff | `applications` r, `offers` r, `application_events` r | **No interface** |
| Move an application through the published journey, with the reason recorded | `PATCH /api/staff/applications` | staff | `applications` w, `application_events` w, `enrolments` w | **No interface** |

**One fact, one owner.** `status.js` and `track.js` answer the same
question at two lengths and now resolve the reference through the same
`applicationByReference()` bearer check. Before 20 August 2026 the
short one was a bare `SELECT`, which made every protection on the long
one decorative.

---

## 2 · Money

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| Start a checkout — one level, the full programme, or the next instalment | `POST /api/payments/create-checkout` | learner | `payments` w, `programme_levels` r, `promo_codes` r, `scholarships` r, `currencies` r | **No interface** |
| Create an instalment plan | `POST /api/payments/instalment-plan` | learner | `instalment_plans` w | **No interface** |
| Check a payment's state | `GET /api/payments/verify` | learner | `payments` r | **No interface** |
| Take a gateway's word for it — Stripe, Paystack, Flutterwave, OPay | `POST /api/payments/webhook-*` | signature | `payments` w, `receipts` w, `webhook_events` w | n/a — machine to machine |
| Confirm an enrolment after payment | `POST /api/enrolment/confirm` | learner | `enrolments` w | **No interface** |
| **A learner's own statement of account** — tuition assessed and on what basis, relief with the authority that granted it, every payment and receipt and refund, the instalment schedule, and the balance with the arithmetic that produced it | `GET /api/student/finance` | learner | `payments`, `receipts`, `refunds`, `instalment_plans`, `scholarships`, `promo_codes`, `currencies`, `enrolments`, `programme_levels` — all r | **Yes** — `/my-account.html` (`js/my-account.js`) |
| One invoice as structured data, with its lines and its reconciliation | `GET /api/student/invoice?id=pay_…` | learner | same, r | **Yes** — opened in place on the same page |
| Revenue report | `GET /api/admin/reports/revenue` | admin | `payments` r, `refunds` r | **Yes** — `/finance/preview/` (`js/finance-dashboard.js`) |
| Reconciliation report | `GET /api/admin/reports/reconciliation` | admin | `payments`, `receipts`, `refunds` r | **Yes** — the same page |
| Set or refresh an exchange rate | `POST /api/admin/currency/set-rate`, `/refresh-rates` | admin | `currencies` w | **No interface** |

**Money is integer minor units everywhere**, and `presentAmount()`
throws rather than render a fractional cent. One conversion function
serves the whole platform (`usdCentsToMinorUnits()` in
`functions/_lib/currency.js`); it takes the target currency's decimal
places as an argument, because taking two for granted was a ten-times
error waiting for the day KWD was activated.

---

## 3 · Learning, and the record of it

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| List a level's modules with the learner's own progress | `GET /api/lms/units` | learner | `units`, `courses`, `unit_progress` r | **Yes** — `/my-programme.html` |
| One module in full — lessons, listening, pronunciation lab, quiz without its answer key, assignment | `GET /api/lms/unit` | learner | `learning_items`, `quiz_questions` r | **Yes** — `/listening-lab.html` |
| Sit a quiz | `POST /api/lms/quiz-attempt` | learner | `quiz_attempts` w, `unit_progress` w | **Yes** — the lab |
| Submit an assignment | `POST /api/lms/assignment-submission` | learner | `assignment_submissions` w, `unit_progress` w | **No interface** |
| Mark an assignment | `POST /api/lms/grade-assignment` | staff | `assignment_submissions` w, `unit_progress` w | **No interface** |
| Record and store a spoken submission, in parts | `POST /api/lms/recording/init`, `PUT …/part`, `POST …/complete` | learner | `learner_recordings` w, `recording_upload_parts` w, R2 | **Yes** — the lab |
| Play a stored recording back | `GET /api/lms/recording/audio` | learner | `learner_recordings` r, R2 | **Yes** — the lab |
| The instructor's review queue, and a review | `GET /api/lms/review-queue`, `POST /api/lms/recording-review` | staff | `learner_recordings` rw, `pronunciation_feedback` w | **Yes** — `/instructor-review.html` |
| Listening analytics and a pronunciation profile | `GET /api/lms/listening-analytics`, `/pronunciation-profile` | learner | `listening_events`, `pronunciation_feedback` r | **Yes** — the lab |
| Accrue and read measured study time | `POST`,`GET /api/lms/time-on-task` | learner | `time_on_task` rw | **Yes** — `js/time-on-task.js`, in the lab |
| A level's live sessions | `GET /api/lms/live-sessions` | learner | `live_sessions` r | **No interface** |
| Mark a level complete | `POST /api/lms/complete-level` | staff | `enrolments` w | **No interface** |
| The study plan — where to resume, what is next | `GET /api/student/study-plan` | learner | `units`, `unit_progress`, `enrolments` r | **Yes** — `/my-programme.html` |
| The learner dashboard | `GET /api/student/dashboard` | learner | `enrolments`, `payments`, `awards` r | **Yes** — `/student-portal/preview/` |

**A module completes on one rule and one only.** Since 20 August 2026
every act that can move a module's mark — an attempt, a submission, a
grade — re-reads the module through `moduleMarkForUnit()` and writes
what `module.formula` says: 30 per cent quiz, 70 per cent assignment,
rounded once, and never complete on one component. Until that date the
LMS applied its own rule (either component reaching a configured
threshold) and `unit_progress` was read by the graduate profile, the
Institutional Metric Register and the engagement evidence list — so one
wrong rule was published three ways.

---

## 4 · Where a learner stands

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| **The whole academic standing** — module marks with resits and counting marks, level marks, the four skill marks, the honour, academic standing with its obligations and triggers, graduation conditions each marked met / not met / not instrumented, progression, and a credit-weighted GPA that is null (never 0.00) when nothing has been conferred | `GET /api/student/standing` | learner | `enrolments`, `awards`, `units`, `learning_items`, `quiz_attempts`, `assignment_submissions`, `assessment_skills`, `academic_standing_reviews`, `graduation_eligibility` — r; `academic_standing_reviews`, `graduation_eligibility` w | **Yes** — `/my-standing.html` (`js/my-standing.js`) |
| **The learner's own engagement record** — a week-by-week grid per module, every state carrying the evidence it was read from and the clause it satisfies, with the platform's own recomputed reading beside any staff override | `GET /api/student/attendance` | learner | `attendance_records`, `time_on_task`, `quiz_attempts`, `assignment_submissions`, `learner_recordings`, `unit_progress` r | **No interface** |
| A tutor's roster, or one learner's record in full | `GET /api/staff/attendance` | staff + teaching relation | same, r | **No interface** |
| Take a register | `POST /api/staff/attendance` | staff + teaching relation | `attendance_records` w | **No interface** |
| **Achievements** — the milestone register, what is earned with its evidence, what is not with the shortfall stated, what has been withdrawn, and what is not in force | `GET /api/student/achievements` | learner | `milestone_definitions`, `learner_milestones` rw | **Yes** — the same page |
| The academic record, competencies, skills | `GET /api/student/profile`, `PATCH` | learner | `graduate_profiles`, `competency_marks`, `profile_sections` rw | **Yes** — `/my-record.html` |
| Issued documents — transcript, supplement | `GET`,`POST /api/student/documents` | learner | `issued_documents` rw | **Yes** — `/my-record.html` |
| Share a record slice with an employer | `GET`,`POST`,`DELETE /api/student/profile-shares` | learner | `profile_shares` rw | **Yes** — `/my-record.html` |

**The two absences that block conferral, stated rather than worked
around.** No table records a level examination, so `levelMark()` returns
`examination_not_recorded` for every learner; and `assessment_skills`
holds no approved rows, so every skill mark is null and
`skill.null_blocks_conferral` refuses. The engine reports which of the
two is in play rather than collapsing them into "not eligible". Both
are schema requests, listed in § 10.

---

## 5 · The Registrar

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| Open an appeal, complaint, withdrawal, deferral or transfer, with a quotable reference and the published three-working-day acknowledgement clock already running | `POST /api/student/cases` | learner | `registrar_cases` w, `registrar_case_events` w | **No interface** |
| Escalate an answered case one rung; withdraw a case as the learner's own act | `POST /api/student/cases` (`action`) | learner | same, w | **No interface** |
| Read one's own cases, or one in full with its trail and no staff account ids | `GET /api/student/cases` | learner | same, r | **No interface** |
| The Registrar's queue, ordered by the date each answer falls due | `GET /api/staff/cases` | staff | same, r | **No interface** |
| Record a written answer — refused outright if the decider is conflicted, checked before any other validation | `PATCH /api/staff/cases` (`decide`) | staff | same, w | **No interface** |
| Route, park, resume, set an answer date, close | `PATCH /api/staff/cases` | admin | same, w | **No interface** |

**No stage may be skipped by the College**, and closing an unanswered
case is refused. Both are 403s quoting the instrument, not validation
errors — they are the procedure, not the form.

---

## 6 · Being addressed, and answering back

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| The learner's own notice feed, pinned first then newest, with an unread count that the page size cannot cap | `GET /api/announcements` | learner | `announcements` r, `announcement_receipts` r | **No interface** |
| Mark a notice read (and, separately, dismissed) — written once, never moved | `POST /api/announcements` | learner | `announcement_receipts` w | **No interface** |
| Draft, publish, amend and withdraw a notice; institution, level or one learner | `GET`,`POST`,`PATCH`,`DELETE /api/staff/announcements` | staff (author or admin) | `announcements` rw, `announcement_receipts` r | **No interface** |
| Open a thread to the tutors of a level, to the tutors of a module, or to the Registrar's desk | `POST /api/messages` | learner | `message_threads` w, `message_participants` w, `messages` w | **No interface** |
| The thread list, with an uncapped unread count and who may be written to — a reachable count, never a roster | `GET /api/messages` | learner | same, r | **No interface** |
| Read a thread — which moves the read watermark to the newest message actually returned, never to the clock and never backwards | `GET /api/messages/{thread}` | learner | same, rw | **No interface** |
| Reply — a word from the desk marks the thread answered, a word back re-opens it | `POST /api/messages/{thread}` | learner or staff | same, w | **No interface** |
| Write to a learner one teaches | `POST /api/messages` (staff) | staff + teaching relation | same, w | **No interface** |

**Nobody's email address appears on any messaging payload**, and the
Registrar is named as a desk rather than as a person, because no table
records who holds the office.

---

## 7 · The week ahead

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| One merged, time-sorted feed of what is next — classes at levels held, tutorials booked, and dated obligations that are the learner's own — every time carrying UTC, local, offset and zone | `GET /api/student/timetable` | learner | `live_sessions`, `tutorial_slots`, `slot_bookings`, `enrolments`, `offers`, `student_settings` r | **No interface** |
| The same feed as a calendar file (RFC 5545, folded to 75 octets, UID keyed to the source row so a re-export updates rather than duplicates) | `GET /api/student/timetable?format=ics` | learner | same, r | **No interface** |
| **The hours open to this learner** — every published slot they may actually take, filtered by exactly what `bookSlot()` refuses, with a full one listed and marked full rather than hidden | `GET /api/student/booking` | learner | `tutorial_slots`, `slot_bookings`, `enrolments` r | **No interface** |
| Book a tutorial — six distinct refusals, each with its own message and its own field | `POST /api/student/booking` | learner | `slot_bookings` w, `tutorial_slots` r | **No interface** |
| Cancel a booking, with a reason (mandatory) | `DELETE /api/student/booking` | learner | `slot_bookings` w | **No interface** |
| Publish an hour — validated to an explicit offset, a real level, a module of that level, an https join URL, and no overlap with time already offered | `POST /api/staff/slots` | staff | `tutorial_slots` w, `live_sessions` r | **No interface** |
| Withdraw an hour, releasing every learner in it with the tutor's reason on their record | `POST /api/staff/slots` (`withdraw`) | staff | `tutorial_slots` w, `slot_bookings` w | **No interface** |
| A tutor's own published hours with who is booked into each | `GET /api/staff/slots` | staff (own) / admin (any) | same, r | **No interface** |

**A calendar subscription is not possible yet** and the endpoint says
so rather than pretending: a calendar client sends no Authorization
header, and no table can hold a revocable feed token. `?format=ics` is
a session-guarded download.

---

## 8 · Credentials, verification and the public record

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| Verify an award from its code | `GET /api/verify/{code}` | public | `awards`, `award_verifications` rw | **Yes** — `/verify.html` |
| Verify an issued transcript or supplement | `GET /api/verify/document/{code}` | public | `issued_documents` r | **Yes** — `/verify.html` |
| The Employer and University Portal — records the check without recording who asked | `GET /api/verify/institutional/{code}` | public | `awards` r, `institutional_verifications` w | **Yes** — `/verify.html` |
| The same check for a registered institution, identified and rate-limited | `GET /api/institutional/verify` | key | same, and `verifying_institutions` r | **No interface** |
| Register an institution / list them | `GET`,`POST /api/admin/institutions` | admin | `verifying_institutions` rw | **No interface** |
| The QR image for a verification URL — looks nothing up, deliberately, so it cannot become an enumeration oracle | `GET /api/credentials/qr` | public | none | **Yes** — `/verify.html`, `/graduate.html` |
| The College's published signing keys | `GET /api/credentials/jwks` | public | `signing_keys` r (public halves only) | n/a — machine to machine |
| Rotate and inspect signing keys | `GET /api/admin/signing-keys` | admin | `signing_keys` r | **No interface** |
| A published graduate profile | `GET /api/graduate/{handle}` | public | `graduate_profiles` r | **Yes** — `/graduate.html` |
| A shared record slice, opened by a token an employer holds | `GET /api/share/{token}` | public (token) | `profile_shares` r | **Yes** — `/graduate.html` |
| The Graduate Register | `GET /api/register` | public | `awards` r | **Yes** — `/register.html` |

---

## 9 · Administration

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| Who am I, and what may I do | `GET /api/auth/me` | learner | `users` r | **Yes** — every portal page |
| Provision an account from the identity provider | `POST /api/auth/webhook-clerk` | signature | `users` w | n/a |
| List learners; open, amend or withdraw an enrolment | `GET /api/admin/learners`, `POST /api/admin/enrolment` | staff | `enrolments` rw, `enrolment_events` w | **Yes** — `/admin-enrolments.html` |
| Grant and remove a role, with the act recorded | `GET`,`POST /api/admin/role` | admin | `users` w, `role_events` w, `staff_appointments` r | **Yes** — `/admin-enrolments.html` |
| The Institutional Metric Register — every metric the Executive undertook to watch, declared whether or not it can be computed, with small cohorts suppressed rather than rounded | `GET /api/admin/institutional-metrics` | staff | many, r | **No interface** |
| The quality-assurance evidence register | `GET /api/admin/evidence` | staff | `evidence_items`, `evidence_versions` r | **No interface** |
| Competency coverage against the Academic Framework's own rule | `GET /api/admin/quality/competency-coverage` | staff | `assessment_competencies` r | **No interface** |
| Purge a recording past its retention date | `POST /api/admin/recordings/purge` | admin | `learner_recordings` w, R2 | **No interface** |

---

## 10 · What the platform cannot do, and what would close it

Every item here is a **schema or infrastructure** gap reported by the
engineer who hit it. None is a code defect, and none is worked around
silently — in each case the payload says what is missing.

| Gap | Consequence today | What closes it |
|---|---|---|
| **No table records a level examination** — no overall mark, no criterion sub-marks, no four skill sub-marks, no spoken paper, no resat flag | `levelMark()` is always `examination_not_recorded`; no honour can be computed; no GPA can grow; graduation reaches `conditional` and never `eligible` | A `level_examinations` table plus per-criterion and per-skill sub-mark rows |
| **`assessment_skills` holds no approved rows** | Every level skill mark is null and `skill.null_blocks_conferral` refuses conferral for every learner | Academic mapping work, proposed and approved. Not a software task |
| **Neither `quiz_attempts` nor `assignment_submissions` records an attempt ordinal** | The engine infers order from `submitted_at`, which is sound for "was this a resit" and unsound for enforcing the 14-day resit interval or the 365-day task refresh | An `attempt_ordinal` and a counting-attempt flag on both tables |
| **`academic_standing_reviews` has no cleared / lifted column** | A flag can be raised and cannot be lifted at the same review point — `UNIQUE(user_id, level_id, review_point)` forbids two states | `cleared_at` / `cleared_by` / `cleared_reason`, or a `standing_events` table |
| **`suspended_progression` can never be computed** | Its only published trigger is a misconduct matter, and `registrar_cases` excludes misconduct by design. A person records the band; the engine carries it forward and refuses to overwrite it | Believed correct as designed. Reported so the absence is deliberate |
| **No assessment due date exists anywhere** | The timetable declares `assessment_due_dates` unreadable in its own payload rather than inventing deadlines | Probably an offset on `learning_items` (days from `enrolments.started_at`) plus an override table. An academic decision |
| **No revocable calendar-feed token table** | `?format=ics` is a download, not a subscription | `calendar_feed_tokens(user_id, token_hash, issued_at, last_used_at, revoked_at)` — `profile_shares` is the model |
| **`enrolments.status` has no `paused` or `deferred`** | A granted deferral cannot be recorded against the enrolment; the intent is emitted `blocked: true` and explicitly forbids recording it as a withdrawal instead | A migration adding the status and the matching `enrolment_events` transition |
| **No representation of a transfer** | A granted transfer is a withdrawal plus a new enrolment, and the destination level survives only in free text | A `destination_level_id` on `registrar_cases`, or a transfer pair in `enrolment_events` |
| **`registrar_cases` does not name the decision under appeal** | The conflict rule bars every marker at the level rather than the one the instrument bars (a deliberate superset); and the published 20-working-day window to appeal cannot be enforced, only reported | `decision_ref` + `decision_taken_on` |
| **Nothing records academic seniority, or membership of the Senate or Board** | "Other than the original decision-maker" is enforced; "senior to" is not, and is not reported as satisfied | A seniority fact, and a membership table |
| **No `announcement_events` and no `updated_at`** | The text of a published notice can be amended without trace. The audience and publish date are frozen instead, and a withdrawn notice is immutable | An `announcement_events` table mirroring `enrolment_events` |
| **`announcements` has no `language` / `title_ar` / `body_ar`** | Two editions are encoded into one `body` column with ASCII record separators, asserted against bytes so a row with none still reads as a single English edition | Three columns; retiring the encoding is then one `UPDATE` per row |
| **`message_threads.scope` has no `assignment`** | A thread cannot be attached to a piece of submitted work | A scope value and a reference |
| **No office-holder table** | `recipient: "registrar"` resolves to `users.role = 'admin'`, and the payload names a desk rather than a person — which is also what CLAUDE.md § 5 requires while no appointment is recorded | An office / holder / appointment-date table |
| **No teaching-assignment table** | Both `assertMayReadLearner()` and "the tutors of a level" are composed from teaching acts. A newly appointed tutor is unreachable until they have hosted, offered, marked or registered something | A declarative `teaching_assignments` table retires the composition on both sides |
| **No `attendance_events`** | A staff override overwrites the row it corrects; only the current hand survives. Mitigated by returning the platform's own recomputed reading beside every override | An events table mirroring `enrolment_events` |
| **`attendance_records.evidence_kind` has no value for server-measured study time, and none meaning "no evidence found"** | Study time is filed under `lesson_completion` with the precise table named in `signal`; a derived absence is the absence of a row | Two enum values |
| **`time_on_task` holds one cumulative row per learner per module** | The "twenty minutes in the window" clause is exact only when the whole accrual span lies inside one window; a straddling span is reported as not counting | A per-window study ledger |
| **`instalment_plans` carries no due date and no cadence** | Every `dueOn` is null. The amount is exact; the date has nothing behind it | A `due_on` per instalment, or an adopted cadence plus a plan start |
| **`refunds` has no `amount_usd_cents` and no currency** | `amount_cents` is read as USD cents, agreeing exactly with the revenue report so a learner's statement and an administrator's cannot disagree. A non-USD refund cannot be represented | `amount_usd_cents`, and ideally `currency` |
| **`payments` records no pre-discount base amount** | A historical invoice's gross line moves if a level's price changes. The `matchesChargedAmount` flag surfaces the divergence | `base_amount_usd_cents` |
| **Nothing records the College's billing entity** | An invoice carries no issuer block — printing a letterhead would invent a legal name, an address and a tax registration | An institution-details record |
| **No `invoices` table** | An invoice is derived from a payment; `id` is a payment id | Needed only if the College wants a sequential invoice number issued before payment |
| **`scholarships.approved_by` has no foreign key and there is no `approved_at`** | Only the approver's role is published, never a name; the approval date cannot be published at all | A key and a date |
| **No durable store for the reference-lookup rate limit** | The applicant lookup allowance is isolate-local, and the module says so rather than implying it is global | A KV namespace or a counter table |
| **No `ConflictError` (409) in `functions/_lib/db.js`** | A full slot and a double booking return 422 with a field map. Semantically several are conflicts | One error class; `bookSlot()`'s five refusals are the callers to reclassify |
| **`tutorial_slots` and `slot_bookings` have no event trail and no `cancelled_by`** | An administrator withdrawing a departed tutor's hour is indistinguishable from the tutor doing it | A `slot_events` table, or `cancelled_by` on both |
| **Nothing writes `slot_bookings` `attended` / `no_show`, or `tutorial_slots.status = 'held'`** | Those states are unreachable | A route by which a tutor records the outcome of an hour |
| **`milestone_definitions` carries no rule and no Arabic columns** | A definition inserted by hand is returned in `unevaluable` and awards nothing; both editions reach the learner from the code register | `rule` + `parameters_json`, and `name_ar` / `academic_fact_ar` |
| **No route installs or revokes a milestone definition** | `seedMilestoneDefinitions()` and `approveMilestoneDefinition()` are exported and tested and nothing calls them | `functions/api/admin/milestones.js` (`requireAdmin`) |
| **No pronunciation target is published anywhere** | The pronunciation milestone measures improvement against the learner's own first attempt instead, which needs no threshold | An adopted figure, or leave it |
| **`competency_marks.mark` has no published translation to a level result** | No competency milestone may state a level | Governance decision B1/B2 |
| **Nothing observes who joins a live session** | Every live-session attendance row is a person's register. No proportion-of-cohort figure is published, and the metric says why | Host confirmation, or a join signal |
| **No misconduct case register** | The procedure was adopted 14 August 2026 (C9) and published; no table holds a case under it. The metric register reports "no cases recorded", never zero | A misconduct register the adopted procedure can be recorded in |
| **`functions/_lib/notifications/events.js` holds one lifecycle template** | Six admissions transitions and every message event report `no_template_in_catalog` at runtime and send nothing | Template entries. Availability is discovered at runtime, so nothing else changes |
| **No JSON-import spelling works in both runtimes** | `data/academic-regulations.json` is transcribed into `marks.js`, pinned constant by constant to the file by `tests/academic-standing.test.mjs` | wrangler carrying esbuild ≥ 0.20, or a build step emitting a `.js` module |
| **Cloudflare Pages routes `/api/x/y` only to `functions/api/x/y.js`** | `POST /api/announcements/read` and `POST /api/admissions/offer/accept` are not served as separate paths. The read receipt rides on `POST /api/announcements`; the applicant actions on `?action=`. Both handlers already honour the sub-path if it is ever routed to them | One re-export file each — deliberately **not** added, because two paths for one act is the contradiction this pass exists to remove |

---

## 11 · The interface backlog

Every capability above with **no interface**, in one list, ordered by
how much of the College's published promise is currently unreachable.
This is the map the next pass builds from.

### The learner cannot see

1. ~~**Their statement of account.**~~ **CLOSED 21 August 2026** — `/my-account.html`, both editions. Every figure is the endpoint's own string, the identity is printed term by term, `reconciliation.balances` is surfaced rather than swallowed, and `basis` is rendered as a provenance citation rather than as prose. Asserted end to end in a real browser by `tests/browser/my-account.mjs`.
2. ~~**An invoice.**~~ **CLOSED 21 August 2026** — opened in place on the same page, keyboard-reachable, closing on Escape.
3. ~~**Where they stand academically.**~~ **CLOSED 21 August 2026** — `/my-standing.html`, both editions. The conditions of the award are drawn in TWO groups by `condition.owner`, so a learner is never told they fell short of a record the College has not made; `tests/browser/my-standing.mjs` asserts that nothing College-owned reaches the learner's list.
4. **Their engagement record.** The week-by-week grid, the evidence behind every state, and the platform's own reading beside any staff correction. `GET /api/student/attendance`.
5. ~~**Their achievements.**~~ **CLOSED 21 August 2026** — on the same page, with the evidence on what is held, the measured shortfall on what is not, and the reason on anything withdrawn.
6. **What is next.** The merged timetable — classes, tutorials, dated obligations. `GET /api/student/timetable`.
7. **A tutorial to book, or a booking to cancel.** `POST` / `DELETE /api/student/booking`. *(The GET that lists what there is to book was added 21 August 2026 — until then the platform could accept a booking and could not be asked what there was to book.)*
8. **Notices addressed to them, and the unread count.** `GET`,`POST /api/announcements`.
9. **A thread to their tutors or to the Registrar's desk, and the replies.** `GET`,`POST /api/messages`, `GET`,`POST /api/messages/{thread}`.
10. **An appeal, complaint, withdrawal, deferral or transfer** — opening one, reading its stage and its clock, escalating it, withdrawing it. `GET`,`POST /api/student/cases`.
11. ~~**The state of their application**, before they are a learner at all.~~ **CLOSED 21 August 2026** — `/admissions/track/`, both editions, driven by `GET /api/admissions/track` and asserted end to end in a real browser by `tests/browser/admissions-track.mjs`.
12. ~~**An offer to accept or decline.**~~ **CLOSED 21 August 2026** — answered from the same page, by `POST /api/admissions/offer?action=` and the same reference.
13. **A checkout, an instalment plan, and confirmation of payment.** `POST /api/payments/create-checkout`, `/instalment-plan`, `/api/enrolment/confirm`, `GET /api/payments/verify`.
14. **An assignment to submit.** `POST /api/lms/assignment-submission`.
15. **The live sessions of their level.** `GET /api/lms/live-sessions`.

### A tutor cannot

16. **Mark an assignment.** `POST /api/lms/grade-assignment`.
17. **See their roster, or one learner's engagement record.** `GET /api/staff/attendance`.
18. **Take a register.** `POST /api/staff/attendance`.
19. **Publish an hour, or withdraw one.** `POST /api/staff/slots`.
20. **See who is booked into their hours.** `GET /api/staff/slots`.
21. **Write to a learner they teach, or answer one.** `POST /api/messages`, `POST /api/messages/{thread}`.
22. **Draft, publish, amend or withdraw a notice.** `GET`,`POST`,`PATCH`,`DELETE /api/staff/announcements`.
23. **Answer a case they are not conflicted on.** `PATCH /api/staff/cases`.
24. **Mark a level complete.** `POST /api/lms/complete-level`.

### The Registrar and Admissions cannot

25. **Work the admissions queue** — filter it, move an application, record the reason. `GET`,`PATCH /api/staff/applications`.
26. **Issue an offer.** `POST /api/admissions/offer`.
27. **Work the case queue** — ordered by when each answer falls due, with the overdue ones first. `GET /api/staff/cases`.
28. **Route, park, resume, re-date or close a case.** `PATCH /api/staff/cases`.

### An administrator cannot

29. **Read the Institutional Metric Register** — the register an accreditation reviewer would be shown. `GET /api/admin/institutional-metrics`.
30. **Read the evidence register, or competency coverage.** `GET /api/admin/evidence`, `/api/admin/quality/competency-coverage`.
31. **Register a verifying institution, or issue it a key.** `GET`,`POST /api/admin/institutions`.
32. **Inspect or rotate the signing keys.** `GET /api/admin/signing-keys`.
33. **Set or refresh an exchange rate.** `POST /api/admin/currency/set-rate`, `/refresh-rates`.
34. **Purge a recording past its retention date.** `POST /api/admin/recordings/purge`.

---

## 12 · What holds all of this together

Four guardrails carry the load, and each fails the build rather than
warning:

- **`tests/route-guard-census.test.mjs`** walks `functions/api/`, finds
  every `onRequest*` export, and runs it. Every handler must either
  appear in one of four named lists with a written reason, or refuse an
  unauthenticated request with 401. The lists are closed in both
  directions: an unlisted route fails, and a listed route that no
  longer exists fails too.
- **`tests/admin-route-guards.test.mjs`** asserts which role reaches
  each administrative endpoint, route by route.
- **`tests/published-claims.test.mjs`** fails on a figure that
  `data/standing.json` did not release, and
  **`tests/institution.test.mjs`** fails on a personal name in an office
  with no appointment behind it.
- **`tests/academic-standing.test.mjs` § 1** pins every constant
  transcribed into `marks.js` to `data/academic-regulations.json`, and
  now also holds `platform_config.lms_pass_threshold` identical to the
  adopted pass mark, in the units each is written in.

`node --experimental-sqlite tests/run.mjs` runs the whole suite.
`node scripts/red-flag-audit.mjs` must report nought findings.
`node scripts/build.js` regenerates every served page from `pages/`.

### The contradictions this pass closed

Named here because the next parallel build will produce the same shapes,
and knowing what they looked like the first time is most of finding
them the second.

| Two owners of | Resolved by |
|---|---|
| **Module completion** — `lms/content.js` used its own either-component rule against a config threshold; `academic/marks.js` carries the adopted 30/70 composite | One function, `moduleMarkForUnit()`. `content.js` reads no threshold of its own |
| **The pass mark** — `platform_config.lms_pass_threshold` (0.7) and `marking_scale.pass_mark` (70) | The instrument owns it; the config mirrors it; a test holds the two identical in the units each is written in |
| **An application's status** — `admissions/status.js` did a bare `SELECT`, `admissions/track.js` treated the reference as a bearer credential | Both resolve through `applicationByReference()`. The weaker door is gone |
| **Whether attendance is instrumented** — the metric register said "nothing records who was there"; `attendance_records` and two endpoints said otherwise | The metric is computed, and names precisely which half of itself is still uninstrumented |
| **Whether a misconduct procedure exists** — the register said the College had neither a procedure nor a case register; decision C9 adopted the procedure on 14 August 2026 | The entry now separates the procedure (adopted, published) from the register (still absent) |
| **USD → minor units** — `currency.js` and `student/finance.js` held identical copies, both assuming two decimal places | One pure function taking the target's decimal places. The assumption was a ten-times error waiting for KWD |
| **`parseLimit`** — four byte-equivalent copies across four domains, and four separately-editable refusal messages | One rule in `db.js`; each caller keeps only its own bounds |
| **A read receipt at two addresses**, and **an offer acceptance at two addresses** | Neither sub-path added. One act, one address |
