/* WEC — the public application-status lookup card on the Admissions
   pillar page. functions/api/admissions/status.js has always worked
   (GET ?id=app_..., no auth — an applicant checking status has no
   account yet) but nothing called it until this. Deliberately no
   auth headers: the endpoint is public by design, keyed on the id
   alone. A 404's own message is rendered verbatim, not paraphrased —
   the endpoint's wording is the honest answer, not this file's. */
(function () {
  'use strict';
  var form = document.querySelector('[data-status-lookup-form]');
  if (!form) return;

  var endpoint = form.getAttribute('data-endpoint') || '/api/admissions/status';
  var idField = form.querySelector('[name="id"]');
  var btn = form.querySelector('[data-status-lookup-btn]');
  var btnLabel = btn ? btn.querySelector('[data-btn-label]') : null;
  var defaultLabel = btnLabel ? btnLabel.textContent : (btn ? btn.textContent : 'Check Status');
  var resultBox = form.querySelector('[data-status-lookup-result]');
  var pillEl = form.querySelector('[data-status-pill]');
  var createdEl = form.querySelector('[data-status-lookup-created]');
  var errorBox = form.querySelector('[data-status-lookup-error]');

  var PILL_VARIANT = {
    submitted: 'progress', placement_pending: 'progress', offer_sent: 'progress',
    accepted: 'good', enrolled: 'good', withdrawn: 'muted', rejected: 'muted',
  };

  function setLoading(loading) {
    if (!btn) return;
    btn.disabled = loading;
    if (btnLabel) btnLabel.textContent = loading ? 'Checking…' : defaultLabel;
  }

  function showError(message) {
    if (resultBox) resultBox.hidden = true;
    if (errorBox) { errorBox.textContent = message; errorBox.classList.add('is-visible', 'form-status--error'); }
  }

  function clearError() {
    if (errorBox) { errorBox.textContent = ''; errorBox.classList.remove('is-visible', 'form-status--error'); }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();
    var id = (idField && idField.value || '').trim();
    if (!id) { showError('Enter your application id, starting app_.'); return; }

    setLoading(true);
    fetch(endpoint + '?id=' + encodeURIComponent(id))
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw Object.assign(new Error(body.message || 'Something went wrong.'), { status: r.status });
          return body;
        });
      })
      .then(function (data) {
        if (pillEl) {
          pillEl.className = 'status-pill status-pill--' + (PILL_VARIANT[data.status] || 'muted');
          pillEl.textContent = data.status;
        }
        if (createdEl) {
          var when;
          try { when = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(data.createdAt)); }
          catch (err) { when = data.createdAt; }
          createdEl.textContent = 'Submitted ' + when + '.';
        }
        if (resultBox) resultBox.hidden = false;
      })
      .catch(function (err) {
        // The endpoint's own message ("No application found with that
        // id.") is the honest answer for a 404 — shown verbatim, not
        // softened into something vaguer.
        showError(err.message || 'Something went wrong — try again.');
      })
      .then(function () { setLoading(false); });
  });
})();
