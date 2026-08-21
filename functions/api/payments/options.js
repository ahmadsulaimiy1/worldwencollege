// GET /api/payments/options — what the College would charge this
// learner, in which currency, and by what means, BEFORE anything is
// created.
//
// The route it stands in front of, POST /api/payments/create-checkout,
// answers all of those questions by inserting a payments row and handing
// the learner to a gateway. Until this endpoint there was no way to ask
// any of them without spending that row — and where no gateway is
// configured the create route marks the row failed, which is correct
// behaviour and a terrible way to discover that the College cannot take
// a card today.
//
// Read first, spend second. The same rule GET /api/student/booking was
// added for.
//
// The subject is the session and there is no parameter for it, by the
// rule functions/api/student/dashboard.js states.

import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { checkoutOptions } from '../../_lib/payments/options.js';

const FOREIGN_SUBJECT_KEYS = ['userId', 'user_id', 'studentId', 'learnerId'];

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);

    for (const key of FOREIGN_SUBJECT_KEYS) {
      if (url.searchParams.has(key)) {
        throw new ValidationError(
          'This endpoint answers for the signed-in learner only and takes no parameter naming a person.',
          { [key]: 'Not accepted — the subject is the session' },
        );
      }
    }

    const country = url.searchParams.get('country');
    if (country && !/^[A-Za-z]{2}$/.test(country)) {
      throw new ValidationError('country must be a two-letter code.', { country: 'Two letters' });
    }
    const currency = url.searchParams.get('currency');
    if (currency && !/^[A-Za-z]{3}$/.test(currency)) {
      throw new ValidationError('currency must be a three-letter code.', { currency: 'Three letters' });
    }

    return jsonResponse(await checkoutOptions(env, {
      user,
      country: country || null,
      currency: currency ? currency.toUpperCase() : null,
    }));
  } catch (err) {
    return errorResponse(err);
  }
}
