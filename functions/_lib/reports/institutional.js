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
 * Governance A7 named three metrics with no table anywhere in the
 * platform — attendance, academic integrity, student feedback — and all
 * three now have one. Graduate destinations remains genuinely
 * uninstrumented, and will until there are graduates.
 *
 * A dashboard would simply not show them, and their absence would read
 * as "nothing to report". Here they appear with the same weight as
 * everything else, saying plainly what is missing and what would close
 * it. An accreditation reviewer asking "how do you monitor attendance"
 * gets an honest answer instead of a silence.
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
 * `functions/_lib/academic/attendance.js` began reading it; migration
 * 023 created `misconduct_cases` and governance decision C9 adopted the
 * misconduct procedure on 14 August 2026, published at
 * /students/integrity/; and migration 025 created `feedback_surveys`
 * for the student-voice instrument.
 *
 * All three now report `insufficient_data` instead of
 * `not_instrumented`, which is a different and better answer: the
 * instrument exists and nothing has used it yet, rather than nothing
 * existing to use.
 *
 * A register that keeps reporting a gap the College has closed is
 * making a false statement about itself in the safe-sounding direction,
 * and CLAUDE.md § 5 does not have an exemption for understatement. Each
 * entry below is re-stated to what is true on 20 August 2026, and each
 * says precisely which half is instrumented and which half is not —
 * because for attendance, one half still is not: `engagement.attendance`
 * has all the data it needs and no agreed DEFINITION for a rate, because
 * governance A7's question — presence at a session, or engagement with
 * the module? — is unsettled. The register says so rather than picking
 * one and letting a number be quoted as though the College had decided.
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

  // Moderation (migration 029). The instrument exists; the figure that
  // matters is not "how many were moderated" but how far the two
  // markers were apart, because a moderation process where the second
  // marker always agrees is a rubber stamp with a timestamp.
  const marked = await db(env).prepare(
    "SELECT COUNT(*) AS n FROM assignment_submissions WHERE grade IS NOT NULL").first();
  const moderated = await db(env).prepare(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN ABS(first_mark - moderator_mark) >= 0.1 THEN 1 ELSE 0 END) AS diverged,
            AVG(ABS(first_mark - moderator_mark)) AS meanGap
       FROM moderation_records`).first();
  const nMarked = (marked && marked.n) || 0;
  const nMod = (moderated && moderated.n) || 0;
  out.push({
    id: 'assessment.moderation', name: 'Internal moderation',
    question: 'What proportion of marked work is second-marked, and how far do markers diverge?',
    requires: 'moderation_records',
    ...(nMod === 0
      ? {
        state: 'insufficient_data', value: null,
        closes: nMarked === 0
          ? 'The first marked submission. Nothing has been taught, so nothing has been marked and nothing needs moderating.'
          : `${nMarked} submission(s) carry a mark and none has been moderated. The College cannot yet evidence that its marking is consistent, which is among the first things an accreditation reviewer asks.`,
      }
      : {
        state: 'measured', closes: null,
        value: {
          markedSubmissions: nMarked,
          moderated: nMod,
          percentModerated: pct(nMod, nMarked),
          divergedByTenPointsOrMore: moderated.diverged,
          meanDivergence: Math.round((moderated.meanGap || 0) * 1000) / 10,
        },
      }),
  });

  // External examining (migration 029). The metric that decides whether
  // any qualification can be conferred at all — see the graduation
  // audit — so it reports the appointment, not merely the reports.
  const examiners = await db(env).prepare(
    `SELECT COUNT(*) AS n FROM external_examiners WHERE status = 'appointed'`).first();
  const reports = await db(env).prepare(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN judgement = 'standards_not_met' THEN 1 ELSE 0 END) AS adverse,
            SUM(CASE WHEN judgement <> 'standards_met' AND response IS NULL THEN 1 ELSE 0 END) AS unanswered
       FROM external_examiner_reports`).first();
  const nEx = (examiners && examiners.n) || 0;
  out.push({
    id: 'assessment.externalExaminer', name: 'External examiner reporting',
    question: 'What has an independent External Examiner said about the standard of the College\'s assessment?',
    requires: 'external_examiners, external_examiner_reports',
    ...(nEx === 0
      ? {
        state: 'insufficient_data', value: null,
        closes: 'Appointing an External Examiner. This is an institutional act, not a software feature — the register exists and is empty. Until it is not, every graduation audit fails on this requirement and the College confers nothing, which is its own published position.',
      }
      : {
        state: 'measured', closes: null,
        value: {
          examinersAppointed: nEx,
          reportsReceived: (reports && reports.n) || 0,
          reportsJudgingStandardsNotMet: (reports && reports.adverse) || 0,
          // Should always be zero: the schema refuses a conditional or
          // adverse report with no written response. Reported anyway,
          // because a guarantee worth having is worth measuring.
          reportsAwaitingACollegeResponse: (reports && reports.unanswered) || 0,
        },
      }),
  });

  return out;
}

// ---------------------------------------------------------------------
// The metrics with no instrument at all
// ---------------------------------------------------------------------
function uninstrumentedMetrics() {
  return [
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
  // COUNT THE RECORDS, NOT THE TABLES.
  //
  // These four used to ask sqlite_master whether a table existed, which
  // was a reasonable proxy while none of them did. It stopped being one
  // the moment migration 029 created moderation_records: an EMPTY table
  // flipped "Internal moderation" to evidenced, and this report — the
  // one an accreditation reviewer reads — would have claimed the College
  // could evidence consistent marking on the strength of a CREATE TABLE.
  //
  // That is the exact failure the College's editorial rule forbids, made
  // by the report whose job is to prevent it. A capability is evidenced
  // by records, never by the existence of somewhere to put them.
  //
  // Student voice reads feedback_responses rather than the misnamed
  // `student_feedback`, which never existed under that name — so that
  // row was permanently, accidentally correct, and is now correct on
  // purpose.
  const [coverage, moderation, examiner, misconduct, feedback, awards] = await Promise.all([
    competencyCoverage(env),
    db(env).prepare('SELECT COUNT(*) AS n FROM moderation_records').first(),
    db(env).prepare('SELECT COUNT(*) AS n FROM external_examiner_reports').first(),
    db(env).prepare('SELECT COUNT(*) AS n FROM misconduct_cases').first(),
    db(env).prepare('SELECT COUNT(*) AS n FROM feedback_responses').first(),
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
      evidence: moderation.n > 0 ? `${moderation.n} moderation record(s), each second-marked by somebody other than the first marker.` : null,
      gap: moderation.n > 0 ? null
        : 'The moderation register exists (migration 029) and is empty, because nothing has been marked. The College cannot yet evidence that its marking is consistent.' },
    { area: 'External examining', evidenced: examiner.n > 0,
      evidence: examiner.n > 0 ? `${examiner.n} External Examiner report(s) received.` : null,
      gap: examiner.n > 0 ? null
        : 'No External Examiner has been appointed. The register exists (migration 029) and is empty, and until it is not, every graduation audit fails on this requirement and nothing is conferred.' },
    { area: 'Academic misconduct procedure', evidenced: misconduct.n > 0,
      evidence: misconduct.n > 0 ? `${misconduct.n} case(s) handled under the adopted procedure.` : null,
      gap: misconduct.n > 0 ? null
        : 'The procedure exists and is enforced in the schema (governance C9, migration 023). The case register is empty because nothing has been assessed — which is the honest state, not a gap to close by inventing cases.' },
    { area: 'Student voice', evidenced: feedback.n > 0,
      evidence: feedback.n > 0 ? `${feedback.n} survey response(s) collected.` : null,
      gap: feedback.n > 0 ? null
        : 'The feedback instrument exists (migration 025) and no survey has been answered, because nobody has been taught.' },
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
// ---------------------------------------------------------------------
// Live session attendance
// ---------------------------------------------------------------------
// Two metrics, and the split between them is the whole point.
//
// `engagement.attendance` is the FACT: how many sessions were held that
// required attendance, and how many learners were recorded present.
// Migration 024 made that recordable, so it is reported.
//
// `engagement.attendanceRate` is the DEFINITION, and it is deliberately
// left uncomputed. Governance A7 named the decision — does attendance
// mean presence at a live session, or engagement with the module? — and
// it has not been taken. A rate published before that decision would be
// answering a question the College has not agreed on, and the answer
// would then be quoted back as though it had.
//
// A dashboard would show one number and let the reader assume it meant
// whatever they wanted. This shows the count and names the missing
// decision.
// `engagement.attendance` above (engagementMetrics()) already measures
// presence from `attendance_records` — the table the live attendance
// API actually writes. This function used to duplicate that under the
// same metric id, reading `session_attendance` (migration 024), a
// table nothing in the codebase writes to; it always reported
// insufficient_data and never could report anything else. Removed
// rather than fixed forward: `engagement.attendance`'s own note already
// says plainly that live-session joining is not instrumented, which is
// the fact this function existed to report.
//
// The one thing here worth keeping is the governance gap below: A7's
// open decision — does "attendance" mean presence at a live session or
// engagement with the module — is real and distinct from either
// measurement, so it stays as its own metric.
async function attendanceMetrics(env) {
  // The decision, declared as a metric so that it cannot be quietly
  // skipped. It reports not_instrumented not because the data is
  // missing but because the QUESTION is unsettled — and the register
  // says which of the two it is.
  return [gap(
    'engagement.attendanceRate', 'Attendance rate',
    'What proportion of the cohort attends the teaching the College offers?',
    'Not data — a definition. The records exist; what a rate means does not.',
    'Governance A7\'s open decision: does attendance mean presence at a live session, or engagement with the module? The platform can measure both, and will publish neither as "the attendance rate" until the Board says which one that is. This is an unsettled question, not missing information.',
  )];
}

// ---------------------------------------------------------------------
// The student voice
// ---------------------------------------------------------------------
// Two metrics again, and again the second is the interesting one.
//
// `experience.studentFeedback` is what learners said. Suppressed hard:
// three responses to an anonymous survey about one module are not three
// anonymous opinions, because a cohort that small is readable. The
// promise made when the survey was published is kept in the reporting
// as well as in the storage.
//
// `experience.feedbackClosedLoop` is what the College DID about it —
// the proportion of surveys that produced a recorded decision, acted on
// or declined with a reason. It is the metric that decides whether the
// instrument survives. A College that collects opinion and answers none
// of it gets a worse response rate every round until the survey is
// measuring nothing but the patience of the few who still fill it in.
async function studentVoiceMetrics(env) {
  const d = db(env);
  const surveys = await d.prepare(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN anonymous = 1 THEN 1 ELSE 0 END) AS anonymous
       FROM feedback_surveys`).first();
  const responses = await d.prepare(
    `SELECT COUNT(*) AS n, COUNT(DISTINCT survey_id) AS surveys
       FROM feedback_responses`).first();
  const acted = await d.prepare(
    `SELECT COUNT(DISTINCT survey_id) AS surveys, COUNT(*) AS actions,
            SUM(CASE WHEN reported_to_learners_at IS NOT NULL THEN 1 ELSE 0 END) AS reported
       FROM feedback_actions`).first();

  const nSurveys = (surveys && surveys.n) || 0;
  const nResponses = (responses && responses.n) || 0;
  const out = [];

  out.push({
    id: 'experience.studentFeedback', name: 'Student feedback',
    question: 'What do learners say about the teaching, the materials and the platform?',
    requires: 'feedback_surveys, feedback_responses',
    ...(nResponses === 0
      ? {
        state: 'insufficient_data', value: null,
        closes: nSurveys === 0
          ? 'The first survey. None has been published, because nothing has been taught and nobody has an opinion of it yet.'
          : `${nSurveys} survey(s) are published and none has been answered. A survey nobody answers is a finding about the survey.`,
      }
      : (nResponses < MIN_COHORT
        ? {
          state: 'suppressed', value: null, cohort: nResponses,
          closes: `Withheld: ${nResponses} response(s), below the reporting threshold of ${MIN_COHORT}. A cohort this small is readable — reporting it would break the anonymity the survey promised, whatever the storage does.`,
        }
        : {
          state: 'measured', closes: null,
          value: {
            surveysPublished: nSurveys,
            anonymousSurveys: surveys.anonymous,
            responses: nResponses,
            surveysAnswered: responses.surveys,
          },
        })),
  });

  out.push({
    id: 'experience.feedbackClosedLoop', name: 'Feedback acted upon',
    question: 'What did the College change because of what learners said, and were they told?',
    requires: 'feedback_actions',
    ...(nSurveys === 0
      ? { state: 'insufficient_data', value: null, closes: 'The first survey. Nothing has been asked, so nothing is outstanding.' }
      : {
        // Always measured once surveys exist, and deliberately so. This
        // one is not suppressed by cohort size: it is a fact about the
        // College's own conduct, not about any learner, and a College
        // that answered none of its surveys should not be able to hide
        // that behind a small-n rule.
        state: 'measured', closes: null,
        value: {
          surveysPublished: nSurveys,
          surveysWithARecordedDecision: (acted && acted.surveys) || 0,
          decisionsRecorded: (acted && acted.actions) || 0,
          decisionsReportedBackToLearners: (acted && acted.reported) || 0,
          percentClosed: pct((acted && acted.surveys) || 0, nSurveys),
        },
      }),
  });

  return out;
}

// ---------------------------------------------------------------------
// Student success and early intervention
// ---------------------------------------------------------------------
// The point of this pair is that the second one is embarrassing on
// purpose.
//
// `success.concerns` says how many learners the College noticed might
// be in trouble. `success.concernsUnreached` says how many of them it
// never actually spoke to. A College can look diligent on the first and
// be doing nothing at all; only the second distinguishes an early
// warning system from a filing habit.
//
// Neither is suppressed by cohort size. Both are counts of the
// institution's own conduct, and the numbers are deliberately never
// broken down by learner.
async function successMetrics(env) {
  const d = db(env);
  const t = await d.prepare(
    `SELECT COUNT(*) AS n, SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved
       FROM intervention_triggers`).first();
  const c = await d.prepare(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN closed_at IS NULL THEN 1 ELSE 0 END) AS open,
            SUM(CASE WHEN contacted_at IS NULL THEN 1 ELSE 0 END) AS unreached,
            SUM(CASE WHEN closed_at IS NULL AND contacted_at IS NULL THEN 1 ELSE 0 END) AS openAndUnreached,
            COUNT(DISTINCT user_id) AS learners
       FROM learner_concerns`).first();

  const triggers = (t && t.n) || 0;
  const approved = (t && t.approved) || 0;
  const n = (c && c.n) || 0;

  return [{
    id: 'success.concerns', name: 'Learners the College noticed',
    question: 'How many learners has the College identified as possibly in difficulty, and what happened?',
    requires: 'learner_concerns, intervention_triggers',
    ...(n === 0
      ? {
        state: 'insufficient_data', value: null,
        closes: approved === 0
          ? `The register is empty and none of its ${triggers} triggers is approved, so nothing can fire. Every threshold is recorded as NOT SET, because the College has taught nobody and has no evidence from which to choose one — setting a number now would be inventing it. Academic Senate approval, informed by a real cohort, is what closes this.`
          : 'The first concern. Triggers are approved and the register is empty.',
      }
      : {
        state: 'measured', closes: null,
        value: {
          triggersApproved: approved,
          concernsRaised: n,
          learners: c.learners,
          stillOpen: c.open,
          // The number that matters. See the note above.
          neverContacted: c.unreached,
          openAndNeverContacted: c.openAndUnreached,
        },
      }),
  }];
}

// ---------------------------------------------------------------------
// The quality cycle
// ---------------------------------------------------------------------
// Three numbers, and the third is the one that tells the truth.
//
// Cycles held is easy to look good on. Actions agreed is easier still.
// `longestCarryForward` — how many consecutive cycles the same undone
// thing has been carried into — is the number that cannot be dressed
// up, because it counts the distance between what the College resolved
// and what it did.
//
// Computed with a recursive walk of the `continues` chain rather than
// stored, so it cannot be edited to look better without editing the
// actions themselves.
async function qualityCycleMetrics(env) {
  const d = db(env);
  const cycles = await d.prepare(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN status IN ('considered','closed') THEN 1 ELSE 0 END) AS considered,
            SUM(CASE WHEN status IN ('scheduled','in_progress') THEN 1 ELSE 0 END) AS outstanding
       FROM review_cycles`).first();
  const actions = await d.prepare(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN completed_at IS NULL AND continues IS NULL THEN 1 ELSE 0 END) AS openNotCarried
       FROM review_actions`).first();
  const chain = await d.prepare(
    `WITH RECURSIVE chain(id, n) AS (
       SELECT id, 1 FROM review_actions WHERE continues IS NULL
       UNION ALL
       SELECT a.id, c.n + 1 FROM review_actions a JOIN chain c ON a.continues = c.id
     )
     SELECT MAX(n) AS deepest FROM chain`).first();
  const approved = await d.prepare(
    `SELECT COUNT(*) AS n FROM review_schedule WHERE status = 'approved'`).first();

  const n = (cycles && cycles.n) || 0;
  return [{
    id: 'quality.reviewCycle', name: 'Programme review and annual monitoring',
    question: 'Does the College review its own programmes on a cycle, and what became of what it agreed?',
    requires: 'review_cycles, review_findings, review_actions',
    ...(n === 0
      ? {
        state: 'insufficient_data', value: null,
        closes: ((approved && approved.n) || 0) === 0
          ? 'An approved cadence, and a cohort to review. All three review kinds are defined and every cadence is recorded as NOT SET — twelve and sixty months are entered as proposals, not decisions. Academic Senate approval is what closes this.'
          : 'The first cycle. The cadence is approved and no cycle has yet run.',
      }
      : {
        state: 'measured', closes: null,
        value: {
          cyclesHeld: n,
          consideredByABody: cycles.considered,
          stillOutstanding: cycles.outstanding,
          actionsAgreed: (actions && actions.n) || 0,
          actionsCompleted: (actions && actions.completed) || 0,
          actionsOpenAndNotCarriedForward: (actions && actions.openNotCarried) || 0,
          // The number that cannot be dressed up.
          longestCarryForward: (chain && chain.deepest) || 0,
        },
      }),
  }];
}

// ---------------------------------------------------------------------
// Conferral integrity
// ---------------------------------------------------------------------
// This metric should always read zero, and the day it does not is the
// most serious thing in the register.
//
// `conferrals` binds each award to the graduation audit it was earned
// under, by a composite foreign key with the outcome pinned to 'met'.
// That makes it impossible to attach an award to an audit that failed,
// or to one belonging to another learner or level. What a foreign key
// cannot do is force every award to HAVE one — see migration 028 on why
// a trigger was not used — so this is the reporting half of that
// guarantee, and it is stated as a number rather than assumed.
async function conferralIntegrityMetrics(env) {
  const d = db(env);
  const awards = await d.prepare("SELECT COUNT(*) AS n FROM awards WHERE status <> 'replaced'").first();
  const unaudited = await d.prepare(
    `SELECT COUNT(*) AS n FROM awards a LEFT JOIN conferrals c ON c.award_id = a.id
      WHERE c.award_id IS NULL`).first();
  const audits = await d.prepare(
    `SELECT COUNT(*) AS n, SUM(CASE WHEN outcome = 'met' THEN 1 ELSE 0 END) AS passed
       FROM graduation_audits`).first();

  const n = (awards && awards.n) || 0;
  const orphans = (unaudited && unaudited.n) || 0;

  return [{
    id: 'registry.conferralIntegrity', name: 'Conferral integrity',
    question: 'Can the College show, for every qualification it has conferred, the audit that says it was earned?',
    requires: 'conferrals, graduation_audits',
    // Always measured, even at zero awards, and never suppressed. This
    // is a fact about the Register, not about any graduate, and the
    // answer "we have conferred nothing" is itself worth stating.
    state: 'measured',
    value: {
      awardsInRegister: n,
      awardsWithoutAConferralRecord: orphans,
      auditsRun: (audits && audits.n) || 0,
      auditsPassed: (audits && audits.passed) || 0,
    },
    closes: orphans === 0 ? null
      : `${orphans} award(s) in the Register have no conferral record behind them. Each is a qualification the College cannot show was earned, and each must be investigated before it is reissued or relied upon.`,
  }];
}

// ---------------------------------------------------------------------
// Academic integrity
// ---------------------------------------------------------------------
// This metric used to sit in uninstrumentedMetrics() because the College
// had no misconduct register and no procedure. Migration 023 built both,
// so it moves here — but note carefully what that changes and what it
// does not.
//
// It changes the STATE: `not_instrumented` meant "we do not collect
// this", which is no longer true. It becomes `insufficient_data`, which
// means "the instrument exists and nothing has used it".
//
// It does NOT change the VALUE. An empty register still reports null,
// never zero. "No cases recorded" and "no cases occurred" are different
// statements, and while nothing has been taught and nobody assessed,
// only the first is true. A College that published a zero here would be
// publishing a fact about its own inactivity dressed as a fact about
// its learners' conduct.
async function integrityMetrics(env) {
  const cases = await db(env).prepare(
    `SELECT COUNT(*) AS n,
            SUM(CASE WHEN determined_at IS NULL THEN 1 ELSE 0 END) AS undetermined,
            SUM(CASE WHEN outcome = 'no_case_to_answer' THEN 1 ELSE 0 END) AS cleared,
            SUM(CASE WHEN appeal_lodged_at IS NOT NULL THEN 1 ELSE 0 END) AS appealed,
            COUNT(DISTINCT user_id) AS learners
       FROM misconduct_cases`).first();

  const n = (cases && cases.n) || 0;
  const base = {
    id: 'integrity.misconduct', name: 'Academic misconduct',
    question: 'How many academic-integrity cases has the College opened, and how were they resolved?',
    requires: 'misconduct_cases',
  };

  if (n === 0) {
    return [{
      ...base, state: 'insufficient_data', value: null,
      closes: 'The first case, if there is ever one. The register exists and is empty because nothing has been taught and nobody has been assessed — "no cases recorded" and "no cases occurred" are different statements, and only the first is true today.',
    }];
  }

  // Misconduct is the most identifying figure in the register: a case
  // count over a small cohort names the person it counts. Suppressed by
  // the number of LEARNERS involved, not the number of cases, because
  // three cases against one learner is still one learner.
  if (cases.learners < MIN_COHORT) {
    return [{
      ...base, state: 'suppressed', value: null, cohort: cases.learners,
      closes: `Withheld: ${cases.learners} learner(s) are involved, below the reporting threshold of ${MIN_COHORT}. A case count over a cohort this small identifies the individual rather than describing the College.`,
    }];
  }

  return [{
    ...base, state: 'measured', closes: null,
    value: {
      opened: n,
      awaitingDetermination: cases.undetermined,
      noCaseToAnswer: cases.cleared,
      appealed: cases.appealed,
      learners: cases.learners,
    },
  }];
}

export async function institutionalMetrics(env) {
  const [progression, engagement, attendance, assessment, integrity, voice, success, quality, conferral, financial, readiness] = await Promise.all([
    progressionMetrics(env), engagementMetrics(env), attendanceMetrics(env),
    assessmentMetrics(env), integrityMetrics(env), studentVoiceMetrics(env),
    successMetrics(env), qualityCycleMetrics(env), conferralIntegrityMetrics(env),
    financialMetrics(env), accreditationReadiness(env),
  ]);
  const metrics = [...progression, ...engagement, ...attendance, ...assessment, ...integrity, ...voice, ...success, ...quality, ...conferral, ...uninstrumentedMetrics(), ...financial];

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
