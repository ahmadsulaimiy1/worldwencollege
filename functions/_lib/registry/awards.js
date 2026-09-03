// The Graduate Register — the College's permanent academic record.
//
// Everything in the credential architecture derives its worth from being
// checkable against this: certificates, transcripts, digital badges, the
// alumni Chapters. An award nobody can verify is a decoration, which is
// why the Board's build order puts the Register first
// (docs/iefc-award-architecture.md § XIV).
//
// FOUR DESIGN DECISIONS, each because of a specific way a register fails.
//
// 1. THE CHAIN. Every award's digest covers its own substantive fields
//    AND the digest of the award before it. Editing an old record — a
//    date, an honour, a name — changes its digest and breaks every link
//    after it. The register cannot be quietly altered; it can only be
//    altered detectably, and verifyChain() finds the exact row.
//
//    `prev_digest` is UNIQUE in the schema, which is what makes this a
//    chain rather than a tree. Two conferrals racing to extend the same
//    head cannot both commit: the database refuses the second and the
//    caller retries. Integrity rests on a constraint, not on hoping
//    requests do not overlap.
//
//    THIS IS NOT A BLOCKCHAIN and must never be called one. It is a hash
//    chain in one institution's database. It makes external anchoring
//    straightforward later, which is the only honest sense in which
//    anything here is "blockchain-ready".
//
// 2. THE CODE. Unguessable, transcribable, and self-checking. Random
//    over a 32-character alphabet with the ambiguous glyphs removed
//    (no 0/O, no 1/I/L), grouped for reading aloud, with a check
//    character. Sequential codes would let anyone walk the register and
//    harvest graduates' names, which is a data-protection failure dressed
//    as a convenience. A typo fails cleanly rather than resolving to a
//    stranger's award.
//
// 3. REVOCATION IS VISIBLE. A withdrawn award is marked, dated and
//    reasoned, never deleted. A verification page that 404s tells a
//    checker nothing; one that says "withdrawn on this date" tells them
//    the institution is honest.
//
// 4. CONSENT IS SCOPED. `public_consent` gates the browsable register.
//    It does NOT gate verification by code — a code is something the
//    graduate chose to hand somebody, and honouring it is the entire
//    purpose of the system.

import { db, newId, nowIso, ValidationError, NotFoundError } from '../db.js';
import { signCredential, verifyCredential } from './signing.js';
import { assertConferrable } from './graduation.js';
import { LEVEL_NAMES_AR, LEVEL_ORDINALS_AR } from '../academic/level-names.js';

// Crockford-style: no 0/O, no 1/I/L, no U (it turns words into
// accidents). 30 symbols, 12 of them per code, so ~59 bits — not
// enumerable, and short enough to read down a telephone.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';
const BODY_LENGTH = 12;
export const GENESIS = 'WEC-REGISTER-GENESIS';

export const HONOURS = ['pass', 'merit', 'distinction', 'high_distinction', 'college_distinction'];
export const HONOUR_LABEL = {
  pass: 'Pass',
  merit: 'Merit',
  distinction: 'Distinction',
  high_distinction: 'High Distinction',
  college_distinction: 'Distinction of the College',
};

/* THE SAME FIVE RANKS, IN THE WORDS THE COLLEGE ALREADY PUBLISHES.
 *
 * These are not a translation made here. They are the five headings on
 * /ar/students/awards/, which is where an Arabic reader is sent to learn
 * what a rank means — so an award that came back from the register
 * calling itself anything else would be a second name for a published
 * fact, and the reader would have no way to tell which one the College
 * meant.
 *
 * `tests/honour-labels.test.mjs` reads that page and fails the build if
 * the two ever stop agreeing.
 *
 * Handed back BESIDE `honourLabel`, never instead of it: one payload
 * serves both editions and the page chooses, which is the same rule the
 * level names follow in functions/_lib/academic/level-names.js.
 */
export const HONOUR_LABEL_AR = {
  pass: 'ناجح',
  merit: 'امتياز',
  distinction: 'تميّز',
  high_distinction: 'تميّز عالٍ',
  college_distinction: 'تميّز الكلية',
};

// The modulus is PRIME, and that is the whole design.
//
// The first version of this weighted mod 30 — the alphabet size — and
// 30 = 2 x 3 x 5. A substitution changes the weighted sum by
// (delta x weight), so whenever that product was a multiple of 30 the
// check character came out unchanged and the typo verified. Measured
// against the real alphabet: 8.6% of all single-character substitutions
// were undetected, and the comment above the function claimed it caught
// every one of them.
//
// That is the worst kind of wrong for this particular function. Its
// entire purpose is that a mistyped code fails cleanly rather than
// resolving to a stranger's award, and one typo in twelve was doing
// exactly that.
//
// With a prime modulus, (delta x weight) = 0 (mod 31) forces delta = 0,
// since 31 divides neither factor. Every single-character substitution
// is detected. Weights are consecutive, so an adjacent transposition
// shifts the sum by (a - b) x 1, which is zero only when the two
// characters are identical and the "transposition" is not one. Both
// properties are proved exhaustively in tests/registry.test.mjs rather
// than asserted here.
const CHECK_MOD = 31;

function checkValue(body) {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (ALPHABET.indexOf(body[i]) + 1) * (i + 1);
  return sum % CHECK_MOD;
}

/**
 * Returns null when the check value is 30 — one residue more than the
 * alphabet has symbols.
 *
 * The alternative was a 31st check-only glyph, as Crockford does with
 * '*'. These codes are read aloud down a telephone and typed off print,
 * and a symbol that appears in one code in thirty-one is a support call
 * every time. Drawing a fresh body instead costs 1/31 of the keyspace —
 * leaving ~58 bits, which is not enumerable by any margin that matters.
 */
function checkChar(body) {
  const v = checkValue(body);
  return v < ALPHABET.length ? ALPHABET[v] : null;
}

function randomBody(length = BODY_LENGTH) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  // Rejection-free modulo bias is not worth chasing here: 256 % 30 leaves
  // a bias under 4% on six symbols, which changes nothing about
  // guessability at 59 bits. Said plainly rather than left for someone to
  // discover and wonder about.
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function formatCode(body, check) {
  const s = body + check;
  return `WEC-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 13)}`;
}

export function newVerificationCode() {
  // Loops only when the check value lands on the one residue the
  // alphabet cannot express — 1 in 31, so this runs once almost always
  // and is bounded by the randomness, not by a retry limit.
  for (;;) {
    const body = randomBody();
    const check = checkChar(body);
    if (check !== null) return formatCode(body, check);
  }
}

/**
 * Normalise anything a human might type or paste, then check it.
 *
 * Accepts lower case, missing dashes, surrounding whitespace and a
 * missing or present WEC prefix — all of which are how people actually
 * copy a code off a printed certificate.
 *
 * It does NOT try to rescue O/0 or I/L/1. The alphabet excludes those
 * glyphs precisely so they never appear in a real code, so a code
 * containing one was mistyped and there is no correct character to
 * substitute. Guessing would risk resolving to a stranger's award, which
 * is the one outcome worse than saying "check the code".
 */
export function parseCode(input) {
  if (typeof input !== 'string') return { ok: false, reason: 'malformed' };
  let cleaned = input.toUpperCase().replace(/[^0-9A-Z]/g, '');
  // Strip the prefix only when doing so leaves exactly a code. W, E and
  // C are all valid body characters, so an unconditional strip would eat
  // three of them from a code that arrived without the prefix.
  if (cleaned.length === BODY_LENGTH + 4 && cleaned.startsWith('WEC')) cleaned = cleaned.slice(3);
  if (cleaned.length !== BODY_LENGTH + 1) return { ok: false, reason: 'malformed' };
  const body = cleaned.slice(0, BODY_LENGTH);
  const check = cleaned[BODY_LENGTH];
  if ([...body].some((c) => !ALPHABET.includes(c))) return { ok: false, reason: 'malformed' };
  // checkChar() returns null when the value is the unexpressible
  // residue. A real code never has that, so null !== check refuses it —
  // which is correct: such a string was never issued.
  if (checkChar(body) !== check) return { ok: false, reason: 'malformed' };
  return { ok: true, code: formatCode(body, check) };
}

// The digest covers exactly the fields a certificate asserts. Adding a
// field here changes every future digest and none of the past ones, which
// is correct: the chain attests what was recorded at the time.
function canonical(award, prevDigest) {
  return [
    award.id, award.user_id, String(award.level_id), award.award_title,
    award.post_nominal, award.cefr, award.honour, String(award.credits),
    String(award.tqt_hours), award.holder_name, award.conferred_on,
    award.verification_code, prevDigest,
  ].join('␟'); // unit separator: cannot occur in any of the fields
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * The tail of the chain — the award nothing has been chained onto yet.
 *
 * NOT ordered by time. An earlier version asked for the most recent row
 * (`ORDER BY created_at DESC, id DESC`) and it was wrong in a way that
 * only appears under the register's intended use: at a conferral
 * ceremony, awards are written in a batch, several land in the same
 * millisecond, and the tiebreak falls to a random UUID. The query then
 * returned a row that was not the tail, the next conferral chained onto
 * an already-extended record, and `prev_digest UNIQUE` refused it.
 *
 * The replacement asked the structural question — "whose digest is
 * nobody's predecessor" — which is correct, and which reads the whole
 * table. Measured at 11.8ms against 50,000 awards, on every conferral,
 * growing without bound. That is the wrong shape for a permanent
 * record: the cost lands on the institution's future.
 *
 * So the position is stored (`seq`, UNIQUE, indexed) and the head is an
 * index seek. The LINKS remain the authority — `verifyChain()` asserts
 * the two orders agree, so `seq` cannot quietly drift into being a
 * second version of the truth.
 */
async function chainHead(env) {
  const row = await db(env)
    .prepare('SELECT digest, seq FROM awards ORDER BY seq DESC LIMIT 1')
    .first();
  return { digest: row ? row.digest : GENESIS, seq: row ? (row.seq || 0) + 1 : 1 };
}

/**
 * Confer an award. The only way a row enters the Register.
 *
 * REQUIRES A PASSED GRADUATION AUDIT (migration 028). Everything else
 * in this function is careful about the FORM of a conferral — the
 * chain, the signature, the race — and until the audit existed nothing
 * asked whether it was TRUE. The title, the CEFR level, the credits and
 * the hours all arrive from the caller; a Mastery qualification could
 * have been conferred on somebody who had completed nothing, and every
 * safeguard here would have recorded it faithfully and permanently.
 *
 * `auditId` is therefore not optional. assertConferrable() refuses an
 * audit that failed, one belonging to another learner, and one for
 * another level, and `conferrals` then records the binding under a
 * composite foreign key so it cannot be edited into a lie afterwards.
 *
 * NOTE ON GOVERNANCE: no award may actually be conferred until the
 * Executive adopts docs/iefc-award-architecture.md (C4) and the honours
 * thresholds (B1/B2). And as things stand no audit CAN pass, because
 * the External Examiner the WEQ framework requires is not appointed —
 * which is the framework's own stated position, now enforced rather
 * than published.
 */
export async function conferAward(env, {
  userId, levelId, auditId = null, awardTitle, postNominal, cefr, honour = 'pass',
  credits, tqtHours, holderName, citation = null, conferredOn = null,
  publicConsent = false, actorId = null, now = Date.now(),
}) {
  if (!userId || !levelId) throw new ValidationError('userId and levelId are required.');
  // Before anything else, and before any row is written: was it earned?
  const audit = await assertConferrable(env, { auditId, userId, levelId });
  if (!HONOURS.includes(honour)) {
    throw new ValidationError(`honour must be one of: ${HONOURS.join(', ')}.`, { honour: 'Invalid' });
  }
  const name = String(holderName || '').trim();
  if (name.length < 2) {
    throw new ValidationError('A holder name is required — a certificate names a person.', { holderName: 'Required' });
  }
  const learner = await db(env).prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (!learner) throw new NotFoundError('Unknown person.');

  const award = {
    id: newId('awd'),
    user_id: userId,
    level_id: levelId,
    award_title: awardTitle,
    post_nominal: postNominal,
    cefr,
    honour,
    credits,
    tqt_hours: tqtHours,
    holder_name: name,
    conferred_on: conferredOn || new Date(now).toISOString().slice(0, 10),
    verification_code: newVerificationCode(),
  };

  // Two conferrals racing to extend the same head cannot both succeed —
  // `prev_digest UNIQUE` refuses the second, which is exactly what keeps
  // the chain a chain rather than a tree. The loser re-reads the head
  // and tries again against it.
  //
  // Bounded, and it fails loudly when the bound is reached. An unbounded
  // retry on a register write would turn a genuine constraint problem
  // into a hang at a graduation ceremony, and the registrar would learn
  // about it from the graduates.
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const head = await chainHead(env);
    const digest = await sha256Hex(canonical(award, head.digest));
    try {
      await db(env)
        .prepare(`INSERT INTO awards (id, user_id, level_id, award_title, post_nominal, cefr, honour,
            credits, tqt_hours, citation, holder_name, conferred_on, verification_code,
            status, public_consent, prev_digest, digest, seq, created_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'conferred', ?, ?, ?, ?, ?)`)
        .bind(award.id, award.user_id, award.level_id, award.award_title, award.post_nominal,
          award.cefr, award.honour, award.credits, award.tqt_hours, citation, award.holder_name,
          award.conferred_on, award.verification_code, publicConsent ? 1 : 0, head.digest, digest,
          head.seq, new Date(now).toISOString())
        .run();
      // The binding to the audit, written in the same breath as the
      // award. A composite foreign key onto (id, user_id, level_id,
      // outcome) with the outcome pinned to 'met' means this row cannot
      // later be edited to point at a failed or borrowed audit.
      await db(env)
        .prepare(`INSERT INTO conferrals (award_id, audit_id, user_id, level_id, audit_outcome, conferred_at)
          VALUES (?, ?, ?, ?, 'met', ?)`)
        .bind(award.id, audit.id, userId, levelId, new Date(now).toISOString())
        .run();

      // Signed at the moment of conferral, not retrofitted. A credential
      // signed later is a credential that existed unsigned, and there is
      // no way afterwards to tell which of those a given certificate was.
      //
      // Executive Decision P2.1. The signature covers exactly what the
      // certificate asserts — see signedClaims() — so a verifier checks
      // the document in front of them rather than a record they have to
      // trust us about.
      const signature = await signCredential(env, {
        subjectType: 'award', subjectId: award.id,
        claims: signedClaims({ ...award, citation, digest }),
        actorId: actorId, now,
      });
      return { ...award, digest, prevDigest: head.digest, seq: head.seq, status: 'conferred', signature };
    } catch (err) {
      // Only a lost race is retried — either link or position, since
      // both are UNIQUE and either can be the one that collides. A
      // duplicate award for the same person and level, or any other
      // constraint, is a real refusal and must surface rather than be
      // retried into a different error.
      if (!/prev_digest|seq/i.test(String(err && err.message))) throw err;
      lastErr = err;
    }
  }
  throw lastErr;
}

/** Withdraw an award. Marked and reasoned — never deleted. */
export async function revokeAward(env, { awardId, reason, now = Date.now() }) {
  const why = String(reason || '').trim();
  if (why.length < 3) {
    throw new ValidationError('A reason is required to withdraw an award.', { reason: 'Required' });
  }
  const award = await db(env).prepare('SELECT id, status FROM awards WHERE id = ?').bind(awardId).first();
  if (!award) throw new NotFoundError('Unknown award.');
  if (award.status === 'revoked') return { awardId, status: 'revoked', changed: false };

  await db(env)
    .prepare("UPDATE awards SET status = 'revoked', revoked_at = ?, revoked_reason = ? WHERE id = ?")
    .bind(new Date(now).toISOString(), why, awardId)
    .run();
  return { awardId, status: 'revoked', changed: true };
}

/**
 * Replace an award — a corrected certificate, a name change, a
 * re-conferral after review. The old row is marked `replaced` and points
 * at its successor, so a checker holding an old code is told where the
 * current record is rather than that their certificate is worthless.
 */
export async function replaceAward(env, { awardId, reason, changes = {}, now = Date.now() }) {
  const old = await db(env).prepare('SELECT * FROM awards WHERE id = ?').bind(awardId).first();
  if (!old) throw new NotFoundError('Unknown award.');
  const why = String(reason || '').trim();
  if (why.length < 3) throw new ValidationError('A reason is required to replace an award.', { reason: 'Required' });

  // Mark the predecessor BEFORE conferring the successor. One live award
  // per learner per level is enforced by a partial unique index, so
  // conferring first would collide with the row being replaced — and
  // relaxing that index to allow the overlap would allow two live
  // certificates for one level, which is the thing it exists to prevent.
  await db(env)
    .prepare("UPDATE awards SET status = 'replaced', revoked_at = ?, revoked_reason = ? WHERE id = ?")
    .bind(new Date(now).toISOString(), why, awardId)
    .run();

  // The replacement carries the ORIGINAL audit. A corrected certificate
  // — a name change, a typo, a re-issue — is the same qualification, and
  // requiring it to be re-earned would be absurd. Requiring it to name
  // the audit it was earned under is not.
  const originalConferral = await db(env)
    .prepare('SELECT audit_id FROM conferrals WHERE award_id = ?').bind(awardId).first();
  if (!originalConferral) {
    throw new ValidationError(
      'That award has no conferral record, so there is no audit to carry into its replacement. It predates the graduation audit and must be investigated rather than reissued.',
      { awardId: 'Unaudited' },
    );
  }

  const replacement = await conferAward(env, {
    userId: old.user_id,
    levelId: old.level_id,
    auditId: originalConferral.audit_id,
    awardTitle: changes.awardTitle ?? old.award_title,
    postNominal: changes.postNominal ?? old.post_nominal,
    cefr: changes.cefr ?? old.cefr,
    honour: changes.honour ?? old.honour,
    credits: changes.credits ?? old.credits,
    tqtHours: changes.tqtHours ?? old.tqt_hours,
    holderName: changes.holderName ?? old.holder_name,
    citation: changes.citation ?? old.citation,
    conferredOn: old.conferred_on,      // the conferral date does not move
    publicConsent: !!old.public_consent,
    now,
  });

  await db(env)
    .prepare('UPDATE awards SET replaced_by_id = ? WHERE id = ?')
    .bind(replacement.id, awardId)
    .run();

  return { replaced: awardId, replacement };
}

/**
 * Verify a code. The public entry point, and the reason the system
 * exists. Every attempt is logged — WITHOUT identifying the checker,
 * because a log of who checked would destroy the one property that makes
 * the portal useful and create a personal-data holding with no defensible
 * purpose.
 */
export async function verifyCode(env, { code, channel = 'public', now = Date.now() }) {
  const parsed = parseCode(code);
  if (!parsed.ok) {
    await logVerification(env, { awardId: null, code: String(code || '').slice(0, 64), outcome: 'malformed', channel, now });
    return { outcome: 'malformed', award: null,
      message: 'That is not a valid WEC verification code. Check it against the certificate — codes look like WEC-XXXX-XXXX-XXXXX.' };
  }

  const award = await db(env)
    .prepare(`SELECT a.*, l.roman, l.name AS levelName
       FROM awards a JOIN programme_levels l ON l.id = a.level_id
       WHERE a.verification_code = ?`)
    .bind(parsed.code)
    .first();

  if (!award) {
    await logVerification(env, { awardId: null, code: parsed.code, outcome: 'not_found', channel, now });
    return { outcome: 'not_found', award: null,
      message: 'No award in the WEC-LC Graduate Register carries that code.' };
  }

  const outcome = award.status === 'conferred' ? 'valid' : award.status;
  await logVerification(env, { awardId: award.id, code: parsed.code, outcome, channel, now });

  let replacementCode = null;
  if (award.status === 'replaced' && award.replaced_by_id) {
    const next = await db(env).prepare('SELECT verification_code FROM awards WHERE id = ?')
      .bind(award.replaced_by_id).first();
    replacementCode = next ? next.verification_code : null;
  }

  // The signature travels WITH the answer, and it is verified here
  // rather than merely fetched. A portal that displayed a stored
  // signature without checking it would be showing a padlock icon, not
  // performing a verification.
  const signature = await awardSignature(env, award);
  return { outcome, award: publicView(award, replacementCode), signature, message: null };
}

/**
 * Exactly what the signature covers.
 *
 * The fields a CERTIFICATE ASSERTS, and no others. Deliberately not the
 * whole row: `public_consent` and `seq` are administrative and can
 * legitimately change after conferral, and a signature over them would
 * break every time a graduate updated a privacy setting — which reads
 * to a verifier as tampering.
 *
 * The chain digest IS included. It binds the signature to the
 * register position, so a signed credential cannot be presented for an
 * award that was later removed from the chain.
 */
function signedClaims(a) {
  return {
    holderName: a.holder_name,
    awardTitle: a.award_title,
    postNominal: a.post_nominal,
    levelId: a.level_id,
    cefr: a.cefr,
    honour: a.honour,
    credits: a.credits,
    tqtHours: a.tqt_hours,
    citation: a.citation ?? null,
    conferredOn: a.conferred_on,
    verificationCode: a.verification_code,
    registerDigest: a.digest,
  };
}

/**
 * What a verification page may show. Deliberately narrow: the fields a
 * certificate already asserts, and nothing else. The graduate's email,
 * their marks, their progress and their identity in the system are not
 * the checker's business, and a verification response that carried them
 * would be a data leak with a padlock icon on it.
 */
function publicView(a, replacementCode = null) {
  return {
    holderName: a.holder_name,
    awardTitle: a.award_title,
    postNominal: a.post_nominal,
    // Both namings, so the Arabic verification page can print an
    // Arabic level rather than an English one mid-Arabic-sentence.
    // Nothing here is a new fact about the holder: it is the same level,
    // in the other language the College publishes it in.
    level: {
      id: a.level_id, roman: a.roman, ordinalAr: LEVEL_ORDINALS_AR[a.level_id] || null,
      name: a.levelName, nameAr: LEVEL_NAMES_AR[a.level_id] || null,
    },
    cefr: a.cefr,
    honour: a.honour,
    honourLabel: HONOUR_LABEL[a.honour] || a.honour,
    honourLabelAr: HONOUR_LABEL_AR[a.honour] || null,
    credits: a.credits,
    tqtHours: a.tqt_hours,
    citation: a.citation,
    conferredOn: a.conferred_on,
    verificationCode: a.verification_code,
    status: a.status,
    revokedAt: a.revoked_at,
    revokedReason: a.revoked_reason,
    replacementCode,
    digest: a.digest,
  };
}

/**
 * The credential signature for one award, checked rather than recited.
 *
 * Returns null when an award predates the signing layer. That is a true
 * answer about older records and must not be dressed up: a missing
 * signature is not an invalid one, and the verification page says
 * "unsigned" rather than "failed".
 */
async function awardSignature(env, award) {
  const row = await db(env)
    .prepare(`SELECT signature, kid, mode, signed_at FROM credential_signatures
               WHERE subject_type = 'award' AND subject_id = ?
               ORDER BY signed_at DESC LIMIT 1`)
    .bind(award.id).first();
  if (!row) {
    return {
      present: false,
      message: 'This award predates the College\'s credential signing layer. Its authenticity rests on the Register entry above.',
    };
  }
  const result = await verifyCredential(env, {
    subjectType: 'award', subjectId: award.id,
    claims: signedClaims(award), signature: row.signature, kid: row.kid,
  });
  return { present: true, ...result, signedAt: row.signed_at };
}

async function logVerification(env, { awardId, code, outcome, channel, now }) {
  await db(env)
    .prepare(`INSERT INTO award_verifications (id, award_id, code_attempted, outcome, channel, created_at)
       VALUES (?,?,?,?,?,?)`)
    .bind(newId('ver'), awardId, code, outcome, channel, new Date(now).toISOString())
    .run();
}

/** A graduate's own award history — every conferral, in order. */
export async function awardHistory(env, { userId }) {
  const { results } = await db(env)
    .prepare(`SELECT a.*, l.roman, l.name AS levelName
       FROM awards a JOIN programme_levels l ON l.id = a.level_id
       WHERE a.user_id = ? ORDER BY a.level_id ASC, a.created_at ASC`)
    .bind(userId)
    .all();
  const awards = results.map((a) => publicView(a));
  const live = awards.filter((a) => a.status === 'conferred');
  return {
    awards,
    highest: live.length ? live[live.length - 1] : null,
    creditsTotal: live.reduce((n, a) => n + a.credits, 0),
    tqtHoursTotal: live.reduce((n, a) => n + a.tqtHours, 0),
  };
}

/**
 * The browsable register — consented, current awards only.
 *
 * EVERY LEVEL, NOT ONLY THE HIGHEST. Each IEFC level is a complete award
 * of the College and appears here in its own right. A register listing
 * only its C2 graduates would say, by omission, that the other five
 * awards were waypoints rather than achievements — which is the opposite
 * of what the award architecture was designed to mean.
 *
 * Three filters, all of them narrowing: consent, live status, and
 * whatever the visitor asked for. There is no parameter that widens the
 * result set, which is what keeps the privacy promise a property of the
 * query rather than of the caller's good manners.
 *
 * The verification code IS published for listed graduates. That looks
 * like a leak and is not one: a code identifies an award, it does not
 * authorise anything, and verifying it returns the true holder's name —
 * so someone quoting a stranger's code is immediately contradicted by
 * the portal. The alternative, a register of names that cannot be
 * checked, is a claim on a webpage, and the College's whole position is
 * that its public claims are verifiable.
 */
export async function publicRegister(env, { levelId = null, q = null, limit = 100 } = {}) {
  // Bounded here rather than trusted from the caller. This is a public
  // endpoint, and `limit` arriving from a query string is exactly how a
  // register becomes a bulk download of every graduate's name.
  const capped = Math.max(1, Math.min(Number(limit) || 100, 200));
  const needle = q && String(q).trim() ? `%${String(q).trim().toLowerCase()}%` : null;
  const { results } = await db(env)
    .prepare(`SELECT a.holder_name AS holderName, a.award_title AS awardTitle,
                     a.post_nominal AS postNominal, a.honour, a.conferred_on AS conferredOn,
                     a.verification_code AS verificationCode, a.level_id AS levelId,
                     l.roman, l.name AS levelName, a.cefr
       FROM awards a JOIN programme_levels l ON l.id = a.level_id
       WHERE a.status = 'conferred' AND a.public_consent = 1
         AND (? IS NULL OR a.level_id = ?)
         AND (? IS NULL OR LOWER(a.holder_name) LIKE ?)
       ORDER BY a.conferred_on DESC, a.holder_name ASC
       LIMIT ?`)
    .bind(levelId, levelId, needle, needle, capped)
    .all();
  return {
    count: results.length,
    limit: capped,
    truncated: results.length === capped,
    entries: results.map((r) => ({
      ...r,
      honourLabel: HONOUR_LABEL[r.honour] || r.honour,
      honourLabelAr: HONOUR_LABEL_AR[r.honour] || null,
      // The roll is published in both editions and the level's name
      // travels in both, so /ar/register.html is not a list of Arabic
      // names against English programmes.
      ordinalAr: LEVEL_ORDINALS_AR[r.levelId] || null,
      levelNameAr: LEVEL_NAMES_AR[r.levelId] || null,
    })),
  };
}

/**
 * Walk the chain and report the first break.
 *
 * This is the assurance function: it is what lets the College state that
 * its register has not been altered, rather than assert it. Run it on a
 * schedule and on demand, and publish the result.
 */
export async function verifyChain(env) {
  const { results } = await db(env).prepare('SELECT * FROM awards').all();
  const total = results.length;
  if (!total) return { intact: true, checked: 0, brokenAt: null, reason: null };

  // Walk the LINKS, not the timestamps. Ordering by `created_at` was the
  // same mistake as in chainHead() and here it was the more damaging of
  // the two: two awards conferred in the same millisecond could sort
  // into the wrong order and this function would report the College's
  // register as broken when it was perfectly intact. A false alarm on
  // an integrity claim costs more than a missing one, because it is
  // acted upon.
  const byPrev = new Map();
  for (const a of results) byPrev.set(a.prev_digest, a);

  let expectedPrev = GENESIS;
  let checked = 0;
  const order = [];
  while (byPrev.has(expectedPrev)) {
    const a = byPrev.get(expectedPrev);
    byPrev.delete(expectedPrev);
    checked++;
    order.push(a);
    const recomputed = await sha256Hex(canonical(a, a.prev_digest));
    if (recomputed !== a.digest) {
      return { intact: false, checked: total, brokenAt: a.id,
        reason: 'This award\'s stored digest does not match its contents — the record has been altered since it was conferred.' };
    }
    expectedPrev = a.digest;
  }

  // Anything the walk never reached is an orphan: its predecessor was
  // deleted, or a record was inserted out of sequence. Naming the first
  // such record is what lets a registrar find the gap, so it is reported
  // in a stable order rather than whichever the database happened to
  // return.
  if (byPrev.size) {
    const orphans = [...byPrev.values()].sort((x, y) => (x.seq || 0) - (y.seq || 0));
    return { intact: false, checked: total, brokenAt: orphans[0].id,
      reason: 'This award does not follow the one before it — a record has been inserted, removed or reordered.' };
  }

  // `seq` is a denormalisation, and a denormalisation nothing checks is
  // a second source of truth waiting to disagree with the first. The
  // links are the authority; this asserts the stored order still agrees
  // with them, so a tampered or backfilled `seq` is a finding rather
  // than a silent divergence.
  for (let i = 1; i < order.length; i++) {
    if (!(order[i].seq > order[i - 1].seq)) {
      return { intact: false, checked: total, brokenAt: order[i].id,
        reason: 'This award\'s recorded position contradicts the chain — the register\'s ordering has been altered.' };
    }
  }
  return { intact: true, checked, brokenAt: null, reason: null };
}

/** How often an award has been verified. Counts only — never who. */
export async function verificationSummary(env, { awardId }) {
  const row = await db(env)
    .prepare(`SELECT COUNT(*) AS total, MAX(created_at) AS lastAt
       FROM award_verifications WHERE award_id = ?`)
    .bind(awardId)
    .first();
  return { total: row.total, lastAt: row.lastAt };
}
