# The Digital Institution — Master Plan

*Lead architect's programme for Worldwide English College. Supersedes
nothing; governs everything built after it. Companion to
`editorial-bible.md` (what the brand is) and `photography-brief.md`
(what the images must be). This document is **what gets built, in what
order, and why that order.***

---

## The standard

Not "a beautiful college website." A **digital institution** whose
quality is evident in the first two seconds and which still looks
deliberate in ten years.

The four identities that must coexist without any one of them winning:

| Identity | What it contributes | What it must not become |
|---|---|---|
| British academic heritage | Engraving, ledgers, small caps, the crest | Pastiche. A fake coat of arms on a bootstrap grid. |
| Royal elegance | Gold as metal, ceremony, restraint | Gaudy. Gold on everything is gold on nothing. |
| Futuristic technology | Light, glass, depth, living diagrams | A crypto landing page. Neon, glow-for-glow's-sake. |
| Premium luxury | Space, craft, materials, silence | Expensive-looking. Costly is not the same as considered. |

**The discipline that makes this work:** every effect is rationed. A
technique used everywhere stops being noticed and starts being noise.
The register is set by how *rarely* an effect appears, not how often.

---

## Non-negotiables

These override any visual ambition, always. A luxury experience that
excludes people is not luxury; it is decoration.

1. **Contrast ≥ 4.5:1** on every text pairing. Measured, not judged.
2. **Keyboard-complete.** Every interaction reachable and visibly
   focused. Effects never trap or hide focus.
3. **`prefers-reduced-motion` resolves to the finished state**, never a
   hidden one. A disabled entrance animation that leaves content at
   `opacity: 0` is not a calmer page, it is a blank one.
4. **Content renders before effects.** No effect may gate reading,
   navigation, or form submission. No blocking loader, ever.
5. **Effects are compositor-only** — `transform` and `opacity`. Anything
   animating layout is a bug.
6. **Everything off-screen is paused.** Canvas, rAF loops, ambient
   motion. Also paused on `visibilitychange` and under Save-Data.
7. **Degrades on weak hardware** — low core count, coarse pointer, or
   Save-Data drops to the static composition, which must be complete on
   its own.
8. **No external runtime dependencies.** No CDN, no framework, no
   animation library. The site is static, bilingual and must stay
   auditable.

---

## The system, in layers

Built bottom-up. Each layer is useless without the one below it, which
is why this is the build order.

### Layer 0 — Substrate *(complete)*
Palette, type scale, icon sprite, engraved plates, per-page CSS/JS
loading via the manifest, the eight-chapter homepage. Shipped.

### Layer 1 — The Atelier *(this phase)*
The shared effects engine every later layer draws on. One stylesheet
(`css/atelier.css`), one engine (`js/atelier.js`), one shared rAF loop.

| System | What it is |
|---|---|
| **Gold energy** | Gold behaves as metal: a light sweep travels across it, it catches on hover, it never sits flat. |
| **Crystal glass** | Glass with a gold edge, an internal highlight and a refraction seam — not a blur filter. |
| **Architectural lattice** | A perspective wireframe with illuminated nodes, sitting several layers behind the interface. |
| **Constellation** | A canvas node-field that connects to itself and leans toward the cursor. Knowledge as a network. |
| **Ambient hour** | The chrome's light temperature shifts with the visitor's local time — dawn, day, dusk, night. |
| **Magnetics** | Buttons lean toward the cursor; cards tilt; the crest follows a little. |
| **Kinetic gilt** | Headings fill with gold as they cross the reading line. |
| **Assembling figures** | Statistics form rather than count — digits settle into place with a trail. |
| **Aurora** | Very slow colour drift behind deep sections. |

### Layer 2 — Architecture: header and footer *(this phase)*
The two components on all 88 pages, rebuilt as architectural elements
rather than navigation bars. Multi-layer header (utilities → identity →
navigation → actions), glass mega-panels, the lattice behind both, and a
footer that reads as the illuminated base of the building.

This is deliberately the second thing built: it is the highest-leverage
surface on the site, and it proves the Atelier on every page at once.

### Layer 3 — Living diagrams *(nine shipped)*
Animated SVG that draws itself: paths trace, nodes arrive, labels rise.
All generated, never hand-drawn, from `scripts/art/` on the shared
apparatus in `scripts/art/lib/plate.mjs` — palette, scale, text, the
`data-draw` / `data-pop` contract `js/atelier.js` animates, and the
`role="img"` + title + description wrapper.

| Diagram | Page | What it argues |
|---|---|---|
| **Curriculum Spiral** | Home ch. II | Six levels are one continuous path, not six boxes |
| **Award Standard** | `/students/assessment/` | Compensation between skills is capped, and the cap tightens as bands rise |
| **Authority Chain** | `/about/governance/` | Two academic bodies stop short of approval for two different reasons — one empty, one idle |
| **Publication Funnel** | `/press/` | A short catalogue is a decision, and the review gate is still shut |
| **Competency Wheel** | `/about/basce/` | The framework is measured against BASCE's own remit, and the polygon collapses on the two axes carrying nothing |
| **Quality Cycle** | `/about/quality-assurance/` | Two loops at different speeds: one closed and turning on every change, one open because the annual cycle was constituted in August 2026 and has not come round |
| **Provenance Columns** | `/academics/teaching/` | The fourth kind of teaching knowledge is empty in kind, not in degree — writing produced the other three and cannot produce this one |
| **Level Ascent** | `/study/level-1…6/` | Six rungs, each a complete award. Deliberately not a progress bar: the reader has not climbed it |
| **Two Routes** | `/admissions/tuition/` | Two prices converge on one seal, so everything that differs is visibly above it — and conferral is paid for on both routes, in different places |

**The rule these established.** A diagram on this site is not
decoration and not a restatement — it earns its place only by showing
something the prose beside it *cannot*. The award ladder exists because
a table cannot show a gap narrowing. The authority chain exists because
a paragraph cannot show a break — and it earned its place a second time
when the Senate was constituted, because in prose "BASCE has nobody on
it" and "the Senate has not met" read as the same sentence twice, and in
the drawing they are a severed link beside a shut gate. If a proposed
diagram would only repeat the text in shapes, it does not get drawn.

**Four rules learned building them, now binding:**

1. **Numbers in a drawing need a test.** A picture is the one artefact
   nobody proof-reads. `tests/award-diagram.test.mjs` reads the
   thresholds back out of the shipped SVG and holds them against the
   published table, in both languages. Every future diagram carrying
   figures gets the same treatment.
2. **A diagram must be legible where it lands.** These are drawn for a
   dark ground; on a light section they are mounted in their own deep
   panel (`.diagram` in `css/atelier.css`), keyed off the section so it
   cannot be forgotten. And below 760px they scroll inside that frame
   rather than shrinking to four-pixel type — the same answer
   `.table-scroll` already gives the ledgers.
3. **A plate is a document, not a fragment.** Every plate opens with an
   XML declaration, so anything that parses XML may open one. The
   generators were emitting `data-pop` bare — legal HTML shorthand, a
   hard syntax error in XML — and all eight rendered as a parser-error
   page when opened outside a built page. It survived because the only
   route that exercised them was the route that forgave it.
   `tests/art-plates.test.mjs` now checks them as documents.
4. **A drawing whose claim can expire refuses to render.** The quality
   cycle asserts that the outer ring has never closed. On the day the
   College enrols a learner that becomes false, and regenerating would
   quietly produce a confident, specific, wrong picture. So the
   generator throws if enrolments, sessions or awards stop being nought,
   and `tests/quality-cycle.test.mjs` fails even when nobody re-runs it.
   Any diagram resting on a nought gets the same treatment.
5. **Measure the drawing in the page that ships it, in both
   languages.** `text-anchor` resolves against inline base direction, so
   `end` is the right edge under LTR and the left edge under RTL. The
   Arabic authority chain was drawn, opened, and checked as a file —
   then inherited `dir="rtl"` from `/ar/about/governance/` and threw its
   whole vacancy register off the canvas. The defect existed only in the
   combination. Plates now pin `direction="ltr"` on the root and carry
   right-to-left layout in mirrored coordinates alone;
   `tests/browser/diagram-fit.mjs` measures every element against the
   viewBox, and every label pair against every other, in the rendered
   page.

Still to draw: Learning Journey · Assessment Instruments.

**Global Reach is struck from the list, deliberately.** It was on it
because an internationally-minded college ought to have a map. This one
has no learners in any country, no taught cohort and no graduates, so
the only honest version of that map is empty — and an empty map beside
six populated diagrams reads as an oversight rather than a fact. The
same information belongs in a sentence until it does not. Re-add it the
day there is somebody to plot. All four existing diagrams now
ship in both languages — the Authority Chain's Arabic edition landed
with `/ar/about/governance/`, which was written for it.

### Layer 4 — Page heroes
Every major page gets its own hero — never a reused banner. Each opens
like the first spread of a publication.

### Layer 5 — Signature experiences
The things that make people remember the site. Each is an **optional
immersive layer over conventional navigation, never a replacement for
it.**

- **The Knowledge Universe** — the College at centre; faculties,
  programmes, publications and research as an explorable constellation.
  Reached from the nav; the nav still works without it.
- **The Royal Library** — publications on a shelf that slide, open and
  preview.
- **The Interactive Globe** — where the College teaches, and where its
  learners are.
- **The Living Timeline** — institutional history as a walk rather than
  a list.

### Layer 6 — The remaining 86 pages
Rebuilt onto the finished system, in order of commercial weight:
Admissions → Study/levels → About/Governance → Academics → Students →
Faculty/Teaching → Press/Library → Support.

---

## Order of work, and why

The sequence minimises rework, which is the only reason to have a
sequence at all.

| Phase | Deliverable | Why here |
|---|---|---|
| **1** | Atelier engine + header/footer architecture + first living diagram | The engine must exist before anything uses it. Header/footer prove it on 88 pages simultaneously and are the highest-leverage surface on the site. |
| **2** | Homepage raised onto the Atelier; Knowledge Universe prototype | The homepage is the reference implementation every other page is judged against. |
| **3** | Admissions cluster (11 pages) + admissions diagrams | The pages where a Gulf family makes a decision, and where revenue is. |
| **4** | Study cluster (six levels) + Curriculum Spiral in full | The largest single body of content, and the proof the College is real. |
| **5** | About / Governance / Standards + governance diagrams | Where trust is won by an institutional buyer. |
| **6** | Press / Library + Royal Library experience | The most distinctive asset the College has; deserves the most distinctive treatment. |
| **7** | Students / Faculty / Teaching / Support | Completes the ecosystem. |
| **8** | Whole-site holistic review | Judge the site as one experience, not 88 pages. Fix what only shows at that altitude. |

Arabic is not a phase. Every phase ships both languages together, or it
has not shipped. The Gulf is the primary audience; an untranslated
flagship page is a broken one.

### The Arabic backlog, stated rather than implied

Thirty-one routes are published in Arabic; **the remainder of the
English routes have no Arabic edition yet** — the exact figure prints on
every test run. `tests/bilingual-links.test.mjs` prints the
number on every run so nobody has to go and count, and enforces the one
rule that makes the gap survivable: any link out of Arabic into English
is marked `(EN)` or `(بالإنجليزية)` in its own anchor text, before the
reader commits to the click.

The order the remaining pages are written in is not the manifest order.
It is: pages where a reader is deciding something that costs them money
or time, then pages an institutional buyer checks, then the rest. Two
groups are blocked rather than merely unwritten, and the reasons belong
here rather than in somebody's head:

- ~~**The six level pages**~~ — **published.** They were blocked on the
  College's own Arabic curriculum terminology, because coining a second
  Arabic vocabulary page by page is how two pages come to disagree about
  what a level is called. The block is now resolved the way it should
  have been framed from the start: the vocabulary is a shared object,
  not a per-page decision. `scripts/lib/arabic-kit.js` holds the level
  names, the layout primitives and the standing notices; the sixty
  module titles, the four skills, the Level I outcomes and the award
  glosses live in one keyed table each in
  `scripts/build-arabic-levels.js`, every one of them guarded so a
  missing rendering stops the build rather than shipping an English
  string inside an Arabic table.

  Two decisions worth recording, because they will come up again:
  the English module title is printed BESIDE the Arabic one, since it is
  the title the curriculum, the assessment handbook and the learner's
  transcript all carry; and award titles and post-nominals are not
  translated at all, since an award is a defined object and a translated
  title is a second award nobody has defined.
- **`/standards/evidence/`** is generated from the database, so its
  Arabic edition is a translation of a data set rather than of a page.
  The terminology block above is lifted; what remains is the data-set
  question itself.

`/about/governance/` was in neither group, and neither was
`/about/basce/`. Both were simply not thought of as decision pages —
until a diagram was drawn on each, and a drawing does not need a reader
fluent in English, only one who can read its labels. That is now the
third criterion for pulling a page forward in the Arabic queue, after
"costs the reader money" and "an institutional buyer checks it":

> **A page carrying a living diagram is published in both languages, or
> the diagram has not shipped.** An argument made in a picture reaches
> an audience that an English paragraph does not, and leaving it in one
> language wastes the thing that makes it worth drawing.

---

## What "finished" means for a page

A page is not done when it works. It is done when every answer is yes:

- Does it have its own hero, or is it wearing another page's?
- Is every claim on it true, and does the evidence exist?
- Does it carry at least one thing that communicates without being read
  — a diagram, a plate, a figure?
- Is every animation intentional, and does each resolve to a finished
  state under reduced motion?
- Does every colour on it come from the palette, and does every pairing
  clear 4.5:1?
- Is it complete in Arabic, with RTL counterparts for every physical
  direction property it introduced?
- Does it work with the keyboard alone, and with the canvas disabled?
- Would it survive being opened next to the best page on the site?

---

## Named people, and the registers that hold them

Two registers now carry real individuals: `docs/faculty-register.md`
(twenty teaching and academic staff, attested 12 August 2026) and
`docs/governance-register.md` (six governors, three senators, six
executive officers, attested 14 August 2026). Both are the **single
source of truth** for their bodies, both are rendered rather than
hand-written, and both are enforced in two directions by a test.

The rules that govern them, learned the expensive way and now binding:

1. **A register, or the name does not ship.** No person-shaped string
   may reach a page unless a register carries it. Enforced by
   `tests/faculty-roster.test.mjs` and
   `tests/governance-register.test.mjs`, each with a sabotage self-test
   proving the scan reaches.
2. **Attestation and verification are different words.** The pages say
   these are the College's appointed people, which is what the College
   attests. They do not say this repository verified anybody's degree,
   because it has not. Each register carries a provenance table making
   that distinction explicit — the form that protects the College if a
   credential is ever queried.
3. **A credential the College did not supply renders as nothing.** Five
   of the six executive officers were attested without qualifications.
   A blank is honest; a plausible degree is not, and a template that
   wants a line there is not a reason to invent one.
4. **Constituted is not convened.** Appointing a body makes approval
   possible; only a meeting makes it happen. `academic_body_events`
   (migration 016) records the two separately, `scripts/build-about.js`
   throws if a `convened` row appears while pages still say otherwise,
   and the authority chain draws a severed link for the empty body and a
   shut gate for the idle one.
5. **Filling internal posts moves nothing external.** Fifteen
   appointments closed exactly one item on the missing list. No award
   can be conferred until an External Examiner exists, and no internal
   appointment substitutes for a post whose whole function is to sit
   outside the College.
6. **Collisions are reported, not resolved.** Where two registers give
   one post two holders, the test prints it every run and the register
   records it. Only the College can settle a question about who holds a
   job; a build script guessing is how a wrong answer becomes permanent.

## Standing rules for this build

1. **Improve the system, never the instance.** If a page needs a better
   component, improve the shared component. Exceptions are how a design
   system dies.
2. **Ration every effect.** Before adding one, name the two other places
   it must *not* appear.
3. **Nothing decorative may cost correctness.** If an effect makes a
   tap target smaller, a contrast worse, or a focus ring invisible, the
   effect loses.
4. **Static composition is the deliverable.** Motion is what it does
   when it is working, not what makes it work. Every page must be
   complete as a still image.
5. **Write down what is not done.** A roadmap item stated plainly is
   worth more than a feature implied.

---

## Verification, every phase

```
node scripts/build.js                    # every page, both languages
npm test                                 # content rules, claims, structure, plates
node tests/browser/route-audit.mjs       # all routes in Chromium
node tests/browser/diagram-fit.mjs       # every diagram measured where it ships
node tests/browser/render-quality.mjs    # contrast, layout shift, High Contrast Mode
```

`render-quality.mjs` is the slow one and the one that finds what reading
cannot. It measures every text style on all 186 routes against the
ground actually painted behind it, records each route's Cumulative
Layout Shift from the browser's own observer, and asks every control,
with `forced-colors: active`, whether it still has a boundary. The day
it was written it found a cream card inside a navy section on
`/student-portal/` whose heading computed to 1.04:1, a token used in
seven stylesheets and defined in none, twenty-eight sections missing the
base class that carries twenty typography rules, and ten controls that
vanish into their own ground in High Contrast Mode.

Regenerating: the cluster generators (`build-about`, `build-arabic`,
`build-arabic-levels`, `build-governance`, `build-levels`, …) write into `pages/`, and
`scripts/build.js` assembles `pages/` into the served directories. The
publication volumes are separate — `npm run curriculum` re-renders the
editorial bible, and a governance fact changed in a generator will not
reach a shipped PDF until it does.

If a cluster generator owns the page — `scripts/build-arabic.js`,
`build-students.js`, `build-press.js` and the rest — edit the generator,
never `pages/*.html`. Most of that directory is output, and a change
made there is reverted silently by the next build.

Plus, per phase: contrast measured on every new pairing; a
reduced-motion pass confirming nothing is left invisible; a
keyboard-only pass; and screenshots at 1440 and 390 in both languages.

The route audit is the backstop that matters — it loads every route in a
real browser and fails on script errors, missing assets, heading-order
breaks, overflow and sub-44px tap targets. No phase ships red.
