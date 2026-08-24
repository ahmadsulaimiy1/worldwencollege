/* WEC — the admissions application wizard.

   Replaces the old single-page #apply form with a real multi-step,
   account-backed process: sign in (Clerk, via js/portal-guard.js —
   see that file for what "no key configured" does to this page),
   work through five visual stages saving as you go, review, submit.
   The submit step calls the SAME functions/api/admissions/apply.js
   endpoint the old one-page form always has — nothing about final
   submission changed; what changed is that a signed-in applicant now
   has a place for the in-progress work to live between visits
   (functions/api/admissions/draft.js) instead of losing it the moment
   the tab closes.

   The engine is purely structural: every step's fields, labels and
   copy live in the page's own HTML (one <fieldset data-step="…">
   per BACKEND step key, already authored in English or Arabic — this
   file reads structure and never writes prose. It reads a field's
   name/value and its [data-review-label] for the review screen; it
   never invents a sentence.

   STAGES vs STEPS — the one thing worth being precise about:
   functions/_lib/admissions/fields.js's WIZARD_STEPS still has 9 real
   backend step keys, unchanged, each saved via its own
   PUT /api/admissions/draft call. This file groups those 9 fieldsets
   into 5 VISUAL stages (matched to each fieldset's data-stage-index
   attribute) so an applicant sees "Stage 2 of 5," not "Step 4 of 9" —
   advancing a stage fires one PUT per backend step key it contains,
   sequentially, exactly as before; the backend sees no difference.

   STATE, kept deliberately small:
     currentStage      — which stage index is visible (0-4)
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
  var stageOf = steps.map(function (el) { return parseInt(el.getAttribute('data-stage-index'), 10); });
  var stageCount = stageOf.reduce(function (max, i) { return Math.max(max, i); }, 0) + 1;
  var stepperNodes = $$('[data-stepper-node]');
  var progressLabel = $('[data-wizard-progress-label]');
  var backBtn = $('[data-wizard-back]');
  var nextBtn = $('[data-wizard-next]');
  var submitBtn = $('[data-wizard-submit]');
  var stepError = $('[data-wizard-step-error]');
  var wizardShell = $('[data-wizard-shell]');
  var statusShell = $('[data-application-status]');
  var loadErrorShell = $('[data-wizard-load-error]');

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

  // A stage is "done" only once every backend step key it contains has
  // been saved — a stage with an untouched optional sub-step (e.g.
  // "Contact & safety" before Emergency Contact is ever opened) still
  // counts as done, since saveCurrentStage() below saves every key in
  // the stage regardless of whether its <details> was ever opened.
  function stageIsDone(stageIndex) {
    return stepKeys.some(function (key, i) { return stageOf[i] === stageIndex; })
      && stepKeys.every(function (key, i) { return stageOf[i] !== stageIndex || completedSteps.indexOf(key) !== -1; });
  }

  function updateStepper() {
    stepperNodes.forEach(function (node, i) {
      var done = i !== current && stageIsDone(i);
      node.classList.toggle('is-done', done);
      node.classList.toggle('is-current', i === current);
      var btn = $('[data-stepper-jump]', node);
      if (btn) btn.disabled = !done;
    });
    if (progressLabel) {
      progressLabel.textContent = 'Stage ' + (current + 1) + ' of ' + stageCount;
    }
  }

  function showStage(index) {
    steps.forEach(function (el, i) {
      var visible = stageOf[i] === index;
      el.hidden = !visible;
      // A fieldset inside a <details data-optional> stays collapsed by
      // default even when its stage is showing — opening it is the
      // applicant's choice, not forced by navigation.
      var wrapper = el.closest('details.wizard-optional');
      if (wrapper) wrapper.hidden = !visible;
    });
    current = index;
    var isLast = index === stageCount - 1;
    backBtn.hidden = index === 0;
    nextBtn.hidden = isLast;
    submitBtn.hidden = !isLast;
    if (isLast) renderReview();
    if (stepKeys.some(function (k, i) { return k === 'identity-document' && stageOf[i] === index; })) renderKycDocs();
    updateStepper();
    var firstVisible = steps.filter(function (_, i) { return stageOf[i] === index; })[0];
    if (firstVisible) firstVisible.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  // The identity document is OPTIONAL and uploaded through its own
  // binary endpoint (functions/api/admissions/document.js), not the
  // JSON step-save PUT every other field goes through — a file cannot
  // travel in a JSON body. This list is what tells an applicant
  // returning to a saved draft what they already uploaded, since the
  // file itself lives in R2, not in the draft's own JSON blob.
  function renderKycDocs() {
    var list = $('[data-kyc-doc-list]');
    if (!list) return;
    list.innerHTML = '<li class="kyc-doc-list__loading">Checking for an existing upload…</li>';
    api('/api/admissions/document').then(function (result) {
      list.innerHTML = '';
      if (!result.documents.length) {
        list.innerHTML = '<li class="kyc-doc-list__empty">Nothing uploaded yet — this step can stay empty.</li>';
        return;
      }
      result.documents.forEach(function (doc) {
        var li = document.createElement('li');
        li.className = 'kyc-doc-list__item';
        var name = document.createElement('span');
        name.textContent = (doc.filename || doc.documentType) + ' — uploaded, not verified';
        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'kyc-doc-list__remove';
        del.textContent = 'Remove';
        del.addEventListener('click', function () {
          del.disabled = true;
          api('/api/admissions/document?id=' + encodeURIComponent(doc.id), { method: 'DELETE' })
            .then(renderKycDocs)
            .catch(function () { del.disabled = false; });
        });
        li.appendChild(name);
        li.appendChild(del);
        list.appendChild(li);
      });
    }).catch(function () {
      list.innerHTML = '<li class="kyc-doc-list__empty">Could not check for an existing upload.</li>';
    });
  }

  function setDropzoneFilename(name) {
    var el = $('[data-dropzone-filename]');
    if (!el) return;
    if (name) { el.textContent = name; el.hidden = false; } else { el.hidden = true; el.textContent = ''; }
  }

  function wireKycUpload() {
    var btn = $('[data-kyc-upload-btn]');
    var fileInput = $('[data-kyc-file-input]');
    var typeSelect = $('[data-kyc-doc-type]');
    var errorEl = $('[data-kyc-upload-error]');
    var dropzone = $('[data-kyc-dropzone]');
    if (!btn || !fileInput) return;

    if (dropzone) {
      ['dragenter', 'dragover'].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.add('is-dragover'); });
      });
      ['dragleave', 'dragend'].forEach(function (evt) {
        dropzone.addEventListener(evt, function () { dropzone.classList.remove('is-dragover'); });
      });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.classList.remove('is-dragover');
        var files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) {
          fileInput.files = files;
          setDropzoneFilename(files[0].name);
        }
      });
    }
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      setDropzoneFilename(file ? file.name : null);
    });

    btn.addEventListener('click', function () {
      var file = fileInput.files && fileInput.files[0];
      if (errorEl) errorEl.textContent = '';
      if (!file) { if (errorEl) errorEl.textContent = 'Choose a file first.'; return; }
      btn.disabled = true;
      window.WEC_LC_apiAuth.headers().then(function (headers) {
        return file.arrayBuffer().then(function (bytes) {
          return fetch('/api/admissions/document', {
            method: 'POST',
            headers: Object.assign({}, headers, {
              'content-type': file.type,
              'x-kyc-document-type': typeSelect ? typeSelect.value : 'passport',
              'x-kyc-filename': encodeURIComponent(file.name),
            }),
            body: bytes,
          });
        });
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw Object.assign(new Error(body.message || r.statusText), { body: body });
          return body;
        });
      }).then(function () {
        fileInput.value = '';
        setDropzoneFilename(null);
        renderKycDocs();
      }).catch(function (err) {
        if (errorEl) errorEl.textContent = (err.body && err.body.message) || 'Upload did not go through — try again.';
      }).then(function () { btn.disabled = false; });
    });
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

  // Saves every backend step key belonging to the current stage,
  // sequentially, one PUT /api/admissions/draft per key — identical
  // wire behaviour to the old one-fieldset-per-step model, just fired
  // in a small chain instead of a single call. 'review' owns no
  // fields and is skipped, same as before.
  function saveCurrentStage() {
    var stageSteps = steps.filter(function (_, i) { return stageOf[i] === current; });
    var chain = Promise.resolve();
    stageSteps.forEach(function (el) {
      var key = el.getAttribute('data-step');
      if (key === 'review') return;
      chain = chain.then(function () {
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
            stepError.textContent = 'That stage could not be saved just now. Your answers are still in the form — try Continue again.';
          }
          throw err;
        });
      });
    });
    return chain;
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

  // A suggested level from the self-assessment quiz on the pillar page
  // (js/site.js) carries forward automatically — same-origin
  // sessionStorage, no server round-trip. Only applies when the level
  // field is still genuinely empty, so it never overwrites a draft
  // that already has a real answer.
  function prefillSuggestedLevel() {
    var levelField = $('#w-level');
    if (!levelField || levelField.value) return;
    var raw, suggestion;
    try {
      raw = window.sessionStorage.getItem('wec-suggested-level');
      suggestion = raw && JSON.parse(raw);
    } catch (e) { return; }
    if (!suggestion || !suggestion.levelId) return;
    var value = String(suggestion.levelId);
    var hasOption = $$('option', levelField).some(function (o) { return o.value === value; });
    if (!hasOption) return;
    levelField.value = value;
    var note = $('[data-level-prefill-note]');
    if (note) note.hidden = false;
  }

  function renderStatus(application) {
    if (wizardShell) wizardShell.hidden = true;
    if (!statusShell) return;
    statusShell.hidden = false;
    statusShell.classList.toggle('success-moment--milestone', application.status === 'submitted');
    var markEl = $('[data-success-mark]', statusShell);
    if (markEl) markEl.classList.toggle('aurum', application.status === 'submitted');
    var idEl = $('[data-status-id]', statusShell);
    var stateEl = $('[data-status-state]', statusShell);
    if (idEl) idEl.textContent = application.id;
    if (stateEl) stateEl.textContent = application.status;
    var pillVariant = { submitted: 'progress', placement_pending: 'progress', offer_sent: 'progress', accepted: 'good', enrolled: 'good', withdrawn: 'muted', rejected: 'muted' }[application.status] || 'muted';
    if (stateEl) stateEl.className = 'status-pill status-pill--' + pillVariant;
    $$('[data-status-only]', statusShell).forEach(function (el) {
      el.hidden = el.getAttribute('data-status-only') !== application.status;
    });
  }

  function init() {
    wireKycUpload();
    api('/api/admissions/draft').then(function (draft) {
      if (draft.application) { renderStatus(draft.application); return; }
      completedSteps = draft.completedSteps || [];
      fillFieldsFromDraft(draft.data || {});
      prefillSuggestedLevel();
      if (wizardShell) wizardShell.hidden = false;
      // Resume where they left off: the stage containing the first
      // step not yet marked complete, or the last stage if every data
      // step already is.
      var resumeStepIndex = stepKeys.findIndex(function (k) { return k !== 'review' && completedSteps.indexOf(k) === -1; });
      showStage(resumeStepIndex === -1 ? stageCount - 1 : stageOf[resumeStepIndex]);
    }).catch(function () {
      // The wizard shell itself is never revealed on this path, so a
      // message written inside it (e.g. onto data-wizard-step-error)
      // would be invisible — a blank page behind a signed-in header.
      // This dedicated state is the one place a load failure is
      // actually shown.
      if (loadErrorShell) loadErrorShell.hidden = false;
    });

    nextBtn.addEventListener('click', function () {
      nextBtn.disabled = true;
      saveCurrentStage().then(function () {
        showStage(Math.min(current + 1, stageCount - 1));
      }).catch(function () {}).then(function () { nextBtn.disabled = false; });
    });

    backBtn.addEventListener('click', function () {
      showStage(Math.max(current - 1, 0));
    });

    // A completed stage's dot is a real button — clicking it jumps
    // back to review/change an earlier answer. Upcoming stages have no
    // such control (disabled in updateStepper()), since you cannot
    // legally skip ahead of data that was never saved.
    stepperNodes.forEach(function (node, i) {
      var btn = $('[data-stepper-jump]', node);
      if (!btn) return;
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        showStage(i);
      });
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
            showStage(stageOf[steps.indexOf(firstStepWithError)]);
            showStepErrors(firstStepWithError, err.body.fields);
          }
        } else if (stepError) {
          stepError.textContent = 'Submission did not go through. Nothing has been lost — your answers are saved; try Submit again, or write to Admissions directly.';
        }
      }).catch(function () {}).then(function () { submitBtn.disabled = false; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var reloadBtn = $('[data-wizard-reload]');
    if (reloadBtn) reloadBtn.addEventListener('click', function () { window.location.reload(); });

    var guarded = window.WEC_LC_guardPortal({
      signOutRedirect: '/admissions/',
      shellSelector: '.apply-body',
      onAuthenticated: function (clerk, done) {
        window.WEC_LC_apiAuth.attach(clerk);
        done();
        init();
      },
      // Clerk's own SDK could not be reached at all (offline, blocked
      // script) — the gate is already gone by the time this fires, so
      // without a handler the page is just blank behind the header.
      onAuthUnavailable: function () {
        if (loadErrorShell) loadErrorShell.hidden = false;
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
