// Run with: node --experimental-sqlite tests/marking-queue.test.mjs
//
// THE WORK WAITING TO BE MARKED.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAULT THIS COVERS
// ─────────────────────────────────────────────────────────────────────
// `POST /api/lms/grade-assignment` takes a `submissionId`. Nothing
// anywhere produced one. Learners have been able to submit assignments
// through /my-module.html since the study surface was built, and no
// member of staff could find one to mark — the work arrived and sat
// there, invisible, with no queue and no count.
//
// What is asserted here is what makes a queue a queue rather than a
// list:
//
//   OLDEST FIRST. A queue sorted newest-first starves the learners who
//   have waited longest. The wait is returned in days on every row so a
//   marker can see it instead of working it out.
//
//   THE RUBRIC TRAVELS WITH THE WORK. Every award at this College is
//   marked against a rubric published before the task, and the rubric
//   lives in the assignment's own body. A marking screen that does not
//   carry it is a marking screen that invites marking without it.
//
//   A RESIT IS NOT MARKED AS A FIRST ATTEMPT. Where a learner has been
//   marked before on the same task, that mark and its feedback come
//   back with the new submission.
//
//   IT IS STAFF-ONLY, and the payload says on what basis the queue is
//   drawn rather than leaving a page to assert one.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const { listSubmissionsForMarking, gradeAssignment } = await import(loadUrl('functions/_lib/lms/content.js'));
const { ValidationError } = await import(loadUrl('functions/_lib/db.js'));
const { onRequestGet: queueRoute } = await import(loadUrl('functions/api/lms/marking-queue.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const run = (sql, ...a) => db.prepare(sql).bind(...a).run();

// ── A level with one module and one assignment in it ────────────────
await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
           VALUES ('usr_a','clerk','sub_a','a@example.com','student','Aisha')`);
await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
           VALUES ('usr_b','clerk','sub_b','b@example.com','student','Bilal')`);
await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
           VALUES ('usr_t','clerk','sub_t','t@example.com','staff','A Tutor')`);
// The courses are NOT inserted here. `courses.level_id` is UNIQUE and
// sql/schema.sql already ships one course per programme level, so a
// fixture that inserts its own is a fixture testing a shape the
// platform does not have. The modules hang off the real ones.
await run(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_1','crs_level_1',1,'Module 1: Meeting People')`);
await run(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_2','crs_level_2',1,'Module 1: Asking for Things')`);
await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title, body)
           VALUES ('itm_1','unt_1',1,'assignment','Introduce yourself',
                   'Write 150 words. (1) Clarity — understood the first time. (2) Command — controls the language.')`);
await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title, body)
           VALUES ('itm_2','unt_2',1,'assignment','Make a request','Write 150 words.')`);
// A quiz, which must never appear in a queue of written work.
await run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
           VALUES ('itm_q','unt_1',2,'quiz','A quiz')`);

const submit = (id, item, user, at, attempt = 1, status = 'submitted') => run(
  `INSERT INTO assignment_submissions (id, learning_item_id, user_id, content, status, attempt, submitted_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  id, item, user, `Work from ${user}, attempt ${attempt}.`, status, attempt, at,
);

// Deliberately inserted newest first, so an unsorted query would return
// them in the wrong order and the assertion would mean something.
await submit('asub_new', 'itm_1', 'usr_b', '2026-08-20T09:00:00.000Z');
await submit('asub_old', 'itm_1', 'usr_a', '2026-08-01T09:00:00.000Z');
await submit('asub_other', 'itm_2', 'usr_b', '2026-08-10T09:00:00.000Z');

// ── The queue ───────────────────────────────────────────────────────
{
  const q = await listSubmissionsForMarking(env, {});
  check('every piece of written work awaiting a mark is in the queue',
    q.submissions.length === 3, String(q.submissions.length));
  check('...oldest first, because a queue sorted the other way starves the longest wait',
    q.submissions.map((s) => s.id).join(',') === 'asub_old,asub_other,asub_new',
    q.submissions.map((s) => s.id).join(','));
  check('...and the wait is returned in days rather than left to be worked out',
    q.submissions.every((s) => Number.isInteger(s.waitingDays))
    && q.submissions[0].waitingDays > q.submissions[2].waitingDays,
    q.submissions.map((s) => s.waitingDays).join(' / '));

  const first = q.submissions[0];
  check('the learner is named, because a marker attributes the work they mark',
    first.userId === 'usr_a' && first.preferredName === 'Aisha');
  check('the module and the task are named',
    first.unitTitle === 'Module 1: Meeting People' && first.itemTitle === 'Introduce yourself');
  check('the level is named, so a marker knows what standard they are marking to',
    first.levelId === 1);
  check('THE RUBRIC TRAVELS WITH THE WORK — it is in the task the learner was set',
    /Clarity/.test(first.itemBody) && /Command/.test(first.itemBody));
  check('...and so does what the learner actually wrote',
    first.content === 'Work from usr_a, attempt 1.');
  check('the basis the queue is drawn on is stated, not left for a page to assert',
    q.basis === 'college' && /not one tutor/i.test(q.note), q.note.slice(0, 60));
}

// ── A quiz is not written work ──────────────────────────────────────
{
  await run(`INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index)
             VALUES ('qq_1','itm_q',1,'?','["a","b"]',0)`);
  const q = await listSubmissionsForMarking(env, {});
  check('a quiz never reaches a queue of work marked by a person',
    q.submissions.every((s) => s.learningItemId !== 'itm_q'));
}

// ── One level at a time ─────────────────────────────────────────────
{
  const one = await listSubmissionsForMarking(env, { levelId: 1 });
  check('a level can be worked on its own',
    one.submissions.length === 2 && one.submissions.every((s) => s.levelId === 1),
    String(one.submissions.length));
  check('...and the payload says which level it answered for', one.levelId === 1);
}

// ── A resit carries what it is being marked against ─────────────────
{
  await gradeAssignment(env, {
    gradedBy: 'usr_t', submissionId: 'asub_old', grade: 0.55,
    feedback: 'The argument is there; the tenses are not.',
  });
  await submit('asub_resit', 'itm_1', 'usr_a', '2026-08-21T09:00:00.000Z', 2);

  const q = await listSubmissionsForMarking(env, {});
  const resit = q.submissions.find((s) => s.id === 'asub_resit');
  check('a marked submission leaves the queue of work awaiting a mark',
    !q.submissions.some((s) => s.id === 'asub_old'));
  check('a resit arrives carrying the mark it is a resit of',
    resit.previousAttempt && resit.previousAttempt.attempt === 1
    && resit.previousAttempt.grade === 0.55,
    JSON.stringify(resit.previousAttempt));
  check('...and the feedback that went with it, so it is not marked as a first attempt',
    /tenses are not/.test(resit.previousAttempt.feedback));
  check('a first attempt carries no previous one rather than an empty shape',
    q.submissions.find((s) => s.id === 'asub_new').previousAttempt === null);

  const marked = await listSubmissionsForMarking(env, { status: 'graded' });
  check('what has been marked can be read back, which is how a second marker finds it',
    marked.submissions.length === 1 && marked.submissions[0].id === 'asub_old');
  check('...carrying the mark and who gave it',
    marked.submissions[0].grade === 0.55 && marked.submissions[0].status === 'graded');
}

// ── The route ───────────────────────────────────────────────────────
{
  const b64url = (bytes) => Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
  const kp = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });
  const token = async (sub) => {
    const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
    const t = Math.floor(Date.now() / 1000);
    const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: t - 5, exp: t + 600 });
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
    return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
  };
  const routed = { ...env, CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
  const call = (qs, tok) => queueRoute({
    request: new Request(`https://wec-lc.test/api/lms/marking-queue${qs}`,
      tok ? { headers: { Authorization: `Bearer ${tok}` } } : undefined),
    env: routed,
  });

  check('the queue refuses an unauthenticated caller', (await call('')).status === 401);
  const learner = await token('sub_a');
  check('...and a learner, who may not read another learner\'s work',
    (await call('', learner)).status === 403, String((await call('', learner)).status));

  const staff = await token('sub_t');
  const ok = await call('', staff);
  const body = await ok.json();
  check('a member of staff is answered', ok.status === 200 && body.submissions.length >= 1);
  check('...and the answer is never cached, because it names learners and goes stale on every mark',
    /no-store/.test(ok.headers.get('cache-control') || ''), ok.headers.get('cache-control'));

  check('a level that is not a level is a clean 422', (await call('?levelId=nought', staff)).status === 422);
  check('...and so is a status the table does not have',
    (await call('?status=marked', staff)).status === 422);
  check('a real level is honoured',
    (await (await call('?levelId=2', staff)).json()).submissions.every((s) => s.levelId === 2));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
