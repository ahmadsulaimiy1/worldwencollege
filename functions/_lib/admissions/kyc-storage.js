// Object storage for an applicant's OPTIONAL identity document
// (passport or national ID). See sql/migrations/019-kyc-documents.sql
// for why this exists and what it deliberately does not claim.
//
//   OPT-IN     — nothing in the wizard requires this. An applicant can
//                submit a complete application with no document at
//                all, and the site says so wherever this step appears.
//
//   SECURE     — the bucket is never public. Reading a document goes
//                through an endpoint that authorises the request
//                against the same rule every time: the applicant who
//                uploaded it, or staff. No signed public URL is ever
//                issued — a link that works without a session is a
//                link that keeps working after one ends, and that is
//                the wrong property for a passport scan.
//
//   NOT VERIFIED — uploading a file records that a file was uploaded.
//                It is not run against any identity-verification
//                provider, because none is wired into this build (see
//                docs — the "collect fields, do not fabricate
//                verification" decision this whole feature was scoped
//                to). Every response this module returns is careful to
//                say "uploaded", never "verified".

import { db, newId, ConfigError, ValidationError, NotFoundError } from '../db.js';

const ALLOWED_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
]);
export const MAX_BYTES = 10 * 1024 * 1024; // 10 MiB — a phone photo or a scanned PDF, not a video.
const DOCUMENT_TYPES = ['passport', 'national_id', 'other'];

function bucket(env) {
  if (!env.KYC_DOCUMENTS) {
    throw new ConfigError('R2 binding "KYC_DOCUMENTS" is not configured. See wrangler.toml § r2_buckets.');
  }
  return env.KYC_DOCUMENTS;
}

// user, then document id: a per-applicant erasure request is a prefix
// listing, the same reasoning recording-storage.js's keys use.
function objectKey(userId, docId, ext) {
  return `kyc/${userId}/${docId}.${ext}`;
}

export async function uploadDocument(env, userId, { documentType, contentType, filename, bytes }) {
  const type = DOCUMENT_TYPES.includes(documentType) ? documentType : 'passport';
  const ext = ALLOWED_TYPES.get(contentType);
  if (!ext) {
    throw new ValidationError('Unsupported file type. Upload a PDF, JPEG or PNG.', { file: 'Unsupported file type.' });
  }
  if (!bytes || bytes.byteLength === 0) {
    throw new ValidationError('The uploaded file was empty.', { file: 'The uploaded file was empty.' });
  }
  if (bytes.byteLength > MAX_BYTES) {
    throw new ValidationError(`File is too large — the limit is ${MAX_BYTES / (1024 * 1024)}MB.`, { file: 'File is too large.' });
  }

  const id = newId('kycdoc');
  const key = objectKey(userId, id, ext);
  await bucket(env).put(key, bytes, { httpMetadata: { contentType } });

  await db(env)
    .prepare(`INSERT INTO kyc_documents
      (id, user_id, document_type, object_key, original_filename, content_type, size_bytes)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, userId, type, key, (filename || '').slice(0, 200) || null, contentType, bytes.byteLength)
    .run();

  return { id, documentType: type, filename: filename || null, sizeBytes: bytes.byteLength, uploadedAt: new Date().toISOString() };
}

function rowToDocument(row) {
  return {
    id: row.id,
    documentType: row.document_type,
    filename: row.original_filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    status: row.status,
    uploadedAt: row.uploaded_at,
  };
}

export async function listDocuments(env, userId) {
  const { results } = await db(env)
    .prepare('SELECT * FROM kyc_documents WHERE user_id = ? ORDER BY uploaded_at DESC')
    .bind(userId)
    .all();
  return results.map(rowToDocument);
}

// Scoped to the caller by construction: the row is looked up by
// (id, user_id) together, so there is no id an applicant can pass that
// reads or deletes a document belonging to somebody else.
async function ownedRow(env, userId, docId) {
  const row = await db(env)
    .prepare('SELECT * FROM kyc_documents WHERE id = ? AND user_id = ?')
    .bind(docId, userId)
    .first();
  if (!row) throw new NotFoundError('No such document.');
  return row;
}

export async function deleteDocument(env, userId, docId) {
  const row = await ownedRow(env, userId, docId);
  await bucket(env).delete(row.object_key);
  await db(env).prepare('DELETE FROM kyc_documents WHERE id = ?').bind(row.id).run();
}

// Returns the raw R2 object plus its content type, for an endpoint to
// stream back. The caller (functions/api/admissions/document.js)
// authorises the request before this is ever called.
export async function getDocumentObject(env, userId, docId) {
  const row = await ownedRow(env, userId, docId);
  const object = await bucket(env).get(row.object_key);
  if (!object) throw new NotFoundError('The document record exists but its file is missing.');
  return { object, contentType: row.content_type, filename: row.original_filename };
}
