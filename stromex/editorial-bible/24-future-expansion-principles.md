# Volume 24 — Future Expansion Principles

*This Bible assumes many more institutions and products. These are the
decisions that make the thirtieth as cheap as the third — and the ones
that must be made **before** the second.*

---

## §24.1 What this platform is expected to carry `[OBSERVED — from the brief]`

Multiple schools · universities · colleges · registrar systems · learning
management · certificate engines · transcript systems · finance ·
admissions · HR · research · alumni · public websites · enterprise SaaS
products.

Every article below is a consequence of that list.

## §24.2 The five decisions that must be made before the second institution `[RULED — confidence High]`

Each is cheap now and expensive later, and the estate already carries the
evidence for why:

| # | Decision | Cost if deferred |
|---|---|---|
| 1 | **The tenant column exists and is enforced from the first migration** (`SEB §4.10`) | Retrofitting a tenant boundary is the most expensive migration in this domain |
| 2 | **Authorisation is `(actor, permission, area, scope)`** (`SEB §4.2`) | The second most expensive: every call site changes |
| 3 | **Notional learning hours recorded alongside every progression model** (`SEB §14.5`) | Un-accreditable awards, and history that was never captured |
| 4 | **Approval is a generic engine, used from the first joint control** (`SEB §26.5`) | Every "jointly" in every matrix stays decorative, as the estate's own audit found |
| 5 | **Archive-not-delete, structurally** (`SEB §26.1`) | A deleted transcript |

## §24.3 A new institution is configuration plus a bible, not a fork `[RULED — confidence High]`

The estate has four institutions and four codebases, and the duplication
is visible: three separate implementations of a portal, of a design
system, of a build pipeline. That was the right choice while the shape was
being discovered; it is the wrong choice for the fifth.

**Binding for new work.** A new institution supplies:

1. **Its own bible volumes** — identity, design language, brand, academic
   model, and any institution-specific constitution.
2. **Its own configuration** — palette tokens, type roles, class ladder,
   award ladder, policy codes, retention table, permission matrix.
3. **Its own content.**

It does **not** supply its own approval engine, permission engine, audit
trail, verification register, deployment pipeline or component canon.
Where it needs a variant, the variant is added to the shared system with
the institution's name on it, not forked.

## §24.4 Shared platform, separate data `[RULED — confidence High]`

One codebase and one deployment may serve several institutions. **Their
data does not mingle**, their credentials are separate, their audit trails
are separate, and their retention clocks run independently.

The test: *could an institution leave the group tomorrow and take its
complete record with it, and could the remaining institutions prove that
nothing of theirs went with it?* If not, the boundary is wrong.

## §24.5 The extension seams `[RULED — confidence High]`

The places a new capability is expected to attach, so that it does not
attach somewhere else:

| Seam | What plugs in | Contract |
|---|---|---|
| **Provider adapter** | A new infrastructure provider | One client, one tool table, one authority classification per tool |
| **Workflow** | A new multi-step operation | Declarative steps with validation, compensation and a report |
| **Component canon** | A new institutional component | Named against the generic convention it replaces (`SEB §7.3`) |
| **Policy code** | A new governance area | A prefix in the index, with Missing entries as a map |
| **Record type** | A new institutional record | Rows in both data registers, with archive and destruction authority stated (`SEB §22.1`) |
| **Authority class** | — | **Closed. Three classes.** A fourth is an amendment, not an addition |

## §24.6 Absorb before you build `[OBSERVED]`

`AMC docs/11-shrs-feature-register.md` is the model: before building, the
existing estate was inventoried **feature by feature** — 148 pages, 74
client modules, 40+ backend functions — with **a decision and a reason for
each: build, adapt, gated, or rejected.** Six were built, twenty-two were
gated on a fact only the Founder could supply *each with its trigger*, and
seven were rejected on a ratified principle.

**Binding.** A new project's first deliverable is a feature register of
what already exists in the estate, with one of those four decisions
against every item. **"We didn't know it existed" stops being available as
an explanation.**

## §24.7 The future-considerations register `[OBSERVED]`

`SEB §5.6`. Every good idea that is not now is recorded **with the trigger
that would revive it**. Every idea rejected on principle is recorded in
Volume 27 **with no trigger**.

The value is asymmetric and worth stating: the register costs a line and
saves the same argument being had every year by people who were not there
the first time.

## §24.8 Standards do not scale down `[OBSERVED]`

`SX-EB Part IX`, reproduced because it is the closing rule of that
constitution and belongs here too:

> Nothing in the standards is scale-contingent. **What changes with scale
> is the infrastructure and process required to uphold them, never the
> standards themselves.**

A pilot with four students gets the same honesty protocol, the same audit
trail, the same accessibility floor and the same archive discipline as a
platform with forty thousand. The infrastructure is smaller; the standard
is identical.

## §24.9 The next five things, in order `[RULED — confidence Medium]`

Ordered by *what unblocks the most*, not by what is most interesting. Each
is reversible; the ordering is the only claim.

1. **A preview environment for one project, with real test-mode
   credentials.** It converts a long list of "Developed" into evidence and
   closes most of `WEC-EP §3`'s open register (`SEB §17.6`).
2. **The infrastructure inventory, populated from the providers**
   (`SEB §10.9`) — the estate currently cannot answer "what do we have?"
   from any document.
3. **A CI pipeline on every project** — one has none at all (`SEB §11.3`).
4. **Secret rotation, rehearsed once per provider** (`SEB §11.7`) — the
   estate's existing shared secrets do not rotate.
5. **The Incident Response Policy** — already named as the most concrete
   unmet governance need (`SEB §9.9`).

**What is deliberately *not* on this list:** any retention or deletion
capability (`SEB §26.2`), any real personal data in production
(`SEB §22.11`), and any automated purchasing (`SEB §26.6`). All three are
blocked on decisions that are yours, not engineering's.
