# Audit 23 — International readiness

**Method.** Cultural neutrality, translation quality, legal assumptions
and worldwide usability, measured against the served site rather than
assumed.

---

## Correction to an earlier figure

A working note from an earlier pass put the English-only page count at
"about 42". **That was wrong.** Measured:

- **46 English pages, 33 Arabic pages.**
- **13 English pages with no Arabic counterpart.**
- **0 Arabic pages with no English counterpart.**

And the 13 are not marketing. They are:

| Category | Pages |
|---|---|
| Signed-in product | `my-programme`, `my-record`, `student-portal/preview` (×2), `listening-lab`, `instructor-review`, `admin-enrolments`, `finance/preview` |
| **Public credential surfaces** | **`verify.html`, `register.html`, `graduate.html`** |
| Internal | `docs/information-architecture.html`, `stromex/design-system/showcase` |

**The public marketing site is fully bilingual.** What is English-only is
the product and — the finding — the three pages an employer, a ministry
or a university actually uses.

---

## Finding 1 — the Arabic edition stops exactly where it matters most

`/verify/`, `/register/` and `/graduate/` have no Arabic edition **and no
language switcher at all** — no `hreflang`, no link to an Arabic
alternative, nothing.

Meanwhile **32 of the 33 Arabic pages link to `/verify.html` from their
header** — every one except the Arabic application page, which uses a
different shell.

So the journey is: an Arabic reader browses an Arabic site, clicks
"verify an award" in the Arabic navigation, and lands on an English-only
page with no route back. That is the single most transactional act the
College supports, performed by the reader least likely to be reading in
English — an HR officer in Riyadh, a ministry caseworker, a registrar.

This is the leading international-readiness finding and it is a build,
not a decision.

---

## Finding 2 — the Arabic is written, not translated

Assessed as far as an audit of this kind can: register, word order,
terminology, and the handling of mixed-direction text.

The Arabic reads as Arabic. Numbers and Latin acronyms are directionally
isolated so they do not corrupt the line — the failure mode that
disfigures most bilingual sites. The level names are given in Arabic
rather than left in English. The Arabic build is a genuine RTL layout,
not a mirrored LTR one.

And, as the Naming Audit found, **the Arabic navigation was more legible
than the English one** before this week: it named the stage where the
English named an award code.

The one gap: the College has **no Arabic name for its own programme**. It
says *برنامج IEFC* — a Latin acronym in Arabic prose. The English full
name now appears beside it, which is honest and standard, but it is not
a name. That is a Board decision, registered with C11.

---

## Finding 3 — one currency, six dormant

**USD is the only active currency.** GBP, NGN, SAR, AED, QAR and KWD
exist in the record, each marked inactive with no exchange rate.

USD is workable for international education and is what most
scholarships denominate. It is not workable for:

- a corporate buyer in the UAE paying in AED (Audit 10);
- a ministry finance office paying in SAR (Audit 04);
- an individual in Lagos watching the NGN rate move between instalments.

The architecture anticipates all of this — the currencies are modelled,
with decimal places correct including KWD's three. Nothing is switched
on.

---

## Finding 4 — the College has no legal existence anywhere

Measured across all served English pages:

| Searched for | Found |
|---|---|
| Terms and conditions / terms of service | **0 pages** |
| Governing law | **0 pages** |
| Jurisdiction for disputes | **0 pages** |
| Registered company name or number | **0 pages** |
| Companies House reference | **0 pages** |
| Consumer rights / cooling-off | **0 pages** |
| Complaints procedure (non-academic) | **1 page**, in passing |
| Data protection officer / ICO | **0 pages** |

For an international provider this compounds rather than adds. A learner
in Lagos, a sponsor in Riyadh and a company in Dubai each need to know
which country's law governs the agreement, and there is no agreement.

The College describes itself as operating from a London administrative
headquarters while stating that its registered address is not confirmed.
That is honest and it leaves the jurisdiction question open, which for a
cross-border consumer contract is the question.

**Distance selling to UK and EU consumers carries cancellation rights
that exist whether or not a provider mentions them.** Silence is not
neutrality here.

---

## Finding 5 — cultural neutrality holds

Examined for the usual failures and did not find them.

No imagery a conservative family would object to. No examples assuming a
Western household, a Western working week or a Western banking system.
No date formats that mean different things in different countries in
places where it matters. No assumption that the reader is applying from
inside the UK. The visa position is stated plainly: the programme
involves no physical presence, so a study visa is not withheld — it is
simply not part of what this is.

The FAQ handles a family enquiring on behalf of an under-18 applicant by
directing them to admissions rather than the form. Somebody thought
about a reader who is not the applicant.

**The one gap** is the one the Saudi family in Audit 03 named: nowhere
does the site describe what a live class actually is — who is present,
whether it is recorded, who can see recordings, whether cameras are
required, whether a female instructor can be requested. That is not a
values question the College needs to answer. It is a **description** the
College has not written, and it is the first page a Gulf family would
read.

---

## Finding 6 — time zones are unaddressed

The programme is delivered "live and recorded", worldwide, from London.
Nothing on the site says when live sessions run, in which time zone they
are published, or what a learner in Manila does about a London evening
class.

The College publishes workload in hours rather than months precisely so
that learners can fit study to their own lives — a good decision. The
live component is the part that cannot flex, and it is undescribed.

---

## Verdict

**Bilingual where it markets, monolingual where it matters, and legally
placeless.**

Three fixes, in order of impact per unit of effort:

1. **Publish `/ar/verify/`.** One page. It is the destination of a link
   from 32 of the 33 Arabic pages, and the only page a foreign employer
   will ever load.
2. **Register an entity and publish terms.** This is not an
   international-readiness item that happens to appear here; it is the
   binding constraint on every non-consumer relationship the College
   wants — ministry, university, corporate.
3. **Activate one Gulf currency.** The model is built and dormant.

And one that costs a page of writing: **describe the live classroom.**
