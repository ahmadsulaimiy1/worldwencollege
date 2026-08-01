# WEC-LC — Executive Decision Brief

*Companion to `docs/executive-readiness-report.md`. This is the
detailed version of that report's "Remaining Executive Decisions"
section — one entry per decision, with a recommendation and
alternatives, not just a list of open questions. Items already tracked
in `docs/master-roadmap.md` § Decisions Needed are cross-referenced,
not duplicated, except where this audit changed what's known about
them.*

---

## 1. Full-programme payment: how does up-front enrolment work?

**Issue.** The schema supports a full-programme payment
(`payments.kind='full_programme'`, `level_id=NULL`) but no code path
creates one — `create-checkout.js` only ever creates single-level
payments. This isn't a coding gap; it's that the *behavior* is
genuinely undecided. If a student pays for the whole six-level
programme up front, does WEC-LC:

- **(a)** create all six `enrolments` rows immediately (student can, in
  principle, access every level's content from day one), or
- **(b)** create only the first `enrolments` row now, and unlock each
  subsequent level's enrolment automatically as the student completes
  the one before it?

**Recommendation.** (b) — progressive unlocking. It matches how the
programme is actually taught (sequential, 4 months per level) and
avoids a student technically being "enrolled" in Level VI content
before they've earned placement into it. Mechanically: add an
`unlocks_on_completion` flag to `instalment_plans`-style tracking, or
simpler, have `enrolment/confirm.js`'s completion-of-a-level trigger
the next level's enrolment automatically when the payment record shows
`kind='full_programme'`.

**Alternatives.** (a) is simpler to build and matches a "you bought it,
it's yours" mental model some students may expect; a hybrid — release
Level II's *content* immediately but keep the *enrolment* status
progressive for reporting/completion-tracking purposes — is also
possible but adds complexity for a marginal benefit.

**Expected impact.** Until resolved, the "$19,000 pay in full" option
already advertised on `/admissions/tuition/` is not actually purchasable
through checkout — a real gap between marketing copy and product
capability. Low effort to build once decided (a few hours), since the
schema and pricing already exist.

---

## 2. Dashboard/Portal Arabic-RTL localization

**Issue.** The public marketing site is fully bilingual (11 EN pages,
11 AR mirrors, complete RTL design system). The newer authenticated
work — Student Portal preview, Profile screen, Finance dashboard — is
English-only, with `css/dashboard.css` carrying only 2 `[dir="rtl"]`
overrides total versus `css/brand.css`'s 13. This is a real,
user-facing gap for any Arabic-speaking student or staff member once
these portals go live.

**Recommendation.** Localize before the Student Portal itself goes
live (not before this preview ships — it's clearly marked
non-production), since a paying Gulf-market student is exactly the
persona this project has targeted from its first brief. Scope: RTL
CSS overrides for the dashboard layer's directional properties (~10-15
rules, mechanical), plus real Arabic translation of all UI strings
(both static markup and the JS-generated strings in
`portal-auth.js`/`finance-dashboard.js` — the latter need
externalizing from hardcoded English first).

**Alternatives.** Ship English-only at first launch and localize in a
fast-follow release once the Student Portal has real usage data on
what fraction of students need it — defensible if there's schedule
pressure, but means visibly under-serving a market this platform's own
payment routing (Paystack/Flutterwave-first for Nigeria, SAR/AED/QAR
currencies) was built to prioritize.

**Expected impact.** Medium-large effort (translation is real work, not
just CSS) but zero technical risk — the pattern to follow
(`pages/*.ar.html` + `[dir="rtl"]` overrides) is already proven on the
marketing site.

---

## 3. Rate limiting / bot protection on public endpoints

**Issue.** `POST /api/admissions/apply` accepts unauthenticated public
traffic with no rate limiting, CAPTCHA, or bot protection of any kind.
At real-world traffic this is spammable — cheaply, at volume, by
anyone.

**Recommendation.** Cloudflare Turnstile (free, same-vendor as the
recommended hosting, no separate account/billing relationship to set
up) on the admissions form specifically. Low integration cost: a
client-side widget plus one server-side verification call before the
existing validation logic runs.

**Alternatives.** Cloudflare's platform-level WAF rate-limiting rules
(coarser, no user-facing friction, but easier to tune incorrectly and
block real applicants); a homegrown IP/time-window throttle in
`apply.js` itself (avoids a third-party dependency but reinvents a
solved problem and is easier to bypass).

**Expected impact.** Currently zero protection exists — this is a
pre-launch requirement, not a nice-to-have, the moment the admissions
form is reachable by the public internet with real credentials behind
it. Low effort once a decision is made (Turnstile is a same-day
integration).

---

## 4. Social-share image system

**Issue.** Every page currently shares one generic `og-image.png`
(now `.jpg`, recompressed from 392KB to 61KB this session — the
compression fix required no decision and is done). Whether every page
*should* have a distinct, content-specific share image is a design
resourcing question, not resolved by compressing the existing one.

**Recommendation.** Defer until launch marketing planning — a single
strong shared image is a reasonable default for a pre-launch
institutional site; per-page images matter most once specific pages
(a named programme, a specific event) are being shared individually in
marketing campaigns.

**Alternatives.** Commission a small set now (home, admissions,
academics — the 3 most-shared page types) if social distribution is
part of the pre-launch marketing plan.

**Expected impact.** Low — current state (one good, small, correctly-
tagged image) is a reasonable default, not a defect.

---

## 5. Font self-hosting vs. Google Fonts CDN

**Issue.** Every page loads Playfair Display + Inter (+ Amiri/Cairo on
Arabic pages) from Google Fonts' CDN. This is a minor external
dependency and privacy consideration (Google receives a request per
page view), mitigated by `preconnect` hints already in place.

**Recommendation.** Leave as-is. Self-hosting adds real build
complexity (font files to manage, `@font-face` declarations,
versioning) for a marginal privacy/performance gain given `preconnect`
already minimizes the cost, and this project's own build philosophy is
"zero framework, minimal moving parts."

**Alternatives.** Self-host via a build step if a specific privacy
policy commitment (e.g. "zero third-party requests") is ever adopted —
not indicated by anything in the current editorial bible.

**Expected impact.** Negligible either way at current traffic; noting
this so it's a deliberate non-decision, not an overlooked one.

---

## Cross-references to previously identified decisions (unchanged by this audit)

These remain open exactly as `docs/master-roadmap.md` § Decisions
Needed already describes them — this audit didn't change what's known,
only confirmed the code correctly waits on each rather than guessing:

- **Hosting/DNS** — Cloudflare Pages is the provisional build target;
  needs a real account and `wrangler.toml`'s `database_id`.
- **Currency & pricing policy** — USD is the only active currency;
  GBP/NGN/SAR/AED/QAR/KWD activation needs either a real FX feed or a
  policy-fixed rate, and a decision on whether GBP (the `.co.uk`
  domain's natural currency) becomes primary.
- **Auth provider** — Clerk is provisional; needs a real instance,
  `CLERK_JWKS_URL`/`CLERK_WEBHOOK_SECRET`, and (per this audit) a
  decision on whether/when to set the new optional
  `CLERK_AUTHORIZED_PARTIES`.
- **Payment gateways** — Stripe/Paystack/Flutterwave/Opay all need real
  merchant accounts; Opay's adapter additionally needs its field names
  re-verified against Opay's current merchant docs before going live
  (flagged low-confidence in its own file header).
- **LMS vendor** — buy-and-wrap is the provisional approach; no vendor
  chosen, nothing further is buildable here until one is.
- **Refund policy** — who approves a refund, under what circumstances —
  `refund()` is implemented per-gateway but nothing calls it.
- **Discount/promo-code policy** — stacking rules, eligibility, maximum
  discount — schema-ready, deliberately not wired into checkout without
  a real policy.
- **Instalment plan cadence** — count/frequency of instalments —
  schema-ready, no endpoint yet.
- **Corporate invoicing** — needs a real corporate client relationship
  to design the actual invoicing flow against.
- **Legal/compliance review** — a named owner for the GDPR/UK GDPR data-
  protection review, required before any real applicant's PII is
  collected in production.
