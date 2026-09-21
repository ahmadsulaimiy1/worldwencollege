/**
 * THE MONOGRAPH — composed in spreads.
 *
 * Content comes from the same engine as everything else. This file
 * decides only what faces what, and it builds the book two pages at a
 * time because that is how a book is read.
 *
 * THE TEMPO. A publication of one density is a document. This one
 * alternates deliberately: a plate against an argument, a figure
 * against its reading, a schedule against the drawing that explains it.
 * If two consecutive spreads have the same shape, one of them is wrong.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import path from 'node:path';
import * as M from './monograph.mjs';
import * as S from './spreads.mjs';
import * as F from './figures.mjs';
import * as O from './openers.mjs';
import { PLAN, basis } from './masterplan.mjs';
import * as PR from './pricing.mjs';
import * as AL from './allocation.mjs';
import * as PF from './portfolio.mjs';
import { scenarios as priceScenarios, architectures } from './projection.mjs';
import { RISKS, GOVERNANCE, GOVERNANCE_COLUMNS, PHASES } from './plan-narrative.mjs';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'publication');
const FACES = readFileSync(path.join(ROOT, 'assets/fonts/monograph-faces.css'), 'utf8');

const B = basis();
const ARCH = architectures();
const PSC = priceScenarios();
const CORE = PSC.core;
const CY10 = CORE.years[CORE.years.length - 1];
/* THE CONSTITUTION AS THE COMMITTED TARIFF ACTUALLY SATISFIES IT.
   `achievedProposed()` tests the SUPERSEDED tariff at one global
   price; the plate on the Financial Constitution opener would then
   have been drawn from a tariff the book does not publish. This is the
   committed tariff, tested on what four regions and six payers
   actually collect. */
const GOT = PF.STANDING();
/* THE COMMITTED REFERENCE TARIFF, mapped onto the delivery
   specifications the cost and demand engine is keyed by. One tariff,
   two vocabularies: the portfolio speaks of pathways because that is
   what a learner chooses, and the engine speaks of specifications
   because that is what the College has to staff. */
const T = PF.REFERENCE_TARIFF;
const P_ = {
  independent: T.independent, directed: T.guided, tutored: T.tutored,
  execCore: T.executiveCohort, execPremium: T.executivePrivate, execBespoke: T.bespoke,
};
const PA = PLAN.proposed_architecture;
const EV = JSON.parse(readFileSync(path.join(ROOT, 'data/market-evidence.json'), 'utf8'));
const PERIOD = `${PLAN.planning_period.first_year}–${PLAN.planning_period.first_year + PLAN.planning_period.years - 1}`;

const usd = (n, d = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const m$ = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(n / 1e6).toFixed(1) + 'M';
const num = (n) => Number(Math.round(n)).toLocaleString('en-US');
const pct = (x, d = 0) => (x * 100).toFixed(d) + '%';

const SEG_LABEL = { payroll: 'Payroll', technology: 'Technology', opex: 'Operating',
  marketing: 'Marketing', reserve: 'Reserve', strategic: 'Strategic' };
const BC_OBS = EV.gcc.observations[0];
const BC_ATTN = BC_OBS.price_usd / (BC_OBS.hours / 12);
const COACHING = { from: 200, to: 600, label: 'Executive coaching, one to one' };

/* Declared beside the figures because the plate strips quote it, and a
   constant that two parts of the book depend on belongs above both. */
const EVSEG = [['gcc', 'Saudi Arabia and the Gulf'], ['west_africa', 'Nigeria and West Africa'],
  ['uk_europe', 'United Kingdom and Europe'], ['executive_and_corporate', 'Executive and corporate']];

const DESCRIPTOR = {
  independent: 'Examination, moderation and the award. No teaching.',
  directed: 'Seminar teaching in a group of fourteen, with marked work.',
  tutored: 'A named instructor, individual tutorials, every piece marked.',
  execCore: 'A cohort of six, scheduled around professional obligations.',
  execPremium: 'One to one throughout, with a named academic adviser.',
  execBespoke: 'One to one, on material authored to the holder’s own field.',
};

/**
 * A TABLE WITH ITS READING.
 *
 * Six schedules in the first proof occupied the top third of a page and
 * left the rest white — measured, between 26 and 58 per cent of the
 * field. That is not restraint; it is a page nobody finished. The
 * reading sits at the foot under a struck rule and says what the table
 * is for, which is work the document needed anyway.
 */
const tableWithReading = (spec, reading, opts = {}) => M.page(
  `<div>${M.table(spec)}</div>
   <div class="rd${reading.columns ? ' rd--col' : ''}">
     <h4>${M.esc(reading.title)}</h4>
     ${reading.body}
   </div>`, { ...opts, stack: true });

let P = [];
let PAGES_OF = {};
/* The cover states the extent of the book, which the book only knows
   once it is built — so the first pass counts and the second prints.
   Checked after the final pass rather than trusted: a cover that
   claims a different number of leaves from the number it has is
   exactly the kind of small lie this publication is built not to
   tell. */
let LEAVES = 0;
const push = (...pp) => pp.forEach((x) => P.push(x));
let NEXT_PART = '';
/** Throw the next spread onto a recto. Where a leaf is needed it
 *  carries the part's bastard title rather than nothing at all. */
const onRecto = (name) => { if (!M.nextIsRecto()) P.push(M.halfTitle(name || NEXT_PART)); };
const at = (k) => { PAGES_OF[k] = M.folioNow() + 1; };

// ── The figures, computed once ───────────────────────────────────────
const figAllocation = () => F.capitalArchitecture(GOT.lines, { labels: SEG_LABEL });
const figThreshold = () => F.attentionThreshold(
  Object.keys(PR.PRODUCTS).map((k) => ({
    name: PR.PRODUCTS[k].name, perHour: P_[k] / PR.attentionHours(k), ownBand: k.startsWith('exec'),
  })), BC_ATTN, { benchmarkLabel: 'British Council Saudi', band: COACHING });
const figSlope = () => F.slope(PR.SEGMENTS.filter((s) => s.wtpAssumed).map((s) => ({
  name: s.short, from: s.wtpAssumed, to: s.wtpFull })));
const figDecade = () => F.decade(CORE.years);
const figAmort = () => F.amortisation(
  [{ name: 'Gulf executive', cac: PR.CAC.gccExec }, { name: 'Gulf professional', cac: PR.CAC.gccProf },
    { name: 'UK and Europe', cac: PR.CAC.ukeu }],
  Object.keys(PR.CHANNELS).map((k) => {
    const t = PR.channelTerms(k, P_);
    return { name: t.short, cac: t.cacPerSeat,
      note: `${t.agreements.toFixed(0)} agreements × ${t.seatsPerAgreement.toFixed(0)} seats` };
  }));
const figRisk = () => F.riskMatrix(RISKS);

/* ── RESILIENCE, WHICH THE PLAN COMPUTED AND NEVER PUBLISHED ─────────
   The reserve policy is stated in MONTHS OF OPERATING COST, so the
   target is not a number — it climbs with the cost of running the
   institution, and a year in which cost rises raises the bar the
   reserve has to clear. That is the policy's whole point: the thing a
   reserve survives is a year when revenue falls and cost does not. */
const RESERVE_POLICY = PLAN.reserve;
const reserveYears = () => CORE.years.map((y) => ({
  calendar: y.calendar,
  reserve: y.reserve,
  target: (y.delivery + y.acquisition + y.fixed + y.development)
    * (RESERVE_POLICY.target_months_of_operating_cost / 12),
}));
const figReserve = () => F.reserveAgainstTarget(reserveYears(), {
  targetLabel: `${RESERVE_POLICY.target_months_of_operating_cost} months of operating cost`,
});
const figCapacity = () => F.capacityLoad(CORE.years);
const RESERVE_MET = reserveYears().find((y) => y.reserve >= y.target);
const TURNED_AWAY = CORE.years.reduce((t, y) => t + y.turnedAwayByCapacity, 0);

/* ── THE SEVEN CHAPTER DATUMS ────────────────────────────────────────
   Each chapter opens on a drawing made of its own content. Nothing
   below is chosen for how it looks; every one of them is a quantity
   the book computes somewhere else, so if a figure moves the opener
   moves with it. */
const LEARNERS = CORE.years.reduce((t, y) => {
  for (const [k, v] of Object.entries(y.byProduct || {})) t[k] = (t[k] || 0) + v;
  return t;
}, {});
const CHANNEL_KEYS = Object.keys(PR.CHANNELS);
const TOTAL_LEARNERS = Object.values(LEARNERS).reduce((a, b) => a + b, 0);
const THROUGH_CHANNELS = CHANNEL_KEYS.reduce((t, k) => t + (LEARNERS[k] || 0), 0);
const RETAIL_SHARE = (TOTAL_LEARNERS - THROUGH_CHANNELS) / TOTAL_LEARNERS;

const datAscent = () => O.ascent(PR.QUALIFICATIONS, B.hoursPerLevel, 'onIvory');
const datReach = () => O.reach(PR.SEGMENTS.map((sg) => ({
  name: sg.short, reachable: sg.reachable, researched: Boolean(sg.evidence) })), 'onPearl');
const datColonnade = () => O.colonnade(Object.keys(P_).map((k) => ({
  short: PR.PRODUCTS[k].name.replace('Executive ', 'Exec '), price: P_[k],
  money: usd(P_[k]), entry: k === 'independent' })), 'onCeremonial');
const datCourse = () => O.course(GOT.lines.map((l) => ({
  name: SEG_LABEL[l.key], share: l.target, retained: AL.RETAINED.includes(l.key) })), 'onDeep');
const TURN = Math.max(0, CORE.years.findIndex((y) => y.cumulativeSurplus > 0));
/* The year each scenario crosses nil, read from the model rather than
   asserted in prose. An earlier draft stated flatly that the
   Conservative case never reaches cumulative surplus inside the
   decade; pricing the projection by region moved every one of these,
   and a sentence that is true of one run of a model is not a fact
   about an institution. */
const CROSSES = Object.fromEntries(['conservative', 'core', 'growth'].map((k) => {
  const y = PSC[k].years.find((v) => v.cumulativeSurplus > 0);
  return [k, y ? String(y.calendar) : 'not inside the decade'];
}));
const datDecade = () => O.decadeRule(CORE.years.map((y, i) => ({
  calendar: y.calendar, height: Math.max(0, y.netTuition),
  note: i === 0 ? `${num(y.newLearners)} admitted` : `${m$(y.netTuition)} net tuition` })), TURN, 'onCream');
const datPassage = () => O.passage([
  { name: 'Enquiry' },
  { name: 'Admission', note: 'Placed at the level that matches' },
  { name: 'Orientation' },
  { name: 'Study', note: 'On the chosen pathway' },
  { name: 'Assessment', note: 'Throughout the level' },
  { name: 'Examination', note: 'Against a published rubric', confers: true },
  { name: 'Award', note: 'Entered in the registry', confers: true },
  { name: 'Progression' },
], 'onPearl');

/* THE CHAIN OF AUTHORITY, read off the College's own governance
   schedule rather than drawn as an organogram somebody liked. The
   struck tier is the Board of Academic Standards, because it is the
   one whose decisions on examination papers and rubrics no commercial
   authority in the institution may overturn — and that separation is
   the reason a WEC-LC award means anything at all. */
const datAuthority = () => O.authority([
  { name: 'Board of Governors', holds: 'Tariff, budget, partnerships, reserve policy', struck: false },
  { name: 'Academic Senate', holds: 'Qualifications, levels, remission', struck: false },
  { name: 'Board of Academic Standards', holds: 'Examination papers and rubrics', struck: true },
  { name: 'The Registrar', holds: 'Conferral, withdrawal, the register', struck: false },
  { name: 'College Executive', holds: 'Establishment, technology, operations', struck: false },
], 'onIvory');

const datCharter = () => O.charter(CHARTER.map((c) => c.t), 'onDeep');

/* ════════════════════════════════════════════════════════════════════
   THE CHARTER
   ════════════════════════════════════════════════════════════════════
   Ten principles, and the reason the closing part of the book is a
   charter rather than a request for approvals. A plan that ends by
   asking the Board what to decide has told the reader that nobody has
   thought it through. A plan that ends by stating the principles on
   which it was built, and inviting the Board to establish them, has
   done the thinking and is asking for the authority to be settled.

   The invitation is real and it is not fiction: the Board has not
   established these, and the document says "is invited to" throughout
   rather than claiming a resolution that has not happened. */
const CHARTER = [
  { t: 'One academic standard',
    v: 'The examination, the rubric, the independent second marking, the moderation, the registry entry and the award are identical on every route, in every market and through every channel.' },
  { t: 'Multiple legitimate routes of access',
    v: 'A learner’s circumstances determine how they are taught. They do not determine what their qualification is worth, and the College will not construct a route that implies otherwise.' },
  { t: 'Academic standards are protected irrespective of commercial route',
    v: 'No sponsor, employer, partner or fee level alters an assessment decision. A commercial relationship that required it would be declined.' },
  { t: 'Conferral is never one person’s decision',
    v: 'A named marker marks, a second marker marks independently, and the cohort is moderated before any result is released. No single person can confer a WEC-LC level.' },
  { t: 'The record outlives the relationship',
    v: 'Every conferral is entered in the registry on the day it is made and remains publicly verifiable, without an account, for as long as the College exists.' },
  { t: 'Tuition reflects the complete educational service',
    v: `Tuition funds the whole institutional provision — ${PF.VALUE_ARCHITECTURE.length} components, of which live teaching is one — and the College will describe it that way to the people who pay it.` },
  { t: 'Teaching hours are not the measure of value',
    v: 'Hours are published because the College publishes what it staffs. They are not the product, and the College will not price or market itself by the hour.' },
  { t: 'Institutional quality is funded before anything discretionary',
    v: 'Academic delivery, assessment, quality assurance and the registry are funded first. Discretionary allocation is what remains after the institution has been paid for, not before.' },
  { t: 'Financial resilience is a standing obligation',
    v: `${pct(AL.SHARES.reserve, 0)} of collected revenue is retained as institutional capital as a permanent condition of operating, and is not available as income.` },
  { t: 'Institutional partnerships are a core channel, not an addition',
    v: 'Employers, universities, ministries and foundations are how the College reaches learners a retail tariff never will, and the architecture is built for them rather than extended to them.' },
];

function build() {
  P = [];
  M.resetFolios();
  /* RESET, because build() runs twice to resolve the contents folios
     and a module-level variable survives between passes. */
  NEXT_PART = 'The Ten-Year Institutional Master Plan';

  // ══ COVER ═════════════════════════════════════════════════════════
  P.push(`<section class="pg pal pal--sovereign m-cover">
    <div class="m-cover__head"><span>WorldWide English College</span><span>London Campus</span></div>
    <div class="m-cover__title">
      <h1 class="foil">The Ten-Year<br>Institutional<br>Master Plan</h1>
      <p class="sub">The academic, commercial and financial architecture of the College, ${PERIOD}.</p>
    </div>
    <div class="m-cover__period">${O.coverRule(PLAN.planning_period.first_year,
    PLAN.planning_period.first_year + PLAN.planning_period.years - 1, PLAN.planning_period.years, 'onDeep')}</div>
    <div class="m-cover__spec">
      <div><k>Parts</k><v>Eight</v></div>
      <div><k>Leaves</k><v>${LEAVES || '—'}</v></div>
      <div><k>Pathway</k><v>A1 to C2 &middot; ${num(B.totalHours)} hours</v></div>
      <div><k>Classification</k><v>Planning instrument</v></div>
    </div>
  </section>`);
  M.countUnfoliated();

  // ══ FRONTISPIECE: the specification against the thesis ════════════
  push(...S.spread(
    S.specPage({
      title: 'The institution, specified',
      rows: [
        { k: 'What it teaches', v: 'A complete A1 to C2 qualification pathway in six levels.' },
        { k: 'Academic hours', v: `${num(B.totalHours)} &middot; ${num(B.hoursPerLevel)} a level` },
        { k: 'Credits', v: `${num(B.totalCredits)} &middot; ${B.creditsPerLevel} a level` },
        { k: 'The award', v: 'Six qualifications, one conferred at each level. A learner who stops after two holds two.' },
        { k: 'Examination', v: 'Set against a rubric published before the work, marked by a named person, marked a second time independently, and moderated across the cohort.' },
        { k: 'Registry', v: 'Every conferral entered the same day and checkable by a stranger, without an account, for as long as the College exists.' },
        { k: 'Routes of access', v: `${Object.keys(PF.PATHWAYS).length} pathways and ${PF.PAYER_KEYS.length - 1} kinds of payer, across ${PF.REGION_KEYS.length} regions. One academic standard on every one of them.` },
        { k: 'Campus', v: 'London.' },
        { k: 'This plan', v: `The decade ${PERIOD}, prepared for the Board.` },
        { k: 'What is not held', v: '<em>No accreditation, ranking, institutional partnership or external endorsement. No completed cohort. No External Examiner has confirmed the standard.</em>' },
        { k: 'Every figure', v: 'Computed from the College’s own records and stated assumptions, and reconciled on every issue of this document.', struck: true },
      ],
      tone: 'pal pal--luminous',
    }),
    S.statementPage({
      palette: 'authority',
      eyebrow: 'The institutional thesis',
      statement: 'The College does not sell teaching hours. It admits a learner, teaches them, examines them against a published standard, confers a qualification and keeps the record of it <em>permanently</em>.',
      sub: 'An hour of instruction is a commodity with a thousand suppliers. A qualification that a stranger can verify, conferred against a rubric published before the work began, is not.',
      foot: [
        { k: 'Pathways', v: 'Five' },
        { k: 'Academic standard', v: 'One' },
        { k: 'Components of tuition', v: String(PF.VALUE_ARCHITECTURE.length) },
      ],
    })
  ));

  // ══ CONTENTS ══════════════════════════════════════════════════════
  /* A FACING SPREAD, because nine parts and an appendix will not fit
     one leaf and a contents that runs over is the first thing a reader
     sees the book fail at. Verso and recto, read across. */
  const TOC = [

      { part: 'I · The Institution', rows: [
        { t: 'What the College is, and what it holds', f: PAGES_OF.identity || 0 },
        { t: 'The six qualifications', f: PAGES_OF.academic || 0 },
        { t: 'One standard, many ways to reach it', f: PAGES_OF.standard || 0 }] },
      { part: 'II · The Educational Experience', rows: [
        { t: 'The passage of a learner', f: PAGES_OF.passage || 0 },
        { t: 'What the tuition provides', f: PAGES_OF.teaching || 0 },
        { t: 'Assessment, examination and the award', f: PAGES_OF.assessment || 0 }] },
      { part: 'III · The Commercial Architecture', rows: [
        { t: 'The five pathways', f: PAGES_OF.pathways || 0 },
        { t: 'What the investment buys, and how it is paid', f: PAGES_OF.value || 0 },
        { t: 'Who buys, and why it matters', f: PAGES_OF.payers || 0 }] },
      { part: 'IV · The Global Market', rows: [
        { t: 'The regional architecture', f: PAGES_OF.regional || 0 },
        { t: 'What the research did to the plan', f: PAGES_OF.slope || 0 },
        { t: 'What comparable providers charge', f: PAGES_OF.evidence || 0 },
        { t: 'Where the evidence does not exist', f: PAGES_OF.gaps || 0 }] },
      { part: 'V · The Financial Constitution', rows: [
        { t: 'Where every dollar is governed', f: PAGES_OF.alloc || 0 },
        { t: 'What each line is, and is not', f: PAGES_OF.definitions || 0 },
        { t: 'The decade', f: PAGES_OF.decade || 0 },
        { t: 'Three scenarios', f: PAGES_OF.scenarios || 0 }] },
      { part: 'VI · The Ten-Year Strategy', rows: [
        { t: 'Five phases', f: PAGES_OF.phases || 0 },
        { t: 'The order the markets open in', f: PAGES_OF.sequence || 0 },
        { t: 'What the College measures', f: PAGES_OF.measures || 0 }] },
      { part: 'VII · Governance and Resilience', rows: [
        { t: 'Where a decision stops', f: PAGES_OF.gov || 0 },
        { t: 'The institutional risk register', f: PAGES_OF.risks || 0 },
        { t: 'The response, and who owns it', f: PAGES_OF.response || 0 },
        { t: 'Resilience and financial governance', f: PAGES_OF.resilience || 0 }] },
      { part: 'VIII · The Board Charter', rows: [
        { t: 'The principles the College is asked to establish', f: PAGES_OF.charter || 0 }] },
      { part: 'Appendices', rows: [
        { t: 'A · The market evidence register', f: PAGES_OF.appEvidence || 0 },
        { t: 'B · Method, sources and reconciliation', f: PAGES_OF.appMethod || 0 },
        { t: 'C · How the tariff is derived', f: PAGES_OF.appPricing || 0 },
        { t: 'D · The ten-year schedules', f: PAGES_OF.appSchedules || 0 }] },
  ];
  /* A CONTENTS ENTRY THAT RESOLVES TO NOTHING PRINTS "00", and prints
     it quietly. It happened on the second pass here — a row pointing
     at a marker the restructure had renamed — and the only sign was
     two zeros in a column of real folios. The build fails on it now. */
  if (LEAVES) {
    const empty = TOC.flatMap((g) => g.rows.filter((r) => !r.f).map((r) => r.t));
    if (empty.length) throw new Error(`contents rows point at no page: ${empty.join('; ')}`);
  }
  push(...S.spread(
    M.contents({ title: 'Contents', parts: TOC.slice(0, 4) }),
    M.contents({ title: '', parts: TOC.slice(4) })
  ));

  // ════════════════════════════════════════════════════════════════
  // PART I — THE INSTITUTION
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'The Institution';
  onRecto();
  at('identity');
  push(...S.spread(
    S.openerPage({ palette: 'heritage', part: 'Part One', roman: 'I', title: 'The Institution',
      standing: M.mark('verified'),
      say: 'What the College is, what it teaches, and the discipline that makes both statements checkable.',
      datum: datAscent(),
      caption: `Six levels of ${num(B.hoursPerLevel)} academic hours, each conferring its own qualification, climbing from A1 to C2.`,
      contains: [{ t: 'What the College is, and what it holds', f: PAGES_OF.identity || '' },
        { t: 'The six qualifications', f: PAGES_OF.academic || '' },
        { t: 'One standard, many ways to reach it', f: PAGES_OF.standard || '' }] }),
    S.marginPage({
      runhead: 'The Institution',
      tone: 'pal pal--heritage',
      side: S.marginNote('The pathway',
        `${num(B.totalHours)} academic hours &middot; ${B.levels} levels &middot; ${B.totalCredits} credits &middot; A1 to C2`)
        + S.marginNote('What is not claimed',
          'No accreditation, no ranking, no institutional partnership, no external endorsement. No completed cohort.'),
      main: `
        <p class="op__num">The College</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>WorldWide English College is an independent international College, based in London, teaching a ${num(B.totalHours)}-hour qualification pathway in six levels from A1 to C2.</p>
          <p>It is built as an institution rather than as a collection of language classes. Its curriculum is authored and maintained in house. Its examinations are set against rubrics published before the work begins, marked by a named person, marked a second time independently, and moderated across the cohort. Its conferrals are entered in a registry on the day they are made, and any stranger may verify one without an account.</p>
          <h3>What the College holds</h3>
          <p>A complete six-level curriculum. An examination architecture with second marking and moderation. A published fee decomposition accounting for every cent of a fee. A conferral and verification chain. And fourteen typeset volumes of its own curriculum and assessment work, free to anyone, enrolled or not.</p>
          <h3>The discipline</h3>
          <p>The College states what it holds and is silent about what it does not. Where a reader asks directly, it answers plainly. Every figure in this publication is computed from the College’s own records and its stated assumptions, and is reconciled on every issue of the document.</p>
        </div>`,
    })
  ));

  at('academic');
  push(...S.spread(
    M.page(`
      <p class="fg__eye">The academic architecture</p>
      <h2 class="fg__t">Six gates, and what passes each</h2>
      <p class="fg__s">The College&rsquo;s own plate, drawn in engraved line.</p>
      <div class="engr engr--ink" style="margin-top:6mm">${S.engraving('the-six-gates')}</div>
      <div class="rd" style="margin-top:9mm">
        <h4>What a gate is</h4>
        <p>Each level ends at an examination set against a rubric published before the work begins, marked by a named person, marked a second time independently, and moderated across the cohort. Nothing passes on attendance, and nothing passes on a tutor&rsquo;s recommendation alone.</p>
        <p>A candidate who does not pass sits again; one re-sit is included and there is no re-sit fee on any route. A candidate who passes is entered in the registry the same day, and the entry can be checked by anyone, without an account, for as long as the College exists.</p>
      </div>`,
    { runhead: 'The Institution', stack: true, tone: 'pal pal--heritage' }),
    tableWithReading({
      title: 'The six qualifications',
      sub: `${B.levels} levels of ${num(B.hoursPerLevel)} academic hours and ${B.creditsPerLevel} credits each.`,
      head: ['Code', 'CEFR', 'Qualification', 'Hours', 'Credits'],
      rows: PR.QUALIFICATIONS.map((q) => [`<b>${M.esc(q.code)}</b>`, M.esc(q.cefr),
        { v: M.esc(q.name), cls: 'unit' }, num(B.hoursPerLevel), num(B.creditsPerLevel)])
        .concat([{ em: true, cells: ['', '', 'COMPLETE A1–C2 PATHWAY', num(B.totalHours), num(B.totalCredits)] }]),
      source: 'Adopted and published.',
    }, { title: 'Why six, and why this size', columns: true, body: `
      <p>A level is ${num(B.hoursPerLevel)} academic hours because that is roughly what the Common European Framework takes to move an adult one band, and because ${B.instalmentsPerLevel} instalments across ${B.monthsPerLevel} months is a commitment a working adult can actually make.</p>
      <p>Each level confers its own award. A learner who stops after two holds two qualifications rather than a fraction of one, which is the difference between a pathway and a course somebody abandoned.</p>
      <p>The credential is identical on every route. What a route changes is how the learner is taught and how much of the institution&rsquo;s attention they receive on the way to it.</p>` },
    { runhead: 'The Institution', tone: 'pal pal--heritage' })
  ));

  at('standard');
  push(...S.spread(
    S.statementPage({
      palette: 'authority',
      eyebrow: 'The governing principle',
      statement: 'One academic standard.<br><em>Many ways to reach it.</em>',
      sub: 'The examination, the rubric, the second marking, the moderation, the registry entry and the award are identical on every route and in every market. What a route changes is the teaching, the attention and the flexibility — never the qualification.',
      foot: [
        { k: 'Routes of access', v: 'Five' },
        { k: 'Examinations', v: 'One architecture' },
        { k: 'Awards', v: `${B.levels}, one a level` },
      ],
    }),
    S.marginPage({
      runhead: 'The Institution',
      tone: 'pal pal--heritage',
      side: S.marginNote('Held to it',
        'A qualification that improves with the fee is not a qualification. The College treats this as a structural commitment rather than a marketing claim, and the reconciliation that produces this document fails if the routes ever diverge on assessment.'),
      main: `
        <p class="op__num">Educational philosophy</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>The College holds that a qualification is worth what its standard is worth, and that a standard is only real if it is published before the work, applied by somebody named, checked by somebody else, and recorded where a stranger can find it.</p>
          <h3>Teaching is a service, not the credential</h3>
          <p>How much instruction a learner receives, in what size of room, at what hour of the day and with how much of a named instructor&rsquo;s attention, is a matter of circumstance, budget and professional life. It should be a choice. It should not decide what the qualification is worth.</p>
          <p>So WEC-LC separates the two completely. The academic standard is fixed and institutional. The mode of study is chosen by the learner and priced according to what it costs the College to provide.</p>
          <h3>Access is an architectural question</h3>
          <p>An institution that serves only those who can afford its most attentive route has not widened access; it has narrowed its market and called the result selectivity. The Independent pathway exists so that the qualification is reachable by a self-directed learner anywhere in the world at one published price, and the institutional channels exist so that an employer, a university or a ministry can place a cohort where a retail tariff never could.</p>
        </div>`,
    })
  ));

  // ════════════════════════════════════════════════════════════════
  // PART II — THE EDUCATIONAL EXPERIENCE
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'The Educational Experience';
  onRecto();
  at('passage');
  push(...S.spread(
    S.openerPage({ palette: 'luminous', part: 'Part Two', roman: 'II', title: 'The Educational<br>Experience',
      standing: M.mark('verified'),
      say: 'What actually happens to a person who enrols, from the first enquiry to a credential a stranger can verify.',
      datum: datPassage(),
      caption: 'Eight stations. The two struck in the metal are the ones at which the College confers something: the examination that decides the level, and the award that records it.',
      contains: [{ t: 'The passage of a learner', f: PAGES_OF.passage || '' },
        { t: 'Curriculum, teaching and supervision', f: PAGES_OF.teaching || '' },
        { t: 'Assessment, examination and the award', f: PAGES_OF.assessment || '' }] }),
    S.marginPage({
      runhead: 'The Educational Experience',
      tone: 'pal pal--luminous',
      side: S.marginNote('One re-sit, no fee',
        'A candidate who does not pass sits again. One re-sit is included on every route and there is no re-sit fee.')
        + S.marginNote('Withdrawal', `A full refund inside ${B.refundWindowDays} days of enrolment.`),
      main: `
        <p class="op__num">The passage of a learner</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>A learner enquires, is admitted against a stated entry position, is oriented into the College&rsquo;s learning environment, studies a level, is assessed throughout it, sits an examination at its close, is conferred an award, and either progresses to the next level or stops holding what they have earned.</p>
          <h3>Admission</h3>
          <p>Admission establishes where a learner enters the ladder, not whether they are welcome on it. A learner already working in English is placed at the level that matches, and pays for the levels they take rather than the ones they do not need.</p>
          <h3>Progression</h3>
          <p>Each level is a complete qualification. Progression is a decision the learner makes six times, not once, and the College&rsquo;s commercial architecture is built to let them make it that way — including a payment plan that commits to one level at a time.</p>
          <h3>Conferral</h3>
          <p>An award is entered in the registry on the day it is made. Verification is public and requires no account, because a credential nobody can check is a piece of paper.</p>
        </div>`,
    })
  ));

  at('teaching');
  push(...S.spread(
    S.valuePage({
      palette: 'luminous',
      runhead: 'The Educational Experience',
      eyebrow: 'What the College provides',
      title: 'Twelve components, and teaching is one',
      sub: 'The complete educational service behind every route, in the order a learner meets it.',
      items: PF.VALUE_ARCHITECTURE.slice(0, 6),
    }),
    S.valuePage({
      palette: 'luminous',
      runhead: 'The Educational Experience',
      eyebrow: '',
      title: '',
      items: PF.VALUE_ARCHITECTURE.slice(6),
      note: 'Every component is identical on every pathway except the third, which is what a pathway chooses. The academic specification behind each route is set out at Appendix C.',
    })
  ));

  at('assessment');
  push(...S.spread(
    S.marginPage({
      runhead: 'The Educational Experience',
      tone: 'pal pal--luminous',
      side: S.marginNote('Second marking',
        'Every examination script is marked independently a second time, by somebody who cannot see the first mark.')
        + S.marginNote('Moderation',
          'Marks are moderated across the cohort before any of them is released, so a lenient marker cannot confer a level.'),
      main: `
        <p class="op__num">Assessment and examination</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>Assessment runs throughout a level and is not the examination. It is how a learner and their instructor find out what is not yet working while there is still time to act on it.</p>
          <h3>The rubric comes first</h3>
          <p>The criteria against which a level is examined are published before the teaching begins. A standard written after the work has been seen is not a standard; it is an opinion with a number attached.</p>
          <h3>Nobody confers alone</h3>
          <p>A named marker marks. A second marker marks independently. The cohort is moderated. No single person can confer a WEC-LC level, and no instructor can confer one on a learner they taught without those checks standing behind it.</p>
          <h3>The award, and the record of it</h3>
          <p>A learner who passes is conferred the qualification for that level and entered in the registry the same day. The entry is public, permanent and verifiable without an account.</p>
        </div>`,
    }),
    S.statementPage({
      palette: 'ceremonial',
      eyebrow: 'The quality commitment',
      statement: 'Nothing passes on attendance.<br>Nothing passes on a <em>recommendation</em>.',
      sub: 'Second marking and moderation apply on every route, in every market and through every channel — including a sponsored cohort of a hundred and twenty, and including a bespoke programme built for one person.',
      foot: [
        { k: 'Marked independently', v: 'Twice' },
        { k: 'Moderated', v: 'Every cohort' },
        { k: 'Re-sits included', v: 'One, no fee' },
      ],
    })
  ));

  // ════════════════════════════════════════════════════════════════
  // PART III — THE COMMERCIAL ARCHITECTURE
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'The Commercial Architecture';
  onRecto();
  at('pathways');
  push(...S.spread(
    S.openerPage({ palette: 'authority', part: 'Part Three', roman: 'III', title: 'The Commercial<br>Architecture',
      standing: M.mark('proposed'),
      say: 'Five ways to take one qualification, four markets, six kinds of payer and five ways to pay — built so that a learner’s circumstances decide their route and never their credential.',
      datum: datColonnade(),
      caption: `Six columns of one order, each marked with its multiple of the ${usd(T.independent)} access route. The qualification conferred is identical on every one of them.`,
      contains: [{ t: 'The five pathways', f: PAGES_OF.pathways || '' },
        { t: 'What the tuition provides', f: PAGES_OF.value || '' },
        { t: 'How it is paid', f: PAGES_OF.payment || '' },
        { t: 'Who buys, and why it matters', f: PAGES_OF.payers || '' }] }),
    S.tariffPage({
      palette: 'luminous',
      runhead: 'Commercial Architecture',
      eyebrow: 'The access portfolio',
      title: 'Five pathways to one qualification',
      sub: 'Reference investment for a complete A1 to C2 pathway. Regional tariffs follow overleaf.',
      head: ['Pathway', 'Designed for', 'Academic support', 'Flexibility', 'Investment'],
      /* A pathway with two intensities is ONE row of the portfolio,
         not two. The second intensity repeats neither its audience nor
         its support, because repeating them made one pathway look like
         two tiers of a ladder — which is exactly the reading this
         architecture exists to prevent. */
      rows: PF.INTENSITIES.map((i, n) => {
        const pw = PF.PATHWAYS[i.pathway];
        const first = n === 0 || PF.INTENSITIES[n - 1].pathway !== i.pathway;
        const inv = PF.investment(i.key, 'gulf', T);
        return { cells: [
          { v: `${M.esc(i.name)}${i.note ? `<s>${M.esc(i.note)}</s>` : ''}`, cls: 'w' },
          first ? M.esc(pw.designedFor) : '',
          first ? M.esc(pw.support) : '',
          M.esc(pw.flexibility),
          { v: usd(inv.published), cls: 'n' },
        ] };
      }),
      note: `${M.mark('proposed')} Independent is adopted and published; every other route is solved from the College’s financial constitution rather than set by preference.`,
    })
  ));

  at('value');
  push(...S.spread(
    S.statementPage({
      palette: 'ceremonial',
      eyebrow: 'What the investment buys',
      statement: 'A qualification, an education, and a <em>record</em> that outlives both.',
      sub: 'Tuition funds the complete institutional service: the curriculum, the teaching, the supervision, the assessment, the examination, the independent second marking, the moderation, the advising, the learning environment, the student services, the award and the permanent verifiable record of it.',
      foot: [
        { k: 'Components', v: String(PF.VALUE_ARCHITECTURE.length) },
        { k: 'Of which teaching', v: 'One' },
        { k: 'Identical on every route', v: 'Eleven' },
      ],
    }),
    S.tariffPage({
      palette: 'editorial',
      runhead: 'Commercial Architecture',
      eyebrow: 'The payment architecture',
      title: 'How a pathway is paid for',
      sub: `Shown on the Tutored pathway at ${usd(PF.investment('tutored', 'gulf', T).published)}. Every route offers the same arrangements.`,
      head: ['Arrangement', 'What it means', 'Payments', 'Each', 'Total'],
      rows: ['full', 'annual', 'level', 'instalment'].map((k) => {
        const sc = PF.schedule(PF.investment('tutored', 'gulf', T).published, k);
        return { cells: [
          { v: `${M.esc(sc.name)}${sc.note ? `<s>${M.esc(sc.note)}</s>` : ''}`, cls: 'w' },
          M.esc(sc.how),
          String(sc.instalments),
          { v: usd(sc.each), cls: 'n' },
          { v: usd(sc.payable), cls: 'n' },
        ] };
      }),
      note: 'Settlement in full carries a three per cent advantage, which is the value to the College of the working capital. Payment by instalment carries a four per cent administration loading, which is what the arrangement costs to operate. Neither is a promotion, and the College does not discount its way to a decision.',
    })
  ));

  at('payers');
  push(...S.spread(
    S.tariffPage({
      palette: 'luminous',
      runhead: 'Commercial Architecture',
      eyebrow: 'The institutional channels',
      title: 'Who buys a WEC-LC place',
      sub: 'The same qualification, bought through six different relationships.',
      head: ['Payer', 'Who they are', 'Places a relationship', 'Band'],
      rows: PF.PAYER_KEYS.filter((k) => k !== 'scholarship').map((k) => {
        const py = PF.PAYERS[k];
        return { cells: [
          { v: `${M.esc(py.name)}${py.note ? `<s>${M.esc(py.note)}</s>` : ''}`, cls: 'w' },
          M.esc(py.who),
          py.seats === 1 ? 'One' : `${py.seats}`,
          py.band ? `${(PF.BANDS.find((b) => py.band >= b.from && (b.to === null || py.band <= b.to)).rate * 100).toFixed(0)}%` : '—',
        ] };
      }),
      note: `The bands are the College’s own published partner bands. It does not invent a discount to win an agreement, which is a more durable thing to be able to say in a negotiation. The College also funds its own access places at the published tariff, so that an access place is a cost the institution carries rather than a discount it advertises.`,
    }),
    S.figurePage({
      palette: 'luminous',
      eyebrow: 'Why the channels exist', title: 'What one negotiation buys',
      sub: 'Acquisition paid per learner never amortises; paid per agreement it divides by the seats it carries.',
      figure: figAmort(),
      reading: { head: 'The structural argument', body: `
        <p>The cost of finding the next Gulf executive is the cost of finding the last one. Paid per agreement it divides by every seat the agreement carries, and a single negotiation can carry twenty-five to over a hundred.</p>
        <p>Swept across a twelvefold price range and a sixteenfold range of scale, <strong>a purely retail College could not bring acquisition below twenty-two per cent of revenue</strong> against a ${pct(AL.SHARES.marketing, 0)} allocation. No price fixes that. The institutional channels are the structural answer, and that is why they are part of the architecture rather than an addition to it.</p>` },
      note: `${M.mark('modelled')}`,
      strip: [
        { k: 'Dearest retail seat', v: usd(PR.CAC.gccExec), s: 'A Gulf executive, acquired singly' },
        { k: 'Cheapest agreement seat', v: usd(Math.round(Math.min(...Object.keys(PR.CHANNELS).map((k) => PR.channelTerms(k, P_).cacPerSeat)))), s: 'One negotiation, many seats' },
        { k: 'Multiple', v: `${(PR.CAC.gccExec / Math.min(...Object.keys(PR.CHANNELS).map((k) => PR.channelTerms(k, P_).cacPerSeat))).toFixed(1)}×`, s: 'Cheaper per seat' },
        { k: 'Retail-only floor', v: '22%', s: `Against a ${pct(AL.SHARES.marketing, 0)} allocation` },
      ],
      runhead: 'Commercial Architecture' })
  ));

  // ════════════════════════════════════════════════════════════════
  // PART IV — THE GLOBAL MARKET
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'The Global Market';
  onRecto();
  at('regional');
  push(...S.spread(
    S.openerPage({ palette: 'ceremonial', part: 'Part Four', roman: 'IV', title: 'The Global Market',
      standing: M.mark('modelled'),
      say: 'What comparable programmes charge, what the research did to an earlier draft, and the markets where the College sells through a sponsor rather than a price list.',
      datum: datReach(),
      caption: 'Five segments by reachable population. A ruled and hatched segment carries a direct published observation; an outlined one is modelled from the segments that do.',
      contains: [{ t: 'The regional architecture', f: PAGES_OF.regional || '' },
        { t: 'What the research did to the plan', f: PAGES_OF.slope || '' },
        { t: 'What comparable providers charge', f: PAGES_OF.evidence || '' },
        { t: 'Where the evidence does not exist', f: PAGES_OF.gaps || '' }] }),
    S.tariffPage({
      palette: 'luminous',
      runhead: 'The Global Market',
      eyebrow: 'The regional architecture',
      title: 'One architecture, four price levels',
      sub: 'The complete pathway, as published in each market. A dash is a route the College does not offer at retail in that region.',
      head: ['Pathway', ...PF.REGION_KEYS.map((r) => PF.REGIONS[r].short)],
      rows: PF.INTENSITIES.map((i) => ({ cells: [
        { v: M.esc(i.name), cls: 'w' },
        ...PF.REGION_KEYS.map((r) => {
          const inv = PF.investment(i.key, r, T);
          return { v: inv.offered ? usd(inv.published) : '<span style="opacity:.5">Through a sponsor</span>', cls: inv.offered ? 'n' : '' };
        }),
      ] })),
      note: `The index is computed from the College’s own researched willingness to pay, weighted by reachable population, against the best-evidenced market. Where a region will not carry a route at a price that covers what it costs to deliver, the College does not quote one — the route is available there through an employer, an institution or a sponsor. ${M.mark('modelled')}`,
    })
  ));

  at('slope');
  push(...S.spread(
    S.figurePage({
      palette: 'luminous',
      eyebrow: 'What the research did to the plan', title: 'Assumed against researched',
      sub: 'Price of a complete pathway at which a segment converts at its reference rate.',
      figure: figSlope(),
      reading: { head: 'What the research moved', body: `
        <p>Each line runs from what an earlier draft assumed a segment would pay to what the published evidence says it will. <strong>Four of the five moved, and none of them upwards.</strong></p>
        <p>West Africa moved by nearly a factor of three, and that single correction removes more demand from the model than every other change combined. A Lagos IELTS course is about forty-nine dollars a month; the whole published Nigerian range tops out near eighteen hundred.</p>
        <p>The plan this replaced projected ${m$(PA.superseded_pathway_usd.projected_ten_year_revenue_usd)} of revenue on the assumed figures. It is recorded rather than quietly replaced, because an undocumented correction gets re-proposed six months later by somebody who does not know it was already made.</p>` },
      note: `${M.mark('modelled')} Willingness to pay is an inference from published tariffs, not an observation of it.`,
      strip: [
        { k: 'Segments moved', v: '4 of 5', s: 'None of them upwards' },
        { k: 'Largest correction', v: 'West Africa', s: 'Nearly a factor of three' },
        { k: 'Superseded plan', v: m$(PA.superseded_pathway_usd.projected_ten_year_revenue_usd), s: 'Recorded, not deleted' },
        { k: 'Observations kept', v: String(EVSEG.reduce((t, [k]) => t + EV[k].observations.length, 0)), s: 'Each with its source address' },
      ],
      runhead: 'The Global Market' }),
    S.marginPage({
      runhead: 'The Global Market',
      tone: 'pal pal--editorial',
      side: S.marginNote('The reference market',
        'The Gulf, because the British Council publishes its Saudi tariff and the whole A2–C1 ladder can be computed from it. Every other region is expressed relative to that.'),
      main: `
        <p class="op__num">Four markets, four architectures</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>One global price multiplied by a feeling about a country is not a regional strategy. The College indexes its tariff on the willingness to pay its own research established, market by market, and then applies two disciplines to keep the result honest.</p>
          <h3>Nothing is sold below what it costs</h3>
          <p>Where a region&rsquo;s level will not carry a route at a price that covers delivery with a real contribution, the College does not quote one. West Africa is the case that proves it: the researched figures say plainly that no taught pathway reaches it at retail, and the answer is the access route and sponsored cohorts — not a taught pathway sold below cost to look inclusive.</p>
          <h3>A tariff has a rule about who it applies to</h3>
          <p>A regional tariff attaches to where the learner is and who is paying, and the College publishes that as a policy. An institution with four prices and no rule about which one applies has not built a regional architecture; it has built an arbitrage.</p>
        </div>`,
    })
  ));

  at('evidence');
  const evRows = EVSEG.flatMap(([key, name]) => EV[key].observations
    .filter((o) => o.price_local || o.price_usd)
    .map((o, i) => [i === 0 ? `<b>${M.esc(name)}</b>` : '',
      { v: `${M.esc(o.provider)}<br><span style="color:${S.C.grey}">${M.esc(o.product)}</span>`, cls: 'unit' },
      M.esc(o.price_local || '—'),
      typeof o.price_usd === 'number' ? usd(o.price_usd) : (o.price_usd ? `$${M.esc(String(o.price_usd))}` : '—'),
      M.esc(o.confidence || '—')]));
  const evPages = M.tablePages({
    title: 'What comparable providers charge',
    sub: `Published tariffs, converted. Gathered ${EV.researched_on}.`,
    head: ['Market', 'Provider', 'Local price', 'USD', 'Confidence'],
    rows: evRows,
    source: 'Every observation carries its source address in the evidence register at Appendix A.',
  }, 11, { runhead: 'The Global Market', tone: 'pal pal--editorial' });
  push(...evPages);

  at('gaps');
  if (evPages.length % 2 === 1) onRecto();
  push(...S.spread(
    tableWithReading({
      title: 'Marked as modelled',
      sub: 'Four markets and one central question the research could not answer.',
      head: ['Market or question', 'Standing', 'What the model does instead'],
      rows: EV.gaps.map((g) => [`<b>${M.esc(g.market || g.topic)}</b>`,
        M.mark(g.status === 'NO DIRECT COMPARABLE FOUND' ? 'insufficient' : 'modelled'),
        { v: M.esc(g.status === 'NO DIRECT COMPARABLE FOUND'
          ? 'Pathway prices are built up from per-level comparables rather than read off a competitor.'
          : (g.note || 'Scaled from the segments that carry direct observations.')), cls: 'unit' }]),
      source: 'Appendix A carries the full register, including the sources that were rejected.',
    }, { title: 'Rejecting well is most of the job', columns: true, body: `
      <p>Thirty candidate sources were pulled and eight shipped. What did not survive is recorded beside what did, because an undocumented rejection gets re-proposed six months later by somebody who does not know it was already considered.</p>
      <p>Four markets carry no direct observation at all. They are modelled from the segments that do, and marked as modelled wherever they appear. The College does not convert an absence of evidence into a number and hope nobody checks.</p>` },
    { runhead: 'The Global Market', tone: 'pal pal--editorial' }),
    S.statementPage({
      palette: 'authority',
      eyebrow: 'The finding that shaped the architecture',
      statement: `No provider sells a six-level, ${num(B.totalHours)}-hour credentialed pathway as one purchase. <em>WEC-LC’s product has no market price, because the product is not on the market.</em>`,
      sub: 'That is why the tariff is built from what the College must staff and what its financial constitution requires, and checked against published evidence — rather than read off a competitor who is selling something else.',
      foot: [
        { k: 'Sources pulled', v: 'Thirty' },
        { k: 'Sources shipped', v: 'Eight' },
        { k: 'Direct comparables', v: 'None' },
      ],
    })
  ));

  // ════════════════════════════════════════════════════════════════
  // PART V — THE FINANCIAL CONSTITUTION
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'The Financial Constitution';
  onRecto();
  at('alloc');
  push(...S.spread(
    S.openerPage({ palette: 'constitution', part: 'Part Five', roman: 'V', title: 'The Financial<br>Constitution',
      standing: M.mark('board'),
      say: 'Where every dollar of collected revenue is governed, what each line is forbidden from becoming, and the decade that follows from it.',
      datum: datCourse(),
      caption: 'One column of collected revenue, divided. Four courses are consumed running the institution; the two beyond the struck rule are retained as institutional capital and are not distributable income.',
      contains: [{ t: 'Where every dollar is governed', f: PAGES_OF.alloc || '' },
        { t: 'What each line is, and is not', f: PAGES_OF.definitions || '' },
        { t: 'The decade', f: PAGES_OF.decade || '' },
        { t: 'Three scenarios', f: PAGES_OF.scenarios || '' }] }),
    S.figurePage({
      palette: 'luminous',
      eyebrow: 'The governing financial law', title: 'Where every dollar is governed',
      sub: 'Four lines consumed running the institution; two retained as capital above the struck rule.',
      figure: figAllocation(),
      reading: { head: 'How the elevation is read', body: `
        <p>The shaft is what running the institution consumes, hatched at a density proportional to its weight: payroll heaviest, technology lightest. The struck gold rule is the division. Above it, ruled rather than hatched, is what is <em>held</em> &mdash; because those two lines are not spent.</p>
        <p><strong>Half of every dollar collected is retained.</strong> ${pct(AL.SHARES.reserve)} is restricted or designated institutional capital; the other ${pct(AL.SHARES.strategic)} is a Board-authorised discretionary allocation, and it is <strong>not</strong> automatically withdrawable income. No distribution from it is modelled anywhere in this plan.</p>
        <p>The tariff is solved from this drawing rather than the other way round. Move a course and the price moves with it.</p>` },
      note: `${M.mark('board')} Proposed governance targets, not a historical result.`,
      strip: [
        { k: 'Consumed', v: pct(AL.CONSUMED.reduce((t, k) => t + AL.SHARES[k], 0)), s: 'Payroll, technology, operating, marketing' },
        { k: 'Retained', v: pct(AL.RETAINED.reduce((t, k) => t + AL.SHARES[k], 0)), s: 'Reserve and Strategic, held as capital' },
        { k: 'Tariff it solves to', v: usd(T.tutored), s: 'A Tutored pathway, A1 to C2' },
        { k: 'Standing', v: 'Proposed', s: 'Board decision required' },
      ],
      runhead: 'Financial Constitution' })
  ));

  at('definitions');
  push(...S.spread(
    M.page(`
      <p class="fg__eye">Definitions</p>
      <h2 class="fg__t">What each line is, and is not</h2>
      <div style="margin-top:5mm">
      ${GOT.lines.map((l) => {
    const spec = PLAN.revenue_allocation_framework.shares.find((x) => x.key === l.key);
    return `<div class="m-alloc__row">
          <div style="flex:1">
            <h4>${M.esc(l.name)}</h4>
            <p>${M.esc(spec.definition)}</p>
            ${spec.not ? `<p style="margin-top:1.4mm;color:${S.C.crimson};font-size:${M.T.caption}pt;line-height:11.6pt"><em>${M.esc(spec.not)}</em></p>` : ''}
          </div>
          <div class="m-alloc__pct num">${pct(l.target, 0)}</div>
        </div>`;
  }).join('')}
      </div>`, { runhead: 'Financial Constitution', tone: 'pal pal--luminous' }),
    S.statementPage({
      palette: 'constitution',
      eyebrow: 'The standing obligation',
      statement: 'Half of every dollar collected is <em>retained</em>.',
      sub: 'Institutional quality is funded before anything discretionary, and financial resilience is a standing obligation rather than an ambition. No distribution from the Strategic Allocation is modelled anywhere in this plan.',
      foot: [
        { k: 'Institutional Reserve', v: pct(AL.SHARES.reserve, 0) },
        { k: 'Strategic Allocation', v: pct(AL.SHARES.strategic, 0) },
        { k: 'Modelled distributions', v: 'None' },
      ],
    })
  ));

  at('decade');
  push(...S.spread(
    S.figurePage({
      palette: 'luminous',
      eyebrow: 'What the constitution produces', title: 'The decade',
      sub: 'Net tuition as ruled columns; surplus against the year it crosses nil.',
      figure: figDecade(),
      reading: { head: 'Two registers, two quantities', body: `
        <p>The upper register is net tuition, year by year. The lower is surplus against its own nil rule, on its own baseline — drawn separately because a ten-million-dollar revenue and a first-year deficit on one plot make the second invisible.</p>
        <p>The year the institution turns is ruled through both. Before it the College is consuming capital; after it, generating it.</p>
        <p>Revenue is recognised in the year it is <em>taught</em>, not the year it is sold, which is why the curve lags the admissions behind it.</p>` },
      note: `${M.mark('modelled')} A strategic projection, not a trading record.`,
      strip: [
        { k: 'Ten-year revenue', v: m$(ARCH.proposed.totals.revenue), s: 'Recognised in the year taught' },
        { k: 'Ten-year surplus', v: m$(ARCH.proposed.totals.surplus), s: 'Before any distribution' },
        { k: 'Learners admitted', v: num(ARCH.proposed.totals.newLearners), s: `${num(ARCH.proposed.totals.awards)} awards conferred` },
        { k: 'Turns', v: String(CORE.years[TURN].calendar), s: 'Cumulative surplus crosses nil' },
      ],
      runhead: 'Financial Constitution' }),
    M.page(M.table({
      title: 'The Core Plan, year by year',
      sub: 'Revenue recognised in the year it is taught.',
      head: ['Year', 'Admitted', 'Taught', 'Net tuition', 'Delivery', 'Surplus'],
      rows: CORE.years.map((y) => [`<b>${y.calendar}</b>`, num(y.newLearners), num(y.activeLearners),
        m$(y.netTuition), m$(y.delivery), m$(y.surplus)])
        .concat([{ em: true, cells: ['TEN YEARS', num(CORE.totals.newLearners), `peak ${num(CORE.totals.y10Active)}`,
          m$(CORE.totals.revenue - CORE.totals.refunds), m$(CORE.totals.delivery), m$(CORE.totals.surplus)] }]),
      source: `${M.mark('modelled')} Full schedules at Appendix D.`,
    }), { runhead: 'Financial Constitution', tone: 'pal pal--editorial' })
  ));

  at('scenarios');
  push(...S.spread(
    tableWithReading({
      title: 'Three scenarios',
      sub: 'Each changes something the College would have to do differently, not simply the number of students.',
      head: ['Scenario', 'Revenue', 'Surplus', 'Year-10', 'Learners', 'To C2'],
      rows: ['conservative', 'core', 'growth'].map((k) => {
        const t = PSC[k].totals;
        const cells = [`<b>${M.esc(PSC[k].label)}</b>`, m$(t.revenue), m$(t.surplus),
          m$(t.y10Revenue), num(t.newLearners), num(t.awardsToC2)];
        return k === 'core' ? { em: true, cells } : cells;
      }),
      source: 'The Core Plan is the recommended execution case, not the midpoint of the other two.',
    }, { title: 'What a scenario has to change to be one', columns: true, body: `
      <p>A scenario set whose only variable is &ldquo;more students&rdquo; tests nothing. Each of these changes something the College would actually have to do differently: what it costs to be found, how many learners continue from one level to the next, and how far the College can reach at all.</p>
      <p>All three reach cumulative surplus inside the decade, but not at the same time: the Conservative case crosses in ${CROSSES.conservative}, four years after the High Growth case and two after Core. Those four years are the plan&rsquo;s real exposure. The Core case requires continuation and reach to hold broadly as modelled, and reach is the one quantity here that was never researched.</p>` },
    { runhead: 'Financial Constitution', tone: 'pal pal--editorial' }),
    S.statementPage({
      palette: 'authority',
      eyebrow: 'The exposure, stated',
      statement: 'Reach is the one quantity in this plan that was never <em>researched</em>.',
      sub: 'Every other major assumption rests on a published observation or on the College’s own records. How many people the College can actually reach, at what cost, is modelled — and the Conservative case exists to show what the decade looks like if that model is wrong.',
      foot: [
        { k: 'Conservative surplus', v: m$(PSC.conservative.totals.surplus) },
        { k: 'Core surplus', v: m$(PSC.core.totals.surplus) },
        { k: 'Growth surplus', v: m$(PSC.growth.totals.surplus) },
      ],
    })
  ));

  // ════════════════════════════════════════════════════════════════
  // PART VI — THE TEN-YEAR STRATEGY
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'The Ten-Year Strategy';
  onRecto();
  at('phases');
  push(...S.spread(
    S.openerPage({ palette: 'editorial', part: 'Part Six', roman: 'VI', title: 'The Ten-Year<br>Strategy',
      standing: M.mark('modelled'),
      say: 'Five phases, and what has to be true at the end of each before the next one begins.',
      datum: datDecade(),
      caption: `Ten years of net tuition, with ${CORE.years[TURN].calendar} struck — the year cumulative surplus first crosses nil.`,
      contains: [{ t: 'Five phases', f: PAGES_OF.phases || '' },
        { t: 'The order the markets open in', f: PAGES_OF.sequence || '' },
        { t: 'What the College measures', f: PAGES_OF.measures || '' }] }),
    M.page(`
      <p class="fg__eye">The ten-year roadmap</p>
      <h2 class="fg__t">Five phases, and what has to be true at the end of each</h2>
      <div style="margin-top:7mm">${M.timeline(PHASES.map((ph) => {
    const y = CORE.years[ph.yearIndex];
    return { ...ph, figure: `${num(y.activeLearners)} under instruction &middot; ${m$(y.netTuition)} net tuition` };
  }))}</div>`, { runhead: 'The Ten-Year Strategy', tone: 'pal pal--editorial' })
  ));

  at('sequence');
  push(...S.spread(
    tableWithReading({
      title: 'The order the markets open in',
      sub: 'Four markets, opened over the first four years, each at its own acquisition cost.',
      head: ['Market', 'Opens', 'Acquisition', 'Enrolled', 'Independent', 'Through a partner'],
      rows: PLAN.market.regions.map((r) => [`<b>${M.esc(r.name)}</b>`,
        `Year ${r.opens_year}`, usd(r.cac_usd), pct(r.enrolled_share, 0),
        pct(r.independent_share, 0), pct(r.partner_share, 0)]),
      source: `${M.mark('modelled')} Shares are of the learners each market sends, not of the College’s intake.`,
    }, { title: 'Why this order and not another', columns: true, body: `
      <p>The Gulf opens first because it is the best-evidenced market the College holds and the one where employer and family sponsorship is ordinary rather than exceptional. West Africa opens with it because the access route reaches it on day one at a price that needs no negotiation.</p>
      <p>The United Kingdom and Europe follow in the second year, once there are conferrals to point at. Asia and the wider world open in the fourth, and they open last for a reason the College states rather than hides: it holds no direct published evidence for that market, and it will not spend to be known in a market it has not researched.</p>
      <p>A College that opens everywhere at once has not sequenced its markets; it has divided its acquisition budget by four and hoped.</p>` },
    { runhead: 'The Ten-Year Strategy', tone: 'pal pal--editorial' }),
    S.figurePage({
      palette: 'luminous',
      eyebrow: 'What the College can actually teach', title: 'The establishment, and what it could not reach',
      sub: 'The instructors the timetable requires, and the learners turned away for want of them.',
      figure: figCapacity(),
      reading: { head: 'The number nobody wants to publish', body: `
        <p>A projection that books every learner it could win is a projection of a spreadsheet. This model turns learners away when the College has not got the instructors to teach them, and records the number.</p>
        <p>The establishment is not a ratio somebody chose. The College publishes what each route buys — tutorial hours, seminar hours at a stated group size, pieces of marked work — and an instructor has a contracted year of which a stated fraction reaches a learner. Dividing one by the other gives the establishment the timetable actually requires, and it moves when the specification moves.</p>
        <p><strong>Last year’s cohort is taught first.</strong> A College that admits a new class while its continuing students go untaught has not managed a capacity constraint; it has broken a promise.</p>` },
      note: `${M.mark('modelled')} Capacity binds on instructors, not on rooms.`,
      strip: [
        { k: 'Establishment at year ten', v: num(CORE.years[9].instructors), s: 'Instructors the timetable requires' },
        { k: 'Turned away, ten years', v: num(TURNED_AWAY), s: 'Recorded, never booked' },
        { k: 'Peak under instruction', v: num(CORE.totals.y10Active), s: 'Standing academic load' },
        { k: 'Served first', v: 'Continuing', s: 'Before any new admission' },
      ],
      runhead: 'The Ten-Year Strategy' })
  ));

  at('measures');
  push(...S.spread(
    tableWithReading({
      title: 'What the College measures',
      sub: 'Financial sustainability matters enormously. It is not the whole institutional story.',
      head: ['Measure', 'Why it is tracked', 'At year ten'],
      rows: [
        ['<b>Learners admitted</b>', { v: 'Reach. An institution that cannot find learners cannot teach anybody.', cls: 'unit' }, num(CORE.totals.newLearners)],
        ['<b>Awards conferred</b>', { v: 'Completion. Admissions without conferrals is churn with a prospectus.', cls: 'unit' }, num(CORE.totals.awards)],
        ['<b>Learners reaching C2</b>', { v: 'The top of the ladder actually being climbed.', cls: 'unit' }, num(CORE.totals.awardsToC2)],
        ['<b>Under instruction</b>', { v: 'Standing academic load, and the establishment it requires.', cls: 'unit' }, num(CORE.totals.y10Active)],
        ['<b>Turned away for capacity</b>', { v: 'The gap between what the College can sell and what it can teach.', cls: 'unit' }, num(TURNED_AWAY)],
        ['<b>Institutional reserve</b>', { v: `Resilience, measured against ${RESERVE_POLICY.target_months_of_operating_cost} months of operating cost.`, cls: 'unit' }, m$(CORE.years[9].reserve)],
        ['<b>Regions served</b>', { v: 'Diversification. A College dependent on one market is a College with one risk.', cls: 'unit' }, String(PF.REGION_KEYS.length)],
        ['<b>Second-marking coverage</b>', { v: 'Academic integrity. The one measure with no acceptable shortfall.', cls: 'unit' }, 'Every script'],
      ],
      source: `${M.mark('modelled')} except the last, which is a standing commitment.`,
    }, { title: 'Why surplus is not the only line', columns: true, body: `
      <p>An institution measured only on surplus will reach it by teaching fewer people more expensively, and will call that a strategy. These are the measures the Board is asked to hold management to, and half of them are not financial.</p>
      <p>The last has no target because it has no acceptable shortfall. Second marking and moderation apply to every script on every route in every market, and a year in which that slipped would not be a year in which the College grew.</p>` },
    { runhead: 'The Ten-Year Strategy', tone: 'pal pal--editorial' }),
    S.statementPage({
      palette: 'ceremonial',
      eyebrow: 'The institutional objective',
      statement: 'An international English institution, <em>not</em> a collection of language classes.',
      sub: 'The ten-year objective is a College that is financially resilient, academically disciplined, internationally diversified and capable of being examined by somebody outside it — in that order, and with none of the four traded for another.',
      foot: [
        { k: 'Phases', v: String(PHASES.length) },
        { k: 'Regions', v: String(PF.REGION_KEYS.length) },
        { k: 'Decade', v: PERIOD },
      ],
    })
  ));

  // ════════════════════════════════════════════════════════════════
  // PART VII — GOVERNANCE AND RESILIENCE
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'Governance and Resilience';
  onRecto();
  at('gov');
  const authorityPage = S.openerPage({ palette: 'scholarly', part: 'Part Seven', roman: 'VII',
    title: 'Governance and<br>Resilience',
    standing: M.mark('verified'),
    say: 'Who decides what, the separations that protect a learner, and the twenty risks the College is watching.',
    datum: datAuthority(),
    caption: 'Authority narrows as it descends. The struck tier is the one that cannot be overruled on an academic question, which is the single most important fact about the structure.',
    contains: [{ t: 'Where a decision stops', f: PAGES_OF.gov || '' },
      { t: 'The institutional risk register', f: PAGES_OF.risks || '' },
      { t: 'The response, and who owns it', f: PAGES_OF.response || '' },
      { t: 'Resilience and financial governance', f: PAGES_OF.resilience || '' }] });
  const govTable = M.tablePages({
    title: 'Governance and authority',
    sub: 'Who decides what, and the separations that protect a learner.',
    head: GOVERNANCE_COLUMNS,
    rows: GOVERNANCE.map((g) => [`<b>${M.esc(g[0])}</b>`, M.esc(g[1]),
      { v: M.esc(g[2]), cls: 'unit' }, { v: M.esc(g[3]), cls: 'unit' }]),
    source: 'Several offices named here are defined and unfilled. The College does not publish a person into an office they have not accepted.',
  }, 9, { runhead: 'Governance and Resilience', tone: 'pal pal--scholarly' });
  push(...S.spread(authorityPage, govTable[0]), ...govTable.slice(1));

  at('risks');
  const riskMatrixPage = S.figurePage({
    palette: 'luminous',
    eyebrow: 'Where attention goes', title: 'Twenty risks, placed',
    sub: 'Likelihood against impact. A register is a list; a matrix is a judgement.',
    figure: figRisk(),
    reading: { head: 'What the placement says', body: `
      <p>A register is a list and a matrix is a judgement. Each cell carries the number of risks placed in it and a hatch proportional to that number; an empty cell is ruled rather than left blank, so that nothing looks forgotten.</p>
      <p>The struck gold line encloses the region the Board would actually watch: likely enough to expect, and heavy enough to plan for. What stands inside it is the count the plate closes on.</p>
      <p>Every risk overleaf carries an early warning somebody can observe and an owner named in the governance schedule.</p>` },
    note: 'Authored judgement, not computed.',
    strip: [
      { k: 'Risks placed', v: String(RISKS.length), s: 'Every domain of the plan' },
      { k: 'Above the line', v: String(RISKS.filter((r) => r[2] !== 'Low' && r[3] !== 'Medium').length), s: 'Likely enough, heavy enough' },
      { k: 'With an early warning', v: String(RISKS.filter((r) => r[4]).length), s: 'Something somebody can observe' },
      { k: 'Owners', v: 'Named', s: 'In the governance schedule' },
    ],
    runhead: 'Governance and Resilience' });
  const riskTable = M.tablePages({
    title: 'The institutional risk register',
    sub: 'Each with an early warning somebody can actually observe.',
    head: ['Domain', 'Risk', 'L', 'I', 'Early warning'],
    rows: RISKS.slice(0, 9).map((r) => [`<b>${M.esc(r[0])}</b>`, { v: M.esc(r[1]), cls: 'unit' },
      M.esc(r[2]), M.esc(r[3]), { v: M.esc(r[4]), cls: 'unit' }]),
    source: 'L — likelihood. I — impact.',
  }, 7, { runhead: 'Governance and Resilience', tone: 'pal pal--scholarly' });
  push(...S.spread(riskMatrixPage, riskTable[0]), ...riskTable.slice(1));
  push(...M.tablePages({
    title: 'The institutional risk register',
    sub: '',
    head: ['Domain', 'Risk', 'L', 'I', 'Early warning'],
    rows: RISKS.slice(9).map((r) => [`<b>${M.esc(r[0])}</b>`, { v: M.esc(r[1]), cls: 'unit' },
      M.esc(r[2]), M.esc(r[3]), { v: M.esc(r[4]), cls: 'unit' }]),
    source: 'The response to each, and the office that owns it, follow overleaf.',
  }, 7, { runhead: 'Governance and Resilience', tone: 'pal pal--scholarly' }));

  /* THE HALF OF THE REGISTER THAT WAS NEVER PRINTED.
     Every risk carries seven fields. The book printed five of them —
     domain, risk, likelihood, impact and the early warning — and
     dropped the RESPONSE and the OWNER, while the page facing the
     matrix told the reader that every risk "carries an owner named in
     the governance schedule". It was a claim the register itself did
     not support, and the two columns had been sitting in the data the
     whole time. */
  at('response');
  onRecto();
  push(...M.tablePages({
    title: 'The response, and who owns it',
    sub: 'What the College does when a risk lands, and the office accountable for doing it.',
    head: ['Risk', 'Response', 'Owned by'],
    rows: RISKS.map((r) => [{ v: `<b>${M.esc(r[1])}</b>`, cls: 'unit' },
      { v: M.esc(r[5]), cls: 'unit' }, M.esc(r[6])]),
    source: 'An owner is an office, not a person. Several of these offices are defined and unfilled, and the College does not publish a person into an office they have not accepted.',
  }, 6, { runhead: 'Governance and Resilience', tone: 'pal pal--scholarly' }));

  at('resilience');
  onRecto();
  push(...S.spread(
    S.figurePage({
      palette: 'luminous',
      eyebrow: 'Institutional resilience', title: 'The reserve against a rising target',
      sub: `Accumulated institutional capital, against ${RESERVE_POLICY.target_months_of_operating_cost} months of the cost of running the College.`,
      figure: figReserve(),
      reading: { head: 'Why the target climbs', body: `
        <p>The College’s reserve policy is stated in <strong>months of operating cost</strong> rather than as a share of revenue, and the difference is the whole point of holding a reserve. The thing a reserve has to survive is a year when revenue falls and cost does not — and a reserve set as a percentage of revenue shrinks exactly when it is needed.</p>
        <p>So the target is not a number. It is a staircase that climbs with the cost of running the institution, and a year in which the College grows raises the bar its reserve has to clear.</p>
        <p>${pct(RESERVE_POLICY.contribution_share_of_surplus, 0)} of any surplus is contributed to the reserve before anything else is considered. ${RESERVE_MET ? `On the Core Plan the target is met in <strong>${RESERVE_MET.calendar}</strong>.` : 'On the Core Plan the target is <strong>not met inside the decade</strong>, and that is stated rather than smoothed.'}</p>` },
      note: `${M.mark('modelled')} Reserve is accumulated institutional allocation, not cash at bank.`,
      strip: [
        { k: 'Target', v: `${RESERVE_POLICY.target_months_of_operating_cost} months`, s: 'Of operating cost, not of revenue' },
        { k: 'Contribution', v: pct(RESERVE_POLICY.contribution_share_of_surplus, 0), s: 'Of surplus, before anything discretionary' },
        { k: 'At year ten', v: m$(CORE.years[9].reserve), s: 'Accumulated' },
        { k: 'Target met', v: RESERVE_MET ? String(RESERVE_MET.calendar) : 'Not inside the decade', s: RESERVE_MET ? 'On the Core Plan' : 'Stated, not smoothed' },
      ],
      runhead: 'Governance and Resilience' }),
    S.marginPage({
      runhead: 'Governance and Resilience',
      tone: 'pal pal--scholarly',
      side: S.marginNote('Drawdown',
        'A reserve that can be drawn on by the office that caused the shortfall is not a reserve. Drawdown is a decision of the Board of Governors and of no other body.')
        + S.marginNote('Not distributable',
          'The Institutional Reserve is restricted or designated capital. It is not income, and no distribution from it is modelled anywhere in this plan.'),
      main: `
        <p class="op__num">Financial governance</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>The financial constitution allocates. Governance decides who may move an allocation, and the answer is deliberately narrow.</p>
          <h3>What the Board alone decides</h3>
          <p>The published tariff and the partner bands. The annual budget and the acquisition spend. Reserve policy and any drawdown against it. The appointment of the External Examiner. International partnerships. Each of those is a decision the Executive may advise on and may not take.</p>
          <h3>What the Executive decides</h3>
          <p>The establishment, instructor compensation and material technology expenditure — the operating decisions that follow from a budget once the Board has set it.</p>
          <h3>What neither may touch</h3>
          <p>An assessment outcome. Examination papers and rubrics are the Board of Academic Standards’ alone, and conferral and withdrawal are the Registrar’s. <strong>No commercial authority in this institution can alter an academic decision</strong>, and a commercial relationship that required it would be declined.</p>
          <h3>When a risk lands</h3>
          <p>Every risk in the register overleaf carries an early warning somebody can observe and a named office accountable for the response. A risk with a warning and no owner is a paragraph; a risk with an owner and no warning is a hope.</p>
        </div>`,
    })
  ));

  // ════════════════════════════════════════════════════════════════
  // PART VIII — THE BOARD CHARTER
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'The Board Charter';
  onRecto();
  at('charter');
  push(...S.spread(
    S.openerPage({ palette: 'sovereign', part: 'Part Eight', roman: 'VIII', title: 'The Board<br>Charter',
      standing: M.mark('board'),
      say: 'The principles the Board is invited to establish, and against which every later decision of the College may be tested.',
      datum: datCharter(),
      caption: 'Ten principles. They are the terms on which the rest of this document was written, and the terms on which it asks to be judged.',
      contains: [{ t: 'The principles the College is asked to establish', f: PAGES_OF.charter || '' }] }),
    S.charterPage({
      palette: 'sovereign',
      runhead: 'The Board Charter',
      label: 'The Board is invited to establish',
      heading: 'Institutional and academic principles',
      principles: CHARTER.slice(0, 5),
    })
  ));
  push(...S.spread(
    S.charterPage({
      palette: 'sovereign',
      runhead: 'The Board Charter',
      label: 'The Board is invited to establish',
      heading: 'Commercial and financial principles',
      principles: CHARTER.slice(5),
    }),
    S.statementPage({
      palette: 'authority',
      eyebrow: 'And the one that governs the rest',
      statement: 'The College will not claim recognition it does not <em>possess</em>.',
      sub: 'No accreditation, ranking, partnership, validation or endorsement is described in this document or anywhere else unless the College actually holds it, and no person is named in an office they have not accepted. Silence about a thing the College does not hold is acceptable. A claim is not.',
      foot: [
        { k: 'Accreditations held', v: 'None' },
        { k: 'Rankings held', v: 'None' },
        { k: 'Stated as such', v: 'Throughout' },
      ],
    })
  ));

  // ════════════════════════════════════════════════════════════════
  // APPENDICES
  // ════════════════════════════════════════════════════════════════
  NEXT_PART = 'Appendices';
  onRecto();
  at('appEvidence');
  push(...S.spread(
    S.statementPage({
      palette: 'scholarly',
      eyebrow: 'Appendices',
      statement: 'The working behind every figure in this book.',
      sub: 'The material in the eight parts is the institution’s argument. The material here is the audit trail beneath it: the evidence register, the method, the derivation of the tariff and the full financial schedules. It is placed here so that the argument can be read and so that it can be checked, without either getting in the way of the other.',
      foot: [
        { k: 'A', v: 'Evidence register' },
        { k: 'B', v: 'Method and sources' },
        { k: 'C', v: 'How the tariff is derived' },
        { k: 'D', v: 'Ten-year schedules' },
      ],
    }),
    tableWithReading({
      title: 'Appendix A · The evidence register',
      sub: `Every priced observation the plan rests on, with its provider, product and standing. Gathered ${EV.researched_on}.`,
      head: ['Market', 'Observations', 'Standing'],
      rows: EVSEG.map(([k, name]) => [`<b>${M.esc(name)}</b>`,
        { v: EV[k].observations.map((o) => M.esc(o.provider)).join('; '), cls: 'unit' },
        M.esc([...new Set(EV[k].observations.map((o) => o.confidence || '—'))].join(', '))]),
      source: 'Source addresses for every observation are held in the College’s evidence register and are reproduced on request.',
    }, { title: 'What counts as evidence here', columns: true, body: `
      <p>An observation is a price a named provider publishes for a named product, converted at a stated rate on a stated date. An inference is what the College concludes from those prices about what a market will pay for something nobody sells.</p>
      <p>The two are never merged. Willingness to pay, in this plan, is always an inference — and every figure that rests on one carries the mark that says so.</p>` },
    { runhead: 'Appendices', tone: 'pal pal--scholarly' })
  ));

  at('appMethod');
  push(...S.spread(
    M.page(M.table({
      title: 'Appendix B · Method, sources and reconciliation',
      sub: 'What each source carries, and what standing it has.',
      head: ['Source', 'What it carries', 'Standing'],
      rows: [
        ['The published tariff', { v: 'The adopted fee, its decomposition, the level structure and the refund window.', cls: 'unit' }, M.mark('verified')],
        ['The commercial register', { v: 'The routes, the independent steps, the partner bands, remission and referral.', cls: 'unit' }, M.mark('verified')],
        ['The evidence register', { v: 'Every priced observation with its provider, local price, hours and source address.', cls: 'unit' }, M.mark('verified')],
        ['The Board’s framework', { v: 'The revenue-allocation framework, the market and progression assumptions, and the establishment.', cls: 'unit' }, M.mark('board')],
        ['The cost model', { v: 'Delivery cost hour by hour, the demand model, the channels and the tariff.', cls: 'unit' }, M.mark('modelled')],
        ['The allocation model', { v: 'The constitution made binding, and the tariff solved from it.', cls: 'unit' }, M.mark('modelled')],
        ['The projection', { v: 'The ten years, with revenue recognised in the year it is taught.', cls: 'unit' }, M.mark('modelled')],
      ],
      source: 'The reconciliation is re-run on every issue of this document, and the tariff is re-derived from the constitution each time, so a price cannot drift away from its reason.',
    }), { runhead: 'Appendices', tone: 'pal pal--scholarly' }),
    S.figurePage({
      palette: 'scholarly',
      eyebrow: 'Appendix B · The management check', title: 'Per hour of individual attention',
      sub: 'A management instrument, retained for interrogation. It is not the commercial proposition.',
      figure: figThreshold(),
      reading: { head: 'Why this is in the appendix', body: `
        <p>A pathway total has no comparable, because no provider found sells a six-level credentialed pathway as one purchase. An hour of a qualified teacher&rsquo;s attention has one everywhere — but not the <em>same</em> one. A British Council module is group language teaching; a Bespoke pathway is one-to-one provision, whose market is executive coaching.</p>
        <p>This check earns its place: it caught a false commercial claim that a table of six numbers had let through. It is <strong>not</strong> a proposition, and it is not shown to a prospective learner, because a rate per hour tells the market to compare the College against a tutor.</p>
        <p>One tier is dearer than the group benchmark on both measures. The College states that rather than a price advantage it does not have.</p>` },
      note: `${M.mark('modelled')} Retained for Board and examiner interrogation.`,
      strip: [
        { k: 'Published benchmark', v: usd(BC_ATTN), s: 'British Council Saudi, per attention hour' },
        { k: 'Coaching band', v: `$${COACHING.from}–${COACHING.to}`, s: 'One-to-one provision' },
        { k: 'Tiers inside their comparable', v: '5 of 6', s: 'Each judged against the right one' },
        { k: 'The exception', v: 'Guided', s: `${usd(T.guided / PR.attentionHours('directed'), 0)} an attention hour` },
      ],
      runhead: 'Appendices' })
  ));

  at('appPricing');
  push(...S.spread(
    tableWithReading({
      title: 'Appendix C · What each pathway is staffed to deliver',
      sub: 'The academic specification behind the five routes, per complete A1–C2 pathway.',
      head: ['Pathway', 'Contact', 'Individual', 'Group', 'Marked work'],
      rows: PF.INTENSITIES.map((i) => {
        const sp = PF.specification(i.key);
        return [{ v: `<b>${M.esc(sp.name)}</b>`, cls: 'unit' }, num(sp.contactHours),
          num(sp.individualHours), sp.groupSize === 1 ? 'One to one' : `${sp.groupSize} learners`,
          `${num(sp.markedPieces)} pieces`];
      }),
      source: 'The College publishes what it staffs. These are the hours it commits to, not the hours it sells.',
    }, { title: 'Why the specification is published', columns: true, body: `
      <p>An institution that will not say how much teaching a route carries is asking to be trusted on the one thing a learner can actually check. The College publishes the specification so that the difference between its routes is a matter of record rather than of impression.</p>
      <p>It does not follow that the hours are the product. Every one of these routes carries the same twelve components opposite, the same examination and the same award. The specification says what the College must staff; it does not say what the learner is buying.</p>` },
    { runhead: 'Appendices', tone: 'pal pal--scholarly' }),
    M.page(M.table({
      title: 'Appendix C · How the tariff is derived',
      sub: 'Delivery cost, the contribution floor, and the reference investment for each route.',
      head: ['Pathway', 'Delivery cost', 'Floor', 'Reference', 'Over floor'],
      rows: PF.INTENSITIES.map((i) => {
        const inv = PF.investment(i.key, 'gulf', T);
        return [{ v: `<b>${M.esc(i.name)}</b>`, cls: 'unit' }, usd(inv.cost), usd(inv.floor),
          usd(inv.published || inv.floor), `${(((inv.published || inv.floor) / inv.floor - 1) * 100).toFixed(0)}%`];
      }),
      source: `The floor is delivery cost plus a ${(PF.MINIMUM_CONTRIBUTION * 100).toFixed(0)} per cent contribution. The constitution binds the institution rather than each product, so cross-subsidy between routes is deliberate: it is what allows the College to run an access route at all.`,
    }), { runhead: 'Appendices', tone: 'pal pal--scholarly' })
  ));

  push(...S.spread(
    tableWithReading({
      title: 'Appendix C · How the tariff is derived',
      sub: 'Delivery cost, the contribution floor, and the reference investment for each route.',
      head: ['Pathway', 'Delivery cost', 'Floor', 'Reference', 'Over floor'],
      rows: PF.INTENSITIES.map((i) => {
        const inv = PF.investment(i.key, 'gulf', T);
        return [{ v: `<b>${M.esc(i.name)}</b>`, cls: 'unit' }, usd(inv.cost), usd(inv.floor),
          usd(inv.published || inv.floor), `${(((inv.published || inv.floor) / inv.floor - 1) * 100).toFixed(0)}%`];
      }),
      source: `The floor is delivery cost plus a ${(PF.MINIMUM_CONTRIBUTION * 100).toFixed(0)} per cent contribution. The constitution binds the institution rather than each product, so cross-subsidy between routes is deliberate: it is what allows the College to run an access route at all.`,
    }, { title: 'Why the tariff is the cheapest that works', columns: true, body: `
      <p>The reference investment is not a preference. It is the cheapest tariff at which the portfolio — sold across ${PF.REGION_KEYS.length} regions at ${PF.REGION_KEYS.length} price levels and through ${PF.PAYER_KEYS.length - 1} kinds of payer — still satisfies the financial constitution. Where two tariffs both satisfy it, the College charges the lower one.</p>
      <p>The adopted Independent fee is not solved. It is published, and a plan does not reprice a fee the institution has already announced in order to tidy an internal ratio.</p>
      <p>An earlier tariff, solved at one global price, retains ${(PF.meetsConstitution(PF.SUPERSEDED_TARIFF).retainedShare * 100).toFixed(1)} per cent against a ${pct(AL.RETAINED.reduce((t, k) => t + AL.SHARES[k], 0), 0)} requirement once the regional levels are applied. It would have satisfied its own law on paper and missed it in the bank, and that gap is the whole argument for pricing by region rather than by multiplication.</p>` },
    { runhead: 'Appendices', tone: 'pal pal--scholarly' }),
    M.page(M.table({
      title: 'Appendix C · Three architectures, one basis',
      sub: 'The same demand model, delivery costs, acquisition budget and capacity gate. Only the price differs.',
      head: ['Architecture', 'Revenue', 'Surplus', 'Learners', 'Holders'],
      rows: [
        [M.esc(ARCH.briefA.label), m$(ARCH.briefA.totals.revenue), m$(ARCH.briefA.totals.surplus),
          num(ARCH.briefA.totals.newLearners), num(ARCH.briefA.totals.alumni)],
        [M.esc(ARCH.adopted.label), m$(ARCH.adopted.totals.revenue), m$(ARCH.adopted.totals.surplus),
          num(ARCH.adopted.totals.newLearners), num(ARCH.adopted.totals.alumni)],
        { em: true, cells: ['<b>PROPOSED</b>', m$(ARCH.proposed.totals.revenue),
          m$(ARCH.proposed.totals.surplus), num(ARCH.proposed.totals.newLearners), num(ARCH.proposed.totals.alumni)] },
      ],
      source: `Against a single global fee the proposal collects ${m$(ARCH.adopted.totals.revenue - ARCH.proposed.totals.revenue)} LESS over the decade and admits ${num(ARCH.adopted.totals.newLearners - ARCH.proposed.totals.newLearners)} fewer learners — two of the College’s four markets carry no taught route at retail. It confers ${num(ARCH.proposed.totals.awards - ARCH.adopted.totals.awards)} more qualifications and retains ${m$(ARCH.proposed.totals.surplus)} against ${m$(ARCH.adopted.totals.surplus)}, which is ${pct(ARCH.proposed.totals.surplus / ARCH.proposed.totals.revenue, 1)} of what it collects against ${pct(ARCH.adopted.totals.surplus / ARCH.adopted.totals.revenue, 1)}. The trade is real, and it runs toward the two things the institution exists for.`,
    }), { runhead: 'Appendices', tone: 'pal pal--scholarly' })
  ));

  at('appSchedules');
  push(...S.spread(
    M.page(M.table({
      title: 'Appendix D · Reach, admissions and standing load',
      sub: 'The Core Plan, year by year.',
      head: ['Year', 'Reach', 'Admitted', 'Under instruction', 'Awards', 'To C2'],
      rows: CORE.years.map((y) => [`<b>${y.calendar}</b>`, num(y.reach), num(y.newLearners),
        num(y.activeLearners), num(y.totalAwards), num(y.awardsToC2)]),
      source: `${M.mark('modelled')}`,
    }), { runhead: 'Appendices', tone: 'pal pal--scholarly' }),
    M.page(M.table({
      title: 'Appendix D · Cost, surplus and reserve',
      sub: 'The Core Plan, year by year.',
      head: ['Year', 'Delivery', 'Acquisition', 'Fixed', 'Surplus', 'Reserve'],
      rows: CORE.years.map((y) => [`<b>${y.calendar}</b>`, m$(y.delivery), m$(y.acquisition),
        m$(y.fixed), m$(y.surplus), m$(y.reserve)]),
      source: `${M.mark('modelled')} Reserve is the accumulated institutional allocation, not cash at bank.`,
    }), { runhead: 'Appendices', tone: 'pal pal--scholarly' })
  ));

  // ══ COLOPHON ══════════════════════════════════════════════════════
  onRecto();
  P.push(M.page(`
    <div class="m-colo__wrap" style="z-index:2">
      <h2>A planning instrument,<br>and not a record of trading.</h2>
      <p>Every financial figure in this publication is a projection computed from stated assumptions, and every claim carries its standing.</p>
      <div class="m-colo__key">
        <div><span>${M.mark('verified')}</span><p>The College holds it, and it is published.</p></div>
        <div><span>${M.mark('modelled')}</span><p>This plan asserts it, from stated assumptions.</p></div>
        <div><span>${M.mark('board')}</span><p>Nobody has decided it yet.</p></div>
      </div>
      <p>The College claims no accreditation, ranking, partnership or endorsement it does not hold, and names no person in an office they have not accepted.</p>
      <div class="rule-hair"></div>
      <p class="m-colo__meta">WorldWide English College &middot; London Campus<br>
        The Ten-Year Institutional Master Plan ${PERIOD}<br>
        Set in Bodoni Moda, Newsreader and Archivo<br>
        Drawn throughout from the College&rsquo;s own figures. No photography.<br>
        ${M.PAGE.width} &times; ${M.PAGE.height}mm</p>
    </div>`, { tone: 'pg--dark m-colo', bare: true }));

  LEAVES = P.length;
  return P;
}

build();
build();
/* The extent the cover prints is the extent of the pass BEFORE it, so
   it is only true if the two passes agree. They do — the second pass
   only fills in folio numbers — but "they do" is not a check. */
const printed = (P.join('').match(/<k>Leaves<\/k><v>(\d+)</) || [])[1];
if (Number(printed) !== P.length) {
  throw new Error(`the cover states ${printed} leaves and the book has ${P.length}`);
}

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>WEC-LC — Ten-Year Institutional Roadmap ${PERIOD}</title>
<style>${M.css(FACES)}${M.masterCss()}${M.masterCssTwo()}${S.spreadCss()}</style></head>
<body>${P.join('\n')}</body></html>`;

mkdirSync(OUT, { recursive: true });
const HTML_OUT = path.join(OUT, '.monograph.html');
const PDF_OUT = path.join(OUT, 'WEC-LC Institutional Monograph.pdf');
writeFileSync(HTML_OUT, html);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await browser.newPage();
await pg.goto('file://' + HTML_OUT, { waitUntil: 'networkidle' });
await pg.emulateMedia({ media: 'print' });
await pg.pdf({ path: PDF_OUT, width: `${M.PAGE.width}mm`, height: `${M.PAGE.height}mm`,
  printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });

const bad = await pg.evaluate(() => {
  const out = [];
  document.querySelectorAll('.pg').forEach((p, i) => {
    const f = p.querySelector('.pg__field');
    const over = f ? Math.max(0, f.scrollHeight - f.clientHeight) : 0;
    const pr = p.getBoundingClientRect();
    /* WHAT DOES NOT COUNT AS CLIPPED.

       An <svg> clips to its own viewBox by default, so a label whose
       geometric rect runs past the plate is drawn correctly and simply
       ends — getBoundingClientRect reports the extent, not what was
       painted. Anything marked `.bleed` is positioned to run off the
       trim on purpose. Neither loses a reader anything, and failing
       the build on them means chasing phantoms instead of the tariff
       table that really did lose its last row. */
    const clipped = [...p.querySelectorAll('.pg__field *:not(.bleed):not(.bleed *)')].some((el) => {
      if (el.closest('svg')) return false;
      const r = el.getBoundingClientRect();
      return r.height > 0 && (r.bottom > pr.bottom + 0.5 || r.right > pr.right + 0.5);
    });
    const blocks = [...p.querySelectorAll('.pg__field p, .pg__field h2, .pg__field h4, .pg__field table')];
    let collided = null;
    for (let a = 0; a < blocks.length && !collided; a++) {
      for (let c = a + 1; c < blocks.length && !collided; c++) {
        if (blocks[a].contains(blocks[c]) || blocks[c].contains(blocks[a])) continue;
        for (const r1 of blocks[a].getClientRects()) {
          for (const r2 of blocks[c].getClientRects()) {
            if (r1.width < 2 || r2.width < 2) continue;
            if (Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left) > 3
              && Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top) > 3) {
              collided = (blocks[a].textContent || '').trim().slice(0, 34); break;
            }
          }
          if (collided) break;
        }
      }
    }
    /* THE FOLIO MUST BE THE PAGE. `page()` stamps a number as it
       builds, so a page that is built and then dropped, or built out
       of the order it is pushed in, leaves a gap or a swap that
       nothing else would catch — and both had happened: `spread()`
       was being handed three pages and silently discarding the third,
       which cost the book two leaves of the risk register and two of
       the governance schedule. The only outward sign was folios
       running ahead of the page count after leaf 34. */
    const f2 = p.querySelector('.folio');
    const folio = f2 ? Number(f2.textContent.trim()) : null;
    const misfoliated = folio !== null && folio !== i + 1 ? folio : null;

    /* AND THERE IS NO PHOTOGRAPHY IN THIS PUBLICATION. Ruled by the
       owner on 20 September 2026: the decorative plates came out and
       are not to come back as different plates. The machinery to
       place one was deleted from spreads.mjs, and this is the second
       lock — a raster image anywhere in the book fails the build. */
    const img = p.querySelector('img, [style*="url(data:image"], picture, video');

    if (over > 1 || clipped || collided || misfoliated || img) {
      out.push({ page: i + 1, over: Math.round(over), clipped, collided, misfoliated, img: Boolean(img) });
    }
  });
  return out;
});
await browser.close();
if (bad.length) {
  console.error('\nPAGE COMPOSITION FAILED:');
  for (const o of bad) {
    console.error(`  page ${o.page}: ${o.over}px over${o.clipped ? ', clipped' : ''}`
      + `${o.collided ? `, text on text “${o.collided}…”` : ''}`
      + `${o.misfoliated ? `, prints folio ${o.misfoliated}` : ''}`
      + `${o.img ? ', carries a raster image' : ''}`);
  }
  process.exitCode = 1;
}
console.log(`Wrote the monograph — ${P.length} pages, ${(readFileSync(PDF_OUT).length / 1024 / 1024).toFixed(1)} MB, ${M.PAGE.width}×${M.PAGE.height}mm.`);
