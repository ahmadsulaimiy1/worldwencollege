# The StromeX Enterprise MCP — Implementation Roadmap

*Phases, each with an exit condition that can be checked rather than
asserted (`SEB §17.2`). Nothing here claims a status it has not earned.*

---

## Phase 0 — Foundation `Developed`

The Editorial Bible (29 volumes) and this blueprint.

**Exit:** both written, committed, and the ten open questions escalated
rather than defaulted. ✅

## Phase 1 — Core runtime `Developed`

Errors · redaction · secrets · logging · retry · rate limiting and
circuit breaking · the HTTP client · policy · approval · journal · audit ·
the result envelope.

**Exit:** typechecks clean; unit tests with injected clocks and sinks
covering the refusal paths, the chain-break detection, the argument
binding of grants, and the jitter distribution. ✅ *(tests land in Phase 4)*

## Phase 2 — Registry, server and CLI `In progress`

The gate (`blueprint §3`), server assembly with tool profiles, and the
CLI: `serve`, `doctor`, `approve`, `approvals`, `catalogue`, `audit`.

**Exit:** an MCP client connects over stdio, lists tools, calls a read
tool, is refused on a protected tool, and an audit record exists for both.

## Phase 3 — Provider adapters

One pair per provider — `client.ts` (typed methods, provider error
mapping, rate-limit profile) and `tools.ts` (schemas, annotations,
authority classes, resource extraction, pre-image capture).

Order, by what unblocks the most: **GitHub → Cloudflare → Neon → Vercel →
Clerk → Resend → Brevo.**

**Exit per provider:** every tool has an integration test against a
scripted provider that enforces the real API's constraints (`SEB §23.3`),
covering the success path, the provider's real error shapes, and the
policy refusal.

## Phase 4 — Test suite

Unit · mock-provider integration · end-to-end over a real stdio transport
with a real MCP client · health checks · and the register of what is
**not** covered (`SEB §23.10`).

**Exit:** `npm test` green; the uncovered register written.

## Phase 5 — Workflows

The engine (validation, retries, compensation, reporting) and the named
workflows in `blueprint §6`.

**Exit:** each workflow runs end to end against scripted providers,
including a mid-workflow failure that compensates correctly and reports
what it could not undo.

## Phase 6 — Documentation

Installation · security · operations · recovery · upgrade · developer ·
user · the generated tool catalogue.

**Exit:** a person who has not seen this repository can install, configure
one provider, run `doctor`, and understand what the server will refuse to
do and why.

## Phase 7 — First real credential `Not Started — gated on you`

**Blocked on `SEB §28.4` Q3 and Q9.** One read-only credential per
provider; `doctor` run against all seven; the results recorded.

**Exit:** the first row in `SEB §17.10` that says *Staging Verified*.

## Phase 8 — First real write

Against a preview environment only. Then `SEB §28.4` Q7 (domains) becomes
answerable from the providers themselves rather than from memory.

## Phase 9 — The inventory

`stromex.inventory.*` populated from the providers and committed, so the
estate can answer "what do we have?" from one versioned document
(`SEB §10.9`, `SEB §24.9`).

---

## What is deliberately not on this roadmap

- **Any retention or deletion capability** — `SEB §26.2` forbids it until
  destruction authority is settled per category.
- **Any real personal data in a production deployment** — `SEB §22.11`.
- **Automated purchasing** — `SEB §26.6`, off until you set a policy.

These are not omissions. They are three of the four things this server is
built to make impossible by default.
