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
| `study.jpg` | 486211924 | Young Arab man in a collared shirt, headphones, working at a laptop with files beside him. | Home, ch. IV (The Digital Campus); Level II (both editions) | Modest, professional, focused on the work rather than the lens. |
| `seminar.jpg` | 489036417 | Two students in conversation over a laptop in a library, one wearing hijab; a third reads behind them. | Home, ch. V (Who It Is For); Level III (both editions) | Modest throughout, natural light, nobody addressing the camera. |
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

## Openverse-sourced plates (added in the visual expansion)

These were **not** licensed through Adobe Stock. They come from
Openverse — which indexes Wikimedia Commons, the Metropolitan Museum,
the Walters Art Museum and the Creative Commons pool on Flickr — and
every one carries an explicit public licence. Sourced by
`scripts/source-plates.mjs`, which refuses anything **nc** (no
commercial use, unusable for a fee-charging college) or **nd** (no
derivatives, which would forbid the plate crop).

| File | Licence | Creator | Source | Where used | Attribution |
|---|---|---|---|---|---|
| `reading-hall.jpg` | BY 2.0 | robert.claypool | [flickr](https://www.flickr.com/photos/35106989@N08/6780155266) | Academics, leaf I (The IEFC); Level IV (both editions) | **Required** — rendered in the plate caption |
| `charter.jpg` | CC0 1.0 | — | [rawpixel](https://www.rawpixel.com/image/8718128/photo-image-vintage-public-domain) | Governance, leaf I (The Instrument) | Not required |
| `letterpress.jpg` | CC0 1.0 | — | [rawpixel](https://www.rawpixel.com/image/3296480/free-photo-image-printing-press-advertising-block) | Press, leaf XVII (The Shelf); Teaching Practice (both editions) | Not required |
| `worldmap.jpg` | CC0 1.0 | themet | [rawpixel](https://www.rawpixel.com/image/2038222/vintage-world-map) | The College — Equity & Welcome; FAQ (both editions) | Not required |
| `astrolabe.jpg` | BY-SA 3.0 | Ragesoss | [wikimedia](https://commons.wikimedia.org/w/index.php?curid=2717737) | Academics, leaf VI (Teaching Practice) | **Required** — rendered in the plate caption |
| `colonnade.jpg` | BY-SA 2.0 | stevecadman | [flickr](https://www.flickr.com/photos/98115025@N00/496743569) | Admissions, leaf III (The Passage); Level VI (both editions) | **Required** — rendered in the plate caption |
| `stacks.jpg` | CC0 1.0 | Open Grid Scheduler / Grid Engine | [flickr](https://www.flickr.com/photos/29155878@N03/16915765068) | Press, leaf XV (What It Holds); Level V (both editions) | Not required |
| `manuscript.jpg` | CC0 1.0 | Walters Art Museum Illuminated Manuscripts | [flickr](https://www.flickr.com/photos/39699193@N03/3840429977) | Press, leaf I (The Imprint); Level I (both editions) | Not required |

### Rejected before shipping, and why

Recorded because rejecting well is most of this job, and an undocumented
rejection gets re-made by the next person. Thirty candidates were pulled;
eight shipped.

| Candidate | Rejected on | Reason |
|---|---|---|
| Three lecture theatres (blue stacking seats, whiteboards, a primary-colour mural) | **Register** | Municipal and consumer, not prospectus-grade. Also close to the line that matters most: a photographed lecture hall beside College copy reads as a claim to premises the College does not have. |
| A modern municipal library, strip lighting and grey carpet | **Register** | The exact "cheap stock" look the standard forbids. |
| A university war memorial carrying another institution's inscription | **Truthfulness** | It names a specific named university. Publishing it under WEC-LC copy would associate the College with an institution it has no relationship with. |
| A suburban office building | **Register** | Reads as a business park. |
| Three medieval ecclesiastical seals (seated figures under Gothic canopies) | **Cultural compatibility** | Devotional Christian imagery. Not disrespectful, and not rejected as such — rejected because a College with an Islamic identity that serves Muslims and Christians alike should not take one tradition's devotional art as its decorative register. A neutral charter was used instead. |
| Two illuminated calendar leaves with haloed saints | **Cultural compatibility** | Same reasoning. Replaced by an Arabic manuscript leaf from the Walters, which is warmer than neutrality-by-avoidance and belongs on a bilingual College's press page. |
| Astrolabes photographed on a workbench, and three on an electric-cyan museum ground | **Register** | Snapshot lighting in the first case; in the second, a cyan that fights the oxford-and-gold palette on every page it would sit on. |

**A note on ShareAlike.** Three plates are BY or BY-SA. Cropping a
photograph to `--plate-ratio` and applying the plate's tone overlay
creates an **adaptation**, and ShareAlike attaches to the adaptation —
so those three carry a visible credit line in the plate caption rather
than a row in this file alone. Where a public-domain alternative of
equal quality existed, it was taken instead; that is why five of the
eight are CC0.
