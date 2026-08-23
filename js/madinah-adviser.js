/* ═══════════════════════════════════════════════════════════════════
   WHERE TO BEGIN — the adviser
   ═══════════════════════════════════════════════════════════════════

   The Founder asked for something better than "Find Your Track", and was
   explicit about what it must not be: not a marketing quiz, not a sales
   funnel, but an academic adviser. That distinction is structural, not
   tonal, and three rules follow from it.

   1. IT RECOMMENDS MORE THAN ONE ROUTE, AND SAYS WHY EACH. A quiz sorts
      you into the answer. An adviser lays out what is open to you, gives
      the reason for each, and leaves the choosing where it belongs. So
      this never returns a single "match" and never scores anything.

   2. IT NAMES WHAT COMES NEXT. Every route carries the programme it
      leads to, because a College should answer "and then?" before it is
      asked.

   3. IT DECLINES WHEN IT SHOULD. Where an answer touches a limit — a
      pace below the minimum the Regulations require, a faculty that is
      not open, study without certification — it says so plainly rather
      than routing around it. An adviser who only ever encourages is not
      an adviser.

   THE ROUTES ARE DATA IN THE PAGE, not strings in this file. Each tree
   authors its own <template data-route="…"> and this script only decides
   which ids apply, so the reasoning is shared and the language is not —
   the same arrangement the Form of Application uses.

   NOTHING IS SENT ANYWHERE. No answer leaves the browser.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var form = document.getElementById('adviser');
  if (!form) return;
  var out = document.getElementById('adviser-result');
  var empty = document.getElementById('adviser-empty');
  if (!out) return;

  function val(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value : '';
  }

  /* The reading. Returns route ids in the order they should be offered:
     the first is what the College would ordinarily begin this reader at,
     the rest are the honest alternatives. Notes are caveats, not
     recommendations, and are shown separately. */
  function read() {
    var aim = val('aim'), level = val('level'), prior = val('prior'),
        hours = val('hours'), purpose = val('purpose'), faculty = val('faculty');
    var routes = [], notes = [];

    var beginner = (level === 'none' || level === 'letters');
    var reads = (level === 'read-understand' || level === 'fluent');

    // ---- the principal route, by what the reader came for -------------
    if (aim === 'quran-read') {
      routes.push(beginner ? 'quran-foundation' : 'quran-recitation');
    } else if (aim === 'quran-memorise') {
      routes.push(beginner ? 'quran-foundation' : 'quran-memorisation');
      routes.push('schedules');
    } else if (aim === 'arabic-use') {
      routes.push(reads ? 'arabic-diploma' : 'arabic-asol');
    } else if (aim === 'islamic-sciences') {
      routes.push(reads ? 'islamic-diploma' : 'islamic-foundations');
      if (beginner) routes.push('arabic-asol');
    } else if (aim === 'teach-lead') {
      routes.push('dawah-communication');
      notes.push('pedagogy-not-open');
    } else {
      // undecided: the two doors that ask least of a reader
      routes.push('quran-foundation', 'arabic-asol', 'islamic-foundations');
    }

    // ---- what the reader said they are interested in ------------------
    var byFaculty = {
      quran: 'quran-foundation', arabic: 'arabic-asol',
      islamic: 'islamic-foundations', dawah: 'dawah-communication'
    };
    if (byFaculty[faculty] && routes.indexOf(byFaculty[faculty]) === -1) {
      routes.push(byFaculty[faculty]);
    }
    if (faculty === 'professional') notes.push('professional-not-open');

    // ---- purpose, pace and prior study are CAVEATS, not routes -------
    if (purpose === 'enrichment') {
      if (routes.indexOf('short-courses') === -1) routes.push('short-courses');
      if (routes.indexOf('schedules') === -1) routes.push('schedules');
      notes.push('enrichment');
    }
    if (hours === 'under3') notes.push('pace-below-minimum');
    if (prior === 'madrasah') notes.push('no-certificate-no-bar');
    if (prior === 'institution') notes.push('advanced-standing');
    if (level === 'fluent') notes.push('placed-by-examination');

    return { routes: routes.slice(0, 3), notes: notes };
  }

  function render() {
    var answered = ['aim', 'level', 'prior', 'hours', 'purpose', 'faculty']
      .filter(function (n) { return val(n); }).length;
    if (answered < 3) {
      out.hidden = true;
      if (empty) empty.hidden = false;
      return;
    }
    var r = read();
    out.innerHTML = '';
    r.routes.forEach(function (id, i) {
      var t = document.getElementById('route-' + id);
      if (!t) return;
      var node = t.content.cloneNode(true);
      var wrap = node.querySelector('.adviser__route');
      if (wrap && i === 0) wrap.classList.add('adviser__route--first');
      out.appendChild(node);
    });
    r.notes.forEach(function (id) {
      var t = document.getElementById('note-' + id);
      if (t) out.appendChild(t.content.cloneNode(true));
    });
    out.hidden = false;
    if (empty) empty.hidden = true;
  }

  form.addEventListener('change', render);
  form.addEventListener('input', render);

  var reset = form.querySelector('[data-adviser-reset]');
  if (reset) reset.addEventListener('click', function () {
    form.reset();
    render();
  });

  render();
})();
