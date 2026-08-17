# Sultan Hanafi Royal Schools — platform

Phase 3 of the architecture directive. The blueprint that governs everything here is
`../docs/shrs/royal-standard-blueprint.html` — read it first; it explains *why* the
model looks like this, and it is the thing to argue with.

**This directory is deliberately self-contained.** The blueprint's standing
recommendation is that SHRS gets its own repository rather than growing inside a
codebase that carries another institution's identity throughout. Nothing in here
imports from the parent project, so that move is `git mv shrs/* .` in a new repo,
not an untangling.

## What is here

| Path | What it is |
|---|---|
| `assets/crest.svg` | The full armorial. Quartering, mantling, and the style of the school. Legible above ~120px. |
| `assets/crest-mark.svg` | Compact mark — khātim and shield only — for small sizes. Canonical source; the pages inline a copy so it inherits the theme colour. |
| `css/royal.css` | The design system. Tokens, type, khātim geometry, components. |
| `portal/index.html` | Student — Today. |
| `portal/hifdh.html` | Student — the Hifdh Engine. |

The two pages are static and open directly in a browser; there is no build step yet.

## The design language

Taken from the crest rather than invented alongside it: a gold armorial shield on an
obsidian field, bordered bright gold, within a pearl eight-point *khātim* star. Dark
is the intended look, so bare `:root` carries the dark palette and light is the
override — all three viewer states are handled (explicit dark, explicit light, and
the unstamped default where only the OS preference separates them).

Semantic colour is deliberately **not** the gold accent. It is drawn from the palette
of Islamic manuscript illumination — verdigris, lapis, ochre, madder — so that "this
needs attention" can never read as "this is decorative". State is always carried by
more than colour: a chip, a border weight, or a number alongside the fill.

The eight-point star is two squares, one rotated 45°, which is how it is constructed
on the crest. It is used as geometry — section markers, the grid, the mark — never
pasted on as ornament.

Type is all-serif, because a school of classical scholarship should read like a
charter and not a dashboard. Font stacks only: no CDN, so there is no silent
fallback on a bad connection. **Amiri is not bundled yet** — Arabic currently falls
back to whatever the device has. Self-hosting Amiri is a Phase-I task.

## Notes for whoever builds on this

- Anything the machine drafted is marked `.sh-assisted`, every time, without exception.
  That is a governance rule from the blueprint (§07), not a styling choice.
- Nothing here is wired to data. The figures, the student and the marking are
  illustrative and do not describe a real person.
- Qur'ānic text is Riwāyah Ḥafṣ ʿan ʿĀṣim.
- The hifdh error taxonomy (`.sh-jali`, `.sh-khafi`) marks errors with a rule beneath
  the word as well as a colour, so the distinction survives colour blindness and
  greyscale printing.
