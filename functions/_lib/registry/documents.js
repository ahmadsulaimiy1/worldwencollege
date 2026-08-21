/* Issued documents — transcripts, diploma supplements, verification
 * statements — and institutional verification of them.
 *
 * ────────────────────────────────────────────────────────────────
 * THE ONE IDEA THIS MODULE IS BUILT AROUND
 * ────────────────────────────────────────────────────────────────
 * An award is immutable. A TRANSCRIPT is a snapshot.
 *
 * A graduate sends a university a transcript in 2027. In 2030 they have
 * completed two more levels, so the transcript the platform would
 * generate for them is a different document. If verification worked by
 * regenerating and comparing, that 2027 transcript would fail — and it
 * would fail in exactly the way a forgery fails, telling the university
 * the document had been altered.
 *
 * So an issued document FREEZES its payload and the signature covers the
 * frozen bytes. Verification is then a pure function of the document and
 * the College's published public key: a university can archive the
 * document, and check it in twenty years, without asking us anything.
 * That property is the whole point of Priority 3, and it is why this is
 * not simply "the transcript endpoint with a PDF button".
 *
 * ────────────────────────────────────────────────────────────────
 * SUPERSEDED IS NOT INVALID
 * ────────────────────────────────────────────────────────────────
 * Issuing a new transcript supersedes the old one. The old one still
 * verifies, because the question a university asks is "did the College
 * issue this document" — not "is this the newest one". Both answers are
 * given, separately, because they are different facts and conflating
 * them would let a stale document read as a fraudulent one.
 */
import { db, ValidationError, NotFoundError } from '../db.js';
import { signCredential, verifyCredential } from './signing.js';
import { newVerificationCode, parseCode } from './awards.js';
import { transcript, competencyAttainment, cpdHistory } from './profile.js';

export const DOCUMENT_TYPES = ['transcript', 'diploma_supplement', 'verification_statement'];

const newId = (p) => `${p}_${crypto.randomUUID()}`;

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Build the content of a document, from live data, at this moment.
 *
 * Called once, at issue. Everything after that reads the frozen copy.
 */
async function composePayload(env, { documentType, userId, now }) {
  const person = await db(env).prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (!person) throw new NotFoundError('Unknown person.');

  const profile = await db(env)
    .prepare('SELECT display_name FROM graduate_profiles WHERE user_id = ?').bind(userId).first();
  const tr = await transcript(env, { userId });

  // The name is taken from the AWARD, not from the profile, whenever
  // there is one. A certificate names a person and that name is the
  // College's record; a display name is something the graduate can edit,
  // and an issued document must not be editable by its subject.
  const holderName = (tr.highestAward && tr.highestAward.holderName)
    || (tr.entries.find((e) => e.award) || {}).award?.holderName
    || (profile && profile.display_name)
    || null;
  if (!holderName) {
    throw new ValidationError(
      'This document names a person, and no name of record exists for them. A document cannot be issued before an award or a recorded name.',
      { holderName: 'Required' },
    );
  }

  const base = {
    documentType,
    issuedOn: new Date(now).toISOString().slice(0, 10),
    holderName,
    institution: 'Worldwide English College — London Campus',
    programme: 'International English Fluency Course',
  };

  if (documentType === 'transcript') {
    return {
      ...base,
      entries: tr.entries.map((e) => ({
        levelId: e.levelId, roman: e.roman, levelName: e.levelName, cefr: e.cefr,
        status: e.status, startedAt: e.startedAt, completedAt: e.completedAt,
        modulesCompleted: e.modulesCompleted, modulesTotal: e.modulesTotal,
        award: e.award ? {
          title: e.award.title, postNominal: e.award.postNominal,
          honour: e.award.honour, honourLabel: e.award.honourLabel,
          credits: e.award.credits, tqtHours: e.award.tqtHours,
          conferredOn: e.award.conferredOn, verificationCode: e.award.verificationCode,
          standing: e.award.standing,
        } : null,
      })),
      creditsAwarded: tr.creditsAwarded,
      tqtHoursAwarded: tr.tqtHoursAwarded,
      levelsEntered: tr.levelsEntered,
      levelsAwarded: tr.levelsAwarded,
    };
  }

  if (documentType === 'diploma_supplement') {
    const comp = await competencyAttainment(env, { userId });
    const cpd = await cpdHistory(env, { userId });
    return {
      ...base,
      highestAward: tr.highestAward ? {
        title: tr.highestAward.awardTitle, postNominal: tr.highestAward.postNominal,
        cefr: tr.highestAward.cefr, honourLabel: tr.highestAward.honourLabel,
        conferredOn: tr.highestAward.conferredOn,
      } : null,
      creditModel: 'WEC Credit — 1 credit represents 10 notional learning hours. An internal credit unit of the College; it is not ECTS, and no equivalence to any national credit framework is claimed.',
      creditsAwarded: tr.creditsAwarded,
      tqtHoursAwarded: tr.tqtHoursAwarded,
      // Carried with its state, so a supplement showing no competency
      // attainment says WHY rather than reading as a graduate who failed
      // every one of them.
      competencies: { state: comp.state, note: comp.note, detail: comp.competencies },
      cpdHours: cpd.totalHours,
      cpdVerifiedHours: cpd.verifiedHours,
      // Said on the document, because a supplement is exactly where a
      // reader looks for it and its absence would be read as an answer.
      recognitionStatement: 'Worldwide English College is not accredited by, or affiliated with, any external accreditation body or awarding organisation. This document records the College\'s own assessment of its own programme.',
    };
  }

  // verification_statement — the durable artefact of a check, for a
  // party who needs to file evidence that they verified something.
  return {
    ...base,
    levelsAwarded: tr.levelsAwarded,
    creditsAwarded: tr.creditsAwarded,
    highestAward: tr.highestAward ? {
      title: tr.highestAward.awardTitle, cefr: tr.highestAward.cefr,
      conferredOn: tr.highestAward.conferredOn,
      verificationCode: tr.highestAward.verificationCode,
    } : null,
    statement: tr.levelsAwarded
      ? 'The College confirms that the person named above holds the award or awards recorded here.'
      : 'The College holds a record for the person named above, and has conferred no award upon them.',
  };
}

/**
 * Issue a document: compose, freeze, sign, record.
 *
 * `expiresDays` reflects how institutions actually use transcripts —
 * many require one issued within the last six months. Expiry means "the
 * College no longer vouches this is current". It never means "this was
 * not issued", and verification says so.
 */
export async function issueDocument(env, {
  documentType, userId, issuedBy = null, expiresDays = null, now = Date.now(),
}) {
  if (!DOCUMENT_TYPES.includes(documentType)) {
    throw new ValidationError(`Unknown document type: ${documentType}.`, { documentType: 'Invalid' });
  }
  if (expiresDays !== null) {
    const d = Number(expiresDays);
    if (!Number.isFinite(d) || d < 1 || d > 3650) {
      throw new ValidationError('A document\'s validity window is between 1 and 3650 days.', { expiresDays: 'Out of range' });
    }
  }

  const payload = await composePayload(env, { documentType, userId, now });
  const id = newId('doc');
  const code = newVerificationCode();

  const signature = await signCredential(env, {
    subjectType: documentType === 'transcript' ? 'transcript' : 'verification',
    subjectId: id, claims: payload, actorId: issuedBy, now,
  });

  // Supersede the previous document of this type FIRST. Doing it after
  // would leave a window in which two documents both claimed to be
  // current, and the window is exactly when a second request arrives.
  const prior = await db(env)
    .prepare("SELECT id FROM issued_documents WHERE user_id = ? AND document_type = ? AND status = 'issued'")
    .bind(userId, documentType).all();

  await db(env)
    .prepare(`INSERT INTO issued_documents
        (id, document_type, user_id, verification_code, payload_json, signature, kid, status, expires_at, issued_by, issued_at)
      VALUES (?,?,?,?,?,?,?, 'issued', ?, ?, ?)`)
    .bind(id, documentType, userId, code, JSON.stringify(payload),
      signature.signature, signature.kid,
      expiresDays === null ? null : new Date(now + Number(expiresDays) * 86400000).toISOString(),
      issuedBy, new Date(now).toISOString())
    .run();

  for (const p of prior.results) {
    await db(env)
      .prepare("UPDATE issued_documents SET status = 'superseded', superseded_by = ? WHERE id = ?")
      .bind(id, p.id).run();
  }

  return {
    id, documentType, verificationCode: code, payload,
    signature: signature.signature, kid: signature.kid, mode: signature.mode,
    assurance: signature.assurance,
    supersededCount: prior.results.length,
    issuedAt: new Date(now).toISOString(),
  };
}

/**
 * Verify an issued document by its code.
 *
 * The signature is checked against the FROZEN payload, so the answer
 * does not change as the graduate progresses. Every outcome is a 200-
 * shaped answer, including "withdrawn" and "no such document" — those
 * are true replies to a fair question, not errors.
 */
export async function verifyDocument(env, { code, now = Date.now() }) {
  const parsed = parseCode(code);
  if (!parsed.ok) {
    return { outcome: 'malformed', document: null,
      message: 'That is not a valid WEC verification code. Codes look like WEC-XXXX-XXXX-XXXXX.' };
  }
  const row = await db(env)
    .prepare('SELECT * FROM issued_documents WHERE verification_code = ?')
    .bind(parsed.code).first();
  if (!row) {
    return { outcome: 'not_found', document: null,
      message: 'No document issued by the College carries that code.' };
  }

  const payload = JSON.parse(row.payload_json);
  const signature = await verifyCredential(env, {
    subjectType: row.document_type === 'transcript' ? 'transcript' : 'verification',
    subjectId: row.id, claims: payload, signature: row.signature, kid: row.kid,
  });

  const expired = row.expires_at ? Date.parse(row.expires_at) <= now : false;
  const outcome = row.status === 'withdrawn' ? 'withdrawn'
    : row.status === 'superseded' ? 'superseded'
      : (expired ? 'expired' : 'valid');

  let supersededBy = null;
  if (row.superseded_by) {
    const next = await db(env).prepare('SELECT verification_code, issued_at FROM issued_documents WHERE id = ?')
      .bind(row.superseded_by).first();
    supersededBy = next ? { verificationCode: next.verification_code, issuedAt: next.issued_at } : null;
  }

  return {
    outcome,
    document: {
      documentType: row.document_type,
      verificationCode: row.verification_code,
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
      ...payload,
    },
    // Reported separately from `outcome`, and this separation matters. A
    // superseded transcript is a document the College genuinely issued —
    // the signature is sound — and telling a university "invalid" would
    // be false. The status describes currency; the signature describes
    // authenticity.
    signature,
    supersededBy,
    withdrawnAt: row.withdrawn_at,
    withdrawnReason: row.withdrawn_reason,
    message: outcome === 'valid' ? null
      : outcome === 'superseded'
        ? 'The College issued this document, and has since issued a newer one of the same kind. This document remains an accurate record of what the College asserted on the date it was issued.'
        : outcome === 'expired'
          ? 'The College issued this document, and its validity window has passed. It remains an accurate record of the date it was issued; it is no longer offered as a current statement.'
          : 'This document has been withdrawn by the College and should not be relied upon.',
  };
}

export async function withdrawDocument(env, { documentId, reason, now = Date.now() }) {
  const why = String(reason || '').trim();
  if (why.length < 5) {
    throw new ValidationError('A reason is required to withdraw an issued document.', { reason: 'Required' });
  }
  const row = await db(env).prepare('SELECT id, status FROM issued_documents WHERE id = ?').bind(documentId).first();
  if (!row) throw new NotFoundError('Unknown document.');
  if (row.status === 'withdrawn') return { documentId, withdrawn: true, changed: false };
  await db(env)
    .prepare("UPDATE issued_documents SET status = 'withdrawn', withdrawn_at = ?, withdrawn_reason = ? WHERE id = ?")
    .bind(new Date(now).toISOString(), why, documentId).run();
  return { documentId, withdrawn: true, changed: true };
}

/** A graduate's own issued documents. */
export async function myDocuments(env, { userId }) {
  const { results } = await db(env)
    .prepare(`SELECT id, document_type AS documentType, verification_code AS verificationCode,
                     status, issued_at AS issuedAt, expires_at AS expiresAt,
                     withdrawn_at AS withdrawnAt, withdrawn_reason AS withdrawnReason
                FROM issued_documents WHERE user_id = ? ORDER BY issued_at DESC`)
    .bind(userId).all();
  // Neither the payload nor the signature is returned in a listing. The
  // listing answers "what have I issued"; fetching one is a separate act.
  return { count: results.length, documents: results };
}

// ---------------------------------------------------------------------
// Institutional verification
// ---------------------------------------------------------------------

/**
 * Register an institution and mint its key.
 *
 * The key is returned ONCE and stored only as a hash. A leaked table of
 * live keys would be a leaked ability to query the register at scale
 * under somebody else's name.
 */
export async function registerInstitution(env, {
  name, kind = 'employer', contactEmail = null, countryCode = null,
  dailyLimit = 500, approvedBy = null, now = Date.now(),
}) {
  const clean = String(name || '').trim();
  if (clean.length < 2) throw new ValidationError('An institution must be named.', { name: 'Required' });
  if (!['employer', 'university', 'government', 'agency'].includes(kind)) {
    throw new ValidationError('Unknown institution kind.', { kind: 'Invalid' });
  }
  const limit = Number(dailyLimit);
  if (!Number.isFinite(limit) || limit < 1 || limit > 100000) {
    throw new ValidationError('A daily limit between 1 and 100000 is required.', { dailyLimit: 'Out of range' });
  }

  const id = newId('inst');
  const key = `wecv_${[...crypto.getRandomValues(new Uint8Array(24))]
    .map((b) => b.toString(16).padStart(2, '0')).join('')}`;
  await db(env)
    .prepare(`INSERT INTO verifying_institutions (id, name, kind, contact_email, country_code, api_key_hash, daily_limit, approved_by, created_at)
              VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(id, clean, kind, contactEmail, countryCode, await sha256Hex(key), limit, approvedBy, new Date(now).toISOString())
    .run();
  return { id, name: clean, kind, apiKey: key, dailyLimit: limit };
}

/**
 * Verify on behalf of a registered institution.
 *
 * Deliberately unlike the public portal, which records nothing about who
 * is checking. The asymmetry is consent: a graduate hands their code to
 * an employer knowing it will be checked, whereas an institution making
 * bulk automated queries is doing something the College should be able
 * to see, attribute and stop.
 */
export async function institutionalVerify(env, { apiKey, code, now = Date.now() }) {
  const inst = await db(env)
    .prepare('SELECT * FROM verifying_institutions WHERE api_key_hash = ?')
    .bind(await sha256Hex(String(apiKey || ''))).first();
  // One answer for an unknown key and a revoked one: distinguishing them
  // tells a holder whether their key was specifically withdrawn.
  if (!inst || inst.status !== 'active') {
    return { ok: false, reason: 'unauthorised', message: 'This API key is not active.' };
  }

  const since = new Date(now - 86400000).toISOString();
  const used = await db(env)
    .prepare('SELECT COUNT(*) AS n FROM institution_checks WHERE institution_id = ? AND checked_at > ?')
    .bind(inst.id, since).first();
  if (used.n >= inst.daily_limit) {
    return {
      ok: false, reason: 'rate_limited',
      message: `This key has made ${used.n} checks in the last 24 hours, which is its agreed limit. The limit exists so that bulk reading of the Register is bounded and visible; contact the College if your volume has genuinely grown.`,
      limit: inst.daily_limit, used: used.n,
    };
  }

  // Awards first, then documents — a checker types whichever code they
  // were given and should not have to know which kind it is.
  const { verifyCode } = await import('./awards.js');
  let result = await verifyCode(env, { code, channel: 'public', now });
  let kind = 'award';
  if (result.outcome === 'not_found' || result.outcome === 'malformed') {
    const doc = await verifyDocument(env, { code, now });
    if (doc.outcome !== 'not_found' && doc.outcome !== 'malformed') { result = doc; kind = 'document'; }
  }

  await db(env)
    .prepare('INSERT INTO institution_checks (id, institution_id, code_attempted, outcome, checked_at) VALUES (?,?,?,?,?)')
    .bind(newId('chk'), inst.id, String(code || '').slice(0, 64), result.outcome, new Date(now).toISOString())
    .run();

  return {
    ok: true, kind, ...result,
    institution: { name: inst.name, kind: inst.kind },
    quota: { limit: inst.daily_limit, used: used.n + 1 },
  };
}

/** What one institution has been reading. */
export async function institutionActivity(env, { institutionId = null, limit = 200 } = {}) {
  const capped = Math.max(1, Math.min(Number(limit) || 200, 1000));
  const { results } = await db(env)
    .prepare(`SELECT c.id, c.institution_id AS institutionId, i.name AS institutionName, i.kind,
                     c.code_attempted AS codeAttempted, c.outcome, c.checked_at AS checkedAt
                FROM institution_checks c JOIN verifying_institutions i ON i.id = c.institution_id
               WHERE (? IS NULL OR c.institution_id = ?)
               ORDER BY c.checked_at DESC LIMIT ?`)
    .bind(institutionId, institutionId, capped).all();
  return { count: results.length, checks: results };
}
