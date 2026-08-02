# WEC-LC — Learning Management System Architecture

*Companion to `technical-architecture.md` and `payments-architecture.md`.
Authoritative record of Executive Decision #4: WEC-LC develops and
owns its proprietary LMS as a long-term strategic institutional asset,
rather than integrating a third-party product. This document
supersedes `docs/master-roadmap.md`'s original Phase 9 buy-don't-build
recommendation — that entry is kept in the roadmap as a record of the
reasoning that was weighed and deliberately overridden, not as current
guidance.*

---

## What "proprietary" means here, concretely

Not a rebuilt Canvas/Moodle. The scope is exactly what WEC-LC's own
six-level, sequential CEFR programme needs: ordered content within a
level, quizzes and assignments that produce real completion data,
scheduled live classes, and a progression mechanism that ties
completion to Executive Decision #1's progressive full-programme
unlock. Where an external building block does the job better than a
from-scratch one would (video hosting, live-class join links), the LMS
uses it — see § Deliberate MVP scope below — but the platform WEC-LC
students and staff actually interact with, and the data model behind
it, is fully owned.

---

## Entity model

```
programme_levels (existing)
      │ 1:1 (Milestone 1)
      ▼
   courses
      │ 1:N
      ▼
    units  ──────────────┐
      │ 1:N               │ 1:N (per user)
      ▼                    ▼
learning_items      unit_progress
   │  │  │
   │  │  └── kind='live_session' → live_sessions (level- or unit-scoped)
   │  └───── kind='quiz'         → quiz_questions → quiz_attempts (per user, append-only)
   └──────── kind='assignment'   → assignment_submissions (per user, gradable)
```

**Why `Course → Unit → LearningItem` rather than a flatter model:** a
level's content needs three levels of grouping in practice — the
level itself (already modeled by `programme_levels`), a sequence of
units within it, and a mix of content types within each unit (a
reading, a quiz, a live class link). Collapsing units and items into
one table would mean every row carries fields that only apply to some
kinds — the polymorphic-but-typed `learning_items.kind` + `body`
shape avoids that without a full class-per-kind schema, which would be
over-engineering for six levels' worth of content.

**Why `courses` exists at all, given it's 1:1 with `programme_levels`
today:** keeps the LMS's own content hierarchy self-contained and not
directly foreign-keyed to a payments/admissions-domain table
(`programme_levels`) from three joins deep (`learning_items` →
`units` → `courses` → `level_id`). If a level ever needs more than one
course (e.g. a supplementary elective alongside the core level
curriculum), that's a new `courses` row, not a schema change.

**Why `unit_progress` is materialized rather than computed on read:**
the Student Portal (and, eventually, a Faculty gradebook view) needs
"is this unit done" cheaply and often — computing it live would mean
joining across `quiz_attempts` and `assignment_submissions` and
re-deriving pass/fail on every dashboard load. One row per
`(user_id, unit_id)`, written by the same code path that records a
passing quiz attempt or a passing grade, is the standard LMS pattern
for this and avoids that cost. It's written by
`functions/_lib/lms/content.js`'s `upsertUnitProgress()`, which never
downgrades a unit already marked `completed` — a later failing retake
or a re-submission doesn't erase a prior pass. That's a deliberate
answer to a known LMS technical-debt trap: naive retake handling that
lets a bad second attempt undo a real, already-earned completion.

**Why `quiz_attempts` is append-only** (every attempt is its own row,
never updated in place): preserves a real attempt history — useful for
both the student ("I got 60% the first time, 90% the second") and,
later, for any academic-integrity or analytics need — rather than only
ever knowing the latest state.

---

## Access control

A student can read or submit against a unit only if they hold an
`active` or `completed` `enrolments` row for that unit's level —
`functions/_lib/lms/content.js`'s `assertLevelAccess()`, checked on
every read and write path. This is the same enrolment table Payments
already writes to (`functions/api/enrolment/confirm.js`,
`functions/_lib/student/progression.js`), so a student's LMS access
is a direct, real consequence of what they've actually paid for and
completed — never a second, separately-maintained access list that
could drift out of sync with billing.

Staff bypass this for grading (`gradeAssignment()`), the same
`requireStaff()` boundary used throughout the platform
(`functions/_lib/auth/session.js`) — role lives on WEC-LC's own
`users` row, not anything the auth provider asserts.

---

## Milestone 1 — built

**Schema** (`sql/schema.sql`): `courses`, `units`, `learning_items`,
`quiz_questions`, `quiz_attempts`, `assignment_submissions`,
`unit_progress`, `live_sessions`. Seeded here: one `courses` row per
programme level (structural, titled with that level's real published
name). `schema.sql` itself stays content-free — real curriculum
content lives in its own seed file(s), applied separately (see
Milestone 2 below, which is where the first real content landed).

**Logic** (`functions/_lib/lms/content.js`, `functions/_lib/student/
progression.js`): list units + a student's own progress; full unit
detail (ordered items; quiz items carry questions with choices but
never the correct answer — scoring is server-side only); submit a
quiz attempt (scored immediately, append-only, unit marked completed
at `platform_config.lms_pass_threshold`, default 0.7 — a mechanism
default, not a published academic standard, see the schema's own
comment); submit an assignment (marks the unit `in_progress`); grade
an assignment (staff-only, marks the unit `completed` once the grade
clears the same threshold); list a level's scheduled live sessions;
progressive full-programme unlock (`completeLevel()`, Executive
Decision #1).

**Endpoints** (`functions/api/lms/`): `GET units`, `GET unit`,
`POST quiz-attempt`, `POST assignment-submission`,
`POST grade-assignment` (staff), `GET live-sessions`,
`POST complete-level` (staff).

**Tested**: 25 fixture-based assertions
(`tests/lms-content.test.mjs`) against a real SQLite engine — access
control (enrolled vs. not), quiz scoring and its pass threshold,
retake history without regression, assignment submission → grading →
completion, and the live-session listing. Test fixture content
("Unit 1", "2 + 2 = ?") is placeholder mechanism-testing data, not
real WEC-LC curriculum, and lives only in the test file — nothing
resembling it is seeded into the shipped schema.

**Not yet built in Milestone 1, deliberately deferred:**

- **Content-authoring tooling.** There's no endpoint yet for staff to
  create/edit units, learning items, or quiz questions — today that's
  a direct SQL insert against the schema above (see Milestone 2's
  seed-file approach below, used as an interim path while real
  authoring tooling doesn't exist yet). A real authoring UI (or even a
  staff-facing CRUD API) is Milestone 2+ work, sequenced after Faculty
  Portal per Executive Decision #8's launch order.
- **Student Portal frontend wiring.** `js/portal-auth.js` doesn't yet
  call any `/api/lms/*` endpoint — the Student Portal's "classes,
  assignments, digital library, attendance, units-completed" sections
  remain the existing illustrative preview data (see
  `docs/auth-architecture.md`) until this wiring lands. The backend is
  ready for it, and now has real content to display — this is purely a
  frontend task.

---

## Milestone 2 (in progress) — Curriculum First

Per your Executive Directive re-prioritising curriculum ahead of
further LMS feature work: `docs/curriculum-framework.md` is the
complete six-level curriculum architecture (learning objectives, CEFR
alignment, thematic modules, grammar/vocabulary progression, skills
foci, assessment strategy — every level of the already-published IEFC
programme), built against the confirmed six-level structure (Executive
Decision: no separate Pre-Intermediate level — see that document).

**Level I ("Foundation Programme," A1) is now complete** — all 10
modules built to full publication-quality, lesson-by-lesson depth:
`docs/curriculum-level-1-foundation.md` (Module 1, the original worked
example) plus `docs/curriculum/level-1/module-{02..10}-*.md`. Every
module carries two full lesson plans (Module 10: a structured revision
lesson plus a comprehensive mock exam), a real answer-keyed quiz (92
questions across the level, including a 20-question cumulative
end-of-level exam), and a real staff-gradable assignment.

That exact content — not a summary or a mock-up of it — is seeded into
the live schema via `sql/seed-curriculum-level-1.sql` (deliberately a
separate file from `schema.sql`, since curriculum content will keep
growing across many future authoring passes and doesn't belong baked
into DDL) and verified to actually work through the Milestone 1
platform: `tests/curriculum-level-1.test.mjs` does a deep,
independently hand-verified check of Module 1; `tests/curriculum-
level-1-complete.test.mjs` (76 assertions) sweeps all 10 modules —
every module loads, every quiz's own seeded correct answers score
100% when submitted (and a weak attempt correctly fails), no quiz ever
leaks its answer key to the client, and every assignment can be
submitted and staff-graded — proving the curriculum functions on the
platform across the whole level, not just that it reads well as prose.

**Level II ("Elementary Programme," A2) is now also complete** — all
10 modules built to the same publication-quality standard, plus a
deliberately elevated depth: grammar contrast structures taught
against each other in the same lesson rather than in isolation, an
explicit BrE/AmE note in every module documenting genuine British/
American English differences, an embedded critical-thinking/discussion
prompt in most lessons, and a "communicative quality" rubric criterion
alongside grammatical accuracy on every assignment. See
`docs/curriculum-level-2-elementary.md` (module map and index) and
`docs/curriculum/level-2/module-{02..10}-*.md` for the full lesson-by-
lesson content. Seeded via `sql/seed-curriculum-level-2.sql` (110
questions across the level, including a 20-question cumulative
end-of-level exam) and verified the same way: `tests/curriculum-
level-2.test.mjs` (84 assertions) sweeps all 10 modules with the
identical rigor as Level I's sweep — real seeded answer keys fetched
from the DB and submitted, no answer-key leakage, staff grading
verified, and a weak attempt correctly fails.

**Level III ("Intermediate Programme," B1) is now also complete** —
all 10 modules built to a further-elevated standard per your Level III
Executive Directive: extended reading with explicit inference
questions, discourse markers taught as named functional sets (emphasis,
paraphrase, cause/effect, contrast, attribution, certainty,
illustration, sequencing, closing), phrasal verbs/collocations flagged
per module, note-taking/summarising/paraphrasing formally introduced
and reused, a genuine presentation task in most modules (a business
pitch, a case-study report-out, a healthcare interview, a capstone
thesis-plus-two-points talk), fluency-focused pronunciation work, and
intercultural communication as a running thread rather than confined
to one module. See `docs/curriculum-level-3-intermediate.md` (module
map, § What's different from Level II, and the Executive Directive
note in `docs/curriculum-framework.md`'s Level III section) and
`docs/curriculum/level-3/module-{02..10}-*.md` for the full
lesson-by-lesson content. Seeded via `sql/seed-curriculum-level-3.sql`
(110 questions across the level, including a 20-question cumulative
end-of-level exam) and verified the same way: `tests/curriculum-
level-3.test.mjs` (84 assertions) sweeps all 10 modules with the
identical rigor as Levels I-II's sweeps — real seeded answer keys
fetched from the DB and submitted, no answer-key leakage, staff
grading verified, and a weak attempt correctly fails. No new LMS
schema or endpoint was required — every Level III assessment type
(pitches, interviews, case-study reports, structured essays) fits the
existing polymorphic `reading/quiz/assignment` model, consistent with
the "curriculum drives platform" principle below.

**Level IV ("Upper Intermediate Programme," B2) is now also
complete** — all 10 modules built per your Level IV Executive Academic
Objective: the transition from independent communication to confident
academic and professional English. Analytical reading (author's
purpose, bias, tone, rhetorical technique — not just inference);
eight distinct academic/professional writing genres deliberately
distributed across the level rather than one essay format repeated
(reflective writing, the argumentative essay, formal correspondence/a
workplace proposal, compare-and-contrast writing, an analytical
report/proposal, a summary-and-critique, meeting minutes/a follow-up
email, and a capstone research-based essay synthesising two supplied
sources with basic citation mechanics); a varied speaking programme (a
job interview, a full formal debate, a panel discussion, the flagship
4-5 minute presentation with described visual aids and unscripted
Q&A, and a negotiation roleplay); and critical thinking built into
every module's core task rather than appended as a discussion
question. See `docs/curriculum-level-4-upper-intermediate.md` (module
map, § What's different from Level III, and the Executive Academic
Objective note in `docs/curriculum-framework.md`'s Level IV section)
and `docs/curriculum/level-4/module-{02..10}-*.md` for the full
lesson-by-lesson content. Seeded via `sql/seed-curriculum-level-4.sql`
(110 questions across the level, including a 20-question cumulative
end-of-level exam) and verified the same way: `tests/curriculum-
level-4.test.mjs` (84 assertions) sweeps all 10 modules with the
identical rigor as Levels I-III's sweeps — real seeded answer keys
fetched from the DB and submitted, no answer-key leakage, staff
grading verified, and a weak attempt correctly fails. No new LMS
schema or endpoint was required — every Level IV assessment type
(debates, panels, negotiations, presentations, multi-genre writing)
fits the existing polymorphic `reading/quiz/assignment` model,
consistent with the "curriculum drives platform" principle below.

**Level V ("Advanced Programme," C1) is now also complete** — all 10
modules built per your Level V Executive Academic Objective:
establishing WEC-LC as a premium international English institution,
moving learners beyond language competence into intellectual
communication. Critical evaluation of methodology, argument quality,
assumptions, evidence, credibility, and rhetorical strategy (a further
step beyond Level IV's purpose/bias/tone analysis); ten distinct
advanced writing genres deliberately distributed across the level's
nine content modules (professional documentation, a literature
review, a position paper, a policy brief, an analytical paper, a
persuasive article, a conference abstract, a research essay, a
strategic proposal, and a capstone executive report); a genuinely
executive/professional speaking programme (a leadership speech,
advanced negotiation, a stakeholder meeting, intercultural
negotiation, a media interview, the flagship 6-8 minute research-
informed presentation with active Q&A facilitation, a crisis-
communication simulation, a panel discussion under genuine challenge,
and an executive briefing under time pressure); and a distinctive,
WEC-LC-authored module sequence (precision of language → persuasion →
cross-cultural/media context → scrutiny → voice) rather than an
imitation of any single existing programme. See
`docs/curriculum-level-5-advanced.md` (module map, § What's different
from Level IV, and the Executive Academic Objective note in
`docs/curriculum-framework.md`'s Level V section) and
`docs/curriculum/level-5/module-{02..10}-*.md` for the full lesson-by-
lesson content. Seeded via `sql/seed-curriculum-level-5.sql` (110
questions across the level, including a 20-question cumulative
end-of-level exam) and verified the same way: `tests/curriculum-
level-5.test.mjs` (84 assertions) sweeps all 10 modules with the
identical rigor as Levels I-IV's sweeps — real seeded answer keys
fetched from the DB and submitted, no answer-key leakage, staff
grading verified, and a weak attempt correctly fails. No new LMS
schema or endpoint was required — every Level V assessment type
(leadership speeches, stakeholder meetings, intercultural negotiation,
media interviews, research presentations, crisis communication, panel
challenge, executive briefings, and ten writing genres) fits the
existing polymorphic `reading/quiz/assignment` model, consistent with
the "curriculum drives platform" principle below.

**Level VI ("English Mastery Programme," C2) is now also complete, and
with it the entire six-level curriculum** — all 10 modules built per
your Level VI directive, which asked for the capstone of the WEC-LC
academic journey rather than simply another language level. The level
is organised by **professional domain** rather than by communication
mode — a recorded revision to this document's original Level VI draft,
reasoned in `docs/curriculum-framework.md`'s Level VI section — because
at mastery level the domain *is* the difficulty and register is only
demonstrable inside a real field: executive leadership, diplomacy and
international relations, global business strategy, public policy, law
and justice, innovation and emerging technologies, media and public
communication, research and scholarship, ethics and responsible
leadership, and a capstone on global challenges and sustainable
development. Ten writing genres (reflective leadership essay, strategic
recommendations, executive report, policy analysis, scholarly critique,
grant proposal, opinion editorial, research paper, conference paper,
professional portfolio) and nine speaking formats (executive briefing,
diplomatic negotiation, boardroom presentation, policy panel, oral
defence, keynote address, media interview with crisis statement,
conference presentation, chaired ethical deliberation) are distributed
one per module, culminating in a capstone presentation with oral
defence. Assignment rubrics add **independent judgement** — the
criterion that distinguishes C2 from C1 in WEC-LC's assessment model —
to the five inherited from Levels II-V. See
`docs/curriculum-level-6-mastery.md` (module map, § What's different
from Level V, the graduate-attribute mapping, and Module 1's full
build) and `docs/curriculum/level-6/module-{02..10}-*.md` for the full
lesson-by-lesson content. Seeded via `sql/seed-curriculum-level-6.sql`
(110 questions across the level, including the 20-question Mastery
Examination) and verified the same way: `tests/curriculum-level-6.
test.mjs` (84 assertions) sweeps all 10 modules with the identical
rigor as Levels I-V's sweeps. **No new LMS schema or endpoint was
required for any of the six levels** — every assessment type in the
programme, up to and including the capstone portfolio and oral
defence, fits the existing polymorphic `reading/quiz/assignment`
model. That is the strongest available evidence for the
"curriculum drives platform" principle below: six levels of
genuinely escalating academic demand were delivered without a
speculative feature being built.

A programme-wide academic review of the completed curriculum —
sequencing, repetition, gaps, assessment, and the improvements it
recommends — is in `docs/curriculum-programme-review.md`.

**What Milestone 2 has NOT yet done, stated plainly:** content-
authoring tooling (a staff UI/API to create content — today's seed-
file approach is a stopgap, not the long-term authoring workflow, and
now that all six levels exist it is the clearest next platform
investment); and the broader LMS feature backlog your
original Milestone 2 message named
(course authoring studio, structured curriculum/lesson builders,
multimedia lesson management, exam authoring, question banks and
randomisation, rubric-based assessment beyond the manual rubrics
above, instructor feedback tools, discussion forums, announcements,
learning analytics, attendance/engagement tracking, academic calendar,
certificates/transcripts, competency/CEFR outcome dashboards,
instructor workload management, moderation/QA workflows, reusable
content templates, and deeper accessibility/multilingual tooling). All
of that remains explicitly deferred per your own "curriculum first"
sequencing — not forgotten, and not started ahead of that instruction.

---

## Deliberate MVP scope — what's bought vs. built, and why

Per the executive directive's own instruction ("study industry best
practices... implementation, architecture, user experience, and
product vision should be our own"), a few specific pieces are
deliberately *not* custom infrastructure, because building them
wouldn't produce better outcomes for WEC-LC students and would be a
multi-month distraction from the parts that are actually the
institution's differentiated IP:

- **Live classes are scheduled external join-links** (`live_sessions.
  join_url`, Zoom/Meet/Teams), not a custom WebRTC video stack. A
  bespoke video-conferencing system is a different, extremely deep
  engineering problem than an LMS; virtually every serious LMS —
  proprietary or otherwise — makes this same choice.
- **Video hosting**, once video content exists (Milestone 3+), should
  use Cloudflare Stream rather than a custom transcoding/adaptive-
  bitrate pipeline — it's the natural fit given the platform's
  existing Cloudflare Pages/D1 infrastructure (Executive Decision #7),
  and re-implementing adaptive video streaming would be pure
  reinvention with no institutional-IP benefit.
- **What genuinely is WEC-LC's own IP, and is built accordingly:** the
  CEFR-aligned progression model tying completion to unlocking
  (Executive Decision #1), the assessment data model, and — as it's
  built out — the competency-tracking/analytics layer specific to the
  six-level programme structure. This is exactly the "custom build is
  justified" carve-out the original (now-superseded) Phase 9 roadmap
  entry identified — it turns out to be most of what a proprietary LMS
  actually needs to differentiate on, which is part of why "build" was
  the right call once weighed against a from-scratch video/live-class
  stack that isn't.

---

## Roadmap beyond Milestone 1

Ordered by dependency, not by date — each is its own milestone with
its own executive report on completion, per the standing "Continuous
Executive Reporting" instruction:

- **M2 — Content authoring & real curriculum. In progress** — see
  § Milestone 2 above for what's actually landed (the six-level
  framework, Level I / Module 1 built and seeded to full depth,
  verified end-to-end). Remaining: staff-facing create/edit endpoints
  for units/learning items/quiz questions (a real authoring UI/API —
  today's real content was seeded via a one-off SQL file, an interim
  path, not the long-term workflow); the remaining nine modules of
  Level I; all of Levels II-VI.
- **M3 — Student Portal integration.** Wire `js/portal-auth.js` (or a
  new `js/lms-portal.js` following the same shared-shell pattern as
  `docs/auth-architecture.md` describes) to the Milestone-1 endpoints,
  replacing the portal's illustrative classes/assignments/attendance
  sections with real data.
- **M4 — Live-class depth & video.** Recurring session scheduling,
  attendance tracking against `live_sessions`, Cloudflare Stream
  wiring once recorded/on-demand video content exists.
- **M5 — Gradebook & Faculty Portal surface.** A staff-facing view of
  all students' progress/submissions per unit — today's
  `grade-assignment` endpoint has no UI; this is where one gets built,
  sequenced with Executive Decision #8's Faculty Portal phase.
- **M6 — Analytics & competency tracking.** The CEFR-specific progress
  analytics layer called out above, once enough real completion data
  exists to analyze.

Mobile-first is treated as an API-design property from Milestone 1
onward (small, cacheable JSON payloads; no server-rendered HTML in any
LMS response), not deferred to a later "mobile app" milestone — so
Executive Decision #8's eventual Mobile Applications phase has a real,
lightweight API to build against rather than needing its own backend
rework.

Arabic localisation of LMS content/UI follows Executive Decision #6's
sequencing: after the Student Portal (English) reaches production
quality, not before.
