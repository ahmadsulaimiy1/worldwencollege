# Security

*What this server protects, what it does not, and where each claim stops.
An overstated control is worse than a missing one, so the limits are as
prominent as the guarantees.*

---

## 1. Threat model

| Threat | Addressed by | Residual |
|---|---|---|
| An agent destroys an institutional record | Terminal refusal on protected resources, before any approval path | A human with a provider dashboard is unaffected |
| An agent runs a destructive operation by mistake | Approval, bound to exact arguments, single-use, TTL-bounded | See §3 — an agent with a shell can grant its own |
| A credential leaks into a log, an error or a transcript | Value-based redaction; `SecretRef`; the handle vault | A credential not resolved through `SecretResolver` is not registered |
| A compromised host uses the credentials | Least-privilege scoping per provider per purpose | **Real.** Compromise of the host is compromise of the automation |
| Runaway automation exhausts a budget | Spending disabled by default. The price the PROVIDER quotes is checked against the per-purchase limit, the policy currency and the rolling 30-day cap immediately before the irreversible step, and the amount charged is written to the audit record | **Metered spend cannot be bounded per call.** A consultation has no price until it has been made, so the gate refuses the call *after* the one that crossed the cap, not the one that crosses it. **Domain auto-renew, if switched on, is levied by the registrar with no call to this server** and can never be gated, approved or counted. **Provisioning is undeclared:** `neon.project.create`, `cloudflare.d1/r2/kv/queue.create` and `vercel.project.create` create recurring charges as ordinary writes and are outside the spending scope (`SEB-D 28`) |
| Runaway automation exhausts a rate limit | Token bucket and circuit breaker per provider | |
| The audit trail is edited to hide something | Hash chain; verification names the exact broken sequence | **Tamper-evident, not tamper-proof** — see §6 |
| A malicious tool description manipulates the model | Authority is decided server-side; annotations are advisory | |
| DNS rebinding against a local HTTP transport | Loopback bind, bearer token, `Origin` validation | |

## 2. The authority model

Three classes, and the class decides — not the tool's own code
(`SEB §21.3`).

- **read** — always permitted.
- **write** — reversible; permitted autonomously. This is the delegated
  authority, and it is meant to be exercised.
- **protected** — permanently destroys; never autonomous.

**Credential-management carve-out** (ruled by the owner, 6 September
2026, `SEB §16.4`): creating, rotating and deleting a secret, an API key,
or an environment variable — a credential the operator itself manages —
is **write**, not `protected`, across every provider, and needs no
per-call approval. Deleting the *account* that holds those credentials
(a GitHub, Cloudflare, Clerk, Vercel or Resend account itself) is not
covered — no tool performs that action, and none is to be added, the same
way no tool deletes a repository. Every other `protected` classification
(a database, a bucket, a domain, a Worker, a Clerk user or organisation,
a Pages project) governs a resource with real data or a real person
behind it and stays gated pending a separate ruling.

Above them, two absolutes:

1. **A protected resource is never destroyed by this server**, with or
   without approval. The refusal is terminal and offers no approval path.
2. **A purchase is gated by the spending policy**, which ships disabled.

The protected-resource patterns ship naming this estate's real assets —
`*audit*`, `*transcript*`, `*certificate*`, `*registrar*`,
`*student-record*`, `*enrolment*`, `*academic-history*`, `wec`,
`wec-*`, `*-production` and others. Operator patterns are **added** to
that list; the built-ins cannot be removed by configuration.

## 3. What approval does and does not defend against

**Read this section before setting `protectedOperations=approval`.**

An MCP server talks to a *client*, not to a person. Nothing arriving on
the transport proves a human saw it. Three layers stand in for human
authentication:

| Layer | Defends against | Does **not** defend against |
|---|---|---|
| **The host's own permission prompt** — Claude Code and Claude Desktop ask before invoking a tool. The strongest layer, and this server relies on it rather than implementing it; the `destructiveHint` annotation is what tells the host to ask | An agent invoking a destructive tool without the operator seeing it | An operator clicking through prompts habitually |
| **Elicitation** — where the client supports it, the server asks the client to put a specific question to the user, naming the resource and requiring the exact phrase back | The wrong resource being destroyed; a mistaken argument | A client that does not implement elicitation |
| **Out-of-band grants** — a pending request on disk, released only by `stromex-mcp approve <id> --phrase "..."` | **Accidents**: a mistaken call, a runaway loop, a misread instruction | **An agent that also holds a shell on the same machine**, which can run the approve command itself |

**Therefore:** where that last row matters, run with
`STROMEX_MCP_PROTECTED_OPS=deny` and perform deletions by hand. That is
the honest recommendation, and it is the shipped guidance in the
installation guide.

Two further properties, both tested:

- **A grant is bound to the exact arguments it was requested for.** An
  approval for the staging bucket cannot be replayed against production.
- **A confirmation phrase supplied in a tool call is a cross-check, never
  an approval.** The phrase was returned to the caller, so anything that
  could read it could echo it; only the CLI or an elicitation reply grants.

## 4. Credential handling

- **Never in git, a log, an error, a tool result, an issue or a commit
  message.**
- **Redaction is by value, not by key name.** Every secret the process
  resolves is registered, and every string leaving through a log, an error
  or a result is scanned for those exact values — including the password
  component of any connection URI. Key-name redaction fails the moment a
  secret travels under a name nobody predicted.
- **`SecretRef` cannot be printed.** `toString`, `toJSON` and Node's
  inspection hook all return the placeholder. The plaintext comes out only
  through `.reveal()`, which is greppable on purpose:
  `grep -rn '\.reveal()' src/` is an auditable list of every use.
- **Audit records carry a fingerprint, never a value** — enough to tell
  *which* key acted and whether it changed, and nothing more.
- **The handle vault** moves a credential from one provider to another
  without it passing through the transcript. In-process only, never
  written to disk, short-lived, registered for redaction on storage, and
  there is no tool that reads a handle back as text.
- **GitHub repository secrets are sealed** with the repository's public
  key using a libsodium sealed box before leaving the process. A test
  opens the ciphertext with the recipient key to prove the plaintext never
  went on the wire.

## 5. Least privilege

- One credential **per provider per purpose**, scoped to the minimum
  account, organisation, repository set and permission list
  (`docs/installation.md § 3`).
- `STROMEX_MCP_PROFILES` limits which providers are exposed at all.
  Capability surface is part of least privilege, not only credentials.
- `STROMEX_MCP_READ_ONLY=true` for any instance that should only observe.

## 6. The audit trail, and the limit of its guarantee

Append-only JSONL, hash-chained over a canonical serialisation.
`stromex.audit.verify` recomputes the chain and reports the exact
sequence number at which it breaks and which of three things happened: a
record removed or reordered, a record inserted, or a record edited after
it was written.

> **This is tamper-evident, not tamper-proof.** Anyone who can write the
> file can rewrite the chain from a chosen point.

Making it tamper-proof requires an append-only sink this process cannot
rewrite. Supported approaches, in increasing order of assurance:

1. `STROMEX_MCP_AUDIT_PATH` on a filesystem where the server's user has
   append-only permission (`chattr +a` on Linux).
2. Ship the file to a log collector that the server cannot reach back into.
3. Mirror it to object storage with an object-lock retention policy.

Until one of those exists, the guarantee is *evidence of tampering*, not
prevention of it — and that sentence appears in the tool's own
description, so nobody learns it from an incident.

**One known boundary:** arguments that fail the tool's declared schema are
rejected by the MCP SDK before the server sees them, so they produce no
audit record. Nothing happened to audit, but a burst of such rejections is
invisible here — watch the client's own logs for that.

## 7. The HTTP transport — NOT IMPLEMENTED

**This section previously described a transport that does not exist.** It
is corrected here rather than quietly deleted, because somebody read it
and believed it.

`config.ts` builds a complete `HttpTransportConfig` — `enabled`, host
`127.0.0.1`, port `8437`, `tokenSecretName: 'STROMEX_MCP_HTTP_TOKEN'`,
`allowedOrigins` — and **nothing in `src/` reads it.** `serve()` connects
a `StdioServerTransport` and only that. `STROMEX_MCP_HTTP_TOKEN` is never
resolved. There is no `Origin` check anywhere in the source.

So: **the server speaks stdio, and only stdio.** Setting the HTTP
variables changes nothing and protects nothing. If a transport is added
later it must carry the loopback bind, the bearer check and the `Origin`
validation before this section is rewritten in the present tense — and
`SEB §9.7`, which describes the same absent transport, is amended in the
same change.

Found 2026-08-18 by a grounding pass, alongside `SEB-D 31`.

## 8. Reporting a weakness

Treat a weakness in this server as an incident against the whole estate:
it holds seven providers' credentials. Contain, revoke the credentials it
holds, **preserve the audit log without editing it**, record a timeline,
and disclose (`SEB §9.9`).
