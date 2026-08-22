// A CERTIFICATE THE COLLEGE CANNOT SHOW WAS EARNED IS WORSE THAN NO
// CERTIFICATE.
//
// conferAward() was careful about the FORM of a conferral — the
// tamper-evident chain, the signature at the moment of conferral, the
// race between two conferrals extending the same link — and it never
// asked whether the learner earned anything. Title, CEFR level, credits
// and hours all arrived from the caller. A Mastery qualification could
// have been conferred on somebody who had completed nothing, and every
// safeguard would have recorded it faithfully, permanently, and falsely.
//
// The assertion this file exists for is the last one: A REAL AUDIT RUN
// TODAY CANNOT PASS. The WEQ framework requires an External Examiner's
// independent sign-off, none is appointed, and the framework says in
// its own adopted words that the College will not confer without one.
// That sentence is now the behaviour rather than the prose.
//
// If that assertion ever fails, either an External Examiner has been
// appointed — in which case the fixture in tests/helpers.mjs should be
// deleted and this file rewritten — or somebody has engineered around
// the College's own stated position.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const G = await import(loadUrl('functions/_lib/registry/graduation.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const T0 = Date.parse('2027-06-01T09:00:00.000Z');

function env() {
  const e = { DB: makeD1(schema) };
  e.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_l','clerk','ga1','l@example.com','student')`).bind().run();
  e.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_reg','clerk','ga2','r@example.com','admin')`).bind().run();
  return e;
}

/** A learner who has genuinely done everything the platform can see. */
function completeTheProgramme(e, { userId = 'usr_l', levelId = 1, modules = 3 } = {}) {
  for (let m = 1; m <= modules; m++) {
    e.DB.prepare(`INSERT INTO units (id, course_id, sequence, title)
      VALUES ('unt_g${m}','crs_level_${levelId}',${m},'Module ${m}')`).bind().run();
    e.DB.prepare(`INSERT INTO unit_progress (id, user_id, unit_id, status, completed_at)
      VALUES ('uprg_g${m}','${userId}','unt_g${m}','completed','2027-05-01T00:00:00Z')`).bind().run();
    e.DB.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
      VALUES ('itm_g${m}_asg','unt_g${m}',1,'assignment','Assignment ${m}')`).bind().run();
    e.DB.prepare(`INSERT INTO assignment_submissions
      (id, learning_item_id, user_id, content, status, grade, graded_at, graded_by, submitted_at)
      VALUES ('asub_g${m}','itm_g${m}_asg','${userId}','Work.','graded',0.82,'2027-05-10T00:00:00Z','usr_reg','2027-05-05T00:00:00Z')`).bind().run();
  }
  // The end-of-stage examination, passed comfortably.
  e.DB.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
    VALUES ('itm_g${modules}_examquiz','unt_g${modules}',2,'quiz','Stage examination')`).bind().run();
  e.DB.prepare(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at)
    VALUES ('qat_g','itm_g${modules}_examquiz','${userId}','[]',0.91,'2027-05-20T00:00:00Z')`).bind().run();
}

// --- The requirements come from what was already adopted --------------
{
  const e = env();
  const reqs = await G.requirements(e);
  check(`Five graduation requirements are defined — ${reqs.length}`, reqs.length === 5,
    reqs.map((r) => r.code).join(', '));
  check('Every one cites the adopted clause it comes from, rather than being invented',
    reqs.every((r) => r.basis && /migration 021/.test(r.basis)),
    reqs.filter((r) => !/migration 021/.test(r.basis || '')).map((r) => r.code).join(', '));
  // Migration 028 marked the pass list and the External Examiner as
  // unverifiable because there was nowhere for the platform to look.
  // Migration 029 built the registers, so all five are now checkable
  // from the record. They remain human ACTS — the audit observes them,
  // it cannot perform them — and each requirement's own description
  // says so.
  check('All five requirements are now checkable from the record',
    reqs.every((r) => r.verifiable_from_record === 1),
    reqs.filter((r) => r.verifiable_from_record !== 1).map((r) => r.code).join(', '));
  check('...and the two that are human acts still say so in their own words',
    reqs.filter((r) => /human act/i.test(r.description)).map((r) => r.code).sort().join(',')
      === 'EXTERNAL_EXAMINER,PASS_LIST',
    reqs.filter((r) => /human act/i.test(r.description)).map((r) => r.code).join(','));
  // Speaking is not a separate requirement: it already carries weight
  // inside the stage examination, and counting it twice would be
  // double-counting dressed as rigour.
  check('Speaking is not double-counted as a requirement of its own',
    !reqs.some((r) => /SPEAK/i.test(r.code)));
}

// --- A learner who has done nothing --------------------------------
{
  const e = env();
  const audit = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  check('An audit of a learner who has done nothing does not pass', audit.outcome === 'not_met', audit.outcome);
  check('...and says which requirements failed, not merely that it failed',
    /MODULES_COMPLETE/.test(audit.summary) && /EXAM_PASSED/.test(audit.summary), audit.summary);
  check('Every check records what the record actually showed',
    audit.checks.every((c) => c.observed && c.observed.length > 15),
    audit.checks.filter((c) => !c.observed).map((c) => c.code).join(', '));
}

// --- A learner who has genuinely done everything the platform sees ----
// THE ASSERTION THIS FILE EXISTS FOR.
{
  const e = env();
  completeTheProgramme(e);
  const audit = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', runBy: 'usr_reg', now: T0 });

  const byCode = Object.fromEntries(audit.checks.map((c) => [c.code, c]));
  check('Modules are seen as complete', byCode.MODULES_COMPLETE.result === 'met', byCode.MODULES_COMPLETE.observed);
  check('Assignments are seen as graded', byCode.ASSIGNMENTS_GRADED.result === 'met', byCode.ASSIGNMENTS_GRADED.observed);
  check('The examination is seen as passed', byCode.EXAM_PASSED.result === 'met', byCode.EXAM_PASSED.observed);
  check('...against the pass mark, quoted in the record',
    /pass mark of 70/.test(byCode.EXAM_PASSED.observed), byCode.EXAM_PASSED.observed);

  // Not "cannot_check" any more, and the improvement matters: the
  // answer now comes from an empty register rather than a hard-coded
  // sentence, so it will change by itself the day somebody is appointed.
  check('The pass list is not_met, because this learner is on no pass list',
    byCode.PASS_LIST.result === 'not_met' && /does not appear on any pass list/.test(byCode.PASS_LIST.observed),
    byCode.PASS_LIST.observed);
  check('The External Examiner is not_met, read from an empty register',
    byCode.EXTERNAL_EXAMINER.result === 'not_met'
      && /No External Examiner is appointed/.test(byCode.EXTERNAL_EXAMINER.observed),
    byCode.EXTERNAL_EXAMINER.observed);

  // This is the one.
  check('A learner who has done EVERYTHING still cannot graduate today',
    audit.outcome === 'not_met', audit.outcome);
  check('...because the External Examiner the College requires is not appointed',
    /EXTERNAL_EXAMINER \(not_met\)/.test(audit.summary), audit.summary);
  check('...and that is the only thing standing in the way',
    audit.checks.filter((c) => c.result !== 'met').map((c) => c.code).join(',')
      === 'PASS_LIST,EXTERNAL_EXAMINER',
    audit.checks.filter((c) => c.result !== 'met').map((c) => c.code).join(','));
}

// --- A near miss is not a pass ----------------------------------------
{
  const e = env();
  completeTheProgramme(e);
  // Ungrade one assignment: submitted, but never marked.
  e.DB.prepare(`UPDATE assignment_submissions SET grade = NULL, graded_at = NULL WHERE id = 'asub_g2'`).bind().run();
  const audit = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  const asg = audit.checks.find((c) => c.code === 'ASSIGNMENTS_GRADED');
  check('A submission without a mark is not a graded assignment',
    asg.result === 'not_met' && /2 of 3/.test(asg.observed), asg.observed);
}
{
  const e = env();
  completeTheProgramme(e);
  e.DB.prepare(`UPDATE quiz_attempts SET score = 0.69 WHERE id = 'qat_g'`).bind().run();
  const audit = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  const exam = audit.checks.find((c) => c.code === 'EXAM_PASSED');
  check('One mark below the pass mark is a fail, not a rounding question',
    exam.result === 'not_met' && /69/.test(exam.observed), exam.observed);
}
{
  const e = env();
  completeTheProgramme(e, { modules: 3 });
  e.DB.prepare(`UPDATE unit_progress SET status = 'in_progress', completed_at = NULL WHERE id = 'uprg_g3'`).bind().run();
  const audit = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  const mod = audit.checks.find((c) => c.code === 'MODULES_COMPLETE');
  check('Nine modules out of ten is not ten modules', mod.result === 'not_met' && /2 of 3/.test(mod.observed), mod.observed);
}

// --- An audit over a stage with no examination authored ---------------
{
  const e = env();
  e.DB.prepare(`INSERT INTO units (id, course_id, sequence, title)
    VALUES ('unt_x','crs_level_1',1,'A module')`).bind().run();
  const audit = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  const exam = audit.checks.find((c) => c.code === 'EXAM_PASSED');
  check('A stage with no examination reports cannot_check, not "passed"',
    exam.result === 'cannot_check' && /nothing to have passed/.test(exam.observed), exam.observed);
}

// --- THE PATH IS REAL, NOT A PERMANENT REFUSAL ------------------------
// This is the assertion that proves the College has built a route to
// its first qualification rather than a locked door with a sign on it.
//
// Everything above shows that nothing can be conferred today. If that
// were because the answer was hard-coded, the College would have
// engineered a refusal and called it integrity. So here the two human
// acts actually HAPPEN — an External Examiner is appointed and reports,
// a pass list is approved and countersigned — and the same audit, on
// the same learner, over the same records, passes.
//
// Nothing in sql/ appoints anybody. These rows exist only inside this
// test, and they are what the real appointment will look like.
{
  const e = env();
  completeTheProgramme(e);
  const run = (sql) => e.DB.prepare(sql).bind().run();

  const before = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  check('Before the appointment: not met', before.outcome === 'not_met', before.outcome);

  // The appointment. Conflicts declared — silence is what the schema
  // refuses, and "none" is itself a declaration.
  run(`INSERT INTO external_examiners
    (id, full_name, affiliation, level_id, appointed_by, appointed_at, term_ends, conflicts_declared)
    VALUES ('exex_1','An Appointed Examiner','A university that is not this one',1,
            'Academic Senate','2027-01-01T00:00:00Z','2031-01-01T00:00:00Z',
            'None declared: no teaching, consultancy or family relationship with the College or its staff.')`);
  const appointedOnly = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  const ex1 = appointedOnly.checks.find((c) => c.code === 'EXTERNAL_EXAMINER');
  check('An appointment alone is not a sign-off',
    ex1.result === 'not_met' && /signs nothing off/.test(ex1.observed), ex1.observed);

  run(`INSERT INTO external_examiner_reports
    (id, examiner_id, level_id, period_start, period_end, received_at, judgement, findings)
    VALUES ('exrep_1','exex_1',1,'2027-01-01T00:00:00Z','2027-06-30T00:00:00Z','2027-07-15T00:00:00Z',
            'standards_met','Marking is consistent with the published rubric and the standard is appropriate to A1.')`);

  const noList = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  check('With a report, the External Examiner requirement is met',
    noList.checks.find((c) => c.code === 'EXTERNAL_EXAMINER').result === 'met');
  check('...but the pass list still stands in the way', noList.outcome === 'not_met'
    && /PASS_LIST/.test(noList.summary), noList.summary);

  // Approved but NOT countersigned. One signature is an assertion.
  run(`INSERT INTO pass_lists (id, reference, level_id, period_start, period_end, approved_by, approved_at)
    VALUES ('pl_1','PL-2027-L1',1,'2027-01-01T00:00:00Z','2027-06-30T00:00:00Z','usr_reg','2027-07-01T00:00:00Z')`);
  run(`INSERT INTO pass_list_entries (id, pass_list_id, user_id, outcome)
    VALUES ('ple_1','pl_1','usr_l','pass')`);
  const oneSig = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', now: T0 });
  const pl1 = oneSig.checks.find((c) => c.code === 'PASS_LIST');
  check('An approved but uncountersigned pass list does not satisfy the requirement',
    pl1.result === 'not_met' && /One signature is an assertion/.test(pl1.observed), pl1.observed);

  e.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_dir','clerk','ga3','d@example.com','admin')`).bind().run();
  run(`UPDATE pass_lists SET countersigned_by = 'usr_dir', countersigned_at = '2027-07-02T00:00:00Z' WHERE id = 'pl_1'`);

  const after = await G.runGraduationAudit(e, { userId: 'usr_l', levelId: 1, awardCode: 'ECIC', runBy: 'usr_reg', now: T0 });
  check('AND THEN IT PASSES — the refusal was the record, not a hard-coded answer',
    after.outcome === 'met', `${after.outcome}: ${after.summary}`);
  check('...with every one of the five requirements met',
    after.checks.length === 5 && after.checks.every((c) => c.result === 'met'),
    after.checks.filter((c) => c.result !== 'met').map((c) => `${c.code}=${c.result}`).join(', '));
  check('...and a summary that says so',
    /All 5 graduation requirements are met/.test(after.summary), after.summary);
}

// --- The refusals the examining register enforces ----------------------
{
  const e = env();
  const refuses = (label, fn) => { let t = false; try { fn(); } catch { t = true; } check(label, t); };
  const run = (sql) => e.DB.prepare(sql).bind().run();

  refuses('An examiner appointed with no declared conflicts is refused — silence is not "none"', () =>
    run(`INSERT INTO external_examiners (id, full_name, affiliation, appointed_by, appointed_at, term_ends, conflicts_declared)
      VALUES ('exex_x','Someone','Somewhere','Senate','2027-01-01T00:00:00Z','2031-01-01T00:00:00Z','   ')`));
  refuses('An examiner with no stated affiliation is refused — external to what?', () =>
    run(`INSERT INTO external_examiners (id, full_name, affiliation, appointed_by, appointed_at, term_ends, conflicts_declared)
      VALUES ('exex_y','Someone','  ','Senate','2027-01-01T00:00:00Z','2031-01-01T00:00:00Z','None.')`));

  run(`INSERT INTO external_examiners (id, full_name, affiliation, appointed_by, appointed_at, term_ends, conflicts_declared)
    VALUES ('exex_ok','An Examiner','Another university','Senate','2027-01-01T00:00:00Z','2031-01-01T00:00:00Z','None declared.')`);
  refuses('A report with conditions and no College response is refused — filing is not answering', () =>
    run(`INSERT INTO external_examiner_reports
      (id, examiner_id, period_start, period_end, received_at, judgement, findings)
      VALUES ('exrep_x','exex_ok','2027-01-01T00:00:00Z','2027-06-30T00:00:00Z','2027-07-01T00:00:00Z',
              'standards_met_with_conditions','Rubric application is inconsistent between markers.')`));
  refuses('...and so is a report judging standards NOT met with no response', () =>
    run(`INSERT INTO external_examiner_reports
      (id, examiner_id, period_start, period_end, received_at, judgement, findings)
      VALUES ('exrep_y','exex_ok','2027-01-01T00:00:00Z','2027-06-30T00:00:00Z','2027-07-01T00:00:00Z',
              'standards_not_met','The standard is below the claimed CEFR band.')`));

  // A pass list countersigned by the person who approved it.
  e.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_one','clerk','ga9','o@example.com','admin')`).bind().run();
  refuses('A pass list countersigned by its own approver is refused', () =>
    run(`INSERT INTO pass_lists (id, reference, level_id, period_start, period_end,
      approved_by, approved_at, countersigned_by, countersigned_at)
      VALUES ('pl_x','PL-X',1,'2027-01-01T00:00:00Z','2027-06-30T00:00:00Z',
              'usr_one','2027-07-01T00:00:00Z','usr_one','2027-07-01T00:00:00Z')`));

  // Moderation.
  e.DB.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_m','crs_level_1',99,'M')`).bind().run();
  e.DB.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
    VALUES ('itm_m','unt_m',1,'assignment','A')`).bind().run();
  e.DB.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade, graded_at, graded_by, submitted_at)
    VALUES ('asub_m','itm_m','usr_l','graded',0.7,'2027-05-01T00:00:00Z','usr_reg','2027-04-01T00:00:00Z')`).bind().run();
  refuses('A moderator who is the first marker is refused', () =>
    run(`INSERT INTO moderation_records (id, submission_id, first_marker, first_mark, moderator, moderator_mark, moderated_at, agreed_mark)
      VALUES ('mod_x','asub_m','usr_reg',0.7,'usr_reg',0.7,'2027-05-02T00:00:00Z',0.7)`));
  refuses('Two different marks with no stated resolution are refused', () =>
    run(`INSERT INTO moderation_records (id, submission_id, first_marker, first_mark, moderator, moderator_mark, moderated_at, agreed_mark)
      VALUES ('mod_y','asub_m','usr_reg',0.7,'usr_l',0.55,'2027-05-02T00:00:00Z',0.62)`));
  let ok = true;
  try {
    run(`INSERT INTO moderation_records (id, submission_id, first_marker, first_mark, moderator, moderator_mark, moderated_at, agreed_mark, resolution)
      VALUES ('mod_ok','asub_m','usr_reg',0.7,'usr_l',0.55,'2027-05-02T00:00:00Z',0.62,
              'Discussed against the rubric; the middle band was applied. Agreed by both markers.')`);
  } catch (err) { ok = false; console.log('   ' + err.message); }
  check('A divergence that says how it was settled records cleanly', ok);
}

// --- The convention the exam check depends on -------------------------
// checkOne() identifies the end-of-stage examination by an id
// containing 'examquiz'. That is a naming convention, not a data model,
// and it is a real weakness: if a level's examination were ever named
// differently, the check would return cannot_check, the audit would
// fail safe — and nobody could graduate from that level for a reason
// invisible to everyone involved.
//
// Failing safe is the right default. Failing safe INVISIBLY is not. So
// the convention the audit leans on is asserted here against the real
// seeded curriculum, and if a future level breaks it this fails loudly
// instead of quietly making that level ungraduatable.
{
  const seeded = new DatabaseSync(':memory:');
  seeded.exec(schema);
  let loaded = 0;
  for (let n = 1; n <= 6; n++) {
    try {
      seeded.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
      loaded += 1;
    } catch { /* a level not yet authored is reported by the count below */ }
  }
  check(`All six levels of curriculum load — ${loaded}`, loaded === 6, loaded);

  const rows = seeded.prepare(
    `SELECT u.course_id AS course, COUNT(*) AS n
       FROM learning_items i JOIN units u ON u.id = i.unit_id
      WHERE i.id LIKE '%examquiz%' GROUP BY 1`).all();
  check('Every level has exactly one identifiable stage examination', rows.length === 6
    && rows.every((r) => r.n === 1),
    rows.map((r) => `${r.course}:${r.n}`).join(', ') || 'none found');
}

// --- Refusals ---------------------------------------------------------
{
  const e = env();
  const ghost = await throws(() => G.runGraduationAudit(e, { userId: 'nobody', levelId: 1, awardCode: 'ECIC' }));
  check('An audit of a person who does not exist is refused', ghost && ghost.name === 'NotFoundError');
  const bare = await throws(() => G.runGraduationAudit(e, { userId: 'usr_l' }));
  check('An audit with no level or award code is refused', bare && bare.name === 'ValidationError');
}

// --- The register ships clean -----------------------------------------
{
  const e = env();
  check('The College ships no graduation audits', 
    e.DB.prepare('SELECT COUNT(*) AS n FROM graduation_audits').bind().first().n === 0);
  check('...no conferrals',
    e.DB.prepare('SELECT COUNT(*) AS n FROM conferrals').bind().first().n === 0);
  const unaudited = await G.unauditedAwards(e);
  check('...and no award anywhere without a conferral behind it', unaudited.length === 0,
    unaudited.map((a) => a.id).join(', '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
