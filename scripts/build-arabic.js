#!/usr/bin/env node
/**
 * THE ARABIC EDITIONS — the generated Arabic pillars and their
 * satellite pages (admissions, tuition, the FAQ, academics, governance,
 * students and its assessment/awards pages, privacy). The hand-authored
 * Arabic pages (home, about, faculty, contact, the portal) live in
 * pages/*.ar.html directly, and the level pages in
 * scripts/build-arabic-levels.js.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THESE AND NOT ALL OF THEM
 * ────────────────────────────────────────────────────────────────────
 * The site is published in English and Arabic. Fifty-four pages were
 * written in one stretch and every one of them was English-only, which
 * meant an Arabic-reading applicant could see the fee but not the
 * refund position, the programme but not the placement, the College's
 * name but not the sentence saying it holds no accreditation.
 *
 * Translating all fifty-four at once, unreviewed, would produce fifty-
 * four pages nobody had checked in a language the College cannot yet
 * have reviewed — the same failure as publishing an unreviewed volume,
 * with a larger audience. So this file authors the thirteen pages where
 * an Arabic reader is making a decision that costs them money or time:
 * how to apply, what is required, how payment actually works, what the
 * College will and will not do about visas, when they can start, the
 * uncomfortable answers, what they would study, how they would be
 * assessed, what can and cannot be conferred, how quality is held, and
 * what is done with their data — plus, added after the first twelve,
 * who decides any of it and on whose authority (see the note at page
 * thirteen for why that one was not obvious).
 *
 * The remaining pages stay English-only and every Arabic page says so
 * where it links to one, rather than presenting a dead end or an
 * unmarked switch of language.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS NOT TRANSLATED, DELIBERATELY
 * ────────────────────────────────────────────────────────────────────
 * Personal names stay in Latin script and qualifications stay in
 * English, following the rule already set for /faculty/: rendering a
 * degree title into Arabic risks stating a qualification the holder
 * does not have. Prices, CEFR codes and the programme's initials are
 * wrapped in dir="ltr" so they render correctly inside right-to-left
 * text rather than being reordered by the browser.
 *
 * These are editions, not translations. Each was written in Arabic
 * against the same facts, and where an English sentence relied on an
 * English idiom the Arabic says the thing plainly instead.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const GOV = require('./lib/governance-register');

const ROOT = path.resolve(__dirname, '..');

// The Arabic house style — the level names, the (EN) crossing marker,
// the card/hero/cta primitives and the two standing notices — lives in
// scripts/lib/arabic-kit.js rather than here. scripts/build-arabic-levels.js
// publishes in the same voice and needs the same vocabulary, and a
// second copy of it is how a College ends up with two Arabic names for
// Level III and no way to say which is right.
const {
  AR_LEVEL, ltr, EN, esc, card, darkCard, hero, cta, enOnly, noAccreditation,
} = require('./lib/arabic-kit');

function read() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  const all = (s) => db.prepare(s).all();
  const cfg = Object.fromEntries(all('SELECT key, value FROM platform_config').map((r) => [r.key, r.value]));
  const out = {
    levels: all('SELECT * FROM programme_levels ORDER BY id'),
    awards: all('SELECT * FROM award_definitions ORDER BY level_id'),
    skills: all('SELECT * FROM language_skills ORDER BY sequence'),
    active: all('SELECT code FROM currencies WHERE is_active = 1').map((r) => r.code),
    cfg,
  };
  db.close();
  return out;
}
const D = read();
if (D.levels.length !== 6) throw new Error(`Expected six levels, read ${D.levels.length}`);
if (D.active.join(',') !== 'USD') {
  throw new Error(`The Arabic payment page is written around USD being the only settled currency; `
    + `the record now says ${D.active.join(', ') || 'none'}.`);
}
const PASS_PCT = Math.round(Number(JSON.parse(D.cfg.lms_pass_threshold ?? '0.7')) * 100);
const INSTALMENTS = Number(JSON.parse(D.cfg.instalment_default_count ?? '4'));

// The kit's AR_LEVEL must cover whatever the record actually holds.
for (const l of D.levels) if (!AR_LEVEL[l.id]) throw new Error(`No Arabic name for level ${l.id}`);

// The Focus column of the retired /ar/academics/iefc/ table — the six
// one-line level descriptions. They survived nowhere else in Arabic
// once that page retired, so the pillar table carries them now, as the
// English pillar's Focus column does.
const AR_FOCUS = {
  I: 'من الكلمات الأولى إلى تبادلات يومية بسيطة — النظام الصوتي، القواعد الأساسية، مفردات البقاء.',
  II: 'مواضيع يومية بثقة متزايدة — محادثة روتينية، وتواصل كتابي بسيط.',
  III: 'استخدام مستقل للغة الإنجليزية — كلام مترابط، وآراء، وكتابة منظّمة.',
  IV: 'تفاعل طليق وتلقائي — سجل أكاديمي ومهني، حجاج وتحليل.',
  V: 'استخدام دقيق ومرن للغة لأغراض أكاديمية ومهنية معقّدة.',
  VI: 'إتقان يقارب مستوى الناطقين الأصليين — الدقة، التعابير، التواصل القيادي والحضور التنفيذي.',
};


const FULL = ltr('$19,000');
const PER_LEVEL = ltr('$3,166.67');

const PAGES = {};

// 8 · الدراسة ─────────────────────────────────────────────────────────
PAGES.admissions = {
  slug: 'admissions-ar', output: 'ar/admissions/index.html', file: 'admissions.ar.html',
  contents: true,
  altHref: '/admissions/',
  title: 'القبول — الكلية العالمية للغة الإنجليزية',
  description: 'قرار الالتحاق كاملًا في صفحة واحدة: هل تنطبق الشروط عليك، وكيف تقدّم، ومتى تبدأ، وما يخص المتقدمين الدوليين والتأشيرات.',
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">القبول</span>
    <h1>كيفية الالتحاق ببرنامج الطلاقة الدولي في اللغة الإنجليزية.</h1>
    <p class="lede">رحلة واضحة من خمس خطوات، من الاستفسار الأول إلى وحدتك الدراسية الأولى — مصممة لتلاميذ المدارس وطلاب الجامعات والمهنيين العاملين والمتقدمين الدوليين على حد سواء.</p>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">لمن صُممت الكلية</span>
      <h2>مبنية لمتعلّمين طموحين، في كل مرحلة.</h2>
    </div>
    <div class="tag-row">
      <span class="tag">تلاميذ المدارس</span><span class="tag">طلاب المرحلة الثانوية</span>
      <span class="tag">طلاب الجامعات</span><span class="tag">المهنيون العاملون</span>
      <span class="tag">موظفو القطاع الحكومي</span><span class="tag">قادة الأعمال</span>
      <span class="tag">الطلاب الدوليون</span><span class="tag">المتقدّمون للدراسة بالخارج</span>
      <span class="tag">الباحثون عن كفاءة لغوية متقدّمة</span>
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="self-assessment">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الخطوة الأولى · اعرف نقطة انطلاقك</span>
      <h2>أي عبارة تصف مستواك اليوم؟</h2>
      <p class="lede">تقييم ذاتي مدته 30 ثانية لمساعدتك على التقديم — وليس الاختبار الرسمي لتحديد المستوى، الذي يتم في الخطوة الثالثة.</p>
    </div>
    <form class="level-quiz" data-level-quiz
      data-result-template="بناءً على إجابتك، نقترح أن تبدأ من المستوى {roman} — {name} ({cefr})."
      data-levels='[
        {"roman":"الأول","name":"برنامج التأسيس","cefr":"A1"},
        {"roman":"الثاني","name":"البرنامج الابتدائي","cefr":"A2"},
        {"roman":"الثالث","name":"البرنامج المتوسط","cefr":"B1"},
        {"roman":"الرابع","name":"المتوسط المتقدم","cefr":"B2"},
        {"roman":"الخامس","name":"البرنامج المتقدم","cefr":"C1"},
        {"roman":"السادس","name":"برنامج الإتقان","cefr":"C2"}
      ]'>
      <fieldset>
        <legend class="sr-only">أي عبارة تصف مستواك اليوم؟</legend>
        <div class="level-quiz__options">
          <label class="level-quiz__option"><input type="radio" name="level-quiz" value="0"><span>أستطيع فهم واستخدام عبارات يومية بسيطة والتعريف بنفسي، لكنني أحتاج مساعدة في معظم المحادثات.</span></label>
          <label class="level-quiz__option"><input type="radio" name="level-quiz" value="1"><span>أستطيع التحدث عن مواضيع مألوفة مثل عائلتي ومدرستي وروتيني اليومي بجمل بسيطة.</span></label>
          <label class="level-quiz__option"><input type="radio" name="level-quiz" value="2"><span>أستطيع التعامل مع معظم المواقف اليومية، ووصف تجاربي، وإعطاء أسباب بسيطة لآرائي.</span></label>
          <label class="level-quiz__option"><input type="radio" name="level-quiz" value="3"><span>أستطيع مناقشة مجموعة واسعة من المواضيع بطلاقة، ومتابعة الأفكار الرئيسية للنصوص المعقّدة، والتفاعل بشكل طبيعي مع الناطقين الأصليين.</span></label>
          <label class="level-quiz__option"><input type="radio" name="level-quiz" value="4"><span>أستطيع التعبير عن نفسي بطلاقة وعفوية حول مواضيع معقّدة، واستخدام الإنجليزية بمرونة لأغراض أكاديمية أو مهنية.</span></label>
          <label class="level-quiz__option"><input type="radio" name="level-quiz" value="5"><span>أستطيع فهم كل ما أقرأه أو أسمعه تقريبًا، وتلخيص معلومات من مصادر مختلفة، والتعبير عن نفسي بدقة في أي موقف.</span></label>
        </div>
      </fieldset>
      <button type="submit" class="btn btn--gold">اعرف مستواك المقترح للبدء</button>
      <div class="level-quiz__result" data-level-quiz-result hidden>
        <span class="callout__label" style="color:var(--gold-bright)">نقطة الانطلاق المقترحة</span>
        <p data-level-quiz-text></p>
        <div class="btn-row">
          <a href="/ar/academics/#iefc" class="btn btn--ghost">اطّلع على هذا المستوى في برنامج IEFC</a>
          <a href="#apply" class="btn btn--gold">ابدأ طلبك الآن</a>
        </div>
      </div>
      <p class="form-note">هذا تقدير ذاتي إرشادي لمساعدتك على التقديم بثقة — يتم تأكيد مستواك الفعلي عبر تقييم تحديد المستوى في الخطوة الثالثة.</p>
    </form>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">رحلة التقديم</span>
      <h2>خمس خطوات نحو الالتحاق.</h2>
    </div>
    <ol class="dot-list">
      <li><span class="num">01</span><span><strong>استفسر واختر نقطة انطلاقك</strong> — أخبرنا بمستواك الحالي في اللغة الإنجليزية وأهدافك.</span><span class="leader"></span></li>
      <li><span class="num">02</span><span><strong>قدّم طلبك</strong> — النموذج أدناه. لا يُطلب منك شيء آخر في هذه المرحلة: لا مستندات ولا رسوم.</span><span class="leader"></span></li>
      <li><span class="num">03</span><span><strong>تقييم تحديد المستوى</strong> — تقييم قصير يحدّد المستوى الصحيح لانطلاقك، من التأسيس إلى المتقدّم.</span><span class="leader"></span></li>
      <li><span class="num">04</span><span><strong>العرض والتسجيل</strong> — استلم عرض القبول، أكّد خطة الدفع، وثبّت مقعدك.</span><span class="leader"></span></li>
      <li><span class="num">05</span><span><strong>التوجيه والوحدة الأولى</strong> — تهيئة على الحرم الرقمي، ثم يُفتح المستوى الأول وتبدأ وحدتك الأولى.</span><span class="leader"></span></li>
    </ol>
  </div>
</section>

<section class="section--dark section-pad" id="apply">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">ابدأ طلبك الآن</span>
      <h2>الخطوة الثانية: قدّم طلبك.</h2>
      <p class="lede">يتصل هذا النموذج مباشرة بفريق القبول والتسجيل. إذا تعذّر الوصول إلى نظام التقديم الإلكتروني للحظات، ستفتح بياناتك في تطبيق البريد الإلكتروني بدلًا من ذلك — في الحالتين، لن تفقد ما أدخلته.</p>
    </div>

    <form class="form-grid" data-admissions-form
      data-endpoint="/api/admissions/apply"
      data-fallback-email="info@worldwencollege.co.uk"
      data-storage-key="wec-lc-admissions-draft-ar"
      data-loading-text="جارٍ الإرسال…"
      data-error-text="يرجى تصحيح الحقول المظلّلة أدناه."
      data-success-text="تم استلام طلبك — سنتواصل معك قريبًا."
      data-fallback-text="تعذّر الوصول إلى نظام التقديم الإلكتروني، لذا فتحنا تطبيق البريد الإلكتروني ببياناتك جاهزة للإرسال — يرجى الضغط على إرسال لإكمال طلبك."
      data-retry-label="أعد المحاولة عبر النموذج الإلكتروني"
      data-level-summary-template="المستوى المقترح للبدء: {text}"
      novalidate dir="rtl">

      <div class="field field--full"><div class="form-status" data-form-status role="status" aria-live="polite"></div></div>

      <div class="field field--full" data-level-summary hidden style="background:rgba(199,162,74,.08);border:1px solid var(--line-dark);border-radius:6px;padding:12px 16px;">
        <span style="font-size:.82rem;color:var(--gold-bright)" data-level-summary-text></span>
        <a href="#self-assessment" style="font-size:.78rem;text-decoration:underline;margin-right:.8em;color:rgba(247,244,236,.7)">أعد التقييم الذاتي</a>
      </div>

      <div class="field">
        <label for="app-name">الاسم الكامل</label>
        <input id="app-name" name="fullName" type="text" required aria-describedby="app-name-error">
        <span class="field__error" id="app-name-error" role="alert">الرجاء إدخال اسمك الكامل.</span>
      </div>
      <div class="field">
        <label for="app-email">البريد الإلكتروني</label>
        <input id="app-email" name="email" type="email" required dir="ltr" aria-describedby="app-email-error">
        <span class="field__error" id="app-email-error" role="alert">الرجاء إدخال بريد إلكتروني صحيح.</span>
      </div>
      <div class="field field--full">
        <label for="app-country">بلد الإقامة</label>
        <select id="app-country" name="country" required aria-describedby="app-country-error">
          <option value="">اختر بلدك</option>
          <option value="AF">أفغانستان</option><option value="DZ">الجزائر</option><option value="AR">الأرجنتين</option>
          <option value="AU">أستراليا</option><option value="AT">النمسا</option><option value="BH">البحرين</option>
          <option value="BD">بنغلاديش</option><option value="BE">بلجيكا</option><option value="BR">البرازيل</option>
          <option value="CM">الكاميرون</option><option value="CA">كندا</option><option value="TD">تشاد</option>
          <option value="CL">تشيلي</option><option value="CN">الصين</option><option value="CO">كولومبيا</option>
          <option value="CD">جمهورية الكونغو الديمقراطية</option><option value="EG">مصر</option><option value="ET">إثيوبيا</option>
          <option value="FR">فرنسا</option><option value="GM">غامبيا</option><option value="DE">ألمانيا</option>
          <option value="GH">غانا</option><option value="GR">اليونان</option><option value="GN">غينيا</option>
          <option value="IN">الهند</option><option value="ID">إندونيسيا</option><option value="IQ">العراق</option>
          <option value="IE">أيرلندا</option><option value="IT">إيطاليا</option><option value="CI">ساحل العاج</option>
          <option value="JP">اليابان</option><option value="JO">الأردن</option><option value="KE">كينيا</option>
          <option value="KW">الكويت</option><option value="LB">لبنان</option><option value="LR">ليبيريا</option>
          <option value="LY">ليبيا</option><option value="MY">ماليزيا</option><option value="ML">مالي</option>
          <option value="MX">المكسيك</option><option value="MA">المغرب</option><option value="NL">هولندا</option>
          <option value="NZ">نيوزيلندا</option><option value="NE">النيجر</option><option value="NG">نيجيريا</option>
          <option value="OM">عُمان</option><option value="PK">باكستان</option><option value="PH">الفلبين</option>
          <option value="PL">بولندا</option><option value="PT">البرتغال</option><option value="QA">قطر</option>
          <option value="RU">روسيا</option><option value="RW">رواندا</option><option value="SA">المملكة العربية السعودية</option>
          <option value="SN">السنغال</option><option value="SL">سيراليون</option><option value="SG">سنغافورة</option>
          <option value="SO">الصومال</option><option value="ZA">جنوب أفريقيا</option><option value="KR">كوريا الجنوبية</option>
          <option value="ES">إسبانيا</option><option value="LK">سريلانكا</option><option value="SD">السودان</option>
          <option value="SE">السويد</option><option value="CH">سويسرا</option><option value="SY">سوريا</option>
          <option value="TZ">تنزانيا</option><option value="TH">تايلاند</option><option value="TG">توغو</option>
          <option value="TN">تونس</option><option value="TR">تركيا</option><option value="UG">أوغندا</option>
          <option value="UA">أوكرانيا</option><option value="AE">الإمارات العربية المتحدة</option>
          <option value="GB">المملكة المتحدة</option><option value="US">الولايات المتحدة الأمريكية</option>
          <option value="VN">فيتنام</option><option value="YE">اليمن</option><option value="ZM">زامبيا</option>
          <option value="ZW">زيمبابوي</option><option value="OTHER">أخرى</option>
        </select>
        <span class="field__error" id="app-country-error" role="alert">الرجاء اختيار بلدك.</span>
      </div>

      <div class="field field--full">
        <button type="submit" class="btn btn--gold" data-submit-btn><span data-btn-label>إرسال الطلب</span></button>
        <p class="form-note">تفضّل البريد الإلكتروني؟ <a href="mailto:info@worldwencollege.co.uk?subject=IEFC%20Application%20Enquiry" style="color:var(--gold-bright);text-decoration:underline">راسل فريق القبول والتسجيل مباشرة</a>.</p>
      </div>
    </form>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الرحلة</span>
      <h2>خمس مراحل، وما هي كل واحدة منها حقًا.</h2>
      <p class="lede">يمر سجل الطلب بحالات محددة، والحالة التي يقف عندها هي الجواب الصادق على
        سؤال «أين وصل طلبي؟».</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المرحلة</th><th>ما يحدث</th><th>من ينفذها</th></tr></thead>
        <tbody>
          <tr><td><strong>١ · قدّر مستواك</strong></td>
              <td>سؤال واحد على صفحة القبول يقترح مستوى بداية. ليس قرار تحديد المستوى، ولا يُلزم أحدًا، بمن فيهم أنت.</td>
              <td>أنت، في نحو ثلاثين ثانية</td></tr>
          <tr><td><strong>٢ · أرسل النموذج</strong></td>
              <td>الاسم والبريد الإلكتروني وبلد الإقامة، مع المستوى الذي قدّرته إن أجريت التقدير. لا مستندات ولا رسوم في هذه المرحلة.</td>
              <td>أنت. يُنشأ السجل فورًا ويصلك تأكيد بالبريد.</td></tr>
          <tr><td><strong>٣ · تحديد المستوى</strong></td>
              <td>محادثة وتقييم قصير لتأكيد أي المستويات الستة تدخل. لا يوجد اختبار آلي لتحديد المستوى على هذا الموقع؛ يرتب ذلك معك أحد أعضاء الفريق المؤسس بالبريد الإلكتروني.</td>
              <td>شخص، لا منصة</td></tr>
          <tr><td><strong>٤ · العرض</strong></td>
              <td>عرض مكتوب يحدد مستوى الالتحاق المؤكد، ورسومه، وخيارات السداد المتاحة لك.</td>
              <td>إدارة القبول</td></tr>
          <tr><td><strong>٥ · التسجيل</strong></td>
              <td>يُؤكَّد السداد، ويُنشأ حسابك، ويبدأ تسجيلك في ذلك المستوى. درسك الأول متاح في اليوم نفسه.</td>
              <td>أنت والمنصة معًا</td></tr>
        </tbody>
      </table>
    </div>
    <p class="form-note">قد ينتهي الطلب أيضًا بالانسحاب أو بالرفض. تحتفظ الكلية بالحالتين في
      السجل ولا تحذفهما، حتى يمكن الرجوع إلى القرار ومن اتخذه.</p>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المدة</span>
      <h2>كم تستغرق كل مرحلة، بصدق.</h2>
      <p class="lede">لم تعالج الكلية طلبات بأعداد كبيرة بعد، فهذه التزامات لا متوسطات مقيسة،
        وتُوصف على هذا الأساس.</p>
    </div>
    <div class="grid grid--3">
${card('فوري', 'الإرسال', 'يُنشأ السجل ويُرسل بريد التأكيد وأنت ما زلت على الصفحة. وإن تعذّر الوصول إلى النموذج، يسلّم بياناتك إلى تطبيق البريد لديك، فلا يضيع شيء.')}
${card('التزام', 'التواصل خلال ثلاثة أيام عمل', 'التزام تقطعه الكلية، لا متوسط قاسته. إن لم يُوفَ به فاكتب إلى إدارة القبول وقل ذلك — فالتزام معلن لا يُطالَب به أسوأ من عدمه.')}
${card('بإيقاعك', 'من العرض إلى التسجيل', 'لا تنتهي صلاحية العرض بجدول زمني، لأنه لا توجد دفعة يجب ملؤها. خذ ما تحتاجه من الوقت؛ لا شيء يضيع بالانتظار ولا شيء يُكسب بالعجلة.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">متابعة طلبك</span>
      <h2>يمكنك الاستعلام بنفسك.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('مرجعك', 'احتفظ برقم الطلب', 'يحمل بريد التأكيد معرّفًا يبدأ بـ <span dir="ltr">app_</span>. وهو المفتاح الوحيد لسجلك، وهو الوحيد عن قصد: لن تُفصح الكلية عن حالة طلب لمن لا يحمله، ولو كان يعرف بريدك الإلكتروني.')}
${darkCard('بلا حساب', 'الاستعلام دون تسجيل دخول', 'لا حساب لك في مرحلة التقديم — يُنشأ عند التسجيل. لذلك يتم الاستعلام بالرقم المرجعي لا بتسجيل الدخول، ويعيد الحالة وتاريخ الإنشاء فقط. لا شيء غير ذلك.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    ${noAccreditation}
    ${enOnly}
  </div>
</section>

<section class="section--light section-pad" id="requirements" data-contents="شروط الالتحاق">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الشروط الأكاديمية</span>
      <h2>لا يوجد مؤهل يُشترط.</h2>
      <p class="lede">يبدأ المستوى الأول من <span dir="ltr">A1</span> — أي على افتراض عدم وجود
        إنجليزية صالحة للاستعمال، لا وجود بعضها. الشهادة السابقة مرحّب بها كدليل، وليست شرطًا
        أبدًا.</p>
    </div>
    <div class="grid grid--3">
${card('غير مطلوب', 'شهادة إتمام دراسة', 'لا تطلبها الكلية ولا تتحقق منها ولا تسعّر على أساسها. برنامج لغة يشترط التعليم النظامي يستبعد بالضبط المتعلمين الذين كُتب المستوى الأول من أجلهم.')}
${card('غير مطلوب', 'درجة <span dir="ltr">IELTS</span> أو <span dir="ltr">TOEFL</span>', 'إن كانت لديك فأحضرها — فهي تختصر محادثة تحديد المستوى كثيرًا. هي دليل لا شرط، وأي درجة مضى عليها أكثر من سنتين تُعامَل كفرضية بداية لا كحقيقة.')}
${card('مطلوب', 'تحديد مستوى صادق', 'الشرط الحقيقي الوحيد. الدخول في المستوى الخطأ هو أكثر الطرق شيوعًا لإخفاق برنامج لغة مع متعلم، وهو يخفق في الاتجاهين: الأدنى مهين، والأعلى غرقٌ صامت.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">تحديد المستوى</span>
      <h2>كيف يُقرّر مستوى الالتحاق.</h2>
      <p class="lede">يحدث أمران، بهذا الترتيب، والثاني وحده هو المعتبر.</p>
    </div>
    <ol class="dot-list">
      <li><span class="num">٠١</span><span><strong>تقديرك أنت.</strong> سؤال واحد، ست عبارات، ثلاثون ثانية. وُجد لتقدّم وأنت تعرف أين أنت تقريبًا، ويُسجَّل على طلبك بوصفه تقييمًا ذاتيًا غير مُلزم صراحةً.</span><span class="leader"></span></li>
      <li><span class="num">٠٢</span><span><strong>تقييم تحديد المستوى.</strong> تقييم قصير ومحادثة مع أحد أعضاء الفريق المؤسس، تُرتَّب بالبريد بعد تقديمك. وهو ما ينتج المستوى الذي تدخله فعلًا. لا يوجد اختبار آلي على هذا الموقع، ووصف واحدٍ منه سيكون وصفًا لبرنامج غير موجود.</span><span class="leader"></span></li>
    </ol>
    <div class="callout">
      <span class="callout__label">إن تبيّن أن التحديد خاطئ</span>
      <p>قل ذلك في الأسبوعين الأولين. تحديد المستوى حكمٌ يُبنى على أدلة محدودة، وهذه الأدلة
        تتحسن لحظة أن تبدأ الدراسة. نقل متعلم مبكرًا لا يكلّف الكلية شيئًا ويوفّر عليه فصلًا
        كاملًا من مادة غير مناسبة.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المتطلبات العملية</span>
      <h2>ما تحتاجه للدراسة فعلًا.</h2>
    </div>
    <div class="grid grid--4">
${darkCard('جهاز', 'حاسوب أو لوح أو هاتف', 'تعمل المنصة داخل المتصفح. لا شيء يُثبَّت، ولا حد أدنى للمواصفات يستحق النشر — إن كان يشغّل الفيديو فهو يشغّل البرنامج.')}
${darkCard('اتصال', 'يكفي لبث الصوت', 'العمل على الاستماع هو عمود كل مستوى، فلا بد أن يصل الصوت. الجلسات المباشرة تحتاج أكثر؛ والمشاركة بالصوت وحده مقبولة حين لا يحتمل الاتصال الفيديو، وهذا ترتيب معلن لا حيلة جانبية.')}
${darkCard('ميكروفون', 'أي ميكروفون', 'يطلب منك مختبر الاستماع أن تسجّل صوتك، ويحتفظ بالتسجيلات لتسمع أنت ومعلمك التغيّر عبر الشهور. ميكروفون الهاتف أو الحاسوب يكفي. هذا هو المتطلب الذي يفاجئ الناس، ولهذا هو هنا لا في هامش.')}
${darkCard('بريد إلكتروني', 'عنوان تقرأه', 'تحديد المستوى والعرض والتسجيل كلها تمر بالبريد الإلكتروني. وهو القناة الوحيدة التي تعتمد عليها الكلية اليوم.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">السن</span>
      <h2>المتقدمون دون الثامنة عشرة — مسألة لم تُحسم.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">تُذكر ولا يُدّعى حسمها</span>
      <p>نشرت الكلية فئات مستهدفة تشمل تلاميذ المدارس. ولم تعتمد بعد سياسة لحماية القاصرين ولم
        تعيّن مسؤولًا مسمّى عنها، وكلاهما شرط لتعليم من هم دون الثامنة عشرة على نحو مسؤول.
        وإلى أن يوجدا، يتولى الفريق المؤسس أي طلب من دون الثامنة عشرة بالمراسلة مع ولي الأمر
        بدل معالجته معالجة اعتيادية. هذا قرار مؤسسي معلّق مسجَّل، لا سياسة معروضة.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="dates" data-contents="المواعيد">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">البدء</span>
      <h2>القبول مستمر.</h2>
      <p class="lede">هذا ليس اختيارًا تسويقيًا، بل ما تفعله المنصة فعلًا، ووصف غيره سيكون وصفًا
        لبرنامج غير موجود.</p>
    </div>
    <div class="grid grid--3">
${card('يوم تسجيلك', 'المستوى الأول يفتح فورًا', 'السداد المؤكد يُنشئ تسجيلك، والدرس الأول متاح في اليوم نفسه. لا شيء محجوز حتى موعد بدء.')}
${card('بإيقاعك', 'التقدّم فردي', 'سجل تقدّمك لك وحدك. لا صف يسبقك ولا صف ينتظرك، ولا درس يُفتح في تاريخ.')}
${card('مستوى واحد في كل مرة', 'التالي يفتح حين يُغلق الحالي', 'تُضاف المستويات من الثاني إلى السادس مع إتمام كل مستوى قبله، سواء دفعت بالمستوى أو دفعت البرنامج كاملًا. ويؤكد الإتمامَ موظفٌ لا حسابٌ آلي — فليس لدى الكلية محرك تصحيح آلي.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">لماذا لا توجد مواعيد فصول</span>
      <h2>لأن القرار الذي وراءها لم يُتخذ.</h2>
      <p class="lede">التقويم ليس تمرين تنسيق. هو ترميز لنموذج تشغيل، ولم تختر الكلية بعد أي
        النماذج هي.</p>
    </div>
    <div class="grid grid--3">
${card('الخيار الأول', 'قبول مستمر وإيقاع فردي', 'ما يجري اليوم. لا أحد ينتظر ليبدأ. وضعفه معروف: الدراسة الفردية الخالصة تنتهي نهاية سيئة، لسبب مفهوم — لا نقاط ثابتة، ولا شيء يمكن أن تتأخر عنه.')}
${card('الخيار الثاني', 'دفعات ثابتة وفصول محددة', 'البنية التي تجعل الناس يُنهون — إيقاع مشترك، وحصص مباشرة يكون فيها الجميع عند النقطة نفسها، وتخرّج له معنى. وثمنها أن متقدمًا في أكتوبر ينتظر إلى يناير، وأنها تستلزم إعادة بناء آلية التقدّم.')}
${card('الخيار الثالث', 'دخول مستمر بإيقاع ثابت', 'دراسة بإيقاعك، مع جلسات مباشرة ونوافذ امتحان وتهيئة على جدول دوري منشور تنضم إلى أقرب موعد منه. هذا ما صاغته الكلية كتوصية. ولم يُعتمد.')}
    </div>
    <div class="callout">
      <span class="callout__label">ما يعنيه هذا لك اليوم</span>
      <p>كل ما تدرسه متاح عند التسجيل وبإيقاعك أنت. الجدول المباشر الدوري الموصوف في الخيار
        الثالث لا يعمل بعد. وصفحة وضع الكلية تدرج التقويم الأكاديمي وتاريخ أول دفعة ضمن
        المعلّق، وهذه الصفحة لا تناقضها.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">كم يستغرق المستوى</span>
      <h2>رقم تصميم، لا قياس.</h2>
    </div>
    <div class="grid grid--2">
${darkCard(ltr('200'), 'ساعة تأهيلية لكل مستوى', 'حجم العمل المصمَّم لمستوى واحد، شاملًا المادة المُدرَّسة والدراسة الذاتية والتطبيق والتقييم. هو الرقم الذي بُني عليه المنهج، ولم يُقَس بعد على متعلمين حقيقيين لأنه لم يوجد متعلمون.')}
${darkCard(ltr('1,200'), 'عبر المستويات الستة', 'مجموع الستة. وكم يستغرق ذلك بالأشهر يعتمد كليًا على الساعات التي تستطيع منحها أسبوعيًا، ولهذا تنشر الكلية الساعات لا عددًا من الأشهر لا تستطيع الوقوف خلفه.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="international" data-contents="المتقدمون الدوليون">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المتقدمون الدوليون</span>
      <h2>البرنامج مبني للدارس البعيد.</h2>
      <p class="lede">القبول مفتوح عالميًا والدراسة كلها عن بُعد: لا انتقال ولا سكن ولا حرم
        يُقصد. الدروس المرحلية تُستأنف من حيث توقفت، والتسجيلات هي البديل الدائم للجلسات
        المباشرة لمن تفصله المناطق الزمنية، ولا تُعامل بوصفها الخيار الأدنى. ولم تُدرَّس دفعة
        بعد، فلا جدول مباشر مُثبت على مواقع طلاب حقيقية — يُذكر هذا هنا لأنه يؤثر في قرارك.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="visas" data-contents="التأشيرات">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الموقف</span>
      <h2>يُذكر بلا تحفّظ.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">ما لا تفعله الكلية</span>
      <p>الكلية ليست جهة كفالة طلاب مرخّصة. لا تصدر تأكيد قبول للدراسة، ولا خطاب تأشيرة، ولا
        إفادة لأغراض الهجرة، ولا أي مستند تقبله سلطة هجرة أساسًا لتأشيرة دراسة. ولا تقدّم — ولن
        تقدّم — مساعدة في طلبات الهجرة. ولا يجوز قراءة أي صفحة أخرى في هذا الموقع على أنها
        تخفف من ذلك.</p>
    </div>
    <div class="grid grid--3">
${card('لماذا', 'لأنها تُدرّس عن بُعد', 'تأشيرات الدراسة وُجدت لإتاحة الحضور الجسدي للدراسة. برنامج <span dir="ltr">IEFC</span> لا يتضمن حضورًا جسديًا في أي مكان — لا يوجد حرم يُحضَر إليه. التأشيرة ليست محجوبة؛ هي ببساطة ليست جزءًا من طبيعة هذا البرنامج.')}
${card('النتيجة', 'تدرس من بيتك', 'حيثما تعيش، تدرس هناك. لا سفر ولا سكن ولا تكلفة انتقال، ولا خطر هجرة ناشئ عن البرنامج نفسه.')}
${card('الاستثناء', 'لا يوجد', 'لا لأي مستوى، ولا لأي ترتيب سداد، ولا لأي جنسية، ولا لأي جهة راعية. لا توجد حالة تستطيع الكلية فيها المساعدة، ووصف حالات هامشية لن ينتج إلا أملًا لا أساس له.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">تحذير يستحق النشر</span>
      <h2>من يعرض عليك تأشيرة باسم الكلية فهو يحتال عليك.</h2>
    </div>
    <div class="grid grid--2">
${card('لا وكيل يملك هذه الصلاحية', 'لأن الكلية نفسها لا تملكها', 'لا تستطيع الكلية تفويض صلاحية لا تملكها. أي شخص أو وكالة تعرض تأشيرة دراسة باسم الكلية، أو خطاب قبول لأغراض الهجرة، أو دخولًا «مضمونًا» إلى المملكة المتحدة عن طريقها، يعرض ما لا تستطيع الكلية نفسها الوفاء به.')}
${card('ما تفعله', 'اكتب إلينا وأخبرنا', 'أرسل ذلك إلى <a href="mailto:info@worldwencollege.co.uk" dir="ltr">info@worldwencollege.co.uk</a>. نشر هذا التحذير قليل القيمة إن ذهبت البلاغات سدى، والكلية التي تعلم باحتيال باسمها وتصمت شريكة فيه.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">إن كان هدفك الدراسة بالخارج</span>
      <h2>ما يستطيع البرنامج فعله لذلك حقًا.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('يستطيع', 'بناء الإنجليزية التي تطلبها الوجهة', 'تعمل المستويات العليا مباشرةً على القراءة الأكاديمية والكتابة الأكاديمية والنقاش والحجاج الرسمي — وهي ما يصنع الفرق بعد الوصول، وما لا تضمنه درجة اختبار.')}
${darkCard('يستطيع', 'إعدادك للاختبارات المعترف بها', 'الإعداد لـ <span dir="ltr">IELTS</span> و<span dir="ltr">TOEFL</span> و<span dir="ltr">Cambridge</span> مدمج في المنهج من المستوى المتوسط المتقدم فصاعدًا. هذه الاختبارات، لا شهادة هذه الكلية، هي ما تعترف به اليوم جهات القبول وأنظمة الهجرة.')}
${darkCard('لا يستطيع', 'أن يحل محل مؤهل معترف به', 'لم يُعيَّن ممتحن خارجي ولا تحمل الكلية اعتمادًا، فلا ينبغي لأحد أن يعتمد على شهادة <span dir="ltr">IEFC</span> كمؤهل قبول أو هجرة. هذا هو الموقف الصريح، ولن يتغيّر إلا حين يتغيّر فعلًا.')}
    </div>
  </div>
</section>

<section class="section--light cta-band">
  <div class="container reveal">
    <h2>تريد معرفة تكلفة كل مستوى؟</h2>
    <div class="btn-row u-center">
      <a href="/ar/admissions/tuition/" class="btn btn--red">اطّلع على الرسوم الدراسية</a>
    </div>
  </div>
</section>
`,
};

PAGES.tuition = {
  slug: 'admissions-tuition-ar', output: 'ar/admissions/tuition/index.html', file: 'admissions-tuition.ar.html',
  contents: true,
  altHref: '/admissions/tuition/',
  title: 'الرسوم والسداد والدعم — الكلية العالمية للغة الإنجليزية',
  description: 'رسوم برنامج IEFC وأسعار المستويات، وكيف يجري السداد فعلًا — العملة والوسائل والاسترداد — والمنح ومسارات الدعم القائمة اليوم.',
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">الرسوم الدراسية</span>
    <h1>تسعير شفاف لمسار <span dir="ltr">IEFC</span> كاملًا.</h1>
    <p class="lede">رسم برنامج واحد، مقسّم بالتساوي على ستة مستويات — ادفع دفعة واحدة، أو لكل مستوى، أو أقساطًا داخل المستوى بالطلب.</p>
    <div class="stat-row" style="margin-top:40px">
      <div class="stat-row__item"><strong>19,000$</strong><span>البرنامج كاملًا</span></div>
      <div class="stat-row__item"><strong>3,166.67$</strong><span>لكل مستوى</span></div>
      <div class="stat-row__item"><strong>20</strong><span>رصيد <span dir="ltr">WEC</span> لكل مستوى</span></div>
      <div class="stat-row__item"><strong>120</strong><span>إجمالي أرصدة <span dir="ltr">WEC</span></span></div>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="fees" data-contents="الرسوم">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التفصيل حسب المستوى</span>
      <h2>الاستثمار ذاته، في كل مستوى.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المستوى</th><th dir="ltr">CEFR</th><th>الأرصدة</th><th>الزمن الكلي للمؤهل</th><th>الرسوم</th></tr></thead>
        <tbody>
          <tr><td><strong><span dir="ltr">I</span> · برنامج التأسيس</strong></td><td dir="ltr">A1</td><td>20</td><td>200 ساعة</td><td>3,166.67$</td></tr>
          <tr><td><strong><span dir="ltr">II</span> · البرنامج الابتدائي</strong></td><td dir="ltr">A2</td><td>20</td><td>200 ساعة</td><td>3,166.67$</td></tr>
          <tr><td><strong><span dir="ltr">III</span> · البرنامج المتوسط</strong></td><td dir="ltr">B1</td><td>20</td><td>200 ساعة</td><td>3,166.67$</td></tr>
          <tr><td><strong><span dir="ltr">IV</span> · المتوسط المتقدم</strong></td><td dir="ltr">B2</td><td>20</td><td>200 ساعة</td><td>3,166.67$</td></tr>
          <tr><td><strong><span dir="ltr">V</span> · البرنامج المتقدم</strong></td><td dir="ltr">C1</td><td>20</td><td>200 ساعة</td><td>3,166.67$</td></tr>
          <tr><td><strong><span dir="ltr">VI</span> · برنامج الإتقان</strong></td><td dir="ltr">C2</td><td>20</td><td>200 ساعة</td><td>3,166.67$</td></tr>
          <tr><td colspan="2"><strong>الإجمالي</strong></td><td>120</td><td>1,200 ساعة</td><td><strong>19,000$</strong></td></tr>
        </tbody>
      </table>
    </div>
    <p class="form-note">الزمن الكلي للمؤهل رقم تصميم لا قياس: هو حجم العمل الذي بُني عليه المنهج، ولم يُقَس على متعلمين حقيقيين لأنه لم يوجد متعلمون. وكم يستغرق ذلك بالأشهر يعتمد على الساعات التي تستطيع منحها أسبوعيًا. ورصيد الكلية وحدة داخلية، وليس رصيدًا أوروبيًا ولا بريطانيًا معترفًا به.</p>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal two-col">
    <div>
      <span class="module-marker">تشمل الرسوم الدراسية</span>
      <ul class="check-list">
        <li>جميع الوحدات التعليمية للمستوى</li>
        <li>الحصص المباشرة والدروس متى بدأ تشغيلها — لم تُعقد أي حصة بعد، لأنه لم يُدرَّس أي فوج</li>
        <li>الموارد التعليمية والوصول إلى المكتبة الرقمية</li>
        <li>التقييمات والامتحانات</li>
        <li>تقارير التقدّم والإرشاد الأكاديمي</li>
        <li>كشف الدرجات الرقمي</li>
        <li>الشهادة الرقمية عند الإتمام بنجاح — متى أمكن منح الشهادة؛ لم يُعيَّن ممتحن خارجي بعد</li>
      </ul>
    </div>
    <div>
      <span class="module-marker">خدمات اختيارية</span>
      <ul class="check-list">
        <li>الشهادة المطبوعة (اختياري)</li>
        <li>الشحن الدولي (اختياري)</li>
        <li>التحقق من الشهادة (اختياري)</li>
      </ul>
      <p class="form-note">التقديم بلا تكلفة — لا رسوم تقديم ولا معالجة ولا تسجيل. الخدمات الاختيارية الثلاث أعلاه هي الإضافات الوحيدة، وتُؤكَّد أسعارها قبل الطلب.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="paying" data-contents="السداد">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">العملة</span>
      <h2>عملة واحدة معتمدة، وست غير معتمدة.</h2>
      <p class="lede">تحاسب الكلية بالدولار الأمريكي. العملات الأخرى موجودة في النظام كرموز
        معترف بها، لكن العملة لا تكون معتمدة إلا بوجود سياسة سعر خلفها، ولا واحدة منها لها ذلك
        بعد.</p>
    </div>
    <div class="grid grid--2">
${card('معتمدة', 'الدولار الأمريكي', `كل رسم يُحدَّد ويُحصَّل بالدولار. ${FULL} تعني ${FULL}.`)}
${card('غير معتمدة', 'الجنيه الإسترليني والنيرة والريال والدرهم والدينار', 'يحوّل مصرفك أو مُصدِر بطاقتك بسعره في يومه. لا تنشر الكلية سعرًا بعملة محلية، لأن نشر سعر بلا سعر صرف ثابت خلفه هو نشر رقم يتغيّر دون إشعار.')}
    </div>
    <p class="form-note">حيث يحوّل المصرف، فالتحويل بينك وبين مصرفك. لا ترى الكلية إلا المبلغ
      بالدولار، ولا تستطيع تسعير المبلغ المحلي ولا ضمانه.</p>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">وسائل الدفع</span>
      <h2>ما يصلك منها يعتمد على مكانك.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">نيجيريا تحديدًا</span>
      <p>يُوجَّه المتقدمون من نيجيريا إلى <span dir="ltr">Paystack</span> أولًا، ثم
        <span dir="ltr">Flutterwave</span>، ثم <span dir="ltr">OPay</span>، وبوابة البطاقات
        الدولية أخيرًا. هذا الترتيب ليس زينة: عدة بوابات دولية لا تدعم البطاقات النيجيرية ولا
        التجار النيجيريين، وصفحة دفع لا تعرض غيرها ستفشل بصمت مع نسبة كبيرة من متقدمي الكلية.
        وإن لم تظهر وسيلة عند السداد فذلك لأن بيانات التاجر الخاصة بها لم تُفعَّل بعد — اكتب
        إلى إدارة القبول وادفع بالتحويل في هذه الأثناء.</p>
    </div>
    <div class="grid grid--3">
${card('الخليج والمملكة المتحدة', 'بطاقة دولية', 'السعودية والإمارات وقطر والكويت والمملكة المتحدة تُوجَّه إلى بوابة البطاقات الدولية، مع خيارات محلية حيث تتوفر.')}
${card('اقتراح لا إلزام', 'تختار أنت', 'يقترح النظام الوسيلة الأنسب لبلدك ولا يفرضها. إن كانت وسيلة أخرى أيسر عليك فاستخدمها.')}
${card('البطاقة لا تصل الكلية', 'بيانات بطاقتك عند البوابة', 'تُدخَل بيانات البطاقة لدى مزوّد الدفع لا لدى الكلية. تسجّل الكلية أن السداد تم ومبلغه ومرجعه، ولا ترى رقم بطاقة ولا تخزنه.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="plans" data-contents="طرق الدفع">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">طرق الدفع</span>
      <h2>ثلاثة ترتيبات.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('البرنامج كاملًا', `${FULL} مرة واحدة`, 'دفعة واحدة تغطي المستويات الستة. تسجّلك في المستوى الأول فورًا، وتُضاف المستويات من الثاني إلى السادس إلى حسابك واحدًا تلو الآخر مع إتمام كل مستوى قبله. لا شيء يُحجب عنك — الترتيب موجود ليكون المستوى المدفوع مستوىً أنت مستعد له فعلًا.')}
${darkCard('مستوى بمستوى', `${PER_LEVEL} في كل مرة`, 'تدفع عند بداية كل مستوى. وهو الترتيب الأشيع، والأقل التزامًا قبل أن ترى كيف تُدرّس الكلية.')}
${darkCard('تقسيط', `${ltr(String(INSTALMENTS))} دفعات لكل مستوى`, `رسوم المستوى مقسّمة إلى ${ltr(String(INSTALMENTS))} أجزاء متساوية. التقسيم متساوٍ لأنه لم تُعتمد سياسة إيقاع مبنية على أدلة؛ وحين تُعتمد ستُنشر هنا لا تُغيَّر بصمت.`)}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="refunds">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الاسترداد</span>
      <h2>لا توجد سياسة استرداد بعد، ومن حقك أن تعرف ذلك قبل أن تدفع.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">ما هو صحيح</span>
      <p>تستطيع الكلية تنفيذ الاسترداد تقنيًا — الآلية مبنية ومختبرة مع بوابات الدفع. ما لا يوجد
        هو <em>سياسة</em>: من يأذن بالاسترداد، وعلى أي أساس، وخلال أي مدة، وبأي نسبة. هذه قرارات
        تنفيذية لم يُتخذ أي منها. وإلى أن تُتخذ، يُبتّ في طلب الاسترداد حالةً بحالة من الفريق
        المؤسس، كتابةً، ويُسجَّل القرار على السداد. هذا ضمان أضعف من سياسة منشورة، ويُذكر
        بوصفه كذلك.</p>
    </div>
    <div class="grid grid--2">
${card('إن أردت اليقين أولًا', 'ادفع مستوى بمستوى', `التزامك في السداد بالمستوى هو ${PER_LEVEL}، وفي السداد الكامل ${FULL}. إلى أن توجد سياسة استرداد، هذا الفرق هو الحماية العملية المتاحة لك، وتفضّل الكلية أن تقول لك ذلك على أن تبيعك الحزمة الأكبر.`)}
${card('ما تلتزم به الكلية الآن', 'جواب مكتوب، وسجل له', 'كل طلب استرداد يُجاب كتابةً وبسبب. وأيًا كانت السياسة التي تُعتمد لاحقًا، تبقى القرارات السابقة عليها في السجل ولا يُعاد تفسيرها بصمت.')}
    </div>
    ${enOnly}
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الإيصالات</span>
      <h2>ما تحصل عليه، وما لا تحصل عليه بعد.</h2>
    </div>
    <div class="grid grid--2">
${card('يُصدَر', 'إيصال مرقّم', 'كل دفعة ناجحة تُمنح رقم إيصال تسلسليًا لحظة تأكيد بوابة الدفع لها، وهذا الرقم فريد ودائم. وهو المرجع الذي تذكره في أي مراسلة تتعلق بالمال.')}
${card('لا يُصدَر بعد', 'إيصال PDF قابل للتنزيل', 'الإيصال موجود سجلًا؛ أما مستند منسّق تنزّله فغير مبني بعد. إن احتجت واحدًا لجهة عمل أو راعٍ، فاطلبه من فريق القبول ويُعَدّ يدويًا.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="funding" data-contents="المنح والدعم">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الوضع</span>
      <h2>توجد آلية. ولا يوجد برنامج.</h2>
    </div>
    <div class="grid grid--2">
${card('موجود', 'آلية المنح', 'تستطيع الكلية تسجيل منحة باسم شخص محدد، نسبةً أو مبلغًا ثابتًا أو إعفاءً كاملًا، مع تسجيل الموظف المُقِر إلى جانبها. وتُطبَّق تلقائيًا عند السداد لصاحبها وحده. هذا مبنيّ ومختبر.')}
${card('غير موجود', 'معايير وصندوق وموعد', 'لم تُعتمد معايير، ولم يُخصَّص تمويل، ولم تُفتح دورة، ولم تُمنح منحة لأحد. نشر معايير لا تستطيع الكلية تمويلها أسوأ من عدم نشر شيء.')}
    </div>
    <div class="callout">
      <span class="callout__label">لماذا لا يُكتب ويُنشر ببساطة</span>
      <p>برنامج المنح التزام مالي والتزام بالإنصاف في آن. تقريره يحتاج صندوقًا، ومعايير يمكن
        تطبيقها على غرباء تطبيقًا متسقًا، وشخصًا مسؤولًا عن تطبيقها — وهي الأمور الثلاثة نفسها
        الناقصة في كل منصب شاغر آخر في الكلية. القرار تنفيذي، ولم يُتخذ.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">ما يمكنك فعله اليوم</span>
      <h2>ثلاثة مسارات حقيقية.</h2>
    </div>
    <div class="grid grid--3">
${card('الأول', 'ادفع مستوى بمستوى', `البرنامج قابل للتجزئة عن قصد. ${PER_LEVEL} لمستوى واحد، يُقرَّر مستوىً بمستوى، التزام مختلف جوهريًا عن ${FULL}، ولا يلزمك شرح لاختياره.`)}
${card('الثاني', `وزّع المستوى على ${ltr(String(INSTALMENTS))} دفعات`, 'خطة التقسيط تقسم رسوم مستوى واحد إلى أجزاء متساوية. متاحة بالطلب لا بالتقديم، ولا رسوم على استخدامها.')}
${card('الثالث', 'اكتب واسأل', 'إن كانت الرسوم هي الحائل الوحيد بينك وبين البرنامج، فقل ذلك لإدارة القبول بكلماتك. لا صندوق يُسحب منه ولا وعد مرتبط بهذا، لكن طلبًا لم يُقدَّم لا يمكن النظر فيه حين يوجد صندوق.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الجهات الراعية وأصحاب العمل</span>
      <h2>إن كان غيرك يدفع.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('ممكن', 'أن تدفع جهة ثالثة عن متعلم مسمّى', 'يمكن لصاحب عمل أو وزارة أو فرد من الأسرة أن يدفع اليوم عن متعلم مسمّى. تُسجَّل الدفعة على تسجيل المتعلم، والمتعلم — لا الدافع — هو من يملك سجله الأكاديمي.')}
${darkCard('غير مبني', 'فوترة المؤسسات والمقاعد المؤسسية', 'حساب مؤسسي بفوترة أوامر شراء ومقاعد قابلة للإسناد موجود في نموذج البيانات ولا عملية تشغيلية خلفه. سيُبنى وفق متطلبات مؤسسة حقيقية لا تخمينًا مسبقًا. إن كانت هذه حالتك فاكتب لفريق القبول.')}
    </div>
  </div>
</section>

<section class="section--light cta-band">
  <div class="container reveal">
    <h2>مستعد لتأمين مقعدك؟</h2>
    <div class="btn-row u-center">
      <a href="/ar/admissions/#apply" class="btn btn--red">ابدأ طلبك الآن</a>
    </div>
  </div>
</section>
`,
};

PAGES.faq = {
  slug: 'faq-ar', output: 'ar/faq/index.html', file: 'faq.ar.html',
  altHref: '/faq/',
  title: 'الأسئلة الشائعة — الكلية العالمية للغة الإنجليزية',
  description: 'الأسئلة الشائعة عن برنامج IEFC والقبول والرسوم والدراسة في الكلية، ومعها أسئلة القبول التي يسألها المتقدمون فعلًا.',
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">الأسئلة الشائعة</span>
    <h1>الأسئلة الأكثر شيوعًا</h1>
    <p class="lede">كل ما تحتاج معرفته عن برنامج <span dir="ltr">IEFC</span>، والقبول، والدراسة في الكلية.</p>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal" style="max-width:820px">
    <div class="accordion">

      <div class="accordion__item">
        <button class="accordion__q"><span>ما هو برنامج الطلاقة الدولي في اللغة الإنجليزية <span dir="ltr">(IEFC)</span>؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">برنامج <span dir="ltr">IEFC</span> هو البرنامج الرئيسي للكلية، ينقسم إلى ستة مستويات متوافقة مع <span dir="ltr">CEFR</span> (من <span dir="ltr">A1</span> إلى <span dir="ltr">C2</span>)، كل مستوى يحمل عشر وحدات و20 رصيدًا من أرصدة <span dir="ltr">WEC</span> وزمنًا كليًا للمؤهل قدره 200 ساعة. والبرنامج كاملًا 120 رصيدًا و1,200 ساعة. والزمن الكلي للمؤهل رقم تصميم لا قياس، وكم يستغرق بالأشهر يعتمد على الساعات التي تستطيع منحها أسبوعيًا.</div></div>
      </div>

      <div class="accordion__item">
        <button class="accordion__q"><span>هل البرنامج كامل عبر الإنترنت؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">نعم، بالكامل. تقدّم الكلية برنامج <span dir="ltr">IEFC</span> عبر حرم رقمي — دروس مُدرَّجة، ومختبر الاستماع، وتكاليف يصححها شخص، وسجلك الأكاديمي — بحيث يمكن لأي طالب حول العالم الالتحاق دون الحاجة للانتقال. أما الحصص المباشرة فمصمَّمة ولم تُعقد بعد لأن أي دفعة لم تُدرَّس، والتسجيلات الصوتية لعمل الاستماع لم تُنتج. يُذكر الأمران لا يُوهَمان.</div></div>
      </div>

      <div class="accordion__item">
        <button class="accordion__q"><span>هل يجب أن أبدأ من المستوى الأول (التأسيس)؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">لا. يخضع كل متقدّم لتقييم قصير لتحديد المستوى أثناء عملية القبول، ويُوضع في المستوى المناسب لقدرته الحالية في اللغة الإنجليزية — من التأسيس إلى المتقدّم.</div></div>
      </div>

      <div class="accordion__item">
        <button class="accordion__q"><span>كم تبلغ تكلفة البرنامج؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">البرنامج الكامل بمستوياته الستة يبلغ 19,000$، أو 3,166.67$ لكل مستوى. يمكنك الدفع دفعة واحدة، أو لكل مستوى، أو بتقسيم رسوم المستوى إلى أربعة أقساط متساوية — متساوية لأنه لم تُعتمد سياسة إيقاع مبنية على أدلة، ومتاحة بالطلب. راجع <a href="/ar/admissions/tuition/">الرسوم الدراسية</a> للتفصيل الكامل.</div></div>
      </div>

      <div class="accordion__item">
        <button class="accordion__q"><span>هل يُحضّر البرنامج للطلاب لامتحانات <span dir="ltr">IELTS</span> أو <span dir="ltr">TOEFL</span> أو <span dir="ltr">Cambridge</span>؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">نعم. تحضير <span dir="ltr">IELTS</span> و<span dir="ltr">TOEFL</span> و<span dir="ltr">Cambridge English</span> مدمج في المنهج، خصوصًا ابتداءً من المستوى الرابع، إلى جانب اللغة الأكاديمية ولغة الأعمال.</div></div>
      </div>

      <div class="accordion__item">
        <button class="accordion__q"><span>لمن صُمم برنامج <span dir="ltr">IEFC</span>؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">تلاميذ المدارس، وطلاب المرحلة الثانوية والجامعية، والمهنيون العاملون، وموظفو القطاع الحكومي، وقادة الأعمال، والطلاب الدوليون المستعدّون للدراسة بالخارج أو الباحثون عن كفاءة لغوية متقدّمة.</div></div>
      </div>

      <div class="accordion__item">
        <button class="accordion__q"><span>ماذا سأحصل عليه عند إتمام البرنامج؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">يُصدَر كشف درجات رقمي بعد كل مستوى. أما شهادة <span dir="ltr">IEFC</span> نفسها فلا يمكن منحها بعد: منح الشهادة يتطلب ممتحنًا خارجيًا، ولم يُعيَّن أحد. حين يبدأ المنح، تُصدَر شهادة رقمية عند إتمام البرنامج كاملًا بنجاح، مع النسخة المطبوعة والتحقق كخدمتين اختياريتين.</div></div>
      </div>

      <div class="accordion__item">
        <button class="accordion__q"><span>هل الكلية معتمدة رسميًا؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">لا. لا تحمل الكلية أي اعتماد ولا أي انتساب خارجي لضمان الجودة اليوم. تنص صفحة <a href="/ar/about/#status">الوضع المؤسسي</a> على ما هو قائم وما ليس قائمًا، ولن تقول شيئًا مختلفًا إلا حين يصير مختلفًا فعلًا.</div></div>
      </div>

      <div class="accordion__item">
        <button class="accordion__q"><span>كيف أتقدّم بطلبي؟</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">قدّم طلبك عبر النموذج الإلكتروني في صفحة <a href="/ar/admissions/#apply">القبول</a> بالاسم الكامل والبريد الإلكتروني وبلد الإقامة — ويقترح تقييم ذاتي قصير مستواك المبدئي قبل التقديم. راجع صفحة القبول للاطّلاع على رحلة التقديم كاملة بخطواتها الخمس.</div></div>
      </div>

    </div>
  </div>
</section>

<section class="section--paper section-pad" id="admissions-questions">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">أسئلة القبول</span>
      <h2>الأسئلة التي يسألها المتقدمون فعلًا.</h2>
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التقديم</span>
      <h2>الالتحاق.</h2>
    </div>
    <div class="grid grid--2">
${card('س', 'هل أحتاج مؤهلًا للتقديم؟', 'لا. لا يوجد شرط قبول أكاديمي من أي نوع. يبدأ المستوى الأول من <span dir="ltr">A1</span> ويفترض عدم وجود إنجليزية صالحة للاستعمال.')}
${card('س', 'هل يجب أن أبدأ من المستوى الأول؟', 'لا. تقييم تحديد المستوى بعد تقديمك يحدد أي المستويات الستة تدخل. والتقييم الذاتي على صفحة القبول تقديرك أنت ولا يُلزم أحدًا.')}
${card('س', 'هل هناك رسوم تقديم؟', 'لا. التقديم بلا تكلفة ولا يتطلب مستندات.')}
${card('س', 'كم أنتظر حتى يصلني رد؟', 'تلتزم الكلية بالتواصل بشأن تحديد المستوى خلال ثلاثة أيام عمل. هذا التزام لا متوسط مقيس — لم تعالج الكلية طلبات بأعداد كبيرة، وادعاء غير ذلك اختلاق لرقم.')}
${card('س', 'هل أستطيع التقديم إن كان عمري دون ١٨؟', 'اكتب إلى إدارة القبول بدل استخدام النموذج. لم تعتمد الكلية سياسة لحماية القاصرين ولم تعيّن مسؤولًا عنها، وإلى أن يوجدا تُعالَج هذه الطلبات فرديًا مع ولي الأمر.')}
${card('س', 'بأي لغة يجري التدريس؟', 'بالإنجليزية من المستوى الأول، بلغة مقيدة ودعم بصري وتكرار ومعلم يبطئ بدل أن يترجم. الموقع منشور بالعربية والإنجليزية؛ التدريس نفسه غير مترجم لأن الدرس المترجم درس آخر.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المال</span>
      <h2>الرسوم والسداد والاسترداد.</h2>
    </div>
    <div class="grid grid--2">
${card('س', 'كم التكلفة؟', `${FULL} للبرنامج كاملًا بمستوياته الستة، أو ${PER_LEVEL} للمستوى الواحد. التفصيل الكامل في <a href="/ar/admissions/tuition/">الرسوم الدراسية</a>.`)}
${card('س', 'هل أستطيع الدفع بعملتي؟', 'الرسوم تُحدَّد وتُحصَّل بالدولار الأمريكي، ويحوّل مصرفك بسعره. لا تنشر الكلية أسعارًا بالعملات المحلية لأنها لم تثبّت أسعار صرف خلفها، والسعر الذي يتغير دون إشعار ليس سعرًا.')}
${card('س', 'هل أستطيع الدفع من نيجيريا؟', 'نعم. يُوجَّه المتقدمون من نيجيريا إلى مزوّدي الدفع النيجيريين قبل بوابات البطاقات الدولية، تحديدًا لأن عدة بوابات دولية لا تعمل مع البطاقات أو التجار في نيجيريا.')}
${card('س', 'هل يمكنني استرداد أموالي؟', 'لا توجد سياسة استرداد معتمدة. تُبتّ الطلبات حالةً بحالة من الفريق المؤسس كتابةً، ويُسجَّل القرار. هذا ضمان أضعف من سياسة منشورة، ولهذا يُذكر هنا لا يُكتشف لاحقًا. وإن كان اليقين يهمك فادفع مستوى بمستوى.')}
${card('س', 'هل توجد منح؟', 'لا برنامج مفتوح ولا تمويل مخصص ولا منحة مُنحت لأحد. آلية تسجيل المنحة موجودة؛ السياسة غير موجودة.')}
${card('س', 'هل الرسوم مختلفة حسب البلد؟', 'لا. الرسم نفسه للجميع بغض النظر عن الجنسية أو الإقامة. لا يوجد سعر دولي ولا سعر تفاوضي.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الدراسة</span>
      <h2>ما هي عليه فعلًا.</h2>
    </div>
    <div class="grid grid--2">
${card('س', 'هل الدراسة كلها عبر الإنترنت؟', 'نعم، في كل مكان. لا يوجد حرم تدريسي. «الحرم الجامعي — لندن» يسمّي المقر الإداري، ولا يداوم فيه أي طالب.')}
${card('س', 'متى تبدأ الحصص؟', 'موادك متاحة يوم تسجّل. لا موعد دفعة ولا فصل تنتظره. والجدول المباشر الدوري لم يبدأ بعد — راجع <a href="/ar/admissions/#dates">المواعيد</a>.')}
${card('س', 'كم يستغرق البرنامج؟', 'كل مستوى مصمَّم على 200 ساعة تأهيلية، و1,200 عبر المستويات الستة. وكم يستغرق ذلك بالأشهر يعتمد على الساعات التي تمنحها أسبوعيًا — تنشر الكلية الساعات لا عددًا من الأشهر لا تستطيع الوقوف خلفه.')}
${card('س', 'هل أحتاج تجهيزات؟', 'جهاز يشغّل الفيديو، واتصال يحمل الصوت، وميكروفون — الأخير لأن معمل الاستماع يطلب منك تسجيل صوتك ليُسمَع تغيّره عبر الأشهر. وميكروفون الهاتف كافٍ.')}
${card('س', 'هل سأحصل على شهادة؟', 'يُصدَر كشف درجات بعد كل مستوى. أما شهادة <span dir="ltr">IEFC</span> نفسها فلا يمكن منحها بعد: لم يُعيَّن ممتحن خارجي، ومنح شهادة دون فحص خارجي يجعلها أقل قيمة لا أكثر. راجع <a href="/ar/governance/#quality">ضمان الجودة</a>.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الكلية</span>
      <h2>الأسئلة ذات الإجابات غير المريحة.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('س', 'هل الكلية معتمدة؟', 'لا. لا تحمل الكلية أي اعتماد ولا أي انتساب خارجي لضمان الجودة. يُذكر ذلك في كل صفحة يؤثر فيها على قرارك لا مرة واحدة في هامش، ولن يُذكر بخلافه إلا حين يصير مختلفًا فعلًا.')}
${darkCard('س', 'كم عدد الخريجين؟', 'لا أحد. لم تُدرَّس دفعة ولم تُمنح شهادة. لا تنشر الكلية أعداد طلاب ولا نسب إتمام ولا نتائج خريجين لأنها لا تملك شيئًا من ذلك.')}
${darkCard('س', 'هل تنفع الشهادة للقبول الجامعي أو الهجرة؟', 'لا، ولا ينبغي أن تبني على ذلك. المعترف به لهذين الغرضين اليوم هو <span dir="ltr">IELTS</span> أو <span dir="ltr">TOEFL</span> أو <span dir="ltr">Cambridge</span>، وكلها تُعِدّ لها المستويات العليا مباشرةً. تفضّل الكلية أن تقول لك هذا على أن تأخذ مالك على سوء فهم.')}
${darkCard('س', 'إذن ما الذي أدفع مقابله؟', 'برنامج كامل قابل للفحص: ستة مستويات، وستون وحدة، وكل درس مخطط مرحلةً مرحلة، وكل تقييم مكتوب بمعايير منشورة، ومجموعة مجلدات منشورة تغطي المنهج والتقييم والتدريس. كل ذلك يمكن فحصه قبل أن تدفع قرشًا، وهو أكثر مما يعرضه معظم مزوّدي اللغة.')}
    </div>
    ${enOnly}
  </div>
</section>

<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>لا يزال لديك سؤال؟</h2>
    <div class="btn-row u-center">
      <a href="/ar/contact/" class="btn btn--gold">تواصل معنا</a>
    </div>
  </div>
</section>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "ما هو برنامج الطلاقة الدولي في اللغة الإنجليزية (IEFC)؟",
      "acceptedAnswer": { "@type": "Answer", "text": "برنامج IEFC هو البرنامج الرئيسي للكلية، ينقسم إلى ستة مستويات متوافقة مع CEFR (من A1 إلى C2)، كل مستوى يحمل عشر وحدات و20 رصيدًا من أرصدة WEC وزمنًا كليًا للمؤهل قدره 200 ساعة. والبرنامج كاملًا 120 رصيدًا و1,200 ساعة. والزمن الكلي للمؤهل رقم تصميم لا قياس." }
    },
    {
      "@type": "Question",
      "name": "هل البرنامج كامل عبر الإنترنت؟",
      "acceptedAnswer": { "@type": "Answer", "text": "نعم، بالكامل. تقدّم الكلية برنامج IEFC عبر حرم رقمي — دروس مُدرَّجة، ومختبر الاستماع، وتكاليف يصححها شخص، وسجلك الأكاديمي. أما الحصص المباشرة فمصمَّمة ولم تُعقد بعد، والتسجيلات الصوتية لم تُنتج." }
    },
    {
      "@type": "Question",
      "name": "هل يجب أن أبدأ من المستوى الأول (التأسيس)؟",
      "acceptedAnswer": { "@type": "Answer", "text": "لا. يخضع كل متقدّم لتقييم قصير لتحديد المستوى أثناء عملية القبول، ويُوضع في المستوى المناسب لقدرته الحالية في اللغة الإنجليزية — من التأسيس إلى المتقدّم." }
    },
    {
      "@type": "Question",
      "name": "كم تبلغ تكلفة البرنامج؟",
      "acceptedAnswer": { "@type": "Answer", "text": "البرنامج الكامل بمستوياته الستة يبلغ 19,000$، أو 3,166.67$ لكل مستوى. يمكنك الدفع دفعة واحدة، أو لكل مستوى، أو بتقسيم رسوم المستوى إلى أربعة أقساط متساوية — متساوية لأنه لم تُعتمد سياسة إيقاع مبنية على أدلة، ومتاحة بالطلب." }
    },
    {
      "@type": "Question",
      "name": "هل يُحضّر البرنامج للطلاب لامتحانات IELTS أو TOEFL أو Cambridge؟",
      "acceptedAnswer": { "@type": "Answer", "text": "نعم. تحضير IELTS وTOEFL وCambridge English مدمج في المنهج، خصوصًا ابتداءً من المستوى الرابع، إلى جانب اللغة الأكاديمية ولغة الأعمال." }
    },
    {
      "@type": "Question",
      "name": "لمن صُمم برنامج IEFC؟",
      "acceptedAnswer": { "@type": "Answer", "text": "تلاميذ المدارس، وطلاب المرحلة الثانوية والجامعية، والمهنيون العاملون، وموظفو القطاع الحكومي، وقادة الأعمال، والطلاب الدوليون المستعدّون للدراسة بالخارج أو الباحثون عن كفاءة لغوية متقدّمة." }
    },
    {
      "@type": "Question",
      "name": "ماذا سأحصل عليه عند إتمام البرنامج؟",
      "acceptedAnswer": { "@type": "Answer", "text": "يُصدَر كشف درجات رقمي بعد كل مستوى. أما شهادة IEFC نفسها فلا يمكن منحها بعد: منح الشهادة يتطلب ممتحنًا خارجيًا، ولم يُعيَّن أحد. حين يبدأ المنح، تُصدَر شهادة رقمية عند إتمام البرنامج كاملًا بنجاح، مع النسخة المطبوعة والتحقق كخدمتين اختياريتين." }
    },
    {
      "@type": "Question",
      "name": "هل الكلية معتمدة رسميًا؟",
      "acceptedAnswer": { "@type": "Answer", "text": "لا. لا تحمل الكلية أي اعتماد ولا أي انتساب خارجي لضمان الجودة اليوم. تنص صفحة الوضع المؤسسي على ما هو قائم وما ليس قائمًا، ولن تقول شيئًا مختلفًا إلا حين يصير مختلفًا فعلًا." }
    },
    {
      "@type": "Question",
      "name": "كيف أتقدّم بطلبي؟",
      "acceptedAnswer": { "@type": "Answer", "text": "قدّم طلبك عبر النموذج الإلكتروني في صفحة القبول بالاسم الكامل والبريد الإلكتروني وبلد الإقامة — ويقترح تقييم ذاتي قصير مستواك المبدئي قبل التقديم." }
    }
  ]
}
</script>
`,
};

PAGES.academics = {
  slug: 'academics-ar', output: 'ar/academics/index.html', file: 'academics.ar.html',
  contents: true,
  altHref: '/academics/',
  title: 'البرامج الأكاديمية — الكلية العالمية للغة الإنجليزية',
  description: 'برنامج IEFC في ستة مستويات متوافقة مع الإطار الأوروبي: ما يحتويه كل مستوى، وكيف يجري التعلّم، والحرم الرقمي الذي يعمل عليه.',
  body: `${hero('البرامج الأكاديمية', 'برنامج واحد، يُدرَّس بمعيار مكتوب.',
    'تدرّس الكلية مسارًا واحدًا — برنامج الطلاقة الدولي في اللغة الإنجليزية — في ستة مستويات '
    + 'متوافقة مع الإطار الأوروبي، من عدم وجود إنجليزية إلى الإتقان. كل وحدة مكتوبة، وكل تقييم '
    + 'موجود قبل الدرس الذي يختبره، وكل ذلك متاح للقراءة قبل أن يسجّل أحد.',
    `<div class="btn-row">
      <a href="/ar/admissions/#apply" class="btn btn--gold">قدّم الآن</a>
      <a href="/ar/admissions/tuition/" class="btn btn--outline">الرسوم</a>
    </div>`)}

<section class="section--light section-pad" id="iefc" data-contents="برنامج IEFC">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">برنامج <span dir="ltr">IEFC</span></span>
      <h2>ستة مستويات، متوافقة مع الإطار الأوروبي.</h2>
      <p class="lede">صُمّم كل مستوى ليبني نحو نطاقه في الإطار الأوروبي المرجعي المشترك للغات —
        المعيار الأوسع اعترافًا لدى الجامعات وأصحاب العمل ومؤسسات اللغة الإنجليزية في العالم.
        يحمل كل مستوى ${ltr('20')} رصيدًا من أرصدة الكلية، والزمن الكلي للمؤهل فيه
        ${ltr('200')} ساعة على مدى أربعة أشهر؛ والبرنامج كاملًا ${ltr('120')} رصيدًا والزمن
        الكلي للمؤهل ${ltr('1,200')} ساعة.</p>
    </div>
    <div class="callout">
      <span class="callout__label">حالة المنهج وقياس العبء</span>
      <p>هذه الساعات رقم تصميم لا قياس: ستُستبدل بها ساعات مقيسة من وقت الدراسة الفعلي متى أكمل
        متعلمون كافون مستوى، ويُنشر الفرق حيث يوجد. ورصيد الكلية وحدة داخلية (الرصيد عشر ساعات
        تعلم افتراضية)، وليس <span dir="ltr">ECTS</span> ولا <span dir="ltr">CATS</span> ولا
        يمنح حق تحويل إلى أي مؤسسة. وجميع الوحدات الستين مؤلفة ومنشورة، أما الدروس داخلها فما
        زالت تُكتب وتصدر تباعًا.</p>
    </div>
    <div class="section-head" style="margin-top:38px">
      <span class="module-marker">مجالات المنهج</span>
      <h3 style="font-size:1.3rem">ما يُبنى عليه كل مستوى.</h3>
    </div>
    <div class="tag-row">
      <span class="tag">القواعد</span><span class="tag">المفردات</span><span class="tag">الاستماع</span>
      <span class="tag">التحدث</span><span class="tag">القراءة</span><span class="tag">الكتابة</span>
      <span class="tag">النطق</span><span class="tag">المحادثة</span>
      <span class="tag">اللغة الأكاديمية</span><span class="tag">التواصل المهني</span>
      <span class="tag">الخطابة العامة</span><span class="tag">لغة الأعمال</span>
      <span class="tag">مهارات البحث</span><span class="tag">التفكير النقدي</span>
      <span class="tag">مهارات العرض</span><span class="tag" dir="ltr">IELTS</span>
      <span class="tag" dir="ltr">TOEFL</span><span class="tag" dir="ltr">Cambridge English</span>
      <span class="tag">مهارات المقابلات</span><span class="tag">التواصل القيادي</span>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="levels" data-contents="المستويات الستة">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">البنية</span>
      <h2>ستة مستويات، ستون وحدة.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المستوى</th><th><span dir="ltr">CEFR</span></th><th>التركيز</th><th>الوحدات</th><th>الأرصدة</th><th>الساعات</th><th>الشهادة</th></tr></thead>
        <tbody>
${D.levels.map((l) => {
    const a = D.awards.find((x) => x.level_id === l.id);
    if (!AR_FOCUS[l.roman]) throw new Error(`No Arabic focus line for level ${l.roman}`);
    return `          <tr><td><strong>المستوى ${AR_LEVEL[l.id].ord} · ${AR_LEVEL[l.id].name}</strong></td>`
      + `<td>${ltr(l.cefr)}</td><td>${AR_FOCUS[l.roman]}</td><td>${ltr('10')}</td><td>${ltr('20')}</td><td>${ltr('200')}</td>`
      + `<td>${a ? ltr(a.post_nominal) : '—'}</td></tr>`;
  }).join('\n')}
          <tr><td colspan="3"><strong>المجموع</strong></td><td>${ltr('60')}</td><td>${ltr('120')}</td><td>${ltr('1,200')}</td><td>—</td></tr>
        </tbody>
      </table>
    </div>
    <p class="form-note">الساعة التأهيلية رقم تصميم لا قياس: هي حجم العمل الذي بُني عليه المنهج،
      ولم يُقَس بعد على متعلمين حقيقيين. ورصيد الكلية وحدة داخلية، وليس رصيدًا أوروبيًا ولا
      بريطانيًا معترفًا به.</p>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">ما يحتويه كل مستوى</span>
      <h2>الشكل نفسه في المستويات الستة.</h2>
    </div>
    <div class="grid grid--4">
${card('عشر', 'وحدات', 'كل وحدة موضوع متماسك، بدروس مخططة مرحلةً مرحلة بأزمنة معلنة.')}
${card('في كل وحدة', 'اختبار قصير وتكليف', 'الاختبار يقيس الاسترجاع ويُصحَّح آليًا؛ التكليف ينتج شيئًا ويصححه شخص وفق معيار منشور رأيته قبل أن تبدأ.')}
${card('عمل الاستماع', 'مجموعات استماع ونطق', 'نصوص مكتوبة بالكامل مع السمات المستهدفة محددة داخلها. التسجيلات الصوتية لها لم تُنتج بعد، وهذا مذكور لا مُوهَم.')}
${card('فحوص ذاتية', 'غير محتسبة عليك', 'لا تُصحَّح ولا تُسجَّل ضدك. وُجدت لتعرف ما لا تعرفه دون أن يكلفك ذلك شيئًا.')}
    </div>
    <div class="callout">
      <span class="callout__label">صفحات المستويات التفصيلية</span>
      <p>لكل مستوى صفحة تفصيلية بالعربية تعرض وحداته وتقييمه وطرائق تدريسه وشهادته:
        <a href="/ar/study/level-1/">المستوى الأول</a> ·
        <a href="/ar/study/level-2/">الثاني</a> · <a href="/ar/study/level-3/">الثالث</a> ·
        <a href="/ar/study/level-4/">الرابع</a> · <a href="/ar/study/level-5/">الخامس</a> ·
        <a href="/ar/study/level-6/">السادس</a>.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="learning" data-contents="كيف يجري التعلّم">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">كيف يجري التعلّم</span>
      <h2>شكل الأسبوع الدراسي.</h2>
      <p class="lede">معظم البرنامج يُدرس وقتما استطعت؛ وجزء أصغر مباشر يعتمد على حضور الآخرين.
        الجزء الأكبر دروس مرحلية بأزمنة معلنة تُستأنف من حيث توقفت؛ وعشر دقائق يوميًا للاستماع
        والتسجيل خير من ساعة أسبوعيًا؛ وتكليف واحد في كل وحدة يصححه شخص وفق معيار منشور؛
        وفحوص ذاتية لا تُحتسب عليك؛ وتقييم مستوى ختامي بمعايير معلنة من أول المستوى.</p>
    </div>
    <div class="callout">
      <span class="callout__label">للدراسة الذاتية وضع إخفاق معروف</span>
      <p>الدراسة الذاتية الكاملة للغة تنتهي غالبًا نهاية سيئة، وسببها مفهوم: لا مواعيد ثابتة،
        ولا زملاء في المرحلة نفسها، ولا شيء تتأخر عنه. الكلية تعمل اليوم بنظام ذاتي لأنه ما
        بُني، وقد صيغت توصية بإضافة إيقاع ثابت من جلسات مباشرة ونوافذ امتحان ولم تُعتمد بعد.
        إلى أن تُعتمد، البنية تأتي منك: ساعة ثابتة يوميًا تُنهي البرنامج حيث لا يُنهيه هدف
        أسبوعي بالساعات. والانخراط مُتابَع كي يُتواصل مع من انقطع في الشهر الثاني لا أن
        يُكتشف في الشهر الحادي عشر، ولا يترتب عليه جزاء أبدًا.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="campus" data-contents="الحرم الرقمي">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الحرم الرقمي</span>
      <h2>ستة أماكن يدخلها الشخص.</h2>
      <p class="lede">حيث يكون الشيء مبنيًا وغير مستعمَل، تقول هذه الصفحة «غير مستعمَل» لا
        «متاح».</p>
    </div>
    <div class="grid grid--2">
${darkCard('للمتعلم', 'أربعة أماكن للعمل', 'البوابة حيث تبدأ؛ وبرنامجي وفيه طريقك عبر المستوى بما اكتمل وما يليه؛ ومعمل الاستماع للتسجيل والنطق؛ وسجلي وفيه محاولاتك ودرجاتك بحسب المهارة وتحكّمك في مشاركة أي منها.')}
${darkCard('للطاقم وللعامة', 'مكانان آخران', 'مساحة المصحح حيث تُصحح التسليمات وفق معاييرها — مبنية ومختبرة ولم تصحح شيئًا لأنه لا شيء يُصحح بعد؛ والتحقق من الشهادات مفتوح لأي أحد دون حساب، ولم يصدر عبره شيء لأن شهادة لم تُمنح.')}
    </div>
    <div class="grid grid--2" style="margin-top:26px">
${darkCard('تسجيل دون اتصال', 'المعمل لا يشترط اتصالًا حيًا', 'التسجيل المُلتقط دون اتصال يُحفظ ويُرفع أجزاءً حين يعود الاتصال، فلا يضيع الملف بانقطاع. بُني هذا لأن الكلية تتوقع متعلمين في أماكن تنقطع فيها الاتصالات.')}
${darkCard('المسودات تبقى محلية', 'النص غير المكتمل لا يُرسل إلى أي مكان', 'ملاحظات العمل تبقى على جهازك حتى تُسلّم. التسليم وحده يحتاج الشبكة، والواجهة تقول أيهما أيّ بدل أن تترك التخمين لك.')}
    </div>
    <p class="form-note">ما تحتاجه لتشغيله: حاسوب أو جهاز لوحي أو هاتف بمتصفح حديث واتصال يبثّ
      الصوت؛ ويطلب معمل الاستماع أن تسجّل نفسك، وميكروفون الهاتف أو الحاسوب يكفي.</p>
    <div class="section-head" style="margin-top:38px">
      <span class="module-marker">حين لا يعمل شيء</span>
      <h2>ثلاث حالات شائعة، وجوابها.</h2>
    </div>
    <ol class="dot-list">
      <li><span class="num">01</span><span><strong>المسجّل لا يبدأ.</strong> على المتصفح أن يُمنح إذن استخدام الميكروفون، وهذا الإذن خاص بكل موقع ويسهل رفضه دون قصد. راجع أذونات الموقع في متصفحك قبل افتراض أن شيئًا معطوب.</span><span class="leader"></span></li>
      <li><span class="num">02</span><span><strong>انقطع الاتصال أثناء التسجيل.</strong> لا شيء يضيع. التسجيل لا يحتاج الشبكة؛ يُحفظ الملف ويُرفع أجزاءً حين يعود الاتصال.</span><span class="leader"></span></li>
      <li><span class="num">03</span><span><strong>نموذج تقديم أو دفع لم يكتمل.</strong> نموذج التقديم يتحوّل إلى رسالة بريد من جهازك ببياناتك معبأة، فيصل طلبك إلى القبول على أي حال. أما الدفع فلا تكرر المحاولة مرارًا — اكتب إلى الكلية بوقت العملية ومبلغها، وستُراجع مقابل السجل.</span><span class="leader"></span></li>
    </ol>
    <p class="form-note">ولأي شيء آخر: اكتب إلى <a href="mailto:info@worldwencollege.co.uk?subject=Technical" dir="ltr">info@worldwencollege.co.uk</a> ذاكرًا ما كنت تحاول فعله، وما الذي حدث، وعلى أي جهاز — هذه الحقائق الثلاث تحل أغلب المشكلات برسالة واحدة بدل أربع. أما التعثر في المادة نفسها لا في الأجهزة، فقسم <a href="/ar/students/#support">الدعم</a> يقول من يجيب.</p>
  </div>
</section>

<section class="section--paper section-pad" id="teaching" data-contents="التدريس">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التدريس</span>
      <h2>كيف تدرّس الكلية.</h2>
      <p class="lede">أربعة التزامات تشكّل كل درس: يُدرَّس بالإنجليزية من المستوى الأول، عبر لغة
        مقيدة وتكرار ودعم بصري لا عبر الترجمة؛ ويُكتب التقييم قبل التدريس الذي يختبره؛ ويُقيَّم
        التحدث بالتحدث، تسجيلًا يصححه شخص لا خوارزمية؛ ويخطط كل درس للمتعلم الذي لا يتابع —
        شرح ثانٍ، والأخطاء التي يثيرها الموضع، مكتوبة سلفًا لا مرتجلة. والعمود الوحيد الفارغ في
        سجل الدعم التعليمي هو المشاهدة الصفية: الكلية لم تدرّس أحدًا بعد، والسجل يفصل التصميم
        عن الدليل كي لا يقوم أحدهما مقام الآخر. التفاصيل الكاملة منشورة في
        <a href="/ar/academics/teaching/">ممارسة التدريس</a>.</p>
    </div>
    ${enOnly}
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    ${noAccreditation}
  </div>
</section>

${cta('اعثر على مستواك.', 'قدّم الآن', '/ar/admissions/#apply', 'اسأل عن تحديد المستوى', '/ar/contact/')}`,
};

// 9 · كيف يتم تقييمك ──────────────────────────────────────────────────
PAGES.students = {
  slug: 'students-ar', output: 'ar/students/index.html', file: 'students.ar.html',
  contents: true,
  altHref: '/students/',
  title: 'الحياة الطلابية — الكلية العالمية للغة الإنجليزية',
  description: 'ما تعنيه الدراسة في الكلية: كيف تُقيَّم، وسجلك الأكاديمي، ومعمل الاستماع، والدعم المتاح وما لا تقدمه الكلية.',
  body: `${hero('الطلاب', 'الحياة الطلابية.',
    'ما تعنيه الدراسة هنا: كيف تُقيَّم، وما يُحفظ في سجلك، وأين تتدرب على الاستماع والنطق، '
    + 'ومن يجيبك حين تحتاج عونًا — وما لا تقدمه الكلية، مذكورًا بالوضوح نفسه.')}

<section class="section--light section-pad" id="study" data-contents="الدراسة هنا">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الدراسة هنا</span>
      <h2>أربعة أبواب لطالب الكلية.</h2>
    </div>
    <div class="grid grid--2">
${card('التقييم', 'كيف يتم تقييمك', 'أدوات التقييم ومعاييرها والحدود الدنيا للمهارات — <a href="/ar/students/assessment/">الصفحة الكاملة</a>.')}
${card('السجل', 'الشهادات والمراتب', 'ما تمنحه الكلية وما لا تستطيع منحه بعد، وسجل من مُنح ماذا — <a href="/ar/students/awards/">الصفحة الكاملة</a>.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="lab" data-contents="معمل الاستماع">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">معمل الاستماع</span>
      <h2>حيث يُبنى النطق والاستماع.</h2>
      <p class="lede">مجموعات استماع بنصوص مكتوبة بالكامل، وأهداف نطق مسمّاة، وتسجيلاتك أنت
        محفوظة كي يكون التحسن مسموعًا لا مُدّعى. التسجيل يعمل دون اتصال ويُرفع حين يعود
        الاتصال، لأن الكلية تتوقع متعلمين في أماكن تنقطع فيها الشبكة. والتسجيلات الصوتية
        للمجموعات لم تُنتج بعد — النصوص مؤلفة والأصوات تحتاج استوديو — ويُذكر هذا لا يُوهَم
        خلافه.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="support" data-contents="الدعم">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الدعم</span>
      <h2>من يجيب.</h2>
      <p class="lede">سؤال أكاديمي يجيب عنه مدرّسك؛ وسؤال تقني أو إداري يجيب عنه الفريق المؤسس
        كتابةً. والانخراط مُتابَع كي يُتواصل مع من انقطع مبكرًا، ولا يترتب عليه جزاء أبدًا.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="boundaries" data-contents="ما لا تقدمه الكلية">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">ما لا تقدمه الكلية</span>
      <h2>مذكور بالوضوح نفسه.</h2>
      <p class="lede">لا تقدم الكلية إرشادًا نفسيًا ولا خدمات رفاه ولا نصح هجرة ولا تقييم إعاقة
        رسميًا — فذلك يحتاج مؤهلات لا تملكها، والإيحاء بغيره يخذل الناس في وقت حاجتهم. ما
        تستطيعه هو ترتيبات عملية غير رسمية عند الطلب: مشاركة صوتية فقط، ووقت إضافي، وصيغ
        بديلة — وهي عرض أصغر من سياسة، وتوصف بأنها الشيء الأصغر الذي هي عليه.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    ${noAccreditation}
  </div>
</section>

${cta('كيف يتم تقييمك.', 'التقييم', '/ar/students/assessment/', 'الشهادات والمراتب', '/ar/students/awards/')}`,
};

PAGES.assessment = {
  slug: 'students-assessment-ar', output: 'ar/students/assessment/index.html', file: 'students-assessment.ar.html',
  altHref: '/students/assessment/',
  title: 'كيف يتم تقييمك — الكلية العالمية للغة الإنجليزية',
  description: 'المهارات اللغوية الأربع، والمعايير المنشورة قبل التقييم، والعتبة التي تطبقها المنصة اليوم.',
  body: `${hero('الطلاب', 'كيف يتم تقييمك.',
    'التقييم في الكلية يُكتب قبل التدريس الذي يختبره، ويُنشر قبل أن تخوضه، ويُبلَّغ بحسب المهارة '
    + 'لا كرقم واحد. هذه الصفحة تشرح كل اختيار من الثلاثة، لأن كل واحد منها يكلّف الكلية شيئًا.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المهارات الأربع</span>
      <h2>تُصحَّح منفصلة، وتُبلَّغ منفصلة.</h2>
      <p class="lede">الدرجة المجمّعة الواحدة تُخفي أكثر ما يحتاج متعلم اللغة إلى معرفته.</p>
    </div>
    <div class="grid grid--4">
${card('استقبالية', 'الاستماع', 'فهم الكلام بسرعته الطبيعية، بما في ذلك اللهجات غير المألوفة والظروف غير المثالية.')}
${card('استقبالية', 'القراءة', 'القراءة للحجّة وللتفصيل، لا للفكرة العامة فقط، عبر مستويات لغوية مختلفة.')}
${card('إنتاجية', 'التحدّث', 'التحدّث بضبط للقواعد والنطق ومستوى اللغة، في الزمن الحقيقي.')}
${card('إنتاجية', 'الكتابة', 'الكتابة لغرض ولقارئ، ثم المراجعة.')}
    </div>
    <div class="callout">
      <span class="callout__label">لماذا لا درجة واحدة</span>
      <p>المتعلم الذي يقرأ جيدًا ولا يُفهم حين يتكلم لديه مشكلة خطيرة ومحددة، ودرجة مجمّعة
        قدرها <span dir="ltr">74%</span> تخفيها إخفاءً تامًا. فصل المهارات هو ما يجعل الضعف
        ظاهرًا في وقت يسمح بمعالجته.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الدرجات</span>
      <h2>القواعد التي تُنتج الدرجة.</h2>
      <p class="lede">ثلاث قواعد تبدو كلها «درجة النجاح» وتحكم أشياء مختلفة: إتمام الوحدة، واجتياز امتحان المستوى، ونيل مرتبة. الثلاث نافذة، والجدول يبيّن أيها يحكم ماذا.</p>
    </div>

    <!-- سلّم المراتب مرسومًا. الجدول أدناه يذكر العتبات؛ والرسم يُظهر ما
         لا يستطيع الجدول إظهاره: أن المسافة بين الحدّ الأدنى والدرجة
         الإجمالية تضيق كلما ارتفعت المرتبة. -->
    <figure class="diagram diagram--wide">
      {{SVG:assets/art/award-standard.ar.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-scales"/></svg>
        الشريط هو حدّ التعويض المسموح &mdash; وهو يضيق كلما ارتفعت المرتبة
      </figcaption>
    </figure>

    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>القاعدة</th><th>الحالة</th><th>ما تحكمه</th></tr></thead>
        <tbody>
          <tr><td><strong>${ltr(PASS_PCT + '%')} لإتمام الوحدة</strong></td><td><strong>نافذة</strong></td>
              <td>العتبة التي تطبقها المنصة اليوم عند اعتبار الوحدة مكتملة. محفوظة في إعدادات الكلية لا مكتوبة في الشيفرة، حتى يكون تغييرها قرارًا مسجَّلًا.</td></tr>
          <tr><td>امتحان المستوى: ${ltr(PASS_PCT + '%')} إجمالًا، ولا معيار دون ${ltr('50%')}</td><td><strong>نافذة</strong></td>
              <td>المعيار الختامي. الدرجة المجمّعة وحدها تتيح النجاح مع الرسوب التام في بُعد واحد؛ ومعايير التصحيح تصحّح المحاور منفصلة أصلًا، فالحد الأدنى لا يكلّف شيئًا.</td></tr>
          <tr><td>نجاح عند ${ltr(PASS_PCT + '%')}، ولا مهارة دون ${ltr('60%')}</td><td><strong>نافذة</strong></td>
              <td>معيار الشهادة، اعتُمد في 14 أغسطس 2026 بقرار من الجهة التنفيذية، على أن يصادق عليه المجلس الأكاديمي حين تُعيَّن أعضاؤه. لم يُطبَّق على أحد، لأنه لم يُقيَّم أحد.</td></tr>
          <tr><td>امتياز عند ${ltr('80%')}، ولا مهارة دون ${ltr('70%')}</td><td><strong>نافذة</strong></td><td>كما سبق.</td></tr>
          <tr><td>تميّز عند ${ltr('88%')}، ولا مهارة دون ${ltr('80%')}</td><td><strong>نافذة</strong></td><td>كما سبق.</td></tr>
          <tr><td>تميّز عالٍ عند ${ltr('94%')}، ولا مهارة دون ${ltr('88%')}</td><td><strong>نافذة</strong></td><td>كما سبق.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">الحدود الدنيا، ولماذا هي غير معتادة</span>
      <p>تسمح معظم الأطر بأن تعوّض مهارة قوية عن مهارة ضعيفة بلا حد. هذا الإطار لا يسمح: الدرجة
        الكلية لا تحمل مهارة دون حدها الأدنى. والسبب صريح — الخريج الذي يكتب ببراعة ولا يُفهم
        حين يتكلم لم يتقن الإنجليزية، وشهادة تقول غير ذلك ستضطر الكلية للدفاع عنها أول مرة
        يقابله فيها صاحب عمل. والحدود لا تكلّف شيئًا في التطبيق لأن المهارات مصحَّحة منفصلة
        أصلًا.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">معايير التصحيح</span>
      <h2>ترى المعايير قبل أن تُصحَّح بها.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('منشورة أولًا', 'قبل التقييم لا بعده', 'كل تكليف يحمل معياره معه. أن تُخبَر لاحقًا بما كنت تُقيَّم عليه ليس تغذية راجعة، بل تبرير لحكم.')}
${darkCard('سياسة واحدة', 'الشكل نفسه في كل مكان', 'المعايير الستون كلها تتبع سياسة منشورة واحدة في المحاور والأوزان والوصف، وفحص آلي يُفشل البناء إن انحرف واحد منها. الاتساق عبر برنامج بهذا الحجم لا يُدرَك بحسن النية.')}
${darkCard('يصححها شخص', 'لا تصحيح آلي للكتابة أو الكلام', 'ليس لدى الكلية محرك تصحيح آلي ولا تدّعيه. الاختبارات القصيرة تُصحَّح آليًا؛ وكل ما يتطلب حكمًا يحكم فيه إنسان.')}
    </div>
  </div>
</section>

${cta('انظر ما يمكن منحه.', 'الشهادات والمراتب', '/ar/students/awards/', 'المستويات الستة', '/ar/academics/#levels')}`,
};

// 10 · الشهادات ───────────────────────────────────────────────────────
PAGES.awards = {
  slug: 'students-awards-ar', output: 'ar/students/awards/index.html', file: 'students-awards.ar.html',
  altHref: '/students/awards/',
  title: 'الشهادات والمراتب — الكلية العالمية للغة الإنجليزية',
  description: 'شهادات المستويات الستة ورموزها، والمراتب المعتمدة، ولماذا لم تُمنح شهادة لأحد بعد.',
  body: `${hero('الطلاب', 'الشهادات والمراتب.',
    'ست شهادات، واحدة لكل مستوى، لكل منها اسمها ورمزها. ولم تُمنح أي منها لأحد، وهذه الصفحة '
    + 'تشرح لماذا هو قرار لا تأخير.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الشهادات</span>
      <h2>واحدة لكل مستوى.</h2>
      <p class="lede">كل شهادة تسمي مكانةً حقيقية لا تزيّن إتمامًا. والأولى متواضعة عن قصد،
        لأن الأولى هي حيث يتوقف أكثر الناس.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المستوى</th><th><span dir="ltr">CEFR</span></th><th>الشهادة</th><th>الرمز</th></tr></thead>
        <tbody>
${D.awards.map((a) => {
    const l = D.levels.find((x) => x.id === a.level_id);
    if (!l) throw new Error(`Award ${a.id} names a level that does not exist`);
    return `          <tr><td><strong>المستوى ${AR_LEVEL[l.id].ord}</strong></td><td>${ltr(a.cefr)}</td>`
      + `<td dir="ltr">${esc(a.official_title)}</td><td><strong dir="ltr">${esc(a.post_nominal)}</strong></td></tr>`;
  }).join('\n')}
        </tbody>
      </table>
    </div>
    <p class="form-note">تُعرض أسماء الشهادات ورموزها بالإنجليزية كما تُمنح. ترجمة اسم شهادة
      إلى العربية تُنتج اسمًا ثانيًا لا يطابق ما هو مكتوب على المستند نفسه.</p>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المراتب</span>
      <h2>معتمدة، ولم تُطبَّق على أحد.</h2>
      <p class="lede">اعتُمد النظام أدناه في 14 أغسطس 2026 بقرار من الجهة التنفيذية، على أن
        يصادق عليه المجلس الأكاديمي حين تُعيَّن أعضاؤه. وهو نافذ، ولم يُطبَّق على أحد لأنه لم
        يُقيَّم أحد — وهاتان عبارتان مختلفتان.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المرتبة</th><th>الدرجة الكلية</th><th>الحد الأدنى للمهارة</th></tr></thead>
        <tbody>
          <tr><td><strong>نجاح</strong></td><td>${ltr(PASS_PCT + '%')}</td><td>لا مهارة دون ${ltr('60%')}</td></tr>
          <tr><td><strong>امتياز</strong></td><td>${ltr('80%')}</td><td>لا مهارة دون ${ltr('70%')}</td></tr>
          <tr><td><strong>تميّز</strong></td><td>${ltr('88%')}</td><td>لا مهارة دون ${ltr('80%')}</td></tr>
          <tr><td><strong>تميّز عالٍ</strong></td><td>${ltr('94%')}</td><td>لا مهارة دون ${ltr('88%')}</td></tr>
          <tr><td><strong>تميّز الكلية</strong></td><td colspan="2">يُمنح بقرار لا بحساب، وقد لا يُمنح في أي دورة. سُمّي باسم المؤسسة لأنه لا يوجد رئيس فخري للكلية.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="form-note">لم يُمنح أي تميّز أكاديمي لأحد. السجل الذي يحمله فارغ، وهذه الصفحة
      مولَّدة منه.</p>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">لماذا لم تُمنح شهادة</span>
      <h2>الشخص الناقص، لا الورق الناقص.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('السبب', 'لا ممتحن خارجي معيَّن', 'وظيفة الممتحن الخارجي أن يكون خارج الكلية — أن يؤكد أن معاييرها هي ما تقول إنها هي، بشخص لا مصلحة له في الجواب. منح شهادة بدونه يجعل الشهادة أقل قيمة لا أكثر، وسيلزم نقضها لاحقًا لا ترقيتها.')}
${darkCard('النتيجة', 'لا خريجون ولا إحصاءات خريجين', 'لا تنشر الكلية نسب إتمام ولا نتائج توظيف ولا أعداد خريجين، لأنها لا توجد. كل رقم من هذا النوع على موقع مؤسسة جديدة إما مستعار وإما مختلق.')}
${darkCard('الالتزام', 'لن يُعكس الترتيب', 'يُعيَّن الممتحن أولًا وتُمنح الشهادات بعده. العكس أرخص وأسرع، ويفسد على نحو دائم كل مستند تصدره الكلية على الإطلاق.')}
    </div>
    ${enOnly}
  </div>
</section>

${cta('كيف يُضبط المعيار.', 'ضمان الجودة', '/ar/governance/#quality', 'كيف يتم تقييمك', '/ar/students/assessment/')}`,
};

// 11 · ضمان الجودة ────────────────────────────────────────────────────
PAGES.privacy = {
  slug: 'support-privacy-ar', output: 'ar/support/privacy/index.html', file: 'support-privacy.ar.html',
  altHref: '/support/privacy/',
  title: 'الخصوصية وبياناتك — الكلية العالمية للغة الإنجليزية',
  description: 'ما يجمعه هذا الموقع وما لا يجمعه، ومن الأطراف الثالثة، والمسؤولية التي لم تُعيَّن بعد.',
  body: `${hero('الدعم', 'الخصوصية وبياناتك.',
    'ما يجمعه هذا الموقع، وأي أطراف ثالثة تشارك فيه، والثغرة الوحيدة في المسؤولية التي يجب '
    + 'على الكلية إعلانها لا تمريرها.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الجزء غير المعتاد أولًا</span>
      <h2>هذا الموقع لا يشغّل أي تحليلات ولا أي أدوات تتبّع.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">لا قياس من طرف ثالث من أي نوع</span>
      <p>لا توجد منصة تحليلات، ولا بكسل إعلاني، ولا خرائط حرارية، ولا تسجيل للجلسات، ولا أي
        سكربت قياس من طرف ثالث في أي موضع من هذا الموقع. لا أحد يقيس زيارتك، لا هنا ولا في
        غيره. يُذكر هذا أولًا لأنه غير معتاد، ولأن صفحة خصوصية تبدأ بالتعريفات وتدفن الجوهر هي
        صفحة صُممت لئلا تُقرأ. وفحص آلي يرفض بناء هذه الصفحة إن ظهرت أداة تتبّع في سكربتات
        الموقع.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">ما يُجمع</span>
      <h2>نموذجان، وأحدهما لا يرسل شيئًا.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>أين</th><th>ماذا</th><th>إلى أين</th></tr></thead>
        <tbody>
          <tr><td><strong>نموذج التقديم</strong></td><td>الاسم والبريد الإلكتروني والبلد، والمستوى المقدَّر ذاتيًا إن أجريته</td><td>قاعدة بيانات الكلية، عبر اتصال مشفَّر</td></tr>
          <tr><td><strong>نموذج الاستفسار</strong></td><td>لا شيء</td><td>لا مكان. يفتح تطبيق البريد لديك برسالتك جاهزة — لا خدمة نماذج متصلة بالكلية.</td></tr>
          <tr><td><strong>التقييم الذاتي للمستوى</strong></td><td>إجابتك</td><td>متصفحك أنت، ليعرضها نموذج التقديم عليك. لا تُرسَل وحدها إلى أي مكان.</td></tr>
          <tr><td><strong>كطالب</strong></td><td>المحاولات والدرجات والتغذية الراجعة والملاحظات والتسجيلات الصوتية</td><td>قاعدة بيانات الكلية وتخزين ملفاتها الخاص</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الأطراف الثالثة</span>
      <h2>ثلاثة، بالاسم.</h2>
      <p class="lede">عبارة «قد نشارك بياناتك مع مزوّدي الخدمة» لا تسمّي أحدًا. هؤلاء هم
        الفعليون.</p>
    </div>
    <div class="grid grid--3">
${darkCard('الاستضافة', ltr('Cloudflare'), 'هذا الموقع وقاعدة بيانات الكلية وتخزين ملفاتها تعمل جميعًا على بنية <span dir="ltr">Cloudflare</span>. وما يُخزَّن يُخزَّن هناك.')}
${darkCard('تسجيل الدخول', ltr('Clerk'), 'حسابات الطلاب والموظفين تديرها خدمة مصادقة، فكلمة مرورك محفوظة لديها لا لدى الكلية. وهذا يسري بعد أن يصير لك حساب فقط — تصفّح هذا الموقع لا يتضمن تسجيل دخول أصلًا.')}
${darkCard('الدفع', 'البوابة التي تختارها', 'بيانات البطاقة أو الدفع المحلي تُدخَل لدى مزوّد الدفع لا لدى الكلية. تسجّل الكلية أن السداد تم ومبلغه ومرجعه؛ ولا ترى رقم بطاقة ولا تخزنه.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المسؤولية</span>
      <h2>الثغرة، تُذكر لا تُمرَّر.</h2>
    </div>
    <div class="grid grid--2">
${card('غير معيَّن', 'مسؤول عن حماية البيانات', 'لا تستطيع الكلية بعد تسمية شخص مسؤول عن كيفية التعامل مع البيانات الشخصية وحفظها ومحوها. المنصب مدرج في جدول التعيينات، وإلى أن يُشغَل يجيب الفريق المؤسس عن هذه الأسئلة.')}
${card('غير مقرَّر', 'مدة الحفظ والمحو', 'كم تُحفظ التسجيلات الصوتية للمتعلم، وماذا يعني المحو أمام سجل أكاديمي يُقصد به الدوام، قراران حاكمان مفتوحان. نشر مدة حفظ لم تقررها الكلية هو اختلاق سياسة على موقع.')}
    </div>
    <div class="callout">
      <span class="callout__label">للسؤال عن بياناتك</span>
      <p>اكتب إلى <a href="mailto:info@worldwencollege.co.uk" dir="ltr">info@worldwencollege.co.uk</a>.
        تُجاب الطلبات من شخص، كتابةً، ويُسجَّل الجواب.</p>
    </div>
    ${enOnly}
  </div>
</section>

${cta('ماذا يُحفظ عن الطالب.', 'سياسة القبول', '/ar/admissions/#apply', 'أسئلة القبول', '/ar/faq/')}`,
};

// 13 · الحوكمة ────────────────────────────────────────────────────────
//
// WHY THIS ONE BROKE THE ORIGINAL TWELVE
//
// The twelve editions above were chosen on one test: where an Arabic
// reader is making a decision that costs them money or time. Governance
// did not obviously pass it, so it was left in English.
//
// What changed the answer was the drawing. /about/governance/ carries
// the authority chain — the diagram that shows the structure complete
// in design and broken at exactly one link — and an argument made in a
// picture does not need a reader fluent in English. It needs a reader
// who can read its labels. Leaving it English-only meant the College's
// single most candid page reached the audience it was least written
// for, and the diagram sat behind a language barrier it did not have.
//
// It also fails the other test on inspection. An institutional buyer in
// the Gulf — a ministry, an employer, a family's adviser — is exactly
// the reader who asks who signed a thing, and this is the page that
// answers. That reader was being sent to a page in a second language to
// find out that the boards are empty.
// The competency NAMES are translated; the definitions are re-authored
// in Arabic rather than rendered word-for-word, because each definition
// was written to be arguable and a literal translation of an epigram is
// usually neither literal nor an epigram. Used by the BASCE section of
// the governance pillar below.
const AR_COMPETENCY = [
  ['الوضوح', 'يُفهم من المرة الأولى، من الحاضرين فعلًا لا من قارئ مثالي.'],
  ['التمكّن', 'يتحكم في اللغة بدل أن تحمله هي.'],
  ['التمييز', 'يختار المستوى والقناة واللحظة، ويعرف ما لا يُقال.'],
  ['الاستدلال', 'يبني الحجة، ويختبرها، ويسلّم بما ينبغي التسليم به.'],
  ['الحضور', 'يمسك قاعة، أو مكالمة، أو محادثة صعبة.'],
  ['الامتداد', 'يخاطب عبر الثقافات، وعبر المسافة بين المتخصص وغير المتخصص.'],
];

PAGES.governance = {
  slug: 'governance-ar', output: 'ar/governance/index.html', file: 'governance.ar.html',
  contents: true,
  altHref: '/governance/',
  title: 'الحوكمة | من يقرر وبأي صلاحية — الكلية العالمية للغة الإنجليزية',
  description: 'الهيئتان الأكاديميتان للكلية، وصلاحية كل منهما، وحقيقة أنه لم يُعيَّن فيهما عضو واحد بعد.',
  body: `${hero('عن الكلية', 'من يقرر، وبأي صلاحية.',
    'تفصل الكلية بين الحكم الأكاديمي والحوكمة المؤسسية وضمان الجودة والشؤون المالية '
    + 'والإدارة اليومية. تسمّي هذه الصفحة من يتولّى كلًّا منها، وتقول صراحةً أي المناصب '
    + 'لم تُشغَل بعد، لأن صفحة حوكمة تُقرأ وكأن كل المجالس منعقدة ستكون أخطر ما يمكن أن '
    + 'يُكتب على هذا الموقع.')}

${GOV.leadershipAR()}

<section class="section--light section-pad" id="authority">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الهيئتان الأكاديميتان</span>
      <h2>الهيئتان، وصلاحية كل منهما.</h2>
    </div>
    <div class="grid grid--2">
      <div class="card">
        <span class="card__num">${ltr('BASCE')}</span>
        <h3>مجلس المعايير الأكاديمية والتميّز المنهجي</h3>
        <p>يحدّد كفايات الكلية؛ ويربط كل تقييم بكفاية أو أكثر؛ ويضمن أن كل كفاية تُقاس مرات
          متعددة في كل مستوى؛ ويقرّ أوصاف الكفايات؛ ويراجع الربط سنويًا؛ ويحفظ تماسك إطار
          الكفايات.</p>
        <p class="before"><b>تاريخ التأسيس</b> ${ltr('2026-08-04')} &middot;
          <b>الأعضاء المعيَّنون</b> ${ltr('0')}</p>
      </div>
      <div class="card">
        <span class="card__num">${ltr('SENATE')}</span>
        <h3>المجلس الأكاديمي</h3>
        <p>يقرّ الربط بين التقييمات والمهارات اللغوية الأربع، ويقرّ عتبات الوصف التي تحوّل
          الأدلة المُقيَّمة إلى وصف مهارة.</p>
        <p class="before"><b>تاريخ التأسيس</b> ${ltr('2026-08-04')} &middot;
          <b>الأعضاء المعيَّنون</b> ${ltr('0')}</p>
      </div>
    </div>
    <div class="callout">
      <span class="callout__label">ماذا يعني هذان الرقمان</span>
      <p><b>مجلس المعايير بلا أعضاء</b>، والهيئة بلا أعضاء لا تستطيع إقرار شيء. فكل قرار
        يخصّ الكفايات يُسجَّل <b>مؤقتًا</b>، مُتَّخذًا بصلاحية مفوَّضة إلى المطبعة،
        ومُعلَّمًا في قاعدة البيانات بالهيئة التي ينتظرها.</p>
      <p><b>وللمجلس الأكاديمي ${GOV.SENATE_MEMBERS}</b>، ولم ينعقد بعد. وهذا موضع مختلف عن
        الأول لكنه يؤدي اليوم إلى النتيجة نفسها: الهيئة التي تستطيع الإقرار ولم تجتمع لم
        تُقِرّ شيئًا، فتبقى روابط المهارات وعتبات الوصف مؤقتة أيضًا. وتتغيّر حالتها بوجود
        قرار مُثبَت في محضر، لا بوجود خطاب تعيين.</p>
    </div>

    <!-- The same drawing the English page carries, mirrored. The chain
         runs right to left, the break sits at the same link, and the
         vacancy register hangs off the right margin. Generated by
         scripts/art/generate-authority-chain.mjs ar — see the note in
         that file on why a flow diagram cannot simply be relabelled. -->
    <figure class="diagram diagram--wide">
      {{SVG:assets/art/authority-chain.ar.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-columns"/></svg>
        هيئتان، وسببان مختلفان لعدم اعتماد شيء بعد
      </figcaption>
    </figure>
  </div>
</section>

<section id="basce" data-contents="مجلس المعايير" class="section--light section-pad">
  <div class="container reveal">
    <div class="stat-row">
      <div class="stat-row__item"><b>${ltr('BASCE')}</b><span>الرمز</span></div>
      <div class="stat-row__item"><b>${ltr('2026-08-04')}</b><span>تاريخ التأسيس</span></div>
      <div class="stat-row__item"><b>${ltr('0')}</b><span>الأعضاء المعيَّنون</span></div>
      <div class="stat-row__item"><b>${ltr(String(AR_COMPETENCY.length))}</b><span>الكفايات المعرَّفة</span></div>
    </div>
    <div class="section-head">
      <span class="module-marker">الصلاحية</span>
      <h2>ما يقرره المجلس.</h2>
      <p class="lede">يحدّد كفايات الكلية؛ ويربط كل تقييم بكفاية أو أكثر؛ <b>ويضمن أن كل كفاية
        تُقاس مرات متعددة في كل مستوى</b>؛ ويقرّ أوصاف الكفايات؛ ويراجع الربط سنويًا؛ ويحفظ
        تماسك إطار الكفايات.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الإطار</span>
      <h2>الكفايات الست.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">الكفاية</th><th scope="col">التعريف</th></tr></thead>
        <tbody>
${AR_COMPETENCY.map(([nm, def]) => `          <tr><td><b>${nm}</b></td><td>${def}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التغطية</span>
      <h2>كم مرة تُقاس كل كفاية فعلًا.</h2>
      <p class="lede">الجدول أعلاه يقول ما هي الكفايات الست. ولا يستطيع أن يقول كم وزنًا تحمل
        كل واحدة منها اليوم، والجواب أنفع ما في هذه الصفحة.</p>
    </div>

    <figure class="diagram diagram--wide">
      {{SVG:assets/art/competency-wheel.ar.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-compass"/></svg>
        مقيسة على صلاحية المجلس نفسها
      </figcaption>
    </figure>

    <div class="callout">
      <span class="callout__label">ماذا يقول الشكل</span>
      <p>التمكّن والوضوح يحملان معظم المستوى الأول. أما التمييز فيُقاس أربع مرات، والاستدلال
        مرة واحدة، والحضور والامتداد لا يُقاسان في المستوى الأول أصلًا. وبالقياس إلى الصلاحية
        المذكورة أعلى الصفحة &mdash; <em>أن تُقاس كل كفاية مرات متعددة في كل مستوى</em> &mdash;
        فثلاث من الست تتجاوز الحدّ اليوم.</p>
      <p>يُنشر هذا كما هو ولا يُملَّس، للسبب نفسه الذي يجعل الارتباطات مسجَّلة مؤقتة: إطار
        يبلّغ عن تغطية متوازنة لا يملكها أقل قيمة من إطار يبلّغ عن تغطية متفاوتة يملكها.
        الفجوة هي العمل، وتسميتها هي طريقة إغلاقها.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الموقف الحالي</span>
      <h2>معرَّفة، ومربوطة، وغير مُقرَّة بعد.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('معرَّفة', 'ست كفايات', 'لكل منها تعريف كُتب ليكون قابلًا للنقاش لا عصيًّا على التفنيد. عبارة «يُفهم من المرة الأولى من الحاضرين فعلًا» يمكن الاعتراض عليها؛ أما «مهارات تواصل ممتازة» فلا.')}
${darkCard('مربوطة', 'المستوى الأول وحده حتى الآن', 'كل تقييم في المستوى الأول مربوط بالكفايات التي يدل عليها، مع وزن ومسوّغ مكتوب. والمستويات من الثاني إلى السادس بلا أي ارتباط بالكفايات بعد.')}
${darkCard('غير مُقرَّة', 'لا أعضاء معيَّنون', 'كل ارتباط مسجَّل مؤقتًا. الهيئة بلا أعضاء لا تستطيع الإقرار، ويفشل البناء إن وُسم أي ارتباط بأنه مُقَر بينما عدد الأعضاء صفر.')}
    </div>
    ${noAccreditation}
  </div>
</section>

<section class="section--light section-pad" id="standard">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المعيار</span>
      <h2>ما يتطلبه حفظ المعيار فعلًا.</h2>
    </div>
    <div class="grid grid--4">
${card('الأول', 'يُنشر قبل أن يُطبَّق', 'المخرجات ومعايير التصحيح وعتبات النجاح تُنشر للمتعلم قبل التقييم لا تُشرح بعده. المعيار الذي يُكشف بعد الحدث ليس معيارًا، بل تبرير.')}
${card('الثاني', 'تُصحَّح منفصلة، ولها حدود دنيا', 'المهارات اللغوية الأربع تُصحَّح منفصلة، والدرجة الكلية لا تحمل مهارة دون حدها. التعويض غير المحدود هو كيف تصف شهادةٌ شخصًا لا يُفهم حين يتكلم.')}
${card('الثالث', 'يُكتب قبل التدريس', 'كل تقييم موجود قبل الدرس الذي يختبره، فيُبنى التدريس نحو المعيار بدل أن يُجمَّع المعيار بعده مما تصادف تدريسه.')}
${card('الرابع', 'يؤكده الخارج، أو لا يُؤكَّد', 'لا شيء داخلي يستطيع إثبات أن المستوى في الموضع الذي يقول إنه فيه. ذلك يتطلب ممتحنًا خارجيًا، ولا ممتحن معيَّنًا — ولهذا لم تُمنح شهادة.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">مُنفَّذ لا منويّ</span>
      <h2>الأجزاء التي تفحصها آلة.</h2>
      <p class="lede">برنامج بهذا الحجم لا يُحفظ متسقًا بالعناية. عدة خصائص تُفشل البناء حين
        تُكسر، وهذا هو الشكل الوحيد من الاتساق الذي ينجو من سنة من التعديلات.</p>
    </div>
    <div class="grid grid--3">
${card('التسلسل', 'كل متطلب سابق يُدرَّس قبله', 'الدرس الذي يعتمد على شيء يدرّسه البرنامج لاحقًا — أو لا يدرّسه أصلًا — خلل لا تجده المراجعة اليدوية بموثوقية.')}
${card('المعايير', 'سياسة منشورة واحدة عبرها جميعًا', 'المحاور والأوزان والوصف تتبع سياسة واحدة، تُفحص آليًا. ستون معيارًا تتباعد من تلقاء نفسها بغير ذلك.')}
${card('الادعاءات', 'الأرقام المنشورة تطابق السجل', 'كل رقم على هذا الموقع يُفحص مقابل المنهج الذي يصفه. الرقم المنشور الذي كفّ بهدوء عن كونه صحيحًا هو كيف تصل مؤسسة إلى وصف نفسها وصفًا خاطئًا.')}
    </div>
    <div class="callout">
      <span class="callout__label">المصطلحات الغامضة تُسحب، ويُفرض سحبها</span>
      <p>كانت كلمة واحدة تحمل ثلاثة معانٍ مختلفة عبر المنهج والجدول والمنصة، وبسببها انحرف رقم
        منشور عن البرنامج المقدَّم لأشهر. الغموض ليس مشكلة أسلوب؛ هو الطريق الذي تصل به مؤسسة
        إلى وصف نفسها وصفًا خاطئًا.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="quality">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">ضمان الجودة</span>
      <h2>واحدة تدور مع كل تعديل، والأخرى لم تدر قط.</h2>
      <p class="lede">القسمان أعلاه ليسا قائمتين من النوع نفسه، بل حلقتان تدوران بسرعتين
        مختلفتين تمامًا، وهو ما تقوله الصفحة في جملة دون أن يراه أحد تمامًا.</p>
    </div>

    <figure class="diagram diagram--wide">
      {{SVG:assets/art/quality-cycle.ar.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-clocktower"/></svg>
        الحلقة لا تكون حلقة حتى تدور مرة
      </figcaption>
    </figure>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">ما سيجده المراجع</span>
      <h2>يُذكر قبل أن يسأل.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('موجود', 'برنامج كامل وموثَّق', 'مواصفات ومخرجات وساعات ومعايير تصحيح وربط بالكفايات، وسجل أدلة من سبعة وثلاثين بندًا عبر ثلاث وعشرين مجموعة.')}
${darkCard('غير موجود', 'كل ما يتطلب طرفًا خارجيًا أو اجتماعًا لم يُعقد', 'لا اعتماد، ولا ممتحن خارجي، ولا مراجع أكاديمي، ولا أعضاء في مجلس المعايير، ولا بند دليل واحد مُقَر، ولا دفعة دُرِّست، ولا خريجون. وقد عُيِّن مجلس الأمناء والمجلس الأكاديمي والإدارة التنفيذية في الرابع عشر من أغسطس ٢٠٢٦، واتُّخذت القرارات الحاكمة الثلاثون جميعها، ولم يُحرِّك ذلك أيًّا مما سبق — لأن كل بند منه يتطلب شخصًا من خارج الكلية، أو اجتماعًا لم يُعقد بعد.')}
    </div>
    <p class="form-note">لم يُقَر أي من بنود سجل الأدلة السبعة والثلاثين. الإقرار ليس إجراءً
      شكليًا، بل شخص مسمّى يتحمل مسؤولية مستند؛ وهيئتا الكلية الأكاديميتان بلا أعضاء معيَّنين،
      فلا أحد يستطيع إقرار شيء. المؤسسة التي تُقِرّ أدلتها بنفسها بهدوء يكون لديها سجل كامل وضمان
      معدوم.</p>
    ${enOnly}
  </div>
</section>

<section class="section--light section-pad" id="verification">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التحقق</span>
      <h2>يستطيع أي أحد التحقق من الشهادة. ولم تصدر شهادة بعد.</h2>
      <p class="lede">يستطيع حامل رمز التحقق أن يتحقق من شهادته دون حساب أو إذن من الكلية،
        والمسار مبني ومفتوح قبل أول شهادة عمدًا: إلحاق التوقيع بشهادة صدرت من قبل لا يثبت شيئًا
        عن وقت صدورها. الشهادات موقَّعة تشفيريًا، والتحقق يفحص التوقيع لا يعرضه، والظهور في
        السجل العام قرار الخريج لا نتيجة تخرجه. ولم تُمنح شهادة، فلم يجرِ تحقق من شيء بعد.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="research">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">البحث العلمي</span>
      <h2>لا نتائج بحثية. أربعة أسئلة قابلة للإجابة.</h2>
      <p class="lede">لا تجري الكلية أي بحث: لا أوراق ولا مؤتمرات ولا مشاريع ممولة ولا باحثين
        ولا نتائج. موقف المؤسسة الجديدة من البحث جدول أعمال لا نتاج: أسئلة ولّدها بناء البرنامج
        نفسه — هل يغيّر إعلان أزمنة المراحل سيرَ الدرس فعلًا؟ هل تطابق الأخطاء المكتوبة أخطاء
        المتعلمين الحقيقية؟ هل يحسّن الاحتفاظ بالتسجيلات النطق؟ هل تغيّر الحدود الدنيا للمهارات
        من ينجح؟ — وكل سؤال منها يمكن أن يجيب عنه فصل دراسي أول. وإن أُجيب عن أي منها نُشرت
        الإجابة، وبخاصة إن جاءت ضد قرار تصميمي منشور.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="decisions">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">كيف تُسجَّل القرارات</span>
      <h2>كل قرار أكاديمي يحمل صلاحيته.</h2>
    </div>
    <div class="grid grid--3">
${card('من قرّر', 'صلاحية مسمّاة', 'كل ربط ومخرَج وعتبة يسجّل الهيئة التي اتُّخذ تحتها &mdash; المجلس المنهجي أو المجلس الأكاديمي &mdash; ويسجّل حالته. ولا شيء يُسجَّل بوصفه صحيحًا فحسب.')}
${card('على أي أساس', 'مسوّغ مذكور', 'كل ربط بكفاية يحمل مسوّغًا يشرح لماذا يدلّ ذلك التقييم على تلك الكفاية. والربط بلا مسوّغ رأيٌ اكتسب سلطة سطرٍ في قاعدة بيانات.')}
${card('متى يُراجَع', 'دورة سنوية', 'يُراجَع الإطار سنويًا في ضوء ما ينتجه التدريس من أدلة. ولا يمكن أن تبدأ الدورة الأولى قبل تدريس دفعة، والسجل يقول ذلك بدل وصف دورة لم تدر قط.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="vacant">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">مناصب لم تُشغَل بعد</span>
      <h2>ما لا تملكه الكلية.</h2>
      <p class="lede">مذكورة لا محذوفة. كل واحد منها يعطّل أمرًا بعينه، وتسمية ما يعطّله أنفع
        من صفحة تقف عند حدّ الصمت.</p>
    </div>
    <div class="grid grid--2">
${darkCard('ممتحن خارجي', 'شرط قبل منح أي شهادة', 'المنصب المستقل الذي وظيفته كلها أن يكون خارج الكلية. وإلى أن يُشغَل تبقى الشهادات معرَّفة ومنشورة ولا يمكن منحها لأحد على وجه صحيح. ولا يغني عنه أي تعيين داخلي، ولذلك لم يُغيّره تشكيل مجلس الأمناء والمجلس الأكاديمي والإدارة التنفيذية.')}
${darkCard('أعضاء مجلس المعايير', 'شرط قبل إقرار الكفايات', 'مجلس المعايير الأكاديمية والتميّز المنهجي بلا أعضاء معيَّنين. والإقرار &mdash; بخلاف الاعتماد المؤقت &mdash; ينتظر التعيين. ولمجلس الأمناء عضو للشؤون الأكاديمية، وهي هيئة أخرى بصلاحية أخرى، ولا تُقرأ على أنها عضوية في مجلس المعايير.')}
${darkCard('انعقاد المجلس الأكاديمي', 'شرط قبل إقرار روابط المهارات', 'للمجلس أعضاء معيَّنون ولم يجتمع بعد. التشكيل والانعقاد حدثان، والسجل يحفظهما منفصلين كي لا ينوب أحدهما عن الآخر بهدوء.')}
${darkCard('مراجع أكاديمي', 'شرط قبل مراجعة المنشورات', 'كل مجلّد منشور من تأليف المطبعة، ولم يقرأه قارئ مؤهَّل لم يكتبه. وكل مجلّد يذكر ذلك في صفحة بياناته. ويستطيع أي من أعضاء هيئة التدريس العشرة توليها الآن؛ يكفي أن يُسجَّل التكليف.')}
    </div>
    <p class="form-note">هذه الصفحة تصف بنية مكتملة التصميم وغير مكتملة التشغيل. ذكر ذلك
      اختيار: المؤسسة التي تصف مجالسها بصيغة الحاضر قبل أن تُعيَّن هي المؤسسة التي لن يصدَّق
      شيء آخر مما تقوله حين يُكتشف الأمر.</p>
  </div>
</section>

${GOV.principlesAR()}

${cta('اقرأ الموقف المؤسسي كاملًا.', 'وضع الكلية المؤسسي', '/ar/about/#status', 'ضمان الجودة', '/ar/governance/#quality')}`,
};

// 14 · مجلس المعايير ──────────────────────────────────────────────────
//
// WHY THIS PAGE, AND WHY NOW
//
// The competency wheel is the sharpest thing on /about/basce/: it
// measures the College's own framework against the College's own remit
// and shows it three-sixths met. A drawing that argues that must not
// reach one audience and not the other — the rule recorded in the master
// plan when the authority chain forced /ar/about/governance/ into
// existence, arriving a second time.
//
// The competency NAMES are translated; the definitions are re-authored
// in Arabic rather than rendered word-for-word, because each definition
// was written to be arguable and a literal translation of an epigram is
// usually neither literal nor an epigram.


// The Arabic BASCE and quality-assurance pages are sections of the
// governance pillar above now, mirroring the English architecture.

// ── write ────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

// Retired by the Governance pillar: the old Arabic governance slug and
// the two pages absorbed into it. Pruned so a manifest that once
// carried them sheds them the first time this generator runs.
for (const slug of ['about-governance-ar', 'about-basce-ar', 'about-qa-ar', 'academics-iefc-ar', 'study-ar',
  'admissions-apply-ar', 'admissions-entry-ar', 'admissions-payment-ar', 'admissions-scholarships-ar',
  'admissions-visas-ar', 'admissions-dates-ar', 'admissions-questions-ar']) {
  const i = entries.findIndex((e) => e.slug === slug);
  if (i >= 0) entries.splice(i, 1);
}

// The (EN) callout explains the marker; six pages were carrying the
// explanation with nothing to explain, and the one page with a marked
// link had no explanation. Corrected here structurally, so the callout
// tracks the links rather than the author's memory.
const EN_MARK = '<span dir="ltr">(EN)</span>';
for (const p of Object.values(PAGES)) {
  const markedLinks = p.body.split(EN_MARK).length - 1 - (p.body.includes(enOnly) ? 1 : 0);
  if (markedLinks === 0 && p.body.includes(enOnly)) {
    p.body = p.body.replace(enOnly, '').replace(/\n +\n/g, '\n');
  }
  if (markedLinks > 0 && !p.body.includes(enOnly)) {
    throw new Error(`${p.slug} carries ${markedLinks} (EN)-marked link(s) but no callout explaining the marker.`);
  }
}

for (const p of Object.values(PAGES)) {
  fs.writeFileSync(path.join(ROOT, 'pages', p.file), p.body + '\n');
  const entry = {
    slug: p.slug, output: p.output, title: p.title, description: p.description,
    contentFile: p.file, lang: 'ar', dir: 'rtl', altHref: p.altHref,
  };
  if (p.contents) entry.contents = true;
  const i = entries.findIndex((e) => e.slug === p.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...entry }; else entries.push(entry);

  // The language switch has to work in both directions. An English page
  // whose Arabic edition now exists but whose altHref still points at
  // the Arabic home page sends the reader to the wrong place — quietly,
  // and only for the readers who need it most.
  const enSlug = p.slug.replace(/-ar$/, '');
  const en = entries.find((e) => e.slug === enSlug);
  if (!en) throw new Error(`No English page "${enSlug}" for the Arabic edition ${p.slug}`);
  en.altHref = '/' + p.output.replace(/index\.html$/, '');
  written.push(p.output);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${written.length} Arabic editions and paired them with their English pages:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
