# Photography Brief — Image Slots and Shot List

*Companion to `editorial-bible.md`. Written alongside the homepage
rebuild.*

---

## Why this document exists

The site ships today with **no photography**. Every image region on the
homepage is a real, finished component — correct aspect ratio, gold
hairline frame, drawn corner ornaments, small-caps caption, and a slow
ken-burns drift — currently filled by an engraved SVG plate authored in
`assets/art/`.

That was a deliberate choice, not a placeholder. The plates are the
shipped design and the page is complete without a single photograph.
But the brand directive asks for authentic photography of teaching,
libraries, classrooms, discussion, graduation, faculty and research, and
the slots are built so that supplying it is a **file swap, not a
redesign**.

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

### PLATE 01 — The London Campus
- **Where** · Chapter I, *The Promise*
- **Currently** · `assets/art/portico.svg`
- **File** · `plates/campus.jpg` · **Ratio** 4:3 · min 1600×1200
- **Subject** · The exterior or entrance of a serious London academic
  building. Portland stone, columns or a pedimented frontage, wet
  pavement, late afternoon.
- **Crop** · Look slightly up at the building. Architecture fills the
  frame; sky is a sliver.
- **Avoid** · Tourist landmarks. A recognisable Big Ben or Tower Bridge
  turns an institution into a souvenir.

### PLATE 02 — The written curriculum *(optional, not yet placed)*
- **Where** · Chapter II, *The Programme* — currently a table with no
  plate. Add one only if the table ever moves to a two-column layout.
- **Subject** · A printed syllabus open on a desk, annotated in pencil.
  Shallow depth of field on the annotation.

### PLATE 03 — Sixty modules, written
- **Where** · Chapter III, *The Curriculum*
- **Currently** · `assets/art/library-plate.svg`
- **File** · `plates/library.jpg` · **Ratio** 3:2 · min 1800×1200
- **Subject** · A reading room. Shelved stacks receding, a long table,
  a lamp, one or two people reading at a distance.
- **Crop** · One-point perspective down the room. The current plate is
  drawn to that composition; matching it keeps the chapter's geometry.
- **Avoid** · Empty pristine libraries that look like renders, and
  anyone smiling at the camera.

### PLATE 04 — Precision, in the service of learning
- **Where** · Chapter IV, *The Digital Campus*
- **Currently** · `assets/art/astrolabe.svg`
- **File** · `plates/study.jpg` · **Ratio** 1:1 · min 1400×1400
- **Subject** · A learner at work — headphones, a screen showing written
  work or a waveform, notes beside the keyboard. Hands and materials,
  not a face filling the frame.
- **Note** · This is the one chapter that carries the teal accent. A
  photograph with a cool cast in the shadows will sit with it.
- **Avoid** · Stock "online learning" imagery: a person grinning at a
  laptop in a bright kitchen. It is the single fastest way to undo
  everything else on this page.

### PLATE 05 — Taught worldwide, from London
- **Where** · Chapter V, *Who It Is For*
- **Currently** · `assets/art/globe-meridian.svg`
- **File** · `plates/international.jpg` · **Ratio** 1:1 · min 1400×1400
- **Subject** · International students in discussion — a seminar table,
  two or three people mid-conversation, one speaking.
- **Crop** · Square, tight enough that it is about the exchange rather
  than the room.
- **Avoid** · A deliberately assembled row of one-of-each-ethnicity
  faces. It reads as a diversity statement, not as a seminar.

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
