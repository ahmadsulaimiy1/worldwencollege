#!/usr/bin/env node
/**
 * GATE · THE BEAT
 *
 * SEB §30.9: one movement. Base beat 240ms; the permitted durations are
 * its multiples, and the permitted curves are the four authored ones.
 *
 * This is the gate that keeps the system feeling like ONE product. A
 * design language survives a stray hex; it does not survive forty
 * durations, because timing is what a person perceives as character. A
 * page where the header takes 300ms, the card 250ms and the menu 400ms
 * does not read as a system with three components — it reads as three
 * systems.
 *
 * `ease`, `ease-in-out` and `linear` are refused with the rest: a
 * browser default curve is not a decision, and `linear` in particular is
 * the curve of a machine that has no mass.
 *
 * There is an escape hatch and it is deliberately noisy: a line carrying
 * `/* sx-gate-allow: beat — reason * /` is skipped AND PRINTED, every
 * run, with its reason. An exemption nobody sees is a rule nobody keeps.
 */

import { Gate, declarations, exemptions, stylesheets } from './lib.mjs';

const gate = new Gate('beat', 'SEB §30.9');

const BEAT = 240;
const TICK = BEAT / 8;                     // 30ms — the smallest unit

const DURATION_TOKENS = new Set([
  '--sx-tick', '--sx-beat-4', '--sx-beat-2', '--sx-beat',
  '--sx-beat-x2', '--sx-beat-x4', '--sx-beat-x8',
]);
const CURVE_TOKENS = new Set([
  '--sx-sovereign', '--sx-escapement', '--sx-descent', '--sx-release',
]);

/**
 * `1ms` under `prefers-reduced-motion` is the conventional way to
 * neutralise a transition while still letting `transitionend` fire, so
 * handlers waiting on it do not hang. Exempted by name.
 */
const REDUCED_MOTION_NEUTRAL = /^1ms\b/;

const TIME = /(-?[\d.]+)(ms|s)\b/g;
const NAMED_CURVE = /\b(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|steps\()/;

const files = await stylesheets();

for (const file of files) {
  if (file.name === 'tokens.css') continue;   // tokens.css DEFINES the movement

  const allowed = exemptions(file.text);

  for (const { line, prop, value } of declarations(file.text)) {
    const where = `${file.path}:${line}`;
    if (gate.exempt(allowed, line, where)) continue;
    const timed = /^(transition|animation)(-duration|-delay)?$/.test(prop);
    if (!timed) continue;

    // Durations
    for (const [, n, unit] of value.matchAll(TIME)) {
      if (REDUCED_MOTION_NEUTRAL.test(`${n}${unit}`)) { gate.check(true, where, ''); continue; }
      const ms = unit === 's' ? Number(n) * 1000 : Number(n);
      gate.check(
        ms % TICK === 0,
        where,
        `\`${n}${unit}\` in \`${prop}\` is not a multiple of the ${TICK}ms tick (beat ${BEAT}ms) — use a --sx-beat* token (SEB §30.9)`,
      );
    }

    // Raw times at all, in the shorthand, are a smell even when they land
    // on the beat: the token is the thing that can be retimed.
    if (/^(transition|animation)$/.test(prop) && TIME.test(value) && !value.includes('var(--sx-')) {
      gate.fail(where, `raw duration in \`${prop}: ${value}\` — reference a --sx-beat* token so the movement can be retimed in one place`);
    }

    // Curves
    if (NAMED_CURVE.test(value)) {
      gate.fail(where, `browser default easing in \`${prop}: ${value}\` — use --sx-sovereign / --sx-escapement / --sx-descent / --sx-release (SEB §30.9)`);
    } else {
      gate.check(true, where, '');
    }

    // Any --sx-* referenced in a timing position must be a movement token.
    for (const [, name] of value.matchAll(/var\((--sx-[\w-]+)/g)) {
      gate.check(
        DURATION_TOKENS.has(name) || CURVE_TOKENS.has(name),
        where,
        `\`${name}\` is not a Chronograph token but appears in \`${prop}\` (SEB §30.9)`,
      );
    }
  }
}

/* The behaviour layer reads its beat from one module, so a retimed
   stylesheet and a retimed script cannot disagree. */
const motion = files.find((f) => f.name === 'tokens.css');
const declared = motion?.text.match(/--sx-beat:\s*(\d+)ms/);
gate.check(
  Number(declared?.[1]) === BEAT,
  'src/tokens.css',
  `--sx-beat is ${declared?.[1]}ms but the gate and src/js/motion.js expect ${BEAT}ms — retime all three or none`,
);

process.exit(gate.report());
