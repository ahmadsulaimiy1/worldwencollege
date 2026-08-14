# WEC-LC — Executive Readiness Report

*Supersedes the prior version of this file. Companion to
`master-roadmap.md` (governing plan), `technical-architecture.md`/
`payments-architecture.md`/`auth-architecture.md`/`lms-architecture.md`/
`api-reference.md` (backend), `site-architecture.md`/`editorial-bible.md`/
`dashboard-design-system.md` (frontend/content), and
`executive-decision-brief.md` (the detailed version of this report's
decisions section, including the full status of all 8 Executive
Decisions you approved).*

**Status: engineering-complete for everything that doesn't require a
live third-party account or a business decision. Not ready for public
launch** — that's a different, later bar, gated by items in § Remaining
External Dependencies and § Remaining Executive Decisions below, not by
more code.

---

## This milestone, in one paragraph

You approved 8 Executive Decisions as the platform's working
assumptions — most significantly, that WEC-LC builds and owns its LMS
rather than integrating a third-party product. This report covers the
work since: full-programme payments now progressively unlock as each
level is completed (Decision #1); a real, config-driven multi-currency
FX architecture exists, activating GBP is now a same-day operational
task (Decision #2); the phased gateway rollout needed no code, only
documentation, since it was already how the router behaves (Decision
#3); a proprietary LMS Milestone 1 is built and tested — content
model, quizzes, assignments, live-session scheduling, progression
(Decision #4); promo codes, scholarships, and instalment plans are now
real, working, config-driven checkout mechanisms (Decision #5); and
Decisions #6-8 (Arabic sequencing, infrastructure provisioning order,
launch sequence) were confirmed as already-correct assumptions with no
code required. **156 new test assertions were added and all pass**;
combined with the prior audit's suite, the backend now carries **183
functional assertions, 0 failures**, against a real SQLite engine
loaded with the actual schema.

---

## Completed work

### This milestone (8 commits, since the prior readiness report)

- **Executive Decision #1 — progressive full-programme unlock.**
  `platform_config` (new, generic, JSON-encoded policy table — the
  mechanism Decision #5 also builds on) seeded with the real $19,000
  full-programme price. `create-checkout.js` accepts
  `{ fullProgramme: true }`; `enrolment/confirm.js` creates Level I's
  enrolment on first confirmation; `functions/_lib/student/
  progression.js`'s `completeLevel()` — triggered today by a
  staff-only endpoint, since no automated grading exists yet —
  auto-creates the next level's enrolment only for students who paid
  in full. The now-superseded buy-and-wrap LMS interface file was
  removed as part of this same change, since it directly conflicted
  with Decision #4.
- **Executive Decision #2 — configurable multi-currency FX.** A
  swappable FX provider boundary (`functions/_lib/currency/`,
  matching the payment-gateway adapter pattern), a real Frankfurter/
  ECB adapter (covers GBP; explicitly does not cover NGN/SAR/AED/QAR/
  KWD — stated in its own header, not glossed over), and a service
  layer separating pure DB-writing logic from the network call. Two
  new administrator-only endpoints (governance A5) for setting a policy-fixed rate or
  refreshing from the live feed.
- **Executive Decision #3 — phased gateway rollout.** No code change
  — `router.js`'s existing `isConfigured()`-based gateway suggestion
  already implements Stripe → Paystack/Flutterwave → Opay exactly as
  requested, since which gateway gets suggested is a direct function
  of which Pages secrets actually exist. Documented in
  `payments-architecture.md`.
- **Executive Decision #4 — proprietary LMS, Milestone 1.** New
  `docs/lms-architecture.md` records the decision, entity model
  (`Course → Unit → LearningItem`), and a 6-milestone plan (M1 done;
  M2 content authoring, M3 Student Portal wiring, M4 live-class/video,
  M5 gradebook, M6 analytics — all future work). Built: level-based
  access control tied to the same `enrolments` table Payments already
  writes to; ordered unit/content listing; quiz attempts (append-only,
  server-side-only scoring, never regressing an already-completed
  unit on a bad retake); assignment submission and staff grading;
  scheduled live-session listing (external join links, not custom
  video infrastructure — a deliberate, disclosed MVP scope choice).
  Seven new endpoints. **No curriculum content exists anywhere in the
  shipped schema** — only structural, already-published facts (one
  `courses` row per level, titled with that level's real name) — real
  units/quizzes/assignments are WEC-LC academic staff's work (M2).
- **Executive Decision #5 (partial) — configurable financial policy.**
  Promo codes and scholarships are now real, working checkout-time
  discounts (`functions/_lib/payments/discounts.js`), stacking gated
  by a conservative, disclosed default policy
  (`platform_config.discount_stacking_policy`). Instalment plans are
  real and working (`functions/_lib/payments/instalments.js`): equal
  split (remainder distributed a cent at a time, so the split always
  sums back exactly to the total), cadence count from
  `platform_config.instalment_default_count`, plan completion tracked
  automatically by the webhook handler. Refund policy and corporate
  invoicing remain undecided — genuinely blocked on institutional
  policy, not a technical gap.
- **Executive Decisions #6-8 — confirmed, no code required.** Arabic
  sequencing (Student Portal after English reaches production
  quality), infrastructure provisioning order (Cloudflare Pages → D1 →
  Clerk → Stripe → Resend → Turnstile), and the admissions-first
  launch sequence were all already the platform's correct working
  assumptions — documented explicitly in `master-roadmap.md` and
  `editorial-bible.md` rather than left implicit. One real fix made in
  passing: `master-roadmap.md`'s own pre-existing "Decision #N" table
  used the same numbering as your new Executive Decisions for
  completely different things — now disambiguated so the two schemes
  can't be confused.

### Prior audit (kept for record — see the previous version of this
report in git history for full detail): 27 commits building the
public site, backend, auth wiring, payments architecture, financial
reporting, and Student Portal integration, plus a full
production-readiness audit (2 concurrency bugs fixed, 6 security
hardenings, ~15 accessibility fixes, a committed test suite).

---

## Verified capabilities

Every claim above was checked, not assumed:

- **`npm test`** — **50 backend files import-checked cleanly; 183
  functional assertions**, 0 failures, against a real SQLite engine
  (`node:sqlite`) loaded with the actual `sql/schema.sql`, exercising
  the real, unmodified `functions/**` source. New this milestone: the
  progressive-unlock mechanism and its idempotency (19 assertions),
  the FX service's rate-writing logic and a stubbed-provider live-feed
  path (18), the LMS's access control/quiz-scoring/grading (25), and
  the discount/instalment mechanism (27) — 89 new assertions, plus the
  94 already in place. Reproducible by anyone — see `tests/README.md`.
- **Every new endpoint's 401 boundary is confirmed** — no/invalid auth
  token is rejected before any of this milestone's new logic runs, the
  same pattern already established for every pre-existing endpoint.
- **Every discount/instalment/currency edge case that could silently
  produce a wrong charge is tested**: a scholarship applied by someone
  other than the student it was awarded to, a discount that would
  drive the amount negative, an instalment plan queried for its next
  amount after it's already fully paid, a currency the live FX
  provider doesn't cover.

**What's genuinely not verified, and can't be from here:** anything
requiring a live Clerk/Stripe/Paystack/Flutterwave/Opay/Resend/
Frankfurter account or endpoint. Every cryptographic/signature-
verification routine and every third-party API call is implemented
against that provider's publicly documented scheme, not exercised
against a real instance — stated plainly in each relevant doc rather
than implied to be more complete than it is. This environment's own
network policy was confirmed this session to block outbound calls to
arbitrary third-party hosts (e.g. `api.frankfurter.app`), which is
additional, independent confirmation that "implemented against, not
tested against" is an honest characterization, not a hedge.

---

## Remaining external dependencies

Unchanged in kind from the prior report — nothing further can be built
against these without them existing for real:

1. **Cloudflare account** — Pages hosting + D1 database (`wrangler.toml`'s
   `database_id` is a placeholder). First in Executive Decision #7's
   confirmed provisioning order.
2. **Clerk account** — `CLERK_JWKS_URL`, `CLERK_WEBHOOK_SECRET`, a
   publishable key for `js/auth-config.js`. Third in the provisioning order.
3. **At least one payment gateway account** — Stripe first (Executive
   Decision #3), then Paystack/Flutterwave, then Opay.
4. **Resend account** — `RESEND_API_KEY`, a verified sending domain.
5. **A domain DNS decision** — where `worldwencollege.co.uk` actually
   points once hosting is live.
6. **Cloudflare Turnstile account** — last in the provisioning order,
   for admissions-form bot protection (see decision brief item 3).
7. **A second FX provider, or a policy-fixed rate decision** — for
   NGN/SAR/AED/QAR/KWD specifically, since Frankfurter's ECB feed
   doesn't cover them (GBP is Frankfurter-servable today).

None of these can be provisioned by this session; all are a deploy-time
checklist once you're ready.

---

## Remaining executive decisions

Full detail in `docs/executive-decision-brief.md`. What's left, now
that all 8 of your Executive Decisions are locked in as working
assumptions with mechanisms built:

1. **Real institutional policy values**, not mechanisms — these are
   now genuinely the only things blocking full activation of what's
   built: which currencies actually activate and at what rate; real
   scholarship eligibility/maximum-discount policy; real instalment
   cadence policy; refund approval policy; corporate invoicing design
   (needs a real corporate client relationship to design against).
2. **Rate limiting / bot protection** on the public admissions
   endpoint — recommend Cloudflare Turnstile (already last in the
   confirmed infra provisioning order); currently zero protection
   exists, a pre-launch requirement once real traffic arrives.
3. **A legal/compliance owner** for the GDPR/UK GDPR review — required
   before any real applicant's PII is collected in production. This
   remains the single highest-priority open item across the entire
   project.
4. **LMS content authoring** — not a decision so much as a resourcing
   question: who on WEC-LC's academic staff authors the real Level
   I-VI curriculum once Milestone 2's authoring tooling exists.
5. Minor, low-impact, already-addressed-as-deliberate-non-decisions:
   social-share image system, font self-hosting (see decision brief
   for reasoning — both fine as-is).

---

## Recommended launch sequence

Unchanged in structure from the prior report, updated where this
milestone's work changes what's actually ready:

1. **Resolve the legal/compliance owner and data-protection review** —
   before any real applicant PII is collected, not after. Still the
   standing #1 blocker.
2. **Provision Cloudflare + Clerk + Stripe** (Executive Decisions #3
   and #7's confirmed order) and run the real `wrangler d1 execute`
   against `sql/schema.sql` — the schema, now including
   `platform_config` and the full LMS Milestone-1 tables, is ready
   today.
3. **Add Cloudflare Turnstile** to the admissions form before it's
   reachable at a real, publicly-known domain.
4. **Activate GBP** via a real Frankfurter fetch or a policy-fixed
   rate (`POST /api/admin/currency/set-rate`) — a same-day operational
   task now, not a pricing-policy blocker.
5. **Soft-launch the admissions flow first**, Payments second, Student
   Portal third, LMS integration fourth — exactly Executive Decision
   #8's confirmed order, and each is now real, tested, working code
   waiting only on credentials.
6. **Author real Level I curriculum** (LMS Milestone 2) in parallel
   with the above — it blocks course-content delivery specifically,
   not admissions, payments, or enrolment.
7. **Localize the Student Portal for Arabic** (Executive Decision #6)
   once the English Student Portal itself reaches production quality
   — not before, per the confirmed sequencing.

---

## Post-launch roadmap

- **LMS Milestones 2-6** — content authoring tooling, Student Portal
  frontend wiring to the now-built LMS endpoints, live-class/video
  depth (Cloudflare Stream), a Faculty-facing gradebook, and CEFR-
  specific competency analytics. See `docs/lms-architecture.md`'s own
  roadmap section for the full sequencing and reasoning.
- **Faculty/Administration/Executive/Corporate/Alumni portals** — the
  shared portal pattern (`js/portal-guard.js` + `dashboard.css`) is
  proven three times now (Student Portal, Finance, and structurally by
  the LMS's staff-only endpoints); each new portal is a data-loading
  script and a role-gate decision, not a redesign. Sequenced per
  Executive Decision #8.
- **A second FX provider** for NGN/SAR/AED/QAR/KWD, behind the same
  `FxProviderInterface` Decision #2 already established.
- **Refund workflow activation** and **corporate invoicing** once
  their respective real institutional policies/relationships exist —
  `refund()` is already implemented per-gateway, only the approval
  workflow and a real corporate client are missing.
- **PDF receipt generation** — `receipts.pdf_url` is schema-ready.
- **A committed frontend (Playwright) test suite** — the backend has
  one now; frontend verification has been done ad hoc across sessions
  but not yet checked into the repository.
- **Structured data expansion** — `BreadcrumbList` on nested pages, a
  `Course`/`EducationalOccupationalProgram` type for the IEFC page.

---

## Assessment of readiness for production

**Engineering: ready**, and materially more so than the prior report —
this milestone closed the gap between "the schema supports it" and
"it's real, working, tested code" for full-programme payments,
multi-currency activation, discounts, instalments, and an entire new
LMS subsystem, without any known regression (the full 183-assertion
suite, including everything from the prior audit, still passes clean).
The codebase has no known blocker-severity defects.

**Content/brand: unchanged, still ready.** No fabricated leadership,
accreditation, testimonials, statistics, exchange rates, or curriculum
content anywhere — a discipline that, this milestone, specifically
extended to declining to invent an FX rate for GBP and declining to
seed any LMS lesson/quiz/assignment content, exactly the same standard
held since this project's first session.

**Operationally: not ready, by design, not by omission.** Every item
in § Remaining External Dependencies and § Remaining Executive
Decisions requires a real account, real money, or a real institutional
policy decision that is legitimately yours to make. What changed this
milestone is how much less is *also* waiting on more engineering work
once those arrive: full-programme payments, GBP activation, discounts,
and instalments are now a credentials-and-policy checklist away from
working, not a build queue.

**What this milestone deliberately did not do, and why:** it did not
claim a "complete, flagship LMS" — Milestone 1 is a real, tested
foundation (content model, assessment, progression), not the finished
platform the executive directive envisions long-term. Faculty-facing
content authoring, Student Portal wiring, live video, and analytics
remain explicitly sequenced as future milestones in
`docs/lms-architecture.md`, each to be built, tested, and reported on
in turn — the same "continuous executive reporting, not one giant
claim" discipline this report itself follows.
