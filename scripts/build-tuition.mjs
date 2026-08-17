// scripts/build-tuition.mjs — the fee, decomposed to the cent.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THIS IS A GENERATOR AND NOT A TABLE SOMEBODY TYPED
// ─────────────────────────────────────────────────────────────────────
// A tuition breakdown is the single most checkable claim a college
// makes. A reader with a calculator will add the rows up, and if they
// land a cent away from the total the whole page stops being evidence
// and starts being decoration. That failure is almost guaranteed by
// hand: ten dollar amounts each rounded on their own do not sum to a
// rounded total.
//
// So data/tuition.json holds WEIGHTS IN BASIS POINTS and this script
// does the arithmetic in whole cents. It distributes the rounding
// remainder to one named line — named in the data, so the page can say
// which line carries it — and it THROWS if the rows do not sum to the
// level fee exactly. The page cannot be built with a breakdown that
// does not add up.
//
// It also derives the two figures an internationally literate reader
// actually compares on: cost per credit and cost per taught hour. Both
// come out of the same cents, so no line can be right in dollars and
// wrong per credit.
//
// Injected between markers into pages/admissions-tuition{,.ar}.html —
// the same mechanism scripts/build-redirects.js uses on _redirects —
// because the rest of those pages is hand-authored prose that a
// generator has no business owning.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const T = JSON.parse(readFileSync(path.join(ROOT, 'data/tuition.json'), 'utf8'));

const BP = 10000;
const money = (cents) => `$${(cents / 100).toLocaleString('en-US',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── CENTS, EXACTLY ───────────────────────────────────────────────────
const bpTotal = T.lines.reduce((n, l) => n + l.bp, 0);
if (bpTotal !== BP) {
  throw new Error(`build-tuition: weights sum to ${bpTotal} basis points, not ${BP}. `
    + 'The breakdown would not be a breakdown of anything.');
}

const rows = T.lines.map((l) => ({
  ...l, cents: Math.floor((T.level_fee_cents * l.bp) / BP),
}));
const remainder = T.level_fee_cents - rows.reduce((n, r) => n + r.cents, 0);
const sink = rows.find((r) => r.key === T.absorbs_rounding);
if (!sink) throw new Error(`build-tuition: absorbs_rounding names "${T.absorbs_rounding}", which is not a line.`);
sink.cents += remainder;

const sum = rows.reduce((n, r) => n + r.cents, 0);
if (sum !== T.level_fee_cents) {
  throw new Error(`build-tuition: rows sum to ${sum} cents, level fee is ${T.level_fee_cents}.`);
}

const perCredit = (cents) => cents / T.credits_per_level;
const perHour = (cents) => cents / T.hours_per_level;
const instalment = T.level_fee_cents / T.instalments_per_level;

const L = {
  en: {
    label: 'The Breakdown', num: 'II',
    rubric: 'Every cent of a level fee, and the line it goes to.',
    h2: 'Where the money goes.',
    lede: `A single figure is not information. Here is the whole of ${money(T.level_fee_cents)} — the fee for one level — allocated across the ten things the College spends it on, with what each buys, what it comes to per WEC Credit, and what it comes to per taught hour. The rows add up to the fee exactly, because a breakdown that does not add up is not a breakdown.`,
    th: ['What it pays for', 'Share', 'Per level', 'Per credit', 'Per hour'],
    total: 'One level, complete',
    note: `Weights are published in basis points of the level fee and the amounts are computed from them in whole cents, so the rows cannot drift from the total. Where the division leaves a remainder it is added to <em>${sink.en.name.toLowerCase()}</em> rather than spread invisibly. Per-credit figures divide by ${T.credits_per_level} WEC Credits; per-hour figures by the ${T.hours_per_level} hours of Total Qualification Time a level is built to. Adopted by the Executive, in force, subject to ratification by the Academic Senate once that body has appointed members.`,
    roundLabel: 'The two cents the College does not charge',
    round: `${T.levels} levels at ${money(T.level_fee_cents)} come to $19,000.02, because 19,000 does not divide by six. The aggregate is charged at <strong>$19,000</strong> and the last two cents are waived. Two cents is not a material sum; a published total that does not add up is a material defect.`,
    schedLabel: 'Extras', schedNum: 'III',
    schedRubric: 'What costs more, with the price, and the longer list of what does not.',
    schedH2: 'Priced, both halves.',
    schedLede: 'The only things the College charges for beyond tuition are physical items it posts to you, because a physical item costs the College money to make and post. Every one carries its price here. The second list is longer on purpose: it names what other providers charge for.',
    chargeH3: 'What costs extra',
    inclH3: 'What never costs extra',
    schedNote: 'These are the only charges an enrolled student meets. There is no application fee, no registration fee, no examination fee, no re-sit fee, no instalment charge, no technology fee, no library fee, no graduation fee and no withdrawal charge. If a cost is not in the left-hand list, it does not exist. A candidate who does not enrol buys the examination and the award separately, and the reason is set out under <a href="#routes">Two routes to the same award</a> &mdash; an unexplained fee on one page beside a promise it does not exist on another is how a fee schedule stops being believed.',
  },
  ar: {
    label: 'التفصيل', num: '٢',
    rubric: 'كل سنت من رسم المستوى، والبند الذي يذهب إليه.',
    h2: 'إلى أين يذهب المال.',
    lede: `الرقم الواحد ليس معلومة. وهذا كامل ${money(T.level_fee_cents)} — رسم مستوى واحد — موزَّعًا على الأشياء العشرة التي تصرفه الكلية عليها، ومعه ما يشتريه كل بند، وما يعادله لكل رصيد، وما يعادله لكل ساعة مُدرَّسة. والصفوف تجمع الرسم بالضبط، لأن تفصيلًا لا يجمع ليس تفصيلًا.`,
    th: ['ما يدفع مقابله', 'النسبة', 'للمستوى', 'للرصيد', 'للساعة'],
    total: 'مستوى واحد كاملًا',
    note: `تُنشر الأوزان بنقاط أساس من رسم المستوى وتُحسَب المبالغ منها بالسنتات الصحيحة، فلا تنحرف الصفوف عن المجموع. وحيث تُبقي القسمة باقيًا يُضاف إلى بند <em>${sink.ar.name}</em> بدل توزيعه على نحو غير مرئي. وأرقام الرصيد تقسم على ${T.credits_per_level} رصيدًا؛ وأرقام الساعة على ${T.hours_per_level} ساعة من الزمن الكلي للمؤهل الذي بُني عليه المستوى. مُعتمد من الإدارة التنفيذية، نافذ، على أن يصادق عليه المجلس الأكاديمي حين تُعيَّن أعضاؤه.`,
    roundLabel: 'السنتان اللذان لا تتقاضاهما الكلية',
    round: `${T.levels} مستويات بـ${money(T.level_fee_cents)} تبلغ 19,000.02$، لأن 19,000 لا تقبل القسمة على ستة. ويُحصَّل المجموع <strong>19,000$</strong> ويُتنازَل عن السنتين الأخيرين. فسنتان ليسا مبلغًا مؤثرًا؛ أما مجموع منشور لا يجمع فعيب مؤثر.`,
    schedLabel: 'الإضافات', schedNum: '٣',
    schedRubric: 'ما يكلّف أكثر ومعه سعره، والقائمة الأطول لما لا يكلّف.',
    schedH2: 'مُسعَّرة، بشطريها.',
    schedLede: 'الأشياء الوحيدة التي تتقاضى الكلية عليها مالًا زيادةً على الرسوم موادُّ مادية تُرسلها إليك، لأن المادة المادية تكلّف الكلية مالًا في صناعتها وإرسالها. وكل واحدة منها تحمل سعرها هنا. والقائمة الثانية أطول عن قصد: فهي تسمّي ما يتقاضى عليه غيرها.',
    chargeH3: 'ما يكلّف زيادة',
    inclH3: 'ما لا يكلّف زيادة أبدًا',
    schedNote: 'هذه هي الرسوم الوحيدة التي يلقاها الطالب الملتحق. لا رسم تقديم، ولا رسم تسجيل، ولا رسم امتحان، ولا رسم إعادة، ولا رسم تقسيط، ولا رسم تقني، ولا رسم مكتبة، ولا رسم تخرّج، ولا رسم انسحاب. وما ليس في القائمة اليمنى فلا وجود له. أما من لم يلتحق فيشتري الامتحان والشهادة منفصلَين، وسبب ذلك مبسوط في <a href="#routes">مساران إلى الشهادة نفسها</a> &mdash; فالرسم الذي يظهر بلا تفسير في صفحة، ووعدٌ بعدم وجوده في أخرى، هو الطريق الذي يفقد به جدول الرسوم تصديق الناس.',
  },
};

const GROUND = { en: 'section--light grain', ar: 'section--light grain' };

function section(lang) {
  const t = L[lang];
  const x = lang;
  const pct = (bp) => `${(bp / 100).toFixed(0)}%`;
  const body = rows.map((r) => `          <tr><td><strong>${r[x].name}</strong><br><span class="u-muted">${r[x].what}</span></td>`
    + `<td>${pct(r.bp)}</td><td>${money(r.cents)}</td>`
    + `<td>${money(perCredit(r.cents))}</td><td>${money(perHour(r.cents))}</td></tr>`).join('\n');

  const charge = T.chargeable.map((c) => `      <div class="tariff__line reveal edge-lit edge-lit--light aurum">
        <span class="badge-dome badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#i-ledger"/></svg></span>
        <span class="tariff__figure" dir="ltr">$${c.usd}</span>
        <span class="tariff__label">${c[x][0]}</span>
        <span class="tariff__note">${c[x][1]}</span>
      </div>`).join('\n');

  const incl = T.included.map((i) => `        <li><svg class="icon" aria-hidden="true"><use href="#i-struck"/></svg><span><strong>${i[x][0]}</strong> &mdash; ${i[x][1]}</span></li>`).join('\n');

  return `<section class="leaf ${GROUND[lang]}" id="breakdown" data-contents="${t.label}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/competency-wheel.svg)"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${t.num}</span>
      <span class="leaf__label">${t.label}</span>
      <p class="leaf__rubric">${t.rubric}</p>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head">
      <h2>${t.h2}</h2>
      <p class="lede">${t.lede}</p>
    </div>
    <div class="table-scroll ledger-mount edge-lit">
      <table class="ledger">
        <thead><tr>${t.th.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>
${body}
          <tr><td colspan="2"><strong>${t.total}</strong></td>
              <td><strong>${money(T.level_fee_cents)}</strong></td>
              <td><strong>${money(perCredit(T.level_fee_cents))}</strong></td>
              <td><strong>${money(perHour(T.level_fee_cents))}</strong></td></tr>
        </tbody>
      </table>
    </div>
    <p class="form-note">${t.note}</p>
    <div class="callout">
      <span class="callout__label">${t.roundLabel}</span>
      <p>${t.round}</p>
    </div>
    </div>
  </div>
</section>

<section class="leaf section--paper grain" id="extras" data-contents="${t.schedLabel}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/quality-cycle.svg)"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${t.schedNum}</span>
      <span class="leaf__label">${t.schedLabel}</span>
      <p class="leaf__rubric">${t.schedRubric}</p>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head">
      <h2>${t.schedH2}</h2>
      <p class="lede">${t.schedLede}</p>
    </div>
    <h3 style="margin-top:1.4em">${t.chargeH3}</h3>
    <div class="tariff tariff--ladder">
${charge}
    </div>
    <h3 style="margin-top:2.4em">${t.inclH3}</h3>
    <ul class="check-list">
${incl}
    </ul>
    <p class="form-note">${t.schedNote}</p>
    </div>
  </div>
</section>`;
}

const OPEN = '<!-- >>> GENERATED FROM scripts/build-tuition.mjs — DO NOT EDIT BY HAND -->';
const CLOSE = '<!-- <<< END TUITION BREAKDOWN -->';

for (const [lang, file] of [['en', 'admissions-tuition.html'], ['ar', 'admissions-tuition.ar.html']]) {
  const full = path.join(ROOT, 'pages', file);
  let text = readFileSync(full, 'utf8');
  const block = `${OPEN}\n${section(lang)}\n${CLOSE}`;
  if (text.includes(OPEN)) {
    const start = text.indexOf(OPEN);
    const end = text.indexOf(CLOSE) + CLOSE.length;
    if (end < start) throw new Error(`${file}: the tuition markers are out of order.`);
    text = text.slice(0, start) + block + text.slice(end);
  } else {
    // First insertion: immediately after the Ladder, which is where a
    // reader who has just seen the four rungs asks what they buy.
    const anchor = lang === 'ar'
      ? '<!-- ==================================================================\n     السُّلَّم'
      : '<!-- ==================================================================\n     THE LADDER';
    const ladderStart = text.indexOf(anchor);
    if (ladderStart === -1) throw new Error(`${file}: cannot find the Ladder to insert after.`);
    const after = text.indexOf('\n</section>', ladderStart) + '\n</section>'.length;
    text = text.slice(0, after) + '\n\n' + block + text.slice(after);
  }
  writeFileSync(full, text);
}

console.log(`tuition: ${rows.length} lines sum to ${money(sum)} exactly `
  + `(${money(perCredit(sum))}/credit, ${money(perHour(sum))}/hour, `
  + `${money(instalment)} per instalment).`);
console.log(`  rounding remainder of ${remainder}¢ added to "${sink.key}".`);
console.log(`  ${T.chargeable.length} chargeable items, ${T.included.length} included.`);
