# Audit 13 — A cybersecurity reviewer

**Who I am.** Application security. I review small platforms handling
personal data and payments before they launch. I look at what an
attacker gets, not at a checklist.

---

## Architecture, briefly

Static site on Cloudflare Pages, serverless functions, D1 (SQLite) for
the record, R2 for recordings and identity documents, Clerk for
authentication. No self-hosted servers, no self-managed session store,
no password database.

**That is a good shape for an organisation this size.** The largest
categories of breach I deal with — an unpatched server, a leaked
database backup, a home-rolled password reset — are structurally absent
rather than mitigated.

---

## What holds

**Security headers are present and correct.** `nosniff`, `X-Frame-
Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
HSTS with `includeSubDomains`, and a `Permissions-Policy` that grants
microphone to the origin only and denies camera, geolocation, payment
and USB outright.

That last one is done properly. Most sites deny nothing, and a
permission nothing uses should not be available to ask for.

**Authentication is delegated.** No password hashing, no reset tokens,
no session fixation surface of the College's own making.

**Authorisation is tested at the module boundary**, not only at the
route. There is a test asserting a student role is rejected by the staff
guard. Route-only guards are how most privilege escalation happens, and
this codebase found that gap once already — endpoints that omitted the
auth header — and closed the test gap that had hidden it.

**Governance constraints are enforced in the schema.** From a security
standpoint this matters more than it sounds: a misconduct finding
without a notice, or an appeal heard by the person who took the original
decision, cannot be written even by code with full database access. That
is integrity enforced below the application layer, where a compromised
handler cannot reach it.

**No analytics, no third-party pixels, no CDN scripts.** The supply-chain
surface is close to zero, and a build check refuses the site if a
tracker appears.

---

## The two gaps I would name

### 1. No Content-Security-Policy

This is the header worth having and it is absent.

The College's reasoning is documented in `_headers` and it is not an
excuse — it is a better argument than I usually get. Clerk loads its SDK
from a Frontend API host derived at runtime from the publishable key, so
the correct `script-src` allowlist depends on which Clerk instance is
configured; Google Fonts adds two more origins; and a wrong CSP does not
fail a build or a test — it silently breaks one real learner's sign-in
in production. The stated position is that shipping it honestly requires
loading the deployed site and completing a real sign-in with the policy
active, which the build environment cannot do.

**I accept the reasoning and I still call it a gap.** Without CSP, any
successful injection anywhere on the site executes with full privileges,
and the site takes free-text input (applications, feedback, assignments)
that will eventually be rendered somewhere.

What I would do: ship it in **report-only** mode first. `Content-
Security-Policy-Report-Only` breaks nothing by construction, collects
exactly the origins the reasoning says are unknown, and converts a
ten-minute manual check into a week of real data. There is no argument
against report-only that I can see, and the documented objection does
not apply to it.

### 2. Identity documents in R2, with no stated retention or access model

There is a bucket for KYC documents. From outside I cannot tell who can
read it, how long documents live, or whether access is logged.

The College's own processing register lists nine of eleven retentions as
undetermined. Passport scans are the highest-value personal data any
education provider holds and the first thing an attacker looks for.
Whatever else remains undetermined, **this one should not.**

---

## Smaller notes

- **Secrets** are environment variables, and the payment and mail
  adapters fail closed with a named error when unconfigured rather than
  silently no-oping. Correct.
- **The verification service takes an unauthenticated code and returns
  personal data.** That is inherent to what it is for, and the design
  choices around it are right — no account, no logging of the checker.
  It will need rate limiting before it is public with real records in
  it, or it becomes an enumeration oracle over the graduate register.
- **No published security contact.** A `/.well-known/security.txt` costs
  nothing and is the difference between a researcher emailing you and a
  researcher publishing.

---

## Verdict

**Sound for its size, with one real gap and one that should be closed
before the first learner uploads a passport.**

The architecture decisions are better than the average for an
organisation at this stage, and the CSP omission is the only place where
I disagree with a decision that was clearly reasoned rather than
overlooked — and even there, only about the availability of a safe
middle step.
