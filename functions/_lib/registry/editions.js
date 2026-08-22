/* The Editions Register — recording what was published, so a book's QR
 * resolves.
 *
 * ────────────────────────────────────────────────────────────────
 * THE ONE IDEA THIS MODULE IS BUILT AROUND
 * ────────────────────────────────────────────────────────────────
 * An award is issued TO SOMEONE. An edition is issued INTO THE WORLD.
 *
 * So the question a verifier asks is different, and the mechanism has to
 * be. Nobody looks up a book by the name of its holder; they hold a copy
 * and want to know whether its content is the College's. That is answered
 * by a CONTENT DIGEST — a SHA-256 over every word of the edition —
 * compared against the digest of record here.
 *
 * `scripts/publication/identity.mjs` has always computed that digest and
 * PRINTED it, with a QR, into the physical book. What never existed was
 * anywhere that recorded it, so the QR resolved to nothing. This module
 * is the missing half: registering an edition writes the digest down, and
 * verifying one compares against it.
 *
 * ────────────────────────────────────────────────────────────────
 * SUPERSEDED IS NOT INVALID — the same rule as issued documents
 * ────────────────────────────────────────────────────────────────
 * A reader holding the 2026 printing needs to know the College published
 * it. That a 2031 printing now exists is a different fact, and conflating
 * them would let an honest older copy read as a forgery. Both are
 * reported, separately.
 *
 * WHAT IS NOT CLAIMED: content identity, and nothing more. Not authorship;
 * not that a particular physical copy came from the College. The rendered
 * record says so in those words (`publication-record.js`), because a
 * security claim that overstates itself teaches a reader to trust a check
 * that will not hold.
 */
import { db, newId, ValidationError, NotFoundError } from '../db.js';

const DIGEST_RE = /^[0-9a-f]{64}$/;

/** Normalise anything a human might paste: case and surrounding space. */
function normaliseDigest(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Record an edition. The only way a row enters the register.
 *
 * Everything here is already computed at print time by
 * `publicationIdentity()`; this function persists it rather than
 * recalculating, so the register holds exactly what the book carries.
 */
export async function registerEdition(env, {
  title, documentId, contentDigest, issueCode, editionName = null,
  publicationId = null, printIdentifier = null, year = null,
  counts = null, registrations = null, registeredBy = null, now = Date.now(),
}) {
  const cleanTitle = String(title || '').trim();
  if (cleanTitle.length < 2) {
    throw new ValidationError('An edition must be titled.', { title: 'Required' });
  }
  const digest = normaliseDigest(contentDigest);
  if (!DIGEST_RE.test(digest)) {
    throw new ValidationError(
      'A content digest is required, as 64 hexadecimal characters. It is what identifies the edition.',
      { contentDigest: 'Invalid' },
    );
  }
  const docId = String(documentId || '').trim().toUpperCase();
  if (docId.length < 4) {
    throw new ValidationError('A printed Document ID is required — it is what a reader types.', { documentId: 'Required' });
  }
  if (!String(issueCode || '').trim()) {
    throw new ValidationError('An issue code is required, e.g. E01.R00.01.', { issueCode: 'Required' });
  }

  // Registering the SAME content twice is not an error — a rebuild of an
  // unchanged edition is a normal event — but it must not create a second
  // row, because the digest is the edition's identity. The existing record
  // is returned unchanged.
  const existing = await db(env)
    .prepare('SELECT * FROM editions WHERE content_digest = ?').bind(digest).first();
  if (existing) return { ...view(existing), created: false };

  const id = newId('edn');
  await db(env)
    .prepare(`INSERT INTO editions
        (id, title, document_id, content_digest, issue_code, edition_name, publication_id,
         print_identifier, year, counts_json, registrations_json, status, registered_by, registered_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?, 'in-print', ?, ?)`)
    .bind(id, cleanTitle, docId, digest, String(issueCode).trim(), editionName, publicationId,
      printIdentifier, year,
      counts ? JSON.stringify(counts) : null,
      registrations ? JSON.stringify(registrations) : null,
      registeredBy, new Date(now).toISOString())
    .run();

  const row = await db(env).prepare('SELECT * FROM editions WHERE id = ?').bind(id).first();
  return { ...view(row), created: true };
}

/**
 * Verify an edition by its printed Document ID.
 *
 * Every outcome is a true answer to a fair question, never an error —
 * the three-honest-states rule (`SEB §12.2`), in artifact form. When a
 * `candidateDigest` is supplied (a digest computed over the copy in
 * hand), the answer also says whether that copy's CONTENT matches, which
 * is the question the doctrine actually exists to settle.
 */
export async function verifyEdition(env, { documentId, candidateDigest = null } = {}) {
  const docId = String(documentId || '').trim().toUpperCase();
  if (!docId) {
    return { outcome: 'malformed', edition: null,
      message: 'Enter the Document ID printed in the volume, e.g. GQ08-FZ9Q-DQHB-6X8D.' };
  }
  const row = await db(env)
    .prepare('SELECT * FROM editions WHERE document_id = ?').bind(docId).first();
  if (!row) {
    return { outcome: 'not_found', edition: null,
      message: 'No edition in the register carries that Document ID.' };
  }

  const outcome = row.status === 'withdrawn' ? 'withdrawn'
    : row.status === 'superseded' ? 'superseded' : 'valid';

  let supersededBy = null;
  if (row.superseded_by) {
    const next = await db(env)
      .prepare('SELECT document_id, registered_at FROM editions WHERE id = ?')
      .bind(row.superseded_by).first();
    supersededBy = next ? { documentId: next.document_id, registeredAt: next.registered_at } : null;
  }

  // Reported SEPARATELY from `outcome`, and the separation matters: a
  // superseded edition is one the College genuinely published, and
  // telling a reader "invalid" would be false. Status describes currency;
  // the content check describes integrity.
  let content = null;
  if (candidateDigest !== null) {
    const candidate = normaliseDigest(candidateDigest);
    content = !DIGEST_RE.test(candidate)
      ? { checked: false, outcome: 'malformed',
        message: 'That is not a SHA-256 content digest. A digest is 64 hexadecimal characters.' }
      : candidate === row.content_digest
        ? { checked: true, outcome: 'identical',
          message: 'This copy carries the content of the edition of record, unaltered.' }
        : { checked: true, outcome: 'altered',
          message: 'The College published an edition under this Document ID, and this copy\'s content is '
            + 'not it. The copy has been altered, or it is a different edition than it claims.' };
  }

  return {
    outcome,
    edition: view(row),
    content,
    supersededBy,
    withdrawnAt: row.withdrawn_at,
    withdrawnReason: row.withdrawn_reason,
    message: outcome === 'valid' ? null
      : outcome === 'superseded'
        ? 'The College published this edition, and has since published a newer one. It remains an '
          + 'accurate record of what was published on its date.'
        : 'This edition has been withdrawn by the College and should not be relied upon.',
  };
}

/** Mark an edition superseded by a newer one. Never a deletion. */
export async function supersedeEdition(env, { documentId, bySupersedingDocumentId, now = Date.now() }) {
  const older = await db(env).prepare('SELECT id FROM editions WHERE document_id = ?')
    .bind(String(documentId || '').trim().toUpperCase()).first();
  if (!older) throw new NotFoundError('Unknown edition.');
  const newer = await db(env).prepare('SELECT id FROM editions WHERE document_id = ?')
    .bind(String(bySupersedingDocumentId || '').trim().toUpperCase()).first();
  if (!newer) throw new NotFoundError('Unknown superseding edition.');
  if (older.id === newer.id) {
    throw new ValidationError('An edition cannot supersede itself.', { bySupersedingDocumentId: 'Invalid' });
  }
  await db(env)
    .prepare("UPDATE editions SET status = 'superseded', superseded_by = ? WHERE id = ?")
    .bind(newer.id, older.id).run();
  return { documentId, superseded: true, by: bySupersedingDocumentId, at: new Date(now).toISOString() };
}

/** Withdraw an edition. Marked, dated and reasoned — never deleted. */
export async function withdrawEdition(env, { documentId, reason, now = Date.now() }) {
  const why = String(reason || '').trim();
  if (why.length < 5) {
    throw new ValidationError('A reason is required to withdraw an edition.', { reason: 'Required' });
  }
  const row = await db(env).prepare('SELECT id, status FROM editions WHERE document_id = ?')
    .bind(String(documentId || '').trim().toUpperCase()).first();
  if (!row) throw new NotFoundError('Unknown edition.');
  if (row.status === 'withdrawn') return { documentId, withdrawn: true, changed: false };
  await db(env)
    .prepare("UPDATE editions SET status = 'withdrawn', withdrawn_at = ?, withdrawn_reason = ? WHERE id = ?")
    .bind(new Date(now).toISOString(), why, row.id).run();
  return { documentId, withdrawn: true, changed: true };
}

/** The published register — every edition, newest first. */
export async function editionsRegister(env, { limit = 200 } = {}) {
  const capped = Math.max(1, Math.min(Number(limit) || 200, 500));
  const { results } = await db(env)
    .prepare('SELECT * FROM editions ORDER BY registered_at DESC LIMIT ?').bind(capped).all();
  return { count: results.length, editions: results.map(view) };
}

/**
 * What a verification page may show. The fields the edition already
 * prints about itself, and nothing administrative.
 */
function view(row) {
  return {
    title: row.title,
    documentId: row.document_id,
    contentDigest: row.content_digest,
    issueCode: row.issue_code,
    editionName: row.edition_name,
    publicationId: row.publication_id,
    printIdentifier: row.print_identifier,
    year: row.year,
    counts: row.counts_json ? JSON.parse(row.counts_json) : null,
    registrations: row.registrations_json ? JSON.parse(row.registrations_json) : null,
    status: row.status,
    registeredAt: row.registered_at,
  };
}
