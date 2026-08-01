// WEC-LC — Student Portal client-side auth guard.
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
    // WEC-LC doesn't rebuild that UI. These buttons deep-link into
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

    // /api/auth/me carries WEC-LC's own record (role, preferred language,
    // programme fields) beyond what Clerk's user object knows about. If
    // it isn't reachable yet (not deployed, or the users row hasn't been
    // created by the webhook), the page still works — Clerk auth itself
    // succeeded, so we just keep the illustrative programme data as-is
    // rather than showing a broken page over a secondary fetch failing.
    clerk.session.getToken().then(function (token) {
      return fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } });
    }).then(function (resp) {
      if (!resp.ok) throw new Error('auth/me unavailable');
      return resp.json();
    }).then(function (me) {
      if (me.preferredName) {
        document.querySelectorAll('[data-user-name]').forEach(function (el) { el.textContent = me.preferredName; });
      }
    }).catch(function () {}).then(done, done);
  }
})();
