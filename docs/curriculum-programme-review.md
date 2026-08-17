# AIPC — Academic Review of the Completed Six-Level Curriculum

*Programme-wide evaluation, conducted on completion of Level VI. The
figures throughout sections 1-6 are those measured AT THE TIME OF THE
REVIEW — 60 modules, 294 learning items, 642 quiz questions — and are
deliberately left unchanged so the findings can be read against the
state that produced them. Section 6a records what each finding became
and gives the current v1.0 measurement (414 items, 900 questions).*

---

## 1. Scope, and how this review was conducted

This is a review of the **whole programme as a system**, not a
re-reading of each module. It asks the five questions the review brief
set: sequencing, unnecessary repetition, curriculum gaps, assessment
enhancements, and opportunities to strengthen learner outcomes.

**Method, stated plainly, because it determines how much the findings
are worth.** Every quantitative claim below was produced by querying
the *actual seeded curriculum* — the six `sql/seed-curriculum-level-N.
sql` files loaded into a real SQLite database against the production
`sql/schema.sql`, then counted. No claim in this document is an
impression of what the curriculum probably contains. Where a finding
is a matter of academic judgement rather than measurement, it is
marked as such.

Two consequences of that method are worth stating up front. First,
**several findings below contradict what the project's own
documentation currently says.** Those are the most valuable findings in
the review, and they are reported rather than quietly corrected.
Second, the review found no fabricated, padded, or placeholder content
anywhere in the 60 modules — every learning item contains genuine
authored material, and every one of the 642 quiz questions has a real
answer key that the test suite verifies by submitting it.

---

## 2. The programme in numbers (measured)

| | I (A1) | II (A2) | III (B1) | IV (B2) | V (C1) | VI (C2) | Total |
|---|---|---|---|---|---|---|---|
| Modules | 10 | 10 | 10 | 10 | 10 | 10 | **60** |
| Learning items | 49 | 49 | 49 | 49 | 49 | 49 | **294** |
| Quizzes | 10 | 10 | 10 | 10 | 10 | 10 | **60** |
| Quiz questions | **92** | 110 | 110 | 110 | 110 | 110 | **642** |
| Rubric-graded assignments | 10 | 10 | 10 | 10 | 10 | 10 | **60** |
| Test assertions | **90** | 84 | 84 | 84 | 84 | 84 | **510** |

Level I's sweep is split across two files —
`tests/curriculum-level-1.test.mjs` (14 assertions, the original deep
Module 1 test written when Level I Module 1 was the worked example)
and `tests/curriculum-level-1-complete.test.mjs` (76, the full-level
sweep). Levels II-VI each use a single file. Consolidating Level I's
two files would make the six sweeps directly comparable; it is
cosmetic and is not listed as a finding.

Structural uniformity across levels is genuinely high: every level is
9 content modules (5 learning items each: overview, two lessons, quiz,
assignment) plus a Module 10 (4 items: revision guide, revision
lesson, 20-question exam, comprehensive assessment). The one number
out of family is Level I's question count, addressed in Finding 2.

Whole-suite state at the time of review: **693 functional assertions,
0 failures, 50 files import-checked cleanly** (`node
--experimental-sqlite tests/run.mjs`).

---

## 3. What the programme does well

These are stated briefly, because the useful part of a review is the
criticism — but a review that lists only faults misrepresents the
object.

**The intellectual spine is real and it escalates.** Each level from
III onwards introduces a discipline that is not a language point and
cannot be faked: Level IV's evidence-before-conclusion, Level V's
synthesis across conflicting sources, Level VI's nine domain
disciplines (position vs. interest; criteria before conclusion;
steelman before critique; "what would have to be true?"; claim
calibration; naming the frame). These are the reason the upper levels
read as an education rather than a syllabus.

**Genre coverage is genuinely broad and non-repeating.** Across Levels
IV-VI, roughly thirty distinct written genres and speaking formats are
each taught once, in the domain where they actually occur. A learner
completing the programme has written a literature review, a policy
brief, a grant proposal, an op-ed to a strict word count, a research
paper with a limitations section, and a conference paper — and has
defended work orally under questioning.

**The BrE/AmE strand is unusually good and gets sharper with level.**
It is present in 73 learning items and, from Level III onward, focuses
on differences that change *meaning* rather than spelling: `table` a
motion (a complete reversal between varieties), `turnover`, `scheme`,
collective-noun agreement, quotation punctuation. Very few programmes
teach the ones that cause actual professional accidents.

**No speculative platform work was done.** All six levels were
delivered on the Milestone 1 schema without a single new table,
column, or endpoint. That is the strongest available evidence that
the "curriculum drives platform" principle was applied honestly rather
than recited.

---

## 4. Findings

Findings are numbered, each with its evidence and its recommended
action. Priority: **P1** = fix before the programme is presented as
complete to an academic audience; **P2** = fix in the next curriculum
cycle; **P3** = worth doing, not urgent.

---

### Finding 1 (P1) — Listening and pronunciation are taught in every lesson and assessed almost nowhere

**Evidence.** All 114 lesson items contain a `LISTENING ACTIVITY` and
a `PRONUNCIATION PRACTICE` element — coverage is 114/114 for both. But:

- The `learning_items.kind` column supports `video` and
  `live_session`. Measured usage across the whole programme: **174
  `reading`, 60 `quiz`, 60 `assignment`, 0 `video`, 0 `live_session`.**
  No audio or video asset is attached to any listening activity
  anywhere in the six levels. Every listening task exists only as a
  prose instruction to an instructor.
- Of 642 quiz questions, **2 reference listening and 0 reference
  pronunciation, stress, or intonation.**
- Of 60 assignments, exactly one per level names listening as an
  assessed component — and Level VI names it in none.

**Assessment.** This is the programme's single most significant gap,
and it is a gap between *design* and *delivery* rather than a design
flaw: the curriculum specifies the listening and pronunciation work
carefully and consistently, and then has nowhere to put the audio. The
practical consequence is that a learner studying without an instructor
receives a reading-and-writing course with listening described to
them. For an institution that assesses speaking in 9 of 10 Level VI
assignments, that asymmetry is indefensible.

**Recommendation.** This is the one place in the whole programme where
curriculum work has *earned* a new platform capability under the
"curriculum drives platform" rule — the curriculum exists, it is
complete, and it demands this. Two capabilities, in order:

1. **An audio-bearing learning item** — either activating the existing
   `video` kind with an audio-only variant or adding an `audio` kind,
   with a transcript field. 114 listening activities are already
   written and specify exactly what each recording must contain.
2. **A listening-comprehension question type** — questions bound to an
   audio item rather than to prose. The existing `quiz_questions`
   model needs only an optional media reference.

Until those exist, the honest public statement is that listening and
pronunciation are **instructor-delivered components**, not
self-study ones. That sentence should appear in the prospectus.

---

### Finding 2 (P2) — Level I is out of family on two measures

**Evidence.**

- **Quiz length.** Level I carries 92 questions where every other
  level carries 110. Measured per module: Level I Modules 1-9 have
  **8 questions each**; Levels II-VI Modules 1-9 have 10 each. All six
  Module 10 exams have 20.
- **Critical thinking.** The standard lesson template names a
  `CRITICAL THINKING / DISCUSSION PROMPT` element. It is present in
  94 of 114 lesson items. The 20 absences are **all 18 Level I
  lessons, Level I's Module 10 revision lesson, and one Level II
  lesson** (`itm_l2_m2_lesson2`).

**Assessment.** Level I was authored first, before the per-module
standard settled, and was never retrofitted. The 8-vs-10 gap is
cosmetic in isolation but visible on any comparison table an
institution publishes. The critical-thinking absence is more
interesting: at A1 an abstract discussion prompt genuinely is not
appropriate, so its absence from Level I may be *correct* — but that
is not what the framework says, and an element that is "required
except where it isn't" is not a template.

**Recommendation.** (a) Add 2 questions to each of Level I Modules
1-9, bringing the level to 110 and the programme to 660. (b) Either
add an A1-appropriate thinking prompt to Level I lessons — at A1 this
means a choice between two pictures or a one-word judgement, not a
discussion — **or** amend the framework to state explicitly that the
critical-thinking element begins at Level II and say why. Either is
defensible; the current silent divergence is not. (c) Add the missing
prompt to `itm_l2_m2_lesson2`, which is a straightforward omission.

---

### Finding 3 (P1) — The rubric model is undocumented, and two levels break their own signature criterion

> **Correction notice.** This finding was substantially rewritten after
> its first publication. The original version was produced by a regex
> that excluded parenthesised text, and it therefore silently dropped
> any criterion written as `Communicative quality (new emphasis at
> this level) --`. Three claims in the original were wrong and are
> withdrawn: that Level II Module 1 carries only three criteria (it
> carries four); that the six Module 10 assessments lack rubric
> criteria (they carry the *most* criteria in the programme — up to
> eight — and are the one place where cumulativity is fully
> implemented); and that Level III Module 9's `fluency and delivery`
> is a naming error (it is a legitimate spoken-assessment criterion
> also used by all six end-of-level examinations). The re-measurement
> and the corrected findings are below. The original overstated the
> disorder; the real defects are narrower and sharper.

**Evidence.** All 60 assignment bodies were re-parsed with a parser
that tolerates parentheses and reads the numbered criterion list in
order. Seventeen distinct criterion names are in use. Consolidated:

| Criterion | L1 | L2 | L3 | L4 | L5 | L6 |
|---|---|---|---|---|---|---|
| Grammatical accuracy *(exams: "grammatical range and accuracy")* | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| Vocabulary range | **9/10** | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| Task completion | **9/10** | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| Communicative quality | — | 10/10 | 8/10 | 3/10 | 0/10 | 0/10 |
| Discourse coherence & register | — | — | 10/10 | 10/10 | 10/10 | 10/10 |
| Evidence & argument quality | — | — | — | **7/10** | **6/10** | **0/10** |
| Rhetorical effectiveness | — | — | — | — | **5/10** | 5/10 |
| Independent judgement | — | — | — | — | — | 10/10 |

The core three are close to universal: grammatical accuracy 60/60,
vocabulary range 59/60, task completion 59/60 — the single exception
in each case being Level I Module 1, discussed below. The structure is
far more orderly than first reported: Level II is fully conformant,
and every end-of-level examination carries the full cumulative set for
its level (Level IV's exam carries 7 criteria, Level V's 8).

**The three genuine defects that remain:**

1. **Level IV breaks its own signature criterion.** `Evidence &
   argument quality` is the criterion Level IV exists to introduce,
   and Modules 1, 3 and 8 do not use it — they use `communicative
   quality` in that slot instead. 7 of 10 is not a level criterion.
2. **Level V breaks its own signature criterion, more severely.**
   `Rhetorical effectiveness` — the criterion that defines C1 in this
   model — appears in only Modules 1, 3, 6, 9 and the exam. Five of
   the nine content modules never assess it.
3. **Level VI never assesses `evidence & argument quality` at all —
   including in its Mastery Examination.** Levels IV and V both carry
   it into their end-of-level exams; Level VI does not. This is the
   one place where cumulativity genuinely breaks, and it breaks at the
   top of the programme, on the criterion a C2 level can least afford
   to drop. `docs/curriculum-level-6-mastery.md` states that Level VI
   rubrics keep it, so the documentation is wrong about its own level.

Two lesser items: `communicative quality` decays from 10/10 at Level
II to zero after Level IV without being formally retired; and Level
I's fourth slot carries **five different names for one idea**
(`clarity`, `coherence`, `logical coherence`, `delivery & politeness`,
plus Module 1's outlier set of `content completeness` /
`pronunciation & intelligibility` / `delivery`, which is the only
assignment in the programme lacking `vocabulary range` and `task
completion`).

**Assessment.** Rotating a genre-sensitive criterion is *good
pedagogy* — grading a boardroom presentation on evidence quality and
an op-ed on rhetorical effectiveness is more honest than applying one
uniform seven-criterion rubric to everything. The defect is not the
rotation. It is that (a) the rotation was never written down, so it
reads as inconsistency rather than design; and (b) it was allowed to
rotate the **level's own signature criterion** out of half that
level's assignments, which is a different and more serious thing.

**Recommendation.** Publish the model, then conform to it. The model
the content already nearly implements, made explicit:

- **Core (3, mandatory, every assignment at every level):**
  grammatical accuracy; vocabulary range; task completion.
- **Level signature (1, mandatory on every assignment of its level):**
  clarity & intelligibility (I); communicative quality (II); discourse
  coherence & register (III); evidence & argument quality (IV);
  rhetorical effectiveness (V); independent judgement (VI).
- **Genre-selected (0-2, chosen for the task from the declared
  pool):** any earlier signature, plus `fluency and delivery` and
  `coherence` for spoken work.
- **End-of-level examination (Module 10):** carries the full
  cumulative set for its level. This is the guarantee that no learner
  completes a level without every inherited criterion having been
  assessed at least once.

Corrective work under that policy is bounded and specific: add
`evidence & argument quality` to Level IV Modules 1, 3, 8; add
`rhetorical effectiveness` to Level V Modules 2, 4, 5, 7, 8; add
`evidence & argument quality` to Level VI's Mastery Examination;
normalise Level I's fourth criterion to one declared name across all
ten assignments; and formally retire `communicative quality` at Level
V with a stated reason. Eighteen assignment edits in total.

---

### Finding 4 (P2) — Rubric headings are not machine-readable

**Evidence.** 54 of 60 assignments introduce their rubric with the
exact string `GRADING RUBRIC:`. The other six do not: Level I Module 1
uses `RUBRIC (for the instructor):`; the Module 10 comprehensive
assessments for Levels I-III use `RUBRIC (weighted toward listening
and speaking…)`; Levels IV and V Module 10 use `RUBRIC-GRADED
ESSAY`/`RUBRIC-GRADED EXTENDED PIECE`.

**Assessment.** Invisible to a human reader, fatal to a parser. The
next major platform investment named in `docs/lms-architecture.md` is
staff rubric-grading tooling, which will need to extract criteria from
these bodies. Six exceptions out of sixty means any extraction written
against the majority pattern silently drops the six most important
assessments in the programme — the end-of-level examinations.

**Recommendation.** Normalise every rubric to open with `GRADING
RUBRIC:` and move the descriptive qualifier after it (`GRADING RUBRIC
(weighted toward listening and speaking, per the Foundation-level
assessment strategy):`). Purely mechanical; do it before the grading
UI is built, not after.

---

### Finding 5 (P2) — The lexical strand begins abruptly at Level III

**Evidence.** *Phrasal verbs*, *collocations*, and *discourse markers*
are each named, taught strands in **10 of 10 modules at Levels III, IV
and V, and 9 of 10 at Level VI** (Module 10 revises rather than
introduces). At **Levels I and II they appear in 0 of 10 modules.**

**Assessment.** Deferring *phrasal verbs* to B1 is a defensible
decision — they are idiomatic, opaque, and A1/A2 learners have more
urgent needs. Deferring **collocation** to B1 is not. An A2 learner is
already producing *do a mistake* and *say me the answer*, and
collocation is the single most efficient corrective available at that
level. The current design lets two full levels of collocation errors
fossilise and then addresses them from Level III as if new.

**Recommendation.** Introduce a light collocation strand at Level II —
3-5 high-frequency items per module (*make a mistake*, *do homework*,
*heavy rain*, *catch a bus*, *take a photo*) — without importing the
full three-part lexical apparatus. Leave Level I as it is; at A1 the
vocabulary itself is the work. This is a genuine learner-outcome
improvement, not a symmetry exercise.

---

### Finding 6 (P3) — Recurrence across levels is spiral, not repetitive — with one naming defect

The brief asked specifically about unnecessary repetition. The honest
answer is that there is very little, and this section reports that
rather than manufacturing findings.

**Evidence — the six recurring themes, and what changes at each
return:**

| Theme | Appearances | What escalates |
|---|---|---|
| Work | L2.M3 *Work & Study* → L3.M3 *Work, Careers & Entrepreneurship* → L4.M3 *The World of Work* | describing a job → planning a career and pitching a venture → workplace communication and register |
| Media | L3.M6 *Technology & Media* → L4.M7 *Media Literacy & Critical Reading* → L5.M6 *Advanced Media & Discourse Analysis* → L6.M7 *Media & Public Communication* | comprehending media → detecting bias → analysing discourse → **producing** it under hostile questioning |
| Health | L1.M9 *Health & Feelings* → L2.M7 *Food, Health & Habits* → L3.M7 *Health, Body & Mind* | naming symptoms → describing habits → discussing wellbeing and evidence |
| Travel | L2.M2 *Travel & Transport* → L3.M8 *Travel & Culture* | transactional travel → intercultural interpretation |
| Ethics & global issues | L3.M5 → L4.M5, L4.M6 → L6.M9, L6.M10 | opinion → evidence-based position → framed moral reasoning and capstone |
| Academic writing | L4.M2 → L4.M9 → L5.M2 | structure → sourced argument → literature review |

Each return raises the cognitive demand rather than recycling the
vocabulary. That is textbook spiral design and it should be preserved,
not "de-duplicated".

**The one genuine defect: Level I Module 7 is titled `Past Experiences
I`, and no `Past Experiences II` exists anywhere in the 60 modules.**
The numeral promises a sequel that was never written. (Its actual
continuations are Level II's *Life Stories* and *Telling Stories*,
which is fine — but a learner reading the module list sees a dangling
part one.)

**Recommendation.** Retitle Level I Module 7 to `Past Experiences`, or
retitle Level II Module 9 *Telling Stories* to make the pairing
explicit. A five-minute fix that removes a visible loose end from the
programme's public module list.

---

### Finding 7 (P2) — Only one level has an entry diagnostic, and it is the one that needs it least

**Evidence.** Level VI opens with Module 1 *Mastery Diagnostic &
Executive Leadership*, which produces a personal focus plan that
Module 10's reflective analysis revisits. **No other level has an
entry diagnostic.** The framework specifies a single placement test
taken once, pre-Level I (`docs/curriculum-framework.md` § Assessment
design principles), and nothing thereafter until C2.

**Assessment.** The diagnostic-and-revisit loop is one of the best
structural ideas in the programme, and it is deployed at the level
where learners are most able to self-assess without help. The place it
would do most work is **Level IV**. The B1→B2 transition is the
largest genuine step in the whole sequence — it is where learners stop
communicating and start arguing, and where a learner who is
comfortable in B1 conversation can be badly unprepared for evidence-
based writing. A learner arriving at Level IV with an unexamined B1
habit set will spend three modules discovering it.

**Recommendation.** Extend Module 1 of **Level IV** with a diagnostic
component on the Level VI pattern — a short four-skills self-audit
producing a written focus plan, revisited in Module 10's review. This
requires no new platform capability (it is prose plus a rubric-graded
assignment, exactly like Level VI's) and it is the single highest-
value learner-outcome change in this review after Finding 1. Consider
the same for Level II thereafter.

---

### Finding 8 (P3) — The productive-skills split is not consistently declared

**Evidence.** Level VI assignments name a speaking component in 9 of
10 and a writing component in 9 of 10. Level V: 6 and 9. Level IV: 3
and 8. Level II: 1 and 1. Level I: 2 and 1.

**Assessment.** The lower-level assignments *do* assess both skills —
reading their instructions confirms it — but they describe the task
rather than labelling its parts (`Record yourself introducing…` rather
than `PART B (speaking)`). The explicit `PART A (writing) / PART B
(speaking)` convention emerges around Level IV and is universal by
Level VI. The cost is not pedagogical; it is that per-skill progress
reporting — which the framework's own progression principle demands
("a learner strong in writing but weak in speaking should be told
specifically what to revise, not given a single opaque number") —
cannot be produced from Levels I-III as currently written.

**Recommendation.** Retrofit the `PART A / PART B` labelling to Levels
I-III assignments. No content changes, and it makes the framework's
stated per-component progression requirement actually implementable.

---

### Finding 9 (P2) — Assessment is comprehensive but has no stated failure path at module level

**Evidence.** `docs/curriculum-framework.md` states that a learner who
does not pass "repeats the relevant modules, not the whole level from
zero", and `functions/_lib/lms/content.js` handles quiz retakes
correctly (a later failing retake never downgrades a unit already
marked `completed` — verified by the test suite). But **no module
document states what a learner who fails its assignment does next**,
and `submitAssignment()` inserts a new submission row without
reference to any prior attempt, so resubmission works mechanically but
is unbounded and unrecorded as a resit.

**Assessment.** The mechanism is sound; the academic policy on top of
it does not exist. For quizzes this is tolerable — they are formative.
For the six end-of-level examinations and the Level VI capstone it is
not: an institution cannot award a level without a published rule on
resits.

**Recommendation.** This requires an **academic-policy decision, not
an authoring decision**, and it is flagged here rather than invented:
how many resit attempts per assignment; whether a resit grade is
capped; whether the six end-of-level examinations follow the same rule
as module assignments; and whether the Level VI capstone can be
resubmitted at all. Once decided, it is a short section in the
framework plus a line in each Module 10 assessment.

---

## 5. Recommendations, consolidated and prioritised

| # | Action | Priority | Nature |
|---|---|---|---|
| 1 | Build an audio-bearing item kind + listening question type; until then, state publicly that listening/pronunciation are instructor-delivered | P1 | Platform + prospectus |
| 2 | Publish a three-tier rubric policy and normalise all 60 assignments to it; add `evidence & argument quality` to Level VI | P1 | Curriculum |
| 3 | Normalise all rubric headings to `GRADING RUBRIC:` before the grading UI is built | P2 | Mechanical |
| 4 | Add an entry diagnostic to Level IV Module 1, revisited in Module 10 | P2 | Curriculum |
| 5 | Introduce a light collocation strand at Level II | P2 | Curriculum |
| 6 | Decide and publish the resit policy | P2 | **Academic-policy decision required** |
| 7 | Bring Level I to 110 questions; resolve the critical-thinking element's status | P2 | Curriculum |
| 8 | Retrofit `PART A / PART B` skill labelling to Levels I-III | P3 | Mechanical |
| 9 | Retitle `Past Experiences I` | P3 | Mechanical |

Items 3, 8 and 9 are mechanical and could be executed immediately.
Items 2, 5 and 7 are authoring work of roughly a level-module's
weight each. Item 1 is the only one requiring new platform
engineering, and it is the one the curriculum has genuinely earned.
Item 6 is not mine to decide.

---

## 6. Overall assessment

**Is the programme publication-quality?** In content, yes. Sixty
modules of genuinely authored material with no padding, an
intellectual spine that escalates credibly from survival English to
scholarly and executive communication, roughly thirty distinct genres
and formats each taught where it actually occurs, and a
BrE/AmE strand sharper than most published courses. Every module is
verified end-to-end against the live LMS by an automated suite that
submits real answer keys rather than asserting they exist.

**Is it internally consistent?** Not yet, in one respect that
matters. Finding 3 shows a stated assessment policy that the content
does not implement, including one level whose index document describes
a criterion the level does not use. That is the gap between "a very
good curriculum" and "a curriculum an external reviewer cannot fault",
and it is entirely fixable with the rubric-policy work in
Recommendation 2.

**Is it ready to support a premium international English language
institution?** With Recommendations 1 and 2 completed, yes — with the
caveat that Recommendation 1 is not a small piece of work, and that
until it is done the institution should describe listening and
pronunciation honestly as instructor-delivered rather than implying
self-study coverage the platform does not yet provide.

**The one thing this review cannot assess.** Whether the curriculum
*teaches* — whether learners who complete Level VI can in fact do what
Level VI claims. Nothing in a document review or a test suite can
establish that; only cohorts can. The programme is, however, unusually
well set up to find out: every module states its objectives concretely
enough to be measured against, and the Level VI reflective analysis
asks graduates to report their own remaining limitations, which is the
beginning of the evidence base a serious institution would want.

---

## 6a. Post-review resolution — Academic Edition v1.0

Every finding above has been resolved and, where it can be, mechanically
enforced. Re-measured after the work:

| Finding | Resolution | Enforced by |
|---|---|---|
| 1 — listening/pronunciation unassessed | Audio layer built (5 tables); 60 listening scripts, 497 cues, 240 cue-anchored questions, 180 pronunciation targets; Listening Lab and instructor review workspace shipped | `curriculum-consistency` + `browser/listening-lab` |
| 2 — Level I out of family | 18 questions authored (every level now 110); critical-thinking element added to all 18 Level I lessons | consistency rules 7 and 12 |
| 3 — rubric model undocumented | Rubric policy published as normative; 21 rubric blocks normalised | consistency rules 1-6 |
| 4 — rubric headings | Found to be overstated: all 60 already open `GRADING RUBRIC`; six carry a parenthetical the policy now permits | consistency rule 1 |
| 5 — lexical strand starts at Level III | Collocations added to all 20 Level I-II modules | consistency rule 11d |
| 6 — dangling "Past Experiences I" | Retitled; a sibling-series rule added | consistency rule 11d |
| 7 — diagnostics only at Level VI | Entry diagnostics added at Levels III and IV, both revisited in Module 10 | consistency rule 11d |
| 8 — skill split not declared | Partly addressed: the audio strand makes listening and speaking explicit item kinds. Levels I-III assignment part-labelling is **still outstanding** | — |
| 9 — no stated resit policy | **Still outstanding** — an academic-policy decision, not an authoring one | — |

**Two defects found during the work that were not in the original
review, both by measurement rather than reading:**

- **Answer-key position bias.** 66% of all correct answers sat at
  position (b); one quiz had all ten there. A learner choosing (b) every
  time passed several modules without reading the questions. All
  questions were permuted to a balanced distribution and two rules now
  hold it.
- **The same defect, reintroduced.** The 240 listening questions
  authored later reached **81% at (b)**, and the balance rule did not
  catch it because the rule was scoped to `kind='quiz'` while listening
  questions live on `kind='listening'` items. Caught by the final v1.0
  sweep. Rebalanced to 60/60/60/60, and the rule widened to every
  question-bearing item. The lesson is recorded here because it is the
  more instructive of the two: a rule that does not cover everything it
  claims to is worse than no rule, because it is trusted.

**Final v1.0 measurement:** 6 levels, 60 modules, 414 learning items
(174 reading, 60 listening, 60 pronunciation, 60 quiz, 60 assignment),
900 quiz questions (660 module + 240 listening), 120 audio assets, 497
transcript cues, 180 pronunciation targets, ~95,000 authored words.
Answer distribution 24.4 / 25.6 / 24.8 / 25.2 per cent. Zero recordings
produced — the one remaining content gap, and a studio task.

---

## 7. Verification appendix

Every quantitative claim in this document was produced by loading
`sql/schema.sql` plus all six `sql/seed-curriculum-level-N.sql` files
into an in-memory SQLite database and querying it. The claims and
their sources:

| Claim | Source |
|---|---|
| 60 units / 294 items / 642 questions / 60 quizzes / 60 assignments | `COUNT(*)` on `units`, `learning_items`, `quiz_questions` |
| Per-level question counts (92 / 110 ×5) | `quiz_questions` joined through `learning_items` to `units`, grouped by `course_id` |
| Level I is 8 questions per module | same, grouped by `units.sequence` within `crs_level_1` |
| Item kinds used: 174 reading, 60 quiz, 60 assignment, 0 video, 0 live_session | `GROUP BY kind` on `learning_items` |
| Template element coverage across 114 lesson items | substring scan of `learning_items.body` for each named element |
| Rubric criteria per assignment | regex extraction of `(n) Criterion --` from the `GRADING RUBRIC:` block of all 60 assignment bodies |
| Six assignments with non-standard rubric headings | inverse of the same extraction |
| 2 listening / 0 pronunciation quiz questions | `LIKE` scan of `quiz_questions.prompt` |
| Lexical strand coverage (phrasal verb / collocation / discourse marker) | distinct-unit count of `learning_items.body` matches per level |
| BrE/AmE coverage: 73 items | `LIKE` scan for `BrE` / `British` |
| 693 assertions, 0 failures, 50 files import-checked | `node --experimental-sqlite tests/run.mjs` |

Re-running any of these against a future state of the seed files will
show whether the recommendations above have been carried out.
