// Every auth provider adapter must implement this shape. Nothing
// outside this directory should import a provider SDK or call a
// provider's API directly — always go through session.js, which
// talks only to this interface. That's what makes swapping Clerk for
// another provider later a one-file change, not a platform rewrite.
//
// verifySessionToken(token, env) => Promise<{
//   providerId: string,       // the provider's own user id (Clerk's `sub` claim)
//   email: string,
//   emailVerified: boolean,
// } | null>                   // null (not a throw) for "not authenticated" —
//                              // reserve throwing for genuine config/network errors
//
// fetchIdentity(providerId, env) => Promise<{
//   email: string, emailVerified: boolean
// } | null>
//   — the provider's own record for a user we have already
//   authenticated, asked for directly. null when the provider cannot
//   answer (not configured, user unknown, no verified address).
//
//   THIS EXISTS BECAUSE A SESSION TOKEN IS NOT A PROFILE. Clerk's
//   default session token carries no email claim, and `users.email` is
//   NOT NULL because an email address must never be invented. Without
//   this method the only routes to an account were a dashboard setting
//   somebody had to remember and a webhook that might not have arrived
//   — so a learner could sign in successfully and still have no
//   account, with nothing they could do about it.
//
//   It is called ONLY on the provisioning path, when we have a verified
//   session for somebody we hold no row for. That is once per learner,
//   ever, not once per request.
//
// verifyWebhookSignature(request, rawBody, env) => Promise<boolean>
//   — validates an inbound webhook (e.g. "user.created") really came
//   from the provider before we trust its payload.
//
// parseWebhookEvent(rawBody) => { type: string, data: object }
//   — normalises the provider's webhook envelope into a shape
//   functions/api/auth/webhook-clerk.js can hand to the same sync
//   logic regardless of provider.

export class AuthProviderInterface {
  async verifySessionToken(_token, _env) {
    throw new Error('Not implemented');
  }
  async fetchIdentity(_providerId, _env) {
    throw new Error('Not implemented');
  }
  async verifyWebhookSignature(_request, _rawBody, _env) {
    throw new Error('Not implemented');
  }
  parseWebhookEvent(_rawBody) {
    throw new Error('Not implemented');
  }
}
