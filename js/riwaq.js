/* =====================================================================
   THE RIWĀQ — Dār al-Rusūkh's learning portal.

   Named for the colonnade of a congregational mosque, where the study
   circles of al-Azhar have sat for a thousand years: the place you go to
   join a ḥalaqah rather than the building it is inside.

   WHAT THIS IS. A complete, working front end for the College's learning
   system, driven by a seeded model in the browser. Sign in, sign out,
   role routing, the Ḥifẓ ledger, the murājaʿah scheduler, recitation
   submission, the correction ledger, the teacher's ḥalaqah, the academic
   record and the ijāzah tracker all function.

   WHAT THIS IS NOT. There is no server. No credential is checked against
   anything, no recitation leaves the device, and every figure below comes
   from the seeded model rather than from a student. The portal says so on
   every screen, because a demonstration that lets itself be mistaken for
   a live system is the one kind of preview that does damage.

   WHY IT IS ORGANISED AROUND SABAQ / SABQI / MANZIL. Generic learning
   systems model a course as a list of lessons with a completion tick.
   That is the wrong shape for ḥifẓ, where the same page is revisited for
   years and what matters is not whether it was covered but how firmly it
   is held. The classical triad is the correct model and the whole ledger
   is built on it:

     SABAQ    the new lesson — today's portion, first committed
     SABQI    recent revision — roughly the last seven juzʾ, revisited daily
     MANZIL   old revision — everything before that, on a longer cycle
     ITQĀN    held to the standard at which it can be examined

   ===================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ===================================================================
     THE MUṢḤAF
     604 pages, and the page on which each juzʾ opens in the Madīnah
     muṣḥaf. Everything in the ledger is indexed off this one array, so a
     juzʾ boundary is stated once rather than in six places.
     =================================================================== */

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

  /* Deterministic PRNG. The model must look the same on every load and on
     every machine — a demonstration whose numbers move when you refresh
     teaches the reader not to trust any of them. */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* ===================================================================
     THE MODEL
     =================================================================== */

  var ACCOUNTS = {
    'yusuf@daralrusukh.com': {
      pass: 'riwaq', role: 'student', name: 'Yūsuf Ibrāhīm', initials: 'YI',
      ref: 'DAR-S-1448-0412', country: 'Nigeria',
      programme: 'Diploma in Qurʾānic Memorisation',
      mode: 'Supervised', halaqah: 'Ḥalaqah al-Fajr · 07:00 WAT',
      teacher: 'Shaykh ʿAbd al-Raḥmān Ṣāliḥ', enrolled: '1447 / 2025'
    },
    'teacher@daralrusukh.com': {
      pass: 'riwaq', role: 'teacher', name: 'Shaykh ʿAbd al-Raḥmān Ṣāliḥ', initials: 'AS',
      ref: 'DAR-F-1445-0037', country: 'Nigeria',
      programme: 'Faculty of the Qurʾān',
      mode: 'Chain-holder', halaqah: 'Ḥalaqah al-Fajr · Ḥalaqah al-ʿAṣr',
      teacher: '—', enrolled: '1445 / 2023'
    }
  };

  // Where the student has reached. Everything below juzʾ 9 is committed;
  // juzʾ 9 is in progress; the rest is unbegun.
  var COMMITTED_THROUGH = 8;
  var SABAQ_PAGE = 166;                      // today's new portion, in juzʾ 9

  function buildLedger() {
    var r = rng(20260816);
    var pages = new Array(PAGES + 1);
    for (var p = 1; p <= PAGES; p++) {
      var j = juzOf(p);
      var state, itqan;
      if (p === SABAQ_PAGE) { state = 'sabaq'; itqan = 34 + Math.floor(r() * 14); }
      else if (j === 9 && p < SABAQ_PAGE) { state = 'sabqi'; itqan = 58 + Math.floor(r() * 22); }
      else if (j > COMMITTED_THROUGH) { state = 'new'; itqan = 0; }
      else if (j >= COMMITTED_THROUGH - 1) { state = 'sabqi'; itqan = 66 + Math.floor(r() * 24); }
      else {
        itqan = 72 + Math.floor(r() * 28);
        state = itqan >= 92 ? 'itqan' : 'manzil';
      }
      // Days since the page was last recited to a teacher.
      var since = state === 'new' ? null
        : state === 'sabaq' ? 0
        : state === 'sabqi' ? Math.floor(r() * 3)
        : Math.floor(r() * 34);
      pages[p] = { page: p, juz: j, state: state, itqan: itqan, since: since };
    }
    return pages;
  }

  /* The murājaʿah interval. Spaced repetition, but keyed to itqān rather
     than to a plain success count: a page held at 95 can wait three
     weeks, a page at 70 cannot wait three days. This is the piece a
     generic LMS has no equivalent for. */
  function interval(itqan) {
    if (itqan >= 95) return 21;
    if (itqan >= 88) return 14;
    if (itqan >= 80) return 7;
    if (itqan >= 72) return 4;
    return 2;
  }

  function dueToday(ledger) {
    return ledger.filter(function (p) {
      return p && p.since != null && p.state !== 'sabaq' && p.since >= interval(p.itqan);
    }).sort(function (a, b) {
      return (b.since - interval(b.itqan)) - (a.since - interval(a.itqan));
    });
  }

  var ERROR_KINDS = [
    { key: 'harakah', label: 'Ḥarakah', desc: 'A vowel altered or dropped' },
    { key: 'madd', label: 'Madd', desc: 'Elongation short or over-held' },
    { key: 'ghunnah', label: 'Ghunnah', desc: 'Nasalisation missing or excessive' },
    { key: 'waqf', label: 'Waqf', desc: 'Stopped or resumed at a wrong place' },
    { key: 'omission', label: 'Omission', desc: 'A word or phrase left out' },
    { key: 'hesitation', label: 'Hesitation', desc: 'Recall broke and had to be prompted' }
  ];

  function buildCorrections() {
    var r = rng(778101);
    var refs = [
      ['Al-Tawbah 9:41', 165], ['Al-Tawbah 9:36', 164], ['Al-Anfāl 8:72', 186],
      ['Al-Anfāl 8:60', 184], ['Al-Aʿrāf 7:204', 176], ['Al-Aʿrāf 7:143', 167],
      ['Al-Anʿām 6:151', 148], ['Al-Māʾidah 5:90', 123], ['Al-Nisāʾ 4:103', 95],
      ['Āl ʿImrān 3:159', 71], ['Al-Baqarah 2:255', 42], ['Al-Baqarah 2:186', 28]
    ];
    return refs.map(function (x, i) {
      var k = ERROR_KINDS[Math.floor(r() * ERROR_KINDS.length)];
      return {
        ayah: x[0], page: x[1], kind: k.key, kindLabel: k.label,
        days: i + Math.floor(r() * 3),
        note: [
          'Ḥarakah on the final word shortened; repeat the āyah five times.',
          'Madd lāzim held for four counts — it takes six.',
          'Ghunnah dropped at the idghām; hold two counts.',
          'Stopped mid-genitive. Take the waqf at the end of the clause.',
          'A word omitted on the second line. Re-read the page before Fajr.',
          'Recall broke at the page turn — a common seam. Join the two pages.'
        ][ERROR_KINDS.indexOf(k)],
        cleared: i > 5
      };
    });
  }

  var TAJWID = [
    { rule: 'Makhārij al-ḥurūf', pct: 94 }, { rule: 'Ṣifāt al-ḥurūf', pct: 88 },
    { rule: 'Aḥkām al-nūn al-sākinah', pct: 96 }, { rule: 'Aḥkām al-mīm al-sākinah', pct: 91 },
    { rule: 'Al-madd wa aqsāmuh', pct: 79 }, { rule: 'Al-qalqalah', pct: 97 },
    { rule: 'Al-waqf wa al-ibtidāʾ', pct: 73 }, { rule: 'Al-tafkhīm wa al-tarqīq', pct: 84 }
  ];

  var HALAQAH = [
    { name: 'Yūsuf Ibrāhīm', country: 'Nigeria', juz: 9, itqan: 86, due: 12, submitted: true, streak: 41 },
    { name: 'Ādam Nwachukwu', country: 'Nigeria', juz: 6, itqan: 81, due: 9, submitted: true, streak: 23 },
    { name: 'Fāṭimah al-Zahrāʾ', country: 'United Kingdom', juz: 14, itqan: 92, due: 16, submitted: true, streak: 118 },
    { name: 'Bilāl Adeyemi', country: 'Nigeria', juz: 4, itqan: 74, due: 7, submitted: false, streak: 5 },
    { name: 'Maryam Sulaimān', country: 'Qatar', juz: 22, itqan: 95, due: 21, submitted: true, streak: 204 },
    { name: 'Ibrāhīm Danladi', country: 'Nigeria', juz: 11, itqan: 88, due: 14, submitted: false, streak: 0 },
    { name: 'ʿĀʾishah Bello', country: 'Nigeria', juz: 3, itqan: 77, due: 6, submitted: true, streak: 17 },
    { name: 'Ḥamzah Okonkwo', country: 'United States', juz: 8, itqan: 83, due: 11, submitted: true, streak: 62 }
  ];

  var RECORD = [
    { code: 'QUR-101', title: 'Certificate in Qurʾānic Foundation', session: '1447 / I', mark: 91, grade: 'Mumtāz', state: 'Conferred' },
    { code: 'QUR-140', title: 'Certificate in Qurʾānic Recitation', session: '1447 / II', mark: 88, grade: 'Jayyid jiddan', state: 'Conferred' },
    { code: 'QUR-210', title: 'Diploma in Tajwīd and Recitation', session: '1447 / III', mark: 86, grade: 'Jayyid jiddan', state: 'Conferred' },
    { code: 'QUR-310', title: 'Diploma in Qurʾānic Memorisation', session: '1448 / I', mark: null, grade: '—', state: 'In progress' },
    { code: 'ARB-101', title: 'Certificate in Arabic, Level I', session: '1448 / I', mark: null, grade: '—', state: 'In progress' }
  ];

  /* ===================================================================
     SESSION
     A session object in localStorage. No token, no server, no claim to
     be either.
     =================================================================== */

  var KEY = 'riwaq.session';

  function session() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function signIn(email, pass) {
    var a = ACCOUNTS[String(email).trim().toLowerCase()];
    if (!a || a.pass !== pass) return null;
    var s = { email: String(email).trim().toLowerCase(), role: a.role, at: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function signOut() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    render();
  }
  function account() {
    var s = session();
    return s ? ACCOUNTS[s.email] : null;
  }

  /* ===================================================================
     VIEWS
     =================================================================== */

  var LEDGER = buildLedger();
  var CORRECTIONS = buildCorrections();

  var STATE_LABEL = {
    sabaq: 'Sabaq', sabqi: 'Sabqi', manzil: 'Manzil', itqan: 'Itqān', new: 'Not begun'
  };

  function stats() {
    var held = LEDGER.filter(function (p) { return p && p.state !== 'new'; });
    var itqan = LEDGER.filter(function (p) { return p && p.state === 'itqan'; });
    var avg = held.length ? Math.round(held.reduce(function (a, p) { return a + p.itqan; }, 0) / held.length) : 0;
    return {
      pagesHeld: held.length,
      juzHeld: COMMITTED_THROUGH,
      pctHeld: Math.round((held.length / PAGES) * 100),
      itqanPages: itqan.length,
      avgItqan: avg,
      due: dueToday(LEDGER).length,
      streak: 41
    };
  }

  function meter(pct, tone) {
    return '<div class="progress-meter"><div class="progress-meter__fill" style="width:' +
      Math.max(0, Math.min(100, pct)) + '%' + (tone ? ';background:' + tone : '') + '"></div></div>';
  }

  function pill(text, kind) {
    return '<span class="status-pill status-pill--' + kind + '">' + esc(text) + '</span>';
  }

  /* --- the muṣḥaf ledger, 604 cells ------------------------------------
     Every page of the muṣḥaf as one cell, coloured by the state it is
     held in. Six hundred and four cells is a lot of DOM, so it is built
     as one string and set once rather than appended in a loop. */
  function mushafGrid() {
    var out = [], j = 0;
    for (var p = 1; p <= PAGES; p++) {
      var cell = LEDGER[p];
      if (juzOf(p) !== j) {
        j = juzOf(p);
        out.push('<span class="mushaf__juz" aria-hidden="true">' + j + '</span>');
      }
      out.push('<i class="mushaf__pg is-' + cell.state + '" data-page="' + p +
        '" title="Page ' + p + ' · Juzʾ ' + cell.juz + ' · ' + STATE_LABEL[cell.state] +
        (cell.state === 'new' ? '' : ' · itqān ' + cell.itqan + '%') + '"></i>');
    }
    return out.join('');
  }

  function juzTable() {
    var rows = [];
    for (var j = 1; j <= 30; j++) {
      var r = juzRange(j);
      var pages = LEDGER.slice(r.from, r.to + 1);
      var held = pages.filter(function (p) { return p.state !== 'new'; });
      var avg = held.length ? Math.round(held.reduce(function (a, p) { return a + p.itqan; }, 0) / held.length) : 0;
      var pct = Math.round((held.length / pages.length) * 100);
      rows.push('<tr><th scope="row">Juzʾ ' + j + '</th>' +
        '<td>' + r.from + '&ndash;' + r.to + '</td>' +
        '<td>' + held.length + ' / ' + pages.length + '</td>' +
        '<td class="riwaq-meter">' + meter(pct) + '</td>' +
        '<td>' + (avg ? avg + '%' : '&mdash;') + '</td>' +
        '<td>' + (pct === 100 && avg >= 92 ? pill('Itqān', 'good')
          : pct === 100 ? pill('Held', 'progress')
          : pct > 0 ? pill('In progress', 'progress') : pill('Not begun', 'muted')) + '</td></tr>');
    }
    return rows.join('');
  }

  /* --- views ----------------------------------------------------------- */

  function viewDashboard(a) {
    var s = stats();
    var due = dueToday(LEDGER);
    var sabaq = LEDGER[SABAQ_PAGE];
    var open = CORRECTIONS.filter(function (c) { return !c.cleared; });

    return '' +
    '<div class="stat-tiles">' +
      tile('Committed to memory', s.pagesHeld + ' <small>/ ' + PAGES + ' pages</small>', 'Juzʾ 1–' + s.juzHeld + ' complete · ' + s.pctHeld + '% of the muṣḥaf') +
      tile('Average itqān', s.avgItqan + '<small>%</small>', s.itqanPages + ' pages held at examination standard') +
      tile('Due for murājaʿah', String(s.due), 'Pages past their interval today') +
      tile('Unbroken days', String(s.streak), 'Since 6 Rajab · longest run 41') +
    '</div>' +

    '<div class="riwaq-triad">' +
      triad('Sabaq', 'اليوم', 'Page ' + SABAQ_PAGE + ' · Juzʾ ' + sabaq.juz,
        'Today’s new portion. Recite to your teacher before Fajr tomorrow.', sabaq.itqan, 'sabaq') +
      triad('Sabqi', 'القريب', 'Juzʾ 7–9 · 34 pages',
        'Recent memorisation, revisited every day until it settles.', 74, 'sabqi') +
      triad('Manzil', 'البعيد', 'Juzʾ 1–6 · ' + due.length + ' pages due',
        'The older portion, on its own cycle. The scheduler chooses today’s.', 88, 'manzil') +
    '</div>' +

    '<div class="app-grid">' +
      '<div class="panel">' +
        '<div class="panel__head"><h2>Today’s murājaʿah</h2>' +
          '<a href="#muraja" data-view="muraja">Open the scheduler</a></div>' +
        (due.length ? due.slice(0, 6).map(function (p) {
          return '<div class="class-row">' +
            '<div class="class-row__when">Juzʾ<strong>' + p.juz + '</strong></div>' +
            '<div class="class-row__body"><h3>Page ' + p.page + '</h3>' +
              '<span>Last recited ' + p.since + ' days ago · interval ' + interval(p.itqan) +
              ' days · itqān ' + p.itqan + '%</span></div>' +
            '<span class="riwaq-overdue">' + (p.since - interval(p.itqan)) + 'd over</span>' +
          '</div>';
        }).join('') : '<p class="riwaq-empty">Nothing is past its interval today.</p>') +
      '</div>' +

      '<div class="panel">' +
        '<div class="panel__head"><h2>Corrections outstanding</h2>' +
          '<a href="#corrections" data-view="corrections">The full ledger</a></div>' +
        (open.length ? open.map(function (c) {
          return '<div class="riwaq-corr">' +
            '<span class="riwaq-corr__kind is-' + c.kind + '">' + esc(c.kindLabel) + '</span>' +
            '<div><strong>' + esc(c.ayah) + '</strong><span>' + esc(c.note) + '</span></div>' +
          '</div>';
        }).join('') : '<p class="riwaq-empty">No corrections outstanding.</p>') +
      '</div>' +
    '</div>' +

    '<div class="panel">' +
      '<div class="panel__head"><h2>Your ḥalaqah</h2><span class="riwaq-quiet">' + esc(a.halaqah) + '</span></div>' +
      '<div class="class-row">' +
        '<div class="class-row__when">Daily<strong>07:00</strong></div>' +
        '<div class="class-row__body"><h3>Recitation to ' + esc(a.teacher) + '</h3>' +
          '<span>Sabaq, then sabqi. West Africa Time (UTC+1).</span></div>' +
        '<a class="btn btn--outline" href="#recite" data-view="recite">Submit a recitation</a>' +
      '</div>' +
    '</div>';
  }

  function tile(label, value, sub) {
    return '<div class="stat-tile"><div class="stat-tile__content">' +
      '<div class="stat-tile__label">' + label + '</div>' +
      '<div class="stat-tile__value">' + value + '</div>' +
      '<div class="stat-tile__sub">' + sub + '</div></div></div>';
  }

  function triad(name, ar, scope, desc, pct, kind) {
    return '<div class="triad is-' + kind + '">' +
      '<div class="triad__head"><span class="triad__name">' + name + '</span>' +
      '<span class="triad__ar" lang="ar" dir="rtl">' + ar + '</span></div>' +
      '<p class="triad__scope">' + scope + '</p>' +
      '<p class="triad__desc">' + desc + '</p>' +
      meter(pct) + '</div>';
  }

  function viewHifz() {
    var s = stats();
    return '' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>The Ḥifẓ Ledger</h2>' +
        '<span class="riwaq-quiet">' + s.pagesHeld + ' of ' + PAGES + ' pages</span></div>' +
      '<p class="riwaq-lede">Every page of the muṣḥaf, in the state it is actually held in. ' +
        'A page is not finished when it has been memorised — it is finished when it holds ' +
        'at examination standard, and the ledger keeps that distinction.</p>' +
      '<div class="mushaf" role="img" aria-label="All 604 pages of the muṣḥaf by state of memorisation">' +
        mushafGrid() + '</div>' +
      '<div class="mushaf__key">' +
        ['sabaq', 'sabqi', 'manzil', 'itqan', 'new'].map(function (k) {
          return '<span><i class="mushaf__pg is-' + k + '"></i>' + STATE_LABEL[k] + '</span>';
        }).join('') +
      '</div>' +
    '</div>' +

    '<div class="panel">' +
      '<div class="panel__head"><h2>By juzʾ</h2></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table">' +
        '<thead><tr><th>Juzʾ</th><th>Pages</th><th>Held</th><th>Progress</th><th>Itqān</th><th>State</th></tr></thead>' +
        '<tbody>' + juzTable() + '</tbody></table></div>' +
    '</div>' +

    '<div class="panel">' +
      '<div class="panel__head"><h2>Tajwīd mastery</h2></div>' +
      '<div class="riwaq-rules">' + TAJWID.map(function (t) {
        return '<div class="riwaq-rule"><div class="riwaq-rule__head"><span>' + esc(t.rule) +
          '</span><strong>' + t.pct + '%</strong></div>' + meter(t.pct) + '</div>';
      }).join('') + '</div>' +
    '</div>';
  }

  function viewMuraja() {
    var due = dueToday(LEDGER);
    var byJuz = {};
    due.forEach(function (p) { (byJuz[p.juz] = byJuz[p.juz] || []).push(p); });
    return '' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Murājaʿah scheduler</h2>' +
        '<span class="riwaq-quiet">' + due.length + ' pages due today</span></div>' +
      '<p class="riwaq-lede">Intervals are set by <strong>itqān</strong>, not by a count of ' +
        'successful recitals. A page held at 95% can wait three weeks; a page at 70% cannot ' +
        'wait three days. This is why the scheduler and the ledger are the same instrument.</p>' +
      '<div class="riwaq-intervals">' +
        [[95, 21], [88, 14], [80, 7], [72, 4], [0, 2]].map(function (x) {
          return '<div class="riwaq-interval"><strong>' + (x[0] ? x[0] + '%+' : 'below 72%') +
            '</strong><span>every ' + x[1] + ' day' + (x[1] > 1 ? 's' : '') + '</span></div>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Today’s queue</h2></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table">' +
      '<thead><tr><th>Page</th><th>Juzʾ</th><th>State</th><th>Itqān</th><th>Interval</th><th>Last recited</th><th>Overdue</th></tr></thead><tbody>' +
      (due.length ? due.slice(0, 40).map(function (p) {
        return '<tr><th scope="row">' + p.page + '</th><td>' + p.juz + '</td>' +
          '<td>' + STATE_LABEL[p.state] + '</td><td>' + p.itqan + '%</td>' +
          '<td>' + interval(p.itqan) + 'd</td><td>' + p.since + 'd ago</td>' +
          '<td>' + pill((p.since - interval(p.itqan)) + ' days', p.since - interval(p.itqan) > 6 ? 'critical' : 'progress') + '</td></tr>';
      }).join('') : '<tr><td colspan="7">Nothing due.</td></tr>') +
      '</tbody></table></div></div>';
  }

  function viewRecite() {
    return '' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Submit a recitation</h2></div>' +
      '<p class="riwaq-lede">Recitation is submitted to your teacher, who returns it marked ' +
        'by āyah. Sabaq must reach your teacher before the following Fajr.</p>' +
      '<form class="riwaq-form" data-recite>' +
        '<div class="riwaq-field"><label for="rc-kind">Portion</label>' +
          '<select id="rc-kind"><option>Sabaq — page ' + SABAQ_PAGE + '</option>' +
          '<option>Sabqi — juzʾ 7–9</option><option>Manzil — today’s queue</option>' +
          '<option>Full juzʾ, for examination</option></select></div>' +
        '<div class="riwaq-field"><label for="rc-from">From page</label>' +
          '<input id="rc-from" type="number" min="1" max="604" value="' + SABAQ_PAGE + '"></div>' +
        '<div class="riwaq-field"><label for="rc-to">To page</label>' +
          '<input id="rc-to" type="number" min="1" max="604" value="' + SABAQ_PAGE + '"></div>' +
        '<div class="riwaq-field riwaq-field--wide"><label for="rc-note">Note to your teacher</label>' +
          '<textarea id="rc-note" rows="3" placeholder="Anything the teacher should know before listening."></textarea></div>' +
        '<div class="riwaq-rec"><button type="button" class="btn btn--outline" data-rec-toggle>' +
          '<span data-rec-label>Start recording</span></button>' +
          '<span class="riwaq-rec__time" data-rec-time>00:00</span>' +
          '<span class="riwaq-rec__hint">Audio is captured on this device only.</span></div>' +
        '<button type="submit" class="btn btn--gold">Submit to ' + esc(account().teacher) + '</button>' +
        '<p class="riwaq-form__status" data-recite-status role="status"></p>' +
      '</form>' +
    '</div>';
  }

  function viewCorrections() {
    var counts = {};
    CORRECTIONS.forEach(function (c) { counts[c.kind] = (counts[c.kind] || 0) + 1; });
    return '' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Correction ledger</h2>' +
      '<span class="riwaq-quiet">' + CORRECTIONS.filter(function (c) { return !c.cleared; }).length + ' outstanding</span></div>' +
      '<p class="riwaq-lede">Every correction your teacher has marked, by āyah and by kind. ' +
        'The categories are the ones a muṣaḥḥiḥ actually uses — which is what makes the ' +
        'pattern legible: six ḥarakah slips in one juzʾ is a different problem from six ' +
        'hesitations.</p>' +
      '<div class="riwaq-kinds">' + ERROR_KINDS.map(function (k) {
        return '<div class="riwaq-kind is-' + k.key + '"><strong>' + (counts[k.key] || 0) + '</strong>' +
          '<span>' + esc(k.label) + '</span><small>' + esc(k.desc) + '</small></div>';
      }).join('') + '</div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Marked by āyah</h2></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table">' +
      '<thead><tr><th>Āyah</th><th>Page</th><th>Kind</th><th>Teacher’s note</th><th>When</th><th>State</th></tr></thead><tbody>' +
      CORRECTIONS.map(function (c) {
        return '<tr><th scope="row">' + esc(c.ayah) + '</th><td>' + c.page + '</td>' +
          '<td><span class="riwaq-corr__kind is-' + c.kind + '">' + esc(c.kindLabel) + '</span></td>' +
          '<td class="riwaq-note">' + esc(c.note) + '</td><td>' + c.days + 'd ago</td>' +
          '<td>' + (c.cleared ? pill('Cleared', 'good') : pill('Outstanding', 'critical')) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function viewIjazah() {
    var s = stats();
    var steps = [
      ['Complete memorisation', s.pctHeld + '% of the muṣḥaf held', s.pctHeld],
      ['Itqān across all thirty juzʾ', 'Average ' + s.avgItqan + '% — 92% required', Math.round(s.avgItqan / 92 * 100)],
      ['Tajwīd examined', 'Diploma in Tajwīd conferred 1447 / III', 100],
      ['Complete recitation to a chain-holder', 'Not begun — opens on completion of ḥifẓ', 0],
      ['Conferral and entry in the register', 'Instrument states the full sanad', 0]
    ];
    return '' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Ijāzah readiness</h2></div>' +
      '<p class="riwaq-lede">The Higher Diploma with <em>ijāzah</em> requires the complete ' +
        'Qurʾān recited to a member of faculty holding a connected chain, live and in one ' +
        'unbroken course of sittings. This tracks the conditions, not a percentage of a course.</p>' +
      '<div class="riwaq-steps">' + steps.map(function (st, i) {
        return '<div class="riwaq-step' + (st[2] >= 100 ? ' is-done' : st[2] > 0 ? ' is-active' : '') + '">' +
          '<span class="riwaq-step__n">' + ['I', 'II', 'III', 'IV', 'V'][i] + '</span>' +
          '<div><h3>' + esc(st[0]) + '</h3><p>' + esc(st[1]) + '</p>' + meter(st[2]) + '</div></div>';
      }).join('') + '</div>' +
    '</div>';
  }

  function viewRecord(a) {
    return '' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Academic record</h2>' +
        '<span class="riwaq-quiet">' + esc(a.ref) + '</span></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table">' +
      '<thead><tr><th>Code</th><th>Programme</th><th>Session</th><th>Mark</th><th>Grade</th><th>State</th></tr></thead><tbody>' +
      RECORD.map(function (r) {
        return '<tr><th scope="row">' + r.code + '</th><td>' + esc(r.title) + '</td>' +
          '<td>' + r.session + '</td><td>' + (r.mark == null ? '&mdash;' : r.mark + '%') + '</td>' +
          '<td>' + esc(r.grade) + '</td>' +
          '<td>' + (r.state === 'Conferred' ? pill('Conferred', 'good') : pill('In progress', 'progress')) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="riwaq-quiet" style="margin-top:16px">Marks are recorded against written and ' +
        'oral examination separately; the figure shown is the lower of the two, which is the ' +
        'one that governs the award.</p>' +
    '</div>';
  }

  function viewHalaqah() {
    var pending = HALAQAH.filter(function (s) { return !s.submitted; });
    return '' +
    '<div class="stat-tiles">' +
      tile('Students', String(HALAQAH.length), 'Two ḥalaqāt · cap of twelve each') +
      tile('Submitted today', (HALAQAH.length - pending.length) + ' <small>/ ' + HALAQAH.length + '</small>', 'Sabaq due before Fajr') +
      tile('Awaiting correction', String(HALAQAH.length - pending.length), 'Recitations to mark') +
      tile('Average itqān', Math.round(HALAQAH.reduce(function (a, s) { return a + s.itqan; }, 0) / HALAQAH.length) + '<small>%</small>', 'Across the ḥalaqah') +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Ḥalaqah roster</h2><span class="riwaq-quiet">Ḥalaqah al-Fajr · 07:00 WAT</span></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table">' +
      '<thead><tr><th>Student</th><th>Country</th><th>Juzʾ</th><th>Itqān</th><th>Due today</th><th>Streak</th><th>Today</th></tr></thead><tbody>' +
      HALAQAH.map(function (s) {
        return '<tr><th scope="row">' + esc(s.name) + '</th><td>' + esc(s.country) + '</td>' +
          '<td>' + s.juz + '</td><td>' + s.itqan + '%</td><td>' + s.due + ' pages</td>' +
          '<td>' + s.streak + 'd</td>' +
          '<td>' + (s.submitted ? pill('Submitted', 'good') : pill('Not yet', 'critical')) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Correction queue</h2></div>' +
      HALAQAH.filter(function (s) { return s.submitted; }).slice(0, 5).map(function (s) {
        return '<div class="class-row"><div class="class-row__when">Juzʾ<strong>' + s.juz + '</strong></div>' +
          '<div class="class-row__body"><h3>' + esc(s.name) + '</h3>' +
          '<span>Sabaq submitted · awaiting correction</span></div>' +
          '<a class="btn btn--outline" href="#corrections" data-view="corrections">Mark</a></div>';
      }).join('') + '</div>';
  }

  function viewSettings(a) {
    return '' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Your account</h2></div>' +
      '<div class="riwaq-kv">' +
        kv('Name', a.name) + kv('Reference', a.ref) + kv('Role', a.role === 'teacher' ? 'Member of faculty' : 'Student') +
        kv('Programme', a.programme) + kv('Mode of tuition', a.mode) +
        kv('Ḥalaqah', a.halaqah) + kv('Enrolled', a.enrolled) + kv('Country', a.country) +
      '</div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel__head"><h2>Session</h2></div>' +
      '<p class="riwaq-lede">You are signed in on this device only. Signing out clears the ' +
        'session immediately.</p>' +
      '<button class="btn btn--outline" data-signout>Sign out</button>' +
    '</div>';
  }

  function kv(k, v) {
    return '<div class="riwaq-kv__row"><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>';
  }

  /* ===================================================================
     NAVIGATION + SHELL
     =================================================================== */

  var NAV_STUDENT = [
    ['dashboard', 'Today', 'i-compass'],
    ['hifz', 'Ḥifẓ Ledger', 'i-mushaf'],
    ['muraja', 'Murājaʿah', 'i-progress'],
    ['recite', 'Submit Recitation', 'i-waveform'],
    ['corrections', 'Corrections', 'i-quill'],
    ['ijazah', 'Ijāzah Readiness', 'i-sanad'],
    ['record', 'Academic Record', 'i-ledger'],
    ['settings', 'Account', 'i-key']
  ];
  var NAV_TEACHER = [
    ['halaqah', 'My Ḥalaqah', 'i-columns'],
    ['corrections', 'Correction Ledger', 'i-quill'],
    ['hifz', 'Ḥifẓ Ledger', 'i-mushaf'],
    ['muraja', 'Murājaʿah', 'i-progress'],
    ['record', 'Records', 'i-ledger'],
    ['settings', 'Account', 'i-key']
  ];

  var VIEWS = {
    dashboard: viewDashboard, hifz: viewHifz, muraja: viewMuraja, recite: viewRecite,
    corrections: viewCorrections, ijazah: viewIjazah, record: viewRecord,
    halaqah: viewHalaqah, settings: viewSettings
  };

  var current = 'dashboard';

  function renderSignIn() {
    return '' +
    '<div class="signin">' +
      '<div class="signin__panel crystal">' +
        '<svg class="signin__crest" viewBox="0 0 64 64" aria-hidden="true">' +
          '<circle cx="32" cy="32" r="30.5" fill="none" stroke="currentColor" stroke-width="1"/>' +
          '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">' +
          '<rect x="14" y="14" width="36" height="36"/>' +
          '<rect x="14" y="14" width="36" height="36" transform="rotate(45 32 32)"/></g>' +
          '<circle cx="32" cy="32" r="8" fill="currentColor" opacity=".2"/></svg>' +
        '<h1 class="signin__title">The Riwāq</h1>' +
        '<p class="signin__sub">Dār al-Rusūkh &middot; learning portal</p>' +
        '<form data-signin>' +
          '<div class="riwaq-field"><label for="si-email">Email</label>' +
            '<input id="si-email" type="email" autocomplete="username" required></div>' +
          '<div class="riwaq-field"><label for="si-pass">Password</label>' +
            '<input id="si-pass" type="password" autocomplete="current-password" required></div>' +
          '<button class="btn btn--gold" type="submit">Sign in</button>' +
          '<p class="signin__error" data-signin-error role="alert"></p>' +
        '</form>' +
        '<div class="signin__demo">' +
          '<p class="signin__demo-h">Demonstration accounts</p>' +
          '<button type="button" class="signin__as" data-as="yusuf@daralrusukh.com">' +
            '<strong>Student</strong><span>yusuf@daralrusukh.com &middot; riwaq</span></button>' +
          '<button type="button" class="signin__as" data-as="teacher@daralrusukh.com">' +
            '<strong>Member of faculty</strong><span>teacher@daralrusukh.com &middot; riwaq</span></button>' +
        '</div>' +
        '<p class="signin__note">This portal runs entirely in your browser. No credential is ' +
          'checked against any server, no recitation leaves this device, and every figure ' +
          'inside is illustrative. It is a working demonstration of the College’s learning ' +
          'system, not a live account.</p>' +
      '</div>' +
    '</div>';
  }

  function renderApp(a) {
    var nav = a.role === 'teacher' ? NAV_TEACHER : NAV_STUDENT;
    if (!nav.some(function (n) { return n[0] === current; })) current = nav[0][0];
    var view = VIEWS[current] || VIEWS.dashboard;

    return '' +
    '<div class="preview-banner">The Riwāq is a working demonstration. It runs in your ' +
      'browser, holds no real record, and issues nothing.</div>' +
    '<div class="app-shell">' +
      '<aside class="app-sidebar">' +
        '<div class="app-sidebar__brand"><a href="/rusukh/">Dār al-Rusūkh</a><span>The Riwāq</span></div>' +
        '<nav class="app-nav">' + nav.map(function (n) {
          return '<a href="#' + n[0] + '" data-view="' + n[0] + '"' +
            (n[0] === current ? ' aria-current="page"' : '') + '>' +
            '<svg class="icon" aria-hidden="true"><use href="#' + n[2] + '"/></svg>' + n[1] + '</a>';
        }).join('') + '</nav>' +
        '<div class="app-sidebar__foot">' +
          '<button class="btn btn--outline" data-signout>Sign out</button>' +
        '</div>' +
      '</aside>' +
      '<main class="app-main">' +
        '<div class="app-topline">' +
          '<div class="app-student">' +
            '<div class="app-student__avatar">' + esc(a.initials) + '</div>' +
            '<div><div class="app-student__name">' + esc(a.name) + '</div>' +
            '<div class="app-student__level">' + esc(a.programme) + ' &middot; ' + esc(a.ref) + '</div></div>' +
          '</div>' +
          '<div class="app-topline__right"><span class="riwaq-quiet" data-hijri-long></span></div>' +
        '</div>' +
        view(a) +
      '</main>' +
    '</div>';
  }

  /* ===================================================================
     RENDER + EVENTS
     =================================================================== */

  function render() {
    var host = $('[data-riwaq]');
    if (!host) return;
    var a = account();
    host.innerHTML = a ? renderApp(a) : renderSignIn();
    if (a && window.__rusukhDates) window.__rusukhDates();
    host.scrollIntoView({ block: 'start' });
  }

  document.addEventListener('click', function (e) {
    var host = $('[data-riwaq]');
    if (!host) return;

    var as = e.target.closest('[data-as]');
    if (as) {
      $('#si-email').value = as.dataset.as;
      $('#si-pass').value = 'riwaq';
      return;
    }
    var nav = e.target.closest('[data-view]');
    if (nav && host.contains(nav)) {
      e.preventDefault();
      current = nav.dataset.view;
      render();
      return;
    }
    if (e.target.closest('[data-signout]')) { e.preventDefault(); current = 'dashboard'; signOut(); return; }

    var rec = e.target.closest('[data-rec-toggle]');
    if (rec) {
      var label = $('[data-rec-label]'), time = $('[data-rec-time]');
      if (rec.dataset.on) {
        clearInterval(rec._t); delete rec.dataset.on;
        label.textContent = 'Start recording';
        rec.classList.remove('is-recording');
      } else {
        rec.dataset.on = '1'; var n = 0;
        label.textContent = 'Stop recording';
        rec.classList.add('is-recording');
        rec._t = setInterval(function () {
          n++; time.textContent = pad2(Math.floor(n / 60)) + ':' + pad2(n % 60);
        }, 1000);
      }
    }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.matches('[data-signin]')) {
      e.preventDefault();
      var s = signIn($('#si-email').value, $('#si-pass').value);
      var err = $('[data-signin-error]');
      if (!s) { err.textContent = 'That email and password do not match a demonstration account.'; return; }
      current = s.role === 'teacher' ? 'halaqah' : 'dashboard';
      render();
      return;
    }
    if (e.target.matches('[data-recite]')) {
      e.preventDefault();
      var st = $('[data-recite-status]');
      st.textContent = 'Submitted to ' + account().teacher +
        '. In the live system this would enter their correction queue; here it goes nowhere.';
      st.className = 'riwaq-form__status is-ok';
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
