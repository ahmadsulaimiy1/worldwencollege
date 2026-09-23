/**
 * STAGES III AND IV — the markets, and the products and prices.
 */
import * as G from './charts.mjs';
import { opener } from './stages1.mjs';
import { flow, H, SUB, Pp, LEAD, LIST, BOARD, KF, TABLE, FIG, BREAK, usd, usdM, usdK, num, pct } from './pages.mjs';

export function stage3(F) {
  const R = F.R; const v = R.val; const fu = F.funnel;
  const sections = [
    { t: 'Four markets, in order', id: 's3-1' },
    { t: 'What each market already pays', id: 's3-2' },
    { t: 'What a learner costs to find', id: 's3-3' },
    { t: 'Employers and institutions', id: 's3-4' },
  ];
  const routeName = (k) => F.routes.find((r) => r.key === k).name.replace('WEC-LC ', '');
  const mRows = F.markets.map((m) => {
    const rs = Object.keys(m.routes || {});
    const top = m.aq && m.aq.retail ? m.aq.plannedMax : 0;
    return [{ v: m.name, cls: 'nm' }, R.termLabel(R.termIndex(m.opens)),
      rs.length ? (rs.length === 5 ? 'All five' : rs.map(routeName).join(', ')) : 'Through institutions only',
      top ? usdK(top) : '—', { v: m.why, cls: 't' }];
  });
  const items = [
    ...F.markets.filter((m) => Object.keys(m.routes || {}).length).map((m) => ({ name: m.name, note: `Learners, ${Object.keys(m.routes).length === 5 ? 'all five routes' : `${Object.keys(m.routes).length} routes`}`, t: R.termIndex(m.opens), kind: 'retail' })),
    ...F.agreements.map((a) => ({ name: a.name, note: `Agreements, ${routeName(a.route)} route`, t: R.termIndex(a.opens), kind: 'agreement' })),
  ];
  const mk = Object.fromEntries(F.markets.map((m) => [m.key, m.name]));
  const cRows = F.comparables.map((c) => [mk[c.market], c.provider, { v: c.product, cls: 't' }, c.local, usd(c.usd)]);
  const guided = F.routes.find((r) => r.key === 'guided');
  const bc = F.comparables.find((c) => c.key === 'bcSaudi40');
  const n = 1000; const a1 = n * fu.enquiryToApplication; const a2 = a1 * fu.applicationToPlacement; const a3 = a2 * fu.placementToOffer; const a4 = a3 * fu.offerToEnrolment;
  const aqRows = F.markets.filter((m) => m.aq && m.aq.retail).map((m) => [
    { v: m.name, cls: 'nm' }, usdK(m.aq.plannedMax), usd(m.aq.costPerEnquiry), pct(m.aq.conversion, 1), usd(m.aq.cac),
    usd(m.aq.contributionPerLevel), `${m.aq.paybackLevels.toFixed(2)} of a level`, usdK(m.aq.ceilingSpend)]);
  const aRows = F.agreements.map((a) => [{ v: a.name, cls: 'nm' }, routeName(a.route), pct(a.discount), num(a.seats),
    num(Math.max(...Object.values(a.perYear))), usd(a.origination), `${a.receivableDays} days`,
    Object.entries(a.markets).map(([k, s]) => `${mk[k]} ${pct(s)}`).join('; ')]);
  const blocks = [
    H('3.1', 'Four markets, in order', 's3-1'),
    LEAD('The College enters its markets one at a time, each once the one before has shown what a learner costs to find there.'),
    Pp('Demand in this plan is driven by what the College decides to spend on finding learners, not by an assumed share of a population. The acquisition budget in each market is a decision of the plan; what an enquiry costs is evidence; and how many enquiries become enrolments follows the College’s own admissions passage from enquiry to application, placement, offer and enrolment.'),
    TABLE({
      title: 'The markets', split: false,
      head: [{ t: 'Market' }, { t: 'Opens' }, { t: 'Routes sold' }, { t: 'Budget a year', r: true }, { t: 'Why, and why then' }],
      widths: ['27mm', '22mm', '28mm', '18mm', '80mm'],
      rows: mRows,
      note: `The budget is the most the plan spends in a market in any year, at ${F.first} prices, reached step by step from its opening and held at its last step thereafter.`,
    }),
    FIG({ title: 'When each market and channel opens', sub: 'Learners recruited directly in sapphire; places bought under agreement in gold', svg: G.openings(items, F.first, F.lastYear) }),
    H('3.2', 'What each market already pays', 's3-2'),
    Pp('Published prices for English study, read from the providers’ own pages, show what a learner in each market already pays. None is the College’s product: a course sells tuition, and the College’s fee buys a qualification with every level examined, every script marked twice and the record kept for good. They show where the College’s fees stand.'),
    TABLE({
      title: 'Published prices in the College’s markets', split: false,
      sub: 'Researched on 19 September 2026; sources in Appendix B',
      head: [{ t: 'Market' }, { t: 'Provider' }, { t: 'What it sells' }, { t: 'Published price', r: true }, { t: 'In dollars', r: true }],
      widths: ['28mm', '36mm', '63mm', '26mm', '20mm'],
      rows: cRows,
    }),
    Pp(
      `In the Gulf the British Council sells a four-month adult English course in Saudi Arabia for ${usd(bc.usd)}, with ${bc.contactHours} contact hours. The College’s Guided level, also four months, costs ${usd(guided.fee)}: ${guided.seminarHours} hours of seminar teaching in a cohort of no more than ${guided.sectionCap}, written feedback on every assignment, and an examined qualification with every script marked twice. The College asks a Gulf learner to pay about ${pct(guided.fee / bc.usd - 1)} more for fewer hours in a room and a heavier assessment behind the award. Whether enough learners will is the plan’s central commercial question, and the Validation gate answers it from the College’s own enrolments before the third tranche is drawn.`,
      (() => {
        const weeks = R.val(R.QUALIFICATION.structure.teachingWeeksPerTerm);
        const perWeek = F.comparables.filter((c) => c.weeks).map((c) => c.usd / c.weeks / (guided.fee / weeks));
        const lo = Math.min(...perWeek); const hi = Math.max(...perWeek);
        const pei = F.comparables.find((c) => c.key === 'peiLagos');
        return `In the United Kingdom the nearest assessed comparison is university pre-sessional English, which is intensive and full-time and costs between ${lo.toFixed(1)} and ${hi.toFixed(1)} times as much a week as a Guided level taken over its ${weeks} teaching weeks. In Nigeria a month of IELTS tuition in Lagos is advertised at ${usd(pei.usd)}. That is why the College does not sell there directly, and reaches West African learners through institutions and sponsors instead.`;
      })(),
    ),
    H('3.3', 'What a learner costs to find', 's3-3'),
    Pp(
      `No published figure for the cost of an enquiry in the Gulf or the United Kingdom survived verification. The plan therefore uses the one well-documented benchmark for professional, continuing and online programmes, the UPCEA and Search Influence study: a median cost of $106 an enquiry and $1,173 an enrolled student, which implies that about ${pct(a4 / n, 1)} of enquiries enrol. It applies the benchmark in every market rather than assume any is cheaper, and the College’s first campaigns replace it.`,
      `A market does not absorb spending without limit. Past a reference level of spend, each further enquiry costs more: doubling spend beyond it raises the cost of each enquiry by about ${pct(Math.pow(2, fu.saturation) - 1)}. That is the plan’s principal demand judgement, and it sets a ceiling on each market’s budget. The ceiling is the spend at which the last dollar is still repaid within the learner’s first level, and no market is planned past it.`,
    ),
    FIG({
      title: 'From a thousand enquiries to enrolled learners', sub: 'The admissions passage, at the rates the plan assumes',
      svg: G.funnel([
        { name: 'Enquiries', n },
        { name: 'Applications', n: a1, rate: `${pct(fu.enquiryToApplication, 1)} of enquiries apply` },
        { name: 'Placement assessments', n: a2, rate: `${pct(fu.applicationToPlacement)} complete placement` },
        { name: 'Offers', n: a3, rate: `${pct(fu.placementToOffer)} are offered a place` },
        { name: 'Enrolments', n: a4, rate: `${pct(fu.offerToEnrolment)} accept and pay` },
      ]),
    }),
    TABLE({
      title: 'What a learner costs to find, and when the College has it back', split: false,
      sub: 'Over the decade, at the budgets planned. A level’s contribution is its fee less the route’s own teaching and assessment and the cost of collecting it, at 2027 prices, across the market’s mix of routes.',
      head: [{ t: 'Market' }, { t: 'Budget', r: true }, { t: 'Per enquiry', r: true }, { t: 'Enrol', r: true }, { t: 'Per enrolment', r: true }, { t: 'A level contributes', r: true }, { t: 'Repaid within', r: true }, { t: 'Ceiling', r: true }],
      widths: ['30mm', '16mm', '19mm', '14mm', '21mm', '23mm', '28mm', '22mm'],
      rows: aqRows,
      note: `A new learner studies ${F.levelsPerLearner.toFixed(1)} levels on average, so each enrolment returns several times what it cost to find. The limit on the College’s growth is not what a learner costs; it is how far each market can be pushed and the capital needed to teach the learners it brings.`,
    }),
    H('3.4', 'Employers and institutions', 's3-4'),
    Pp('Two channels sell places in blocks, under agreement. An employer buys places on the Tutored route for its own staff; a ministry, university, foundation or federation buys places at scale on the Guided route under a public or charitable mandate. These are the only fees the College discounts, and the discount is the price of a guaranteed block of places. Agreements are invoiced each term and paid on the buyer’s terms, and the plan carries what they owe until it is paid.'),
    TABLE({
      title: 'The agreement channels', split: false,
      head: [{ t: 'Channel' }, { t: 'Route' }, { t: 'Discount', r: true }, { t: 'Places', r: true }, { t: 'A year', r: true }, { t: 'Cost to win', r: true }, { t: 'Paid in', r: true }, { t: 'Signed in' }],
      widths: ['30mm', '17mm', '15mm', '13mm', '13mm', '19mm', '16mm', '50mm'],
      rows: aRows,
      note: '“A year” is the number of agreements signed a year once the channel is at full strength. The cost to win is travel, proposals and negotiation beyond the partnerships team’s own salaries.',
    }),
  ];
  return [
    opener({ n: 3, id: 'stage-3', title: 'Market architecture', say: 'Where the College recruits and in what order, what each market already pays for English, what it costs to find a learner, and the two channels that buy places in blocks.', sections }),
    flow(blocks, { rh: 'III · Market architecture' }),
  ];
}

export function stage4(F) {
  const R = F.R; const b = F.S.buildUp; const v = R.val;
  const sections = [
    { t: 'Five routes, one qualification', id: 's4-1' },
    { t: 'How a fee is built', id: 's4-2' },
    { t: 'The margin is solved, not chosen', id: 's4-3' },
    { t: 'Scale and price', id: 's4-4' },
    { t: 'The financial constitution', id: 's4-5' },
    { t: 'Collecting the fee', id: 's4-6' },
  ];
  const rt = F.routes;
  const cell = (x, f = (y) => y) => (x ? f(x) : { v: '—', cls: 'no' });
  const spec = [
    ['Assessment and the qualification', { v: 'Identical on every route: ten person-marked assignments, a written and a spoken examination, every script marked twice, moderation, the Examination Board and the record of the award', span: rt.length, cls: 't' }],
    ['Seminar teaching, hours a level', ...rt.map((r) => cell(r.components.seminarHoursPerLevel, String))],
    ['Largest seminar cohort', ...rt.map((r) => cell(r.sectionCap, String))],
    ['Leadership strand, hours a level', ...rt.map((r) => cell(r.components.leadershipStrandHoursPerLevel, String))],
    ['Individual tutorials, hours a level', ...rt.map((r) => cell(r.components.tutorialHoursPerLevel, String))],
    ['Written feedback on each assignment', ...rt.map((r) => cell(r.components.feedbackMinutesPerAssignment, (x) => `${x} min`))],
    ['Adviser, review and monitoring, hours', ...rt.map((r) => cell(r.advisingHours, (x) => String(+x.toFixed(1))))],
    ['Senior academic oversight, hours', ...rt.map((r) => cell(r.oversightHours, String))],
    ['Material written for the learner, hours', ...rt.map((r) => cell(r.authoringHours, String))],
    ['Dedicated administration, hours', ...rt.map((r) => cell(r.adminHours, String))],
    ['Taught by', ...rt.map((r) => (r.grade === 'senior' ? 'Senior academics' : 'Instructors'))],
    ['Scheduling', ...rt.map((r) => (r.private ? 'Private' : r.seminarHours ? 'Timetabled' : 'The learner’s own'))],
  ];
  const w = ['50mm', ...rt.map(() => '24.6mm')];
  const specHead = [{ t: 'Per learner, per level' }, ...rt.map((r) => ({ t: r.name.replace('WEC-LC ', ''), r: true }))];
  const specRows = spec.map((row) => row.map((c, i) => (i === 0 ? { v: c, cls: 't' } : c)));
  specRows[0] = { cls: 'sub', cells: specRows[0] };
  const buRows = rt.map((r) => {
    const own = r.own ? r.own.usd : 0; const col = r.fee * b.collect;
    const marginUsd = r.fee - own - b.shared.institutionalAcademic - b.shared.running - b.shared.acquisition - col;
    return [{ v: r.name.replace('WEC-LC ', ''), cls: 'nm' }, usd(own), usd(b.shared.institutionalAcademic), usd(b.shared.running), usd(b.shared.acquisition), usd(col), usd(marginUsd), { v: usd(r.fee), cls: '' }, usd(r.pathway)];
  });
  const K = F.constitution;
  const scaleRows = F.scaleLever.map((s) => [s.scale === 1 ? 'The plan' : `Markets ${s.scale === 1.5 ? 'half as large again' : 'twice as large'}`,
    num(Math.round(s.active / 10) * 10), usd(s.shared), ...F.R.ROUTE_KEYS.map((k) => usd(s.tariff[k])), usdM(s.capital)]);
  const PC = R.POLICY.collection; const ST = PC.stripe;
  const stRows = [['Standard UK cards', ST.ukStandard], ['Premium UK cards', ST.ukPremium], ['Cards issued in the EEA', ST.eea], ['Cards issued elsewhere', ST.international], ['Currency conversion, added to every card payment', ST.conversion]]
    .map(([n, leaf]) => [n, pct(v(leaf), 2)]);
  const blocks = [
    H('4.1', 'Five routes, one qualification', 's4-1'),
    LEAD('Each route is a defined educational product: a stated list of what the learner receives, each item with the work that delivers it. The qualification at the end is the same.'),
    TABLE({ title: 'What each route provides', sub: 'The service specification, per learner at each level. Every route also carries the whole of the assessment in Stage II.', head: specHead, widths: w, rows: specRows, split: false }),
    Pp('The specification is what the College must staff. A Guided learner is promised twenty-four hours of seminar teaching at each level in a cohort of no more than fourteen; the College therefore counts seminar sections from the learners actually present each term, and hires the instructors those sections need. An Executive learner is taught by a senior academic, in a cohort of six, at times that suit the learner; the College therefore counts a senior grade and a lower share of each academic’s time available for teaching, because time held open around a learner’s calendar cannot be timetabled.'),
    BREAK,
    H('4.2', 'How a fee is built', 's4-2'),
    Pp(
      `Each fee is built up from the whole cost of the institution at the volume the plan reaches at maturity, ${v(R.POLICY.tariff.pricingVolumeYear)}, and restated at ${F.first} prices. It has six parts. The first is the route’s own teaching and assessment: its seminars at the cohort sizes the plan actually fills, its tutorials, feedback and advising, and the assessment every route carries. The next three are shared equally by every level any learner studies: the institution’s own academic work, from moderation to academic management; the cost of running the institution, from its professional staff to its platform, premises and governance; and the cost of finding learners. The fifth is the cost of collecting the fee and of refunds. The last is the margin.`,
      'The shared costs fall on every route alike because every learner uses them alike: each is admitted, registered, examined, recorded and supported by the same institution. The routes differ only in what they add, which is why the fees rise with what each route provides.',
    ),
    FIG({ title: 'The anatomy of a level fee', sub: `What each part of a level fee pays for, at ${F.first} prices`, svg: G.feeAnatomy(rt, b, F.margin) }),
    TABLE({
      title: 'The fee build-up', split: false,
      sub: `One level, ${F.first} prices`,
      head: [{ t: 'Route' }, { t: 'Route’s teaching', r: true }, { t: 'Academic work', r: true }, { t: 'Running', r: true }, { t: 'Finding', r: true }, { t: 'Collecting', r: true }, { t: 'Margin', r: true }, { t: 'Level fee', r: true }, { t: 'Six levels', r: true }],
      widths: ['22mm', '20mm', '19mm', '17mm', '16mm', '18mm', '17mm', '20mm', '24mm'],
      rows: buRows,
    }),
    H('4.3', 'The margin is solved, not chosen', 's4-3'),
    Pp(`The margin is the one part of a fee that is not a cost, and the plan does not choose it. It solves for it. The margin is the smallest share of each fee at which the ten-year plan, run in full, ends ${F.lastYear} holding enough cash to return every dollar of founding capital and still hold six months of operating cost in reserve. At ${pct(F.margin, 1)} the plan passes that test; a margin one point lower fails it. What the margin pays for is the founding capital and the reserve, and nothing else.`),
    KF([
      { v: pct(F.margin, 1), l: 'Margin', d: 'The smallest that returns the capital and completes the reserve' },
      { v: usd(b.shared.institutionalAcademic + b.shared.running + b.shared.acquisition), l: 'Shared cost of a level', d: `At ${F.first} prices and ${v(R.POLICY.tariff.pricingVolumeYear)} volume` },
      { v: pct(b.collect, 1), l: 'Collection and refunds', d: 'A share of every retail fee' },
    ], 3),
    H('4.4', 'Scale and price', 's4-4'),
    Pp('The shared costs of the institution are spread over the learners it teaches, so the fee each route needs depends on how large the College becomes. The table re-solves the whole plan for markets half as large again and twice as large, with every other assumption unchanged.'),
    TABLE({
      title: 'What scale does to price and to capital', split: false,
      sub: `Learners studying in ${F.lastYear}; shared cost and fees for one level at ${F.first} prices`,
      head: [{ t: 'Case' }, { t: 'Learners', r: true }, { t: 'Shared cost', r: true }, ...rt.map((r) => ({ t: r.name.replace('WEC-LC ', ''), r: true })), { t: 'Capital', r: true }],
      widths: ['33mm', '15mm', '17mm', ...rt.map(() => '17mm'), '18mm'],
      rows: scaleRows,
    }),
    Pp(`Twice the plan’s volume would lower the Guided fee from ${usd(F.scaleLever[0].tariff.guided)} to ${usd(F.scaleLever[2].tariff.guided)} and need ${usdM(F.scaleLever[2].capital - F.scaleLever[0].capital)} more capital. The plan is sized on its own judgement of how large each market is, which is the demand assumption it can least evidence before it recruits. If the first two years show the Gulf and the United Kingdom are larger than the plan assumes, the Board has a clear choice between lower fees and a higher return, and this table is its starting point.`),
    H('4.5', 'The financial constitution', 's4-5'),
    Pp(`How each dollar of fee income is spent is not set by rule in this plan. It is read from the model once the College has reached the volume its fees were built on. In ${K.fromYear} the model spends the College’s net fee income as follows.`),
    FIG({ title: `Where each dollar goes, ${K.fromYear}`, sub: 'Shares of net fee revenue', svg: G.constitution(K.lines) }),
    Pp(`Teaching and assessment take ${pct(K.lines.find((l) => l.key === 'teaching').share)} of every dollar. The College retains ${pct(K.lines.find((l) => l.key === 'retained').share)}, which is what returns the founding capital and builds the reserve. If the College’s costs or fees move, these shares move with them; they are a result the Board monitors, not a limit it enforces.`),
    H('4.6', 'Collecting the fee', 's4-6'),
    Pp(`Learners pay by card or bank transfer; the plan assumes ${pct(v(PC.cardShareOfRetail))} pay by card. Card fees are charged at the published rates of the College’s payment processor, by where the card was issued, and every card payment carries a further charge for conversion, because fees are set in dollars and the College settles in pounds. Agreements are invoiced and paid by transfer. Across the pricing year, collection costs ${pct(b.collect - v(PC.withdrawalRate), 1)} of retail fees, and refunds in the fourteen-day window a further ${pct(v(PC.withdrawalRate))}.`),
    TABLE({ title: 'Card processing', sub: 'Stripe, United Kingdom, as published on 23 September 2026; each payment also carries a fixed 20p', head: [{ t: 'Card' }, { t: 'Rate', r: true }], widths: ['140mm', '33mm'], rows: stRows, split: false }),
  ];
  return [
    opener({ n: 4, id: 'stage-4', title: 'Commercial architecture', say: 'The five routes as defined products, how each fee is built from the cost of delivering it, the margin the plan solves for, and what scale does to price.', sections }),
    flow(blocks, { rh: 'IV · Commercial architecture' }),
  ];
}
