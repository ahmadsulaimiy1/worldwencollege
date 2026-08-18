# Organisational chart — fictional placeholders

> **None of these people exist.** Every name, qualification and line of
> experience on this page is invented. Nobody listed here works for
> WEC-LC, holds the degree or membership attributed to them, or has
> consented to anything — because there is nobody to consent. This page
> is a design reference and a data dictionary for
> `sql/seed-demo-people.sql`, and it is the only place in the repository
> where the full chart is written down.
>
> **These names may not be published.** Not on the marketing site, not
> on `/faculty/`, not in a press release, not in a prospectus, not on
> the preview deployment. `https://preview.wec-lc.pages.dev` is reachable
> by anyone with the URL; "it's only the preview" is not a defence.
> `tests/demo-people.test.mjs` fails the build if any of these names
> reaches a page the public can load.

---

## Why fictional placeholders exist at all

The standing rule on this project is that institutional facts are never
invented: no fabricated leadership, no invented accreditation, no
testimonials from people who never spoke. That rule is not relaxed
here, and this page does not relax it.

What it does is separate two things the rule was collapsing:

- **A claim** — "Prof. Sarah Elizabeth Hughes is our Academic Director"
  on a public page. Still forbidden, permanently, regardless of intent
  or of how clearly a footnote elsewhere marks it as a mock-up.
- **A fixture** — eighteen realistic rows in a development database, so
  the enrolment and appointment screens can be designed against
  something that looks like a real staff list.

The second is ordinary engineering practice, and the absence of it was
producing real design defects: the administration screens had been
built and reviewed against three accounts named `demo@example.com`,
`tutor@example.com` and `admin@example.com`. Column widths, name
truncation, sort order, the readability of an appointment history, the
difference between a list of 3 and a list of 18 — none of that had been
looked at, because there was nothing to look at.

The chart below was supplied by the account owner, explicitly labelled
as fictional examples for interface design and mock-ups, and explicitly
not to be presented publicly. It is used on exactly those terms.

---

## The chart

Roles in the right-hand column are the platform's three **access
levels**, not job titles. See "How access was assigned" below — the
mapping is deliberate and is the part most worth arguing with.

| Position | Placeholder name | Stated background (fictional) | Platform access |
|---|---|---|---|
| MD / Chief Executive Officer | Dr. Ahmad Kareem Al-Hassan | PhD Educational Leadership; MBA; 20+ years international education strategy | `admin` |
| Academic Director | Prof. Sarah Elizabeth Hughes | PhD Applied Linguistics; MA TESOL; curriculum and assessment | `staff` |
| Registrar & Director of Student Affairs | Dr. Yusuf Ibrahim Rahman | EdD Higher Education Administration; MSc Educational Management | `admin` |
| Director of Learning Technologies | Dr. Amina Noor Siddiqi | PhD Educational Technology; MSc Computer Science | `student` |
| Director of Finance & Administration | Mr. David Christopher Harrington, FCCA | MBA (Finance); FCCA | `student` |
| Director of Marketing & Communications | Ms. Fatimah Zahra Al-Mansoori | MSc International Marketing; Chartered Marketer (CIM) | `student` |
| Quality Assurance & Academic Standards Manager | Dr. Omar Farooq Malik | PhD Education; MA TESOL | `staff` |
| Head of Admissions | Ms. Rebecca Anne Lawson | MSc International Education | `staff` |
| Head of Student Success & Support | Dr. Maryam Abdulrahman Saleh | EdD Student Affairs; MSc Counselling Psychology | `staff` |
| IT & Cybersecurity Manager | Mr. Khalid Mohammed Al-Nuaimi | MSc Cybersecurity; CISSP; AWS Solutions Architect | `student` |
| Programme Coordinator (English) | Dr. Zainab Ismail Hassan | PhD ELT; DELTA | `staff` |
| Assessment & Examinations Coordinator | Mr. James Edward Wallace | MA Language Assessment | `staff` |
| Curriculum Development Coordinator | Dr. Bilal Ahmed Siddiqui | PhD Curriculum Studies; MA Applied Linguistics | `staff` |
| Senior English Language Instructor | Ms. Khadijah Noor Rahman | MA TESOL; CELTA | `staff` |
| Senior English Language Instructor | Mr. Daniel Robert Collins | MA Applied Linguistics; DELTA | `staff` |
| Student Services Officer | Ms. Hafsa Ali Mohammed | BSc Education; PGDip Student Affairs | `staff` |
| Corporate Training Manager | Mr. Ibrahim Suleiman Khan | MBA; MA Business Communication | `student` |
| Executive Assistant to the CEO | Ms. Sophia Grace Bennett | BA Business Administration; CAP | `student` |

The "stated background" column is here so the seed file has a
dictionary and so a designer knows which row is meant to be the
Registrar. **It is not stored in the database**, because the `users`
table has no field for a job title or a qualification, and adding
production columns to hold fictional data would be the wrong trade.

---

## How access was assigned, and why it is uncomfortable

The platform has three access levels and no fourth:

- `admin` — can appoint and remove other people's access, and can read
  every learner record.
- `staff` — can enrol and withdraw learners, review voice recordings,
  and grade work.
- `student` — no elevated access whatsoever.

Access was assigned by asking one question of each position: **does
this job require opening a named learner's file?** Not seniority.

That produces two results worth stating plainly, because both look
wrong at first glance:

**The Director of Learning Technologies and the IT & Cybersecurity
Manager hold `student`.** They run the systems; that is not the same as
being entitled to read the people in them. Deploying the platform,
rotating keys and restoring a database are Cloudflare account
permissions, held outside this software entirely. Someone who
administers the infrastructure can of course reach the data by other
means — the point is that the product does not *hand* it to them as a
convenience, and any time they use that access it is visible as an
infrastructure action rather than an ordinary page view.

**Six senior people hold `student`.** Finance, marketing, corporate
sales, the CEO's assistant and both technology posts have no reason to
open a learner record, so they get nothing. The label is unfortunate:
`student` is the platform's word for "no grant", and calling the
Director of Finance a student is obviously not a description of them.

That is a real limitation and it is recorded here rather than papered
over: **the role model cannot express "employee, no learner access".**
A fourth role — `none`, or a separate employment flag — would say it
properly. I have not added one, because inventing an access level is a
governance decision about who may see student data, not a naming
tidy-up, and it belongs in `docs/governance-decisions.md` §A alongside
the questions it is really part of. It is added there as **A4**.

The two `admin` rows follow the recommendation at governance item
**A1** — the owner, plus one deputy. A1 is not adopted. If the
Executive amends it, this file and the seed change together.

---

## What the seed deliberately does not contain

**No appointment history.** `role_events` is empty for every one of
these accounts, so the History panel on `/admin-enrolments.html` reads
"no appointments recorded" for all eighteen. That is not an oversight
and not a gap to fill in. An appointment record answers *who granted
this access, when, why, and under whose authority* — the exact record
an institution is asked to produce when someone questions who could see
a student's file. Filling it with invented board minutes would make the
one artefact whose entire value is that it is true into a fiction.
Seeing the panel in its genuinely-empty state is also the more useful
design case: it is what a real deployment looks like on day one.

**No enrolments.** A placeholder staff list helps design an
administration screen. Placeholder learner progress — grades, completed
modules, submitted recordings — would be fabricated academic history,
which is a different thing, and would flow straight into the reports
and the certificate machinery.

**No photographs.** There is no such person to photograph, and a stock
portrait attached to an invented name is precisely the artefact that
makes a fabrication look like a fact.

---

## Using it

Local development database only:

```bash
npx wrangler d1 execute wec-lc --local --file=sql/seed-demo-people.sql
```

Remove every trace:

```sql
DELETE FROM role_events WHERE user_id LIKE 'usr_demo_%' OR actor_id LIKE 'usr_demo_%';
DELETE FROM enrolments  WHERE user_id LIKE 'usr_demo_%';
DELETE FROM users       WHERE id      LIKE 'usr_demo_%';
```

**Never `--remote`.** The deploy workflow does not reference this file,
and `tests/demo-people.test.mjs` asserts that it never starts to.

---

## The guard

`tests/demo-people.test.mjs` enforces the promises made on this page,
because a promise in a document that nothing checks is a promise until
the first person in a hurry:

1. Every seeded row is `usr_demo_*`, so the removal above is complete.
2. Every seeded address is on a `.invalid` domain — RFC 2606 reserves
   it as permanently unresolvable, so a misapplied seed can send mail
   to nobody.
3. Every `auth_provider_id` is `demo_*`. Clerk issues `user_*`, so no
   real session token can ever authenticate as one of these accounts.
   They can be looked at; they cannot be signed into.
4. **No placeholder name appears in any HTML, JS, CSS or JSON the site
   serves.** This is the assertion that matters most, and it scans the
   files as they ship rather than trusting that nobody pasted a name
   into a page.
5. The seed is not in `sql/migrations/`, and the deploy workflow does
   not name it — so neither the migration step nor the seed step can
   carry it to production.
6. The file loads cleanly against the real `sql/schema.sql` and
   produces exactly the eighteen rows, in the access split above.
