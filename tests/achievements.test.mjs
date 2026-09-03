// Run with: node --experimental-sqlite tests/achievements.test.mjs
//
// ACHIEVEMENTS, AND THE FOUR WAYS THIS FEATURE GOES WRONG QUIETLY.
//
// The arithmetic here is small. The reason this file is long is that
// every failure worth catching in a milestone system is a failure of
// governance or of drift, and none of them looks like a bug on screen.
//
//  1. THE BADGE THAT COMES BACK. The whole design is that nothing can be
//     earned from activity. That is not a rule this code enforces — it
//     is a shape sql/schema.sql already has, in a CHECK listing eight
//     tables of assessed evidence and no table recording a login. So
//     § 3 asserts the closed list against the schema itself and asserts
//     that no definition in the register reads outside it. A later hand
//     adding 'sessions' to that CHECK fails here.
//
//  2. THE DEFINITION THAT AWARDS ITSELF. What a College honours is the
//     College's decision, taken by a person on a date; the schema says
//     so in a CHECK that an approved definition names its approver. The
//     register therefore ships every definition as `proposed`, and § 5
//     asserts that a full evidence record earns NOTHING against a
//     proposed definition — the assertion that would fail the moment
//     somebody made adoption implicit.
//
//  3. THE CONSTANT THAT DRIFTS. A Pages Function has no filesystem, so
//     REGISTER in functions/_lib/academic/achievements.js restates
//     data/milestones.json. § 1 reads that file off disk and pins every
//     code, sequence, evidence source, condition parameter and BOTH
//     editions of every label and every remaining sentence to it. § 2
//     pins the numbers the conditions are stated with to
//     data/academic-regulations.json, so a milestone cannot come to
//     assert a standard the regulations do not.
//
//  4. THE SWEEP THAT AWARDS TWICE, OR UNDOES A PERSON. Re-running the
//     sweep must be inert; a non-repeatable milestone must not be earned
//     again from different evidence; and a milestone a person revoked
//     must never be re-awarded around them. § 9 asserts all three, plus
//     the one that is easiest to get wrong and hardest to notice —
//     `earned_on` is the day the EVIDENCE is dated, never the day the
//     sweep happened to run.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const lib = await import(loadUrl('functions/_lib/academic/achievements.js'));
const {
  REGISTER, REGISTER_INSTRUMENT, achievementNotice, seedMilestoneDefinitions,
  approveMilestoneDefinition, awardMilestones, learnerAchievements, countingAttempt,
} = lib;
const marks = await import(loadUrl('functions/_lib/academic/marks.js'));
const route = await import(loadUrl('functions/api/student/achievements.js'));

const published = JSON.parse(readFileSync(new URL('data/milestones.json', `file://${ROOT}/`), 'utf8'));
const regs = JSON.parse(readFileSync(new URL('data/academic-regulations.json', `file://${ROOT}/`), 'utf8'));
const schemaSql = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const routeSrc = readFileSync(new URL('functions/api/student/achievements.js', `file://${ROOT}/`), 'utf8');

const env = { DB: makeD1(schemaSql), CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
const DB = env.DB;
const run = (sql, ...args) => DB.prepare(sql).bind(...args).run();
const all = async (sql, ...args) => (await DB.prepare(sql).bind(...args).all()).results;

// ---------------------------------------------------------------------
// 1 · THE RESTATEMENT IS PINNED TO THE PUBLISHED REGISTER
// ---------------------------------------------------------------------
const defs = published.definitions;

check('the register restated in code names data/milestones.json as its source',
  REGISTER_INSTRUMENT.source === 'data/milestones.json'
  && REGISTER_INSTRUMENT.id === published.instrument.id
  && REGISTER_INSTRUMENT.version === published.instrument.version,
  `${REGISTER_INSTRUMENT.id}@${REGISTER_INSTRUMENT.version}`);

check('the register is not adopted, in the file and in the code alike',
  published.instrument.adopted === false && REGISTER_INSTRUMENT.adopted === false);

check('the code carries exactly the definitions the published register carries',
  REGISTER.length === defs.length, `${REGISTER.length} in code, ${defs.length} published`);

for (const def of defs) {
  const mine = REGISTER.find((d) => d.code === def.code);
  if (!mine) { check(`code "${def.code}" is restated in achievements.js`, false, 'absent'); continue; }
  check(`${def.code}: sequence, level, evidence source and repeatability match the published register`,
    mine.sequence === def.sequence
    && mine.levelId === def.level_id
    && mine.evidenceSource === def.evidence_source
    && mine.repeatable === def.repeatable,
    `${mine.sequence}/${mine.evidenceSource}`);
  check(`${def.code}: both editions of the name match`,
    mine.name.en === def.name.en && mine.name.ar === def.name.ar, mine.name.ar);
  check(`${def.code}: both editions of the academic fact match`,
    mine.academicFact.en === def.academic_fact.en && mine.academicFact.ar === def.academic_fact.ar);
  check(`${def.code}: the condition rule and its parameters match`,
    mine.rule === def.condition.rule
    && JSON.stringify(mine.parameters) === JSON.stringify(def.condition.parameters),
    `${mine.rule} ${JSON.stringify(mine.parameters)}`);
  check(`${def.code}: every remaining sentence matches, in both editions`,
    JSON.stringify(mine.remaining) === JSON.stringify(def.remaining));
  check(`${def.code}: ships proposed, so nothing is awarded under it before the College adopts it`,
    def.status === 'proposed' && mine.status === 'proposed', def.status);
  check(`${def.code}: states the academic fact it marks in both editions, not a slogan`,
    def.academic_fact.en.length > 40 && def.academic_fact.ar.length > 20
    && !/badge|points|trophy|streak/i.test(def.academic_fact.en));
}

check('every definition carries a default remaining sentence in both editions',
  defs.every((d) => d.remaining.default && d.remaining.default.en && d.remaining.default.ar));

check('sequences are unique, as milestone_definitions.sequence requires',
  new Set(defs.map((d) => d.sequence)).size === defs.length);
check('codes are unique, as milestone_definitions.code requires',
  new Set(defs.map((d) => d.code)).size === defs.length);

// ---------------------------------------------------------------------
// 2 · THE CONDITIONS ARE STATED IN THE INSTRUMENT'S OWN NUMBERS
// ---------------------------------------------------------------------
check('a level is ten modules here because level.component.coursework.module_count says ten',
  REGISTER.find((d) => d.code === 'level_modules_complete').parameters.modules_per_level
  === marks.WEIGHTS.modulesPerLevel && marks.WEIGHTS.modulesPerLevel === 10);

check('the pass mark the module condition rests on is the published 70.00',
  marks.SCALE.passMark === regs.marking_scale.pass_mark.value);

const distinctionHonour = marks.HONOURS.find((h) => h.code === 'distinction');
const publishedDistinction = regs.classification.honours.find((h) => h.code === 'distinction');
check('the Distinction threshold and skill floor quoted to the learner are the published ones',
  distinctionHonour.overallThreshold === publishedDistinction.overall_threshold
  && distinctionHonour.skillFloor === publishedDistinction.skill_floor,
  `${distinctionHonour.overallThreshold}/${distinctionHonour.skillFloor}`);

check('the College Distinction is deliberately outside the distinction milestone',
  !REGISTER.find((d) => d.code === 'first_distinction').parameters.honours.includes(marks.COLLEGE_DISTINCTION_CODE));

check('programme completion asks for the six levels prog.levels names',
  JSON.stringify(REGISTER.find((d) => d.code === 'programme_complete').parameters.levels)
  === JSON.stringify(marks.PROGRESSION.levels));

const sustained = REGISTER.find((d) => d.code === 'sustained_engagement');
check('the sustained record is counted in engage.window\'s own seven-day windows',
  sustained.parameters.window_days === regs.engagement.window.value
  && regs.engagement.window.unit === 'days');
check('...and it counts engagement, never attendance, and never as a penalty',
  regs.engagement.attendance_requirement.exists === false
  && sustained.parameters.basis === 'module_engagement'
  && /engagement/i.test(sustained.academicFact.en) && !/attendance/i.test(sustained.academicFact.en));

// ---------------------------------------------------------------------
// 3 · THE CLOSED LIST — nothing here can be earned from activity
// ---------------------------------------------------------------------
const checkClause = schemaSql.match(/evidence_source\s+TEXT NOT NULL CHECK \(evidence_source IN\s*\(([^)]*)\)/);
const allowedSources = checkClause[1].split(',').map((s) => s.trim().replace(/^'|'$/g, ''));
check('the schema still restricts evidence to eight tables of assessed or attested evidence',
  allowedSources.length === 8, allowedSources.join(', '));
check('no table recording a login, a visit or a session is among them',
  !allowedSources.some((t) => /session|login|visit|streak|time_on_task/.test(t)), allowedSources.join(', '));
check('every definition in the register reads from a table on that list',
  defs.every((d) => allowedSources.includes(d.evidence_source)));
check('the published register documents every one of the eight, including the three it uses for nothing',
  allowedSources.every((t) => published.evidence_sources.some((e) => e.table === t)));
check('the three tables no definition reads are marked as such rather than left unexplained',
  published.evidence_sources.filter((e) => e.used_by_any_definition === false).length === 3
  && published.evidence_sources
    .filter((e) => e.used_by_any_definition === false)
    .every((e) => !defs.some((d) => d.evidence_source === e.table)));

check('the register records what was wanted and could not be checked, rather than writing it badly',
  Array.isArray(published.not_defined) && published.not_defined.length >= 3
  && published.not_defined.every((n) => n.why_not && n.wanted.en && n.wanted.ar));
check('a streak is refused at the schema, and the register says so rather than claiming a policy',
  /evidence_source/.test(published.not_defined.find((n) => n.id === 'not_defined.milestone.streak').why_not));

const notice = achievementNotice();
check('the notice a UI cannot omit says both editions of what these are',
  notice.statement.en.length > 200 && notice.statement.ar.length > 100
  && /assessed or attested/.test(notice.statement.en));
check('...and says plainly that nothing is earned by signing in or by time spent',
  /signing in/.test(notice.statement.en) && /time spent on the platform/.test(notice.statement.en));
check('...and that none of it is a condition, a mark or an input to standing',
  /a condition of any award/.test(notice.statement.en)
  && /a component of any mark/.test(notice.statement.en)
  && /academic standing/.test(notice.statement.en));
check('every principle in the published register reaches the learner in both editions',
  published.principles.every((p) => notice.principles.some((n) => n.id === p.id
    && n.en === p.label.en && n.ar === p.label.ar)),
  notice.principles.map((p) => p.id).join(', '));

// ---------------------------------------------------------------------
// 4 · THE FIXTURE — one learner with a full record, and four with less
// ---------------------------------------------------------------------
const user = (id, sub, role = 'student') => run(
  `INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role, preferred_name)
   VALUES (?, 'clerk', ?, ?, 1, ?, ?)`, id, sub, `${sub}@example.com`, role, id);

await user('usr_learner', 'sub_learner');
await user('usr_fresh', 'sub_fresh');
await user('usr_lapsed', 'sub_lapsed');
await user('usr_pron', 'sub_pron');
await user('usr_pron2', 'sub_pron2');
await user('usr_registrar', 'sub_registrar', 'admin');

// schema.sql already seeds one course per level, structurally. Ten
// modules are hung off Level I's, which is what level.gate.modules_complete
// expects a level to carry.
for (let i = 1; i <= 10; i++) {
  await run(`INSERT INTO units (id, course_id, sequence, title) VALUES (?, 'crs_level_1', ?, ?)`,
    `unt_${i}`, i, `Module ${i}`);
  await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 1, 'quiz', ?)`,
    `itm_q${i}`, `unt_${i}`, `Quiz ${i}`);
  await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 2, 'assignment', ?)`,
    `itm_a${i}`, `unt_${i}`, `Assignment ${i}`);
}
await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
           VALUES ('itm_pron', 'unt_1', 3, 'pronunciation', 'Pronunciation practice')`);

const ANCHOR = '2026-04-01T00:00:00.000Z';
await run(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_l', 'usr_learner', 1, 'active', ?)`, ANCHOR);
await run(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_f', 'usr_fresh', 1, 'active', ?)`, ANCHOR);
await run(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_x', 'usr_lapsed', 1, 'active', ?)`, ANCHOR);

// Ten modules, each passed on both components. The dates are fixed and
// in the past on purpose: § 9 asserts the milestone is dated to them and
// not to the day this test runs.
for (let i = 1; i <= 10; i++) {
  const day = String(i).padStart(2, '0');
  await run(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at)
             VALUES (?, ?, 'usr_learner', '[]', 0.9, ?)`,
    `qat_${i}`, `itm_q${i}`, `2026-05-${day}T09:00:00.000Z`);
  await run(`INSERT INTO assignment_submissions
               (id, learning_item_id, user_id, content, status, grade, submitted_at, graded_at, graded_by)
             VALUES (?, ?, 'usr_learner', 'work', 'graded', 0.85, ?, ?, NULL)`,
    `asub_${i}`, `itm_a${i}`, `2026-05-${day}T10:00:00.000Z`, `2026-05-${day}T12:00:00.000Z`);
}

// The six competencies, then a moderator's confirmation of the first.
const comps = await all('SELECT id FROM competencies ORDER BY sequence ASC');
check('the schema still seeds the competencies a milestone counts against', comps.length === 6, `${comps.length}`);
for (let i = 0; i < comps.length; i++) {
  await run(`INSERT INTO competency_marks (id, submission_id, competency_id, mark, marked_by, source, created_at)
             VALUES (?, 'asub_1', ?, 0.8, NULL, 'instructor', ?)`,
    `cmk_${i}`, comps[i].id, `2026-06-0${i + 1}T09:00:00.000Z`);
}
await run(`INSERT INTO competency_marks (id, submission_id, competency_id, mark, marked_by, source, created_at)
           VALUES ('cmk_mod', 'asub_1', ?, 0.82, NULL, 'moderator', '2026-06-09T09:00:00.000Z')`, comps[0].id);

// Pronunciation: assessed twice, higher the second time on both criteria
// the instructor marked both times.
const recording = (id, userId, attempt, at) => run(
  `INSERT INTO learner_recordings (id, learning_item_id, user_id, media_url, attempt, status, submitted_at)
   VALUES (?, 'itm_pron', ?, 'r2://x', ?, 'reviewed', ?)`, id, userId, attempt, at);
const feedback = (id, recordingId, intelligibility, fluency, source = 'instructor') => run(
  `INSERT INTO pronunciation_feedback (id, recording_id, source, reviewer_id, intelligibility, fluency)
   VALUES (?, ?, ?, NULL, ?, ?)`, id, recordingId, source, intelligibility, fluency);

await recording('rec_1', 'usr_learner', 1, '2026-05-10T09:00:00.000Z');
await feedback('pfb_1', 'rec_1', 0.6, 0.5);
await recording('rec_2', 'usr_learner', 2, '2026-05-20T09:00:00.000Z');
await feedback('pfb_2', 'rec_2', 0.7, 0.62);

await recording('rec_p1', 'usr_pron', 1, '2026-05-10T09:00:00.000Z');
await feedback('pfb_p1', 'rec_p1', 0.6, 0.5);
await recording('rec_p2', 'usr_pron', 2, '2026-05-20T09:00:00.000Z');
await feedback('pfb_p2', 'rec_p2', 0.6, 0.7);   // not higher on every shared criterion

await recording('rec_q1', 'usr_pron2', 1, '2026-05-10T09:00:00.000Z');
await feedback('pfb_q1', 'rec_q1', 0.6, 0.5);
await recording('rec_q2', 'usr_pron2', 2, '2026-05-20T09:00:00.000Z');  // not assessed

// Four consecutive engagement windows for the full learner; a broken run
// for the fresh one.
const engaged = (id, userId, start, end) => run(
  `INSERT INTO attendance_records
     (id, user_id, basis, unit_id, window_start, window_end, state, evidence_kind, recorded_via, created_at)
   VALUES (?, ?, 'module_engagement', 'unt_1', ?, ?, 'attended', 'lesson_completion', 'platform_signal', ?)`,
  id, userId, start, end, end);
const WEEK = ['2026-04-01', '2026-04-08', '2026-04-15', '2026-04-22', '2026-04-29', '2026-05-06'];
const iso = (d) => `${d}T00:00:00.000Z`;
for (let i = 0; i < 4; i++) await engaged(`att_${i}`, 'usr_learner', iso(WEEK[i]), iso(WEEK[i + 1]));
// usr_fresh: two, then a gap, then two — a longest run of two, not four.
await engaged('att_f0', 'usr_fresh', iso(WEEK[0]), iso(WEEK[1]));
await engaged('att_f1', 'usr_fresh', iso(WEEK[1]), iso(WEEK[2]));
await engaged('att_f3', 'usr_fresh', iso(WEEK[3]), iso(WEEK[4]));
await engaged('att_f4', 'usr_fresh', iso(WEEK[4]), iso(WEEK[5]));

let awardSeq = 0;
const award = (id, userId, levelId, honour, on, digest) => run(
  `INSERT INTO awards (id, user_id, level_id, award_title, post_nominal, cefr, honour, credits, tqt_hours,
                       holder_name, conferred_on, verification_code, status, prev_digest, digest, seq)
   VALUES (?, ?, ?, 'English Aspirant of Worldwide English College', 'ApWEC', 'A1', ?, 20, 200, ?, ?, ?, 'conferred', ?, ?, ?)`,
  id, userId, levelId, honour, userId, on, `VC-${digest}`, `prev-${digest}`, `dig-${digest}`, ++awardSeq);

await award('awd_1', 'usr_learner', 1, 'distinction', '2026-07-01', 'a1');
await award('awd_x', 'usr_lapsed', 1, 'pass', '2026-07-02', 'x1');

// ---------------------------------------------------------------------
// 5 · A PROPOSED DEFINITION AWARDS NOTHING
// ---------------------------------------------------------------------
const seeded = await seedMilestoneDefinitions(env);
check('seeding installs every definition the register proposes',
  seeded.inserted.length === REGISTER.length, `${seeded.inserted.length}`);
const installed = await all('SELECT code, status, approved_by AS approvedBy, repeatable FROM milestone_definitions ORDER BY sequence');
check('...every one of them as proposed, with no approver invented for it',
  installed.length === REGISTER.length
  && installed.every((r) => r.status === 'proposed' && r.approvedBy === null));

const reseed = await seedMilestoneDefinitions(env);
check('seeding twice installs nothing twice',
  reseed.inserted.length === 0
  && (await all('SELECT id FROM milestone_definitions')).length === REGISTER.length);

const beforeAdoption = await learnerAchievements(env, 'usr_learner');
check('a learner with a full evidence record earns NOTHING while every definition is proposed',
  beforeAdoption.earned.length === 0 && beforeAdoption.summary.awardedThisRequest === 0);
check('...and is told the register is not adopted rather than shown fifteen prizes to chase',
  beforeAdoption.unearned.length === 0
  && beforeAdoption.notInForce.length === REGISTER.length
  && /not yet adopted/.test(beforeAdoption.notInForce[0].statement.en)
  && beforeAdoption.notInForce[0].statement.ar.length > 20);
check('...and the register block says so in both editions',
  /none is yet adopted/.test(beforeAdoption.register.statement.en)
  && beforeAdoption.register.approved === 0
  && beforeAdoption.register.proposed === REGISTER.length);
check('nothing was written to learner_milestones by a proposed definition',
  (await all('SELECT id FROM learner_milestones')).length === 0);

// ---------------------------------------------------------------------
// 6 · ADOPTION IS A PERSON'S ACT, WITH A DATE ON IT
// ---------------------------------------------------------------------
const refused = async (fn, field) => {
  try { await fn(); return false; } catch (e) { return e.name === 'ValidationError' && Boolean(e.fields[field]); }
};
check('approving without naming the approver is refused, not defaulted to the platform',
  await refused(() => approveMilestoneDefinition(env, { code: 'first_work_marked' }), 'actorId'));
check('approving without a code is refused',
  await refused(() => approveMilestoneDefinition(env, { actorId: 'usr_registrar' }), 'code'));
check('approving a code the register does not carry is a NotFound, not a silent no-op', await (async () => {
  try { await approveMilestoneDefinition(env, { code: 'no_such_code', actorId: 'usr_registrar' }); return false; }
  catch (e) { return e.name === 'NotFoundError'; }
})());

for (const def of REGISTER) {
  await approveMilestoneDefinition(env, { code: def.code, actorId: 'usr_registrar', at: '2026-08-20T09:00:00Z' });
}
const adopted = await all('SELECT code, status, approved_by AS approvedBy, approved_at AS approvedAt FROM milestone_definitions');
check('an adopted definition carries its approver and the date, which the schema CHECK requires',
  adopted.every((r) => r.status === 'approved' && r.approvedBy === 'usr_registrar' && r.approvedAt === '2026-08-20T09:00:00Z'));

// ---------------------------------------------------------------------
// 7 · THE CONDITIONS, ONE BY ONE
// ---------------------------------------------------------------------
const report = await learnerAchievements(env, 'usr_learner');
const held = new Map(report.earned.map((e) => [e.code, e]));

const EXPECTED_EARNED = [
  ['first_work_marked', 'asub_1', '2026-05-01'],
  ['module_passed', 'asub_1', '2026-05-01'],
  ['level_modules_complete', 'asub_10', '2026-05-10'],
  ['competencies_all_marked', 'cmk_5', '2026-06-06'],
  ['competency_moderated', 'cmk_mod', '2026-06-09'],
  ['pronunciation_reassessed_higher', 'rec_2', '2026-05-20'],
  ['sustained_engagement', 'att_3', '2026-04-29'],
  ['level_award_1', 'awd_1', '2026-07-01'],
  ['first_distinction', 'awd_1', '2026-07-01'],
];
for (const [code, evidenceId, earnedOn] of EXPECTED_EARNED) {
  const got = held.get(code);
  check(`${code} is earned, from the row that earned it`,
    Boolean(got) && got.evidence.id === evidenceId,
    got ? got.evidence.id : 'not earned');
  check(`${code} is dated to its evidence (${earnedOn}), not to the day the sweep ran`,
    Boolean(got) && got.earnedOn === earnedOn, got ? got.earnedOn : '—');
}
check('the evidence source recorded on each milestone is its definition\'s own',
  report.earned.every((e) => e.evidence.source === REGISTER.find((d) => d.code === e.code).evidenceSource));
check('every one of them is recorded as the platform reading a fact, with no member of staff\'s name on it',
  report.earned.every((e) => e.awardedBy === null && e.recordedVia === 'platform'));

check('the five level awards not conferred are not earned, and nor is programme completion',
  !held.has('level_award_2') && !held.has('level_award_6') && !held.has('programme_complete'));

const unearned = new Map(report.unearned.map((u) => [u.code, u]));
check('programme completion reports one of six levels held, five outstanding',
  unearned.get('programme_complete').progress.observed === 1
  && unearned.get('programme_complete').progress.required === 6
  && unearned.get('programme_complete').detail.levelsOutstanding.join(',') === '2,3,4,5,6');
check('a level the learner has not reached says so, rather than reciting conditions they cannot act on',
  unearned.get('level_award_3').state === 'not_reached'
  && /not open on your record yet/.test(unearned.get('level_award_3').remaining.en));

// The negative pronunciation cases, each in its own record.
const pron = await learnerAchievements(env, 'usr_pron');
const pronCase = pron.unearned.find((u) => u.code === 'pronunciation_reassessed_higher');
check('a task assessed twice but not higher on every shared criterion is not earned, and says why',
  pronCase.state === 'not_yet_higher' && pronCase.progress.observed === 2
  && /not yet higher on every criterion/.test(pronCase.remaining.en));

const pron2 = await learnerAchievements(env, 'usr_pron2');
const pron2Case = pron2.unearned.find((u) => u.code === 'pronunciation_reassessed_higher');
check('a second recording not yet assessed is reported as awaiting the College, not as a shortfall',
  pron2Case.state === 'awaiting_second_assessment'
  && /awaiting assessment/.test(pron2Case.remaining.en));

// The fresh learner: everything unearned, and every route stated.
const fresh = await learnerAchievements(env, 'usr_fresh');
check('a learner with no work earns nothing and is refused nothing',
  fresh.earned.length === 0 && fresh.unearned.length === REGISTER.length);
const freshBy = new Map(fresh.unearned.map((u) => [u.code, u]));
check('a broken engagement run is counted at its longest, not at its total',
  freshBy.get('sustained_engagement').progress.observed === 2
  && freshBy.get('sustained_engagement').progress.required === 4
  && freshBy.get('sustained_engagement').progress.shortfall === 2);
check('no module complete reports zero of ten, not a fail',
  freshBy.get('level_modules_complete').progress.observed === 0
  && freshBy.get('level_modules_complete').progress.required === 10);
check('the level award they are enrolled at names the conditions the measurement engine names',
  freshBy.get('level_award_1').state === 'default'
  && freshBy.get('level_award_1').detail.conditions.length > 0
  && freshBy.get('level_award_1').detail.conditions.some((c) => c.id === 'level.gate.modules_complete'));
check('...and marks which of them are the College\'s outstanding work rather than the learner\'s',
  freshBy.get('level_award_1').detail.conditions.some((c) => c.owner === 'college'));
check('the competency milestone reads its requirement from the competencies table, not from the number six',
  freshBy.get('competencies_all_marked').progress.required === comps.length);

// ---------------------------------------------------------------------
// 8 · THE ATTEMPT THAT COUNTED AGREES WITH marks.js
// ---------------------------------------------------------------------
const CASES = [
  { label: 'one attempt', list: [{ id: 'a', percentage: 82, at: '2026-01-01' }] },
  { label: 'a pass, then a higher resit', list: [{ id: 'a', percentage: 75, at: '2026-01-01' }, { id: 'b', percentage: 95, at: '2026-02-01' }] },
  { label: 'a fail, then a pass', list: [{ id: 'a', percentage: 40, at: '2026-01-01' }, { id: 'b', percentage: 88, at: '2026-02-01' }] },
  { label: 'an unmarked latest attempt', list: [{ id: 'a', percentage: 40, at: '2026-01-01' }, { id: 'b', percentage: null, at: '2026-02-01' }] },
];
for (const c of CASES) {
  const picked = countingAttempt(c.list);
  const computed = marks.countingMarkForAttempts(c.list);
  const expected = computed.state === 'awaiting_marking'
    ? c.list[c.list.length - 1].percentage
    : (computed.capped ? marks.RESIT.markCap : computed.countingMark);
  check(`countingAttempt picks the row marks.js counted — ${c.label}`,
    picked !== null && (picked.percentage === expected
      || (computed.capped && picked.percentage >= marks.RESIT.markCap)),
    `${picked && picked.id}: ${picked && picked.percentage} vs ${computed.countingMark}`);
}
check('countingAttempt has nothing to pick from an empty list', countingAttempt([]) === null);

// ---------------------------------------------------------------------
// 9 · THE SWEEP RUNS TWICE, AND A PERSON'S REVOCATION STANDS
// ---------------------------------------------------------------------
const firstCount = (await all('SELECT id FROM learner_milestones WHERE user_id = ?', 'usr_learner')).length;
const again = await learnerAchievements(env, 'usr_learner');
check('running the sweep again awards nothing again',
  again.summary.awardedThisRequest === 0
  && (await all('SELECT id FROM learner_milestones WHERE user_id = ?', 'usr_learner')).length === firstCount,
  `${firstCount}`);

// New evidence satisfying an already-held, non-repeatable definition.
await run(`INSERT INTO competency_marks (id, submission_id, competency_id, mark, marked_by, source, created_at)
           VALUES ('cmk_mod2', 'asub_2', ?, 0.9, NULL, 'moderator', '2026-06-20T09:00:00.000Z')`, comps[1].id);
const afterMore = await learnerAchievements(env, 'usr_learner');
check('a second moderated mark does not earn a non-repeatable milestone a second time',
  afterMore.summary.awardedThisRequest === 0
  && afterMore.earned.filter((e) => e.code === 'competency_moderated').length === 1);

// The lapsed learner: award milestone earned, then the award revoked.
const lapsedBefore = await learnerAchievements(env, 'usr_lapsed');
check('the lapsed learner holds the Level I milestone before anything is revoked',
  lapsedBefore.earned.some((e) => e.code === 'level_award_1'));
await run(`UPDATE awards SET status = 'revoked', revoked_at = '2026-08-01', revoked_reason = 'Superseded' WHERE id = 'awd_x'`);
const lapsedAfter = await learnerAchievements(env, 'usr_lapsed');
const lapsedMilestone = lapsedAfter.earned.find((e) => e.code === 'level_award_1');
check('a milestone whose evidence no longer stands is NOT deleted by the sweep',
  Boolean(lapsedMilestone));
check('...and the fact that it no longer stands is shown rather than acted on',
  lapsedMilestone.evidenceStillStands === false);
check('...and no withdrawal was invented without a person and a reason',
  lapsedAfter.withdrawn.length === 0);

// A person revokes one, with a reason. It must never come back.
const revokedRow = (await all(
  `SELECT m.id AS id FROM learner_milestones m
     JOIN milestone_definitions d ON d.id = m.definition_id
    WHERE m.user_id = 'usr_learner' AND d.code = 'first_distinction'`))[0];
await run(`UPDATE learner_milestones SET revoked_at = '2026-08-15', revoked_reason = 'Award under review by the Registrar' WHERE id = ?`, revokedRow.id);
const afterRevocation = await learnerAchievements(env, 'usr_learner');
check('a revoked milestone is not re-awarded by the next sweep',
  afterRevocation.summary.awardedThisRequest === 0
  && !afterRevocation.earned.some((e) => e.code === 'first_distinction'));
check('...it is reported as withdrawn, carrying the reason a person gave',
  afterRevocation.withdrawn.some((w) => w.code === 'first_distinction'
    && w.revokedReason === 'Award under review by the Registrar'));
const sweepAround = await awardMilestones(env, 'usr_learner');
check('...and the sweep says out loud that it declined to award around the revocation',
  sweepAround.awarded.length === 0
  && sweepAround.skipped.some((s) => s.code === 'first_distinction' && /revocation/.test(s.reason)));

// ---------------------------------------------------------------------
// 10 · WHAT REMAINS — stated, in both editions, with nothing unfilled
// ---------------------------------------------------------------------
const everyUnearned = [...fresh.unearned, ...report.unearned, ...pron.unearned];
check('every unearned milestone states what remains, in English and in Arabic',
  everyUnearned.every((u) => typeof u.remaining.en === 'string' && u.remaining.en.length > 20
    && typeof u.remaining.ar === 'string' && u.remaining.ar.length > 10));
check('no rendered sentence leaks an unfilled placeholder',
  everyUnearned.every((u) => !/[{}]/.test(u.remaining.en) && !/[{}]/.test(u.remaining.ar)),
  (everyUnearned.find((u) => /[{}]/.test(u.remaining.en + u.remaining.ar)) || {}).code);
check('no Arabic sentence carries an English clause spliced into it',
  everyUnearned.every((u) => !/[A-Za-z]{4,}/.test(u.remaining.ar.replace(/[A-Z][a-z]?WEC/g, ''))),
  (everyUnearned.find((u) => /[A-Za-z]{4,}/.test(u.remaining.ar)) || {}).code);
check('every unearned milestone reports where the learner stands against what is asked',
  everyUnearned.every((u) => u.progress && u.progress.required !== undefined && u.progress.observed !== undefined));
check('every earned milestone carries the fact it marks, in both editions',
  report.earned.every((e) => e.academicFact.en && e.academicFact.ar && e.name.en && e.name.ar));
check('the notice travels on every payload, earned or not',
  Boolean(fresh.notice.statement.ar) && Boolean(report.notice.statement.ar));

// ---------------------------------------------------------------------
// 11 · THE ROUTE, WITH A REAL TOKEN
// ---------------------------------------------------------------------
const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });
async function token(sub) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const t = Math.floor(Date.now() / 1000);
  const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: t - 5, exp: t + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const BASE = 'https://wec-lc.test/api/student/achievements';
const get = (url, tok) => new Request(url, tok ? { headers: { Authorization: `Bearer ${tok}` } } : undefined);

check('GET /api/student/achievements refuses an unauthenticated caller',
  (await route.onRequestGet({ request: get(BASE), env })).status === 401);

const learnerTok = await token('sub_learner');
const freshTok = await token('sub_fresh');
const mine = await route.onRequestGet({ request: get(BASE, learnerTok), env });
const mineBody = await mine.json();
check('...and answers the signed-in learner with their own record',
  mine.status === 200 && mineBody.learner.userId === 'usr_learner' && mineBody.earned.length > 0);

const spoof = await route.onRequestGet({
  request: get(`${BASE}?userId=usr_learner&user=usr_learner&id=usr_learner`, freshTok), env,
});
const spoofBody = await spoof.json();
check('a user id in the query string is ignored entirely — the subject is the session',
  spoof.status === 200 && spoofBody.learner.userId === 'usr_fresh' && spoofBody.earned.length === 0);
check('...and the source takes no parameter path at all, so there is nothing to ignore incorrectly',
  /requireUser\(request, env\)/.test(routeSrc)
  && /learnerAchievements\(env, user\.id\)/.test(routeSrc)
  && !/params/.test(routeSrc) && !/searchParams/.test(routeSrc));
check('the endpoint exports a GET and nothing that mutates on a verb a link can reach',
  typeof route.onRequestGet === 'function'
  && !route.onRequestPost && !route.onRequestPatch && !route.onRequestDelete);

// ---------------------------------------------------------------------
// 12 · VALIDATION
// ---------------------------------------------------------------------
check('a milestone report demands a learner id rather than sweeping the whole register',
  await refused(() => learnerAchievements(env, ''), 'userId'));
check('...and refuses a non-string id rather than coercing it',
  await refused(() => learnerAchievements(env, 42), 'userId'));

await run(`INSERT INTO milestone_definitions (id, code, sequence, name, academic_fact, evidence_source, repeatable, status, approved_by, approved_at, created_at)
           VALUES ('mdf_hand', 'hand_written', 99, 'Added by hand', 'Somebody inserted this straight into the table.', 'awards', 0, 'approved', 'usr_registrar', '2026-08-20T09:00:00Z', '2026-08-20T09:00:00Z')`);
const withStray = await learnerAchievements(env, 'usr_learner');
check('a definition no rule in this build evaluates is reported, never silently inert',
  withStray.unevaluable.some((u) => u.code === 'hand_written'));
check('...and it awards nothing on the strength of existing',
  !withStray.earned.some((e) => e.code === 'hand_written'));

const retired = await approveMilestoneDefinition(env, { code: 'first_work_marked', actorId: 'usr_registrar', at: '2026-08-21T09:00:00Z' });
check('re-approving an approved definition records the new approver rather than failing',
  retired.approvedBy === 'usr_registrar' && retired.approvedAt === '2026-08-21T09:00:00Z');
await run(`UPDATE milestone_definitions SET status = 'retired' WHERE code = 'hand_written'`);
check('a retired definition is not approved back into force',
  await refused(() => approveMilestoneDefinition(env, { code: 'hand_written', actorId: 'usr_registrar' }), 'code'));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
