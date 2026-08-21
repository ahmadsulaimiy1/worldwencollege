# Operations

*Running the server day to day: what to watch, what to do when something
is wrong, and the routines that keep the controls real rather than
decorative.*

---

## 1. The daily minimum

```sh
stromex-mcp doctor          # every provider answers, and with which key
stromex-mcp audit --limit 50
stromex-mcp audit --verify
stromex-mcp approvals       # anything waiting on a human?
```

`doctor` is the only command that makes a network call to every provider,
and it makes exactly one authenticated **read** each. A provider that is
reachable but whose credential is rejected is reported as unhealthy, not
as up — that distinction is the whole reason the check exists
(`SEB §11.5`).

## 2. Reading the audit trail

```
2026-08-18T09:14:22.481Z  #  128  ok                write     cloudflare.dns.create  A api.example.com
2026-08-18T09:14:31.902Z  #  129  denied            protected cloudflare.d1.delete   wec  POLICY_PROTECTED_RESOURCE
2026-08-18T09:15:02.117Z  #  130  approval_required protected cloudflare.r2.delete   scratch-bucket
```

**Refusals matter as much as actions.** A sudden run of policy denials is
either an attack or a broken workflow, and both are worth knowing within
the day. Query them directly:

```sh
# From a client
stromex.audit.query { "outcome": "denied", "since": "2026-08-18T00:00:00Z" }
```

**An audit trail nobody has read is not a control** (`SEB §21.8`). Set a
cadence, do the reading, and record that you did.

## 3. Handling an approval request

A protected operation returns an approval block instead of acting:

```
Approval required.
  id:     apr_7f3c1a9b2e4d6f8a1b3c
  phrase: DELETE SCRATCH-BUCKET
  stromex-mcp approve apr_7f3c1a9b2e4d6f8a1b3c --phrase "DELETE SCRATCH-BUCKET"
```

Before approving, ask three questions:

1. **Is this the right resource?** The phrase names it deliberately, so
   typing the phrase means you have read the name.
2. **Is there an archive, revoke or deactivate that would do?** Almost
   always there is, and it is an ordinary write needing no approval.
3. **Is there a backup?** The pre-image records *configuration*, not
   data. Nothing in this server copies the objects in a bucket or the rows
   in a database.

Then approve, and call the tool again with `approvalId` and **identical**
arguments. A grant is single-use, expires in fifteen minutes by default,
and is bound to the exact arguments it was requested for.

To refuse: `stromex-mcp reject <id> --reason "use the archive path"`.

## 4. Running a workflow

```
stromex.workflow.list                                   # what is available here
stromex.workflow.run { "workflow": "deploy.prepare", "input": {...} }
stromex.workflow.run { "workflow": "deploy.production", "input": {...}, "dryRun": true }
```

**Always dry-run first.** A dry run constructs every request and sends
none of them, and it is the cheapest possible review of a plan.

Read the report from the bottom up:

- `unrecovered` — **read this first when `ok` is false.** It lists what
  compensation could not undo, and each entry is work for a person.
- `steps[].status` — `ok` · `skipped` · `failed` · `compensated` ·
  `compensation-failed`.
- `warnings` — provider limitations and anything not done.

**Compensation never destroys.** A workflow undoes what it created; a
compensation that would call a protected tool is refused and reported
instead. That is enforced by the engine, not left to the workflow author.

## 5. Deploying

The sequence, and no stage is skipped (`SEB §17.4`):

1. `deploy.prepare` — read-only. Branch exists, CI is green, a rollback
   target exists, providers are healthy.
2. Deploy to preview. Verify **against the preview URL**, not localhost.
3. `deploy.production`, then its verification step — a deployment that was
   accepted and is not serving is the failure this catches.
4. Watch the error rate and the health check for a defined window before
   calling it finished.

Keep the deployment report. It is the change record.

## 6. When a provider is failing

The client backs off with full jitter, honours `Retry-After`, and trips a
circuit breaker after repeated **infrastructure** failures. A 404 does not
trip it: the provider is healthy and the resource is not there.

An open breaker returns immediately with `PROVIDER_UNAVAILABLE` and the
seconds until it half-opens. That is the correct behaviour during an
incident — the fortieth call fails in a millisecond instead of after four
backoff waits.

`stromex.health.check` reports the breaker state per provider.

## 7. Rotating a credential

Rehearsed order, and the order is the point (`SEB §11.7`):

1. Create the new credential at the provider, with the same scope.
2. Install it alongside the old one — in the vault, or the environment.
3. `stromex-mcp doctor`. The fingerprint changes; the check passes.
4. Cut over.
5. `doctor` again.
6. **Then** revoke the old one.
7. The fingerprint change is in the audit log. Note the rotation against
   it.

**Verify before revoke.** A rotation that has never been executed is a
plan, not a procedure.

## 8. Reading the logs

Structured JSON, one event per line, **stderr only** — stdout carries
JSON-RPC and one stray write to it kills the session with an unhelpful
parse error.

```sh
node dist/index.js serve 2> >(tee -a ~/.stromex-mcp/server.log >&2)
```

Every line passes through value-based redaction on the way out.

## 9. Known operational boundaries

Stated here so none of them is discovered during an incident:

| Boundary | Consequence |
|---|---|
| A schema violation is rejected by the MCP SDK before the server sees it | No audit record for it. Nothing happened, but a burst is invisible here — watch the client's logs |
| The handle vault is in-process | A restart empties it. A handle issued before a restart is gone, and says so rather than returning nothing |
| Cloudflare Pages asset upload is Wrangler's | `cloudflare.pages.deploy` triggers a git-connected build; a direct-upload project needs `wrangler pages deploy` |
| A Neon backup is a branch | It protects against a bad migration, not against losing the project |
| Worker tailing returns a session | Streaming is a WebSocket concern this server does not perform |
| The audit chain is tamper-evident | Not tamper-proof until an append-only external sink exists (`docs/security.md § 6`) |
| No adapter has met a real credential in this build | Every claim about provider behaviour is from documentation and scripted tests (`SEB §28.5`) |

## 10. Routines

| Cadence | What |
|---|---|
| Daily, while anything is running | `doctor`; skim the audit tail; clear pending approvals |
| Weekly | `audit --verify`; review every `denied` and `approval_required` record |
| Monthly | Review the protected-resource patterns; review which credentials exist and what they can do |
| Quarterly | Rotate every credential, using §7; re-run the full suite; re-read `docs/security.md § 3` and confirm the posture still matches the machine |
| On any provider incident | Check the breaker state; do not raise limits to push through it |
