/* WEC-LC — My Module.
 *
 * The interface for GET /api/lms/units, GET /api/lms/unit,
 * POST /api/lms/quiz-attempt, POST /api/lms/assignment-submission and
 * GET /api/lms/live-sessions. Items 14 and 15 of the interface backlog,
 * and the gap underneath them: nothing on this site opened a module.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE ALLOWANCE IS PRINTED BESIDE THE PAPER
 * ─────────────────────────────────────────────────────────────────────
 * `reassessment` rides on every quiz and every assignment and it is
 * rendered before the button, never after the refusal. The module's own
 * note is the argument: discovering that a resit needs a fortnight's
 * wait by being refused one reads as an obstruction; reading it beside
 * the paper reads as a College that has thought about how people learn.
 *
 * Where an allowance is spent the page says what the regulations say
 * happens next — the level is repeated and the assessment is set afresh
 * — rather than greying a button and leaving a learner at a wall.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE ANSWERS ARE MARKED ON THE SERVER, AND ONLY THERE
 * ─────────────────────────────────────────────────────────────────────
 * `correct_index` is never sent to the client, deliberately. This page
 * collects choices and posts them; it does not know, and must not be
 * able to work out, which one is right. The score that comes back is
 * the College's.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AUDIO WORK BELONGS TO THE LABORATORY
 * ─────────────────────────────────────────────────────────────────────
 * Listening and pronunciation items carry recording, a waveform and a
 * synchronised transcript, and /listening-lab.html does all of it. This
 * page names those items and sends the learner there rather than
 * building a second, worse recorder beside the first.
 *
 * Every value reaches the page through textContent.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';
  var LAB = AR ? '/ar/listening-lab.html' : '/listening-lab.html';

  var T = AR ? {
    loading: 'جارٍ تحميل الوحدة…',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'وحداتك خاصّةٌ بك. سجّل الدخول لتفتحها.',
    failed: 'تعذّر تحميل الوحدة.',
    failedRest: 'هذا خللٌ عندنا. أعد المحاولة بعد قليل.',
    ready: 'الوحدة مفتوحة.',
    readyRest: 'ادرسها، ثمّ سلِّم ما فيها.',
    noEnrolment: 'لا تسجيلَ فعّالًا لك في مستوًى، فلا وحدةَ تُفتح. ويجيب مكتب القبول عن السؤال.',
    // The seven the schema admits, not the four the first draft of this
    // page happened to meet. A kind with no name here would render its
    // database value on the face of the card.
    kinds: {
      reading: 'قراءة', video: 'مادّة مرئيّة', quiz: 'اختبار',
      assignment: 'واجب', live_session: 'حصّة حيّة',
      listening: 'استماع', pronunciation: 'نطق',
    },
    progress: { not_started: 'لم تُبدَأ', in_progress: 'قيد الدراسة', completed: 'مكتملة', marked: 'مصحَّحة' },
    toLab: 'افتح في معمل الاستماع',
    labWhy: 'التسجيل والموجة والنصُّ المتزامن كلُّها في المعمل، وهو موضعها.',
    answer: 'أجِب',
    submitQuiz: 'سلِّم الإجابات',
    submitting: 'جارٍ التسليم…',
    needAll: 'أجِب عن كلّ سؤالٍ قبل التسليم.',
    scored: function (c, t, p) { return 'أصبتَ ' + c + ' من ' + t + ' — ' + p + '٪.'; },
    passedYes: 'وهذه الجلسة عند حدّ النجاح أو فوقه.',
    passedNo: 'وهذه الجلسة دون حدّ النجاح.',
    attempts: function (t, n) { return 'الجلسات: ' + t + ' من ' + n + '.'; },
    remaining: function (n) { return n === 1 ? 'وبقيت جلسةٌ واحدة.' : 'وبقيت ' + n + ' جلسات.'; },
    nextOrdinal: function (n) { return 'والجلسة القادمة رقمها ' + n + '.'; },
    waitUntil: function (d) { return 'وتُفتح الجلسة التالية في ' + d + '؛ فبين الجلستين أربعة عشر يومًا.'; },
    exhausted: 'أُنفقت الجلسات الثلاث. ويُعاد المستوى ويُوضع التقييم من جديد؛ ولا رسمَ على ذلك.',
    isResit: 'وهذه إعادة: الدرجة المكتسَبة فيها تُحتسَب إلى سبعين.',
    awaiting: 'سُلِّم وينتظر التصحيح.',
    passedAlready: 'اجتزتَ هذا التقييم.',
    noFee: 'ولا رسمَ على الإعادة.',
    taskRefresh: 'وقد مضى على أوّل جلسةٍ أكثر من سنة، فتُوضع مهمّةٌ جديدة لا تُعاد القديمة.',
    yourAnswer: 'إجابتك',
    assignmentWrite: 'اكتب تسليمك',
    submitAssignment: 'سلِّم الواجب',
    submitted: function (d) { return 'سُلِّم في ' + d; },
    graded: function (g) { return 'الدرجة: ' + g + '٪'; },
    feedback: 'ملاحظات المصحِّح',
    statuses: { submitted: 'مُسلَّم', graded: 'مصحَّح', returned: 'مُعاد' },
    liveLede: function (n) {
      return n === 0
        ? 'لم تُجدوَل بعدُ ساعةٌ حيّةٌ لهذا المستوى. والوحدة تُدرَس في وقتك أنت، والساعات الحيّة زيادةٌ عليها لا شرطٌ فيها.'
        : n + ' ساعةً حيّةً مجدولةً لهذا المستوى.';
    },
    join: 'الدخول',
    noItems: 'لا مادّةَ في هذه الوحدة بعد.',
    pickerState: function (s) { return 'الحال: ' + s; },
  } : {
    loading: 'Loading the module…',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your modules are private to you. Sign in to open them.',
    failed: 'The module could not be loaded.',
    failedRest: 'This is a fault on our side. Please try again shortly.',
    ready: 'The module is open.',
    readyRest: 'Study it, then submit what it asks for.',
    noEnrolment: 'You have no live enrolment on a level, so there is no module to open. The Admissions office answers that.',
    kinds: {
      reading: 'Reading', video: 'Video', quiz: 'Quiz',
      assignment: 'Assignment', live_session: 'Live session',
      listening: 'Listening', pronunciation: 'Pronunciation',
    },
    progress: { not_started: 'Not started', in_progress: 'In progress', completed: 'Completed', marked: 'Marked' },
    toLab: 'Open in the Listening Lab',
    labWhy: 'Recording, the waveform and the synchronised transcript all live in the Lab, which is where they belong.',
    answer: 'Answer',
    submitQuiz: 'Submit your answers',
    submitting: 'Submitting…',
    needAll: 'Answer every question before submitting.',
    scored: function (c, t, p) { return 'You answered ' + c + ' of ' + t + ' correctly — ' + p + '%.'; },
    passedYes: 'This sitting is at or above the pass mark.',
    passedNo: 'This sitting is below the pass mark.',
    attempts: function (t, n) { return 'Sittings: ' + t + ' of ' + n + '.'; },
    remaining: function (n) { return n === 1 ? 'One sitting remains.' : n + ' sittings remain.'; },
    nextOrdinal: function (n) { return 'The next sitting is number ' + n + '.'; },
    waitUntil: function (d) { return 'The next sitting opens on ' + d + ' — fourteen days stand between sittings.'; },
    exhausted: 'All three sittings are spent. The level is repeated and the assessment is set afresh, and nothing is charged for either.',
    isResit: 'This is a resit: a mark earned at one counts to seventy.',
    awaiting: 'Submitted, and waiting to be marked.',
    passedAlready: 'You have passed this assessment.',
    noFee: 'A resit carries no fee.',
    taskRefresh: 'More than a year has passed since the first sitting, so a fresh task is set rather than the old one reissued.',
    yourAnswer: 'Your answer',
    assignmentWrite: 'Write your submission',
    submitAssignment: 'Submit the assignment',
    submitted: function (d) { return 'Submitted ' + d; },
    graded: function (g) { return 'Marked: ' + g + '%'; },
    feedback: 'The marker’s feedback',
    statuses: { submitted: 'Submitted', graded: 'Marked', returned: 'Returned' },
    liveLede: function (n) {
      return n === 0
        ? 'No live hour is scheduled for this level yet. The module is studied in your own time; a live hour is an addition to it and never a condition of it.'
        : n + ' live hour' + (n === 1 ? '' : 's') + ' scheduled for this level.';
    },
    join: 'Join',
    noItems: 'This module has no material in it yet.',
    pickerState: function (s) { return 'State: ' + s; },
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  function when(iso, withTime) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    var o = { day: 'numeric', month: 'long', year: 'numeric' };
    if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; }
    return d.toLocaleString(LOCALE, o);
  }

  var authHeaders = {};

  function api(path, opts) {
    var o = opts || {};
    o.headers = Object.assign({ Accept: 'application/json' }, authHeaders, o.headers || {});
    if (o.body) o.headers['Content-Type'] = 'application/json';
    return fetch(path, o).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; },
        function () { return { ok: r.ok, status: r.status, data: null }; });
    });
  }

  function state(strong, rest) {
    var box = $('#state');
    box.textContent = '';
    if (strong) box.appendChild(el('strong', null, strong + ' '));
    box.appendChild(document.createTextNode(rest || ''));
  }

  function reasonFrom(body, fallback) {
    if (!body) return fallback;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.error === 'string' && /\s/.test(body.error)) return body.error;
    return fallback;
  }

  var levelId = null;
  var units = [];
  var current = null;

  /* ── THE ALLOWANCE ───────────────────────────────────────────────── */

  /**
   * Everything `reassessment` says, in the order a learner needs it:
   * where they stand, what remains, and — where nothing remains — what
   * the regulations say happens instead. Never a greyed button alone.
   */
  function allowanceInto(node, r) {
    node.textContent = '';
    if (!r) return;
    node.appendChild(el('p', 'mod-allow__line',
      T.attempts(r.attemptsTaken, r.totalAttempts)
      + (r.attemptsRemaining ? ' ' + T.remaining(r.attemptsRemaining) : '')));

    if (r.passed) {
      node.appendChild(el('p', 'mod-allow__line', T.passedAlready));
    } else if (r.awaitingMarking) {
      node.appendChild(el('p', 'mod-allow__line', T.awaiting));
    }
    if (r.mustRepeatLevel) {
      node.appendChild(el('p', 'mod-allow__line mod-allow__line--wall', T.exhausted));
      return;
    }
    if (!r.intervalHeld && r.nextPermittedAt) {
      node.appendChild(el('p', 'mod-allow__line mod-allow__line--wait',
        T.waitUntil(when(r.nextPermittedAt))));
    }
    if (r.mayAttempt) {
      node.appendChild(el('p', 'mod-allow__line', T.nextOrdinal(r.nextAttemptOrdinal)));
    }
    if (r.isResit) node.appendChild(el('p', 'mod-allow__line', T.isResit));
    if (r.taskRefreshDue) node.appendChild(el('p', 'mod-allow__line', T.taskRefresh));
    // The fee is nought and the page says so. A learner deciding whether
    // to sit again should not have to look for the price.
    if (r.feeUsd === 0) node.appendChild(el('p', 'mod-allow__line mod-allow__line--quiet', T.noFee));
  }

  /* ── THE ITEMS ───────────────────────────────────────────────────── */

  function itemShell(item) {
    var li = el('li', 'mod-item card edge-lit edge-lit--light aurum aurum--hover tilt gold-live');
    li.appendChild(el('span', 'tilt__sheen'));
    li.lastChild.setAttribute('aria-hidden', 'true');
    li.setAttribute('data-kind', item.kind);
    var marks = el('p', 'mod-item__marks');
    marks.appendChild(el('span', 'mod-chip mod-chip--' + item.kind, T.kinds[item.kind] || item.kind));
    li.appendChild(marks);
    li.appendChild(el('h3', 'mod-item__title', item.title || ''));
    if (item.body) {
      var body = el('div', 'mod-item__body');
      String(item.body).split(/\n{2,}/).forEach(function (p) {
        if (p.trim()) body.appendChild(el('p', null, p.trim()));
      });
      li.appendChild(body);
    }
    return li;
  }

  function labLink(item) {
    var wrap = el('div', 'mod-lab');
    wrap.appendChild(el('p', 'mod-lab__why', T.labWhy));
    var a = el('a', 'btn btn--outline magnetic', T.toLab);
    a.href = LAB + '?unit=' + encodeURIComponent(current.id) + '&item=' + encodeURIComponent(item.id);
    wrap.appendChild(a);
    return wrap;
  }

  function quizInto(li, item) {
    var allow = el('div', 'mod-allow');
    allowanceInto(allow, item.reassessment);
    li.appendChild(allow);

    var result = el('p', 'mod-result');
    result.hidden = true;
    li.appendChild(result);
    var err = el('p', 'vfy-error');
    err.setAttribute('role', 'alert');
    li.appendChild(err);

    if (!item.reassessment || !item.reassessment.mayAttempt) return;

    var form = el('div', 'mod-quiz');
    var chosen = {};
    (item.questions || []).forEach(function (q, qi) {
      var block = el('div', 'mod-q');
      block.appendChild(el('p', 'mod-q__prompt', (qi + 1) + '. ' + (q.prompt || '')));
      var list = el('div', 'mod-q__choices');
      (q.choices || []).forEach(function (choice, ci) {
        var id = 'q_' + q.id + '_' + ci;
        var row = el('label', 'mod-choice');
        row.htmlFor = id;
        var input = document.createElement('input');
        input.type = 'radio';
        input.name = 'q_' + q.id;
        input.id = id;
        input.value = String(ci);
        input.addEventListener('change', function () { chosen[q.id] = ci; });
        row.appendChild(input);
        row.appendChild(el('span', 'mod-choice__text', String(choice)));
        list.appendChild(row);
      });
      block.appendChild(list);
      form.appendChild(block);
    });

    var row = el('div', 'btn-row');
    var send = el('button', 'btn btn--gold magnetic aurum aurum--twin', T.submitQuiz);
    send.type = 'button';
    send.addEventListener('click', function () {
      err.textContent = '';
      var qs = item.questions || [];
      // Every question, or none of it. A partial submission spends a
      // sitting on an incomplete paper, and the allowance is only three.
      var answers = qs.map(function (q) { return chosen[q.id]; });
      if (answers.some(function (a) { return a === undefined; })) {
        err.textContent = T.needAll;
        return;
      }
      send.disabled = true;
      send.textContent = T.submitting;
      api('/api/lms/quiz-attempt', {
        method: 'POST',
        body: JSON.stringify({ learningItemId: item.id, answers: answers }),
      }).then(function (r) {
        send.disabled = false;
        send.textContent = T.submitQuiz;
        if (!r.ok) { err.textContent = reasonFrom(r.data, T.failed); return; }
        var d = r.data;
        result.hidden = false;
        result.textContent = T.scored(d.correctCount, d.totalQuestions,
          Math.round((d.score || 0) * 100)) + ' ' + (d.passed ? T.passedYes : T.passedNo);
        // The allowance is re-read from the answer, not decremented
        // here: the server counts sittings and the page reports them.
        allowanceInto(allow, d.reassessment);
        form.remove();
        row.remove();
      });
    });
    row.appendChild(send);
    li.appendChild(form);
    li.appendChild(row);
  }

  function assignmentInto(li, item) {
    var allow = el('div', 'mod-allow');
    allowanceInto(allow, item.reassessment);
    li.appendChild(allow);

    var sub = item.mySubmission;
    if (sub) {
      var box = el('div', 'mod-sub');
      var head = el('p', 'mod-sub__head');
      head.appendChild(el('span', 'mod-chip mod-chip--' + sub.status,
        T.statuses[sub.status] || sub.status));
      head.appendChild(el('span', 'mod-sub__at', T.submitted(when(sub.submittedAt))));
      box.appendChild(head);
      if (sub.grade !== null && sub.grade !== undefined) {
        box.appendChild(el('p', 'mod-sub__grade', T.graded(Math.round(sub.grade))));
      }
      if (sub.feedback) {
        box.appendChild(el('p', 'mod-sub__fbhead', T.feedback));
        String(sub.feedback).split(/\n{2,}/).forEach(function (p) {
          if (p.trim()) box.appendChild(el('p', 'mod-sub__fb', p.trim()));
        });
      }
      li.appendChild(box);
    }

    var err = el('p', 'vfy-error');
    err.setAttribute('role', 'alert');
    li.appendChild(err);
    if (!item.reassessment || !item.reassessment.mayAttempt) return;

    var label = el('label', 'vfy-label', T.assignmentWrite);
    var ta = document.createElement('textarea');
    ta.rows = 8;
    ta.id = 'sub_' + item.id;
    label.htmlFor = ta.id;
    li.appendChild(label);
    li.appendChild(ta);

    var row = el('div', 'btn-row');
    var send = el('button', 'btn btn--gold magnetic aurum aurum--twin', T.submitAssignment);
    send.type = 'button';
    send.addEventListener('click', function () {
      err.textContent = '';
      var text = (ta.value || '').trim();
      if (!text) { err.textContent = T.needAll; return; }
      send.disabled = true;
      send.textContent = T.submitting;
      api('/api/lms/assignment-submission', {
        method: 'POST',
        body: JSON.stringify({ learningItemId: item.id, content: text }),
      }).then(function (r) {
        send.disabled = false;
        send.textContent = T.submitAssignment;
        if (!r.ok) { err.textContent = reasonFrom(r.data, T.failed); return; }
        // Re-read the whole module: a submission moves the module's own
        // recorded state as well as this item's, and the page must not
        // guess at either.
        openUnit(current.id);
      });
    });
    row.appendChild(send);
    li.appendChild(row);
  }

  function renderUnit(u) {
    current = u;
    $('[data-module-title]').textContent = u.title || '';
    $('[data-picker-state]').textContent = T.pickerState(
      T.progress[u.progressStatus] || u.progressStatus);

    $('#secItems').hidden = false;
    var list = $('[data-items]');
    list.textContent = '';
    var items = u.items || [];
    var empty = $('[data-items-empty]');
    empty.hidden = items.length > 0;
    empty.textContent = items.length ? '' : T.noItems;

    items.forEach(function (item) {
      var li = itemShell(item);
      if (item.kind === 'quiz') quizInto(li, item);
      else if (item.kind === 'assignment') assignmentInto(li, item);
      else if (item.kind === 'listening' || item.kind === 'pronunciation') li.appendChild(labLink(item));
      list.appendChild(li);
    });
  }

  function openUnit(unitId) {
    return api('/api/lms/unit?id=' + encodeURIComponent(unitId)).then(function (r) {
      if (!r.ok) { state(T.failed, reasonFrom(r.data, T.failedRest)); return; }
      renderUnit(r.data);
      state(T.ready, T.readyRest);
    });
  }

  /* ── THE LEVEL'S LIVE HOURS ──────────────────────────────────────── */

  function renderLive(sessions) {
    $('#secLive').hidden = false;
    $('[data-live-lede]').textContent = T.liveLede((sessions || []).length);
    var list = $('[data-live]');
    list.textContent = '';
    (sessions || []).forEach(function (s) {
      var li = el('li', 'mod-live__item');
      li.appendChild(el('p', 'mod-live__title', s.title || ''));
      li.appendChild(el('p', 'mod-live__when', when(s.startsAt || s.starts_at, true)));
      var url = s.joinUrl || s.join_url;
      if (url) {
        var a = el('a', 'btn btn--outline magnetic', T.join);
        a.href = url;
        a.rel = 'noopener';
        a.target = '_blank';
        li.appendChild(a);
      }
      list.appendChild(li);
    });
    var empty = $('[data-live-empty]');
    empty.hidden = (sessions || []).length > 0;
    empty.textContent = '';
  }

  /* ── LOADING ─────────────────────────────────────────────────────── */

  /* The level is the learner's own FIRST live enrolment, read from the
     standing endpoint — the same rule /my-standing.html follows, so the
     two pages never disagree about which level a learner is on. */
  function findLevel() {
    return api('/api/student/standing').then(function (r) {
      if (r.status === 401) return 'auth';
      if (!r.ok || !r.data) return 'fail';
      var live = (r.data.levels || []).find(function (l) {
        return l.enrolment && l.enrolment.status === 'active';
      });
      levelId = live ? live.levelId : null;
      if (live) {
        $('[data-level-eyebrow]').textContent = (AR ? 'المستوى ' : 'Level ')
          + (live.roman || '') + (live.name ? ' — ' + live.name : '');
      }
      return levelId ? 'ok' : 'none';
    });
  }

  function loadUnits() {
    return api('/api/lms/units?levelId=' + levelId).then(function (r) {
      if (!r.ok) return 'fail';
      units = (r.data && r.data.units) || r.data || [];
      if (!Array.isArray(units)) units = [];
      var sel = $('[data-module-pick]');
      sel.textContent = '';
      units.forEach(function (u) {
        var o = el('option', null, u.title || '');
        o.value = u.id;
        sel.appendChild(o);
      });
      $('#secPicker').hidden = units.length === 0;
      return units.length ? 'ok' : 'none';
    });
  }

  function boot() {
    state(T.loading, '');
    findLevel().then(function (r) {
      if (r === 'auth') { state(T.signedOut, T.signedOutRest); return; }
      if (r === 'fail') { state(T.failed, T.failedRest); return; }
      if (r === 'none') { state(T.failed, T.noEnrolment); return; }
      $('#scope').hidden = false;
      api('/api/lms/live-sessions?levelId=' + levelId).then(function (lr) {
        if (lr.ok) renderLive(lr.data && lr.data.sessions);
      });
      loadUnits().then(function (u) {
        if (u !== 'ok') { state(T.failed, T.noEnrolment); return; }
        // An id in the address wins, so a link from My Programme or from
        // a notice opens the module it names; otherwise the first.
        var asked = new URLSearchParams(window.location.search).get('unit');
        var pick = units.find(function (x) { return x.id === asked; }) || units[0];
        $('[data-module-pick]').value = pick.id;
        openUnit(pick.id);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-module-pick]').addEventListener('change', function (e) {
      openUnit(e.target.value);
    });

    var cfg = window.WEC_LC_AUTH || {};
    if (cfg.clerkPublishableKey && typeof window.WEC_LC_loadClerk === 'function') {
      window.WEC_LC_loadClerk(cfg.clerkPublishableKey, function (err, clerk) {
        if (!err && clerk && clerk.session) {
          clerk.session.getToken().then(function (tok) {
            if (tok) authHeaders.Authorization = 'Bearer ' + tok;
            boot();
          }).catch(boot);
          return;
        }
        boot();
      });
      return;
    }
    boot();
  });
})();
