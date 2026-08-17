// AIPC — Finance dashboard client-side auth + data guard.
//
// Included only on finance/preview/index.html. Page-specific layer on
// top of the shared js/portal-guard.js shell (also used by
// js/portal-auth.js for the Student Portal) — see that file for the
// reusable gate/redirect/sign-out part of this pattern.
//
// Unlike the Student Portal, this page is role-gated: any signed-in
// Clerk user reaching it who isn't staff/admin sees an access-denied
// state, never financial data. That's defense-in-depth, not the real
// boundary — GET /api/admin/reports/* already reject non-staff callers
// server-side (requireStaff(), functions/_lib/auth/session.js)
// regardless of what this script does.
(function () {
  window.AIPC_guardPortal({
    signOutRedirect: '/',
    onAuthenticated: authorizeAndLoad,
  });

  function authorizeAndLoad(clerk, done) {
    var token;
    clerk.session.getToken().then(function (t) {
      token = t;
      return fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
    }).then(function (resp) {
      if (!resp.ok) throw new Error('auth/me unavailable');
      return resp.json();
    }).then(function (me) {
      if (me.role !== 'staff' && me.role !== 'admin') {
        showAccessDenied();
        done();
        return;
      }
      setText(document.querySelectorAll('[data-user-name]'), me.preferredName || me.email);
      document.querySelectorAll('[data-demo-tag]').forEach(function (el) { el.hidden = true; });
      loadReports(token, done);
    }).catch(function () {
      // /api/auth/me itself unreachable (not deployed, or the users
      // row hasn't been created by the webhook yet) — Clerk auth
      // succeeded but we genuinely cannot confirm staff status, so
      // default to denying access rather than showing financial data
      // to an unconfirmed identity.
      showAccessDenied();
      done();
    });
  }

  function loadReports(token, done) {
    var headers = { Authorization: 'Bearer ' + token };
    Promise.all([
      fetch('/api/admin/reports/revenue', { headers }).then(parseOrNull),
      fetch('/api/admin/reports/reconciliation', { headers }).then(parseOrNull),
    ]).then(function (results) {
      if (results[0]) renderRevenue(results[0]);
      if (results[1]) renderReconciliation(results[1]);
      if (!results[0] && !results[1]) showLoadError();
    }).catch(showLoadError).then(done, done);
  }

  function parseOrNull(resp) { return resp.ok ? resp.json() : null; }

  function renderRevenue(report) {
    setText(document.querySelectorAll('[data-report-succeeded-count]'), String(report.totals.succeededCount));
    setText(document.querySelectorAll('[data-report-gross]'), usd(report.totals.grossUsdCents));
    setText(document.querySelectorAll('[data-report-refunded]'), usd(report.totals.refundedUsdCents));
    setText(document.querySelectorAll('[data-report-net]'), usd(report.totals.netUsdCents));

    fillTable('[data-report-by-provider]', report.byProvider, function (r) {
      return [r.provider, String(r.count), usd(r.amountUsdCents)];
    });
    fillTable('[data-report-by-level]', report.byLevel, function (r) {
      return [r.levelName || '(no level — full programme)', String(r.count), usd(r.amountUsdCents)];
    });
  }

  function renderReconciliation(report) {
    setText(document.querySelectorAll('[data-report-generated-at]'), new Date(report.generatedAt).toLocaleString());
    var alertCount = report.orphanedWebhooks.length + report.stalePayments.length + report.succeededPaymentsMissingReceipts.length;
    setText(document.querySelectorAll('[data-report-alert-count]'), String(alertCount));

    fillAlertList('[data-report-stale-payments]', report.stalePayments, function (p) {
      return p.id + ' — ' + p.provider + ', ' + usd(p.amount_usd_cents) + ', pending since ' + p.created_at;
    });
    fillAlertList('[data-report-orphaned-webhooks]', report.orphanedWebhooks, function (w) {
      return w.id + ' — ' + w.provider + '/' + w.event_type + ' names unknown payment "' + w.payment_id + '"';
    });
    fillAlertList('[data-report-missing-receipts]', report.succeededPaymentsMissingReceipts, function (p) {
      return p.id + ' — succeeded ' + (p.confirmed_at || '') + ', no receipt on record';
    });
  }

  function fillTable(selector, rows, toCells) {
    var tbody = document.querySelector(selector);
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="3" style="color:var(--ink-soft)">No data in range.</td></tr>';
      return;
    }
    rows.forEach(function (row) {
      var tr = document.createElement('tr');
      toCells(row).forEach(function (text) {
        var td = document.createElement('td');
        td.textContent = text;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function fillAlertList(selector, items, toText) {
    var el = document.querySelector(selector);
    if (!el) return;
    var panel = el.closest('.panel');
    if (!items.length) {
      el.innerHTML = '<li style="color:var(--ink-soft)">None — clean.</li>';
      return;
    }
    if (panel) {
      var head = panel.querySelector('.panel__head h2');
      if (head) head.textContent = head.textContent.replace(/\s*\(\d+\)$/, '') + ' (' + items.length + ')';
    }
    el.innerHTML = '';
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = toText(item);
      el.appendChild(li);
    });
  }

  function usd(cents) { return '$' + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  function setText(nodeList, value) { nodeList.forEach(function (el) { el.textContent = value; }); }

  function showAccessDenied() {
    var main = document.getElementById('main');
    if (main) main.innerHTML = '<div class="empty-state"><h3>Access restricted</h3><p>This dashboard is limited to AIPC staff accounts. Your account is signed in but isn\'t marked as staff.</p></div>';
  }

  function showLoadError() {
    var main = document.getElementById('main');
    if (main) {
      var banner = document.createElement('div');
      banner.className = 'form-status form-status--error';
      banner.setAttribute('role', 'alert');
      banner.textContent = 'Reports could not be loaded — the reporting API may not be deployed yet.';
      main.insertBefore(banner, main.firstChild);
    }
  }

})();
