# Volume 18 — Documentation Standards

*The estate's documentation is one of its genuine assets. This volume is
how it stays one.*

---

## §18.1 The thirteen-section governance document `[OBSERVED]`

Every policy and governance document in the estate uses one structure
(`SHRS` policy corpus, "retrofitted to the full 13-section governance
architecture"). Adopted as the standard for any document that governs
conduct:

1. **Policy Information** — code, title, version, effective date, owner,
   approval authority, review cycle, next review date
2. Purpose · 3. Scope · 4. Definitions · 5. Policy Statement ·
6. Roles and Responsibilities · 7. Procedures · 8. Monitoring and
Compliance · 9. Records and Documentation · 10. Related Policies ·
11. Exceptions · 12. Appeals and Complaints · 13. Review and Amendment,
followed by a **version-control table**.

**And the estate's own addition, which is the best thing about it:** a
callout immediately after §1, headed **"Before this governs a real
decision,"** stating exactly what is and is not live today. `SHRS IT-05`
uses it to say that three of the four AI systems the policy covers **do
not exist yet** — "do not read any section below as a description of
something currently live unless it explicitly says so."

## §18.2 Every document says what it left open `[OBSERVED]`

`SEB §2.3`. A section titled *What this deliberately leaves open* — or
*named gaps, not silent ones* — is mandatory, and its absence is a review
finding.

## §18.3 Documents are versioned, dated, owned and reviewed `[OBSERVED]`

- **Version control table** on every governance document: version, date,
  change, author, and whether it has been adopted.
- **"Drafted" is not "adopted."** The estate marks documents *not yet
  effective — pending Board adoption*, and that state can persist for a
  long time without embarrassment.
- **Review cycle stated**, and a next review date fixed on adoption.
- **Owner named**, as a person or an office, never "the team."

## §18.4 Policy codes `[OBSERVED]`

A prefix plus a two-digit number, grouped by category
(`SHRS policy-code-index`): `GV` governance · `AC` academic · `SD` student
· `PA` parent · `SW` safeguarding & welfare · `HR` human resources ·
`FN` finance · `IT` technology · `IQ` Islamic & Qur'an education.

Three properties make the scheme work:

1. **Numbers preserve an existing published position** where one exists,
   so a live policy's identity does not change when it is catalogued.
2. **A code is assigned to documents that are Missing or Partial too**, so
   the index is a map of the whole intended library rather than of what
   happens to exist.
3. **Meta documents get no code** — registers, audits and evaluation
   frameworks "govern the governance process, not institutional conduct."

**Extension for engineering:** an `EN` prefix for engineering standards
that bind conduct (release, incident, change management), so an engineer
can cite `EN-03` the way a registrar cites `AC-02`.

## §18.5 Publication classification `[OBSERVED]`

Per `SHRS policy-code-index`: **no governance document exists only in the
repository unless it is intentionally classified internal-only.**

| Class | Contents |
|---|---|
| **Public** | Family- and student-facing documents, and those comparable institutions publish as a matter of transparency: safeguarding, conduct, admissions, boarding, data protection, AI usage, retention, the governance charter |
| **Internal** | Staff HR matters, financial-control specifics, and technical security detail where publishing exact parameters (lockout thresholds, approval amounts) is counterproductive |
| **Internal (meta)** | Evaluation documents that assess *other* policies rather than governing conduct |

And the caveat the estate itself attaches: this classification is **a
proposal for confirmation**, not a final determination; a real legal or
communications function should confirm the borderline cases.

## §18.6 Documents are cited, not summarised `[OBSERVED]`

The estate's documents cite each other by article — `EB §14.2`,
`IT-04 §7.1`, `AC-02`, `IQ-02 §7.6` — and **deliberately do not repeat
each other's content**: "This is a relationship map, not a repeat of the
DDL (that's `sql/schema.sql`, the single source of truth for column-level
detail)."

**Binding.** One fact, one home. Everywhere else cites it. Duplicated
content diverges, and the copy that diverges is always the one someone is
reading.

## §18.7 A document records the argument, not only the conclusion `[OBSERVED]`

`SEB §0.6`. The estate's amendment logs are unusually good at this —
`AMC-EB` v0.9 runs to a full paragraph explaining that two people reviewed
two different websites for three rounds because one was in dark mode, with
the measured percentages. A future reader can reconstruct it.

**Binding.** Where a decision reverses an earlier one, the entry says what
the earlier reasoning was and why it was wrong. "Updated §14" is a defect.

## §18.8 Code documentation `[OBSERVED]`

- **Every module opens with why it exists**, not what it contains. The
  estate's best files do this: a header explaining that stdout is the
  protocol channel; a header explaining that redaction is by value because
  key-name redaction fails on names nobody predicted.
- **A decision that looks like a mistake carries its defence in a
  comment** (`SEB §3.11`).
- **A known limitation is a comment at the point of the limitation**, not
  only in a document nobody reading the code will open.
- A `README` states what the thing is, how to run it, how to test it, and
  what it does **not** do.

## §18.9 Reports `[OBSERVED]`

Audits, reviews, verification reports and deployment reports follow one
shape: what was checked · what was found, numbered · what was fixed in
this pass · **what was found and deliberately not fixed, with the owner**
· what could not be checked and why.

The last two are the ones that make a report worth reading again.

## §18.10 Documentation is produced with the work, not after it `[OBSERVED]`

`SEB §2.1`: seven days from event to record. For engineering, the window
is the same commit. A change that alters behaviour and leaves its
documentation stale has not been completed (`SEB §5.9`).


---

## §18.14 Writing a decision for the person who must take it

**Added 2026-08-18 (`SEB-D 37`).** This estate's documentation standard
already governs what is written down. This article governs what is
**asked**.

A decision put to a human is a different artefact from a document written
for engineers, and it fails differently. An engineering document that
assumes vocabulary costs the reader a search. A *decision* that assumes
vocabulary costs the reader their authority — they answer a question they
could not fully read, and the answer is recorded as theirs.

**The four rules:**

| | |
|---|---|
| **1** | **Define each term where it first appears**, in the sentence, in ordinary words. Not a glossary and not a link |
| **2** | **Give the mechanism, not the label.** The reader should be able to predict what happens next, not merely recognise the word |
| **3** | **State the real consequence of being wrong** — what breaks, who notices, what it costs, whether it is reversible |
| **4** | **Necessary and sufficient.** Everything load-bearing; nothing else. Brevity that omits a consequence is not brevity, it is a defect |

**An analogy is permitted and often required.** A hotel key card that opens
one room versus a master key that opens the building explains credential
scoping in one line to a reader for whom "scope" is an unfamiliar verb.

**This does not license simplifying the decision itself.** The content is
unchanged; only the vocabulary is made shared. Where a decision is
genuinely irreducible, say so and explain it fully rather than reducing it
to something answerable but different.

**A decision may always be re-put.** Being misunderstood once does not make
a ruling binding.
