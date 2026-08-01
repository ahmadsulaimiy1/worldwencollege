# WEC-LC Master Roadmap — Executive Blueprint

*Governing planning document. Companion to `editorial-bible.md` (brand
system) and `site-architecture.md` (public site IA). Status: **draft,
awaiting approval** — nothing beyond the public website described in
Phase 0 has been built.*

---

## How to Read This Document

Every claim below is tagged:

- **✅ Confirmed** — true today, in the live repository.
- **📋 Planned** — an approved direction for the next build step, not yet built.
- **🔭 Aspirational** — the long-term ambition from the founding brief. Real,
  worth planning for, but gated on decisions (budget, team, vendors, legal
  counsel) that belong to WEC-LC's operators, not to a coding session.

This mirrors the honesty discipline already established in
`editorial-bible.md` ("silence over invention") — applied here to *plans*
instead of *facts*.

---

## Executive Summary

The brief asks for fifteen parallel phases spanning brand, academics, a
public website, a student portal, an LMS, faculty/admin systems, a
technology architecture, an AI strategy, marketing, QA, and launch. Read
literally, that's a multi-million-pound, multi-year build for a team of
dozens. **My first recommendation, as your executive strategy office, is to
reject the parallel-phases framing.** Building eight portals and an AI
tutoring layer before a single real student has enrolled is how premium
institutions burn budget on infrastructure nobody uses yet. The plan below
keeps all fifteen domains — nothing is dropped — but sequences them by
*what unlocks revenue and trust fastest*, gated by real decisions at each
stage, rather than building everything at once.

**What's actually true right now:** WEC-LC has a complete, bilingual,
premium public website (Phase 0 below) and no confirmed budget, engineering
team, hosting account, payment processor, or legal/accreditation status.
Every phase from 8 onward assumes those get resourced; none of them can be
"built" for real inside a coding session without that resourcing existing
first. Where a phase can be substantially advanced today with what already
exists (design system, content, IA), I say so.

---

## Phase 0 — What's Already Built ✅

*Not in the original fifteen phases, but the roadmap is dishonest without
it: this is the actual current state.*

- Public website: 10 pages × 2 languages (EN/AR-RTL) = 20 pages — home,
  about, academics hub + full IEFC programme detail, admissions, tuition,
  faculty, student portal *preview*, FAQ, contact.
- Brand system: Royal Blue/Gold/Red palette, Playfair Display + Inter
  type, an original component language (ledger tables, dot-leader lists,
  stat rows, module markers) documented in `editorial-bible.md`.
- Static, no-framework build pipeline (`partials/` + `manifest.json` +
  `scripts/build.js`) — zero hosting cost, deployable to any static host
  today.
- Domain (`worldwencollege.co.uk`) and contact email
  (`info@worldwencollege.co.uk`) wired throughout.
- Honest placeholders (`.callout` components) everywhere a fact isn't
  confirmed yet — physical address, named leadership, accreditation,
  first-cohort date.
- **Not built:** any backend, database, authentication, payment
  processing, or the LMS/portals described from Phase 8 onward. All
  "Apply"/"Contact" flows are `mailto:`-based by design, not a stopgap bug.

---

## Recommended Sequencing (overrides the literal phase order)

| Stage | Phases (renumbered by priority) | Gate to enter |
|---|---|---|
| **A — Now, buildable today** | 1 (Discovery), 2 (Brand — done), 3 (Academic Architecture — done), 4 (public-site IA — done), 7 (Website — done) | None — already in progress/complete |
| **B — Pre-launch essentials** | 14 (QA/Compliance), 15 (staged Launch), 13 (Marketing groundwork), Admissions CRM (a *lightweight* Phase 8 slice) | A confirmed hosting/domain decision (done); a real inbox monitored (done) |
| **C — First real infrastructure spend** | Phase 11 (Technology Architecture — decision, not build), Phase 8 (Student Portal, MVP), Phase 9 (LMS, MVP) | Confirmed budget + at least one engineering hire or agency; a chosen payment processor; legal review of a data-protection policy for storing student PII |
| **D — Operate & prove it works** | Phase 10 (Faculty/Admin systems), Phase 12 (AI — narrow, supervised use only), continued 13 (Marketing) | A first real cohort enrolled through Stage C's MVP portal |
| **E — Scale** | Corporate portal, Alumni platform, mobile apps (parts of Phases 4/12/13) | A first graduating cohort; proven retention/outcomes data to justify the spend |

**Why this order:** a portal with no students is a cost centre; a website
with no admissions CRM behind it loses leads to an unmonitored inbox as
volume grows; an LMS built before the academic architecture (Phase 3, done)
would have had nothing correct to encode. Corporate/alumni platforms
literally cannot have real content before there are corporate clients or
alumni — building them now would mean fabricating placeholder "corporate
partners" the way `editorial-bible.md` already commits WEC-LC not to do.

---

## Phase 1 — Discovery & Institutional Strategy

**Status:** ✅ Substantially complete from prior sessions; this document is
its main remaining deliverable.

- **Objectives:** confirm what's real vs aspirational; surface gaps before
  design/build work compounds them.
- **Gaps identified:**
  1. No confirmed legal entity status, accreditation pathway, or
     data-protection registration for a UK-based institution handling
     international student data (GDPR/UK GDPR applies the moment a real
     application form collects an EU/UK resident's data).
  2. No named leadership, faculty, or physical premises — every
     "About"/"Faculty" page is currently an honest placeholder, which is
     sustainable for a pre-launch marketing site but not for an accredited
     institution accepting tuition.
  3. No confirmed payment processor for the $19,000 tuition flow —
     required before Phase 8 can move past MVP.
  4. Tuition is denominated in USD; the domain and email are UK (`.co.uk`).
     **Recommendation:** decide GBP vs USD pricing deliberately (currency,
     UK VAT-on-education treatment, and international-student psychology
     all point different directions) rather than leaving it as an
     unexamined default.
- **Risks:** proceeding to Phase 8+ without resolving #1 and #3 exposes
  WEC-LC to real legal and financial risk the moment a real application is
  accepted.
- **Deliverable:** this roadmap, plus an explicit decision log (see
  "Decisions Needed From You" at the end).
- **Effort:** already spent; the remaining item is your review.

---

## Phase 2 — Brand Identity System

**Status:** ✅ Complete for v1; logo/photography are the two open items.

- **Delivered:** colour system, typography, component/motif language, tone
  of voice — all documented in `editorial-bible.md`.
- **Deliberately not yet done:**
  - **Logo:** the current header/footer mark is a CSS/SVG shield-and-
    monogram placeholder, not a designed logotype. **Recommendation:**
    commission a proper mark before any print collateral or the mobile app
    icon (Phase 4/E) — a CSS shield reads fine on a webpage, not on a
    business card or app store listing.
  - **Photography/illustration style:** documented direction exists
    (`editorial-bible.md` § Photography Direction) but zero real assets —
    the site currently uses no photography at all, by design, rather than
    stock photography.
- **Risk:** a rushed logo commission to "unblock" the mobile app phase
  later is how brands end up with two inconsistent marks. Budget real time
  for this before Stage E.
- **Effort:** logo — 2–3 weeks with a designer; photography — ongoing,
  starts the moment there's a real campus/cohort to photograph.

---

## Phase 3 — Academic Architecture

**Status:** ✅ Complete and published (`/academics/iefc/`).

- **Delivered:** IEFC framework (6 levels, CEFR A1–C2, 720 units/24
  months), curriculum areas, teaching methodology, assessment structure
  (weekly/monthly/mid-level/final + capstone), tuition and per-level
  pricing.
- **Explicitly not yet defined — flagged, not invented:**
  - Formal learning outcomes per level (what a graduate of Level III can
    *demonstrably do* — needed for any future accreditation submission,
    not just marketing copy).
  - A quality-assurance framework (who moderates assessments, how grade
    consistency is checked across instructors) — required before hiring
    faculty at scale.
  - External accreditation pathway (British Council accreditation for UK
    English-language centres is the standard route worth evaluating).
- **Recommendation:** draft formal learning outcomes and a QA framework
  *before* Phase 10 (faculty hiring/operations) — hiring instructors
  against an undefined quality bar produces inconsistent teaching that's
  expensive to fix retroactively.
- **Effort:** learning outcomes + QA framework — 2–4 weeks with an academic
  consultant; accreditation pathway — a multi-month external process once
  pursued.

---

## Phase 4 — Digital Information Architecture

**Status:** 📋 Public site done; everything else is architecture-only
planning until Stage C/D resourcing exists.

**System map (target state):**

```
Public Website  ──▶  Admissions CRM  ──▶  Student Portal ──▶ LMS
                                              │                 │
                                     Payments/Finance    Faculty Portal
                                              │                 │
                                     Executive Dashboard ◀── Admin Portal
                                              │
                              (Stage E) Corporate Portal · Alumni Platform · Mobile Apps
```

- **Relationships that matter:** the Student Portal and LMS are the same
  system from a student's point of view but should be architected as
  separate services (portal = identity/records/payments; LMS = content
  delivery/assessment) so a future LMS vendor swap doesn't require
  rebuilding identity and payments.
- **Public website's role going forward:** stays the single source of
  truth for programme facts (curriculum, pricing) that the portal/LMS
  *read from* rather than duplicate — avoids the classic failure mode of a
  marketing site and a portal quoting different tuition figures.
- **Risk:** building the Admin Portal and Executive Dashboard before the
  Student Portal has real usage data means designing dashboards for
  numbers that don't exist yet. Sequence dashboards *after* MVP portal
  usage, not before.
- **Effort:** full architecture spec (data model, API contracts between
  systems) — 3–4 weeks with a solutions architect, once Stage C is funded.

---

## Phase 5 — User Experience (UX)

**Status:** 📋 Public-site UX done; portal/LMS UX is design-only until
Stage C.

- **Done today:** the five-step admissions journey, the FAQ-driven
  objection-handling flow, and mobile-responsive layouts across all 20
  pages (verified visually, not just described).
- **Planned (design work that can start before engineering, cheaply):**
  - Student lifecycle map: enquiry → placement test → offer → payment →
    onboarding → Level I–VI → capstone → certificate → alumni.
  - Faculty workflow map: lesson delivery → grading → progress reporting
    → escalation of at-risk students.
  - Accessibility target: WCAG 2.1 AA for the public site (already largely
    met via semantic HTML, colour contrast, `prefers-reduced-motion`
    support — should be formally audited, not just assumed).
- **Recommendation:** commission the student-lifecycle and faculty-workflow
  maps *now*, on paper/Figma, in parallel with Phase 1's legal review —
  they cost design time, not engineering time, and de-risk Phase 8/9
  significantly before any code is written.
- **Effort:** UX mapping for portal + LMS — 4–6 weeks with a UX designer;
  formal accessibility audit of the current site — 1 week.

---

## Phase 6 — User Interface (UI) — Design System Extension

**Status:** 📋 Marketing-site component library done; a portal/dashboard
component library doesn't exist yet.

- **Done today (`css/brand.css`):** buttons, cards, ledger tables, stat
  rows, forms, accordion, tag rows, CTA bands — a real, working component
  set, just scoped to marketing pages, not data-dense interfaces.
- **Gap:** none of today's components handle *data-dense* UI — a student
  dashboard with a progress chart, a faculty gradebook, an admin data
  table with sort/filter — that's a different design problem (density,
  real-time state, empty/error/loading states) than a marketing page.
- **Recommendation:** extend the existing design tokens (the same
  `--royal`/`--gold`/`--red` palette, same type system) into a second,
  dashboard-oriented component set — rather than a visually disconnected
  "app" that doesn't feel like the same institution. This is a real risk
  in EdTech builds: the marketing site looks premium, the portal looks
  like generic SaaS.
- **Effort:** dashboard component library — 4–6 weeks with a UI designer +
  frontend engineer, once Stage C begins.

---

## Phase 7 — Website Design

**Status:** ✅ Complete (see `site-architecture.md` for full per-page
rationale: purpose, audience, consolidation decisions already made and
justified there — not repeated here).

- **Outstanding from a marketing-effectiveness lens, not a build lens:**
  - No analytics installed yet (no GA4/Plausible/etc.) — **recommend
    deciding this before launch**, not after, so Stage B's launch isn't
    flying blind on conversion data.
  - No structured data (Course/EducationalOrganization schema.org
    markup) — cheap SEO win, ~1 day of work, worth doing before Phase 15
    launch.
- **Effort:** analytics install — trivial; schema.org markup — 1 day.

---

## Phase 8 — Student Portal

**Status:** 🔭 Aspirational until Stage C is funded. Below is the MVP scope
I'd recommend *for the first real build*, not the full brief's ambition.

- **MVP scope (Stage C):** account creation post-payment, a dashboard
  showing current level/progress, a document/transcript download, and a
  secure messaging channel to Admissions. This alone replaces the
  `mailto:`-based flows and lets WEC-LC accept its first real cohort.
- **Deferred past MVP, by design:** in-portal live-class hosting
  (Phase 9 territory — use an existing video platform embedded, don't
  build video infrastructure from scratch), automatic grading, and a
  full self-service payment-plan manager. Each is real scope; none of
  them blocks accepting the first cohort.
- **Dependencies:** a chosen auth provider (recommend Clerk or Auth0 over
  a hand-rolled auth system — session/PII handling is exactly where a
  bespoke build introduces security risk for no brand benefit), a chosen
  payment processor (Stripe is the standard fit for international tuition
  + instalments), and the GDPR/data-protection review from Phase 1.
- **Risks:** building this before Phase 1's legal review is resolved means
  potentially collecting real student PII and payment data under an
  undefined compliance posture — the single highest-risk item in this
  entire roadmap if sequenced wrong.
- **Success criteria:** a real applicant can pay, receive credentials, and
  see their enrolment status without an email round-trip.
- **Effort:** MVP — 8–12 weeks for a small team (1 backend, 1 frontend,
  part-time design), post-funding.

---

## Phase 9 — Learning Management System

**Status:** 🔭 Aspirational. **Recommendation: buy, don't build, for v1.**

- **Reasoning:** a bespoke LMS competing with Canvas/Moodle/Teachable-class
  maturity is a multi-year engineering investment for capability WEC-LC's
  brand doesn't actually depend on — students don't choose an English
  college for its LMS UI, they choose it for outcomes. Recommend
  integrating a proven LMS (or a lighter tool like Thinkific/LearnWorlds
  for content delivery) behind WEC-LC's own branded portal shell (Phase 8),
  rather than building live-class hosting, video infrastructure, and
  quiz/exam engines from scratch.
- **Where custom build *is* justified:** the competency-tracking/progress
  analytics layer that's specific to the six-level CEFR framework — that's
  WEC-LC's real IP, worth building once the underlying delivery
  infrastructure is bought, not built.
- **AI-assisted learning:** deferred to Phase 12 — explicitly not part of
  an MVP LMS.
- **Effort:** LMS integration (vendor + branded wrapper) — 6–10 weeks;
  bespoke competency-tracking layer — a further 6–8 weeks.

---

## Phase 10 — Faculty & Administration Systems

**Status:** 🔭 Aspirational, Stage D. Scope depends entirely on whether
Phase 9 is bought or built — a bought LMS likely already includes a
gradebook and scheduling; building a redundant one is waste.

- **Recommendation:** before specifying this phase further, complete Phase
  9's buy-vs-build decision — this phase's real scope is "what the chosen
  LMS/portal vendor doesn't already cover" (WEC-LC-specific reporting,
  the three-tier institutional sign-off pattern already established for
  policies in `editorial-bible.md`, finance reconciliation against Stripe).
- **Effort:** unknown until Phase 9 is resolved — placeholder, not a gap.

---

## Phase 11 — Technology Architecture

**Status:** 📋 A real decision, deliverable now, at low cost — this is the
one "backend" phase worth resolving before Stage C, not during it.

- **Recommended direction:** given the current static site is already on
  a JAMstack pattern (static build, no server), the lowest-friction path
  for Phase 8's MVP is a serverless architecture — e.g. Cloudflare
  Pages/Workers + D1 (SQLite-at-the-edge) or an equivalent
  (Vercel/Next.js + Postgres) — rather than provisioning traditional
  servers. This keeps hosting cost near-zero until there's real traffic,
  and keeps one team able to own both the website and the portal.
- **Security/compliance baseline (non-negotiable before Phase 8 ships):**
  encryption at rest and in transit, secrets management (never in the
  repo), rate-limited auth endpoints, and a documented data-retention
  policy matching Phase 1's legal review.
- **Explicitly deferred:** multi-region deployment, disaster-recovery
  drills, and formal SLA monitoring — real requirements once there's a
  paying cohort depending on uptime, over-engineering for a pre-launch MVP.
- **Effort:** architecture decision + baseline security setup — 2 weeks
  with a technical lead, before any Phase 8 code is written.

---

## Phase 12 — AI Strategy

**Status:** 🔭 Aspirational, Stage D at the earliest, and scoped narrowly.

- **Recommended, bounded uses:** placement-test scoring assistance
  (flagged for human review, never auto-final), writing-feedback
  suggestions inside assignments (assistive, not grading), and a
  site/portal support chatbot answering from WEC-LC's actual published
  content (no open-ended generation of institutional claims — the same
  "don't invent facts" discipline that governs this entire project applies
  doubly to anything AI-generated and published under WEC-LC's name).
- **Explicitly not recommended for v1:** AI as the primary tutor/instructor
  for a premium, human-led brand positioning — replacing the "expert
  instruction" the brand promise is built on with AI risks contradicting
  Phase 2's own brand character.
- **Governance requirement:** every AI-assisted output shown to a student
  must be labelled as AI-assisted, and every grade/certification decision
  must have a named human sign-off — extending the three-signature
  institutional pattern already established for policies.
- **Effort:** a bounded pilot (placement-test assist + support chatbot) —
  4–6 weeks, only after Phase 9's LMS is live and generating real usage
  data to ground it in.

---

## Phase 13 — Marketing & Growth

**Status:** 📋 Foundations exist; execution is ongoing, not a single build
phase.

- **Done today:** brand positioning, SEO-ready page titles/descriptions,
  bilingual reach (EN/AR), a coherent tone of voice.
- **Immediately actionable, low-cost:** analytics (Phase 7), schema.org
  markup (Phase 7), a content calendar for the deferred Blog/News section
  (see `site-architecture.md` — deliberately not built until there's real
  news to report).
- **Deferred, by design, until real traction exists:** corporate
  partnership outreach, alumni engagement, and referral programmes — all
  presuppose corporate clients or alumni that don't exist yet. Building
  marketing pages for these prematurely would mean fabricating the same
  kind of claims `editorial-bible.md` explicitly rules out.
- **Effort:** ongoing operational cost, not a fixed build; realistic to
  budget a part-time marketing function from Stage B onward.

---

## Phase 14 — Quality Assurance & Compliance

**Status:** 📋 Applies today to the website; expands in scope at each
later stage.

- **Website QA, done in this session:** visual verification via automated
  screenshots (EN + AR, multiple pages, both light-DOM and post-scroll
  states), build-script token verification (no unresolved `{{TOKEN}}`
  left in output), RTL correctness spot-checked.
- **Not yet done, recommended before Phase 15 public launch:**
  cross-browser testing beyond Chromium, a Lighthouse performance/
  accessibility pass, and a broken-link crawl across all 20 pages.
- **Compliance, expanding at each stage:** GDPR/UK GDPR readiness before
  Phase 8 collects PII (Phase 1); PCI-DSS scope minimisation by using
  Stripe/a compliant processor rather than handling card data directly
  (Phase 8/11); accessibility conformance (WCAG 2.1 AA) audited, not just
  assumed, before public launch.
- **Effort:** pre-launch QA pass — 1 week; ongoing compliance review —
  recurring, tied to each stage's scope.

---

## Phase 15 — Launch Strategy

**Status:** 📋 Staged plan below; nothing launched publicly yet pending
your review of this roadmap and Phase 1's open decisions.

| Stage | What launches | Gate |
|---|---|---|
| Internal review | This roadmap + current site, reviewed by you | Your approval |
| Soft launch | Public website goes live on `worldwencollege.co.uk`, admissions handled by real staff via `info@` inbox | Phase 1's legal/leadership gaps at least *acknowledged* publicly (current honest placeholders), DNS + hosting live |
| Founding cohort | Phase 8 MVP portal live, first paying students | Stage C funded and built, Phase 1's PII/payment compliance resolved |
| Public launch (full marketing push) | Paid acquisition, PR, partnership outreach | A founding cohort successfully through at least Level I–II, giving real (not fabricated) proof points |
| Continuous improvement | Iterate on portal/LMS based on real usage data | Ongoing |

- **Recommendation:** the soft launch (website live, admissions by email)
  can happen **immediately** — it requires no new build, only a hosting/
  DNS decision. Don't hold the whole institution hostage to Phase 8's
  timeline when the website is genuinely ready today.

---

## Decisions Needed From You Before Further Build Work

This roadmap deliberately stops short of writing code for anything beyond
Phase 0. The next session should start from whichever of these you resolve:

1. **Hosting/DNS** — where should `worldwencollege.co.uk` actually point?
   (Netlify/Vercel/Cloudflare Pages are all zero-cost fits for the current
   static build.)
2. **Currency & pricing** — confirm USD tuition stands, or convert to GBP.
3. **Legal/compliance owner** — who reviews data protection before any
   real application form goes live?
4. **Payment processor** — Stripe (recommended) or an alternative?
5. **Auth provider** — Clerk/Auth0 (recommended) or in-house?
6. **LMS: buy or build?** — my recommendation is buy-and-wrap (Phase 9);
   confirm or override.
7. **Budget/team for Stage C** — what's actually resourced, and by when?

Once any of these are answered, I can turn the relevant phase from
🔭/📋 into active implementation.
