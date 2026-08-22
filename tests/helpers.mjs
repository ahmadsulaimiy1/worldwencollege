// Shared, portable path resolution for every test file in this
// directory — no hardcoded absolute paths, so the suite runs
// correctly from any checkout location.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadUrl(relativePath) {
  return new URL(relativePath, 'file://' + ROOT + '/');
}

/**
 * A passed graduation audit, inserted directly as a fixture.
 *
 * conferAward() requires one (migration 028), and runGraduationAudit()
 * CANNOT produce one today: the WEQ framework requires an External
 * Examiner's independent sign-off, none is appointed, and that check
 * therefore returns `cannot_check`, which does not pass. That refusal
 * is deliberate and is asserted by tests/graduation-audit.test.mjs.
 *
 * So the register's own tests — which are about chains, codes,
 * revocation and verification, not about whether a fictional learner
 * earned anything — insert the audit row directly, exactly as they
 * already insert fictional users and enrolments. The fixture stands in
 * for the appointment that has not happened.
 *
 * It must NEVER be used to make a real conferral pass. The only thing
 * that does that is appointing an External Examiner.
 */
export function passedAuditFixture(env, { userId, levelId, awardCode = 'CAEC', at = '2027-03-01T00:00:00.000Z' }) {
  const id = `gaud_fixture_${userId}_${levelId}`;
  env.DB.prepare(`INSERT INTO graduation_audits
    (id, user_id, level_id, award_code, run_at, outcome, closed_at, summary)
    VALUES (?, ?, ?, ?, ?, 'met', ?, 'Test fixture: stands in for an audit that cannot pass until an External Examiner is appointed.')`)
    .bind(id, userId, levelId, awardCode, at, at).run();
  return id;
}

/**
 * Confer an award in a test, creating the graduation audit it needs.
 *
 * conferAward() requires a passed audit and will not accept one that is
 * missing, borrowed from another learner, for another level, or failed
 * — tests/registry.test.mjs asserts all four refusals directly. Every
 * OTHER suite touching the Register is about something else entirely:
 * certificates, transcripts, verification, profiles. Those pass through
 * here so the guard is satisfied honestly without each of them
 * restating it.
 *
 * The audit is a fixture, and it is one per (learner, level), so a
 * suite conferring twice for the same pair reuses it exactly as a real
 * replacement would.
 */
export async function conferForTest(reg, env, args) {
  const levelId = args.levelId;
  const id = `gaud_fixture_${args.userId}_${levelId}`;
  const exists = env.DB.prepare('SELECT id FROM graduation_audits WHERE id = ?').bind(id).first();
  if (!exists) passedAuditFixture(env, { userId: args.userId, levelId });
  return reg.conferAward(env, { ...args, auditId: id });
}
