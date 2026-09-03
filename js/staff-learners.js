/* WEC-LC — My Learners.
 *
 * The interface for GET / POST /api/staff/attendance and for
 * GET / POST /api/lms/complete-level.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THERE IS NO SEARCH BOX, AND THAT IS THE FEATURE
 * ─────────────────────────────────────────────────────────────────────
 * The roster is composed from teaching acts — a live thread, a booked
 * tutorial, a marked assignment, a register taken — because there is no
 * tutor-to-learner assignment table to read one from. A search over
 * learners is precisely the surface that composition exists to prevent:
 * it is how a tutor appointed on Monday acquires the engagement history
 * of two hundred people they have never taught.
 *
 * So this page shows the roster the endpoint returns, opens the
 * learners in it, and offers no way to name anybody else. A tutor with
 * no relation gets 403 from the server; there is nothing here to try
 * it with.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE PLATFORM'S OWN READING TRAVELS WITH EVERY CORRECTION
 * ─────────────────────────────────────────────────────────────────────
 * Where a member of staff has stated an engagement fact, the row says
 * so, names who wrote it, prints their reason as they wrote it, and
 * prints the platform's own reading beside it. A correction that
 * conceals what it corrected is not a record.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND "ENGAGEMENT" IS NOT "ATTENDANCE"
 * ─────────────────────────────────────────────────────────────────────
 * The definition the learner is shown is shown to the tutor unaltered,
 * at the top, before any of the states. A staff view that strips it is
 * how one word becomes the other in the sentence a tutor writes to a
 * learner about their absence.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  var T = AR ? {
    loading: 'جارٍ تحميل مَن في رعايتك…',
    ready: 'مَن في رعايتك.',
    readyRest: 'اختر متعلّمًا لتقرأ انخراطه، وتقيّد حضورًا، وتؤكّد إتمامَ مستوى.',
    rosterHead: 'قائمتك',
    rosterEmpty: 'لا متعلّمَ في رعايتك الآن.',
    rosterEmptyNote: 'تنشأ الصِّلةُ بالفعل لا بالتعيين: خيطٌ مفتوح، أو ساعةٌ حُجزت عندك، أو عملٌ صحّحتَه، أو حضورٌ قيّدتَه. وأوّلُ واحدٍ من هذه يُظهر صاحبَه هنا.',
    open: 'افتح سجلَّه',
    close: 'أغلق',
    levelOf: function (n) { return K.levelWord(n); },
    noEnrolment: 'لا تسجيلَ قائم',
    tally: [['attended', 'حاضر'], ['partial', 'جزئيّ'], ['absent', 'غائب'], ['excused', 'معذور']],
    modulesLabel: 'الوحدات، وما قرأته المنصّة في كلِّ نافذة',
    windowOf: function (i) { return 'النافذة ' + i; },
    overridden: 'قيّده إنسان',
    platformRead: function (s) { return 'وقراءةُ المنصّة: ' + s; },
    reasonWas: 'السبب المكتوب: ',
    registerHead: 'قيِّد حضورًا',
    registerWhy: 'هذا قولُك أنت، لا قراءةُ المنصّة. يُحفَظ باسمك، ويُعرَض على المتعلّم بجوار ما قرأته المنصّةُ من الأدلّة التي ما زالت عندها. والسببُ مطلوبٌ في كلِّ حال.',
    moduleLabel: 'الوحدة والنافذة',
    stateLabel: 'ما تقيّده',
    stateNote: 'الغيابُ وصفٌ لا عقوبة، وهذه ألفاظُ الكلّية نفسها لا ألفاظُ هذه الصفحة.',
    minutesLabel: 'كم دقيقةً حضر',
    reasonLabel: 'السبب',
    reasonNote: 'يبقى هذا على سجلّ المتعلّم بلفظه. والقيدُ بلا سببٍ هو ما وُضع هذا الحقلُ ليمنعه.',
    registerSend: 'قيِّد',
    sending: 'جارٍ التقييد…',
    registered: 'قُيِّد.',
    needReason: 'السبب مطلوب.',
    needModule: 'اختر الوحدة والنافذة.',
    completeHead: 'تأكيد إتمام المستوى',
    completeWhy: 'يُقرأ ما بقي من شروط الجائزة قبل الفعل لا بعده، فالشرطُ يُقرأ جملةً لا رفضًا.',
    completeSend: 'أكِّد إتمام المستوى',
    completing: 'جارٍ التأكيد…',
    completed: 'أُكِّد.',
    gateMet: 'مستوفًى',
    gateOwed: 'على المتعلّم',
    gateCollege: 'على الكلّية',
  } : {
    loading: 'Loading the learners in your care…',
    ready: 'The learners in your care.',
    readyRest: 'Open one to read their engagement, take a register, and confirm a level is finished.',
    rosterHead: 'Your roster',
    rosterEmpty: 'No learner is currently in your care.',
    rosterEmptyNote: 'The relation is made by an act, not by an appointment: an open thread, an hour booked with you, a piece of work you marked, a register you took. The first of those puts the learner here.',
    open: 'Open their record',
    close: 'Close',
    levelOf: function (n) { return K.levelWord(n); },
    noEnrolment: 'No live enrolment',
    tally: [['attended', 'Attended'], ['partial', 'Partial'], ['absent', 'Absent'], ['excused', 'Excused']],
    modulesLabel: 'The modules, and what the platform read in each window',
    windowOf: function (i) { return 'Window ' + i; },
    overridden: 'Recorded by a person',
    platformRead: function (s) { return 'The platform reads: ' + s; },
    reasonWas: 'Reason given: ',
    registerHead: 'Take a register',
    registerWhy: 'This is your statement, not the platform’s reading. It is stored under your name and shown to the learner beside what the platform still reads from the evidence it holds. A reason is required in every case.',
    moduleLabel: 'Module and window',
    stateLabel: 'What you are recording',
    stateNote: 'Absent is a description, not a penalty — and these are the College’s own words for these states rather than this page’s.',
    minutesLabel: 'Minutes present',
    reasonLabel: 'Reason',
    reasonNote: 'This stays on the learner’s record in the words you write. An unexplained mark on somebody’s record is what this field exists to prevent.',
    registerSend: 'Record it',
    sending: 'Recording…',
    registered: 'Recorded.',
    needReason: 'A reason is required.',
    needModule: 'Choose the module and window.',
    completeHead: 'Confirm the level is finished',
    completeWhy: 'What is outstanding is read before the act rather than after it, so a condition arrives as a sentence rather than as a refusal.',
    completeSend: 'Confirm the level',
    completing: 'Confirming…',
    completed: 'Confirmed.',
    gateMet: 'Met',
    gateOwed: 'With the learner',
    gateCollege: 'A record the College has not made',
  };

  var open = null;      // the learner currently open
  var record = null;    // their engagement payload

  /* ── THE ROSTER ────────────────────────────────────────────────────── */

  function rosterItem(l) {
    var li = K.plate('li');
    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome('i-mortarboard'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', l.preferredName || l.email || l.userId));
    who.appendChild(K.el('p', 'stf-item__where', l.email || ''));
    var marks = K.el('div', 'stf-item__marks');
    marks.appendChild(K.chip(l.levelId ? T.levelOf(l.levelId) : T.noEnrolment,
      l.levelId ? 'pinned' : 'muted'));
    if (l.startedAt) marks.appendChild(K.chip(K.when(l.startedAt)));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    var buttons = K.el('div', 'stf-buttons');
    var btn = K.el('button', 'btn btn--outline', T.open);
    btn.type = 'button';
    btn.addEventListener('click', function () { openLearner(l); });
    buttons.appendChild(btn);
    li.appendChild(buttons);
    return li;
  }

  function loadRoster() {
    return K.api('/api/staff/attendance?limit=100').then(function (d) {
      $('[data-roster-head]').textContent = T.rosterHead;
      $('[data-roster-basis]').textContent = d.note || '';
      var list = $('[data-roster]');
      list.textContent = '';
      (d.learners || []).forEach(function (l) { list.appendChild(rosterItem(l)); });
      var empty = $('[data-roster-empty]');
      empty.hidden = (d.learners || []).length > 0;
      $('[data-roster-empty-head]').textContent = T.rosterEmpty;
      $('[data-roster-empty-note]').textContent = T.rosterEmptyNote;
      $('#secRoster').hidden = false;
    });
  }

  /* ── ONE LEARNER ───────────────────────────────────────────────────── */

  function openLearner(l) {
    open = l;
    $('[data-learner-head]').textContent = l.preferredName || l.email || l.userId;
    $('[data-learner-close]').textContent = T.close;
    $('#secLearner').hidden = false;
    $('#secLearner').scrollIntoView({ behavior: 'smooth', block: 'start' });

    K.api('/api/staff/attendance?userId=' + encodeURIComponent(l.userId)).then(function (d) {
      record = d;
      renderEngagement(d);
      renderRegister(d);
      return d.learner && d.learner.levelId ? loadGates(l.userId, d.learner.levelId) : null;
    }).catch(function (e) {
      $('[data-engagement-notice]').textContent = K.trouble(e);
      $('[data-modules]').textContent = '';
      $('[data-learner-tally]').textContent = '';
      $('[data-register]').hidden = true;
      $('[data-complete]').hidden = true;
    });
  }

  function renderEngagement(d) {
    readMeanings(d);
    var notice = d.engagementNotice || {};
    $('[data-engagement-notice]').textContent =
      (notice.definition || notice.statement || notice.note || '')
      + (notice.source ? ' — ' + notice.source : '');
    $('[data-authored-notice]').textContent =
      (d.authoredTextNotice && (d.authoredTextNotice.statement || d.authoredTextNotice)) || '';

    // The tally, across every window returned.
    var tally = { attended: 0, partial: 0, absent: 0, excused: 0 };
    (d.windows || []).forEach(function (w) {
      Object.keys(tally).forEach(function (k) { tally[k] += (w.summary && w.summary[k]) || 0; });
    });
    var box = $('[data-learner-tally]');
    box.textContent = '';
    T.tally.forEach(function (pair) {
      var tile = K.el('div', 'stf-count plate-dark card card--dark edge-lit aurum tilt gold-live');
      var sheen = K.el('span', 'tilt__sheen');
      sheen.setAttribute('aria-hidden', 'true');
      tile.appendChild(sheen);
      tile.appendChild(K.dome(pair[0] === 'attended' ? 'i-check' : 'i-ring', true));
      tile.appendChild(K.el('p', 'stf-count__num', String(tally[pair[0]])));
      tile.appendChild(K.el('p', 'stf-count__label', pair[1]));
      box.appendChild(tile);
    });

    $('[data-modules-label]').textContent = T.modulesLabel;
    var list = $('[data-modules]');
    list.textContent = '';
    (d.modules || []).forEach(function (m) { list.appendChild(moduleItem(m)); });
  }

  function moduleItem(m) {
    var li = K.plate('li');
    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome('i-layers'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', m.title || ''));
    var marks = K.el('div', 'stf-item__marks');
    T.tally.forEach(function (pair) {
      var n = (m.summary && m.summary[pair[0]]) || 0;
      if (n) marks.appendChild(K.chip(pair[1] + ' · ' + n, pair[0] === 'attended' ? 'answered' : null));
    });
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    var box = K.el('div', 'stf-work');
    (m.windows || []).forEach(function (w) {
      var p = K.el('p');
      p.textContent = T.windowOf(w.ordinal || w.index) + ' · ' + K.when(w.start)
        + ' — ' + stateWord(w.state);
      box.appendChild(p);
    });
    var panel = K.el('div', 'stf-panel');
    panel.appendChild(box);
    li.appendChild(panel);

    // Where a person wrote a cell, that cell is drawn out in full: who,
    // why, and what the platform reads instead.
    var written = [];
    (record.windows || []).forEach(function (w) {
      (w.modules || []).forEach(function (c) {
        if (c.unitId === m.unitId && c.overridden) written.push(c);
      });
    });
    written.forEach(function (c) {
      var box2 = K.el('div', 'stf-prior');
      box2.appendChild(K.el('p', 'stf-panel__label',
        T.overridden + ' · ' + K.when(c.windowStart)));
      var reason = K.el('p');
      reason.setAttribute('dir', 'auto');
      reason.textContent = T.reasonWas + (c.reason || '');
      box2.appendChild(reason);
      box2.appendChild(K.el('p', null,
        T.platformRead(stateWord(c.derived && c.derived.state))));
      li.appendChild(box2);
    });

    return li;
  }

  /**
   * The College's own sentence for a state, taken from the payload —
   * `meaning` travels with every cell precisely so a surface does not
   * have to invent one. The map is rebuilt with each learner because
   * the payload is rendered in the reader's language.
   */
  var meanings = {};

  function readMeanings(d) {
    meanings = {};
    (d.windows || []).forEach(function (w) {
      (w.modules || []).forEach(function (c) {
        if (c.state && c.meaning && !meanings[c.state]) meanings[c.state] = c.meaning;
      });
    });
  }

  function stateWord(state) {
    if (!state) return '—';
    var label = T.tally.filter(function (p) { return p[0] === state; })[0];
    return (label ? label[1] : state) + (meanings[state] ? ' — ' + meanings[state] : '');
  }

  /* ── TAKE A REGISTER ───────────────────────────────────────────────── */

  function renderRegister(d) {
    $('[data-register]').hidden = false;
    $('[data-register-head]').textContent = T.registerHead;
    $('[data-register-why]').textContent = T.registerWhy;
    $('[data-register-module-label]').textContent = T.moduleLabel;
    $('[data-register-state-label]').textContent = T.stateLabel;
    $('[data-register-state-note]').textContent = T.stateNote;
    $('[data-register-minutes-label]').textContent = T.minutesLabel;
    $('[data-register-reason-label]').textContent = T.reasonLabel;
    $('[data-register-reason-note]').textContent = T.reasonNote;
    $('[data-register-send]').textContent = T.registerSend;

    // Every (module, window) pair the platform itself knows about. The
    // form cannot address a window the record does not have, which is
    // what keeps a register mark inside a period that existed.
    var pairs = [];
    (d.windows || []).forEach(function (w) {
      (w.modules || []).forEach(function (c) {
        pairs.push([
          [c.unitId, w.start, w.end].join('|'),
          (c.title || '') + ' · ' + T.windowOf(w.ordinal || w.index) + ' · ' + K.when(w.start),
        ]);
      });
    });
    K.fillOptions($('[data-register-module]'), pairs);
    K.fillOptions($('[data-register-state]'), T.tally);
    minutesVisible();
  }

  function minutesVisible() {
    $('[data-register-minutes-field]').hidden = $('[data-register-state]').value !== 'partial';
  }

  function sendRegister() {
    var said = $('[data-register-said]');
    var pair = $('[data-register-module]').value;
    var reason = $('[data-register-reason]').value.trim();

    if (!pair) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = T.needModule;
      return;
    }
    if (!reason) {
      said.setAttribute('data-tone', 'bad');
      said.textContent = T.needReason;
      $('[data-register-reason]').focus();
      return;
    }

    var parts = pair.split('|');
    var state = $('[data-register-state]').value;
    var body = {
      userId: open.userId,
      basis: 'module_engagement',
      unitId: parts[0],
      windowStart: parts[1],
      windowEnd: parts[2],
      state: state,
      reason: reason,
    };
    if (state === 'partial') body.minutesPresent = Number($('[data-register-minutes]').value) || 0;

    var btn = $('[data-register-send]');
    btn.disabled = true;
    said.removeAttribute('data-tone');
    said.textContent = T.sending;

    K.api('/api/staff/attendance', { method: 'POST', body: JSON.stringify(body) })
      .then(function () {
        btn.disabled = false;
        said.setAttribute('data-tone', 'good');
        said.textContent = T.registered;
        $('[data-register-reason]').value = '';
        openLearner(open);
      })
      .catch(function (e) {
        btn.disabled = false;
        said.setAttribute('data-tone', 'bad');
        said.textContent = e.fields
          ? K.trouble(e) + ' — ' + Object.keys(e.fields).map(function (k) {
            return k + ': ' + e.fields[k];
          }).join('; ')
          : K.trouble(e);
      });
  }

  /* ── CONFIRM A LEVEL ───────────────────────────────────────────────── */

  function loadGates(userId, levelId) {
    return K.api('/api/lms/complete-level?userId=' + encodeURIComponent(userId)
      + '&levelId=' + levelId).then(function (g) {
      $('[data-complete]').hidden = false;
      $('[data-complete-head]').textContent = T.completeHead;
      $('[data-complete-why]').textContent = T.completeWhy + ' ' + (g.statement || '');
      $('[data-complete-send]').textContent = T.completeSend;

      var list = $('[data-gates]');
      list.textContent = '';
      (g.conditions || []).forEach(function (c) {
        var li = K.plate('li');
        var head = K.el('div', 'stf-item__head');
        head.appendChild(K.dome(c.met === true ? 'i-struck' : 'i-ring'));
        var who = K.el('div', 'stf-item__who');
        who.appendChild(K.el('p', 'stf-item__name', c.label || c.id || ''));
        if (c.detail || c.statement) {
          who.appendChild(K.el('p', 'stf-item__where', c.detail || c.statement));
        }
        var marks = K.el('div', 'stf-item__marks');
        marks.appendChild(K.chip(
          c.met === true ? T.gateMet : (c.owner === 'college' ? T.gateCollege : T.gateOwed),
          c.met === true ? 'answered' : (c.owner === 'college' ? 'muted' : 'unread'),
        ));
        who.appendChild(marks);
        head.appendChild(who);
        li.appendChild(head);
        list.appendChild(li);
      });

      $('[data-complete-send]').disabled = (g.blocking || []).length > 0;
    }).catch(function () {
      $('[data-complete]').hidden = true;
    });
  }

  function sendComplete() {
    var said = $('[data-complete-said]');
    var btn = $('[data-complete-send]');
    btn.disabled = true;
    said.removeAttribute('data-tone');
    said.textContent = T.completing;
    K.api('/api/lms/complete-level', {
      method: 'POST',
      body: JSON.stringify({ userId: open.userId, levelId: record.learner.levelId }),
    }).then(function () {
      said.setAttribute('data-tone', 'good');
      said.textContent = T.completed;
      return loadRoster();
    }).catch(function (e) {
      btn.disabled = false;
      said.setAttribute('data-tone', 'bad');
      said.textContent = K.trouble(e);
    });
  }

  /* ── BOOT ──────────────────────────────────────────────────────────── */

  function load() {
    $('#state').textContent = T.loading;
    loadRoster().then(function () {
      $('#state').textContent = T.ready + ' ' + T.readyRest;
    }).catch(function (e) {
      $('#state').textContent = K.trouble(e);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('[data-learner-close]').addEventListener('click', function () {
      $('#secLearner').hidden = true;
      open = null;
    });
    $('[data-register-state]').addEventListener('change', minutesVisible);
    $('[data-register-send]').addEventListener('click', sendRegister);
    $('[data-complete-send]').addEventListener('click', sendComplete);
  });

  K.boot(load);
})();
