/* =====================================================================
   DĀR AL-RUSŪKH — the header clock.
   ---------------------------------------------------------------------
   A sibling of js/worldclock.js, which is hard-wired to Europe/London.
   This College's registry keeps West Africa Time, which does not shift
   through the year, and its session is kept against the Hijrī calendar
   — so the clock shows Lagos beside the reader's own, and the date is
   given in both reckonings.

   Everything is read from the reader's own device. Nothing is fetched
   and nothing is sent anywhere.
   ===================================================================== */
(function () {
  var root = document.querySelector('[data-rusukh-clock]');
  if (!root) return;

  var lagosEl = root.querySelector('[data-clock-lagos]');
  var localEl = root.querySelector('[data-clock-local]');
  var dateEl = root.querySelector('[data-clock-hijri]');

  function fmt(opts) {
    try { return new Intl.DateTimeFormat('en-GB', opts); } catch (e) { return null; }
  }

  var lagos = fmt({ timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', hour12: false });
  var here = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
  // Not every engine ships the Islamic calendar; where it is missing the
  // Gregorian date stands alone rather than the line breaking.
  var hijri = fmt({ calendar: 'islamic-umalqura', day: 'numeric', month: 'short' });
  var greg = fmt({ day: 'numeric', month: 'short' });

  function tick() {
    var now = new Date();
    if (lagosEl && lagos) lagosEl.textContent = lagos.format(now);
    if (localEl && here) localEl.textContent = here.format(now);
    if (dateEl) {
      var g = greg ? greg.format(now) : '';
      var h = '';
      try { h = hijri ? hijri.format(now) : ''; } catch (e) { h = ''; }
      dateEl.textContent = h && h !== g ? h + ' · ' + g : g;
    }
  }

  tick();
  setInterval(tick, 30000);
})();
