// GET / PATCH /api/staff/cases — the Registrar's queue, and the College's
// own moves on a case: routing it to stage one, stopping the clock,
// resuming it, resetting a date, answering, and closing.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. Two of them, and the second is
// the reason the file is shaped as it is.
//
//   · Migration 020 built `idx_registrar_cases_due` for one question —
//     "the Registrar's morning question, as one seek: what is still
//     live, in the order it falls due" — and nothing ever asked it. An
//     institution that cannot see its own caseload answers the cases it
//     remembers.
//
//   · The conflict rule was published and unenforced. /students/
//     regulations/ says "at every stage the decision passes to somebody
//     who was not part of the last one", and `registrar_cases.decided_by`
//     is a plain foreign key to `users` that would have taken the id of
//     the very person whose decision was under appeal. A rule enforced
//     only by whoever is looking at the screen is not enforced. So the
//     refusal lives in functions/_lib/registrar/cases.js, runs before any
//     other validation on an answer, and this route cannot reach around
//     it: there is no parameter here that names a decider, because the
//     decider is always the session.
//
// WHY THE QUEUE CARRIES THE CONFLICT LIST. A rule that only refuses work
// already done is a rule the Registrar meets as an obstruction. The
// queue reports, beside each case, the accounts that may not hear it —
// so the case is listed to the right person the first time, and the
// refusal below is the backstop rather than the mechanism.
//
// TWO LEVELS OF ACCESS, DELIBERATELY. requireStaff() reaches the queue
// and may ANSWER a case, because E2 gives stage one to "a member of
// academic staff senior to, and other than, the person who took it" and
// that person is staff, not an administrator. Routing, parking,
// resuming, resetting a date and closing are the Registrar's desk and
// the module asserts administrator access for each — the same definition
// of that desk functions/_lib/comms/threads.js uses, for want of an
// office-holder table, rather than a second one invented here.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import {
  registrarQueue, registrarCase, advanceStage, recordDecision, resetAnswerDue,
  parseLimit, parseEnum, KINDS, MATTERS, STAGES,
} from '../../_lib/registrar/cases.js';

/**
 * What the College may do to a case. Escalation and withdrawal are
 * absent on purpose and the refusal below says why: both are the
 * appellant's acts, and an escalation recorded under a staff account is
 * the College appealing to itself.
 */
const ACTIONS = ['route', 'await_information', 'resume', 'set_answer_due', 'decide', 'close'];

/** The appellant's acts, named so the refusal can be specific. */
const LEARNER_ACTIONS = ['escalate', 'withdraw'];

export async function onRequestGet({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const url = new URL(request.url);

    const one = url.searchParams.get('case') || url.searchParams.get('reference');
    if (one) {
      return jsonResponse(await registrarCase(env, { actor: staff, idOrReference: one }));
    }

    const overdueRaw = url.searchParams.get('overdue');
    if (overdueRaw !== null && overdueRaw !== '' && overdueRaw !== 'true' && overdueRaw !== 'false') {
      throw new ValidationError('overdue must be true or false.', { overdue: 'true or false' });
    }

    return jsonResponse(await registrarQueue(env, {
      actor: staff,
      stage: parseEnum(url.searchParams.get('stage'), STAGES, 'stage'),
      kind: parseEnum(url.searchParams.get('kind'), KINDS, 'kind'),
      matter: parseEnum(url.searchParams.get('matter'), MATTERS, 'matter'),
      overdueOnly: overdueRaw === 'true',
      limit: parseLimit(url.searchParams.get('limit')),
    }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }

    // The author of every act here is the session. A body that names a
    // decider is refused rather than ignored — that parameter is the one
    // way the conflict rule could be reached around, and a client built
    // on it would believe the College can nominate who answered.
    for (const key of ['decidedBy', 'decided_by', 'actorId', 'actor_id', 'onBehalfOf']) {
      if (body[key] !== undefined) {
        throw new ValidationError(
          'The author of a decision is the person recording it. There is no parameter naming somebody else.',
          { [key]: 'Not accepted — the author of an act is the session' },
        );
      }
    }

    const target = body.case || body.reference || body.caseId;
    if (!target) {
      throw new ValidationError('Name the case by its reference or id.', { case: 'Required' });
    }

    const action = body.action;
    if (LEARNER_ACTIONS.includes(action)) {
      throw new ValidationError(
        'Escalating an answered case and withdrawing one are the appellant\'s acts, recorded through the learner\'s own route. An escalation entered by the College is the College appealing to itself, and the trail would not show that the learner ever asked.',
        { action: `One of ${ACTIONS.join(', ')}` },
      );
    }
    if (!ACTIONS.includes(action)) {
      throw new ValidationError(`action must be one of ${ACTIONS.join(', ')}.`, { action: `One of ${ACTIONS.join(', ')}` });
    }

    if (action === 'decide') {
      // The refusal that matters runs inside recordDecision(), before any
      // field on this body is looked at a second time.
      return jsonResponse(await recordDecision(env, {
        actor: staff,
        actorRole: body.actorRole ?? null,
        caseId: target,
        outcome: body.outcome,
        decision: body.decision,
        note: body.note ?? null,
      }));
    }

    if (action === 'set_answer_due') {
      return jsonResponse(await resetAnswerDue(env, {
        actor: staff,
        caseId: target,
        answerDue: body.answerDue,
        note: body.note,
      }));
    }

    const toStage = {
      route: 'stage_one',
      await_information: 'awaiting_information',
      close: 'closed',
    }[action] ?? body.toStage;

    if (action === 'resume' && !toStage) {
      throw new ValidationError(
        'Name the stage the case resumes at. It must be the stage it was parked from — a case does not come back at a different rung.',
        { toStage: 'Required — the stage the case was parked from' },
      );
    }

    return jsonResponse(await advanceStage(env, {
      actor: staff,
      actorRole: body.actorRole ?? undefined,
      caseId: target,
      toStage,
      note: body.note,
    }));
  } catch (err) {
    return errorResponse(err);
  }
}
