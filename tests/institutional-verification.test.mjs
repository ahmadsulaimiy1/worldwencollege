// The Principle of Institutional Verification — three independent
// layers of trust.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   A withdrawn award must report identity VERIFIED, integrity
//   VERIFIED, and standing FAILED — at the same time.
//
// That combination is the whole reason the layers are separated, and it
// is the case every single-verdict verification system gets wrong. Call
// it invalid and an employer concludes the certificate is a forgery,
// which is a serious accusation about a real person who did the work.
// Call it valid and a university admits a candidate on a qualification
// the College has withdrawn.
//
// Everything else here is in service of that one sentence being true.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const V = await import(loadUrl('functions/_lib/registry/institutional-verification.js'));
const reg = await import(loadUrl('functions/_lib/registry/awards.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const AWARD = {
  awardTitle: 'Higher Certificate in Applied English Communication', postNominal: 'HCAEC',
  cefr: 'B2', credits: 20, tqtHours: 200,
};

function freshEnv() {
  const env = { DB: makeD1(schema) };
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_a','clerk','c_a','a@example.com','student')`).bind().run();
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_r','clerk','c_r','r@example.com','admin')`).bind().run();
  return env;
}
const state = (layer, id) => (layer.find((c) => c.id === id) || {}).state;

// --- A live award -----------------------------------------------------
{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_a', levelId: 4, holderName: 'A Graduate', ...AWARD });
  const r = await V.institutionalVerification(env, { code: a.verification_code });

  check('A live award is found', r.found === true, JSON.stringify(r).slice(0, 120));
  check('...answering in three named layers',
    !!r.layers.identity && !!r.layers.integrity && !!r.layers.standing);

  check('Identity: the holder is verified', state(r.layers.identity, 'holder') === 'verified');
  check('Identity: the Register entry is verified', state(r.layers.identity, 'register') === 'verified');
  check('Identity: the conferral date is verified', state(r.layers.identity, 'conferred') === 'verified');

  check('Integrity: the register chain is verified', state(r.layers.integrity, 'chain') === 'verified',
    JSON.stringify(r.layers.integrity.find((c) => c.id === 'chain')));
  check('Integrity: the verification code is verified', state(r.layers.integrity, 'code') === 'verified');

  check('Standing: the award is current', state(r.layers.standing, 'standing') === 'verified');
  check('...with the headline reading Verified', r.summary.headline === 'Verified', r.summary.headline);
}

// --- The signature is not allowed to overclaim ------------------------
{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_a', levelId: 4, holderName: 'A Graduate', ...AWARD });
  const r = await V.institutionalVerification(env, { code: a.verification_code });

  const sig = r.layers.integrity.find((c) => c.id === 'signature');
  // Executive decision P2.1: until a production KMS is provisioned, the
  // signing layer stays marked development mode and claims no
  // production-grade assurance. 'development' is its OWN state, not a
  // footnote under 'verified', because a verifier is entitled to weigh
  // the difference themselves.
  check('A development-mode signature is reported as development, not verified',
    sig.state === 'development', sig.state);
  check('...saying in words that it is not production-grade',
    /does not yet carry production-grade assurance/.test(sig.statement), sig.statement);
  check('...and naming the Register as the authoritative record',
    /Graduate Register\s+remains the authoritative record/.test(sig.statement), sig.statement);
  check('...counted separately from the verified checks',
    r.summary.counts.development === 1 && r.summary.counts.verified > 0,
    JSON.stringify(r.summary.counts));
}

{
  // A LEGACY award — conferred before the College signed anything.
  // conferAward() always signs now, so the signature is deleted to
  // reproduce the state those older records are genuinely in. Not a
  // failure: a fact about the credential, and it must never read as
  // tampering to somebody holding a real certificate.
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_a', levelId: 4, holderName: 'A Graduate', ...AWARD });
  env.DB.prepare("DELETE FROM credential_signatures WHERE subject_id = ?").bind(a.id).run();

  const r = await V.institutionalVerification(env, { code: a.verification_code });
  const sig = r.layers.integrity.find((c) => c.id === 'signature');
  check('An unsigned legacy award reports not_applicable, never failed',
    sig.state === 'not_applicable', sig.state);
  check('...and the credential is still verified overall',
    r.summary.headline === 'Verified', r.summary.headline);
}

// ======================================================================
// THE ASSERTION THIS FILE EXISTS FOR
// ======================================================================
{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_a', levelId: 4, holderName: 'A Graduate', ...AWARD });
  await reg.revokeAward(env, { awardId: a.id, reason: 'Conferred in error after a marking review.' });
  const r = await V.institutionalVerification(env, { code: a.verification_code });

  check('A WITHDRAWN award is still found, not hidden', r.found === true);
  // The three answers, disagreeing — which is the point.
  check('...identity still VERIFIED: this is the person the College awarded',
    r.layers.identity.every((c) => c.state === 'verified'),
    JSON.stringify(r.layers.identity.map((c) => c.state)));
  check('...integrity still intact: the certificate is not a forgery',
    state(r.layers.integrity, 'chain') === 'verified'
    && state(r.layers.integrity, 'code') === 'verified',
    JSON.stringify(r.layers.integrity.map((c) => `${c.id}:${c.state}`)));
  check('...but standing FAILED: the award confers nothing',
    state(r.layers.standing, 'standing') === 'failed',
    state(r.layers.standing, 'standing'));

  // Standing leads, no matter how many other checks passed. The
  // dangerous misreading is a withdrawn award with impeccable paperwork.
  check('The headline says Withdrawn, not a count of passes',
    r.summary.headline === 'Withdrawn', r.summary.headline);
  check('...and the summary tells the verifier what to do with that',
    /authentic but the award it records does not currently stand/.test(r.summary.statement),
    r.summary.statement);
  // The accusation this design exists to avoid making.
  check('The withdrawal is never described as the certificate being fake',
    /may be entirely genuine/.test(r.layers.standing[0].statement),
    r.layers.standing[0].statement);
}

{
  // A superseded award — genuine, correctly held, and not the one that
  // stands.
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_a', levelId: 4, holderName: 'A Gradaute', ...AWARD });
  await reg.replaceAward(env, { awardId: a.id, reason: 'Holder name corrected.',
    changes: { holderName: 'A Graduate' } });
  const r = await V.institutionalVerification(env, { code: a.verification_code });

  check('A SUPERSEDED award reports its standing as failed',
    state(r.layers.standing, 'standing') === 'failed', state(r.layers.standing, 'standing'));
  check('...headlined as Superseded, distinct from Withdrawn',
    r.summary.headline === 'Superseded', r.summary.headline);
  check('...while identity remains verified', r.layers.identity.every((c) => c.state === 'verified'));
  check('...and the reader is told the replacement is what stands',
    /replacement\s+is the credential that stands/.test(r.layers.standing[0].statement),
    r.layers.standing[0].statement);
}

// --- What the qualification means -------------------------------------
{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_a', levelId: 4, holderName: 'A Graduate', ...AWARD });
  const r = await V.institutionalVerification(env, { code: a.verification_code });

  check('The verification carries the award\'s official definition', !!r.definition);
  check('...its official title', r.definition.officialTitle === 'Higher Certificate in Applied English Communication',
    r.definition.officialTitle);
  check('...the standing it confers',
    r.definition.standing === 'A complete qualification in professional and academic English',
    r.definition.standing);
  // "can be sent" survives the framework change because it is the idea,
  // not the old name: the Professional Stage certifies someone who can
  // be sent to the meeting, the client, the interview. The word it used
  // to justify — Envoy — is gone; the standard it describes is not.
  check('...why the qualification is named as it is', /can be sent/.test(r.definition.academicPurpose),
    (r.definition.academicPurpose || '').slice(0, 80));
  // The verification is the page a stranger opens, so it must carry the
  // limit as well as the claim.
  check('...and the stage it sits at', r.definition.stage === 'Professional', r.definition.stage);
  check('...and that it is complete in itself, not a step to the next',
    /may stop here/i.test(r.definition.exitStatement || ''),
    (r.definition.exitStatement || '').slice(0, 60));
  check('...who the holder is', (r.definition.graduateProfile || '').length > 80);
  check('...and what they can do', (r.definition.learningOutcomes || '').length > 80);
}

// --- Nothing to verify ------------------------------------------------
{
  const env = freshEnv();
  // A well-formed code that was never issued. Answered as its own shape
  // — "not in the register" is a different statement from "this
  // credential failed our checks", and three layers of red would say
  // the second.
  let unused = reg.newVerificationCode();
  const r = await V.institutionalVerification(env, { code: unused });
  check('An unissued code is reported as not found, not as failed checks',
    r.found === false && r.outcome === 'not_found', JSON.stringify(r).slice(0, 100));
  check('...with no layers at all, rather than three layers of failure', r.layers === null);

  const bad = await V.institutionalVerification(env, { code: 'WEC-XXXX-XXXX-XXXXX' });
  check('A malformed code is distinguished from an unissued one',
    bad.found === false && bad.outcome === 'malformed', bad.outcome);
}

// --- A broken register is the College's fault, said so ----------------
{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_a', levelId: 4, holderName: 'A Graduate', ...AWARD });
  // Tamper with the register directly — the attack a document signature
  // cannot detect, and the reason the chain is checked at all.
  env.DB.prepare("UPDATE awards SET holder_name = 'Someone Else' WHERE id = ?").bind(a.id).run();

  const r = await V.institutionalVerification(env, { code: a.verification_code });
  const chain = r.layers.integrity.find((c) => c.id === 'chain');
  check('Tampering with the register itself breaks the chain check', chain.state === 'failed', chain.state);
  // The graduate did nothing wrong, and the page must not imply they did.
  check('...described as an institutional fault, not the holder\'s',
    /institutional\s+fault, not a fault in this credential/.test(chain.statement), chain.statement);
  check('...and the summary reports checks failed', r.summary.headline === 'Checks failed', r.summary.headline);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
