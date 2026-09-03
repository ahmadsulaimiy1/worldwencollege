/* WEC — My Programme.

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

  /* ── THE STUDY PLAN, IN THE EDITION THE LEARNER OPENED ──────────────
   *
   * /ar/my-programme.html served an Arabic page and told an Arabic
   * learner "Level III — Intermediate Programme", "4 of 10 modules
   * completed", "Start here", and — on the sentence that matters most —
   * "At the published pace of 4 months a level, you would be at 5 of 10
   * modules by now." A pace sentence a learner cannot read is a pace
   * sentence that does nothing except look like a warning.
   *
   * Same rules as the rest: the page's words are here, in both
   * languages; the level's name arrives from the platform in both and
   * pick() selects. */
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';

  function pick(en, ar) { return (AR && ar) ? ar : en; }

  var STATUS_LABEL = AR ? {
    completed: 'أُنجزت',
    in_progress: 'قيد الإنجاز',
    not_started: 'لم تبدأ',
  } : {
    completed: 'Completed',
    in_progress: 'In progress',
    not_started: 'Not started',
  };

  var T = AR ? {
    signIn: 'سجّل الدخول لترى برنامجك.',
    loadFailed: 'تعذّر تحميل برنامجك. أعد المحاولة.',
    levelDot: function (a) { return 'المستوى ' + a.ord + ' · ' + a.name; },
    levelDash: function (a) {
      return 'المستوى ' + a.ord + ' — ' + a.name + ' (الإطار الأوروبي ' + a.cefr + ')';
    },
    resumeEyebrow: 'تابع من حيث توقّفت',
    nextEyebrow: 'التالي',
    nextMeta: function (a) {
      return 'المستوى ' + a.ord + ' · الوحدة ' + a.seq + ' من ' + a.total;
    },
    resumeCta: 'تابع هذه الوحدة',
    openCta: 'افتح هذه الوحدة',
    beginCta: 'ابدأ وحدتك الأولى',
    progressCount: function (a, b) { return a + ' من ' + b + ' وحدة أُنجزت'; },
    startHere: 'ابدأ من هنا',
    continueHere: 'تابع',
    completedTick: 'أُنجزت',
    levelDashPlain: function (a) { return 'المستوى ' + a.ord + ' — ' + a.name; },
    paceBehind: function (m, e, t) {
      return 'على الوتيرة المنشورة، وهي ' + m + ' أشهر للمستوى، لكنت الآن عند ' + e
        + ' من ' + t + ' وحدة.';
    },
    paceAhead: function (m) {
      return 'أنت متقدّم على الوتيرة المنشورة، وهي ' + m + ' أشهر للمستوى.';
    },
    paceOn: function (m) {
      return 'أنت على الوتيرة المنشورة، وهي ' + m + ' أشهر للمستوى.';
    },
    paceFinish: function (d) { return 'وبمعدّلك الحالي تنهي هذا المستوى قرابة ' + d + '.'; },
    paceTooEarly: 'ما زال الوقت مبكرًا على تقدير تاريخ الانتهاء.',
  } : {
    signIn: 'Sign in to see your programme.',
    loadFailed: 'Could not load your programme. Please try again.',
    levelDot: function (a) { return 'Level ' + a.ord + ' · ' + a.name; },
    levelDash: function (a) {
      return 'Level ' + a.ord + ' — ' + a.name + ' (CEFR ' + a.cefr + ')';
    },
    resumeEyebrow: 'Continue where you left off',
    nextEyebrow: 'Next',
    nextMeta: function (a) {
      return 'Level ' + a.ord + ' · module ' + a.seq + ' of ' + a.total;
    },
    resumeCta: 'Resume this module',
    openCta: 'Open this module',
    beginCta: 'Begin your first module',
    progressCount: function (a, b) { return a + ' of ' + b + ' modules completed'; },
    startHere: 'Start here',
    continueHere: 'Continue',
    completedTick: 'Completed',
    levelDashPlain: function (a) { return 'Level ' + a.ord + ' — ' + a.name; },
    paceBehind: function (m, e, t) {
      return 'At the published pace of ' + m + ' months a level, you would be at '
        + e + ' of ' + t + ' modules by now.';
    },
    paceAhead: function (m) {
      return 'You are ahead of the published pace of ' + m + ' months a level.';
    },
    paceOn: function (m) {
      return 'You are on the published pace of ' + m + ' months a level.';
    },
    paceFinish: function (d) { return 'At your current rate you would finish this level around ' + d + '.'; },
    paceTooEarly: 'It is too early to estimate a finish date.',
  };

  /** A level named the way the reader's edition names it. */
  function levelNames(l) {
    return { ord: pick(l.roman, l.ordinalAr), name: pick(l.name, l.nameAr), cefr: l.cefr };
  }

  function fail(err) {
    $('#planError').textContent = err.status === 401
      ? T.signIn
      : (err.message || T.loadFailed);
  }

  // Each state is a different situation and gets a different sentence.
  // Collapsing them into one "nothing to show" message is how a learner
  // who has finished the programme gets told they are not enrolled.
  var STATES = AR ? {
    no_enrolment: {
      title: 'لم تُقيَّد في مستوى بعد',
      body: 'حين يُثبَّت قيدك تظهر هنا وحدتك الأولى. فإن كنت قد سدّدت وظلّت هذه الرسالة بعد دقائق فاتّصل بالقبول واذكر رقم إيصالك.',
      action: { label: 'القبول', href: '/ar/admissions/' },
    },
    awaiting_content: {
      title: 'هذا المستوى قيد الإعداد',
      body: 'أنت مقيَّد ومقعدك محفوظ. ووحدات هذا المستوى لم تُحمَّل بعد فلا شيء يُفتَح — وهذا خلل عندنا لا قيدٌ على حسابك.',
      action: null,
    },
    units_complete: {
      title: 'أنهيت كلَّ وحدة في هذا المستوى',
      body: 'لا شيء آخر ينتظرك هنا. ومستواك يُعلَن مكتملًا بقرار من الهيئة الأكاديمية لا تلقائيًّا، فتظل هذه الصفحة تعرض عملك حتى يفعلوا.',
      action: null,
    },
    programme_complete: {
      title: 'أتممت كلَّ مستوى قُيِّدت فيه',
      body: 'لا شيء معلَّق. وأيّ شهادة أو كشف درجات يصدر عن أمانة السجل.',
      action: null,
    },
  } : {
    no_enrolment: {
      title: 'You are not enrolled on a level yet',
      body: 'Once your enrolment is confirmed, your first module will appear here. If you have paid and this still shows after a few minutes, contact Admissions and quote your receipt number.',
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
      title: 'You have finished every module at this level',
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
      var ln = levelNames(plan.level);
      $('#levelEyebrow').textContent = T.levelDot(ln);
      $('#progressTitle').textContent = T.levelDash(ln);
    }

    var next = plan.nextUnit;
    if (next) {
      $('#nextCard').hidden = false;
      $('#stateCard').hidden = true;
      // "Continue" and "Begin" are not decoration — they tell a learner
      // whether they are about to lose their place or not.
      $('#nextEyebrow').textContent = next.resuming ? T.resumeEyebrow : T.nextEyebrow;
      // THE TITLE ALREADY CARRIES ITS NUMBER. `units.title` is
      // "Module 2: Asking for Things" straight out of the curriculum,
      // so prefixing it printed "Unit 2 — Module 2: Asking for Things"
      // — the same number twice, under two different words for the
      // same thing. The College publishes MODULES; this page was the
      // last surface still calling them units.
      // The module's title is curriculum text and may be in either
      // language; it takes its own direction rather than the page's.
      $('#nextTitle').textContent = next.title;
      $('#nextTitle').setAttribute('dir', 'auto');
      $('#nextMeta').textContent = plan.level
        ? T.nextMeta({ ord: pick(plan.level.roman, plan.level.ordinalAr),
          seq: next.sequence, total: plan.totalCount })
        : '';
      var cta = $('#nextCta');
      cta.href = next.href;
      cta.textContent = next.resuming ? T.resumeCta : (plan.completedCount ? T.openCta : T.beginCta);
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
    var count = T.progressCount(plan.completedCount, plan.totalCount);
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
      title.textContent = u.title;
      title.setAttribute('dir', 'auto');

      var status = document.createElement('span');
      status.className = 'mp-unit__status';
      status.textContent = u.id === nextId
        ? (plan.nextUnit.resuming ? T.continueHere : T.startHere)
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
      parts.push(T.paceBehind(pace.designMonths, expected, plan.totalCount));
    } else if (pace.standing === 'ahead') {
      parts.push(T.paceAhead(pace.designMonths));
    } else {
      parts.push(T.paceOn(pace.designMonths));
    }

    if (pace.projectable && pace.projectedFinish) {
      parts.push(T.paceFinish(formatDate(pace.projectedFinish)));
    } else if (pace.elapsedDays < 14) {
      // Saying nothing here would read as a missing feature. Saying why
      // reads as a system that knows what it does not yet know.
      parts.push(T.paceTooEarly);
    }
    return parts.join(' ');
  }

  function formatDate(iso) {
    var d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d.getTime())) return iso;
    try {
      return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) { return iso; }
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
    // Logical, not left: the bar fills from the reading edge, so on the
    // Arabic edition the marker has to be measured from the right or it
    // sits at the mirror image of where the learner actually is.
    marker.style.insetInlineStart = pct + '%';
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
      name.textContent = T.levelDashPlain(levelNames(l));
      var tick = document.createElement('span');
      tick.style.color = 'var(--ink-soft)';
      tick.textContent = T.completedTick;
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
    return window.WEC_LC_data.studyPlan().then(render).catch(fail);
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
