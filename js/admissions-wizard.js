/* WEC — the admissions application wizard.

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

  // A JS-specified `behavior: 'smooth'` overrides CSS
  // `scroll-behavior: auto`, so the reduced-motion carve-out in
  // brand.css does NOT cover these calls. Checked here as well.
  function scrollPref() {
    return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ? 'auto' : 'smooth';
  }

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
  var loadErrorShell = $('[data-wizard-load-error]');
  var authUnreachableShell = $('[data-wizard-auth-unreachable]');

  // ────────────────────────────────────────────────────────────────
  // WHY A FAILURE IS CLASSIFIED RATHER THAN SUMMARISED
  // ────────────────────────────────────────────────────────────────
  // This page used to answer every load failure with one sentence:
  // "this is usually temporary". For one of the failures it is: a
  // stale token, a dropped connection. For the others it is false, and
  // the falsehood is expensive.
  //
  // The live incident: an applicant signed in, /api/admissions/draft
  // answered 503 because CLERK_JWTS were not configured on the
  // deployment, and the page invited them to press "Try again" — an
  // action that could not have succeeded on any attempt, ever. They
  // pressed it, it failed, and neither they nor anyone reading their
  // email could tell why.
  //
  // So each case gets its own sentence, its own action, and — where an
  // operator needs it — a reference line the applicant can quote.
  function classify(err) {
    if (!err) {
      return { title: 'Your application could not be loaded',
        message: 'Something interrupted the request. Nothing you have entered is lost.',
        retry: true };
    }
    if (err.offline || err.status === 0) {
      return {
        title: 'We could not reach the College',
        message: 'Your device could not reach worldwencollege.co.uk. Nothing you have '
          + 'entered is lost — check your connection and try again.',
        retry: true,
      };
    }
    // A verified session the College cannot make an account for. Told
    // apart from an expired one deliberately: "sign in again" is the
    // right instruction for an expired session and a guaranteed loop
    // for this one, because signing in again produces the same token
    // with the same missing claim.
    if (err.code === 'AccountProvisioningError') {
      return {
        title: 'Your account is not finished being set up',
        message: (err.message || 'The College could not finish setting up your account.')
          + ' Nothing you have entered is lost.',
        retry: false,
        reference: 'Reference for Admissions: account provisioning, no email claim.',
      };
    }
    if (err.status === 401) {
      return {
        title: 'Your session has expired',
        message: 'Sessions are short for your security, and yours ended while this page was '
          + 'open. Nothing you have entered is lost — sign in again and you will come back '
          + 'to exactly the step you left.',
        retry: false, signIn: true,
      };
    }
    if (err.status === 403) {
      return {
        title: 'This account cannot open an application',
        message: 'You are signed in, but this account is not an applicant account. If you '
          + 'signed in with the wrong address, sign out and use the one you applied with.',
        retry: false, signIn: true,
      };
    }
    // 503 with a ConfigError is the deployment telling us, in its own
    // words, that a prerequisite is missing. Retrying cannot help and
    // the page must not pretend otherwise.
    if (err.status === 503 || err.code === 'ConfigError') {
      return {
        title: 'The application system is not available',
        message: (err.message || 'A part of the College\u2019s system this page depends on is '
          + 'not available.') + ' This is not something you can fix by trying again, and it '
          + 'is not a fault in your application. Write to Admissions and we will take your '
          + 'application by email while it is put right.',
        retry: false, reference: 'Reference for Admissions: draft-load ' + (err.code || 'unavailable') + ' 503.',
      };
    }
    if (err.status >= 500) {
      return {
        title: 'Your application could not be loaded',
        message: 'The College\u2019s system answered with an error. Nothing you have entered '
          + 'is lost. This is usually temporary.',
        retry: true,
        reference: 'Reference for Admissions: draft-load error ' + err.status + '.',
      };
    }
    return {
      title: 'Your application could not be loaded',
      message: (err.message || 'The request did not complete.') + ' Nothing you have entered is lost.',
      retry: true,
      reference: 'Reference for Admissions: draft-load ' + (err.status || 'unknown') + '.',
    };
  }

  function showLoadError(err) {
    var c = classify(err);
    if (!loadErrorShell) return;
    var titleEl = $('[data-wizard-error-title]', loadErrorShell);
    var msgEl = $('[data-wizard-error-message]', loadErrorShell);
    var retryEl = $('[data-wizard-reload]', loadErrorShell);
    var signInEl = $('[data-wizard-signin]', loadErrorShell);
    var refEl = $('[data-wizard-error-ref]', loadErrorShell);
    if (titleEl) titleEl.textContent = c.title;
    if (msgEl) msgEl.textContent = c.message;
    if (retryEl) retryEl.hidden = !c.retry;
    if (signInEl) signInEl.hidden = !c.signIn;
    if (refEl) {
      refEl.hidden = !c.reference;
      refEl.textContent = c.reference || '';
    }
    loadErrorShell.hidden = false;
  }

  var current = 0;
  var completedSteps = [];
  // Kept so the "Sign in again" action can actually end the dead
  // session rather than bouncing the applicant to a page that will put
  // them straight back here with the same expired token.
  var clerkInstance = null;

  // One request, with the auth header attached.
  //
  // `retryOn401` exists because Clerk session tokens are short-lived —
  // about a minute — and a token minted while the page was loading can
  // already be stale by the time the request lands: a backgrounded tab,
  // a slow network, a phone that slept between sign-in and the first
  // fetch. That produced a hard "could not be loaded" for a session
  // that was perfectly valid and one fresh token away from working.
  //
  // Exactly one retry. A second 401 after a freshly minted token means
  // the session really is gone, and retrying a dead session in a loop
  // is how a page hammers an auth provider.
  function requestOnce(path, opts) {
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      var init = Object.assign({}, opts || {});
      init.headers = Object.assign({}, headers, (opts && opts.headers) || {});
      return fetch(path, init);
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) {
          throw Object.assign(new Error(body.message || r.statusText), {
            status: r.status,
            body: body,
            code: body.error || null,
          });
        }
        return body;
      });
    }, function (networkErr) {
      // fetch() rejects only on a transport failure. Mark it, because
      // "you are offline" and "the server refused you" need different
      // sentences and the old code showed the same one for both.
      throw Object.assign(networkErr || new Error('Network request failed.'), {
        status: 0, offline: true,
      });
    });
  }

  function api(path, opts, retryOn401) {
    return requestOnce(path, opts).catch(function (err) {
      if (err.status !== 401 || retryOn401 === false) throw err;
      return requestOnce(path, opts);
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
    if (stepKeys[index] === 'identity-document') renderKycDocs();
    updateStepper();
    steps[index].scrollIntoView({ block: 'start', behavior: scrollPref() });
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

  function wireKycUpload() {
    var btn = $('[data-kyc-upload-btn]');
    var fileInput = $('[data-kyc-file-input]');
    var typeSelect = $('[data-kyc-doc-type]');
    var errorEl = $('[data-kyc-upload-error]');
    if (!btn || !fileInput) return;
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
    wireKycUpload();
    api('/api/admissions/draft').then(function (draft) {
      if (draft.application) { renderStatus(draft.application); return; }
      completedSteps = draft.completedSteps || [];
      fillFieldsFromDraft(draft.data || {});
      if (wizardShell) wizardShell.hidden = false;
      // Resume where they left off: the first step not yet marked
      // complete, or the review step if every data step already is.
      var resumeIndex = stepKeys.findIndex(function (k) { return k !== 'review' && completedSteps.indexOf(k) === -1; });
      showStep(resumeIndex === -1 ? steps.length - 1 : resumeIndex);
    }).catch(function (err) {
      // The wizard shell itself is never revealed on this path, so a
      // message written inside it (e.g. onto data-wizard-step-error)
      // would be invisible — a blank page behind a signed-in header.
      // This dedicated state is the one place a load failure is
      // actually shown, and it now says WHICH failure.
      showLoadError(err);
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
    $$('[data-wizard-reload]').forEach(function (btn) {
      btn.addEventListener('click', function () { window.location.reload(); });
    });

    // Sign out, then return here: the portal guard sees no session and
    // sends the applicant to Clerk's sign-in with this page as the
    // return URL, so they land back on the step they left. Following
    // the href alone would keep the expired session and reproduce the
    // failure one click later.
    $$('[data-wizard-signin]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (!clerkInstance || !clerkInstance.signOut) return; // let the href do its work
        e.preventDefault();
        if (window.WEC_LC_apiAuth) window.WEC_LC_apiAuth.attach(null);
        clerkInstance.signOut(function () { window.location.reload(); });
      });
    });

    var guarded = window.WEC_LC_guardPortal({
      signOutRedirect: '/admissions/',
      shellSelector: '.lab-body',
      onAuthenticated: function (clerk, done) {
        clerkInstance = clerk;
        window.WEC_LC_apiAuth.attach(clerk);
        done();
        init();
      },
      // Clerk's own SDK could not be reached at all (offline, blocked
      // script) — the gate is already gone by the time this fires, so
      // without a handler the page is just blank behind the header.
      onAuthUnavailable: function () {
        // The applicant is NOT signed in here — Clerk's SDK never
        // loaded. This used to reveal the panel that opens "You signed
        // in, but...", which was simply untrue and sent people looking
        // for a problem with their application instead of their
        // network.
        if (authUnreachableShell) authUnreachableShell.hidden = false;
        else showLoadError({ offline: true, status: 0 });
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
