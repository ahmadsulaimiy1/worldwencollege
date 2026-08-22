# Board Paper 02 — Data Protection

**Status: for decision.** Four determinations are needed that are not
the author's to make. Everything else in this paper is a statement of
what the platform already does, read from the code rather than
remembered.

**Recommendation in one line:** take decisions 1 and 2 now, because they
are the ones that block everything else; decisions 3 and 4 can follow
within the same quarter.

---

## 1. Why this paper exists

**Correction, and it is mine.** An earlier draft of this paper opened by
saying the College had published nothing about the personal data it
holds. That was wrong. A privacy page has been published at
`/support/privacy/` throughout, and it is better than the sector norm:
it opens by stating that the site runs no analytics and no third-party
measurement of any kind — enforced by a build check — names the three
actual processors instead of saying "service providers", distinguishes
the enquiry form that sends nothing from the application form that does,
and declares its accountability gap rather than glossing it. I missed it
because my survey looked one directory deep and the page sits two.

The real gap is narrower and more specific, and the page itself named
most of it before I did.

**What is genuinely missing:** no named data controller, no lawful basis
for any processing activity, no Data Protection owner, and no
international transfer position.

**And one thing that was worse than missing.** The page told learners
that retention and erasure were "open governance decisions". They had
been adopted on 14 August as D1, D2 and D3 — and the retention period
was not switched on in the software until 22 August, so for eight days
the College held voice data indefinitely while its own register said two
years. The page now publishes what was decided, and says plainly that it
previously said otherwise. Nobody was affected, because nobody has
recorded anything. That is luck, not design.

A learner cannot exercise a right they have never been told they have,
and an institution that cannot list what it holds cannot honestly answer
a subject access request, a regulator, or a sponsor's due diligence
questionnaire — which is the first document a corporate client sends.

There is also a specific finding. Governance **D1** — delete a learner's
voice recording after 730 days — was adopted on 14 August 2026 and was
still not in force on 22 August. The setting read `null`, which the
software takes as *keep indefinitely, purge nothing*, while the
governance register said two years. Had a regulator asked, the register
is the document that would have been produced and the database would
have been the truth. It is now in force, and a test reads the decisions
register and fails if an adopted decision is not implemented. No learner
was affected because nobody has recorded anything — luck, not design.

## 2. What the College actually holds

Generated from `processing_activities` (migration 032), which is bound
to the schema by `tests/processing-register.test.mjs`: every table with a
personal-data-shaped column must be either described here or listed as
an explicit exclusion with a reason. A new table holding personal data
cannot be added without saying what the College does with it.

| # | Activity | What is held | Higher risk | Retention |
|---|---|---|---|---|
| 1 | **Account and access** | Email address, preferred name, role, and the history of role changes. | No | **Not determined** |
| 2 | **Applications and identity** | Full name, email, telephone, country, nationality, residential address, emergency contact, sponsor, passport number, and scans of identity documents. | **Yes** | **Not determined** |
| 3 | **Enrolment** | Which levels a learner is enrolled on, their status, and the history of changes to it. | No | **Not determined** |
| 4 | **Study activity** | Modules completed, quiz attempts and scores, submitted assignments and their marks, time spent studying, and attendance at live sessions. | No | **Not determined** |
| 5 | **Voice recordings** | Audio recordings of the learner speaking, their duration and fingerprint, and the feedback given on them. | **Yes** | 730 days from recording, after which the audio is deleted and the assessment record and its SHA-256 fingerprint are kept. |
| 6 | **Qualifications and academic record** | Awards conferred, the name as it appears on the certificate, graduation audits, pass lists, distinctions, issued documents and CPD records. | No | Permanent. |
| 7 | **Public graduate profile** | Display name, country, portrait photograph, and the shares a graduate has created. | **Yes** | **Not determined** |
| 8 | **Fees** | Payments, instalment plans and scholarship awards. Card details are never seen by the College. | No | **Not determined** |
| 9 | **Concerns, appeals and conduct** | Records of concerns raised about a learner's progress, academic appeals they have lodged, misconduct cases, and survey responses. | **Yes** | **Not determined** |
| 10 | **Messages sent** | A log of the notifications the College has sent to a person and whether they were delivered. | No | **Not determined** |
| 11 | **Staff, examiners and verifying institutions** | Names and affiliations of appointed External Examiners, the staff hosting live sessions, corporate account contacts, and institutions registered to verify qualifications. | No | **Not determined** |

Four of the eleven are marked higher risk: identity documents, voice
recordings, portrait photographs, and the support records — concerns,
appeals and misconduct cases — which are the most sensitive things the
College will ever write about somebody.

**Two retentions are settled** and quoted from adopted decisions: voice
recordings at 730 days (D1), and the Graduate Register as permanent
(D3, with removal from the browsable roll and name suppression offered
instead of deletion). **Nine are not determined**, and are recorded as
not determined rather than filled with a plausible number.

## 3. The four decisions

### Decision 1 — Who is the data controller?

A privacy notice must name a legal person who is answerable. The
College's own legal status is not settled: the evidence register still
carries the registered headquarters address as *to be published as
confirmed*.

| Option | Consequence |
|---|---|
| **A. Name the operating entity once it is incorporated** | Correct and unambiguous. Blocks the notice until incorporation is complete. |
| **B. Name the founder as sole trader in the interim** | Publishable immediately. The founder is personally answerable, and the notice must be reissued at incorporation — which means telling every learner the controller has changed. |
| **C. Publish nothing until A is possible** | The current position. It is the one that leaves learners with no notice at all, and it is getting worse as the platform holds more. |

**Recommendation: A, and treat it as the reason to finish
incorporation.** B is defensible only if enrolment opens first, and
enrolment opening before incorporation is itself a decision the Board
should take deliberately rather than by drift.

### Decision 2 — What is the lawful basis for each activity?

This is a legal determination, not an engineering one, and it differs by
activity: performance of a contract covers most of the teaching; consent
is the obvious basis for the public graduate profile and probably the
wrong one for assessment; legitimate interests may cover the permanent
Register but needs the balancing test written down.

The register carries `NOT DETERMINED` on all eleven, and the schema
**refuses to publish an activity while its basis is undetermined** — a
notice that cannot say why it may hold your passport number is not a
notice.

**Recommendation: take advice qualified in the operating jurisdiction,
on the eleven activities as listed.** The inventory is complete enough
to be handed to a solicitor as it stands, which is the point of having
built it first.

### Decision 3 — The nine undetermined retention periods

D1 and D3 set two. The other nine hold data indefinitely by default,
which is the position that requires the most justification and has had
none.

**Recommendation: adopt a default of seven years from the end of the
learner's last enrolment for the academic and financial records, and
tie the admissions record to the application outcome** — a rejected
application should not be kept as long as a completed programme. Both
figures are common practice rather than derived from anything the
College knows, and are offered as a starting point for the same advice
sought under decision 2, not as a recommendation to adopt untested.

### Decision 4 — Where the data sits, and who else sees it

Everything is on Cloudflare. Authentication is Clerk, email is Resend,
payments go to the gateway handling the card. That is factual and is
recorded per activity.

What is not determined is the international transfer position: where
Cloudflare stores this data, and what mechanism covers it.

**Recommendation: establish the storage region before enrolment opens.**
It is a configuration decision now and a migration later.

## 4. What is deliberately not in this paper

**A rewritten privacy notice.** The published page at
`/support/privacy/` already carries everything that can honestly be
said, and it has been corrected to publish the retention and erasure
decisions it previously described as open. What it cannot carry is a
controller, a lawful basis or a transfer position, because those are
decisions 1, 2 and 4 of this paper. Filling those blanks with plausible
text would produce something that looks like a commitment and is not
one. The page should be completed once the decisions are taken — from
the inventory in section 2 — and not before.

**A cookie policy.** Out of scope here and genuinely smaller; the site
sets no advertising or analytics cookies today.

**A claim that the College is compliant with anything.** It holds
personal data, has adopted three decisions about it, has now implemented
all three, publishes a privacy page, and has an inventory. That is
progress and it is not compliance, and this paper should not be quoted
as saying otherwise.

---

*Prepared for the Board. Sections 1 and 2 are statements of fact,
verifiable against `sql/schema.sql` and the tests named. Sections 3 and
4 contain recommendations that require decisions the Board has not
delegated.*
