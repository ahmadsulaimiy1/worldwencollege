# Volume 11 — The DevOps Constitution

*How change reaches production, and how it is taken back.*

---

## §11.1 Every change is a reviewable diff `[OBSERVED]`

Nothing changes production except through a commit. Configuration,
schema, policy, content and infrastructure definition are all code, in
git, reviewed, and revertible. **A change applied by hand in a provider
dashboard is an undocumented change**, and its first cost is that the next
deployment silently reverts it.

Where a change genuinely cannot be expressed as a commit — a provider
console action with no API — it is recorded in the infrastructure
inventory (`SEB §10.9`) with the date, the actor and the reason, and the
gap is named (`SEB §2.3`).

## §11.2 One document at a time, verified in the output `[OBSERVED]`

The estate's own release discipline, from `SHRS policy-code-index`
("Publication actions taken"), and it is unusually strict for a reason:

> Each publication was individually rebuilt, verified for HTML tag
> balance, and verified for the new policy code's presence **in the built
> output** before being committed and pushed — **one document at a time,
> not batched and assumed correct.**

**Binding.** A risky, repetitive change is applied and verified one unit
at a time. Batching is permitted only where a single verification covers
the whole batch, and "it built without errors" is not that verification.

## §11.3 Deployment is a pipeline, and the pipeline is the only path `[RULED — confidence High]`

| Stage | Gate |
|---|---|
| Commit | Typecheck, lint, unit tests |
| Pull request | Full suite including the real-producer tests (`SEB §23.2`) and the responsive gate (`SEB §6.1.2`) |
| Preview deploy | Automatic, per branch; the health check runs against the deployed preview, not against localhost |
| Merge | Only with a green preview |
| Production deploy | Automatic from the default branch; a post-deploy health check runs; a failing health check triggers rollback |

`[OBSERVED — gap]` `SHRS` has **no CI pipeline at all** — "no
`.github/workflows/` directory exists anywhere in this repo's history."
`WEC` has workflows. Bringing every project onto one pipeline is
Volume 24's first infrastructure task.

## §11.4 Rollback before roll-forward `[RULED — confidence High]`

Every deployment has a named, tested way back, and the way back is
exercised at least once per project — not first attempted during an
incident.

- **Application:** redeploy the previous build artefact, not a revert
  commit. A revert commit is a new build with new risk.
- **Schema:** migrations are forward-only and **additive first** — add the
  column, backfill, switch the reader, then stop writing the old one, then
  (much later, and only under `SEB §26.2`) consider removing it. A
  migration that cannot be rolled back is designed so it does not need to
  be.
- **Configuration and secrets:** the previous value is recoverable,
  because a pre-image was recorded before it was changed
  (`SEB §21.5`).

## §11.5 Health checks exercise the dependency `[RULED — confidence High]`

A health endpoint that returns `200 OK` from a process that is up and
disconnected is worse than none: it converts an outage into a silent
outage. A health check reaches the database, the object store and the mail
provider — cheaply, read-only — and reports each one separately.

The MCP's `stromex.health.check` is written to this standard: it performs
one authenticated read per configured provider and reports per-provider
status, latency and the circuit-breaker state, with the credential
fingerprint (never the credential) so an operator can tell *which* key
answered.

## §11.6 Logs go to stderr; stdout belongs to the protocol `[RULED — confidence High]`

Generalised from a real constraint: on the MCP's stdio transport, stdout
carries JSON-RPC, and one stray `console.log` corrupts the stream and
kills the session with an unhelpful parse error.

The general rule: **a process's structured output channel is not a place
to talk.** Logs are structured, one event per line, on the diagnostic
channel, and they pass through value-based redaction on the way out
(`SEB §9.2`).

## §11.7 Secret rotation is a rehearsed procedure `[RULED — confidence High]`

A rotation that has never been executed is a plan, not a procedure. Each
provider's rotation is documented as: create the new credential → install
it alongside the old → verify with a read → cut over → verify again →
revoke the old → record the fingerprint change in the audit log.

The **verify-before-revoke** ordering is the whole point. The estate's
existing shared secrets are non-rotating (`SEB §9.3`), which is precisely
the state this article exists to end.

## §11.8 Failure handling is uniform `[OBSERVED — from the MCP's core]`

Every outbound call in the estate should carry the same properties, and
they belong in one shared client rather than in each integration:

- **Timeouts** on every request, always.
- **Retry with full jitter**, not fixed exponential backoff: when several
  callers fail against the same provider at the same moment — which is
  exactly what a provider incident produces — fixed backoff
  re-synchronises them into a thundering herd on every wave.
- **Retry only what is safe to replay.** A request that never reached the
  server is safe whatever its method; a request that *timed out* may have
  been applied, so a non-idempotent one is not replayed.
- **Honour `Retry-After`**, bounded, so a mistaken or hostile header
  cannot park a call for an hour.
- **A circuit breaker per provider**, tripped only by *infrastructure*
  failures — a 404 means the provider is healthy and the resource is not
  there, and counting it would trip the breaker on a working provider.
- **A rate limiter per provider**, so a fan-out over forty records does
  not earn a 429 that is then retried into a second 429.

## §11.9 Idempotency `[RULED — confidence High]`

Every workflow step is written so that running it twice is safe, because
every workflow will eventually run twice. Where a provider offers an
idempotency key, it is used. Where it does not, the step reads before it
writes and reports "already in the desired state" as a success, not as a
conflict.

## §11.10 The deployment report `[OBSERVED]`

Every deployment produces a record: what changed, which commit, which
environment, who or what triggered it, the health-check result, and — if
anything was skipped or failed — what and why. `SEB §26.8`'s vocabulary
applies to every status word in it.

The MCP produces this report automatically for every workflow run; a
deployment performed by hand produces it by hand.
