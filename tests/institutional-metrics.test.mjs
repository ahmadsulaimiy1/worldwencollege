// functions/_lib/reports/institutional.js — the Institutional Metric
// Register.
//
// The value of this module is almost entirely in what it REFUSES to say.
// So the assertions are about refusals:
//
//   - a metric with no instrument is DECLARED, not omitted, because an
//     absent panel reads as "nothing to report";
//   - a rate over a handful of learners is SUPPRESSED, not rounded,
//     because a percentage over four people is one person's record with
//     a percentage sign on it;
//   - a known non-compliance is reported as a FINDING, not as missing
//     data, because "we cannot tell" and "the answer is no" are
//     different statements;
//   - "no cases recorded" is never rendered as zero.
//
// A dashboard that showed only its computable numbers would pass a
// naive test suite and mislead a Board. Most of this file exists to stop
// that.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const M = await import(loadUrl('functions/_lib/reports/institutional.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const byId = (r, id) => r.metrics.find((m) => m.id === id);

function freshEnv(learners = 0) {
  const env = { DB: makeD1(schema) };
  for (let i = 1; i <= learners; i++) {
    env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
      VALUES ('usr_${i}','clerk','c_${i}','l${i}@example.com','student')`).bind().run();
  }
  return env;
}

// ---------------------------------------------------------------------
// An empty College reports emptiness, not zeroes
// ---------------------------------------------------------------------
{
  const env = freshEnv(0);
  const r = await M.institutionalMetrics(env);

  check('The register declares every metric, computable or not', r.metrics.length >= 12, r.metrics.length);
  check('...and summarises how much of itself it can actually answer',
    typeof r.summary.total === 'number' && r.summary.total === r.metrics.length,
    JSON.stringify(r.summary));

  const enrol = byId(r, 'enrolments.total');
  check('With no learners, enrolments report insufficient data rather than 0',
    enrol.state === 'insufficient_data' && enrol.value === null, enrol.state);
  check('...saying what would close it', /first learner enrolment/i.test(enrol.closes));

  const awards = byId(r, 'outcomes.awardsConferred');
  check('Awards report insufficient data, naming the governance block',
    awards.state === 'insufficient_data' && /C4/.test(awards.closes), awards.closes);

  // Every metric must be actionable or answered. A metric that is
  // neither measured nor explained is a dead entry nobody will chase.
  const unexplained = r.metrics.filter((m) => m.state !== 'measured' && !m.closes);
  check('Every unanswerable metric says what would close it',
    unexplained.length === 0, unexplained.map((m) => m.id).join(', '));
  const unquestioned = r.metrics.filter((m) => !m.question || m.question.length < 20);
  check('Every metric states the question it answers',
    unquestioned.length === 0, unquestioned.map((m) => m.id).join(', '));
}

// ---------------------------------------------------------------------
// The metrics with no instrument at all
// ---------------------------------------------------------------------
// The reason this is a register and not a dashboard.
{
  const r = await M.institutionalMetrics(freshEnv(0));

  // Graduate destinations is the last of these left. Governance A7's
  // three — attendance, academic integrity, student feedback — all have
  // instruments now (migrations 024, 023, 025), so not_instrumented
  // would be a false statement about the College in every one of those
  // cases. This one is honest: there are no graduates.
  for (const id of ['outcomes.graduateDestinations']) {
    const m = byId(r, id);
    check(`${id} is declared rather than omitted`, !!m, 'missing from the register entirely');
    if (m) {
      check(`...marked not_instrumented, not zero`, m.state === 'not_instrumented' && m.value === null, m.state);
      check(`...naming what data it would need`, !!m.requires && m.requires.length > 20);
    }
  }

  // The student voice, once migration 025 gave it an instrument.
  const fb = byId(r, 'experience.studentFeedback') || {};
  check('Student feedback is instrumented and reports no responses',
    fb.state === 'insufficient_data' && fb.value === null, fb.state);
  check('...because no survey has been published, not because nothing collects opinion',
    /None has been published/i.test(fb.closes || ''), (fb.closes || '(absent)').slice(0, 80));

  // The metric that decides whether the instrument survives.
  const loop = byId(r, 'experience.feedbackClosedLoop') || {};
  check('What the College DID about feedback is a metric of its own', !!loop.id);
  check('...and reports nothing outstanding while nothing has been asked',
    loop.state === 'insufficient_data' && loop.value === null, loop.state);

  // Academic integrity moved out of that list when migration 023 built
  // the misconduct register: the College now collects this, so
  // not_instrumented would be a false statement about itself. What must
  // NOT change is the value — an empty register is null, never zero.
  // Read defensively: when a sabotage removes the metric entirely these
  // must FAIL, not throw. A suite that dies on a finding reports one
  // line of stack instead of the results that locate it.
  const mis = byId(r, 'integrity.misconduct') || {};
  check('Misconduct is declared rather than omitted', !!byId(r, 'integrity.misconduct'));
  check('...and reports the instrument as existing but unused', mis.state === 'insufficient_data', mis.state);
  check('...and still publishes no zero over an empty register', mis.value === null, JSON.stringify(mis.value));
  check('Misconduct explicitly distinguishes "none recorded" from "none occurred"',
    /different statements/i.test(mis.closes || ''), (mis.closes || '(absent)').slice(0, 90));
  // Attendance moved out of that list when migration 024 built the
  // register. Two entries now, and the split between them is the point.
  const att = byId(r, 'engagement.attendance') || {};
  check('Attendance is instrumented and reports no sessions held',
    att.state === 'insufficient_data' && att.value === null, att.state);
  check('...saying so because nothing has been taught, not because the table is missing',
    /nothing has been taught/i.test(att.closes || ''), att.closes || '(absent)');

  // The rate is a DEFINITION the Board has not settled, not data the
  // platform lacks. A register that conflated the two would let an
  // unsettled question look like a pending engineering task.
  const rate = byId(r, 'engagement.attendanceRate') || {};
  check('The attendance RATE is declared separately and left uncomputed',
    rate.state === 'not_instrumented' && rate.value === null, rate.state);
  check('...naming A7\'s open decision as what is missing',
    /presence at a live session, or engagement with the module/i.test(rate.closes || ''),
    (rate.closes || '(absent)').slice(0, 90));
  check('...and saying plainly that it is a question, not missing information',
    /unsettled question, not missing information/i.test(rate.closes || ''),
    (rate.closes || '(absent)').slice(-70));
}

// ---------------------------------------------------------------------
// Small cohorts are suppressed, not published
// ---------------------------------------------------------------------
{
  const env = freshEnv(4);
  // Four concluded enrolments — a real rate, and one nobody may publish.
  for (let i = 1; i <= 3; i++) {
    env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at,completed_at)
      VALUES ('enr_${i}','usr_${i}',1,'completed','2027-01-01T00:00:00.000Z','2027-05-01T00:00:00.000Z')`).bind().run();
  }
  env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at)
    VALUES ('enr_4','usr_4',1,'withdrawn','2027-01-01T00:00:00.000Z')`).bind().run();

  const r = await M.institutionalMetrics(env);
  const rate = byId(r, 'progression.completionRate');
  check('A completion rate over four people is suppressed', rate.state === 'suppressed', rate.state);
  // The decisive one: withholding must actually withhold.
  check('...with NO percentage in the response at all',
    rate.value === null && !JSON.stringify(rate).includes('75'), JSON.stringify(rate));
  check('...reporting the cohort size so the reader knows why', rate.cohort === 4);
  check('...and how many more are needed', /6 more/.test(rate.closes), rate.closes);

  // Counts are not rates. Knowing four people enrolled identifies
  // nobody; knowing three of four completed identifies everybody.
  check('Raw counts are still reported — a count is not a rate',
    byId(r, 'enrolments.total').state === 'measured');
}

{
  const env = freshEnv(12);
  for (let i = 1; i <= 9; i++) {
    env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at,completed_at)
      VALUES ('enr_${i}','usr_${i}',1,'completed','2027-01-01T00:00:00.000Z','2027-05-01T00:00:00.000Z')`).bind().run();
  }
  for (let i = 10; i <= 12; i++) {
    env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at)
      VALUES ('enr_${i}','usr_${i}',1,'withdrawn','2027-01-01T00:00:00.000Z')`).bind().run();
  }
  const r = await M.institutionalMetrics(env);
  const rate = byId(r, 'progression.completionRate');
  check('Past the threshold the rate is published', rate.state === 'measured', rate.state);
  check('...and is arithmetically right', rate.value.percent === 75 && rate.value.concluded === 12,
    JSON.stringify(rate.value));
}

// ---------------------------------------------------------------------
// An active enrolment is not a failure
// ---------------------------------------------------------------------
// A rate over ALL enrolments would fall every time the College
// recruited, which is the opposite of what the number is for.
{
  const env = freshEnv(30);
  for (let i = 1; i <= 10; i++) {
    env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at,completed_at)
      VALUES ('enr_${i}','usr_${i}',1,'completed','2027-01-01T00:00:00.000Z','2027-05-01T00:00:00.000Z')`).bind().run();
  }
  for (let i = 11; i <= 12; i++) {
    env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at)
      VALUES ('enr_${i}','usr_${i}',1,'withdrawn','2027-01-01T00:00:00.000Z')`).bind().run();
  }
  const before = byId(await M.institutionalMetrics(env), 'progression.completionRate').value.percent;

  // Eighteen new learners start. Nothing about past outcomes changed.
  for (let i = 13; i <= 30; i++) {
    env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at)
      VALUES ('enr_${i}','usr_${i}',1,'active','2027-06-01T00:00:00.000Z')`).bind().run();
  }
  const after = byId(await M.institutionalMetrics(env), 'progression.completionRate').value.percent;
  check('Recruiting eighteen learners does not change the completion rate',
    before === after && before === Math.round((10 / 12) * 1000) / 10, `${before} -> ${after}`);
}

// ---------------------------------------------------------------------
// A known non-compliance is a finding, not missing data
// ---------------------------------------------------------------------
{
  const r = await M.institutionalMetrics(freshEnv(0));
  const cov = byId(r, 'assessment.competencyCoverage');
  // "We cannot tell" and "the answer is no" are different statements,
  // and reporting the second as the first hides it.
  check('Competency coverage is MEASURED even though the answer is no',
    cov.state === 'measured', cov.state);
  check('...reporting non-compliance rather than absence',
    cov.value.compliant === false && cov.value.assessmentsMapped === 0);
  check('...naming the governance item that would close it', /A6d/.test(cov.closes), cov.closes);
  check('...and quoting the rule it is measuring', /at least 3 times per level/i.test(cov.value.rule));

  // Turnaround is a service measure. Calling it performance would let a
  // fast marker read as a good one.
  const mark = byId(r, 'assessment.markingTurnaround');
  check('Marking turnaround does not claim to measure marking quality',
    /not a judgement of marking quality/i.test(mark.note), mark.note.slice(0, 80));
  check('...and points at moderation as what would measure it',
    /moderation/i.test(mark.note));
}

// ---------------------------------------------------------------------
// Money is reported per currency and never summed
// ---------------------------------------------------------------------
{
  const env = freshEnv(2);
  // amount_usd_cents is the amount normalised AT THE PAYMENT DATE. The
  // GBP payment is deliberately given a USD figure that is not a
  // today's-rate conversion of 250000, so a test that re-converted
  // would produce a different number and be caught.
  for (const [i, cur, amt, usd] of [[1, 'USD', 316667, 316667], [2, 'GBP', 250000, 311000]]) {
    env.DB.prepare(`INSERT INTO payments (id,user_id,kind,amount_cents,currency,amount_usd_cents,status,provider)
      VALUES ('pay_${i}','usr_${i}','single_level',${amt},'${cur}',${usd},'succeeded','stripe')`).bind().run();
  }
  const r = await M.institutionalMetrics(env);
  const fin = byId(r, 'finance.receipts');
  check('Receipts are reported', fin.state === 'measured');
  check('...split by currency', fin.value.byCurrency.length === 2);
  // Summing IS correct here, and only here: each amount was frozen at
  // the rate on its own date. An earlier draft of this module refused to
  // sum at all, which was over-cautious — the platform already stores
  // the date-correct normalisation, and refusing to use it would have
  // withheld a figure the College can legitimately state.
  check('...totalled from amounts normalised at each payment\'s own date',
    fin.value.normalisedUsdCents === 627667, fin.value.normalisedUsdCents);
  // The native amounts must never be added: 316667 + 250000 = 566667 is
  // dollars plus pounds and means nothing.
  check('...never adding native amounts across currencies',
    !JSON.stringify(fin.value).includes('566667'), JSON.stringify(fin.value));
  check('...and the metric states which of those two things it did',
    /rate in effect on ITS OWN date/.test(fin.note) && /never added together/.test(fin.note));
}

// ---------------------------------------------------------------------
// Accreditation readiness is a self-evaluation, not a score
// ---------------------------------------------------------------------
{
  const r = await M.institutionalMetrics(freshEnv(0));
  const a = r.accreditationReadiness;

  // This is the document most likely to be quoted out of context.
  check('Readiness opens by disclaiming any accreditation',
    /holds no accreditation, recognition or affiliation/i.test(a.statement));
  check('...says it has not applied for any', /has not applied for any/i.test(a.statement));
  check('...and that nothing here implies future recognition',
    /Nothing here constitutes, implies or anticipates external recognition/i.test(a.statement));
  // A score invites the reading that a high one means recognition is
  // near. Recognition is granted by a body, not earned by a checklist.
  check('There is no readiness SCORE, only evidenced and not evidenced',
    !('score' in a) && !('percent' in a) && !('readiness' in a), Object.keys(a).join(','));

  check('Areas the College genuinely has are marked evidenced',
    a.areas.find((x) => x.area === 'Curriculum content').evidenced === true);
  check('...and areas it does not are marked with the gap',
    a.areas.find((x) => x.area === 'Internal moderation').evidenced === false);
  const gaps = a.areas.filter((x) => !x.evidenced);
  check('Every unevidenced area explains what is missing',
    gaps.every((x) => x.gap && x.gap.length > 20), gaps.filter((x) => !x.gap).map((x) => x.area).join(', '));
  check('The College currently cannot evidence most of it, and says so',
    a.evidenced < a.total, `${a.evidenced}/${a.total}`);
}

// ---------------------------------------------------------------------
// The register never invents a benchmark
// ---------------------------------------------------------------------
// A comparison to a sector average would need a sector average, and the
// College has no source for one. Inventing a benchmark is the easiest
// way for an honest dashboard to start lying.
{
  const r = await M.institutionalMetrics(freshEnv(0));
  const text = JSON.stringify(r).toLowerCase();
  for (const word of ['industry average', 'sector average', 'benchmark', 'peer institution',
    'above average', 'top quartile', 'ranked']) {
    check(`No fabricated comparison: "${word}"`, !text.includes(word));
  }
  check('The suppression rule is stated to the reader, not just applied',
    /individual's record with a percentage sign/i.test(r.caveat), r.caveat);
}

// ---------------------------------------------------------------------
// Misconduct, once there are cases, is suppressed before it is published
// ---------------------------------------------------------------------
// The most identifying figure in the whole register. "One case this
// year" over a cohort of four is not a statistic about the College; it
// is one learner's disciplinary record, published. So the threshold is
// applied to the number of LEARNERS involved, not the number of cases.
{
  const seedCases = (env, learners) => {
    env.DB.prepare(`INSERT INTO units (id, course_id, sequence, title)
      VALUES ('unt_m','crs_level_1',901,'Metric fixture')`).bind().run();
    env.DB.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
      VALUES ('itm_m','unt_m',1,'assignment','Fixture task')`).bind().run();
    for (let i = 1; i <= learners; i++) {
      env.DB.prepare(`INSERT INTO misconduct_cases
        (id, reference, user_id, category, learning_item_id, opened_by, opened_at, allegation)
        VALUES ('mis_m${i}','AI-2027-${i}','usr_${i}','NOT_OWN_WORK','itm_m','usr_1','2027-01-01T00:00:00Z','Fixture allegation')`)
        .bind().run();
    }
  };

  const few = freshEnv(4);
  seedCases(few, 4);
  const m1 = byId(await M.institutionalMetrics(few), 'integrity.misconduct') || {};
  check('Four learners with cases: suppressed, not published', m1.state === 'suppressed', m1.state);
  check('...with no value attached to leak the count', m1.value === null, JSON.stringify(m1.value));
  check('...saying why it was withheld', /identifies the individual/i.test(m1.closes || ''), m1.closes);

  const many = freshEnv(12);
  seedCases(many, 12);
  const m2 = byId(await M.institutionalMetrics(many), 'integrity.misconduct') || {};
  check('Twelve learners with cases: measured', m2.state === 'measured', m2.state);
  check('...counting the cases opened', m2.value && m2.value.opened === 12, JSON.stringify(m2.value));
  check('...and reporting how many are still undetermined, which is the number that matters',
    m2.value && m2.value.awaitingDetermination === 12, JSON.stringify(m2.value));
}

// ---------------------------------------------------------------------
// The student voice: suppressed where it names people, not where it
// names the College
// ---------------------------------------------------------------------
// The asymmetry here is deliberate and is the point of the pair. What
// learners SAID is suppressed below the threshold, because a cohort
// that small is readable and reporting it would break the anonymity the
// survey promised. What the College DID about it is never suppressed,
// because it is a fact about the institution's own conduct — a College
// that answered none of its surveys must not be able to hide that
// behind a rule written to protect learners.
{
  const seed = (env, responses) => {
    env.DB.prepare(`INSERT INTO feedback_surveys
      (id, code, title, scope, purpose, anonymous, opens_at, closes_at, created_by, created_at)
      VALUES ('svy_1','EVAL-1','Programme evaluation','programme',
              'To decide what changes before the next intake.',1,
              '2027-01-01T00:00:00Z','2027-01-31T00:00:00Z','usr_1','2026-12-01T00:00:00Z')`).bind().run();
    for (let i = 1; i <= responses; i++) {
      env.DB.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
        VALUES ('fr_${i}','svy_1',1,NULL,'2027-01-1${i % 10}T00:00:00Z')`).bind().run();
    }
  };

  const few = freshEnv(1);
  seed(few, 3);
  const r1 = await M.institutionalMetrics(few);
  const fb1 = byId(r1, 'experience.studentFeedback') || {};
  check('Three responses: suppressed, whatever the storage allows', fb1.state === 'suppressed', fb1.state);
  check('...saying the promise is kept in the reporting too',
    /anonymity the survey promised/i.test(fb1.closes || ''), fb1.closes);

  // ...and the College's own conduct is reported anyway, over the same
  // three responses. This is the assertion that would break if someone
  // "tidied up" by suppressing both.
  const loop1 = byId(r1, 'experience.feedbackClosedLoop') || {};
  check('The College\'s own answer rate is reported over that same small cohort',
    loop1.state === 'measured', loop1.state);
  check('...and says plainly that not one survey has been answered',
    loop1.value && loop1.value.surveysWithARecordedDecision === 0 && loop1.value.percentClosed === 0,
    JSON.stringify(loop1.value));

  const many = freshEnv(1);
  seed(many, 14);
  many.DB.prepare(`INSERT INTO feedback_actions
    (id, survey_id, finding, outcome, detail, decided_by, decided_at, reported_to_learners_at)
    VALUES ('act_1','svy_1','The assessment brief was unclear.','changed',
            'Rewritten, with a worked example added.','usr_1','2027-02-01T00:00:00Z','2027-02-02T00:00:00Z')`).bind().run();
  const r2 = await M.institutionalMetrics(many);
  const fb2 = byId(r2, 'experience.studentFeedback') || {};
  check('Fourteen responses: measured', fb2.state === 'measured', fb2.state);
  check('...counting them, and how many surveys were answered',
    fb2.value && fb2.value.responses === 14 && fb2.value.surveysAnswered === 1, JSON.stringify(fb2.value));
  const loop2 = byId(r2, 'experience.feedbackClosedLoop') || {};
  check('And the loop closes, including whether learners were told',
    loop2.value && loop2.value.percentClosed === 100 && loop2.value.decisionsReportedBackToLearners === 1,
    JSON.stringify(loop2.value));
}

// ---------------------------------------------------------------------
// Early intervention: the metric that is embarrassing on purpose
// ---------------------------------------------------------------------
// A College can raise concerns diligently and speak to none of the
// people it raised them about. Only `neverContacted` distinguishes an
// early warning system from a filing habit, so it is reported, is not
// suppressed, and is asserted here.
{
  const empty = await M.institutionalMetrics(freshEnv(0));
  const s0 = byId(empty, 'success.concerns') || {};
  check('Early intervention is declared', !!s0.id);
  check('...reporting no concerns, because nobody is studying',
    s0.state === 'insufficient_data' && s0.value === null, s0.state);
  check('...and saying that no trigger can fire because no threshold has been set',
    /NOT SET/.test(s0.closes || '') && /inventing it/.test(s0.closes || ''),
    (s0.closes || '(absent)').slice(0, 100));

  const env = freshEnv(3);
  env.DB.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at)
    VALUES ('enr_a','usr_1',1,'active','2027-01-01T00:00:00Z')`).bind().run();
  // Three concerns. One reached the learner and closed; two did not.
  env.DB.prepare(`INSERT INTO learner_concerns
    (id, user_id, enrolment_id, raised_by, raised_at, observation, contacted_at, contacted_by, outcome, outcome_note, closed_at)
    VALUES ('con_a','usr_1','enr_a','usr_2','2027-02-01T00:00:00Z','No activity for three weeks.',
            '2027-02-02T00:00:00Z','usr_2','resumed','They restarted the module.','2027-02-10T00:00:00Z')`).bind().run();
  env.DB.prepare(`INSERT INTO learner_concerns (id, user_id, raised_by, raised_at, observation)
    VALUES ('con_b','usr_2','usr_3','2027-02-03T00:00:00Z','Assessment unattempted.')`).bind().run();
  env.DB.prepare(`INSERT INTO learner_concerns (id, user_id, raised_by, raised_at, observation)
    VALUES ('con_c','usr_3','usr_3','2027-02-04T00:00:00Z','Marks falling across three pieces.')`).bind().run();

  const s1 = byId(await M.institutionalMetrics(env), 'success.concerns') || {};
  check('Three concerns over three learners: measured, not suppressed', s1.state === 'measured', s1.state);
  check('...counting what was raised', s1.value && s1.value.concernsRaised === 3, JSON.stringify(s1.value));
  check('...and, separately, how many learners were never actually spoken to',
    s1.value && s1.value.neverContacted === 2 && s1.value.openAndNeverContacted === 2,
    JSON.stringify(s1.value));
  check('The figures are never broken down by learner',
    s1.value && !Object.keys(s1.value).some((k) => /user|name|email|id$/i.test(k)),
    Object.keys(s1.value || {}).join(', '));
}

// ---------------------------------------------------------------------
// The quality cycle: the number that cannot be dressed up
// ---------------------------------------------------------------------
// Cycles held and actions agreed both flatter. longestCarryForward
// counts the distance between what the College resolved and what it
// did, and it is computed by walking the `continues` chain rather than
// stored, so it cannot be improved without changing the actions.
{
  const empty = await M.institutionalMetrics(freshEnv(0));
  const q0 = byId(empty, 'quality.reviewCycle') || {};
  check('The review cycle is declared', !!q0.id);
  check('...reporting no cycles held', q0.state === 'insufficient_data' && q0.value === null, q0.state);
  check('...and saying the cadence is a proposal, not a decision',
    /NOT SET/.test(q0.closes || '') && /proposals, not decisions/.test(q0.closes || ''),
    (q0.closes || '(absent)').slice(0, 100));

  const env = freshEnv(1);
  const run = (sql) => env.DB.prepare(sql).bind().run();
  run(`INSERT INTO review_cycles (id, reference, kind, title, period_start, period_end, due_at, status, considered_by, considered_at)
    VALUES ('c1','AM-2027','annual_monitoring','Annual monitoring 2027','2027-01-01T00:00:00Z','2027-12-31T00:00:00Z','2028-02-01T00:00:00Z','closed','Academic Senate','2028-01-20T00:00:00Z')`);
  run(`INSERT INTO review_cycles (id, reference, kind, title, period_start, period_end, due_at)
    VALUES ('c2','AM-2028','annual_monitoring','Annual monitoring 2028','2028-01-01T00:00:00Z','2028-12-31T00:00:00Z','2029-02-01T00:00:00Z')`);
  run(`INSERT INTO review_findings (id, cycle_id, sequence, finding, source, evidence)
    VALUES ('f1','c1',1,'Competency mapping unstarted.','staff','0 of 360 mapped; governance A6d.')`);
  run(`INSERT INTO review_findings (id, cycle_id, sequence, finding, source, evidence)
    VALUES ('f2','c2',1,'Competency mapping still unstarted.','staff','0 of 360 mapped, a year on.')`);
  run(`INSERT INTO review_actions (id, finding_id, cycle_id, action, owner_role, due_at, completed_at, outcome_note)
    VALUES ('a0','f1','c1','Publish the rubric policy.','Academic Director','2028-03-01T00:00:00Z','2028-02-10T00:00:00Z','Published and enforced by a test.')`);
  run(`INSERT INTO review_actions (id, finding_id, cycle_id, action, owner_role, due_at)
    VALUES ('a1','f1','c1','Map the 360 assessments.','Academic Director','2028-03-01T00:00:00Z')`);
  run(`INSERT INTO review_actions (id, finding_id, cycle_id, action, owner_role, due_at, continues)
    VALUES ('a2','f2','c2','Map the 360 assessments.','Academic Director','2029-03-01T00:00:00Z','a1')`);

  const q1 = byId(await M.institutionalMetrics(env), 'quality.reviewCycle') || {};
  check('Two cycles: measured', q1.state === 'measured', q1.state);
  check('...one of them considered by a body, one still outstanding',
    q1.value && q1.value.consideredByABody === 1 && q1.value.stillOutstanding === 1, JSON.stringify(q1.value));
  check('...and the same undone action, carried once, is reported as a chain of two',
    q1.value && q1.value.longestCarryForward === 2, JSON.stringify(q1.value));

  // Carrying it a second time makes the number worse, which is the
  // entire behaviour being asserted.
  run(`INSERT INTO review_cycles (id, reference, kind, title, period_start, period_end, due_at)
    VALUES ('c3','AM-2029','annual_monitoring','Annual monitoring 2029','2029-01-01T00:00:00Z','2029-12-31T00:00:00Z','2030-02-01T00:00:00Z')`);
  run(`INSERT INTO review_findings (id, cycle_id, sequence, finding, source, evidence)
    VALUES ('f3','c3',1,'Competency mapping still unstarted.','staff','0 of 360 mapped, two years on.')`);
  run(`INSERT INTO review_actions (id, finding_id, cycle_id, action, owner_role, due_at, continues)
    VALUES ('a3','f3','c3','Map the 360 assessments.','Academic Director','2030-03-01T00:00:00Z','a2')`);
  const q2 = byId(await M.institutionalMetrics(env), 'quality.reviewCycle') || {};
  check('Carrying it again makes the number worse, not the same',
    q2.value && q2.value.longestCarryForward === 3, JSON.stringify(q2.value));
}

// ---------------------------------------------------------------------
// Conferral integrity: the number that must always be zero
// ---------------------------------------------------------------------
// An award with no conferral record is a qualification the College
// cannot show was earned. The composite foreign key makes it impossible
// to attach an award to an audit that FAILED; only this reports an
// award with no audit at all.
{
  const env = freshEnv(1);
  const r0 = byId(await M.institutionalMetrics(env), 'registry.conferralIntegrity') || {};
  check('Conferral integrity is always measured, even with nothing conferred',
    r0.state === 'measured', r0.state);
  check('...and reads zero orphans over an empty Register',
    r0.value && r0.value.awardsInRegister === 0 && r0.value.awardsWithoutAConferralRecord === 0,
    JSON.stringify(r0.value));

  // An award smuggled in without a conferral — which conferAward()
  // cannot produce, so it is written directly, as a tamperer would.
  env.DB.prepare(`INSERT INTO awards
    (id, user_id, level_id, award_title, post_nominal, cefr, credits, tqt_hours,
     holder_name, conferred_on, verification_code, prev_digest, digest, seq, created_at)
    VALUES ('awd_orphan','usr_1',6,'Worldwide English Proficiency Certificate','WEPC','C2',20,200,
            'Nobody In Particular','2027-07-01','WEC-AAAA-BBBB-CCCCC','WEC-REGISTER-GENESIS',
            'd0','1','2027-07-01T00:00:00Z')`).bind().run();
  const r1 = byId(await M.institutionalMetrics(env), 'registry.conferralIntegrity') || {};
  check('An award with no conferral record is reported, not hidden',
    r1.value && r1.value.awardsWithoutAConferralRecord === 1, JSON.stringify(r1.value));
  check('...as something to investigate before it is relied upon',
    /cannot show was earned/.test(r1.closes || ''), (r1.closes || '(absent)').slice(0, 90));
}

// ---------------------------------------------------------------------
// Readiness is evidenced by RECORDS, never by the existence of a table
// ---------------------------------------------------------------------
// This assertion exists because the report failed it. Four readiness
// areas asked sqlite_master whether a table existed, which was a fine
// proxy while none of them did — and stopped being one the moment
// migration 029 created moderation_records. An EMPTY table flipped
// "Internal moderation" to evidenced, and the document an accreditation
// reviewer reads would have claimed the College could evidence
// consistent marking on the strength of a CREATE TABLE.
{
  const empty = freshEnv(1);
  const r = await M.institutionalMetrics(empty);
  const areas = Object.fromEntries(r.accreditationReadiness.areas.map((a) => [a.area, a]));
  for (const name of ['Internal moderation', 'External examining',
    'Academic misconduct procedure', 'Student voice']) {
    check(`"${name}" is not evidenced by an empty register`,
      areas[name] && areas[name].evidenced === false, JSON.stringify(areas[name]));
    check(`...and its gap says the register exists and is empty, rather than that nothing exists`,
      /exists|appointed/i.test((areas[name] || {}).gap || ''), (areas[name] || {}).gap);
  }

  // And it flips on a RECORD, not on a schema change.
  empty.DB.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_r','crs_level_1',97,'M')`).bind().run();
  empty.DB.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES ('itm_r','unt_r',1,'assignment','A')`).bind().run();
  empty.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_m1','clerk','m1','m1@example.com','staff')`).bind().run();
  empty.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_m2','clerk','m2','m2@example.com','staff')`).bind().run();
  empty.DB.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade, graded_at, graded_by, submitted_at)
    VALUES ('asub_r','itm_r','usr_1','graded',0.7,'2027-05-01T00:00:00Z','usr_m1','2027-04-01T00:00:00Z')`).bind().run();
  empty.DB.prepare(`INSERT INTO moderation_records (id, submission_id, first_marker, first_mark, moderator, moderator_mark, moderated_at, agreed_mark)
    VALUES ('mod_r','asub_r','usr_m1',0.7,'usr_m2',0.7,'2027-05-02T00:00:00Z',0.7)`).bind().run();
  const r2 = await M.institutionalMetrics(empty);
  const mod = r2.accreditationReadiness.areas.find((a) => a.area === 'Internal moderation');
  check('One real moderation record does evidence it', mod.evidenced === true, JSON.stringify(mod));
  const modMetric = byId(r2, 'assessment.moderation') || {};
  check('...and the metric measures the divergence, not merely the count',
    modMetric.state === 'measured' && 'meanDivergence' in (modMetric.value || {}),
    JSON.stringify(modMetric.value));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
