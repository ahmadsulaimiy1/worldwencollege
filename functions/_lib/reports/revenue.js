// Revenue reporting — pure query logic, no HTTP/auth concerns, so it
// can be functionally tested directly against the D1 shim the same way
// currency.js's logic is (see docs/api-reference.md § Verification).
// The HTTP boundary (functions/api/admin/reports/revenue.js) is a thin
// wrapper: requireStaff(), call buildRevenueReport(), return it.
//
// Every figure is in USD cents (payments.amount_usd_cents) regardless
// of which currency the student actually paid in — that field exists
// specifically so this report never needs to invent a display exchange
// rate to sum across currencies (see docs/payments-architecture.md).

import { db } from '../db.js';

export async function buildRevenueReport(env, { from, to } = {}) {
  const range = rangeClause(from, to, 'created_at');
  const rangeP = rangeClause(from, to, 'p.created_at');

  const [totals, refunded, byStatus, byCurrency, byLevel, byProvider, byDay] = await Promise.all([
    db(env).prepare(`SELECT count(*) as succeededCount, coalesce(sum(amount_usd_cents),0) as grossUsdCents
      FROM payments WHERE status = 'succeeded' ${range.sql}`).bind(...range.params).first(),
    db(env).prepare(`SELECT coalesce(sum(r.amount_cents),0) as refundedUsdCents
      FROM refunds r JOIN payments p ON p.id = r.payment_id
      WHERE r.status = 'processed' ${rangeP.sql}`).bind(...rangeP.params).first(),
    db(env).prepare(`SELECT status, count(*) as count, coalesce(sum(amount_usd_cents),0) as amountUsdCents
      FROM payments WHERE 1=1 ${range.sql} GROUP BY status ORDER BY status`).bind(...range.params).all(),
    db(env).prepare(`SELECT currency, count(*) as count, coalesce(sum(amount_usd_cents),0) as amountUsdCents
      FROM payments WHERE status = 'succeeded' ${range.sql} GROUP BY currency ORDER BY amountUsdCents DESC`).bind(...range.params).all(),
    db(env).prepare(`SELECT p.level_id as levelId, l.name as levelName, count(*) as count, coalesce(sum(p.amount_usd_cents),0) as amountUsdCents
      FROM payments p LEFT JOIN programme_levels l ON l.id = p.level_id
      WHERE p.status = 'succeeded' ${rangeP.sql}
      GROUP BY p.level_id ORDER BY amountUsdCents DESC`).bind(...rangeP.params).all(),
    db(env).prepare(`SELECT provider, count(*) as count, coalesce(sum(amount_usd_cents),0) as amountUsdCents
      FROM payments WHERE status = 'succeeded' ${range.sql} GROUP BY provider ORDER BY amountUsdCents DESC`).bind(...range.params).all(),
    db(env).prepare(`SELECT date(created_at) as date, count(*) as count, coalesce(sum(amount_usd_cents),0) as amountUsdCents
      FROM payments WHERE status = 'succeeded' ${range.sql} GROUP BY date(created_at) ORDER BY date ASC`).bind(...range.params).all(),
  ]);

  const grossUsdCents = totals?.grossUsdCents || 0;
  const refundedUsdCents = refunded?.refundedUsdCents || 0;

  return {
    range: { from: from || null, to: to || null },
    totals: {
      succeededCount: totals?.succeededCount || 0,
      grossUsdCents,
      refundedUsdCents,
      netUsdCents: grossUsdCents - refundedUsdCents,
    },
    byStatus: byStatus.results,
    byCurrency: byCurrency.results,
    byLevel: byLevel.results,
    byProvider: byProvider.results,
    byDay: byDay.results,
  };
}

function rangeClause(from, to, column) {
  const clauses = [];
  const params = [];
  if (from) { clauses.push(`${column} >= ?`); params.push(from); }
  if (to) { clauses.push(`${column} <= ?`); params.push(to); }
  return { sql: clauses.length ? ' AND ' + clauses.join(' AND ') : '', params };
}
