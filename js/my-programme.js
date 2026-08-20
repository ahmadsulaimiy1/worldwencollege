/* WEC-LC — My Programme.

   The page that did not exist. The Listening Lab opens at
   /listening-lab.html?unit=<id> and, without that parameter, says "No
   unit specified. Open this page from a module." There was no module
   page, so a signed-in learner could not reach a lesson at all unless
   somebody handed them a unit id. This is the page that hands them one.

   Three rules it is built to:

   1. ONE action. Not a menu. A learner with fifteen minutes should not
      spend three of them deciding where to start, and the server
      already knows the answer.
   2. Resume beats advance. A half-finished unit is where they actually
      are; skipping past it loses their place.
   3. Say what is true and stop. When every unit is done it says every
      unit is done — it does not say the level is passed, because
      whether that follows is governance item B4 and nobody has decided
      it. Inventing that rule here would be inventing it in the one
      place a learner would believe it.
*/
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var STATUS_LABEL = {
    completed: 'Completed',
    in_progress: 'In progress',
    not_started: 'Not started',
  };

  function api(path) {
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      return fetch(path, { headers: headers });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) {
        if (!r.ok) throw Object.assign(new Error(b.message || r.statusText), { status: r.status });
        return b;
      });
    });
  }

  function fail(err) {
    $('#planError').textContent = err.status === 401
      ? 'Sign in to see your programme.'
      : (err.message || 'Could not load your programme. Please try again.');
  }

  // Each state is a different situation and gets a different sentence.
  // Collapsing them into one "nothing to show" message is how a learner
  // who has finished the programme gets told they are not enrolled.
  var STATES = {
    no_enrolment: {
      title: 'You are not enrolled on a level yet',
      body: 'Once your enrolment is confirmed, your first unit will appear here. If you have paid and this still shows after a few minutes, contact Admissions and quote your receipt number.',
      action: { label: 'Admissions', href: '/admissions/' },
    },
    awaiting_content: {
      title: 'This level is being prepared',
      body: 'You are enrolled and your place is held. The modules for this level are not loaded yet, so there is nothing to open — this is a fault on our side, not a limit on your account.',
      action: null,
    },
    units_complete: {
      // Deliberately does NOT say "you have passed" or "the next level
      // is unlocked". Whether finishing the modules completes the level is
      // an academic decision the institution has not taken.
      title: 'You have finished every unit at this level',
      body: 'Nothing further is waiting for you here. Your level is marked complete by academic staff, not automatically, so this page will keep showing your work until they do.',
      action: null,
    },
    programme_complete: {
      title: 'You have completed every level you are enrolled on',
      body: 'There is nothing outstanding. Any certificate or transcript is issued by the Registrar.',
      action: null,
    },
  };

  function render(plan) {
    $('#planError').textContent = '';

    if (plan.level) {
      $('#levelEyebrow').textContent = 'Level ' + plan.level.roman + ' · ' + plan.level.name;
      $('#progressTitle').textContent = 'Level ' + plan.level.roman + ' — ' + plan.level.name +
        ' (CEFR ' + plan.level.cefr + ')';
    }

    var next = plan.nextUnit;
    if (next) {
      $('#nextCard').hidden = false;
      $('#stateCard').hidden = true;
      // "Continue" and "Begin" are not decoration — they tell a learner
      // whether they are about to lose their place or not.
      $('#nextEyebrow').textContent = next.resuming ? 'Continue where you left off' : 'Next';
      $('#nextTitle').textContent = 'Unit ' + next.sequence + ' — ' + next.title;
      $('#nextMeta').textContent = plan.level
        ? 'Level ' + plan.level.roman + ' · unit ' + next.sequence + ' of ' + plan.totalCount
        : '';
      var cta = $('#nextCta');
      cta.href = next.href;
      cta.textContent = next.resuming ? 'Resume this unit' : (plan.completedCount ? 'Open this unit' : 'Begin your first unit');
    } else {
      $('#nextCard').hidden = true;
      var s = STATES[plan.state];
      if (s) {
        $('#stateCard').hidden = false;
        $('#stateTitle').textContent = s.title;
        $('#stateBody').textContent = s.body;
        var slot = $('#stateAction');
        slot.innerHTML = '';
        if (s.action) {
          var a = document.createElement('a');
          a.className = 'tbtn tbtn--primary';
          a.href = s.action.href;
          a.textContent = s.action.label;
          slot.appendChild(a);
        }
      }
      $('#planSub').textContent = '';
    }

    renderUnits(plan);
    renderCompleted(plan.completedLevels);
  }

  function renderUnits(plan) {
    var box = $('#modules');
    box.innerHTML = '';
    if (!plan.units || !plan.units.length) { $('#progressCard').hidden = true; return; }
    $('#progressCard').hidden = false;

    // A fraction, not a percentage: "4 of 10 modules" names the work left,
    // which is what a learner is actually asking.
    var count = plan.completedCount + ' of ' + plan.totalCount + ' modules completed';
    $('#progressCount').textContent = count;
    var pct = plan.totalCount ? Math.round((plan.completedCount / plan.totalCount) * 100) : 0;
    $('#progressFill').style.width = pct + '%';
    // The bar is decoration over the text; give it the same meaning
    // rather than a bare percentage a screen reader can do nothing with.
    $('#progressBar').setAttribute('aria-label', count);

    renderPace(plan);

    var nextId = plan.nextUnit ? plan.nextUnit.id : null;
    plan.units.forEach(function (u) {
      var row = document.createElement('a');
      row.className = 'mp-unit' +
        (u.status === 'completed' ? ' is-done' : '') +
        (u.id === nextId ? ' is-current' : '');
      row.href = u.href;

      var seq = document.createElement('span');
      seq.className = 'mp-unit__seq';
      // A tick for finished modules reads faster than a number, and the
      // number has already done its job by then.
      seq.textContent = u.status === 'completed' ? '✓' : String(u.sequence);
      seq.setAttribute('aria-hidden', 'true');

      var title = document.createElement('span');
      title.className = 'mp-unit__title';
      title.textContent = 'Unit ' + u.sequence + ' — ' + u.title;

      var status = document.createElement('span');
      status.className = 'mp-unit__status';
      status.textContent = u.id === nextId
        ? (plan.nextUnit.resuming ? 'Continue' : 'Start here')
        : (STATUS_LABEL[u.status] || u.status);

      row.appendChild(seq); row.appendChild(title); row.appendChild(status);
      box.appendChild(row);
    });
  }

  // Pace: the learner's own rate against the published four months a
  // level. Written as information, not a verdict.
  //
  // The wording is the feature. "You are behind" is a judgement a
  // learner can only receive; "at the published pace you would be at
  // module 5" is a fact they can act on, and it names the gap in the
  // unit they work in. Nothing here threatens: access does not expire,
  // nothing is withdrawn, and no such policy exists to reference.
  //
  // A learner three weeks behind in month two can still fix it. One who
  // finds out in month eleven cannot. That is the whole argument for
  // showing it at all — so it is stated early, plainly, and without
  // drama.
  function paceSentence(pace, plan) {
    var parts = [];
    var expected = pace.expectedByNow;

    if (pace.standing === 'behind') {
      parts.push('At the published pace of ' + pace.designMonths + ' months a level, you would be at '
        + expected + ' of ' + plan.totalCount + ' modules by now.');
    } else if (pace.standing === 'ahead') {
      parts.push('You are ahead of the published pace of ' + pace.designMonths + ' months a level.');
    } else {
      parts.push('You are on the published pace of ' + pace.designMonths + ' months a level.');
    }

    if (pace.projectable && pace.projectedFinish) {
      parts.push('At your current rate you would finish this level around ' + formatDate(pace.projectedFinish) + '.');
    } else if (pace.elapsedDays < 14) {
      // Saying nothing here would read as a missing feature. Saying why
      // reads as a system that knows what it does not yet know.
      parts.push('It is too early to estimate a finish date.');
    }
    return parts.join(' ');
  }

  function formatDate(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function renderPace(plan) {
    var note = $('#paceNote');
    var marker = $('#paceMarker');
    var pace = plan.pace;
    if (!pace || !plan.totalCount) { note.hidden = true; marker.hidden = true; return; }

    note.hidden = false;
    note.textContent = paceSentence(pace, plan);
    note.className = 'mp-pace is-' + pace.standing;

    // The marker sits on the same bar as the learner's progress, so the
    // gap is visible without reading two numbers and subtracting.
    var pct = Math.min(100, (pace.expectedByNow / plan.totalCount) * 100);
    marker.hidden = false;
    marker.style.left = pct + '%';
  }

  function renderCompleted(levels) {
    var card = $('#doneCard');
    if (!levels || !levels.length) { card.hidden = true; return; }
    card.hidden = false;
    var box = $('#doneLevels');
    box.innerHTML = '';
    levels.forEach(function (l) {
      var row = document.createElement('div');
      row.className = 'mp-done-level';
      var name = document.createElement('span');
      name.textContent = 'Level ' + l.roman + ' — ' + l.name;
      var tick = document.createElement('span');
      tick.style.color = 'var(--ink-soft)';
      tick.textContent = 'Completed';
      row.appendChild(name); row.appendChild(tick);
      box.appendChild(row);
    });
  }

  function offline() {
    function update() { document.body.classList.toggle('is-offline', !navigator.onLine); }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  function load() {
    return api('/api/student/study-plan').then(render).catch(fail);
  }

  document.addEventListener('DOMContentLoaded', function () {
    offline();
    var guarded = window.WEC_LC_guardPortal({
      signOutRedirect: '/',
      shellSelector: '.lab-body',
      onAuthenticated: function (clerk, done) {
        window.WEC_LC_apiAuth.attach(clerk);
        done();
        load();
      },
    });
    if (!guarded) load();
  });
})();
