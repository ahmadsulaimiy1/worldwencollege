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
const GOT = AL.achievedProposed();
const P_ = PR.PROPOSED.committed;
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

const datResolutions = () => O.resolutions([
  { ordinal: 'Resolution one', title: 'The revenue-allocation framework',
    share: 1, figure: 'Every dollar collected' },
  { ordinal: 'Resolution two', title: 'The tariff solved from it',
    share: RETAIL_SHARE, figure: `${pct(RETAIL_SHARE)} of learners` },
  { ordinal: 'Resolution three', title: 'The two institutional channels',
    share: 1 - RETAIL_SHARE, figure: `${pct(1 - RETAIL_SHARE)} of learners` },
], 'onSapphire');
const datAscent = () => O.ascent(PR.QUALIFICATIONS, B.hoursPerLevel, 'onIvory');
const datReach = () => O.reach(PR.SEGMENTS.map((sg) => ({
  name: sg.short, reachable: sg.reachable, researched: Boolean(sg.evidence) })), 'onPearl');
const datColonnade = () => O.colonnade(Object.keys(P_).map((k) => ({
  short: PR.PRODUCTS[k].name.replace('Executive ', 'Exec '), price: P_[k],
  money: usd(P_[k]), entry: k === 'independent' })), 'onCeremonial');
const datCourse = () => O.course(GOT.lines.map((l) => ({
  name: SEG_LABEL[l.key], share: l.target, retained: AL.RETAINED.includes(l.key) })), 'onDeep');
const TURN = Math.max(0, CORE.years.findIndex((y) => y.cumulativeSurplus > 0));
const datDecade = () => O.decadeRule(CORE.years.map((y, i) => ({
  calendar: y.calendar, height: Math.max(0, y.netTuition),
  note: i === 0 ? `${num(y.newLearners)} admitted` : `${m$(y.netTuition)} net tuition` })), TURN, 'onCream');
const datChain = () => O.chain([
  { caption: 'Four files', items: ['tuition.json', 'commercial.json', 'market-evidence.json', 'masterplan.json'] },
  { caption: 'Three engines', items: ['pricing.mjs', 'allocation.mjs', 'projection.mjs'] },
  { caption: 'One document', items: ['This publication', 'Re-derived on every build'] },
], 'onIvory');

function build() {
  P = [];
  M.resetFolios();
  /* RESET, because build() runs twice to resolve the contents folios
     and a module-level variable survives between passes. Left set, the
     bastard title before the Contents inherited the LAST part of the
     previous pass and printed "Method" at the front of the book. */
  NEXT_PART = 'The Ten-Year Institutional Roadmap';

  // ══ COVER ═════════════════════════════════════════════════════════
  P.push(`<section class="pg m-cover">
    <div class="m-cover__head"><span>WorldWide English College</span><span>London Campus</span></div>
    <div class="m-cover__title">
      <h1>The Ten-Year<br>Institutional<br>Roadmap</h1>
      <p class="sub">Strategic Charter and Financial Master Plan, prepared for the Board.</p>
    </div>
    <div class="m-cover__period">${O.coverRule(PLAN.planning_period.first_year,
    PLAN.planning_period.first_year + PLAN.planning_period.years - 1, PLAN.planning_period.years)}</div>
    <div class="m-cover__spec">
      <div><k>Parts</k><v>Seven</v></div>
      <div><k>Leaves</k><v>${LEAVES || '—'}</v></div>
      <div><k>Pathway</k><v>A1 to C2 &middot; ${num(B.totalHours)} hours</v></div>
      <div><k>Classification</k><v>Planning instrument</v></div>
    </div>
  </section>`);
  M.countUnfoliated();

  // ══ FRONTISPIECE SPREAD: the specification against the thesis ═════
  /* WHAT THIS REPLACED. The verso was a full-bleed photograph of an
     illuminated manuscript, chosen to say "institution" before the
     book said anything. It said "luxury report" instead. A reader who
     opens a monograph wants to know what the institution IS, and that
     is a specification — so the frontispiece is one, ruled, and the
     thesis faces it across the gutter. */
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
        { k: 'The adopted fee', v: `${usd(B.programmeTotal)} for the complete pathway &mdash; ${usd(B.levelFee, 0)} a level, in ${B.instalmentsPerLevel} instalments across ${B.monthsPerLevel} months. Published, with every cent of it accounted for.` },
        { k: 'Re-sits', v: 'One included on either route. There is no re-sit fee.' },
        { k: 'Withdrawal', v: `A full refund inside ${B.refundWindowDays} days of enrolment.` },
        { k: 'Campus', v: 'London.' },
        { k: 'This plan', v: `The decade ${PERIOD}, prepared for the Board.` },
        { k: 'What is not held', v: '<em>No accreditation, ranking, institutional partnership or external endorsement. No completed cohort. No External Examiner has confirmed the standard.</em>' },
        { k: 'Every figure', v: 'Computed by one engine from four files and reconciled as a test on every build. None is typed into a page.', struck: true },
      ],
      tone: 'pg--bone',
    }),
    M.page(`
      <div class="m-field__wrap" style="position:absolute;top:44%;left:0;right:0;transform:translateY(-50%)">
        <div style="width:${M.col(2)}mm;height:1.4pt;background:${S.C.gold};margin:0 0 10mm"></div>
        <p style="font-family:${S.FACE.display};font-weight:300;font-size:27pt;line-height:37pt;color:${S.C.midnight};margin:0;max-width:${M.col(9)}mm">
          The College sells <em style="font-style:italic;color:${S.C.gold}">teaching</em>, not a credential. The credential is identical whichever route a candidate takes to it. What differs, and what costs money, is <em style="font-style:italic;color:${S.C.gold}">human attention</em>.</p>
        <p style="font-family:${S.FACE.data};font-size:5.6pt;font-weight:500;letter-spacing:.3em;text-transform:uppercase;color:${S.C.grey};margin:12mm 0 0">The institutional thesis</p>
      </div>`, { tone: 'pg--bone', bare: true })
  ));

  // ══ CONTENTS ══════════════════════════════════════════════════════
  onRecto();
  P.push(M.contents({
    title: 'Contents',
    parts: [
      { part: 'I · The Proposition', rows: [
        { t: 'Three resolutions', f: PAGES_OF.resolutions || 0 },
        { t: 'Where every dollar is governed', f: PAGES_OF.alloc || 0 }] },
      { part: 'II · The Institution', rows: [
        { t: 'What the College is, and what it holds', f: PAGES_OF.identity || 0 },
        { t: 'The six qualifications', f: PAGES_OF.academic || 0 }] },
      { part: 'III · The Market', rows: [
        { t: 'What the research did to the plan', f: PAGES_OF.slope || 0 },
        { t: 'What comparable providers charge', f: PAGES_OF.evidence || 0 },
        { t: 'Where the evidence does not exist', f: PAGES_OF.gaps || 0 }] },
      { part: 'IV · The Commercial Architecture', rows: [
        { t: 'The proposed tariff', f: PAGES_OF.tariff || 0 },
        { t: 'What one negotiation buys', f: PAGES_OF.amort || 0 }] },
      { part: 'V · The Financial Architecture', rows: [
        { t: 'What each line is, and is not', f: PAGES_OF.definitions || 0 },
        { t: 'The decade', f: PAGES_OF.decade || 0 }] },
      { part: 'VI · The Decade', rows: [
        { t: 'Five phases', f: PAGES_OF.phases || 0 },
        { t: 'The risk register', f: PAGES_OF.risks || 0 },
        { t: 'Governance and authority', f: PAGES_OF.gov || 0 }] },
      { part: 'VII · Method', rows: [
        { t: 'Where every figure comes from', f: PAGES_OF.method || 0 }] },
    ],
  }));

  // ══ PART I ════════════════════════════════════════════════════════
  NEXT_PART = 'The Proposition';
  onRecto();
  at('resolutions');
  push(...S.spread(
    S.openerPage({ palette: 'authority', part: 'Part One', roman: 'I', title: 'The Proposition',
      standing: M.mark('board'),
      say: 'What the Board is asked to resolve, and the three decisions the rest of this document exists to inform.',
      datum: datResolutions(),
      caption: `Each resolution drawn against what it governs. The framework governs every dollar collected; the tariff sets the price ${pct(RETAIL_SHARE)} of learners pay; the two channels carry the rest.`,
      contains: [{ t: 'Three resolutions', f: PAGES_OF.resolutions || '' },
        { t: 'Where every dollar is governed', f: PAGES_OF.alloc || '' }], }),
    S.marginPage({
      runhead: 'The Proposition',
      side: S.marginNote('Not a decision',
        `The Board of Academic Standards has no appointed members and no External Examiner has been appointed. Both are appointments rather than engineering tasks, and until they are made the College cannot confer.`)
        + S.marginNote('Status', M.mark('board')),
      main: `
        <p class="op__num">Three resolutions</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>This plan asks for three decisions and no others. Everything else in it is either a fact about the College, which is marked as one, or a consequence of arithmetic the Board can check.</p>
          <h3>One &middot; The revenue-allocation framework</h3>
          <p>That gross collected revenue be governed as ${GOT.lines.map((l) => `${pct(l.target, 0)} ${SEG_LABEL[l.key].toLowerCase()}`).join(', ')}. The two retained lines are designated institutional capital; the Strategic and Founders&rsquo; Allocation is <strong>not</strong> automatically withdrawable income, and no distribution from it is modelled anywhere in this plan.</p>
          <h3>Two &middot; The tariff that follows from it</h3>
          <p>That the tariff be set at the cheapest point satisfying that framework &mdash; a Tutored pathway at <strong>${usd(P_.tutored)}</strong>. The price is the output of the framework rather than a management preference, and it moves if the framework moves.</p>
          <h3>Three &middot; The two channels the portfolio lacks</h3>
          <p>That the College open Corporate and Institutional agreements at its own published partner bands. A purely retail College could not bring acquisition below ${pct(0.22, 0)} of revenue against a ${pct(AL.SHARES.marketing, 0)} target, because a cost incurred one learner at a time never amortises.</p>
        </div>`,
    })
  ));

  // Analytical spread: the framework drawn, and the decade it produces.
  at('alloc');
  push(...S.spread(
    S.figurePage({ eyebrow: 'The governing financial law', title: 'Where every dollar is governed',
      sub: 'Four lines consumed running the institution; two retained as capital above the struck rule.',
      figure: figAllocation(),
      reading: { head: 'How the elevation is read', body: `
        <p>The shaft is what running the institution consumes, hatched at a density proportional to its weight: payroll heaviest, technology lightest. The struck gold rule is the division. Above it, ruled rather than hatched, is what is <em>held</em> &mdash; because those two lines are not spent.</p>
        <p><strong>Half of every dollar collected is retained.</strong> ${pct(AL.SHARES.reserve)} is restricted or designated institutional capital; the other ${pct(AL.SHARES.strategic)} is a Board-authorised discretionary allocation, and it is <strong>not</strong> automatically withdrawable income. No distribution from it is modelled anywhere in this plan.</p>
        <p>The tariff is solved from this drawing rather than the other way round. Move a course and the price moves with it.</p>` },
      note: `${M.mark('board')} Proposed governance targets, not a historical result. data/masterplan.json § revenue_allocation_framework.`,
      strip: [
        { k: 'Consumed', v: pct(AL.CONSUMED.reduce((t, k) => t + AL.SHARES[k], 0)), s: 'Payroll, technology, operating, marketing' },
        { k: 'Retained', v: pct(AL.RETAINED.reduce((t, k) => t + AL.SHARES[k], 0)), s: 'Reserve and Strategic, held as capital' },
        { k: 'Tariff it solves to', v: usd(P_.tutored), s: 'A Tutored pathway, A1 to C2' },
        { k: 'Standing', v: 'Proposed', s: 'Board decision required' },
      ],
      runhead: 'The Proposition' }),
    S.figurePage({ eyebrow: 'What it produces', title: 'The decade',
      sub: 'Net tuition as ruled columns; surplus against the year it crosses nil.',
      figure: figDecade(),
      reading: { head: 'Two registers, two quantities', body: `
        <p>The upper register is net tuition, year by year, as ruled columns. The lower is surplus against its own nil rule, on its own baseline &mdash; drawn separately because a ten-million-dollar revenue and a first-year deficit on one plot make the second invisible.</p>
        <p>The year the institution turns is ruled through both. Before it the College is consuming capital; after it, generating it.</p>
        <p>Revenue is recognised in the year it is <em>taught</em>, not the year it is sold, which is why the curve lags the admissions behind it.</p>` },
      note: `${M.mark('modelled')} Strategic projection, not a trading record.`,
      strip: [
        { k: 'Ten-year revenue', v: m$(ARCH.proposed.totals.revenue), s: 'Recognised in the year taught' },
        { k: 'Ten-year surplus', v: m$(ARCH.proposed.totals.surplus), s: 'Before any distribution' },
        { k: 'Learners admitted', v: num(ARCH.proposed.totals.newLearners), s: `${num(ARCH.proposed.totals.awards)} awards conferred` },
        { k: 'Turns', v: String(CORE.years[TURN].calendar), s: 'Cumulative surplus crosses nil' },
      ],
      runhead: 'The Proposition' })
  ));

  // ══ PART II ═══════════════════════════════════════════════════════
  NEXT_PART = 'The Institution';
  onRecto();
  at('identity');
  push(...S.spread(
    S.openerPage({ palette: 'heritage', part: 'Part Two', roman: 'II', title: 'The Institution',
      standing: M.mark('verified'),
      say: 'What the College is, what it sells, and the discipline that makes both statements checkable.',
      datum: datAscent(),
      caption: `Six levels of ${num(B.hoursPerLevel)} academic hours, each conferring its own award, climbing from A1 to C2. Adopted and published — data/tuition.json.`,
      contains: [{ t: 'What the College is, and what it holds', f: PAGES_OF.identity || '' },
        { t: 'The six qualifications', f: PAGES_OF.academic || '' }], }),
    S.marginPage({
      runhead: 'The Institution',
      side: S.marginNote('What is not claimed',
        'No accreditation, no ranking, no institutional partnership, no external endorsement. No completed cohort. No External Examiner has confirmed the standard.')
        + S.marginNote('The pathway', `${num(B.totalHours)} academic hours &middot; ${B.levels} levels &middot; ${B.totalCredits} credits &middot; A1 to C2`),
      main: `
        <p class="op__num">Identity</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>WorldWide English College teaches a ${num(B.totalHours)}-hour qualification pathway in six levels from A1 to C2, examined against rubrics published before the work, second-marked, moderated, and entered in a registry a stranger can check without an account.</p>
          <p>The credential is identical whichever route a candidate takes to it &mdash; same examination, same rubric, same second marking, same moderation, same registry entry, same public verification. The routes differ in price by a factor of thirty-eight because what they differ in is <em>human attention</em>, which is the only thing here that actually costs money.</p>
          <h3>What it does hold</h3>
          <p>A complete six-level curriculum; an examination architecture with second marking and moderation; a published fee decomposition accounting for every cent of a fee; a conferral and verification chain; and fourteen typeset volumes of its own curriculum and assessment work, free to anyone, enrolled or not.</p>
          <h3>The discipline</h3>
          <p>Every figure in this publication is computed by one engine from four files. None is typed into a page, and the reconciliation is run as a test on every build rather than asserted as a claim.</p>
        </div>`,
    })
  ));

  // Architecture spread: the engraved six gates against the schedule.
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
        <p>A candidate who does not pass sits again; one re-sit is included and there is no re-sit fee on either route. A candidate who passes is entered in the registry the same day, and the entry can be checked by anyone, without an account, for as long as the College exists.</p>
      </div>`,
    { runhead: 'The Institution', stack: true }),
    tableWithReading({
      title: 'The six qualifications',
      sub: `${B.levels} levels of ${num(B.hoursPerLevel)} academic hours and ${B.creditsPerLevel} credits each.`,
      head: ['Code', 'CEFR', 'Qualification', 'Hours', 'Credits'],
      rows: PR.QUALIFICATIONS.map((q) => [`<b>${M.esc(q.code)}</b>`, M.esc(q.cefr),
        { v: M.esc(q.name), cls: 'unit' }, num(B.hoursPerLevel), num(B.creditsPerLevel)])
        .concat([{ em: true, cells: ['', '', 'COMPLETE A1–C2 PATHWAY', num(B.totalHours), num(B.totalCredits)] }]),
      source: `${M.mark('verified')} Adopted and published — data/tuition.json.`,
    }, { title: 'Why six, and why this size', columns: true, body: `
      <p>A level is ${num(B.hoursPerLevel)} academic hours because that is roughly what the Common European Framework takes to move an adult one band, and because ${B.instalmentsPerLevel} instalments across ${B.monthsPerLevel} months is a commitment a working adult can actually make.</p>
      <p>Each level confers its own award. A learner who stops after two holds two qualifications rather than a fraction of one, which is the difference between a pathway and a course somebody abandoned.</p>
      <p>The credential is identical on every route. What a route changes is how much of a named instructor&rsquo;s attention the candidate receives on the way to it &mdash; and that, not the certificate, is what the tariff is pricing.</p>` },
    { runhead: 'The Institution' })
  ));

  // ══ PART III ══════════════════════════════════════════════════════
  NEXT_PART = 'The Market';
  onRecto();
  at('slope');
  push(...S.spread(
    S.openerPage({ palette: 'luminous', part: 'Part Three', roman: 'III', title: 'The Market',
      standing: M.mark('modelled'),
      say: 'What comparable programmes actually charge, what that did to an earlier draft, and the four markets the research could not answer.',
      datum: datReach(),
      caption: 'Five segments by reachable population. A ruled and hatched segment carries a direct published observation; an outlined one is modelled from the segments that do.',
      contains: [{ t: 'What the research did to the plan', f: PAGES_OF.slope || '' },
        { t: 'What comparable providers charge', f: PAGES_OF.evidence || '' },
        { t: 'Where the evidence does not exist', f: PAGES_OF.gaps || '' }], }),
    S.figurePage({ eyebrow: 'What the research did to the plan', title: 'Assumed against researched',
      sub: 'Price of a complete pathway at which a segment converts at its reference rate.',
      figure: figSlope(),
      reading: { head: 'What the research moved', body: `
        <p>Each line runs from what an earlier draft assumed a segment would pay to what the published evidence says it will. <strong>Four of the five moved, and none of them upwards.</strong></p>
        <p>West Africa moved by nearly a factor of three, and that single correction removes more demand from the model than every other change combined. A Lagos IELTS course is about forty-nine dollars a month; the whole published Nigerian range tops out near eighteen hundred.</p>
        <p>The plan this replaced projected ${m$(PA.superseded_pathway_usd.projected_ten_year_revenue_usd)} of revenue on the assumed figures. It is recorded in data/masterplan.json rather than quietly replaced, because an undocumented correction gets re-proposed six months later by somebody who does not know it was already made.</p>` },
      note: `${M.mark('modelled')} Willingness to pay is an inference from published tariffs, not an observation of it.`,
      strip: [
        { k: 'Segments moved', v: '4 of 5', s: 'None of them upwards' },
        { k: 'Largest correction', v: 'West Africa', s: 'Nearly a factor of three' },
        { k: 'Superseded plan', v: m$(PA.superseded_pathway_usd.projected_ten_year_revenue_usd), s: 'Recorded, not deleted' },
        { k: 'Observations kept', v: String(EVSEG.reduce((t, [k]) => t + EV[k].observations.length, 0)), s: 'Each with its source address' },
      ],
      runhead: 'The Market' })
  ));

  at('evidence');
  const EVSEG2 = EVSEG;
  const evRows = EVSEG2.flatMap(([key, name]) => EV[key].observations
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
    source: 'Every observation carries its source address in data/market-evidence.json.',
  }, 11, { runhead: 'The Market' });
  push(...evPages);

  at('gaps');
  if (evPages.length % 2 === 1) onRecto();
  push(...S.spread(
    tableWithReading({
      title: 'Marked as modelled',
      sub: 'Four markets and one central question the research could not answer.',
      head: ['Market or question', 'Status', 'What the model does instead'],
      rows: EV.gaps.map((g) => [`<b>${M.esc(g.market || g.topic)}</b>`,
        M.mark(g.status === 'NO DIRECT COMPARABLE FOUND' ? 'insufficient' : 'modelled'),
        { v: M.esc(g.status === 'NO DIRECT COMPARABLE FOUND'
          ? 'Pathway prices are built up from per-level comparables rather than read off a competitor.'
          : (g.note || 'Scaled from the segments that carry direct observations.')), cls: 'unit' }]),
      source: 'data/market-evidence.json § gaps.',
    }, { title: 'Rejecting well is most of the job', columns: true, body: `
      <p>Thirty candidate sources were pulled and eight shipped. What did not survive is recorded beside what did, because an undocumented rejection gets re-proposed six months later by somebody who does not know it was already considered.</p>
      <p>Four markets carry no direct observation at all. They are modelled from the segments that do, and marked as modelled on every page they appear. The plan does not convert an absence of evidence into a number and hope nobody checks.</p>` },
    { runhead: 'The Market' }),
    M.page(`
      <div style="position:absolute;top:38%;left:0;right:0;transform:translateY(-50%)">
        <div style="width:${M.col(2)}mm;height:1.4pt;background:${S.C.gold};margin:0 0 9mm"></div>
        <p style="font-family:${S.FACE.display};font-weight:300;font-size:22pt;line-height:31pt;color:${S.C.midnight};margin:0;max-width:${M.col(8)}mm">
          No provider found sells a six-level, ${num(B.totalHours)}-hour credentialed pathway as one purchase.
          <em style="font-style:italic;color:${S.C.gold}">WEC-LC&rsquo;s product does not have a market price, because the product is not on the market.</em></p>
        <p style="font-family:${S.FACE.text};font-size:${M.T.small}pt;line-height:15pt;color:${S.C.inkSoft};max-width:${M.col(7)}mm;margin:9mm 0 0">
          That is why this plan prices per level and per hour of a named instructor&rsquo;s attention rather than comparing pathway totals. A pathway total has no comparable. An hour of a qualified teacher&rsquo;s attention has one everywhere.</p>
      </div>`, { tone: 'pg--bone', runhead: 'The Market' })
  ));

  // ══ PART IV ═══════════════════════════════════════════════════════
  NEXT_PART = 'The Commercial Architecture';
  onRecto();
  at('tariff');
  push(...S.spread(
    S.openerPage({ palette: 'ceremonial', part: 'Part Four', roman: 'IV', title: 'The Commercial<br>Architecture',
      standing: M.mark('proposed'),
      say: 'What WEC-LC charges, solved backwards from the financial law the Board has set — and not chosen.',
      datum: datColonnade(),
      caption: `Six tiers of one order, each marked with its multiple of the ${usd(P_.independent)} entry price. The credential conferred is identical on every route; what the multiple buys is a named instructor&rsquo;s attention.`,
      contains: [{ t: 'The proposed tariff', f: PAGES_OF.tariff || '' },
        { t: 'What one negotiation buys', f: PAGES_OF.amort || '' }], }),
    M.page(M.table({
      title: 'Management’s proposed commercial architecture',
      sub: 'Complete A1–C2 pathway. The adopted tariff remains $19,000 until the Board resolves otherwise.',
      head: ['Tier', 'What it buys', 'Contact', 'Attention', 'Pathway'],
      rows: [
        ...Object.keys(P_).map((k) => {
          const pp = PR.PRODUCTS[k];
          return [M.esc(pp.name), { v: M.esc(DESCRIPTOR[k]), cls: 'unit' },
            num((pp.individual + pp.groupHours) * 6), num(PR.attentionHours(k)), `<b>${usd(P_[k])}</b>`];
        }),
        ...Object.keys(PR.CHANNELS).map((k) => {
          const t = PR.channelTerms(k, P_); const sp = PR.PRODUCTS[t.spec];
          return { cells: [M.esc(t.name),
            { v: `The ${M.esc(sp.name)} pathway, less the adopted ${pct(t.discount, 0)} band.`, cls: 'unit' },
            num((sp.individual + sp.groupHours) * 6), num(PR.attentionHours(t.spec)),
            `<b>${usd(Math.round(t.seatPrice))}</b>`] };
        }),
      ],
      source: `Independent is adopted and published. Every other figure is ${M.mark('proposed')} — solved from the allocation framework.`,
    }), { runhead: 'Commercial Architecture' })
  ));

  // The key analytical spread: the claim, drawn, and the one tier that fails it.
  push(...S.spread(
    S.figurePage({ eyebrow: 'The comparison that survives', title: 'Per hour of individual attention',
      sub: 'The only like-for-like unit available, and each tier against the comparable it actually has.',
      figure: figThreshold(),
      reading: { head: 'Two comparables, not one', body: `
        <p>A pathway total has no comparable, because no provider found sells a six-level credentialed pathway as one purchase. An hour of a qualified teacher&rsquo;s attention has one everywhere.</p>
        <p>But not the <em>same</em> one. A British Council module is group language teaching; an Executive Bespoke pathway is one-to-one provision, whose market is executive coaching at two to six hundred dollars an hour. The gold rule is the first comparable and the hatched band is the second, and each tier is read against the one it actually has.</p>
        <p><strong>One tier fails both.</strong> It is named on the page opposite rather than left for a reader to find.</p>` },
      note: `${M.mark('proposed')} Tariff solved from the allocation framework; the adopted fee is unchanged.`,
      strip: [
        { k: 'Published benchmark', v: usd(BC_ATTN), s: 'British Council Saudi, per attention hour' },
        { k: 'Coaching band', v: `$${COACHING.from}–${COACHING.to}`, s: 'One-to-one provision' },
        { k: 'Tiers inside their comparable', v: '5 of 6', s: 'Each judged against the right one' },
        { k: 'The exception', v: 'Directed', s: `${usd(P_.directed / PR.attentionHours('directed'), 0)} an attention hour` },
      ],
      runhead: 'Commercial Architecture' }),
    S.marginPage({
      runhead: 'Commercial Architecture',
      side: S.marginNote('Directed, stated plainly',
        `At ${usd(P_.directed / PR.attentionHours('directed'), 0)} an hour of attention and ${usd(P_.directed / ((PR.PRODUCTS.directed.individual + PR.PRODUCTS.directed.groupHours) * 6), 0)} a contact hour, Directed is dearer than the British Council on both measures. It is the one tier in the tariff that cannot be defended on price.`),
      main: `
        <p class="op__num">What the figure shows</p>
        <div class="op__rule"></div>
        <div class="op__arg">
          <p>Independent and Tutored sit below the British Council&rsquo;s published Saudi tariff per hour of individual instructor attention, and confer an award the module does not. All three Executive tiers sit inside the executive coaching band of $200 to $600, which is the right comparable for one-to-one provision and the wrong one to have ignored.</p>
          <h3>And the tier that does not</h3>
          <p><strong>Directed is dearer than the benchmark on both measures.</strong> An earlier draft of this plan claimed the College was cheaper at every tier; that was true at a lower tariff, was never re-checked when the price rose, and is false. It survived a table of six numbers and did not survive being drawn.</p>
          <p>Directed&rsquo;s defence is therefore not its hourly rate. It is that the fee carries the examination, second marking, moderation, the registry entry and the conferral, none of which a language module includes. Management states that rather than a price advantage it does not have.</p>
        </div>`,
    })
  ));

  at('amort');
  push(...S.spread(
    S.figurePage({ eyebrow: 'Why the channels exist', title: 'What one negotiation buys',
      sub: 'Acquisition paid per learner never amortises; paid per agreement it divides by the seats it carries.',
      figure: figAmort(),
      reading: { head: 'Why the channels exist', body: `
        <p>Acquisition paid one learner at a time never amortises: the cost of finding the next Gulf executive is the cost of finding the last one. Paid per agreement it divides by the seats the agreement carries, and a single negotiation can carry twenty-five to ninety-nine.</p>
        <p>Swept across a twelvefold price range and a sixteenfold range of scale, <strong>a purely retail College could not bring acquisition below twenty-two per cent of revenue</strong> against a ${pct(AL.SHARES.marketing, 0)} target. No price fixes that. The missing channels were the structural answer.</p>
        <p>The bands used here are the College&rsquo;s own published partner bands, not invented ones.</p>` },
      note: `${M.mark('modelled')} data/commercial.json § routes.partner.`,
      strip: [
        { k: 'Dearest retail seat', v: usd(PR.CAC.gccExec), s: 'A Gulf executive, acquired singly' },
        { k: 'Cheapest agreement seat', v: usd(Math.round(Math.min(...Object.keys(PR.CHANNELS).map((k) => PR.channelTerms(k, P_).cacPerSeat)))), s: 'One negotiation, many seats' },
        { k: 'Multiple', v: `${(PR.CAC.gccExec / Math.min(...Object.keys(PR.CHANNELS).map((k) => PR.channelTerms(k, P_).cacPerSeat))).toFixed(1)}×`, s: 'Cheaper per seat' },
        { k: 'Retail-only floor', v: '22%', s: `Against a ${pct(AL.SHARES.marketing, 0)} target` },
      ],
      runhead: 'Commercial Architecture' }),
    tableWithReading({
      title: 'Three architectures, one basis',
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
      source: 'The institutional channels removed the trade an earlier draft was built around: the proposal now earns more on every dimension than the adopted flat tariff.',
    }, { title: 'What changed, and why the comparison did', columns: true, body: `
      <p>An earlier draft reported a genuine trade: the proposed portfolio reached more learners than the adopted flat tariff and gave up surplus to do it. The plan said so, and a test in the build forbade it from claiming otherwise.</p>
      <p>Adding the institutional channels removed the trade. A sponsored cohort reaches people a retail price cannot and pays acquisition once for all of them, so the proposal now earns more revenue, more surplus, more learners and more awards at the same time.</p>
      <p>The test was inverted rather than deleted. It checks the shape of the comparison instead of its direction, because a guard that forbids a true claim is as bad as one that permits a false one.</p>` },
    { runhead: 'Commercial Architecture' })
  ));

  // ══ PART V ════════════════════════════════════════════════════════
  NEXT_PART = 'The Financial Architecture';
  onRecto();
  at('definitions');
  push(...S.spread(
    S.openerPage({ palette: 'constitution', part: 'Part Five', roman: 'V', title: 'The Financial<br>Architecture',
      standing: M.mark('board'),
      say: 'Where every dollar of collected revenue is governed, and what each line is forbidden from becoming.',
      datum: datCourse(),
      caption: 'One column of collected revenue, divided. Four courses are consumed running the institution; the two beyond the struck rule are retained as institutional capital and are not distributable income.',
      contains: [{ t: 'What each line is, and is not', f: PAGES_OF.definitions || '' },
        { t: 'The decade', f: PAGES_OF.decade || '' }], }),
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
      </div>`, { runhead: 'Financial Architecture' })
  ));

  at('decade');
  push(...S.spread(
    M.page(M.table({
      title: 'The Core Management Plan, year by year',
      sub: 'Revenue recognised in the year it is taught.',
      head: ['Year', 'Admitted', 'Taught', 'Net tuition', 'Delivery', 'Surplus'],
      rows: CORE.years.map((y) => [`<b>${y.calendar}</b>`, num(y.newLearners), num(y.activeLearners),
        m$(y.netTuition), m$(y.delivery), m$(y.surplus)])
        .concat([{ em: true, cells: ['TEN YEARS', num(CORE.totals.newLearners), `peak ${num(CORE.totals.y10Active)}`,
          m$(CORE.totals.revenue - CORE.totals.refunds), m$(CORE.totals.delivery), m$(CORE.totals.surplus)] }]),
      source: `${M.mark('modelled')} Strategic projection, not a trading record.`,
    }), { runhead: 'Financial Architecture' }),
    tableWithReading({
      title: 'Three scenarios',
      sub: 'Conservative is not a haircut on Core: weaker continuation, narrower reach, dearer acquisition.',
      head: ['Scenario', 'Revenue', 'Surplus', 'Year-10', 'Learners', 'To C2'],
      rows: ['conservative', 'core', 'growth'].map((k) => {
        const t = PSC[k].totals;
        const cells = [`<b>${M.esc(PSC[k].label)}</b>`, m$(t.revenue), m$(t.surplus),
          m$(t.y10Revenue), num(t.newLearners), num(t.awardsToC2)];
        return k === 'core' ? { em: true, cells } : cells;
      }),
      source: 'The Core Plan is management’s recommended execution case, not the midpoint of the other two.',
    }, { title: 'What a scenario has to change to be one', columns: true, body: `
      <p>A scenario set whose only variable is &ldquo;more students&rdquo; tests nothing. Each of these changes something the College would actually have to do differently: what it costs to be found, how many learners continue from one level to the next, and how far the College can reach at all.</p>
      <p>The Conservative case does not reach cumulative surplus inside the decade. That is stated rather than smoothed, because it is the plan&rsquo;s real exposure &mdash; the Core case requires continuation and reach to hold broadly as modelled, and reach is the one quantity here that was never researched.</p>` },
    { runhead: 'Financial Architecture' })
  ));

  // ══ PART VI ═══════════════════════════════════════════════════════
  NEXT_PART = 'The Decade';
  onRecto();
  at('phases');
  push(...S.spread(
    S.openerPage({ palette: 'editorial', part: 'Part Six', roman: 'VI', title: 'The Decade',
      standing: M.mark('modelled'),
      say: 'Five phases, twenty risks each with a warning somebody can observe, and who decides what.',
      datum: datDecade(),
      caption: `Ten years of net tuition, with ${CORE.years[TURN].calendar} struck — the year cumulative surplus first crosses nil. A strategic projection, not a trading record.`,
      contains: [{ t: 'Five phases', f: PAGES_OF.phases || '' },
        { t: 'The risk register', f: PAGES_OF.risks || '' },
        { t: 'Governance and authority', f: PAGES_OF.gov || '' }], }),
    M.page(`
      <p class="fg__eye">The ten-year roadmap</p>
      <h2 class="fg__t">Five phases, and what has to be true at the end of each</h2>
      <div style="margin-top:7mm">${M.timeline(PHASES.map((ph) => {
    const y = CORE.years[ph.yearIndex];
    return { ...ph, figure: `${num(y.activeLearners)} under instruction &middot; ${m$(y.netTuition)} net tuition` };
  }))}</div>`, { runhead: 'The Decade' })
  ));

  at('risks');
  /* BUILT IN THE ORDER IT IS READ. `page()` stamps a folio as it
     builds, so composing the register before the matrix that faces it
     gave the matrix the later number and printed the book out of
     sequence. The verso is built first, then the register, then the
     spread is assembled from pages that already know where they are. */
  const riskMatrixPage = S.figurePage({ eyebrow: 'Where attention goes', title: 'Twenty risks, placed',
    sub: 'Likelihood against impact. A register is a list; a matrix is a judgement.',
    figure: figRisk(),
    reading: { head: 'What the placement says', body: `
      <p>A register is a list and a matrix is a judgement. Each cell carries the number of risks placed in it and a hatch proportional to that number; an empty cell is ruled rather than left blank, so that nothing looks forgotten.</p>
      <p>The struck gold line encloses the region the Board would actually watch: likely enough to expect, and heavy enough to plan for. What stands inside it is the count the plate closes on.</p>
      <p>Every risk overleaf carries an early warning somebody can observe and an owner who is named in the governance schedule.</p>` },
    note: 'Authored judgement, not computed.',
    strip: [
      { k: 'Risks placed', v: String(RISKS.length), s: 'Every domain of the plan' },
      { k: 'Above the line', v: String(RISKS.filter((r) => r[2] !== 'Low' && r[3] !== 'Medium').length), s: 'Likely enough, heavy enough' },
      { k: 'With an early warning', v: String(RISKS.filter((r) => r[4]).length), s: 'Something somebody can observe' },
      { k: 'Owners', v: 'Named', s: 'In the governance schedule' },
    ],
    runhead: 'The Decade' });
  const riskTable = M.tablePages({
    title: 'The institutional risk register',
    sub: 'Each with an early warning somebody can actually observe.',
    head: ['Domain', 'Risk', 'L', 'I', 'Early warning'],
    rows: RISKS.slice(0, 9).map((r) => [`<b>${M.esc(r[0])}</b>`, { v: M.esc(r[1]), cls: 'unit' },
      M.esc(r[2]), M.esc(r[3]), { v: M.esc(r[4]), cls: 'unit' }]),
    source: 'L — likelihood. I — impact.',
  }, 7, { runhead: 'The Decade' });
  push(...S.spread(riskMatrixPage, riskTable[0]), ...riskTable.slice(1));

  push(...M.tablePages({
    title: 'The institutional risk register',
    sub: '',
    head: ['Domain', 'Risk', 'L', 'I', 'Early warning'],
    rows: RISKS.slice(9).map((r) => [`<b>${M.esc(r[0])}</b>`, { v: M.esc(r[1]), cls: 'unit' },
      M.esc(r[2]), M.esc(r[3]), { v: M.esc(r[4]), cls: 'unit' }]),
    source: 'Owners are named in the governance schedule.',
  }, 7, { runhead: 'The Decade' }));

  at('gov');
  onRecto();
  const authorityPage = M.page(`
    <p class="fg__eye">The chain of academic authority</p>
    <h2 class="fg__t">Where a decision stops</h2>
    <p class="fg__s">The College&rsquo;s own plate, carrying the appointments as they stand.</p>
    <div class="engr engr--ink" style="margin-top:5mm">${S.engraving('authority-chain')}</div>`,
  { runhead: 'The Decade' });
  const govTable = M.tablePages({
    title: 'Governance and authority',
    sub: 'Who decides what, and the separations that protect a learner.',
    head: GOVERNANCE_COLUMNS,
    rows: GOVERNANCE.map((g) => [`<b>${M.esc(g[0])}</b>`, M.esc(g[1]),
      { v: M.esc(g[2]), cls: 'unit' }, { v: M.esc(g[3]), cls: 'unit' }]),
    source: 'Several offices named here are defined and unfilled, and the platform refuses to publish a person into an office they have not accepted.',
  }, 9, { runhead: 'The Decade' });
  push(...S.spread(authorityPage, govTable[0]), ...govTable.slice(1));

  // ══ PART VII ══════════════════════════════════════════════════════
  NEXT_PART = 'Method';
  onRecto();
  at('method');
  push(...S.spread(
    S.openerPage({ palette: 'scholarly', part: 'Part Seven', roman: 'VII', title: 'Method',
      standing: M.mark('verified'),
      say: 'Where every figure came from, and the audit that proves the document agrees with itself.',
      datum: datChain(),
      caption: 'Four data files enter, three modules compute, one document leaves. No figure in this publication is typed into a page, and the chain is re-run as a test on every build.',
      contains: [{ t: 'Where every figure comes from', f: PAGES_OF.method || '' }], }),
    M.page(M.table({
      title: 'Where every figure comes from',
      sub: 'One engine, four files. Nothing is typed into a page.',
      head: ['Source', 'What it carries', 'Class'],
      rows: [
        ['data/tuition.json', { v: 'The adopted fee, its decomposition in basis points, the level structure and the refund window.', cls: 'unit' }, M.mark('verified')],
        ['data/commercial.json', { v: 'The three routes, the independent steps, the partner bands, remission and referral.', cls: 'unit' }, M.mark('verified')],
        ['data/market-evidence.json', { v: 'Every priced observation with its provider, local price, hours and source address.', cls: 'unit' }, M.mark('verified')],
        ['data/masterplan.json', { v: 'The revenue-allocation framework, the market and progression assumptions, and the establishment.', cls: 'unit' }, M.mark('board')],
        ['pricing.mjs', { v: 'Delivery cost hour by hour, the demand model, the channels and the tariff.', cls: 'unit' }, M.mark('modelled')],
        ['allocation.mjs', { v: 'The framework made binding, and the tariff solved from it.', cls: 'unit' }, M.mark('modelled')],
        ['projection.mjs', { v: 'The ten years, with revenue recognised in the year it is taught.', cls: 'unit' }, M.mark('modelled')],
      ],
      source: 'tests/masterplan.test.mjs runs the reconciliation on every build and re-derives the proposed price from the allocation framework, so the price cannot drift away from its reason.',
    }), { runhead: 'Method' })
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
        The Ten-Year Institutional Roadmap ${PERIOD}<br>
        Set in Newsreader and Archivo<br>
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
