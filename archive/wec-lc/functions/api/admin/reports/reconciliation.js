// GET /api/admin/reports/reconciliation
// Staff/admin only. See functions/_lib/reports/reconciliation.js for
// the report logic itself and what it deliberately does not attempt.

import { jsonResponse, errorResponse } from '../../../_lib/db.js';
// Administrator, not staff — governance decision A5 (adopted 14 August
// 2026). See docs/governance-decisions.md § A5.
import { requireAdmin } from '../../../_lib/auth/session.js';
import { buildReconciliationReport } from '../../../_lib/reports/reconciliation.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env);
    const report = await buildReconciliationReport(env);
    return jsonResponse(report);
  } catch (err) {
    return errorResponse(err);
  }
}
