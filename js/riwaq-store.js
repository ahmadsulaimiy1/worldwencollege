/* =====================================================================
   THE RIWĀQ — the store.

   The portal's first version displayed a seeded model and forgot
   everything a user did: recording a recitation changed nothing, a
   submission went nowhere, and the murājaʿah queue was the same on every
   load. That is a mock-up, not a system.

   This is the state layer that makes it a system. Every action a student
   or teacher takes is written here, persisted, and read back — so a
   recital moves a page's itqān, which moves its revision interval, which
   moves the queue; and a submission actually lands in a teacher's queue,
   is marked against real āyāt, and returns to the student.

   PERSISTENCE. localStorage, one record per account, versioned so a
   future change can migrate rather than silently corrupt. There is no
   server: that is a limitation, and the honest answer to it is not to
   pretend otherwise but to give the reader their data — hence export,
   import and reset, which are real and which work.

   THE LEDGER IS STORED AS DELTAS. The base state of 604 pages is
   generated deterministically from a seed; only pages the user has
   actually touched are written. A full ledger is ~604 objects and would
   be rewritten on every recital; the delta is usually one.
   ===================================================================== */
(function () {
  'use strict';

  var VERSION = 3;
  var PREFIX = 'riwaq.data.';
  var SESSION = 'riwaq.session';

  /* ------------------------------------------------------ the muṣḥaf */

  var PAGES = 604;
  var JUZ_START = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242,
                   262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482,
                   502, 522, 542, 562, 582];

  function juzOf(page) {
    for (var i = JUZ_START.length - 1; i >= 0; i--) if (page >= JUZ_START[i]) return i + 1;
    return 1;
  }
  function juzRange(j) {
    return { from: JUZ_START[j - 1], to: (j < 30 ? JUZ_START[j] - 1 : PAGES) };
  }

  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  var COMMITTED_THROUGH = 8;
  var SABAQ_PAGE = 166;

  /* The generated floor. Deterministic, so the demonstration opens the
     same way on every machine; everything above it is the user's own. */
  function baseLedger() {
    var r = rng(20260816), out = new Array(PAGES + 1);
    for (var p = 1; p <= PAGES; p++) {
      var j = juzOf(p), state, itqan;
      if (p === SABAQ_PAGE) { state = 'sabaq'; itqan = 34 + Math.floor(r() * 14); }
      else if (j === 9 && p < SABAQ_PAGE) { state = 'sabqi'; itqan = 58 + Math.floor(r() * 22); }
      else if (j > COMMITTED_THROUGH) { state = 'new'; itqan = 0; }
      else if (j >= COMMITTED_THROUGH - 1) { state = 'sabqi'; itqan = 66 + Math.floor(r() * 24); }
      else { itqan = 72 + Math.floor(r() * 28); state = itqan >= 92 ? 'itqan' : 'manzil'; }
      var since = state === 'new' ? null
        : state === 'sabaq' ? 0
        : state === 'sabqi' ? Math.floor(r() * 3)
        : Math.floor(r() * 34);
      /* The return index: how many of the Five Returns this page has
         already survived. A page in the manzil has passed all five by
         definition; a sabqi page is somewhere inside the schedule. */
      var ret = state === 'manzil' || state === 'itqan' ? 5
        : state === 'sabqi' ? Math.floor(r() * 5)
        : 0;
      out[p] = { page: p, juz: j, state: state, itqan: itqan, since: since, ret: ret, recitals: 0 };
    }
    return out;
  }

  /* ------------------------------------------------------ the record */

  function seedHistory() {
    var r = rng(4242), h = [], pages = 118, itq = 71;
    for (var d = 59; d >= 0; d--) {
      pages += r() > 0.45 ? 1 : 0;
      itq += (r() - 0.42) * 0.9;
      h.push({ d: d, pages: Math.min(pages, 166), itqan: Math.round(Math.max(60, Math.min(94, itq))) });
    }
    return h;
  }

  function blank(email) {
    return {
      v: VERSION,
      email: email,
      delta: {},                 // page -> partial ledger row
      submissions: seedSubmissions(email),
      messages: seedMessages(email),
      attendance: seedAttendance(),
      history: seedHistory(),
      streak: 41,
      lastDay: null,
      sittings: []               // ijāzah recitation sittings
    };
  }

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function seedAttendance() {
    var out = [], d = new Date();
    for (var i = 1; i <= 41; i++) {
      var x = new Date(d.getTime() - i * 86400000);
      out.push(x.getFullYear() + '-' + (x.getMonth() + 1) + '-' + x.getDate());
    }
    return out;
  }

  var ERROR_KINDS = [
    { key: 'harakah', label: 'Ḥarakah', desc: 'A vowel altered or dropped' },
    { key: 'madd', label: 'Madd', desc: 'Elongation short or over-held' },
    { key: 'ghunnah', label: 'Ghunnah', desc: 'Nasalisation missing or excessive' },
    { key: 'waqf', label: 'Waqf', desc: 'Stopped or resumed at a wrong place' },
    { key: 'omission', label: 'Omission', desc: 'A word or phrase left out' },
    { key: 'hesitation', label: 'Hesitation', desc: 'Recall broke and had to be prompted' }
  ];

  function seedSubmissions(email) {
    if (email !== 'yusuf@demo.al-madinahcollege.com') return [];
    return [
      { id: 's-3', student: 'yusuf@demo.al-madinahcollege.com', studentName: 'Yūsuf Ibrāhīm',
        kind: 'Sabqi', from: 162, to: 165, note: 'Second attempt at the page turn.',
        at: Date.now() - 2 * 86400000, status: 'marked', itqan: 78,
        teacherNote: 'Cleaner. The seam at 163–164 still costs you a beat.',
        errors: [
          { ayah: 'Al-Tawbah 9:36', page: 164, kind: 'madd', note: 'Madd lāzim held for four counts — it takes six.' },
          { ayah: 'Al-Tawbah 9:41', page: 165, kind: 'hesitation', note: 'Recall broke at the page turn. Join the two pages.' }
        ] },
      { id: 's-2', student: 'yusuf@demo.al-madinahcollege.com', studentName: 'Yūsuf Ibrāhīm',
        kind: 'Manzil', from: 42, to: 44, note: '',
        at: Date.now() - 5 * 86400000, status: 'marked', itqan: 91,
        teacherNote: 'Held well. Move this to the three-week interval.',
        errors: [{ ayah: 'Al-Baqarah 2:255', page: 42, kind: 'harakah', note: 'Ḥarakah on the final word shortened.' }] },
      { id: 's-1', student: 'yusuf@demo.al-madinahcollege.com', studentName: 'Yūsuf Ibrāhīm',
        kind: 'Sabaq', from: 165, to: 165, note: '',
        at: Date.now() - 7 * 86400000, status: 'marked', itqan: 66,
        teacherNote: 'A first pass. Repeat before Fajr.', errors: [] }
    ];
  }

  function seedMessages(email) {
    if (email === 'guardian@demo.al-madinahcollege.com') {
      return [{ id: 'm-g1', from: 'Registry', to: email, at: Date.now() - 3 * 86400000,
        body: 'Yūsuf’s termly report is available in his record. His attendance stands at 41 consecutive days.', read: false }];
    }
    return [
      { id: 'm-2', from: 'Shaykh ʿAbd al-Raḥmān Ṣāliḥ', to: email, at: Date.now() - 86400000,
        body: 'Bring pages 162–166 together tomorrow rather than separately. The seam is where it breaks.', read: false },
      { id: 'm-1', from: 'The Registry', to: email, at: Date.now() - 6 * 86400000,
        body: 'Examination entry for the Diploma in Qurʾānic Memorisation opens at the close of this semester.', read: true }
    ];
  }

  /* ------------------------------------------------------------ I/O */

  function read(email) {
    var raw;
    try { raw = localStorage.getItem(PREFIX + email); } catch (e) { raw = null; }
    if (!raw) return blank(email);
    var d;
    try { d = JSON.parse(raw); } catch (e) { return blank(email); }
    if (!d || d.v !== VERSION) return migrate(d, email);
    return d;
  }

  /* A stored record from an older version is not discarded silently. What
     can be carried forward is carried; the rest is rebuilt. */
  function migrate(old, email) {
    var fresh = blank(email);
    if (old && typeof old === 'object') {
      if (old.delta) fresh.delta = old.delta;
      if (Array.isArray(old.submissions) && old.submissions.length) fresh.submissions = old.submissions;
      if (Array.isArray(old.messages) && old.messages.length) fresh.messages = old.messages;
      if (Array.isArray(old.attendance)) fresh.attendance = old.attendance;
      if (typeof old.streak === 'number') fresh.streak = old.streak;
    }
    write(fresh);
    return fresh;
  }

  function write(d) {
    try { localStorage.setItem(PREFIX + d.email, JSON.stringify(d)); } catch (e) {}
    return d;
  }

  function reset(email) {
    try { localStorage.removeItem(PREFIX + email); } catch (e) {}
    return blank(email);
  }

  /* --------------------------------------------------- derived state */

  function ledgerFor(d) {
    var base = baseLedger();
    Object.keys(d.delta || {}).forEach(function (p) {
      var i = +p;
      if (base[i]) base[i] = Object.assign({}, base[i], d.delta[p]);
    });
    return base;
  }

  /* THE FIVE RETURNS — المراجعات الخمس.  Reg. 3.3.

     The earlier scheduler keyed the interval to itqān alone and capped
     sabqi at three days. That was better than nothing and still wrong in
     the way the classical method warns about: it treated the fragile
     phase as ONE interval repeated, when what consolidates a memory is a
     sequence of intervals that EXPAND. A portion revised while it is
     still effortless teaches the student very little.

     So a page in sabqi is now carried through a fixed schedule of five
     returns — 1, 3, 7, 21, 60 days — and its position in that schedule
     is `ret`. It joins the manzil only on surviving the fifth, and after
     that it is sampled on the itqān-keyed cycle, without notice. A break
     at any return sends the page back to the first: the schedule is not
     a countdown a student can wait out. */
  var RETURNS = [1, 3, 7, 21, 60];

  function interval(row) {
    if (!row) return 1;
    var state = row.state, itqan = row.itqan || 0;
    if (state === 'new') return null;
    if (state === 'sabaq') return 1;
    if (state === 'sabqi') return RETURNS[Math.min(row.ret || 0, RETURNS.length - 1)];
    return itqan >= 95 ? 21 : itqan >= 88 ? 14 : itqan >= 80 ? 7 : itqan >= 72 ? 4 : 2;
  }

  function dueToday(ledger) {
    return ledger.filter(function (p) {
      return p && p.since != null && p.state !== 'new' && p.since >= interval(p);
    }).sort(function (a, b) {
      return (b.since - interval(b)) - (a.since - interval(a));
    });
  }

  function stats(ledger) {
    var held = ledger.filter(function (p) { return p && p.state !== 'new'; });
    var itq = ledger.filter(function (p) { return p && p.state === 'itqan'; });
    var avg = held.length ? Math.round(held.reduce(function (a, p) { return a + p.itqan; }, 0) / held.length) : 0;
    var fullJuz = 0;
    for (var j = 1; j <= 30; j++) {
      var r = juzRange(j), all = true;
      for (var p = r.from; p <= r.to; p++) if (ledger[p].state === 'new') { all = false; break; }
      if (all) fullJuz++;
    }
    return {
      pagesHeld: held.length, juzHeld: fullJuz,
      pctHeld: Math.round((held.length / PAGES) * 100),
      itqanPages: itq.length, avgItqan: avg, due: dueToday(ledger).length
    };
  }

  /* One hearing, and what it does to a page's position in the schedule.

     A break is not merely a lower itqān: it returns the page to the
     first of the Five Returns, and it demotes a consolidated page back
     into sabqi, because a portion that broke is by definition no longer
     held. A clean or nearly clean hearing advances one return, and the
     fifth admits the page to the manzil. */
  function advance(row, outcome, itqan) {
    var state = row.state === 'new' ? 'sabaq' : row.state;
    var ret = row.ret || 0;

    if (outcome === 'broken') {
      return { state: state === 'sabaq' ? 'sabaq' : 'sabqi', ret: 0 };
    }

    if (state === 'sabaq') return { state: 'sabqi', ret: 1 };

    if (state === 'sabqi') {
      ret = Math.min(ret + 1, RETURNS.length);
      if (ret >= RETURNS.length) return { state: itqan >= 92 ? 'itqan' : 'manzil', ret: ret };
      return { state: 'sabqi', ret: ret };
    }

    // Already in the perpetual cycle: only the band moves.
    return { state: itqan >= 92 ? 'itqan' : 'manzil', ret: 5 };
  }

  /* -------------------------------------------------------- actions
     Each one mutates, records, persists and returns the new record. The
     ledger is recomputed from the delta rather than held in a variable,
     so no view can be looking at a stale copy. */

  var Actions = {

    /* A recital moves itqān by outcome, resets the revision clock, and
       may promote the page's state. This is the hinge the whole system
       turns on: itqān sets the interval, the interval sets the queue. */
    recite: function (d, page, outcome) {
      var led = ledgerFor(d), row = led[page];
      if (!row) return d;
      var delta = { clean: 7, minor: 3, broken: -6 }[outcome] || 0;
      var itqan = Math.max(0, Math.min(100, (row.state === 'new' ? 30 : row.itqan) + delta));
      var next = advance(row, outcome, itqan);
      d.delta[page] = { state: next.state, itqan: itqan, since: 0, ret: next.ret,
                        recitals: (row.recitals || 0) + 1 };
      Actions.attend(d);
      return write(d);
    },

    submit: function (d, s) {
      s.id = 's-' + Date.now();
      s.at = Date.now();
      s.status = 'pending';
      s.errors = [];
      d.submissions.unshift(s);
      Actions.attend(d);
      return write(d);
    },

    /* The teacher's mark returns to the student AND moves the ledger:
       an itqān awarded here is applied to every page in the submitted
       range, and their revision clocks reset. Without this the marking
       screen would be theatre. */
    mark: function (d, id, mark) {
      var s = d.submissions.filter(function (x) { return x.id === id; })[0];
      if (!s) return d;
      s.status = 'marked';
      s.itqan = mark.itqan;
      s.teacherNote = mark.note;
      s.errors = mark.errors || [];
      s.markedAt = Date.now();
      var led = ledgerFor(d);
      /* A mark is a hearing: it moves the schedule exactly as a recital
         does, so a page marked at 58% goes back to the first return
         rather than merely acquiring a poor number. */
      var outcome = mark.itqan >= 88 ? 'clean' : mark.itqan >= 70 ? 'minor' : 'broken';
      for (var p = s.from; p <= s.to; p++) {
        if (!led[p]) continue;
        var next = advance(led[p], outcome, mark.itqan);
        d.delta[p] = { state: next.state, itqan: mark.itqan, since: 0, ret: next.ret,
                       recitals: (led[p].recitals || 0) + 1 };
      }
      return write(d);
    },

    attend: function (d) {
      var k = todayKey();
      if (d.attendance.indexOf(k) === -1) {
        d.attendance.unshift(k);
        d.streak = (d.streak || 0) + 1;
        var st = stats(ledgerFor(d));
        d.history.push({ d: 0, pages: st.pagesHeld, itqan: st.avgItqan });
        if (d.history.length > 90) d.history.shift();
      }
      return d;
    },

    message: function (d, from, body) {
      d.messages.unshift({ id: 'm-' + Date.now(), from: from, to: d.email, at: Date.now(), body: body, read: false });
      return write(d);
    },

    readMessages: function (d) {
      d.messages.forEach(function (m) { m.read = true; });
      return write(d);
    },

    sitting: function (d, s) {
      d.sittings.unshift({ id: 'x-' + Date.now(), at: Date.now(), from: s.from, to: s.to, note: s.note });
      return write(d);
    }
  };

  /* Aging. Every page's revision clock advances once per calendar day
     the portal is opened — otherwise `since` would be frozen at whatever
     the seed produced and the queue would never change. */
  function ageIfNewDay(d) {
    var k = todayKey();
    if (d.lastDay === k) return d;
    var days = d.lastDay ? 1 : 0;          // one tick per opening day
    if (days) {
      var led = ledgerFor(d);
      led.forEach(function (row) {
        if (!row || row.since == null) return;
        var cur = d.delta[row.page] || {};
        d.delta[row.page] = Object.assign({}, cur, {
          state: cur.state != null ? cur.state : row.state,
          itqan: cur.itqan != null ? cur.itqan : row.itqan,
          ret: cur.ret != null ? cur.ret : row.ret,
          since: row.since + days
        });
      });
    }
    d.lastDay = k;
    return write(d);
  }

  window.RiwaqStore = {
    VERSION: VERSION, PAGES: PAGES, SABAQ_PAGE: SABAQ_PAGE, ERROR_KINDS: ERROR_KINDS,
    SESSION_KEY: SESSION, PREFIX: PREFIX,
    juzOf: juzOf, juzRange: juzRange,
    read: read, write: write, reset: reset, ageIfNewDay: ageIfNewDay,
    ledgerFor: ledgerFor, interval: interval, dueToday: dueToday, stats: stats,
    RETURNS: RETURNS,
    actions: Actions,
    exportJSON: function (email) { return JSON.stringify(read(email), null, 2); },
    importJSON: function (email, text) {
      var d = JSON.parse(text);
      if (!d || typeof d !== 'object') throw new Error('Not a record.');
      d.email = email;
      if (d.v !== VERSION) d = migrate(d, email);
      return write(d);
    }
  };
})();
