/**
 * CASH, AND THE CAPITAL THE PLAN NEEDS.
 *
 * The capital requirement is a CASH measure, not an accounting one. It is
 * the money that must be in the College's account so that, in every term
 * of the plan, the balance never falls below the minimum the policy
 * requires — three months of operating cost — however deep the early
 * years run.
 *
 * Because fees are billed level by level at the start of each level, the
 * College never holds a learner's money for teaching not yet begun, and
 * because every cost in the engine is charged in the term it is paid —
 * instructors from the term BEFORE the learners who need them, acquisition
 * a term before the enrolments it produces — the engine's cash flow is
 * the cash the College actually moves.
 *
 * The capital is released in tranches, each against a Board gate, so that
 * no founder funds a phase the institution has not earned the right to
 * enter.
 */
import { POLICY, val, termIndex, termLabel, TERMS } from './record.mjs';

export const GATES = [
  { key: 'establish', label: '2027-1', name: 'Establishment', condition: 'The founding capital is committed and the Board constituted' },
  { key: 'launch', label: '2027-3', name: 'Launch', condition: 'Levels I to III authored and reviewed, the platform tested, the academic offices and the first instructors in post' },
  { key: 'validate', label: '2029-1', name: 'Validation', condition: 'A full year of teaching, assessment, moderation and conferral completed and reviewed by the External Examiner; continuation within five points of plan' },
];

/**
 * @returns the capital requirement, the tranche released at each gate, and
 *          the cash balance term by term once the capital is in.
 */
export function capital(result, opts = {}) {
  const rows = result.rows;
  const minMonths = val(POLICY.cash.minimumMonths);
  // The minimum balance is three months of the cost of the term ahead —
  // the College holds what it is about to spend.
  const minimum = rows.map((r, t) => ((rows[t + 1] || r).costs / 4) * minMonths);
  const need = rows.map((r, t) => Math.max(0, minimum[t] - r.cumulative));
  const requirement = Math.max(...need);

  // Each tranche covers the requirement up to the next gate.
  const gateT = GATES.map((g) => termIndex(g.label));
  const tranches = GATES.map((g, i) => {
    const upTo = i + 1 < gateT.length ? gateT[i + 1] - 1 : TERMS - 1;
    const covered = Math.max(0, ...need.slice(0, upTo + 1));
    return { ...g, t: gateT[i], coversTo: termLabel(upTo), cumulative: covered };
  });
  tranches.forEach((tr, i) => { tr.amount = tr.cumulative - (i ? tranches[i - 1].cumulative : 0); });

  // A late tranche: capital arrives some terms after its gate.
  const delay = opts.trancheDelayTerms || 0;
  const drawn = new Array(TERMS).fill(0);
  tranches.forEach((tr, i) => {
    const at = Math.min(TERMS - 1, tr.t + (i >= 1 ? delay : 0));
    drawn[at] += tr.amount;
  });
  let injected = 0;
  const balance = rows.map((r, t) => {
    injected += drawn[t];
    return { t, label: r.label, balance: injected + r.cumulative, minimum: minimum[t] };
  });
  const lowest = balance.reduce((a, b) => (b.balance - b.minimum < a.balance - a.minimum ? b : a), balance[0]);
  const trough = rows.reduce((a, b) => (b.cumulative < a.cumulative ? b : a), rows[0]);
  return {
    requirement, tranches, balance, trough: { label: trough.label, cumulative: trough.cumulative },
    lowest: { label: lowest.label, headroom: lowest.balance - lowest.minimum },
    returnedBy: val(POLICY.capital.returnBy),
  };
}
