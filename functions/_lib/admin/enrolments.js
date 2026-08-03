// Staff enrolment management.
//
// This exists because using the deployed platform for ten minutes made
// its absence obvious: the first learner account could only be enrolled
// by hand-writing SQL into the Cloudflare console. Every institution
// has learners who never pass through a card payment — scholarship
// holders, bank transfers, corporate cohorts, staff testing a level —
// and "ask a developer to run SQL" is not a process.
//
// Scope is deliberately the demonstrated need and nothing beyond it:
// find a learner, see and change their enrolments, and leave a record
// of who did it and why. It is NOT a general administration portal, and
// it does not touch roles, refunds or academic decisions — those need
// policy that has not been set, and building against absent policy is
// how invented policy gets shipped.
//
// Two rules the payment path never had to think about, because a
// completed payment answers both by itself:
//
//   1. Every change is attributed. actor_id and a reason are required
//      from staff. A payment webhook writes actor_id NULL, which is
//      honest — no person decided that.
//   2. A staff member cannot change their own enrolments. Not because
//      it is catastrophic, but because "grant yourself access" should
//      never be a single click, and the audit trail is worth less if
//      the actor and subject can be the same.

import { db, NotFoundError, ValidationError, newId, nowIso } from '../db.js';
import { AuthorizationError } from '../auth/session.js';

export const ENROLMENT_STATUSES = ['pending_payment', 'active', 'completed', 'withdrawn'];

// A learner may hold one live enrolment per level; 'withdrawn' rows are
// history and do not block a re-enrolment. Enforced by a partial unique
// index (migration 002) as well as here — the index is what makes it
// true under concurrency, this is what makes the error readable.
const LIVE = "status != 'withdrawn'";

export async function searchLearners(env, { q = '', limit = 25 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError('limit must be an integer between 1 and 100.', { limit: 'Invalid' });
  }
  const term = String(q || '').trim();
  // An empty search lists the most recent accounts rather than
  // everyone: a staff member opening the page wants to see the person
  // who just signed up, and an unbounded list of every learner is worse
  // than useless once there are a few thousand.
  const like = `%${term.replace(/[%_]/g, (c) => '\\' + c)}%`;
  const { results } = await db(env)
    .prepare(`SELECT id, email, preferred_name AS preferredName, role, created_at AS createdAt
       FROM users
       WHERE (? = '' OR email LIKE ? ESCAPE '\\' OR COALESCE(preferred_name,'') LIKE ? ESCAPE '\\')
       ORDER BY created_at DESC LIMIT ?`)
    .bind(term, like, like, limit)
    .all();

  for (const learner of results) {
    learner.enrolments = await enrolmentsFor(env, learner.id);
  }
  return { query: term, count: results.length, learners: results };
}

export async function getLearner(env, { userId }) {
  const user = await db(env)
    .prepare('SELECT id, email, preferred_name AS preferredName, role, email_verified AS emailVerified, created_at AS createdAt FROM users WHERE id = ?')
    .bind(userId)
    .first();
  if (!user) throw new NotFoundError('Unknown learner.');
  user.enrolments = await enrolmentsFor(env, userId);
  user.history = await enrolmentHistory(env, { userId });
  // Sent with every learner rather than fetched separately: the page
  // cannot render the history honestly without it, so it should never
  // be in a position to render the history without it.
  user.auditRecord = await auditRecordStart(env);
  return user;
}

async function enrolmentsFor(env, userId) {
  const { results } = await db(env)
    .prepare(`SELECT e.id, e.level_id AS levelId, l.roman, l.name, l.cefr, e.status,
                     e.started_at AS startedAt, e.completed_at AS completedAt
       FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
       WHERE e.user_id = ? ORDER BY e.level_id`)
    .bind(userId)
    .all();
  return results;
}

export async function enrolmentHistory(env, { userId, limit = 50 }) {
  const { results } = await db(env)
    .prepare(`SELECT ev.id, ev.level_id AS levelId, ev.from_status AS fromStatus, ev.to_status AS toStatus,
                     ev.reason, ev.created_at AS createdAt, u.email AS actorEmail
       FROM enrolment_events ev LEFT JOIN users u ON u.id = ev.actor_id
       WHERE ev.user_id = ? ORDER BY ev.created_at DESC LIMIT ?`)
    .bind(userId, limit)
    .all();
  // actorEmail null is not missing data — it is the system, and the
  // caller should be able to say so rather than render a blank.
  return results.map((r) => ({ ...r, actor: r.actorEmail || null, bySystem: !r.actorEmail }));
}

// When the enrolment audit record actually begins.
//
// enrolment_events was added by migration 002, which reached the live
// database on 3 August 2026 — long after the first learners were
// enrolled. Every change before that has no record and never will: the
// events were not written, so there is nothing to recover.
//
// A history panel that renders those rows and says nothing else is
// making an implicit claim — "this is what happened to this learner" —
// that is false for any account older than the table. "No enrolment
// changes recorded yet" is worse still: it reads as "nothing happened",
// when the truth is "nothing was being written down".
//
// The migration ledger already knows the answer, so it is asked rather
// than hardcoded:
//
//   method 'applied'  — the table was added to an existing database, so
//                       there IS a gap, and applied_at is where the
//                       record starts.
//   method 'baseline' — the table was present when the database was
//                       created, so no enrolment predates it and the
//                       record is complete.
//   no row            — a database older than the ledger itself. Say
//                       "unknown" rather than guess either way.
export async function auditRecordStart(env) {
  let row = null;
  try {
    row = await db(env)
      .prepare("SELECT applied_at AS appliedAt, method FROM schema_migrations WHERE filename = '002-enrolment-integrity.sql'")
      .first();
  } catch {
    // No schema_migrations table at all — a database that predates the
    // ledger. Not an error worth failing a learner lookup over.
    return { known: false, complete: false, since: null };
  }
  if (!row) return { known: false, complete: false, since: null };
  if (row.method === 'baseline') return { known: true, complete: true, since: null };
  return { known: true, complete: false, since: row.appliedAt };
}

// Create or move an enrolment, recording who and why.
//
// `actor` is the staff user, or null when the system does it (a payment
// webhook). A null actor skips the self-service and reason checks
// precisely because there is no person to hold to them.
export async function setEnrolmentStatus(env, { actor, userId, levelId, status, reason = null }) {
  if (!ENROLMENT_STATUSES.includes(status)) {
    throw new ValidationError(`status must be one of: ${ENROLMENT_STATUSES.join(', ')}.`, { status: 'Invalid' });
  }
  const learner = await db(env).prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (!learner) throw new NotFoundError('Unknown learner.');
  const level = await db(env).prepare('SELECT id FROM programme_levels WHERE id = ?').bind(levelId).first();
  if (!level) throw new NotFoundError('Unknown programme level.');

  if (actor) {
    if (actor.id === userId) {
      throw new AuthorizationError('You cannot change your own enrolments. Ask another staff member.');
    }
    const why = String(reason || '').trim();
    if (why.length < 3) {
      throw new ValidationError('A reason is required — it is what makes the record worth keeping.', { reason: 'Required' });
    }
    if (why.length > 500) throw new ValidationError('Reason must be 500 characters or fewer.', { reason: 'Too long' });
    reason = why;
  }

  const existing = await db(env)
    .prepare(`SELECT * FROM enrolments WHERE user_id = ? AND level_id = ? AND ${LIVE}`)
    .bind(userId, levelId)
    .first();

  let enrolmentId, fromStatus = null;
  if (existing) {
    if (existing.status === status) {
      // Not an error, and not a silent no-op either: say so, and write
      // no event. An audit trail full of "changed X to X" is noise that
      // makes the real entries harder to find.
      return { id: existing.id, userId, levelId, status, changed: false };
    }
    fromStatus = existing.status;
    enrolmentId = existing.id;
    await db(env)
      .prepare(`UPDATE enrolments SET status = ?,
                  started_at = CASE WHEN ? = 'active' AND started_at IS NULL THEN ? ELSE started_at END,
                  completed_at = CASE WHEN ? = 'completed' THEN ? ELSE completed_at END
                WHERE id = ?`)
      .bind(status, status, nowIso(), status, nowIso(), enrolmentId)
      .run();
  } else {
    if (status === 'withdrawn') {
      throw new ValidationError('There is no live enrolment in that level to withdraw.', { status: 'Nothing to withdraw' });
    }
    enrolmentId = newId('enr');
    await db(env)
      .prepare('INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES (?, ?, ?, ?, ?)')
      .bind(enrolmentId, userId, levelId, status, status === 'active' ? nowIso() : null)
      .run();
  }

  await recordEnrolmentEvent(env, {
    enrolmentId, userId, levelId, fromStatus, toStatus: status,
    actorId: actor ? actor.id : null, reason,
  });

  return { id: enrolmentId, userId, levelId, status, changed: true, previousStatus: fromStatus };
}

export async function recordEnrolmentEvent(env, { enrolmentId, userId, levelId, fromStatus, toStatus, actorId = null, reason = null }) {
  await db(env)
    .prepare(`INSERT INTO enrolment_events (id, enrolment_id, user_id, level_id, from_status, to_status, actor_id, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(newId('eev'), enrolmentId, userId, levelId, fromStatus, toStatus, actorId, reason, nowIso())
    .run();
}
