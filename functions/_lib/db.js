// Thin wrapper over the D1 binding so every endpoint queries the same
// way and gets consistent error handling. `env.DB` is the D1 binding
// name declared in wrangler.toml — not configured against a real
// database anywhere yet (Decision #1, hosting).

export function db(env) {
  if (!env.DB) {
    throw new ConfigError('D1 binding "DB" is not configured. See wrangler.toml and docs/technical-architecture.md.');
  }
  return env.DB;
}

// A deployment prerequisite is missing: a binding, an environment
// variable, an upstream the platform cannot reach.
//
// 503 rather than 500, and the message is disclosed rather than masked.
// Both were wrong before and the cost was a real outage nobody could
// diagnose: an applicant signed in, /api/admissions/draft answered 500
// "Something went wrong.", and the wizard showed "Your application
// could not be loaded — this is usually temporary". It was not
// temporary. CLERK_JWKS_URL was unset, every retry would fail forever,
// and neither the applicant nor the operator could tell that from any
// message the system produced.
//
// Masking is right for an UNEXPECTED error, whose message may carry a
// query fragment, a row value or a stack. A ConfigError's message is
// written here, by us, and by construction names only which binding or
// variable is absent. Disclosing "D1 binding \"DB\" is not configured"
// tells an attacker nothing they could not learn by observing that
// nothing works, and tells the operator everything.
export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
    this.httpStatus = 503;
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.httpStatus = 404;
  }
}

export class ValidationError extends Error {
  constructor(message, fields) {
    super(message);
    this.name = 'ValidationError';
    this.httpStatus = 422;
    this.fields = fields || {};
  }
}

// A malformed JSON body is a routine client mistake (a hand-crafted
// request, a proxy mangling the body), not a server fault — every
// endpoint that reads a JSON body should report it as a 422, not let
// request.json()'s SyntaxError bubble up to errorResponse()'s generic
// 500 path. Use in place of `await request.json()`.
export async function readJsonBody(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError('Request body must be valid JSON.', {});
  }
}

// Generates ids in the '<prefix>_<uuid>' style used throughout the
// schema (app_, usr_, pay_, enr_...) — makes ids self-describing in
// logs and support tickets without a lookup.
export function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

// Constant-time string comparison for webhook/session signature checks
// (functions/_lib/auth/clerk-adapter.js, functions/_lib/payments/*.js)
// — plain `===` on a computed-vs-received signature leaks timing
// information proportional to how many leading characters match,
// letting an attacker recover a valid signature byte-by-byte given
// enough requests. There's no Web Crypto primitive for this (Workers
// don't have Node's crypto.timingSafeEqual), so it's implemented here
// the same way that function does internally: XOR every byte pair and
// accumulate, never branching (short-circuiting) on an early mismatch.
export function timingSafeEqual(a, b) {
  const bufA = new TextEncoder().encode(String(a ?? ''));
  const bufB = new TextEncoder().encode(String(b ?? ''));
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) diff |= bufA[i] ^ bufB[i];
  return diff === 0;
}

export function nowIso() {
  return new Date().toISOString().replace(/\.\d+Z$/, (m) => m.slice(0, 4) + 'Z');
}

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
}

export function errorResponse(err) {
  const status = err.httpStatus || 500;
  const body = { error: err.name || 'InternalError', message: err.message };
  if (err.fields) body.fields = err.fields;
  // A configuration fault is logged like an unexpected one — an
  // operator should see it in the tail — but it is REPORTED, because a
  // caller that cannot distinguish "misconfigured, retrying will never
  // help" from "transient, try again" will tell the user to try again
  // forever. See ConfigError above.
  if (err.name === 'ConfigError') console.error(err);
  if (status === 500) {
    // Never leak internals of an unexpected error to the client.
    console.error(err);
    return jsonResponse({ error: 'InternalError', message: 'Something went wrong.' }, { status: 500 });
  }
  return jsonResponse(body, { status });
}
