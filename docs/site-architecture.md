# WEC-LC — Site Architecture

*See `editorial-bible.md` for the brand system this architecture carries
through every page.*

---

## Site Map (v1.1 — built)

```
/                          Home — flagship digest
/about                     Vision, Mission, Core Values, Brand Character, Our Operating Model, Institutional Status
/academics                 Hub: curriculum areas, teaching methodology, digital learning environment
/academics/iefc            The IEFC Programme in full — 6-level ledger, CEFR mapping, assessment
/admissions                Who it's for, level self-assessment tool, the 5-step application journey; a real
                           application form (tries POST /api/admissions/apply first, falls back to mailto:
                           only if unreachable — see api-reference.md § Frontend Integration Pattern)
/admissions/tuition        Per-level pricing, what's included, additional fees, payment plans
/faculty                   Teaching philosophy, hiring standards, founding faculty roster status
/student-portal            Digital campus preview + early-access request
/student-portal/preview            Dashboard design preview — see below
/student-portal/preview/profile    Profile / Account Settings design preview — same pattern as above
/faq                       Accordion FAQ, now with matching FAQPage JSON-LD structured data
/contact                   Contact form (mailto-based only — not wired to a backend endpoint), direct lines, campus status
/404                       Branded not-found page

/ar/...                    Full Arabic (RTL) mirror of every indexed path above (not the three
                           /student-portal/preview* pages or /finance/preview — see below)

/finance/preview           Finance dashboard design preview — staff/admin-role-gated, English only,
                           not part of the Student Portal's page family (see below)
```

11 English content pages + 1 404, 11 Arabic content pages + 1 404, plus 3 hand-authored preview
pages outside the `pages/manifest.json` build (`/student-portal/preview/`,
`/student-portal/preview/profile/`, `/finance/preview/`) — 25 built HTML files with a `<meta>` tag
total, 20 of which are in `sitemap.xml` (the three previews and both 404 pages are intentionally
excluded).

### `/student-portal/preview*` and `/finance/preview` — why these aren't "just another page"

Added as the Phase 6 (dashboard UI system) and Phase 8 (Student Portal)
design deliverable: high-fidelity, front-end mockups of the student
dashboard, profile/account-settings screen, and (later, as the first
non-Student-Portal instance of the same pattern — see
`docs/dashboard-design-system.md`) a staff Finance dashboard, all built
on a shared `css/dashboard.css` component layer (app shell, level
stepper, stat tiles, status pills) so the eventual real portals don't
visually diverge from the marketing site. All three are deliberately:
English-only (no Arabic/RTL build exists for the dashboard layer —
flagged as a real gap, see `docs/executive-readiness-report.md`),
excluded from `sitemap.xml` and `robots.txt`, `noindex`'d, unlinked
from primary navigation, and carry a permanent "Design Preview — not a
live account" banner. Unlike a pure mockup, though, all three now load
real client-side auth (`js/portal-guard.js` + `js/clerk-loader.js`) —
with no Clerk key configured (the shipped state) they stay exactly the
static preview described here; once one is configured, the Student
Portal pages start showing a signed-in student's real enrolment/
payment data and the Finance page starts showing real reports to a
signed-in staff account. See `docs/auth-architecture.md`.

### Admissions level self-assessment

`/admissions/#self-assessment` (EN + AR): a client-side-only tool —
six CEFR-derived self-assessment statements map to a suggested IEFC
starting level. No backend, no data collected; explicitly framed as a
guide to Step 1 of the journey, not a replacement for the real
placement assessment in Step 3. Content (the six statements, per
level) lives in the page HTML as data attributes; the interaction
logic in `js/site.js` is language-agnostic.

---

## Consolidation Decisions

The original brief listed a longer set of sections: Home, About, Admissions,
Academic Programmes, IEFC Programme, Course Catalogue, Faculty, Tuition &
Fees, Student Portal, Learning Resources, Blog, News & Events, Contact, FAQ,
Online Application, Live Chat, Student Testimonials. Rather than build all
seventeen as thin, mostly-empty pages, several were deliberately folded or
deferred:

- **Course Catalogue** → folded into `/academics` and `/academics/iefc`.
  WEC-LC has one flagship programme (the IEFC) with six levels, not a
  catalogue of many courses — a separate catalogue page would either
  duplicate the IEFC page or sit empty until more programmes exist.
- **Tuition & Fees** → kept as its own page (`/admissions/tuition`) rather
  than folded into Admissions, since pricing is exactly the kind of
  reference material a visitor bookmarks or re-checks independently.
- **Online Application** → folded into `/admissions#apply`. There is no
  backend yet to receive a real online application (see `README.md`), so a
  dedicated "Online Application" page would either be a dead end or a form
  that looks functional but silently goes nowhere. The honest version is a
  clearly-labelled email-based application path, upgraded to a true online
  application once the Student Portal exists.
- **Learning Resources** → folded into `/academics#digital-campus` and
  `/student-portal`, which already describe the digital library and
  learning environment. A standalone "resources" page would be empty
  without real enrolled students to serve.
- **Blog / News & Events** → not built in this pass. A blog or news feed
  with fabricated articles would misrepresent WEC-LC as an operating
  institution with a publishing history it doesn't have yet. Recommended:
  add this once there's real institutional news to report.
- **Student Testimonials** → not built. WEC-LC has no enrolled students, so
  named or quoted testimonials would be fabricated. Documented explicitly
  in `editorial-bible.md` rather than left as a silent gap.
- **Live Chat** → not built. A chat widget with no one staffing it is worse
  than no chat widget; the `mailto:`-based Contact and Admissions flows are
  answered by a real person instead.

If/when WEC-LC needs any of the deferred sections for real (a live blog,
staffed chat, a multi-programme catalogue), they slot into this same
partials/manifest system as new pages — see `README.md` § Adding an English
page.

---

## Navigation Structure

**Topbar** (every page): admissions email, campus/admissions-open note,
language switcher, social links.

**Primary nav:**

```
[Crest] WorldWide English College        About   Academics ▾   Admissions ▾   Faculty   Student Portal   Contact   [Apply Now]
```

- **Academics ▾** → Programme Overview (`/academics`), The IEFC Programme
  (`/academics/iefc`)
- **Admissions ▾** → How to Apply (`/admissions`), Tuition & Fees
  (`/admissions/tuition`), FAQ (`/faq`)
- Everything else stays a flat top-level link — a short, confident nav for
  a single-programme institution, rather than deep nesting for its own
  sake.

**Footer** carries a Quick Links / Academics / Get in Touch pattern, linking
every top-level page plus academic sub-pages and FAQ.

---

## Per-Audience Journeys

**Prospective learner (any audience segment):** Home → Academics hub →
IEFC Programme → Tuition & Fees → Admissions → Apply (email).

**Someone unsure of their level:** Home or Academics → IEFC Programme
(CEFR ledger) → FAQ ("Do I have to start at Level I?") → Admissions.

**Someone evaluating credibility before committing:** any entry point →
About § Institutional Status or FAQ ("Is WEC-LC formally accredited?") —
answered honestly rather than funnelled past.

**Instructor interested in teaching:** Home → Faculty → "Enquire About
Teaching at WEC-LC" (email).

---

## URL & Technical Notes

- Flat, lower-case, hyphenated slugs throughout (`/academics/iefc`, not
  `/academics?programme=iefc`).
- Shared `<head>`, header, and footer partials — a palette or type change
  happens once in `css/brand.css` / `partials/`, not across twenty files.
- `/ar/` mirrors this exact sitemap and URL structure rather than a
  separately organised translated site.
- The Student Portal, Apply, Faculty-enquiry, and Contact forms are all
  honest about not having a backend yet (see `README.md`) — they route to
  a real inbox (`mailto:`) rather than simulating a submission that goes
  nowhere.

## Status

**v1 built and live in this repository.** Next steps, in priority order:
confirm the physical London Campus address and named leadership (retires
the largest Institutional Status placeholders), stand up the real Student
Portal backend once hosting/infrastructure decisions are made, then revisit
Blog/News, Testimonials, and Live Chat once there's real content and staff
to support them.
