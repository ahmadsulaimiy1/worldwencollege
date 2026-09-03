// THE LEVEL EXAMINATION — the sitting, the two readers, and the release.
//
// This file guards three different kinds of claim, and they need
// different kinds of test:
//
//   1 · THE TRANSCRIPTION. Every figure in
//       functions/_lib/academic/examinations.js is copied from a page
//       the College publishes. The first section reads the BUILT HTML
//       of those pages and fails the build if a constant and the
//       sentence a learner reads ever disagree. That is the same
//       arrangement tests/academic-standing.test.mjs has with
//       data/academic-regulations.json, and it exists for the same
//       reason: an unpinned transcription is a second source of truth
//       waiting to contradict the first.
//
//   2 · THE PUBLISHED PROCEDURE, ENFORCED. The tolerance, the two
//       absolute cases, the third reader, the resit interval, the
//       three-sittings cap, the twice-a-level set-aside, the four
//       lateness bands and the three void reasons are each driven
//       through the library and asserted on the outcome — not on the
//       code that implements them.
//
//   3 · THE CHAIN THAT WAS BROKEN. The whole point of migration 023 is
//       that no learner could ever hold a level mark, an honour, a
//       grade point or a graduation. The last section runs a candidate
//       from an empty database to a conferred-eligible position through
//       the real standing engine, and fails if any link in that chain
//       is still null.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const X = await import(loadUrl('functions/_lib/academic/examinations.js'));
const { computeLearnerStanding } = await import(loadUrl('functions/_lib/academic/standing.js'));
const { SCALE, HONOURS } = await import(loadUrl('functions/_lib/academic/marks.js'));
const { ValidationError } = await import(loadUrl('functions/_lib/db.js'));

let pass = 0; let fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const run = (sql, ...a) => db.prepare(sql).bind(...a).run();

async function refuses(label, fn, field) {
  try {
    await fn();
    check(label, false, 'it was allowed');
  } catch (err) {
    const named = field === undefined
      || (err.fields && Object.keys(err.fields).includes(field))
      || (err.fields && Object.values(err.fields).includes(field))
      || String(err.message).includes(field);
    check(label, err instanceof ValidationError && named, `${err.name}: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 1 · THE TRANSCRIPTION IS PINNED TO THE PUBLISHED PAGES
// ═══════════════════════════════════════════════════════════════════

const examPage = readFileSync(path.join(ROOT, 'students/examinations/index.html'), 'utf8');
const handbook = readFileSync(path.join(ROOT, 'academics/tutor-handbook/index.html'), 'utf8');
const flat = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ')
  .replace(/&rsquo;/g, '’').replace(/&ldquo;|&rdquo;/g, '"').replace(/\s+/g, ' ');
const exam = flat(examPage);
const marking = flat(handbook);

check('The window is ten working days on the page and in the code',
  X.WINDOW_WORKING_DAYS === 10 && /window stays open for ten working days/i.test(exam),
  String(X.WINDOW_WORKING_DAYS));
check('The paper runs three hours on the page and in the code',
  X.DURATION_MINUTES === 180 && /runs for three hours from the moment you open it/i.test(exam),
  String(X.DURATION_MINUTES));
check('The spoken component is fifteen minutes on the page and in the code',
  X.SPOKEN_MINUTES === 15 && /at least fifteen minutes/i.test(exam),
  String(X.SPOKEN_MINUTES));
check('A break resumes within sixty minutes on the page and in the code',
  X.RESUME_MINUTES === 60 && /within sixty minutes of a break resumes/i.test(exam),
  String(X.RESUME_MINUTES));
check('Two attempts a level are set aside on the word alone, on the page and in the code',
  X.SET_ASIDE_ON_ELECTION === 2 && /Two attempts a level are set aside this way without evidence/i.test(exam),
  String(X.SET_ASIDE_ON_ELECTION));
check('The result is released on working day fifteen, on the page and in the code',
  X.RELEASE_WORKING_DAY === 15 && /Level examination\s*Working day 15/i.test(exam),
  String(X.RELEASE_WORKING_DAY));
check('Moderation closes within five working days, on the page and in the code',
  X.MODERATION_WORKING_DAYS === 5 && /within\s*five working days of release/i.test(exam),
  String(X.MODERATION_WORKING_DAYS));
check('Two resits, so three sittings, on the page and in the code',
  X.MAX_SITTINGS === 3 && /Two resits for every summative assessment/i.test(exam),
  String(X.MAX_SITTINGS));
check('Fourteen days between attempts, on the page and in the code',
  X.RESIT_INTERVAL_DAYS === 14 && /Fourteen days between attempts/i.test(exam),
  String(X.RESIT_INTERVAL_DAYS));
check('The tolerance is three points, in the handbook and in the code',
  X.TOLERANCE_POINTS === 3 && /within three percentage points, the first stands/i.test(marking),
  String(X.TOLERANCE_POINTS));
check('A reconciliation has two working days, in the handbook and in the code',
  X.RECONCILIATION_WORKING_DAYS === 2 && /settles within two working days is recorded and released/i.test(marking),
  String(X.RECONCILIATION_WORKING_DAYS));
check('The third marker’s mark stands, in the handbook',
  /goes to a third marker, whose mark stands/i.test(marking));
check('The two absolute cases are published, in the handbook',
  /crossing an honours threshold or a skill floor is reconciled whatever its size/i.test(marking));
check('The four lateness bands are the four the page publishes',
  X.LATENESS_BANDS.length === 4
  && /Within the deadline/.test(exam) && /Under 24 hours late/.test(exam)
  && /One to five working days late/.test(exam) && /More than five working days late/.test(exam),
  X.LATENESS_BANDS.map((b) => b.id).join(', '));
check('The three things that end an attempt are the three in the code',
  Object.keys(X.VOID_REASONS).length === 3 && /Three things, and only three/i.test(exam),
  Object.keys(X.VOID_REASONS).join(', '));
check('The examination floor is the fifty the regulations publish',
  X.EXAMINATION_FLOOR === 50);
check('Every lateness band carries an Arabic label and an Arabic effect',
  X.LATENESS_BANDS.every((b) => b.labelAr && b.effectAr));
check('Every void and set-aside reason carries an Arabic label',
  Object.values(X.VOID_REASONS).every((r) => r.labelAr)
  && Object.values(X.SET_ASIDE_REASONS).every((r) => r.labelAr));

// The instrument and the page must not disagree about the resit rules.
const regs = JSON.parse(readFileSync(path.join(ROOT, 'data/academic-regulations.json'), 'utf8'));
check('The resit interval in the code is the interval the instrument adopts',
  regs.reassessment.minimum_interval_days.value === X.RESIT_INTERVAL_DAYS,
  `${regs.reassessment.minimum_interval_days.value} vs ${X.RESIT_INTERVAL_DAYS}`);
check('The sitting cap in the code is the cap the instrument adopts',
  regs.reassessment.attempts_per_assessment.total_attempts === X.MAX_SITTINGS,
  `${regs.reassessment.attempts_per_assessment.total_attempts} vs ${X.MAX_SITTINGS} sittings`);

// The Arabic edition of the procedure is served, not translated at read
// time — a page that had to translate would translate differently on
// each render.
const arProcedure = X.publishedProcedure('ar');
check('The published procedure answers in Arabic',
  arProcedure.statements.every((s) => /[؀-ۿ]/.test(s)), arProcedure.statements[0]);
check('...and in English', X.publishedProcedure('en').statements.every((s) => !/[؀-ۿ]/.test(s)));
check('...with the same figures in both', arProcedure.tolerancePoints === X.publishedProcedure('en').tolerancePoints);

// ═══════════════════════════════════════════════════════════════════
// FIXTURES
// ═══════════════════════════════════════════════════════════════════

const users = [
  ['usr_cand', 'student', 'Nadia'],
  ['usr_cand2', 'student', 'Omar'],
  ['usr_first', 'staff', 'First Marker'],
  ['usr_second', 'staff', 'Second Marker'],
  ['usr_third', 'staff', 'Third Marker'],
  ['usr_admin', 'admin', 'The Registrar'],
];
for (const [id, role, name] of users) {
  await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
             VALUES (?, 'clerk', ?, ?, ?, ?)`, id, `sub_${id}`, `${id}@example.com`, role, name);
}
const admin = { id: 'usr_admin', role: 'admin' };
const first = { id: 'usr_first', role: 'staff' };
const second = { id: 'usr_second', role: 'staff' };
const third = { id: 'usr_third', role: 'staff' };

await run(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
           VALUES ('enr_1','usr_cand',NULL,1,'active','2026-05-01T00:00:00Z')`);
await run(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
           VALUES ('enr_2','usr_cand2',NULL,1,'active','2026-05-01T00:00:00Z')`);

// A rubric with the four skills covered, one of them spoken.
const rubric = [
  { code: 'LIS', name: 'Listening', descriptor: 'Understands speech at natural pace.', weight: 0.25, skillId: 'skl_listening' },
  { code: 'REA', name: 'Reading', descriptor: 'Reads for argument and detail.', weight: 0.25, skillId: 'skl_reading' },
  { code: 'SPK', name: 'Speaking', descriptor: 'Speaks with control, in real time.', weight: 0.25, skillId: 'skl_speaking', spoken: true },
  { code: 'WRI', name: 'Writing', descriptor: 'Writes to a purpose and an audience.', weight: 0.25, skillId: 'skl_writing' },
];

// ═══════════════════════════════════════════════════════════════════
// 2 · THE PAPER
// ═══════════════════════════════════════════════════════════════════

check('With no paper published, there is nothing to sit',
  (await X.publishedPaperFor(env, 1)) === null);

await refuses('A paper with no criteria is refused — a paper is its rubric',
  () => X.authorPaper(env, {
    actor: admin, levelId: 1, title: 'Level I', conditions: 'Open book.', criteria: [],
  }), 'criteria');

const badWeights = await X.authorPaper(env, {
  actor: admin, levelId: 1, title: 'Weights that do not sum', conditions: 'Open book.',
  criteria: rubric.map((c, i) => ({ ...c, weight: i === 0 ? 0.4 : 0.25 })),
});
await refuses('A rubric whose weights do not sum to 1 cannot be published',
  () => X.publishPaper(env, { actor: admin, paperId: badWeights.id }), 'criteria');

const noSpeaking = await X.authorPaper(env, {
  actor: admin, levelId: 2, title: 'Three skills only', conditions: 'Open book.',
  criteria: [
    { code: 'LIS', name: 'Listening', descriptor: 'x', weight: 0.34, skillId: 'skl_listening' },
    { code: 'REA', name: 'Reading', descriptor: 'x', weight: 0.33, skillId: 'skl_reading' },
    { code: 'WRI', name: 'Writing', descriptor: 'x', weight: 0.33, skillId: 'skl_writing', spoken: true },
  ],
});
await refuses('A paper that measures three of the four skills cannot be published',
  () => X.publishPaper(env, { actor: admin, paperId: noSpeaking.id }), 'criteria');

const noSpoken = await X.authorPaper(env, {
  actor: admin, levelId: 3, title: 'No spoken criterion', conditions: 'Open book.',
  criteria: rubric.map((c) => ({ ...c, spoken: false })),
});
await refuses('A paper with no spoken criterion cannot be published — the gate would read nothing',
  () => X.publishPaper(env, { actor: admin, paperId: noSpoken.id }), 'criteria');

const draft = await X.authorPaper(env, {
  actor: admin, levelId: 1,
  title: 'Level I Examination', titleAr: 'امتحان المستوى الأول',
  conditions: 'Open book. Three hours from the moment you open it. The spoken paper is closed.',
  conditionsAr: 'كتاب مفتوح. ثلاث ساعات من لحظة فتح الورقة. الورقة الشفوية مغلقة.',
  criteria: rubric,
});
check('A paper is authored as a draft', draft.status === 'draft', draft.status);
check('...and a draft is not the paper a candidate would sit',
  (await X.publishedPaperFor(env, 1)) === null);
check('...and it carries its rubric', draft.criteria.length === 4, String(draft.criteria.length));

const paper = await X.publishPaper(env, { actor: admin, paperId: draft.id });
check('Publishing a draft makes it the paper for that level',
  paper.status === 'published' && (await X.publishedPaperFor(env, 1)).id === paper.id);
check('...and stamps the date the whole marking claim rests on',
  /^\d{4}-\d{2}-\d{2}$/.test(paper.rubricPublishedOn), paper.rubricPublishedOn);
check('...and records who published it',
  (await db.prepare('SELECT published_by FROM examination_papers WHERE id = ?').bind(paper.id).first()).published_by === 'usr_admin');

const v2draft = await X.authorPaper(env, {
  actor: admin, levelId: 1, title: 'Level I Examination, second cut', conditions: 'Open book.', criteria: rubric,
});
check('A re-cut rubric is a new version, not an edit',
  v2draft.version === draft.version + 1, `${draft.version} → ${v2draft.version}`);
await X.publishPaper(env, { actor: admin, paperId: v2draft.id });
const retired = await X.paperFor(env, paper.id);
check('...and publishing it retires the one before',
  retired.status === 'retired' && retired.retiredAt !== null, retired.status);
check('...leaving exactly one published paper for the level',
  (await db.prepare(`SELECT COUNT(*) AS n FROM examination_papers WHERE level_id = 1 AND status = 'published'`).bind().first()).n === 1);

const live = await X.paperFor(env, (await X.publishedPaperFor(env, 1)).id);

// ═══════════════════════════════════════════════════════════════════
// 3 · ENTRY, THE PAPER, AND THE CLOCK
// ═══════════════════════════════════════════════════════════════════

// The ten-module gate is read through the real standing engine, and
// this candidate has no modules at all, so it must refuse.
await refuses('A candidate with no completed modules cannot be entered',
  () => X.enterCandidate(env, { actor: admin, userId: 'usr_cand', levelId: 1 }),
  'level.gate.modules_complete');

// Ten modules, each with a quiz and an assignment, all marked well.
await run(`INSERT INTO courses (id, level_id, title) VALUES ('crs_x', 6, 'A course to hang modules on')
           ON CONFLICT DO NOTHING`);
const courseRow = await db.prepare('SELECT id FROM courses WHERE level_id = 1').bind().first();
const course = courseRow.id;
for (let i = 1; i <= 10; i++) {
  await run(`INSERT INTO units (id, course_id, sequence, title) VALUES (?, ?, ?, ?)`,
    `unt_${i}`, course, i, `Module ${i}`);
  await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 1, 'quiz', ?)`,
    `itq_${i}`, `unt_${i}`, `Quiz ${i}`);
  await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 2, 'assignment', ?)`,
    `ita_${i}`, `unt_${i}`, `Assignment ${i}`);
  await run(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at, attempt)
             VALUES (?, ?, 'usr_cand', '[]', 0.9, ?, 1)`, `qa_${i}`, `itq_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`);
  await run(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade, submitted_at, graded_at, attempt)
             VALUES (?, ?, 'usr_cand', 'graded', 0.86, ?, ?, 1)`,
    `as_${i}`, `ita_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`, `2026-06-1${i % 9}T09:00:00Z`);
}

const before = await computeLearnerStanding(env, 'usr_cand');
const beforeLevel = before.levels.find((l) => l.levelId === 1);
check('Before any examination, the ten modules are complete',
  beforeLevel.moduleSummary.complete === 10, String(beforeLevel.moduleSummary.complete));
check('...and the level mark is still null, because the examination is 60 per cent of it',
  beforeLevel.levelMark.mark === null && beforeLevel.levelMark.reasons.includes('examination_not_recorded'));
check('...and with a paper published and nothing sat, the examination gates are the LEARNER’s move',
  beforeLevel.graduation.conditions
    .filter((c) => c.id.startsWith('level.gate.examination') || c.id === 'level.gate.spoken_paper')
    .every((c) => c.met === null && c.owner === 'learner'),
  JSON.stringify(beforeLevel.graduation.conditions.filter((c) => c.id.startsWith('level.gate.exam')).map((c) => [c.owner, c.met])));

const sitting = await X.enterCandidate(env, {
  actor: admin, userId: 'usr_cand', levelId: 1, at: '2026-07-01T09:00:00Z',
});
check('A candidate with ten complete modules is entered', sitting.status === 'entered', sitting.status);
check('...for the first of three sittings', sitting.attempt === 1 && sitting.maxSittings === 3);
check('...with a reference to read aloud, unique to the sitting',
  /^WEC-L1-\d{8}-1[A-Z2-9]{4}$/.test(sitting.sittingReference), sitting.sittingReference);
check('...and a window ten working days long',
  sitting.window.opensOn === '2026-07-01' && sitting.window.closesOn === '2026-07-15',
  `${sitting.window.opensOn} → ${sitting.window.closesOn}`);
check('...against the paper that was published, not the one that was retired',
  sitting.paper.id === live.id);

const entryAgain = await X.enterCandidate(env, { actor: admin, userId: 'usr_cand', levelId: 1 });
check('Entering twice returns the same sitting rather than opening a second',
  entryAgain.id === sitting.id);

await refuses('A candidate cannot open somebody else’s paper',
  () => X.openPaper(env, { user: { id: 'usr_cand2' }, examinationId: sitting.id }), 'Not yours.');

const opened = await X.openPaper(env, { user: { id: 'usr_cand' }, examinationId: sitting.id, at: '2026-07-03T08:00:00Z' });
check('Opening the paper starts the three hours', opened.status === 'open' && opened.dueAt === '2026-07-03T11:00:00.000Z',
  opened.dueAt);
const reopened = await X.openPaper(env, { user: { id: 'usr_cand' }, examinationId: sitting.id, at: '2026-07-03T08:40:00Z' });
check('...and reopening it resumes rather than restarting the clock',
  reopened.dueAt === opened.dueAt, reopened.dueAt);

const submitted = await X.submitPaper(env, { user: { id: 'usr_cand' }, examinationId: sitting.id, at: '2026-07-03T10:30:00Z' });
check('Submitting inside the three hours is on time', submitted.lateness === 'on_time', submitted.lateness);

// ═══════════════════════════════════════════════════════════════════
// 4 · THE TWO READERS
// ═══════════════════════════════════════════════════════════════════

const criteria = live.criteria;
const marksAt = (values) => criteria.map((c, i) => ({ criterionId: c.id, mark: values[i], comment: 'Clear on the whole.' }));

await refuses('A second reading cannot land before a first',
  () => X.recordMarks(env, { actor: second, examinationId: sitting.id, role: 'second', marks: marksAt([80, 80, 80, 80]) }),
  'no_first_mark');

await refuses('A script is marked whole, never criterion by criterion',
  () => X.recordMarks(env, {
    actor: first, examinationId: sitting.id, role: 'first',
    marks: [{ criterionId: criteria[0].id, mark: 80 }],
  }));

const blind = await X.scriptForMarking(env, { staff: second, examinationId: sitting.id, role: 'second' });
check('A marker who has not marked sees no numbers at all', blind.marks.length === 0);
check('...and is told why, rather than shown an empty screen that reads as a bug',
  typeof blind.withheld === 'string' && blind.withheld.length > 20);
check('...but does see the rubric and its descriptors',
  blind.paper.criteria.length === 4 && blind.paper.criteria.every((c) => c.descriptor));

await X.recordMarks(env, { actor: first, examinationId: sitting.id, role: 'first', marks: marksAt([84, 86, 82, 88]) });

await refuses('The same person cannot be both readers',
  () => X.recordMarks(env, { actor: first, examinationId: sitting.id, role: 'second', marks: marksAt([84, 86, 82, 88]) }),
  'same_marker');

const afterFirst = await X.scriptForMarking(env, { staff: second, examinationId: sitting.id, role: 'second' });
check('A second marker still sees nothing after the first reading lands', afterFirst.marks.length === 0);

// Within the tolerance on every criterion, and in the same honour band.
const marked = await X.recordMarks(env, {
  actor: second, examinationId: sitting.id, role: 'second', marks: marksAt([85, 84, 84, 86]),
});
check('Two readings within three points open no reconciliation',
  marked.reconciliations.length === 0 && marked.status === 'marking', marked.status);
check('...and the first mark stands, exactly as the handbook says',
  marked.result.criteria.every((c) => c.basis === 'within_tolerance'),
  JSON.stringify(marked.result.criteria.map((c) => c.basis)));
check('...producing the weighted mean of the FIRST reading',
  marked.result.percentage === 85, String(marked.result.percentage));

const nowVisible = await X.scriptForMarking(env, { staff: second, examinationId: sitting.id });
check('Once a marker has marked, both readings are visible to them',
  nowVisible.marks.filter((m) => m.role === 'first').length === 4 && nowVisible.withheld === null);

// ═══════════════════════════════════════════════════════════════════
// 5 · RELEASE
// ═══════════════════════════════════════════════════════════════════

await refuses('A result cannot be released before the spoken paper is marked',
  () => X.release(env, { actor: admin, examinationId: sitting.id }), 'not_marked');

await run(`INSERT INTO learner_recordings (id, learning_item_id, user_id, media_url, attempt)
           VALUES ('rec_1','ita_1','usr_cand','https://example.invalid/a.webm', 1)`);
await run(`INSERT INTO learner_recordings (id, learning_item_id, user_id, media_url, attempt)
           VALUES ('rec_other','ita_1','usr_cand2','https://example.invalid/b.webm', 1)`);

await refuses('A recording belonging to another learner is refused',
  () => X.recordSpokenPaper(env, { actor: first, examinationId: sitting.id, recordingId: 'rec_other', passed: true }),
  'recordingId');

await X.recordSpokenPaper(env, { actor: first, examinationId: sitting.id, recordingId: 'rec_1', passed: true });
const released = await X.release(env, { actor: admin, examinationId: sitting.id });
check('A twice-read script with a passed spoken paper is released',
  released.status === 'released' && released.released.mark === 85, JSON.stringify(released.released));
check('...and is provisional until moderation closes', released.released.provisional === true);
const moderated = await X.closeModeration(env, { actor: admin, examinationId: sitting.id });
check('...and stops being provisional when it does', moderated.released.provisional === false);

// ═══════════════════════════════════════════════════════════════════
// 6 · THE CHAIN THAT WAS BROKEN, END TO END
// ═══════════════════════════════════════════════════════════════════

const after = await computeLearnerStanding(env, 'usr_cand');
const level = after.levels.find((l) => l.levelId === 1);

// coursework: quiz 90 × 0.3 + assignment 86 × 0.7 = 87.20 per module.
// level: 85 × 0.6 + 87.20 × 0.4 = 85.88.
check('A LEVEL MARK EXISTS, for the first time in the platform’s history',
  level.levelMark.mark === 85.88, JSON.stringify(level.levelMark));
check('...composed 60 examination / 40 coursework',
  level.levelMark.examinationMark === 85 && level.levelMark.coursework.mean === 87.2,
  `${level.levelMark.examinationMark} / ${level.levelMark.coursework.mean}`);
check('The four examination gates are now judged rather than "recorded nowhere"',
  level.graduation.conditions
    .filter((c) => c.id.startsWith('level.gate.examination') || c.id === 'level.gate.spoken_paper')
    .every((c) => c.met === true),
  JSON.stringify(level.graduation.conditions.filter((c) => c.id.startsWith('level.gate.exam')).map((c) => [c.id, c.met])));
check('The four skill sub-marks come off the paper’s own criteria',
  level.examination.released.skills.skl_listening === 84
  && level.examination.released.skills.skl_writing === 88,
  JSON.stringify(level.examination.released.skills));
check('The failed-examination standing trigger is instrumented and ruled OUT rather than unknown',
  level.standing.triggers.find((t) => t.id === 'standing.trigger.failed_examination').instrumented === true
  && level.standing.triggers.find((t) => t.id === 'standing.trigger.failed_examination').fired === false);
check('An honour can be judged at all — the level mark reaches Merit on the published thresholds',
  level.levelMark.mark >= HONOURS[1].overallThreshold && level.levelMark.mark < HONOURS[2].overallThreshold,
  String(level.levelMark.mark));

// The one thing still outstanding is the College's academic mapping
// work, and it must still be named as the College's — the examination
// closing did not make the skill mappings the learner's problem.
const outstanding = level.graduation.conditions.filter((c) => c.met !== true);
check('What remains outstanding is named, and is the College’s',
  outstanding.every((c) => c.owner === 'college'),
  JSON.stringify(outstanding.map((c) => [c.id, c.owner])));

// ═══════════════════════════════════════════════════════════════════
// 7 · WHERE THE TWO READERS DISAGREE
// ═══════════════════════════════════════════════════════════════════

for (let i = 1; i <= 10; i++) {
  await run(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at, attempt)
             VALUES (?, ?, 'usr_cand2', '[]', 0.8, ?, 1)`, `qb_${i}`, `itq_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`);
  await run(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade, submitted_at, graded_at, attempt)
             VALUES (?, ?, 'usr_cand2', 'graded', 0.8, ?, ?, 1)`,
    `bs_${i}`, `ita_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`, `2026-06-1${i % 9}T09:00:00Z`);
}
const s2 = await X.enterCandidate(env, { actor: admin, userId: 'usr_cand2', levelId: 1, at: '2026-07-01T09:00:00Z' });
await X.openPaper(env, { user: { id: 'usr_cand2' }, examinationId: s2.id, at: '2026-07-02T08:00:00Z' });
await X.submitPaper(env, { user: { id: 'usr_cand2' }, examinationId: s2.id, at: '2026-07-02T10:00:00Z' });

// One script carrying all three published triggers at once:
//   LIS  92 / 83  — nine points apart, beyond the tolerance
//   REA  71 / 70  — agreed
//   SPK  52 / 49  — three points apart, but either side of the floor
//   WRI  72 / 70  — agreed
// and the two whole-script readings, 71.75 and 68.00, fall on opposite
// sides of the pass mark, which is the honours-threshold case.
await X.recordMarks(env, { actor: first, examinationId: s2.id, role: 'first', marks: marksAt([92, 71, 52, 72]) });
const diverged = await X.recordMarks(env, {
  actor: second, examinationId: s2.id, role: 'second', marks: marksAt([83, 70, 49, 70]),
});
check('A divergence beyond three points opens a reconciliation',
  diverged.reconciliations.some((r) => r.trigger === 'tolerance'),
  JSON.stringify(diverged.reconciliations.map((r) => r.trigger)));
check('...a pair straddling the fifty floor opens one whatever its size',
  diverged.reconciliations.some((r) => r.trigger === 'skill_floor' && r.divergence <= X.TOLERANCE_POINTS),
  JSON.stringify(diverged.reconciliations.map((r) => [r.trigger, r.divergence])));
check('...and two readings in different honour bands open one against the whole script',
  diverged.reconciliations.some((r) => r.trigger === 'honour_threshold' && r.criterionId === null));
check('...which puts the sitting into reconciliation', diverged.status === 'reconciliation', diverged.status);
check('...with two working days on the clock',
  diverged.reconciliations.every((r) => r.settleDueOn > r.openedAt));
check('...and nothing counts while a reconciliation is open',
  diverged.result.percentage === null
  && diverged.result.criteria.some((c) => c.state === 'reconciliation_open'));

await refuses('A script under reconciliation cannot be released',
  () => X.release(env, { actor: admin, examinationId: s2.id }));

const tol = diverged.reconciliations.find((r) => r.trigger === 'tolerance');
await refuses('A reconciliation cannot be settled without writing',
  () => X.settleReconciliation(env, { actor: first, reconciliationId: tol.id, settledMark: 68, statement: '' }),
  'statement');

await X.settleReconciliation(env, {
  actor: first, reconciliationId: tol.id, settledMark: 88,
  statement: 'Reread together. The candidate loses the thread on the second recording; 88 agreed.',
});
const skillRec = diverged.reconciliations.find((r) => r.trigger === 'skill_floor');
await X.recordMarks(env, { actor: third, examinationId: s2.id, role: 'third', marks: marksAt([88, 70, 51, 70]) });
await refuses('Where a third marker reads, the settled mark must be the third marker’s',
  () => X.settleReconciliation(env, {
    actor: admin, reconciliationId: skillRec.id, settledMark: 60,
    statement: 'Split the difference.', how: 'third_marker', thirdMarkerId: 'usr_third',
  }), 'settledMark');
await X.settleReconciliation(env, {
  actor: admin, reconciliationId: skillRec.id, settledMark: 51,
  statement: 'Not settled in two working days. Read by a third marker, whose mark stands.',
  how: 'third_marker', thirdMarkerId: 'usr_third',
});
const honourRec = diverged.reconciliations.find((r) => r.trigger === 'honour_threshold');
const settled = await X.settleReconciliation(env, {
  actor: admin, reconciliationId: honourRec.id, settledMark: 70.5,
  statement: 'The whole-script readings are reconciled at the criterion level above; recorded for the committee.',
});
check('When every reconciliation is settled, the sitting leaves reconciliation',
  settled.status === 'marking', settled.status);
check('...and the settled marks are what count',
  settled.result.criteria.find((c) => c.code === 'LIS').mark === 88
  && settled.result.criteria.find((c) => c.code === 'LIS').basis === 'reconciled',
  JSON.stringify(settled.result.criteria.map((c) => [c.code, c.mark, c.basis])));
check('...with the third marker’s mark standing where it went that far',
  settled.result.criteria.find((c) => c.code === 'SPK').basis === 'third_marker');
check('BOTH original readings stay on the record, for the committee to read',
  settled.reconciliations.every((r) => r.firstMark !== null && r.secondMark !== null));

await X.recordSpokenPaper(env, { actor: first, examinationId: s2.id, passed: false });
const failed = await X.release(env, { actor: admin, examinationId: s2.id });
check('A script that fails a criterion floor still releases — the gate is not the mark',
  failed.status === 'released' && failed.released.mark === 70.5, String(failed.released.mark));

const standing2 = await computeLearnerStanding(env, 'usr_cand2');
const l2 = standing2.levels.find((l) => l.levelId === 1);
check('The failed spoken paper is reported as failed and as the LEARNER’s',
  l2.graduation.conditions.find((c) => c.id === 'level.gate.spoken_paper').met === false);
check('The overall gate is MET at 70.5 against a pass mark of 70 — a gate is not the whole award',
  l2.graduation.conditions.find((c) => c.id === 'level.gate.examination_overall').met === true
  && SCALE.passMark === 70);
check('...and the criterion floor is met, SPK having settled at 51 on the third reading',
  l2.graduation.conditions.find((c) => c.id === 'level.gate.examination_criterion_floor').met === true);
check('...and the failed-examination standing trigger is ruled out rather than fired',
  l2.standing.triggers.find((t) => t.id === 'standing.trigger.failed_examination').fired === false);
check('...so the position is not_eligible, and the ONE thing that is the learner’s is the spoken paper',
  l2.graduation.state === 'not_eligible'
  && l2.graduation.conditions.filter((c) => c.met === false && c.owner === 'learner')
    .map((c) => c.id).join(',') === 'level.gate.spoken_paper',
  JSON.stringify(l2.graduation.conditions.filter((c) => c.met === false).map((c) => [c.id, c.owner])));

// ═══════════════════════════════════════════════════════════════════
// 8 · RESITS, SET-ASIDES AND THE THINGS THAT END AN ATTEMPT
// ═══════════════════════════════════════════════════════════════════

await refuses('A resit sooner than fourteen days after the last attempt is refused',
  () => X.enterCandidate(env, { actor: admin, userId: 'usr_cand2', levelId: 1, at: '2026-07-10T09:00:00Z' }),
  'resit_interval');

const resit = await X.enterCandidate(env, { actor: admin, userId: 'usr_cand2', levelId: 1, at: '2026-08-01T09:00:00Z' });
check('A resit fourteen days on is entered, as the second of three counting sittings',
  resit.attempt === 2, String(resit.attempt));

const setAside = await X.setAside(env, {
  actor: admin, examinationId: resit.id, reason: 'learner_election',
  note: 'The connection dropped for over an hour.', at: '2026-08-02T09:00:00Z',
});
check('A set-aside records the reason and leaves no mark', setAside.status === 'set_aside');
check('...and is struck from the count of resits', setAside.countsTowardResits === false);

const resit2 = await X.enterCandidate(env, { actor: admin, userId: 'usr_cand2', levelId: 1, at: '2026-08-20T09:00:00Z' });
check('...so the next sitting takes a fresh ORDINAL rather than reusing one',
  resit2.attempt === 3, String(resit2.attempt));
check('...while still being the second sitting that COUNTS toward the two resits',
  resit2.countsTowardResits === true && resit2.maxSittings === 3);

await X.setAside(env, { actor: admin, examinationId: resit2.id, reason: 'learner_election', at: '2026-08-21T09:00:00Z' });
const resit3 = await X.enterCandidate(env, { actor: admin, userId: 'usr_cand2', levelId: 1, at: '2026-09-10T09:00:00Z' });
await refuses('Two set-asides a level are the published allowance; a third goes to the panel',
  () => X.setAside(env, { actor: admin, examinationId: resit3.id, reason: 'learner_election' }),
  'election_allowance_spent');
const byPanel = await X.setAside(env, {
  actor: admin, examinationId: resit3.id, reason: 'panel',
  note: 'Upheld by the mitigating circumstances panel.',
});
check('...and the panel may still set one aside', byPanel.status === 'set_aside' && byPanel.setAside.reason === 'panel');

const toVoid = await X.enterCandidate(env, { actor: admin, userId: 'usr_cand2', levelId: 1, at: '2026-10-01T09:00:00Z' });
await refuses('An attempt ends for one of three published reasons and no other',
  () => X.voidAttempt(env, { actor: admin, examinationId: toVoid.id, reason: 'poor_attendance', note: 'x' }),
  'reason');
const voided = await X.voidAttempt(env, {
  actor: admin, examinationId: toVoid.id, reason: 'conditions_breach',
  note: 'A dictionary was consulted during the closed spoken paper.',
});
check('An attempt ends on a breach of the printed conditions', voided.status === 'void' && voided.void.reason === 'conditions_breach');

// ═══════════════════════════════════════════════════════════════════
// 9 · LATENESS, AND THE CAP THAT CAN BE LIFTED BUT NEVER RAISED
// ═══════════════════════════════════════════════════════════════════

await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
           VALUES ('usr_late','clerk','sub_late','late@example.com','student','Yusuf')`);
await run(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
           VALUES ('enr_3','usr_late',NULL,1,'active','2026-05-01T00:00:00Z')`);
for (let i = 1; i <= 10; i++) {
  await run(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at, attempt)
             VALUES (?, ?, 'usr_late', '[]', 0.9, ?, 1)`, `qc_${i}`, `itq_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`);
  await run(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade, submitted_at, graded_at, attempt)
             VALUES (?, ?, 'usr_late', 'graded', 0.9, ?, ?, 1)`,
    `cs_${i}`, `ita_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`, `2026-06-1${i % 9}T09:00:00Z`);
}
const lateSitting = await X.enterCandidate(env, { actor: admin, userId: 'usr_late', levelId: 1, at: '2026-07-01T09:00:00Z' });
await X.openPaper(env, { user: { id: 'usr_late' }, examinationId: lateSitting.id, at: '2026-07-06T08:00:00Z' });
const late = await X.submitPaper(env, { user: { id: 'usr_late' }, examinationId: lateSitting.id, at: '2026-07-08T11:30:00Z' });
check('Two working days past the clock is the capped band', late.lateness === 'capped', late.lateness);

await X.recordMarks(env, { actor: first, examinationId: lateSitting.id, role: 'first', marks: marksAt([92, 90, 91, 93]) });
await X.recordMarks(env, { actor: second, examinationId: lateSitting.id, role: 'second', marks: marksAt([91, 91, 90, 92]) });
await X.recordSpokenPaper(env, { actor: first, examinationId: lateSitting.id, passed: true });
const cappedResult = await X.release(env, { actor: admin, examinationId: lateSitting.id });
check('A late script is marked in full and the MARK is capped at the pass threshold',
  cappedResult.released.mark === SCALE.passMark && cappedResult.result.capped === true,
  String(cappedResult.released.mark));
check('...and the mark actually achieved is still on the record',
  cappedResult.result.rawPercentage === 91.5, String(cappedResult.result.rawPercentage));

const lifted = await X.liftLateCap(env, { actor: admin, examinationId: lateSitting.id, reason: 'mitigation_upheld' });
check('An upheld claim lifts the cap', lifted.capLifted !== null && lifted.result.capped === false);
check('...and the mark that was released to the candidate on the day is unchanged',
  lifted.released.mark === SCALE.passMark, String(lifted.released.mark));
check('...while the recomputed figure beside it is the uncapped one',
  lifted.result.percentage === 91.5, String(lifted.result.percentage));
await refuses('A cap is lifted for an extension or an upheld claim, and no other reason',
  () => X.liftLateCap(env, { actor: admin, examinationId: lateSitting.id, reason: 'good_effort' }), 'reason');

// ═══════════════════════════════════════════════════════════════════
// 10 · THE TRAIL, AND THE QUEUE
// ═══════════════════════════════════════════════════════════════════

const trail = (await db.prepare('SELECT kind, actor_id FROM examination_events WHERE examination_id = ? ORDER BY at, rowid')
  .bind(sitting.id).all()).results;
check('Every act on a sitting leaves a trail',
  ['entered', 'opened', 'submitted', 'marked', 'second_marked', 'spoken_marked', 'released', 'moderation_closed']
    .every((k) => trail.some((t) => t.kind === k)),
  trail.map((t) => t.kind).join(', '));
check('...and every act names the hand that made it',
  trail.filter((t) => t.kind !== 'reconciliation_opened').every((t) => t.actor_id !== null));

const queue = await X.markingQueue(env, { staff: first, role: 'first' });
check('The first-marking queue holds only scripts nobody has read',
  queue.scripts.every((s) => s.examinationId !== sitting.id));
check('...and says on what basis it is drawn', typeof queue.basis === 'string' && queue.basis.length > 20);

await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
           VALUES ('usr_q','clerk','sub_q','q@example.com','student','Queue Candidate')`);
await run(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
           VALUES ('enr_q','usr_q',NULL,1,'active','2026-05-01T00:00:00Z')`);
for (let i = 1; i <= 10; i++) {
  await run(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at, attempt)
             VALUES (?, ?, 'usr_q', '[]', 0.8, ?, 1)`, `qd_${i}`, `itq_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`);
  await run(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade, submitted_at, graded_at, attempt)
             VALUES (?, ?, 'usr_q', 'graded', 0.8, ?, ?, 1)`,
    `ds_${i}`, `ita_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`, `2026-06-1${i % 9}T09:00:00Z`);
}
const qSitting = await X.enterCandidate(env, { actor: admin, userId: 'usr_q', levelId: 1, at: '2026-07-01T09:00:00Z' });
await X.openPaper(env, { user: { id: 'usr_q' }, examinationId: qSitting.id, at: '2026-07-02T08:00:00Z' });
await X.submitPaper(env, { user: { id: 'usr_q' }, examinationId: qSitting.id, at: '2026-07-02T10:00:00Z' });

const q1 = await X.markingQueue(env, { staff: first, role: 'first' });
check('An unread script reaches the first-marking queue',
  q1.scripts.some((s) => s.examinationId === qSitting.id));
await X.recordMarks(env, { actor: first, examinationId: qSitting.id, role: 'first', marks: marksAt([75, 75, 75, 75]) });
const q2 = await X.markingQueue(env, { staff: first, role: 'first' });
check('...and leaves it once it is read',
  !q2.scripts.some((s) => s.examinationId === qSitting.id));
const q3 = await X.markingQueue(env, { staff: second, role: 'second' });
check('...and appears in the SECOND-marking queue for a different marker',
  q3.scripts.some((s) => s.examinationId === qSitting.id));
const q4 = await X.markingQueue(env, { staff: first, role: 'second' });
check('...but never in the second-marking queue of the person who read it first',
  !q4.scripts.some((s) => s.examinationId === qSitting.id));

// ═══════════════════════════════════════════════════════════════════
// 11 · WHAT THE COLLEGE HAS NOT DONE IS NEVER THE LEARNER'S
// ═══════════════════════════════════════════════════════════════════

await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
           VALUES ('usr_l4','clerk','sub_l4','l4@example.com','student','Level Four')`);
await run(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
           VALUES ('enr_l4','usr_l4',NULL,4,'active','2026-05-01T00:00:00Z')`);
const l4 = (await computeLearnerStanding(env, 'usr_l4')).levels.find((l) => l.levelId === 4);
check('At a level with no published paper, the examination gates are the COLLEGE’s work',
  l4.graduation.conditions
    .filter((c) => c.id.startsWith('level.gate.examination') || c.id === 'level.gate.spoken_paper')
    .every((c) => c.owner === 'college'),
  JSON.stringify(l4.graduation.conditions.filter((c) => c.id.startsWith('level.gate.exam')).map((c) => c.owner)));
check('...and the sentence says so, rather than implying the candidate failed to sit it',
  /has not yet published an examination paper/.test(
    l4.graduation.conditions.find((c) => c.id === 'level.gate.examination_overall').detail),
  l4.graduation.conditions.find((c) => c.id === 'level.gate.examination_overall').detail);

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) process.exitCode = 1;
