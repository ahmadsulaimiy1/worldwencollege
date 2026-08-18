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

## Part C — Open, and owned by you

These are `SEB §28.4`'s questions, restated here so the log is complete.
None is answered on your behalf.

| # | Question | Status | Blocks |
|---|---|---|---|
| **Q1** | StromeX Technologies' relationship to Sulaimiy Education Group | 🔴 | `SEB §0.7`, Volume 8, Volume 22 |
| **Q2** | Data controller and residency position per system | 🔴 | Any real personal data in production |
| **Q3** | Spending authority — per project, per month, which providers | 🟡 | `SEB §26.6` |
| **Q4** | Are the retention periods Board-confirmed? | 🟡 | Volume 22; any destruction capability |
| **Q5** | Second approver for the Nursery and Primary School | 🟡 | Volume 12's joint control |
| **Q6** | Ministry of Education approval number | 🟢 | A compliance surface |
| **Q7** | Which domains are actually owned and renewed | 🟡 | Volume 10; every mail-sending workflow |
| **Q8** | Is award nomenclature (`AMC-D D-03`) closed? | 🟡 | Volume 12's award ladder |
| **Q9** | Should the MCP hold write credentials for every repository? | 🟡 | Credential scoping |
| **Q10** | Where should secrets live? | 🟡 | Installation |

---

## How to close a decision

Add the ruling, the date, and **the reasoning** to the entry — never
replace the question with the answer. Move `[OPEN]` articles that the
ruling settles into their volumes, and record the amendment at
`SEB §0.6`. A closed decision keeps its options table, because the next
person to propose the rejected option deserves to see that it was
considered.
