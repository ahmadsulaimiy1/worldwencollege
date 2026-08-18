# StromeX Enterprise Infrastructure MCP

One authenticated, audited, policy-governed surface over **Cloudflare,
GitHub, Neon, Vercel, Clerk, Resend and Brevo** — exposed to an AI
operator through the Model Context Protocol.

**158 tools · 132 tests · no adapter has met a real credential yet**
([why that matters](#status)).

```sh
npm install && npm run build && npm test
node dist/index.js doctor
```

---

## What it is for

Not "let the model call APIs." It exists to make one thing true in code:
that an agent can design, build, provision, deploy, repair and monitor
**autonomously**, and **cannot** destroy an institutional record, exceed a
spending policy, leak a credential, or claim a verification it did not
perform.

The estate this was built for had already found the failure mode it
guards against: governance language that no code enforces — approvals
that were recordable but never checked, retention periods nothing
applied, a two-person control that one person held both ends of. This
server is the answer to that, and the [Editorial Bible](../editorial-bible/)
is where the rules come from.

## The five guarantees

| | | Where |
|---|---|---|
| **G1** | **A credential cannot be printed.** Redaction is by *value*, not key name — every registered secret is stripped from every log, error and result, including the password inside a connection URI | `core/secret.ts`, `core/redact.ts` |
| **G2** | **Nothing destroys an institutional record.** A protected-resource match is a terminal refusal with **no approval path** | `core/policy.ts` |
| **G3** | **Everything is on the record.** One hash-chained, append-only audit entry per call — refusals included — written before the result returns | `core/audit.ts` |
| **G4** | **Destructive operations need a human**, and the limits of that are documented rather than overstated | `core/approval.ts`, [security §3](docs/security.md) |
| **G5** | **Failure is uniform and legible.** Timeouts, full-jitter retry, `Retry-After`, per-provider rate limiting and circuit breaking; every error carries a code, a message and a remediation | `core/http.ts` |

## The authority model

Three classes. The class decides — not the tool's own code.

```
read       Observation only.                              Always permitted.
write      Creates or changes, reversibly.                Runs autonomously.
protected  Permanently destroys.                          Never autonomous.
```

Two absolutes sit above them:

- **An institutional record is never destroyed by this server** —
  certificates, transcripts, student records, registrar data, audit logs,
  production stores. With or without approval. Archive, revoke, supersede
  and deactivate remain ordinary writes.
- **Nothing that costs money is bought** unless an operator turned on a
  spending policy naming the providers, the per-purchase maximum and the
  monthly cap.

## Credentials never come back to you

Ask for a database connection string and you get a **handle** plus the
non-secret parts. The handle goes to any tool that sets a secret, so the
credential travels Neon → GitHub or Cloudflare without passing through the
transcript. Handles are in-process, short-lived, and no tool reads one
back as text.

The GitHub path computes a real libsodium **sealed box** with the
repository's public key; a test opens the ciphertext with the recipient
key to prove the plaintext never went on the wire.

## Documentation

| | |
|---|---|
| [**Blueprint**](docs/blueprint.md) | The architecture, the risk register, and every provider limitation with what is done about it |
| [**Roadmap**](docs/roadmap.md) | Phases, each with an exit condition that can be checked |
| [**Installation**](docs/installation.md) | Fifteen minutes to a read-only server; the scopes, starting minimal |
| [**Security**](docs/security.md) | The threat model, and **what approval does not defend against** |
| [**Operations**](docs/operations.md) | Daily routines, approvals, deployments, rotation, known boundaries |
| [**Recovery**](docs/recovery.md) | What a pre-image can and cannot rebuild, resource by resource |
| [**Upgrade**](docs/upgrade.md) | What must survive every upgrade, and how to change the audit schema |
| [**Developer guide**](docs/developer-guide.md) | Adding a tool, a provider or a workflow without weakening anything |
| [**User guide**](docs/user-guide.md) | For the person or agent using it |
| [**Tool catalogue**](docs/tool-catalogue.md) | All 158, with classes; the protected seventeen and what each can restore |
| [**Not verified**](docs/not-verified.md) | Everything this build has **not** proved, and what would close each gap |

## Commands

```sh
stromex-mcp serve                          # the MCP server, on stdio
stromex-mcp doctor                         # one authenticated read per provider
stromex-mcp approvals                      # what is waiting on a human
stromex-mcp approve <id> --phrase "..."    # a human grants, at a terminal
stromex-mcp audit --limit 50               # what happened
stromex-mcp audit --verify                 # has the record been edited?
stromex-mcp catalogue --format=markdown    # every tool and its class
```

## Workflows

Declarative sequences with validation, captured state, compensation and a
report. Every step goes through the same gate, so a workflow is never a
way around it — and **compensation never destroys**: an undo that would
call a protected tool is refused and reported as *not undone*.

`project.bootstrap` · `secrets.install-database` · `database.provision` ·
`deploy.prepare` · `deploy.production` · `deploy.rollback` ·
`email.configure-domain` · `estate.report`

## Status

**Tested Locally.** Using the estate's own vocabulary
([`SEB §17.2`](../editorial-bible/17-deployment-constitution.md)), which
exists precisely so this sentence cannot be fudged:

- The core runtime and the gate: **Tested Locally**, thoroughly.
- The seven adapters: **Tested Locally against scripted providers only.**
- Any write against a real provider: **Not Started.**
- Any protected operation against a real provider: **Not Started, and it
  should stay that way** until the Bible's Volume 26 is ratified.

**No adapter in this build has been exercised against a real credential.**
Every path is proven against a scripted provider whose routes were written
from published documentation. `docs/not-verified.md` is the full register,
and it closes at the first preview environment with a read-only key.
