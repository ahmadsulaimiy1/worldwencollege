/* WEC-LC — Enrolments.
 *
 * The interface for GET /api/admin/learners, POST /api/admin/enrolment
 * and GET /api/admin/role.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE REGISTER IS ABOVE THE SEARCH
 * ─────────────────────────────────────────────────────────────────────
 * "Who can see student records" is the question an institution is
 * asked, and answering it should not require knowing whose name to type
 * in first. So the register of everyone holding access is the first
 * thing on the page, before any learner is named.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THIS SEARCH IS NOT THE ONE THE TUTOR'S PAGE REFUSES
 * ─────────────────────────────────────────────────────────────────────
 * /staff-learners.html has no search deliberately: a tutor reads the
 * learners they teach, and a search over everybody is exactly the
 * surface that rule exists to prevent. This page is the Registry's, and
 * enrolling somebody who paid by bank transfer means finding them by
 * name — so the search is here, behind the endpoint's own guard, and
 * the two pages are different offices rather than the same page twice.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND THE REASON IS NOT CEREMONY
 * ─────────────────────────────────────────────────────────────────────
 * An enrolment that did not come from a payment has to say whether it
 * was a scholarship, a bank transfer, a corporate seat or a staff test
 * account, or the record is worth nothing six months later when
 * somebody asks. The history under the form prints every earlier
 * answer, which is what makes the field worth filling in.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  var T = AR ? {
    loading: 'جارٍ التحميل…',
    ready: 'التسجيلات.',
    readyRest: 'وسِجلُّ مَن يبلغ سجلَّ طالب.',
    registerHead: 'مَن يبلغ سجلَّ الطالب',
    registerNote: 'هذا سؤالٌ تُسأله المؤسّسة، وجوابُه ههنا لا في قاعدة بيانات. وكلُّ تعيينٍ يحمل الصفةَ التي عُيِّن بها؛ فالتعيينُ بلا صفةٍ إذنٌ منحه صاحبُه لنفسه.',
    roles: { admin: 'إداريّ', staff: 'عضو هيئة', student: 'متعلّم' },
    searchHead: 'ابحث عن متعلّم',
    searchWhy: 'يُبحَث بالبريد أو بالاسم. واتركه فارغًا لأحدث الحسابات.',
    searchLabel: 'البريد أو الاسم',
    search: 'ابحث',
    searching: 'جارٍ البحث…',
    found: function (n) { return n === 0 ? 'لا نتيجة.' : n + ' نتيجة.'; },
    open: 'افتح سجلَّه',
    close: 'أغلق',
    learnerMeta: function (l) {
      return l.email + ' · ' + l.role + (l.emailVerified ? ' · البريد موثَّق' : ' · البريد غير موثَّق');
    },
    auditNote: function (d) { return 'يبدأ سجلُّ المراجعة في ' + d + '، وما قبله ليس في هذه المنصّة.'; },
    auditNone: 'قد يكون هذا السجلّ غير مكتمل: لا يُعرف متى بدأ تسجيل تغييرات القيد في هذه القاعدة.',
    enrolmentsLabel: 'تسجيلاته',
    noEnrolments: 'لا تسجيلَ له.',
    statuses: {
      pending_payment: 'بانتظار الدفع', active: 'قائم',
      completed: 'مُتَمّ', withdrawn: 'منسحب',
    },
    setHead: 'سجِّله على مستوى',
    setWhy: 'هذا هو الباب الذي يُغني عن كتابة أمرٍ في قاعدة البيانات. ويُقيَّد كلُّ تغييرٍ باسم مَن أجراه وسببِه.',
    levelLabel: 'المستوى',
    statusLabel: 'الحال',
    reasonLabel: 'السبب',
    reasonNote: 'قل ما هو: منحةٌ أو حوالةٌ مصرفيّةٌ أو مقعدٌ مؤسّسيٌّ أو حسابُ تجربة. فالتسجيلُ الذي لا يقول ما هو لا قيمةَ لقيده بعد ستّة أشهر.',
    set: 'سجِّله',
    setting: 'جارٍ التسجيل…',
    setDone: 'سُجِّل.',
    unchanged: 'لا تغيير: هو على هذه الحال أصلًا.',
    needReason: 'السبب مطلوب.',
    historyLabel: 'ما جرى على تسجيلاته',
    noHistory: 'لم يجرِ عليها شيءٌ بعد.',
    moved: function (f, t) { return (f ? T.statuses[f] || f : '—') + ' ← ' + (T.statuses[t] || t); },
    notEnrolled: 'غير مسجَّل',
    bySystem: 'المنصّة',
    accessHead: 'ما يبلغه هذا الشخص',
    accessWhy: 'يُسأل ههنا سؤالان لا واحد: لِمَ هذا الشخصُ بعينه، وبأيِّ قرارٍ عُيِّن. والتعيينُ بلا صفةٍ إذنٌ منحه صاحبُه لنفسه، ولا يستطيع الإداريُّ تعيينَ نفسه أصلًا.',
    accessRoleLabel: 'ما يُعيَّن به',
    accessRoles: [['student', 'متعلّم'], ['staff', 'عضو هيئة'], ['admin', 'إداريّ']],
    accessReasonLabel: 'لِمَ هذا الشخص',
    accessReasonNote: 'قُل ما يجعل هذا الشخصَ أهلًا لذلك. وهذا يبقى على السجلّ.',
    accessAuthorityLabel: 'بأيِّ قرار',
    accessAuthorityNote: 'اسمُ القرار أو المحضر الذي جرى التعيينُ بموجبه. والسطرُ الذي يُبحَث عنه بعد سنةٍ هو هذا.',
    accessSend: 'عيِّنه',
    accessWorking: 'جارٍ التعيين…',
    accessDone: 'عُيِّن.',
    accessUnchanged: 'لا تغيير: هو على هذه الصفة أصلًا.',
    accessNeedReason: 'السبب مطلوب.',
    appointmentsLabel: 'سِجلُّ تعييناته',
    noAppointments: 'لم يُعيَّن بعد.',
    appointedBy: function (a) { return 'أجراه ' + a; },
    underAuthority: function (a) { return 'بموجب: ' + a; },
  } : {
    loading: 'Loading…',
    ready: 'Enrolments.',
    readyRest: 'And the register of everyone who may reach a student record.',
    registerHead: 'Who may reach a student record',
    registerNote: 'This is a question an institution is asked, and the answer is here rather than in a database. Every appointment carries the authority it was made under — an appointment with none behind it is a permission somebody granted themselves.',
    roles: { admin: 'Administrator', staff: 'Staff', student: 'Learner' },
    searchHead: 'Find a learner',
    searchWhy: 'By email or by name. Leave it empty for the newest accounts.',
    searchLabel: 'Email or name',
    search: 'Search',
    searching: 'Searching…',
    found: function (n) { return n === 0 ? 'Nothing found.' : n + (n === 1 ? ' result.' : ' results.'); },
    open: 'Open their record',
    close: 'Close',
    learnerMeta: function (l) {
      return l.email + ' · ' + l.role + (l.emailVerified ? ' · email verified' : ' · email not verified');
    },
    auditNote: function (d) { return 'The audit record on this platform begins ' + d + '. Nothing before that date is held here.'; },
    auditNone: 'This record may be incomplete: it is not known when enrolment changes began being recorded on this database.',
    enrolmentsLabel: 'Their enrolments',
    noEnrolments: 'They hold no enrolment.',
    statuses: {
      pending_payment: 'Awaiting payment', active: 'Active',
      completed: 'Completed', withdrawn: 'Withdrawn',
    },
    setHead: 'Place them on a level',
    setWhy: 'This is the door that replaces writing SQL by hand. Every change records who made it and why.',
    levelLabel: 'Level',
    statusLabel: 'Status',
    reasonLabel: 'Reason',
    reasonNote: 'Say what it was: a scholarship, a bank transfer, a corporate seat, a staff test account. An enrolment that does not say what it is is worth nothing six months later.',
    set: 'Record it',
    setting: 'Recording…',
    setDone: 'Recorded.',
    unchanged: 'No change — they already stand at that.',
    needReason: 'A reason is required.',
    historyLabel: 'What has happened to their enrolments',
    noHistory: 'Nothing has happened to them yet.',
    moved: function (f, t) { return (f ? T.statuses[f] || f : '—') + ' → ' + (T.statuses[t] || t); },
    notEnrolled: 'Not enrolled',
    bySystem: 'the platform',
    accessHead: 'What this person may reach',
    accessWhy: 'Two questions are asked here rather than one: why this person, and under whose decision. An appointment with no authority behind it is a permission somebody granted themselves — and an administrator cannot appoint themselves at all.',
    accessRoleLabel: 'Appoint as',
    accessRoles: [['student', 'Learner'], ['staff', 'Staff'], ['admin', 'Administrator']],
    accessReasonLabel: 'Why this person',
    accessReasonNote: 'Say what makes this person the right one. It stays on the record.',
    accessAuthorityLabel: 'Under what decision',
    accessAuthorityNote: 'The decision or minute the appointment was made under. This is the line somebody looks for a year later.',
    accessSend: 'Appoint them',
    accessWorking: 'Appointing…',
    accessDone: 'Appointed.',
    accessUnchanged: 'No change — they already hold that.',
    accessNeedReason: 'A reason is required.',
    appointmentsLabel: 'Their appointments',
    noAppointments: 'They have never been appointed.',
    appointedBy: function (a) { return 'made by ' + a; },
    underAuthority: function (a) { return 'Under: ' + a; },
  };

  var STATUSES = ['pending_payment', 'active', 'completed', 'withdrawn'];
  var open = null;
  var me = null;

  function roleWord(r) { return T.roles[r] || r || ''; }
  function statusWord(s) { return T.statuses[s] || s || ''; }

  function detail(e) {
    if (!e.fields) return K.trouble(e);
    return K.trouble(e) + ' — ' + Object.keys(e.fields).map(function (k) {
      return k + ': ' + e.fields[k];
    }).join('; ');
  }

  /* ── WHO MAY REACH A STUDENT RECORD ────────────────────────────────── */

  function loadRegister() {
    return K.api('/api/admin/role').then(function (d) {
      $('[data-register-head]').textContent = T.registerHead;
      $('[data-register-note]').textContent = T.registerNote;
      var list = $('[data-register]');
      list.textContent = '';
      (d.appointees || []).forEach(function (p) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome(p.role === 'admin' ? 'i-key' : 'i-lectern'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name', p.preferredName || p.email || p.id));
        who.appendChild(K.el('p', 'stf-item__where', p.email || ''));
        var marks = K.el('div', 'stf-item__marks');
        marks.appendChild(K.chip(roleWord(p.role), p.role === 'admin' ? 'pinned' : null));
        if (p.createdAt) marks.appendChild(K.chip(K.when(p.createdAt)));
        who.appendChild(marks);
        head.appendChild(who);
        li.appendChild(head);
        list.appendChild(li);
      });
      $('#secRegister').hidden = false;
    }).catch(function () {
      // Administrator-only. A member of teaching staff is not shown an
      // empty register — they are shown no register, which is the
      // honest rendering of a refusal they cannot act on.
      $('#secRegister').hidden = true;
    });
  }

  /* ── FIND A LEARNER ────────────────────────────────────────────────── */

  function resultItem(l) {
    var li = K.plate('li');
    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome('i-mortarboard'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', l.preferredName || l.email || l.id));
    who.appendChild(K.el('p', 'stf-item__where', l.email || ''));
    var marks = K.el('div', 'stf-item__marks');
    if (l.role && l.role !== 'student') marks.appendChild(K.chip(roleWord(l.role), 'pinned'));
    if (l.createdAt) marks.appendChild(K.chip(K.when(l.createdAt)));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--outline', T.open);
    btn.type = 'button';
    btn.addEventListener('click', function () { openLearner(l.id); });
    buttons.appendChild(btn);
    li.appendChild(buttons);
    return li;
  }

  function search() {
    var said = $('[data-search-said]');
    said.removeAttribute('data-tone');
    said.textContent = T.searching;
    var q = $('[data-search-input]').value.trim();
    return K.api('/api/admin/learners?q=' + encodeURIComponent(q)).then(function (d) {
      said.textContent = T.found((d.learners || []).length);
      var list = $('[data-results]');
      list.textContent = '';
      (d.learners || []).forEach(function (l) { list.appendChild(resultItem(l)); });
    }).catch(function (e) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = K.trouble(e);
    });
  }

  /* ── ONE LEARNER ───────────────────────────────────────────────────── */

  function openLearner(userId) {
    return K.api('/api/admin/learners?id=' + encodeURIComponent(userId)).then(function (l) {
      open = l;
      $('[data-learner-head]').textContent = l.preferredName || l.email || l.id;
      $('[data-learner-meta]').textContent = T.learnerMeta(l);
      $('[data-learner-close]').textContent = T.close;
      var audit = l.auditRecord;
      $('[data-audit-note]').textContent = (!audit || !audit.known)
        ? T.auditNone
        : (audit.complete ? '' : T.auditNote(K.when(audit.since)));

      // ALL SIX LEVELS, ENROLLED OR NOT. A list of only the levels
      // somebody holds cannot say what they do not hold, and "not
      // enrolled" is the answer somebody came here for at least as
      // often as the other one. A blank row is not that answer.
      $('[data-enrolments-label]').textContent = T.enrolmentsLabel;
      var list = $('[data-enrolments]');
      list.textContent = '';
      var held = {};
      (l.enrolments || []).forEach(function (e) { held[e.levelId] = e; });
      for (var n = 1; n <= 6; n++) {
        var e = held[n] || null;
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome(e && e.status === 'active' ? 'i-struck' : 'i-ring'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name', K.levelWord(n)));
        var marks = K.el('div', 'stf-item__marks');
        marks.appendChild(K.chip(e ? statusWord(e.status) : T.notEnrolled,
          e && e.status === 'active' ? 'answered'
            : (e && e.status === 'withdrawn' ? 'closed' : 'muted')));
        if (e && e.startedAt) marks.appendChild(K.chip(K.when(e.startedAt)));
        who.appendChild(marks);
        head.appendChild(who);
        li.appendChild(head);
        list.appendChild(li);
      }

      $('[data-history-label]').textContent = T.historyLabel;
      var hist = $('[data-history]');
      hist.textContent = '';
      (l.history || []).forEach(function (h) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome('i-ledger'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name',
          K.levelWord(h.levelId) + ' · ' + T.moved(h.fromStatus, h.toStatus)));
        who.appendChild(K.el('p', 'stf-item__where', K.when(h.createdAt, true)));
        head.appendChild(who);
        li.appendChild(head);
        if (h.reason) {
          var r = K.el('p', 'stf-item__where');
          r.setAttribute('dir', 'auto');
          r.textContent = h.reason;
          li.appendChild(r);
        }
        hist.appendChild(li);
      });
      if (!(l.history || []).length) {
        hist.appendChild(K.el('p', 'stf-field__note', T.noHistory));
      }

      renderAccess(l);

      $('#secLearner').hidden = false;
      $('#secLearner').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function (e) {
      $('#state').textContent = K.trouble(e);
    });
  }

  /* ── WHAT THIS PERSON MAY REACH ────────────────────────────────────
     Offered only where the account reading the page holds the authority
     to grant it, and never on that account's own record. Both refusals
     are the platform's; this only declines to draw a control that
     cannot succeed. */

  function renderAccess(l) {
    var block = $('[data-access]');
    var mayAppoint = me && me.role === 'admin' && me.id !== l.id;
    block.hidden = !mayAppoint;

    if (mayAppoint) {
      $('[data-access-head]').textContent = T.accessHead;
      $('[data-access-why]').textContent = T.accessWhy;
      $('[data-access-role-label]').textContent = T.accessRoleLabel;
      $('[data-access-reason-label]').textContent = T.accessReasonLabel;
      $('[data-access-reason-note]').textContent = T.accessReasonNote;
      $('[data-access-authority-label]').textContent = T.accessAuthorityLabel;
      $('[data-access-authority-note]').textContent = T.accessAuthorityNote;
      $('[data-access-send]').textContent = T.accessSend;
      // Never the role they already hold: an appointment to the same
      // access is not an appointment, and offering it invites a record
      // that says nothing happened.
      K.fillOptions($('[data-access-role]'),
        T.accessRoles.filter(function (r) { return r[0] !== l.role; }));
    }

    // The appointment trail is kept apart from the enrolment history:
    // they are different registers about different things, and merging
    // them is how "who appointed this person" becomes unreadable.
    var panel = $('[data-appointments-panel]');
    if (!(me && me.role === 'admin')) { panel.hidden = true; return; }
    K.api('/api/admin/role?userId=' + encodeURIComponent(l.id)).then(function (d) {
      $('[data-appointments-label]').textContent = T.appointmentsLabel;
      var list = $('[data-appointments]');
      list.textContent = '';
      (d.appointments || []).forEach(function (a) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome('i-shield-check'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name',
          roleWord(a.fromRole) + ' → ' + roleWord(a.toRole)));
        who.appendChild(K.el('p', 'stf-item__where',
          K.when(a.createdAt, true) + ' · ' + T.appointedBy(a.actorEmail || T.bySystem)));
        head.appendChild(who);
        li.appendChild(head);
        if (a.reason) {
          var r = K.el('p', 'stf-item__where');
          r.setAttribute('dir', 'auto');
          r.textContent = a.reason;
          li.appendChild(r);
        }
        // On its own line, because that is the line people look for.
        if (a.authority) {
          var auth = K.el('p', 'stf-prior');
          auth.setAttribute('dir', 'auto');
          auth.textContent = T.underAuthority(a.authority);
          li.appendChild(auth);
        }
        list.appendChild(li);
      });
      if (!(d.appointments || []).length) {
        list.appendChild(K.el('p', 'stf-field__note', T.noAppointments));
      }
      panel.hidden = false;
    }).catch(function () { panel.hidden = true; });
  }

  function appoint() {
    var said = $('[data-access-said]');
    var reason = $('[data-access-reason]').value.trim();
    if (!reason) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = T.accessNeedReason;
      $('[data-access-reason]').focus();
      return;
    }
    var btn = $('[data-access-send]');
    btn.disabled = true;
    said.removeAttribute('data-tone');
    said.textContent = T.accessWorking;
    K.api('/api/admin/role', {
      method: 'POST',
      body: JSON.stringify({
        userId: open.id,
        role: $('[data-access-role]').value,
        reason: reason,
        authority: $('[data-access-authority]').value.trim() || null,
      }),
    }).then(function (r) {
      btn.disabled = false;
      said.setAttribute('data-tone', r.changed === false ? null : 'good');
      said.textContent = r.changed === false ? T.accessUnchanged : T.accessDone;
      $('[data-access-reason]').value = '';
      $('[data-access-authority]').value = '';
      return Promise.all([openLearner(open.id), loadRegister()]);
    }).catch(function (e) {
      btn.disabled = false;
      said.setAttribute('data-tone', 'bad');
      said.textContent = detail(e);
    });
  }

  function setEnrolment() {
    var said = $('[data-set-said]');
    var reason = $('[data-set-reason]').value.trim();
    if (!reason) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = T.needReason;
      $('[data-set-reason]').focus();
      return;
    }
    var btn = $('[data-set-send]');
    btn.disabled = true;
    said.removeAttribute('data-tone');
    said.textContent = T.setting;
    K.api('/api/admin/enrolment', {
      method: 'POST',
      body: JSON.stringify({
        userId: open.id,
        levelId: Number($('[data-set-level]').value),
        status: $('[data-set-status]').value,
        reason: reason,
      }),
    }).then(function (r) {
      btn.disabled = false;
      said.setAttribute('data-tone', r.changed ? 'good' : null);
      said.textContent = r.changed ? T.setDone : T.unchanged;
      $('[data-set-reason]').value = '';
      return openLearner(open.id);
    }).catch(function (e) {
      btn.disabled = false;
      said.setAttribute('data-tone', 'bad');
      said.textContent = detail(e);
    });
  }

  /* ── BOOT ──────────────────────────────────────────────────────────── */

  function labels() {
    $('[data-search-head]').textContent = T.searchHead;
    $('[data-search-why]').textContent = T.searchWhy;
    $('[data-search-label]').textContent = T.searchLabel;
    $('[data-search-send]').textContent = T.search;
    $('[data-set-head]').textContent = T.setHead;
    $('[data-set-why]').textContent = T.setWhy;
    $('[data-set-level-label]').textContent = T.levelLabel;
    $('[data-set-status-label]').textContent = T.statusLabel;
    $('[data-set-reason-label]').textContent = T.reasonLabel;
    $('[data-set-reason-note]').textContent = T.reasonNote;
    $('[data-set-send]').textContent = T.set;
    var lv = $('[data-set-level]');
    if (!lv.options.length) {
      for (var i = 1; i <= 6; i++) {
        var o = K.el('option', null, K.levelWord(i));
        o.value = String(i);
        lv.appendChild(o);
      }
    }
    K.fillOptions($('[data-set-status]'), STATUSES.map(function (s) { return [s, statusWord(s)]; }));
  }

  function boot() {
    $('#state').textContent = T.loading;
    labels();
    $('#secSearch').hidden = false;
    // The account is read first: every access control on this page is
    // offered or withheld by comparing it, and a page that drew them
    // before it knew who it was would offer what the server refuses.
    K.api('/api/auth/me').then(function (u) { me = u; }).catch(function () { me = null; })
      .then(function () { return Promise.all([loadRegister(), search()]); })
      .then(function () {
        $('#state').textContent = T.ready + ' ' + T.readyRest;
      }).catch(function (e) {
        $('#state').textContent = K.trouble(e);
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-search-send]').addEventListener('click', search);
    $('[data-access-send]').addEventListener('click', appoint);
    $('[data-search-input]').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { ev.preventDefault(); search(); }
    });
    $('[data-learner-close]').addEventListener('click', function () {
      $('#secLearner').hidden = true;
      open = null;
    });
    $('[data-set-send]').addEventListener('click', setEnrolment);
  });

  K.boot(boot);
})();
