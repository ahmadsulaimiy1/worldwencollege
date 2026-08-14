# WorldWide English College, London Campus — Editorial & Brand Bible

*Version 1.0 — companion to `site-architecture.md`.*

---

## Preface — How This Was Built

WEC-LC was originally a fictional placeholder name used in an unrelated
brief (a navy-and-gold "Worldwide English College, London Campus" seal,
"world-class international English institution" positioned toward Gulf
families and global elites) that was ultimately built out for a different,
real client under a different identity. This repository is where that
original concept gets built for real, as its own institution.

Two rules governed everything in this build:

- **Craft and design discipline** are held to the standard the original
  brief demanded — the same rigor a premium international institution or
  publication would apply. No generic card-grid/icon-set/stock-photo
  "school template" conventions.
- **Facts are not invented.** Institutional facts supplied directly (name,
  motto, vision, mission, core values, the IEFC programme structure, CEFR
  mapping, curriculum areas, teaching methodology, tuition figures, target
  audience, brand colours) are used verbatim. Anything not yet confirmed —
  a physical London address, named leadership or faculty, formal
  accreditation, a first-cohort start date — is shown as a labelled
  "Institutional Status" callout instead of being fabricated. Search
  `id="status"` and `.callout` across `pages/` for the current list.

---

## Part I — Institutional Identity

**Name:** WorldWide English College — London Campus (WEC-LC)
**Motto:** "Empowering the World Through English Excellence."

**Vision:** To become one of the world's leading English language
institutions, recognised for excellence in English language education,
innovation, academic integrity, and graduate success.

**Mission:**
- Deliver world-class English language education.
- Develop confident, fluent, and academically competent English speakers.
- Prepare learners for international study, employment, and professional
  communication.
- Integrate modern educational technology with expert instruction.
- Provide accessible, high-quality English education to learners worldwide.

**Core Values:** Academic Excellence, Integrity, Innovation, Professionalism,
Inclusiveness, Lifelong Learning, Global Citizenship, Student-Centred
Education.

**Target audience:** school pupils, secondary and university students,
working professionals, government employees, business executives,
international students, and study-abroad candidates — with particular
emphasis on learners from the GCC, Europe, Africa, and Asia.

---

## Part II — Programme Architecture

One flagship pathway: the **International English Fluency Course (IEFC)** —
24 months, six levels, four months and 120 units per level, 720 units total.

| Level | Programme Title | CEFR |
|---|---|---|
| I | Foundation Programme | A1 |
| II | Elementary Programme | A2 |
| III | Intermediate Programme | B1 |
| IV | Upper Intermediate Programme | B2 |
| V | Advanced Programme | C1 |
| VI | English Mastery Programme | C2 |

CEFR alignment was chosen (over a purely bespoke naming scheme) because it's
the benchmark most widely recognised by universities, employers, and
English-language institutions worldwide — while the WEC-LC programme titles
keep the institution's own branding on top of that shared reference.

**Curriculum areas (all levels):** Grammar, Vocabulary, Listening, Speaking,
Reading, Writing, Pronunciation, Conversation, Academic English, Professional
Communication, Public Speaking, Business English, Research Skills, Critical
Thinking, Presentation Skills, IELTS/TOEFL/Cambridge English Preparation,
Interview Skills, Leadership Communication.

**Teaching methodology:** HD video lectures, live online classes, interactive
lessons, guided speaking practice, writing workshops, reading/listening
activities, weekly quizzes, monthly assessments, mid-level and final
examinations, capstone projects, continuous progress monitoring.

**Tuition:** $19,000 for the full programme, or $3,166.67 per level
(720 units at ≈$26.39/unit). Payable in full, per level, or — subject to
institutional policy — monthly. Additional fees (application, admission
processing, registration, graduation/certificate, printed certificate,
courier, verification) are confirmed at application.

### What doesn't exist yet (do not fabricate)
- A confirmed physical London Campus address and premises
- Named academic leadership and a founding faculty roster
- Formal accreditation / external quality-assurance affiliations
- An academic calendar and first-cohort start date

These remain flagged as `.callout` "Institutional Status" sections until
WEC-LC's operators supply the real data.

---

## Part III — Brand System

### Colour System
Royal Blue / Gold / Red, as specified in the founding brief — not the
Coffee-Brown/Gold palette used by the unrelated real-world build this
concept was once reconciled into. That palette belongs to a different,
named institution and was deliberately not reused here.

| CSS variable | Hex | Role |
|---|---|---|
| `--royal` | `#14264A` | Primary ground — hero, header, dark sections |
| `--royal-deep` | `#0A1730` | Deepest — footer, section transitions |
| `--royal-bright` | `#274B85` | Mid accent, hover states |
| `--gold` | `#C7A24A` | Primary accent — rules, borders, CTA fills |
| `--gold-bright` | `#E7C97A` | Highlight state — headings on dark ground |
| `--ivory` / `--paper` | `#F7F4EC` / `#FCFAF4` | Light grounds, card surfaces |
| `--red` | `#A32638` | Emphasis / CTA accent — used sparingly, never as a large fill |
| `--ink` | `#16202E` | Body text on light backgrounds |

**Usage discipline:** dark (Royal Blue) and light (Ivory/Paper) sections
alternate down every page — never two dark or two light sections back to
back. Red is reserved for emphasis (eyebrows and CTAs on light sections,
module markers) and never fills a background. Gold is a line-and-accent
colour on dark grounds, never a large fill.

### Typography
| Typeface | Role |
|---|---|
| **Playfair Display** (500–700, italic) | Editorial serif: headlines, pull-quotes, vision/mission lead text |
| **Inter** (400–800) | Body copy, UI chrome, form labels, navigation |
| Amiri / Cairo | Arabic fallbacks, appended automatically for `[lang="ar"]` content |

A deliberate two-role system (editorial serif / functional sans) — no
third display face, no rounded "friendly EdTech" sans anywhere in the
system.

### Motifs (the "anti-cheap" toolkit)
These exist specifically instead of generic card-grid / icon-set /
gradient-hero conventions:

- **Module markers** (`02 · Academic Programme`) open every major section —
  a numbered institutional index, not a generic "eyebrow" label.
- **Ledger tables**, not card grids, list the six IEFC levels and their
  CEFR mapping — the register of a formal academic transcript.
- **Dot-leader lists** (`01 HD video lectures ······`) present the teaching
  methodology as a numbered index rather than a photo-tile grid.
- **Stat rows** with hairline dividers present programme facts (6 levels,
  720 units, 24 months) as a measured statistic, not a marketing badge.
- **Tag rows**, not icon boxes, list curriculum areas and target audiences —
  dense, scannable, and honest about how many things are actually true at
  once.
- **Institutional Status callouts** — a consistent, dashed-border component
  used site-wide anywhere a fact isn't confirmed yet, so "we don't know this
  yet" reads as considered honesty, not an apologetic gap.
- **Crest watermark** — the full institutional crest
  (`assets/images/crest-seal.jpg` — crown, laurel wreath, shield,
  banner tagline), blended into the homepage hero at low opacity via
  `mix-blend-mode: screen` so it reads as an ambient seal, not a
  pasted-in logo rectangle. The small inline header/footer mark stays
  a lightweight vector shield — legible at 34×40px in a way a raster
  crest of this detail isn't.
- **Restrained motion only** — a staggered scroll-reveal (cards, stat
  rows, pull-quotes, callouts) and a considered hero entrance,
  respecting `prefers-reduced-motion` throughout. No scroll-jacking, no
  gimmick animation — see `docs/dashboard-design-system.md`'s
  Executive Design Directive section for the full account of what
  changed and why.

### Tone of Voice
- Numbers spelled with precision, not superlatives: "six levels," "720
  units," "24 months" — specificity reads as more credible than repeated
  claims of being "world-class."
- Comparative claims are avoided ("recognised for excellence," "committed
  to excellence") rather than asserted ("the best," "the world's leading")
  — ambition is stated as a vision to work toward, not a settled fact.
- Silence over invention: where data doesn't exist yet, the site says so
  plainly, in the same visual language as everything else, rather than
  switching to an apologetic or evasive tone.

### Photography Direction
No real photography exists yet for this institution. The current build
uses no stock photography anywhere — texture and hierarchy come from type,
colour, and the ledger/dot-leader/stat-row system above. When real campus
and classroom photography is available, the recommended direction is:
available light, unstaged, warm colour grade toward the Royal Blue/Gold
palette, no stand-and-smile stock photography.

The image slots are now built and specified per-slot in
**`docs/photography-brief.md`** — filename, ratio, subject, crop and the
cliché to avoid, for each of the five regions on the homepage.

---

## Part III·b — The Flagship Layer

*Added with the homepage rebuild. Everything here is live in
`css/brand.css`, `css/home.css`, `partials/icons.html`, `js/motion.js`
and `assets/art/`, and is the system the remaining pages are being
rebuilt onto.*

### The extended palette

The three founding colours are unchanged in value and every original
token name still resolves. What was added is *altitude*: more steps of
the same navy, more weights of the same gold, a warm neutral ramp, and a
small set of supporting colours each bound to one meaning.

The governing rule: **a colour earns its place by carrying a meaning — a
ground, a state, a kind of information — not by adding variety.** A
green that sometimes means "achievement" and sometimes means "a nice
green" has stopped meaning anything.

| Group | Tokens | Role |
|---|---|---|
| Blues | `--oxford` `#0A1428` · `--midnight` `#0E1B33` · `--navy` `#14264A` · `--royal-blue` `#1F3D7A` · `--sapphire` `#27508F` · `--steel` `#4A6491` · `--cerulean` `#6E93C4` | Page floor → hero → header → interactive → lifted grounds → rules on dark → readable light-blue on dark |
| Golds | `--gold-royal` `#C7A24A` · `--gold-rich` `#D4AF37` · `--gold-antique` `#A8863C` · `--gold-soft` `#E7C97A` · `--gold-champagne` `#F2E3C0` · `--bronze` `#8C6A3F` | Hairlines → seals and crest → pressed states → headings on dark → display figures on dark → small caps on **light** |
| Neutrals | `--warm-white` `#FDFBF6` · `--cream` `#FAF6EC` · `--ivory` `#F7F4EC` · `--pearl` `#F1EDE3` · `--stone` `#E4DED0` · `--grey-soft` `#C9C6BE` · `--slate` `#4B5768` · `--charcoal` `#2A2F38` · `--ink` `#16202E` | Warm throughout. A cool grey beside this navy reads as a dashboard; a warm one reads as paper. |
| Supporting | `--emerald` `#1E6A4F` · `--burgundy` `#6E1F2E` · `--oxblood` `#A32638` · `--purple` `#3E2A56` · `--teal` `#1D5C63` · `--amber` `#C98A16` · `--silver` `#B9BCC2` | Achievement · ceremony · rare emphasis · honours and governance · platform and technology · attention (never error) · secondary |

**Gold is never small text on a light ground.** Gold on paper computes
to roughly 2.3:1, well under AA. On `--warm/--cream/--pearl/--ivory/
--paper`, small-caps and icon strokes switch to `--bronze` and numerals
to the chapter's own accent. This substitution already existed for
`.card__num` and `.ledger th`; it now covers `.chapter__num`, `.icon`
and `.feature-list__icon` too.

### Chapter colour worlds

Sections no longer alternate light/dark. Each chapter has its own
ground, so a reader can tell which chapter they are in from the colour
alone — the way they could from the paper stock of a printed
prospectus.

| Chapter | Ground | Accent |
|---|---|---|
| Hero | oxford → midnight, gold guilloché | champagne |
| I · The Promise | warm-white | burgundy |
| II · The Programme | midnight | champagne, foil heading |
| III · The Curriculum | pearl | teal |
| IV · The Digital Campus | navy → midnight, teal wash | cerulean |
| V · Who It Is For | cream | emerald |
| VI · The Principles | oxford + purple and burgundy wash | gold-rich |
| Closing | oxford, gold sweep | gold-rich |

### The icon set

Twenty-five symbols in `partials/icons.html`, injected after `<body>` on
every page by `scripts/build.js` and used as
`<svg class="icon"><use href="#i-quill"/></svg>`.

All are drawn on a 24×24 grid at 1.25px, square terminals, mitred joins,
no fills — so the set reads as one engraving tool rather than as icons
collected from three libraries, which is the commonest way an
institutional site gives itself away as a template.

`i-crest` · `i-laurel` · `i-quill` · `i-book` · `i-portico` · `i-globe` ·
`i-seal` · `i-ledger` · `i-waveform` · `i-mortarboard` · `i-scales` ·
`i-compass` · `i-clocktower` · `i-key` · `i-envelope` ·
`i-shield-check` · `i-progress` · `i-calendar` · `i-passport` ·
`i-columns` · `i-arrow` · `i-linkedin` · `i-instagram` · `i-x` ·
`i-language`

Icons inherit `currentColor`, which is why the sprite is inlined rather
than linked: `currentColor` does not inherit across an external `<use>`
reference in several browsers.

### The engraved plates

`assets/art/` — authored, not sourced. No stock, no raster.

- `guilloche.svg` — banknote rosette, **generated** by
  `scripts/art/generate-guilloche.mjs` from three layered hypotrochoids.
  Deterministic; re-runnable; diffable. Placed once per section,
  centred and masked — never tiled, because a repeating field of
  identical discs reads as wallpaper.
- `crest-plate.svg` — the full arms in vector, replacing the old
  dependency on blending `crest-seal.jpg` with `mix-blend-mode: screen`
  to hide its own navy background (a trick that only ever worked over a
  dark ground).
- `portico.svg` · `library-plate.svg` · `globe-meridian.svg` ·
  `astrolabe.svg` — the four chapter plates.
- `laurel.svg` — the closing seal.

The plate frame (`.plate`) is **deep navy on every ground, including the
cream ones.** Gold line art at 1px disappears on pearl, and a dark plate
inset into a cream page is what a tipped-in intaglio plate looks like in
a printed book.

### Motion

Eight behaviours in `js/motion.js`, and no more. Motion here shows
*structure* — that a chapter has begun, that a figure is being counted,
that the header has detached from the hero — never that the site can
animate.

1. **Header condense** — shrinks past 90px scroll, with hysteresis at
   40px so a trackpad overscroll cannot make it flicker.
2. **Split-text rise** — words rise from a mask, 55ms apart. The
   original string is preserved in `aria-label` and the spans are
   hidden from the accessibility tree.
3. **Drawn rules** — gold hairlines draw from the leading edge.
4. **Stat count-up** — easeOutExpo, tabular figures, and the authored
   string restored exactly at the end.
5. **Typewriter** — exactly one line, and never the `<h1>`.
6. **Chapter rail** — generated from `[data-chapter]` sections, so it
   cannot fall out of step with the page; inverts over light chapters.
7. **Plate drift** — 44s ken-burns, ambient rather than tracked.
8. **Wax seal** — presses in once on the closing CTA.

**`prefers-reduced-motion` is honoured in both places.** The CSS block
at the end of `brand.css` is the single source of truth for CSS
animation; `motion.js` reads the same query. Every carve-out resolves to
the **finished** state, never a hidden one — an entrance animation that
is merely disabled leaves the element at `opacity: 0`, which for a
reader with vestibular sensitivity is not a calmer page but a blank one.

---

## Part IV — Open Decisions

1. **Bilingual (English + Arabic RTL)** — decided and built, **for the
   public marketing site**. Every English page under `pages/manifest.json`
   has a full Arabic counterpart under `/ar/`, sharing one `[dir="rtl"]`
   design system (structural mirrors, Amiri/Cairo fallbacks) rather than
   a translation-plugin afterthought. A native Arabic speaker should
   still review the translated copy before this goes live — particularly
   institutional/legal phrasing on the Tuition and Contact pages. This
   discipline has **not** been extended to the newer authenticated
   dashboard layer (`/student-portal/preview/*`, `/finance/preview/`) —
   those are English-only with no `[dir="rtl"]` build — Executive
   Decision #6 confirms this gap's resolution sequencing explicitly:
   Student Portal Arabic localisation begins once the English Student
   Portal itself reaches production quality, not before, though the
   architecture (see `docs/auth-architecture.md`) is built to support
   RTL from the outset rather than needing a retrofit when that work
   starts.
2. **Full multi-page site** — decided and built (10 English pages / 10
   Arabic pages — see `site-architecture.md`). Course Catalogue and Blog/
   News were deliberately not built as separate pages in this pass (see
   that document for the reasoning); Testimonials were deliberately not
   fabricated (see below).
3. **Testimonials** — not written. WEC-LC has no enrolled students yet, so
   named or quoted testimonials would be fabricated claims from people who
   don't exist. This is called out explicitly rather than left as a silent
   gap, consistent with the rest of the honesty discipline in this bible.
4. **Student Portal backend and LMS backend are both now real code; no
   real curriculum content exists yet.** The Student Portal backend
   (Clerk auth, D1 schema, enrolment/payment data) and the LMS backend
   (content model, quizzes, assignments, progressive unlock — see
   `docs/lms-architecture.md`, Milestone 1) are both written and
   functionally tested code — see `docs/auth-architecture.md` and
   `docs/api-reference.md` § Student — though nothing is *live*: both
   activate the moment a real Clerk key and Cloudflare/D1 credentials
   exist, not before. What genuinely doesn't exist yet is real
   curriculum content — no lesson, quiz, or assignment for any of the
   six levels is seeded anywhere, because inventing one would be
   exactly the kind of fabricated institutional fact this bible exists
   to prevent; that's real WEC-LC academic staff's work (see
   `docs/lms-architecture.md`'s Milestone 2). The public Student
   Portal *page* stays a preview either way, with an honest "request
   early access" path (a `mailto:` link), not a fake login form.

This bible will be extended as those decisions are revisited and as real
operational data arrives to retire the remaining placeholders.
