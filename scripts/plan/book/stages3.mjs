/**
 * STAGES V AND VI — the operating model, and the financial model.
 */
import * as G from './charts.mjs';
import { opener } from './stages1.mjs';
import { flow, H, SUB, Pp, LEAD, LIST, BOARD, KF, TABLE, FIG, BREAK, usd, usdM, usdK, gbp, num, pct } from './pages.mjs';

const k$ = (n) => (Math.abs(n) < 500 ? '0' : `${n < 0 ? '−' : ''}${Math.round(Math.abs(n) / 1000).toLocaleString('en-US')}`);
const sumBy = (rows, f) => rows.reduce((t, r) => t + f(r), 0);

/** A short attribution for a salary drawn from the earnings survey. */
function salaryBasis(s) {
  const soc = (s.match(/SOC (\d{4})/) || [])[1];
  const where = (s.match(/(UK|London) (median|upper quartile)/) || [])[0];
  return soc ? `ONS ASHE 2025, SOC ${soc}, ${where}` : 'See Appendix B';
}

export function stage5(F) {
  const R = F.R; const v = R.val; const PE = R.PEOPLE; const OC = PE.onCosts; const T = PE.teaching;
  const sections = [
    { t: 'From work to people', id: 's5-1' },
    { t: 'The establishment', id: 's5-2' },
    { t: 'Pay and its costs', id: 's5-3' },
    { t: 'The platform', id: 's5-4' },
    { t: 'Premises, assurance and governance', id: 's5-5' },
  ];
  const contracted = v(T.contractedHoursPerYear);
  const prod = contracted * v(T.deliveryShare); const prodP = contracted * v(T.deliveryShareWhenPrivate);
  const hourStd = F.P.academicHourUsd('standard', F.first, false, F.S.result.fx);
  const hourSen = F.P.academicHourUsd('senior', F.first, true, F.S.result.fx);
  const created = (p) => {
    if (p.from === 'channel') return 'A term before the first agreement is signed';
    if (p.from === 'route:executive') return `A term before the first Executive learner; then one for every ${num(p.perAdministrativeHours)} hours of executive administration a year`;
    if (p.kind === 'standing') return `From ${R.termLabel(R.termIndex(p.from))}`;
    const rule = p.perActive ? `one for every ${num(p.perActive)} learners studying` : p.perEnrolmentsPerTerm ? `one for every ${num(p.perEnrolmentsPerTerm)} new learners a term` : '';
    return `From ${R.termLabel(R.termIndex(p.from))}; at least ${p.base}, then ${rule}`;
  };
  const lastRow = F.lastRow;
  const postRows = [
    { cls: 'grp', cells: ['Academic staff, derived each term from the work'] },
    [{ v: 'Instructor', cls: 'nm' }, { v: 'As many as the standard routes’ teaching and assessment need, hired a term ahead', cls: 't' }, gbp(v(T.instructor.salaryGbp)), { v: salaryBasis(T.instructor.salaryGbp.s), cls: 'src' }, String(lastRow.instructors.standard)],
    [{ v: 'Senior academic', cls: 'nm' }, { v: 'As many as the Executive and Bespoke routes need', cls: 't' }, gbp(v(T.senior.salaryGbp)), { v: salaryBasis(T.senior.salaryGbp.s), cls: 'src' }, String(lastRow.instructors.senior)],
    [{ v: 'Academic lead', cls: 'nm' }, { v: `One for every ${v(T.instructorsPerAcademicLead)} academics`, cls: 't' }, gbp(v(T.senior.salaryGbp)), { v: 'Paid as a senior academic', cls: 'src' }, String(lastRow.posts.academicLead || 0)],
    { cls: 'grp', cells: ['The professional establishment'] },
    ...F.posts.map((p) => [{ v: p.name, cls: 'nm' }, { v: created(p), cls: 't' }, gbp(p.salary), { v: salaryBasis(p.source), cls: 'src' }, String(p.in2036)]),
    { cls: 'sum', cells: [`Staff at the end of ${F.lastYear}`, '', '', '', String(F.staff)] },
  ];
  const y36 = F.rows.filter((r) => r.year === F.lastYear);
  const tech = (k) => sumBy(y36, (r) => r.tech[k]);
  const eng = sumBy(y36, (r) => r.payByPost.platformEngineer || 0);
  const L = R.PLATFORM.lines;
  const techRows = [
    [{ v: 'Platform engineers', cls: 'nm' }, { v: 'Build and run the College’s own platform: learning, assessment, records, admissions and payments', cls: 't' }, { v: `${lastRow.posts.platformEngineer} on the establishment`, cls: 'src' }, usdK(eng)],
    [{ v: L.hosting.name, cls: 'nm' }, { v: 'Cloudflare Workers and the D1 database; requests and compute beyond the included allowance', cls: 't' }, { v: `$${v(L.hosting.fixedUsdPerMonth)} a month, $${v(L.hosting.usdPerMillionRequests)} per million requests`, cls: 'src' }, usdK(tech('hosting'))],
    [{ v: L.storage.name, cls: 'nm' }, { v: `Recorded spoken papers and submitted work, kept ${v(L.storage.retentionMonths) / 12} years`, cls: 't' }, { v: `$${v(L.storage.usdPerGbMonth)} per GB-month`, cls: 'src' }, usdK(tech('storage'))],
    [{ v: L.email.name, cls: 'nm' }, { v: 'Enrolment, schedule, results and conferral notices', cls: 't' }, { v: 'Resend, by monthly volume', cls: 'src' }, usdK(tech('email'))],
    [{ v: L.classroom.name, cls: 'nm' }, { v: 'One licence for every academic who teaches', cls: 't' }, { v: `$${v(L.classroom.usdPerHostMonth)} a licence a month`, cls: 'src' }, usdK(tech('classroom'))],
    [{ v: L.workplace.name, cls: 'nm' }, { v: 'Email, calendar and documents for every member of staff', cls: 't' }, { v: `$${v(L.workplace.usdPerUserMonth)} a user a month`, cls: 'src' }, usdK(tech('workplace'))],
    [{ v: L.security.name, cls: 'nm' }, { v: 'An independent penetration test of the platform every year', cls: 't' }, { v: `${gbp(v(L.security.gbpPerYear))} a year`, cls: 'src' }, usdK(tech('security'))],
    [{ v: L.registry.name, cls: 'nm' }, { v: 'The permanent record of every award, and its verification', cls: 't' }, { v: `$${v(L.registry.usdPerHolderYear)} a holder a year`, cls: 'src' }, usdK(tech('registry'))],
    { cls: 'sum', cells: ['The platform', '', '', usdK(eng + sumBy(y36, (r) => r.cost.technology))] },
  ];
  const op = (k) => sumBy(y36, (r) => r.ops[k]);
  const OL = R.OPERATIONS.lines;
  const opsRows = [
    [{ v: 'Premises', cls: 'nm' }, { v: `A serviced office in central London, one desk for every two professional staff, at ${gbp(v(OL.office.gbpPerDeskMonth))} a desk a month; and a registered office`, cls: 't' }, usdK(op('premises'))],
    [{ v: 'Insurance', cls: 'nm' }, { v: 'Professional indemnity, public and employers’ liability, cyber and directors’ cover', cls: 't' }, usdK(op('insurance'))],
    [{ v: 'Audit, accounts and registration', cls: 'nm' }, { v: 'A voluntary independent audit priced by turnover; accounting system and payroll; year-end accounts and tax; data protection and Companies House fees', cls: 't' }, usdK(op('assurance'))],
    [{ v: 'Legal', cls: 'nm' }, { v: 'Contracts, agreements with institutions, employment and data protection advice', cls: 't' }, usdK(op('legal'))],
    [{ v: 'External Examiners', cls: 'nm' }, { v: `${v(OL.externalExaminer.examiners)} examiners at ${gbp(v(OL.externalExaminer.gbpPerExaminerYear))} a year each, and a supplement for the Chief External Examiner`, cls: 't' }, usdK(op('examiner'))],
    [{ v: 'Board of Governors', cls: 'nm' }, { v: `${v(OL.governance.members)} independent governors, an honorarium and expenses for four meetings a year`, cls: 't' }, usdK(op('governance'))],
    [{ v: 'Accreditation', cls: 'nm' }, { v: `British Accreditation Council: application and inspection in ${OL.accreditation.applies.split('-')[0]}, an interim inspection a year later, re-inspection every ${v(OL.accreditation.cycleYears)} years and an annual fee`, cls: 't' }, usdK(op('accreditation'))],
    { cls: 'sum', cells: ['Premises, assurance and governance', '', usdK(sumBy(y36, (r) => r.cost.operations))] },
  ];
  const levyYear = (F.rows.find((r) => r.statutory && r.statutory.levy > 0) || {}).year;
  const blocks = [
    H('5.1', 'From work to people', 's5-1'),
    LEAD('The College does not decide how many teachers it employs. It counts the academic work its routes promise, term by term, and employs the people that work needs.'),
    Pp(
      `A full-time academic is contracted for ${num(contracted)} hours a year, thirty-seven and a half hours a week across forty-four weeks. Of that, the plan assumes ${pct(v(T.deliveryShare))} is spent teaching, marking, tutoring and advising, and the rest on preparation, standardisation and professional development: ${num(prod)} productive hours a year. An academic held available around executive learners’ own calendars cannot be timetabled as tightly, and gives ${pct(v(T.deliveryShareWhenPrivate))}: ${num(prodP)} hours.`,
      `Each term the model adds up the hours of assessment, seminars, tutorials, feedback and advising that the learners present require, adds the institution’s own academic work, divides by the productive hours of one academic, and rounds up to whole people. It hires them a term before they are needed. It can always recruit three academics in a term and, beyond that, can grow the academic staff by no more than a third in a term; when the work would outrun that, it admits fewer new learners rather than teach the ones it has less well. In the plan as set out, that never happens.`,
    ),
    KF([
      { v: gbp(Math.round(F.E.salaryIn(v(T.instructor.salaryGbp), F.first))), l: `An instructor’s salary, ${F.first}`, d: `The survey’s April 2025 median, carried forward at ${pct(v(OC.annualPayRise))} a year` },
      { v: usd(F.E.loadedUsd(v(T.instructor.salaryGbp), F.first)), l: 'Their whole cost to the College', d: 'With employer’s National Insurance and pension, in dollars' },
      { v: usd(hourStd), l: 'The cost of an academic hour', d: `${usd(hourSen)} for a senior academic held on private schedule` },
    ], 3),
    Pp('The cost of an academic hour is how the plan costs the work a route promises. It is not a price: the College sells no hours, and no fee in this plan is a number of hours multiplied by a rate.'),
    H('5.2', 'The establishment', 's5-2'),
    Pp('Two kinds of post make up the professional establishment. Standing posts exist because the institution exists and are filled on a date whatever the enrolment. Scaling posts are created by a threshold, such as the number of learners studying or of new learners each term, and are always filled by whole people, a term before the work that needs them arrives. Salaries are the Office for National Statistics’ April 2025 figures: national figures for the academics, who teach online from anywhere in the United Kingdom, and London figures for the establishment, which works from London.'),
    TABLE({
      title: 'Every post, what creates it and what it is paid',
      sub: `Salaries as surveyed, April 2025; the plan carries them forward ${pct(v(OC.annualPayRise))} a year`,
      head: [{ t: 'Office' }, { t: 'Created' }, { t: 'Salary', r: true }, { t: 'Salary basis' }, { t: F.lastYear, r: true }],
      widths: ['38mm', '63mm', '17mm', '42mm', '13mm'],
      rows: postRows,
    }),
    FIG({ title: 'The establishment, term by term', sub: 'People employed at the end of each term', svg: G.establishment(F.rows) }),
    H('5.3', 'Pay and its costs', 's5-3'),
    TABLE({
      title: 'What employing a person costs beyond their salary', split: false,
      head: [{ t: 'Cost' }, { t: 'Rate' }, { t: 'Source' }],
      widths: ['52mm', '58mm', '63mm'],
      rows: [
        ['Employer’s National Insurance', `${pct(v(OC.employerNiRate))} of pay above ${gbp(v(OC.employerNiThresholdGbp))} a year`, { v: 'HMRC, rates for 2026 to 2027', cls: 'src' }],
        ['Employment Allowance', `Up to ${gbp(v(OC.employmentAllowanceGbp))} a year off the employer’s National Insurance`, { v: 'HMRC, rates for 2026 to 2027', cls: 'src' }],
        ['Apprenticeship Levy', `${pct(v(OC.apprenticeshipLevyRate), 1)} of the pay bill, less ${gbp(v(OC.apprenticeshipLevyAllowanceGbp))} a year${levyYear ? `; payable from ${levyYear}` : ''}`, { v: 'HMRC, Pay Apprenticeship Levy', cls: 'src' }],
        ['Workplace pension', `${pct(v(OC.pensionRate))} of salary, above the statutory 3%`, { v: 'The College’s own policy', cls: 'src' }],
        ['Annual pay rise', `${pct(v(OC.annualPayRise))} a year across the establishment`, { v: 'Planning judgement', cls: 'src' }],
        ['Recruitment', `${pct(v(OC.recruitmentCostShare))} of first-year salary for each hire`, { v: 'Planning judgement', cls: 'src' }],
      ],
    }),
    H('5.4', 'The platform', 's5-4'),
    Pp('The College’s platform is its own: the learning environment, the assessment and recording workspace, the registry and its public verification, admissions and payments. The people who build and run it are on the establishment. What the College buys from others is priced from the vendors’ published pages and scales with the one thing that drives it.'),
    TABLE({
      title: `The platform in ${F.lastYear}`, split: false, sub: 'Unit prices as published in September 2026, carried forward at 2% a year',
      head: [{ t: 'Line' }, { t: 'What it is' }, { t: 'Unit price' }, { t: 'US$', r: true }],
      widths: ['40mm', '70mm', '45mm', '18mm'],
      rows: techRows,
    }),
    H('5.5', 'Premises, assurance and governance', 's5-5'),
    TABLE({
      title: `Running the institution in ${F.lastYear}`, split: false,
      head: [{ t: 'Line' }, { t: 'What it pays for' }, { t: 'US$', r: true }],
      widths: ['44mm', '111mm', '18mm'],
      rows: opsRows,
      note: 'At the scale of this plan the College is exempt from statutory audit; it is audited from its second year because founders and a Board require audited accounts.',
    }),
  ];
  return [
    opener({ n: 5, id: 'stage-5', title: 'Operating model', say: 'How the work each route promises becomes the people the College employs and when it hires them, what they cost, and the platform, premises and assurance the institution runs on.', sections }),
    flow(blocks, { rh: 'V · Operating model' }),
  ];
}

export function stage6(F) {
  const R = F.R; const v = R.val; const Y = F.Y; const K = F.K;
  const sections = [
    { t: 'The basis of the financial plan', id: 's6-1' },
    { t: 'The ten-year statement', id: 's6-2' },
    { t: 'Where the income comes from', id: 's6-3' },
    { t: 'Cash and capital', id: 's6-4' },
    { t: 'When the plan is wrong', id: 's6-5' },
  ];
  const yrs = Y.map((y) => String(y.year));
  const line = (name, f, cls = '') => ({ cls, cells: [name, ...Y.map((y) => ({ v: k$(f(y)), cls: f(y) < -499 ? 'neg' : '' }))] });
  const eng = (y) => sumBy(F.rows.filter((r) => r.year === y.year), (r) => r.payByPost.platformEngineer || 0);
  const stRows = [
    { cls: 'grp', cells: ['Learners'] },
    { cells: ['New learners', ...Y.map((y) => num(y.newLearners))] },
    { cells: ['Studying at the year’s end', ...Y.map((y) => num(y.activeEnd))] },
    { cls: 'grp', cells: ['Income, US$ thousands'] },
    line('Fees from learners', (y) => y.revenue.retail),
    line('Fees under agreement', (y) => y.revenue.agreement),
    line('Refunds', (y) => -y.revenue.refunds),
    line('Net fee revenue', (y) => y.revenue.net, 'sub'),
    { cls: 'grp', cells: ['Cost, US$ thousands'] },
    line('Teaching and assessment', (y) => y.cost.academic),
    line('Professional staff', (y) => y.cost.institution - eng(y)),
    line('Recruiting staff', (y) => y.cost.recruitment),
    line('The platform', (y) => y.cost.technology + eng(y)),
    line('Premises, assurance, governance', (y) => y.cost.operations),
    line('Finding learners', (y) => y.cost.acquisition),
    line('Collecting fees', (y) => y.cost.collection),
    line('Total cost', (y) => y.costs, 'sub'),
    line('Surplus or deficit', (y) => y.surplus, 'sum'),
    line('Less growth in what institutions owe', (y) => y.cashflow - y.surplus),
    line('Cash from operations', (y) => y.cashflow),
    line('Cumulative, before capital', (y) => y.cumulative, 'sub'),
  ];
  const w = ['41mm', ...yrs.map(() => '13.2mm')];
  const last = F.last;
  const routeRows = F.routes.map((r) => [{ v: r.name.replace('WEC-LC ', ''), cls: 'nm' }, num(r.learners2036), usdK(r.revenue2036), pct(r.revenue2036 / last.revenue.gross)]);
  const mktRows = F.markets.map((m) => [{ v: m.name, cls: 'nm' }, num(m.learners2036), num(m.viaAgreement2036), usdK(m.revenue2036), pct(m.revenue2036 / last.revenue.gross)]);
  const endOf = (y) => K.balance.filter((b) => F.rows[b.t].year === y).pop();
  const capRows = Y.map((y) => {
    const b = endOf(y.year);
    const drawn = K.tranches.filter((t) => F.rows[t.t].year === y.year).reduce((a, t) => a + t.amount, 0);
    return [String(y.year), { v: usdK(y.cashflow), cls: y.cashflow < 0 ? 'neg' : '' }, { v: usdK(y.cumulative), cls: y.cumulative < 0 ? 'neg' : '' }, drawn ? usdK(drawn) : '—', usdK(b.balance), usdK(b.minimum)];
  });
  const gradeName = { reserve: 'Returnable, reserve at target', returned: 'Returnable, reserve drawn', short: 'Not returnable by 2036' };
  const all = [...F.X.shocks, ...F.X.combined];
  const scRows = all.map((s) => [{ v: s.name, cls: 'nm' }, { v: s.s, cls: 't' }, usdM(s.capital), { v: usdM(s.cumulative), cls: s.cumulative < 0 ? 'neg' : '' }, s.returnYear.year ? String(s.returnYear.year) : 'After 2046']);
  const respRows = all.map((s) => [{ v: s.name, cls: 'nm' }, { v: s.warning || (s.shocks ? 'The warnings of each case it combines' : ''), cls: 't' }, { v: s.response || '', cls: 't' }]);
  const b = F.bases;
  const blocks = [
    H('6.1', 'The basis of the financial plan', 's6-1'),
    LEAD('This section says once what the numbers in this plan are and where they come from, so that no page needs to say it again.'),
    Pp(
      `The financial plan is one model, run term by term for the thirty terms from Spring ${F.first} to Autumn ${F.lastYear}. It begins with what the College decides to spend on finding learners and follows each consequence in order: enquiries, enrolments, learners at each level, the academic work their routes require, the people that work needs, and what those people, the platform, the premises, acquisition and collection cost. Fees are recognised in the term they are taught. Years are the sum of their terms.`,
      `Every number the model uses is one of ${num(F.register.length)} stated assumptions, listed with its source in Appendix B. ${num(b.evidenced)} are published external evidence, each naming the page it was read from and the date. ${num(b.design)} are specifications the College sets for itself, such as the number of assignments at each level or the size of a seminar cohort. ${num(b.management)} are planning judgements, such as how many learners continue from one level to the next. Those are the figures the College replaces first with its own measurement, and each is reported to the Board as that measurement arrives.`,
      `Fees are stated at ${F.first} prices and rise ${pct(v(R.POLICY.tariff.indexation))} a year with the pay of the people who deliver them. Salaries are the April 2025 survey figures, carried forward at the same rate. Every other price is as published or planned in 2026, carried forward at ${pct(v(R.POLICY.inflation))} a year. Sterling costs are converted at ${F.fx} dollars to the pound.`,
      'The model is held by tests that run each time it changes: every term’s costs reconcile to the dollar; every year is the sum of its terms; cash differs from surplus only by what institutions owe; no learner is taught a level before it is written; the staff always cover the work the routes promise; the fees rise with what each route provides; the margin is the smallest that passes the plan’s own test; and no figure in the model comes from outside the plan’s own record.',
    ),
    BREAK,
    H('6.2', 'The ten-year statement', 's6-2'),
    TABLE({
      title: `Learners, income, cost and cash, ${F.first} to ${F.lastYear}`, sub: 'US dollars in the money of each year, thousands; learners in whole numbers',
      head: [{ t: '' }, ...yrs.map((y) => ({ t: y, r: true }))], widths: w, rows: stRows, split: false,
      note: 'Professional staff excludes the platform engineers, who are shown with the platform. Cumulative cash is from operations alone; the founding capital is added in 6.4.',
    }),
    H('6.3', 'Where the income comes from', 's6-3'),
    TABLE({ title: `By route, ${F.lastYear}`, split: false, sub: 'Learners studying in an average term; gross fees for the year',
      head: [{ t: 'Route' }, { t: 'Learners', r: true }, { t: 'Fees', r: true }, { t: 'Share', r: true }], widths: ['70mm', '34mm', '35mm', '34mm'], rows: routeRows }),
    TABLE({ title: `By market, ${F.lastYear}`, split: false, sub: 'Places bought under agreement are attributed to the markets where agreements are signed',
      head: [{ t: 'Market' }, { t: 'Learners', r: true }, { t: 'Of whom under agreement', r: true }, { t: 'Fees', r: true }, { t: 'Share', r: true }], widths: ['56mm', '26mm', '37mm', '28mm', '26mm'], rows: mktRows }),
    H('6.4', 'Cash and capital', 's6-4'),
    Pp(
      `The founding capital is a cash measure. It is the money the College must have so that in every term its balance stays at or above three months of the cost of the term ahead, however deep the early years run. On the plan as set out, that is ${usdM(F.capital, 2)}. It is drawn in three tranches, each against a Board gate, and each covers the College until the next.`,
      `Because fees are billed level by level at the start of each level, the College never holds a learner’s money for teaching not yet begun, and the cash it holds is its own. Institutions pay on their own terms, so what they owe at the end of a term is carried and counted: the plan’s cash is its surplus less the growth in what institutions owe.`,
    ),
    TABLE({ title: 'Cash, year by year', split: false, sub: 'US dollars in the money of each year',
      head: [{ t: 'Year' }, { t: 'Cash from operations', r: true }, { t: 'Cumulative', r: true }, { t: 'Capital drawn', r: true }, { t: 'Balance at year end', r: true }, { t: 'Minimum', r: true }],
      widths: ['20mm', '31mm', '30mm', '28mm', '34mm', '30mm'], rows: capRows }),
    BREAK,
    H('6.5', 'When the plan is wrong', 's6-5'),
    Pp('Each case below changes one assumption, or several at once, and runs the whole model again at the published fees, because the College does not change its prices when a year goes badly. A shock changes what the College teaches, which changes whom it admits and the staff it needs, so none of these is a percentage applied to a finished total.'),
    FIG({ title: `Cash held at the end of ${F.lastYear}, case by case`, sub: 'Before the founding capital is returned. Sapphire: capital returnable with the reserve at target; gold: returnable with the reserve drawn; crimson: not yet returnable.',
      svg: G.shocks([{ ...F.X.central, key: 'central', name: 'The plan as set out' }, ...all], F.X.central, F.X.central.reserveTarget) }),
    TABLE({ title: 'The cases', head: [{ t: 'Case' }, { t: 'What changes' }, { t: 'Capital needed', r: true }, { t: `Cash, end ${F.lastYear}`, r: true }, { t: 'Capital returnable', r: true }],
      widths: ['40mm', '76mm', '19mm', '19mm', '19mm'], rows: scRows }),
    TABLE({ title: 'What the College watches for, and what it does', head: [{ t: 'Case' }, { t: 'The early warning' }, { t: 'The response' }],
      widths: ['40mm', '55mm', '78mm'], rows: respRows }),
    BOARD('The contingency', `A slow start, with the Gulf late, conversion lower and acquisition dearer together, needs ${usdM(F.contingency, 2)} more than the plan. The founders should hold that sum available and not draw it. The Validation gate in ${K.tranches[2].label.split('-')[0]} is designed to show, before the third tranche, whether it will be needed.`),
  ];
  return [
    opener({ n: 6, id: 'stage-6', title: 'Financial model', say: 'The basis of every number in the plan, the ten-year statement, where the income comes from, the cash and the capital it needs, and what happens when the plan is wrong.', sections }),
    flow(blocks, { rh: 'VI · Financial model' }),
  ];
}
