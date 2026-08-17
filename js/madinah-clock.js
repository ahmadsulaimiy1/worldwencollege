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
  var root = document.querySelector('[data-madinah-clock]');
  if (!root) return;

  var lagosEl = root.querySelector('[data-clock-lagos]');
  var localEl = root.querySelector('[data-clock-local]');
  var dateEl = root.querySelector('[data-clock-hijri]');

  // The locale is the page's. Clock times are 24-hour in both trees, but the
  // dates take Arabic month names and Arabic-Indic digits in the Arabic tree
  // rather than Latin ones inside an RTL strip (EB §4.4, §5.3).
  var IS_AR = document.documentElement.lang === 'ar';
  var LOCALE = IS_AR ? 'ar' : 'en-GB';

  // The numbering system travels in the options rather than appended to the
  // tag: a second `-u-` extension makes the tag invalid, the constructor
  // rejects it, and the catch below silently returns null instead.
  function fmt(opts) {
    try {
      if (IS_AR) { opts = Object.assign({}, opts, { numberingSystem: 'arab' }); }
      return new Intl.DateTimeFormat(LOCALE, opts);
    } catch (e) { return null; }
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
