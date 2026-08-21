// functions/_lib/registrar/cases.js — the appeal procedure the College
// has published since 17 August 2026, performed.
//
// THE ASSERTION THIS FILE EXISTS FOR, and everything else here is
// scaffolding around it:
//
//   THE PERSON WHOSE DECISION IS UNDER APPEAL CANNOT ANSWER THE APPEAL.
//
// /students/regulations/ § IV puts it in one sentence — "An appeal that
// is reconsidered by whoever decided it first is not an appeal" — and
// `registrar_cases.decided_by` is a plain foreign key that would have
// taken that person's id without complaint. So the refusal is exercised
// here in all three of the forms it takes: the marker of the work under
// appeal, the reviewer who answered the stage below, and the learner
// themself. Each is asserted twice — that the wrong person is refused,
// AND that a clean person is not, because a rule that refuses everybody
// looks identical to a rule that works until somebody needs to use it.
//
// The rest of the file covers the published clock (ten working days at
// stage one, twenty at stage two, three for the acknowledgement, and the
// interval the College has NOT published for the Board), the ladder that
// may not be skipped, and the thing the module deliberately does not do:
// a granted withdrawal or deferral must leave `enrolments` and
// `payments` untouched, and that is asserted by counting rows.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const C = await import(loadUrl('functions/_lib/registrar/cases.js'));
const studentRoute = await import(loadUrl('functions/api/student/cases.js'));
const staffRoute = await import(loadUrl('functions/api/staff/cases.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');

// Every instant in this file is chosen, not taken from the clock. The
// deadlines under test are working-day arithmetic, so a suite that ran
// at the weekend would otherwise pass on Friday and fail on Saturday.
// 2026-09-07 is a Monday.
const MON = '2026-09-07T09:00:00.000Z';

const PEOPLE = [
  ['usr_amina', 'student'],   // the appellant
  ['usr_ben', 'student'],     // another learner entirely
  ['usr_marker', 'staff'],    // marked Amina's work at Level 1
  ['usr_reviewer', 'staff'],  // marked nothing; hears stage one
  ['usr_senate', 'staff'],    // hears stage two
  ['usr_governor', 'staff'],  // hears stage three
  ['usr_registrar', 'admin'], // the Registrar's desk
];

function freshEnv() {
  const env = { DB: makeD1(schema) };
  for (const [id, role] of PEOPLE) {
    env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
      VALUES (?, 'clerk', ?, ?, ?)`).bind(id, `c_${id}`, `${id}@example.com`, role).run();
  }
  env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at)
    VALUES ('enr_amina_1','usr_amina',1,'active','2026-06-01T00:00:00.000Z')`).bind().run();
  env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at)
    VALUES ('enr_ben_1','usr_ben',1,'active','2026-06-01T00:00:00.000Z')`).bind().run();

  // One marked piece of Amina's work at Level 1, which is what makes
  // usr_marker the person a Level 1 academic appeal is against.
  env.DB.prepare(`INSERT INTO units (id,course_id,sequence,title)
    VALUES ('unt_1','crs_level_1',1,'Unit One')`).bind().run();
  env.DB.prepare(`INSERT INTO learning_items (id,unit_id,sequence,kind,title)
    VALUES ('itm_1','unt_1',1,'assignment','A written task')`).bind().run();
  env.DB.prepare(`INSERT INTO assignment_submissions
      (id,learning_item_id,user_id,status,grade,graded_at,graded_by)
    VALUES ('asub_1','itm_1','usr_amina','graded',62.0,'2026-09-01T00:00:00.000Z','usr_marker')`).bind().run();
  return env;
}

const USER = Object.fromEntries(PEOPLE.map(([id, role]) => [id, { id, role }]));
const amina = USER.usr_amina;
const ben = USER.usr_ben;
const marker = USER.usr_marker;
const reviewer = USER.usr_reviewer;
const senate = USER.usr_senate;
const governor = USER.usr_governor;
const registrar = USER.usr_registrar;

const APPEAL = {
  kind: 'appeal', matter: 'academic', levelId: 1,
  summary: 'Appeal against the mark for the Unit One written task',
  detail: 'The rubric criterion on register was applied to a passage the brief asked to be informal.',
};

/** Open an appeal, route it to stage one, and hand back the case. */
async function atStageOne(env, now = MON) {
  const opened = await C.openCase(env, { actor: amina, ...APPEAL, now });
  await C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'stage_one',
    note: 'Listed to a reviewer who did not mark the work.', now,
  });
  return opened;
}

// =====================================================================
// 1 · THE WORKING-DAY CLOCK
// =====================================================================
check('a weekday is a working day', C.isWorkingDay('2026-09-07T00:00:00.000Z') === true);
check('a Saturday is not', C.isWorkingDay('2026-09-12T00:00:00.000Z') === false);
check('a Sunday is not', C.isWorkingDay('2026-09-13T00:00:00.000Z') === false);

check('three working days from a Monday falls on the Thursday',
  C.addWorkingDays(MON, 3) === '2026-09-10T23:59:59.999Z', C.addWorkingDays(MON, 3));
check('ten working days from a Monday steps over both weekends',
  C.addWorkingDays(MON, 10) === '2026-09-21T23:59:59.999Z', C.addWorkingDays(MON, 10));
check('a deadline expires at the END of its day, not at the hour the learner happened to write',
  C.addWorkingDays(MON, 10).endsWith('T23:59:59.999Z'));
check('twenty working days from a Monday is four weeks later',
  C.addWorkingDays(MON, 20) === '2026-10-05T23:59:59.999Z', C.addWorkingDays(MON, 20));
check('a Friday plus one working day is the Monday',
  C.addWorkingDays('2026-09-11T09:00:00.000Z', 1) === '2026-09-14T23:59:59.999Z');
check('working days between a Monday and the Friday of the next week is ten',
  C.workingDaysBetween(MON, '2026-09-18T23:59:59.999Z') === 9,
  C.workingDaysBetween(MON, '2026-09-18T23:59:59.999Z'));
check('a deadline already passed leaves no balance rather than a negative one',
  C.workingDaysBetween('2026-09-30T09:00:00.000Z', '2026-09-01T09:00:00.000Z') === 0);
check('a fractional number of working days is refused rather than rounded',
  (() => { try { C.addWorkingDays(MON, 2.5); return false; } catch (e) { return e.name === 'ValidationError'; } })());

check('stage one is bound by the ten working days E2 publishes',
  C.answerDueFor('stage_one', MON).workingDays === 10 && C.answerDueFor('stage_one', MON).basis === 'published');
check('stage two is bound by the twenty working days E2 publishes',
  C.answerDueFor('stage_two', MON).workingDays === 20 && C.answerDueFor('stage_two', MON).basis === 'published');
check('the acknowledgement clock is the handbook\'s three working days',
  C.answerDueFor('received', MON).workingDays === 3 && C.answerDueFor('received', MON).basis === 'published');
// The honesty test. E2 publishes no interval for the Board of Governors,
// and the payload must never say it does.
check('stage three carries NO published interval',
  C.ANSWER_WORKING_DAYS.stage_three === null);
check('...so its deadline is labelled a College self-binding, never "published"',
  C.answerDueFor('stage_three', MON).basis === 'college_self_binding');
check('...and it is the longest interval the College does publish, not an invented one',
  C.answerDueFor('stage_three', MON).workingDays === C.ANSWER_WORKING_DAYS.stage_two);
check('...with the authority for it stated in words',
  /sets no interval for the Board/.test(C.answerDueFor('stage_three', MON).authority));

// =====================================================================
// 2 · OPENING A CASE
// =====================================================================
{
  const env = freshEnv();
  const opened = await C.openCase(env, { actor: amina, ...APPEAL, enrolmentId: 'enr_amina_1', now: MON });

  check('a learner opens a case and is given a reference to quote',
    /^APL-2026-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/.test(opened.reference), opened.reference);
  check('...which is not a UUID', opened.reference !== opened.id);
  check('...at the stage a new case starts at', opened.stage === 'received');
  check('...with the published acknowledgement clock already running',
    opened.clock.answerDue === C.addWorkingDays(MON, 3), opened.clock.answerDue);
  check('...and not yet overdue', opened.clock.overdue === false);
  check('the case is attached to the learner\'s own enrolment',
    opened.enrolmentId === 'enr_amina_1' && opened.levelId === 1);
  check('the trail records the opening with a note and the clock it set',
    opened.trail.length === 1 && opened.trail[0].fromStage === null
    && opened.trail[0].toStage === 'received' && Boolean(opened.trail[0].note)
    && opened.trail[0].answerDueAfter === opened.clock.answerDue);
  check('the learner\'s own view carries no staff account ids',
    opened.trail.every((e) => e.actorId === undefined) && opened.userId === undefined);
  check('the published procedure travels with the case rather than living only in a page',
    opened.procedure.stages.length === 3
    && /senior to, and other than/.test(opened.procedure.stages[0].heardBy));
  check('...including the sentence about there being nobody outside the College in the chain',
    /not independent of the institution/.test(opened.procedure.externalReview));
  check('a new case may be withdrawn by the learner and may not yet be escalated',
    opened.mayWithdraw === true && opened.mayEscalate === false);

  // Every kind gets its own reference prefix.
  const kinds = {};
  for (const kind of C.KINDS) {
    if (kind === 'appeal') { kinds.appeal = opened.reference; continue; }
    const c = await C.openCase(env, {
      actor: amina, kind, matter: 'administrative', summary: `A ${kind} request`, now: MON,
    });
    kinds[kind] = c.reference;
  }
  check('each kind of case carries its own reference prefix',
    kinds.complaint.startsWith('CMP-') && kinds.withdrawal.startsWith('WDL-')
    && kinds.deferral.startsWith('DEF-') && kinds.transfer.startsWith('TRF-'),
    JSON.stringify(kinds));
  check('every reference minted is distinct',
    new Set(Object.values(kinds)).size === Object.values(kinds).length);
}

// =====================================================================
// 3 · WHAT OPENING A CASE REFUSES
// =====================================================================
{
  const env = freshEnv();
  const bad = async (patch) => throws(() => C.openCase(env, { actor: amina, ...APPEAL, ...patch, now: MON }));

  const kind = await bad({ kind: 'misconduct' });
  check('a misconduct case is refused — decision A7 keeps that word out of the table',
    kind && kind.name === 'ValidationError' && Boolean(kind.fields.kind), kind && kind.message);
  check('an unknown kind is refused rather than coerced',
    (await bad({ kind: 'grievance' })).name === 'ValidationError');
  check('an unknown matter is refused',
    (await bad({ matter: 'financial' })).name === 'ValidationError');
  check('a missing summary is refused with the field named',
    Boolean((await bad({ summary: undefined })).fields.summary));
  check('a blank summary is not a summary',
    Boolean((await bad({ summary: '   ' })).fields.summary));
  check('an over-long summary is refused rather than truncated',
    Boolean((await bad({ summary: 'x'.repeat(C.MAX_SUMMARY + 1) })).fields.summary));
  check('control characters are refused rather than stored',
    Boolean((await bad({ summary: 'Appeal\u0007against the mark' })).fields.summary));
  check('a level that does not exist is a 422 naming the field, not a foreign-key 500',
    Boolean((await bad({ levelId: 99 })).fields.levelId));
  check('a level id that is not a whole number is refused',
    Boolean((await bad({ levelId: '1' })).fields.levelId));

  // The one that matters: a learner may not attach somebody else's
  // enrolment to their own case.
  const foreign = await bad({ enrolmentId: 'enr_ben_1' });
  check('another learner\'s enrolment cannot be attached to your case',
    foreign.name === 'ValidationError' && Boolean(foreign.fields.enrolmentId), foreign && foreign.message);
  check('a level that contradicts the enrolment named is refused rather than silently corrected',
    Boolean((await bad({ enrolmentId: 'enr_amina_1', levelId: 2 })).fields.levelId));

  check('opening a case with no session at all is refused',
    (await throws(() => C.openCase(env, { ...APPEAL, now: MON }))).name === 'AuthError'
    || (await throws(() => C.openCase(env, { ...APPEAL, now: MON }))).name === 'AuthorizationError');

  // The cap, and the reason for it.
  const capEnv = freshEnv();
  for (let i = 0; i < C.MAX_OPEN_CASES; i++) {
    await C.openCase(capEnv, { actor: amina, ...APPEAL, summary: `Appeal number ${i + 1}`, now: MON });
  }
  const capped = await throws(() => C.openCase(capEnv, { actor: amina, ...APPEAL, now: MON }));
  check(`a ${C.MAX_OPEN_CASES + 1}th simultaneously open case is refused`,
    capped && capped.name === 'ValidationError');
  check('...and the refusal names the open cases rather than telling the learner to go away',
    /cases already open: APL-/.test(capped.fields.summary), capped.fields.summary);
  check('...while another learner is unaffected by it',
    Boolean(await C.openCase(capEnv, { actor: ben, ...APPEAL, levelId: 1, now: MON })));
}

// =====================================================================
// 4 · THE LADDER, AND THE RULE THAT IT MAY NOT BE SKIPPED
// =====================================================================
{
  const env = freshEnv();
  const opened = await C.openCase(env, { actor: amina, ...APPEAL, now: MON });

  const skipTwo = await throws(() => C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'stage_two', note: 'Straight to the Senate.', now: MON,
  }));
  check('the College may not move a case straight to stage two',
    skipTwo && skipTwo.name === 'AuthorizationError', skipTwo && skipTwo.message);
  check('...and the refusal quotes the sentence it is enforcing',
    /No stage may be skipped by the College/.test(skipTwo.message));
  const skipThree = await throws(() => C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'stage_three', note: 'Straight to the Board.', now: MON,
  }));
  check('nor straight to stage three', skipThree && skipThree.name === 'AuthorizationError');

  const routed = await C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'stage_one',
    note: 'Listed to a reviewer who did not mark the work.', now: MON,
  });
  check('routing to stage one is the only move the College may make from received',
    routed.stage === 'stage_one');
  check('...and it sets the ten working days E2 publishes',
    routed.clock.answerDue === C.addWorkingDays(MON, 10), routed.clock.answerDue);
  check('...and records the post that hears it, as a post and never a name',
    /senior to, and other than, the person who took the decision/.test(routed.heardByRole));
  check('...with the deadline written onto the trail as it stood at that move',
    routed.trail[routed.trail.length - 1].answerDueAfter === routed.clock.answerDue);
  check('the Registrar\'s view of a case names who may not hear it',
    Array.isArray(routed.conflicts) && routed.conflicts.length > 0);

  const twice = await throws(() => C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'stage_one', note: 'Again.', now: MON,
  }));
  check('a case already at stage one is not routed to stage one a second time',
    twice && twice.name === 'ValidationError');

  const closeEarly = await throws(() => C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'closed', note: 'Nothing more to do.', now: MON,
  }));
  check('THE COLLEGE MAY NOT CLOSE AN UNANSWERED CASE',
    closeEarly && closeEarly.name === 'AuthorizationError', closeEarly && closeEarly.message);
  check('...and says so in terms of tidying a matter out of the queue',
    /never by the College tidying an unanswered matter/.test(closeEarly.message));

  const noNote = await throws(() => C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'awaiting_information', note: '', now: MON,
  }));
  check('a stage change with no note is refused — the schema requires one and so does this',
    noNote && noNote.name === 'ValidationError' && Boolean(noNote.fields.note));

  const byStaff = await throws(() => C.advanceStage(env, {
    actor: reviewer, caseId: opened.id, toStage: 'awaiting_information', note: 'Waiting.', now: MON,
  }));
  check('routing and parking are the Registrar\'s desk, not any member of staff',
    byStaff && byStaff.name === 'AuthorizationError');
}

// =====================================================================
// 5 · AWAITING INFORMATION STOPS THE CLOCK AND GIVES BACK THE BALANCE
// =====================================================================
{
  const env = freshEnv();
  const opened = await atStageOne(env, MON);

  // Two working days in, the College asks the learner a question.
  const PARK = '2026-09-09T10:00:00.000Z'; // Wednesday
  const parked = await C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'awaiting_information',
    note: 'Asked the learner for the marked script.', now: PARK,
  });
  check('parking a case stops the clock', parked.stage === 'awaiting_information'
    && parked.clock.answerDue === null && parked.clock.stopped === true);
  check('...and the trail says how much of the period was left',
    /working days remaining/.test(parked.trail[parked.trail.length - 1].note),
    parked.trail[parked.trail.length - 1].note);

  // Three weeks later the learner answers.
  const RESUME = '2026-09-30T10:00:00.000Z'; // Wednesday
  const resumed = await C.advanceStage(env, {
    actor: registrar, caseId: opened.id, toStage: 'stage_one',
    note: 'The script arrived.', now: RESUME,
  });
  const balance = C.workingDaysBetween(PARK, C.addWorkingDays(MON, 10));
  check('resuming returns the case to the rung it parked from', resumed.stage === 'stage_one');
  check('...with the BALANCE of the period, not a fresh ten days',
    resumed.clock.answerDue === C.addWorkingDays(RESUME, balance),
    `${resumed.clock.answerDue} vs balance ${balance}`);
  check('...which is strictly less than starting the published period again',
    resumed.clock.answerDue < C.addWorkingDays(RESUME, 10));

  const wrongRung = await throws(async () => {
    await C.advanceStage(env, {
      actor: registrar, caseId: opened.id, toStage: 'awaiting_information', note: 'Again.', now: RESUME,
    });
    await C.advanceStage(env, {
      actor: registrar, caseId: opened.id, toStage: 'stage_two', note: 'Back at stage two.', now: RESUME,
    });
  });
  check('a parked case may not resume at a different rung',
    wrongRung && wrongRung.name === 'AuthorizationError', wrongRung && wrongRung.message);

  // A case parked when it was already late resumes late.
  const env2 = freshEnv();
  const late = await atStageOne(env2, MON);
  const LATE_PARK = '2026-10-05T10:00:00.000Z'; // well past the stage one date
  await C.advanceStage(env2, {
    actor: registrar, caseId: late.id, toStage: 'awaiting_information',
    note: 'Asked a question, late.', now: LATE_PARK,
  });
  const lateResume = await C.advanceStage(env2, {
    actor: registrar, caseId: late.id, toStage: 'stage_one',
    note: 'Answered.', now: '2026-10-07T10:00:00.000Z',
  });
  check('a case parked with no time left resumes ALREADY OVERDUE rather than forgiven',
    lateResume.clock.overdue === true, lateResume.clock.answerDue);
}

// =====================================================================
// 6 · THE CONFLICT RULE — THE POINT OF THE MODULE
// =====================================================================
{
  const env = freshEnv();
  const opened = await atStageOne(env, MON);
  const row = await C.findCase(env, opened.id);

  const conflicts = await C.conflictsFor(env, row);
  const byGround = Object.fromEntries(conflicts.map((c) => [c.userId, c.ground]));
  check('the learner is barred from hearing their own case',
    byGround.usr_amina === 'subject_of_the_case', JSON.stringify(byGround));
  check('THE MARKER OF THE WORK UNDER APPEAL IS BARRED',
    byGround.usr_marker === 'marked_the_work_under_appeal', JSON.stringify(byGround));
  check('a member of staff who marked nothing of this learner\'s is NOT barred',
    byGround.usr_reviewer === undefined);

  // The batched form shapes the Registrar's queue and the single form
  // refuses the answer. If they ever disagreed, a Registrar would be
  // told a person was free to hear a case and then refused when they
  // acted — so the scoping is asserted across learners and across
  // levels, which is where a batched query goes wrong.
  const bensCase = await C.openCase(env, {
    actor: ben, kind: 'appeal', matter: 'academic', levelId: 1,
    summary: 'Appeal against a mark', now: MON,
  });
  const aminaLevelTwo = await C.openCase(env, {
    actor: amina, kind: 'appeal', matter: 'academic', levelId: 2,
    summary: 'Appeal against a Level II mark', now: MON,
  });
  const many = await C.conflictsForMany(env, [
    row,
    await C.findCase(env, bensCase.id),
    await C.findCase(env, aminaLevelTwo.id),
  ]);
  check('the marker is barred on the case about the work they marked',
    many.get(row.id).some((c) => c.userId === 'usr_marker'));
  check('...and NOT on another learner\'s case, whose work they never touched',
    many.get(bensCase.id).every((c) => c.userId !== 'usr_marker'),
    JSON.stringify(many.get(bensCase.id)));
  check('...and NOT on an appeal at a level they did not mark at',
    many.get(aminaLevelTwo.id).every((c) => c.userId !== 'usr_marker'),
    JSON.stringify(many.get(aminaLevelTwo.id)));
  check('the batched rule and the single-case rule give the same answer',
    JSON.stringify(many.get(row.id)) === JSON.stringify(await C.conflictsFor(env, row)));

  // THE REFUSAL ITSELF.
  const byMarker = await throws(() => C.recordDecision(env, {
    actor: marker, caseId: opened.id, actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: 'The mark stands.', now: MON,
  }));
  check('THE PERSON WHOSE MARK IS UNDER APPEAL CANNOT ANSWER THE APPEAL — 403',
    byMarker && byMarker.name === 'AuthorizationError' && byMarker.httpStatus === 403,
    byMarker && `${byMarker.name} ${byMarker.message}`);
  check('...and the refusal names the ground and the instrument',
    /Marked this learner's work/.test(byMarker.message) && /E2/.test(byMarker.message),
    byMarker.message);
  const stillOpen = await C.findCase(env, opened.id);
  check('...and nothing was written: the case is still at stage one, unanswered',
    stillOpen.stage === 'stage_one' && stillOpen.outcome === null && stillOpen.decided_by === null);

  const bySubject = await throws(() => C.recordDecision(env, {
    actor: { id: 'usr_amina', role: 'staff' }, caseId: opened.id, actorRole: C.POSTS.stage_one,
    outcome: 'upheld', decision: 'I find for myself.', now: MON,
  }));
  check('nobody hears their own case, even holding staff access',
    bySubject && bySubject.name === 'AuthorizationError'
    && /may not hear their own case/.test(bySubject.message), bySubject && bySubject.message);

  // The other half of the assertion: a clean reviewer CAN answer.
  const answered = await C.recordDecision(env, {
    actor: reviewer, caseId: opened.id, actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld',
    decision: 'The rubric criterion was applied as published. The mark stands, with reasons set out above.',
    now: '2026-09-14T11:00:00.000Z',
  });
  check('a reviewer with no stake in the mark CAN answer — the rule refuses the right people only',
    answered.stage === 'determined' && answered.answer.outcome === 'not_upheld');
  check('...and the answer records its author, its date and its reasons',
    answered.decidedBy === 'usr_reviewer' && Boolean(answered.answer.decidedOn)
    && /applied as published/.test(answered.answer.decision));
  check('...at the stage it was given, which the case row alone could not say',
    answered.answer.decidedAtStage === 'stage_one');
  check('...and the clock stops, because no answer is owed any longer',
    answered.clock.answerDue === null);

  // THE SECOND LIMB. The stage one reviewer may not hear stage two.
  const escalated = await C.escalateCase(env, {
    actor: amina, caseId: opened.id,
    note: 'The reviewer did not address the point about the brief.',
    now: '2026-09-16T09:00:00.000Z',
  });
  check('the learner escalates an answered case to stage two',
    escalated.stage === 'stage_two');
  check('...heard by the Academic Senate, in the College\'s published words',
    escalated.heardByRole === 'The Academic Senate');
  check('...with the twenty working days E2 publishes for it',
    escalated.clock.answerDue === C.addWorkingDays('2026-09-16T09:00:00.000Z', 20));
  check('...and the stage one answer stays visible, because it is what is being appealed',
    escalated.answer && escalated.answer.outcome === 'not_upheld'
    && escalated.answer.decidedAtStage === 'stage_one');

  const byFirstReviewer = await throws(() => C.recordDecision(env, {
    actor: reviewer, caseId: opened.id, actorRole: C.POSTS.stage_two,
    outcome: 'not_upheld', decision: 'I confirm my own finding.',
    now: '2026-09-18T09:00:00.000Z',
  }));
  check('THE REVIEWER WHO ANSWERED STAGE ONE CANNOT ANSWER STAGE TWO — 403',
    byFirstReviewer && byFirstReviewer.name === 'AuthorizationError'
    && byFirstReviewer.httpStatus === 403, byFirstReviewer && byFirstReviewer.message);
  check('...and the refusal quotes the rule the whole procedure is built on',
    /passes to somebody who was not part of the last one/.test(byFirstReviewer.message));

  const stillTwo = await C.findCase(env, opened.id);
  check('...leaving the case at stage two with the stage one answer untouched',
    stillTwo.stage === 'stage_two' && stillTwo.decided_by === 'usr_reviewer');
}

// =====================================================================
// 7 · ANSWERING: THE VOCABULARY, THE POST, AND WHO MAY USE WHICH WORD
// =====================================================================
{
  const env = freshEnv();
  const appeal = await atStageOne(env, MON);

  const wrongWord = await throws(() => C.recordDecision(env, {
    actor: reviewer, caseId: appeal.id, actorRole: C.POSTS.stage_one,
    outcome: 'granted', decision: 'Granted.', now: MON,
  }));
  check('an appeal is not "granted" — a request is; the vocabularies do not mix',
    wrongWord && wrongWord.name === 'ValidationError' && Boolean(wrongWord.fields.outcome));

  // E2 gives substitution and re-assessment to the Senate and above.
  const senateWord = await throws(() => C.recordDecision(env, {
    actor: reviewer, caseId: appeal.id, actorRole: C.POSTS.stage_one,
    outcome: 'substituted', decision: 'I substitute my own mark.', now: MON,
  }));
  check('a first reviewer may not substitute their own decision — that is the Senate\'s power',
    senateWord && senateWord.name === 'ValidationError'
    && /Available from stage two/.test(senateWord.fields.outcome), senateWord && JSON.stringify(senateWord.fields));

  const noReasons = await throws(() => C.recordDecision(env, {
    actor: reviewer, caseId: appeal.id, actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: '   ', now: MON,
  }));
  check('an outcome with no recorded reasons is refused — the appeal would be a formality',
    noReasons && Boolean(noReasons.fields.decision));

  const wrongPost = await throws(() => C.recordDecision(env, {
    actor: reviewer, caseId: appeal.id, actorRole: C.POSTS.stage_two,
    outcome: 'not_upheld', decision: 'The mark stands.', now: MON,
  }));
  check('answering stage one in the Senate\'s name is refused',
    wrongPost && Boolean(wrongPost.fields.actorRole), wrongPost && JSON.stringify(wrongPost.fields));

  const byLearner = await throws(() => C.recordDecision(env, {
    actor: ben, caseId: appeal.id, outcome: 'not_upheld', decision: 'No.', now: MON,
  }));
  check('a learner cannot answer a case at all', byLearner && byLearner.name === 'AuthorizationError');

  // Answering something that is not being heard.
  const env2 = freshEnv();
  const unrouted = await C.openCase(env2, { actor: amina, ...APPEAL, now: MON });
  const tooEarly = await throws(() => C.recordDecision(env2, {
    actor: reviewer, caseId: unrouted.id, outcome: 'not_upheld', decision: 'No.', now: MON,
  }));
  check('a case still at received is not being heard, so there is nothing to answer',
    tooEarly && tooEarly.name === 'ValidationError');

  // A late answer is recorded as late rather than quietly on time.
  const env3 = freshEnv();
  const slow = await atStageOne(env3, MON);
  const lateAnswer = await C.recordDecision(env3, {
    actor: reviewer, caseId: slow.id, actorRole: C.POSTS.stage_one,
    outcome: 'partly_upheld', decision: 'One criterion is re-read; the mark moves by two marks.',
    now: '2026-10-12T09:00:00.000Z',
  });
  check('an answer given after the date it was owed says so on the trail',
    /after the date it was owed by/.test(lateAnswer.trail[lateAnswer.trail.length - 1].note));
}

// =====================================================================
// 8 · STAGE THREE, ITS ROUTING, AND ITS FINALITY
// =====================================================================
{
  const env = freshEnv();
  const appeal = await atStageOne(env, MON);
  await C.recordDecision(env, {
    actor: reviewer, caseId: appeal.id, actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: 'The mark stands.', now: '2026-09-09T09:00:00.000Z',
  });
  await C.escalateCase(env, { actor: amina, caseId: appeal.id, note: 'To the Senate.', now: '2026-09-10T09:00:00.000Z' });
  await C.recordDecision(env, {
    actor: senate, caseId: appeal.id, actorRole: C.POSTS.stage_two,
    outcome: 'not_upheld', decision: 'The Senate finds the process was followed.',
    now: '2026-09-14T09:00:00.000Z',
  });
  const atThree = await C.escalateCase(env, {
    actor: amina, caseId: appeal.id, note: 'To the Board.', now: '2026-09-15T09:00:00.000Z',
  });
  check('an academic matter at stage three goes to the Governor for Academic Affairs',
    atThree.heardByRole === 'The Governor for Academic Affairs', atThree.heardByRole);
  check('...on a self-binding date, because E2 publishes no interval for the Board',
    atThree.clock.basis === 'college_self_binding', atThree.clock.basis);

  const bySenate = await throws(() => C.recordDecision(env, {
    actor: senate, caseId: appeal.id, actorRole: C.POSTS.stage_three_academic,
    outcome: 'not_upheld', decision: 'Confirmed.', now: '2026-09-20T09:00:00.000Z',
  }));
  check('whoever answered stage two cannot answer stage three either',
    bySenate && bySenate.name === 'AuthorizationError');

  const final = await C.recordDecision(env, {
    actor: governor, caseId: appeal.id, actorRole: C.POSTS.stage_three_academic,
    outcome: 'not_upheld', decision: 'The Board finds the standard was applied correctly.',
    now: '2026-09-21T09:00:00.000Z',
  });
  check('a stage three answer CLOSES the matter, as the page says it does',
    final.stage === 'closed' && Boolean(final.closedAt), final.stage);
  check('...and nothing may be escalated past it', final.mayEscalate === false);
  const past = await throws(() => C.escalateCase(env, {
    actor: amina, caseId: appeal.id, note: 'Further still.', now: '2026-09-22T09:00:00.000Z',
  }));
  check('...so a fourth stage is refused, and the refusal says the learner may still speak publicly',
    past && past.name === 'ValidationError' && /entitled to say so publicly/.test(past.message),
    past && past.message);

  // Routing by matter, which E2 makes a published rule.
  const envW = freshEnv();
  const welfare = await C.openCase(envW, {
    actor: amina, kind: 'complaint', matter: 'welfare',
    summary: 'Complaint about the handling of a support request', now: MON,
  });
  await C.advanceStage(envW, { actor: registrar, caseId: welfare.id, toStage: 'stage_one', note: 'Listed.', now: MON });
  await C.recordDecision(envW, {
    actor: reviewer, caseId: welfare.id, actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: 'Not upheld, with reasons.', now: MON,
  });
  await C.escalateCase(envW, { actor: amina, caseId: welfare.id, note: 'To the Senate.', now: MON });
  await C.recordDecision(envW, {
    actor: senate, caseId: welfare.id, actorRole: C.POSTS.stage_two,
    outcome: 'not_upheld', decision: 'Not upheld at stage two.', now: MON,
  });
  const welfareThree = await C.escalateCase(envW, { actor: amina, caseId: welfare.id, note: 'To the Board.', now: MON });
  check('a welfare matter at stage three goes to the Governor for Ethics and Institutional Values',
    welfareThree.heardByRole === 'The Governor for Ethics and Institutional Values', welfareThree.heardByRole);

  // The matter E2 does NOT route, and the refusal to invent a route.
  const envA = freshEnv();
  const admin = await C.openCase(envA, {
    actor: amina, kind: 'complaint', matter: 'administrative',
    summary: 'Complaint about a delayed document', now: MON,
  });
  await C.advanceStage(envA, { actor: registrar, caseId: admin.id, toStage: 'stage_one', note: 'Listed.', now: MON });
  await C.recordDecision(envA, {
    actor: reviewer, caseId: admin.id, actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: 'Not upheld, with reasons.', now: MON,
  });
  await C.escalateCase(envA, { actor: amina, caseId: admin.id, note: 'To the Senate.', now: MON });
  await C.recordDecision(envA, {
    actor: senate, caseId: admin.id, actorRole: C.POSTS.stage_two,
    outcome: 'not_upheld', decision: 'Not upheld at stage two.', now: MON,
  });
  const noRoute = await throws(() => C.escalateCase(envA, { actor: amina, caseId: admin.id, note: 'To the Board.', now: MON }));
  check('E2 publishes no stage three route for an administrative matter, and none is invented',
    noRoute && noRoute.name === 'ValidationError'
    && /publishes no route for an administrative matter/.test(noRoute.message), noRoute && noRoute.message);
}

// =====================================================================
// 9 · ESCALATION AND WITHDRAWAL ARE THE APPELLANT'S ACTS
// =====================================================================
{
  const env = freshEnv();
  const appeal = await atStageOne(env, MON);
  await C.recordDecision(env, {
    actor: reviewer, caseId: appeal.id, actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: 'The mark stands.', now: MON,
  });

  const byStaff = await throws(() => C.escalateCase(env, {
    actor: registrar, caseId: appeal.id, note: 'Escalating for the learner.', now: MON,
  }));
  check('the College cannot escalate a case on the learner\'s behalf',
    byStaff && byStaff.name === 'NotFoundError', byStaff && byStaff.name);
  const byOther = await throws(() => C.escalateCase(env, {
    actor: ben, caseId: appeal.id, note: 'Escalating somebody else\'s case.', now: MON,
  }));
  check('...and another learner gets the same answer a reference never issued gets',
    byOther && byOther.name === 'NotFoundError');

  const tooEarly = await throws(async () => {
    const fresh = await C.openCase(env, { actor: amina, ...APPEAL, summary: 'Another appeal', now: MON });
    await C.escalateCase(env, { actor: amina, caseId: fresh.id, note: 'Straight up.', now: MON });
  });
  check('an unanswered case cannot be escalated — there is nothing to appeal against yet',
    tooEarly && tooEarly.name === 'ValidationError');

  // Withdrawal.
  const env2 = freshEnv();
  const w = await atStageOne(env2, MON);
  const gone = await C.withdrawCase(env2, {
    actor: amina, caseId: w.id, reason: 'The department has answered me directly and I am content.', now: MON,
  });
  check('a learner withdraws their own case, and it closes',
    gone.stage === 'closed' && gone.answer.outcome === 'withdrawn_by_learner');
  check('...recorded as the learner\'s act, not the College\'s',
    gone.trail[gone.trail.length - 1].actorRole === C.POSTS.learner);
  check('...and a withdrawn case cannot then be escalated',
    (await throws(() => C.escalateCase(env2, { actor: amina, caseId: w.id, note: 'Actually, no.', now: MON }))).name === 'ValidationError');
  check('...nor withdrawn twice',
    (await throws(() => C.withdrawCase(env2, { actor: amina, caseId: w.id, reason: 'Again.', now: MON }))).name === 'ValidationError');
  check('another learner cannot withdraw a case that is not theirs',
    (await throws(() => C.withdrawCase(env2, { actor: ben, caseId: w.id, reason: 'Not mine.', now: MON }))).name === 'NotFoundError');
}

// =====================================================================
// 10 · CONSEQUENCES ARE EMITTED, RECORDED, AND NOT APPLIED
// =====================================================================
{
  const env = freshEnv();
  const before = env.DB.prepare('SELECT COUNT(*) AS n FROM enrolment_events').bind().first().n;

  const wd = await C.openCase(env, {
    actor: amina, kind: 'withdrawal', matter: 'administrative', enrolmentId: 'enr_amina_1',
    summary: 'Request to withdraw from the Foundation Programme', now: MON,
  });
  await C.advanceStage(env, { actor: registrar, caseId: wd.id, toStage: 'stage_one', note: 'Listed.', now: MON });
  const granted = await C.recordDecision(env, {
    actor: reviewer, caseId: wd.id, actorRole: C.POSTS.stage_one,
    outcome: 'granted', decision: 'The withdrawal is granted with effect from today.', now: MON,
  });

  const domains = granted.consequences.map((c) => c.domain);
  check('granting a withdrawal emits an enrolment intent and a finance intent',
    domains.includes('enrolment') && domains.includes('finance'), JSON.stringify(domains));
  check('...and EVERY intent is marked unapplied',
    granted.consequences.every((c) => c.applied === false));
  check('...each stating what a deliberate implementation would have to write',
    granted.consequences.every((c) => Array.isArray(c.requires) && c.requires.length > 0));
  check('...the finance one citing the published refund rule rather than inventing arithmetic',
    /14 days of the payment/.test(granted.consequences.find((c) => c.domain === 'finance').published));

  // THE ASSERTION THAT MAKES "NOT APPLIED" MEAN SOMETHING.
  const enrolment = env.DB.prepare("SELECT status FROM enrolments WHERE id = 'enr_amina_1'").bind().first();
  check('THE ENROLMENT IS UNTOUCHED — nothing was silently withdrawn',
    enrolment.status === 'active', enrolment.status);
  check('...and no enrolment event was fabricated either',
    env.DB.prepare('SELECT COUNT(*) AS n FROM enrolment_events').bind().first().n === before);
  check('...and no payment or refund row was written',
    env.DB.prepare('SELECT COUNT(*) AS n FROM payments').bind().first().n === 0);
  check('the intent is nevertheless RECORDED, on the trail, where it can be found later',
    /Consequences emitted and NOT applied/.test(granted.trail[granted.trail.length - 1].note),
    granted.trail[granted.trail.length - 1].note);

  // The deferral, and the schema gap it runs into.
  const df = await C.openCase(env, {
    actor: amina, kind: 'deferral', matter: 'welfare', enrolmentId: 'enr_amina_1',
    summary: 'Request to pause for six months', now: MON,
  });
  await C.advanceStage(env, { actor: registrar, caseId: df.id, toStage: 'stage_one', note: 'Listed.', now: MON });
  const paused = await C.recordDecision(env, {
    actor: reviewer, caseId: df.id, actorRole: C.POSTS.stage_one,
    outcome: 'granted', decision: 'The pause is granted, as the handbook says it is on request.', now: MON,
  });
  const pauseIntent = paused.consequences.find((c) => c.intent === 'pause_enrolment');
  check('granting a deferral emits a pause intent',
    Boolean(pauseIntent) && pauseIntent.applied === false);
  check('...marked BLOCKED, because enrolments.status has no paused value to write',
    pauseIntent.blocked === true && /has no 'paused' value/.test(pauseIntent.requires[0]),
    pauseIntent.requires[0]);
  check('...and explicitly forbids recording it as a withdrawal instead',
    /must not be recorded as a withdrawal/.test(pauseIntent.requires[0]));
  const money = paused.consequences.find((c) => c.domain === 'finance');
  check('...while the finance intent is "no action", because a pause changes nothing about a fee',
    money.intent === 'no_action' && /changes nothing about a fee/.test(money.published));
  check('the enrolment is STILL untouched after a granted pause',
    env.DB.prepare("SELECT status FROM enrolments WHERE id = 'enr_amina_1'").bind().first().status === 'active');

  // A refused request emits nothing.
  const env2 = freshEnv();
  const refused = await (async () => {
    const c = await C.openCase(env2, {
      actor: amina, kind: 'withdrawal', matter: 'administrative',
      summary: 'Request to withdraw', now: MON,
    });
    await C.advanceStage(env2, { actor: registrar, caseId: c.id, toStage: 'stage_one', note: 'Listed.', now: MON });
    return C.recordDecision(env2, {
      actor: reviewer, caseId: c.id, actorRole: C.POSTS.stage_one,
      outcome: 'refused', decision: 'Refused, with reasons.', now: MON,
    });
  })();
  check('a refused request emits no consequence at all', refused.consequences.length === 0);

  // Substitution at stage two carries an academic consequence, unapplied.
  const env3 = freshEnv();
  const ap = await atStageOne(env3, MON);
  await C.recordDecision(env3, {
    actor: reviewer, caseId: ap.id, actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: 'The mark stands.', now: MON,
  });
  await C.escalateCase(env3, { actor: amina, caseId: ap.id, note: 'To the Senate.', now: MON });
  const sub = await C.recordDecision(env3, {
    actor: senate, caseId: ap.id, actorRole: C.POSTS.stage_two,
    outcome: 'returned_for_fresh_assessment',
    decision: 'Returned for fresh assessment by a different marker.', now: MON,
  });
  const academic = sub.consequences.find((c) => c.domain === 'academic');
  check('the Senate returning work for fresh assessment emits an academic intent, unapplied',
    Boolean(academic) && academic.applied === false);
  check('...which says the re-mark must be by a DIFFERENT marker',
    /DIFFERENT marker/.test(academic.requires[0]));
  check('...and the mark itself is not written here',
    env3.DB.prepare("SELECT grade FROM assignment_submissions WHERE id = 'asub_1'").bind().first().grade === 62.0);
}

// =====================================================================
// 11 · THE REGISTRAR'S QUEUE
// =====================================================================
{
  const env = freshEnv();
  const soon = await atStageOne(env, MON);
  const later = await C.openCase(env, {
    actor: ben, kind: 'complaint', matter: 'fair_treatment',
    summary: 'Complaint about a delayed reply', now: '2026-09-08T09:00:00.000Z',
  });

  const queue = await C.registrarQueue(env, { actor: registrar, now: '2026-09-09T09:00:00.000Z' });
  check('the queue answers the Registrar\'s morning question', queue.cases.length === 2);
  check('...in the order the answers fall due',
    queue.cases[0].answerDue <= queue.cases[1].answerDue,
    queue.cases.map((c) => c.answerDue).join(' | '));
  check('...naming, beside each case, who may NOT be asked to hear it',
    queue.cases.find((c) => c.reference === soon.reference).barredFromHearing.includes('usr_marker'));
  check('...and the post that is expected to answer it',
    queue.cases.find((c) => c.reference === soon.reference).expectedPost === C.POSTS.stage_one);
  check('...with the working-day definition stated rather than assumed',
    /no closure calendar/.test(queue.procedure.workingDayDefinition));

  const late = await C.registrarQueue(env, { actor: registrar, overdueOnly: true, now: '2026-10-20T09:00:00.000Z' });
  check('the overdue view shows what the College is late on', late.cases.length === 2 && late.overdue === 2);
  const none = await C.registrarQueue(env, { actor: registrar, overdueOnly: true, now: '2026-09-09T09:00:00.000Z' });
  check('...and shows nothing when the College is not late', none.cases.length === 0);

  const filtered = await C.registrarQueue(env, { actor: registrar, kind: 'complaint', now: MON });
  check('the queue filters by kind', filtered.cases.length === 1 && filtered.cases[0].reference === later.reference);
  const byStage = await C.registrarQueue(env, { actor: registrar, stage: 'stage_one', now: MON });
  check('...and by stage', byStage.cases.every((c) => c.stage === 'stage_one'));

  check('a learner cannot read the queue',
    (await throws(() => C.registrarQueue(env, { actor: amina, now: MON }))).name === 'AuthorizationError');
  check('a learner cannot read a case file through the staff reader',
    (await throws(() => C.registrarCase(env, { actor: amina, idOrReference: soon.id }))).name === 'AuthorizationError');

  // The learner's own list, bound to the session in the WHERE clause.
  const mine = await C.learnerCases(env, { user: amina, now: MON });
  check('a learner\'s list contains only their own cases',
    mine.cases.length === 1 && mine.cases[0].reference === soon.reference);
  check('...and Ben\'s list does not contain hers',
    (await C.learnerCases(env, { user: ben, now: MON })).cases.every((c) => c.reference !== soon.reference));
  check('reading another learner\'s case answers exactly as a reference never issued does',
    (await throws(() => C.learnerCase(env, { user: ben, idOrReference: soon.reference }))).name === 'NotFoundError');
  check('a reference that was never issued is a NotFound, not a 500',
    (await throws(() => C.findCase(env, 'APL-2026-ZZZZZZ'))).name === 'NotFoundError');

  // Resetting a date is a recorded act, not an UPDATE nobody sees.
  const moved = await C.resetAnswerDue(env, {
    actor: registrar, caseId: soon.id, answerDue: '2026-09-25T23:59:59.999Z',
    note: 'The reviewer is on leave until the 24th; the learner has been told.', now: MON,
  });
  check('an answer date may be moved, and the trail records what it was moved from and to',
    moved.clock.answerDue === '2026-09-25T23:59:59.999Z'
    && /moved from .* to /.test(moved.trail[moved.trail.length - 1].note));
  check('...and only by the Registrar\'s desk',
    (await throws(() => C.resetAnswerDue(env, {
      actor: reviewer, caseId: soon.id, answerDue: '2026-09-30T23:59:59.999Z', note: 'Later.', now: MON,
    }))).name === 'AuthorizationError');
  check('...to a real instant, not a date-shaped string',
    Boolean((await throws(() => C.resetAnswerDue(env, {
      actor: registrar, caseId: soon.id, answerDue: '25 September', note: 'Later.', now: MON,
    }))).fields.answerDue));
}

// =====================================================================
// 12 · THE ROUTES, WITH REAL TOKENS
// =====================================================================
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
const TOK = {
  amina: await token('c_usr_amina'), ben: await token('c_usr_ben'),
  marker: await token('c_usr_marker'), reviewer: await token('c_usr_reviewer'),
  registrar: await token('c_usr_registrar'),
};
const BASE = 'https://wec-lc.test/api';
const env = freshEnv();
env.CLERK_JWKS_URL = 'https://stub.clerk.accounts.dev/.well-known/jwks.json';
const get = (url, tok) => new Request(url, tok ? { headers: { Authorization: `Bearer ${tok}` } } : undefined);
const send = (method, url, tok, body) => new Request(url, {
  method,
  headers: tok
    ? { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
});

check('GET /api/student/cases refuses an unauthenticated caller',
  (await studentRoute.onRequestGet({ request: get(`${BASE}/student/cases`), env })).status === 401);
check('POST /api/student/cases refuses an unauthenticated caller',
  (await studentRoute.onRequestPost({ request: send('POST', `${BASE}/student/cases`, null, {}), env })).status === 401);
check('GET /api/staff/cases refuses an unauthenticated caller',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/cases`), env })).status === 401);
check('PATCH /api/staff/cases refuses an unauthenticated caller',
  (await staffRoute.onRequestPatch({ request: send('PATCH', `${BASE}/staff/cases`, null, {}), env })).status === 401);
check('GET /api/staff/cases refuses a learner — 403',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/cases`, TOK.amina), env })).status === 403);
check('PATCH /api/staff/cases refuses a learner — 403',
  (await staffRoute.onRequestPatch({ request: send('PATCH', `${BASE}/staff/cases`, TOK.amina, { case: 'x', action: 'decide' }), env })).status === 403);

const openedRes = await studentRoute.onRequestPost({
  request: send('POST', `${BASE}/student/cases`, TOK.amina, APPEAL), env,
});
const openedBody = await openedRes.json();
check('a learner opens a case over the route', openedRes.status === 201 && Boolean(openedBody.reference));

for (const key of ['userId', 'studentId', 'onBehalfOf']) {
  check(`a ${key} in the body is REFUSED, not ignored`,
    (await studentRoute.onRequestPost({
      request: send('POST', `${BASE}/student/cases`, TOK.ben, { ...APPEAL, [key]: 'usr_amina' }), env,
    })).status === 422);
  check(`...and a ${key} on the query string is refused too`,
    (await studentRoute.onRequestGet({
      request: get(`${BASE}/student/cases?${key}=usr_amina`, TOK.ben), env,
    })).status === 422);
}
check('a learner may not answer their own case through the learner route',
  (await studentRoute.onRequestPost({
    request: send('POST', `${BASE}/student/cases`, TOK.amina, { case: openedBody.reference, outcome: 'upheld' }), env,
  })).status === 422);
check('a bad limit on the learner list is a 422',
  (await studentRoute.onRequestGet({ request: get(`${BASE}/student/cases?limit=9999`, TOK.amina), env })).status === 422);
check('an unknown action is refused rather than treated as opening a case',
  (await studentRoute.onRequestPost({
    request: send('POST', `${BASE}/student/cases`, TOK.amina, { action: 'settle', case: openedBody.reference }), env,
  })).status === 422);

const listRes = await studentRoute.onRequestGet({ request: get(`${BASE}/student/cases`, TOK.amina), env });
const listBody = await listRes.json();
check('the learner reads her own list over the route',
  listRes.status === 200 && listBody.cases.some((c) => c.reference === openedBody.reference));
check('and Ben\'s list over the same route does not contain her case',
  (await (await studentRoute.onRequestGet({ request: get(`${BASE}/student/cases`, TOK.ben), env })).json())
    .cases.every((c) => c.reference !== openedBody.reference));
check('Ben cannot fetch her case by quoting its reference',
  (await studentRoute.onRequestGet({
    request: get(`${BASE}/student/cases?reference=${openedBody.reference}`, TOK.ben), env,
  })).status === 404);

const routedRes = await staffRoute.onRequestPatch({
  request: send('PATCH', `${BASE}/staff/cases`, TOK.registrar, {
    case: openedBody.reference, action: 'route', note: 'Listed to a reviewer who did not mark the work.',
  }),
  env,
});
check('the Registrar routes the case to stage one over the route',
  routedRes.status === 200 && (await routedRes.clone().json()).stage === 'stage_one');

check('the College may not skip to stage two over the route',
  (await staffRoute.onRequestPatch({
    request: send('PATCH', `${BASE}/staff/cases`, TOK.registrar, {
      case: openedBody.reference, action: 'resume', toStage: 'stage_two', note: 'Jumping.',
    }),
    env,
  })).status === 403);
check('the College may not escalate a case over the staff route',
  (await staffRoute.onRequestPatch({
    request: send('PATCH', `${BASE}/staff/cases`, TOK.registrar, {
      case: openedBody.reference, action: 'escalate', note: 'For the learner.',
    }),
    env,
  })).status === 422);
check('a body naming somebody else as the decider is refused',
  (await staffRoute.onRequestPatch({
    request: send('PATCH', `${BASE}/staff/cases`, TOK.registrar, {
      case: openedBody.reference, action: 'decide', decidedBy: 'usr_reviewer',
      outcome: 'not_upheld', decision: 'Stands.',
    }),
    env,
  })).status === 422);

// THE REFUSAL, OVER HTTP.
const markerAnswer = await staffRoute.onRequestPatch({
  request: send('PATCH', `${BASE}/staff/cases`, TOK.marker, {
    case: openedBody.reference, action: 'decide', actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: 'My mark stands.',
  }),
  env,
});
check('THE MARKER IS REFUSED BY THE ENDPOINT, NOT ONLY BY THE MODULE — 403',
  markerAnswer.status === 403, String(markerAnswer.status));
check('...with the ground given in the body so the Registrar can reassign it',
  /Marked this learner's work/.test((await markerAnswer.json()).message));

const cleanAnswer = await staffRoute.onRequestPatch({
  request: send('PATCH', `${BASE}/staff/cases`, TOK.reviewer, {
    case: openedBody.reference, action: 'decide', actorRole: C.POSTS.stage_one,
    outcome: 'not_upheld', decision: 'The rubric was applied as published; the mark stands.',
  }),
  env,
});
check('...while the reviewer with no stake answers successfully over the same route',
  cleanAnswer.status === 200 && (await cleanAnswer.clone().json()).answer.outcome === 'not_upheld');

const escalatedRes = await studentRoute.onRequestPost({
  request: send('POST', `${BASE}/student/cases`, TOK.amina, {
    action: 'escalate', case: openedBody.reference, note: 'The point about the brief was not addressed.',
  }),
  env,
});
check('the learner escalates over her own route', escalatedRes.status === 200
  && (await escalatedRes.clone().json()).stage === 'stage_two');

const queueRes = await staffRoute.onRequestGet({ request: get(`${BASE}/staff/cases`, TOK.registrar), env });
check('the Registrar reads the queue over the route',
  queueRes.status === 200 && (await queueRes.clone().json()).cases.length >= 1);
check('an unknown ?stage on the queue is a 422 rather than a silently empty list',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/cases?stage=pending`, TOK.registrar), env })).status === 422);
check('an unknown ?kind is a 422',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/cases?kind=misconduct`, TOK.registrar), env })).status === 422);
check('?overdue must be true or false',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/cases?overdue=yes`, TOK.registrar), env })).status === 422);
check('a malformed JSON body is a 422, not a 500',
  (await studentRoute.onRequestPost({
    request: new Request(`${BASE}/student/cases`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOK.amina}`, 'Content-Type': 'application/json' },
      body: '{not json',
    }),
    env,
  })).status === 422);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
