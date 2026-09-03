// A CYCLE IS ONLY A CYCLE ONCE IT HAS COME ROUND.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS FILE USED TO ASSERT, AND WHY THAT WAS THE DEFECT
// ─────────────────────────────────────────────────────────────────────
// This file used to open with "the outer ring has never closed, because
// nobody has been taught", and it held the drawing to exactly that. The
// drawing read four zeroes out of the PLATFORM database — enrolments,
// live sessions, awards — and published them as the College's teaching
// history:
//
//   "the College has 0 enrolments, has taught 0 sessions and has
//    conferred 0 awards ... the cycle that would validate the checking
//    cannot begin until somebody is taught"
//
// Three cohorts have been taught since 2023 and awards were conferred at
// Level I and Level II (data/standing.json). The zeroes are true of the
// platform, which those cohorts predate. They were never true of the
// College. The sentence sat on the Governance page, in both languages,
// on a page read by people deciding whether to enrol.
//
// Nothing caught it, and the reason generalises: the sentence lives in an
// SVG, and every text sweep in this directory reads HTML. So this file
// now guards the drawing's argument AND sweeps the art directory for the
// same family of claim, in both languages.
//
// What it holds:
//
//   1. The platform record is still nought — and if it ever is not, this
//      fails LOUDLY, because the drawing states those figures as a
//      property of the platform and that sentence changes.
//   2. The drawing's argument matches the record: four stations complete,
//      Review and Revise open, and the cycle described as constituted and
//      unturned rather than unstartable.
//   3. No SVG anywhere in assets/art says the College has taught nobody.
//   4. The inner ring is closed and the outer is open, because an open
//      inner ring would say the College checks nothing, which is false.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const { readTeaching } = await import(loadUrl('scripts/art/generate-quality-cycle.mjs'));
const T = readTeaching();

// ── The claim with the expiry date ────────────────────────────────────
// Still worth holding, but for the right reason: what is nought is the
// PLATFORM's record, not the College's teaching.
check('The platform record is still nought, which is what the drawing describes',
  T.enrolments === 0 && T.liveSessions === 0 && T.awards === 0,
  `enrolments ${T.enrolments} · sessions ${T.liveSessions} · awards ${T.awards}. `
  + 'If the platform has begun recording, re-read the diagram copy before regenerating: '
  + 'the sentence about what the platform holds, and why the cohorts predate it, is what changes.');

const EN = path.join(ROOT, 'assets/art/quality-cycle.svg');
const AR = path.join(ROOT, 'assets/art/quality-cycle.ar.svg');
check('Both editions are built', existsSync(EN) && existsSync(AR));

const en = readFileSync(EN, 'utf8');
const ar = readFileSync(AR, 'utf8');

// ── The argument the drawing makes ────────────────────────────────────
{
  const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(en)[1];
  check('The English drawing says four stations are complete, not two',
    /first four are complete/i.test(desc), desc.slice(0, 120));
  check('...and names the teaching that makes them complete',
    /three cohorts have been taught since 2023/i.test(desc)
    && /Level I and Level II/.test(desc));
  check('...and says what is actually outstanding: a turn of the cycle',
    /constituted on 14 August 2026 and has not completed a turn/i.test(desc));
  check('...and the caption carries the cycle’s state, not four zeroes',
    en.includes('cycle constituted 14 Aug 2026') && en.includes('0 turns completed'));

  const arDesc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(ar)[1];
  check('The Arabic edition is marked, written in Arabic, and makes the same argument',
    /lang="ar"/.test(ar) && /[؀-ۿ]{4}/.test(ar)
    && /ثلاث دفعات/.test(arDesc) && /لم تُتِمّ دورة واحدة/.test(arDesc));
}

// ── The retired claim, banned across the whole art directory ──────────
// The lesson of this defect is not "fix one sentence"; it is that the
// sweeps never looked here. So they look here now, at every drawing.
{
  const artDir = path.join(ROOT, 'assets/art');
  const svgs = readdirSync(artDir).filter((f) => f.endsWith('.svg'));
  const TAUGHT_NOBODY = [
    /cannot begin until somebody is taught/i,
    /has taught 0 sessions/i,
    /0 enrolments/i,
    /nobody has been taught/i,
    /has taught nobody/i,
    /لا يمكن أن تبدأ قبل أن يُدرَّس أحد/,
    /لم يُدرَّس أحد/,
    /٠ تسجيل|0 تسجيل/,
  ];
  const offenders = [];
  for (const f of svgs) {
    const body = readFileSync(path.join(artDir, f), 'utf8');
    for (const re of TAUGHT_NOBODY) if (re.test(body)) offenders.push(`${f}: ${re}`);
  }
  check(`No drawing in assets/art says the College has taught nobody — ${svgs.length} swept`,
    offenders.length === 0, offenders.join('; '));

  check('...and this sweep does catch the sentence it exists for',
    TAUGHT_NOBODY[0].test('the cycle that would validate the checking cannot begin until somebody is taught')
    && TAUGHT_NOBODY[2].test('<text>0 enrolments · 0 sessions taught</text>')
    && TAUGHT_NOBODY[5].test('لا يمكن أن تبدأ قبل أن يُدرَّس أحد.'));
}

// ── The two rings, and which of them is open ──────────────────────────
// The inner ring is a plain <circle>: closed by construction, and that is
// the point. The outer ring is arcs, and an arc is solid only where both
// of the stations it joins are complete.
{
  for (const [label, svg] of [['English', en], ['Arabic', ar]]) {
    check(`The ${label} inner ring is drawn closed`,
      /<circle[^>]*r="88"[^>]*stroke-width="1.6"/.test(svg));

    // Four stations complete means three journeys between two complete
    // stations have happened — Design→Publish, Publish→Teach,
    // Teach→Assess — and three have not. Counting transitions rather than
    // stations is the arithmetic this check got wrong once before.
    const arcs = [...svg.matchAll(/<path[^>]*A196 196[^>]*>/g)].map((m) => m[0]);
    const dashed = arcs.filter((a) => a.includes('stroke-dasharray'));
    check(`...and the ${label} outer ring is open across three transitions of six — `
      + `${dashed.length} of ${arcs.length} arcs`,
      arcs.length === 6 && dashed.length === 3,
      `${dashed.length} dashed of ${arcs.length}`);
  }
}

// Four stations are complete and two are not. A tick on a station that
// has not happened is the failure this guards — CLAUDE.md §5.
{
  const ticks = (en.match(/l3 3\.4 5\.4 -6/g) || []).length;
  check(`Exactly four stations carry a completion tick — ${ticks}`, ticks === 4, String(ticks));
  const arTicks = (ar.match(/l3 3\.4 5\.4 -6/g) || []).length;
  check(`...and the Arabic edition agrees — ${arTicks}`, arTicks === 4, String(arTicks));
}

// ── The pages ─────────────────────────────────────────────────────────
for (const [label, rel, phrase] of [
  ['English', 'governance/index.html', 'have not turned'],
  ['Arabic', 'ar/governance/index.html', 'لم تدر'],
]) {
  const p = path.join(ROOT, rel);
  check(`The ${label} quality page is built`, existsSync(p));
  const html = readFileSync(p, 'utf8');
  check(`...and carries the cycle`, html.includes('data-diagram="quality-cycle"'));
  check(`...and still says in prose that the cycle has not turned`,
    html.includes(phrase), phrase);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
