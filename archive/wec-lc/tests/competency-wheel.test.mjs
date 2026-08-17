// NOBODY PROOF-READS A PICTURE.
//
// The competency wheel plots six numbers and argues from them: that
// BASCE's own remit — "each competency is assessed multiple times across
// each level" — is met by three of the six today, missed by one, and not
// approached at all by two.
//
// That argument is only worth making while the numbers are right, and a
// figure inside an SVG is the one artefact on this site that no reader
// checks and no ordinary test touches. So this file reads the plotted
// values back OUT of the shipped drawing and holds them against the
// competency mapping they were generated from, in both languages —
// the rule tests/award-diagram.test.mjs established and the master plan
// made binding.
//
// It also holds the page. A drawing that says Bearing is assessed nought
// times, on a page whose prose implies otherwise, is a worse defect than
// either of them alone.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const { readCoverage } = await import(loadUrl('scripts/art/generate-competency-wheel.mjs'));
const D = readCoverage();

check(`The record holds six competencies — ${D.rows.length}`, D.rows.length === 6,
  D.rows.map((r) => `${r.code}:${r.count}`).join(' '));

const EN = path.join(ROOT, 'assets/art/competency-wheel.svg');
const AR = path.join(ROOT, 'assets/art/competency-wheel.ar.svg');
check('Both editions of the wheel are built', existsSync(EN) && existsSync(AR));

const svgText = (p) => readFileSync(p, 'utf8')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"');

const en = svgText(EN);
const ar = svgText(AR);

// ── The plotted figures ───────────────────────────────────────────────
// Read from the label text rather than from the polygon geometry: the
// label is what a sighted reader actually takes away, and a polygon that
// disagreed with its own label would be caught by the mismatch anyway.

{
  const missing = D.rows.filter((r) => {
    const plotted = r.count > 0 ? `${r.count}×` : '0';
    return !en.includes(`>${plotted}<`) && !en.includes(plotted);
  });
  check('Every competency count in the record appears on the English wheel',
    missing.length === 0, missing.map((r) => `${r.code}=${r.count}`).join(', '));

  // Direction two: no count on the drawing that the record does not
  // hold. Catches a figure left behind by an edit to the seed.
  const plottedCounts = [...en.matchAll(/>(\d+)×</g)].map((m) => Number(m[1])).sort((a, b) => a - b);
  const recordCounts = D.rows.filter((r) => r.count > 0).map((r) => r.count).sort((a, b) => a - b);
  check('...and the drawing plots no figure the record does not hold',
    plottedCounts.join(',') === recordCounts.join(','),
    `drawn ${plottedCounts.join(',')} / record ${recordCounts.join(',')}`);
}

// Every competency is NAMED, including the two carrying nothing. A
// framework that quietly drops its empty axes is drawing a pentagon and
// calling it the whole picture.
{
  const unnamed = D.rows.filter((r) => !en.includes(r.name));
  check('Every competency is named on the wheel, including the empty ones',
    unnamed.length === 0, unnamed.map((r) => r.code).join(', '));
}

// ── The argument the drawing makes ────────────────────────────────────
const REMIT_MIN = 2;
const zero = D.rows.filter((r) => r.count === 0);
const clears = D.rows.filter((r) => r.count >= REMIT_MIN);

check(`The remit threshold is drawn, not merely described — at ${REMIT_MIN}`,
  /stroke-dasharray="4 4"/.test(en) && en.includes(`${REMIT_MIN}×`));

check(`Some competency is genuinely unassessed, or this drawing has no argument — ${zero.length}`,
  zero.length > 0, zero.map((r) => r.code).join(', '));

check(`...and the aria description states the shortfall in words — ${clears.length} of 6 clear it`,
  /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(en)[1].includes(`${clears.length} of the six clear`));

// The description is the diagram, for a reader who cannot see it. It has
// to carry every number, not a summary of them.
{
  const desc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(en)[1];
  const absent = D.rows.filter((r) => !desc.includes(`${r.name} ${r.count}`));
  check('The aria description carries every competency and its figure',
    absent.length === 0, absent.map((r) => r.code).join(', '));
}

// ── Arabic ────────────────────────────────────────────────────────────
{
  check('The Arabic edition is marked and written in Arabic',
    /lang="ar"/.test(ar) && /[؀-ۿ]{4}/.test(ar));

  // Numerals must not be reordered inside right-to-left text. Every
  // figure in the Arabic drawing is wrapped as a left-to-right run for
  // the same reason the award ladder's thresholds are: a mirrored
  // count is not a styling flaw, it is a wrong number.
  const ltrRuns = (ar.match(/direction="ltr"/g) || []).length;
  check(`Figures in the Arabic wheel are pinned left-to-right — ${ltrRuns} runs`,
    ltrRuns >= D.rows.filter((r) => r.count > 0).length,
    `${ltrRuns} runs for ${D.rows.filter((r) => r.count > 0).length} plotted figures`);

  const missingAr = D.rows.filter((r) => r.count > 0 && !ar.includes(`${r.count}×`));
  check('Every plotted figure appears in the Arabic edition too',
    missingAr.length === 0, missingAr.map((r) => r.code).join(', '));

  const arDesc = /<desc[^>]*>([\s\S]*?)<\/desc>/.exec(ar)[1];
  check('The Arabic description carries the figures as well',
    D.rows.every((r) => arDesc.includes(String(r.count))));
}

// ── The page must not contradict the drawing ──────────────────────────
{
  // BASCE is a section of the governance pillar now; the wheel ships there.
  const page = path.join(ROOT, 'governance/index.html');
  check('The BASCE page is built', existsSync(page));
  const html = readFileSync(page, 'utf8');

  check('The wheel is placed on the page that owns the framework',
    html.includes('data-diagram="competency-wheel"'));

  // The remit clause is what the drawing measures against. If it is ever
  // reworded, the drawing's threshold stops meaning anything and this
  // fails rather than quietly diverging.
  check('...and the remit the drawing measures against is still quoted on it',
    /assessed multiple times across each level/.test(html));

  // The claim most at risk of drifting back: an even-coverage sentence
  // would contradict the shape of the polygon directly above it.
  check('The page does not claim even coverage',
    !/evenly distributed|distributed evenly across|all six are assessed/i.test(
      html.replace(/distributed evenly to look complete/g, '')));

  // Levels II–VI carry no mapping, and the page says so rather than
  // leaving "Level I" to be read as an example.
  check('The page says the mapping reaches Level I only',
    /Levels II to VI carry no competency mapping/i.test(html));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
