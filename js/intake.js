/* =========================================================
   THE INTAKE PANEL
   ---------------------------------------------------------
   A live countdown to the close of the next intake, and the
   number of places open in it.

   WHY IT IS COMPUTED AND NOT WRITTEN. A countdown with a
   hard-coded target is a countdown that expires, and an
   expired countdown is worse than none: it tells every
   visitor that nobody has looked at this page since the date
   it names. The three intakes are stated in the markup as a
   month and a day each — 02-28, 06-30, 10-31 — and the next
   occurrence of each is resolved here against the reader's
   own clock. When the Autumn close passes, the next close is
   the following Spring, without anybody editing anything.

   WHICH CLOCK. The reader's own. An applicant in Jakarta
   deciding whether they still have time should be told in
   the time they are living in, not in London's — a deadline
   that appears to have passed because of an eight-hour offset
   costs the College an application. The close is taken as the
   end of that day, 23:59 local, which is also the reading
   most favourable to the applicant and therefore the honest
   one to publish.

   REDUCED MOTION. The digits update on a timer rather than by
   animating, so there is nothing here for prefers-reduced-
   motion to carve out — the panel is legible and complete on
   the first paint, and the ticking is a text change.
   ========================================================= */
(function () {
  var panels = [].slice.call(document.querySelectorAll('[data-intake]'));
  if (!panels.length) return;

  function nextOccurrence(md, now) {
    var parts = md.split('-');
    var m = parseInt(parts[0], 10) - 1;
    var d = parseInt(parts[1], 10);
    // 23:59:59 local — a day named as a deadline is a day the
    // applicant has, not a day that ended at midnight the night before.
    var candidate = new Date(now.getFullYear(), m, d, 23, 59, 59, 0);
    if (candidate.getTime() <= now.getTime()) {
      candidate = new Date(now.getFullYear() + 1, m, d, 23, 59, 59, 0);
    }
    return candidate;
  }

  panels.forEach(function (panel) {
    var rows = [].slice.call(panel.querySelectorAll('[data-intake-close]'));
    if (!rows.length) return;

    var dEl = panel.querySelector('[data-count-days]');
    var hEl = panel.querySelector('[data-count-hours]');
    var mEl = panel.querySelector('[data-count-mins]');
    var nameEl = panel.querySelector('[data-next-name]');
    var beginsEl = panel.querySelector('[data-next-begins]');

    var isAr = document.documentElement.lang === 'ar';
    var dateFmt = new Intl.DateTimeFormat(isAr ? 'ar-u-ca-gregory-nu-latn' : 'en-GB',
      { calendar: 'gregory', day: 'numeric', month: 'long' });

    function pad(v) { return v < 10 ? '0' + v : String(v); }

    function tick() {
      var now = new Date();

      // Which intake closes soonest, and mark it on the list so the
      // panel and the countdown can never name two different ones.
      var soonest = null;
      rows.forEach(function (row) {
        var when = nextOccurrence(row.getAttribute('data-intake-close'), now);
        row.classList.remove('is-next');
        if (!soonest || when < soonest.when) soonest = { row: row, when: when };
      });
      if (!soonest) return;
      soonest.row.classList.add('is-next');

      var ms = soonest.when.getTime() - now.getTime();
      var mins = Math.max(0, Math.floor(ms / 60000));
      var days = Math.floor(mins / 1440);
      var hours = Math.floor((mins % 1440) / 60);
      var minutes = mins % 60;

      if (dEl) dEl.textContent = String(days);
      if (hEl) hEl.textContent = pad(hours);
      if (mEl) mEl.textContent = pad(minutes);
      if (nameEl) nameEl.textContent = soonest.row.getAttribute('data-intake-name') || '';
      if (beginsEl) {
        var begins = soonest.row.getAttribute('data-intake-begins');
        if (begins) {
          var b = begins.split('-');
          var when = new Date(soonest.when.getFullYear(), parseInt(b[0], 10) - 1, parseInt(b[1], 10));
          // Teaching begins AFTER the close, so a close in late December
          // pointing at a March start belongs to the following year.
          if (when < soonest.when) when.setFullYear(when.getFullYear() + 1);
          beginsEl.textContent = dateFmt.format(when);
        }
      }
    }

    tick();
    // Once a minute: the smallest unit shown is a minute, so a faster
    // interval would repaint identical text and keep a timer alive on a
    // phone for nothing.
    setInterval(tick, 60000);
  });
})();
