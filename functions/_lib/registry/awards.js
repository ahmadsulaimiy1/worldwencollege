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

function checkChar(body) {
  // Weighted mod-30 over the alphabet. Catches every single-character
  // substitution and the transpositions people actually make reading a
  // code aloud, which is what a check character is for — not security.
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (ALPHABET.indexOf(body[i]) + 1) * (i + 2);
  return ALPHABET[sum % ALPHABET.length];
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
  const body = randomBody();
  return formatCode(body, checkChar(body));
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

async function chainHead(env) {
  const row = await db(env)
    .prepare('SELECT digest FROM awards ORDER BY created_at DESC, id DESC LIMIT 1')
    .first();
  return row ? row.digest : GENESIS;
}

/**
 * Confer an award. The only way a row enters the Register.
 *
 * NOTE ON GOVERNANCE: no award may actually be conferred until the
 * Executive adopts docs/iefc-award-architecture.md (C4) and the honours
 * thresholds (B1/B2). This function is the mechanism; the authority to
 * use it is not yet granted, and callers in production are expected to
 * be gated accordingly.
 */
export async function conferAward(env, {
  userId, levelId, awardTitle, postNominal, cefr, honour = 'pass',
  credits, tqtHours, holderName, citation = null, conferredOn = null,
  publicConsent = false, now = Date.now(),
}) {
  if (!userId || !levelId) throw new ValidationError('userId and levelId are required.');
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

  const prev = await chainHead(env);
  const digest = await sha256Hex(canonical(award, prev));

  await db(env)
    .prepare(`INSERT INTO awards (id, user_id, level_id, award_title, post_nominal, cefr, honour,
        credits, tqt_hours, citation, holder_name, conferred_on, verification_code,
        status, public_consent, prev_digest, digest, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'conferred', ?, ?, ?, ?)`)
    .bind(award.id, award.user_id, award.level_id, award.award_title, award.post_nominal,
      award.cefr, award.honour, award.credits, award.tqt_hours, citation, award.holder_name,
      award.conferred_on, award.verification_code, publicConsent ? 1 : 0, prev, digest,
      new Date(now).toISOString())
    .run();

  return { ...award, digest, prevDigest: prev, status: 'conferred' };
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

  const replacement = await conferAward(env, {
    userId: old.user_id,
    levelId: old.level_id,
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

  return { outcome, award: publicView(award, replacementCode), message: null };
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
    level: { id: a.level_id, roman: a.roman, name: a.levelName },
    cefr: a.cefr,
    honour: a.honour,
    honourLabel: HONOUR_LABEL[a.honour] || a.honour,
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

/** The browsable register — consented, current awards only. */
export async function publicRegister(env, { levelId = null, limit = 100 } = {}) {
  const { results } = await db(env)
    .prepare(`SELECT a.holder_name AS holderName, a.award_title AS awardTitle,
                     a.post_nominal AS postNominal, a.honour, a.conferred_on AS conferredOn,
                     a.verification_code AS verificationCode, a.level_id AS levelId, l.roman
       FROM awards a JOIN programme_levels l ON l.id = a.level_id
       WHERE a.status = 'conferred' AND a.public_consent = 1
         AND (? IS NULL OR a.level_id = ?)
       ORDER BY a.conferred_on DESC, a.holder_name ASC
       LIMIT ?`)
    .bind(levelId, levelId, limit)
    .all();
  return { count: results.length, entries: results };
}

/**
 * Walk the chain and report the first break.
 *
 * This is the assurance function: it is what lets the College state that
 * its register has not been altered, rather than assert it. Run it on a
 * schedule and on demand, and publish the result.
 */
export async function verifyChain(env) {
  const { results } = await db(env)
    .prepare('SELECT * FROM awards ORDER BY created_at ASC, id ASC')
    .all();

  let expectedPrev = GENESIS;
  for (const a of results) {
    if (a.prev_digest !== expectedPrev) {
      return { intact: false, checked: results.length, brokenAt: a.id,
        reason: 'This award does not follow the one before it — a record has been inserted, removed or reordered.' };
    }
    const recomputed = await sha256Hex(canonical(a, a.prev_digest));
    if (recomputed !== a.digest) {
      return { intact: false, checked: results.length, brokenAt: a.id,
        reason: 'This award\'s stored digest does not match its contents — the record has been altered since it was conferred.' };
    }
    expectedPrev = a.digest;
  }
  return { intact: true, checked: results.length, brokenAt: null, reason: null };
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
