# Volume 14 — The Transcript Constitution

*A transcript is not a document the institution stores. It is a claim the
institution makes, on a date, about a record it holds — and that
distinction determines everything.*

---

## §14.1 A transcript is computed, not stored `[OBSERVED]`

`SHRS data-lifecycle-register`, Transcripts row, is unusually clear and is
adopted:

> **Not a stored record.** No `transcripts` table exists anywhere in the
> schema. What every dashboard calls a "transcript" is a live read of
> `term_results`, computed on request — there is nothing to create, so
> there is no creator.

**Consequences.**

- A transcript has **no separate retention period**; it inherits exactly
  the retention of the assessment records beneath it.
- A transcript has **no separate editor**; the only way its contents
  change is by correcting the underlying results, under their own
  authority.
- **Correcting a result changes every transcript ever computed from it.**
  This is the single most important property of the model and the reason
  §14.3 exists.

## §14.2 The live view and the issued document are different objects `[RULED — confidence High]`

The estate currently has only the first, and says so:

| | Live transcript view | Issued official transcript |
|---|---|---|
| What it is | An authenticated screen showing current data | A point-in-time snapshot, sealed, numbered and verifiable |
| Who sees it | The student, their guardian, the Registrar | Anyone holding the document |
| Changes when the underlying result is corrected | **Yes, immediately** | **No** — it is what was true on its issue date |
| Exists today | Yes | **No** (`SHRS certificate-transcript-system`, "honestly still missing") |
| Verifiable by a stranger | No | Must be |

**Binding.** The two are never conflated in language or in interface. A
screen is not "your transcript"; it is "your academic record". An issued
transcript says, on its face, the date on which it was true.

## §14.3 An issued transcript is a superseded document, never a corrected one `[RULED — confidence High]`

Derived directly from `SEB §26.3` and `SEB §2.2`.

When an underlying result is corrected after an official transcript has
been issued:

1. The issued transcript is **not edited** and **not withdrawn from
   existence**. It was a true statement of the record on its date.
2. A **new** official transcript is issued, with its own reference number
   and issue date.
3. The old one is marked **superseded by** the new one, and its
   verification result says so — the same three-state honesty as a
   certificate (`SEB §12.2`), with "superseded" as a fourth state carrying
   the successor's reference.
4. A third party holding the old document, checking it, is told plainly
   that a later version exists. **That is the entire point of the
   mechanism**, and it is why the verification endpoint must be public and
   must never simply return "not found" for a superseded document.

## §14.4 What an official transcript must carry `[RULED — confidence High]`

Modelled on `SEB §12.2`'s certificate standard, because a registrar
receiving one abroad has exactly the same problem:

- A reference number in the institution's own sequence, generated at
  **issue** time (`SEB §12.3`).
- The date it was issued and the date-range it covers.
- The student's name as recorded, and their identifier.
- The awarding institution's full legal name — and, where the institution
  is not accredited, **an Institutional Status statement saying so on the
  document itself** (`SEB §2.4`). A transcript that lets a reader assume
  accreditation is a transcript that misleads by omission.
- The grading scale, in full, **on the document** — a foreign registrar
  cannot look it up.
- Where a programme is delivered online, that it is. `AMC-D` records a
  predecessor institution's policy of omitting online delivery from
  certificates, and records why it was **deliberately not carried over**:
  an accreditation reviewer would read it as concealment.
- A QR code resolving to the public verification endpoint.

## §14.5 Notional learning hours are recorded alongside mastery `[OBSERVED — critical]`

`AMC-D A-1`, a peer-review finding rated **critical**: a programme that
progresses students by mastery with no notional learning hours produces an
institution that is **un-accreditable and whose awards are
untransferable.** Partially remedied at `AMC-EB §33.2a` by recording
notional hours as *a second record* alongside the mastery gate.

**Binding on every academic system in the estate.** Whatever the
progression model — CEFR levels, mastery gates, Hifz stages, unit counts —
**notional learning hours are recorded as a parallel, first-class field
from the first migration.** Retrofitting them means recomputing history
that was never captured.

## §14.6 Transcripts of a partial record say so `[RULED — confidence High]`

Where an institution has three schools and an assessment model for two of
them, the transcript **names the third and says it has no record yet** —
which is what the estate already does on-screen: the student dashboard
"explicitly states that Islamic and Arabic Studies has no transcript yet"
rather than silently omitting the third type.

A transcript that omits a subject area a student actually studied is a
false document, however accurate its other rows are.

## §14.7 Averages are computed, never asserted `[OBSERVED]`

The term average shown on a transcript is the arithmetic mean of the
recorded scores for that term, computed at read time from the same rows a
reader can see — **never a separately-stored figure that could drift from
the data beneath it.**

Where a weighted or excluded calculation is required, the rule is
published with the number, on the document.

## §14.8 Retention `[OBSERVED, with an open question]`

- The **underlying assessment records**: enrolment + 7 years after
  graduation or withdrawal, per `SHRS IT-04 §7.1` — **proposed, pending
  Board confirmation**, and a common school-sector benchmark rather than a
  verified Nigerian statutory requirement.
- The **issued official transcript**: `[OPEN]` — `IT-04` does not name it.
  `SHRS data-ownership-register` flags it as "arguably permanent, like
  Ijazah, since a certificate is a credential someone may need to prove
  decades later" and declines to default it.

**This Bible declines too** (`SEB §28.4` Q4), and until it is ruled, the
operative rule is `SEB §26.2`: no destruction mechanism is built. In
practice that means every issued transcript is kept.

## §14.9 The transcript is where the estate's honesty is tested `[RULED — confidence High]`

Everything upstream — the record, the correction discipline, the
supersession chain, the accreditation status, the grading scale — reaches
a stranger in one page. A transcript is therefore the **G6 truth gate**
(`SEB §3.12`) made physical, and no transcript is issued from a system
that cannot answer, for every figure on it: *where did this come from,
when was it true, and what would let a reader check it?*
