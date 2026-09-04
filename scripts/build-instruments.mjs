#!/usr/bin/env node
// scripts/build-instruments.mjs — the Register of Instruments, rendered
// from the one file that holds it.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS PAGE IS FOR
// ─────────────────────────────────────────────────────────────────────
// This College publishes twenty-four instruments — regulations,
// handbooks, codes, procedures, policies and statements — across seven
// pillars, in both editions. Read one at a time they are good. Read as
// a framework they were invisible: there was no page on which a
// learner, a reviewer or an employer could see the whole of it, and no
// answer to the first question any panel actually asks, which is not
// "what is your policy on X" but "what are your instruments, and on
// whose authority does each one stand".
//
// /governance/evidence/ has named a "Policy Register" as one of its
// twenty-three evidence collections since that page was written.
// Nothing published it. This is it.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT REFUSES TO INVENT
// ─────────────────────────────────────────────────────────────────────
// Nine of the twenty-four instruments state a date of adoption. Fifteen
// do not. This generator does not supply one: where `adopted_on` is
// null the register prints the authority WITHOUT a date, because the
// authority is a published fact and the date is not. A register that
// manufactures the very facts it exists to record is worse than no
// register, and CLAUDE.md §5 forbids it in any case.
//
// The same rule governs the ratification column. An academic instrument
// adopted by the Executive pending the Senate says exactly that, in the
// words /governance/decisions/ already uses, and it is not promoted to
// settled academic policy because a table would read more evenly.
//
//   node scripts/build-instruments.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitPage, reportEmit } from './lib/emit-page.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const D = JSON.parse(readFileSync(path.join(ROOT, 'data/instruments.json'), 'utf8'));
const MANIFEST = path.join(ROOT, 'pages/manifest.json');

// ── the checks that run before a line is written ─────────────────────
const KINDS = ['regulation', 'framework', 'code', 'handbook', 'manual',
  'policy', 'procedure', 'statement', 'guidance'];
const seen = new Set();
for (const i of D.instruments) {
  if (seen.has(i.id)) throw new Error(`Two instruments share the id "${i.id}".`);
  seen.add(i.id);
  if (!i.en || !i.ar) throw new Error(`${i.id} is missing an edition. An instrument a reader cannot read is not published.`);
  if (!i.en.title || !i.ar.title) throw new Error(`${i.id} is missing a title in one edition.`);
  if (!i.en.governs || !i.ar.governs) throw new Error(`${i.id} says what it is and not what it governs. A register of titles is a table of contents.`);
  if (!KINDS.includes(i.kind)) throw new Error(`${i.id} is a "${i.kind}", which is not one of ${KINDS.join(', ')}.`);
  if (!D.authorities[i.owner]) throw new Error(`${i.id} is owned by "${i.owner}", which /governance/ does not name.`);
  if (!D.authorities[i.adopted_by]) throw new Error(`${i.id} was adopted by "${i.adopted_by}", which /governance/ does not name.`);
  if (i.ratifies && !D.authorities[i.ratifies]) throw new Error(`${i.id} awaits ratification by "${i.ratifies}", which /governance/ does not name.`);
  if (i.adopted_on && !/^\d{4}-\d{2}-\d{2}$/.test(i.adopted_on)) throw new Error(`${i.id} has an adoption date that is not a date.`);
  if (!i.route.startsWith('/') || !i.route.endsWith('/')) throw new Error(`${i.id} has route "${i.route}", which is not a directory route.`);
}

const ar = (lang) => lang === 'ar';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const AR_NUM = ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨'];

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو',
    'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};
function longDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  return ar(lang) ? `${d} ${MONTHS.ar[m - 1]} ${y}` : `${d} ${MONTHS.en[m - 1]} ${y}`;
}

// The five estates the register is grouped by. A flat list of
// twenty-four is a list; grouped, a reader can see the shape of the
// institution in the grouping itself.
const ESTATES = [
  { id: 'standard', ids: ['academic-regulations', 'examinations', 'assessment', 'awards', 'integrity', 'conduct'],
    en: { label: 'The Academic Standard', rubric: 'What a mark means, how it is arrived at, and what may be done about one.' },
    ar: { label: 'المعيار الأكاديمي', rubric: 'ما تعنيه الدرجة، وكيف يُتوصَّل إليها، وما يمكن فعله حيالها.' } },
  { id: 'handbooks', ids: ['student-handbook', 'tutor-handbook'],
    en: { label: 'The Handbooks', rubric: 'The whole of what one person is governed by, gathered for that person.' },
    ar: { label: 'الأدلّة', rubric: 'كلّ ما يحكم شخصًا واحدًا، مجموعًا من أجله.' } },
  { id: 'quality', ids: ['quality-manual', 'quality-architecture', 'intellectual-property', 'research'],
    en: { label: 'Quality and Ownership', rubric: 'What is checked, by whom, how often — and who owns what is produced.' },
    ar: { label: 'الجودة والملكية', rubric: 'ما يُفحَص، ومن يفحصه، وكم مرّة — ومن يملك ما يُنتَج.' } },
  { id: 'teaching', ids: ['ai-policy', 'digital-learning', 'teaching-practice'],
    en: { label: 'Teaching and the Platform', rubric: 'How a lesson is built, what the platform must do, and what is never delegated to a machine.' },
    ar: { label: 'التدريس والمنصّة', rubric: 'كيف يُبنى الدرس، وما يجب على المنصّة، وما لا يُوكَل إلى آلة أبدًا.' } },
  { id: 'protections', ids: ['complaints', 'privacy', 'safeguarding', 'accessibility', 'inclusion'],
    en: { label: 'The Learner’s Protections', rubric: 'The instruments a learner invokes, rather than the ones invoked upon them.' },
    ar: { label: 'حمايات المتعلّم', rubric: 'الأدوات التي يستدعيها المتعلّم، لا التي تُستدعى عليه.' } },
  { id: 'passage', ids: ['admissions-policy', 'international', 'alumni', 'careers'],
    en: { label: 'Admission, and After', rubric: 'Coming in, studying from wherever you are, and what remains yours once you have finished.' },
    ar: { label: 'القبول وما بعده', rubric: 'الدخول، والدراسة من حيث أنت، وما يبقى لك بعد الفراغ.' } },
];

const placed = new Set(ESTATES.flatMap((e) => e.ids));
for (const i of D.instruments) {
  if (!placed.has(i.id)) throw new Error(`${i.id} belongs to no estate. An instrument nobody filed is an instrument nobody finds.`);
}
for (const e of ESTATES) {
  for (const id of e.ids) {
    if (!seen.has(id)) throw new Error(`Estate "${e.id}" files "${id}", which is not an instrument.`);
  }
}

const COPY = {
  en: {
    heroEyebrow: 'Governance &middot; WorldWide English College',
    h1: 'Every rule this College operates under, and the authority behind each one.',
    stake: 'A panel’s first question is never "what is your policy on X". It is "what are your instruments, and on whose authority does each one stand". '
      + '<strong>This page answers both, for all twenty-four, without anybody having to ask.</strong>',
    lede: 'Twenty-four instruments govern this College: the regulations that decide a mark, '
      + 'the handbooks that gather what one person is bound by, the codes, the procedures a '
      + 'learner invokes, and the policies under which the place is run. Each is published in '
      + 'full, in both editions, and each is named here with what it governs, the body that '
      + 'owns the subject matter and the body that adopted the text.',
    motto: '&ldquo;A rule nobody can find is a rule nobody is governed by.&rdquo;',
    factsLabel: ['Instruments', 'Editions', 'Adopting authority', 'Kept by'],
    factsValue: (n) => [String(n), 'Both, in full', 'The Executive', 'The Registrar'],
    tableHead: ['Instrument', 'What it governs', 'Authority'],
    read: 'Read it',
    ownedBy: 'Subject matter owned by',
    adoptedBy: 'Adopted by',
    on: 'on',
    noDate: 'no date minuted',
    awaits: 'awaits ratification by',
    onRecommendation: 'on the recommendation of the Institutional Quality Commission',
    decisions: 'Constituted by',
    authoritiesLabel: 'The Authorities',
    authoritiesRubric: 'Three bodies, and which of them owns what.',
    authoritiesHead: 'Who may make a rule, and who may change one.',
    authoritiesLede: 'Ownership and adoption are different acts, and this register keeps them '
      + 'apart. The body that owns a subject cannot be assumed to have written the text, and the '
      + 'body that wrote the text does not thereby own the subject.',
    article: 'Article',
    datesLabel: 'The Sittings',
    datesRubric: 'Three sittings, and what was adopted at each.',
    datesHead: 'Where a date comes from, when there is one.',
    datesLede: (dated, undated) => `${dated} of the ${dated + undated} instruments state a date of `
      + 'adoption. Four of those dates are drawn from the three Executive sittings on the '
      + 'Decisions Register, shown below. The other three carry a different kind of date: the '
      + 'Academic Regulations and the Examination &amp; Assessment Regulations are dated '
      + '20&nbsp;August&nbsp;2026, and the Quality Architecture 18&nbsp;August&nbsp;2026. Each '
      + 'marks when the instrument was formally adopted, on decisions already taken at an '
      + 'earlier sitting; neither carries a sitting of its own in the Decisions Register. The '
      + `remaining ${undated} are published under the Executive’s standing authority, and this `
      + 'register prints that authority without a date rather than a date without a minute.',
    sitting: () => 'decisions adopted',
    honestHead: 'What this register does not do',
    honestBody: 'It does not date an instrument the College has not dated, it does not promote '
      + 'an instrument awaiting Senate ratification to settled academic policy, and it does not '
      + 'name an external body as having reviewed any of this. Where a column is empty it is '
      + 'empty because the fact is not held, and that is the column doing its job.',
    ctaHead: 'Read the instrument that decides who may change any of these.',
    ctaOne: 'Governance',
    ctaTwo: 'The Decisions Register',
    kinds: {
      regulation: 'Regulation', framework: 'Framework', code: 'Code', handbook: 'Handbook',
      manual: 'Manual', policy: 'Policy', procedure: 'Procedure', statement: 'Statement',
      guidance: 'Guidance',
    },
  },
  ar: {
    heroEyebrow: 'الحوكمة &middot; الكلية العالمية للغة الإنجليزية',
    h1: 'كلّ قاعدة تعمل بها هذه الكلية، والسلطة التي وراء كلٍّ منها.',
    stake: 'أوّل سؤال تسأله لجنةٌ ليس «ما سياستكم في كذا»، بل «ما أدواتكم النظامية، وبأيّ سلطة تقوم كلٌّ منها». '
      + '<strong>هذه الصفحة تجيب عن الاثنين، في الأربع والعشرين جميعًا، دون أن يسأل أحد.</strong>',
    lede: 'أربع وعشرون أداةً تحكم هذه الكلية: اللوائح التي تقرّر الدرجة، والأدلّة التي تجمع ما '
      + 'يلتزم به شخصٌ واحد، والمواثيق، والإجراءات التي يستدعيها المتعلّم، والسياسات التي '
      + 'يُدار بها المكان. كلٌّ منها منشور كاملًا، في الطبعتين، ومسمًّى هنا بما يحكمه، وبالهيئة '
      + 'التي تملك موضوعه، وبالهيئة التي اعتمدت نصّه.',
    motto: '«قاعدةٌ لا يجدها أحد قاعدةٌ لا تحكم أحدًا.»',
    factsLabel: ['الأدوات', 'الطبعات', 'سلطة الاعتماد', 'يحفظه'],
    factsValue: (n) => [String(n), 'كلتاهما، كاملتين', 'الإدارة التنفيذية', 'أمانة السجل'],
    tableHead: ['الأداة', 'ما تحكمه', 'السلطة'],
    read: 'اقرأها',
    ownedBy: 'موضوعها مملوك لـ',
    adoptedBy: 'اعتمدتها',
    on: 'في',
    noDate: 'لا تاريخ مقيَّد',
    awaits: 'وتنتظر تصديق',
    onRecommendation: 'بتوصية من هيئة الجودة المؤسسية',
    decisions: 'قامت على',
    authoritiesLabel: 'السلطات',
    authoritiesRubric: 'ثلاث هيئات، وأيّها يملك ماذا.',
    authoritiesHead: 'من له أن يضع قاعدة، ومن له أن يغيّرها.',
    authoritiesLede: 'الملكية والاعتماد فعلان مختلفان، وهذا السجل يفرّق بينهما. فالهيئة التي '
      + 'تملك موضوعًا لا يُفترض أنّها كتبت نصّه، والهيئة التي كتبت النصّ لا تملك بذلك الموضوع.',
    article: 'المادة',
    datesLabel: 'الجلسات',
    datesRubric: 'ثلاث جلسات، وما اعتُمد في كلٍّ منها.',
    datesHead: 'من أين يأتي التاريخ، حين يوجد.',
    datesLede: (dated, undated) => `${dated} من الأدوات الـ${dated + undated} تذكر تاريخ `
      + 'اعتمادها. أربعة من هذه التواريخ مأخوذة من الجلسات التنفيذية الثلاث المقيَّدة في سجلّ '
      + 'القرارات، الموضّحة أدناه. أمّا الثلاثة الباقية — اللوائح الأكاديمية ولوائح الامتحانات '
      + 'والتقييم، وكلتاهما بتاريخ ٢٠ أغسطس ٢٠٢٦، وبنية الجودة، بتاريخ ١٨ أغسطس ٢٠٢٦ — فتُبيّن '
      + 'متى اعتُمدت الأداة نفسها رسميًّا، بناءً على قرارات اتُّخذت في جلسة سابقة؛ ولا يحمل '
      + 'أيٌّ من هذين التاريخين جلسته الخاصة في سجلّ القرارات. '
      + `وأمّا الـ${undated} الباقية فمنشورة بالسلطة القائمة للإدارة `
      + 'التنفيذية، وهي هيئة القرار المكوَّنة في الكلية، ويطبع هذا السجل تلك السلطة بلا تاريخ، '
      + 'بدل أن يطبع تاريخًا بلا محضر.',
    // Arabic counted-noun agreement: 3-10 takes the plural ("قرارات"),
    // 11-99 the singular accusative ("قرارًا") — a single fixed suffix
    // is only ever right for one of the two ranges a real sittings
    // table mixes (5 and 25 in the same grid).
    sitting: (n) => ((n >= 3 && n <= 10) ? 'قرارات اعتُمدت' : 'قرارًا اعتُمدت'),
    honestHead: 'ما لا يفعله هذا السجل',
    honestBody: 'لا يؤرّخ أداةً لم تؤرّخها الكلية، ولا يرقّي أداةً تنتظر تصديق المجلس الأكاديمي '
      + 'إلى سياسةٍ أكاديمية مستقرّة، ولا يسمّي جهةً خارجية بأنّها راجعت شيئًا من هذا. وحيث '
      + 'يخلو حقلٌ فلأنّ الحقيقة غير محفوظة، وذلك هو الحقل يؤدّي عمله.',
    ctaHead: 'اقرأ الأداة التي تقرّر من له أن يغيّر أيًّا من هذه.',
    ctaOne: 'الحوكمة',
    ctaTwo: 'سجلّ القرارات',
    kinds: {
      regulation: 'لائحة', framework: 'إطار', code: 'ميثاق', handbook: 'دليل',
      manual: 'دليل إجرائي', policy: 'سياسة', procedure: 'إجراء', statement: 'بيان',
      guidance: 'إرشاد',
    },
  },
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

// AN INSTRUMENT IS A STRUCK CARD (CLAUDE.md §2). Every one carries the
// full material law — the travelling light, the lit rim, the relief and
// the pointer-answering metal — and a 106px dome, because the dome is
// what makes a register read as a set of objects rather than a list.
const KIND_ICON = {
  regulation: 'i-scales', framework: 'i-layers', code: 'i-accord', handbook: 'i-book',
  manual: 'i-ledger', policy: 'i-scroll', procedure: 'i-compass', statement: 'i-quill',
  guidance: 'i-globe',
};

function authorityLine(lang, i) {
  const L = COPY[lang];
  const A = D.authorities;
  const bits = [];
  bits.push(`${L.ownedBy} <strong>${A[i.owner][lang].name}</strong>`);
  let adopted = `${L.adoptedBy} <strong>${A[i.adopted_by][lang].name}</strong>`;
  if (i.adopted_on) adopted += ` ${L.on} <span dir="ltr">${longDate(i.adopted_on, lang)}</span>`;
  else adopted += ` &mdash; ${L.noDate}`;
  if (i.adopted_note === 'commission') adopted += `, ${L.onRecommendation}`;
  bits.push(adopted);
  if (i.ratifies) bits.push(`${L.awaits} <strong>${A[i.ratifies][lang].name}</strong>`);
  if (i.decisions.length) {
    bits.push(`${L.decisions} <a href="${ar(lang) ? '/ar' : ''}/governance/decisions/">`
      + i.decisions.map((d) => `<bdi>${d}</bdi>`).join('&thinsp;&middot;&thinsp;') + '</a>');
  }
  return bits;
}

function instrumentCard(lang, i) {
  const L = COPY[lang];
  const href = (ar(lang) ? '/ar' : '') + i.route;
  return `        <div class="inst card tilt gold-live edge-lit edge-lit--light aurum aurum--hover reveal">
          <span class="tilt__sheen" aria-hidden="true"></span>
          <span class="badge-dome badge-dome--lg" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#${KIND_ICON[i.kind]}"/></svg></span>
          <span class="inst__kind">${L.kinds[i.kind]}</span>
          <h3><a href="${href}">${i.en.title === i[lang].title ? i[lang].title : i[lang].title}</a></h3>
          <p class="inst__governs">${i[lang].governs}</p>
          <ul class="inst__auth">
${authorityLine(lang, i).map((b) => `            <li>${b}</li>`).join('\n')}
          </ul>
        </div>`;
}

function page(lang) {
  const L = COPY[lang];
  const n = (idx) => (ar(lang) ? AR_NUM[idx] : ROMAN[idx]);
  const total = D.instruments.length;
  const byId = new Map(D.instruments.map((i) => [i.id, i]));

  const hero = `<section class="page-hero masthead guilloche grain">
  <canvas class="constellation" aria-hidden="true"></canvas>
  <img class="masthead__plate" src="/assets/art/crest-plate.svg" alt="" aria-hidden="true" width="320" height="400" data-depth="0.05">
  <div class="container masthead__inner">
    <p class="masthead__rule" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-ledger"/></svg></p>

    <p class="masthead__eyebrow">${L.heroEyebrow}</p>
    <h1>${L.h1}</h1>
    <p class="masthead__stake">${L.stake}</p>
    <p class="lede">${L.lede}</p>

    <dl class="masthead__facts">
${L.factsLabel.map((lab, k) => `      <div class="masthead__fact"><dt>${lab}</dt><dd>${L.factsValue(total)[k]}</dd></div>`).join('\n')}
    </dl>

    <p class="masthead__motto">${L.motto}</p>
    <p class="masthead__rule masthead__rule--foot" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-laurel"/></svg></p>
  </div>
</section>`;

  const grounds = ['section--paper grain', 'section--light grain',
    'section--dark section--oxford grain aurora', 'section--warm section--light grain',
    'section--light grain', 'section--paper grain'];

  const estates = ESTATES.map((e, idx) => leaf({
    ground: grounds[idx % grounds.length],
    id: e.id, contents: e[lang].label,
    numeral: n(idx), label: e[lang].label, rubric: e[lang].rubric,
    body: `      <div class="section-head">
        <h2>${e[lang].rubric}</h2>
      </div>
      <div class="grid grid--2 grid--close">
${e.ids.map((id) => instrumentCard(lang, byId.get(id))).join('\n')}
      </div>`,
  })).join('\n\n');

  const A = D.authorities;
  const authorities = leaf({
    ground: 'section--light grain', id: 'authorities', contents: L.authoritiesLabel,
    numeral: n(ESTATES.length), label: L.authoritiesLabel, rubric: L.authoritiesRubric,
    body: `      <div class="section-head">
        <h2>${L.authoritiesHead}</h2>
        <p class="lede">${L.authoritiesLede}</p>
      </div>
      <div class="grid grid--2 grid--close">
${['board', 'senate', 'executive', 'commission'].map((k) => `        <div class="card tilt gold-live edge-lit edge-lit--light aurum aurum--hover reveal">
          <span class="tilt__sheen" aria-hidden="true"></span>
          <span class="badge-dome badge-dome--lg" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-portico"/></svg></span>
${A[k].article ? `          <span class="card__num">${L.article} ${A[k].article}</span>\n` : ''}          <h3>${A[k][lang].name}</h3>
          <p>${A[k][lang].holds}</p>
        </div>`).join('\n')}
      </div>`,
  });

  const dated = D.instruments.filter((i) => i.adopted_on).length;
  const sittings = leaf({
    ground: 'section--dark grain aurora', id: 'sittings', contents: L.datesLabel,
    numeral: n(ESTATES.length + 1), label: L.datesLabel, rubric: L.datesRubric,
    body: `      <div class="section-head">
        <h2>${L.datesHead}</h2>
        <p class="lede">${L.datesLede(dated, total - dated)}</p>
      </div>
      <div class="grid grid--3 grid--close">
${D.register.sittings.map((s) => `        <div class="card tilt gold-live edge-lit aurum aurum--hover reveal">
          <span class="tilt__sheen" aria-hidden="true"></span>
          <span class="badge-dome badge-dome--lg" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-seal"/></svg></span>
          <span class="card__num"><span dir="ltr">${longDate(s.on, lang)}</span></span>
          <h3>${s.decisions} ${L.sitting(s.decisions)}</h3>
          <p>${A[s.by][lang].name}</p>
        </div>`).join('\n')}
      </div>

      <div class="callout reveal">
        <span class="callout__label">${L.honestHead}</span>
        <p>${L.honestBody}</p>
      </div>`,
  });

  const cta = `<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>${L.ctaHead}</h2>
    <div class="btn-row u-center">
      <a href="${ar(lang) ? '/ar' : ''}/governance/" class="btn btn--gold magnetic aurum aurum--twin">${L.ctaOne}</a>
      <a href="${ar(lang) ? '/ar' : ''}/governance/decisions/" class="btn btn--outline magnetic">${L.ctaTwo}</a>
    </div>
  </div>
</section>`;

  const head = ar(lang)
    ? `<!--\n  سجلّ الأدوات النظامية — مولَّد من data/instruments.json عبر\n  scripts/build-instruments.mjs. لا يُحرَّر هذا الملف بيدك.\n-->`
    : `<!--\n  THE REGISTER OF INSTRUMENTS — generated from data/instruments.json by\n  scripts/build-instruments.mjs. Do not edit this file by hand: the\n  register and the pages it names must agree, and one source is what\n  makes that true. ${dated} of ${total} instruments state a date; the rest\n  print their authority without one, on purpose.\n-->`;

  return `${head}\n\n${hero}\n\n${estates}\n\n${authorities}\n\n${sittings}\n\n${cta}`;
}

const DATED = D.instruments.filter((i) => i.adopted_on).length;

const written = ['en', 'ar'].map((lang) => {
  const target = path.join(ROOT, 'pages', ar(lang) ? 'governance-instruments.ar.html' : 'governance-instruments.html');
  return { file: target, result: emitPage(target, `${page(lang)}\n`) };
});
reportEmit('build-instruments.mjs', written);

// ── the manifest ─────────────────────────────────────────────────────
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const list = Array.isArray(manifest) ? manifest : manifest.pages;
const ENTRIES = [
  {
    slug: 'governance-instruments',
    output: 'governance/instruments/index.html',
    title: 'The Register of Instruments &mdash; WorldWide English College',
    description: 'Every rule the College operates under, in one register: twenty-four '
      + 'instruments, each with what it governs and the body that adopted it.',
    contentFile: 'governance-instruments.html',
    lang: 'en', dir: 'ltr', contents: true,
    altHref: '/ar/governance/instruments/',
    extraCss: ['/css/pillar.css', '/css/governance.css'],
  },
  {
    slug: 'governance-instruments-ar',
    output: 'ar/governance/instruments/index.html',
    title: 'سجلّ الأدوات النظامية &mdash; الكلية العالمية للغة الإنجليزية',
    description: 'كلّ قاعدة تعمل بها الكلية العالمية للغة الإنجليزية في سجلٍّ واحد: أربع '
      + 'وعشرون أداة، وما تحكمه كلٌّ منها، والهيئة التي تملك موضوعها، والهيئة التي اعتمدت نصّها.',
    contentFile: 'governance-instruments.ar.html',
    lang: 'ar', dir: 'rtl', contents: true,
    altHref: '/governance/instruments/',
    extraCss: ['/css/pillar.css', '/css/governance.css', '/css/arabic.css'],
  },
];
let added = 0;
for (const e of ENTRIES) {
  const at = list.findIndex((x) => x.slug === e.slug);
  if (at === -1) { list.push(e); added += 1; } else { list[at] = { ...list[at], ...e }; }
}
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`instruments: ${D.instruments.length} in ${ESTATES.length} estates, `
  + `${DATED} with a minuted date, ${D.instruments.length - DATED} without.`);
console.log(`  manifest: ${added} entr${added === 1 ? 'y' : 'ies'} added`);
