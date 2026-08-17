# Photography Brief — Visual Asset Policy and Shot List

*Companion to `editorial-bible.md`. Written alongside the homepage
rebuild; the policy section added when the College's Islamic identity
was confirmed.*

---

## Part 0 — The policy every image must pass

**This section governs. An image that fails it does not ship, however
good it looks.** Check it before licensing, not after — a licence spent
on an unusable photograph is money gone.

### Cultural compatibility

The College has an **Islamic identity** and serves a broad international
community, with particular weight in the GCC. Every visual asset must be
compatible with that identity. This is not a restriction bolted onto the
design; it is part of what the College is, and the imagery should feel
welcoming and dignified because of it, not in spite of it.

People from all backgrounds, cultures and ethnicities are welcome in the
imagery, provided the depiction is respectful. **Do not use** any image
containing:

immodest clothing · sexually suggestive posing · alcohol · gambling ·
nightlife · inappropriate physical intimacy · offensive gestures ·
religious disrespect · political campaigning · violence · smoking or
vaping · tattoos as a focal point · luxury for its own sake · anything
else in conflict with the College's values.

### Representation

Show learners and educators from many regions — the Gulf, Europe,
Africa, Asia. Vary ethnicity, culture and age where appropriate. A woman
in hijab studying is not a diversity gesture here; it is an accurate
picture of who this College teaches, and it should appear as
unremarkably as anyone else.

### Register

Every image should be **premium, editorial, cinematic, elegant,
timeless, authentic, international and academically credible** — it
should plausibly belong in the prospectus of a leading international
university.

Reject generic corporate stock, exaggerated smiles, staged handshakes,
thumbs-up, and anyone grinning at the lens. People should be working,
reading, listening or in conversation.

### The line that matters most

**No image may be captioned so that it asserts something untrue about
the College.** No photograph may be presented as AIPC's campus, its
faculty, its students, its classrooms or its graduates. The College has
an administrative address in London, not a teaching campus, and has not
yet taught a cohort. A stock photograph captioned "our students" would
be the most damaging sentence on the site.

Photographs illustrate an *activity* — reading, studying, discussion.
Anything that would read as a claim about the institution stays an
engraving, because a drawing is plainly a drawing.

### What the free tier can and cannot supply

Recorded after searching Adobe Stock's free tier against this policy, so
the next person does not spend an afternoon rediscovering it.

**People-free subjects pass easily.** Architecture, interiors, cities,
still life. No compatibility question can arise, and the strongest
results by far are here — the reading hall and the Westminster plate
both came from this category. When a slot can be filled without a
person in frame, fill it that way first.

**People in professional settings mostly fail on REGISTER, not on
compatibility.** The free tier's supply of workplace and study imagery
is overwhelmingly consumer-lifestyle: "smiling businesspeople", "creative
coworking", "friendly discussion", plaid shirts, iced coffee, people
grinning at the lens. Several candidates were fully compliant with the
cultural policy above and still unusable, because compatible is the
floor and prospectus-grade is the bar.

**The implication.** For the remaining people-carrying plates, expect to
spend either credits on the paid tier — where the editorial and
documentary collections live — or a commission. A commissioned shoot is
worth costing: it is the only route to images that are unambiguously the
College's own, and it removes the risk that a competitor licenses the
same face.

**Never solve this by lowering the bar.** A mediocre photograph on the
homepage subtracts more than an empty slot does, because the empty slot
is invisible and the mediocre photograph is a statement about the
institution's judgement.

### Licensing

Only assets that can be legally used. Every file recorded in
`assets/images/plates/CREDITS.md` before it ships — source, ID, licence,
and where it is used. A file in that directory without a row in that
table is a licensing incident, not an oversight.

### Treatment

Every photograph is gradient-mapped into the palette by
`.plate--photo` (`css/atelier.css`) — luminance kept, hue and saturation
replaced with an oxford-blue-to-antique-gold ramp. This is what makes
four photographs from four photographers read as one commission. It is
applied in CSS, never baked into the file.

---

## Why this document exists

The homepage now carries **three licensed photographs and one
engraving**, and that mix is deliberate rather than a stage on the way
to replacing everything with photography.

Photographs carry the things a photograph can honestly carry: reading,
studying, discussion. Engravings carry the things a photograph would
overclaim — the College's own frontage, its instruments, its reach.
Every image region is the same component (fixed ratio, gold hairline
frame, drawn corners, small-caps caption, slow drift), so which medium
sits in a given slot is an editorial decision, changeable in one line,
not an architectural one.

## How to install a photograph

Each slot below names the plate it currently holds. To replace one:

1. Save the photograph to `assets/images/plates/<slot-filename>`.
2. In `pages/home.html` (and `pages/home.ar.html`), change the `src` of
   that `<figure class="plate">`'s `<img>` and rewrite its `alt` to
   describe the photograph.
3. Run `node scripts/build.js`.

Nothing else changes. The frame, ratio, caption and motion are CSS.

**Do not** remove `--plate-ratio` from the figure — the frame crops to
it with `object-fit: cover`, which is what guarantees the page's
composition survives a photograph of any dimensions.

**Do** keep the images dark or mid-toned. The frames sit on a deep navy
ground on every chapter, including the cream ones (see the note on
`.plate__frame` in `css/brand.css`). A bright, high-key photograph will
fight that frame; a photograph exposed for shadow will sit in it the way
a tipped-in plate sits in a printed book.

---

## The slots

### PLATE 01 — The College frontispiece  ·  **STAYS AN ENGRAVING**
- **Where** · Chapter I, *The Promise*
- **File** · `assets/art/portico.svg`
- **This slot is deliberately not a photograph.** A photograph of a
  stone quad on this page would be read as the College's campus, and
  the College does not have one — it has an administrative address.
  Even captioned carefully, the image would do the asserting.
  An engraving cannot be mistaken for a building the College occupies,
  which is exactly why it is the honest choice here.
- Do not "upgrade" this to a photograph later without resolving that
  problem first.

### PLATE 02 — The written curriculum *(optional, not yet placed)*
- **Where** · Chapter II, *The Programme* — currently a table with no
  plate. Add one only if the table ever moves to a two-column layout.
- **Subject** · A printed syllabus open on a desk, annotated in pencil.
  Shallow depth of field on the annotation.

### PLATE 03 — Sixty modules, written  ·  **INSTALLED**

- **Where** · Chapter III, *The Curriculum*
- **File** · `plates/library.jpg` (Adobe Stock 592071461) · 1600×1067, 3:2
- **Why it passes** · No people, so no compatibility question at all.
  A real reading hall with green-shaded lamps and warm wood — the
  register the whole brief is aiming at.

### PLATE 04 — Built for one programme  ·  **INSTALLED**
- **Where** · Chapter IV, *The Digital Campus*
- **File** · `plates/study.jpg` (Adobe Stock 486211924) · 1200×1200, 1:1
- **Why it passes** · A young Arab man in a collared shirt, headphones
  on, working at a laptop with files beside him. Modest, professional,
  entirely focused on the work, not on the camera. Right for the
  Listening Lab and right for the audience.
- **What it replaced, and why** · The first choice (1219037542) was a
  man in a short-sleeved t-shirt at a home desk. Compliant, but casual
  rather than prospectus-grade. Replaced when the register was raised.
- **Retired art** · `assets/art/astrolabe.svg` is retained and moves to
  `/learning/platform/` in a later phase. It is too good to delete and
  wrong for a chapter that should show a person.

### PLATE 05 — Taught worldwide, from London  ·  **INSTALLED**
- **Where** · Chapter V, *Who It Is For*
- **File** · `plates/seminar.jpg` (Adobe Stock 489036417) · 1200×1200, 1:1
- **Why it passes** · Two students in conversation over a laptop in a
  library, one in hijab, a third reading behind them. Modest throughout,
  natural light, nobody addressing the lens. Diverse without being
  arranged.
- **What it replaced, and why** · The first choice (561693647) was an
  overhead seminar table — a good photograph, but with a **tattooed
  forearm in the foreground**, which the policy above rules out.
  Licensed and discarded; the licence is recorded anyway.
- **Retired art** · `assets/art/globe-meridian.svg` is retained for a
  future international/partnerships page.
### Graduation *(no slot yet)*
The directive asks for graduation imagery and there is deliberately no
slot for it on the homepage: no cohort has been taught and no award has
been conferred, so a graduation photograph here would illustrate
something that has not happened. The right home for it is
`/students/awards/`, once there is a cohort to photograph.

---

## Direction that applies to every shot

- **Available light.** No flash, no HDR, no lifted blacks.
- **Muted.** The palette is navy, gold and warm neutrals. Saturated
  colour anywhere in frame will pull the eye off the type.
- **People are working, not posing.** No eye contact with the lens, no
  arms folded, no thumbs up, no laughing at a laptop.
- **Real materials.** Paper, cloth, wood, stone, glass. Whatever is in
  frame should look like it has been used.
- **Licensing.** Record the source and licence for every file in
  `assets/images/plates/CREDITS.md` before it is committed.
