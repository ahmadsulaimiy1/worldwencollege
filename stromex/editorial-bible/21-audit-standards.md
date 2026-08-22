# Volume 21 — Audit Standards

*An institution is what it can prove it did.*

---

## §21.1 What is audited `[OBSERVED]`

Every action a person could later be asked about. The estate's own
practice already reaches beyond authentication: `auth_audit_log` and
`staff_audit_log` are described as carrying "every sensitive action, not
just logins," and export specifically "requires a logged reason"
(`SHRS role-permission-matrix §4.1`).

**Binding — every one of these produces a record:**

- Authentication: success, failure, lockout, password change, session
  revocation
- Any state change to an institutional record (`SEB §26.1`)
- Every approval: request, grant, refusal, expiry, use
- Every export, with its **reason**
- Every credential use, by **fingerprint**, and every rotation
- Every deployment, migration and configuration change
- Every automated operation against real infrastructure (`SEB §16.10`)
- Every refusal by policy — a denied action is as important as a
  permitted one, and is the record that shows a control operating

## §21.2 The permission vocabulary `[OBSERVED]`

The estate's own, from `SHRS role-permission-matrix §1`. It is used in
audit records, permission matrices, tool definitions and documentation
alike, so that one word means one thing everywhere:

| Code | Permission | Meaning |
|---|---|---|
| **V** | View | Read access |
| **C** | Create | Originate a new record |
| **E** | Edit | Modify an existing record |
| **D** | Delete | **Permanently remove** — granted almost nowhere, on purpose |
| **A** | Approve | Authorise a workflow step |
| **P** | Publish | Make visible to a wider audience |
| **X** | Export | Extract data out of the system — *the most data-protection-sensitive permission after Delete* |
| **Vf** | Verify | Attest a record's authenticity to a third party |
| **Ar** | Archive | Move to an inactive state **without deleting** |
| **MU** | Manage Users | Create or modify accounts and role assignments — *the highest-privilege category, restricted to one role system-wide* |

## §21.3 The three authority classes `[RULED — confidence High]`

Every operation maps to exactly one, and the mapping is reviewed rather
than chosen by its author (`SEB §16.12`):

| Class | Permission codes | Authority |
|---|---|---|
| **read** | V, Vf | Always permitted |
| **write** | C, E, A, P, X, Ar, MU | Autonomous within delegated authority |
| **protected** | D | Never autonomous; never at all on a protected resource |

`X` (Export) sits in `write` but carries a standing obligation: **a logged
reason**, without which the operation does not proceed.

## §21.4 The audit record `[RULED — confidence High]`

One record per action, machine-parseable, containing:

`sequence` · `timestamp` · `actor` · `tool or endpoint` · `provider or
system` · `operation` · `authority class` · `resource` ·
`arguments (redacted)` · `outcome` (ok / error / denied /
approval_required / dry_run) · `duration` · `error code` · `approval id` ·
`workflow run id` · `credential fingerprint` · `previous hash` · `hash`

Three properties are non-negotiable:

1. **Redaction is applied at write time**, by value (`SEB §9.2`) — an
   audit log is the file most likely to be read by a person later.
2. **The credential is identified by fingerprint, never by value** — this
   tells you *which* key acted and whether it changed, without telling
   anyone what it is.
3. **The record is written before the result is returned**, so a crash
   between the side effect and the response does not lose it.

## §21.5 The pre-image `[RULED — confidence High]`

Before any protected step, the system records what the resource looked
like: its provider-reported configuration, the operation, the resource,
the approval id, and a **restore hint** in words for what the API alone
cannot express.

"Back up before deletion" is only a policy if something enforces it. The
policy layer refuses to proceed when a pre-image was required and not
recorded.

**The honest boundary:** a pre-image is *configuration*, not *data*. It
records a DNS record's fields, a bucket's settings, an environment
variable's metadata. **Nothing copies the objects inside a bucket or the
rows inside a database.** Where a real backup is possible through the
provider — a database branch, an export — the workflow that needs it takes
one, and says so.

## §21.6 The chain `[RULED — confidence High]`

Records are hash-chained: each carries the hash of the one before it, over
a **canonical** serialisation (keys sorted, no incidental whitespace),
because otherwise the chain would depend on key insertion order and
verification would fail for records that are in fact untouched.

A verifier recomputes the whole chain and reports the **exact sequence
number** at which it breaks and which of three things happened: a record
was removed or reordered; a record was inserted or edited; or a record's
contents no longer match its own hash.

**This is tamper-evident, not tamper-proof** (`SEB §26.4`). Anyone who can
write the file can rewrite the chain from a chosen point. Tamper-proofing
requires an append-only sink the process cannot rewrite — a WORM bucket, a
syslog collector, an external log service — and until one is configured
the guarantee is *evidence of tampering*, not prevention. **That sentence
is written wherever the guarantee is claimed.**

## §21.7 Audit logs are never deleted, rotated with loss, or edited `[OBSERVED]`

`SEB §26.4`. Where volume requires rotation, the rotated segment is
retained and the chain continues across the boundary.

## §21.8 An audit trail nobody reads is not a control `[RULED — confidence High]`

The article that stops this volume being theatre.

- A **named person** reviews the audit log on a stated cadence
  (`SEB §16.13`).
- The review is itself recorded: what period, who, what was found.
- The system provides a **query** interface, not only a file — filtered by
  time, actor, provider, outcome and authority class, newest first,
  because the question asked of an audit log is almost always "what just
  happened," not "what happened first."
- **Refusals are reviewed as carefully as actions.** A sudden run of
  policy denials is either an attack or a broken workflow, and both are
  worth knowing about within the day.

## §21.9 The archive accession register `[OBSERVED]`

For institutional material — photographs, video, print ephemera, press,
documents, digital captures — the estate maintains a register with, per
item (`SHRS archive-governance §2`):

**accession number** (permanent, never reused) · **description** in one
sentence a stranger can use · **date of record** (when the thing it
documents happened, not the scan date) · **provenance** (who supplied it,
when, and how they know) · **rights** (school-owned / permission-needed /
permission-held / fair-preservation-only) · **basis** (the same confidence
discipline as every other claim) · **SHA-256 file hash**, so tampering or
corruption is detectable decades on.

**An item not in the register is not in the archive, wherever the file
sits.** Custody is two keepers: an accession requires one, **a correction
requires both**. The register is reviewed each term, and anything the term
produced that is not yet accessioned is the review's action list.

## §21.10 Corrections to the audit record `[OBSERVED]`

`SEB §26.3`. A correction is an appended record referencing the one it
corrects, carrying the old value, the new value, the reason and the
evidence. **The original stays.**
