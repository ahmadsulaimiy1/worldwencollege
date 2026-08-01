# WEC-LC — Executive Readiness Report

*Supersedes the prior version of this file (which predated the entire
backend, auth, payments, financial-reporting, and student-dashboard
build, and is no longer accurate). Companion to `master-roadmap.md`
(governing plan), `technical-architecture.md`/`payments-architecture.md`/
`auth-architecture.md`/`api-reference.md` (backend), `site-architecture.md`/
`editorial-bible.md`/`dashboard-design-system.md` (frontend/content),
and `executive-decision-brief.md` (the detailed version of this
report's decisions section).*

**Status: engineering-complete for everything that doesn't require a
live third-party account or a business decision. Not ready for public
launch** — that's a different, later bar, gated by items in § Remaining
Executive Decisions and § Remaining External Dependencies below, not
by more code.

This report closes a full production-readiness audit: an independent
review across architecture, code quality, UX/UI, design-system
completeness, accessibility, responsiveness, performance, SEO,
security, admissions, authentication, payments, the Student Portal,
API design, database structure, documentation, error handling, loading/
empty states, edge cases, internationalisation, scalability, and
branding consistency. Findings were triaged into three buckets:
fixed now (no decision or credential needed), needs your decision, or
needs a real third-party account — nothing was left unclassified.

---

## Completed work

**27 commits** on `claude/worldwide-english-college-site-ezy1zo`, from
an empty repository to a complete bilingual public website, a written
and functionally-tested backend, and — this pass — a full
production-readiness audit with real fixes, not just findings.

### Public site
- 11 English content pages + full Arabic (`/ar/`) mirrors + branded
  404s — 22 pages built by `scripts/build.js` from `pages/manifest.json`,
  zero of them a stub.
- Full `EducationalOrganization` + `FAQPage` JSON-LD structured data
  (EN + AR), correct hreflang/canonical on every page, `og:locale`/
  `og:site_name`/`twitter:title`/`twitter:description` (previously
  missing), a recompressed social-share image (392KB → 61KB, visually
  identical), and `robots.txt`/`_headers` correctly scoped.
- Original component vocabulary across two CSS layers (`brand.css` for
  the marketing site, `dashboard.css` for authenticated/data-dense
  UI) — no framework, no template.

### Backend (Cloudflare Pages Functions + D1, written and tested, not deployed)
- **Admissions**: `POST /api/admissions/apply` — real form on
  `/admissions/`, tries the API first, falls back to a pre-filled
  `mailto:` draft only if unreachable, preserves the applicant's
  typed data across failures and reloads.
- **Auth**: Clerk, behind a swappable provider interface — JWT/JWKS
  verification and Svix webhook verification implemented natively (no
  SDK), client-side wired via a shared, reusable guard
  (`js/portal-guard.js` + `js/clerk-loader.js`) that any future portal
  can build on with only its own data-loading logic.
- **Payments**: four gateway adapters (Stripe, Paystack, Flutterwave,
  Opay) behind one provider-agnostic core; config-driven multi-currency
  (7 currencies seeded, only USD active — no fabricated exchange
  rates); a real webhook handler with two genuine race conditions
  found and fixed this pass (see § Verified capabilities).
- **Student Portal**: `GET /api/auth/me` + `GET /api/student/dashboard`
  replace the dashboard's illustrative programme-progress stepper,
  current-level tile, and payment history with a signed-in student's
  real data, the moment a real Clerk key is configured — until then,
  the preview pages are byte-for-byte the same static demo they always
  were.
- **Financial reporting**: `GET /api/admin/reports/{revenue,reconciliation}`,
  staff/admin-role-gated, backing a real Finance dashboard
  (`/finance/preview/`) — the first working instance of the shared
  portal pattern beyond the Student Portal.
- **17-table D1 schema** (`sql/schema.sql`) covering every payment
  feature named in the original brief (instalments, scholarships,
  promo codes, corporate invoicing, refunds, reconciliation) — some
  with working endpoints, some schema-ready pending a business
  decision (see § Remaining Executive Decisions), none guessed at.

### This audit's fixes (27 commits include 5 dedicated to this pass)
- **2 real concurrency blockers** in the payment webhook handler,
  fixed and proven with real signed-request tests.
- **6 security hardenings**: HTML injection into outbound emails,
  timing-safe signature comparison (5 call sites), an optional
  Clerk authorized-party check, and input-validation gaps that
  previously surfaced as raw 500s instead of clean 422s.
- **~15 accessibility/consistency fixes**: a real bug where
  `aria-disabled` sidebar links were still fully clickable, an
  auth-gate overlay that didn't trap keyboard focus, a WCAG-AA
  contrast failure, missing form-group semantics, and more — see the
  commit log for the full itemized list.
- **A real, committed, re-runnable test suite** (`npm test`) — closing
  this audit's most significant single finding: every "tested" claim
  in the docs previously referenced checks that ran in an ephemeral
  session and were never committed anywhere. That gap is now closed.
- **A full documentation-accuracy refresh** across all 9 pre-existing
  docs files, each cross-checked against the code it describes, not
  just reworded.

---

## Verified capabilities

Every claim above was checked, not assumed. Specifically:

- **`npm test`** — 33 backend files import-checked cleanly; **94
  functional assertions** against a real SQLite engine (`node:sqlite`)
  loaded with the actual `sql/schema.sql`, exercising the real,
  unmodified `functions/**` source. Covers admissions validation,
  currency conversion/routing, financial reporting and reconciliation
  query logic, student-dashboard per-student data isolation, the
  webhook handler's race-condition and partial-failure-recovery fixes
  (via real HMAC-SHA256 signed requests), and every new
  validation/security fix from this audit. Reproducible by anyone —
  see `tests/README.md`.
- **A 507-link internal link crawl** across all 54 built/hand-authored
  HTML files — zero broken links.
- **A full `[hidden]`-visibility crawl** across every built page —
  zero stray-visible elements (this closed a real CSS-cascade bug
  found and fixed earlier in the project's history and re-verified
  clean after every subsequent change).
- **Playwright browser automation** (not committed to the repo, but
  run this session — see the honesty note in `docs/api-reference.md`
  § Verification) confirming: the admissions form's try-API-then-
  mailto-fallback flow genuinely works end-to-end; the Student Portal
  and Finance dashboards behave identically to their shipped demo
  state with no Clerk key configured, and correctly replace
  illustrative content with real data (driven through a functional
  fake Clerk global, not just a happy-path check) once one is set.
- **A visual screenshot check** confirming the faculty-page
  section-alternation fix and the corrected italic-font rendering both
  look right, not just pass an automated check.

**What's genuinely not verified, and can't be from here:** anything
requiring a live Clerk/Stripe/Paystack/Flutterwave/Opay/Resend
account. Every cryptographic/signature-verification routine is
implemented against each provider's publicly documented scheme, not
exercised against a real instance of that provider. This is stated
plainly in `docs/auth-architecture.md` and `docs/payments-architecture.md`
rather than implied to be more complete than it is.

---

## Remaining external dependencies

Nothing further can be built against these without them existing for
real — this is a provisioning checklist, not a design or engineering
gap:

1. **Cloudflare account** — Pages hosting + D1 database (`wrangler.toml`'s
   `database_id` is a placeholder).
2. **Clerk account** — `CLERK_JWKS_URL`, `CLERK_WEBHOOK_SECRET`, a
   publishable key for `js/auth-config.js`.
3. **At least one payment gateway account** — Stripe is the most
   broadly applicable starting point; Paystack/Flutterwave/Opay matter
   most for the Nigeria/Africa market this platform was explicitly
   built to serve well.
4. **Resend account** (or a swap to another email provider behind the
   same interface) — `RESEND_API_KEY`, a verified sending domain.
5. **A domain DNS decision** — where `worldwencollege.co.uk` actually
   points once hosting is live.
6. **Cloudflare Turnstile account** (recommended, see decision brief
   item 3) — for admissions-form bot protection.

None of these can be provisioned by this session; all are a deploy-time
checklist once you're ready.

---

## Remaining executive decisions

Full detail, recommendations, and alternatives for each in
`docs/executive-decision-brief.md`. Summary:

**New or clarified by this audit:**
1. **Full-programme payment enrolment semantics** — does paying up
   front create all six enrolments immediately, or unlock them
   progressively? Blocks the already-advertised "$19,000 pay in full"
   option from actually being purchasable.
2. **Dashboard/Portal Arabic-RTL localization** — a real, scoped gap;
   recommend resourcing before the Student Portal itself goes live,
   not before this preview ships.
3. **Rate limiting / bot protection** on the public admissions
   endpoint — recommend Cloudflare Turnstile; currently zero
   protection exists, a pre-launch requirement once real traffic
   arrives.
4. Social-share image system and font self-hosting — both minor,
   both fine to leave as-is for now (see brief for reasoning).

**Carried over, unchanged by this audit** (still tracked in
`master-roadmap.md`): hosting/DNS confirmation, USD-vs-GBP pricing
policy, a named legal/compliance owner, which payment gateway(s) to
activate first, LMS vendor selection, refund policy, discount/promo-
code stacking policy, instalment plan cadence, and corporate invoicing
design (needs a real corporate client to design against).

---

## Recommended launch sequence

1. **Resolve the legal/compliance owner and data-protection review**
   (master-roadmap.md's standing #1 risk) — before any real applicant
   PII is collected, not after.
2. **Provision Cloudflare + Clerk + one payment gateway** (Stripe is
   the lowest-friction first choice) and run the real
   `wrangler d1 execute` against `sql/schema.sql` — the schema is
   ready today.
3. **Add Cloudflare Turnstile** to the admissions form (decision brief
   item 3) before it's reachable at a real, publicly-known domain.
4. **Decide currency/pricing policy** and activate the corresponding
   currencies in the `currencies` table — config change, no code.
5. **Confirm full-programme enrolment semantics** (decision brief item
   1) and wire `create-checkout.js` accordingly — a few hours of work
   once decided.
6. **Soft-launch the admissions flow first**, Student Portal second —
   the admissions API is the most self-contained, lowest-risk piece to
   validate against real traffic before trusting payment/auth flows to
   it.
7. **Localize the dashboard layer for Arabic** (decision brief item 2)
   before or alongside the Student Portal's real launch, given the
   platform's Gulf/Nigeria-weighted target market.
8. **LMS vendor selection** can happen in parallel with the above —
   it blocks course-content delivery, not admissions or payments.

---

## Post-launch roadmap

Once the Student Portal has real, first-cohort usage:

- **Faculty/Administration/Executive/Corporate/Alumni portals** — the
  pattern (`js/portal-guard.js` + the shared `dashboard.css` component
  library) is proven twice now (Student Portal, Finance); each new
  portal is a data-loading script and a role-gate decision, not a
  redesign.
- **Discount/scholarship/promo-code wiring** once pricing policy
  (decision brief) is confirmed.
- **Instalment plans and corporate invoicing** once their respective
  policy decisions and (for corporate) a real client relationship
  exist.
- **Refund workflow activation** once refund policy is decided —
  `refund()` is already implemented per-gateway, only the approval
  workflow is missing.
- **PDF receipt generation** — `receipts.pdf_url` is schema-ready.
- **A committed frontend (Playwright) test suite** — the backend now
  has one; the frontend verification done this session was real but
  not yet checked into the repository (see `docs/api-reference.md` §
  Verification).
- **Structured data expansion** — `BreadcrumbList` on nested pages, a
  `Course`/`EducationalOccupationalProgram` type for the IEFC page.

---

## Assessment of readiness for production

**Engineering: ready.** Every buildable piece — admissions, auth
wiring, payments architecture, financial reporting, the Student
Portal's real-data integration, and this audit's correctness/security/
accessibility fixes — is written, functionally tested against
everything short of a live third-party account, and documented
accurately (verified, not just re-asserted, this pass). The codebase
has no known blocker-severity defects remaining; the two genuine
concurrency bugs found this audit are fixed and proven.

**Content/brand: ready.** The public site is complete, bilingual,
internally consistent, and honest about what's confirmed vs. in
progress — no fabricated leadership, accreditation, testimonials, or
statistics anywhere, a discipline maintained throughout this entire
project including under direct requests to relax it.

**Operationally: not ready, by design, not by omission.** Nothing in
§ Remaining External Dependencies or § Remaining Executive Decisions
can be resolved by more code — they require real accounts, real money,
and real institutional decisions that are legitimately yours to make,
not mine to guess at. That is the accurate, final state of this
project: the distance between "engineering-complete" and "launched" is
entirely in your hands now, not in a backlog of unfinished work.
