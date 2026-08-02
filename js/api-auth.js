// WEC-LC — authenticated API request headers.
//
// Every LMS endpoint under functions/api/lms/* calls requireUser(),
// which reads `Authorization: Bearer <clerk session token>`. Any page
// that talks to those endpoints has to attach that header or it gets a
// 401 no matter how well the rest of it works. This is the one place
// that knows how.
//
// Two states, deliberately:
//
//   no publishable key configured  — headers() returns the plain
//     Content-Type headers. This is the shipped default and the state
//     the local test harness runs in. Pages stay usable as design
//     previews; the API answers 401 and each page renders its own
//     "sign in" message.
//
//   key configured                 — attach(clerk) is called by the
//     portal guard once a real session exists, and headers() mints a
//     token for EVERY request rather than reusing one captured at page
//     load. Clerk session tokens are short-lived (about a minute), and
//     the Listening Lab is a page a learner sits on for far longer than
//     that: a token cached at boot would work for the first call and
//     silently 401 for the rest of the session.
//
// Requires js/auth-config.js loaded first.
window.WEC_LC_apiAuth = (function () {
  var clerk = null;

  // The worker may not be controlling this page yet on a first visit;
  // navigator.serviceWorker.ready resolves once one is, so the handshake
  // is never simply dropped.
  // Deliberately fire-and-forget. The first API call after attach() may
  // well beat this message to the worker; when it does, the worker takes
  // its fail-closed branch and serves that one request from the network
  // uncached. Costing a round trip on a cold load is the right trade
  // against blocking the page on a cache handshake.
  function tellWorker(userId) {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      var target = reg.active || navigator.serviceWorker.controller;
      if (target) target.postMessage({ type: 'SET_USER', userId: userId });
    }).catch(function () {});
  }

  return {
    // True when a Clerk publishable key is configured, i.e. when this
    // page is expected to run against real authenticated endpoints.
    isLive: function () {
      var cfg = window.WEC_LC_AUTH || {};
      return !!cfg.clerkPublishableKey;
    },

    attach: function (instance) {
      clerk = instance;
      // Tell the offline worker whose responses it is about to cache.
      // Until it knows, sw-lab.js refuses to cache any authenticated
      // read — see the CACHE_USER note there.
      tellWorker(instance && instance.user ? instance.user.id : null);
    },

    // Promise<Object> — the headers to send with an API request.
    headers: function (extra) {
      var base = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
      if (!clerk || !clerk.session) return Promise.resolve(base);
      return clerk.session.getToken().then(function (token) {
        if (token) base.Authorization = 'Bearer ' + token;
        return base;
      }, function () {
        // A token failure must not swallow the request: send it
        // unauthenticated and let the endpoint's 401 surface through
        // the page's normal error path, which already says something
        // useful about signing in.
        return base;
      });
    },
  };
})();
