// GET / POST /api/admin/examination-papers — the papers the College
// sets, and the act of publishing one.
//
// WHY THIS IS AN ADMIN ROUTE AND NOT A STAFF ONE. Publishing a paper is
// the act that fixes `rubric_published_on`, and that date is the whole
// of the College's central marking claim: every award is "marked
// against a rubric published before the work". A tutor marks to a
// rubric. Setting one is a different authority, and the platform's own
// separation of the two is `requireAdmin` rather than a note in a
// handbook.
//
// WHY AUTHORING AND PUBLISHING ARE TWO ACTS. A paper authored and
// published in one request would let its publication date be written by
// whoever happened to send the request, at whatever moment suited them
// — which is exactly the back-dating the two-step exists to prevent. A
// draft is not markable and not sittable; publishing it is a separate,
// dated, attributed act, and the refusals it carries (weights summing
// to 1, all four skills measured, a spoken criterion present) are
// checked at that moment because that is the moment the paper becomes
// something a candidate can be marked against.
//
// The GET is deliberately unfiltered by status: an administrator
// deciding whether to publish version 3 needs to see versions 1 and 2
// and when each was retired, and a list that showed only the live paper
// would hide the history the decision is made from.

import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth/session.js';
import { db } from '../../_lib/db.js';
import {
  authorPaper, publishPaper, paperFor, paperView,
  DURATION_MINUTES, SPOKEN_MINUTES, WINDOW_WORKING_DAYS, EXAMINATION_FLOOR, PUBLISHED,
} from '../../_lib/academic/examinations.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env);
    const url = new URL(request.url);
    const paperId = url.searchParams.get('paperId');
    if (paperId) return jsonResponse({ paper: await paperFor(env, paperId) });

    const levelParam = url.searchParams.get('levelId');
    const rows = levelParam
      ? (await db(env).prepare('SELECT * FROM examination_papers WHERE level_id = ? ORDER BY version DESC')
        .bind(Number(levelParam)).all()).results
      : (await db(env).prepare('SELECT * FROM examination_papers ORDER BY level_id, version DESC')
        .bind().all()).results;

    const criteria = (await db(env)
      .prepare(`SELECT c.*, s.name AS skill_name, s.name_ar AS skill_name_ar
                  FROM examination_criteria c LEFT JOIN language_skills s ON s.id = c.skill_id
                 ORDER BY c.paper_id, c.sequence`).bind().all()).results;

    const levels = (await db(env)
      .prepare('SELECT id, roman, name, cefr FROM programme_levels ORDER BY id').bind().all()).results;

    const papers = rows.map((p) => paperView(p, criteria.filter((c) => c.paper_id === p.id)));

    return jsonResponse({
      papers,
      // Named rather than left to be counted off the list, because "no
      // paper is published at this level" is the sentence that explains
      // every conditional graduation position at it, and an
      // administrator reading this screen is the person who can change
      // that.
      levels: levels.map((l) => {
        const live = papers.find((p) => p.levelId === l.id && p.status === 'published') || null;
        return {
          levelId: l.id,
          roman: l.roman,
          name: l.name,
          cefr: l.cefr,
          published: live ? { paperId: live.id, version: live.version, rubricPublishedOn: live.rubricPublishedOn } : null,
          drafts: papers.filter((p) => p.levelId === l.id && p.status === 'draft').length,
        };
      }),
      defaults: {
        durationMinutes: DURATION_MINUTES,
        spokenMinutes: SPOKEN_MINUTES,
        windowWorkingDays: WINDOW_WORKING_DAYS,
        floor: EXAMINATION_FLOOR,
      },
      instrument: PUBLISHED.conduct,
    });
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

    const url = new URL(request.url);
    // Cloudflare Pages routes /api/x/y only to functions/api/x/y.js, so
    // publishing rides on `?action=` rather than on a second path. The
    // reasoning is the one docs/platform-capabilities.md § 10 records
    // for the two other endpoints that do this: two paths for one act is
    // the contradiction, not the query parameter.
    const action = url.searchParams.get('action') || body.action || 'author';

    if (action === 'publish') {
      if (!body.paperId) throw new ValidationError('paperId is required.', { paperId: 'Required.' });
      return jsonResponse({ paper: await publishPaper(env, { actor: admin, paperId: body.paperId }) });
    }

    if (action !== 'author') {
      throw new ValidationError('A paper is authored, or a draft is published.', { action: 'One of: author, publish.' });
    }

    const paper = await authorPaper(env, {
      actor: admin,
      levelId: body.levelId,
      title: body.title,
      titleAr: body.titleAr ?? null,
      conditions: body.conditions,
      conditionsAr: body.conditionsAr ?? null,
      criteria: body.criteria,
      openBook: body.openBook === undefined ? true : Boolean(body.openBook),
      durationMinutes: body.durationMinutes ?? DURATION_MINUTES,
      spokenMinutes: body.spokenMinutes ?? SPOKEN_MINUTES,
      windowWorkingDays: body.windowWorkingDays ?? WINDOW_WORKING_DAYS,
    });
    return jsonResponse({ paper }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
