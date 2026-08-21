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

  // ENGAGEMENT.ATTENDANCE LEFT THIS LIST ON 20 AUGUST 2026, and it is
  // worth saying why here rather than only in the file it left.
  //
  // It sat here because `live_sessions` existed and nothing recorded who
  // was there. Migration 020 created `attendance_records`,
  // functions/api/staff/attendance.js writes registers into it and
  // functions/_lib/academic/attendance.js derives states from a
  // learner's own study evidence — so the register was reporting a gap
  // the College had closed, which is a false statement about itself in
  // the flattering-by-modesty direction. The metric is computed now, and
  // its two halves are asserted separately below: that it reports
  // insufficient_data rather than not_instrumented on an empty database,
  // and that it still says plainly that nobody observes who JOINS a live
  // session.
  for (const id of ['integrity.misconduct',
    'experience.studentFeedback', 'outcomes.graduateDestinations']) {
    const m = byId(r, id);
    check(`${id} is declared rather than omitted`, !!m, 'missing from the register entirely');
    if (m) {
      check(`...marked not_instrumented, not zero`, m.state === 'not_instrumented' && m.value === null, m.state);
      check(`...naming what data it would need`, !!m.requires && m.requires.length > 20);
    }
  }

  // The distinction that matters most on this particular metric.
  // Read defensively: when a sabotage removes the metric entirely these
  // must FAIL, not throw. A suite that dies on a finding reports one
  // line of stack instead of the results that locate it.
  const mis = byId(r, 'integrity.misconduct') || {};
  check('Misconduct explicitly distinguishes "none recorded" from "none occurred"',
    /different statements/i.test(mis.closes || ''), (mis.closes || '(absent)').slice(0, 90));
  check('Misconduct says the procedure is adopted and the register is what is missing',
    /adopted 14 August 2026/.test(mis.requires || '') && /excludes misconduct/i.test(mis.requires || ''),
    (mis.requires || '(absent)').slice(0, 120));

  // Attendance: instrumented, unused, and honest about which half of
  // itself is which.
  const att = byId(r, 'engagement.attendance') || {};
  check('Attendance is declared', !!att.id);
  check('...as insufficient_data on an empty database, not as uninstrumented',
    att.state === 'insufficient_data' && att.value === null, att.state);
  check('...reading the table that now exists', att.requires === 'attendance_records', att.requires);
  check('...and still says that nobody observes who joins a live session',
    /live-session attendance is not/i.test(att.note || '')
    && /written by a member of staff/i.test(att.note || ''),
    (att.note || '(absent)').slice(0, 120));
  check('...and publishes no proportion-of-cohort figure while that is true',
    /No proportion-of-cohort figure is published/i.test(att.note || ''));
}

// Attendance, once there is something to count: suppressed under the
// cohort floor exactly as every other rate is, never rounded and never
// published over a handful of people.
{
  const env = freshEnv(0);
  env.DB.prepare(`INSERT INTO units (id, course_id, sequence, title)
    VALUES ('unt_att','crs_level_1',1,'Module 1')`).bind().run();
  for (let i = 1; i <= 3; i++) {
    env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
      VALUES ('usr_at${i}','clerk','c_at${i}','at${i}@example.com','student')`).bind().run();
    env.DB.prepare(`INSERT INTO attendance_records
        (id, user_id, basis, unit_id, window_start, window_end, state, evidence_kind, recorded_via, recorded_by)
      VALUES ('att_${i}','usr_at${i}','module_engagement','unt_att','2026-08-01T00:00:00.000Z','2026-08-08T00:00:00.000Z',
              'attended','staff_register','staff_register','usr_at1')`).bind().run();
  }
  const att = byId(await M.institutionalMetrics(env), 'engagement.attendance') || {};
  check('Attendance over three learners is suppressed, not published',
    att.state === 'suppressed' && att.value === null && att.cohort === 3, att.state);
  check('...and says how many more learners would close it',
    /more learners/.test(att.closes || ''), att.closes);
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

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
