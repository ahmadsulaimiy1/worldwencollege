// Local harness for the Listening Lab browser test: serves the real
// static files and runs the REAL functions/_lib/lms/content.js against
// the REAL seeded curriculum. Not production code — production serves
// these endpoints through functions/api/lms/*.js on Cloudflare Pages.
// The point is that the page under test is driven by production logic
// and production data, not by fixtures.
// Minimal static + API server that runs the REAL content.js against the
// REAL seeded curriculum, so the page under test is driven by production
// logic and production data — not fixtures.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON;');
sqlite.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
for (let n = 1; n <= 6; n++) sqlite.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
for (let n = 1; n <= 6; n++) { const p = `${ROOT}/sql/seed-audio-level-${n}.sql`; if (existsSync(p)) sqlite.exec(readFileSync(p, 'utf8')); }
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_demo','clerk','sub_demo','demo@example.com','student')`);
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_tutor','clerk','sub_tutor','tutor@example.com','staff')`);
for (let n = 1; n <= 6; n++) sqlite.exec(`INSERT INTO enrolments (id,user_id,level_id,status,started_at) VALUES ('enr_${n}','usr_demo',${n},'active','2026-01-01T00:00:00.000Z')`);

const { makeD1 } = await import(pathToFileURL(`${ROOT}/tests/d1-shim.mjs`));
const env = { DB: makeD1FromExisting() };
function makeD1FromExisting() {
  // reuse the shim's wrapper over our already-seeded database
  const shim = makeD1('');           // empty schema; we swap the handle
  return new Proxy(shim, { get(t, k) { return k === '__db' ? sqlite : wrap(k); } });
}
function wrap(k) {
  return (...args) => {
    if (k !== 'prepare') throw new Error('unsupported: ' + k);
    const stmt = sqlite.prepare(args[0]);
    let bound = [];
    const api = {
      bind: (...b) => { bound = b; return api; },
      first: async () => stmt.get(...bound) ?? null,
      all: async () => ({ results: stmt.all(...bound) }),
      run: async () => { const r = stmt.run(...bound); return { meta: { changes: r.changes } }; },
    };
    return api;
  };
}

const content = await import(pathToFileURL(`${ROOT}/functions/_lib/lms/content.js`));

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };

// Auth mode. Off by default, so the existing suite keeps exercising the
// no-Clerk-key preview state the site actually ships in today.
//
// With LAB_REQUIRE_AUTH=1 the harness does what every real endpoint
// does — reads `Authorization: Bearer <token>` and 401s without it.
// It exists because the harness's *convenience* (a hard-coded
// userId, no auth) was hiding a defect: the Lab and the instructor
// workspace sent no Authorization header at all, so they would have
// 401'd on every call against a real deployment while passing every
// test here. A harness that is easier than production tests something
// production isn't.
//
// The token itself is a stub, not a JWT. What is under test is the
// header contract between page and endpoint; verifying a real Clerk
// signature needs a real Clerk instance and is disclosed as untested
// in tests/README.md.
const REQUIRE_AUTH = process.env.LAB_REQUIRE_AUTH === '1';
const STUB_TOKENS = { 'stub-demo': 'usr_demo', 'stub-tutor': 'usr_tutor' };

function identify(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  // Tokens are minted fresh per request by js/api-auth.js, so the stub
  // ones carry a counter suffix (stub-demo#3). The identity is the part
  // before it.
  const id = token ? STUB_TOKENS[token.split('#')[0]] : null;
  return { token, userId: id };
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (REQUIRE_AUTH && url.pathname.startsWith('/api/')) {
      const { userId } = identify(req);
      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'AuthError', message: 'Sign in to continue.' }));
      }
    }
    if (url.pathname === '/api/lms/unit') {
      const u = await content.getUnitDetail(env, { userId: 'usr_demo', unitId: url.searchParams.get('id') });
      return json(res, u);
    }
    if (url.pathname === '/api/lms/pronunciation-profile') {
      const lv = url.searchParams.get('levelId');
      return json(res, await content.getPronunciationProfile(env, { userId: 'usr_demo', levelId: lv ? Number(lv) : null }));
    }
    if (url.pathname === '/api/lms/recording' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await content.submitLearnerRecording(env, { userId: 'usr_demo', ...body }), 201);
    }
    if (url.pathname === '/api/lms/listening-analytics') {
      return json(res, await content.getListeningAnalytics(env, { userId: 'usr_demo', levelId: Number(url.searchParams.get('levelId')) }));
    }
    if (url.pathname === '/api/lms/review-queue') {
      const lv = url.searchParams.get('levelId');
      return json(res, await content.listRecordingsForReview(env, { levelId: lv ? Number(lv) : null }));
    }
    if (url.pathname === '/api/lms/recording-review' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await content.reviewRecording(env, { reviewerId: 'usr_tutor', source: 'instructor', ...body }));
    }
    if (url.pathname === '/api/lms/quiz-attempt' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await content.submitQuizAttempt(env, { userId: 'usr_demo', ...body }));
    }
    // Static resolution mirroring Cloudflare Pages: a bare path tries
    // the file, then <path>/index.html, then <path>.html. Without the
    // directory-index step every built route like /about/ 404s here
    // while working correctly in production — which is exactly the kind
    // of harness/production divergence that produces false failures.
    const candidates = [];
    const p = url.pathname;
    if (p === '/') candidates.push('/index.html');
    else {
      candidates.push(p);
      if (p.endsWith('/')) candidates.push(p + 'index.html');
      else candidates.push(p + '/index.html', p + '.html');
    }
    for (const c of candidates) {
      const file = join(ROOT, c);
      if (existsSync(file) && statSync(file).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
        return res.end(readFileSync(file));
      }
    }
    // Pages serves 404.html with a 404 status for unknown routes.
    const nf = join(ROOT, '404.html');
    if (existsSync(nf)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end(readFileSync(nf));
    }
    res.writeHead(404); res.end('not found');
  } catch (e) {
    res.writeHead(e.name === 'AuthorizationError' ? 403 : 400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.name, message: e.message }));
  }
}).listen(Number(process.env.LAB_PORT || 8787), () => console.log('lab server ready'));

function json(res, obj, code = 200) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function read(req) { return new Promise((r) => { let d = ''; req.on('data', (c) => d += c); req.on('end', () => r(d)); }); }
