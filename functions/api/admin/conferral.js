// GET / POST /api/admin/conferral — the Registrar's act.
//
// ─────────────────────────────────────────────────────────────────────
// THE ROUTE THE REGISTER HAD NO BEGINNING WITHOUT
// ─────────────────────────────────────────────────────────────────────
// `conferAward()` writes the chained, signed row that everything else
// in this platform hangs from, and until this file existed nothing in
// functions/api/ called it. The College could compute that a learner
// had met every published condition and had no way to confer the award.
//
// ─────────────────────────────────────────────────────────────────────
// WHY requireAdmin AND NOT requireStaff
// ─────────────────────────────────────────────────────────────────────
// Conferral is the College asserting, permanently and to the world,
// that a named person holds a qualification. It is not a teaching act
// and a tutor does not perform it — the same line the platform draws
// for publishing an examination paper and for registering a verifying
// institution. Marking is `requireStaff`; conferring is not.
//
// Withdrawal and replacement are the same authority for a stronger
// reason: a withdrawal is the College taking a qualification back from
// somebody, and it is published to anybody who checks the code.
//
// ─────────────────────────────────────────────────────────────────────
// AND THERE IS NO OVERRIDE
// ─────────────────────────────────────────────────────────────────────
// The refusal quotes the outstanding conditions and offers no way past
// them. A conferral a Registrar can force past an unmet condition is a
// conferral that will one day be forced, and the whole of this
// College's public position is that its awards mean what the
// regulations say they mean. If a condition is wrong, the instrument is
// amended; the console does not route around it.

import { jsonResponse, errorResponse, readJsonBody, ValidationError, parseLimit } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth/session.js';
import {
  conferralQueue, conferralFor, confer, withdraw, replace,
} from '../../_lib/registry/conferral.js';

const ACTIONS = ['confer', 'withdraw', 'replace'];

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env);
    const url = new URL(request.url);

    // One candidate, read BEFORE the act: the conditions, and the exact
    // wording of what would be written. A Registrar should never learn
    // what a certificate says by conferring it.
    const userId = url.searchParams.get('userId');
    if (userId) {
      return jsonResponse(await conferralFor(env, {
        userId,
        levelId: url.searchParams.get('levelId'),
      }));
    }

    const limit = parseLimit(url.searchParams.get('limit'), { field: 'limit', fallback: 100, max: 500 });
    return jsonResponse(await conferralQueue(env, { limit }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const admin = await requireAdmin(request, env);
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }
    const action = new URL(request.url).searchParams.get('action') || body.action;
    if (!ACTIONS.includes(action)) {
      throw new ValidationError('That is not an act on the register.', { action: `One of: ${ACTIONS.join(', ')}.` });
    }

    if (action === 'confer') {
      if (!body.userId) throw new ValidationError('userId is required.', { userId: 'Required.' });
      const result = await confer(env, {
        actor: admin,
        userId: body.userId,
        levelId: body.levelId,
        citation: body.citation ?? null,
        publicConsent: Boolean(body.publicConsent),
      });
      return jsonResponse(result, { status: 201 });
    }

    if (!body.awardId) throw new ValidationError('awardId is required.', { awardId: 'Required.' });

    if (action === 'withdraw') {
      return jsonResponse(await withdraw(env, { actor: admin, awardId: body.awardId, reason: body.reason }));
    }

    return jsonResponse(await replace(env, {
      actor: admin,
      awardId: body.awardId,
      reason: body.reason,
      changes: body.changes || {},
    }), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
