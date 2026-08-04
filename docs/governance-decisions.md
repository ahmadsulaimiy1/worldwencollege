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

### A5. Whether staff should hold financial and erasure powers
**Raised by:** writing down the access level of every administrative
endpoint (`tests/admin-route-guards.test.mjs`). Doing that made the
current answer visible for the first time, and it is broader than it
looks. Today **any staff account** can:

| Endpoint | What it does |
|---|---|
| `GET /api/admin/reports/revenue` | Read total revenue for any period |
| `GET /api/admin/reports/reconciliation` | Read the payment reconciliation |
| `POST /api/admin/currency/set-rate` | Fix the exchange rate a currency is charged at |
| `POST /api/admin/currency/refresh-rates` | Pull live rates and update tuition pricing |
| `POST /api/admin/recordings/purge` | Destroy learner voice recordings (dry-run by default) |

Every one of those is *documented* as staff-only, so the code matches
its stated intent — this is not a defect. It is a question nobody has
been asked: should a language tutor be able to read the institution's
revenue, change what learners are charged, or delete their coursework?

**Recommendation:** move the four financial endpoints and the purge to
administrator, and leave learner records at staff. Teaching staff need
learner records; they do not need the accounts, and the purge is
irreversible destruction of learner work.

**Cost of the change, stated honestly:** whoever handles finance would
then need administrator access, which under A1 means access to every
learner record too — so the recommendation trades one over-grant for a
different one. That trade is only avoidable with a fourth role, which
is A4. **A4 and A5 should be decided together.**

**Not changed unilaterally.** The role.js guard was fixed because the
code contradicted its own documented contract; these do not. Who may
touch money and who may destroy learner work are decisions for the
institution, and quietly tightening them would be inventing policy by
another route.

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

### C4. The IEFC award architecture
**Recommendation:** adopt `docs/iefc-award-architecture.md` (second
reading) in full — six named awards of **standing** (Aspirant,
Candidate, Associate, Envoy, Orator, Laureate), post-nominals
ApWEC–LrWEC, five honours, one Alumni Society with six Chapters, the
Register of the Ascent, and four College traditions.

**What changed at second reading.** The first draft proposed a ladder of
*capability*; the Executive returned one of *standing* and was right.
Capability language duplicates the qualification descriptors and dates
badly — "Communicator" is a word of its decade. Standing language does
not: aspirant, candidate, associate, envoy, orator and laureate will
still be legible when everyone who founded this College is dead. That is
the correct test and it decided the ladder.

**Two sub-decisions the Board has separated out because they are not
naming questions:**

- **C4a — the office of Chancellor.** The Executive asked for a
  "Chancellor's Distinction". WEC-LC has no Chancellor and, by the
  standing rule against fabricated leadership, cannot print one on a
  certificate. Either constitute the office as a real appointment, or
  adopt **"the Distinction of the College"** until one exists.
  **Recommendation: the latter now, the former when there is a
  Chancellor.**
- **C4b — the Professional Interpreter Pathway.** Held back
  deliberately. Interpreting has established certification regimes and
  the consequences of under-qualified interpreting fall on third parties
  — a patient, a defendant — who never chose the College. It is the one
  item in the architecture capable of harming someone who is not a
  student, and must not launch on enthusiasm.

**What it changes about C1:** C1 proposes a Certificate of Completion
per level. C4 supersedes that with a *named award* per level, because a
"Certificate of Completion in Level III" is a receipt and an "English
Communicator of Worldwide English College" is an achievement, and the
difference decides whether a learner continues to Level IV. **Approving
C4 approves C1 as amended.**

**What it depends on, and cannot proceed without:**
- **C3** — the Level Address is the spine of every conferral. If
  speaking does not count toward certification, this architecture has no
  spine and should not be adopted in this form.
- **B1/B2** — no honour can be conferred without a pass mark.
- **B4** — an award becomes due when a level is "completed", and that
  word has no definition yet.
- **D1/D2** — the First Word tradition keeps a learner's voice for years
  and replays it publicly. That needs consent for that specific purpose,
  taken when the recording is made.

**One item is not a decision but a task:** a designation and trade-mark
search on all six post-nominal strings before any of them is published.
The Board is not aware of collisions; that is not the same as having
checked.

**Explicitly NOT claimed anywhere in it:** accreditation, regulatory
recognition, equivalence to a degree or to any external test, or a
proficiency level above CEFR C2. "Beyond CEFR" means broader in what is
certified, never higher on the scale — the second is a benchmarking
claim with nothing behind it and would fail on first serious reading.

**Decision:** ☐ awaiting

### C3. Whether speaking assessment counts toward certification
**Recommendation:** not yet. Learner recordings are stored and can be
reviewed, but no moderated marking standard exists, and certifying
against an unmoderated single-reviewer score is not defensible.

**Decision:** ☐ awaiting

### C5. Who may confer, withdraw and replace an award
**Currently:** `conferAward()`, `revokeAward()` and `replaceAward()` are
library functions with no actor argument and no administrative endpoint.
That is deliberate and should not be read as an omission: until the
Board settles this row there is no correct answer to put in an
authorisation check, and a plausible-looking one would be worse than an
absent one. Nothing can reach these functions over HTTP today.

**Recommendation:** conferral on the authority of the Registrar acting
under a Board-approved pass list; withdrawal and replacement by the
Registrar with a recorded reason, **countersigned by one other officer**.
The countersignature matters more than it looks: withdrawing an award is
the one operation in the system that destroys something a person owns,
and it should not be within the unilateral power of any single account,
including the founder's.

**Rationale:** the register is tamper-evident, which means an improper
conferral cannot be quietly undone — it can only be visibly revoked. The
control has to sit *before* the write, because after it the record is
permanent by design.

**Decision:** ☐ awaiting

### C6. Whether the browsable register is opt-in or opt-out
**Currently:** `public_consent` defaults to **off**. A graduate's award
is verifiable by code — the code is something they chose to hand
someone — but they do not appear in the browsable register unless they
say so.

**Recommendation:** keep it opt-in. The opposite reading is defensible —
a public register of graduates is an ordinary academic tradition, and the
College's own honours architecture is weakened if the roll is thin — but
opt-in is the only default that is safe for a graduate whose safety
depends on not being findable, and the College cannot know which
graduates those are. A prompt at conferral will recover most of the
difference honestly.

**Rationale:** this is also the cheaper mistake to correct. Asking
graduates to opt in later is an email; removing a name that was
published without being asked is an apology.

**Decision:** ☐ awaiting

### A6d. Mapping the curriculum to the competency framework
**This is the largest gap between the College's constitutional document
and its platform, and it was found by building the graduate profile.**

`docs/academic-framework.md` § IV states the rule that distinguishes the
IEFC from a repackaged proficiency scale:

> every assessment maps to at least one competency, and every competency
> is assessed at least three times per level. A competency assessed once
> is an aspiration.

Nothing implemented it. There was no competency table, no mapping from
assessment to competency, and no per-competency mark; rubrics are prose
inside a text column and a graded submission carries one aggregate score.
The framework's related requirement — "marks by skill and by competency,
not one aggregate" — is equally unimplemented.

So the College's central academic claim was a document rather than a
system. An accreditation reviewer asking *"show me competency 5 was
assessed three times at Level IV"* could not have been answered.

**What has been built:** the spine — `competencies` (the six, quoted from
the framework), `assessment_competencies`, `competency_marks` — and
`competencyCoverage()`, which measures the rule and currently reports
**0 of 360 assessments mapped, 36 shortfalls**. Visible at
`GET /api/admin/quality/competency-coverage`.

**What has deliberately NOT been done:** the mapping itself. Deciding
which competencies each of 360 assessments assesses is academic work for
the Academic Director. Generating it here would have produced exactly the
fabricated academic record the Executive forbade, and it would have been
undetectable — a plausible mapping looks like a real one.

**Recommendation:** commission the mapping as a defined piece of academic
work before any award is conferred. Until it exists, the graduate profile
reports competency attainment as *unmapped* rather than showing a score,
and should continue to.

**Decision:** ☐ awaiting

### A6e. Restructuring rubrics to carry competency marks
Consequent on A6d. Marking against six competencies needs rubrics with
structured criteria, not prose. The existing prose rubrics are
pedagogically sound and were normalised to the rubric policy; they simply
cannot be marked against machine-readable criteria.

**Recommendation:** restructure alongside A6d rather than separately —
mapping assessments to competencies and giving those assessments
competency criteria are the same piece of work seen from two ends.

**Decision:** ☐ awaiting

### C7. The graduate profile: publication defaults
**Currently implemented:** every field of a graduate profile defaults to
private. Publication is per-section (awards, transcript, competencies,
CPD, study time) rather than one switch, because they are separate
decisions — a graduate may want an employer to see their awards and not
their study hours.

Share links are scoped, expiring (1–365 days, never indefinite),
revocable, and stored only as a hash so the College cannot reproduce a
link it issued. A share's scope is **intersected** with current
visibility, never unioned: turning a section private removes it from
every link already issued.

**Recommendation:** ratify these as the College's standing defaults. They
are engineering decisions taken under the autonomy granted, and they
carry data-protection weight, so the Board should own them.

**Decision:** ☐ awaiting

### C8. Study time on a graduate's record
Measured time on task says how long someone struggled. It is reported
separately from TQT and never conflated with it — TQT is the College's
design figure for the qualification and is identical for every holder,
whereas measured time differs per person, and presenting a learner's own
hours as their qualification time would mean a fast learner held a
smaller qualification.

**Recommendation:** confirm that measured study time is never published
by default and never appears on a certificate or transcript. It is
formative information for the learner, not a property of the award.

**Decision:** ☐ awaiting

### A7. Three institutional metrics have no instrument at all
**Raised by:** building the Institutional Metric Register
(`functions/_lib/reports/institutional.js`). Asked to report on twelve
executive KPIs, the platform can compute five, has three blocked behind
A6d, and has **no data collection whatsoever** for three:

| Metric | What is missing |
|---|---|
| Live session attendance | `live_sessions` exists; nothing records who attended |
| Academic misconduct | No case register, no documented procedure |
| Student feedback | No instrument collects learner opinion |

**Why this is recorded rather than quietly built:** each is an
institutional process first and a table second. An attendance table is
trivial; deciding what attendance *means* for an asynchronous online
programme is not, and a misconduct register without an approved
procedure would invite staff to record allegations against learners with
no defined process, no right of reply and no appeal. That is worse than
having neither.

**Recommendation:** take them in this order.
1. **Attendance** — lowest risk. Needs one decision: does attendance mean
   presence at a live session, or engagement with the module? The
   platform can measure both.
2. **Student feedback** — needs an instrument and a decision on
   anonymity. Anonymous feedback is more honest and harder to act on.
3. **Academic misconduct** — needs an approved procedure BEFORE any
   register exists, including right of reply and appeal (see C9).

**Meanwhile the register reports them as `not_instrumented`**, never as
zero. "No cases recorded" and "no cases occurred" are different
statements and only the first is true.

**Decision:** ☐ awaiting

### C9. Academic misconduct procedure
**Prerequisite for A7 item 3, and recorded separately because it is a
governance document, not a feature.**

**Recommendation:** the Board adopts a procedure covering: what
constitutes misconduct on an online language programme (the common cases
being submitted work that is not the learner's own, and impersonation in
a spoken assessment); who investigates; the learner's right to respond
before a finding; the range of outcomes; and an appeal to someone not
involved in the original decision.

**Rationale:** the platform stores voice recordings and written
submissions, which makes detection possible and therefore makes the
absence of a procedure a live risk rather than a theoretical one. A
finding made without a documented process is not defensible, to the
learner or to a future reviewer.

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

### D3. Erasure against a permanent academic register
This row exists because the Graduate Register creates a genuine conflict
with D2 that I do not want discovered by a graduate's solicitor rather
than by the Board.

**The conflict:** the register is designed to be permanent and
tamper-evident. Deleting a row breaks the hash chain for every award
conferred after it, and `verifyChain()` will report the register as
broken from that point forward — which is exactly the behaviour that
makes the chain worth having. So a request to erase an award record
cannot be honoured the way a request to erase a voice recording can.

**Recommendation:** treat a conferred award as a record the College
holds in the public interest and in the interest of every party who may
rely on it, and **do not** delete it on request. Offer instead: removal
from the browsable register (immediate, unconditional, no reason
required), and suppression of the holder's name from the verification
response, leaving the award verifiable as an award. What cannot be
offered is making a conferred qualification un-checkable, because the
people harmed by that are third parties who acted on it.

Whether that position holds under UK GDPR is a legal question and not
mine to answer. What I can say precisely is what the system does and why
it cannot quietly do otherwise, which is what this row is for. It should
be settled **before the first conferral**, not after — the architecture
is much easier to change while the register is empty.

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

Recorded here when the Executive takes them, with where each one lives
in the code. A decision that exists only in prose is a decision nobody
can check.

### G1 — Executive Portrait Policy *(adopted 4 Aug 2026)*

Every graduate **may** upload a professional portrait. Optional, never
required. Square, professional appearance. Reviewed before publication.
Removed immediately if an award is withdrawn or at the graduate's
request. **Certificates and verification remain valid regardless of
portrait status.**

- `functions/_lib/registry/portraits.js`; columns on `graduate_profiles`
  (migration 013).
- The final clause is enforced structurally rather than by convention:
  the portrait lives on the profile, nothing in the module touches
  `awards`, and `tests/governance-decisions.test.mjs` verifies an award,
  removes the portrait, and verifies again — comparing the two results
  field by field, not merely checking both say "valid".
- Sabotage-verified: adding a JOIN from `awards` to
  `portrait_status = 'published'` makes a real award report `not_found`,
  and the test catches it. That is the precise failure the clause exists
  to prevent.

### G2 — Alumni Chapters *(adopted 4 Aug 2026)*

One real organisation — the **Worldwide English College Alumni Society**
— with six chapters, one per IEFC award: Aspirant, Candidate, Associate,
Envoy, Orator, Laureate. A graduate belongs to the chapter of their
highest award, automatically.

- `functions/_lib/registry/alumni.js`; `alumni_chapters` (migration 013).
- **Membership is derived, never stored.** It is already a fact in the
  awards table; a copy would go wrong the first time an award was
  revoked. Revoking a Level V award returns the holder to the Associate
  Chapter with nothing to update.
- No officers are seeded and none are invented. Chapters record
  `officers_elected = 0` until members elect them.

### G3 — Skill descriptors, not percentages *(adopted 4 Aug 2026)*

Attainment is reported as one of five ordered descriptors — Emerging,
Developing, Proficient, Advanced, Distinguished — never as a percentage.

- `skill_descriptors` (migration 013); `descriptorScale()` and
  `approveThreshold()` in `functions/_lib/registry/skills.js`.
- **The descriptors are decided; the thresholds are not.** Nobody has
  said what evidence makes a graduate Proficient rather than Developing,
  and that is a harder academic question than naming the bands. The
  threshold column is nullable with no default, because a default would
  *be* the decision, made by whoever typed the migration.
- A descriptor therefore needs **two** approvals: the assessment-to-skill
  mapping, and the threshold. With only the first, the profile reports
  `thresholds_pending` — a third state, distinct from both "not
  assessed" and an answer.
- `approveThreshold()` refuses a set of thresholds that does not rise
  with the scale, once, rather than defending the ordering at every read.

### G6 — The definition of the IEFC *(adopted 4 Aug 2026)*

> IEFC is an advanced academic qualification built on CEFR proficiency,
> extending it through competency verification, leadership, professional
> communication, critical thinking, authentic assessment, and
> independently verifiable digital credentials.

- `programme_definition` and `programme_claims` (migration 015);
  `functions/_lib/registry/programme.js`.
- Stored **whole**, because a definition paraphrased differently on each
  page is not a definition — and **decomposed into its seven claims**,
  because the standing rule is that every public claim must be
  verifiable and a sentence cannot be verified as a whole.
- The position today, derived from live data rather than asserted:

  | Element | State |
  |---|---|
  | CEFR proficiency | Evidenced |
  | **Competency verification** | **Not evidenced** |
  | Leadership | Partial — taught, not yet assessed against a framework |
  | Professional communication | Evidenced |
  | Critical thinking | Evidenced |
  | Authentic assessment | Evidenced |
  | Verifiable digital credentials | Partial — development-mode signing key |

- **The gap is the load-bearing one.** Zero of the sixty assessments are
  mapped to any competency, so nothing has been verified against any
  competency for anybody. That is the element distinguishing an advanced
  academic qualification from a well-built CEFR course, and closing it is
  BASCE's founding task.
- `publishableStatement()` returns the sentence and its caveat as
  separate fields, so no page can render one without the other while an
  element is unevidenced.
- The two derivable states are **re-derived on every read** and a
  disagreement with the stored row is reported. This is deliberately
  bidirectional: when BASCE completes the mapping, the observation moves
  on its own rather than leaving the College understating itself.

### G5 — Principle of Institutional Verification *(adopted 4 Aug 2026)*

Every verification result distinguishes three **independent** layers of
trust, and never averages them:

| Layer | The question it answers |
|---|---|
| Identity authenticity | Is this the person the College awarded? |
| Credential integrity | Has this credential been altered? |
| Institutional standing | What is the status of this award today? |

- `functions/_lib/registry/institutional-verification.js`;
  `/api/verify/institutional/:code`; the panel on `/verify.html`.
- The reason to separate them is that they genuinely disagree. A
  withdrawn award reports **identity verified, integrity verified,
  standing failed** — simultaneously. Every single-verdict system gets
  this wrong in one of two serious ways: "invalid" accuses a real person
  of forgery, "valid" admits them on a qualification the College has
  withdrawn.
- Asserted directly, in the module tests and again in the browser, and
  sabotage-verified in both.
- The summary is led by **standing**, never by a count of passing
  checks. The dangerous misreading is a withdrawn award with impeccable
  paperwork.
- A development-mode signature is its own state, styled its own colour —
  neither green nor red. Folding it into "verified" would be the
  overclaim decision P2.1 forbids; folding it into "failed" would be a
  false alarm about a genuine credential.

### G4 — Board of Academic Standards and Curriculum Excellence *(established 4 Aug 2026)*

**BASCE** is the authority for the competency framework: defining
competencies, mapping every assessment to one or more of them, ensuring
each is assessed multiple times across each level, approving descriptors,
reviewing mappings annually, and maintaining the framework's integrity.

The **Academic Senate** is recorded alongside it as the authority for the
language-skill mapping and its descriptor thresholds.

- `academic_bodies` (migration 013).
- **Established, not yet constituted.** `members_appointed` is 0 and no
  members are seeded. A board with invented members would be worse than
  no board, and every interface must be able to say which of the two this
  is.
- This supersedes governance item A6d as the route to a competency
  framework: the blocker is no longer "somebody should map the
  curriculum" but "BASCE should be constituted and should map it".
