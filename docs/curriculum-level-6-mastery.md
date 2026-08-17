# AIPC — Level VI: English Mastery Programme (C2) — Full Curriculum

*Companion to `docs/curriculum-framework.md` (see its Level VI section
for the module map, the recorded re-theming decision, and the
Executive Academic Objective this build implements) and
`docs/curriculum-level-5-advanced.md` (Level V, the process this level
concludes). Written to your standing instruction that this level is
"not simply another language level — it is the capstone of the AIPC
academic journey," and should represent **mastery, not merely
proficiency**. See § What's different from Level V below for exactly
how this build answers that.*

---

## What's different from Level V, and why

Level V moved learners from language competence into intellectual
communication across ten advanced genres. Level VI is a different kind
of level again — the programme's terminal, capstone stage. Concretely:

- **Organised by professional domain, not communication mode.** Every
  previous level organised around a skill or language system. Level VI
  organises around ten professional *fields* — executive leadership,
  diplomacy, business strategy, public policy, law, innovation, media,
  scholarship, ethics, and global development. At mastery level the
  domain **is** the difficulty: register control is only demonstrable
  inside a real professional field, not in the abstract. (This is a
  recorded revision to the framework's original Level VI draft — see
  `docs/curriculum-framework.md`'s Level VI section for the reasoning.)
- **Grammar instruction is no longer new-item acquisition.** The
  learner already commands the system. Each module instead isolates
  one *rare, high-register, or precision* construction that its domain
  genuinely demands — the subjunctive in formal leadership
  resolutions, extreme-formality hedging in diplomatic drafting, legal
  conditionals in statutory reasoning — taught as stylistic control,
  not as a new rule to learn.
- **Independent judgement replaces guided evaluation.** Level V asked
  learners to evaluate a text's methodology and evidence against
  taught criteria. Level VI asks them to form and defend an
  independent scholarly or professional judgement — including
  disagreeing, in writing, with a source that is more expert than they
  are, and justifying that disagreement to a standard that survives
  challenge.
- **Ten publication-quality writing genres**, one per module: a
  reflective leadership essay (M1), strategic recommendations (M2), an
  executive report (M3), a policy analysis (M4), a scholarly critique
  (M5), a grant/project proposal (M6), an opinion editorial (M7), a
  research paper (M8), a conference paper (M9), and a professional
  portfolio integrating the level's work (M10).
- **Nine high-level speaking formats**, distributed across the level:
  an executive briefing (M1), a diplomatic negotiation (M2), a
  boardroom presentation (M3), a policy panel (M4), oral defence of a
  complex argument (M5), a keynote address (M6), a media interview and
  crisis leadership statement (M7), a conference presentation (M8), a
  chaired ethical deliberation (M9), and the capstone presentation
  under sustained questioning (M10).
- **A genuine capstone, not a tenth ordinary module.** Module 10
  requires an integrated project, a professional portfolio assembling
  the level's written work, a major presentation with sustained
  questioning, an oral defence, and a reflective analysis of the
  learner's development across all six levels — the programme's
  terminal assessment, and the deliverable a AIPC graduate can show
  an employer or admissions committee.

**Same as Levels I-V, unchanged:** the lesson template's required
elements, the seed-file-into-live-schema pipeline, and full end-to-end
LMS verification for every module. Assignment rubrics keep Level V's
"evidence & argument quality," "rhetorical effectiveness," and
"discourse coherence & register" criteria, and add — where the genre
demands it — **independent judgement** (does the writer form and
defend a genuinely original position, rather than competently
summarising others'?) as a named criterion. This is the criterion that
most distinguishes C2 from C1 in AIPC's assessment model.

**On the graduate attributes.** Your directive names eight attributes
every AIPC graduate should demonstrate. Each is assessed somewhere
concrete in this level, not merely aspired to: exceptional written
communication (the ten genres, and the portfolio that collects them);
confident public speaking (the nine speaking formats, culminating in
the capstone presentation); sophisticated critical thinking (the
independent-judgement rubric criterion, from M5 onward); advanced
intercultural communication (M2's diplomatic negotiation, M9's chaired
deliberation); ethical professional judgement (M9 in full, and M7's
crisis-communication honesty standard); academic research skills (M8's
research paper, M5's scholarly critique); executive-level
communication (M1's briefing, M3's boardroom presentation); and
lifelong independent learning (M1's diagnostic-driven personal focus
plan, revisited in M10's six-level reflective analysis).

---

## Level VI module map

| # | Module | Domain focus | Precision/register focus | Writing genre / speaking format | Full module document |
|---|---|---|---|---|---|
| 1 | Mastery Diagnostic & Executive Leadership | Executive leadership | subjunctive mood, high-formal register | reflective leadership essay; executive briefing | *below, in this document* |
| 2 | Diplomacy & International Relations | Diplomacy, IR | diplomatic hedging, extreme-formality drafting | strategic recommendations; diplomatic negotiation | `docs/curriculum/level-6/module-02-diplomacy-international-relations.md` |
| 3 | Global Business Strategy | Multinational strategy | complex inversion and fronting for emphasis | executive report; boardroom presentation | `docs/curriculum/level-6/module-03-global-business-strategy.md` |
| 4 | Public Policy | Government, public sector | modality of obligation and recommendation | policy analysis; policy panel discussion | `docs/curriculum/level-6/module-04-public-policy.md` |
| 5 | Law & Justice | Law, regulation, justice | legal-reasoning precision, defined terms | scholarly critique; oral defence of an argument | `docs/curriculum/level-6/module-05-law-and-justice.md` |
| 6 | Innovation & Emerging Technologies | Technology, R&D | speculative register, technical-to-general translation | grant/project proposal; keynote address | `docs/curriculum/level-6/module-06-innovation-emerging-technologies.md` |
| 7 | Media & Public Communication | Media, public affairs | rhetorical devices at scale, crisis register | opinion editorial; media interview + crisis statement | `docs/curriculum/level-6/module-07-media-public-communication.md` |
| 8 | Research & Scholarship | Academia, research | academic metadiscourse and hedging at publication standard | research paper; conference presentation | `docs/curriculum/level-6/module-08-research-and-scholarship.md` |
| 9 | Ethics & Responsible Leadership | Applied ethics, governance | concessive-conditional and moral-reasoning register | conference paper; chaired ethical deliberation | `docs/curriculum/level-6/module-09-ethics-responsible-leadership.md` |
| 10 | Capstone: Global Challenges & Sustainable Development + Mastery Examination | Global development | integration; self-editing to publication standard | professional portfolio; capstone presentation with oral defence | `docs/curriculum/level-6/module-10-capstone-mastery-examination.md` |

**Status: complete.** All ten Level VI modules are authored, seeded
into the LMS (`sql/seed-curriculum-level-6.sql` — 10 units, 49
learning items, 110 quiz questions), and verified end-to-end by
`tests/curriculum-level-6.test.mjs` (84 assertions, 0 failures). The
sweep does not merely check that rows exist: for every module it
reads the *real seeded* answer key out of the database, submits it
through `submitQuizAttempt()`, and asserts a 100% score and a
completed `unit_progress` row — while separately asserting that
`getUnitDetail()` never exposes `correct_index` to a client. Modules
1-9 carry 5 learning items and a 10-question quiz each; Module 10
carries 4 and a 20-question Mastery Examination, the pattern used by
the tenth module at every level.

**With this level, the six-level AIPC curriculum is complete** —
Levels I-VI, 60 modules, 294 learning items, 60 quizzes, 60
rubric-graded assignments, and 642 authored quiz questions, all
seeded and all verified. (Levels II-VI carry 110 questions each;
Level I carries 92, because its earliest modules were authored to a
lighter quiz pattern before the 10-per-module standard settled — a
genuine inconsistency, recorded rather than glossed over, and
addressed in the review below.) The programme-wide academic
review of the completed curriculum is in
`docs/curriculum-programme-review.md`.

---

## Module 1: Mastery Diagnostic & Executive Leadership — full build

### Module overview

Module 1 does two jobs at once, deliberately. It runs the level's
**entry diagnostic** — a structured self- and instructor-assessment
producing a personal focus plan the learner carries through the level
and revisits in Module 10 — and it opens the domain sequence with
**executive leadership**, the register in which senior professionals
set direction, take responsibility, and account for outcomes.

Its precision focus is the **subjunctive mood** (`It is imperative
that he *be* informed`; `We recommend that the policy *take* effect
immediately`) — a construction most learners recognise but few use
accurately, and one that appears disproportionately in exactly the
formal resolutions, recommendations, and minutes senior leaders write.

**Module learning objectives.** By the end of Module 1, the learner
can: form and use the mandative subjunctive accurately in formal
recommendations and resolutions; deliver a concise executive briefing
to a senior audience; write a reflective leadership essay that
demonstrates genuine self-assessment rather than self-promotion; and
articulate a personal, evidence-based development plan for the level.

**Content map (5 learning items):** module overview & key phrases;
Lesson 1.1 ("It Is Imperative That He *Be* Informed — The Subjunctive
in Executive Register"); Lesson 1.2 ("Leading and Accounting — The
Executive Briefing & Reflective Leadership Writing"); Module 1 Quiz
(10 questions); Module 1 Assignment ("A Reflective Leadership Essay &
Executive Briefing").

---

### Reference reading: Module overview & key phrases

**Key phrases introduced this module:** It is imperative that... — We
recommend that the committee *review*... — I take full
responsibility for... — On reflection, what I would do differently
is... — The decision rests with me. — Let me set out where we stand.

**Discourse markers this module (functional set — accountable
leadership framing):** *I take responsibility for*, *the decision
rests with*, *on reflection*, *what I would do differently is* —
language that assigns ownership explicitly rather than diffusing it.
This is a register with a genuine ethical dimension, not just a
stylistic one: the passive constructions available at earlier levels
(`mistakes were made`) let a speaker describe a failure without owning
it, and this module deliberately teaches the opposite move.

**Phrasal verbs & collocations this module:** *step up* (take on
greater responsibility, especially when it is needed), *carry the can*
(BrE idiom: take the blame, often for others' actions), *set the
direction*, *own the outcome*, *front up (to something)* (face a
difficulty or one's own error openly rather than avoiding it).

**BrE / AmE note:** governance vocabulary diverges in a way that
genuinely matters when reading corporate documents: a British company
has a **board of directors** in which **executive** and
**non-executive directors** sit, and the senior independent figure is
often the **chairman/chair**; American usage more commonly
distinguishes **inside** and **outside directors** and uses
**board member**, with **Chairman of the Board** and **CEO**
sometimes held by the same person — a structure British corporate-
governance convention has generally discouraged. The terms are not
interchangeable across the two systems, so precision here is a
genuine professional-reading skill, not a stylistic preference.

**Key vocabulary previewed:** executive-leadership vocabulary
(mandate, remit, accountability, delegation, succession, stewardship),
reflective-practice vocabulary (self-assessment, blind spot,
development plan, growth edge). Intercultural note: how directly a
leader is expected to claim personal responsibility — versus
attribute outcomes to a team or to circumstance — varies significantly
across professional cultures; this module teaches explicit ownership
as one widely respected international-executive convention, while
naming that its directness is itself culturally situated.

---

### Lesson 1.1 — "It Is Imperative That He *Be* Informed — The Subjunctive in Executive Register"

**Learning objectives.** By the end of this lesson you can: (1) form
the mandative subjunctive correctly after verbs and adjectives of
demand, recommendation, and necessity (`recommend/propose/insist/
require that + base form`; `it is essential/imperative/vital that +
base form`); (2) recognise that the subjunctive form is invariant —
no third-person `-s`, and `be` rather than `is/are`; (3) choose
appropriately between subjunctive and the `should`-alternative
(`We recommend that he be informed` vs. `We recommend that he should
be informed`), knowing which is more formal and which is more common
in British usage; (4) draft a formal recommendation or resolution.

**Prerequisite knowledge.** Level V, Module 3 (inversion for
emphasis) and Module 4 (hedging/qualifying) — the subjunctive belongs
to the same high-formal register those lessons opened.

**Warm-up (5 min).** Instructor writes two versions of one
recommendation on the board — "We recommend that the committee
reviews the policy" and "We recommend that the committee review the
policy" — and asks learners which is correct, before formal
presentation. (Both are used; the point is that the second is the
subjunctive and the more formal, not that the first is an error — a
deliberately non-trivial opening.)

**Presentation (10 min).** Model: "It is imperative that every
director *be* briefed before the vote. The board requires that the
report *be* circulated in advance. We propose that the chair *convene*
an extraordinary meeting." Highlight explicitly: the subjunctive uses
the **base form** regardless of subject — `be`, not `is`; `convene`,
not `convenes`; and its negative is `not + base form` (`We insist
that he *not* attend`), with no auxiliary `do`. Then flag the
register/variety nuance honestly: American English uses the mandative
subjunctive very consistently in formal writing; British English
frequently prefers `should + base form` (`We recommend that the
committee *should* review the policy`), with the bare subjunctive
reading as either very formal or slightly American to some British
readers. Neither is wrong; a mastery-level writer chooses knowingly.

**Guided practice (10 min).** Learners convert 8 `should`-form
recommendations into bare-subjunctive form and identify which of a
further 4 sentences contain a subjunctive error (`It is essential
that he is informed` → `be`).

**Independent practice (10 min).** Learners draft 5 formal
recommendations relating to a real or invented organisational
decision, using the subjunctive accurately, then exchange with a
partner who checks each for the invariant base form and correct
negation.

**Speaking activity.** Learners read their strongest recommendation
aloud in a formal register, and the partner responds in kind — a
brief, deliberately stiff exchange establishing how the register
sounds before Lesson 1.2 makes it fluent.

**Critical thinking / discussion prompt.** "The subjunctive survives
almost exclusively in formal, institutional English — resolutions,
recommendations, legal drafting. Why do you think a construction that
has largely disappeared from everyday speech persists so strongly in
these specific contexts?" — a genuinely scholarly C2 question about
register conservatism in institutional language.

**Listening activity (5 min).** Listen to a formal board-meeting
extract (6-8 sentences) containing several subjunctive constructions
and transcribe the exact verb forms used, noting any `should`-
alternatives.

**Reading activity — extended reading & independent judgement (8
min).** Read a short formal governance document extract (180-200
words) using subjunctive constructions. Answer 2 literal questions and
2 independent-judgement questions ("Does the document's formality
serve its readers, or does it obscure what is actually being
decided? Justify your view with specific reference to the text.").

**Writing task (5 min).** Draft a three-sentence formal resolution
using the subjunctive at least twice.

**Pronunciation practice (5 min).** Drill the slightly marked stress
and pacing of formal subjunctive constructions read aloud ("It is
IMperative that every DIRector be BRIEFED") — the deliberate,
weighted delivery that formal resolutions receive when read into a
meeting record, distinct from ordinary informational speech.

**Vocabulary reinforcement.** An executive-governance vocabulary
matching game (mandate, remit, accountability, delegation, succession,
stewardship) with precise definitions — note that `remit` (BrE, the
scope of one's authority) is itself a register marker worth flagging.

**Formative assessment.** Instructor checks accurate invariant base
forms and correct subjunctive negation during independent practice —
the lesson's core target error.

**Homework.** Learners complete the **Level VI entry diagnostic**: a
structured self-assessment across the eight graduate attributes
(rating current confidence, naming one specific piece of evidence for
each rating), plus two areas they most want to develop this level.
This becomes their personal focus plan, revisited in Module 10.

**Revision.** Lesson 1.2 opens with learners naming one diagnostic
focus area aloud.

**Extension activity.** Stronger learners find (or construct) one
example of the `were`-subjunctive in formal usage (`If this were to
proceed...`) and explain how it differs in function from the mandative
subjunctive taught here.

---

### Lesson 1.2 — "Leading and Accounting — The Executive Briefing & Reflective Leadership Writing"

**Learning objectives.** By the end of this lesson you can: (1)
deliver a concise executive briefing that opens with the decision
required, not the background; (2) assign responsibility explicitly
using accountable-leadership framing; (3) write reflectively about
your own leadership or professional practice without either
self-promotion or performative self-criticism; (4) connect a
reflective insight to a specific, evidenced change in practice.

**Prerequisite knowledge.** Lesson 1.1 (subjunctive, formal
recommendation register); Level V, Module 9 (bottom-line-up-front
structure and the executive briefing — this lesson raises the stakes
from informing to *deciding and owning*).

**Warm-up (5 min).** Instructor delivers two 30-second briefings on
the same invented situation — one that describes a problem, one that
states a decision and asks for a specific authorisation — and asks
learners which one a senior audience would find more useful, before
formal presentation.

**Presentation (10 min).** Model the executive briefing at leadership
level: **the decision required** (`I'm asking the board to approve
X`), **the essential context** (two sentences, no more), **the risk
owned** (`The principal risk is Y; I'm accountable for managing it`),
**the ask** (a specific, time-bound authorisation). Then model
reflective leadership writing, and name its two failure modes
explicitly: **self-promotion disguised as reflection** ("My greatest
weakness is that I care too much about quality") and **performative
self-criticism** (elaborate blame that commits to no change). A
genuine reflective piece names a specific decision, states honestly
what it cost, identifies the reasoning error, and commits to a
concrete different action — modelled aloud in four sentences.

**Guided practice (10 min).** Learners evaluate 6 short reflective
extracts, classifying each as genuine reflection, self-promotion, or
performative self-criticism, and justifying the classification.

**Independent practice (10 min).** Using a real or invented
professional decision, learners draft a four-part reflective paragraph
(decision → cost → reasoning error → concrete change) and a 60-second
executive briefing on a related matter.

**Speaking activity — executive briefing.** Learners deliver the
60-second briefing to a partner or small group acting as a senior
audience, who may interrupt once with a direct challenge to the
learner's ownership of the risk ("Whose responsibility is this if it
fails?") — this lesson's core speaking task and the direct basis for
Module 1's assignment.

**Critical thinking / discussion prompt.** "Is there a real
difference between a leader who takes responsibility and one who
merely *says* they take responsibility? What, specifically, would you
look for as evidence of the first?" — a genuinely searching C2
question, and one that sets the ethical thread this level carries
through to Module 9.

**Listening activity (5 min).** Listen to two executive briefings and
identify which one genuinely owns the risk and which one distributes
it, citing the specific language used.

**Reading activity (5 min).** Read a short published-style reflective
leadership extract and identify its decision, cost, reasoning error,
and committed change — or note precisely which of the four is missing.

**Writing task (5 min).** Expand your reflective paragraph, adding one
sentence that connects the insight explicitly to your Lesson 1.1
diagnostic focus areas.

**Pronunciation practice (5 min).** Drill steady, unhurried delivery
when accepting responsibility aloud — a genuine prosodic skill, since
rushing this language signals discomfort and undercuts the words, while
over-slowing it sounds theatrical.

**Vocabulary reinforcement.** A reflective-practice vocabulary
matching game (self-assessment, blind spot, development plan, growth
edge) plus this module's phrasal-verb set, with attention to which are
register-appropriate in formal written reflection and which are too
idiomatic (`carry the can` is vivid but informal — worth naming).

**Formative assessment.** Instructor checks that reflective writing
reaches a concrete committed change, and that briefings open with the
decision required rather than background.

**Homework.** Learners finalise their reflective leadership essay
draft for Module 1's assignment.

**Revision.** This lesson opens with the diagnostic focus-area recap.
Module 1's Quiz and Assignment draw on both lessons.

**Extension activity.** Stronger learners write a second, contrasting
reflection on a decision that went *well*, identifying what was
genuinely skill and what was genuinely luck — a harder and more
honest analytical task than reflecting on failure.

---

## Module 1 Quiz (auto-graded, 10 questions)

*Seeded verbatim into `quiz_questions` — see
`sql/seed-curriculum-level-6.sql`. Answer key marked with ✓.*

1. "It is imperative that every director ___ briefed before the
   vote." (mandative subjunctive) — (a) is (b) be ✓ (c) will be (d)
   being
2. "The board requires that the report ___ circulated in advance." —
   (a) is (b) be ✓ (c) was (d) has been
3. "We propose that the chair ___ an extraordinary meeting." — (a)
   convenes (b) convene ✓ (c) convened (d) is convening
4. How is the mandative subjunctive negated? — (a) with "doesn't" +
   base form (b) with "not" + base form ✓ (c) with "isn't" (d) it
   cannot be negated
5. Which is the more common British alternative to the bare
   subjunctive in a formal recommendation? — (a) "should" + base form
   ✓ (b) "will" + base form (c) the past simple (d) the present
   continuous
6. In British corporate governance, a director who is not part of the
   company's management team is usually called a: — (a) outside
   director (b) non-executive director ✓ (c) board observer (d)
   silent partner
7. Which opening is most appropriate for an executive briefing to a
   senior audience? — (a) an extended account of the background (b)
   the decision required ✓ (c) an apology for taking their time (d) a
   list of everyone consulted
8. Which of these is genuine reflection rather than self-promotion? —
   (a) "My greatest weakness is that I care too much about quality."
   (b) "I delayed the decision by three weeks because I over-weighted
   one stakeholder's objection; next time I will set a decision
   deadline in advance." ✓ (c) "Everything went well because of my
   leadership." (d) "Mistakes were made by the team."
9. Which phrase means "face a difficulty or one's own error openly"? —
   (a) step up (b) front up to ✓ (c) set the direction (d) own the
   outcome
10. In British usage, "remit" most precisely means: — (a) a payment
    (b) the scope of one's authority or responsibility ✓ (c) a
    reminder (d) a resignation

---

## Module 1 Assignment — "A Reflective Leadership Essay & Executive Briefing"

**Instructions given to the learner:** Complete two parts. **Part A
(writing, this level's first genre): a reflective leadership essay**,
600-750 words, on a real or realistic professional decision you led or
observed closely. It must name the decision, state honestly what it
cost, identify the reasoning error or blind spot involved, and commit
to a specific, concrete change in practice. Include at least 2
accurate mandative subjunctive constructions in any formal
recommendation you make, and at least 2 accountable-leadership framing
phrases from this module. **Part B (speaking): an executive briefing**,
60-90 seconds recorded or delivered live, on a related decision —
opening with the decision required, giving essential context in no
more than two sentences, explicitly owning the principal risk, and
closing with a specific, time-bound ask. Respond to at least one
direct challenge to your ownership of that risk.

**Grading rubric (for the instructor):**
- **Grammatical accuracy** — correct invariant subjunctive forms and
  negation; accurate formal register throughout.
- **Vocabulary range** — at least 4 distinct executive-leadership or
  reflective-practice terms used precisely, plus one phrasal verb/
  collocation from this module used at an appropriate register.
- **Task completion** — decision, cost, reasoning error, and committed
  change all present in Part A; decision-first structure, owned risk,
  and time-bound ask all present in Part B.
- **Independent judgement** *(new at this level)* — does the
  reflection reach a genuinely self-critical insight the writer
  clearly arrived at themselves, rather than a conventional or
  flattering one? Does the committed change follow logically from the
  identified error?
- **Discourse coherence & register** — is the essay's register
  reflective and professional without slipping into either
  self-promotion or performative self-criticism, and does the spoken
  briefing sustain composure under direct challenge?

A grade at or above the platform's pass threshold marks Module 1
completed for the learner.
