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

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
    this.httpStatus = 500;
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
  if (status === 500) {
    // Never leak internals of an unexpected error to the client.
    console.error(err);
    return jsonResponse({ error: 'InternalError', message: 'Something went wrong.' }, { status: 500 });
  }
  return jsonResponse(body, { status });
}
