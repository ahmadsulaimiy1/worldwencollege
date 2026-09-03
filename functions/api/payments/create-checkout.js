// POST /api/payments/create-checkout
// Body: { levelId, currency?, gateway?, promoCode?, scholarshipId?,
// language?, country? } for a single-level payment,
// { fullProgramme: true, … } for a full-programme payment (Executive
// Decision #1 — progressive unlocking: this creates ONE payment for all
// six levels, but enrolment still unlocks level by level as each is
// completed, via functions/_lib/student/progression.js), or
// { instalmentPlanId, … } to pay the next instalment of a plan created
// via POST /api/payments/instalment-plan (Executive Decision #5).
// Exactly one of the three.
//
// Requires auth — a payment always belongs to a real user account
// (created at Step 4 of admissions, via Clerk), never an anonymous
// applicant. Full contract in docs/api-reference.md.
//
// The price, the discount, the currency, the gateway choice and the
// pending row are all decided in functions/_lib/payments/checkout.js,
// where they can be exercised without a live gateway. What is left here
// is the one thing that genuinely needs the network: asking the gateway
// for a checkout session, and marking the row failed if it refuses.

import { jsonResponse, errorResponse, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { createCheckout } from '../../_lib/payments/router.js';
import {
  priceCheckout, openPayment, markPaymentFailed, markPaymentProcessing, returnAddresses,
} from '../../_lib/payments/checkout.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    const quote = await priceCheckout(env, { user, body });
    const paymentId = await openPayment(env, { user, quote });

    const origin = new URL(request.url).origin;
    const { successUrl, cancelUrl } = returnAddresses(origin, {
      language: body.language, paymentId,
    });

    let checkoutUrl, providerRef;
    try {
      ({ checkoutUrl, providerRef } = await createCheckout(quote.gatewayName, {
        amountMinor: quote.amountMinor,
        currency: quote.currencyCode,
        reference: paymentId,
        customerEmail: user.email,
        successUrl,
        cancelUrl,
        metadata: {
          description: quote.description,
          levelId: quote.level ? quote.level.id : null,
          currencyDecimalPlaces: quote.currency.decimal_places,
        },
      }, env));
    } catch (err) {
      await markPaymentFailed(env, paymentId, err.message || err);
      throw err;
    }

    await markPaymentProcessing(env, paymentId, providerRef);

    return jsonResponse({
      paymentId, checkoutUrl, gateway: quote.gatewayName,
      currency: quote.currencyCode, amountMinor: quote.amountMinor,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
