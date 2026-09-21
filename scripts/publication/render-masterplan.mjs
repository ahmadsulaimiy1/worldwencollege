/**
 * THE PUBLICATION — twenty sections, rendered to a board-grade PDF.
 *
 * Run: node scripts/publication/render-masterplan.mjs
 *
 * Every figure is read from scripts/publication/masterplan.mjs. The
 * risk register, the governance schedule and the roadmap narrative are
 * authored here because they are judgements rather than computations —
 * and each is marked with the classification it deserves.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { model, allScenarios, allocation, breakEven, sensitivity, alternativeA, basis, PLAN } from './masterplan.mjs';
import * as A from './masterplan-art.mjs';
import * as PR from './pricing.mjs';
import { architectures, scenarios as priceScenarios, project as priceProject, compare } from './projection.mjs';
/* The risk register and the governance schedule are AUTHORED judgements,
   and they are now shared with the monograph rather than retyped into
   it — two documents carrying their own copy of a twenty-row register
   disagree by the third revision. */
import { RISKS, GOVERNANCE } from './plan-narrative.mjs';

const { K, SERIF, SANS, esc, usd, m$, num, pct, figure, table, chip } = A;
const FIGURES = () => A.figureCount();
const TABLES = () => A.tableCount();

const B = basis();
const ALL = allScenarios();
const [CONS, BASE, GROW] = ALL;
const ALLOC = allocation('base');
const BE = breakEven('base');
const SENS = sensitivity();
const ALT = alternativeA();
const Y10 = BASE.years[9];
const Y1 = BASE.years[0];
const FIRST_CLEAR = BE.find((b) => b.clears);

// ── The pricing analysis, and the projection it produces ─────────────
const ARCH = architectures();
const PSC = priceScenarios();
const CORE = PSC.core;
const TARIFF = Object.fromEntries(['directed', 'tutored', 'execCore', 'execPremium', 'execBespoke']
  .map((k) => [k, PR.tariff(k)]));
const PATH = PR.PROPOSED.committed;

/* ── THE COMPARISON, COMPOSED RATHER THAN ASSERTED ───────────────────
   Two paragraphs of this document described the proposal as giving up
   surplus and buying reach. That was true of the architecture as it
   stood when they were written, and the model has since moved three
   times — institutional channels, regional pricing, and the year each
   channel actually opens. By the last of those the templates were
   rendering "gives up $−11.00M of ten-year surplus" and "gains −1%
   more active learners": every clause sign-inverted, in the one
   paragraph of a Board paper headed "The trade, stated plainly".

   `compare()` reads the direction off the model. These compose the
   English from it, in both the directions the model can fall. */
const andList = (xs) => (xs.length < 2 ? (xs[0] || '')
  : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const sizeOf = (d) => (d.unit === 'money'
  ? `${m$(Math.abs(d.delta))} of ${d.noun}`
  : `${num(Math.round(Math.abs(d.delta)))} ${d.noun}`);
const verdictClause = () => {
  const c = compare(ARCH);
  if (!c.behind.length) return `it is ahead on ${andList(c.ahead.map(sizeOf))}`;
  return `it gives up ${andList(c.behind.map(sizeOf))} and buys ${andList(c.ahead.map(sizeOf))}`;
};
/* ── THE RESERVE FINDING, READ FROM THE MODEL ────────────────────────
   Finding Six and §liquidity both stated in bold that the reserve rule
   is "not met at any price tested, inside ten years". That was true
   when it was written. The correction to the channel model and to
   regional pricing moved the decade, and the two publications then
   disagreed flatly: the Monograph's resilience plate reads the year
   off the model and printed one, while this document printed a
   sentence saying there is none — quoting the very figures that prove
   there is. Both now read the model. */
const RESERVE_YEARS = CORE.years.map((y) => ({
  calendar: y.calendar,
  reserve: y.reserve,
  target: (y.delivery + y.acquisition + y.fixed + y.development)
    * (PLAN.reserve.target_months_of_operating_cost / 12),
}));
const RESERVE_REACHED = RESERVE_YEARS.find((y) => y.reserve >= y.target) || null;

const verdictParagraph = () => {
  const c = compare(ARCH);
  const retained = `It retains <strong>${pct(c.ourMargin, 1)}</strong> of what it collects against `
    + `<strong>${pct(c.theirMargin, 1)}</strong>.`;
  if (!c.behind.length) {
    return `Against the adopted flat tariff the proposal is ahead on ${andList(c.ahead.map(sizeOf))}. `
      + `A proposal ahead on every dimension deserves the question a Board should ask of it, and the `
      + `answer is structural rather than flattering: a single fee is one number for four markets. It `
      + `stands above what two of them will pay, so the flat tariff forfeits the learners; and below `
      + `what the other two will, so it forfeits the margin. The portfolio does not beat it by `
      + `charging more. It beats it by charging each market separately, and by reaching the two `
      + `markets that carry no taught route at retail through an institutional buyer instead of a `
      + `price list. ${retained}`;
  }
  return `Against the adopted flat tariff the proposal gives up <strong>${
    andList(c.behind.map(sizeOf))}</strong> — two of the College's four markets carry no taught route `
    + `at retail, and a flat fee books income from learners who would not have enrolled at it — and `
    + `buys ${andList(c.ahead.map(sizeOf))}. ${retained} Management recommends that trade for two `
    + `reasons. The alumni it produces lower the cost of every later acquisition, so the position `
    + `compounds beyond Year 10 in the proposal's favour. And an institution is measured by what it `
    + `confers.`;
};
const PA = PLAN.proposed_architecture;
/* The market research, read from the file that records it with sources.
   Nothing about the outside world is typed into this publication. */
const EV = JSON.parse(readFileSync(new URL('../../data/market-evidence.json', import.meta.url), 'utf8'));
const EV_SEGMENTS = [
  ['gcc', 'Saudi Arabia and the Gulf'],
  ['west_africa', 'Nigeria and West Africa'],
  ['uk_europe', 'United Kingdom and Europe'],
  ['executive_and_corporate', 'Executive and corporate'],
];
const EV_COUNT = EV_SEGMENTS.reduce((a, [k]) => a + EV[k].observations.length, 0);
const EV_SOURCES = new Set(EV_SEGMENTS.flatMap(([k]) => EV[k].observations.map((o) => o.source).filter(Boolean))).size;
const AA = PLAN.alternative_architecture_a;
const CY10 = CORE.years[9];
const FIRST_SURPLUS = CORE.years.find((y) => y.surplus > 0);
const FIRST_CUMULATIVE = CORE.years.find((y) => y.cumulativeSurplus > 0);
const FULL_REACH = CORE.years.find((y) => y.reach >= 0.999);

/* The Directed-price frontier, computed rather than described, so the
   Board can see what each step of price costs in people taught. */
const TM = PA.teaching_majority;
const FRONTIER_PRICES = [...TM.frontier_prices_usd, PR.PROPOSED.committed.directed]
  .filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
const FRONTIER_RUNS = FRONTIER_PRICES.map((d) => {
  const r = priceProject({ ...PR.PROPOSED.committed, directed: d }, { label: `directed ${d}` });
  const y = r.years[r.years.length - 1].byProduct;
  const n = (k) => y[k] || 0;
  const taught = n('directed') + n('tutored') + n('execCore') + n('execPremium') + n('execBespoke');
  return { d, r, y, n, taught, share: taught / (taught + n('independent')) };
});
const SURPLUS_AT_15K = FRONTIER_RUNS.find((f) => f.d === TM.unconstrained_price_usd).r.totals.surplus;
/* The reserve rule, tested against the plan rather than asserted over it. */
const RESERVE_TARGET = (CY10.delivery + CY10.acquisition + CY10.fixed + CY10.development)
  * PLAN.reserve.target_months_of_operating_cost / 12;
const RESERVE_AT_13K = FRONTIER_RUNS.find((f) => f.d === TM.reserve_probe_price_usd).r.totals.reserve;

/* How WEC-LC compares on the one unit that HAS a comparable. Counted
   rather than claimed: the sentence in the plan used to say "every
   taught tier below Executive", which was both typed and wrong — the
   Executive tiers are cheaper per hour of attention than the benchmark
   too, because they are language teaching and the benchmark is a class
   of twelve. */
const BC_OBS = EV.gcc.observations[0];
const BC_PER_HOUR = BC_OBS.price_usd / (BC_OBS.hours / 12);
const BC_CHEAPER = Object.keys(PR.PRODUCTS)
  .filter((k) => PATH[k] / PR.attentionHours(k) < BC_PER_HOUR);
const BC_CHEAPER_AT = BC_CHEAPER.length === Object.keys(PR.PRODUCTS).length
  ? 'all' : num(BC_CHEAPER.length);
const FRONTIER_ROWS = FRONTIER_RUNS.map(({ d, r, n, share }) => {
  const cells = [
    d === PR.PROPOSED.committed.directed ? `<strong>${usd(d)} — PROPOSED</strong>` : usd(d),
    num(n('independent')), num(n('directed')), num(n('tutored')),
    num(n('execCore') + n('execPremium') + n('execBespoke')),
    pct(share, 1), m$(r.totals.surplus),
  ];
  return d === PR.PROPOSED.committed.directed ? { strong: true, cells } : cells;
});

const PERIOD = `${PLAN.planning_period.first_year}–${PLAN.planning_period.first_year + PLAN.planning_period.years - 1}`;

/* ────────────────────────────────────────────────────────────────────
   SECTION NUMBERS, HELD IN ONE PLACE
   ────────────────────────────────────────────────────────────────────
   These used to be typed twice: once into each opener and again into
   every "see Section 18" in the prose. The consequence was visible in
   the rendered plan — the numbering ran 02, 04, 05, 06, 08, 10, with
   four holes where sections had been merged away and nobody had
   renumbered the ones after them. A flagship publication that cannot
   count its own sections has a credibility problem before a reader
   reaches a figure.

   The order below IS the document's order, the numbers are derived from
   it, and `ref()` is the only way prose may name a section. Move a
   section in this array and every cross-reference follows. */
const SECTION_ORDER = [
  'summary',
  'identity',
  'academic',
  'delivery',
  'market',
  'engine',
  'cost',
  'liquidity',
  'access',
  'sponsored',
  'technology',
  'governance',
  'risk',
  'roadmap',
  'breakeven',
  'validation',
  'pricing',
  'proposal',
  'architectures',
  'methodology',
];
const SEC = Object.fromEntries(SECTION_ORDER.map((k, i) => [k, String(i).padStart(2, '0')]));
const ref = (k) => {
  if (!(k in SEC)) throw new Error(`cross-reference to unknown section "${k}"`);
  return `Section ${SEC[k]}`;
};

// ── Page furniture ───────────────────────────────────────────────────
const opener = (n, title, rubric, stats) => `
<section class="opener">
  <div class="opener__rule"></div>
  <p class="opener__n">${n}</p>
  <h1 class="opener__t">${esc(title)}</h1>
  <p class="opener__r">${esc(rubric)}</p>
  ${stats ? `<div class="opener__stats">${stats.map((s) => `
    <div class="ostat"><p class="ostat__v">${s.v}</p><p class="ostat__l">${esc(s.l)}</p></div>`).join('')}</div>` : ''}
</section>`;

const kpi = (items) => `<div class="kpis">${items.map((i) => `
  <div class="kpi"><p class="kpi__v">${i.v}</p><p class="kpi__l">${esc(i.l)}</p>${i.n ? `<p class="kpi__n">${esc(i.n)}</p>` : ''}</div>`).join('')}</div>`;

const lead = (t) => `<p class="lead">${t}</p>`;
const p = (t) => `<p>${t}</p>`;
const h2 = (t) => `<h2>${esc(t)}</h2>`;
const h3 = (t) => `<h3>${esc(t)}</h3>`;
const note = (t) => `<p class="note">${t}</p>`;
// One break per section boundary: `.opener { break-before: page }` owns it.
// An explicit break-after here as well produced a blank page between every
// section, which is the single most common way a generated PDF announces
// that nobody looked at it.
const pagebreak = '';

// ═══════════════════════════════════════════════════════════════════
// THE RISK REGISTER — authored, and deliberately specific.
// A register of generic risks is a register nobody reads twice.
// ═══════════════════════════════════════════════════════════════════
const PHASES = [
  ['I', 'Foundation', '1–2', 'Open the Gulf and West Africa. Appoint the academic offices. Publish the first examination papers and confer the first awards. Prove the qualification end to end before spending to be known.',
    (m) => `${num(m.years[1].activeStudents)} active learners · ${m$(m.years[1].netTuition)} net tuition`],
  ['II', 'Validation', '3–4', 'Europe opens. Break-even is cleared and the reserve begins. Continuation, not acquisition, becomes the measure that matters. The External Examiner confirms the standard against published rubrics.',
    (m) => `breaks even ${FIRST_CLEAR ? FIRST_CLEAR.calendar : '—'} · ${m$(m.years[3].netTuition)} net tuition`],
  ['III', 'Scale', '5–7', 'Asia opens. Sponsored cohorts become a material and deliberate share of enrolment. The establishment is fully staffed and the institution stops depending on any one person.',
    (m) => `${num(m.years[6].activeStudents)} active learners · ${m$(m.years[6].netTuition)} net tuition`],
  ['IV', 'Maturity', '8–9', 'Reserve reaches its target in months of operating cost. Accreditation is pursued with a completed cohort and an examiner\'s confirmation behind it, not before.',
    (m) => `reserve ${m$(m.years[8].closingReserve)} · ${num(m.years[8].reserveMonths)} months of cost`],
  ['V', 'Standing', '10', 'The institution is self-funding, externally examined, internationally enrolled, and holds a register of awards a stranger can check without an account.',
    (m) => `${m$(m.years[9].netTuition)} net tuition · ${num(Math.round(m.totals.awardsConferred))} awards conferred to date`],
];

// ═══════════════════════════════════════════════════════════════════
// THE DOCUMENT
// ═══════════════════════════════════════════════════════════════════
function document() {
  const sections = [];
  const S = (html) => sections.push(html);

  // ── COVER ──────────────────────────────────────────────────────
  S(`<section class="cover">
    <div class="cover__field">
      <div class="cover__mark">
        <svg viewBox="0 0 120 120" width="76" height="76" fill="none" stroke="${K.gold}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="60" cy="60" r="46" opacity=".5"/><circle cx="60" cy="60" r="36"/>
          <path d="M60 26 65 46l20 2-15 13 4 20-14-10-14 10 4-20-15-13 20-2Z"/>
          <path d="M34 82 26 108l34-14 34 14-8-26" opacity=".7"/>
        </svg>
      </div>
      <p class="cover__inst">WorldWide English College</p>
      <p class="cover__campus">London Campus</p>
      <div class="cover__rule"></div>
      <h1 class="cover__title">Ten-Year<br/>Institutional Roadmap</h1>
      <p class="cover__sub">Strategic and Financial Master Plan</p>
      <p class="cover__period">${PERIOD}</p>
    </div>
    <div class="cover__foot">
      <div><p class="cf__l">Edition</p><p class="cf__v">First · Revision 0</p></div>
      <div><p class="cf__l">Classification</p><p class="cf__v">Confidential — Institutional</p></div>
      <div><p class="cf__l">Basis of model</p><p class="cf__v">Adopted tariff, ${usd(B.programmeTotal)}</p></div>
    </div>
  </section>${pagebreak}`);

  // ── 00 EXECUTIVE SUMMARY ───────────────────────────────────────
  S(opener(SEC.summary, 'Executive Summary', 'The institutional thesis, the decade it implies, and the two things that are not engineering problems.'));
  S(`<div class="body">
    ${lead(`WorldWide English College teaches a <strong>${num(B.totalHours)}-hour</strong> qualification pathway in six levels from A1 to C2, at an adopted tariff of <strong>${usd(B.programmeTotal)}</strong> — ${usd(B.levelFee, 2)} a level, ${usd(B.perHour, 2)} an academic hour. This plan models what that institution becomes over ${PLAN.planning_period.years} years, and it is built forwards from what the College spends to be found and whom it can actually teach, rather than backwards from a revenue the plan would like to reach.`)}
    ${kpi([
      { v: m$(CORE.totals.revenue), l: 'Ten-year gross revenue', n: 'Core Management Plan, proposed architecture' },
      { v: m$(CORE.totals.y10Revenue), l: 'Year-10 revenue' },
      { v: num(CORE.totals.y10Active), l: 'Active learners, Year 10', n: num(CORE.totals.y10New) + ' new in the year' },
      { v: num(Math.round(CORE.totals.awards)), l: 'Level awards conferred over the decade',
        n: num(CORE.totals.alumni) + ' award-holders, ' + num(CORE.totals.awardsToC2) + ' of them to C2' },
      { v: m$(CORE.totals.surplus), l: 'Ten-year operating surplus', n: pct(CORE.totals.surplus / CORE.totals.revenue, 0) + ' of revenue' },
      { v: String(FIRST_SURPLUS ? FIRST_SURPLUS.calendar : '—'), l: 'First surplus year', n: 'Cumulative surplus from ' + (CORE.years.find((y) => y.cumulativeSurplus > 0) || {}).calendar },
    ])}
    ${h2('The thesis, in one paragraph')}
    ${p(`The College sells teaching, not a credential. The credential is identical whichever route a candidate takes to it — same examination, same rubric published before the work, same second marking, same moderation, same registry entry, same public verification — and the routes differ in price by a factor of five because what they differ in is <em>human attention</em>. That single commitment is what makes a ${usd(B.programmeTotal)} tariff defensible and a ${usd(B.independentPerLevel)} independent route honest at the same time, and it is the reason ${pct(B.lines.find((l) => l.key === 'teaching').share, 0)} of every fee is allocated to a named instructor. This model staffs to that allocation rather than beneath it.`)}
    ${h2('The seven findings a board should take from this plan')}
    ${p(`<strong>One.</strong> <em>On the adopted flat ${usd(B.programmeTotal)} tariff</em>, the institution breaks even in <strong>${FIRST_CLEAR ? FIRST_CLEAR.calendar : 'no modelled year'}</strong>, at ${FIRST_CLEAR ? num(FIRST_CLEAR.breakEvenLearners) : '—'} active learners, and clears it in every subsequent year of the expected case. It does not require a step change in enrolment to become self-funding; it requires the third year.`)}
    ${p(`<strong>Two.</strong> Continuation between levels, not acquisition, is the decisive variable. A ten-point fall in continuation costs more over the decade than a thirty per cent rise in the cost of acquiring a learner. From Year 4 the marginal pound is better spent keeping a learner than finding one.`)}
    ${p(`<strong>Three.</strong> <strong>Management proposes a new commercial architecture</strong> ${chip('board')}, built from delivery cost upward rather than adjusted from an existing figure: a Directed pathway at ${usd(PATH.directed)}, Tutored at ${usd(PATH.tutored)}, and Executive tiers at ${usd(PATH.execCore)}, ${usd(PATH.execPremium)} and ${usd(PATH.execBespoke)}. Against the adopted flat tariff ${verdictClause()}. Against the brief's ${usd(AA.directed_total_usd)} / ${usd(AA.tutored_total_usd)} it earns ${m$(ARCH.proposed.totals.surplus - ARCH.briefA.totals.surplus)} more surplus at ${pct(ARCH.proposed.totals.y10Active / ARCH.briefA.totals.y10Active, 0)} of its scale. ${ref('validation')} to ${ref('architectures')} set out the whole analysis.`)}
    ${p(`<strong>Four.</strong> <strong>The plan this one replaces did not survive contact with published prices.</strong> An earlier draft proposed a dearer tariff on ${m$(PA.superseded_pathway_usd.projected_ten_year_revenue_usd)} of revenue and ${m$(PA.superseded_pathway_usd.projected_ten_year_surplus_usd)} of surplus, using willingness-to-pay figures that were asserted. Researched against ${num(EV_COUNT)} published tariffs from ${num(EV_SOURCES)} identifiable sources, every segment came in lower — West Africa by two thirds. The withdrawn plan is recorded rather than quietly replaced, and ${ref('validation')} states what was found, including the ${num(EV.gaps.length)} markets and questions the research could not answer.`)}
    ${p(`<strong>Five.</strong> <strong>The Directed price is the output of a constraint the Board is asked to set, not a number management picked.</strong> A buyer priced out of tuition does not leave — they step down to the Independent route and sit the same examinations untaught, so surplus can always be bought by teaching fewer of the people the College credentials. Management proposes that WEC-LC teach at least ${pct(PR.PROPOSED.teachingMajority, 0)} of them; the price that follows is ${usd(PATH.directed)}. Move the constraint and the price moves with it. ${chip('board')}`)}
    ${p(`<strong>Six.</strong> ${RESERVE_REACHED
    ? `<strong>The reserve rule in ${ref('liquidity')} is met in ${RESERVE_REACHED.calendar}, and not before.</strong> The Core case closes the decade holding ${m$(CY10.reserve)} against a target near ${m$(RESERVE_TARGET)}, but the College sits below its own ${num(PLAN.reserve.target_months_of_operating_cost)}-month target for ${RESERVE_YEARS.indexOf(RESERVE_REACHED)} of the ten years — and inside the register's six-month warning band for most of them. The resilience the plan proposes is real and it is late, and the Board is asked to decide whether a founding capital contribution should bring it forward.`
    : `<strong>The reserve rule in ${ref('liquidity')} is not met at any price tested, inside ten years.</strong> The Core case closes the decade holding ${m$(CY10.reserve)} against a target near ${m$(RESERVE_TARGET)}. This is not solved by charging more. It requires a founding capital contribution, a longer horizon to full reserve, or a lower target, and the plan puts all three to the Board rather than choosing one.`} ${chip('board')}`)}
    ${p(`<strong>Seven.</strong> The two things standing between this College and its first conferred award are not engineering. The Board of Academic Standards has no appointed members and cannot approve the competency mappings; no External Examiner has been appointed. Both are appointments. Every surface that would carry those names already exists and already renders, and the platform refuses to publish a person into an office they have not accepted.`)}
    ${note(`This document is a planning instrument. Every financial figure in it is a projection computed from stated assumptions, and none of it is a record of trading. Classifications are printed beside the figures throughout: ${chip('verified')} for what the College has adopted and published, ${chip('assumption')} for what this plan asserts, ${chip('board')} for what nobody has yet decided.`)}
  </div>`);

  // ── 01 INSTITUTIONAL IDENTITY ──────────────────────────────────
  S(opener(SEC.identity, 'Institutional Identity', 'What the College is, what it sells, and the discipline that makes both statements checkable.',
    [{ v: num(B.levels), l: 'Levels, A1 to C2' }, { v: num(B.totalHours), l: 'Academic hours' }, { v: num(B.totalCredits), l: 'Credits' }]));
  S(`<div class="body">
    ${lead('An institution is what it can be held to. This section states what WEC-LC holds, and — with the same prominence — what it does not.')}
    ${h2('What the College holds')}
    ${p(`A six-level qualification pathway of ${num(B.totalHours)} academic hours and ${num(B.totalCredits)} credits, mapped level by level to the Common European Framework. A published tariff decomposed to the cent. A published set of academic, assessment, conduct and complaints regulations. A registry in which every award is signed, hash-chained to the one before it, and verifiable by a stranger with no account. A bilingual edition of every published surface, held in parity by a test rather than by intention.`)}
    ${h2('What the College does not hold, stated here rather than left to be discovered')}
    ${p('No third-party accreditation. No ranking. No institutional partnership. No appointed External Examiner. No completed cohort. The College says so where a reader asks and does not gesture at any of it elsewhere. A ten-year plan that blurred this would be worth less than one that states it on its second page.')}
    ${figure('The qualification ladder', 'Six levels, A1 to C2, at the adopted tariff', A.ladder(B),
      'data/tuition.json and sql/schema.sql § programme_levels. VERIFIED.')}
  </div>`);

  // ── 02–03 ACADEMIC + CREDIT ARCHITECTURE ───────────────────────
  S(opener(SEC.academic, 'Academic and Credit Architecture', 'The hours a learner undertakes, the credits they carry, and what each level costs to the cent.'));
  S(`<div class="body">
    ${lead(`Every figure in this section is ${chip('verified')} — it is read from the College's adopted commercial record, not asserted by this plan.`)}
    ${table('The adopted pathway', 'Per level and cumulative',
      ['Level', 'CEFR', 'Hours', 'Credits', 'Fee', 'Cumulative hours', 'Cumulative fee'],
      ['I', 'II', 'III', 'IV', 'V', 'VI'].map((r, i) => [
        `<strong>${r}</strong> ${['Foundation', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'English Mastery'][i]}`,
        ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][i],
        num(B.hoursPerLevel), num(B.creditsPerLevel), usd(B.levelFee, 2),
        num(B.hoursPerLevel * (i + 1)), usd(B.levelFee * (i + 1), 2),
      ]).concat([{ strong: true, cells: ['TOTAL', 'A1–C2', num(B.totalHours), num(B.totalCredits), usd(B.programmeTotal), num(B.totalHours), usd(B.programmeTotal)] }]),
      'data/tuition.json. VERIFIED. Six levels at $3,166.67 sum to $19,000.02; the College charges $19,000 and waives two cents rather than publish a total its own per-level figure contradicts.')}
    ${kpi([
      { v: usd(B.perHour, 2), l: 'Per academic hour' },
      { v: usd(B.perCredit, 2), l: 'Per credit' },
      { v: usd(B.instalment, 2), l: 'Per instalment', n: `${B.instalmentsPerLevel} a level` },
      { v: `${B.refundWindowDays} days`, l: 'Full refund, no reason required' },
    ])}
    ${table('What a level fee buys', 'The published decomposition, in basis points of the fee',
      ['Line', 'Share', 'Per level', 'Across the programme'],
      B.lines.map((l) => [l.name, pct(l.share, 1), usd(l.perLevel, 2), usd(l.perProgramme, 2)])
        .concat([{ strong: true, cells: ['TOTAL', '100.0%', usd(B.levelFee, 2), usd(B.programmeTotal, 2)] }]),
      'data/tuition.json. VERIFIED. The teaching line is the largest and it is a person, not a platform.')}
  </div>`);

  // ── 04 DELIVERY AND COMMERCIAL ARCHITECTURE ────────────────────
  S(opener(SEC.delivery, 'Delivery and Commercial Architecture', 'Three routes to one credential, and why they may differ in price by a factor of five and still be honest.'));
  S(`<div class="body">
    ${lead('You pay for what the College does for you. You never pay for the credential itself, and the credential is the same whichever route you take to it.')}
    ${table('The three routes', 'All ${chip} verified and published'.replace('${chip}', ''),
      ['Route', 'What it buys', 'Per level', 'Full pathway'],
      [
        ['<strong>Enrolled</strong>', 'A named instructor, written feedback on every produced piece, tutorials on request, the platform, assessment, conferral and the record', usd(B.levelFee, 2), usd(B.programmeTotal)],
        ['<strong>Independent</strong>', `Access to the level in the platform (${usd(B.independent.materials)}), the examination with second marking and moderation (${usd(B.independent.assessment)}), and conferral with the registry entry (${usd(B.independent.conferral)})`, usd(B.independentPerLevel), usd(B.independentPerLevel * B.levels)],
        ['<strong>Sponsored</strong>', 'Enrolled tuition at a published volume band — never a negotiated rate', B.partnerBands.map((b) => `${b.from}–${b.to || '∞'}: ${pct(b.rate, 0)} off`).join('<br/>'), '—'],
      ],
      'data/commercial.json. VERIFIED. The bands are published, so an institution that asks for a price gets the same answer as one that does not know to ask.')}
    ${h2('Why the independent fee is not the enrolled cost-share')}
    ${p(`The tariff allocates ${pct(B.lines.find((l) => l.key === 'assessment').share, 0)} of a level fee — ${usd(B.lines.find((l) => l.key === 'assessment').perLevel, 2)} — to assessment and marking, while the independent assessment step is ${usd(B.independent.assessment)}. That is not a discount and not an inconsistency: the two buy different things. The enrolled line covers ten module quizzes, ten assignments marked with written feedback by a person, the level examination and its second marking. The independent fee covers the examination, its second marking and its internal moderation. Marking ten assignments with feedback is teaching, and it is priced where teaching is priced.`)}
    ${h2('What this means for the model')}
    ${p('An independent candidate consumes assessment capacity and no instructor. A sponsored learner consumes an instructor exactly as an enrolled one does, at a banded price. The model tracks the two populations separately from end to end — conflating them is what produces a plan that hires instructors for people who never asked for one.')}
  </div>`);

  // ── 05 MARKET STRATEGY ─────────────────────────────────────────
  S(opener(SEC.market, 'Global Market Strategy', 'Four markets, entered in sequence, and the cost of being found in each.',
    [{ v: '4', l: 'Markets' }, { v: 'Y1–Y4', l: 'Sequenced entry' }, { v: usd(Y10.costPerAcquisition), l: 'Blended cost per learner, Y10' }]));
  S(`<div class="body">
    ${lead('An institution with one platform and a finite faculty cannot open four markets in its first year and serve any of them well. The sequence is a strategic choice, not a constraint.')}
    ${table('The market sequence', 'Cost of acquisition and route mix, by market',
      ['Market', 'Opens', 'Cost per enrolled learner', 'Enrolled', 'Independent', 'Sponsored'],
      PLAN.market.regions.map((r) => [
        `<strong>${esc(r.name)}</strong>`, `Year ${r.opens_year}`, usd(r.cac_usd),
        pct(r.enrolled_share, 0), pct(r.independent_share, 0), pct(r.partner_share, 0),
      ]),
      'data/masterplan.json § market. MODELLED ASSUMPTION — no market-share claim is made or implied.')}
    ${p('The Gulf carries the highest acquisition cost because the sale is longest and most personal, and the highest sponsored share because an employer or ministry buying for a cohort is the natural shape of that market. West Africa carries the lowest cost because reach is cheaper and the qualification is already understood, and the highest independent share because a candidate who wants the credential without the teaching is a larger part of that population.')}
    ${figure('The acquisition funnel', `Year ${Y10.year}, expected case — every stage between a stranger and a matriculated learner`, A.funnelChart(Y10),
      'WEC-LC Financial Model § Funnel. Stage rates are MODELLED ASSUMPTIONS.')}
    ${p('The chain is stated stage by stage rather than as one blended conversion figure, because a blended figure hides the stage that is actually failing and cannot be managed.')}
  </div>`);

  // ── 06–07 ENROLMENT AND REVENUE ────────────────────────────────
  S(opener(SEC.engine, 'The Economic Engine', 'How WEC-LC converts academic capacity into sustainable institutional growth.',
    [{ v: m$(BASE.totals.netTuition), l: 'Ten-year net tuition' }, { v: m$(Y10.netTuition), l: 'Year 10' }, { v: num(Y10.activeStudents), l: 'Active learners, Y10' }]));
  S(`<div class="body">
    ${lead('The model runs forwards and is constrained twice — by what the College spends to be found, and by whom it can actually teach. It is therefore impossible to improve the headline without spending more, hiring more, or keeping more learners.')}
    ${figure('Ten-year revenue trajectory', 'Three operating scenarios under the adopted tariff and stated assumptions', A.scenarioBand(ALL),
      'WEC-LC Financial Model. Planning estimates, not historical results.')}
    ${figure('Active learners', 'Taught and independent populations, expected case', A.enrolmentCurve(BASE),
      'WEC-LC Financial Model § Expected.')}
    ${table('The decade, expected case', 'Enrolment, delivery and revenue',
      ['Year', 'Paid enrolments', 'Active', 'Instructors', 'Levels delivered', 'Awards', 'Net tuition', 'Cumulative'],
      BASE.years.map((y) => [
        `<strong>${y.calendar}</strong>`, num(y.funnel.paid), num(y.activeStudents), num(y.instructors),
        num(y.levelsDelivered), num(Math.round(y.awardsConferred)), usd(y.netTuition), usd(y.cumulativeRevenue),
      ]).concat([{ strong: true, cells: ['TOTAL', '—', `peak ${num(BASE.totals.peakActive)}`, '—', num(BASE.totals.levelsDelivered), num(Math.round(BASE.totals.awardsConferred)), usd(BASE.totals.netTuition), usd(BASE.totals.netTuition)] }]),
      'WEC-LC Financial Model § Expected. Cumulative column reconciles to the sum of the annual column.')}
  </div>`);

  // ── 08–09 COST AND ALLOCATION ──────────────────────────────────
  S(opener(SEC.cost, 'Cost, Allocation and What Is Retained', 'Every dollar of net tuition, followed to where it is spent or kept.'));
  S(`<div class="body">
    ${lead('A plan that forecasts revenue without forecasting the cost of delivering it is not a plan. This section reconciles the whole of net tuition to 100 per cent, with no unexplained residual.')}
    ${figure('From gross tuition to surplus', 'Ten years, expected case', A.waterfall(BASE),
      'WEC-LC Financial Model. Every bar is the sum of its own annual column.')}
    ${figure('Revenue allocation', `Ten-year net tuition of ${m$(ALLOC.net)}, allocated in full`, A.allocationBar(ALLOC),
      'WEC-LC Financial Model § Allocation. Reconciles to 100 per cent by construction.')}
    ${table('The allocation framework', 'Where every dollar of net tuition goes across the decade',
      ['Category', 'Share', 'Ten-year amount', 'Governing authority'],
      ALLOC.rows.map((r, i) => [
        r.name, pct(r.share), usd(r.amount),
        ['College Executive', 'College Executive', 'College Executive', 'College Executive', 'College Executive', 'Academic Senate', 'Board of Governors'][i] || 'Board of Governors',
      ]).concat([{ strong: true, cells: ['TOTAL', pct(ALLOC.rows.reduce((n, r) => n + r.share, 0)), usd(ALLOC.net), '—'] }]),
      'WEC-LC Financial Model § Allocation.')}
    ${p(`Instruction takes ${pct(ALLOC.rows[0].share)} of net tuition across the decade, against the ${pct(B.lines.find((l) => l.key === 'teaching').share, 0)} the published tariff allocates to teaching. That agreement is not a coincidence: the model derives how many learners one instructor carries <em>from</em> the published allocation, so the establishment cannot drift away from what the fee says it buys. An earlier draft asserted a larger caseload and spent 19 per cent — which would have been selling supervision at ${pct(B.lines.find((l) => l.key === 'teaching').share, 0)} and staffing it at nineteen.`)}
  </div>`);

  // ── 10 LIQUIDITY ───────────────────────────────────────────────
  S(opener(SEC.liquidity, 'Liquidity and Reserves', 'What the College keeps, and the rule it keeps it by.',
    [{ v: m$(BASE.totals.closingReserve), l: 'Closing reserve' }, { v: `${num(Y10.reserveMonths)} mo`, l: 'Operating cost covered' }, { v: `${PLAN.reserve.target_months_of_operating_cost} mo`, l: 'Target' }]));
  S(`<div class="body">
    ${lead('The target is stated in months of operating cost rather than as a share of revenue, because the thing a reserve has to survive is a year when revenue falls and cost does not. A share-of-revenue reserve shrinks exactly when it is needed.')}
    ${figure('Reserve accumulation against the months-of-cost target', 'Expected case', A.reserveChart(BASE),
      'WEC-LC Financial Model § Reserves.')}
    ${table('The reserve schedule', 'Expected case',
      ['Year', 'Net tuition', 'Total cost', 'Surplus', 'Contribution', 'Closing reserve', 'Months of cost'],
      BASE.years.map((y) => [
        `<strong>${y.calendar}</strong>`, usd(y.netTuition), usd(y.cost.total), usd(y.surplus),
        usd(y.reserveContribution), usd(y.closingReserve), num(y.reserveMonths, 1),
      ]),
      'WEC-LC Financial Model § Reserves. Nothing is labelled a reserve that the model does not retain.')}
  </div>`);

  // ── 11 SCHOLARSHIPS ────────────────────────────────────────────
  S(opener(SEC.access, 'Access, Remission and Referral', 'Scholarship modelled as money rather than written as language.'));
  S(`<div class="body">
    ${lead(`The College already operates a remission fund of ${pct(B.remissionShare, 0)} of tuition ${chip('verified')} and a referral credit of ${usd(B.referralCredit)} that is never paid as cash. This plan models the cost of both rather than describing them.`)}
    ${table('The effect of access provision on tuition', 'Ten years, expected case',
      ['Line', 'Ten-year amount', 'Share of gross'],
      [
        ['Gross tuition', usd(BASE.totals.grossTuition), '100.0%'],
        ['less Refunds — fourteen-day window, no reason required', `(${usd(BASE.totals.refunds)})`, pct(BASE.totals.refunds / BASE.totals.grossTuition)],
        ['less Fee remission — the published scholarship fund', `(${usd(BASE.totals.remission)})`, pct(BASE.totals.remission / BASE.totals.grossTuition)],
        { strong: true, cells: ['NET ACADEMIC REVENUE', usd(BASE.totals.netTuition), pct(BASE.totals.netTuition / BASE.totals.grossTuition)] },
      ],
      'WEC-LC Financial Model. Remission is a real cost carried before surplus, not a marketing line.')}
    ${p(`Over the decade the College remits <strong>${m$(BASE.totals.remission)}</strong> in fee remission — money it does not collect, from learners it teaches anyway. That figure is modelled at the published rate rather than chosen, and it is presented here as a cost because that is what it is.`)}
  </div>`);

  // ── 12–14 EXECUTIVE / TECHNOLOGY / STAFFING ────────────────────
  S(opener(SEC.sponsored, 'Sponsored Cohorts and the Executive Market', 'Where one negotiation carries a cohort, and why the band is published rather than negotiated.'));
  S(`<div class="body">
    ${lead('A sponsoring institution — an employer, a ministry, a professional body — is the natural shape of the Gulf market and the single highest-leverage commercial act available to the College.')}
    ${table('Sponsored cohort economics', 'At the published bands, per cohort, full pathway',
      ['Cohort size', 'Band', 'Per learner', 'Cohort value', 'Instructors required'],
      [10, 25, 50, 100, 250, 500].map((n) => {
        const band = B.partnerBands.find((b) => n >= b.from && (b.to === null || n <= b.to)) || B.partnerBands[0];
        const per = B.programmeTotal * (1 - band.rate);
        return [num(n), pct(band.rate, 0), usd(per), usd(per * n), num(Math.ceil(n / Y10.learnersPerInstructor))];
      }),
      'data/commercial.json § partner bands (VERIFIED) applied to the adopted tariff. Cohort values are illustrative of the published bands, not booked business.')}
    ${p(`The bands are published. An institution that asks for a price gets the same answer as one that does not know to ask, and no sponsor holds pricing leverage over the College. The exposure a sponsored cohort creates is volume concentration, not price — which is why the risk register carries a ceiling on any single sponsor's share of active learners.`)}
    ${h3('The Executive tier')}
    ${p(`${chip('board')} The College has not adopted a bespoke executive tier, and this plan does not invent a price for one. What it does model is the sponsored band, which is the adopted mechanism for cohort purchasing. A separate executive proposition — concierge scheduling, compressed delivery, individual tutorial loading above the published allocation — is a coherent strategic option and would require its own tariff, its own teaching allocation and a Board decision. It is named here so that its absence is deliberate rather than an oversight.`)}
  </div>`);

  S(opener(SEC.technology, 'Technology, Establishment and Staffing', 'What it costs to run the institution, and who is actually employed to do it.'));
  S(`<div class="body">
    ${lead('Every post below is a real post with a real salary, hired against a threshold rather than as a percentage of revenue.')}
    ${table('The establishment', 'Expected case, selected years',
      ['Post', 'From', 'One per', 'Y1', 'Y5', 'Y10'],
      PLAN.staffing.roles.map((r) => {
        const head = (y) => (BASE.years[y].cost.establishmentDetail.find((d) => d.key === r.key) || {}).heads || 0;
        return [esc(r.name), `Year ${r.from_year}`, r.per_n_students ? `${num(r.per_n_students)} learners` : 'institution', num(head(0)), num(head(4)), num(head(9))];
      }).concat([{ strong: true, cells: ['Instructors (derived from the teaching allocation)', 'Year 1', `${num(Y10.learnersPerInstructor, 1)} learners`, num(Y1.instructors), num(BASE.years[4].instructors), num(Y10.instructors)] }]),
      'WEC-LC Financial Model § Establishment. Salaries are MODELLED ASSUMPTIONS.')}
    ${table('Operating cost architecture', 'Ten-year totals, expected case',
      ['Category', 'Basis', 'Ten-year total', 'Share of net tuition'],
      [
        ['Instruction', `${num(Y10.learnersPerInstructor, 1)} learners per instructor, derived from the published teaching allocation`, usd(BASE.totals.instruction), pct(BASE.totals.instruction / BASE.totals.netTuition)],
        ['Student acquisition', 'Budget set per year, divided by cost per learner by market', usd(BASE.totals.acquisition), pct(BASE.totals.acquisition / BASE.totals.netTuition)],
        ['Establishment', 'Named posts against enrolment thresholds', usd(BASE.years.reduce((n, y) => n + y.cost.establishment, 0)), pct(BASE.years.reduce((n, y) => n + y.cost.establishment, 0) / BASE.totals.netTuition)],
        ['Technology', `${usd(PLAN.technology_usd.floor_per_year)} floor plus ${usd(PLAN.technology_usd.per_active_learner)} per active learner`, usd(BASE.years.reduce((n, y) => n + y.cost.technology, 0)), pct(BASE.years.reduce((n, y) => n + y.cost.technology, 0) / BASE.totals.netTuition)],
        ['Operations and compliance', `${usd(PLAN.operating_usd.floor_per_year)} floor plus ${usd(PLAN.operating_usd.per_active_learner)} per active learner`, usd(BASE.years.reduce((n, y) => n + y.cost.operating, 0)), pct(BASE.years.reduce((n, y) => n + y.cost.operating, 0) / BASE.totals.netTuition)],
        ['Institutional development', `${pct(PLAN.institutional_development_usd.share_of_net_tuition)} of net tuition, plus the External Examiner from Year ${PLAN.institutional_development_usd.external_examiner_usd_from_year}`, usd(BASE.years.reduce((n, y) => n + y.cost.development, 0)), pct(BASE.years.reduce((n, y) => n + y.cost.development, 0) / BASE.totals.netTuition)],
        { strong: true, cells: ['TOTAL COST', '—', usd(BASE.totals.cost), pct(BASE.totals.cost / BASE.totals.netTuition)] },
      ],
      'WEC-LC Financial Model.')}
    ${p('Institutional development is funded as a share of net tuition rather than from surplus. A line funded from surplus is a line that is cut in the year it is most needed, and this one pays for publishing, the External Examiner, accreditation work and curriculum revision.')}
  </div>`);

  // ── 15 GOVERNANCE ──────────────────────────────────────────────
  S(opener(SEC.governance, 'Governance and Authority', 'Who decides what, and the separations that protect a learner.'));
  S(`<div class="body">
    ${lead('Academic judgement, commercial authority and financial control are held apart. No individual, including the Founder, may independently determine academic standards, approve their own work, or override established procedure.')}
    ${table('The schedule of authority', 'Who approves, who is consulted, and how often',
      ['Decision', 'Approves', 'Consulted / reserved', 'Cycle'],
      GOVERNANCE.map((g) => [`<strong>${esc(g[0])}</strong>`, esc(g[1]), esc(g[2]), esc(g[3])]),
      `Published governance instrument, /governance/. The offices named are defined; several are not yet filled — see ${ref('risk')}.`)}
    ${p(`${chip('board')} The Board of Academic Standards currently has no appointed members. Until it does, competency mappings remain interim and no award can be conferred, because the platform will not confer against an unapproved mapping. This is stated in the risk register as the highest-impact open item in the plan, and it is an appointment rather than a piece of work.`)}
  </div>`);

  // ── 16 RISK ────────────────────────────────────────────────────
  S(opener(SEC.risk, 'Institutional Risk Register', 'Twenty risks, each with an early warning somebody can actually observe.',
    [{ v: String(RISKS.length), l: 'Risks carried' }, { v: '4', l: 'Rated high likelihood' }, { v: '1', l: 'Rated severe impact' }]));
  S(`<div class="body">
    ${lead('A register of generic risks is a register nobody reads twice. Each entry below names the measurement that would tell the College it is happening.')}
    ${table('The register', '',
      ['Category', 'Risk', 'Likelihood', 'Impact', 'Early warning', 'Mitigation', 'Owner'],
      RISKS.map((r) => [`<strong>${esc(r[0])}</strong>`, esc(r[1]), esc(r[2]), esc(r[3]), esc(r[4]), esc(r[5]), esc(r[6])]),
      'Authored for this plan. MODELLED ASSESSMENT — likelihood and impact are judgements, not measurements.',
      { compact: true })}
  </div>`);

  // ── 17 ROADMAP ─────────────────────────────────────────────────
  S(opener(SEC.roadmap, 'The Ten-Year Roadmap', 'Five phases, and what has to be true at the end of each.'));
  S(`<div class="body">
    ${lead('The phases are derived from what the model actually produces, not chosen and then illustrated.')}
    ${PHASES.map((ph) => `
      <div class="phase">
        <div class="phase__n">${ph[0]}</div>
        <div class="phase__b">
          <p class="phase__t">${esc(ph[1])} <span class="phase__y">Years ${ph[2]}</span></p>
          <p class="phase__d">${esc(ph[3])}</p>
          <p class="phase__m">${esc(ph[4](BASE))}</p>
        </div>
      </div>`).join('')}
    ${table('The ten-year scorecard', 'Expected case. Every figure a TARGET, not an actual.',
      ['Measure', 'Y1', 'Y3', 'Y5', 'Y7', 'Y10'],
      [
        ['Active learners', ...[0, 2, 4, 6, 9].map((i) => num(BASE.years[i].activeStudents))],
        ['Paid enrolments in year', ...[0, 2, 4, 6, 9].map((i) => num(BASE.years[i].funnel.paid))],
        ['Instructors', ...[0, 2, 4, 6, 9].map((i) => num(BASE.years[i].instructors))],
        ['Awards conferred in year', ...[0, 2, 4, 6, 9].map((i) => num(Math.round(BASE.years[i].awardsConferred)))],
        ['Net tuition', ...[0, 2, 4, 6, 9].map((i) => usd(BASE.years[i].netTuition))],
        ['Operating margin', ...[0, 2, 4, 6, 9].map((i) => pct(BASE.years[i].margin))],
        ['Cost per acquired learner', ...[0, 2, 4, 6, 9].map((i) => usd(BASE.years[i].costPerAcquisition))],
        ['Net tuition per active learner', ...[0, 2, 4, 6, 9].map((i) => usd(BASE.years[i].revenuePerActive))],
        ['Reserve, months of cost', ...[0, 2, 4, 6, 9].map((i) => num(BASE.years[i].reserveMonths, 1))],
      ],
      'WEC-LC Financial Model § Expected. TARGET figures throughout — the College has no trading history against which any of these could be an actual.')}
  </div>`);

  // ── 18 SENSITIVITY AND BREAK-EVEN ──────────────────────────────
  S(opener(SEC.breakeven, 'Break-even and Sensitivity', 'What has to be true, and what happens when one thing is not.',
    [{ v: FIRST_CLEAR ? String(FIRST_CLEAR.calendar) : '—', l: 'Breaks even' }, { v: FIRST_CLEAR ? num(FIRST_CLEAR.breakEvenLearners) : '—', l: 'Learners required' }, { v: String(SENS.length), l: 'Shocks modelled' }]));
  S(`<div class="body">
    ${figure('Break-even', 'Learners the year needs against learners the plan produces', A.breakEvenChart(BE),
      'WEC-LC Financial Model § Break-even. Fixed cost is everything that does not move with one more learner.')}
    ${table('Break-even by year', 'Expected case',
      ['Year', 'Fixed cost', 'Contribution per learner', 'Break-even learners', 'Plan produces', 'Clears'],
      BE.map((b) => [`<strong>${b.calendar}</strong>`, usd(b.fixedCost), usd(b.contributionPerLearner, 2),
        b.breakEvenLearners ? num(b.breakEvenLearners) : '—', num(b.actualLearners),
        b.clears ? '<span class="yes">yes</span>' : '<span class="no">no</span>']),
      'WEC-LC Financial Model § Break-even.')}
    ${figure('Sensitivity', 'Single-variable shocks against the expected case, ten-year net tuition', A.tornado(SENS),
      'WEC-LC Financial Model § Sensitivity. Each shock is applied alone so one effect can be read without another moving underneath it.')}
    ${p(`The tornado carries the finding that should change how the budget is set. <strong>${esc(SENS.slice().sort((a, b) => Math.abs(b.netDelta) - Math.abs(a.netDelta))[0].label)}</strong> is the largest single exposure in the plan. Continuation — whether a learner who finishes a level begins the next one — moves the decade more than the cost of acquiring a learner does, which is why the roadmap turns the budget toward retention from Phase II.`)}
  </div>`);

  // ── 19 MARKET VALIDATION ───────────────────────────────────────
  S(opener(SEC.validation, 'Market Validation', 'What comparable programmes actually charge, and what that did to the previous plan.',
    [{ v: num(EV_COUNT), l: 'Priced observations recorded' }, { v: num(EV_SOURCES), l: 'Identifiable published sources' },
     { v: num(EV.gaps.length), l: 'Markets left marked as modelled' }]));
  S(`<div class="body">
    ${lead(`An earlier draft of this plan proposed a tariff built on willingness-to-pay figures that were <em>asserted</em>. This section tests them against published prices. It is placed before the pricing decision rather than after it because that is the order the work was done in, and because a validation section that follows a price is a defence of it. ${chip('modelled')}`)}
    ${note(`Every observation below is recorded in <strong>data/market-evidence.json</strong> with its provider, its local price, the hours it buys, the date it was gathered and its source address. Prices were converted at the rates stated in that file. Nothing about the outside world is typed into this publication.`)}

    ${h2('The finding that must be stated first')}
    ${p(`<strong>${esc(EV.gaps.find((g) => g.status === 'NO DIRECT COMPARABLE FOUND').note)}</strong>`)}
    ${p(`That is why this section prices per level and per hour of a named instructor's attention rather than comparing pathway totals. A pathway total has no comparable. An hour of a qualified teacher's individual attention has one everywhere.`)}

    ${table('What comparable providers charge', 'Published tariffs, converted, with the unit each actually buys',
      ['Market', 'Provider', 'What it buys', 'Price', 'USD', 'Per contact hour', 'Confidence'],
      EV_SEGMENTS.flatMap(([key, name]) => EV[key].observations
        .filter((o) => o.price_local || o.price_usd)
        .map((o, i) => [
          i === 0 ? `<strong>${esc(name)}</strong>` : '',
          esc(o.provider), esc(o.product),
          esc(o.price_local || '—'),
          o.price_usd == null ? '—' : (typeof o.price_usd === 'number' ? usd(o.price_usd) : `$${esc(String(o.price_usd))}`),
          o.per_contact_hour_usd ? usd(o.per_contact_hour_usd, 2) : (o.per_week_local ? esc(o.per_week_local) + '/wk' : '—'),
          esc(o.confidence || '—'),
        ])),
      `Gathered ${esc(EV.researched_on)}. ${esc(EV.fx_note)}`)}

    ${h2('What the research did to the demand model')}
    ${p(`Four of the five segments moved, and one moved by a factor of nearly three. The table states the assumed figure, the researched figure and the evidence that moved it, so the Board can see which changes rest on a published tariff and which remain modelled.`)}
    ${table('Willingness to pay: assumed against researched', 'Price of a complete A1–C2 pathway at which a segment converts at its reference rate',
      ['Segment', 'Assumed', 'Researched', 'Change', 'Elasticity', 'Credibility floor', 'Evidential confidence'],
      PR.SEGMENTS.map((seg) => [
        `<strong>${esc(seg.name)}</strong>`,
        seg.wtpAssumed ? usd(seg.wtpAssumed) : '—',
        usd(seg.wtpFull),
        seg.wtpAssumed ? `<strong>${pct(seg.wtpFull / seg.wtpAssumed - 1, 0)}</strong>` : '—',
        seg.elasticity.toFixed(2), usd(seg.credibilityFloor),
        esc(seg.confidence),
      ]),
      'WEC-LC Pricing Model § SEGMENTS, against data/market-evidence.json. A segment marked MODELLED carries no direct observation and is scaled from the ones that do.')}

    ${h2('The comparison that survives')}
    ${p(`The unit that can honestly be compared is the price of one hour of individual instructor attention. On that unit WEC-LC is <strong>cheaper than the British Council in Saudi Arabia at ${BC_CHEAPER_AT} of the ${num(Object.keys(PR.PRODUCTS).length)} tiers</strong> — including every Executive tier — and it confers a qualification the British Council module does not.`)}
    ${table('Price per hour of individual instructor attention', 'The only like-for-like unit available',
      ['Product', 'Individual attention across the pathway', 'Proposed pathway price', 'Per hour of attention'],
      Object.keys(PR.PRODUCTS).map((k) => {
        const hrs = PR.attentionHours(k);
        return [`<strong>${esc(PR.PRODUCTS[k].name)}</strong>`, num(Math.round(hrs)),
          usd(PATH[k]), hrs ? usd(PATH[k] / hrs, 2) : '—'];
      }).concat([{ strong: true, cells: [
        'British Council Saudi Arabia, group of 12',
        num(Math.round(EV.gcc.observations[0].hours / 12)),
        usd(EV.gcc.observations[0].price_usd) + ' per module',
        usd(EV.gcc.observations[0].price_usd / (EV.gcc.observations[0].hours / 12), 2),
      ] }]),
      'Group hours are divided by the published group size, because a class of twelve gives each learner a twelfth of the teacher. PROPOSED / MODELLED against a published competitor tariff.')}

    ${h2('Where the evidence does not exist')}
    ${p(`Four markets and one central question could not be answered from published prices. They are listed rather than filled in, and the model carries them as assumptions marked as such.`)}
    ${table('Marked as modelled', 'Gaps in the evidence, stated rather than closed',
      ['Market or question', 'Status', 'What the model does instead'],
      EV.gaps.map((g) => [
        `<strong>${esc(g.market || g.topic)}</strong>`,
        chip(g.status === 'NO DIRECT COMPARABLE FOUND' ? 'nocomparable' : 'insufficient'),
        /* The central gap's own note is this section's opening claim,
           quoted in full three tables above. Repeating it here would be
           padding a board paper with its own sentence. */
        esc(g.status === 'NO DIRECT COMPARABLE FOUND'
          ? 'Pathway prices are built up from per-level comparables rather than read off a competitor. See the opening of this section.'
          : (g.note || 'Scaled from the segments that carry direct observations.')),
      ]),
      'data/market-evidence.json § gaps.')}

    ${h2('The verdict on the previous plan')}
    ${p(`The plan this section replaces projected <strong>${m$(PA.superseded_pathway_usd.projected_ten_year_revenue_usd)}</strong> of ten-year revenue on <strong>${m$(PA.superseded_pathway_usd.projected_ten_year_surplus_usd)}</strong> of surplus. Re-run on researched demand at the same prices it does not survive: revenue falls by more than a third and the decade closes in deficit. ${esc(PA.superseded_pathway_usd.why_withdrawn)}`)}
    ${p(`It is not defended. The tariff was rebuilt, and what follows is the rebuild. The withdrawn prices are recorded in <strong>data/masterplan.json § proposed_architecture.superseded_pathway_usd</strong> so that the revision is visible rather than quietly performed.`)}
  </div>`);

  // ── 20 THE PRICING DECISION ────────────────────────────────────
  S(opener(SEC.pricing, 'The Pricing Decision', 'What WEC-LC should charge, arrived at from delivery economics rather than from an existing number.',
    [{ v: usd(PATH.directed), l: 'Directed pathway, proposed' }, { v: usd(PATH.tutored), l: 'Tutored pathway, proposed' }, { v: usd(PATH.execBespoke), l: 'Executive Bespoke, proposed' }]));
  S(`<div class="body">
    ${lead(`This section does not adjust the adopted tariff. It rebuilds the price from what each product costs to deliver — tutorial hours, group hours at their real group size, pieces of produced work at the hours they take to read, assessment, second marking, moderation and adviser time — and lets the answer land where the arithmetic puts it. ${chip('board')}`)}
    ${h2('What an hour of academic attention costs')}
    ${p(`A loaded instructor costs ${usd(PLAN.delivery_capacity.instructor_cost_usd * (1 + PLAN.delivery_capacity.instructor_oncost_rate))} a year against ${num(PR.CONTRACTED_HOURS)} contracted hours, of which ${pct(PR.PRODUCTIVE_FRACTION, 0)} is contact, marking and tutorial time. The remainder is preparation, moderation, standardisation and the meetings an academic body must hold to keep a standard — real time no learner is billed for. That gives <strong>${usd(PR.ACADEMIC_HOUR_COST, 2)}</strong> an academic hour, and every price below is built from it.`)}
    ${table('What each product costs to deliver', 'Fully loaded, per level and across the six-level pathway',
      ['Product', 'What the learner receives', 'L I', 'L III', 'L VI', 'Pathway'],
      Object.keys(PR.PRODUCTS).map((k) => [
        `<strong>${esc(PR.PRODUCTS[k].name)}</strong>`, esc(PR.PRODUCTS[k].blurb),
        usd(PR.fullCost(k, 0)), usd(PR.fullCost(k, 2)), usd(PR.fullCost(k, 5)),
        `<strong>${usd([0, 1, 2, 3, 4, 5].reduce((a, i) => a + PR.fullCost(k, i), 0))}</strong>`,
      ]),
      'WEC-LC Pricing Model. Delivery cost only; acquisition and institutional overhead are carried separately.')}
    ${h2('The argument this section used to make, and why it was withdrawn')}
    ${p(`The pre-validation draft justified its Directed price on the ground that <em>revenue was flat above about ${usd(PA.revenue_plateau_usd)}</em> — that charging more would earn nothing and merely serve fewer people. On researched demand that is <strong>not true</strong>, and the plan does not keep an argument because it was convenient. Revenue continues to rise well past the proposed price, and so does surplus.`)}
    ${p(`The reason it rises is the part that matters. A buyer priced out of the Directed pathway does not vanish from the model. They step down to the <strong>Independent route</strong> — ${usd(PATH.independent)}, the College's adopted price — and sit the same examinations, against the same rubric, for the same award, without ever being taught. The number of people WEC-LC credentials barely moves as the Directed price rises. What moves is whether it teaches them.`)}
    ${table('What a higher Directed price actually buys', 'Year-10 enrolment by route, and the decade it produces',
      ['Directed price', 'Independent', 'Directed', 'Tutored', 'Executive', 'Taught share', 'Ten-year surplus'],
      FRONTIER_ROWS,
      'WEC-LC Projection Model. The surplus above the proposed price is earned by converting taught learners into unsupervised candidates.')}
    ${h2('The constraint management proposes instead')}
    ${p(`Unconstrained surplus maximisation would take that money. It would put Directed near ${usd(TM.unconstrained_price_usd)}, earn roughly ${m$(SURPLUS_AT_15K - CORE.totals.surplus)} more across the decade, and leave the College teaching fewer than half the candidates it credentials — an examination board with a syllabus attached. That is a genuine result of the arithmetic and it is the second time in this plan's history that the optimiser has proposed dissolving the institution in order to improve it.`)}
    ${p(`Management therefore proposes an explicit institutional constraint, stated rather than smuggled into a price: <strong>the College teaches at least ${pct(PR.PROPOSED.teachingMajority, 0)} of the people it credentials.</strong> The Directed price is then the <em>output</em> of that constraint — the most WEC-LC can charge while it still holds, which is ${usd(PATH.directed)}, at ${pct(PR.taughtShare(PATH), 1)} taught. ${chip('board')}`)}
    ${note(`The Board is asked to resolve on the constraint, not on the price. Move the constraint and the price follows: the frontier above is published so that choice can be made on evidence. The test suite recomputes the price from the constraint on every build, so the two cannot drift apart.`)}
    ${p(`The other tiers are not set this way, because evidence binds them directly. Tutored at ${usd(PATH.tutored)} sits at the top of the researched willingness-to-pay band and still costs ${usd(PATH.tutored / PR.attentionHours('tutored'), 0)} an hour of individual instructor attention against the British Council's ${usd(EV.gcc.observations[0].price_usd / (EV.gcc.observations[0].hours / 12), 0)} for the same unit in Saudi Arabia. Executive Core at ${usd(PATH.execCore)} is ${usd(PATH.execCore / PR.attentionHours('execCore'), 0)} an hour — above the executive <em>language</em> market the research found at $50–$120, below the executive <em>coaching</em> market at $200–$600. Pricing it into the coaching band would be borrowing credibility from a different product.`)}
    ${p(`Below about ${usd(PA.institutional_floor_usd)} the margin cannot fund an examinations office, an External Examiner, a registry and a platform, and the decade never closes in surplus at all. That is the floor, and it is a hard one.`)}
  </div>`);

  S(opener(SEC.proposal, 'Management\'s Proposed Architecture', 'The prices management recommends, and the trade they represent.'));
  S(`<div class="body">
    ${lead(`<strong>Management proposes the following WEC-LC commercial architecture.</strong> Every figure is ${chip('board')} — proposed, modelled, and not adopted. The published tariff remains ${usd(B.programmeTotal)} until the Board resolves otherwise.`)}
    ${table('The proposed qualification tariff', 'Committed pathway prices, shaped to what each level costs to deliver',
      ['Code', 'CEFR', 'Qualification', 'Directed', 'Tutored', 'Exec Core', 'Exec Premium', 'Exec Bespoke'],
      PR.QUALIFICATIONS.map((q, i) => [
        `<strong>${q.code}</strong>`, q.cefr, esc(q.name),
        usd(TARIFF.directed[i]), usd(TARIFF.tutored[i]), usd(TARIFF.execCore[i]),
        usd(TARIFF.execPremium[i]), usd(TARIFF.execBespoke[i]),
      ]).concat([
        { strong: true, cells: ['', '', 'COMPLETE A1–C2 PATHWAY', usd(PATH.directed), usd(PATH.tutored), usd(PATH.execCore), usd(PATH.execPremium), usd(PATH.execBespoke)] },
        ['', '', 'Per academic hour', usd(PATH.directed / 1200, 2), usd(PATH.tutored / 1200, 2), usd(PATH.execCore / 1200, 2), usd(PATH.execPremium / 1200, 2), usd(PATH.execBespoke / 1200, 2)],
      ]),
      'PROPOSED / MODELLED. Pay-as-you-go carries a ' + pct(PR.PROPOSED.payAsYouGoUplift, 0) + ' premium over the committed pathway, because continuation is the single most valuable variable in the model.')}
    ${h2('Why these five products and not one price')}
    ${p('The College does not have to choose between reaching West Africa and serving a Gulf executive. Those buyers want different amounts of a named person\'s attention, and attention is the only thing here that actually costs money. Five delivery specifications priced to five cost structures serve all of them — and the cheapest is not a discount on the dearest, it is a different service. The credential is identical in every case: same syllabus, same examination, same rubric published before the work, same second marking, same registry entry, same public verification.')}
    ${h2('Executive education, designed and priced rather than deferred')}
    ${table('Executive economics', 'What the premium tiers cost to deliver and what they earn',
      ['Tier', 'Individual hours across the pathway', 'Delivery cost', 'Proposed price', 'Gross margin', 'Per one-to-one hour'],
      ['execCore', 'execPremium', 'execBespoke'].map((k) => {
        const cost = [0, 1, 2, 3, 4, 5].reduce((a, i) => a + PR.fullCost(k, i), 0);
        const hrs = PR.PRODUCTS[k].individual * 6;
        const price = PATH[k];
        return [`<strong>${esc(PR.PRODUCTS[k].name)}</strong>`, num(hrs), usd(cost), usd(price),
          pct((price - cost) / price, 0), hrs ? usd(price / hrs) : '—'];
      }),
      'PROPOSED / MODELLED. Executive Core is a cohort of six; Premium and Bespoke are one to one throughout.')}
    ${p('Executive is not left as a decision for somebody else. It is specified, costed and priced: Core is a cohort of no more than six scheduled around professional obligations; Premium is one to one with a named academic adviser; Bespoke adds material authored to the holder\'s own professional domain. They are substantially dearer than the standard pathway because they consume substantially more of a specialist\'s time, and the table above shows exactly how much.')}
  </div>`);

  S(opener(SEC.architectures, 'Three Architectures, One Basis', 'What the proposal is worth against the adopted tariff and against the brief\'s.',
    [{ v: m$(ARCH.proposed.totals.revenue), l: 'Proposed, ten-year revenue' }, { v: m$(ARCH.proposed.totals.surplus), l: 'Ten-year surplus' }, { v: num(ARCH.proposed.totals.y10Active), l: 'Year-10 active learners' }]));
  S(`<div class="body">
    ${lead('All three run through the same demand model, the same delivery costs, the same acquisition budget and the same capacity gate. The only thing that differs is what the College charges.')}
    ${table('The three architectures compared', 'Ten years, Core assumptions throughout',
      ['Architecture', 'Ten-year revenue', 'Ten-year surplus', 'Year-10 revenue', 'Year-10 active', 'Level awards', 'Award-holders', 'Closing reserve'],
      [
        [`Brief A — ${usd(AA.directed_total_usd)} / ${usd(AA.tutored_total_usd)}`, m$(ARCH.briefA.totals.revenue), m$(ARCH.briefA.totals.surplus), m$(ARCH.briefA.totals.y10Revenue), num(ARCH.briefA.totals.y10Active), num(Math.round(ARCH.briefA.totals.awards)), num(ARCH.briefA.totals.alumni), m$(ARCH.briefA.totals.reserve)],
        [`Adopted flat ${usd(B.programmeTotal)}`, m$(ARCH.adopted.totals.revenue), m$(ARCH.adopted.totals.surplus), m$(ARCH.adopted.totals.y10Revenue), num(ARCH.adopted.totals.y10Active), num(Math.round(ARCH.adopted.totals.awards)), num(ARCH.adopted.totals.alumni), m$(ARCH.adopted.totals.reserve)],
        { strong: true, cells: ['<strong>PROPOSED PORTFOLIO</strong>', m$(ARCH.proposed.totals.revenue), m$(ARCH.proposed.totals.surplus), m$(ARCH.proposed.totals.y10Revenue), num(ARCH.proposed.totals.y10Active), num(Math.round(ARCH.proposed.totals.awards)), num(ARCH.proposed.totals.alumni), m$(ARCH.proposed.totals.reserve)] },
      ],
      'WEC-LC Pricing and Projection Model. PROPOSED / MODELLED throughout.')}
    ${h2('The trade, stated plainly')}
    ${p(verdictParagraph())}
    ${p(`Against the brief's ${usd(AA.directed_total_usd)} / ${usd(AA.tutored_total_usd)} architecture the proposal earns <strong>${m$(ARCH.proposed.totals.surplus - ARCH.briefA.totals.surplus)}</strong> more surplus while still reaching ${pct(ARCH.proposed.totals.y10Active / ARCH.briefA.totals.y10Active, 0)} of its scale. The brief's tariff is not too low because it is cheap; it is too low because it does not cover the teaching it promises.`)}
    ${table('The Core Management Plan, year by year', 'Proposed architecture, Core assumptions',
      ['Year', 'New learners', 'Active', 'Instructors', 'Net tuition', 'Delivery', 'Acquisition', 'Fixed', 'Development', 'Surplus', 'Margin', 'Cumulative'],
      CORE.years.map((y) => [
        `<strong>${y.calendar}</strong>`, num(y.newLearners), num(y.activeLearners), num(y.instructors),
        usd(y.netTuition), usd(y.delivery), usd(y.acquisition), usd(y.fixed), usd(y.development),
        usd(y.surplus), pct(y.margin, 0), usd(y.cumulativeSurplus),
      ]).concat([{ strong: true, cells: ['TEN YEARS', num(Math.round(CORE.totals.newLearners)), `peak ${num(CORE.totals.y10Active)}`, num(CY10.instructors), usd(CORE.totals.revenue - CORE.totals.refunds), usd(CORE.totals.delivery), usd(CORE.totals.acquisition), usd(CORE.totals.fixed), usd(CORE.totals.development), usd(CORE.totals.surplus), pct(CORE.totals.surplus / CORE.totals.revenue, 0), usd(CORE.totals.surplus)] }]),
      `WEC-LC Projection Model. STRATEGIC PROJECTION — not a trading record. Net tuition is gross fees less the ${pct(PR.REFUND_RATE, 1)} the College expects to return under its 14-day right of withdrawal; ${usd(CORE.totals.refunds)} across the decade. Revenue is recognised in the year it is taught, not the year it is sold.`)}
    ${table('Three scenarios under the proposed architecture', 'Conservative is not a haircut on Core; it is weaker continuation, narrower reach and dearer acquisition',
      ['Scenario', 'Ten-year revenue', 'Ten-year surplus', 'Year-10 revenue', 'Year-10 new', 'Year-10 active', 'Level awards', 'To C2'],
      ['conservative', 'core', 'growth'].map((k) => {
        const t = PSC[k].totals;
        const row = [`<strong>${esc(PSC[k].label)}</strong>`, m$(t.revenue), m$(t.surplus), m$(t.y10Revenue), num(t.y10New), num(t.y10Active), num(Math.round(t.awards)), num(t.awardsToC2)];
        return k === 'core' ? { strong: true, cells: row } : row;
      }),
      'WEC-LC Projection Model. The Core Plan is management\'s recommended execution case, not the midpoint of the other two.')}
    ${p(`The Conservative case does not reach cumulative surplus inside the decade — it ends at ${m$(PSC.conservative.totals.surplus)}. That is stated rather than smoothed, because it is the plan's real exposure: the Core case requires continuation and reach to hold broadly as modelled, and ${ref('breakeven')}'s sensitivity shows which of those matters most.`)}
    ${h2(RESERVE_REACHED ? 'The reserve rule is met, and late' : 'The reserve rule is not met, and the plan says so')}
    ${p(`${ref('liquidity')} sets the reserve target at ${num(PLAN.reserve.target_months_of_operating_cost)} months of operating cost. Under the proposed architecture the Core case closes the decade holding <strong>${m$(CY10.reserve)}</strong> against a target near <strong>${m$(RESERVE_TARGET)}</strong>. ${RESERVE_REACHED
    ? `The target is first reached in <strong>${RESERVE_REACHED.calendar}</strong> — the ${RESERVE_YEARS.indexOf(RESERVE_REACHED) + 1}th year of ten — and this document said in bold, for one revision, that no price reached it at all. That sentence was written before the channel and regional corrections moved the decade, and it survived them; it is recorded here rather than removed, because a plan that silently deletes a claim it has disproved is a plan a reader cannot audit.`
    : '<strong>No price tested reaches it inside ten years</strong> — not the proposed price, and not the price that maximises surplus.'}`)}
    ${p(`${RESERVE_REACHED
    ? `What has not changed is the exposure. The College is below its own target for ${RESERVE_YEARS.indexOf(RESERVE_REACHED)} of the ten years, and inside the register's six-month warning band for six of them — the years in which a fall in enrolment against a cost base that does not fall with it would have to be met out of trading. Raising the tariff does not fix that: it is a timing problem, not a pricing one.`
    : `This is not an argument for charging more. Raising Directed to ${usd(TM.reserve_probe_price_usd)} still reaches only about ${m$(RESERVE_AT_13K)}, and it costs the teaching majority to get there.`} The Board has three options and the plan does not choose among them: a founding capital contribution, a longer horizon to full reserve, or a lower target. ${chip('board')}`)}
    ${note(`The Core Plan reaches full modelled reach of its four markets in ${FULL_REACH ? `Year ${FULL_REACH.year} (${FULL_REACH.calendar})` : 'no year inside the decade'}, which is why the closing years are flat. Growth beyond that point is a market-entry question rather than a pricing one, and Phase V of the roadmap is where it belongs. Reach itself is <strong>modelled and was never researched</strong>, and ${ref('validation')} records that as the largest open quantity in the plan.`)}
  </div>`);

  // ── 23 METHODOLOGY AND RECONCILIATION ──────────────────────────
  S(opener(SEC.methodology, 'Assumptions, Methodology and Reconciliation', 'Where every figure came from, and the audit that proves the document agrees with itself.'));
  S(`<div class="body">
    ${lead('Every number in this publication is computed by one engine from three files. None is typed into a page, and the reconciliation below is run as a test rather than asserted as a claim.')}
    ${table('The sources', '',
      ['Classification', 'What it covers', 'Source'],
      [
        [chip('verified'), 'Tariff, levels, hours, credits, fee decomposition, instalments, refund window', 'data/tuition.json'],
        [chip('verified'), 'Route architecture, independent step fees, sponsor bands, remission fund, referral credit', 'data/commercial.json'],
        [chip('verified'), 'Level names, CEFR mapping, duration', 'sql/schema.sql § programme_levels'],
        [chip('assumption'), 'Markets, acquisition budget and cost, funnel rates, progression, salaries, technology and operating cost, reserve policy, scenarios, sensitivity', 'data/masterplan.json'],
        [chip('board'), 'Alternative Architecture A; a bespoke executive tariff; appointment of the academic offices and the External Examiner', 'Named in situ throughout'],
      ],
      'The engine is scripts/publication/masterplan.mjs.')}
    ${h2('The reconciliation audit')}
    ${p('tests/masterplan.test.mjs asserts each of the following and fails the build if any is untrue: every cumulative figure equals the sum of its annual figures; the revenue allocation reconciles to net tuition with no residual; total cost equals the sum of its components in every year; the reserve schedule carries forward correctly year on year; the fee decomposition sums to exactly 100 per cent; modelled instruction spend agrees with the published teaching allocation; and every scenario is internally consistent.')}
    ${h2('What this document does not do')}
    ${p(`It does not claim accreditation, ranking, partnership or endorsement the College does not hold. It does not present any projection as a trading record. It does not name a person in an office they have not accepted. And it does not report a figure it cannot trace — which is why the two-cent rounding on the programme total appears in ${ref('academic')} rather than being quietly absorbed.`)}
    ${note(`Prepared as a planning instrument for the Board of Governors. Classification: Confidential — Institutional. Planning period ${PERIOD}. Edition One, Revision 0. All financial figures are projections computed from the stated assumptions and are not a record of trading.`)}
  </div>`);

  return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════════
const CSS = `
@page { size: A4; margin: 17mm 16mm 18mm 16mm; }
@page :first { margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: ${SERIF}; color: ${K.ink}; font-size: 9.6pt; line-height: 1.52;
  background: #fff; -webkit-font-smoothing: antialiased; }
.pb { break-after: page; }

/* ── Cover ──────────────────────────────────────────────────────── */
.cover { height: 297mm; width: 210mm; background: ${K.oxford}; color: ${K.ivory};
  display: flex; align-items: center; justify-content: center; position: relative; }
.cover::before { content: ''; position: absolute; inset: 11mm; border: 0.6pt solid rgba(199,162,74,.42); }
.cover::after { content: ''; position: absolute; inset: 12.4mm; border: 0.3pt solid rgba(199,162,74,.20); }
.cover__field { text-align: center; padding: 0 26mm; z-index: 1; }
.cover__mark { margin-bottom: 9mm; }
.cover__inst { font-size: 13pt; letter-spacing: .16em; text-transform: uppercase; margin: 0; color: ${K.ivory}; }
.cover__campus { font-size: 8.4pt; letter-spacing: .34em; text-transform: uppercase; margin: 2mm 0 0; color: ${K.gold}; }
.cover__rule { width: 34mm; height: .8pt; background: ${K.gold}; margin: 9mm auto; }
.cover__title { font-size: 31pt; line-height: 1.12; font-weight: 400; margin: 0; letter-spacing: -.005em; }
.cover__sub { font-size: 11.5pt; margin: 5mm 0 0; color: rgba(251,248,240,.76); font-style: italic; }
.cover__period { font-size: 15pt; letter-spacing: .22em; margin: 8mm 0 0; color: ${K.gold}; }
.cover__foot { position: absolute; left: 26mm; right: 26mm; bottom: 20mm; display: flex;
  justify-content: space-between; gap: 8mm; border-top: .5pt solid rgba(199,162,74,.34); padding-top: 4mm; }
.cf__l { font-family: ${SANS}; font-size: 6.4pt; letter-spacing: .18em; text-transform: uppercase;
  color: rgba(199,162,74,.86); margin: 0 0 1mm; }
.cf__v { font-family: ${SANS}; font-size: 7.6pt; margin: 0; color: rgba(251,248,240,.88); }

/* ── Section openers ────────────────────────────────────────────── */
.opener { break-before: page; padding: 6mm 0 7mm; border-bottom: .8pt solid ${K.navy}; margin-bottom: 7mm; }
.opener__rule { width: 18mm; height: 2pt; background: ${K.gold}; margin-bottom: 5mm; }
.opener__n { font-family: ${SANS}; font-size: 30pt; font-weight: 300; color: ${K.gold};
  margin: 0; line-height: 1; letter-spacing: -.02em; }
.opener__t { font-size: 22pt; font-weight: 400; margin: 2mm 0 0; color: ${K.navy}; line-height: 1.14; }
.opener__r { font-size: 10.4pt; font-style: italic; color: ${K.soft}; margin: 3mm 0 0; max-width: 132mm; }
.opener__stats { display: flex; gap: 14mm; margin-top: 6mm; }
.ostat__v { font-family: ${SANS}; font-size: 15pt; font-weight: 700; color: ${K.navy}; margin: 0; }
.ostat__l { font-family: ${SANS}; font-size: 6.6pt; letter-spacing: .14em; text-transform: uppercase;
  color: ${K.soft}; margin: 1mm 0 0; }

/* ── Body ───────────────────────────────────────────────────────── */
.body { max-width: 178mm; }
.lead { font-size: 11pt; line-height: 1.55; color: ${K.navy}; margin: 0 0 6mm;
  padding-left: 5mm; border-left: 1.6pt solid ${K.gold}; }
h2 { font-size: 12.5pt; font-weight: 600; color: ${K.navy}; margin: 7mm 0 2.5mm; letter-spacing: -.004em; break-after: avoid; }
h3 { font-size: 10.4pt; font-weight: 600; color: ${K.imperial}; margin: 5mm 0 2mm; break-after: avoid; }
p { orphans: 3; widows: 3; }
p { margin: 0 0 3.2mm; }
em { font-style: italic; }
strong { font-weight: 600; }
.note { font-size: 8.2pt; color: ${K.soft}; border-top: .4pt solid ${K.rule}; padding-top: 3mm; margin-top: 6mm; }

/* ── KPI cards ──────────────────────────────────────────────────── */
.kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin: 5mm 0 6mm; }
.kpi { background: ${K.panel}; border-top: 1.6pt solid ${K.navy}; padding: 3.4mm 3.6mm; }
.kpi__v { font-family: ${SANS}; font-size: 14pt; font-weight: 700; color: ${K.navy}; margin: 0; letter-spacing: -.01em; }
.kpi__l { font-family: ${SANS}; font-size: 6.6pt; letter-spacing: .13em; text-transform: uppercase;
  color: ${K.soft}; margin: 1.4mm 0 0; line-height: 1.35; }
.kpi__n { font-family: ${SANS}; font-size: 6.8pt; color: ${K.imperial}; margin: .8mm 0 0; font-style: italic; }

/* ── Figures ────────────────────────────────────────────────────── */
.fig { margin: 6mm 0; break-inside: avoid; }
.fig__cap { border-top: 1pt solid ${K.navy}; padding-top: 2mm; margin-bottom: 3mm; }
.fig__n { font-family: ${SANS}; font-size: 6.6pt; letter-spacing: .16em; text-transform: uppercase;
  color: ${K.gold}; display: block; }
.fig__t { font-size: 10.6pt; font-weight: 600; color: ${K.navy}; display: block; margin-top: .8mm; }
.fig__s { font-size: 8.4pt; color: ${K.soft}; display: block; margin-top: .6mm; font-style: italic; }
.fig__art { margin: 2mm 0; }
.fig__src { font-family: ${SANS}; font-size: 6.4pt; color: ${K.soft}; margin: 1.5mm 0 0;
  border-top: .3pt solid ${K.rule}; padding-top: 1.4mm; }

/* ── Tables ─────────────────────────────────────────────────────── */
/* A TABLE MAY BREAK; A ROW MAY NOT; A CHART NEVER DOES.
   break-inside:avoid on the whole table is the obvious setting and it
   is wrong for a financial exhibit: a twenty-row register that does not
   fit the remaining space jumps to the next page and leaves half a page
   of white behind it, which is the accident that tells a reader nobody
   looked at the document. The table continues instead, carrying its
   header with it, and the caption stays with the first part. */
.tbl { margin: 6mm 0; }
.tbl__cap { break-after: avoid; }
.ledger thead { display: table-header-group; }
.ledger tr { break-inside: avoid; }
.ledger tr.strong { break-before: avoid; }
.tbl__cap { border-top: 1pt solid ${K.navy}; padding-top: 2mm; margin-bottom: 2.4mm; break-after: avoid; }
.tbl__n { font-family: ${SANS}; font-size: 6.6pt; letter-spacing: .16em; text-transform: uppercase;
  color: ${K.gold}; display: block; }
.tbl__t { font-size: 10.6pt; font-weight: 600; color: ${K.navy}; display: block; margin-top: .8mm; }
.tbl__s { font-size: 8.4pt; color: ${K.soft}; display: block; margin-top: .6mm; font-style: italic; }
.tbl__src { font-family: ${SANS}; font-size: 6.4pt; color: ${K.soft}; margin: 1.5mm 0 0;
  border-top: .3pt solid ${K.rule}; padding-top: 1.4mm; }
.ledger { width: 100%; border-collapse: collapse; font-family: ${SANS}; font-size: 7.8pt; }
.ledger--compact { font-size: 6.6pt; }
.ledger th { background: ${K.navy}; color: #fff; font-weight: 600; text-align: left;
  padding: 2mm 2.2mm; font-size: 6.8pt; letter-spacing: .06em; text-transform: uppercase; vertical-align: bottom; }
.ledger--compact th { font-size: 6.2pt; padding: 1.6mm 1.6mm; }
.ledger td { padding: 1.8mm 2.2mm; border-bottom: .3pt solid ${K.rule}; vertical-align: top; }
.ledger--compact td { padding: 1.3mm 1.6mm; line-height: 1.32; }
.ledger .r { text-align: right; font-variant-numeric: tabular-nums; }
.ledger--compact .r { text-align: left; }
.ledger tbody tr:nth-child(even) td { background: ${K.ivory}; }
.ledger tr.strong td { background: ${K.panel} !important; font-weight: 700; color: ${K.navy};
  border-top: .8pt solid ${K.navy}; border-bottom: .8pt solid ${K.navy}; }
.yes { color: ${K.sage}; font-weight: 700; }
.no { color: ${K.crimson}; font-weight: 700; }

/* ── Chips ──────────────────────────────────────────────────────── */
.chip { display: inline-block; font-family: ${SANS}; font-size: 5.8pt; font-weight: 700;
  letter-spacing: .13em; text-transform: uppercase; color: #fff; background: var(--c);
  padding: .6mm 1.6mm; border-radius: 1mm; vertical-align: .4mm; white-space: nowrap; }

/* ── Phases ─────────────────────────────────────────────────────── */
.phase { display: grid; grid-template-columns: 16mm 1fr; gap: 5mm; padding: 3.6mm 0;
  border-bottom: .4pt solid ${K.rule}; break-inside: avoid; }
.phase__n { font-family: ${SERIF}; font-size: 19pt; color: ${K.gold}; line-height: 1; }
.phase__t { font-size: 11pt; font-weight: 600; color: ${K.navy}; margin: 0 0 1.4mm; }
.phase__y { font-family: ${SANS}; font-size: 7pt; letter-spacing: .12em; text-transform: uppercase;
  color: ${K.soft}; margin-left: 2mm; }
.phase__d { margin: 0 0 1.6mm; }
.phase__m { font-family: ${SANS}; font-size: 7.6pt; color: ${K.imperial}; margin: 0; font-weight: 600; }
`;

async function render() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>WEC-LC — Ten-Year Institutional Roadmap ${PERIOD}</title><style>${CSS}</style></head>
<body>${document()}</body></html>`;

  mkdirSync(A.OUT_DIR, { recursive: true });
  writeFileSync(A.OUT_HTML, html);

  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ executablePath: exe });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.pdf({
    path: A.OUT_PDF,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-family:${SANS};font-size:6pt;color:#8A93A3;width:100%;padding:0 16mm;display:flex;justify-content:space-between;">
      <span>WorldWide English College — London Campus</span><span>Ten-Year Institutional Roadmap ${PERIOD}</span></div>`,
    footerTemplate: `<div style="font-family:${SANS};font-size:6pt;color:#8A93A3;width:100%;padding:0 16mm;display:flex;justify-content:space-between;">
      <span>Confidential — Institutional. Planning estimates, not historical results.</span>
      <span class="pageNumber"></span></div>`,
    margin: { top: '17mm', bottom: '18mm', left: '16mm', right: '16mm' },
  });
  await browser.close();
  return html;
}

import { statSync } from 'node:fs';
render().then(() => {
  const kb = Math.round(statSync(A.OUT_PDF).size / 1024);
  console.log(`Wrote ${A.OUT_PDF.split('/').pop()} — ${kb} KB, ${FIGURES()} figures, ${TABLES()} tables`);
}).catch((e) => { console.error(e); process.exit(1); });
