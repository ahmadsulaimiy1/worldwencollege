// functions/_lib/registry/signing.js — cryptographic trust for issued
// credentials. Executive Decision P2.1 (ADOPTED).
//
// A signing layer fails in ways that are silent for years. A signature
// nothing can verify, a rotation that invalidates every certificate ever
// issued, a "development" signature quietly presented as proof of
// origin — none of those announce themselves, and all of them surface in
// somebody else's hands, long after the people who built it have gone.
//
// So the assertions here are attacks and adverse conditions, not a happy
// path: alter the claims, forge with the wrong key, rotate mid-life,
// revoke, and check that verification never once needs private material.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const S = await import(loadUrl('functions/_lib/registry/signing.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const T0 = Date.parse('2027-09-01T10:00:00.000Z');

function freshEnv() {
  const env = { DB: makeD1(schema) };
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_reg','clerk','c_reg','registrar@example.com','admin')`).bind().run();
  return env;
}

const CLAIMS = {
  holderName: 'Demonstration Graduate',
  awardTitle: 'English Associate of Albalagh International Premium College',
  honour: 'distinction', credits: 20, tqtHours: 200, conferredOn: '2027-09-01',
};

// ---------------------------------------------------------------------
// Canonicalisation — the bytes that actually get signed
// ---------------------------------------------------------------------
{
  // A signature over JSON.stringify() is a signature over whichever key
  // order the object happened to have. The same credential would then
  // verify on one code path and fail on another, and the failure would
  // look exactly like tampering.
  const a = S.canonicalPayload('award', 'awd_1', { b: 2, a: 1, nested: { z: 1, y: 2 } });
  const b = S.canonicalPayload('award', 'awd_1', { nested: { y: 2, z: 1 }, a: 1, b: 2 });
  check('The same claims in a different key order produce identical bytes', a === b, a);

  check('Different claims produce different bytes',
    S.canonicalPayload('award', 'awd_1', { a: 1 }) !== S.canonicalPayload('award', 'awd_1', { a: 2 }));
  // Without the subject in the payload, a signature over an award could
  // be lifted onto a transcript with the same fields.
  check('The subject type is inside the signed bytes, so a signature cannot be moved between documents',
    S.canonicalPayload('award', 'x', { a: 1 }) !== S.canonicalPayload('transcript', 'x', { a: 1 }));
  check('...as is the subject id, so it cannot be moved between graduates',
    S.canonicalPayload('award', 'x', { a: 1 }) !== S.canonicalPayload('award', 'y', { a: 1 }));
  check('The canonicalisation carries a version, so a future change is not read as tampering',
    /^AIPC-CRED-v1/.test(a));
  check('Null and absent are canonicalised the same way',
    S.canonicalPayload('award', 'x', { a: null }) === S.canonicalPayload('award', 'x', { a: undefined }));
}

// ---------------------------------------------------------------------
// Signing, and saying what kind of signature it is
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const sig = await S.signCredential(env, {
    subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, actorId: 'usr_reg', now: T0,
  });
  check('A credential is signed', typeof sig.signature === 'string' && sig.signature.length > 40);
  check('...naming the key that signed it', /^aipc-\d{8}-/.test(sig.kid), sig.kid);
  check('...and the algorithm', sig.algorithm === 'ES256');

  // The assertion this whole module exists to keep honest.
  check('With no KMS provisioned, the signature is marked DEVELOPMENT',
    sig.mode === 'development', sig.mode);
  check('...and says plainly that it does not prove College origin',
    /does NOT prove the College signed it/i.test(sig.assurance), sig.assurance.slice(0, 80));

  const key = env.DB.prepare("SELECT * FROM signing_keys WHERE status = 'active'").bind().first();
  check('A development key is generated on first use rather than failing',
    !!key && key.backend === 'development');
  check('...and there is exactly one active key',
    env.DB.prepare("SELECT COUNT(*) AS n FROM signing_keys WHERE status='active'").bind().first().n === 1);

  const audit = env.DB.prepare('SELECT * FROM credential_signatures').bind().all().results;
  check('Every signing operation leaves a record', audit.length === 1);
  check('...naming what was signed, with which key, when and by whom',
    audit[0].subject_type === 'award' && audit[0].subject_id === 'awd_1'
    && audit[0].kid === sig.kid && audit[0].signed_by === 'usr_reg' && !!audit[0].signed_at);
  check('...recording the mode on the record, not inferring it later',
    audit[0].mode === 'development');
  // Storing the payload would create a second copy that can disagree
  // with the record it describes.
  check('...storing a digest rather than a second copy of the payload',
    audit[0].payload_digest.length === 64 && !('payload' in audit[0]));

  const badType = await throws(() => S.signCredential(env, { subjectType: 'invoice', subjectId: 'x', claims: {} }));
  check('An unknown credential type is refused', badType && badType.name === 'ValidationError');
  const noSubject = await throws(() => S.signCredential(env, { subjectType: 'award', subjectId: '', claims: {} }));
  check('A credential that identifies nothing is refused', noSubject && noSubject.name === 'ValidationError');
}

// ---------------------------------------------------------------------
// Verification, and the attacks it has to survive
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const sig = await S.signCredential(env, { subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, now: T0 });

  const good = await S.verifyCredential(env, {
    subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, signature: sig.signature, kid: sig.kid,
  });
  check('An intact credential verifies', good.valid === true, JSON.stringify(good).slice(0, 90));
  check('...and still says it is a development signature', good.mode === 'development');
  check('...rather than reporting bare success a reader would over-trust',
    /not proof of College origin/i.test(good.assurance));

  // Upgrading a Merit to a Distinction is the fraud this exists to stop.
  const tampered = await S.verifyCredential(env, {
    subjectType: 'award', subjectId: 'awd_1',
    claims: { ...CLAIMS, honour: 'college_distinction' }, signature: sig.signature, kid: sig.kid,
  });
  check('Altering a single claim breaks the signature', tampered.valid === false);
  check('...and says the credential was altered or not issued by the College',
    /altered since it was issued/i.test(tampered.message), tampered.message);

  const moved = await S.verifyCredential(env, {
    subjectType: 'award', subjectId: 'awd_OTHER', claims: CLAIMS, signature: sig.signature, kid: sig.kid,
  });
  check('A signature cannot be lifted onto another award', moved.valid === false);

  const wrongDoc = await S.verifyCredential(env, {
    subjectType: 'transcript', subjectId: 'awd_1', claims: CLAIMS, signature: sig.signature, kid: sig.kid,
  });
  check('...nor onto a different kind of document', wrongDoc.valid === false);

  const unknown = await S.verifyCredential(env, {
    subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, signature: sig.signature, kid: 'aipc-19700101-deadbeef',
  });
  check('A credential citing a key the College never published is refused',
    unknown.valid === false && unknown.reason === 'unknown_key');

  const garbage = await S.verifyCredential(env, {
    subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, signature: 'not-a-signature', kid: sig.kid,
  });
  check('A malformed signature is refused without throwing', garbage.valid === false);
}

// ---------------------------------------------------------------------
// Verification uses the PUBLIC key. Asserted, not intended.
// ---------------------------------------------------------------------
// This is the property that lets an employer, a university or a
// government run the same check in their own systems. If verification
// ever needed the private half, the College would be the only party able
// to verify its own credentials — which is not verification.
{
  const env = freshEnv();
  const sig = await S.signCredential(env, { subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, now: T0 });

  // Destroy the private material entirely, then verify.
  env.DB.prepare('UPDATE signing_keys SET dev_private_jwk = NULL').bind().run();
  const stillWorks = await S.verifyCredential(env, {
    subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, signature: sig.signature, kid: sig.kid,
  });
  check('Verification works with the private key erased from the database',
    stillWorks.valid === true, JSON.stringify(stillWorks).slice(0, 80));

  const cannotSign = await throws(() => S.signCredential(env, {
    subjectType: 'award', subjectId: 'awd_2', claims: CLAIMS, now: T0,
  }));
  check('...while signing with that key is no longer possible', !!cannotSign);
}

// ---------------------------------------------------------------------
// Rotation must never invalidate what was already issued
// ---------------------------------------------------------------------
// The requirement that makes keys rows rather than a single value. A
// rotation that broke old credentials would, in one operation, void
// every certificate the College had ever issued.
{
  const env = freshEnv();
  const first = await S.signCredential(env, { subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, now: T0 });

  const rot = await S.rotateKey(env, { now: T0 + 86400000 });
  check('Rotation activates a new key', !!rot.kid && rot.kid !== first.kid);
  check('...and names the one it replaced', rot.previousKid === first.kid);
  check('...leaving exactly one key active',
    env.DB.prepare("SELECT COUNT(*) AS n FROM signing_keys WHERE status='active'").bind().first().n === 1);
  check('...with the old key retired, not deleted',
    env.DB.prepare('SELECT status FROM signing_keys WHERE kid = ?').bind(first.kid).first().status === 'retired');

  // THE assertion.
  const old = await S.verifyCredential(env, {
    subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, signature: first.signature, kid: first.kid,
  });
  check('A credential signed before rotation still verifies afterwards', old.valid === true);
  check('...and reports the key as retired rather than pretending it is current',
    old.keyStatus === 'retired', old.keyStatus);

  const second = await S.signCredential(env, { subjectType: 'award', subjectId: 'awd_2', claims: CLAIMS, now: T0 + 90000000 });
  check('New credentials are signed with the new key', second.kid === rot.kid);
  check('...and the old signature does not verify against the new key',
    (await S.verifyCredential(env, {
      subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, signature: first.signature, kid: rot.kid,
    })).valid === false);

  const jwks = await S.publicJwks(env);
  check('Both keys stay published, so both eras of credential remain checkable',
    jwks.keys.length === 2 && jwks.keys.some((k) => k.kid === first.kid));

  // Found by sabotage: rewriting rotation to DELETE the old key does not
  // produce a wrong answer — it produces a foreign-key violation. The
  // reference from credential_signatures.kid makes "a rotation that
  // invalidates every credential ever issued" impossible at the database
  // level, not merely absent from the code. Asserted here so a future
  // schema change that drops the reference is caught by a test rather
  // than by a graduate.
  const cannotDelete = await throws(() =>
    env.DB.prepare('DELETE FROM signing_keys WHERE kid = ?').bind(first.kid).run());
  check('A key that has signed something cannot be deleted at all',
    !!cannotDelete && /FOREIGN KEY/i.test(cannotDelete.message),
    cannotDelete && cannotDelete.message.slice(0, 50));
}

// ---------------------------------------------------------------------
// Revocation is not retirement
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const sig = await S.signCredential(env, { subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, now: T0 });

  const noReason = await throws(() => S.revokeKey(env, { kid: sig.kid, reason: 'oops' }));
  check('Revoking a key without a real reason is refused', noReason && noReason.name === 'ValidationError');

  const rev = await S.revokeKey(env, {
    kid: sig.kid, reason: 'Private key material was exposed in a misconfigured backup.', now: T0 + 3600000,
  });
  check('A revoked key reports how many credentials it signed', rev.credentialsAffected === 1);
  // Revoking the active key would otherwise leave the College unable to
  // confer anything — a state to discover at a graduation ceremony.
  check('...and the College is left with a working key', !!rev.replacementKid);
  check('...which is active', env.DB.prepare('SELECT status FROM signing_keys WHERE kid = ?')
    .bind(rev.replacementKid).first().status === 'active');

  const after = await S.verifyCredential(env, {
    subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, signature: sig.signature, kid: sig.kid,
  });
  // The distinction that matters: retirement says nothing about the
  // credentials a key signed; revocation says they can no longer be
  // relied upon.
  check('A credential signed by a REVOKED key no longer verifies', after.valid === false);
  check('...for the stated reason that the key was revoked', after.reason === 'revoked_key');
  check('...telling the holder what to do about it', /re-issued/i.test(after.message), after.message);
  check('...and carrying the reason it was revoked', /misconfigured backup/i.test(after.revokedReason || ''));

  const jwks = await S.publicJwks(env);
  const revoked = jwks.keys.find((k) => k.kid === sig.kid);
  check('The revoked key stays in the published set, marked revoked',
    revoked && revoked.aipc_status === 'revoked');
  check('...so an outside verifier learns why rather than only that it failed',
    /misconfigured backup/i.test(revoked.aipc_revoked_reason || ''));
}

// ---------------------------------------------------------------------
// The published key set says what kind of trust it offers
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await S.signCredential(env, { subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, now: T0 });
  const jwks = await S.publicJwks(env);

  // The whole point of publishing: verification without asking us.
  const k = jwks.keys[0];
  check('Every published key carries the fields a verifier needs',
    k.kty === 'EC' && k.crv === 'P-256' && !!k.x && !!k.y && k.alg === 'ES256' && k.use === 'sig');
  // The one that would be a disaster.
  check('NO private component is ever published',
    !('d' in k), Object.keys(k).join(','));
  check('...for any key in the set', jwks.keys.every((key) => !('d' in key)));
  // Checked against the raw response rather than by inspecting known
  // field names: `d` is the EC private scalar, but a future algorithm
  // brings its own private members, and a denylist only catches the ones
  // somebody thought of.
  const PRIVATE_MEMBERS = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'k'];
  check('...and no private JWK member of any algorithm appears',
    jwks.keys.every((key) => PRIVATE_MEMBERS.every((m) => !(m in key))),
    JSON.stringify(Object.keys(jwks.keys[0])));
  check('...nor does the raw stored private material appear anywhere in the response',
    !JSON.stringify(jwks).includes(
      JSON.parse(env.DB.prepare('SELECT dev_private_jwk FROM signing_keys LIMIT 1').bind().first().dev_private_jwk).d));

  check('The set declares the College is signing in development mode', jwks.mode === 'development');
  check('...with a notice explaining what that does and does not prove',
    /do not prove College origin/i.test(jwks.notice || ''), (jwks.notice || '').slice(0, 80));
}

// ---------------------------------------------------------------------
// A KMS key is refused rather than faked
// ---------------------------------------------------------------------
// A stub returning a plausible-looking signature would let a KMS-backed
// deployment appear to work while producing signatures nothing can
// verify — surfacing years later, in an employer's verification request.
{
  const env = freshEnv();
  const notImpl = await throws(() => S.rotateKey(env, { backend: 'kms', kmsKeyRef: 'projects/x/keys/y' }));
  check('Registering a KMS key is refused while the KMS client is unimplemented',
    notImpl && /not implemented/i.test(notImpl.message));
  check('...explaining that an unusable key would stop every conferral',
    /stop every conferral/i.test(notImpl.message), notImpl.message.slice(0, 100));
  const noRef = await throws(() => S.rotateKey(env, { backend: 'kms' }));
  check('A KMS key with no reference is refused', noRef && noRef.name === 'ValidationError');

  // The rule the SCHEMA enforces, independent of any code path.
  const leak = await throws(() => env.DB.prepare(
    `INSERT INTO signing_keys (kid, backend, algorithm, public_jwk, dev_private_jwk, kms_key_ref, status)
     VALUES ('k2','kms','ES256','{}','{"d":"private"}','ref','retired')`).bind().run());
  check('The database itself refuses to hold private material for a KMS key',
    !!leak && /CHECK/i.test(leak.message), leak && leak.message.slice(0, 60));
}

// ---------------------------------------------------------------------
// The audit answer
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const a = await S.signCredential(env, { subjectType: 'award', subjectId: 'awd_1', claims: CLAIMS, now: T0 });
  await S.signCredential(env, { subjectType: 'transcript', subjectId: 'usr_1', claims: { x: 1 }, now: T0 + 1000 });

  const all = await S.signingHistory(env, {});
  check('The audit lists every signature', all.count === 2);
  check('...newest first', all.signatures[0].subjectType === 'transcript');
  check('...and can be narrowed to one document', (await S.signingHistory(env, { subjectType: 'award' })).count === 1);
  check('...or to one key', (await S.signingHistory(env, { kid: a.kid })).count === 2);
  // An audit reader needs to know WHAT was signed and WHEN. Handing out
  // signature bytes serves no audit purpose and puts them in a log.
  check('The audit does not hand back the signatures themselves',
    !('signature' in all.signatures[0]), Object.keys(all.signatures[0]).join(','));
  check('The page size is capped regardless of what the caller asks for',
    (await S.signingHistory(env, { limit: 100000 })).signatures.length <= 500);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
