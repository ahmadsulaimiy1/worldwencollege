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
    }).then(done, done);
  }

  function renderDashboard(dashboard) {
    renderLevelProgress(dashboard);
    renderPaymentHistory(dashboard.payments);
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
    } else if (!dashboard.enrolments.length) {
      setTextAll('[data-user-level]', 'Not yet enrolled');
      setTextAll('[data-stepper-status]', 'Not enrolled');
    }
  }

  function renderPaymentHistory(payments) {
    var tbody = document.querySelector('[data-payment-history]');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!payments.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="color:var(--ink-soft)">No payments on record yet.</td></tr>';
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
