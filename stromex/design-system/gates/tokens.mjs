#!/usr/bin/env node
/**
 * GATE · TOKENS
 *
 * SEB §30.17 and §34.1: nothing in a StromeX product may use an ad-hoc
 * colour, radius, or z-index. Every value is a decision with a reason,
 * the reason is in the Bible, and the token carries it.
 *
 * The gate exists because "use the tokens" is unenforceable advice. One
 * `#3a3a3a` merged on a Friday is how a design system becomes a
 * suggestion — nobody notices, the next one has precedent, and within a
 * year the palette is forty greys nobody can name.
 *
 * What is permitted outside tokens.css:
 *   · var(--sx-…)
 *   · rgb(255 255 255 / a) and rgb(0 0 0 / a) — pure light and pure
 *     shadow, which is what a rim and a contact shadow ARE. Giving them
 *     tokens would imply they are palette colours that could be changed,
 *     and they cannot: they are the physics of the light model.
 *   · color-mix(), currentColor, transparent, inherit, none
 *   · print.css may set the raw print palette, but ONLY inside --sx-*
 *     declarations. Paper is a different device with a different gamut,
 *     and its palette cannot be expressed as the screen tokens it
 *     replaces.
 */

import { Gate, declarations, stylesheets } from './lib.mjs';

const gate = new Gate('tokens', 'SEB §30.17');

const NAMED = /\b(aqua|beige|black|blue|brown|coral|crimson|cyan|fuchsia|gold|gray|grey|green|indigo|ivory|khaki|lime|magenta|maroon|navy|olive|orange|orchid|pink|plum|purple|red|salmon|silver|tan|teal|tomato|violet|wheat|white|yellow)\b/i;
const HEX = /#[0-9A-Fa-f]{3,8}\b/;
/** rgb()/hsl() with anything other than pure white or pure black. */
const RAW_RGB = /\b(rgba?|hsla?)\(\s*(?!(?:0\s+0\s+0|255\s+255\s+255)\s*[/)])/;

const COLOUR_PROPS = /^(color|background|background-color|border(-\w+)?-color|border|outline|outline-color|fill|stroke|box-shadow|text-decoration-color|caret-color|accent-color|text-shadow)$/;

const files = await stylesheets();

for (const file of files) {
  const definesTokens = file.name === 'tokens.css' || file.name === 'print.css';

  for (const { line, prop, value } of declarations(file.text)) {
    const where = `${file.path}:${line}`;

    // A --sx-* declaration in a file that is allowed to define the
    // palette is the palette. Everywhere else, even a custom property
    // must be built from tokens.
    if (prop.startsWith('--sx-') && definesTokens) continue;

    const suspect = HEX.test(value) || RAW_RGB.test(value)
      || (COLOUR_PROPS.test(prop) && NAMED.test(value));

    if (suspect) {
      gate.fail(where, `ad-hoc colour in \`${prop}: ${value}\` — use a --sx-* token (SEB §30.7)`);
    } else {
      gate.check(true, where, '');
    }
  }
}

/* Radius. A radius is a function of size in this system (≈6–10% of the
   shortest edge), so the scale is closed. `inherit` is permitted and in
   fact required on a concentric bevel. */
const RADIUS_OK = /^(0|inherit|initial|unset|revert|none)$|var\(--sx-r-|calc\(/;
for (const file of files) {
  if (file.name === 'tokens.css') continue;
  for (const { line, prop, value } of declarations(file.text)) {
    if (!/^border(-\w+)?-radius$/.test(prop)) continue;
    gate.check(
      RADIUS_OK.test(value),
      `${file.path}:${line}`,
      `ad-hoc radius \`${value}\` — use --sx-r-* (SEB §30.8)`,
    );
  }
}

/* The signal ROLES, not the pigments.
   tokens.css promises that everything outside it uses the role, because
   the role resolves per register and the pigment does not. A promise in
   a comment is a preference; this is the same promise, checked. */
const PIGMENTS = ['--sx-verdigris', '--sx-carnelian', '--sx-lapis', '--sx-aurum', '--sx-aurum-lit', '--sx-brass', '--sx-brass-deep'];
const PIGMENT_OK = new Set([
  // The metal is exempt where it is LIGHT rather than type: a meniscus, a
  // rim, a seal's ring and the ornament are physical highlights on a
  // surface, and they are checked by the eye against the surface they sit
  // on rather than by a text-contrast threshold.
  '--sx-aurum', '--sx-aurum-lit',
]);
for (const file of files) {
  if (file.name === 'tokens.css') continue;
  for (const { line, prop, value } of declarations(file.text)) {
    for (const [, name] of value.matchAll(/var\((--sx-[\w-]+)/g)) {
      if (!PIGMENTS.includes(name) || PIGMENT_OK.has(name)) continue;
      gate.fail(
        `${file.path}:${line}`,
        `\`${name}\` is a pigment, not a role — use --sx-signal-verified / --sx-signal-attention / --sx-signal-interactive / --sx-metal-text, which resolve per register (SEB §30.7)`,
      );
    }
  }
}

/* Grid tracks that cannot overflow their container.
   A bare `minmax(18em, 1fr)` in an auto-fit repeat is wider than a
   320px phone column and scrolls the page sideways — which SEB §30.15
   holds as absolute. The `min(…, 100%)` form collapses instead. */
for (const file of files) {
  for (const { line, prop, value } of declarations(file.text)) {
    if (!/^grid-template-columns|^grid-template|^grid$/.test(prop)) continue;
    // `minmax(0, 1fr)` is the OPPOSITE idiom and is correct: it removes
    // the automatic min-content floor that makes grid children refuse to
    // shrink. Only a non-zero floor can overflow.
    for (const [, floor] of value.matchAll(/minmax\(\s*((?!0[\s,])\d[\w.]*)\s*,\s*1fr\s*\)/g)) {
      gate.fail(
        `${file.path}:${line}`,
        `\`minmax(${floor}, 1fr)\` overflows any container narrower than ${floor} — write \`minmax(min(${floor}, 100%), 1fr)\` (SEB §30.15)`,
      );
    }
  }
}

/* Z-index. Three layers, named. A z-index of 9999 is somebody losing an
   argument with a stacking context rather than deciding a depth. */
for (const file of files) {
  if (file.name === 'tokens.css') continue;
  for (const { line, prop, value } of declarations(file.text)) {
    if (prop !== 'z-index') continue;
    gate.check(
      /var\(--sx-z-|^(auto|0|1)$/.test(value),
      `${file.path}:${line}`,
      `ad-hoc z-index \`${value}\` — use --sx-z-substrate / --sx-z-ground / --sx-z-rail / --sx-z-lintel / --sx-z-crown (SEB §30.4)`,
    );
  }
}

/* No dangling token references.
   `var(--sx-beat-x3)` does not exist, falls back to nothing, and the
   property silently becomes invalid — the element simply does not
   animate, and there is no error anywhere to find. A typo in a custom
   property is the quietest bug CSS can produce. */
{
  const tokensFile = files.find((f) => f.name === 'tokens.css');
  const defined = new Set([...tokensFile.text.matchAll(/(--sx-[\w-]+)\s*:/g)].map((m) => m[1]));
  // Runtime inputs are declared in tokens.css as `@runtime --sx-name …`.
  const runtime = new Set([...tokensFile.text.matchAll(/@runtime\s+(--sx-[\w-]+)/g)].map((m) => m[1]));

  // Collected across ALL files first: a component-local property may be
  // used in a file that sorts before the one declaring it, and a gate
  // that depends on file order is a gate that fails on a rename.
  for (const file of files) {
    for (const { prop } of declarations(file.text)) {
      if (prop.startsWith('--sx-')) defined.add(prop);
    }
  }

  for (const file of files) {
    for (const { line, value } of declarations(file.text)) {
      for (const m of value.matchAll(/var\(\s*(--sx-[\w-]+)\s*(,)?/g)) {
        const [, name, hasFallback] = m;
        const where = `${file.path}:${line}`;

        if (runtime.has(name)) {
          // A runtime input MUST carry a fallback: the component has to
          // render before any script has run, and on any page where the
          // script never runs at all.
          gate.check(
            Boolean(hasFallback),
            where,
            `\`var(${name})\` is a runtime input used without a fallback — the component would render wrong until a script sets it (SEB §30.9)`,
          );
          continue;
        }

        gate.check(
          defined.has(name),
          where,
          `\`var(${name})\` is neither a token nor a declared @runtime input — a dangling custom property resolves to nothing and the declaration is silently dropped`,
        );
      }
    }
  }

  // And nothing may be declared @runtime and then never used: a stale
  // entry in that list is a promise about a script that no longer exists.
  const usedAnywhere = files.map((f) => f.text).join('\n');
  for (const name of runtime) {
    gate.check(
      usedAnywhere.includes(`var(${name}`),
      'src/tokens.css @runtime',
      `\`${name}\` is declared as a runtime input and never used — remove it or use it`,
    );
  }
}

process.exit(gate.report());
