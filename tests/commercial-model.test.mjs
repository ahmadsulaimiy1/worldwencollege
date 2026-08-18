// tests/commercial-model.test.mjs — the four commercial decisions cannot
// quietly contradict each other, or the fee schedule they sit beside.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAILURE THIS EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
// A college publishes a fees page, then a scholarships page, then a
// partner rate, then a referral offer — four surfaces written months
// apart. By the fourth, they disagree about what a level costs, whether
// there is a graduation fee, and whether a scholarship scheme exists.
// Nobody lied; the pages simply stopped being one document.
//
// So every figure lives in data/commercial.json, scripts/build-commercial.mjs
// refuses to render if the arithmetic contradicts data/tuition.json, and
// this file holds the parts a generator cannot see: that the PROSE on
// the pages still says what the model says, in both languages, and that
// the promises the model makes to itself are kept.
//
// ─────────────────────────────────────────────────────────────────────
// THE ONE THAT MATTERS MOST
// ─────────────────────────────────────────────────────────────────────
// The tuition page promises an enrolled student "no graduation fee".
// The independent route charges $200 to confer the award. Both are true
// and the pair is only honest if the reason appears beside BOTH. A
// reader who meets the fee without the reason has met a hidden fee, and
// a reader who meets the promise without the exception has been misled.
// That pairing is checked below, in each language, and it is the check
// most likely to catch a future edit that means no harm.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const C = JSON.parse(readFileSync(path.join(ROOT, 'data/commercial.json'), 'utf8'));
const T = JSON.parse(readFileSync(path.join(ROOT, 'data/tuition.json'), 'utf8'));
const gov = readFileSync(path.join(ROOT, 'docs/governance-decisions.md'), 'utf8');

const en = readFileSync(path.join(ROOT, 'pages/admissions-tuition.html'), 'utf8').replace(/\s+/g, ' ');
const ar = readFileSync(path.join(ROOT, 'pages/admissions-tuition.ar.html'), 'utf8').replace(/\s+/g, ' ');

const BP = 10000;
const IND = C.routes.independent;
const stepTotal = IND.steps.reduce((n, s) => n + s.cents, 0);
const flat = (c) => `$${(c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

// ── 1 · THE ARITHMETIC AGREES WITH THE OTHER LEDGER ──────────────────
check('The two data files agree on what a level costs',
  C.routes.enrolled.level_fee_cents === T.level_fee_cents,
  `${C.routes.enrolled.level_fee_cents} vs ${T.level_fee_cents}`);

check(`The independent steps sum to the published per-level figure — ${flat(stepTotal)}`,
  en.includes(flat(stepTotal)) && ar.includes(flat(stepTotal)));

check(`Six of them sum to the published programme figure — ${flat(stepTotal * T.levels)}`,
  en.includes(flat(stepTotal * T.levels)) && ar.includes(flat(stepTotal * T.levels)));

check('The remission criteria weigh exactly 100%',
  C.remission.criteria.reduce((n, c) => n + c.weight_bp, 0) === BP);

// ── 2 · THE PAIRING THAT MAKES THE CONFERRAL FEE HONEST ──────────────
// Each page must carry BOTH halves: the promise to an enrolled student
// and the reason an independent candidate pays anyway. Either alone is
// the failure.
for (const [label, body, promise, reason] of [
  ['English', en, /no graduation fee/i, /certification is line eight of their level fee/i],
  ['Arabic', ar, /لا رسم تخرّج/, /البند الثامن في رسم مستواه/],
]) {
  check(`${label}: the page still promises an enrolled student no graduation fee`, promise.test(body));
  check(`${label}: ...and explains, on the same page, why an independent candidate pays conferral`,
    reason.test(body));
}
check('English: the no-fees promise is scoped to an enrolled student, not to everyone',
  /only charges an enrolled student meets/i.test(en),
  'an unscoped "only charges the College levies" contradicts the independent route');
check('Arabic: the same scoping',
  /الرسوم الوحيدة التي يلقاها الطالب الملتحق/.test(ar));

// ── 3 · THE AWARD DOES NOT DIFFER BY ROUTE ───────────────────────────
// The whole model rests on this. If a page ever suggests the independent
// award is a lesser award, the price difference stops being defensible.
check('English: the independent examination is stated to be the same examination',
  /same examination an enrolled candidate sits/i.test(en));
check('Arabic: the same',
  /الامتحان نفسه الذي يؤدّيه الملتحق/.test(ar));
const LESSER = /(lesser|reduced|simplified|lighter) (award|certificate|qualification|examination)/i;
check('No page describes the independent award as a lesser one', !LESSER.test(en));

// ── 3b · THE PAID STEP MUST NOT SELL WHAT THE LIBRARY GIVES AWAY ─────
//
// Caught on the day the model shipped, and worth a permanent guard. The
// first draft of the materials step sold "every authored lesson of the
// level, downloadable" — which data/library.json already publishes free
// to anyone in print-ready volumes. That is the College charging $150
// for a book on one page and giving it away on another, and no reader
// who found both would trust either.
//
// The step buys the level INSIDE THE PLATFORM. The books stay free, and
// the page has to say so exactly where the fee is charged.
{
  const materials = C.routes.independent.steps.find((x) => x.key === 'materials');
  check('The materials step does not claim to sell downloadable books',
    !/downloadable/i.test(materials.en.buys),
    'the Library gives those away free — sell access to the platform, not the PDF');
  // MATCHED ON THE SUBSTANCE, not one phrasing of it. The wording moved
  // from "the books stay free" to naming Level I as the open level and
  // linking the access policy, which is more precise — it no longer
  // promises that volumes the Press has not produced will be free. A
  // guard pinned to the old sentence would have forced the vaguer one
  // back.
  //
  // What must survive: the paid step says, where the fee is charged,
  // that Level I is open to anyone, and links to the Library.
  const OPEN_LEVEL = /Level I stays open to everyone/i;
  const OPEN_LEVEL_AR = /يبقى المستوى الأول مفتوحًا للجميع/;
  check('...and says, where the fee is charged, that Level I is open to anyone',
    OPEN_LEVEL.test(materials.en.buys) && /press\/library/.test(materials.en.buys));
  check('...in Arabic too',
    OPEN_LEVEL_AR.test(materials.ar.buys) && /press\/library/.test(materials.ar.buys));

  // And on the rendered pages, not only in the data.
  check('English: the page carries the open-level statement beside the fee',
    OPEN_LEVEL.test(en));
  check('Arabic: the same', OPEN_LEVEL_AR.test(ar));
}

// ── 4 · A REMISSION, NOT A COMMISSION ────────────────────────────────
check('The referral scheme declares that it never pays cash',
  C.referral.never_paid_as_cash === true && C.referral.carries_forward === true);
check('The referral credit cannot clear a whole level fee on its own',
  C.referral.credit_cents < C.routes.enrolled.level_fee_cents,
  `${C.referral.credit_cents} vs ${C.routes.enrolled.level_fee_cents}`);
check('The referral scheme is capped',
  Number.isInteger(C.referral.cap_per_person) && C.referral.cap_per_person >= 1);
for (const [label, body, re] of [
  ['English', en, /never as cash/i],
  ['Arabic', ar, /رصيدًا لا نقدًا/],
]) check(`${label}: the page says the credit is never cash`, re.test(body));

// ── 5 · THE SCHEME IS FUNDED BY A RULE, AND SAYS WHAT THAT COSTS ─────
// A fund defined as a share of income is honest only if the page admits
// the consequence: a thin term means a thin fund. Dropping that sentence
// would turn a rule into an implied promise of a sum.
check('The remission fund is a share of tuition, not a figure',
  Number.isInteger(C.remission.fund_bp_of_tuition) && C.remission.fund_bp_of_tuition > 0);
check('English: the page states the consequence of funding by share',
  /in a term with little tuition there is little remission/i.test(en));
check('Arabic: the same',
  /في فصلٍ رسومه قليلة يكون الإعفاء قليلًا/.test(ar));

// ── 6 · NOTHING UNFINISHED WEARS A TICK (CLAUDE.md §5) ───────────────
// No round has run. The page must say so, and must not imply otherwise.
check('English: the page says no remission has been awarded to anyone',
  /no remission has been awarded to anyone/i.test(en));
check('Arabic: the same',
  /ولم يُمنح إعفاء لأحد/.test(ar));
const AWARDED = /(scholarships?|remissions?) (have been |were )?awarded to \d+/i;
check('No page publishes a count of remissions awarded', !AWARDED.test(en) && !AWARDED.test(ar));

// ── 7 · A SPONSOR NEVER BUYS THE STUDENT ─────────────────────────────
// The partner band is the one place in the model where a third party
// pays, and the conditions that protect the student are the reason it is
// publishable at all.
for (const [label, body, consent, keeps] of [
  ['English', en, /only with that student's written consent/i, /keeps the place and the record/i],
  ['Arabic', ar, /بموافقة خطية من الطالب نفسه/, /يحتفظ بمقعده وبسجله/],
]) {
  check(`${label}: a sponsor sees progress only by the student's own consent`, consent.test(body));
  check(`${label}: ...and a student who leaves the sponsor keeps the place and the record`, keeps.test(body));
}
check('The partner band applies to tuition only',
  C.routes.partner.applies_to === 'enrolled tuition only');

// ── 8 · THE REGISTER AND THE PAGES ARE THE SAME DECISION ─────────────
for (const id of ['F1', 'F2', 'F3', 'F4']) {
  check(`The decisions register carries ${id}`, new RegExp(`### ${id}\\.`).test(gov));
}
check('...and all four are adopted, not proposed',
  (gov.match(/ADOPTED 17 August 2026/g) || []).length >= 6);
check('The resolved deferral is struck from the deferred table',
  !/\| Corporate\/bulk terms \|/.test(gov),
  'the commercial model exists now; the deferral naming its absence must go');

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
