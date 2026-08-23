// GET / POST /api/student/examination — the candidate's own side of the
// level examination: what they are entered for, opening the paper,
// submitting it, and what the College published about how it is run.
//
// `userId` IS NEVER TAKEN FROM A REQUEST PARAMETER. It is the session's,
// exactly as functions/api/student/dashboard.js sets out: a learner
// endpoint that accepts a learner id is a learner endpoint that returns
// somebody else's academic record to whoever guesses an id.
//
// WHY THE PUBLISHED PROCEDURE TRAVELS WITH EVERY RESPONSE. A candidate
// opens this screen on the worst day of their year — a dropped
// connection, a clock they think has run out, a submission they are not
// sure landed. The rules that answer those are on
// /students/examinations/, and a page that made them go and find it
// would be a page that answers the easy question and abandons the hard
// one. `procedure` is the instrument's own figures, in the reader's own
// language, so the surface prints the rule rather than paraphrasing it.
//
// THERE IS NO ENTRY ACT HERE, DELIBERATELY. § I · ENTRY: "You are
// entered by finishing the teaching. There is no entry form, no
// examination fee and no closing date." Entry follows the ten modules
// and a member of academic staff confirming it, so it lives on
// /api/staff/examinations. A button here would be a form for a thing
// the College says has no form.

import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import {
  sittingsFor, openPaper, submitPaper, publishedProcedure, papersPublished,
} from '../../_lib/academic/examinations.js';
import { db } from '../../_lib/db.js';

function languageOf(request) {
  const asked = new URL(request.url).searchParams.get('lang');
  return asked === 'ar' ? 'ar' : 'en';
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const language = languageOf(request);

    const sittings = await sittingsFor(env, { userId: user.id });
    const papers = await papersPublished(env);

    const enrolments = (await db(env)
      .prepare(`SELECT e.level_id AS levelId, e.status, l.roman, l.name
                  FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
                 WHERE e.user_id = ? ORDER BY e.level_id`)
      .bind(user.id).all()).results;

    return jsonResponse({
      sittings,
      // Per level the learner is actually enrolled at — not all six.
      // A candidate at Level I is not "awaiting five examinations";
      // they simply have not reached them, and listing five would be a
      // report of the College's structure dressed as a report of their
      // position.
      levels: enrolments.map((e) => ({
        levelId: e.levelId,
        roman: e.roman,
        name: e.name,
        enrolmentStatus: e.status,
        paperPublished: Boolean(papers[e.levelId]),
        // The distinction CLAUDE.md § 5 exists to protect: where the
        // College has set no paper, that is the College's outstanding
        // work and the sentence says so rather than implying the
        // candidate has failed to sit something.
        note: papers[e.levelId]
          ? null
          : (language === 'ar'
            ? 'لم تنشر الكلية بعد ورقة امتحان لهذا المستوى. لا شيء عليك فعله.'
            : 'The College has not yet published an examination paper for this level. There is nothing outstanding with you.'),
      })),
      procedure: publishedProcedure(language),
    });
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
    const action = new URL(request.url).searchParams.get('action') || body.action;
    if (!['open', 'submit'].includes(action)) {
      throw new ValidationError('A candidate opens a paper, or submits one.', { action: 'One of: open, submit.' });
    }
    if (!body.examinationId) {
      throw new ValidationError('examinationId is required.', { examinationId: 'Required.' });
    }

    const sitting = action === 'open'
      ? await openPaper(env, { user, examinationId: body.examinationId })
      : await submitPaper(env, { user, examinationId: body.examinationId });

    return jsonResponse({ sitting, procedure: publishedProcedure(languageOf(request)) });
  } catch (err) {
    return errorResponse(err);
  }
}
