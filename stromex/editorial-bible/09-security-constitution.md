# Volume 9 — The Security Constitution

*Security is a property of the whole estate, so it is written once. Where
this volume and a project's convenience disagree, this volume wins.*

---

## §9.1 Default: no access `[OBSERVED]`

`SHRS role-permission-matrix §2`, verbatim in substance:

> **Default: no access.** Every permission had to be justified against a
> real responsibility documented somewhere — a policy code, an existing
> job description, or an explicit Board decision. **Nothing was granted
> because it would be convenient for a role to have it.**

A role not listed in an area has no access to that area at all. A blank
cell is a refusal, not an omission.

## §9.2 Credentials `[OBSERVED, extended]`

**Never in git. Never in a log. Never in an error. Never in a tool result.
Never in a comment, an issue or a pull-request body.** (`SEB §26.7`.)

**Where they may live**, in order of preference:

1. An external secret manager reached through a command — 1Password
   (`op read`), `pass`, Vault, `gcloud secrets`, `aws secretsmanager`.
   This is the supported path to a real vault without binding the estate
   to one vendor's SDK.
2. The process environment, injected by the host at start.
3. An operator-owned file whose **mode is checked on every read**, not
   only at startup — group- or world-readable is a configuration error,
   not a warning. A credentials file at 0644 on a shared machine is a leak
   no amount of care inside the process can undo, and one that becomes
   0644 an hour after the server booted is the same leak.

**On rotation, that order inverts.** A process cannot have its environment
changed from outside after it is spawned, so an env-borne credential is
rotatable only by restarting the server — making the environment the
*least* rotatable of the three, not the second-best. Where a credential
must be rotatable under load, home 1 is the only real answer and home 3 is
the fallback (`SEB-D 33`).

**Redaction is by value, not by key name** (`SEB §26.7`). Key-name
redaction fails the moment a secret travels under a name nobody predicted
— inside a connection URI, inside a provider's echo of the request,
inside a stack trace.

**Rotation.** Every credential is rotatable without a code change and
without downtime, because credentials are resolved per request rather than
captured at start. A rotation procedure that has never been executed is
not a rotation procedure (`SEB §11.7`).

## §9.3 Scope every credential to the least it can do `[OBSERVED]`

`SHRS`'s own audit is the cautionary example, recorded honestly in its
deployment directive: five bearer-token-gated admin surfaces, "each a
separate, non-rotating shared secret read from an env var, not a real
account system." Splitting them narrowed the blast radius, which was
right; none of them rotates, which is the remaining gap.

**Binding.**

- One credential per provider **per purpose**, scoped to the minimum
  account, organisation, repository set and permission list.
- A read-only credential wherever a read-only credential suffices, and
  most operations only read.
- **A shared secret is an identity of last resort.** It cannot support
  separation of duties, because it has no individual behind it — which is
  exactly why `SHRS approval-workflow-architecture §4b` refuses the
  bearer-token path for the two actions that require a distinct second
  person, "rather than silently exempting it from the check." Copy that
  refusal, do not copy the exemption.

## §9.4 Authorisation is `(actor, permission, area, scope)` `[OBSERVED]`

`SEB §4.2`. And the enforcement order that makes it real
(`SHRS approval-workflow-architecture §3`):

1. Load the request.
2. **Separation of duties first** — is the decider a different real person
   from the requester? Checked before anything else, *including* before
   the permission check.
3. Permission, through the same engine every other call site uses — never
   a role-name string comparison, never trust in what the requester
   claims.
4. Only then, the side effect.

The property that matters, and the one that was actually unit-tested in
`SHRS`: **the side effect never runs when a safeguard fires** — the
safeguard fires before any state changes, not merely before the response
is returned.

## §9.5 Authentication `[OBSERVED]`

Observed practice across the estate, recorded as the baseline:

- Sessions are **stateless and signed** (HMAC-SHA256), not a server-side
  store, so a Workers isolate needs no session database.
- Passwords are hashed with a memory-hard KDF (`scrypt` in `SHRS`), salted.
- **Rate limiting and lockout on every credential-accepting endpoint** —
  `SHRS` uses 5 failed attempts / 15-minute lockout, writing every attempt
  to an audit log.
- **Token comparison is timing-safe.**
- Session-bearing responses carry `Cache-Control: no-store`.
- JWT verification refetches the JWKS on an unknown `kid`. `WEC-EP §2`
  records what happens otherwise: the provider rotating its signing keys
  would sign out every learner for up to ten minutes, and nothing in the
  suite exercised verification past the 401 boundary at all.
- The token's authorised-party claim is checked wherever one identity
  provider backs more than one frontend; otherwise any token signed by
  those keys is accepted regardless of which application minted it.

`[OPEN]` **No MFA and no SSO exists anywhere in the estate**
(`SHRS digital-campus-master-deployment-directive`). This is stated, not
solved. MFA on every staff account with an approval or export grant is the
single highest-value security addition available and should be scheduled.

## §9.6 Input validation and output sanitation `[OBSERVED]`

Every external input is validated against a schema at the boundary, and
every output that crosses a trust boundary is redacted (`SEB §9.2`) and
escaped for its destination.

**Server-side rendering of user content, provider payloads and AI output
is untrusted by default.** `SX-EB`'s own independent audit found, fixed
and documented a **critical SSRF vulnerability** in the MVP; the lesson
recorded there is the general one — a URL supplied by an untrusted party
is a request the server will make on that party's behalf unless something
stops it.

## §9.7 The MCP's own security boundary `[RULED — confidence High]`

Because an automation layer holding seven providers' credentials is the
most valuable target in the estate, its boundary is stated explicitly:

- **stdio by default.** No network listener unless one is asked for.
- **`[NOT IMPLEMENTED — corrected 2026-08-18]`** The clause below describes
  a transport the MCP does not have. `config.ts` builds the config and
  nothing reads it; the server speaks stdio and only stdio. The rule stands
  as a requirement on any future transport, not as a description of one
  that exists (`mcp/docs/security.md §7`, `SEB-D 31`).
- **Where an HTTP transport is enabled**, it binds to loopback by default,
  requires a bearer token, and validates the `Origin` header — the
  documented mitigation for DNS-rebinding attacks against local MCP
  servers.
- **The server never proxies arbitrary URLs.** Every request is
  constructed by an adapter against a fixed provider base URL.
- **Tool descriptions and annotations are untrusted by clients** — the
  specification says so — and the server behaves accordingly: annotations
  are advisory, and every authority decision is re-made server-side.
- **The audit log is written before the result is returned**, so a crash
  between the side effect and the response does not lose the record.

## §9.8 What the approval mechanism does and does not defend against `[RULED — confidence High]`

Stated plainly because an overstated control is worse than a missing one.

An MCP server talks to a *client*, not to a person. Nothing arriving on
the transport proves a human saw it. Three layers stand in for human
authentication:

| Layer | Defends against | Does **not** defend against |
|---|---|---|
| **The host's permission prompt** (Claude Code, Claude Desktop) | An agent invoking a destructive tool without the operator seeing it | An operator clicking through prompts habitually |
| **Elicitation** — the server asks the client to put a specific question to the user, naming the resource and requiring the exact phrase back | The wrong resource being destroyed; a mistaken argument | A client that does not implement elicitation |
| **Out-of-band grants** — a pending request on disk, released only by `stromex-mcp approve <id>` | **Accidents**: a mistaken call, a runaway loop, a misinterpreted instruction | **An agent that also holds a shell on the same machine**, which can run the approve command itself |

**Therefore:** where the third row's exposure matters, run the server with
`protectedOperations=deny` and perform deletions by hand. That sentence is
in the server's own source, in its documentation, and here, because it is
the kind of limitation that gets quietly forgotten.

## §9.9 Incident response `[OBSERVED — as a named gap]`

`SHRS IT-01 §7.6` names it: "no formal incident-response runbook exists
yet," and `SHRS IT-06 §3` rates an Incident Response Policy as "the most
concrete unmet need," recommended ahead of a cybersecurity framework or a
digital-learning policy.

**Adopted as the estate's next security document.** Until it exists, the
minimum standing procedure is: contain, revoke the credential, preserve
the audit log **without editing it** (`SEB §26.4`), record a timeline, and
disclose. `SX-EB Part VIII`: **incidents are disclosed, not hidden.**

## §9.10 Security review cadence `[OBSERVED]`

`AMC-EB §45.3`: quarterly accessibility audit; **annual security review
and penetration test once real student data exists**; annual review of the
governing bible in full. `SHRS` records honestly that "no recurring audit
*process* exists" — individual fixes, no cadence. The cadence is the
article.

## §9.11 Safeguarding overrides everything `[OBSERVED]`

`SHRS IT-05 §5` and `SW-01 §7.10`. A system that could plausibly encounter
a safeguarding disclosure must route it to a **named human**, immediately,
and must not attempt to handle it. This overrides availability, overrides
automation, and overrides any conflicting product requirement.
