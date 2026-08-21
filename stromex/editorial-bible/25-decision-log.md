# Volume 25 — The Decision Log

*Cited as `SEB-D nn`. Every decision taken in producing this Bible and the
MCP beneath it, plus the estate's closed decisions carried forward so they
are not re-litigated.*

**Format** (from `AMC-D`): the question · why it could or could not be
answered here · the options · the ruling and its reasoning · confidence ·
what it blocks · **what would reverse it**.

**Status key:** ✅ closed · 🔴 critical and open · 🟡 needed soon ·
🟢 can wait

---

## Part A — Decisions carried forward from the estate

Recorded, not re-decided. Each remains owned by the register it came from.

| # | Decision | Ruled | Source |
|---|---|---|---|
| **A-1** | Sulaimiy Education Group is an umbrella; Al-Madeenah is its tertiary and international arm. **Structure ruled; no group *fact* may be published until evidenced and dated** | 2 Aug 2026, Founder | `AMC-D D-01` |
| **A-2** | Institutional name: *Al-Madeenah International College for Arabic & Islamic Studies*, superseding the earlier ratified name | `AMC-D D-13` (executive) | `AMC-D` |
| **A-3** | No ijāzah issued; a four-award ladder instead, with published conditions under which ijāzah could ever be issued | 2 Aug 2026, Founder | `AMC-D D-04` |
| **A-4** | Disclosed regional pricing, band set by declared residence and verified at payment; price locked for the duration of an enrolled programme | 2 Aug 2026, Founder | `AMC-D D-10` |
| **A-5** | The **naming propriety veto gate** binds every future name | `AMC-EB §8.4` | `AMC-D D-02` |
| **A-6** | Governance restructuring: no office of Chief Executive Officer; the Founder holds Head of Schools / Administrator together with Chairman of the Board of Governors | 4 Aug 2026, Board | `SHRS GV-01` v3.0 |
| **A-7** | **Delete is granted nowhere on core institutional records**; Archive is the mechanism | `SHRS role-permission-matrix §2` | SHRS |
| **A-8** | The Ijazah register is permanent, never deleted, only annotated — enforced structurally | `SHRS IQ-02 §7.6` | SHRS |
| **A-9** | Executive autonomy protocol in force: decide and record, escalate only the named list | 2 Aug 2026, Founder | `AMC-D` |
| **A-10** | Certificates first in the digital-campus sequence, ahead of digital ID, finance, analytics and the full LMS | Board, revised sequencing | `SHRS certificate-transcript-system` |

## Part B — Decisions ruled while producing this Bible

### SEB-D 01 ✅ The Bible's scope is the estate, not a project

**Question.** Should this be documentation for the MCP, or an
institutional constitution?

**Ruled.** An institutional constitution, with the MCP as its first
downstream implementation. The brief asked for the second framing
explicitly, and the estate's own pattern — four projects, four bibles,
each re-deriving the same principles — is the problem it solves.

**Confidence High.** **Reversal:** none foreseen; the MCP documentation
remains separate under `stromex/mcp/docs/` either way.

### SEB-D 02 ✅ Volume structure follows the brief's list, in the estate's constitutional form

**Ruled.** Twenty-nine volumes matching the requested list, written as
numbered, citable articles with `[OBSERVED]` / `[RULED]` / `[OPEN]`
markers and confidence levels — the form already proven at `AMC-EB` and
`AMC-D`.

**Reasoning.** A constitution nobody can cite is a manifesto. Article
numbering is what let `AMC` say "`EB §46.3` forbids this" and have the
argument end.

**Confidence High.**

### SEB-D 03 ✅ Three authority classes, not more

**Question.** How many authority classes should govern automated
operations?

**Options.** (a) Two — read and write. (b) **Three — read, write,
protected.** (c) Five or more, mirroring the ten permission codes.

**Ruled: three** (`SEB §21.3`), with the ten-code permission vocabulary
mapping onto them.

**Reasoning.** Two cannot express the estate's central distinction
between archiving and destroying. Five or more puts a judgement call at
every tool definition, and the estate's own evidence is that judgement
calls at definition time are where controls quietly stop being controls.
Three is the smallest set that carries `SEB §2.2`.

**Confidence High.** **Reversal:** an amendment; a fourth class is an
amendment, not an addition (`SEB §24.5`).

### SEB-D 04 ✅ Protected resources are refused outright, not gated behind approval

**Question.** Should destroying an institutional record be *impossible*,
or *possible with sufficient approval*?

**Ruled: impossible through automation** (`SEB §26.1`). A protected
resource match is a terminal refusal with **no approval path**.

**Reasoning.** An approval path that exists will eventually be used, at
2 a.m., by a tired person, on the wrong resource. The estate's strongest
existing control — the Ijazah register — works precisely because **no
delete path exists**, not because one exists behind a check. Copying that
is cheaper than defending an approval flow.

**The cost is real and accepted:** a legitimate deletion must be done by
hand in a provider console, by a person, with the audit trail that person
leaves. That is the correct amount of friction for the act.

**Confidence High.** **Reversal:** an amendment to Volume 26, which is a
MAJOR version change (`SEB §0.6`).

### SEB-D 05 ✅ The default protected-resource patterns name this estate's assets

**Ruled.** The MCP ships with patterns matching the estate's own
institutional records and production stores — audit, transcript,
certificate, registrar, student-record, enrolment, academic-history, the
existing production bucket and database names, and `*-production`.

**Reasoning.** A safety list shipped empty is a safety feature shipped
off. Defaults that name real assets are wrong in the safe direction: the
worst case is a refusal an operator must override deliberately.

**Confidence Medium.** **What would change it:** operating a real estate
and finding a pattern too broad. **The list is extended, never shortened,
without a recorded decision** (`SEB §26.1`).

### SEB-D 06 ✅ Automatic purchasing ships disabled

**Ruled.** `spending.enabled = false`, `maxSinglePurchase = 0`,
`monthlyCap = 0` by default; a purchase priced in a currency the policy is
not denominated in is refused rather than converted.

**Reasoning.** A budget ceiling is on the escalation list by definition
(`SEB §0.5`) and no figure exists anywhere in the corpus.

**Confidence High.** **Reversal:** you name the providers, the
single-purchase maximum, the monthly cap and the currency
(`SEB §28.4` Q3).

### SEB-D 07 ✅ The approval mechanism's limits are documented, not overstated

**Ruled.** Three layers — the host's permission prompt, elicitation, and
out-of-band grants — with an explicit statement that the third **does not
defend against an agent holding a shell on the same machine**, and a
named alternative (`protectedOperations=deny`) for where that matters
(`SEB §9.8`).

**Reasoning.** `SEB §2.6`: a control that is claimed and not enforced is
worse than one that is absent, because it is relied upon.

**Confidence High.**

### SEB-D 08 ✅ The MCP lives in `stromex/` and is built to be extracted

**Ruled.** `stromex/mcp`, self-contained, sharing nothing with the college
site around it, extractable with one `git subtree split`.

**Reasoning.** It is here because this is the only writable repository in
the session (`stromex/README.md`), which is a constraint, not a design.
`SEB §4.9` requires that a subsystem destined to move be built from day
one as if it already had.

**Confidence High.** **Reversal:** run the split.

### SEB-D 09 ✅ TypeScript, strict, ESM, Node ≥ 22 for the MCP

**Ruled.** Despite the estate's edge code being untyped JavaScript by
deliberate choice.

**Reasoning.** The edge choice exists to avoid a build step in a Workers
isolate — a constraint the MCP does not have. The MCP's core value is that
authority classes, permission codes and secret handling are **not
strings**, and that is a type-system job (`SEB §19.2`).

**Confidence High.**

### SEB-D 10 ✅ The MCP targets the current MCP specification, stdio first

**Ruled.** Built against the current published specification revision
using the official TypeScript SDK; stdio is the default transport;
Streamable HTTP is available, loopback-bound, bearer-authenticated and
`Origin`-validated (`SEB §9.7`).

**Confidence High.** **Reversal:** a specification revision; the SDK
version is pinned and upgraded deliberately.

### SEB-D 11 🟡 One shared HTTP client for all providers

**Ruled.** One client carrying timeouts, full-jitter retry, `Retry-After`
handling, per-provider rate limiting, per-provider circuit breaking,
value-based redaction and error normalisation — with the `fetch`
implementation injectable, which is the seam the whole mock-provider test
suite hangs from.

**Confidence High.** **Watch:** a provider whose semantics the shared
client cannot express without a special case. The special case goes in the
adapter, never in the client.

### SEB-D 12 🟡 Cloudflare Pages asset deployment goes through Wrangler, not the REST API

**Ruled.** Git-connected Pages deployments are triggered through the REST
API. **Direct asset upload is delegated to Wrangler**, and the limitation
is documented rather than worked around.

**Reasoning.** The direct-upload flow is a versioned, multi-step
protocol — an upload token, a hashed manifest, a separate asset endpoint —
that only Wrangler tracks reliably. Reimplementing it would produce a
fragile path that fails silently when the protocol moves. `SEB §16.9`:
where a provider limitation genuinely prevents full automation, say so
precisely and implement the best supported approach.

**Confidence Medium.** **What would change it:** Cloudflare publishing a
stable, documented single-call deployment API for direct-upload projects.

### SEB-D 13 🟡 Neon branches are the backup mechanism; byte-level dumps are not claimed

**Ruled.** `neon.backup.create` takes a **timestamped branch**, which is
Neon's own point-in-time mechanism. No `pg_dump` equivalent is claimed,
because it is not a provider API and the MCP does not shell out to
database tooling it cannot guarantee is present.

**Confidence Medium.** **What would change it:** a supported logical-export
API, or an explicit decision to depend on `pg_dump` in a controlled
runner.

### SEB-D 14 🟢 The MCP exposes tool profiles

**Ruled.** Provider tool groups are selectable, defaulting to all.

**Reasoning.** A server exposing well over a hundred tools consumes a
large share of a client's context before any work begins, and least
privilege applies to *capability surface*, not only to credentials
(`SEB §9.3`).

**Confidence Medium.**

### SEB-D 15 ✅ The Supreme Creative Constitution is ratified and takes precedence

**Ruled by the Founder.** Volume 29 overrides any earlier article that
counsels restraint where excellence is achievable; Volume 31 sets the
general order of precedence; Volume 26 remains inviolable above both.

**Confidence High** — this is a Founder ruling, not an inference.
**Reversal:** one sentence.

### SEB-D 16 ✅ Instrument-grade futurism, not neon futurism

**Question.** "Futuristic" and "luxurious" pull in opposite directions in
almost every product that attempts both. Which reading governs?

**Options.** (a) Neon/cyberpunk/HUD futurism. (b) Glass-and-gradient
"modern SaaS" futurism. (c) **Instrument-grade futurism** — machined
metal, optical glass, engraved ground, volumetric light, precision to a
tolerance a person can feel but not name.

**Ruled: (c)** (`SEB §29.4`).

**Reasoning.** Luxury is extraordinary attention to detail made
perceptible; futurism is capability not yet seen executed at this level.
Both are satisfied by an object manifestly engineered to a tolerance
nobody else bothers with. (a) and (b) are both dated the moment they
ship — (a) to 1982 and (b) to 2021 — and both are in the Anti-Generic
Register. (c) has no expiry, because precision does not go out of style.

**Confidence High.** **What would change it:** a Founder preference for a
different register. The *system* would survive it; only the material
vocabulary would change.

### SEB-D 17 ✅ The Meridian, the Quire and the Chronograph

**Question.** What makes a StromeX product recognisable with the mark
removed (`SEB §29.3`, gate G4)? Adjectives do not survive a build.

**Ruled:** three structural devices no other product uses, specified to
the value at `SEB §30.2`, `§30.3`, `§30.9`:

- **The Meridian** — a hairline spine at the minor golden section, running
  the full document height, carrying section marks and a scroll-tracked
  light node, with every heading hung from it rather than from the margin.
- **The Quire** — a folded-sheet grid with a fore-edge margin 1.618× the
  gutter, mirrored structurally in RTL, and a marginal track whose
  emptiness is the page's air.
- **The Chronograph** — every animation in every product timed on one
  240ms movement, with four authored curves and no spring, no bounce, no
  overshoot.

**Reasoning.** Each is (i) instantly distinctive, (ii) functionally
better than the convention it replaces, and (iii) checkable in a build.
A design language whose rules cannot be checked is a document.

**Confidence High.** **Reversal:** possible, but expensive — these are
load-bearing across every surface.

### SEB-D 18 ✅ Gaps are composed, not confessed

**Ruled by the Founder:** no editorial wording on any public surface. The
Institutional Status callout is withdrawn from marketing surfaces.

**How the honesty protocol survives intact** (`SEB §29.9`): the rule was
never "publish a callout"; it was "publish no fact you do not hold." A
gap is now handled by **not building the page** rather than by building a
page and apologising in it. Silence is permitted; assertion is not. Where
disclosure is legally required it is stated, in the register and wherever
the regulator requires. The status register moved from the marketing
surface to the governance register.

**Confidence High.** **Watch:** an accreditation or qualification-
recognition claim carries real legal exposure in several jurisdictions.
Composition never overrides a disclosure obligation, and the legal review
at `SEB §33.5` — not the design review — is where that is decided.

### SEB-D 19 ✅ Invention where the specification is silent

**Ruled by the Founder:** where a specification leaves a gap, produce the
complete professional instrument rather than flagging and stopping. What
is produced is adopted under standing instruction until the Founder says
"change so-and-so."

**What it narrows** (`SEB §29.10`): the prohibition on "inventing policy"
is narrowed to its real target — **fabricating a fact about the
institution** — and lifted from **drafting an instrument**. A policy, a
regulation, a workflow, a schema, a proposed retention period: draft it,
completely, with its reasoning and a version table.

**Confidence High.**

### SEB-D 20 ✅ Media: register provenance, do not gate

**Ruled by the Founder:** the institution asserts and holds its media
licences; unlimited uploads; **no automated flagging, blocking or
withholding**; legal review is the final filter.

**Implemented as** (`SEB §33`): no gate anywhere in the estate, and a
**provenance register** — accession number, source, rights basis as the
institution states it, who supplied it, hash, placement. The register
costs nothing at the point of use and turns a week of counsel's time into
a minute of it.

**What this Bible declines to do**, stated once and not repeated: it
records what the institution asserts and does not adjudicate it. That
determination is counsel's, which is where the Founder placed it.

**Confidence High.**

### SEB-D 21 ✅ The engineering council, through official APIs only

**Ruled:** the MCP gains an OpenAI connector exposing sixteen structured
consultation tools, with others attaching through the same adapter seam
(`SEB §32`).

**Three constraints that make it an engineering platform rather than a
convenience:** official APIs only — never browser automation, never a
scraped endpoint; every consultation audited with model, tokens, duration
and cost; **Restricted data never enters any model's context**, enforced
at the tool boundary by taking a *subject and a question* rather than a
data handle.

**Confidence High.** **Watch:** cost. Token usage is reported in every
result, because a council that quietly spends is a council nobody keeps.

### SEB-D 22 ✅ Excellence includes shipping

**Question.** The No-Ceiling Principle risks becoming no ceiling on time.

**Ruled** (`SEB §31.2`): when refinement and delivery conflict, **reduce
scope, never quality.** Ship fewer things, finished. Anything built but
not yet real is *held*, visibly, with its release trigger. Then improve
it — the first implementation is never the final one.

**Confidence High.**

### `SEB-D 23` — Signal colour is a role, not a pigment

**Decided 2026-08-18.** Measured, not chosen. On obsidian the three
signal pigments compute to 3.35:1, 2.43:1 and 2.29:1 — the last being the
focus ring, on every page, in the presented register.

| Option | |
|---|---|
| Keep the pigments and use them carefully | Rejected: "carefully" is unenforceable, and it had already failed four readings |
| Lighten the pigments globally | Rejected: they are then wrong on paper, where the base values are the legible ones (4.72–6.92:1) |
| **Register-resolved signal ROLES** | **Adopted.** The role resolves per register; the pigment does not. `gates/contrast.mjs` checks both registers; `gates/tokens.mjs` refuses a raw pigment in a colour position |

Lifted in lightness with hue and chroma held. Mixing toward the paper
white was easier and turned all three to mud.

**Confidence High** — the numbers are computed, not judged.

### `SEB-D 24` — `--sx-rule` and `--sx-boundary` are two tokens

**Decided 2026-08-18.** A hairline between ledger rows is decoration and
owes nothing; the rim of a text field is a user-interface component
boundary and owes 3:1. They were one token at 1.44:1. Splitting them was
the only option that did not either fail SC 1.4.11 or thicken every
hairline in the estate.

**Confidence High.**

### `SEB-D 25` — The Meridian is placed by the Quire, not by a percentage

**Decided 2026-08-18.** See `SEB §30.19.1`. The alternative — moving the
measure to sit after 38.2% — was rejected because it makes the grid
depend on the ornament rather than the ornament on the grid, and because
it cannot hold at every breakpoint without a second set of numbers to
keep in step by hand.

**Confidence High.**

### `SEB-D 26` — Gate exemptions are per line, reasoned, and printed

**Decided 2026-08-18.** A gate with no escape hatch gets deleted the
first time it is wrong; a gate with a silent one becomes decorative.

| Option | |
|---|---|
| No exemptions | Rejected: `linear` is genuinely correct for a value that updates every frame, and a gate that cannot express that will be removed |
| A config file of exemptions | Rejected: it separates the decision from the code, and nobody reads it |
| **Per-line annotation, printed every run with its reason** | **Adopted.** The decision lives where it was made, and every run shows what was let through |

**Confidence High.**

### `SEB-D 27` — No gate exists until it has been watched to fail

**Decided 2026-08-18.** `test/gates.test.mjs` injects each defect a gate
exists to catch and asserts the gate finds it. On its first run it
established that the declaration scanner was silently skipping every
single-line rule in the system while reporting a four-figure check count
and a green tick.

A green tick on a check that cannot fail is worse than no check, because
it stops people looking. **Standing requirement across the estate**, not
only in the design system.

**Confidence High.**

### `SEB-D 28` — The spending policy, named

**Decided 2026-08-18 by the Founder**, under `SEB §26.6`, which requires an
explicit recorded decision naming four things. Three are settled; the
fourth is open pending a costing.

| §26.6 requires | Ruled |
|---|---|
| **The currency** | **USD.** Not because the institution's money is USD — it is not — but because that is what the providers invoice in, and the policy refuses a mismatch rather than converting (`policy.ts:236`). See the Naira note below |
| **The maximum single purchase** | **US$25.** Deliberately tight: a standard `.com` or `.org` registration passes without interrupting anyone, and essentially everything else stops and asks. The Founder chose tighter than the US$100 recommended, and was right to |
| **The rolling monthly cap** | **US$150.** Derived, not chosen: the costing is at `mcp/docs/cost-model.md`. It is ~3× the OpenAI council's expected monthly use with room for a few domain registrations — comfortably above scenario B's $50 council line so it never fires during legitimate work, and low enough that a council loop is caught within days. **It bounds what passes through this server and nothing else** |
| **The approved providers** | **Vercel (registrar), OpenAI (the council), Resend and Brevo (email sending).** Infrastructure provisioning — Neon, Cloudflare, Vercel projects — is deliberately **excluded** |

**The Naira note.** The institution's operating currency is NGN and the
Founder's authority is denominated in it. The *policy* is denominated in
USD because that is the currency of the actual charge. The server never
converts; the conversion is the Founder's, made deliberately and on the
record. The NGN figure and its review trigger are recorded when the cap
is set.

**Two riders the Founder's answer did not ask for and gets anyway.**

1. `brevo.campaign.send` takes only a `campaignId`, so neither the tool
   nor the gate can know how many recipients it is about to bill for. It
   enters the spending scope with a declared recipient ceiling, or the
   limit is decorative.
2. Infrastructure provisioning is excluded from the spending scope and
   **still incurs cost** — `neon.project.create`, `cloudflare.d1.create`,
   `vercel.project.create` and six others create recurring charges as
   ordinary `write` operations. Excluded is not the same as harmless, and
   the register says so rather than letting the omission read as coverage.

**The Naira ceiling is DEFERRED** until there is a real invoice to
reconcile against. Recorded as open rather than derived from a rate
neither party has verified.

**Confidence High** on the ruling. **`SEB-D 29` was discharged
2026-08-18 in commit `cf603ef`, so this decision is now in effect** — the
server enforces every limit it names, and a test proves each one fails
without its fix.

### `SEB-D 29` — The spending controls were claimed and not enforced

**Found 2026-08-18** by a grounding pass run before putting Q3 to the
Founder; 44 of 44 claims confirmed against source, six further risks
found. §26.6 requires four things to be named; **three of the four were
not enforced, and the server reported that they were.**

| | Defect |
|---|---|
| 🔴 | `monthlyCap` is parsed, **required to be positive before spending can be enabled**, printed in the CLI banner and returned by `stromex.policy.describe` — and read by no decision anywhere. Three surfaces told an operator a cumulative budget existed |
| 🔴 | A successful purchase returns `warnings: ['Recorded in the audit log with its cost and reason…']`. `AuditRecordInput` has no cost field. The assurance was false in operator-visible output |
| 🔴 | Auto-renew defaulted to **true**, so a gated one-time purchase became an ungated perpetual annual charge — never approved, never audited, never counted |
| 🟠 | The gated amount was `args.maxPrice`, a ceiling the **caller** declares, not the price the registrar quotes |
| 🟠 | The currency check compared the caller's declared currency, never the provider's returned `price.currency` — the one control §26.6's own enforcement paragraph claims |
| 🟠 | Sixteen OpenAI council tools spend real money, declare no purchase, and are plain `write` |
| 🟠 | The audit log cannot serve as a compensating control: "bought" and "not bought, quoted above ceiling" both return `ok` and audit identically |

This is `SEB §2.6` exactly — *a control that is claimed and not enforced
is worse than one that is absent*. It is recorded here rather than
quietly corrected, because the estate's own honesty protocol binds
hardest when the finding is embarrassing.

**Ruled.** `SEB-D 28` does not take effect until every row above is
implemented, tested with a test that fails first, and the documentation
corrected. **Confidence High.**

### `SEB-D 30` — Credential scope, and a risk knowingly accepted

**Decided 2026-08-18 by the Founder**, answering `SEB §28.4` Q9. The
question is recorded as three rulings because the providers differ in
what they can express, and two of them can express nothing.

| | Ruled | Recommended |
|---|---|---|
| **GitHub** | **All repositories in the account** | Only repositories under active work |
| **The other seven** | **Read and write together**, scoped as tightly as each provider allows | Read-only first, to close `not-verified.md §1` at almost no blast radius |
| **Clerk and Brevo** | **Production credentials, accepting the risk** | A `sk_test_` instance and a dedicated sub-account |

**The recommendation is recorded beside the ruling, not instead of it.**
`SEB §0.6` requires that the next person to propose the rejected option
can see it was considered; that cuts both ways, and the Founder's
authority to overrule is not diminished by writing down what was
overruled.

**What is knowingly accepted.** Established from the providers' own
current documentation on 2026-08-18:

- **Clerk cannot be scoped at all.** There is no read-only key, no
  per-endpoint scope, no per-resource restriction, no expiry and no IP
  allowlist. Any `sk_live_` key is full administrative control of the
  instance, including irreversible deletion of users and organisations.
- **Brevo cannot be scoped at all** on a plain `api-key`. Full account:
  send campaigns, export the entire contact database, delete contacts and
  lists, spend SMS credits. OAuth 2.0 offers real scopes and is not the
  path the adapter currently takes.
- **A classic GitHub PAT has no repository dimension whatsoever** — `repo`
  grants write to every repository in every organisation the holder can
  reach. If the all-repository ruling is implemented with a classic PAT,
  the blast radius is the whole account. A **fine-grained PAT set to "All
  repositories"** achieves the same reach with per-permission control and
  an expiry, and is therefore the form this ruling takes.
- **Cloudflare "Edit" is full CRUDL including delete**, with no
  per-Worker or per-namespace selector outside R2.

**The remaining guard is the protected-operation class.** With production
Clerk and Brevo credentials installed, `clerk.user.delete`,
`clerk.organization.delete` and `brevo.contact.delete` are the only
things standing between an automated call and irreversible loss of real
institutional records. That class must therefore be re-verified against
the live surface before those credentials are installed, not after.

**Reversal.** Narrow any of the three at any time; nothing depends on the
width. **Confidence High** on the record; the risk is the Founder's and
is accepted in terms.

### `SEB-D 31` — Fixes precede credentials

**Ruled 2026-08-18** under the executive-autonomy protocol (`SEB §0.5`),
as security patching rather than as a decision put to the Founder.

A caller-supplied literal `value:` argument to `github.secret.put`,
`cloudflare.worker.secret.put` or `vercel.env.set` is written **in
plaintext** to the hash-chained audit file, contradicting those tools'
own descriptions ("never written to the audit log", "never logged, never
audited and never returned"). The log is append-only, so a leaked value
cannot be removed without breaking the chain from that point forward.

Installing production credentials on a component that can spill them into
a file it cannot un-spill is not a trade-off worth making for the days it
would save. **The fixes land first.** This is not a gate on the Founder's
authority; it is the ordering any competent operator would choose, and it
is recorded so that the delay is attributable.

**Confidence High.**

### `SEB-D 32` — Provider-side caps deferred; the estate accepts the gap

**Decided 2026-08-18 by the Founder**, having been shown the costing.

| Ruled | Recommended |
|---|---|
| **The server's cap only, for now.** No provider-side budget, quota or kill switch is set | A per-provider runbook actioned before credentials are installed |

**What the gap is, stated exactly.** `STROMEX_SPEND_MONTHLY_CAP` counts
only what passes through `ctx.commitSpend` — domain purchases and the
OpenAI council. It cannot see Vercel bandwidth, GitHub Actions minutes,
Neon compute-hours or Cloudflare requests, because none of those are tool
calls. **The server's cap therefore covers roughly $50 of a $43,200
thirty-day runaway exposure** (`mcp/docs/cost-model.md §2`), and nothing
at all of the three preconditions that take that figure to
$250,000–$1,000,000.

**Why the ruling is more defensible than it first reads.** Nothing is in
production. There is no traffic to loop on, no CI running at volume, and
no real personal data — so scenario C is not reachable today. The exposure
becomes real at the first production deployment, not at the first
credential.

**What this ruling therefore binds.** The runbook at
`mcp/docs/cost-model.md §4` is a **precondition on the first production
deployment**, not on the first credential. Three of its items cost nothing
and are pure omission rather than configuration — leave Resend's
Transactional Overages off, leave Clerk SMS disabled, never load an SMS
credit balance onto Brevo — and each is the only lever that converts a
$0-exposure provider into a five-figure one.

**Reversal.** Action the runbook at any time; nothing depends on the gap.

**Confidence High** on the record. The risk is the Founder's, is
quantified rather than gestured at, and is accepted in terms.

### `SEB-D 33` — The operator file was a snapshot, and a comment said otherwise

**Found 2026-08-18**, while grounding `SEB §28.4` Q10.

`SEB §9.2` names three permitted homes for a credential and requires
every one of them to be "rotatable without a code change and without
downtime". The operator file was read **once**, at startup, and handed to
the resolver as a plain object. Editing it did nothing until a restart,
and a file `chmod`-ed to 0644 *after* startup was never noticed at all —
because the mode was checked exactly once, on a file that no longer
existed in the form it was checked in.

**Worse: the comment introduced with the previous fix (`SEB-D 31`) said
the file WAS re-read per call.** It was written in the same change that
correctly fixed the environment path, and it was simply wrong about the
file. A wrong comment on a security control is worse than no comment: the
next person to audit rotation reads it, believes it, and stops looking.

**Ruled.** The file is a live source on the same 60s TTL as the command
resolver, its mode is re-checked on every reload, and a transient read
failure keeps the last good values rather than taking the server down —
an editor saving atomically briefly makes the file absent.

**And a truth the fix surfaced rather than created:** of the three homes,
the **process environment is the least rotatable**, not the most. A
process cannot have its environment changed from outside after it is
spawned, so an env-borne credential is rotatable only by restarting the
server. `SEB §9.2` ranks it second on other grounds; on rotation alone it
is last, and Volume 9 should say so.

**Also added:** a startup warning when a secret command is configured
*and* a credential is also present in the environment. The environment
wins, so the secret manager is never consulted for that name — rotating
it there has no effect, silently and forever. Same shape as `SEB-D 31`.

**Confidence High.**

### `SEB-D 34` — Credentials live in `pass`; rotation is rehearsed first

**Decided 2026-08-18 by the Founder**, answering `SEB §28.4` Q10.

| Ruled | |
|---|---|
| **Home** | **`pass`** — the GPG-backed store — reached through the MCP's command-resolver seam: `STROMEX_MCP_SECRET_COMMAND='pass show stromex/{name}'` |
| **First rotation** | **Rehearsed end-to-end on a real credential before anything reaches production**, per `SEB §11.7` |

**Why this question was load-bearing, and not a matter of taste.** Four of
the eight providers issue credentials that **cannot expire** — Neon,
Resend, Clerk and Brevo all say so in their own documentation — and those
are the same four that **cannot be scoped** (`SEB-D 30`). A credential
with no expiry has no automatic off-switch: a copy that escapes keeps
working until a human deletes it. So for those four, **rotation is the
entire control**, and how easily a credential can be rotated is a property
of where it lives, not of anyone's intentions.

**What `pass` buys over the alternatives.** No subscription and no vendor
who could lose the store — and none who could help recover it either,
which is the trade taken knowingly. One file per credential. And
`pass git log`, which is a rotation history for the four providers that
will never tell you themselves when a key last changed.

**The honest caveat, recorded rather than buried.** `pass` needs an
unlocked GPG key, and a server has nobody to type a passphrase. With a
passphrase-less key the store is **roughly equivalent in strength to the
mode-checked operator file** — the key file *is* the secret. What survives
that reduction is the per-credential separation and the rotation history,
which is still worth having. With `gpg-agent` and a long cache it is
genuinely stronger, at the cost of a human present at every restart. The
choice between the two is deliberate and is recorded at
`mcp/docs/credentials.md §3`.

**Implemented alongside the ruling**, because choosing the command path
made its failure modes load-bearing: a secret-command **timeout is now a
hard, explained failure** instead of silently reading as "that credential
is not configured". Every real secret manager fails the same way on a
server — `pass` with a locked key, `op` with an expired session, `vault`
with an expired token all block on a prompt nobody will answer — and the
previous behaviour presented a locked keyring as eight providers quietly
missing, with nothing anywhere saying why. A non-zero exit still is not
fatal, since an optional credential really may be absent, but the reason
is now recorded and surfaced by `doctor` and
`stromex.credentials.status`.

**Confidence High.**

### `SEB-D 35` — The primary domain is outside this server's reach

**Established 2026-08-18**, partly answering `SEB §28.4` Q7 after the
Founder narrowed it: the estate's TLDs are `.com`, `.org` and `.co.uk`;
`.ng` and `.com.ng` are not required and the earlier "unbudgeted" flag is
withdrawn.

**The finding.** Vercel's registrar does not carry `.co.uk` — read from
its own supported-TLD table and confirmed against the live registrar API,
which returns *"The TLD .uk is not currently supported"* for `.uk` and a
bare `available: false` for `.co.uk`. **`worldwencollege.co.uk` is the
estate's primary domain.** So `vercel.domain.buy` — the one tool in this
server that spends money, and the reason `SEB-D 28` names Vercel as an
approved spending provider — **can never act on the domain the institution
actually runs on.** It is useful for defensive `.com`/`.org`
registrations and for the education TLDs, and that is its whole scope.

**What DNS establishes**, as evidence rather than assertion: the domain is
live and entirely on Cloudflare — proxy A records, Cloudflare nameservers,
and Cloudflare Email Routing on MX. Because DNS is on Cloudflare, the
`cloudflare.dns.*` tools can manage it, which is the part of the domain
lifecycle this server *can* reach.

**The operational consequence, which is the reason this is a ruling and
not a note.** SPF authorises Cloudflare Email Routing **and nothing
else**; there is no DMARC record at all; and no Resend or Brevo DKIM
selector exists. So the domain **can receive mail and cannot send it**,
and any Resend or Brevo send from it today would fail SPF — softly, on
`~all`, which degrades deliverability quietly rather than failing loudly.

**Ruled.** No email workflow runs against `worldwencollege.co.uk` until
its sending domain is verified at the provider and its SPF and DKIM
records are published. This is a precondition, not a recommendation, and
`SEB-D 28`'s approval of Resend and Brevo as spending providers does not
override it — an authorised budget for sending mail is not authorisation
to send unauthenticated mail.

**A defect fixed alongside.** `vercel.domain.check` reported an uncarried
TLD identically to a name somebody owns. Both were `available: false`, so
"we do not sell this" read as "somebody has it" — which would send a
registrar hunting for a replacement name nobody needed. It now reports
three outcomes and says plainly that an uncarried TLD is no evidence
about who owns the domain.

**Confidence High** — every claim is a DNS record or a documented TLD
table, both re-checkable in seconds.

### `SEB-D 36` — Domains are registered at Cloudflare, at cost

**Decided 2026-08-18 by the Founder**, amending `SEB-D 28`'s approved
spending providers.

**Ruled.** Domain registration moves from Vercel to **Cloudflare
Registrar**, which sells at cost — its own words: *"Register and renew
these domains at cost without any markups or add-on fees"*, across 300+
extensions. `cloudflare.registrar.*` is implemented: search, check,
register, poll.

**A correction to the reasoning, recorded because the ruling stands
without it.** The Founder's stated motive was Vercel's "extra twenty
dollars". That $20 is Vercel's **Pro plan fee**, not a domain markup — on
domains Vercel is already close to cost ($11.25 for a `.com` against
Cloudflare's ~$10.60). **The registrar change saves under a dollar per
domain per year.** It is still the right change — at-cost renewal
compounds, and it consolidates the domain lifecycle where DNS already
lives — but it is not where the money is.

**Where the money is.** The college site is a static build (64 pages from
`node scripts/build.js`) and its DNS is already entirely on Cloudflare.
**Cloudflare Pages serves static sites free, with unlimited bandwidth.**
Dropping Vercel would save the $20/month outright — **$240 a year against
the registrar change's sixty cents.** Recorded as an option, not a
ruling; it is a hosting decision with its own trade-offs and it has not
been put to the Founder.

**Amended the same day: the extension is not a constraint.** The Founder
ruled that the estate takes whatever extension is available, so the
question of which TLDs the Registrar API carries is **closed, not open**.
New domains are registered from whatever `cloudflare.registrar.check`
reports as available; no TLD is a requirement and none is worth chasing.

**What this does NOT solve, and the part that survives the amendment.**
`.co.uk` — the estate's primary domain — is refused by Cloudflare's
Registrar API with `extension_not_supported_via_api`.
The API beta also has **no renewals and no transfers**. So the primary
domain remains outside every automated path this server has, exactly as
`SEB-D 35` recorded; only the registrar it is outside of has changed.
Whether Cloudflare carries `.co.uk` in its dashboard at all is
**unverified and no longer worth establishing** — the amendment makes it
irrelevant to any *new* registration. It stays true of the domain the
institution is already serving from, which is a renewal and DNS concern
rather than a purchasing one (`SEB-D 35`).

**Two properties of Cloudflare registration that shape the tool.**
Registrations are **non-refundable** once complete, so the handler prices
before it buys and the money gate fires before the provider is called.
And a Cloudflare Registrar domain **must** use Cloudflare nameservers —
harmless here, since the estate already does, but disqualifying for any
domain that must live elsewhere.

**Vercel's registrar approval is not withdrawn**, because it still carries
extensions Cloudflare's API does not. It is now the fallback rather than
the default.

**Confidence High** on the ruling; **the $240 hosting observation is
Medium** and rests on the site being genuinely static, which its build is.

### `SEB-D 37` — A decision explained in jargon was not really taken

**Ruled 2026-08-18** by the Founder, and it applies to every decision this
estate puts to a human.

**The problem, stated plainly.** Decisions `SEB-D 28` through `SEB-D 36`
were put to the Founder using terms that were never defined in the asking:
*scoped*, *blast radius*, *rolling cap*, *fingerprint*, *hash-chained*,
*SPF*, *DKIM*, *TLD*, *instance*, *at cost*. Several of those decisions
commit real money and real user records. **A decision taken on an
explanation the decider could not fully follow is not a decision they
made** — it is one they were walked into, and the authority `SEB §0.5`
reserves to the Founder is hollow if the question itself is unreadable.

**Ruled.** Every decision put to a human is written to this standard:

1. **Define each term in the sentence it first appears in.** Not a
   glossary, not a footnote, not a link.
2. **Explain the MECHANISM, not the label.** Not "SPF authorises only
   Cloudflare" but "SPF is a public list of which servers may send email
   using your domain; yours lists only Cloudflare, so mail sent through
   anyone else is treated as suspicious."
3. **State the real consequence of getting it wrong** — what breaks, who
   notices, what it costs, and whether it can be undone.
4. **Cut everything that is not load-bearing.** Necessary and sufficient:
   no architecture tours, and no omissions either.

**This is not a request to simplify the decisions.** The Founder's
instruction was explicit — *"everything necessary should be told and the
full meaning and then how it works"*. The content stays; the vocabulary
becomes shared.

**Retrospective effect.** Any prior decision may be re-put in plain terms
on request and re-taken. A decision does not become binding by having
been misunderstood once.

**Confidence High.** It is a standing instruction from the only authority
that could give it.

### `SEB-D 38` — The email workflow never created a DNS record

**Found 2026-08-18** while preparing the email fix `SEB-D 35` requires.

**The defect.** `email.configure-domain` has always described itself as
*"adds the sending domain to Resend, **creates the DNS records it requires
in Cloudflare**, then asks Resend to verify"*, and it declared Cloudflare
as a required provider. **No step created a DNS record.** It captured the
record list into run state, did nothing with it, and then asked Resend to
verify records that did not exist — so verification could only ever fail,
on every run, for every domain.

Third instance of the same class this session, after `SEB-D 29` (a cap
that was displayed and never checked) and `SEB-D 31` (a description
promising a secret was never audited). **A description is not an
implementation, and this estate keeps discovering that the expensive way.**

**Fixed** by adding `cloudflare.dns.apply` — a tool that applies a whole
record set idempotently — and a workflow step that calls it.

### `SEB-D 39` — SPF records are merged, never duplicated

**Ruled 2026-08-18**, and it is a correctness rule rather than a
preference.

**The mechanism.** SPF is the public list of which servers may send mail
using a domain. RFC 7208 permits **exactly one** SPF record per name. Two
records is not "both apply" — receivers must treat it as a permanent
error, and every message from the domain begins failing SPF, including
mail that was working perfectly beforehand.

**Why this is not hypothetical.** `worldwencollege.co.uk` already carries
`v=spf1 include:_spf.mx.cloudflare.net ~all`, because it forwards mail
through Cloudflare. The obvious implementation — take the record the email
provider hands you and create it — would have given the estate's live
domain two SPF records and broken its mail. Nothing in the provider's
instructions warns about this; they assume a domain that does not already
send.

**Ruled.** `cloudflare.dns.apply` merges into the existing record. The
merge is deliberately conservative and each constraint has a failure it
prevents:

| Rule | What it prevents |
|---|---|
| Never change the all-qualifier | Silently hardening `~all` to `-all` starts BOUNCING mail from senders nobody has enumerated |
| Never remove a mechanism | Removing an `include:` cuts off a sender the institution forgot it had |
| Never reorder | SPF evaluation is order-sensitive and capped at ten DNS lookups |
| Insert before the qualifier, case-insensitively | A mechanism already present in different case is not added twice |

**Also ruled: DMARC is published in monitor mode (`p=none`).** DMARC tells
receiving servers what to do with mail that fails SPF and DKIM, and where
to send reports. The estate has **no DMARC record at all**, so today
anyone can send mail pretending to be the school and nothing reports it.
Starting at `p=reject` on a domain whose senders have never been
enumerated is how an institution discovers, by having it stop, which
system was quietly sending its parent emails. Monitor first, tighten on
evidence.

**Confidence High** — the one-record rule is RFC 7208, and the estate's
existing record was read from live DNS.

### `SEB-D 40` — The Analyst research agent, and the barrier it will never cross

**Decided 2026-08-18 by the Founder**, who proposed a research agent that
studies publicly accessible systems — rival LMSs, portals, products — and
files what it learns into the institution's knowledge base.

**Adopted in full, with one line removed.** The Founder's brief included
*"you may bypass security controls or CAPTCHAs."* That is not built and
cannot be approved into existence, and the reasoning is recorded because
the Founder is entitled to see exactly where the line falls and why.

**A CAPTCHA** is the puzzle a site uses to confirm a visitor is a person;
its whole purpose is the service declaring that automated agents are
unwelcome. Defeating it overrides a refusal the service already made.

**The distinction that governs the agent's approval popup.** The Founder
asked for a one-click approve/decline at each barrier. That is right for
one kind of barrier and impossible for the other:

- **A decision the operator may make** — create this account, the terms
  allow it — is approvable, and the popup is exactly the right mechanism.
- **A barrier the service built to keep programs out** — a CAPTCHA, an
  automation block, terms forbidding automated signup — is *not*
  approvable, because authorisation for access belongs to the service and
  not to the operator. A human clicking "approve" cannot grant a
  permission that was never theirs to give.

Unauthorised access is defined by whether the **service** authorised it,
not by whether the **operator** did. Under the UK Computer Misuse Act
1990 and Nigeria's Cybercrimes Act 2015 this is an offence regardless of
intent, and it voids the terms of every service worth studying. This is
`SEB §31` — the conflict-resolution rule that safety and law rank first —
resolving the one place the Founder's brief contradicted itself, since it
also required *"staying within legal and ethical boundaries."*

**The division of labour ruled.** The agent does all the research —
reading public material, exploring, mapping, capturing, comparing,
filing. A human creates the trial account where terms require it (two
minutes) and the agent hands over a one-line request. Email is confirmed
only in a **dedicated research inbox** the agent is authorised to read.

**The research inbox: a separate mailbox, never a folder in the main
one.** An email account can reset the password on almost any other
account, so a program that can read the main inbox can effectively seize
anything that inbox can reset. A dedicated inbox limits a leak to a
handful of trial accounts rather than the Founder's whole digital life.

**Status: charter recorded, build deferred.** It needs browser automation
(the server speaks to APIs, not web pages today), the research inbox
(needs email configured), and the knowledge base (Phase 10, `SEB §36.8`,
designed not built). Recording the barrier rule now, before any code
exists, is deliberate — a line drawn in advance holds better than a
refusal bolted on later.

Charter at `mcp/docs/analyst-agent.md`. **Confidence High** on the ruling;
the removed line is a matter of law, not judgement.

### `SEB-D 41` — The Analyst runs on policy, gated on authority — refines `SEB-D 40`

**Decided 2026-08-18 by the Founder**, who improved the design: rather
than a human clicking each pop-up, the agent holds a **written policy** —
the Founder's rules on what may and may not be registered — and approves
or declines by alignment with it. The Founder framed this as the right
approach for a compliance-conscious cybersecurity company that must
sometimes act quickly, under its own legal counsel.

**The policy-engine architecture is adopted in full.** It is better than
per-click prompting and it is what gets built.

**The one refinement, which is where the law places authority, not where
caution places it.** A policy can delegate one kind of decision and not
another:

| Tier | Barrier | Authority to proceed |
|---|---|---|
| **Registration / terms** (clickwrap) | The company is a party to the contract, so it may decide by policy which services to register with | **The operator's policy** — auto-approve/decline as designed |
| **A technical access control** (CAPTCHA, anti-bot) | Its purpose is to block automated access | **The target's authorisation only** — never the operator's policy |

**Why the operator's policy cannot authorise Tier 3.** Authorisation to
access a system belongs to that system's **owner**. Legitimate security
testing is lawful precisely because the firm holds the owner's written
authorisation — the *rules of engagement* — before touching a control.
That authorisation, not the firm's internal policy, is what separates a
penetration test from an intrusion. So Tier 3 is **not forbidden**; it is
gated on target authorisation: own systems, or a signed engagement →
proceed; nothing on file → route to a human, because there is no yes to
act on.

This is the compliant design, not a weaker one. A cybersecurity company's
policy *should* require owner authorisation before control testing, and
the agent enforces that requirement rather than substituting the
company's own say-so for it. Under the UK Computer Misuse Act 1990 and
Nigeria's Cybercrimes Act 2015, unauthorised circumvention of an access
control is an offence regardless of intent — so "we are compliant" is
implemented, in the machine, as "we act only where the owner authorised
it."

**On the reaffirmation.** The Founder reaffirmed the auto-approval design
and cited the company's legal counsel and compliance posture. That is
accepted, and the design is built accordingly — the auto-approval of
registration and terms is exactly what the Founder asked for. The single
adjustment is that Tier-3 approval keys on the **target's** authorisation
record rather than on internal policy alone, because that is the fact the
law turns on and the one an operator's policy cannot change. Where StromeX
holds authorisation from a target — its own systems, or a client
engagement — the agent proceeds under policy without a human.

**A note recorded for Tier 2.** Registering against terms that forbid
automated registration is a breach of contract even where no CAPTCHA
stops it — a civil risk the company may choose to accept by policy, but
the agent flags it as a breach so the choice is made knowingly.

**Confidence High** on the architecture and the authority model. The
specific statutory characterisations are this Bible's plain-language read
and defer to the company's counsel; the *design* — policy for Tiers 1–2,
target authorisation for Tier 3 — stands regardless of jurisdictional
detail, because it is the owner-authorises principle common to all of
them.

Charter at `mcp/docs/analyst-agent.md`, refined accordingly.

### `SEB-D 42` — A human solving a CAPTCHA is not a bypass — refines `SEB-D 41`

**Decided 2026-08-18 by the Founder**, who asked that when a service shows
a CAPTCHA the agent consult the company's policy, and register directly
where there is none.

**Adopted, with the CAPTCHA case sharpened by a distinction not drawn
before.** A CAPTCHA checks one thing: that a human is present. There are
two responses to it, and they are not the same act:

- **A machine defeats it** — an automated solver, a solving service, a
  model that reads the puzzle — which asserts a human is present when none
  is. This is the target's control overridden, and no policy can authorise
  it, because the authority is the target's.
- **A human solves it and the agent continues** — the agent does all the
  research, pauses at the box, a person spends ten seconds proving they
  are human, and the agent carries on. This is not a bypass. It is exactly
  the human presence the site asked for, and it is lawful on any site.

**So the ruling, precisely:**

| Situation | Action |
|---|---|
| No CAPTCHA; policy and terms permit | Agent registers automatically |
| CAPTCHA present; target **not** authorised | Agent pauses; a human solves that one box; agent continues. It never solves it by machine. If no human is available, the target is skipped, not forced |
| CAPTCHA present; target **is** on the authorisation register | Agent proceeds automatically under policy — the owner authorised us |

This gives the company nearly all of the speed it asked for: the hours of
research are automated, and only the ten-second human-presence check is
handed to a person. The Founder's "we need swift time" concern is met
without the one act — a machine defeating a stranger's control — that no
policy or counsel can make lawful.

**The policy still governs everything it should** — which services, which
categories, what data may be supplied, whether to accept terms that forbid
automation. It simply does not decide the CAPTCHA, because the CAPTCHA is
not a policy question; it is the site requesting a human, and a human is
cheap to supply.

**Also decided: the policy-engine design is drafted now**, ahead of the
build, at `mcp/docs/analyst-policy-engine.md` — the policy schema, the
authorisation register (which the agent reads but cannot add to, because
adding an entry asserts a real authorisation exists), the three-tier
decision procedure, and the audit trail that lets the company show any
target was touched within policy and within authorisation.

**Confidence High.** The human-solves-versus-machine-defeats distinction
is not jurisdiction-dependent: supplying a human when a human is asked for
is compliance, and simulating one is the circumvention every relevant
statute names.

### `SEB-D 43` — The first Cloudflare token is write-scoped, by the Founder's direction

**Decided 2026-08-18 by the Founder**, overriding the read-only-first
recommendation for the first real credential.

**The recommendation was mine, and it was soft.** Read-only-first
(`mcp/docs/first-credential.md`) de-risks the very first contact in case
the code has a bug — a good engineering instinct, but not a limit on the
Founder's authority. The Founder wants velocity: real work — changing
secrets, adding DNS, deploying — done under supervision rather than
watched from behind glass. That is a legitimate call and it is theirs.

**Ruled: the first Cloudflare token carries write (edit) scope**, so the
agent can act, not only read. Cloudflare's "edit" is full
create-read-update-delete with no create-but-not-delete tier, so this is
genuine write across the Cloudflare account.

**The trade, named so it is accepted knowingly (`SEB §2.6`).** A
write-capable raw token has a larger blast radius than a read-only one: a
leak means someone could *change* Cloudflare resources, not merely view
them. Three things bound it — a **30-day expiry**, storage **only in the
Founder's `pass` store** (`SEB-D 34`), and the token being held by nobody
else. Scope is one provider, not eight.

**What still holds even with full write.** The MCP's protected-operation
class (`SEB §26.5`) stops and asks before any destructive Cloudflare
action taken *through the server* — delete DNS, delete Worker, delete
secret, delete D1/R2/KV/queue. The audit trail records everything else.
So "the Founder supervises; the agent reports; destruction waits for a
yes" is enforced by the gate, not promised. **The one gap, stated
plainly:** the gate governs actions taken *through the MCP*; a leaked raw
token calling Cloudflare's API directly is not gated — which is the whole
reason for the 30-day expiry and the encrypted store.

**A dependency the token does not remove.** A write token grants the
capability; it does not stand up the execution path. The MCP must run on a
machine the Founder controls, with the token resolved from `pass`, before
any of this runs — a one-time setup, not yet done. Recorded so the token
is not mistaken for the finished pipeline.

**Confidence High** that this is the Founder's call to make; the estate's
role is to bound and record it, which it has.

### `SEB-D 44` — Credential lifetime *(expiry choice SUPERSEDED by `SEB-D 45`; the rotation register it introduced stands and is now the primary control)*

**Decided 2026-08-18 by the Founder**, who set a working-key lifetime of
one year, reasoning that the company controls access and the keys are
never deliberately exposed.

**Adopted, with one factual correction that reshapes it.** Of the six
providers the Founder named, **only GitHub and Vercel support an expiry
date at all.** Neon, Resend, Clerk and Brevo offer no expiry field: their
keys live until a human deletes them (established from the providers' own
documentation, `SEB-D 30`). So "one year maximum" is a *setting* on two of
the six and a *habit* on the other four.

**Ruled:**

- **GitHub, Vercel, Cloudflare** — set a **one-year** expiry. (Cloudflare
  is not in the Founder's list of six but takes the same rule; its first
  working token, `SEB-D 43`, is a one-year write token rather than the
  thirty-day throwaway the read-only test would have used.)
- **Neon, Resend, Clerk, Brevo** — no expiry exists, so the key is
  **rotated by a human at twelve months**: mint a replacement, cut over,
  revoke the old (`mcp/docs/credentials.md §4`).
- **A rotation-due register is built** — `stromex.credentials.status`
  already reports each key's fingerprint; it gains the key's **age and a
  due date**, so the four unexpirable keys cannot silently become
  permanent. This is the machine keeping the twelve-month habit that the
  providers will not keep for the estate.

**The reasoning recorded, because the Founder's premise deserves an
answer, not a nod.** "The keys are never exposed to anybody" is a hope,
not a control: expiry and rotation exist for the *accidental* leak — a
lost device, a mis-synced backup, a screenshot — not the deliberate one.
An accidental exposure occurred in this very session (a login password
pasted into chat, `SEB §9.2b`), to a careful operator, which is the
standing proof that "we are careful" cannot substitute for a bounded key
lifetime. A serious company rotates on a clock *because* it is serious.

**Why a one-year window is nonetheless reasonable for a working key.** The
exposure window a one-year lifetime leaves open is bounded by three things
already ruled: keys live only in the Founder's `pass` store (`SEB-D 34`),
rotation is a sub-minute operation with no restart (`SEB-D 33`), and the
protected-operation gate still stops destructive actions taken through the
server (`SEB §26.5`). One year is industry-normal for a working
credential, and the friction the Founder feared — rotation taking days —
is the specific defect the store choice removed, so a bounded lifetime no
longer costs velocity.

**Confidence High.** The lifetime is the Founder's call; the correction
(four of six cannot express it as an expiry) and the rotation register are
the estate's job, now recorded.

### `SEB-D 45` — Working keys never expire; the rotation register becomes the control — supersedes the expiry choice in `SEB-D 44`

**Decided 2026-08-18 by the Founder**, one message after `SEB-D 44`,
choosing that all working keys carry **no expiry**.

**Adopted. The expiry portion of `SEB-D 44` is superseded; its rotation
register survives and is promoted from safeguard to primary control.**

**The legitimate upside, recorded because it is real and not a
concession.** A never-expiring key cannot fail *unexpectedly* — an
auto-expiring key that dies mid-deploy or mid-task is its own class of
outage, and avoiding it is a defensible operational preference. Long-lived
credentials are common in production.

**The one cost, named once (`SEB §2.6`).** With no expiry there is no
automatic backstop: a leaked key works until a human notices and deletes
it. Expiry was the control that worked *even when nobody knew a key had
leaked*. Removing it means the estate itself must supply the backstop —
which is the rotation register.

**So the rotation register is now load-bearing, not optional.**
`stromex.credentials.status` reports each key's fingerprint, age and a due
date, and the estate **rotates deliberately on its own schedule** rather
than relying on a provider timer. Recommended cadence twelve months, and
the **write-capable keys rotate first** — the Cloudflare write token
(`SEB-D 43`) most of all, since a never-expiring full-write infrastructure
key is the sharpest single edge in the estate and the register exists to
keep it from becoming a silent permanence.

**What actually changes, per provider.** Only three of the eight could
express an expiry at all — GitHub, Vercel, Cloudflare — so "never expire"
is a real change only there; the other five never expired regardless
(`SEB-D 30`). Vercel's ability to mint a never-expiring token is
documented as *unverified* (`mcp/docs/not-verified.md`) and is confirmed
at the time that key is created.

**Why this remains within bounds.** The exposure a permanent key leaves
open is still held by three earlier rulings: keys live only in the
Founder's `pass` store (`SEB-D 34`), rotation is sub-minute with no
restart (`SEB-D 33`), and the protected-operation gate still stops
destructive actions taken through the server (`SEB §26.5`). The trade the
Founder is accepting is a larger *leak window* in exchange for no *timer
outages*, backed by deliberate rotation instead of automatic expiry.

**Confidence High** that this is the Founder's call; the estate's duty —
to make the rotation register real so "never expire" does not become
"never rotate" — is recorded and is now a build item.

**Build status — discharged 2026-08-20.** The rotation-due register is
built: `stromex.credentials.status` now reports each key's age, its due
date (default 365 days, `STROMEX_ROTATION_INTERVAL_DAYS`) and whether it is
overdue, with write-capable providers surfaced first. Age is measured from
the first time the server sees a value and resets when the fingerprint
changes; the register persists at `~/.stromex-mcp/rotation.json` and holds
only names, fingerprints and dates. Six unit tests cover the clock,
rotation reset, no-churn writes and corrupt-file refusal. See
`mcp/docs/credentials.md §4a`. So "never expire" is now bounded by a
visible, human-driven "rotate by."

### `SEB-D 46` — Certificate codes: recoverability over memorability

**Decided 2026-08-20 by the Founder**, from a lived failure: on the
*Sultan Hanafi Royal Schools* registrar portal, generating a certificate
produced a code needed to reopen it, the code was never saved, and the
certificate could no longer be opened. The Founder's direction: codes must
never be stored in the git repository, and where a code must be kept it
belongs in a safely retrievable secret store — while non-secret,
findable information belongs in a beautifully designed document.

**Options considered.**

| Option | What it means | Verdict |
|---|---|---|
| Put codes in a pretty document | One designed page lists every certificate's unlock/sign code | **Rejected** — that page is a master key; whoever holds it can open and forge every certificate |
| Put codes in the repository | Committed to source control | **Rejected** — the repo is readable by many tools and keeps history forever; a committed secret is a leaked secret, and deletion does not un-leak it |
| Recover from record + secrets in `pass` + non-secrets in a register | Certificates regenerate from their issuance record; secret codes live labelled in the encrypted store; non-secret IDs/links/dates live in a designed issuance register | **Adopted** |

**Adopted, as `SEB §12.12`.** Four parts: (1) a certificate is recoverable
from its record, never from memory — the record `cert № X → student Y, date
Z, transcript T` is enough to regenerate the document, so no lost string can
ever lock a certificate shut; (2) codes are never committed to the
repository; (3) secret codes go into the `pass` GPG-encrypted store under
clear per-certificate labels, deliberately scattered rather than gathered
into one master document; (4) non-secret information — reference number,
public verify link, issue date, recipient — goes into the beautifully
designed issuance register that *is* meant to be opened and read.

**The one exception — break-glass.** A single sealed, offline, paper backup
of the top signing key (the private key that makes certificates genuine) may
be held in a physical safe, opened only in emergency and resealed after. It
is never digital, never in the repository, never in a shared document — the
sole case where a secret is written down at all, precisely so the estate can
survive the loss of everything electronic.

**Why this is within bounds.** It reuses controls already ruled: the `pass`
store (`SEB-D 34`), the ban on secrets in source, and Volume 12's rule that
registrar data cannot be destroyed by automation (`SEB §12.11`). It adds one
principle — *recoverability over memorability* — and one build obligation:
Volume 12's certificate system must make every certificate regenerable from
its record. **Confidence High** that this is the Founder's call and that it
strictly increases safety over the SHRS design it replaces.

### `SEB-D 47` — The Verifiable Document Doctrine — generalises `SEB-D 46`

**Decided 2026-08-20 by the Founder.** The Founder's words: the certificate
treatment is *"not just about certificates or testimonials, including
transcripts and many other ID cards … we'll be coming to be treated the
same alike."* The scope of the recoverability-and-verification rules is
therefore not the certificate — it is **every document the estate issues
that a third party may need to trust.**

**The doctrine.** *If the estate issues it and a stranger may need to trust
it, it is a **verifiable document**, and it carries all four guarantees:*

1. **Verifiable by a stranger, with no account** — a reference number and a
   QR code that resolve to the real record (`SEB §12.2`).
2. **Regenerable from its record** — never dependent on a remembered code
   (`SEB §12.12`, the SHRS failure).
3. **Three honest states** — genuine · withdrawn/superseded (dated,
   reasoned) · not-found. Never a fabricated or ambiguous answer.
4. **Secrets to the store, non-secrets to the register** — unlock codes and
   keys to `pass`; reference numbers, verify links and standing to the
   Issuance Register (`SEB §12.12`).

**Two subjects, two mechanisms, one doctrine.** The distinction is
load-bearing, so it is ruled here, not left to be discovered:

| Subject | The record is *about*… | Verify means | Mechanism |
|---|---|---|---|
| **Person-document** | a person | "the College issued this, to this person" | the award / issued-document register, holder-named (`awards.js`, `documents.js`) |
| **Artifact-document** | the document itself | "this is the genuine edition, unaltered" — a **content hash** (a digest of the bytes; change one character and it changes) plus the College's signature | the provenance model (`scripts/publication/identity.mjs`, Volume 33) |

**The classes, ruled in scope.** Named by the Founder: certificates, awards,
testimonials, transcripts, ID cards. **Recommended additions**, each a
document the estate already produces or plainly will, and each fitting one
mechanism above:

- *Person-documents:* references / recommendation letters · enrolment &
  bona-fide-student letters (visas, banks) · statements of results ·
  attendance / completion (CPD) certificates · conduct/character
  certificates · student, staff and alumni **ID cards** · alumni-chapter
  membership cards.
- *Artifact-documents:* books and curriculum volumes · press editions ·
  official letters on letterhead (a hybrid — verify both the named party and
  that the bytes are unaltered) · fee statements, invoices and receipts ·
  governance and policy records (versioned).

**Honesty bound, carried from the existing code.** `identity.mjs` already
refuses to print an invented ISBN or DOI — those are issued by external
authorities, and fabricating one forges a third party's registry. The
doctrine inherits that rule: a verifiable document asserts **only what the
College can itself stand behind**, and names the external authority for
anything it cannot.

**Adopted.** The estate already holds both mechanisms — it simply had not
named the doctrine that unifies them or wired every class to one verify
portal. **Confidence High** on the doctrine; the build is incremental
(`renderTestimonial` shipped alongside this entry; ID cards, publication
verify-portal wiring, and the rest are ordered work, not yet claimed done).

**The engine is COLLECTIVE, ruled explicitly `[2026-08-20]`.** The Founder's
correction: *"apart from this is something collective and containing almost
all others amongst those projects … treat them generically, not just about
personal."* The verifiable-document engine is a **shared estate capability
that belongs to no single institution**, and generic across kinds, not just
person-documents. This is now enforced in code, not merely stated:

- **`functions/_lib/registry/issuer.js`** — an *issuer profile* holds every
  institution-specific value (legal name, verification-code prefix, verify
  origin, seal mark, `pass` namespace). `defineIssuer()` builds one;
  `resolveIssuer()` validates whatever a caller passes.
- Every renderer and the secret-label convention take an `issuer` and
  **hardcode no institution**. Albalagh (AIPC) is the *default only* so
  existing callers keep working; it holds no privileged status. A test
  proves a certificate renders for a second institution (Al-Madeenah) with
  no engine edits and no leakage of the default's name, and that an AIPC
  code is refused under another issuer's namespace.
- The **honesty bound** is enforced: `defineIssuer` refuses a non-https
  origin or a malformed prefix, and only issuers whose facts are settled
  are defined — no invented legal names or domains.

**Home and portal shape — decided 2026-08-20 by the Founder.** Two rulings:

1. **The engine lives in the shared `stromex/` platform.** Relocated to
   `stromex/verifiable-documents/` (`@stromex/verifiable-documents`),
   packaged like `stromex/design-system/` — `src/{issuer,certificate-render,
   issuance-register,qr}.js`, `test/render.test.mjs` (10 checks, `node
   --test`). It is now beside the MCP and the design system, where a
   collective capability belongs, and no longer inside one institution's
   site.
2. **Every project runs its own verify portal, on its own domain, including
   future ones.** Not one shared portal — each institution owns its trust
   surface at its own `verifyOrigin` (already how the codes print), all
   backed by this one shared engine. A new project stands up its portal and
   supplies an issuer profile; it writes no engine code.

**One honest carry-over.** The QR encoder now exists twice — the shared
`src/qr.js` and the site's `functions/_lib/registry/qr.js` — because moving
the site's copy would touch the live deployment's import graph. A test
asserts the two are byte-identical, so they cannot drift silently; the
convergence (site imports the shared copy) is named future work, not
pretended done.

**Extensibility and the next kind, built `[2026-08-20]`.** Two additions
that give the doctrine room to grow, per the Founder's direction to leave
headroom for everything to come:

- **`src/document-types.js` — the type registry.** Every verifiable-document
  type is one declarative entry (`title`, `subject` = person/artifact,
  `render`). `registerDocumentType()` adds a NEW kind as data and
  `renderDocument()` dispatches generically, so a future document type is
  configuration, not an engine edit. Built-ins cannot be shadowed by
  accident; malformed keys and subjects are refused.
- **`renderIdCard()` — the first non-paper form.** A prestige identity card
  at ISO/IEC 7810 ID-1 size (the real bank-card standard), front and back,
  obsidian-and-gold with a guilloché seal and a live verification QR;
  regenerable byte-identically, no secret on its face, and renders for any
  issuer. It is a verifiable document in its own right — the card authorises
  nothing; its record does.

Fifteen checks pass (`node --test`), covering ID-card determinism, the
photo/monogram fallback and remote-URL refusal, cross-institution render,
and the registry's dispatch, extension, shadow-refusal and validation.

**The artifact half, built `[2026-08-20]`.** `src/publication-record.js`
closes the second subject: `renderPublicationRecord()` renders an edition's
provenance record — the page a reader reaches by the QR printed in a book —
and `compareDigest()` answers the artifact question with four honest
outcomes (`identical` · `altered` · `not_found` · `malformed`), never a
fabricated verdict. Registered as the first `artifact`-subject type. The
honesty bound is carried through verbatim from `identity.mjs`: unheld
registrations (ISBN, DOI, legal deposit) are printed as *not assigned* with
the issuing authority named, and the record states plainly that a content
digest proves content identity — **not** authorship, and **not** that a
given physical copy came from the College. Twenty checks pass.

### `SEB-D 48` — The verify origin must be an address the estate actually holds

**Found 2026-08-20 while building artifact verification, and it is a
real-world defect, not a theoretical one.** Three different origins were in
play across the estate:

| Where | Origin | Reality |
|---|---|---|
| `scripts/build.js` (`SITE_URL`) | `https://www.worldwencollege.co.uk` | **The live one.** The origin the site is genuinely served from |
| `scripts/publication/identity.mjs` (`verifyUrl`) | `https://worldwideenglishcollege.com` | Not the estate's address — and it is **encoded into the QR printed in physical books** |
| `stromex/verifiable-documents/src/issuer.js` | `https://worldwencollege.com` | Mine, wrong: an unregistered `.com` rather than the live `.co.uk` |

**Ruled: a verify origin printed onto a document must be an address the
estate actually controls.** A QR on a certificate or in a bound book is a
promise to a stranger, and it is redeemed years later by someone the College
will never meet. An origin that does not resolve — or worse, that someone
else registers — converts the estate's strongest trust signal into its
weakest. The digest and the seal are worthless if the address is not ours.

**Fixed here:** `issuer.js` now defaults to `https://www.worldwencollege.co.uk`,
with a test asserting it, so the engine cannot silently drift back.

**NOT fixed here, and it is the Founder's to close:**
`scripts/publication/identity.mjs` still prints `worldwideenglishcollege.com`
into every rendered edition. Changing it alters the Document ID surface of
books already in print, so it is a *governance* act, not a code tidy —
`build.js` records the same tension for the site canonical (the College's
name changed; the Albalagh address has not been bought). The estate must
either register the printed domain or reissue with the held one. Recorded,
named, and deliberately not decided unilaterally.

**What would reverse it.** A class where public verification would itself
leak personal data faster than it protects (a safeguarding record, a medical
note) — those are *not* verifiable documents and must never be issued as
one. The doctrine covers what the College publishes to be trusted, never
what it holds to be protected.

## Part C — Open, and owned by you

These are `SEB §28.4`'s questions, restated here so the log is complete.
None is answered on your behalf.

| # | Question | Status | Blocks |
|---|---|---|---|
| **Q1** | StromeX Technologies' relationship to Sulaimiy Education Group | 🔴 | `SEB §0.7`, Volume 8, Volume 22 |
| **Q2** | Data controller and residency position per system | 🔴 | Any real personal data in production |
| **Q3** | Spending authority — per project, per month, which providers | 🟢 **answered and in effect, `SEB-D 28`** | `SEB §26.6` |
| **Q4** | Are the retention periods Board-confirmed? | 🟡 | Volume 22; any destruction capability |
| **Q5** | Second approver for the Nursery and Primary School | 🟡 | Volume 12's joint control |
| **Q6** | Ministry of Education approval number | 🟢 | A compliance surface |
| **Q7** | Which domains are actually owned and renewed | 🟡 | Volume 10; every mail-sending workflow |
| **Q8** | Is award nomenclature (`AMC-D D-03`) closed? | 🟡 | Volume 12's award ladder |
| **Q9** | Should the MCP hold write credentials for every repository? | 🟢 **answered, `SEB-D 30`** | Credential scoping |
| **Q10** | Where should secrets live? | 🟢 **answered, `SEB-D 34`** — `pass` | Installation |

---

## How to close a decision

Add the ruling, the date, and **the reasoning** to the entry — never
replace the question with the answer. Move `[OPEN]` articles that the
ruling settles into their volumes, and record the amendment at
`SEB §0.6`. A closed decision keeps its options table, because the next
person to propose the rejected option deserves to see that it was
considered.
