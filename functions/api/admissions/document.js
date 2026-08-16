// GET/POST/DELETE /api/admissions/document
// The applicant's own optional identity-document upload. No id/user
// parameter on any verb identifies someone other than the caller —
// functions/_lib/admissions/kyc-storage.js scopes every read and
// delete to (document id, caller's user id) together, so this
// endpoint can never reach another applicant's document.
//
//   GET  (no query)   — list the caller's uploaded documents (metadata only).
//   GET  ?id=<docId>  — stream that one document back to the caller.
//   POST               — upload a new document. Body is the raw file
//                         bytes; `content-type` and `x-kyc-document-type`
//                         (passport|national_id|other) headers describe
//                         it, and `x-kyc-filename` (optional) carries
//                         the original filename for display later.
//   DELETE ?id=<docId> — remove a document before submission.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { uploadDocument, listDocuments, deleteDocument, getDocumentObject, MAX_BYTES } from '../../_lib/admissions/kyc-storage.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return jsonResponse({ documents: await listDocuments(env, user.id), maxBytes: MAX_BYTES });

    const { object, contentType, filename } = await getDocumentObject(env, user.id, id);
    return new Response(object.body, {
      headers: {
        'content-type': contentType,
        'content-disposition': `inline; filename="${(filename || 'document').replace(/"/g, '')}"`,
        // Never cached at a shared layer — this is a private document,
        // not a static asset.
        'cache-control': 'private, no-store',
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const bytes = await request.arrayBuffer();
    const result = await uploadDocument(env, user.id, {
      documentType: request.headers.get('x-kyc-document-type') || 'passport',
      contentType: request.headers.get('content-type') || '',
      filename: request.headers.get('x-kyc-filename') || '',
      bytes,
    });
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return jsonResponse({ error: 'ValidationError', message: 'id is required.' }, { status: 422 });
    await deleteDocument(env, user.id, id);
    return jsonResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err);
  }
}
