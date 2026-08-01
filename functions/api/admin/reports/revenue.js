// GET /api/admin/reports/revenue?from=<ISO>&to=<ISO>
// Staff/admin only. `from`/`to` are optional inclusive bounds on
// payments.created_at; omit either or both for all-time. See
// functions/_lib/reports/revenue.js for the report logic itself.

import { jsonResponse, errorResponse } from '../../../_lib/db.js';
import { requireStaff } from '../../../_lib/auth/session.js';
import { buildRevenueReport } from '../../../_lib/reports/revenue.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    const url = new URL(request.url);
    const report = await buildRevenueReport(env, {
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
    });
    return jsonResponse(report);
  } catch (err) {
    return errorResponse(err);
  }
}
