// The only file functions/api/payments/*.js should import from. It
// knows all four gateways exist; nothing else does. Adding a fifth
// gateway later means: write an adapter implementing
// provider-interface.js, add one line to GATEWAYS below, and add its
// name to a country's preferred_gateways in the database — no changes
// anywhere else in the platform.

import { stripeAdapter } from './stripe-adapter.js';
import { paystackAdapter } from './paystack-adapter.js';
import { flutterwaveAdapter } from './flutterwave-adapter.js';
import { opayAdapter } from './opay-adapter.js';
import { suggestRouting } from '../currency.js';

export const GATEWAYS = {
  stripe: stripeAdapter,
  paystack: paystackAdapter,
  flutterwave: flutterwaveAdapter,
  opay: opayAdapter,
};

export function getGateway(name) {
  const gateway = GATEWAYS[name];
  if (!gateway) throw new Error(`Unknown payment gateway "${name}".`);
  return gateway;
}

// Returns the student's default gateway suggestion (never a forced
// choice — see docs/payments-architecture.md § UX) plus the full list
// of gateways currently configured (has required env vars set) so the
// checkout UI can offer real alternatives, not dead buttons.
export async function suggestGateway(env, countryCode) {
  const { currency, gateways } = await suggestRouting(env, countryCode);
  const configured = gateways.filter((name) => isConfigured(env, name));
  return {
    currency,
    suggested: configured[0] || 'stripe',
    available: configured.length ? configured : ['stripe'],
  };
}

function isConfigured(env, name) {
  switch (name) {
    case 'stripe': return Boolean(env.STRIPE_SECRET_KEY);
    case 'paystack': return Boolean(env.PAYSTACK_SECRET_KEY);
    case 'flutterwave': return Boolean(env.FLW_SECRET_KEY);
    case 'opay': return Boolean(env.OPAY_MERCHANT_ID && env.OPAY_SECRET_KEY);
    default: return false;
  }
}

export async function createCheckout(gatewayName, params, env) {
  return getGateway(gatewayName).createCheckout(params, env);
}
