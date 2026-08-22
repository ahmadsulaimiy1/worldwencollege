/* WEC-LC — Cases.
 *
 * The interface for GET / PATCH /api/staff/cases.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE CONFLICT RULE IS SHOWN BEFORE IT IS ENFORCED
 * ─────────────────────────────────────────────────────────────────────
 * The College's regulations say that at every stage the decision passes
 * to somebody who was not part of the last one, and the server refuses
 * an answer from a conflicted account before it validates anything
 * else. But a rule that only ever appears as a refusal is a rule the
 * person meets as an obstruction.
 *
 * So the queue carries, with every case, the accounts that may not hear
 * it. This page reads its own account id once and, where it is on that
 * list, offers no answer form at all and says why. The refusal on the
 * server is the backstop; this is the mechanism.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE DECIDER IS THE SESSION
 * ─────────────────────────────────────────────────────────────────────
 * There is no field here naming who answered, because the endpoint
 * refuses one — that parameter is the single way the conflict rule
 * could be reached around, and an interface built on it would let the
 * College nominate who decided.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND THE OUTCOMES OFFERED ARE THE ONES THIS KIND OF CASE HAS
 * ─────────────────────────────────────────────────────────────────────
 * A deferral is granted or refused; it is not "upheld". Offering an
 * appeal's vocabulary on a request to pause is how a learner ends up
 * reading that their request was "not upheld" — a sentence about an
 * argument they never made. Two outcomes belong to the Academic Senate
 * alone and are not offered below stage two.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  /* The vocabulary of each kind of case, exactly as
     functions/_lib/registrar/cases.js holds it. Where the two ever
     disagree the server refuses, which is the right direction for a
     drift to fail in. */
  var OUTCOMES_BY_KIND = {
    appeal: ['upheld', 'partly_upheld', 'not_upheld', 'substituted', 'returned_for_fresh_assessment'],
    complaint: ['upheld', 'partly_upheld', 'not_upheld'],
    withdrawal: ['granted', 'refused'],
    deferral: ['granted', 'refused'],
    transfer: ['granted', 'refused'],
  };
  var SENATE_ONLY = ['substituted', 'returned_for_fresh_assessment'];

  var T = AR ? {
    loading: 'جارٍ تحميل القضايا…',
    ready: 'قضايا الكلّية.',
    readyRest: 'بالترتيب الذي يُستحقّ به الجواب.',
    countLive: 'قضيّةٌ قائمة',
    countOverdue: 'جاوزت تاريخ جوابها',
    countYours: 'لك أن تجيب عنها',
    ofThose: 'من القائم',
    conflictNote: 'بحسب قاعدة تعارُض المصلحة',
    procedureHead: 'الإجراء المنشور',
    instrumentHead: 'المستند',
    skipHead: 'لا تُتخطّى مرحلة',
    daysHead: 'يوم العمل',
    daysBody: function (n, d) { return n + ' يومَ عملٍ للجواب. ' + d; },
    queueHead: 'الطابور',
    stageLabel: 'المرحلة',
    overdueLabel: 'المدى',
    allStages: 'كلُّ المراحل القائمة',
    overdueOptions: [['false', 'كلُّ ما هو قائم'], ['true', 'ما جاوز تاريخه فقط']],
    stages: [
      ['received', 'وردت'], ['stage_one', 'المرحلة الأولى'], ['stage_two', 'المرحلة الثانية'],
      ['stage_three', 'المرحلة الثالثة'], ['awaiting_information', 'بانتظار بيان'],
      ['determined', 'مقضيّة'], ['closed', 'مغلقة'],
    ],
    kinds: {
      appeal: 'تظلُّم', complaint: 'شكوى', withdrawal: 'انسحاب',
      deferral: 'تأجيل', transfer: 'انتقال',
    },
    matters: {
      academic: 'أكاديمي', conduct: 'سلوك', welfare: 'رعاية',
      fair_treatment: 'إنصاف', administrative: 'إداري',
    },
    outcomes: {
      upheld: 'قُبِل', partly_upheld: 'قُبِل جزئيًّا', not_upheld: 'لم يُقبَل',
      granted: 'مُنِح', refused: 'رُفِض',
      substituted: 'حلَّ المجلسُ الأكاديمي قرارَه محلَّه',
      returned_for_fresh_assessment: 'أُعيد لتقييمٍ جديدٍ من مصحّحٍ آخر',
      withdrawn_by_learner: 'سحبها المتعلّم',
    },
    heardBy: 'يسمعها: ',
    due: function (d) { return 'يُستحقّ الجواب في ' + d; },
    overdue: function (d) { return 'كان الجوابُ مستحقًّا في ' + d + '، وقد فات.'; },
    opened: function (d) { return 'فُتحت في ' + d; },
    queueEmpty: 'لا قضيّةَ قائمة.',
    queueEmptyNote: 'لا شيءَ ينتظر الجوابَ الآن. وما يُفتَح يظهر هنا في موضعه من الترتيب.',
    answerHead: 'أجب عن هذه القضيّة',
    answerWhy: 'يُقيَّد الجوابُ باسم الحساب الذي أنت فيه؛ ولا حقلَ يسمّي غيرَك. واكتب للمتعلّم لا عن المتعلّم.',
    outcomeLabel: 'الحكم',
    decisionLabel: 'الجواب، بلفظه',
    decisionNote: 'يُقرأ هذا كما هو في سجلّ المتعلّم. وإن أُعيدت القضيّةُ إلى مرحلةٍ أعلى فهو أوّلُ ما يُقرأ فيها.',
    send: 'قيِّد الجواب',
    sending: 'جارٍ التقييد…',
    sent: 'قُيِّد.',
    needDecision: 'الجواب مطلوب.',
    barredHead: 'لست ممّن يسمعها',
    barredWhy: 'حسابُك من الحسابات التي لا تسمع هذه القضيّة، لأنّها تمسّ قرارًا كنتَ طرفًا فيه. والقاعدةُ منشورة: في كلّ مرحلةٍ ينتقل القرارُ إلى مَن لم يكن طرفًا في التي قبلها.',
    notHearing: 'ليست في مرحلةِ سماع',
    answeredAlready: 'أُجيبت',
  } : {
    loading: 'Loading the caseload…',
    ready: 'The College’s cases.',
    readyRest: 'In the order each answer falls due.',
    countLive: 'Cases live',
    countOverdue: 'Past their answer date',
    countYours: 'You may answer',
    ofThose: 'of those live',
    conflictNote: 'under the conflict rule',
    procedureHead: 'The published procedure',
    instrumentHead: 'The instrument',
    skipHead: 'No stage is skipped',
    daysHead: 'A working day',
    daysBody: function (n, d) { return n + ' working days to answer. ' + d; },
    queueHead: 'The queue',
    stageLabel: 'Stage',
    overdueLabel: 'Showing',
    allStages: 'Every live stage',
    overdueOptions: [['false', 'Everything live'], ['true', 'Only what is past its date']],
    stages: [
      ['received', 'Received'], ['stage_one', 'Stage one'], ['stage_two', 'Stage two'],
      ['stage_three', 'Stage three'], ['awaiting_information', 'Awaiting information'],
      ['determined', 'Determined'], ['closed', 'Closed'],
    ],
    kinds: {
      appeal: 'Appeal', complaint: 'Complaint', withdrawal: 'Withdrawal',
      deferral: 'Deferral', transfer: 'Transfer',
    },
    matters: {
      academic: 'Academic', conduct: 'Conduct', welfare: 'Welfare',
      fair_treatment: 'Fair treatment', administrative: 'Administrative',
    },
    outcomes: {
      upheld: 'Upheld', partly_upheld: 'Partly upheld', not_upheld: 'Not upheld',
      granted: 'Granted', refused: 'Refused',
      substituted: 'The Academic Senate substitutes its own decision',
      returned_for_fresh_assessment: 'Returned for fresh assessment by a different marker',
      withdrawn_by_learner: 'Withdrawn by the learner',
    },
    heardBy: 'Heard by: ',
    due: function (d) { return 'An answer is due ' + d; },
    overdue: function (d) { return 'An answer was due ' + d + ', and that date has passed.'; },
    opened: function (d) { return 'Opened ' + d; },
    queueEmpty: 'No case is live.',
    queueEmptyNote: 'Nothing is waiting for an answer. What is opened next appears here, in its place in the order.',
    answerHead: 'Answer this case',
    answerWhy: 'The answer is recorded under the account you are signed in as, and there is no field naming anybody else. Write to the learner rather than about them.',
    outcomeLabel: 'Outcome',
    decisionLabel: 'The answer, in your own words',
    decisionNote: 'This is read exactly as written on the learner’s own record. If the case is escalated, it is the first thing the next stage reads.',
    send: 'Record the answer',
    sending: 'Recording…',
    sent: 'Recorded.',
    needDecision: 'The answer itself is required.',
    barredHead: 'You are not one of the people who may hear this',
    barredWhy: 'Your account is among those that may not hear this case, because it touches a decision you were part of. The rule is published: at every stage the decision passes to somebody who was not part of the last one.',
    notHearing: 'Not at a hearing stage',
    answeredAlready: 'Answered',
  };

  var me = null;

  function kindWord(k) { return T.kinds[k] || k || ''; }
  function matterWord(m) { return T.matters[m] || m || ''; }
  function outcomeWord(o) { return T.outcomes[o] || o || ''; }

  /* ── ONE CASE ──────────────────────────────────────────────────────── */

  function caseItem(c) {
    var li = K.plate('li');
    li.setAttribute('data-id', c.id);
    li.setAttribute('data-overdue', c.overdue ? 'yes' : 'no');

    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome(c.outcome ? 'i-struck' : 'i-scales'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', c.summary || c.reference || ''));
    who.appendChild(K.el('p', 'stf-item__where',
      (c.reference || '') + ' · ' + T.opened(K.when(c.openedAt))
      + (c.heardBy ? ' · ' + T.heardBy + c.heardBy : '')));

    var marks = K.el('div', 'stf-item__marks');
    marks.appendChild(K.chip(kindWord(c.kind), 'pinned'));
    marks.appendChild(K.chip(matterWord(c.matter)));
    marks.appendChild(K.chip(c.stageLabel || c.stage));
    if (c.levelId) marks.appendChild(K.chip(K.levelWord(c.levelId)));
    if (c.outcome) marks.appendChild(K.chip(outcomeWord(c.outcome), 'answered'));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    // The clock, said in words. Overdue is stated plainly rather than
    // signalled in a colour a reader has to interpret.
    var clockLine = K.el('p', 'stf-wait__read');
    clockLine.textContent = c.answerDue
      ? (c.overdue ? T.overdue(K.when(c.answerDue)) : T.due(K.when(c.answerDue)))
      : '';
    if (clockLine.textContent) li.appendChild(clockLine);

    li.appendChild(answerFor(c, li));
    return li;
  }

  /**
   * What this member of staff may do with this case, and the honest
   * sentence where the answer is not theirs to give.
   */
  function answerFor(c, li) {
    var barred = (c.barredFromHearing || []).indexOf(me && me.id) !== -1;

    if (barred) {
      var box = K.el('div', 'stf-prior');
      box.appendChild(K.el('p', 'stf-panel__label', T.barredHead));
      box.appendChild(K.el('p', null, T.barredWhy));
      return box;
    }

    if (!c.expectedPost) {
      var note = K.el('p', 'stf-item__where');
      note.textContent = c.outcome ? T.answeredAlready : T.notHearing;
      return note;
    }

    var act = K.el('div', 'stf-act');
    act.appendChild(K.el('h3', null, T.answerHead));
    act.appendChild(K.el('p', 'stf-field__note', T.answerWhy));

    var of = K.el('div', 'stf-field');
    var ol = K.el('label', null, T.outcomeLabel);
    ol.setAttribute('for', 'oc_' + c.id);
    of.appendChild(ol);
    var os = K.el('select');
    os.id = 'oc_' + c.id;
    (OUTCOMES_BY_KIND[c.kind] || []).forEach(function (o) {
      // The Senate's two words are not offered below stage two — the
      // server refuses them there, and offering a control that cannot
      // succeed is how a person learns to distrust the screen.
      if (SENATE_ONLY.indexOf(o) !== -1 && c.stage === 'stage_one') return;
      var opt = K.el('option', null, outcomeWord(o));
      opt.value = o;
      os.appendChild(opt);
    });
    of.appendChild(os);
    act.appendChild(of);

    var df = K.el('div', 'stf-field');
    var dl = K.el('label', null, T.decisionLabel);
    dl.setAttribute('for', 'dc_' + c.id);
    df.appendChild(dl);
    var ta = K.el('textarea');
    ta.id = 'dc_' + c.id;
    ta.setAttribute('dir', 'auto');
    df.appendChild(ta);
    df.appendChild(K.el('p', 'stf-field__note', T.decisionNote));
    act.appendChild(df);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--gold', T.send);
    btn.type = 'button';
    var said = K.el('span', 'stf-said');
    said.setAttribute('aria-live', 'polite');
    buttons.appendChild(btn);
    buttons.appendChild(said);
    act.appendChild(buttons);

    btn.addEventListener('click', function () {
      if (!ta.value.trim()) {
        said.setAttribute('data-tone', 'bad');
        said.textContent = T.needDecision;
        ta.focus();
        return;
      }
      btn.disabled = true;
      said.removeAttribute('data-tone');
      said.textContent = T.sending;
      K.api('/api/staff/cases', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'decide',
          case: c.id,
          outcome: os.value,
          decision: ta.value.trim(),
        }),
      }).then(function () {
        said.setAttribute('data-tone', 'good');
        said.textContent = T.sent;
        K.withdraw(li, loadQueue);
      }).catch(function (e) {
        btn.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = e.fields
          ? K.trouble(e) + ' — ' + Object.keys(e.fields).map(function (k) {
            return k + ': ' + e.fields[k];
          }).join('; ')
          : K.trouble(e);
      });
    });

    return act;
  }

  /* ── THE QUEUE ─────────────────────────────────────────────────────── */

  function tile(name, n, label, foot) {
    var t = $('[data-tile="' + name + '"]');
    if (!t) return;
    t.querySelector('[data-count]').textContent = String(n);
    t.querySelector('[data-label]').textContent = label;
    t.querySelector('[data-foot]').textContent = foot || '';
  }

  function loadQueue() {
    var stage = $('[data-queue-stage]').value;
    var overdue = $('[data-queue-overdue]').value === 'true';
    var q = '?limit=100' + (stage ? '&stage=' + stage : '') + (overdue ? '&overdue=true' : '');

    return K.api('/api/staff/cases' + q).then(function (d) {
      var cases = d.cases || [];
      var list = $('[data-queue]');
      list.textContent = '';
      cases.forEach(function (c) { list.appendChild(caseItem(c)); });

      var empty = $('[data-queue-empty]');
      empty.hidden = cases.length > 0;
      $('[data-queue-empty-head]').textContent = T.queueEmpty;
      $('[data-queue-empty-note]').textContent = T.queueEmptyNote;

      var mine = cases.filter(function (c) {
        return c.expectedPost && (c.barredFromHearing || []).indexOf(me && me.id) === -1;
      }).length;

      tile('live', cases.length, T.countLive);
      // `overdue` is the server's own count over the live queue, not the
      // length of what this page happened to ask for.
      tile('overdue', d.overdue || 0, T.countOverdue, T.ofThose);
      tile('yours', mine, T.countYours, T.conflictNote);

      var p = d.procedure || {};
      $('[data-procedure-head]').textContent = T.procedureHead;
      $('[data-procedure-principle]').textContent = p.principle || '';
      $('[data-procedure-instrument-head]').textContent = T.instrumentHead;
      $('[data-procedure-instrument]').textContent = p.instrument || '';
      $('[data-procedure-skip-head]').textContent = T.skipHead;
      $('[data-procedure-skip]').textContent = p.noSkipping || '';
      $('[data-procedure-days-head]').textContent = T.daysHead;
      $('[data-procedure-days]').textContent =
        T.daysBody(p.workingDays || 0, p.workingDayDefinition || '');

      $('#secCounts').hidden = false;
      $('#secProcedure').hidden = false;
      $('#secQueue').hidden = false;
    });
  }

  function labels() {
    $('[data-queue-head]').textContent = T.queueHead;
    $('[data-queue-stage-label]').textContent = T.stageLabel;
    $('[data-queue-overdue-label]').textContent = T.overdueLabel;
    K.fillOptions($('[data-queue-stage]'), [['', T.allStages]].concat(T.stages));
    K.fillOptions($('[data-queue-overdue]'), T.overdueOptions);
  }

  function load() {
    $('#state').textContent = T.loading;
    labels();
    // The account is read FIRST and the queue is not drawn without it:
    // every answer form on this page is offered or withheld by comparing
    // this id against the conflict list, and a page that rendered before
    // it knew who it was would offer forms it should not.
    K.api('/api/auth/me').then(function (u) {
      me = u;
      return loadQueue();
    }).then(function () {
      $('#state').textContent = T.ready + ' ' + T.readyRest;
    }).catch(function (e) {
      $('#state').textContent = K.trouble(e);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-queue-stage]').addEventListener('change', function () {
      loadQueue().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
    $('[data-queue-overdue]').addEventListener('change', function () {
      loadQueue().catch(function (e) { $('#state').textContent = K.trouble(e); });
    });
  });

  K.boot(load);
})();
