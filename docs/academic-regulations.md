# The Academic Regulations of Worldwide English College

**Adopted by the Executive of Worldwide English College, 20 August 2026.**
Version 1.0.0. Subject to ratification by the Academic Senate once that
body has appointed members; in force meanwhile.

**These are the College's own regulations.** No external body has
approved, endorsed, accredited or ratified them, and none has been
asked to. Every award under them is set, marked and second-marked
against a rubric published before the work, and moderated inside the
College. No External Examiner is appointed. That is stated here, at the
top, because a governing document that puts its own standing in a
footnote is asking to be misread.

The machine-readable instrument is `data/academic-regulations.json`.
**That file governs.** This document is the same instrument in prose,
written so that an examiner, a ministry, an admissions officer or a
student can read it without opening a JSON file — but where the two
could be read differently, the numbers in the JSON are the numbers, and
this document is what has to be corrected.

---

## 0. What fault these regulations exist to correct

The College's quantitative rules were already published, and they were
already true. They were published as prose across four pages and one
configuration key, and the prose had drifted into shapes only a reader
who had seen all four in the same afternoon could reconcile:

| Where | What it says |
|---|---|
| `/academics/` | a level award needs "no single skill below 50%" |
| `/students/awards/` | the Pass honour needs "no skill below 60%" |
| `/academics/` | an assessment may be resat "as many times as it takes" |
| `/students/regulations/` | two resits, then the level is repeated |

Neither pair is a contradiction. Each sentence is true of a different
quantity, and §5 and §11 below name the quantities. But nothing written
down said which was which, and an institution whose grading rules can
only be reconciled by inference has not published its grading rules.

Meanwhile the platform's only numeric academic rule was a single
scalar — `platform_config.lms_pass_threshold = 0.7` — whose own schema
comment concedes it is "a mechanism default, not a published WEC-LC
academic standard".

A grade is the most consequential number an institution produces about
a person. It cannot rest on four pages that have to be read together
and one scalar that admits it is a placeholder. These regulations put
every quantitative rule in one instrument, give each one a stable
identifier, record where each came from, and state the rounding rule
once so that two parts of the platform cannot disagree about a mark.

---

## I. The marking scale

Marks are expressed as percentages from 0.00 to 100.00. Grade points
are expressed on a maximum of **4.00**.

| Band | Mark | Grade point | Honour |
|---|---|---|---|
| **A** | 94.00 and above | 4.00 | High Distinction |
| **A−** | 88.00 – 93.99 | 3.70 | Distinction |
| **B+** | 80.00 – 87.99 | 3.30 | Merit |
| **B** | 70.00 – 79.99 | 3.00 | Pass |
| **F** | below 70.00 | *none* | — |

- **The pass mark is 70.00.** One number governs completing a module,
  passing the level examination, and reaching the Pass honour.
- **The distinction threshold is 88.00.**
- **A mark below the pass mark carries no grade point.** Not 0.00 —
  none. §7 explains why the difference matters.

### Why 4.00, and why these letters

The College writes for the Gulf, for West and East Africa and for South
Asia. In every one of those places a 4.00 grade point average is the
currency an admissions office, a scholarship panel and a ministry read
without converting anything. A scale out of 5, out of 10 or out of 20
would require every reader of a WEC transcript to do a conversion, and
a conversion is where a good record becomes an argument.

The four grade points were already published — 3.00, 3.30, 3.70 and
4.00 against Pass, Merit, Distinction and High Distinction. Those are
**precisely B, B+, A− and A** on the four-point scale. The letters in
the table above are therefore not a second system laid over the honours;
they are the same system in the notation most readers meet first. The
College adopted the notation rather than inventing one.

One consequence is worth stating plainly rather than leaving an
admissions office to work out: because this College's pass mark is 70
and not 50, **its lowest conferred grade point is a B.** A WEC
transcript has no C, D or E on it. That is not grade inflation — it is
the arithmetic of a high pass mark, and it means a 3.00 from this
College is a pass at seventy per cent, not a mid-band result.

### One band below the pass mark, not three

There is a single sub-pass band. A mark under 70 has exactly one
consequence — the assessment is taken again — and grading failure into
D, E and F would publish a distinction the regulations never act on. A
learner who needs to know *what* went wrong is served by the four skill
marks, which is where that information actually is.

---

## II. Rounding, stated once

Every rule below depends on this one, so it is stated here and nowhere
else.

1. **Round half up, away from zero.** Banker's rounding is right for
   money and wrong for a grade: a learner is entitled to the benefit of
   the half and to a rule they can apply themselves.
2. **Two decimal places for marks; two for the grade point average;
   one for display.** Two places is finer than any threshold in this
   instrument, so rounding can never move a mark across a band
   boundary by itself.
3. **Round once, at the end.** A component is never rounded before it
   is weighted. Rounding a quiz, then a module, then a level compounds
   three roundings into a mark no single rule produced — which is
   exactly how two screens come to show different numbers for the same
   learner.
4. **Compare on the rounded value.** The number compared against a
   threshold and the number displayed are the same number. Otherwise a
   learner can see 70.0 on the screen and a fail in the record.
5. **A lift to a threshold is not rounding.** 69.4 is not 70. No
   marker, no board and no code path may move a mark to a threshold on
   the ground that it is close. A mark changes by remarking, by appeal
   or by reassessment, and each of those leaves a record.

---

## III. The module mark

Each of the sixty modules carries one assessed quiz and one assessed
assignment.

> **module mark = (quiz × 0.30) + (assignment × 0.70)**
>
> **A module completes at 70.00.**

**Both components are required.** A module whose assignment was never
submitted has no module mark at all — the mark is null, not a partial —
and a module cannot complete on the quiz alone.

### Why 30 / 70

The College publishes that the module quiz is "machine-marked,
immediate, and low-stakes by design — its job is to tell you what to go
back to, not to judge you", and that "everything that requires judgement
is judged by someone". A weighting that let a machine-marked quiz carry
half a module mark would contradict both sentences and would put half of
every module in the hands of the one instrument no person reads. The
assignment produces something and is marked by a person against a rubric
published before the work, so it carries the weight.

### There is no separate component floor, and there does not need to be

A minimum mark on the assignment was considered and refused as dead
machinery. The weighting already enforces one: with a *perfect* quiz,
the assignment must still reach **57.14** for the module to complete.
An assignment floor set below that could never fire; a floor set above
it would be a second rule saying what the first already says.

(57.14 rather than 57.15 because the rounding rule decides the
boundary: 57.14 produces a module mark of 69.998, which rounds half-up
to 70.00. This is exactly the kind of edge two implementations disagree
about, which is why it is written down.)

---

## IV. The level mark, and the gates

A level is ten modules and one level examination.

> **level mark = (examination × 0.60) + (mean of the ten module marks × 0.40)**

The examination dominates because it is the one assessment sat under the
College's own conditions against a rubric the candidate saw first. It is
not permitted to be the *whole* of the mark, because four months of
marked, second-marked work would then be decorative — and because the
College's own award page says an award is conferred against "a full set
of assessment results across all four skills", not against one sitting.

Each module carries two credits, so the ten are equally weighted and an
arithmetic mean and a credit-weighted mean are the same number today.
It is written as a mean of ten because that is what it is; if a module
of a different weight is ever authored, this is the rule that changes,
and it changes in one place.

### The six gates

The level mark **classifies**. It does not confer. Six conditions gate
conferral, and all six must hold:

| Gate | Threshold |
|---|---|
| All ten modules completed | 10 of 10 |
| Level examination, overall | ≥ 70.00 |
| Every examination rubric criterion | ≥ 50.00 |
| Every examination skill sub-mark | ≥ 50.00 |
| The spoken paper recorded and passed | — |
| A member of academic staff confirms the level is finished | — |

**A classification never overrides a gate.** A level mark of 92 with an
examination at 68 is not a Distinction and is not an award; it is a
failed examination with strong coursework, and the record says so.

**Coursework can lower a classification as well as raise it.** An
examination at 90 with a coursework mean of 78 produces a level mark of
85.20 and a Merit, not a Distinction. That is deliberate: the award
reports the standard of the level's whole work, and a framework that let
one sitting overrule ten marked modules would be reporting the sitting.

---

## V. The four skills

Listening, Reading, Speaking and Writing are marked apart and stay apart
on the record. They are never averaged into one figure — a learner who
reads well and cannot be understood aloud has a specific, serious
problem, and an averaged mark of 74 conceals it perfectly.

> **skill mark = (examination skill sub-mark × 0.60) + (coursework skill mean × 0.40)**

The same 60/40 split as the level mark, applied inside each skill, so a
skill mark and a level mark are built the same way and cannot disagree
about what a level's work was worth.

The coursework contribution is the weighted mean of every assessment in
the level with an **approved** mapping to that skill, weighted by the
mapping's own weight. A speaking task assessed partly for the quality of
its argument is not one hundred per cent Speaking, and
`assessment_skills` already records how much of each assessment bears on
each skill, with a proposer, an approver and a date.

**Two rules follow, and the second is load-bearing:**

- An assessment with **no** approved mapping still counts toward its
  module. It cannot count toward a skill, because nobody with the
  authority to say which skill it evidences has said so.
- **A skill with no mark blocks conferral.** Every honour carries a
  per-skill floor, and a floor cannot be tested against an absence. Where
  a level has no approved mapping for a skill, the skill mark is null and
  conferral *refuses*. It does not pass by default and it does not
  silently drop the floor.

That last rule makes the mapping work a precondition of the award rather
than an aspiration beside it. As of adoption no assessment carries an
approved mapping, so under this instrument no level would confer. That is
the intended behaviour of the rule and it is recorded in §XV.

---

## VI. Classification

| Honour | Level mark | Every skill mark | Grade point | Letter |
|---|---|---|---|---|
| **High Distinction** | ≥ 94.00 | ≥ 88.00 | 4.00 | A |
| **Distinction** | ≥ 88.00 | ≥ 80.00 | 3.70 | A− |
| **Merit** | ≥ 80.00 | ≥ 70.00 | 3.30 | B+ |
| **Pass** | ≥ 70.00 | ≥ 60.00 | 3.00 | B |

**A learner is classified at the highest honour whose overall threshold
*and* skill floor are both met.** Both, not either. A level mark of 90
with a skill at 75 is a Merit: the floor demotes the classification
rather than failing the candidate, because the work reached the Merit
standard on every measure and the Distinction standard on only one of
them.

**The compensation allowed narrows as the band rises** — ten points at
Pass and Merit, eight at Distinction, six at High Distinction. That is
this framework's distinguishing rule. Most frameworks let a strong skill
compensate for a weak one without limit; this one tightens the limit
exactly where the claim gets stronger, because a graduate who writes
excellently and cannot be understood aloud has not mastered English, and
a certificate saying otherwise is one the College would have to defend
the first time an employer met them.

### The Distinction of the College

Conferred by decision of the Executive, never calculated, and it may be
conferred in no cycle at all. It carries **no grade point** and enters
no average. A distinction that could be computed into a figure would
stop being a decision.

### The two floors are two quantities

This is the reconciliation §0 promised, and it is the single most
important sentence in this document for anyone implementing it:

- **50.00 is a floor on a skill sub-mark *inside the examination*,** and
  on each rubric criterion inside it. It is a gate.
- **60.00 is a floor on the *level skill mark*** — the examination and
  the coursework together, at the 60/40 split. It is a condition of the
  Pass honour and therefore of conferral.

Both published figures are in force. Neither is the other. The Pass
floor of 60 is the effective standard of the award, because the lowest
honour is the lowest thing that can be conferred.

*Editorial note, for whoever next edits the public pages: `/academics/`
describes the graduation condition as "no single skill below 50%",
which is true of the examination gate and reads as though it were the
whole rule. The wording would be more accurate as "no examination skill
below 50%", with the award standard of 60% cross-referenced to
`/students/awards/`. No figure changes; only the noun does.*

---

## VII. The grade point average

> **CGPA = Σ (credits × grade point) ÷ Σ (credits)**, over conferred awards

Reported to two decimal places, as already published. It is **derived,
never marked**: nothing is assessed to produce it and no examiner sees
one. It exists because a single figure is what an admissions office
asks for first, and the College would rather publish the arithmetic than
have somebody invent it from a transcript.

### Which credits

The credits **recorded on the award itself** (`awards.credits`),
denormalised at conferral. A certificate issued in 2027 must still read
as it did in 2027 even if the College later restructures a level, so the
average is weighted by the credit the award carries, never by the credit
the level carries today.

Every level is twenty credits, so the weighting is arithmetically a
simple mean and will be for as long as that holds. It is written as a
credit weighting anyway, so that the day the College confers an award of
a different weight the formula needs no rewriting.

### What is excluded, case by case

| Case | Treatment | Why |
|---|---|---|
| **A level attempted and not conferred** | Excluded. **Not a zero.** | Already published. An attempt that did not reach the standard produced no certification to report. |
| **A withdrawn enrolment** | Excluded entirely | A withdrawal is the end of an attempt, not the result of one. It is visible on the record as a withdrawal, not hidden as an absence. |
| **A resit** | No second entry. The capped mark replaces. | Already published: re-sits replace rather than accumulate. One level, one conferral, one grade point. |
| **A revoked award** | Excluded from the date of revocation | A revoked award is marked and never deleted, so the record still shows it. A revocation is not a fail and is not scored as one. |
| **A replaced award** | Only the replacement counts | A correction to a certificate must not appear in an average twice. |
| **The Distinction of the College** | Excluded | It carries no grade point. |
| **Transferred credit** | None is accepted | The College operates no credit-transfer and no recognition-of-prior-learning scheme, so no external mark can enter this average. |
| **Levels skipped by placement** | No credit, no award, no grade point | A learner placed into Level IV is *placed*, not credited. The transcript shows the levels actually held, and credits held is the sum of credits actually conferred — sixty for three awards, not a hundred and twenty. |

### Two consequences

**Before the first conferral there is no average.** Null, never 0.00. A
learner mid-way through Level I has not been certified in anything, and
a zero on a transcript would say the opposite.

**The lowest possible CGPA is 3.00.** Only conferred levels carry a
grade point and the lowest of those is 3.00. This is not a flattering
accident to be quietly enjoyed: it means **a CGPA cannot distinguish a
struggling learner from a strong one at this College**, and it is the
reason §X decides academic standing on assessment outcomes and not on a
grade point average. A standing threshold on CGPA would never fire, and
publishing one would be publishing a mechanism that does nothing.

It also means the published CGPA threshold of 3.70 — the academic
criterion for a funded British residency and one of two criteria the
Foundation Remission panel weighs — sits at Distinction standard across
the levels held, and should be read that way.

---

## VIII. Progression

**One level at a time.** A level opens when the level before it is
completed, whether the learner paid per level or for the whole
programme. Nothing is withheld from anybody; a level simply opens when
they are ready for it.

**What must be held to enter the next level:** the same set that
confers the award — all six gates of §IV, plus the Pass floor of 60 on
every skill. Progression and conferral are one event with two records:
the next level opens and the register is written. Two different
standards for "finished" would eventually put a learner in Level IV
without a Level III award.

**Entry above Level I is by placement assessment.** It establishes where
a learner begins and nothing else: the levels skipped confer no credit,
no award and no grade point.

**Progression pauses under Suspended Progression. Access does not.**

**A third failure at one assessment means the level is repeated** — the
modules reopen, the assessments are set afresh, and nothing about the
learner's access changes. Repeating is a route forward, not a sanction.

---

## IX. Graduation and conferral

A level award is conferred when all of the following are true, and
**nothing beyond them**. There is no attendance requirement, no
participation mark, no final discretion and no condition that appears at
the end:

1. All ten modules completed — every quiz taken, every assignment
   submitted and marked.
2. The level examination passed at 70.00 overall.
3. No examination criterion and no examination skill sub-mark below
   50.00.
4. The spoken paper recorded and passed.
5. Every level skill mark at or above the Pass floor of 60.00, and none
   of them null.
6. A member of academic staff confirms the level is finished.

Six awards exist, one per level, each 20 credits: **ApWEC** (A1),
**CnWEC** (A2), **AsWEC** (B1), **EnWEC** (B2), **OrWEC** (C1),
**LrWEC** (C2).

**The programme** is completed by holding all six — 120 credits. There
is no separate final examination and no thesis: the sixth level award
*is* the completion of the programme.

**Conferral is an entry in the register, not a calculation.** The
arithmetic above establishes eligibility. The award exists when it is
written into the hash-chained register with a holder, a date and a
verification code, which is what makes it checkable by somebody who does
not trust the College.

**An award is never conferred on attendance, on payment, on time served
or on engagement.** No path in this instrument routes any of those to a
mark.

**Nothing here is retrospective.** An award already conferred stands on
the standard in force when it was sat. No honour under this instrument
is applied to an existing holder backwards; a grade awarded backwards is
a grade nobody earned.

---

## X. Academic standing

Three states, and one rule that overrides all of them.

### In Good Standing

The default, and the state nobody needs to think about. **The College's
obligation is nothing beyond the ordinary teaching relationship** — it
does not manufacture contact to prove it is paying attention.

### Under Review

**Triggered by** any of: two failed summative attempts within one level;
a failed level examination; or a review flagged by academic staff with a
recorded reason. (Two failed attempts at the *same* assessment count the
same as one failure each at two — in both cases a learner is having
difficulty.)

**The College is obliged to:**

- offer a tutorial with a member of academic staff, in writing, within
  **10 working days**;
- state in that offer what triggered the review and what would clear it;
- record the offer whether or not the learner takes it, so that a
  learner who was never reached cannot later be described as one who
  declined help;
- clear the standing when the outstanding assessment is passed or the
  flag is lifted with a recorded reason.

It is **not a sanction**. It affects no mark, no honour, no award and no
access. The purpose of noticing that somebody is struggling is to reach
them, and a penalty reaches nobody.

### Suspended Progression

**Triggered by** an integrity matter opened under the misconduct
procedure.

**The College is obliged to:**

- put the allegation to the learner in writing before any finding, and
  hear the reply;
- reach a first-instance decision within **20 working days** of opening
  the matter — **the suspension lapses automatically if it does not**;
- leave every route of appeal open, each stage decided by somebody who
  was not part of the last one;
- continue access to teaching, the library and support throughout.

The twenty-day limit is new here. An unresolved allegation costs the
learner, so it must cost the College a deadline; otherwise a suspension
becomes indefinite by nobody deciding anything.

### There is no probation band and no exclusion band

**Exclusion** is ruled out by the College's own published overriding
rule: *no standing removes your access to learning; nothing expires,
locks or is withdrawn.* That is partly principle and partly plain sense,
since each of those would carry contractual and consumer-protection
weight the College has not taken on.

**Probation** is ruled out as a consequence. Probation is a state whose
only content is the threat of exclusion. With no exclusion behind it, it
would be a word with nothing in it, applied to learners already in
difficulty.

### Contact obligations, which are not standings

- **60 days** without engagement in a live enrolment — the College
  writes.
- **120 days** — a member of staff makes contact themselves, and the
  record says who. A second automated message is not a second attempt.

These are obligations on the College, not standings on the learner.
There is no deadline here to miss and no penalty for a slower route; a
learner fitting study around a night shift is the normal case at this
College rather than the exception.

---

## XI. Resits and reassessment

| Rule | Value |
|---|---|
| Resits per summative assessment | **2** (three attempts in total) |
| Minimum interval between attempts | **14 days** |
| Mark cap on a resit | counts at **70.00**; actual mark recorded in full |
| Capstone / level examination resit | a **new task**, not a resubmission |
| Window | any time while the enrolment is live |
| Task refreshed | after **365 days** from the first attempt |
| Third failure | the level is repeated |
| Fee | **none** |

**The window, and why it is not a deadline.** The College publishes that
a learner may take six months or two, and a resit window that expired
would be the one deadline in a programme built to have none. So there is
none. What *does* expire is the paper: after a year the assessment is
set on a fresh task, because a task whose answers have been in
circulation for a year is no longer the same assessment. That is a limit
on the instrument, not on the learner — no attempt is lost and nothing
is charged.

**The cap, recorded honestly.** The mark actually achieved is recorded
in full; the record tells the truth about the work. The mark that enters
the module or level arithmetic is the capped one.

**How far the cap reaches.** The published rule — "capped at Pass",
because "an honour should reflect performance at the standard the first
time it was met" — admits two readings, and this instrument takes the
proportionate one:

- Resitting a **module** assessment caps that assessment's counting mark
  at 70.00 and nothing more. Forfeiting a Distinction across an entire
  level because one module quiz was retaken would be a penalty out of
  all proportion to the event.
- Resitting the **level examination** classifies the level at **Pass**,
  grade point 3.00, whatever the composite arithmetic produces. The
  examination is the instrument the honour is about.

**Repeating a level attracts no additional charge.** That is not a new
commitment; it is a consequence of one already published. The tuition
page closes the list of charges an enrolled student meets — if a cost is
not on that list it does not exist — and no repeat charge is on it.

---

## XII. Attendance and engagement

**This is the subtle one, so it is written at length.**

### There is no attendance requirement, and there will not be one

No award, no mark, no honour and no standing in this instrument depends
on attendance. The programme is asynchronous. In its ordinary sense
attendance measures a learner's time zone and shift pattern rather than
their English, and importing it would penalise precisely the learners
this College was built for.

### What the College does measure, and what it calls it

**Engagement with a module, within a defined window.**

The window is **seven days, anchored to the learner's own enrolment
start date** — not to a Monday. A Monday-to-Sunday week is a Western
working week, and most of this College's learners are in places where
the week does not begin on Monday. Anchoring to the learner's own start
date imports nobody's calendar.

A learner is **engaged** with a module in a window if **any one** of the
following is true:

1. **Twenty minutes of server-measured study** on that module in the
   window. The client never says how long it studied; it says only "I am
   still working", and the server decides what that is worth by looking
   at the clock. The beat interval and its ceiling belong to
   `functions/_lib/lms/time-on-task.js` and are deliberately not
   restated here — a constant written in two places is a constant that
   will drift. Twenty minutes is short enough that a genuine study
   session always clears it and long enough that opening a page does
   not.
2. **A quiz attempt or an assignment submission** recorded in the
   window. A learner who sat the quiz was present, whatever the clock
   recorded; a rule that could mark a submitting learner absent would be
   measuring the instrument rather than the learner.
3. **A live session joined**, where live sessions exist for that module
   or level, **confirmed by the host**. Nothing is inferred from a join
   link having been issued.

### What it is not

- Not a condition of any award.
- Not a mark, and not a participation grade.
- Not a measure of learning. Twenty minutes of study is evidence that a
  learner was working, and nothing else. A learner who understood the
  module in fifteen minutes is not less engaged; they are faster.
- Never inferred from an open browser tab or an issued join link.
- Not published as an institutional figure until it has been measured
  across a real cohort. A mean of four learners is an anecdote with a
  decimal point.
- **Never a penalty.**

### The live-session clause fires for nobody today

`live_sessions` records that a session existed. Nothing records who
attended it. Until an attendance record exists, clause 3 above is
regulation without an instrument, and the platform reports live-session
attendance as **not instrumented** rather than as zero — "no attendance
recorded" and "nobody attended" are different statements and only the
first is true. A table is requested in §XV; it is not built here,
because this instrument does not own the schema.

### Why the College measures it at all

Three reasons, and no fourth:

1. **To reach a learner who has gone quiet** — in month two rather than
   month eleven. This is the only reason worth building it for, and §X
   is where it discharges.
2. **To tell a sponsor exactly what was measured.** An employer or a
   ministry funding a seat is entitled to know whether the seat is being
   used, described in the words of its definition — engagement with a
   module in a window — and not as an attendance figure the College does
   not hold.
3. **To replace a design hours figure with a measured one.** The College
   publishes Total Qualification Time as a design figure and says so.
   Time on task is the instrument that will one day let it publish a
   measured figure instead, and say that it has.

---

## XIII. Credit

One **WEC Credit** is ten notional learning hours. Two credits per
module, twenty per level, 120 for the programme; 200 hours of Total
Qualification Time per level, of which 80 are guided and 120
independent.

Total Qualification Time is a **design** figure and is labelled as one.
It is the workload the curriculum was built to, not a measurement, and
some learners will finish a level in far fewer hours and some in far
more. That is what *notional* means.

**The WEC Credit carries no transfer entitlement.** It is the College's
internal measure of academic weight. No university is obliged to accept
it, none has agreed to, and the College has asked none.

---

## XIV. Every judgement call, and why

Where the published pages already fixed a rule, this instrument adopted
it unchanged. Where they were silent or could be read two ways, it
decided. Each decision is here, with the alternative that was rejected.

**1. A 4.00 maximum, with A / A− / B+ / B letters.**
Rejected: a 5-point or 10-point scale, and a bespoke lettering. 4.00 is
the currency read without conversion across the Gulf, Africa and South
Asia; the College's four published grade points are already exactly the
four-point values of A, A− , B+ and B, so adopting the notation cost
nothing and inventing one would have cost every reader a conversion.

**2. One sub-pass band, not several.**
Rejected: D / E / F gradations. A mark below 70 has one consequence.
Publishing three degrees of failure would imply a distinction the
regulations never act on, and the diagnostic information a learner needs
is in the four skill marks.

**3. A sub-pass mark carries a null grade point, not 0.00.**
Adopted from the published rule that a level not conferred "is not
averaged in as a zero". A zero is a value and it averages; an absence is
not a value and must not. Every formula here propagates null.

**4. Module weighting 30 / 70, quiz to assignment.**
Rejected: 50/50. The College publishes that the quiz is low-stakes by
design and that everything requiring judgement is judged by a person.
50/50 would contradict both sentences and would put half of every module
in the hands of the one instrument no person reads.

**5. Both module components required.**
Rejected: the current platform behaviour, which completes a module when
*either* component passes. That behaviour lets a learner finish a level
having produced nothing a person read. §XV records it as a divergence to
be fixed in code.

**6. No separate floor on a module component.**
The weighting already enforces one at 57.14 on the assignment. A second
rule saying what the first says is machinery that can only drift.

**7. Level mark 60 / 40, examination to coursework.**
Rejected: examination only. That would make ten modules of marked,
second-marked work decorative, and would contradict the award page's own
statement that an award is conferred against a full set of assessment
results across all four skills. Rejected also: an even split, which
would let strong coursework carry a weak examination further than the
summative instrument should allow.

**8. The gates are separate from the classification.**
The published pages fix a 70% examination requirement *and* honour
thresholds on an "overall" mark. Making the examination requirement a
gate and the composite a classification is the only reading in which
both survive. A classification can never carry a candidate past a gate.

**9. Coursework can lower a classification.**
Accepted as a consequence rather than avoided. The award reports the
standard of the level's whole work.

**10. The 50% and 60% skill floors are two quantities.**
This is the reconciliation of the two published pages. 50 is a floor
inside the examination; 60 is a floor on the level skill mark. Both are
in force. The alternative — treating one as an error — would have
required overruling a published, adopted decision, which is not this
instrument's to do.

**11. A null skill mark blocks conferral.**
Rejected: dropping the floor when no mapping exists, which would let an
award confer against a standard nobody checked. The rule makes the
assessment-to-skill mapping a precondition of the award. Its immediate
effect is that no level confers until that academic work is done, and
that effect is intended.

**12. The GPA is credit-weighted although all levels weigh the same.**
Written for the case that does not exist yet, so the formula does not
need rewriting the day it does.

**13. Standing is not decided on GPA.**
Not a preference — an arithmetic necessity. The lowest conferred grade
point is 3.00, so no learner can hold an average below 3.00 and a
threshold on it would never fire. Standing is decided on assessment
outcomes, which is the evidence that actually distinguishes a learner in
difficulty. Publishing a GPA standing threshold would have been
publishing a mechanism that does nothing.

**14. No probation band and no exclusion band.**
Exclusion is ruled out by the College's published overriding rule.
Probation follows: it is a state whose only content is the threat of
exclusion, so with no exclusion behind it there is nothing in it. The
task these regulations were written against suggested both as examples;
they are the two bands the College has already ruled out, and inventing
them to fill a table would have contradicted a published rule.

**15. A 20-working-day limit on Suspended Progression.**
New. The published rule pauses progression during an integrity matter
and says nothing about how long. An unresolved allegation costs the
learner, so it must cost the College a deadline, and the suspension
lapses automatically if the College misses it.

**16. Two failed attempts at one assessment count the same as one each
at two.**
The published trigger is "two failed summatives". Reading it narrowly
would exclude the learner failing the same paper twice — who is more
obviously in difficulty, not less.

**17. The resit cap is per-assessment, except at the level
examination.**
The published rule admits both readings. Capping a whole level's honour
because one module quiz was retaken is disproportionate; capping it
because the summative examination was retaken is the rule's evident
intent, since the reason given is that "an honour should reflect
performance at the standard the first time it was met".

**18. No resit window, but a 365-day task refresh.**
The task asked for a window and the College has published that there is
no deadline to miss. Both are satisfied by putting the limit on the
paper rather than the learner: the resit may be sat at any time, and
after a year it is sat on a fresh task.

**19. "As many times as it takes" and "two resits" both stand.**
Two resits govern attempts at one sitting of one assessment. After that
the level is repeated at no charge and the assessment is set afresh, so
nothing is ever closed off to a learner — which is what the first
sentence promises.

**20. Attendance defined as module engagement in a seven-day window
anchored to the learner's start date.**
Rejected: a calendar week, which imports a Western working week onto
learners whose week does not begin on Monday. Rejected: presence at a
live session as the definition, which would measure a facility most
learners do not use. Rejected also: any definition that reaches a mark.
The governance register asked one question — does attendance mean
presence at a live session or engagement with the module — and this is
the answer: engagement with the module, with live-session attendance as
one of three sufficient conditions rather than the definition.

**21. Twenty minutes as the engagement threshold.**
A judgement, and a defensible one: short enough that a genuine study
session always clears it, long enough that opening a page does not.

**22. Round half up, once, at the end, and compare on the rounded
value.**
The three ways two implementations of one rule normally diverge, closed
in one place.

---

## XV. Where the platform does not yet compute this

Recorded rather than quietly assumed. None of it is a fault in the
regulations; all of it is distance between what is adopted and what is
built, and it is written down so the distance is visible.

| Rule | File | What is there now |
|---|---|---|
| Module composite | `functions/_lib/lms/content.js` | A module completes when **either** the quiz **or** the assignment reaches the threshold, independently. A learner who passes the quiz and never submits the assignment has the module recorded complete. |
| The six gates | `functions/_lib/student/progression.js` | `completeLevel()` marks an enrolment completed on staff instruction and checks no gate. |
| The pass mark | `platform_config.lms_pass_threshold` | 0.7, documented in the schema as "a mechanism default, not a published WEC-LC academic standard". The value is unchanged; it is now an adopted standard, and that comment is out of date. |
| Skill mapping | `assessment_skills` | No assessment carries an approved mapping. Under §V, conferral therefore refuses — which is the intended behaviour of the rule, not a bug. |
| Live-session attendance | `live_sessions` | The table records that a session existed; nothing records who attended. |

### Schema changes requested, not made

This instrument does not own `sql/schema.sql`. Two tables are asked for:

1. **`live_session_attendance`** — one row per learner per session,
   written on a host-confirmed join, so that clause 3 of the engagement
   rule has something to read.
2. **An attempt ordinal on `quiz_attempts` and
   `assignment_submissions`** — neither table records which attempt a
   row is, nor which attempt is the counting one, so the resit count,
   the fourteen-day interval and the mark cap cannot be enforced or
   audited from the data as it stands.

---

## XVI. Amendment

A rule changes by being changed **here and in
`data/academic-regulations.json`**, with `instrument.version` and
`instrument.adopted_on` moved and the decision recorded in
`docs/governance-decisions.md`. A rule changed in code and not in the
instrument is a rule the College cannot show anyone.

Identifiers are the contract. A label may be re-translated or re-worded
freely; an `id` may not change, because a transcript issued in 2027
cites it.

Both language editions are authoritative. A regulation a learner cannot
read is not a published regulation, and most of this College's learners
read Arabic first — which is why every rule in the instrument carries
its label in both editions and why the numbers live in one file that
both editions read from.

---

## Appendix — worked examples

**A. An ordinary pass.**
Module marks average 74.00; examination 76.00.
Level mark = (76.00 × 0.60) + (74.00 × 0.40) = **75.20** → band B.
All four skill marks are at or above 60.00, all six gates hold.
**Pass**, grade point **3.00**.

**B. A floor demotes a classification.**
Examination 92.00; coursework mean 86.00.
Level mark = 55.20 + 34.40 = **89.60** → Distinction band on the mark
alone. But the Speaking skill mark is 78.00, below the Distinction floor
of 80.00.
Highest honour whose overall threshold *and* floor both hold:
**Merit**, grade point **3.30**.

**C. A gate refuses.**
Examination 68.00; coursework mean 95.00.
Level mark = 40.80 + 38.00 = **78.80** — a B on the mark.
The examination gate requires 70.00. **Not conferred.** No grade point,
nothing averaged in as a zero, and the learner moves to **Under Review**
on the failed-examination trigger, which obliges the College to offer a
tutorial within ten working days.

**D. A cumulative average.**
Awards held: Level I at Merit (3.30), Level II at Pass (3.00),
Level III at Distinction (3.70); 20 credits each.
CGPA = (20 × 3.30 + 20 × 3.00 + 20 × 3.70) ÷ 60 = 200 ÷ 60 = **3.33**.
Credits held: **60**, not 120.

**E. A capped examination resit.**
Level examination failed at 64.00, resat after 21 days on a fresh task
and passed at 88.00. Coursework mean 95.00.
The counting examination mark is **70.00** (capped).
Level mark = 42.00 + 38.00 = **80.00** — Merit on the arithmetic.
The level-examination cap applies: the level classifies at **Pass**,
grade point **3.00**. The 88.00 achieved is recorded in full on the
assessment record; the honour reflects performance at the standard the
first time it was met.
