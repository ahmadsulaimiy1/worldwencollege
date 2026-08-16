# abisulaimiycollege.com.ng — Content Extraction

A complete extraction and refinement of **abisulaimiycollege.com.ng**, the
Google Sites site for Imam Ahmad bin Ibrohim Sulaimiy College. Captured
**16 August 2026**: all 35 published pages.

This is a documentation set only. It changes nothing about the WEC-LC site
in the rest of this repository, and it is not wired into the build.

## The four files

| File | What it is | Read it when |
| --- | --- | --- |
| [`refined-content.md`](refined-content.md) | **The main deliverable.** Every piece of content, edited, deduplicated, consolidated by topic, with every gap marked `[TO CONFIRM]` | You want the content itself — to rewrite the site, brief a designer, or answer "what do we actually say about X?" |
| [`audit.md`](audit.md) | Every problem found, ranked by consequence, with fixes and a suggested order of work | You want to know what to fix, and what not to republish |
| [`source-extract.md`](source-extract.md) | Verbatim page-by-page capture, uncorrected | You need to check what the site actually said |
| [`content.json`](content.json) | The same facts as structured data — programmes, awards, fees, people, contacts, site health | You are rebuilding the site, or feeding a CMS |

Start with `refined-content.md`. Read `audit.md` before publishing anything
anywhere.

## What the extraction found

Of 35 pages: **22 carry real content**, **8 are stubs** (a heading and
nothing else, five of them showing another page's heading), and **5 are
completely empty** — including `/apply-now`.

The writing that exists is substantial. The certification framework, the
admissions rules, the 40-question FAQ and the founder's welcome are
serious, coherent documents. The problem is that the site **cannot be acted
on**: no fee, phone number, address or application route is published
anywhere, and every donation channel is a placeholder. Layered on top are a
small number of claims — an unverifiable university affiliation, faculty
credentials that don't survive a basic check, and a clause purporting to
strip students of any right to legal action — that put the credible parts
at risk.

Full detail in `audit.md`; the six critical items are at the top.

## Editorial rules followed

The same discipline as `docs/editorial-bible.md`: **facts are not
invented.** Typos, grammar and inconsistent terminology were corrected, and
duplicated passages merged. But where the site publishes a blank
(`[---------------]`), a placeholder (`[Insert Phone Number]`), or a claim
that cannot be checked from the site itself, `refined-content.md` says so
in a **`[TO CONFIRM]`** marker rather than filling the gap. Every marker is
an open decision for the College.

## How it was captured

- Source: `https://www.abisulaimiycollege.com.ng`. The apex host does not
  serve HTTPS and plain HTTP hits a registrar parking page — see
  `audit.md` § I1.
- All 35 pages reachable from site navigation were fetched, their main
  content region extracted, and Google Sites chrome stripped.
- The site embeds no Docs, Forms, Drive files or third-party widgets, so no
  content lives outside the captured page text.

To re-capture after the site changes, the page list is the index table at
the top of `source-extract.md`.
