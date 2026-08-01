# WEC-LC Dashboard Design System

*Companion to `editorial-bible.md` (marketing-site brand system) and
`site-architecture.md`. This is the component layer for authenticated,
data-dense interfaces — `css/dashboard.css` — demonstrated today in the
Student Portal preview (`/student-portal/preview/`, `/student-portal/preview/profile/`)
and, as its first real instance beyond the Student Portal, the Finance
dashboard (`/finance/preview/` — see § Extending, below).*

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
| **Empty state** | `.empty-state`, `.empty-state__icon` | Rendered live by `js/finance-dashboard.js`'s access-denied state for a signed-in non-staff account; otherwise not forced into a panel — see below |
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

One of these now exists: the **Finance dashboard** (`/finance/preview/`,
`js/finance-dashboard.js`) is a real, functioning first instance of
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
