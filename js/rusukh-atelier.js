/* =====================================================================
   DĀR AL-RUSŪKH — the atelier layer.

   Five things, all computed on the reader's own device. Nothing here is
   fetched and nothing is sent anywhere:

     1. Prayer times for Lagos, and a live countdown to the next.
     2. The Hijrī date, beside the Gregorian.
     3. The daily Wird — one verse and one hadith, cycling by the day,
        each printed with the reference that lets a reader check it.
     4. "The College, Right Now" — the registry's clock and whether its
        offices are open at this moment.
     5. The Personalisation Centre — livery, ornament and text size,
        remembered on this device.

   Written as one file rather than five because all of it runs on the
   same tick and shares the same date arithmetic.
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* ===================================================================
     1 · PRAYER TIMES
     -------------------------------------------------------------------
     A standard solar-position solution — the same arithmetic every
     prayer-time table is built on. Sun declination and the equation of
     time give solar noon; an hour-angle inversion gives each prayer's
     depression or altitude.

     Conventions used, and they are stated on the page rather than left
     implicit, because reasonable tables differ:
       Fajr    18° depression   (Muslim World League)
       Isha    17° depression   (Muslim World League)
       Asr     shadow factor 1  (the majority position, and Mālikī —
                                 which is the school this College teaches)
       Sunrise / Maghrib at 0.833° below the horizon, for refraction.

     The result is arithmetic, not an authority. The page says so.
     =================================================================== */

  var LAGOS = { lat: 6.5244, lon: 3.3792, tz: 1 };
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var a = Math.floor(y / 100), b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  }

  function sunPosition(jd) {
    var d = jd - 2451545.0;
    var g = (357.529 + 0.98560028 * d) % 360;         // mean anomaly
    var q = (280.459 + 0.98564736 * d) % 360;         // mean longitude
    var L = (q + 1.915 * Math.sin(g * D2R) + 0.020 * Math.sin(2 * g * D2R)) % 360;
    var e = 23.439 - 0.00000036 * d;                  // obliquity
    var RA = Math.atan2(Math.cos(e * D2R) * Math.sin(L * D2R), Math.cos(L * D2R)) * R2D / 15;
    RA = (RA + 24) % 24;
    return {
      declination: Math.asin(Math.sin(e * D2R) * Math.sin(L * D2R)) * R2D,
      equation: q / 15 - RA                            // equation of time, hours
    };
  }

  // Hour angle, in hours, for the sun at `angle` degrees below the horizon.
  function hourAngle(angle, lat, dec) {
    var c = (-Math.sin(angle * D2R) - Math.sin(lat * D2R) * Math.sin(dec * D2R)) /
            (Math.cos(lat * D2R) * Math.cos(dec * D2R));
    if (c > 1 || c < -1) return null;                  // no such event today
    return Math.acos(c) * R2D / 15;
  }

  function prayerTimes(date, loc) {
    var jd = julian(date.getFullYear(), date.getMonth() + 1, date.getDate());
    var s = sunPosition(jd);
    var noon = 12 + loc.tz - loc.lon / 15 - s.equation;

    var sunset = hourAngle(0.833, loc.lat, s.declination);
    var fajr = hourAngle(18, loc.lat, s.declination);
    var isha = hourAngle(17, loc.lat, s.declination);

    // Asr: the sun's ALTITUDE when an object's shadow equals its own
    // length plus the noon shadow. Shadow factor 1.
    //
    // hourAngle() takes a DEPRESSION — degrees below the horizon — so an
    // altitude has to be passed negated. Passing it unnegated put Asr at
    // 21:54 for Lagos: the solver quietly found the symmetric solution
    // below the horizon instead of the one above it, and returned a time
    // that is arithmetically valid and obviously wrong.
    var z = Math.abs(loc.lat - s.declination);
    var asrAltitude = Math.atan(1 / (1 + Math.tan(z * D2R))) * R2D;
    var asr = hourAngle(-asrAltitude, loc.lat, s.declination);

    var t = {};
    if (fajr !== null) t.Fajr = noon - fajr;
    if (sunset !== null) t.Sunrise = noon - sunset;
    t.Dhuhr = noon + 1 / 60;
    if (asr !== null) t.Asr = noon + asr;
    if (sunset !== null) t.Maghrib = noon + sunset;
    if (isha !== null) t.Isha = noon + isha;
    return t;
  }

  function hhmm(h) {
    if (h == null) return '—';
    h = ((h % 24) + 24) % 24;
    var m = Math.round(h * 60);
    return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60);
  }

  function isArabic() { return document.documentElement.lang === 'ar'; }

  var ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  var ARABIC = {
    Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر',
    Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء'
  };

  // Lagos wall-clock hours, from the reader's own clock wherever they are.
  function lagosHours(now) {
    var p = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit',
      second: '2-digit', hour12: false
    }).formatToParts(now).reduce(function (a, x) { a[x.type] = x.value; return a; }, {});
    return (+p.hour) + (+p.minute) / 60 + (+p.second) / 3600;
  }

  function nextPrayer(times, nowH) {
    for (var i = 0; i < ORDER.length; i++) {
      var k = ORDER[i];
      if (k === 'Sunrise') continue;                   // not a prayer
      if (times[k] != null && times[k] > nowH) return { name: k, at: times[k] };
    }
    return { name: 'Fajr', at: (times.Fajr || 5) + 24 }; // tomorrow's
  }

  function renderPrayer() {
    var band = $('[data-prayer-band]');
    if (!band) return;
    var now = new Date();
    var t = prayerTimes(now, LAGOS);
    var nowH = lagosHours(now);
    var next = nextPrayer(t, nowH);

    var nameEl = $('[data-prayer-name]', band);
    var timeEl = $('[data-prayer-time]', band);
    var cdEl = $('[data-prayer-countdown]', band);
    if (nameEl) nameEl.textContent = isArabic() ? (ARABIC[next.name] || next.name) : next.name;
    if (timeEl) timeEl.textContent = hhmm(next.at);
    if (cdEl) {
      var mins = Math.max(0, Math.round((next.at - nowH) * 60));
      /* The band is chrome and appears on every page of both trees, so
         its two written strings — the prayer's name and the countdown —
         follow the document's language rather than the build's default. */
      cdEl.textContent = isArabic()
        ? 'بعد ' + (mins >= 60 ? Math.floor(mins / 60) + ' س ' : '') + (mins % 60) + ' د'
        : 'in ' + (mins >= 60 ? Math.floor(mins / 60) + 'h ' : '') + (mins % 60) + 'm';
    }

    // The full table, where the page carries one.
    ORDER.forEach(function (k) {
      var cell = $('[data-prayer="' + k.toLowerCase() + '"]');
      if (cell) cell.textContent = hhmm(t[k]);
      var row = cell && cell.closest('[data-prayer-row]');
      if (row) row.classList.toggle('is-next', k === next.name);
    });
  }

  /* ===================================================================
     2 · THE HIJRĪ DATE
     Not every engine ships the Islamic calendar; where it is absent the
     Gregorian stands alone rather than the line breaking.
     =================================================================== */
  function hijri(now, opts) {
    try {
      return new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', opts).format(now);
    } catch (e) { return ''; }
  }

  function renderDates() {
    var now = new Date();
    var longH = hijri(now, { day: 'numeric', month: 'long', year: 'numeric' });
    var shortH = hijri(now, { day: 'numeric', month: 'short' });
    var g = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    $$('[data-hijri-long]').forEach(function (el) { el.textContent = longH || g; });
    $$('[data-hijri-short]').forEach(function (el) { el.textContent = shortH || ''; });
    $$('[data-gregorian]').forEach(function (el) { el.textContent = g; });
  }

  /* ===================================================================
     3 · THE DAILY WIRD
     -------------------------------------------------------------------
     A small, fixed set, cycled by the day of the year so that the same
     day gives the same reading to every reader. Each entry carries its
     reference, because the whole point is that a reader can check it
     rather than take our word for it.
     =================================================================== */

  var VERSES = [
    { ar: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', en: '“And say: My Lord, increase me in knowledge.”', ref: 'Ṭā-Hā 20:114' },
    { ar: 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ', en: '“It is only those of His servants who have knowledge who fear Allah.”', ref: 'Fāṭir 35:28' },
    { ar: 'وَالرَّاسِخُونَ فِي الْعِلْمِ', en: '“…and those firmly rooted in knowledge.”', ref: 'Āl ʿImrān 3:7' },
    { ar: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ', en: '“Allah raises in rank those of you who believe, and those given knowledge.”', ref: 'Al-Mujādilah 58:11' },
    { ar: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا', en: '“And recite the Qurʾān with measured recitation.”', ref: 'Al-Muzzammil 73:4' },
    { ar: 'أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ', en: '“Will they not then reflect upon the Qurʾān?”', ref: 'Muḥammad 47:24' },
    { ar: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ', en: '“And We have certainly made the Qurʾān easy to remember — so is there any who will remember?”', ref: 'Al-Qamar 54:17' }
  ];

  var HADITH = [
    { en: '“The best of you are those who learn the Qurʾān and teach it.”', ref: 'Ṣaḥīḥ al-Bukhārī 5027' },
    { en: '“Whoever treads a path in search of knowledge, Allah makes easy for him a path to Paradise.”', ref: 'Ṣaḥīḥ Muslim 2699' },
    { en: '“Seeking knowledge is an obligation upon every Muslim.”', ref: 'Sunan Ibn Mājah 224' },
    { en: '“One who recites the Qurʾān proficiently is with the noble, obedient scribes.”', ref: 'Ṣaḥīḥ al-Bukhārī 4937' },
    { en: '“Allah loves that when one of you does a work, he does it with excellence.”', ref: 'Al-Bayhaqī, Shuʿab al-Īmān 5312' },
    { en: '“Convey from me, even a single verse.”', ref: 'Ṣaḥīḥ al-Bukhārī 3461' },
    { en: '“The superiority of the scholar over the worshipper is like my superiority over the least of you.”', ref: 'Sunan al-Tirmidhī 2685' }
  ];

  function dayIndex(now) {
    var start = Date.UTC(now.getUTCFullYear(), 0, 0);
    return Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 86400000);
  }

  function renderWird() {
    var host = $('[data-wird]');
    if (!host) return;
    var i = dayIndex(new Date());
    var v = VERSES[i % VERSES.length], h = HADITH[i % HADITH.length];
    var set = function (sel, txt) { var el = $(sel, host); if (el) el.textContent = txt; };
    set('[data-wird-verse-ar]', v.ar);
    set('[data-wird-verse-en]', v.en);
    set('[data-wird-verse-ref]', v.ref);
    set('[data-wird-hadith-en]', h.en);
    set('[data-wird-hadith-ref]', h.ref);
  }

  /* ===================================================================
     4 · THE COLLEGE, RIGHT NOW
     The registry's own clock, and whether its offices are open at this
     moment — read against the hours the offices actually keep.
     =================================================================== */

  // 0 = Sunday. Monday–Thursday 09:00–17:00, Friday 09:00–12:00.
  var HOURS = { 1: [9, 17], 2: [9, 17], 3: [9, 17], 4: [9, 17], 5: [9, 12] };

  function renderNow() {
    var host = $('[data-rightnow]');
    if (!host) return;
    var now = new Date();
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Lagos', weekday: 'short', hour: '2-digit',
      minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(now).reduce(function (a, x) { a[x.type] = x.value; return a; }, {});

    var clock = $('[data-now-clock]', host);
    if (clock) clock.textContent = parts.hour + ':' + parts.minute + ':' + parts.second;

    var dayIdx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    var span = HOURS[dayIdx];
    var h = (+parts.hour) + (+parts.minute) / 60;
    var open = Boolean(span) && h >= span[0] && h < span[1];

    var state = $('[data-now-state]', host);
    if (state) {
      state.textContent = open ? 'Open now' : 'Closed';
      state.className = 'rightnow__state ' + (open ? 'is-open' : 'is-closed');
    }
    var today = $('[data-now-hours]', host);
    if (today) {
      today.textContent = span
        ? pad(span[0]) + ':00 – ' + pad(span[1]) + ':00'
        : 'Closed today';
    }
  }

  /* ===================================================================
     5 · THE PERSONALISATION CENTRE
     Livery, ornament and text size. Written to the document element and
     remembered on this device — no account, no server.
     =================================================================== */

  var PREFS = [
    { key: 'livery', attr: 'data-livery', def: 'sapphire' },
    { key: 'ornament', attr: 'data-ornament', def: 'full' },
    { key: 'textsize', attr: 'data-textsize', def: 'medium' }
  ];

  function applyPrefs() {
    PREFS.forEach(function (p) {
      var v;
      try { v = localStorage.getItem('dar.' + p.key); } catch (e) { v = null; }
      v = v || p.def;
      document.documentElement.setAttribute(p.attr, v);
      $$('[data-pref="' + p.key + '"]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.dataset.value === v));
      });
    });
  }

  function initPersonalise() {
    var panel = $('[data-personalise-panel]');
    var toggle = $('[data-personalise-toggle]');
    if (!panel || !toggle) { applyPrefs(); return; }

    function setOpen(open) {
      panel.toggleAttribute('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
    }

    toggle.addEventListener('click', function () {
      setOpen(panel.hasAttribute('hidden'));
    });
    $$('[data-personalise-close]').forEach(function (b) {
      b.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hasAttribute('hidden')) setOpen(false);
    });
    $$('[data-pref]').forEach(function (b) {
      b.addEventListener('click', function () {
        try { localStorage.setItem('dar.' + b.dataset.pref, b.dataset.value); } catch (e) {}
        applyPrefs();
      });
    });
    applyPrefs();
  }

  /* ===================================================================
     RAKING LIGHT
     A gilt highlight that follows the pointer across display type. It is
     the one ornament here that costs a listener, so it is bound once on
     the document, throttled to a frame, and skipped entirely when the
     reader has asked for less motion or turned ornament off.
     =================================================================== */
  function initRakingLight() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (matchMedia('(hover: none)').matches) return;
    var queued = false, lastX = 0, lastY = 0;

    function paint() {
      queued = false;
      if (document.documentElement.getAttribute('data-ornament') === 'none') return;
      $$('.rake').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > innerHeight + 80) return;
        var x = ((lastX - r.left) / r.width) * 100;
        el.style.setProperty('--rake-x', Math.max(-20, Math.min(120, x)) + '%');
        var d = Math.abs(lastY - (r.top + r.height / 2));
        el.style.setProperty('--rake-o', String(Math.max(0, 1 - d / 260)));
      });
    }

    addEventListener('pointermove', function (e) {
      lastX = e.clientX; lastY = e.clientY;
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }, { passive: true });
  }


  /* =====================================================================
     COUNTING FIGURES

     A number that rises from zero and settles reads as a MEASUREMENT —
     something that was taken. A number that is simply printed reads as a
     claim. That distinction is worth an animation, and it is the only
     reason this exists.

     atelier.js already carries `data-assemble`, which forms a figure
     digit by digit. The two are for different jobs and are deliberately
     not merged: assembling suits a fixed institutional fact (four
     faculties, established 1441), and counting suits a quantity that
     could have come out otherwise (pages held, itqān, days due).

     THREE THINGS THIS GETS RIGHT that a naive counter does not:

       - The element's authored text is the source of truth and is
         restored exactly at the end, including its suffix, its thousands
         separators and its decimals. Nothing is reformatted.
       - `aria-label` carries the final value from the first frame, so a
         screen reader is never read a running total.
       - Every path that cannot animate — reduced motion, no
         IntersectionObserver, an unparseable string — resolves to the
         final text immediately. A statistic must never be capable of
         rendering as a zero that stays.
     ===================================================================== */

  var reducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  function parseFigure(text) {
    // Leading non-numeric (₦, $), the number itself, then any suffix (%, +).
    var m = /^([^\d\-]*)(-?[\d,]*\.?\d+)(.*)$/.exec(text.trim());
    if (!m) return null;
    var raw = m[2].replace(/,/g, '');
    var value = parseFloat(raw);
    if (!isFinite(value)) return null;
    var dot = raw.indexOf('.');
    return {
      prefix: m[1],
      suffix: m[3],
      value: value,
      decimals: dot === -1 ? 0 : raw.length - dot - 1,
      grouped: m[2].indexOf(',') !== -1
    };
  }

  function formatFigure(n, f) {
    var s = f.decimals ? n.toFixed(f.decimals) : String(Math.round(n));
    if (f.grouped) {
      var parts = s.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      s = parts.join('.');
    }
    return f.prefix + s + f.suffix;
  }

  function runCount(el, final, f) {
    var start = null;
    // 1.1s is long enough to be read as motion and short enough that a
    // reader who came for the number is not kept waiting for it.
    var dur = 1100;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min(1, (t - start) / dur);
      // easeOutCubic: fast away, slow into place — a dial settling.
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = p === 1 ? final : formatFigure(f.value * e, f);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var countObserver = null;

  function countFigures(root) {
    var scope = root || document;
    var els = scope.querySelectorAll ? scope.querySelectorAll('[data-count]') : [];
    if (!els.length) return;

    if (!countObserver && window.IntersectionObserver) {
      countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          countObserver.unobserve(e.target);
          var el = e.target;
          runCount(el, el.getAttribute('data-count-final'), JSON.parse(el.getAttribute('data-count-spec')));
        });
      }, { threshold: 0.5 });
    }

    [].forEach.call(els, function (el) {
      if (el.hasAttribute('data-counted')) return;
      el.setAttribute('data-counted', '');
      var final = el.textContent.trim();
      var f = parseFigure(final);
      // An unparseable value — an em dash, a range, a word — is left
      // exactly as authored. Silence is the correct behaviour here.
      if (!f) return;
      el.setAttribute('aria-label', final);
      if (reducedMotion.matches || !countObserver) return;
      el.setAttribute('data-count-final', final);
      el.setAttribute('data-count-spec', JSON.stringify(f));
      el.textContent = formatFigure(0, f);
      countObserver.observe(el);
    });
  }

  // The portal replaces its whole shell on every view change, so it asks
  // for a rescan rather than this file watching the DOM for it.
  window.__rusukhFigures = countFigures;


  /* =====================================================================
     THE ORBIT GATE

     css/rusukh.css gives every card a travelling light — a conic gradient
     rotated through a registered @property, masked to a one-pixel ring.
     It is authored PAUSED, and this turns it on only while the card is on
     screen.

     Why bother: a long page carries sixty of these, and a rotating conic
     gradient is a repaint per frame per element. Sixty of them, most
     below the fold, is a laptop fan for no visual gain. A screenful is
     six to nine.

     Paused rather than removed, deliberately. Removing the class would
     reset --aurum-angle to 0, so a card scrolled back into view would
     snap its highlight to the top-left instead of resuming its turn.
     ===================================================================== */

  var ORBIT = '.card, .r-plate, .r-fac-card, .r-tier-card,' +
              ' .r-standard__cell, .r-standing__item,' +
              ' .stat-tile, .triad';

  var orbitObserver = null;

  function orbits(root) {
    if (reducedMotion.matches || !window.IntersectionObserver) return;
    var els = (root || document).querySelectorAll(ORBIT);
    if (!els.length) return;

    if (!orbitObserver) {
      orbitObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          e.target.classList.toggle('is-lit', e.isIntersecting);
        });
      }, {
        /* A generous margin so a card is already turning by the time it
           is looked at, rather than starting the instant it is seen. */
        rootMargin: '140px 0px 140px 0px',
        threshold: 0
      });
    }

    [].forEach.call(els, function (el) {
      if (el.hasAttribute('data-orbiting')) return;
      el.setAttribute('data-orbiting', '');
      orbitObserver.observe(el);
    });
  }

  window.__rusukhOrbits = orbits;

  /* ------------------------------------------------------------------ */

  // The portal re-renders its shell on every view change, which replaces
  // the node the Hijrī date was written into. Exposing the renderer lets
  // it ask for the date again rather than duplicating the conversion.
  window.__rusukhDates = renderDates;

  function tick() { renderPrayer(); renderNow(); }

  function start() {
    initPersonalise();
    renderDates();
    renderWird();
    tick();
    setInterval(tick, 1000);
    initRakingLight();
    countFigures(document);
    orbits(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
