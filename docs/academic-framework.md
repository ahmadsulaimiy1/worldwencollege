# The Academic Framework of Worldwide English College

**A proposal of the Academic Senate to the Executive.**

**Status: PROPOSED, NOT ADOPTED.** This is the intended academic
constitution of the College. Where a figure is a design target rather
than a measured fact, it says so. Where a decision belongs to the
Executive, it is listed in §XVIII rather than assumed.

Registered as governance **A6** (framework) with sub-items noted
throughout.

---

## I. The principle the whole framework is built on

**Workload, not content counts.**

Respected institutions describe a qualification by what it asks of a
learner — hours, credit, assessment — not by how many pieces of content
it contains. A content count is unverifiable by the reader, trivially
inflated by whoever writes it, and says nothing about difficulty. An
hours figure is comparable across providers and cannot be padded without
becoming absurd.

This has an immediate consequence the Senate accepts without reservation:
**"720 lessons" is retired as the headline metric.** It remains a true
statement of the programme's design and appears in the structural table,
but it stops being the number the College leads with.

**The second principle follows from the first, and is the Senate's
distinctive position:**

> **Guided Learning Hours are measured, not asserted.**

Every institution publishes an hours figure. Almost none can say where it
came from. WEC will publish a *design* figure, clearly labelled,
until it can publish a *measured* one — derived from real time-on-task
across real learners — and will then replace it and say that it has.

No competitor does this. It costs nothing but discipline, it is
impossible to fake, and it converts the College's honesty constraint from
a limitation into the most defensible claim on the site.

---

## II. Institutional academic framework

| Layer | Definition | Count |
|---|---|---|
| **Programme** | The single flagship award pathway | 1 — the IEFC |
| **Level** | A complete stage of study, CEFR-aligned, separately awarded | 6 |
| **Module** | A thematic block of study within a level | 10 per level, 60 total |
| **Lesson** | The smallest planned unit of learning within a module | 12 per module (design), 720 total |

**Terminology is fixed at these four words**, and they carry the same
meaning on the website, in the LMS, on transcripts, on certificates, in
the API and in every document. The previous vocabulary used "unit" for
all of a level, a module and a lesson, and that collision is precisely
what allowed a published figure to drift from the delivered content for
months without anyone noticing. Ambiguity is not a style problem; it is
how institutions come to misdescribe themselves.

*Note for engineers: the database table `units` holds what this framework
calls **modules**. It is not renamed — a migration with real risk and no
learner-facing benefit — but every comment, API field and interface label
uses the framework's word.*

---

## III. Academic workload, credit and time

### Definitions adopted

| Term | Definition |
|---|---|
| **Guided Learning Hours (GLH)** | Time studying under the direction of the College — structured lessons, laboratories, live sessions, supervised assessment |
| **Independent Learning Hours (ILH)** | Time the learner is expected to spend unsupervised — practice, reading, drafting, rehearsal, revision |
| **Total Qualification Time (TQT)** | GLH + ILH. The honest answer to "how long does this take" |
| **WEC Credit** | The College's internal credit unit. **1 credit = 10 notional learning hours** |

**On the credit unit, stated plainly:** the WEC Credit is an internal
measure. It is **not** ECTS, **not** CATS, and carries **no transfer
entitlement** to any institution. The 10-hour convention is adopted
because it is the most widely used notional-hour value internationally
and therefore the most legible to a reader — not because any body has
recognised it here. Any institution deciding what to do with a WEC
Credit does so on its own judgement.

### The design model — Level I to VI

**These are design figures.** They are what the programme is being built
to. They are not measured, and they will be replaced by measured figures
under §XIV.

| Per level | Design |
|---|---|
| Duration | 4 months (≈17 weeks) |
| Modules | 10 |
| Lessons | 120 |
| Guided Learning Hours | 80 |
| Independent Learning Hours | 120 |
| **Total Qualification Time** | **200 hours** |
| **WEC Credits** | **20** |
| Expected weekly commitment | ≈ 12 hours |

| Full programme | Design |
|---|---|
| Duration | 24 months |
| Levels | 6 |
| Modules | 60 |
| Lessons | 720 |
| Guided Learning Hours | 480 |
| Independent Learning Hours | 720 |
| **Total Qualification Time** | **1,200 hours** |
| **WEC Credits** | **120** |

**Why the 40:60 guided-to-independent ratio.** Language is acquired
through use, and use is largely unsupervised. A programme claiming most
of its hours as guided would either be misdescribing itself or teaching
badly — the learner who only ever practises under supervision does not
become fluent. Sixty per cent independent is a statement about method,
not a way of reducing what the College must provide.

**The one caution the Senate records.** Commonly cited sector guidance
places the journey from zero to CEFR C2 at materially more than 1,200
hours in total. The IEFC's 1,200 is **guided plus expected independent
study within the programme** — it does not count the learner's own
exposure to English outside it, which for most learners is substantial
and is where much of the acquisition happens. **This distinction must be
stated wherever the figure is published**, and the figure must not be
presented as a claim that C2 can be reached in 1,200 hours from nothing.
That would be the single most checkable false claim the College could
make.

---

## IV. Learning outcomes and the competency framework

### Structure

Outcomes are written at three altitudes, each derived from the one
above, so that nothing is assessed that no outcome requires and no
outcome exists that nothing assesses:

1. **Programme outcomes** — six, one per graduate attribute (§V)
2. **Level outcomes** — 6–8 per level, CEFR-referenced and extended
3. **Module outcomes** — 3–4 per module, each demonstrably assessed

### The competency framework

Six competencies, assessed at every level to the standard of that level.
They are the spine of every rubric, every citation and every transcript
line.

| # | Competency | What it means |
|---|---|---|
| 1 | **Clarity** | Understood the first time, by the audience actually present |
| 2 | **Command** | Controls the language rather than being carried by it |
| 3 | **Judgement** | Chooses register, channel and moment; knows what not to say |
| 4 | **Reason** | Constructs an argument, tests it, concedes what should be conceded |
| 5 | **Bearing** | Holds a room, a call, a difficult conversation |
| 6 | **Reach** | Communicates across cultures, and across the distance between expert and layperson |

Competencies 3–6 are what the CEFR does not measure, and they are the
substantive reason the IEFC is a distinct qualification rather than a
repackaged proficiency scale.

**Rule:** every assessment maps to at least one competency, and every
competency is assessed at least three times per level. A competency
assessed once is an aspiration.

---

## V. Programme structure and the six levels

| Level | CEFR | Programme | Award on completion |
|---|---|---|---|
| I | A1 | Foundation Programme | **Essential Certificate in English Communication** (ECIC) |
| II | A2 | Elementary Programme | **English Candidate** (HCIC) |
| III | B1 | Intermediate Programme | **English Associate** (CAEC) |
| IV | B2 | Upper Intermediate Programme | **English Envoy** (HCAEC) |
| V | C1 | Advanced Programme | **English Orator** (ACEC) |
| VI | C2 | English Mastery Programme | **English Laureate** (WEPC) + the **International English Fluency Certificate** |

The award architecture, its reasoning and its rejected alternatives are
in `docs/iefc-award-architecture.md` (governance C4). Two points bear
repeating here because they are structural, not decorative:

- **Each level is a complete academic achievement**, separately awarded,
  with its own outcomes, competency profile and graduate identity. A
  learner who stops at Level III *is* an English Associate of Worldwide
  English College, permanently.
- **The IEFC itself is conferred at Level VI.** The certificate is the
  capstone qualification of the whole programme; the six awards are the
  standing conferred at each stage of it.

### What every level includes, without exception

The Executive directed that each level carry the full apparatus of a
programme rather than the thin apparatus of a course. Adopted:

1. **Formal Induction** — a required, assessed-for-completion entry
2. **Programme Handbook** — outcomes, assessment map, schedule, regulations
3. **Milestone Assessments** — continuous, at fixed points
4. **Capstone Assessment** — one per level
5. **Conferral Ceremony** — the level's named ceremony
6. **Certificate and digital credential**
7. **Chapter membership** in the Alumni Society

A level missing any of the seven is not ready to open.

---

## VI. The studios and laboratories

The College's teaching spaces, named consistently and each owning one
mode of the language. They are not branding: each is a distinct
assessment environment with its own evidence trail.

| Space | Owns | Status |
|---|---|---|
| **The Listening Laboratory** | Comprehension, connected speech, note-taking | **Built** |
| **The Speaking Laboratory** | Pronunciation, fluency, the Level Address | **Partly built** — recording and review exist; assessment does not |
| **The Reading Studio** | Extensive and intensive reading, inference | Designed, not built |
| **The Writing Studio** | Drafting, revision, register, academic and professional forms | Designed, not built |
| **The Communication Workshop** | Live practice: debate, negotiation, presentation, interview | Designed, not built |

**The Senate records that three of the five do not exist**, and requires
that the website describe as built only what is built. The Listening
Laboratory is genuinely strong; the others are honest plans.

**Progression strands** run through all five and are tracked
independently rather than folded into a single mark, because a learner
weak in one strand and strong in another is invisible in an average:
**Grammar · Vocabulary · Pronunciation · Discourse · Intercultural**

---

## VII. The academic year

Operating model as recommended in `docs/academic-calendar.md`: **rolling
admission on a fixed cohort rhythm.** Learners begin when they enrol;
everything social and assessed runs to a published cycle.

| Element | Cadence |
|---|---|
| Enrolment | Continuous |
| **Induction** | Weekly, fixed weekday |
| Live communication workshop | Weekly, per level |
| Tutorial | Weekly, per level |
| Milestone assessment | At modules 3, 6 and 9 |
| **Mid-Level Review** | At module 5 |
| Capstone Assessment | Module 10 |
| **Level Examination** | Monthly window |
| Conferral | Quarterly |
| Laureation | Annual |

**Study period.** A level is a **Study Period** of four months. Six Study
Periods make the programme. The Senate rejects "semester" and "term":
both imply fixed institutional start dates that this operating model does
not have, and using them would describe a College that does not exist.

---

## VIII. Assessment architecture

### The principle

**Assessment is continuous, and the capstone is not a surprise.** A
learner who reaches the Capstone Assessment should already know
approximately how they will do, because everything it tests has been
practised and marked along the way. Assessment that surprises is
assessment that measures nerve.

### Formative — carries no mark

| Instrument | Where | Purpose |
|---|---|---|
| **Practice Activities** | Every lesson | Rehearsal. Unlimited attempts, no record |
| **Knowledge Checks** | Every lesson | Self-diagnosis. The learner sees the answer, nobody else does |
| **Laboratory practice** | Listening, Speaking | Repetition against a model |

Formative work is **never** counted toward an award. The moment practice
carries a mark it stops being practice, and learners stop making the
mistakes that teach them.

### Summative — carries a mark

| Instrument | Frequency | Weight (proposed) | Assesses |
|---|---|---|---|
| **Module Assignment** | 10 per level | 25% | Written production, applied |
| **Module Examination** | 10 per level | 20% | Knowledge, accuracy, comprehension |
| **Milestone Assessment** | 3 per level | 15% | Integrated skills across modules |
| **Mid-Level Review** | 1 per level | — | Diagnostic; no weight, but must be completed |
| **Level Address** (oral) | 1 per level | 15% | Spoken production, defended |
| **Capstone Assessment** | 1 per level | 25% | Everything, applied to one task |

**Weights are proposed and require Executive adoption** alongside the
pass mark (governance B1/B2).

### Assessment by skill

Every level assesses all five, and **no skill may be compensated to
below its floor by strength in another** (§X):

**Listening · Reading · Writing · Speaking · Integrated**

The Integrated assessment is the one that most resembles real use: read a
source, hear a discussion of it, and produce a spoken or written response
that uses both. It is where the College's method shows.

### The Capstone Assessment

One per level, in module 10, and the level's defining piece of work. It
is:

- **Applied** — a task, not a paper about a task
- **Integrated** — draws on every skill and at least four competencies
- **Defended** — includes an **Oral Defence**: the learner answers
  questions about their own work, live

The Oral Defence is the single most important design decision in this
architecture. It is the reason an IEFC award cannot be obtained by
someone else's work, and it is why the College can assert its credentials
are trustworthy without appealing to a regulator. **Nothing else in the
assessment design carries as much weight per hour of staff time.**

Illustrative capstone shape by level:

| Level | Capstone |
|---|---|
| I Aspirant | A recorded personal introduction and a short exchange, defended |
| II Candidate | A practical task completed in English end to end (a booking, an enquiry, a complaint), with reflection |
| III Associate | A structured presentation on a familiar topic, with questions |
| IV Envoy | A case put on behalf of an organisation: brief, correspondence, meeting |
| V Orator | A persuasive address on a contested topic, defended under challenge |
| VI Laureate | A substantial applied project with a public address — the Laureate's capstone |

### Portfolio

Every learner keeps a **Portfolio of Evidence** across the level: every
capstone, every Level Address, selected assignments, and the learner's
own commentary on their development. It is a graduation requirement, it
is the transcript's evidence base, and it is the artefact a graduate
actually shows an employer.

---

## IX. Progression and graduation

### To complete a level

All of:

1. All 10 modules completed
2. All summative assessments attempted
3. Overall mark at or above the pass mark
4. **No skill below its floor** (§X)
5. Level Address passed
6. Capstone Assessment passed, including Oral Defence
7. Portfolio submitted
8. Academic-integrity record clear

**Item 3 alone is not sufficient, and that is deliberate.** An aggregate
pass with a failed capstone is a learner who cannot do the thing the
level certifies.

### To progress

Completion of level N admits to level N+1. Under Executive Decision #1 a
full-programme learner already holds the enrolment; completion unlocks
it.

### To graduate with the IEFC

All six levels completed, in sequence or from the placed entry point, and
the Level VI capstone passed. **The IEFC is conferred once.**

---

## X. Standards, honours and the compensation floor

### Proposed thresholds — awaiting governance B1/B2

| Honour | Overall | Floors |
|---|---|---|
| **Pass** | 70% | No skill below 60% |
| **Merit** | 80% | No skill below 70% |
| **Distinction** | 88% | No skill below 80%; Level Address at Distinction |
| **High Distinction** | 94% | No skill below 88% |
| **Distinction of the College** | Conferred, not calculated | Academic Board only; may be conferred in no cycle |

*The top honour is named for the institution because the College has no
Chancellor. See governance C4a.*

### The compensation floor — why it exists

Most frameworks let a strong skill carry a weak one. The Senate rejects
unlimited compensation for one reason: **a graduate who writes
excellently and cannot be understood aloud has not mastered English**,
and a certificate saying so is one the College would have to defend the
first time an employer met them.

The floors cost nothing to enforce — the rubrics already score skills
separately — and they are what makes the award mean what its name says.

### Academic standing

| Standing | Meaning |
|---|---|
| **In Good Standing** | Meeting requirements |
| **Under Review** | Two failed summatives, or a mid-level review flagging risk. Triggers a tutorial, not a sanction |
| **Suspended Progression** | Progression paused pending resolution of an integrity matter |

**No standing removes access to learning.** Nothing here expires, locks
or withdraws, because no such policy exists and each would carry
contractual and consumer-protection weight.

### Resits — awaiting governance B3

Proposed: two resits per summative assessment; a resit no sooner than 14
days after the previous attempt; a capstone resit requires a new task, not
a resubmission; a third failure means the level is repeated. **A resit
mark is capped at Pass** — an honour should reflect performance at the
standard the first time.

---

## XI. Attendance and engagement

The College is asynchronous, so **attendance is the wrong measure** and
adopting it would import a metric that does not describe anything here.

**Engagement** is measured instead, and it is descriptive, never
punitive:

- Lessons completed against the published pace
- Laboratory practice submitted
- Live sessions attended (where offered)
- Assessments attempted on schedule

Engagement data exists to trigger **support** — a tutorial, a message, an
offer — and never a penalty. A learner behind at month two can still
finish; the entire value of measuring is reaching them before month
eleven.

---

## XII. Academic integrity

### Standard

The College expects work to be the learner's own. It says so once,
plainly, in the Handbook, and does not moralise further.

### The design that makes it enforceable

Integrity here is **structural, not investigative**. The College does not
run detection software as its primary defence; it builds assessment that
is hard to fake:

- **The Oral Defence.** Every capstone is defended live. A learner who
  did not write it cannot defend it, and no detection tool is needed to
  establish that.
- **The Level Address.** Spoken, recorded, at every level.
- **The Portfolio.** Development over time is visible; a sudden
  discontinuity in voice is evident to any reader.
- **Applied tasks** rather than essay prompts, which are what generative
  tools answer most easily.

This is the Senate's considered position on AI and contract cheating:
**assessment design defeats both; policing neither.** An institution
whose integrity rests on detection is in an arms race it will lose. One
whose assessments require a person to be present and accountable is not
in the race.

### Process

A suspected breach is put to the learner, who responds; the Academic
Board decides; the outcome is recorded. **Where an award is withdrawn,
the verification page shows it as withdrawn** rather than deleting it —
a register that quietly loses entries is not a register.

---

## XIII. Records, transcripts and credentials

### The transcript

Issued on request and at graduation, showing:

- Every level attempted, with dates
- Marks by **skill** and by **competency**, not one aggregate — the whole
  point of assessing them separately
- Honour at each level
- Capstone title and result
- GLH, ILH, TQT and credits per level
- Awards conferred, with post-nominals
- Verification code

### The certificate

Name, award, post-nominal, level, CEFR band, honour, citation, date,
issuer, verification code. **Nothing else.** Every additional claim on a
certificate is a claim somebody may one day have to substantiate.

### Digital credentials

Issued to **Open Badges 3.0 / W3C Verifiable Credentials** — an
implementation intention, not a claim of certification against those
standards.

### Verification

`/verify/<code>` — no account, no sign-up, no identification of the
checker. A credential that requires the checker to register is one nobody
checks. Withdrawn awards display as withdrawn.

---

## XIV. Learning analytics — and the measured-hours commitment

### What is measured

| Measure | Used for |
|---|---|
| Lesson completion and pace | The learner's own dashboard; support triggers |
| **Time on task** | Deriving measured GLH and ILH |
| Assessment outcomes by skill and competency | Curriculum improvement |
| Laboratory practice volume | Identifying learners avoiding a skill |
| Cohort completion rates | Institutional quality review |

### The commitment that follows

Once enough learners have completed a level, the College replaces its
**design** hours with **measured** hours and says publicly that it has
done so, including where the measurement differs from the design.

If Level I turns out to take 240 hours rather than 200, the College will
publish 240. An institution that adjusts its published figures toward
what actually happened is telling the truth twice: once about the number,
and once about itself.

**Rules:** analytics inform teaching and support, never sanctions. No
individual learner's data appears in institutional reporting. Data
retention follows governance D1/D2.

---

## XV. Learning pathways

| Pathway | Entry | Note |
|---|---|---|
| **The full Ascent** | Level I | The intended route |
| **Placed entry** | The level a placement assessment supports | The College confers awards only for levels it has taught and assessed |
| **Single level** | Any level, subject to placement | A complete award in itself |
| **Pause and return** | Any time | Awards do not expire; nothing lapses |
| **Post-programme Fellowships** | After Laureate | A parallel structure, never Level VII |

---

## XVI. What the College does not have, and says so

The Senate requires that this list appear, in substance, on `/about/` and
be kept current. Its presence is a quality signal, not a weakness:

- No accreditation or external quality-assurance affiliation
- No named academic leadership or faculty roster
- No Chancellor
- Three of five studios and laboratories not yet built
- 41% of designed lessons authored
- No measured hours yet — design figures only
- No adopted academic policy: pass marks, resits, certification and
  retention all remain open governance items

---

## XVII. Terminology register — binding

One word per concept, everywhere: website, LMS, portal, transcript,
certificate, API, documentation.

| Use | Never |
|---|---|
| Level | Stage, year, tier |
| Module | Unit, chapter, block |
| Lesson | Unit, activity, item |
| Study Period | Semester, term |
| Guided Learning Hours | Contact hours, class hours |
| Independent Learning Hours | Homework, self-study |
| Total Qualification Time | Course length, duration of study |
| WEC Credit | Credit hours, points, ECTS |
| Capstone Assessment | Final project, end-of-level project |
| Level Address | Oral exam, speaking test |
| Oral Defence | Viva, interview |
| Conferral | Graduation *(except the Laureation)* |
| Portfolio of Evidence | Coursework folder |

---

## XVIII. What the Executive must decide

| # | Decision | Blocks | Governance |
|---|---|---|---|
| 1 | Adopt this framework and its terminology | Everything downstream | A6 |
| 2 | Adopt the credit model (1 credit = 10 hours; 20/level, 120 total) | Transcripts, certificates | A6a |
| 3 | Adopt the design workload figures pending measurement | Publication of any hours | A6b |
| 4 | Adopt pass mark, honours thresholds and skill floors | Any conferral | B1/B2 |
| 5 | Adopt assessment weights | Any mark | B1 |
| 6 | Resolve C3 — speaking counts | The Level Address, the Oral Defence, the whole model | C3 |
| 7 | Adopt the resit policy | Any failed assessment | B3 |
| 8 | Define "completed" | When an award becomes due | B4 |
| 9 | Approve building the three unbuilt studios, or remove them from public description | Honesty of the site | A6c |
| 10 | Approve the measured-hours commitment | The College's strongest differentiator | A6b |

---

## XIX. What the Senate recommends is built next

1. **Terminology rename across the site** — approved by the Executive; no
   further decision needed
2. **Replace the content-count headline with the workload block** — same
3. **The Register and verification portal** — needs only C4 decision 1
4. **Time-on-task instrumentation** — needs nothing, and every month it
   is delayed is a month of measurement the College does not have
5. **The Speaking Laboratory's assessment layer** — needs C3
6. **The Reading and Writing Studios** — needs decision 9

Item 4 deserves emphasis. The measured-hours commitment is the most
credible claim available to a new institution with no accreditation, and
it requires only that measurement begin **before** the learners arrive
rather than after.
