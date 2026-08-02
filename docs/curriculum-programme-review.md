# WEC-LC — Academic Review of the Completed Six-Level Curriculum

*Programme-wide evaluation, conducted on completion of Level VI. Covers
Levels I-VI (CEFR A1-C2): 60 modules, 294 learning items, 642 quiz
questions, 60 rubric-graded assignments.*

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

### Finding 3 (P1) — Rubrics are not cumulative in practice, though the documentation says they are

This is the most substantial academic finding in the review.

**Evidence.** Every assignment's rubric criteria were extracted and
counted across all 60 assignments. The stated policy — repeated in
each level's index document — is that each level *keeps* the previous
levels' criteria and *adds* one. The measured reality is that rubrics
hold at **3 constant criteria plus 1-2 level-specific ones**, with the
fourth slot **rotating module by module**:

| Criterion | L1 | L2 | L3 | L4 | L5 | L6 |
|---|---|---|---|---|---|---|
| Grammatical accuracy | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 | 10/10 |
| Vocabulary range | 9/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| Task completion | 9/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| Communicative quality | — | 8/10 | 8/10 | 3/10 | 0/10 | 0/10 |
| Discourse coherence & register | — | — | 9/10 | 9/10 | 9/10 | 10/10 |
| Evidence & argument quality | — | — | — | 6/10 | 5/10 | **0/10** |
| Rhetorical effectiveness | — | — | — | — | 4/10 | 5/10 |
| Independent judgement | — | — | — | — | — | 10/10 |

*(Counts below 10 in the top three rows are Module 10 assessments,
which use a different rubric heading — see Finding 4 — not missing
criteria.)*

Five specific defects follow from this:

1. **`Evidence & argument quality` appears in zero Level VI
   assignments**, while `docs/curriculum-level-6-mastery.md` states
   that Level VI rubrics "keep Level V's *evidence & argument
   quality*… criteria". The documentation is simply wrong about the
   content it describes. At C2 — where the whole level rests on
   claim calibration and warrant — this is the criterion least
   defensible to drop.
2. **`Rhetorical effectiveness` is applied unevenly within a level.**
   Level V applies it in 4 of 10 assignments (Modules 1, 3, 6, 9);
   Level VI in 5 (Modules 6-10). Level VI Modules 1-5 therefore carry
   5 rubric criteria and Modules 6-10 carry 6.
3. **`Communicative quality` decays without ever being formally
   retired** — 8/10 at Level II, 8/10 at Level III, 3/10 at Level IV,
   absent thereafter. Superseding it is reasonable; doing so silently
   is not.
4. **Level II Module 1's rubric has only three criteria**, because it
   was authored before `communicative quality` was introduced at
   Module 2. The level's first assignment is graded on a different
   basis from its other eight.
5. **Naming is inconsistent.** Level III Module 9 uses `Fluency and
   delivery` where the rest of the level uses `Communicative
   quality`. Level I's fourth criterion appears under four different
   names across nine assignments — `Clarity`, `Coherence`, `Logical
   coherence`, and `Delivery & politeness`.

**Assessment.** Rotating the genre-sensitive criterion is *good
pedagogy* — grading a boardroom presentation on "evidence quality" and
an op-ed on "rhetorical effectiveness" is more honest than applying a
seven-criterion rubric uniformly to everything. The defect is not the
rotation; it is that the rotation is undocumented, that it is
described as its opposite, and that it lets a level's **signature**
criterion apply to only half the level. A criterion a prospectus names
as defining a level must apply to every assignment at that level, or
it is not a level criterion.

**Recommendation.** Publish an explicit **rubric policy** in
`docs/curriculum-framework.md` with three tiers, then normalise the 60
assignments against it:

- **Core (mandatory, every assignment, every level):** grammatical
  accuracy, vocabulary range, task completion.
- **Level signature (mandatory across the whole level that introduces
  it, and every level above):** communicative quality (II), discourse
  coherence & register (III), evidence & argument quality (IV),
  rhetorical effectiveness (V), independent judgement (VI).
- **Genre-selected (1 per assignment, chosen for the task):** drawn
  from the same pool, applied where the genre makes it meaningful.

Under that policy the concrete corrective work is: add `evidence &
argument quality` to all 10 Level VI assignments and the 4 Level V
ones lacking it; extend `rhetorical effectiveness` to Level VI
Modules 1-5; retire `communicative quality` explicitly at Level IV
with a stated reason; normalise Level I's fourth criterion to one
name; and bring Level II Module 1 into line with its level.

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
