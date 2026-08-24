// Appointments — who holds staff or administrator access.
//
// Every safeguard here exists because of a specific way this goes
// wrong, not because safeguards are generically good:
//
//   Only an administrator may appoint. Staff can enrol learners and
//   review recordings; letting them also decide who else can do that
//   collapses the distinction between the two roles entirely.
//
//   Nobody may change their own role. A staff member cannot promote
//   themselves to administrator, and an administrator cannot demote
//   themselves out of a mistake they are in the middle of making.
//
//   The last administrator cannot be removed. Not a courtesy — the
//   only recovery from zero administrators is an UPDATE against the
//   live student database by whoever has the Cloudflare password, and
//   that is precisely the situation this module exists to end.
//
//   Every appointment is recorded with a reason AND an authority. They
//   are different questions. "Why this person" is a management answer;
//   "under whose decision" is the one an institution needs when it is
//   asked to account for who had access to student records.
//
// What this deliberately does NOT do is define the roles. 'staff' and
// 'admin' are access levels the software already enforces; they are not
// job titles, and this module does not invent an academic hierarchy,
// a faculty structure or a committee. Who *ought* to hold each level is
// a governance decision — see docs/governance-decisions.md, where it is
// put as a question rather than answered by a program.

import { db, NotFoundError, ValidationError, newId, nowIso } from '../db.js';
import { AuthorizationError } from '../auth/session.js';

// 'examiner' is deliberately its own tier, not a permission on top of
// 'staff' — the post's independence (appointment-briefs.md: "no other
// role at WEC") is the whole point, and a role list that let an examiner
// also be staff would make that unenforceable in the one place it can
// actually be checked.
export const ROLES = ['student', 'staff', 'admin', 'examiner'];

export async function setUserRole(env, { actor, userId, role, reason, authority = null }) {
  if (!actor || actor.role !== 'admin') {
    throw new AuthorizationError('Only an administrator can change what access someone has.');
  }
  if (!ROLES.includes(role)) {
    throw new ValidationError(`role must be one of: ${ROLES.join(', ')}.`, { role: 'Invalid' });
  }
  if (actor.id === userId) {
    throw new AuthorizationError('You cannot change your own access. Ask another administrator.');
  }

  const why = String(reason || '').trim();
  if (why.length < 3) {
    throw new ValidationError('A reason is required for an appointment.', { reason: 'Required' });
  }
  if (why.length > 500) throw new ValidationError('Reason must be 500 characters or fewer.', { reason: 'Too long' });
  const under = authority == null ? null : String(authority).trim().slice(0, 500) || null;

  const target = await db(env).prepare('SELECT id, role, email FROM users WHERE id = ?').bind(userId).first();
  if (!target) throw new NotFoundError('Unknown person.');
  if (target.role === role) {
    return { userId, role, changed: false };
  }

  // Losing every administrator is unrecoverable from inside the
  // product. Checked before the write, and the count is of OTHER
  // administrators precisely because the actor cannot be demoting
  // themselves here anyway.
  if (target.role === 'admin' && role !== 'admin') {
    const { others } = await db(env)
      .prepare("SELECT COUNT(*) AS others FROM users WHERE role = 'admin' AND id != ?")
      .bind(userId)
      .first();
    if (others < 1) {
      throw new ValidationError(
        'This is the only administrator. Appoint another one first — with none, the platform can only be recovered by editing the database directly.',
        { role: 'Last administrator' },
      );
    }
  }

  await db(env).prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
    .bind(role, nowIso(), userId).run();
  await db(env)
    .prepare(`INSERT INTO role_events (id, user_id, from_role, to_role, actor_id, reason, authority, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(newId('rev'), userId, target.role, role, actor.id, why, under, nowIso())
    .run();

  return { userId, role, changed: true, previousRole: target.role };
}

export async function appointmentHistory(env, { userId, limit = 50 }) {
  const { results } = await db(env)
    .prepare(`SELECT r.id, r.from_role AS fromRole, r.to_role AS toRole, r.reason, r.authority,
                     r.created_at AS createdAt, u.email AS actorEmail
       FROM role_events r JOIN users u ON u.id = r.actor_id
       WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT ?`)
    .bind(userId, limit)
    .all();
  return results;
}

// Everyone who currently holds access above 'student'. The question an
// institution is actually asked — "who can see student records" — and
// one nobody could answer before without querying the database by hand.
export async function listAppointees(env) {
  const { results } = await db(env)
    .prepare(`SELECT id, email, preferred_name AS preferredName, role, created_at AS createdAt
       FROM users WHERE role != 'student' ORDER BY role DESC, email`)
    .all();
  return { count: results.length, appointees: results };
}
