/* The Institutional Metric Register.
 *
 * Not a dashboard. A dashboard shows the numbers it happens to have, and
 * an executive reads the absence of a panel as the absence of a problem.
 * This is a REGISTER: every metric the College has undertaken to watch
 * is declared here whether or not it can currently be computed, and each
 * one carries its own state.
 *
 *   measured          — computed from real records
 *   suppressed        — computable, withheld because the cohort is too
 *                       small to report without identifying people
 *   insufficient_data — the instrument exists, nothing has used it yet
 *   not_instrumented  — the College does not collect this at all
 *
 * `not_instrumented` is the reason this file is shaped like a register.
 * Metrics the Executive named have had no table anywhere in the
 * platform. A dashboard would simply not show them, and their absence
 * would read as "nothing to report". Here they appear with the same
 * weight as everything else, saying plainly what is missing and what
 * would close it. An accreditation reviewer asking "how do you monitor
 * attendance" gets an honest answer instead of a silence.
 *
 * ────────────────────────────────────────────────────────────────
 * A REGISTER OF GAPS GOES STALE WHEN A GAP IS CLOSED
 * ────────────────────────────────────────────────────────────────
 * That is the failure this section now guards against, because it
 * happened. This file declared attendance `not_instrumented` with the
 * words "`live_sessions` exists; nothing records who was there", and
 * academic misconduct as having neither a register nor a documented
 * procedure. Both were exactly true when written. Then migration 020
 * created `attendance_records`, `functions/api/staff/attendance.js`
 * began writing registers into it and
 * `functions/_lib/academic/attendance.js` began reading it; and
 * governance decision C9 adopted the misconduct procedure on
 * 14 August 2026, published at /students/integrity/.
 *
 * A register that keeps reporting a gap the College has closed is
 * making a false statement about itself in the safe-sounding direction,
 * and CLAUDE.md § 5 does not have an exemption for understatement. Both
 * entries below are re-stated to what is true on 20 August 2026, and
 * each says precisely which half is instrumented and which half is not
 * — because for both of them, one half still is not.
 *
 * ────────────────────────────────────────────────────────────────
 * SMALL COHORTS ARE SUPPRESSED, NOT ROUNDED
 * ────────────────────────────────────────────────────────────────
 * "100% completion" over one learner is not a statistic, it is that
 * learner's record with a percentage sign on it. Anyone who knows who is
 * enrolled can read an individual's outcome out of a small-n rate, so
 * rates below the threshold are withheld rather than published — the
 * same discipline `lms/time-on-task.js` already applies to measured
 * workload.
 *
 * The College's cohort is currently zero. Nearly everything here will
 * report `insufficient_data` for some time, and that is the correct
 * answer rather than a defect to engineer around.
 */
import { db } from '../db.js';
import { competencyCoverage } from '../registry/profile.js';

/** Below this, a rate identifies people rather than describing a cohort. */
export const MIN_COHORT = 10;

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);

/**
 * A metric that cannot be computed, declared rather than omitted.
 *
 * `closes` is the operative field: it says what would have to exist for
 * this to become measurable, so the register doubles as the work list.
 */
function gap(id, name, question, requires, closes, state = 'not_instrumented') {
  return { id, name, question, state, value: null, requires, closes };
}

// ---------------------------------------------------------------------
// Learner success and progression
// ---------------------------------------------------------------------
async function progressionMetrics(env) {
  const enrolments = await db(env)
    .prepare(`SELECT status, COUNT(*) AS n FROM enrolments GROUP BY status`).all();
  const byStatus = Object.fromEntries(enrolments.results.map((r) => [r.status, r.n]));
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const out = [];

  out.push({
    id: 'enrolments.total', name: 'Enrolments', question: 'How many level enrolments does the College hold?',
    state: total ? 'measured' : 'insufficient_data',
    value: total ? { total, byStatus } : null,
    requires: 'enrolments',
    closes: total ? null : 'The first learner enrolment.',
  });

  const completed = byStatus.completed || 0;
  out.push({
    id: 'progression.completionRate',
    name: 'Level completion rate',
    question: 'Of enrolments that have concluded, what share concluded in completion?',
    // Withdrawn and completed are the concluded states; active enrolments
    // are not failures and must not be counted as such. A rate over ALL
    // enrolments would fall every time the College recruited, which is
    // the opposite of what the number is for.
    ...(() => {
      const concluded = completed + (byStatus.withdrawn || 0);
      if (concluded === 0) return { state: 'insufficient_data', value: null, closes: 'The first enrolment to conclude.' };
      if (concluded < MIN_COHORT) {
        return {
          state: 'suppressed', value: null, cohort: concluded,
          closes: `${MIN_COHORT - concluded} more concluded enrolments. Below ${MIN_COHORT} a rate identifies individuals.`,
        };
      }
      return { state: 'measured', value: { percent: pct(completed, concluded), completed, concluded }, closes: null };
    })(),
    requires: 'enrolments.status',
  });

  const units = await db(env)
    .prepare(`SELECT COUNT(DISTINCT p.user_id) AS learners,
                     SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) AS completed,
                     COUNT(*) AS touched
                FROM unit_progress p`).first();
  out.push({
    id: 'progression.moduleCompletion',
    name: 'Module completion',
    question: 'How many modules have learners completed, across the College?',
    state: units.touched ? 'measured' : 'insufficient_data',
    value: units.touched ? { modulesCompleted: units.completed, modulesStarted: units.touched, learners: units.learners } : null,
    requires: 'unit_progress',
    closes: units.touched ? null : 'The first learner to open a module.',
  });

  const awards = await db(env)
    .prepare(`SELECT COUNT(*) AS n, COUNT(DISTINCT user_id) AS holders FROM awards WHERE status = 'conferred'`).first();
  out.push({
    id: 'outcomes.awardsConferred',
    name: 'Awards conferred',
    question: 'How many awards does the College currently hold as conferred?',
    state: awards.n ? 'measured' : 'insufficient_data',
    value: awards.n ? { awards: awards.n, holders: awards.holders } : null,
    requires: 'awards',
    closes: awards.n ? null : 'The first conferral. Blocked on governance C4 (award architecture) and C5 (who may confer).',
  });

  return out;
}

// ---------------------------------------------------------------------
// Engagement
// ---------------------------------------------------------------------
async function engagementMetrics(env) {
  const t = await db(env)
    .prepare(`SELECT COUNT(DISTINCT user_id) AS learners, SUM(seconds) AS seconds FROM time_on_task`).first();
  const out = [];

  out.push({
    id: 'engagement.measuredHours',
    name: 'Measured study time',
    question: 'How many hours have learners actually spent working, as instrumented?',
    ...(t.learners === 0
      ? { state: 'insufficient_data', value: null, closes: 'The first instrumented study session.' }
      : t.learners < MIN_COHORT
        ? { state: 'suppressed', value: null, cohort: t.learners,
          closes: `${MIN_COHORT - t.learners} more learners. A mean over a handful of people is one person's habits.` }
        : { state: 'measured', closes: null,
          value: { totalHours: Math.round((t.seconds || 0) / 360) / 10, learners: t.learners,
            meanHoursPerLearner: Math.round((t.seconds || 0) / t.learners / 360) / 10 } }),
    requires: 'time_on_task',
    // Said on the metric, because the distinction is easy to lose and
    // expensive to lose: this is not TQT.
    note: 'Measured time is what learners did. It is not Total Qualification Time, which is the College\'s design figure for the award and is identical for every holder.',
  });

  const recordings = await db(env)
    .prepare(`SELECT COUNT(*) AS n, COUNT(DISTINCT user_id) AS learners FROM learner_recordings`).first();
  out.push({
    id: 'engagement.spokenSubmissions',
    name: 'Spoken submissions',
    question: 'How much speaking practice are learners submitting?',
    state: recordings.n ? 'measured' : 'insufficient_data',
    value: recordings.n ? { recordings: recordings.n, learners: recordings.learners } : null,
    requires: 'learner_recordings',
    closes: recordings.n ? null : 'The first learner recording.',
  });

  // ATTENDANCE — instrumented since migration 020, and still only half
  // of what the name promises.
  //
  // This metric stood in `uninstrumentedMetrics()` for as long as there
  // was no table, saying "`live_sessions` exists; nothing records who
  // was there". That is no longer true: `attendance_records` exists,
  // POST /api/staff/attendance writes a tutor's register into it, and
  // functions/_lib/academic/attendance.js derives states from study
  // evidence. It is computed here now, and it reports the state its own
  // vocabulary already had for "the instrument exists, nothing has used
  // it yet".
  //
  // WHAT IS STILL NOT INSTRUMENTED, and it is named on the metric
  // rather than hidden by a measured-looking number: nothing observes
  // who JOINS a live session. `engage.counts.live_session` in
  // data/academic-regulations.json is `instrumented: false,
  // requires_host_confirmation: true`, so every live-session row in
  // this table is a person's register, taken by hand. A percentage of
  // the cohort attending, computed over hand-taken registers, would
  // report tutor diligence as learner behaviour.
  const attendance = await db(env)
    .prepare(`SELECT COUNT(*) AS rows, COUNT(DISTINCT user_id) AS learners,
                     SUM(CASE WHEN basis = 'live_session' THEN 1 ELSE 0 END) AS sessions,
                     SUM(CASE WHEN recorded_via = 'staff_register' THEN 1 ELSE 0 END) AS byRegister
                FROM attendance_records`).first();
  out.push({
    id: 'engagement.attendance',
    name: 'Attendance and engagement',
    question: 'Who was present — at a live session, or in the week\'s work — and how is that known?',
    ...(attendance.rows === 0
      ? { state: 'insufficient_data', value: null,
        closes: 'The first register taken, or the first window in which a learner\'s own study evidence reaches the published measure.' }
      : attendance.learners < MIN_COHORT
        ? { state: 'suppressed', value: null, cohort: attendance.learners,
          closes: `${MIN_COHORT - attendance.learners} more learners. A presence rate over a handful of people names them.` }
        : { state: 'measured', closes: null,
          value: { records: attendance.rows, learners: attendance.learners,
            liveSessionRecords: attendance.sessions, takenByAPerson: attendance.byRegister } }),
    requires: 'attendance_records',
    note: 'Engagement is instrumented; live-session attendance is not. Nothing observes who joins a session, so every live-session row here was written by a member of staff — see engage.counts.live_session, which is recorded as not instrumented and requiring host confirmation. No proportion-of-cohort figure is published, and none should be until joining is observed rather than attested.',
  });

  return out;
}

// ---------------------------------------------------------------------
// Assessment, quality, and the things nothing measures
// ---------------------------------------------------------------------
async function assessmentMetrics(env) {
  const out = [];

  const attempts = await db(env)
    .prepare(`SELECT COUNT(*) AS n, COUNT(DISTINCT user_id) AS learners, AVG(score) AS mean FROM quiz_attempts`).first();
  out.push({
    id: 'assessment.quizVolume',
    name: 'Quiz attempts',
    question: 'How much summative and formative quizzing is happening?',
    ...(attempts.n === 0
      ? { state: 'insufficient_data', value: null, closes: 'The first quiz attempt.' }
      : attempts.learners < MIN_COHORT
        ? { state: 'suppressed', value: null, cohort: attempts.learners,
          closes: `${MIN_COHORT - attempts.learners} more learners before a mean score can be published.` }
        : { state: 'measured', closes: null,
          value: { attempts: attempts.n, learners: attempts.learners, meanScore: Math.round(attempts.mean * 1000) / 10 } }),
    requires: 'quiz_attempts',
  });

  // Marking TURNAROUND, deliberately not "faculty performance".
  //
  // graded_by and graded_at are recorded, so how long work waits IS
  // measurable and is a real service-quality question. Whether a marker
  // marks WELL is a different question that needs moderation records,
  // which do not exist — and publishing turnaround under the heading
  // "performance" would let a fast marker read as a good one.
  const marking = await db(env)
    .prepare(`SELECT COUNT(*) AS graded,
                     COUNT(DISTINCT graded_by) AS markers,
                     AVG(julianday(graded_at) - julianday(submitted_at)) AS meanDays
                FROM assignment_submissions
               WHERE status IN ('graded','returned') AND graded_at IS NOT NULL`).first();
  out.push({
    id: 'assessment.markingTurnaround',
    name: 'Marking turnaround',
    question: 'How long does submitted work wait to be marked?',
    ...(marking.graded === 0
      ? { state: 'insufficient_data', value: null, closes: 'The first graded submission.' }
      : { state: 'measured', closes: null,
        value: { graded: marking.graded, markers: marking.markers,
          meanDays: Math.round((marking.meanDays || 0) * 10) / 10 } }),
    requires: 'assignment_submissions.graded_at',
    note: 'Turnaround is a service measure, not a judgement of marking quality. Marking quality requires moderation records, which the College does not yet keep — see assessment.moderation below.',
  });

  const coverage = await competencyCoverage(env);
  out.push({
    id: 'assessment.competencyCoverage',
    name: 'Competency coverage',
    question: 'Does the curriculum satisfy the Academic Framework\'s own rule on competency assessment?',
    // Always 'measured'. The rule is checkable today and the answer is
    // "no" — which is a finding, not missing data, and reporting it as
    // insufficient_data would hide a known non-compliance behind an
    // apparent lack of information.
    state: 'measured',
    value: {
      compliant: coverage.compliant,
      rule: coverage.rule,
      assessmentsMapped: coverage.totalMapped,
      assessmentsTotal: coverage.totalAssessments,
      shortfalls: coverage.shortfalls,
    },
    requires: 'assessment_competencies',
    closes: coverage.compliant ? null
      : 'Governance A6d — mapping the 360 authored assessments to the six competencies. Academic work for the Academic Director; the platform will not generate it.',
  });

  out.push(gap(
    'assessment.moderation', 'Internal moderation',
    'What proportion of marked work is second-marked or moderated, and how far do markers diverge?',
    'A moderation record: a second mark against the same submission, attributed and dated.',
    'A moderation table and a moderation step in the marking workflow. Until then the College cannot evidence that its marking is consistent — which is among the first things an accreditation reviewer asks.',
  ));

  out.push(gap(
    'assessment.externalExaminer', 'External examiner reporting',
    'What has an independent external examiner said about the standard of the College\'s assessment?',
    'An external examiner appointment, and their reports.',
    'Appointing an external examiner. This is an institutional act, not a software feature; the platform can hold the reports once there are any.',
  ));

  return out;
}

// ---------------------------------------------------------------------
// The metrics with no instrument at all
// ---------------------------------------------------------------------
function uninstrumentedMetrics() {
  return [
    gap(
      'integrity.misconduct', 'Academic misconduct',
      'How many academic-integrity cases has the College opened, and how were they resolved?',
      'A misconduct case record: allegation, evidence, process, outcome, appeal. The procedure exists — governance decision C9, adopted 14 August 2026 and published at /students/integrity/ — and no table holds a case under it. `registrar_cases` hears appeals, complaints, withdrawals, deferrals and transfers, and excludes misconduct from its kinds deliberately, because a matter that can end a learner\'s enrolment should not share a queue with a request to defer.',
      'A misconduct case register the adopted procedure can be recorded in. The College has the procedure and not the register, so it still cannot answer this and must not imply a zero — "no cases recorded" and "no cases occurred" are different statements, and only the first is true.',
    ),
    gap(
      'experience.studentFeedback', 'Student feedback',
      'What do learners say about the teaching, the materials and the platform?',
      'A structured feedback instrument and its responses.',
      'A feedback mechanism. Nothing in the platform collects learner opinion today, so any statement about learner satisfaction would be unfounded.',
    ),
    gap(
      'outcomes.graduateDestinations', 'Graduate outcomes',
      'What do graduates go on to do, and did the award help?',
      'A destinations survey, some months after conferral.',
      'A survey instrument, and graduates to send it to. Blocked behind the first conferral, and behind consent to be contacted after leaving.',
    ),
  ];
}

// ---------------------------------------------------------------------
// Financial
// ---------------------------------------------------------------------
async function financialMetrics(env) {
  const p = await db(env)
    .prepare(`SELECT status, COUNT(*) AS n, SUM(amount_cents) AS minor,
                     SUM(amount_usd_cents) AS usd, currency
                FROM payments GROUP BY status, currency`).all();
  const succeeded = p.results.filter((r) => r.status === 'succeeded');
  const r = await db(env).prepare('SELECT COUNT(*) AS n, SUM(amount_cents) AS minor FROM refunds').first();

  return [{
    id: 'finance.receipts',
    name: 'Receipts',
    question: 'What has the College actually received, and in what currencies?',
    state: succeeded.length ? 'measured' : 'insufficient_data',
    value: succeeded.length
      ? {
        byCurrency: succeeded.map((x) => ({ currency: x.currency, payments: x.n, minorUnits: x.minor })),
        // Summable ONLY because `amount_usd_cents` was written at the
        // rate in effect on the payment date and frozen there. Summing
        // the native amounts, or re-converting them at today's rate,
        // would silently restate every past period each time a rate
        // moved. The distinction is the whole reason that column exists.
        normalisedUsdCents: succeeded.reduce((n, x) => n + (x.usd || 0), 0),
        refunds: { count: r.n || 0, minorUnits: r.minor || 0 },
      }
      : null,
    requires: 'payments.amount_usd_cents',
    closes: succeeded.length ? null : 'The first settled payment.',
    note: 'The USD figure is the sum of each payment normalised at the rate in effect on ITS OWN date, not a re-conversion of native amounts at today\'s rate. Native amounts are reported per currency and are never added together.',
  }];
}

// ---------------------------------------------------------------------
// Accreditation readiness
// ---------------------------------------------------------------------
/**
 * A self-evaluation instrument, and nothing more.
 *
 * It reports what the College can and cannot currently evidence. It does
 * NOT score readiness out of ten, because a number invites the reading
 * that a high one means recognition is near — and recognition is granted
 * by a body, not earned by a checklist. Every row is a plain statement
 * of whether the evidence exists.
 */
async function accreditationReadiness(env) {
  const [coverage, moderation, examiner, misconduct, feedback, awards] = await Promise.all([
    competencyCoverage(env),
    db(env).prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='moderation_records'").first(),
    db(env).prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='external_examiner_reports'").first(),
    db(env).prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='misconduct_cases'").first(),
    db(env).prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='student_feedback'").first(),
    db(env).prepare("SELECT COUNT(*) AS n FROM awards WHERE status='conferred'").first(),
  ]);

  const rows = [
    { area: 'Programme specification', evidenced: true,
      evidence: 'docs/academic-framework.md and docs/curriculum-framework.md — levels, credit model, GLH/ILH/TQT, learning hours.' },
    { area: 'Curriculum content', evidenced: true,
      evidence: '60 authored modules across six levels, seeded and tested end to end.' },
    { area: 'Assessment regulations', evidenced: false,
      evidence: null, gap: 'Pass marks, resit policy and progression rules are drafted but not adopted — governance B1, B2, B3.' },
    { area: 'Competency framework mapped to assessment', evidenced: coverage.compliant,
      evidence: coverage.compliant ? 'Every assessment mapped; the framework rule is satisfied.' : null,
      gap: coverage.compliant ? null : `${coverage.totalMapped} of ${coverage.totalAssessments} assessments mapped. Governance A6d.` },
    { area: 'Internal moderation', evidenced: moderation.n > 0,
      evidence: null, gap: 'No moderation records are kept. The College cannot evidence that its marking is consistent.' },
    { area: 'External examining', evidenced: examiner.n > 0,
      evidence: null, gap: 'No external examiner has been appointed.' },
    { area: 'Academic misconduct procedure', evidenced: misconduct.n > 0,
      evidence: null, gap: 'No misconduct register and no documented procedure.' },
    { area: 'Student voice', evidenced: feedback.n > 0,
      evidence: null, gap: 'No feedback instrument exists.' },
    { area: 'Academic records and certification', evidenced: true,
      evidence: 'Hash-chained Graduate Register, signed credentials, public verification portal, issued documents with frozen payloads.' },
    { area: 'Data protection', evidenced: false,
      evidence: null, gap: 'Retention and erasure policy drafted, not adopted — governance D1, D2, D3.' },
    { area: 'Awards conferred', evidenced: awards.n > 0,
      evidence: null, gap: 'No award has been conferred. The award architecture awaits approval — governance C4, C5.' },
  ];

  return {
    // Stated first and unmissably, because this is the document most
    // likely to be quoted out of context.
    statement: 'Worldwide English College holds no accreditation, recognition or affiliation from any external body, and has not applied for any. This is an INTERNAL self-evaluation instrument. It records what the College can and cannot currently evidence about its own practice. Nothing here constitutes, implies or anticipates external recognition.',
    evidenced: rows.filter((r) => r.evidenced).length,
    total: rows.length,
    areas: rows,
  };
}

/** The whole register. */
export async function institutionalMetrics(env) {
  const [progression, engagement, assessment, financial, readiness] = await Promise.all([
    progressionMetrics(env), engagementMetrics(env), assessmentMetrics(env),
    financialMetrics(env), accreditationReadiness(env),
  ]);
  const metrics = [...progression, ...engagement, ...assessment, ...uninstrumentedMetrics(), ...financial];

  const byState = metrics.reduce((acc, m) => { acc[m.state] = (acc[m.state] || 0) + 1; return acc; }, {});

  return {
    minCohort: MIN_COHORT,
    // The summary counts every state, so "how much of this can we
    // actually answer" is the first thing visible rather than something
    // a reader has to work out by scrolling.
    summary: { total: metrics.length, ...byState },
    metrics,
    accreditationReadiness: readiness,
    caveat: `Rates over fewer than ${MIN_COHORT} people are withheld, not rounded: a percentage over a handful of learners is an individual's record with a percentage sign on it.`,
  };
}
