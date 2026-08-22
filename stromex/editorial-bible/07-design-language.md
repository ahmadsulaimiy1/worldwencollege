# Volume 7 — The Design Language

*The grammar every StromeX institution shares. Palettes and typefaces
belong to institutions (Volume 8); the grammar belongs to the estate, and
it is the reason four different-looking projects read as the work of one
hand.*

> **For StromeX products, Volume 30 governs.** This volume remains the
> shared grammar every institution in the estate inherits — the component
> canon, the measured colour proportion, the three type roles, the
> geometry and light model. **Volume 30 is StromeX's own hand**: the
> Meridian, the Quire, Stratum, the Chronograph, the Register and the
> twenty signature components, specified to the value and implemented in
> `stromex/design-system/`. Where they differ for a StromeX product,
> Volume 30 wins (`SEB §31.1`).

---

## §7.1 The governing idea `[OBSERVED]`

Typography-led, calm, generous with space, restrained in colour, and built
from an **institutional vocabulary** rather than a UI-kit vocabulary
(`SX-EB Part VI`, `WEC-EB Part III`, `AMC-DX §1`).

The benchmark stated in `SX-EB Part VI` is world-class simplicity — the
interfaces of Linear, Notion and Figma — "not the cluttered defaults of
legacy enterprise or edtech software." The benchmark stated in `AMC-DX` is
a printed institutional document. Both are true, and where they conflict,
the printed document wins for anything ceremonial and the software
benchmark wins for anything operational.

## §7.2 Space is the primary material `[OBSERVED]`

`AMC-DX §1–§3`. Space, not colour and not ornament, is what separates
expensive from utilitarian. Three rules carry it:

- **A defined space scale**, with a stated minimum per section type, and
  no ad-hoc values anywhere.
- **The half-empty rule** — a page that is not close to half empty is not
  finished being edited.
- **Asymmetry over symmetry** — a centred column of centred things reads
  as a template; an asymmetric field with a strong left (or right, in RTL)
  edge reads as a designed page.

## §7.3 The component canon `[OBSERVED]`

The estate's most transferable design asset. Both `WEC-EB Part III` and
`AMC-DX §6` define a closed vocabulary of institutional components, **each
named against the generic convention it replaces**:

| Component | Replaces |
|---|---|
| **Ledger table** (`.ledger`) | The card grid — the register of a formal academic transcript |
| **Credential ledger** (`.creds`) | The team page with circular avatars |
| **Dot-leader index** (`.dotlist`) | The icon-box feature list |
| **Figure rail / stat row** (`.figrow`) | The marketing badge |
| **Folio marker / module marker** (`02 · Academic Programme`) | The generic eyebrow label |
| **Monogram rail** (`.monorail`) | The logo cloud |
| **Pledge block** (`.pledge`) | The "why choose us" tick list |
| **Journey path** (`.path`) | The numbered-circle process graphic |
| **Quad** (`.quad`) | Four cards in a row |
| **Letter** (`.letter`) | The testimonial |
| **Institutional frame** (`.illum`) | The hero gradient |
| **Watermark seal** (`.watermark`) | The background image |
| **Comparison bars** (`.info`) | The pie chart |
| **Document card** (`.doc`) | The PDF link |
| **Tag row** | The icon box |
| **Institutional Status callout** | The silence where a fact should be |
| **Register menu / colophon** | The mega-menu and the link-farm footer |

**Binding (gate G1).** Every section of every page is built from the
canon. A section that needs something the canon does not have is a
proposal to *extend the canon*, argued and recorded — not a one-off.

## §7.4 Colour encodes meaning, and its proportion is measured `[OBSERVED]`

**A colour earns its place by carrying a meaning — a ground, a state, a
kind of information — not by adding variety** (`WEC-EB Part III·b`). A
green that sometimes means achievement and sometimes means "a nice green"
has stopped meaning anything.

**Proportion is a rendered-pixel measurement, not an intention.** `AMC`
sets 75 / 18 / 7 (light ground / deep accent / metal) and **enforces it in
the build, failing the release if the deep colour exceeds its share or the
warm register falls below its floor.** The reason it is measured rather
than reviewed is recorded at `AMC-EB` v0.9 and is the most instructive
design failure in the corpus: the Founder reported an estate that was
overwhelmingly blue; every screenshot showed a warm light page; **both
accounts were correct**, because the review tool defaulted to light mode
and the Founder's phone was in dark mode, where an auto-dark block mapped
every warm ground onto navy. Measured, the dark rendering was **99.2%
blue**. Two people reviewed two different websites for three rounds.

**Three binding consequences.**

1. **`prefers-color-scheme` does not switch the theme on its own.** The
   institution's light register *is* its presentation; dark is an
   accommodation a reader chooses, never a substitution made on their
   behalf. This also guarantees that what is reviewed is what is served.
2. **A colour gate measures rendered pixels in all four modes a reader can
   arrive in** — system-light, system-dark, chose-light, chose-dark.
3. **A dark theme is designed, not derived.** `AMC`'s is rebuilt warm —
   every dark paper carrying more red than blue, adjacent surfaces still
   distinguishable so the band rhythm survives.

**Contrast substitutions are part of the palette, not an exception.** Gold
on paper computes to roughly 2.3:1 — well under AA — so on light grounds
small caps and icon strokes switch to a bronze token and numerals to the
chapter's own accent (`WEC-EB Part III·b`).

## §7.5 Type: three roles, and the third is the one that matters `[OBSERVED]`

Every institution in the estate converges on a **three-role type system**,
and `AMC-DX §7` names why the third role is the highest-leverage choice
available: almost no competitor uses one.

| Role | Job | Rule |
|---|---|---|
| **Display** | Headlines, chapter titles, pull-quotes, published figures | A serif with real character. Variable optical size where the family offers it. |
| **Ceremonial capitals** | Chapter numerals, level marks, crest lockups, seals, button and label text | **Not a reading face.** No body copy, no sub-headings, no run longer than about four words — roughly forty characters on a page. Used that sparingly it says the place is old; used for a paragraph it says the place is a theme. |
| **Body** | Everything else — copy, UI chrome, labels, navigation, tables | A functional sans or text serif with a full weight range. |

**No fourth face. No rounded "friendly EdTech" sans anywhere.**

Two typographic rules the estate learned the hard way:

- **The optical-size axis matters more than the face.** A Didone's
  hairlines are what make it magnificent at 64px and illegible at 15px.
  Request the *variable* font and set `font-optical-sizing: auto`;
  requesting a static instance silently switches this off and the page
  renders in the right family and is wrong everywhere (`WEC-EB Part III`).
- **Reverse type is set lighter.** Light glyphs on a dark ground
  irradiate: the light spreads into the dark and eats thin strokes while
  stems hold, so identical weight looks under-inked on navy and correct on
  cream. Every reversed display size takes about half a weight step back.
  This is the correction letterpress printers made by hand, and it is why
  light and dark chapters read as one publication (`WEC-EB Part III`).

## §7.6 Arabic type has its own system `[OBSERVED]`

`AMC-EB §15`. Arabic roles, Arabic faces, Arabic rules — never the Latin
scale with a substituted font.

- **Any element containing tashkīl uses the teaching face wherever it
  sits**, including inside application chrome. `AMC` added this rule after
  finding vocalised Arabic inside LMS furniture with no specified face at
  all.
- **A face is specified for suitability, never for availability.** `AMC`
  v0.4 removed its ceremonial Arabic face after a peer review found that
  ruqʿah is historically an *administrative and rapid-handwriting* script,
  not a ceremonial one — it had been chosen because it was one of the few
  high-quality free display Arabic faces. **Availability masquerading as
  suitability** is the failure mode to watch for.
- **No unverified licence ships.** A face whose licence could not be
  verified is not used, however good it is.

## §7.7 Geometry and material `[OBSERVED]`

From `WEC-EB Part III`, the most precise statement of it in the estate:

**Radius is a function of size, not taste.** Perceived softness is radius
as a proportion of the shortest edge, so holding one material across every
scale means the radius climbs with the component (≈6–10%). A 4px corner on
a 600px plate reads as a square that failed; a 24px corner on a 40px badge
reads as a bubble.

**What stays square, by decision:** table cells and their rules, hairline
dividers, chapter rules, ledgers, column keylines, and the grain and
guilloché grounds. Those are the page's **architecture**. Radius belongs
to the **objects** placed on it — and where a curved object holds a square
one, the mount curves and the table does not.

**Concentricity:** an inner radius equals the outer radius minus the gap.
Get it wrong and the two arcs run at varying distances around the turn,
which the eye reads as a wobble before it can name it.

**Relief.** Light comes from above and slightly forward. A raised surface
carries a bright hairline on its top edge and a dark one along its bottom;
a recessed surface carries the reverse. **Every shadow tier is two
shadows** — a tight *contact* shadow that says the object is touching the
surface, and a wide *ambient* one that gives it mass. A single blurred
offset is what a UI kit ships, and it always reads as a sticker.

## §7.8 Light: material versus effect `[OBSERVED]`

`WEC-EB Part III` distinguishes two primitives, and the distinction is the
whole point:

- **Edge-lighting — material, applied broadly.** A gradient rim: near-white
  where the source is, falling to shadow at the opposite corner. A
  one-colour 1px border asserts that every edge of an object receives
  identical light, which is true of nothing.
- **Travelling perimeter light — effect, rationed hard.** Allowed on the
  primary call to action (slowed so it crosses once and leaves), the
  hero's own furniture, a card under the pointer, seals and awards. **Not**
  on cards at rest, list items, navigation, or anything a reader is trying
  to read past.

Both are built by masking a gradient to a 1px ring. A conic gradient
painted *without* that mask fills its box from the centre and renders a
hard pie-slice across the object's face — the defect that shipped on every
page of one project until it was found.

## §7.9 Ornament and plates are authored, never sourced `[OBSERVED]`

`WEC-EB Part III·b`: `assets/art/` is authored, no stock, no raster. The
guilloché rosette is **generated by a script** from layered hypotrochoids
— deterministic, re-runnable, diffable — and **placed once per section,
centred and masked, never tiled**, because a repeating field of identical
discs reads as wallpaper.

**Binding.** Ornament is drawn or generated, versioned in the repository,
and licensed if it is not ours. Nothing is sourced from a search engine
(`AMC-EB §44.2`).

## §7.10 One icon set, one tool `[OBSERVED]`

Drawn on one grid, at one stroke width, with one terminal and one join,
no fills — so the set reads as one engraving tool. Collecting icons from
three libraries is "the commonest way an institutional site gives itself
away as a template" (`WEC-EB Part III·b`).

Icons inherit `currentColor`, which is why the sprite is **inlined rather
than linked**: `currentColor` does not inherit across an external `<use>`
reference in several browsers.

## §7.11 Photography `[OBSERVED]`

- **The interim rule: no stock photography.** Texture and hierarchy come
  from type, colour and the component canon (`WEC-EB Part III`,
  `AMC-EB §20.5`).
- **No image may caption itself into a false claim.** No photograph is the
  institution's campus, faculty, students or graduates unless it is.
  Photographs illustrate an activity; anything that would read as an
  institutional claim stays an engraving, **because a drawing is plainly a
  drawing** (`WEC-EB Part III`).
- **Every photograph is gradient-mapped into the palette.** That treatment
  is why licensed stock from different photographers reads as one
  commission rather than a collection.
- **Consent and dignity** govern any image of a person, and of a child
  absolutely: published only within the institution's existing
  media-consent practice; the vault copy retained regardless
  (`SHRS archive-governance §3`, `AMC-EB §20.4`).
- Where an institution has an Islamic identity, its visual-asset policy —
  what may not appear, how representation is handled, the editorial
  register required, and the licensing register every file is entered in
  **before it ships** — is binding on photography, illustration and
  iconography alike.

## §7.12 Tone of voice `[OBSERVED]`

`WEC-EB Part III` states it most usefully:

- **Numbers, not superlatives.** "Six levels," "720 units," "24 months."
  Specificity reads as more credible than repeated claims of being
  world-class.
- **Ambition is stated as a vision, not as a settled fact.** "Recognised
  for excellence" is avoided in favour of what is actually true today.
- **Silence over invention.** Where data does not exist, the surface says
  so plainly, in the same visual language as everything else, rather than
  switching to an apologetic or evasive register.

And from `SX-EB Part V`: clear, active-voice, plain language by default.
No filler, no false hedging, no synthetic enthusiasm. **No emoji in
institutional copy.**
