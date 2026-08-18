# Installation

*From nothing to a working, read-only server in about fifteen minutes.
Nothing in this guide grants the server permission to change anything.*

---

## 1. Requirements

- **Node 22.6 or later.** Verify with `node --version`.
- A client that speaks MCP — Claude Code, Claude Desktop, or any other.
- One credential per provider you want to use. Read §3 before creating
  them: the scopes matter more than anything else in this document.

## 2. Build

```sh
cd stromex/mcp
npm install
npm run build
npm test          # 132 tests, no network, no credentials
node dist/index.js doctor
```

`doctor` with no credentials tells you what is missing and stops. That is
the expected first result.

## 3. Credentials — scopes first

**Start every provider read-only** (`SEB §9.3`). Confirm `doctor` is
green, work with the read tools for a while, and widen a scope only when
a specific operation needs it and you have decided it should.

| Provider | Variable | Minimum useful scope | Widen to |
|---|---|---|---|
| **Cloudflare** | `CLOUDFLARE_API_TOKEN` | Account · *Account Settings: Read*; Zone · *Zone: Read*, *DNS: Read* | *Workers Scripts: Edit*, *D1: Edit*, *Workers R2 Storage: Edit*, *Workers KV Storage: Edit*, *Queues: Edit*, *Pages: Edit*, *DNS: Edit* |
| | `CLOUDFLARE_ACCOUNT_ID` | **Set it.** With more than one visible account the server refuses to guess, and it is right to | |
| **GitHub** | `GITHUB_TOKEN` | Fine-grained PAT, selected repositories, *Contents: Read*, *Metadata: Read* | *Contents: Read & write*, *Pull requests: Read & write*, *Issues: Read & write*, *Actions: Read & write*, *Secrets: Read & write*, *Variables: Read & write* |
| **Neon** | `NEON_API_KEY` | Personal or organisation API key | — Neon does not scope keys by capability; treat every Neon key as full access and store it accordingly |
| **Vercel** | `VERCEL_TOKEN` | Account token, scoped to one team where possible | |
| | `VERCEL_TEAM_ID` | Set it when the projects live in a team, or every call silently addresses your personal account | |
| **Clerk** | `CLERK_SECRET_KEY` | The instance secret key. **Use a development instance first** | |
| **Resend** | `RESEND_API_KEY` | *Sending access*, restricted to one domain | *Full access* only if you need to manage domains and keys |
| **Brevo** | `BREVO_API_KEY` | v3 API key | |

**A provider with no credential contributes no tools at all.** That is
deliberate: tools that fail at call time teach a model that failure is
normal.

## 4. Where the credentials live

Three supported places, in order of preference (`SEB §9.2`).

### a. An external secret manager — recommended

```sh
export STROMEX_MCP_SECRET_COMMAND='op read op://StromeX/{name}/credential'
```

`{name}` is replaced with the variable name. Anything with a CLI works:
`pass`, `vault kv get`, `gcloud secrets versions access`,
`aws secretsmanager get-secret-value`. The server never stores the value,
and rotating in the vault takes effect on the next call rather than the
next restart.

Secret names used this way must match `/^[A-Z0-9_]+$/`. Anything else is
**refused rather than escaped** — refusing is verifiable, escaping is a
class of bug.

### b. The process environment

Whatever your MCP client injects. Correct for a host that already manages
secrets.

### c. An operator-owned file

```sh
install -m 600 /dev/null ~/.stromex-mcp/credentials.env
$EDITOR ~/.stromex-mcp/credentials.env
node dist/index.js doctor --env-file ~/.stromex-mcp/credentials.env
```

**The mode is checked and enforced.** A file readable by group or world
is a configuration error, not a warning: a credentials file at 0644 on a
shared machine is a leak nothing inside this process can undo.

## 5. Register the server with a client

### Claude Code

```sh
claude mcp add stromex -- node /absolute/path/to/stromex/mcp/dist/index.js serve
```

### Claude Desktop, or any client using a JSON config

```json
{
  "mcpServers": {
    "stromex": {
      "command": "node",
      "args": ["/absolute/path/to/stromex/mcp/dist/index.js", "serve"],
      "env": {
        "STROMEX_MCP_SECRET_COMMAND": "op read op://StromeX/{name}/credential",
        "STROMEX_MCP_PROTECTED_OPS": "deny",
        "STROMEX_MCP_STATE_DIR": "/absolute/path/to/state"
      }
    }
  }
}
```

`STROMEX_MCP_PROTECTED_OPS=deny` is the right first setting. Move to
`approval` only once you have read `docs/security.md § 3` and decided
that its limits are acceptable for your machine.

## 6. Configuration reference

| Variable | Default | What it does |
|---|---|---|
| `STROMEX_MCP_PROTECTED_OPS` | `approval` | `deny` · `approval` · `allow`. `allow` runs destructive operations unattended and is logged at warn level on every call |
| `STROMEX_MCP_READ_ONLY` | `false` | Refuses every mutating tool |
| `STROMEX_MCP_PROFILES` | all | Comma list of providers to expose |
| `STROMEX_MCP_PROTECTED_RESOURCES` | — | Extra glob patterns, **added to** the built-in list. The built-ins cannot be removed by configuration (`SEB §26.1`) |
| `STROMEX_MCP_STATE_DIR` | `~/.stromex-mcp` | Audit log, approvals, recovery journal |
| `STROMEX_MCP_AUDIT_PATH` / `_APPROVALS_PATH` / `_JOURNAL_PATH` | under the state dir | Individual overrides |
| `STROMEX_MCP_APPROVAL_TTL` | `900` | Seconds an approval grant stays usable |
| `STROMEX_MCP_ACTOR` | `stromex-mcp` | Recorded on every audit entry |
| `STROMEX_MCP_LOG_LEVEL` | `info` | `debug` · `info` · `warn` · `error` — stderr only |
| `STROMEX_MCP_ENV_FILE` | — | Same as `--env-file` |
| `STROMEX_MCP_SECRET_COMMAND` | — | External secret resolver |
| `STROMEX_SPEND_ENABLED` | `false` | Turns on automatic purchasing. Requires both limits below, or the server refuses to start |
| `STROMEX_SPEND_CURRENCY` | `USD` | The policy's denomination. Purchases in another currency are refused, never converted |
| `STROMEX_SPEND_MAX_SINGLE` | `0` | Maximum single purchase |
| `STROMEX_SPEND_MONTHLY_CAP` | `0` | Rolling 30-day cap |
| `STROMEX_MCP_HTTP` | `false` | Enable the Streamable HTTP transport |
| `STROMEX_MCP_HTTP_HOST` | `127.0.0.1` | Loopback by default, deliberately |
| `STROMEX_MCP_HTTP_PORT` | `8437` | |
| `STROMEX_MCP_HTTP_ORIGINS` | — | Permitted `Origin` values |

## 7. Verify

```sh
node dist/index.js doctor        # one authenticated read per provider
node dist/index.js catalogue     # every tool, with its authority class
node dist/index.js audit --verify
```

Then, from your client, ask for `stromex.policy.describe`. Read what it
says the server will refuse **before** you need it to refuse something.

## 8. What to do first

1. `stromex.health.check` — the whole estate, in one call.
2. `stromex.workflow.run` with `estate.report` and `dryRun: true` — a
   read-only inventory of everything the credentials can see.
3. Read the audit log. `node dist/index.js audit --limit 50`. An audit
   trail nobody has read is not a control (`SEB §21.8`).
