// GET /api/student/awards — the learner's own conferrals, and the
// certificate the College publishes as following each one.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THIS ROUTE EXISTS, AND WHAT WAS ACTUALLY MISSING
// ─────────────────────────────────────────────────────────────────────
// The digital certificate is one of the most heavily published things
// this College sells. It is itemised on /admissions/tuition/ at 5 per
// cent of the fee — $158.33 of every level — described there as "the
// award itself: the digital certificate, the cryptographic signature on
// it, and a verification service anyone can use, without an account,
// for as long as the College exists"; /admissions/international/
// promises certificates "reissued free for life"; /faq/ says a digital
// certificate follows successful completion.
//
// Everything behind that promise existed. `awards` holds the conferral,
// `conferAward()` signs it with subjectType 'award', `/verify/[code]`
// checks the signature, and `awardHistory()` has always been able to
// list a learner's own.
//
// What did not exist was any route by which the person who paid for it
// could obtain it. `awardHistory()` was exported and called from
// nowhere; there was no /api/student/awards, and no page. A learner
// could be verified by a stranger and could not see their own
// certificate.
//
// ─────────────────────────────────────────────────────────────────────
// THE SIGNATURE TRAVELS WITH THE AWARD, AND SO DOES ITS ABSENCE
// ─────────────────────────────────────────────────────────────────────
// A certificate whose page asserts "cryptographically signed" without
// showing which key signed it is a certificate asserting its own
// trustworthiness. Each award therefore carries its real signature
// facts — the key id, the moment, and whether the key was a development
// key or a managed one — or `null`, which is the true answer for any
// award conferred before the signing layer and must not be dressed up.
// The verification page draws exactly the same distinction and calls it
// "unsigned" rather than "failed".
//
// ─────────────────────────────────────────────────────────────────────
// `userId` IS THE SESSION'S
// ─────────────────────────────────────────────────────────────────────
// Never a parameter, for the reason functions/api/student/dashboard.js
// sets out at length: a learner endpoint that accepts a learner id is a
// learner endpoint that hands somebody else's conferrals to whoever
// guesses an id. A stranger checks an award through /verify/, which is
// public, rate-limited and audited, and which returns only what the
// holder consented to publish.

import { jsonResponse, errorResponse, db } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { awardHistory } from '../../_lib/registry/awards.js';

/**
 * What the College publishes about the certificate itself, in the
 * language asked for.
 *
 * RENDERED RATHER THAN LINKED, and every clause here is a sentence the
 * College already publishes elsewhere — the free reissue, the printed
 * copy being an optional service, the verification being open to
 * anybody without an account. A page that showed a certificate and left
 * the reader to find out separately whether they may print it, whether
 * a reissue costs anything, or who may check it would be answering the
 * easy question.
 */
function publishedTerms(language) {
  const ar = language === 'ar';
  return {
    tuition: ar ? '/ar/admissions/tuition/' : '/admissions/tuition/',
    verify: ar ? '/ar/verify/' : '/verify/',
    register: ar ? '/ar/students/awards/' : '/students/awards/',
    statements: ar
      ? [
        'الشهادةُ الرقميةُ هي الشهادةُ التي يفحصها التحقّق. وهي مشمولةٌ برسوم مستواك، ولا رسمَ عليها الآن ولا لاحقًا.',
        'تُعاد إليك كلّما احتجتَها، مجّانًا، مدى الحياة. وإذا صُحِّح اسمُك، أُعيد إصدارُها بالصيغة المصحّحة، ويبقى الشكلُ الأوّل في السجلّ فتظلّ الشهادةُ القديمةُ قابلةً للتحقّق.',
        'ولأيّ أحدٍ أن يتحقّق منها دون حساب، ما بقيت الكلية.',
        'أمّا النسخةُ المطبوعةُ على ورق القطن، الموقَّعةُ والمختومة، فخدمةٌ اختيارية لها رسمُها المنشور.',
      ]
      : [
        'The digital certificate is the certificate verification checks. It is covered by your level fee; there is no charge for it now or later.',
        'It is reissued whenever you need it, free, for life. Where a name is corrected the certificate is reissued in the corrected form, and the earlier form is kept on the record so an older certificate still verifies.',
        'Anybody may check it without an account, for as long as the College exists.',
        'A printed copy on cotton stock, signed and sealed, is an optional service with a published fee.',
      ],
  };
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const language = new URL(request.url).searchParams.get('lang') === 'ar' ? 'ar' : 'en';
    const history = await awardHistory(env, { userId: user.id });

    // The signature facts, read per award rather than asserted once for
    // the page. Awards conferred before the signing layer have none,
    // and that is a true statement about those records.
    const signed = [];
    for (const award of history.awards) {
      const row = await db(env)
        .prepare(`SELECT s.kid, s.mode, s.signed_at
                    FROM credential_signatures s
                    JOIN awards a ON a.id = s.subject_id
                   WHERE s.subject_type = 'award' AND a.verification_code = ?
                   ORDER BY s.signed_at DESC LIMIT 1`)
        .bind(award.verificationCode)
        .first();
      signed.push({
        ...award,
        signature: row ? { kid: row.kid, mode: row.mode, signedAt: row.signed_at } : null,
        // The two addresses that make a certificate checkable, built
        // here so the page never assembles a verification URL itself
        // and cannot assemble a wrong one.
        verifyPath: `/verify/${encodeURIComponent(award.verificationCode)}`,
        qrPath: `/api/credentials/qr?code=${encodeURIComponent(award.verificationCode)}`,
      });
    }

    return jsonResponse({
      awards: signed,
      highest: history.highest,
      creditsTotal: history.creditsTotal,
      tqtHoursTotal: history.tqtHoursTotal,
      // WHAT CONFERS ONE, for the learner who has none yet — which is
      // every learner mid-way through their first level. An empty list
      // with no sentence under it reads as a fault in the page rather
      // than as an accurate statement about where somebody has got to.
      conferredBy: language === 'ar'
        ? 'تُمنح شهادةُ المستوى حين تُستوفى شروطُ المستوى كلُّها ويُقيَّد المنحُ في السجلّ. وما بقي منها معروضٌ في «أين أقف».'
        : 'A level award is conferred when every condition of that level is met and the conferral is entered in the register. What remains of them is set out on Where I Stand.',
      standingPath: language === 'ar' ? '/ar/my-standing.html' : '/my-standing.html',
      terms: publishedTerms(language),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
