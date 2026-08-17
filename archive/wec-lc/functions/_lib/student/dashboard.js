// A student's own dashboard data — pure query logic, no HTTP/auth
// concerns, same split as functions/_lib/reports/* (see that
// directory's comment for why: testable directly against fixture data
// without a real Clerk token). The HTTP boundary
// (functions/api/student/dashboard.js) is a thin wrapper: requireUser(),
// call buildStudentDashboard(env, user.id), return it.
//
// This intentionally stops at what the schema can back for real —
// enrolment status/level and payment/receipt history. Programme
// content (classes, assignments, digital library, attendance,
// units-completed) has no backing table yet; it stays illustrative in
// the Student Portal UI regardless of auth state until an LMS
// integration exists (see docs/master-roadmap.md, Decision: LMS).

import { db } from '../db.js';

export async function buildStudentDashboard(env, userId) {
  const [enrolments, payments] = await Promise.all([
    db(env).prepare(`SELECT e.id, e.level_id as levelId, l.name as levelName, l.roman, l.cefr,
        e.status, e.started_at as startedAt, e.completed_at as completedAt
      FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
      WHERE e.user_id = ? ORDER BY e.level_id ASC`).bind(userId).all(),
    db(env).prepare(`SELECT p.id, p.level_id as levelId, l.name as levelName, p.amount_cents as amountCents,
        p.currency, p.status, p.provider, p.created_at as createdAt, p.confirmed_at as confirmedAt,
        r.receipt_number as receiptNumber
      FROM payments p
      LEFT JOIN programme_levels l ON l.id = p.level_id
      LEFT JOIN receipts r ON r.payment_id = p.id
      WHERE p.user_id = ? ORDER BY p.created_at DESC`).bind(userId).all(),
  ]);

  const activeEnrolment = enrolments.results.find((e) => e.status === 'active') || null;
  const completedLevelIds = enrolments.results.filter((e) => e.status === 'completed').map((e) => e.levelId);

  return {
    enrolments: enrolments.results,
    payments: payments.results,
    activeLevelId: activeEnrolment ? activeEnrolment.levelId : null,
    completedLevelIds,
  };
}
