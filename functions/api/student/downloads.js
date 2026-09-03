// GET /api/student/downloads — everything the College has issued or
// licensed to this learner, from one address.
//
// ─────────────────────────────────────────────────────────────────────
// WHY A FIFTH PAGE RATHER THAN A LINK ON THE OTHER FOUR
// ─────────────────────────────────────────────────────────────────────
// The College gives a learner five different kinds of file and they
// live in four places: certificates on /my-award.html, transcripts and
// supplements on /my-record.html, invoices and receipts on
// /my-account.html, and the volumes an enrolment unlocks on
// /press/library/. Every one of those is the right home for its own
// subject and none of them is the answer to the question a learner
// actually asks, which is "what has the College given me, and where is
// it".
//
// This route answers that question and nothing else. It ISSUES nothing
// and it CHANGES nothing: every item is a pointer at the surface that
// owns it, so there is exactly one place each kind of file is created
// and one place it is explained. A download centre that started issuing
// its own transcripts would be a second implementation of issuance, and
// the two would eventually disagree about what a transcript contains.
//
// ─────────────────────────────────────────────────────────────────────
// AND THE IDENTITY BLOCK IS NOT DECORATION
// ─────────────────────────────────────────────────────────────────────
// /students/examinations/ § II rests the whole of the College's answer
// to online identity on one sentence: "Every assessment is sat under
// the identity the College holds from admission, and that is the name
// that goes on the award." A learner has never been able to SEE that
// identity — what name the College holds, since when, and against which
// enrolment. `identity` here is that, and it carries the published
// sentence with it rather than leaving a card to imply something
// stronger. It is not a government document and does not present as
// one.
//
// The verification statement is what makes it more than a printed
// assertion: `issued_documents` already holds that type, signed and
// checkable by anyone, and for a learner with no award it reads "The
// College holds a record for the person named above, and has conferred
// no award upon them" — which is precisely a proof of registration.
// Nothing new was invented to make an identity page honest.

import { jsonResponse, errorResponse, db } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { awardHistory } from '../../_lib/registry/awards.js';
import { myDocuments } from '../../_lib/registry/documents.js';
import { buildStudentFinance } from '../../_lib/student/finance.js';

/**
 * THE LIBRARY IS POINTED AT, NOT COPIED.
 *
 * data/library.json is the catalogue and /press/library/ renders it:
 * sixteen volumes, each with its access rule, its note in both
 * languages, its extent and its size. Reproducing any of that here
 * would be a second catalogue, and the day a volume is added or moved
 * between open and enrolment-locked the two would disagree — with this
 * one, the copy nobody remembers to update, being the one a learner
 * reads.
 *
 * So this shelf carries a route and whether the learner's enrolment
 * opens the locked half, and nothing else. The count is deliberately
 * null for the same reason.
 */
const LIBRARY_INDEX = '/press/library/';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const ar = new URL(request.url).searchParams.get('lang') === 'ar';
    const path = (en, arabic) => (ar ? arabic : en);

    // ── WHO THE COLLEGE HOLDS THIS PERSON AS ──────────────────────
    const account = await db(env)
      .prepare(`SELECT preferred_name, email, created_at FROM users WHERE id = ?`)
      .bind(user.id).first();

    const enrolments = (await db(env)
      .prepare(`SELECT e.id, e.level_id AS levelId, e.status, e.started_at AS startedAt,
                       e.completed_at AS completedAt, l.roman, l.name, l.cefr
                  FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
                 WHERE e.user_id = ? ORDER BY e.level_id`)
      .bind(user.id).all()).results;

    const live = enrolments.find((e) => e.status === 'active') || null;

    const history = await awardHistory(env, { userId: user.id });
    const conferred = history.awards.filter((a) => a.status === 'conferred');

    // The name on an award is the name that was held when it was
    // conferred, and it is the register's rather than the account's.
    // Where the two differ the identity block shows BOTH, because a
    // learner whose name was corrected needs to know which form an
    // older certificate carries — /admissions/international/ promises
    // the earlier form is kept precisely so it still verifies.
    const heldName = conferred.length ? conferred[conferred.length - 1].holderName : null;

    const documents = await myDocuments(env, { userId: user.id });

    let finance = null;
    try {
      finance = await buildStudentFinance(env, user.id);
    } catch (err) {
      // A learner with no payment record is not an error, and a
      // download centre that 500ed because somebody had never paid
      // would be a download centre nobody could open in their first
      // week. The absence is reported as an absence.
      finance = null;
    }

    // `payments` is one entry per payment, each carrying its own
    // invoice reference and — where one was issued — its receipt
    // number. Items 12 and 13 of the portal register are therefore the
    // same list read twice rather than two lists: an invoice is what
    // was billed and a receipt is the acknowledgement of the same
    // payment, and splitting them here would invent a second ledger.
    const payments = finance && Array.isArray(finance.payments) ? finance.payments : [];

    return jsonResponse({
      identity: {
        name: account ? account.preferred_name : null,
        nameOnAward: heldName,
        // Both forms are shown only where they actually differ; equal
        // strings would read as the College holding two names.
        nameDiffers: Boolean(heldName && account && heldName !== account.preferred_name),
        email: account ? account.email : null,
        heldSince: account ? account.created_at : null,
        currentLevel: live
          ? { levelId: live.levelId, roman: live.roman, name: live.name, cefr: live.cefr, startedAt: live.startedAt }
          : null,
        enrolments: enrolments.map((e) => ({
          levelId: e.levelId, roman: e.roman, name: e.name, cefr: e.cefr,
          status: e.status, startedAt: e.startedAt, completedAt: e.completedAt,
        })),
        // The published sentence, carried rather than paraphrased. See
        // the head of this file.
        statement: ar
          ? 'يُؤدَّى كلُّ تقييمٍ تحت الهويّة التي تحملها الكليةُ عنك منذ القبول، وهي الاسمُ الذي يُكتب على الشهادة.'
          : 'Every assessment is sat under the identity the College holds from admission, and that is the name that goes on the award.',
        source: path('/students/examinations/#identity', '/ar/students/examinations/#identity'),
        // Said plainly, so a card that looks like a card is not mistaken
        // for something it is not.
        caveat: ar
          ? 'هذه بطاقةُ الكلية عنك، لا وثيقةَ هويّةٍ حكومية، ولا تُغني عن أيّ منها.'
          : 'This is the College\'s record of you. It is not a government identity document and does not stand in for one.',
      },

      // ── THE FOUR SHELVES ────────────────────────────────────────
      // Each is a pointer at the surface that owns it. Nothing here
      // issues, and nothing here explains what the owning page
      // explains.
      shelves: [
        {
          id: 'certificates',
          count: conferred.length,
          route: path('/my-award.html', '/ar/my-award.html'),
          items: conferred.map((a) => ({
            title: a.awardTitle,
            subtitle: a.honourLabel,
            subtitleAr: a.honourLabelAr,
            at: a.conferredOn,
            code: a.verificationCode,
            href: path(`/verify/${encodeURIComponent(a.verificationCode)}`,
              `/ar/verify/${encodeURIComponent(a.verificationCode)}`),
          })),
        },
        {
          id: 'documents',
          count: (documents.documents || []).length,
          route: path('/my-record.html', '/ar/my-record.html'),
          items: (documents.documents || []).map((d) => ({
            title: d.documentType,
            subtitle: d.status,
            at: d.issuedAt,
            code: d.verificationCode,
            href: path(`/verify/document/${encodeURIComponent(d.verificationCode)}`,
              `/ar/verify/document/${encodeURIComponent(d.verificationCode)}`),
          })),
          // WHAT CAN BE ISSUED, named rather than left to be discovered
          // on another page. The learner is told the three exist and
          // sent to the one surface that issues them.
          issuable: ['transcript', 'diploma_supplement', 'verification_statement'],
        },
        {
          id: 'finance',
          count: payments.length,
          route: path('/my-account.html', '/ar/my-account.html'),
          items: payments.slice(0, 24).map((p) => ({
            title: p.levelName ? `${p.kind} — ${p.levelName}` : p.kind,
            titleAr: p.levelNameAr ? `${p.kind} — ${p.levelNameAr}` : null,
            subtitle: p.status,
            at: p.confirmedAt || p.createdAt,
            // The receipt number where one was issued, and null where
            // none was. A page that printed the payment id in a column
            // headed "receipt" would be inventing receipts.
            code: p.receiptNumber || null,
            href: null,
            id: p.id,
            reference: p.invoiceRef || null,
          })),
          receipts: payments.filter((p) => p.receiptNumber).length,
          unavailable: finance === null,
        },
        {
          id: 'library',
          // The count is not asserted here. /press/library/ is the
          // catalogue and knows what it holds; a number copied into
          // this payload would be a second catalogue drifting from the
          // first the day a volume is added.
          count: null,
          route: path(LIBRARY_INDEX, '/ar/press/library/'),
          items: [],
          enrolled: enrolments.some((e) => e.status !== 'withdrawn'),
        },
      ],
    });
  } catch (err) {
    return errorResponse(err);
  }
}
