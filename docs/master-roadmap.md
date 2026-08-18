# WEC-LC Master Roadmap — Executive Blueprint

*Governing planning document. Companion to `editorial-bible.md` (brand
system) and `site-architecture.md` (public site IA). Status: **draft,
awaiting approval** — nothing beyond the public website described in
Phase 0 has been built. Part I (Phases 1–15) is the original roadmap;
Part II (Phases 16–20) is a continued executive review, added
unprompted, covering legal/regulatory, governance, financial, and brand
risk gaps the original fifteen phases didn't reach.*

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
premium public website plus a written-and-tested (but not live)
backend (Phase 0 below) and no confirmed budget, engineering team,
hosting account, activated payment processor account, or legal/
accreditation status. Every phase from 8 onward assumes those get
resourced; none of them can go *live* for real inside a coding session
without that resourcing existing first — code can be written and
tested against everything short of a real third-party account, which
is exactly what Phase 0's update below describes. Where a phase can be
substantially advanced today with what already exists (design system,
content, IA, backend architecture), I say so.

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
- **Update — Stage C has since been built as code, though nothing is
  live:** a full backend now exists (D1 schema, Clerk auth, four
  payment gateway adapters, admissions/enrolment/student-dashboard/
  admin-reporting endpoints — see `docs/technical-architecture.md`,
  `docs/payments-architecture.md`, `docs/auth-architecture.md`,
  `docs/api-reference.md`) and the admissions form now tries that real
  API first, falling back to `mailto:` only if it's unreachable — so
  "Apply"/"Contact" are no longer `mailto:`-only by design, they're
  `mailto:`-as-fallback. Written, functionally tested against a real
  SQLite engine (`npm test` — see `tests/README.md`), never exercised
  against a live Cloudflare/D1/Clerk/Stripe/Paystack/Flutterwave/Opay/
  Resend account, because none exists. "Built" here means "code exists
  and is tested against everything that doesn't require a live
  account" — not "deployed" or "live." The LMS/portal UI beyond the
  Student Portal (Faculty/Administration/Executive/Corporate/Alumni)
  genuinely isn't built — see `docs/dashboard-design-system.md` for
  what exists (a Finance dashboard, as the first non-Student-Portal
  instance of the shared portal pattern) versus what doesn't.

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

**Confirmed by Executive Decision #8:** Admissions → Payments →
Student Portal → LMS integration → Faculty Portal → Administration
Portal → Executive Dashboard → Corporate Portal → Alumni Platform →
Mobile Applications. This matches the reasoning above — Admissions and
Payments are both real, working backend code today (Stage A/B/C is
already substantially built for them); Student Portal + LMS Milestone
1 are in active development; Faculty/Administration/Executive/
Corporate/Alumni/Mobile remain Stage D/E, in that order, not yet begun.

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
  system from a student's point of view but are architected as separate
  services (portal = identity/records/payments; LMS = content
  delivery/assessment — see `docs/lms-architecture.md`) — the same
  separation-of-concerns discipline applied throughout this platform
  (auth/payments/notifications/currency each behind their own boundary),
  now including a proprietary LMS built in-house per Executive Decision #4.
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

**Status:** 🔨 Code written and functionally tested (`npm test`), not
live — distinct from "not started." The MVP scope below is
substantially built: `GET /api/auth/me` + `GET /api/student/dashboard`
+ `js/portal-auth.js` (`docs/auth-architecture.md`, `docs/api-reference.md`
§ Student) already replace the dashboard's illustrative programme-
progress stepper and current-level tile with a signed-in student's
real enrolment status, and add a real Payment History panel — but only
once a real Clerk publishable key is configured; today, with none set,
the Student Portal preview pages behave exactly as this section
originally described them (static demo). What's still genuinely
missing, not just unconfigured: document/transcript download and
secure messaging to Admissions have no backend at all (no table, no
endpoint) — those remain real scope, not just an activation step.

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

**Status:** 🚧 In active development, Milestone 1. **Superseded
recommendation, kept for record: this phase originally recommended
buy-don't-build (below). Executive Decision #4 explicitly overrode
that recommendation — WEC-LC now builds and owns its LMS as a
long-term strategic institutional asset. `docs/lms-architecture.md` is
the authoritative plan going forward; this entry stays as a record of
the reasoning that was weighed and deliberately overridden, not as
current guidance.**

- **Original reasoning (overridden):** a bespoke LMS competing with
  Canvas/Moodle/Teachable-class maturity is a multi-year engineering
  investment for capability WEC-LC's brand doesn't actually depend on —
  students don't choose an English college for its LMS UI, they choose
  it for outcomes. The counter-consideration the executive decision
  weighed: a proprietary LMS is a defining, differentiated institutional
  asset rather than a rented commodity, and WEC-LC's own engineering
  capacity (this project) makes "build" a materially lower-cost path
  than the market-rate estimate above assumed.
- **What's actually being built, and how it stays scoped:** phased
  milestones (M1: content model + assignments/quizzes + progressive
  unlock — in progress; M2+: grading depth, live-class/video wiring,
  analytics — see `docs/lms-architecture.md`), each shipped as tested,
  working code rather than a single all-at-once build — the discipline
  this roadmap's other phases already apply.
- **AI-assisted learning:** deferred to Phase 12 — explicitly not part of
  an MVP LMS.
- **Effort:** superseded — see `docs/lms-architecture.md` for the current
  milestone-by-milestone scope and status instead of a single estimate.

---

## Phase 10 — Faculty & Administration Systems

**Status:** 🔭 Aspirational, Stage D. Phase 9's buy-vs-build question is
now resolved (build — see above), so this phase's scope is the
Faculty/Administration surfaces of WEC-LC's own LMS (gradebook,
scheduling, staff-facing reporting) rather than "wrap whatever a
vendor doesn't cover" — sequenced per Executive Decision #8's launch
order (Faculty Portal after Student Portal + LMS integration,
Administration Portal after that).

- **Recommendation (partially superseded by the above):** this phase's
  real scope is "what the LMS's own content/assessment layer doesn't
  already cover" (WEC-LC-specific reporting,
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

# Part II — Institutional Readiness Review

*Added on continued executive review, not requested in the original
fifteen phases. These are gaps a strategy firm would raise unprompted
before presenting a roadmap to a Board — not restatements of Part I.*

## Phase 16 — Regulatory & Legal Readiness (UK-Specific)

**Status:** 🔭 Not addressed until now. **None of this is legal advice —
every item needs sign-off from a UK solicitor before you rely on it. My
job here is to make sure the right questions reach that solicitor, not to
answer them myself.**

- **Company name risk.** "University" cannot be used in a UK company name
  without Privy Council consent — settled law. Whether "College" carries
  a similar restriction under Companies House's "sensitive words" regime
  is less certain from where I sit; **treat this as unresolved, not
  cleared**, and run the formal sensitive-words check before incorporating
  WEC-LC as a UK entity under this name.
- **Registered office.** Regardless of whether a teaching campus ever
  exists, a UK limited company needs a registered office address on file
  with Companies House. This is separate from, and cheaper/faster than,
  the "physical London Campus" question in `about.html`'s Institutional
  Status callout — resolve it first, independently.
- **Data protection.** The moment a real application form collects a real
  applicant's data, UK GDPR applies and ICO registration (a modest annual
  fee, tiered by size) is very likely required. This should land on
  whoever owns Decision #3 in the original list, with a named person
  functioning as Data Protection Officer even before a full-time hire
  exists — a "fractional DPO" service is a reasonable bridge.
- **Immigration/visa sponsorship — good news, not a gap.** A UK Student
  Sponsor Licence (needed to issue a CAS and sponsor a Student visa) is
  only required for institutions delivering **in-person** study in the
  UK. As currently marketed ("100% Online Digital Campus"), WEC-LC likely
  avoids this entire regulatory track — a real advantage worth *keeping*
  deliberately, not losing by accident if Phase 16's naming question (see
  Phase 19) drifts toward implying in-person delivery.
- **Safeguarding.** The target-audience list explicitly includes "school
  pupils" and "secondary school students." A fully online, supplementary
  (non-full-time) English course is unlikely to trigger Ofsted
  registration as an independent educational institution — but that's a
  *floor*, not a safeguarding standard. Recommended regardless of legal
  minimum: DBS-equivalent checks for any instructor who may work with
  under-18s, a written online-safety/safe-messaging policy, and parental
  consent capture for applicants under 13 (the UK's threshold for a
  child's own consent to an online service) built into Phase 8's
  onboarding flow from day one, not retrofitted later.
- **Advertising claims.** UK marketing is governed by the ASA's CAP
  Code — claims must be accurate and not misleading. See Phase 19 for the
  specific claim this roadmap flags as currently ambiguous.
- **Effort:** a single scoping call with a UK solicitor experienced in
  EdTech/private education (2–4 hours) can answer the company-name,
  registered-office, DPO, and safeguarding-registration questions
  together — cheaper done as one engagement than four.

---

## Phase 17 — Governance & Organisational Design

**Status:** 🔭 Not addressed until now.

WEC-LC currently has no named leadership at all — not even a founder
listed publicly (an honest, deliberate omission per `editorial-bible.md`).
That's defensible for a pre-launch marketing site; it is not a
governance structure an accreditor, a bank, or a payment processor's
underwriting team will accept once real money moves. A minimal viable
governance structure, buildable on paper before any hire is made:

| Role | Owns | Can be fractional/interim? |
|---|---|---|
| Founder / CEO | Vision, final accountability | No |
| Academic Director | Learning outcomes, QA framework (Phase 3's open gaps), instructor standards | Yes — a part-time academic consultant can hold this early |
| Compliance & Data Protection Lead | ICO registration, safeguarding policy, the PII posture Phase 8 depends on | Yes — fractional DPO services exist specifically for this stage |
| Admissions & Student Experience Lead | The admissions journey, the `info@` inbox today, the portal tomorrow | Could be the Founder initially |
| Finance Lead | Stripe reconciliation, the unit-economics model in Phase 18 | Yes — a part-time bookkeeper/fractional CFO is sufficient pre-Stage-D |

- **Recommendation:** stand up a light **Academic Board** — even just
  Founder + Academic Director + one external subject-matter adviser —
  meeting quarterly to review learning outcomes and assessment
  consistency. This costs almost nothing before Phase 3's QA framework is
  written, and is exactly the kind of documented governance cadence a
  future British Council accreditation application will ask to see
  evidence of having existed *before* the application, not invented for it.
- **Extend the existing sign-off pattern.** `editorial-bible.md` already
  establishes a three-signature prepared/reviewed/approved chain for
  policies. Extend that same pattern to grade appeals, certificate
  issuance, and safeguarding incidents now, on paper — cheap to design
  before there are real cases, expensive to improvise under pressure once
  there are.
- **Risk if skipped:** Stripe, banking partners, and any future
  accreditation body all underwrite *governance*, not just product. An
  institution that can't name who's accountable for a safeguarding
  incident or a grade dispute reads as higher-risk to every one of them.

---

## Phase 18 — Financial Model & Unit Economics

**Status:** 🔭 Not addressed until now. **Every number below is an
illustrative placeholder to show the shape of the model — not a real
estimate. Replace every input with a real quote before relying on the
output.**

**Breakeven framework:**

```
Breakeven cohort size = Fixed annual costs ÷ (Revenue per student − Variable cost per student)
```

| Input | Illustrative placeholder | Source needed |
|---|---|---|
| Revenue per student (full IEFC) | $19,000 | ✅ Confirmed (Phase 3) |
| Variable cost per student (instruction time, LMS seat fee, ~3% payment processing, certificate/admin) | $4,000–$6,000 (placeholder range) | Real instructor rates, real LMS vendor quote |
| Fixed annual costs (Stage C/D team, hosting, DPO, base marketing) | $150,000–$250,000/yr (placeholder range) | Real hiring plan from Phase 17 |
| **Illustrative breakeven** | **≈15–25 fully-enrolled students/year** | — |

- **Why this matters even as a placeholder:** it suggests WEC-LC's model
  does *not* require hundreds of students to sustain a lean founding
  team — a small, high-conversion founding cohort could plausibly cover
  Stage C/D operating costs. That's a materially different fundraising
  and hiring conversation than assuming this needs venture-scale volume
  to work. **Get real quotes and rebuild this table before acting on it.**
- **Cash-flow risk, and a concrete fix.** Phase 8/9/11 (the MVP portal +
  LMS integration) cost real money *before* they generate a single
  dollar of portal-driven revenue. **Recommendation: don't wait.** The
  admissions flow already works today via `mailto:` — pair it with a
  **Stripe Payment Link** (zero engineering, live in under an hour) and
  Zoom/Google Classroom for the first cohort's live classes and materials.
  This "manual bridge" lets WEC-LC accept paying students *now*, prove
  real demand, and fund Stage C's proper build from real revenue and real
  proof — rather than spending $50k–150k (illustrative) upfront on
  infrastructure for a demand level that's currently unverified.
- **Concentration risk.** 100% of projected revenue depends on one
  $19,000 product. Worth naming, not solving now: if realized demand at
  this price point is softer than hoped, a lower-priced "taster" tier
  (a single level, or a short diagnostic course) could de-risk acquisition
  — flagged for a future pricing review once the manual bridge above
  produces real conversion data, not designed speculatively today.

---

## Phase 19 — Brand & Naming Risk Review

**Status:** 🔭 Not addressed until now — and the most time-sensitive item
in this addendum, because it gets more expensive to fix the longer it's
left.

- **The "London Campus" vs. "100% Online" tension.** The site currently
  states, in the same breath, that WEC-LC is a "**100% Online Digital
  Campus**" (home page hero stat) and is named "**WorldWide English
  College — *London Campus***," with a physical London address flagged as
  "to be confirmed" — i.e., currently pending, not currently false, but
  actively ambiguous about which is true. Under the ASA's CAP Code,
  marketing claims must be accurate and not misleading; "Campus" carries a
  strong physical-premises connotation to a reasonable consumer. **This
  isn't mine to resolve** — it depends on whether a real London campus is
  genuinely planned (in which case the current "online" framing should be
  softened to "hybrid" or scoped clearly) or whether "Campus" is
  permanent brand naming for a fully online institution (in which case a
  short, honest clarifying line is worth adding, in the same register as
  every other Institutional Status callout already on the site). **Adding
  this as Decision #8 below rather than resolving it myself** — the
  existing site content doesn't tell me which future you're planning for.
- **Name genericness.** "WorldWide English College" is highly descriptive
  — good for immediate comprehension, weaker as a trademark (descriptive
  marks are harder to register and defend than distinctive/invented ones).
  Recommend a UK IPO (and EUIPO, given the GCC/Gulf target market often
  routes through EU-adjacent registration practice) trademark search
  *before* further spend on collateral, and treat the crest/logotype
  device (once Phase 2's real logo is commissioned) as carrying more of
  the actual legal protection than the name text alone will.
- **Handle/domain squatting risk.** Cheap to fix now, sometimes impossible
  later: confirm `@worldwencollege`-pattern handles are secured across
  LinkedIn, Instagram, X, YouTube and TikTok before Phase 13's marketing
  execution begins, not after.

---

## Phase 20 — Consolidated Risk Register

**Status:** synthesis of every risk flagged across Phases 1–19, ranked.
A Board reviewing this roadmap should read this table before the phase
detail, not after.

| # | Risk | Likelihood | Impact | Phase | Mitigation | Owner (Phase 17 role) |
|---|---|---|---|---|---|---|
| 1 | Real PII/payment data collected before UK GDPR/DPO posture is resolved | Medium | Severe | 8, 16 | Resolve Decision #3 and appoint (even fractional) DPO before Phase 8 ships | Compliance Lead |
| 2 | "London Campus" claim read as misleading under ASA CAP Code | Medium | Moderate–Severe | 19 | Resolve Decision #8 explicitly; update copy to match the real plan | Founder/CEO |
| 3 | Stage C capital spent before demand is validated | Medium | Severe | 18 | Use the Stripe Payment Link + manual bridge to prove demand first | Finance Lead |
| 4 | Under-18 target audience without a written safeguarding policy | Medium | Severe | 16 | Draft policy + instructor vetting before any under-18 enrols | Compliance Lead |
| 5 | Company name / "College" naming rejected or challenged at incorporation | Low–Medium | Moderate | 16, 19 | Run the Companies House sensitive-words check before incorporating | Founder/CEO |
| 6 | No named governance — underwriting friction with banks/Stripe/future accreditors | Medium | Moderate | 17 | Stand up the minimal governance table now, on paper | Founder/CEO |
| 7 | Single-product ($19,000 IEFC) revenue concentration | Low (near-term) | Moderate | 18 | Monitor via the manual bridge's real conversion data; revisit pricing tiers later if warranted | Finance Lead |
| 8 | Trademark exposure from a descriptive name | Low | Moderate | 19 | UK IPO/EUIPO search before further brand spend | Founder/CEO |
| 9 | Handle/domain squatting before marketing launch | Low | Low–Moderate | 19 | Secure handles this week | Admissions/Experience Lead |
| 10 | Proprietary LMS scope creep — building analytics/gamification/depth the brand doesn't need before the core (content + assessment + progress) is solid | Medium — Executive Decision #4 commits to build, which raises this risk vs. the original buy-recommendation; mitigated by shipping in scoped, tested milestones (see `docs/lms-architecture.md`) rather than one large build | Severe if ignored — a stalled from-scratch LMS blocks the entire remaining launch sequence (Decision #8) | 8, 9, 18 | Hold the milestone discipline (M1 before M2, each independently shippable); resist building Faculty/Executive/Analytics depth before the Student-facing core is proven; hold the manual-bridge recommendation for near-term revenue while the LMS is built | Founder/CEO |

---

## Do This Week — No/Low-Cost Actions, Independent of Any Decision Above

Six items that need no budget approval and no resolved decision to start
today, ranked by how much more expensive they get if delayed:

1. **Run the Companies House sensitive-words + UK IPO trademark search**
   for "WorldWide English College," "WEC-LC," and "IEFC" — free-to-cheap,
   and the single most time-sensitive item on this list.
2. **Secure `@worldwencollege`-pattern social handles** across LinkedIn,
   Instagram, X, YouTube, TikTok.
3. **Create a Stripe account and a Payment Link** for the IEFC's first
   level — unlocks the Phase 18 revenue bridge immediately, no engineering.
4. **Register with the ICO** once the first real application form
   collects real data (small annual fee) — don't let this lag the first
   real applicant.
5. **Confirm a registered office address** for eventual UK incorporation —
   independent of whether a teaching campus ever exists.
6. **Draft a one-page safeguarding policy** (instructor vetting, safe
   messaging, parental consent for under-13s) before, not after, the
   first under-18 applicant arrives.

---

## Provisional Assumptions Now Locked for Building (Stage C)

Per explicit instruction: build ahead of confirmation, document the
assumption, flag for later sign-off rather than stopping. These
supersede the "recommended" language elsewhere in this document for
the purpose of what was actually built — see
`docs/technical-architecture.md`, `docs/payments-architecture.md`,
`docs/auth-architecture.md` for the implementations.

**Numbering note, to avoid confusion:** the "Decision #N" labels in the
table below are this table's own original numbering, from earlier in
this project. They are a **different, unrelated numbering** from the
8 Executive Decisions you later approved (Executive Decision #1 =
progressive full-programme unlock, #2 = currency strategy, etc. — see
`docs/executive-decision-brief.md` § Executive Decisions (locked in)).
Where a row below has since been superseded by one of those 8, it says
so explicitly.

| Area | Provisional assumption | Still needs confirmation |
|---|---|---|
| Hosting (Decision #1) | Cloudflare Pages + Pages Functions + D1, first in Executive Decision #7's confirmed provisioning order | Real account, real `database_id` in `wrangler.toml` |
| Payments (Decision #4) | Modular multi-gateway: Stripe, Paystack, Flutterwave, Opay — provider-agnostic core, no gateway hardcoded in; rollout order confirmed as Executive Decision #3 | Real merchant accounts for all four; Opay's adapter additionally needs its field names verified against current docs (see its file header) |
| Auth (Decision #5) | Clerk, behind a swappable interface, third in Executive Decision #7's provisioning order | Real Clerk instance; `CLERK_JWKS_URL`/`CLERK_WEBHOOK_SECRET` |
| LMS (Decision #6) | **Superseded by Executive Decision #4: build, not buy.** WEC-LC's own proprietary LMS is in active development (Milestone 1 shipped) — see `docs/lms-architecture.md`. The buy-and-wrap contract this row originally pointed to has been removed. | Real curriculum content (Milestone 2+); nothing about vendor selection remains open, because there is no longer a vendor to select |
| Currency (Decision #2) | Config-driven, multi-currency-ready; GBP/USD confirmed primary as Executive Decision #2 | Which currencies actually activate, and whether GBP uses a live feed or a policy-fixed rate — mechanism now built, see `payments-architecture.md` § Multi-currency |

**What changed vs. the original recommendation:** the roadmap above
(Phase 9) recommended Stripe alone for simplicity; the updated
instruction explicitly required a modular multi-gateway architecture
from the outset given WEC-LC's global, Nigeria-inclusive target market.
The architecture built reflects the updated instruction, not the
original recommendation — Phase 9's text is left as written above for
the historical record of how the recommendation evolved, rather than
edited to hide that it changed.

---

## Decisions Needed From You Before Further Build Work

*Update: this originally said the roadmap "stops short of writing code
for anything beyond Phase 0" — that's no longer true. Everything
implementable without a business decision or a live third-party
account has since been built (backend architecture, admissions API
wiring, Clerk auth wiring, financial reporting, student dashboard, a
production-readiness audit — see `docs/executive-readiness-report.md`
for the current, authoritative state). What follows is still accurate
as a list of what genuinely can't be resolved without you — those
decisions haven't gone away, only the amount of code waiting on them
has grown.*

**Update: 8 of the open strategic questions below were resolved by your
Executive Decisions message and are now locked-in working assumptions**
— see `docs/executive-decision-brief.md` § Executive Decisions (locked
in) for the full list. In short: full-programme payments unlock
progressively (was open question #2's pricing-model half); the
platform is built multi-currency with GBP/USD primary (question #2's
currency half — the *strategy* is resolved, a real GBP rate/policy is
still pending, see below); gateway rollout is Stripe → Paystack/
Flutterwave → Opay (question #4, confirmed, not changed); **the LMS
question (former #6) is resolved as build, not buy** — WEC-LC develops
its own proprietary LMS (see `docs/lms-architecture.md`); financial
policy (refunds, promos, scholarships, instalments, corporate
invoicing) is config-driven via `platform_config`; Arabic localisation
sequencing is confirmed (public site now, Student Portal after it
reaches English production quality); infra provisioning order and
launch sequence are both set. What remains below is what genuinely
still can't be resolved without you — real accounts, real money, real
legal ownership — not product-strategy questions anymore.

The next session should start from whichever of these you resolve:

1. **Hosting/DNS** — where should `worldwencollege.co.uk` actually point?
   *Building against: Cloudflare Pages, first in the confirmed provisioning
   order (see "Provisional Assumptions" above) — confirm or override before
   the first real deploy.*
2. **A real GBP exchange rate or policy-fixed rate** — the currency
   *strategy* (multi-currency, GBP/USD primary) is decided; GBP itself
   stays inactive at checkout until either a real FX feed is connected
   or WEC-LC sets a policy-fixed rate — see `payments-architecture.md`
   § Multi-currency. No rate is fabricated to unblock this.
3. **Legal/compliance owner** — who reviews data protection before any
   real application form goes live?
4. ~~**Payment processor**~~ — resolved: Stripe → Paystack/Flutterwave →
   Opay, in that order (Executive Decision #3). Each still needs a real
   merchant account before its phase activates.
5. **Auth provider** — *Building against: Clerk, behind a swappable interface
   — confirm or override before a real Clerk instance is created, next in
   the confirmed provisioning order after Cloudflare D1.*
6. ~~**LMS: buy or build?**~~ — resolved: build. WEC-LC's own proprietary
   LMS is now Milestone-based work in active development — see
   `docs/lms-architecture.md`. `functions/_lib/lms/provider-interface.js`
   (the buy-and-wrap adapter contract) has been removed; it no longer
   reflects the platform's direction.
7. **Budget/team for Stage C** — what's actually resourced, and by when?
8. **Physical London Campus: real plan, or brand naming?** — resolves the
   Phase 19 "London Campus" vs. "100% Online" ambiguity, and determines
   whether the current Student-visa-sponsorship-free status (Phase 16) is
   worth deliberately preserving.
9. **Who holds the Academic Director / Compliance Lead / Finance Lead
   roles** (Phase 17) — even as fractional/interim assignments, so
   Phase 3's QA framework and Phase 16's DPO registration have a named
   owner instead of defaulting to the Founder for everything.
10. **Approve the manual-bridge strategy** (Phase 18) — start accepting
    real applicants via Stripe Payment Link + Zoom now, ahead of Phase 8's
    full portal build, to fund Stage C from real revenue instead of
    upfront capital.

Once any of these are answered, I can turn the relevant phase from
🔭/📋 into active implementation.
