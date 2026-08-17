// AIPC — shared portal auth-guard shell.
//
// This is the reusable "flagship pattern" — every portal built after
// the Student Portal (Faculty, Administration, Executive, Corporate,
// Alumni — see docs/master-roadmap.md) should gate its pages through
// this one function instead of re-implementing gate/redirect/sign-out.
// A new portal's own script becomes just the part that's actually
// specific to it: what data to load and how to render it.
//
// window.AIPC_guardPortal({
//   signOutRedirect: '/',                 // where Sign Out sends the browser
//   shellSelector: '.app-shell',          // optional — the page content to
//                                          // make inert behind the gate;
//                                          // defaults to '.app-shell'
//   onAuthenticated: function(clerk, done) { ... }  // called once a real
//                                          // session exists; call done()
//                                          // when ready to remove the
//                                          // loading gate.
//   onAuthUnavailable: function(err) { ... }        // optional — the auth
//                                          // provider could not be
//                                          // reached at all (offline).
//                                          // The gate is already gone.
// })
//
// Returns true if a Clerk key is configured (the guard is running) or
// false if it did nothing (the shipped, no-key default) — a caller can
// use this to skip page-specific setup that only makes sense once live.
//
// Requires js/auth-config.js and js/clerk-loader.js loaded first.
window.AIPC_guardPortal = function (opts) {
  var cfg = window.AIPC_AUTH || {};
  var pk = cfg.clerkPublishableKey;
  if (!pk) return false;

  // While the gate is up, the real page content behind it must not be
  // reachable by keyboard — a full-page visual overlay alone doesn't
  // stop Tab from moving focus into whatever's underneath it. `inert`
  // removes the shell from both the tab order and the accessibility
  // tree until it's restored below; focus moves onto the gate itself
  // so a screen reader user lands somewhere meaningful immediately.
  var shell = document.querySelector(opts.shellSelector || '.app-shell');
  if (shell) shell.inert = true;

  var gate = buildGate();
  document.body.appendChild(gate);
  gate.focus();

  window.AIPC_loadClerk(pk, function (err, clerk) {
    if (err) {
      // Clerk's SDK is served from Clerk's own domain, so this is what
      // being offline looks like. A page with an offline mode (the
      // Listening Lab) wants to carry on from its cache rather than
      // sit behind a gate it can never clear; one without says so and
      // stops. The page decides, not the guard.
      removeGate(gate, shell);
      if (opts.onAuthUnavailable) opts.onAuthUnavailable(err);
      return;
    }

    if (!clerk.user) {
      clerk.redirectToSignIn({ redirectUrl: window.location.href });
      return;
    }

    wireSignOut(clerk, opts.signOutRedirect || '/');
    opts.onAuthenticated(clerk, function () { removeGate(gate, shell); });
  });

  return true;

  function wireSignOut(clerk, redirectTo) {
    document.querySelectorAll('[data-sign-out]').forEach(function (el) {
      el.classList.remove('disabled-link');
      el.removeAttribute('aria-disabled');
      el.removeAttribute('tabindex'); // was -1 (removed from tab order) while inert — see css/dashboard.css .disabled-link
      el.addEventListener('click', function (e) {
        e.preventDefault();
        // Drop this learner's offline cache before the session goes —
        // signing out on a shared machine has to take the cached work
        // with it. No-op on pages that don't use the offline worker.
        if (window.AIPC_apiAuth) window.AIPC_apiAuth.attach(null);
        clerk.signOut(function () { window.location.href = redirectTo; });
      });
    });
  }

  function buildGate() {
    var el = document.createElement('div');
    el.className = 'auth-gate';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.tabIndex = -1; // focusable programmatically (gate.focus() above) without joining the tab order itself
    el.innerHTML = '<div class="auth-gate__spinner" aria-hidden="true"></div><p class="auth-gate__text">Checking your session…</p>';
    return el;
  }

  function removeGate(gate, shell) {
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
    if (shell) shell.inert = false;
  }
};
