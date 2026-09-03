// scripts/build-commercial.mjs — the commercial model, rendered from the
// one file that holds it.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THIS IS A GENERATOR
// ─────────────────────────────────────────────────────────────────────
// Same reason as scripts/build-tuition.mjs, one level up. That file
// answers "what does a level fee buy?" and refuses to build if the rows
// do not sum to the fee. This one answers the questions around it —
// what a candidate who does not enrol pays, what an institution buying
// twenty seats pays, what a remission is worth, what a referral is
// worth — and refuses to build if any of those figures contradict each
// other or the level fee they are quoted against.
//
// The failure being designed out is specific and common: a college
// publishes a scholarship page, a partner page and a fees page in three
// different months, and by the fourth month they disagree about what a
// level costs. Every figure below is computed in whole cents from
// data/commercial.json and data/tuition.json, so there is exactly one
// place to change a price and no page can be left behind.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT CHECKS BEFORE IT WILL WRITE ANYTHING
// ─────────────────────────────────────────────────────────────────────
//   · the independent steps sum to the published per-level total
//   · six of those totals sum to the published programme total
//   · the remission criteria weights sum to 100%
//   · the partner bands are contiguous, ascending, and none reaches 100%
//   · the referral credit is smaller than every fee it can be set
//     against — a credit worth more than the thing it discounts is a
//     payment, and this model does not make payments
//   · every step, band and criterion has BOTH languages
//
// Injected between markers into pages/admissions-tuition{,.ar}.html, the
// same mechanism build-tuition.mjs uses, because the rest of those pages
// is hand-authored prose a generator has no business owning.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const C = JSON.parse(readFileSync(path.join(ROOT, 'data/commercial.json'), 'utf8'));
const T = JSON.parse(readFileSync(path.join(ROOT, 'data/tuition.json'), 'utf8'));

const BP = 10000;
const money = (cents) => `$${(cents / 100).toLocaleString('en-US',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const flat = (cents) => `$${(cents / 100).toLocaleString('en-US',
  { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const pc = (bp) => `${bp / 100}%`;

// ── the arithmetic, before a single tag is written ────────────────────
const IND = C.routes.independent;
const stepTotal = IND.steps.reduce((n, s) => n + s.cents, 0);
const levels = T.levels;
const indProgramme = stepTotal * levels;
const levelFee = C.routes.enrolled.level_fee_cents;

if (levelFee !== T.level_fee_cents) {
  throw new Error(`commercial.json says a level is ${money(levelFee)} and tuition.json says `
    + `${money(T.level_fee_cents)}. One of them is wrong and neither page may be built.`);
}
if (stepTotal <= 0 || IND.steps.some((s) => s.cents <= 0)) {
  throw new Error('An independent-route step is priced at nothing. A step with no price is not unbundled, it is undisclosed.');
}

const critBp = C.remission.criteria.reduce((n, c) => n + c.weight_bp, 0);
if (critBp !== BP) {
  throw new Error(`The remission criteria weigh ${critBp} basis points, not ${BP}. `
    + 'A weighting that does not sum to 100% cannot be applied consistently to strangers, '
    + 'which is the whole test the scheme has to pass.');
}

const bands = C.routes.partner.bands;
for (let i = 0; i < bands.length; i++) {
  const b = bands[i];
  if (b.bp >= BP) throw new Error(`Partner band ${i} discounts ${pc(b.bp)}. A band at or above 100% gives the place away.`);
  if (i > 0) {
    const prev = bands[i - 1];
    if (b.bp <= prev.bp) throw new Error(`Partner band ${i} does not improve on the one before it.`);
    if (prev.to === null || b.from !== prev.to + 1) {
      throw new Error(`Partner bands ${i - 1} and ${i} leave a gap or overlap between ${prev.to} and ${b.from}. `
        + 'A seat count that falls between two published bands has no published price.');
    }
  }
}

// WHAT SEPARATES A CREDIT FROM A COMMISSION, checked rather than
// asserted. The first cut of this guard demanded the credit be smaller
// than the SMALLEST fee it can meet, and it fired: $250 against a $150
// materials step. That was the wrong invariant — a credit larger than
// one fee is fine, because a credit is applied to a fee and stops at
// zero. What must never happen is money leaving the College, so the
// data has to declare the two rules that prevent it, and the credit
// must not be large enough to clear a whole level fee on its own.
if (C.referral.credit_cents <= 0) throw new Error('A referral credit of nothing is not a scheme.');
if (!C.referral.never_paid_as_cash || !C.referral.carries_forward) {
  throw new Error('The referral scheme must declare never_paid_as_cash and carries_forward. '
    + 'Without both, a credit exceeding a fee becomes a payment, and a payment is a commission.');
}
if (C.referral.credit_cents >= levelFee) {
  throw new Error(`The referral credit ${money(C.referral.credit_cents)} would clear a whole level `
    + `fee of ${money(levelFee)} on its own. Referring is thanked, not employed.`);
}
if (!Number.isInteger(C.referral.cap_per_person) || C.referral.cap_per_person < 1) {
  throw new Error('An uncapped referral scheme is a job with no contract.');
}

for (const s of IND.steps) {
  if (!s.en || !s.ar) throw new Error(`Independent step "${s.key}" is missing an edition.`);
}
for (const c of C.remission.criteria) {
  if (!c.en || !c.ar) throw new Error(`Remission criterion "${c.key}" is missing an edition.`);
}

// ── copy ──────────────────────────────────────────────────────────────
const L = {
  en: {
    routesLabel: 'Two Routes', routesRubric: 'The same award, reached two ways, priced for what each one asks of the College.',
    routesH2: 'Two routes to the same award.',
    routesCaption: 'Everything that differs is above the seal',
    routesLede: `Most people enrol, and should. The independent route exists for the candidate who wants the qualification without the teaching &mdash; and it confers the same award, examined the same way, entered in the same register. What separates the prices is not the credential. It is whether a person teaches you.`,
    enrolledName: 'Enrolled', independentName: 'Independent',
    perLevel: 'per level', programme: 'the whole programme',
    enrolledWhat: 'A named instructor, written feedback on every piece of produced work, tutorials, advising, the platform, the assessment and the award. Four instalments a level, no charge for using them.',
    independentWhat: 'You buy the material, sit the examination and take the award. No instructor, no feedback on practice work, no tutorials, no advising.',
    stepsHead: 'The independent route, itemised.',
    stepsLede: 'Three steps, each bought on its own. A candidate may buy the materials and never sit; sit and never take the award. The College does not require the next step to sell you the last one.',
    buys: 'What it buys',
    theStep: 'Step', theFee: 'Fee',
    totalRow: 'A level, by the independent route',
    conferralLabel: 'Why an enrolled student pays no conferral fee, and this candidate does',
    conferralNote: `The tuition page promises an enrolled student no graduation fee and means it: certification is line eight of their level fee, already paid. An independent candidate has not paid that line, so they pay it here. The award is identical either way &mdash; the difference is only which invoice it was on.`,
    partnerLabel: 'Partner Places', partnerRubric: 'Published bands, so a buyer who does not know to negotiate gets the same price as one who does.',
    partnerH2: 'Institutions buying places.',
    partnerLede: 'A school, an employer or a ministry enrolling a group pays a published band rather than a negotiated rate. A price that depends on who is asking is a price the College cannot defend, and the buyer with the least leverage is always the one who needed the help most.',
    seats: 'Seats', off: 'Off tuition', bandFee: 'Per level, per seat',
    partnerConds: 'What a band does not buy',
    remissionLabel: 'The Foundation Remission', remissionRubric: 'A scholarship scheme funded by a rule rather than announced as a figure.',
    remissionH2: 'The Foundation Remission.',
    remissionFund: `Five per cent of every dollar of tuition the College receives goes into the remission fund. The fund therefore exists exactly when tuition does, cannot be overspent, and needs no capital the College does not have. The consequence is stated rather than hidden: in a term with little tuition there is little remission.`,
    criteriaHead: 'What is weighed, and how much',
    chainHead: 'Who decides, and who can audit it',
    roundHead: 'When a round opens',
    statusLabel: 'Where this stands today',
    referralLabel: 'Referral', referralRubric: 'A remission against your own next fee. Never cash, and never to anyone outside the College.',
    referralH2: 'A credit, not a commission.',
    referralLede: `The moment a person is paid cash for bringing the College a student, that person has an interest in what they say about it, and the College has bought a salesperson it cannot supervise. So the benefit is a credit against the referrer's own next fee, it is capped, and it settles only after the referred student's refund window has closed.`,
    worth: 'Worth', cap: 'Cap', settles: 'Settles',
    perReferral: 'per referral, as credit',
    capValue: `${C.referral.cap_per_person} per person, for the whole programme`,
    settlesValue: `${C.referral.settles_after_days} days after the referred student starts`,
    alumniLabel: 'Alumni', alumniRubric: 'What an award-holder has that a stranger does not.',
    alumniH2: 'Standing, not a discount.',
    alumniLede: `Almost everything a college normally sells its alumni, this one already gives away: the Library is free to anyone, verification is free to anyone, and certificates and transcripts are reissued free for life to the person they belong to. There is no discount left to invent that would not be an admission the first fee was too high. What an award-holder has instead is standing.`,
  },
  ar: {
    routesLabel: 'مساران', routesRubric: 'الشهادة نفسها، يُبلغ إليها من طريقين، وسعر كلٍّ بقدر ما يطلبه من الكلية.',
    routesH2: 'مساران إلى الشهادة نفسها.',
    routesCaption: 'كل ما يفترق فوق الختم',
    routesLede: 'أكثر الناس يلتحقون، وهذا هو الأولى. أما المسار المستقل فلمن أراد المؤهل بلا تدريس &mdash; وهو يمنح الشهادة نفسها، تُمتحن بالطريقة نفسها، وتُقيَّد في السجل نفسه. والذي يفرّق بين السعرين ليس الوثيقة، بل هل يعلّمك إنسان أم لا.',
    enrolledName: 'ملتحق', independentName: 'مستقل',
    perLevel: 'للمستوى', programme: 'البرنامج كله',
    enrolledWhat: 'مدرّس مسمّى، وتغذية راجعة مكتوبة على كل عمل تنتجه، ودروس خصوصية، وإرشاد، والمنصة، والتقييم، والشهادة. أربع دفعات في المستوى، بلا رسم على استعمالها.',
    independentWhat: 'تشتري المادة، وتؤدّي الامتحان، وتأخذ الشهادة. بلا مدرّس، وبلا تغذية راجعة على أعمال التمرين، وبلا دروس خصوصية، وبلا إرشاد.',
    stepsHead: 'المسار المستقل، مفصَّلًا.',
    stepsLede: 'ثلاث خطوات، تُشترى كل واحدة وحدها. وللمرشح أن يشتري المواد ولا يمتحن، وأن يمتحن ولا يأخذ الشهادة. ولا تشترط الكلية الخطوة التالية لتبيعك التي قبلها.',
    buys: 'ماذا يشتري',
    theStep: 'الخطوة', theFee: 'الرسم',
    totalRow: 'مستوى واحد بالمسار المستقل',
    conferralLabel: 'لماذا لا يدفع الملتحق رسم منح، ويدفعه هذا المرشح',
    conferralNote: 'تَعِد صفحة الرسوم الملتحقَ بألّا رسم تخرّج، وتعني ما تقول: فالشهادة هي البند الثامن في رسم مستواه، مدفوعًا سلفًا. أما المرشح المستقل فلم يدفع ذلك البند، فيدفعه هنا. والشهادة واحدة في الحالين &mdash; والفرق في أي فاتورة كانت لا غير.',
    partnerLabel: 'مقاعد الشراكة', partnerRubric: 'شرائح منشورة، فمن لا يُحسن المساومة يأخذ السعر الذي يأخذه من يُحسنها.',
    partnerH2: 'المؤسسات التي تشتري مقاعد.',
    partnerLede: 'المدرسة أو جهة العمل أو الوزارة التي تُلحق مجموعة تدفع شريحة منشورة لا سعرًا متفاوَضًا عليه. فالسعر الذي يتغيّر بتغيّر السائل سعرٌ لا تستطيع الكلية الدفاع عنه، والمشتري الأضعف موقفًا هو دائمًا من كان أحوج إلى العون.',
    seats: 'المقاعد', off: 'خصم على الرسوم', bandFee: 'للمستوى، للمقعد',
    partnerConds: 'ما لا تشتريه الشريحة',
    remissionLabel: 'إعفاء التأسيس', remissionRubric: 'برنامج منح يموّله قاعدة، لا رقمٌ يُعلَن.',
    remissionH2: 'إعفاء التأسيس.',
    remissionFund: 'خمسة في المئة من كل دولار رسوم تقبضه الكلية يذهب إلى صندوق الإعفاء. فالصندوق قائم متى قامت الرسوم، ولا يمكن أن يُنفَق أكثر مما فيه، ولا يحتاج مالًا لا تملكه الكلية. والنتيجة تُذكر ولا تُخفى: في فصلٍ رسومه قليلة يكون الإعفاء قليلًا.',
    criteriaHead: 'ما الذي يُوزَن، وبكم',
    chainHead: 'من يقرر، ومن يستطيع مراجعته',
    roundHead: 'متى تُفتح الدورة',
    statusLabel: 'أين يقف هذا اليوم',
    referralLabel: 'الإحالة', referralRubric: 'إعفاء من رسمك أنت. لا نقد أبدًا، ولا لأحد من خارج الكلية.',
    referralH2: 'رصيد، لا عمولة.',
    referralLede: 'ما إن يُدفع لإنسان نقدٌ مقابل أن يأتي الكلية بطالب، حتى يصير له مصلحة فيما يقوله عنها، وتكون الكلية قد اشترت بائعًا لا تستطيع الإشراف عليه. فالمنفعة إذًا رصيد على رسم المُحيل نفسه، ومحدودة بسقف، ولا تُسوّى إلا بعد إغلاق نافذة استرداد الطالب المُحال.',
    worth: 'القيمة', cap: 'السقف', settles: 'التسوية',
    perReferral: 'للإحالة الواحدة، رصيدًا',
    capValue: `${C.referral.cap_per_person} إحالات للشخص، في البرنامج كله`,
    settlesValue: `بعد ${C.referral.settles_after_days} يومًا من بدء الطالب المُحال`,
    alumniLabel: 'الخريجون', alumniRubric: 'ما يملكه حامل الشهادة ولا يملكه غيره.',
    alumniH2: 'مكانة، لا خصم.',
    alumniLede: 'أكثر ما تبيعه الكليات لخريجيها تعطيه هذه الكلية مجانًا أصلًا: فالمكتبة مجانية لأي أحد، والتحقق مجاني لأي أحد، والشهادات وكشوف الدرجات تُعاد إصدارًا مجانيًا مدى الحياة لصاحبها. فلم يبقَ خصم يُخترَع إلا وكان إقرارًا بأن الرسم الأول كان أعلى مما ينبغي. والذي يملكه حامل الشهادة بدل ذلك هو المكانة.',
  },
};

const dir = (lang) => (lang === 'ar' ? 'rtl' : 'ltr');
const ltr = (s) => `<span dir="ltr">${s}</span>`;
const num = (lang, s) => (lang === 'ar' ? ltr(s) : s);

function card({ icon, num: n, h3, p, dark = false }) {
  return `      <div class="card${dark ? ' card--dark' : ''} reveal tilt edge-lit${dark ? '' : ' edge-lit--light'} aurum">
        <span class="tilt__sheen" aria-hidden="true"></span>
        <span class="badge-dome${dark ? ' badge-dome--dark' : ''} badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg></span>
        <span class="card__num">${n}</span>
        <h3>${h3}</h3>
        <p>${p}</p>
      </div>`;
}

function leaf({ ground, id, contents, numeral, label, rubric, body }) {
  return `<section class="leaf ${ground}"${id ? ` id="${id}"` : ''}${contents ? ` data-contents="${contents}"` : ''}>
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/crest-plate.svg)"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${numeral}</span>
      <span class="leaf__label">${label}</span>
      <p class="leaf__rubric">${rubric}</p>
    </div>
    <div class="leaf__body reveal">
${body}
    </div>
  </div>
</section>`;
}

function routesLeaf(lang) {
  const t = L[lang];
  const rows = IND.steps.map((s) => `          <tr><td><strong>${s[lang].name}</strong></td>`
    + `<td>${s[lang].buys}</td><td>${num(lang, flat(s.cents))}</td></tr>`).join('\n');
  return leaf({
    ground: 'section--paper grain', id: 'routes', contents: t.routesLabel,
    numeral: lang === 'ar' ? '١' : 'I', label: t.routesLabel, rubric: t.routesRubric,
    body: `      <div class="section-head">
        <h2>${t.routesH2}</h2>
        <p class="lede">${t.routesLede}</p>
      </div>

      <!-- THE DRAWING, before the two cards. Two prices for one award
           invite two wrong readings: that the cheaper figure buys less
           of a credential, or that the dearer one is padded. The plate
           runs both columns into a single seal — the same examination,
           the same award, the same entry in the register — so
           everything that differs is visibly above it and nothing that
           differs is below. It also shows where conferral is paid for
           on each route, which is what lets the promise of no
           graduation fee and a priced conferral step both be true.
           Figures are read from data/commercial.json and
           data/tuition.json by scripts/art/generate-two-routes.mjs,
           which refuses to render if the two ledgers disagree. -->
      <figure class="diagram diagram--wide">
        {{SVG:assets/art/two-routes${lang === 'ar' ? '.ar' : ''}.svg}}
        <figcaption class="diagram__caption">
          <svg class="icon" aria-hidden="true"><use href="#i-seal"/></svg>
          ${t.routesCaption}
        </figcaption>
      </figure>

      <div class="grid grid--2">
${card({ icon: 'i-lectern', num: t.enrolledName, h3: `${num(lang, money(levelFee))} &middot; ${t.perLevel}`, p: t.enrolledWhat })}
${card({ icon: 'i-compass', num: t.independentName, h3: `${num(lang, flat(stepTotal))} &middot; ${t.perLevel}`, p: t.independentWhat })}
      </div>

      <div class="section-head" style="margin-top:44px">
        <h3 style="font-size:1.2rem">${t.stepsHead}</h3>
        <p class="lede">${t.stepsLede}</p>
      </div>
      <div class="table-scroll ledger-mount edge-lit">
        <table class="ledger">
          <thead><tr><th>${t.theStep}</th><th>${t.buys}</th><th>${t.theFee}</th></tr></thead>
          <tbody>
${rows}
            <tr><td colspan="2"><strong>${t.totalRow}</strong></td><td><strong>${num(lang, flat(stepTotal))}</strong></td></tr>
            <tr><td colspan="2"><strong>${t.programme}</strong></td><td><strong>${num(lang, flat(indProgramme))}</strong></td></tr>
          </tbody>
        </table>
      </div>
      <div class="callout">
        <span class="callout__label">${t.conferralLabel}</span>
        <p>${t.conferralNote}</p>
      </div>`,
  });
}

function partnerLeaf(lang) {
  const t = L[lang];
  const P = C.routes.partner;
  const rows = bands.map((b) => {
    const seats = b.to === null ? `${b.from}+` : `${b.from}–${b.to}`;
    const fee = Math.round(levelFee * (BP - b.bp) / BP);
    return `          <tr><td><strong>${num(lang, seats)}</strong></td><td>${num(lang, pc(b.bp))}</td><td>${num(lang, money(fee))}</td></tr>`;
  }).join('\n');
  const conds = (lang === 'ar' ? P.conditions_ar : P.conditions_en)
    .map((c) => `          <li><svg class="icon" aria-hidden="true"><use href="#i-struck"/></svg><span>${c}</span></li>`).join('\n');
  return leaf({
    ground: 'section--light grain', id: 'partners', contents: t.partnerLabel,
    numeral: lang === 'ar' ? '٢' : 'II', label: t.partnerLabel, rubric: t.partnerRubric,
    body: `      <div class="section-head">
        <h2>${t.partnerH2}</h2>
        <p class="lede">${t.partnerLede}</p>
      </div>
      <div class="table-scroll ledger-mount edge-lit">
        <table class="ledger">
          <thead><tr><th>${t.seats}</th><th>${t.off}</th><th>${t.bandFee}</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
      <div class="callout">
        <span class="callout__label">${t.partnerConds}</span>
        <ul class="check-list">
${conds}
        </ul>
      </div>`,
  });
}

function remissionLeaf(lang) {
  const t = L[lang];
  const R = C.remission;
  const crits = R.criteria.map((c) => card({
    icon: c.key === 'need' ? 'i-accord' : 'i-laurel',
    num: num(lang, pc(c.weight_bp)), h3: c[lang].name, p: c[lang].test,
  })).join('\n');
  // A PROCEDURE IS A SEQUENCE, NOT A CHECKLIST. The first cut rendered
  // these as ticked items and the audit blocked the build under
  // CLAUDE.md §5 — correctly, though not for the reason it gave. No
  // round has run, so a column of ticks beside "the panel's decisions
  // are minuted" reads as four things that have happened. They are four
  // things that WILL happen, in order, and a numbered list says that
  // without any mark having to be argued about.
  const chain = (lang === 'ar' ? R.decision_chain_ar : R.decision_chain_en)
    .map((s, i) => `          <li><span class="num">${num(lang, String(i + 1))}</span><span>${s}</span></li>`).join('\n');
  const kinds = (lang === 'ar' ? R.award_kinds_ar : R.award_kinds_en)
    .map((k, i) => `          <li><span class="num">${num(lang, String(i + 1))}</span><span>${k}</span></li>`).join('\n');
  return leaf({
    ground: 'section--dark grain aurora', id: 'funding', contents: t.remissionLabel,
    numeral: lang === 'ar' ? '٣' : 'III', label: t.remissionLabel, rubric: t.remissionRubric,
    body: `      <div class="section-head">
        <h2>${t.remissionH2}</h2>
        <p class="lede">${t.remissionFund}</p>
      </div>
      <div class="section-head" style="margin-top:36px">
        <h3 style="font-size:1.2rem">${t.criteriaHead}</h3>
      </div>
      <div class="grid grid--2">
${crits}
      </div>
      <div class="callout">
        <span class="callout__label">${t.chainHead}</span>
        <ol class="dot-list">
${chain}
        </ol>
      </div>
      <div class="callout">
        <span class="callout__label">${t.roundHead}</span>
        <p>${lang === 'ar' ? R.round_ar : R.round_en}</p>
        <ol class="dot-list">
${kinds}
        </ol>
      </div>
      <div class="callout">
        <span class="callout__label">${t.statusLabel}</span>
        <p>${lang === 'ar' ? R.status_ar : R.status_en}</p>
      </div>`,
  });
}

function referralLeaf(lang) {
  const t = L[lang];
  const rules = (lang === 'ar' ? C.referral.rules_ar : C.referral.rules_en)
    .map((r) => `          <li><svg class="icon" aria-hidden="true"><use href="#i-struck"/></svg><span>${r}</span></li>`).join('\n');
  return leaf({
    ground: 'section--paper grain', id: 'referral', contents: t.referralLabel,
    numeral: lang === 'ar' ? '٤' : 'IV', label: t.referralLabel, rubric: t.referralRubric,
    body: `      <div class="section-head">
        <h2>${t.referralH2}</h2>
        <p class="lede">${t.referralLede}</p>
      </div>
      <div class="grid grid--3">
${card({ icon: 'i-crest', num: t.worth, h3: num(lang, flat(C.referral.credit_cents)), p: t.perReferral })}
${card({ icon: 'i-scales', num: t.cap, h3: num(lang, String(C.referral.cap_per_person)), p: t.capValue })}
${card({ icon: 'i-clocktower', num: t.settles, h3: num(lang, `${C.referral.settles_after_days}`), p: t.settlesValue })}
      </div>
      <div class="callout">
        <span class="callout__label">${lang === 'ar' ? C.referral.usable_against_ar : C.referral.usable_against_en}</span>
        <ul class="check-list">
${rules}
        </ul>
      </div>`,
  });
}

function alumniLeaf(lang) {
  const t = L[lang];
  const stand = (lang === 'ar' ? C.alumni.standings_ar : C.alumni.standings_en);
  const icons = ['i-compass', 'i-crest', 'i-ledger', 'i-book'];
  const cards = stand.map((s, i) => card({ icon: icons[i % icons.length], num: num(lang, String(i + 1).padStart(2, '0')), h3: s.name, p: s.what, dark: true })).join('\n');
  return leaf({
    ground: 'section--oxford grain aurora', id: 'alumni', contents: t.alumniLabel,
    numeral: lang === 'ar' ? '٥' : 'V', label: t.alumniLabel, rubric: t.alumniRubric,
    body: `      <div class="section-head">
        <h2>${t.alumniH2}</h2>
        <p class="lede">${t.alumniLede}</p>
      </div>
      <div class="grid grid--2">
${cards}
      </div>`,
  });
}

const section = (lang) => [
  routesLeaf(lang), partnerLeaf(lang), remissionLeaf(lang), referralLeaf(lang), alumniLeaf(lang),
].join('\n\n');

// ── write ─────────────────────────────────────────────────────────────
const OPEN = '<!-- >>> GENERATED FROM scripts/build-commercial.mjs — DO NOT EDIT BY HAND -->';
const CLOSE = '<!-- <<< END COMMERCIAL MODEL -->';

// The hand-authored scholarships section this replaces. It said "a
// mechanism exists, a scheme does not", which was true until the scheme
// was adopted and is the sentence the generated block now answers. It is
// removed by marker rather than by hand so that re-running is idempotent.
const OLD_FUNDING_START = '<section class="section--light section-pad" id="funding"';
const OLD_FUNDING_START_AR = '<section class="section--light section-pad" id="funding"';

for (const [lang, file] of [['en', 'admissions-tuition.html'], ['ar', 'admissions-tuition.ar.html']]) {
  const full = path.join(ROOT, 'pages', file);
  let text = readFileSync(full, 'utf8');
  const block = `${OPEN}\n${section(lang)}\n${CLOSE}`;

  if (text.includes(OPEN)) {
    const start = text.indexOf(OPEN);
    const end = text.indexOf(CLOSE) + CLOSE.length;
    if (end < start) throw new Error(`${file}: the commercial markers are out of order.`);
    text = text.slice(0, start) + block + text.slice(end);
  } else {
    const anchor = lang === 'ar' ? OLD_FUNDING_START_AR : OLD_FUNDING_START;
    const at = text.indexOf(anchor);
    if (at < 0) throw new Error(`${file}: cannot find the scholarships section to replace.`);
    const closeAt = text.indexOf('</section>', at);
    if (closeAt < 0) throw new Error(`${file}: the scholarships section never closes.`);
    text = text.slice(0, at) + block + text.slice(closeAt + '</section>'.length);
  }
  writeFileSync(full, text);
  console.log(`commercial: ${file} — five leaves written between markers.`);
}

console.log(`  independent: ${IND.steps.map((s) => flat(s.cents)).join(' + ')} = ${flat(stepTotal)} a level, `
  + `${flat(indProgramme)} the programme (enrolled: ${money(levelFee)} / ${flat(C.routes.enrolled.programme_total_usd * 100)}).`);
console.log(`  partner bands: ${bands.map((b) => `${b.from}${b.to === null ? '+' : `-${b.to}`}@${pc(b.bp)}`).join(', ')}`);
console.log(`  remission: ${pc(C.remission.fund_bp_of_tuition)} of tuition, criteria ${C.remission.criteria.map((c) => `${c.key} ${pc(c.weight_bp)}`).join(' / ')}`);
console.log(`  referral: ${flat(C.referral.credit_cents)} credit, cap ${C.referral.cap_per_person}, settles +${C.referral.settles_after_days}d`);
