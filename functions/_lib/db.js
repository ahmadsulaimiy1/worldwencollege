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

// Generates ids in the '<prefix>_<uuid>' style used throughout the
// schema (app_, usr_, pay_, enr_...) — makes ids self-describing in
// logs and support tickets without a lookup.
export function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
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
