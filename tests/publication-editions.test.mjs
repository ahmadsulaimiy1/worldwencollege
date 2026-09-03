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
import { readFileSync, existsSync } from 'node:fs';
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
// this builds the ones that are not the default before measuring them.
const SRC = {
  teacher: `${ROOT}/publication/.flagship.html`,
  student: `${ROOT}/publication/.student.html`,
  institutional: `${ROOT}/publication/.institutional.html`,
};

// ─────────────────────────────────────────────────────────────────────
// ABSENT IS NOT THE ONLY WAY A STAGED EDITION IS WRONG
// ─────────────────────────────────────────────────────────────────────
// This rebuilt an edition only when its file did not exist. A file that
// exists and is OLD was measured as though it were current — and on a
// machine carrying a five-day-old staging, that is exactly what
// happened: the suite reported 104 passages present in the teacher's
// edition and missing from the student's. Every one of them was in
// both. The student edition on disk simply predated them.
//
// A test that passes while measuring the wrong surface is the failure
// this repository is built to catch, and it had grown one of its own.
//
// MEASURED BY CONTENT, NOT BY TIMESTAMP. Every staged edition prints
// the content digest it was rendered from — publicationIdentity()
// computes it over the curriculum itself, and covers.mjs sets it in the
// identity table. Comparing digests is exact and deterministic; a
// comparison of file times would rebuild all three on any fresh clone,
// where git gives every file the same checkout minute.
const { publicationIdentity } = await import(loadUrl('scripts/publication/identity.mjs'));
const DIGEST = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 }).contentDigest;

const stale = (f) => !existsSync(f) || !readFileSync(f, 'utf8').includes(DIGEST);

const render = (edition) => execFileSync(
  'node', ['--experimental-sqlite', 'scripts/publication/render-flagship.mjs'],
  { cwd: ROOT, env: { ...process.env, IEFC_EDITION: edition }, stdio: 'ignore' },
);

for (const key of ['teacher', 'student', 'institutional']) {
  if (!stale(SRC[key])) continue;
  console.log(`NOTE the ${key} edition on disk was not rendered from this curriculum — restaging it.`);
  render(key);
}
if (!existsSync(SRC.teacher)) {
  console.log('FAIL The print source does not exist — run: npm run curriculum');
  process.exit(1);
}
// The rebuild is the remedy, not the finding. If an edition is STILL
// not the current curriculum after being re-rendered, the renderer and
// the curriculum disagree and every assertion below is measuring
// something nobody can reproduce.
for (const key of ['teacher', 'student', 'institutional']) {
  check(`The ${key} edition on disk was rendered from this curriculum`,
    !stale(SRC[key]), `expected digest ${DIGEST.slice(0, 16)}…`);
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
