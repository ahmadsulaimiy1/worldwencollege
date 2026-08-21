// GET / POST /api/student/cases — the learner's own appeals, complaints,
// withdrawals, deferrals and transfers, and the three acts that are
// theirs alone: opening one, escalating one, and withdrawing one.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. /students/regulations/ has told
// every reader since 17 August 2026 that they may appeal, and the only
// route by which anybody could act on that sentence was an email address
// on the handbook page. An appeal that exists as an inbox has no
// reference the learner can quote, no recorded stage, no date the answer
// is owed by, and no trail showing who heard it — which is to say it has
// none of the four things decision E2 actually promises.
//
// THERE IS NO userId PARAMETER, ANYWHERE, ON EITHER METHOD.
// functions/api/student/dashboard.js states the rule for this whole
// surface: no id parameter is accepted, "deliberately, so this endpoint
// can never be used to look up another student's data". A case record is
// a stronger thing than a lookup — it carries an allegation, a stage and
// a determination against a named person — so the parameters that would
// aim it at somebody else are REFUSED rather than ignored, by the rule
// functions/api/announcements/index.js gives: a silently dropped
// parameter is how a client gets built on an authorisation model the
// server never had.
//
// The subject of a case is the session. The module enforces that too, so
// the guarantee does not depend on this file being the only caller.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import {
  learnerCases, learnerCase, openCase, escalateCase, withdrawCase, parseLimit,
} from '../../_lib/registrar/cases.js';

/**
 * The parameters that would make this endpoint about somebody else.
 * Refused on both methods, in both the query string and the body.
 */
const FOREIGN_SUBJECT_KEYS = ['userId', 'user_id', 'studentId', 'learnerId', 'subjectId', 'onBehalfOf'];

/** Acts that belong to the appellant. Anything else is the College's. */
const ACTIONS = ['open', 'escalate', 'withdraw'];

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);

    for (const key of FOREIGN_SUBJECT_KEYS) {
      if (url.searchParams.has(key)) {
        throw new ValidationError(
          'This endpoint answers for the signed-in learner only and takes no parameter naming a person.',
          { [key]: 'Not accepted — the subject of a case is the session' },
        );
      }
    }

    // One case, by the reference the learner was given or by its id. A
    // case belonging to somebody else answers exactly as a reference
    // that was never issued does — see the module.
    // The reader's own account setting is the default and `?language=`
    // overrides it for this request only — the same rule, and the same
    // reason, as functions/api/announcements/index.js. What varies is
    // the PUBLISHED text of the instrument, which the College publishes
    // in both languages; the audit trail stays in the words each entry
    // was written in.
    const language = url.searchParams.get('language');

    const one = url.searchParams.get('case') || url.searchParams.get('reference');
    if (one) {
      return jsonResponse(await learnerCase(env, { user, idOrReference: one, language }));
    }

    const limit = parseLimit(url.searchParams.get('limit'));
    return jsonResponse(await learnerCases(env, { user, limit, language }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }
    for (const key of FOREIGN_SUBJECT_KEYS) {
      if (body[key] !== undefined) {
        throw new ValidationError(
          'A case is opened about the person opening it. There is no parameter for whose case it is.',
          { [key]: 'Not accepted — the subject of a case is the session' },
        );
      }
    }
    // The College's own moves are not reachable from here. Naming one
    // gets a refusal that says which desk performs it, rather than a
    // generic "unknown action" that leaves a client author guessing
    // whether they got the spelling wrong.
    if (body.stage !== undefined || body.toStage !== undefined || body.outcome !== undefined) {
      throw new ValidationError(
        'Routing a case, answering it and closing it are the Registrar\'s acts, recorded through the Registrar\'s own route. A learner opens a case, escalates an answered one, or withdraws it.',
        { action: `One of ${ACTIONS.join(', ')}` },
      );
    }

    const action = body.action === undefined ? 'open' : body.action;
    if (!ACTIONS.includes(action)) {
      throw new ValidationError(`action must be one of ${ACTIONS.join(', ')}.`, { action: `One of ${ACTIONS.join(', ')}` });
    }

    if (action === 'open') {
      const created = await openCase(env, {
        actor: user,
        kind: body.kind,
        matter: body.matter,
        summary: body.summary,
        detail: body.detail ?? null,
        levelId: body.levelId ?? null,
        enrolmentId: body.enrolmentId ?? null,
      });
      return jsonResponse(created, { status: 201 });
    }

    const target = body.case || body.reference || body.caseId;
    if (!target) {
      throw new ValidationError('Name the case by its reference.', { case: 'Required' });
    }

    if (action === 'escalate') {
      // E2: "If stage one does not resolve it, the Senate reviews the
      // decision and the way it was reached." The learner is the one who
      // decides that it did not resolve it.
      return jsonResponse(await escalateCase(env, { actor: user, caseId: target, note: body.note }));
    }

    return jsonResponse(await withdrawCase(env, { actor: user, caseId: target, reason: body.reason }));
  } catch (err) {
    return errorResponse(err);
  }
}
