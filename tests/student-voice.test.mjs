// A PROMISE OF ANONYMITY MUST BE UNBREAKABLE, NOT MERELY INTENDED.
//
// Governance A7 named the decision student feedback needs — anonymity —
// and observed the trade: anonymous feedback is more honest and harder
// to act on. Migration 025 makes it a property of the survey rather than
// a single institutional policy, and then makes it structural.
//
// That last word is what these assertions are about. A College that
// promises anonymity and stores identity anyway has done something worse
// than not asking, and "we have a policy" is not a defence when the
// column is sitting there populated. So the test that matters most below
// is the one that tries to write a user_id against an anonymous survey
// and requires the database to refuse it.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const refuses = (label, fn) => { let t = false; try { fn(); } catch { t = true; } check(label, t); };
const allows = (label, fn) => {
  try { fn(); check(label, true); } catch (e) { check(label, false, e.message); }
};

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
db.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES
  ('usr_l1','clerk','v1','v1@example.com','student'),
  ('usr_l2','clerk','v2','v2@example.com','student'),
  ('usr_dir','clerk','v3','d@example.com','admin');
INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_v','crs_level_1',902,'Voice fixture');
INSERT INTO feedback_surveys (id, code, title, scope, unit_id, purpose, anonymous, opens_at, closes_at, created_by, created_at)
  VALUES ('svy_anon','L1-M03-EVAL','Module 3 evaluation','module','unt_v',
          'To decide whether Module 3 is retained, rewritten or replaced before the next intake.',
          1,'2026-11-01T00:00:00Z','2026-11-15T00:00:00Z','usr_dir','2026-10-25T00:00:00Z'),
         ('svy_named','L1-FAULT','Report a fault','support',NULL,
          'To fix the thing you report. We cannot fix it without asking you which one it was.',
          0,'2026-11-01T00:00:00Z','2027-11-01T00:00:00Z','usr_dir','2026-10-25T00:00:00Z');
INSERT INTO feedback_questions (id, survey_id, sequence, prompt, kind, scale_min, scale_max, required) VALUES
  ('fq_1','svy_anon',1,'How well did this module prepare you for the assessment?','scale',1,5,1);
INSERT INTO feedback_questions (id, survey_id, sequence, prompt, kind) VALUES
  ('fq_2','svy_anon',2,'What would you change about this module?','text');`);

// --- The anonymity promise --------------------------------------------
allows('An anonymous response is recorded without an identity', () =>
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES ('fr_a1','svy_anon',1,NULL,'2026-11-03T09:00:00Z')`).run());

refuses('An anonymous survey CANNOT store who answered — the row will not insert', () =>
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES ('fr_a2','svy_anon',1,'usr_l1','2026-11-03T09:00:00Z')`).run());

// The stronger version: not merely "don't set the flag wrong", but "you
// cannot lie about which survey this is". The composite foreign key is
// what makes the promise unforgeable rather than a matter of care.
refuses('...and it cannot be de-anonymised by claiming the survey was attributable', () =>
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES ('fr_a3','svy_anon',0,'usr_l1','2026-11-03T09:00:00Z')`).run());

allows('An attributable survey records who answered', () =>
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES ('fr_n1','svy_named',0,'usr_l1','2026-11-04T09:00:00Z')`).run());

refuses('...and refuses an unattributed response to it, which nobody could act on', () =>
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES ('fr_n2','svy_named',0,NULL,'2026-11-04T09:00:00Z')`).run());

refuses('One learner cannot answer an attributable survey twice', () =>
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES ('fr_n3','svy_named',0,'usr_l1','2026-11-05T09:00:00Z')`).run());

// And the corresponding honesty: an anonymous survey CANNOT deduplicate,
// because there is no identity to deduplicate on. Pretending otherwise
// would be the de-anonymisation this file exists to prevent.
allows('An anonymous survey accepts a second response, because it cannot know it is the same person', () =>
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES ('fr_a4','svy_anon',1,NULL,'2026-11-03T10:00:00Z')`).run());

// --- A survey must be answerable and must say what it is for ----------
const svy = (extra) => {
  const cols = { id: 'svy_x', code: 'X', title: 'T', scope: 'programme', purpose: 'P',
    anonymous: 1, opens_at: '2026-11-01T00:00:00Z', closes_at: '2026-11-15T00:00:00Z',
    created_by: 'usr_dir', created_at: '2026-10-01T00:00:00Z', ...extra };
  const k = Object.keys(cols);
  db.prepare(`INSERT INTO feedback_surveys (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`)
    .run(...k.map((x) => cols[x]));
};
refuses('A survey with no stated purpose is refused: that is harvesting opinion',
  () => svy({ code: 'X1', purpose: '   ' }));
refuses('A survey that closes before it opens is refused',
  () => svy({ code: 'X2', closes_at: '2026-10-01T00:00:00Z' }));
refuses('A module survey that does not name a module is refused',
  () => svy({ code: 'X3', scope: 'module' }));
refuses('A level survey that does not name a level is refused',
  () => svy({ code: 'X4', scope: 'level' }));
refuses('An unrecognised scope is refused', () => svy({ code: 'X5', scope: 'vibes' }));
refuses('A survey that is neither anonymous nor attributable is refused',
  () => svy({ code: 'X6', anonymous: 2 }));

// --- A question must be shaped like its kind --------------------------
const q = (extra) => {
  const cols = { id: 'fq_x', survey_id: 'svy_anon', sequence: 90, prompt: 'P', kind: 'text', ...extra };
  const k = Object.keys(cols);
  db.prepare(`INSERT INTO feedback_questions (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`)
    .run(...k.map((x) => cols[x]));
};
refuses('A scale question with no scale is refused', () => q({ kind: 'scale' }));
refuses('A scale whose top is below its bottom is refused',
  () => q({ kind: 'scale', scale_min: 5, scale_max: 1 }));
refuses('A text question carrying a scale is refused', () => q({ scale_min: 1, scale_max: 5 }));
refuses('A choice question with no choices is refused', () => q({ kind: 'choice' }));
refuses('A text question carrying choices is refused', () => q({ choices_json: '["a","b"]' }));
refuses('Two questions cannot share a position in the same survey', () => q({ sequence: 1 }));

// --- An answer must be shaped like the question it answers ------------
// A FRESH RESPONSE PER ATTEMPT. The first version of this block sent
// every attempt to the same (response, question) pair, which the first
// successful answer had already taken — so UNIQUE refused all the rest
// and four assertions passed without touching the rule each of them
// named. A sabotage pass caught it; the anonymous survey accepts as many
// responses as the test needs, precisely because it cannot tell them
// apart.
let r = 0;
const ans = (extra) => {
  r += 1;
  const rid = `fr_ans_${r}`;
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES (?, 'svy_anon', 1, NULL, '2026-11-06T09:00:00Z')`).run(rid);
  const cols = { id: `fa_${r}`, response_id: rid, question_id: 'fq_1',
    question_kind: 'scale', scale_value: 4, ...extra };
  const k = Object.keys(cols);
  db.prepare(`INSERT INTO feedback_answers (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`)
    .run(...k.map((x) => cols[x]));
};
allows('A scale answer to a scale question records', () => ans({}));
allows('...and a text answer to a text question', () =>
  ans({ question_id: 'fq_2', question_kind: 'text', scale_value: null,
    text_value: 'More speaking practice, less grammar drilling.' }));
refuses('Text typed against a scale question is refused',
  () => ans({ scale_value: null, text_value: 'quite good' }));
refuses('A number recorded against a text question is refused',
  () => ans({ question_id: 'fq_2', question_kind: 'text' }));
refuses('...and the shape cannot be forged by misdeclaring the question kind',
  () => ans({ question_id: 'fq_2', question_kind: 'scale' }));
refuses('An answer that is both a number and a sentence is refused',
  () => ans({ text_value: 'four' }));
refuses('An empty answer is refused', () => ans({ scale_value: null, question_kind: 'text' }));

// The one assertion that DOES need a collision, so it makes its own:
// the same question answered twice inside a single response.
refuses('One question cannot be answered twice in one response', () => {
  db.prepare(`INSERT INTO feedback_responses (id, survey_id, anonymous, user_id, submitted_at)
    VALUES ('fr_dup','svy_anon',1,NULL,'2026-11-07T09:00:00Z')`).run();
  db.prepare(`INSERT INTO feedback_answers (id, response_id, question_id, question_kind, scale_value)
    VALUES ('fa_dup1','fr_dup','fq_1','scale',3)`).run();
  db.prepare(`INSERT INTO feedback_answers (id, response_id, question_id, question_kind, scale_value)
    VALUES ('fa_dup2','fr_dup','fq_1','scale',5)`).run();
});

// --- Something has to happen -----------------------------------------
allows('A change made because of what learners said is recorded', () =>
  db.prepare(`INSERT INTO feedback_actions (id, survey_id, finding, outcome, detail, decided_by, decided_at, reported_to_learners_at)
    VALUES ('fa_act1','svy_anon','Learners found the assessment brief unclear.','changed',
            'The brief was rewritten and a worked example added.','usr_dir','2026-11-20T00:00:00Z','2026-11-21T00:00:00Z')`).run());
allows('...and so is a decision NOT to act, with its reason', () =>
  db.prepare(`INSERT INTO feedback_actions (id, survey_id, finding, outcome, detail, decided_by, decided_at)
    VALUES ('fa_act2','svy_anon','Several learners asked for the level to be shortened.','declined',
            'The duration is set by the qualification framework and cannot be varied for one cohort.','usr_dir','2026-11-20T00:00:00Z')`).run());
refuses('An action with no detail is refused: "noted" is not an answer', () =>
  db.prepare(`INSERT INTO feedback_actions (id, survey_id, finding, outcome, detail, decided_by, decided_at)
    VALUES ('fa_act3','svy_anon','Something.','changed','  ','usr_dir','2026-11-20T00:00:00Z')`).run());
refuses('An unrecognised outcome is refused', () =>
  db.prepare(`INSERT INTO feedback_actions (id, survey_id, finding, outcome, detail, decided_by, decided_at)
    VALUES ('fa_act4','svy_anon','Something.','ignored','x','usr_dir','2026-11-20T00:00:00Z')`).run());

// --- The College ships no opinions ------------------------------------
const shipped = new DatabaseSync(':memory:');
shipped.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
for (const t of ['feedback_surveys', 'feedback_responses', 'feedback_answers', 'feedback_actions']) {
  check(`${t} ships empty, because nobody has been taught yet`,
    shipped.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n === 0);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
