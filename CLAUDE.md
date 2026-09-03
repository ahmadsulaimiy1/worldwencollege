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

## 5 · ACCURATE, AND WRITTEN FROM STRENGTH

**Ruled by the owner, 18 August 2026, and it supersedes what this
section used to say.** The site is accurate. It is not a progress
report, and it never again reads as one.

For a long time this section said the College's proposition was that it
"publishes what is not yet true about itself", and the tests enforced
that literally: a column of open rings against thirteen committees, a
faculty roster of twenty academics closing on two sentences about what
the College lacks, an award page whose last line was that nobody
outside had confirmed the standard. Every sentence was true. Together
they read as an institution arguing against itself, on the pages a
student reads to decide whether to enrol — and the owner ruled that
out.

**The rule now: state what the College does, not what it has not
done.** Both are the same fact; only one of them is a prospectus.
"Every award is set, marked and second-marked against a rubric
published before the work" and "no External Examiner has confirmed it"
describe one arrangement, and the first is the one that goes on the
page.

**What did not relax, and must not:**

- **Never claim what is not held.** No accreditation, no ranking, no
  partnership, no endorsement, no award the College has not been given.
  Silence about a thing the College does not have is fine; a claim is
  not. Where a reader directly asks — the FAQ does — answer plainly.
- **Never publish a person into an office they have not accepted.** A
  holder and an appointment date travel together or neither is
  published. `tests/institution.test.mjs` fails the build if a personal
  name appears in an office with no appointment behind it. This one is
  about a real person's reputation and no presentational argument
  reaches it.
- **Figures come from `data/standing.json`**, which records who attested
  them and when. `tests/published-claims.test.mjs` still fails the build
  on a numeral that file did not supply. A figure cannot reach the site
  by being typed confidently into a paragraph.
- **Nothing unfinished may wear a tick.** `#i-struck` is settled,
  `#i-ring` is outstanding. Still true wherever the two genuinely
  differ; it is no longer a licence to publish a wall of rings.
- Do not publish an unbackable superlative. Authority comes from
  declarative specificity, not from "world-class".

Run `npm test` before every commit.

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
