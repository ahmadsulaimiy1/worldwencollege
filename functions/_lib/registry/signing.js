/* Cryptographic trust for issued credentials.
 *
 * Executive Decision P2.1 (ADOPTED): the College operates a public-key
 * infrastructure. Everything it issues is signed; the private key lives
 * in a KMS or HSM, never in code and never in an ordinary environment
 * variable; verification needs only the public key; rotation must never
 * invalidate a credential already issued; and every signing operation
 * leaves an immutable record.
 *
 * ────────────────────────────────────────────────────────────────
 * THE HONEST STATE OF THIS, TODAY
 * ────────────────────────────────────────────────────────────────
 * No KMS is provisioned. So the College signs in DEVELOPMENT MODE with a
 * key this platform generated and holds, and every signature it produces
 * says `mode: "development"` — in the credential, in the audit record,
 * in the JWKS and on the verification page.
 *
 * That word is doing real work and must not be softened. A development
 * signature proves the credential has not been altered since it was
 * signed. It does NOT prove the College signed it, because anyone with
 * database access could sign an identical one. Presenting it as
 * production assurance would be worse than not signing at all: an
 * unsigned certificate invites scrutiny, and a certificate that looks
 * cryptographically endorsed but is not deflects it.
 *
 * The distinction is carried on each SIGNATURE RECORD rather than read
 * from the key at verification time. A credential signed in development
 * must still say so in twenty years, even if that key id has since been
 * re-registered against a real KMS.
 *
 * ────────────────────────────────────────────────────────────────
 * WHY THE BACKEND IS AN INTERFACE FROM DAY ONE
 * ────────────────────────────────────────────────────────────────
 * Every caller goes through `signCredential()` and never touches key
 * material. Provisioning a KMS is then a new row and one implementation
 * of `signWithKms()` — not a rewrite of everything that issues a
 * document. Retrofitting that boundary later is the migration nobody
 * ever finds time for, which is how institutions end up with a signing
 * key pasted into a deployment dashboard.
 */
import { db, ValidationError, NotFoundError } from '../db.js';

export const ALGORITHM = 'ES256';
const EC_PARAMS = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_PARAMS = { name: 'ECDSA', hash: 'SHA-256' };

export const SUBJECT_TYPES = ['award', 'transcript', 'diploma_supplement', 'verification', 'profile'];

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function fromB64url(text) {
  const s = String(text).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The exact bytes that get signed.
 *
 * A signature over `JSON.stringify(payload)` would be a signature over
 * whichever key order the object happened to have, so the same
 * credential could verify on one code path and fail on another. Keys are
 * sorted and the structure is walked explicitly.
 *
 * Versioned in the prefix. When this ever changes, credentials signed
 * under v1 must keep verifying under v1 — a canonicalisation change is
 * indistinguishable from tampering unless the version travels with the
 * signature.
 */
export function canonicalPayload(subjectType, subjectId, claims) {
  const walk = (v) => {
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) return v.map(walk);
    if (typeof v === 'object') {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = walk(v[k]);
      return out;
    }
    return v;
  };
  return `WEC-CRED-v1␟${subjectType}␟${subjectId}␟${JSON.stringify(walk(claims))}`;
}

function newKid(now) {
  // Readable and sortable: an operator reading an audit log should be
  // able to tell which key era a signature belongs to without a lookup.
  const stamp = new Date(now).toISOString().slice(0, 10).replace(/-/g, '');
  const rand = [...crypto.getRandomValues(new Uint8Array(4))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  return `wec-${stamp}-${rand}`;
}

/**
 * The key that signs today.
 *
 * Generates a development key on first use rather than failing. The
 * alternative — refusing to sign until somebody provisions a KMS — would
 * mean the whole credential path stayed untested until the day it went
 * live, and a signing layer first exercised in production is a signing
 * layer discovered in production.
 */
export async function activeKey(env, { now = Date.now(), create = true } = {}) {
  const row = await db(env).prepare("SELECT * FROM signing_keys WHERE status = 'active'").first();
  if (row) return row;
  if (!create) throw new NotFoundError('The College has no active signing key.');

  const pair = await crypto.subtle.generateKey(EC_PARAMS, true, ['sign', 'verify']);
  const kid = newKid(now);
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const at = new Date(now).toISOString();

  await db(env)
    .prepare(`INSERT INTO signing_keys (kid, backend, algorithm, public_jwk, dev_private_jwk, status, created_at, activated_at)
              VALUES (?, 'development', ?, ?, ?, 'active', ?, ?)`)
    .bind(kid, ALGORITHM,
      JSON.stringify({ ...pub, kid, alg: ALGORITHM, use: 'sig' }),
      JSON.stringify({ ...priv, kid, alg: ALGORITHM }), at, at)
    .run();

  return db(env).prepare('SELECT * FROM signing_keys WHERE kid = ?').bind(kid).first();
}

async function signBytes(key, message) {
  if (key.backend === 'kms') {
    // Deliberately unimplemented rather than stubbed. A stub that
    // returned a plausible-looking signature would let a KMS-backed
    // deployment appear to work while producing signatures nothing can
    // verify — and the failure would surface years later, in a
    // verification request from an employer.
    throw new ValidationError(
      `Signing key ${key.kid} is registered against a KMS, and the KMS signing client is not implemented. `
      + 'No credential will be signed with a key this platform cannot actually use.',
      { backend: 'Not implemented' },
    );
  }
  const jwk = JSON.parse(key.dev_private_jwk);
  const priv = await crypto.subtle.importKey('jwk', jwk, EC_PARAMS, false, ['sign']);
  const sig = await crypto.subtle.sign(SIGN_PARAMS, priv, new TextEncoder().encode(message));
  return b64url(sig);
}

/**
 * Sign a credential, and record that it was signed.
 *
 * The audit row is written in the same call as the signature, so there
 * is no path that produces one without the other.
 */
export async function signCredential(env, { subjectType, subjectId, claims, actorId = null, now = Date.now() }) {
  if (!SUBJECT_TYPES.includes(subjectType)) {
    throw new ValidationError(`Unknown credential type: ${subjectType}.`, { subjectType: 'Invalid' });
  }
  if (!subjectId) throw new ValidationError('A credential must identify what it is about.', { subjectId: 'Required' });

  const key = await activeKey(env, { now });
  const payload = canonicalPayload(subjectType, subjectId, claims);
  const signature = await signBytes(key, payload);
  const mode = key.backend === 'development' ? 'development' : 'production';

  await db(env)
    .prepare(`INSERT INTO credential_signatures (id, kid, subject_type, subject_id, payload_digest, signature, mode, signed_by, signed_at)
              VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(`sig_${crypto.randomUUID()}`, key.kid, subjectType, subjectId,
      await sha256Hex(payload), signature, mode, actorId, new Date(now).toISOString())
    .run();

  return {
    kid: key.kid,
    algorithm: key.algorithm,
    signature,
    mode,
    signedAt: new Date(now).toISOString(),
    // Said on the credential itself, not only in documentation. Whoever
    // reads this object is deciding how much to trust it.
    assurance: mode === 'development'
      ? 'Development signature. It proves this credential has not been altered since signing. It does NOT prove the College signed it, because no production key management is in place yet.'
      : 'Signed with the College\'s production signing key, held in a key management service.',
  };
}

/**
 * Verify a credential using the PUBLIC key only.
 *
 * No branch here reads `dev_private_jwk`. That is the property that lets
 * the same function run inside a third party's systems, and it is
 * asserted in the tests rather than left as an intention.
 */
export async function verifyCredential(env, { subjectType, subjectId, claims, signature, kid, now = Date.now() }) {
  const key = await db(env).prepare('SELECT * FROM signing_keys WHERE kid = ?').bind(kid).first();
  if (!key) {
    return { valid: false, reason: 'unknown_key', message: 'This credential cites a signing key the College does not publish.' };
  }
  if (key.status === 'revoked') {
    // A retired key still verifies; a revoked one does not. Retirement
    // is the ordinary end of a key's life and says nothing about the
    // credentials it signed. Revocation says the key may be in someone
    // else's hands, which makes every signature it ever made
    // unreliable — including ones made before anybody noticed.
    return {
      valid: false, reason: 'revoked_key', keyStatus: 'revoked',
      message: 'The key that signed this credential has been revoked. Its signatures can no longer be relied upon. Contact the College to have the credential re-issued.',
      revokedReason: key.revoked_reason,
    };
  }

  const pub = await crypto.subtle.importKey('jwk', JSON.parse(key.public_jwk), EC_PARAMS, false, ['verify']);
  const payload = canonicalPayload(subjectType, subjectId, claims);
  const ok = await crypto.subtle.verify(
    SIGN_PARAMS, pub, fromB64url(signature), new TextEncoder().encode(payload),
  );
  if (!ok) {
    return { valid: false, reason: 'signature_mismatch', message: 'This credential does not match its signature. It has been altered since it was issued, or it was not issued by the College.' };
  }

  // Read from the RECORD, not from the key's present backend. A key
  // re-registered against a KMS does not retrospectively make its old
  // development signatures production-grade.
  const record = await db(env)
    .prepare('SELECT mode, signed_at FROM credential_signatures WHERE kid = ? AND subject_type = ? AND subject_id = ? AND signature = ?')
    .bind(kid, subjectType, subjectId, signature).first();
  const mode = record ? record.mode : (key.backend === 'development' ? 'development' : 'production');

  return {
    valid: true,
    mode,
    keyStatus: key.status,
    kid,
    algorithm: key.algorithm,
    signedAt: record ? record.signed_at : null,
    // A valid development signature is still a development signature,
    // and the answer says so in the same breath as "valid".
    assurance: mode === 'development'
      ? 'Development signature: intact, but not proof of College origin. No production key management is in place yet.'
      : 'Verified against the College\'s published production signing key.',
  };
}

/**
 * The public key set — every key, active and retired.
 *
 * Retired keys stay published forever. A certificate signed in 2027 must
 * verify in 2047 against the key that signed it, and dropping retired
 * keys from the JWKS would silently invalidate every credential the
 * College had ever issued at the moment it rotated.
 */
export async function publicJwks(env) {
  const { results } = await db(env)
    .prepare('SELECT kid, algorithm, public_jwk, backend, status, created_at, activated_at, retired_at, revoked_reason FROM signing_keys ORDER BY created_at ASC')
    .all();
  return {
    keys: results.map((k) => ({
      ...JSON.parse(k.public_jwk),
      kid: k.kid, alg: k.algorithm, use: 'sig', key_ops: ['verify'],
      // Non-standard members, and deliberately present. A verifier
      // needs to know a key is revoked, and standards-purity that
      // withholds that is not a service to anybody.
      wec_status: k.status,
      wec_mode: k.backend === 'development' ? 'development' : 'production',
      wec_activated_at: k.activated_at,
      wec_retired_at: k.retired_at,
      wec_revoked_reason: k.revoked_reason,
    })),
    mode: results.some((k) => k.status === 'active' && k.backend === 'development') ? 'development' : 'production',
    notice: results.some((k) => k.status === 'active' && k.backend === 'development')
      ? 'The College is signing in DEVELOPMENT MODE. Signatures prove a credential is unaltered since signing; they do not prove College origin, because no production key management service is provisioned. This notice will be removed when one is.'
      : null,
  };
}

/**
 * Rotate: retire the current key, activate a new one.
 *
 * The old key is retired, never deleted, and its public half stays in
 * the JWKS — so every credential it signed keeps verifying. That is the
 * whole requirement, and it is why this is a status change rather than
 * a replacement.
 */
export async function rotateKey(env, { backend = 'development', kmsKeyRef = null, actorId = null, now = Date.now() } = {}) {
  if (!['development', 'kms'].includes(backend)) {
    throw new ValidationError('A signing key is held either in development or in a KMS.', { backend: 'Invalid' });
  }
  if (backend === 'kms' && !kmsKeyRef) {
    throw new ValidationError('A KMS-backed key must name the key it refers to.', { kmsKeyRef: 'Required' });
  }
  const at = new Date(now).toISOString();
  const current = await db(env).prepare("SELECT kid FROM signing_keys WHERE status = 'active'").first();

  // Retired FIRST. The one-active-key index would refuse the insert
  // otherwise, and a rotation that half-succeeded would leave the
  // College unable to sign anything.
  if (current) {
    await db(env).prepare("UPDATE signing_keys SET status = 'retired', retired_at = ? WHERE kid = ?")
      .bind(at, current.kid).run();
  }

  const kid = newKid(now);
  if (backend === 'kms') {
    throw new ValidationError(
      'Registering a KMS-backed key needs the public half fetched from the service, and the KMS client is not implemented. '
      + 'The College will not register a key it cannot sign with — a registered-but-unusable key would stop every conferral.',
      { backend: 'Not implemented' },
    );
  }

  const pair = await crypto.subtle.generateKey(EC_PARAMS, true, ['sign', 'verify']);
  const pub = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey);
  await db(env)
    .prepare(`INSERT INTO signing_keys (kid, backend, algorithm, public_jwk, dev_private_jwk, kms_key_ref, status, created_at, activated_at)
              VALUES (?,?,?,?,?,?, 'active', ?, ?)`)
    .bind(kid, backend, ALGORITHM,
      JSON.stringify({ ...pub, kid, alg: ALGORITHM, use: 'sig' }),
      JSON.stringify({ ...priv, kid, alg: ALGORITHM }), kmsKeyRef, at, at)
    .run();

  return { kid, previousKid: current ? current.kid : null, backend, rotatedAt: at };
}

/**
 * Revoke a key: its signatures can no longer be relied upon.
 *
 * Distinct from retirement, and far more serious. A revoked key's
 * credentials must be re-issued, so this is deliberately awkward — it
 * demands a reason, and it refuses to be the last word by leaving the
 * College with no active key.
 */
export async function revokeKey(env, { kid, reason, now = Date.now() }) {
  const why = String(reason || '').trim();
  if (why.length < 10) {
    throw new ValidationError(
      'Revoking a signing key invalidates every credential it signed. A reason is required.',
      { reason: 'Required' },
    );
  }
  const key = await db(env).prepare('SELECT * FROM signing_keys WHERE kid = ?').bind(kid).first();
  if (!key) throw new NotFoundError('Unknown signing key.');
  if (key.status === 'revoked') return { kid, revoked: true, changed: false };

  await db(env)
    .prepare("UPDATE signing_keys SET status = 'revoked', revoked_reason = ?, retired_at = COALESCE(retired_at, ?) WHERE kid = ?")
    .bind(why, new Date(now).toISOString(), kid).run();

  // Revoking the active key leaves the College unable to issue anything.
  // A fresh key is minted in the same operation rather than left for
  // whoever notices next, because "we cannot confer awards" is not a
  // state to discover at a graduation ceremony.
  let replacement = null;
  if (key.status === 'active') replacement = await rotateKey(env, { now });

  const affected = await db(env)
    .prepare('SELECT COUNT(*) AS n FROM credential_signatures WHERE kid = ?').bind(kid).first();
  return { kid, revoked: true, changed: true, replacementKid: replacement ? replacement.kid : null,
    credentialsAffected: affected.n };
}

/** Every signature made with a key — the audit answer. */
export async function signingHistory(env, { kid = null, subjectType = null, subjectId = null, limit = 200 } = {}) {
  const capped = Math.max(1, Math.min(Number(limit) || 200, 500));
  const { results } = await db(env)
    .prepare(`SELECT s.id, s.kid, s.subject_type AS subjectType, s.subject_id AS subjectId,
                     s.payload_digest AS payloadDigest, s.mode, s.signed_at AS signedAt,
                     k.status AS keyStatus, k.backend
                FROM credential_signatures s JOIN signing_keys k ON k.kid = s.kid
               WHERE (? IS NULL OR s.kid = ?)
                 AND (? IS NULL OR s.subject_type = ?)
                 AND (? IS NULL OR s.subject_id = ?)
               ORDER BY s.signed_at DESC LIMIT ?`)
    .bind(kid, kid, subjectType, subjectType, subjectId, subjectId, capped)
    .all();
  // The signature itself is not returned. An audit reader needs to know
  // WHAT was signed and WHEN; handing out the signature bytes serves no
  // audit purpose and puts them in a log.
  return { count: results.length, signatures: results };
}
