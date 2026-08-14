# Governance register

The record of who governs WEC-LC. This file is the **single source of
truth** for the Board of Governors, the Academic Senate and the College
Executive: `/about/governance/` and `/ar/about/governance/` are
published from it, and `tests/governance-register.test.mjs` fails the
build if the pages and this file ever disagree — in either direction.

Companion to `docs/faculty-register.md`, which holds the twenty teaching
and academic staff. The two files cover different bodies and are checked
against each other; see **Collisions** below, which is not an
afterthought.

**Roster attested by the College, 14 August 2026.** The account owner
confirmed that all fifteen below hold the posts recorded against them.
Titles, positions and stated qualifications are as supplied by the
College.

## Provenance of each field

Recorded once here so nobody has to ask later, and so the pages' wording
can be accurate rather than merely confident.

| Field | Provenance |
|---|---|
| Name, post | Supplied and attested by the College |
| Degree and awarding institution | Supplied and attested by the College; certificates held in the College's own HR file, not in this repository |
| Responsibilities | Supplied by the College, and matched to the remit the body actually holds |
| Appointment dates | **Not yet supplied** — see below |

The public pages therefore say these are the College's appointed
governors, senators and officers, which is what the College attests, and
do **not** claim that this repository has independently verified
anybody's degree, which it has not. That is ordinary provenance for any
governance record and is the form that protects the College if a
credential is ever queried.

## What appointment does and does not settle

Constituting a body is not the same as the body having acted, and the
site must not let one stand in for the other.

- The **Academic Senate is now constituted** — three members, recorded
  in `academic_bodies.members_appointed`. It has **not yet met**, so the
  skill mappings and descriptor thresholds it would approve remain
  `interim`. They become `approved` when a minuted decision exists, not
  when a member list exists.
- **BASCE is not named anywhere in the supplied roster** and therefore
  stays at `members_appointed = 0`. Competency mappings remain interim.
  It is not inferred from the Board's Governor for Academic Affairs:
  the Board and BASCE are different bodies with different remits, and
  reading one as the other is precisely the kind of quiet substitution
  this register exists to prevent.
- The **External Examiner post remains vacant.** The College's own
  governance text describes the role and names nobody to it. Awards
  therefore still cannot be conferred, and every page that says so keeps
  saying so.
- **No Academic Reviewer has been assigned.** Any of the ten academic
  staff may review a volume they did not write; until an assignment is
  recorded, the volumes remain reviewed only by their authors.

## Outstanding, and easy to close

1. **Appointment dates.** `role_events` in `sql/schema.sql` holds an
   appointment audit trail and is empty. Supply a start date per person
   and the appointments become records rather than a list.
2. **Consent to publish.** Names, titles and qualifications on a public
   site are personal data. Governor publication is unremarkable and
   normally runs on legitimate interest, but it should be stated in the
   appointment letter rather than assumed.
3. **Terms of office.** A board with no stated term is a board with no
   stated succession, which is awkward for a College whose sixth
   principle is stewardship.
4. **The three collisions below.**

## Collisions with the faculty register — MUST BE SETTLED

Three posts or people appear in both registers with different content.
None of these is a code defect and none of them can be resolved from
inside this repository; each is a question only the College can answer.
`tests/governance-register.test.mjs` reports them on every run so they
stay visible, and refuses to let a fourth appear unnoticed.

| # | The collision | Why it matters |
|---|---|---|
| 1 | **Director of Digital Learning** is held by *Dr. Michael Adeyemi, PhD* in the faculty register and by *Mr. Ibrahim Hassan Yusuf* here | One post, two holders. Whichever is right, the other page is wrong today. |
| 2 | **Professor of English Language Education** is held by *Prof. Elizabeth Anne Morgan, PhD* in the faculty register and by *Professor Amina Rahman* here | Same post title, two holders. May simply be two professorships of the same name, in which case say so. |
| 3 | *Dr. Yusuf Bello, PhD* is **Director of Assessment** in the faculty register; *Dr. Yusuf Abdulrahman Bello* is **Governor for Academic Affairs** here | If these are the same person, the College's own second principle — *no person approves their own work* — is breached by the appointment, because the Governor for Academic Affairs oversees programme standards that the Director of Assessment sets. If they are two people, this register should say so explicitly, as it already does for Adeyemi, Okafor, Osei and Smith. |

## Surname coincidences that are not collisions

Carried over from the faculty register's own note, and extended.
**Okafor** and **Osei** are also names of fictional speakers in the Level
material's listening scripts; **Suleiman**, **Musa**, **Morgan**,
**Rahman** and **Yusuf** each occur across the faculty roster and this
one. Those are separate people of similar name. Do not "fix" one to
match the other.

Separately, `docs/org-chart-placeholders.md` holds eighteen invented
administrative placeholders banned from the public site by
`tests/demo-people.test.mjs`. No name in this register is one of them,
but two are close enough to note: **Mrs. Rebecca Anne Collins** here
against placeholders *Ms. Rebecca Anne Lawson* and *Mr. Daniel Robert
Collins*, and **Dr. Sarah Elizabeth Morgan** here against placeholder
*Prof. Sarah Elizabeth Hughes*. The ban is on full names and neither is
a match, so neither is blocked — but if either was typed from the
placeholder file rather than from an appointment letter, this is the
line where somebody should notice.

## Arabic renderings

`/ar/about/governance/` carries the same roster as the English page,
held to the same claim standard. Names stay in Latin script and
**qualifications stay in English**, following the rule already set for
`/faculty/`: mistranslating a doctorate is a factual error about a named
person, and the safe form costs nothing. Only posts and body names are
rendered in Arabic.

| Post or body (register) | Arabic |
|---|---|
| Board of Governors | مجلس الأمناء |
| Academic Senate | المجلس الأكاديمي |
| College Executive | الإدارة التنفيذية |
| Independent External Examiner | الممتحن الخارجي المستقل |
| Chair of the Board of Governors | رئيس مجلس الأمناء |
| Independent Governor | عضو مستقل بمجلس الأمناء |
| Governor for Academic Affairs | عضو مجلس الأمناء للشؤون الأكاديمية |
| Governor for Finance and Audit | عضوة مجلس الأمناء للمالية والمراجعة |
| Governor for Ethics and Institutional Values | عضو مجلس الأمناء للأخلاقيات والقيم المؤسسية |
| Member, Board of Governors | عضو مجلس الأمناء |
| Dean of Academic Affairs | عميد الشؤون الأكاديمية |
| Professor of English Language Education | أستاذة تعليم اللغة الإنجليزية |
| Professor of Applied Linguistics | أستاذ اللسانيات التطبيقية |
| President | رئيس الكلية |
| Provost | وكيلة الكلية |
| Registrar | مسجّل الكلية |
| Director of Quality Assurance | مديرة ضمان الجودة |
| Director of Digital Learning | مدير التعلّم الرقمي |
| Director of Student Success | مديرة نجاح الطلاب |

---

## Board of Governors

Strategic oversight. Preserves the mission, safeguards academic
independence, oversees financial sustainability, and appoints senior
officers.

| Name | Post | Stated background | Stated responsibilities |
|---|---|---|---|
| Dr. Ibrahim Musa Al-Khatib, PhD | Chair of the Board of Governors | PhD Higher Education Leadership (Edinburgh); MEd Educational Administration (Birmingham); BA English Language and Literature (Al-Azhar); Fellow, Chartered College of Teaching | Strategic leadership, institutional governance, appointment of senior officers, long-term planning |
| Professor Mary Elizabeth Thompson, PhD | Independent Governor | PhD Applied Linguistics (Cambridge); MA TESOL (Leeds); BA English Studies (Durham); former Professor of Language Assessment | Academic independence, curriculum oversight, external academic advice, quality assurance |
| Dr. Yusuf Abdulrahman Bello | Governor for Academic Affairs | PhD Applied Linguistics; MA TESOL; B.Ed English Education; Cambridge Assessment Specialist | Academic policy, programme standards, curriculum quality, learning outcomes |
| Mrs. Grace Nneka Okafor, FCA | Governor for Finance and Audit | MBA Finance; BSc Accounting; Fellow, Institute of Chartered Accountants | Financial oversight, risk management, audit supervision, budget governance |
| Sheikh Dr. Abdul Hakeem Al-Faruqi | Governor for Ethics and Institutional Values | PhD Islamic Education; MA Comparative Ethics; author on educational ethics | Institutional ethics, faith compatibility, values framework, student welfare oversight |
| Ahmad Sulaimi | Member, Board of Governors | No qualification claimed. Areas of interest: English language curriculum design, educational publishing, digital learning systems, international English education | Academic governance, curriculum review, strategic educational planning, institutional development |

The last row is deliberately the only one with no qualification. It is
the account owner, and the register states an interest rather than
inventing a credential, which is the same discipline applied to
everybody else's degrees in the other direction.

## Academic Senate

The College's highest academic authority. Oversees academic standards,
curriculum development, assessment integrity, research quality and
academic regulations. Operates independently of operational management
and advises the Board on academic matters.

**Members appointed: 3.** Mirrored in `academic_bodies.members_appointed`
for `SENATE`, which is what the published figures are read from. The
count is the number of rows below and nothing else — no ex-officio seat
is inferred, and if the College intends one it should be a row here
rather than an adjustment to the number.

| Name | Post | Stated background | Stated expertise |
|---|---|---|---|
| Professor Daniel Jonathan Williams | Dean of Academic Affairs | PhD Applied Linguistics; MA Language Education; former Dean of Languages | Language acquisition, assessment, curriculum design |
| Professor Amina Rahman | Professor of English Language Education | PhD TESOL; former Cambridge Examiner | Communicative language teaching |
| Professor David Adewale Johnson | Professor of Applied Linguistics | PhD Applied Linguistics | Corpus linguistics, curriculum development |

The Dean of Academic Affairs sits on the Senate and is counted in the
three. He also holds an Executive-adjacent title, which is worth the
Board's attention under the second principle: a Dean who sits on the
body that oversees academic standards is ordinary in British practice,
but it should be a recorded decision rather than an accident of two
lists being written on the same afternoon.

## College Executive

Manages the daily operation of the College under policies approved by
the Board.

| Name | Post | Stated background | Stated responsibilities |
|---|---|---|---|
| Dr. Kaelan Armand | President | PhD Higher Education Leadership (University College London); MBA International Educational Management; MA Educational Policy; BA International Studies | Institutional leadership, strategic partnerships, executive management, international development, implementation of Board policy |
| Dr. Sarah Elizabeth Morgan | Provost | Not supplied | Academic operations, faculty leadership, quality enhancement, strategic academic planning |
| Mr. Musa Suleiman | Registrar | Not supplied | Student records, academic regulations, graduation, institutional documentation, official certification |
| Mrs. Rebecca Anne Collins | Director of Quality Assurance | Not supplied | Academic review, institutional audits, policy compliance, continuous improvement, programme evaluation |
| Mr. Ibrahim Hassan Yusuf | Director of Digital Learning | Not supplied | Digital campus, learning technologies, educational innovation, online delivery, student platforms |
| Mrs. Hannah Grace Osei | Director of Student Success | Not supplied | Student wellbeing, academic support, learning guidance, student engagement, graduate progression |

Five of the six were supplied with responsibilities but no
qualifications. "Not supplied" is published as nothing at all rather
than as a guess, and the page renders the post and its responsibilities
without a credentials line. A blank is honest; a plausible degree is
not.

## Independent External Examiner

**Vacant.** The post is separate from the institution by definition: the
External Examiner reviews assessments, academic standards, marking
consistency and the integrity of awards, and reports directly to the
Board of Governors rather than through the Executive.

It is the one post that cannot be filled from inside the College, and
until it is filled **no award can be conferred**. Every page that states
this continues to state it, and `tests/adopted-decisions.test.mjs` holds
the awards page to it.
