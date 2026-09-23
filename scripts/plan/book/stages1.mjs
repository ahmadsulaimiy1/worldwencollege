/**
 * STAGES I AND II — the institution, and the qualification it awards.
 */
import * as G from './charts.mjs';
import { fixed, flow, H, SUB, Pp, LEAD, LIST, BOARD, KF, TABLE, FIG, BREAK, usd, usdM, num, pct, esc } from './pages.mjs';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const WORD = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** A stage opens on a full sapphire field: its numeral, its name, what it settles, and where. */
export function opener({ n, id, title, say, sections, crimson = false }) {
  const li = sections.map((s) => `<li><i data-ref="${s.id}"></i><span>${esc(s.t)}</span></li>`).join('');
  return fixed(`<div class="frame"></div><div class="op">
    <div class="eye">Stage ${WORD[n - 1]}</div>
    <div class="num">${G.goldWord(ROMAN[n - 1], { size: 150 })}</div>
    <h1>${esc(title)}</h1>
    <div class="say">${say}</div>
    <ul class="inthis">${li}</ul>
  </div>`, { tone: `pg--opener${crimson ? ' crimson' : ''}`, bare: true, id });
}
export { ROMAN };

export function stage1(F) {
  const R = F.R;
  const sections = [
    { t: 'What the College is', id: 's1-1' },
    { t: 'One standard', id: 's1-2' },
    { t: 'The rules the College runs by', id: 's1-3' },
    { t: 'An institution built from nothing', id: 's1-4' },
  ];
  const blocks = [
    H('1.1', 'What the College is', 's1-1'),
    LEAD('WorldWide English College, London Campus, will be an independent institution that teaches English to adults online and awards its own qualification.'),
    Pp(
      `The College will be incorporated in England and governed by a Board of Governors of ${R.val(R.OPERATIONS.lines.governance.members)} independent members, meeting four times a year. Its leadership, registry and administration will work from a serviced office in central London. Its teaching staff will teach online, from wherever in the United Kingdom they are recruited, to learners in the Gulf, the United Kingdom and Europe, Asia and, through institutions, West Africa.`,
      `It will award its own qualification. When it opens it will hold no accreditation, recognition or partnership, and it will claim none. The plan budgets for an application to the British Accreditation Council for accreditation of the College’s online provision in ${R.OPERATIONS.lines.accreditation.applies.split('-')[0]}, once three years of teaching can be inspected. Whether to accredit is that body’s decision.`,
    ),
    H('1.2', 'One standard', 's1-2'),
    Pp(
      'The College’s first commitment is that its qualification means the same thing whoever holds it. Every route carries the whole of the assessment: ten assignments at every level, each read and marked by a person; an examination with a written and a spoken paper; every script marked by two examiners and every disagreement reconciled; a sample of every level moderated each term; papers written afresh each year; and results confirmed by an Examination Board and reviewed by External Examiners from outside the College.',
      'None of that is sold separately, and none of it is reduced on a cheaper route. What the routes sell is support: seminars, feedback, tutorials, advising, oversight and scheduling. The College never sells a higher mark, a faster award or an easier examination.',
    ),
    H('1.3', 'The rules the College runs by', 's1-3'),
    LIST([
      '<b>A route is defined by what the learner receives.</b> No fee is quoted by the hour, and no page of this plan divides a fee by a number of hours. Hours appear only where the College must staff a commitment it has made.',
      '<b>One price worldwide.</b> A route costs the same wherever the learner lives. Where a market cannot pay for a route, the College reaches it through institutions that fund places on the published terms, not through a cheaper fee.',
      '<b>Fees are billed level by level, at the start of each level.</b> The College never holds a learner’s money for teaching that has not begun, and refunds in full a level withdrawn within fourteen days.',
      '<b>No learner is taught a level that has not been written.</b> The curriculum is authored before it is taught, and a learner is placed only at a level that exists.',
      '<b>Teaching staff are hired a term before the learners who need them.</b> When the College cannot recruit fast enough, it admits fewer learners rather than break a promise to those it has.',
      '<b>Capital is released against decisions, not dates.</b> Each tranche waits for the Board to confirm that the College has done what the previous tranche was for.',
      '<b>The College always holds three months of operating cost in cash,</b> and builds a reserve of six months by the end of the decade.',
      '<b>Offices are named; people are not.</b> No one is published as holding a post before they have been appointed to it.',
    ]),
    H('1.4', 'An institution built from nothing', 's1-4'),
    Pp(
      'This plan assumes an institution that begins with nothing: no learners, no staff, no curriculum, no revenue and no reputation. It does not borrow a figure from any earlier document. Each number in it is either published external evidence, a specification the College sets for itself, or a planning judgement stated as one; Appendix A explains the three, and Appendix B lists every assumption with its source.',
      'Where the plan relies on judgement rather than evidence, it says so in the register and treats the figure as the first thing the College must measure. The largest of those judgements are how quickly learners continue from one level to the next, how far a market can be pushed before each enquiry costs more, and how many learners choose each route. Each is tested in Stage VI.',
    ),
  ];
  return [
    opener({ n: 1, id: 'stage-1', title: 'Institutional doctrine', say: 'What the College is, the standard it keeps whatever a learner pays, and the rules it runs by. Everything later in the plan follows from these pages.', sections }),
    flow(blocks, { rh: 'I · Institutional doctrine' }),
  ];
}

export function stage2(F) {
  const R = F.R; const SVC = F.SVC; const Q = R.QUALIFICATION;
  const A = Q.assessment; const M = A.markingMinutes; const IW = Q.institutionalWork; const ES = Q.establishment;
  const names = R.val(Q.structure.levelNames);
  const v = R.val;
  const sections = [
    { t: 'The qualification', id: 's2-1' },
    { t: 'Assessment, counted as work', id: 's2-2' },
    { t: 'The institution’s own academic work', id: 's2-3' },
    { t: 'Written before it is taught', id: 's2-4' },
    { t: 'How learners move through the levels', id: 's2-5' },
  ];
  const aRows = names.map((nm, L) => {
    const h = SVC.assessmentHours(L);
    return [`Level ${ROMAN[L]} · ${nm}`, `${v(M.assignmentFirst)[L]} min`, `${v(M.writtenPaperFirst)[L]} min`, `${v(M.spokenPaperFirst)[L]} min`,
      h.assignments.toFixed(1), h.examination.toFixed(1), h.resit.toFixed(2), { v: h.total.toFixed(1), cls: '' }];
  });
  const avail = F.S.result.authoring.availableFrom;
  const tl = (t) => F.R.termLabel(t);
  const wRows = names.map((nm, L) => [`Level ${ROMAN[L]} · ${nm}`,
    L < 3 ? `${tl(avail[L] - 2)} and ${tl(avail[L] - 1)}` : tl(avail[L] - 1), tl(avail[L]),
    num(v(Q.structure.modulesPerLevel) * v(ES.authoringHoursPerModule))]);
  const comp = v(R.PROGRESSION.completion); const cont = v(R.PROGRESSION.continuation); const entry = v(R.PROGRESSION.entryLevel);
  const pRows = names.map((nm, L) => [`Level ${ROMAN[L]} · ${nm}`, pct(entry[L]), pct(comp[L]), L < 5 ? pct(cont[L]) : '—']);
  const blocks = [
    H('2.1', 'The qualification', 's2-1'),
    LEAD(`One qualification in ${v(Q.structure.levels)} levels, from A1 to C2 on the Common European Framework of Reference for Languages. Each level is a qualification in its own right, and each is studied in one term.`),
    Pp(
      `Each level is ${v(Q.structure.modulesPerLevel)} modules, each a unit of assessed study, studied across one four-month term of ${v(Q.structure.teachingWeeksPerTerm)} teaching weeks; the remaining weeks of the term are given to examination, moderation and conferral. The College admits learners three times a year, in the Spring, Summer and Autumn terms, and a learner who completes a level may begin the next in the following term.`,
      'A new learner is placed at the level their placement assessment shows, not at the first level by default. Most will enter at A1 or A2; a few will enter at C1 or above. A learner leaves with the qualification of every level they complete, and the College keeps the record of each award, and verifies it on request, for as long as it exists.',
    ),
    H('2.2', 'Assessment, counted as work', 's2-2'),
    Pp(
      `At every level, on every route, a learner submits ${v(A.assignmentsPerLevel)} assignments and sits ${v(A.examinationsPerLevel)} examination with a written and a spoken paper. Every assignment and every paper is marked by one examiner and marked again by a second; where the two differ materially — the plan assumes ${pct(v(A.reconciliationRate))} of scripts — a third reading reconciles them. The written paper is invigilated, one invigilator to ${v(A.candidatesPerInvigilator)} candidates, and ${pct(v(A.resitRate))} of candidates are expected to resit.`,
      'The table counts that commitment as the academic hours the College must staff for one learner at each level. The hours rise with the level because a C2 essay takes longer to read well than an A1 exercise. They are the same on every route, and they are the part of the cost of a fee the College could not reduce without changing the award.',
    ),
    TABLE({
      title: 'The assessment of one learner, in academic hours',
      sub: 'First-marking time for one script at each level, and the hours of assessment work per learner per level once second marking, reconciliation, invigilation and resits are counted',
      head: [{ t: 'Level' }, { t: 'Assignment', r: true }, { t: 'Written paper', r: true }, { t: 'Spoken paper', r: true }, { t: 'Assignments, h', r: true }, { t: 'Examination, h', r: true }, { t: 'Resits, h', r: true }, { t: 'Total, h', r: true }],
      widths: ['32mm', '17mm', '19mm', '19mm', '22mm', '22mm', '17mm', '18mm'],
      rows: aRows, split: false,
    }),
    H('2.3', 'The institution’s own academic work', 's2-3'),
    Pp('Some academic work belongs to no single learner. It is carried by the academic establishment and counted in the plan as its own line of hours, term by term:'),
    LIST([
      `<b>Moderation:</b> ${v(IW.moderationHoursPerLevelTerm)} hours at each level taught each term, reviewing a ${pct(v(IW.moderationSampleShare))} sample of marked work.`,
      `<b>The Examination Board:</b> ${v(IW.examinationBoardHoursPerTerm)} hours a term to confirm results before they are released.`,
      `<b>Examination papers:</b> ${v(IW.paperVersionsPerLevelYear)} new versions of the paper at each level every year, ${v(IW.hoursPerPaperVersion)} hours each to write and review.`,
      `<b>Curriculum maintenance:</b> ${v(IW.curriculumMaintenanceHoursPerModuleYear)} hours a module each year once a level is taught.`,
      `<b>Quality review:</b> ${num(v(IW.qualityReviewHoursPerYear))} hours a year across the institution.`,
      `<b>External Examiners:</b> ${v(R.OPERATIONS.lines.externalExaminer.examiners)} appointed from outside the College, one for each pair of levels, reporting to the Board each year.`,
    ]),
    H('2.4', 'Written before it is taught', 's2-4'),
    Pp(`Each module takes ${v(ES.authoringHoursPerModule)} hours of academic time to write, set and review: ${num(v(Q.structure.modulesPerLevel) * v(ES.authoringHoursPerModule))} hours a level. The first three levels are written across the two terms before the College opens; each further level is written in the term before it is first taught. The schedule sets when the College can teach each level, and the model will not place a learner at a level that does not yet exist.`),
    TABLE({
      title: 'The curriculum schedule', split: false,
      head: [{ t: 'Level' }, { t: 'Written in' }, { t: 'First taught' }, { t: 'Academic hours to write', r: true }],
      widths: ['40mm', '62mm', '36mm', '35mm'],
      rows: wRows,
    }),
    H('2.5', 'How learners move through the levels', 's2-5'),
    Pp(`Of those who begin a level, a share complete it; of those who complete it, a share begin the next level in the following term. Both rates rise with the level, because a learner who has reached B2 has already shown a commitment an A1 entrant has not. On these rates a new learner can expect to study ${F.levelsPerLearner.toFixed(1)} levels with the College.`),
    TABLE({
      title: 'Placement, completion and continuation', split: false,
      sub: 'The plan’s planning judgements; the first quantities the College replaces with its own measurement',
      head: [{ t: 'Level' }, { t: 'New learners placed here', r: true }, { t: 'Complete the level', r: true }, { t: 'Go on to the next', r: true }],
      widths: ['40mm', '45mm', '44mm', '44mm'],
      rows: pRows,
    }),
    (() => {
      const c = F.X.shocks.find((x) => x.key === 'continuationLower');
      return BOARD('What the Board should watch', `Continuation is among the quantities the plan is most sensitive to. Ten points lower at every level leaves the College holding ${usdM(c.cumulative)} at the end of ${F.lastYear} against a reserve target of ${usdM(F.X.central.reserveTarget)} (Stage VI). It is reported to the Board every term, level by level.`);
    })(),
  ];
  return [
    opener({ n: 2, id: 'stage-2', title: 'Academic architecture', say: 'The qualification the College awards, the assessment every route carries, the academic work behind it, and how learners move through six levels.', sections }),
    flow(blocks, { rh: 'II · Academic architecture' }),
  ];
}
