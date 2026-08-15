#!/usr/bin/env node
/**
 * THE SIX LEVEL PAGES, IN ARABIC.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THESE SIX, AND WHY NOW
 * ────────────────────────────────────────────────────────────────────
 * The College is written for Gulf families and international
 * applicants, and forty of its sixty-four English routes had no Arabic
 * edition. Of those forty, these six are the ones a prospective student
 * actually reads before deciding: what Level III contains, how long it
 * takes, what it costs, what it assesses and what it confers. An
 * Arabic-reading applicant could see the fee in Arabic and the thing
 * they were buying only in English.
 *
 * ────────────────────────────────────────────────────────────────────
 * GENERATED, FOR THE SAME REASON THE ENGLISH ONES ARE
 * ────────────────────────────────────────────────────────────────────
 * scripts/build-levels.js reads the module list, hours, item counts and
 * award wording out of the curriculum database rather than retyping
 * them, so a page cannot claim eleven modules when the record holds
 * ten. An Arabic edition that hard-coded those numbers would drift from
 * the English edition on the first curriculum change, and drift between
 * two languages is worse than drift in one: it is a contradiction a
 * reader can find.
 *
 * So this reads the same record. Only the prose is authored.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS TRANSLATED AND WHAT IS NOT
 * ────────────────────────────────────────────────────────────────────
 * Module titles are rendered in Arabic AND shown in English beside
 * them. The English title is the syllabus of record — it is what the
 * Complete Curriculum, the Assessment Handbook and the learner's
 * transcript all say — so replacing it would leave an Arabic reader
 * unable to match the page to their own record. Printing both is what a
 * bilingual institution does with a course title, and it costs one
 * column.
 *
 * Award titles and post-nominals stay in Latin script entirely. An
 * award is a defined object with an official title; translating
 * "English Associate of Worldwide English College" would create a
 * second award that nobody has defined and nobody can confer. The
 * Arabic prose says what the award is for, beside the title itself.
 *
 * Learning outcomes ARE translated, and marked as translations, because
 * an outcome a learner cannot read is not a published outcome. The
 * English original is printed alongside for the same reason as the
 * module titles.
 *
 * ────────────────────────────────────────────────────────────────────
 * A WORD TO AVOID: "لكل وحدة"
 * ────────────────────────────────────────────────────────────────────
 * The Arabic for "module" is وحدة, which is also the word the RETIRED
 * measurement scheme used for a "learning unit" — the one the College
 * replaced with WEC Credits, and the one it priced at $26.39 apiece
 * before deciding that pricing content 41% of which is unwritten was
 * indefensible. tests/published-claims.test.mjs bans the phrase لكل وحدة
 * outright across every Arabic page for that reason.
 *
 * The first draft of these pages wrote "معمل نطق لكل وحدة" — a
 * pronunciation laboratory for each module — which is innocent and
 * failed the check anyway. The fix is في كل وحدة, which is better
 * Arabic for "in every module" in any case. The guard was NOT narrowed
 * to let the page through: a check that gets relaxed the first time it
 * inconveniences somebody is not a check.
 *
 * ────────────────────────────────────────────────────────────────────
 * NO (EN) CROSSINGS, AND THAT IS THE POINT
 * ────────────────────────────────────────────────────────────────────
 * Every onward link from these six pages lands in Arabic: admissions,
 * tuition, how to apply, the IEFC programme, assessment, institutional
 * status, and the next level. So they carry no "some links open in
 * English" notice — an apology for something that does not happen is
 * not honesty, it is furniture. tests/bilingual-links.test.mjs is what
 * holds this: it fails on any link out of Arabic into an English page
 * that already has an Arabic edition, and it caught exactly that on the
 * first draft of these pages.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const {
  AR_LEVEL, AR_ROMAN, ltr, esc, card, darkCard, cta,
} = require('./lib/arabic-kit');

// The Arabic level names, keyed by numeric id, taken from the kit so
// the hub page, the admissions pages and these six cannot disagree
// about what Level III is called.
const AR_NAME = Object.fromEntries(Object.entries(AR_LEVEL).map(([id, v]) => [Number(id), v.name]));

const ROOT = path.resolve(__dirname, '..');

// ── the record ────────────────────────────────────────────────────────
// The same read as scripts/build-levels.js, deliberately: two
// generators publishing the same facts must read them the same way.
function read() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(fs.readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
    db.exec(fs.readFileSync(`${ROOT}/sql/seed-audio-level-${n}.sql`, 'utf8'));
  }
  for (const f of ['seed-exercises', 'seed-selfchecks', 'seed-pedagogy',
    'seed-vocabulary-level-1', 'seed-solo-level-1', 'seed-competency-level-1',
    'seed-pedagogy-level-1', 'seed-teaching-expertise-level-1']) {
    db.exec(fs.readFileSync(`${ROOT}/sql/${f}.sql`, 'utf8'));
  }
  const all = (s, ...a) => db.prepare(s).all(...a);
  const levels = all('SELECT * FROM programme_levels ORDER BY id');
  const skills = all('SELECT * FROM language_skills ORDER BY sequence');
  const data = levels.map((lv) => ({
    ...lv,
    modules: all(`SELECT u.sequence, u.title FROM units u
                    JOIN courses c ON c.id = u.course_id
                   WHERE c.level_id = ? ORDER BY u.sequence`, lv.id),
    kinds: all(`SELECT i.kind, COUNT(*) n FROM learning_items i
                  JOIN units u ON u.id = i.unit_id
                  JOIN courses c ON c.id = u.course_id
                 WHERE c.level_id = ? GROUP BY 1`, lv.id)
      .reduce((a, r) => { a[r.kind] = r.n; return a; }, {}),
    outcomes: all(`SELECT code, statement, status FROM learning_outcomes
                    WHERE level_roman = ? AND scope = 'level' ORDER BY sequence`, lv.roman),
    award: all('SELECT * FROM award_definitions WHERE level_id = ?', lv.id)[0] || null,
  }));
  db.close();
  return { levels: data, skills };
}

const { levels, skills } = read();
if (levels.length !== 6) throw new Error(`Expected 6 levels, read ${levels.length}`);

const SLUG = { I: 'level-1', II: 'level-2', III: 'level-3', IV: 'level-4', V: 'level-5', VI: 'level-6' };
const money = (c) => ltr(`$${(c / 100).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`);

// ── Arabic renderings of the module titles ────────────────────────────
//
// Keyed by the English title exactly as the curriculum record holds it,
// so a module renamed in the database fails the guard below rather than
// silently shipping the old Arabic against the new English. The
// "Module N:" prefix is stripped before lookup — it is numbering, and
// the table already carries a number column.
const AR_MODULE = {
  // Level I — Foundation
  'Meeting People': 'التعارف',
  'Everyday Objects & Places': 'الأشياء والأماكن اليومية',
  'Family & Routines': 'الأسرة والروتين اليومي',
  'Food & Shopping': 'الطعام والتسوّق',
  'Around Town': 'في أنحاء المدينة',
  'Describing People & Things': 'وصف الأشخاص والأشياء',
  'Past Experiences': 'الخبرات الماضية',
  'Plans & Abilities': 'الخطط والقدرات',
  'Health & Feelings': 'الصحة والمشاعر',
  'Review & Consolidation': 'المراجعة والترسيخ',
  // Level II — Elementary
  'Life Stories': 'قصص الحياة',
  'Travel & Transport': 'السفر والتنقّل',
  'Work & Study': 'العمل والدراسة',
  'Likes, Dislikes & Opinions': 'التفضيلات والآراء',
  'Making Plans': 'وضع الخطط',
  'Homes & Neighbourhoods': 'المنازل والأحياء',
  'Food, Health & Habits': 'الطعام والصحة والعادات',
  'Shopping & Services': 'التسوّق والخدمات',
  'Telling Stories': 'سرد القصص',
  // Level III — Intermediate
  'Present Perfect & Life Experience': 'المضارع التام وخبرات الحياة',
  'Education & Learning': 'التعليم والتعلّم',
  'Work, Careers & Entrepreneurship': 'العمل والمسارات المهنية وريادة الأعمال',
  'Opinions & Debate': 'الآراء والمناظرة',
  'Environment, Ethics & Global Citizenship': 'البيئة والأخلاق والمواطنة العالمية',
  'Technology & Media': 'التقنية والإعلام',
  'Health, Body & Mind': 'الصحة والجسد والعقل',
  'Travel & Culture': 'السفر والثقافة',
  'Academic Foundations': 'الأسس الأكاديمية',
  // Level IV — Upper Intermediate
  'Advanced Present & Past Systems': 'أنظمة المضارع والماضي المتقدمة',
  'Academic Writing I': 'الكتابة الأكاديمية — الجزء الأول',
  'The World of Work': 'عالم العمل',
  'Arguing a Position': 'الدفاع عن موقف',
  'Science, Technology & Ethics': 'العلوم والتقنية والأخلاق',
  'Global Issues': 'القضايا العالمية',
  'Media Literacy & Critical Reading': 'الوعي الإعلامي والقراءة النقدية',
  'Meetings & Negotiation': 'الاجتماعات والتفاوض',
  'Academic Writing II': 'الكتابة الأكاديمية — الجزء الثاني',
  // Level V — Advanced
  'Nuance & Idiom': 'الدلالات الدقيقة والتعبيرات الاصطلاحية',
  'Academic Writing III': 'الكتابة الأكاديمية — الجزء الثالث',
  'Leadership & Persuasion': 'القيادة والإقناع',
  'Complex Systems (Science, Economics, Policy)': 'الأنظمة المركّبة: العلوم والاقتصاد والسياسات',
  'Cross-Cultural Communication': 'التواصل بين الثقافات',
  'Advanced Media & Discourse Analysis': 'الإعلام المتقدم وتحليل الخطاب',
  'Research & Presentation': 'البحث والعرض',
  'Professional Advocacy': 'المرافعة المهنية',
  'Style & Voice': 'الأسلوب والصوت الكتابي',
  // Level VI — Mastery
  'Mastery Diagnostic & Executive Leadership': 'التقويم التشخيصي للإتقان والقيادة التنفيذية',
  'Diplomacy & International Relations': 'الدبلوماسية والعلاقات الدولية',
  'Global Business Strategy': 'استراتيجية الأعمال العالمية',
  'Public Policy': 'السياسات العامة',
  'Law & Justice': 'القانون والعدالة',
  'Innovation & Emerging Technologies': 'الابتكار والتقنيات الناشئة',
  'Media & Public Communication': 'الإعلام والتواصل العام',
  'Research & Scholarship': 'البحث والدراسة العلمية',
  'Ethics & Responsible Leadership': 'الأخلاق والقيادة المسؤولة',
  'Capstone — Global Challenges & Mastery Examination': 'مشروع التتويج: التحديات العالمية وامتحان الإتقان',
};

/** "Module 7: Past Experiences" → "Past Experiences". The record holds
 *  the number in the title as well as in its own column. */
const bare = (title) => String(title).replace(/^Module\s+\d+:\s*/, '').replace(/\s--\s/g, ' — ').trim();

// THE GUARD. A module with no Arabic rendering must stop the build, not
// fall back to English inside an Arabic table — a page that silently
// prints half its content in the wrong language looks finished, and
// nobody goes looking for what is missing on a page that looks
// finished. Same discipline as the level-name guard in build-arabic.js.
{
  const missing = [];
  for (const lv of levels) {
    for (const m of lv.modules) if (!AR_MODULE[bare(m.title)]) missing.push(`L${lv.id}: ${bare(m.title)}`);
  }
  if (missing.length) {
    throw new Error(`No Arabic rendering for ${missing.length} module title(s):\n  ${missing.join('\n  ')}\n`
      + 'Add them to AR_MODULE in scripts/build-arabic-levels.js. The Arabic level pages will not '
      + 'be published with English titles standing in.');
  }
}

// ── The four skills, in Arabic ────────────────────────────────────────
// Keyed on the record's own English name, guarded the same way.
const AR_SKILL = {
  Listening: {
    name: 'الاستماع', mode: 'استقبالي',
    text: 'فهم الكلام بسرعته الطبيعية، بما في ذلك اللهجات غير المألوفة والظروف غير المثالية.',
  },
  Reading: {
    name: 'القراءة', mode: 'استقبالي',
    text: 'القراءة بحثًا عن الحجة والتفصيل، لا عن المعنى العام وحده، وعبر مستويات لغوية مختلفة.',
  },
  Speaking: {
    name: 'التحدث', mode: 'إنتاجي',
    text: 'التحدث مع التحكم في القواعد والنطق ومستوى اللغة، في الزمن الحقيقي.',
  },
  Writing: {
    name: 'الكتابة', mode: 'إنتاجي',
    text: 'الكتابة لغرض محدد ولقارئ محدد، ثم مراجعة ما كُتب.',
  },
};
for (const s of skills) if (!AR_SKILL[s.name]) throw new Error(`No Arabic rendering for skill "${s.name}"`);

// ── The one authored paragraph per level ──────────────────────────────
// Written in Arabic against the same curriculum, not translated from
// the English paragraph — where the English leaned on an English idiom
// the Arabic says the thing plainly instead. Each names the shift the
// level actually makes, which a module list alone does not convey, and
// none of them claims an outcome the College has not measured.
const AR_CHARACTER = {
  I: 'التأسيس أصعب مستوى في بدايته، وأكثرها استهانةً به. لا يفترض معرفة سابقة بالإنجليزية على '
    + 'الإطلاق، وينتهي بمتعلم يستطيع أن يعرّف بنفسه، ويتعامل مع متجر وشارع وعيادة، ويكتب بضع '
    + 'جمل صحيحة عن حياته. العمل هنا ليس في التعقيد، بل في بناء أول الاستجابات التلقائية: أن '
    + 'يصبح التحية أو ذكر مكان السكن أمرًا لا يحتاج إلى تركيب الجملة أولًا.',
  II: 'في المستوى الابتدائي تتحول الجمل المنفصلة إلى كلام متصل. المتعلم يملك المضارع والماضي، '
    + 'وهذا المستوى يعلّمه الربط والترتيب والتقييد — أن يروي بدل أن يعدّد، وأن يبدي رأيًا لا أن '
    + 'يذكر واقعة، وأن يواصل الحديث حين يقول محدّثه شيئًا غير متوقع.',
  III: 'المستوى المتوسط هو الحد الذي تكفّ عنده الإنجليزية عن كونها مادة وتصير أداة. يقرأ '
    + 'المتعلم بحثًا عن الحجة لا عن المعنى العام، ويعرض موقفًا ويدافع عنه، ويتناول موضوعات — '
    + 'العمل والدراسة والبيئة والتقنية — لا تنتمي مفرداتها إلى الحياة المنزلية. وهو أيضًا '
    + 'المستوى الذي لا بد فيه من فهم المضارع التام بدل تجنّبه.',
  IV: 'في المتوسط المتقدم تبدأ الدقة تحت الضغط في أن تصبح مهمة. المتعلم يستطيع التواصل أصلًا؛ '
    + 'وهذا المستوى معنيّ بأن يفعل ذلك في مواضع تحكم عليه — مقالة أكاديمية، اجتماع، تفاوض، مادة '
    + 'إعلامية تُقرأ بعين ناقدة لا تُقبل كما هي. البنية ومستوى اللغة هنا يزنان بقدر المفردات.',
  V: 'المستوى المتقدم هو مستوى الدلالة الدقيقة. المتعلم يملك النظام اللغوي؛ وما يُضاف هو '
    + 'التحكم في كيفية وصول المعنى — التعبير الاصطلاحي، والتلميح، والنبرة، والفرق بين أن تخالف '
    + 'وأن تكون مخالفًا. البحث والعرض والمرافعة تتطلب إنجليزية تقنع مستمعًا غير مضطر إلى الصبر.',
  VI: 'الإتقان ليس مزيدًا من الإنجليزية، بل إنجليزية بصوت شخصي: أسلوب مختار لا موروث، وحجة '
    + 'مبنية لجمهور بعينه، وثقة في العمل ضمن مستويات لغوية — أكاديمية ومهنية وعامة — تتطلب '
    + 'حكمًا لا قواعد. وهو المستوى الذي يكفّ عنده المتعلم عن كونه دارسًا للغة.',
};
for (const lv of levels) if (!AR_CHARACTER[lv.roman]) throw new Error(`No Arabic character text for level ${lv.roman}`);

// ── Arabic renderings of the Level I learning outcomes ────────────────
// Keyed on the outcome CODE, which is stable, rather than on the
// statement, which is edited. An outcome with no rendering stops the
// build for the same reason a module does.
const AR_OUTCOME = {
  'IEFC-I-LO1': 'تبادل المعلومات الشخصية والاحتياجات والخطط البسيطة مع محدّث متعاون، وأن يُفهَم '
    + 'من المرة الأولى في الموضوعات اليومية المألوفة.',
  'IEFC-I-LO2': 'استخدام المضارع البسيط والماضي البسيط وصيغتَي there is / there are، والأسماء '
    + 'المعدودة وغير المعدودة، وأدوات الملكية، وأفعال القدرة، وصيغة going to، بالدقة التي تتيح '
    + 'للمستمع المتابعة دون طلب توضيح.',
  'IEFC-I-LO3': 'الاختيار بين الصيغة المهذبة والصيغة المباشرة بحسب الموقف والشخص المخاطَب، في '
    + 'المعاملات والطلبات وإسداء النصيحة.',
  'IEFC-I-LO4': 'اختيار التركيب النحوي الذي يقتضيه موقف حياتي موصوف، من بين ما دُرّس في المستوى، '
    + 'دون أن يُقال له أيّها ينطبق.',
};

// ── What each award is for, in Arabic ─────────────────────────────────
// The official title and post-nominal stay in Latin script; this is the
// gloss that goes beside them.
const AR_AWARD_PURPOSE = {
  1: 'يمثّل دخول المتعلم في تقليد الكلية: أول شهادة على أنه بلغ حدًّا لغويًا يمكن التحقق منه، '
    + 'بعد أن بدأ من الصفر.',
  2: 'يعترف بمتعلم رسّخ الأساس وصار قادرًا على الكلام المتصل، لا على الجمل المفردة.',
  3: 'يضع حامله عضوًا مستقرًا في المجتمع الأكاديمي للكلية، قادرًا على استعمال الإنجليزية أداةً '
    + 'للدراسة والعمل.',
  4: 'يشير إلى من يُوثق به لتمثيل موقف والتواصل به في مواضع تُقيَّم فيها الدقة والبنية.',
  5: 'يشير إلى متواصل رفيع المستوى فكريًا ومهنيًا، يملك الإقناع لا التعبير وحده.',
  6: 'أعلى ما يمنحه البرنامج: إتقان متميّز، بصوت أسلوبي مختار وحكم لغوي مستقل.',
};
for (const lv of levels) {
  if (lv.award && !AR_AWARD_PURPOSE[lv.id]) throw new Error(`No Arabic purpose for the Level ${lv.roman} award`);
}

// ── page assembly ─────────────────────────────────────────────────────
function levelPage(lv, i) {
  const prev = levels[i - 1] || null;
  const next = levels[i + 1] || null;
  const teaching = lv.kinds.reading || 0;
  const quizzes = lv.kinds.quiz || 0;
  const assignments = lv.kinds.assignment || 0;
  const listening = lv.kinds.listening || 0;
  const pron = lv.kinds.pronunciation || 0;
  const a = lv.award;
  const ord = AR_ROMAN[lv.roman];
  const arName = AR_NAME[lv.id];

  // Outcomes exist for Level I alone. The other five levels do not get
  // an empty section with an apology in it — they get no section, and
  // the reason is on /ar/about/basce/ where it belongs.
  const outcomes = lv.outcomes.length ? `
<section class="section--light section-pad" id="outcomes">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">نواتج التعلم</span>
      <h2>ما ستكون قادرًا على فعله.</h2>
      <p class="lede">تُكتب قبل تصميم التدريس لا بعده. كل ناتج دعوى بُنيت أدوات التقييم لاختبارها،
        ولهذا عددها ${ltr(String(lv.outcomes.length))} لا عشرون.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">الرمز</th><th scope="col">عند الإتمام، يستطيع المتعلم</th><th scope="col">النص الإنجليزي المعتمد</th><th scope="col">الحالة</th></tr></thead>
        <tbody>
${lv.outcomes.map((o) => {
    const ar = AR_OUTCOME[o.code];
    if (!ar) throw new Error(`No Arabic rendering for outcome ${o.code}`);
    return `          <tr><td>${ltr(esc(o.code))}</td><td>${ar}</td>`
      + `<td><span dir="ltr" lang="en">${esc(o.statement)}</span></td>`
      + `<td>${o.status === 'approved' ? 'معتمد' : 'مؤقت'}</td></tr>`;
  }).join('\n')}
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">عن النص الإنجليزي المعتمد</span>
      <p>الصياغة الإنجليزية هي النص المعتمد للناتج: هي ما تحمله المناهج المنشورة ودليل التقييم
        وسجل المتعلم. النص العربي ترجمة معتمدة يُقرأ بها الناتج، وتُنشر إلى جانبه لا بدلًا منه،
        حتى يستطيع القارئ العربي مطابقة الصفحة بسجله.</p>
    </div>
    ${lv.outcomes.some((o) => o.status !== 'approved') ? `<div class="callout">
      <span class="callout__label">لماذا هذه النواتج مؤقتة</span>
      <p>مجلس المعايير الأكاديمية وتميّز المناهج لم يُعيَّن له أعضاء بعد، ولا يمكن لهيئة لا تنعقد
        أن تعتمد ناتجًا. كُتبت هذه النواتج بتفويض من دار النشر وسُجّلت مؤقتة إلى أن يُشكَّل المجلس
        ويراجعها. هي مستعملة، وهي غير مصادق عليها بعد — ونحن نقول ذلك بدل وصفها بالمستقرة.</p>
    </div>` : ''}
  </div>
</section>` : '';

  const award = a ? `
<section class="section--paper section-pad" id="award">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الشهادة</span>
      <h2><span dir="ltr" lang="en">${esc(a.official_title)}</span></h2>
      <p class="lede">${AR_AWARD_PURPOSE[lv.id]}${a.post_nominal
    ? ` &middot; اللاحقة الاسمية <b>${ltr(esc(a.post_nominal))}</b>` : ''}</p>
    </div>
    <div class="callout">
      <span class="callout__label">لماذا العنوان بالإنجليزية</span>
      <p>الشهادة كيان معرَّف له عنوان رسمي ولاحقة اسمية، وترجمة العنوان تُنشئ شهادةً ثانية لم
        يعرّفها أحد ولا يستطيع أحد منحها. يُنشر العنوان كما هو، ويُشرح معناه بالعربية إلى جانبه.</p>
    </div>
    <div class="callout">
      <span class="callout__label">ما ليست هذه الشهادة</span>
      <p>الكلية لا تحمل أي اعتماد أكاديمي، ولم تُعيّن ممتحنًا خارجيًا — وهو المنصب المستقل
        المطلوب قبل أن تُمنح أي شهادة على وجه صحيح. هذه الشهادة معرَّفة، ومعاييرها منشورة، ولم
        تُمنح لأحد. انظر <a href="/ar/about/#status">وضع الكلية المؤسسي</a>.</p>
    </div>
  </div>
</section>` : '';

  return `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">${ltr('IEFC')} &middot; المستوى ${ord}</span>
    <h1>${arName}</h1>
    <p class="lede">${AR_CHARACTER[lv.roman]}</p>
    <div class="btn-row">
      <a href="/ar/admissions/#apply" class="btn btn--gold">قدّم للمستوى ${ord}</a>
      <a href="/ar/academics/iefc/" class="btn btn--outline">برنامج ${ltr('IEFC')} كاملًا</a>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="overview">
  <div class="container reveal">
    <div class="stat-row">
      <div class="stat-row__item"><b>${ltr(esc(lv.cefr))}</b><span>مستوى الإطار الأوروبي</span></div>
      <div class="stat-row__item"><b>${ltr(String(lv.modules.length))}</b><span>وحدة</span></div>
      <div class="stat-row__item"><b>${ltr(String(lv.units))}</b><span>ساعة تدريس</span></div>
      <div class="stat-row__item"><b>${ltr(String(lv.duration_months))}</b><span>شهرًا</span></div>
      <div class="stat-row__item"><b>${money(lv.price_usd_cents)}</b><span>الرسوم</span></div>
    </div>
    <div class="section-head">
      <span class="module-marker">نظرة عامة</span>
      <h2>ما يحتويه هذا المستوى.</h2>
    </div>
    <div class="grid grid--3">
${card('التدريس', `${ltr(String(teaching))} درسًا`, 'يسير كل درس في تسلسل كامل — تمهيد، وعرض، وتدريب موجَّه، وتدريب مستقل، وكتابة، وواجب منزلي — بتوقيت مذكور في الخطة لا متروك للقاعة.')}
${card('الاستماع', `${ltr(String(listening))} مجموعات استماع`, 'مجموعة استماع مكتوبة النص في كل وحدة، مع إشارات المتحدثين وأسئلة فهم مبنية على النص نفسه لا مضافة إليه بعد إعداده.')}
${card('النطق', `${ltr(String(pron))} معامل نطق`, 'معمل نطق في كل وحدة، يستهدف الأصوات وأنماط النبر والإيقاع التي تحتاجها لغة تلك الوحدة تحديدًا.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="modules">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الوحدات</span>
      <h2>الوحدات ${ltr(String(lv.modules.length))}، بترتيبها.</h2>
      <p class="lede">التسلسل مقصود: كل وحدة تفترض ما علّمته الوحدة التي قبلها، والوحدة الأخيرة
        ترسّخ ولا تقدّم جديدًا. يُنشر العنوان الإنجليزي إلى جانب العربي لأنه العنوان المعتمد في
        المناهج وفي سجل المتعلم.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">#</th><th scope="col">الوحدة</th><th scope="col">العنوان المعتمد</th></tr></thead>
        <tbody>
${lv.modules.map((m) => `          <tr><td>${ltr(String(m.sequence))}</td><td>${AR_MODULE[bare(m.title)]}</td>`
    // The FULL recorded title, "Module 1:" and all. The column is
    // headed العنوان المعتمد — the adopted title — and the adopted
    // title is the whole string the curriculum record holds. Printing
    // the trimmed version under that heading would be a small untruth
    // on a page whose entire argument is that it does not tell them.
    + `<td><span dir="ltr" lang="en">${esc(String(m.title).replace(/\s--\s/g, ' — '))}</span></td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>
${outcomes}
<section class="section--dark section-pad" id="skills">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المهارات</span>
      <h2>أربع مهارات، تُدرَّس وتُقيَّم منفصلة.</h2>
      <p class="lede">من يقرأ جيدًا ويتحدث بضعف ليس في المستوى نفسه في الاثنتين، والدرجة الكلية
        الواحدة تخفي ذلك. كل مهارة تُتابَع وحدها.</p>
    </div>
    <div class="grid grid--2">
${skills.map((s) => darkCard(AR_SKILL[s.name].mode, AR_SKILL[s.name].name, AR_SKILL[s.name].text)).join('\n')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="assessment">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التقييم</span>
      <h2>كيف يُحكم على المستوى.</h2>
      <p class="lede">كل أداة تقييم تُكتب قبل التدريس الذي تختبره، وتُنشر معاييرها للمتعلم مسبقًا.</p>
    </div>
    <div class="grid grid--3">
${card('مستمر', `${ltr(String(quizzes))} اختبارات وحدات`, 'اختبار في نهاية كل وحدة، يختبر لغة تلك الوحدة لا غيرها. يُصحَّح آليًا، مع بيان الإجابة الصحيحة وسببها.')}
${card('إنتاجي', `${ltr(String(assignments))} تكليفات`, 'مهام تحدث وكتابة يصححها مدرّس وفق معيار منشور. هنا تُقيَّم المهارتان الإنتاجيتان فعلًا — فالاختبار الآلي لا يحكم على القدرة على إدارة حوار.')}
${card('تقويم ذاتي', 'قبل كل تقييم', 'يحمل كل درس تقويمًا ذاتيًا فيه مواضع خطأ مقصودة تستهدف ما يخطئ فيه متعلمو هذا المستوى فعلًا، ليكتشف المتعلم الثغرة قبل أن يكتشفها المصحّح.')}
    </div>
    <div class="btn-row">
      <a href="/ar/students/assessment/" class="btn btn--red">التقييم والتقدّم بالتفصيل</a>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="teaching">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">طرائق التدريس</span>
      <h2>كيف يُدرَّس.</h2>
    </div>
    <div class="grid grid--2">
${card('التحدث أولًا', 'الممارسة قبل الإتقان', 'التحدث الموجَّه جزء من كل درس، لا إضافة اختيارية. يتحدث المتعلم من الدرس الأول، قبل أن تجهز قواعده، لأن انتظار الدقة هو ما يُبقي الناس صامتين سنوات.')}
${card('منهج واحد', 'معيار مشترك لا أسلوب شخصي', 'يدرّس كل مدرّس وفق المنهج المخطط نفسه، فلا يفقد المتعلم موضعه إذا غيّر الشعبة، ويكون متعلمان في المستوى نفسه قد قطعا المسافة نفسها.')}
${card('مدعوم', 'مدرّس يعرف أين يقع الخطأ', 'يعمل المدرّسون من دليل المعلّم، وهو يبيّن لكل درس ما يقع فيه الخطأ عادةً، وطريقة ثانية للشرح، وما يُفعل مع المتأخر ومع المتقدّم.')}
${card('مقيس', 'يُعدَّل بحسب الدفعة', 'نتائج الاختبارات والتكليفات ظاهرة للمدرّس أثناء سير المستوى، فيستجيب التدريس لأداء هذه المجموعة فعلًا لا لما افترضته الخطة.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="progression">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التسلسل</span>
      <h2>موضع هذا المستوى.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('قبله', prev ? `المستوى ${AR_ROMAN[prev.roman]} — ${AR_NAME[prev.id]}` : 'لا يُشترط أي دراسة سابقة',
    prev
      ? `يفترض المستوى ${ord} اللغة التي عُلّمت في ${AR_NAME[prev.id]} (${ltr(esc(prev.cefr))}). `
        + 'ومن لم يدرس في الكلية يخضع لاختبار تحديد مستوى بدل أن يُطلب منه تقدير مستواه بنفسه.'
      : 'التأسيس لا يفترض أي إنجليزية. لا اختبار دخول ولا متطلب سابق — وهو مكتوب لمتعلم يبدأ من الصفر.')}
${darkCard('بعده', next ? `المستوى ${AR_ROMAN[next.roman]} — ${AR_NAME[next.id]}` : 'نهاية البرنامج',
    next
      ? `عند الإتمام ينتقل المتعلم إلى ${AR_NAME[next.id]} (${ltr(esc(next.cefr))})، وهو يفترض كل ما عُلّم هنا.`
      : `${AR_NAME[lv.id]} آخر مستويات برنامج ${ltr('IEFC')}. لا مستوى فوقه في هذا البرنامج.`)}
    </div>
    ${next ? `<div class="btn-row">
      <a href="/ar/study/${SLUG[next.roman]}/" class="btn btn--gold">المستوى ${AR_ROMAN[next.roman]} — ${AR_NAME[next.id]}</a>
    </div>` : ''}
  </div>
</section>
${award}
<section class="section--light section-pad" id="questions">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">أسئلة</span>
      <h2>ما يُسأل عن هذا المستوى.</h2>
    </div>
    <div class="grid grid--2">
${card('المدة', `كم يستغرق المستوى ${ord}؟`, `${ltr(String(lv.duration_months))} أشهر من الدراسة، تغطي ${ltr(String(lv.units))} ساعة تدريس عبر ${ltr(String(lv.modules.length))} وحدات. ومن يحتاج وقتًا أطول لا يُعاقَب؛ المستوى عمل يُنجز لا سباق يُركض.`)}
${card('الرسوم', 'كم تكلفة هذا المستوى؟', `${money(lv.price_usd_cents)} لهذا المستوى وحده. البرنامج كامل ${ltr('$19,000')} موزّعة بالتساوي على المستويات الستة، ويمكن الدفع مستوى بمستوى.`)}
${card('اللغة', 'هل الدراسة بالعربية؟', 'التدريس بالإنجليزية. هذه الصفحة وصفحات القبول والرسوم والتقييم منشورة بالعربية حتى تتخذ قرارك بلغتك، ثم تدرس باللغة التي جئت لتتعلمها.')}
${card('البدء', 'متى أبدأ؟', 'القبول مستمر ولا توجد دفعات محددة. تبدأ في اليوم الذي تُسجَّل فيه.')}
    </div>
  </div>
</section>

${cta(`ابدأ من المستوى ${ord}.`, 'قدّم الآن', '/ar/admissions/apply/', 'الرسوم والدفع', '/ar/admissions/tuition/')}`;
}

// ── write ─────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

levels.forEach((lv, i) => {
  const slug = `study-${SLUG[lv.roman]}-ar`;
  const file = `study-${SLUG[lv.roman]}.ar.html`;
  const output = `ar/study/${SLUG[lv.roman]}/index.html`;
  fs.writeFileSync(path.join(ROOT, 'pages', file), levelPage(lv, i) + '\n');

  const entry = {
    slug,
    output,
    title: `المستوى ${AR_ROMAN[lv.roman]}: ${AR_NAME[lv.id]} (${lv.cefr}) — الكلية العالمية للغة الإنجليزية`,
    description: `المستوى ${AR_ROMAN[lv.roman]} من برنامج IEFC: ${lv.modules.length} وحدات، و${lv.units} ساعة تدريس `
      + `على مدى ${lv.duration_months} أشهر، وفق مستوى ${lv.cefr} في الإطار الأوروبي. الوحدات والتقييم وطرائق التدريس والشهادة.`,
    contentFile: file, lang: 'ar', dir: 'rtl',
    contents: true,
    altHref: `/study/${SLUG[lv.roman]}/`,
  };
  const at = entries.findIndex((e) => e.slug === slug);
  if (at >= 0) entries[at] = { ...entries[at], ...entry }; else entries.push(entry);

  // Pair it back. An English page whose Arabic edition now exists but
  // whose altHref still points at the Arabic front door sends the
  // reader to the wrong place — quietly, and only for the readers who
  // need it most.
  const en = entries.find((e) => e.slug === `study-${SLUG[lv.roman]}`);
  if (!en) throw new Error(`No English page "study-${SLUG[lv.roman]}" to pair with ${slug}`);
  en.altHref = `/ar/study/${SLUG[lv.roman]}/`;
  written.push(output);
});

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${written.length} Arabic level pages and paired them with their English editions:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
