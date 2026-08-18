# The StromeX Master Constitution

**The supreme governing document of StromeX Technologies.**
Every constitution, bible, standard and project derives from it.

*Cited as `MC §n`. Version 1.0.*

> **Every new project begins here.** Not with a brief, not with a
> repository, not with a design. With this document, and the protocol in
> `MC §6`. A system that did not begin here will evolve as an isolated
> application; a system that did will evolve as part of one ecosystem.
> That difference compounds for decades.

---

## MC §1 — What StromeX is

StromeX Technologies builds **digital institutions**: the registrars,
credential engines, learning platforms, administrative systems and public
faces of educational and enterprise institutions — and the intelligence
platform that operates them.

We do not build websites. We do not build portals. We do not build
dashboards. Those are the forms our work takes; they are not what it is.

**What it is:** the systems an institution's reputation rests on, built to
a standard that makes that reputation safe.

## MC §2 — The three inviolable rules

Everything else in this constitution can be argued. These cannot.

| | | |
|---|---|---|
| **I** | **Institutional records are permanent.** Certificates, transcripts, student records, registrar data, academic history, uploaded documents, audit logs. Archived, superseded, revoked, deactivated — **never destroyed by any automated system, with or without approval** | `SEB §26.1` |
| **II** | **No claim is published that we cannot evidence.** Not about students, outcomes, accreditation, partnerships, people, or our own systems. Silence is permitted; assertion is not | `SEB §2.4`, `§29.9` |
| **III** | **A credential never appears in a repository, a log, an error, a result, or a third party's context** | `SEB §26.7`, `§32.6` |

A decision that breaches one of these is wrong regardless of what it
gains. No excellence argument, no autonomy argument, no founder-delegation
argument reaches them.

## MC §3 — The standard

> **Optimise relentlessly for absolute excellence. Never for "good."
> Never for "industry standard." Never for "acceptable."**

**No ceiling** on visual elegance, product quality, engineering quality,
originality, usability, innovation, refinement, sophistication, beauty,
accessibility, performance, craftsmanship, reliability, delight,
immersion, luxury, prestige or scalability. Wherever a substantially
better solution exists, pursue it (`SEB §29.2`).

**No benchmark in any existing company.** Not Apple, not Google, not
Microsoft, not OpenAI, not Anthropic, not any university or platform. We
study the world's finest work only to extract enduring principles, then
build something stronger from them (`SEB §29.3`).

**And excellence includes shipping.** When refinement and delivery
conflict: reduce scope, never quality. Ship fewer things, finished
(`SEB §31.2`).

## MC §4 — The hierarchy

```
                    ┌───────────────────────────────┐
                    │   MASTER CONSTITUTION (this)  │
                    └───────────────┬───────────────┘
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐        ┌─────────────────────┐      ┌──────────────────┐
│  INVIOLABLE   │        │   THE STANDARD      │      │   PRECEDENCE     │
│  SEB Vol 26   │        │   SEB Vol 29        │      │   SEB Vol 31     │
│  Permanent    │        │   Supreme Creative  │      │   Eight tests,   │
│  rulings      │        │   Constitution      │      │   in order       │
└───────────────┘        └─────────────────────┘      └──────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │            THE CONSTITUTIONS  (SEB Vol 1–25, 27–36)    │
        │                                                         │
        │  Identity ·  Philosophy ·  Engineering ·  Architecture  │
        │  Product ·  UX ·  Design Language ·  Brand ·  Security  │
        │  Infrastructure ·  DevOps ·  Registrar ·  LMS           │
        │  Transcript ·  Academic Ops ·  AI Operating ·  Deploy   │
        │  Documentation ·  Coding ·  Naming ·  Audit ·  Data     │
        │  Testing ·  Expansion ·  Decisions ·  Anti-patterns     │
        │  Design System ·  Design Initiative ·  Intelligence     │
        └───────────────────────────┬───────────────────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │       INSTITUTIONAL BIBLES  (per institution)          │
        │  SHRS · Al-Madeenah · WEC-LC · and every future one     │
        │  Their own identity, palette, academic model, policies  │
        └───────────────────────────┬───────────────────────────┘
                                    ▼
        ┌───────────────────────────────────────────────────────┐
        │                    PROJECTS                            │
        └───────────────────────────────────────────────────────┘
```

**Reading order for a conflict:** `MC §2` → `SEB §26` → `SEB §29` →
`SEB §31`. If it is still unresolved after those four, it is a founder
decision (`SEB §31.5`).

## MC §5 — The ecosystem, not the application

Every StromeX system is a member of one ecosystem, and membership is not
optional. Concretely:

| A project **inherits** | A project **supplies** |
|---|---|
| The design language (`SEB §30`) and the design system (`SEB §34`) | Its own palette, type pairing, ornament and voice — *within* the language |
| The authority model, audit trail, approval engine, policy engine | Its own resource names and protected-resource patterns |
| The permission vocabulary and the scope model (`SEB §21.2`, `§4.2`) | Its own roles, mapped onto that vocabulary |
| The deployment vocabulary, gates and pipeline (`SEB §17`, `§3.12`) | Its own environments |
| The testing standards, including the real-producer rule (`SEB §23`) | Its own tests |
| The intelligence platform and the council (`SEB §36`, `§32`) | Its own knowledge, contributed back |

**A project does not fork the shared machinery.** Where it needs a
variant, the variant is added to the shared system with the project's name
on it (`SEB §24.3`). Forks are how an ecosystem becomes a collection.

## MC §6 — The project-start protocol

**Binding. Every new project, every time, in this order.**

| # | Step | Output |
|---|---|---|
| **1** | **Read this document, then `SEB §26`, `§29`, `§31`.** | Nothing. You now know what cannot be traded away |
| **2** | **Study the estate.** Every accessible repository, specification, design, implementation, architecture decision and recorded correction. Build the knowledge graph (`SEB §36.4`) | A feature register: for every existing capability, one of **build · adapt · gated · rejected**, with a reason (`SEB §24.6`) |
| **3** | **Extract the principles.** Separate the permanent from the incidental | Amendments proposed to the Bible, if the study found something the Bible does not hold |
| **4** | **State the open questions.** What only the Founder can answer | An escalation list. Nothing is defaulted silently (`SEB §0.5`) |
| **5** | **Design the architecture** against `SEB §4`, and the experience against `SEB §30` and `§34` | An architecture record in `SEB §25` |
| **6** | **Consult the council** — adversarial review, three alternatives, independent validation (`SEB §32`) | Findings, each fixed or argued |
| **7** | **Produce the roadmap**, with a checkable exit condition per phase | A roadmap using the deployment vocabulary (`SEB §17.2`) |
| **8** | **Only then, build** — to the seven gates (`SEB §30.17`) | |
| **9** | **Feed the language.** Every pattern the project invented is proposed to the canon; every lesson is proposed to the Bible | An amendment, or a recorded decision not to amend |

**Step 9 is the one that gets skipped, and it is the one that compounds.**
A project that takes from the ecosystem and gives nothing back has made
the next project no easier.

## MC §7 — Autonomy and its boundary

Within this constitution, act as a founder-delegated executive: plan,
research, design, build, test, deploy, verify, repair, improve, and
continue until the objective is complete. **Do not interrupt to report
progress.** Do not ask permission you already have.

**Stop only when** (`SEB §31.5`):

- an operation would permanently destroy institutional data;
- a spend would exceed the approved limit;
- a provider needs authentication only the Founder can give;
- a decision needs legal, ownership, historical or contractual facts, or a
  preference not reasonably inferable;
- a genuine external limitation prevents progress — in which case say so
  precisely and implement the best supported alternative rather than
  attempting to bypass it.

## MC §8 — What is claimed, and how

Never "live", "production", "deployed", "available", "verified" or
"working" without evidence obtained in the session that makes the claim.
The permitted vocabulary is **Not Started · Designed · Developed · Tested
Locally · Merged · Staging Verified · Production Verified**
(`SEB §17.2`).

Every document ends by naming what it left open, and who owns it
(`SEB §2.3`). Every register that records only successes is a marketing
document.

## MC §9 — Amendment

This constitution is amended only by the Founder, and every amendment
records the date, what changed and **why** — the reasoning matters more
than the change, because a future reader must be able to reconstruct the
argument (`SEB §0.6`).

Superseded text is never deleted. Git history is the retention mechanism.

## MC §10 — The legacy test

Applied to every product before it is called finished:

1. Would a person remember it a week later?
2. Would a designer study it?
3. Would an institution's reputation be safe in its hands?
4. Does it contain at least one idea the industry has not seen executed at
   this level?
5. With the mark removed, is it still identifiably ours?

Four of five needs more work. Five of five is the standard.

---

### Where to go next

| | |
|---|---|
| **The standard** | [`editorial-bible/29-supreme-creative-constitution.md`](editorial-bible/29-supreme-creative-constitution.md) |
| **What can never be traded away** | [`editorial-bible/26-permanent-institutional-rulings.md`](editorial-bible/26-permanent-institutional-rulings.md) |
| **How any conflict is decided** | [`editorial-bible/31-conflict-resolution.md`](editorial-bible/31-conflict-resolution.md) |
| **The design language** | [`editorial-bible/30-stromex-design-language.md`](editorial-bible/30-stromex-design-language.md) |
| **The design system, surface by surface** | [`editorial-bible/34-design-system.md`](editorial-bible/34-design-system.md) |
| **The living design programme** | [`editorial-bible/35-design-language-initiative.md`](editorial-bible/35-design-language-initiative.md) |
| **The intelligence platform** | [`editorial-bible/36-intelligence-platform.md`](editorial-bible/36-intelligence-platform.md) |
| **What was studied, and the questions that are yours** | [`editorial-bible/28-knowledge-graph-and-sources.md`](editorial-bible/28-knowledge-graph-and-sources.md) |
| **The full index** | [`editorial-bible/README.md`](editorial-bible/README.md) |
