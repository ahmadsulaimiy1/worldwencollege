/* =========================================================
   THE BOOKCASE — turning a volume, turning its pages, and
   keeping a shelf of the ones a reader wants.
   =========================================================

   Three behaviours, all of them progressive: with this file
   blocked, the publication page still shows the front cover
   of the book, the first sample page, and every action. What
   is added is the ability to look at the object from another
   side, to turn the pages, and to keep a list.

   NO LIBRARY, NO CANVAS, NO VIDEO. The owner's instruction on
   the page-turn was explicit — "Do not use video. Use
   high-performance animation." Everything below is a CSS
   transform driven by a class change, which the compositor
   runs off the main thread; the only per-frame JavaScript is
   during an actual pointer drag, and that writes one custom
   property.

   REDUCED MOTION is honoured by the stylesheet rather than
   here, and it resolves to the finished state: the selected
   leaf visible and flat, the rest folded away. A reader who
   asks for no motion still gets every page — instantly.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  /* ---- 1 · THE TOME ------------------------------------------------
     Three named attitudes, plus free rotation under the pointer. The
     attitudes are the accessible path: three buttons, each of which
     sets data-face and lets the stylesheet do the transform, so the
     control works from the keyboard and reads correctly to a screen
     reader. The drag is the pleasure on top. */
  function mountTome(root) {
    var box = root.querySelector('[data-tome-box]');
    if (!box) return;
    var stage = root.querySelector('.tome__stage');
    var wrap = root.closest('.vol__object') || root.parentNode;
    var ctls = wrap ? wrap.querySelectorAll('[data-tome-face]') : [];

    box.setAttribute('data-face', 'front');

    function select(face) {
      box.style.removeProperty('transform');
      box.setAttribute('data-face', face);
      for (var i = 0; i < ctls.length; i += 1) {
        ctls[i].classList.toggle('is-on', ctls[i].getAttribute('data-tome-face') === face);
      }
    }
    for (var i = 0; i < ctls.length; i += 1) {
      (function (btn) {
        btn.addEventListener('click', function () {
          select(btn.getAttribute('data-tome-face'));
          if (window.WECSonics) window.WECSonics.play('tap');
        });
      }(ctls[i]));
    }

    if (reduced || !stage) return;

    // The drag. Pointer events only — one code path for mouse, pen and
    // touch, rather than three that drift apart.
    var dragging = false; var startX = 0; var startY = 0; var baseY = -22; var baseX = 4;
    var curY = -22; var curX = 4;

    function apply() {
      box.style.transform = 'rotateY(' + curY.toFixed(1) + 'deg) rotateX(' + curX.toFixed(1) + 'deg)';
    }

    stage.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      // Whatever attitude the buttons last set becomes the base, so a
      // drag continues from what is on screen instead of snapping.
      var face = box.getAttribute('data-face');
      baseY = face === 'spine' ? -74 : face === 'back' ? -201 : -22;
      baseX = face === 'spine' ? 3 : 4;
      curY = baseY; curX = baseX;
      box.classList.add('is-dragging');
      box.removeAttribute('data-face');
      apply();
      if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) { /* not captured */ } }
    });

    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      curY = baseY + (e.clientX - startX) * 0.42;
      // The vertical tilt is deliberately a quarter of the horizontal
      // one and clamped: a book you can tip onto its head is a toy.
      curX = Math.max(-14, Math.min(18, baseX - (e.clientY - startY) * 0.12));
      apply();
    });

    function end() {
      if (!dragging) return;
      dragging = false;
      box.classList.remove('is-dragging');
      // Snap to whichever named attitude the reader stopped nearest,
      // measured on the turn they can actually see. A book left at
      // 137 degrees is a book nobody put back.
      var y = ((curY % 360) + 360) % 360;
      var best = 'front'; var bestD = 999;
      var faces = { front: 338, spine: 286, back: 159 };
      Object.keys(faces).forEach(function (k) {
        var d = Math.abs(((y - faces[k] + 540) % 360) - 180);
        if (d < bestD) { bestD = d; best = k; }
      });
      select(best);
      if (window.WECSonics) window.WECSonics.play('tap');
    }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerleave', end);
  }

  /* ---- 2 · THE FLIP ------------------------------------------------
     One leaf is current; everything before it is turned; everything
     after it is still folded back on the spine. Three states, one
     class each, and the stylesheet owns every transform. */
  function mountFlip(root) {
    var leaves = root.querySelectorAll('[data-flip-leaf]');
    var dots = root.querySelectorAll('[data-flip-to]');
    var prev = root.querySelector('[data-flip-prev]');
    var next = root.querySelector('[data-flip-next]');
    if (!leaves.length) return;
    var at = 0;

    function show(n, sound) {
      n = Math.max(0, Math.min(leaves.length - 1, n));
      if (n === at && sound !== 'init') return;
      at = n;
      for (var i = 0; i < leaves.length; i += 1) {
        leaves[i].classList.toggle('is-current', i === n);
        leaves[i].classList.toggle('is-turned', i < n);
        // aria-hidden rather than removal: the images stay in the DOM
        // so a reader who turns back does not wait for a fetch, but
        // only the page on screen is announced.
        if (i === n) leaves[i].removeAttribute('aria-hidden');
        else leaves[i].setAttribute('aria-hidden', 'true');
      }
      for (var d = 0; d < dots.length; d += 1) {
        dots[d].setAttribute('aria-selected', d === n ? 'true' : 'false');
      }
      if (prev) prev.disabled = n === 0;
      if (next) next.disabled = n === leaves.length - 1;
      if (sound === 'turn' && window.WECSonics) window.WECSonics.play('open');
    }

    if (prev) prev.addEventListener('click', function () { show(at - 1, 'turn'); });
    if (next) next.addEventListener('click', function () { show(at + 1, 'turn'); });
    for (var d = 0; d < dots.length; d += 1) {
      (function (btn) {
        btn.addEventListener('click', function () {
          show(Number(btn.getAttribute('data-flip-to')), 'turn');
        });
      }(dots[d]));
    }

    // Arrow keys, once the reader has focused the component. Scoped to
    // the component rather than the document so it cannot steal the
    // arrow keys from the page.
    root.setAttribute('tabindex', '-1');
    root.addEventListener('keydown', function (e) {
      var rtl = document.documentElement.getAttribute('dir') === 'rtl';
      if (e.key === 'ArrowRight') { show(at + (rtl ? -1 : 1), 'turn'); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(at + (rtl ? 1 : -1), 'turn'); e.preventDefault(); }
    });

    show(0, 'init');
  }

  /* ---- 3 · THE STUDY LIBRARY ---------------------------------------
     A reader's own shelf, kept in localStorage. Deliberately NOT an
     account feature: the College asks for no email address to let
     somebody keep a list of books they mean to read, and a list that
     needs a sign-in is a list nobody makes.

     Private-mode browsers throw on localStorage. Every access is
     wrapped, and a failure degrades to a button that still toggles for
     the session — which is the honest behaviour, since the reader's
     browser is the thing refusing to remember. */
  var KEY = 'wec.shelf.v1';
  function readShelf() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function writeShelf(list) {
    try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
  }

  function mountShelfButtons() {
    var buttons = document.querySelectorAll('[data-shelf-add]');
    if (!buttons.length) return;
    var list = readShelf();

    function label(btn, on) {
      var span = btn.querySelector('[data-shelf-label]');
      var word = on ? btn.getAttribute('data-shelf-on') : btn.getAttribute('data-shelf-off');
      if (span && word) span.textContent = word;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    for (var i = 0; i < buttons.length; i += 1) {
      (function (btn) {
        var slug = btn.getAttribute('data-shelf-add');
        var span = btn.querySelector('[data-shelf-label]');
        // The two words are captured from the markup the first time,
        // so the generator stays the single source of both languages.
        if (span && !btn.getAttribute('data-shelf-off')) {
          btn.setAttribute('data-shelf-off', span.textContent.trim());
        }
        label(btn, list.indexOf(slug) >= 0);
        btn.addEventListener('click', function () {
          var now = readShelf();
          var at = now.indexOf(slug);
          if (at >= 0) now.splice(at, 1); else now.push(slug);
          writeShelf(now);
          label(btn, now.indexOf(slug) >= 0);
          paintCounts();
          if (window.WECSonics) window.WECSonics.play(now.indexOf(slug) >= 0 ? 'seal' : 'tap');
        });
      }(buttons[i]));
    }
  }

  /* Every [data-shelf-count] on the page shows how many volumes are on
     the reader's shelf, and hides itself at zero rather than printing
     a nought — an empty count reads as a broken badge. */
  function paintCounts() {
    var n = readShelf().length;
    var marks = document.querySelectorAll('[data-shelf-count]');
    for (var i = 0; i < marks.length; i += 1) {
      marks[i].textContent = String(n);
      marks[i].hidden = n === 0;
    }
    var panels = document.querySelectorAll('[data-shelf-empty]');
    for (var p = 0; p < panels.length; p += 1) panels[p].hidden = n !== 0;
  }

  /* The Library's own shelf section: show the volumes a reader kept,
     hide the rest. The cards are already on the page — this filters
     them rather than fetching anything. */
  function mountShelfView() {
    var view = document.querySelector('[data-shelf-view]');
    if (!view) return;
    var list = readShelf();
    var cards = view.querySelectorAll('[data-shelf-item]');
    var shown = 0;
    for (var i = 0; i < cards.length; i += 1) {
      var on = list.indexOf(cards[i].getAttribute('data-shelf-item')) >= 0;
      cards[i].hidden = !on;
      if (on) shown += 1;
    }
    view.hidden = shown === 0;
  }

  ready(function () {
    var tomes = document.querySelectorAll('[data-tome]');
    for (var i = 0; i < tomes.length; i += 1) mountTome(tomes[i]);
    var flips = document.querySelectorAll('[data-flip]');
    for (var f = 0; f < flips.length; f += 1) mountFlip(flips[f]);
    mountShelfButtons();
    mountShelfView();
    paintCounts();
  });
}());
