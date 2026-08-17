// FX rate-feed boundary — Executive Decision #2: "a configurable
// exchange-rate service so currencies can be enabled, disabled, or
// updated without changing application code." This is that service's
// swappable provider contract, the same pattern as
// functions/_lib/payments/provider-interface.js and
// functions/_lib/auth/provider-interface.js: one method every real
// adapter implements, nothing outside functions/_lib/currency/ ever
// imports an adapter directly.
//
// getRates(env, { base, targets }) => Promise<{ [code]: number }>
//   Returns, for each requested target currency code, the number of
//   units of that currency equal to 1 unit of `base` — i.e. exactly
//   what sql/schema.sql's `currencies.fx_rate_to_usd` stores when
//   base='USD' (see functions/_lib/currency.js's
//   convertFromUsdCents: `amountUsdCents * fx_rate_to_usd`). A target
//   the provider has no rate for is simply omitted from the returned
//   object, not set to a guessed value.

export class FxProviderInterface {
  async getRates(_env, { _base, _targets }) { throw new Error('Not implemented'); }
}

export class FxProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FxProviderError';
    this.httpStatus = 502; // upstream (the rate feed), not this platform
  }
}
