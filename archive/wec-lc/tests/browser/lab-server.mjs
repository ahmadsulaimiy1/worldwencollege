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
const timeOnTask = await import(pathToFileURL(`${ROOT}/functions/_lib/lms/time-on-task.js`));
const registry = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/awards.js`));
const profile = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/profile.js`));
const qr = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/qr.js`));
const instVerify = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/institutional-verification.js`));
const distinctions = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/distinctions.js`));
const documents = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/documents.js`));
// Beats reaching the harness, so a browser test can assert the beacon
// actually fires rather than that the file merely loads.
const beats = [];
// The harness acts as an ADMINISTRATOR so the appointment controls are
// exercised; the role check itself has its own unit tests.
const ADMIN_ACTOR = { id: 'usr_admin', role: 'admin', email: 'admin@example.com' };

// DEMONSTRATION awards, conferred here and nowhere else. No award may be
// conferred in production until the Executive adopts the award
// architecture (governance C4), so the live Register ships EMPTY and
// this harness is the only place a record exists. The names are
// invented — the same rule as sql/seed-demo-people.sql, stated at length
// there.
const DEMO = {};
{
  const conf = (opts) => registry.conferAward(env, {
    credits: 20, tqtHours: 200, ...opts,
  });
  DEMO.valid = await conf({
    userId: 'usr_demo', levelId: 3, holderName: 'Demonstration Graduate',
    awardTitle: 'English Associate of Worldwide English College', postNominal: 'AsWEC',
    cefr: 'B1', honour: 'distinction', publicConsent: true,
    citation: 'In recognition of a structured presentation delivered and defended under questioning.',
  });
  DEMO.revokedSrc = await conf({
    userId: 'usr_prog', levelId: 2, holderName: 'Withdrawn Demonstration',
    awardTitle: 'English Candidate of Worldwide English College', postNominal: 'CnWEC', cefr: 'A2',
  });
  await registry.revokeAward(env, { awardId: DEMO.revokedSrc.id, reason: 'Conferred in error during a demonstration.' });
  DEMO.replacedSrc = await conf({
    userId: 'usr_none', levelId: 1, holderName: 'Corrected Demonstratoin',
    awardTitle: 'English Aspirant of Worldwide English College', postNominal: 'ApWEC', cefr: 'A1',
  });
  DEMO.replacement = (await registry.replaceAward(env, {
    awardId: DEMO.replacedSrc.id, reason: 'Holder name corrected.',
    changes: { holderName: 'Corrected Demonstration' },
  })).replacement;

  // Entries for the browsable roll. Deliberately spread across levels —
  // the register's central claim is that it holds award holders at every
  // level and not only Laureates, and a fixture with one level in it
  // could not tell a working page from a broken one.
  //
  // `usr_demo` already holds a Level III award above, so these use the
  // other demonstration learners: one live conferral per person per
  // level is enforced by a partial unique index, not by convention.
  DEMO.listed = [];
  const ROLL = [
    ['usr_none', 6, 'English Laureate of Worldwide English College', 'LrWEC', 'C2', 'Laureate Demonstration', 'college_distinction'],
    ['usr_prog', 4, 'English Fellow of Worldwide English College', 'FlWEC', 'B2', 'Fellow Demonstration', 'merit'],
    ['usr_tutor', 1, 'English Aspirant of Worldwide English College', 'ApWEC', 'A1', 'Aspirant Demonstration', 'pass'],
  ];
  for (let i = 0; i < ROLL.length; i++) {
    const [userId, levelId, awardTitle, postNominal, cefr, holderName, honour] = ROLL[i];
    DEMO.listed.push(await conf({
      userId, levelId, awardTitle, postNominal, cefr, holderName, honour, publicConsent: true,
    }));
  }
  // Not listed, and must stay unlisted. Without one of these the consent
  // assertion on the page would be checking that a filter does not
  // remove rows nothing was asking it to remove.
  // A published profile and a shared link, so the graduate record page
  // can be driven the way a real reader reaches it.
  await profile.updateProfile(env, { userId: 'usr_demo', changes: {
    handle: 'demonstration-graduate', displayName: 'Demonstration Graduate',
    headline: 'Demonstration record — not a real graduate',
    biography: 'This profile is demonstration data used to develop and test the graduate record. It does not describe a real person.',
    isPublic: true, transcript: true,
  } });
  env.DB.prepare(`INSERT INTO cpd_records (id,user_id,title,provider,kind,hours,completed_on,verified_at)
    VALUES ('cpd_v','usr_demo','A verified workshop','Demonstration Provider','workshop',6,'2027-07-01','2027-07-05T00:00:00.000Z')`).bind().run();
  env.DB.prepare(`INSERT INTO cpd_records (id,user_id,title,provider,kind,hours,completed_on)
    VALUES ('cpd_d','usr_demo','A self-declared conference','Demonstration Provider','conference',3,'2027-08-01')`).bind().run();
  // The two sections added with the Digital Academic Identity, so the
  // page renders them against real module output rather than the
  // browser suite proving only that hidden sections stay hidden.
  //
  // Skills are deliberately left UNMAPPED — no assessment_skills rows —
  // because that is the state the platform is actually in, and it is
  // the state the page most needs to get right.
  await profile.updateProfile(env, { userId: 'usr_demo', changes: {
    skills: true, distinctions: true,
  } });
  const approved = await distinctions.propose(env, {
    userId: 'usr_demo', kind: 'presentation',
    title: 'Presented at the demonstration colloquium',
    summary: 'Demonstration data. Not a record of a real presentation by a real person.',
    awardedOn: '2027-06-14', awardedBy: 'Worldwide English College',
  });
  await distinctions.approve(env, { id: approved.id, approvedBy: 'usr_admin' });
  // One withdrawn and one still proposed: the page must show the first
  // marked, and must not show the second at all.
  const gone = await distinctions.propose(env, {
    userId: 'usr_demo', kind: 'prize', title: 'A demonstration prize', awardedOn: '2027-05-01',
  });
  await distinctions.approve(env, { id: gone.id, approvedBy: 'usr_admin' });
  await distinctions.withdraw(env, { id: gone.id, reason: 'Demonstration withdrawal, to exercise the withdrawn state.' });
  await distinctions.propose(env, {
    userId: 'usr_demo', kind: 'leadership', title: 'An unapproved demonstration claim', awardedOn: '2027-04-01',
  });

  DEMO.share = await profile.createShare(env, {
    userId: 'usr_demo', sections: ['awards', 'transcript', 'cpd'], days: 30, label: 'Demonstration share',
  });

  DEMO.unlisted = await conf({
    userId: 'usr_prog', levelId: 5, holderName: 'Unlisted Demonstration',
    awardTitle: 'English Scholar of Worldwide English College', postNominal: 'ScWEC', cefr: 'C1',
  });
}
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
    // /api/verify/* is PUBLIC by design and stays public even in the
    // auth-required harness. A verification endpoint behind a login is
    // one nobody uses, and testing it as authenticated would test a
    // product we deliberately did not build.
    // /api/register is public for the same reason: a roll of award
    // holders published behind a login is not published.
    // /api/credentials/qr is public for the third time over: it renders
    // the same public verification URL that is printed in plain text
    // beside it, it looks nothing up, and a QR an employer must sign in
    // to fetch is a QR nobody scans.
    if (REQUIRE_AUTH && url.pathname.startsWith('/api/')
        && !url.pathname.startsWith('/api/verify/') && url.pathname !== '/api/register'
        && url.pathname !== '/api/credentials/qr'
        && !url.pathname.startsWith('/api/graduate/') && !url.pathname.startsWith('/api/share/')) {
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
    // Public verification — no auth, deliberately, even under
    // LAB_REQUIRE_AUTH. See the exemption above the auth gate.
    // Tested BEFORE the generic /api/verify/ route below, which would
    // otherwise read "institutional/CODE" as the code itself and
    // report every lookup malformed.
    // The Employer and University Verification Portal — three layers.
    if (url.pathname.startsWith('/api/verify/institutional/') && req.method === 'GET') {
      const code = decodeURIComponent(url.pathname.slice('/api/verify/institutional/'.length));
      return json(res, await instVerify.institutionalVerification(env, {
        code, channel: url.searchParams.get('via') === 'qr' ? 'qr' : 'public',
      }));
    }
    if (url.pathname.startsWith('/api/verify/') && req.method === 'GET') {
      const code = decodeURIComponent(url.pathname.slice('/api/verify/'.length));
      const via = url.searchParams.get('via');
      return json(res, await registry.verifyCode(env, { code, channel: via === 'qr' ? 'qr' : 'public' }));
    }
    // The QR for a verification code. Public and unauthenticated, like
    // the rest of verification: a QR nobody can fetch is a QR nobody
    // scans.
    if (url.pathname === '/api/credentials/qr' && req.method === 'GET') {
      const parsed = registry.parseCode(url.searchParams.get('code') || '');
      if (!parsed.ok) { res.writeHead(400, { 'Content-Type': 'text/plain' }); return res.end('malformed'); }
      const target = `http://localhost:${process.env.LAB_PORT || 8787}/verify.html?code=${encodeURIComponent(parsed.code)}`;
      res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
      return res.end(qr.toSvg(target, { level: 'Q', label: `Verify award ${parsed.code}` }));
    }
    if (url.pathname.startsWith('/api/graduate/') && req.method === 'GET') {
      const handle = decodeURIComponent(url.pathname.slice('/api/graduate/'.length));
      try { return json(res, await profile.publicProfile(env, { handle })); }
      catch { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"NotFound"}'); }
    }
    if (url.pathname.startsWith('/api/share/') && req.method === 'GET') {
      const token = decodeURIComponent(url.pathname.slice('/api/share/'.length));
      return json(res, await profile.viewShare(env, { token }));
    }
    // The learner's own record. The harness identifies usr_demo, the
    // same fixture the study plan uses, so My Record is driven by the
    // same data a learner would actually have.
    if (url.pathname === '/api/student/profile' && req.method === 'GET') {
      return json(res, await profile.fullProfile(env, { userId: 'usr_demo' }));
    }
    if (url.pathname === '/api/student/profile' && req.method === 'PATCH') {
      const body = JSON.parse(await read(req));
      try {
        await profile.updateProfile(env, { userId: 'usr_demo', changes: body });
        return json(res, await profile.fullProfile(env, { userId: 'usr_demo' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.name, message: e.message }));
      }
    }
    if (url.pathname === '/api/student/profile-shares' && req.method === 'GET') {
      return json(res, { shares: await profile.listShares(env, { userId: 'usr_demo' }) });
    }
    if (url.pathname === '/api/student/profile-shares' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      try {
        return json(res, await profile.createShare(env, { userId: 'usr_demo', ...body }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.name, message: e.message }));
      }
    }
    if (url.pathname === '/api/student/profile-shares' && req.method === 'DELETE') {
      return json(res, await profile.revokeShare(env, {
        userId: 'usr_demo', shareId: url.searchParams.get('id'),
      }));
    }
    if (url.pathname === '/api/student/documents' && req.method === 'GET') {
      return json(res, await documents.myDocuments(env, { userId: 'usr_demo' }));
    }
    if (url.pathname === '/api/student/documents' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      try {
        return json(res, await documents.issueDocument(env, {
          documentType: body.documentType || 'transcript', userId: 'usr_demo', issuedBy: 'usr_demo',
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.name, message: e.message }));
      }
    }
    if (url.pathname === '/api/register' && req.method === 'GET') {
      const raw = url.searchParams.get('level');
      return json(res, await registry.publicRegister(env, {
        levelId: /^[1-6]$/.test(raw || '') ? Number(raw) : null,
        q: url.searchParams.get('q'),
        limit: url.searchParams.get('limit'),
      }));
    }
    if (url.pathname === '/api/lms/time-on-task' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      beats.push(body);
      return json(res, await timeOnTask.recordBeat(env, { userId: 'usr_demo', unitId: body.unitId }));
    }
    if (url.pathname === '/__beats' && req.method === 'GET') return json(res, { beats });
    if (url.pathname === '/__demo-awards' && req.method === 'GET') {
      return json(res, {
        valid: DEMO.valid.verification_code,
        revoked: DEMO.revokedSrc.verification_code,
        replaced: DEMO.replacedSrc.verification_code,
        replacement: DEMO.replacement.verification_code,
        shareToken: DEMO.share.token,
      });
    }
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
