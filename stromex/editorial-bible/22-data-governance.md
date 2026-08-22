# Volume 22 — Data Governance

*Who owns each record, who may act on it, how long it is kept, and who —
if anyone — may destroy it.*

---

## §22.1 Every record type has a named owner `[OBSERVED]`

The estate maintains two complementary registers, and the distinction
between them is the model this volume adopts (`SHRS
data-ownership-register`, `data-lifecycle-register`):

| Register | Answers | Independent of |
|---|---|---|
| **Data Ownership Register** | *Policy*: which office owns a record type, who is responsible day to day, who governs retention, who may approve, export or delete | What code exists |
| **Data Lifecycle Register** | *Systems*: as the platform is actually built today, what creates each record, what can edit it, what approves/exports/archives it, and **whether its retention is enforced anywhere in code or is still a policy statement with no technical backing** | What policy says |

**Where the two disagree, the disagreement is named rather than smoothed
over.** That is the whole point of keeping both, and it is how the estate
discovered that no approval step in one project was system-enforced except
one.

**Binding.** Every system maintains both registers, with these columns:
creator · owner · editor · **approver, marked *enforced* or *recordable***
· export authority · **archive authority** · **destruction authority** ·
retention status, marked *enforced in code* or *policy only*.

## §22.2 Archival and destruction are different events with different authorities `[OBSERVED]`

`SHRS IT-04 §7.6`, the section that made this a constitution volume:

> **Archival and deletion are not the same event, and this project has
> built almost exclusively the first.** Archiving means a record moves to
> an inactive or superseded state but the row still exists and can still
> be read. Deletion means the row is gone.

And the rule that follows (`§7.6.1`), which is `SEB §26.2`:

> No deletion or purge mechanism should be written for any category until
> its **Destruction authority** says something other than "None,"
> "None recommended," "Not yet assigned," or "Data-protection deletion
> request only" **and** that request-handling path is itself built.
> **Silence here is not an oversight to be quietly fixed by whoever next
> touches that endpoint.**

Where an *archival* mechanism already exists, new code may extend or reuse
it freely. **Archival was never the gated thing.**

## §22.3 The retention table `[OBSERVED — every period proposed, none confirmed]`

From `SHRS IT-04 §7.1`. Reproduced because it is the estate's only real
retention answer, and reproduced **with its caveat**, because the caveat
is load-bearing: *every period below is a proposed default grounded in
common school-record-keeping practice, not a period currently applied or
required by a verified statute. The Board, with legal input, must confirm
or adjust each one before it is treated as binding.*

| Record category | Proposed period |
|---|---|
| Guardian portal account | Last linked child's enrolment + 2 years |
| Student academic records | Enrolment + 7 years after graduation or withdrawal |
| Application records | 3 years from decision if not admitted; enrolment + 7 years if admitted |
| Disciplinary records | Enrolment + 3 years |
| **Safeguarding records** | Until the student turns 25, or 7 years from creation, **whichever is longer** — the one category where professional child-protection practice favours long retention, and the one benchmark needing confirmation from a child-protection professional, not merely Board judgement |
| **Ijazah register** | **Indefinite** — already settled (`IQ-02 §7.4`), not re-decided |
| Staff records | Employment + 6 years |
| Fee and payment records | 7 years |
| Visitor logs, security incidents, drill records | **Not yet set** — named as an open item, not implicitly covered |
| Report cards, Hifz records, Muraja'ah records, certificates, transcripts | **Open** — `IT-04` does not name them; arguably permanent. Flagged for the Board, not silently defaulted |

## §22.4 Legal hold `[OBSERVED]`

Where litigation, a regulatory inquiry or an ongoing safeguarding
investigation makes early deletion of a specific record inappropriate,
normal retention is **suspended for that record until the hold is
lifted** (`SHRS IT-04 §7.4`). A retention *period* alone does not answer
what happens when a record becomes relevant to an active matter just as
its period would expire.

## §22.5 Nothing purges, today, anywhere — and that is the correct state `[OBSERVED]`

`SHRS data-lifecycle-register`: "every one of them is currently 'keep
forever, nothing purges it' in practice, because no scheduled job exists
anywhere in this repository. **This is the honest current state, not a
recommendation to build automatic deletion before the Board confirms the
underlying periods.**"

**Binding.** Until `SEB §28.4` Q4 closes, the estate keeps everything, on
purpose, and says so.

## §22.6 Data minimisation `[OBSERVED]`

At each annual review, the record owners jointly reconsider whether every
category still reflects what the systems actually collect. **A new data
category is added to the register before it starts accumulating
un-governed data, not discovered after the fact** (`SHRS IT-04 §7.5`).

`SX-EB Part VIII`: data minimisation by default, encryption in transit and
at rest, **no sale of user data**, regional data-residency options for
markets that require them.

## §22.7 Classification `[RULED — confidence High]`

Four levels, applied to every store, every export and every log:

| Level | Examples | Rules |
|---|---|---|
| **Public** | Published policies, the verification register's response, marketing content | May be cached, indexed, mirrored |
| **Internal** | Architecture, inventories, aggregate figures, audit logs | Never on a public surface; access by role |
| **Confidential** | Individual student, guardian and staff records; assessment data; financial records | Scoped access only (`SEB §4.2`); export logged with a reason |
| **Restricted** | Safeguarding records, identity documents, credentials, health information | Named individuals only; separate store; the tightest deletion authority in the estate; never in an aggregate, a log, or an AI context window |

## §22.8 Aggregate access is enforced, not requested `[OBSERVED]`

The estate's Executive tier holds **aggregate-only** access to student
records — no individual PII — and this is **enforced at the endpoint**,
which rejects any grant whose scope is aggregate from returning individual
records (`SHRS role-permission-matrix §4.1`, `data-lifecycle-register`).

**Binding.** "Aggregate only" is a code path, not a job description.

## §22.9 Personal data in AI context `[RULED — confidence High]`

Derived from `SHRS IT-05 §7.3` and `§7.1`, which require that an AI system
with access to portal data comply with the data-protection policy **in
full** and that it stay within the same access boundaries the portal
itself enforces — "not a broader data access an AI interface might
otherwise make tempting to add."

**Binding.**

1. An AI surface inherits the caller's scope. It never widens it.
2. **Restricted data never enters a model context**, of any provider, for
   any purpose.
3. Whether conversation history is persisted is a stated fact that is
   **re-verified at each review**, because it can change with a feature and
   leave the policy's privacy claims stale.
4. An operator AI's audit log may name a resource; it may not contain the
   resource's contents.

## §22.10 The data-subject request path `[OBSERVED, with an honest gap]`

A real request channel exists in the estate (`privacy_requests`), actioned
by the Registrar. **The request-handling exists; the deletion action it
would trigger does not** — and that is recorded rather than implied.

**Binding.** A data-subject request is answered by a **named human**,
under the retention policy and any legal hold, within the stated period.
It is never satisfied by an automated cascade, and a system that cannot
yet delete says so to the requester rather than silently doing nothing.

## §22.11 Data residency `[OBSERVED — critical and open]`

`SEB §10.6`, `SEB §28.4` Q2. No system holding real personal data reaches
production until its controller, lawful basis and residency position are
written down. This is the estate's most serious open governance item and
it is not an engineering task.
