#!/usr/bin/env node
/**
 * GATE · CONTRAST
 *
 * SEB §30.15: accessibility is part of the luxury, not a compliance
 * exercise bolted on at the end. This gate computes WCAG 2.1 ratios for
 * every foreground role against every ground it can legally sit on, IN
 * BOTH REGISTERS, and fails the build on a pair that does not clear its
 * threshold.
 *
 * It exists because the palette shipped three defects that four readings
 * of the stylesheet did not catch, and this gate caught on its first run:
 *
 *   verdigris on obsidian   3.35:1   "confirmed" was not readable
 *   carnelian on obsidian   2.43:1   the ERROR message was not readable
 *   lapis     on obsidian   2.29:1   the FOCUS RING was nearly invisible
 *
 * The third is the one that matters most. A focus indicator at 2.29:1 is
 * a focus indicator a keyboard reader cannot find, on every page of the
 * product, in the register the product is presented in. No amount of
 * looking at it would have produced a number.
 *
 * Thresholds, from WCAG 2.1:
 *   4.5   normal text (AA)
 *   3.0   large text (≥24px, or ≥18.66px bold) (AA)
 *   3.0   user-interface components and graphical objects (SC 1.4.11)
 */

import { Gate, contrast, palette } from './lib.mjs';

const gate = new Gate('contrast', 'SEB §30.15');

const AA_TEXT = 4.5;
const AA_LARGE = 3.0;
const AA_NON_TEXT = 3.0;

const { ceremonial, reading } = await palette();

/** The grounds a foreground may legally sit on, per register. */
const GROUNDS = ['--sx-bg', '--sx-bg-raised', '--sx-bg-plinth'];

/**
 * Foreground roles, with the threshold each must clear and why.
 *
 * The threshold is a property of the ROLE, not of the colour: `--sx-fg`
 * is body copy and must clear 4.5; `--sx-metal-text` is the display face
 * and clears 4.5 anyway; the signal roles carry messages and must clear
 * 4.5 even though a lazier reading of the spec would call some of them
 * non-text.
 */
const ROLES = [
  ['--sx-fg', AA_TEXT, 'body copy'],
  ['--sx-fg-quiet', AA_TEXT, 'marginalia and colophon — small, so it needs MORE contrast, not less'],
  ['--sx-metal-text', AA_TEXT, 'the display face and every cartouche'],
  ['--sx-signal-verified', AA_TEXT, 'confirmed · verified · genuine'],
  ['--sx-signal-attention', AA_TEXT, 'error messages carry this'],
  ['--sx-signal-interactive', AA_TEXT, 'links, and the focus ring — SC 2.4.11'],
  ['--sx-boundary', AA_NON_TEXT, 'anything that IDENTIFIES a control, a state, or a graphical object — SC 1.4.11'],
];

for (const [registerName, map] of [['ceremonial', ceremonial], ['reading', reading]]) {
  for (const [role, threshold, why] of ROLES) {
    const fg = map.get(role);
    if (!fg) { gate.fail(`${registerName} · ${role}`, 'token does not resolve to a colour'); continue; }
    for (const groundName of GROUNDS) {
      const bg = map.get(groundName);
      if (!bg) continue;
      const ratio = contrast(fg, bg);
      gate.check(
        ratio >= threshold,
        `${registerName} · ${role} (${fg}) on ${groundName} (${bg})`,
        `${ratio}:1 is below ${threshold}:1 — ${why}`,
      );
    }
  }
}

/**
 * The rule that produced --sx-metal-text.
 *
 * SEB §30.7 rule 1: gold is not type on paper. This asserts the REASON
 * rather than only the result — if somebody ever "fixes" the reading
 * register by pointing --sx-metal-text back at aurum, the gate says why
 * that was wrong instead of merely that it is.
 */
const aurumOnPaper = contrast(ceremonial.get('--sx-aurum'), reading.get('--sx-bg'));
gate.check(
  aurumOnPaper < AA_TEXT,
  'SEB §30.7 rule 1',
  `aurum now computes to ${aurumOnPaper}:1 on paper. If that is genuinely above ${AA_TEXT}, the palette changed and the rule needs rewriting, not deleting.`,
);
gate.check(
  reading.get('--sx-metal-text') !== reading.get('--sx-aurum'),
  'SEB §30.7 rule 1',
  'the reading register resolves --sx-metal-text to gold — gold is not type on paper',
);

/**
 * The reverse-type correction (SEB §30.6). Light glyphs on a dark ground
 * irradiate, so display type is set half a weight step back on obsidian.
 * A POSITIVE value would embolden reverse type, which is the opposite of
 * the correction and would look like a bug nobody could name.
 */
const step = Number(/--sx-reverse-step:\s*(-?\d+)/.exec(
  await (await import('node:fs/promises')).readFile(new URL('../src/tokens.css', import.meta.url), 'utf8'),
)?.[1]);
gate.check(step < 0, 'src/tokens.css --sx-reverse-step', `is ${step}; reverse type is set LIGHTER, not heavier (SEB §30.6)`);

/**
 * --sx-rule is exempt from 3:1 BY ROLE, not by oversight, and the
 * exemption is checked rather than assumed: a separator must still be
 * perceptible. The 1.3:1 floor is authored — WCAG says nothing about
 * decorative separators, so the system says something instead of
 * nothing.
 */
for (const [registerName, map] of [['ceremonial', ceremonial], ['reading', reading]]) {
  const rule = map.get('--sx-rule');
  for (const groundName of GROUNDS) {
    const ratio = contrast(rule, map.get(groundName));
    gate.check(
      ratio >= 1.3,
      `${registerName} · --sx-rule (${rule}) on ${groundName}`,
      `${ratio}:1 — a separator owes no 3:1, but below 1.3:1 it is not a separator, it is nothing`,
    );
    gate.check(
      ratio < AA_NON_TEXT,
      `${registerName} · --sx-rule on ${groundName}`,
      `${ratio}:1 clears 3:1, so --sx-rule and --sx-boundary have converged — either the split is no longer needed, or one of them drifted`,
    );
  }
}

process.exit(gate.report());
