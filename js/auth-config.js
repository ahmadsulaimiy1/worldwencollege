// WEC-LC — client-side auth configuration.
//
// This is the ONE line that needs a real value at deployment. It is safe
// to ship publicly: Clerk publishable keys are not secret (they are
// embedded in every page that uses Clerk's client SDK, the same way a
// Stripe *publishable* key is). The corresponding *secret* keys live only
// in Cloudflare Pages environment variables — see functions/_lib/auth/.
//
// Left empty, every portal page that checks this config falls back to
// its static illustrative-preview behavior with no auth calls attempted
// — see js/portal-auth.js.
window.WEC_LC_AUTH = {
  clerkPublishableKey: ''
};
