/* =====================================================================
   SONICS — the sound of the instrument.
   ---------------------------------------------------------------------
   A four-voice interaction palette, synthesised in the browser. There
   are no audio files: every sound here is a handful of oscillators and
   a gain envelope, which is why this costs nine kilobytes of script and
   zero kilobytes of network per sound. A site that downloads WAVs to
   play a click has bought a worse experience at a higher price.

   THE VOICES, and what each one is FOR. A single click sound used
   everywhere is a mouse, not an instrument; the point of a palette is
   that a user learns the building by ear.

     tap     — any ordinary control. A short wooden knock, felt more
               than heard. 40ms.
     chime   — a primary call to action. A struck minor third, gold:
               two partials a 6:5 ratio apart with a long tail.
     open    — a panel, drawer or accordion opening. Rising fifth.
     seal    — the closing seal and award marks. A low struck bell,
               the only voice allowed a full second.

   THE THREE RULES THIS FILE OBEYS, in order of importance:

   1. NOTHING PLAYS UNSOLICITED. An AudioContext is not even
      constructed until the visitor's first pointer or key event.
      Browsers enforce this anyway; doing it deliberately means the
      page never holds an audio device it is not using.

   2. THE VISITOR IS IN CHARGE. A labelled control lives in the top
      bar, the choice persists in localStorage, and it is honoured
      before any sound is produced. Sound on a website that cannot be
      turned off is an imposition, however beautiful it is.

   3. IT IS QUIET. Peak gain is 0.06 — about a twentieth of full
      scale. These sounds should register as the tactile edge of a
      well-made control, and someone working with the page open beside
      a meeting should never be embarrassed by it.

   Accessibility: the toggle is a real <button> with aria-pressed, and
   the sounds are decorative — no information is conveyed by audio
   alone, so a visitor with sound off loses nothing at all.
   ===================================================================== */
(() => {
  'use strict';

  const KEY = 'wec-sonics';
  const PEAK = 0.06;

  // Default OFF. The alternative — default on, mute available — was
  // considered and rejected: a person opening an institution's website
  // in a shared office should not have to discover a mute button after
  // the fact. The control is visible, so choosing sound is one click.
  let enabled = false;
  try { enabled = localStorage.getItem(KEY) === 'on'; } catch { /* private mode */ }

  let ctx = null;
  const ac = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    // Safari and Chrome both park the context until a gesture resumes it.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  /**
   * One partial: a sine at `freq`, swept to `to` if given, under an
   * exponential decay. Exponential rather than linear because that is
   * how a struck object actually loses energy — a linear fade reads as
   * a synthesiser, and this is meant to read as an object.
   */
  function voice(freq, { to = freq, dur = 0.25, gain = 1, type = 'sine', delay = 0 } = {}) {
    const a = ac();
    if (!a) return;
    const t = a.currentTime + delay;
    const osc = a.createOscillator();
    const amp = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to !== freq) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    // A 6ms attack, not an instant one: a zero-length attack on a sine
    // produces a click of its own, which is the one sound nobody wants.
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(PEAK * gain, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(amp).connect(a.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  const VOICES = {
    tap:   () => { voice(320, { to: 190, dur: 0.05, gain: 0.7, type: 'triangle' }); },
    chime: () => { voice(784, { dur: 0.5, gain: 0.85 }); voice(940, { dur: 0.62, gain: 0.5, delay: 0.02 }); },
    open:  () => { voice(392, { to: 588, dur: 0.16, gain: 0.6, type: 'triangle' }); },
    seal:  () => { voice(196, { dur: 0.9, gain: 1 }); voice(392, { dur: 0.7, gain: 0.4, delay: 0.01 });
                   voice(587, { dur: 0.45, gain: 0.22, delay: 0.02 }); },
  };

  const play = (name) => { if (enabled && VOICES[name]) { try { VOICES[name](); } catch { /* no device */ } } };
  // Exposed so other modules (the Listening Lab, the level quiz) can
  // use the same palette rather than inventing a second one.
  window.WECSonics = { play, get enabled() { return enabled; } };

  /** Which voice an element answers with. First match wins.
   *
   *  EVERY STRUCK SHAPE ON THE SITE ANSWERS, and the ordering below is
   *  the whole design. The list used to name eight selectors and two
   *  page sections, which meant a reader could tap a medallion on the
   *  homepage and hear nothing, then tap a card on Academics and hear
   *  something — the inconsistency read as a bug rather than as
   *  restraint.
   *
   *  The voices are ranked by CEREMONY, not by element type, and the
   *  first match wins, so a seal inside a card sounds like a seal:
   *
   *    chime  — the act of committing. Gold CTAs only.
   *    seal   — conferral and identity: wax seals, struck medallions,
   *             the honour plates, the matricula, the crest.
   *    open   — anything that expands or reveals.
   *    tap    — every other struck surface: cards, domes, gauges,
   *             clauses, tenets, register columns, quicknav tiles.
   *
   *  A surface with no relief is deliberately silent. Body text, table
   *  rows and plain list items get no voice, because a site where
   *  everything makes a noise is not luxurious, it is a toy. */
  /* TWO SELECTORS HERE MATCHED NOTHING, and had matched nothing for as
     long as the list existed: .quiet-btn--apply and .accordion__trigger
     are defined in no stylesheet, no partial and no script in this
     repository. A voice list that names a class nothing wears is worse
     than a short list — it reports coverage it does not have, which is
     precisely the failure CLAUDE.md §3 is written against, wearing the
     appearance of a fix. The mobile menu's real trigger is
     .accordion__q, which is already in OPEN.
     tests/sonics-coverage.test.mjs now fails on any selector in these
     four lists that matches nothing in the built site, and on any major
     struck component that is missing from them. */
  var CHIME = '.btn--gold';
  var SEAL  = '.wax-seal, .cta__seal, .vessel, .medallion, .honour, .honour__wreath, '
            + '.matricula, .case__medallion, .brand__crest, .masthead__rule, .colophon__rule, '
            /* The warrant is a ruling with a seal on it, so it takes
               the conferral voice rather than the tap every other
               struck surface gets. Ceremony is ranked, not uniform. */
            + '.warrant, .article__seal, .imprint, .imprint__device';
  var OPEN  = 'details > summary, .accordion__q, .nav__toggle, [aria-expanded]';
  var TAP   = 'a, button, .card, .audience, .region, .case, .principle, .badge-dome, '
            + '.quad__skill, .quad__gauge, .sep__role, .sep__disc, .creed__item, .creed__mark, '
            + '.clause, .tenet, .register__col, .vacancy, .footergrid__tile, .quicknav__tile, '
            /* The hero's struck eyebrow pill — it wears .aurum, so it
               must not be the one silent object on the homepage. */
            + '.hero__eyebrow, '
            + '.plate__frame, .ledger--flagship tbody tr, '
            /* The Academics pillar — css/academics.css. */
            + '.ascent__step, .ascent__band, .horarium__band, .discipline, '
            /* The Admissions pillar — css/admissions.css. The warrant
               is a sealed instrument and takes SEAL, not TAP; it is in
               the list above. */
            + '.passage__stage, .passage__mark, .tariff__line, '
            /* The Governance pillar — css/governance.css. The article
               is sealed, so it takes SEAL and is in the list above. */
            + '.docket__entry, .attest, '
            /* The Press pillar — css/press.css. The imprint is the
               press's own signature and takes SEAL; it is above. */
            + '.folio, .shelf__title';

  function voiceFor(el) {
    if (el.closest(CHIME)) return 'chime';
    if (el.closest(SEAL)) return 'seal';
    if (el.closest(OPEN)) return 'open';
    if (el.closest(TAP)) return 'tap';
    return null;
  }

  document.addEventListener('pointerdown', (e) => {
    const el = e.target instanceof Element ? e.target : null;
    if (!el) return;
    const v = voiceFor(el);
    if (v) play(v);
  }, { passive: true });

  // Keyboard activation deserves the same feedback a pointer gets;
  // without this the sound is a mouse feature, which is a small
  // exclusion but an exclusion.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = document.activeElement;
    if (!(el instanceof Element)) return;
    const v = voiceFor(el);
    if (v) play(v);
  });

  /* ---- The control -------------------------------------------------
     Injected rather than authored into partials/topbar.html because it
     must not exist for a visitor whose browser has no Web Audio: a
     control that does nothing is worse than no control. */
  function mount() {
    if (!(window.AudioContext || window.webkitAudioContext)) return;
    const host = document.querySelector('.topbar__right');
    if (!host || host.querySelector('.sonics-toggle')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sonics-toggle';
    btn.setAttribute('aria-pressed', String(enabled));
    btn.innerHTML =
      '<span class="sonics-toggle__wave" aria-hidden="true"><i></i><i></i><i></i></span>' +
      '<span class="sonics-toggle__label"></span>';

    const label = btn.querySelector('.sonics-toggle__label');
    const sync = () => {
      btn.setAttribute('aria-pressed', String(enabled));
      btn.classList.toggle('is-on', enabled);
      label.textContent = enabled ? 'Sound on' : 'Sound off';
      btn.setAttribute('aria-label', enabled
        ? 'Interface sound is on. Turn it off.'
        : 'Interface sound is off. Turn it on.');
    };

    btn.addEventListener('click', () => {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* private mode */ }
      sync();
      // Play the confirmation AFTER enabling, so switching on
      // demonstrates what was switched on. Switching off is silent,
      // which is the only correct behaviour for an off switch.
      if (enabled) play('chime');
    });

    sync();
    host.insertBefore(btn, host.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
