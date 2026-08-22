# The Academic Integrity Procedure

**Status.** Governance decision C9 was **adopted 14 August 2026 by the
Executive**, and, like every academic item, is subject to Academic Senate
ratification. Migration `023-academic-integrity.sql` builds the procedure
C9 required and `tests/academic-integrity.test.mjs` proves it holds.

**Two matters are marked below for Academic Senate approval**: the
standard response window, and the body that hears a referred case. They
are not decided here because they are not the author's to decide.

---

## 1. Why the College has one

Governance C9 named the risk plainly: the platform stores voice
recordings and written submissions, which makes misconduct both possible
and detectable, and therefore makes the absence of a procedure a live
risk rather than a theoretical one.

It became urgent in the week migration 022 was written. C9 names
impersonation in a spoken assessment as one of the two common cases on an
online programme, and until the speaking framework existed there were no
spoken assessments to be impersonated in. Building the assessment created
the risk the procedure was adopted to manage.

There are no cases. Nothing has been taught, nobody has been assessed,
and no misconduct has occurred. This procedure exists before the first
learner arrives because a procedure written after the first allegation is
a procedure written to fit it.

## 2. What the procedure protects

A learner accused of misconduct is, at that moment, the person with the
least power in the institution. Almost everything in this document is
there to make that less true: the accusation must be written down, they
must be told, they must be given the chance to answer before anything is
decided, the person who accused them may not be the person who decides,
the decision must carry reasons they can argue against, and they may
appeal to someone who was involved in neither step.

The College also has something to protect. A qualification means nothing
if the College cannot say how it was earned. Every safeguard above is
what allows the College to stand behind a finding when it does make one.

## 3. What counts as misconduct

Six categories are defined in the record. Each carries a definition
written for the person being accused of it, and a statement of what the
College would have to be able to show. The second half is deliberate: an
allegation nobody can evidence should be visibly an allegation nobody can
evidence.

<!-- These six sections are reproduced from misconduct_categories in
     sql/schema.sql. The test asserts that they match the record. -->

### 1. Work that is not the learner's own  `NOT_OWN_WORK`

Submitting written work produced by another person, by a service, or by a machine, and presenting it as your own. This includes work bought, commissioned, or generated on your behalf.

**What the College must be able to show.** The submission itself, and a stated reason for doubting authorship — a discontinuity in standard, a register the learner has not otherwise shown, or an admission. A similarity percentage is not on its own a reason.

### 2. Impersonation in an assessment  `IMPERSONATION`

Another person taking an assessment in your place, or speaking in a recorded or live speaking assessment while it is presented as yours. Named in governance C9 as one of the two common cases on an online programme.

**What the College must be able to show.** The recording, and a comparison against other speech the College holds from the same learner. Where the assessment was live, the assessor's account.

### 3. Collusion  `COLLUSION`

Producing work jointly with another learner and submitting it as independent work. Studying together is encouraged; submitting together is not.

**What the College must be able to show.** The two submissions, and what they share that independent work would not.

### 4. Fabricated evidence  `FABRICATION`

Inventing a source, a quotation, a datum or an experience in assessed work, or altering a document submitted to the College.

**What the College must be able to show.** The fabricated element, and what shows it to be fabricated.

### 5. Examination misconduct  `EXAM_MISCONDUCT`

Using prohibited material during an examination, communicating with another person during it, or attempting to obtain the questions in advance.

**What the College must be able to show.** What was used or exchanged, and how it was observed.

### 6. Misrepresentation to the College  `MISREPRESENTATION`

Giving false information in an application, a placement assessment, a claim for extenuating circumstances, or a request for a qualification to be reissued.

**What the College must be able to show.** The statement made and the fact contradicting it.

## 4. How a case runs

| Stage | What happens | What the record requires |
| --- | --- | --- |
| Opened | A named member of staff writes down what is alleged and identifies the work in question. | `opened_by`, `opened_at`, `allegation`, and exactly one of the three subject fields. A case about nothing in particular is not a case. |
| Notified | The learner is told what is alleged, is given the evidence, and is told by when they may answer. | `notified_at`, `response_due`. |
| Answered | The learner responds, in writing or in a meeting recorded in the file. | `response_at`, `response`. |
| Determined | A second person — not the person who opened it — decides, and writes the reasons. | `determined_by`, `determined_at`, `outcome`, `reasons`. |
| Appealed | The learner may appeal. It is heard by a third person, involved in neither step. | `appeal_lodged_at`, `appeal_heard_by`, `appeal_decided_at`, `appeal_outcome`, `appeal_reasons`. |
| Closed | The case ends. It cannot end while an appeal is open. | `closed_at`. |

Every step is appended to `misconduct_case_events`, which has no update
path: the file records what happened and when, and does not permit it to
be tidied afterwards.

**For Academic Senate approval.** The standard response window is not
set. Today `response_due` is entered case by case, and the schema
requires only that it exists before a finding can be recorded. A standard
minimum — fourteen days is the common practice — should be adopted by
Senate rather than assumed here.

## 5. Outcomes

Six outcomes are available, and these are the only six the record will
accept: `no_case_to_answer`, `warning`, `work_annulled`,
`module_annulled`, `qualification_annulled`, and `referred_to_senate`.

The first is not a formality. A case that ends in *no case to answer* is
the procedure working, and it is recorded in the file the same way as any
other outcome, so that a learner who was investigated and cleared can
show it.

**For Academic Senate approval.** `referred_to_senate` names the Academic
Senate as the receiving body. Whether Senate hears such cases itself, or
constitutes a panel to do so, is a matter for Senate.

## 6. Appeal

An appeal is heard by someone involved in neither the investigation nor
the determination. The schema refuses to record an appeal heard by the
person appealed against, and refuses to record an appeal decision without
reasons — an appeal that need not explain itself is not an appeal.

Three appeal outcomes exist: `upheld` (the original finding stands),
`overturned`, and `varied`.

## 7. What is deliberately absent

**No automated detection.** Text-matching software reports overlap; it
does not know whether a learner cheated. A similarity percentage is not
on its own a reason, and it is written into the evidence expectations
that way. Every case here is opened by a named person who is willing to
say why.

**No penalty tariff.** The outcomes are a vocabulary, not a sentencing
table. A first-year learner who quoted badly and a candidate who paid
someone to sit their speaking assessment are not on the same scale, and a
table that put them there would be doing the determining body's job
badly.

**No case register.** It is empty, and it stays empty until there is
something real to record.

## 8. Where the procedure is actually enforced

A misconduct procedure that lives only in prose is one that gets skipped
when somebody is in a hurry, and the finding that results is
indefensible — to the learner, to an appeal, and to any future regulator
reading the file.

So the safeguards are `CHECK` constraints on `misconduct_cases`, not
guidance. A finding without notice, a finding before the learner could
answer, a finding without reasons, a determination by the person who
opened the case, an appeal heard by the person appealed against, and a
case closed with an appeal outstanding are each **impossible to record**.
If the College ever wants to do one of those things, it will have to
alter its own schema, and that is a conversation somebody will have to
have out loud.

`tests/academic-integrity.test.mjs` proves each constraint separately: it
constructs a case that is lawful in every respect except the one under
test, and requires the database to refuse it. Each constraint has been
verified by deleting it and confirming that exactly one assertion — its
own — then fails.
