#!/usr/bin/env node
// scripts/build-institution.mjs — the quality architecture, rendered
// from the one file that holds it.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS PAGE IS FOR
// ─────────────────────────────────────────────────────────────────────
// A prestigious college's quality architecture is usually published as
// a list of committee names. The reader learns that seven bodies exist
// and nothing else: not what any of them decides, not who they report
// to, and — the question that actually matters — whether any of them
// has ever met.
//
// This page publishes the third thing beside the first two. Every body
// carries its remit, its reporting line, and its true state, drawn from
// the same three-way distinction the rest of the instrument uses:
//
//     established   the instrument exists; nobody is appointed
//     constituted   members appointed; it has not met
//     operating     it has met, and its decisions are minuted
//
// Nothing here may be promoted because a page would read better.
// CLAUDE.md §5 governs it, tests/institution.test.mjs enforces it, and
// a body that has never met wears the open ring rather than the tick.
//
// ─────────────────────────────────────────────────────────────────────
// WHY GENERATED
// ─────────────────────────────────────────────────────────────────────
// Twelve bodies and three frameworks, each in two languages, is exactly
// the shape of content that drifts: an office described as working on
// one page and vacant on another, six months apart, by two people who
// were both being careful. data/institution.json is the single source,
// and this refuses to build if a body is missing either edition.
//
//   node scripts/build-institution.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitPage, reportEmit } from './lib/emit-page.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const D = JSON.parse(readFileSync(path.join(ROOT, 'data/institution.json'), 'utf8'));

// ── the checks that run before a tag is written ──────────────────────
const STATES = ['established', 'constituted', 'operating'];
const everyBody = [
  { ...D.commission, kind: 'commission' },
  ...D.subcommittees.map((s) => ({ ...s, kind: 'subcommittee', status: 'established' })),
  ...D.bodies.map((b) => ({ ...b, kind: 'body' })),
];

for (const b of everyBody) {
  if (!b.en || !b.ar) throw new Error(`${b.code} is missing an edition. A governance instrument a reader cannot read is not published.`);
  if (!b.en.name || !b.ar.name) throw new Error(`${b.code} is missing a name in one edition.`);
  if (!b.en.remit || !b.ar.remit) throw new Error(`${b.code} has no remit. A body without a stated remit is a name on a chart.`);
  if (!STATES.includes(b.status)) throw new Error(`${b.code} has status "${b.status}", which is not one of ${STATES.join(', ')}.`);
}
for (const f of ['quality_review', 'observation', 'excellence']) {
  if (!D[f].en || !D[f].ar) throw new Error(`Framework "${f}" is missing an edition.`);
}
if (D.quality_review.en.reviews.length !== D.quality_review.ar.reviews.length
  || D.observation.en.areas.length !== D.observation.ar.areas.length
  || D.excellence.en.measures.length !== D.excellence.ar.measures.length) {
  throw new Error('A framework has a different number of items in its two editions, so one page is stating something the other does not.');
}

// THE CLAIM WITH A NAMED PERSON IN IT. An examiner is published as
// holding the office only when the appointment has a date AND a holder.
// A name without a minuted appointment is a claim about that person,
// not about the College, and it is the one claim on this site that
// could damage somebody who never agreed to it.
const EX = D.external_examiner;
if ((EX.appointed && !EX.holder) || (EX.holder && !EX.appointed)) {
  throw new Error('The External Examiner has a holder without an appointment date, or a date '
    + 'without a holder. Publishing a person into an office needs both, because the page states '
    + 'that a named individual holds it from a given day.');
}

const ar = (lang) => lang === 'ar';
const t = (lang, key) => COPY[lang][key];
const num = (lang, n) => (ar(lang) ? String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const AR_NUM = ['١', '٢', '٣', '٤', '٥', '٦', '٧'];

const COPY = {
  en: {
    heroEyebrow: 'Governance',
    h1: 'The quality architecture, with the state of every office in it.',
    lede: 'Twelve standing bodies and three frameworks. Each one carries what it decides, who it '
      + 'answers to, and whether it has ever met &mdash; because a committee nobody can tell the '
      + 'state of is a name on a chart.',
    statusLabel: { established: 'Established &middot; no members appointed', constituted: 'Constituted &middot; has not met', operating: 'Operating' },
    commissionLabel: 'The Commission', commissionRubric: 'A permanent body, because the work does not stop between meetings.',
    subLabel: 'Subcommittees', subRubric: 'Seven, each owning one question and reporting through the Commission.',
    bodiesLabel: 'Councils and Offices', bodiesRubric: 'What each advises on, and what it may not decide.',
    examinerLabel: 'External Examiner', examinerRubric: 'The one office that cannot be filled from inside.',
    reviewLabel: 'The Annual Cycle', reviewRubric: 'Seven reviews a year, each producing the same four things.',
    obsLabel: 'Observation', obsRubric: 'How teaching is reviewed, and what an observation must produce.',
    excellenceLabel: 'Teaching Excellence', excellenceRubric: 'Measured, or marked as not yet measured. Never estimated.',
    remitHead: 'Remit', reportsHead: 'Reports to', stateHead: 'State',
    whyHead: 'Why it is set up this way',
    outputsHead: 'Every review produces four things, in this order',
    areasHead: 'What an observation covers',
    obsOutputsHead: 'What every observation produces',
    reviewsHead: 'The seven reviews',
    measuresHead: 'The measures',
    examinerReviews: 'What the External Examiner independently reviews',
    examinerReporting: 'Reporting',
    vacant: 'The office is vacant. No External Examiner has been appointed, so every award '
      + 'conferred to date was set, marked and moderated inside the College and by nobody outside it.',
    cycleNone: 'The framework is adopted. No annual cycle has completed a turn against it, so it '
      + 'has produced no findings, no recommendations and no implementation plan yet.',
    obsNone: 'The framework is adopted. No lesson has been observed under it, so the observed '
      + 'column of the teaching support record stands empty and is marked empty.',
    adopted: 'Adopted 18 August 2026',
    plateAlt: 'An engraved charter on aged paper, its clauses ruled in even lines beneath a plain heading.',
    plateCaption: 'A structure is only as good as the state you can read off it',
  },
  ar: {
    heroEyebrow: 'الحوكمة',
    h1: 'بنية الجودة، وحال كل منصب فيها.',
    lede: 'اثنتا عشرة هيئة دائمة وثلاثة أطر. كل واحدة تحمل ما تقرّره، ولمن ترفع، وهل اجتمعت قط '
      + '&mdash; لأن لجنةً لا يعرف أحد حالها اسمٌ في مخطط.',
    statusLabel: { established: 'مُنشأة &middot; لم يُعيَّن أعضاؤها', constituted: 'مُشكَّلة &middot; لم تجتمع', operating: 'عاملة' },
    commissionLabel: 'الهيئة', commissionRubric: 'هيئة دائمة، لأن العمل لا يتوقف بين اجتماع واجتماع.',
    subLabel: 'اللجان الفرعية', subRubric: 'سبعٌ، تتولى كل واحدة سؤالًا وترفع عبر الهيئة.',
    bodiesLabel: 'المجالس والمكاتب', bodiesRubric: 'فيمَ يشير كلٌّ منها، وما الذي لا يملك أن يقرّره.',
    examinerLabel: 'الممتحن الخارجي', examinerRubric: 'المنصب الوحيد الذي لا يُشغَل من الداخل.',
    reviewLabel: 'الدورة السنوية', reviewRubric: 'سبع مراجعات في السنة، تُنتج كلٌّ منها الأمور الأربعة نفسها.',
    obsLabel: 'المشاهدة', obsRubric: 'كيف يُراجَع التدريس، وما الذي يجب أن تُنتجه المشاهدة.',
    excellenceLabel: 'التميّز في التدريس', excellenceRubric: 'مقيسٌ، أو موسومٌ بأنه لم يُقَس بعد. ولا يُقدَّر أبدًا.',
    remitHead: 'الاختصاص', reportsHead: 'ترفع إلى', stateHead: 'الحال',
    whyHead: 'لماذا رُتِّبت هكذا',
    outputsHead: 'كل مراجعة تُنتج أربعة أمور، بهذا الترتيب',
    areasHead: 'ما تغطيه المشاهدة',
    obsOutputsHead: 'ما تُنتجه كل مشاهدة',
    reviewsHead: 'المراجعات السبع',
    measuresHead: 'المقاييس',
    examinerReviews: 'ما يراجعه الممتحن الخارجي مستقلًّا',
    examinerReporting: 'الرفع',
    vacant: 'المنصب شاغر. لم يُعيَّن ممتحن خارجي، فكل شهادة مُنِحت حتى اليوم وُضعت وصُحِّحت وعُدِّلت '
      + 'داخل الكلية ولم يفعل ذلك أحد من خارجها.',
    cycleNone: 'الإطار مُعتمد. ولم تُتِمّ أي دورة سنوية دورةً كاملة وفقه، فلم يُنتج بعدُ نتائجَ ولا '
      + 'توصياتٍ ولا خطةَ تنفيذ.',
    obsNone: 'الإطار مُعتمد. ولم يُشاهَد درسٌ وفقه، فعمود المشاهدة في سجل الإسناد التعليمي فارغ '
      + 'وموسومٌ بأنه فارغ.',
    adopted: 'اعتُمدت في 18 أغسطس 2026',
    plateAlt: 'ميثاق منقوش على ورق عتيق، بنوده مسطَّرة في أسطر متساوية تحت عنوان بسيط.',
    plateCaption: 'البنية بقدر ما تستطيع أن تقرأ حالها',
  },
};

const REPORTS_AR = {
  'Board of Governors': 'مجلس الأمناء',
  'Institutional Quality Commission': 'هيئة الجودة المؤسسية',
  'College Executive': 'الإدارة التنفيذية',
  'Educational Innovation Board': 'مجلس الابتكار التعليمي',
};

function leaf({ ground, id, contents, numeral, label, rubric, body, plate = 'crest-plate' }) {
  return `<section class="leaf ${ground}"${id ? ` id="${id}"` : ''}${contents ? ` data-contents="${contents}"` : ''}>
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/${plate}.svg)"></span>
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

// A BODY IS A STRUCK CARD WITH ITS STATE ON IT (CLAUDE.md §2, §5). The
// mark is the whole point: `#i-struck` is settled, `#i-ring` is an open
// circle, and no body here has met, so none of them wears a tick.
function bodyCard(lang, b, dark) {
  const L = COPY[lang];
  const mark = b.status === 'operating' ? 'i-struck' : 'i-ring';
  const reports = b.reports_to
    ? (ar(lang) ? (REPORTS_AR[b.reports_to] || b.reports_to) : b.reports_to)
    : null;
  return `      <div class="card${dark ? ' card--dark' : ''} reveal tilt edge-lit${dark ? '' : ' edge-lit--light'} aurum">
        <span class="tilt__sheen" aria-hidden="true"></span>
        <span class="badge-dome${dark ? ' badge-dome--dark' : ''} badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#i-accord"/></svg></span>
        <span class="card__num">${b.code}</span>
        <h3>${b[lang].name}</h3>
        <p>${b[lang].remit}</p>
        ${reports ? `<p class="form-note">${L.reportsHead}: <strong>${reports}</strong></p>` : ''}
        <span class="attest__evidence attest__evidence--${b.status === 'operating' ? 'held' : 'open'}"><svg class="icon" aria-hidden="true"><use href="#${mark}"/></svg> ${L.statusLabel[b.status]}</span>
      </div>`;
}

function page(lang) {
  const L = COPY[lang];
  const n = (i) => (ar(lang) ? AR_NUM[i] : ROMAN[i]);
  const QR = D.quality_review[lang];
  const OB = D.observation[lang];
  const EXL = D.excellence[lang];
  const EXM = EX[lang];

  // THE SHAPE THE BUILD RECOGNISES AS A MASTHEAD. scripts/build.js adds
  // `.page-hero` to an opening `<section class="section--dark
  // section-pad">` and to nothing else, so a page that invents its own
  // hero class silently ships without one — which this page did on its
  // first build, and tests/build-output.test.mjs caught.
  const hero = `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">${L.heroEyebrow}</span>
    <h1>${L.h1}</h1>
    <p class="lede">${L.lede}</p>
    <p class="form-note">${L.adopted}</p>
    <figure class="plate plate--drift plate--photo reveal" style="--plate-ratio: 16 / 9">
      <div class="plate__frame tilt gold-live edge-lit edge-lit--light aurum">
        <span class="tilt__sheen" aria-hidden="true"></span>
        <img src="/assets/images/plates/charter.jpg" alt="${L.plateAlt}" loading="lazy" decoding="async">
        <span class="plate__tone" aria-hidden="true"></span>
        <span class="plate__tone plate__tone--warm" aria-hidden="true"></span>
      </div>
      <figcaption class="plate__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-scroll"/></svg>
        ${L.plateCaption}
      </figcaption>
    </figure>
  </div>
</section>`;

  const commission = leaf({
    ground: 'section--paper grain', id: 'commission', contents: L.commissionLabel,
    numeral: n(0), label: L.commissionLabel, rubric: L.commissionRubric,
    body: `      <div class="section-head">
        <h2>${D.commission[lang].name}</h2>
        <p class="lede">${D.commission[lang].remit}</p>
      </div>
      <div class="grid grid--1">
${bodyCard(lang, { ...D.commission, kind: 'commission' }, false)}
      </div>
      <div class="callout">
        <span class="callout__label">${L.whyHead}</span>
        <p>${D.commission[lang].why}</p>
      </div>`,
  });

  const subs = leaf({
    ground: 'section--light grain', id: 'subcommittees', contents: L.subLabel,
    numeral: n(1), label: L.subLabel, rubric: L.subRubric,
    body: `      <div class="section-head">
        <h2>${L.subLabel}</h2>
        <p class="lede">${L.subRubric}</p>
      </div>
      <div class="grid grid--2">
${D.subcommittees.map((s) => bodyCard(lang, { ...s, status: 'established', reports_to: 'Institutional Quality Commission' }, false)).join('\n')}
      </div>`,
  });

  const bodies = leaf({
    ground: 'section--dark grain aurora', id: 'councils', contents: L.bodiesLabel,
    numeral: n(2), label: L.bodiesLabel, rubric: L.bodiesRubric,
    body: `      <div class="section-head">
        <h2>${L.bodiesLabel}</h2>
      </div>
      <div class="grid grid--2">
${D.bodies.map((b) => bodyCard(lang, b, true)).join('\n')}
      </div>`,
  });

  const examiner = leaf({
    ground: 'section--paper grain', id: 'examiner', contents: L.examinerLabel,
    numeral: n(3), label: L.examinerLabel, rubric: L.examinerRubric,
    body: `      <div class="section-head">
        <h2>${EXM.name}</h2>
        <p class="lede">${EXM.remit}</p>
      </div>
      <h3 style="font-size:1.1rem">${L.examinerReviews}</h3>
      <ul class="check-list">
${EXM.reviews.map((r) => `        <li><svg class="icon" aria-hidden="true"><use href="#i-ring"/></svg><span>${r}</span></li>`).join('\n')}
      </ul>
      <p class="form-note"><strong>${L.examinerReporting}.</strong> ${EXM.reporting}</p>
      <div class="callout">
        <span class="callout__label">${L.stateHead}</span>
        <p>${EX.appointed ? `${EX.holder} &middot; ${EX.appointed}` : L.vacant}</p>
      </div>
      <div class="callout">
        <span class="callout__label">${L.whyHead}</span>
        <p>${EXM.why}</p>
      </div>`,
  });

  const review = leaf({
    ground: 'section--light grain', id: 'cycle', contents: L.reviewLabel,
    numeral: n(4), label: L.reviewLabel, rubric: L.reviewRubric,
    body: `      <div class="section-head">
        <h2>${QR.name}</h2>
        <p class="lede">${QR.lede}</p>
      </div>
      <div class="table-scroll ledger-mount edge-lit">
        <table class="ledger">
          <thead><tr><th scope="col">${L.reviewsHead}</th><th scope="col">${L.remitHead}</th></tr></thead>
          <tbody>
${QR.reviews.map(([name, what]) => `            <tr><td><strong>${name}</strong></td><td>${what}</td></tr>`).join('\n')}
          </tbody>
        </table>
      </div>
      <h3 style="font-size:1.1rem;margin-top:2.4em">${L.outputsHead}</h3>
      <ol class="dot-list">
${QR.outputs.map((o) => `        <li><span class="num"></span><span>${o}</span></li>`).join('\n')}
      </ol>
      <p class="form-note">${QR.outputs_note}</p>
      <div class="callout">
        <span class="callout__label">${L.stateHead}</span>
        <p>${L.cycleNone}</p>
      </div>`,
  });

  const obs = leaf({
    ground: 'section--dark grain aurora', id: 'observation', contents: L.obsLabel,
    numeral: n(5), label: L.obsLabel, rubric: L.obsRubric,
    body: `      <div class="section-head">
        <h2>${OB.name}</h2>
        <p class="lede">${OB.lede}</p>
      </div>
      <div class="grid grid--2">
        <div class="card card--dark reveal tilt edge-lit aurum">
          <span class="tilt__sheen" aria-hidden="true"></span>
          <span class="badge-dome badge-dome--dark badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#i-lectern"/></svg></span>
          <span class="card__num">${num(lang, OB.areas.length)}</span>
          <h3>${L.areasHead}</h3>
          <ul class="dot-list">
${OB.areas.map((a) => `            <li><span class="num"></span><span>${a}</span></li>`).join('\n')}
          </ul>
        </div>
        <div class="card card--dark reveal tilt edge-lit aurum">
          <span class="tilt__sheen" aria-hidden="true"></span>
          <span class="badge-dome badge-dome--dark badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#i-quill"/></svg></span>
          <span class="card__num">${num(lang, OB.outputs.length)}</span>
          <h3>${L.obsOutputsHead}</h3>
          <ul class="dot-list">
${OB.outputs.map((o) => `            <li><span class="num"></span><span>${o}</span></li>`).join('\n')}
          </ul>
        </div>
      </div>
      <div class="callout">
        <span class="callout__label">${L.stateHead}</span>
        <p>${L.obsNone}</p>
      </div>
      <div class="callout">
        <span class="callout__label">${L.whyHead}</span>
        <p>${OB.why}</p>
      </div>`,
  });

  const excellence = leaf({
    ground: 'section--paper grain', id: 'excellence', contents: L.excellenceLabel,
    numeral: n(6), label: L.excellenceLabel, rubric: L.excellenceRubric,
    body: `      <div class="section-head">
        <h2>${EXL.name}</h2>
        <p class="lede">${EXL.lede}</p>
      </div>
      <div class="table-scroll ledger-mount edge-lit">
        <table class="ledger">
          <thead><tr><th scope="col">${L.measuresHead}</th><th scope="col">${L.remitHead}</th></tr></thead>
          <tbody>
${EXL.measures.map(([m, how]) => `            <tr><td><strong>${m}</strong></td><td>${how}</td></tr>`).join('\n')}
          </tbody>
        </table>
      </div>`,
  });

  return [hero, commission, subs, bodies, examiner, review, obs, excellence].join('\n\n');
}

// ── write ─────────────────────────────────────────────────────────────
// emitPage takes a PATH and returns a verdict; reportEmit wants
// `{ file, result }`. Passing a bare filename writes the page to the
// working directory and leaves the manifest pointing at a page that
// does not exist — which is what the first run of this did.
const written = ['en', 'ar'].map((lang) => {
  const target = path.join(ROOT, 'pages', `governance-quality${lang === 'ar' ? '.ar' : ''}.html`);
  return { file: target, result: emitPage(target, `${page(lang)}\n`) };
});
reportEmit('build-institution.mjs', written);

// ── the manifest ──────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const list = Array.isArray(manifest) ? manifest : manifest.pages;
const ENTRIES = [
  {
    slug: 'governance-quality',
    output: 'governance/quality/index.html',
    title: 'The Quality Architecture &mdash; Worldwide English College',
    description: 'Every standing body of Worldwide English College, what each decides, who it '
      + 'reports to, and whether it has ever met &mdash; with the annual review cycle, the '
      + 'teaching observation framework and the teaching excellence measures.',
    contentFile: 'governance-quality.html',
    lang: 'en', dir: 'ltr', contents: true,
    altHref: '/ar/governance/quality/',
    extraCss: ['/css/pillar.css', '/css/governance.css'],
  },
  {
    slug: 'governance-quality-ar',
    output: 'ar/governance/quality/index.html',
    title: 'بنية الجودة &mdash; الكلية العالمية للغة الإنجليزية',
    description: 'كل هيئة دائمة في الكلية العالمية للغة الإنجليزية، وما تقرّره، ولمن ترفع، وهل '
      + 'اجتمعت قط — ومعها دورة المراجعة السنوية، وإطار مشاهدة التدريس، ومقاييس التميّز في التدريس.',
    contentFile: 'governance-quality.ar.html',
    lang: 'ar', dir: 'rtl', contents: true,
    altHref: '/governance/quality/',
    extraCss: ['/css/pillar.css', '/css/governance.css', '/css/arabic.css'],
  },
];
let added = 0;
for (const e of ENTRIES) {
  const at = list.findIndex((x) => x.slug === e.slug);
  if (at === -1) { list.push(e); added += 1; } else { list[at] = { ...list[at], ...e }; }
}
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`institution: ${everyBody.length} bodies, `
  + `${D.quality_review.en.reviews.length} annual reviews, `
  + `${D.observation.en.areas.length} observation areas, `
  + `${D.excellence.en.measures.length} excellence measures.`);
console.log(`  external examiner: ${EX.appointed ? `${EX.holder} (${EX.appointed})` : 'office vacant'}`);
console.log(`  manifest: ${added} entr${added === 1 ? 'y' : 'ies'} added`);
