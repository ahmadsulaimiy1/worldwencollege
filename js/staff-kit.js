/* WEC-LC — the shared kit behind the six staff consoles.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 * ─────────────────────────────────────────────────────────────────────
 * Six pages talk to the same platform under the same two conditions —
 * a Bearer token and a staff role — and each of them has to render a
 * date, a level, a wait in days, a struck plate and an error a person
 * can act on. Written six times, those six become six slightly
 * different answers to the same question, and the one that drifts is
 * the one nobody notices.
 *
 * So the drawing of a plate, the reading of a wait, the naming of a
 * level and the shape of a failure live here, once, in both
 * languages.
 *
 * ─────────────────────────────────────────────────────────────────────
 * TWO FAILURES, TOLD APART
 * ─────────────────────────────────────────────────────────────────────
 * 401 and 403 mean entirely different things to the person reading the
 * screen: one is "you are not signed in", which they can fix, and the
 * other is "this desk is not yours", which they cannot. Every console
 * distinguishes them, because a member of staff told to sign in when
 * they already have will sign in again, and again.
 *
 * ─────────────────────────────────────────────────────────────────────
 * AND NOTHING REACHES THE PAGE AS HTML
 * ─────────────────────────────────────────────────────────────────────
 * Every value from the platform — a learner's name, what they wrote,
 * the reason a colleague gave for a mark — is set through
 * textContent. A marking screen that renders a learner's essay as
 * markup is a marking screen with an injection in it.
 */
window.WEC_LC_staff = (function () {
  'use strict';

  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

  /* ── ELEMENTS ────────────────────────────────────────────────────── */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  /** An <svg><use> mark from the site sprite. */
  function icon(id) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  /**
   * A struck plate. Every major shape on these consoles is one, and it
   * is built here rather than in six places so that no console ships
   * the flat version by omission.
   *
   * `.aurum` claims ::after and `.edge-lit` claims ::before — see the
   * house standard. Nothing added to this node may take either.
   */
  function plate(tag, extra) {
    var n = el(tag || 'li',
      'stf-item card edge-lit edge-lit--light aurum aurum--hover tilt gold-live reveal'
      + (extra ? ' ' + extra : ''));
    var sheen = el('span', 'tilt__sheen');
    sheen.setAttribute('aria-hidden', 'true');
    n.appendChild(sheen);
    return n;
  }

  /** The large dome that anchors a plate. Never the small one. */
  function dome(id, dark) {
    var d = el('span', 'badge-dome badge-dome--lg' + (dark ? ' badge-dome--dark' : ''));
    d.setAttribute('aria-hidden', 'true');
    d.appendChild(icon(id));
    return d;
  }

  function chip(text, kind) {
    return el('span', 'desk-chip' + (kind ? ' desk-chip--' + kind : ''), text);
  }

  /* ── THE PLATFORM ────────────────────────────────────────────────── */

  /**
   * Headers come from js/api-auth.js, which mints a token per request
   * rather than reusing one captured at page load: a marker sits on
   * these screens far longer than a Clerk session token lives.
   */
  function api(path, opts) {
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      return fetch(path, Object.assign({}, opts || {}, { headers: headers }));
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) {
        if (!r.ok) {
          throw Object.assign(
            // `message` first and `error` never: errorResponse() puts the
            // sentence a person can act on in `message` and the class
            // name in `error`, and a page that reads `error` shows its
            // users "ValidationError".
            new Error(b.message || r.statusText),
            { status: r.status, fields: b.fields || null, body: b },
          );
        }
        return b;
      });
    });
  }

  /* ── TIME ────────────────────────────────────────────────────────── */

  function when(iso, withTime) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    var opts = { year: 'numeric', month: 'long', day: 'numeric' };
    if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
    try { return d.toLocaleDateString(LOCALE, opts); } catch (e) { return d.toISOString().slice(0, 10); }
  }

  function clock(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    try {
      return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return d.toISOString().slice(11, 16); }
  }

  /* ── THE WAIT ────────────────────────────────────────────────────────
     Drawn as well as said. The scale is the College's own undertaking:
     fifteen working days is the longest answer interval it publishes
     anywhere, so a bar full at fifteen days is a bar that means
     something rather than one scaled to whatever happened to be in the
     queue. Past that the bar is full and lit, and the reading beside
     it says so in words. */

  var WAIT_SCALE = 15;

  function wait(days, owedFrom) {
    var box = el('div', 'stf-wait');
    var n = Math.max(0, Number(days) || 0);
    var owed = n >= (owedFrom || WAIT_SCALE);
    box.setAttribute('data-owed', owed ? 'yes' : 'no');

    var bar = el('div', 'stf-wait__bar');
    // Presentational: the same fact is in the sentence below, which is
    // what a screen reader is given.
    bar.setAttribute('aria-hidden', 'true');
    var fill = el('span', 'stf-wait__fill');
    fill.style.width = Math.min(100, Math.round((n / WAIT_SCALE) * 100)) + '%';
    bar.appendChild(fill);
    box.appendChild(bar);

    box.appendChild(el('p', 'stf-wait__read', AR
      ? (n === 0 ? 'وردت اليوم' : (owed ? 'انتظرت ' + n + ' يومًا، وقد جاوزت ما تُلزِم به الكلّيةُ نفسَها' : 'انتظرت ' + n + ' يومًا'))
      : (n === 0 ? 'Arrived today'
        : (owed ? 'Waiting ' + n + ' days — past the College\'s own undertaking'
          : 'Waiting ' + n + (n === 1 ? ' day' : ' days')))));
    return box;
  }

  /* ── LEVELS ──────────────────────────────────────────────────────── */

  function levelWord(n) {
    var r = ROMAN[Number(n)] || String(n);
    return AR ? 'المستوى ' + r : 'Level ' + r;
  }

  /**
   * The level filter every console carries. Built here so all six
   * offer the same six levels in the same order in both editions.
   */
  function fillLevels(select, allLabel) {
    if (!select || select.options.length) return;
    var any = el('option', null, allLabel);
    any.value = '';
    select.appendChild(any);
    for (var i = 1; i <= 6; i++) {
      var o = el('option', null, levelWord(i));
      o.value = String(i);
      select.appendChild(o);
    }
  }

  function fillOptions(select, pairs) {
    if (!select) return;
    select.textContent = '';
    pairs.forEach(function (p) {
      var o = el('option', null, p[1]);
      o.value = p[0];
      select.appendChild(o);
    });
  }

  /* ── PROSE FROM THE PLATFORM ─────────────────────────────────────────
     A learner's own words, and a colleague's. Split on blank lines and
     set through textContent, never innerHTML, and `dir="auto"` because
     a learner writing Arabic into an English console is the ordinary
     case at this College rather than the exception. */

  function prose(node, text) {
    node.textContent = '';
    String(text == null ? '' : text).split(/\n{2,}/).forEach(function (p) {
      if (!p.trim()) return;
      var para = el('p', null, p.trim());
      para.setAttribute('dir', 'auto');
      node.appendChild(para);
    });
    if (!node.childNodes.length) {
      node.appendChild(el('p', null, AR ? '(لا نصّ)' : '(No text was submitted.)'));
    }
  }

  /* ── AN ITEM LEAVING A QUEUE ─────────────────────────────────────── */

  function withdraw(node, done) {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.setAttribute('data-leaving', 'yes');
    if (reduced) { node.remove(); if (done) done(); return; }
    window.setTimeout(function () { node.remove(); if (done) done(); }, 340);
  }

  /* ── THE ENTRANCE ────────────────────────────────────────────────────
     THE FAULT THIS EXISTS TO CORRECT, and it was invisible in the
     source and total on screen: every console rendered its masthead and
     then four thousand pixels of nothing.

     `.reveal` is the site's entrance: css/brand.css sets opacity 0 and
     js/site.js clears it when an IntersectionObserver reports the
     element in view. Both are wired at DOMContentLoaded, over the
     elements that exist then — which is the wrong half of a console.
     A plate built by script twenty lines later is never observed, so it
     is never cleared, so it stays at opacity 0 for ever; and a section
     that starts `hidden` was measured while it was hidden, had
     js/motion.js write `opacity: 0` onto it inline, and was still
     carrying that when the page revealed it.

     So the consoles bring their own. A MutationObserver over the shell
     catches both cases at their source — a node inserted, and a section
     un-hidden — and raises whatever it finds. It resolves to the
     FINISHED state in one frame, clearing any inline opacity motion.js
     left behind, so a failure here shows the content rather than
     hiding it. That is the direction the house standard requires an
     entrance to fail in. */

  function rise(node) {
    if (!node || node.nodeType !== 1) return;
    var els = [];
    if (node.matches && node.matches('.reveal')) els.push(node);
    if (node.querySelectorAll) {
      els = els.concat(Array.prototype.slice.call(node.querySelectorAll('.reveal')));
    }
    els.forEach(function (el, i) {
      if (el.getAttribute('data-risen') === '1') return;
      el.setAttribute('data-risen', '1');
      // The same cascade js/site.js gives a grid of cards, capped so a
      // long queue's last plate is not left waiting half a second.
      el.style.setProperty('--reveal-delay', (Math.min(i, 6) * 0.06) + 's');
      window.requestAnimationFrame(function () {
        el.style.opacity = '';
        el.style.transform = '';
        el.classList.add('is-visible');
      });
    });
  }

  function watchForRises(shell) {
    rise(shell);
    if (!('MutationObserver' in window)) return;
    new MutationObserver(function (records) {
      records.forEach(function (r) {
        if (r.type === 'attributes') { rise(r.target); return; }
        Array.prototype.forEach.call(r.addedNodes, rise);
      });
    }).observe(shell, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'],
    });
  }

  /* ── THE PAGE'S OWN STATE LINE ───────────────────────────────────── */

  var T = AR ? {
    signedOut: 'لست مسجَّل الدخول. هذا المكتب لأعضاء الهيئة، وهو يقتضي جلسةً قائمة.',
    notStaff: 'حسابُك ليس من أعضاء الهيئة. وهذه الصفحات لهيئة التدريس والإدارة، ولا تُفتح بغير ذلك.',
    failed: 'تعذّر تحميل هذه الصفحة. الخلل عندنا؛ أعد المحاولة بعد قليل.',
  } : {
    signedOut: 'You are not signed in. This desk belongs to the College\'s staff and needs a live session.',
    notStaff: 'Your account is not a member of staff. These pages are for teaching and administrative staff and open for nobody else.',
    failed: 'This page could not be loaded. That is a fault at our end — try again shortly.',
  };

  /** The sentence for a failure, chosen by what actually failed. */
  function trouble(err) {
    if (!err) return T.failed;
    if (err.status === 401) return T.signedOut;
    if (err.status === 403) return T.notStaff;
    return err.message || T.failed;
  }

  /* ── BOOT ────────────────────────────────────────────────────────────
     The same guard-then-load sequence every portal page uses. Where no
     Clerk key is configured — the shipped default — the guard is a
     no-op and the console loads, meets a 401, and says so in a
     sentence. That is deliberate: the page stays a truthful preview of
     itself rather than a blank. */

  function boot(load) {
    document.addEventListener('DOMContentLoaded', function () {
      var shell = document.querySelector('.stf-shell');
      if (shell) watchForRises(shell);
      var guarded = window.WEC_LC_guardPortal({
        signOutRedirect: '/',
        shellSelector: '.stf-shell',
        onAuthenticated: function (clerk, done) {
          window.WEC_LC_apiAuth.attach(clerk);
          done();
          load();
        },
      });
      if (!guarded) load();
    });
  }

  return {
    AR: AR,
    LOCALE: LOCALE,
    ROMAN: ROMAN,
    el: el,
    icon: icon,
    plate: plate,
    dome: dome,
    chip: chip,
    api: api,
    when: when,
    clock: clock,
    wait: wait,
    levelWord: levelWord,
    fillLevels: fillLevels,
    fillOptions: fillOptions,
    prose: prose,
    withdraw: withdraw,
    rise: rise,
    trouble: trouble,
    boot: boot,
    $: function (s, r) { return (r || document).querySelector(s); },
    $$: function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); },
  };
})();
