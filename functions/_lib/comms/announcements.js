/* WHAT THE COLLEGE SAID, TO WHOM, AND IN WHICH LANGUAGE.
 *
 * THE FAULT THIS FILE CORRECTS. Migration 020 states it as a measured
 * fact about this repository: "There is no row anywhere that says the
 * College addressed its learners." Seventy-six tables could describe a
 * curriculum, mark it, confer an award for it and let a stranger verify
 * the award, and none of them could carry a sentence from the Registrar
 * to the person studying. The tables now exist. This file is the only
 * thing that reads and writes them.
 *
 * ────────────────────────────────────────────────────────────────
 * 1 · THE AUDIENCE IS A SQL PREDICATE, AND THAT IS THE WHOLE DESIGN
 * ────────────────────────────────────────────────────────────────
 * The obvious implementation reads every live announcement and keeps
 * the ones addressed to the caller in JavaScript. It is shorter, it is
 * correct on the day it is written, and it is wrong for the same reason
 * `message_participants` was designed the way it was — the schema's own
 * words: "no query shape can return a thread they were never added to".
 *
 * A filtered-in-the-handler feed loads a notice addressed to ONE NAMED
 * LEARNER into the worker's memory on every other learner's request, and
 * from there a forgotten `.filter()`, an early return on an error path, a
 * count taken before the filter instead of after, or a debug field added
 * in a hurry puts it on the wrong screen. Nothing about the audience is
 * then structural; it is a line of code that happens to still be there.
 *
 * So `ADDRESSED_TO` below is a WHERE fragment, and it is the ONLY
 * definition of "addressed to you" in the platform. The feed, the unread
 * badge and the read-receipt write all take it, unmodified, with the same
 * bound parameters in the same order. A notice a learner may not see is
 * never read out of the database on their request, and the count on the
 * badge cannot disagree with the list underneath it, because the two are
 * not two definitions.
 *
 * The receipt write matters most and is the least obvious. Marking a
 * notice read is a write keyed on an id the caller supplies. Guarded in
 * the handler it is an existence oracle: send `ann_...` ids until one is
 * accepted and you have learned which private notices exist, and to
 * whom. Guarded in SQL — `INSERT ... SELECT ... WHERE id = ? AND
 * <ADDRESSED_TO>` — a caller who is not the audience inserts zero rows,
 * gets the same NotFound as a caller naming an id that was never issued,
 * and no branch in this file decides that.
 *
 * A LEVEL AUDIENCE IS A LIVE ENROLMENT, and that is not this file's
 * invention. Migration 020: "the set of learners with a live enrolment in
 * a level IS the cohort", which is why there is no cohort scope. The
 * schema fixes what live means — `idx_enrolments_one_live_per_level` is
 * partial `WHERE status != 'withdrawn'` — so this file uses that and no
 * second definition. The alternative, 'active' only, silently unaddresses
 * the learner who has finished Level I and not yet paid for Level II:
 * precisely the person a level notice about Level II is written for.
 *
 * ────────────────────────────────────────────────────────────────
 * 2 · TWO EDITIONS, AND A NOTICE THAT SAYS WHICH ONE YOU ARE READING
 * ────────────────────────────────────────────────────────────────
 * `users.preferred_language` has been a column with a CHECK of ('en','ar')
 * since the first migration, and nothing in `functions/` has ever read it.
 * It could be ignored while every learner-facing payload was numbers,
 * dates and enum values that the page translated. An announcement is the
 * first thing the College writes to a learner in prose, and prose is not
 * translated by a stylesheet.
 *
 * The failure to design against is not a missing translation — it is a
 * SILENT one. English sentences set right-to-left under an Arabic heading
 * read as a broken page, and a reader cannot tell whether the College
 * failed to translate the notice or failed to load it. So every rendered
 * announcement carries `language` (what the text in `body` actually is),
 * `requestedLanguage`, `fallback`, `direction` and `availableLanguages`.
 * An untranslated notice is served in the language it was written in,
 * flagged, with the direction it needs — and the page says so.
 *
 * HOW TWO EDITIONS FIT IN ONE `body`. They do not, cleanly:
 * `announcements` has `title` and `body` and no language column, and this
 * file may not add one. So the columns carry the PRIMARY edition — the
 * language the author wrote in — and the second edition is appended to
 * `body` after ASCII RS (0x1E), its own fields separated by US (0x1F).
 * Those two characters exist for exactly this and cannot occur in prose;
 * `assertProse()` refuses them, and every other C0 control, on input.
 *
 * Two properties were required of the encoding and both are load-bearing.
 * A stored `body` with no RS decodes as a single English edition, so
 * every row written before this file existed still reads. And the primary
 * body is the whole of the first segment, verbatim and first, so anything
 * that renders `body` raw — a future dashboard, an export, a support
 * query — shows real prose rather than a serialisation format. That is
 * the difference between an encoding and a JSON blob in a prose column.
 *
 * It is still an encoding standing in for schema. `title_ar`, `body_ar`
 * and `language` on `announcements` would retire it, and the migration
 * would be one UPDATE per row with no change to any payload here. The
 * gap is reported rather than patched.
 *
 * ────────────────────────────────────────────────────────────────
 * 3 · WHAT WAS SAID IS NOT EDITABLE INTO SOMETHING ELSE
 * ────────────────────────────────────────────────────────────────
 * `announcements` has no `updated_at` and there is no announcement_events
 * table, so an edit leaves no trace. Withdrawal does — `withdrawn_at` and
 * `withdrawn_reason` are both NOT NULL under the status CHECK, so the
 * College cannot take a notice back without saying why. Two rules follow,
 * and they are the reason this file refuses edits that a CRUD endpoint
 * would wave through:
 *
 *   · A PUBLISHED announcement's AUDIENCE is frozen. Text may be
 *     corrected; who it was addressed to may not. Re-scoping a notice
 *     that went to the whole College down to one learner would rewrite,
 *     with no record, what the College told everybody.
 *   · WITHDRAWN IS TERMINAL. A withdrawn notice is not edited back into
 *     circulation, because the withdrawal is the part a reviewer asks
 *     about. Reissuing is a new row, which is honest and which the
 *     receipts table can then count separately.
 *
 * And the author is the session, never a parameter. The schema requires
 * `author_id` NOT NULL so that "nothing should address every learner in
 * the College with no person behind it"; an `authorId` field in the body
 * would let one member of staff sign another's name to it.
 */

import {
  db, newId, nowIso, ValidationError, NotFoundError,
  parseLimit as sharedParseLimit,
} from '../db.js';
import { AuthorizationError } from '../auth/session.js';

/* ───────────────────────────────────────────────────────────────
 * THE VOCABULARY — the schema's CHECK constraints, restated so a bad
 * value is a 422 naming the field rather than a SQLite constraint
 * failure surfacing as a 500.
 * ─────────────────────────────────────────────────────────────── */

/** announcements.audience_scope. There is no 'cohort': see migration 020. */
export const AUDIENCE_SCOPES = ['institution', 'level', 'learner'];
/** announcements.status. 'withdrawn' is never an opening state. */
export const ANNOUNCEMENT_STATUSES = ['draft', 'published', 'withdrawn'];
/** users.preferred_language, and therefore the editions an announcement can hold. */
export const LANGUAGES = ['en', 'ar'];

/** Text direction per language, so a page never has to infer it. */
export const DIRECTION = { en: 'ltr', ar: 'rtl' };

/** A title is a line, not a paragraph; a notice is a notice, not a handbook. */
const MAX_TITLE = 200;
const MAX_BODY = 20000;
/** One screenful of notices. A feed is read, not exported. */
const DEFAULT_FEED = 20;
const MAX_FEED = 100;

/**
 * The record separator carrying the second edition, and the unit
 * separator between its fields. Chosen because ISO 646 defined them for
 * this and no keyboard produces them — assertProse() refuses both, so a
 * body can never contain one by accident or by intent.
 */
const RS = '\u001E';
const US = '\u001F';

/* ───────────────────────────────────────────────────────────────
 * THE AUDIENCE PREDICATE
 * ─────────────────────────────────────────────────────────────── */

/**
 * "Live, and addressed to this person" — the only definition of it.
 *
 * Bound parameters, in order: now, now, userId, userId. Use
 * audienceParams() rather than writing them out at a call site; the
 * order of four positional parameters across three queries is exactly
 * the kind of thing that drifts silently and returns somebody else's
 * post.
 *
 * The table must be aliased `a`. Deliberately not composable into
 * anything else: one fragment, three callers, no variants.
 */
const ADDRESSED_TO = `
  a.status = 'published'
  AND a.publish_from <= ?
  AND (a.publish_until IS NULL OR a.publish_until > ?)
  AND (
        a.audience_scope = 'institution'
     OR (a.audience_scope = 'learner' AND a.audience_user_id = ?)
     OR (a.audience_scope = 'level' AND a.level_id IN (
           SELECT e.level_id FROM enrolments e
            WHERE e.user_id = ? AND e.status != 'withdrawn'
        ))
  )`;

const audienceParams = (userId, now) => [now, now, userId, userId];

/* ───────────────────────────────────────────────────────────────
 * EDITIONS
 * ─────────────────────────────────────────────────────────────── */

/**
 * Pack one or two editions into the two columns the schema has.
 *
 * Returns `{ title, body }` ready to bind. The primary title goes to
 * `title` unencoded, so every existing query that selects a title —
 * including one written years from now by somebody who has not read this
 * file — gets a real title in a real language.
 */
export function encodeEditions(primary, alternate) {
  const head = `${primary.body}${RS}${primary.language}`;
  if (!alternate) return { title: primary.title, body: head };
  return {
    title: primary.title,
    body: `${head}${US}${alternate.language}${US}${alternate.title}${US}${alternate.body}`,
  };
}

/**
 * Unpack the columns.
 *
 * A body with no RS is a single English edition — the reading a row
 * written by anything other than this file gets, and the reading that
 * keeps this decodable if the columns are ever migrated out from under
 * it. A malformed tail is treated as no second edition rather than
 * throwing: a reader is owed the notice, not a stack trace.
 */
export function decodeEditions(titleColumn, bodyColumn) {
  const raw = String(bodyColumn ?? '');
  const cut = raw.indexOf(RS);
  if (cut === -1) {
    return {
      primary: { language: 'en', title: String(titleColumn ?? ''), body: raw },
      alternate: null,
    };
  }
  const meta = raw.slice(cut + 1).split(US);
  const primaryLanguage = LANGUAGES.includes(meta[0]) ? meta[0] : 'en';
  const primary = {
    language: primaryLanguage,
    title: String(titleColumn ?? ''),
    body: raw.slice(0, cut),
  };
  if (meta.length < 4 || !LANGUAGES.includes(meta[1]) || meta[1] === primaryLanguage) {
    return { primary, alternate: null };
  }
  return {
    primary,
    alternate: { language: meta[1], title: meta[2], body: meta.slice(3).join(US) },
  };
}

/**
 * Choose the edition to serve, and say what was chosen.
 *
 * `fallback` is true when the reader asked for a language this
 * announcement was not written in. Every caller passes it to the page,
 * because an untranslated notice that does not announce itself is
 * indistinguishable from a broken one.
 */
export function chooseEdition(editions, requestedLanguage) {
  const requested = LANGUAGES.includes(requestedLanguage) ? requestedLanguage : 'en';
  const match = [editions.primary, editions.alternate]
    .filter(Boolean)
    .find((e) => e.language === requested);
  const served = match || editions.primary;
  return {
    title: served.title,
    body: served.body,
    language: served.language,
    direction: DIRECTION[served.language],
    requestedLanguage: requested,
    fallback: served.language !== requested,
    availableLanguages: [editions.primary.language]
      .concat(editions.alternate ? [editions.alternate.language] : []),
  };
}

/* ───────────────────────────────────────────────────────────────
 * VALIDATION — reject, never coerce
 * ─────────────────────────────────────────────────────────────── */

/**
 * Prose fit to store: trimmed, bounded, and free of the control
 * characters the encoding above reserves.
 *
 * CRLF is folded to LF and that is the one thing here that is not a
 * refusal. A browser textarea submits CRLF and the difference between
 * the two carries no meaning a reader could ever see, so refusing it
 * would reject a correctly typed notice on a detail of the transport.
 * Every other C0 character is refused by name: 0x1E and 0x1F would
 * forge a second edition, and the rest have no business in a sentence.
 */
function assertProse(value, field, max, fields) {
  if (typeof value !== 'string') {
    fields[field] = 'Required';
    return null;
  }
  const folded = value.replace(/\r\n?/g, '\n');
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B-\u001F\u007F]/.test(folded)) {
    fields[field] = 'Contains control characters that cannot be stored';
    return null;
  }
  const text = folded.trim();
  if (!text) {
    fields[field] = 'Required';
    return null;
  }
  if (text.length > max) {
    fields[field] = `At most ${max} characters`;
    return null;
  }
  return text;
}

/** An ISO-8601 instant, and an instant is what publish_from compares as text. */
function assertInstant(value, field, fields) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
    fields[field] = 'An ISO-8601 UTC instant, e.g. 2026-09-01T09:00:00.000Z';
    return null;
  }
  if (Number.isNaN(Date.parse(value))) {
    fields[field] = 'Not a real date';
    return null;
  }
  return value;
}

function assertLanguage(value, field, fields) {
  if (!LANGUAGES.includes(value)) {
    fields[field] = `One of ${LANGUAGES.join(', ')}`;
    return null;
  }
  return value;
}

/**
 * One edition — a language, a title and a body, all three or none.
 *
 * Half a translation is refused rather than stored, because an Arabic
 * title over an English body is the exact failure the language flags
 * elsewhere in this file exist to prevent, arriving through the front
 * door.
 */
function readEdition(input, prefix, fields) {
  const language = assertLanguage(input.language, `${prefix}language`, fields);
  const title = assertProse(input.title, `${prefix}title`, MAX_TITLE, fields);
  const body = assertProse(input.body, `${prefix}body`, MAX_BODY, fields);
  if (!language || !title || !body) return null;
  return { language, title, body };
}

/**
 * The editions on a create or a text-carrying edit.
 *
 * `translation` is optional and, when present, must be in the other
 * language: two English editions is not a bilingual announcement, it is
 * a mistake that would silently shadow the reader's real choice.
 */
function readEditions(body, fields) {
  const primary = readEdition({
    language: body.language === undefined ? 'en' : body.language,
    title: body.title,
    body: body.body,
  }, '', fields);

  let alternate = null;
  if (body.translation !== undefined && body.translation !== null) {
    if (typeof body.translation !== 'object' || Array.isArray(body.translation)) {
      fields.translation = 'An object with language, title and body';
    } else {
      alternate = readEdition(body.translation, 'translation.', fields);
      if (alternate && primary && alternate.language === primary.language) {
        fields['translation.language'] = `The translation must not also be in ${primary.language}`;
        alternate = null;
      }
    }
  }
  if (!primary) return null;
  return { primary, alternate };
}

/**
 * The audience, checked against the same three CHECK constraints the
 * table carries, so the refusal names the field the form must highlight.
 * The existence checks are here too: a level or a learner that does not
 * exist is a typo in a form, not a foreign-key failure at 500.
 */
async function readAudience(env, body, fields) {
  const scope = body.audienceScope;
  if (!AUDIENCE_SCOPES.includes(scope)) {
    fields.audienceScope = `One of ${AUDIENCE_SCOPES.join(', ')}`;
    return null;
  }

  if (scope === 'institution') {
    if (body.levelId != null || body.audienceUserId != null) {
      fields.audienceScope = 'An institution-wide notice names no level and no learner';
      return null;
    }
    return { scope, levelId: null, audienceUserId: null };
  }

  if (scope === 'level') {
    if (body.audienceUserId != null) {
      fields.audienceUserId = 'A level notice names no individual learner';
      return null;
    }
    if (!Number.isInteger(body.levelId)) {
      fields.levelId = 'Required — the level this notice addresses';
      return null;
    }
    const level = await db(env)
      .prepare('SELECT id FROM programme_levels WHERE id = ?')
      .bind(body.levelId).first();
    if (!level) {
      fields.levelId = 'No such level';
      return null;
    }
    return { scope, levelId: body.levelId, audienceUserId: null };
  }

  if (body.levelId != null) {
    fields.levelId = 'A notice to one learner names no level';
    return null;
  }
  if (typeof body.audienceUserId !== 'string' || !body.audienceUserId) {
    fields.audienceUserId = 'Required — the learner this notice addresses';
    return null;
  }
  const learner = await db(env)
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind(body.audienceUserId).first();
  if (!learner) {
    fields.audienceUserId = 'No such person';
    return null;
  }
  return { scope, levelId: null, audienceUserId: body.audienceUserId };
}

function assertNoFields(fields, message) {
  if (Object.keys(fields).length) throw new ValidationError(message, fields);
}

/** Query-string integers, refused rather than rounded. */
/**
 * The bounds are this module's; the rule is not. See
 * functions/_lib/db.js parseLimit() for why four identical copies of
 * this eleven-line function became one.
 */
export function parseLimit(raw, fallback = DEFAULT_FEED) {
  return sharedParseLimit(raw, { fallback, max: MAX_FEED });
}

/** The language a reader asked for, defaulting to the one on their account. */
export function parseLanguage(raw, user) {
  if (raw === null || raw === undefined || raw === '') {
    return LANGUAGES.includes(user?.preferred_language) ? user.preferred_language : 'en';
  }
  if (!LANGUAGES.includes(raw)) {
    throw new ValidationError(`language must be one of ${LANGUAGES.join(', ')}.`,
      { language: `One of ${LANGUAGES.join(', ')}` });
  }
  return raw;
}

/* ───────────────────────────────────────────────────────────────
 * THE LEARNER'S FEED
 * ─────────────────────────────────────────────────────────────── */

/**
 * Shape one row for the person it was addressed to.
 *
 * The author is a name or nothing. `users.email` is never on this
 * payload: a learner reading a notice about their fees has no business
 * acquiring the Registrar's inbox from the JSON behind it.
 */
function readerView(row, language) {
  const edition = chooseEdition(decodeEditions(row.title, row.body), language);
  return {
    id: row.id,
    ...edition,
    pinned: row.pinned === 1,
    audience: {
      scope: row.audience_scope,
      levelId: row.level_id ?? null,
      levelRoman: row.level_roman ?? null,
      levelName: row.level_name ?? null,
    },
    author: { name: row.author_name ?? null },
    publishFrom: row.publish_from,
    publishUntil: row.publish_until ?? null,
    publishedAt: row.published_at ?? null,
    read: Boolean(row.read_at),
    readAt: row.read_at ?? null,
    dismissedAt: row.dismissed_at ?? null,
  };
}

/**
 * GET /api/announcements — everything addressed to this person, pinned
 * first, newest next, with the badge count taken from the same predicate.
 *
 * Two statements rather than one because the list is capped and the
 * count must not be: a badge reading "20" because the page asked for
 * twenty is a badge that lies as soon as anything is unread past the
 * end. Both take ADDRESSED_TO unmodified, so the only way they can
 * disagree is if that fragment is edited, which changes both.
 */
export async function learnerFeed(env, { user, language, limit = DEFAULT_FEED, now = null } = {}) {
  const at = now || nowIso();
  const lang = LANGUAGES.includes(language)
    ? language
    : (LANGUAGES.includes(user.preferred_language) ? user.preferred_language : 'en');

  const listed = await db(env).prepare(`
    SELECT a.id, a.title, a.body, a.pinned, a.audience_scope, a.level_id,
           a.publish_from, a.publish_until, a.published_at,
           u.preferred_name AS author_name,
           pl.roman AS level_roman, pl.name AS level_name,
           r.read_at, r.dismissed_at
      FROM announcements a
      JOIN users u ON u.id = a.author_id
      LEFT JOIN programme_levels pl ON pl.id = a.level_id
      LEFT JOIN announcement_receipts r
             ON r.announcement_id = a.id AND r.user_id = ?
     WHERE ${ADDRESSED_TO}
     ORDER BY a.pinned DESC, a.publish_from DESC, a.id DESC
     LIMIT ?`)
    .bind(user.id, ...audienceParams(user.id, at), limit)
    .all();

  const unread = await db(env).prepare(`
    SELECT COUNT(*) AS n
      FROM announcements a
     WHERE ${ADDRESSED_TO}
       AND NOT EXISTS (
             SELECT 1 FROM announcement_receipts r
              WHERE r.announcement_id = a.id AND r.user_id = ?)`)
    .bind(...audienceParams(user.id, at), user.id)
    .first();

  const announcements = (listed.results || []).map((row) => readerView(row, lang));
  return {
    reader: { language: lang, direction: DIRECTION[lang] },
    unread: unread ? unread.n : 0,
    returned: announcements.length,
    limit,
    asAt: at,
    announcements,
    // A page that renders `fallback` needs the sentence to render. Kept
    // here rather than in the client so the two languages of the notice
    // about languages cannot themselves fall out of step.
    untranslatedNotice: {
      en: 'This notice is published in Arabic only.',
      ar: 'هذا الإعلان منشور باللغة الإنجليزية فقط.',
    },
  };
}

/**
 * Mark one announcement read for the caller — and, optionally, dismiss it.
 *
 * The subject is the session's user and there is no parameter for it,
 * by the rule functions/api/student/dashboard.js states.
 *
 * `read_at` is written once and never moved. The first time a learner
 * opened a notice is the fact; overwriting it on every render would
 * replace it with "most recently rendered", which answers nothing. So
 * the upsert touches `dismissed_at` alone, and dismissing something
 * already dismissed is idempotent rather than an error — the schema
 * separates the two acts precisely so that reading a notice is not the
 * cost of losing it.
 */
export async function markRead(env, { user, announcementId, dismissed = false, now = null } = {}) {
  if (typeof announcementId !== 'string' || !announcementId) {
    throw new ValidationError('announcementId is required.', { announcementId: 'Required' });
  }
  if (typeof dismissed !== 'boolean') {
    throw new ValidationError('dismissed must be true or false.', { dismissed: 'true or false' });
  }
  const at = now || nowIso();

  // The audience check IS this statement. Nothing above it decides
  // whether the caller may see this id, so nothing above it can be
  // rewritten into an oracle for which private notices exist.
  const written = await db(env).prepare(`
    INSERT INTO announcement_receipts (id, announcement_id, user_id, read_at, dismissed_at)
    SELECT ?, a.id, ?, ?, ?
      FROM announcements a
     WHERE a.id = ? AND ${ADDRESSED_TO}
    ON CONFLICT (announcement_id, user_id) DO UPDATE
       SET dismissed_at = COALESCE(excluded.dismissed_at, announcement_receipts.dismissed_at)`)
    .bind(newId('anr'), user.id, at, dismissed ? at : null,
      announcementId, ...audienceParams(user.id, at))
    .run();

  if (!written || !written.meta || written.meta.changes === 0) {
    // Identical to the answer for an id that was never issued. An
    // announcement addressed to somebody else must not be distinguishable
    // from one that does not exist.
    throw new NotFoundError('No such announcement.');
  }

  const receipt = await db(env)
    .prepare('SELECT read_at, dismissed_at FROM announcement_receipts WHERE announcement_id = ? AND user_id = ?')
    .bind(announcementId, user.id).first();

  const unread = await db(env).prepare(`
    SELECT COUNT(*) AS n
      FROM announcements a
     WHERE ${ADDRESSED_TO}
       AND NOT EXISTS (
             SELECT 1 FROM announcement_receipts r
              WHERE r.announcement_id = a.id AND r.user_id = ?)`)
    .bind(...audienceParams(user.id, at), user.id)
    .first();

  return {
    announcementId,
    readAt: receipt ? receipt.read_at : at,
    dismissedAt: receipt ? (receipt.dismissed_at ?? null) : null,
    // Returned so the badge settles on one round trip. A second GET to
    // learn the new count is how a badge ends up briefly wrong.
    unread: unread ? unread.n : 0,
  };
}

/* ───────────────────────────────────────────────────────────────
 * THE STAFF DESK
 * ─────────────────────────────────────────────────────────────── */

/**
 * What a member of staff may see of the notice board, and why it is not
 * everything.
 *
 * Institution and level notices are addressed to everybody at that
 * level; there is nothing to protect and every tutor should be able to
 * read what the College has told their learners. A LEARNER-scoped notice
 * is a private letter. There is no participant row to hold the relation
 * — attendance.js had to compose one from teaching acts for the same
 * reason — so the rule is the narrow one: staff see the learner-scoped
 * notices they themselves wrote, administrators see the board.
 *
 * Returns a WHERE fragment and its parameters together, because the two
 * must not be separable at a call site.
 */
function staffVisibility(actor) {
  if (actor.role === 'admin') return { sql: '1 = 1', params: [], basis: 'admin' };
  return {
    sql: "(a.audience_scope != 'learner' OR a.author_id = ?)",
    params: [actor.id],
    basis: 'author',
  };
}

/** Editing is narrower still: a notice signed by one person is not another's to rewrite. */
function assertMayMutate(actor, row) {
  if (actor.role === 'admin' || row.author_id === actor.id) return;
  throw new AuthorizationError('Only the author of this announcement, or an administrator, may change it.');
}

/** The staff view of a row: both editions, the full audience, the history. */
function staffView(row) {
  const editions = decodeEditions(row.title, row.body);
  return {
    id: row.id,
    primary: editions.primary,
    translation: editions.alternate,
    availableLanguages: [editions.primary.language]
      .concat(editions.alternate ? [editions.alternate.language] : []),
    status: row.status,
    pinned: row.pinned === 1,
    audience: {
      scope: row.audience_scope,
      levelId: row.level_id ?? null,
      levelRoman: row.level_roman ?? null,
      audienceUserId: row.audience_user_id ?? null,
      audienceUserName: row.audience_user_name ?? null,
    },
    author: { id: row.author_id, name: row.author_name ?? null, email: row.author_email ?? null },
    publishFrom: row.publish_from,
    publishUntil: row.publish_until ?? null,
    publishedAt: row.published_at ?? null,
    withdrawnAt: row.withdrawn_at ?? null,
    withdrawnReason: row.withdrawn_reason ?? null,
    createdAt: row.created_at,
    // Reach, not "views". The number of people who have read a notice is
    // a fact about the notice; who has not read it is a fact about named
    // learners and is not the notice board's to publish.
    readCount: row.read_count ?? 0,
  };
}

const STAFF_COLUMNS = `
  a.id, a.author_id, a.title, a.body, a.audience_scope, a.level_id, a.audience_user_id,
  a.pinned, a.status, a.publish_from, a.publish_until, a.published_at,
  a.withdrawn_at, a.withdrawn_reason, a.created_at,
  au.preferred_name AS author_name, au.email AS author_email,
  pl.roman AS level_roman,
  tu.preferred_name AS audience_user_name,
  (SELECT COUNT(*) FROM announcement_receipts r WHERE r.announcement_id = a.id) AS read_count`;

const STAFF_JOINS = `
  FROM announcements a
  JOIN users au ON au.id = a.author_id
  LEFT JOIN programme_levels pl ON pl.id = a.level_id
  LEFT JOIN users tu ON tu.id = a.audience_user_id`;

export async function staffAnnouncement(env, actor, id) {
  const visible = staffVisibility(actor);
  const row = await db(env)
    .prepare(`SELECT ${STAFF_COLUMNS} ${STAFF_JOINS} WHERE a.id = ? AND ${visible.sql}`)
    .bind(id, ...visible.params).first();
  if (!row) throw new NotFoundError('No such announcement.');
  return staffView(row);
}

/** The board, filtered by the fields a desk actually filters by. */
export async function staffList(env, actor, { status = null, scope = null, levelId = null, limit = 50 } = {}) {
  const fields = {};
  if (status !== null && !ANNOUNCEMENT_STATUSES.includes(status)) {
    fields.status = `One of ${ANNOUNCEMENT_STATUSES.join(', ')}`;
  }
  if (scope !== null && !AUDIENCE_SCOPES.includes(scope)) {
    fields.audienceScope = `One of ${AUDIENCE_SCOPES.join(', ')}`;
  }
  if (levelId !== null && !Number.isInteger(levelId)) {
    fields.levelId = 'A whole number';
  }
  assertNoFields(fields, 'Those filters cannot be applied.');

  const visible = staffVisibility(actor);
  const where = [visible.sql];
  const params = [...visible.params];
  if (status !== null) { where.push('a.status = ?'); params.push(status); }
  if (scope !== null) { where.push('a.audience_scope = ?'); params.push(scope); }
  if (levelId !== null) { where.push('a.level_id = ?'); params.push(levelId); }

  const rows = await db(env).prepare(`
    SELECT ${STAFF_COLUMNS} ${STAFF_JOINS}
     WHERE ${where.join(' AND ')}
     ORDER BY a.pinned DESC, a.publish_from DESC, a.id DESC
     LIMIT ?`)
    .bind(...params, limit).all();

  return {
    basis: visible.basis,
    returned: (rows.results || []).length,
    limit,
    announcements: (rows.results || []).map(staffView),
  };
}

/**
 * Write a notice.
 *
 * `status` may be 'draft' or 'published' and nothing else: a notice
 * cannot be born withdrawn, because withdrawal is the act of taking back
 * something that was said.
 *
 * `publish_from` defaults to now rather than being required. A notice
 * with no date is the ordinary case — say it now — and forcing every
 * caller to supply a timestamp is how a form ends up sending the
 * client's clock, which is not the College's.
 */
export async function createAnnouncement(env, { actor, body, now = null } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('A JSON object is required.', {});
  }
  const at = now || nowIso();
  const fields = {};

  const editions = readEditions(body, fields);
  const audience = await readAudience(env, body, fields);

  const status = body.status === undefined ? 'draft' : body.status;
  if (status !== 'draft' && status !== 'published') {
    fields.status = 'One of draft, published';
  }
  const pinned = body.pinned === undefined ? false : body.pinned;
  if (typeof pinned !== 'boolean') fields.pinned = 'true or false';

  const publishFrom = body.publishFrom === undefined || body.publishFrom === null
    ? at
    : assertInstant(body.publishFrom, 'publishFrom', fields);
  let publishUntil = null;
  if (body.publishUntil !== undefined && body.publishUntil !== null) {
    publishUntil = assertInstant(body.publishUntil, 'publishUntil', fields);
    if (publishUntil && publishFrom && publishUntil <= publishFrom) {
      fields.publishUntil = 'Must be after publishFrom';
    }
  }
  assertNoFields(fields, 'That announcement cannot be published as written.');

  const columns = encodeEditions(editions.primary, editions.alternate);
  const id = newId('ann');
  await db(env).prepare(`
    INSERT INTO announcements
      (id, author_id, title, body, audience_scope, level_id, audience_user_id,
       pinned, status, publish_from, publish_until, published_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, actor.id, columns.title, columns.body,
      audience.scope, audience.levelId, audience.audienceUserId,
      pinned ? 1 : 0, status, publishFrom, publishUntil,
      status === 'published' ? at : null, at)
    .run();

  return staffAnnouncement(env, actor, id);
}

/**
 * Amend a notice.
 *
 * What may change depends on what the notice already is, and the two
 * refusals are the point of the function:
 *
 *   withdrawn  → nothing. Terminal, so the withdrawal stays answerable.
 *   published  → text, pinning, publish_until, and publication itself.
 *                NOT the audience and NOT publish_from: the table keeps
 *                no updated_at and no event trail, so a re-scoped notice
 *                would be an unrecorded rewrite of who was told what.
 *   draft      → everything. Nothing has been said yet.
 */
export async function updateAnnouncement(env, { actor, id, body, now = null } = {}) {
  if (typeof id !== 'string' || !id) {
    throw new ValidationError('id is required.', { id: 'Required' });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('A JSON object is required.', {});
  }
  const at = now || nowIso();

  const row = await db(env).prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first();
  if (!row) throw new NotFoundError('No such announcement.');
  assertMayMutate(actor, row);

  if (row.status === 'withdrawn') {
    throw new ValidationError(
      'A withdrawn announcement cannot be edited. Issue a new one — the withdrawal and its reason stay on the record.',
      { status: 'Withdrawn' },
    );
  }

  const wasPublished = row.status === 'published';
  const fields = {};
  const sets = [];
  const params = [];

  // Text. Supplied as a whole edition set or not at all — patching a
  // title without its body is how an announcement ends up half in one
  // language and half in another.
  if (body.title !== undefined || body.body !== undefined
      || body.language !== undefined || body.translation !== undefined) {
    const current = decodeEditions(row.title, row.body);
    const editions = readEditions({
      language: body.language === undefined ? current.primary.language : body.language,
      title: body.title === undefined ? current.primary.title : body.title,
      body: body.body === undefined ? current.primary.body : body.body,
      translation: body.translation === undefined ? current.alternate : body.translation,
    }, fields);
    if (editions) {
      const columns = encodeEditions(editions.primary, editions.alternate);
      sets.push('title = ?', 'body = ?');
      params.push(columns.title, columns.body);
    }
  }

  if (body.pinned !== undefined) {
    if (typeof body.pinned !== 'boolean') fields.pinned = 'true or false';
    else { sets.push('pinned = ?'); params.push(body.pinned ? 1 : 0); }
  }

  if (body.audienceScope !== undefined || body.levelId !== undefined || body.audienceUserId !== undefined) {
    if (wasPublished) {
      fields.audienceScope = 'The audience of a published announcement cannot be changed. Withdraw it and issue a new one.';
    } else {
      const audience = await readAudience(env, body, fields);
      if (audience) {
        sets.push('audience_scope = ?', 'level_id = ?', 'audience_user_id = ?');
        params.push(audience.scope, audience.levelId, audience.audienceUserId);
      }
    }
  }

  let publishFrom = row.publish_from;
  if (body.publishFrom !== undefined) {
    if (wasPublished) {
      fields.publishFrom = 'A published announcement cannot be back-dated or postponed. Withdraw it and issue a new one.';
    } else {
      const parsed = assertInstant(body.publishFrom, 'publishFrom', fields);
      if (parsed) { publishFrom = parsed; sets.push('publish_from = ?'); params.push(parsed); }
    }
  }

  let publishUntil = row.publish_until;
  if (body.publishUntil !== undefined) {
    if (body.publishUntil === null) {
      publishUntil = null;
      sets.push('publish_until = ?'); params.push(null);
    } else {
      const parsed = assertInstant(body.publishUntil, 'publishUntil', fields);
      if (parsed) { publishUntil = parsed; sets.push('publish_until = ?'); params.push(parsed); }
    }
  }
  if (publishUntil !== null && publishUntil !== undefined && publishUntil <= publishFrom) {
    fields.publishUntil = 'Must be after publishFrom';
  }

  // Publication. A draft becomes published and acquires published_at in
  // the same statement, because the table's CHECK will not hold a
  // published row without one. Withdrawal is the DELETE verb and is
  // refused here, so that it can never happen without its reason.
  if (body.status !== undefined) {
    if (body.status === 'withdrawn') {
      fields.status = 'Withdraw with DELETE, which requires a reason.';
    } else if (body.status === 'draft' && wasPublished) {
      fields.status = 'A published announcement cannot be returned to draft. Withdraw it, with a reason.';
    } else if (body.status !== 'draft' && body.status !== 'published') {
      fields.status = 'One of draft, published';
    } else if (body.status === 'published' && !wasPublished) {
      sets.push('status = ?', 'published_at = ?');
      params.push('published', row.published_at || at);
    }
  }

  assertNoFields(fields, 'That change cannot be made.');
  if (!sets.length) {
    throw new ValidationError('Nothing to change.', {});
  }

  await db(env).prepare(`UPDATE announcements SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...params, id).run();
  return staffAnnouncement(env, actor, id);
}

/**
 * Withdraw a notice. The row survives, its receipts survive, and the
 * reason is mandatory — the schema will not accept a withdrawal without
 * one, and neither will this. What the College told its learners and
 * then took back is precisely the thing a reviewer asks about.
 */
export async function withdrawAnnouncement(env, { actor, id, reason, now = null } = {}) {
  if (typeof id !== 'string' || !id) {
    throw new ValidationError('id is required.', { id: 'Required' });
  }
  const at = now || nowIso();
  const fields = {};
  const text = assertProse(reason, 'reason', 500, fields);
  assertNoFields(fields, 'A withdrawal must say why.');

  const row = await db(env).prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first();
  if (!row) throw new NotFoundError('No such announcement.');
  assertMayMutate(actor, row);
  if (row.status === 'withdrawn') {
    throw new ValidationError('That announcement has already been withdrawn.', { status: 'Withdrawn' });
  }

  await db(env).prepare(`
    UPDATE announcements SET status = 'withdrawn', withdrawn_at = ?, withdrawn_reason = ?
     WHERE id = ?`)
    .bind(at, text, id).run();

  return staffAnnouncement(env, actor, id);
}
