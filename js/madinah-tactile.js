/* =====================================================================
   AL-MADINAH INTERNATIONAL COLLEGE — the tactile layer.

   Three things a page can do that a printed prospectus cannot, and the
   restraint that keeps each of them from cheapening the page.

     1. DEPTH. A card that tilts toward the reader's pointer, with its
        own contents parallaxed at different depths, so it reads as an
        object on a surface rather than a rectangle of colour.
     2. SOUND. A soft material contact when a plate is pressed.
     3. THE TYPEWRITER. One line, set as though being written.

   All three are gated. Depth needs a fine pointer; sound is OFF until
   the reader asks for it; every one of them stops dead under
   prefers-reduced-motion. See the note above each.
   ===================================================================== */
(function () {
  'use strict';

  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ===================================================================
     1 · DEPTH

     The card rotates at most 5 degrees. That number is the whole design:
     far enough that the eye reads a plane turning under a light, near
     enough that the text on it never becomes harder to read. Anything
     past about 8 degrees turns a document into a toy, and this is a
     College's prospectus.

     Only on a fine pointer. On a touch screen there is no hover to
     track, and a tilt that fires on tap would move the thing the reader
     just reached for.
     =================================================================== */

  var TILT = '.r-fac-card, .r-tier-card, .card, .r-plate--gilt, .footergrid__tile';
  var MAX = 5;

  function depth() {
    if (!fine.matches || reduced.matches) return;
    $$(TILT).forEach(function (el) {
      if (el.hasAttribute('data-depth')) return;
      el.setAttribute('data-depth', '');
      var frame = null;

      el.addEventListener('pointermove', function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = null;
          var r = el.getBoundingClientRect();
          // -1 .. 1 from the card's own centre
          var px = (e.clientX - r.left) / r.width * 2 - 1;
          var py = (e.clientY - r.top) / r.height * 2 - 1;
          el.style.setProperty('--tilt-x', (-py * MAX).toFixed(2) + 'deg');
          el.style.setProperty('--tilt-y', (px * MAX).toFixed(2) + 'deg');
          // where the specular sits, as a percentage of the card
          el.style.setProperty('--gloss-x', (((px + 1) / 2) * 100).toFixed(1) + '%');
          el.style.setProperty('--gloss-y', (((py + 1) / 2) * 100).toFixed(1) + '%');
          el.classList.add('is-tilted');
        });
      });

      el.addEventListener('pointerleave', function () {
        if (frame) { cancelAnimationFrame(frame); frame = null; }
        el.classList.remove('is-tilted');
        el.style.removeProperty('--tilt-x');
        el.style.removeProperty('--tilt-y');
      });
    });
  }

  /* ===================================================================
     2 · SOUND

     OFF until the reader turns it on, and it stays off for everyone who
     never opens the Personalisation Centre. That is deliberate and it is
     not only a usability position: this is a College of the Qur'ānic
     sciences, and a page that makes noise at a reader who did not ask
     for it is presuming on them.

     What it plays is therefore not a tone and not a chime — nothing
     melodic, nothing with a pitch a listener would call a note. Each
     sound is a MATERIAL CONTACT, synthesised: filtered noise with a fast
     decay, which is what paper, felt and a seal pressed into wax
     actually sound like. Synthesised rather than sampled so the site
     ships no audio files and costs the reader on a metered connection
     nothing at all (EB §12.1).

     The context is created on the first real gesture, because a browser
     will not allow it before one, and it is created ONCE.
     =================================================================== */

  var ctx = null;
  var soundOn = false;
  /* The SAME key the Personalisation Centre writes. The panel stores its
     preferences under `dar.<key>` — a prefix left from the College's working
     name and kept because changing a storage key silently discards every
     reader's existing settings. Reading a different key here would have
     meant a switch that turns nothing on. */
  var SOUND_KEY = 'dar.sound';
  try { soundOn = localStorage.getItem(SOUND_KEY) === 'on'; } catch (e) {}

  function audio() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  // A short burst of filtered noise. `tone` shifts the filter, not a pitch:
  // a lower cutoff reads as heavier material.
  function contact(cutoff, dur, gain) {
    var c = audio();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    var n = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, n, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) {
      // exponential decay: the shape of something struck once
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
    }
    var src = c.createBufferSource();
    src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    f.Q.value = 0.7;
    var g = c.createGain();
    g.gain.value = gain;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  }

  var VOICE = {
    // a page turn: soft, broad, quiet
    leaf:  function () { contact(1400, 0.085, 0.030); },
    // a plate pressed: lower, shorter, firmer
    plate: function () { contact(700,  0.055, 0.045); },
    // the seal: the heaviest thing the site says, for a primary action
    seal:  function () { contact(420,  0.13,  0.060); }
  };

  function play(name) {
    if (!soundOn || reduced.matches) return;
    var v = VOICE[name];
    if (v) v();
  }
  window.__madinahSound = { play: play,
    set: function (on) {
      soundOn = !!on;
      try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) {}
      if (on) play('plate');
    },
    get: function () { return soundOn; } };

  function sound() {
    document.addEventListener('pointerdown', function (e) {
      if (!soundOn) return;
      var el = e.target.closest('a, button, [role="button"], summary');
      if (!el) return;
      if (el.matches('.btn--gold, .dock__plate, [type="submit"]')) play('seal');
      else if (el.matches('.card, .r-fac-card, .r-tier-card, .nav__item > a')) play('plate');
      else play('leaf');
    }, { passive: true });
  }

  /* ===================================================================
     3 · THE TYPEWRITER

     One line to a page and never the <h1>. A masthead that assembles
     itself in front of the reader delays the one thing they came to
     read; a single line beneath it, set as though being written, is a
     different proposition.

     The finished string is in the DOM and in aria-label from the start,
     so the sentence exists for a screen reader, a crawler and a reader
     who scrolled past before it finished. The element is only emptied
     once we know we are going to type it.
     =================================================================== */

  function typewriter() {
    $$('[data-typewriter]').forEach(function (el) {
      if (el.hasAttribute('data-typed')) return;
      el.setAttribute('data-typed', '');
      var full = el.textContent.trim();
      el.setAttribute('aria-label', full);
      if (reduced.matches || !window.IntersectionObserver) return;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(el);
          var i = 0;
          el.textContent = '';
          el.classList.add('is-typing');
          (function step() {
            el.textContent = full.slice(0, ++i);
            if (i < full.length) {
              // a hand, not a machine: punctuation rests, letters do not
              var ch = full.charAt(i - 1);
              setTimeout(step, /[.،,؛;:—]/.test(ch) ? 190 : 26 + Math.random() * 22);
            } else {
              el.classList.remove('is-typing');
              el.classList.add('is-written');
            }
          })();
        });
      }, { threshold: 0.6 });
      io.observe(el);
    });
  }

  function start() { depth(); sound(); typewriter(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.__madinahTactile = start;
})();
