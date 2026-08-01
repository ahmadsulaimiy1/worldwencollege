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
- **Crest watermark** — a faint, oversized low-opacity shield mark on dark
  hero sections, echoing a letterhead seal without literal skeuomorphism.
- **Restrained motion only** — a hairline-paced scroll-reveal, respecting
  `prefers-reduced-motion`. No scroll-jacking, no gimmick animation.

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

---

## Part IV — Open Decisions

1. **Bilingual (English + Arabic RTL)** — decided and built. Every English
   page has a full Arabic counterpart under `/ar/`, sharing one
   `[dir="rtl"]` design system (structural mirrors, Amiri/Cairo fallbacks)
   rather than a translation-plugin afterthought. A native Arabic speaker
   should still review the translated copy before this goes live —
   particularly institutional/legal phrasing on the Tuition and Contact
   pages.
2. **Full multi-page site** — decided and built (10 English pages / 10
   Arabic pages — see `site-architecture.md`). Course Catalogue and Blog/
   News were deliberately not built as separate pages in this pass (see
   that document for the reasoning); Testimonials were deliberately not
   fabricated (see below).
3. **Testimonials** — not written. WEC-LC has no enrolled students yet, so
   named or quoted testimonials would be fabricated claims from people who
   don't exist. This is called out explicitly rather than left as a silent
   gap, consistent with the rest of the honesty discipline in this bible.
4. **Student Portal / LMS backend** — not built. The Student Portal page is
   a preview of what the digital campus will contain, with an honest
   "request early access" path (a `mailto:` link), not a fake login form.
   Building the real thing needs hosting, a database, and real student
   accounts — infrastructure decisions for WEC-LC's operators, not
   something to fabricate into this repo.

This bible will be extended as those decisions are revisited and as real
operational data arrives to retire the remaining placeholders.
