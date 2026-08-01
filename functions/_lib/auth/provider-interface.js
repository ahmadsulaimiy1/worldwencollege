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
  async verifyWebhookSignature(_request, _rawBody, _env) {
    throw new Error('Not implemented');
  }
  parseWebhookEvent(_rawBody) {
    throw new Error('Not implemented');
  }
}
