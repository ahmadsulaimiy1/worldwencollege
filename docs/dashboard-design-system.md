# WEC Dashboard Design System

*Companion to `editorial-bible.md` (marketing-site brand system) and
`site-architecture.md`. This is the component layer for authenticated,
data-dense interfaces — `css/dashboard.css` — demonstrated today in the
Student Portal preview (`/student-portal/preview/`, `/student-portal/preview/profile/`)
and, as its first real instance beyond the Student Portal, the Finance
dashboard (`/staff-finance.html` — see § Extending, below).*

---

## Why this exists as its own layer

`css/brand.css` is tuned for a marketing page: generous whitespace,
editorial type, persuasive copy. A dashboard is scanned and operated,
not read — different density, different components (data tables, stat
tiles, status pills, empty/loading/error states), same tokens (colour,
type, radius) so the eventual real portal doesn't visually diverge from
the institution it belongs to. That's the failure mode this file exists
to prevent: a premium marketing site bolted to a generic-SaaS-feeling
app.

## Standing design principle (permanent)

> **Every screen should be polished enough to appear in an accreditation
> visit, an investor presentation, a university partnership meeting, or
> an international marketing brochure without requiring redesign.**

Adopted as a permanent standard, not a milestone. It applies to every
surface the platform has and every surface it will gain, and it is
deliberately phrased as four *audiences* rather than a checklist,
because those four judge different things and a screen has to survive
all of them at once:

| Audience | What it looks at |
|---|---|
| Accreditation visit | Whether governance, evidence and academic status are stated honestly and legibly — including what is *missing* |
| Investor presentation | Whether the thing is real and operating, not a prototype in a screenshot |
| University partnership meeting | Whether an academic peer recognises the qualification structure and the record-keeping |
| International marketing brochure | Whether it stands up at print resolution, in another language, out of context |

The practical consequence is that there is no such thing as an internal
screen to be tidied later. An admin table, an error state, an empty
state and a "nothing has been assessed yet" state are all screens a
reviewer can be shown, so each is designed once, properly.

This does not license decoration over substance: the Truth-is-a-feature
rule outranks it. A screen must never look more complete than the
institution behind it actually is. Polish is how an honest statement is
presented, never a substitute for one.

## Executive Design Directive — premium experience standard

You issued a platform-wide directive: every visual surface — marketing
site, dashboards, every future portal — should read as elegant,
prestigious, refined, modern, and intentionally crafted (restrained
gold accents, considered depth/shadow, purposeful motion — page
transitions, section reveals, hover/button micro-interactions, card
animations, loading/success states, `prefers-reduced-motion`
alternatives throughout), with strict cross-surface consistency, and
without ever trading performance or accessibility for decoration. You
then explicitly re-prioritised this ahead of continuing Level II
curriculum work.

**Executed, at the token and component level, across both CSS layers
(`css/brand.css` and `css/dashboard.css` — one shared system, so
neither surface drifts from the other):**

- **Motion tokens.** One easing curve (`--ease-premium`, a considered
  ease-out) and a three-step duration scale (`--dur-fast/med/slow`)
  used everywhere instead of ad hoc per-rule timings, so every
  interaction across the platform decelerates the same way.
- **Elevation scale.** `--shadow-sm/md/lg` plus `--shadow-gold` (a
  warm-toned shadow reserved for the primary CTA's hover state) —
  replacing flat single-shadow/border-only surfaces with considered
  depth tiers.
- **Buttons.** A restrained diagonal shine sweep on hover (one signature
  micro-interaction on the platform's most-clicked element family,
  deliberately not repeated everywhere), a gold gradient fill, lift +
  shadow on hover, a press state on `:active`.
- **Cards.** A hairline gold accent rule that draws in from the left on
  hover, refined lift/shadow, consistent premium easing.
- **Navigation.** Dropdown menus now scale+fade in with the premium
  curve instead of a flat opacity toggle; menu items get a subtle
  indent-in on hover. The dashboard sidebar's active item gets a gold
  accent bar that animates in.
- **Hero.** A staggered entrance (headline → lede → CTA → stat row,
  80ms apart) on page load, and a 40-second ambient drift on the crest
  watermark — deliberately not scroll-triggered, since hero content is
  already in view at load; "parallax in spirit" without a scroll
  listener.
- **Scroll reveal, activated platform-wide.** `.reveal`/`.is-visible`
  (with its own `prefers-reduced-motion` handling) already existed in
  `brand.css` but was applied to almost nothing in practice. `js/site.js`
  now auto-tags every `.card`, `.stat-row__item`, `.pull-quote`, and
  `.callout` on any page with `.reveal` and gives siblings a short
  staggered cascade — every current and future page inherits this with
  zero HTML changes. Interactive elements (accordion items) are
  deliberately excluded from auto-reveal — see `js/site.js`'s own
  comment for why a focusable control briefly invisible before
  `IntersectionObserver` fires is a risk not worth taking.
- **Forms, tables, dashboard surfaces.** Focus glow alongside (never
  replacing) the existing accessible focus outline; table row hover
  states; stat tiles, panels, and settings groups all carry a resting
  elevation shadow instead of a flat border; interactive rows
  (`.class-row`, `.mini-list li` links, `.message-card`) get hover
  feedback.
- **The institutional crest.** You supplied reference artwork (crown,
  laurel wreath, shield with book/monogram/Union Jack, banner tagline)
  and confirmed — after an explicit check on the crown/flag symbolism,
  given this project's standing discipline against implying credentials
  WEC doesn't hold — that it should be used as designed. The full
  artwork (`assets/images/crest-seal.jpg`) now drives the favicon-
  adjacent icons (`apple-touch-icon.png`, `icon-512.png`), the social
  share image (`og-image.jpg`, composited onto the site's own
  `--royal-deep` tone), and the homepage hero watermark (blended in via
  `mix-blend-mode: screen`, which drops the artwork's own dark
  background out entirely against the hero's gradient, so the full
  crest reads without a visible image-rectangle edge). The small
  34×40px inline header/footer mark stays the existing lightweight
  vector shield — a raster crest of this detail degrades to mush at
  that size regardless of background handling, a legibility constraint
  distinct from the symbolism decision.
- **Verified, not just asserted.** Every change above was screenshotted
  before and after (`npm run build` + a headless Chromium pass), and
  the full backend suite (301 assertions) re-run to confirm zero
  regression — this pass touched no backend file.

**Deliberately not yet done, stated plainly:** Faculty, Administration,
Executive Dashboard, and Corporate portals don't exist as pages yet
(see `docs/master-roadmap.md`'s launch sequence) — there is nothing to
retrofit there; they inherit this token system automatically once
built. Deeper per-page choreography beyond what's listed above
(dedicated onboarding sequences, chart components — none exist yet
either — completion animations beyond the existing toast/skeleton
pair) remains open for a future pass if warranted. Mobile experience
was verified for regression (existing breakpoints untouched, reveal/
motion changes respect them) but not separately re-audited beyond
that.

## Executive Design Directive v2 — "The WEC Flagship Experience" (supersedes the v1.0 lock)

After the v1.0 pass above shipped, you explicitly locked the design
system ("Design System v1.0... do not continue making repeated
cosmetic refinements... only revisit later if a genuine usability,
accessibility, performance, or consistency issue is discovered") and
redirected effort to curriculum. Alongside the Level V curriculum
directive, you issued a new, broader directive — "THE WEC FLAGSHIP
EXPERIENCE" — explicitly covering every current and future surface
(website, LMS, student/faculty/admin/executive portals, mobile,
curriculum screens) and explicitly framed as standing, continuous
guidance ("do not treat design as a completed phase... as every new
feature is built, evaluate whether it reaches flagship quality"),
rather than a one-time pass. As the same authority that issued the
v1.0 lock, this directive supersedes it: it is now the **standing
design bar for all future UI work**, not a resumed one-off project.

**What this means in practice, going forward:**
- Any new UI surface built from here on (a new LMS feature, a new
  portal, a new page) is designed to this flagship standard from the
  start — world-class typography/spacing/composition/hierarchy,
  intentional premium motion (transitions, reveals, hover states,
  loading/onboarding sequences), and the full component list named in
  the directive (hero, nav, buttons, cards, forms, tables, charts,
  dashboards, calendars, lesson pages, quizzes, assignments,
  certificates, transcripts, profile pages, notifications, settings,
  progress indicators) — never something bolted on generically.
- Performance, accessibility (including `prefers-reduced-motion`), and
  maintainability remain non-negotiable alongside the visual bar, per
  the directive's own "Performance" section — beauty is never traded
  for speed or usability.
- This directive does **not**, by itself, trigger a fresh
  ground-up visual audit of already-shipped pages absent a concrete
  trigger (a new page, a genuine usability/consistency issue, or an
  explicit instruction to run a design pass) — consistent with this
  project's standing "curriculum drives platform" / "build when
  genuinely needed" discipline. Per your own sequencing in this same
  message ("Continue autonomously until Level V is fully completed"),
  Level V curriculum work — which is pure content (docs/SQL/tests) and
  triggers no new UI surface — proceeds first; this directive is
  logged here as the mandate that governs whenever UI work does come
  next (a new LMS feature genuinely required by curriculum, or an
  explicit design-pass instruction).

---

## Executive Design Mandate — "The Highest Standard of Prestige" (v3, permanent; supersedes v1.0 and v2)

Issued alongside the Level VI curriculum directive, and explicitly
framed by you as final: *"This directive supersedes every previous
design instruction and becomes the permanent design philosophy for the
entire WEC ecosystem… This level of quality is now the minimum
acceptable standard for every future page, feature, animation,
dashboard, and interaction built for WEC."*

It is recorded here as the governing standard. The v1.0 lock and the
v2 flagship directive above are retained as history — they explain how
the current CSS came to look the way it does — but where any of the
three differ, **v3 governs.**

### The standard, in the terms it was issued

**Brand emotion.** Every surface should communicate prestige,
distinction, academic authority, trust, elegance, sophistication,
warmth, aspiration, and confidence. Warmth is on that list
deliberately and is the hardest of the nine: prestige without warmth
reads as coldness, and an institution that teaches people to speak
cannot present itself as unapproachable.

**Design philosophy — "every pixel should have a purpose."** This is
the operative constraint and the one that makes the rest coherent. It
is a mandate for *restraint*, not for decoration: an element that
cannot justify its presence is removed, not refined. Luxury here is
achieved through what is left out.

**Premium materials.** Layered surfaces; subtle glass **only where it
improves clarity**, never as an effect; restrained shadows; tasteful
gold highlights; refined gradients; premium textures. Each of these is
qualified in the directive itself — *subtle*, *restrained*,
*tasteful*, *refined* — and those qualifiers are the instruction, not
padding.

**Motion and interaction — a signature interaction language.** Motion
should be identifiably WEC's: consistent easing, consistent
durations, consistent entrance behaviour, so that a transition on a
lesson page and a transition on a finance dashboard read as the same
institution. Motion must remain fully functional under
`prefers-reduced-motion`, which is not an accessibility footnote here
but part of the standard — a signature that breaks when a user needs
it off is not a signature.

**Editorial quality.** Typography, rhythm, and composition held to the
standard of a printed institutional publication rather than a web
template.

**Dashboard excellence.** Data density with hierarchy: a dashboard is
judged on whether the most important number is found first, not on how
much fits.

**Performance.** Fast, accessible, responsive, scalable, maintainable.
Explicitly non-negotiable and explicitly *not* tradeable against the
visual bar.

**Continuous design review.** The seven self-check questions in the
directive apply to every surface before it is called done. Design is
never a completed phase.

### What this means in practice

1. **Every new UI surface is built to this standard from the first
   commit** — not built generically and elevated later. There is no
   "make it work, then make it beautiful" path any more; the standard
   is a definition of done.
2. **Applies to the whole ecosystem**, not the dashboard alone: public
   site, LMS, every portal, mobile, and every curriculum-facing screen
   (lesson pages, quizzes, assignment submission, progress,
   certificates, transcripts).
3. **The three qualifiers govern the materials.** Glass only where it
   improves clarity; shadows restrained; gold tasteful. When in doubt
   between two treatments, the mandate's own philosophy resolves it:
   choose the one with fewer elements.
4. **Reduced-motion parity is part of the signature**, checked on
   every animated surface, not retrofitted.
5. **Verification is unchanged and still applies** — the Playwright
   discipline in § Verification discipline below is the mechanism by
   which "done" is demonstrated rather than asserted. A surface that
   has not been checked has not met the standard, however it looks in
   a screenshot.

### Where this standard lands first, concretely

This mandate was issued during curriculum work, and curriculum work
creates no UI surface — so, as with v2, logging it is the honest
action rather than launching a speculative visual pass over shipped
pages. But unlike v2, **there is now a specific, curriculum-earned UI
surface waiting for it.**

`docs/curriculum-programme-review.md`'s Finding 1 establishes by
measurement that all 114 lesson items across the six levels contain a
listening activity and a pronunciation practice, and that no audio
asset exists anywhere in the platform to carry them — the `video` and
`live_session` item kinds are seeded zero times. That review
recommends, as the programme's single highest-priority action, an
audio-bearing learning item and a listening-comprehension question
type.

That is the first UI work the completed curriculum has genuinely
earned, and it is where this mandate applies first: an audio player
and a listening-question interface built to the prestige standard from
the outset — a restrained, editorial player with a signature
transport and waveform treatment, transcript disclosure that improves
rather than clutters, and full keyboard and reduced-motion parity,
because a listening interface that is inaccessible has failed at its
own purpose before any question of elegance arises.

---

## Component inventory (all in `css/dashboard.css`)

| Component | Class(es) | Used today in the preview |
|---|---|---|
| App shell | `.app-shell`, `.app-sidebar`, `.app-main`, `.app-topline`, `.app-nav`, `.app-grid` | Full page layout, all three preview pages |
| Level/programme stepper | `.stepper-card`, `.stepper`, `.stepper__node/__dot/__label/__line`, `.progress-meter` | Programme Progress card — now driven by real enrolment data once signed in, see `js/portal-auth.js` |
| Stat tile | `.stat-tile`, `.stat-tiles` | Student dashboard's 4-tile row; Finance dashboard's revenue-totals row |
| Status pill | `.status-pill--good/progress/critical/muted` | Assignment/payment statuses, level badge |
| Panel | `.panel`, `.panel__head` | Classes, Assignments, Library, Certificates, Messages, Payment History, Revenue tables, Reconciliation Alerts |
| Data table | `.assign-table` (wrapped in `.table-scroll` for narrow-viewport overflow) | Assignments, Payment History, Revenue by Gateway/Level |
| Preview banner | `.preview-banner` | Top of all three preview pages — "Design Preview, not live" |
| Student card / avatar | `.app-student`, `.app-student__avatar/__name/__level` | Dashboard topline |
| Profile header | `.profile-header`, `.profile-header__avatar/__name/__meta/__id`, `.profile-header__avatar-edit` | Profile screen |
| Settings group | `.settings-group`, `.settings-group__head` | Profile screen's Account Info/Communication/Security groups |
| Preference row / toggle | `.pref-row`, `.pref-row__label/__desc`, `.toggle`, `.toggle__track` | Communication Preferences |
| Security row | `.security-row` | Profile → Security (deep-links into Clerk's own account UI once live — see `auth-architecture.md`) |
| Read-only field display | `.field-display` | Profile screen's disabled account fields |
| Message card | `.message-card`, `.message-card__from` | Dashboard → Messages |
| Class row | `.class-row`, `.class-row__when/__body` | Dashboard → Upcoming Classes |
| Mini list | `.mini-list` | Digital Library; Finance dashboard's reconciliation alert lists |
| Disabled note | `.disabled-note` | Small "activates once live" captions throughout |
| Auth gate | `.auth-gate`, `.auth-gate__spinner/__text` | Full-page loading overlay while `js/portal-guard.js` checks a real Clerk session — only ever rendered once a key is configured |
| **Empty state** | `.empty-state`, `.empty-state__icon` | Rendered live by `js/staff-finance.js`'s access-denied state for a signed-in non-staff account; otherwise not forced into a panel — see below |
| **Toast / notification** | `.toast-region`, `.toast`, `.toast--error` | Live demo: a reminder toast fires ~1.6s after load |
| **Loading skeleton** | `.skeleton`, `.skeleton--text`, `.skeleton--title` | Live demo: stat tiles load from skeleton → real content, both dashboards |

The three bolded rows are the direct answer to "define scalable design
patterns... without inventing institution-specific policies or data" —
they're intentionally generic. `.empty-state` doesn't say "No
assignments yet" baked into the CSS; the calling page supplies that
text. Same for `.toast` — the component has no opinion on what a
notification says, only how it looks and behaves.

### Empty state — why it isn't force-demonstrated live

Every real panel in the current preview has believable demo content, so
faking an empty one (e.g., "Digital Library — no resources yet") would
be inventing a false claim about the platform, the same category of
thing this whole project has avoided throughout. The component is built,
styled, and documented; it activates the first time a real panel (in
this portal or a future one) has genuinely nothing to show.

```html
<div class="empty-state">
  <div class="empty-state__icon">—</div>
  <h3>Nothing here yet</h3>
  <p>[Panel-specific, honest copy — supplied by the page, not the component.]</p>
</div>
```

## Extending to Faculty / Administration / Executive / Corporate / Alumni

One of these now exists: the **Finance dashboard** (`/staff-finance.html`,
`js/staff-finance.js`) is a real, functioning first instance of
this pattern applied beyond the Student Portal — a staff/admin-only
revenue and reconciliation view, backed by `GET /api/admin/reports/{revenue,reconciliation}`
(see `docs/payments-architecture.md` § Financial reporting &
reconciliation). It's the concrete proof the pattern generalizes, and
the reference to copy for Faculty/Administration/Executive/Corporate/
Alumni, not just an aspiration:

- **The shared auth-guard shell** (`js/portal-guard.js` +
  `js/clerk-loader.js`, see `docs/auth-architecture.md` § Client-side
  integration and the portal pattern) is what made building Finance
  fast — its own script is only the part that's actually specific to
  it (a role check via `/api/auth/me`, then fetching and rendering two
  reports). A new portal's script is the same shape: gate/redirect/
  sign-out come free, only the data-loading logic is new.
- **Role-gating is opt-in per portal, proven two ways already** — the
  Student Portal trusts any signed-in account (it's the student's own
  data); Finance additionally checks `role` before rendering anything
  sensitive. A future portal picks whichever its own data calls for.

None of Faculty/Administration/Executive/Corporate/Alumni are built as
*complete* portals — only the pattern and one real instance of it are.
What's built and directly reusable when the rest are:

- **Tokens** — the same `--royal`/`--gold`/`--red`/status-colour
  variables, so a Faculty gradebook or an Executive dashboard chart
  reads as the same institution on sight, not a different product.
- **Shell** — `.app-shell`/`.app-sidebar`/`.app-main` is role-agnostic;
  swap the sidebar nav items for that role's real menu.
- **Data density primitives** — `.panel`, `.assign-table` (any data
  table), `.stat-tile` (any KPI), `.status-pill` (any state) apply
  unchanged to a faculty roster, an admissions pipeline, or a finance
  reconciliation view once someone defines what columns/states those
  actually need.
- **States** — empty/loading/toast apply identically regardless of
  what's loading or what's empty.

What's deliberately **not** pre-built: an Executive Dashboard implies
real KPIs (enrolment, revenue, completion rate) that don't exist yet; a
Corporate Portal implies a real corporate-client data model; an Alumni
Platform implies actual alumni. Building any of those now would mean
inventing the very institution-specific data this document — and this
whole project — has consistently refused to fabricate. The moment real
requirements exist for any of them, they're a design exercise in
*applying* this system, not inventing a new one.

## Verification discipline

Every component in this file has been checked with Playwright before
being called done — not eyeballed:

- Skeleton → real-content swap: confirmed `.skeleton` count is 12 at
  load and 0 after the reveal timeout, and the previously-`hidden`
  content is visible.
- Toast: confirmed it reaches `.is-visible` with the expected text at
  the expected time, then removes itself.
- Contrast: every status-pill and toast text/background pairing checked
  against WCAG AA (see the fix log in `master-roadmap.md`'s QA phase).
