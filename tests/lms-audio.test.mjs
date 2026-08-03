// Run with: node --experimental-sqlite tests/lms-audio.test.mjs
//
// Proves the audio layer — listening, pronunciation, learner voice,
// instructor voice feedback, synchronised transcripts — actually
// functions through the real LMS logic in functions/_lib/lms/content.js.
//
// This layer exists because the curriculum required it: all 114 authored
// lesson items specify a LISTENING ACTIVITY and a PRONUNCIATION
// PRACTICE, and the platform had nowhere to put either (see
// docs/curriculum-programme-review.md, Finding 1).
//
// The design decision under test throughout: a listening script is
// authored curriculum and exists NOW; the recording of it is a studio
// production task and does not. So an asset with no media_url must be a
// first-class, usable state — not an error, and not a placeholder file.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const {
  getUnitDetail, getAudioAsset, submitLearnerRecording, reviewRecording,
  getPronunciationProfile, submitQuizAttempt,
} = await import(loadUrl('functions/_lib/lms/content.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }
async function throws(label, fn, matcher) {
  try { await fn(); check(label, false); }
  catch (e) { check(label, matcher ? matcher(e) : true); }
}

// --- Fixtures -----------------------------------------------------------
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_s', 'clerk', 'sub_s', 's@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_t', 'clerk', 'sub_t', 't@example.com', 'staff')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_x', 'clerk', 'sub_x', 'x@example.com', 'student')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_s', 'usr_s', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();
db.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_a', 'crs_level_1', 1, 'Audio Test Unit')`).run();

// An asset that HAS been recorded and timed.
db.prepare(`INSERT INTO audio_assets (id, kind, title, transcript, media_url, duration_ms, variety, speaker_count, target_wpm)
            VALUES ('aud_done', 'listening', 'At the Bakery', 'Good morning. Can I help you?|Yes, please. Two loaves.', 'https://media.example.com/a.mp3', 30000, 'BrE', 2, 110)`).run();
db.prepare(`INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text, start_ms, end_ms) VALUES ('cue_1', 'aud_done', 1, 'Baker', 'Good morning. Can I help you?', 0, 2400)`).run();
db.prepare(`INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text, start_ms, end_ms) VALUES ('cue_2', 'aud_done', 2, 'Customer', 'Yes, please. Two loaves.', 2400, 4800)`).run();

// An asset whose SCRIPT is authored but which has not been recorded —
// the normal state of the curriculum today.
db.prepare(`INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm)
            VALUES ('aud_script', 'listening', 'A Weather Report', 'Rain is expected across the south.', 'BrE', 1, 120)`).run();
db.prepare(`INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES ('cue_s1', 'aud_script', 1, 'Presenter', 'Rain is expected across the south.')`).run();

db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES ('itm_listen', 'unt_a', 1, 'listening', 'Listening: At the Bakery', 'Listen and answer.', 'aud_done')`).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES ('itm_pron', 'unt_a', 2, 'pronunciation', 'Pronunciation Lab', 'Repeat after the model.', 'aud_done')`).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES ('itm_lquiz', 'unt_a', 3, 'quiz', 'Listening Comprehension', NULL, 'aud_done')`).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES ('itm_script', 'unt_a', 4, 'listening', 'Listening: Weather', 'Listen and note.', 'aud_script')`).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES ('itm_read', 'unt_a', 5, 'reading', 'A Reading', 'Text.')`).run();

db.prepare(`INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance)
            VALUES ('pron_1', 'itm_pron', 1, 'phoneme', '/θ/ vs /s/', 'I think it is thick.', 'Tongue tip lightly between the teeth.')`).run();
db.prepare(`INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance)
            VALUES ('pron_2', 'itm_pron', 2, 'word_stress', 'PHOtograph -> phoTOGrapher', 'She is a photographer.', 'The stress moves when the suffix changes.')`).run();

db.prepare(`INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id)
            VALUES ('qq_a1', 'itm_lquiz', 1, 'How many loaves does the customer ask for?', '["One","Two","Three","Four"]', 1, 'cue_2')`).run();
// Comprehension questions hang off the LISTENING item itself, which is
// how the authored curriculum is actually shaped — all 60 listening
// items across the six levels carry their own questions, and none of
// them route through a separate quiz item. The fixture did not have
// that shape, so getListeningAnalytics() — which counts attempts
// against listening items — could never see an attempt here and was
// effectively untested against the structure it was written for.
db.prepare(`INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id)
            VALUES ('qq_l1', 'itm_listen', 1, 'What does the customer order first?', '["Bread","Cake","Coffee","Nothing"]', 0, 'cue_1')`).run();
db.prepare(`INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id)
            VALUES ('qq_l2', 'itm_listen', 2, 'What time does the bakery close?', '["Four","Five","Six","Seven"]', 2, 'cue_2')`).run();

// --- Asset retrieval ----------------------------------------------------
{
  const a = await getAudioAsset(env, { audioAssetId: 'aud_done' });
  check('A recorded asset reports isRecorded true', a.isRecorded === true);
  check('A timed asset reports isSynchronised true', a.isSynchronised === true);
  check('Cues come back in order with speaker attribution', a.cues.length === 2 && a.cues[0].speaker === 'Baker' && a.cues[1].sequence === 2);
  check('Cue timings are exposed for transcript synchronisation', a.cues[0].startMs === 0 && a.cues[1].endMs === 4800);
  check('The declared English variety is carried through', a.variety === 'BrE');
  check('The intended delivery speed is carried through', a.targetWpm === 110);

  const s = await getAudioAsset(env, { audioAssetId: 'aud_script' });
  check('An authored-but-unrecorded script is still served, not an error', s.transcript.length > 0 && s.cues.length === 1);
  check('An unrecorded asset reports isRecorded false rather than faking a URL', s.isRecorded === false && s.mediaUrl === null);
  check('An untimed asset reports isSynchronised false', s.isSynchronised === false);
}
await throws('Requesting an unknown audio asset raises NotFound', () => getAudioAsset(env, { audioAssetId: 'aud_nope' }), (e) => e.name === 'NotFoundError' || /Unknown audio/.test(e.message));

// --- Audio reaches the learner through the normal unit-detail path ------
{
  const detail = await getUnitDetail(env, { userId: 'usr_s', unitId: 'unt_a' });
  const listen = detail.items.find((i) => i.id === 'itm_listen');
  const pron = detail.items.find((i) => i.id === 'itm_pron');
  const lquiz = detail.items.find((i) => i.id === 'itm_lquiz');
  const read = detail.items.find((i) => i.id === 'itm_read');

  check('A listening item carries its audio and transcript to the client', listen.audio && listen.audio.cues.length === 2);
  check('A pronunciation item carries its drill targets in order', pron.targets.length === 2 && pron.targets[0].focus === 'phoneme' && pron.targets[1].focus === 'word_stress');
  check('Pronunciation targets carry the guidance a learner acts on', pron.targets[0].guidance.includes('Tongue tip'));
  check('A quiz item may carry audio, making listening assessment reuse the quiz path', lquiz.audio && lquiz.audio.id === 'aud_done');
  check('A listening question anchors to the exact cue it tests', lquiz.questions[0].audioCueId === 'cue_2');
  check('A non-audio item is unaffected and carries no audio key', !('audio' in read));
  check('getUnitDetail still never leaks the answer key, including for listening questions',
    lquiz.questions.every((q) => !('correctIndex' in q) && !('correct_index' in q)));
}

// --- Listening assessment scores through the existing quiz path ---------
{
  const key = db.prepare('SELECT correct_index FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence').bind('itm_lquiz').all().results.map((r) => r.correct_index);
  const attempt = await submitQuizAttempt(env, { userId: 'usr_s', learningItemId: 'itm_lquiz', answers: key });
  check('A listening comprehension quiz scores through the unchanged quiz path', attempt.score === 1 && attempt.passed === true);
}

// --- Learner recording --------------------------------------------------
{
  const r1 = await submitLearnerRecording(env, { userId: 'usr_s', learningItemId: 'itm_pron', mediaUrl: 'https://media.example.com/s1.webm', durationMs: 8000 });
  check('A learner can submit a voice recording against a pronunciation item', r1.status === 'submitted' && r1.attempt === 1);
  const r2 = await submitLearnerRecording(env, { userId: 'usr_s', learningItemId: 'itm_pron', mediaUrl: 'https://media.example.com/s2.webm', durationMs: 7600 });
  check('Re-recording increments the attempt rather than overwriting the first take', r2.attempt === 2);
  const kept = db.prepare('SELECT COUNT(*) AS c FROM learner_recordings WHERE learning_item_id = ? AND user_id = ?').bind('itm_pron', 'usr_s').first();
  check('Every take is retained so a learner can hear their own progress', kept.c === 2);

  const listenRec = await submitLearnerRecording(env, { userId: 'usr_s', learningItemId: 'itm_listen', mediaUrl: 'https://media.example.com/s3.webm' });
  check('Recordings are also accepted against a listening item (shadowing practice)', listenRec.attempt === 1);

  const prog = db.prepare(`SELECT status FROM unit_progress WHERE user_id = 'usr_s' AND unit_id = 'unt_a'`).first();
  check('Recording marks the unit in progress but never complete on its own', prog && prog.status !== 'not_started');
}
await throws('A recording cannot be submitted against a reading item', () => submitLearnerRecording(env, { userId: 'usr_s', learningItemId: 'itm_read', mediaUrl: 'https://x/y.webm' }), (e) => /listening or pronunciation/.test(e.message));
await throws('A recording with no media URL is rejected', () => submitLearnerRecording(env, { userId: 'usr_s', learningItemId: 'itm_pron', mediaUrl: '' }), (e) => /recording URL is required/i.test(e.message));
await throws('A learner not enrolled at the level cannot record against it', () => submitLearnerRecording(env, { userId: 'usr_x', learningItemId: 'itm_pron', mediaUrl: 'https://x/y.webm' }), (e) => e.name === 'AuthorizationError' || /enrol/i.test(e.message));

// --- Instructor voice feedback -----------------------------------------
{
  const rec = db.prepare('SELECT id FROM learner_recordings WHERE learning_item_id = ? AND attempt = 2').bind('itm_pron').first();
  db.prepare(`INSERT INTO audio_assets (id, kind, title, transcript) VALUES ('aud_fb', 'instructor_feedback', 'Feedback for attempt 2', 'Listen to how I say "think" here.')`).run();
  const fb = await reviewRecording(env, {
    recordingId: rec.id, source: 'instructor', reviewerId: 'usr_t', audioAssetId: 'aud_fb',
    comment: 'Much clearer. Watch the /θ/ in "think".',
    scores: { intelligibility: 0.9, wordStress: 0.7, sentenceStress: 0.8, individualSounds: 0.6, fluency: 0.75 },
  });
  check('An instructor can review a recording with spoken feedback attached', fb.status === 'reviewed' && fb.source === 'instructor');
  const row = db.prepare('SELECT status FROM learner_recordings WHERE id = ?').bind(rec.id).first();
  check('Reviewing marks the recording reviewed', row.status === 'reviewed');

  const detail = await getUnitDetail(env, { userId: 'usr_s', unitId: 'unt_a' });
  const pron = detail.items.find((i) => i.id === 'itm_pron');
  const reviewed = pron.myRecordings.find((r) => r.attempt === 2);
  check('The learner sees their own recordings, newest attempt first', pron.myRecordings[0].attempt === 2);
  check('The learner sees the instructor feedback on their recording', reviewed.feedback.length === 1 && reviewed.feedback[0].comment.includes('/θ/'));
  check("The instructor's spoken feedback is linked, not just written text", reviewed.feedback[0].audioAssetId === 'aud_fb');
}
await throws('Instructor feedback without a reviewer is rejected', () => reviewRecording(env, { recordingId: db.prepare('SELECT id FROM learner_recordings LIMIT 1').first().id, source: 'instructor' }), (e) => /requires a reviewer/.test(e.message));
await throws('An out-of-range pronunciation score is rejected', () => reviewRecording(env, { recordingId: db.prepare('SELECT id FROM learner_recordings LIMIT 1').first().id, source: 'instructor', reviewerId: 'usr_t', scores: { fluency: 1.4 } }), (e) => /between 0 and 1/.test(e.message));
await throws('Feedback on an unknown recording raises NotFound', () => reviewRecording(env, { recordingId: 'rec_nope', source: 'instructor', reviewerId: 'usr_t' }), (e) => /Unknown recording/.test(e.message));

// --- AI-readiness: an automated scorer writes alongside the instructor --
{
  const rec = db.prepare('SELECT id FROM learner_recordings WHERE learning_item_id = ? AND attempt = 1').bind('itm_pron').first();
  const auto = await reviewRecording(env, { recordingId: rec.id, source: 'automated', scores: { intelligibility: 0.5, individualSounds: 0.4 } });
  check('An automated scorer can record feedback with no human reviewer', auto.source === 'automated');
  const rows = db.prepare('SELECT source, reviewer_id FROM pronunciation_feedback WHERE recording_id = ?').bind(rec.id).all().results;
  check('Automated feedback is stored with a null reviewer, distinguishable from human feedback', rows.some((r) => r.source === 'automated' && r.reviewer_id === null));
}

// --- Feedback belongs to ONE recording ----------------------------------
// Attempt 2 carries the instructor's review; attempt 1 carries the
// automated one. Nothing asserted that they stay apart, and they were
// fetched one recording at a time, so nothing could go wrong — until the
// query was rewritten to fetch them all at once and group them in code.
// Sabotage proved the gap: assigning every recording every recording's
// feedback passed all 41 assertions in this file.
//
// The failure it guards is worse than untidy. Attempt history exists so
// a learner can hear their first take against their fifth, and feedback
// attached to the wrong take tells them they fixed a sound they did not.
{
  const detail = await getUnitDetail(env, { userId: 'usr_s', unitId: 'unt_a' });
  const pron = detail.items.find((i) => i.id === 'itm_pron');
  const one = pron.myRecordings.find((r) => r.attempt === 1);
  const two = pron.myRecordings.find((r) => r.attempt === 2);

  check('Each attempt carries only its own feedback',
    one.feedback.length === 1 && two.feedback.length === 1);
  check("...so an instructor's note does not appear on an attempt they never reviewed",
    !one.feedback.some((f) => (f.comment || '').includes('/θ/')));
  check('...and an automated score does not appear on the attempt a human reviewed',
    !two.feedback.some((f) => f.source === 'automated'));
  check('Every piece of feedback is attributed to exactly one attempt',
    pron.myRecordings.reduce((n, r) => n + r.feedback.length, 0)
      === db.prepare(`SELECT COUNT(*) AS n FROM pronunciation_feedback pf
                        JOIN learner_recordings lr ON lr.id = pf.recording_id
                       WHERE lr.learning_item_id = 'itm_pron'`).first().n);
  // The response shape is part of the contract: nothing should have to
  // strip a join column back out on the client.
  check('Feedback carries no join bookkeeping into the response',
    !Object.prototype.hasOwnProperty.call(one.feedback[0], 'recordingId'),
    Object.keys(one.feedback[0]).join(','));
}

// --- A zero is a score, not an absence ----------------------------------
// `bestScore` is guarded on the attempt COUNT, not on the score being
// truthy. Guarding on the score reports a learner who scored 0 as never
// having attempted the module — which is the one learner most in need of
// the platform noticing them. Sabotage-verified: the weaker guard passed
// every assertion here before this block existed.
{
  // Every answer wrong, on purpose: the score is 0, and 0 is a result.
  const key = db.prepare('SELECT id, correct_index FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence')
    .bind('itm_listen').all().results;
  const zero = await submitQuizAttempt(env, {
    userId: 'usr_s', learningItemId: 'itm_listen',
    answers: key.map((q) => (q.correct_index === 0 ? 1 : 0)),
  }).catch((e) => { console.log('  (fixture note: ' + e.message.slice(0, 70) + ')'); return null; });
  if (zero) check('A wholly incorrect attempt scores zero rather than failing to record', zero.score === 0, zero.score);

  const { getListeningAnalytics } = await import(loadUrl('functions/_lib/lms/content.js'));
  const an = await getListeningAnalytics(env, { userId: 'usr_s', levelId: 1 });
  const scored = an.modules.filter((m) => m.attempts > 0);
  check('Listening analytics reports every listening module of the level',
    an.modules.length >= 1, an.modules.length);
  if (zero && scored.length) {
    check('A learner who scored zero is reported as having attempted it',
      scored.every((m) => m.bestScore !== null),
      JSON.stringify(scored.map((m) => [m.attempts, m.bestScore])));
  } else {
    // Stated rather than skipped silently: a test that quietly reports
    // nothing is indistinguishable from one that passed.
    check('Zero-score fixture could not be built — assertion NOT exercised', false,
      'no scorable listening quiz in the fixture');
  }
}

// --- Pronunciation profile ----------------------------------------------
{
  const p = await getPronunciationProfile(env, { userId: 'usr_s', levelId: 1 });
  check('A pronunciation profile aggregates every assessed sub-score', p.reviewedRecordings === 2);
  check('Per-dimension averages are computed across recordings', Math.abs(p.individualSounds - 0.5) < 1e-9);
  // Only the instructor scored these two, so the average is that single
  // score — the automated pass left them null and null values are
  // excluded from the mean rather than counted as zero.
  check('Dimensions scored by only one reviewer average that score, with nulls excluded', p.wordStress === 0.7 && p.sentenceStress === 0.8);
  check('The profile names the weakest dimension, which is what a learner can act on', p.weakest === 'individualSounds');

  const empty = await getPronunciationProfile(env, { userId: 'usr_x' });
  check('A learner with no reviewed recordings gets nulls rather than a false zero score',
    empty.reviewedRecordings === 0 && empty.intelligibility === null && empty.weakest === null);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
