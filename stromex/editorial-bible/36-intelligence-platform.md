# Volume 36 — The StromeX Intelligence Platform

*What was scoped as "an MCP" is the operating layer of the company. This
volume names it correctly and specifies the parts that were missing from
the smaller framing.*

---

## §36.1 The correction

The original brief asked for an infrastructure MCP: a tool surface over
seven providers. What the estate actually needs — and what the Founder
described — is larger, and calling it by the smaller name would have
produced the smaller thing.

> **The StromeX Intelligence Platform** is the layer through which the
> company designs, builds, operates, governs and remembers everything it
> makes.

The MCP is one component of it — the **execution surface**. It is not the
platform.

## §36.2 The architecture

```
                        ┌─────────────────────────────┐
                        │      EXECUTIVE  (Claude)     │
                        │  plans · decides · executes  │
                        │  verifies · owns the outcome │
                        └──────────────┬──────────────┘
                                       │
   ┌───────────────────────────────────┼───────────────────────────────────┐
   │                                   │                                   │
   ▼                                   ▼                                   ▼
┌────────────────┐          ┌─────────────────────┐          ┌──────────────────────┐
│  GOVERNANCE    │          │   EXECUTION (MCP)    │          │      COUNCIL         │
│                │          │                      │          │                      │
│ Master         │  binds   │  the gate:           │ consults │  OpenAI  (expert)    │
│ Constitution   │─────────▶│  policy · approval   │─────────▶│  future providers    │
│ Editorial      │          │  journal · audit     │          │  through one seam    │
│ Bible          │          │  redaction           │          │                      │
│ Design Bible   │          │                      │          │  SEB §32             │
│ AI Constitution│          └──────────┬───────────┘          └──────────────────────┘
└────────────────┘                     │
        ▲                              ▼
        │              ┌────────────────────────────────────┐
        │              │           PROVIDERS                 │
        │              │  Cloudflare · GitHub · Neon         │
        │              │  Vercel · Clerk · Resend · Brevo    │
        │              │  + payments · analytics · monitoring │
        │              └────────────────┬───────────────────┘
        │                               │
        │              ┌────────────────▼───────────────────┐
        └──────────────│         KNOWLEDGE GRAPH             │
           feeds       │  what exists · what was decided     │
                       │  what was learned · what is open    │
                       │  the estate's memory  (SEB §36.4)   │
                       └────────────────┬───────────────────┘
                                        ▼
                       ┌────────────────────────────────────┐
                       │         DEPLOYMENT BRAIN            │
                       │  prepare · deploy · verify · roll   │
                       │  back · report      (SEB §36.5)     │
                       └────────────────────────────────────┘
```

## §36.3 The five components

| | Component | What it is | Status |
|---|---|---|---|
| **1** | **The Executive** | Claude, operating under `MC` and `SEB §16`. Plans, decides, executes, verifies, owns the outcome. **Not one voice among several — the accountable one** | Live |
| **2** | **Governance** | The Master Constitution, the Editorial Bible's 36 volumes, and each institution's own bible. Binds the executive; encoded in the gate where it can be | `Developed` |
| **3** | **Execution** | The MCP: the gate, eight provider adapters, the workflow engine, the audit trail | `Tested Locally` |
| **4** | **The Council** | OpenAI today, others through one adapter seam. Expert consultation, never delegation (`SEB §32`) | `Tested Locally` |
| **5** | **Memory** | The knowledge graph, the audit trail, the decision log, the recovery journal | **Partly Designed — see §36.4** |

## §36.4 Memory — the knowledge graph `[RULED — confidence High]`

**The component the smaller framing was missing, and the one that
compounds.**

An executive that re-derives the estate from scratch every session is not
an executive; it is a very fast contractor. The knowledge graph is what
makes the fortieth session better than the fourth.

### What it holds

| Node kind | | Source of truth |
|---|---|---|
| **Institution** | Each institution, its bible, its authorities | The institutional bible |
| **System** | Each deployed or developed system, its status in the `SEB §17.2` vocabulary | The inventory |
| **Resource** | Every provider resource: account, type, identifier, project, purpose, whether the MCP manages it | Populated **from the providers**, never from memory (`SEB §10.9`) |
| **Decision** | Every `SEB-D`, `D-nn` and architecture record: question, options, ruling, reasoning, confidence, what would reverse it | Volume 25 |
| **Principle** | Every `[OBSERVED]` / `[RULED]` article, with its citations | The Bible |
| **Open question** | Every escalation, with what it blocks | `SEB §28.4` |
| **Lesson** | Every defect that taught a rule, with the rule it taught | `SEB §2.5`, `§23.2` |
| **Pattern** | Every canon component, its variants, its retirements | Volumes 30, 34 |
| **Consultation** | Every council consultation: what was asked, what came back, what was adopted | The audit trail |

### Three rules that make it trustworthy

1. **Populated from primary sources, never from recollection.** Resources
   come from the providers; decisions come from the log; principles come
   from the Bible. A graph built from memory is a rumour with a schema.
2. **Every node carries its provenance and its as-of date.** A node
   without one is not a fact (`MC §8`).
3. **Committed to git.** Its diff is the change log of the estate, and a
   graph nobody can diff is a graph nobody can audit.

### Read at the start of every project

Step 2 of `MC §6`. The executive begins by reading the graph, not by
re-reading every repository — and where the graph is silent, *that
silence is itself information*, and it is recorded.

**Status: `Designed`.** The MCP's `stromex.inventory.*` tools populate the
resource layer; the decision, principle, open-question and lesson layers
exist as documents and are not yet a graph. Building it is the next
substantial piece of work after the design system.

## §36.5 The deployment brain

Not a new component so much as a promotion: the workflows already in the
MCP (`prepare · deploy · rollback · validate · report`) become the single
path by which anything reaches production, with the deployment vocabulary
(`SEB §17.2`) as its only permitted output.

**Every deployment writes to the knowledge graph**: what changed, which
commit, which environment, what the health check said, what was skipped.
The graph therefore always knows what is running where — which is the
question the estate currently cannot answer from any document
(`SEB §10.9`).

## §36.6 Extending the platform

Each of the four extension seams takes one new member without a rewrite
(`SEB §24.5`):

| Seam | Next members |
|---|---|
| **Provider adapter** | Payments (Stripe, Paystack, Flutterwave, Opay — the estate already has adapters for all four at application level), analytics, monitoring, error tracking, SMS |
| **Council adapter** | Any model with an official API |
| **Workflow** | Any multi-step operation, with compensation and a report |
| **Graph node kind** | Any new thing the estate needs to remember |

**The rule that keeps it one platform:** a new member goes behind the
existing interface, under the existing gate, into the existing audit
trail. A capability that needs its own policy engine is not part of this
platform.

## §36.7 What the platform guarantees, whatever it grows into

Unchanged by any extension, because they are `MC §2`:

1. **Institutional records are never destroyed by it.**
2. **No claim it makes is unevidenced**, and every status word it uses is
   from the `SEB §17.2` vocabulary.
3. **No credential leaves it** — not to a log, a result, a repository, or
   a council member's context.

Plus two the platform adds:

4. **Everything is on the record**, in one hash-chained audit trail,
   refusals included.
5. **Every consultation is weighed, not obeyed** (`SEB §32.4`). The
   executive remains accountable for what it adopts.

## §36.8 Roadmap

| Phase | | Status |
|---|---|---|
| 1 | Core runtime, the gate, seven providers, workflows, tests, docs | **Developed / Tested Locally** |
| 2 | The council: OpenAI connector, sixteen consultations | **Tested Locally** |
| 3 | The design system as real code | *In progress* |
| 4 | **The knowledge graph** — schema, population from primary sources, `stromex.graph.*` tools | Designed |
| 5 | First real credential per provider; `doctor` green; the `Not Started` rows in `SEB §28.5` begin to close | **Blocked on `SEB §28.4` Q3 and Q9** |
| 6 | The deployment brain against a real preview environment | Blocked on 5 |
| 7 | Payments, analytics and monitoring adapters | Not started |

## §36.9 What this volume does not claim

- **The platform has never operated a real estate.** Every adapter is
  proven against scripted providers; no adapter has met a real credential
  (`SEB §28.5`).
- **The knowledge graph does not exist yet.** Its schema is designed and
  its resource layer is reachable; the rest is documents.
- **The council has never been consulted for real.** The connector is
  tested against a scripted OpenAI, and no consultation has been made.

Each of those closes with one credential and one afternoon. None of them
is closed by writing about it.
