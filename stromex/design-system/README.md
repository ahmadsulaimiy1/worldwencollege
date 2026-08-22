# The StromeX Design Language

**The normative form of Volumes 30 and 34 of the StromeX Editorial Bible.**
A specification nobody implemented is a wish (`AMC-DX §16`); the tokens,
the components, the motion system and the gates in this directory are what
those volumes actually mean.

Where this directory and the Bible disagree, one of them is amended. Never
both left standing.

---

## What is here

```
src/
  tokens.css        87 tokens — colour, light, the Quire, space, geometry,
                    the Chronograph, the Register, elevation
  foundation.css    the reset, focus, the Register, the Quire, the
                    Meridian, Stratum, the Chronograph, the ground
  components.css    the twenty canon components (SEB §30.10), forms, the
                    Index, the Console, the state family, the Oracle, the
                    Burin
  instruments.css   the closed set of six charts (SEB §34.9)
  print.css         the print form (SEB §34.10) — designed, not stripped
  index.css         one entry point, in dependency order
  fonts.css         generated · self-hosted variable faces
  fonts/            6 woff2 files · Fraunces, Archivo, Cinzel
  art/              generated · the guilloché
  js/               the behaviour layer — 11 modules, no dependencies

build/
  fonts.mjs                 self-hosts the three variable faces
  generate-guilloche.mjs    the ornament, from layered hypotrochoids

gates/
  tokens.mjs      no ad-hoc colour, radius, z-index or grid track
  beat.mjs        every duration a multiple of the beat, every curve named
  contrast.mjs    WCAG 2.1, both registers, every legal pairing
  responsive.mjs  a real browser, seven widths, both directions

showcase/index.html   every component, instrument and state, rendered
test/                 41 unit tests, including tests that the gates fail
```

## Running it

```sh
npm install
npm run build      # self-host the fonts, generate the ornament
npm test           # the four gates, then the unit tests
```

`gates/responsive.mjs` needs a browser. Playwright is an **optional**
dependency; without it that gate **skips loudly and says it skipped**. It
never prints a tick for a check it did not run.

Open `showcase/index.html` through a static server (the ES modules will
not load over `file://`).

## Using it

```html
<link rel="stylesheet" href="@stromex/design-system/src/index.css">
<script type="module">
  import { bindAll } from '@stromex/design-system/src/js/index.js';
  bindAll();
</script>
```

**Nothing here needs JavaScript to be read.** The CSS is complete on its
own: reveal states resolve, the Ledger stacks, the print form prints, and
every control works. The behaviour layer adds the instrument behaviours on
top of a page that already functions.

## The two registers

`data-register="reading"` on any element switches to the light register.
`prefers-color-scheme` does **not** switch it (`SEB §30.7` rule 3): the
register a product commits to *is* its presentation, and the other is an
accommodation the reader chooses. This also guarantees that what is
reviewed is what is served.

Both registers are checked by `gates/contrast.mjs`, because half the
palette means something different on paper.

---

## What the gates found

The gates were written after the stylesheets, and they are recorded here
because the list is the argument for having them. Every one of these
passed a human reading of the source first.

| # | Found by | Defect |
|---|---|---|
| 1 | `contrast` | **The focus ring was invisible.** `--sx-lapis` on obsidian computes to **2.29:1**. A focus indicator at 2.29:1 is one a keyboard reader cannot find, on every page, in the register the product is presented in. `--sx-carnelian` — which carries *error messages* — was 2.43:1, and `--sx-verdigris` 3.35:1. All three now resolve through register-aware **signal roles** |
| 2 | `contrast` | `--sx-rule` was doing two jobs. A hairline between ledger rows owes nothing; **the rim of a text field is a UI component boundary and owes 3:1**, and at 1.44:1 it did not have it. Split into `--sx-rule` (separates) and `--sx-boundary` (identifies) |
| 3 | `contrast` | Pewter on the platinum plinth was **1.22:1** — a hairline invisible on the one ground it is most used against |
| 4 | `responsive` | **A zero-width grid track was still charging two gutters.** `column-gap` applies between every pair of tracks, including the two either side of an absent one — 54 of 320 pixels on a phone, spent on a column that is not there. Every plate on the page overhung the viewport |
| 5 | `responsive` | `repeat(auto-fit, minmax(18em, 1fr))` — the most-copied grid line on the web — is wider than a 320px phone column and scrolls the page sideways. Corrected to `minmax(min(18em, 100%), 1fr)` everywhere, and the bare form is now refused by `tokens` |
| 6 | `responsive` | **`translate: -50%` centres in LTR and de-centres in RTL.** Three components hung half their width off the page in Arabic |
| 7 | `responsive` | `grid-column: marginal` had no `marginal-end` line. The spec says every *implicit* line is then assumed to have that name — so the Meridian was placed in an implicit column at the far edge of the page |
| 8 | `tokens` | Two anonymous values that turned out to be decisions: the ring-mask stencil, and the two negative depths beneath the ground |
| 9 | `test/gates` | **The declaration scanner was silently skipping every single-line rule** — most of `components.css` — while reporting a four-figure check count and a green tick. Found by injecting a hex colour the gate did not catch. Rewriting it as a state machine took the token gate from 1,570 checks to 2,080 |
| 10 | *the screenshot* | The Meridian was placed at 38.2% of the **viewport**. On a 1440px display that is 550px, and the measure runs 333–877: the spine ran through the running text and the chapter rail landed on every heading. The spine of a folded sheet is not a fraction of the reader's window — it is the fold. It is now a **grid line**, shared with the Quire through one custom property |
| 11 | *the screenshot* | The Lintel's capital was at `38.2%` while the Meridian was on a grid line: a gold tick over nothing, 245px from the spine it was drawn to continue |
| 12 | *the screenshot* | Condensed, the Lintel kept its mark while the Keystone also carried one — the institution's name on screen twice, six pixels apart |
| 13 | *the guilloché* | The generator sampled **per turn** rather than per lobe, and emitted a **2.1MB** background ornament. Resolution the reader perceives is set by the lobe, not the revolution |

Nine of the thirteen are invisible to inspection and produce no error
anywhere. That is the whole case for the gates.

## The escape hatch, and why it is noisy

A line carrying `/* sx-gate-allow: <gate> — reason */` is skipped by that
gate **and printed, with its reason, on every run**. There is one in the
system, and you can see it in the output of `npm run gate:beat`.

An exemption nobody sees is a rule nobody keeps: the first is argued, the
tenth is copied, and after that nobody can find them.

## Where the rules come from

| | |
|---|---|
| `SEB §30` | The StromeX Design Language — the Meridian, the Quire, Stratum, the Chronograph, the Register, the canon, the ground, the Burin, the Strike |
| `SEB §34` | The StromeX Design System — surface by surface, state by state, device by device |
| `SEB §35` | The Design Language Initiative — the permanent programme this serves |
| `SEB §29` | The Supreme Creative Constitution |
| `MC` | The StromeX Master Constitution, which sits above all of them |

Every article cited in a comment in this directory is real, and resolves.
