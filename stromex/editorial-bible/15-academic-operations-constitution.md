# Volume 15 — The Academic Operations Constitution

*Admissions, enrolment, attendance, assessment, progression, graduation —
the operational spine, and who is allowed to move it.*

---

## §15.1 The record's journey `[OBSERVED]`

One student, one continuous record, five stages, each with a different
owner and a different set of rules:

```
application → admission → enrolment → academic life → completion
   ADM/REG      REG+PRIN      REG        TCH/MUH/ARB      REG+PRIN
   (status)     (approve)   (convert)    (record)        (approve)
```

**Nothing in that chain is deleted at any stage.** A declined or withdrawn
application is status-changed, never removed, "so a family's admissions
history remains traceable" (`SHRS data-lifecycle-register`).

## §15.2 Admissions `[OBSERVED]`

- An application is **self-submitted by the guardian, tied to their own
  account** — the same account they will keep as a parent. One identity
  through the whole journey (`SHRS account-creation-journey`).
- Status transitions only: `submitted → under_review →
  waitlisted / offered / admitted / declined / withdrawn`. **Never a raw
  edit of the applicant's submitted details.**
- **This is the estate's one genuinely enforced approval gate today** —
  the endpoint checks the `admissions` **A** grant, institution-scoped,
  and refuses the write if it fails. Every other joint approval described
  in the matrix was recordable but not gated until certificates and Ijazah
  were migrated.
- Converting an admitted application into a student **reuses the applying
  guardian's account** rather than creating a second one.
- Retention: 3 years from decision if not admitted; enrolment + 7 years if
  admitted (`SHRS IT-04 §7.1`, proposed).

## §15.3 Enrolment `[OBSERVED — with a defect worth keeping in view]`

`WEC-EP §2` records the failure that makes this an article: enrolments had
**no uniqueness constraint**, so the same learner could hold two live
enrolments in one level, and completing the level would mark one completed
while the other stayed active. Nothing in the test suite ever enrolled the
same person twice; the manual SQL that did was written by hand, outside
any test.

**Binding.** *One live enrolment per learner per level* is a database
constraint, not a convention. The same applies to every "there can only be
one of these" rule anyone can state in a sentence.

## §15.4 A student may belong to more than one class `[OBSERVED]`

`SHRS shrs-digital-infrastructure-blueprint §3`: the student↔class
relationship supports "real multi-institution dual enrolment — a student
is never assumed to belong to exactly one class."

This is a `SEB §4.1` decision: it costs a join today and makes a whole
category of future institution possible without a migration.

## §15.5 Who may create academic data, and the gap that recurs `[OBSERVED]`

The matrix grants the Registrar **Edit / correction**, and grants
**Create** to the teaching roles — Class Teacher for attendance, Subject
Teacher for assessments, Muhaffiz for Hifz.

`SHRS data-lifecycle-register` records what happened when that was
implemented: the same operational gap surfaced twice, "confirming it as a
pattern rather than a one-off" — the roles that *own* creation did not
have accounts, so in practice the correction path was the only path.

**Binding.** When a permission is assigned to a role, the *provisioning*
of that role is part of the same work item. A permission granted to a role
nobody holds is a permission that will be exercised by someone else, under
a grant that was meant for corrections.

**And the scope check is on the assignment, not the role**: a Class
Teacher may write attendance for a class only where an *active assignment
row names that exact class* — not merely because they hold the teacher
role somewhere (`SEB §4.2`).

## §15.6 Corrections stay visible `[OBSERVED — as a named gap]`

The rule is `SEB §26.3`. The current state, recorded honestly, is that
attendance and assessment corrections are upserts that overwrite the prior
value with no history — "unlike `student_lifecycle_events`."

**Binding for new systems, and registered work for existing ones.** An
academic correction is an event: old value, new value, actor, timestamp,
reason.

## §15.7 Progression and graduation `[OBSERVED]`

- Promotion, transfer, withdrawal, graduation and reinstatement are
  **reasoned lifecycle events** (`SEB §12.8`).
- The matrix documents a **Registrar + Principal** joint authority over
  status changes. `SHRS data-lifecycle-register` records that this is
  **recordable but not enforced** for lifecycle events — the natural next
  migration onto the same approval engine that certificates and Ijazah now
  use, requiring a pending state on the events table that does not yet
  exist.
- **The single-person exception is live and must be honoured**
  (`SEB §26.5`, `SEB §28.4` Q5).

## §15.8 Hifz and Ijazah operate under their own lifecycle `[OBSERVED]`

Deliberately separate from the generic academic-record tables, because
memorisation status and permanent credential grants "don't match a normal
term-by-term result" (`SHRS shrs-digital-infrastructure-blueprint §3`).

- Stage advancement is a joint Qur'an College Officer + Principal
  authority. `[OBSERVED — gap]` today the check accepts *either* alone;
  only the Ijazah grant that follows it is genuinely two-party.
- The Registrar sees a **snapshot only** — stage and verified-Juz' count.
  Full Muhaffiz notes are Qur'an-College and student-facing by design.
  This is least-privilege applied inside an institution, not just at its
  edge.
- The Ijazah register is permanent and structurally undeletable
  (`SEB §12.6`).

## §15.9 Terminology is the institution's own `[OBSERVED]`

`SHRS role-permission-matrix §0` corrects a commissioning brief on three
points and the method is the article: **Muhaffiz/Muhaffizah**, not "Hifz
Instructor," because the institution's own regulations already establish
the term; **no "Ijazah Coordinator,"** because the governance framework
describes a Principal putting a student forward and *external* examining
scholars deciding, and no internal coordinator exists; **no "Proprietor"
separate from the Head of Schools**, because the charter names one top
executive office.

**Binding.** A system uses the institution's real vocabulary. Where a
brief supplies a term the institution does not use, the term is corrected
and the correction is recorded — an invented role in a permission matrix
becomes an invented role in a database, and then an invented role on a
certificate.

## §15.10 Established roles and proposed roles are marked `[OBSERVED]`

Every role in the estate's matrix is tagged **Established** (a real,
currently-documented role, with a named person or documented
responsibilities) or **Proposed** (the office is real, the role is not yet
Board-documented).

**Building the system to support a Proposed role is legitimate; presenting
it as established is not.** This is `SEB §2.4` applied to organisational
structure, and it is what lets architecture run ahead of appointments
without lying about the org chart.

## §15.11 The academic calendar and the term `[OBSERVED]`

Terms are real rows, entered as they occur, with exactly one current. It
is structurally complete in the estate and has no gap — recorded here only
because every report, transcript, promotion and fee snapshot resolves
through it, and a system that infers the current term from a date range
will be wrong in the week a term is extended.

## §15.12 Real data replaces sample data by addition, not by deletion `[OBSERVED]`

`SHRS institutional-data-architecture §2` sets the sequence — institutions
→ class ladder → staff onboarding → student enrolment → academic data —
and then makes the decision this article exists for:

> Sample records should be **left in place** rather than deleted, since
> every real aggregate already filters them out, and deleting them risks
> breaking anyone still using the demo credential for training and
> testing.

**Binding.** Seed and demonstration data is flagged at the row level from
the first migration, filtered by every aggregate, and retired by ceasing
to reference it — not by a delete.
