# Volume 4 — The Architecture Constitution

*How systems are shaped, bounded and connected — so that the thirtieth
system is as easy to build as the third.*

---

## §4.1 The 100-Year Test `[OBSERVED]`

From `AMC IA`, operationalised there for information architecture and
generalised here. Before a structural decision is settled, ask:

> **Will this still be right when the institution has ten times as many
> students, four more institutions, a second country and none of the
> people who are here now?**

A structure that depends on a current person, a current headcount or a
current product name fails it. `SHRS role-permission-matrix §2` passes it
deliberately — scope, not role, gates access, "which is also what makes
the model multi-campus-ready without redesign."

## §4.2 Scope, not role, gates access `[OBSERVED]`

The estate's single most reusable architectural decision
(`SHRS role-permission-matrix §2`):

> A Teacher's grants are scoped to *their own assigned classes*, a
> Principal's to *their own institution*, a Muhaffiz's to *their own
> assigned students* — enforced with institution-scoped queries, not a
> single flat "staff" bit.

**Binding on every system.** Authorisation is `(actor, permission, area,
scope)`. A permission without a scope is a bug, and a boolean `isAdmin` is
an architecture failure, not a shortcut.

## §4.3 One adaptive system, not many portals `[OBSERVED]`

`AMC IA` collapses "28 named systems" into **three experiences and one
public utility**: public website, campus portal, executive console,
verification register. `SHRS` reached the same place from the other
direction — one origin, `/portal/...` paths, a single permission engine
behind five offices.

**Binding.** A new stakeholder is a new *relationship* inside an existing
system, not a new portal. Build a fourth surface only when its
**audience, authentication model and availability requirement** all
differ — and record which of the three it differs from.

## §4.4 Boundaries are drawn at the record, not at the team `[RULED — confidence High]`

Systems are decomposed by the lifecycle of the records they own — the
Qur'an College sub-graph is separate from the generic academic-record
tables in `SHRS` "because its lifecycle (memorisation status, never
deleted Ijazah grants) doesn't match a normal term-by-term result," not
because a different office runs it.

**Test.** Two record types belong in one boundary if they are created,
corrected, approved, exported and retained by the same rules. If any of
those five differ, the boundary is wrong.

## §4.5 Provider-agnostic at every external edge `[OBSERVED]`

`AMC-EB Preamble` names WEC-LC's payment architecture as directly
reusable: one interface, swappable gateways, four adapters behind it. The
same shape recurs in `WEC functions/_lib/notifications/events.js`, which
selects Brevo when `BREVO_API_KEY` is present and falls back to Resend —
"so switching provider is a deployment setting rather than a code change."

**Binding.** Payments, email, storage, identity, SMS, AI models and
telemetry each sit behind one interface owned by us. The provider's
vocabulary does not leak past the adapter. This is what makes the MCP
possible at all, and what will make the eighth provider cheap.

## §4.6 State is explicit and addressable `[RULED — confidence High]`

Following the MCP specification's own guidance on stateful tools and the
estate's stateless-session practice (`SHRS`: HMAC-signed cookies, no
server-side session store):

- Prefer stateless. Where state must span calls, return an **opaque
  handle** and accept it back; never rely on an implicit per-connection
  session.
- A handle is a *name*, not a capability: authorisation is re-checked
  against it on every use.
- Handles have a stated lifetime, and an expired handle produces an error
  that says so, so the caller can recover by creating a new one.

## §4.7 Data models refuse impossible states `[OBSERVED]`

`WEC-EP §2` records the cost of not doing this: enrolments had no
uniqueness constraint, so the same learner could hold two live enrolments
in one level and `completeLevel()` would mark one completed while the
other stayed active. Nothing in the test suite ever enrolled the same
person twice.

**Binding.** Invariants belong in the schema — unique constraints, check
constraints, foreign keys, `ON DELETE` behaviour chosen deliberately.
`SHRS ijazah_register` is the standard to imitate: `ON DELETE SET NULL`
plus a frozen `student_full_name`, so the credential survives even if the
student row does.

## §4.8 Every write is a reasoned event, never a silent overwrite `[OBSERVED]`

`SHRS data-lifecycle-register` draws exactly this distinction and grades
each record type by it: student records change through
`student_lifecycle_events` — "a reasoned, timestamped event
(promote/transfer/withdraw/graduate/reinstate), never a silent field
overwrite" — while attendance and assessments are upserts with **no
history of the prior value**, which that register names as a real gap.

**Binding for new systems.** Any record a person could later dispute is
changed through an event with an actor, a timestamp and a reason. Upsert
is permitted only where the prior value is genuinely worthless, and that
judgement is recorded in the schema comment.

## §4.9 Subsystems do not entangle `[RULED — confidence High]`

The MCP lives inside a college repository and shares nothing with it: its
own package manifest, its own dependencies, its own build, its own tests;
the college's build and test suite neither see it nor are affected by it.
That separation is what makes `git subtree split` a one-command
extraction later.

**Binding.** A subsystem that will one day live elsewhere is built from
day one as if it already does. Shared code moves to a package with a
version; it does not become a relative import across a boundary.

## §4.10 Multi-tenancy is designed in, dormant until needed `[OBSERVED]`

`SX-EB Part IX` makes multi-tenant institutional support a 10,000-user
milestone; `SHRS` already carries `institutions`, `campuses`,
`staff_institutions` and institution-scoped queries with four institutions
live. The pattern is: **the tenant column exists and is enforced from the
first migration; the tenant management UI comes later.**

Retrofitting a tenant boundary onto a single-tenant schema is the most
expensive migration in this domain, and the second most expensive is
retrofitting scope onto a flat permission model (`SEB §4.2`).

## §4.11 What must be true at each scale `[OBSERVED]`

`SX-EB Part IX`, adopted whole, with its closing rule reproduced because
it is the point:

| Scale | What must be true |
|---|---|
| 100 users | Single region. Qualitative fit and white-glove trust-building, not hardening. |
| 1,000 | Automated onboarding; human review still in the loop for every religious-content pathway. |
| 10,000 | Multi-tenant institutional support; observability, rate limiting and abuse detection become mandatory. |
| 100,000 | Multi-region for latency and residency; cost-per-user becomes a hard product constraint; human review scales via tooling. |
| 1,000,000 | Dedicated trust & safety function; sharded memory and retrieval; own model routing; formal compliance programme per region. |
| 10,000,000 | National-scale compliance in every market; critical-infrastructure redundancy; governance independently audited, not self-certified. |

> Nothing in the standards is scale-contingent. **What changes with scale
> is the infrastructure and process required to uphold them, never the
> standards themselves.**

## §4.12 Architecture decisions are recorded `[OBSERVED]`

Every significant architectural decision gets an entry in Volume 25 with:
the question, the options, the choice, the reasoning, the confidence, and
what would reverse it. `AMC-D` is the template. An architecture nobody can
reconstruct the argument for will be undone by the next person who finds
it inconvenient.
