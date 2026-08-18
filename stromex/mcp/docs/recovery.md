# Recovery

*What to do when something is gone, broken, or not what you expected.
Read §1 before doing anything else.*

---

## 1. First, do not make it worse

Three rules, in order:

1. **Do not edit the audit log.** It is the record of what happened, and
   editing it destroys the only account you have. If it is already broken,
   §5 covers that.
2. **Do not delete anything to clean up.** The estate's rule is archive,
   supersede, revoke, deactivate (`SEB §26.1`), and it applies hardest
   during an incident, when judgement is worst.
3. **Read the recovery journal before acting.** Whatever was destroyed,
   its pre-image is probably there.

```sh
stromex-mcp audit --limit 100
```
```
stromex.recovery.list { "limit": 25 }
stromex.recovery.get  { "id": "jrn_..." }
```

## 2. Something was deleted and should not have been

The recovery journal holds what the resource looked like immediately
before, plus a restore hint in words.

**What a pre-image can rebuild:**

| Resource | Recoverable | How |
|---|---|---|
| A DNS record | **Fully** | Every field is recorded. `cloudflare.dns.create` with the recorded values |
| A KV value | **Fully** | The value is recorded. `cloudflare.kv.value.put` |
| A Cloudflare Queue | **Structurally** | `cloudflare.queue.create`, then re-bind producers and consumers. Messages in flight are gone |
| A Worker | **Configuration only** | Bindings and compatibility settings are recorded. **The script source is not** — recover it from version control |
| A Vercel environment variable | **Metadata only** | Key, target and type are recorded. Vercel does not return an encrypted value; the value comes from its original source |
| A GitHub or Cloudflare secret | **Nothing** | Neither provider discloses a secret value. Recreate from the original source of the credential |
| An R2 bucket | **Configuration only** | The objects are gone. Nothing here restores uploaded files |
| A D1 database | **Metadata only** | The rows are gone. Only a prior `cloudflare.d1.export` restores them |
| A Neon branch | **Metadata only** | Recreate from a parent that still exists. If it held the last copy, nothing here restores it |
| A Clerk user | **In principle only** | The object is recorded, but Clerk cannot re-import a password hash and the user id changes — so every application row keyed to the old id would need remapping. Treat as unrecoverable in practice |
| A Brevo contact | **Attributes and lists** | `brevo.contact.upsert`. Engagement history is not restorable |
| A Resend domain | **The DNS record set** | `resend.domain.create`, recreate the records, then verify |

**The general rule, stated plainly:** a pre-image records
**configuration**, not **data**. Nothing in this server copies the objects
in a bucket or the rows in a database. Where a real backup is possible
through the provider — a Neon branch, a D1 export — take one *before*, not
after.

## 3. A database is wrong after a migration

If the migration ran through `database.provision`, a backup branch was
taken first and named `backup-<label>-<timestamp>`.

```
neon.branch.list      { "projectId": "..." }
neon.backup.restore   { "projectId": "...", "branchId": "<the wrong one>", "sourceBranchId": "<the backup>" }
```

Neon preserves the pre-restore state as its own branch, so the restore is
itself reversible. **Find that branch before deleting anything.**

If no backup branch exists, stop and read `neon.operation.list` and the
project's point-in-time window before doing anything else. Restoring from
the wrong instant is worse than the original fault.

## 4. A workflow failed part-way

Read `unrecovered` in the report first. Each entry is something
compensation could not undo, and each is deliberate — either the
compensation itself failed, or it would have called a protected tool and
was refused.

Then:

1. `stromex.audit.query { "workflowRunId": "wfr_..." }` — every step, in
   order, with its outcome.
2. Undo what remains **by hand**, deliberately, resource by resource.
3. Re-run the workflow only once you know why it failed. Workflow steps
   are written to be safe to re-run; the failure was not.

## 5. The audit chain is broken

```sh
stromex-mcp audit --verify
# AUDIT CHAIN BROKEN at sequence 412: The record hash does not match its contents…
```

The verifier names the sequence number and which of three things
happened. **Do not repair the file.** In order:

1. **Preserve it.** Copy it aside, read-only, with the date.
2. **Establish who could write it.** The chain is tamper-evident, not
   tamper-proof; the question is who had access, not whether the file can
   be fixed.
3. **Read the records before the break.** They are intact and verified,
   and they are what you have.
4. **Start a new log**, and record in it — as the first entry — that the
   previous one broke, at which sequence, and where it was preserved.
5. **Then fix the cause**, which is usually an editor, a log rotation
   tool, or two servers sharing one state directory.

`SEB §26.4`: an audit log that can be edited by the system it audits is a
log of what that system chose to admit. Configure an append-only sink
(`docs/security.md § 6`) so the next break cannot happen quietly.

## 6. Approvals are corrupt or stuck

- **A corrupt approvals file is not silently replaced with an empty one**
  — that would turn corruption into a free pass. The server refuses to
  read it and says so. Inspect it, then move it aside deliberately; every
  pending grant is lost, which is the safe direction.
- **A grant that will not consume** is expired, already used, or bound to
  different arguments. All three are correct refusals. Call the tool again
  to raise a fresh request.

## 7. A credential is compromised

1. **Revoke at the provider first.** Not last.
2. Issue a replacement with the same scope; install it; `doctor`.
3. `stromex.audit.query { "provider": "<name>" }` — every action taken
   with the old key is there, by fingerprint. Read all of it.
4. Look for anything you did not authorise, and treat each as its own
   incident.
5. Record the rotation and what the review found.

## 8. The server will not start

| Symptom | Cause | Fix |
|---|---|---|
| `CONFIG_INVALID: env file … readable by other users` | Mode is not 0600 | `chmod 600 <file>` |
| `CONFIG_INVALID: STROMEX_SPEND_ENABLED is true but no positive limits` | Spending on with no ceiling — refused deliberately | Set both limits, or unset the flag |
| `CONFIG_INVALID: the Cloudflare token can see N accounts` | The server will not guess which estate to act on | Set `CLOUDFLARE_ACCOUNT_ID` |
| `CREDENTIAL_MISSING` on a tool | That provider is not configured | `doctor` lists what is absent |
| The client reports a JSON parse error | Something wrote to stdout | Nothing but JSON-RPC may. Check any wrapper script |

## 9. Complete loss of the state directory

The audit log, the approvals and the recovery journal are machine-local
and are not backed up by this server. Losing them loses the *record*, not
the *estate* — no provider resource depends on them.

But the record is an institutional asset (`SEB §26.4`). Back up the state
directory with everything else, and if it is lost, record the loss: its
date, what was in it, and why. A gap that is documented is a gap; a gap
that is silent is a question nobody can answer later.
