/* WEC-LC — setting an examination paper, and publishing its rubric.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE ONE FACT THIS SCREEN EXISTS TO PUT IN FRONT OF SOMEBODY
 * ─────────────────────────────────────────────────────────────────────
 * No paper is published at any level today. Every candidate's
 * graduation position is `conditional` for that reason, filed as the
 * COLLEGE's outstanding work, and the person who can change that is
 * the person reading this page. So the six levels are drawn first,
 * with the ones carrying nothing named rather than left as blanks.
 *
 * An empty state that looks like an empty list is a question nobody
 * answers. An empty state that says "Level III has no published paper,
 * so no candidate at Level III can be marked" is one somebody acts on.
 *
 * ─────────────────────────────────────────────────────────────────────
 * TWO ACTS, NOT ONE BUTTON
 * ─────────────────────────────────────────────────────────────────────
 * Authoring writes a draft; publishing is separate, dated and
 * attributed, and it is the act that stamps `rubric_published_on`. One
 * control doing both would let the publication date be written by
 * whoever pressed it at whatever moment suited them, which is the
 * back-dating the two steps prevent.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND THE ARABIC IS ON THE SAME FORM AS THE ENGLISH
 * ─────────────────────────────────────────────────────────────────────
 * Every criterion takes a name and a descriptor in both languages, side
 * by side, so writing the second is the ordinary act rather than the
 * diligent one. The same decision /staff-notices.html made about a
 * published notice, for the same reason: an edition that has to be
 * remembered is an edition that gets forgotten.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var AR = K.AR;
  var el = K.el;
  var $ = K.$;

  var T = AR ? {
    loading: 'جارٍ تحميل الأوراق…',
    notAdmin: 'حسابك ليس حسابَ إدارة. وضعُ ورقةِ امتحانٍ ونشرُها سلطةٌ إدارية، غيرُ سلطةِ التصحيح عليها.',
    levelsBasis: 'نشرُ الورقة هو الفعلُ الذي يثبّت تاريخَ نشر المعيار. وكلُّ درجةٍ في هذا المستوى تُصحَّح على المعيار المنشور قبل أن يُكلَّف المترشّح بالعمل، وهذا التاريخ هو الدليل على ذلك.',
    level: function (r) { return 'المستوى ' + r; },
    published: function (v, d) { return 'منشورة: النسخة ' + v + '، ومعيارُها منشورٌ في ' + d + '.'; },
    none: 'لا ورقةَ منشورةً في هذا المستوى. فلا مترشّحَ يُسجَّل له امتحان، ولا درجةَ مستوًى تُحسب.',
    drafts: function (n) { return n === 1 ? 'مسوّدةٌ واحدة بانتظار النشر.' : n + ' مسوّدات بانتظار النشر.'; },
    versions: 'النسخ',
    version: function (v) { return 'النسخة ' + v; },
    statusDraft: 'مسوّدة',
    statusPublished: 'منشورة',
    statusRetired: 'مسحوبة',
    publish: 'انشر هذه المسوّدة',
    publishing: 'جارٍ النشر…',
    authorHead: 'ضع ورقة',
    formNote: 'تُحفظ الورقةُ مسوّدةً. والمسوّدةُ لا تُصحَّح ولا يُجلس لها، ونشرُها فعلٌ آخر مؤرَّخٌ باسم من نشره.',
    criterion: function (n) { return 'المعيار ' + n; },
    cCode: 'الرمز',
    cName: 'الاسم بالإنجليزية',
    cNameAr: 'الاسم بالعربية',
    cDescriptor: 'الوصف بالإنجليزية',
    cDescriptorAr: 'الوصف بالعربية',
    cWeight: 'الوزن (كسرٌ من الواحد)',
    cSkill: 'المهارة التي يقيسها',
    cSkillNone: 'معيارٌ مُدمَجٌ لا يُنسب إلى مهارةٍ بعينها',
    cSpoken: 'يُصحَّح من الورقة الشفوية',
    remove: 'احذف هذا المعيار',
    add: 'أضف معيارًا',
    weights: 'أوزان المعايير',
    weightsOk: function (s) { return s + ' — صحيح'; },
    weightsBad: function (s) { return s + ' — يجب أن يكون المجموع 1'; },
    save: 'احفظ مسوّدة',
    saving: 'جارٍ الحفظ…',
    saved: 'حُفظت المسوّدة. اقرأها ثمّ انشرها من قائمة المستويات أعلاه.',
    skills: {
      skl_listening: 'الاستماع', skl_reading: 'القراءة',
      skl_speaking: 'التحدّث', skl_writing: 'الكتابة',
    },
  } : {
    loading: 'Loading the papers…',
    notAdmin: 'Your account is not an administrator. Setting and publishing an examination paper is an administrative authority, and a different one from marking against it.',
    levelsBasis: 'Publishing is the act that fixes the rubric publication date. Every mark at a level is made against a rubric published before the candidate was set the work, and that date is the evidence of it.',
    level: function (r) { return 'Level ' + r; },
    published: function (v, d) { return 'Published: version ' + v + ', rubric published on ' + d + '.'; },
    none: 'No paper is published at this level. No candidate can be entered for an examination, and no level mark can be computed.',
    drafts: function (n) { return n === 1 ? '1 draft awaiting publication.' : n + ' drafts awaiting publication.'; },
    versions: 'Versions',
    version: function (v) { return 'Version ' + v; },
    statusDraft: 'Draft',
    statusPublished: 'Published',
    statusRetired: 'Retired',
    publish: 'Publish this draft',
    publishing: 'Publishing…',
    authorHead: 'Set a paper',
    formNote: 'The paper is saved as a draft. A draft is not markable and not sittable; publishing it is a separate act, dated and recorded against the person who published it.',
    criterion: function (n) { return 'Criterion ' + n; },
    cCode: 'Code',
    cName: 'Name in English',
    cNameAr: 'Name in Arabic',
    cDescriptor: 'Descriptor in English',
    cDescriptorAr: 'Descriptor in Arabic',
    cWeight: 'Weight (a fraction of one)',
    cSkill: 'The skill it measures',
    cSkillNone: 'An integrated criterion, filed under no single skill',
    cSpoken: 'Marked from the spoken paper',
    remove: 'Remove this criterion',
    add: 'Add a criterion',
    weights: 'The criterion weights',
    weightsOk: function (s) { return s + ' — correct'; },
    weightsBad: function (s) { return s + ' — must sum to 1'; },
    save: 'Save as a draft',
    saving: 'Saving…',
    saved: 'The draft is saved. Read it back, then publish it from the level list above.',
    skills: {
      skl_listening: 'Listening', skl_reading: 'Reading',
      skl_speaking: 'Speaking', skl_writing: 'Writing',
    },
  };

  var SKILL_IDS = ['skl_listening', 'skl_reading', 'skl_speaking', 'skl_writing'];
  var STATUS = { draft: T.statusDraft, published: T.statusPublished, retired: T.statusRetired };

  function trouble(err) {
    // 403 here means "not an administrator", not "not staff" — the
    // shared kit cannot know which, and telling a tutor that these
    // pages are for staff when they ARE staff is the kind of message
    // that gets a person signing in repeatedly.
    if (err && err.status === 403) return T.notAdmin;
    return K.trouble(err);
  }

  /* ── THE SIX LEVELS ─────────────────────────────────────────────── */

  function levelPlate(level, papers) {
    var card = K.plate('article');
    card.appendChild(K.dome(level.published ? 'i-seal' : 'i-ring'));
    card.appendChild(el('h3', null, T.level(level.roman || level.levelId) + ' — ' + level.name));

    if (level.published) {
      card.appendChild(el('p', 'exm-level__state',
        T.published(level.published.version, K.when(level.published.rubricPublishedOn))));
    } else {
      // Named rather than blank. See the head of this file.
      card.appendChild(el('p', 'exm-level__state exm-level__none', T.none));
    }
    if (level.drafts) card.appendChild(el('p', 'exm-level__state', T.drafts(level.drafts)));

    var mine = papers.filter(function (p) { return p.levelId === level.levelId; });
    if (mine.length) {
      var ul = el('ul', 'exm-versions');
      mine.forEach(function (p) {
        var li = el('li');
        li.appendChild(el('span', null, T.version(p.version)));
        li.appendChild(K.chip(STATUS[p.status] || p.status,
          p.status === 'published' ? 'good' : (p.status === 'retired' ? null : 'warn')));
        li.appendChild(el('span', null, p.title));
        li.appendChild(el('span', null, p.criteria.length + ' × ' + T.weights.toLowerCase()));

        if (p.status === 'draft') {
          var go = el('button', 'acc-open', T.publish);
          go.type = 'button';
          var says = el('span', 'exm-form__says');
          says.setAttribute('aria-live', 'polite');
          go.addEventListener('click', function () {
            go.disabled = true;
            says.textContent = T.publishing;
            K.api('/api/admin/examination-papers?action=publish', {
              method: 'POST', body: JSON.stringify({ paperId: p.id }),
            }).then(load)
              .catch(function (err) { go.disabled = false; says.textContent = trouble(err); });
          });
          li.appendChild(go);
          li.appendChild(says);
        }
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }
    return card;
  }

  /* ── THE RUBRIC BEING WRITTEN ───────────────────────────────────── */

  var criteria = [];

  function field(host, labelText, node, id) {
    var l = el('label', 'exm-crit__comment-label', labelText);
    l.setAttribute('for', id);
    node.id = id;
    host.appendChild(l);
    host.appendChild(node);
  }

  function criterionBlock(index) {
    var block = el('div', 'exm-crit');
    var uid = 'c' + index + '_' + Math.floor(index * 7919 + 13);

    block.appendChild(el('p', 'exm-crit__name', T.criterion(index + 1)));

    var code = el('input'); code.type = 'text'; code.required = true; code.maxLength = 32;
    code.setAttribute('dir', 'ltr');
    field(block, T.cCode, code, uid + '_code');

    var name = el('input'); name.type = 'text'; name.required = true;
    name.setAttribute('dir', 'ltr'); name.lang = 'en';
    field(block, T.cName, name, uid + '_name');

    var nameAr = el('input'); nameAr.type = 'text';
    nameAr.setAttribute('dir', 'rtl'); nameAr.lang = 'ar';
    field(block, T.cNameAr, nameAr, uid + '_name_ar');

    var desc = el('textarea'); desc.rows = 3; desc.required = true;
    desc.setAttribute('dir', 'ltr'); desc.lang = 'en';
    field(block, T.cDescriptor, desc, uid + '_desc');

    var descAr = el('textarea'); descAr.rows = 3;
    descAr.setAttribute('dir', 'rtl'); descAr.lang = 'ar';
    field(block, T.cDescriptorAr, descAr, uid + '_desc_ar');

    var weight = el('input'); weight.type = 'number';
    weight.min = '0.01'; weight.max = '1'; weight.step = '0.01'; weight.required = true;
    weight.value = '0.25';
    field(block, T.cWeight, weight, uid + '_weight');

    var skill = el('select');
    var pairs = [['', T.cSkillNone]];
    SKILL_IDS.forEach(function (id) { pairs.push([id, T.skills[id]]); });
    K.fillOptions(skill, pairs);
    field(block, T.cSkill, skill, uid + '_skill');

    var spokenWrap = el('div', 'exm-crit__mark');
    var spoken = el('input'); spoken.type = 'checkbox'; spoken.id = uid + '_spoken';
    var spokenLabel = el('label', 'exm-crit__comment-label', T.cSpoken);
    spokenLabel.setAttribute('for', spoken.id);
    spokenWrap.appendChild(spoken);
    spokenWrap.appendChild(spokenLabel);
    block.appendChild(spokenWrap);

    var drop = el('button', 'acc-open', T.remove);
    drop.type = 'button';
    drop.addEventListener('click', function () {
      criteria = criteria.filter(function (c) { return c.block !== block; });
      block.remove();
      redrawWeights();
    });
    block.appendChild(drop);

    var entry = {
      block: block,
      read: function () {
        return {
          code: code.value.trim(),
          name: name.value.trim(),
          nameAr: nameAr.value.trim() || null,
          descriptor: desc.value.trim(),
          descriptorAr: descAr.value.trim() || null,
          weight: Number(weight.value),
          skillId: skill.value || null,
          spoken: spoken.checked,
        };
      },
      weight: function () { return Number(weight.value); },
    };
    weight.addEventListener('input', redrawWeights);
    criteria.push(entry);
    return block;
  }

  function redrawWeights() {
    var sum = criteria.reduce(function (a, c) {
      var v = c.weight();
      return a + (isFinite(v) ? v : 0);
    }, 0);
    var text = sum.toFixed(2);
    var node = $('[data-weights]');
    node.textContent = Math.abs(sum - 1) <= 0.0001 ? T.weightsOk(text) : T.weightsBad(text);
  }

  function addCriterion() {
    var host = $('[data-criteria]');
    host.appendChild(criterionBlock(criteria.length));
    redrawWeights();
    K.rise(host);
  }

  /* ── LOAD ──────────────────────────────────────────────────────── */

  function load() {
    $('#state').textContent = T.loading;
    K.api('/api/admin/examination-papers')
      .then(function (payload) {
        $('#state').textContent = '';
        $('[data-levels-basis]').textContent = T.levelsBasis;
        var host = $('[data-levels]');
        host.textContent = '';
        payload.levels.forEach(function (l) { host.appendChild(levelPlate(l, payload.papers)); });
        $('#secLevels').hidden = false;
        $('#secAuthor').hidden = false;
        K.rise(document.querySelector('.stf-shell'));
      })
      .catch(function (err) { $('#state').textContent = trouble(err); });
  }

  K.boot(function () {
    K.fillLevels($('[data-p-level]'), T.level('I'));
    // fillLevels() offers an "all" row first, which is right for a
    // filter and wrong for a form: a paper is set at ONE level.
    $('[data-p-level]').remove(0);

    $('[data-form-note]').textContent = T.formNote;
    $('[data-add-criterion]').textContent = T.add;
    $('[data-add-criterion]').addEventListener('click', addCriterion);
    $('[data-weights-label]').textContent = T.weights;
    $('[data-author-submit]').textContent = T.save;

    // The four skills, one criterion each, is the shape every published
    // paper has to reach anyway — offering it saves nobody's judgement
    // and costs four clicks that teach nothing.
    for (var i = 0; i < 4; i++) addCriterion();

    $('#paperForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var says = $('[data-author-says]');
      var btn = $('[data-author-submit]');
      btn.disabled = true;
      says.textContent = T.saving;
      K.api('/api/admin/examination-papers?action=author', {
        method: 'POST',
        body: JSON.stringify({
          levelId: Number($('[data-p-level]').value),
          title: $('#pTitle').value,
          titleAr: $('#pTitleAr').value || null,
          conditions: $('#pConditions').value,
          conditionsAr: $('#pConditionsAr').value || null,
          criteria: criteria.map(function (c) { return c.read(); }),
        }),
      }).then(function () {
        btn.disabled = false;
        says.textContent = T.saved;
        load();
      }).catch(function (err) { btn.disabled = false; says.textContent = trouble(err); });
    });

    load();
  });
})();
