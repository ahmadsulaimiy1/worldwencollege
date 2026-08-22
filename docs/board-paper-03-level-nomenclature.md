# Board Paper 03 — The College has two names for each of its six levels

**Prepared for:** the Executive of Worldwide English College
**Prepared by:** the Design Office, arising from the Naming Audit
**Status:** for decision. Nothing in this paper has been adopted, and
nothing in it has been acted on.
**Date:** 22 August 2026

---

## 1 · The finding

Each of the six levels has two names, and both are published.

| Level | CEFR | Name A — used on the website | Name B — used in the record and in print |
|---|---|---|---|
| I | A1 | Foundation Stage | Foundation Programme |
| II | A2 | Development Stage | Elementary Programme |
| III | B1 | Application Stage | Intermediate Programme |
| IV | B2 | Professional Stage | Upper Intermediate Programme |
| V | C1 | Advanced Stage | Advanced Programme |
| VI | C2 | Mastery Stage | English Mastery Programme |

**Name A** is what the navigation, the six qualification pages, the
alumni chapters and the award architecture use. It is the vocabulary the
Worldwide English Qualifications framework was written in: each stage
names what a learner has become, and each stage has an award attached.

**Name B** is `programme_levels.name` in the database. It is what the
level tables on `/academics/`, the flagship curriculum, the assessment
handbook and every generated publication print.

They appear together. The level table on the academics overview has a
column headed **Programme** carrying Name B, while the navigation menu
that brought the reader there carries Name A, and the page each row
links to is titled with Name A. The reader is not told they are the same
six things.

## 2 · Why this matters more than it looks

Name B is the standard ELT ladder: Elementary, Intermediate, Upper
Intermediate, Advanced. It is instantly legible to anybody who has
studied a language commercially — and that is both its strength and the
problem.

- It is **legible**: a Gulf scholarship officer, a corporate training
  buyer and a parent all know roughly what "Upper Intermediate" means.
  Name A does not carry that recognition and has to be learned.
- It is **generic**: it is the vocabulary of a language school, not of a
  College conferring its own qualifications. Every competitor uses it.
  A qualification called the *Upper Intermediate Programme* sounds like a
  course. One called the *Professional Stage* sounds like a stage of an
  award.
- It **collides at III and IV**. "Intermediate" at B1 and "Upper
  Intermediate" at B2 is the conventional mapping, but the College's own
  Application/Professional split says something the conventional labels
  do not: III is where English becomes usable for work and study, IV is
  where a learner can be sent to represent someone. That is the claim the
  qualification makes. "Upper Intermediate" makes no claim at all.
- It has already drifted once. `scripts/publication/stage.mjs` carried
  Name B one level out of step — "Pre-Intermediate" at III — left over
  from a six-versus-seven-level revision settled everywhere else.
  Nothing published that list, so nothing caught it. Two parallel naming
  systems means two things to keep in step, and this is what that costs.

## 3 · What is NOT in question

The CEFR mapping (A1–C2), the six-level structure, the Roman numerals,
and the six award titles are settled and are not reopened here. This
paper is about the level *names* only.

## 4 · The options

### Option 1 — Adopt Name A everywhere. Retire Name B.

`programme_levels.name` becomes Foundation Stage … Mastery Stage. Every
publication reprints with the stage names. The academics table's
"Programme" column becomes "Stage".

- **For:** one name per level, everywhere, permanently. The vocabulary
  matches the award architecture, so a learner reads *Application Stage
  → Certificate in Applied English Communication* and the two words
  agree. Nothing further to keep in step.
- **Against:** loses the instant recognition of "Intermediate". A reader
  who wants to know "is this the B1 course?" has to read the CEFR column
  rather than the name. Every generated publication must be reissued.
- **Cost:** a migration renaming six rows, a reprint of the publication
  set, and a sweep for Name B in prose.

### Option 2 — Adopt Name B everywhere. Retire Name A.

- **For:** maximum immediate legibility to an international buyer.
- **Against:** it contradicts the framework the College spent its
  governance on. It would leave the alumni chapters (Foundation Chapter,
  Development Chapter …) and the award standings orphaned from the level
  names, or force a second rename of those too. It makes the College
  sound like a language school at exactly the point where it is trying
  to be read as an awarding body. **The Design Office does not recommend
  this.**

### Option 3 — Keep both, and bind them explicitly.

Name A is the level's name; Name B is published beside it as its CEFR-
equivalent description, always adjacent, never alone: *Application Stage
(B1 — intermediate)*.

- **For:** keeps both audiences. Costs no reprint of the award
  architecture.
- **Against:** two names is two names. The binding has to be enforced in
  every generator and every publication, forever, and the first place it
  is forgotten is the place a reader notices. This is the status quo with
  a promise attached, and the drift in `stage.mjs` is evidence about how
  such promises hold.

### Option 4 — Do nothing.

Recorded for completeness. It leaves the collision in place: a table
column headed "Programme" naming one thing, a menu naming the same thing
differently, and no page telling the reader they are the same six levels.

## 5 · Recommendation

**Option 1.** Adopt Name A — the stage names — as the level names, and
retire Name B.

The reason is not aesthetic. The College's whole position is that each
level confers a complete qualification rather than a step on a course.
The stage names say that; the ELT ladder says the opposite, and it says
it in the one column a reader scans first. Where the two systems
disagree, the College should keep the one its own governance is written
in and lose the one it inherited from the sector.

The recognition argument for Name B is answered by the CEFR column,
which is on every table and every qualification page and is the actual
international currency. "B1" travels further than "Intermediate" and is
already published beside every level.

If the Board prefers to keep the ELT vocabulary available, **Option 3 is
the acceptable fallback**, but it should be adopted with the binding rule
written down and enforced by a test, not as an intention.

## 6 · What the Design Office has already done, and what it has not

**Done**, because it is error rather than judgement:

- The Graduate Register's award filter offered four titles the College
  retired when it adopted the Worldwide English Qualifications framework
  — *English Candidate*, *English Associate*, *English Fellow*, *English
  Scholar* — beside two titles from the current framework. Corrected to
  the six current award titles in full.
- The flagship curriculum's lead paragraph named *English Associate of
  Worldwide English College* three lines above a table naming the award
  that replaced it, and asserted that "the College says so in those
  words". It did not. The generator now reads the title from the record.
- `stage.mjs`'s copy of the level names, one level out of step,
  reconciled to `programme_levels`.
- The IEFC acronym, and the six award codes, expanded on every page whose
  own copy uses them.

**Not done**, because it is the Board's:

- Which of the two naming systems the College uses. Nothing in this
  paper has been applied to `programme_levels`, to any publication, or to
  any page.

## 7 · If the Board adopts Option 1

1. A migration renaming the six rows in `programme_levels`, with the
   previous names recorded in the migration so the change is auditable.
2. `sql/seed-curriculum-level-*.sql` prose swept for Name B.
3. The publication set regenerated and reissued — the flagship
   curriculum, the assessment handbook, the specifications and the
   institutional edition all print the level names.
4. The academics table's column heading changed from "Programme" to
   "Stage".
5. A test asserting that no served page and no generator carries a
   retired level name, in the same form as the retired-award-title check
   already in `tests/naming.test.mjs`.

None of this is begun.
