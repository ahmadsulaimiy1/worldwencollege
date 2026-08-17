# The Open Level and the Independent Route — design before build

The owner's instruction, in three parts, each verbatim in spirit:

1. **Level I is the open level.** Its textbook, workbook, curriculum,
   syllabus and selected teaching resources download freely. That is
   the College's proof: read a whole level before paying anything.
2. **Levels II–VI are shown, explained and previewed — not
   downloadable.** Access comes with enrolment or authorised purchase.
3. **An independent route exists** for people who do not enrol:
   buy the level's materials (indicative $150), study alone, sit the
   examination (indicative $250), and take the certificate (indicative
   $200) — then progress to the next level exactly as an enrolled
   student would.

## What this changes, and what it deliberately keeps

The Library's proposition — "read the whole of it before you pay for
any of it" — SURVIVES, re-anchored on Level I and on the reference
volumes. What changes is which artefacts constitute "the whole of it":

| Stays freely downloadable | Moves to authorised access |
|---|---|
| Flagship Curriculum (the programme in brief) | Complete Curriculum reference edition (already request-only by size) |
| Programme Architecture | Level II–VI teaching volumes as they are produced |
| Assessment Handbook (criteria a candidate is entitled to read) | Teacher's Companions beyond Level I |
| Pronunciation Handbook | Listening scripts beyond the open samples |
| **All Level I material** — workbook, companion, curriculum, syllabus | |
| The Press volumes about the Press itself | |

Nothing already published is silently withdrawn without the owner's
sign-off in review — the change is presented as the publishing policy
of a maturing press: the open level proves the standard; the higher
levels are participation, not spectacle.

## The pages

- `/study/independent/` (+ Arabic twin): the route stated as a
  four-step passage — Materials → Study → Examination → Award — with
  the indicative fees itemised in the same ledger style as tuition,
  each step's fee stated with what it buys. The credential conferred is
  the same qualification, same moderation disclosure, same registry
  entry — the route differs, the award does not.
- The tuition page gains one leaf: "Two routes to the same award",
  cross-linking enrolment and the independent route, so neither
  cannibalises the other silently.
- Each level page names its route options in the qualification section.
- The Library page's licence leaf gains the access tier statement.

## Honesty constraints (CLAUDE.md §5)

- Fees are stated as adopted figures once the owner confirms them; the
  $150/$250/$200 are the owner's indicative numbers and ship only after
  review — until then the pages describe the route and say fees are
  published on adoption. Nothing invents an operating history for the
  route.
- Examination booking that does not exist yet is not offered as a live
  button; it is offered as a named-request step through admissions.
- data/tuition.json gains a `routes.independent` block so every figure
  remains single-sourced and the ledger guardrails extend to it.

## Mechanics

- Protected volumes: removed from `_redirects` 200 map and from the
  deploy surface (same mechanism as the two oversize volumes today) —
  served instead through the request/authorisation flow. No security
  theatre: the pages say plainly that access is by enrolment or
  purchase, not that the files are "locked".
- `scripts/build-library.mjs` gains an `access` field per volume
  (`open` / `enrolled`) and renders the tier honestly on both editions.
- tests/library.test.mjs extends: an `enrolled` volume must NOT have a
  200 rewrite, must NOT be on the deploy surface, and its card must
  carry the access statement in both languages.

## Sequencing

Blocked until the confidence sweep lands (press + tuition + level pages
are agent-owned in that wave). Implement as its own commit series with
the owner's fee confirmation flagged for review in the report.
