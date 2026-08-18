# Volume 28 — The Knowledge Graph, the Sources, and the Gaps

*What was actually studied to produce this Bible, what could not be
reached, and every question it refuses to answer on your behalf.*

**Read this volume before treating any other volume as your policy.**
`AMC-EB §46` — the Institutional Honesty Protocol — binds this document
about itself as much as it binds a prospectus about a college.

---

## §28.1 What was read

Seven repositories exist in the account. Six were readable in this
session; the table records exactly what each contributed.

| Repository | Read | What it contributed |
|---|---|---|
| `ahmadsulaimiy1/worldwencollege` (WEC-LC / AIPC) | **In full** — 39 documents in `docs/`, ~16,300 lines of Markdown, plus the site, the Pages Functions backend, the D1 schema, the publication pipeline and the test suite | The engineering principles (`WEC-EP`), the editorial and brand bible, the LMS and audio-platform architecture, the payments architecture, the auth architecture, the governance register, the Cloudflare lockdown and preview-deployment discipline |
| `ahmadsulaimiy1/Sultan-` (SHRS) | **In depth, selectively** — the full document index (128 documents in `docs/`, 31 policies in `docs/policies/`, ~38,500 lines), read in full for governance, authority, data, retention, infrastructure and approval architecture; indexed only for the certificate/prospectus/graduation design corpus | The governance library: the policy coding standard, the Role & Permission Matrix, the Data Ownership and Data Lifecycle Registers, the Records Retention Policy (`IT-04`), the AI Usage Policy (`IT-05`), the Approval Workflow Architecture, the Archive Governance rules, the Authority Strategy, the Digital Infrastructure Blueprint, and the deployment-status vocabulary |
| `ahmadsulaimiy1/Al-Madeenahcollege` (AMC) | **In depth** — the Editorial Bible's full structure and its governance, honesty, mobile and amendment articles; the Design Excellence Bible's gates and rejected-conventions register; the Decision Register's executive-autonomy protocol | The constitutional *form* this Bible takes: numbered articles, citation sigla, confidence levels, a decision register, a rejected-conventions register, a future-considerations register with revival triggers, and phase quality gates |
| `ahmadsulaimiy1/Stromex.ai` | **In full** — 15 documents, the FastAPI backend, the Next.js frontend, the infra topology | The StromeX product constitution itself (`SX-EB`): vision, product/user/intelligence philosophy, editorial standards, design philosophy, AI architecture philosophy, the Trust & Safety Constitution and the Scalability Constitution |
| `ahmadsulaimiy1/shroyalschools` | **Contents listed** — 17 photographs and one `Sultan Files` directory; no code, no documents | Nothing architecturally instructive. Consistent with `AMC-EB`'s own finding when it looked at the same repository. |
| `ahmadsulaimiy1/My-books` | **Not read** | Named in the account listing; not opened. Judged out of scope for an infrastructure and governance Bible, but this is a *judgement*, not a finding — if it holds institutional material, say so and it will be read. |
| `ahmadsulaimiy1/SULTAN-ARABIC` | **Not read** | Same. `AMC-EB` recorded it as empty in August 2026; that was not re-verified here. |

## §28.2 What could not be read, and therefore is not characterised

Per `AMC-EB §46`, nothing below is described, praised or criticised in
this Bible, because it was not examined:

- **Live sites.** No production URL was fetched in this session —
  `shroyalschools.com`, `almadinah-college.vercel.app`,
  `worldwencollege.co.uk`, `stromex.ai` or any other. Every statement in
  this Bible about what a system *does* comes from reading its source, not
  from observing it running. The estate's own deployment-status vocabulary
  (`SEB §17.2`) is used precisely so this distinction stays visible.
- **Provider accounts.** No Cloudflare, GitHub, Neon, Vercel, Clerk,
  Resend or Brevo account was inspected. The MCP's provider adapters were
  written against published API documentation and the estate's existing
  integration code, and **not one of them has been executed against a real
  credential** (`SEB §28.5`).
- **Chats, prompts and conversation history.** The brief asked that these
  be studied. They are not available to this session — only repositories
  are. Every principle in this Bible was therefore inferred from committed
  artefacts. Where a principle exists only in a conversation you had and
  never wrote down, **it is not in this Bible, and this Bible does not
  know it is missing.** That is the single largest known blind spot in the
  derivation.
- **The Al-Madeenah `.docx`/`.pdf` Academic Editorial Bible.** Present in
  the repository as binaries; the Markdown equivalent
  (`docs/12-academic-editorial-bible.md`, 1,672 lines) was indexed but not
  read in full, and the binaries were not opened.

## §28.3 The knowledge graph — how the estate actually fits together

What the corpus shows, stated as relationships rather than as a list.

```
                        ┌───────────────────────────────┐
                        │  Sulaimiy Education Group      │  (AMC-D D-01, ruled;
                        │  — structure ruled, facts open │   facts still open)
                        └───────────────┬───────────────┘
                                        │
        ┌───────────────────┬───────────┴────────┬──────────────────────┐
        │                   │                    │                      │
┌───────▼────────┐ ┌────────▼────────┐ ┌─────────▼────────┐ ┌───────────▼──────────┐
│ SH Royal       │ │ Abī Sulaimiy    │ │ Al-Madeenah      │ │ Worldwide English    │
│ Schools        │ │ College         │ │ International    │ │ College / AIPC       │
│ (4 institutions│ │ (named; not     │ │ College          │ │ (English; IEFC;      │
│  + Qur'an Coll)│ │  examined)      │ │ (Arabic/Islamic) │ │  6 CEFR levels)      │
└───────┬────────┘ └─────────────────┘ └─────────┬────────┘ └───────────┬──────────┘
        │                                        │                      │
        │  governance library, registrar,        │  constitutional form │ engineering
        │  certificates, ijāzah, policy codes    │  design excellence   │ principles, LMS,
        │                                        │                      │ payments, audio
        └────────────────────┬───────────────────┴──────────────────────┘
                             │
                   ┌─────────▼──────────┐        ┌──────────────────────┐
                   │  THIS BIBLE        │◀───────│  StromeX Technologies │
                   │  (SEB)             │        │  — StromeX AI OS      │
                   └─────────┬──────────┘        │    (SX-EB)            │
                             │                   └──────────────────────┘
                   ┌─────────▼──────────┐
                   │  StromeX           │
                   │  Enterprise MCP    │  the operational layer
                   └────────────────────┘
```

**Six load-bearing observations from the graph.**

1. **Governance depth lives in SHRS; engineering depth lives in WEC-LC;
   constitutional form lives in AMC; product philosophy lives in
   StromeX.ai.** No single project holds all four, and each has been
   quietly borrowing from the others — AMC's bible names WEC-LC's
   honesty callout as inherited; AMC's design bible was written after
   studying SHRS; WEC-LC's own bible describes a concept originally built
   for a different institution. This Bible's job is to stop that transfer
   being ad hoc.
2. **The same defects recur across projects.** "Documented but not
   enforced" appears in SHRS as joint approvals that no endpoint checked;
   in WEC-LC as an enrolment uniqueness constraint nothing enforced; in
   AMC as 1,029 passing checks on a site that scrolled sideways on every
   phone. The pattern is not carelessness — it is *verification of the
   artefact instead of the behaviour*, and Volume 23 exists because of it.
3. **Deletion is already, in practice, forbidden.** Independently, in
   three projects, deletion paths were either never built or structurally
   removed. This is the estate's strongest de facto rule and Volume 26
   promotes it to an explicit one.
4. **Honesty about gaps is the estate's signature.** Every project has a
   register of what it does not know. This is unusual, it is the thing
   that makes the rest credible, and it is why `SEB §2.4` is a
   constitution article rather than a style note.
5. **Cloudflare + Neon + Resend is a settled stack, chosen empirically.**
   Not a preference: `SHRS shrs-digital-infrastructure-blueprint §2`
   records that a plain-TCP `pg.Pool` was observed hanging the Workers
   isolate on the second request, which is *why* Neon's HTTP driver is
   used. Volume 10 records the reasoning, not just the choice.
6. **StromeX Technologies' relationship to the education group is
   undocumented.** It is the largest structural unknown in the graph.

## §28.4 The open questions — flagged, not answered

Each is a question this Bible declines to answer for you. Format follows
`AMC-D`: the question, why it cannot be answered here, what it blocks.

| # | Question | Why not answerable here | Blocks |
|---|---|---|---|
| **Q1** | **Is StromeX Technologies part of Sulaimiy Education Group, its parent, its supplier, or unrelated?** | No document in any repository states it. `AMC-D D-01` rules the *education* group's structure and explicitly excludes its facts; StromeX Technologies appears in none of it. | `SEB §0.7` (whose board approves what), Volume 8 (whether StromeX brands as a group member), Volume 22 (whose data controller StromeX is) |
| **Q2** | **Which legal entity is the data controller for each system the MCP will operate?** | Registration facts are `AMC-EB §46.3` unknowns across the estate. `AMC-D C-1` already flags this as *critical and open* — "unlawful processing in at least two named markets" without a data-residency position. | Volume 22 in full; any real student data in any system |
| **Q3** | ~~**What is the spending authority — per project, per month, and which providers?**~~ **ANSWERED AND IN EFFECT 2026-08-18 — `SEB-D 28`.** USD; US$25 single maximum; US$150 rolling 30-day cap, derived from `mcp/docs/cost-model.md`; providers named. The Naira ceiling is deferred (`SEB-D 32` records the provider-side gap). | A budget ceiling is on the escalation list at `SEB §0.5` by definition. Nothing in the corpus names a figure. | `SEB §26.6`; the MCP ships with automatic purchasing **disabled** until you set it |
| **Q4** | **Are the SHRS `IT-04` retention periods Board-confirmed yet?** | `IT-04` itself says every period is "proposed, pending Board confirmation," and `IT-04 §7.6.1` forbids writing any deletion mechanism until destruction authority is settled per category. | Volume 22's retention table; any purge capability anywhere |
| **Q5** | **Who is the second approver for Sultan Hanafi Nursery and Primary School?** | `SHRS role-permission-matrix §3` records that Registrar and Principal are the same individual there, so the documented two-person control does not operate. The remedy is the Board's; three options are named there. | Volume 12; any MCP workflow that claims to enforce joint approval for that institution |
| **Q6** | **Does the estate hold a Ministry of Education approval number?** | `SHRS authority-strategy §1` records it as "not found in any search — absent, the single most valuable addition if the school holds it." | Volume 15's compliance surface; a published inspection page |
| **Q7** | **Which domains are actually owned and renewed?** | `SHRS shrs-digital-infrastructure-blueprint §1` says the primary domain is a hardcoded string, not evidence of registration. `WEC .env.example` records that no Albalagh domain has been registered and that sending mail from an unowned domain fails SPF/DKIM outright. | Volume 10's domain architecture; every email-sending workflow |
| **Q8** | **Is the AMC award-nomenclature question (`D-03`) closed?** | Open and critical as of the register read. | Volume 12's award ladder |
| **Q9** | ~~**Do you want the MCP to hold write credentials for every repository, or only for the ones under active work?**~~ **ANSWERED 2026-08-18 — `SEB-D 30`.** Every repository; read and write together on the other seven; production Clerk and Brevo credentials, with the risk accepted in terms. | A least-privilege question only you can settle, and it materially changes the blast radius of a compromised token. | `SEB §9.4`; the credential scoping in `stromex/mcp/docs/installation.md` |
| **Q10** | **Where should secrets actually live — 1Password, Vault, `gcloud`/`aws` secret managers, or an operator-owned file?** | The MCP supports all of them through one command-resolver seam and defaults to none. | `SEB §9.2`; installation |

## §28.5 What this Bible and its MCP have *not* verified

Stated in the estate's own deployment vocabulary (`SEB §17.2`), because
that vocabulary exists exactly to prevent the sentence "it works" from
being written without evidence.

| Thing | Status | What would raise it |
|---|---|---|
| The Editorial Bible's articles | **Designed** | Your ratification, volume by volume |
| The MCP's core runtime (policy, audit, approval, retry, redaction) | **Tested Locally** | Nothing further — it is exercised by unit tests with injected clocks and sinks |
| The MCP's seven provider adapters | **Tested Locally against scripted mocks only** | One real read-only credential per provider, and the `doctor` command run against it |
| Any MCP write against a real provider | **Not Started** | A real credential plus your explicit go-ahead |
| Any MCP protected operation | **Not Started, and deliberately** | It should stay Not Started until `SEB §26` is ratified |
| Retention or purge capability | **Not Started, and forbidden** | `SEB §22.5`, which forbids building it before Q4 closes |

`WEC-EP §2`'s rule applies to this Bible as much as to any subsystem:
**a test that supplies its own inputs can only discover what its author
already imagined.** Every adapter in the MCP has met a scripted fetch and
none has met a real provider. That is the honest boundary of what is
proven, and it is written here rather than left for you to discover.

## §28.6 How to extend this volume

When a repository, a document or a conversation is studied that this
volume does not list, add a row to `SEB §28.1` and, if it changed a
conclusion, an amendment entry at `SEB §0.6`. When an open question in
`SEB §28.4` closes, move it to Volume 25 with the ruling, the date and the
reasoning — do not delete the row (`SEB §26.3`).
