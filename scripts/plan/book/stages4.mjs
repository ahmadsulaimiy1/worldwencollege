/**
 * STAGES VII TO X — the ten years, governance, the investment case and
 * the appendices.
 */
import * as G from './charts.mjs';
import { opener, ROMAN } from './stages1.mjs';
import { fixed, field, flow, H, SUB, Pp, LEAD, LIST, BOARD, KF, TABLE, FIG, BREAK, usd, usdM, usdK, gbp, num, pct, esc } from './pages.mjs';

const money = (n) => `<div class="v${n < 0 ? ' neg' : ''}">${usdM(n, 2)}</div>`;
const cellN = (label, value, neg = false, small = false) => `<div><div class="v${neg ? ' neg' : ''}${small ? ' small' : ''}">${value}</div><div class="l">${esc(label)}</div></div>`;

export function stage7(F) {
  const RY = F.RY;
  const sections = [{ t: 'The decade at a glance', id: 's7-0' }, ...RY.map((y) => ({ t: `${y.year} · ${y.phase}`, id: `y${y.year}` }))];
  const glanceRows = RY.map((y) => [{ v: String(y.year), cls: 'nm' }, { v: y.phase, cls: 'nm' }, { v: y.objective, cls: 't' },
    y.finance.drawn ? usdM(y.finance.drawn, 2) : '—', { v: usdK(y.kpi.surplus), cls: y.kpi.surplus < 0 ? 'neg' : '' }]);
  const glance = flow([
    H('7.0', 'The decade at a glance', 's7-0'),
    Pp('Each year of the plan has one objective, the actions that achieve it, the resources the model says it needs, the measures it is judged on, the money it requires, the decision the Board takes at its end and the condition that closes it. The words are the plan’s design; every number is read from the model for that year.'),
    FIG({ title: 'Ten years, ten gates', sub: 'The phase of each year; gold marks the years in which a tranche of the founding capital is drawn', svg: G.phases(RY) }),
    TABLE({ title: 'The ten years', split: false, head: [{ t: 'Year' }, { t: 'Phase' }, { t: 'Objective' }, { t: 'Capital drawn', r: true }, { t: 'Surplus', r: true }],
      widths: ['14mm', '30mm', '91mm', '20mm', '18mm'], rows: glanceRows }),
  ], { rh: 'VII · Ten-year roadmap' });
  const years = RY.map((y) => {
    const r = y.resources; const k = y.kpi; const f = y.finance;
    const drawnNote = f.tranches.length ? f.tranches.map((t) => `${t.name} ${usdM(t.amount, 2)}`).join('; ') : 'None';
    return fixed(field(`<div class="yr" id="y${y.year}">
      <div class="yr__head"><div class="y">${G.goldWord(String(y.year), { size: 120, width: 300 })}</div>
        <div><div class="ph">${esc(y.phase)}</div><div class="ob">${esc(y.objective)}</div></div></div>
      <div class="yr__sec full"><h4>Actions</h4><ul>${y.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
      <div class="yr__sec"><h4>Resources</h4><div class="yr__nums">
        ${cellN('Academic staff at year end', num(r.academicStaff))}
        ${cellN('Professional staff at year end', num(r.professionalStaff))}
        ${cellN('Academics hired in the year', num(r.academicHires))}
        ${cellN('Professional staff hired', num(r.professionalHires))}
        ${cellN('Payroll', usdM(r.payroll, 2))}
        ${cellN('Finding learners', usdM(r.acquisition, 2))}
      </div></div>
      <div class="yr__sec"><h4>Measures</h4><div class="yr__nums">
        ${cellN('New learners', num(k.enrolled))}
        ${cellN('Studying at year end', num(k.learnersAtYearEnd))}
        ${cellN('Levels completed', num(k.awards))}
        ${cellN('Cost of an enrolment', k.costPerEnrolment ? usd(k.costPerEnrolment) : '—')}
        ${cellN('Net fee revenue', usdM(k.revenue, 2))}
        ${cellN('Surplus or deficit', usdM(k.surplus, 2), k.surplus < 0)}
      </div></div>
      <div class="yr__sec full"><h4>Financial requirement</h4><div class="yr__nums" style="grid-template-columns:repeat(4,1fr)">
        ${cellN('Cash from operations', usdM(f.cashflow, 2), f.cashflow < 0)}
        ${cellN('Cumulative, before capital', usdM(f.cumulative, 2), f.cumulative < 0)}
        ${cellN('Capital drawn', f.drawn ? usdM(f.drawn, 2) : '—')}
        ${cellN('Tranche released', drawnNote, false, true)}
      </div></div>
      <div class="yr__gate"><div><h4>Board gate</h4><p>${esc(y.gate)}</p></div><div><h4>Exit condition</h4><p>${esc(y.exit)}</p></div></div>
      <div class="yr__sec full yr__band"><h4>The year in the decade · surplus or deficit</h4>${G.yearStrip(F.Y, y.year)}</div>
    </div>`), { rh: `VII · Ten-year roadmap · ${y.year}` });
  });
  return [
    opener({ n: 7, id: 'stage-7', title: 'Ten-year roadmap', say: 'The decade one year at a time: what each year must achieve, how, with what, how it is measured, what it costs, and the decision the Board takes before the next begins.', sections: sections.slice(0, 11) }),
    glance, ...years,
  ];
}

export function stage8(F) {
  const R = F.R; const v = R.val;
  const sections = [
    { t: 'The Board of Governors', id: 's8-1' },
    { t: 'Academic governance', id: 's8-2' },
    { t: 'The gates', id: 's8-3' },
    { t: 'What the Board sees every term', id: 's8-4' },
    { t: 'The risk register', id: 's8-5' },
  ];
  const gateRows = F.RY.map((y) => [{ v: String(y.year), cls: 'nm' }, { v: y.gate, cls: 't' }, y.finance.drawn ? usdM(y.finance.drawn, 2) : '—']);
  const gulf = F.markets.find((m) => m.key === 'gulf');
  const measures = [
    ['New learners, by market', 'Stage VI and the roadmap, term by term', 'Two consecutive intakes below plan'],
    ['Cost of an enrolment, by market', `${usd(gulf.aq.cac)} in the Gulf over the decade; each market’s ceiling in Stage III`, 'Above plan for two terms, or above the ceiling at all'],
    ['Continuation and completion, by level', 'Stage II', 'Five points below plan at any level for two terms'],
    ['Seminar cohorts', 'No cohort above its route’s limit', 'Any cohort above the limit'],
    ['Academic staff against the work', 'Always covered, hired a term ahead', 'A term in which admissions are held back'],
    ['Cash against the minimum', 'Three months of the next term’s cost', 'Headroom below one month'],
    ['Agreements signed, and what institutions owe', 'Stage III', 'No agreement by the planned opening term; payment past terms'],
    ['External Examiners’ reports', 'Received and answered each year', 'Any finding on the standard'],
  ].map((r) => r.map((c, i) => ({ v: c, cls: i ? 't' : 'nm' })));
  const risks = [...F.X.shocks].sort((a, b) => b.capital - a.capital).map((s) => [{ v: s.name, cls: 'nm' }, { v: s.warning || '', cls: 't' }, { v: s.response || '', cls: 't' }, usdM(s.capital - F.capital, 2)]);
  const blocks = [
    H('8.1', 'The Board of Governors', 's8-1'),
    LEAD(`The College is governed by a Board of ${v(R.OPERATIONS.lines.governance.members)} independent governors, meeting four times a year. The Board appoints the Principal, holds the College to this plan and takes the decisions the plan reserves to it.`),
    SUB('Decisions reserved to the Board'),
    LIST([
      'The release of each tranche of the founding capital, against its gate.',
      'The form of the founding capital and the terms of its return.',
      'The tariff, and any change to it beyond the annual indexation.',
      'Entry into a new market or channel, and the step-up of any market’s acquisition budget.',
      'Any use of the reserve, and any fall of cash below the minimum.',
      'The appointment of the Principal and the academic offices, and of the External Examiners on the Director of Academic Standards’ nomination.',
      'The adoption of the second ten-year plan.',
    ]),
    H('8.2', 'Academic governance', 's8-2'),
    Pp(
      'The Director of Academic Standards is responsible for the qualification: its curriculum, its assessment and the standard at which it is awarded. Results are confirmed by the Examination Board before they are released, and the External Examiners report each year directly to the Board of Governors as well as to the Director.',
      'Those who recruit learners take no part in assessing them. The Head of Marketing and Admissions reports to the Principal and has no role in marking, moderation or the Examination Board, and no fee, agreement or route changes the assessment a learner receives.',
    ),
    H('8.3', 'The gates', 's8-3'),
    TABLE({ title: 'A decision at the end of every year', split: false, head: [{ t: 'Year' }, { t: 'The Board confirms' }, { t: 'Capital', r: true }], widths: ['16mm', '137mm', '20mm'], rows: gateRows }),
    H('8.4', 'What the Board sees every term', 's8-4'),
    TABLE({ title: 'The measures', split: false, head: [{ t: 'Measure' }, { t: 'Plan' }, { t: 'Brought to the Board when' }], widths: ['50mm', '66mm', '57mm'], rows: measures }),
    H('8.5', 'The risk register', 's8-5'),
    Pp('The register is drawn from the model’s own cases (Stage VI). Each risk is ranked by the additional capital the College would need if it happened and nothing were done; each has the early warning that would show it coming and the response the plan commits to.'),
    TABLE({ title: 'Risks, their warnings and the responses', head: [{ t: 'Risk' }, { t: 'Early warning' }, { t: 'Response' }, { t: 'Extra capital', r: true }], widths: ['36mm', '48mm', '71mm', '18mm'], rows: risks }),
  ];
  return [
    opener({ n: 8, id: 'stage-8', title: 'Governance', say: 'Who decides what, how the academic standard is protected from commercial pressure, the gate at the end of each year, what the Board sees every term, and the risks it watches.', sections }),
    flow(blocks, { rh: 'VIII · Governance' }),
  ];
}

export function stage9(F) {
  const K = F.K; const last = F.last;
  const sections = [
    { t: 'What is asked', id: 's9-1' },
    { t: 'What it builds', id: 's9-2' },
    { t: 'When it returns', id: 's9-3' },
    { t: 'How the capital is protected', id: 's9-4' },
    { t: 'What would change the case', id: 's9-5' },
  ];
  const sh = (k) => F.X.shocks.find((s) => s.key === k);
  const [s1, s2, s3] = F.scaleLever;
  const blocks = [
    H('9.1', 'What is asked', 's9-1'),
    LEAD(`The founders are asked to commit ${usdM(F.capital, 2)} to establish the College, released in three tranches against three decisions of the Board, and to hold a further ${usdM(F.contingency, 2)} available against a slow start.`),
    KF(K.tranches.map((t) => ({ v: usdM(t.amount, 2), l: `${t.name}, ${F.R.termLabel(F.R.termIndex(t.label))}`, d: t.condition }))),
    Pp('The form of the capital, whether equity, loan, grant or a combination, is reserved to the founders and the Board. The plan sizes the requirement and the gates against which it is released; it does not assume the form, and nothing in the model depends on it.'),
    H('9.2', 'What it builds', 's9-2'),
    Pp(`By ${F.lastYear} the capital has built an institution teaching about ${num(Math.round(F.activeEnd / 10) * 10)} learners at any time, admitting about ${num(Math.round(F.newPerYear / 10) * 10)} a year across four markets and two agreement channels, and employing ${F.staff} people: ${F.academicStaff} academics and ${F.professionalStaff} professional staff. It awards its own qualification at six levels, examined and double-marked at every level, on a platform it owns, and keeps a permanent record of every award it has made. It takes ${usdM(last.revenue.net)} a year in fees and spends ${usdM(last.costs)}.`),
    H('9.3', 'When it returns', 's9-3'),
    KF([
      { v: F.trough.label, l: 'Lowest cash', d: `${usdM(F.trough.cumulative, 2)} before capital` },
      { v: String(F.firstSurplusYear), l: 'First surplus', d: 'Fees exceed the whole cost of the institution' },
      { v: String(F.returnYear), l: 'Capital returnable', d: 'Cash from operations covers the founding capital' },
      { v: usdM(last.cumulative, 2), l: `Cash, end ${F.lastYear}`, d: `Against a reserve target of ${usdM(F.X.central.reserveTarget, 2)}` },
    ], 4),
    Pp(`The plan’s test is that by the end of ${F.lastYear} the College holds enough cash from its own operations to return every dollar of founding capital and still hold six months of operating cost in reserve. The fees are set to pass that test and no more: the margin in every fee is the smallest that does.`),
    H('9.4', 'How the capital is protected', 's9-4'),
    LIST([
      '<b>Gates.</b> No tranche is released until the Board confirms the College has done what the previous one was for, and the third waits for a full year of measured results.',
      '<b>A minimum balance.</b> The College never plans to hold less than three months of the cost of the term ahead.',
      '<b>Fees before teaching, never before the level.</b> A learner pays at the start of each level, so the College is paid for the teaching it is about to do and holds no one’s money for teaching it has not begun.',
      '<b>Staff against work.</b> Academics are hired only for the work the learners present require, a term ahead; the establishment grows by thresholds, not by ambition.',
      '<b>Acquisition within its payback.</b> No market is funded past the point at which its last dollar is repaid within a learner’s first level, and budgets step up only when the market before has converted to plan.',
      '<b>A reserve.</b> Six months of operating cost by the end of the decade, to teach every enrolled learner to the end of their level and to carry a year in which enrolment falls and cost does not.',
    ]),
    H('9.5', 'What would change the case', 's9-5'),
    Pp(
      `Four things would change the case most. The first is the cost of finding a learner: at the benchmark’s averages rather than its medians, the College would need ${usdM(sh('benchmarkAverages').capital)} and could not return its capital within the decade, which is why acquisition is measured before the third tranche is drawn and budgets are released against measured cost. The second is sterling: a pound ten per cent stronger for the whole decade adds ${usdM(sh('sterlingStronger').capital - F.capital, 2)} to the capital needed. The third is the pay of academics: fifteen per cent higher adds ${usdM(sh('payHigher').capital - F.capital, 2)}. The fourth is enrolment: a fifth lower in every market and channel adds ${usdM(sh('enrolmentLower').capital - F.capital, 2)}.`,
      `The same model shows the upside. Markets half as large again would lower every fee, the Guided level from ${usd(s1.tariff.guided)} to ${usd(s2.tariff.guided)}, for ${usdM(s2.capital - s1.capital, 2)} more capital; twice as large, to ${usd(s3.tariff.guided)} for ${usdM(s3.capital - s1.capital, 2)} more. The first two years of recruitment will show which is nearer the truth.`,
    ),
    BOARD('The decision', `To commit ${usdM(F.capital, 2)} in three tranches against the Establishment, Launch and Validation gates; to hold ${usdM(F.contingency, 2)} available and undrawn; and to decide the form of the capital.`),
  ];
  return [
    opener({ n: 9, id: 'stage-9', title: 'Investment case', say: 'What the founders are asked to commit and against which decisions, what the capital builds, when it can be returned, how it is protected, and what would change the case.', sections, crimson: true }),
    flow(blocks, { rh: 'IX · Investment case' }),
  ];
}

// ── The appendices ───────────────────────────────────────────────────
const FILES = {
  'qualification.json': 'The qualification', 'routes.json': 'The routes', 'progression.json': 'Progression',
  'markets.json': 'Markets and acquisition', 'comparables.json': 'Published prices in the markets', 'people.json': 'People and pay',
  'platform.json': 'The platform', 'operations.json': 'Premises, assurance and governance', 'policy.json': 'Policy',
};
const WORDS = {
  levels: 'Levels', levelNames: 'Level names', modulesPerLevel: 'Modules a level', termsPerYear: 'Terms a year', monthsPerTerm: 'Months a term',
  teachingWeeksPerTerm: 'Teaching weeks a term', assignmentsPerLevel: 'Assignments a level', examinationsPerLevel: 'Examinations a level',
  secondMarkingShare: 'Share of scripts second-marked', reconciliationRate: 'Scripts needing reconciliation', reconciliationEffort: 'Effort of a reconciliation',
  resitRate: 'Resit rate', candidatesPerInvigilator: 'Candidates per invigilator', sittingHours: 'Length of the examination sitting',
  assignmentFirst: 'First marking, an assignment', writtenPaperFirst: 'First marking, a written paper', spokenPaperFirst: 'First marking, a spoken paper',
  moderationHoursPerLevelTerm: 'Moderation, per level taught', moderationSampleShare: 'Moderation sample', examinationBoardHoursPerTerm: 'Examination Board',
  paperVersionsPerLevelYear: 'Paper versions a level a year', hoursPerPaperVersion: 'Writing one paper version', curriculumMaintenanceHoursPerModuleYear: 'Curriculum maintenance',
  qualityReviewHoursPerYear: 'Quality review', authoringHoursPerModule: 'Writing a module', levelAuthoredTermsAhead: 'Levels written ahead',
  seminarHoursPerLevel: 'Seminar hours', sectionCap: 'Largest cohort', feedbackMinutesPerAssignment: 'Feedback per assignment', monitoringHoursPerLevel: 'Progress monitoring',
  adviserHoursPerLevel: 'Adviser', tutorialHoursPerLevel: 'Tutorials', reviewHoursPerLevel: 'Progress review', leadershipStrandHoursPerLevel: 'Leadership strand',
  oversightHoursPerLevel: 'Senior oversight', administrationHoursPerLevel: 'Administration', authoringHoursPerLevel: 'Material written for the learner',
  strandAuthoringHoursPerLevel: 'Writing the leadership strand',
  employerNiRate: 'Employer’s National Insurance', employerNiThresholdGbp: 'National Insurance threshold', employmentAllowanceGbp: 'Employment Allowance',
  apprenticeshipLevyRate: 'Apprenticeship Levy', apprenticeshipLevyAllowanceGbp: 'Levy allowance', pensionRate: 'Pension', salaryBasisYear: 'Salary survey year',
  recruitmentCostShare: 'Cost of a hire', annualPayRise: 'Annual pay rise', salaryGbp: 'Salary', contractedHoursPerYear: 'Contracted hours',
  deliveryShare: 'Share of time delivering', deliveryShareWhenPrivate: 'Share, on private schedule', instructorsPerAcademicLead: 'Academics per lead',
  minPerTerm: 'Fewest hires a term', growthPerTerm: 'Fastest growth a term',
  fixedUsdPerMonth: 'Fixed monthly charge', requestsPerActiveLearnerMonth: 'Requests per learner a month', includedRequestsPerMonth: 'Requests included',
  usdPerMillionRequests: 'Per million requests', cpuMsPerRequest: 'Compute per request', includedCpuMsPerMonth: 'Compute included', usdPerMillionCpuMs: 'Per million CPU ms',
  rowsWrittenPerActiveLearnerMonth: 'Rows written per learner a month', includedRowsWrittenPerMonth: 'Rows written included', usdPerMillionRowsWritten: 'Per million rows written',
  mbPerLearner: 'Record size per learner', includedGb: 'Storage included', usdPerGbMonth: 'Per GB-month', gbPerLearnerLevel: 'Storage per learner-level',
  retentionMonths: 'Retention', usdPerMonthAt: 'Price by monthly volume', emailsPerActiveLearnerMonth: 'Emails per learner a month', usdPerHostMonth: 'Per licence a month',
  usdPerUserMonth: 'Per user a month', gbpPerYear: 'A year', usdPerYear: 'A year', usdPerHolderYear: 'Per award-holder a year',
  gbpPerDeskMonth: 'Per desk a month', deskShareOfNonTeachingStaff: 'Desks per professional', shareOfRevenue: 'Share of revenue', policy: 'Policy',
  gbpByTurnoverGbp: 'Fee by turnover', gbpPerMonth: 'A month', gbpPerPayslipMonth: 'Per person paid a month', gbpOnce: 'Once', usdOnce: 'Once',
  examiners: 'Examiners', gbpPerExaminerYear: 'Per examiner a year', chiefSupplementGbp: 'Chief examiner’s supplement', members: 'Members',
  usdPerMemberYear: 'Per member a year', why: 'Decision', applicationGbp: 'Application', inspectionManagementGbp: 'Inspection management',
  inspectionGbp: 'Inspection', interimInspectionGbp: 'Interim inspection', cycleYears: 'Accreditation cycle', annualGbpByEnrolled: 'Annual fee by enrolment',
  enquiryToApplication: 'Enquiries that apply', applicationToPlacement: 'Applicants placed', placementToOffer: 'Placed applicants offered', offerToEnrolment: 'Offers accepted',
  saturation: 'Saturation', leadTerms: 'Enquiry to enrolment', costPerEnquiryUsd: 'Cost of an enquiry', referenceSpendUsd: 'Reference budget', routes: 'Route mix',
  spendUsd: 'Budget by year', cardMix: 'Cards by class', discount: 'Discount', seatsPerAgreement: 'Places per agreement', agreementsPerYear: 'Agreements by year',
  originationUsd: 'Cost to win one', receivableDays: 'Paid within', markets: 'Where signed', first: 'First year', last: 'Last year',
  fxUsdPerGbp: 'Exchange rate', inflation: 'Inflation', priceBaseYear: 'Price base year', cardShareOfRetail: 'Paid by card', ukStandard: 'UK standard cards',
  ukPremium: 'UK premium cards', eea: 'EEA cards', international: 'International cards', conversion: 'Currency conversion', fixedGbp: 'Fixed per payment',
  paymentsPerLevel: 'Payments per level', billedAhead: 'Billed', withdrawalRate: 'Withdrawn and refunded', indexation: 'Fee indexation', roundingUsd: 'Fees rounded to',
  onePriceWorldwide: 'One price worldwide', pricingVolumeYear: 'Pricing volume year', targetMonths: 'Reserve target', minimumMonths: 'Minimum cash',
  payrollLeadTerms: 'Hired ahead', returnBy: 'Capital returnable by', form: 'Form of capital', completion: 'Completion by level', continuation: 'Continuation by level',
  entryLevel: 'Placement by level', usd: 'In dollars',
};
function nameAt(file, path) {
  const R = F_.R;
  const data = { 'qualification.json': R.QUALIFICATION, 'routes.json': R.ROUTES, 'people.json': R.PEOPLE, 'platform.json': R.PLATFORM,
    'operations.json': R.OPERATIONS, 'markets.json': R.MARKETS, 'policy.json': R.POLICY, 'progression.json': R.PROGRESSION, 'comparables.json': R.COMPARABLES }[file];
  const keys = path.split('.');
  let node = data; let owner = '';
  for (let i = 0; i < keys.length - 1; i++) {
    node = node && node[keys[i]];
    if (node && typeof node === 'object' && (node.name || node.provider)) owner = node.name || node.provider;
  }
  const leaf = keys[keys.length - 1];
  const word = WORDS[leaf] || leaf.replace(/([A-Z])/g, ' $1').toLowerCase();
  if (keys[0] === 'teaching' && keys[1] !== 'contractedHoursPerYear' && keys.length === 3) owner = keys[1] === 'senior' ? 'Senior academic' : 'Instructor';
  return owner ? `${owner.replace('WEC-LC ', '')}: ${word.charAt(0).toLowerCase() + word.slice(1)}` : word;
}
let F_ = null;
function fmt(r) {
  const x = r.value; const u = r.unit || '';
  if (x === null || x === undefined) return '—';
  if (typeof x === 'boolean') return x ? 'Yes' : 'No';
  if (typeof x === 'string') return x.charAt(0).toUpperCase() + x.slice(1);
  if (Array.isArray(x)) {
    if (Array.isArray(x[0])) return x.map(([a, b]) => `${num(a)}: ${/GBP/.test(u) ? gbp(b) : usd(b)}`).join('; ');
    if (/share/.test(u)) return x.map((y) => pct(y)).join(', ');
    return x.join(', ');
  }
  if (typeof x === 'object') {
    const e = Object.entries(x);
    if (!e.length) return 'None';
    return e.map(([k, y]) => `${k.length === 4 && /^\d+$/.test(k) ? k : k} ${/USD/.test(u) ? usdK(y) : y < 1 ? pct(y) : num(y)}`).join('; ');
  }
  if (/^share|share of|per year$|^exponent/.test(u) && x < 1) return pct(x, x < 0.1 && x * 1000 % 10 ? 2 : x * 100 % 1 ? 1 : 0);
  if (/^GBP/.test(u)) return gbp(x);
  if (/^USD/.test(u)) return x < 1 ? `$${x}` : usd(x, x % 1 ? 2 : 0);
  if (u === 'year') return String(x);
  return `${num(x, x % 1 ? 2 : 0)} ${u}`.trim();
}

export function stage10(F) {
  F_ = F;
  const R = F.R; const b = F.bases;
  const sections = [
    { t: 'A · The basis of the plan', id: 'app-a' },
    { t: 'B · Every assumption and its source', id: 'app-b' },
    { t: 'C · The model, term by term', id: 'app-c' },
    { t: 'D · The work of each route', id: 'app-d' },
    { t: 'E · Terms used in this plan', id: 'app-e' },
  ];
  const BASIS = {
    evidenced: 'Evidence', design: 'Specification', management: 'Judgement', policy: 'Policy',
  };
  const regRows = [];
  let lastFile = '';
  const ORDER = Object.keys(FILES);
  const ordered = [...F.register].sort((a, b) => ORDER.indexOf(a.file) - ORDER.indexOf(b.file));
  for (const r of ordered) {
    if (r.file !== lastFile) { regRows.push({ cls: 'grp', cells: [FILES[r.file] || r.file] }); lastFile = r.file; }
    regRows.push([{ v: esc(nameAt(r.file, r.path)), cls: 't' }, esc(fmt(r)), BASIS[r.basis] || r.basis, { v: esc(r.source), cls: 'src' }]);
  }
  const termRows = F.rows.map((r) => [r.label, num(r.newLearners), num(r.active), `${r.instructors.standard} + ${r.instructors.senior}`, String(r.staff),
    usdK(r.revenue.net), usdK(r.costs), { v: usdK(r.surplus), cls: r.surplus < 0 ? 'neg' : '' }, { v: usdK(r.cumulative), cls: r.cumulative < 0 ? 'neg' : '' }]);
  const workRows = F.routes.map((r) => {
    const o = r.own;
    return [{ v: r.name.replace('WEC-LC ', ''), cls: 'nm' }, o.hours.assessment.toFixed(1), o.hours.seminar.toFixed(1), o.hours.individual.toFixed(1),
      (o.hours.assessment + o.hours.seminar + o.hours.individual).toFixed(1), o.fill ? pct(o.fill) : '—', r.grade === 'senior' ? 'Senior' : 'Instructor', usd(o.usd)];
  });
  const glossary = [
    ['Level', 'One of the six stages of the qualification, A1 to C2, each a qualification in its own right, studied over one term.'],
    ['Route', 'One of the five ways of studying for the qualification, defined by the support the learner receives.'],
    ['Pathway', 'All six levels of a route; its price is six level fees.'],
    ['Term', 'Four months, the unit in which the College teaches, examines and admits. There are three a year.'],
    ['Cohort', 'A seminar group on the Guided, Tutored or Executive route; each route sets its largest size.'],
    ['Second marking', 'Every assessed script is marked independently by two examiners.'],
    ['Moderation', 'A review each term of a sample of marked work at every level, to hold marking to one standard.'],
    ['Examination Board', 'The body that confirms results before they are released.'],
    ['External Examiner', 'An academic from outside the College who reviews the standard of its awards and reports to the Board.'],
    ['Placement', 'The assessment that decides the level at which a new learner begins.'],
    ['Continuation', 'The share of learners completing a level who begin the next in the following term.'],
    ['Cost of an enrolment', 'What the College spends on finding learners in a market, divided by the learners it enrols there.'],
    ['Contribution of a level', 'A level fee less the route’s own teaching and assessment and the cost of collecting it.'],
    ['Payback ceiling', 'The budget beyond which a market’s last dollar of acquisition would not be repaid within a learner’s first level.'],
    ['Tranche', 'A part of the founding capital, released at a Board gate.'],
    ['Gate', 'A decision the Board takes, on stated evidence, before the plan moves to its next phase.'],
    ['Minimum balance', 'Three months of the cost of the term ahead, which the College always holds.'],
    ['Reserve', 'Six months of operating cost, held by the end of the decade.'],
    ['Margin', 'The share of each fee that is not a cost; solved as the smallest that returns the capital and completes the reserve.'],
    ['Pricing volume', `The volume in ${v(R.POLICY.tariff.pricingVolumeYear)} over which the institution’s shared costs are spread to build each fee.`],
    ['Financial constitution', 'The shares of fee income that each part of the institution consumes, read from the model.'],
  ].map(([a, c]) => [{ v: a, cls: 'nm' }, { v: c, cls: 't' }]);
  function v(x) { return R.val(x); }
  const blocks = [
    H('A', 'The basis of the plan', 'app-a'),
    Pp(
      `Every number in this plan descends from ${num(F.register.length)} assumptions held in the plan’s own record. Each carries one of three bases, and the basis says how much weight it can bear.`,
    ),
    TABLE({ title: 'The three bases', split: false, head: [{ t: 'Basis' }, { t: 'What it means' }, { t: 'Count', r: true }], widths: ['30mm', '125mm', '18mm'], rows: [
      [{ v: 'Evidence', cls: 'nm' }, { v: 'A published external source: a government rate, a survey, a vendor’s price page, a benchmark study. Each names the page it was read from and the date.', cls: 't' }, num(b.evidenced)],
      [{ v: 'Specification', cls: 'nm' }, { v: 'A decision the plan makes for the institution: what a route provides, how the qualification is assessed, how fast the College enters its markets. It is right by definition and changed only by decision.', cls: 't' }, num(b.design)],
      [{ v: 'Judgement', cls: 'nm' }, { v: 'A planning assumption where no evidence exists before the College operates: how many learners continue, how many choose each route, how far a market can be pushed. Each is replaced by the College’s own measurement as it arrives, and reported to the Board.', cls: 't' }, num(b.management)],
    ] }),
    Pp(
      'The evidence was gathered for this edition from primary sources and checked by reading each page, not a summary of it. A figure that could not be traced to a page that was actually read was not used, however plausible. Where a source is dated, as university fees for external examiners and US-weighted acquisition benchmarks are, the plan treats it as a floor or a proxy and says so beside it.',
      'Three kinds of figure the plan never contains: a figure from any earlier document of the College, which is built from nothing; a claim to any accreditation, recognition or partnership, of which the College will hold none when it opens; and a named person in an office they have not accepted.',
    ),
    BREAK,
    H('B', 'Every assumption and its source', 'app-b'),
    TABLE({ title: 'The register', sub: 'Grouped by the part of the record it belongs to', head: [{ t: 'Assumption' }, { t: 'Value' }, { t: 'Basis' }, { t: 'Source or reasoning' }], widths: ['42mm', '31mm', '18mm', '82mm'], rows: regRows }),
    BREAK,
    H('C', 'The model, term by term', 'app-c'),
    TABLE({ title: 'Thirty terms', sub: 'US dollars in the money of each term, thousands', head: [{ t: 'Term' }, { t: 'New', r: true }, { t: 'Studying', r: true }, { t: 'Academics', r: true }, { t: 'Staff', r: true }, { t: 'Net fees', r: true }, { t: 'Cost', r: true }, { t: 'Surplus', r: true }, { t: 'Cumulative', r: true }],
      widths: ['24mm', '14mm', '17mm', '19mm', '13mm', '20mm', '20mm', '21mm', '25mm'], rows: termRows }),
    H('D', 'The work of each route', 'app-d'),
    Pp(`Academic hours per learner per level at the plan’s pricing volume in ${v(R.POLICY.tariff.pricingVolumeYear)}, and the resulting cost of the route’s own teaching and assessment at ${F.first} prices. Seminar hours are the route’s seminar timetable divided among the learners the plan actually places in each cohort.`),
    TABLE({ title: 'Hours and cost of a level', split: false, head: [{ t: 'Route' }, { t: 'Assessment', r: true }, { t: 'Seminar', r: true }, { t: 'Individual', r: true }, { t: 'Total hours', r: true }, { t: 'Cohort fill', r: true }, { t: 'Grade', r: true }, { t: 'Cost', r: true }],
      widths: ['26mm', '20mm', '18mm', '20mm', '21mm', '21mm', '22mm', '25mm'], rows: workRows }),
    H('E', 'Terms used in this plan', 'app-e'),
    TABLE({ head: [{ t: 'Term' }, { t: 'Meaning' }], widths: ['40mm', '133mm'], rows: glossary }),
  ];
  return [
    opener({ n: 10, id: 'stage-10', title: 'Appendices', say: 'The basis of the plan, every assumption with its source, the model term by term, the work behind each route, and the terms this plan uses.', sections }),
    flow(blocks, { rh: 'X · Appendices' }),
  ];
}
