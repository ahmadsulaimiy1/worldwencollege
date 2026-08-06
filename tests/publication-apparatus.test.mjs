// The reference apparatus: glossary, cross-references, routes,
// pronunciation strand, pull quotes.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   Every entry in the apparatus is EXTRACTED from curriculum the
//   College authored, and every extractor is checked against the way it
//   can plausibly lie.
//
// That second clause is the whole file. An extractor does not fail
// loudly. It returns a list, the list looks like a list, and the page
// sets beautifully whether or not a single entry on it is true. Three
// of the defects below shipped into a rendered PDF and were caught by
// reading the output, not by a test — so each now has a test.
//
//   1. SUBSTRING MATCHING. The glossary counted headwords as plain
//      substrings. "gist" scored 193 uses, every one of them inside the
//      word "reGISTer"; "warrant" scored 16, mostly from "warranty".
//      High counts read as confirmation, so the failure was invisible.
//
//   2. A FILTER THAT SELECTS EVERYTHING. Four strand routes were built
//      and printed as four tables of references. Set, they were
//      identical to one another and to the contents list, because
//      twelve named stages occur in all 114 teaching lessons.
//
//   3. A FILTER THAT SELECTS NOTHING. Scoped to the teaching lessons,
//      the collocation route matched zero items — the strand lives in
//      the module-overview items. An empty table would have printed as
//      "this strand does not exist".
//
//   4. LEVEL CONTEXT IN CROSS-REFERENCES. "Level V, Module 3 and
//      Module 4" means Level V twice. Reading each reference alone
//      mis-files every second cross-level reference — 82 of the 191 in
//      this book are cross-level, and they are the interesting ones.
//
// WHAT THIS FILE DOES NOT MEASURE:
//   Whether a glossary definition is a GOOD definition. It checks that
//   the term is used by the curriculum and that the entry is present;
//   the wording is an editorial judgement no assertion can make.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { ROOT, loadUrl } from './helpers.mjs';

const { buildCurriculum } = await import(loadUrl('scripts/publication/curriculum.mjs'));
const A = await import(loadUrl('scripts/publication/apparatus.mjs'));
const C = buildCurriculum();

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const HTML = `${ROOT}/publication/.flagship.html`;
if (!existsSync(HTML)) {
  console.log('FAIL The print source does not exist — run: npm run curriculum');
  process.exit(1);
}
const raw = readFileSync(HTML, 'utf8');
const text = raw.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');

const items = C.levels.flatMap((lv) => lv.modules.flatMap((m) => m.lessons));
const corpus = items.map((i) => `${i.title || ''} ${i.body || ''}`).join('\n')
  + C.levels.map((lv) => [lv.purpose, lv.graduateProfile, lv.awardTitle, lv.standing,
    `CEFR ${lv.cefr}`].join(' ')).join('\n');

// --- The glossary ------------------------------------------------------
{
  const g = A.glossary(C);
  check(`The glossary carries ${g.length} verified headwords`, g.length >= 40, g.length);

  // DEFECT 1. Every printed count must survive a word-boundary recount
  // done independently of the pattern the glossary used. A headword
  // whose only "uses" are inside longer words scores zero here.
  const bogus = g.filter((e) => {
    const re = new RegExp(`\\b${e.term.split(' ')[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    return !re.test(corpus);
  });
  check('No headword is matched only inside a longer word', bogus.length === 0,
    bogus.map((e) => e.term).join(', '));

  // A headword the curriculum does not use is padding, and it is the
  // easiest padding in publishing to write.
  const unused = g.filter((e) => e.count < 1 || !e.first);
  check('Every headword is used by the curriculum and cites its first use',
    unused.length === 0, unused.map((e) => e.term).join(', '));

  // The rejection path must be live. If nothing is ever rejected the
  // verification is decoration: it would pass just as happily with the
  // check removed.
  const rejected = A.glossaryRejects(C);
  check('The verification actually rejects proposed headwords',
    rejected.length > 0, `${rejected.length} dropped: ${rejected.join(', ')}`);

  const onPage = g.filter((e) => !text.includes(e.term));
  check('Every surviving headword reaches the page', onPage.length === 0,
    onPage.slice(0, 4).map((e) => e.term).join(', '));

  // Definitions are editorial. Institutional claims are not, and a
  // glossary is a comfortable place for one to hide.
  const claims = g.filter((e) => /\b(accredited|validated|approved by|recognised by|award-winning)\b/i
    .test(e.definition));
  check('No definition makes an institutional claim', claims.length === 0,
    claims.map((e) => e.term).join(', '));
}

// --- The cross-references ----------------------------------------------
{
  const { forward, back } = A.crossReferences(C);
  check(`${forward.size} lessons declare structured prerequisites`, forward.size > 100, forward.size);

  const refs = [...forward.values()].flat();
  check(`...resolving to ${refs.length} references`, refs.length > 150, refs.length);

  // DEFECT 4. The level context. Every cross-level reference is proof
  // the scanner carried a level forward; if it did not, every reference
  // would be filed under the lesson's own level and this count would be
  // zero.
  const crossLevel = [...forward.entries()]
    .flatMap(([ref, rs]) => rs.filter((r) => r.level !== ref.split('.')[0]));
  check('Cross-level references are resolved to the level that was named',
    crossLevel.length > 50, `${crossLevel.length} of ${refs.length}`);

  // Every extracted reference must point at something that exists. A
  // reference to a module that is not in the book is worse than none.
  const real = new Set();
  for (const lv of C.levels) {
    for (const m of lv.modules) {
      real.add(`${lv.roman}.${m.sequence}`);
      for (const it of m.lessons) real.add(`${lv.roman}.${m.sequence}.${it.sequence}`);
    }
  }
  const dangling = refs.filter((r) => !real.has(r.ref));
  check('No cross-reference points outside the book', dangling.length === 0,
    [...new Set(dangling.map((r) => r.ref))].slice(0, 6).join(', '));

  // The back-reference map is the one the book could not previously
  // show, and it must never include a module pointing at itself.
  const selfRef = [...back.entries()].filter(([k, v]) =>
    v.some((r) => r.startsWith(`${k}.`)));
  check('A module is never listed as returning to itself', selfRef.length === 0,
    selfRef.map(([k]) => k).join(', '));

  check(`${back.size} modules are returned to by a later lesson`, back.size > 30, back.size);

  // And they must reach the printed page, or the extraction is a
  // private fact about a data structure.
  check('Cross-references are printed beside the lessons',
    (raw.match(/class="xref"/g) || []).length > 100,
    (raw.match(/class="xref"/g) || []).length);
}

// --- The routes --------------------------------------------------------
{
  const r = A.routes(C);

  // DEFECT 2. A route that selects the whole book is the contents list.
  // It must be reported as a coverage figure, never printed as a table.
  const universalPrinted = r.printed.filter((x) => x.coverage >= 0.95);
  check('No route that selects everything is printed as a route',
    universalPrinted.length === 0, universalPrinted.map((x) => x.key).join(', '));
  check('...and the strands that do select everything are reported',
    r.universal.length > 0,
    r.universal.map((x) => `${x.key} ${Math.round(x.coverage * 100)}%`).join(', '));

  // DEFECT 3. An empty route is a broken filter, and printing it would
  // present a bug as a curriculum gap.
  check('No route is printed empty', r.empty.length === 0,
    r.empty.map((x) => x.key).join(', '));
  for (const x of r.printed) {
    check(`The ${x.key} route selects a proper subset`,
      x.total > 0 && x.coverage < 0.95, `${x.total} of ${x.pool}`);
  }

  // The coverage figures must reach the page: they are the finding that
  // replaced four pages of identical tables.
  check('The coverage of the universal strands is printed',
    r.universal.every((x) => text.includes(`${x.total} of ${x.pool}`)),
    r.universal.map((x) => `${x.total} of ${x.pool}`).join('; '));

  // No grammar route, with the reason stated rather than the absence
  // left to be noticed — and the reason recomputed, not remembered.
  //
  // The first draft of that page asserted the curriculum names NO
  // grammar stage. It names one, at VI.10.1, and this assertion is what
  // found it. So the page must now print every grammar stage it finds,
  // which means the claim cannot go stale if more are authored.
  check('The absence of a grammar route is explained, not silent',
    /no grammar route/i.test(text));
  const grammarStages = A.grammarStages(C);
  const uncited = grammarStages.filter((g) => !text.includes(g.ref));
  check(`All ${grammarStages.length} grammar stages in the curriculum are cited on that page`,
    uncited.length === 0, uncited.map((g) => `${g.ref} ${g.head}`).join('; '));
  // One consolidation stage is not a strand. If that ever stops being
  // true, the editorial conclusion has to be revisited rather than the
  // sentence quietly kept.
  check('...and a grammar strand still does not exist to filter on',
    grammarStages.length <= 2, `${grammarStages.length} grammar stages`);
}

// --- The revision route ------------------------------------------------
{
  const rev = A.revisionByModule(C);
  const rows = rev.flatMap((g) => g.rows);
  check(`The revision route covers all ${rows.length} modules`, rows.length === C.totals.modules);

  // It has to VARY, or it is another contents list in disguise.
  const distinct = new Set(rows.map((x) => x.targets.join('|')));
  check('The revision route varies between modules', distinct.size > 30,
    `${distinct.size} distinct target sets`);

  // A module must never be sent back to itself: the reader is holding it.
  const selfSend = rev.flatMap((g) => g.rows
    .filter((x) => x.targets.includes(`${g.lv.roman}.${x.module}`))
    .map((x) => `${g.lv.roman}.${x.module}`));
  check('No module sends the reader back to itself', selfSend.length === 0, selfSend.join(', '));

  check('Every module names the assessments the revision precedes',
    rows.every((x) => x.quizRef && x.asgRef));
}

// --- The pronunciation strand ------------------------------------------
{
  const strand = A.pronunciationStrand(C);
  const rows = strand.flatMap((g) => g.rows);
  check(`The pronunciation strand collects ${rows.length} lessons`, rows.length > 100, rows.length);
  check('...across all six levels', strand.length === 6, strand.length);

  // Every focus must be the curriculum's own sentence, verbatim. This
  // is the assertion that stops the collation quietly becoming a
  // rewrite: it compares against the lesson body in the database.
  const bodies = new Map(C.levels.flatMap((lv) => lv.modules.flatMap((m) => m.lessons
    .map((i) => [`${lv.roman}.${m.sequence}.${i.sequence}`, i.body || '']))));
  const paraphrased = rows.filter((r) => !bodies.get(r.ref).includes(r.focus));
  check('Every printed focus is the curriculum\'s own sentence, verbatim',
    paraphrased.length === 0, paraphrased.slice(0, 3).map((r) => r.ref).join(', '));
}

// --- The pull quotes ---------------------------------------------------
{
  const q = A.pullQuotes(C);
  check(`${q.size} of the ${C.totals.modules} modules carry a pull quote`, q.size > 30, q.size);

  // THE CONSTRAINT THIS PROJECT WAS GIVEN, AS AN ASSERTION.
  //
  // Pull quotes extracted from existing curriculum content, never
  // newly written. So every quote must appear verbatim in the lesson it
  // cites — which is also what stops an editor "improving" one later.
  const notFound = [...q.entries()].filter(([, v]) => !(bodiesOf(v.ref) || '').includes(v.quote));
  check('Every pull quote appears verbatim in the lesson it cites',
    notFound.length === 0, notFound.slice(0, 3).map(([k, v]) => `${k} → ${v.ref}`).join('; '));

  // Level I has none, and that is the rule holding rather than a gap:
  // its prompts are instructions with a question inside them, written
  // for learners with a few hundred words of English. If quotes ever
  // appear there, the extraction has been loosened.
  const levelOne = [...q.keys()].filter((k) => k.startsWith('I.'));
  check('The extraction was not loosened until Level I qualified',
    levelOne.length === 0, levelOne.join(', '));

  const onPage = [...q.values()].filter((v) => !text.includes(v.quote.slice(0, 40)));
  check('Every pull quote reaches the page', onPage.length === 0, onPage.length);
}

// --- The rasterised figures and plates ---------------------------------
{
  const dir = `${ROOT}/publication/fig`;
  const manifest = `${dir}/figures.json`;
  check('The figure manifest exists for the editable edition', existsSync(manifest));
  if (existsSync(manifest)) {
    const { figures, plates } = JSON.parse(readFileSync(manifest, 'utf8'));
    const missing = figures.filter((f) => !existsSync(`${dir}/${f.slug}.png`));
    check(`All ${figures.length} figures are rasterised`, missing.length === 0,
      missing.map((f) => f.slug).join(', '));
    check(`All ${plates.length} level plates are rasterised`,
      plates.length === 6 && plates.every((p) => existsSync(`${dir}/${p.file}`)));

    // THE SIZE FLOOR, AND WHY IT IS HERE.
    //
    // The plates are rendered through the print edition's duotone
    // filter in a headless browser. The first attempt used setContent()
    // with a <base href>, which gives the page an about:blank origin,
    // so the photographs never loaded and all six were written as flat
    // rectangles in their level's ink — with a two-pixel broken-image
    // glyph in one corner. In the editable edition they would have read
    // as deliberate colour fields.
    //
    // A flat fill compresses to about 9 KB at this size. A photograph
    // cannot: the smallest of the six is 87 KB. Forty is comfortably
    // between the two and does not need updating when a plate changes.
    const flat = plates.filter((p) => {
      const { size } = statSync(`${dir}/${p.file}`);
      return size < 40 * 1024;
    });
    check('No plate was written as a flat rectangle', flat.length === 0,
      flat.map((p) => `${p.file} ${Math.round(statSync(`${dir}/${p.file}`).size / 1024)}KB`).join(', '));
  }
}

function bodiesOf(ref) {
  for (const lv of C.levels) {
    for (const m of lv.modules) {
      for (const i of m.lessons) {
        if (`${lv.roman}.${m.sequence}.${i.sequence}` === ref) return i.body;
      }
    }
  }
  return null;
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
