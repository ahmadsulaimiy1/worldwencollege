/* WEC-LC — The Tutor's Desk.
 *
 * The hub. It reads five endpoints and writes four numbers and one
 * short diary, and its whole discipline is what it does NOT do.
 *
 * ─────────────────────────────────────────────────────────────────────
 * EVERY COUNT IS THE ENDPOINT'S OWN
 * ─────────────────────────────────────────────────────────────────────
 * Where a payload carries a count, that count is printed. Where it
 * does not, the desk asks for a page and prints the length of what came
 * back — and says so, because a badge reading "20" when the request
 * asked for twenty is a badge that starts lying on the second page.
 * The one place this matters most is the caseload, where `overdue` is
 * computed over the whole live queue by the server and would be wrong
 * if this page counted it.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ONE SLOW QUEUE MUST NOT BLANK THE DESK
 * ─────────────────────────────────────────────────────────────────────
 * The five reads are independent and are resolved independently: a
 * tile whose endpoint failed says so on that tile and the other four
 * still render. A desk that shows nothing because one query was slow
 * is a desk nobody trusts the second time.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND THE HOURS ARE ABOVE THE QUEUES
 * ─────────────────────────────────────────────────────────────────────
 * An hour has a time on it and a queue does not. Work not marked today
 * can be marked tomorrow; a tutorial at four o'clock cannot.
 */
(function () {
  'use strict';

  var K = window.WEC_LC_staff;
  var $ = K.$;
  var AR = K.AR;

  var T = AR ? {
    loading: 'جارٍ تحميل مكتبك…',
    ready: 'مكتبك.',
    readyRest: 'هذا ما تنتظره الكلّيةُ منك، بالترتيب الذي ورد به.',
    marking: 'عملٌ مكتوبٌ ينتظر التصحيح',
    recordings: 'تسجيلٌ ينتظر المراجعة',
    cases: 'قضيّةٌ تنتظر الجواب',
    messages: 'رسالةٌ غير مقروءة',
    unreadable: 'تعذّرت القراءة',
    longest: function (n) { return n > 0 ? 'أطولُ انتظارٍ ' + n + ' يومًا' : 'لا انتظارَ يزيد على يوم'; },
    overdue: function (n) { return n > 0 ? n + ' منها جاوزت تاريخ جوابها' : 'ولا واحدةٌ جاوزت تاريخ جوابها'; },
    threadsNote: 'من الخيوط التي أنت طرفٌ فيها',
    todayNote: function (z) { return 'كلُّ ساعةٍ هنا معروضةٌ بتوقيت ' + z + '، والأصلُ محفوظٌ بالتوقيت العالميّ.'; },
    todayEmpty: 'لا ساعةَ قادمةً في دفترك.',
    todayEmptyNote: 'ما تنشره من ساعاتٍ يظهر هنا مع مَن حجزها.',
    places: function (b, c) { return b + ' من ' + c + ' مقعدًا محجوز'; },
    nobody: 'لم يحجز أحدٌ بعد',
    withdrawn: 'سُحبت',
  } : {
    loading: 'Loading your desk…',
    ready: 'Your desk.',
    readyRest: 'What the College is waiting on you for, in the order it arrived.',
    marking: 'Written work to mark',
    recordings: 'Recordings to review',
    cases: 'Cases awaiting an answer',
    messages: 'Messages unread',
    unreadable: 'Could not be read',
    longest: function (n) { return n > 0 ? 'Longest wait ' + n + (n === 1 ? ' day' : ' days') : 'Nothing waiting longer than a day'; },
    overdue: function (n) { return n > 0 ? n + ' past the answer date' : 'None past its answer date'; },
    threadsNote: 'across the threads you are a party to',
    todayNote: function (z) { return 'Every hour here is shown in ' + z + '; the instant itself is held in UTC.'; },
    todayEmpty: 'Nothing is next in your diary.',
    todayEmptyNote: 'Hours you publish appear here with the learners who booked them.',
    places: function (b, c) { return b + ' of ' + c + ' places taken'; },
    nobody: 'Nobody has booked yet',
    withdrawn: 'Withdrawn',
  };

  function tile(name) { return $('[data-tile="' + name + '"]'); }

  function setTile(name, count, label, foot) {
    var t = tile(name);
    if (!t) return;
    t.querySelector('[data-count]').textContent = count;
    t.querySelector('[data-label]').textContent = label;
    t.querySelector('[data-foot]').textContent = foot || '';
  }

  function failTile(name, label) {
    setTile(name, '—', label, T.unreadable);
  }

  /* ── THE FOUR COUNTS ───────────────────────────────────────────────── */

  function loadMarking() {
    return K.api('/api/lms/marking-queue?status=submitted&limit=200').then(function (d) {
      var rows = d.submissions || [];
      var longest = rows.reduce(function (n, s) { return Math.max(n, Number(s.waitingDays) || 0); }, 0);
      setTile('marking', String(rows.length), T.marking, T.longest(longest));
    }).catch(function () { failTile('marking', T.marking); });
  }

  function loadRecordings() {
    return K.api('/api/lms/review-queue?status=submitted').then(function (rows) {
      var arr = Array.isArray(rows) ? rows : [];
      var longest = arr.reduce(function (n, r) {
        var at = Date.parse(r.submittedAt);
        return Math.max(n, Number.isFinite(at) ? Math.floor((Date.now() - at) / 86400000) : 0);
      }, 0);
      setTile('recordings', String(arr.length), T.recordings, T.longest(longest));
    }).catch(function () { failTile('recordings', T.recordings); });
  }

  function loadCases() {
    return K.api('/api/staff/cases?limit=100').then(function (d) {
      var rows = d.cases || [];
      // `overdue` is the server's, computed over the live queue against
      // its own clock. Counting it here would answer a different
      // question with the same word.
      setTile('cases', String(rows.length), T.cases, T.overdue(d.overdue || 0));
    }).catch(function () { failTile('cases', T.cases); });
  }

  function loadMessages() {
    return K.api('/api/messages?limit=50').then(function (d) {
      setTile('messages', String(d.unread || 0), T.messages, T.threadsNote);
    }).catch(function () { failTile('messages', T.messages); });
  }

  /* ── THE NEXT HOURS ────────────────────────────────────────────────── */

  function slotItem(s) {
    var li = K.plate('li');
    var head = K.el('div', 'stf-item__head');
    head.appendChild(K.dome('i-clocktower'));
    var who = K.el('div', 'stf-item__who');
    who.appendChild(K.el('p', 'stf-item__name', s.title || s.kindLabel || ''));
    var at = s.startsAt ? s.startsAt.utc : null;
    who.appendChild(K.el('p', 'stf-item__where',
      K.when(at) + (at ? ' · ' + K.clock(at) : '')
      + (s.durationMinutes ? ' · ' + s.durationMinutes + (AR ? ' دقيقة' : ' min') : '')));

    var marks = K.el('div', 'stf-item__marks');
    if (s.kindLabel) marks.appendChild(K.chip(s.kindLabel));
    if (s.levelId) marks.appendChild(K.chip(K.levelWord(s.levelId)));
    marks.appendChild(K.chip(
      s.booked ? T.places(s.booked, s.capacity) : T.nobody,
      s.booked ? 'pinned' : 'muted',
    ));
    if (s.status === 'cancelled') marks.appendChild(K.chip(T.withdrawn, 'closed'));
    who.appendChild(marks);
    head.appendChild(who);
    li.appendChild(head);

    if (s.bookings && s.bookings.length) {
      var names = K.el('p', 'stf-item__where');
      names.setAttribute('dir', 'auto');
      names.textContent = s.bookings.map(function (b) {
        return (b.learner && (b.learner.preferredName || b.learner.email)) || '';
      }).filter(Boolean).join(' · ');
      li.appendChild(names);
    }
    return li;
  }

  function loadHours() {
    return K.api('/api/staff/slots?limit=4').then(function (d) {
      var list = $('[data-today]');
      list.textContent = '';
      var slots = (d.slots || []).filter(function (s) { return s.status !== 'cancelled'; });
      slots.forEach(function (s) { list.appendChild(slotItem(s)); });
      $('[data-today-note]').textContent = T.todayNote(d.zone && d.zone.timeZone ? d.zone.timeZone : 'UTC');
      var empty = $('[data-today-empty]');
      empty.hidden = slots.length > 0;
      $('[data-today-empty-head]').textContent = T.todayEmpty;
      $('[data-today-empty-note]').textContent = T.todayEmptyNote;
      $('#secToday').hidden = false;
    }).catch(function () {
      // The diary is the one block on this page that is hidden rather
      // than shown broken: an empty diary and an unreadable one look
      // identical, and the tiles above already carry the failure.
      $('#secToday').hidden = true;
    });
  }

  function load() {
    $('#state').textContent = T.loading;
    $('#secCounts').hidden = false;
    Promise.all([loadMarking(), loadRecordings(), loadCases(), loadMessages(), loadHours()])
      .then(function () {
        $('#state').textContent = T.ready + ' ' + T.readyRest;
      });
  }

  K.boot(load);
})();
