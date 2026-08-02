// LMS content/assessment logic — pure query/business logic, no HTTP
// concerns, same split as functions/_lib/student/dashboard.js and
// functions/_lib/reports/*. Every function here is directly
// fixture-testable against the real SQLite engine (see
// tests/lms-content.test.mjs) without a Clerk token.
//
// Access rule, applied consistently: a student can see/submit against
// a unit only if they hold an 'active' or 'completed' enrolment for
// that unit's level — never for a level they haven't reached, even a
// later one they'll unlock automatically once they finish the one
// they're on (see functions/_lib/student/progression.js). Staff
// bypass this (see gradeAssignment, and the read endpoints' own
// staff-view path) since they legitimately need to see any student's
// work to grade it.

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { AuthorizationError } from '../auth/session.js';
import { getConfigJson } from '../config.js';

async function assertLevelAccess(env, userId, levelId) {
  const enrolment = await db(env)
    .prepare(`SELECT id FROM enrolments WHERE user_id = ? AND level_id = ? AND status IN ('active','completed')`)
    .bind(userId, levelId)
    .first();
  if (!enrolment) throw new AuthorizationError('You are not enrolled in this programme level.');
}

async function getLevelIdForUnit(env, unitId) {
  const row = await db(env)
    .prepare(`SELECT c.level_id as levelId FROM units u JOIN courses c ON c.id = u.course_id WHERE u.id = ?`)
    .bind(unitId)
    .first();
  return row ? row.levelId : null;
}

export async function listUnits(env, { userId, levelId }) {
  await assertLevelAccess(env, userId, levelId);
  const { results } = await db(env)
    .prepare(`SELECT u.id, u.sequence, u.title,
        COALESCE(p.status, 'not_started') as progressStatus, p.completed_at as completedAt
      FROM units u
      JOIN courses c ON c.id = u.course_id
      LEFT JOIN unit_progress p ON p.unit_id = u.id AND p.user_id = ?
      WHERE c.level_id = ?
      ORDER BY u.sequence ASC`)
    .bind(userId, levelId)
    .all();
  return results;
}

export async function getUnitDetail(env, { userId, unitId }) {
  const unit = await db(env).prepare('SELECT * FROM units WHERE id = ?').bind(unitId).first();
  if (!unit) throw new NotFoundError('Unknown unit.');
  const levelId = await getLevelIdForUnit(env, unitId);
  await assertLevelAccess(env, userId, levelId);

  const { results: items } = await db(env)
    .prepare('SELECT id, sequence, kind, title, body, audio_asset_id as audioAssetId FROM learning_items WHERE unit_id = ? ORDER BY sequence ASC')
    .bind(unitId)
    .all();

  for (const item of items) {
    // Any item may carry audio — a listening item, a pronunciation item,
    // or a quiz that tests a recording. Attaching it here rather than in
    // a kind-specific branch is what let listening assessment reuse the
    // existing quiz path untouched.
    if (item.audioAssetId) {
      item.audio = await getAudioAsset(env, { audioAssetId: item.audioAssetId });
    }
    delete item.audioAssetId;

    if (item.kind === 'quiz' || item.kind === 'listening') {
      // Never send correct_index to the client — see submitQuizAttempt
      // for where grading actually happens, server-side only.
      const { results: questions } = await db(env)
        .prepare('SELECT id, sequence, prompt, choices_json as choicesJson, audio_cue_id as audioCueId FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence ASC')
        .bind(item.id)
        .all();
      item.questions = questions.map(({ choicesJson, ...q }) => ({ ...q, choices: JSON.parse(choicesJson) }));
    }

    if (item.kind === 'pronunciation') {
      const { results: targets } = await db(env)
        .prepare('SELECT id, sequence, focus, target, example, guidance FROM pronunciation_targets WHERE learning_item_id = ? ORDER BY sequence ASC')
        .bind(item.id)
        .all();
      item.targets = targets;
    }
    // Both audio item kinds accept learner voice — shadowing on a
    // listening item, drilling on a pronunciation one.
    if (item.kind === 'pronunciation' || item.kind === 'listening') {
      item.myRecordings = await listMyRecordings(env, { userId, learningItemId: item.id });
    }

    if (item.kind === 'assignment') {
      item.mySubmission = await db(env)
        .prepare('SELECT id, status, grade, feedback, submitted_at as submittedAt, graded_at as gradedAt FROM assignment_submissions WHERE learning_item_id = ? AND user_id = ? ORDER BY submitted_at DESC LIMIT 1')
        .bind(item.id, userId)
        .first();
    }
  }

  const progress = await db(env).prepare('SELECT status, completed_at as completedAt FROM unit_progress WHERE unit_id = ? AND user_id = ?').bind(unitId, userId).first();
  return {
    id: unit.id,
    title: unit.title,
    sequence: unit.sequence,
    progressStatus: progress ? progress.status : 'not_started',
    completedAt: progress ? progress.completedAt : null,
    items,
  };
}

// Never downgrades a unit already marked 'completed' — a lower-scoring
// quiz retake or a re-submitted assignment doesn't erase a prior pass.
async function upsertUnitProgress(env, { userId, unitId, status, completedAt = null }) {
  const existing = await db(env).prepare('SELECT * FROM unit_progress WHERE user_id = ? AND unit_id = ?').bind(userId, unitId).first();
  if (existing) {
    if (existing.status === 'completed') return; // idempotent, never regresses
    await db(env).prepare('UPDATE unit_progress SET status = ?, completed_at = ? WHERE id = ?').bind(status, completedAt, existing.id).run();
    return;
  }
  await db(env)
    .prepare('INSERT INTO unit_progress (id, user_id, unit_id, status, completed_at) VALUES (?, ?, ?, ?, ?)')
    .bind(newId('uprg'), userId, unitId, status, completedAt)
    .run();
}

export async function submitQuizAttempt(env, { userId, learningItemId, answers }) {
  const item = await db(env).prepare('SELECT * FROM learning_items WHERE id = ?').bind(learningItemId).first();
  // A listening item carries its own comprehension questions, so it is
  // gradeable through this same path. That is the whole point of the
  // audio layer reusing quiz_questions rather than inventing a parallel
  // assessment mechanism: listening became assessable without a second
  // scoring implementation to keep in step with this one.
  if (!item || (item.kind !== 'quiz' && item.kind !== 'listening')) throw new NotFoundError('Unknown quiz.');
  const levelId = await getLevelIdForUnit(env, item.unit_id);
  await assertLevelAccess(env, userId, levelId);

  const { results: questions } = await db(env)
    .prepare('SELECT id, correct_index as correctIndex FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence ASC')
    .bind(learningItemId)
    .all();
  if (questions.length === 0) throw new ValidationError('This quiz has no questions yet.', {});
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new ValidationError(`Expected ${questions.length} answers.`, { answers: 'Length mismatch' });
  }

  const correctCount = questions.reduce((n, q, i) => n + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const score = correctCount / questions.length;
  const submittedAt = nowIso();
  const attemptId = newId('qat');
  await db(env)
    .prepare('INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(attemptId, learningItemId, userId, JSON.stringify(answers), score, submittedAt)
    .run();

  const passThreshold = await getConfigJson(env, 'lms_pass_threshold', { required: false }) ?? 0.7;
  if (score >= passThreshold) {
    await upsertUnitProgress(env, { userId, unitId: item.unit_id, status: 'completed', completedAt: submittedAt });
  } else {
    await upsertUnitProgress(env, { userId, unitId: item.unit_id, status: 'in_progress' });
  }

  return { id: attemptId, score, correctCount, totalQuestions: questions.length, passed: score >= passThreshold, submittedAt };
}

export async function submitAssignment(env, { userId, learningItemId, content }) {
  const item = await db(env).prepare('SELECT * FROM learning_items WHERE id = ?').bind(learningItemId).first();
  if (!item || item.kind !== 'assignment') throw new NotFoundError('Unknown assignment.');
  if (!content || !String(content).trim()) throw new ValidationError('content is required.', { content: 'Required' });
  const levelId = await getLevelIdForUnit(env, item.unit_id);
  await assertLevelAccess(env, userId, levelId);

  const submissionId = newId('asub');
  const submittedAt = nowIso();
  await db(env)
    .prepare('INSERT INTO assignment_submissions (id, learning_item_id, user_id, content, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(submissionId, learningItemId, userId, content, 'submitted', submittedAt)
    .run();

  await upsertUnitProgress(env, { userId, unitId: item.unit_id, status: 'in_progress' });
  return { id: submissionId, status: 'submitted', submittedAt };
}

// Staff-only — see functions/api/lms/grade-assignment.js.
export async function gradeAssignment(env, { gradedBy, submissionId, grade, feedback }) {
  if (typeof grade !== 'number' || grade < 0 || grade > 1) {
    throw new ValidationError('grade must be a number between 0 and 1.', { grade: 'Invalid' });
  }
  const submission = await db(env).prepare('SELECT * FROM assignment_submissions WHERE id = ?').bind(submissionId).first();
  if (!submission) throw new NotFoundError('Unknown submission.');

  const gradedAt = nowIso();
  await db(env)
    .prepare('UPDATE assignment_submissions SET status = ?, grade = ?, feedback = ?, graded_at = ?, graded_by = ? WHERE id = ?')
    .bind('graded', grade, feedback || null, gradedAt, gradedBy, submissionId)
    .run();

  const item = await db(env).prepare('SELECT unit_id FROM learning_items WHERE id = ?').bind(submission.learning_item_id).first();
  const passThreshold = await getConfigJson(env, 'lms_pass_threshold', { required: false }) ?? 0.7;
  if (item && grade >= passThreshold) {
    await upsertUnitProgress(env, { userId: submission.user_id, unitId: item.unit_id, status: 'completed', completedAt: gradedAt });
  }

  return { id: submissionId, status: 'graded', grade, feedback: feedback || null, gradedAt };
}

// ---------------------------------------------------------------------
// Audio: listening, pronunciation, learner voice, instructor voice.
//
// Built because the authored curriculum requires it — every one of the
// 114 lesson items specifies a listening activity and a pronunciation
// practice, and until this existed there was nowhere to put either.
// ---------------------------------------------------------------------

// Returns the asset plus its ordered cues. `isRecorded` is computed
// rather than stored: the client needs to know whether to render a
// player or a transcript-only view, and deriving it from media_url
// means there is exactly one source of truth for "does this audio
// actually exist yet".
export async function getAudioAsset(env, { audioAssetId }) {
  const asset = await db(env)
    .prepare('SELECT id, kind, title, transcript, media_url as mediaUrl, duration_ms as durationMs, variety, speaker_count as speakerCount, target_wpm as targetWpm FROM audio_assets WHERE id = ?')
    .bind(audioAssetId)
    .first();
  if (!asset) throw new NotFoundError('Unknown audio asset.');
  const { results: cues } = await db(env)
    .prepare('SELECT id, sequence, speaker, text, start_ms as startMs, end_ms as endMs FROM audio_cues WHERE audio_asset_id = ? ORDER BY sequence ASC')
    .bind(audioAssetId)
    .all();
  return {
    ...asset,
    isRecorded: Boolean(asset.mediaUrl),
    // True once the recording has been timed against the script. Until
    // then the transcript is readable but cannot be followed along with,
    // so the client shows it as a plain script rather than a broken
    // karaoke view.
    isSynchronised: cues.length > 0 && cues.every((c) => c.startMs !== null && c.endMs !== null),
    cues,
  };
}

async function listMyRecordings(env, { userId, learningItemId }) {
  const { results } = await db(env)
    .prepare('SELECT id, media_url as mediaUrl, duration_ms as durationMs, attempt, status, submitted_at as submittedAt FROM learner_recordings WHERE learning_item_id = ? AND user_id = ? ORDER BY attempt DESC')
    .bind(learningItemId, userId)
    .all();
  for (const rec of results) {
    const { results: fb } = await db(env)
      .prepare('SELECT id, source, comment, intelligibility, word_stress as wordStress, sentence_stress as sentenceStress, individual_sounds as individualSounds, fluency, audio_asset_id as audioAssetId, created_at as createdAt FROM pronunciation_feedback WHERE recording_id = ? ORDER BY created_at ASC')
      .bind(rec.id)
      .all();
    rec.feedback = fb;
  }
  return results;
}

// A learner submits a voice recording against a listening or
// pronunciation item. Attempt numbers increment rather than overwrite:
// hearing your first attempt next to your fifth is the single most
// motivating thing a pronunciation tool can show, and discarding
// earlier takes would throw that away.
export async function submitLearnerRecording(env, { userId, learningItemId, mediaUrl, durationMs = null }) {
  const item = await db(env).prepare('SELECT * FROM learning_items WHERE id = ?').bind(learningItemId).first();
  if (!item) throw new NotFoundError('Unknown learning item.');
  if (item.kind !== 'pronunciation' && item.kind !== 'listening') {
    throw new ValidationError('Recordings can only be submitted against a listening or pronunciation item.');
  }
  if (!mediaUrl) throw new ValidationError('A recording URL is required.');
  const levelId = await getLevelIdForUnit(env, item.unit_id);
  await assertLevelAccess(env, userId, levelId);

  const prior = await db(env)
    .prepare('SELECT MAX(attempt) as maxAttempt FROM learner_recordings WHERE learning_item_id = ? AND user_id = ?')
    .bind(learningItemId, userId)
    .first();
  const attempt = (prior && prior.maxAttempt ? prior.maxAttempt : 0) + 1;

  const id = newId('rec');
  await db(env)
    .prepare('INSERT INTO learner_recordings (id, learning_item_id, user_id, media_url, duration_ms, attempt, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, learningItemId, userId, mediaUrl, durationMs, attempt, 'submitted', nowIso())
    .run();

  // Speaking practice counts as engagement with the unit, but never as
  // completion — a recording is only complete once it has been assessed.
  await upsertUnitProgress(env, { userId, unitId: item.unit_id, status: 'in_progress' });
  return { id, attempt, status: 'submitted' };
}

// Feedback on a recording. `source` distinguishes an instructor from an
// automated scorer; both write here, so an automated score can be shown
// beside a human one and compared, never silently substituted for it.
export async function reviewRecording(env, { recordingId, source = 'instructor', reviewerId = null, comment = null, scores = {}, audioAssetId = null }) {
  const rec = await db(env).prepare('SELECT * FROM learner_recordings WHERE id = ?').bind(recordingId).first();
  if (!rec) throw new NotFoundError('Unknown recording.');
  if (source !== 'instructor' && source !== 'automated') throw new ValidationError('Feedback source must be instructor or automated.');
  if (source === 'instructor' && !reviewerId) throw new ValidationError('Instructor feedback requires a reviewer.');

  const FIELDS = ['intelligibility', 'wordStress', 'sentenceStress', 'individualSounds', 'fluency'];
  for (const f of FIELDS) {
    const v = scores[f];
    if (v !== undefined && v !== null && (typeof v !== 'number' || v < 0 || v > 1)) {
      throw new ValidationError(`Pronunciation score "${f}" must be between 0 and 1.`);
    }
  }

  const id = newId('pfb');
  await db(env)
    .prepare('INSERT INTO pronunciation_feedback (id, recording_id, source, reviewer_id, audio_asset_id, comment, intelligibility, word_stress, sentence_stress, individual_sounds, fluency, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, recordingId, source, reviewerId, audioAssetId, comment,
      scores.intelligibility ?? null, scores.wordStress ?? null, scores.sentenceStress ?? null,
      scores.individualSounds ?? null, scores.fluency ?? null, nowIso())
    .run();
  await db(env).prepare('UPDATE learner_recordings SET status = ? WHERE id = ?').bind('reviewed', recordingId).run();
  return { id, recordingId, source, status: 'reviewed' };
}

// Per-focus pronunciation profile for one learner: the average of every
// assessed sub-score across all their reviewed recordings at a level.
// Reported per DIMENSION rather than per module because that is what a
// learner can act on — "your word stress trails your individual sounds"
// tells them what to practise; a module average does not.
export async function getPronunciationProfile(env, { userId, levelId = null }) {
  let sql = `SELECT f.intelligibility, f.word_stress AS wordStress, f.sentence_stress AS sentenceStress,
                    f.individual_sounds AS individualSounds, f.fluency
             FROM pronunciation_feedback f
             JOIN learner_recordings r ON r.id = f.recording_id
             JOIN learning_items i ON i.id = r.learning_item_id
             JOIN units u ON u.id = i.unit_id
             JOIN courses c ON c.id = u.course_id
             WHERE r.user_id = ?`;
  const binds = [userId];
  if (levelId !== null) { sql += ' AND c.level_id = ?'; binds.push(levelId); }
  const { results } = await db(env).prepare(sql).bind(...binds).all();

  const DIMENSIONS = ['intelligibility', 'wordStress', 'sentenceStress', 'individualSounds', 'fluency'];
  const profile = {};
  for (const d of DIMENSIONS) {
    const vals = results.map((r) => r[d]).filter((v) => v !== null && v !== undefined);
    // null, not 0 — "not yet assessed" and "assessed as zero" are
    // different facts and a dashboard must not conflate them.
    profile[d] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }
  const assessed = DIMENSIONS.filter((d) => profile[d] !== null);
  return {
    userId,
    levelId,
    reviewedRecordings: results.length,
    ...profile,
    // The weakest assessed dimension — what to practise next.
    weakest: assessed.length ? assessed.reduce((a, b) => (profile[a] <= profile[b] ? a : b)) : null,
  };
}

// Staff review queue. Ordered oldest-first deliberately: a review queue
// sorted newest-first quietly starves the learners who have waited
// longest, which is the failure mode of every unmoderated feedback
// backlog.
export async function listRecordingsForReview(env, { levelId = null, status = 'submitted', limit = 50 } = {}) {
  let sql = `SELECT r.id, r.media_url AS mediaUrl, r.duration_ms AS durationMs, r.attempt,
                    r.status, r.submitted_at AS submittedAt,
                    u.id AS userId, u.email,
                    i.id AS learningItemId, i.kind, i.title AS itemTitle,
                    un.title AS unitTitle, c.level_id AS levelId
             FROM learner_recordings r
             JOIN users u ON u.id = r.user_id
             JOIN learning_items i ON i.id = r.learning_item_id
             JOIN units un ON un.id = i.unit_id
             JOIN courses c ON c.id = un.course_id
             WHERE 1 = 1`;
  const binds = [];
  if (status) { sql += ' AND r.status = ?'; binds.push(status); }
  if (levelId !== null) { sql += ' AND c.level_id = ?'; binds.push(levelId); }
  sql += ' ORDER BY r.submitted_at ASC LIMIT ?';
  binds.push(limit);
  const { results } = await db(env).prepare(sql).bind(...binds).all();

  for (const rec of results) {
    // The drill targets the learner was working against. A reviewer
    // scoring pronunciation without seeing the target is guessing.
    const { results: targets } = await db(env)
      .prepare('SELECT focus, target, example FROM pronunciation_targets WHERE learning_item_id = ? ORDER BY sequence ASC')
      .bind(rec.learningItemId).all();
    rec.targets = targets;
    const prior = await db(env)
      .prepare('SELECT COUNT(*) AS c FROM learner_recordings WHERE learning_item_id = ? AND user_id = ? AND attempt < ?')
      .bind(rec.learningItemId, rec.userId, rec.attempt).first();
    rec.priorAttempts = prior ? prior.c : 0;
  }
  return results;
}

// Listening analytics for one learner. Deliberately reports coverage
// and outcomes separately: "attempted 8 of 10" and "averaged 72%" answer
// different questions, and a single blended number would hide a learner
// who scores well on the few they attempt.
export async function getListeningAnalytics(env, { userId, levelId }) {
  const items = await db(env).prepare(
    `SELECT i.id, i.title, un.sequence AS moduleSeq
     FROM learning_items i JOIN units un ON un.id = i.unit_id JOIN courses c ON c.id = un.course_id
     WHERE i.kind = 'listening' AND c.level_id = ? ORDER BY un.sequence ASC`
  ).bind(levelId).all();

  const modules = [];
  for (const item of items.results) {
    const best = await db(env).prepare(
      'SELECT MAX(score) AS best, COUNT(*) AS attempts FROM quiz_attempts WHERE learning_item_id = ? AND user_id = ?'
    ).bind(item.id, userId).first();
    const recs = await db(env).prepare(
      'SELECT COUNT(*) AS c FROM learner_recordings WHERE learning_item_id = ? AND user_id = ?'
    ).bind(item.id, userId).first();
    modules.push({
      learningItemId: item.id,
      title: item.title,
      moduleSeq: item.moduleSeq,
      attempts: best ? best.attempts : 0,
      bestScore: best && best.attempts ? best.best : null,
      recordings: recs ? recs.c : 0,
    });
  }
  const attempted = modules.filter((m) => m.attempts > 0);
  const scored = attempted.map((m) => m.bestScore);
  return {
    levelId,
    totalListenings: modules.length,
    attempted: attempted.length,
    // null rather than 0 when nothing has been attempted — an untouched
    // level and a failed level are different facts.
    averageBest: scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null,
    recordingsMade: modules.reduce((a, m) => a + m.recordings, 0),
    modules,
  };
}

export async function listLiveSessions(env, { userId, levelId }) {
  await assertLevelAccess(env, userId, levelId);
  const { results } = await db(env)
    .prepare('SELECT id, title, starts_at as startsAt, duration_minutes as durationMinutes, join_url as joinUrl, unit_id as unitId FROM live_sessions WHERE level_id = ? ORDER BY starts_at ASC')
    .bind(levelId)
    .all();
  return results;
}
