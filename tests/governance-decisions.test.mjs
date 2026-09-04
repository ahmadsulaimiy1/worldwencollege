// Three adopted governance decisions, as behaviour rather than prose.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   "Certificates and verification remain valid regardless of portrait
//   status."
//
// That is the clause in the Executive Portrait Policy that has to be
// enforced rather than believed, because it is the one a future change
// could quietly break: somebody adds a JOIN, and a graduate whose photo
// was rejected finds their degree unverifiable. It is asserted below by
// verifying an award, removing the portrait, and verifying again —
// byte for byte.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const P = await import(loadUrl('functions/_lib/registry/portraits.js'));
const A = await import(loadUrl('functions/_lib/registry/alumni.js'));
const reg = await import(loadUrl('functions/_lib/registry/awards.js'));
const prof = await import(loadUrl('functions/_lib/registry/profile.js'));

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
  for (const [id, sub] of [['usr_a', 'a'], ['usr_b', 'b'], ['usr_rev', 'r']]) {
    run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
         VALUES ('${id}','clerk','c_${sub}','${sub}@example.com','student')`);
  }
  return env;
}
const AWARD = {
  awardTitle: 'English Associate of WorldWide English College', postNominal: 'AsWEC',
  cefr: 'B1', credits: 20, tqtHours: 200,
};

// ======================================================================
// 1. EXECUTIVE PORTRAIT POLICY
// ======================================================================
{
  const env = freshEnv();
  await prof.getOrCreateProfile(env, { userId: 'usr_a' });

  const before = await P.current(env, { userId: 'usr_a' });
  check('A graduate starts with no portrait, and that is a state with a name',
    before.status === 'none' && /No portrait has been provided/.test(before.meaning), JSON.stringify(before));
  check('...and nothing is published', (await P.publicPortrait(env, { userId: 'usr_a' })) === null);

  await P.submit(env, { userId: 'usr_a', key: 'portraits/usr_a.jpg' });
  const pending = await P.current(env, { userId: 'usr_a' });
  check('A submitted portrait enters review, not publication', pending.status === 'pending_review', pending.status);
  // The whole point of "reviewed before publication". A key returned
  // here would make the policy a description of intent, not behaviour.
  check('...and is visible to nobody until it is reviewed',
    (await P.publicPortrait(env, { userId: 'usr_a' })) === null);
  check('...appearing in the reviewer\'s queue', (await P.queue(env)).count === 1);

  const ok = await P.approve(env, { userId: 'usr_a', reviewedBy: 'usr_rev' });
  check('A reviewer can publish it', ok.ok === true && ok.status === 'published', JSON.stringify(ok));
  check('...and only then is it public',
    (await P.publicPortrait(env, { userId: 'usr_a' })).key === 'portraits/usr_a.jpg');
  check('...leaving the queue empty', (await P.queue(env)).count === 0);
}

{
  const env = freshEnv();
  await prof.getOrCreateProfile(env, { userId: 'usr_a' });
  await P.submit(env, { userId: 'usr_a', key: 'portraits/usr_a.jpg' });
  await P.reject(env, { userId: 'usr_a', reviewedBy: 'usr_rev', reason: 'Not a square image, and the face is not visible.' });

  const r = await P.current(env, { userId: 'usr_a' });
  check('A rejected portrait says so', r.status === 'rejected', r.status);
  // A graduate told only "rejected" cannot fix it.
  check('...with the reason, so it can be corrected', /not a square image/i.test(r.note || ''), r.note);
  check('...and the key cleared, so nothing can serve it', r.key === null, r.key);
  check('A rejection without a real reason is refused',
    await threw(() => P.reject(env, { userId: 'usr_a', reviewedBy: 'usr_rev', reason: 'no' }),
      /at least 10 characters/) === null);
  check('A review must name the reviewer',
    await threw(() => P.approve(env, { userId: 'usr_a' }), /must record who/) === null);
}

{
  // Publishing something nobody reviewed is the one thing the mechanism
  // exists to prevent.
  const env = freshEnv();
  await prof.getOrCreateProfile(env, { userId: 'usr_a' });
  const out = await P.approve(env, { userId: 'usr_a', reviewedBy: 'usr_rev' });
  check('A portrait that was never submitted cannot be published',
    out.ok === false && out.reason === 'none', JSON.stringify(out));
}

{
  const env = freshEnv();
  await prof.getOrCreateProfile(env, { userId: 'usr_a' });
  await P.submit(env, { userId: 'usr_a', key: 'k.jpg' });
  await P.approve(env, { userId: 'usr_a', reviewedBy: 'usr_rev' });
  await P.remove(env, { userId: 'usr_a', reason: 'At the graduate\'s request.' });

  const r = await P.current(env, { userId: 'usr_a' });
  check('A graduate may have their portrait removed', r.status === 'removed', r.status);
  check('...immediately, with the key cleared in the same act', r.key === null);
  // 'removed' and 'none' are different facts and are kept different.
  check('...and "removed" is not the same state as "never provided"',
    r.status !== 'none' && /has since been removed/.test(r.meaning), r.meaning);
}

// ---- The clause with teeth -------------------------------------------
{
  const env = freshEnv();
  const award = await reg.conferAward(env, { userId: 'usr_a', levelId: 3, holderName: 'A Graduate', ...AWARD });
  await prof.getOrCreateProfile(env, { userId: 'usr_a' });
  await P.submit(env, { userId: 'usr_a', key: 'k.jpg' });
  await P.approve(env, { userId: 'usr_a', reviewedBy: 'usr_rev' });

  const code = award.verification_code;
  const withPortrait = await reg.verifyCode(env, { code, channel: 'public' });
  // PRECONDITION, not decoration. The comparison below passes trivially
  // if both sides are the same error — and it did, on the first run,
  // because the field was read as `verificationCode` and both
  // verifications returned 'malformed'. A vacuous assertion about a
  // policy clause is worse than none: it reports the clause as enforced.
  check('Precondition: the award verifies before the portrait is touched',
    withPortrait.outcome === 'valid', withPortrait.outcome);

  await P.remove(env, { userId: 'usr_a', reason: 'At the graduate\'s request.' });
  const without = await reg.verifyCode(env, { code, channel: 'public' });

  // Compared field by field rather than "still valid": the policy says
  // the certificate is UNAFFECTED, and a verification that stayed valid
  // while quietly losing a field would still have broken it.
  const strip = (v) => JSON.stringify({ ...v, checkedAt: null, verificationId: null });
  check('A verification is unchanged by removing the portrait',
    strip(withPortrait) === strip(without),
    `${strip(withPortrait).slice(0, 90)}\n${strip(without).slice(0, 90)}`);
  check('...and still reports the award as valid', without.outcome === 'valid', without.outcome);
}

{
  // "Removed immediately if an award is withdrawn."
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_a', levelId: 3, holderName: 'A Graduate', ...AWARD });
  const b = await reg.conferAward(env, { userId: 'usr_b', levelId: 3, holderName: 'B Graduate', ...AWARD });
  for (const u of ['usr_a', 'usr_b']) {
    await prof.getOrCreateProfile(env, { userId: u });
    await P.submit(env, { userId: u, key: `${u}.jpg` });
    await P.approve(env, { userId: u, reviewedBy: 'usr_rev' });
  }
  await reg.revokeAward(env, { awardId: a.id, reason: 'Conferred in error.' });
  void b;

  const swept = await P.sweepWithdrawn(env);
  check('Withdrawing an award removes the portrait', swept.count === 1, JSON.stringify(swept));
  check('...for the right graduate only', swept.removed[0].userId === 'usr_a', JSON.stringify(swept.removed));
  check('...and the other graduate is untouched',
    (await P.current(env, { userId: 'usr_b' })).status === 'published');
  check('...with the reason recorded, not a bare deletion',
    /Executive Portrait Policy/.test((await P.current(env, { userId: 'usr_a' })).note || ''),
    (await P.current(env, { userId: 'usr_a' })).note);
}

{
  // A graduate holding two awards, one revoked, is still a graduate.
  // Sweeping them would apply the policy to somebody it does not
  // describe.
  const env = freshEnv();
  const lower = await reg.conferAward(env, { userId: 'usr_a', levelId: 2, holderName: 'A Graduate', ...AWARD });
  await reg.conferAward(env, { userId: 'usr_a', levelId: 4, holderName: 'A Graduate', ...AWARD });
  await prof.getOrCreateProfile(env, { userId: 'usr_a' });
  await P.submit(env, { userId: 'usr_a', key: 'k.jpg' });
  await P.approve(env, { userId: 'usr_a', reviewedBy: 'usr_rev' });
  await reg.revokeAward(env, { awardId: lower.id, reason: 'Conferred in error.' });

  const swept = await P.sweepWithdrawn(env);
  check('A graduate who still holds a live award keeps their portrait',
    swept.count === 0 && (await P.current(env, { userId: 'usr_a' })).status === 'published',
    JSON.stringify(swept));
}

// ======================================================================
// 2. ALUMNI CHAPTERS
// ======================================================================
{
  const env = freshEnv();
  const list = await A.chapters(env);
  check('Six chapters exist, one per award', list.length === 6, list.length);
  check('...named as the Executive named them',
    list.map((c) => c.name).join(', ')
      === 'Aspirant Chapter, Candidate Chapter, Associate Chapter, Envoy Chapter, Orator Chapter, Laureate Chapter',
    list.map((c) => c.name).join(', '));
  // No President was appointed by a migration.
  check('...and none has elected officers yet', list.every((c) => c.officersElected === false));
}

{
  const env = freshEnv();
  check('A graduate with no award belongs to no chapter',
    (await A.chapterFor(env, { userId: 'usr_a' })) === null);

  await reg.conferAward(env, { userId: 'usr_a', levelId: 3, holderName: 'A Graduate', ...AWARD });
  const one = await A.chapterFor(env, { userId: 'usr_a' });
  check('Conferral places a graduate in the matching chapter', one.name === 'Associate Chapter', one.name);
  check('...saying how, rather than asserting membership as a bare fact',
    /Automatic, by conferral/.test(one.basis), one.basis);

  await reg.conferAward(env, { userId: 'usr_a', levelId: 5, holderName: 'A Graduate', ...AWARD });
  const two = await A.chapterFor(env, { userId: 'usr_a' });
  check('A higher award moves them up, without membership being rewritten anywhere',
    two.name === 'Orator Chapter', two.name);
}

{
  // Membership is DERIVED. Revoking an award must move the graduate
  // with no second place needing to be updated — which is the whole
  // argument for not storing it.
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_a', levelId: 3, holderName: 'A Graduate', ...AWARD });
  const high = await reg.conferAward(env, { userId: 'usr_a', levelId: 5, holderName: 'A Graduate', ...AWARD });
  await reg.revokeAward(env, { awardId: high.id, reason: 'Conferred in error.' });

  const back = await A.chapterFor(env, { userId: 'usr_a' });
  check('Revoking the higher award returns them to the lower chapter',
    back.name === 'Associate Chapter', back && back.name);
}

{
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_a', levelId: 3, holderName: 'A Graduate', ...AWARD });
  await reg.conferAward(env, { userId: 'usr_a', levelId: 5, holderName: 'A Graduate', ...AWARD });
  await reg.conferAward(env, { userId: 'usr_b', levelId: 3, holderName: 'B Graduate', ...AWARD });

  const r = await A.roll(env);
  // usr_a holds two awards but belongs to ONE chapter. Summing the
  // per-level counts would report three members where there are two.
  check('The Society counts each graduate once, at their highest award',
    r.members === 2, r.members);
  const associate = r.chapters.find((c) => c.name === 'Associate Chapter');
  check('...so the Associate Chapter holds one member', associate.members === 1, associate.members);
  check('...while still reporting that two people hold that award',
    associate.awardHolders === 2, associate.awardHolders);
  const orator = r.chapters.find((c) => c.name === 'Orator Chapter');
  check('...and the Orator Chapter holds the other', orator.members === 1, orator.members);
  // A chapter with nobody in it is not hidden: the Society is new, and
  // showing only populated chapters would imply the rest do not exist.
  check('Empty chapters are still listed', r.chapters.length === 6);
  check('...reporting zero rather than being omitted',
    r.chapters.filter((c) => c.members === 0).length === 4);
  check('The Society says plainly that officers are elected, not appointed',
    /officers are\s+elected by members/.test(r.society.status), r.society.status);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
