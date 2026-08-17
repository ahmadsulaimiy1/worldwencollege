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
const { emitPage, reportEmit } = require('./lib/emit-page');
const { DatabaseSync } = require('node:sqlite');
const {
  AR_LEVEL, AR_ROMAN, ltr, esc, card, darkCard, cta,
} = require('./lib/arabic-kit');

// The Arabic level names, keyed by numeric id, taken from the kit so
// the hub page, the admissions pages and these six cannot disagree
// about what Level III is called.
const AR_NAME = Object.fromEntries(Object.entries(AR_LEVEL).map(([id, v]) => [Number(id), v.name]));

// Kept identical to scripts/build-levels.js, deliberately: the weekly
// commitment is the same fact in both languages, so it is derived by the
// same arithmetic rather than translated from a rendered English string.
// See the longer note in that file for why 4.345 and not 4.
const TQT_HOURS = 200;
const weeklyHours = (lv) => Math.round(TQT_HOURS / (lv.duration_months * 4.345));

// The module arc, in Arabic. Twin of moduleArc() in
// scripts/build-levels.js — see the note there for why this replaced one
// sentence that was identical on all six level pages.
//
// Built from AR_MODULE, the translated titles, not from the English
// ones: an Arabic reader meeting "opens at Meeting People" in Latin
// script mid-sentence is reading a seam. Declared after AR_MODULE and
// bare() below, and called only at render time, so the ordering holds.
function moduleArc(lv) {
  const ord = AR_ROMAN[lv.roman];
  const first = AR_MODULE[bare(lv.modules[0].title)];
  const last = AR_MODULE[bare(lv.modules[lv.modules.length - 1].title)];
  return `يبدأ المستوى ${ord} من ${first} وينتهي عند ${last}. وكل وحدة تفترض ما علّمته `
    + 'الوحدة التي قبلها، فالترتيب هو الحجّة لا مجرّد تنظيم.';
}

const SKILL_ICON = {
  Listening: 'i-waveform', Reading: 'i-book',
  Speaking: 'i-language', Writing: 'i-quill',
};

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

// What the holder of each award can actually do, in Arabic. The record
// holds this in English (award_definitions.graduate_profile) and the
// English page prints it verbatim; translating it here rather than
// machine-rendering the column keeps the Arabic edition readable and
// keeps the two from drifting into different claims.
const AR_GRADUATE_PROFILE = {
  1: 'يعرّف بنفسه ويسأل ويجيب عن أمور مألوفة، ويفهم الكلام البطيء الواضح، ويقرأ ويكتب '
    + 'جملًا بسيطة عن حياته اليومية.',
  2: 'يتعامل مع مواقف الحياة المعتادة، ويصف خبرته ومحيطه، ويكتب رسائل قصيرة مترابطة عن '
    + 'موضوعات يعرفها.',
  3: 'يتدبّر أكثر ما يعرض في السفر والعمل، ويصوغ رأيًا ويعلّله، ويكتب نصًا متصلًا عن '
    + 'موضوعات تهمّه.',
  4: 'يناقش موضوعًا تقنيًا في مجاله، ويتفاعل بطلاقة تجعل الحديث مع متحدث أصلي ممكنًا دون '
    + 'جهد من الطرفين، ويكتب نصًا مفصَّلًا يوازن بين وجهات نظر.',
  5: 'يستعمل اللغة بمرونة وفاعلية في العمل والدراسة، ويعبّر عن نفسه دون بحث ظاهر عن '
    + 'العبارة، ويبني نصًا واضح البنية عن موضوعات مركّبة.',
  6: 'يفهم في يسر كل ما يسمعه ويقرؤه تقريبًا، ويلخّص من مصادر متعددة في عرض متماسك، '
    + 'ويعبّر بدقة تميّز ظلال المعنى في المواقف المعقّدة.',
};
for (const lv of levels) {
  if (lv.award && !AR_GRADUATE_PROFILE[lv.id]) {
    throw new Error(`No Arabic graduate profile for the Level ${lv.roman} award`);
  }
}


// ── page assembly ─────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────
// كل مستوى مؤهل كامل بذاته
// ─────────────────────────────────────────────────────────────────────
// The English twin records the reasoning in full: the pathway framing
// made Level VI the only finish line, so a learner who took Level I and
// stopped read the page as somebody who had abandoned a course. Level I
// is a taught, assessed, certificated qualification with its own entry
// standard, its own exit standard and its own uses. Authored per level
// in Arabic rather than machine-rendered from the English, because the
// register of a professional claim does not survive translation.
const AR_QUALIFICATION = {
  1: {
    forWhom: 'بالغٌ يبدأ الإنجليزية بالغًا — بلا إنجليزية صالحة للاستعمال، أو بإنجليزيةٍ مدرسية لم تصر كلامًا قط. لا يفترض شيئًا ويبدأ من الصفر.',
    entry: 'لا شيء. لا مؤهل، ولا اختبار، ولا مستندات، ولا دراسة سابقة. وتقييم تحديد المستوى موجود ليؤكد أن هذا مستواك المناسب، لا ليمنعك منه.',
    exit: '‏70% إجمالًا في امتحان المستوى، ولا مهارة واحدة دون 50%، وتسليم عشرة تكاليف الوحدات وتصحيحها، وتسجيل ورقة التحدث والنجاح فيها. والحد الأدنى للمهارة هو سبب أن النجاح هنا يعني أنك تتكلم، لا أنك عوّضت بالقراءة.',
    work: 'أن تُفهَم في مكان عمل تجري فيه التوجيهات وتحذيرات السلامة والمحاورات القصيرة بالإنجليزية. وهو المستوى الذي يحوّل «لا إنجليزية» إلى «بعض الإنجليزية» في نموذج التقديم، وذلك أكبر تغيّر منفرد في قابلية التوظيف على المسار كله.',
    study: 'يستوفي شرط الالتحاق بالمستوى الثاني. وتعتدّه هذه الكلية دليلًا على بلوغ <span dir="ltr">A1</span>؛ ولا تعترف به أي جهة خارجية، والصفحة أدناه تقول ذلك.',
    stopping: 'مؤهل <span dir="ltr">A1</span> كامل، مُشهَد ويقبل التحقق. وإن توقفت هنا فأنت تحمل شهادة منتهية من كلية تنشر ما قِيست به &mdash; لا دورةً متروكة.',
  },
  2: {
    forWhom: 'متعلّم يتدبّر الجمل المفردة ويحتاج الكلام المتصل: من يُفهَم كلمةً كلمة ويريد أن يُفهَم فِقَرًا.',
    entry: 'شهادة المستوى الأول، أو بلوغ <span dir="ltr">A2</span> مثبتًا بتقييم تحديد المستوى أو بمؤهل خارجي معترف به. انظر جدول الاعتراف في صفحة القبول.',
    exit: '‏70% إجمالًا ولا مهارة دون 50%، وعشرة تكاليف مصحَّحة، وورقة تحدث في مستوى <span dir="ltr">A2</span> &mdash; حيث يصير المعيار كلامًا متصلًا لا شظايا صحيحة.',
    work: 'إنجليزية تكفي لوظيفة خدمة أو بيع أو ضيافة أو إدارة تجري جزئيًا بالإنجليزية: تلقّي توجيه، ووصف مشكلة، وكتابة رسالة قصيرة تُقرأ كما قصدتها.',
    study: 'يستوفي شرط الالتحاق بالمستوى الثالث. وهو آخر مستوى يُوصف عنده المتعلّم عادةً بالمبتدئ، وأول مستوى لا يُوصف عنده بذلك.',
    stopping: 'مؤهل <span dir="ltr">A2</span> كامل. وأكثر تعلّم اللغات في العالم يتوقف قريبًا من هنا بلا شيء يُظهَر؛ وهذا يتوقف بشهادة وكشف درجات يسمّي كل مهارة منفصلة.',
  },
  3: {
    forWhom: 'متعلّم يحتاج الإنجليزية للعمل أو الدراسة لا للنجاة: النقطة التي تكفّ فيها اللغة عن أن تكون الموضوع وتبدأ أن تكون الأداة.',
    entry: 'شهادة المستوى الثاني، أو بلوغ <span dir="ltr">B1</span> مثبتًا بتقييم تحديد المستوى أو بمؤهل خارجي معترف به.',
    exit: '‏70% إجمالًا ولا مهارة دون 50%، وعشرة تكاليف، وورقة تحدث في <span dir="ltr">B1</span> تتطلب رأيًا يُتّخذ ويُدافَع عنه لا معلومةً تُنقَل.',
    work: 'الحد الذي يقصده أكثر أصحاب العمل بعبارة «الإنجليزية مطلوبة»: مراسلات تُدار، واجتماع يُتابَع، ومشكلة تُشرَح لمن لم يحضرها. وهو المستوى الذي تكفّ عنده الإنجليزية عن تحديد الوظائف التي تستطيع التقدم لها.',
    study: 'يستوفي شرط الالتحاق بالمستوى الرابع، وهو المستوى الذي يبدأ منه إعداد الكلية لـ<span dir="ltr">IELTS</span> و<span dir="ltr">TOEFL</span> و<span dir="ltr">Cambridge</span> أن يكون نافعًا لا سابقًا لوقته.',
    stopping: 'مؤهل <span dir="ltr">B1</span> كامل، وموضع توقف يُدافَع عنه. فـ<span dir="ltr">B1</span> هو المستوى الذي تُدار به حياة مهنية كثيرة إدارةً كافية تمامًا، والشهادة تقول <span dir="ltr">B1</span> ولا تُوهم بأكثر.',
  },
  4: {
    forWhom: 'مهنيٌّ أو طالب متوجّه إلى الجامعة، قادرٌ أصلًا، ويعوقه الضبط: المستوى اللغوي، والبنية، والفرق بين أن تُفهَم وأن تُقنِع.',
    entry: 'شهادة المستوى الثالث، أو بلوغ <span dir="ltr">B2</span> مثبتًا بتقييم تحديد المستوى أو بمؤهل خارجي معترف به.',
    exit: '‏70% إجمالًا ولا مهارة دون 50%، وعشرة تكاليف، وورقة تحدث في <span dir="ltr">B2</span> تتطلب مناقشة موضوع تقني في مجال المتقدم نفسه.',
    work: 'المستوى الذي تستطيع عنده تمثيل موقف لا مجرد ذكره: إدارة اجتماع معتاد، وكتابة مستند يصدر باسمك، والتفاوض في تفصيل. ويعدّ أكثر أصحاب العمل الدوليين <span dir="ltr">B2</span> معيار الإنجليزية المهنية العاملة.',
    study: 'يستوفي شرط الالتحاق بالمستوى الخامس. و<span dir="ltr">B2</span> هي الفئة التي تطلبها أكثر الجامعات للقبول في برنامج يُدرَّس بالإنجليزية، وهنا يكون إعداد الامتحانات في الكلية أشدَّ مباشرةً.',
    stopping: 'مؤهل <span dir="ltr">B2</span> كامل &mdash; وهو أكثر المستويات طلبًا في عالم العمل والدراسة، وخطُّ نهاية لا محطةَ طريق لأكثر من يبلغه.',
  },
  5: {
    forWhom: 'من إنجليزيته جيدة أصلًا وسقفُه الآن الحُكم: أن يعرف أي مستوى لغوي يقتضيه الموقف، وما لا يُقال فيه.',
    entry: 'شهادة المستوى الرابع، أو بلوغ <span dir="ltr">C1</span> مثبتًا بتقييم تحديد المستوى أو بمؤهل خارجي معترف به.',
    exit: '‏70% إجمالًا ولا مهارة دون 50%، وعشرة تكاليف، وورقة تحدث في <span dir="ltr">C1</span> تتطلب استعمالًا مرنًا فاعلًا في ظروف لم يتدرب عليها المتقدم.',
    work: 'إنجليزية مهنية عليا: قيادة مناقشة، وبناء حجة، والكتابة المطوَّلة لقارئ صعب، وتدبّر تحوّلات المستوى اللغوي التي تحتاجها محادثة عسيرة. وهو المستوى الذي لا تعود عنده الإنجليزية اعتبارًا في ما يمكن أن يُطلب منك.',
    study: 'يستوفي شرط الالتحاق بالمستوى السادس، ويبلغ أو يتجاوز شرط اللغة في أكثر برامج الدراسات العليا التي تُدرَّس بالإنجليزية.',
    stopping: 'مؤهل <span dir="ltr">C1</span> كامل. وقليل جدًا من المتعلمين يحتاج ما بعد <span dir="ltr">C1</span> لأي غرض مهني، وتفضّل الكلية أن تقول ذلك على أن تبيع مستوًى سادسًا لمن انتهى.',
  },
  6: {
    forWhom: 'متعلّم في قمة الإطار يريد صوتًا خاصًّا لا مزيدًا من الدقة: أسلوبًا مختارًا لا موروثًا، وحجةً مبنيةً لجمهور بعينه.',
    entry: 'شهادة المستوى الخامس، أو بلوغ <span dir="ltr">C2</span> مثبتًا بتقييم تحديد المستوى أو بمؤهل خارجي معترف به.',
    exit: '‏70% إجمالًا ولا مهارة دون 50%، وعشرة تكاليف، وورقة تحدث في <span dir="ltr">C2</span> تتطلب دقةً تكفي لحمل ظلال المعنى في موقف مركَّب.',
    work: 'عملٌ الإنجليزية فيه هي المنتَج نفسه: المحاجّة العامة، والكتابة المنشورة، والمناصرة، وتعليم اللغة، وكل دور يحسم فيه دقيق المعنى النتيجة.',
    study: 'نهاية هذا البرنامج. لا مستوى فوقه هنا، والكلية لا تخترع واحدًا.',
    stopping: 'مؤهل <span dir="ltr">C2</span> كامل، وأعلى شهادة تمنحها الكلية. وهو نهاية المسار لا مرحلة منه، ويسجّل كشف الدرجات كامل الطريق المسلوك للوصول إليه.',
  },
};

// ── اللوحة، واحدة لكل مستوى ───────────────────────────────────────────
// نفس اللوحات المرخَّصة والمسجَّلة في assets/images/plates/CREDITS.md،
// وبالترتيب نفسه الذي يروي الصعود: أول الحروف، ثم متعلم وحده يعمل، ثم
// المحادثة، ثم القراءة الطويلة في صحبة، ثم عمق المكتبة، ثم المؤسسة
// نفسها. والنص البديل مكتوب للإطار بالعربية لا مترجمًا حرفًا بحرف عن
// الإنجليزية — فالقارئ الذي يسمع الوصف يستحق جملة كُتبت له.
const PLATE = {
  I:   { file: 'manuscript.jpg', icon: 'i-quill',
         alt: 'ورقة من مخطوط عربي مذهَّب، خطُّها مسطَّر في أسطر متساوية وزخرفةٌ مذهَّبة في الهامش.',
         caption: 'كل لغة تبدأ علاماتٍ تعلَّم أحدهم رسمها.' },
  II:  { file: 'study.jpg', icon: 'i-lectern',
         alt: 'شاب بقميص بياقة يعمل على حاسوب محمول وسمّاعتان على أذنيه، وأوراق وملفات إلى جانبه.',
         caption: 'المستوى يطلب ساعات، ويعطيك الشكل الذي تنفقها فيه.' },
  III: { file: 'seminar.jpg', icon: 'i-language',
         alt: 'طالبتان تتحاوران على حاسوب محمول في مكتبة، إحداهما بحجاب، وثالث يقرأ خلفهما.',
         caption: 'هنا يبدأ التحدث يحمل الدرجة.' },
  IV:  { file: 'reading-hall.jpg', icon: 'i-book',
         alt: 'قاعة مطالعة جامعية طويلة بسقف خشبي مزخرف، وخزائن كتب مصفوفة وطاولات قراءة تحتها.',
         caption: 'القراءة الطويلة، وفي صحبة.',
         credit: 'تصوير <a href="https://www.flickr.com/photos/35106989@N08/6780155266">robert.claypool</a>، <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>' },
  V:   { file: 'stacks.jpg', icon: 'i-columns',
         alt: 'رفوف مكتبة تتوالى في العمق، رفٌّ بعد رفٍّ من المجلدات المجلَّدة تحت ضوء متساوٍ.',
         caption: 'الاتساع والمقام: المستوى الذي تكفّ فيه الإنجليزية عن أن تكون صوتًا واحدًا.' },
  VI:  { file: 'colonnade.jpg', icon: 'i-crest',
         alt: 'رواق حجري بأعمدة في ضوء مائل، تتوالى أقواسه نحو صحن مفتوح.',
         caption: 'الوصول — إلى اللغة، وإلى المؤسسة المبنية عليها.',
         credit: 'تصوير <a href="https://www.flickr.com/photos/98115025@N00/496743569">stevecadman</a>، <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC BY-SA 2.0</a>' },
};

function plate(roman) {
  const p = PLATE[roman];
  if (!p) return '';
  return `    <figure class="plate plate--drift plate--photo reveal" style="--plate-ratio: 16 / 9">
      <div class="plate__frame tilt gold-live edge-lit edge-lit--light aurum">
        <span class="tilt__sheen" aria-hidden="true"></span>
        <img src="/assets/images/plates/${p.file}" alt="${p.alt}" loading="lazy" decoding="async">
        <span class="plate__tone" aria-hidden="true"></span>
        <span class="plate__tone plate__tone--warm" aria-hidden="true"></span>
      </div>
      <figcaption class="plate__caption">
        <svg class="icon" aria-hidden="true"><use href="#${p.icon}"/></svg>
        ${p.caption}${p.credit ? `\n        <span class="plate__credit">${p.credit}</span>` : ''}
      </figcaption>
    </figure>
`;
}

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

  const q = AR_QUALIFICATION[lv.id];
  const qualification = q ? `
<section class="section--light section-pad" id="qualification">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">مؤهل كامل</span>
      <h2>المستوى ${ord} مؤهل، لا مرحلة من مؤهل.</h2>
      <p class="lede">ستة مستويات تشكّل مسارًا واحدًا، وكل واحد منها شهادة منتهية لها شرط
        التحاقها وشرط منحها واستعمالاتها. ومن أتمّ هذا المستوى وتوقف فقد أتمّ شيئًا.</p>
    </div>
    <div class="grid grid--3">
${card('لِمَن هو', 'القارئ الذي كُتب له هذا المستوى', q.forWhom, 'i-portico')}
${card('للالتحاق', 'ما يُشترط للبدء', q.entry, 'i-key')}
${card('للمنح', 'ما يُشترط للإتمام', q.exit, 'i-seal')}
    </div>
    <h3 style="margin-top:2.6em">فيمَ تُستعمل الشهادة</h3>
    <div class="grid grid--2">
${card('في العمل', 'ما يستطيعه حاملها مهنيًا', q.work, 'i-ledger')}
${card('في الدراسة', 'أين تُقبَل أكاديميًا', q.study, 'i-mortarboard')}
    </div>
    <div class="callout">
      <span class="callout__label">إن توقفت عند المستوى ${ord}</span>
      <p>${q.stopping} وتوصي الكلية بالمسار كاملًا لمن يحتاجه غرضه، وتوصي بالتوقف لمن لا
        يحتاجه. فالجهة التي تعدّ كل خروج فشلًا تبيع مستويات لا تعلّم إنجليزية.</p>
    </div>
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
    <div class="grid grid--2">
${card('ما تكرّمه', 'لماذا توجد هذه الشهادة', AR_AWARD_PURPOSE[lv.id], 'i-laurel')}
${card('صورة الخريج', 'ما يستطيعه حاملها', AR_GRADUATE_PROFILE[lv.id], 'i-mortarboard')}
    </div>
    <div class="callout">
      <span class="callout__label">لماذا العنوان بالإنجليزية</span>
      <p>الشهادة كيان معرَّف له عنوان رسمي ولاحقة اسمية، وترجمة العنوان تُنشئ شهادةً ثانية لم
        يعرّفها أحد ولا يستطيع أحد منحها. يُنشر العنوان كما هو، ويُشرح معناه بالعربية إلى جانبه.</p>
    </div>
    <div class="callout">
      <span class="callout__label">طريقان لأخذ هذا المستوى</span>
      <p>أكثر المرشحين يلتحقون: <span dir="ltr">$3,166.67</span> للمستوى، بأربع دفعات، ومدرّس
        مسمّى وتغذية راجعة مكتوبة على كل عمل تنتجه. ومن أراد المؤهل بلا تدريس فله أن يأخذ
        المستوى نفسه مستقلًّا &mdash; الوصول إلى المستوى، والامتحان، والشهادة، تُشترى منفصلة
        &mdash; ويؤدّي الامتحان نفسه لينال الشهادة نفسها. انظر
        <a href="/ar/admissions/tuition/#routes">مساران إلى الشهادة نفسها</a>.</p>
    </div>
    <div class="callout">
      <span class="callout__label">كيف تُعدَّل هذه الشهادة</span>
      <p>كل شهادة في هذا المستوى تُوضَع وتُصحَّح وتُراجَع مرتين داخل الكلية، وفق المعايير
        المنشورة أعلاه وقبل أن يُشرَع في العمل. وهذا التعديل داخلي: فلا ممتحن خارجي معيَّن، وهو
        المنصب المستقل الذي يؤكد من الخارج أن هذا المستوى في الموضع الذي تقول
        الكلية إنه فيه. انظر <a href="/ar/about/#status">وضع الكلية المؤسسي</a>.</p>
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
      <a href="/ar/academics/#iefc" class="btn btn--outline">برنامج ${ltr('IEFC')} كاملًا</a>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="overview">
  <div class="container reveal">
    <div class="stat-row">
      <div class="stat-row__item"><b>${ltr(esc(lv.cefr))}</b><span>مستوى الإطار الأوروبي</span></div>
      <div class="stat-row__item"><b>${ltr(String(lv.modules.length))}</b><span>وحدة</span></div>
      <div class="stat-row__item"><b>${ltr(String(lv.units))}</b><span>درسًا مصمَّمًا</span></div>
      <div class="stat-row__item"><b>${ltr(String(lv.duration_months))}</b><span>شهرًا</span></div>
      <div class="stat-row__item"><b>${money(lv.price_usd_cents)}</b><span>هذا المستوى</span></div>
    </div>
    <p class="form-note">تبدأ بقسط واحد قدره <span dir="ltr">$791.67</span>، لا برسوم المستوى.
      والتقسيط هو الترتيب الافتراضي ولا رسم عليه &mdash; انظر
      <a href="/ar/admissions/tuition/#ladder">السُّلَّم</a>.</p>
${plate(lv.roman)}
    <div class="section-head">
      <span class="module-marker">نظرة عامة</span>
      <h2>ما يحتويه هذا المستوى.</h2>
    </div>
    <div class="grid grid--3">
${card('التدريس', `${ltr(String(teaching))} درسًا`, 'يسير كل درس في تسلسل كامل — تمهيد، وعرض، وتدريب موجَّه، وتدريب مستقل، وكتابة، وواجب منزلي — بتوقيت مذكور في الخطة لا متروك للقاعة.', 'i-quill')}
${card('الاستماع', `${ltr(String(listening))} مجموعات استماع`, 'مجموعة استماع مكتوبة النص في كل وحدة، مع إشارات المتحدثين وأسئلة فهم مبنية على النص نفسه لا مضافة إليه بعد إعداده.', 'i-waveform')}
${card('النطق', `${ltr(String(pron))} معامل نطق`, 'معمل نطق في كل وحدة، يستهدف الأصوات وأنماط النبر والإيقاع التي تحتاجها لغة تلك الوحدة تحديدًا.', 'i-language')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="modules">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الوحدات</span>
      <h2>الوحدات ${ltr(String(lv.modules.length))}، بترتيبها.</h2>
      <p class="lede">${moduleArc(lv)} يُنشر العنوان الإنجليزي إلى جانب العربي لأنه العنوان
        المعتمد في المناهج وفي سجل المتعلم.</p>
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
${skills.map((s) => darkCard(
    AR_SKILL[s.name].mode, AR_SKILL[s.name].name, AR_SKILL[s.name].text,
    SKILL_ICON[s.name] || 'i-language',
  )).join('\n')}
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
${card('مستمر', `${ltr(String(quizzes))} اختبارات وحدات`, 'اختبار في نهاية كل وحدة، يختبر لغة تلك الوحدة لا غيرها. يُصحَّح آليًا، مع بيان الإجابة الصحيحة وسببها.', 'i-progress')}
${card('إنتاجي', `${ltr(String(assignments))} تكليفات`, 'مهام تحدث وكتابة يصححها مدرّس وفق معيار منشور. هنا تُقيَّم المهارتان الإنتاجيتان فعلًا — فالاختبار الآلي لا يحكم على القدرة على إدارة حوار.', 'i-quill')}
${card('تقويم ذاتي', 'قبل كل تقييم', 'يحمل كل درس تقويمًا ذاتيًا فيه مواضع خطأ مقصودة تستهدف ما يخطئ فيه متعلمو هذا المستوى فعلًا، ليكتشف المتعلم الثغرة قبل أن يكتشفها المصحّح.', 'i-compass')}
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
${card('التحدث أولًا', 'الممارسة قبل الإتقان', 'التحدث الموجَّه جزء من كل درس، لا إضافة اختيارية. يتحدث المتعلم من الدرس الأول، قبل أن تجهز قواعده، لأن انتظار الدقة هو ما يُبقي الناس صامتين سنوات.', 'i-language')}
${card('منهج واحد', 'معيار مشترك لا أسلوب شخصي', 'يدرّس كل مدرّس وفق المنهج المخطط نفسه، فلا يفقد المتعلم موضعه إذا غيّر الشعبة، ويكون متعلمان في المستوى نفسه قد قطعا المسافة نفسها.', 'i-columns')}
${card('مدعوم', 'مدرّس يعرف أين يقع الخطأ', 'يعمل المدرّسون من دليل المعلّم، وهو يبيّن لكل درس ما يقع فيه الخطأ عادةً، وطريقة ثانية للشرح، وما يُفعل مع المتأخر ومع المتقدّم.', 'i-shield-check')}
${card('مقيس', 'يُعدَّل بحسب الدفعة', 'نتائج الاختبارات والتكليفات ظاهرة للمدرّس أثناء سير المستوى، فيستجيب التدريس لأداء هذه المجموعة فعلًا لا لما افترضته الخطة.', 'i-scales')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="resources">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الموارد</span>
      <h2>ما تحصل عليه.</h2>
    </div>
    <div class="grid grid--3">
${card('المنصة', 'منصة التعلّم', 'الدروس والاختبارات والمراجعات الذاتية وتتبّع التقدّم، ودرجاتك والتغذية الراجعة عليها في سجل واحد تحتفظ به أنت.', 'i-key')}
${card('معمل الاستماع', 'تدريب مسجَّل', 'يحمل معمل الاستماع المادةَ المسجَّلة للمستوى مع نصها، ويسجّل تحدثك أنت لتصلك تغذية راجعة على النطق.', 'i-waveform')}
${card('مجلدات دار النشر', 'مطبوعة ورقمية', 'يُنشر المنهج مجموعةَ مجلدات عن دار نشر الكلية &mdash; المنهج الكامل، ودليل التقييم، وللمستوى الأول كتاب تدريبات للطالب ودليل مرافق للمعلّم.', 'i-book')}
    </div>
    <div class="btn-row">
      <a href="/ar/press/" class="btn btn--outline">فهرس دار النشر</a>
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
      : 'التأسيس لا يفترض أي إنجليزية. لا اختبار دخول ولا متطلب سابق — وهو مكتوب لمتعلم يبدأ من الصفر.', 'i-passport')}
${darkCard('بعده', next ? `المستوى ${AR_ROMAN[next.roman]} — ${AR_NAME[next.id]}` : 'نهاية البرنامج',
    next
      ? `عند الإتمام ينتقل المتعلم إلى ${AR_NAME[next.id]} (${ltr(esc(next.cefr))})، وهو يفترض كل ما عُلّم هنا.`
      : `${AR_NAME[lv.id]} آخر مستويات برنامج ${ltr('IEFC')}. لا مستوى فوقه في هذا البرنامج.`, 'i-compass')}
    </div>
    ${next ? `<div class="btn-row">
      <a href="/ar/study/${SLUG[next.roman]}/" class="btn btn--gold">المستوى ${AR_ROMAN[next.roman]} — ${AR_NAME[next.id]}</a>
    </div>` : ''}
  </div>
</section>
${qualification}
${award}
<section class="section--light section-pad" id="questions">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">أسئلة</span>
      <h2>ما يُسأل عن هذا المستوى.</h2>
    </div>
    <div class="grid grid--2">
${card('المدة', `كم يستغرق المستوى ${ord}؟`, `${ltr(String(lv.duration_months))} أشهر من الدراسة بحسب التصميم، تغطي ${ltr(String(lv.units))} درسًا مصمَّمًا عبر ${ltr(String(lv.modules.length))} وحدات. ومن يحتاج وقتًا أطول لا يُعاقَب؛ المستوى عمل يُنجز لا سباق يُركض.`, 'i-clocktower')}
${card('الرسوم', 'كم تكلفة هذا المستوى؟', `تبدأ بقسط واحد قدره ${ltr('$791.67')}. ورسوم المستوى كاملة ${money(lv.price_usd_cents)}، والبرنامج كله ${ltr('$19,000')} موزّعة بالتساوي على المستويات الستة، ولا يُطلب منك ذلك دفعةً واحدة أبدًا.`, 'i-ledger')}
${card('اللغة', 'هل الدراسة بالعربية؟', 'التدريس بالإنجليزية. هذه الصفحة وصفحات القبول والرسوم والتقييم منشورة بالعربية حتى تتخذ قرارك بلغتك، ثم تدرس باللغة التي جئت لتتعلمها.', 'i-globe')}
${card('الالتزام', 'أستطيع الدراسة مع عملي؟', `نعم، وهو مصمَّم لذلك. المستوى ${ord} ${ltr(String(TQT_HOURS))} ساعة مصمَّمة عبر ${ltr(String(lv.duration_months))} أشهر — نحو ${ltr(String(weeklyHours(lv)))} ساعات أسبوعيًا، تصرفها حين تختار أن تصرفها. ولا شيء يُفتح في تاريخ محدد ولا شيء يُغلق إن ساء أسبوع.`, 'i-hourglass')}
    </div>
  </div>
</section>

${cta(`ابدأ من المستوى ${ord}.`, 'قدّم الآن', '/ar/admissions/#apply', 'الرسوم والدفع', '/ar/admissions/tuition/')}`;
}

// ── write ─────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];
const emitted = [];

levels.forEach((lv, i) => {
  const slug = `study-${SLUG[lv.roman]}-ar`;
  const file = `study-${SLUG[lv.roman]}.ar.html`;
  const output = `ar/study/${SLUG[lv.roman]}/index.html`;
  const target = path.join(ROOT, 'pages', file);
  emitted.push({ file: target, result: emitPage(target, levelPage(lv, i)) });

  const entry = {
    slug,
    output,
    title: `المستوى ${AR_ROMAN[lv.roman]}: ${AR_NAME[lv.id]} (${lv.cefr}) — الكلية العالمية للغة الإنجليزية`,
    description: `المستوى ${AR_ROMAN[lv.roman]} من برنامج IEFC: ${lv.modules.length} وحدات، و${lv.units} درسًا مصمَّمًا `
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
// The manifest entry is written for every page; the PAGE BODY is written
// only where the guard allows it. "Routed" rather than "Wrote" because
// the two are no longer the same act — see scripts/lib/emit-page.js, and
// read the guard's own summary below this list for what reached disk.
console.log(`Routed ${written.length} Arabic level pages and paired them with their English editions:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');

reportEmit('build-arabic-levels.js', emitted);
