// GET /api/admin/institutional-metrics — the Institutional Metric
// Register.
//
// STAFF, not administrator. It contains no personal data — every rate
// over a cohort small enough to identify anyone is suppressed before it
// leaves the module — and an institution improves by letting the people
// doing the work see how the work is going. Restricting it to
// administrators would make it a reporting exercise rather than a
// quality instrument.
//
// The financial metric is the exception in principle, but it reports
// receipts in aggregate only, which is already visible to staff through
// /api/admin/reports/revenue. Governance A5 is the open question about
// whether that should be true; this endpoint does not widen it.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { institutionalMetrics } from '../../_lib/reports/institutional.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    return jsonResponse(await institutionalMetrics(env));
  } catch (err) { return errorResponse(err); }
}
