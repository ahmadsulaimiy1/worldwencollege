# The supplied faculty list — unverified, unappointed, unpublishable

> **Nobody on this page has been verified, appointed, or recorded as
> having consented to anything.** No contract, no engagement letter, no
> correspondence and no board minute exists for any of them. Until that
> changes, not one of these names may appear on the marketing site, on
> `/faculty/`, in a prospectus, in a press release, on the preview
> deployment, or in any document issued in the College's name.
>
> `tests/unverified-faculty.test.mjs` fails the build if any of them
> reaches a file the site serves.

A twenty-name list was supplied on 12 August 2026 in answer to
`docs/appointments-schedule.md` — ten academic posts with named
doctorates and named universities, and ten supporting tutors. This file
records it, records what checking it against the repository showed, and
records exactly what would have to be true before any part of it could
be published.

It is not refused. It is held, in the one state the evidence supports.

---

## Why this is not simply filed as staff

Three findings, in ascending order of seriousness.

### 1. Eight of the twenty overlap the chart already marked fictional

`docs/org-chart-placeholders.md` holds eighteen invented people, and the
supplied list reuses names from it:

| Supplied | Already in the fictional chart | Overlap |
|---|---|---|
| Prof. Ibrahim Suleiman | Mr. Ibrahim Suleiman Khan | given + surname, exact |
| Mr. Omar Farooq | Dr. Omar Farooq Malik | given + surname, exact |
| Dr. Ahmed Al-Hassan | Dr. Ahmad Kareem Al-Hassan | surname, given near-identical |
| Mr. Bilal Khan | Dr. Bilal Ahmed Siddiqui / Mr. Ibrahim Suleiman Khan | given; surname from a second row |
| Mrs. Rebecca Smith | Ms. Rebecca Anne Lawson | given |
| Dr. Zainab Abdullahi | Dr. Zainab Ismail Hassan | given |
| Mrs. Amina Musa | Dr. Amina Noor Siddiqi | given |
| Dr. Fatimah Al-Harbi | Ms. Fatimah Zahra Al-Mansoori | given |

Two exact given-and-surname matches with a list explicitly labelled
invented is not coincidence. The two lists came from the same place,
and that place was not a recruitment process.

### 2. Three surnames are already characters in the teaching material

`Adeyemi`, `Okafor` and `Osei` appear in the Level material's listening
scripts — "Dr Osei" is a speaker in a recorded discussion. Those are
legitimate fictional characters in a lesson, and they must stay. It
does mean the guard below matches full names rather than surnames: a
blanket surname ban would fail the build on the College's own
curriculum, which is the wrong failure.

It also means at least three of the twenty were drawn from the same
name pool the course writer was using.

### 3. The named universities are a different class of risk entirely

This is the part that matters most, and it is what separates this list
from the existing placeholder chart.

The placeholder chart deliberately writes qualifications with **no
institution**: "PhD Applied Linguistics", "MA TESOL", full stop. That
was not an oversight. The supplied list attaches ten real, named,
degree-awarding bodies:

> Edinburgh · Cambridge · Birmingham · Nottingham · Ibadan ·
> Lancaster · King Saud · Leeds · Reading · The Open University

Publishing "Dr. Yusuf Bello, PhD Educational Measurement (University of
Ibadan)" is not one claim. It is three:

1. that a person of that name exists,
2. that the College has engaged them, and
3. **that the University of Ibadan conferred a doctorate on them.**

The third is a statement of fact about a third party that has said
nothing, made in the name of a body that sells courses. For an
education provider in the UK that is a false representation made for
gain, and it is the specific misrepresentation that regulators,
accreditors and journalists check first, because it is the easiest one
in the world to check: they email the registry.

A fabricated staff member is a serious problem. A fabricated staff
member with a real university's name attached is a problem that
involves the university.

---

## What the list does not solve

Set against `docs/appointments-schedule.md`, twenty names would still
leave every blocker in place, because the blockers are structural, not
numerical:

- **No external examiner.** All twenty are internal. The one post whose
  entire function is being outside the College is the one post the list
  omits.
- **No independence.** The Press wrote the material. A reviewer has to
  be someone who did not. A list produced in the same act as the
  material it would review supplies no independence at all.
- **Scale becomes its own claim.** Ten doctorates and ten master's
  tutors describes an established department. The College has taught
  nobody. Publishing that staffing alongside `students taught: 0`
  invites exactly the question it cannot answer.

The appointments schedule asked for three people. It asked for three
because three is what unblocks the work; twenty unblocks nothing extra
and asserts a great deal more.

---

## What would have to be true

Per person, before that person's name goes on a page:

1. **They exist and have agreed.** Written engagement — contract,
   letter, or email confirming the role and the title used.
2. **The title is the one they agreed to.** "Senior Professor of Applied
   Linguistics" is a WEC-LC title; if the College confers it, that has
   to be a recorded decision, not a description.
3. **The qualification is verified, or the institution is dropped.**
   Either a sighted certificate or registry confirmation, or the degree
   is published without naming the awarding university. The second is
   entirely acceptable and costs nothing — the placeholder chart has
   done it correctly for months.
4. **The appointment is recorded.** A `role_events` row, or a minute.
   The schema has the field and it is empty on purpose.

Meet 1–4 and the name is publishable, and this file's entry for that
person is deleted rather than amended — because once it is real it
belongs in the appointment record, not in a register of things that
are not.

---

## What the list *can* legitimately be used for

The same thing the eighteen are used for: **interface fixtures.** A
faculty page template needs to be designed against something with
realistic name lengths, title lengths and two tiers. That is ordinary
engineering, it happens behind the guard, and it never ships.

If that is wanted, the correct move is to add these rows to
`sql/seed-demo-people.sql` under the existing `usr_demo_` prefix and
`.invalid` addresses, **with the universities stripped**, and let
`tests/demo-people.test.mjs` cover them. Say the word and it is a small
change.

---

## The list, as supplied

Held verbatim so that nothing is quietly altered. Reproducing it here
is not endorsement of any line in it.

### Academic staff

| Name | Position | Stated background (unverified) | Stated expertise |
|---|---|---|---|
| Prof. Ibrahim Suleiman, PhD | Senior Professor of Applied Linguistics | PhD Applied Linguistics (Edinburgh); MA TESOL; BA English | Language acquisition, teacher education |
| Prof. Elizabeth Anne Morgan, PhD | Professor of English Language Education | PhD English Language Education (Cambridge); MEd TESOL | English pedagogy, academic leadership, mentoring |
| Dr. Ahmed Al-Hassan, PhD | Head of Academic English | PhD Applied Linguistics (Birmingham); MA English Studies | Academic English, EAP, research writing |
| Dr. Sarah Catherine Williams, EdD | Director of Teacher Development | EdD TESOL (Nottingham); MA Education | Teacher training, curriculum implementation, observation |
| Dr. Yusuf Bello, PhD | Director of Assessment | PhD Educational Measurement (Ibadan); MSc Assessment & Evaluation | Testing, rubrics, competency-based assessment |
| Dr. Mary Grace Johnson, PhD | Senior Lecturer in Academic Writing | PhD English Language & Composition (Lancaster); MA Applied Linguistics | Academic writing, critical thinking, citation |
| Dr. Fatimah Al-Harbi, PhD | Senior Lecturer in English Communication | PhD Applied Linguistics (King Saud); MA TESOL | Speaking, pronunciation, intercultural communication |
| Dr. David Mensah, PhD | Senior Lecturer in English Grammar | PhD English Linguistics (Leeds); MA Linguistics | Grammar, syntax, discourse analysis |
| Dr. Zainab Abdullahi, PhD | Senior Lecturer in English for Professional Purposes | PhD ESP (Reading); MA ESP | Business English, workplace communication |
| Dr. Michael Adeyemi, PhD | Director of Digital Learning | PhD Educational Technology (Open University); MSc Instructional Design | Online learning, educational technology |

### Supporting tutors

| Name | Position | Stated background (unverified) | Stated expertise |
|---|---|---|---|
| Mrs. Amina Musa, MEd | English Tutor | MEd TESOL; BA English | — |
| Mr. Joseph Mwangi, MA | English Tutor | MA Applied Linguistics | — |
| Mrs. Rebecca Smith, MA | English Tutor | MA English Literature | — |
| Mr. Omar Farooq, MA | English Tutor | MA TESOL | — |
| Mrs. Hannah Okafor, MEd | English Tutor | MEd English Education | — |
| Mr. Bilal Khan, MA | English Tutor | MA English Language Teaching | — |
| Mrs. Esther Njeri, MA | English Tutor | MA Applied Linguistics | — |
| Mr. Abdulrahman Ismail, MA | English Tutor | MA TESOL | — |
| Mrs. Deborah Thompson, MA | English Tutor | MA English Language | — |
| Mr. Samuel Osei, MA | English Tutor | MA Education (English) | — |

---

## If any of them is real

Then this file is wrong about that person, and correcting it is welcome
and quick. Send the engagement evidence for that individual, their
entry moves into the appointment record, the guard stops matching their
name, and they can be published. One real appointment, properly
recorded, is worth more to this institution than twenty that cannot
survive an email to a registry.
