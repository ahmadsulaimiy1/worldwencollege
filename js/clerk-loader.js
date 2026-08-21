// WEC — shared Clerk client-SDK bootstrap, used by any portal page
// that needs a real session (js/portal-auth.js for the Student Portal,
// js/finance-dashboard.js for the Finance preview). One copy of the
// "decode the publishable key, load clerk.browser.js, wait for
// Clerk.load()" sequence rather than duplicating it per portal — see
// docs/auth-architecture.md § Client-side integration for the full
// rationale and what's implemented-against-vs-tested here.
window.WEC_LC_loadClerk = function (publishableKey, done) {
  var fapi = frontendApiFromPublishableKey(publishableKey);
  if (!fapi) { done(new Error('invalid Clerk publishable key')); return; }

  var script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.setAttribute('data-clerk-publishable-key', publishableKey);
  script.src = 'https://' + fapi + '/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
  script.addEventListener('load', function () {
    window.Clerk.load().then(function () { done(null, window.Clerk); }).catch(done);
  });
  script.addEventListener('error', function () { done(new Error('failed to load Clerk')); });
  document.head.appendChild(script);

  function frontendApiFromPublishableKey(key) {
    var encoded = key.split('_').pop();
    try {
      return atob(encoded).replace(/\$$/, '');
    } catch (e) {
      return null;
    }
  }
};
