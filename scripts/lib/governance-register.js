// ONE REGISTER, TWO LANGUAGES, ONE SET OF FACTS.
//
// docs/governance-register.md is the source of truth for who governs
// WEC. This module parses it once and renders the leadership sections
// for both /about/governance/ and /ar/about/governance/.
//
// It exists as a shared module rather than as a third generator because
// those two pages already have owners — scripts/build-about.js writes the
// English, scripts/build-arabic.js writes the Arabic — and a generator
// that spliced sections into pages another generator rewrites would be
// reverted by whichever ran last. That failure mode has already been paid
// for once in this repository, when eighty-four page mastheads were
// edited into generated files and silently undone. One owner per page;
// shared content comes in as a module.
//
// The rule this module enforces by construction: a credential that was
// not supplied renders as nothing at all, never as a plausible guess.
// Four of the five published executive officers were given to the
// College without qualifications, and a blank line under their name is
// the honest rendering of that.
//
// Fourteen people are published of the fifteen attested. The Executive's
// Director of Digital Learning was withdrawn because docs/
// faculty-register.md had already attested that post to somebody else
// two days earlier, and a directorship is a single office. The row is
// recorded under "Withdrawn" at the foot of the register rather than
// deleted, and the parser's count guard below is pinned to five so
// restoring the person is a deliberate two-line change.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REGISTER = path.join(ROOT, 'docs/governance-register.md');
const md = fs.readFileSync(REGISTER, 'utf8');

const esc = (s) => String(s ?? '')
  .replace(/\s--\s/g, ' — ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Latin names and English qualifications inside RTL prose need an
// explicit direction, or the punctuation reflows around them.
const ltr = (s) => `<span dir="ltr">${esc(s)}</span>`;

// "Not supplied" is a register value meaning the College did not give us
// one. It is never printed — the page omits the line instead.
const NOT_SUPPLIED = /^not supplied$/i;
const supplied = (v) => v && !NOT_SUPPLIED.test(v.trim());

function table(heading, stopAt) {
  const start = md.indexOf(heading);
  if (start < 0) throw new Error(`Governance register is missing the "${heading}" table`);
  const from = start + heading.length;
  const end = stopAt ? md.indexOf(stopAt, from) : -1;
  return md.slice(from, end < 0 ? md.length : end)
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    .filter((c) => !/^-+$/.test(c[0]) && c[0] !== 'Name' && c[0] !== 'Post or body (register)');
}

const governors = table('## Board of Governors', '## Academic Senate');
const senate = table('## Academic Senate', '## College Executive');
const executive = table('## College Executive', '## Independent External Examiner');
const arabicRows = table('## Arabic renderings', '\n---');

if (governors.length !== 6) throw new Error(`Expected 6 governors, parsed ${governors.length}`);
if (senate.length !== 3) throw new Error(`Expected 3 senators, parsed ${senate.length}`);
if (executive.length !== 5) {
  throw new Error(`Expected 5 executive officers, parsed ${executive.length}. The sixth — Director of\n`
    + `Digital Learning — is withdrawn pending the collision recorded in the register; restoring it\n`
    + `means changing this number back as well as adding the row.`);
}

const AR = new Map(arabicRows.map(([en, ar]) => [en, ar]));
function arabicFor(term) {
  const ar = AR.get(term);
  if (!ar) throw new Error(`No Arabic rendering in the governance register for: ${term}`);
  return ar;
}

// The Senate's published membership figure comes from the register and is
// mirrored into the database. Derived from the rows rather than written
// as a number anywhere, so the two cannot drift.
const SENATE_MEMBERS = senate.length;

// The one post the College cannot fill from inside itself. Held here as
// data rather than as prose so that filling it is a register edit and
// every page that depends on it follows.
const EXTERNAL_EXAMINER_VACANT = /^\*\*Vacant\.\*\*/m.test(
  md.slice(md.indexOf('## Independent External Examiner')));

// ── English ───────────────────────────────────────────────────────────

const enCard = ([name, post, background, duties]) => `      <div class="card">
        <span class="card__num">${esc(post)}</span>
        <h3>${esc(name)}</h3>
${supplied(background) ? `        <p class="faculty__creds">${esc(background)}</p>\n` : ''}        <p>${esc(duties)}</p>
      </div>`;

/**
 * `extras` lets the page that hosts the roster extend a body's section
 * with its remit — added for the Governance pillar, where the absorbed
 * Academic Senate page becomes part of the roster's own #senate section
 * rather than a second section with a near-identical name. Keys:
 * `senate`, `board`, `executive`; each is HTML appended inside that
 * section's container, after the roster. Absent keys change nothing, so
 * every existing caller renders byte-identically.
 */
function leadershipEN(extras = {}) {
  return `<section class="section--paper section-pad" id="leadership">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Leadership</span>
      <h2>Leadership in service of scholarship.</h2>
      <p class="lede">The College is governed through a framework that separates academic
        judgement, institutional governance, quality assurance, finance and day-to-day
        administration. That separation is not administrative tidiness. It is what protects
        every learner, every assessment, every publication and every award the College issues.</p>
    </div>
    <div class="callout">
      <span class="callout__label">The constraint that matters</span>
      <p>No individual, including the Founder, may independently determine academic standards,
        approve their own work, or override established governance procedure. The College is
        built to outlast the people currently running it.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="board">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Board of Governors</span>
      <h2>Strategic oversight, held apart from management.</h2>
      <p class="lede">The Board preserves the College&rsquo;s mission, safeguards its academic
        independence, oversees financial sustainability, and appoints senior officers. Its test
        for any decision is the long-term interest of learners rather than short-term
        convenience.</p>
    </div>
    <div class="grid grid--2">
${governors.map(enCard).join('\n')}
    </div>
${extras.board || ''}
  </div>
</section>

<section class="section--dark section-pad" id="senate">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Academic Senate</span>
      <h2>The College&rsquo;s highest academic authority.</h2>
      <p class="lede">The Senate oversees academic standards, curriculum development, assessment
        integrity, research quality and academic regulations. It operates independently of
        operational management and advises the Board on academic matters.</p>
    </div>
    <div class="grid grid--3">
${senate.map(([name, post, background, expertise]) => `      <div class="card card--dark">
        <span class="card__num">${esc(post)}</span>
        <h3>${esc(name)}</h3>
${supplied(background) ? `        <p class="faculty__creds">${esc(background)}</p>\n` : ''}        <p>${esc(expertise)}</p>
      </div>`).join('\n')}
    </div>
    <p class="form-note"><b>Constituted is not the same as convened.</b> The Senate has
      ${SENATE_MEMBERS} appointed members and has not yet met. Until a minuted decision exists,
      the skill mappings and descriptor thresholds it will approve remain recorded as
      <b>interim</b>. A membership list is not an approval, and this site will not let one stand
      in for the other.</p>
${extras.senate || ''}
  </div>
</section>

<section class="section--light section-pad" id="executive">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">College Executive</span>
      <h2>Daily operation, under policy set by the Board.</h2>
      <p class="lede">The Executive runs the College. It does not set the standards it operates
        under, and it does not review its own work &mdash; those sit with the Senate and with
        the External Examiner respectively.</p>
    </div>
    <div class="grid grid--2">
${executive.map(enCard).join('\n')}
    </div>
${extras.executive || ''}
  </div>
</section>

<section class="section--paper section-pad" id="examiner">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Independent External Examiner</span>
      <h2>The post that cannot be filled from inside.</h2>
    </div>
    <p class="lede">The External Examiner reviews assessments, academic standards, marking
      consistency and the integrity of awards, and reports directly to the Board of Governors
      rather than through the Executive. The whole function of the post is to sit outside the
      College, which is why no appointment made within it can substitute.</p>
    <div class="callout">
      <span class="callout__label">Currently vacant</span>
      <p>The post is not filled. Until it is, awards are defined and published but
        <b>cannot properly be conferred on anyone</b>, and the College says so on every page
        where it bears on a decision rather than once in a footnote.</p>
    </div>
  </div>
</section>`;
}

function principlesEN() {
  const P = [
    ['Academic Integrity', 'Scholarship before convenience.'],
    ['Independent Review', 'No person approves their own work.'],
    ['Transparency', 'Policies, standards and decisions are documented.'],
    ['Accountability', 'Authority carries measurable responsibility.'],
    ['Service', 'Leadership exists to support learning.'],
    ['Stewardship', 'The College is built for future generations, not present personalities.'],
  ];
  return `<section class="section--dark section-pad" id="principles">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Governance Principles</span>
      <h2>Six principles, and every decision is held to them.</h2>
    </div>
    <ol class="dot-list">
${P.map(([t, b], i) => `      <li><span class="num">${i + 1}</span>
        <div><h3>${esc(t)}</h3><p>${esc(b)}</p></div></li>`).join('\n')}
    </ol>
  </div>
</section>`;
}

// ── Arabic ────────────────────────────────────────────────────────────
// Names stay in Latin script and qualifications stay in English, per the
// rule set for /faculty/: translating a degree title risks naming a
// qualification the holder does not have.

// A credential stays in English; PROSE does not. One register row —
// the account owner's — carries a sentence rather than a list of
// degrees, and shipping "No qualification claimed. Areas of interest:"
// untranslated on the Arabic page is an English paragraph sitting in an
// Arabic card. Keyed by post so a second such row fails loudly here
// rather than leaking quietly onto the page.
const AR_BACKGROUND = {
  'Member, Board of Governors':
    'لا يُدَّعى أي مؤهل. مجالات الاهتمام: تصميم مناهج اللغة الإنجليزية، والنشر التعليمي، '
    + 'وأنظمة التعلّم الرقمي، وتعليم الإنجليزية دوليًا.',
};
// Anything that is a list of degrees rather than a sentence. Degrees
// stay in Latin script by the rule set for /faculty/.
const looksLikeCredentials = (v) => !/[.]\s/.test(String(v).replace(/\b(Ph|Ed|M|B)\.\s?/g, ''));

const arBackground = (post, background) => {
  if (!supplied(background)) return null;
  if (AR_BACKGROUND[post]) return esc(AR_BACKGROUND[post]);
  if (!looksLikeCredentials(background)) {
    throw new Error(`Governance register: the background for "${post}" reads as prose rather than `
      + `a credential list, so it cannot be published untranslated on the Arabic page. Add an `
      + `Arabic rendering to AR_BACKGROUND in scripts/lib/governance-register.js.`);
  }
  return ltr(background);
};

const arCard = ([name, post, background, duties], dark = false) => {
  const bg = arBackground(post, background);
  return `      <div class="card${dark ? ' card--dark' : ''}">
        <span class="card__num">${esc(arabicFor(post))}</span>
        <h3>${ltr(name)}</h3>
${bg ? `        <p class="faculty__creds">${bg}</p>\n` : ''}        <p>${esc(duties)}</p>
      </div>`;
};

// The responsibilities are re-authored in Arabic rather than machine-
// rendered from the English, keyed by post so a register edit that adds
// a person fails loudly here instead of publishing an English sentence
// on an Arabic page.
const AR_DUTIES = {
  'Chair of the Board of Governors': 'القيادة الاستراتيجية، والحوكمة المؤسسية، وتعيين كبار المسؤولين، والتخطيط بعيد المدى.',
  'Independent Governor': 'الاستقلال الأكاديمي، والإشراف على المناهج، والمشورة الأكاديمية الخارجية، وضمان الجودة.',
  'Governor for Academic Affairs': 'السياسة الأكاديمية، ومعايير البرامج، وجودة المناهج، ومخرجات التعلّم.',
  'Governor for Finance and Audit': 'الإشراف المالي، وإدارة المخاطر، والإشراف على المراجعة، وحوكمة الميزانية.',
  'Governor for Ethics and Institutional Values': 'الأخلاقيات المؤسسية، والتوافق مع الهوية الإيمانية، وإطار القيم، ورعاية الطلاب.',
  'Member, Board of Governors': 'الحوكمة الأكاديمية، ومراجعة المناهج، والتخطيط التعليمي الاستراتيجي، والتطوير المؤسسي.',
  'Dean of Academic Affairs': 'اكتساب اللغة، والتقويم، وتصميم المناهج.',
  'Professor of English Language Education': 'تعليم اللغة بالطريقة التواصلية.',
  'Professor of Applied Linguistics': 'لسانيات المدوّنات، وتطوير المناهج.',
  President: 'القيادة المؤسسية، والشراكات الاستراتيجية، والإدارة التنفيذية، والتطوير الدولي، وتنفيذ سياسات مجلس الأمناء.',
  Provost: 'العمليات الأكاديمية، وقيادة هيئة التدريس، وتعزيز الجودة، والتخطيط الأكاديمي الاستراتيجي.',
  Registrar: 'سجلات الطلاب، واللوائح الأكاديمية، والتخرّج، والوثائق المؤسسية، والتصديق الرسمي.',
  'Director of Quality Assurance': 'المراجعة الأكاديمية، والتدقيق المؤسسي، والامتثال للسياسات، والتحسين المستمر، وتقييم البرامج.',
  'Director of Digital Learning': 'الحرم الرقمي، وتقنيات التعلّم، والابتكار التعليمي، والتقديم الإلكتروني، ومنصات الطلاب.',
  'Director of Student Success': 'رفاه الطلاب، والدعم الأكاديمي، والإرشاد التعليمي، ومشاركة الطلاب، وتقدّم الخريجين.',
};
const arDuties = (post) => {
  const d = AR_DUTIES[post];
  if (!d) throw new Error(`No Arabic responsibilities in governance-register.js for post: ${post}`);
  return d;
};
const arRow = (row, dark = false) => arCard([row[0], row[1], row[2], arDuties(row[1])], dark);

function leadershipAR() {
  return `<section class="section--paper section-pad" id="leadership">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">القيادة</span>
      <h2>قيادة في خدمة العلم.</h2>
      <p class="lede">تُحكَم الكلية بإطار يفصل بين الحكم الأكاديمي، والحوكمة المؤسسية، وضمان
        الجودة، والشؤون المالية، والإدارة اليومية. وهذا الفصل ليس ترتيبًا إداريًا، بل هو ما
        يحمي كل متعلم، وكل تقييم، وكل منشور، وكل شهادة تصدرها الكلية.</p>
    </div>
    <div class="callout">
      <span class="callout__label">القيد الذي يهم</span>
      <p>لا يجوز لأي فرد، بمن في ذلك المؤسِّس، أن ينفرد بتحديد المعايير الأكاديمية، أو أن
        يعتمد عمله بنفسه، أو أن يتجاوز إجراءات الحوكمة المقررة. الكلية مبنية لتبقى بعد من
        يديرونها اليوم.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="board">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">${esc(arabicFor('Board of Governors'))}</span>
      <h2>إشراف استراتيجي، منفصل عن الإدارة.</h2>
      <p class="lede">يحفظ المجلس رسالة الكلية، ويصون استقلالها الأكاديمي، ويشرف على استدامتها
        المالية، ويعيّن كبار المسؤولين. ومعياره في كل قرار هو مصلحة المتعلمين على المدى
        البعيد لا الملاءمة العاجلة.</p>
    </div>
    <div class="grid grid--2">
${governors.map((r) => arRow(r)).join('\n')}
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="senate">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">${esc(arabicFor('Academic Senate'))}</span>
      <h2>أعلى سلطة أكاديمية في الكلية.</h2>
      <p class="lede">يشرف المجلس على المعايير الأكاديمية، وتطوير المناهج، ونزاهة التقييم، وجودة
        البحث، واللوائح الأكاديمية. ويعمل مستقلًا عن الإدارة التشغيلية، ويقدّم المشورة لمجلس
        الأمناء في الشؤون الأكاديمية.</p>
    </div>
    <div class="grid grid--3">
${senate.map((r) => arRow(r, true)).join('\n')}
    </div>
    <p class="form-note"><b>التشكيل غير الانعقاد.</b> للمجلس ${ltr(String(SENATE_MEMBERS))} أعضاء
      معيَّنون، ولم ينعقد بعد. وإلى أن يوجد قرار مُثبَت في محضر، تبقى روابط المهارات وعتبات
      الوصف التي سيقرّها مسجَّلة <b>مؤقتة</b>. قائمة الأعضاء ليست اعتمادًا، وهذا الموقع لا
      يجعل إحداهما تنوب عن الأخرى.</p>
  </div>
</section>

<section class="section--light section-pad" id="executive">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">${esc(arabicFor('College Executive'))}</span>
      <h2>التشغيل اليومي، وفق سياسات يقرّها مجلس الأمناء.</h2>
      <p class="lede">تدير الإدارة التنفيذية الكلية. وهي لا تضع المعايير التي تعمل بموجبها، ولا
        تراجع عملها بنفسها &mdash; فالأولى للمجلس الأكاديمي، والثانية للممتحن الخارجي.</p>
    </div>
    <div class="grid grid--2">
${executive.map((r) => arRow(r)).join('\n')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="examiner">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">${esc(arabicFor('Independent External Examiner'))}</span>
      <h2>المنصب الذي لا يُشغَل من الداخل.</h2>
    </div>
    <p class="lede">يراجع الممتحن الخارجي التقييمات والمعايير الأكاديمية واتساق التصحيح وسلامة
      الشهادات، ويرفع تقاريره مباشرة إلى مجلس الأمناء لا عبر الإدارة التنفيذية. ووظيفة المنصب
      كلها أن يكون خارج الكلية، ولذلك لا يغني عنه أي تعيين من داخلها.</p>
    <div class="callout">
      <span class="callout__label">شاغر حاليًا</span>
      <p>المنصب غير مشغول. وإلى أن يُشغَل تبقى الشهادات معرَّفة ومنشورة و<b>لا يمكن منحها لأحد
        على وجه صحيح</b>، والكلية تذكر ذلك في كل صفحة يؤثر فيها على قرارك، لا مرة واحدة في
        هامش.</p>
    </div>
  </div>
</section>`;
}

function principlesAR() {
  const P = [
    ['النزاهة الأكاديمية', 'العلم قبل الملاءمة.'],
    ['المراجعة المستقلة', 'لا أحد يعتمد عمله بنفسه.'],
    ['الشفافية', 'السياسات والمعايير والقرارات موثَّقة.'],
    ['المساءلة', 'الصلاحية تحمل مسؤولية قابلة للقياس.'],
    ['الخدمة', 'القيادة موجودة لدعم التعلّم.'],
    ['الوصاية', 'الكلية مبنية للأجيال القادمة لا للأشخاص الحاضرين.'],
  ];
  return `<section class="section--dark section-pad" id="principles">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">مبادئ الحوكمة</span>
      <h2>ستة مبادئ، وكل قرار يُقاس بها.</h2>
    </div>
    <ol class="dot-list">
${P.map(([t, b], i) => `      <li><span class="num">${ltr(String(i + 1))}</span>
        <div><h3>${esc(t)}</h3><p>${esc(b)}</p></div></li>`).join('\n')}
    </ol>
  </div>
</section>`;
}

module.exports = {
  governors, senate, executive, arabicFor,
  SENATE_MEMBERS, EXTERNAL_EXAMINER_VACANT,
  leadershipEN, principlesEN, leadershipAR, principlesAR,
};
