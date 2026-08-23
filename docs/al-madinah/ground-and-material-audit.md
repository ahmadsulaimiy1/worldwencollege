# The Grounds: what arablagos.com does, and what we were doing

*A study of background treatment, commissioned by the Founder —
"study the background elegance of arablagos.com. polished and neat and elegant."*

Status: **study complete, first remediation applied.**
This is a materials audit, not feature development. The stop order of the
Founder's ruling on the memorisation schedules is not touched by it.

---

## 1. What was actually measured

Their page was read as source, not as an impression: 71,756 bytes, one
`<style>` block of 5,567 characters, plus Tailwind loaded from a CDN with a
short `tailwind.config` extending a five-colour brand palette.

The first pass over their file counted ten background declarations and
concluded they were extraordinarily restrained. That count was wrong, and
worth correcting before anything is built on it: their backgrounds are
overwhelmingly Tailwind utility classes in the markup, not CSS declarations
in the style block. Counting the markup as well:

| | Arab Community of Lagos | Al-Madinah, before this pass |
|---|---|---|
| background declarations / uses | 73 | 307 |
| **distinct background values** | **21** | **189** |
| distinct translucent grounds | ~12 | **164** |
| distinct colour families in grounds | 6 | **34** |
| box-shadow uses | 48 | 97 |
| **distinct box-shadow values** | **11** (8 are Tailwind's own steps) | **60** |
| **distinct border-radius values** | **5** | **28** |
| gradient recipes | 4 | **86** |

The conclusion survives the correction, but it is a different conclusion. It
is not that they use few backgrounds. It is that they use **few kinds** of
background, many times over.

## 2. Their whole material list

This is the entirety of it:

- one page ground, `#F8FAFC`
- one photograph, in the hero, with a 30-second Ken Burns drift above 1024px
- white at four opacities — `.85` and `.98` for the navigation, `/90` and
  `/10` in the markup — always with `backdrop-blur`
- emerald `#046A38` and gold `#D4AF37`, flat, and at `/10` and `/40`
- one two-colour rule: `linear-gradient(90deg, emerald, gold)`, 60px × 4px,
  used as the section divider on every section
- one card glow: `linear-gradient(135deg, emerald .15, gold .15)`, blurred
  8px, inset −2px, behind the card
- one shine sweep across buttons
- shadows: Tailwind's own `sm`/`md`/`lg`/`xl`/`2xl`/`inner`, plus three named
  in the config — `glass`, `glow-gold`, `glow-emerald` — and exactly two
  hand-written arbitrary values in the whole page
- radii: `xl`, `2xl`, `full`, and almost nothing else — 75 of their 79 radius
  uses are one of those three

Eight colours in the config. Eleven shadows, nine of which they did not
write. Three radii. Every card on the page is made of the same material as
every other card, and that — not the colours — is what reads as polished.

It is worth saying plainly where that discipline comes from: **most of it is
Tailwind's, not theirs.** A utility framework hands you a closed scale and
makes inventing a new value more effort than reusing an old one. We chose to
write our own CSS, which is the right choice for a house with real
typography and five composed grounds — but it means the discipline that
comes free with Tailwind has to be imposed by hand. That is the entire
finding of this audit.

## 3. What we were doing instead

The palette in `css/brand.css` is good and it is documented. The failure was
never the palette; it was that **the translucent grounds were never part of
it.** Opaque colours had names. Washes did not. So every component invented
its own, and 164 of them accumulated.

The evidence, unedited:

**The same gold wash, typed twenty-two ways.** `rgba(199,162,74,…)` appeared at
alpha `.05`, `.055`, `.06`, `.07`, `.08`, `.09`, `.10`, `.12`, `.14`, `.16`,
`.18`, `.20`, `.22`, `.24`, `.25`, `.26`, `.30`, `.34`, `.35`, `.40`, `.45`,
`.50` — and separately as `rgba(199, 162, 74, .06)` **and**
`rgba(199,162,74,.06)`, which are the same colour and, to the stylesheet, two
different materials. Nobody can see `.05` apart from `.055`. The page is not
subtler for containing both; it is only less decided.

**Nine near-blacks where the palette names three.** The house has `--oxford`,
`--midnight` and `--navy`. The grounds also contained `rgb(6,12,24)`,
`rgb(6,13,28)`, `rgb(6,14,30)`, `rgb(4,10,24)`, `rgb(3,8,20)` and plain
black — six inks nobody chose, each within a hair of one that was chosen.

**A 0.01 difference across two files.** `.r-fac-card` on a dark section sat
on `rgba(10,20,40,.34)`; `.riwaq-field input` sat on `rgba(10,20,40,.35)`.
Two files, two materials, one appearance.

**Four ways to raise a surface off a dark ground.** White at `.03` for a quiz
option, `.04` for a dark card, `.05` for a sidebar hover, `.06` for a field
and a nav hover. One intent, four values.

**The same signal at three strengths.** The "open / later" chips ran emerald
at `.13`, `.24` and `.26` and amber at `.10`, `.13` and `.20`.

This is the mechanism behind the Founder's own earlier note that the cards
"feel AI-generated." A page reads as machine-made not because any one card is
wrong but because **no two cards are made of the same stuff.** Each was
plausible on its own and none was decided with reference to the others. That
is precisely what generation without a material system produces.

## 4. What was changed

`css/brand.css` gained a documented section, **The grounds that are not
opaque**, in the same house style as the palette above it, and every stray
was routed into it:

```
WASH   a house colour laid thinly, to tint a ground without changing it
VEIL   white or champagne laid over a DARK ground, to raise a surface
PLATE  sapphire laid over a dark ground, for a panel that is its own
SCRIM  oxford ink laid over a photograph, or over a lit ground
```

Sixteen tokens. `--wash-gold` through `--wash-gold-4` — the default tint,
hover, pressed, and the loudest wash there is. `--wash-emerald` and
`--wash-amber`, each with a second rung for when the same signal has to be
read on a dark ground, and `--wash-oxblood`, which has only one because
"closed" is never a hover state. `--veil` and `--veil-warm`. `--plate` and
`--plate-lit`. `--scrim`, `--scrim-deep` and `--scrim-solid`.

Then 153 declarations were rewritten by `.tools/grounds.py`, which reads
nothing but background declarations: strays re-homed onto the named inks,
alphas snapped to the ladder. 86 of the resulting literals were replaced by
the tokens.

| | before | after |
|---|---|---|
| distinct translucent grounds | 164 | **76** |
| distinct colour families | 34 | **26** |
| grounds using a named token | 0 | **86 uses** |

Of the 145 raw values that remain, **124 are gradient stops** — fades to
zero, the gilt sweep, photo captions, the skeleton shimmer. Those are
compositional rather than material: a gradient's endpoints belong to one
gesture and are not a surface anyone else should reuse. They are left alone
deliberately, and the count should not be driven to zero for its own sake.

The other **21 are genuine solid grounds that stayed literal**, and they are
listed here so the next person does not have to find them: the condensed
header's two rungs (`brand.css` 872, 878); five one-off signal tints in the
level quiz; the riwaq correction kinds, which are teal, purple, royal and
burgundy all at exactly `.1` — already a closed set of their own; and three
recessed navy wells in the dashboard. None is duplicated more than twice.
That is a healthy tail, not a backlog.

Nothing moved, nothing resized, no colour changed by an amount a reader can
see. Verified across all 36 routes at 390 and 1280.

## 5. What I recommend we do *not* take

Their page is polished. Most of what makes it so is not available to us, and
some of it we should decline:

- **`#F8FAFC` as the page ground.** It is a near-white cool grey — a very
  good default for a modern product site. It is the wrong ground for this
  college. We already run five composed grounds (cream, ivory, paper, royal,
  gilt) with warmth in them, chosen against paper rather than against screens.
  Adopting a cool near-white would flatten the one thing our page has that
  theirs does not.
- **The card glow.** A blurred emerald-to-gold halo behind every course card
  is a 2023 product-marketing gesture. On a page that also carries an isnād
  register it would read as costume.
- **Atropos 3D tilt, confetti, the blink cursor, the shine sweep, `chart.xkcd`.**
  Their page pulls in twelve third-party libraries (Tailwind, Atropos, Baffle,
  canvas-confetti, chart.xkcd, Rive, Spline, Lenis, Comlink, Lucide,
  rough-notation, Datastar), three external stylesheets and two trackers.
  Almost every one of them is motion applied to a surface rather than meaning
  given to it. We retired the pointer aura for exactly this reason and should
  not reintroduce it under a new name.
- **Reveal-on-scroll on every block** — 600ms plus staggered delays to 400ms.
  It makes a page feel authored on the first visit and slow on every visit
  after it.

## 6. What is genuinely worth taking

1. **A closed vocabulary, applied without exception.** Done, for grounds.
2. **One divider, everywhere.** Their 60 × 4px emerald-to-gold rule appears at
   the head of every section and does more for coherence than any animation on
   the page. Ours has several ornaments doing this job differently.
3. **Three radii, not twenty-eight.** We have `--r-xs` through `--r-2xl`
   defined and documented, and then 98 of 128 radius declarations use a raw
   pixel value anyway. The scale exists; it is simply not used.
4. **Three shadows, not sixty.** Same fault, same fix, larger job: 50 of our
   60 distinct shadows are used exactly once.

Items 3 and 4 are the obvious next pass and are the same kind of work as this
one — mechanical, verifiable, invisible when it lands and unmistakable in
aggregate. I have not begun them, because they touch geometry rather than
colour and I would rather land them one at a time against the harness.

## 7. The standing question

*If a professor, an accreditation reviewer, or a respected Islamic scholar
visited this page today, what would they question first?*

Not the backgrounds — they would never notice them, which was always the
point. They would still ask who sits on the Academic Council, and how long
the memorisation pathway takes. Those remain the blockers. This pass changes
nothing about them.
