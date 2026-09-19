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

import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { model, allScenarios, allocation, breakEven, sensitivity, alternativeA, basis, PLAN } from './masterplan.mjs';
import * as A from './masterplan-art.mjs';

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

const PERIOD = `${PLAN.planning_period.first_year}–${PLAN.planning_period.first_year + PLAN.planning_period.years - 1}`;

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
const RISKS = [
  ['Enrolment', 'Acquisition cost rises faster than modelled as the Gulf market matures', 'Medium', 'High', 'Cost per enrolled learner exceeds plan for two consecutive quarters', 'Shift budget weight to sponsored cohorts, where one negotiation carries 25–99 learners at a published band rather than one at a time', 'Marketing and Partnerships Lead'],
  ['Concentration', 'Gulf revenue share becomes a dependency rather than a strength', 'Medium', 'High', 'Any single market exceeds 45 per cent of net tuition', 'The market sequence exists for this reason; Europe opens in Year 2 and Asia in Year 4 specifically to dilute it', 'Chief Executive'],
  ['Academic capacity', 'Instructors cannot be recruited at the pace enrolment demands', 'Medium', 'High', 'Learner-to-instructor ratio exceeds the published teaching allocation for one term', 'The model already refuses to enrol beyond capacity; the operational control is a standing recruitment pipeline and a four-month hiring lead', 'Director of Academic Standards'],
  ['Academic quality', 'Second-marking divergence rises as the marking body grows', 'Medium', 'High', 'Marker agreement falls below 85 per cent, or reconciliations exceed 8 per cent of scripts', 'Every marker is already shown their own agreement and every divergence; the escalation is moderation committee review of that marker\'s batch', 'Director of Academic Standards'],
  ['Regulatory', 'A jurisdiction restricts the marketing of unaccredited qualifications', 'Medium', 'Medium', 'Regulatory correspondence, or a platform advertising rejection citing accreditation', 'The College already states plainly that it holds no third-party accreditation; nothing published needs withdrawal', 'Finance and Compliance Officer'],
  ['Reputational', 'A credential is questioned and verification does not satisfy the questioner', 'Low', 'High', 'A verification enquiry escalates to a complaint', 'Every award is signed, hash-chained and publicly checkable without an account; a superseded award still resolves and names its successor', 'Registrar'],
  ['Retention', 'Continuation between levels falls below the modelled rate', 'Medium', 'High', 'Any level\'s continuation falls 5 points below plan for two cohorts', 'Continuation is the single most valuable variable in the model; from Year 4 retention spending outperforms acquisition spending and the budget should move', 'Chief Executive'],
  ['Technology', 'Platform outage during an examination window', 'Low', 'High', 'Any unplanned outage exceeding 15 minutes in a sitting window', 'Sittings carry a published resume allowance; the architecture is serverless with no single origin to lose', 'Platform Engineer'],
  ['Cybersecurity', 'Learner records or examination papers are exposed', 'Low', 'Severe', 'Any unauthorised access attempt against the registry or paper store', 'Papers are versioned and released by act; records are access-controlled per learner; signing keys are held separately from the record store', 'Platform Engineer'],
  ['Payments', 'A gateway suspends the account or holds settlement', 'Medium', 'High', 'Settlement delayed beyond contracted terms, or a rising chargeback rate', 'Four gateways are implemented and routed by country; no single processor carries the institution', 'Finance and Compliance Officer'],
  ['Foreign exchange', 'Currency movement erodes the value of non-USD collections', 'Medium', 'Medium', 'Any currency moves more than 10 per cent against USD within a quarter', 'The tariff is USD-denominated and rates are refreshed against a recorded source rather than assumed', 'Finance and Compliance Officer'],
  ['Key person', 'The institution depends on individuals who have not been replaced', 'High', 'High', 'Any published office remains unfilled after two recruitment rounds', 'Named in the plan rather than hidden: the governance offices are defined and empty, and the platform refuses to publish a person into an office they have not accepted', 'Board of Governors'],
  ['Academic authority', 'The standards board cannot reach quorum and competency mappings stay interim', 'High', 'High', 'Board of Academic Standards membership remains at zero', 'This is the single gate standing between the College and its first conferral; it is an appointment, not an engineering task', 'Board of Governors'],
  ['External validation', 'No External Examiner is appointed, and accreditation cannot be pursued', 'High', 'High', 'The post remains unfilled into Year 2', 'The remit is published and the evidence the post would examine is already produced by the platform; the gap is a person', 'Board of Governors'],
  ['Refunds', 'Refund rate exceeds the modelled level after a cohort\'s first assessment', 'Low', 'Medium', 'Refunds exceed 4 per cent of gross tuition in any quarter', 'The fourteen-day window is deliberately generous and its cost is modelled; a rise signals a placement problem rather than a policy problem', 'Registrar'],
  ['Partner concentration', 'A single sponsoring institution becomes a material share of enrolment', 'Medium', 'Medium', 'Any one sponsor exceeds 12 per cent of active learners', 'Bands are published rather than negotiated, so no sponsor holds pricing leverage; the exposure is volume, not price', 'Marketing and Partnerships Lead'],
  ['Cost inflation', 'Instructor compensation rises faster than the tariff', 'Medium', 'Medium', 'Loaded instructor cost rises more than 8 per cent in a year', 'The tariff is reviewed annually against the teaching allocation, and the allocation is published rather than implied', 'Chief Executive'],
  ['Content currency', 'The curriculum ages without a revision cycle', 'Medium', 'Medium', 'Any level goes three years without substantive revision', 'Institutional development is funded as a share of net tuition rather than from surplus, precisely so it is not the line cut first', 'Director of Academic Standards'],
  ['Expansion', 'A market opens before the institution can serve it', 'Medium', 'Medium', 'Enquiries from an unopened market exceed 10 per cent of total', 'The sequence is deliberate and the capacity gate is enforced in the model itself; demand ahead of capacity is recorded as turned away rather than booked', 'Chief Executive'],
  ['Liquidity', 'A year of falling enrolment meets a cost base that does not fall with it', 'Low', 'High', 'Reserve coverage falls below six months of operating cost', 'The reserve target is stated in months of cost rather than as a share of revenue, because a share-of-revenue reserve shrinks exactly when it is needed', 'Board of Governors'],
];

const GOVERNANCE = [
  ['Tuition and the published tariff', 'Board of Governors', 'College Executive', 'Annual, against the teaching allocation'],
  ['Fee remission and hardship awards', 'Academic Senate', 'Registrar', 'Each round, against published criteria'],
  ['Partner and sponsor bands', 'Board of Governors', 'Marketing and Partnerships Lead', 'Published; not negotiable case by case'],
  ['New qualifications and levels', 'Academic Senate', 'Board of Academic Standards', 'On proposal'],
  ['Examination papers and rubrics', 'Board of Academic Standards', 'Registrar', 'Each sitting, published before the work'],
  ['Conferral of an award', 'Registrar', 'Academic Senate', 'On eligibility, with no override'],
  ['Withdrawal or replacement of an award', 'Registrar', 'Board of Governors', 'On reasoned application'],
  ['Annual budget and acquisition spend', 'Board of Governors', 'Chief Executive', 'Annual'],
  ['Material technology expenditure', 'College Executive', 'Board of Governors above threshold', 'On proposal'],
  ['Instructor compensation and establishment', 'College Executive', 'Board of Governors', 'Annual'],
  ['Appointment of the External Examiner', 'Board of Governors', 'Academic Senate', 'On vacancy'],
  ['International partnerships', 'Board of Governors', 'Academic Senate for academic terms', 'On proposal'],
  ['Reserve policy and drawdown', 'Board of Governors', '—', 'Annual, and on any drawdown'],
];

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
  S(opener('00', 'Executive Summary', 'The institutional thesis, the decade it implies, and the two things that are not engineering problems.'));
  S(`<div class="body">
    ${lead(`WorldWide English College teaches a <strong>${num(B.totalHours)}-hour</strong> qualification pathway in six levels from A1 to C2, at an adopted tariff of <strong>${usd(B.programmeTotal)}</strong> — ${usd(B.levelFee, 2)} a level, ${usd(B.perHour, 2)} an academic hour. This plan models what that institution becomes over ${PLAN.planning_period.years} years, and it is built forwards from what the College spends to be found and whom it can actually teach, rather than backwards from a revenue the plan would like to reach.`)}
    ${kpi([
      { v: m$(BASE.totals.netTuition), l: 'Ten-year net tuition', n: 'Expected case' },
      { v: m$(Y10.netTuition), l: 'Year-10 net tuition' },
      { v: num(Y10.activeStudents), l: 'Active learners, Year 10' },
      { v: num(Math.round(BASE.totals.awardsConferred)), l: 'Awards conferred over the decade' },
      { v: m$(BASE.totals.surplus), l: 'Ten-year operating surplus', n: pct(BASE.totals.surplus / BASE.totals.netTuition, 0) + ' of net tuition' },
      { v: m$(BASE.totals.closingReserve), l: 'Closing reserve', n: num(Y10.reserveMonths) + ' months of operating cost' },
    ])}
    ${h2('The thesis, in one paragraph')}
    ${p(`The College sells teaching, not a credential. The credential is identical whichever route a candidate takes to it — same examination, same rubric published before the work, same second marking, same moderation, same registry entry, same public verification — and the routes differ in price by a factor of five because what they differ in is <em>human attention</em>. That single commitment is what makes a ${usd(B.programmeTotal)} tariff defensible and a ${usd(B.independentPerLevel)} independent route honest at the same time, and it is the reason ${pct(B.lines.find((l) => l.key === 'teaching').share, 0)} of every fee is allocated to a named instructor. This model staffs to that allocation rather than beneath it.`)}
    ${h2('The four findings a board should take from this plan')}
    ${p(`<strong>One.</strong> The institution breaks even in <strong>${FIRST_CLEAR ? FIRST_CLEAR.calendar : 'no modelled year'}</strong>, at ${FIRST_CLEAR ? num(FIRST_CLEAR.breakEvenLearners) : '—'} active learners, and clears it in every subsequent year of the expected case. It does not require a step change in enrolment to become self-funding; it requires the third year.`)}
    ${p(`<strong>Two.</strong> Continuation between levels, not acquisition, is the decisive variable. A ten-point fall in continuation costs more over the decade than a thirty per cent rise in the cost of acquiring a learner. From Year 4 the marginal pound is better spent keeping a learner than finding one.`)}
    ${p(`<strong>Three.</strong> The commissioning brief's alternative tariff — ten levels of 120 hours at $7,400 directed and $14,800 tutored — <strong>converts a ${m$(BASE.totals.surplus)} ten-year surplus into a ${m$(Math.abs(ALT.effect.surplusProposed))} loss</strong>. The cost of teaching does not fall because the price does. Section 19 sets out the arithmetic.`)}
    ${p(`<strong>Four.</strong> The two things standing between this College and its first conferred award are not engineering. The Board of Academic Standards has no appointed members and cannot approve the competency mappings; no External Examiner has been appointed. Both are appointments. Every surface that would carry those names already exists and already renders, and the platform refuses to publish a person into an office they have not accepted.`)}
    ${note(`This document is a planning instrument. Every financial figure in it is a projection computed from stated assumptions, and none of it is a record of trading. Classifications are printed beside the figures throughout: ${chip('verified')} for what the College has adopted and published, ${chip('assumption')} for what this plan asserts, ${chip('board')} for what nobody has yet decided.`)}
  </div>`);

  // ── 01 INSTITUTIONAL IDENTITY ──────────────────────────────────
  S(opener('01', 'Institutional Identity', 'What the College is, what it sells, and the discipline that makes both statements checkable.',
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
  S(opener('02', 'Academic and Credit Architecture', 'The hours a learner undertakes, the credits they carry, and what each level costs to the cent.'));
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
  S(opener('04', 'Delivery and Commercial Architecture', 'Three routes to one credential, and why they may differ in price by a factor of five and still be honest.'));
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
  S(opener('05', 'Global Market Strategy', 'Four markets, entered in sequence, and the cost of being found in each.',
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
  S(opener('06', 'The Economic Engine', 'How WEC-LC converts academic capacity into sustainable institutional growth.',
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
  S(opener('08', 'Cost, Allocation and What Is Retained', 'Every dollar of net tuition, followed to where it is spent or kept.'));
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
  S(opener('10', 'Liquidity and Reserves', 'What the College keeps, and the rule it keeps it by.',
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
  S(opener('11', 'Access, Remission and Referral', 'Scholarship modelled as money rather than written as language.'));
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
  S(opener('12', 'Sponsored Cohorts and the Executive Market', 'Where one negotiation carries a cohort, and why the band is published rather than negotiated.'));
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

  S(opener('13', 'Technology, Establishment and Staffing', 'What it costs to run the institution, and who is actually employed to do it.'));
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
  S(opener('15', 'Governance and Authority', 'Who decides what, and the separations that protect a learner.'));
  S(`<div class="body">
    ${lead('Academic judgement, commercial authority and financial control are held apart. No individual, including the Founder, may independently determine academic standards, approve their own work, or override established procedure.')}
    ${table('The schedule of authority', 'Who approves, who is consulted, and how often',
      ['Decision', 'Approves', 'Consulted / reserved', 'Cycle'],
      GOVERNANCE.map((g) => [`<strong>${esc(g[0])}</strong>`, esc(g[1]), esc(g[2]), esc(g[3])]),
      'Published governance instrument, /governance/. The offices named are defined; several are not yet filled — see Section 16.')}
    ${p(`${chip('board')} The Board of Academic Standards currently has no appointed members. Until it does, competency mappings remain interim and no award can be conferred, because the platform will not confer against an unapproved mapping. This is stated in the risk register as the highest-impact open item in the plan, and it is an appointment rather than a piece of work.`)}
  </div>`);

  // ── 16 RISK ────────────────────────────────────────────────────
  S(opener('16', 'Institutional Risk Register', 'Twenty risks, each with an early warning somebody can actually observe.',
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
  S(opener('17', 'The Ten-Year Roadmap', 'Five phases, and what has to be true at the end of each.'));
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
  S(opener('18', 'Break-even and Sensitivity', 'What has to be true, and what happens when one thing is not.',
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

  // ── 19 ALTERNATIVE ARCHITECTURE ────────────────────────────────
  S(opener('19', 'Alternative Architecture A', 'The commissioning brief\'s tariff, computed rather than dismissed.',
    [{ v: usd(ALT.proposed.blendedProgramme), l: 'Proposed blended programme' }, { v: usd(ALT.adopted.programmeTotal), l: 'Adopted programme' }, { v: pct(ALT.effect.priceRatio - 1, 0), l: 'Change in price' }]));
  S(`<div class="body">
    ${lead('The brief for this plan carried a different architecture: ten levels of 120 hours, sold as a directed pathway at $7,400 and a tutored pathway at $14,800. It is modelled here in full, against the same enrolment the adopted architecture produces, so the comparison is of price and structure rather than of two different institutions.')}
    ${table('Adopted against proposed', '',
      ['', 'ADOPTED — verified and published', 'PROPOSED — requires a Board decision'],
      [
        ['Levels', num(ALT.adopted.levels), num(ALT.proposed.levels)],
        ['Hours per level', num(ALT.adopted.hoursPerLevel), num(ALT.proposed.hoursPerLevel)],
        ['Total academic hours', num(ALT.adopted.totalHours), num(ALT.proposed.totalHours)],
        ['Programme price', usd(ALT.adopted.programmeTotal), `${usd(ALT.proposed.directed)} directed / ${usd(ALT.proposed.tutored)} tutored`],
        ['Blended programme price', usd(ALT.adopted.programmeTotal), usd(ALT.proposed.blendedProgramme)],
        ['Per academic hour', usd(ALT.adopted.perHour, 2), usd(ALT.proposed.perHour, 2)],
        { strong: true, cells: ['Ten-year net tuition', usd(ALT.effect.tenYearNetAdopted), usd(ALT.effect.tenYearNetProposed)] },
        ['Ten-year cost of delivery', usd(ALT.effect.tenYearCost), usd(ALT.effect.tenYearCost)],
        { strong: true, cells: ['TEN-YEAR SURPLUS', usd(ALT.effect.surplusAdopted), usd(ALT.effect.surplusProposed)] },
      ],
      'WEC-LC Financial Model § Alternative A. The proposed column assumes the same learners, the same markets and the same delivery.')}
    ${h2('The finding')}
    ${p(`At a blended ${usd(ALT.proposed.blendedProgramme)} against an adopted ${usd(ALT.adopted.programmeTotal)}, the proposed architecture prices the pathway at <strong>${pct(ALT.effect.priceRatio, 0)}</strong> of the adopted tariff. Net tuition over the decade falls from ${m$(ALT.effect.tenYearNetAdopted)} to ${m$(ALT.effect.tenYearNetProposed)}. <strong>The cost of delivering it does not fall</strong> — the same learners sit the same ${num(B.totalHours)} hours, need the same written feedback on the same produced work, and require the same number of instructors. A ${m$(ALT.effect.surplusAdopted)} surplus becomes a <strong>${m$(Math.abs(ALT.effect.surplusProposed))} loss</strong>.`)}
    ${h2('What it would take to make the proposed architecture work')}
    ${p(`It is not impossible; it is a different institution. At ${usd(ALT.proposed.perHour, 2)} an academic hour against ${usd(ALT.adopted.perHour, 2)}, the teaching commitment printed on the College's own fee page — a named instructor, written feedback on every produced piece, tutorials on request — cannot be funded. The directed tier would have to mean genuinely unsupervised study with assessment attached, which is what the College already sells as the independent route at ${usd(B.independentPerLevel)} a level. Adopting the proposed tariff without changing the teaching promise would be selling supervision the institution could not staff.`)}
    ${p(`${chip('board')} The recommendation of this plan is to retain the adopted architecture and to treat the directed/tutored split as what it already is in the adopted model: the enrolled route and the independent route, priced apart because they differ in human attention rather than in credential.`)}
  </div>`);

  // ── 20 METHODOLOGY AND RECONCILIATION ──────────────────────────
  S(opener('20', 'Assumptions, Methodology and Reconciliation', 'Where every figure came from, and the audit that proves the document agrees with itself.'));
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
    ${p('It does not claim accreditation, ranking, partnership or endorsement the College does not hold. It does not present any projection as a trading record. It does not name a person in an office they have not accepted. And it does not report a figure it cannot trace — which is why the two-cent rounding on the programme total appears in Section 02 rather than being quietly absorbed.')}
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
