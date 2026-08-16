/* WEC-LC — the admissions application wizard.

   Replaces the old single-page #apply form with a real multi-step,
   account-backed process: sign in (Clerk, via js/portal-guard.js —
   see that file for what "no key configured" does to this page),
   walk seven steps saving as you go, review, submit. The submit step
   calls the SAME functions/api/admissions/apply.js endpoint the old
   one-page form always has — nothing about final submission changed;
   what changed is that a signed-in applicant now has a place for the
   in-progress work to live between visits (functions/api/admissions/
   draft.js) instead of losing it the moment the tab closes.

   The engine is purely structural: every step's fields, labels and
   copy live in the page's own HTML (one <fieldset data-step="…">
   per step, already authored in English or Arabic — this file reads
   structure and never writes prose. It reads a field's name/value and
   its [data-review-label] for the review screen; it never invents a
   sentence.

   STATE, kept deliberately small:
     currentStepIndex  — which fieldset is visible
     completedSteps    — from the server, drives the stepper's dots
     application       — non-null once a real application has been
                         submitted (from that point on, the wizard is
                         replaced by a status view — see renderStatus())
*/
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var form = $('[data-wizard-form]');
  if (!form) return;
  var steps = $$('[data-step]', form);
  var stepKeys = steps.map(function (el) { return el.getAttribute('data-step'); });
  var stepperNodes = $$('[data-stepper-node]');
  var progressLabel = $('[data-wizard-progress-label]');
  var backBtn = $('[data-wizard-back]');
  var nextBtn = $('[data-wizard-next]');
  var submitBtn = $('[data-wizard-submit]');
  var stepError = $('[data-wizard-step-error]');
  var wizardShell = $('[data-wizard-shell]');
  var statusShell = $('[data-application-status]');

  var current = 0;
  var completedSteps = [];

  function api(path, opts) {
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      var init = opts || {};
      init.headers = Object.assign({}, headers, init.headers || {});
      return fetch(path, init);
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) throw Object.assign(new Error(body.message || r.statusText), { status: r.status, body: body });
        return body;
      });
    });
  }

  // Reads every named field inside one step's fieldset. Checkboxes
  // come back as booleans, everything else as a trimmed string (or
  // null if blank) — the same shape functions/_lib/admissions/
  // fields.js's validateStepFields() already expects.
  function readStep(el) {
    var out = {};
    $$('[name]', el).forEach(function (input) {
      var name = input.getAttribute('name');
      if (input.type === 'checkbox') { out[name] = input.checked; return; }
      var v = input.value;
      out[name] = v && v.trim() ? v.trim() : null;
    });
    return out;
  }

  function fieldErrorEl(name) {
    return $('[data-error-for="' + name + '"]');
  }

  function clearStepErrors(el) {
    $$('[data-error-for]', el).forEach(function (e) { e.textContent = ''; });
    if (stepError) stepError.textContent = '';
  }

  function showStepErrors(el, fields) {
    var firstBad = null;
    Object.keys(fields || {}).forEach(function (name) {
      var e = fieldErrorEl(name);
      if (e) { e.textContent = fields[name]; if (!firstBad) firstBad = name; }
    });
    if (firstBad) {
      var input = $('[name="' + firstBad + '"]', el);
      if (input) input.focus();
    } else if (stepError) {
      stepError.textContent = 'Please check the highlighted fields.';
    }
  }

  function updateStepper() {
    stepperNodes.forEach(function (node, i) {
      node.classList.toggle('is-done', completedSteps.indexOf(stepKeys[i]) !== -1 && i !== current);
      node.classList.toggle('is-current', i === current);
    });
    if (progressLabel) {
      progressLabel.textContent = 'Step ' + (current + 1) + ' of ' + steps.length;
    }
  }

  function showStep(index) {
    steps.forEach(function (el, i) { el.hidden = i !== index; });
    current = index;
    backBtn.hidden = index === 0;
    var isReview = stepKeys[index] === 'review';
    nextBtn.hidden = isReview;
    submitBtn.hidden = !isReview;
    if (isReview) renderReview();
    updateStepper();
    steps[index].scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function renderReview() {
    var dl = $('[data-review-summary]');
    if (!dl) return;
    dl.innerHTML = '';
    steps.forEach(function (el) {
      if (el.getAttribute('data-step') === 'review') return;
      $$('[name]', el).forEach(function (input) {
        var label = input.closest('.field') && input.closest('.field').querySelector('[data-review-label]');
        if (!label) return;
        var dt = document.createElement('dt');
        dt.textContent = label.getAttribute('data-review-label');
        var dd = document.createElement('dd');
        if (input.type === 'checkbox') {
          dd.textContent = input.checked ? (input.getAttribute('data-review-yes') || 'Yes') : (input.getAttribute('data-review-no') || 'No');
        } else if (input.tagName === 'SELECT') {
          var opt = input.options[input.selectedIndex];
          dd.textContent = opt && opt.value ? opt.textContent : (input.getAttribute('data-review-empty') || '—');
        } else {
          dd.textContent = input.value.trim() || (input.getAttribute('data-review-empty') || '—');
        }
        dl.appendChild(dt);
        dl.appendChild(dd);
      });
    });
  }

  function saveCurrentStep() {
    var el = steps[current];
    var key = stepKeys[current];
    if (key === 'review') return Promise.resolve();
    clearStepErrors(el);
    var fields = readStep(el);
    return api('/api/admissions/draft', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ step: key, fields: fields }),
    }).then(function (draft) {
      completedSteps = draft.completedSteps;
    }).catch(function (err) {
      if (err.status === 422 && err.body && err.body.fields) {
        showStepErrors(el, err.body.fields);
      } else if (stepError) {
        stepError.textContent = 'That step could not be saved just now. Your answers are still in the form — try Continue again.';
      }
      throw err;
    });
  }

  function fillFieldsFromDraft(data) {
    steps.forEach(function (el) {
      $$('[name]', el).forEach(function (input) {
        var name = input.getAttribute('name');
        if (!(name in data) || data[name] == null) return;
        if (input.type === 'checkbox') input.checked = !!data[name];
        else input.value = data[name];
      });
    });
  }

  function renderStatus(application) {
    if (wizardShell) wizardShell.hidden = true;
    if (!statusShell) return;
    statusShell.hidden = false;
    var idEl = $('[data-status-id]', statusShell);
    var stateEl = $('[data-status-state]', statusShell);
    if (idEl) idEl.textContent = application.id;
    if (stateEl) stateEl.textContent = application.status;
    $$('[data-status-only]', statusShell).forEach(function (el) {
      el.hidden = el.getAttribute('data-status-only') !== application.status;
    });
  }

  function init() {
    api('/api/admissions/draft').then(function (draft) {
      if (draft.application) { renderStatus(draft.application); return; }
      completedSteps = draft.completedSteps || [];
      fillFieldsFromDraft(draft.data || {});
      if (wizardShell) wizardShell.hidden = false;
      // Resume where they left off: the first step not yet marked
      // complete, or the review step if every data step already is.
      var resumeIndex = stepKeys.findIndex(function (k) { return k !== 'review' && completedSteps.indexOf(k) === -1; });
      showStep(resumeIndex === -1 ? steps.length - 1 : resumeIndex);
    }).catch(function () {
      if (stepError) stepError.textContent = 'Could not load your application. Reload the page, or write to Admissions if this continues.';
    });

    nextBtn.addEventListener('click', function () {
      nextBtn.disabled = true;
      saveCurrentStep().then(function () {
        showStep(Math.min(current + 1, steps.length - 1));
      }).catch(function () {}).then(function () { nextBtn.disabled = false; });
    });

    backBtn.addEventListener('click', function () {
      showStep(Math.max(current - 1, 0));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      if (stepError) stepError.textContent = '';

      var payload = {};
      steps.forEach(function (el) {
        if (el.getAttribute('data-step') === 'review') return;
        Object.assign(payload, readStep(el));
      });

      api('/api/admissions/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(function (result) {
        renderStatus({ id: result.applicationId, status: result.status });
      }).catch(function (err) {
        if (err.status === 422 && err.body && err.body.fields) {
          var firstStepWithError = steps.find(function (el) {
            return Object.keys(err.body.fields).some(function (f) { return $('[name="' + f + '"]', el); });
          });
          if (firstStepWithError) {
            showStep(steps.indexOf(firstStepWithError));
            showStepErrors(firstStepWithError, err.body.fields);
          }
        } else if (stepError) {
          stepError.textContent = 'Submission did not go through. Nothing has been lost — your answers are saved; try Submit again, or write to Admissions directly.';
        }
      }).catch(function () {}).then(function () { submitBtn.disabled = false; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var guarded = window.WEC_LC_guardPortal({
      signOutRedirect: '/admissions/',
      shellSelector: '.lab-body',
      onAuthenticated: function (clerk, done) {
        window.WEC_LC_apiAuth.attach(clerk);
        done();
        init();
      },
    });
    // No Clerk key configured: the page cannot check a session at
    // all, so it says so rather than pretending the wizard works.
    if (!guarded) {
      var notice = $('[data-wizard-unavailable]');
      if (notice) notice.hidden = false;
    }
  });
})();
