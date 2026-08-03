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
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_admin','clerk','sub_admin','admin@example.com','admin')`);
for (let n = 1; n <= 6; n++) sqlite.exec(`INSERT INTO enrolments (id,user_id,level_id,status,started_at) VALUES ('enr_${n}','usr_demo',${n},'active','2026-01-01T00:00:00.000Z')`);
// Mirror the LIVE database, not the convenient one: enrolment_events was
// ADDED to an existing database (migration 002, 3 Aug 2026), so the
// audit record begins mid-story and the page has to say so. A harness
// built from schema.sql alone would report a complete record and the
// browser test would never see the sentence that matters.
sqlite.exec(`INSERT INTO schema_migrations (filename, applied_at, method)
  VALUES ('002-enrolment-integrity.sql','2026-08-03T12:15:21.000Z','applied')`);

// Learners in the states the study plan has to handle. usr_demo covers
// the happy path; these two cover the ones a real platform spends its
// first months in and which a single fixture would never reach.
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_prog','clerk','sub_prog','midway@example.com','student')`);
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_none','clerk','sub_none','unenrolled@example.com','student')`);
sqlite.exec(`INSERT INTO enrolments (id,user_id,level_id,status,started_at) VALUES ('enr_prog_1','usr_prog',1,'active','2026-01-01T00:00:00.000Z')`);
{
  const units = sqlite.prepare(
    `SELECT u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.level_id = 1 ORDER BY u.sequence ASC LIMIT 2`,
  ).all();
  if (units[0]) sqlite.exec(`INSERT INTO unit_progress (id,user_id,unit_id,status,completed_at) VALUES ('uprg_p1','usr_prog','${units[0].id}','completed','2026-02-01T00:00:00.000Z')`);
  if (units[1]) sqlite.exec(`INSERT INTO unit_progress (id,user_id,unit_id,status) VALUES ('uprg_p2','usr_prog','${units[1].id}','in_progress')`);
}

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
const adminEnrol = await import(pathToFileURL(`${ROOT}/functions/_lib/admin/enrolments.js`));
const adminRoles = await import(pathToFileURL(`${ROOT}/functions/_lib/admin/roles.js`));
const studyPlan = await import(pathToFileURL(`${ROOT}/functions/_lib/student/study-plan.js`));
// The harness acts as an ADMINISTRATOR so the appointment controls are
// exercised; the role check itself has its own unit tests.
const ADMIN_ACTOR = { id: 'usr_admin', role: 'admin', email: 'admin@example.com' };
const recordings = await import(pathToFileURL(`${ROOT}/functions/_lib/lms/recording-storage.js`));
const { makeR2 } = await import(pathToFileURL(`${ROOT}/tests/r2-shim.mjs`));
// The same in-memory R2 stand-in the unit tests use, so the browser
// drives the REAL upload logic end to end rather than a mock of it.
env.RECORDINGS = makeR2();

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
    // Staff enrolment administration, driven by the real module. The
    // harness acts as a fixed staff member, the same way it acts as a
    // fixed learner elsewhere -- what is under test is the page and the
    // enrolment logic, not the role check, which has its own tests.
    if (url.pathname === '/api/admin/learners' && req.method === 'GET') {
      const id = url.searchParams.get('id');
      const me = { id: ADMIN_ACTOR.id, role: ADMIN_ACTOR.role, email: ADMIN_ACTOR.email };
      if (id) return json(res, { ...(await adminEnrol.getLearner(env, { userId: id })), viewer: me });
      return json(res, { ...(await adminEnrol.searchLearners(env, { q: url.searchParams.get('q') || '' })), viewer: me });
    }
    // The study plan is served for whichever learner the test asks for,
    // because the states worth testing (no enrolment, awaiting content,
    // every unit finished) are properties of a LEARNER, not of the
    // page. One fixed user would only ever exercise the happy path,
    // which is the state nobody gets stuck in.
    if (url.pathname === '/api/student/study-plan' && req.method === 'GET') {
      const who = url.searchParams.get('as') || 'usr_demo';
      return json(res, await studyPlan.buildStudyPlan(env, who));
    }
    if (url.pathname === '/api/admin/role' && req.method === 'GET') {
      const who = url.searchParams.get('userId');
      if (who) return json(res, { userId: who, appointments: await adminRoles.appointmentHistory(env, { userId: who }) });
      return json(res, await adminRoles.listAppointees(env));
    }
    if (url.pathname === '/api/admin/role' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await adminRoles.setUserRole(env, { actor: ADMIN_ACTOR, ...body }));
    }
    if (url.pathname === '/api/admin/enrolment' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      const actor = { id: 'usr_tutor', role: 'staff', email: 'tutor@example.com' };
      return json(res, await adminEnrol.setEnrolmentStatus(env, { actor, ...body }), 201);
    }
    if (url.pathname === '/api/lms/recording' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await content.submitLearnerRecording(env, { userId: 'usr_demo', ...body }), 201);
    }
    // Resumable upload, driven by the real recording-storage.js against
    // the r2-shim bucket above. These exist so the browser test can
    // record with a fake microphone and put the whole path under test:
    // init -> parts -> complete -> authorised playback.
    if (url.pathname === '/api/lms/recording/init' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await recordings.initRecordingUpload(env, { userId: 'usr_demo', ...body }), 201);
    }
    if (url.pathname === '/api/lms/recording/init' && req.method === 'GET') {
      return json(res, await recordings.getUploadState(env, { userId: 'usr_demo', recordingId: url.searchParams.get('id') }));
    }
    if (url.pathname === '/api/lms/recording/part' && req.method === 'PUT') {
      const buf = await readBuffer(req);
      return json(res, await recordings.uploadRecordingPart(env, {
        userId: 'usr_demo',
        recordingId: url.searchParams.get('id'),
        partNumber: Number(url.searchParams.get('part')),
        body: new Uint8Array(buf),
        bytes: Number(req.headers['content-length'] ?? buf.length),
      }));
    }
    if (url.pathname === '/api/lms/recording/complete' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await recordings.completeRecordingUpload(env, { userId: 'usr_demo', ...body }), 201);
    }
    if (url.pathname === '/api/lms/recording/audio' && req.method === 'GET') {
      const obj = await recordings.getRecordingObject(env, {
        recordingId: url.searchParams.get('id'),
        requester: { id: 'usr_demo', role: 'student' },
      });
      res.writeHead(200, { 'Content-Type': obj.contentType, 'Content-Length': String(obj.body.length), 'Accept-Ranges': 'bytes' });
      return res.end(Buffer.from(obj.body));
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
// Audio parts are binary — reading them as a string would corrupt them,
// and the corruption would only show up as a wrong SHA-256 much later.
function readBuffer(req) {
  return new Promise((r) => { const cs = []; req.on('data', (c) => cs.push(c)); req.on('end', () => r(Buffer.concat(cs))); });
}
