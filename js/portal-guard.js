// WEC-LC — shared portal auth-guard shell.
//
// This is the reusable "flagship pattern" — every portal built after
// the Student Portal (Faculty, Administration, Executive, Corporate,
// Alumni — see docs/master-roadmap.md) should gate its pages through
// this one function instead of re-implementing gate/redirect/sign-out.
// A new portal's own script becomes just the part that's actually
// specific to it: what data to load and how to render it.
//
// window.WEC_LC_guardPortal({
//   signOutRedirect: '/',                 // where Sign Out sends the browser
//   onAuthenticated: function(clerk, done) { ... }  // called once a real
//                                          // session exists; call done()
//                                          // when ready to remove the
//                                          // loading gate.
// })
//
// Returns true if a Clerk key is configured (the guard is running) or
// false if it did nothing (the shipped, no-key default) — a caller can
// use this to skip page-specific setup that only makes sense once live.
//
// Requires js/auth-config.js and js/clerk-loader.js loaded first.
window.WEC_LC_guardPortal = function (opts) {
  var cfg = window.WEC_LC_AUTH || {};
  var pk = cfg.clerkPublishableKey;
  if (!pk) return false;

  var gate = buildGate();
  document.body.appendChild(gate);

  window.WEC_LC_loadClerk(pk, function (err, clerk) {
    if (err) { removeGate(gate); return; }

    if (!clerk.user) {
      clerk.redirectToSignIn({ redirectUrl: window.location.href });
      return;
    }

    wireSignOut(clerk, opts.signOutRedirect || '/');
    opts.onAuthenticated(clerk, function () { removeGate(gate); });
  });

  return true;

  function wireSignOut(clerk, redirectTo) {
    document.querySelectorAll('[data-sign-out]').forEach(function (el) {
      el.classList.remove('disabled-link');
      el.removeAttribute('aria-disabled');
      el.addEventListener('click', function (e) {
        e.preventDefault();
        clerk.signOut(function () { window.location.href = redirectTo; });
      });
    });
  }

  function buildGate() {
    var el = document.createElement('div');
    el.className = 'auth-gate';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="auth-gate__spinner" aria-hidden="true"></div><p class="auth-gate__text">Checking your session…</p>';
    return el;
  }

  function removeGate(gate) {
    if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
  }
};
