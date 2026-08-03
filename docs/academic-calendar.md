# Academic calendar and cohort structure — recommendation

**Status: NOT ADOPTED.** This is a drafted proposal for the Executive.
Nothing here is implemented, nothing here is published, and no date in
it is a commitment. `/about/` currently lists "Academic calendar and
first-cohort start date" as outstanding, and it stays outstanding until
this is approved.

---

## The question that has to be answered before any dates exist

A calendar is not a neutral formatting exercise. It encodes an operating
model, and **the platform has already been built to one that a
conventional calendar contradicts.**

Executive Decision #1: a full-programme payment enrols the learner into
Level I immediately, and each later level unlocks when the previous is
marked completed. `unit_progress` is per learner. Nothing in the schema
knows what a term is, when anything starts, or who is studying
alongside whom. **What exists today is rolling admission with
self-paced progression.**

Publishing "Term 1 begins 14 September" on top of that would describe a
programme the software does not run.

So the real decision is not "what dates" but **which of these three the
institution is**, and the honest answer determines everything else:

### Model A — Rolling and self-paced (what is built)

A learner starts the day they pay and moves at their own rate.

- **For:** no waiting, no empty seats, no cohort too small to run. Every
  marketing pound converts immediately instead of parking a lead until
  September. This is how most successful online language providers
  actually operate.
- **Against:** completion rates for wholly self-paced language study are
  poor, and the reason is well established — no fixed points, no peers
  at the same stage, nothing to be late for. "Twenty-four months" becomes
  a figure nobody meets.
- **Software cost:** none. It runs today.

### Model B — Fixed cohorts with termly intakes

Learners join a dated intake and move through together.

- **For:** the structure that makes people finish. Shared pace, live
  classes that work because everyone is on the same unit, a graduation
  that means something, and a defensible answer to "when will I be
  finished".
- **Against:** an applicant arriving in October waits until January or
  goes elsewhere. Small cohorts either run uneconomically or get
  cancelled, and cancelling an intake is a reputational event.
- **Software cost:** substantial and not yet built — a cohort entity,
  cohort membership, a calendar of terms, scheduled unit release,
  cohort-aware progression, and an admissions flow that sells a date
  rather than immediate access.

### Model C — Rolling admission, cohort rhythm ⭐ recommended

Learners start whenever they pay, and everything social and assessed is
on a **fixed monthly rhythm** they join at the next occurrence.

- Study is self-paced through the authored units.
- Live conversation classes, workshops and tutorials run to a published
  weekly timetable, open to anyone at the relevant level.
- End-of-level examinations sit in **fixed monthly windows**, not on
  demand.
- Orientation runs on a fixed weekday, so nobody waits more than a few
  days.
- Graduation is a scheduled ceremony, held on a published cycle, for
  everyone who completed since the previous one.

- **For:** it takes the commercial advantage of A and most of the
  completion advantage of B. Nobody waits to start; everybody has fixed
  points to work toward. It matches how good online providers actually
  run at this scale.
- **Against:** more moving parts than A, and the timetable has to be
  staffed even in a quiet month.
- **Software cost:** moderate, and incremental — a schedule of recurring
  events and examination windows. It does **not** require rebuilding
  progression, which is the expensive part of B.

**Recommendation: Model C.** It is the only one of the three that can be
adopted without either abandoning the completion problem or rebuilding
the progression engine.

---

## The calendar under Model C

Structure only. Every specific date below is an illustration of the
shape, not a proposal for that date — the actual dates depend on
staffing and on when the executive wants to open, neither of which is
mine to decide.

### The rhythm

| Element | Cadence | Rationale |
|---|---|---|
| Enrolment | Continuous | No commercial reason to make anyone wait |
| Orientation | Weekly, fixed weekday | Nobody waits more than six days for a proper start |
| Live conversation class | Weekly, per level | The single strongest driver of speaking gains |
| Tutorial / office hours | Weekly, per level | Where learners who are stuck get unstuck |
| Skills workshop | Monthly, cross-level | Depth on one thing — exam technique, pronunciation, writing |
| End-of-level examination | Monthly window | Fixed enough to work toward, frequent enough not to trap anyone |
| Progress review | Per level completion | A conversation, not a report |
| Graduation ceremony | Quarterly | Frequent enough to be attended, rare enough to matter |

### Why a monthly examination window rather than on-demand

An examination a learner can sit at any moment is one they can always
sit tomorrow. A fixed window creates the deadline that produces the
revision. It is also the only arrangement under which invigilation,
moderation and a marking turnaround can be staffed at all, and
moderation is the thing standing between a certificate and a defensible
certificate.

Monthly is the shortest cadence that gives a marking team a clear week.

### The learner's twenty-four months, honestly

The published figure is 4 months per level. At 10 modules per level that
is roughly **2.5 modules a month**, or one module every twelve days.
This is a design target and the platform does not currently hold anyone
to it.

**What should be built (no policy decision needed):** show the learner
their own actual pace against the published one — modules completed,
elapsed time, and what that implies for their finish date. Not a
warning, not a threat: information. A learner who can see they are three
weeks behind in month two can still fix it; one who discovers it in
month eleven cannot.

**What must NOT be built without a decision:** any consequence attached
to falling behind. Deadlines that expire access, automatic withdrawal,
fees for extension — every one of those is a policy with contractual and
consumer-protection weight, and none exists.

---

## Orientation — the highest-value item here

New online learners drop out in the first two weeks or not at all. The
orientation is worth more than any later intervention, and it needs no
approval to design.

Recommended, one live session plus a self-serve path for anyone who
cannot attend:

1. **Where things are** — My Programme, the Listening Lab, how a unit works
2. **How to study this programme** — the recording-and-listening-back
   step learners skip, why slower playback is for decoding and not for
   comprehension, what the transcript is for
3. **What is expected** — pace, assessment shape, what completion means
4. **Who to ask, and how quickly they answer** — the single question
   that most determines whether someone persists
5. **A first unit completed inside the session**, so nobody leaves
   without having actually done one

The fifth item matters most. A learner who finishes orientation without
opening a unit has to overcome the same activation barrier again alone.

---

## What is genuinely the Executive's, not mine

I can design a structure. I cannot decide any of these, and each blocks
publication of a calendar:

| Decision | Why it is yours | Blocks |
|---|---|---|
| **Which operating model** (A/B/C) | Commercial strategy and completion-rate appetite | Everything below |
| **The opening date** | Depends on staffing and content readiness — and 41% of learning units are authored (see `/academics/iefc/#curriculum-status`) | Any published calendar |
| **Timetable hours** | Learners are worldwide; every hour chosen excludes a region. Needs your target-market decision, not a default | Live sessions |
| **Who teaches the live sessions** | There is no faculty roster. A timetable without staff is a promise nobody can keep | Live sessions |
| **Examination window length and resit interval** | Governance B3, undecided | Examination calendar |
| **What "completed" means** | Governance B4, undecided | Progress reviews, graduation eligibility |
| **Whether graduation is ceremonial or administrative** | Cost, and whether it is in-person anywhere | Graduation |

### The dependency worth naming plainly

**A calendar cannot be published before the content is finished.** The
programme advertises 720 learning units and holds 294. Committing to
"Level I completes in four months" while the units for it are still
being written would be promising delivery on a schedule that depends on
authoring not slipping. Sequence: finish the content, then set the date.

---

## If Model C is approved, what gets built

In order, each independently useful:

1. **Pace visibility** — the learner's own rate against the published
   design, on My Programme. No policy needed; buildable now.
2. **A schedule table and a timetable view** — recurring events per
   level, joinable from the portal. `live_sessions` already exists as
   the row type; what is missing is recurrence and a view.
3. **Examination windows** — dated windows, eligibility, a booking. Needs
   B3 and B4 first.
4. **Orientation as a real unit** — sequence 0 in every level, completed
   like any other, so attendance is visible rather than assumed.

Item 4 is worth noting: making orientation a *unit* rather than an event
means the platform can see who has actually done it, and the existing
progress machinery handles it with no new concepts.
