# Volume 3 — The Engineering Constitution

*How software is allowed to be built here. Volume 4 governs how systems
are shaped; this volume governs how the work is done.*

---

## §3.1 The Permanent Engineering Principle `[OBSERVED]`

Set by the Executive, 2 August 2026, and reproduced verbatim from
`WEC-EP §1` because it is already institutional law:

> **Never trust an implementation merely because it passes tests.
> Continuously verify that the tests themselves measure the complete
> behaviour they claim to guarantee.**

Everything in Volume 23 is the operational form of this one sentence.

## §3.2 Boring, provable infrastructure beneath ambitious features `[OBSERVED]`

`SX-EB Part II`. The ambition belongs in what the product does, not in
what it is built on. A novel datastore, an unproven framework or a clever
concurrency model is a liability charged against every future feature.

**Consequence.** New infrastructure dependencies require a written
justification naming the specific, *measured* problem the incumbent
choice could not solve — the standard set by `SHRS
shrs-digital-infrastructure-blueprint §2`, where Neon was chosen because a
`pg.Pool` was **observed** hanging the Workers isolate on a second
request, not because HTTP drivers are fashionable.

## §3.3 Reversibility of every user-facing action `[OBSERVED]`

`SX-EB Part II`, and `SX-EB Part VI` in its interaction form: every
destructive or hard-to-reverse action is confirmed and reversible where
technically possible.

**Engineering consequence.** Before writing an operation, answer: *how is
this undone?* If the answer is "it isn't," the operation is `protected`
(`SEB §21.3`) and needs the whole apparatus — approval, pre-image,
audit — or it is redesigned into something reversible. Most are: a
revocation instead of a deletion, a supersession instead of an overwrite,
a status flag instead of a `DROP`.

## §3.4 Observability and auditability are first-class, not post-incident `[OBSERVED]`

`SX-EB Part II`. A system that cannot say what it did is a system that
cannot be operated, corrected or defended.

**Minimum for every service, from its first commit:**

- Structured logs, one event per line, machine-parseable, with a request
  correlation id that survives every hop.
- An audit record for every state change that a person could later be
  asked about — who, what, when, on which resource, with what outcome
  (Volume 21).
- Health that is *checked*, not assumed: an endpoint or command that
  actually exercises the dependency rather than returning `200 OK` from a
  process that is up but disconnected.
- Errors that carry a **code**, a **message** and a **remediation**. An
  error that cannot say what to do next is not finished being written.

## §3.5 Correct over fast; coherent across surfaces over locally optimal `[OBSERVED]`

`SX-EB Part II`'s product values, applied to engineering. A local
optimisation that makes one surface better and the system less coherent is
refused. Consistency is a feature with compounding returns and
inconsistency is a debt with compounding interest.

## §3.6 Fail closed, and fail legibly `[RULED — confidence High]`

Derived from `SHRS approval-workflow-architecture §3`, where the
separation-of-duties check runs *before* the permission check and *before*
any state changes, so a refusal cannot leave a partial write behind.

1. **Fail closed.** When authorisation, validation or a precondition
   cannot be established, the operation does not run. Absence of a "no" is
   never a "yes."
2. **Check before you act.** Every guard runs before the first side
   effect, never between two of them.
3. **Fail legibly.** The refusal names the rule that refused, the resource
   it refused on, and what would satisfy it. `POLICY_PROTECTED_RESOURCE`
   with the matching pattern quoted beats "forbidden."

## §3.7 One mechanism, used everywhere `[OBSERVED]`

`SHRS approval-workflow-architecture §3` builds one generic approval
engine — `createApprovalRequest` / `decideApproval` — deliberately
carrying no knowledge of certificates or lifecycle events, so each new
area is "one pair of calls, no new schema." The MCP's HTTP client is the
same idea: retry, jitter, rate limiting, circuit breaking, redaction and
error normalisation live in one file so that the guarantees are true of
*all seven* providers rather than of whichever adapter was written most
carefully.

**Binding.** When the same concern appears in three places, it becomes one
mechanism with three call sites — and the mechanism knows nothing about
any of them.

## §3.8 Configuration is data; policy is data `[OBSERVED]`

`AMC-EB Preamble` names this as inherited from WEC-LC: "config-driven
commercial policy (prices, FX rates, discount rules live in data, never in
code) — proven, tested, and directly reusable."

Extended here: **authority is data too.** The protected-resource list,
the spending policy, the retention table and the role-permission matrix
are configuration, reviewable by a non-engineer, versioned in git, and
changed by amendment rather than by editing a conditional.

## §3.9 Dependencies are a standing liability `[RULED — confidence High]`

- A runtime dependency is added only when writing it would be
  *substantially* worse, and the reasoning goes in the file that uses it.
  The estate's own extreme of this — `SHRS` runs one runtime dependency;
  `WEC` Pages Functions run none — is a floor to aim at, not a rule.
- Every dependency is pinned, and lockfiles are committed.
- Security updates are applied promptly and are `write`-class work needing
  no approval (`SEB §21.3`).
- A major version bump is a change with a rollback plan, not a chore.

## §3.10 The work is finished when it is verified, documented and reported honestly `[OBSERVED]`

From `WEC-EP §5`:

- Verify before claiming; measure before concluding.
- Report limitations unprompted. **Never conceal a known gap.**
- When a correction is warranted, make it plainly and move on.

A change is not done when the code is written. It is done when it has been
exercised the way a real user or a real producer will exercise it
(`SEB §23.2`), the documentation that describes it is true, and the report
names what was left open (`SEB §2.3`).

## §3.11 Comments explain the argument, not the syntax `[OBSERVED]`

The estate's own code and documents do this consistently and it is worth
making explicit. `WEC package.json` carries a `comment_on_modules` field
explaining why there is no `"type"` field and what breaks if one is added.
`WEC wrangler.toml` explains why secrets are not in it. `SHRS
approval-workflow-architecture §4` explains why `revoke` was deliberately
left out of the approval queue.

**Binding.** Where a decision would look like a mistake to a competent
reader, the comment says why it is not. Where a rule was learned from a
defect, the comment names the defect. Everything else needs no comment.

## §3.12 Quality gates, before anything ships `[OBSERVED]`

Adapted from `AMC-EB §45.1`'s five gates and `AMC-DX §14`'s six. Nothing
reaches a user without passing all of these, recorded:

| Gate | Checks | Owner |
|---|---|---|
| **G1 · Truth** | Every fact verifiable and dated; no invented claim; `SEB §2.4` compliance; the deployment vocabulary used correctly | Editorial |
| **G2 · Integrity** | Islamic identity standards in full where they apply; safeguarding paths intact; no autonomous high-stakes decision | Academic Board |
| **G3 · Language** | Arabic reviewed by a second native speaker; English house style; RTL parity at every breakpoint | Editorial |
| **G4 · Design** | The component canon only; tokens only, no ad-hoc values; the design tests; light/dark and RTL parity | Design Authority |
| **G5 · Technical** | Accessibility automated **and** manual, both languages; performance budgets; the responsive gate in a real browser; security; privacy | Engineering |
| **G6 · Governance** | Every control stated as *enforced*, *recordable* or *aspirational*; audit trail present; no `SEB §26` ruling breached | Engineering + Board |
