# What This Build Has Not Verified

*The honest register. `SEB §23.10`: a test suite ships with a list of what
it does not cover and what would close each gap — because "nothing here is
a reason not to ship a preview; it is a list of the things that must not
be described as verified."*

**Last reviewed:** at the commit that added this file. Update it when a
row closes, and add a row whenever a capability lands untested.

---

## 1. The single largest gap

> **No provider adapter in this build has been exercised against a real
> credential.**

Every request path is proven against a scripted provider whose routes were
written from published API documentation. That means:

- Request **construction** is verified — method, path, query, headers,
  body shape, multipart encoding, sealed-box encryption.
- Response **handling** is verified — success shapes, each provider's real
  error shapes, envelope semantics, retry, rate limiting, breaker.
- **The paths themselves are not verified.** If a documented endpoint has
  moved, been renamed, or changed its version prefix, this build will
  discover it at the first real call.

**What closes it:** one read-only credential per provider and
`stromex-mcp doctor`. Fifteen minutes, no writes, no risk.
(`SEB §28.4` Q9 — the credential-scope decision — gates it.)

## 2. Per provider

| Provider | Verified against a scripted provider | Not verified |
|---|---|---|
| **GitHub** | Auth headers, API version header, multi-file commit via the git data API, sealed-box secret encryption (opened with the recipient key in the test), 401 on an empty credential, error message and field detail, retry on 500, no retry on 404 | Every real endpoint; fine-grained PAT permission behaviour; secondary rate limits on writes |
| **Cloudflare** | Bearer auth, `success:false` on HTTP 200 treated as a refusal, multi-account refusal, Worker multipart upload with a metadata part, DNS pre-image capture, protected-resource refusal without any request | Every real endpoint; Pages deployment semantics for git-connected vs direct-upload projects; tail session lifetime; D1 export polling |
| **Neon** | Connection URI never leaving in a result, vault handle issuance, migration ledger with checksum drift detection, `pg_stat_statements` absence reported honestly | Every real endpoint; **all SQL execution** — the runner is injected in tests and has never opened a real connection; migration behaviour against a real Postgres; branch restore semantics |
| **Vercel** | Team id threading, env upsert, purchase refusal with no spending policy, price-ceiling refusal without calling the registrar | Every real endpoint; the deployment creation body for a real git source; rollback vs promote semantics |
| **Clerk** | Error `long_message` surfacing, membership create→update fallback, class assignments | Every real endpoint; the actual claim set; organisation role keys |
| **Resend** | `reply_to` field mapping, API key into the vault with the token withheld, dry run sending nothing | Every real endpoint; **real delivery** — no message has been sent; domain verification timing |
| **Brevo** | `api-key` header rather than bearer, `updateEnabled` on contact creation, class assignments | Every real endpoint; real delivery; campaign send semantics |

## 3. Not covered by any test

| Area | Why | What would close it |
|---|---|---|
| **The Streamable HTTP transport** | **ABSENT, not merely untested.** This row previously said "only stdio is exercised end to end", which implied the transport existed and lacked coverage. It does not exist: `config.ts` builds the config object and nothing reads it (`security.md §7`) | Implementing it — loopback bind, bearer check, `Origin` validation — and then an e2e test |
| **Elicitation against a real client** | The e2e client declares no elicitation capability; the path is unit-tested with an injected function | A client that implements elicitation, driven end to end |
| **The `doctor` command's live path** | It makes real network calls by design | Running it against real read-only credentials |
| **Concurrency under load** | Rate limiter and breaker are unit-tested with an injected clock, not under real parallel traffic | A soak test issuing many concurrent calls at a scripted provider that enforces a real 429 |
| **Filesystem failure modes** | Audit and journal use in-memory sinks in tests | Tests against a read-only directory, a full disk, and two servers sharing one state directory |
| **A very large audit log** | Verification reads the whole file | A benchmark, and a decision about rotation that does not lose records (`SEB §26.4`) |
| **Long-running workflows** | Every workflow test completes in milliseconds | A workflow against a provider that is genuinely slow, with a timeout crossing a step boundary |

## 4. Known boundaries — understood, not gaps

These are not missing tests. They are limits of the design, verified and
documented:

| Boundary | Where it is stated |
|---|---|
| A schema violation is rejected by the MCP SDK before the server sees it, so it produces **no audit record** | e2e test; `docs/operations.md § 9` |
| The audit chain is **tamper-evident, not tamper-proof** | `core/audit.ts`; `docs/security.md § 6`; the tool's own description |
| Out-of-band approval defends against accidents, **not against an agent with a shell** | `core/approval.ts`; `docs/security.md § 3` |
| A pre-image records **configuration, not data** | `core/journal.ts`; `docs/recovery.md § 2` |
| Cloudflare Pages **direct asset upload is Wrangler's** | Tool description; `docs/blueprint.md § 7` |
| A Neon backup is a **branch**, which does not survive project deletion | Tool description; `SEB-D 13` |
| Worker log tailing returns a **session**, not a stream | Tool description |
| The handle vault is **in-process**; a restart empties it | `core/vault.ts`; `docs/operations.md § 9` |

## 5. How to close a row

1. Do the thing — obtain the credential, write the test, run the check.
2. Move the row out of §1–§3 and into a note saying what verified it and
   when.
3. If it turns out the row was wrong — the endpoint had moved, the
   behaviour differed — **record that too**, in the commit and in
   `SEB §25`. A register that only ever records successes is a
   marketing document.
