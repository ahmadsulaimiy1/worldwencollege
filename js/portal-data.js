// WEC — the portal's data seam.
//
// WHY THIS EXISTS
// ---------------
// Every portal page used to build its own `api(path, opts)` helper and
// name a URL inline: my-programme.js asked for '/api/student/study-plan',
// listening-lab.js for '/api/lms/recording/init', and so on. Four of
// those helpers were byte-for-byte the same function copied five times,
// and each page therefore knew two things it had no business knowing —
// that the College's data lives behind HTTP, and what the routes are
// called.
//
// That is fine until the backend moves. This repository's backend is
// Clerk for identity and Cloudflare D1/R2 for storage, written and
// tested; a Firebase implementation has been raised as a direction. With
// URLs spread across fourteen modules, that migration is fourteen
// rewrites and a regression surface across every portal screen.
//
// So the pages no longer name endpoints. They call OPERATIONS —
// studyPlan(), reviewQueue(), recordingInit() — and a provider decides
// what those mean. Swapping backend means writing one provider and
// calling use(); it does not mean touching a single page.
//
// WHAT THIS IS NOT
// ----------------
// It is not a migration, and nothing here moves the College off Clerk or
// D1. The REST provider below is the shipped default and behaves exactly
// as the inline helpers it replaces did, down to the error shape. A
// second provider is additive: until one is registered and selected,
// this file changes how the code is organised and nothing about how it
// runs.
//
// Requires js/auth-config.js and js/api-auth.js loaded first.

window.WEC_LC_data = (function () {
  'use strict';

  var providers = {};
  var activeName = 'rest';

  // -------------------------------------------------------------------
  // The operation surface.
  //
  // This list IS the contract. A provider that does not implement one of
  // these names will throw a clear error naming the operation and the
  // provider, rather than failing as an undefined function call three
  // frames deep inside a page. tests/portal-data.test.mjs asserts that
  // every /api/ path reachable from js/ is represented here, so an
  // endpoint added later cannot quietly bypass the seam.
  // -------------------------------------------------------------------
  var OPERATIONS = [
    // identity
    'me',
    // student
    'dashboard', 'studyPlan', 'profile', 'saveProfile',
    'profileShares', 'createProfileShare', 'documents', 'sharedProfile',
    // learning
    'timeOnTask', 'reviewQueue', 'recordingInit', 'recordingPart',
    'recordingComplete', 'recordingReview', 'quizAttempt',
    'pronunciationProfile', 'unit', 'listeningAnalytics',
    // credentials
    'graduate', 'institutionalVerify', 'credentialQr',
    // admissions
    'admissionsDraft', 'saveAdmissionsDraft', 'admissionsApply',
    'admissionsDocument',
    // account
    'registerAccount',
    // administration
    'adminRole', 'roleFor', 'adminEnrolment', 'learners', 'learner',
    'revenueReport', 'reconciliationReport'
  ];

  // -------------------------------------------------------------------
  // Transport for the REST provider.
  //
  // Lifted verbatim in behaviour from the helpers it replaces: a token is
  // minted per request rather than captured once (Clerk session tokens
  // are short-lived and the Listening Lab outlives them), a non-2xx
  // throws an Error carrying .status and .body, and a body that is not
  // JSON degrades to {} instead of throwing a parse error over the top
  // of the real failure.
  // -------------------------------------------------------------------
  function request(path, opts) {
    var o = opts || {};
    return window.WEC_LC_apiAuth.headers().then(function (headers) {
      var init = { method: o.method || 'GET', headers: headers };
      if (o.body !== undefined) init.body = JSON.stringify(o.body);
      if (o.signal) init.signal = o.signal;
      return fetch(path, init);
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) {
          // apiMessage is set ONLY when the endpoint deliberately wrote a
          // sentence for a human. r.statusText is not that: it is HTTP's
          // own wording ("File not found", "Internal Server Error"), and
          // pages that printed err.message were showing it verbatim to
          // learners. Keeping the two apart is what lets humanError()
          // below decide which is safe to surface.
          var apiMessage = body && typeof body.message === 'string' && body.message
            ? body.message : null;
          throw Object.assign(new Error(apiMessage || r.statusText), {
            status: r.status, body: body, apiMessage: apiMessage
          });
        }
        return body;
      });
    });
  }

  function seg(v) { return encodeURIComponent(String(v)); }

  var rest = {
    name: 'rest',

    me: function () { return request('/api/auth/me'); },

    dashboard: function () { return request('/api/student/dashboard'); },
    studyPlan: function () { return request('/api/student/study-plan'); },
    profile: function () { return request('/api/student/profile'); },
    saveProfile: function (body) {
      return request('/api/student/profile', { method: 'PUT', body: body });
    },
    profileShares: function () { return request('/api/student/profile-shares'); },
    createProfileShare: function (body) {
      return request('/api/student/profile-shares', { method: 'POST', body: body });
    },
    documents: function () { return request('/api/student/documents'); },
    sharedProfile: function (token) { return request('/api/share/' + seg(token)); },

    timeOnTask: function (body) {
      return request('/api/lms/time-on-task', { method: 'POST', body: body });
    },
    reviewQueue: function (levelId) {
      return request('/api/lms/review-queue' + (levelId ? '?levelId=' + seg(levelId) : ''));
    },
    recordingInit: function (body) {
      return request('/api/lms/recording/init', { method: 'POST', body: body });
    },
    // NOTE the raw body. A recording part is an audio chunk, and the
    // shared transport JSON-stringifies whatever it is handed — putting a
    // Blob through it would upload the string "[object Blob]" and the
    // failure would surface as a corrupt recording, not an error. So this
    // operation takes the chunk and passes it untouched.
    recordingPart: function (id, part, chunk) {
      return window.WEC_LC_apiAuth.headers().then(function (headers) {
        var h = Object.assign({}, headers);
        delete h['Content-Type'];
        return fetch('/api/lms/recording/part?id=' + seg(id) + '&part=' + seg(part),
          { method: 'POST', headers: h, body: chunk });
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (b) {
          if (!r.ok) throw Object.assign(new Error(b.message || r.statusText), { status: r.status, body: b });
          return b;
        });
      });
    },
    unit: function (id) { return request('/api/lms/unit?id=' + seg(id)); },
    listeningAnalytics: function (levelId) {
      return request('/api/lms/listening-analytics?levelId=' + seg(levelId));
    },
    recordingComplete: function (body) {
      return request('/api/lms/recording/complete', { method: 'POST', body: body });
    },
    recordingReview: function (body) {
      return request('/api/lms/recording-review', { method: 'POST', body: body });
    },
    quizAttempt: function (body) {
      return request('/api/lms/quiz-attempt', { method: 'POST', body: body });
    },
    pronunciationProfile: function (levelId) {
      return request('/api/lms/pronunciation-profile' + (levelId ? '?levelId=' + seg(levelId) : ''));
    },

    graduate: function (code) { return request('/api/graduate/' + seg(code)); },
    // Returns SVG TEXT, not JSON. The shared transport parses every
    // response as JSON and would turn the College's QR into {} — the
    // caller would then render nothing and report no error. Typed here
    // rather than left for the caller to discover.
    credentialQr: function (code) {
      return fetch('/api/credentials/qr?code=' + seg(code)).then(function (r) {
        if (!r.ok) throw Object.assign(new Error(String(r.status)), { status: r.status });
        return r.text();
      });
    },
    institutionalVerify: function (body) {
      return request('/api/verify/institutional/', { method: 'POST', body: body });
    },

    admissionsDraft: function () { return request('/api/admissions/draft'); },
    saveAdmissionsDraft: function (body) {
      return request('/api/admissions/draft', { method: 'PUT', body: body });
    },
    admissionsApply: function (body) {
      return request('/api/admissions/apply', { method: 'POST', body: body });
    },
    admissionsDocument: function (body) {
      return request('/api/admissions/document', { method: 'POST', body: body });
    },

    registerAccount: function (body) {
      return request('/api/register', { method: 'POST', body: body });
    },

    adminRole: function () { return request('/api/admin/role'); },
    roleFor: function (userId) { return request('/api/admin/role?userId=' + seg(userId)); },
    learners: function (q) { return request('/api/admin/learners?q=' + seg(q === undefined ? '' : q)); },
    learner: function (id) { return request('/api/admin/learners?id=' + seg(id)); },
    adminEnrolment: function (body) {
      return request('/api/admin/enrolment', { method: 'POST', body: body });
    },
    revenueReport: function () { return request('/api/admin/reports/revenue'); },
    reconciliationReport: function () { return request('/api/admin/reports/reconciliation'); }
  };

  // -------------------------------------------------------------------
  // One sentence a learner should actually read.
  //
  // Every portal page had its own `'Could not load: ' + err.message`,
  // which is fine while the API is answering and becomes "Could not
  // load: File not found" the moment anything else does. A person
  // reading that has been handed a server's internal vocabulary and no
  // idea what to do next.
  //
  // So: a status the College recognises gets the College's own wording;
  // a message the API deliberately wrote gets used as written; and
  // HTTP's statusText is never shown to anyone.
  // -------------------------------------------------------------------
  function humanError(err, fallback) {
    var status = err && err.status;
    if (!status) {
      return 'The College could not be reached. Check your connection and try again.';
    }
    if (status === 401) return 'Sign in to see this.';
    // A refusal and a missing thing are the two statuses where the
    // endpoint's own sentence is the useful one, and where the generic
    // wording is actively misleading: "This is not available on your
    // account" is what a staff member saw when the real reason was that
    // they were trying to change THEIR OWN enrolment, which any other
    // staff member could have done for them in a second. The admin page
    // had already been fixed once for exactly this, with a comment
    // saying so; routing it through here undid the fix without touching
    // the page.
    //
    // apiMessage is only ever set when an endpoint deliberately wrote a
    // sentence for a person to read — never HTTP's statusText — so
    // preferring it here does not reopen the leak this function exists
    // to close.
    if (status === 403) {
      return (err && err.apiMessage) || 'This is not available on your account.';
    }
    if (status === 404) return (err && err.apiMessage) || fallback || 'That could not be found.';
    if (status === 429) return 'That was tried a few times in a row. Wait a moment and try again.';
    if (status >= 500) return 'Something went wrong at our end. Please try again shortly.';
    return (err && err.apiMessage) || fallback || 'That did not work. Please try again.';
  }

  function register(name, impl) {
    if (!name || !impl) throw new Error('WEC_LC_data.register needs a name and an implementation');
    providers[name] = impl;
  }

  function use(name) {
    if (!providers[name]) {
      throw new Error('WEC_LC_data: no provider registered as "' + name + '"');
    }
    activeName = name;
  }

  function active() { return providers[activeName]; }

  register('rest', rest);

  // The public surface: one delegating function per operation. Built
  // from OPERATIONS rather than written out, so the list above cannot
  // drift from what is actually callable.
  var api = {
    register: register,
    use: use,
    provider: function () { return activeName; },
    humanError: humanError,
    operations: function () { return OPERATIONS.slice(); },

    // Escape hatch for a call that has no operation yet. Deliberately
    // named so it is greppable and obvious in review: anything reaching
    // for this is bypassing the seam and should probably become an
    // operation instead.
    rawRequest: request
  };

  OPERATIONS.forEach(function (op) {
    api[op] = function () {
      var p = active();
      if (typeof p[op] !== 'function') {
        throw new Error('WEC_LC_data: provider "' + activeName + '" does not implement ' + op + '()');
      }
      return p[op].apply(p, arguments);
    };
  });

  return api;
})();
