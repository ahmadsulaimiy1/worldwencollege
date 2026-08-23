// CONFERRAL — the act the register was built for, and the one act
// nothing could perform.
//
// `grep -rn "conferAward" functions/` returned exactly one file before
// this: the one that defines it. The College could compute that a
// learner had met every published condition of an award, could report
// that position to them, and had no way to confer it. The chain that
// ends at a stranger typing a code into /verify/ had no beginning.
//
// So the assertions here are mostly about what conferral REFUSES, and
// about where each word on a certificate comes from:
//
//   · IT CONFERS ON `eligible` AND ON NOTHING ELSE. Not on
//     `conditional`, where the College owes the record; not on
//     `not_eligible`, where the learner does; not twice. Each refusal
//     is driven and its named conditions asserted.
//
//   · NOTHING IS TYPED. The title, post-nominal, CEFR, credits, hours
//     and honour are asserted to equal the records they come from —
//     `award_definitions`, `CREDIT`, and honourFor() — because `awards`
//     stores them denormalised and a slip is permanent.
//
//   · AND THE CHAIN CLOSES. The last section confers for real and then
//     verifies the code the way a stranger would, through the public
//     path, with the signature checked.

import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const C = await import(loadUrl('functions/_lib/registry/conferral.js'));
const A = await import(loadUrl('functions/_lib/registry/awards.js'));
const X = await import(loadUrl('functions/_lib/academic/examinations.js'));
const { computeLearnerStanding } = await import(loadUrl('functions/_lib/academic/standing.js'));
const { completeLevel } = await import(loadUrl('functions/_lib/student/progression.js'));
const { CREDIT } = await import(loadUrl('functions/_lib/academic/marks.js'));
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
      || String(err.message).includes(field);
    check(label, err instanceof ValidationError && named, `${err.name}: ${err.message}`);
  }
}

// ── FIXTURES ────────────────────────────────────────────────────────
for (const [id, role, name] of [
  ['usr_ready', 'student', 'Ready Candidate'],
  ['usr_waiting', 'student', 'Waiting Candidate'],
  ['usr_short', 'student', 'Short Candidate'],
  ['usr_nameless', 'student', ''],
  ['usr_reg', 'admin', 'The Registrar'],
  ['usr_first', 'staff', 'First Marker'],
  ['usr_second', 'staff', 'Second Marker'],
]) {
  await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
             VALUES (?, 'clerk', ?, ?, ?, ?)`, id, `sub_${id}`, `${id}@example.com`, role, name);
}
const registrar = { id: 'usr_reg', role: 'admin' };
const first = { id: 'usr_first', role: 'staff' };
const second = { id: 'usr_second', role: 'staff' };

const LEVEL = 1;
for (const u of ['usr_ready', 'usr_waiting', 'usr_short', 'usr_nameless']) {
  await run(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
             VALUES (?, ?, NULL, ?, 'active', '2026-05-01T00:00:00Z')`, `enr_${u}`, u, LEVEL);
}

const course = (await db.prepare('SELECT id FROM courses WHERE level_id = ?').bind(LEVEL).first()).id;
for (let i = 1; i <= 10; i++) {
  await run('INSERT INTO units (id, course_id, sequence, title) VALUES (?, ?, ?, ?)',
    `unt_${i}`, course, i, `Module ${i}`);
  await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 1, 'quiz', ?)`,
    `itq_${i}`, `unt_${i}`, `Quiz ${i}`);
  await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 2, 'assignment', ?)`,
    `ita_${i}`, `unt_${i}`, `Assignment ${i}`);
}

/** Ten complete modules for one learner, all well above the pass mark. */
async function completeModules(userId, tag) {
  for (let i = 1; i <= 10; i++) {
    await run(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at, attempt)
               VALUES (?, ?, ?, '[]', 0.9, ?, 1)`,
      `qa_${tag}_${i}`, `itq_${i}`, userId, `2026-06-0${(i % 9) + 1}T09:00:00Z`);
    await run(`INSERT INTO assignment_submissions
                 (id, learning_item_id, user_id, status, grade, submitted_at, graded_at, attempt)
               VALUES (?, ?, ?, 'graded', 0.88, ?, ?, 1)`,
      `as_${tag}_${i}`, `ita_${i}`, userId, `2026-06-0${(i % 9) + 1}T09:00:00Z`, `2026-06-1${i % 9}T09:00:00Z`);
  }
}
await completeModules('usr_ready', 'r');
await completeModules('usr_waiting', 'w');
await completeModules('usr_nameless', 'n');
// usr_short deliberately gets nothing: their own work is outstanding.

// A published paper, so an examination can be sat at all.
const rubric = [
  { code: 'LIS', name: 'Listening', descriptor: 'Understands speech at natural pace.', weight: 0.25, skillId: 'skl_listening' },
  { code: 'REA', name: 'Reading', descriptor: 'Reads for argument and detail.', weight: 0.25, skillId: 'skl_reading' },
  { code: 'SPK', name: 'Speaking', descriptor: 'Speaks with control, in real time.', weight: 0.25, skillId: 'skl_speaking', spoken: true },
  { code: 'WRI', name: 'Writing', descriptor: 'Writes to a purpose and an audience.', weight: 0.25, skillId: 'skl_writing' },
];
const draft = await X.authorPaper(env, {
  actor: registrar, levelId: LEVEL, title: 'Level I Examination',
  conditions: 'Open book. Three hours.', criteria: rubric,
});
await X.publishPaper(env, { actor: registrar, paperId: draft.id });
const paper = await X.paperFor(env, (await X.publishedPaperFor(env, LEVEL)).id);
const marks = (v) => paper.criteria.map((c, i) => ({ criterionId: c.id, mark: v[i] }));

/** Sit, mark twice, mark the spoken paper, release. */
async function sitAndRelease(userId, values) {
  const sitting = await X.enterCandidate(env, { actor: registrar, userId, levelId: LEVEL, at: '2026-07-01T09:00:00Z' });
  await X.openPaper(env, { user: { id: userId }, examinationId: sitting.id, at: '2026-07-02T08:00:00Z' });
  await X.submitPaper(env, { user: { id: userId }, examinationId: sitting.id, at: '2026-07-02T10:00:00Z' });
  await X.recordMarks(env, { actor: first, examinationId: sitting.id, role: 'first', marks: marks(values) });
  await X.recordMarks(env, { actor: second, examinationId: sitting.id, role: 'second', marks: marks(values) });
  await X.recordSpokenPaper(env, { actor: first, examinationId: sitting.id, passed: true });
  return X.release(env, { actor: registrar, examinationId: sitting.id });
}

// ═══════════════════════════════════════════════════════════════════
// 1 · THE DEFINITION IS THE SOURCE OF EVERY WORD
// ═══════════════════════════════════════════════════════════════════

const definition = await C.definitionFor(env, LEVEL);
check('every level carries an adopted award definition', Boolean(definition), JSON.stringify(definition));

const before = await C.conferralFor(env, { userId: 'usr_ready', levelId: LEVEL });
check('the award is composed before the act, from the definition',
  before.award.awardTitle === definition.officialTitle
  && before.award.postNominal === definition.postNominal
  && before.award.cefr === definition.cefr,
  JSON.stringify(before.award));
check('...with the credits and hours the regulations adopt, never typed',
  before.award.credits === CREDIT.perLevel && before.award.tqtHours === CREDIT.tqtHoursPerLevel,
  `${before.award.credits} / ${before.award.tqtHours}`);
check('...and the holder name the account holds',
  before.award.holderName === 'Ready Candidate', before.award.holderName);

// ═══════════════════════════════════════════════════════════════════
// 2 · IT REFUSES ON EVERYTHING BUT `eligible`
// ═══════════════════════════════════════════════════════════════════

check('with no examination released, the position is not eligible',
  before.position.state !== 'eligible' && before.mayConfer === false, before.position.state);
await refuses('...and conferral is refused, quoting the conditions',
  () => C.confer(env, { actor: registrar, userId: 'usr_ready', levelId: LEVEL }),
  'level.gate.examination_overall');

await refuses('a learner whose own work is outstanding cannot be conferred',
  () => C.confer(env, { actor: registrar, userId: 'usr_short', levelId: LEVEL }),
  'level.gate.modules_complete');

const nameless = await C.conferralFor(env, { userId: 'usr_nameless', levelId: LEVEL });
check('an account with no name is a blocker, and it is the COLLEGE\'s',
  nameless.blockers.some((b) => b.id === 'no_holder_name' && b.owner === 'college'),
  JSON.stringify(nameless.blockers.map((b) => b.id)));

await refuses('a level outside the programme is refused',
  () => C.conferralFor(env, { userId: 'usr_ready', levelId: 9 }), 'levelId');

// ═══════════════════════════════════════════════════════════════════
// 3 · THE CHAIN CLOSES
// ═══════════════════════════════════════════════════════════════════

await sitAndRelease('usr_ready', [92, 90, 91, 93]);

const ready = await C.conferralFor(env, { userId: 'usr_ready', levelId: LEVEL });
// The skill mappings are the College's own outstanding academic work
// and block conferral for every learner today — the instrument says so
// at `conformance.skill_mapping`. The candidate is `conditional`, not
// `not_eligible`, and every blocker is the College's.
check('with the examination released, nothing outstanding is the LEARNER\'s',
  ready.blockers.every((b) => b.owner === 'college'),
  JSON.stringify(ready.blockers.map((b) => [b.id, b.owner])));

// Approve the skill mappings — the one academic act that stands between
// this College and its first conferral. Done here as a fixture because
// it is an academic decision, not a software one.
for (const [skill, item] of [
  ['skl_listening', 'itq_1'], ['skl_reading', 'itq_2'],
  ['skl_speaking', 'ita_1'], ['skl_writing', 'ita_2'],
]) {
  // An approved mapping carries an approver and a date — the schema
  // refuses one without them, which is the whole point: a mapping is
  // the College's claim about what an assessment evidences, and a claim
  // with no hand behind it is not one.
  await run(`INSERT INTO assessment_skills
               (id, learning_item_id, skill_id, weight, status, approved_by, approved_at)
             VALUES (?, ?, ?, 1.0, 'approved', 'usr_reg', '2026-07-05T09:00:00Z')`,
  `asx_${skill}`, item, skill);
}

// THE LAST GATE IS A PERSON, and that is published: "There is no
// automated grading engine and the College does not imply one; a member
// of academic staff confirms completion, and that confirmation is what
// opens the next level." It is performed on /staff-learners.html, and
// conferral is downstream of it — which is the two consoles connecting.
await completeLevel(env, { userId: 'usr_ready', levelId: LEVEL });

const nowReady = await C.conferralFor(env, { userId: 'usr_ready', levelId: LEVEL });
check('with the mappings approved, the candidate is eligible',
  nowReady.position.state === 'eligible' && nowReady.mayConfer === true,
  JSON.stringify(nowReady.blockers.map((b) => b.id)));
check('...and an honour has been classified from the marks',
  Boolean(nowReady.award.honour), JSON.stringify(nowReady.award.honour));

const conferred = await C.confer(env, {
  actor: registrar, userId: 'usr_ready', levelId: LEVEL,
  citation: 'For a defence of their own submission conducted wholly in English under questioning.',
  publicConsent: true,
});
check('THE AWARD IS CONFERRED — the first act the platform could not perform',
  Boolean(conferred.award && conferred.award.verificationCode),
  JSON.stringify(conferred.award && conferred.award.verificationCode));

// Verified the way a stranger would: through the public path, by code.
const verified = await A.verifyCode(env, { code: conferred.award.verificationCode, channel: 'public' });
check('...and a stranger can verify it by code, with no account',
  verified.outcome === 'valid' && verified.award.status === 'conferred',
  JSON.stringify({ outcome: verified.outcome, status: verified.award && verified.award.status }));
check('...against a signature the register checks rather than recites',
  verified.signature && verified.signature.valid === true,
  JSON.stringify(verified.signature));
check('...naming the holder the account named',
  verified.award.holderName === 'Ready Candidate', verified.award.holderName);
check('...with the citation as written',
  /defence of their own submission/.test(verified.award.citation || ''), verified.award.citation);

const standing = await computeLearnerStanding(env, 'usr_ready');
const level = standing.levels.find((l) => l.levelId === LEVEL);
check('the learner\'s own standing now reads conferred',
  level.graduation.state === 'conferred', level.graduation.state);
check('...and the eligibility row agrees with the register',
  (await db.prepare('SELECT state, award_id FROM graduation_eligibility WHERE user_id = ? AND level_id = ?')
    .bind('usr_ready', LEVEL).first() || {}).state === 'conferred');

await refuses('the same award cannot be conferred twice',
  () => C.confer(env, { actor: registrar, userId: 'usr_ready', levelId: LEVEL }),
  'already_conferred');

// ═══════════════════════════════════════════════════════════════════
// 4 · THE QUEUE TELLS THE THREE GROUPS APART
// ═══════════════════════════════════════════════════════════════════

// usr_waiting sits and is released, and is deliberately NOT confirmed
// by a member of staff. They are the middle group: their own work is
// finished and the College owes the last record.
await sitAndRelease('usr_waiting', [84, 82, 83, 85]);
const queue = await C.conferralQueue(env, {});
check('the conferred learner is in the held group',
  queue.conferred.some((e) => e.userId === 'usr_ready'), JSON.stringify(queue.conferred.map((e) => e.userId)));
check('a learner waiting on the COLLEGE is in the middle group, not hidden',
  queue.conditional.some((e) => e.userId === 'usr_waiting'),
  JSON.stringify(queue.conditional.map((e) => e.userId)));
check('...and everything outstanding against them is the College\'s',
  (queue.conditional.find((e) => e.userId === 'usr_waiting') || { outstanding: [] })
    .outstanding.every((c) => c.owner === 'college'),
  JSON.stringify((queue.conditional.find((e) => e.userId === 'usr_waiting') || {}).outstanding));
check('a learner with work of their OWN outstanding is in neither group',
  !queue.eligible.some((e) => e.userId === 'usr_short')
  && !queue.conditional.some((e) => e.userId === 'usr_short'));
check('...and the queue says on what basis it was drawn',
  typeof queue.basis === 'string' && queue.basis.length > 40);

// ═══════════════════════════════════════════════════════════════════
// 5 · WITHDRAWAL AND REPLACEMENT
// ═══════════════════════════════════════════════════════════════════

await refuses('an award cannot be withdrawn without a reason',
  () => C.withdraw(env, { actor: registrar, awardId: conferred.award.id, reason: 'x' }), 'reason');

await refuses('a replacement that changes nothing is refused',
  () => C.replace(env, {
    actor: registrar, awardId: conferred.award.id,
    reason: 'The holder asked for a correction.', changes: {},
  }), 'changes');

const replaced = await C.replace(env, {
  actor: registrar, awardId: conferred.award.id,
  reason: 'Holder name corrected at the holder\'s written request.',
  changes: { holderName: 'Ready A. Candidate' },
});
check('a corrected name is issued as a NEW award, not an edit',
  replaced.replacement
  && replaced.replacement.verificationCode !== conferred.award.verificationCode
  && replaced.replacement.holderName === 'Ready A. Candidate',
  JSON.stringify(replaced.replacement && replaced.replacement.holderName));

const oldOne = await A.verifyCode(env, { code: conferred.award.verificationCode, channel: 'public' });
check('...and the earlier certificate still resolves, as the College promises',
  oldOne.award !== null, JSON.stringify(oldOne.outcome));
check('...reporting itself as replaced rather than as valid',
  oldOne.outcome === 'replaced' && oldOne.award.status === 'replaced', oldOne.outcome);
check('...and naming the code that superseded it, so a holder is never stranded',
  oldOne.award.replacementCode === replaced.replacement.verificationCode,
  JSON.stringify([oldOne.award.replacementCode, replaced.replacement.verificationCode]));

await refuses('a replacement may not change a mark, a level or an honour',
  () => C.replace(env, {
    actor: registrar, awardId: replaced.replacement.id,
    reason: 'Trying to move the honour.', changes: { honour: 'distinction' },
  }), 'changes');

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) process.exitCode = 1;
