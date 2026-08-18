# WorldWide English College — the house standard

Read this before touching anything. It is the owner's standing
instruction, not a style suggestion, and it applies to every session on
this repository whether or not the current task mentions it.

---

## 1 · THE STANDARD IS LOCKED AT THE TOP

> "Always do the highest possible, even to what I have not asked."

Every surface of this site is to read as **prestige, royalty,
sophistication and elegance**. When a choice is available between the
adequate answer and the exceptional one, take the exceptional one
without being asked and without checking first. Interpret every request
as an instruction to work at the highest register you are capable of —
if a request could be read as "make this acceptable", it means "make
this outstanding".

Do not ask the owner to re-explain this. It is settled.

**What that forbids:** shipping a flat surface, a bare fill, a generic
outline icon, a card with dead space in it, a stock component, or a
page that merely functions. "It passes the tests" is not the bar.

**What that requires:** every major shape is a struck object with real
relief, gloss, and light behaving on it — see §2.

---

## 2 · THE MATERIAL LAW

The site already carries a full atelier layer. **Use it. Do not build
flat components beside it.** This was got wrong once — the College
pillar shipped with zero of these while the homepage used `.aurum` 43
times — and the correction is the reason this section exists.

Every **major** shape (a card, a dome, a plate, a medallion, a gauge, a
register column, a role disc, an honour) must carry:

| Requirement | How |
|---|---|
| **Travelling light** — a golden/diamond point orbiting the perimeter | `.aurum` (+ `.aurum--hover` on grids), or the built-in orbit on `.badge-dome::after` |
| **A lit rim** | `.edge-lit` (add `.edge-lit--light` on pale grounds) |
| **3D / gloss** | relief shadows (`--relief-raised`, `--relief-metal`), a specular cap, `.tilt` + `.tilt__sheen` |
| **Metal that answers the pointer** | `.gold-live` |
| **Entrance** | `.reveal` |
| **Ground texture** | `grain`, `guilloche`, `aurora` on dark grounds |
| **A tap sound** | automatic — see §3 |

`.aurum` claims `::after` and `.edge-lit` claims `::before`,
deliberately, so one surface wears both. **Never take either
pseudo-element on an element wearing those classes.**

**Icons are large.** `.badge-dome` is 52px with a 30px glyph;
`.badge-dome--lg` is 106px with a 50px glyph and is the correct choice
wherever an icon anchors a card. Small icons read as an admin panel.

**Reduced motion is not optional.** Every animation added must have a
carve-out that resolves to the *finished* state — never a hidden
element, never a half-drawn one.

---

## 3 · SOUND

`js/sonics.js` gives every struck shape a voice, ranked by ceremony:
`chime` (gold CTAs) → `seal` (conferral: medallions, honours, the
matricula, wax seals) → `open` (anything that expands) → `tap`
(every other struck surface). A **new component must be added to the
`TAP`/`SEAL` selector lists in that file**, or it will be the one
silent object on the page and read as a bug.

Surfaces with no relief stay silent. A site where everything makes a
noise is a toy, not a luxury.

---

## 4 · THE ARCHITECTURE

- `pages/*.html` are **sources**; `scripts/build.js` generates the
  served HTML. Never edit a built file — run `node scripts/build.js`.
- `css/brand.css` = the material system, on every page.
  `css/atelier.css` = the luxury layer, on every page.
  `css/pillar.css` = masthead + numbered leaves + register + colophon,
  for a pillar and its sub-pages. A pillar wanting its own accent adds
  a **second** stylesheet after it (`css/students.css` is the model) —
  never fork `pillar.css`.
- Register extra stylesheets via `extraCss` in `pages/manifest.json`.
- **Every English page has an Arabic edition.** They ship together.
  RTL is checked in a real browser, not assumed. Arabic type rules live
  in `css/arabic.css`; declare the family, never re-point a token.

---

## 5 · TRUTH OUTRANKS POLISH

This College's entire proposition is that it publishes what is not yet
true about itself. That is enforced by tests, and it is never traded
for a better-looking page.

- **Nothing unfinished may wear a tick.** Settled work takes
  `#i-struck`; outstanding work takes `#i-ring`, an open circle. This
  was a real defect on four pages.
- Do not publish an unbackable superlative. Authority comes from
  declarative specificity, not from "world-class".
- `tests/published-claims.test.mjs` guards figures, certificates, live
  classes and the retired 720-lesson number (banned on Arabic pages,
  permitted on English as a design figure). Run `npm test` before every
  commit.

---

## 6 · VERIFY BY RENDERING

Reasoning about CSS is not verification. Chromium is at
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; serve the repo and
screenshot the actual page.

Every fault below was invisible in the source and obvious on screen:
domes rendering silver instead of emerald; a nib drawn as a map pin; a
lectern drawn as a trophy; a masthead 190px off its own axis; a lit
ninth cell in an eight-item grid; 39px of dead space in every card; and
seven navigation links rendering as literal HTML source.

Check at 1440 / 900 / 390, in both directions, for horizontal overflow
and console errors — every time.

---

## 7 · WORKING ALONGSIDE OTHER SESSIONS

Several Claude sessions work this repo at once. Before starting:
`git fetch`, then merge the integration branch. **Upgrade, never
overwrite** — when a merge conflicts, keep both sides: their structure,
your marks. End every push as a clean superset of the integration
branch.

**`claude/worldwide-english-college-site-ezy1zo` is no longer that
branch.** It has been rebranded to Albalagh International Premium
College — a separate institution and a separate project that happens to
share this repository's history. It is **not** to be merged into
WorldWide English College work, in whole or in part, and its rename
(WEC-LC → AIPC) is not to be adopted here. Ruled by the owner,
18 August 2026. Do not re-raise it.
