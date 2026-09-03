/* WEC-LC — Where I Stand.
 *
 * The interface for GET /api/student/standing and GET /api/student/achievements.
 * Items 3 and 5 of the interface backlog, closed together because they
 * answer one question between them: what the College has measured about
 * this learner, and what remains before an award.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE ONE THING THIS PAGE MUST NOT DO
 * ─────────────────────────────────────────────────────────────────────
 * It must not tell a learner they have fallen short of a record the
 * COLLEGE has not made.
 *
 * `levelConditions()` gives every condition three states — true, false,
 * null — and an `owner`. Four of the six level gates are examination
 * records the schema does not hold at all, so today they are `null` and
 * owned by the College; a learner whose ten modules are complete has
 * done everything asked of them and their award waits on a table nobody
 * has built. Flattening that into "not eligible" would put the
 * platform's unfinished work on their record as their shortfall, and
 * `graduationPosition()` has a `conditional` state precisely so it does
 * not have to.
 *
 * So the conditions are drawn in two groups, headed by whose they are,
 * and the College's group carries a sentence saying nothing in it counts
 * against the reader. Everything else on this page follows from that.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NULL IS NOT ZERO, ANYWHERE
 * ─────────────────────────────────────────────────────────────────────
 * A GPA with nothing conferred is null and prints as a sentence, never
 * as 0.00. A level mark that cannot be computed prints WHICH record is
 * missing. A skill with no approved mapping prints that no assessment
 * evidences it yet. In each case a zero would be a mark, and the truth
 * is the absence of one.
 *
 * Every value reaches the page through textContent.
 */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var AR = document.documentElement.lang === 'ar';
  var LOCALE = AR ? 'ar' : 'en-GB';
  /* The achievements endpoint returns {en, ar} pairs on every human
     string, so the page picks rather than translates. Where `ar` is
     absent the English stands: a definition inserted by hand carries no
     Arabic, and an empty line would be worse than an untranslated one. */
  var pick = function (pair) {
    if (!pair) return '';
    if (typeof pair === 'string') return pair;
    return (AR && pair.ar) ? pair.ar : (pair.en || '');
  };

  var T = AR ? {
    loading: 'جارٍ تحميل وضعك…',
    signedOut: 'لست مسجَّل الدخول.',
    signedOutRest: 'وضعك الأكاديمي خاصٌّ بك. سجّل الدخول لتراه.',
    failed: 'تعذّر تحميل وضعك.',
    failedRest: 'هذا خللٌ عندنا. أعد المحاولة بعد قليل.',
    noEnrolment: 'لا قيد قائمًا.',
    noEnrolmentRest: 'يبدأ قياس الوضع الأكاديمي عند قيدك في مستوى.',
    bands: {
      in_good_standing: 'وضع سليم',
      under_review: 'قيد المراجعة',
      suspended_progression: 'تعليق الترقّي',
    },
    standingLabel: 'الوضع الأكاديمي',
    gpaNone: 'لم تُمنح شهادة بعد، فلا معدّل يُحسب',
    creditsOf: function (a, b) { return a + ' من ' + b; },
    levelsOf: function (a, b) { return a + ' من ' + b; },
    levelTitle: function (roman, name) { return 'المستوى ' + roman + ' — ' + name; },
    markStates: {
      marked: 'مُصحَّح',
      examination_not_recorded: 'لا يمكن حساب درجة المستوى: لم يُسجَّل امتحان المستوى في أي جدول بعد.',
      coursework_incomplete: 'لا يمكن حساب درجة المستوى بعد: لم تكتمل وحدات الفصل.',
    },
    moduleStates: {
      marked: 'مُصحَّح',
      not_attempted: 'لم يُبدأ',
      awaiting_marking: 'بانتظار التصحيح',
      one_component: 'شطر واحد',
      not_assessable: 'لم تُؤلَّف مكوّناته بعد',
    },
    noMark: '—',
    skillUnmapped: 'لا تقييمَ يشهد لهذه المهارة بعد',
    skills: { skl_listening: 'الاستماع', skl_speaking: 'التحدث', skl_reading: 'القراءة', skl_writing: 'الكتابة' },
    skillStates: {
      no_approved_mapping: 'لا يحمل أي تقييم ربطًا معتمَدًا بهذه المهارة بعد، فلا شيء يشهد لها.',
      examination_not_recorded: 'الربط قائم، ولم يُسجَّل امتحان المستوى الذي تحتاجه هذه المهارة.',
    },
    conditionsMet: 'كل الشروط متحقّقة.',
    positions: {
      conferred: 'مُنحت شهادة هذا المستوى.',
      eligible: 'كل شروط الشهادة متحقّقة.',
      conditional: 'كل ما طُلب منك متحقّق. وما بقي سجلٌّ على الكلية.',
      not_eligible: 'بقي عليك شيء قبل الشهادة، وهو مذكور أدناه.',
    },
    earnedOn: function (d) { return 'نِيلت في ' + d; },
    withdrawnOn: function (d) { return 'سُحبت في ' + d; },
    shortfall: 'ما ينقص',
    observedOf: function (a, b) { return 'بلغتَ ' + a + ' من ' + b; },
    evidence: 'البيّنة',
    milestoneEarned: 'منالة',
    milestoneUnearned: 'لم تُنَل بعد',
    milestoneWithdrawn: 'مسحوبة',
    milestoneNotInForce: 'غير نافذة',
  } : {
    loading: 'Loading your standing…',
    signedOut: 'You are not signed in.',
    signedOutRest: 'Your academic standing is private to you. Sign in to see it.',
    failed: 'Your standing could not be loaded.',
    failedRest: 'This is a fault on our side. Please try again shortly.',
    noEnrolment: 'You have no live enrolment.',
    noEnrolmentRest: 'Academic standing is measured per enrolment, and it begins when you are enrolled at a level.',
    bands: {
      in_good_standing: 'In good standing',
      under_review: 'Under review',
      suspended_progression: 'Suspended progression',
    },
    standingLabel: 'Academic standing',
    gpaNone: 'No award has been conferred yet, so no average can be computed',
    creditsOf: function (a, b) { return a + ' of ' + b; },
    levelsOf: function (a, b) { return a + ' of ' + b; },
    levelTitle: function (roman, name) { return 'Level ' + roman + ' — ' + name; },
    markStates: {
      marked: 'Marked',
      examination_not_recorded: 'The level mark cannot be computed: no level examination is recorded by any table yet.',
      coursework_incomplete: 'The level mark cannot be computed yet: the coursework is not complete.',
    },
    moduleStates: {
      marked: 'Marked',
      not_attempted: 'Not begun',
      awaiting_marking: 'Awaiting marking',
      one_component: 'One component',
      not_assessable: 'Not yet authored',
    },
    noMark: '—',
    skillUnmapped: 'No assessment evidences this skill yet',
    skills: { skl_listening: 'Listening', skl_speaking: 'Speaking', skl_reading: 'Reading', skl_writing: 'Writing' },
    skillStates: {
      no_approved_mapping: 'No assessment carries an approved mapping to this skill yet, so nothing evidences it.',
      examination_not_recorded: 'The mapping exists; the level examination this skill needs is not recorded.',
    },
    conditionsMet: 'Every condition is met.',
    positions: {
      conferred: 'This level’s award has been conferred.',
      eligible: 'Every condition of the award is met.',
      conditional: 'Everything asked of you is met. What remains is a record the College owes.',
      not_eligible: 'Something remains with you before the award, and it is named below.',
    },
    earnedOn: function (d) { return 'Earned ' + d; },
    withdrawnOn: function (d) { return 'Withdrawn ' + d; },
    shortfall: 'What is short',
    observedOf: function (a, b) { return a + ' of ' + b + ' so far'; },
    evidence: 'Evidence',
    milestoneEarned: 'Held',
    milestoneUnearned: 'Not yet held',
    milestoneWithdrawn: 'Withdrawn',
    milestoneNotInForce: 'Not in force',
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null && text !== '') n.textContent = text;
    return n;
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00Z' : iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  /* A percentage, or the absence of one said as an absence. Never 0. */
  function pct(v) {
    return Number.isFinite(v) ? v.toFixed(1) + '%' : T.noMark;
  }

  var authHeaders = {};
  function api(path) {
    return fetch(path, { headers: Object.assign({ Accept: 'application/json' }, authHeaders) })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d }; });
      });
  }

  function state(strong, rest) {
    var box = $('#state');
    box.textContent = '';
    if (strong) box.appendChild(el('strong', null, strong + ' '));
    box.appendChild(document.createTextNode(rest || ''));
  }

  // ── The standing ───────────────────────────────────────────────────
  function renderStanding(s) {
    var sec = $('#secStanding');
    sec.hidden = false;

    var band = s.standing;
    // The eyebrow names the QUANTITY and the heading gives its value.
    // Both said the band, so the plate read "IN GOOD STANDING / In good
    // standing" — a heading and its own label, twice.
    $('[data-standing-band]').textContent = T.standingLabel;
    // `academicStandingFor()` returns a band and a statement and no
    // headline; the band IS the headline, and the statement is the
    // sentence under it.
    $('[data-standing-title]').textContent = band
      ? (T.bands[band.standing] || band.standing) : T.bands.in_good_standing;
    $('[data-standing-what]').textContent = band && band.statement ? band.statement : '';

    // NULL, NOT 0.00. `gradePointAverage()` returns null when nothing
    // has been conferred, and printing a zero against a learner who has
    // not been examined would report the platform's position as theirs.
    // `cumulative`, which is null — never 0.00 — until an award has
    // been conferred. See gradePointAverage(): revoked, replaced and
    // not-conferred all contribute nothing and none of them contributes
    // a zero.
    $('[data-gpa]').textContent = (s.gpa && Number.isFinite(s.gpa.cumulative))
      ? s.gpa.cumulative.toFixed(2) : T.gpaNone;
    $('[data-credits]').textContent = T.creditsOf(s.programme.creditsHeld, s.programme.creditsRequired);
    $('[data-levels]').textContent = T.levelsOf(s.programme.levelsHeld.length, s.programme.levelsRequired.length);
    $('[data-regulation]').textContent = s.regulationVersion || T.noMark;

    var owed = band && band.obligations && band.obligations.length ? band.obligations : [];
    var wrap = $('[data-obligations]');
    wrap.hidden = owed.length === 0;
    if (owed.length) {
      var list = $('[data-obligation-list]');
      list.textContent = '';
      owed.forEach(function (o) { list.appendChild(el('li', null, o)); });
    }
  }

  // ── The current level ──────────────────────────────────────────────
  function renderLevel(level) {
    var sec = $('#secLevel');
    if (!level) { sec.hidden = true; return; }
    sec.hidden = false;

    $('[data-level-title]').textContent = T.levelTitle(level.roman || level.levelId, level.name || '');
    $('[data-level-mark]').textContent = level.levelMark.state === 'marked'
      ? level.levelMark.mark + '% — ' + (level.levelMark.grade || '')
      : (T.markStates[level.levelMark.state] || level.levelMark.state);

    var body = $('[data-modules]');
    body.textContent = '';
    level.modules.forEach(function (m) {
      var tr = el('tr');
      tr.appendChild(el('td', null, m.sequence + '. ' + m.title));
      tr.appendChild(el('td', null, m.quiz ? pct(m.quiz.countingMark) : T.noMark));
      tr.appendChild(el('td', null, m.assignment ? pct(m.assignment.countingMark) : T.noMark));
      tr.appendChild(el('td', 'acc-num', Number.isFinite(m.mark) ? m.mark + '%' : T.noMark));

      var pill = el('span', 'acc-pill acc-pill--'
        + (m.complete ? 'received' : m.state === 'awaiting_marking' ? 'pending' : ''),
        T.moduleStates[m.state] || m.state);
      var cell = el('td'); cell.appendChild(pill);
      // A resit is a fact about the mark, and `resit.cap` means the
      // counting mark is not the achieved one. Saying so where it
      // applies is what stops a learner reading a capped 70 as the mark
      // they got.
      if (m.resat) cell.appendChild(el('p', 'acc-relief__note', AR ? 'أُعيد، والدرجة المحتسبة محدودة عند درجة النجاح.' : 'Resat — the counting mark is capped at the pass mark.'));
      tr.appendChild(cell);
      body.appendChild(tr);
    });

    var skills = $('[data-skills]');
    skills.textContent = '';
    (level.skills || []).forEach(function (sk) {
      var li = el('li');
      li.appendChild(el('span', 'std-skill__name', T.skills[sk.skillId] || sk.skillId));
      li.appendChild(el('span', 'std-skill__mark',
        Number.isFinite(sk.mark) ? sk.mark + '%' : T.noMark));
      // WHY there is no mark, not merely that there is none. The two
      // reasons are different — no assessment maps to the skill at all,
      // or the mapping exists and the examination it needs is not
      // recorded — and only the first is something the College could
      // fix by mapping an assessment.
      if (!Number.isFinite(sk.mark)) {
        li.setAttribute('data-unmapped', '');
        li.appendChild(el('p', 'acc-relief__note', T.skillStates[sk.state] || T.skillUnmapped));
      }
      skills.appendChild(li);
    });
  }

  // ── What remains, split by whose it is ─────────────────────────────
  function conditionItem(c) {
    var li = el('li');
    li.setAttribute('data-met', c.met === true ? 'yes' : c.met === false ? 'no' : 'unknown');
    /* THE COLOUR FOLLOWS THE OWNER; THE MARK FOLLOWS THE STATE.
       Two of the College's own conditions are genuinely `met: false` —
       no member of staff has confirmed the level, no assessment carries
       a skill mapping — and drawn in the learner's failure red inside
       the College's group they read as the learner's failures, in the
       one place on the site built to stop exactly that. The fact stays
       (the mark is still a cross, the sentence still says so); only the
       attribution changes, which is all that was ever wrong. */
    li.setAttribute('data-owner', c.owner === 'learner' ? 'learner' : 'college');
    var mark = el('span', 'std-conditions__mark', c.met === true ? '✓' : c.met === false ? '✕' : '·');
    mark.setAttribute('aria-hidden', 'true');
    li.appendChild(mark);
    var body = el('div');
    body.appendChild(el('p', 'std-conditions__label', c.label));
    body.appendChild(el('p', 'std-conditions__detail', c.detail));
    li.appendChild(body);
    return li;
  }

  function renderConditions(level) {
    var sec = $('#secConditions');
    if (!level) { sec.hidden = true; return; }
    sec.hidden = false;

    var g = level.graduation;
    $('[data-position]').textContent = T.positions[g.state] || '';

    var owedByLearner = g.outstandingConditions.filter(function (c) { return c.owner === 'learner'; });
    var owedByCollege = g.outstandingConditions.filter(function (c) { return c.owner !== 'learner'; });

    var fill = function (groupId, listSel, rows) {
      var group = $('#' + groupId);
      group.hidden = rows.length === 0;
      if (!rows.length) return;
      var list = $(listSel);
      list.textContent = '';
      rows.forEach(function (c) { list.appendChild(conditionItem(c)); });
    };

    fill('grpLearner', '[data-learner-conditions]', owedByLearner);
    fill('grpCollege', '[data-college-conditions]', owedByCollege);
    fill('grpMet', '[data-met-conditions]', g.metConditions || []);
  }

  // ── Milestones ─────────────────────────────────────────────────────
  function milestoneItem(m, kind, extra) {
    var li = el('li');
    li.setAttribute('data-kind', kind);
    var head = el('div', 'std-milestone__head');
    head.appendChild(el('span', 'std-milestone__name', pick(m.name)));
    head.appendChild(el('span', 'acc-pill acc-pill--' + (kind === 'earned' ? 'received' : kind === 'withdrawn' ? 'failed' : ''),
      kind === 'earned' ? T.milestoneEarned
        : kind === 'withdrawn' ? T.milestoneWithdrawn
          : kind === 'notInForce' ? T.milestoneNotInForce : T.milestoneUnearned));
    li.appendChild(head);
    li.appendChild(el('p', 'std-milestone__fact', pick(m.academicFact)));
    if (extra) li.appendChild(extra);
    return li;
  }

  function renderMilestones(a) {
    var sec = $('#secMilestones');
    sec.hidden = false;
    $('[data-register-note]').textContent = pick(a.register.statement);

    var list = $('[data-milestones]');
    list.textContent = '';

    a.earned.forEach(function (m) {
      var note = el('p', 'std-milestone__note',
        T.earnedOn(fmtDate(m.earnedOn))
        + (m.evidence && m.evidence.source ? ' · ' + T.evidence + ': ' + m.evidence.source : ''));
      list.appendChild(milestoneItem(m, 'earned', note));
    });
    a.unearned.forEach(function (m) {
      // The SHORTFALL, named. A milestone not held that sits blank
      // tells a learner they have not won a prize; one that names what
      // is short tells them what to do next, which is the only reason
      // to publish it at all.
      var wrap = document.createElement('div');
      wrap.appendChild(el('p', 'std-milestone__note', T.shortfall + ': ' + pick(m.remaining)));
      // The measured distance, where the rule produced one. "8 of 10"
      // is a different thing from "not yet held" and it is the half a
      // learner can act on.
      if (m.progress && Number.isFinite(m.progress.observed) && Number.isFinite(m.progress.required)) {
        wrap.appendChild(el('p', 'std-milestone__note',
          T.observedOf(m.progress.observed, m.progress.required)));
      }
      list.appendChild(milestoneItem(m, 'unearned', wrap));
    });
    a.withdrawn.forEach(function (m) {
      var note = el('p', 'std-milestone__note',
        T.withdrawnOn(fmtDate(m.revokedAt))
        + (m.revokedReason ? ' — ' + m.revokedReason : ''));
      list.appendChild(milestoneItem(m, 'withdrawn', note));
    });
    (a.notInForce || []).forEach(function (m) {
      list.appendChild(milestoneItem(m, 'notInForce', el('p', 'std-milestone__note', pick(m.statement))));
    });
  }

  function load() {
    api('/api/student/standing').then(function (r) {
      if (r.status === 401) { state(T.signedOut, T.signedOutRest); return; }
      if (!r.ok) { state(T.failed, T.failedRest); return; }
      $('#state').textContent = '';
      $('#scope').hidden = false;

      var s = r.data;
      renderStanding(s);

      // The level the learner is actually working at. Not every level of
      // the programme: a learner at Level I is not "not eligible" for
      // Level VI, they have simply not reached it, and five refusals
      // against their name would report the College's structure as their
      // performance.
      // THE SAME LEVEL THE ENGINE CALLS CURRENT, by the same rule.
      // computeLearnerStanding() takes the FIRST active enrolment and
      // reports `standing` and `progression` from it; a page that picked
      // the last one instead would show a standing for one level beside
      // a mark table for another, and nothing on the screen would say
      // they were different levels.
      var current = null;
      for (var i = 0; i < s.levels.length; i += 1) {
        if (s.levels[i].enrolment && s.levels[i].enrolment.status === 'active') { current = s.levels[i]; break; }
      }
      if (!current && s.levels.length) current = s.levels[s.levels.length - 1];
      if (!current) state(T.noEnrolment, T.noEnrolmentRest);
      renderLevel(current);
      renderConditions(current);

      return api('/api/student/achievements').then(function (ar) {
        if (ar.ok) renderMilestones(ar.data);
      });
    }).catch(function () {
      state(T.failed, T.failedRest);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var cfg = window.WEC_LC_AUTH || {};
    if (cfg.clerkPublishableKey && typeof window.WEC_LC_loadClerk === 'function') {
      window.WEC_LC_loadClerk(cfg.clerkPublishableKey, function (err, clerk) {
        if (!err && clerk && clerk.session) {
          clerk.session.getToken().then(function (tok) {
            if (tok) authHeaders.Authorization = 'Bearer ' + tok;
            load();
          }).catch(load);
          return;
        }
        load();
      });
      return;
    }
    load();
  });
})();
