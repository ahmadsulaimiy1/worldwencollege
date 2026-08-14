# The Digital Institution — Master Plan

*Lead architect's programme for WorldWide English College. Supersedes
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

### Layer 3 — Living diagrams
The house diagram language: animated SVG that draws itself, with nodes
that arrive and connections that grow. First instance ships this phase
(the Curriculum Spiral). The rest follow the page they belong to.

Planned: Curriculum Spiral · Competency Wheel · Learning Journey ·
Assessment Architecture · Publication Pipeline · Governance Structure ·
Quality Cycle · Global Reach.

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
node scripts/build.js                 # 88 pages, both languages
npm test                              # content rules, claims, structure
node tests/browser/route-audit.mjs    # all routes in Chromium
```

Plus, per phase: contrast measured on every new pairing; a
reduced-motion pass confirming nothing is left invisible; a
keyboard-only pass; and screenshots at 1440 and 390 in both languages.

The route audit is the backstop that matters — it loads every route in a
real browser and fails on script errors, missing assets, heading-order
breaks, overflow and sub-44px tap targets. No phase ships red.
