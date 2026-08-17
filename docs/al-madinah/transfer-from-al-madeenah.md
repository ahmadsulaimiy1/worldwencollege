# Transfer register — Al-Madeenah → Al-Madinah International College

> **Status: closed register.** This records a one-time transfer, completed. The Al-Madeenah
> academic editorial bible is **no longer consulted** — see `editorial-bible.md` `EB §0`, which
> supersedes it and sets out what it imposed. The sixteen academic rules listed below survive
> because they were re-examined and are right; they are now the College's own, in the Academic
> Regulations. Nothing further is to be taken from that repository.
>
> Written before the rename; *Dār al-Rusūkh* below means Al-Madinah International College.

What was taken from the Al-Madeenah International Studies repository, where it landed in
the College's **contents**, and — as importantly — what was left behind.

Source read: `ahmadsulaimiy1/Al-Madeenahcollege` — `docs/12-academic-editorial-bible.md`
(1,672 lines), `docs/decision-register.md` (708), `docs/14-academic-engine.md` (262).

---

## Not taken, deliberately

| Idea there | Why it is not here |
|---|---|
| **Arabic books made into courses** | Excluded by instruction. Dār al-Rusūkh names the *programme* and lists prescribed texts inside the syllabus, which is the correction already made to this site and is not reopened. |
| **"The College does not grant ijāzah"** (their `§37.2`, `D-04`, `D-06`) | Their ruling, on their facts: they have no appointed *muqriʾ* and no verified *asānīd*, so the word would be unearned. Dār al-Rusūkh's founder holds *ijāzah* in the ten readings and the College publishes a Register of Asānīd — the premise does not transfer, so the conclusion must not. **What transferred is the discipline behind it**: five conditions precedent, published on the Awards page, that must all hold before a narration is offered at all. |
| Their level ladder, hour figures and CEFR mapping | Their arithmetic, for their programmes. Ours is derived from our own semester (16 weeks × 3 classes × 90 min ⇒ 200 notional hours) and the derivation is shown on the page rather than asserted. |
| Their three-school structure, naming, and page architecture | This College has four faculties and its own chrome. Structure is not a transferable idea; standards are. |

---

## Taken, and where it landed

| Idea | Landed in |
|---|---|
| **A manual, numbered and citable** (`Reg. 3.2` in an offer letter, an appeal outcome, a syllabus) | New page `madinah-src/pages/regulations.html` — ten regulations, cited by number, with an amendment and citation clause. A decision that cites no regulation is a decision a student cannot examine. |
| **Levels are hours, not months** (`§19`) | Reg. 2 + a plate on the Faculties page telling the reader how to read the duration column. Duration is an output of pace; the body of work is the programme. |
| **Notional hours rather than credit units** (`§19.1`) | Reg. 2, with the reason stated: *credit unit* carries a regulatory meaning in Nigeria and using it would borrow an authority the College has not earned. |
| **The equal-standard rule** (`§21`) | Reg. 1.1. A pathway may never be made by removing content. |
| **Flexibility without chaos** (`§22`) | Reg. 4 — minimum sustained pace, maximum registration, approved leave, dormancy, re-entry, lapse with a Statement of Results. Reconciled with the existing "two consecutive semesters" already published on the Tuition page rather than contradicting it. |
| **Mastery defined in load-bearing clauses** (`§16`) | Reg. 3.1 — to the published criterion, on demand, without notice, after an interval. |
| **The Retention Rule** (`§16.1`) | Reg. 3.2, the Faculty of the Qur'ān page, and the home page. The single strongest claim the College makes. |
| **The Five Returns** (`§29.1`) | Reg. 3.3, the Faculty of the Qur'ān page, **and implemented** in `js/riwaq-store.js` — 1, 3, 7, 21, 60 days, with the return index carried on every page of the ledger. |
| **An automatic mark may never be a gate** (`§30`) | Reg. 5 and the instruments table. |
| **Integrity by design, not surveillance** (`§33`) | Reg. 5 — no webcam monitoring, screen recording, keystroke analysis or browser lockdown, with the reason: they fail hardest on the students this College exists for. |
| **Moderation and free appeal** (`§34`) | Reg. 5 and the Awards page. |
| **Free, unlimited re-examination** (`§17`) | Reg. 3.4 and the Awards page. A College that charges for a retake has given itself a reason to prefer failure. |
| **Bands, not percentages, on the instrument** (`§35`) | Reg. 6 — reconciled with the College's existing 70% pass standard: the mark is on the transcript, the band is on the certificate. |
| **Reasonable adjustments** (`§76`) | Reg. 7 — decided by the Registry with an academic, never by the student's own teacher; an adjustment changes how the standard is reached, never the standard; nothing recorded on the instrument. |
| **The transcript a stranger can evaluate** (`§39`) | Reg. 8 and the Awards page — the grade scale printed on the document itself. |
| **Engagement metrics are not attendance** (`§74`) | Reg. 8. A proxy printed on an academic record is an untruth with a number attached. |
| **Assessor independence** (`§72`) | Reg. 9 — the examiner cannot see the fee, no pass-rate target exists anywhere, no commercial officer may alter a gate outcome, protected disclosure. Echoed on the Tuition and Admission pages. |
| **What every credential must state, including what it does *not* certify** (`§38`) | New "The instruments" section on the Awards page, and the Certificate of Attainment / Certificate of Attendance distinction on Continuing Education. |
| **The register is the credential** (`§40`) | Awards page and Standing page. |
| **Continuity of the register** (`§77`, `D-21`) | Standing page — open format, rebuildable from one archive and tested, three copies across two custodians, a named successor, and verification switched off last. |
| **Safeguarding** (`§70`, `D-19`) | New page `safeguarding.html`, plus notices on Admission, Awards and Tuition. **This was the most serious gap in the site**: it advertised Ibtidā'iyyah at minimum age ten with no safeguarding statement of any kind. |
| **Arrangements between men and women** (`§71`) | Safeguarding page, stated in advance, and summarised on Admission — the camera is never required. |
| **Language of instruction declared before enrolment** (`§73`) | Admission page and the Faculties page. |
| **What earns a place in the curriculum** (`§25`) | New closing section on the Faculties page — necessity, teachable at distance, examinable, staffed. |
| **The course design standard** (`§28`) | Faculties page — no observable verb, no outcome; no outcome, no gate; no gate, no certificate, and therefore no fee. |
| **Live vs asynchronous designed against each other** (`§27`) and **the bandwidth covenant** (`§27.2`) | About page. |
| **Time-zone architecture and sections** (`§27.1`) | Calendar page, including: no live class across its own section's Maghrib window. |
| **External examination stated as a present limitation** (`§75`) | Standing page — moderation is internal until an External Examiner is appointed, and every surface describing examination says so. |
| **The NBAIS problem and two routes** (`§23`, `D-14`) | Standing page — Academic Route open, Certificated School Route not built and not sold until the Board's requirements are confirmed in writing. Cross-linked from the Awards page so no candidate can mistake whose certificate they are receiving. |
| **Every claim classified before publication** (`§62`) | Standing page — a recorded fact, a published rule, or a stated estimate. The predecessor programme's enrolment figures are labelled as counts from 2020–2022 rather than absorbed into a present claim. |
| **Information held on students** (`C-1`) | Standing page. |

---

## For the Founder to rule on

Three of these are decisions above the level of a page edit. They are written as the College's
position because a site cannot publish an open question, but they should be confirmed or
changed:

1. **Minors and one-to-one teaching.** As published, the Individual and *Ijāzah* modes are
   *closed* to students under eighteen unless a guardian attends or a second member of faculty
   is appointed without charge. Al-Madeenah went further and barred minors entirely until its
   safeguarding section was operative. The middle position published here is defensible, but it
   costs revenue in exactly the modes that carry the highest fee, and it binds the College the
   day a parent reads it.
2. **The Certificated School Route.** Now published as *in preparation* and explicitly not sold.
   If the intention is to offer NBAIS-examined stages, the Board's requirements must be
   confirmed in writing before that page changes.
3. **The Safeguarding Officer.** The page names an office, an address and a reporting duty. It
   needs a person appointed, reporting to the Trustees and outside the teaching line, before the
   first minor is admitted. Until then the page is a promise rather than a control.
