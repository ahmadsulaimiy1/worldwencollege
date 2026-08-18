# Volume 0 — The Charter

*The StromeX Editorial Bible. Cited as `SEB §0.1`, `SEB §3.4`, and so on:
volume number, then article.*

---

## §0.1 What this document is

The constitution of StromeX Technologies and of every institution it
builds and operates for. It governs the decisions that outlive any single
project: how systems are designed, how data is treated, what may be
deleted, what may be claimed, what a certificate means, what an AI agent
may do without asking, and what it may never do at all.

It is deliberately **not** documentation for an application. Applications
are built and retired. This is the layer beneath them, written on the
assumption that a great many more will be built — schools, colleges,
universities, registrars, LMS platforms, certificate engines, transcript
systems, finance, admissions, HR, research, alumni, public websites and
commercial SaaS products (`SEB §24`).

## §0.2 Where it came from

It was not invented. It was **derived** from four working repositories
holding roughly sixty-seven thousand lines of institutional documentation
and the code beneath them — the StromeX Editorial Bible, the Sultan Hanafi
Royal Schools governance library, the Al-Madeenah International College
constitution, and the Worldwide English College engineering record.

The method, the full source list, and every place the record was silent
are in **Volume 28**. Read it before treating any article here as your
settled policy.

## §0.3 The three rules that govern the document itself

Inherited verbatim in substance from `AMC-EB §Preamble`, which is the most
developed statement of them in the estate.

1. **It outranks preference.** Once ratified, a design, architectural,
   product or operational decision that contradicts this Bible is wrong by
   definition, regardless of who prefers it — including the Founder,
   including any AI agent operating under it. The remedy is to *amend the
   Bible* (`SEB §0.6`), never to make a quiet exception. **Exceptions are
   how institutions lose their character.**

2. **It never asserts a fact the institution does not possess.** Where a
   fact is unknown or undecided, this document says so plainly, in the
   same voice as everything else, in the same visual register. This is
   the Institutional Honesty Protocol (`SEB §2.4`), and it is the single
   most load-bearing rule in the whole Bible.

3. **It is versioned, cited and amendable.** Articles are cited as
   `SEB §14.2`. Amendments are dated, attributed and — above all —
   *reasoned*: a future reader must be able to reconstruct the argument,
   not merely see that the text changed.

## §0.4 The two kinds of article, and how to tell them apart

Every article in this Bible is one of two things, and each is marked:

| Marker | Meaning |
|---|---|
| **`[OBSERVED]`** | A principle already operating consistently across two or more projects in the estate. Restated here, with citations, so it stops being tacit. These are *yours*; the Bible is only recording them. |
| **`[RULED]`** | A decision taken under the executive-autonomy protocol (`SEB §0.5`) because the estate was silent or inconsistent and the work could not proceed without an answer. Carries a **confidence level** and a note on what would reverse it. |
| **`[OPEN]`** | A question this Bible refuses to answer on your behalf, with the reason, and what it blocks. Collected in `SEB §28.4`. |

An unmarked normative statement is a defect in this document. Report it.

## §0.5 The executive-autonomy protocol

**Adopted from `AMC-D`, in force from 2 August 2026 at the Founder's
direction, and generalised here from one college to the whole estate and
to automated operations.** `[OBSERVED]`

> **Decide, don't ask** — where a decision can be reached through
> research, reasoning, accepted best practice, educational governance,
> branding, engineering, finance, UX or Islamic institutional standards.
> Document the rationale, assign a confidence level, register it, and
> continue. Do not pause the programme over an unresolved non-critical
> decision: proceed on the best-supported assumption and record it.

**Escalate only** what genuinely requires information nobody but you holds:

| Escalate | Do not escalate |
|---|---|
| Legal registration details | Which of two defensible designs is better |
| Ownership and corporate facts | Anything resolvable by research |
| Historical institutional records | Anything resolvable by best practice |
| Contractual obligations | Anything with an obvious professional default |
| Budget ceilings and spending authority | Anything decidable, recordable and cheaply reversible |
| Personal preferences not reasonably inferable | Preferences inferable from prior decisions |
| **Permanent destruction of institutional data** | **Archiving, revoking, superseding, deactivating** |
| **Irreversible organisation-wide change** | Anything scoped to one project and revertible |

The last two rows are this Bible's extension of the protocol. The original
was written for design and strategy decisions, where the worst outcome is
a wrong answer that can be argued back. Automated operations introduce a
class of decision where the worst outcome is a transcript that no longer
exists. Those cross the line into escalation regardless of how confident
the agent is (`SEB §26.1`).

**Confidence scale** — used on every `[RULED]` article:

| | Meaning |
|---|---|
| **High** | Evidence-backed; defensible to a board. Reversal should be argued, not assumed. |
| **Medium** | Best-supported reading; a specific named unknown could change it. Flagged in place. |
| **Low** | Working assumption adopted to avoid blocking. Provisional; verify early. |

**Every ruled decision is reversible on one line from the Founder.**

## §0.6 Amendment and versioning

- **Version scheme** `MAJOR.MINOR`. MAJOR for changes to Volumes 1, 2, 9,
  22 or 26 — identity, philosophy, security, data governance, and the
  permanent rulings. MINOR for everything else.
- **Every amendment records** date, volume and article, what changed, who
  approved it, and **why**. The reasoning matters more than the change.
- **Full annual review**, minuted, whether or not anything changes.
- **Superseded text is never deleted.** Git history is the retention
  mechanism (`SHRS data-ownership-register`, policy-document row), and an
  amendment log entry that says only "updated §14" is a defect.

## §0.7 Authority

Adapted from `AMC-EB §44.1` and `SHRS role-permission-matrix §3`, using
the estate's own permission vocabulary (`SEB §21.2`).

| Authority | Owns | May approve |
|---|---|---|
| **Founder** (Head of Schools / Administrator; Chairman of the Board of Governors) | Vision, mission, values; all `D-`numbered decisions; spending authority | Amendments to any volume |
| **Board of Governors** *(where an institution has one)* | Institutional governance, retention periods, destruction authority | Amendments to Volumes 12, 14, 15, 22, 26 |
| **Academic Board** *(where constituted)* | Curriculum, assessment, mastery standards, Islamic identity standards | Amendments to Volumes 13, 14, 15 |
| **Design Authority** | The design language and all identity assets | Amendments to Volumes 7, 8 |
| **Editorial Authority** | Voice, editorial standards, published content | Amendments to Volumes 2, 18 |
| **Engineering Authority** | Engineering, architecture, security, infrastructure, DevOps, testing | Amendments to Volumes 3, 4, 9, 10, 11, 17, 19, 20, 23 |
| **The AI Operator** (any agent under `SEB §16`) | Nothing. Executes within delegated authority; records everything; escalates the escalation list. | Nothing. May *propose* an amendment with reasoning; may not adopt one. |

`[OPEN]` **Which of these authorities are currently constituted for
StromeX Technologies, as distinct from Sultan Hanafi Royal Schools?** The
estate documents a Board of Governors for SHRS (`SHRS GV-01`, amended
2026-08-04) and an Academic Board proposed for Al-Madeenah. Nothing in the
corpus establishes the corporate governance of StromeX Technologies
itself, or its relationship to Sulaimiy Education Group. Until you rule,
the Founder holds every authority above by default, and this Bible says
that rather than inventing a committee. See `SEB §28.4`, question Q1.

## §0.8 Citation conventions used throughout

| Sigil | Source |
|---|---|
| `SEB §n.m` | This Bible |
| `SX-EB` | The StromeX Editorial Bible, `ahmadsulaimiy1/stromex.ai`, `docs/00-STROMEX-EDITORIAL-BIBLE.md` |
| `SHRS <doc>` | The Sultan Hanafi Royal Schools corpus, `ahmadsulaimiy1/Sultan-`, `docs/` |
| `SHRS <CODE>-nn` | An SHRS policy by its own code — `IT-04`, `AC-02`, `IQ-02`, `GV-01` |
| `AMC-EB §n` | The Al-Madeenah Editorial Bible |
| `AMC-DX §n` | The Al-Madeenah Design Excellence Bible |
| `AMC-D nn` | The Al-Madeenah Executive Decision Register |
| `WEC-EP §n` | Worldwide English College engineering principles |
| `WEC-EB` | The Worldwide English College Editorial & Brand Bible |

An institution that cites its own sources can be argued with. One that
does not can only be obeyed or ignored.
