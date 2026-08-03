# WEC-LC — Governance Decisions Awaiting Approval

**Status: NONE OF THIS IS ADOPTED.** Every item below is a drafted
recommendation put to the Executive for approval, amendment or
rejection. Nothing here is implemented as policy, and nothing here
should be quoted to a student, an applicant, an auditor or a regulator
until it carries an approval date and a name in the Decision column.

---

## Why this document exists, and what it is not

Throughout this project a standing constraint has held: **do not invent
academic policy where governance approval is required.** That constraint
has repeatedly stopped work — resit rules, certification, retention
periods, PART A/B conventions — and each time the gap was recorded
rather than filled.

The constraint is right, and it is also not free. A platform that
refuses to invent policy, and is never given any, cannot open. So this
document does the one thing that is legitimately available: it converts
each blocked decision into a **specific proposal with a
recommendation**, so approving it is a short act rather than a research
project.

**What this document does not do, and will not:**

- It does not name a Principal, a professor, a board or a council. Those
  are real people at a real institution, and inventing them — even as
  placeholders — puts fabricated leadership on an education provider's
  record. Appointments are made through `/admin-enrolments.html` by a
  real administrator, and recorded with who made them and under what
  authority.
- It does not claim accreditation, recognition, partnership or
  affiliation, proposed or otherwise.
- It does not set anything by default. Where the software needs a value
  to run, it ships in the safest available state and says so — e.g.
  `recording_retention_days` is `null` (keep, never delete), and
  `lms_pass_threshold` is a mechanism default explicitly labelled as not
  an academic standard.

---

## How to adopt one

Reply with the item number and either **approve**, **approve with
amendment X**, or **reject**. On approval I will: implement it, put the
value where the software reads it, record the decision and its date
here, and update every document that currently says "awaiting
governance".

---

## A. Access and appointments

### A1. Who may hold Administrator access
**Recommendation:** Administrator is granted only to people who are
accountable for the institution as a whole — in practice, the owner and
at most one deputy at this stage. Administrator can appoint others,
change anyone's access, and read every learner record.

**Rationale:** the count should be small enough that "who can see
student records" has a one-sentence answer.

**Already enforced in software, regardless of this decision:** nobody
can change their own access; the last administrator cannot be removed;
every appointment records who made it, why, and under what authority.

**Decision:** ☐ awaiting

### A2. Who may hold Staff access
**Recommendation:** anyone teaching, marking or reviewing learner
work. Staff can enrol and withdraw learners, review recordings and
grade assignments. Staff cannot appoint anyone.

**Decision:** ☐ awaiting

### A3. Bootstrap
**Recommendation:** the first Administrator is set once by SQL, by the
account owner, and every subsequent appointment goes through the
platform so that it is recorded. This is unavoidable — the first
administrator cannot be appointed by an administrator.

**Decision:** ☐ awaiting

### A4. Whether "employee with no learner access" needs its own role
**Raised by:** placing the organisational chart into the development
database (`docs/org-chart-placeholders.md`). Six of the eighteen
positions — finance, marketing, corporate sales, the CEO's assistant
and both technology posts — have no reason to open a learner's record,
so they hold `student`, which is the platform's word for "nothing
granted". It is the correct *access*, and an absurd *label*.

**Recommendation:** keep three roles for now and accept the wrong word.
Adding a fourth changes nothing about who can see what, and an access
level that exists only to read better is a new concept for every future
reader of the code to learn.

**The counter-argument, which may win:** if staff accounts are ever
created for people who are not teaching — and an institution of this
shape will create them — a colleague reading the user list sees the
Director of Finance listed as a student and reasonably concludes the
data is wrong. At that point the label is a defect, not a wording
quibble, and `none` or an `is_employee` flag is worth the addition.

**Decision:** ☐ awaiting

---

## B. Assessment and progression

These are the items the standing constraint has blocked longest. Each
one currently has *no* value anywhere in the platform.

### B1. Pass threshold
**Currently:** `lms_pass_threshold = 0.7`, labelled in the schema as a
mechanism default and explicitly **not** a WEC-LC academic standard.

**Recommendation:** confirm 70% for module quizzes, and set the
end-of-level examination separately (B2) rather than inheriting it.

**Rationale:** a formative module quiz and a summative level
examination should not share a threshold by accident.

**Decision:** ☐ awaiting

### B2. End-of-level examination pass mark
**Recommendation:** 70% overall with no single assessed criterion below
50%.

**Rationale:** a single aggregate lets a learner pass while failing
outright on one dimension. The rubric already scores criteria
separately, so the floor costs nothing to enforce.

**Decision:** ☐ awaiting

### B3. Resit policy
**Recommendation:** two resits per level examination. A resit is
attempted no sooner than 14 days after the previous attempt. A third
failure requires the level to be repeated.

**Rationale:** stated as the most common shape in language education,
**not** as a claim about what any specific institution does. This is
exactly the kind of item to amend from experience rather than accept
because it is written down.

**Decision:** ☐ awaiting

### B4. Progression between levels
**Currently:** Executive Decision #1 — a full-programme payment enrols
Level I immediately, and each later level unlocks when the previous is
marked completed.

**Recommendation:** confirm as-is, and define "completed" as passing
the end-of-level examination under B2 — which the software does not
currently require.

**Decision:** ☐ awaiting

### B5. PART A / PART B examination convention
**Currently:** used in Levels IV–VI assignments; absent in I–III. The
programme review flagged the inconsistency and it was never resolved.

**Recommendation:** apply the convention across all six levels — PART A
assesses controlled accuracy, PART B extended production — so a learner
meets the same structure from Level I and the examination format is not
itself a new thing to learn at Level IV.

**Decision:** ☐ awaiting

---

## C. Certification

### C1. What a learner receives
**Recommendation:** a **Certificate of Completion** per level, and a
**Programme Transcript** listing all six with dates and outcomes.

**Explicitly NOT recommended:** any wording implying accreditation,
regulatory recognition, or equivalence to a qualification awarded by an
accredited body. WEC-LC holds no accreditation, and a certificate that
implies otherwise is a misrepresentation regardless of intent.

**Decision:** ☐ awaiting

### C2. What a certificate may state
**Recommendation:** learner name, level, CEFR band, completion date,
issuing body (WEC-LC London Campus), and a verification code resolving
to a page confirming issuance. Nothing else.

**Rationale:** every additional claim on a certificate is a claim
somebody may later have to substantiate.

**Decision:** ☐ awaiting

### C3. Whether speaking assessment counts toward certification
**Recommendation:** not yet. Learner recordings are stored and can be
reviewed, but no moderated marking standard exists, and certifying
against an unmoderated single-reviewer score is not defensible.

**Decision:** ☐ awaiting

---

## D. Data and retention

### D1. Learner voice recording retention
**Currently:** `recording_retention_days = null` — kept indefinitely,
nothing ever deleted. The purge mechanism is built and switched off.

**Recommendation:** 730 days (two years) from recording, after which
the audio is deleted and the assessment record and its SHA-256
fingerprint are kept.

**Rationale:** long enough to cover a full programme and any appeal
against a mark; short enough not to hold voice data indefinitely. This
is a data-protection decision with legal consequences and should be
taken with whatever advice applies in the operating jurisdiction —
which I cannot supply.

**Decision:** ☐ awaiting

### D2. Erasure on request
**Recommendation:** a learner may request erasure of their recordings
at any time; the audio is destroyed, the assessment record is kept. The
endpoint exists (`POST /api/admin/recordings/purge` with a `userId`)
and requires an explicit confirmation.

**Decision:** ☐ awaiting

---

## E. Deferred — insufficient basis to recommend

I am not proposing values for these. Each needs information I do not
have, and a plausible-looking number would be worse than an open item.

| Item | What it needs |
|---|---|
| Refund policy | The consumer-protection rules of the jurisdiction of sale |
| Tuition currency policy beyond USD | A real FX source and a commercial decision on who carries rate risk |
| Corporate/bulk terms | An actual commercial model |
| Instructor:learner ratios, class sizes, contact hours | Operational reality, not a target |
| Anything described as accreditation or recognition | An accrediting body |

---

## Adopted decisions

*(empty — nothing in this document has been approved)*
