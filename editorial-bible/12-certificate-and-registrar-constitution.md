# Volume 12 — The Certificate and Registrar Constitution

*A certificate is a promise an institution makes to a stranger. This
volume is about keeping it for decades.*

---

## §12.1 What a certificate is, and what follows from it `[OBSERVED]`

A credential someone may need to prove **decades after** the institution
issued it, to a party who has no relationship with the institution and no
reason to trust it (`SHRS data-ownership-register`, Certificate row).

Four consequences, and every rule below is one of them:

1. It must be **verifiable by a stranger, without an account**.
2. It must be **permanent** — never deleted, only annotated.
3. Its issuance must be **controlled** — two people, not one.
4. Its numbering must be **an unbroken, meaningful sequence**.

## §12.2 Public verification, no login `[OBSERVED]`

The reference implementation is `SHRS certificate-transcript-system`, and
its shape is adopted as the estate standard:

- `GET /api/certificates/verify?ref=…` — **no authentication**, by design.
  An employer, another school or a scholarship board enters the reference
  number and gets the real record.
- A **QR code** on the printed document encodes the verification URL, so
  the check needs no typing and no instructions.
- The endpoint returns exactly what the certificate is meant to prove to a
  third party: recipient name, credential type and scope, examining
  scholars where applicable, issue date, and **current status** —
  active or revoked, with the revocation note.
- **Three honest states, never a fourth:** genuine/active · revoked (with
  its note) · not found. **Never a fabricated or ambiguous result.**

`[OBSERVED — named gap]` The public endpoint is unmetered. Reference
numbers are staff-assigned and never self-service, so nothing lets a
stranger register a fake one, but unmetered lookups on a public endpoint
are worth revisiting if abuse is observed. Recorded, not solved.

## §12.3 Numbering `[OBSERVED]`

`SHR-<TYPE>-<YEAR>-<seq>` — e.g. `SHR-HFZ-2026-000001` — generated
**server-side** when the field is left blank, so numbering is consistent
across an institution without staff inventing a scheme. Staff may supply
their own to match a pre-existing paper register, and that number is
carried through untouched.

**The number is generated at approval time, not at request time.**
`SHRS approval-workflow-architecture §5` gives the reason and it is a good
one: generating a public reference for a certificate a Principal then
rejects would mean a number exists nowhere in the register but could
confuse a future audit of the sequence.

**Binding.** A gap in a certificate sequence is a question an auditor will
ask. The numbering scheme must be able to answer it.

## §12.4 Issuance is a two-person control, enforced `[OBSERVED]`

The estate's first genuinely enforced joint approval, and the model for
all the others (`SHRS approval-workflow-architecture §4`):

1. The Registrar holds **C** (Create) on certificates, scoped to the
   student's institution — resolved through a real class→institution
   join, so a Principal's "own institution" scope can actually be checked.
2. Issuing **creates a pending approval request**, not a certificate.
   The button says *Request Certificate*.
3. A **different, real, currently-authorised** Principal holding **A**
   (Approve) decides. Separation of duties is checked on staff *id*,
   before the permission check, before any state changes.
4. Only on approval does the certificate row exist, carrying a real
   `approved_by_staff_id` — never an unpersisted, unverified name someone
   typed.

**The known live exception must be honoured, not papered over:** where
Registrar and Principal are the same person, the control does not operate
and no system may report that it does (`SEB §26.5`, `SEB §28.4` Q5).

## §12.5 Revocation, never deletion `[OBSERVED]`

A certificate has **no edit path** for its core fields — type, reference,
date. The only post-issuance write is `revoke`, which sets `revoked_at`
and `revocation_note` and nothing else. `student_id ON DELETE SET NULL`
mirrors the Ijazah permanence pattern so the record survives the student
row.

`SHRS approval-workflow-architecture §4` records a deliberate scope
decision worth preserving: **revocation is a single-role correction path,
not a joint action**, because the permission matrix never granted a joint
authority over it, and because revocation is rare enough and reversible
enough — never a hard delete — that it does not carry the integrity stakes
of first issuing one. **Extending grants that the matrix does not contain
is a governance change, not a code improvement.**

## §12.6 The Ijazah standard `[OBSERVED]`

The strictest record in the estate, and the benchmark every other
credential is measured against (`SHRS IQ-02 §7.6`, `IT-04 §7.1`,
`data-lifecycle-register`):

- **Retention: indefinite. The one already-settled, non-negotiable
  retention answer in the whole estate.**
- **Grant fields are immutable.** No update path exists for them — enforced
  *by omission*, which is stronger than enforced by a check.
- **Deletion is structurally impossible.** No delete path exists in any
  endpoint, by design; `ON DELETE SET NULL` plus a frozen
  `student_full_name` keeps the row meaningful even if the student record
  is later removed.
- **Granting requires a second signatory.** This was the strictest gap in
  the corpus — not "recordable but unenforced" like certificates, but *not
  even recordable*: the request shape had no field for a second signer at
  all. Now migrated to the same request/approve engine.
- **Examining scholars are external.** There is no standing internal
  "Ijazah Coordinator" role; inventing one would misrepresent the
  institution's practice (`SHRS role-permission-matrix §0`).

## §12.7 The Registrar's Office `[OBSERVED]`

**Owner of the student record.** Its authorities, from the estate's
permission vocabulary (`SEB §21.2`):

| Area | Registrar | Principal | Others |
|---|---|---|---|
| Student records | V C E Ar X | V E, own institution | Teacher: V, own classes · DSL: safeguarding fields · Executive: **aggregate only, no individual PII** |
| Guardian records | V C E X | | Admissions: V C at intake · Finance: billing contact fields only |
| Certificates | V, C (once graduation approved) | **A**, own institution | Student/guardian: their own |
| Results | V E (correction only, logged), **A/P/X** | **A**, own institution | Student/guardian: their own |

**Three rules that carry more weight than the table:**

1. **No Delete anywhere.** `status` — active / graduated / withdrawn /
   suspended / archived — is the archive mechanism.
2. **Export requires a logged reason.** Export is "the most
   data-protection-sensitive permission after Delete."
3. **Executive access is aggregate-only, and it is enforced** — the
   endpoint rejects any grant whose scope text matches "aggregate" from
   returning individual PII, rather than trusting the caller to ask nicely.

## §12.8 Every change to a student record is a reasoned event `[OBSERVED]`

Promotions, transfers, withdrawals, graduations and reinstatements are
**timestamped events with an actor and a reason**, never a silent field
overwrite (`SEB §4.8`).

`[OBSERVED — named gap]` Attendance and assessment corrections are
currently upserts with **no history of the prior value**, which
`SHRS data-lifecycle-register` names as a real gap against its own
standard that "corrections should stay visible." Closing it is registered
work, not a discovered surprise.

## §12.9 What the estate has not built, and must not pretend to `[OBSERVED]`

Stated here because a certificate constitution that overstates its own
system is the exact failure mode it exists to prevent:

- **No PDF certificate generation exists.** The verification system
  verifies that a certificate is genuine; it does not produce the printed
  document. Institutions still produce certificates their existing way and
  write the reference number and QR code onto them.
- **No locked, exportable transcript snapshot exists** (Volume 14).
- **No Islamic and Arabic Studies transcript exists**, because that school
  has no assessment data model at all — *confirmed absent, not merely
  unwired*. The student dashboard says so plainly rather than silently
  omitting the third transcript type.

## §12.10 Certificate artwork is a security document first `[OBSERVED]`

The estate holds a substantial certificate design corpus — a design bible,
a press specification, a ground vector, a number cartouche, a
security-document analysis, a master freeze declaration and a revocations
register. Two principles govern how it is used here:

1. **A certificate's design is part of its verifiability.** Ground
   patterns, cartouches and press specifications exist to make forgery
   expensive, not to make the document pretty. Changes to them are
   security changes.
2. **A frozen master is frozen.** A "master freeze declaration" exists so
   that a certificate issued in 2026 and one issued in 2031 are recognisably
   the same instrument. Amending it is a governed act with its own record,
   and old issues are never retro-fitted to a new master.

## §12.11 The registrar's data cannot be destroyed by automation `[RULED — confidence High]`

`SEB §26.1`, restated here because this is where it bites hardest. The MCP
ships with `*certificate*`, `*transcript*`, `*registrar*`,
`*student-record*`, `*enrolment*`, `*enrollment*` and `*academic-history*`
in its protected-resource patterns, and a match is a **terminal refusal
with no approval path**. Archiving, revoking and superseding remain
ordinary write operations.
