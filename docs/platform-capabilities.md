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

**"No interface" was a statement about the platform, not a criticism of
it** — it was the backlog each pass built from, and it is reproduced in
full at the end with what closed each line and when. As of 22 August
2026 two entries remain, and both say **no interface, by design**
rather than merely "none": one is a short-form endpoint whose question
is already answered in full elsewhere, and the other is called by
another institution's software rather than by a person.

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
| Look up an application's state, short form | `GET /api/admissions/status?id=` | reference | `applications` r | **No interface, by design** — `/admissions/track/` answers the same question in full, and a second surface over a shorter payload would be a second thing to keep true |
| Track an application in full — five published stages, audited timeline, what is outstanding and whose it is, the live offer and its expiry | `GET /api/admissions/track?ref=` | reference | `applications` r, `application_events` r, `offers` r | **Yes** — `/admissions/track/` (`js/admissions-track.js`) |
| Issue an offer, conditional or unconditional, with an expiry | `POST /api/admissions/offer` | staff | `offers` w, `application_events` w, `applications` w | **Yes** — `/staff-admissions.html` |
| Accept, decline or withdraw — by the applicant, holding only their reference | `POST /api/admissions/offer?action=` | reference | `offers` w, `application_events` w, `enrolments` w | **Yes** — the same page |
| The admissions queue: filter by status, source, country, level or free text; oldest first; counts by status that the filter does not narrow | `GET /api/staff/applications` | staff | `applications` r, `offers` r, `application_events` r | **Yes** — `/staff-admissions.html` |
| Move an application through the published journey, with the reason recorded | `PATCH /api/staff/applications` | staff | `applications` w, `application_events` w, `enrolments` w | **Yes** — `/staff-admissions.html` |

**One fact, one owner.** `status.js` and `track.js` answer the same
question at two lengths and now resolve the reference through the same
`applicationByReference()` bearer check. Before 20 August 2026 the
short one was a bare `SELECT`, which made every protection on the long
one decorative.

---

## 2 · Money

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| Start a checkout — one level, the full programme, or the next instalment | `POST /api/payments/create-checkout` | learner | `payments` w, `programme_levels` r, `promo_codes` r, `scholarships` r, `currencies` r | **Yes** — `/my-account.html` |
| Create an instalment plan | `POST /api/payments/instalment-plan` | learner | `instalment_plans` w | **Yes** — `/my-account.html` |
| Check a payment's state | `GET /api/payments/verify` | learner | `payments` r | **Yes** — `/student-portal/payment-complete/` |
| Take a gateway's word for it — Stripe, Paystack, Flutterwave, OPay | `POST /api/payments/webhook-*` | signature | `payments` w, `receipts` w, `webhook_events` w | n/a — machine to machine |
| Confirm an enrolment after payment | `POST /api/enrolment/confirm` | learner | `enrolments` w | **Yes** — `/student-portal/payment-complete/` |
| **A learner's own statement of account** — tuition assessed and on what basis, relief with the authority that granted it, every payment and receipt and refund, the instalment schedule, and the balance with the arithmetic that produced it | `GET /api/student/finance` | learner | `payments`, `receipts`, `refunds`, `instalment_plans`, `scholarships`, `promo_codes`, `currencies`, `enrolments`, `programme_levels` — all r | **Yes** — `/my-account.html` (`js/my-account.js`) |
| One invoice as structured data, with its lines and its reconciliation | `GET /api/student/invoice?id=pay_…` | learner | same, r | **Yes** — opened in place on the same page |
| Revenue report | `GET /api/admin/reports/revenue` | admin | `payments` r, `refunds` r | **Yes** — `/staff-finance.html` (`js/staff-finance.js`) |
| Reconciliation report | `GET /api/admin/reports/reconciliation` | admin | `payments`, `receipts`, `refunds` r | **Yes** — the same page |
| Set or refresh an exchange rate | `POST /api/admin/currency/set-rate`, `/refresh-rates` | admin | `currencies` w | **Yes** — `/staff-administration.html` |

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
| Submit an assignment | `POST /api/lms/assignment-submission` | learner | `assignment_submissions` w, `unit_progress` w | **Yes** — `/my-module.html` |
| **The work waiting to be marked** — oldest first, each piece carrying the rubric it was set against, the wait in days, and the mark it is a resit of | `GET /api/lms/marking-queue` | staff | `assignment_submissions`, `users`, `learning_items` r | **Yes** — `/staff-marking.html` |
| Mark an assignment | `POST /api/lms/grade-assignment` | staff | `assignment_submissions` w, `unit_progress` w | **Yes** — `/staff-marking.html` |
| Record and store a spoken submission, in parts | `POST /api/lms/recording/init`, `PUT …/part`, `POST …/complete` | learner | `learner_recordings` w, `recording_upload_parts` w, R2 | **Yes** — the lab |
| Play a stored recording back | `GET /api/lms/recording/audio` | learner | `learner_recordings` r, R2 | **Yes** — the lab |
| The instructor's review queue, and a review | `GET /api/lms/review-queue`, `POST /api/lms/recording-review` | staff | `learner_recordings` rw, `pronunciation_feedback` w | **Yes** — `/staff-marking.html` |
| Listening analytics and a pronunciation profile | `GET /api/lms/listening-analytics`, `/pronunciation-profile` | learner | `listening_events`, `pronunciation_feedback` r | **Yes** — the lab |
| Accrue and read measured study time | `POST`,`GET /api/lms/time-on-task` | learner | `time_on_task` rw | **Yes** — `js/time-on-task.js`, in the lab |
| A level's live sessions | `GET /api/lms/live-sessions` | learner | `live_sessions` r | **Yes** — `/my-module.html` |
| Mark a level complete | `POST /api/lms/complete-level` | staff | `enrolments` w | **Yes** — `/staff-learners.html` |
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
| **The level examination** — what the candidate is entered for, the sitting reference they read aloud, the window, the three-hour clock, the lateness band, the released mark and whether it is still provisional; and the whole published procedure in the reader's own language | `GET`,`POST /api/student/examination` | learner | `level_examinations`, `examination_papers`, `examination_criteria`, `examination_marks`, `examination_reconciliations` r; `level_examinations` w (open, submit) | **Yes** — `/my-examination.html`, both editions |
| **The marking queue, and one script prepared for a marker** — first-marking and second-marking queues, oldest first, with the other reader's numbers WITHHELD until the marker's own are recorded | `GET /api/staff/examinations` | staff | same, r | **Yes** — `/staff-examinations.html`, both editions |
| **Enter a candidate, record a reading, settle a reconciliation, mark the spoken paper, release, close moderation, set aside, void, lift a late cap** | `POST /api/staff/examinations` (`?action=`) | staff (+ teaching relation to enter) | same, w; `examination_events` w | **Yes** — the same page |
| **Author an examination paper and its rubric, and publish it** — publishing is what stamps `rubric_published_on`, and it refuses a rubric whose weights do not sum to 1, one that measures fewer than four skills, or one with no spoken criterion | `GET`,`POST /api/admin/examination-papers` | admin | `examination_papers`, `examination_criteria` rw | **Yes** — `/staff-papers.html`, both editions |
| **The learner's own engagement record** — a week-by-week grid per module, every state carrying the evidence it was read from and the clause it satisfies, with the platform's own recomputed reading beside any staff override | `GET /api/student/attendance` | learner | `attendance_records`, `time_on_task`, `quiz_attempts`, `assignment_submissions`, `learner_recordings`, `unit_progress` r | **Yes** — `/my-engagement.html` |
| A tutor's roster, or one learner's record in full | `GET /api/staff/attendance` | staff + teaching relation | same, r | **Yes** — `/staff-learners.html` |
| Take a register | `POST /api/staff/attendance` | staff + teaching relation | `attendance_records` w | **Yes** — `/staff-learners.html` |
| **Achievements** — the milestone register, what is earned with its evidence, what is not with the shortfall stated, what has been withdrawn, and what is not in force | `GET /api/student/achievements` | learner | `milestone_definitions`, `learner_milestones` rw | **Yes** — the same page |
| **Confer an award, withdraw one, replace one** — the conferral queue in three groups (ready, waiting on the College, held), one candidate's whole position with the exact wording of the certificate composed from `award_definitions` and the regulations before the act, and the act itself | `GET`,`POST /api/admin/conferral` | admin | `awards`, `award_definitions`, `graduation_eligibility`, `credential_signatures` rw; the whole standing engine r | **Yes** — `/staff-conferral.html`, both editions |
| **The learner's own certificates** — every conferral drawn as the certificate itself, with the award title, post-nominal, honour and citation exactly as the register denormalised them, the verification code, its QR, and the key that signed it (or the fact that none did) | `GET /api/student/awards` | learner | `awards`, `credential_signatures` r | **Yes** — `/my-award.html`, both editions |
| The academic record, competencies, skills | `GET /api/student/profile`, `PATCH` | learner | `graduate_profiles`, `competency_marks`, `profile_sections` rw | **Yes** — `/my-record.html` |
| Issued documents — transcript, supplement | `GET`,`POST /api/student/documents` | learner | `issued_documents` rw | **Yes** — `/my-record.html` |
| **Everything the College has issued or licensed, from one address** — the identity the learner is held under (the name, since when, against which enrolments, with the published identity sentence and the plain statement that it is not a government document), and four shelves pointing at the pages that own certificates, issued documents, invoices and receipts, and the Library | `GET /api/student/downloads` | learner | `users`, `enrolments`, `awards`, `issued_documents`, the finance ledger — all r | **Yes** — `/my-downloads.html`, both editions |
| Share a record slice with an employer | `GET`,`POST`,`DELETE /api/student/profile-shares` | learner | `profile_shares` rw | **Yes** — `/my-record.html` |

**One of the two absences that blocked conferral is closed.**

~~No table records a level examination.~~ **CLOSED 23 August 2026** —
`sql/migrations/023-level-examination.sql` and
`functions/_lib/academic/examinations.js`. Six tables: the versioned
paper and its rubric, the sitting, a mark per criterion PER MARKER, the
written reconciliation, and the trail. Every figure in the library is
transcribed from `/students/examinations/` and
`/academics/tutor-handbook/`, and `tests/level-examination.test.mjs`
reads the BUILT HTML of both pages and fails the build if a constant and
the sentence a learner reads ever disagree.

The chain that was inert now runs end to end: a released sitting
produces a level mark, an honour, a grade point and a graduation
position. `tests/level-examination.test.mjs` drives a candidate from an
empty database to a level mark of 85.88 through the real standing
engine, and the second-marking rule is enforced rather than described —
a second marker cannot see the first reading until their own is
recorded, and nothing releases until every reconciliation is settled in
writing.

**What is still absent, and it is one thing rather than two.**
`assessment_skills` holds no approved rows, so every LEVEL skill mark is
null and `skill.null_blocks_conferral` refuses. That is academic mapping
work, not a software task, and it is the College's rather than any
learner's — `levelConditions()` was corrected the day level marks became
computable, because a candidate with a level mark of 85.88 was being
shown that they had not met the Pass condition. They had.

The examination's OWN four skill sub-marks are a different quantity and
they exist: they come from `examination_criteria.skill_id`, and
`publishPaper()` refuses a paper that does not measure all four.

---

## 5 · The Registrar

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| Open an appeal, complaint, withdrawal, deferral or transfer, with a quotable reference and the published three-working-day acknowledgement clock already running | `POST /api/student/cases` | learner | `registrar_cases` w, `registrar_case_events` w | **Yes** — `/my-cases.html` |
| Escalate an answered case one rung; withdraw a case as the learner's own act | `POST /api/student/cases` (`action`) | learner | same, w | **Yes** — `/my-cases.html` |
| Read one's own cases, or one in full with its trail and no staff account ids | `GET /api/student/cases` | learner | same, r | **Yes** — `/my-cases.html` |
| The Registrar's queue, ordered by the date each answer falls due | `GET /api/staff/cases` | staff | same, r | **Yes** — `/staff-cases.html` |
| Record a written answer — refused outright if the decider is conflicted, checked before any other validation | `PATCH /api/staff/cases` (`decide`) | staff | same, w | **Yes** — `/staff-cases.html` |
| Route, park, resume, set an answer date, close | `PATCH /api/staff/cases` | admin | same, w | **Yes** — `/staff-cases.html` |

**No stage may be skipped by the College**, and closing an unanswered
case is refused. Both are 403s quoting the instrument, not validation
errors — they are the procedure, not the form.

---

## 6 · Being addressed, and answering back

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| The learner's own notice feed, pinned first then newest, with an unread count that the page size cannot cap | `GET /api/announcements` | learner | `announcements` r, `announcement_receipts` r | **Yes** — `/my-desk.html` |
| Mark a notice read (and, separately, dismissed) — written once, never moved | `POST /api/announcements` | learner | `announcement_receipts` w | **Yes** — `/my-desk.html` |
| Draft, publish, amend and withdraw a notice; institution, level or one learner | `GET`,`POST`,`PATCH`,`DELETE /api/staff/announcements` | staff (author or admin) | `announcements` rw, `announcement_receipts` r | **Yes** — `/staff-notices.html` |
| Open a thread to the tutors of a level, to the tutors of a module, or to the Registrar's desk | `POST /api/messages` | learner | `message_threads` w, `message_participants` w, `messages` w | **Yes** — `/my-desk.html` |
| The thread list, with an uncapped unread count and who may be written to — a reachable count, never a roster | `GET /api/messages` | learner | same, r | **Yes** — `/my-desk.html` |
| Read a thread — which moves the read watermark to the newest message actually returned, never to the clock and never backwards | `GET /api/messages/{thread}` | learner | same, rw | **Yes** — `/my-desk.html` |
| Reply — a word from the desk marks the thread answered, a word back re-opens it | `POST /api/messages/{thread}` | learner or staff | same, w | **Yes** — `/my-desk.html` and `/staff-notices.html` |
| Write to a learner one teaches | `POST /api/messages` (staff) | staff + teaching relation | same, w | **Yes** — `/staff-notices.html` |

**Nobody's email address appears on any messaging payload**, and the
Registrar is named as a desk rather than as a person, because no table
records who holds the office.

---

## 7 · The week ahead

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| One merged, time-sorted feed of what is next — classes at levels held, tutorials booked, and dated obligations that are the learner's own — every time carrying UTC, local, offset and zone | `GET /api/student/timetable` | learner | `live_sessions`, `tutorial_slots`, `slot_bookings`, `enrolments`, `offers`, `student_settings` r | **Yes** — `/my-week.html` (`js/my-week.js`) |
| The same feed as a calendar file (RFC 5545, folded to 75 octets, UID keyed to the source row so a re-export updates rather than duplicates) | `GET /api/student/timetable?format=ics` | learner | same, r | **Yes** — fetched with the session header and saved as a blob, because an `<a href>` cannot carry one |
| **The hours open to this learner** — every published slot they may actually take, filtered by exactly what `bookSlot()` refuses, with a full one listed and marked full rather than hidden | `GET /api/student/booking` | learner | `tutorial_slots`, `slot_bookings`, `enrolments` r | **Yes** — the same page |
| Book a tutorial — six distinct refusals, each with its own message and its own field | `POST /api/student/booking` | learner | `slot_bookings` w, `tutorial_slots` r | **Yes** — the same page |
| Cancel a booking, with a reason (mandatory) | `DELETE /api/student/booking` | learner | `slot_bookings` w | **Yes** — the same page, refusing an empty reason on the page so the learner reads why it is required |
| Publish an hour — validated to an explicit offset, a real level, a module of that level, an https join URL, and no overlap with time already offered | `POST /api/staff/slots` | staff | `tutorial_slots` w, `live_sessions` r | **Yes** — `/staff-hours.html` |
| Withdraw an hour, releasing every learner in it with the tutor's reason on their record | `POST /api/staff/slots` (`withdraw`) | staff | `tutorial_slots` w, `slot_bookings` w | **Yes** — `/staff-hours.html` |
| A tutor's own published hours with who is booked into each | `GET /api/staff/slots` | staff (own) / admin (any) | same, r | **Yes** — `/staff-hours.html` |

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
| The same check for a registered institution, identified and rate-limited | `GET /api/institutional/verify` | key | same, and `verifying_institutions` r | **No interface, by design** — the caller is another institution's software, not a person. The College's side of it is on `/staff-administration.html`, where a key is issued and what has been queried is read |
| Register an institution / list them | `GET`,`POST /api/admin/institutions` | admin | `verifying_institutions` rw | **Yes** — `/staff-administration.html` |
| The QR image for a verification URL — looks nothing up, deliberately, so it cannot become an enumeration oracle | `GET /api/credentials/qr` | public | none | **Yes** — `/verify.html`, `/graduate.html` |
| The College's published signing keys | `GET /api/credentials/jwks` | public | `signing_keys` r (public halves only) | n/a — machine to machine |
| Rotate and inspect signing keys | `GET /api/admin/signing-keys` | admin | `signing_keys` r | **Yes** — `/staff-administration.html` |
| A published graduate profile | `GET /api/graduate/{handle}` | public | `graduate_profiles` r | **Yes** — `/graduate.html` |
| A shared record slice, opened by a token an employer holds | `GET /api/share/{token}` | public (token) | `profile_shares` r | **Yes** — `/graduate.html` |
| The Graduate Register | `GET /api/register` | public | `awards` r | **Yes** — `/register.html` |

---

## 9 · Administration

| Capability | Endpoint | Who | Reads / writes | Interface |
|---|---|---|---|---|
| Who am I, and what may I do | `GET /api/auth/me` | learner | `users` r | **Yes** — every portal page |
| Provision an account from the identity provider | `POST /api/auth/webhook-clerk` | signature | `users` w | n/a |
| List learners; open, amend or withdraw an enrolment | `GET /api/admin/learners`, `POST /api/admin/enrolment` | staff | `enrolments` rw, `enrolment_events` w | **Yes** — `/staff-enrolments.html` |
| Grant and remove a role, with the act recorded | `GET`,`POST /api/admin/role` | admin | `users` w, `role_events` w, `staff_appointments` r | **Yes** — `/staff-enrolments.html` |
| The Institutional Metric Register — every metric the Executive undertook to watch, declared whether or not it can be computed, with small cohorts suppressed rather than rounded | `GET /api/admin/institutional-metrics` | staff | many, r | **Yes** — `/staff-administration.html` |
| The quality-assurance evidence register | `GET /api/admin/evidence` | staff | `evidence_items`, `evidence_versions` r | **Yes** — `/staff-administration.html` |
| Competency coverage against the Academic Framework's own rule | `GET /api/admin/quality/competency-coverage` | staff | `assessment_competencies` r | **Yes** — `/staff-administration.html` |
| Purge a recording past its retention date | `POST /api/admin/recordings/purge` | admin | `learner_recordings` w, R2 | **Yes** — `/staff-administration.html` |

---

## 10 · What the platform cannot do, and what would close it

Every item here is a **schema or infrastructure** gap reported by the
engineer who hit it. None is a code defect, and none is worked around
silently — in each case the payload says what is missing.

| Gap | Consequence today | What closes it |
|---|---|---|
| ~~**Nothing in `functions/api/` called `conferAward()`**~~ **CLOSED 23 August 2026** | Was: the College could compute that a learner had met every published condition of an award, report that position to them, and had no way to confer it. `awardHistory()`, `revokeAward()` and `replaceAward()` were all reachable only from tests. Every certificate page would have been empty for every real learner for ever | `functions/_lib/registry/conferral.js` and `functions/api/admin/conferral.js`. Nothing about an award is typed: title, post-nominal and CEFR from `award_definitions`, credits and hours from the regulations, honour from the marks, holder name from the account. Conferral happens on `eligible` and nothing else, and there is deliberately no override |
| ~~**No table records a level examination**~~ **CLOSED 23 August 2026** | Was: `levelMark()` always `examination_not_recorded`; no honour, no GPA, graduation never past `conditional`. Now: migration 023 builds the paper, its rubric, the sitting, a mark per criterion per marker, the written reconciliation and the trail | Done. What replaced it: **no paper is published at any level yet**, which is an academic act rather than a software one. `publishedPaperFor()` returns null and every caller reports `no_published_paper` by name; `levelConditions()` files that as the COLLEGE's outstanding work, never the candidate's |
| **`assessment_skills` holds no approved rows** | Every level skill mark is null and `skill.null_blocks_conferral` refuses conferral for every learner | Academic mapping work, proposed and approved. Not a software task |
| ~~**Neither `quiz_attempts` nor `assignment_submissions` records an attempt ordinal**~~ **CLOSED** by `sql/migrations/021-attempt-ordinals.sql` | Both tables carry `attempt`, assigned once at submission and never recomputed, with a unique index over (learner, item, attempt) | Done |
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
4. ~~**Their engagement record.**~~ **CLOSED 21 August 2026** — `/my-engagement.html`, both editions. The required notice is rendered whole and first, with all five measures and all six denials; the grid runs a module per row and a window per cell so it survives a 390px screen; every corrected state shows the platform's own reading of the same window beside it, and the three published limitations sit under the measurement. `tests/browser/my-engagement.mjs` reads the COMPUTED chroma of an absent cell and fails if it is red, or merely if it is not the quietest ink of the four — the instrument says an empty window is never a penalty, and a stylesheet can contradict that while the markup obeys it.
5. ~~**Their achievements.**~~ **CLOSED 21 August 2026** — on the same page, with the evidence on what is held, the measured shortfall on what is not, and the reason on anything withdrawn.
6. ~~**What is next.**~~ **CLOSED 21 August 2026** — `/my-week.html`, both editions. Times are printed from the server's local string in the ACCOUNT's zone, never converted in the browser; `tests/browser/my-week.mjs` runs the browser in America/Los_Angeles against an Asia/Dubai account so a page doing its own conversion would fail visibly.
7. ~~**A tutorial to book, or a booking to cancel.**~~ **CLOSED 21 August 2026** — on the same page, with the GET that lists what there is to book added the same day.
8. ~~**Notices addressed to them, and the unread count.**~~ **CLOSED 21 August 2026** — `/my-desk.html`, both editions. The receipt is written on the act of opening a notice and never on load, the badge is the endpoint's own uncapped count re-read after every act, and the edition served is named where the reader's language is not one the notice was published in. `tests/browser/my-desk.mjs` seeds a notice addressed to a DIFFERENT learner and a draft, and fails if either sentence reaches the document at all.
9. ~~**A thread to their tutors or to the Registrar's desk, and the replies.**~~ **CLOSED 21 August 2026** — on the same page. The recipients offered are `canOpen` unmodified, the allowance is stated before it is met rather than discovered by hitting it, and a closed thread renders the College's own reason with no reply box instead of a box that fails on submission.
10. ~~**An appeal, complaint, withdrawal, deferral or transfer** — opening one, reading its stage and its clock, escalating it, withdrawing it.~~ **CLOSED 21 August 2026** — `/my-cases.html`, both editions. The published ladder is drawn BEFORE the form and is the endpoint's own words, `publishedProcedure()` having been lifted out of `caseView()` so a learner with no case open can still read what writing to the College sets in motion. The stage with no adopted interval says so and names the self-binding one instead of printing a number the Board has not adopted; the trail renders whole, naming the post that made each move and never an account id. `tests/browser/my-cases.mjs` drives escalation and withdrawal through the interface and requires the Arabic edition to publish the instrument in Arabic.
11. ~~**The state of their application**, before they are a learner at all.~~ **CLOSED 21 August 2026** — `/admissions/track/`, both editions, driven by `GET /api/admissions/track` and asserted end to end in a real browser by `tests/browser/admissions-track.mjs`.
12. ~~**An offer to accept or decline.**~~ **CLOSED 21 August 2026** — answered from the same page, by `POST /api/admissions/offer?action=` and the same reference.
13. ~~**A checkout, an instalment plan, and confirmation of payment.**~~ **CLOSED 21 August 2026** — on `/my-account.html`, where money already lives, and on `/student-portal/payment-complete/`, which did not exist: `create-checkout.js` has always handed every gateway a successUrl of that address, so every learner who paid was returned from their bank to a 404 and the enrolment that page triggers was never asked for. Three things had to be built under it. `GET /api/payments/options` answers what a level costs, what four instalments come to, and which gateways are configured WITHOUT inserting the payments row the create route inserts before it answers anything — and it reports `payment.configured` with no fallback in it, so where the College cannot take a card the page says so instead of drawing a button that answers 503, which is the state the platform is actually in today. The pricing, the discount and the pending row moved into `functions/_lib/payments/checkout.js` so the harness could run production's arithmetic rather than a second copy — it had already got that copy wrong, charging the published fee to a learner holding a scholarship while the card beside it quoted the discounted one. `tests/browser/payment-complete.mjs` drives the whole journey in a real browser: an offer chosen, a gateway, a return, an enrolment confirmed, and the level read back from the server.
14. ~~**An assignment to submit.**~~ **CLOSED 21 August 2026** — `/my-module.html`, both editions, which is also the study surface the platform did not have: `GET /api/lms/unit` had existed since the foundation pass with exactly one caller. The allowance rides above the paper rather than under the button, and where it is spent the page prints what the regulations do next instead of greying a control.
15. ~~**The live sessions of their level.**~~ **CLOSED 21 August 2026** — on the same page, beneath the module, saying plainly where none are scheduled that a live hour is an addition to the module and never a condition of it.

### A tutor cannot

16. ~~**Mark an assignment.**~~ **CLOSED 22 August 2026** — `/staff-marking.html`, both editions. `gradeAssignment()` took a `submissionId` and nothing anywhere produced one, so the queue had to be built first: `GET /api/lms/marking-queue`, oldest first, with the wait in days computed on the server, the rubric travelling in the task the learner was set, and the mark a resit is a resit of carried beside the new attempt. The queue is the College's rather than one tutor's and the payload says why — the teaching relation is composed from teaching acts, so bounding it that way would make every learner's FIRST submission invisible to everybody. The pass line on screen is `functions/_lib/academic/marks.js` and not a number typed into a page.
17. ~~**See their roster, or one learner's engagement record.**~~ **CLOSED 22 August 2026** — `/staff-learners.html`, both editions, with no search box, deliberately: a search over learners is exactly the surface the composed relation exists to prevent. `staffRoster()` was returning its own join, so a learner with five live enrolments was five people on the roster; corrected the day the first screen over it was rendered.
18. ~~**Take a register.**~~ **CLOSED 22 August 2026** — on the same page, refusing an unexplained mark before it is sent and printing the platform's own reading of the same window beside every correction.
19. ~~**Publish an hour, or withdraw one.**~~ **CLOSED 22 August 2026** — `/staff-hours.html`, both editions. A wall-clock reading is converted to an instant through the browser's own zone, and the field names the zone it used; withdrawal states how many learners will read the reason before it is written.
20. ~~**See who is booked into their hours.**~~ **CLOSED 22 August 2026** — the same page, and the next four hours on `/staff-desk.html`.
21. ~~**Write to a learner they teach, or answer one.**~~ **CLOSED 22 August 2026** — `/staff-notices.html`. A thread is fetched when it is opened and never on load, because reading one moves the watermark and a console left open on a screen would mark every conversation read.
22. ~~**Draft, publish, amend or withdraw a notice.**~~ **CLOSED 22 August 2026** — the same page, taking both editions on one form so writing the second is the ordinary act rather than the diligent one; a published notice's audience is not offered for amendment, because the endpoint refuses to re-scope one and a control that cannot succeed is a control that teaches distrust.
23. ~~**Answer a case they are not conflicted on.**~~ **CLOSED 22 August 2026** — `/staff-cases.html`, which reads its own account id first and offers no answer form at all where that account is on the case's conflict list. The vocabulary offered is the one that kind of case has: a deferral is granted or refused, never "upheld".
24. ~~**Mark a level complete.**~~ **CLOSED 22 August 2026** — on `/staff-learners.html`, with `levelGateReport()` read BEFORE the act so a condition arrives as a sentence rather than as a refusal.

### The Registrar and Admissions cannot

25. ~~**Work the admissions queue** — filter it, move an application, record the reason.~~ **CLOSED 22 August 2026** — `/staff-admissions.html`, both editions. Every control is built from the row's own `legalNext`, so the console holds no copy of the machine to drift from it; the stage tallies do not narrow when the list does; and the form says above the field that the reason is read by the applicant, because there is no internal-note column to write a private one into.
26. ~~**Issue an offer.**~~ **CLOSED 22 August 2026** — the same page. `offer_sent` is deliberately not a button: an application reaches it only by an offer being written, so the offer form stands where the refusal points.
27. ~~**Work the case queue** — ordered by when each answer falls due.~~ **CLOSED 22 August 2026** — `/staff-cases.html`, with the conflict list travelling beside every case so it reaches the right person the first time.
28. ~~**Route, park, resume, re-date or close a case.**~~ **CLOSED 22 August 2026** — the same page, offered only to an account holding the Registrar's authority and kept visibly apart from the answer, which is a different authority. Escalation and withdrawal are on neither, because they are the appellant's acts.

### An administrator cannot

29. ~~**Read the Institutional Metric Register** — the register an accreditation reviewer would be shown.~~ **CLOSED 22 August 2026** — `/staff-administration.html`, both editions, printing the register's own suppression caveat above it and marking a withheld figure as withheld rather than as missing.
30. ~~**Read the evidence register, or competency coverage.**~~ **CLOSED 22 August 2026** — the same page. The evidence register ships with twenty-three collections and no items, so the console names the collections holding nothing: an empty collection is a question the College has not answered yet, and a blank does not say that.
31. ~~**Register a verifying institution, or issue it a key.**~~ **CLOSED 22 August 2026** — the same page, with the key shown once and the sentence saying so beside it, and what each registered institution has queried listed underneath.
32. ~~**Inspect the signing keys.**~~ **CLOSED 22 August 2026** — the same page. **Rotation and revocation are deliberately NOT here and are not reachable over HTTP at all**: revoking a key invalidates every credential it ever signed. The page says that rather than offering a control that would 404.
33. ~~**Set or refresh an exchange rate.**~~ **CLOSED 22 August 2026** — the same page, keeping pricing a currency and opening it at checkout as two separate acts, and printing what a live feed did NOT cover rather than a fabricated rate.
34. ~~**Purge a recording past its retention date.**~~ **CLOSED 22 August 2026** — the same page, dry run first and always: the destroying button does not exist in the document until the dry run has been read.

### The level examination

35. ~~**The level examination**, on all three sides of it.~~
    **CLOSED 23 August 2026** — three surfaces, both editions.

    - **`/my-examination.html`** — the candidate's. The published
      procedure is RENDERED from the endpoint's own figures rather than
      linked, because the person reading it is having the worst day of
      their year and sending them off to find the instrument is
      answering the easy question. The three-hour clock counts down to
      `dueAt`, an instant the server wrote; it is never recomputed in
      the browser, so a device with a wrong clock cannot shorten
      somebody's examination. There is no "enter for the examination"
      button, because the instrument says entry has no form.
    - **`/staff-examinations.html`** — the marker's. The rubric IS the
      form: one number input per criterion with its published descriptor
      above it, and no overall field at all, because a marker who can
      type an overall can mark on impression and fit the criteria to it
      afterwards. The running overall is an `<output>`.
    - **`/staff-papers.html`** — the administrator's, behind
      `requireAdmin`, because setting a rubric and marking to one are
      different authorities. Authoring and publishing are two acts so
      that `rubric_published_on` cannot be back-written.

    Driven end to end in a real browser by
    `tests/browser/examination.mjs` — 45 checks. The one that matters
    most is not an assertion about a payload: it opens the script AS
    THE SECOND MARKER, reads the whole document, and fails if the first
    marker's numbers appear anywhere in it. The endpoint's withholding
    is only worth anything if the screen over it does not undo it, and
    a browser is the only place that can be shown.

    Three faults the screens caught that the endpoints could not:

    - `trouble()` in `js/staff-kit.js` fell back to `r.statusText`, so
      every one of the twelve staff consoles rendered the bare words
      **"Not Found"** as its state line whenever an endpoint 404ed. A
      member of staff reading that has been told nothing they can act
      on, in the register of a browser error page. Fixed in the kit, so
      all twelve are corrected.
    - `/staff-papers.html` hid its whole body until the papers loaded,
      so a page that could not reach the platform rendered a masthead,
      one sentence and five hundred pixels of nothing. The standing
      rules are true whether or not the platform answered; they are out
      of the form now and always visible.
    - Recording a reading destroyed its own confirmation. The act
      re-renders the script — the marker's numbers are now on the
      record and belong on screen — and the re-render took the "your
      reading is on the record" message with it. Writing it to the
      page's state line instead did not work either: `load()` owns that
      line and clears it when the queue returns. The note travels into
      the re-render now. A marker who presses a button and sees nothing
      change is a marker who presses it twice, and on this screen
      pressing it twice is refused with `already_marked`, which reads
      as the platform having lost the first press.

### The twenty-four learner surfaces, and where each one is

Audited 23 August 2026, against the built routes rather than against
this document. Two were genuinely missing and are now built; the rest
were already answered, and several are answered by a page whose name
does not match the word in this list — which is why the audit was worth
doing rather than assuming.

| # | The capability | Where it is |
|---:|---|---|
| 1 | Dashboard | `/my-programme.html` — "where you are, and the next thing to open" |
| 2 | Resume learning | the same page. The single largest control on it opens the next thing, and it is the first element in the source for that reason |
| 3 | Grades | `/my-standing.html` — module marks with every attempt, the counting mark, and which one a resit capped |
| 4 | GPA | the same page. Null rather than 0.00 where nothing is conferred, with the sentence saying why |
| 5 | Attendance | `/my-engagement.html` — week by week, per module, with the evidence each state was read from |
| 6 | Analytics | THREE surfaces, deliberately not a fourth. Listening progress and the pronunciation profile are on `/listening-lab.html`, where the recordings are; engagement over time is on `/my-engagement.html`; marks and standing are on `/my-standing.html`. A separate analytics page would duplicate all three and, with the College's present cohort, would chart two points |
| 7 | Transcript | `/my-record.html` — issued, signed, verifiable, reissued free |
| 8 | Certificates | **`/my-award.html`** — built 23 August 2026. Was the largest gap of the twenty-four: itemised at 5 per cent of every level fee and unreachable by the person who paid for it |
| 9 | Achievements | `/my-standing.html` — the milestone register, with the measured shortfall on what is not held |
| 10 | Tuition balance | `/my-account.html` |
| 11 | Payments | the same page |
| 12 | Invoices | the same page, opened in place |
| 13 | Receipts | the same page. A receipt number where one was issued and nothing where none was — the two are one ledger read twice, never two ledgers |
| 14 | Tutor messaging | `/my-desk.html` |
| 15 | Announcements | the same page, with the receipt written on the act of opening |
| 16 | Live classes | `/my-module.html` for the level's hours, `/my-week.html` for what is next |
| 17 | Calendar | `/my-week.html`, in the account's own zone |
| 18 | Tutorial booking | the same page |
| 19 | Assignment submission | `/my-module.html` |
| 20 | Competency progress | `/my-record.html` — attainment against the six competencies |
| 21 | Study planner | `/my-programme.html`, driven by `GET /api/student/study-plan` |
| 22 | Download centre | **`/my-downloads.html`** — built 23 August 2026 |
| 23 | Digital ID | the identity card at the head of the same page. Not a licence and says so; what stands behind it is the signed verification statement, which `issued_documents` has always been able to issue |
| 24 | Graduation tracker | `/my-standing.html` — every condition of the award, in two groups by whose work it is |

Every one of them is in the learner navigation on all thirteen portal
pages, in both editions. `scripts/link-census.mjs` reports zero orphans,
which is the check that this table is not describing pages nobody can
reach.

### And two the register had not listed

Both were orphan routes — built, served, and reachable only by typing
the address — which is a third state between "has an interface" and
"has none" that this document had no column for.

- **Enrolment administration and the access register.** Absorbed into
  `/staff-enrolments.html`, both editions, which carries everything the
  orphan did: all six levels listed enrolled or not, the refusal to
  appoint yourself, and the appointment trail kept apart from the
  enrolment history — they are different registers about different
  things and merging them makes "who appointed this person"
  unreadable.
- **The finance reports.** Absorbed into `/staff-finance.html`, both
  editions. Each reconciliation finding is rendered as itself; there is
  no health score, because a number that averages a discrepancy away is
  a number that hides it.

### Every edition, everywhere

35. **A level named in Arabic on every surface that names one.** `programme_levels` holds ONE name and it is English, so an Arabic learner reading their own page was told, mid-sentence, that they had paid for the "English Mastery Programme". `functions/_lib/academic/level-names.js` now holds the six published Arabic names — the same six `scripts/lib/arabic-kit.js` generates the level pages from, held to them by `tests/level-names.test.mjs` — and the payment surfaces and the statement of account carry `nameAr` beside `name`. **Every other endpoint that answers with a level name should do the same**: `/api/student/study-plan`, `/api/student/standing`, `/api/lms/units`, `/api/lms/unit`, `/api/student/timetable`, `/api/student/achievements` and the admin reports. That is deliberate work on each payload, not a sweep, and it is recorded here rather than left to be discovered by rendering an Arabic page.

36. **A page whose SCRIPT speaks the edition it is served in.** Found on
    22 August 2026 by rendering `/ar/graduate.html` — the public
    credential an Arabic graduate hands to an employer. The page's
    markup was Arabic and every line the script wrote beneath it was
    English: *Loading this record…*, *Withdrawn*, *Not yet assessed*,
    *Listening*, *Reading*, *Scan to verify*. The masthead was in one
    language and the record in another, on the one page a stranger opens
    to decide whether to believe a graduate.

    **Closed for the graduate record.** `js/graduate.js` now holds both
    languages, on the pattern `js/my-standing.js` and `js/staff-kit.js`
    already used, and the platform hands both namings back rather than
    letting the page translate a published fact:
    `honourLabelAr` on every award (`HONOUR_LABEL_AR`, held to the five
    headings on `/ar/students/awards/` by
    `tests/honour-labels.test.mjs`), `levelNameAr` and `ordinalAr` on
    every transcript entry, `labelAr` on every kind of distinction,
    `noteAr` beside every composed note, and `name_ar` /
    `description_ar` on `language_skills`, `competencies` and
    `skill_descriptors` — adopted from the Arabic pages that already
    publish them, and held to those pages by
    `tests/framework-arabic.test.mjs` (migration 022). The QR is
    announced in the reader's language while pointing at one canonical
    address, because a printed certificate carries one code for life.
    Bidirectional isolation went in at the same time: every fact on an
    award line is a `<bdi>`, and anything the graduate wrote takes
    `dir="auto"`, so an English sentence in an Arabic card no longer
    lands its full stop at the wrong end.
    `tests/browser/graduate.mjs` now opens BOTH editions and fails on any
    English word the page itself is responsible for.

    **Also closed, the same day: the other two public credential
    surfaces.**

    - **`/ar/verify.html`.** The page an Arabic employer reaches from a
      QR code on a printed certificate. It answered in English down to
      the standing band and seven paragraphs about hash chains.
      `functions/_lib/registry/institutional-verification.js` now
      composes every check in both languages — `labelAr`,
      `statementAr`, `detailAr` — and the summary carries `headlineAr`
      and `statementAr`. It also carries a new `verdict` field, because
      the page used to colour itself by comparing the headline against
      the literal string `"Verified"`: translating that sentence would
      have painted every passing Arabic verification as a warning.
      The award's own DEFINITION stays English on both editions, on
      purpose — it is transcribed verbatim from
      `docs/iefc-award-architecture.md` and held there by
      `tests/award-definitions.test.mjs`, so a translation would be a
      second authoritative text no document governs. This is the same
      reasoning `/ar/study/level-3/` already publishes about the award
      TITLE. The Arabic edition marks that panel `lang="en"`, says in
      Arabic why it is in English, and links to the Arabic account of
      the level, which the College does publish.
    - **`/ar/register.html`.** The roll listed Arabic names against
      English programmes. `js/register.js` speaks both languages and the
      listing endpoint hands back `levelNameAr`, `ordinalAr` and
      `honourLabelAr` beside their English counterparts.

    Both suites now open both editions —
    `tests/browser/verify.mjs` (72) and `tests/browser/register.mjs`
    (40) — and each fails on any English word the page itself is
    responsible for.

    **Also, on the way past: four stylesheets used physical margins
    where they meant logical ones**, so on the Arabic editions a
    post-nominal sat flush against a graduate's name, a cue's indent
    fell on the wrong side and the sidebar's hover indent pushed the
    wrong way. `css/register.css`, `css/verify.css`, `css/graduate.css`,
    `css/listening-lab.css`, `css/dashboard.css`, `css/my-record.css`
    and `css/my-programme.css` now use `margin-inline-*`,
    `padding-inline-*` and `inset-inline-*`. Everything else in the
    stylesheets that is physical is deliberately so and already carries
    a `[dir="rtl"]` companion.

    **Every scripted surface is now closed.** In order of how a person
    reaches them:

    | Surface | What it used to say in Arabic | Closed by |
    |---|---|---|
    | `/ar/graduate.html` | nothing — every line was English | `js/graduate.js`, migration 022, `HONOUR_LABEL_AR`, `KIND_LABEL_AR` |
    | `/ar/verify.html` | the standing band and the three layers | `js/verify.js`, `institutional-verification.js` in both languages |
    | `/ar/register.html` | Arabic names against English programmes | `js/register.js`, `levelNameAr` on the roll |
    | `/ar/my-record.html` | the record, the privacy switches, the share links | `js/my-record.js` |
    | `/ar/my-programme.html` | the study plan and the pace sentence | `js/my-programme.js`, `study-plan.js` |
    | `/ar/admissions/apply/` | eleven error sentences, and a raw status enum on BOTH editions | `js/admissions-wizard.js` |
    | `/ar/admissions/track/` | the five stages, what is outstanding, what happens next | `lifecycle.js` in both languages, `js/admissions-track.js` picks |
    | `/ar/listening-lab.html` | forty sentences of controls and states | `js/listening-lab.js` |
    | `/ar/student-portal/` | already correct — it holds no English of its own, and every string comes from the page's dataset. Its two doors pointed at the English editions and said so in the button text; both now point at `/ar/`. |  |

    **The Arabic header pointed five links at the English verification
    page, on all ninety-three Arabic routes.** `partials/header.ar.html`
    — the Verify menu in the utility rail. Every other red-flag check
    reads `pages/*.html`, which cannot see a partial; found by grepping
    every Arabic route for a link that leaves the edition.

    **What is deliberately still English on both editions**, each with a
    published reason:

    - **An award's official title and post-nominal.** Ruled on by the
      College on every Arabic level page: *"ترجمة العنوان تُنشئ شهادةً
      ثانية لم يعرّفها أحد ولا يستطيع أحد منحها."*
    - **An award's definition** — `award_definitions`, transcribed
      verbatim from `docs/iefc-award-architecture.md` and held there by
      `tests/award-definitions.test.mjs`. `/ar/verify.html` marks it
      `lang="en"`, says why, and links to the Arabic account of the
      level.
    - **The curriculum itself** — module titles, transcripts,
      pronunciation targets, comprehension questions. It is an English
      course; the material being learned is the material. Every one of
      them now carries `dir="auto"` so an Arabic page lays it out as
      English rather than reversing its punctuation.

37. **A validation message in the reader's own language.** The one piece
    of this that is NOT closed, and it is a platform contract rather
    than a page. `ValidationError` carries `message` and
    `fields: {name: message}`, both English, and every page prints
    them — so an Arabic applicant who mistypes an email address is told
    *"Enter a valid email address."* in the middle of an Arabic form.
    Roughly fifteen sentences across
    `functions/_lib/admissions/fields.js` and
    `functions/api/admissions/apply.js`, and the same shape on every
    other endpoint that throws one.

    The design is the one the rest of this sweep uses: both languages
    travel, the page selects. `ValidationError(message, fields,
    fieldsAr)` and `errorResponse` emitting `messageAr`/`fieldsAr`,
    additively, so no existing reader breaks. It is recorded here rather
    than half-done: converting two validators and leaving forty
    endpoints English would leave the site inconsistent in a way that is
    harder to reason about than the present state.


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
