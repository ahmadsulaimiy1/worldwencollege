/* WEC-LC — the candidate's own examination page.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE CLOCK IS THE SERVER'S, AND IT IS NEVER RECOMPUTED HERE
 * ─────────────────────────────────────────────────────────────────────
 * `dueAt` is an instant the platform wrote when the paper was opened,
 * three hours after that moment. This page counts DOWN to it and never
 * decides what it is: a browser whose clock is wrong would otherwise
 * shorten or lengthen somebody's examination, and the one thing a
 * candidate must be able to rely on is that the three hours are three
 * hours.
 *
 * The countdown is therefore drift, not duration — `dueAt` minus the
 * browser's now — and the absolute instant is printed beside it in the
 * account's own reading, so a candidate whose device is an hour out can
 * see that it is.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE PUBLISHED PROCEDURE IS RENDERED, NOT LINKED
 * ─────────────────────────────────────────────────────────────────────
 * Every figure below comes from the endpoint's `procedure` object,
 * which is the transcription
 * functions/_lib/academic/examinations.js keeps pinned to
 * /students/examinations/. Nothing on this page is a number typed into
 * a template: a candidate reading "ten working days" here is reading
 * the same constant the engine enforces.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND A LEVEL WITH NO PAPER IS THE COLLEGE'S OUTSTANDING WORK
 * ─────────────────────────────────────────────────────────────────────
 * The endpoint returns that sentence per level and this page prints it
 * unchanged. Rewriting it into "not yet sat" would file the platform's
 * unfinished business as a person's, which is the one thing the house
 * standard forbids outright.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var AR = K.AR;
  var el = K.el;
  var $ = K.$;

  var T = AR ? {
    loading: 'جارٍ تحميل سجلّ امتحانك…',
    none: 'لم تُسجَّل بعد لامتحان مستوى. يُفتح امتحانُ المستوى حين تكتمل وحداتُه العشر ويؤكّد ذلك عضوٌ من الهيئة الأكاديمية.',
    sittingsHead: 'جلساتك',
    levelsHead: 'مستوياتك',
    procedureHead: 'كيف يُدار الامتحان',
    latenessHead: 'ماذا يكلّفك يومُ تأخير',
    level: function (r) { return 'المستوى ' + r; },
    attempt: function (n, m) { return 'المحاولة ' + n + ' من ' + m; },
    reference: 'مرجع الجلسة',
    referenceNote: 'تنطق بهذا المرجع قبل أن تبدأ أيّ مهمّةٍ مسجَّلة. وهو يربط ذلك التسجيل بهذه المحاولة في هذا التاريخ.',
    window: function (a, b) { return 'النافذة مفتوحة من ' + a + ' إلى ' + b; },
    openPaper: 'افتح الورقة',
    submitPaper: 'سلِّم الورقة',
    remaining: 'الوقت المتبقّي',
    dueAt: 'ينتهي الوقت عند',
    elapsed: 'انتهى الوقت',
    opening: 'جارٍ الفتح…',
    submitting: 'جارٍ التسليم…',
    statusEntered: 'مسجَّل، ولم تُفتح الورقة بعد.',
    statusOpen: 'الورقة مفتوحة والوقت يجري.',
    statusSubmitted: 'سُلِّمت، وهي لدى الكلية للتصحيح.',
    statusMarking: 'لدى المصحِّحين. تُقرأ كلُّ ورقةٍ مرّتين قبل أن تُعلَن درجتُها.',
    statusReconciliation: 'تُسوَّى القراءتان كتابةً قبل إعلان الدرجة.',
    statusReleased: 'أُعلنت.',
    statusSetAside: 'أُلغيت المحاولة.',
    statusVoid: 'أُنهيت المحاولة.',
    mark: 'الدرجة',
    provisional: 'مبدئية حتى تُغلق المراجعة على الدفعة.',
    settled: 'نهائية.',
    capped: 'مقيَّدة عند حدّ النجاح بسبب التأخير. والدرجةُ التي نلتَها فعلًا مسجَّلةٌ كاملةً.',
    paperNone: null,
    enrolled: 'مسجَّل',
    latenessWhen: 'وقتُ التسليم',
    latenessWhat: 'ما تصنعه الكلية',
    procedureBasis: 'كلُّ رقمٍ في هذا القسم مأخوذٌ من لائحة الامتحانات المنشورة، لا مكتوبٌ في هذه الصفحة.',
  } : {
    loading: 'Loading your examination record…',
    none: 'You are not entered for a level examination yet. A level examination opens when all ten of its modules are complete and a member of academic staff confirms it.',
    sittingsHead: 'Your sittings',
    levelsHead: 'Your levels',
    procedureHead: 'How the examination is run',
    latenessHead: 'What a late day costs',
    level: function (r) { return 'Level ' + r; },
    attempt: function (n, m) { return 'Attempt ' + n + ' of ' + m; },
    reference: 'Sitting reference',
    referenceNote: 'You read this aloud before any recorded task begins. It ties that recording to this attempt on this date.',
    window: function (a, b) { return 'The window is open from ' + a + ' to ' + b; },
    openPaper: 'Open the paper',
    submitPaper: 'Submit the paper',
    remaining: 'Time remaining',
    dueAt: 'The time runs out at',
    elapsed: 'The time has run out',
    opening: 'Opening…',
    submitting: 'Submitting…',
    statusEntered: 'Entered. The paper has not been opened.',
    statusOpen: 'The paper is open and the clock is running.',
    statusSubmitted: 'Submitted, and with the College to mark.',
    statusMarking: 'With the markers. Every script is read twice before its mark is released.',
    statusReconciliation: 'The two readings are being reconciled in writing before the mark is released.',
    statusReleased: 'Released.',
    statusSetAside: 'The attempt was set aside.',
    statusVoid: 'The attempt was ended.',
    mark: 'Mark',
    provisional: 'Provisional until moderation closes on the batch.',
    settled: 'Confirmed.',
    capped: 'Capped at the pass threshold for late submission. The mark you actually achieved is recorded in full.',
    paperNone: null,
    enrolled: 'Enrolled',
    latenessWhen: 'Submitted',
    latenessWhat: 'What the College does',
    procedureBasis: 'Every figure in this section is read from the published examination regulations rather than typed into this page.',
  };

  var STATUS = {
    entered: T.statusEntered, open: T.statusOpen, submitted: T.statusSubmitted,
    marking: T.statusMarking, reconciliation: T.statusReconciliation,
    released: T.statusReleased, set_aside: T.statusSetAside, void: T.statusVoid,
  };

  var timers = [];

  function clearTimers() {
    timers.forEach(function (t) { window.clearInterval(t); });
    timers = [];
  }

  /** A countdown to an instant the SERVER decided. Never a duration. */
  function countdown(node, dueAtIso) {
    function tick() {
      var left = Date.parse(dueAtIso) - Date.now();
      if (!isFinite(left)) { node.textContent = '—'; return; }
      if (left <= 0) { node.textContent = T.elapsed; return; }
      var mins = Math.floor(left / 60000);
      var h = Math.floor(mins / 60);
      var m = mins % 60;
      node.textContent = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    tick();
    timers.push(window.setInterval(tick, 30000));
  }

  function act(action, examinationId, button, says) {
    button.disabled = true;
    says.textContent = action === 'open' ? T.opening : T.submitting;
    K.api('/api/student/examination?action=' + action, {
      method: 'POST', body: JSON.stringify({ examinationId: examinationId }),
    }).then(load)
      .catch(function (err) { button.disabled = false; says.textContent = K.trouble(err); });
  }

  function sittingPlate(s) {
    var card = K.plate('article');
    card.appendChild(K.dome(s.status === 'released' ? 'i-seal' : 'i-hourglass'));
    card.appendChild(el('h3', null, T.level(K.ROMAN[s.levelId] || s.levelId)));

    var chips = el('p', 'stf-item__chips');
    chips.appendChild(K.chip(T.attempt(s.attempt, s.maxSittings)));
    if (s.lateness && s.lateness !== 'on_time') chips.appendChild(K.chip(s.lateness, 'warn'));
    card.appendChild(chips);

    card.appendChild(el('p', 'stf-item__meta', STATUS[s.status] || s.status));

    // THE REFERENCE — always LTR, because it is a code a person reads
    // out loud and a mirrored code is one somebody types back wrong.
    var ref = el('p', 'stf-item__ref');
    ref.appendChild(el('span', 'stf-item__ref-label', T.reference));
    var code = el('code', null, s.sittingReference);
    code.setAttribute('dir', 'ltr');
    ref.appendChild(code);
    card.appendChild(ref);
    card.appendChild(el('p', 'exm-form__note', T.referenceNote));

    card.appendChild(el('p', 'exm-form__note',
      T.window(K.when(s.window.opensOn), K.when(s.window.closesOn))));

    var says = el('p', 'exm-form__says');
    says.setAttribute('aria-live', 'polite');

    if (s.status === 'entered') {
      var open = el('button', 'btn btn--gold chime', T.openPaper);
      open.type = 'button';
      open.addEventListener('click', function () { act('open', s.id, open, says); });
      card.appendChild(open);
    } else if (s.status === 'open') {
      var clock = el('div', 'exm-clock');
      var cl = el('p', 'exm-clock__label', T.remaining);
      var cv = el('p', 'exm-clock__value', '—');
      clock.appendChild(cl);
      clock.appendChild(cv);
      card.appendChild(clock);
      countdown(cv, s.dueAt);
      card.appendChild(el('p', 'exm-form__note', T.dueAt + ' ' + K.when(s.dueAt, true)));

      var send = el('button', 'btn btn--gold chime', T.submitPaper);
      send.type = 'button';
      send.addEventListener('click', function () { act('submit', s.id, send, says); });
      card.appendChild(send);
    } else if (s.status === 'released' && s.released) {
      var m = el('p', 'exm-close__mark', T.mark + ' ' + s.released.mark + '%');
      card.appendChild(m);
      card.appendChild(el('p', 'exm-form__note', s.released.provisional ? T.provisional : T.settled));
      if (s.result && s.result.capped) card.appendChild(el('p', 'exm-form__note', T.capped));
    } else if (s.setAside) {
      card.appendChild(el('p', 'exm-form__note', AR ? s.setAside.labelAr : s.setAside.label));
    } else if (s.void) {
      card.appendChild(el('p', 'exm-form__note', AR ? s.void.labelAr : s.void.label));
    }

    card.appendChild(says);
    return card;
  }

  function levelPlate(l) {
    var card = K.plate('article');
    card.appendChild(K.dome(l.paperPublished ? 'i-scroll' : 'i-ring'));
    card.appendChild(el('h3', null, T.level(l.roman || l.levelId) + ' — ' + l.name));
    var chips = el('p', 'stf-item__chips');
    chips.appendChild(K.chip(T.enrolled + ': ' + l.enrolmentStatus));
    card.appendChild(chips);
    if (l.note) {
      // The endpoint's own sentence, printed. See the head of this file.
      var note = el('p', 'exm-level__state exm-level__none', l.note);
      card.appendChild(note);
    }
    return card;
  }

  function drawProcedure(p) {
    var host = $('[data-procedure]');
    host.textContent = '';
    $('[data-procedure-basis]').textContent = T.procedureBasis;
    p.statements.forEach(function (sentence, i) {
      var card = el('article', 'card tilt gold-live edge-lit edge-lit--light aurum aurum--hover reveal');
      var sheen = el('span', 'tilt__sheen');
      sheen.setAttribute('aria-hidden', 'true');
      card.appendChild(sheen);
      card.appendChild(K.dome(['i-calendar', 'i-hourglass', 'i-scales', 'i-seal'][i % 4]));
      card.appendChild(el('p', null, sentence));
      host.appendChild(card);
    });
    $('#secProcedure').hidden = false;

    var body = $('[data-lateness]');
    body.textContent = '';
    p.lateness.forEach(function (b) {
      var tr = el('tr');
      var th = el('th', null, b.label);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      tr.appendChild(el('td', null, b.effect));
      body.appendChild(tr);
    });
    $('[data-lateness-col-when]').textContent = T.latenessWhen;
    $('[data-lateness-col-what]').textContent = T.latenessWhat;
    $('#secLateness').hidden = false;
  }

  function load() {
    clearTimers();
    $('#state').textContent = T.loading;
    K.api('/api/student/examination' + (AR ? '?lang=ar' : ''))
      .then(function (payload) {
        // Cleared on the success path. A state line left saying
        // "loading" under a rendered page is the commonest way a
        // finished screen reads as a broken one.
        $('#state').textContent = payload.sittings.length ? '' : T.none;

        var sittings = $('[data-sittings]');
        sittings.textContent = '';
        payload.sittings.forEach(function (s) { sittings.appendChild(sittingPlate(s)); });
        $('#secSittings').hidden = !payload.sittings.length;
        $('[data-sittings-head]').textContent = T.sittingsHead;

        var levels = $('[data-levels]');
        levels.textContent = '';
        payload.levels.forEach(function (l) { levels.appendChild(levelPlate(l)); });
        $('#secLevels').hidden = !payload.levels.length;
        $('[data-levels-head]').textContent = T.levelsHead;

        drawProcedure(payload.procedure);
        K.rise(document.querySelector('.stf-shell'));
      })
      .catch(function (err) { $('#state').textContent = K.trouble(err); });
  }

  K.boot(load);
})();
