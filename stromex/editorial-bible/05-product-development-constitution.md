# Volume 5 — The Product Development Constitution

*How work is chosen, sequenced, reviewed and declared finished.*

---

## §5.1 The flagship standard `[OBSERVED]`

**No minimum viable products unless one is explicitly requested.**
Every deliverable is built to a standard at which it could serve as the
flagship product of a leading institution: enterprise architecture,
premium experience, performance, scalability, maintainability,
accessibility, security, resilience, observability, documentation,
testing, extensibility.

This is not gold-plating. It is the estate's observed practice — a school
website with a hash-chained archive register, a college with a
machine-verified colour gate, a static site with 1,949 static and 370
rendered-browser checks. The standard is already set; this article stops
it being renegotiated per project.

**The one legitimate reduction** is *scope*, never *quality*. Build fewer
things, finished, rather than more things, provisional
(`SEB §5.5`).

## §5.2 Phases, and a gate between each `[OBSERVED]`

`AMC README`'s ten-phase model, generalised:

1. Editorial Bible / specification
2. Institutional strategy
3. Academic or domain framework
4. Brand identity system
5. Information architecture
6. UI/UX design system
7. Experience design (admissions, onboarding, the primary journey)
8. Commercial model
9. Technology architecture
10. Implementation roadmap

Each phase is reviewed against the `SEB §3.12` quality gates before the
next begins. **A phase may be blocked by an open decision, and being
blocked is a legitimate state** — `AMC` records Phase 3 as blocked on a
credit framework and Phase 9 blocked on a data-residency position, and
does not pretend otherwise.

## §5.3 Adversarial self-review is a phase, not a courtesy `[OBSERVED]`

The estate runs **peer reviews by simulated panels** and treats the
findings as work: `AMC` ran nine panels over Phase 1 (26 findings, 2
critical), ten panels over the identity system (28 findings, including
three internal contradictions in the system itself), and a nine-persona
walkthrough of the shipped site that found "six of the nine failures are
absences of fact, not of design."

**Binding.** Every major deliverable is reviewed adversarially before it
is called finished, by panels chosen to *disagree* — a regulator, an
accreditation reviewer, a foreign registrar, an employer, a sceptical
parent, a security reviewer, an accessibility auditor. Findings are
numbered, and each is either **fixed in place** or **registered with an
owning phase**. Neither "noted" nor "won't fix" is an outcome; the second
is spelled "rejected, with the reason."

## §5.4 The persona walkthrough finds what review cannot `[OBSERVED]`

`AMC-DX §13`'s method, recorded there as "proven in the SHRS project;
finds absences that visual review cannot." Walk the real surface as each
named reader and record **gets / doesn't get / verdict**.

Its most valuable property is the one `AMC` discovered: most failures a
walkthrough finds are **missing facts, not missing design** — which is a
different work item, owned by a different person, and would never have
surfaced from a design critique.

## §5.5 Nothing ships provisional and unlabelled `[OBSERVED]`

`AMC-DX §16` is the model: a built component sits **Held** — "built and
deliberately empty" — because populating it would mean authoring a signed
statement in a real person's name, "which `EB §46.3` forbids and which no
amount of design value justifies. It ships the day the Founder or a named
academic head supplies their own words."

**Binding.** Where a feature is complete but its content is not yet real,
it is *held*, visibly, with the trigger that releases it. It is not filled
with plausible placeholder content, and it is not quietly hidden.

## §5.6 The future-considerations register `[OBSERVED]`

`AMC docs/06-future-considerations-register.md`: 22 valuable-but-premature
ideas, **each with the trigger that would revive it** — plus items
rejected on principle, which have no trigger at all.

**Binding.** A good idea that is not now is written down with its trigger.
A good idea that is never is written down in Volume 27 with no trigger.
Neither is left in someone's head, and neither is silently dropped.

## §5.7 Progressive disclosure; simplicity is a discipline `[OBSERVED]`

`SX-EB Part II` and `Part VI`: "power is earned through progressive
disclosure, not default clutter"; the first five minutes must be simple
enough for a first-time, low-digital-literacy user while depth stays
available to power users without being hidden.

## §5.8 What is measured `[OBSERVED]`

`AMC-EB §32.4` and `SX-EB Part IV` between them set the estate's
measurement philosophy, and it is unusual enough to be worth stating:
**the metrics optimised are comprehension, completion and trust — never
time-on-app, session count or engagement.** `SX-EB` is explicit that
StromeX is "not an engagement-maximising, ad-supported attention
product," and `SX-EB Part II`'s educational values put it plainly:
"the learner's actual comprehension is the metric — not time-on-app."

For AI-bearing surfaces, `SX-EB Part IV`'s measurable standards apply:
citation coverage ≥95% in research, education and Islamic-content modes;
hallucination rate red-teamed per domain with a stricter bar for
religious, legal and medical content; refusal correctness approaching 100%
on out-of-scope rulings, audited quarterly; factual variance across
repeated identical queries bounded (stylistic variance is allowed,
factual variance is not).

## §5.9 Definition of done `[RULED — confidence High]`

A unit of work is done when **all** of these are true, and a report that
claims done without them is a `SEB §26.8` breach:

1. It does what was asked, including the parts that were tedious.
2. It has at least one test driven by the real producer of its inputs
   (`SEB §23.2`).
3. Its errors carry a code, a message and a remediation.
4. Its audit trail exists and has been read once by a human.
5. The documentation describing it is true *now*, not aspirationally.
6. Its limitations are written down where the next person will look.
7. It passes the `SEB §3.12` gates that apply to it.
8. What it left open is named, with an owner.
