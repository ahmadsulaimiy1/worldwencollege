// functions/_lib/registry/profile.js — the graduate's permanent
// academic identity.
//
// This module decides what a stranger learns about a person's education.
// So most of these assertions are about the ways it could tell somebody
// something the graduate did not agree to tell them, and about the ways
// it could tell them something untrue.
//
// The hardest of those is the second: a profile that OMITS a section is
// read as a graduate who has nothing in it. Silence is not neutral on a
// document like this, and several assertions below exist because "we
// left it out" and "there is none" must never look the same.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl, conferForTest } from './helpers.mjs';

const P = await import(loadUrl('functions/_lib/registry/profile.js'));
const reg = await import(loadUrl('functions/_lib/registry/awards.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const T0 = Date.parse('2027-06-01T09:00:00.000Z');

function freshEnv() {
  const env = { DB: makeD1(schema) };
  for (const u of ['grad', 'other', 'staff']) {
    env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
      VALUES ('usr_${u}','clerk','c_${u}','${u}@example.com','${u === 'staff' ? 'staff' : 'student'}')`).bind().run();
  }
  env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at,completed_at)
    VALUES ('enr_1','usr_grad',1,'completed','2027-01-05T00:00:00.000Z','2027-05-01T00:00:00.000Z')`).bind().run();
  env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at)
    VALUES ('enr_2','usr_grad',2,'active','2027-05-02T00:00:00.000Z')`).bind().run();
  return env;
}

const AWARD = {
  levelId: 1, awardTitle: 'Essential Certificate in English Communication',
  postNominal: 'ECIC', cefr: 'A1', credits: 20, tqtHours: 200,
  holderName: 'Demonstration Graduate',
};

// ---------------------------------------------------------------------
// A profile begins private, and stays private until somebody says so
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const p = await P.getOrCreateProfile(env, { userId: 'usr_grad' });
  check('A profile is created on demand', !!p && p.user_id === 'usr_grad');
  check('...and every part of it starts private',
    p.is_public === 0 && p.show_transcript === 0 && p.show_competencies === 0
    && p.show_cpd === 0 && p.show_study_time === 0,
    JSON.stringify(p).slice(0, 120));
  check('...with no public address until one is chosen', p.handle === null);

  const again = await P.getOrCreateProfile(env, { userId: 'usr_grad' });
  check('Fetching it twice does not create a second', again.user_id === p.user_id);
  const ghost = await throws(() => P.getOrCreateProfile(env, { userId: 'usr_nobody' }));
  check('A profile cannot be created for somebody who does not exist',
    ghost && ghost.name === 'NotFoundError');
}

// ---------------------------------------------------------------------
// The public address
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await P.updateProfile(env, { userId: 'usr_grad', changes: { handle: 'A-Graduate' } });
  const p = await P.getOrCreateProfile(env, { userId: 'usr_grad' });
  check('A handle is stored lower-case, so the address is one address', p.handle === 'a-graduate');

  const taken = await throws(() => P.updateProfile(env, { userId: 'usr_other', changes: { handle: 'a-graduate' } }));
  check('Two graduates cannot claim the same address', taken && taken.name === 'ValidationError');

  for (const bad of ['ab', 'has space', 'UPPER!', '-leading', 'trailing-', 'x'.repeat(40)]) {
    const e = await throws(() => P.updateProfile(env, { userId: 'usr_other', changes: { handle: bad } }));
    if (!e) { check(`A malformed address is refused: "${bad}"`, false); break; }
  }
  check('Malformed addresses are refused', true);
  check('An address can be given up again',
    (await P.updateProfile(env, { userId: 'usr_grad', changes: { handle: null } })).handle === null);
}

// ---------------------------------------------------------------------
// The transcript records what happened, not only what succeeded
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await conferForTest(reg, env, { userId: 'usr_grad', ...AWARD, honour: 'merit', now: T0 });

  const t = await P.transcript(env, { userId: 'usr_grad' });
  check('The transcript lists every level entered', t.entries.length === 2, t.entries.length);
  // The decisive one. A transcript showing only completed levels is a
  // list of achievements, which is a different and less trustworthy
  // document.
  check('...including one still in progress, not only the ones that produced an award',
    t.entries.some((e) => e.status === 'active' && e.award === null));
  check('...naming the award where there is one', t.entries[0].award.postNominal === 'ECIC');
  check('...with the honour recorded', t.entries[0].award.honourLabel === 'Merit');
  check('...and the code that verifies it', /^WEC-/.test(t.entries[0].award.verificationCode));
  check('Credits and qualification time are totalled from awards held',
    t.creditsAwarded === 20 && t.tqtHoursAwarded === 200);
  check('Levels entered and levels awarded are reported separately',
    t.levelsEntered === 2 && t.levelsAwarded === 1);
}

// ---------------------------------------------------------------------
// A withdrawn award is not credit the graduate holds
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const a = await conferForTest(reg, env, { userId: 'usr_grad', ...AWARD, now: T0 });
  await reg.revokeAward(env, { awardId: a.id, reason: 'Withdrawn after an integrity finding.', now: T0 + 86400000 });

  const t = await P.transcript(env, { userId: 'usr_grad' });
  check('A withdrawn award still appears on the transcript', !!t.entries[0].award);
  check('...marked as withdrawn rather than quietly deleted',
    t.entries[0].award.standing === 'revoked', t.entries[0].award.standing);
  // The one number on the document that must never be wrong.
  check('...and its credits are NOT counted toward the total',
    t.creditsAwarded === 0 && t.tqtHoursAwarded === 0,
    `${t.creditsAwarded} credits / ${t.tqtHoursAwarded} hours`);
  check('...leaving no award recorded as held', t.highestAward === null);
}

// ---------------------------------------------------------------------
// Competencies: the gap is reported, not papered over
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const c = await P.competencyAttainment(env, { userId: 'usr_grad' });
  check('All six competencies of the framework are named', c.competencies.length === 6);
  check('...in the framework\'s order, beginning with Clarity',
    c.competencies[0].code === 'CLARITY' && c.competencies[5].code === 'REACH');
  // The distinction that keeps this honest. An unmapped curriculum is
  // not a graduate who scored nothing.
  check('An unmapped curriculum reports as UNMAPPED, not as a score of zero',
    c.state === 'unmapped', c.state);
  check('...with a mark of null rather than 0 for every competency',
    c.competencies.every((x) => x.mark === null && x.assessments === 0));
  check('...and says so in words a reader will understand',
    /not yet mapped/i.test(c.note) && /A6d/.test(c.note), c.note);
}

// ---------------------------------------------------------------------
// The coverage instrument answers the framework's own question
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  // One course per level already exists in the schema's seed data —
  // level_id is UNIQUE on courses, which is itself worth knowing.
  const crs = env.DB.prepare('SELECT id FROM courses WHERE level_id = 1').bind().first();
  env.DB.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_x', '${crs.id}', 99, 'M1')`).bind().run();
  for (let i = 1; i <= 4; i++) {
    env.DB.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title)
      VALUES ('itm_${i}','unt_x',${i},'assignment','A${i}')`).bind().run();
  }

  const before = await P.competencyCoverage(env);
  check('Coverage quotes the framework rule it is measuring',
    /at least 3 times per level/i.test(before.rule) && /academic-framework/.test(before.source));
  check('An unmapped curriculum is reported as NOT compliant', before.compliant === false);
  check('...counting the assessments that exist and the none that are mapped',
    before.totalAssessments === 4 && before.totalMapped === 0,
    `${before.totalMapped}/${before.totalAssessments}`);
  check('...and naming a shortfall for every competency at every level',
    before.shortfalls === 36, before.shortfalls);

  // Map three assessments to Clarity — enough for one competency at one
  // level, and nothing else.
  for (let i = 1; i <= 3; i++) {
    env.DB.prepare(`INSERT INTO assessment_competencies (learning_item_id, competency_id)
      VALUES ('itm_${i}','cmp_clarity')`).bind().run();
  }
  const after = await P.competencyCoverage(env);
  const l1 = after.levels.find((l) => l.levelId === 1);
  const clarity = l1.perCompetency.find((c) => c.code === 'CLARITY');
  check('Mapping three assessments satisfies the rule for that competency',
    clarity.assessments === 3 && clarity.meetsRule === true);
  check('...and not for the others', l1.perCompetency.filter((c) => c.meetsRule).length === 1);
  check('An assessment mapped to nothing is counted as unmapped',
    l1.assessmentsUnmapped === 1, l1.assessmentsUnmapped);
  check('Partial mapping is still not compliance', after.compliant === false);
}

// ---------------------------------------------------------------------
// Sharing: the scope is what was agreed, intersected with what is on
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await conferForTest(reg, env, { userId: 'usr_grad', ...AWARD, now: T0 });
  env.DB.prepare(`INSERT INTO cpd_records (id,user_id,title,kind,hours,completed_on)
    VALUES ('cpd_1','usr_grad','A conference talk','conference',6,'2027-07-01')`).bind().run();

  const share = await P.createShare(env, {
    userId: 'usr_grad', sections: ['awards', 'transcript', 'cpd'], days: 30, label: 'For an employer', now: T0,
  });
  check('A share link is issued with a token', typeof share.token === 'string' && share.token.length >= 32);
  // The token is a bearer credential: holding it is holding access.
  const stored = env.DB.prepare('SELECT token_hash FROM profile_shares WHERE id = ?').bind(share.id).first();
  check('The token is stored only as a hash, never in the clear',
    stored.token_hash !== share.token && stored.token_hash.length === 64);

  const view = await P.viewShare(env, { token: share.token, now: T0 + 1000 });
  check('The link resolves to the record', view.ok === true);
  check('...showing awards, which need no separate switch', !!view.profile.awards);
  // The decisive scoping rule. The graduate agreed to share the
  // transcript, but has not made it visible; agreement and setting must
  // BOTH allow it, or turning a section off would not take it out of
  // links already issued.
  check('...withholding the transcript, because the setting is still off',
    view.profile.transcript === undefined);
  check('...and withholding CPD for the same reason', view.profile.cpd === undefined);
  check('...naming what was withheld rather than staying silent about it',
    view.profile.sectionsWithheld.includes('transcript') && view.profile.sectionsWithheld.includes('cpd'),
    JSON.stringify(view.profile.sectionsWithheld));

  await P.updateProfile(env, { userId: 'usr_grad', changes: { transcript: true } });
  const view2 = await P.viewShare(env, { token: share.token, now: T0 + 2000 });
  check('Turning the setting on lets the agreed section through', !!view2.profile.transcript);
  check('...and still not the section that was never agreed to',
    view2.profile.studyTime === undefined);

  const shares = await P.listShares(env, { userId: 'usr_grad' });
  check('The graduate can see their links and how often each was opened',
    shares.length === 1 && shares[0].viewCount === 2, JSON.stringify(shares[0]));
  check('...without the token being handed back to them',
    !('token' in shares[0]) && !('tokenHash' in shares[0]));
  check('...and can see the link is live', shares[0].active === true);
}

// ---------------------------------------------------------------------
// Withdrawal, expiry, and telling neither apart
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const a = await P.createShare(env, { userId: 'usr_grad', sections: ['awards'], days: 30, now: T0 });
  await P.revokeShare(env, { userId: 'usr_grad', shareId: a.id, now: T0 + 5000 });
  const revoked = await P.viewShare(env, { token: a.token, now: T0 + 6000 });
  check('A withdrawn link stops working', revoked.ok === false);

  const b = await P.createShare(env, { userId: 'usr_grad', sections: ['awards'], days: 1, now: T0 });
  const expired = await P.viewShare(env, { token: b.token, now: T0 + 2 * 86400000 });
  check('An expired link stops working', expired.ok === false);

  const never = await P.viewShare(env, { token: 'not-a-real-token', now: T0 });
  // Distinguishing these would tell a holder whether the graduate
  // revoked the link, which is between the graduate and their decision.
  check('Withdrawn, expired and never-issued give the same answer',
    revoked.reason === expired.reason && expired.reason === never.reason, revoked.reason);

  const notMine = await throws(() => P.revokeShare(env, { userId: 'usr_other', shareId: a.id }));
  check('One graduate cannot revoke another\'s link', notMine && notMine.name === 'NotFoundError');
  check('...and is told the same thing as for a link that does not exist',
    (await throws(() => P.revokeShare(env, { userId: 'usr_other', shareId: 'shr_nope' }))).message === notMine.message);

  const noSections = await throws(() => P.createShare(env, { userId: 'usr_grad', sections: [] }));
  check('A share with nothing in it is refused', noSections && noSections.name === 'ValidationError');
  const forever = await throws(() => P.createShare(env, { userId: 'usr_grad', sections: ['awards'], days: 4000 }));
  check('A share cannot be made to last indefinitely', forever && forever.name === 'ValidationError');
  const junk = await P.createShare(env, { userId: 'usr_grad', sections: ['awards', 'salary', 'medical'] });
  check('An invented section is dropped rather than honoured',
    junk.scope.length === 1 && junk.scope[0] === 'awards', JSON.stringify(junk.scope));
}

// ---------------------------------------------------------------------
// The public profile publishes only what was published
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await conferForTest(reg, env, { userId: 'usr_grad', ...AWARD, now: T0 });
  const anyUnit = env.DB.prepare('SELECT id FROM units LIMIT 1').bind().first();
  if (anyUnit) {
    env.DB.prepare(`INSERT INTO time_on_task (id,user_id,unit_id,seconds,first_seen_at,last_seen_at)
      VALUES ('tot_1','usr_grad','${anyUnit.id}',7200,'2027-01-01T00:00:00.000Z','2027-01-01T02:00:00.000Z')`).bind().run();
  }

  const hidden = await throws(() => P.publicProfile(env, { handle: 'a-graduate' }));
  check('An unpublished profile is not reachable at all', hidden && hidden.name === 'NotFoundError');

  await P.updateProfile(env, { userId: 'usr_grad', changes: { handle: 'a-graduate', isPublic: true, headline: 'Translator' } });
  const pub = await P.publicProfile(env, { handle: 'A-Graduate' });
  check('A published profile is reachable, case-insensitively', pub.handle === 'a-graduate');
  check('...showing the awards, which are the point of publishing', pub.awards.length === 1);
  check('...and the graduate\'s own headline', pub.headline === 'Translator');
  check('...but not study hours, which nobody switched on', pub.studyTime === undefined);
  check('...nor the transcript', pub.transcript === undefined);
  // Derived from SECTIONS rather than counted by hand: the property
  // being asserted is "every section is accounted for, as shared or as
  // withheld", and a hardcoded 4 turns that into a test that breaks
  // whenever a section is added without being any better at catching
  // the failure it exists for.
  check('The reader is told the record continues past what they can see',
    pub.sectionsShared.length === 1
    && pub.sectionsShared[0] === 'awards'
    && pub.sectionsWithheld.length === P.SECTIONS.length - 1
    && [...pub.sectionsShared, ...pub.sectionsWithheld].sort().join() === [...P.SECTIONS].sort().join(),
    JSON.stringify(pub.sectionsWithheld));
}

// ---------------------------------------------------------------------
// The projection is the single place scoping happens
// ---------------------------------------------------------------------
{
  const full = {
    handle: 'x', displayName: 'X', headline: null, biography: null, countryCode: null,
    visibility: { isPublic: true, transcript: true, competencies: false, cpd: true, studyTime: false },
    awards: [{ title: 'A' }], transcript: { entries: [] }, competencies: { state: 'unmapped' },
    cpd: { records: [] }, studyTime: { totalHours: 12 },
  };
  const self = P.project(full, { audience: 'self' });
  check('A graduate sees their whole record', self.studyTime.totalHours === 12 && self.competencies !== undefined);

  const pub = P.project(full, { audience: 'public' });
  check('The public sees the sections switched on', !!pub.transcript && !!pub.cpd);
  check('...and not the ones switched off', pub.competencies === undefined && pub.studyTime === undefined);

  // The intersection, stated as an assertion rather than as a comment.
  const over = P.project(full, { audience: 'share', scope: ['awards', 'transcript', 'studyTime', 'competencies'] });
  check('A share can never exceed the graduate\'s current visibility settings',
    !!over.transcript && over.studyTime === undefined && over.competencies === undefined,
    JSON.stringify(over.sectionsShared));
  const under = P.project(full, { audience: 'share', scope: ['awards'] });
  check('...nor exceed what the graduate agreed to when issuing it',
    under.transcript === undefined && !!under.awards);
}

// ---------------------------------------------------------------------
// The one place a column name reaches the SQL text
// ---------------------------------------------------------------------
// updateProfile() builds `SET a = ?, b = ?` by joining column names, so
// it is the single statement in this module whose TEXT is assembled
// rather than fixed. The names come from two hardcoded maps and never
// from the caller — but "never from the caller" is a property of the
// current code, not of the shape, and the next person to add a field
// will be editing exactly this loop.
{
  const env = freshEnv();
  // Tested SEPARATELY, and this matters. An earlier version of this
  // block put them in one object — and the keys that BREAK the SQL threw
  // first, so the one that would have SILENTLY WORKED never landed and
  // the assertion passed for entirely the wrong reason. A hostile
  // payload that fails early protects the code from the test.
  const before = await P.getOrCreateProfile(env, { userId: 'usr_grad' });

  // 1. The dangerous one: a real column name, spelled as the database
  //    spells it. Nothing about this breaks the SQL, so only the
  //    allowlist stands between it and a published profile.
  const raw = await throws(() => P.updateProfile(env, { userId: 'usr_grad', changes: { is_public: true } }));
  let after = await P.getOrCreateProfile(env, { userId: 'usr_grad' });
  check('A raw column name does not publish a profile behind the graduate\'s back',
    after.is_public === 0,
    `is_public=${after.is_public}${raw ? ` (threw: ${raw.message.slice(0, 30)})` : ' (accepted silently)'}`);

  // 2. Keys carrying SQL. These would break the statement rather than
  //    subvert it, but a statement that can be broken from outside is a
  //    statement whose text is caller-influenced.
  for (const key of ['handle = handle, is_public = 1 --', "biography = 'x', is_public = 1"]) {
    await throws(() => P.updateProfile(env, { userId: 'usr_grad', changes: { [key]: 'x' } }));
  }
  after = await P.getOrCreateProfile(env, { userId: 'usr_grad' });
  check('...nor does a key carrying SQL', after.is_public === 0 && after.biography === before.biography);

  // 3. Inherited names, which `key in obj` would wave through.
  await throws(() => P.updateProfile(env, { userId: 'usr_grad', changes: { constructor: 'x', toString: 'x' } }));
  after = await P.getOrCreateProfile(env, { userId: 'usr_grad' });
  check('...nor an inherited property name', after.is_public === 0);

  check('The API\'s own spelling still works, so the allowlist is not simply refusing everything',
    (await P.updateProfile(env, { userId: 'usr_grad', changes: { isPublic: true } })).is_public === 1);

  // Values, unlike keys, are free text and are bound.
  const quoted = await P.updateProfile(env, {
    userId: 'usr_grad',
    changes: { biography: "Robert'); DROP TABLE graduate_profiles; --" },
  });
  check('A value containing SQL is stored as text, not executed',
    quoted.biography.startsWith("Robert');"),
    quoted.biography.slice(0, 30));
  check('...leaving the table intact',
    env.DB.prepare('SELECT COUNT(*) AS n FROM graduate_profiles').bind().first().n >= 1);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
