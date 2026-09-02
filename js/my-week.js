/* WEC-LC — My Week.
 *
 * The interface for GET /api/student/timetable, GET / POST / DELETE
 * /api/student/booking, and the calendar file the first of those serves
 * at ?format=ics. Items 6 and 7 of the interface backlog.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE PAGE RENDERS THE ENDPOINT'S TIMES, AND NEVER ITS OWN
 * ─────────────────────────────────────────────────────────────────────
 * `renderInstant()` returns four things for every moment — the UTC
 * instant, the same moment in the learner's zone, the offset and the
 * zone's name — and this page prints the LOCAL string the server
 * produced rather than converting the UTC one in the browser. That is
 * not caution about arithmetic; it is that the browser's zone and the
 * learner's account zone are different facts, and a College teaching
 * into sixty countries must show the one the learner set. A learner
 * travelling with a laptop set to a hotel's clock would otherwise be
 * shown two different times for one class on two days.
 *
 * Where the platform holds no zone, or holds one it does not recognise,
 * `zoneFor()` says so in `notice` and the page prints it. UTC is a
 * fallback, never a guess, and it is labelled as one.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AN EMPTY FEED IS AN ANSWER, AND SO IS AN UNREADABLE SOURCE
 * ─────────────────────────────────────────────────────────────────────
 * `notice` distinguishes "nothing scheduled" from "your enrolment is
 * awaiting payment" from "you have no enrolment"; `unreadable` names
 * any source the feed could not read. Both are rendered. A learner who
 * has paid and sees an empty week deserves the sentence, and a source
 * that failed silently is how a missing class becomes the learner's
 * fault.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A CANCELLATION TAKES A REASON AND THE PAGE DOES NOT PRETEND OTHERWISE
 * ─────────────────────────────────────────────────────────────────────
 * cancelBooking() requires one, because `slot_bookings` is shaped so
 * that a tutor's cancellation never reads as a learner's. The page
 * refuses an empty reason itself rather than sending it to be refused —
 * not to spare the round trip, but so the learner reads the reason FOR
 * the requirement at the moment they meet it.
 *
 * Every value reaches the page through textContent.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';

  var T = AR ? {
    loading: 'جارٍ تحميل أسبوعك…',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'جدولك خاصٌّ بك. سجّل الدخول لتراه.',
    failed: 'تعذّر تحميل أسبوعك.',
    failedRest: 'هذا خللٌ عندنا. أعد المحاولة بعد قليل.',
    kinds: { class: 'حصة', tutorial: 'درس خاص', deadline: 'موعد' },
    zoneFallback: 'رجوعٌ إلى توقيت غرينتش',
    icsNote: 'ينزّل ملفًّا يحفظ تقويمك نسخةً منه كما هو الآن. وليس اشتراكًا حيًّا: لا يرسل برنامج التقويم بيانات دخولك، فلا سبيل إلى رابطٍ يبقى محدَّثًا ويبقى خاصًّا بك في آن.',
    openLede: function (n) { return n === 0 ? '' : 'ساعات مفتوحة لك في هذا المدى: ' + n + '.'; },
    placesLeft: function (n) { return n === 1 ? 'مقعد واحد باقٍ' : n + ' مقاعد باقية'; },
    full: 'مكتملة',
    yours: 'لك مقعد فيها',
    take: 'خذ مقعدًا',
    cancel: 'ردَّ المقعد',
    with: function (name) { return 'مع ' + name; },
    booking: 'جارٍ الحجز…',
    cancelling: 'جارٍ الردّ…',
    needReason: 'السبب مطلوب. ويُسجَّل باسمك، وهو ما يُبقي إلغاءك متميّزًا عن إلغاءٍ من مدرّسك.',
    booked: 'أُخذ المقعد.',
    unreadable: function (n) { return 'تعذّرت قراءة ' + n + ' من المصادر، وهي مسمّاة أدناه.'; },
    join: 'الدخول',
    noSlots: 'لم يفتح مدرّسٌ ساعةً لك في هذا المدى.',
  } : {
    loading: 'Loading your week…',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your timetable is private to you. Sign in to see it.',
    failed: 'Your week could not be loaded.',
    failedRest: 'This is a fault on our side. Please try again shortly.',
    kinds: { class: 'Class', tutorial: 'Tutorial', deadline: 'Obligation' },
    zoneFallback: 'falling back to UTC',
    icsNote: 'Downloads a file your calendar keeps a copy of as it stands now. It is not a live subscription: a calendar client sends no credentials, so there is no way to offer a link that both stays current and stays yours.',
    openLede: function (n) { return n === 0 ? '' : n + ' hour' + (n === 1 ? '' : 's') + ' open to you in this window.'; },
    placesLeft: function (n) { return n === 1 ? '1 place left' : n + ' places left'; },
    full: 'Full',
    yours: 'You hold a place',
    take: 'Take a place',
    cancel: 'Give the place back',
    with: function (name) { return 'with ' + name; },
    booking: 'Taking the place…',
    cancelling: 'Giving it back…',
    needReason: 'A reason is required. It is recorded as yours, which is what keeps your cancellation distinct from one your tutor made.',
    booked: 'The place is yours.',
    unreadable: function (n) { return n + ' source' + (n === 1 ? '' : 's') + ' could not be read, and are named below.'; },
    join: 'Join',
    noSlots: 'No tutor has opened an hour to you in this window.',
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  /* THE SERVER'S LOCAL STRING, formatted for reading — never a
     conversion of the UTC instant in the browser. `local` is an ISO
     string already in the learner's own zone, so it is parsed as a wall
     clock and printed as one; asking Date to interpret it as UTC and
     re-converting would apply the offset twice. */
  function whenText(instant) {
    if (!instant || !instant.local) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(instant.local);
    if (!m) return instant.local;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
    var day = d.toLocaleDateString(LOCALE, {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    });
    // The clock is returned separately so the caller can keep it from
    // being orphaned onto its own line. "Wednesday 26 August" wrapping
    // to "· 21:52" puts a separator at the head of a line and reads as
    // a broken record rather than as a time.
    return { day: day, time: m[4] + ':' + m[5], text: day + ' · ' + m[4] + ':' + m[5] };
  }
  function whenLine(instant) {
    var w = whenText(instant);
    return w && w.text ? w.text : (w || '');
  }
  function zoneSuffix(instant) {
    if (!instant) return '';
    return (instant.timeZone || '') + (instant.offset ? ' (' + instant.offset + ')' : '');
  }

  /** The time cell: date, then a clock that cannot be orphaned. */
  function whenCell(instant) {
    var w = whenText(instant);
    var cell = el('div', 'wk-event__when');
    var day = el('span', 'wk-event__day');
    day.appendChild(document.createTextNode(w && w.day ? w.day : ''));
    if (w && w.time) {
      var clock = el('span', 'wk-event__clock', '· ' + w.time);
      day.appendChild(document.createTextNode(' '));
      day.appendChild(clock);
    }
    cell.appendChild(day);
    cell.appendChild(el('span', 'wk-event__zone', zoneSuffix(instant)));
    return cell;
  }

  var authHeaders = {};
  function api(path, opts) {
    var o = opts || {};
    o.headers = Object.assign({ Accept: 'application/json' }, authHeaders, o.headers || {});
    if (o.body) o.headers['Content-Type'] = 'application/json';
    return fetch(path, o).then(function (r) {
      return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; });
    });
  }

  function state(strong, rest) {
    var box = $('#state');
    box.textContent = '';
    if (strong) box.appendChild(el('strong', null, strong + ' '));
    box.appendChild(document.createTextNode(rest || ''));
  }

  function reasonFrom(body) {
    if (!body) return T.failed;
    if (typeof body.message === 'string' && body.message.trim()) return body.message;
    if (typeof body.error === 'string' && /\s/.test(body.error)) return body.error;
    return T.failed;
  }

  var days = 14;
  var slotsById = {};
  var eventsById = {};

  // ── The zone ───────────────────────────────────────────────────────
  function renderZone(zone) {
    var sec = $('#secZone');
    sec.hidden = false;
    $('[data-zone-line]').textContent = zone.timeZone
      + (zone.source === 'default' ? ' · ' + T.zoneFallback : '');
    var note = $('[data-zone-note]');
    // The endpoint's own sentence, which distinguishes "no zone set"
    // from "a zone we could not recognise" and names the rejected value
    // in the second case. A learner who typed GMT+4 into a form and is
    // being shown UTC has to be told the platform did not accept it.
    note.hidden = !zone.notice;
    note.textContent = zone.notice || '';
  }

  // ── The feed ───────────────────────────────────────────────────────
  function renderFeed(f) {
    $('#secFeed').hidden = false;
    var list = $('[data-feed]');
    list.textContent = '';
    eventsById = {};

    var empty = $('[data-feed-empty]');
    if (!f.events.length) {
      empty.hidden = false;
      // Which KIND of empty. Three different facts, and the endpoint
      // already knows which one applies.
      empty.textContent = f.notice || '';
    } else {
      empty.hidden = true;
    }

    f.events.forEach(function (e) {
      eventsById[e.id] = e;
      var li = el('li', 'wk-event');
      li.setAttribute('data-kind', e.kind);

      li.appendChild(whenCell(e.startsAt));

      var body = el('div', 'wk-event__body');
      var head = el('div', 'wk-event__head');
      head.appendChild(el('span', 'acc-pill', T.kinds[e.kind] || e.kind));
      head.appendChild(el('span', 'wk-event__title', e.title));
      body.appendChild(head);
      if (e.detail) body.appendChild(el('p', 'wk-event__detail', e.detail));
      if (e.host) body.appendChild(el('p', 'wk-event__detail', T.with(e.host)));

      var row = el('div', 'wk-event__actions');
      if (e.joinUrl) {
        var join = el('a', 'btn btn--outline btn--sm magnetic', T.join);
        join.href = e.joinUrl;
        join.rel = 'noopener';
        join.target = '_blank';
        row.appendChild(join);
      }
      // Only a tutorial the learner holds can be given back, and the
      // booking id is on the event's own source row.
      if (e.kind === 'tutorial' && e.source && e.source.table === 'slot_bookings') {
        var give = el('button', 'btn btn--outline btn--sm magnetic', T.cancel);
        give.type = 'button';
        give.setAttribute('data-cancel', e.source.id);
        give.setAttribute('data-event', e.id);
        row.appendChild(give);
      }
      if (row.childNodes.length) body.appendChild(row);

      li.appendChild(body);
      list.appendChild(li);
    });

    // Sources the feed could not read, named. A gap the learner has to
    // notice is a gap the College did not report.
    var note = $('[data-ics-note]');
    note.textContent = (f.unreadable && f.unreadable.length)
      ? T.unreadable(f.unreadable.length) + ' ' + T.icsNote
      : T.icsNote;
  }

  // ── Hours open to this learner ─────────────────────────────────────
  function renderSlots(o) {
    $('#secOpen').hidden = false;
    var list = $('[data-slots]');
    list.textContent = '';
    slotsById = {};
    $('[data-open-lede]').textContent = T.openLede(o.counts.bookable);

    var empty = $('[data-slots-empty]');
    if (!o.slots.length) {
      empty.hidden = false;
      empty.textContent = o.notice || T.noSlots;
      return;
    }
    empty.hidden = true;

    o.slots.forEach(function (s) {
      slotsById[s.slotId] = s;
      var li = el('li', 'wk-slot');
      li.setAttribute('data-state', s.alreadyBooked ? 'yours' : s.full ? 'full' : 'open');

      li.appendChild(whenCell(s.startsAt));

      var body = el('div', 'wk-event__body');
      var head = el('div', 'wk-event__head');
      head.appendChild(el('span', 'acc-pill', s.kindLabel));
      head.appendChild(el('span', 'wk-event__title', s.title));
      body.appendChild(head);
      if (s.detail) body.appendChild(el('p', 'wk-event__detail', s.detail));
      if (s.tutor) body.appendChild(el('p', 'wk-event__detail', T.with(s.tutor)));

      var row = el('div', 'wk-event__actions');
      // THE ENDPOINT DECIDES, not the page. `bookable` already accounts
      // for capacity and for a place the learner holds; recomputing it
      // here is how a list and a booking route begin to disagree.
      if (s.bookable) {
        var take = el('button', 'btn btn--gold btn--sm magnetic', T.take);
        take.type = 'button';
        take.setAttribute('data-book', s.slotId);
        row.appendChild(take);
        row.appendChild(el('span', 'wk-slot__places', T.placesLeft(s.placesLeft)));
      } else if (s.alreadyBooked) {
        row.appendChild(el('span', 'acc-pill acc-pill--received', T.yours));
      } else {
        // Listed and marked full rather than hidden: it is the one
        // refusal that is about other people, and it can free up.
        row.appendChild(el('span', 'acc-pill acc-pill--pending', T.full));
      }
      body.appendChild(row);

      li.appendChild(body);
      list.appendChild(li);
    });
  }

  // ── Taking a place ─────────────────────────────────────────────────
  function openBooking(slotId) {
    var s = slotsById[slotId];
    if (!s) return;
    var sec = $('#secBook');
    sec.hidden = false;
    $('#secCancel').hidden = true;
    sec.setAttribute('data-slot', slotId);
    $('[data-book-kind]').textContent = s.kindLabel;
    $('[data-book-title]').textContent = s.title;
    $('[data-book-when]').textContent = whenLine(s.startsAt) + ' · ' + zoneSuffix(s.startsAt)
      + (s.tutor ? ' · ' + T.with(s.tutor) : '');
    $('[data-book-note]').value = '';
    $('[data-book-error]').textContent = '';
    sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('[data-book-note]').focus();
  }

  function confirmBooking() {
    var sec = $('#secBook');
    var slotId = sec.getAttribute('data-slot');
    var btn = $('[data-book-confirm]');
    var err = $('[data-book-error]');
    err.textContent = '';
    btn.disabled = true;
    var was = btn.textContent;
    btn.textContent = T.booking;

    api('/api/student/booking', {
      method: 'POST',
      body: JSON.stringify({ slotId: slotId, learnerNote: ($('[data-book-note]').value || '').trim() || null }),
    }).then(function (r) {
      btn.textContent = was;
      btn.disabled = false;
      if (!r.ok) {
        // Every refusal names its own cause — the whole reason
        // functions/api/student/booking.js exists. Showing the
        // endpoint's sentence is showing the learner what to do.
        err.textContent = reasonFrom(r.data);
        return;
      }
      sec.hidden = true;
      load();
    }).catch(function () {
      btn.textContent = was;
      btn.disabled = false;
      err.textContent = T.failed;
    });
  }

  // ── Giving a place back ────────────────────────────────────────────
  function openCancel(bookingId, eventId) {
    var e = eventsById[eventId];
    var sec = $('#secCancel');
    sec.hidden = false;
    $('#secBook').hidden = true;
    sec.setAttribute('data-booking', bookingId);
    $('[data-cancel-title]').textContent = e ? e.title : '';
    $('[data-cancel-when]').textContent = e ? whenLine(e.startsAt) + ' · ' + zoneSuffix(e.startsAt) : '';
    $('[data-cancel-reason]').value = '';
    $('[data-cancel-error]').textContent = '';
    sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    $('[data-cancel-reason]').focus();
  }

  function confirmCancel() {
    var sec = $('#secCancel');
    var bookingId = sec.getAttribute('data-booking');
    var reason = ($('[data-cancel-reason]').value || '').trim();
    var err = $('[data-cancel-error]');
    // Refused HERE, not sent to be refused — so the learner reads the
    // reason for the requirement at the moment they meet it.
    if (!reason) { err.textContent = T.needReason; $('[data-cancel-reason]').focus(); return; }

    var btn = $('[data-cancel-confirm]');
    var was = btn.textContent;
    btn.disabled = true;
    btn.textContent = T.cancelling;
    err.textContent = '';

    api('/api/student/booking', {
      method: 'DELETE',
      body: JSON.stringify({ bookingId: bookingId, reason: reason }),
    }).then(function (r) {
      btn.textContent = was;
      btn.disabled = false;
      if (!r.ok) { err.textContent = reasonFrom(r.data); return; }
      sec.hidden = true;
      load();
    }).catch(function () {
      btn.textContent = was;
      btn.disabled = false;
      err.textContent = T.failed;
    });
  }

  // ── The calendar file ──────────────────────────────────────────────
  function downloadIcs() {
    // Fetched with the session header and saved as a blob rather than
    // linked: the endpoint requires an Authorization header, and an
    // <a href> cannot carry one. The alternative would be a token in a
    // URL, which is the thing timetable.js declines to build.
    fetch('/api/student/timetable?format=ics&days=' + days, {
      headers: Object.assign({ Accept: 'text/calendar' }, authHeaders),
    }).then(function (r) { return r.ok ? r.text() : null; })
      .then(function (text) {
        if (!text) return;
        var url = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
        var a = document.createElement('a');
        a.href = url;
        a.download = 'worldwide-english-college-timetable.ics';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }).catch(function () {});
  }

  // ── Load ───────────────────────────────────────────────────────────
  function load() {
    return api('/api/student/timetable?days=' + days).then(function (r) {
      if (r.status === 401) { state(T.signedOut, T.signedOutRest); return null; }
      if (!r.ok) { state(T.failed, T.failedRest); return null; }
      $('#state').textContent = '';
      $('#scope').hidden = false;
      renderZone(r.data.zone);
      renderFeed(r.data);
      return api('/api/student/booking?days=' + days);
    }).then(function (r) {
      if (r && r.ok) renderSlots(r.data);
    }).catch(function () {
      state(T.failed, T.failedRest);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sel = $('[data-days]');
    if (sel) {
      sel.addEventListener('change', function () {
        days = Number(sel.value) || 14;
        load();
      });
    }
    var ics = $('[data-ics]');
    if (ics) ics.addEventListener('click', downloadIcs);

    document.addEventListener('click', function (e) {
      var book = e.target.closest('[data-book]');
      if (book) { openBooking(book.getAttribute('data-book')); return; }
      var cancel = e.target.closest('[data-cancel]');
      if (cancel) { openCancel(cancel.getAttribute('data-cancel'), cancel.getAttribute('data-event')); }
    });

    var bookConfirm = $('[data-book-confirm]');
    if (bookConfirm) bookConfirm.addEventListener('click', confirmBooking);
    var cancelConfirm = $('[data-cancel-confirm]');
    if (cancelConfirm) cancelConfirm.addEventListener('click', confirmCancel);
    var bookClose = $('[data-book-close]');
    if (bookClose) bookClose.addEventListener('click', function () { $('#secBook').hidden = true; });
    var cancelClose = $('[data-cancel-close]');
    if (cancelClose) cancelClose.addEventListener('click', function () { $('#secCancel').hidden = true; });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      $('#secBook').hidden = true;
      $('#secCancel').hidden = true;
    });

    var cfg = window.WEC_LC_AUTH || {};
    if (cfg.clerkPublishableKey && typeof window.WEC_LC_loadClerk === 'function') {
      window.WEC_LC_loadClerk(cfg.clerkPublishableKey, function (err, clerk) {
        if (!err && clerk && clerk.session) {
          clerk.session.getToken().then(function (tok) {
            if (tok) authHeaders.Authorization = 'Bearer ' + tok;
            load();
          }).catch(load);
          return;
        }
        load();
      });
      return;
    }
    load();
  });
})();
