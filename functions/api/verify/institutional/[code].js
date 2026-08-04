/**
 * GET /api/verify/institutional/:code
 *
 * The Employer & University Verification Portal's API, answering across
 * the three layers of the Principle of Institutional Verification.
 *
 * Public and unauthenticated, by the same rule as /api/verify: a
 * verification service a checker must register to use is a verification
 * service nobody uses. The registered-institution endpoint
 * (/api/institutional/verify) is a different product for a different
 * caller — it identifies the institution and records every check
 * against it, which is what makes bulk verification accountable. This
 * one answers anybody holding a code, and records the check WITHOUT
 * recording who asked.
 *
 * The response is deliberately verbose. An employer is making a
 * decision about a person, and a verification that answers in one word
 * gives them nothing to act on when the answer is complicated — which
 * is precisely when they most need something to act on.
 */
import { institutionalVerification } from '../../../_lib/registry/institutional-verification.js';

export async function onRequestGet({ request, params, env }) {
  const code = decodeURIComponent(params.code || '');
  const url = new URL(request.url);
  // 'qr' when the verifier arrived by scanning. Recorded because the
  // College is entitled to know how its credentials are being checked;
  // it identifies a channel, never a person.
  const channel = url.searchParams.get('via') === 'qr' ? 'qr' : 'public';

  const result = await institutionalVerification(env, { code, channel });

  return new Response(JSON.stringify(result), {
    // 200 even when the code is unknown. A 404 would let a caller
    // enumerate the register by status code alone, without reading a
    // body, and the answer "no award carries that code" is a successful
    // verification rather than a failed request.
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Never cached. A withdrawal must take effect the moment it is
      // recorded, and a cached "verified" outliving a revocation is the
      // one caching bug this endpoint cannot afford.
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
