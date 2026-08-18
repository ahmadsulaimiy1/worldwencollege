# Volume 30 — The StromeX Design Language

*The signature system. Volume 7 gives the estate's shared grammar; this
volume gives StromeX its own hand, to the value, so that it can be built
rather than admired. Where the two differ for a StromeX product, this one
governs (`SEB §31.1`).*

**Everything here is implemented in `stromex/design-system/`.** A
specification nobody implemented is a wish (`AMC-DX §16`); the tokens,
the components and the motion system in that directory are the normative
form of this volume, and this text is its reasoning.

---

## §30.1 The governing idea

> **An instrument from a more advanced era, made with the craft of the
> finest era that ever made anything by hand.**

Every decision below descends from that sentence. When a choice is
unclear, ask: *would this appear on a precision instrument that a serious
person would keep for forty years?*

Not: would this look modern. Modern is a date, and dates pass.

## §30.2 The Meridian — the structural signature

**The single most recognisable device in the language, and the reason a
StromeX page is identifiable with the mark removed.**

A **hairline runs the full height of the document**, vertically, at the
minor golden section of the content measure (38.2% from the leading
edge — left in LTR, right in RTL). It is not a decoration. It is the
spine from which the page hangs:

- **Every section marker is cut into it** — a numeral in a small notch,
  the rule broken around the glyph the way an engraver would.
- **Every heading hangs from it.** Headings align to the meridian, not to
  the page margin. This produces the asymmetry `SEB §7.2` requires,
  structurally, rather than as a layout choice made per page.
- **A light node travels it on scroll** — a 2px specular point at the
  reader's vertical centre, moving at exactly scroll rate. It is the only
  element on the page tied to scroll position, and it makes the document
  feel like an instrument being read rather than a page being scrolled.
- **It thickens at chapter boundaries** — hairline (0.5px) through a
  section, 1px at a chapter rule, and a 3px **anchor** at the document's
  head and foot.

**Below 720px the meridian moves to the leading margin at 24px** and the
content hangs from it flush. It never disappears; a phone reader gets the
same spine.

**Rationale.** Every website in the world is laid out on a centred column
or a symmetric grid. A visible structural spine at the golden section is
both instantly distinctive and functionally superior: it gives the eye a
fixed return point on a long document, which a centred column cannot.

## §30.3 The Quire — the grid

A twelve-column grid is a template, and a reader can feel one. StromeX
uses a **quire**: the folded-sheet structure of a bound book.

```
│◀── fore-edge ──▶│◀────────── measure ──────────▶│◀ gutter ▶│
│      wide       │        the reading field       │  narrow  │
                  ▲
              meridian
```

- **Asymmetric margins.** Fore-edge (outer) margin is **1.618×** the
  gutter (inner) margin. This is how every well-set book has been laid
  out for five hundred years and almost no website is.
- **The margins mirror in RTL.** Structurally, not by flipping a
  stylesheet: the fore-edge is always the outer edge.
- **The measure is capped at 34em** for running prose, regardless of
  viewport. A 1600px monitor gets a wider fore-edge, not a wider line.
- **Twelve tracks inside the measure**, but they are *tracks*, not
  columns: content spans by named role (`full`, `measure`, `wide`,
  `plate`, `marginal`), never by a number of columns. A layout expressed
  as `col-span-7` is a layout nobody can maintain.
- **The marginal track** — a 12em column in the fore-edge margin,
  carrying folios, section numerals, notes and timestamps. It is empty
  more often than not, and its emptiness is the page's air.

**Breakpoints belong to components** (`SEB §6.1.2`). The quire itself has
exactly three states: **phone** (single field, meridian at the margin),
**page** (quire, marginal track hidden), **spread** (quire, marginal
track live) at ≥1180px.

## §30.4 Stratum — the depth model

Cards do not have "elevation 1–5". Surfaces occupy a **stratum**, and each
stratum has physical meaning, a defined light response, and a defined
parallax rate.

| Stratum | What it is | Light | Parallax | Use |
|---|---|---|---|---|
| **bedrock** | The page ground itself | Receives; emits nothing | 0 | The document |
| **plinth** | Cut *into* the ground | Inverted rim: dark top, bright bottom | −0.02 | Statistics wells, quoted matter, code |
| **table** | Flush with the ground | Rim only where it meets a change of material | 0 | Tables, ledgers, running prose |
| **plate** | Raised, the primary object | Full rim, contact shadow, ambient shadow | +0.04 | Cards, panels, the primary object of a section |
| **crown** | Floating, ceremonial | Full rim, specular highlight, deep ambient | +0.09 | Seals, awards, the primary call to action, modals |

**Two rules make this read as material rather than as CSS:**

1. **Two strata may not be adjacent without a change of material.** A
   plate on a plate is a sticker. Put it on a plinth, or change the
   ground.
2. **Parallax is imperceptible per-element and cumulative per-page.** At
   these rates no single element visibly moves; the page as a whole
   acquires depth. Parallax that a reader can *see* is a gimmick;
   parallax they can only *feel* is craft. **All of it is removed under
   `prefers-reduced-motion`, resolving to the finished state.**

## §30.5 Light — one source, obeyed everywhere

**A single light source: above, and 15° forward of the reader.** Every
rim, shadow, bevel and specular in the system is computed from it. Nothing
in a StromeX product is lit from anywhere else, and that consistency is
most of why the surfaces read as one object.

- **The rim** is a gradient, never a colour. Near-white at the source
  quadrant, falling to shadow at the opposite. A 1px solid border asserts
  that every edge receives identical light, which is true of nothing.
- **Every shadow is two shadows**: a tight **contact** shadow (2px blur,
  1px offset, 22% opacity) that says the object touches, and a wide
  **ambient** (`stratum` × 8px blur, `stratum` × 3px offset, 10%) that
  gives it mass. A single blurred offset is what a UI kit ships and it
  always reads as a sticker.
- **The gilt meniscus.** Gold appears **only where a surface curves
  toward the light** — the top-left arc of a bevel, the leading edge of a
  rule, the upper rim of a seal. Gold as a fill is costume jewellery;
  gold as a meniscus on a machined edge is the real thing.
- **Specular** is permitted on `crown` only, at ≤8% and ≤6px, and it
  tracks the pointer at one-quarter rate on a fine pointer only.

## §30.6 The Register — typography

Not `h1`–`h6`. **Named institutional roles**, each with its own optical
size, tracking and reverse-weight compensation.

| Role | Purpose | Face | Size | Tracking |
|---|---|---|---|---|
| **proclamation** | The one statement a page exists to make. Once per document | Display | `clamp(3rem, 7vw, 7.5rem)` | −0.022em |
| **chapter** | Section openings | Display | `clamp(2rem, 4vw, 3.5rem)` | −0.018em |
| **article** | Sub-sections | Display | `1.75rem` | −0.012em |
| **clause** | The largest text a reader actually reads in quantity | Text | `1.0625rem` / 1.66 | 0 |
| **cartouche** | Numerals, credentials, reference numbers, level marks | Inscriptional | `0.8125rem` | **+0.18em** |
| **marginalia** | The marginal track: folios, notes, timestamps | Text | `0.75rem` | +0.04em |
| **colophon** | The document's own provenance, at its foot | Text | `0.6875rem` | +0.06em |
| **figure** | A published number, set to be read as a measurement | Display, tabular | `clamp(2.5rem, 5vw, 4.5rem)` | −0.03em |

### The three faces, and the ration on the third

Continuing the StromeX brand system already in use (`SX-EB`, the MVP's
brass/verdigris/ink and Fraunces/Archivo pairing) rather than replacing
it:

| Role | Face | Why |
|---|---|---|
| **Display** | **Fraunces** — variable, `opsz` 9–144, `wght` 100–900, `SOFT`, `WONK` | A Didone-adjacent contemporary serif with a real optical-size axis. `WONK` is set to 0 at display sizes and 1 at `proclamation` only, which gives the masthead a single idiosyncratic detail nobody else's masthead has |
| **Text** | **Archivo** — variable, `wdth` 62–125, `wght` 100–900 | A grotesque with a width axis, so table headings can be condensed *within the same family* instead of switching face |
| **Inscriptional** | **A cut Roman capital** for `cartouche` only | See the ration below |
| **Arabic** | **Amiri** (teaching and ceremonial), **Cairo** (UI) | `SEB §7.6` governs in full. Any element containing tashkīl uses the teaching face wherever it sits |

**The ration on the inscriptional face is absolute.** Numerals, level
marks, reference numbers, crest lockups, button labels. **No body copy,
no sub-headings, no navigation, no run longer than four words, and no more
than roughly forty characters on a page.** Used that sparingly it says the
institution is old; used for a paragraph it says the institution is a
theme.

### Two corrections the system applies automatically

- **Optical sizing is on.** `font-optical-sizing: auto`, and the variable
  font is requested as a variable font. A static instance silently
  disables this and the page renders in the right family and is wrong
  everywhere.
- **Reverse type is set lighter.** Light glyphs on a dark ground
  irradiate: identical weight looks under-inked on obsidian and correct
  on platinum. Every reversed display size takes **half a weight step
  back**, applied by the token, not by hand.

## §30.7 Colour — Obsidian, Platinum, Aurum

Continuous with the existing StromeX ink/brass/verdigris system, extended
to a full instrument palette. **A colour earns its place by carrying a
meaning, never by adding variety** (`SEB §7.4`).

| Group | Token | Value | Role |
|---|---|---|---|
| **Grounds** | `--obsidian` | `#0B0C10` | The page floor. Near-black with a faint violet cast, so it reads as depth rather than as absence |
| | `--ink` | `#12141B` | The primary dark ground |
| | `--graphite` | `#1B1E27` | Lifted dark surfaces — `plate` on dark |
| | `--slate` | `#2A2E3A` | Rules and dividers on dark |
| **Light grounds** | `--alabaster` | `#F6F4EF` | The primary light ground. Warm, never blue-white |
| | `--platinum` | `#EAE7DF` | Lifted light surfaces |
| | `--pewter` | `#D6D2C8` | Rules on light |
| **Metal** | `--aurum` | `#C8A24C` | The single metal. Hairlines, meniscus, seals |
| | `--aurum-lit` | `#E8CE8C` | The meniscus highlight and headings on dark |
| | `--brass` | `#9A7B3A` | The pressed state, and **small text on light grounds** |
| **Signal** | `--verdigris` | `#2E6F6A` | Confirmation, verification, "this is genuine" |
| | `--carnelian` | `#8E2F35` | Attention. Never a large fill, never an error colour by itself |
| | `--lapis` | `#2A4A8C` | Interactive, links, focus |

### Three binding rules

1. **Gold is never small text on a light ground.** It computes to ≈2.3:1
   — well under AA. On `--alabaster` / `--platinum` / `--pewter`, small
   caps and icon strokes switch to `--brass` and numerals to the section
   accent. The token does this; a designer never has to remember it.
2. **Proportion is measured, not intended.** The rendered-pixel budget is
   **ground ≈78% · metal ≈7% · signal ≤3%**, with the remainder type and
   rules. It is enforced in the build and the build fails outside it
   (`SEB §7.4`).
3. **`prefers-color-scheme` does not switch the theme.** The register a
   product commits to *is* its presentation; the other is an
   accommodation the reader chooses. This also guarantees that what is
   reviewed is what is served — the failure that once had a Founder and a
   reviewer looking at two different websites for three rounds.

**Contrast is computed from the shipped stylesheet on every build**, on
every ground, and the build fails below AA. Not asserted in a document.

## §30.8 Geometry — bevel, chamfer, concentricity

- **Radius is a function of size**, not taste: ≈6–10% of the shortest
  edge, so one material holds across every scale. A 4px corner on a 600px
  plate reads as a square that failed; a 24px corner on a 40px badge
  reads as a bubble.
- **Architecture stays square.** Table cells and their rules, hairline
  dividers, chapter rules, the meridian, the ledger, column keylines, the
  guilloché ground. Radius belongs to the **objects** placed on the
  architecture — and where a curved object holds a square one, the mount
  curves and the table does not.
- **Concentricity is enforced**: inner radius = outer radius − gap. Get it
  wrong and the two arcs run at varying distances around the turn, which
  the eye reads as a wobble before it can name it.
- **The chamfer** — the StromeX-specific move. `crown` surfaces carry a
  **1.5px chamfered edge at 45°**, catching the gilt meniscus on the
  light quadrant and shadow on the other. It is the single detail that
  makes a panel read as machined rather than drawn, and it is why a
  StromeX modal does not look like anyone else's modal.

## §30.9 The Chronograph — motion

**Everything in a StromeX product moves on one movement**, like the
complications of a single watch. Nothing animates off-beat.

**Base beat: 240ms.** Permitted durations are its multiples only:

| Name | ms | Use |
|---|---|---|
| `tick` | 30 | Pointer response, focus ring |
| `beat/4` | 60 | Hover, small state change |
| `beat/2` | 120 | Toggle, tooltip, tab |
| `beat` | **240** | The default. Panels, cards, menus |
| `beat×2` | 480 | Page-level transitions, plates entering |
| `beat×4` | 960 | Chapter reveals, the press |
| `beat×8` | 1920 | Ambient only — the meridian node, the ground |

**Four authored curves, and no others:**

| Curve | Bezier | Character |
|---|---|---|
| `sovereign` | `cubic-bezier(.16,1,.3,1)` | The default. Decisive out, long settle |
| `escapement` | `cubic-bezier(.83,0,.17,1)` | Symmetric. Reversible state |
| `descent` | `cubic-bezier(.32,0,.67,0)` | Entering. Accelerates in |
| `release` | `cubic-bezier(.33,1,.68,1)` | Leaving. Never bounces |

**No spring. No bounce. No overshoot.** A precision instrument does not
overshoot; overshoot is how a toy signals that it is a toy.

### What motion is for

**Draw · reveal · respond.** There is an explicit fourth category —
*decorate* — **and it does not exist**.

Two rules protect the reader, unconditionally:

1. **Nothing moves that the reader did not cause or scroll to.**
2. **`prefers-reduced-motion` is total, and every carve-out resolves to
   the FINISHED state**, never the hidden one. An entrance animation
   merely disabled leaves an element at `opacity: 0`, which for a reader
   with vestibular sensitivity is not a calmer page but a blank one.

**Counters animate only over real, sourced numbers.**

## §30.10 The signature components

The closed vocabulary. Every section of every StromeX surface is built
from these; a section that needs something else is a **proposal to extend
the canon**, argued and recorded — not a one-off.

| # | Component | What it is | What it replaces |
|---|---|---|---|
| 1 | **Lintel** | The header. A structural span carrying the meridian's capital and the mark. On scroll it does not shrink — it **condenses into a Keystone**: the mark alone in a chamfered trapezoid at the meridian | The sticky nav bar |
| 2 | **Keystone** | The condensed Lintel. Also the mobile menu trigger | The hamburger |
| 3 | **Colophon** | The footer. A printed-book colophon: mark, the document's provenance, build id, date, and the institution's own calendar. Set small, set well | The link-farm footer |
| 4 | **Plate** | The card. An intaglio plate: deep ground, engraved border, content tipped in, concentric bevel | The card |
| 5 | **Ledger** | The table. Hairline / chapter rule / double-rule-closes-a-total hierarchy, tabular figures, no zebra striping | The striped data table |
| 6 | **Cartouche** | A framed enclosure for a number, a reference, a credential | The badge, the pill |
| 7 | **Seal** | A ceremonial mark, pressed once, at a threshold | The logo, repeated |
| 8 | **Rail** | The chapter rail: a generated index of `[data-chapter]` sections, hung on the meridian, inverting over light chapters | The sidebar nav |
| 9 | **Dotlist** | A dot-leader index — `01 Item ······ value` | The icon-and-heading feature grid |
| 10 | **Figure rail** | Statistics on hairline dividers, set as measurements | The marketing badge row |
| 11 | **Quad** | One field divided, not four cards in a row | Four cards in a row |
| 12 | **Pledge** | A commitment block, each with its falsifiability clause | The "why choose us" tick list |
| 13 | **Path** | A journey, drawn as a route with stations | The numbered-circle process graphic |
| 14 | **Press** | The loading state. A plate descends, contacts, lifts, and the content is **printed**. Timed `beat×4` | The spinner, the skeleton |
| 15 | **Astrolabe** | Radial instrumentation for proportion and progress | The pie chart, the donut |
| 16 | **Illum** | A ceremonial frame for a threshold moment | The gradient hero |
| 17 | **Watermark** | The mark, once per page, at low opacity, on the single dark band | The background image |
| 18 | **Letter** | A signed statement. **Ships built and empty until a real person signs it** | The testimonial |
| 19 | **Register menu** | One level deep, opening as a plate on a plinth | The mega-menu |
| 20 | **Docket** | A document card: version, status, authority, date | The PDF link |

**Gate G1 rejects any section not built from this list.**

## §30.11 The ground — a live guilloché

`assets/art/` is **authored, never sourced**. No stock vectors, no raster
ornament.

The **guilloché** — a banknote rosette generated from layered
hypotrochoids by a script, so it is deterministic, re-runnable and
diffable. It is:

- **Placed once per section, centred, masked.** Never tiled — a repeating
  field of identical discs reads as wallpaper.
- **Live at 0.5% amplitude.** The rosette's phase advances with pointer
  distance at a rate no reader can consciously see. The page is
  imperceptibly alive; nothing on it is visibly moving. Removed entirely
  under reduced motion.
- **Cut, not drawn.** The plate frame is deep ground **on every register,
  including the light ones** — a dark plate inset into a cream page is
  what a tipped-in intaglio plate looks like in a printed book. Gold line
  art at 1px disappears on a light ground; this is why.

**Never a conic or radial gradient painted without a ring mask.** It fills
its box from the centre and renders a hard pie-slice across the object's
face — a defect that once shipped on every page of a project until it was
found.

## §30.12 The Burin — iconography

One set. **One grid (24×24), one stroke (1.25px), square terminals,
mitred joins, no fills.** So the set reads as one engraving tool rather
than as icons collected from three libraries — which is the commonest way
a site gives itself away as a template.

Icons inherit `currentColor`, which is why the sprite is **inlined rather
than linked**: `currentColor` does not inherit across an external `<use>`
in several browsers.

**An icon is never decoration.** It appears where it carries information a
word cannot carry faster.

## §30.13 The Strike — sound

Rationed harder than anything else in the system.

- **One sound**: a struck-metal tone, ~1.2kHz fundamental, 180ms decay,
  at **−34 LUFS**. It marks *completion of a consequential act* — a
  certificate issued, a payment settled, a deployment verified. Nothing
  else.
- **Off by default.** Enabled only by an explicit preference, and never
  played when `prefers-reduced-motion` is set, until a dedicated sound
  preference exists.
- **Never on hover, navigation, notification, error or arrival.**

A product with a sound for everything has a sound for nothing.

## §30.14 Voice, and the Anti-AI register

**No editorial scaffolding on any public surface** (`SEB §29.9`).

**And no AI register anywhere.** The fingerprint is specific and
enforceable:

| Rejected | Why |
|---|---|
| "delve", "leverage", "robust", "seamless", "cutting-edge", "in today's fast-paced world", "unlock", "elevate", "game-changing", "navigate the complexities of" | Corpus tells |
| "It's not just X — it's Y" | The single most recognisable AI construction |
| Tricolon in every paragraph | Rhythm tell |
| A closing paragraph that restates the opening | Structural tell |
| An em-dash in every third sentence | Punctuation tell |
| "Whether you're a X or a Y…" | Opening tell |
| Emoji in institutional copy | Register failure |
| Bulleted lists where prose would carry the argument | Thinking tell |
| Superlatives without a number | Credibility failure |

**Positive standard**, inherited and made binding:

- **Numbers, not superlatives.** "Six levels, 720 units, 24 months" is
  more credible than any adjective.
- **Ambition stated as a vision, never as a settled fact.**
- **Sentences of varying length**, with at least one that is short.
- **Every claim carries a number, a date, or a source** — or it is cut.

### The vetting gate

**No copy reaches a public surface without passing the anti-generic
vetting pass.** It runs the register above as a checklist, and — where the
council is available (`SEB §32`) — takes an independent read from a second
model with one instruction: *identify every sentence that reads as
machine-written, and say why.* Findings are numbered and each is fixed or
argued. This is a gate, not a suggestion.

## §30.15 Accessibility is part of the luxury

Not a compliance overlay. **The most expensive products in the world are
the ones that work for everyone**, and a beautiful interface a person
cannot use is not beautiful.

- **WCAG 2.1 AA is the floor**, computed from the shipped stylesheet on
  every build, on every ground, in every register.
- **Every interactive target ≥44×44px**; inline links in running prose
  are the only exception.
- **A page never scrolls horizontally**, at any supported width, in any
  language. Absolute.
- **Nothing is hidden by being positioned off the inline axis.** An
  element at `-9999px` is still laid out, still contributes width, and in
  RTL shifts the scroll origin so Arabic lines clip at their start.
- **Focus is a designed state**: a 2px `--lapis` ring, offset 3px, with
  the gilt meniscus on the light quadrant. It is one of the best-looking
  states in the system, on purpose.
- **The rendered gate**: a real browser at 320, 360, 375, 390, 414, 768,
  1180 and 1600px, on every page, in every language, every release.

> **A visual claim that is not measured in a renderer is not a claim this
> institution makes.**

## §30.16 Certificates, transcripts and the registrar are flagship artefacts

**The registrar ecosystem is a flagship product, not an admin module**
(`SEB §12`, `SEB §14`).

- A certificate is **a security document before it is a beautiful one**.
  Ground pattern, cartouche, engraved border and press specification exist
  to make forgery expensive. Changes to them are security changes.
- **A frozen master is frozen.** A certificate issued in 2026 and one
  issued in 2036 must be recognisably the same instrument.
- The **verification page a stranger lands on from a QR code is a
  flagship surface**, not a utility page. It is the single screen most
  likely to be seen by someone who has never heard of the institution,
  and it must be the most confidence-inspiring thing they have seen that
  week. Three states, set with equal care: **genuine · revoked ·
  superseded** — plus *not found*, which is honest and is designed, not
  bare.
- The **certificate machine** — the issuance surface staff use — is held
  to `SEB §29.5`: the people who operate an institution are the people
  whose confidence in it matters most.

## §30.17 The gates

Nothing ships without all seven, recorded. This supersedes `SEB §3.12`
for StromeX products by adding G7.

| Gate | Test | Owner |
|---|---|---|
| **G1 · Vocabulary** | Every section built from the §30.10 canon. A generic card grid fails | Design Authority |
| **G2 · Space** | The quire's minimums; the half-empty rule; asymmetry present | Design Authority |
| **G3 · Proportion** | Rendered-pixel measurement inside the §30.7 budget, in all four modes a reader can arrive in | Build |
| **G4 · Removal** | Cover the mark, the seal and the name. Do seven of ten readers still identify it as StromeX? | Design Authority |
| **G5 · Persona** | Walk every named reader. Record *gets / doesn't get / verdict* | Product |
| **G6 · Truth** | Every fact real and dated; no unearned inference; disclosure obligations met in the register | Editorial + Legal |
| **G7 · Register** | The anti-AI vetting pass (§30.14), and the technical gates: contrast computed, motion beat-aligned, responsive gate green in every language | Editorial + Build |

## §30.18 What this volume is not

It is not a mood board and it is not a preference. Every value in it is a
number, a token or a rule that a build can check, and the ones that can be
checked **are** checked. A design system whose rules live only in a
document is a document.

---

## §30.19 The implementation, and what building it changed

**Normative form: `stromex/design-system/`.** Built 2026-08-18. Four
gates green, forty-one unit tests passing, every component in §30.10
rendered in `showcase/index.html`.

Building it changed the language in seven places. Each is recorded here
rather than quietly corrected in the code, because a constitution that
diverges from its implementation is a constitution nobody consults.

### §30.19.1 The Meridian is a grid line, not a percentage

**§30.2 said the minor golden section. It now says the fold.**

Placed at `38.2%` of the viewport, on a 1440px display the spine falls at
550px while the measure runs 333–877. The signature ran through the
running text and the chapter rail hung on it landed on every heading on
the page.

The spine of a folded sheet is not a fraction of the reader's window — it
is the line where the margin ends and the text begins. The Meridian is
now placed on the Quire's own `marginal / measure` boundary, shared with
the grid through a single custom property, so the two cannot drift.

This also retires §30.2's separate rule for phones. Below the spread the
marginal track is 0px wide, so the same line *is* the leading margin —
1.618 × the gutter, derived rather than chosen.

### §30.19.2 Signal colour is a role, not a pigment

**§30.7 gains a fourth binding rule.**

Measured on obsidian, the three signal pigments compute to:

| | | |
|---|---|---|
| `--sx-verdigris` | 3.35:1 | *confirmed* was not readable |
| `--sx-carnelian` | 2.43:1 | **error messages** were not readable |
| `--sx-lapis` | 2.29:1 | **the focus ring** was nearly invisible |

The third is the serious one: a focus indicator at 2.29:1 is one a
keyboard reader cannot find, on every page of the product, in the register
the product is presented in. It survived four readings of the palette and
failed `gates/contrast.mjs` on its first run.

**Rule 4:** a signal colour is referenced through its **role** —
`--sx-signal-verified`, `--sx-signal-attention`,
`--sx-signal-interactive` — which resolves per register. The pigments
remain the institution's colours and are never used as a foreground. The
same rule §30.7 already applied to gold now applies to all three.

### §30.19.3 A rule that separates and a rule that identifies are two things

A hairline between two ledger rows is decoration: the rows are identified
by their content, and WCAG SC 1.4.11 does not reach it. **The rim of a
text field is the only thing that says "this is where you type"** — a
user-interface component boundary, which owes 3:1 and did not have it.

`--sx-rule` separates. `--sx-boundary` identifies. Anything that
identifies a control, a state, or a graphical object required to read an
instrument uses the second.

### §30.19.4 RTL: centring is physical

§30.3 says RTL is structural, not a flipped stylesheet, and the
implementation found the sharpest version of that: `inset-inline-start:
50%` anchors an element's *leading* edge at the centre, and
`translate: -50%` always moves it left. In LTR the two compose into a
centred element; in RTL they compose into an element hanging half its
width off the page.

It also found the opposite error. CSS Grid already lays its tracks along
the inline axis, so a hand-reversed RTL track list **flips a grid the
writing mode has already flipped**. The geometry is written once, in
logical order, and the writing mode turns it.

### §30.19.5 The ornament is sampled per lobe

§30.11's guilloché closes after `lcm(R, r) / R` turns. Sampling per turn
is the obvious implementation and it is wrong twice: a figure closing in
seven turns gets seven times the points of one closing in one, and the
resolution a reader perceives is set by the lobe, not the revolution. The
first generator emitted a **2.1MB** background ornament. Per lobe, at
forty-eight samples, the same figure is 82kB.

### §30.19.6 The gates gained a fourth, and an escape hatch

§30.17's G7 is implemented as four executable gates — `tokens`, `beat`,
`contrast`, `responsive` — and `responsive` runs in a real browser at
seven widths and in both directions.

A line carrying `/* sx-gate-allow: <gate> — reason */` is skipped by that
gate **and printed, with its reason, on every run**. An exemption nobody
sees is a rule nobody keeps: the first is argued, the tenth is copied, and
after that nobody can find them.

### §30.19.7 A gate is not trustworthy until it has been watched to fail

`test/gates.test.mjs` injects each defect a gate exists to catch and
asserts the gate exits non-zero and names it. It immediately found that
the declaration scanner was **silently skipping every single-line rule** —
most of `components.css` — while reporting a four-figure check count and a
green tick.

**This is now a standing requirement.** No gate in the StromeX estate is
considered to exist until something has watched it fail on purpose.
