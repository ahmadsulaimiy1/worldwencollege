// The complete-curriculum editions.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   Every word of every authored lesson reaches the page.
//
// The first edition of this publication described the curriculum while
// ninety-three thousand words of lesson content sat in the database
// unprinted. The correction was to typeset all of it — and typesetting
// means parsing, which means a parser that can silently drop a stage,
// a dialogue turn or an answer key and leave a book that still looks
// complete.
//
// So this file does not check that the file is big. It walks every
// lesson in the database and asserts its content is present in what was
// actually rendered.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ROOT, loadUrl } from './helpers.mjs';

const { buildCurriculum } = await import(loadUrl('scripts/publication/curriculum.mjs'));
const C = buildCurriculum();

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const PDF_HTML = `${ROOT}/publication/.flagship.html`;
const DOCX = `${ROOT}/publication/IEFC Complete Curriculum.docx`;
const PDF = `${ROOT}/publication/IEFC Complete Curriculum.pdf`;

for (const [name, p] of [['print', PDF], ['editable', DOCX], ['print source', PDF_HTML]]) {
  check(`The ${name} edition exists`, existsSync(p), p);
}
if (![PDF, DOCX, PDF_HTML].every(existsSync)) {
  console.log('\nRun: npm run curriculum');
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}

// Normalise the way each renderer transforms text, so a comparison
// measures CONTENT and not punctuation policy. Both apply typographic
// dashes and quotes; the database holds plain ASCII.
const norm = (s) => String(s)
  .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"')
  .replace(/[—–]/g, '-').replace(/-{2,}/g, '-')
  .replace(/\s+/g, ' ')
  .toLowerCase().trim();

function htmlText(file) {
  return norm(readFileSync(file, 'utf8')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<head[\s\S]*?<\/head>/g, '')
    .replace(/<[^>]+>/g, ' '));
}
function docxText(file) {
  const xml = execFileSync('unzip', ['-p', file, 'word/document.xml'],
    { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' });
  // Decode XML entities before normalising. Omitting this reported 826
  // of 2233 stages as missing from the editable edition — every stage
  // containing an apostrophe, because the XML holds `&apos;`. The
  // content was present throughout; the extractor was reading it wrong,
  // and the failure looked exactly like a renderer dropping content.
  // `&amp;` is decoded LAST, or `&amp;apos;` would become an apostrophe.
  const raw = [...xml.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join(' ');
  return norm(raw
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&'));
}

const printText = htmlText(PDF_HTML);
const editText = docxText(DOCX);

check('The print edition carries the curriculum', printText.length > 400000, printText.length);
check('The editable edition carries the curriculum', editText.length > 400000, editText.length);

// --- Structure --------------------------------------------------------
{
  const missingL = C.levels.filter((l) => !printText.includes(norm(l.name)));
  check('Every level appears in the print edition', missingL.length === 0,
    missingL.map((l) => l.roman).join(','));

  const mods = C.levels.flatMap((l) => l.modules);
  const missingM = mods.filter((m) => !printText.includes(norm(m.title)));
  check(`All ${mods.length} module titles appear`, missingM.length === 0,
    missingM.slice(0, 3).map((m) => m.title).join('; '));

  const lessons = mods.flatMap((m) => m.lessons);
  const missingT = lessons.filter((x) => !printText.includes(norm(x.title)));
  check(`All ${lessons.length} item titles appear`, missingT.length === 0,
    missingT.slice(0, 3).map((x) => x.title).join('; '));
}

// --- THE ASSERTION THIS FILE EXISTS FOR -------------------------------
{
  // Every stage of every lesson, checked as the renderer actually
  // structures it: the HEAD is set as a heading and the TEXT flows
  // beneath it, so they are never contiguous on the page.
  //
  // The first version of this check took fourteen contiguous words from
  // the raw database body — which begins "LEARNING OBJECTIVES: By the
  // end..." — and reported 216 of 234 lessons as missing. Nothing was
  // missing. The probe was demanding a string the design deliberately
  // splits, and had it been believed it would have sent me hunting a
  // parser bug that did not exist. Checking heads and bodies separately
  // is both correct and stricter: it covers every stage, not a sample.
  const lessons = C.levels.flatMap((l) => l.modules).flatMap((m) => m.lessons);
  const stages = lessons.flatMap((x) => x.stages.map((s) => ({ lesson: x, stage: s })));

  const partText = (s) => s.parts.map((p) => p.text).join(' ');
  const probe = (text, n = 12) => {
    const w = norm(text).split(' ').filter(Boolean);
    return w.length <= n ? w.join(' ') : w.slice(0, n).join(' ');
  };

  for (const [edition, body] of [['print', printText], ['editable', editText]]) {
    const missingHead = stages.filter(({ stage }) => stage.head && !body.includes(norm(stage.head)));
    check(`Every lesson stage heading reaches the ${edition} edition`,
      missingHead.length === 0,
      `${missingHead.length} of ${stages.length}: ${missingHead.slice(0, 2).map((x) => x.stage.head).join('; ')}`);

    // Checked PER PART, not per stage. Each part — a paragraph of
    // prose, one dialogue turn, one numbered item — is rendered as a
    // contiguous run of text; a stage is not, because the design puts a
    // speaker label between dialogue turns and a marker before each
    // item. Probing across parts reported two stages missing when the
    // only thing between the words was an "A" the design put there on
    // purpose. Per part is both correct and stricter: it checks every
    // paragraph in the book rather than the first twelve words of each
    // stage.
    const parts = stages.flatMap(({ stage }) => stage.parts.map((p) => ({ stage, p })));
    const missingBody = parts.filter(({ p }) =>
      norm(p.text).length > 25 && !body.includes(probe(p.text)));
    check(`...and every paragraph of every stage reaches the ${edition} edition`,
      missingBody.length === 0,
      `${missingBody.length} of ${parts.length}, first: "${
        missingBody[0] ? probe(missingBody[0].p.text).slice(0, 70) : ''}"`);

    // The tail as well as the head, so a renderer that truncated a long
    // paragraph would be caught.
    const missingTail = parts.filter(({ p }) => {
      const w = norm(p.text).split(' ').filter(Boolean);
      if (w.length < 20) return false;
      return !body.includes(w.slice(-10).join(' '));
    });
    check(`...including the closing words of every paragraph`, missingTail.length === 0,
      `${missingTail.length} of ${parts.length}`);
  }
  check(`Checked across all ${stages.length} stages of ${lessons.length} items`,
    stages.length > 1800 && lessons.length === 294, `${stages.length} / ${lessons.length}`);
}

// --- Assessment: questions, options and answer keys --------------------
{
  const qs = C.levels.flatMap((l) => l.modules).flatMap((m) => m.lessons).flatMap((x) => x.questions);
  check(`The curriculum holds ${qs.length} assessment questions`, qs.length === 660, qs.length);

  const missingQ = qs.filter((q) => !printText.includes(norm(q.prompt)));
  check('Every question prompt is printed', missingQ.length === 0,
    `${missingQ.length} missing, first: "${missingQ[0] ? missingQ[0].prompt.slice(0, 60) : ''}"`);

  const choices = qs.flatMap((q) => q.choices);
  const missingC = choices.filter((c) => String(c).length > 3 && !printText.includes(norm(c)));
  check(`All ${choices.length} answer options are printed`, missingC.length === 0,
    `${missingC.length} missing, first: "${missingC[0] || ''}"`);

  // A quiz without its key is a quiz a teacher cannot mark from the
  // book — the whole point of a teacher's edition.
  // Counted structurally. A phrase count reports 63, because the
  // How to Read a Lesson section legitimately mentions answer keys in
  // prose — a count that includes the sentence describing the feature
  // is not a count of the feature.
  const keyBlocks = (readFileSync(PDF_HTML, 'utf8').match(/class="answerkey"/g) || []).length;
  check('Every quiz prints an answer key', keyBlocks === 60, `${keyBlocks} blocks for 60 quizzes`);
  const quizzes = C.levels.flatMap((l) => l.modules).flatMap((m) => m.lessons)
    .filter((x) => x.kind === 'quiz');
  check('...one for each of the sixty assessed quizzes', quizzes.length === 60, quizzes.length);
  check('...and the editable edition carries them too',
    (editText.match(/answer key/g) || []).length >= 60,
    (editText.match(/answer key/g) || []).length);
}

// --- The teaching apparatus survived parsing --------------------------
{
  // Stages, dialogue and numbered items are what make this teachable
  // rather than readable. A parser regression that flattened them would
  // leave every word present and the book useless, so they are counted.
  const stages = C.levels.flatMap((l) => l.modules).flatMap((m) => m.lessons)
    .flatMap((x) => x.stages).filter((s) => s.head);
  check(`The curriculum parses into ${stages.length} named lesson stages`,
    stages.length > 1500, stages.length);

  const timed = stages.filter((s) => s.timing);
  check('...of which the timed stages carry their timings', timed.length > 400, timed.length);
  const missingTiming = timed.filter((s) => !printText.includes(norm(s.timing)));
  check('...and every timing is printed', missingTiming.length === 0, missingTiming.length);

  const dialogue = C.levels.flatMap((l) => l.modules).flatMap((m) => m.lessons)
    .flatMap((x) => x.stages).flatMap((s) => s.parts).filter((p) => p.type === 'dialogue');
  check('Model dialogue is parsed as dialogue, not prose', dialogue.length >= 13, dialogue.length);
  const missingD = dialogue.filter((p) => !printText.includes(norm(p.text)));
  check('...and every turn is printed', missingD.length === 0, missingD.length);

  const items = C.levels.flatMap((l) => l.modules).flatMap((m) => m.lessons)
    .flatMap((x) => x.stages).flatMap((s) => s.parts).filter((p) => p.type === 'item');
  check('Numbered practice items are parsed as items', items.length > 150, items.length);
}

// --- Honesty ----------------------------------------------------------
{
  check('The edition states the counted number of items, not the published claim',
    printText.includes(`will find ${C.totals.lessons}`), String(C.totals.lessons));
  check('...and says plainly that the 720 figure is not met',
    /that figure is not met/.test(printText));
  check('The College is not described as accredited',
    /makes no claim of\s+accreditation|makes no claim of accreditation/.test(printText));
  check('No officer is named',
    !/(president|dean|professor)\s+[a-z]+\s+[a-z]+,/.test(printText),
    (printText.match(/(president|dean|professor)\s+[a-z]+\s+[a-z]+,/g) || []).slice(0, 2).join('; '));
}

{
  const size = statSync(PDF).size;
  check('The print edition is a book, not a pamphlet', size > 2 * 1024 * 1024,
    `${(size / 1024 / 1024).toFixed(1)} MB`);
  check('...and is a valid PDF', readFileSync(PDF).subarray(0, 5).toString('latin1') === '%PDF-');
  check('The editable edition is substantial',
    statSync(DOCX).size > 200 * 1024, `${Math.round(statSync(DOCX).size / 1024)} KB`);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
