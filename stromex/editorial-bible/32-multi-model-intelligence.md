# Volume 32 — Multi-Model Intelligence and Expert Consultation

*The engineering council. StromeX does not have one intelligence; it has
access to several, and treating them as a panel rather than a fallback is
worth more than any single one of them.*

**Implemented in `stromex/mcp/src/providers/openai/`** — an official-API
connector exposing structured consultation tools. Others attach through
the same seam.

---

## §32.1 The principle

> **You remain the primary executive agent.** Planning, implementation,
> verification, deployment and operations are yours. Other models are
> **expert consultants** — used where they add value, evaluated
> critically, never deferred to.

`SX-EB Part VII` already established multi-model orchestration as StromeX
product philosophy: *route each task to the best-fit capability, never
force one model to do everything.* This volume extends it from the product
to the **operator**.

## §32.2 When to consult

**Consult when another model can plausibly find something you would not.**
That is the whole test, and it has three reliable shapes:

| Shape | Why it works |
|---|---|
| **Adversarial** — "find what is wrong with this" | A second model is not invested in the first one's design and will attack it honestly |
| **Alternative-generating** — "give three approaches I have not considered" | `SEB §29.7` requires three genuinely distinct positions; a second model is the cheapest way to get past your own first instinct |
| **Independent validation** — "does this claim hold" | The most valuable use, and the least used |

**Do not consult** because a model is available. A consultation that
returns agreement you already had is tokens spent on reassurance.

## §32.3 The consultation surface

The connector exposes structured tools, each with a shaped prompt rather
than a free-text passthrough — because an unshaped "review this" returns
generic advice from any model:

| Tool | What it asks for |
|---|---|
| `openai.review.architecture` | Failure modes, scaling limits, coupling, the decision that will be regretted |
| `openai.review.code` | Correctness, security, edge cases, what the tests do not cover |
| `openai.review.security` | Threat model gaps, trust boundaries, the attack the author did not imagine |
| `openai.review.ux` | Friction, comprehension failures, the step where a real person gives up |
| `openai.review.accessibility` | Contrast, focus order, screen-reader semantics, motion sensitivity, RTL |
| `openai.review.performance` | Hot paths, payload, render cost, the metric that will regress first |
| `openai.review.data-model` | Invariants not enforced, impossible states representable, migration pain |
| `openai.review.api` | Naming, versioning, error shapes, what breaks a client |
| `openai.review.documentation` | What a new reader cannot follow; what is claimed but not true |
| `openai.content.refine` | Structure, precision, authority — **and the anti-AI register in `SEB §30.14`** |
| `openai.content.vet` | The anti-generic gate: *identify every sentence that reads as machine-written, and say why* |
| `openai.policy.draft` | A complete governance instrument to the 13-section standard (`SEB §18.1`) |
| `openai.education.author` | Curriculum, assessment items, rubrics — to `SEB §13.6`'s standard |
| `openai.research.brief` | Prior art, precedent, and what the field already knows |
| `openai.alternatives.generate` | Three genuinely distinct approaches, with trade-offs |
| `openai.validate.independent` | One claim, one verdict, and the reasoning |

## §32.4 How a consultation is weighed `[RULED — confidence High]`

Never adopt a recommendation because it came from a model. The procedure:

1. **Compare objectively.** What does it say that you did not?
2. **Identify agreement and disagreement**, and treat disagreement as the
   valuable part. Two models agreeing may mean the answer is right, or
   that both were trained on the same wrong thing.
3. **Explain the trade-offs** in your own words. If you cannot, you have
   not understood the recommendation and must not adopt it.
4. **Choose the strongest long-term solution** (`SEB §31.1` test 6).
5. **Record significant decisions** in Volume 25, naming the consultation
   and what it changed.

**A recommendation you adopt is yours.** "The consultant said so" is not a
reason, and it is not a defence.

## §32.5 Engineering requirements

- **Official APIs only.** Never an unofficial integration, never browser
  automation, never a scraped endpoint. A consultation path that breaks
  when a vendor changes their web UI is not an engineering platform.
- **Secure key management** through the same `SecretResolver` as every
  other credential (`SEB §9.2`). The key never appears in a result, a log
  or a transcript.
- **Modular from the first provider.** The connector is one adapter behind
  one interface; a second model is a second adapter, not a rewrite
  (`SEB §4.5`).
- **Every consultation is audited** — model, tool, token counts, duration,
  and a digest of the prompt. Never the full prompt if it could contain
  institutional data.
- **Cost is visible.** Token usage is reported in the result. A council
  that quietly spends is a council nobody will keep.

## §32.6 What is never sent

Hard boundary, and it is the reason this volume has a §32.6 at all.

**Restricted data never enters any model's context, of any provider, for
any purpose** (`SEB §22.7`, `SEB §22.9`):

- Safeguarding records
- Identity documents
- Credentials of any kind
- Health information
- Individual student, guardian or staff records
- Assessment data attributable to a named person
- Anything from a store classified Restricted

**Confidential data** — individual records generally — is sent only with a
recorded reason and only after de-identification. **When in doubt, send
the shape, not the data**: a schema instead of rows, a redacted sample
instead of a real one, a description instead of a document.

The connector enforces this at the tool boundary: a consultation tool
takes a **subject** and a **question**, not a database handle.

## §32.7 The long-term objective

The MCP becomes a **permanent multi-model engineering platform**:
infrastructure, development, testing, deployment, monitoring,
documentation and expert consultation, orchestrated through official
APIs, under one policy engine and one audit trail.

Maximum quality and productivity, with governance, security and
auditability intact — because a council with no record of what it advised
is a rumour.
