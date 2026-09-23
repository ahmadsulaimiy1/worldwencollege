/**
 * THE FRONT OF THE BOOK — cover, edition, contents, and the plan in
 * brief. A senior reader who stops after these pages should know what
 * the College is, whom it serves, what it charges, what it needs, when it
 * returns it, what could go wrong and what the Board is asked to decide.
 */
import * as G from './charts.mjs';
import { fixed, field, flow, H, SUB, Pp, LEAD, LIST, BOARD, NOTE, KF, TABLE, FIG, BREAK,
  usd, usdM, num, pct, esc } from './pages.mjs';

export const BOOK = 'WEC-LC Master Plan 2027–2036';
const termName = (label) => { const [y, n] = label.split('-'); return `${['Spring', 'Summer', 'Autumn'][Number(n) - 1]} ${y}`; };

export function cover(F) {
  return fixed(`<div class="frame"></div><div class="cover">
    <div class="mark">${G.mark()}</div>
    <div class="college">WorldWide English College · London Campus</div>
    <div class="title">${G.coverTitle(['Ten-Year Institutional', 'Master Plan'])}</div>
    <div class="rule"></div>
    <div class="edition">Board &amp; Investment Edition</div>
    <div class="period">${F.first} — ${F.lastYear}</div>
    <div class="foot">Prepared for the founders and the Board of Governors<br>September 2026</div>
  </div>`, { tone: 'pg--opener', bare: true });
}

export function edition(F) {
  const b = F.bases;
  const total = F.register.length;
  return fixed(field(`
    <div class="blk blk--full" style="margin-top:0">
      <div style="font:600 6.8pt/1 var(--data, Archivo), sans-serif;letter-spacing:.26em;text-transform:uppercase;color:var(--gold-deep)">About this edition</div>
    </div>
    ${LEAD(`This is the Board and Investment Edition of the WEC-LC Ten-Year Institutional Master Plan. It sets out the institution the founders propose to establish, what it will teach and to whom, what that costs, what it will charge, how much capital it needs and when, and what the Board must decide at each step.`)}
    ${Pp(
      `The plan is built from zero. It assumes an institution with no learners, no staff, no revenue and no recognition, and it takes nothing from any earlier document or record. Every figure in it is produced by the plan’s own model from ${num(total)} stated assumptions, each listed with its source in Appendix B: ${num(b.evidenced)} are published external evidence, ${num(b.design)} are specifications the plan sets for the institution, and ${num(b.management)} are planning judgements that the College will replace with its own measurements as it operates.`,
      `Fees are stated at ${F.first} prices and rise three per cent a year. Every other sum is in the money of the year in which it falls. The College earns in US dollars and pays most of its costs in pounds; sterling is converted at ${F.fx} dollars to the pound, the mean of the twelve monthly rates HMRC published from October 2025 to September 2026.`,
    )}
    ${TABLE({ head: [{ t: 'Document' }, { t: '' }], widths: ['46mm', 'auto'], split: false, rows: [
      ['Title', 'WEC-LC Ten-Year Institutional Master Plan'],
      ['Edition', 'Board and Investment Edition'],
      ['Period', `Spring ${F.first} to Autumn ${F.lastYear}: thirty terms`],
      ['Prepared', 'September 2026'],
      ['Status', 'For decision by the founders and the Board of Governors'],
      ['Currency', 'US dollars; sterling at the rate above'],
      ['Extent', '<span data-extent></span> pages'],
    ] })}
  `), { rh: 'About this edition', id: 'edition' });
}

/** The contents: every stage, and the page it opens on. */
export function contents(F, entries) {
  const li = entries.map((e) => `<li class="${e.front ? 'front' : ''}"><i>${e.n || ''}</i><div><b>${esc(e.title)}</b>${e.say ? `<span>${esc(e.say)}</span>` : ''}</div><em data-ref="${e.id}"></em></li>`).join('');
  return fixed(field(`<div class="toc"><h1>Contents</h1><div class="sub">Ten stages, in the order the plan is built: the institution first, the numbers after.</div><ol>${li}</ol></div>`), { rh: 'Contents', id: 'contents' });
}

export function brief(F) {
  const K = F.K; const [t1, t2, t3] = K.tranches;
  const last = F.last;
  const routesRows = F.routes.map((r) => [
    { v: r.name.replace('WEC-LC ', ''), cls: 'nm' }, { v: r.for, cls: 't' }, { v: r.promise, cls: 't' },
    usd(r.fee), usd(r.pathway),
  ]);
  const gradeName = { reserve: 'Capital returnable, reserve at target', returned: 'Capital returnable, reserve drawn', short: 'Capital not returnable by 2036' };
  const shockRows = [...F.X.shocks, ...F.X.combined].map((s) => [
    { v: s.name, cls: 't' }, { v: gradeName[s.grade], cls: s.grade === 'short' ? 'neg' : '' },
    usdM(s.capital), s.returnYear.year ? String(s.returnYear.year) : 'After 2046',
  ]);
  const blocks = [
    H('', 'The plan in brief', 'brief'),
    LEAD(`WorldWide English College, London Campus, will be a new institution. It will teach English to adults in four regions of the world, online, from London, and award its own qualification at six levels. This plan sets out how it is established, what it will cost, what it will charge and when it will stand on its own income.`),
    KF([
      { v: usdM(F.capital), l: 'Founding capital', d: 'In three tranches, each released at a Board gate' },
      { v: String(F.firstIntake.year), l: 'First intake', d: `${F.firstIntake.label.split(' ')[0]} term, in the Gulf, after two terms of establishment` },
      { v: String(F.firstSurplusYear), l: 'First surplus', d: 'The first year fees exceed the whole cost of the institution' },
      { v: String(F.returnYear), l: 'Capital returnable', d: `With a reserve of six months’ cost complete in ${F.lastYear}` },
    ], 4),
    KF([
      { v: num(Math.round(F.activeEnd / 10) * 10), l: `Learners studying, ${F.lastYear}`, d: `About ${num(Math.round(F.newPerYear / 10) * 10)} new learners a year` },
      { v: usdM(last.revenue.net), l: `Net fee revenue, ${F.lastYear}`, d: `Against ${usdM(last.costs)} of cost` },
      { v: String(F.staff), l: `Staff, ${F.lastYear}`, d: `${F.academicStaff} academic, ${F.professionalStaff} professional` },
      { v: usdM(F.X.central.reserveTarget), l: `Reserve, ${F.lastYear}`, d: 'Six months of operating cost' },
    ], 4),
    SUB('What the College is'),
    Pp(
      `The College offers one qualification in six levels, A1 to C2 on the Common European Framework of Reference for Languages. Every learner completes the same sixty modules, submits the same ten assignments at each level and sits the same examination, and every piece of assessed work is marked twice. The academic standard is one standard, whatever a learner pays.`,
      `What a learner chooses is the support they receive on the way. There are five routes. Independent gives the complete qualification with defined academic support. Guided adds a teacher and a timetabled seminar cohort. Tutored adds individual tutorials and a named adviser. Executive delivers the qualification to senior professionals in a small closed cohort, taught by senior academics and scheduled around their calendars. Bespoke builds the programme around one person.`,
      `The College opens in the Gulf in the autumn of ${F.first}, in the United Kingdom and Europe in ${F.first + 1} and in Asia in ${F.first + 3}. In West Africa it works through institutions that buy places for their people, because every route costs more to deliver than individual learners there pay for English tuition. Employers buy places on the Tutored route from ${F.first + 1}.`,
    ),
    SUB('What it needs and what it returns'),
    Pp(
      `The College needs ${usdM(F.capital, 2)} of founding capital, released in three tranches, each against a decision of the Board: ${usdM(t1.amount, 2)} to establish the institution in ${F.first}; ${usdM(t2.amount, 2)} when it is ready to teach its first intake; and ${usdM(t3.amount, 2)} in ${t3.label.split('-')[0]}, once a full year of teaching, assessment and conferral has been completed and reviewed. Its cash is lowest in ${F.trough.label}. It earns its first surplus in ${F.firstSurplusYear}, holds enough cash to return the founding capital in ${F.returnYear}, and ends its tenth year with the capital returnable and six months of operating cost in reserve.`,
      `Every figure in this plan comes from one model, built up from what the College promises each learner. The model counts the academic work each route requires, the staff that work needs and when they must be hired, what the platform, premises and assurance cost, what it costs to find each learner and what the fees bring in, term by term for ten years. The fee of each route is then built from that cost.`,
    ),
    BREAK,
    TABLE({
      title: 'The five routes',
      sub: `Every route leads to the same qualification, assessed the same way. Level fees at ${F.first} prices; a pathway is all six levels.`,
      head: [{ t: 'Route' }, { t: 'For' }, { t: 'What the learner receives' }, { t: 'Level fee', r: true }, { t: 'Six levels', r: true }],
      widths: ['20mm', '44mm', '67mm', '20mm', '22mm'],
      rows: routesRows, split: false,
      note: `A learner pays for each level when it begins, never in advance of teaching, and may withdraw within fourteen days for a full refund. Fees rise three per cent a year. Employers buying ten or more places pay ${pct(F.agreements[0].discount)} less; institutions buying places at scale pay ${pct(F.agreements[1].discount)} less.`,
    }),
    FIG({
      title: 'The decade: fees against the whole cost of the institution',
      sub: 'Net fee revenue and total cost each year, US dollars in the money of each year',
      svg: G.decade(F.Y, { firstSurplusYear: F.firstSurplusYear }),
      reading: `Costs run ahead of fees for four years while the College builds its curriculum, its staff and its markets. Fees overtake costs in ${F.firstSurplusYear}; by ${F.lastYear} the College takes ${usdM(last.revenue.net)} in fees against ${usdM(last.costs)} of cost.`,
    }),
    BREAK,
    FIG({
      title: 'Cash, the founding capital and the gates',
      sub: 'Cash at the end of each term, with the founding capital drawn at its gates, against the minimum the College must hold',
      svg: G.cash(F.rows, K),
      reading: `Without the founding capital, the College’s cash would fall to ${usdM(F.trough.cumulative)} in ${F.trough.label}. The capital is sized so that the balance never falls below three months of the cost of the term ahead, and it is drawn in three tranches so that no founder funds a phase before the Board has decided the College has earned it.`,
    }),
    TABLE({
      title: 'The three tranches', split: false,
      head: [{ t: 'Gate' }, { t: 'Released' }, { t: 'Condition the Board must confirm' }, { t: 'Amount', r: true }],
      widths: ['24mm', '24mm', '105mm', '20mm'],
      rows: [...K.tranches.map((t) => [{ v: t.name, cls: 'nm' }, termName(t.label), { v: t.condition, cls: 't' }, usdM(t.amount, 2)]),
        { cls: 'sum', cells: ['Founding capital', '', '', usdM(F.capital, 2)] }],
    }),
    BREAK,
    TABLE({
      title: 'When the plan is wrong',
      sub: 'Each case re-runs the whole model at the published fees. Capital needed is the founding capital that case would require.',
      head: [{ t: 'Case' }, { t: 'Outcome in the tenth year' }, { t: 'Capital needed', r: true }, { t: 'Capital returnable', r: true }],
      widths: ['66mm', '63mm', '22mm', '24mm'],
      rows: [{ cls: 'sub', cells: ['The plan as set out', gradeName[F.X.central.grade], usdM(F.X.central.capital), String(F.X.central.returnYear.year)] }, ...shockRows],
      split: false,
    }),
    Pp(`The plan is most exposed to what a learner costs to find, to the pay of the people who teach, and to the pound. If enquiries convert at the averages of the published benchmark rather than its medians, the College needs ${usdM(F.X.shocks.find((s) => s.key === 'benchmarkAverages').capital)} and cannot return its capital within the decade; the Validation gate exists to measure that cost before the third tranche is drawn. A slow start, with the Gulf late, conversion lower and acquisition dearer at once, needs ${usdM(F.contingency)} more than the plan. That sum should be held available by the founders and not drawn.`),
    BREAK,
    SUB('What the Board is asked to decide'),
    LIST([
      `To commit the founding capital of ${usdM(F.capital, 2)}, released in three tranches against the Establishment, Launch and Validation gates, and to hold a further ${usdM(F.contingency, 2)} available and undrawn against a slow start.`,
      `To adopt the five routes and their fees at ${F.first} prices, indexed each year to the pay of the people who deliver them.`,
      `To adopt the order in which the College enters its markets, and the rule that no market is funded beyond the point at which its last dollar of acquisition is repaid within a learner’s first level.`,
      `To adopt the cash policy: never less than three months of operating cost in hand, and a reserve built to six months by ${F.lastYear}.`,
      `To decide the form of the founding capital, whether equity, loan, grant or a combination, which this plan leaves to the founders and the Board.`,
      'To adopt a Board gate for each year of the plan (Stage VII) and the measures on which each is judged (Stage VIII).',
    ], { numbered: true }),
    NOTE('How to read this plan', 'Stages I to V describe the institution: its doctrine, its academic architecture, its markets, its products and prices, and the people and systems that deliver them. Stage VI is the financial model; Stage VII the ten years, one at a time; Stage VIII governance; Stage IX the investment case. The appendices hold the basis of the plan, every assumption with its source, and the model term by term.'),
  ];
  return [flow(blocks, { rh: 'The plan in brief' })];
}
