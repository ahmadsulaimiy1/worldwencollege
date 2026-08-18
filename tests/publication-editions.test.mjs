// The three editions, built from one source.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   Each edition gives its reader exactly what that reader should have,
//   and the curriculum underneath them is the same curriculum.
//
// Editioning a book by subtraction is the cheap way and the dangerous
// one. Two failure modes matter and neither announces itself:
//
//   THE STUDENT EDITION STILL GIVES THE ANSWERS. Suppressing the
//     printed answer key while leaving the correct option in bold is a
//     one-line oversight that hands over every answer in the book. The
//     page looks right. The quiz is worthless.
//
//   THE EDITIONS DRIFT. Three renderers, or three copies of a template,
//     and within one revision the student edition is teaching something
//     the teacher's edition does not. They are built from one source
//     precisely so that cannot happen, and the way to know the source is
//     still shared is to check that the curriculum text is identical.
//
// WHAT THIS FILE DOES NOT MEASURE: whether the institutional edition is
// persuasive to a ministry. That is a judgement, not an assertion.
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { ROOT, loadUrl } from './helpers.mjs';

const { buildCurriculum } = await import(loadUrl('scripts/publication/curriculum.mjs'));
const C = buildCurriculum();

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// The editions are rendered on demand rather than kept in the tree, so
// this builds the two that are not the default before measuring them.
//
// It rebuilds them every run, and the reason is a defect this file
// actually had. The loop below used to read `if (existsSync(...))
// continue;` — reuse whatever is on disk. On CI, where the tree is
// clean, that always rendered fresh and the file passed. On a working
// machine it compared a fortnight-old student edition against a
// teacher's edition rendered minutes ago, and duly reported that five
// curriculum passages had gone missing from the student's book. Nothing
// had gone missing; the College had been renamed in between, and the
// stale artefact still carried the old name.
//
// The failure was harmless. What it revealed was not: this file claims
// to measure whether the three editions are built from one source, and
// it was measuring whatever happened to be lying in the directory. A
// renderer could have been broken for a fortnight without this noticing,
// so long as nobody deleted the output. Measuring the renderer is the
// entire point of the file.
//
// Both are rendered IEFC_HTML_ONLY, which stops after the text block.
// Everything this file measures is in the HTML, and printing the books
// as well would both cost seventy seconds and rewrite the institutional
// edition's committed PDF and cover on every run — a test suite that
// dirties the working tree.
const SRC = {
  teacher: `${ROOT}/publication/.flagship.html`,
  student: `${ROOT}/publication/.student.html`,
  institutional: `${ROOT}/publication/.institutional.html`,
};
if (!existsSync(SRC.teacher)) {
  console.log('FAIL The print source does not exist — run: npm run curriculum');
  process.exit(1);
}
for (const key of ['student', 'institutional']) {
  rmSync(SRC[key], { force: true });
  execFileSync('node', ['--experimental-sqlite', 'scripts/publication/render-flagship.mjs'],
    { cwd: ROOT, env: { ...process.env, IEFC_EDITION: key, IEFC_HTML_ONLY: '1' }, stdio: 'ignore' });
  if (!existsSync(SRC[key])) {
    console.log(`FAIL The ${key} edition did not render`);
    process.exit(1);
  }
}

const text = (f) => readFileSync(f, 'utf8')
  .replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
const raw = Object.fromEntries(Object.entries(SRC).map(([k, v]) => [k, readFileSync(v, 'utf8')]));
const txt = Object.fromEntries(Object.entries(SRC).map(([k, v]) => [k, text(v)]));

// --- Every edition exists and names itself -----------------------------
for (const [key, name] of [['teacher', "Teacher's Edition"], ['student', 'Student Edition'],
  ['institutional', 'Institutional Edition']]) {
  // The apostrophe is typeset as a curly one, and `text()` normalises it
  // back before comparing.
  check(`The ${key} edition builds and names itself on the contents page`,
    txt[key].includes(name), name);
}

// --- The student edition withholds the answers, and only those ---------
{
  // The printed key.
  check('The teacher’s edition prints its answer keys',
    (raw.teacher.match(/class="answerkey"/g) || []).length === 60,
    (raw.teacher.match(/class="answerkey"/g) || []).length);
  check('The student edition prints none',
    !raw.student.includes('class="answerkey"'));

  // THE ONE THAT MATTERS. The correct option is marked with a class in
  // the teacher's edition. Suppressing the key block while leaving that
  // marker would give every answer away in bold and look correct.
  const teacherMarks = (raw.teacher.match(/class="is-key"/g) || []).length;
  check(`The teacher’s edition marks all ${teacherMarks} correct options`,
    teacherMarks === C.totals.questions, `${teacherMarks} of ${C.totals.questions}`);
  // Matched as the attribute, not the bare string: the stylesheet
  // declares a `.is-key` rule in every edition and searching for the
  // name alone reported a defect that was not there.
  check('The student edition marks none of them',
    !raw.student.includes('class="is-key"'));

  // And it must still contain every question, or suppression became
  // deletion.
  const qs = (s) => (s.match(/class="q__p"/g) || []).length;
  check('...while still carrying every question',
    qs(raw.student) === qs(raw.teacher) && qs(raw.student) === C.totals.questions,
    `${qs(raw.student)} vs ${qs(raw.teacher)}`);

  // The rubrics stay. A learner is entitled to the criteria they are
  // marked against; removing them would be a pedagogical decision
  // disguised as an editorial one.
  const rubrics = (s) => (s.match(/<table class="rubric"/g) || []).length;
  check('Every grading rubric is in the student edition too',
    rubrics(raw.student) === rubrics(raw.teacher) && rubrics(raw.student) === 60,
    `${rubrics(raw.student)} vs ${rubrics(raw.teacher)}`);

  // The teacher's guide is addressed to somebody else.
  // Checked against the section heading, not any mention of its title:
  // the colophon's photographic credits name the section a band is
  // placed at, and those credits are themselves filtered by edition.
  const guideHeading = (s) => /For the teacher\s+Teaching from This Book/.test(s);
  check('The teaching guide is in the teacher’s edition only',
    guideHeading(txt.teacher) && !guideHeading(txt.student));
  check('...and the student edition does not credit a photograph placed in it',
    !txt.student.includes('Teaching from This Book'));
}

// --- The editions have not drifted -------------------------------------
{
  // Every lesson body must appear verbatim in both full editions. This
  // is the check that they are one book.
  const norm = (s) => String(s).replace(/\s+/g, ' ').replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"').replace(/[—–]/g, '-').replace(/-{2,}/g, '-').toLowerCase().trim();
  const t = norm(txt.teacher); const st = norm(txt.student);
  const items = C.levels.flatMap((lv) => lv.modules.flatMap((m) => m.lessons));
  let missing = 0; let firstMissing = null;
  for (const it of items) {
    for (const chunk of (it.body || '').split(/\n\s*\n/).map(norm).filter((c) => c.length > 60)) {
      if (t.includes(chunk) && !st.includes(chunk)) {
        missing++;
        if (!firstMissing) firstMissing = chunk.slice(0, 70);
      }
    }
  }
  check('No curriculum text is in the teacher’s edition but missing from the student’s',
    missing === 0, `${missing} passages, first: "${firstMissing}"`);
}

// --- The institutional edition is the architecture, not the content ----
{
  check('The institutional edition carries the measured figures',
    txt.institutional.includes('The Shape of the Programme')
    && txt.institutional.includes('The assessment map'));
  check('...and the awards, the glossary and the assessment index',
    txt.institutional.includes('The Six Awards')
    && txt.institutional.includes('Glossary of Programme Terminology')
    && txt.institutional.includes('Assessment Index'));
  check('...and every level’s own contents',
    C.levels.every((lv) => txt.institutional.includes('The ten modules of this level'))
    && C.levels.every((lv) => txt.institutional.includes(lv.name)));

  // It must NOT carry the lesson bodies — that is the whole point of it.
  const lessons = (s) => (s.match(/<article class="lesson/g) || []).length;
  check('It carries no lesson bodies', lessons(raw.institutional) === 0,
    lessons(raw.institutional));
  check('...so it is a short book', txt.institutional.length < txt.teacher.length / 4,
    `${Math.round(txt.institutional.length / 1000)}k vs ${Math.round(txt.teacher.length / 1000)}k chars`);

  // THE FINDING TRAVELS. An executive volume that quietly drops the
  // unflattering figure would be a prospectus, not an edition.
  check('The empty competency column is printed in the institutional edition too',
    /0 of 120 assessments mapped/.test(raw.institutional)
    && txt.institutional.includes('None of the'));
  check('...and so is the statement that the College is not accredited',
    /not an accredited institution/i.test(txt.institutional));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
