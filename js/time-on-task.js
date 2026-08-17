/* AIPC — time-on-task beacon.

   The client half of the College's measured-hours commitment
   (docs/academic-framework.md § I). It sends one thing, on a timer:
   "I am still working." It never sends a duration, because the server
   would then be publishing a number the browser chose.

   THE HARD PART IS NOT SENDING BEATS. It is not sending them when
   nobody is studying. A tab left open on a lesson while its owner eats
   lunch would, unchecked, turn the College's headline academic metric
   into a measure of how often learners forget to close tabs.

   So a beat is sent only when ALL of these hold:

     * the page is visible (document.visibilityState)
     * the window has focus
     * the learner has interacted within the idle window

   "Interacted" is deliberately broad — keyboard, pointer, scroll, and
   audio playing. Audio matters: a learner listening to a two-minute
   recording with their hands still is studying, and an idle rule built
   only on input would score them at zero. That would penalise exactly
   the listening practice the programme is built around.
*/
(function () {
  'use strict';

  var BEAT_MS = 60000;      // must stay well under the server's MAX_BEAT_SECONDS
  var IDLE_MS = 120000;     // no interaction for this long and we stop counting

  var unitId = null;
  var lastActivity = Date.now();
  var timer = null;
  var sending = false;

  function markActive() { lastActivity = Date.now(); }

  function studying() {
    if (!unitId) return false;
    if (document.visibilityState !== 'visible') return false;
    if (document.hasFocus && !document.hasFocus()) return false;
    // Audio counts as activity in its own right — see the note above.
    if (anyAudioPlaying()) { markActive(); return true; }
    return Date.now() - lastActivity < IDLE_MS;
  }

  function anyAudioPlaying() {
    var media = document.querySelectorAll('audio, video');
    for (var i = 0; i < media.length; i++) {
      if (!media[i].paused && !media[i].ended && media[i].currentTime > 0) return true;
    }
    return false;
  }

  function beat() {
    if (!studying() || sending) return;
    sending = true;
    window.AIPC_apiAuth.headers().then(function (headers) {
      return fetch('/api/lms/time-on-task', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ unitId: unitId }),
        // The measurement is not worth interrupting a learner for. A
        // failed beat is a small gap in one row, and retrying or
        // reporting it would spend the learner's attention on our
        // bookkeeping.
        //
        // keepalive matters more than it looks: the final beat is sent
        // as the page is going away, and without it that request is
        // cancelled by the navigation. Losing the last partial interval
        // of EVERY session biases the measured hours downward — a
        // systematic error, not a rounding one, in the one number the
        // College has committed to publishing honestly.
        keepalive: true,
      });
    }).catch(function () { /* deliberately silent */ })
      .then(function () { sending = false; }, function () { sending = false; });
  }

  function start(id) {
    if (!id || !window.AIPC_apiAuth) return;
    unitId = id;
    markActive();

    ['keydown', 'pointerdown', 'pointermove', 'scroll', 'wheel', 'touchstart'].forEach(function (evt) {
      window.addEventListener(evt, markActive, { passive: true });
    });
    document.addEventListener('visibilitychange', function () {
      // Returning to the tab is itself activity; leaving it should not
      // leave a stale "last active" that credits the first beat back.
      if (document.visibilityState === 'visible') markActive();
    });

    // The opening beat creates the row and credits nothing — there is no
    // previous moment to measure from. Everything after it measures the
    // real interval since the last one.
    beat();
    timer = setInterval(beat, BEAT_MS);

    // A final beat on the way out captures the last partial interval,
    // which is otherwise the most commonly lost minute of every session.
    window.addEventListener('pagehide', function () {
      if (timer) clearInterval(timer);
      beat();
    });
  }

  window.AIPC_timeOnTask = { start: start };
})();
