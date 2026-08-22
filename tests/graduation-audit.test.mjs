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
  check('Two of them are human acts the platform cannot verify',
    reqs.filter((r) => r.verifiable_from_record === 0).length === 2,
    reqs.filter((r) => r.verifiable_from_record === 0).map((r) => r.code).join(', '));
  check('...and those two are the pass list and the External Examiner',
    reqs.filter((r) => r.verifiable_from_record === 0).map((r) => r.code).sort().join(',')
      === 'EXTERNAL_EXAMINER,PASS_LIST');
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

  check('The pass list is cannot_check, not "met by default"',
    byCode.PASS_LIST.result === 'cannot_check', byCode.PASS_LIST.result);
  check('The External Examiner is cannot_check, and says why',
    byCode.EXTERNAL_EXAMINER.result === 'cannot_check'
      && /No External Examiner is appointed/.test(byCode.EXTERNAL_EXAMINER.observed),
    byCode.EXTERNAL_EXAMINER.observed);

  // This is the one.
  check('A learner who has done EVERYTHING still cannot graduate today',
    audit.outcome === 'not_met', audit.outcome);
  check('...because the External Examiner the College requires is not appointed',
    /EXTERNAL_EXAMINER \(cannot_check\)/.test(audit.summary), audit.summary);
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
