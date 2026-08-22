# Volume 33 — Media, Assets and Provenance

*Images, illustration, vectors, type, sound and every other asset: how
they enter the estate, what is recorded about them, and who decides.*

---

## §33.1 The Founder's ruling, adopted `[RULED]`

**The institution asserts and holds the licences for the media it
supplies.** Sources named by the Founder include Wikimedia, Pinterest-
sourced originals, stock libraries and others, held under licences
associated with the institution's own accounts.

Three consequences, in force:

1. **No automated gate.** No AI, tool, build step or workflow in this
   estate blocks, refuses, flags or withholds work on the basis of an
   asset's licensing status. Uploads are unlimited. Nothing is quarantined.
2. **Legal review is the gate, at the end.** The institution's legal
   function is responsible for the final filter, not any automated
   system and not any AI operator.
3. **Assets are used as supplied.** Where the Founder later says "change
   so-and-so", it is changed at will — which is the correction protocol,
   and it is faster than any pre-emptive gate would have been.

## §33.2 What is recorded, and why it is worth having

**A register, not a gate.** It costs nothing at the point of use and it is
the difference between a question legal counsel can answer in a minute and
one that takes a week.

Every asset entering the estate gets a row, at intake — the same
discipline the SHRS archive already runs (`SHRS archive-governance §2`):

| Field | |
|---|---|
| **Accession number** | `SX-A-YYYY-NNN`, permanent, never reused |
| **Description** | One sentence a stranger can use |
| **Date of record** | When the thing it depicts happened, not when the file was made |
| **Source** | Where it came from, as supplied |
| **Rights basis** | What the institution asserts, in the institution's own words |
| **Supplied by** | Who put it into the estate, and when |
| **File hash** | SHA-256, so substitution or corruption is detectable decades on |
| **Use** | Where it is placed |

**Nothing in the register blocks anything.** It records. When counsel
asks "where did this come from and on what basis", the answer exists.

**An asset not in the register is still usable.** The register is a
service to the institution, not a checkpoint over it.

## §33.3 What this volume does not do

Stated once, plainly, so nobody has to infer it:

This volume records what the institution asserts about its own licences.
It does not evaluate those assertions, and no article here should be read
as a determination that any particular use is or is not permitted — that
determination belongs to counsel (`SEB §33.1`, item 2), which is exactly
where the Founder placed it.

## §33.4 Quality standards for media `[RULED — confidence High]`

Licensing is settled above. **Craft is not**, and this is where the
attention goes:

- **Every photograph is gradient-mapped into the palette.** That single
  treatment is why licensed material from twenty photographers reads as
  one commission rather than as a collection. It is not optional.
- **No image may caption itself into a false claim** (`SEB §7.11`). A
  photograph illustrates an activity; it does not become a claim about
  this institution's campus, faculty, students or graduates. Where the
  image would read as an institutional claim, use an engraving — **a
  drawing is plainly a drawing.**
- **Resolution floor**: 2× the largest rendered dimension, always. An
  upscaled asset is visible at a glance on the screens this estate
  targets and it destroys the impression everything else is built for.
- **Format**: AVIF with a WebP fallback; SVG for anything vector; no
  raster where a vector will do. Every image carries intrinsic dimensions
  so nothing shifts on load.
- **Ornament is authored** (`SEB §30.11`). Generated, deterministic,
  diffable. Photography and illustration may be supplied; the guilloché,
  the plates and the Burin icon set are ours and are drawn.
- **Consent and dignity** govern any image of a person, and of a child
  absolutely — published only within the institution's media-consent
  practice.

## §33.5 The legal review point

One review, at the end, before a public release. It is the institution's
legal function reviewing the register and the placements — **not a
technical gate, not an AI, and not a blocker on day-to-day work.**

What the estate provides to make that review fast:

- the register (§33.2), exportable;
- every placement, by accession number;
- the build's own asset manifest, so nothing is on a surface that is not
  in the register.

## §33.6 Type and sound

- **Typefaces**: licensed for web and print, self-hosted, no CDN
  dependency. A face whose licence the institution has not obtained is not
  shipped — not as a matter of caution but because a font that fails to
  load is a design failure, and a licence dispute mid-term is worse.
- **Sound**: the single Strike tone (`SEB §30.13`) is authored, not
  sourced.
