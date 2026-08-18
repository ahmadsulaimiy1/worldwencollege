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
| **The rolling monthly cap** | **OPEN.** Ruled "price it first" — the figure is to be derived from published provider list prices across three costed scenarios, not chosen. Until it is set, spending stays disabled |
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

**Confidence High** on the ruling. **This decision does not take effect
until `SEB-D 29` is discharged.**

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

## Part C — Open, and owned by you

These are `SEB §28.4`'s questions, restated here so the log is complete.
None is answered on your behalf.

| # | Question | Status | Blocks |
|---|---|---|---|
| **Q1** | StromeX Technologies' relationship to Sulaimiy Education Group | 🔴 | `SEB §0.7`, Volume 8, Volume 22 |
| **Q2** | Data controller and residency position per system | 🔴 | Any real personal data in production |
| **Q3** | Spending authority — per project, per month, which providers | 🟢 **answered, `SEB-D 28`** — cap still open | `SEB §26.6` |
| **Q4** | Are the retention periods Board-confirmed? | 🟡 | Volume 22; any destruction capability |
| **Q5** | Second approver for the Nursery and Primary School | 🟡 | Volume 12's joint control |
| **Q6** | Ministry of Education approval number | 🟢 | A compliance surface |
| **Q7** | Which domains are actually owned and renewed | 🟡 | Volume 10; every mail-sending workflow |
| **Q8** | Is award nomenclature (`AMC-D D-03`) closed? | 🟡 | Volume 12's award ladder |
| **Q9** | Should the MCP hold write credentials for every repository? | 🟢 **answered, `SEB-D 30`** | Credential scoping |
| **Q10** | Where should secrets live? | 🟡 | Installation |

---

## How to close a decision

Add the ruling, the date, and **the reasoning** to the entry — never
replace the question with the answer. Move `[OPEN]` articles that the
ruling settles into their volumes, and record the amendment at
`SEB §0.6`. A closed decision keeps its options table, because the next
person to propose the rejected option deserves to see that it was
considered.
