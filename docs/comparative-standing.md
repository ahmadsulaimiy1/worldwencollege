# Comparative Standing — the Board's question, answered on evidence

*Internal. Not published, and not written to be. Every figure below
comes from an instrument in this repository that can be re-run; where
a number appears, the command that produces it appears beside it.*

**The question put to this build:** does WorldWide English College's
digital institution stand beside Oxford, Cambridge, Harvard, INSEAD
and the leading Gulf institutions?

---

## 1 · What the question can mean, and what it cannot

It cannot mean academic standing. Those institutions hold centuries of
it, or in INSEAD's case half a century of a very particular kind, and
this College holds none of it yet. Nothing in this document argues
otherwise, and nothing on the public site does either — `/faq/` answers
the accreditation question directly and in the negative rather than
letting a reader infer a comfortable answer from silence.

What the question *can* mean, and what the Board is entitled to an
answer on, is the **digital institution**: the thing a prospective
student, an employer checking a certificate, and a regulator reading
the regulations actually encounter. That is built, it is measurable,
and it is what this document reports.

The comparison below is therefore against **the standard those
institutions set** — the categories by which any serious institution's
digital presence is judged — rather than against invented specifics
about their sites. Claims about other institutions that this project
has not verified do not appear here, for the same reason invented
claims about this one do not appear on the site.

---

## 2 · The seven things a reader actually judges

A prospective student, an employer and a regulator between them ask
seven questions of an institution's digital presence. They are the
right axis for this comparison because they are the questions, not the
features.

| # | The question a reader asks | Where WEC-LC stands |
|---|---|---|
| 1 | **Who runs it, and is anyone accountable?** | Partial — see § 4 |
| 2 | **What are the rules, and can I read them before I commit?** | Meets the standard |
| 3 | **What does it cost, exactly?** | Meets the standard |
| 4 | **Can a stranger check a credential it issued?** | Exceeds the standard |
| 5 | **Does it work for everyone?** | Exceeds the standard |
| 6 | **Does a student get a record, or a brochure?** | Meets the standard |
| 7 | **Has anyone outside confirmed any of it?** | Does not — see § 4 |

---

## 3 · Where the College already meets or exceeds that standard

### 2 · The rules, readable before committing

Thirty-one policy and regulation surfaces are published in English and
mirrored in Arabic — the academic regulations, the assessment
regulations, the conduct and integrity regulations, the complaints
procedure, the safeguarding and inclusion policies, the AI policy, the
intellectual-property instrument, the quality manual, the governance
instruments and the decision register among them.

    ls -d governance/*/ students/*/ support/*/ academics/*/ admissions/*/ | wc -l

That an applicant can read the marking scheme, the resit rules, the
complaints timetable and the College's own governing instrument
*before* paying anything is the standard a serious institution sets,
and it is met.

### 3 · The cost, exactly

Tuition is itemised to the cent, in multiple currencies, with the
discount, instalment and scholarship arithmetic published rather than
quoted on application. The tariff the site shows is the tariff
`priceCheckout()` charges — `tests/acceptance-journey.test.mjs` quotes
a real price through that function and pays it.

### 4 · A stranger checking a credential — **the College exceeds here**

Every award carries a verification code. A stranger with no account,
no session and no relationship to the College resolves it at
`/verify/`, and the register checks the College's own signature rather
than reciting it. A superseded certificate still resolves, reports
itself as replaced, and names the code that superseded it, so a holder
is never stranded.

This is a genuine differentiator, not a parity claim. Large
institutions commonly route credential checking through a third-party
service, which means a check is only as durable as a commercial
relationship. Here the register is the College's own, the chain is
hash-linked, and the last act of `tests/acceptance-journey.test.mjs`
is a stranger performing exactly that check.

    node --experimental-sqlite tests/acceptance-journey.test.mjs

### 5 · Working for everyone — **the College exceeds here**

Three properties, each measured on **every one of the 200 built
routes**, not sampled:

- **Contrast.** Every element carrying its own text is measured against
  the ground actually painted behind it, at the size and weight it is
  set in, against WCAG AA. Not "the palette was chosen carefully" —
  measured, per element, per route.
- **Layout stability.** Cumulative Layout Shift per route, from the
  browser's own PerformanceObserver, under 0.1 everywhere.
- **High Contrast Mode.** Every button and control is asked, with
  forced-colors active, whether it still has a boundary — the mode in
  which every gradient, shadow and background image this site draws a
  control with is removed outright.

<!-- markdownlint-disable-next-line MD014 -->
    node tests/browser/render-quality.mjs        # 3 passed, 0 failed

And **the Arabic edition is not a translation layer — it is an
edition**. Ninety-nine Arabic routes against the English site's, with
parity held by a test rather than by intention: cards, tenets and the
travelling-light marks are held *exactly* in both directions, so a
missing card is a paragraph one language never gets and an extra one is
the same fault pointing the other way. Structural divergence is held to
a documented per-page allowance that is a ratchet — it may shrink and
must never grow.

    node scripts/parity-audit.mjs
    node --experimental-sqlite tests/run.mjs    # arabic-parity.test.mjs

A bilingual site of this size where the second language is enforced
rather than aspirational is uncommon anywhere, and it is the College's
strongest structural claim after verification.

### 6 · A record rather than a brochure

The student portal is not a marketing surface with a login. A learner
sees their own programme, week, module, standing, examination, cases,
engagement, finance, documents and awards — twenty-five surfaces, each
in both editions, each backed by a real endpoint against a real record.
The administrative side is the same: marking, examinations, papers,
conferral, learners, admissions, enrolments, finance, cases and the
registrar's consoles.

    find functions/api -name '*.js' | wc -l     # 86 routes

And, as of `tests/acceptance-journey.test.mjs`, those surfaces are
known to be about **the same person** — an application, a payment, an
enrolment, an examination and an award that all carry one identity,
each link read back out of the database and compared against the one
before it.

### The instruments, and the discipline they enforce

| Instrument | What it holds | Current |
|---|---|---|
| `tests/run.mjs` | 111 domain suites + 27 browser suites | 5,313 assertions, 0 failures |
| `scripts/red-flag-audit.mjs` | Nine committees' worth of house rules | 0 findings |
| `scripts/link-census.mjs` | 18,843 internal links | 0 dead links, 0 dead anchors, 0 orphans |
| `scripts/parity-audit.mjs` | English ↔ Arabic structure | exact on content, ratcheted on structure |
| `tests/browser/render-quality.mjs` | Contrast, CLS, forced-colors, all 200 routes | 3 passed, 0 failed |
| `tests/published-claims.test.mjs` | Every numeral traced to `data/standing.json` | enforced at build |
| `tests/institution.test.mjs` | No person in an office they have not accepted | enforced at build |

The last two are the ones that matter most for this comparison. A
figure cannot reach a page by being typed confidently into a paragraph,
and a name cannot reach an office without an appointment behind it. An
institution that *cannot* overstate itself, mechanically, is in a
different position from one that merely intends not to.

---

## 4 · Where the College does not meet that standard, and why

Two of the seven. Both are real, and it matters which kind of gap each
one is.

### 1 · Who runs it — **not held, not unbuilt**

The governance framework is published in full: the instrument, the
Board of Governors, the Academic Senate, the College Executive, the
Board of Academic Standards and Curriculum Excellence, the Independent
External Examiner's remit, the chain of authority, and a leaf naming
the offices that are defined and empty. What is not published is a
roster of names, because those offices have not been accepted by
anyone.

`tests/institution.test.mjs` fails the build if a personal name appears
in an office with no appointment behind it, and that guard is not
negotiable — it protects a real person's reputation, and no
presentational argument reaches it.

**This gap closes with appointments, not with engineering.** The
surfaces that would carry the names, the dates and the terms of office
already exist and already render; they are waiting for a fact.

### 7 · External confirmation — **not held**

No accreditation. No ranking. No partnership. No external examiner
appointed. The College says so where a reader directly asks, and does
not gesture at it anywhere else.

Against Oxford, Cambridge, Harvard and INSEAD this is the whole
distance, and no amount of craft closes it. It is worth being exact
about what would: a first cohort with completed records, an appointed
External Examiner who has confirmed the standard against the published
rubrics, and then an accreditation application with that evidence
behind it. The platform is built to produce exactly that evidence —
every award is set, marked and second-marked against a rubric published
before the work, every reconciliation is recorded, and every marker's
agreement with their second markers is computed and shown to them.

That is the honest answer to the Board's question: **the College's
digital institution stands comparison on every axis that engineering
and editorial discipline can reach, and on two axes it cannot reach at
all until people accept offices and a cohort finishes.**

---

## 5 · What would close the remaining distance, in order

Each item names what it depends on, so nothing here reads as a build
queue when it is not one.

1. **Appoint the offices.** Depends on people accepting them. Unblocks:
   the leadership roster, the Senate and Board memberships, BASCE's
   quorum, and therefore approval of the competency mappings — which is
   currently the last academic act standing between the College and its
   first conferral.
2. **Appoint the Independent External Examiner.** Depends on a person.
   Unblocks: external confirmation of the standard, and with it the
   only credible route to axis 7.
3. **Run a first cohort to completion.** Depends on 1 and on
   provisioning (payment credentials, mail gateway). Produces the
   evidence an accreditor asks for, in the form the register already
   holds it.
4. **Apply for accreditation, with that evidence.** Depends on 1–3.
   Nothing on the site may anticipate the outcome.
5. **Provision the external services.** Payment gateway credentials,
   `RESEND_API_KEY`, and the signing keys in production. Purely
   operational; `docs/executive-readiness-report.md` § Remaining
   External Dependencies is the live list.

Items 1, 2 and 4 are the owner's to make happen and no session on this
repository can advance them. Item 5 is a credentials checklist. Item 3
follows from the others.

---

## 6 · How to re-run every claim in this document

    node scripts/build.js
    node --experimental-sqlite tests/run.mjs
    node scripts/red-flag-audit.mjs
    node scripts/link-census.mjs
    node scripts/parity-audit.mjs
    node tests/browser/render-quality.mjs
    node --experimental-sqlite tests/acceptance-journey.test.mjs

If any figure in § 3 has drifted from what those commands report, this
document is wrong and the commands are right.
