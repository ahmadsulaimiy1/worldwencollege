/* WEC-LC — My Engagement.
 *
 * The interface for GET /api/student/attendance. Item 4 of the
 * interface backlog: "The week-by-week grid, the evidence behind every
 * state, and the platform's own reading beside any staff correction."
 *
 * ─────────────────────────────────────────────────────────────────────
 * ABSENT IS NOT DRAWN AS FAILURE
 * ─────────────────────────────────────────────────────────────────────
 * The instrument is explicit: engagement is "not a mark", "not a
 * condition of any award", "never a penalty", and an empty window is "a
 * description, not a penalty". A grid that painted those windows in the
 * red every other interface reserves for failure would contradict the
 * sentence printed directly above it — so `absent` takes the quietest
 * ink on the page and what is emphasised is what the College DID see.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE NOTICE IS NOT OPTIONAL
 * ─────────────────────────────────────────────────────────────────────
 * `engagementNotice` is a required field of every payload this module
 * produces, "not behind a flag, not summarised, and not left to a
 * template to remember". It is rendered whole, first, with both of its
 * lists — what the state was measured by and what it is not.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A CORRECTION NEVER CONCEALS WHAT IT CORRECTED
 * ─────────────────────────────────────────────────────────────────────
 * Where a person has written a state, `derived` carries the platform's
 * own current reading of the same window. Both are shown on the cell,
 * and every corrected cell is gathered into a section of its own. A
 * record that replaced a machine's reading with a person's, silently,
 * would be unarguable — and this one is meant to be argued with.
 *
 * Every value reaches the page through textContent.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';

  var T = AR ? {
    loading: 'جارٍ تحميل سجلّ مشاركتك…',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'سجلُّ مشاركتك خاصٌّ بك. سجّل الدخول لتراه.',
    failed: 'تعذّر تحميل سجلّ مشاركتك.',
    failedRest: 'هذا خللٌ عندنا. أعد المحاولة بعد قليل.',
    ready: 'سجلُّ مشاركتك.',
    readyRest: 'ما بلغ الكلّية، أسبوعًا أسبوعًا.',
    states: { attended: 'بلغَها عمل', partial: 'دون الحدّ', absent: 'لم يبلغها عمل', excused: 'مرفوعٌ بعذر' },
    measuredHead: 'يُقاس بـ',
    isNotHead: 'وما هو ليس به',
    windowNote: function (d, n, a) {
      return 'نافذةٌ من ' + d + ' أيّام، مربوطةٌ ببدء تسجيلك في ' + a + '. المعروض: ' + n + ' نافذة.';
    },
    noWindows: 'لا نوافذَ بعد.',
    provisional: 'هذه النافذة لم تُغلَق بعد، والحال فيها مبدئيّة.',
    module: 'الوحدة',
    week: function (n) { return 'الأسبوع ' + n; },
    span: function (a, b) { return a + ' — ' + b; },
    evidence: 'الدليل الذي قُرئت منه هذه الحال',
    noEvidence: 'لم يبلغ الكلّيةَ في هذه النافذة عملٌ على هذه الوحدة. وهذا وصفٌ لما بلغها، لا حكمٌ على ما فعلتَه.',
    counts: 'يُحتسَب',
    reported: 'مذكورٌ ولا يُحتسَب',
    overrideHead: 'حالٌ كتبتها الكلّية',
    overrideLine: function (via) { return 'سُجِّلت عن طريق: ' + via + '.'; },
    overrideReason: function (r) { return 'والسبب المذكور: ' + r; },
    overrideDerived: function (s) { return 'وقراءة المنصّة نفسها لهذه النافذة: ' + s + '. وهي باقيةٌ في السجلّ، فالتصحيح لا يخفي ما صحّحه.'; },
    correctionsLede: function (n) {
      return n === 0
        ? 'لم يكتب أحدٌ حالًا بيده في هذا المدى؛ فكلُّ حالٍ أعلاه قراءةُ المنصّة نفسها.'
        : 'في هذا المدى ' + n + ' حالٍ كتبها إنسان. وقراءةُ المنصّة لكلٍّ منها باقيةٌ إلى جانبها.';
    },
    via: {
      platform_signal: 'إشارة المنصّة',
      staff_register: 'كشفٌ من عضو هيئة',
      learner_declaration: 'إقرارٌ من المتعلّم',
    },
    liveRecorded: function (s) { return 'سُجِّل: ' + s; },
    liveNotRecorded: 'لم يُؤخَذ لهذه الحصّة كشف.',
    minutes: function (n) { return n + ' دقيقة'; },
    limitSource: function (s) { return 'المصدر: ' + s; },
    noEnrolment: 'لا تسجيلَ بعد، فلا تاريخَ تُربط به نافذة.',
  } : {
    loading: 'Loading your engagement record…',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your engagement record is private to you. Sign in to see it.',
    failed: 'Your engagement record could not be loaded.',
    failedRest: 'This is a fault on our side. Please try again shortly.',
    ready: 'Your engagement record.',
    readyRest: 'What reached the College, week by week.',
    states: { attended: 'Work reached', partial: 'Below the threshold', absent: 'Nothing reached', excused: 'Set aside' },
    measuredHead: 'Measured by',
    isNotHead: 'What it is not',
    windowNote: function (d, n, a) {
      return 'A ' + d + '-day window, anchored to the day your enrolment started, ' + a + '. Showing ' + n + '.';
    },
    noWindows: 'No windows yet.',
    provisional: 'This window has not closed, so the state in it is provisional.',
    module: 'Module',
    week: function (n) { return 'Week ' + n; },
    span: function (a, b) { return a + ' — ' + b; },
    evidence: 'The evidence this state was read from',
    noEvidence: 'No work on this module reached the College in this window. That describes what reached it, not what you did.',
    counts: 'Counts',
    reported: 'Reported, not counted',
    overrideHead: 'A state written by the College',
    overrideLine: function (via) { return 'Recorded via: ' + via + '.'; },
    overrideReason: function (r) { return 'The reason given: ' + r; },
    overrideDerived: function (s) { return 'The platform’s own reading of the same window: ' + s + '. It stays on the record, because a correction does not conceal what it corrected.'; },
    correctionsLede: function (n) {
      return n === 0
        ? 'Nobody has written a state by hand in this window. Every state above is the platform’s own reading.'
        : n + ' state' + (n === 1 ? ' has' : 's have') + ' been written by a person in this window. The platform’s reading of each stays beside it.';
    },
    via: {
      platform_signal: 'a platform signal',
      staff_register: 'a register taken by staff',
      learner_declaration: 'a declaration by the learner',
    },
    liveRecorded: function (s) { return 'Recorded: ' + s; },
    liveNotRecorded: 'No register was taken for this session.',
    minutes: function (n) { return n + ' minutes'; },
    limitSource: function (s) { return 'Source: ' + s; },
    noEnrolment: 'No enrolment yet, so there is no start date to anchor a window to.',
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  function when(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  var authHeaders = {};

  function api(path, opts) {
    var o = opts || {};
    o.headers = Object.assign({ Accept: 'application/json' }, authHeaders, o.headers || {});
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

  var weeks = 8;
  var cellsById = {};
  var stateName = function (s) { return T.states[s] || s || ''; };
  var viaName = function (v) { return T.via[v] || v || ''; };

  /* ── THE NOTICE ──────────────────────────────────────────────────── */

  function renderNotice(n) {
    if (!n) return;
    $('#secNotice').hidden = false;
    $('[data-notice-label]').textContent = n.label || '';
    $('[data-notice-statement]').textContent = n.statement || '';
    $('[data-measured-head]').textContent = T.measuredHead;
    $('[data-isnot-head]').textContent = T.isNotHead;

    var m = $('[data-measured]');
    m.textContent = '';
    (n.measuredBy || []).forEach(function (x) {
      var li = el('li');
      li.appendChild(el('span', 'eng-notice__item', x.label || ''));
      // The source travels with the clause. Two of the five measures are
      // named by the framework rather than by the regulations
      // instrument, and the payload keeps them apart rather than filing
      // one under a clause that does not cover it.
      li.appendChild(el('span', 'eng-notice__source', x.source || ''));
      m.appendChild(li);
    });

    var not = $('[data-isnot]');
    not.textContent = '';
    (n.isNot || []).forEach(function (x) {
      not.appendChild(el('li', null, x.label || ''));
    });
  }

  /* ── THE KEY ─────────────────────────────────────────────────────── */

  function renderKey(meanings) {
    var key = $('[data-key]');
    key.textContent = '';
    ['attended', 'partial', 'excused', 'absent'].forEach(function (s) {
      var li = el('li', 'eng-key__item');
      li.setAttribute('data-state', s);
      li.appendChild(el('span', 'eng-swatch'));
      li.lastChild.setAttribute('aria-hidden', 'true');
      li.appendChild(el('span', 'eng-key__label', stateName(s)));
      if (meanings[s]) li.appendChild(el('span', 'eng-key__meaning', meanings[s]));
      key.appendChild(li);
    });
  }

  /* ── THE GRID ────────────────────────────────────────────────────── */

  /* A module per row and a window per cell, rather than the other way
     round. A learner asks "how have I been doing on the speaking
     module", which is a row; a week with eleven modules in it is a
     column nobody reads across. It is also the only shape of this grid
     that survives a 390px screen. */
  function renderGrid(d) {
    $('#secGrid').hidden = false;
    var w = d.window || {};
    $('[data-window-note]').textContent = w.days
      ? T.windowNote(w.days, w.returned || 0, when(w.anchoredOn))
      : (d.reason || '');

    var grid = $('[data-grid]');
    grid.textContent = '';
    cellsById = {};

    var mods = d.modules || [];
    var empty = $('[data-grid-empty]');
    empty.hidden = mods.length > 0;
    empty.textContent = mods.length ? '' : (d.reason || T.noWindows);
    if (!mods.length) return;

    // One header row of window ordinals, so a strip of cells can be read
    // against a week without every cell repeating the date.
    var head = el('li', 'eng-row eng-row--head');
    head.appendChild(el('span', 'eng-row__title', T.module));
    var strip = el('span', 'eng-row__strip');
    (mods[0].windows || []).forEach(function (win) {
      var h = el('span', 'eng-colhead', String(win.ordinal));
      h.title = T.span(when(win.start), when(win.end));
      strip.appendChild(h);
    });
    head.appendChild(strip);
    grid.appendChild(head);

    mods.forEach(function (mod) {
      var li = el('li', 'eng-row');
      li.appendChild(el('span', 'eng-row__title', mod.title || ''));
      var s = el('span', 'eng-row__strip');
      (mod.windows || []).forEach(function (win) {
        var id = mod.unitId + '|' + win.start;
        var full = findCell(d, mod.unitId, win.start);
        cellsById[id] = { module: mod, window: win, cell: full };
        var b = el('button', 'eng-cell');
        b.type = 'button';
        b.setAttribute('data-state', win.state);
        if (full && full.overridden) b.setAttribute('data-written', 'yes');
        if (full && full.provisional) b.setAttribute('data-provisional', 'yes');
        // The accessible name carries the whole cell: module, week and
        // state. A grid whose cells read as "button" to a screen reader
        // is a grid only a sighted learner has.
        b.setAttribute('aria-label',
          (mod.title || '') + ' · ' + T.week(win.ordinal) + ' · ' + stateName(win.state));
        b.appendChild(el('span', 'eng-cell__mark'));
        b.addEventListener('click', function () { openCell(id); });
        s.appendChild(b);
      });
      li.appendChild(s);
      li.appendChild(el('span', 'eng-row__tally', tallyText(mod.summary)));
      grid.appendChild(li);
    });
  }

  function tallyText(sum) {
    if (!sum) return '';
    return ['attended', 'partial', 'excused', 'absent']
      .filter(function (k) { return sum[k]; })
      .map(function (k) { return sum[k] + ' ' + stateName(k).toLowerCase(); })
      .join(' · ');
  }

  function findCell(d, unitId, start) {
    var win = (d.windows || []).find(function (w) { return w.start === start; });
    if (!win) return null;
    return (win.modules || []).find(function (m) { return m.unitId === unitId; }) || null;
  }

  /* ── ONE CELL ────────────────────────────────────────────────────── */

  function openCell(id) {
    var entry = cellsById[id];
    if (!entry) return;
    var c = entry.cell || {};
    var sec = $('#secCell');
    sec.hidden = false;
    sec.setAttribute('data-state', c.state || entry.window.state);

    $('[data-cell-window]').textContent = T.week(entry.window.ordinal) + ' · '
      + T.span(when(entry.window.start), when(entry.window.end));
    $('[data-cell-module]').textContent = entry.module.title || '';
    $('[data-cell-state]').textContent = stateName(c.state || entry.window.state);
    $('[data-cell-meaning]').textContent = c.meaning || '';

    var prov = $('[data-cell-provisional]');
    prov.hidden = !c.provisional;
    prov.textContent = c.provisional ? T.provisional : '';

    var ov = $('[data-cell-override]');
    ov.hidden = !c.overridden;
    if (c.overridden) {
      $('[data-override-head]').textContent = T.overrideHead;
      $('[data-override-line]').textContent = T.overrideLine(viaName(c.recordedVia));
      var reason = $('[data-override-reason]');
      reason.hidden = !c.reason;
      reason.textContent = c.reason ? T.overrideReason(c.reason) : '';
      $('[data-override-derived]').textContent = T.overrideDerived(
        stateName(c.derived && c.derived.state));
    }

    $('[data-evidence-head]').textContent = T.evidence;
    var list = $('[data-evidence]');
    list.textContent = '';
    var ev = c.evidence || [];
    var none = $('[data-evidence-empty]');
    none.hidden = ev.length > 0;
    none.textContent = ev.length ? '' : T.noEvidence;
    ev.forEach(function (e) {
      var li = el('li', 'eng-ev');
      li.setAttribute('data-counts', e.counts ? 'yes' : 'no');
      li.appendChild(el('p', 'eng-ev__statement', e.statement || ''));
      var meta = el('p', 'eng-ev__meta');
      meta.appendChild(el('span', 'eng-ev__counts', e.counts ? T.counts : T.reported));
      // The clause is printed because it is the thing to quote when
      // arguing with a state. A citation nobody can see is not one.
      if (e.clause) meta.appendChild(el('span', 'eng-ev__clause', e.clause));
      li.appendChild(meta);
      list.appendChild(li);
    });

    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── CORRECTIONS ─────────────────────────────────────────────────── */

  function renderCorrections(d) {
    $('#secCorrections').hidden = false;
    var written = [];
    (d.windows || []).forEach(function (w) {
      (w.modules || []).forEach(function (m) { if (m.overridden) written.push(m); });
    });
    $('[data-corrections-lede]').textContent = T.correctionsLede(written.length);
    // The endpoint's own sentence, not the page's: it is a claim the
    // College makes about its record, and the module publishes it in
    // both languages beside everything else it publishes.
    $('[data-corrections-note]').textContent = written.length ? (d.authoredTextNotice || '') : '';

    var list = $('[data-corrections]');
    list.textContent = '';
    written.forEach(function (c) {
      var li = el('li', 'eng-correction card edge-lit edge-lit--light aurum aurum--hover tilt gold-live');
      li.appendChild(el('span', 'tilt__sheen'));
      li.lastChild.setAttribute('aria-hidden', 'true');
      li.appendChild(el('p', 'eng-correction__where',
        (c.title || '') + ' · ' + T.span(when(c.windowStart), when(c.windowEnd))));
      var line = el('p', 'eng-correction__states');
      line.appendChild(el('span', 'eng-correction__written', stateName(c.state)));
      line.appendChild(el('span', 'eng-correction__vs', '·'));
      line.appendChild(el('span', 'eng-correction__derived',
        stateName(c.derived && c.derived.state)));
      li.appendChild(line);
      li.appendChild(el('p', 'eng-correction__via', T.overrideLine(viaName(c.recordedVia))));
      if (c.reason) li.appendChild(el('p', 'eng-correction__reason', T.overrideReason(c.reason)));
      list.appendChild(li);
    });
  }

  /* ── LIVE SESSIONS AND LIMITS ────────────────────────────────────── */

  function renderLive(d) {
    var live = d.liveSessions || {};
    $('#secLive').hidden = false;
    $('[data-live-note]').textContent = live.note || '';
    var list = $('[data-live]');
    list.textContent = '';
    (live.sessions || []).forEach(function (s) {
      var li = el('li', 'eng-live__item');
      li.setAttribute('data-recorded', s.recorded ? 'yes' : 'no');
      li.appendChild(el('p', 'eng-live__title', s.title || ''));
      li.appendChild(el('p', 'eng-live__when', when(s.startsAt)));
      li.appendChild(el('p', 'eng-live__state',
        s.recorded ? T.liveRecorded(stateName(s.state)) : (s.note || T.liveNotRecorded)));
      list.appendChild(li);
    });
  }

  function renderLimits(d) {
    $('#secLimits').hidden = false;
    var list = $('[data-limits]');
    list.textContent = '';
    (d.limitations || []).forEach(function (l) {
      var li = el('li', 'eng-limit');
      li.appendChild(el('p', 'eng-limit__statement', l.statement || ''));
      li.appendChild(el('p', 'eng-limit__source', T.limitSource(l.source || '')));
      list.appendChild(li);
    });
  }

  /* ── LOADING ─────────────────────────────────────────────────────── */

  function load() {
    state(T.loading, '');
    return api('/api/student/attendance?weeks=' + weeks
      + '&language=' + (AR ? 'ar' : 'en')).then(function (r) {
      if (r.status === 401) { state(T.signedOut, T.signedOutRest); return; }
      if (!r.ok) { state(T.failed, T.failedRest); return; }
      var d = r.data;
      renderNotice(d.engagementNotice);
      renderKey(meaningsOf(d));
      renderGrid(d);
      renderCorrections(d);
      renderLive(d);
      renderLimits(d);
      state(T.ready, T.readyRest);
      $('#scope').hidden = false;
    });
  }

  /* The meaning of each state, taken from a real cell rather than
     restated here — `STATE_MEANING` is the module's sentence and the
     page has no business writing a second one. */
  function meaningsOf(d) {
    var out = {};
    (d.windows || []).forEach(function (w) {
      (w.modules || []).forEach(function (m) {
        if (m.state && m.meaning && !out[m.state]) out[m.state] = m.meaning;
      });
    });
    return out;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var sel = $('[data-weeks]');
    if (sel) {
      sel.value = String(weeks);
      sel.addEventListener('change', function () {
        weeks = Number(sel.value) || 8;
        $('#secCell').hidden = true;
        load();
      });
    }
    $('[data-cell-close]').addEventListener('click', function () { $('#secCell').hidden = true; });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') $('#secCell').hidden = true;
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
