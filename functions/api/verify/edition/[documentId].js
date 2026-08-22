// GET /api/verify/edition/<documentId>
//
// PUBLIC, for the same reason the award endpoint is: a reader holding a
// printed volume must be able to check it without an account. This is the
// ARTIFACT half of the Verifiable Document Doctrine (`SEB-D 47`) — where
// the award endpoint answers "did the College issue this, to this person",
// this one answers "is this the genuine edition, unaltered".
//
// Every volume the College prints already carries a Document ID and a QR
// pointing at a verification address. Until the Editions Register existed,
// that QR resolved to nothing — a promise printed into a permanent object
// that could not be kept. This endpoint is the other half of keeping it.
//
// An optional `?digest=` carries a SHA-256 computed over the copy in hand.
// When present the answer also reports whether that copy's CONTENT matches
// the edition of record, which is the question the doctrine exists to
// settle. It is reported SEPARATELY from the edition's status, because a
// superseded edition is one the College genuinely published and calling it
// invalid would be false.
import { jsonResponse, errorResponse } from '../../../_lib/db.js';
import { verifyEdition } from '../../../_lib/registry/editions.js';

export async function onRequestGet({ params, request, env }) {
  try {
    const url = new URL(request.url);
    const candidateDigest = url.searchParams.get('digest');

    const result = await verifyEdition(env, {
      documentId: params.documentId,
      candidateDigest: candidateDigest || null,
    });

    // 200 for every well-formed answer, including "withdrawn" and "no such
    // edition". Those are ANSWERS, not errors — the same rule the award
    // endpoint keeps, and for the same reason: a 404 would make an ordinary
    // negative look like an outage and teach integrators to distrust it.
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
