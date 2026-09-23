/**
 * THE TEN YEARS, ONE AT A TIME.
 *
 * For each year: the objective, the actions, the resources the model says
 * the year needs, the measures it is judged on, the money it requires,
 * the Board's decision at its end, and the condition that closes it.
 * The words come from data/plan/roadmap.json; every number is read from a
 * completed run.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { val, PROGRESSION, FIRST_YEAR, LAST_YEAR, TERMS_PER_YEAR, termIndex } from './record.mjs';
import { years } from './engine.mjs';
import { capital, GATES } from './capital.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const ROADMAP = JSON.parse(readFileSync(path.join(ROOT, 'data/plan/roadmap.json'), 'utf8'));
const sum = (xs) => xs.reduce((t, x) => t + x, 0);

/**
 * @param S  the result of price.solve()
 */
export function roadmap(S) {
  const Y = years(S.result);
  const K = capital(S.result);
  const rows = S.result.rows;
  const out = [];
  let prevEnd = null;
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
    const text = ROADMAP.years[String(y)];
    const yr = Y.find((x) => x.year === y);
    const rs = rows.filter((r) => r.year === y);
    const end = rs[rs.length - 1];
    const tranches = K.tranches.filter((tr) => Math.floor(tr.t / TERMS_PER_YEAR) + FIRST_YEAR === y);
    const hires = (k) => Math.max(0, k(end) - (prevEnd ? k(prevEnd) : 0));
    const academic = (r) => r.instructors.standard + r.instructors.senior + (r.posts.academicLead || 0);
    const professional = (r) => r.nonTeaching - (r.posts.academicLead || 0);
    const enrolled = yr.newLearners;
    // The cost of an enrolment: retail spend in the year's terms against
    // the retail enrolments each term's spend produced in the term after.
    let spend = 0; let retail = 0;
    for (const r of rs) {
      const next = rows[r.t + 1];
      if (!next) continue;
      spend += sum(Object.values(r.spendBy));
      retail += sum(Object.entries(next.newBy || {}).filter(([o]) => o in r.spendBy).map(([, v]) => sum(Object.values(v))));
    }
    out.push({
      year: y,
      ...text,
      resources: {
        academicStaff: academic(end), professionalStaff: professional(end),
        academicHires: hires(academic), professionalHires: hires(professional),
        acquisition: yr.cost.acquisition,
        platformAndOperations: yr.cost.technology + yr.cost.operations,
        payroll: yr.cost.academic + yr.cost.institution,
      },
      kpi: {
        enrolled, learnersAtYearEnd: end.active, awards: yr.awards,
        continuationPlanned: val(PROGRESSION.continuation),
        costPerEnrolment: retail > 0 && spend > 0 ? spend / retail : null,
        revenue: yr.revenue.net, surplus: yr.surplus,
      },
      finance: {
        cashflow: yr.cashflow, cumulative: yr.cumulative,
        tranches: tranches.map((t) => ({ name: t.name, amount: t.amount })),
        drawn: sum(tranches.map((t) => t.amount)),
      },
      capitalGate: GATES.find((g) => Math.floor(termIndex(g.label) / TERMS_PER_YEAR) + FIRST_YEAR === y && g.key !== 'establish') || null,
    });
    prevEnd = end;
  }
  return out;
}
