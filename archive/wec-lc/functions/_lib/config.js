// Reads business-policy values from `platform_config` (see
// sql/schema.sql § Platform configuration) — the mechanism Executive
// Decision #5 requires: policy lives in data, not in application code,
// so changing a price or a stacking rule is a config update, never a
// deploy.

import { db, ConfigError } from './db.js';

// Returns the raw JSON string, or `null` if the key doesn't exist —
// callers decide whether a missing key is fatal (a required pricing
// value) or has a sensible in-code fallback (an optional policy knob).
export async function getConfigRaw(env, key) {
  const row = await db(env).prepare('SELECT value FROM platform_config WHERE key = ?').bind(key).first();
  return row ? row.value : null;
}

// Parses the stored JSON value. Throws ConfigError (not a 4xx) on a
// missing required key — a missing pricing/policy row is an
// operational misconfiguration, not something a client caused.
export async function getConfigJson(env, key, { required = true } = {}) {
  const raw = await getConfigRaw(env, key);
  if (raw == null) {
    if (required) throw new ConfigError(`Missing platform_config value for "${key}".`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new ConfigError(`platform_config value for "${key}" is not valid JSON.`);
  }
}

export async function setConfigJson(env, key, value, { updatedBy = null } = {}) {
  const raw = JSON.stringify(value);
  await db(env)
    .prepare(`INSERT INTO platform_config (key, value, updated_by, updated_at)
      VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`)
    .bind(key, raw, updatedBy)
    .run();
}
