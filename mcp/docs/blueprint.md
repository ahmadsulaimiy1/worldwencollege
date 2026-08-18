# The StromeX Enterprise MCP — Blueprint

*The permanent operational layer for every current and future StromeX
project. Derived from the Editorial Bible; every design decision below
cites the article it serves.*

**Status: Designed and partly Developed.** See `SEB §17.2` for what those
words mean and `SEB §28.5` for exactly what has and has not been verified.

---

## 1. What this is, and what it is for

One authenticated, audited, policy-governed surface over the seven
providers the estate runs on — Cloudflare, GitHub, Neon, Vercel, Clerk,
Resend and Brevo — exposed to an AI operator through the Model Context
Protocol.

Its purpose is not "let the model call APIs." It is to make
`SEB §16.8`'s authority model **true in code**: that an agent can design,
build, provision, deploy, repair and monitor autonomously, and **cannot**
destroy an institutional record, exceed a spending policy, leak a
credential, or claim a verification it did not perform.

The estate's own recorded failure mode is the design brief
(`SEB §2.6`): governance language that no code enforces. This server
exists so that the rulings in Volume 26 are not another matrix nobody
implemented.

### What it is not

- Not a shell wrapper. Every operation is a typed, named, classified tool
  with an audit record, not an escape hatch to `curl`.
- Not a credential broker. It never returns a credential to a caller, and
  no tool exists that could.
- Not a data-deletion tool. It has no retention capability at all
  (`SEB §26.2`).

## 2. The five guarantees

Everything in the architecture exists to make one of these true of **all
seven providers**, not of whichever adapter was written most carefully
(`SEB §3.7`).

| # | Guarantee | Where it lives |
|---|---|---|
| **G1** | **A credential cannot be printed.** Secrets are typed values whose string forms are the redaction placeholder; every string leaving the process is scanned by *value* for every registered secret, including the password component of a connection URI | `core/secret.ts`, `core/redact.ts` |
| **G2** | **Nothing destroys an institutional record.** A protected-resource match is a terminal refusal with no approval path | `core/policy.ts` |
| **G3** | **Everything is on the record.** One hash-chained, append-only audit entry per call — including refusals — written before the result is returned | `core/audit.ts` |
| **G4** | **Destructive operations need a human, and the limits of that are documented** | `core/approval.ts`, `SEB §9.8` |
| **G5** | **Failure is uniform and legible.** Timeouts, full-jitter retry, `Retry-After`, per-provider rate limiting and circuit breaking, and errors carrying code + message + remediation | `core/http.ts`, `core/errors.ts`, `core/retry.ts`, `core/ratelimit.ts` |

## 3. Layering

```
      MCP client (Claude Code / Desktop / an agent runtime)
                        │  JSON-RPC 2.0
        ┌───────────────▼────────────────┐
        │  Transport — stdio (default)   │  HTTP: loopback, bearer,
        │             or Streamable HTTP │  Origin-validated (SEB §9.7)
        └───────────────┬────────────────┘
        ┌───────────────▼────────────────┐
        │  Server assembly               │  tool profiles, capabilities,
        │                                │  resources, prompts
        └───────────────┬────────────────┘
        ┌───────────────▼────────────────┐
        │  TOOL REGISTRY — the gate      │  every call passes through,
        │                                │  in this order:
        │   1 validate (zod)             │
        │   2 resolve resource + purchase│
        │   3 POLICY  ── deny ──────────►│  terminal refusal, audited
        │   4 APPROVAL ── required ─────►│  elicit, or out-of-band grant
        │   5 JOURNAL  (pre-image)       │
        │   6 handler                    │
        │   7 AUDIT (always)             │
        │   8 envelope + redact          │
        └───────┬────────────────┬───────┘
                │                │
      ┌─────────▼──────┐  ┌──────▼──────────────┐
      │  Workflows     │  │  Provider adapters  │
      │  (compose      │  │  cloudflare github  │
      │   tools, with  │  │  neon vercel clerk  │
      │   compensation)│  │  resend brevo       │
      └────────────────┘  └──────┬──────────────┘
                          ┌──────▼──────────────┐
                          │  ONE HTTP CLIENT    │  retry · jitter ·
                          │  (fetch injectable) │  rate limit · breaker ·
                          └──────┬──────────────┘  redaction · errors
                                 ▼
                          provider REST APIs
```

**The registry is the whole point.** A tool author writes a handler and a
schema; they do not get to decide whether policy runs, whether an audit
record is written, or whether output is redacted. `SEB §3.7`: one
mechanism, three hundred call sites, and the mechanism knows nothing about
any of them.

## 4. The authority model in code

`SEB §21.3`, `SEB §16.8`.

```ts
type OperationClass = 'read' | 'write' | 'protected';
```

Every tool declares one. The registry evaluates, in this order:

1. **Provider allowed?** — an instance may be restricted to a subset.
2. **read** → always permitted.
3. **read-only mode?** → every mutating tool refused.
4. **dryRun?** → permitted, and the request is constructed and returned
   without being sent. *A dry run is never gated behind approval, because
   requiring approval for a dry run trains operators to approve
   reflexively.*
5. **purchase declared?** → the spending policy decides
   (`SEB §26.6`). Disabled by default. A purchase in a currency the policy
   is not denominated in is **refused rather than converted**.
6. **write** → permitted. This is the delegated authority.
7. **protected**, and the resource matches a protected pattern →
   **`POLICY_PROTECTED_RESOURCE`, terminal.** No approval path exists
   (`SEB-D 04`).
8. **protected**, otherwise → approval required, and a pre-image is
   required before the handler runs.

### The protected-resource list

Ships naming this estate's real assets (`SEB-D 05`): `*audit*`,
`*transcript*`, `*certificate*`, `*registrar*`, `*student-record*`,
`*enrolment*`, `*enrollment*`, `*academic-history*`, the existing
production bucket and database names, and `*-production`.

Glob matching is deliberately small — `*` and `?`, no `**`, no braces, no
character classes. **A pattern language nobody can misread is worth more
than an expressive one, because a mistake in this list is a deleted
transcript.**

### Approval

Two-phase, and **a grant is bound to the exact arguments it was requested
for**, so an approval for "delete the staging bucket" cannot be replayed
against the production one. Single-use, TTL-bounded, and its limits are
documented rather than overstated (`SEB §9.8`, `SEB-D 07`).

## 5. Tool surface

Naming is `<provider>.<resource>.<verb>` (`SEB §20.6`), and **the verb
tells the class**: `delete` is always `protected`; `archive` and `revoke`
are always `write`.

| Provider | Coverage |
|---|---|
| **Cloudflare** | Workers (list, get, deploy, delete), secrets, D1, R2, KV, Queues, Durable Objects, bindings, Pages projects and deployments, rollback, DNS and zones, custom domains, logs and tails, health |
| **GitHub** | Repositories, branches, files and multi-file commits, pull requests, merges, issues, releases, tags, Actions (list, trigger, status, logs), repository secrets and variables |
| **Neon** | Projects, branches, databases, roles, connection strings, SQL execution, migrations with a tracking table, schema inspection, slow-query inspection, branch-based backup and restore |
| **Vercel** | Projects, deployments, build logs, rollback/promote, environment variables, domains, domain price check |
| **Clerk** | Users, organisations, memberships, roles, invitations, instance configuration |
| **Resend** | Transactional send, batch send, delivery status, domains and verification, API keys |
| **Brevo** | Contacts, lists, campaigns, transactional send, templates, statistics |
| **`stromex.*`** | Health across all providers, audit query and chain verification, recovery journal, policy description, approvals, inventory, workflow list/run/status |

**Tool profiles** select which groups are exposed, defaulting to all — a
server exposing well over a hundred tools consumes a large share of a
client's context before any work begins, and least privilege applies to
capability surface as well as to credentials (`SEB-D 14`).

Every tool declares the **same output envelope**, so a client learns the
shape once: `ok · tool · provider · operation · operationClass · dryRun ·
requestId · durationMs · summary · data · warnings · error · approval ·
auditSeq`.

Every mutating tool accepts `dryRun` (`SEB §19.6`). Every protected tool
additionally accepts `approvalId` and `confirmationPhrase`.

## 6. Workflows

A workflow is a declarative sequence of steps with **validation,
retries, compensation and a report** — not a script. Each step names the
tool it calls, the arguments it derives, its precondition, and how to
compensate if a later step fails.

Planned set: bootstrap a project · prepare a production deployment ·
deploy production · roll back · rotate application secrets · provision a
Neon database · configure a complete Cloudflare application · configure
GitHub secrets and variables · configure Clerk · configure email
providers · run deployment validation · produce a deployment report.

**Compensation is not rollback.** A workflow undoes what it *created*; it
never destroys anything it merely *touched*, and it never compensates into
a protected operation (`SEB §26.1`). Where a step cannot be compensated,
the report says so and names what a human must do.

## 7. Provider limitations, stated rather than worked around

`SEB §16.9`: where a provider genuinely prevents full automation, say so
precisely and implement the best supported approach.

| Limitation | What the MCP does |
|---|---|
| **Cloudflare Pages direct asset upload** is a versioned multi-step protocol (upload token → hashed manifest → asset endpoint) that only Wrangler tracks reliably | Git-connected deployments through the REST API; direct-upload delegated to Wrangler, documented, not reimplemented (`SEB-D 12`) |
| **Worker log tailing** needs a WebSocket session | `worker.tail.create` returns the tail session; streaming is a client concern, and the tool says so |
| **Neon has no logical-dump API** | Backup is a timestamped **branch** — Neon's own point-in-time mechanism. No `pg_dump` equivalent is claimed (`SEB-D 13`) |
| **Clerk cannot export password hashes**; user migration is import-only | Documented in the Clerk tool descriptions |
| **Resend's free tier permits one verified domain per account** | Recorded; the estate already selects Brevo for this reason |
| **Domain purchase** is possible through Vercel's API | Ships **disabled** behind the spending policy (`SEB §26.6`) |
| **DNS for zones on other registrars** | Only zones the credential can see are managed; the tool reports what it cannot reach rather than failing opaquely |

## 8. Risks, and what is done about each

| # | Risk | Severity | Mitigation | Residual |
|---|---|---|---|---|
| R1 | **A compromised MCP host holds seven providers' credentials** | Critical | Least-privilege scoped tokens per provider per purpose; secrets never returned by any tool; no arbitrary-URL tool; audit of every credential use by fingerprint; rotation procedure | **Real.** Compromise of the host is compromise of the estate's automation. Mitigated by scope, not eliminated. `SEB §28.4` Q9 |
| R2 | **An agent destroys an institutional record** | Critical | Terminal refusal on protected resources, before any approval path | Low. A human with a provider dashboard is unaffected by this control |
| R3 | **An approval is granted by the agent that requested it** | High | Grants bound to exact arguments, single-use, TTL-bounded; elicitation preferred | **Real and documented**: an agent with a shell can run the approve command. `protectedOperations=deny` is the answer where it matters (`SEB §9.8`) |
| R4 | **A credential leaks into a log, an error or a tool result** | High | Value-based redaction of every registered secret on every outbound string; `SecretRef` cannot be printed | Low. A secret never resolved through `SecretResolver` is not registered — hence the rule that all credentials come through it |
| R5 | **An adapter's request construction is wrong and nobody notices** | High | Mock-provider integration tests exercise real construction and real response handling | **Real.** No adapter has met a real credential (`SEB §28.5`). Closes at the first preview environment |
| R6 | **A provider changes its API** | Medium | One client, per-adapter error mapping, contract tests from captured payloads | Medium until captured payloads exist |
| R7 | **Runaway automation exhausts a rate limit or a budget** | Medium | Token bucket per provider; circuit breaker; spending disabled by default | Low |
| R8 | **The audit log is edited** | Medium | Hash chain; verification tool naming the exact broken sequence | **Tamper-evident, not tamper-proof** (`SEB §26.4`). Closes with an append-only external sink |
| R9 | **Tool-surface bloat degrades the agent's judgement** | Medium | Tool profiles; one envelope; deterministic ordering | Low |
| R10 | **The MCP becomes a second source of truth for infrastructure state** | Medium | The inventory is committed to git and populated *from the providers*, never from the MCP's own memory | Low |

## 9. Project structure

```
stromex/mcp/
├── src/
│   ├── index.ts              CLI: serve · doctor · approve · approvals · catalogue · audit
│   ├── server.ts             assembly: capabilities, profiles, tools, resources, prompts
│   ├── config.ts             typed configuration and its env schema
│   ├── core/
│   │   ├── errors.ts         the error vocabulary — code + message + remediation
│   │   ├── redact.ts         value-based redaction
│   │   ├── secret.ts         SecretRef, SecretResolver, mode-checked env files
│   │   ├── logger.ts         structured, stderr-only
│   │   ├── retry.ts          full-jitter backoff, replay safety, Retry-After
│   │   ├── ratelimit.ts      token bucket, circuit breaker
│   │   ├── http.ts           the one client
│   │   ├── policy.ts         the authority model
│   │   ├── approval.ts       two-phase grants
│   │   ├── journal.ts        pre-images
│   │   ├── audit.ts          hash-chained append-only log
│   │   ├── result.ts         the envelope
│   │   └── registry.ts       the gate
│   ├── providers/<name>/     client.ts + tools.ts, one pair per provider
│   ├── workflows/            engine.ts + definitions/
│   ├── platform/             stromex.* tools, health, inventory
│   └── test/{unit,integration,e2e,support}/
└── docs/                     blueprint · roadmap · installation · security ·
                              operations · recovery · upgrade · developer ·
                              user · tool-catalogue
```

## 10. What must be true before this touches production

Ordered, and none is optional:

1. `SEB §28.4` **Q3** (spending) and **Q9** (credential scope) answered.
2. One **read-only credential per provider**, and `stromex-mcp doctor`
   green against all seven — the first time any adapter meets a real API.
3. A **preview environment** to exercise writes against (`SEB §17.6`).
4. The **audit log reviewed once by a person** — an audit trail nobody has
   read is not a control (`SEB §21.8`).
5. **`protectedOperations` chosen deliberately** — `deny` unless there is a
   reason for `approval`.
6. Volume 26 **ratified**, because that is what the server enforces.
