/* ═══════════════════════════════════════════════════════════════════
   THE APPLICATION — ten steps
   ═══════════════════════════════════════════════════════════════════

   The Founder's judgement on the first version was 0.5 out of 10, and
   it was fair: fifteen fields on one screen, two of them free text where
   a list was obviously wanted, and no way to stop half way. What an
   embassy or a bank asks for is not merely MORE — it is a form that
   knows what it is asking, offers the answer rather than demanding it be
   typed, and survives being abandoned at step six.

   So: ten steps, fifty-seven fields, 267 countries and 37 Nigerian
   states offered as lists, saved to the device at every keystroke, and
   resumable.

   THREE THINGS THIS DOES THAT A LONGER FORM ALONE WOULD NOT.

   1. IT VALIDATES A STEP AT A TIME, and names what is missing rather
      than colouring it red. A field says what is wrong beside itself; a
      colour says only that something is.

   2. IT SAVES WITHOUT BEING ASKED. Every change is written to this
      browser's own storage under one key. Nothing is uploaded — the
      Founder asked for a dashboard to finish it in, and this is the
      honest form of that until the College has a server: your own
      machine is the dashboard, and the page says which step you left at
      and when.

   3. IT COMPOSES IN FRONT OF YOU. The last step is the whole
      application in plain text, exactly as the Registry will receive it,
      before anything is sent.

   NOTHING LEAVES THE DEVICE. No network call is made by this file.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('apply-form');
  if (!form) return;

  var KEY = 'madinah.application.v1';
  var isAr = (document.documentElement.getAttribute('lang') || '').indexOf('ar') === 0;
  var steps = [].slice.call(form.querySelectorAll('[data-step]'));
  var ledger = [].slice.call(document.querySelectorAll('[data-ledger]'));
  var status = document.getElementById('apply-status');
  var savedLine = document.querySelector('[data-apply-saved]');
  var preview = form.querySelector('[data-apply-preview]');
  var at = 0;

  var T = isAr ? {
    missing: 'يلزم إتمام هذه الحقول: ',
    declare: 'أقرَّ بجميع البنود قبل الإرسال.',
    saved: 'محفوظ على هذا الجهاز · الخطوة ',
    of: ' من ',
    copied: 'نُسخ الطلب.',
    copyFail: 'تعذّر النسخ. حدِّد النص وانسخه يدويًا.',
    opened: 'فُتح بريدك بالطلب. راجعه ثم أرسله.',
    cleared: 'حُذف الطلب من هذا الجهاز.',
    confirm: 'يُحذف الطلب من هذا الجهاز ولا يُستعاد. أتمضي؟',
    subject: 'طلب التحاق',
    heading: 'طلب التحاق بكلية المدينة العالمية',
    composed: 'حُرِّر في'
  } : {
    missing: 'Still to complete: ',
    declare: 'Please accept each declaration before sending.',
    saved: 'Saved on this device · step ',
    of: ' of ',
    copied: 'The application is copied.',
    copyFail: 'Could not copy. Select the text and copy it by hand.',
    opened: 'Your mail programme has opened with the application in it.',
    cleared: 'The application has been removed from this device.',
    confirm: 'This removes the application from this device and cannot be undone. Continue?',
    subject: 'Application for admission',
    heading: 'APPLICATION FOR ADMISSION — AL-MADINAH INTERNATIONAL COLLEGE',
    composed: 'Composed'
  };

  function fields(scope) {
    return [].slice.call((scope || form).querySelectorAll('[data-label]'));
  }
  function value(el) {
    if (el.type === 'checkbox') return el.checked ? 'yes' : '';
    return (el.value || '').trim();
  }
  function say(msg, kind) {
    if (!status) return;
    status.textContent = msg || '';
    status.hidden = !msg;
    status.className = 'form-status' + (kind ? ' form-status--' + kind : '');
  }

  /* ---- persistence ------------------------------------------------- */
  function save() {
    var data = { at: at, when: new Date().toISOString(), v: {} };
    fields().forEach(function (el) { data.v[el.id] = value(el); });
    form.querySelectorAll('[data-declaration]').forEach(function (el) {
      data.v[el.id] = el.checked ? 'yes' : '';
    });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { return; }
    showSaved(data.when);
  }
  function showSaved(when) {
    if (!savedLine) return;
    var d;
    try { d = new Intl.DateTimeFormat(isAr ? 'ar' : 'en-GB',
      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(when)); }
    catch (e) { d = ''; }
    savedLine.textContent = T.saved + (at + 1) + T.of + steps.length + (d ? ' · ' + d : '');
    savedLine.hidden = false;
  }
  function restore() {
    var raw;
    try { raw = localStorage.getItem(KEY); } catch (e) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    Object.keys(data.v || {}).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = data.v[id] === 'yes';
      else el.value = data.v[id];
    });
    at = Math.min(data.at || 0, steps.length - 1);
    if (data.when) showSaved(data.when);
  }

  /* ---- the composed application ------------------------------------ */
  function compose() {
    var lines = [T.heading, ''];
    steps.forEach(function (st) {
      var legend = st.querySelector('.apply__legend-t');
      var wrote = false;
      var body = [];
      fields(st).forEach(function (el) {
        var v = value(el);
        if (!v) return;
        wrote = true;
        body.push(el.getAttribute('data-label') + ': ' + v);
      });
      if (wrote) {
        lines.push('', (legend ? legend.textContent.trim().toUpperCase() : ''), '');
        lines.push.apply(lines, body);
      }
    });
    lines.push('', T.composed + ': ' + new Date().toISOString().slice(0, 10));
    return lines.join('\n').replace(/\n{3,}/g, '\n\n');
  }

  /* ---- step machinery ---------------------------------------------- */
  function missingIn(i) {
    return fields(steps[i]).filter(function (el) { return el.required && !value(el); });
  }
  function show(i) {
    at = Math.max(0, Math.min(i, steps.length - 1));
    steps.forEach(function (st, n) { st.hidden = n !== at; });
    ledger.forEach(function (row, n) {
      row.classList.toggle('is-here', n === at);
      row.classList.toggle('is-done', n < at && missingIn(n).length === 0);
    });
    var last = at === steps.length - 1;
    toggle('[data-apply-back]', at > 0);
    toggle('[data-apply-next]', !last);
    toggle('[data-apply-send]', last);
    toggle('[data-apply-copy]', last);
    toggle('[data-apply-print]', last);
    if (last && preview) preview.textContent = compose();
    say('');
    var h = steps[at].querySelector('.apply__legend');
    if (h) h.scrollIntoView({ block: 'start', behavior: 'smooth' });
    save();
  }
  function toggle(sel, on) {
    var el = form.querySelector(sel);
    if (el) el.hidden = !on;
  }

  form.querySelector('[data-apply-next]').addEventListener('click', function () {
    var missing = missingIn(at);
    if (missing.length) {
      say(T.missing + missing.map(function (el) { return el.getAttribute('data-label'); })
        .join(isAr ? '، ' : ', '), 'error');
      missing[0].focus();
      return;
    }
    show(at + 1);
  });
  form.querySelector('[data-apply-back]').addEventListener('click', function () { show(at - 1); });

  ledger.forEach(function (row, n) {
    row.addEventListener('click', function () { show(n); });
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(n); }
    });
  });

  form.addEventListener('input', function () { save(); if (at === steps.length - 1 && preview) preview.textContent = compose(); });
  form.addEventListener('change', function () { save(); if (at === steps.length - 1 && preview) preview.textContent = compose(); });

  /* ---- delivery ----------------------------------------------------- */
  function deliver(text) {
    window.location.href = 'mailto:registry@al-madinahcollege.com'
      + '?subject=' + encodeURIComponent(T.subject)
      + '&body=' + encodeURIComponent(text);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    for (var i = 0; i < steps.length; i++) {
      var m = missingIn(i);
      if (m.length) {
        show(i);
        say(T.missing + m.map(function (el) { return el.getAttribute('data-label'); })
          .join(isAr ? '، ' : ', '), 'error');
        m[0].focus();
        return;
      }
    }
    var undeclared = [].slice.call(form.querySelectorAll('[data-declaration]'))
      .filter(function (el) { return !el.checked; });
    if (undeclared.length) { say(T.declare, 'error'); undeclared[0].focus(); return; }
    say(T.opened, 'success');
    deliver(compose());
  });

  var copy = form.querySelector('[data-apply-copy]');
  if (copy) copy.addEventListener('click', function () {
    var text = compose();
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.top = '-1000px';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        say(ok ? T.copied : T.copyFail, ok ? 'success' : 'error');
      } catch (err) { say(T.copyFail, 'error'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { say(T.copied, 'success'); }).catch(fallback);
    } else fallback();
  });

  var print = form.querySelector('[data-apply-print]');
  if (print) print.addEventListener('click', function () {
    if (preview) preview.textContent = compose();
    window.print();
  });

  var clear = form.querySelector('[data-apply-clear]');
  if (clear) clear.addEventListener('click', function () {
    if (!window.confirm(T.confirm)) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    form.reset();
    if (savedLine) savedLine.hidden = true;
    at = 0; show(0);
    say(T.cleared, 'info');
  });

  restore();
  show(at);
})();
