# Photograph credits, licences and compliance

Every photograph on this site is recorded here before it ships. A file
in this directory without a row in this table is a licensing incident,
not an oversight.

All licensed through **Adobe Stock** on the College's Adobe account. The
Adobe Stock Standard Licence permits use on a commercial website without
attribution — this register exists for the College's own records and for
any future audit, not because attribution is required.

The policy every image is checked against is Part 0 of
`docs/photography-brief.md`.

## In use

| File | Stock ID | Subject | Where used | Compliance note |
|---|---|---|---|---|
| `library.jpg` | 592071461 | University reading hall — long tables, green-shaded lamps, shelved stacks. No people. | Home, ch. III (The Curriculum) | No people, so no question arises. |
| `study.jpg` | 486211924 | Young Arab man in a collared shirt, headphones, working at a laptop with files beside him. | Home, ch. IV (The Digital Campus) | Modest, professional, focused on the work rather than the lens. |
| `seminar.jpg` | 489036417 | Two students in conversation over a laptop in a library, one wearing hijab; a third reads behind them. | Home, ch. V (Who It Is For) | Modest throughout, natural light, nobody addressing the camera. |
| `westminster.jpg` | 910478583 | The Palace of Westminster, Big Ben and Westminster Bridge across the Thames. No people. | Home, The Residency | No people, so no compatibility question arises. Chosen because Westminster is a named residency location: it illustrates a place the College actually sends learners, and asserts nothing about premises the College owns. |

## Licensed and withdrawn

Recorded because the licence was spent and the account should reconcile.
Neither file is in the repository.

| Stock ID | Subject | Why withdrawn |
|---|---|---|
| 1219037542 | Man in a short-sleeved t-shirt reading at a home desk with headphones. | Compliant, but casual rather than prospectus-grade once the register was raised. Replaced by 486211924. |
| 561693647 | Four students around a table, overhead. | A **tattooed forearm in the foreground** — ruled out by the cultural-compatibility policy. Replaced by 489036417. |

**Lesson recorded:** both were licensed before the College's Islamic
identity was stated. Check Part 0 of the photography brief *before*
licensing, not after — that is what the two rows above cost.

## Two directions rejected before licensing

Recorded because rejecting well is most of this job, and an undocumented
rejection gets re-proposed six months later.

**Consumer-lifestyle library shots.** A candidate passed cultural
compatibility completely — hijab worn unremarkably, modest dress, nobody
addressing the lens — and failed the *register* clause: plaid shirt,
hoodie, iced coffee with a striped straw. Compatible is the floor, not
the bar. The brief asks for images that would plausibly sit in the
prospectus of a leading international university.

**Oxford and Cambridge architecture.** The strongest-looking results for
"British university" are the Radcliffe Camera, Christ Church and King's
Parade. Every one is unusable here, and not marginally: a recognisable
Oxbridge building on another institution's homepage reads as borrowed
affiliation, which is exactly the line in Part 0 about no image
asserting something untrue about the College. It is also the kind of
claim a sceptical reader disproves instantly and never forgives.

Where a British setting is wanted, the College shows the cities it
actually uses — London, Westminster, Manchester — because those are
true.

## Processing

Originals are downloaded at full resolution, centre-cropped to the ratio
of the plate they occupy, and re-encoded at quality 0.82 — 1600px wide
for the 3:2 plate, 1200px for the 1:1 plates.

The duotone is applied in CSS at render time (`.plate--photo` in
`css/atelier.css`), never baked into the files. That keeps the originals
untouched, makes the treatment one line to retune, and lets the same
photograph be re-used elsewhere under a different ramp.
