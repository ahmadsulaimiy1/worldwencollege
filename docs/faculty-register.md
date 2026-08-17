# Faculty register

The record of who teaches and leads academically at AIPC. This file
is the **single source of truth** for the roster: `/faculty/` is
published from it, and `tests/faculty-roster.test.mjs` fails the build
if the page and this file ever disagree — in either direction.

**Roster attested by the College, 12 August 2026.** The account owner
confirmed that all twenty below are legally hired and engaged. Titles,
positions and stated qualifications are as supplied by the College.

## Provenance of each field

Recorded once here so nobody has to ask later, and so the page's
wording can be accurate rather than merely confident.

| Field | Provenance |
|---|---|
| Name, position | Supplied and attested by the College |
| Degree and awarding institution | Supplied and attested by the College; certificates held in the College's own HR file, not in this repository |
| Expertise | Supplied by the College |
| Engagement dates | **Not yet supplied** — see below |

The public page therefore says these are the College's appointed
faculty, which is what the College attests, and does not claim that
this repository has independently verified anybody's degree, which it
has not. That is ordinary provenance for any staff record and is the
form that protects the College if a credential is ever queried.

## Outstanding, and easy to close

1. **Engagement dates.** `role_events` in `sql/schema.sql` holds an
   appointment audit trail and is empty. Supply a start date per person
   and the appointments become records rather than a list.
2. **Consent to publish.** Names, titles and qualifications on a public
   site are personal data. Staff publication normally runs on legitimate
   interest and is unremarkable, but it should be stated in the
   engagement letter rather than assumed.
3. **Photographs.** The page is built to take portraits when they
   exist. It does not use stand-in imagery.

## What the roster still does not cover

Not a criticism of the appointments — a statement of what twenty
internal posts structurally cannot supply, carried over from
`docs/appointments-schedule.md`:

- **External Examiner** — still vacant, and still the one post that
  cannot be filled internally, because its whole function is being
  outside the College. Awards cannot be conferred without it.
- **BASCE membership** — the board still records
  `members_appointed = 0`, so the competency mappings remain `interim`.
  Members can now be drawn from this faculty, provided at least one is
  external.
- **Academic review independence** — a reviewer must be someone who did
  not write the material. The Press wrote it, so any of the ten
  academic staff can review it; the assignment just has to be recorded.

Those three are now *assignable* rather than *unfillable*, which is the
real change this roster makes.

## A note for whoever edits the site next

Three surnames on this roster — **Adeyemi, Okafor, Osei** — are also
names of fictional speakers in the Level material's listening scripts,
and **Smith** authors an example citation in the academic-writing
material. Those are lesson characters, they predate the roster, and
they are unrelated to the staff of the same surname. Do not "fix" one
to match the other.

Separately, `docs/org-chart-placeholders.md` holds eighteen invented
administrative placeholders that may never be published, and two of
them share a given-and-surname with faculty here — "Mr. Ibrahim
Suleiman Khan" and "Dr. Omar Farooq Malik". Those placeholder rows are
still banned from the public site by `tests/demo-people.test.mjs`; the
faculty of similar name are not. The two tests are asserted against
each other so the distinction cannot quietly collapse.

## Arabic renderings

`/ar/faculty/` is held to the same claim standard as the English page,
so it carries the same roster rather than a recruiting notice. Names
stay in Latin script and **qualifications stay in English**, which is
ordinary practice on Arabic academic pages and — more importantly —
avoids translating a degree title into something that no longer names
the qualification the person actually holds. Mistranslating a doctorate
is a factual error about a member of staff, and the safe form costs
nothing.

Only positions are rendered in Arabic. Tutor titles are gendered from
the honorific in the roster: Mr. takes the masculine form, Mrs. and Ms.
the feminine.

| Position (register) | Arabic |
|---|---|
| Senior Professor of Applied Linguistics | أستاذ أول في اللسانيات التطبيقية |
| Professor of English Language Education | أستاذة تعليم اللغة الإنجليزية |
| Head of Academic English | رئيس قسم الإنجليزية الأكاديمية |
| Director of Teacher Development | مديرة تطوير المعلمين |
| Director of Assessment | مدير التقويم |
| Senior Lecturer in Academic Writing | محاضِرة أولى في الكتابة الأكاديمية |
| Senior Lecturer in English Communication | محاضِرة أولى في التواصل باللغة الإنجليزية |
| Senior Lecturer in English Grammar | محاضِر أول في قواعد اللغة الإنجليزية |
| Senior Lecturer in English for Professional Purposes | محاضِرة أولى في الإنجليزية للأغراض المهنية |
| Director of Digital Learning | مدير التعلّم الرقمي |
| English Tutor | مدرّس لغة إنجليزية |
| English Tutor (feminine) | مدرّسة لغة إنجليزية |

---

## Academic staff

| Name | Position | Stated background | Stated expertise |
|---|---|---|---|
| Prof. Ibrahim Suleiman, PhD | Senior Professor of Applied Linguistics | PhD Applied Linguistics (Edinburgh); MA TESOL; BA English | Language acquisition, teacher education |
| Prof. Elizabeth Anne Morgan, PhD | Professor of English Language Education | PhD English Language Education (Cambridge); MEd TESOL | English pedagogy, academic leadership, mentoring |
| Dr. Ahmed Al-Hassan, PhD | Head of Academic English | PhD Applied Linguistics (Birmingham); MA English Studies | Academic English, EAP, research writing |
| Dr. Sarah Catherine Williams, EdD | Director of Teacher Development | EdD TESOL (Nottingham); MA Education | Teacher training, curriculum implementation, observation |
| Dr. Yusuf Bello, PhD | Director of Assessment | PhD Educational Measurement (Ibadan); MSc Assessment & Evaluation | Testing, rubrics, competency-based assessment |
| Dr. Mary Grace Johnson, PhD | Senior Lecturer in Academic Writing | PhD English Language & Composition (Lancaster); MA Applied Linguistics | Academic writing, critical thinking, citation |
| Dr. Fatimah Al-Harbi, PhD | Senior Lecturer in English Communication | PhD Applied Linguistics (King Saud); MA TESOL | Speaking, pronunciation, intercultural communication |
| Dr. David Mensah, PhD | Senior Lecturer in English Grammar | PhD English Linguistics (Leeds); MA Linguistics | Grammar, syntax, discourse analysis |
| Dr. Zainab Abdullahi, PhD | Senior Lecturer in English for Professional Purposes | PhD English for Specific Purposes (Reading); MA ESP | Business English, workplace communication |
| Dr. Michael Adeyemi, PhD | Director of Digital Learning | PhD Educational Technology (Open University); MSc Instructional Design | Online learning, educational technology |

## Supporting tutors

| Name | Position | Stated background |
|---|---|---|
| Mrs. Amina Musa, MEd | English Tutor | MEd TESOL; BA English |
| Mr. Joseph Mwangi, MA | English Tutor | MA Applied Linguistics |
| Mrs. Rebecca Smith, MA | English Tutor | MA English Literature |
| Mr. Omar Farooq, MA | English Tutor | MA TESOL |
| Mrs. Hannah Okafor, MEd | English Tutor | MEd English Education |
| Mr. Bilal Khan, MA | English Tutor | MA English Language Teaching |
| Mrs. Esther Njeri, MA | English Tutor | MA Applied Linguistics |
| Mr. Abdulrahman Ismail, MA | English Tutor | MA TESOL |
| Mrs. Deborah Thompson, MA | English Tutor | MA English Language |
| Mr. Samuel Osei, MA | English Tutor | MA Education (English) |

---

## Changing the roster

Edit this file, then run `node --experimental-sqlite tests/run.mjs`. The
test will fail until `/faculty/` matches, which is the intended order of
operations: the register moves first, the site follows. Removing someone
means removing them from both.
