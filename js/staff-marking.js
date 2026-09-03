/* WEC-LC — Marking.
 *
 * The interface for GET /api/lms/marking-queue + POST
 * /api/lms/grade-assignment, and for GET /api/lms/review-queue + POST
 * /api/lms/recording-review.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE SCALE IS THE PLATFORM'S, NOT THIS FILE'S
 * ─────────────────────────────────────────────────────────────────────
 * The pass mark and the bands are rendered from `scale` on the queue
 * payload, which comes from functions/_lib/academic/marks.js — the one
 * implementation of the arithmetic of a mark. There is no number in
 * this file that decides anything academic. A marking screen holding
 * its own copy of the pass mark is a second source of truth about the
 * most consequential figure this institution produces about a person,
 * and it drifts silently.
 *
 * The endpoint takes a fraction 0..1; the marker works in percent,
 * because that is what the College publishes marks in. The conversion
 * is one division and it happens here, at the boundary.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE RUBRIC CANNOT BE COLLAPSED
 * ─────────────────────────────────────────────────────────────────────
 * `itemBody` is the task the learner was set, which is where the
 * criteria live. It is rendered above the mark on every item and there
 * is no control to hide it. Same for the drill targets on a recording:
 * scoring pronunciation without seeing the target is guessing, so the
 * targets are not optional context.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND A MARK IS NOT SENT WITHOUT A REASON
 * ─────────────────────────────────────────────────────────────────────
 * The platform will accept a mark with no feedback. This page will
 * not: a mark with nothing behind it is a mark a learner cannot act on
 * and cannot appeal, and the College's own regulations promise them
 * both. That is a stricter rule than the endpoint's, held here on
 * purpose and stated to the marker rather than enforced silently.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  /* The five axes, which map exactly to pronunciation_feedback's
     columns and to the dimensions a learner sees in their own profile,
     so a reviewer and a learner always look at the same axes. */
  var DIMS = AR ? [
    ['intelligibility', 'الإبانة', 'هل يفهمه سامعٌ لا يعرف النصّ؟'],
    ['wordStress', 'نبر الكلمة', 'النبر على المقطع الصحيح من الكلمة المفردة.'],
    ['sentenceStress', 'نبر الجملة', 'تشديد الكلمات التي ينبغي تشديدها في الجملة.'],
    ['individualSounds', 'الأصوات المفردة', 'الأصوات التي تدرّب عليها هذه الوحدة بعينها.'],
    ['fluency', 'الطلاقة', 'الإيقاع والوقف، لا السرعة.'],
  ] : [
    ['intelligibility', 'Intelligibility', 'Could a listener who does not know the script understand it?'],
    ['wordStress', 'Word stress', 'Stress on the right syllable of individual words.'],
    ['sentenceStress', 'Sentence stress', 'The right words emphasised across the sentence.'],
    ['individualSounds', 'Individual sounds', 'The specific phonemes this module drills.'],
    ['fluency', 'Fluency', 'Pace and pausing, not speed.'],
  ];

  var T = AR ? {
    loading: 'جارٍ تحميل ما ينتظر التصحيح…',
    ready: 'مكتب التصحيح.',
    readyRest: 'الأقدمُ أوّلًا، وكلُّ عملٍ يحمل معه المعيارَ الذي كُلِّف به.',
    writtenHead: 'العمل المكتوب',
    spokenHead: 'التسجيلات',
    levelLabel: 'المستوى',
    statusLabel: 'المعروض',
    allLevels: 'كلُّ المستويات',
    statuses: [['submitted', 'ما ينتظر التصحيح'], ['graded', 'ما صُحِّح'], ['returned', 'ما رُدَّ']],
    countWritten: 'عملٌ مكتوبٌ ينتظر',
    countSpoken: 'تسجيلٌ ينتظر',
    longest: function (n) { return n > 0 ? 'أطولُ انتظارٍ ' + n + ' يومًا' : 'لا انتظارَ يزيد على يوم'; },
    writtenClear: 'لا عملَ مكتوبًا ينتظر.',
    writtenClearNote: 'كلُّ ما سُلِّم قد صُحِّح. وما يُسلَّم بعدُ يظهر هنا، الأقدمُ أوّلًا.',
    spokenClear: 'لا تسجيلَ ينتظر.',
    spokenClearNote: 'كلُّ ما سُجِّل قد رُوجِع. وما يُسجَّل بعدُ يظهر هنا، الأقدمُ أوّلًا.',
    spokenBasis: 'يُرتَّب هذا الطابور بأقدم تسجيلٍ أوّلًا، وأهدافُ التدريب التي كان المتعلّم يعمل عليها منشورةٌ فوق كلِّ تقدير: تقديرُ النطق من غير رؤية الهدف رجمٌ بالغيب.',
    attempt: function (n) { return 'المحاولة ' + n; },
    resit: 'إعادة',
    rubric: 'المعيار الذي كُلِّف به',
    work: 'ما كتبه المتعلّم',
    priorHead: 'المحاولة السابقة',
    priorMark: function (d) { return 'أُعطيت في ' + d; },
    priorNone: 'لا مِلاحظةَ كُتبت في المرّة السابقة.',
    markLabel: 'الدرجة',
    passHead: 'حدُّ النجاح ',
    passTail: function (s) { return '٪ على مقياس ' + s + '. '; },
    bandIs: function (l, g) { return 'هذه الدرجة في الفئة ' + l + (g === null ? '' : ' · ' + g.toFixed(2)); },
    bandSub: 'دون حدِّ النجاح',
    feedbackLabel: 'الملاحظة إلى المتعلّم',
    feedbackNote: 'تصل هذه الملاحظةُ إلى سجلِّ المتعلّم بجوار الدرجة. اكتب الشيء الواحد الذي ينبغي أن يغيّره؛ فالدرجةُ التي لا سببَ خلفها لا يُعمَل بها ولا يُتظلَّم منها.',
    feedbackNeeded: 'الملاحظة مطلوبة. لا تُرسَل درجةٌ من هذه الصفحة بغير سبب.',
    send: 'أرسل الدرجة',
    sending: 'جارٍ الإرسال…',
    sent: 'سُجِّلت.',
    targets: 'أهداف التدريب',
    noAudio: 'لا صوتَ مرفوعٌ مع هذا التسليم.',
    reviewNote: 'الملاحظة المسموعة أبلغُ من المكتوبة؛ واكتب على كلِّ حالٍ الشيءَ الواحد الذي يُغيَّر قبل المحاولة القادمة.',
    reviewSend: 'أرسل المراجعة',
    duration: function (s) { return 'المدّة ' + s; },
  } : {
    loading: 'Loading what is waiting to be marked…',
    ready: 'The marking desk.',
    readyRest: 'Oldest first, each piece carrying the rubric it was set against.',
    writtenHead: 'Written work',
    spokenHead: 'Recordings',
    levelLabel: 'Level',
    statusLabel: 'Showing',
    allLevels: 'All levels',
    statuses: [['submitted', 'Awaiting a mark'], ['graded', 'Marked'], ['returned', 'Returned']],
    countWritten: 'Written work waiting',
    countSpoken: 'Recordings waiting',
    longest: function (n) { return n > 0 ? 'Longest wait ' + n + (n === 1 ? ' day' : ' days') : 'Nothing waiting longer than a day'; },
    writtenClear: 'No written work is waiting.',
    writtenClearNote: 'Everything handed in has been marked. What is submitted next appears here, oldest first.',
    spokenClear: 'No recording is waiting.',
    spokenClearNote: 'Everything recorded has been reviewed. What is recorded next appears here, oldest first.',
    spokenBasis: 'This queue is ordered oldest first, and the drill targets the learner was working against are printed above every score: reviewing pronunciation without seeing the target is guessing.',
    attempt: function (n) { return 'Attempt ' + n; },
    resit: 'Resit',
    rubric: 'The task, and the criteria it was set against',
    work: 'What the learner wrote',
    priorHead: 'The attempt before this one',
    priorMark: function (d) { return 'given on ' + d; },
    priorNone: 'No feedback was written last time.',
    markLabel: 'Mark',
    passHead: 'The pass mark is ',
    passTail: function (s) { return '% on the ' + s + ' scale. '; },
    bandIs: function (l, g) { return 'This mark falls in band ' + l + (g === null ? '' : ' · ' + g.toFixed(2)); },
    bandSub: 'Below the pass mark',
    feedbackLabel: 'Feedback to the learner',
    feedbackNote: 'This travels to the learner’s own record beside the mark. Write the one thing they should change — a mark with nothing behind it cannot be acted on and cannot be appealed.',
    feedbackNeeded: 'Feedback is required. No mark leaves this page without a reason behind it.',
    send: 'Record the mark',
    sending: 'Sending…',
    sent: 'Recorded.',
    targets: 'Drilling against',
    noAudio: 'No playable audio is attached to this submission.',
    reviewNote: 'Spoken feedback is stronger than written, but write the one thing they should change before the next take.',
    reviewSend: 'Send the review',
    duration: function (s) { return 'Length ' + s; },
  };

  var scale = null;

  /* ── WRITTEN WORK ──────────────────────────────────────────────────── */

  function bandFor(percent) {
    if (!scale || !scale.bands) return null;
    for (var i = 0; i < scale.bands.length; i++) {
      var b = scale.bands[i];
      if (percent >= b.from && (b.toExclusive === null || percent < b.toExclusive)) return b;
    }
    return null;
  }

  function writtenItem(s) {
    var li = K.plate('li');
    li.setAttribute('data-id', s.id);

    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome('i-quill'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', s.preferredName || s.email || s.userId));
    who.appendChild(K.el('p', 'stf-item__where',
      (s.unitTitle || '') + ' · ' + (s.itemTitle || '')));
    var marks = K.el('div', 'stf-item__marks');
    marks.appendChild(K.chip(K.levelWord(s.levelId)));
    marks.appendChild(K.chip(T.attempt(s.attempt || 1), (s.attempt || 1) > 1 ? 'pinned' : null));
    if (s.previousAttempt) marks.appendChild(K.chip(T.resit, 'pinned'));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    li.appendChild(K.wait(s.waitingDays));

    // The rubric. Dark plate, because it is the College's own text.
    var rubric = K.el('div', 'stf-panel');
    rubric.appendChild(K.el('p', 'stf-panel__label', T.rubric));
    var rb = K.el('div', 'stf-rubric');
    K.prose(rb, s.itemBody);
    rubric.appendChild(rb);
    li.appendChild(rubric);

    // The learner's own words, on paper.
    var work = K.el('div', 'stf-panel');
    work.appendChild(K.el('p', 'stf-panel__label', T.work));
    var wb = K.el('div', 'stf-work');
    K.prose(wb, s.content);
    work.appendChild(wb);
    li.appendChild(work);

    if (s.previousAttempt) li.appendChild(priorPanel(s.previousAttempt));

    li.appendChild(markAct(s, li));
    return li;
  }

  function priorPanel(p) {
    var box = K.el('div', 'stf-prior');
    box.appendChild(K.el('p', 'stf-panel__label', T.priorHead));
    var line = K.el('p');
    line.appendChild(K.el('span', 'stf-prior__mark',
      p.grade === null || p.grade === undefined ? '—' : Math.round(p.grade * 100) + '%'));
    line.appendChild(document.createTextNode(' · ' + T.priorMark(K.when(p.gradedAt))));
    box.appendChild(line);
    var fb = K.el('p');
    fb.setAttribute('dir', 'auto');
    fb.textContent = p.feedback || T.priorNone;
    box.appendChild(fb);
    return box;
  }

  function markAct(s, li) {
    var act = K.el('div', 'stf-act');

    var field = K.el('div', 'stf-field');
    var lab = K.el('label', null, T.markLabel);
    lab.setAttribute('for', 'mk_' + s.id);
    field.appendChild(lab);

    var row = K.el('div', 'stf-mark');
    var range = K.el('input');
    range.type = 'range';
    range.min = '0'; range.max = '100'; range.step = '1';
    range.value = String(scale ? scale.passMark : 70);
    range.id = 'mk_' + s.id;
    var out = K.el('output', 'stf-mark__out', range.value + '%');
    out.setAttribute('for', range.id);
    row.appendChild(range);
    row.appendChild(out);
    field.appendChild(row);

    var line = K.el('p', 'stf-mark__line');
    field.appendChild(line);
    act.appendChild(field);

    /* The pass line and the band this mark lands in, both from the
       platform's own scale. Rebuilt on every move of the handle rather
       than written once, so the marker is never reading a band that
       belonged to the previous value. */
    function paint() {
      var v = Number(range.value);
      out.textContent = v + '%';
      line.textContent = '';
      if (!scale) return;
      line.appendChild(document.createTextNode(T.passHead));
      line.appendChild(K.el('b', null, String(scale.passMark)));
      line.appendChild(document.createTextNode(T.passTail(scale.name)));
      var b = bandFor(v);
      line.appendChild(document.createTextNode(
        b ? T.bandIs(b.letter, b.gradePoint) : T.bandSub));
    }
    range.addEventListener('input', paint);
    paint();

    var fbField = K.el('div', 'stf-field');
    var fbLab = K.el('label', null, T.feedbackLabel);
    fbLab.setAttribute('for', 'fb_' + s.id);
    fbField.appendChild(fbLab);
    var ta = K.el('textarea');
    ta.id = 'fb_' + s.id;
    ta.setAttribute('dir', 'auto');
    fbField.appendChild(ta);
    fbField.appendChild(K.el('p', 'stf-field__note', T.feedbackNote));
    act.appendChild(fbField);

    var buttons = K.el('div', 'stf-buttons');
    var send = K.el('button', 'btn btn--gold', T.send);
    send.type = 'button';
    var said = K.el('span', 'stf-said');
    said.setAttribute('aria-live', 'polite');
    buttons.appendChild(send);
    buttons.appendChild(said);
    act.appendChild(buttons);

    send.addEventListener('click', function () {
      if (!ta.value.trim()) {
        said.setAttribute('data-tone', 'bad');
        said.textContent = T.feedbackNeeded;
        ta.focus();
        return;
      }
      send.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.sending;
      K.api('/api/lms/grade-assignment', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: s.id,
          grade: Number(range.value) / 100,
          feedback: ta.value.trim(),
        }),
      }).then(function () {
        said.setAttribute('data-tone', 'good');
        said.textContent = T.sent;
        K.withdraw(li, function () { written.count -= 1; paintWritten(); });
      }).catch(function (e) {
        send.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = K.trouble(e);
      });
    });

    return act;
  }

  /* ── RECORDINGS ────────────────────────────────────────────────────── */

  function length(ms) {
    if (!ms) return '—';
    var s = Math.round(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function spokenItem(r) {
    var li = K.plate('li');
    li.setAttribute('data-id', r.id);

    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome('i-waveform'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', r.email || r.userId));
    who.appendChild(K.el('p', 'stf-item__where',
      (r.unitTitle || '') + ' · ' + (r.itemTitle || '')));
    var marks = K.el('div', 'stf-item__marks');
    marks.appendChild(K.chip(K.levelWord(r.levelId)));
    marks.appendChild(K.chip(T.attempt(r.attempt || 1), (r.attempt || 1) > 1 ? 'pinned' : null));
    marks.appendChild(K.chip(T.duration(length(r.durationMs))));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    var days = r.submittedAt
      ? Math.max(0, Math.floor((Date.now() - Date.parse(r.submittedAt)) / 86400000))
      : 0;
    li.appendChild(K.wait(days));

    var panel = K.el('div', 'stf-panel');
    if (r.mediaUrl) {
      var audio = K.el('audio');
      audio.controls = true;
      audio.preload = 'none';
      audio.src = r.mediaUrl;
      audio.style.width = '100%';
      panel.appendChild(audio);
    } else {
      panel.appendChild(K.el('p', 'stf-field__note', T.noAudio));
    }
    li.appendChild(panel);

    if (r.targets && r.targets.length) {
      var t = K.el('div', 'stf-panel');
      t.appendChild(K.el('p', 'stf-panel__label', T.targets));
      var tb = K.el('div', 'stf-rubric');
      r.targets.forEach(function (tg) {
        var p = K.el('p');
        p.setAttribute('dir', 'auto');
        p.textContent = String(tg.focus || '').replace(/_/g, ' ') + ' — '
          + (tg.target || '') + (tg.example ? ' · “' + tg.example + '”' : '');
        tb.appendChild(p);
      });
      t.appendChild(tb);
      li.appendChild(t);
    }

    li.appendChild(reviewAct(r, li));
    return li;
  }

  function reviewAct(r, li) {
    var act = K.el('div', 'stf-act');
    var inputs = [];

    DIMS.forEach(function (d) {
      var field = K.el('div', 'stf-field');
      var lab = K.el('label', null, d[1]);
      lab.setAttribute('for', 'sc_' + r.id + '_' + d[0]);
      lab.title = d[2];
      field.appendChild(lab);
      var row = K.el('div', 'stf-mark');
      var range = K.el('input');
      range.type = 'range';
      range.min = '0'; range.max = '100'; range.step = '5';
      range.value = '70';
      range.id = 'sc_' + r.id + '_' + d[0];
      range.setAttribute('data-dim', d[0]);
      var out = K.el('output', 'stf-mark__out', '70%');
      out.setAttribute('for', range.id);
      range.addEventListener('input', function () { out.textContent = range.value + '%'; });
      row.appendChild(range);
      row.appendChild(out);
      field.appendChild(row);
      field.appendChild(K.el('p', 'stf-field__note', d[2]));
      act.appendChild(field);
      inputs.push(range);
    });

    var fbField = K.el('div', 'stf-field');
    var fbLab = K.el('label', null, T.feedbackLabel);
    fbLab.setAttribute('for', 'rfb_' + r.id);
    fbField.appendChild(fbLab);
    var ta = K.el('textarea');
    ta.id = 'rfb_' + r.id;
    ta.setAttribute('dir', 'auto');
    fbField.appendChild(ta);
    fbField.appendChild(K.el('p', 'stf-field__note', T.reviewNote));
    act.appendChild(fbField);

    var buttons = K.el('div', 'stf-buttons');
    var send = K.el('button', 'btn btn--gold', T.reviewSend);
    send.type = 'button';
    var said = K.el('span', 'stf-said');
    said.setAttribute('aria-live', 'polite');
    buttons.appendChild(send);
    buttons.appendChild(said);
    act.appendChild(buttons);

    send.addEventListener('click', function () {
      if (!ta.value.trim()) {
        said.setAttribute('data-tone', 'bad');
        said.textContent = T.feedbackNeeded;
        ta.focus();
        return;
      }
      var scores = {};
      inputs.forEach(function (i) { scores[i.getAttribute('data-dim')] = Number(i.value) / 100; });
      send.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.sending;
      K.api('/api/lms/recording-review', {
        method: 'POST',
        body: JSON.stringify({ recordingId: r.id, comment: ta.value.trim(), scores: scores }),
      }).then(function () {
        said.setAttribute('data-tone', 'good');
        said.textContent = T.sent;
        K.withdraw(li, function () { spoken.count -= 1; paintSpoken(); });
      }).catch(function (e) {
        send.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = K.trouble(e);
      });
    });

    return act;
  }

  /* ── THE TWO QUEUES ────────────────────────────────────────────────── */

  var written = { count: 0, longest: 0 };
  var spoken = { count: 0, longest: 0 };

  function tile(which) {
    return $('[data-tile="' + which + '"]');
  }

  function paintWritten() {
    var t = tile('written');
    t.querySelector('[data-count]').textContent = String(Math.max(0, written.count));
    t.querySelector('[data-label]').textContent = T.countWritten;
    t.querySelector('[data-foot]').textContent = T.longest(written.longest);
    var empty = $('[data-written-empty]');
    empty.hidden = written.count > 0;
    $('[data-written-empty-head]').textContent = T.writtenClear;
    $('[data-written-empty-note]').textContent = T.writtenClearNote;
  }

  function paintSpoken() {
    var t = tile('spoken');
    t.querySelector('[data-count]').textContent = String(Math.max(0, spoken.count));
    t.querySelector('[data-label]').textContent = T.countSpoken;
    t.querySelector('[data-foot]').textContent = T.longest(spoken.longest);
    var empty = $('[data-spoken-empty]');
    empty.hidden = spoken.count > 0;
    $('[data-spoken-empty-head]').textContent = T.spokenClear;
    $('[data-spoken-empty-note]').textContent = T.spokenClearNote;
  }

  function loadWritten() {
    var level = $('[data-written-level]').value;
    var status = $('[data-written-status]').value;
    var q = '?status=' + encodeURIComponent(status) + (level ? '&levelId=' + level : '');
    return K.api('/api/lms/marking-queue' + q).then(function (d) {
      scale = d.scale || scale;
      $('[data-written-basis]').textContent = d.note || '';
      var list = $('[data-written-queue]');
      list.textContent = '';
      (d.submissions || []).forEach(function (s) { list.appendChild(writtenItem(s)); });
      written.count = (d.submissions || []).length;
      written.longest = (d.submissions || []).reduce(function (n, s) {
        return Math.max(n, Number(s.waitingDays) || 0);
      }, 0);
      paintWritten();
      $('#secWritten').hidden = false;
    });
  }

  function loadSpoken() {
    var level = $('[data-spoken-level]').value;
    return K.api('/api/lms/review-queue' + (level ? '?levelId=' + level : '')).then(function (rows) {
      var list = $('[data-spoken-queue]');
      list.textContent = '';
      var arr = Array.isArray(rows) ? rows : [];
      arr.forEach(function (r) { list.appendChild(spokenItem(r)); });
      spoken.count = arr.length;
      spoken.longest = arr.reduce(function (n, r) {
        var at = Date.parse(r.submittedAt);
        return Math.max(n, Number.isFinite(at) ? Math.floor((Date.now() - at) / 86400000) : 0);
      }, 0);
      $('[data-spoken-basis]').textContent = T.spokenBasis;
      paintSpoken();
      $('#secSpoken').hidden = false;
    });
  }

  function labels() {
    $('[data-written-head]').textContent = T.writtenHead;
    $('[data-spoken-head]').textContent = T.spokenHead;
    $('[data-written-level-label]').textContent = T.levelLabel;
    $('[data-spoken-level-label]').textContent = T.levelLabel;
    $('[data-written-status-label]').textContent = T.statusLabel;
    K.fillLevels($('[data-written-level]'), T.allLevels);
    K.fillLevels($('[data-spoken-level]'), T.allLevels);
    K.fillOptions($('[data-written-status]'), T.statuses);
  }

  function load() {
    $('#state').textContent = T.loading;
    labels();
    Promise.all([loadWritten(), loadSpoken()]).then(function () {
      $('#state').textContent = T.ready + ' ' + T.readyRest;
      $('#secCounts').hidden = false;
    }).catch(function (e) {
      $('#state').textContent = K.trouble(e);
    });
  }

  $ && document.addEventListener('DOMContentLoaded', function () {
    $('[data-written-level]').addEventListener('change', function () {
      loadWritten().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
    $('[data-written-status]').addEventListener('change', function () {
      loadWritten().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
    $('[data-spoken-level]').addEventListener('change', function () {
      loadSpoken().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
  });

  K.boot(load);
})();
