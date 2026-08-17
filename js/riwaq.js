/* =====================================================================
   THE RIWĀQ — the portal.

   The view layer over js/riwaq-store.js. Everything a user does here is
   a real mutation: a recital moves the page's itqān, which moves its
   revision interval, which moves tomorrow's queue; a submission lands in
   a teacher's queue and comes back marked against real āyāt, and the
   mark is applied to the ledger.

   Four roles, each with its own navigation: student, member of faculty,
   guardian, registry.

   It has no server. That is stated on the sign-in screen and on every
   page, and it is answered honestly rather than hidden: the record is
   yours, and Account → Your data will export it, re-import it, or clear
   it entirely.
   ===================================================================== */
(function () {
  'use strict';

  var S = window.RiwaqStore;
  if (!S) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var pad2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var ago = function (ms) {
    var d = Math.round((Date.now() - ms) / 86400000);
    return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago';
  };

  var ACCOUNTS = {
    'yusuf@daralrusukh.com': {
      pass: 'riwaq', role: 'student', name: 'Yūsuf Ibrāhīm', initials: 'YI',
      ref: 'DAR-S-1448-0412', country: 'Nigeria',
      programme: 'Diploma in Qurʾānic Memorisation', mode: 'Supervised',
      halaqah: 'Ḥalaqah al-Fajr · 07:00 WAT',
      teacher: 'Shaykh ʿAbd al-Raḥmān Ṣāliḥ', enrolled: '1447 / 2025'
    },
    'teacher@daralrusukh.com': {
      pass: 'riwaq', role: 'teacher', name: 'Shaykh ʿAbd al-Raḥmān Ṣāliḥ', initials: 'AS',
      ref: 'DAR-F-1445-0037', country: 'Nigeria',
      programme: 'Faculty of the Qurʾān', mode: 'Chain-holder',
      halaqah: 'Ḥalaqah al-Fajr · Ḥalaqah al-ʿAṣr', teacher: '—', enrolled: '1445 / 2023'
    },
    'guardian@daralrusukh.com': {
      pass: 'riwaq', role: 'guardian', name: 'Ibrāhīm Adeyemi', initials: 'IA',
      ref: 'DAR-G-1448-0119', country: 'Nigeria',
      programme: 'Guardian of Yūsuf Ibrāhīm', mode: 'Read-only',
      halaqah: '—', teacher: '—', enrolled: '1447 / 2025'
    },
    'registry@daralrusukh.com': {
      pass: 'riwaq', role: 'registrar', name: 'The Registry', initials: 'RG',
      ref: 'DAR-R-0001', country: 'Nigeria',
      programme: 'Registry & Examinations', mode: 'Administrative',
      halaqah: '—', teacher: '—', enrolled: '1441 / 2020'
    }
  };

  var WARD = 'yusuf@daralrusukh.com';

  var STATE_LABEL = {
    sabaq: 'Sabaq', sabqi: 'Sabqi', manzil: 'Manzil', itqan: 'Itqān', new: 'Not begun'
  };

  var HALAQAH = [
    { email: 'yusuf@daralrusukh.com', name: 'Yūsuf Ibrāhīm', country: 'Nigeria', juz: 9, itqan: 86, streak: 41 },
    { email: null, name: 'Ādam Nwachukwu', country: 'Nigeria', juz: 6, itqan: 81, streak: 23 },
    { email: null, name: 'Fāṭimah al-Zahrāʾ', country: 'United Kingdom', juz: 14, itqan: 92, streak: 118 },
    { email: null, name: 'Bilāl Adeyemi', country: 'Nigeria', juz: 4, itqan: 74, streak: 5 },
    { email: null, name: 'Maryam Sulaimān', country: 'Qatar', juz: 22, itqan: 95, streak: 204 },
    { email: null, name: 'Ibrāhīm Danladi', country: 'Nigeria', juz: 11, itqan: 88, streak: 0 },
    { email: null, name: 'ʿĀʾishah Bello', country: 'Nigeria', juz: 3, itqan: 77, streak: 17 },
    { email: null, name: 'Ḥamzah Okonkwo', country: 'United States', juz: 8, itqan: 83, streak: 62 }
  ];

  var TAJWID = [
    { rule: 'Makhārij al-ḥurūf', pct: 94 }, { rule: 'Ṣifāt al-ḥurūf', pct: 88 },
    { rule: 'Aḥkām al-nūn al-sākinah', pct: 96 }, { rule: 'Aḥkām al-mīm al-sākinah', pct: 91 },
    { rule: 'Al-madd wa aqsāmuh', pct: 79 }, { rule: 'Al-qalqalah', pct: 97 },
    { rule: 'Al-waqf wa al-ibtidāʾ', pct: 73 }, { rule: 'Al-tafkhīm wa al-tarqīq', pct: 84 }
  ];

  var RECORD = [
    { code: 'QUR-101', title: 'Certificate in Qurʾānic Foundation', session: '1447 / I', mark: 91, grade: 'Mumtāz', state: 'Conferred' },
    { code: 'QUR-140', title: 'Certificate in Qurʾānic Recitation', session: '1447 / II', mark: 88, grade: 'Jayyid jiddan', state: 'Conferred' },
    { code: 'QUR-210', title: 'Diploma in Tajwīd and Recitation', session: '1447 / III', mark: 86, grade: 'Jayyid jiddan', state: 'Conferred' },
    { code: 'QUR-310', title: 'Diploma in Qurʾānic Memorisation', session: '1448 / I', mark: null, grade: '—', state: 'In progress' },
    { code: 'ARB-101', title: 'Certificate in Arabic, Level I', session: '1448 / I', mark: null, grade: '—', state: 'In progress' }
  ];

  /* ------------------------------------------------------- session */

  function session() {
    try { return JSON.parse(localStorage.getItem(S.SESSION_KEY) || 'null'); } catch (e) { return null; }
  }
  function account() { var s = session(); return s ? ACCOUNTS[s.email] : null; }
  /* THE DEMONSTRATION HOLDS ONE LIVE RECORD.
     All four roles read it; what differs is what they may do to it. That
     is not a simplification of the model — a teacher marking a student's
     recitation IS writing to the student's record, and a guardian reading
     their ward's progress IS reading it. The first version had each
     account read its own store, which meant a submission made by the
     student never reached the teacher's queue: the round trip was
     theatre. One record, four permissions, is the correct shape. */
  function dataEmail() { return session() ? WARD : null; }
  function load() {
    var e = dataEmail();
    return e ? S.ageIfNewDay(S.read(e)) : null;
  }
  function canWrite() { var s = session(); return s && (s.role === 'student' || s.role === 'teacher'); }

  /* ---------------------------------------------------- small parts */

  /* The fill is written as a custom property rather than a width so that
     css/riwaq.css can animate from 0 to it on entry. Writing `width`
     directly would fix the bar at its final length before the animation
     ever had anything to travel. */
  function meter(pct) {
    var v = Math.max(0, Math.min(100, pct));
    return '<div class="progress-meter"><div class="progress-meter__fill is-drawn" style="--fill:' +
      v + '%"></div></div>';
  }
  function pill(t, k) { return '<span class="status-pill status-pill--' + k + '">' + esc(t) + '</span>'; }
  /* data-count is read by js/rusukh-atelier.js: the figure rises from
     zero and settles when the tile enters view. These are measurements —
     pages held, itqān, days due — and a measurement that counts reads as
     one that was taken. An unparseable value is left exactly as written. */
  function tile(label, value, sub) {
    return '<div class="stat-tile"><div class="stat-tile__content">' +
      '<div class="stat-tile__label">' + label + '</div><div class="stat-tile__value" data-count>' + value +
      '</div><div class="stat-tile__sub">' + sub + '</div></div></div>';
  }

  /* A plain inline chart. Two series over the recorded history: pages
     committed, and average itqān. No library — this is a polyline. */
  function chart(hist) {
    if (!hist || hist.length < 2) return '';
    var W = 640, H = 150, n = hist.length;
    var px = function (i) { return (i / (n - 1)) * W; };
    var maxP = Math.max.apply(null, hist.map(function (h) { return h.pages; })) || 1;
    var pts = function (key, max) {
      return hist.map(function (h, i) { return px(i).toFixed(1) + ',' + (H - (h[key] / max) * (H - 12)).toFixed(1); }).join(' ');
    };
    return '<div class="riwaq-chart"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" ' +
      'aria-label="Pages committed and average itqān over the recorded history">' +
      '<polyline class="riwaq-chart__pages" points="' + pts('pages', maxP) + '"/>' +
      '<polyline class="riwaq-chart__itqan" points="' + pts('itqan', 100) + '"/>' +
      '</svg><div class="riwaq-chart__key"><span class="is-pages">Pages committed</span>' +
      '<span class="is-itqan">Average itqān</span></div></div>';
  }

  function mushafGrid(led, filter) {
    var out = [], j = 0;
    for (var p = 1; p <= S.PAGES; p++) {
      var c = led[p];
      if (S.juzOf(p) !== j) { j = S.juzOf(p); out.push('<span class="mushaf__juz" aria-hidden="true">' + j + '</span>'); }
      var dim = filter && String(p) !== filter && String(c.juz) !== filter ? ' is-dim' : '';
      out.push('<button type="button" class="mushaf__pg is-' + c.state + dim + '" data-page="' + p +
        '" aria-label="Page ' + p + ', juzʾ ' + c.juz + ', ' + STATE_LABEL[c.state] + '"' +
        ' title="Page ' + p + ' · Juzʾ ' + c.juz + ' · ' + STATE_LABEL[c.state] +
        (c.state === 'new' ? '' : ' · itqān ' + c.itqan + '%') + '"></button>');
    }
    return out.join('');
  }

  /* --------------------------------------------------------- views */

  function vDashboard(a, d) {
    var led = S.ledgerFor(d), st = S.stats(led), due = S.dueToday(led);
    var sabaq = led[S.SABAQ_PAGE];
    var open = [];
    d.submissions.forEach(function (s) {
      if (s.status === 'marked') s.errors.forEach(function (e) { open.push(e); });
    });
    var unread = d.messages.filter(function (m) { return !m.read; }).length;

    return '<div class="stat-tiles">' +
      tile('Committed to memory', st.pagesHeld + ' <small>/ ' + S.PAGES + ' pages</small>',
           st.juzHeld + ' juzʾ complete · ' + st.pctHeld + '% of the muṣḥaf') +
      tile('Average itqān', st.avgItqan + '<small>%</small>', st.itqanPages + ' pages at examination standard') +
      tile('Due for murājaʿah', String(st.due), 'Pages past their interval today') +
      tile('Unbroken days', String(d.streak), unread ? unread + ' unread message' + (unread > 1 ? 's' : '') : 'Attendance recorded today') +
    '</div>' +

    '<div class="riwaq-triad">' +
      triad('Sabaq', 'اليوم', 'Page ' + S.SABAQ_PAGE + ' · Juzʾ ' + sabaq.juz,
        'Today’s new portion. Recite to your teacher before Fajr tomorrow.', sabaq.itqan, 'sabaq') +
      triad('Sabqi', 'القريب', 'Juzʾ 7–9', 'Recent memorisation, revisited daily until it settles.', 74, 'sabqi') +
      triad('Manzil', 'البعيد', due.length + ' pages due',
        'The older portion, on its own cycle. The scheduler chooses today’s.', 88, 'manzil') +
    '</div>' +

    '<div class="app-grid">' +
      '<div class="panel"><div class="panel__head"><h2>Today’s murājaʿah</h2>' +
        '<a href="#muraja" data-view="muraja">Open the scheduler</a></div>' +
        (due.length ? due.slice(0, 5).map(function (p) {
          return '<div class="class-row"><div class="class-row__when">Juzʾ<strong>' + p.juz + '</strong></div>' +
            '<div class="class-row__body"><h3>Page ' + p.page + '</h3><span>Last recited ' + p.since +
            ' days ago · interval ' + S.interval(p) + ' days · itqān ' + p.itqan + '%</span></div>' +
            (canWrite() ? '<button class="btn btn--outline" data-open-page="' + p.page + '">Recite</button>' : '') +
          '</div>';
        }).join('') : '<p class="riwaq-empty">Nothing is past its interval today.</p>') +
      '</div>' +

      '<div class="panel"><div class="panel__head"><h2>Corrections outstanding</h2>' +
        '<a href="#corrections" data-view="corrections">The full ledger</a></div>' +
        (open.length ? open.slice(0, 5).map(function (c) {
          return '<div class="riwaq-corr"><span class="riwaq-corr__kind is-' + c.kind + '">' +
            esc(kindLabel(c.kind)) + '</span><div><strong>' + esc(c.ayah) + '</strong><span>' +
            esc(c.note) + '</span></div></div>';
        }).join('') : '<p class="riwaq-empty">No corrections outstanding.</p>') +
      '</div>' +
    '</div>' +

    '<div class="panel"><div class="panel__head"><h2>Progress</h2>' +
      '<span class="riwaq-quiet">' + d.history.length + ' recorded days</span></div>' + chart(d.history) + '</div>';
  }

  function kindLabel(k) {
    var f = S.ERROR_KINDS.filter(function (x) { return x.key === k; })[0];
    return f ? f.label : k;
  }

  function triad(name, ar, scope, desc, pct, kind) {
    return '<div class="triad is-' + kind + '"><div class="triad__head">' +
      '<span class="triad__name">' + name + '</span>' +
      '<span class="triad__ar" lang="ar" dir="rtl">' + ar + '</span></div>' +
      '<p class="triad__scope">' + scope + '</p><p class="triad__desc">' + desc + '</p>' + meter(pct) + '</div>';
  }

  var ledgerFilter = '';

  function vHifz(a, d) {
    var led = S.ledgerFor(d), st = S.stats(led);
    var rows = [];
    for (var j = 1; j <= 30; j++) {
      var r = S.juzRange(j), pg = led.slice(r.from, r.to + 1);
      var held = pg.filter(function (p) { return p.state !== 'new'; });
      var avg = held.length ? Math.round(held.reduce(function (x, p) { return x + p.itqan; }, 0) / held.length) : 0;
      var pct = Math.round((held.length / pg.length) * 100);
      rows.push('<tr><th scope="row">Juzʾ ' + j + '</th><td>' + r.from + '&ndash;' + r.to + '</td>' +
        '<td>' + held.length + ' / ' + pg.length + '</td><td class="riwaq-meter">' + meter(pct) + '</td>' +
        '<td>' + (avg ? avg + '%' : '&mdash;') + '</td><td>' +
        (pct === 100 && avg >= 92 ? pill('Itqān', 'good') : pct === 100 ? pill('Held', 'progress')
          : pct > 0 ? pill('In progress', 'progress') : pill('Not begun', 'muted')) + '</td></tr>');
    }

    return '<div class="panel"><div class="panel__head"><h2>The Ḥifẓ Ledger</h2>' +
      '<span class="riwaq-quiet">' + st.pagesHeld + ' of ' + S.PAGES + ' pages</span></div>' +
      '<p class="riwaq-lede">Every page of the muṣḥaf, in the state it is actually held in. ' +
        'A page is not finished when it has been memorised — it is finished when it holds at ' +
        'examination standard.' + (canWrite() ? ' Select any page to see its history and record a recital.' : '') + '</p>' +
      '<div class="riwaq-jump"><label for="lg-jump">Find a page or juzʾ</label>' +
        '<input id="lg-jump" type="search" inputmode="numeric" placeholder="e.g. 166, or 9 for the juzʾ" ' +
        'value="' + esc(ledgerFilter) + '" data-ledger-filter>' +
        (ledgerFilter ? '<button type="button" class="btn btn--outline" data-ledger-clear>Clear</button>' : '') +
      '</div>' +
      '<div class="mushaf' + (ledgerFilter ? ' is-filtered' : '') + '">' + mushafGrid(led, ledgerFilter) + '</div>' +
      '<div class="mushaf__key">' + ['sabaq', 'sabqi', 'manzil', 'itqan', 'new'].map(function (k) {
        return '<span><i class="mushaf__pg is-' + k + '"></i>' + STATE_LABEL[k] + '</span>';
      }).join('') + '</div></div>' +

      '<div class="panel"><div class="panel__head"><h2>By juzʾ</h2></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table"><thead><tr>' +
      '<th>Juzʾ</th><th>Pages</th><th>Held</th><th>Progress</th><th>Itqān</th><th>State</th>' +
      '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div></div>' +

      '<div class="panel"><div class="panel__head"><h2>Tajwīd mastery</h2></div>' +
      '<div class="riwaq-rules">' + TAJWID.map(function (t) {
        return '<div class="riwaq-rule"><div class="riwaq-rule__head"><span>' + esc(t.rule) +
          '</span><strong>' + t.pct + '%</strong></div>' + meter(t.pct) + '</div>';
      }).join('') + '</div></div>';
  }

  /* Where a page stands in the Five Returns. A page in the manzil has
     finished the schedule and says so rather than showing "5 of 5",
     which reads as though it were still inside it. */
  function returnLabel(p) {
    if (!p || p.state === 'new') return '—';
    if (p.state === 'sabaq') return 'Not yet begun';
    if (p.state === 'sabqi') return (Math.min(p.ret || 0, 4) + 1) + ' of 5';
    return 'Complete · manzil';
  }

  function vMuraja(a, d) {
    var led = S.ledgerFor(d), due = S.dueToday(led);
    return '<div class="panel"><div class="panel__head"><h2>Murājaʿah scheduler</h2>' +
      '<span class="riwaq-quiet">' + due.length + ' pages due today</span></div>' +
      '<p class="riwaq-lede">A page in <strong>sabqī</strong> runs the <strong>Five Returns</strong> ' +
        '(Reg. 3.3) — an expanding schedule, not one interval repeated. It joins the ' +
        '<strong>manzil</strong> only on surviving the fifth, and is then sampled on the ' +
        'itqān-keyed cycle without notice. A break at any return sends the page back to the ' +
        'first: the schedule cannot be waited out.</p>' +
      '<div class="riwaq-returns">' + S.RETURNS.map(function (n, i) {
        var held = led.filter(function (p) { return p && p.state === 'sabqi' && (p.ret || 0) === i; }).length;
        return '<div class="riwaq-return"><span class="riwaq-return__no">Return ' + (i + 1) + '</span>' +
          '<strong>' + n + ' day' + (n > 1 ? 's' : '') + '</strong>' +
          '<span class="riwaq-return__n">' + held + ' page' + (held === 1 ? '' : 's') + ' waiting</span></div>';
      }).join('') + '</div>' +
      '<p class="riwaq-lede">Once a page is held, its cycle is set by itqān:</p>' +
      '<div class="riwaq-intervals">' + [[95, 21], [88, 14], [80, 7], [72, 4], [0, 2]].map(function (x) {
        return '<div class="riwaq-interval"><strong>' + (x[0] ? x[0] + '%+' : 'below 72%') +
          '</strong><span>every ' + x[1] + ' day' + (x[1] > 1 ? 's' : '') + '</span></div>';
      }).join('') + '</div></div>' +

      '<div class="panel"><div class="panel__head"><h2>Today’s queue</h2></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table"><thead><tr>' +
      '<th>Page</th><th>Juzʾ</th><th>State</th><th>Return</th><th>Itqān</th><th>Interval</th><th>Last</th><th>Overdue</th>' +
      (canWrite() ? '<th>Record</th>' : '') + '</tr></thead><tbody>' +
      (due.length ? due.slice(0, 40).map(function (p) {
        var over = p.since - S.interval(p);
        return '<tr><th scope="row">' + p.page + '</th><td>' + p.juz + '</td><td>' + STATE_LABEL[p.state] +
          '</td><td>' + returnLabel(p) + '</td><td>' + p.itqan + '%</td><td>' + S.interval(p) + 'd</td><td>' + p.since + 'd</td>' +
          '<td>' + pill(over + ' days', over > 6 ? 'critical' : 'progress') + '</td>' +
          (canWrite() ? '<td><button class="btn btn--outline btn--sm" data-open-page="' + p.page + '">Recite</button></td>' : '') +
          '</tr>';
      }).join('') : '<tr><td colspan="9">Nothing due.</td></tr>') +
      '</tbody></table></div></div>';
  }

  function vRecite(a, d) {
    return '<div class="panel"><div class="panel__head"><h2>Submit a recitation</h2></div>' +
      '<p class="riwaq-lede">Submitted recitations enter your teacher’s correction queue. ' +
        'When they are marked, the mark is applied to every page in the range and the ledger ' +
        'moves with it.</p>' +
      '<form class="riwaq-form" data-recite>' +
        '<div class="riwaq-field"><label for="rc-kind">Portion</label><select id="rc-kind">' +
          '<option>Sabaq</option><option>Sabqi</option><option>Manzil</option>' +
          '<option>Full juzʾ, for examination</option></select></div>' +
        '<div class="riwaq-field"><label for="rc-from">From page</label>' +
          '<input id="rc-from" type="number" min="1" max="604" value="' + S.SABAQ_PAGE + '" required></div>' +
        '<div class="riwaq-field"><label for="rc-to">To page</label>' +
          '<input id="rc-to" type="number" min="1" max="604" value="' + S.SABAQ_PAGE + '" required></div>' +
        '<div class="riwaq-field riwaq-field--wide"><label for="rc-note">Note to your teacher</label>' +
          '<textarea id="rc-note" rows="3" placeholder="Anything they should know before listening."></textarea></div>' +
        '<div class="riwaq-rec"><button type="button" class="btn btn--outline" data-rec-toggle>' +
          '<span data-rec-label>Start recording</span></button>' +
          '<span class="riwaq-rec__time" data-rec-time>00:00</span>' +
          '<span class="riwaq-rec__hint">Audio is timed on this device and never uploaded.</span></div>' +
        '<button type="submit" class="btn btn--gold">Submit to ' + esc(a.teacher) + '</button>' +
        '<p class="riwaq-form__status" data-recite-status role="status"></p>' +
      '</form></div>' + submissionList(d, false);
  }

  function submissionList(d, forTeacher) {
    if (!d.submissions.length) return '<div class="panel"><p class="riwaq-empty">No submissions yet.</p></div>';
    return '<div class="panel"><div class="panel__head"><h2>' +
      (forTeacher ? 'Correction queue' : 'Your submissions') + '</h2>' +
      '<span class="riwaq-quiet">' + d.submissions.filter(function (s) { return s.status === 'pending'; }).length +
      ' awaiting correction</span></div>' +
      d.submissions.map(function (s) {
        return '<div class="riwaq-sub"><div class="riwaq-sub__head">' +
          '<div><strong>' + esc(s.kind) + ' · pages ' + s.from + '&ndash;' + s.to + '</strong>' +
          '<span>' + (forTeacher ? esc(s.studentName) + ' · ' : '') + ago(s.at) +
          (s.note ? ' · “' + esc(s.note) + '”' : '') + '</span></div>' +
          (s.status === 'pending'
            ? (forTeacher ? '<button class="btn btn--gold btn--sm" data-mark="' + s.id + '">Mark</button>' : pill('Awaiting correction', 'progress'))
            : pill('Marked · itqān ' + s.itqan + '%', 'good')) +
        '</div>' +
        (s.status === 'marked' ? '<div class="riwaq-sub__body">' +
          (s.teacherNote ? '<p class="riwaq-sub__note">' + esc(s.teacherNote) + '</p>' : '') +
          (s.errors.length ? s.errors.map(function (e) {
            return '<div class="riwaq-corr"><span class="riwaq-corr__kind is-' + e.kind + '">' +
              esc(kindLabel(e.kind)) + '</span><div><strong>' + esc(e.ayah) + '</strong><span>' +
              esc(e.note) + '</span></div></div>';
          }).join('') : '<p class="riwaq-empty">No errors marked.</p>') + '</div>' : '') +
        (forTeacher && s.status === 'pending' ? markForm(s) : '') +
        '</div>';
      }).join('') + '</div>';
  }

  function markForm(s) {
    return '<form class="riwaq-mark" data-mark-form="' + s.id + '" hidden>' +
      '<div class="riwaq-form">' +
        '<div class="riwaq-field"><label for="mk-itqan-' + s.id + '">Itqān awarded (%)</label>' +
          '<input id="mk-itqan-' + s.id + '" type="number" min="0" max="100" value="80" required></div>' +
        '<div class="riwaq-field"><label for="mk-ayah-' + s.id + '">Āyah in error</label>' +
          '<input id="mk-ayah-' + s.id + '" type="text" placeholder="e.g. Al-Tawbah 9:41"></div>' +
        '<div class="riwaq-field"><label for="mk-kind-' + s.id + '">Kind</label>' +
          '<select id="mk-kind-' + s.id + '">' + S.ERROR_KINDS.map(function (k) {
            return '<option value="' + k.key + '">' + k.label + '</option>'; }).join('') + '</select></div>' +
        '<div class="riwaq-field riwaq-field--wide"><label for="mk-note-' + s.id + '">Note to the student</label>' +
          '<textarea id="mk-note-' + s.id + '" rows="2" placeholder="What to do before the next sitting."></textarea></div>' +
        '<button type="submit" class="btn btn--gold">Return marked</button>' +
      '</div></form>';
  }

  function vCorrections(a, d) {
    var all = [];
    d.submissions.forEach(function (s) {
      if (s.status === 'marked') s.errors.forEach(function (e) {
        all.push(Object.assign({}, e, { at: s.markedAt || s.at }));
      });
    });
    var counts = {};
    all.forEach(function (c) { counts[c.kind] = (counts[c.kind] || 0) + 1; });

    return '<div class="panel"><div class="panel__head"><h2>Correction ledger</h2>' +
      '<span class="riwaq-quiet">' + all.length + ' marked</span></div>' +
      '<p class="riwaq-lede">Every correction marked by a teacher, by āyah and by kind. The ' +
        'categories are the ones a muṣaḥḥiḥ uses, which is what makes the pattern legible: six ' +
        'ḥarakah slips is a different problem from six hesitations.</p>' +
      '<div class="riwaq-kinds">' + S.ERROR_KINDS.map(function (k) {
        return '<div class="riwaq-kind is-' + k.key + '"><strong>' + (counts[k.key] || 0) + '</strong>' +
          '<span>' + esc(k.label) + '</span><small>' + esc(k.desc) + '</small></div>';
      }).join('') + '</div></div>' +
      '<div class="panel"><div class="panel__head"><h2>Marked by āyah</h2></div>' +
      (all.length ? '<div class="table-scroll"><table class="assign-table riwaq-table"><thead><tr>' +
        '<th>Āyah</th><th>Page</th><th>Kind</th><th>Note</th><th>When</th></tr></thead><tbody>' +
        all.map(function (c) {
          return '<tr><th scope="row">' + esc(c.ayah) + '</th><td>' + c.page + '</td>' +
            '<td><span class="riwaq-corr__kind is-' + c.kind + '">' + esc(kindLabel(c.kind)) + '</span></td>' +
            '<td class="riwaq-note">' + esc(c.note) + '</td><td>' + ago(c.at) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="riwaq-empty">Nothing marked yet.</p>') +
      '</div>';
  }

  function vIjazah(a, d) {
    var st = S.stats(S.ledgerFor(d));
    var steps = [
      ['Complete memorisation', st.pctHeld + '% of the muṣḥaf held', st.pctHeld],
      ['Itqān across all thirty juzʾ', 'Average ' + st.avgItqan + '% — 92% required', Math.round(st.avgItqan / 92 * 100)],
      ['Tajwīd examined', 'Diploma in Tajwīd conferred 1447 / III', 100],
      ['Complete recitation to a chain-holder', d.sittings.length + ' sitting' + (d.sittings.length === 1 ? '' : 's') + ' recorded', Math.min(100, d.sittings.length * 10)],
      ['Conferral and entry in the register', 'Instrument states the full sanad', 0]
    ];
    return '<div class="panel"><div class="panel__head"><h2>Ijāzah readiness</h2></div>' +
      '<p class="riwaq-lede">The Higher Diploma with <em>ijāzah</em> requires the complete ' +
        'Qurʾān recited to a member of faculty holding a connected chain, live and in an ' +
        'unbroken course of sittings. This tracks the conditions, not a percentage of a course.</p>' +
      '<div class="riwaq-steps">' + steps.map(function (s, i) {
        return '<div class="riwaq-step' + (s[2] >= 100 ? ' is-done' : s[2] > 0 ? ' is-active' : '') + '">' +
          '<span class="riwaq-step__n">' + ['I', 'II', 'III', 'IV', 'V'][i] + '</span>' +
          '<div><h3>' + esc(s[0]) + '</h3><p>' + esc(s[1]) + '</p>' + meter(s[2]) + '</div></div>';
      }).join('') + '</div></div>' +

      '<div class="panel"><div class="panel__head"><h2>Recitation sittings</h2></div>' +
      (canWrite() ? '<form class="riwaq-form" data-sitting>' +
        '<div class="riwaq-field"><label for="si-from">From page</label><input id="si-from" type="number" min="1" max="604" value="1" required></div>' +
        '<div class="riwaq-field"><label for="si-to">To page</label><input id="si-to" type="number" min="1" max="604" value="22" required></div>' +
        '<div class="riwaq-field riwaq-field--wide"><label for="si-note">Record of the sitting</label>' +
        '<input id="si-note" type="text" placeholder="Who heard it, and where."></div>' +
        '<button class="btn btn--outline" type="submit">Record a sitting</button></form>' : '') +
      (d.sittings.length ? '<div class="table-scroll"><table class="assign-table riwaq-table"><thead><tr>' +
        '<th>Sitting</th><th>Pages</th><th>Record</th><th>When</th></tr></thead><tbody>' +
        d.sittings.map(function (s, i) {
          return '<tr><th scope="row">' + (d.sittings.length - i) + '</th><td>' + s.from + '&ndash;' + s.to +
            '</td><td class="riwaq-note">' + esc(s.note || '&mdash;') + '</td><td>' + ago(s.at) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
        : '<p class="riwaq-empty">No sittings recorded. The complete recitation opens on completion of ḥifẓ.</p>') +
      '</div>';
  }

  function vRecord(a, d) {
    return '<div class="panel"><div class="panel__head"><h2>Academic record</h2>' +
      '<button class="btn btn--outline btn--sm" data-print>Print transcript</button></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table"><thead><tr>' +
      '<th>Code</th><th>Programme</th><th>Session</th><th>Mark</th><th>Grade</th><th>State</th>' +
      '</tr></thead><tbody>' + RECORD.map(function (r) {
        return '<tr><th scope="row">' + r.code + '</th><td>' + esc(r.title) + '</td><td>' + r.session +
          '</td><td>' + (r.mark == null ? '&mdash;' : r.mark + '%') + '</td><td>' + esc(r.grade) + '</td><td>' +
          (r.state === 'Conferred' ? pill('Conferred', 'good') : pill('In progress', 'progress')) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="riwaq-quiet" style="margin-top:16px">Marks are recorded against written and oral ' +
        'examination separately; the figure shown is the lower of the two, which is the one that ' +
        'governs the award.</p></div>';
  }

  function vMessages(a, d) {
    return '<div class="panel"><div class="panel__head"><h2>Messages</h2>' +
      '<span class="riwaq-quiet">' + d.messages.length + ' in all</span></div>' +
      (d.messages.length ? d.messages.map(function (m) {
        return '<div class="message-card' + (m.read ? '' : ' is-unread') + '">' +
          '<div class="message-card__from">' + esc(m.from) + ' · ' + ago(m.at) +
          (m.read ? '' : ' · ' + pill('New', 'progress')) + '</div>' +
          '<p>' + esc(m.body) + '</p></div>';
      }).join('') : '<p class="riwaq-empty">No messages.</p>') +
      (canWrite() ? '<form class="riwaq-form" data-message style="margin-top:18px">' +
        '<div class="riwaq-field riwaq-field--wide"><label for="ms-body">Write to your ' +
        (a.role === 'teacher' ? 'ḥalaqah' : 'teacher') + '</label>' +
        '<textarea id="ms-body" rows="2" required></textarea></div>' +
        '<button class="btn btn--outline" type="submit">Send</button></form>' : '') +
      '</div>';
  }

  function vHalaqah(a, d) {
    var pending = d.submissions.filter(function (s) { return s.status === 'pending'; });
    return '<div class="stat-tiles">' +
      tile('Students', String(HALAQAH.length), 'Two ḥalaqāt · cap of twelve each') +
      tile('Awaiting correction', String(pending.length), 'Submissions in your queue') +
      tile('Average itqān', Math.round(HALAQAH.reduce(function (x, s) { return x + s.itqan; }, 0) / HALAQAH.length) + '<small>%</small>', 'Across the ḥalaqah') +
      tile('Longest streak', Math.max.apply(null, HALAQAH.map(function (s) { return s.streak; })) + ' <small>days</small>', 'Maryam Sulaimān') +
    '</div>' +
    '<div class="panel"><div class="panel__head"><h2>Ḥalaqah roster</h2>' +
      '<span class="riwaq-quiet">Ḥalaqah al-Fajr · 07:00 WAT</span></div>' +
      '<div class="table-scroll"><table class="assign-table riwaq-table"><thead><tr>' +
      '<th>Student</th><th>Country</th><th>Juzʾ</th><th>Itqān</th><th>Streak</th><th>Record</th>' +
      '</tr></thead><tbody>' + HALAQAH.map(function (s) {
        return '<tr><th scope="row">' + esc(s.name) + '</th><td>' + esc(s.country) + '</td><td>' + s.juz +
          '</td><td>' + s.itqan + '%</td><td>' + s.streak + 'd</td><td>' +
          (s.email ? pill('Live record', 'good') : pill('Roster only', 'muted')) + '</td></tr>';
      }).join('') + '</tbody></table></div></div>' +
      submissionList(d, true);
  }

  function vSettings(a, d) {
    var s = session();
    return '<div class="panel"><div class="panel__head"><h2>Your account</h2></div>' +
      '<div class="riwaq-kv">' + [
        ['Name', a.name], ['Reference', a.ref],
        ['Role', { student: 'Student', teacher: 'Member of faculty', guardian: 'Guardian', registrar: 'Registry' }[a.role]],
        ['Programme', a.programme], ['Mode', a.mode], ['Ḥalaqah', a.halaqah],
        ['Enrolled', a.enrolled], ['Country', a.country]
      ].map(function (r) {
        return '<div class="riwaq-kv__row"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
      }).join('') + '</div></div>' +

      '<div class="panel"><div class="panel__head"><h2>Your data</h2></div>' +
      '<p class="riwaq-lede">This portal has no server, so your record lives on this device ' +
        'alone. That is a real limitation, and the honest answer to it is to hand you the data: ' +
        'export it, carry it, put it back.</p>' +
      '<div class="btn-row">' +
        '<button class="btn btn--outline" data-export>Export record (JSON)</button>' +
        '<button class="btn btn--outline" data-import-open>Import a record</button>' +
        '<button class="btn btn--outline" data-reset>Reset to the seeded record</button>' +
      '</div>' +
      '<form class="riwaq-form" data-import-form hidden style="margin-top:16px">' +
        '<div class="riwaq-field riwaq-field--wide"><label for="im-json">Paste an exported record</label>' +
        '<textarea id="im-json" rows="5" required></textarea></div>' +
        '<button class="btn btn--gold" type="submit">Import</button></form>' +
      '<p class="riwaq-form__status" data-data-status role="status"></p>' +
      '<p class="riwaq-quiet" style="margin-top:14px">Record format v' + S.VERSION +
        ' · ' + Object.keys(d.delta).length + ' pages changed from the seeded state · ' +
        d.submissions.length + ' submissions · ' + d.attendance.length + ' days attended.</p>' +
      '</div>' +

      '<div class="panel"><div class="panel__head"><h2>Session</h2></div>' +
      '<p class="riwaq-lede">Signed in as ' + esc(s.email) + ' on this device only.</p>' +
      '<button class="btn btn--outline" data-signout>Sign out</button></div>';
  }

  function vWard(a, d) {
    var led = S.ledgerFor(d), st = S.stats(led);
    return '<div class="preview-banner" style="position:static;margin-bottom:18px">Read-only. A ' +
      'guardian sees the ward’s record and cannot alter it.</div>' +
      '<div class="stat-tiles">' +
      tile('Committed to memory', st.pagesHeld + ' <small>/ ' + S.PAGES + '</small>', st.juzHeld + ' juzʾ complete') +
      tile('Average itqān', st.avgItqan + '<small>%</small>', st.itqanPages + ' pages at standard') +
      tile('Attendance', d.streak + ' <small>days</small>', 'Unbroken') +
      tile('Due for murājaʿah', String(st.due), 'Pages past interval') +
      '</div>' +
      '<div class="panel"><div class="panel__head"><h2>Yūsuf Ibrāhīm — progress</h2></div>' + chart(d.history) + '</div>' +
      vRecord(a, d);
  }

  function vCohort(a, d) {
    var led = S.ledgerFor(d), st = S.stats(led);
    return '<div class="stat-tiles">' +
      tile('Enrolled students', '148', 'Across four faculties') +
      tile('Ḥalaqāt running', '14', 'Cap of twelve each') +
      tile('Supported places', '31 <small>/ 148</small>', '21% of the cohort') +
      tile('Awards conferred', '86', 'This session') +
      '</div>' +
      '<div class="panel"><div class="panel__head"><h2>Registry view — sample record</h2>' +
        '<span class="riwaq-quiet">DAR-S-1448-0412</span></div>' +
        '<p class="riwaq-lede">The registry holds no ledger of its own; it reads the student’s. ' +
          'Shown here is the live record of Yūsuf Ibrāhīm — ' + st.pagesHeld + ' pages held, ' +
          'average itqān ' + st.avgItqan + '%.</p>' + chart(d.history) + '</div>' +
      vRecord(a, d);
  }

  /* --------------------------------------------------- page drawer */

  var drawerPage = null;

  function drawer(d) {
    if (!drawerPage) return '';
    var led = S.ledgerFor(d), p = led[drawerPage];
    if (!p) return '';
    return '<div class="drawer" data-drawer><div class="drawer__panel crystal" role="dialog" aria-modal="true" aria-label="Page ' + p.page + '">' +
      '<button class="drawer__close" data-drawer-close aria-label="Close">&times;</button>' +
      '<span class="drawer__kicker">Juzʾ ' + p.juz + '</span>' +
      '<h2 class="drawer__title">Page ' + p.page + '</h2>' +
      '<div class="drawer__stats">' +
        '<div><dt>State</dt><dd>' + STATE_LABEL[p.state] + '</dd></div>' +
        '<div><dt>Itqān</dt><dd>' + (p.state === 'new' ? '—' : p.itqan + '%') + '</dd></div>' +
        '<div><dt>Interval</dt><dd>' + (p.state === 'new' ? '—' : S.interval(p) + ' days') + '</dd></div>' +
        '<div><dt>Five Returns</dt><dd>' + returnLabel(p) + '</dd></div>' +
        '<div><dt>Last recited</dt><dd>' + (p.since == null ? '—' : p.since + ' days ago') + '</dd></div>' +
        '<div><dt>Recitals</dt><dd>' + (p.recitals || 0) + '</dd></div>' +
      '</div>' +
      (canWrite() ? '<p class="drawer__ask">How did the recital go?</p>' +
        '<div class="drawer__acts">' +
          '<button class="btn btn--gold" data-recite-page="clean">Clean</button>' +
          '<button class="btn btn--outline" data-recite-page="minor">Minor slips</button>' +
          '<button class="btn btn--outline" data-recite-page="broken">Broke</button>' +
        '</div>' +
        '<p class="drawer__note">A clean recital adds 7 to itqān, minor slips 3, a break takes 6 ' +
          'away. A clean or nearly clean hearing also advances the page one of the Five Returns; ' +
          'a break returns it to the first and, if it had been held, back into sabqī. The revision ' +
          'clock resets either way and the interval is recomputed.</p>'
        : '<p class="drawer__note">Read-only.</p>') +
      '</div></div>';
  }

  /* ------------------------------------------------------ the shell */

  var NAV = {
    student: [['dashboard', 'Today', 'i-compass'], ['hifz', 'Ḥifẓ Ledger', 'i-mushaf'],
      ['muraja', 'Murājaʿah', 'i-progress'], ['recite', 'Recitation', 'i-waveform'],
      ['corrections', 'Corrections', 'i-quill'], ['ijazah', 'Ijāzah', 'i-sanad'],
      ['record', 'Record', 'i-ledger'], ['messages', 'Messages', 'i-envelope'],
      ['settings', 'Account', 'i-key']],
    teacher: [['halaqah', 'My Ḥalaqah', 'i-columns'], ['corrections', 'Corrections', 'i-quill'],
      ['hifz', 'Ḥifẓ Ledger', 'i-mushaf'], ['muraja', 'Murājaʿah', 'i-progress'],
      ['record', 'Records', 'i-ledger'], ['messages', 'Messages', 'i-envelope'],
      ['settings', 'Account', 'i-key']],
    guardian: [['ward', 'My Ward', 'i-compass'], ['hifz', 'Ḥifẓ Ledger', 'i-mushaf'],
      ['corrections', 'Corrections', 'i-quill'], ['messages', 'Messages', 'i-envelope'],
      ['settings', 'Account', 'i-key']],
    registrar: [['cohort', 'Cohort', 'i-columns'], ['record', 'Records', 'i-ledger'],
      ['hifz', 'Ḥifẓ Ledger', 'i-mushaf'], ['settings', 'Account', 'i-key']]
  };

  var VIEWS = {
    dashboard: vDashboard, hifz: vHifz, muraja: vMuraja, recite: vRecite,
    corrections: vCorrections, ijazah: vIjazah, record: vRecord, messages: vMessages,
    halaqah: vHalaqah, settings: vSettings, ward: vWard, cohort: vCohort
  };

  var current = null;

  function signInScreen() {
    var demo = [
      ['yusuf@daralrusukh.com', 'Student', 'Full ledger, scheduler, recitation'],
      ['teacher@daralrusukh.com', 'Member of faculty', 'Ḥalaqah roster and marking'],
      ['guardian@daralrusukh.com', 'Guardian', 'Read-only view of a ward'],
      ['registry@daralrusukh.com', 'Registry', 'Cohort and records']
    ];
    return '<div class="signin"><div class="signin__panel crystal">' +
      '<svg class="signin__crest" viewBox="0 0 64 64" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="30.5" fill="none" stroke="currentColor" stroke-width="1"/>' +
      '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">' +
      '<rect x="14" y="14" width="36" height="36"/><rect x="14" y="14" width="36" height="36" transform="rotate(45 32 32)"/></g>' +
      '<circle cx="32" cy="32" r="8" fill="currentColor" opacity=".2"/></svg>' +
      '<h1 class="signin__title">The Riwāq</h1>' +
      '<p class="signin__sub">Dār al-Rusūkh · learning portal</p>' +
      '<form data-signin>' +
        '<div class="riwaq-field"><label for="si-email">Email</label>' +
        '<input id="si-email" type="email" autocomplete="username" required></div>' +
        '<div class="riwaq-field"><label for="si-pass">Password</label>' +
        '<input id="si-pass" type="password" autocomplete="current-password" required></div>' +
        '<button class="btn btn--gold" type="submit">Sign in</button>' +
        '<p class="signin__error" data-signin-error role="alert"></p></form>' +
      '<div class="signin__demo"><p class="signin__demo-h">Demonstration accounts · password <code>riwaq</code></p>' +
        demo.map(function (x) {
          return '<button type="button" class="signin__as" data-as="' + x[0] + '">' +
            '<strong>' + x[1] + '</strong><span>' + x[0] + '</span>' +
            '<em>' + x[2] + '</em></button>';
        }).join('') + '</div>' +
      '<p class="signin__note">This portal runs entirely in your browser. No credential is ' +
        'checked against any server and nothing you record leaves this device — but everything ' +
        'you do here is real and persists: recitations move the ledger, submissions are marked, ' +
        'and the record is yours to export.</p>' +
      '</div></div>';
  }

  function appScreen(a, d) {
    var nav = NAV[a.role];
    if (!current || !nav.some(function (n) { return n[0] === current; })) current = nav[0][0];
    var unread = d.messages.filter(function (m) { return !m.read; }).length;

    return '<div class="preview-banner">The Riwāq is a working demonstration. It persists on ' +
      'this device, holds no real record, and issues nothing.</div>' +
      '<div class="app-shell"><aside class="app-sidebar">' +
      '<div class="app-sidebar__brand"><a href="/rusukh/">Dār al-Rusūkh</a><span>The Riwāq</span></div>' +
      '<nav class="app-nav">' + nav.map(function (n) {
        return '<a href="#' + n[0] + '" data-view="' + n[0] + '"' + (n[0] === current ? ' aria-current="page"' : '') + '>' +
          '<svg class="icon" aria-hidden="true"><use href="#' + n[2] + '"/></svg>' + n[1] +
          (n[0] === 'messages' && unread ? '<span class="app-nav__badge">' + unread + '</span>' : '') + '</a>';
      }).join('') + '</nav>' +
      '<div class="app-sidebar__foot"><button class="btn btn--outline" data-signout>Sign out</button></div>' +
      '</aside><main class="app-main"><div class="app-topline">' +
      '<div class="app-student"><div class="app-student__avatar">' + esc(a.initials) + '</div>' +
      '<div><div class="app-student__name">' + esc(a.name) + '</div>' +
      '<div class="app-student__level">' + esc(a.programme) + ' · ' + esc(a.ref) + '</div></div></div>' +
      '<div class="app-topline__right"><span class="riwaq-quiet" data-hijri-long></span></div></div>' +
      (VIEWS[current] || VIEWS.dashboard)(a, d) + '</main></div>' + drawer(d);
  }

  function render() {
    var host = $('[data-riwaq]');
    if (!host) return;
    var a = account();
    if (!a) { host.innerHTML = signInScreen(); return; }
    var d = load();
    if (current === 'messages') S.actions.readMessages(d);
    host.innerHTML = appScreen(a, d);
    if (window.__rusukhDates) window.__rusukhDates();
    if (window.__rusukhFigures) window.__rusukhFigures(host);
  }

  function status(sel, msg, ok) {
    var el = $(sel);
    if (!el) return;
    el.textContent = msg;
    el.className = 'riwaq-form__status' + (ok ? ' is-ok' : '');
  }

  /* ------------------------------------------------------- events */

  document.addEventListener('click', function (e) {
    var host = $('[data-riwaq]');
    if (!host) return;
    var t = e.target;

    var as = t.closest('[data-as]');
    if (as) { $('#si-email').value = as.dataset.as; $('#si-pass').value = 'riwaq'; return; }

    var nav = t.closest('[data-view]');
    if (nav && host.contains(nav)) { e.preventDefault(); current = nav.dataset.view; drawerPage = null; render(); return; }

    if (t.closest('[data-signout]')) {
      e.preventDefault();
      try { localStorage.removeItem(S.SESSION_KEY); } catch (x) {}
      current = null; drawerPage = null; render(); return;
    }

    var op = t.closest('[data-open-page]');
    if (op) { e.preventDefault(); drawerPage = +op.dataset.openPage; render(); return; }

    var pg = t.closest('.mushaf__pg[data-page]');
    if (pg) { drawerPage = +pg.dataset.page; render(); return; }

    if (t.closest('[data-drawer-close]') || (t.classList && t.classList.contains('drawer'))) {
      drawerPage = null; render(); return;
    }

    var rp = t.closest('[data-recite-page]');
    if (rp && drawerPage) {
      S.actions.recite(load(), drawerPage, rp.dataset.recitePage);
      // Close on record. Leaving it open sat a full-screen overlay over
      // the queue the recital had just changed, so the next page could
      // not be clicked — and the whole point of the queue is that you
      // work down it.
      drawerPage = null;
      render(); return;
    }

    var mk = t.closest('[data-mark]');
    if (mk) {
      var f = $('[data-mark-form="' + mk.dataset.mark + '"]');
      if (f) { f.hidden = !f.hidden; if (!f.hidden) f.querySelector('input').focus(); }
      return;
    }

    if (t.closest('[data-ledger-clear]')) { ledgerFilter = ''; render(); return; }
    if (t.closest('[data-import-open]')) { var im = $('[data-import-form]'); if (im) im.hidden = !im.hidden; return; }
    if (t.closest('[data-print]')) { window.print(); return; }

    if (t.closest('[data-export]')) {
      var json = S.exportJSON(dataEmail());
      var ta = document.createElement('textarea');
      ta.value = json; ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:-1000px';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (x) {}
      document.body.removeChild(ta);
      status('[data-data-status]', ok
        ? 'Record copied to the clipboard — ' + json.length.toLocaleString() + ' characters. Paste it somewhere safe.'
        : 'Copying was blocked. Open the browser console and run RiwaqStore.exportJSON("' + dataEmail() + '").', ok);
      return;
    }

    if (t.closest('[data-reset]')) {
      if (!confirm('Reset this record to the seeded state? Everything you have recorded will be lost.')) return;
      S.reset(dataEmail()); drawerPage = null; render(); return;
    }

    var rec = t.closest('[data-rec-toggle]');
    if (rec) {
      var label = $('[data-rec-label]'), time = $('[data-rec-time]');
      if (rec.dataset.on) {
        clearInterval(rec._t); delete rec.dataset.on;
        label.textContent = 'Start recording'; rec.classList.remove('is-recording');
      } else {
        rec.dataset.on = '1'; var n = 0;
        label.textContent = 'Stop recording'; rec.classList.add('is-recording');
        rec._t = setInterval(function () { n++; time.textContent = pad2((n / 60) | 0) + ':' + pad2(n % 60); }, 1000);
      }
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.matches('[data-ledger-filter]')) {
      ledgerFilter = e.target.value.trim();
      var led = S.ledgerFor(load());
      var grid = $('.mushaf');
      if (grid) {
        grid.innerHTML = mushafGrid(led, ledgerFilter);
        grid.classList.toggle('is-filtered', Boolean(ledgerFilter));
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawerPage) { drawerPage = null; render(); }
  });

  document.addEventListener('submit', function (e) {
    var f = e.target;

    if (f.matches('[data-signin]')) {
      e.preventDefault();
      var email = $('#si-email').value.trim().toLowerCase(), pass = $('#si-pass').value;
      var acc = ACCOUNTS[email];
      if (!acc || acc.pass !== pass) {
        $('[data-signin-error]').textContent = 'That email and password do not match a demonstration account.';
        return;
      }
      try { localStorage.setItem(S.SESSION_KEY, JSON.stringify({ email: email, role: acc.role, at: Date.now() })); } catch (x) {}
      current = NAV[acc.role][0][0];
      render(); return;
    }

    if (f.matches('[data-recite]')) {
      e.preventDefault();
      var from = +$('#rc-from').value, to = +$('#rc-to').value;
      if (to < from) { status('[data-recite-status]', 'The last page cannot come before the first.', false); return; }
      S.actions.submit(load(), {
        student: dataEmail(), studentName: account().name, kind: $('#rc-kind').value,
        from: from, to: to, note: $('#rc-note').value.trim()
      });
      render();
      status('[data-recite-status]', 'Submitted. It is now in your teacher’s correction queue — sign in as the teacher to mark it.', true);
      return;
    }

    var mf = f.matches('[data-mark-form]') ? f : null;
    if (mf) {
      e.preventDefault();
      var id = mf.dataset.markForm;
      var ayah = $('#mk-ayah-' + id).value.trim();
      var errs = ayah ? [{
        ayah: ayah, page: +$('#rc-from') ? 0 : 0, kind: $('#mk-kind-' + id).value,
        note: $('#mk-note-' + id).value.trim() || 'Marked in the sitting.'
      }] : [];
      var d0 = load();
      var sub = d0.submissions.filter(function (x) { return x.id === id; })[0];
      if (sub && errs.length) errs[0].page = sub.from;
      S.actions.mark(d0, id, {
        itqan: Math.max(0, Math.min(100, +$('#mk-itqan-' + id).value)),
        note: $('#mk-note-' + id).value.trim(), errors: errs
      });
      render(); return;
    }

    if (f.matches('[data-message]')) {
      e.preventDefault();
      var body = $('#ms-body').value.trim();
      if (!body) return;
      S.actions.message(load(), account().name, body);
      render(); return;
    }

    if (f.matches('[data-sitting]')) {
      e.preventDefault();
      S.actions.sitting(load(), { from: +$('#si-from').value, to: +$('#si-to').value, note: $('#si-note').value.trim() });
      render(); return;
    }

    if (f.matches('[data-import-form]')) {
      e.preventDefault();
      try {
        S.importJSON(dataEmail(), $('#im-json').value);
        render();
        status('[data-data-status]', 'Record imported.', true);
      } catch (x) {
        status('[data-data-status]', 'That is not a readable record: ' + x.message, false);
      }
      return;
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();
