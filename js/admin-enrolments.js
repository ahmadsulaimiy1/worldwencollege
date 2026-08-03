/* WEC-LC — staff enrolment administration.

   Replaces the only way this previously worked: hand-writing SQL into
   the Cloudflare D1 console. That is how the platform's first learner
   was enrolled, and it is not something an institution can run on.

   The page is deliberately small. Find a learner, see what they have
   access to, change it, say why. It does not manage roles, refunds or
   academic decisions — those need policy nobody has set, and a screen
   that lets you act on absent policy is how invented policy ships.

   One interaction decision worth stating: changing a level always asks
   for a reason before it does anything. Not a confirmation dialogue —
   a reason. A confirmation asks "are you sure", which people click
   through; a reason asks "what is this for", which is the thing anyone
   reading the record in six months actually needs.
*/
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var LEVELS = [
    [1, 'I', 'Foundation', 'A1'], [2, 'II', 'Elementary', 'A2'], [3, 'III', 'Intermediate', 'B1'],
    [4, 'IV', 'Upper Intermediate', 'B2'], [5, 'V', 'Advanced', 'C1'], [6, 'VI', 'English Mastery', 'C2'],
  ];
  var STATUS_LABEL = {
    active: 'Active', completed: 'Completed',
    pending_payment: 'Awaiting payment', withdrawn: 'Withdrawn',
  };

  var state = { learner: null };

  function api(path, opts) {
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      return fetch(path, Object.assign({}, opts || {}, { headers: headers }));
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) {
        if (!r.ok) throw Object.assign(new Error(b.message || r.statusText), { status: r.status });
        return b;
      });
    });
  }

  // Show what the server actually said, rather than inferring a cause
  // from the status code.
  //
  // 403 has two entirely different meanings here — "you are not staff"
  // and "you cannot change your own enrolments" — and the first version
  // of this function mapped both to the first message. A staff member
  // who tried to enrol themselves was told they were not staff, which
  // is not merely unhelpful: it is false, and it would send them to ask
  // an administrator for access they already have. Found by a browser
  // test doing exactly that.
  //
  // 401 stays special-cased because the server's message there is about
  // tokens and webhooks, which is a correct thing to log and a useless
  // thing to show someone whose session simply expired.
  function fail(err) {
    $('#admError').textContent = err.status === 401
      ? 'Sign in to manage enrolments.'
      : (err.message || 'Could not complete that. Please try again.');
  }

  // ---- Search ----------------------------------------------------------
  function search() {
    $('#admError').textContent = '';
    var q = $('#q').value.trim();
    return api('/api/admin/learners?q=' + encodeURIComponent(q)).then(function (res) {
      $('#resultCount').textContent = res.count === 1 ? '1 learner' : res.count + ' learners';
      var box = $('#results');
      box.innerHTML = '';
      if (!res.count) {
        box.textContent = q ? 'No learner matches “' + q + '”.' : 'No accounts yet.';
        box.style.color = 'var(--ink-soft)';
        return;
      }
      box.style.color = '';
      res.learners.forEach(function (l) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'tbtn';
        row.style.cssText = 'display:flex;width:100%;justify-content:space-between;gap:1rem;text-align:left;margin-bottom:.4rem;align-items:center';
        var live = l.enrolments.filter(function (e) { return e.status !== 'withdrawn'; }).length;
        var who = document.createElement('span');
        who.textContent = l.preferredName ? l.preferredName + ' · ' + l.email : l.email;
        var what = document.createElement('span');
        what.style.cssText = 'font-size:.78rem;color:var(--ink-soft);white-space:nowrap';
        what.textContent = (l.role !== 'student' ? l.role + ' · ' : '') +
          (live ? live + ' of 6 levels' : 'no enrolments');
        row.appendChild(who); row.appendChild(what);
        row.addEventListener('click', function () { openLearner(l.id); });
        box.appendChild(row);
      });
    }).catch(fail);
  }

  // ---- One learner -----------------------------------------------------
  function openLearner(userId) {
    return api('/api/admin/learners?id=' + encodeURIComponent(userId)).then(function (l) {
      state.learner = l;
      $('#learnerCard').hidden = false;
      $('#learnerName').textContent = l.preferredName || l.email;
      $('#learnerMeta').textContent = l.email + ' · ' + l.role +
        (l.emailVerified ? ' · email verified' : ' · email not verified');
      renderLevels(l);
      renderHistory(l.history);
      $('#learnerCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }).catch(fail);
  }

  function renderLevels(learner) {
    var box = $('#levels');
    box.innerHTML = '';
    // All six levels are always listed, enrolled or not. A screen that
    // only shows what someone already has makes granting the thing they
    // do not have the hardest action on the page.
    LEVELS.forEach(function (lv) {
      var current = learner.enrolments.filter(function (e) { return e.levelId === lv[0] && e.status !== 'withdrawn'; })[0];
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:.8rem;align-items:center;justify-content:space-between;padding:.55rem 0;border-bottom:1px solid rgba(20,38,74,.08);flex-wrap:wrap';

      var label = document.createElement('span');
      label.innerHTML = '<strong>Level ' + lv[1] + '</strong> · ' + lv[2] +
        ' <span style="color:var(--ink-soft)">(' + lv[3] + ')</span>';
      row.appendChild(label);

      var right = document.createElement('span');
      right.style.cssText = 'display:flex;gap:.5rem;align-items:center;flex-wrap:wrap';

      var badge = document.createElement('span');
      badge.style.cssText = 'font-size:.78rem;color:' + (current ? 'var(--royal)' : 'var(--ink-soft)');
      badge.textContent = current ? STATUS_LABEL[current.status] : 'Not enrolled';
      right.appendChild(badge);

      actionsFor(current).forEach(function (a) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'tbtn' + (a.primary ? ' tbtn--primary' : '');
        b.textContent = a.label;
        b.addEventListener('click', function () { change(learner.id, lv[0], a.status, a.prompt); });
        right.appendChild(b);
      });

      row.appendChild(right);
      box.appendChild(row);
    });
  }

  function actionsFor(current) {
    if (!current) return [{ label: 'Enrol', status: 'active', primary: true, prompt: 'Why is this learner being enrolled without a card payment?' }];
    if (current.status === 'active') {
      return [
        { label: 'Mark completed', status: 'completed', prompt: 'Why is this level being marked completed?' },
        { label: 'Withdraw', status: 'withdrawn', prompt: 'Why is this enrolment being withdrawn?' },
      ];
    }
    if (current.status === 'completed') {
      return [{ label: 'Reopen', status: 'active', prompt: 'Why is this completed level being reopened?' }];
    }
    return [
      { label: 'Activate', status: 'active', primary: true, prompt: 'Why is this being activated without a completed payment?' },
      { label: 'Withdraw', status: 'withdrawn', prompt: 'Why is this enrolment being withdrawn?' },
    ];
  }

  function change(userId, levelId, status, promptText) {
    // A reason, not a confirmation. "Are you sure?" gets clicked
    // through; "what is this for?" produces the sentence somebody needs
    // when they read this record later. Cancelling leaves nothing
    // changed, which is why the prompt comes before the request.
    var reason = window.prompt(promptText + '\n\nThis is recorded against your name.');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      $('#admError').textContent = 'A reason of at least a few words is required — the record is the point.';
      return;
    }
    $('#admError').textContent = '';
    api('/api/admin/enrolment', {
      method: 'POST',
      body: JSON.stringify({ userId: userId, levelId: levelId, status: status, reason: reason.trim() }),
    }).then(function () {
      return openLearner(userId);
    }).catch(fail);
  }

  function renderHistory(history) {
    var box = $('#history');
    box.innerHTML = '';
    if (!history || !history.length) {
      box.textContent = 'No enrolment changes recorded yet.';
      box.style.color = 'var(--ink-soft)';
      return;
    }
    box.style.color = '';
    history.forEach(function (h) {
      var lv = LEVELS.filter(function (l) { return l[0] === h.levelId; })[0];
      var row = document.createElement('div');
      row.style.cssText = 'padding:.5rem 0;border-bottom:1px solid rgba(20,38,74,.06);font-size:.85rem';
      var when = String(h.createdAt || '').replace('T', ' ').slice(0, 16);
      var move = h.fromStatus
        ? (STATUS_LABEL[h.fromStatus] || h.fromStatus) + ' → ' + (STATUS_LABEL[h.toStatus] || h.toStatus)
        : 'Enrolled as ' + (STATUS_LABEL[h.toStatus] || h.toStatus);
      var head = document.createElement('div');
      head.innerHTML = '<strong>Level ' + (lv ? lv[1] : h.levelId) + '</strong> — ' + move +
        ' <span style="color:var(--ink-soft)">· ' + when + '</span>';
      row.appendChild(head);
      var by = document.createElement('div');
      by.style.cssText = 'color:var(--ink-soft)';
      // "System" is the truth for a payment-driven enrolment: no person
      // decided it. Showing a blank there would imply missing data.
      by.textContent = (h.bySystem ? 'System (payment)' : h.actor || 'Unknown') + (h.reason ? ' — ' + h.reason : '');
      row.appendChild(by);
      box.appendChild(row);
    });
  }

  // ---- Boot ------------------------------------------------------------
  function offline() {
    function update() { document.body.classList.toggle('is-offline', !navigator.onLine); }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  document.addEventListener('DOMContentLoaded', function () {
    offline();
    $('#searchForm').addEventListener('submit', function (e) { e.preventDefault(); search(); });
    var guarded = window.WEC_LC_guardPortal({
      signOutRedirect: '/',
      shellSelector: '.lab-body',
      onAuthenticated: function (clerk, done) {
        window.WEC_LC_apiAuth.attach(clerk);
        done();
        search();
      },
    });
    if (!guarded) search();
  });
})();
