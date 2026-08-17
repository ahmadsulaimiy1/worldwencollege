# The Imagery Plan — closing the sixteen imageless pages

The Visual Storytelling committee (scripts/red-flag-audit.mjs) found
sixteen pages carrying over 700 words with no photograph: the twelve
level pages, both editions of Teaching Practice, and both editions of
the FAQ. Every one is a page a deciding reader actually uses.

The remedy uses ONLY plates already licensed and registered in
`assets/images/plates/CREDITS.md` — reuse on this website is within
both the Adobe Stock standard licence and the Openverse licences, and
the register's own processing note says the duotone is applied in CSS
precisely so a photograph can be re-used elsewhere under a different
ramp. Every placement below, when implemented, updates the "Where used"
column in CREDITS.md in the same commit. No new sourcing, no new
licences, nothing unverifiable.

## Placements

The level pages are GENERATED — the plate goes into
`scripts/build-levels.js` / `scripts/build-arabic-levels.js` as a
per-level parameter, never into the built pages. One plate per level,
chosen so the sequence itself tells the story of the ascent:

| Page | Plate | Why this one |
|---|---|---|
| Level I — Foundation | `manuscript.jpg` | First letters. The beginning of the written language. |
| Level II — Elementary | `study.jpg` | One learner, working. The daily discipline the level asks for. |
| Level III — Intermediate | `seminar.jpg` | Conversation — the level where speaking carries the grade. |
| Level IV — Upper-Intermediate | `reading-hall.jpg` | Sustained reading at length, in company. |
| Level V — Advanced | `stacks.jpg` | The depth of the library; range and register. |
| Level VI — Mastery | `colonnade.jpg` | Arrival at the institution itself. |
| Teaching Practice (EN+AR) | `letterpress.jpg` | The craft of preparation — a lesson set before it is taught. |
| FAQ (EN+AR) | `worldmap.jpg` | The questions come from everywhere; admissions are worldwide. |

Arabic editions take the same plate with an Arabic alt text written for
the frame, not translated word-for-word from the English alt.

## Sequencing

Blocked until the confidence sweep lands — the level generators and the
FAQ/teaching pages are being edited by that wave. Implement as its own
commit: plates in the generators and pages, alts in both languages,
CREDITS.md "Where used" updated, `npm run audit` re-run to confirm the
sixteen findings close, render-verified at 1440/900/390.
