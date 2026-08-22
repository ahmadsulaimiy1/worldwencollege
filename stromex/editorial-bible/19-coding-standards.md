# Volume 19 — Coding Standards

*Short, and enforceable. Style is settled by a formatter; this volume is
about the things a formatter cannot settle.*

---

## §19.1 Write code that reads like the code around it `[OBSERVED]`

Match the surrounding file's comment density, naming and idiom. A file
written in a personal style is a file only its author can maintain, and
the estate has enough long-lived code that this matters more than any
individual preference.

## §19.2 Types are a design tool, not a formality `[RULED — confidence High]`

- New code is **fully typed**, with `strict` on and no implicit `any`.
- **The type describes the domain**, not the wire: `OperationClass`,
  `SecretRef`, `AuditRecord` — never `string` where a union exists.
- **Make illegal states unrepresentable** where the language allows it. A
  discriminated union costs one line and removes a class of bug.
- A value that must not be printed is a **type that cannot be printed**
  (`SecretRef`), not a convention.

Where a project is deliberately untyped JavaScript for a runtime reason —
as the estate's Pages Functions are, to keep zero build steps at the edge
— that decision is recorded in the file that would otherwise carry the
build (`WEC package.json`'s `comment_on_modules` is the model), and JSDoc
carries the contract.

## §19.3 Errors `[RULED — confidence High]`

Every error a caller can act on carries three things: a **stable code**, a
**message** naming what failed on what resource, and a **remediation** —
one sentence saying what to do next.

- Callers branch on the **code**, never on message text.
- Codes are additive; they are never renumbered or reused.
- **An error that cannot say what to do next is not finished being
  written.**
- An unanticipated failure says so honestly rather than inventing a
  remediation.

## §19.4 No silent failure, no silent success `[OBSERVED]`

- A caught error either changes what the caller does, or it is not caught.
- A truncated result set, a skipped item, a fallback provider or a
  degraded mode **appears in the result**, in a `warnings` field a caller
  can see. Silent truncation reads as "covered everything" when it did not.
- A no-op reports itself as a no-op, not as a success.

## §19.5 Validate at the boundary, trust inside it `[RULED — confidence High]`

Every external input — HTTP body, tool argument, provider response,
environment variable, file — is parsed into a typed value at the edge.
Past that edge, the type is trusted and re-validation is noise.

## §19.6 Dry-run is a first-class mode `[RULED — confidence High]`

Every mutating operation accepts a `dryRun` flag and, under it, constructs
the exact request it would send, returns it, and sends nothing. It is the
cheapest possible review of a destructive plan and it costs one branch.

## §19.7 Concurrency and time `[RULED — confidence High]`

- **The clock is injected.** A module that calls `Date.now()` directly
  cannot be tested deterministically; every module in the MCP takes a
  `now` function with a real default.
- **Randomness is injected** for the same reason — and jitter is tested by
  supplying a fixed `random`.
- **Nothing sleeps without a cancellation path.**
- Every outbound call has a timeout (`SEB §11.8`).

## §19.8 Comments `[OBSERVED]`

`SEB §3.11`. Explain the argument, the defect that taught the rule, and
the thing that will look like a mistake. Do not explain the syntax.

## §19.9 Repository hygiene `[RULED — confidence High]`

- `node_modules`, build output, local state, credentials and machine-local
  logs are ignored, and the `.gitignore` says **why** for anything
  non-obvious — the estate already does this well.
- Lockfiles are committed.
- Generated artefacts that are expensive to reproduce are committed with a
  note on how to regenerate them; ones that are cheap are not.
- **Large binaries and licensed originals are not in git**; the licence
  register records where they live.

## §19.10 Commits and branches `[OBSERVED]`

- One logical change per commit; the subject says what changed and the
  body says **why**.
- Work happens on a feature branch, never directly on the default branch.
- A commit message never contains a credential, a personal email used as
  an identifier, or a model identifier (`SEB §26.7`).
- A revert says what it reverts and what will replace it.

## §19.11 The estate's language and runtime defaults `[OBSERVED]`

Recorded so a new project does not re-derive them:

| Context | Default |
|---|---|
| Edge functions | JavaScript ES modules, no build step, no runtime npm dependencies |
| Build tooling and site generators | Node, CommonJS or ESM as the existing tree requires |
| Backend services | TypeScript, ESM, Node ≥ 22 |
| Frontend applications | TypeScript; the framework the project's constraints choose, not the fashionable one |
| Database access from the edge | Neon's HTTP driver — **never raw TCP** (`SEB §27.1`) |
| Schema | SQL files, idempotent, one source of truth for column-level detail |

## §19.12 Performance is measured, not asserted `[OBSERVED]`

`AMC`'s colour and contrast gates and `SX-EB`'s audit both establish the
pattern: a claim about behaviour is a measurement or it is not made
(`SEB §2.5`). Performance budgets are numbers, checked in the build, on
the device the constitution names (`SEB §6.1`).
