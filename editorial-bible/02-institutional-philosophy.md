# Volume 2 — Institutional Philosophy

*The convictions that produce the rest of the Bible. Six articles. If
every other volume were lost, these six would regenerate most of them.*

---

## §2.1 Trust is an archive, not a claim `[OBSERVED]`

The single most consistently applied idea in the estate, stated most
plainly at `SHRS authority-strategy §0`:

> Do real things, document them at the time, with dates and names and
> photographs, and publish the documentation where it can be checked.

Its force comes from the counter-example recorded in the same document: a
sitting governor gave the school ₦10 million and a public tribute to the
founder's integrity in November 2024, and the school's own website did not
mention it, while the gallery captioned the photographs "guests at the
commissioning day ceremony." The evidence existed; the record did not.

**Binding consequences.**

1. Every event is documented **within seven days** of occurring: date,
   names, photographs, one page (`SHRS authority-strategy §3`).
2. Every dated claim names its source, and the record distinguishes press,
   registry, capture and the institution's own account **visibly**.
3. Single-source events are stated *as reported*, never as established.
4. Nothing is promoted a confidence level without new evidence.
5. **Corrections are published, kept and dated.** A corrected archive is
   more credible than a spotless one, because it proves the discipline is
   real (`SHRS archive-governance §4`).

## §2.2 Institutional records are permanent assets `[OBSERVED]`

Independently arrived at in three projects, and therefore the estate's
strongest de facto rule. Promoted here to an explicit one and given its
enforcement in `SEB §26.1` and Volume 22.

- `SHRS role-permission-matrix §2`: "**Delete is granted nowhere on core
  institutional records.**" Student, guardian, attendance, result, Hifz
  and Ijazah records use **Archive** — a status change, fully reversible,
  audit-visible — instead.
- `SHRS IQ-02 §7.6`: the Ijazah register is **permanent, never deleted,
  only annotated**, and this is enforced structurally — no delete path
  exists in any endpoint, `student_id ON DELETE SET NULL`, and the
  student's name is frozen onto the row so it survives even if the student
  record is later removed.
- `SHRS IT-04 §7.6`: "Archival and deletion are not the same event, and
  this project has built almost exclusively the first."

The preference order, in every system, for every record:

> **archive · version · supersede · revoke · deactivate — before delete.**

## §2.3 The gap is named, never smoothed over `[OBSERVED]`

The estate's documents do something unusual and valuable: they end with a
section saying what they did *not* do. `SHRS approval-workflow-architecture
§6` is titled "What this does NOT yet cover — named gaps, not silent
ones." `SHRS data-lifecycle-register` has "What this register deliberately
leaves open." `WEC-EP §3` is "Where this class of defect is still live —
honest register." `AMC-DX §16` marks one component "**Held** — built and
unused; requires a real named person to sign."

**Binding:** every specification, architecture document, audit and report
produced under this Bible ends with a section naming what it left open and
who owns it. A document with no such section is either trivial or
dishonest, and reviewers should treat its absence as a finding.

## §2.4 The Institutional Honesty Protocol `[OBSERVED]`

Inherited from `AMC-EB §46`, which calls it "the most important article in
this document," and independently present in `WEC-EB`'s Institutional
Status callouts.

> **No fact about an institution is published unless it is true today.**

Not "will be true." Not "is true in spirit." Not "is true of the sector."
True, today, about us, and checkable.

**This binds:** student and graduate numbers, testimonials, faculty names
and credentials, accreditations, partnerships, endorsements, facilities,
founding dates, sanad and ijāzah chains, pass rates, durations, awards,
media coverage and photographs. It binds engineering equally: uptime,
test coverage, "production ready," "deployed," "verified" (`SEB §17.2`).

**The mechanism is a component, not an omission.** Where a fact does not
exist yet, that is published — in the same visual language as everything
else, in the same voice, at the same size. Not a smaller font, not a
footnote, not a silence.

**Why this is a commercial asset rather than a confession** (`AMC-EB
§46.2`): in a category saturated with unverifiable claims, the institution
that publishes its gaps is the one whose other claims become believable.
For an Islamic institution it is not merely good practice — it is *amāna*.

**The correction protocol** (`AMC-EB §46.4`): correct within 24 hours of
discovery; state the correction publicly where the error was public; date
it; **do not quietly delete**.

## §2.5 Verification beats assertion, and the artefact is not the behaviour `[OBSERVED]`

The estate has paid for this lesson at least four times, in four different
forms, and the pattern is identical each time: something was checked, the
check passed, and the check was not measuring the thing it claimed to.

| What passed | What was actually broken | What caught it |
|---|---|---|
| 62 unit tests on recording upload | Every recording a real browser produces was rejected (`audio/webm;codecs=opus`) | A real `MediaRecorder` on a real Chromium (`WEC-EP §2`) |
| A green suite over Clerk auth | Every request would have 401'd — the client sent no `Authorization` header at all | A harness that was made to require auth (`WEC-EP §2`) |
| 1,029 static checks reporting success | Every page scrolled 330px sideways on a phone; 261 overflowing elements on one Arabic page | Opening a viewport (`AMC-EB §48.3`) |
| A documented two-person control | A Registrar could "jointly" approve their own certificate | Grepping for the field and finding it was never persisted (`SHRS approval-workflow-architecture §1`) |

Three rules follow, and they are restated in Volume 23 as testing law:

1. **A stylesheet cannot be checked by reading it** (`AMC-EB §48.3`).
   Layout is an emergent property of a whole document in a real engine at a
   real width. So is authorisation, so is delivery, so is deployment.
2. **Every subsystem must have at least one test driven by the real
   producer of its inputs** — a real browser, a real encoder, a real
   signature, a real payload — not by inputs the test invented (`WEC-EP §2`).
3. **A stand-in must be no more permissive than the thing it stands in
   for** (`WEC-EP §2`).

And the permanent engineering principle set by the Executive on 2 August
2026, which governs all three:

> **Never trust an implementation merely because it passes tests.
> Continuously verify that the tests themselves measure the complete
> behaviour they claim to guarantee.**

## §2.6 Governance language and system behaviour must agree `[OBSERVED]`

The most valuable finding in the whole corpus, because it is a *class* of
defect rather than a bug: a matrix, register or policy describes a control
— "Registrar + Principal jointly," "requires approval before release,"
"retained for seven years" — and nothing in the running system implements
it.

`SHRS data-lifecycle-register` audits this honestly, category by category,
and its verdict is worth quoting: "**No approval step in this project is
system-enforced except Admissions status changes.** … That is a real gap
between governance language and system behaviour, named here rather than
implied away." And on retention: "every one of them is currently 'keep
forever, nothing purges it' in practice."

**Binding, and this is the article the MCP exists to serve:**

1. A governance document that describes a control **must state whether
   that control is *enforced*, *recordable*, or *aspirational*** — using
   those three words.
2. A system that claims to enforce a control must fail closed when it
   cannot. `SHRS approval-workflow-architecture §3` is the reference
   implementation: separation of duties is checked *before* the permission
   check, and the side effect never runs when it fails.
3. Where a control cannot yet be enforced, **the document says so in the
   same sentence that describes it** — and that sentence is a work item,
   not an apology.
