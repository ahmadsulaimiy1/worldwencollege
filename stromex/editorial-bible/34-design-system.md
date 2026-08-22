# Volume 34 — The StromeX Design System

*Surface by surface, state by state, device by device. Volume 30 is the
**language** — the Meridian, the Quire, Stratum, the Chronograph, the
Register. This volume is the **system**: what every surface class in a
StromeX product is made of, specified so it can be built rather than
interpreted.*

**Normative form:** `stromex/design-system/`. A specification nobody
implemented is a wish.

---

## §34.1 The component contract

**Nothing enters the system without all eight.** A component missing any
one of them is a prototype, not a component.

| # | | |
|---|---|---|
| **1** | **A name from the canon** | Named against the convention it replaces (`SEB §30.10`). A component that replaces nothing is decoration |
| **2** | **An anatomy** | Every part named, so two engineers describe it the same way |
| **3** | **A stratum** | Which layer it occupies, and therefore how it responds to light (`SEB §30.4`) |
| **4** | **A full state set** | rest · hover · focus-visible · active · selected · disabled · loading · empty · error. **Nine.** A component with three is three-ninths built |
| **5** | **Motion on the beat** | Every transition a Chronograph multiple, with a named curve (`SEB §30.9`) |
| **6** | **An accessible contract** | Role, accessible name, keyboard model, focus order, live-region behaviour |
| **7** | **RTL behaviour** | Structural, tested in a renderer. Not a flipped stylesheet |
| **8** | **A print form** | Or an explicit statement that it does not print (`SEB §34.10`) |

## §34.2 Materials — and the ration on glass

Five materials. Nothing in a StromeX product is made of anything else.

| Material | What it is | Where |
|---|---|---|
| **Paper** | The warm light ground. Matte, no gloss, faint tooth in the guilloché | The reading register |
| **Obsidian** | The dark ground. Depth, not absence — a faint violet cast so it reads as volume | The ceremonial register, dashboards, the hero |
| **Machined metal** | Rims, rules, bevels, the chamfer, the meniscus | Every edge in the system |
| **Optical glass** | A *refracting* surface: it bends what is behind it, it does not smear it | Rationed — see below |
| **Engraved plate** | Deep ground with cut line art, tipped into the page | Ornament, seals, chapter plates |

### The glass ration

**Glassmorphism is in the Anti-Generic Register** (`SEB §29.6`) — a
blurred translucent panel is the single most dated surface of the 2020s.
Optical glass is permitted, and the distinction is exact:

| Permitted — optical glass | Rejected — glassmorphism |
|---|---|
| **Refraction**: a slight scale and offset of what is behind, so the panel reads as a lens | **Blur alone**, which reads as frosted plastic |
| **Chromatic edge**: ≤1px of dispersion at the rim only | Uniform milky white overlay |
| **A caustic**: one bright arc where light passes the thick edge | A gradient fade to nothing |
| Backdrop-blur **≤ 12px** with a ≥0.72 opacity ground behind it | 40px blur over anything |
| Used on **crown only**, and at most **one glass surface per viewport** | Glass on cards, on nav, on everything |

**The test:** if it looks like frosted plastic, it is wrong. If it looks
like a piece of ground optical glass sitting a millimetre above the page,
it is right.

## §34.3 The Plate — cards

**Anatomy:** `plate` › `bevel` › `ground` › `eyebrow` · `body` · `figure`
· `foot` · `seal-slot`.

- **Stratum `plate`.** Full rim, contact shadow at 2px/1px/22%, ambient at
  32px/12px/10%. Never two plates adjacent — put one on a `plinth` or
  change the ground (`SEB §30.4`).
- **The bevel is concentric**: inner radius = outer − gap, so the arcs run
  parallel around the turn. The gilt meniscus sits on the top-left arc
  only.
- **The eyebrow is a module marker** — `02 · Programme` — not a category
  chip.
- **The figure**, where present, is set in the `figure` role with tabular
  numerals, and it is the visual anchor. A card whose largest element is
  its heading has buried its point.
- **Hover** raises to `crown` over `beat/4` on `sovereign`, and the
  meniscus travels the perimeter **once** and stops. A perimeter that
  keeps moving is a casino; one that lights when you arrive is a
  threshold.
- **A card is never a link with everything inside it clickable.** One
  primary target, named, plus any secondary targets as real controls.

**Three plate variants, and no more:** `plate` (default),
`plate--figure` (a published number), `plate--document` (the Docket:
version, status, authority, date).

## §34.4 The Ledger — tables

The estate's oldest signature, specified fully.

- **No zebra striping.** Alternating fills are a crutch for rows that are
  too tall. Set the row height to `1.5 × line-height` and let the hairline
  do the work.
- **Three rule weights, and they mean things:** hairline `0.5px --pewter`
  between rows; `1px` beneath the head; **a double rule closes a total**,
  exactly as a ledger does. Nobody else does the third one and it is
  instantly recognisable.
- **Numerals are tabular and right-aligned**; text is left-aligned (start-
  aligned in RTL); the decimal aligns on the decimal.
- **The head is condensed**, not smaller: `Archivo` at `wdth 82`, uppercase,
  `+0.1em`. Shrinking a heading to fit is what a spreadsheet does.
- **Sort is a state on the column, not an icon that appears on hover.** The
  active column's head carries the meniscus.
- **Row selection** raises the row to `table`+1 with a 2px leading marker
  in `--lapis`. No checkbox column unless multi-select is real.
- **Sticky head, and the sticky head is the only sticky element permitted
  besides the Lintel.**
- **Overflow scrolls inside its own container**, never the page
  (`SEB §30.15`).
- **Below 720px a ledger becomes a stack of `plate--document`**, one per
  row, with the head's labels inline. It does not become a horizontally
  scrolling table, which is unusable on a phone with one hand.
- **Empty, loading and error states are ledger-shaped**, not a centred
  message in an empty box (`SEB §34.11`).

## §34.5 Forms — the Instrument

A StromeX form is an **instrument panel**: labelled, calibrated,
predictable.

| Rule | |
|---|---|
| **Labels sit above, always** | Placeholder-as-label fails the moment a value is entered, and fails screen readers permanently |
| **The field is a `plinth`** | Cut *into* the ground: inverted rim, dark top edge. This is why a StromeX field reads as machined rather than as a box |
| **Focus is designed** | 2px `--lapis` ring at 3px offset, plus the meniscus on the light quadrant. One of the best-looking states in the system, on purpose |
| **Validation is on blur, never on keystroke** | Validating while a person types tells them they are wrong before they have finished being right |
| **The error message replaces the hint**, in place, in `--carnelian`, with the field rim inverted | It never appears above the form, and never as a toast |
| **Required is marked; optional is not** | Marking optional fields implies the rest are compulsory even where they are not |
| **One column.** Ever. | A two-column form has an ambiguous tab order and no reader agrees on which way to read it |
| **Submit is a `crown`** | The only crown on the page. Disabled until valid **is forbidden** — it hides why. Enabled, and it reports what is wrong |
| **Progress is a Path** (`SEB §30.10`), never a bar | A multi-step form shows the whole journey, with the current station lit |
| **Autosave states are visible** | *saved · saving · unsaved · failed*, in the marginal track, set in `marginalia` |

**Destructive confirmation** never uses a red button and a modal alone. It
requires the resource's **name typed back**, exactly as the MCP's approval
model does (`SEB §26.5`) — the estate's own rule, at the interface.

## §34.6 Search — the Index

Not a magnifying-glass box in a header.

- **Invoked by `/` and by `⌘K`/`Ctrl-K`**, and by the Lintel's index mark.
- **Opens as a `crown` plate on a dimmed `plinth`**, at the Meridian,
  occupying the measure — not full-screen, and never a dropdown pinned to
  a header.
- **Results are a Ledger**, not a list of cards: type · title · context ·
  the matched fragment, with the match set in `--aurum-lit`.
- **Grouped by kind, ordered by consequence**, and the group headings are
  `cartouche`.
- **The empty state carries the three most useful things you could ask
  for**, not "no results".
- **Keyboard-complete:** ↑↓ move, ↵ opens, ⌘↵ opens in a new context, Esc
  closes and restores focus to the invoker. **Focus restoration is not
  optional** — losing focus on close strands a keyboard user.
- **Debounce is one `beat/2`.** Results animate in on `release`; they never
  reflow under the pointer.

## §34.7 Navigation — Lintel, Keystone, Rail, Register menu

- **The Lintel** spans the page as a structural member carrying the
  Meridian's capital. On scroll past 90px it **condenses into the
  Keystone** — the mark alone in a chamfered trapezoid at the Meridian —
  over `beat` on `escapement`, **with 40px of hysteresis** so a trackpad
  overscroll cannot make it flicker.
- **The Register menu** opens as a `crown` plate on a `plinth`, **one
  level deep**. A mega-menu deeper than one level is in the register of
  rejected conventions.
- **The Rail** is generated from `[data-chapter]` sections, so it cannot
  fall out of step with the page, and it inverts over light chapters.
- **The Colophon** is the footer: the mark, the document's provenance, the
  build id, the date, the institution's own calendar. Set small, set well.
  It is a colophon, not a sitemap.
- **Mobile navigation is not a drawer parked off-canvas.** An element at
  `translateX(100%)` is still laid out, still contributes width, and in
  RTL shifts the scroll origin so Arabic clips at its start. It is
  `display: none` until opened, then a full `crown` sheet rising on
  `descent`.

## §34.8 Dashboards — the Console

The surface most likely to be built badly, because it is the surface where
"just add another card" is always available.

**The four zones, in this order down the page:**

| Zone | | |
|---|---|---|
| **1 · The Assay** | Three to five figures, no more. Each is a `figure` on a `plinth`, with its **as-of timestamp** in `marginalia` | A number without a timestamp is a rumour |
| **2 · The Attention** | What needs a person, ordered by consequence. **Empty is the good state and it is designed to look like success**, not like a blank | Most dashboards bury this under charts |
| **3 · The Instruments** | Charts, at most three, each answering one named question written above it | A chart without a question is decoration |
| **4 · The Ledger** | The record, filterable, exportable | |

**Rules:**

- **No widget grid, no drag-to-rearrange.** A layout every user rearranges
  is a layout nobody designed. If two audiences need two dashboards, build
  two.
- **Density is a setting, not a default argument.** `comfortable` ·
  `compact` — two only, and both are designed, not one squeezed.
- **Refresh is explicit** with a visible timestamp. **Nothing auto-refreshes
  under the reader's eyes**; a number that changes while being read is
  worse than a stale one.
- **Every figure links to the rows behind it.** A figure a person cannot
  drill into is a figure they cannot trust.
- **A dashboard is not a report** (`SEB §34.10`).

## §34.9 Data visualisation — the Instruments

A closed set. **Six instruments, and a chart type not on this list is a
proposal to extend the canon, argued and recorded.**

| Instrument | For | Replaces |
|---|---|---|
| **Astrolabe** | Proportion of a whole, and progress toward a target | The pie and donut chart |
| **Meridian series** | A quantity over time, drawn as a single hairline with the value at the reader's pointer in the marginal track | The line chart with a legend |
| **Ledger bars** | Comparison across categories, drawn as rules extending from the ledger's own baseline | The bar chart |
| **Strata** | Composition over time | The stacked area chart |
| **Field** | Distribution, drawn as a scatter with a hairline density contour | The heatmap |
| **Gauge** | One value against one threshold | The KPI card with an arrow |

**Binding rules for all six:**

- **Colour encodes meaning, never identity.** A series is distinguished by
  weight, dash and position before it is distinguished by hue. Then hue,
  from the signal set only, and never more than three hues in one
  instrument.
- **No legend where a direct label will fit.** Label the line at its end.
  A legend is a lookup table the reader has to hold in their head.
- **No gridlines.** A single baseline rule and value labels at the
  extremes. Gridlines are a substitute for correct scale choice.
- **Axes start at zero for any length-encoded quantity.** Non-zero
  baselines are permitted only for position-encoded series, and the break
  is drawn.
- **Every instrument states its source and its as-of date** beneath it, in
  `colophon`.
- **Counters and draw-on animate only over real, sourced numbers**, once,
  on first reveal, on `beat×2`. Never on re-render.
- **Accessible twin, always:** every instrument has a `<table>` twin that
  is the actual data, available to screen readers and by a control. **The
  chart is a rendering of the table, not a substitute for it.**

## §34.10 Reports and printing

**A report is a document, not a screenshot of a dashboard.** It has a
title page, a colophon, page numbers, a table of contents past four
pages, and it is the same document whether it is read on screen, printed,
or exported.

- **One structured source renders every format** — web, PDF, print,
  presentation — without content re-entry (`SEB §13.5`).
- **Print is designed, not `@media print { * { color: black } }`:**
  - the light register, always, whatever the reader chose on screen;
  - the Meridian becomes a printed rule; the marginal track becomes real
    margin notes;
  - `figure` set at 60% of screen size, because paper is closer to the eye;
  - **no orphans, no widows**, `break-inside: avoid` on every Plate,
    Ledger row group and figure;
  - every URL that matters printed as text beside its link;
  - a **folio** on every page: `institution · document · page n of m ·
    generated <date>`;
  - **QR to the live version** in the colophon, so a printed page is never
    the last word.
- **Exports carry provenance**: who generated it, when, from which data as
  of when. A spreadsheet with no provenance becomes a fact nobody can
  date.

## §34.11 The state family

**Nine states per component** (`SEB §34.1`). Five of them are surfaces in
their own right and are specified here.

### Loading — the Press

**No spinners. No skeletons.** A skeleton is a lie about layout that
resolves into a different layout.

The **Press**: a plate descends on `descent`, contacts at `beat×2`, and
the content is *printed* into place — content resolves at the moment of
contact. Timed `beat×4` total.

- **Under 240ms: show nothing.** A flash of loading state is worse than a
  pause.
- **240ms–2s: the Press.**
- **Over 2s: the Press plus a named operation** — "Reading the register",
  not "Loading…" — and, past 8s, what to do if it does not finish.
- **Optimistic where the operation is reversible**, never where it is not.

### Empty

**Designed, never bare.** Three parts: what would be here · why it is not ·
the one action that would fill it. Set in the component's own shape — an
empty Ledger is a Ledger with its head and one explanatory row, not a
centred paragraph in a void.

**An empty state that is the good state says so.** An empty Attention zone
on a dashboard is a small `--verdigris` seal and the words *nothing needs
you*. It should feel like an achievement, because it is one.

### Success

- **Inline and adjacent to the thing that succeeded**, never a toast that
  moves away from where the person is looking.
- A `--verdigris` meniscus travels the affected element once, on
  `beat`.
- **Consequential acts** — a certificate issued, a payment settled, a
  deployment verified — get the Seal pressed, and are the only place the
  Strike may sound (`SEB §30.13`).
- **Never a modal.** A modal to say "done" makes the person do work to
  acknowledge that their work is done.

### Error

**The estate has already paid for getting this wrong**: an admin page
mapped every 403 to "you do not have staff access", so a staff member
refused for a different reason was told they were not staff and went
asking for access they already had.

| Rule | |
|---|---|
| **Name the rule that refused, not the status code** | Two refusals sharing a code mean two different things, and only the page knows which |
| **Never show a server's own error vocabulary** to a reader | |
| **Every error carries what to do next** | An error that cannot say what to do next is not finished being written |
| **Field errors stay at the field**; page errors sit at the Meridian above the content; system errors are a `crown` | |
| **An error is never red-on-red.** `--carnelian` on the field rim and the message, never as a fill | |
| **Recoverable errors keep the person's input.** Always. | Losing typed work to a validation failure is the cruellest thing an interface does |

### Notifications

- **Three tiers:** *ambient* (the marginal track, no interruption) ·
  *attention* (the Attention zone, waits) · *interrupt* (a `crown`,
  reserved for something the reader must act on before continuing).
- **Interrupt is rationed to genuine consequence.** Fewer than one a week
  per person, or the tier is being misused.
- **Nothing auto-dismisses that carried information.** A toast that
  vanishes is information the person may have needed.
- **No badge counts on anything a person cannot clear.**
- **No engagement-bait notifications, ever** (`SEB §6.5`).

## §34.12 AI interactions

StromeX products contain AI. It is bound by `SEB §16`, and this is how it
looks and behaves.

- **Disclosed on first interaction. Always.** It never impersonates a
  member of staff or an office. Its surface is visually distinct: the
  `--teal` accent, the `i-waveform` mark, and a `plinth` rather than a
  `plate` — it sits *in* the page, not *on* it.
- **Streaming is real, and the state is legible:** *thinking · retrieving ·
  answering · done*, each named. Never a bouncing-dots animation, which
  tells the reader nothing for as long as it runs.
- **Citations are inline and checkable**, in `cartouche`, resolving to a
  real source. **A fabricated citation is worse than none** — the system
  says it could not find one.
- **Confidence is shown where it matters** and is honest: retrieved ·
  inferred ·　uncertain, marked, not hedged in prose.
- **A refusal is a designed state.** Where the system will not answer — a
  religious ruling, a safeguarding disclosure, a legal or medical
  conclusion — it says so plainly and routes to a **named human**,
  immediately (`SEB §16.5`).
- **Every AI answer is interruptible and every one is copyable**, with its
  sources.
- **Nothing an AI produced is presented as institutional record** without
  a person's approval passing through the same approval engine as any
  other institutional act.

## §34.13 Devices

| Class | Width | What changes |
|---|---|---|
| **Phone** | 320–719 | Single field; the Meridian moves to the leading margin at 24px; the Ledger becomes a stack; navigation is a rising sheet; the marginal track collapses into inline `marginalia` |
| **Tablet, portrait** | 720–1023 | The Quire appears; the marginal track is still hidden; touch targets stay at 44px; **hover states do not exist** and every hover-revealed affordance has a persistent equivalent |
| **Tablet, landscape / small desktop** | 1024–1179 | Quire, marginal track hidden, pointer-fine states available |
| **Desktop** | 1180–1599 | **The spread**: full Quire with the live marginal track |
| **Large display** | 1600+ | The measure does **not** grow. The fore-edge grows. A 34em measure at 2560px with vast margins is what a well-set book does and what almost no website does |

**Binding across all five:** the page never scrolls horizontally; every
target is ≥44×44px; no unbreakable string exceeds its container; and
breakpoints belong to components, not to the site (`SEB §6.1`).

## §34.14 Signature interaction patterns

The moves that make a product feel like ours, and each is one idea:

| # | Pattern | |
|---|---|---|
| **1** | **The Meridian node** | A specular point tracking the reader's vertical centre on the spine — the only element bound to scroll position, and the reason the page feels like an instrument being read |
| **2** | **The meniscus pass** | Light travels a perimeter **once** on arrival, then stops. Arrival, not ambience |
| **3** | **The press** | Content is printed into place, not faded in |
| **4** | **Cut, not covered** | A panel opens by the ground being *cut away* to reveal it, not by a card sliding over the top. Modals rise from a cut, and close by the cut healing |
| **5** | **The marginal answer** | Detail appears in the marginal track, at the reader's line, rather than in a tooltip that covers what they were reading |
| **6** | **Weight, not colour, for state** | Selection thickens a rule and raises a stratum before it changes a hue. Colour-only state fails a fifth of readers |
| **7** | **The seal** | A ceremonial press, once, at a threshold. Never a decoration |
| **8** | **Hysteresis everywhere** | Every scroll- or hover-triggered change has a dead band. Interfaces that flicker at a boundary feel cheap because they are |

## §34.15 The surface classes

### Public websites

Ceremonial register. Chapter grounds change so a reader knows where they
are from the colour alone. Motion is *draw · reveal · respond* and the
hero renders **without JavaScript** — the entrance is a CSS animation that
plays on paint, because on a three-year-old Android on 3G a deferred
script means a blank hero.

### Enterprise and administrative applications

**Held to `SEB §29.5`: an internal tool is not exempt.** Density is higher,
ceremony is lower, and the language is identical. The Ledger is the
primary surface, the Console is the entry, and every destructive act uses
the same typed-name confirmation as the platform (`SEB §34.5`).

### Registrar systems

The flagship (`SEB §12`, `SEB §30.16`). The record is the interface:
lifecycle events are shown as a Path, every change carries actor, time and
reason, and **there is no delete control anywhere in the interface** —
archive, revoke and supersede are the controls that exist. The absence is
the design.

### LMS platforms

Progress is a Path with stations, never a percentage bar. Attempts are
visible history — the learner sees they scored 60 then 90, because that is
their achievement. **A pass is never shown as revoked by a later
attempt.** Content is a document, set in the reading register at a 34em
measure, not a slide deck in a browser.

### Certificate experiences

A security document before it is a beautiful one. The **verification page a
stranger reaches from a QR code is a flagship surface** — the single screen
most likely to be seen by someone who has never heard of the institution.
Four states, each designed with equal care: **genuine · revoked ·
superseded · not found.** Not found is honest, and it is designed, not
bare.

### Transcript experiences

The live record and the issued document are **different objects and are
never conflated in language or in interface** (`SEB §14.2`). The screen is
"your academic record"; the issued transcript says, on its face, the date
on which it was true. Supersession is visible: an old transcript checked
by a registrar abroad reports that a later version exists, and names it.

## §34.16 Audio

One sound: the **Strike** (`SEB §30.13`). Off by default, −34 LUFS, only
on completion of a consequential act, never on hover, navigation,
notification, error or arrival.

**Where an institution's material is inherently audio** — a listening
lab, a recitation, a pronunciation exercise — that is content, not
interface, and it is governed by the curriculum. The interface around it
stays silent.

## §34.17 Accessibility across every surface

Not a section that follows the design; a property of it (`SEB §30.15`).

- WCAG 2.1 AA is the floor, **computed from the shipped stylesheet on
  every build, on every ground, in every register.**
- Every interactive target ≥44×44px. Every focus state designed. Every
  focus restoration on close.
- Every instrument has its table twin. Every icon has a name. Every live
  region announces once, not on every keystroke.
- **State is never carried by colour alone** — weight, position or a mark
  carries it too (`SEB §34.14`, pattern 6).
- `prefers-reduced-motion` is total, and every carve-out resolves to the
  **finished** state.
- RTL is structural and is tested in a renderer at every breakpoint,
  because it fails differently and more severely than LTR.

## §34.18 What this volume leaves open

Named, not implied (`SEB §2.3`):

- **The Strike has not been authored.** The specification exists; the
  tone does not.
- **The Field instrument** (`SEB §34.9`) is specified and not yet built;
  it is the one instrument with no current use.
- **Tablet-landscape hover semantics** need a decision on hybrid devices
  that report a fine pointer and are used with a finger.
- **The print stylesheet is specified and unbuilt** beyond the estate's
  existing publication pipeline, which renders documents rather than
  application surfaces.
- **No surface in this volume has been tested with a screen-reader user.**
  Automated checks are not that, and this is the largest open item in the
  accessibility contract.

---

## §34.19 Implementation notes

**Normative form: `stromex/design-system/`.** What this volume specifies
in prose, that directory specifies in CSS, and the amendments building it
produced are recorded at `SEB §30.19`.

Three additions this volume did not anticipate:

- **`repeat(auto-fit, minmax(<length>, 1fr))` is banned** (`SEB §30.15`).
  The most-copied grid line on the web is wider than a 320px phone column
  and scrolls the page sideways. `minmax(min(<length>, 100%), 1fr)`
  collapses instead. `gates/tokens.mjs` refuses the bare form.
- **A zero-width grid track still charges its gutters.** `column-gap`
  applies between every pair of tracks, including the two either side of
  a track that is absent — 54 of 320 pixels on a phone. The Quire's gap
  is therefore a property of the *spread*, not of the grid.
- **An absolutely-positioned child of a grid is positioned against its
  grid area**, not the grid. A decorative ground placed in the default
  `measure` column paints only across the measure; every ornament spans
  `full`, explicitly.

And one correction to §34.1's contract: the accessible twin of an
instrument is hidden by a **clip**, never by `[hidden]` or
`display: none`. Both remove it from the accessibility tree, which
defeats the entire point of having one.
