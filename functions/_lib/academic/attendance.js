/* ATTENDANCE, FOR A COLLEGE THAT DOES NOT TAKE ONE.
 *
 * THE FAULT THIS FILE CORRECTS. `functions/_lib/reports/institutional.js`
 * reports attendance as `not_instrumented` — one of three metrics the
 * Executive undertook to watch that had no table anywhere in the
 * platform. The tables now exist, and the obvious next move is the wrong
 * one: build a register, mark learners present and absent, and give an
 * asynchronous college a roll call it has no business keeping.
 *
 * docs/academic-framework.md § XI forbids exactly that — "The College is
 * asynchronous, so attendance is the wrong measure" — and
 * data/academic-regulations.json § engagement states the alternative in
 * numbers: engagement with a MODULE inside a SEVEN-DAY WINDOW anchored to
 * the learner's own start date, satisfied by any one of several
 * independent pieces of evidence the server produced itself.
 *
 * So this file measures engagement and calls it engagement, everywhere,
 * including in the payload it hands the browser. The learner-facing
 * notice is a required field of that payload rather than a caption the
 * UI may drop, because a grid of green and red cells with the word
 * "attendance" over it is a roll call whatever the API called it.
 *
 * ────────────────────────────────────────────────────────────────
 * WHAT IS COUNTED, AND THE ONE THING THAT IS DELIBERATELY NOT
 * ────────────────────────────────────────────────────────────────
 * Five signals, each carrying the clause it satisfies and the row it was
 * read from, so a learner disputing a state is shown the evidence rather
 * than an assertion:
 *
 *   time_on_task            twenty measured minutes (engage.counts.time_on_task)
 *   quiz_attempts           an attempt in the window (engage.counts.assessment)
 *   assignment_submissions  a submission in the window (engage.counts.assessment)
 *   learner_recordings      laboratory practice (§ XI)
 *   unit_progress           a lesson completed (§ XI)
 *
 * And the thing that is not counted: `time_on_task` holds ONE row per
 * learner per module carrying a running total, `first_seen_at` and
 * `last_seen_at`. When that whole span lies inside one window, every
 * second of the total was accrued inside it and the minutes are exact.
 * When it straddles the boundary, the only fact available is that a beat
 * landed in the window — an instant of an open page, and
 * `engage.not.inferred` says in terms that engagement is "never inferred
 * from an open tab". So a straddling row is REPORTED in the evidence
 * list, marked as not counting, with the reason; it never moves a state.
 * Under-reporting a learner who studied is a smaller fault than
 * publishing an engagement figure the platform did not measure, and both
 * are told to the learner rather than hidden.
 *
 * ────────────────────────────────────────────────────────────────
 * ABSENCE IS THE ABSENCE OF A ROW
 * ────────────────────────────────────────────────────────────────
 * `attendance_records.evidence_kind` is NOT NULL and its six values all
 * name evidence that exists. There is no value meaning "nothing was
 * found", so an `absent` derived from finding nothing cannot be written
 * down truthfully — it would have to borrow a kind it did not read.
 *
 * The neighbouring table already settled this shape: announcement_receipts
 * keeps no unread rows because "absence of a row IS the unread state".
 * The same rule here. The platform persists only what it read — attended
 * and partial — and a closed window with no row derives to absent on
 * read. A person may still write an explicit absent or excused row,
 * because then the evidence genuinely exists: it is their register mark,
 * attributed to them, with their reason on it.
 *
 * The same enum has no value for server-measured study time either, so a
 * state read from `time_on_task` is stored under `lesson_completion` —
 * the § XI measure it belongs to — with `evidence_ref` pointing at the
 * row. The payload is not so coarse: every evidence entry names the
 * table it came from in `signal`, so a learner is shown "time_on_task"
 * and not a category that rounds it off.
 *
 * ────────────────────────────────────────────────────────────────
 * AN OVERRIDE NEVER DESTROYS THE PLATFORM'S OWN READING
 * ────────────────────────────────────────────────────────────────
 * There is no attendance_events table, so a tutor's override overwrites
 * the row it corrects. That would be a problem if the derived state were
 * data; it is not — it is a pure function of evidence that is still
 * there. So every read recomputes it and returns it beside the stored
 * state as `derived`, and a learner told "your tutor marked this absent"
 * can also see what the platform itself read. A correction that hides
 * what it corrected is how a dispute becomes unwinnable.
 *
 * ────────────────────────────────────────────────────────────────
 * LIVE SESSIONS: NOT RECORDED IS NOT NOBODY CAME
 * ────────────────────────────────────────────────────────────────
 * `live_sessions` records that a session existed; nothing observes who
 * joined it, and `engage.counts.live_session` says so
 * (`instrumented: false`, `requires_host_confirmation: true`). A session
 * with no register therefore reports `recorded: false`, never `absent` —
 * the regulation's own words are that "'no attendance recorded' and
 * 'nobody attended' are different statements and only the first is true".
 */

import {
  db, newId, nowIso, ValidationError, NotFoundError,
} from '../db.js';

/* ───────────────────────────────────────────────────────────────
 * THE INSTRUMENT'S NUMBERS
 * ───────────────────────────────────────────────────────────────
 * Restated here because a Pages Function has no filesystem and cannot
 * read data/academic-regulations.json at run time. Restating a constant
 * is how constants drift, so tests/attendance.test.mjs reads the
 * instrument off disk and fails the build the moment any value, id or
 * label below stops matching it. The ids are the contract
 * (conv.identifiers); the numbers are the regulation's, not this file's.
 */
export const ENGAGEMENT = {
  instrument: 'wec.academic_regulations',
  version: '1.0.0',
  clause: 'engage',
  /** engage.window — seven days, anchored to enrolments.started_at. */
  windowDays: 7,
  windowAnchor: 'enrolments.started_at',
  /** engage.counts.time_on_task — twenty server-measured minutes, gte. */
  studyMinutes: 20,
  /** engage.counts.assessment — one attempt or submission, gte. */
  assessmentCount: 1,
  /** engage.counts.live_session — one joined session, host-confirmed. */
  liveSessionCount: 1,
  liveSessionRequiresHostConfirmation: true,
};

/** The clauses of the instrument, quoted by id and label. */
const REGULATION_CLAUSES = [
  {
    id: 'engage.counts.time_on_task',
    label: 'Twenty minutes of server-measured study on that module in the window',
    source: 'data/academic-regulations.json',
  },
  {
    id: 'engage.counts.assessment',
    label: 'A quiz attempt or an assignment submission recorded in the window',
    source: 'data/academic-regulations.json',
  },
  {
    id: 'engage.counts.live_session',
    label: 'A live session for that module or level, joined and confirmed by the host',
    source: 'data/academic-regulations.json',
  },
];

/* Two of the four measures docs/academic-framework.md § XI names have no
 * clause in the regulations instrument, whose `counts_as_engaged` lists
 * three. They are counted, and they are labelled with the document that
 * does name them rather than being quietly filed under a regulation
 * clause that does not cover them. */
const FRAMEWORK_MEASURES = [
  {
    id: 'framework.xi.lesson_completion',
    label: 'Lessons completed against the published pace',
    source: 'docs/academic-framework.md § XI',
  },
  {
    id: 'framework.xi.laboratory_practice',
    label: 'Laboratory practice submitted',
    source: 'docs/academic-framework.md § XI',
  },
];

/** engage.what_it_is_not, entire and verbatim. Nothing here is softened. */
const WHAT_IT_IS_NOT = [
  { id: 'engage.not.a_condition', label: 'Not a condition of any award' },
  { id: 'engage.not.a_mark', label: 'Not a mark, and not a participation grade' },
  { id: 'engage.not.a_measure_of_learning', label: 'Not a measure of learning' },
  { id: 'engage.not.inferred', label: 'Never inferred from an open tab or an issued join link' },
  { id: 'engage.not.published_yet', label: 'Not published as an institutional figure until measured across a real cohort' },
  { id: 'engage.not.a_penalty', label: 'Never a penalty' },
];

/* The sentence itself. It is a required field of every learner-facing
 * payload this module produces — see the header — and each of its claims
 * is one the instrument makes: no attendance requirement
 * (engage.attendance_requirement), a seven-day window anchored to the
 * learner (engage.window), evidence the server produced
 * (engage.what_is_measured), and the three denials it closes on
 * (engage.not.a_mark, engage.not.a_condition, engage.not.a_penalty). */
const NOTICE_STATEMENT =
  'The College teaches asynchronously, so it does not measure attendance. '
  + 'What is recorded here is engagement: whether work on each module reached the College '
  + 'inside a seven-day window anchored to your own start date. Every state below names the '
  + 'evidence it was read from — study time the server measured, an assessment attempted, '
  + 'laboratory practice submitted, a lesson completed, or a live session a host confirmed. '
  + 'It is descriptive. It is not a mark, it is not a condition of any award, and it is never a penalty.';

/**
 * The labelled field the UI cannot omit. Returned at the top of every
 * learner-facing payload, in full, on every request — not behind a flag,
 * not summarised, and not left to a template to remember.
 */
export function engagementNotice() {
  return {
    id: 'engage.measured',
    label: 'This is engagement, measured as follows',
    statement: NOTICE_STATEMENT,
    measuredBy: [...REGULATION_CLAUSES, ...FRAMEWORK_MEASURES],
    isNot: WHAT_IT_IS_NOT,
    window: {
      days: ENGAGEMENT.windowDays,
      anchor: ENGAGEMENT.windowAnchor,
      label: 'A seven-day window, anchored to the learner\'s own start date',
    },
    regulation: {
      instrument: ENGAGEMENT.instrument,
      version: ENGAGEMENT.version,
      clause: ENGAGEMENT.clause,
      prose: 'docs/academic-regulations.md',
    },
  };
}

/** What each stored state means, in the words a learner should read. */
export const STATE_MEANING = {
  attended: 'Work on this module reached the College in this window.',
  partial: `Study on this module was measured in this window, below the ${ENGAGEMENT.studyMinutes} minutes the regulations define as engagement.`,
  absent: 'No work on this module reached the College in this window. This is a description, not a penalty.',
  excused: 'Set aside by the College, with the reason recorded.',
};

export const STATES = Object.keys(STATE_MEANING);
export const BASES = ['live_session', 'module_engagement'];

/* What the platform cannot see. Published to the learner beside their
 * own record, because a measurement whose limits are private is a
 * measurement the reader cannot argue with. */
const LIMITATIONS = [
  {
    id: 'limit.study_time_not_per_window',
    statement: 'Study time is stored as one running total per module, not as a ledger. Minutes are attributed to a window only when the whole of that total was accrued inside it; otherwise the study is reported and not counted.',
    source: 'functions/_lib/lms/time-on-task.js',
  },
  {
    id: 'limit.live_session_not_instrumented',
    statement: 'Nothing observes who joins a live session. A session appears here only once a host has confirmed a register, and a session with no register is reported as not recorded rather than as absent.',
    source: 'data/academic-regulations.json § engage.counts.live_session',
  },
  {
    id: 'limit.offline_study_invisible',
    statement: 'Work done away from the platform is not visible to it. A window with no evidence describes what reached the College, not what a learner did.',
    source: 'decided_here',
  },
];

/* ───────────────────────────────────────────────────────────────
 * WINDOWS
 * ─────────────────────────────────────────────────────────────── */

const DAY_MS = 86400000;
const WINDOW_MS = ENGAGEMENT.windowDays * DAY_MS;

/**
 * The seven-day windows of engage.window, newest last.
 *
 * Anchored to the enrolment and not to a Monday, which is the
 * instrument's own reasoning: a Monday-to-Sunday week is a Western
 * working week and most of this College's learners are in places where
 * the week does not begin on Monday.
 *
 * @param {{anchor:string, now?:number, count:number}} opts
 * @returns {{index:number, ordinal:number, start:string, end:string, closed:boolean, current:boolean}[]}
 */
export function engagementWindows({ anchor, now = Date.now(), count }) {
  const anchorMs = Date.parse(anchor);
  if (!Number.isFinite(anchorMs)) return [];
  const elapsed = now - anchorMs;
  // Before the anchor there is no window. An enrolment that has not
  // started has nothing to report, and reporting week one of a course
  // that begins next month would be an absence nobody could have avoided.
  if (elapsed < 0) return [];

  const currentIndex = Math.floor(elapsed / WINDOW_MS);
  const firstIndex = Math.max(0, currentIndex - count + 1);
  const out = [];
  for (let i = firstIndex; i <= currentIndex; i++) {
    const startMs = anchorMs + i * WINDOW_MS;
    const endMs = startMs + WINDOW_MS;
    out.push({
      index: i,
      ordinal: i + 1,
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      closed: endMs <= now,
      current: i === currentIndex,
    });
  }
  return out;
}

/* ───────────────────────────────────────────────────────────────
 * EVIDENCE
 * ───────────────────────────────────────────────────────────────
 * Every source is fetched for the learner across the whole level and
 * bucketed into windows in JavaScript rather than filtered by a SQL
 * BETWEEN. Timestamps in this database come from three writers — a
 * schema default, nowIso(), and test and seed fixtures — and they do not
 * all carry milliseconds. String comparison over mixed ISO precision
 * sorts 'Z' above '.', which would put a row in the wrong window for
 * reasons no reader of the SQL could see. Date.parse() cannot make that
 * mistake, and the volumes here are one learner's own records.
 */

async function loadEvidence(env, { userId, levelId }) {
  const q = (sql) => db(env).prepare(sql).bind(userId, levelId).all();

  const [study, progress, quizzes, assignments, recordings] = await Promise.all([
    q(`SELECT t.id AS id, t.unit_id AS unitId, t.seconds AS seconds,
              t.first_seen_at AS firstSeenAt, t.last_seen_at AS lastSeenAt
         FROM time_on_task t
         JOIN units u ON u.id = t.unit_id
         JOIN courses c ON c.id = u.course_id
        WHERE t.user_id = ? AND c.level_id = ?`),
    q(`SELECT p.id AS id, p.unit_id AS unitId, p.completed_at AS at
         FROM unit_progress p
         JOIN units u ON u.id = p.unit_id
         JOIN courses c ON c.id = u.course_id
        WHERE p.user_id = ? AND c.level_id = ? AND p.status = 'completed'
              AND p.completed_at IS NOT NULL`),
    q(`SELECT a.id AS id, i.unit_id AS unitId, a.submitted_at AS at
         FROM quiz_attempts a
         JOIN learning_items i ON i.id = a.learning_item_id
         JOIN units u ON u.id = i.unit_id
         JOIN courses c ON c.id = u.course_id
        WHERE a.user_id = ? AND c.level_id = ?`),
    q(`SELECT s.id AS id, i.unit_id AS unitId, s.submitted_at AS at
         FROM assignment_submissions s
         JOIN learning_items i ON i.id = s.learning_item_id
         JOIN units u ON u.id = i.unit_id
         JOIN courses c ON c.id = u.course_id
        WHERE s.user_id = ? AND c.level_id = ?`),
    q(`SELECT r.id AS id, i.unit_id AS unitId, r.submitted_at AS at
         FROM learner_recordings r
         JOIN learning_items i ON i.id = r.learning_item_id
         JOIN units u ON u.id = i.unit_id
         JOIN courses c ON c.id = u.course_id
        WHERE r.user_id = ? AND c.level_id = ? AND r.purged_at IS NULL`),
  ]);

  return {
    study: study.results,
    progress: progress.results,
    quizzes: quizzes.results,
    assignments: assignments.results,
    recordings: recordings.results,
  };
}

const within = (at, win) => {
  const ms = Date.parse(at);
  return Number.isFinite(ms) && ms >= Date.parse(win.start) && ms < Date.parse(win.end);
};

/**
 * Every piece of evidence for one module in one window, each entry
 * saying which clause it satisfies and whether it counts.
 *
 * Exported because it is the answer to "why does my record say that",
 * and that question must be answerable without re-deriving the state.
 */
export function evidenceFor(evidence, unitId, win) {
  const out = [];

  const tot = evidence.study.find((r) => r.unitId === unitId);
  if (tot && tot.seconds > 0) {
    const spanStart = Date.parse(tot.firstSeenAt);
    const spanEnd = Date.parse(tot.lastSeenAt);
    const winStart = Date.parse(win.start);
    const winEnd = Date.parse(win.end);
    const attributable = spanStart >= winStart && spanEnd < winEnd;
    const touched = spanEnd >= winStart && spanEnd < winEnd;
    if (attributable) {
      const minutes = Math.floor(tot.seconds / 60);
      out.push({
        kind: 'lesson_completion',
        signal: 'time_on_task',
        ref: tot.id,
        at: tot.lastSeenAt,
        clause: 'engage.counts.time_on_task',
        source: 'data/academic-regulations.json',
        minutes,
        counts: minutes >= ENGAGEMENT.studyMinutes,
        statement: `${minutes} minute${minutes === 1 ? '' : 's'} of study on this module, measured by the server between ${tot.firstSeenAt} and ${tot.lastSeenAt}.`,
      });
    } else if (touched) {
      out.push({
        kind: 'lesson_completion',
        signal: 'time_on_task',
        ref: tot.id,
        at: tot.lastSeenAt,
        clause: 'engage.counts.time_on_task',
        source: 'data/academic-regulations.json',
        minutes: null,
        counts: false,
        statement: 'Study on this module continued into this window, but the running total also covers time outside it, so no minutes can be attributed here. The regulations forbid inferring engagement from an open page, so this is reported and not counted.',
      });
    }
  }

  for (const row of evidence.progress) {
    if (row.unitId !== unitId || !within(row.at, win)) continue;
    out.push({
      kind: 'lesson_completion', signal: 'unit_progress', ref: row.id, at: row.at,
      clause: 'framework.xi.lesson_completion', source: 'docs/academic-framework.md § XI',
      counts: true, statement: `This module was completed on ${row.at}.`,
    });
  }
  for (const row of evidence.quizzes) {
    if (row.unitId !== unitId || !within(row.at, win)) continue;
    out.push({
      kind: 'assessment_attempt', signal: 'quiz_attempts', ref: row.id, at: row.at,
      clause: 'engage.counts.assessment', source: 'data/academic-regulations.json',
      counts: true, statement: `A quiz on this module was attempted on ${row.at}.`,
    });
  }
  for (const row of evidence.assignments) {
    if (row.unitId !== unitId || !within(row.at, win)) continue;
    out.push({
      kind: 'assessment_attempt', signal: 'assignment_submissions', ref: row.id, at: row.at,
      clause: 'engage.counts.assessment', source: 'data/academic-regulations.json',
      counts: true, statement: `An assignment on this module was submitted on ${row.at}.`,
    });
  }
  for (const row of evidence.recordings) {
    if (row.unitId !== unitId || !within(row.at, win)) continue;
    out.push({
      kind: 'laboratory_practice', signal: 'learner_recordings', ref: row.id, at: row.at,
      clause: 'framework.xi.laboratory_practice', source: 'docs/academic-framework.md § XI',
      counts: true, statement: `Laboratory practice on this module was submitted on ${row.at}.`,
    });
  }

  return out;
}

/**
 * The state one module's evidence supports in one window.
 *
 * `partial` exists for exactly one situation and is not a hedge: study
 * time was measured, exactly, and fell short of the twenty minutes the
 * instrument requires. The schema will not accept `partial` without the
 * minutes for the same reason — "a claim about how much without the
 * amount is just 'attended' hedged".
 */
export function deriveState(evidence) {
  const counting = evidence.filter((e) => e.counts);
  if (counting.length) {
    return {
      state: 'attended',
      minutesPresent: counting.find((e) => e.minutes != null)?.minutes ?? null,
      primary: counting[0],
    };
  }
  const measured = evidence.find((e) => e.signal === 'time_on_task' && e.minutes != null);
  if (measured && measured.minutes > 0) {
    return { state: 'partial', minutesPresent: measured.minutes, primary: measured };
  }
  return { state: 'absent', minutesPresent: null, primary: null };
}

/* ───────────────────────────────────────────────────────────────
 * PERSISTENCE
 * ─────────────────────────────────────────────────────────────── */

/**
 * Write the derived record for every CLOSED window.
 *
 * Two rules, both stated in the header and both enforced here:
 *   - only attended and partial are written, because those are the only
 *     states the platform read from evidence;
 *   - a row a person wrote is never overwritten by a sweep. A tutor's
 *     register mark and a learner's declaration are somebody's statement
 *     and the platform does not get to revise them.
 *
 * Open windows are never written. A window still running can still
 * change, and 'absent' committed on a Tuesday for a week ending Friday
 * is a record of the platform's impatience.
 */
export async function persistClosedWindows(env, { userId, levelId, windows, modules, evidence }) {
  let written = 0;
  for (const win of windows) {
    if (!win.closed) continue;
    for (const module of modules) {
      const found = evidenceFor(evidence, module.unitId, win);
      const { state, minutesPresent, primary } = deriveState(found);
      if (state !== 'attended' && state !== 'partial') continue;
      const result = await db(env)
        .prepare(`INSERT INTO attendance_records
            (id, user_id, basis, unit_id, window_start, window_end, state,
             minutes_present, evidence_kind, evidence_ref, recorded_by, recorded_via, created_at)
          VALUES (?, ?, 'module_engagement', ?, ?, ?, ?, ?, ?, ?, NULL, 'platform_signal', ?)
          ON CONFLICT(user_id, unit_id, window_start) WHERE unit_id IS NOT NULL
          DO UPDATE SET state = excluded.state,
                        minutes_present = excluded.minutes_present,
                        evidence_kind = excluded.evidence_kind,
                        evidence_ref = excluded.evidence_ref,
                        window_end = excluded.window_end
            WHERE attendance_records.recorded_via = 'platform_signal'`)
        .bind(newId('att'), userId, module.unitId, win.start, win.end, state,
          minutesPresent, primary.kind, primary.ref, nowIso())
        .run();
      written += result?.meta?.changes ?? 0;
    }
  }
  return { written, levelId };
}

/* ───────────────────────────────────────────────────────────────
 * THE LEARNER'S OWN RECORD
 * ─────────────────────────────────────────────────────────────── */

/** The enrolment a record is read against: the active one, else the most recent. */
async function subjectEnrolment(env, userId, levelId) {
  if (levelId != null) {
    const row = await db(env)
      .prepare(`SELECT e.*, l.roman, l.name AS levelName, l.cefr
                  FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
                 WHERE e.user_id = ? AND e.level_id = ?`)
      .bind(userId, levelId).first();
    // NotFound rather than an empty record: asked for a level they are
    // not enrolled at, a learner should be told that, not shown a grid
    // of absences for a course they never joined.
    if (!row) throw new NotFoundError('You have no enrolment at that level.');
    return row;
  }
  return db(env)
    .prepare(`SELECT e.*, l.roman, l.name AS levelName, l.cefr
                FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
               WHERE e.user_id = ?
               ORDER BY CASE e.status WHEN 'active' THEN 0 ELSE 1 END,
                        COALESCE(e.started_at, e.created_at) DESC
               LIMIT 1`)
    .bind(userId).first();
}

/**
 * One learner's engagement record, by module and by window, with the
 * evidence behind every state.
 *
 * Callers pass the subject id; they never take it from a request. The
 * learner endpoint takes it from the session and the staff endpoint
 * takes it only after checking the teaching relation — see
 * assertMayReadLearner().
 */
export async function learnerEngagement(env, { userId, levelId = null, weeks = 8, now = Date.now(), persist = true }) {
  const notice = engagementNotice();
  const enrolment = await subjectEnrolment(env, userId, levelId);

  if (!enrolment) {
    return {
      engagementNotice: notice,
      learner: { userId, levelId: null },
      windows: [], modules: [],
      liveSessions: { instrumented: false, sessions: [], note: liveSessionNote(false) },
      limitations: LIMITATIONS,
      reason: 'No enrolment yet, so there is no start date to anchor a window to.',
    };
  }
  if (!enrolment.started_at) {
    return {
      engagementNotice: notice,
      learner: enrolmentSummary(userId, enrolment),
      windows: [], modules: [],
      liveSessions: { instrumented: false, sessions: [], note: liveSessionNote(false) },
      limitations: LIMITATIONS,
      // The anchor is a column, not a convenience. Without it the window
      // would have to be anchored to something the instrument did not
      // choose, and every state in the grid would inherit that choice.
      reason: 'This enrolment has not started, so there is no date to anchor a seven-day window to.',
    };
  }

  const windows = engagementWindows({ anchor: enrolment.started_at, now, count: weeks });
  const { results: modules } = await db(env)
    .prepare(`SELECT u.id AS unitId, u.sequence AS sequence, u.title AS title
                FROM units u JOIN courses c ON c.id = u.course_id
               WHERE c.level_id = ? ORDER BY u.sequence ASC`)
    .bind(enrolment.level_id).all();

  const evidence = await loadEvidence(env, { userId, levelId: enrolment.level_id });

  if (persist && windows.length && modules.length) {
    await persistClosedWindows(env, { userId, levelId: enrolment.level_id, windows, modules, evidence });
  }

  const stored = await loadStoredModuleRecords(env, userId, enrolment.level_id);

  const grid = [];
  for (const win of windows) {
    const cells = modules.map((module) => {
      const found = evidenceFor(evidence, module.unitId, win);
      const derived = deriveState(found);
      const row = stored.get(`${module.unitId}|${win.start}`) || null;
      return cell({ module, win, found, derived, row });
    });
    grid.push({ ...win, modules: cells, summary: tally(cells) });
  }

  const byModule = modules.map((module) => {
    const cells = grid.map((w) => {
      const c = w.modules.find((m) => m.unitId === module.unitId);
      return { index: w.index, ordinal: w.ordinal, start: w.start, end: w.end, state: c.state, minutesPresent: c.minutesPresent };
    });
    return { ...module, windows: cells, summary: tally(cells) };
  });

  const liveSessions = await liveSessionRecord(env, { userId, levelId: enrolment.level_id, windows });

  return {
    engagementNotice: notice,
    learner: enrolmentSummary(userId, enrolment),
    window: {
      days: ENGAGEMENT.windowDays,
      anchor: ENGAGEMENT.windowAnchor,
      anchoredOn: enrolment.started_at,
      returned: windows.length,
    },
    windows: grid,
    modules: byModule,
    liveSessions,
    limitations: LIMITATIONS,
  };
}

function enrolmentSummary(userId, e) {
  return {
    userId,
    enrolmentId: e.id,
    levelId: e.level_id,
    levelName: e.levelName,
    roman: e.roman,
    cefr: e.cefr,
    enrolmentStatus: e.status,
    startedAt: e.started_at,
  };
}

/**
 * One cell of the grid. A stored row wins, because a person may have
 * written it — but the platform's own current reading travels beside it
 * under `derived`, always, so a correction never conceals what it
 * corrected.
 */
function cell({ module, win, found, derived, row }) {
  const state = row ? row.state : derived.state;
  return {
    unitId: module.unitId,
    sequence: module.sequence,
    title: module.title,
    windowIndex: win.index,
    windowStart: win.start,
    windowEnd: win.end,
    state,
    meaning: STATE_MEANING[state],
    minutesPresent: row ? row.minutes_present : derived.minutesPresent,
    recordedVia: row ? row.recorded_via : 'platform_signal',
    recordedBy: row ? row.recorded_by : null,
    reason: row ? row.reason : null,
    overridden: Boolean(row) && row.recorded_via !== 'platform_signal',
    derived: { state: derived.state, minutesPresent: derived.minutesPresent },
    provisional: !win.closed,
    evidence: found,
  };
}

function tally(cells) {
  const out = { attended: 0, partial: 0, absent: 0, excused: 0 };
  for (const c of cells) out[c.state] += 1;
  return out;
}

async function loadStoredModuleRecords(env, userId, levelId) {
  const { results } = await db(env)
    .prepare(`SELECT a.* FROM attendance_records a
                JOIN units u ON u.id = a.unit_id
                JOIN courses c ON c.id = u.course_id
               WHERE a.user_id = ? AND c.level_id = ? AND a.basis = 'module_engagement'`)
    .bind(userId, levelId).all();
  const map = new Map();
  for (const r of results) map.set(`${r.unit_id}|${r.window_start}`, r);
  return map;
}

function liveSessionNote(instrumented) {
  return instrumented
    ? 'Live-session participation is recorded only where a host confirmed a register. A session with no register is reported as not recorded, never as an absence.'
    : 'No live-session register has been taken for this level. Nothing observes who joins a session, so the College reports this as not recorded rather than as nobody having attended.';
}

/** Live sessions at this level over the reported span, and their registers. */
async function liveSessionRecord(env, { userId, levelId, windows }) {
  if (!windows.length) return { instrumented: false, sessions: [], note: liveSessionNote(false) };
  const from = windows[0].start;
  const to = windows[windows.length - 1].end;

  const { results } = await db(env)
    .prepare(`SELECT s.id AS id, s.title AS title, s.starts_at AS startsAt,
                     s.duration_minutes AS durationMinutes, s.unit_id AS unitId,
                     a.id AS recordId, a.state AS state, a.minutes_present AS minutesPresent,
                     a.evidence_kind AS evidenceKind, a.evidence_ref AS evidenceRef,
                     a.recorded_via AS recordedVia, a.recorded_by AS recordedBy, a.reason AS reason
                FROM live_sessions s
                LEFT JOIN attendance_records a
                  ON a.live_session_id = s.id AND a.user_id = ?
               WHERE s.level_id = ?
               ORDER BY s.starts_at ASC`)
    .bind(userId, levelId).all();

  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  const sessions = results
    .filter((r) => {
      const ms = Date.parse(r.startsAt);
      return Number.isFinite(ms) && ms >= fromMs && ms < toMs;
    })
    .map((r) => ({
      sessionId: r.id,
      title: r.title,
      startsAt: r.startsAt,
      durationMinutes: r.durationMinutes,
      unitId: r.unitId,
      recorded: Boolean(r.recordId),
      state: r.recordId ? r.state : null,
      meaning: r.recordId ? STATE_MEANING[r.state] : null,
      minutesPresent: r.recordId ? r.minutesPresent : null,
      recordedVia: r.recordId ? r.recordedVia : null,
      recordedBy: r.recordId ? r.recordedBy : null,
      reason: r.recordId ? r.reason : null,
      clause: 'engage.counts.live_session',
      note: r.recordId ? null : 'No register was taken for this session.',
    }));

  const instrumented = sessions.some((s) => s.recorded);
  return { instrumented, sessions, note: liveSessionNote(instrumented) };
}

/* ───────────────────────────────────────────────────────────────
 * WHO A TUTOR MAY READ
 * ───────────────────────────────────────────────────────────────
 * There is no tutor-to-learner assignment table. Inventing one here
 * would be a schema change; assuming "a tutor may read their level"
 * would hand every tutor the whole cohort, which is precisely the query
 * shape message_participants was built to make impossible — "a tutor
 * sees a thread only by holding a row here, so no query shape can return
 * a thread they were never added to".
 *
 * So the relation is composed of the teaching acts that already exist as
 * rows, and each disjunct is a real relationship somebody created:
 *
 *   a live thread they are a party to      message_participants
 *   a booking in their own offered time    slot_bookings + tutorial_slots
 *   a session they hosted and registered   attendance_records + live_sessions
 *   an assignment they marked              assignment_submissions.graded_by
 *   a register they wrote themselves       attendance_records.recorded_by
 *
 * The last is not circular: nothing can be written without the relation
 * already holding, so it only preserves sight of a mark the tutor made.
 */
export async function tutorLearnerIds(env, staffId) {
  const { results } = await db(env)
    .prepare(`SELECT DISTINCT user_id FROM (
        SELECT lp.user_id AS user_id
          FROM message_participants tp
          JOIN message_participants lp
            ON lp.thread_id = tp.thread_id AND lp.party = 'learner' AND lp.left_at IS NULL
         WHERE tp.user_id = ?1 AND tp.party = 'tutor' AND tp.left_at IS NULL
        UNION
        SELECT b.user_id FROM slot_bookings b
          JOIN tutorial_slots s ON s.id = b.slot_id
         WHERE s.tutor_id = ?1
               AND b.status NOT IN ('cancelled_by_learner','cancelled_by_tutor')
        UNION
        SELECT a.user_id FROM attendance_records a
          JOIN live_sessions ls ON ls.id = a.live_session_id
         WHERE ls.host_user_id = ?1
        UNION
        SELECT sub.user_id FROM assignment_submissions sub WHERE sub.graded_by = ?1
        UNION
        SELECT ar.user_id FROM attendance_records ar WHERE ar.recorded_by = ?1
      )`)
    .bind(staffId).all();
  return results.map((r) => r.user_id).filter((id) => id !== staffId);
}

export class TeachingRelationError extends Error {
  constructor(message = 'That learner is not one of yours.') {
    super(message);
    this.name = 'AuthorizationError';
    this.httpStatus = 403;
  }
}

/**
 * The check that stands between a tutor and somebody else's learner.
 *
 * An administrator passes: administrators act on staff and on the whole
 * register by design, and the Registrar reading a case needs the record
 * of a learner no tutor has met. A tutor passes only on the relation
 * above, and the refusal names the rule rather than the learner — a 403
 * that says "no such learner" and a 403 that says "not yours" are
 * different disclosures.
 */
export async function assertMayReadLearner(env, staff, subjectId) {
  if (staff.role === 'admin') return { basis: 'admin' };
  const ids = await tutorLearnerIds(env, staff.id);
  if (!ids.includes(subjectId)) {
    throw new TeachingRelationError(
      'You may read the engagement record of a learner you teach — one you share an open message thread with, who has booked your time, whose work you have marked, or whose register you have taken.',
    );
  }
  return { basis: 'teaching_relation' };
}

/** The tutor's own learners, named, for a roster that is not a search. */
export async function staffRoster(env, staff, { limit = 50 } = {}) {
  const admin = staff.role === 'admin';
  const ids = admin ? null : await tutorLearnerIds(env, staff.id);

  if (!admin && !ids.length) {
    return { basis: 'teaching_relation', learners: [], note: 'No learner is currently in your care.' };
  }

  const rows = admin
    ? (await db(env).prepare(
      `SELECT u.id AS userId, u.preferred_name AS preferredName, u.email AS email,
              e.level_id AS levelId, e.status AS enrolmentStatus, e.started_at AS startedAt
         FROM users u
         LEFT JOIN enrolments e ON e.user_id = u.id AND e.status = 'active'
        WHERE u.role = 'student'
        ORDER BY u.created_at DESC LIMIT ?`).bind(limit).all()).results
    : (await db(env).prepare(
      `SELECT u.id AS userId, u.preferred_name AS preferredName, u.email AS email,
              e.level_id AS levelId, e.status AS enrolmentStatus, e.started_at AS startedAt
         FROM users u
         LEFT JOIN enrolments e ON e.user_id = u.id AND e.status = 'active'
        WHERE u.id IN (${ids.map(() => '?').join(',')})
        ORDER BY u.created_at DESC LIMIT ?`).bind(...ids, limit).all()).results;

  return {
    basis: admin ? 'admin' : 'teaching_relation',
    learners: rows,
    note: admin
      ? 'Administrators read the whole register. A tutor reads only the learners they teach.'
      : 'These are the learners you share a thread with, who booked your time, whose work you marked, or whose register you took.',
  };
}

/* ───────────────────────────────────────────────────────────────
 * THE OVERRIDE
 * ─────────────────────────────────────────────────────────────── */

const isIso = (v) => typeof v === 'string' && Number.isFinite(Date.parse(v)) && /^\d{4}-\d{2}-\d{2}T/.test(v);

/**
 * A member of staff states an engagement fact the platform could not
 * read, or corrects one it read wrongly.
 *
 * The reason is required in every case, not only for 'excused'. The
 * schema requires it there because "an excusal with no reason is an
 * absence somebody quietly forgave"; the same argument covers a tutor
 * writing 'attended' over an 'absent', which is the correction most
 * likely to be asked about later. Every field is rejected rather than
 * coerced, and the derived state is returned beside the new one so the
 * caller can see what they overrode.
 */
export async function recordStaffRegister(env, { actor, userId, basis, unitId = null, liveSessionId = null, windowStart = null, windowEnd = null, state, minutesPresent = null, reason, now = Date.now() }) {
  const fields = {};

  if (!userId || typeof userId !== 'string') fields.userId = 'Required';
  if (!BASES.includes(basis)) fields.basis = `Must be one of: ${BASES.join(', ')}`;
  if (!STATES.includes(state)) fields.state = `Must be one of: ${STATES.join(', ')}`;

  const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
  if (!trimmedReason) fields.reason = 'Required — a register mark is your statement and is recorded with your name against it';
  else if (trimmedReason.length > 2000) fields.reason = 'Must be 2000 characters or fewer';

  if (basis === 'module_engagement') {
    if (!unitId) fields.unitId = 'Required for a module engagement record';
    if (liveSessionId) fields.liveSessionId = 'Not accepted for a module engagement record';
    if (!isIso(windowStart)) fields.windowStart = 'Required — an ISO-8601 instant';
    if (!isIso(windowEnd)) fields.windowEnd = 'Required — an ISO-8601 instant';
    if (isIso(windowStart) && isIso(windowEnd) && Date.parse(windowEnd) <= Date.parse(windowStart)) {
      fields.windowEnd = 'Must be after windowStart';
    }
  } else if (basis === 'live_session') {
    if (!liveSessionId) fields.liveSessionId = 'Required for a live session record';
    if (unitId) fields.unitId = 'Not accepted for a live session record — the module is read from the session';
  }

  if (state === 'partial' && !Number.isInteger(minutesPresent)) {
    // The schema refuses this too; refusing it here makes it a 422 with
    // a field the form can highlight instead of a constraint failure
    // surfacing as a 500 the tutor cannot act on.
    fields.minutesPresent = 'Required for "partial" — a claim about how much needs the amount';
  }
  if (minutesPresent != null && (!Number.isInteger(minutesPresent) || minutesPresent < 0)) {
    fields.minutesPresent = 'Must be a whole number of minutes, zero or more';
  }
  if (Object.keys(fields).length) throw new ValidationError('That engagement record could not be accepted.', fields);

  const learner = await db(env).prepare('SELECT id, role FROM users WHERE id = ?').bind(userId).first();
  if (!learner) throw new NotFoundError('No such learner.');

  let start = windowStart;
  let end = windowEnd;
  if (basis === 'live_session') {
    const session = await db(env)
      .prepare('SELECT id, starts_at, duration_minutes FROM live_sessions WHERE id = ?')
      .bind(liveSessionId).first();
    if (!session) throw new NotFoundError('No such live session.');
    // The window IS the session. Taking it from the request would let a
    // register mark describe a period the session did not run in.
    start = session.starts_at;
    const minutes = Math.max(1, Number(session.duration_minutes) || 60);
    end = new Date(Date.parse(session.starts_at) + minutes * 60000).toISOString();
  } else {
    const unit = await db(env).prepare('SELECT id FROM units WHERE id = ?').bind(unitId).first();
    if (!unit) throw new NotFoundError('No such module.');
  }

  const spanMinutes = Math.round((Date.parse(end) - Date.parse(start)) / 60000);
  if (minutesPresent != null && minutesPresent > spanMinutes) {
    throw new ValidationError('That engagement record could not be accepted.', {
      minutesPresent: `Cannot exceed the ${spanMinutes} minutes the window itself lasts`,
    });
  }

  const existing = await (basis === 'live_session'
    ? db(env).prepare('SELECT * FROM attendance_records WHERE user_id = ? AND live_session_id = ?').bind(userId, liveSessionId).first()
    : db(env).prepare('SELECT * FROM attendance_records WHERE user_id = ? AND unit_id = ? AND window_start = ?').bind(userId, unitId, start).first());

  /* Always 'staff_register', including for a live session a host says
   * they saw somebody at. The evidence for a row a person wrote IS that
   * person's statement, and 'live_session_join' is held back for the day
   * something actually observes a join — which the instrument records as
   * not yet existing (engage.counts.live_session, instrumented: false).
   * Writing that kind on a host's word would put the platform's name to
   * an observation only the host made. */
  const evidenceKind = 'staff_register';

  if (existing) {
    await db(env)
      .prepare(`UPDATE attendance_records
                   SET state = ?, minutes_present = ?, evidence_kind = ?, evidence_ref = NULL,
                       recorded_by = ?, recorded_via = 'staff_register', reason = ?,
                       window_start = ?, window_end = ?
                 WHERE id = ?`)
      .bind(state, minutesPresent, evidenceKind, actor.id, trimmedReason, start, end, existing.id)
      .run();
  } else {
    await db(env)
      .prepare(`INSERT INTO attendance_records
          (id, user_id, basis, live_session_id, unit_id, window_start, window_end, state,
           minutes_present, evidence_kind, evidence_ref, recorded_by, recorded_via, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'staff_register', ?, ?)`)
      .bind(newId('att'), userId, basis, liveSessionId, unitId, start, end, state,
        minutesPresent, evidenceKind, actor.id, trimmedReason, nowIso())
      .run();
  }

  const row = await db(env)
    .prepare('SELECT * FROM attendance_records WHERE id = ?')
    .bind(existing ? existing.id : await lastIdFor(env, { userId, basis, unitId, liveSessionId, start }))
    .first();

  return {
    record: toRecordResponse(row),
    superseded: existing ? { state: existing.state, recordedVia: existing.recorded_via, reason: existing.reason } : null,
    // What the platform itself reads, now, from the evidence it still
    // holds. Returned on every override so the correction and the
    // reading it corrected are visible together.
    derived: basis === 'module_engagement'
      ? await derivedForWindow(env, { userId, unitId, windowStart: start, windowEnd: end })
      : { state: null, note: 'Live-session participation is not derived — nothing observes who joins a session.' },
    now: new Date(now).toISOString(),
  };
}

async function lastIdFor(env, { userId, basis, unitId, liveSessionId, start }) {
  const row = await (basis === 'live_session'
    ? db(env).prepare('SELECT id FROM attendance_records WHERE user_id = ? AND live_session_id = ?').bind(userId, liveSessionId).first()
    : db(env).prepare('SELECT id FROM attendance_records WHERE user_id = ? AND unit_id = ? AND window_start = ?').bind(userId, unitId, start).first());
  return row ? row.id : null;
}

/** The platform's own reading of one module in one window, ignoring any stored row. */
export async function derivedForWindow(env, { userId, unitId, windowStart, windowEnd }) {
  const unit = await db(env)
    .prepare(`SELECT c.level_id AS levelId FROM units u JOIN courses c ON c.id = u.course_id WHERE u.id = ?`)
    .bind(unitId).first();
  if (!unit) return { state: null, evidence: [] };
  const evidence = await loadEvidence(env, { userId, levelId: unit.levelId });
  const found = evidenceFor(evidence, unitId, { start: windowStart, end: windowEnd });
  const { state, minutesPresent } = deriveState(found);
  return { state, minutesPresent, evidence: found };
}

function toRecordResponse(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    basis: row.basis,
    unitId: row.unit_id,
    liveSessionId: row.live_session_id,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    state: row.state,
    meaning: STATE_MEANING[row.state],
    minutesPresent: row.minutes_present,
    evidenceKind: row.evidence_kind,
    evidenceRef: row.evidence_ref,
    recordedBy: row.recorded_by,
    recordedVia: row.recorded_via,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

/* ───────────────────────────────────────────────────────────────
 * SHARED INPUT PARSING
 * ─────────────────────────────────────────────────────────────── */

/** Windows requested. Rejected rather than clamped: a caller asking for 500 weeks has misunderstood something. */
export const MAX_WEEKS = 26;

export function parseWeeks(raw, fallback = 8) {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(String(raw))) {
    throw new ValidationError('weeks must be a whole number.', { weeks: 'A whole number of seven-day windows' });
  }
  const n = Number(raw);
  if (n < 1 || n > MAX_WEEKS) {
    throw new ValidationError(`weeks must be between 1 and ${MAX_WEEKS}.`, { weeks: `Between 1 and ${MAX_WEEKS}` });
  }
  return n;
}

export function parseLevelId(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (!/^\d+$/.test(String(raw))) {
    throw new ValidationError('levelId must be a whole number.', { levelId: 'A programme level id, 1 to 6' });
  }
  return Number(raw);
}
