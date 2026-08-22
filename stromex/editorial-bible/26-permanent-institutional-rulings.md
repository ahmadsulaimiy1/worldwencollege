# Volume 26 — Permanent Institutional Rulings

*The short list. Every rule here outranks convenience, deadline,
elegance, cost and the preference of whoever is currently working. Each is
enforced somewhere in code, and each names where.*

A ruling enters this volume only when it satisfies three tests: it is
**general** (not about one project), it is **irreversible in consequence**
if broken, and it is **enforceable** — something checks it. Rules that are
merely important live in the constitutions.

---

## §26.1 Institutional records are never destroyed by an automated system

**Ruling.** No agent, workflow, script, scheduled job or MCP tool
permanently destroys an institutional record. Ever. Not with approval, not
with a confirmation phrase, not with the Founder watching.

**What is an institutional record.** Certificates · transcripts · student
records · academic history · uploaded documents (identity, evidence,
coursework) · registrar data · Ijazah and Hifz records · disciplinary and
safeguarding records · admissions applications · financial records · audit
logs · governance documents · the archive accession register.

**What is available instead**, and is an ordinary `write` operation
needing no approval: **archive · version · supersede · revoke ·
deactivate** (`SEB §2.2`).

**Sources.** `SHRS role-permission-matrix §2` ("Delete is granted nowhere
on core institutional records"); `SHRS IQ-02 §7.6`; `SHRS IT-04 §7.6`.

**Enforcement.** `stromex/mcp/src/core/policy.ts` — the protected-resource
list is checked *before* any approval path, and a match returns
`POLICY_PROTECTED_RESOURCE`, a terminal refusal with no approval route.
The pattern list defaults are in `DEFAULT_PROTECTED_RESOURCES` and are
extended, never shortened, without a recorded decision.

**The honest boundary.** This stops the *automation* destroying a record.
It does not stop a human with a provider dashboard, and it does not
recover a record destroyed by the provider. Backups are Volume 11's job.

## §26.2 No deletion mechanism is built before destruction authority exists

**Ruling.** No purge job, retention sweep, cascade delete or "cleanup"
capability is written for any record category until (a) an authority has
been named for destroying that category, in writing, by the body entitled
to name it, and (b) the request-handling path that would trigger it is
itself built.

**Source, quoted because it is already binding institutional text** —
`SHRS IT-04 §7.6.1`:

> Where this table says "None exists in code," that is the correct state
> to leave a category in until the Board makes an explicit
> destruction-authority decision for it — **silence here is not an
> oversight to be quietly fixed by whoever next touches that endpoint.**

**Consequence for the MCP.** It ships with no retention capability of any
kind. `SEB §28.4` Q4 gates it.

## §26.3 A correction never deletes

**Ruling.** Correcting a record adds; it does not remove. The prior value,
the date, the reason and the evidence are retained. This applies to the
archive register, to institutional data, to published claims, to policy
documents, and to this Bible.

**Sources.** `SHRS archive-governance §4`; `AMC-EB §46.4`; `SHRS
data-ownership-register` (policy documents: "superseded versions kept in
history, not deleted").

**Enforcement.** `stromex/mcp/src/core/journal.ts` records a pre-image
before any protected step; `audit.ts` is append-only and hash-chained so a
removed record is detectable.

## §26.4 The audit trail is itself an institutional record

**Ruling.** Audit logs are covered by `SEB §26.1` in full. Nothing in the
estate deletes, truncates, rotates-with-loss or rewrites an audit log. An
audit log that can be edited by the system it audits is a log of what that
system chose to admit.

**Enforcement.** Hash-chained append-only JSONL; `stromex.audit.verify`
recomputes the chain and reports the exact sequence number at which it
breaks. `*audit*` is in the protected-resource list, so the MCP will not
delete an audit log even with approval.

**The honest boundary, stated because it matters** (`stromex/mcp/src/core/audit.ts`
header): this is **tamper-evident, not tamper-proof**. Anyone who can write
the file can rewrite the chain from a chosen point. Making it tamper-proof
requires an append-only sink the process cannot rewrite — a WORM bucket, a
syslog collector, an external log service. Until such a sink is
configured, the guarantee is *evidence of tampering*, not prevention.

## §26.5 Two-person control is enforced or it is not claimed

**Ruling.** Where a control requires two people, the system checks that
they are two *different, real, currently-authorised* people, before the
side effect runs — or the document does not say the control exists.

**The reference implementation** is `SHRS approval-workflow-architecture
§3`, and its three properties are the standard: a pending state exists;
separation of duties is a real code check on identity, not on a
hand-typed name; and the approver's authority is checked against the same
permission engine every other endpoint uses.

**The known live exception**, recorded rather than hidden: for Sultan
Hanafi Nursery and Primary School the Registrar and the Principal are the
same individual, so the documented control does not operate there
(`SHRS role-permission-matrix §3`). No system may report that control as
satisfied for that institution. `SEB §28.4` Q5.

## §26.6 Nothing that costs money is bought without an explicit spending policy

**Ruling.** Automatic purchasing is **off** by default. It is turned on
only by an explicit, recorded decision that names: the approved providers,
the maximum single purchase, the rolling monthly cap and the currency.
Every purchase is audited with its reason and its cost. A purchase above
the single-purchase limit stops and asks, and the cap is never exceeded
automatically.

**Source.** `SEB §0.5` — budget ceilings are on the escalation list by
definition. No figure exists anywhere in the corpus (`SEB §28.4` Q3).

**Enforcement.** `PolicyEngine.evaluatePurchase` refuses with
`POLICY_SPEND_LIMIT` while `spending.enabled` is false, which is the
shipped default; it also refuses a purchase priced in a currency the
policy is not denominated in rather than converting, because a server that
converts currencies to decide whether a limit is met is a server that can
be wrong about money.

## §26.7 A credential is never written to a repository, a log, or a tool result

**Ruling.** Secrets live in the environment, in an operator-owned
mode-checked file, or behind an external secret manager. Never in git,
never in a log line, never in an error message, never in a tool result,
never in a comment, never in an issue or a pull request body.

**Sources.** `WEC wrangler.toml` ("Secrets … are deliberately NOT set here
— wrangler.toml is committed to git"); `SHRS shrs-digital-infrastructure-blueprint`.

**Enforcement.** `stromex/mcp/src/core/redact.ts` redacts **by value, not
by key name** — every secret the process resolves is registered, and every
string leaving the process through a log, an error or a tool result is
scanned for those exact values, including the password component of any
connection URI. `SecretRef` cannot be printed: `toString`, `toJSON` and
Node's inspection hook all return the placeholder, and the plaintext comes
out only through `.reveal()`, which is greppable on purpose.

## §26.8 Claims about deployment use the estate's vocabulary, or are not made

**Ruling.** "Live," "production," "deployed," "available," "verified" and
"working" are not used about any system without direct evidence obtained
in the session that makes the claim. The permitted vocabulary is at
`SEB §17.2`.

**Source.** `SHRS digital-campus-master-deployment-directive`, whose
governing rule this is, verbatim.

## §26.9 Qur'anic and hadith text is retrieved, never generated

**Ruling.** No AI system operating under any StromeX or group name
generates Qur'anic text, hadith text, or a chain of transmission. It may
retrieve from a verified corpus and cite it. It may not compose it,
complete it, correct it or paraphrase it as scripture.

**Source.** `AMC-EB §5.7`, adopted at `AMC-D` v0.3 as peer-review finding
S-3, "enforced in code."

**Related and equally binding** (`SHRS IT-05 §5`): an AI system does not
make an admission, disciplinary, academic grading or Ijazah-certification
decision on its own, and must not attempt to handle a safeguarding
disclosure itself — it directs the user to a named human.

## §26.10 Every institutional claim on a public surface carries its basis

**Ruling.** Published facts carry a source and a date, or they carry an
Institutional Status callout saying they are not yet established. There is
no third state.

**Source.** `AMC-EB §46`; `WEC-EB Preface`; `SHRS authority-strategy §4`.

---

## How this volume changes

A ruling is added by amendment under `SEB §0.6`, with its enforcement
point named. **A ruling is never silently removed.** If one is withdrawn,
the entry stays, struck through, with the date, the reason and who
approved it — because the argument for it will be made again by someone
who does not know it was already had.
