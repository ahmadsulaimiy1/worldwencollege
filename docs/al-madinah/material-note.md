# The material of a card — design note

**The complaint, restated precisely.** Every card surface on this site is a one-pixel stone
rectangle with square corners on a flat fill. It is not that they are ugly; it is that they
are *inert*. They do not catch light, they do not have an edge, and the statistics on them sit
there as dead type. The College reads as though it were printed rather than made.

**The diagnosis.** The design system already owns a material vocabulary — `.crystal`,
`.edge-lit`, `.aurum`, `.lumen`, `.glint`, `.gold-live`, `.assemble` — built for WEC-LC and
inherited here. Almost none of it was applied to Dār al-Rusūkh's own components. The radius
scale (`--r-xs … --r-xl`) exists in `brand.css` and the cards ignored it: `pages.css` hard-codes
`border-radius: 6px` over the top of `--r-md`. So the answer is not to invent effects. It is to
give this College's surfaces the material the house already knows how to make, and to add the
two things the vocabulary genuinely lacks: a damped gold halo, and figures that count.

---

## 1. Radius is form, not ornament

A scale, not one number, and it survives every ornament setting including *none* — because a
rounded corner is the shape of the object, whereas a glow is a decoration of it.

| Surface | Radius |
|---|---|
| Small tiles — footer register, quicknav, return cards, pills | `--r-sm` 10px |
| Cards — `.card`, `.r-fac-card`, `.r-tier-card`, `.stat-tile` | `--r-md` 16px |
| Plates and panels — `.r-plate`, `.mega__feature`, `.footerlinks__card`, `.panel` | `--r-lg` 24px |
| Tables, rules, keylines | **square** — a table is a ruled page, not an object |

## 2. Two materials, because there are two grounds

A card on navy and a card on paper are not the same card recoloured. They are different
materials in the same room, lit from the same place — upper left, at 148°, which is the angle
the whole design system already lights from.

**Sapphire glass** (on `.section--dark`). Translucent, `backdrop-filter: blur(14px)
saturate(150%)`, so the lattice behind it shows through and moves. A champagne bevel along the
top edge. A gold hairline rim. A deep drop shadow.

**Polished cream** (on `.section--light`). Not a flat fill: a warm gradient running
`#FFFDF8 → warm-white → cream` at 158°, so the surface has a direction of light. A white bevel
along the top. A gold rim that warms toward the top-left and turns to warm grey at the bottom,
because a cream surface in a warm room does not have navy shadows.

## 3. The rim, the bevel and the halo are one box-shadow stack

Not pseudo-elements. An inset ring follows `border-radius` for free, animates cheaply, and
leaves both pseudo-elements available for the gold rule and the sheen.

```
rest   inset bevel · inset gold ring at ~.14 · soft drop shadow
hover  inset bevel · inset gold ring at ~.32 · deeper drop · OUTER GOLD BLOOM
```

**The damping is the point.** The bloom arrives in `.34s` and leaves in `.9s` — the transition
duration differs between the hover state and the resting state, so the gold *decays* off the
edge rather than snapping off it. That is what metal does, and it is the difference between a
hover effect and a lit object.

## 4. Gloss is a reflection, not a shimmer

A specular band sits still on the top-left of every card as part of its surface gradient. It
*travels* only on hover — one crossing, 1.05s, then gone. Forty cards each shimmering forever is
a screensaver; forty cards that hold a highlight and release it when touched is a polished
room. This follows `.lumen`'s own reasoning, which the atelier layer states outright: a
highlight that travels continuously is a shimmer, one that crosses and waits is a reflection.

## 5. The figures come alive

Three mechanisms, each doing a different job:

- **Assembling digits** (`data-assemble`, already in `atelier.js`): the standing strip's figures
  form rather than appear, one digit at a time.
- **Counting** (`data-count`, new, in `rusukh-atelier.js`): a figure rises from zero on an
  ease-out and settles. Used where the number is a *measurement* — the portal's tiles, the
  Riwāq's ledger — because a measurement that counts up reads as having been taken.
- **Rules that draw**: the hairline beneath a figure scales from zero, staggered along the row,
  so the strip assembles left to right rather than switching on.

All three resolve instantly under `prefers-reduced-motion`, and the digits resolve instantly
where `IntersectionObserver` is absent — a headline statistic must never be capable of rendering
as an empty gap.

## 6. Restraint is a setting, not an opinion

The personalisation centre already offers three ornament levels, and this material answers to
them:

| Level | What changes |
|---|---|
| **Full** | Glass, rim, halo, sheen, assembling figures |
| **Restrained** | Glass and rim stay; the halo halves; the sheen does not travel |
| **None** | Flat surfaces, hairline borders — **and the radii remain**, because they are the shape of the thing |

## 7. Scope

Every rule lives in `css/rusukh.css` and `css/riwaq.css`, which only the Dār al-Rusūkh build
loads. WorldWide English College shares `brand.css`, `pages.css` and `atelier.css` with this
site and must not inherit a single one of these overrides.
