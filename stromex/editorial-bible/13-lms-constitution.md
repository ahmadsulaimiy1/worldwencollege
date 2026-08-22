# Volume 13 — The LMS Constitution

*Learning systems, and the small number of decisions that determine
whether a learning record is trustworthy ten years later.*

---

## §13.1 Mastery over completion `[OBSERVED]`

`SX-EB Part II`: **the learner's actual comprehension is the metric — not
time-on-app.** Spaced, adaptive repetition over one-time content delivery.
`AMC-EB §33` builds an entire progression doctrine on it: mastery gates
rather than fixed durations.

**And its cost, recorded honestly** (`AMC-D A-1`, critical): mastery
without notional learning hours makes an institution un-accreditable and
its awards untransferable. **Both records are kept** (`SEB §14.5`).

## §13.2 Access is a consequence of enrolment, never a second list `[OBSERVED]`

The estate's best LMS decision (`WEC docs/lms-architecture.md`, Access
control):

> A student can read or submit against a unit only if they hold an
> `active` or `completed` enrolment row for that unit's level — **checked
> on every read and write path**. This is the same enrolment table
> payments already writes to, so LMS access is a direct, real consequence
> of what they have actually paid for and completed — **never a second,
> separately-maintained access list that could drift out of sync with
> billing.**

**Binding.** Entitlement is derived from one authoritative row. Two
sources of truth for "may this person see this" is not a performance
optimisation; it is a future incident.

**Staff bypass is explicit and bounded** — grading crosses the same single
staff boundary used everywhere else, and **the role lives on the
institution's own user row, not on anything the auth provider asserts.**
An identity provider proves *who*; only the institution decides *what
they may do*.

## §13.3 Attempts are append-only; a pass is never undone `[OBSERVED]`

Two rules from `WEC docs/lms-architecture.md` that are worth more than
they look:

1. **Every attempt is its own row, never updated in place.** This
   preserves a real attempt history — for the student ("60% the first
   time, 90% the second"), and for any later academic-integrity or
   analytics need — rather than only ever knowing the latest state.
2. **A completion is never downgraded.** A later failing retake or
   re-submission does not erase an earned pass. This is named there as
   "a deliberate answer to a known LMS technical-debt trap: naive retake
   handling that lets a bad second attempt undo a real, already-earned
   completion."

Both are `SEB §2.2` in miniature: the record accumulates, it does not
overwrite.

## §13.4 Progress is materialised, and one path writes it `[OBSERVED]`

Unit progress is a materialised row per `(learner, unit)` rather than a
live join across attempts and submissions, because "is this done" is asked
cheaply and often. **It is written by exactly one function**, which also
enforces §13.3's no-downgrade rule.

**Binding.** Where a derived fact is materialised, exactly one code path
writes it, and that path owns the invariants. Two writers of a derived
fact is a divergence waiting for a deadline.

## §13.5 Content is a model, not a page `[OBSERVED]`

`SX-EB Part VII`: a **single structured-document source of truth** that
renders to every output format — web, PDF, print-ready, presentation —
without content re-entry. `WEC` proves it at scale: one content model
renders the site, the DOCX and the PDF editions of a 720-unit curriculum.

**Binding.** Curriculum, lessons, assessments and publications share one
model. A format is a renderer. Content authored *into* a format is content
that will be re-keyed.

## §13.6 Every lesson states what the learner knows afterwards `[OBSERVED]`

`SX-EB Part V`: every lesson has a stated learning objective, a difficulty
calibration and a mastery check. **No content ships without a defined
"what does the learner know afterward that they didn't before."**

## §13.7 Curriculum is authored by academic staff, never invented `[OBSERVED]`

`WEC-EP §4` and `WEC-EB Part IV` are unambiguous: no lesson, quiz or
assignment is seeded for a level because it would demonstrate the system.
Inventing curriculum "would be exactly the kind of fabricated
institutional fact this bible exists to prevent; that's real academic
staff's work."

**And the corollary:** **new LMS capability only when the curriculum
genuinely requires it, never because it would be impressive**
(`WEC-EP §4`). The estate's own audio platform is cited there as the first
capability the curriculum *earned*.

## §13.8 Assessment regulations are governance, not code `[OBSERVED]`

`WEC-EP §4`: never invent academic policy where governance approval is
required — **resit policy, certification policy, assessment regulations,
progression rules, examination conventions.** The same applies to data
policy with legal consequences: `WEC` ships `recording_retention_days` as
`null` for exactly this reason.

**Binding.** A pass mark, an attempt limit, a resit window or a
progression rule is a *configured institutional decision* with a policy
code behind it (`SEB §18.4`), never a constant in a source file chosen by
whoever wrote the grader.

## §13.9 Results are not published the instant they are written `[OBSERVED — as a named gap]`

`SHRS data-lifecycle-register`, Results row, states the defect plainly:
the permission matrix gives Registrar and Principal a joint
Approve/Publish authority over results, but **no `approved_at` or
`published_at` column exists anywhere**, so "a raw score is visible on the
guardian and student dashboard the instant it's written."

**Binding for every new academic system.** Entering a score and publishing
a result are two different acts, with two different authorities and two
different timestamps, from the first migration. Retrofitting the
distinction means deciding what to do about every score already visible.

## §13.10 Learner data is the learner's `[OBSERVED]`

`SX-EB Part VII`: memory is three-tiered — ephemeral session, working
project, durable long-term — and **all of it is user-visible, exportable
and deletable on request**. `SHRS` implements the request side as a real
`privacy_requests` channel.

**The two halves must not be confused.** A learner's right to *export* is
built and honoured. A learner's right to *erasure* runs into `SEB §26.1`
and `SEB §26.2`, and the honest answer — recorded rather than dodged — is
that the estate has built the request-handling path and has **not** built
the deletion action behind it, because destruction authority for academic
records has not been settled (`SEB §28.4` Q4). A privacy request is
answered by a named human, under the retention policy, not by an automated
cascade.

## §13.11 Audio, video and voice `[OBSERVED]`

Where a learning system captures a learner's voice or image:

- The store is **private and stays private**; playback goes through an
  endpoint that authorises every request against the same rules as the
  rest of the platform. **No public or signed URL is ever handed out.**
- The accepted format list is derived from what **real browsers actually
  produce**, not from what is tidy: `WEC-EP §2` records that a content-type
  allow-list rejected `audio/webm;codecs=opus` — every recording any real
  browser produces — while 62 unit tests passed on the tidy `audio/webm`
  nobody's browser sends.
- Retention is a governed decision, not a default (`SEB §13.8`).

## §13.12 The LMS is not the institution `[RULED — confidence High]`

An LMS holds *learning* records. The registrar holds the *institutional*
record (Volume 12). When they disagree, the registrar is authoritative,
and the LMS is corrected — never the reverse, and never silently.

The reason is `SEB §4.4`: the two record families have different creators,
approvers, exporters, archivers and retention rules, so they are different
boundaries even when they describe the same student on the same day.
