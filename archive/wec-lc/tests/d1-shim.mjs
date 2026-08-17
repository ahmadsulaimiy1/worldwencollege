// Minimal shim giving node:sqlite the same .prepare().bind().first()/.all()/.run()
// shape as Cloudflare D1, so real endpoint code can be exercised against
// a real SQLite engine without touching Cloudflare at all.
import { DatabaseSync } from 'node:sqlite';

export function makeD1(schemaSql) {
  const raw = new DatabaseSync(':memory:');
  raw.exec(schemaSql);
  return {
    prepare(sql) {
      const stmt = raw.prepare(sql);
      let boundArgs = [];
      const wrapper = {
        bind(...args) { boundArgs = args; return wrapper; },
        first() { const row = stmt.get(...boundArgs); return row === undefined ? null : row; },
        all() { return { results: stmt.all(...boundArgs) }; },
        run() { const info = stmt.run(...boundArgs); return { success: true, meta: { changes: info.changes } }; },
      };
      return wrapper;
    },
  };
}
