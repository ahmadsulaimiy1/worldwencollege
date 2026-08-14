#!/usr/bin/env node
// Generates assets/art/authority-chain.svg — the third living diagram
// (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// /about/governance/ describes something most institutions would not
// publish: a governance structure that is fully designed and not yet
// connected. Two academic bodies are constituted; neither has members;
// so nothing can be approved, and every decision that would belong to
// them is recorded as interim under authority delegated to the Press,
// marked with the body it awaits.
//
// Prose can say that. What prose cannot do is show it in one look —
// that the chain is complete in design and broken at exactly one link,
// and that the College has drawn the break rather than routed around it
// quietly.
//
// So the spine is continuous where authority actually flows, and it
// STOPS at the appointment gap. The approval node beyond the gap is
// drawn hollow and unlit, reachable only across a dashed span. The
// bypass — interim adoption — is solid, because that is what genuinely
// happens today, and it loops back to ratification rather than
// terminating, because an interim decision is not a finished one.
//
// The lower register lists the four unfilled posts against the specific
// thing each one blocks, which is the page's own framing: naming what a
// vacancy blocks is more useful than a page that stops short.
//
// English only for now: /ar/about/governance/ does not exist yet. When
// it is written, add the `ar` branch here in the same pass — a diagram
// that argues this much should not reach one audience and not the other.
//
//   node scripts/art/generate-authority-chain.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, n, text, drawn, rule, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'assets/art/authority-chain.svg');
const SANS = sansFor('en');

const W = 900, H = 572;
const bits = [];

// ── Register one: the chain ───────────────────────────────────────────
const SPINE = 84;          // y of the main flow
const BYPASS = 200;         // y of the interim route

/** A labelled station on the chain. */
function station(x, y, { label, sub, w = 168, h = 62, live = true, tint = INK.goldRich }) {
  const half = w / 2;
  const out = [];
  out.push(`<g data-pop>`
    + `<rect x="${n(x - half)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="3"`
    + ` fill="${live ? 'rgba(31,61,122,0.30)' : 'none'}"`
    + ` stroke="${live ? tint : INK.steel}" stroke-width="${live ? 1.4 : 1}"`
    + ` stroke-opacity="${live ? 1 : 0.55}"${live ? '' : ' stroke-dasharray="4 4"'}/>`
    + `</g>`);
  out.push(text(label, {
    x, y: sub ? y - 2 : y + 5, anchor: 'middle', size: 14.5, weight: 700,
    fill: live ? INK.goldChampagne : INK.steel, family: SERIF, pop: true,
  }));
  if (sub) out.push(text(sub, {
    x, y: y + 17, anchor: 'middle', size: 10.5, weight: 700, tracking: 1.4,
    fill: live ? INK.cerulean : INK.steel, family: SANS, opacity: live ? 0.9 : 0.7, pop: true,
  }));
  return out;
}

const X = { decision: 120, body: 348, gap: 560, approval: 770 };

bits.push(...station(X.decision, SPINE, { label: 'A decision', sub: 'TAKEN', w: 150 }));
bits.push(...station(X.body, SPINE, { label: 'Recorded under a body', sub: 'BASCE  ·  SENATE', w: 232 }));
bits.push(...station(X.approval, SPINE, { label: 'Approved', sub: 'NOT REACHABLE', w: 150, live: false }));

// The live span: a decision does get recorded against a body.
bits.push(drawn(`M${n(X.decision + 75)} ${n(SPINE)}L${n(X.body - 116)} ${n(SPINE)}`,
  { stroke: INK.goldRoyal, width: 1.6, ms: 700 }));
bits.push(`<path d="M${n(X.body - 122)} ${n(SPINE - 5)}l6 5-6 5Z" fill="${INK.goldRoyal}" data-pop/>`);

// THE BREAK. Two stubs reaching toward each other and not meeting is the
// entire diagram — a dashed line straight through would read as "slow",
// and what is true is "stopped".
const stubL = X.body + 116, stubR = X.approval - 75;
bits.push(drawn(`M${n(stubL)} ${n(SPINE)}L${n(stubL + 42)} ${n(SPINE)}`,
  { stroke: INK.goldRoyal, width: 1.6, ms: 500 }));
bits.push(rule(stubR - 42, SPINE, stubR, SPINE, { stroke: INK.steel, width: 1.4, opacity: 0.5, dash: '5 5' }));
bits.push(`<g data-pop>`
  + `<path d="M${n(X.gap - 16)} ${n(SPINE - 16)}L${n(X.gap - 4)} ${n(SPINE + 16)}" stroke="${INK.burgundy}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`
  + `<path d="M${n(X.gap + 4)} ${n(SPINE - 16)}L${n(X.gap + 16)} ${n(SPINE + 16)}" stroke="${INK.burgundy}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`
  + `</g>`);
bits.push(text('0 MEMBERS APPOINTED', {
  x: X.gap, y: SPINE - 30, anchor: 'middle', size: 10.5, weight: 700, tracking: 1.8,
  fill: '#C9788A', family: SANS, pop: true,
}));
bits.push(text('the chain stops here', {
  x: X.gap, y: SPINE + 40, anchor: 'middle', size: 11.5,
  fill: INK.slateText, family: SANS, pop: true,
}));

// ── The bypass that actually carries today's decisions ────────────────
bits.push(...station(X.gap, BYPASS, {
  label: 'Adopted as interim', sub: 'DELEGATED TO THE PRESS', w: 264, tint: INK.goldRoyal,
}));
// Down from the body, along, and into the interim station.
bits.push(drawn(
  `M${n(X.body)} ${n(SPINE + 31)}L${n(X.body)} ${n(BYPASS)}L${n(X.gap - 132)} ${n(BYPASS)}`,
  { stroke: INK.goldRoyal, width: 1.6, ms: 1000 }));
bits.push(`<path d="M${n(X.gap - 138)} ${n(BYPASS - 5)}l6 5-6 5Z" fill="${INK.goldRoyal}" data-pop/>`);

// And back up to the approval it is still waiting for — the loop is the
// point: interim is not finished, it is pending.
bits.push(drawn(
  `M${n(X.gap + 132)} ${n(BYPASS)}L${n(X.approval)} ${n(BYPASS)}L${n(X.approval)} ${n(SPINE + 31)}`,
  { stroke: INK.steel, width: 1.2, ms: 900, opacity: 0.55 }));
// Sits below the return leg rather than beside it: at the obvious
// placement the label ran back across the interim station it comes out
// of, which no amount of tracking fixes.
bits.push(text('awaits ratification', {
  x: X.approval + 75, y: BYPASS + 46, anchor: 'end', size: 11,
  fill: INK.steel, family: SANS, pop: true,
}));

// ── Register two: the vacancies, and what each one blocks ─────────────
const VACANCIES = [
  ['External Examiner', 'no award can be conferred'],
  ['Board members', 'nothing can be approved'],
  ['Academic Reviewer', 'no volume is independently read'],
  ['Principal officer', 'no message can be signed'],
];

const VY = 330;
bits.push(rule(70, VY - 34, W - 70, VY - 34, { stroke: INK.goldRoyal, width: 1, opacity: 0.28, dash: '1 7' }));
bits.push(text('POSTS NOT YET FILLED, AND WHAT EACH ONE BLOCKS', {
  x: 70, y: VY - 8, size: 10.5, weight: 700, tracking: 2, fill: INK.cerulean, family: SANS,
}));

VACANCIES.forEach(([post, blocks], i) => {
  const y = VY + 42 + i * 52;
  // An empty seat: a ring with nothing in it.
  bits.push(`<g data-pop>`
    + `<circle cx="88" cy="${n(y - 5)}" r="9" fill="none" stroke="${INK.steel}" stroke-width="1.2" stroke-dasharray="3 3"/>`
    + `</g>`);
  bits.push(text(post, {
    x: 116, y: y, size: 15, weight: 700, fill: INK.goldChampagne, family: SERIF, pop: true,
  }));
  bits.push(rule(340, y - 5, 396, y - 5, { stroke: INK.steel, width: 1, opacity: 0.45 }));
  bits.push(text(`until filled, ${blocks}`, {
    x: 410, y: y, size: 12.5, fill: INK.slateText, family: SANS, pop: true,
  }));
  if (i < VACANCIES.length - 1) {
    bits.push(rule(70, y + 22, W - 70, y + 22, { stroke: INK.steel, width: 0.8, opacity: 0.16 }));
  }
});

const svg = plate({
  id: 'authority-chain', lang: 'en', width: W, height: H,
  title: 'The chain of academic authority, and where it is broken',
  desc:
    'A decision is taken and recorded under one of the two academic bodies, BASCE or the Academic Senate. '
    + 'There the chain stops: neither body has any members appointed, so nothing can be approved. '
    + 'The route that does carry decisions today runs downward instead — adopted as interim under authority '
    + 'delegated to the Press — and loops back to approval, because an interim decision awaits ratification '
    + 'rather than being finished. '
    + 'Four posts are unfilled, and each blocks something specific: with no External Examiner no award can be '
    + 'conferred; with no board members nothing can be approved; with no Academic Reviewer no volume is read '
    + 'independently of its author; with no principal officer no institutional message can be signed.',
  body: bits.map((s) => '  ' + s).join('\n'),
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
