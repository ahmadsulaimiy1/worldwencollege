# WEC-LC Dashboard Design System

*Companion to `editorial-bible.md` (marketing-site brand system) and
`site-architecture.md`. This is the component layer for authenticated,
data-dense interfaces — `css/dashboard.css` — demonstrated today in the
Student Portal preview (`/student-portal/preview/`).*

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

## Component inventory (all in `css/dashboard.css`)

| Component | Class(es) | Used today in the preview |
|---|---|---|
| App shell | `.app-shell`, `.app-sidebar`, `.app-main` | Full page layout |
| Level/programme stepper | `.stepper`, `.stepper__node`, `.progress-meter` | Programme Progress card |
| Stat tile | `.stat-tile`, `.stat-tiles` | The 4-tile row |
| Status pill | `.status-pill--good/progress/critical/muted` | Assignment statuses, level badge |
| Panel | `.panel`, `.panel__head` | Classes, Assignments, Library, Certificates, Messages |
| Data table | `.assign-table` | Assignments |
| **Empty state** | `.empty-state`, `.empty-state__icon` | Documented, not forced into a live panel — see below |
| **Toast / notification** | `.toast-region`, `.toast`, `.toast--error` | Live demo: a reminder toast fires ~1.6s after load |
| **Loading skeleton** | `.skeleton`, `.skeleton--text`, `.skeleton--title` | Live demo: the 4 stat tiles load from skeleton → real content |

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

None of those are built. What *is* built and directly reusable when
they are:

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
