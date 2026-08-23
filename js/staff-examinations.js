/* WEC-LC — the examination marking console.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THIS SCREEN IS FOR, AND WHY IT IS NOT THE ASSIGNMENT QUEUE
 * ─────────────────────────────────────────────────────────────────────
 * An assignment is one reader, one rubric, one mark, and the mark goes
 * to the learner. A level examination is two readers who must not see
 * each other's numbers, a written reconciliation wherever they differ,
 * sometimes a third reader whose mark stands, a spoken paper marked by
 * a person, and a mark that reaches nobody until all of that has
 * closed. One screen carrying both would carry rows that behave
 * differently, and the difference lost would be exactly the guarantee
 * the College publishes.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE RUBRIC IS THE FORM, AND THERE IS NO OVERALL FIELD
 * ─────────────────────────────────────────────────────────────────────
 * Every criterion is a number input with its published descriptor
 * printed above it. The overall is arithmetic the platform does from
 * those, shown live so a marker can see where their reading is landing
 * — and it is NOT editable, ever. A marker who can type an overall can
 * mark on impression and fit the criteria to it afterwards, which the
 * tutor handbook calls "the commonest error a careful tutor makes".
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE WITHHOLDING IS THE ENDPOINT'S; THE SENTENCE IS THIS FILE'S
 * ─────────────────────────────────────────────────────────────────────
 * GET /api/staff/examinations returns no other reader's marks until the
 * caller's own are recorded. That is where the rule belongs — a rule
 * enforced only by a screen is a rule anybody with a browser console
 * can lift. What this file adds is the notice: an empty marks panel
 * with no explanation reads as a broken page, and a marker who thinks
 * the screen is broken goes looking for the numbers somewhere else.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND NOTHING FROM THE PLATFORM REACHES THE PAGE AS HTML
 * ─────────────────────────────────────────────────────────────────────
 * Every value — a candidate's name, a descriptor, a colleague's
 * reconciliation statement — is set through textContent, via the
 * shared kit. A marking screen that renders a submitted string as
 * markup is a marking screen with an injection in it.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var AR = K.AR;
  var el = K.el;
  var $ = K.$;

  var T = AR ? {
    loading: 'جارٍ تحميل طوابير الامتحان…',
    ready: '',
    roleFirst: 'القراءة الأولى',
    roleSecond: 'القراءة الثانية',
    queueHead: 'الأوراق المنتظِرة',
    firstLabel: 'بانتظار قراءةٍ أولى',
    secondLabel: 'بانتظار قراءةٍ ثانية',
    scripts: function (n) { return n === 1 ? 'ورقة واحدة' : (n === 2 ? 'ورقتان' : n + ' ورقة'); },
    releaseDay: function (d) { return 'تُعلَن نتائج الدفعة معًا في يوم العمل ' + d + '.'; },
    emptyHead: 'لا شيء ينتظر هذه القراءة.',
    emptyNote: 'كلُّ ورقةٍ مسلَّمةٍ في هذا الطابور قد قُرئت. سيظهر الطابور من جديد حين تصل ورقةٌ أخرى.',
    open: 'افتح الورقة',
    close: 'أغلق',
    level: function (r) { return 'المستوى ' + r; },
    attempt: function (n) { return 'المحاولة ' + n; },
    resit: 'إعادة',
    submitted: 'سُلِّمت',
    waiting: function (d) { return d === 1 ? 'ينتظر يوم عملٍ واحد' : 'ينتظر ' + d + ' من أيام العمل'; },
    reference: 'مرجع الجلسة',
    withheldHead: 'قراءةُ زميلك محجوبة',
    rubric: 'المعيار المنشور',
    publishedOn: function (d) { return 'نُشر هذا المعيار في ' + d + '، قبل أن يُكلَّف المترشّح بالورقة.'; },
    yourReading: 'قراءتك',
    markLabel: 'الدرجة من 100',
    commentLabel: 'ما أحسنه، والتغيير الواحد الذي يرفع الدرجة أكثر من غيره',
    weight: function (w) { return 'الوزن ' + Math.round(w * 100) + '٪'; },
    running: 'الإجمالي المرجَّح لقراءتك',
    submitFirst: 'سجِّل قراءتك الأولى',
    submitSecond: 'سجِّل قراءتك الثانية',
    submitThird: 'سجِّل قراءةً ثالثة',
    saving: 'جارٍ التسجيل…',
    saved: 'سُجِّلت قراءتك. لا تُكتب فوقها أبدًا.',
    marks: 'القراءات على السجلّ',
    markerFirst: 'المصحِّح الأول',
    markerSecond: 'المصحِّح الثاني',
    markerThird: 'المصحِّح الثالث',
    recs: 'المُوافَقات',
    recOpen: 'مفتوحة',
    recDue: function (d) { return 'تُسوَّى في موعد أقصاه ' + d; },
    settleMark: 'الدرجة المتّفق عليها',
    settleHow: 'كيف سُوِّيت',
    howAgreed: 'باتّفاق المصحِّحَين',
    howThird: 'بقراءةٍ ثالثة، ودرجتُها هي التي تثبت',
    statement: 'البيان المكتوب',
    settle: 'سجِّل التسوية',
    spokenHead: 'الورقة الشفوية',
    spokenPassed: 'اجتازها',
    spokenFailed: 'لم يجتزها',
    spokenRecord: 'سجِّل حُكم الورقة الشفوية',
    releaseHead: 'الإعلان',
    release: 'أعلن النتيجة',
    releaseNote: 'لا تُعلَن نتيجةٌ حتى يحمل كلُّ معيارٍ قراءتين، وتُسوَّى كلُّ مُوافَقة، وتُصحَّح الورقةُ الشفوية.',
    released: function (m) { return 'أُعلنت عند ' + m + '٪، وهي مبدئية حتى تُغلق المراجعة.'; },
    outstanding: 'ما يمنع الإعلان',
    capped: 'مقيَّدة عند حدّ النجاح للتأخير',
    agreementHead: 'موثوقيّتك أنت',
    agreementNone: 'لم تُقرأ لك ورقةٌ مع قارئٍ ثانٍ في هذه المدّة، فلا رقمَ اتّفاقٍ بعد. ولا يعني ذلك صفرًا.',
    agreementPct: 'الاتّفاق',
    agreementPaired: 'معايير قُرئت مرّتين',
    meanDiv: 'متوسّط الفارق',
    bias: 'اتّجاه الفارق',
    biasAbove: 'أعلى من قارئك الثاني',
    biasBelow: 'أدنى من قارئك الثاني',
    biasLevel: 'لا اتّجاهَ يُذكر',
    diverged: 'الحالات التي اختلفتما فيها',
    myMark: 'درجتك',
    theirMark: 'درجة القارئ الآخر',
    settledAt: 'استقرّت عند',
    nearerMine: 'أقربُ إلى درجتك',
    nearerTheirs: 'أقربُ إلى درجة القارئ الآخر',
    nearerEqual: 'في المنتصف',
    unsettled: 'لم تُسوَّ بعد',
    bandCrossings: function (n) { return n + ' حالة عبَرت فيها القراءتان عتبةَ مرتبةِ شرف'; },
    points: function (n) { return n + ' نقطة'; },
    nothing: '—',
  } : {
    loading: 'Loading the examination queues…',
    ready: '',
    roleFirst: 'First reading',
    roleSecond: 'Second reading',
    queueHead: 'Scripts waiting',
    firstLabel: 'Awaiting a first reading',
    secondLabel: 'Awaiting a second reading',
    scripts: function (n) { return n === 1 ? '1 script' : n + ' scripts'; },
    releaseDay: function (d) { return 'A cohort is released together on working day ' + d + '.'; },
    emptyHead: 'Nothing is waiting for this reading.',
    emptyNote: 'Every submitted script in this queue has been read. It will fill again when another is handed in.',
    open: 'Open the script',
    close: 'Close',
    level: function (r) { return 'Level ' + r; },
    attempt: function (n) { return 'Attempt ' + n; },
    resit: 'Resit',
    submitted: 'Submitted',
    waiting: function (d) { return d === 1 ? 'Waiting 1 working day' : 'Waiting ' + d + ' working days'; },
    reference: 'Sitting reference',
    withheldHead: 'Your colleague’s reading is withheld',
    rubric: 'The published rubric',
    publishedOn: function (d) { return 'This rubric was published on ' + d + ', before the candidate was set the paper.'; },
    yourReading: 'Your reading',
    markLabel: 'Mark out of 100',
    commentLabel: 'What they did well, and the single change that would raise the mark most',
    weight: function (w) { return 'Weight ' + Math.round(w * 100) + '%'; },
    running: 'The weighted overall of your reading',
    submitFirst: 'Record your first reading',
    submitSecond: 'Record your second reading',
    submitThird: 'Record a third reading',
    saving: 'Recording…',
    saved: 'Your reading is on the record. It is never overwritten.',
    marks: 'The readings on the record',
    markerFirst: 'First marker',
    markerSecond: 'Second marker',
    markerThird: 'Third marker',
    recs: 'Reconciliations',
    recOpen: 'Open',
    recDue: function (d) { return 'To be settled by ' + d; },
    settleMark: 'The agreed mark',
    settleHow: 'How it was settled',
    howAgreed: 'Agreed between the two markers',
    howThird: 'By a third reader, whose mark stands',
    statement: 'The written statement',
    settle: 'Record the settlement',
    spokenHead: 'The spoken paper',
    spokenPassed: 'Passed',
    spokenFailed: 'Not passed',
    spokenRecord: 'Record the spoken paper',
    releaseHead: 'Release',
    release: 'Release the result',
    releaseNote: 'Nothing is released until every criterion carries two readings, every reconciliation is settled, and the spoken paper has been marked.',
    released: function (m) { return 'Released at ' + m + '%, provisional until moderation closes.'; },
    outstanding: 'What is holding the release',
    capped: 'Capped at the pass threshold for late submission',
    agreementHead: 'Your own reliability',
    agreementNone: 'No script of yours has been read alongside a second marker in this window, so there is no agreement figure yet. That is not the same as nought.',
    agreementPct: 'Agreement',
    agreementPaired: 'Criteria read twice',
    meanDiv: 'Mean divergence',
    bias: 'Direction',
    biasAbove: 'above your second markers',
    biasBelow: 'below your second markers',
    biasLevel: 'no measurable direction',
    diverged: 'The cases that diverged',
    myMark: 'Your mark',
    theirMark: 'The other reading',
    settledAt: 'Settled at',
    nearerMine: 'nearer your reading',
    nearerTheirs: 'nearer the other reading',
    nearerEqual: 'midway',
    unsettled: 'not yet settled',
    bandCrossings: function (n) { return n + ' case' + (n === 1 ? '' : 's') + ' where the two readings crossed an honours threshold'; },
    points: function (n) { return n + ' points'; },
    nothing: '—',
  };

  var state = { role: 'first', script: null };

  function api(path, opts) { return K.api(path, opts); }

  /* ── THE QUEUE ─────────────────────────────────────────────────── */

  function queueRow(row) {
    var li = K.plate('li');
    li.appendChild(K.dome(row.resit ? 'i-hourglass' : 'i-nib'));

    var head = el('div', 'stf-item__head');
    head.appendChild(el('h3', null, row.candidate.name));
    var chips = el('p', 'stf-item__chips');
    chips.appendChild(K.chip(T.level(K.ROMAN[row.levelId] || row.levelId)));
    chips.appendChild(K.chip(T.attempt(row.attempt)));
    if (row.resit) chips.appendChild(K.chip(T.resit, 'warn'));
    if (row.lateness && row.lateness !== 'on_time') chips.appendChild(K.chip(row.lateness, 'warn'));
    head.appendChild(chips);
    li.appendChild(head);

    var meta = el('p', 'stf-item__meta');
    meta.appendChild(el('span', null, T.submitted + ' ' + K.when(row.submittedAt)));
    meta.appendChild(el('span', null, ' · '));
    meta.appendChild(el('span', null, T.waiting(row.waitingWorkingDays)));
    li.appendChild(meta);

    li.appendChild(K.wait(row.waitingWorkingDays));

    var ref = el('p', 'stf-item__ref');
    ref.appendChild(el('span', 'stf-item__ref-label', T.reference));
    var code = el('code', null, row.sittingReference);
    code.setAttribute('dir', 'ltr');
    ref.appendChild(code);
    li.appendChild(ref);

    var open = el('button', 'acc-open', T.open);
    open.type = 'button';
    open.addEventListener('click', function () { loadScript(row.examinationId); });
    li.appendChild(open);
    return li;
  }

  function drawQueue(payload) {
    var host = $('[data-queue]');
    host.textContent = '';
    $('[data-queue-basis]').textContent = payload.basis + ' ' + T.releaseDay(payload.releaseWorkingDay);
    $('[data-queue-head]').textContent = T.queueHead;

    var empty = $('[data-queue-empty]');
    if (!payload.scripts.length) {
      empty.hidden = false;
      $('[data-queue-empty-head]').textContent = T.emptyHead;
      $('[data-queue-empty-note]').textContent = T.emptyNote;
    } else {
      empty.hidden = true;
      payload.scripts.forEach(function (row) { host.appendChild(queueRow(row)); });
    }

    var tile = state.role === 'first' ? 'first' : 'second';
    var box = document.querySelector('[data-tile="' + tile + '"]');
    if (box) {
      box.querySelector('[data-count]').textContent = String(payload.scripts.length);
      box.querySelector('[data-label]').textContent = state.role === 'first' ? T.firstLabel : T.secondLabel;
      box.querySelector('[data-foot]').textContent = T.scripts(payload.scripts.length);
    }
    $('#secCounts').hidden = false;
    $('#secQueue').hidden = false;
  }

  /* ── ONE SCRIPT ────────────────────────────────────────────────── */

  /**
   * The rubric, as the form.
   *
   * Each criterion is a number input with its own descriptor above it,
   * its weight beside it, and the skill it measures named. The running
   * overall under them is READ-ONLY output, recomputed on every input:
   * a marker should be able to see where their reading is landing
   * without ever being able to set it.
   */
  function markingForm(script) {
    var form = el('form', 'exm-form');
    form.setAttribute('novalidate', 'novalidate');

    var head = el('div', 'exm-form__head');
    head.appendChild(el('h3', null, T.yourReading));
    head.appendChild(el('p', 'exm-form__note', T.publishedOn(K.when(script.paper.rubricPublishedOn))));
    form.appendChild(head);

    var fields = [];
    script.paper.criteria.forEach(function (c) {
      var block = el('div', 'exm-crit');
      var label = el('label', 'exm-crit__name');
      label.setAttribute('for', 'crit_' + c.id);
      label.textContent = (AR && c.nameAr ? c.nameAr : c.name);
      block.appendChild(label);

      var chips = el('p', 'exm-crit__chips');
      chips.appendChild(K.chip(T.weight(c.weight)));
      if (c.skillName) chips.appendChild(K.chip(AR && c.skillNameAr ? c.skillNameAr : c.skillName));
      if (c.spoken) chips.appendChild(K.chip(T.spokenHead, 'warn'));
      block.appendChild(chips);

      var desc = el('p', 'exm-crit__descriptor', AR && c.descriptorAr ? c.descriptorAr : c.descriptor);
      desc.setAttribute('dir', 'auto');
      block.appendChild(desc);

      var markWrap = el('div', 'exm-crit__mark');
      var markLabel = el('label', 'u-visually-hidden', T.markLabel);
      markLabel.setAttribute('for', 'crit_' + c.id);
      var input = el('input');
      input.type = 'number';
      input.id = 'crit_' + c.id;
      input.min = '0';
      input.max = '100';
      input.step = '0.5';
      input.required = true;
      input.setAttribute('inputmode', 'decimal');
      input.setAttribute('aria-label', (AR && c.nameAr ? c.nameAr : c.name) + ' — ' + T.markLabel);
      markWrap.appendChild(markLabel);
      markWrap.appendChild(input);
      markWrap.appendChild(el('span', 'exm-crit__of', '/ 100'));
      block.appendChild(markWrap);

      var cLabel = el('label', 'exm-crit__comment-label', T.commentLabel);
      cLabel.setAttribute('for', 'cmt_' + c.id);
      block.appendChild(cLabel);
      var comment = el('textarea');
      comment.id = 'cmt_' + c.id;
      comment.rows = 3;
      comment.setAttribute('dir', 'auto');
      block.appendChild(comment);

      form.appendChild(block);
      fields.push({ criterion: c, input: input, comment: comment });
    });

    // THE RUNNING OVERALL — output, never input. See the head of this
    // file for why there is no field a marker can type it into.
    var running = el('output', 'exm-running');
    running.setAttribute('aria-live', 'polite');
    var runLabel = el('p', 'exm-running__label', T.running);
    var runValue = el('p', 'exm-running__value', T.nothing);
    running.appendChild(runLabel);
    running.appendChild(runValue);
    form.appendChild(running);

    function recompute() {
      var sum = 0;
      var weight = 0;
      var complete = true;
      fields.forEach(function (f) {
        var v = Number(f.input.value);
        if (f.input.value === '' || !isFinite(v)) { complete = false; return; }
        sum += v * f.criterion.weight;
        weight += f.criterion.weight;
      });
      runValue.textContent = complete && weight > 0
        ? (Math.round((sum / weight) * 100) / 100).toFixed(2) + '%'
        : T.nothing;
    }
    fields.forEach(function (f) { f.input.addEventListener('input', recompute); });

    var submit = el('button', 'btn btn--gold chime');
    submit.type = 'submit';
    submit.textContent = script.role === 'third' ? T.submitThird
      : (script.role === 'second' ? T.submitSecond : T.submitFirst);
    form.appendChild(submit);

    var says = el('p', 'exm-form__says');
    says.setAttribute('aria-live', 'polite');
    form.appendChild(says);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      says.textContent = T.saving;
      submit.disabled = true;
      api('/api/staff/examinations?action=mark', {
        method: 'POST',
        body: JSON.stringify({
          examinationId: script.examinationId,
          role: script.role,
          marks: fields.map(function (f) {
            return { criterionId: f.criterion.id, mark: Number(f.input.value), comment: f.comment.value };
          }),
        }),
      }).then(function () {
        // THE CONFIRMATION IS CARRIED INTO THE RE-RENDER.
        //
        // Recording a reading re-renders the script — the marker's own
        // numbers are now on the record and belong on screen — and that
        // re-render destroys every node inside [data-script], including
        // the one this message was written into. Writing it to the
        // page's state line instead does not work either: load() owns
        // that line and clears it the moment the queue comes back. So
        // the note travels INTO drawScript(), which renders it at the
        // top of what replaces the form. A marker who presses the
        // button and sees nothing change is a marker who presses it
        // twice.
        loadScript(script.examinationId, T.saved);
        load();
      }).catch(function (err) {
        submit.disabled = false;
        says.textContent = K.trouble(err);
      });
    });

    return form;
  }

  function marksPanel(script) {
    var box = el('section', 'exm-panel');
    box.appendChild(el('h3', null, T.marks));
    var roleName = { first: T.markerFirst, second: T.markerSecond, third: T.markerThird };

    var byCriterion = {};
    script.marks.forEach(function (m) {
      (byCriterion[m.criterionId] = byCriterion[m.criterionId] || []).push(m);
    });

    var table = el('table', 'exm-table');
    var thead = el('thead');
    var hrow = el('tr');
    hrow.appendChild(el('th', null, T.rubric));
    ['first', 'second', 'third'].forEach(function (r) {
      var th = el('th', null, roleName[r]);
      th.setAttribute('scope', 'col');
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = el('tbody');
    script.paper.criteria.forEach(function (c) {
      var tr = el('tr');
      var th = el('th', null, AR && c.nameAr ? c.nameAr : c.name);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      ['first', 'second', 'third'].forEach(function (r) {
        var m = (byCriterion[c.id] || []).filter(function (x) { return x.role === r; })[0];
        tr.appendChild(el('td', null, m ? String(m.mark) : T.nothing));
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    var scroll = el('div', 'exm-scroll');
    scroll.appendChild(table);
    box.appendChild(scroll);
    return box;
  }

  function reconciliationPanel(script) {
    var box = el('section', 'exm-panel');
    box.appendChild(el('h3', null, T.recs));

    script.reconciliations.forEach(function (r) {
      var card = K.plate('div', 'exm-rec');
      card.appendChild(K.dome('i-scales'));
      card.appendChild(el('h4', null, AR ? r.triggerLabelAr : r.triggerLabel));

      var chips = el('p', 'stf-item__chips');
      chips.appendChild(K.chip(T.markerFirst + ': ' + r.firstMark));
      chips.appendChild(K.chip(T.markerSecond + ': ' + r.secondMark));
      if (!r.settled) chips.appendChild(K.chip(T.recOpen, 'warn'));
      card.appendChild(chips);

      if (r.settled) {
        card.appendChild(el('p', 'exm-rec__settled', String(r.settled.mark) + '%'));
        var st = el('p', 'exm-rec__statement', r.settled.statement);
        st.setAttribute('dir', 'auto');
        card.appendChild(st);
        box.appendChild(card);
        return;
      }

      card.appendChild(el('p', 'exm-rec__due', T.recDue(K.when(r.settleDueOn))));

      var form = el('form', 'exm-rec__form');
      form.setAttribute('novalidate', 'novalidate');

      var mLabel = el('label', null, T.settleMark);
      mLabel.setAttribute('for', 'sm_' + r.id);
      var mark = el('input');
      mark.type = 'number'; mark.id = 'sm_' + r.id; mark.min = '0'; mark.max = '100'; mark.step = '0.5';
      mark.required = true;
      form.appendChild(mLabel); form.appendChild(mark);

      var hLabel = el('label', null, T.settleHow);
      hLabel.setAttribute('for', 'sh_' + r.id);
      var how = el('select');
      how.id = 'sh_' + r.id;
      K.fillOptions(how, [['agreed', T.howAgreed], ['third_marker', T.howThird]]);
      form.appendChild(hLabel); form.appendChild(how);

      var sLabel = el('label', null, T.statement);
      sLabel.setAttribute('for', 'ss_' + r.id);
      var statement = el('textarea');
      statement.id = 'ss_' + r.id; statement.rows = 3; statement.required = true;
      statement.setAttribute('dir', 'auto');
      form.appendChild(sLabel); form.appendChild(statement);

      var go = el('button', 'btn btn--gold chime', T.settle);
      go.type = 'submit';
      form.appendChild(go);
      var says = el('p', 'exm-form__says');
      says.setAttribute('aria-live', 'polite');
      form.appendChild(says);

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        go.disabled = true;
        says.textContent = T.saving;
        api('/api/staff/examinations?action=settle', {
          method: 'POST',
          body: JSON.stringify({
            reconciliationId: r.id,
            settledMark: Number(mark.value),
            statement: statement.value,
            how: how.value,
          }),
        }).then(function () { loadScript(script.examinationId); })
          .catch(function (err) { go.disabled = false; says.textContent = K.trouble(err); });
      });

      card.appendChild(form);
      box.appendChild(card);
    });

    return box;
  }

  function closingPanel(sitting) {
    var box = el('section', 'exm-panel');

    // ── The spoken paper ──────────────────────────────────────────
    var spoken = K.plate('div', 'exm-close');
    spoken.appendChild(K.dome('i-waveform'));
    spoken.appendChild(el('h4', null, T.spokenHead));
    if (sitting.spokenPaper.markedAt) {
      spoken.appendChild(K.chip(sitting.spokenPaper.passed ? T.spokenPassed : T.spokenFailed,
        sitting.spokenPaper.passed ? 'good' : 'warn'));
      spoken.appendChild(el('p', null, K.when(sitting.spokenPaper.markedAt, true)));
    } else {
      var sForm = el('form', 'exm-rec__form');
      var sSel = el('select');
      sSel.id = 'spoken_' + sitting.id;
      K.fillOptions(sSel, [['yes', T.spokenPassed], ['no', T.spokenFailed]]);
      var sLab = el('label', null, T.spokenRecord);
      sLab.setAttribute('for', sSel.id);
      sForm.appendChild(sLab); sForm.appendChild(sSel);
      var sGo = el('button', 'btn btn--gold chime', T.spokenRecord);
      sGo.type = 'submit';
      sForm.appendChild(sGo);
      var sSays = el('p', 'exm-form__says');
      sSays.setAttribute('aria-live', 'polite');
      sForm.appendChild(sSays);
      sForm.addEventListener('submit', function (e) {
        e.preventDefault();
        sGo.disabled = true;
        api('/api/staff/examinations?action=spoken', {
          method: 'POST',
          body: JSON.stringify({ examinationId: sitting.id, passed: sSel.value === 'yes' }),
        }).then(function () { loadScript(sitting.id); })
          .catch(function (err) { sGo.disabled = false; sSays.textContent = K.trouble(err); });
      });
      spoken.appendChild(sForm);
    }
    box.appendChild(spoken);

    // ── The release ───────────────────────────────────────────────
    var rel = K.plate('div', 'exm-close');
    rel.appendChild(K.dome('i-seal'));
    rel.appendChild(el('h4', null, T.releaseHead));
    rel.appendChild(el('p', 'exm-close__note', T.releaseNote));

    if (sitting.released) {
      rel.appendChild(el('p', 'exm-close__mark', T.released(sitting.released.mark)));
      if (sitting.result.capped) rel.appendChild(K.chip(T.capped, 'warn'));
    } else {
      // WHAT IS HOLDING IT, listed before the button rather than
      // discovered by pressing it. A control that cannot succeed is a
      // control that teaches distrust of the screen.
      if (sitting.result.outstanding.length) {
        var out = el('div', 'exm-close__blocked');
        out.appendChild(el('p', 'exm-close__blocked-head', T.outstanding));
        var ul = el('ul');
        sitting.result.outstanding.forEach(function (o) {
          ul.appendChild(el('li', null, o.code + ' — ' + String(o.state).replace(/_/g, ' ')));
        });
        out.appendChild(ul);
        rel.appendChild(out);
      } else if (!sitting.spokenPaper.markedAt) {
        rel.appendChild(el('p', 'exm-close__blocked-head', T.spokenHead));
      } else {
        var go = el('button', 'btn btn--gold chime', T.release);
        go.type = 'button';
        var says = el('p', 'exm-form__says');
        says.setAttribute('aria-live', 'polite');
        go.addEventListener('click', function () {
          go.disabled = true;
          api('/api/staff/examinations?action=release', {
            method: 'POST', body: JSON.stringify({ examinationId: sitting.id }),
          }).then(function () { loadScript(sitting.id); load(); })
            .catch(function (err) { go.disabled = false; says.textContent = K.trouble(err); });
        });
        rel.appendChild(go);
        rel.appendChild(says);
      }
    }
    box.appendChild(rel);
    return box;
  }

  function drawScript(script, sitting, note) {
    var host = $('[data-script]');
    host.textContent = '';
    $('#secScript').hidden = false;
    $('[data-script-head]').textContent = script.sittingReference;
    $('[data-script-close]').textContent = T.close;

    if (note) {
      var said = el('p', 'exm-said', note);
      said.setAttribute('role', 'status');
      host.appendChild(said);
    }

    var facts = el('p', 'exm-facts');
    facts.appendChild(K.chip(T.level(K.ROMAN[script.levelId] || script.levelId)));
    facts.appendChild(K.chip(T.attempt(script.attempt)));
    if (script.resit) facts.appendChild(K.chip(T.resit, 'warn'));
    facts.appendChild(K.chip(T.submitted + ' ' + K.when(script.submittedAt)));
    if (script.lateness && script.lateness !== 'on_time') facts.appendChild(K.chip(script.latenessEffect, 'warn'));
    host.appendChild(facts);

    if (script.withheld) {
      var w = el('div', 'exm-withheld');
      w.appendChild(el('p', 'exm-withheld__head', T.withheldHead));
      w.appendChild(el('p', null, script.withheld));
      host.appendChild(w);
    }

    if (!script.alreadyMarked) {
      host.appendChild(markingForm(script));
    } else {
      host.appendChild(marksPanel(script));
      if (script.reconciliations.length) host.appendChild(reconciliationPanel(script));
      if (sitting) host.appendChild(closingPanel(sitting));
    }

    K.rise(host);
    $('#secScript').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function loadScript(examinationId, note) {
    api('/api/staff/examinations?examinationId=' + encodeURIComponent(examinationId)
        + '&role=' + encodeURIComponent(state.role))
      .then(function (script) {
        // The full sitting is fetched only where the marker has already
        // marked — until then there is nothing on it they may see, and
        // asking for it would be asking for numbers the endpoint is
        // right to withhold.
        if (!script.alreadyMarked) { drawScript(script, null, note); return; }
        api('/api/staff/examinations?userId=' + encodeURIComponent(script.candidate.id)
            + '&levelId=' + script.levelId)
          .then(function (payload) {
            var sitting = (payload.sittings || []).filter(function (s) { return s.id === examinationId; })[0] || null;
            drawScript(script, sitting, note);
          })
          .catch(function () { drawScript(script, null, note); });
      })
      .catch(function (err) { $('#state').textContent = K.trouble(err); });
  }

  /* ── A MARKER'S OWN RELIABILITY ────────────────────────────────── */

  /**
   * The handbook's promise, rendered.
   *
   * THE SUMMARY IS NOT THE POINT. "A marker told only that a standard
   * drifted can do nothing; one shown where and by how much corrects it
   * in the next batch" — so the four figures are drawn small and the
   * divergences are drawn as a list, one per case, with the criterion
   * named and both marks on it.
   *
   * `bias` is set in words as well as a number, because "+2.4" needs a
   * reader to remember which sign means what, and the whole value of
   * the figure is that it can be acted on without thinking about it.
   */
  function drawAgreement(a) {
    var host = $('[data-agreement]');
    host.textContent = '';
    $('[data-agreement-head]').textContent = T.agreementHead;
    $('[data-agreement-basis]').textContent = a.undertaking + ' — ' + a.window.note;

    if (!a.paired) {
      // Null, never nought. See the endpoint: a marker who has been read
      // alongside nobody has no agreement figure, and 0% would say they
      // agreed with nobody.
      host.appendChild(el('p', 'agr-none', T.agreementNone));
      $('#secAgreement').hidden = false;
      return;
    }

    var figures = el('div', 'agr-figures');
    [
      [T.agreementPct, a.agreement + '%'],
      [T.agreementPaired, String(a.paired)],
      [T.meanDiv, T.points(a.meanDivergence)],
      [T.bias, (a.bias > 0 ? '+' : '') + a.bias + ' · '
        + (Math.abs(a.bias) < 0.5 ? T.biasLevel : (a.bias > 0 ? T.biasAbove : T.biasBelow))],
    ].forEach(function (pair) {
      var f = el('div', 'agr-figure');
      f.appendChild(el('p', 'agr-figure__label', pair[0]));
      f.appendChild(el('p', 'agr-figure__value', pair[1]));
      figures.appendChild(f);
    });
    host.appendChild(figures);

    if (a.bandCrossings) {
      host.appendChild(el('p', 'agr-bands', T.bandCrossings(a.bandCrossings)));
    }

    if (!a.divergences.length) return void ($('#secAgreement').hidden = false);

    var head = el('h3', 'agr-diverged', T.diverged);
    host.appendChild(head);

    var list = el('ul', 'agr-list');
    a.divergences.forEach(function (d) {
      var li = el('li', 'agr-case');
      var name = el('p', 'agr-case__name');
      name.appendChild(document.createTextNode(
        (AR && d.criterionNameAr ? d.criterionNameAr : d.criterionName) + ' · '));
      var ref = el('code', null, d.sittingReference);
      ref.setAttribute('dir', 'ltr');
      name.appendChild(ref);
      li.appendChild(name);

      var marks = el('p', 'agr-case__marks');
      marks.appendChild(K.chip(T.myMark + ' ' + d.myMark, 'good'));
      marks.appendChild(K.chip(T.theirMark + ' ' + d.theirMark));
      marks.appendChild(K.chip((d.gap > 0 ? '+' : '') + d.gap,
        Math.abs(d.gap) > a.tolerancePoints ? 'warn' : null));
      li.appendChild(marks);

      var out = el('p', 'agr-case__settled');
      if (d.settled) {
        out.textContent = T.settledAt + ' ' + d.settled.mark + ' · '
          + (d.settledNearer === 'mine' ? T.nearerMine
            : (d.settledNearer === 'theirs' ? T.nearerTheirs : T.nearerEqual));
      } else {
        out.textContent = T.unsettled;
        out.classList.add('agr-case__settled--open');
      }
      li.appendChild(out);
      list.appendChild(li);
    });
    host.appendChild(list);
    $('#secAgreement').hidden = false;
  }

  function loadAgreement() {
    api('/api/staff/marker-agreement')
      .then(drawAgreement)
      // A reliability figure that failed to load must not take the
      // marking queue down with it. The section simply stays hidden.
      .catch(function () { $('#secAgreement').hidden = true; });
  }

  /* ── LOAD ──────────────────────────────────────────────────────── */

  function load() {
    $('#state').textContent = T.loading;
    api('/api/staff/examinations?role=' + encodeURIComponent(state.role))
      .then(function (payload) {
        $('#state').textContent = T.ready;
        drawQueue(payload);
      })
      .catch(function (err) { $('#state').textContent = K.trouble(err); });
  }

  K.boot(function () {
    var role = $('[data-role]');
    K.fillOptions(role, [['first', T.roleFirst], ['second', T.roleSecond]]);
    $('[data-role-label]').textContent = AR ? 'القراءة' : 'Reading';
    role.addEventListener('change', function () {
      state.role = role.value;
      $('#secScript').hidden = true;
      load();
    });
    $('[data-script-close]').addEventListener('click', function () {
      $('#secScript').hidden = true;
    });
    load();
    loadAgreement();
  });
})();
