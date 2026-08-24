// WEC — Student Portal client-side auth guard.
//
// Included only on portal pages (student-portal/preview/ and its
// sub-pages). Page-specific layer on top of the shared
// js/portal-guard.js shell — see that file for the reusable part of
// this pattern (also used by js/finance-dashboard.js).
//
// With no key configured (the shipped default), js/portal-guard.js
// does nothing at all — the page stays exactly the static, illustrative
// design preview it already is. The moment a real publishable key is
// set at deploy time, the same markup and script begin gating the page
// behind a real Clerk session with no further changes here, mirroring
// the try-live-then-fall-back philosophy used for the admissions form
// (see docs/api-reference.md — Frontend Integration Pattern).
//
// Implemented against Clerk's documented framework-less ("vanilla JS")
// integration: https://clerk.com/docs. Not yet exercised against a
// real Clerk instance — see docs/auth-architecture.md — What's
// genuinely untested.
(function () {
  window.WEC_LC_guardPortal({
    signOutRedirect: '/student-portal/',
    onAuthenticated: function (clerk, done) {
      wireSecurityLinks(clerk);
      applyRealUser(clerk, done);
    },
  });

  function wireSecurityLinks(clerk) {
    // Clerk hosts password, 2FA and active-session management itself —
    // WEC doesn't rebuild that UI. These buttons deep-link into
    // Clerk's own account-management UI once a session exists.
    document.querySelectorAll('[data-open-account-security]').forEach(function (el) {
      el.disabled = false;
      el.removeAttribute('style');
      el.addEventListener('click', function () { clerk.openUserProfile(); });
    });
    var accountNote = document.querySelector('[data-account-note]');
    if (accountNote) accountNote.textContent = 'Editing these details isn’t available from this page yet — contact Admissions to update your contact information.';
    var passwordNote = document.querySelector('[data-password-note]');
    if (passwordNote) passwordNote.textContent = 'Managed from your account security settings.';
  }

  // Clerk's own record, not a WEC guess — telling a student who has
  // turned 2FA on that it is "not enabled" would be actively wrong,
  // not merely illustrative.
  function render2fa(clerk) {
    var pill = document.querySelector('[data-twofactor-status]');
    if (!pill) return;
    var on = !!clerk.user.twoFactorEnabled;
    pill.textContent = on ? 'Enabled' : 'Not enabled';
    pill.className = 'status-pill status-pill--' + (on ? 'good' : 'muted');
  }

  // The static banner otherwise keeps insisting "not a live student
  // account" to a real, signed-in student — the mandate's honesty
  // problem pointed the other way from a placeholder overstating what
  // is real. Swapped only once Clerk auth has actually succeeded.
  function updateBanner() {
    var banner = document.querySelector('.preview-banner');
    if (!banner) return;
    banner.innerHTML = '<strong>Some sections are illustrative</strong>' +
      'You’re signed in — your level, progress and payment history below are real. ' +
      'Classes, assignments, the Digital Library and messaging are not yet built. ' +
      '<a href="/student-portal/" style="color:var(--royal-deep);text-decoration:underline;margin-left:.6em;">Back to Student Portal overview →</a>';
  }

  function applyRealUser(clerk, done) {
    var user = clerk.user;
    var initials = (user.firstName ? user.firstName[0] : '') + (user.lastName ? user.lastName[0] : '');
    var displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.primaryEmailAddress.emailAddress;
    var email = user.primaryEmailAddress ? user.primaryEmailAddress.emailAddress : '';

    setText(document.querySelectorAll('[data-user-name]'), displayName);
    setText(document.querySelectorAll('[data-user-initials]'), initials || '—');
    setText(document.querySelectorAll('[data-user-email]'), email);
    document.querySelectorAll('[data-demo-tag]').forEach(function (el) { el.hidden = true; });
    updateBanner();
    render2fa(clerk);

    function setText(nodeList, value) {
      nodeList.forEach(function (el) {
        if ('value' in el) el.value = value; else el.textContent = value;
      });
    }

    // /api/auth/me carries WEC's own record (role, preferred language,
    // programme fields) beyond what Clerk's user object knows about, and
    // /api/student/dashboard carries this student's own enrolment and
    // payment history (see functions/_lib/student/dashboard.js). Neither
    // being reachable yet (not deployed, or the users row hasn't been
    // created by the webhook) is fatal — Clerk auth itself succeeded, so
    // the page keeps working with illustrative programme data rather
    // than showing broken UI over a secondary fetch failing.
    var token;
    clerk.session.getToken().then(function (t) {
      token = t;
      return fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
    }).then(function (resp) {
      if (!resp.ok) throw new Error('auth/me unavailable');
      return resp.json();
    }).then(function (me) {
      if (me.preferredName) {
        document.querySelectorAll('[data-user-name]').forEach(function (el) { el.textContent = me.preferredName; });
      }
    }).catch(function () {}).then(function () {
      return fetch('/api/student/dashboard', { headers: { Authorization: 'Bearer ' + token } })
        .then(function (resp) { return resp.ok ? resp.json() : null; })
        .then(function (dashboard) { if (dashboard) renderDashboard(dashboard); })
        .catch(function () {});
    }).then(function () {
      // Per-level module progress — see functions/_lib/student/study-plan.js.
      // Deliberately NOT the same figure as the illustrative full-programme
      // "units" tile it replaces: that count has no backing table (see
      // functions/_lib/student/dashboard.js's own comment) and inventing a
      // programme-wide total would be exactly the fabrication the rest of
      // this file exists to avoid. This is real, just scoped to one level.
      return fetch('/api/student/study-plan', { headers: { Authorization: 'Bearer ' + token } })
        .then(function (resp) { return resp.ok ? resp.json() : null; })
        .then(function (plan) { if (plan) renderUnitsCompleted(plan); })
        .catch(function () {});
    }).then(done, done);
  }

  function renderDashboard(dashboard) {
    renderLevelProgress(dashboard);
    renderPaymentHistory(dashboard.payments);
  }

  var UNIT_STATE_COPY = {
    no_enrolment: 'Not yet enrolled',
    awaiting_content: 'Level being prepared',
    programme_complete: 'Programme complete',
  };

  function renderUnitsCompleted(plan) {
    var fill = document.querySelector('[data-progress-fill]');
    var caption = document.querySelector('[data-progress-caption]');
    var pctEl = document.querySelector('[data-progress-pct]');
    var tileValue = document.querySelector('[data-units-value]');
    var tileSub = document.querySelector('[data-units-sub]');

    if (plan.totalCount) {
      var pct = Math.round((plan.completedCount / plan.totalCount) * 100);
      if (fill) fill.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
      if (caption) caption.textContent = plan.completedCount + ' of ' + plan.totalCount + ' units completed';
      if (tileValue) tileValue.textContent = plan.completedCount + ' / ' + plan.totalCount;
      if (tileSub) tileSub.textContent = plan.level ? 'Level ' + plan.level.roman + ' · this level' : 'This level';
    } else {
      var msg = UNIT_STATE_COPY[plan.state] || 'No data yet';
      if (fill) fill.style.width = '0%';
      if (pctEl) pctEl.textContent = '';
      if (caption) caption.textContent = msg;
      if (tileValue) tileValue.textContent = '—';
      if (tileSub) tileSub.textContent = msg;
    }
  }

  function renderLevelProgress(dashboard) {
    var stepper = document.querySelector('[data-stepper]');
    if (stepper) {
      var nodes = Array.prototype.slice.call(stepper.querySelectorAll('[data-level-id]'));
      nodes.forEach(function (node) {
        var levelId = Number(node.getAttribute('data-level-id'));
        node.classList.remove('is-done', 'is-current');
        if (dashboard.completedLevelIds.indexOf(levelId) !== -1) node.classList.add('is-done');
        else if (levelId === dashboard.activeLevelId) node.classList.add('is-current');
      });
      // A connecting line is "done" only when the node right before it
      // is fully completed — matching a merely-current node shouldn't
      // paint the line into the level after it.
      Array.prototype.slice.call(stepper.children).forEach(function (child, i, all) {
        if (!child.classList.contains('stepper__line')) return;
        var prev = all[i - 1];
        child.classList.toggle('is-done', !!(prev && prev.classList.contains('is-done')));
      });
    }

    var activeEnrolment = dashboard.enrolments.filter(function (e) { return e.levelId === dashboard.activeLevelId; })[0];
    if (activeEnrolment) {
      var levelLine = activeEnrolment.roman + ' · ' + activeEnrolment.levelName;
      setTextAll('[data-user-level]', 'Level ' + levelLine);
      setTextAll('[data-stepper-status]', 'In Progress · Level ' + activeEnrolment.roman);
      setTextAll('[data-current-level-value]', activeEnrolment.roman);
      setTextAll('[data-current-level-sub]', activeEnrolment.levelName + ' · CEFR ' + activeEnrolment.cefr);
      setTextAll('[data-mini-level]', activeEnrolment.roman + ' · ' + activeEnrolment.levelName + ' (CEFR ' + activeEnrolment.cefr + ')');
      var statusEl = document.querySelector('[data-mini-status]');
      if (statusEl) { statusEl.textContent = 'Active'; statusEl.className = 'status-pill status-pill--good'; }
    } else if (!dashboard.enrolments.length) {
      setTextAll('[data-user-level]', 'Not yet enrolled');
      setTextAll('[data-stepper-status]', 'Not enrolled');
      setTextAll('[data-mini-level]', 'Not yet enrolled');
      var statusEl2 = document.querySelector('[data-mini-status]');
      if (statusEl2) { statusEl2.textContent = 'Not enrolled'; statusEl2.className = 'status-pill status-pill--muted'; }
    }
  }

  function renderPaymentHistory(payments) {
    var tbody = document.querySelector('[data-payment-history]');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!payments.length) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><p>No payments on record yet.</p></div></td></tr>';
      return;
    }
    var statusPillClass = { succeeded: 'good', pending: 'progress', processing: 'progress', failed: 'critical', refunded: 'muted', partially_refunded: 'muted' };
    payments.forEach(function (p) {
      var tr = document.createElement('tr');
      var date = document.createElement('td');
      date.textContent = (p.confirmedAt || p.createdAt || '').slice(0, 10);
      var level = document.createElement('td');
      level.textContent = p.levelName || 'Full programme';
      var amount = document.createElement('td');
      amount.textContent = p.currency + ' ' + (p.amountCents / 100).toFixed(2);
      var status = document.createElement('td');
      var pill = document.createElement('span');
      pill.className = 'status-pill status-pill--' + (statusPillClass[p.status] || 'muted');
      pill.textContent = p.status;
      status.appendChild(pill);
      tr.appendChild(date); tr.appendChild(level); tr.appendChild(amount); tr.appendChild(status);
      tbody.appendChild(tr);
    });
  }

  function setTextAll(selector, value) {
    document.querySelectorAll(selector).forEach(function (el) { el.textContent = value; });
  }
})();
