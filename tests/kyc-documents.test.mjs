// Run with: node --experimental-sqlite tests/kyc-documents.test.mjs
//
// The admissions wizard's OPTIONAL identity-document upload
// (functions/_lib/admissions/kyc-storage.js and
// functions/api/admissions/document.js): an applicant who chooses to
// submit a complete application from day one can attach a passport or
// national-ID scan, stored privately and never exposed to anyone but
// the applicant who uploaded it. The emphasis, same as
// tests/recording-storage.test.mjs, is on what must never happen —
// another applicant reading or deleting someone else's document —
// since that is the failure that stays silent in production.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { makeR2 } from './r2-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const { uploadDocument, listDocuments, deleteDocument, getDocumentObject, MAX_BYTES } = await import(loadUrl('functions/_lib/admissions/kyc-storage.js'));
const { onRequestGet: docGet, onRequestPost: docPost, onRequestDelete: docDelete } = await import(loadUrl('functions/api/admissions/document.js'));

function freshEnv() {
  const env = { DB: makeD1(schema), KYC_DOCUMENTS: makeR2() };
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_a', 'clerk', 'sub_a', 'a@example.com', 'student')`).run();
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_b', 'clerk', 'sub_b', 'b@example.com', 'student')`).run();
  return env;
}

const PDF_BYTES = new TextEncoder().encode('%PDF-1.4 fake but non-empty');

// ---------------------------------------------------------------------
// Part 1 — the pure storage logic, no HTTP/auth involved.
// ---------------------------------------------------------------------
{
  const env = freshEnv();

  const uploaded = await uploadDocument(env, 'usr_a', {
    documentType: 'passport', contentType: 'application/pdf', filename: 'passport.pdf', bytes: PDF_BYTES,
  });
  check('uploadDocument: returns the new document id', typeof uploaded.id === 'string' && uploaded.id.startsWith('kycdoc_'));
  check('uploadDocument: response says "uploaded", never claims verification', uploaded.uploadedAt && !('verified' in uploaded));

  const rows = await listDocuments(env, 'usr_a');
  check('listDocuments: the upload shows up', rows.length === 1 && rows[0].id === uploaded.id);
  check('listDocuments: status is "uploaded", not some verified state', rows[0].status === 'uploaded');

  const badType = await uploadDocument(env, 'usr_a', {
    documentType: 'passport', contentType: 'application/zip', filename: 'x.zip', bytes: PDF_BYTES,
  }).then(() => null).catch((e) => e);
  check('uploadDocument: rejects an unsupported file type', badType && badType.name === 'ValidationError');

  const empty = await uploadDocument(env, 'usr_a', {
    documentType: 'passport', contentType: 'application/pdf', filename: 'empty.pdf', bytes: new Uint8Array(0),
  }).then(() => null).catch((e) => e);
  check('uploadDocument: rejects an empty file', empty && empty.name === 'ValidationError');

  const tooBig = await uploadDocument(env, 'usr_a', {
    documentType: 'passport', contentType: 'application/pdf', filename: 'huge.pdf', bytes: new Uint8Array(MAX_BYTES + 1),
  }).then(() => null).catch((e) => e);
  check('uploadDocument: rejects a file over the size limit', tooBig && tooBig.name === 'ValidationError');

  const unknownType = await uploadDocument(env, 'usr_a', {
    documentType: 'not_a_real_type', contentType: 'image/png', filename: 'x.png', bytes: PDF_BYTES,
  });
  check('uploadDocument: an unrecognised documentType falls back to "passport" rather than erroring', unknownType.documentType === 'passport');

  // Cross-applicant isolation — the whole point of the ownedRow() scoping.
  // (usr_a already has 2 documents at this point: the passport upload
  // above, plus the fallback-typed one from the previous check.)
  await uploadDocument(env, 'usr_b', { documentType: 'national_id', contentType: 'image/jpeg', filename: 'id.jpg', bytes: PDF_BYTES });
  const aDocs = await listDocuments(env, 'usr_a');
  const bDocs = await listDocuments(env, 'usr_b');
  check('listDocuments: applicant A never sees applicant B\'s documents', aDocs.every((d) => bDocs.every((bd) => bd.id !== d.id)) && aDocs.length === 2 && bDocs.length === 1);

  const stolenRead = await getDocumentObject(env, 'usr_b', uploaded.id).then(() => null).catch((e) => e);
  check('getDocumentObject: applicant B cannot read applicant A\'s document by id', stolenRead && stolenRead.name === 'NotFoundError');

  const stolenDelete = await deleteDocument(env, 'usr_b', uploaded.id).then(() => 'deleted').catch((e) => e);
  check('deleteDocument: applicant B cannot delete applicant A\'s document', stolenDelete instanceof Error && stolenDelete.name === 'NotFoundError');
  check('deleteDocument: the document survives the attempted cross-applicant delete', (await listDocuments(env, 'usr_a')).length === 2);

  const { object, contentType } = await getDocumentObject(env, 'usr_a', uploaded.id);
  check('getDocumentObject: the owner can read their own document back', contentType === 'application/pdf');
  const bodyBytes = object.body instanceof Uint8Array ? object.body : new Uint8Array(await object.arrayBuffer());
  check('getDocumentObject: the stored bytes round-trip intact', Buffer.from(bodyBytes).equals(Buffer.from(PDF_BYTES)));

  await deleteDocument(env, 'usr_a', uploaded.id);
  check('deleteDocument: the owner can delete their own document', (await listDocuments(env, 'usr_a')).length === 1);
}

// ---------------------------------------------------------------------
// Part 2 — the HTTP endpoints, with a REAL signed session token (same
// technique tests/admissions-wizard.test.mjs Part 2 uses).
// ---------------------------------------------------------------------
{
  const b64url = (bytes) => Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

  const kp = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });

  async function token(claims) {
    const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
    const now = Math.floor(Date.now() / 1000);
    const p = enc({ iat: now - 5, exp: now + 600, ...claims });
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
    return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
  }

  const env = freshEnv();
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_c', 'clerk', 'sub_c', 'c@example.com', 'student')`).run();
  env.CLERK_JWKS_URL = 'https://stub.clerk.accounts.dev/.well-known/jwks.json';
  const goodToken = await token({ sub: 'sub_c', email: 'c@example.com', email_verified: true });

  const noAuthList = await docGet({ request: new Request('https://x/api/admissions/document'), env });
  check('GET document: 401 with no Authorization header', noAuthList.status === 401);

  const emptyList = await docGet({ request: new Request('https://x/api/admissions/document', { headers: { authorization: `Bearer ${goodToken}` } }), env });
  const emptyBody = await emptyList.json();
  check('GET document (list): 200 with an empty list before any upload', emptyList.status === 200 && Array.isArray(emptyBody.documents) && emptyBody.documents.length === 0);
  check('GET document (list): reports the size cap for the frontend to enforce client-side', emptyBody.maxBytes === MAX_BYTES);

  const postResp = await docPost({
    request: new Request('https://x/api/admissions/document', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${goodToken}`,
        'content-type': 'application/pdf',
        'x-kyc-document-type': 'passport',
        'x-kyc-filename': 'passport.pdf',
      },
      body: PDF_BYTES,
    }),
    env,
  });
  const postBody = await postResp.json();
  check('POST document: 201 on a valid upload', postResp.status === 201);
  check('POST document: response never claims verification', !('verified' in postBody) && postBody.filename === 'passport.pdf');

  const noAuthPost = await docPost({
    request: new Request('https://x/api/admissions/document', {
      method: 'POST',
      headers: { 'content-type': 'application/pdf', 'x-kyc-document-type': 'passport' },
      body: PDF_BYTES,
    }),
    env,
  });
  check('POST document: 401 with no Authorization header', noAuthPost.status === 401);

  const badTypeResp = await docPost({
    request: new Request('https://x/api/admissions/document', {
      method: 'POST',
      headers: { authorization: `Bearer ${goodToken}`, 'content-type': 'application/zip', 'x-kyc-document-type': 'passport' },
      body: PDF_BYTES,
    }),
    env,
  });
  check('POST document: 422 on an unsupported file type', badTypeResp.status === 422);

  const listAfter = await docGet({ request: new Request('https://x/api/admissions/document', { headers: { authorization: `Bearer ${goodToken}` } }), env });
  const listAfterBody = await listAfter.json();
  check('GET document (list): the upload now shows up', listAfterBody.documents.length === 1 && listAfterBody.documents[0].id === postBody.id);

  const getOne = await docGet({ request: new Request(`https://x/api/admissions/document?id=${postBody.id}`, { headers: { authorization: `Bearer ${goodToken}` } }), env });
  check('GET document ?id=: 200, streams the file back', getOne.status === 200 && getOne.headers.get('content-type') === 'application/pdf');
  check('GET document ?id=: never cached at a shared layer', getOne.headers.get('cache-control') === 'private, no-store');

  // A second applicant must not be able to read the first's document,
  // even knowing its id — the auth boundary, not just the storage layer.
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_d', 'clerk', 'sub_d', 'd@example.com', 'student')`).run();
  const otherToken = await token({ sub: 'sub_d', email: 'd@example.com', email_verified: true });
  const stolenGet = await docGet({ request: new Request(`https://x/api/admissions/document?id=${postBody.id}`, { headers: { authorization: `Bearer ${otherToken}` } }), env });
  check('GET document ?id=: 404 for a different applicant, not the file', stolenGet.status === 404);

  const stolenDelete = await docDelete({ request: new Request(`https://x/api/admissions/document?id=${postBody.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${otherToken}` } }), env });
  check('DELETE document: 404 for a different applicant, document untouched', stolenDelete.status === 404);
  const stillThere = await docGet({ request: new Request('https://x/api/admissions/document', { headers: { authorization: `Bearer ${goodToken}` } }), env });
  check('DELETE document (cross-applicant attempt): the real owner still has it', (await stillThere.json()).documents.length === 1);

  const deleteNoId = await docDelete({ request: new Request('https://x/api/admissions/document', { method: 'DELETE', headers: { authorization: `Bearer ${goodToken}` } }), env });
  check('DELETE document: 422 when ?id= is missing', deleteNoId.status === 422);

  const realDelete = await docDelete({ request: new Request(`https://x/api/admissions/document?id=${postBody.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${goodToken}` } }), env });
  check('DELETE document: 200 for the real owner', realDelete.status === 200);
  const afterDelete = await docGet({ request: new Request('https://x/api/admissions/document', { headers: { authorization: `Bearer ${goodToken}` } }), env });
  check('DELETE document: gone from the list afterwards', (await afterDelete.json()).documents.length === 0);
}

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
