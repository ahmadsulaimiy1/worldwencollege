# Grid audit — 22 August 2026

Commissioned by the Founder: *"The same invisible grid should govern masthead, hero,
menu, content, pricing, cards, statistics, faculty, footer… Nothing should feel like
separate pages built at different times."*

Measured, not eyeballed: every `<section>` on all 32 routes at 1440px, recording the
container's left edge, its width, and the section's vertical padding; then every
English page compared against its Arabic twin for content shape.

---

## 1. The horizontal grid holds

160 sections measured. Two container widths, and only two:

| Width | Left edge | Count | What it is |
|---|---|---|---|
| 1180px | 130px | 130 | the page measure, `--wrap` |
| 900px | 270px | 30 | the hero measure — one per page, both trees |

No section anywhere sits off those two lines. The grid the Founder asked for already
exists; what follows are the places where something else drifted.

## 2. The vertical rhythm holds, with one deliberate exception

| Padding (top/bottom) | Count | What |
|---|---|---|
| 96 / 96 | 129 | every body section |
| 86.4 / 72 | 28 | the interior page heroes, all fourteen pages × both trees |
| 96 / 84 | 2 | the home page hero — `.r-hero`, its own component |
| 96 / 0 | 1 | *(resolved — see §3)* |

The home hero differing is **not** a fault. It is a distinct component for the front
page and it sits on the same 900px measure as every other hero; forcing its padding to
match would be false consistency. Recorded so the next person does not "fix" it.

## 3. Structural drift between the trees — the Riwāq  *(fixed)*

Of sixteen page pairs, fifteen matched section for section. `/riwaq/` did not, and it
carried four differences — one of them a defect:

- English had a `riwaq-intro` class the Arabic lacked; Arabic had `section--flush-b`
  the English lacked.
- The Arabic eyebrow and the Arabic `h1` were **the same word** — الرواق above الرواق —
  where the English eyebrow named the page and the `h1` said what it was.
- **The two ledes told the reader different things.** The English explained the name;
  the Arabic explained the limitation. Each tree was missing half of what the other said.
- **The Arabic page had no `<noscript>` at all.** A reader with JavaScript disabled met
  a blank page in Arabic where an English reader met an explanation.

Both pages now say both things, carry the same fallback, and share one section.

## 4. Content-shape divergence between the trees

Six of sixteen pairs differ in what they contain. Counted elements, English ≠ Arabic:

| Page | Divergence |
|---|---|
| `/` | paragraphs 18 ≠ 19 |
| `/awards/` | links 8 ≠ 9 |
| `/awards/register-of-chains/` | paragraphs 3 ≠ 4, links 2 ≠ 1, plates 2 ≠ 1 |
| `/verify/` | list items 5 ≠ 4, links 1 ≠ 2 |
| `/contact/` | headings h2 0 ≠ 1 |
| `/short-courses/` | h3 8 ≠ 4, tables 1 ≠ 2, cards 8 ≠ 4 — **see §5** |

Small counts can be legitimate: Arabic sometimes wants a sentence split where English
does not. They are recorded rather than levelled, because forcing identical element
counts would be mirroring, which is the thing the Founder's amendment forbids. Each
needs reading by someone who reads both languages.

## 5. **THE SAME FOUR MEMORISATION SCHEDULES ARE PUBLISHED WITH DIFFERENT DURATIONS**

Not a layout divergence. A contradiction of published fact, and the most serious thing
this audit found.

The Faculty of the Qur'ān issues four graduated schedules, free and without condition of
enrolment. Both trees publish four. They do not agree.

| English (`/short-courses/#schedules`) | Arabic (`/ar/short-courses/#schedules`) |
|---|---|
| **Fourteen months** — two to three hours daily | **المتيسِّر** — one page a day — *about three years* |
| **Ten months** — presupposes a sound reading | **المنتظم** — two pages a day — *about one year and eight months* |
| **Six months** — for those already holding a portion | **المكثَّف** — four pages a day — *about ten months* |
| **Five months** — full-time study | **المتفرِّغ** — eight pages a day — *about five months* |

Only the fourth agrees. The other three contradict outright — the same schedule is
fourteen months in English and about three years in Arabic.

The two are not even built on the same axis: the English names each schedule by its
duration and qualifies it by hours; the Arabic names each by its character and
qualifies it by pages a day.

**The Arabic set is internally derivable** — 604 pages at one, two, four and eight a
day is roughly 20, 10, 5 and 2.5 months, and the stated durations are close to double
those, which is what the revision built into every schedule from the first week would
cost. **The English set has no visible derivation.**

That is a reason to suspect, not a reason to act. Which set is correct is an academic
question for the Faculty of the Qur'ān, and it is not for a stylesheet, or for me, to
decide. It is recorded here and put to the Founder because:

1. these schedules are given to anyone who asks, so students act on them;
2. a bilingual reviewer comparing the two pages finds the College contradicting itself
   about its own flagship offering;
3. and it must be settled **before** the site is sent to professors, not after.

Nothing has been changed on either page.
