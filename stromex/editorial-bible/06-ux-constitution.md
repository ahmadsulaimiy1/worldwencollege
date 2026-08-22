# Volume 6 — The UI/UX Constitution

*The rules of the experience. Volume 7 is what it looks like; this is how
it behaves and who it is for.*

---

## §6.1 The primary device is a phone `[OBSERVED — and hard-won]`

`AMC-EB §48`, the Mobile Covenant, exists because a Founder found that
every page of a shipped site scrolled sideways on a phone while 1,029
automated checks reported success. Its own preamble is the strongest
sentence in the estate's design corpus:

> This article exists because its absence was not an oversight of
> execution but of constitution. This Bible ran to forty-seven articles,
> governed colour to four decimal places of contrast ratio, and
> **contained not one sentence about the screen most of our students will
> ever use.**

**The design target is a three-year-old Android phone, on 3G, on a metered
plan.** That viewport is 360 CSS pixels. **The narrowest supported
viewport is 320px.** Below that, support is not claimed; at or above it,
everything works.

### §6.1.1 The five binding rules

1. **A page never scrolls horizontally.** `document.scrollWidth` never
   exceeds `clientWidth` at any supported width, in either language.
   Absolute. A page that scrolls sideways is broken regardless of how it
   looks.
2. **Nothing is positioned off the inline axis to hide it.** Not skip
   links, not drawers, not off-canvas panels. An element at `-9999px` is
   still laid out, still contributes width, and in RTL still shifts the
   scroll origin so Arabic lines are clipped at their start. Hide by
   `display`, or move it off the *block* axis.
3. **Every interactive target is at least 44×44px** — links, buttons,
   inputs, theme toggle, language switch, footer links, table links.
   Inline links inside running prose are the only exception.
4. **No unbreakable string exceeds its container.** Email addresses,
   certificate numbers and URLs carry `overflow-wrap: anywhere`. A
   28-character token in a table cell is enough to break a page at 320px.
5. **Breakpoints belong to components, not to the site.** A single global
   "mobile" breakpoint means nothing is actually tuned.

### §6.1.2 The gate

Every release runs a **real browser at 320, 360, 375, 390, 414 and 768
px, on every page, in every language**, asserting rules 1–3 and the
navigation drawer's behaviour.

> **A visual claim that is not measured in a renderer is not a claim this
> institution makes.**

It is slower and needs a browser binary. That is the correct price. The
alternative is the one already paid.

## §6.2 Low bandwidth is a first-class constraint `[OBSERVED]`

`AMC-EB §24`. Above the fold must not depend on JavaScript: `AMC` v0.9
records a hero whose headline, lead and both buttons were blank until a
deferred script ran — on exactly the phone the Bible commits to. The
entrance became a CSS animation that plays on paint.

**Binding.** The primary content of any page renders without JavaScript.
Motion above the fold is CSS. Fonts are self-hosted, with no CDN
dependency and a real fallback stack.

## §6.3 Accessibility is the floor, not the ceiling `[OBSERVED]`

**WCAG 2.1 AA is a non-negotiable floor** (`SX-EB Part VI`,
`AMC-EB §25`). Contrast is **computed from the shipped stylesheet on every
build**, not asserted in a document — `AMC` v0.5 records the first run
finding a state colour at 4.47 against a 4.5 requirement, "which no
document review would have caught."

**`prefers-reduced-motion` is total, not partial** (`AMC-EB §22.4`,
`WEC-EB Part III·b`). One source of truth for CSS animation, read by both
the stylesheet and any script. **Every carve-out resolves to the finished
state, never the hidden one** — an entrance animation merely disabled
leaves the element at `opacity: 0`, which for a reader with vestibular
sensitivity is not a calmer page but a blank one.

## §6.4 Restraint in motion `[OBSERVED]`

`AMC-EB §22` defines motion by three purposes — **draw, reveal, respond**
— with an explicit fourth category, *decorate*, **that does not exist**.
`WEC-EB Part III·b` ships exactly eight behaviours and no more, and states
the test: motion shows *structure* — that a chapter has begun, that a
figure is being counted, that the header has detached from the hero —
never that the site can animate.

Two rules protect the user and are unconditional: **nothing moves that the
user did not cause or scroll to**, and everything is removed under
`prefers-reduced-motion`, verified in the build rather than promised.
Counters are permitted **only over real, sourced numbers**.

## §6.5 No dark patterns `[OBSERVED]`

`SX-EB Part VI`: every destructive or hard-to-reverse action is confirmed
and reversible where technically possible; no dark patterns, no
manufactured urgency, no engagement-bait notifications. `AMC-EB §32.3`
adds the commercial form: no countdown timers, no false scarcity, no
"limited places" that are not limited.

## §6.6 Bilingual and RTL is architecture, not localisation `[OBSERVED]`

`SX-EB Part II`: "**Language is architecture, not a UI setting.**"
`AMC-EB §26` sharpens it for an Arabic institution: **Arabic is not a
translation.** `SX-EB Part VI` classes full bidirectional support as an
*accessibility* requirement, not a localisation nicety.

**Binding.**

- One design system, structurally mirrored — never a translation plugin.
- Every path has its counterpart at every level of the tree, not just the
  home page.
- RTL parity is tested at every breakpoint, in a real browser
  (`SEB §6.1.2`), because RTL breaks differently: `AMC` measured 261
  overflowing elements on the Arabic home page against a much smaller
  count in English.
- Arabic type has its own roles, its own faces and its own rules
  (`SEB §7.6`); it is not the Latin scale with a different font.
- Where an institution is English-first by nature, a mirror is correct
  (`WEC`); where it is Arabic by nature, English is the mirror
  (`AMC-EB Preamble`, rejecting WEC's ordering for exactly this reason).

## §6.7 The journeys that must always work `[OBSERVED]`

`AMC-EB §27–§30` names four, and they generalise across the estate. For
each, the constitution requires that the journey is walked end to end on a
360px viewport in both languages before release:

| Journey | The non-negotiable |
|---|---|
| **Student** | Can find what they are enrolled in, what is next, and what they have achieved — without asking a person. |
| **Parent / guardian** | Sees only their own linked children, sees fees and progress honestly, and can always reach a human. |
| **Teacher** | Can record what they observed, in the class they actually teach, without a spreadsheet. |
| **Administrative** | Can find one record, act on it under their real permissions, and leave a trail. |

## §6.8 Error and empty states are designed, not defaulted `[OBSERVED]`

`WEC-EP §2` records the defect that makes this a constitution article: an
admin page mapped **every 403 to "you do not have staff access,"** so a
staff member refused for enrolling *themselves* was told they were not
staff — and would have gone asking for access they already had. Two
different refusals shared one status code, and only the page knew they
meant different things.

**Binding.**

- A refusal message names *which* rule refused, not which status code
  arrived.
- No user-facing surface shows a server's own error vocabulary.
- Every list has a designed empty state that says what would fill it —
  `AMC-DX §16`'s empty faculty register is the model: a real component,
  honestly empty.

## §6.9 The design tests `[OBSERVED]`

Before any screen is accepted (`AMC-EB §13.2`, `AMC-DX §14`):

- **Vocabulary** — is every section built from the component canon? A
  generic card grid fails.
- **Space** — does it clear the spacing minimums and the half-empty rule?
- **Proportion** — does the rendered pixel measurement match the palette's
  stated proportion?
- **Removal** — cover the mark, the seal and the name. Do seven of ten
  readers still identify the institution?
- **Persona** — walk all named readers; record gets / doesn't get /
  verdict.
- **Truth** — every fact real and dated; every limitation published in the
  same register.
