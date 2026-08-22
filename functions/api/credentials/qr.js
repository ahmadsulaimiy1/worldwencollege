/**
 * GET /api/credentials/qr?code=WEC-XXXX-XXXX-XXXXX
 *
 * The QR code for a verification code, as SVG.
 *
 * Public and unauthenticated, exactly as the verification portal is: a
 * QR nobody can fetch without an account is a QR nobody scans. It
 * carries no personal data — only the public verification URL, which is
 * the same string printed beside it on the page.
 *
 * The code is NOT looked up. This endpoint answers "what does this
 * string look like as a QR", not "is this award real"; conflating the
 * two would turn an image request into an enumeration oracle that
 * reports which codes exist by whether an image comes back. Verification
 * is /api/verify, which is rate-limited and audited for that reason.
 *
 * The check character is validated, though, because a malformed code
 * cannot be a real one and encoding it would produce a QR that leads a
 * scanner to a "not found" page — a worse answer than a refusal.
 */
import { parseCode } from '../../_lib/registry/awards.js';
import { toSvg } from '../../_lib/registry/qr.js';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  // parseCode() is the register's own reader — check character and all
  // — rather than a second validator here that could drift from it and
  // start accepting codes the register would refuse.
  const parsed = parseCode(url.searchParams.get('code') || '');
  if (!parsed.ok) {
    return new Response('Not a well-formed verification code.', {
      status: 400,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  const code = parsed.code;

  // THE TARGET IS THE SAME FOR EVERY READER, DELIBERATELY. A printed
  // certificate carries one QR for the life of the award, and a code
  // that resolved to a different address depending on who generated the
  // image would be two credentials wearing one number. The check page
  // offers its own editions; the code points at the canonical one.
  const target = `${url.origin}/verify.html?code=${encodeURIComponent(code)}`;

  // The LABEL is what a screen reader announces, and that does belong to
  // the reader. An Arabic graduate record used to hand an Arabic reader
  // a figure announced in English.
  const lang = url.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
  const label = lang === 'ar' ? `تحقّق من الشهادة ${code}` : `Verify award ${code}`;

  // Level Q — about a quarter of the code can be lost and still read.
  // A certificate gets folded, printed badly and photographed at an
  // angle, and the cost of the higher level is a slightly denser image.
  const svg = toSvg(target, { level: 'Q', label });

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      // The image for a given code never changes: the code is permanent
      // and so is the URL it points at.
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}
