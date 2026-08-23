# Audit 21 — Naming

**Method.** Every institutional name and acronym the College publishes,
measured across the served site, and judged on one question: can a
first-time international reader understand it without going to look it
up?

---

## What is published

Eight acronyms: **IEFC** (the programme), **WEQ** (the qualifications
framework), and six award post-nominals — **ECIC, HCIC, CAEC, HCAEC,
ACEC, WEPC**.

Plus two parallel naming systems for the same six levels, and three
variants of one of them.

---

## Finding 1 — the measurement was wrong first, and that is part of the finding

The opening measurement said IEFC appeared on 38 pages and was expanded
on 6.

That figure was inflated. The shared header and footer carry all eight
acronyms on every page, so scanning whole pages attributed the chrome's
vocabulary to each page. Measured against each page's own `<main>`, the
true figure was **14 pages**.

An audit that overstates fails in the same way as one that misses, and
the scoping decision it forced — attribute a page only for what its own
copy says — is what made the rest of this audit worth anything.

**A second measurement error followed.** Having scoped to `<main>`, the
guardrail could no longer see the header and footer at all — so the
audit rewrote the header's fourteen labels and reported the site clean
while the footer still said *The IEFC Programme* and *Level I · A1* on
all forty-six pages. The chrome is now checked once as its own unit.

---

## Finding 2 — IEFC was unexplained on 14 pages' own copy

Fixed. Expanded on first use in each, in prose rather than only in a
tooltip: a hover title is unreachable on a phone, which is what most of
the College's readership is holding.

---

## Finding 3 — the six award codes were unexplained where they matter most

The academics overview presented all six as bare codes. Now each is an
`<abbr>` and all six appear again in a plain-text key beneath the table,
with the statement that they are the College's own awards, aligned to
CEFR, not regulated and carrying no accreditation.

---

## Finding 4 — the navigation named the qualifications in a language nobody reads

The English menu listed award codes. The Arabic menu listed the stage in
Arabic — *المستوى الأول · التأسيس*.

**The Arabic edition was more legible than the English one.** Not a
translation artefact; whoever wrote the Arabic understood the reader
better. The English menu now names the stage and the CEFR band —
*Foundation Stage · A1* — and the codes live where they can be read in
full.

---

## Finding 5 — the Graduate Register offered four awards that do not exist

Its filter listed *English Candidate*, *English Associate*, *English
Fellow* and *English Scholar* — titles retired when the College adopted
the WEQ framework — beside two titles from the current framework. One
control, awards from two eras.

Nothing caught it because nothing had ever compared published award
names against the record. A test now does.

---

## Finding 6 — the flagship curriculum contradicted itself

Its lead paragraph said a Level III leaver is "an English Associate of
Worldwide English College, permanently, **and the College says so in
those words**". Three lines below, the document's own table named the
Certificate in Applied English Communication.

A downloadable institutional document asserting the College uses words
it retired, immediately above a table proving otherwise. The generator
now reads the title from the record.

---

## Finding 7 — the College has two names for each of its six levels

| Level | On the site | In the record and every publication |
|---|---|---|
| I | Foundation Stage | Foundation Programme |
| II | Development Stage | Elementary Programme |
| III | Application Stage | Intermediate Programme |
| IV | Professional Stage | Upper Intermediate Programme |
| V | Advanced Stage | Advanced Programme |
| VI | Mastery Stage | English Mastery Programme |

Both are published, on the same page. The academics table has a column
headed **Programme** carrying the second while the menu that brought the
reader there carries the first.

**And a third variant exists.** The homepage's own level table
abbreviates the second system — *I Foundation*, *II Elementary*, *III
Intermediate* — dropping "Programme". So a reader who visits the
homepage, the menu and the academics table meets three vocabularies for
six things.

This one is a governance judgement and is not the Design Office's to
make. Board Paper 03 sets out four options, recommends the stage names,
names the option it does not recommend, and is registered as **C11**,
undecided.

---

## Finding 8 — an unpublished copy had drifted a whole level

`scripts/publication/stage.mjs` kept its own list of the six level names
and carried *Pre-Intermediate Programme* at III and *Intermediate
Programme* at IV — one level out of step with the record, left from a
six-versus-seven-level revision settled everywhere else.

Nothing published it, so nothing noticed. That is the hazard of an
unpublished copy: it is correct only until somebody renders it. Now
asserted against `programme_levels`.

---

## Finding 9 — the College has no Arabic name for its own programme

The Arabic edition says *برنامج IEFC* — the Latin acronym, in Arabic
prose. It now carries the English full name beside it, which is standard
practice and honest.

It is not a name. An Arabic-reading institution referring to its
flagship programme by a Latin acronym has not named it in Arabic, and
the College's largest readership reads Arabic.

**Not fixed, deliberately.** Inventing an Arabic official title for a
programme is naming by fiat, and it belongs with C11.

---

## What the audit did not find

No misleading name. Nothing designed to be mistaken for a regulated
qualification. "College" is used, "University" is not. "London Campus"
is explicitly disclaimed as an administrative headquarters and not a
teaching campus, on every page where it appears. The award titles are
deliberately not confusable with degrees — the reasoning for rejecting
"Master" is written down in the record.

The naming problems here are all *legibility* problems, not *deception*
problems. That is a much better class of problem to have.

---

## The guardrail

`tests/naming.test.mjs`: every acronym in a page's visible `<main>` text
must have its full name on that page; the shared chrome is checked once
in both editions; no served page may name a retired award; no generator
may type one; the publication stage list must match `programme_levels`.

Names are read from `award_definitions` so the test cannot drift from
what the College confers. It carries a positive control, because a
broken text extractor would otherwise report a clean site.
