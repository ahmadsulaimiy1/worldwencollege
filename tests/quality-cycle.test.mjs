// A CYCLE IS ONLY A CYCLE ONCE IT HAS COME ROUND.
//
// The quality cycle diagram makes one claim and everything else on it
// depends on that claim being true: the outer ring — teach, assess,
// review, revise — has never closed, because nobody has been taught.
//
// That is a claim with an expiry date. The day the College enrols its
// first learner it becomes false, and a drawing that says "0 enrolments"
// on a page selling places to learners who have enrolled is the worst
// kind of stale: confident, specific, and wrong.
//
// So this file holds three things:
//
//   1. The figures on the drawing match the record.
//   2. The record still shows nothing taught — and if it ever does not,
//      this fails LOUDLY rather than letting a regenerate paper over it.
//      The generator refuses to render in that case for the same reason;
//      this is the check that fires even when nobody re-runs it.
//   3. The inner ring is drawn as closed and the outer as open, because
//      an open inner ring would say the College checks nothing, which is
//      also false.

import { readFileSync, existsSync } from 'node:fs';
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
check('Nothing has been taught, which is what the whole drawing asserts',
  T.enrolments === 0 && T.liveSessions === 0 && T.awards === 0,
  `enrolments ${T.enrolments} · sessions ${T.liveSessions} · awards ${T.awards}. `
  + 'If teaching has genuinely started, the diagram needs REDRAWING, not regenerating — '
  + 'its argument is that the ring has never closed.');

const EN = path.join(ROOT, 'assets/art/quality-cycle.svg');
const AR = path.join(ROOT, 'assets/art/quality-cycle.ar.svg');
check('Both editions are built', existsSync(EN) && existsSync(AR));

const en = readFileSync(EN, 'utf8');
const ar = readFileSync(AR, 'utf8');

// ── The figures ───────────────────────────────────────────────────────
{
  const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(en)[1];
  check('The English figures on the drawing match the record',
    en.includes(`${T.enrolments} enrolments`)
    && en.includes(`${T.liveSessions} sessions taught`)
    && en.includes(`${T.awards} awards conferred`));
  check('...and the aria description carries them too, not a summary',
    desc.includes(`${T.enrolments} enrolments`)
    && desc.includes(`taught ${T.liveSessions} sessions`)
    && desc.includes(`conferred ${T.awards} awards`));

  const arDesc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(ar)[1];
  check('The Arabic edition is marked, written in Arabic, and carries the figures',
    /lang="ar"/.test(ar) && /[؀-ۿ]{4}/.test(ar)
    && arDesc.includes(String(T.enrolments)));
}

// ── The two rings, and which of them is open ──────────────────────────
// The inner ring is a plain <circle>: closed by construction, and that
// is the point. The outer ring is arcs, and at least one of them must be
// dashed or the drawing is claiming a completed cycle.
{
  for (const [label, svg] of [['English', en], ['Arabic', ar]]) {
    check(`The ${label} inner ring is drawn closed`,
      /<circle[^>]*r="88"[^>]*stroke-width="1.6"/.test(svg));

    // ONE arc solid, five dashed — not two-and-four, which is what this
    // check first expected by counting completed STATIONS instead of
    // completed TRANSITIONS. Two stations are done; only one journey
    // between two done stations has happened. The ring is open from
    // Publish all the way round to Design, and the drawing was right
    // where the expectation was wrong.
    const arcs = [...svg.matchAll(/<path[^>]*A196 196[^>]*>/g)].map((m) => m[0]);
    const dashed = arcs.filter((a) => a.includes('stroke-dasharray'));
    check(`...and the ${label} outer ring is open across every transition but one — `
      + `${dashed.length} of ${arcs.length} arcs`,
      arcs.length === 6 && dashed.length === 5,
      `${dashed.length} dashed of ${arcs.length}`);
  }
}

// Two stations are complete and four are not. A tick on a station that
// has not happened is the failure this guards.
{
  const ticks = (en.match(/l3 3\.4 5\.4 -6/g) || []).length;
  check(`Exactly two stations carry a completion tick — ${ticks}`, ticks === 2, String(ticks));
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
  check(`...and still says in prose that the cycles have not turned`,
    html.includes(phrase), phrase);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
