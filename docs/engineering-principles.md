# WEC — Engineering Principles

Short, and binding. Everything else in `docs/` describes what was
built; this describes how it is allowed to be built.

---

## 1. The Permanent Engineering Principle

Set by the Executive, 2 August 2026:

> **Never trust an implementation merely because it passes tests.
> Continuously verify that the tests themselves measure the complete
> behaviour they claim to guarantee.**

---

## 2. The corollary: test against the real producer

A test that supplies its own inputs can only ever discover what its
author already imagined.

This is not theoretical. It has now produced three defects on this
project, each of which passed a green suite:

| Defect | Why the tests missed it | Found by |
|---|---|---|
| The Listening Lab and instructor workspace sent **no `Authorization` header** — every request would have 401'd in production, even with Clerk fully configured | `lab-server.mjs` hard-coded a `userId` and never read request headers. The harness was easier than production exactly where production has a check | `tests/browser/lab-auth.mjs`, which made the harness require auth |
| The recording content-type allow-list rejected `audio/webm;codecs=opus` — **every recording any real browser produces** | 62 unit tests picked their own tidy `audio/webm`. No browser ever says that | `tests/browser/recording-upload.mjs`, a real `MediaRecorder` on Chromium's fake microphone |
| An unknown `kid` was rejected without refetching the JWKS, so **Clerk rotating its signing keys would sign out every learner** for up to ten minutes | Nothing exercised verification past the 401 boundary at all | `tests/clerk-jwt.test.mjs`, real RSA keypairs and real signatures |
| On a phone, submitting the comprehension quiz produced **no visible response** — graded correctly, result rendered below the fold, learner saw nothing | Every browser test ran at 1440px, where the result box is already on screen | A person using the real site on a real phone |
| Enrolments had **no uniqueness constraint**, so the same learner could hold two live enrolments in one level and `completeLevel()` would mark one completed while the other stayed active | Nothing ever enrolled the same person twice; the manual SQL that did was written by hand, outside any test | Enrolling the first real learner by hand, then asking what happens if it runs twice |
| The admin page mapped **every 403 to "you do not have staff access"** — so a staff member refused for enrolling *themselves* was told they were not staff, and would have gone asking for access they already had | Two different refusals share one status code; only the page knows they mean different things | `tests/browser/admin-enrolments.mjs`, first run |

The rule that follows:

> **Every subsystem must have at least one test driven by the real
> producer of its inputs** — a real browser, a real encoder, a real
> signature, a real payload — not by inputs the test invented.

And its enforcement clause, learned the same day:

> **A stand-in must be no more permissive than the thing it stands in
> for.** `r2-shim.mjs` rejects part gaps and undersized non-final parts
> because real R2 does. A shim that accepts anything tests nothing
> where it matters.

A third, from the recording work — the tests can lie too:

> **An assertion that can pass for the wrong reason is worse than no
> assertion.** "The audio can be fetched back from the server" passed
> while nothing had reached the server, because a `blob:` URL fetches
> fine from inside the page. Guard assertions on the specific condition
> they claim, not on a proxy for it.

---

## 3. Where this class of defect is still live

Honest register. Each row is a place where the code has never met its
real producer, with what would close it.

| Area | Status | What would close it |
|---|---|---|
| Clerk JWT verification | **Closed** — `tests/clerk-jwt.test.mjs`, 31 assertions with genuine RS256 signatures, forgery, alg confusion, rotation | — |
| Clerk's specific claim set and rotation cadence | **Open** | A real Clerk instance. The cryptography is covered; the vendor's exact claims are not |
| Clerk webhooks (Svix) | Partly — real HMAC-SHA256 computed the way the adapter verifies | A captured real Svix payload |
| Stripe / Paystack / Flutterwave / Opay webhooks | Partly — real signed requests, self-constructed | Captured real gateway payloads, or a gateway test mode |
| Checkout against a live gateway | **Open** | Test-mode keys in a preview deployment |
| Real R2 (conditional writes, lifecycle, durability) | **Open** | The deployed preview plus one real recording |
| FX provider feed | Stubbed provider only | A real provider key |
| Resend delivery | **Open** | A real key and a verified domain |

Nothing here is a reason not to ship a preview. It is a list of the
things that must not be described as verified.

---

## 4. Standing constraints on content

Restated because they outrank convenience, always:

- **Never fabricate** institutional facts, people, photographs,
  testimonials, partnerships, accreditation, statistics, exchange
  rates, leadership profiles, or operational information.
- **Never pad curriculum** to create an appearance of completeness.
- **Never invent academic policy** where governance approval is
  required: resit policy, certification policy, assessment
  regulations, progression rules, PART A/B examination conventions.
  The same applies to data policy with legal consequences —
  `recording_retention_days` ships as `null` for exactly this reason.
- **New LMS capability only when the curriculum genuinely requires
  it**, never because it would be impressive.

---

## 5. Reporting

- Verify before claiming; measure before concluding.
- Report limitations unprompted. Never conceal a known gap.
- When a correction is warranted, make it plainly and move on — the
  three defects in § 2 are recorded here rather than quietly patched,
  because the pattern is more valuable than any one fix.
