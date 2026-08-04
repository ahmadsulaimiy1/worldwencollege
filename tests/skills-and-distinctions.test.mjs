// The language-skill framework and the record of academic contribution.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   With no approved mapping, a graduate's skill profile reports
//   `unmapped` and every attainment is null — never 0, never a guess.
//
// The temptation the whole design resists is inference: deriving
// Listening from the Listening Lab, Speaking from pronunciation
// recordings, Writing from assignment marks. Each looks like a
// calculation and is in fact an academic judgement, and a profile that
// reported "Reading: B2" because a program guessed would be wrong in a
// way nobody downstream could detect. So the assertions below check
// that the software declines to guess, and keeps declining even when
// the data that would tempt it is present.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const S = await import(loadUrl('functions/_lib/registry/skills.js'));
const D = await import(loadUrl('functions/_lib/registry/distinctions.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function threw(fn, re) {
  try { await fn(); return 'did not throw'; }
  catch (e) { return re.test(e.message) ? null : 'wrong error: ' + e.message; }
}

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');

function freshEnv() {
  const env = { DB: makeD1(schema) };
  const run = (sql) => env.DB.prepare(sql).bind().run();
  run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
       VALUES ('usr_grad','clerk','c_g','g@example.com','student')`);
  run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
       VALUES ('usr_dean','clerk','c_d','d@example.com','admin')`);
  // schema.sql already seeds one course per level (courses.level_id is
  // UNIQUE), so this attaches to the real Level I course rather than
  // inventing a second one that the schema would refuse.
  const course = env.DB.prepare('SELECT id FROM courses WHERE level_id = 1').bind().first();
  run(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_x','${course.id}',99,'Test module')`);
  run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
       VALUES ('itm_w','unt_x',1,'assignment','A written task')`);
  run(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
       VALUES ('itm_q','unt_x',2,'quiz','A listening quiz')`);
  return env;
}

// --- The framework itself ---------------------------------------------
{
  const env = freshEnv();
  const f = await S.framework(env);
  check('The four language skills are seeded by the schema', f.length === 4, f.length);
  check('...in reading order, receptive before productive within each pair',
    f.map((s) => s.code).join(',') === 'LISTENING,READING,SPEAKING,WRITING',
    f.map((s) => s.code).join(','));
  check('...each classified as receptive or productive',
    f.filter((s) => s.mode === 'receptive').length === 2
    && f.filter((s) => s.mode === 'productive').length === 2);
}

// --- The state that actually ships ------------------------------------
{
  const env = freshEnv();
  const cov = await S.coverage(env);
  check('With nothing mapped, coverage reports unmapped', cov.state === 'unmapped', cov.state);
  check('...counting the assessments that exist, so the gap has a size',
    cov.assessments === 2, cov.assessments);
  check('...and says in words that this awaits an academic decision',
    /awaiting academic decision, not missing data/.test(cov.note), cov.note);

  const prof = await S.skillProfile(env, { userId: 'usr_grad' });
  check('A graduate\'s skill profile reports unmapped, not empty', prof.state === 'unmapped');
  check('...still naming all four skills, so the reader sees what is missing',
    prof.skills.length === 4);
  // The decisive one. A zero here would put a failing mark against
  // somebody who was never assessed.
  check('...with every attainment null rather than zero',
    prof.skills.every((s) => s.attainment === null),
    JSON.stringify(prof.skills.map((s) => s.attainment)));
}

// --- The software must keep declining even when tempted ---------------
{
  // A graded assignment exists. Without an APPROVED mapping saying
  // which skill it evidences, it must contribute to nothing. This is
  // the assertion that would fail the moment somebody "helpfully"
  // wired grades straight to skills.
  const env = freshEnv();
  env.DB.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade)
                  VALUES ('asub_1','itm_w','usr_grad','graded',0.82)`).bind().run();

  const prof = await S.skillProfile(env, { userId: 'usr_grad' });
  check('A graded assignment with no mapping still yields no skill attainment',
    prof.state === 'unmapped' && prof.skills.every((s) => s.attainment === null),
    prof.state);
}

{
  // A PROPOSED mapping is a suggestion. It must not reach a record.
  const env = freshEnv();
  env.DB.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade)
                  VALUES ('asub_1','itm_w','usr_grad','graded',0.82)`).bind().run();
  await S.proposeMapping(env, { learningItemId: 'itm_w', skillId: 'skl_writing', proposedBy: 'usr_dean' });

  const cov = await S.coverage(env);
  check('A proposed mapping moves coverage to awaiting_approval, not mapped',
    cov.state === 'awaiting_approval', cov.state);
  const prof = await S.skillProfile(env, { userId: 'usr_grad' });
  check('...and an unapproved judgement never reaches a graduate\'s profile',
    prof.state === 'awaiting_approval' && prof.skills.every((s) => s.attainment === null),
    prof.state);
}

{
  // Approved: now, and only now, the attainment appears.
  const env = freshEnv();
  env.DB.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade)
                  VALUES ('asub_1','itm_w','usr_grad','graded',0.82)`).bind().run();
  const m = await S.proposeMapping(env, { learningItemId: 'itm_w', skillId: 'skl_writing', proposedBy: 'usr_dean' });
  const ok = await S.approveMapping(env, { id: m.id, approvedBy: 'usr_dean' });
  check('A mapping can be approved', ok.ok === true, JSON.stringify(ok));

  const prof = await S.skillProfile(env, { userId: 'usr_grad' });
  check('...and the skill it evidences now reports attainment', prof.state === 'assessed', prof.state);
  const writing = prof.skills.find((s) => s.code === 'WRITING');
  check('...at the graded value', writing.attainment === 82, writing.attainment);
  check('...while the three unassessed skills stay null, not zero',
    prof.skills.filter((s) => s.code !== 'WRITING').every((s) => s.attainment === null));
}

{
  // Weights must actually weigh. A task that touches a skill in
  // passing cannot count the same as one built around it.
  const env = freshEnv();
  env.DB.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade)
                  VALUES ('asub_1','itm_w','usr_grad','graded',1.0)`).bind().run();
  env.DB.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade)
                  VALUES ('asub_2','itm_q','usr_grad','graded',0.0)`).bind().run();
  const a = await S.proposeMapping(env, { learningItemId: 'itm_w', skillId: 'skl_writing', weight: 1.0, proposedBy: 'usr_dean' });
  const b = await S.proposeMapping(env, { learningItemId: 'itm_q', skillId: 'skl_writing', weight: 0.25, proposedBy: 'usr_dean' });
  await S.approveMapping(env, { id: a.id, approvedBy: 'usr_dean' });
  await S.approveMapping(env, { id: b.id, approvedBy: 'usr_dean' });

  const prof = await S.skillProfile(env, { userId: 'usr_grad' });
  const writing = prof.skills.find((s) => s.code === 'WRITING');
  // Weighted: (1.0x1.0 + 0.0x0.25) / 1.25 = 0.8. An unweighted mean
  // would be 0.5, so this fails if the weights are ignored.
  check('Weighted marks are weighted, not averaged flat', writing.attainment === 80, writing.attainment);
}

{
  const env = freshEnv();
  check('An approval must name who made it',
    await threw(() => S.approveMapping(env, { id: 'x' }), /must record who/) === null);
  check('A weight outside 0..1 is refused',
    await threw(() => S.proposeMapping(env, { learningItemId: 'itm_w', skillId: 'skl_writing', weight: 1.5 }),
      /weight must be/) === null);
  const missing = await S.approveMapping(env, { id: 'ask_nope', approvedBy: 'usr_dean' });
  check('Approving a mapping that does not exist is refused, not silently accepted',
    missing.ok === false && missing.reason === 'not_found', JSON.stringify(missing));
}

// --- Academic distinctions --------------------------------------------
{
  const env = freshEnv();
  const d = await D.propose(env, {
    userId: 'usr_grad', kind: 'presentation', title: 'Presented at the Level IV colloquium',
    awardedOn: '2027-06-14', awardedBy: 'Worldwide English College',
  });
  check('A distinction is created as proposed, never approved', d.status === 'proposed', d.status);

  const pub = await D.forUser(env, { userId: 'usr_grad', audience: 'public' });
  // A proposed distinction is somebody's unverified claim. Publishing
  // it under the College's name makes the College the one asserting it.
  check('...and a proposed claim is not visible publicly', pub.items.length === 0, pub.items.length);

  const own = await D.forUser(env, { userId: 'usr_grad', audience: 'self' });
  check('...though the holder can see their own pending claim', own.items.length === 1);

  await D.approve(env, { id: d.id, approvedBy: 'usr_dean' });
  const after = await D.forUser(env, { userId: 'usr_grad', audience: 'public' });
  check('Once approved it is public', after.items.length === 1 && after.approved === 1);
  check('...grouped under a readable heading',
    after.byKind[0].label === 'Presentation', JSON.stringify(after.byKind.map((g) => g.label)));
}

{
  const env = freshEnv();
  const d = await D.propose(env, { userId: 'usr_grad', kind: 'prize', title: 'The Founders Prize', awardedOn: '2027-06-14' });
  await D.approve(env, { id: d.id, approvedBy: 'usr_dean' });
  await D.withdraw(env, { id: d.id, reason: 'Awarded in error; the panel decision was reversed on appeal.' });

  const pub = await D.forUser(env, { userId: 'usr_grad', audience: 'public' });
  // The awards register's rule, applied here too: a record that can
  // quietly lose entries is not a record.
  check('A withdrawn distinction stays on the record, marked',
    pub.items.length === 1 && pub.items[0].status === 'withdrawn', JSON.stringify(pub.items));
  check('...and is not counted among the approved', pub.approved === 0, pub.approved);
  check('...carrying the reason, so a reader is not left to assume the worst',
    /reversed on appeal/.test(pub.items[0].withdrawnReason || ''), pub.items[0].withdrawnReason);
}

{
  const env = freshEnv();
  check('An unknown kind of distinction is refused',
    await threw(() => D.propose(env, { userId: 'usr_grad', kind: 'nobel', title: 'x', awardedOn: '2027-01-01' }),
      /unknown kind/) === null);
  check('A distinction without a date is refused',
    await threw(() => D.propose(env, { userId: 'usr_grad', kind: 'prize', title: 'x' }),
      /needs a holder, a title and a date/) === null);
  // A conferral is a day, not a moment — the same rule the awards
  // register applies to conferred_on.
  check('A timestamp where a date belongs is refused',
    await threw(() => D.propose(env, { userId: 'usr_grad', kind: 'prize', title: 'x', awardedOn: '2027-01-01T00:00:00Z' }),
      /must be a date, not a timestamp/) === null);
  check('A withdrawal without a real reason is refused',
    await threw(() => D.withdraw(env, { id: 'x', reason: 'no' }), /at least 10 characters/) === null);
}

{
  // Approval is not reachable through the creation path. A function
  // that could create an approved record would eventually be called
  // with the flag set.
  const env = freshEnv();
  const d = await D.propose(env, {
    userId: 'usr_grad', kind: 'research', title: 'x', awardedOn: '2027-01-01',
    status: 'approved', approvedBy: 'usr_grad',      // ignored by design
  });
  const row = env.DB.prepare('SELECT status, approved_by FROM academic_distinctions WHERE id = ?').bind(d.id).first();
  check('Extra arguments cannot smuggle in an approval',
    row.status === 'proposed' && row.approved_by === null, JSON.stringify(row));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
