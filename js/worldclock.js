/* =========================================================
   THE WORLD CLOCK
   ---------------------------------------------------------
   A single analogue face, drawn for London — the College's
   home time, not the reader's — with a digital readout below
   it for London, the reader's own local time, and today's
   date. One face rather than two: a second dial for "your
   time" would need its own hands and its own set of numerals,
   and a reader comparing two clocks at a glance is worse
   served than one clock plus one line of text.

   Homepage only, wired in via pages/manifest.json's `scripts`
   key — every other page already has enough going on in its
   header, and a ticking clock re-created 84 times over adds
   nothing a reader on /admissions/tuition/ needs.
   ========================================================= */
(function () {
  var root = document.querySelector('[data-worldclock]');
  if (!root) return;

  var hourHand = root.querySelector('[data-hand="hour"]');
  var minuteHand = root.querySelector('[data-hand="minute"]');
  var secondHand = root.querySelector('[data-hand="second"]');
  var dateEl = root.querySelector('[data-clock-date]');
  var londonEl = root.querySelector('[data-clock-london]');
  var localEl = root.querySelector('[data-clock-local]');

  var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en-GB';
  var reduced = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  // A ticking second hand is motion for motion's sake — the reader who
  // has asked for less of it gets a still hour and minute hand instead,
  // which is still a correct clock, just not an animated one.
  if (reduced.matches && secondHand) secondHand.style.display = 'none';

  var londonParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  var londonDigital = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  var localDigital = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  // Gregorian explicitly: Intl's default calendar already is one, but a
  // reader whose device locale defaults to Hijri or another calendar
  // would otherwise see a date that reads as wrong rather than merely
  // unfamiliar, which is the one thing a "today's date" line cannot be.
  // -nu-latn forces Western digits in the Arabic run — the footer's own
  // copyright line already sets that precedent ("© 2026", not "٢٠٢٦").
  var dateFormat = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-ca-gregory-nu-latn' : 'en-GB', {
    calendar: 'gregory', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  function tick() {
    var now = new Date();
    var lp = {};
    londonParts.formatToParts(now).forEach(function (p) { lp[p.type] = p.value; });
    var h = Number(lp.hour) % 12;
    var m = Number(lp.minute);
    var s = Number(lp.second);

    if (hourHand) hourHand.setAttribute('transform', 'rotate(' + (h * 30 + m * 0.5) + ' 50 50)');
    if (minuteHand) minuteHand.setAttribute('transform', 'rotate(' + (m * 6 + s * 0.1) + ' 50 50)');
    if (secondHand && !reduced.matches) secondHand.setAttribute('transform', 'rotate(' + (s * 6) + ' 50 50)');

    if (londonEl) londonEl.textContent = londonDigital.format(now);
    if (localEl) localEl.textContent = localDigital.format(now);
    if (dateEl) dateEl.textContent = dateFormat.format(now);
  }

  tick();
  // Reduced motion still needs the digits to stay correct, just not a
  // sweeping second hand — a slower interval is enough for that.
  setInterval(tick, reduced.matches ? 30000 : 1000);
})();
