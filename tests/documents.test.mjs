// functions/_lib/registry/documents.js — issued documents and
// institutional verification.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   A transcript issued today must still verify after the graduate
//   completes more of the programme.
//
// An award is immutable; a transcript is a snapshot. If verification
// worked by regenerating the document from live data, every transcript
// would begin failing the moment its holder finished another module —
// and it would fail exactly the way a forgery fails, telling a
// university the document had been altered. That is the defect this
// design exists to prevent, and it is asserted directly below rather
// than argued for in a comment.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const D = await import(loadUrl('functions/_lib/registry/documents.js'));
const reg = await import(loadUrl('functions/_lib/registry/awards.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const T0 = Date.parse('2027-10-01T09:00:00.000Z');
const DAY = 86400000;

function freshEnv() {
  const env = { DB: makeD1(schema) };
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_grad','clerk','c_g','g@example.com','student')`).bind().run();
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_reg','clerk','c_r','r@example.com','admin')`).bind().run();
  env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at,completed_at)
    VALUES ('enr_1','usr_grad',1,'completed','2027-01-05T00:00:00.000Z','2027-05-01T00:00:00.000Z')`).bind().run();
  return env;
}

const AWARD = {
  levelId: 1, awardTitle: 'English Aspirant of WorldWide English College',
  postNominal: 'ApWEC', cefr: 'A1', credits: 20, tqtHours: 200,
  holderName: 'Demonstration Graduate',
};

// ---------------------------------------------------------------------
// A document is frozen at issue
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_grad', ...AWARD, now: T0 });

  const doc = await D.issueDocument(env, {
    documentType: 'transcript', userId: 'usr_grad', issuedBy: 'usr_reg', now: T0 + DAY,
  });
  check('A transcript is issued with its own verification code',
    /^WEC-/.test(doc.verificationCode), doc.verificationCode);
  check('...signed', !!doc.signature && !!doc.kid);
  check('...marked development while no KMS is provisioned', doc.mode === 'development');
  check('...recording one award and twenty credits',
    doc.payload.creditsAwarded === 20 && doc.payload.levelsAwarded === 1);

  const v1 = await D.verifyDocument(env, { code: doc.verificationCode, now: T0 + 2 * DAY });
  check('It verifies', v1.outcome === 'valid' && v1.signature.valid === true);

  // THE ASSERTION. The graduate progresses; the issued document must not
  // change its answer.
  env.DB.prepare(`INSERT INTO enrolments (id,user_id,level_id,status,started_at)
    VALUES ('enr_2','usr_grad',2,'active','2027-11-01T00:00:00.000Z')`).bind().run();
  await reg.conferAward(env, {
    userId: 'usr_grad', ...AWARD, levelId: 2,
    awardTitle: 'English Candidate of WorldWide English College', postNominal: 'CnWEC', cefr: 'A2',
    now: T0 + 300 * DAY,
  });

  const v2 = await D.verifyDocument(env, { code: doc.verificationCode, now: T0 + 400 * DAY });
  check('A transcript issued BEFORE further study still verifies afterwards',
    v2.signature.valid === true, JSON.stringify(v2.signature).slice(0, 90));
  check('...and still says what it said on the day it was issued',
    v2.document.creditsAwarded === 20 && v2.document.levelsAwarded === 1,
    `${v2.document.creditsAwarded} credits`);
  check('...rather than silently reflecting the newer record',
    v2.document.entries.length === 1, v2.document.entries.length);
}

// ---------------------------------------------------------------------
// Superseded is not invalid
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_grad', ...AWARD, now: T0 });
  const first = await D.issueDocument(env, { documentType: 'transcript', userId: 'usr_grad', now: T0 + DAY });
  const second = await D.issueDocument(env, { documentType: 'transcript', userId: 'usr_grad', now: T0 + 100 * DAY });
  check('Issuing a second transcript supersedes the first', second.supersededCount === 1);

  const old = await D.verifyDocument(env, { code: first.verificationCode, now: T0 + 101 * DAY });
  check('The superseded document is reported as superseded', old.outcome === 'superseded');
  // The distinction that keeps a university's answer honest. "Invalid"
  // would be false — the College really did issue it.
  check('...but its SIGNATURE is still sound, which is the question asked',
    old.signature.valid === true);
  check('...and the answer says it remains accurate as of its issue date',
    /accurate record of what the College asserted/i.test(old.message), old.message);
  check('...naming the newer document so the checker is not stranded',
    old.supersededBy && old.supersededBy.verificationCode === second.verificationCode);

  const current = await D.verifyDocument(env, { code: second.verificationCode, now: T0 + 101 * DAY });
  check('The newest document is the current one', current.outcome === 'valid');
}

// ---------------------------------------------------------------------
// Expiry and withdrawal say different things
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_grad', ...AWARD, now: T0 });
  const doc = await D.issueDocument(env, {
    documentType: 'transcript', userId: 'usr_grad', expiresDays: 180, now: T0 + DAY,
  });
  check('A validity window can be set', !!doc.id);

  const fresh = await D.verifyDocument(env, { code: doc.verificationCode, now: T0 + 10 * DAY });
  check('Inside the window it is current', fresh.outcome === 'valid');

  const stale = await D.verifyDocument(env, { code: doc.verificationCode, now: T0 + 400 * DAY });
  check('Past the window it is expired', stale.outcome === 'expired');
  // Expiry is a statement about currency, never about authenticity.
  check('...with the signature still sound', stale.signature.valid === true);
  check('...and the message saying it is no longer offered as current, not that it is fake',
    /no longer offered as a current statement/i.test(stale.message));

  const withdrawn = await D.issueDocument(env, { documentType: 'transcript', userId: 'usr_grad', now: T0 + 500 * DAY });
  await D.withdrawDocument(env, { documentId: withdrawn.id, reason: 'Issued against an award later withdrawn.', now: T0 + 501 * DAY });
  const w = await D.verifyDocument(env, { code: withdrawn.verificationCode, now: T0 + 502 * DAY });
  check('A withdrawn document says so', w.outcome === 'withdrawn');
  check('...telling the reader not to rely on it', /should not be relied upon/i.test(w.message));
  check('...with the reason recorded', /later withdrawn/i.test(w.withdrawnReason || ''));

  const noReason = await throws(() => D.withdrawDocument(env, { documentId: withdrawn.id, reason: '' }));
  check('Withdrawal without a reason is refused', noReason && noReason.name === 'ValidationError');
}

// ---------------------------------------------------------------------
// A tampered document fails
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_grad', ...AWARD, now: T0 });
  const doc = await D.issueDocument(env, { documentType: 'transcript', userId: 'usr_grad', now: T0 + DAY });

  // Somebody edits the frozen payload directly — 20 credits becomes 120.
  const payload = JSON.parse(env.DB.prepare('SELECT payload_json FROM issued_documents WHERE id = ?')
    .bind(doc.id).first().payload_json);
  payload.creditsAwarded = 120;
  env.DB.prepare('UPDATE issued_documents SET payload_json = ? WHERE id = ?')
    .bind(JSON.stringify(payload), doc.id).run();

  const v = await D.verifyDocument(env, { code: doc.verificationCode, now: T0 + 2 * DAY });
  check('Editing an issued document breaks its signature', v.signature.valid === false);
  check('...saying it was altered since it was issued',
    /altered since it was issued/i.test(v.signature.message || ''), v.signature.message);

  const nonsense = await D.verifyDocument(env, { code: 'not-a-code', now: T0 });
  check('A malformed code is refused cleanly', nonsense.outcome === 'malformed' && nonsense.document === null);
  // Generated rather than hand-written. A literal like WEC-AAAA-BBBB-CCCCC
  // does not survive the check character, so it comes back 'malformed'
  // and this assertion would silently stop testing "not found" at all —
  // which is what happened when the check character was strengthened.
  const missing = await D.verifyDocument(env, { code: reg.newVerificationCode(), now: T0 });
  check('A well-formed code for no document says so plainly',
    missing.outcome === 'not_found', missing.outcome);
}

// ---------------------------------------------------------------------
// The diploma supplement tells the truth about the College
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_grad', ...AWARD, now: T0 });
  const sup = await D.issueDocument(env, { documentType: 'diploma_supplement', userId: 'usr_grad', now: T0 + DAY });

  // A supplement is exactly where a registrar looks for this, and its
  // absence would be read as an answer.
  check('The supplement states the College is not accredited or affiliated',
    /not accredited by, or affiliated with, any external accreditation body/i.test(sup.payload.recognitionStatement));
  check('...and that the WEC Credit is an internal unit, not ECTS',
    /not ECTS/.test(sup.payload.creditModel) && /no equivalence/i.test(sup.payload.creditModel));
  // The competency state has to travel, or a supplement showing nothing
  // reads as a graduate who failed every competency.
  check('Competency attainment carries its state, not a bare empty list',
    sup.payload.competencies.state === 'unmapped' && /not yet mapped/i.test(sup.payload.competencies.note));
}

// ---------------------------------------------------------------------
// A document names a person of record
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  // No award, no recorded name — a document cannot be issued.
  const noName = await throws(() => D.issueDocument(env, { documentType: 'transcript', userId: 'usr_grad', now: T0 }));
  check('A document cannot be issued for someone with no name of record',
    noName && noName.name === 'ValidationError', noName && noName.message.slice(0, 60));

  await reg.conferAward(env, { userId: 'usr_grad', ...AWARD, now: T0 });
  // The profile name is editable by the graduate; the award name is the
  // College's record. An issued document must not be editable by its
  // subject.
  const P = await import(loadUrl('functions/_lib/registry/profile.js'));
  await P.updateProfile(env, { userId: 'usr_grad', changes: { displayName: 'Someone Else Entirely' } });
  const doc = await D.issueDocument(env, { documentType: 'transcript', userId: 'usr_grad', now: T0 + DAY });
  check('The document names the holder as the AWARD records them, not as the profile says',
    doc.payload.holderName === 'Demonstration Graduate', doc.payload.holderName);

  const ghost = await throws(() => D.issueDocument(env, { documentType: 'transcript', userId: 'usr_nobody' }));
  check('A document cannot be issued for somebody who does not exist', ghost && ghost.name === 'NotFoundError');
  const badType = await throws(() => D.issueDocument(env, { documentType: 'passport', userId: 'usr_grad' }));
  check('An unknown document type is refused', badType && badType.name === 'ValidationError');
}

// ---------------------------------------------------------------------
// Institutional verification: identified, bounded, recorded
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_grad', ...AWARD, now: T0 });

  const inst = await D.registerInstitution(env, {
    name: 'A Demonstration University', kind: 'university',
    dailyLimit: 3, approvedBy: 'usr_reg', now: T0,
  });
  check('An institution is registered with a key', /^wecv_/.test(inst.apiKey));
  // A leaked table of live keys would be a leaked ability to read the
  // register at scale under someone else's name.
  const stored = env.DB.prepare('SELECT api_key_hash FROM verifying_institutions WHERE id = ?').bind(inst.id).first();
  check('...stored only as a hash', stored.api_key_hash !== inst.apiKey && stored.api_key_hash.length === 64);

  const ok = await D.institutionalVerify(env, { apiKey: inst.apiKey, code: a.verification_code, now: T0 + 1000 });
  check('An institution can verify an award code', ok.ok === true && ok.outcome === 'valid');
  check('...and is told which kind of thing it checked', ok.kind === 'award');
  check('...with its remaining quota', ok.quota.limit === 3 && ok.quota.used === 1);

  const doc = await D.issueDocument(env, { documentType: 'transcript', userId: 'usr_grad', now: T0 + 2000 });
  const okDoc = await D.institutionalVerify(env, { apiKey: inst.apiKey, code: doc.verificationCode, now: T0 + 3000 });
  // A checker types whichever code they were given and should not have
  // to know which kind it is.
  check('The same endpoint resolves a DOCUMENT code without being told which it is',
    okDoc.ok === true && okDoc.kind === 'document' && okDoc.outcome === 'valid');

  // The lookup selects the whole row, including the key hash. Asserted
  // against the RESPONSE rather than trusting that the hash is never
  // spread into it by some future refactor.
  check('No part of the institution\'s credential reaches the response',
    !JSON.stringify(ok).includes(stored.api_key_hash) && !JSON.stringify(ok).includes(inst.apiKey),
    Object.keys(ok.institution).join(','));

  const bad = await D.institutionalVerify(env, { apiKey: 'wecv_wrong', code: a.verification_code, now: T0 + 4000 });
  check('An unknown key is refused', bad.ok === false && bad.reason === 'unauthorised');

  // The limit is what turns "somebody is enumerating the register" from
  // an unbounded harvest into a bounded one visible the next morning.
  await D.institutionalVerify(env, { apiKey: inst.apiKey, code: a.verification_code, now: T0 + 5000 });
  const over = await D.institutionalVerify(env, { apiKey: inst.apiKey, code: a.verification_code, now: T0 + 6000 });
  check('The daily limit is enforced', over.ok === false && over.reason === 'rate_limited', JSON.stringify(over).slice(0, 80));
  check('...explaining why the limit exists rather than only that it was hit',
    /bounded and visible/i.test(over.message));
  check('A refused request does not consume quota it was denied',
    (await D.institutionActivity(env, { institutionId: inst.id })).count === 3);

  const later = await D.institutionalVerify(env, { apiKey: inst.apiKey, code: a.verification_code, now: T0 + 2 * DAY });
  check('The window rolls, so a day later the institution can check again', later.ok === true);

  const activity = await D.institutionActivity(env, {});
  check('Every institutional check is attributed', activity.checks[0].institutionName === 'A Demonstration University');
  check('...unlike the public portal, which records nobody',
    env.DB.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('award_verifications') WHERE name IN ('ip','user_agent','institution_id')")
      .bind().first().n === 0);

  env.DB.prepare("UPDATE verifying_institutions SET status='suspended', suspended_reason='Excessive automated querying.' WHERE id = ?")
    .bind(inst.id).run();
  const suspended = await D.institutionalVerify(env, { apiKey: inst.apiKey, code: a.verification_code, now: T0 + 3 * DAY });
  check('A suspended institution cannot verify', suspended.ok === false);
  check('...and is told the same thing as an unknown key, not that it was singled out',
    suspended.message === bad.message, suspended.message);
}

// ---------------------------------------------------------------------
// A graduate's own document list
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_grad', ...AWARD, now: T0 });
  await D.issueDocument(env, { documentType: 'transcript', userId: 'usr_grad', now: T0 + DAY });
  await D.issueDocument(env, { documentType: 'diploma_supplement', userId: 'usr_grad', now: T0 + 2 * DAY });

  const mine = await D.myDocuments(env, { userId: 'usr_grad' });
  check('A graduate can see what they have issued', mine.count === 2);
  check('...newest first', mine.documents[0].documentType === 'diploma_supplement');
  // A listing answers "what have I issued"; fetching one is a separate
  // act, and putting signatures in a list is how they end up in a log.
  check('...without the payload or the signature in the listing',
    !('payload' in mine.documents[0]) && !('signature' in mine.documents[0]),
    Object.keys(mine.documents[0]).join(','));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
