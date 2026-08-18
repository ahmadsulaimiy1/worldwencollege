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

  /** Which voice an element answers with. First match wins. */
  function voiceFor(el) {
    if (el.closest('.btn--gold, .quiet-btn--apply')) return 'chime';
    if (el.closest('.wax-seal, .cta__seal, .vessel')) return 'seal';
    if (el.closest('details > summary, .accordion__trigger, .nav__toggle, [aria-expanded]')) return 'open';
    if (el.closest('a, button, .audience, .region, .case, .principle, .footergrid__tile, [data-section="academics"] .card, [data-section="study"] .card')) return 'tap';
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
