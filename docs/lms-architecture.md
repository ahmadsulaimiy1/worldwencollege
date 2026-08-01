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
`unit_progress`, `live_sessions`. Seeded: one `courses` row per
programme level (structural, titled with that level's real published
name) — **deliberately no seeded `units`/`learning_items`/
`quiz_questions` content.** Inventing lesson or quiz content would
violate this project's standing rule against fabricating institutional
facts; real units are authored by WEC-LC academic staff once a
content-authoring workflow exists (Milestone 2+ — see below).

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
  a direct SQL insert against the schema above. A real authoring UI
  (or even a staff-facing CRUD API) is Milestone 2+ work, sequenced
  after Faculty Portal per Executive Decision #8's launch order.
- **Student Portal frontend wiring.** `js/portal-auth.js` doesn't yet
  call any `/api/lms/*` endpoint — the Student Portal's "classes,
  assignments, digital library, attendance, units-completed" sections
  remain the existing illustrative preview data (see
  `docs/auth-architecture.md`) until this wiring lands. The backend is
  ready for it; this is a frontend task, not a schema or logic gap.
  Recommended as the next LMS-adjacent milestone once M2's content
  actually exists to display.
- **Real curriculum content.** No units/lessons/quizzes for any of the
  six levels exist anywhere in this system yet — that's genuinely
  WEC-LC academic staff's work, not something to simulate.

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

## Roadmap beyond Milestone 1 (not yet built — sequencing only)

Ordered by dependency, not by date — each is its own future milestone
with its own executive report on completion, per the standing
"Continuous Executive Reporting" instruction:

- **M2 — Content authoring & real curriculum.** Staff-facing
  create/edit endpoints for units/learning items/quiz questions (or a
  minimal admin UI); WEC-LC academic staff author real Level I-VI
  content. Nothing before this milestone can have real curriculum
  data, by design.
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
