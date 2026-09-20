/**
 * THE MONOGRAPH — rendered.
 *
 * Content comes from the same engine as everything else. This file
 * decides only where it sits on a page, and it composes pages rather
 * than letting content flow into them.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import path from 'node:path';
import * as M from './monograph.mjs';
import { PLAN, basis } from './masterplan.mjs';
import * as PR from './pricing.mjs';
import * as AL from './allocation.mjs';
import { scenarios as priceScenarios, architectures } from './projection.mjs';
import { RISKS, RISK_COLUMNS, GOVERNANCE, GOVERNANCE_COLUMNS, PHASES } from './plan-narrative.mjs';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'publication');
const FACES = readFileSync(path.join(ROOT, 'assets/fonts/monograph-faces.css'), 'utf8');

const B = basis();
const ARCH = architectures();
const PSC = priceScenarios();
const CORE = PSC.core;
const CY10 = CORE.years[CORE.years.length - 1];
const GOT = AL.achievedProposed();
const PATH_ = PR.PROPOSED.committed;
const PA = PLAN.proposed_architecture;

/* The allocation diagram's colours run from midnight through greys for
   the four consumed lines, then to gold for the two retained — so the
   division the framework turns on is legible before a word is read. */
const SEG_COLOUR = { payroll: M.C.midnight, technology: '#26405C', opex: '#42596F',
  marketing: '#677D91', reserve: M.C.gold, strategic: M.C.goldLeaf };
/* Labels, not first words. Taking the first word of each name turned
   "Institutional Reserve" into INSTITUTIONAL, which names the wrong
   thing on the one diagram that has to be unambiguous. */
const SEG_LABEL = { payroll: 'PAYROLL', technology: 'TECHNOLOGY', opex: 'OPERATING',
  marketing: 'MARKETING', reserve: 'RESERVE', strategic: 'STRATEGIC' };
const EV = JSON.parse(readFileSync(path.join(ROOT, 'data/market-evidence.json'), 'utf8'));
const PERIOD = `${PLAN.planning_period.first_year}–${PLAN.planning_period.first_year + PLAN.planning_period.years - 1}`;

const usd = (n, d = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const m$ = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(n / 1e6).toFixed(1) + 'M';
const num = (n) => Number(Math.round(n)).toLocaleString('en-US');
const pct = (x, d = 0) => (x * 100).toFixed(d) + '%';

/* A SCHEDULE IS NOT A BROCHURE.
   The first proof set each tier's full prose description inside the
   table, which produced five-line cells, wildly uneven row heights and
   a table that ran off the bottom of the page taking its last row with
   it. What a tier buys is explained in the narrative; what the table
   has to do is let a Board read eight prices down one column. */
const DESCRIPTOR = {
  independent: 'Examination, moderation and the award. No teaching.',
  directed: 'Seminar teaching in a group of fourteen, with marked work.',
  tutored: 'A named instructor, individual tutorials, every piece marked.',
  execCore: 'A cohort of six, scheduled around professional obligations.',
  execPremium: 'One to one throughout, with a named academic adviser.',
  execBespoke: 'One to one, on material authored to the holder\u2019s own field.',
};

let P = [];
const add = (html) => P.push(html);
/** Open a chapter or part on a recto, as a bound book does. */
const onRecto = () => { if (!M.nextIsRecto()) add(M.blankVerso()); };

/* ────────────────────────────────────────────────────────────────────
   TWO PASSES, BECAUSE A CONTENTS PAGE CANNOT KNOW ITS OWN BOOK.

   The folio a section starts on is only known once everything before it
   has been composed, and the contents page sits near the front. The
   book is therefore built twice: the first pass records where each part
   begins, the second sets those numbers into the contents. Anything
   that changes a page count changes them both, which is the point.
   ──────────────────────────────────────────────────────────────────── */
let PAGES_OF = {};
const at = (key) => { PAGES_OF[key] = M.folioNow() + 1; };

function build() {
  P = [];
  M.resetFolios();

  // ══ FRONT MATTER ══════════════════════════════════════════════════
  add(`<section class="pg m-cover">
    <div class="m-cover__frame"></div>
    <div class="m-cover__mark"><span class="inscr">WorldWide English College</span></div>
    <div class="m-cover__rule"></div>
    <div class="m-cover__title">
      <h1>The Ten-Year<br>Institutional Roadmap</h1>
      <p class="sub">Strategic Charter &amp; Financial Master Plan</p>
    </div>
    <div class="m-cover__period"><span>${PERIOD}</span></div>
    <div class="m-cover__foot">London Campus &middot; Prepared for the Board<br>Planning instrument &mdash; not a record of trading</div>
  </section>`);
  M.countUnfoliated();

  add(M.colourField({
    quote: `The College sells <em>teaching</em>, not a credential.<br>The credential is identical whichever route a candidate takes to it. What differs, and what costs money, is <em>human attention</em>.`,
    attribution: 'The institutional thesis',
  }));

  add(M.contents({
    title: 'Contents',
    parts: [
      { part: 'I · The Proposition', rows: [
        { t: 'What the Board is asked to resolve', f: PAGES_OF.proposition || 0 },
        { t: 'The decade in one view', f: PAGES_OF.summary || 0 }] },
      { part: 'II · The Institution', rows: [
        { t: 'What the College is, and what it holds', f: PAGES_OF.identity || 0 },
        { t: 'The academic and credit architecture', f: PAGES_OF.academic || 0 }] },
      { part: 'III · The Market', rows: [
        { t: 'What comparable providers actually charge', f: PAGES_OF.evidence || 0 },
        { t: 'Willingness to pay, assumed against researched', f: PAGES_OF.wtp || 0 },
        { t: 'Where the evidence does not exist', f: PAGES_OF.gaps || 0 }] },
      { part: 'IV · The Commercial Architecture', rows: [
        { t: 'The proposed tariff', f: PAGES_OF.tariff || 0 },
        { t: 'Price per hour of instructor attention', f: PAGES_OF.attention || 0 },
        { t: 'Three architectures, one basis', f: PAGES_OF.arch || 0 }] },
      { part: 'V · The Financial Architecture', rows: [
        { t: 'Where every dollar is governed', f: PAGES_OF.alloc || 0 },
        { t: 'The Core Management Plan, year by year', f: PAGES_OF.decade || 0 },
        { t: 'Three scenarios', f: PAGES_OF.scenarios || 0 }] },
      { part: 'VI · The Decade', rows: [
        { t: 'Five phases', f: PAGES_OF.phases || 0 },
        { t: 'The institutional risk register', f: PAGES_OF.risks || 0 },
        { t: 'Governance and authority', f: PAGES_OF.gov || 0 }] },
      { part: 'VII · Method', rows: [
        { t: 'Assumptions, sources and reconciliation', f: PAGES_OF.method || 0 }] },
    ],
  }));

  // ══ PART I · THE PROPOSITION ══════════════════════════════════════
  onRecto();
  add(M.partOpener({ numeral: 'Part One', title: 'The Proposition',
    say: 'What the Board is asked to resolve, and the three decisions the rest of this document exists to inform.',
    contents: ['The resolution sought', 'The decade in one view', 'What is not yet held'] }));

  at('proposition');
  add(M.narrative({ runhead: 'The Proposition', single: true,
    head: `<p class="eyebrow">What the Board is asked to resolve</p>
      <h2 style="margin-top:0">Three resolutions</h2>`,
    body: `
      <p class="drop">This plan asks for three decisions and no others. Everything else in it is either a fact about the College, which is marked as one, or a consequence of arithmetic the Board can check.</p>
      <h3>One &middot; The revenue-allocation framework</h3>
      <p>That gross collected revenue be governed as ${GOT.lines.map((l) => `${pct(l.target, 0)} ${l.name.toLowerCase()}`).join(', ')}. The two retained lines are designated institutional capital. The Strategic and Founders&rsquo; Allocation is <strong>not</strong> automatically withdrawable income, and no distribution from it is modelled anywhere in this plan. ${M.mark('board')}</p>
      <h3>Two &middot; The commercial architecture that follows from it</h3>
      <p>That the tariff be set at the cheapest point satisfying that framework: a Tutored pathway at <strong>${usd(PATH_.tutored)}</strong>, with the full schedule on page ${String(PAGES_OF.tariff || 0).padStart(2, '0')}. The price is the output of the framework rather than a management preference, and it moves if the framework moves. ${M.mark('board')}</p>
      <h3>Three &middot; The two channels the portfolio does not yet contain</h3>
      <p>That the College open Corporate and Institutional agreements at its own published partner bands. Swept across a twelvefold price range and a sixteenfold range of scale, a purely retail College could not bring acquisition below ${pct(0.22, 0)} of revenue against a ${pct(AL.SHARES.marketing, 0)} target, because a cost incurred one learner at a time never amortises. ${M.mark('board')}</p>
      <h3>And one thing that is not a decision</h3>
      <p>The Board of Academic Standards has no appointed members and no External Examiner has been appointed. Both are appointments rather than engineering tasks, and until they are made the College cannot confer. Every surface that would carry those names already exists and already renders.</p>`,
  }));

  at('summary');
  add(M.heroMetric({
    eyebrow: 'Retained for reserve and strategic allocation',
    value: pct(GOT.retainedShare, 1),
    say: `The tariff is the cheapest one at which the institution retains what its own financial law requires.`,
    note: `Against a target of ${pct(AL.SHARES.reserve + AL.SHARES.strategic, 0)}. ${M.mark('board')}`,
    runhead: 'The Proposition',
  }));

  add(M.narrative({ runhead: 'The Proposition', single: true,
    head: `<p class="eyebrow">The decade in one view</p><h2 style="margin-top:0">What the plan produces</h2>`,
    body: M.table({
      title: 'The Core Management Plan at maturity',
      sub: 'Strategic projection on modelled assumptions. Not a record of trading.',
      head: ['', 'Ten years', 'Year 10'],
      rows: [
        ['Gross revenue', m$(ARCH.proposed.totals.revenue), m$(CY10.revenue)],
        ['Operating surplus', m$(ARCH.proposed.totals.surplus), m$(CY10.surplus)],
        ['Learners admitted', num(ARCH.proposed.totals.newLearners), num(CY10.newLearners)],
        ['Learners under instruction', '—', num(CY10.activeLearners)],
        ['Level awards conferred', num(ARCH.proposed.totals.awards), num(CY10.totalAwards)],
        ['Award-holders', num(ARCH.proposed.totals.alumni), '—'],
        { em: true, cells: ['Revenue retained under the framework', pct(GOT.retainedShare, 1), m$(GOT.retained)] },
      ],
      source: `WEC-LC Financial Model. ${M.mark('modelled')} throughout.`,
    }),
  }));

  // ══ PART II · THE INSTITUTION ═════════════════════════════════════
  onRecto();
  add(M.partOpener({ numeral: 'Part Two', title: 'The Institution',
    say: 'What the College is, what it sells, and the discipline that makes both statements checkable.',
    contents: ['Identity', 'Academic architecture', 'The credit structure', 'What is held and what is not'] }));

  at('identity');
  add(M.narrative({ runhead: 'The Institution',
    head: `<p class="eyebrow">Identity</p><h2 style="margin-top:0">What the College is, and what it holds</h2>`,
    body: `
      <p class="drop">WorldWide English College teaches a ${num(B.totalHours)}-hour qualification pathway in six levels from A1 to C2, examined against rubrics published before the work, second-marked, moderated, and entered in a registry a stranger can check without an account.</p>
      <p>The credential is identical whichever route a candidate takes to it &mdash; same examination, same rubric, same second marking, same moderation, same registry entry, same public verification. The routes differ in price by a factor of thirty-eight because what they differ in is <em>human attention</em>, which is the only thing here that actually costs money.</p>
      <h3>What the College does not claim</h3>
      <p>It holds no third-party accreditation, no ranking, no institutional partnership and no external endorsement. It has not completed a cohort. No External Examiner has confirmed its standard. These are stated here rather than discovered later, and nothing in this plan assumes any of them changes.</p>
      <h3>What it does hold</h3>
      <p>A complete six-level curriculum of ${num(B.totalHours)} academic hours; an examination architecture with second marking and moderation; a published fee decomposition accounting for every cent of a fee; a conferral and verification chain; and fourteen typeset volumes of its own curriculum and assessment work, free to anyone, enrolled or not.</p>
      <h3>The discipline</h3>
      <p>Every figure in this publication is computed by one engine from three files. None is typed into a page. The reconciliation is run as a test on every build rather than asserted as a claim, and the build fails if a figure in the document cannot be traced to the record it came from.</p>`,
  }));

  at('academic');
  add(M.narrative({ runhead: 'The Institution', single: true,
    head: `<p class="eyebrow">Academic architecture</p>`,
    body: M.table({
      title: 'The six qualifications',
      sub: `${B.levels} levels, ${num(B.hoursPerLevel)} academic hours and ${B.creditsPerLevel} credits each — ${num(B.totalHours)} hours and ${B.totalCredits} credits across the pathway.`,
      head: ['Code', 'CEFR', 'Qualification', 'Hours', 'Credits'],
      rows: PR.QUALIFICATIONS.map((q) => [
        `<b>${M.esc(q.code)}</b>`, M.esc(q.cefr), { v: M.esc(q.name), cls: 'unit' },
        num(B.hoursPerLevel), num(B.creditsPerLevel),
      ]).concat([{ em: true, cells: ['', '', 'COMPLETE A1–C2 PATHWAY', num(B.totalHours), num(B.totalCredits)] }]),
      source: `${M.mark('verified')} — data/tuition.json and the programme record. Adopted and published.`,
    }),
  }));

  // ══ PART III · THE MARKET ═════════════════════════════════════════
  onRecto();
  add(M.partOpener({ numeral: 'Part Three', title: 'The Market',
    say: 'What comparable programmes actually charge, what that did to an earlier draft of this plan, and the four markets the research could not answer.',
    contents: ['Published tariffs', 'Assumed against researched', 'Where evidence does not exist'] }));

  at('evidence');
  const EV_SEGMENTS = [['gcc', 'Saudi Arabia and the Gulf'], ['west_africa', 'Nigeria and West Africa'],
    ['uk_europe', 'United Kingdom and Europe'], ['executive_and_corporate', 'Executive and corporate']];
  const evRows = EV_SEGMENTS.flatMap(([key, name]) => EV[key].observations
    .filter((o) => o.price_local || o.price_usd)
    .map((o, i) => [
      i === 0 ? `<b>${M.esc(name)}</b>` : '',
      { v: `${M.esc(o.provider)}<br><span style="color:${M.C.grey}">${M.esc(o.product)}</span>`, cls: 'unit' },
      M.esc(o.price_local || '—'),
      typeof o.price_usd === 'number' ? usd(o.price_usd) : (o.price_usd ? `$${M.esc(String(o.price_usd))}` : '—'),
      o.per_contact_hour_usd ? usd(o.per_contact_hour_usd, 2) : '—',
      M.esc(o.confidence || '—'),
    ]));
  for (const pg2 of M.tablePages({
    title: 'What comparable providers charge',
    sub: `Published tariffs, converted. Gathered ${EV.researched_on}. ${EV.fx_note}`,
    head: ['Market', 'Provider', 'Local price', 'USD', 'Per contact hour', 'Confidence'],
    rows: evRows,
    source: `Every observation is recorded in <strong>data/market-evidence.json</strong> with its source address. Nothing about the outside world is typed into this publication.`,
  }, 10, { runhead: 'The Market' })) add(pg2);

  at('wtp');
  add(M.narrative({ runhead: 'The Market', single: true,
    head: `<p class="eyebrow">What the research did to the demand model</p>`,
    body: M.table({
      title: 'Willingness to pay, assumed against researched',
      sub: 'Price of a complete A1–C2 pathway at which a segment converts at its reference rate.',
      head: ['Segment', 'Assumed', 'Researched', 'Change', 'Elasticity', 'Confidence'],
      rows: PR.SEGMENTS.map((seg) => [
        `<b>${M.esc(seg.name)}</b>`,
        seg.wtpAssumed ? usd(seg.wtpAssumed) : '—',
        usd(seg.wtpFull),
        seg.wtpAssumed ? `<b>${pct(seg.wtpFull / seg.wtpAssumed - 1, 0)}</b>` : '—',
        seg.elasticity.toFixed(2),
        { v: M.esc(seg.confidence), cls: 'unit' },
      ]),
      source: `Four of the five moved, and one by nearly a factor of three. The plan this replaced projected ${m$(PA.superseded_pathway_usd.projected_ten_year_revenue_usd)} of revenue on those assumed figures; it is recorded in data/masterplan.json rather than quietly replaced.`,
    }),
  }));

  at('gaps');
  add(M.narrative({ runhead: 'The Market', single: true,
    head: `<p class="eyebrow">Where the evidence does not exist</p>
      <h2 style="margin-top:0">Stated, rather than closed</h2>
      <p class="lede" style="max-width:${M.col(8)}mm">${M.esc(EV.gaps.find((g) => g.status === 'NO DIRECT COMPARABLE FOUND').note.split('.').slice(0, 2).join('.') + '.')}</p>`,
    body: M.table({
      title: 'Marked as modelled',
      sub: 'Four markets and one central question the research could not answer.',
      head: ['Market or question', 'Status', 'What the model does instead'],
      rows: EV.gaps.map((g) => [
        `<b>${M.esc(g.market || g.topic)}</b>`,
        M.mark(g.status === 'NO DIRECT COMPARABLE FOUND' ? 'insufficient' : 'modelled'),
        { v: M.esc(g.status === 'NO DIRECT COMPARABLE FOUND'
          ? 'Pathway prices are built up from per-level comparables rather than read off a competitor.'
          : (g.note || 'Scaled from the segments that carry direct observations.')), cls: 'unit' },
      ]),
      source: 'data/market-evidence.json § gaps.',
    }),
  }));

  // ══ PART IV · THE COMMERCIAL ARCHITECTURE ═════════════════════════
  onRecto();
  add(M.partOpener({ numeral: 'Part Four', title: 'The Commercial Architecture',
    say: 'What WEC-LC charges, solved backwards from the financial law the Board has set — and not chosen.',
    contents: ['The proposed tariff', 'Per hour of attention', 'Three architectures'] }));

  at('tariff');
  add(M.narrative({ runhead: 'Commercial Architecture', single: true,
    head: `<p class="eyebrow">The proposed tariff</p>`,
    body: M.table({
      title: 'Management’s proposed commercial architecture',
      sub: 'Complete A1–C2 pathway. The adopted tariff remains $19,000 until the Board resolves otherwise.',
      head: ['Tier', 'What it buys', 'Contact hours', 'Attention', 'Pathway'],
      rows: [
        ...Object.keys(PATH_).map((k) => {
          const pp = PR.PRODUCTS[k];
          return [M.esc(pp.name), { v: M.esc(DESCRIPTOR[k]), cls: 'unit' },
            num((pp.individual + pp.groupHours) * 6), num(PR.attentionHours(k)),
            `<b>${usd(PATH_[k])}</b>`];
        }),
        ...Object.keys(PR.CHANNELS).map((k) => {
          const t = PR.channelTerms(k, PATH_);
          const sp = PR.PRODUCTS[t.spec];
          return { cells: [M.esc(t.name),
            { v: `The ${M.esc(sp.name)} pathway, less the adopted ${pct(t.discount, 0)} band.`, cls: 'unit' },
            num((sp.individual + sp.groupHours) * 6), num(PR.attentionHours(t.spec)),
            `<b>${usd(Math.round(t.seatPrice))}</b>`] };
        }),
      ],
      source: `Independent is adopted and published. Every other figure is ${M.mark('proposed')} — solved from the allocation framework by scripts/publication/allocation.mjs.`,
    }),
  }));

  at('attention');
  const BC = EV.gcc.observations[0];
  const bcAttn = BC.price_usd / (BC.hours / 12);
  add(M.narrative({ runhead: 'Commercial Architecture', single: true,
    head: `<p class="eyebrow">The comparison that survives</p>
      <h2 style="margin-top:0">Per hour of a teacher&rsquo;s<br>individual attention</h2>
      <p class="lede" style="max-width:${M.col(8)}mm">A pathway total has no comparable, because no provider sells one. An hour of a qualified teacher&rsquo;s individual attention has one everywhere.</p>`,
    body: M.table({
      title: 'The only like-for-like unit available',
      sub: 'Group hours divided by the published group size, because a class of twelve gives each learner a twelfth of the teacher.',
      head: ['Product', 'Attention across the pathway', 'Pathway price', 'Per hour'],
      rows: Object.keys(PR.PRODUCTS).map((k) => {
        const h = PR.attentionHours(k);
        return [M.esc(PR.PRODUCTS[k].name), num(h), usd(PATH_[k]), `<b>${usd(PATH_[k] / h, 2)}</b>`];
      }).concat([{ em: true, cells: [`British Council Saudi Arabia, group of 12`,
        num(BC.hours / 12), usd(BC.price_usd) + ' per module', `<b>${usd(bcAttn, 2)}</b>`] }]),
      source: `WEC-LC is cheaper per hour of individual instructor attention than the published British Council tariff at every tier, and it confers an award the module does not.`,
    }),
  }));

  at('arch');
  add(M.narrative({ runhead: 'Commercial Architecture', single: true,
    head: `<p class="eyebrow">Three architectures, one basis</p>`,
    body: M.table({
      title: 'What the proposal is worth against the alternatives',
      sub: 'All three run through the same demand model, delivery costs, acquisition budget and capacity gate. Only the price differs.',
      head: ['Architecture', 'Ten-year revenue', 'Surplus', 'Learners', 'Award-holders'],
      rows: [
        [M.esc(ARCH.briefA.label), m$(ARCH.briefA.totals.revenue), m$(ARCH.briefA.totals.surplus),
          num(ARCH.briefA.totals.newLearners), num(ARCH.briefA.totals.alumni)],
        [M.esc(ARCH.adopted.label), m$(ARCH.adopted.totals.revenue), m$(ARCH.adopted.totals.surplus),
          num(ARCH.adopted.totals.newLearners), num(ARCH.adopted.totals.alumni)],
        { em: true, cells: ['<b>PROPOSED PORTFOLIO</b>', m$(ARCH.proposed.totals.revenue),
          m$(ARCH.proposed.totals.surplus), num(ARCH.proposed.totals.newLearners), num(ARCH.proposed.totals.alumni)] },
      ],
      source: `The institutional channels removed the trade an earlier draft was built around: the proposal now earns more revenue, more surplus, more learners and more awards than the adopted flat tariff. ${M.mark('modelled')}`,
    }),
  }));

  // ══ PART V · THE FINANCIAL ARCHITECTURE ═══════════════════════════
  onRecto();
  add(M.partOpener({ numeral: 'Part Five', title: 'The Financial Architecture',
    say: 'Where every dollar of collected revenue is governed, and the decade that follows from it.',
    contents: ['The allocation framework', 'Definitions', 'The decade, year by year', 'Three scenarios'] }));

  at('alloc');
  onRecto();
  add(M.page(`
    <p class="eyebrow">The governing financial law</p>
    <h2 style="margin-top:0">Where every dollar<br>is governed</h2>
    <p class="lede" style="max-width:${M.col(6)}mm;margin-bottom:4mm">Fifty per cent of gross collected revenue is retained rather than spent. The tariff is solved backwards from this, and not the other way round.</p>
    <p style="margin:0 0 9mm">${M.mark('board')}</p>
    <div class="m-alloc">
      <div class="m-alloc__col">
        ${GOT.lines.map((l) => {
    const h = l.target * 143;
    const tight = h < 12;
    return `<div class="m-alloc__seg${tight ? ' m-alloc__seg--tight' : ''}${AL.RETAINED.includes(l.key) ? ' m-alloc__seg--kept' : ''}"
          style="background:${SEG_COLOUR[l.key]};height:${h.toFixed(1)}mm">
          <b>${pct(l.target, 0)}</b><s>${M.esc(SEG_LABEL[l.key])}</s></div>`;
  }).join('')}
      </div>
      <div style="flex:1;padding-top:1mm;position:relative">
        <p style="font-size:${M.T.small}pt;line-height:14.4pt;color:${M.C.inkSoft};max-width:${M.col(4)}mm;margin:0">
          The four lines above the struck rule are <em>consumed</em> running the institution. The two below it are
          <em>retained</em> &mdash; designated institutional capital, not profit, and not automatically withdrawable.</p>
        <div style="height:1.2pt;background:${M.C.gold};margin:7mm 0 5mm;width:${M.col(3)}mm"></div>
        <p style="font-size:${M.T.small}pt;line-height:14.4pt;color:${M.C.inkSoft};max-width:${M.col(4)}mm;margin:0">
          At the proposed tariff the institution retains <strong>${pct(GOT.retainedShare, 1)}</strong> of
          ${m$(GOT.revenue)} &mdash; the cheapest tariff at which it does.</p>
        <div style="position:absolute;left:0;bottom:0;width:${M.col(4)}mm">
          <div style="height:.35pt;background:${M.C.rule};margin-bottom:4mm"></div>
          <p style="font-family:${M.FACE.data};font-size:${M.T.micro}pt;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${M.C.grey};margin:0 0 2mm">Retained a year at maturity</p>
          <p class="num" style="font-family:${M.FACE.display};font-weight:300;font-size:44pt;line-height:46pt;color:${M.C.midnight};margin:0">${m$(GOT.retained)}</p>
        </div>
      </div>
    </div>`, { runhead: 'Financial Architecture' }));

  add(M.page(`
    <p class="eyebrow">Definitions</p>
    <h2 style="margin-top:0">What each line is, and is not</h2>
    <div style="margin-top:4mm">
    ${GOT.lines.map((l) => {
    const spec = PLAN.revenue_allocation_framework.shares.find((x) => x.key === l.key);
    return `<div class="m-alloc__row">
        <div class="m-alloc__swatch" style="background:${SEG_COLOUR[l.key]}"></div>
        <div style="flex:1">
          <h4>${M.esc(l.name)}</h4>
          <p>${M.esc(spec.definition)}</p>
          ${spec.not ? `<p style="margin-top:1.4mm;color:${M.C.crimson};font-size:${M.T.caption}pt;line-height:11.6pt"><em>${M.esc(spec.not)}</em></p>` : ''}
        </div>
        <div class="m-alloc__pct num">${pct(l.target, 0)}</div>
      </div>`;
  }).join('')}
    </div>`, { runhead: 'Financial Architecture' }));

  at('decade');
  add(M.narrative({ runhead: 'Financial Architecture', single: true,
    head: `<p class="eyebrow">The decade</p>`,
    body: M.table({
      title: 'The Core Management Plan, year by year',
      sub: 'Revenue recognised in the year it is taught, not the year it is sold.',
      head: ['Year', 'Admitted', 'Under instruction', 'Net tuition', 'Delivery', 'Acquisition', 'Surplus'],
      rows: CORE.years.map((y) => [
        `<b>${y.calendar}</b>`, num(y.newLearners), num(y.activeLearners),
        m$(y.netTuition), m$(y.delivery), m$(y.acquisition), m$(y.surplus),
      ]).concat([{ em: true, cells: ['TEN YEARS', num(CORE.totals.newLearners), `peak ${num(CORE.totals.y10Active)}`,
        m$(CORE.totals.revenue - CORE.totals.refunds), m$(CORE.totals.delivery),
        m$(CORE.totals.acquisition), m$(CORE.totals.surplus)] }]),
      source: `${M.mark('modelled')} — strategic projection, not a trading record.`,
    }),
  }));

  at('scenarios');
  add(M.narrative({ runhead: 'Financial Architecture', single: true,
    head: `<p class="eyebrow">Three scenarios</p>`,
    body: M.table({
      title: 'Conservative is not a haircut on Core',
      sub: 'It is weaker continuation, narrower reach and dearer acquisition — three things the College would have to do differently.',
      head: ['Scenario', 'Ten-year revenue', 'Surplus', 'Year-10 revenue', 'Learners', 'To C2'],
      rows: ['conservative', 'core', 'growth'].map((k) => {
        const t = PSC[k].totals;
        const cells = [`<b>${M.esc(PSC[k].label)}</b>`, m$(t.revenue), m$(t.surplus),
          m$(t.y10Revenue), num(t.newLearners), num(t.awardsToC2)];
        return k === 'core' ? { em: true, cells } : cells;
      }),
      source: 'The Core Plan is management’s recommended execution case, not the midpoint of the other two.',
    }),
  }));

  // ══ PART VI · THE DECADE ══════════════════════════════════════════
  onRecto();
  add(M.partOpener({ numeral: 'Part Six', title: 'The Decade',
    say: 'Five phases, twenty risks each with a warning somebody can observe, and who decides what.',
    contents: ['The five phases', 'The risk register', 'Governance and authority'] }));

  at('phases');
  add(M.narrative({ runhead: 'The Decade', single: true,
    head: `<p class="eyebrow">The ten-year roadmap</p>
      <h2 style="margin-top:0">Five phases, and what has to be<br>true at the end of each</h2>`,
    body: M.timeline(PHASES.map((ph) => {
      const y = CORE.years[ph.yearIndex];
      return { ...ph, figure: `${num(y.activeLearners)} under instruction &middot; ${m$(y.netTuition)} net tuition` };
    })),
  }));

  at('risks');
  for (const pg2 of M.tablePages({
    title: 'The institutional risk register',
    sub: 'Twenty risks, each with an early warning somebody can actually observe. A register of generic risks is one nobody reads twice.',
    head: ['Domain', 'Risk', 'L', 'I', 'Early warning', 'Response'],
    rows: RISKS.map((r) => [
      `<b>${M.esc(r[0])}</b>`, { v: M.esc(r[1]), cls: 'unit' }, M.esc(r[2]), M.esc(r[3]),
      { v: M.esc(r[4]), cls: 'unit' }, { v: M.esc(r[5]), cls: 'unit' },
    ]),
    source: `L — likelihood. I — impact. Authored judgement, not computed. Owners are named in the governance schedule.`,
  }, 7, { runhead: 'The Decade' })) add(pg2);

  at('gov');
  for (const pg2 of M.tablePages({
    title: 'Governance and authority',
    sub: 'Who decides what, and the separations that protect a learner.',
    head: GOVERNANCE_COLUMNS,
    rows: GOVERNANCE.map((g) => [`<b>${M.esc(g[0])}</b>`, M.esc(g[1]), { v: M.esc(g[2]), cls: 'unit' }, { v: M.esc(g[3]), cls: 'unit' }]),
    source: `Published governance instrument. Several offices named here are defined and unfilled, and the platform refuses to publish a person into an office they have not accepted.`,
  }, 9, { runhead: 'The Decade' })) add(pg2);

  // ══ PART VII · METHOD ═════════════════════════════════════════════
  onRecto();
  add(M.partOpener({ numeral: 'Part Seven', title: 'Method',
    say: 'Where every figure came from, and the audit that proves the document agrees with itself.',
    contents: ['Sources', 'Classification', 'Reconciliation'] }));

  at('method');
  for (const pg2 of M.tablePages({
      title: 'Where every figure comes from',
      sub: 'One engine, three files. Nothing is typed into a page.',
      head: ['Source', 'What it carries', 'Classification'],
      rows: [
        ['data/tuition.json', { v: 'The adopted fee, its decomposition in basis points, the level structure and the refund window.', cls: 'unit' }, M.mark('verified')],
        ['data/commercial.json', { v: 'The three routes, the independent steps, the partner bands, remission and referral.', cls: 'unit' }, M.mark('verified')],
        ['data/market-evidence.json', { v: 'Every priced observation with its provider, local price, hours and source address.', cls: 'unit' }, M.mark('verified')],
        ['data/masterplan.json', { v: 'The revenue-allocation framework, the market and progression assumptions, the establishment and the proposed architecture.', cls: 'unit' }, M.mark('board')],
        ['scripts/publication/pricing.mjs', { v: 'Delivery cost hour by hour, the demand model, the channels and the proposed tariff.', cls: 'unit' }, M.mark('modelled')],
        ['scripts/publication/allocation.mjs', { v: 'The framework made binding: what the institution actually retains, and the tariff solved from it.', cls: 'unit' }, M.mark('modelled')],
        ['scripts/publication/projection.mjs', { v: 'The ten years, with revenue recognised in the year it is taught.', cls: 'unit' }, M.mark('modelled')],
      ],
      source: `tests/masterplan.test.mjs runs the reconciliation on every build and fails it if a figure in this document cannot be traced to the record it came from. It also re-derives the proposed price from the allocation framework, so the price cannot drift away from its reason.`,
  }, 4, { runhead: 'Method' })) add(pg2);

  // ══ COLOPHON ══════════════════════════════════════════════════════
  onRecto();
  add(M.page(`
    <div class="m-colo__wrap">
      <h2>A planning instrument,<br>and not a record of trading.</h2>
      <p>Every financial figure in this publication is a projection computed from stated assumptions. None of it is a record of trading. Where the College holds something, it is marked ${M.mark('verified')}. Where this plan asserts something, it is marked ${M.mark('modelled')}. Where nobody has yet decided, it is marked ${M.mark('board')}.</p>
      <p>The College claims no accreditation, ranking, partnership or endorsement it does not hold, and names no person in an office they have not accepted.</p>
      <div class="rule-hair"></div>
      <p class="m-colo__meta">WorldWide English College &middot; London Campus<br>
        The Ten-Year Institutional Roadmap ${PERIOD}<br>
        Set in Cinzel, Cormorant Garamond, EB Garamond and Inter<br>
        ${M.PAGE.width} &times; ${M.PAGE.height}mm</p>
    </div>`, { tone: 'pg--dark m-colo', bare: true }));

  return P;
}

// Two passes: the first records where each part begins, the second
// sets those folios into the contents page.
build();
build();

// ── ASSEMBLE ─────────────────────────────────────────────────────────
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>WEC-LC — Ten-Year Institutional Roadmap ${PERIOD}</title>
<style>${M.css(FACES)}${M.masterCss()}${M.masterCssTwo()}</style></head>
<body>${P.join('\n')}</body></html>`;

mkdirSync(OUT, { recursive: true });
const HTML_OUT = path.join(OUT, '.monograph.html');
/* A DISTINCT FILE UNTIL THE REPAGINATION IS COMPLETE.
   The monograph currently carries the opening sequence and the
   financial architecture; the full twenty-section document still comes
   from render-masterplan.mjs. Writing this to that file would have
   replaced a complete publication with a nine-page proof of its own
   design system, which is not an improvement however much better the
   nine pages look. */
const PDF_OUT = path.join(OUT, 'WEC-LC Institutional Monograph.pdf');
writeFileSync(HTML_OUT, html);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await browser.newPage();
await pg.goto('file://' + HTML_OUT, { waitUntil: 'networkidle' });
await pg.emulateMedia({ media: 'print' });
await pg.pdf({
  path: PDF_OUT, width: `${M.PAGE.width}mm`, height: `${M.PAGE.height}mm`,
  printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 },
});
/* ────────────────────────────────────────────────────────────────────
   EVERY PAGE MUST FIT, AND THE BUILD FINDS OUT RATHER THAN A READER.

   The first proof of this design lost the last row of the tariff table
   off the bottom of the page and printed the folio through the middle
   of it. Both were invisible in the source and obvious on screen, and
   neither would have survived a reader. A page that overflows is not a
   page that needs tightening; it is a failed composition, and the
   build now refuses it. */
const overflows = await pg.evaluate(() => {
  const bad = [];
  document.querySelectorAll('.pg').forEach((p, i) => {
    const f = p.querySelector('.pg__field');
    /* ONLY THE FIELD ITSELF. An inner box can report a few pixels of
       scrollHeight from an absolutely-positioned child without a
       reader losing anything, and failing the build on that means
       chasing phantoms. What loses content is the FIELD overflowing,
       or an element crossing the trim, or text landing on text. */
    const worst = f ? Math.max(0, f.scrollHeight - f.clientHeight) : 0;
    // Anything the page clips is content the reader never sees.
    const clipped = [...p.querySelectorAll('*:not(.bleed):not(.bleed *)')].some((el) => {
      const r = el.getBoundingClientRect(); const pr = p.getBoundingClientRect();
      return r.height > 0 && (r.bottom > pr.bottom + 0.5 || r.right > pr.right + 0.5);
    });
    /* AND TEXT MUST NOT SIT ON TEXT. An overlap is not an overflow, so
       the fit check could not see the retained figure landing on top of
       a paragraph. Compare every absolutely-positioned block against
       the flow text around it. */
    const collided = [];
    const blocks = [...p.querySelectorAll('.pg__field p, .pg__field h2, .pg__field h3, .pg__field h4, .pg__field table')];
    for (let a = 0; a < blocks.length; a++) {
      for (let c = a + 1; c < blocks.length; c++) {
        if (blocks[a].contains(blocks[c]) || blocks[c].contains(blocks[a])) continue;
        /* CLIENT RECTS, NOT THE BOUNDING BOX. A paragraph broken across
           two columns has one bounding rect spanning BOTH of them, which
           made every two-column page report its own text as overlapping
           itself. getClientRects() returns the fragments, which is what
           is actually on the page. */
        let hit = false;
        for (const r1 of blocks[a].getClientRects()) {
          if (r1.width < 2 || r1.height < 2) continue;
          for (const r2 of blocks[c].getClientRects()) {
            if (r2.width < 2 || r2.height < 2) continue;
            const ox = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
            const oy = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
            if (ox > 3 && oy > 3) { hit = true; break; }
          }
          if (hit) break;
        }
        if (hit) collided.push((blocks[a].textContent || '').trim().slice(0, 30));
      }
    }
    if (worst > 1 || clipped || collided.length) {
      // Name the last element that still fits, so the fault can be
      // found without opening a browser.
      const pr = p.getBoundingClientRect();
      let lastFits = '';
      for (const el of (f || p).querySelectorAll('h2,h3,h4,p,tr,div')) {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.bottom <= pr.bottom) lastFits = (el.textContent || '').trim().slice(0, 46);
      }
      bad.push({ page: i + 1, overflowPx: Math.round(worst), clipped, lastFits,
        collided: [...new Set(collided)].slice(0, 2) });
    }
  });
  return bad;
});
await browser.close();
if (overflows.length) {
  console.error('\nPAGE COMPOSITION FAILED:');
  for (const o of overflows) {
    console.error(`  page ${o.page}: ${o.overflowPx}px over${o.clipped ? ', clipped at the trim' : ''}`
      + (o.collided && o.collided.length ? `\n      text sitting on text: “${o.collided.join('” / “')}…”` : '')
      + (o.overflowPx > 1 && o.lastFits ? `\n      last element that fits: “${o.lastFits}…”` : ''));
  }
  process.exitCode = 1;
}
const kb = (readFileSync(PDF_OUT).length / 1024).toFixed(0);
console.log(`Wrote the monograph — ${P.length} pages, ${kb} KB, ${M.PAGE.width}×${M.PAGE.height}mm.`);
