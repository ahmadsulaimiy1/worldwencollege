/* WEC — staff enrolment administration.

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
  var ROLE_ORDER = ['student', 'staff', 'admin'];
  var ROLE_LABEL = { student: 'Learner', staff: 'Staff', admin: 'Administrator' };
  var ROLE_ACTION = { student: 'Remove access', staff: 'Appoint as staff', admin: 'Appoint as administrator' };
  var STATUS_LABEL = {
    active: 'Active', completed: 'Completed',
    pending_payment: 'Awaiting payment', withdrawn: 'Withdrawn',
  };

  var state = { learner: null, viewer: null, registerLoaded: false };

  function api(path, opts) {
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      return fetch(path, Object.assign({}, opts || {}, { headers: headers }));
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (b) {
        if (!r.ok) {
          // apiMessage, not just message: humanError() will only
          // surface a sentence it can tell an endpoint wrote on
          // purpose, and without this the refusal reason is thrown
          // away one line before the function that would have shown
          // it. Same rule as the shared transport in portal-data.js.
          var apiMessage = b && typeof b.message === 'string' && b.message ? b.message : null;
          throw Object.assign(new Error(apiMessage || r.statusText),
            { status: r.status, body: b, apiMessage: apiMessage });
        }
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
      : window.WEC_LC_data.humanError(err, 'Could not complete that. Please try again.');
  }

  // ---- Search ----------------------------------------------------------
  function search() {
    $('#admError').textContent = '';
    var q = $('#q').value.trim();
    return api('/api/admin/learners?q=' + encodeURIComponent(q)).then(function (res) {
      state.viewer = res.viewer || null;
      // Once, on the first response that tells us who the viewer is —
      // not on every search, which would refetch an unchanged list each
      // time someone types a name. appoint() refreshes it explicitly,
      // because that is the one action that changes it.
      if (!state.registerLoaded) { state.registerLoaded = true; renderRegister(); }
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
      if (l.viewer) state.viewer = l.viewer;
      $('#learnerCard').hidden = false;
      $('#learnerName').textContent = l.preferredName || l.email;
      $('#learnerMeta').textContent = l.email + ' · ' + l.role +
        (l.emailVerified ? ' · email verified' : ' · email not verified');
      renderLevels(l);
      renderAccess(l);
      renderHistory(l.history, l.auditRecord);
      renderAppointments(l);
      $('#learnerCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }).catch(fail);
  }

  // The appointment trail for one person, administrator-only because
  // the endpoint is. Fetched separately rather than folded into the
  // learner record: staff open learner records all day, and who
  // appointed whom is not theirs to read.
  //
  // Kept apart from the enrolment history below it for the same reason
  // the tables are separate — an enrolment change says what one learner
  // may study, an appointment says what one person may do to everybody
  // else's records. Merging them buries the few entries that matter in
  // the many that do not.
  function renderAppointments(learner) {
    var head = $('#appointmentsHead');
    var box = $('#appointments');
    box.innerHTML = '';
    if (!state.viewer || state.viewer.role !== 'admin') {
      head.hidden = true; box.hidden = true;
      return;
    }
    head.hidden = false; box.hidden = false;
    box.textContent = 'Loading…';
    box.style.color = 'var(--ink-soft)';
    api('/api/admin/role?userId=' + encodeURIComponent(learner.id)).then(function (res) {
      box.innerHTML = '';
      var list = res.appointments || [];
      if (!list.length) {
        // The honest reading, and the common one: most people have never
        // been appointed to anything. Saying so beats an empty box.
        box.textContent = learner.role === 'student'
          ? 'No appointments — this account has never held staff or administrator access.'
          : 'No appointment recorded. This access predates the appointments record, or was set directly in the database.';
        box.style.color = 'var(--ink-soft)';
        return;
      }
      box.style.color = '';
      list.forEach(function (a) {
        var row = document.createElement('div');
        row.style.cssText = 'padding:.5rem 0;border-bottom:1px solid rgba(20,38,74,.06);font-size:.85rem';
        var when = String(a.createdAt || '').replace('T', ' ').slice(0, 16);
        var head2 = document.createElement('div');
        head2.innerHTML = '<strong>' + (ROLE_LABEL[a.fromRole] || a.fromRole) + ' → ' +
          (ROLE_LABEL[a.toRole] || a.toRole) + '</strong>' +
          ' <span style="color:var(--ink-soft)">· ' + when + '</span>';
        row.appendChild(head2);
        var by = document.createElement('div');
        by.style.cssText = 'color:var(--ink-soft)';
        by.textContent = (a.actorEmail || 'Unknown') + (a.reason ? ' — ' + a.reason : '');
        row.appendChild(by);
        // Shown on its own line rather than run together with the
        // reason: "under whose decision" is the line somebody is
        // looking for when they are looking, and it should be findable.
        if (a.authority) {
          var auth = document.createElement('div');
          auth.style.cssText = 'color:var(--ink-soft)';
          auth.textContent = 'Authority: ' + a.authority;
          row.appendChild(auth);
        }
        box.appendChild(row);
      });
    }).catch(function (err) {
      box.style.color = 'var(--ink-soft)';
      box.textContent = window.WEC_LC_data.humanError(err, 'Could not load the appointment record.');
    });
  }

  // Everyone who holds access above learner. Administrator-only, and
  // rendered before anybody searches for anything, because "who can see
  // student records" is a question with a one-list answer and it
  // previously required a hand-written database query.
  function renderRegister() {
    var card = $('#registerCard');
    if (!state.viewer || state.viewer.role !== 'admin') { card.hidden = true; return; }
    return api('/api/admin/role').then(function (res) {
      card.hidden = false;
      var box = $('#register');
      box.innerHTML = '';
      var list = res.appointees || [];
      $('#registerCount').textContent = list.length === 1 ? '1 person' : list.length + ' people';
      if (!list.length) { box.textContent = 'Nobody holds staff or administrator access.'; box.style.color = 'var(--ink-soft)'; return; }
      box.style.color = '';
      list.forEach(function (p) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'tbtn';
        row.style.cssText = 'display:flex;width:100%;justify-content:space-between;gap:1rem;text-align:left;margin-bottom:.4rem;align-items:center';
        var who = document.createElement('span');
        who.textContent = p.preferredName ? p.preferredName + ' · ' + p.email : p.email;
        var what = document.createElement('span');
        what.style.cssText = 'font-size:.78rem;white-space:nowrap;color:' + (p.role === 'admin' ? 'var(--royal)' : 'var(--ink-soft)');
        what.textContent = ROLE_LABEL[p.role] || p.role;
        row.appendChild(who); row.appendChild(what);
        row.addEventListener('click', function () { openLearner(p.id); });
        box.appendChild(row);
      });
    }).catch(function () {
      // A staff member reaching this page gets a 403 here, which is
      // correct and not an error to shout about — just no register.
      card.hidden = true;
    });
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

  // Appointment controls, administrator-only.
  //
  // Hidden rather than disabled for staff: a disabled button that says
  // "make administrator" still tells a staff member the platform will
  // let them try, and the honest thing is that it will not. The server
  // refuses regardless -- this only decides what is worth offering.
  //
  // Not shown at all for a learner's own record when that learner is
  // the viewer, because nobody may change their own access and a
  // control that always fails is not a control.
  function renderAccess(learner) {
    var box = $('#access');
    var block = $('#accessBlock');
    box.innerHTML = '';
    var viewer = state.viewer;
    if (!viewer || viewer.role !== 'admin' || viewer.id === learner.id) {
      block.hidden = true;
      return;
    }
    block.hidden = false;

    var now = document.createElement('p');
    now.style.cssText = 'margin:0 0 .6rem;color:var(--ink-soft);font-size:.85rem';
    now.textContent = 'Currently: ' + ROLE_LABEL[learner.role] + '. ' +
      'An appointment records who made it and under what authority.';
    box.appendChild(now);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap';
    ROLE_ORDER.forEach(function (r) {
      if (r === learner.role) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tbtn' + (r === 'admin' ? '' : ' tbtn--primary');
      b.textContent = ROLE_ACTION[r];
      b.addEventListener('click', function () { appoint(learner.id, r); });
      row.appendChild(b);
    });
    box.appendChild(row);
  }

  function appoint(userId, role) {
    var reason = window.prompt(
      'Why is ' + ROLE_ACTION[role].toLowerCase() + ' the right decision for this person?\n\nThis is recorded against your name.');
    if (reason === null) return;
    if (reason.trim().length < 3) {
      $('#admError').textContent = 'A reason of at least a few words is required.';
      return;
    }
    // Asked separately because it is a different question. "Why this
    // person" is a management answer; "under whose decision" is what an
    // institution needs when it has to account for who held access.
    // Optional, because not every appointment rests on a minuted
    // decision and forcing one just produces "n/a" everywhere.
    var authority = window.prompt(
      'Under whose decision? A board minute, a directorship, a dated approval.\n\nLeave blank if there is no formal record.');
    if (authority === null) return;

    $('#admError').textContent = '';
    api('/api/admin/role', {
      method: 'POST',
      body: JSON.stringify({ userId: userId, role: role, reason: reason.trim(), authority: authority.trim() || null }),
    }).then(function () {
      renderRegister();
      return openLearner(userId);
    }).catch(fail);
  }

  // Turn the audit-record start into one plain sentence.
  //
  // The enrolment_events table reached the live database on 3 August
  // 2026, well after the first learners were enrolled, so for older
  // accounts this panel shows a record that begins mid-story. Rendering
  // the rows and saying nothing else asserts "this is what happened to
  // this learner", which is false. Saying "No enrolment changes recorded
  // yet" is worse — it reads as "nothing happened", when the truth is
  // "nothing was being written down".
  function auditNote(audit, empty) {
    if (!audit || audit.complete) {
      return empty ? 'No enrolment changes recorded for this learner.' : null;
    }
    if (!audit.known) {
      return 'This record may be incomplete: it is not known when enrolment changes began being recorded on this database.';
    }
    var when = String(audit.since || '').slice(0, 10);
    return empty
      ? 'No enrolment changes recorded since ' + when + ', which is when this record began. Anything earlier happened before changes were being written down.'
      : 'This record begins on ' + when + '. Enrolment changes made before that date were not recorded and cannot be recovered.';
  }

  function renderHistory(history, audit) {
    var box = $('#history');
    box.innerHTML = '';
    var empty = !history || !history.length;
    var note = auditNote(audit, empty);
    if (note) {
      var p = document.createElement('p');
      p.style.cssText = 'margin:0 0 .6rem;color:var(--ink-soft);font-size:.82rem';
      p.textContent = note;
      box.appendChild(p);
    }
    if (empty) { box.style.color = 'var(--ink-soft)'; return; }
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
