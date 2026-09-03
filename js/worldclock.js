/* =========================================================
   THE HEADER CLOCK
   ---------------------------------------------------------
   A compact, single-line instrument in the header itself —
   London time (the College's own), the reader's own local
   time, and today's date — rather than the large analogue
   panel the first version put in the homepage body. Sitewide,
   mobile only (see css/brand.css .headerclock), sitting above
   the quicknav strip exactly where the reference screenshot
   carries its own date/time line.
   ========================================================= */
(function () {
  var root = document.querySelector('[data-worldclock]');
  if (!root) return;

  var londonEl = root.querySelector('[data-clock-london]');
  var localEl = root.querySelector('[data-clock-local]');
  var dateEl = root.querySelector('[data-clock-date]');

  var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en-GB';

  var londonDigital = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  var localDigital = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  // Short form for a single line of header chrome: weekday + day + month,
  // year omitted — this is persistent chrome, not a dated document, so
  // "which year" is never actually in question for the reader seeing it.
  // -nu-latn forces Western digits in the Arabic run, matching the
  // footer's own "© 2026" precedent.
  var dateFormat = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-ca-gregory-nu-latn' : 'en-GB', {
    calendar: 'gregory', weekday: 'short', day: 'numeric', month: 'short',
  });

  function tick() {
    var now = new Date();
    if (londonEl) londonEl.textContent = londonDigital.format(now);
    if (localEl) localEl.textContent = localDigital.format(now);
    if (dateEl) dateEl.textContent = dateFormat.format(now);
  }

  tick();
  // A minute is close enough for chrome a reader glances at rather than
  // watches — no second hand here to justify a faster interval.
  setInterval(tick, 30000);
})();
