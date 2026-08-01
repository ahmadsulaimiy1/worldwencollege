// Frankfurter (frankfurter.app) — a free, no-API-key-required wrapper
// around the European Central Bank's daily reference rates. Chosen for
// GBP specifically: no account/billing relationship to set up before
// activating GBP (Executive Decision #2 lists it as a primary display
// currency), consistent with this project's "no separate vendor
// account for a solved problem" preference (see Turnstile's rationale
// in docs/executive-decision-brief.md).
//
// IMPORTANT LIMITATION, stated plainly rather than glossed over: the
// ECB's reference rates cover a fixed list of ~30 major currencies —
// GBP is on that list; NGN, SAR, AED, QAR, and KWD are NOT. Calling
// getRates() for those five will simply omit them from the result
// (this adapter does not fabricate a rate for a currency the feed
// doesn't carry). Activating those five currencies via a live feed —
// as opposed to a staff-set policy-fixed rate, see
// functions/api/admin/currency/set-rate.js — needs a different
// provider (e.g. openexchangerates.org, exchangerate-api.com, or a
// Gulf/Nigeria-specific feed) implemented as its own adapter against
// this same FxProviderInterface; nothing else in the platform would
// need to change to add one.
//
// Implemented against Frankfurter's publicly documented API shape,
// not exercised against the live endpoint — this environment's
// network policy blocks outbound calls to arbitrary third-party hosts
// (confirmed: api.frankfurter.app was rejected by the proxy during
// this session), the same "implemented against, not tested against"
// caveat that already applies to every payment gateway adapter in
// functions/_lib/payments/. Frankfurter needs no secret key, so
// there's no "not configured" failure mode to guard against here —
// only a genuine network/upstream failure, surfaced as FxProviderError
// rather than swallowed.

import { FxProviderInterface, FxProviderError } from './fx-provider-interface.js';

const API_BASE = 'https://api.frankfurter.app';

export const frankfurterAdapter = new (class extends FxProviderInterface {
  async getRates(_env, { base = 'USD', targets }) {
    const to = targets.join(',');
    let response;
    try {
      response = await fetch(`${API_BASE}/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(to)}`);
    } catch (err) {
      throw new FxProviderError(`Could not reach Frankfurter: ${err.message}`);
    }
    if (!response.ok) {
      throw new FxProviderError(`Frankfurter returned ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // data.rates is already exactly { [code]: unitsPerBase } — no
    // reshaping needed, but destructure explicitly rather than
    // returning data.rates directly so a future Frankfurter response
    // shape change fails loudly here instead of silently propagating.
    const { rates } = data;
    return rates && typeof rates === 'object' ? rates : {};
  }
})();
