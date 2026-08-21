// THE APPLICANT LIFECYCLE — asserted at the routes, with real signed
// tokens and a real database.
//
// ─────────────────────────────────────────────────────────────────────
// THE ASSERTION THIS FILE EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
//
//   An application submitted today can be moved, by the people entitled
//   to move it, all the way to enrolled — and by nobody else, through no
//   other route, and never into a state whose evidence does not exist.
//
// Before functions/_lib/admissions/lifecycle.js, `grep -rn "UPDATE
// applications" functions/` returned one hit and it was a comment. Six
// of the seven values of `applications.status` were unreachable by any
// request the platform could receive, while pages/admissions.html
// published all of them in a table and told every applicant a person
// would be in touch. The suite could not see it: admissions-and-currency
// .test.mjs asserts that a fresh application reads `submitted`, which is
// exactly as true of a working lifecycle as of a broken one.
//
// So the happy path here is driven end to end through the real handlers,
// with a real staff session, and the refusals are asserted in BOTH
// directions — the party entitled to a move makes it, and the party one
// step away is refused. A one-directional test passes against a machine
// that refuses everybody.
//
// AND EVERY CLAIM ABOUT AN EMAIL IS ASSERTED AGAINST THE GATEWAY, not
// against the code's intention. The reason apply.js grew a
// `confirmationSent` flag is that three published sentences told
// applicants they were emailed a confirmation while the gateway threw on
// every request. Below, the same send is asserted false with no gateway,
// false with a gateway that refuses, and TRUE with one that accepts —
// because a flag that is always false is not honesty, it is a constant.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

// ---------------------------------------------------------------------
// Real RS256 tokens, the shape tests/admin-route-guards.test.mjs uses —
// the guard is the thing being tested, so it is exercised rather than
// stubbed out.
// ---------------------------------------------------------------------
const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };

async function token(sub) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const now = Math.floor(Date.now() / 1000);
  const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: now - 5, exp: now + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const TOKENS = {
  student: await token('user_student'),
  staff: await token('user_staff'),
  admin: await token('user_admin'),
};

// The mail gateway, driven rather than assumed. `unconfigured` is the
// state the College is actually in.
let MAIL = 'unconfigured';
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes('jwks')) return { ok: true, status: 200, json: async () => ({ keys: [jwk] }) };
  if (u.includes('api.resend.com')) {
    if (MAIL === 'accepts') return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'msg_stub' }) };
    return { ok: false, status: 400, text: async () => JSON.stringify({ message: 'stubbed refusal' }) };
  }
  throw new Error(`unexpected fetch to ${u}`);
};

// ---------------------------------------------------------------------
const schema = readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');

const L = await import(loadUrl('functions/_lib/admissions/lifecycle.js'));
const apply = await import(loadUrl('functions/api/admissions/apply.js'));
const track = await import(loadUrl('functions/api/admissions/track.js'));
const offerRoute = await import(loadUrl('functions/api/admissions/offer.js'));
const queueRoute = await import(loadUrl('functions/api/staff/applications.js'));

const DAY = 86400000;
const T0 = Date.parse('2026-09-01T09:00:00.000Z');

function freshEnv(extra = {}) {
  const env = {
    CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json',
    DB: makeD1(schema),
    ...extra,
  };
  for (const role of ['student', 'staff', 'admin']) {
    env.DB.prepare(
      `INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role)
       VALUES ('usr_${role}', 'clerk', 'user_${role}', '${role}@example.com', 1, '${role}')`,
    ).bind().run();
  }
  return env;
}
const staffRow = (env) => env.DB.prepare("SELECT * FROM users WHERE id = 'usr_staff'").bind().first();

function req(method, url, { body, token: tk, ip } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (tk) headers.Authorization = `Bearer ${tk}`;
  if (ip) headers['CF-Connecting-IP'] = ip;
  return new Request(url, { method, headers, body: method === 'GET' ? undefined : JSON.stringify(body || {}) });
}

/** An application created through the real public endpoint. */
async function applyFor(env, { name = 'A Prospective Learner', email = 'learner@example.com', country = 'NG' } = {}) {
  const res = await apply.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/apply', {
      body: { fullName: name, email, country, selfAssessedLevelId: 1, privacyAgreed: true },
    }),
    env,
  });
  const body = await res.json();
  if (res.status !== 201) throw new Error(`apply failed: ${JSON.stringify(body)}`);
  return body.applicationId;
}
const appRow = (env, id) => env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first();

// =====================================================================
// A · THE MACHINE IS THE PUBLISHED ONE
// =====================================================================
{
  const stateColumn = ['submitted', 'placement_pending', 'offer_sent', 'accepted', 'enrolled'];
  const journeyStates = L.PUBLISHED_JOURNEY.flatMap((s) => s.states);
  check('The five published stages carry the five published states, in order',
    JSON.stringify(journeyStates) === JSON.stringify(stateColumn), journeyStates.join(' → '));
  check('...and the two published endings exist as statuses',
    L.APPLICATION_STATUSES.includes('withdrawn') && L.APPLICATION_STATUSES.includes('rejected'));
  check('The machine knows exactly the seven statuses the schema allows',
    L.APPLICATION_STATUSES.length === 7);

  // The shortcut an operationally impatient release would add. The
  // published table puts placement between them and says who does it.
  check('submitted → offer_sent is not a legal move',
    !L.TRANSITIONS.some((t) => t.from === 'submitted' && t.to === 'offer_sent'));
  check('...and offer_sent is reachable only by issuing an offer',
    L.TRANSITIONS.filter((t) => t.to === 'offer_sent').every((t) => t.channels.length === 1 && t.channels[0] === 'offer'));
  check('enrolled is terminal', L.legalTransitionsFrom('enrolled').length === 0);
  check('withdrawn and rejected are terminal',
    L.legalTransitionsFrom('withdrawn').length === 0 && L.legalTransitionsFrom('rejected').length === 0);
  // The published timing commitment, kept: an expired offer must not
  // close the application.
  check('An offer that lapses returns the application to placement, never to a closed state',
    L.TRANSITIONS.some((t) => t.from === 'offer_sent' && t.to === 'placement_pending' && t.channels.includes('expiry_sweep')));
  check('Every transition names who may make it and how it arrives',
    L.TRANSITIONS.every((t) => t.by.length && t.channels.length && t.means));

  // The credential, asserted structurally as well as behaviourally: a
  // `===` here would pass every behavioural test in this file.
  const src = readFileSync(path.join(ROOT, 'functions/_lib/admissions/lifecycle.js'), 'utf8');
  check('The reference is compared with timingSafeEqual, not with ===',
    /timingSafeEqual\(row \? row\.id : decoyFor\(ref\), ref\)/.test(src));
}

// =====================================================================
// B · THE HAPPY PATH, END TO END, THROUGH THE REAL ROUTES
// =====================================================================
{
  const env = freshEnv({ RESEND_API_KEY: 'stub', RESEND_FROM_ADDRESS: 'admissions@example.com' });
  MAIL = 'refuses';
  L.resetReferenceLookups();
  const id = await applyFor(env);
  check('An application starts at submitted', appRow(env, id).status === 'submitted');

  // ── the queue
  const q1 = await queueRoute.onRequestGet({ request: req('GET', 'https://wec-lc.test/api/staff/applications', { token: TOKENS.staff }), env });
  const queue = await q1.json();
  check('Staff can see the admissions queue', q1.status === 200 && queue.total === 1, `status ${q1.status}`);
  check('...with the application on it', queue.applications[0].id === id);
  check('...saying how long it has waited', typeof queue.applications[0].daysWaiting === 'number');
  check('...and what may legally happen to it next',
    queue.applications[0].legalNext.some((n) => n.to === 'placement_pending'));
  check('...with the whole machine beside it, so a console cannot invent its own',
    queue.machine.statuses.length === 7 && queue.machine.journey.length === 5);

  // ── placement
  const p = await queueRoute.onRequestPatch({
    request: req('PATCH', 'https://wec-lc.test/api/staff/applications', {
      token: TOKENS.staff,
      body: { applicationId: id, to: 'placement_pending', placementLevelId: 2, reason: 'Placement conversation arranged for 8 September.' },
    }),
    env,
  });
  const pBody = await p.json();
  check('Staff move the application to placement', p.status === 200 && pBody.status === 'placement_pending', JSON.stringify(pBody).slice(0, 120));
  check('...recording the confirmed entry level', pBody.placementLevelId === 2);
  check('...and reporting that no placement email went out, rather than claiming one did',
    pBody.notifications[0].sent === false && pBody.notifications[0].reason === 'no_template_in_catalog',
    JSON.stringify(pBody.notifications));

  // ── the offer
  const expiresAt = new Date(Date.now() + 30 * DAY).toISOString();
  const o = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer', {
      token: TOKENS.staff,
      body: { applicationId: id, levelId: 2, kind: 'conditional', conditions: 'Provide proof of identity before the first module opens.', expiresAt },
    }),
    env,
  });
  const oBody = await o.json();
  check('Staff issue a conditional offer', o.status === 201 && oBody.status === 'offer_sent', `status ${o.status} ${JSON.stringify(oBody).slice(0, 120)}`);
  check('...which writes a real offer row, not just a status',
    env.DB.prepare("SELECT COUNT(*) AS n FROM offers WHERE application_id = ? AND status = 'issued'").bind(id).first().n === 1);
  check('...carrying its conditions and its expiry', oBody.offer.kind === 'conditional' && oBody.offer.expiresAt === expiresAt);
  check('...issued by a named officer, never the platform',
    env.DB.prepare('SELECT issued_by FROM offers WHERE application_id = ?').bind(id).first().issued_by === 'usr_staff');

  // ── the applicant looks it up
  const t = await track.onRequestGet({ request: req('GET', `https://wec-lc.test/api/admissions/track?ref=${id}`, { ip: '203.0.113.1' }), env });
  const tBody = await t.json();
  check('The applicant can track it with no account at all', t.status === 200 && tBody.status === 'offer_sent');
  check('...and is told which of the five published stages they are at',
    tBody.stage.number === 4 && tBody.stage.of === 5, JSON.stringify(tBody.stage));
  check('...with the whole route marked done / current / ahead',
    tBody.journey.filter((s) => s.state === 'done').length === 3 && tBody.journey[3].state === 'current');
  check('...their offer, and whether it can still be accepted',
    tBody.offer.acceptable === true && tBody.offer.conditions.startsWith('Provide proof'));
  check('...what is outstanding and that it is theirs',
    tBody.outstanding.length === 1 && tBody.outstanding[0].who === 'you');
  check('...what happens next', /Accept or decline/i.test(tBody.next.what));
  check('...and the audited timeline of every move',
    tBody.timeline.length === 3 && tBody.timeline[0].to === 'submitted' && tBody.timeline[2].to === 'offer_sent',
    tBody.timeline.map((e) => e.to).join(','));
  check('The timeline says who acted without naming any officer',
    tBody.timeline[2].by === 'the College' && !JSON.stringify(tBody).includes('usr_staff'));
  // A reference in a shared browser must buy a status, not an identity.
  check('No name and no email address leaves the tracking endpoint',
    !JSON.stringify(tBody).includes('learner@example.com') && !JSON.stringify(tBody).includes('A Prospective Learner'));

  // ── the applicant accepts, holding only their reference
  const a = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer?action=accept', { body: { reference: id }, ip: '203.0.113.1' }),
    env,
  });
  const aBody = await a.json();
  check('The applicant accepts against their reference, with no session', a.status === 200 && aBody.status === 'accepted', JSON.stringify(aBody).slice(0, 140));
  check('...which settles the offer as accepted', aBody.offer.status === 'accepted' && !!aBody.offer.acceptedAt);
  check('...and says what is still outstanding rather than implying they are enrolled',
    aBody.outstanding.some((x) => /payment/i.test(x.what)));
  check('An applicant\'s decision is filed to the applicant, never to "the platform"',
    L.readReason(env.DB.prepare("SELECT reason FROM application_events WHERE application_id = ? AND to_status = 'accepted'").bind(id).first().reason).party === 'applicant');

  // ── enrolled requires the enrolment to exist
  const early = await queueRoute.onRequestPatch({
    request: req('PATCH', 'https://wec-lc.test/api/staff/applications', { token: TOKENS.staff, body: { applicationId: id, to: 'enrolled' } }),
    env,
  });
  const earlyBody = await early.json();
  check('"enrolled" is refused while no enrolment exists', early.status === 422, `status ${early.status}`);
  check('...naming what is missing rather than only refusing',
    /no account|active enrolment/i.test(earlyBody.message), earlyBody.message);

  // The account and the paid-for enrolment the payment path creates.
  env.DB.prepare("UPDATE applications SET user_id = 'usr_student' WHERE id = ?").bind(id).run();
  env.DB.prepare(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
    VALUES ('enr_paid', 'usr_student', NULL, 2, 'active', '2026-09-10T00:00:00.000Z')`).bind().run();

  MAIL = 'accepts';
  const e = await queueRoute.onRequestPatch({
    request: req('PATCH', 'https://wec-lc.test/api/staff/applications', {
      token: TOKENS.staff, body: { applicationId: id, to: 'enrolled', reason: 'Payment confirmed and enrolment opened.' },
    }),
    env,
  });
  const eBody = await e.json();
  check('With an active enrolment, the application reaches enrolled', e.status === 200 && eBody.status === 'enrolled', JSON.stringify(eBody).slice(0, 140));
  check('...and the enrolment is bound to the application the payment path could not name',
    env.DB.prepare("SELECT application_id FROM enrolments WHERE id = 'enr_paid'").bind().first().application_id === id);
  // The flag is not a constant. This is the only place in the suite that
  // proves it can be true.
  check('An email that DOES send is reported as sent',
    eBody.notifications[0].event === 'enrolment_confirmed' && eBody.notifications[0].sent === true,
    JSON.stringify(eBody.notifications));
  check('...and is logged against the applicant',
    env.DB.prepare("SELECT COUNT(*) AS n FROM notification_log WHERE event_type = 'enrolment_confirmed' AND status = 'sent'").bind().first().n === 1);
  MAIL = 'refuses';

  const events = env.DB.prepare('SELECT * FROM application_events WHERE application_id = ? ORDER BY created_at, id').bind(id).all().results;
  check('Every move left an audit event', events.length === 4, `${events.length} events`);
  check('...each naming where it came from and where it went',
    events.map((x) => `${x.from_status}>${x.to_status}`).join(' ')
      === 'submitted>placement_pending placement_pending>offer_sent offer_sent>accepted accepted>enrolled');
  check('...attributed to the officer who made it, where there was one',
    events[0].actor_id === 'usr_staff' && events[3].actor_id === 'usr_staff');
  // The acceptance was made by a person with no account — the ordinary
  // case, since an account is created at enrolment. There is no id to
  // write and none is invented; the party tag carries the attribution.
  check('...and the applicant\'s own acceptance has no actor id to invent, only a party',
    events[2].actor_id === null && L.readReason(events[2].reason).party === 'applicant');
}

// =====================================================================
// C · ILLEGAL TRANSITIONS ARE REFUSED, AND THE REFUSAL NAMES THE LEGAL ONES
// =====================================================================
{
  const env = freshEnv();
  const staff = staffRow(env);
  const id = await applyFor(env);

  const jump = await throws(() => L.staffTransition(env, { actor: staff, applicationId: id, to: 'enrolled' }));
  check('An application cannot jump from submitted to enrolled', jump && jump.name === 'IllegalTransitionError');
  check('...and the refusal lists what IS legal from here',
    /placement_pending/.test(jump.message) && /withdrawn/.test(jump.message) && /rejected/.test(jump.message), jump.message);
  check('...carrying the legal moves as data, not only as prose',
    Array.isArray(jump.legal) && jump.legal.some((l) => l.to === 'placement_pending'));

  const viaQueue = await throws(() => L.staffTransition(env, { actor: staff, applicationId: id, to: 'offer_sent' }));
  check('Staff cannot set offer_sent by hand', viaQueue && viaQueue.name === 'IllegalTransitionError');
  check('...and are sent to the route that writes the offer', /\/api\/admissions\/offer/.test(viaQueue.message), viaQueue.message);

  const early = await throws(() => L.issueOffer(env, {
    actor: staff, applicationId: id, levelId: 1, kind: 'unconditional', expiresAt: new Date(T0 + 30 * DAY).toISOString(), now: T0,
  }));
  check('An offer cannot be issued before placement is confirmed', early && early.name === 'IllegalTransitionError');
  check('...saying that a person confirms placement first',
    /placement_pending/.test(early.message), early.message);

  const unknown = await throws(() => L.staffTransition(env, { actor: staff, applicationId: id, to: 'archived' }));
  check('An unknown status is refused, listing the real ones',
    unknown && unknown.name === 'ValidationError' && /submitted, placement_pending/.test(unknown.message));

  // The channel rule, tested directly: a status whose evidence is
  // written elsewhere cannot be reached through a door that writes none.
  await L.staffTransition(env, { actor: staff, applicationId: id, to: 'placement_pending' });
  const wrongChannel = await throws(() => L.transitionApplication(env, {
    application: appRow(env, id), to: 'offer_sent', party: 'staff', actor: staff, channel: 'queue',
  }));
  check('offer_sent cannot be reached through the queue channel',
    wrongChannel && wrongChannel.name === 'IllegalTransitionError' && /through offer/.test(wrongChannel.message),
    wrongChannel && wrongChannel.message);

  const wrongParty = await throws(() => L.transitionApplication(env, {
    application: appRow(env, id), to: 'rejected', party: 'applicant', actor: null, channel: 'queue', reason: 'no',
  }));
  check('An applicant cannot reject their own application on the College\'s behalf',
    wrongParty && /made by staff, not by applicant/.test(wrongParty.message), wrongParty && wrongParty.message);

  const noReason = await throws(() => L.staffTransition(env, { actor: staff, applicationId: id, to: 'rejected' }));
  check('A rejection with no reason is refused', noReason && noReason.name === 'ValidationError');
  check('...and staff are told the reason is shown to the applicant',
    /shown to the applicant/i.test(noReason.message), noReason.message);

  // Two officers acting at the same moment.
  const stale = appRow(env, id);
  await L.staffTransition(env, { actor: staff, applicationId: id, to: 'rejected', reason: 'Not proceeding at this time.' });
  const raced = await throws(() => L.transitionApplication(env, {
    application: stale, to: 'withdrawn', party: 'staff', actor: staff, channel: 'queue', reason: 'Applicant asked to stop.',
  }));
  check('A second officer acting on a stale read is refused, not allowed to overwrite',
    raced && raced.name === 'IllegalTransitionError' && /while this request was in flight/.test(raced.message),
    raced && raced.message);
  check('...and the first decision stands', appRow(env, id).status === 'rejected');
}

// =====================================================================
// D · AN OFFER CANNOT BE ISSUED WRONGLY
// =====================================================================
{
  const env = freshEnv();
  const staff = staffRow(env);
  const id = await applyFor(env);
  await L.staffTransition(env, { actor: staff, applicationId: id, to: 'placement_pending', now: T0 });
  const base = { actor: staff, applicationId: id, levelId: 3, now: T0 };
  const good = new Date(T0 + 30 * DAY).toISOString();

  const noConditions = await throws(() => L.issueOffer(env, { ...base, kind: 'conditional', expiresAt: good }));
  check('A conditional offer with no conditions is refused',
    noConditions && noConditions.fields.conditions, noConditions && noConditions.message);
  const strayConditions = await throws(() => L.issueOffer(env, { ...base, kind: 'unconditional', conditions: 'Something', expiresAt: good }));
  check('Conditions on an unconditional offer are refused, not silently dropped',
    strayConditions && strayConditions.fields.conditions);
  const noExpiry = await throws(() => L.issueOffer(env, { ...base, kind: 'unconditional' }));
  check('An offer with no expiry is refused', noExpiry && /held open for ever/.test(noExpiry.fields.expiresAt));
  const past = await throws(() => L.issueOffer(env, { ...base, kind: 'unconditional', expiresAt: new Date(T0 - DAY).toISOString() }));
  check('An offer expiring in the past is refused', past && !!past.fields.expiresAt);
  const forever = await throws(() => L.issueOffer(env, { ...base, kind: 'unconditional', expiresAt: new Date(T0 + 400 * DAY).toISOString() }));
  check('An offer held longer than a year is refused', forever && /within 365 days/.test(forever.fields.expiresAt));
  const noLevel = await throws(() => L.issueOffer(env, { ...base, levelId: 99, kind: 'unconditional', expiresAt: good }));
  check('An offer at a level that does not exist is refused', noLevel && !!noLevel.fields.levelId);
  // Reject, never coerce — the house rule, asserted rather than trusted.
  const stringLevel = await throws(() => L.issueOffer(env, { ...base, levelId: '3', kind: 'unconditional', expiresAt: good }));
  check('A level that arrived as a string is refused, not quietly converted',
    stringLevel && !!stringLevel.fields.levelId);
  const noOfficer = await throws(() => L.issueOffer(env, { ...base, actor: null, kind: 'unconditional', expiresAt: good }));
  check('An offer with nobody behind it is refused', noOfficer && /named officer/.test(noOfficer.message));

  // "Holds to the close of the intake" is a day, not an instant.
  const dated = await L.issueOffer(env, { ...base, kind: 'unconditional', expiresAt: '2026-11-30' });
  check('A date-only expiry holds to the END of that day',
    dated.offer.expiresAt === '2026-11-30T23:59:59.999Z', dated.offer.expiresAt);
  check('...and the application moved with it', appRow(env, id).status === 'offer_sent');
  check('...recording the offered level as the confirmed one', appRow(env, id).placement_level_id === 3);

  const second = await throws(() => L.issueOffer(env, { ...base, kind: 'unconditional', expiresAt: good }));
  check('A second live offer to the same applicant is refused',
    second && /already has a live offer/.test(second.message), second && second.message);
}

// =====================================================================
// E · AN OFFER THAT RUNS OUT OF TIME
// =====================================================================
{
  const env = freshEnv();
  const staff = staffRow(env);
  L.resetReferenceLookups();
  const id = await applyFor(env);
  await L.staffTransition(env, { actor: staff, applicationId: id, to: 'placement_pending', now: T0 });
  await L.issueOffer(env, {
    actor: staff, applicationId: id, levelId: 1, kind: 'unconditional',
    expiresAt: new Date(T0 + 10 * DAY).toISOString(), now: T0,
  });

  const after = await L.trackApplication(env, { reference: id, clientKey: 'e1', now: T0 + 20 * DAY });
  check('An expired offer is lapsed the moment anybody looks', after.offer.status === 'lapsed');
  check('...and the application carries forward rather than closing',
    after.status === 'placement_pending' && after.closed === false);
  check('...which is the published commitment, not an invention',
    /not asked to apply again/i.test(after.timeline[after.timeline.length - 1].note || ''),
    after.timeline[after.timeline.length - 1].note);
  check('...filed to the platform, because no person decided it',
    after.timeline[after.timeline.length - 1].by === 'the platform');
  check('...and the applicant is told it lapsed', after.offerLapsed === true);

  const late = await throws(() => L.respondToOffer(env, { reference: id, action: 'accept', clientKey: 'e1', now: T0 + 21 * DAY }));
  check('An expired offer cannot be accepted', late && late.name === 'IllegalTransitionError', late && late.name);

  // The partial unique index exists precisely so this is possible.
  const fresh = await L.issueOffer(env, {
    actor: staff, applicationId: id, levelId: 1, kind: 'unconditional',
    expiresAt: new Date(T0 + 60 * DAY).toISOString(), now: T0 + 22 * DAY,
  });
  check('A fresh offer can be issued after a lapse', fresh.offer.status === 'issued');

  // Withdrawn and lapsed are different letters.
  const pulled = await L.withdrawOffer(env, {
    application: appRow(env, id),
    offer: env.DB.prepare("SELECT * FROM offers WHERE id = ?").bind(fresh.offer.id).first(),
    actor: staff, reason: 'The intake this offer named has closed.', now: T0 + 23 * DAY,
  });
  check('An offer the College withdraws is "withdrawn", not "lapsed"', pulled.offer.status === 'withdrawn');
  check('...with the reason recorded on the offer itself', /intake this offer named/.test(pulled.offer.withdrawnReason));
  check('...and the application back at placement', appRow(env, id).status === 'placement_pending');
  const noWhy = await throws(() => L.withdrawOffer(env, {
    application: appRow(env, id), offer: { id: 'x', status: 'issued' }, actor: staff, reason: '  ',
  }));
  check('An offer cannot be withdrawn without a reason', noWhy && noWhy.name === 'ValidationError');
}

// =====================================================================
// F · THE REFERENCE IS A BEARER CREDENTIAL
// =====================================================================
{
  const env = freshEnv();
  L.resetReferenceLookups();
  const mine = await applyFor(env, { email: 'mine@example.com' });
  const theirs = await applyFor(env, { email: 'theirs@example.com', name: 'Someone Else' });

  const none = await track.onRequestGet({ request: req('GET', 'https://wec-lc.test/api/admissions/track', { ip: '198.51.100.1' }), env });
  check('A lookup with no reference is 401 — an authentication boundary, not a typo', none.status === 401, none.status);

  const wrong = await track.onRequestGet({
    request: req('GET', 'https://wec-lc.test/api/admissions/track?ref=app_00000000-0000-4000-8000-000000000000', { ip: '198.51.100.1' }), env,
  });
  const wrongBody = await wrong.json();
  const malformed = await track.onRequestGet({
    request: req('GET', 'https://wec-lc.test/api/admissions/track?ref=not-a-reference', { ip: '198.51.100.1' }), env,
  });
  const malformedBody = await malformed.json();
  check('An unknown reference is refused', wrong.status === 401);
  check('...with the IDENTICAL answer a malformed one gets, so neither confirms the other exists',
    malformed.status === 401 && malformedBody.message === wrongBody.message);
  check('...and the refusal states the rule rather than only refusing',
    /does not open an application/.test(wrongBody.message) && /email address/.test(wrongBody.message));

  const byEmail = await track.onRequestGet({
    request: req('GET', 'https://wec-lc.test/api/admissions/track?email=mine%40example.com', { ip: '198.51.100.1' }), env,
  });
  const byEmailBody = await byEmail.json();
  check('An email address is REFUSED, not ignored', byEmail.status === 422 && !!byEmailBody.fields.email);
  check('...and discloses nothing', !JSON.stringify(byEmailBody).includes(mine));
  const byId = await track.onRequestGet({
    request: req('GET', `https://wec-lc.test/api/admissions/track?id=${mine}`, { ip: '198.51.100.1' }), env,
  });
  check('?id= is refused too, so status.js\'s habit cannot leak in here', byId.status === 422);

  const ok = await track.onRequestGet({ request: req('GET', `https://wec-lc.test/api/admissions/track?ref=${mine}`, { ip: '198.51.100.1' }), env });
  const okBody = await ok.json();
  check('A caller who DOES hold the reference gets through', ok.status === 200 && okBody.reference === mine);
  check('...and gets only their own application', !JSON.stringify(okBody).includes(theirs));

  // One character out. The substituted character is derived, not typed:
  // a literal '0' silently stops testing anything the day a reference
  // happens to end in one.
  const lastChar = mine.slice(-1);
  const nearMissRef = `${mine.slice(0, -1)}${lastChar === 'a' ? 'b' : 'a'}`;
  const nearMiss = await track.onRequestGet({
    request: req('GET', `https://wec-lc.test/api/admissions/track?ref=${nearMissRef}`, { ip: '198.51.100.1' }), env,
  });
  check('A reference one character out opens nothing',
    nearMissRef !== mine && nearMiss.status === 401, `${nearMiss.status}`);

  // The allowance.
  L.resetReferenceLookups();
  let limited = null;
  for (let i = 0; i < L.LOOKUPS_PER_WINDOW + 1; i++) {
    const r = await track.onRequestGet({ request: req('GET', `https://wec-lc.test/api/admissions/track?ref=${mine}`, { ip: '198.51.100.9' }), env });
    if (r.status === 429) { limited = await r.json(); break; }
  }
  check('Lookups are rate-limited', limited !== null);
  check('...and the refusal names when the next one may be made, not merely "later"',
    limited && limited.allowance && typeof limited.allowance.resetAt === 'string', limited && JSON.stringify(limited.allowance));
  const other = await track.onRequestGet({ request: req('GET', `https://wec-lc.test/api/admissions/track?ref=${mine}`, { ip: '198.51.100.10' }), env });
  check('...bounded per caller, so one abuser does not lock out every applicant', other.status === 200);

  // The accept door is the same credential, and the same refusal.
  L.resetReferenceLookups();
  const badAccept = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer?action=accept', {
      body: { reference: 'app_00000000-0000-4000-8000-000000000000' }, ip: '198.51.100.2',
    }),
    env,
  });
  check('A wrong reference cannot accept an offer', badAccept.status === 401);
  const byIdAccept = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer?action=accept', { body: { applicationId: mine }, ip: '198.51.100.2' }),
    env,
  });
  check('...and an application id is not accepted in place of a reference', byIdAccept.status === 422);
}

// =====================================================================
// G · AUTHORISATION AT THE ROUTES
// =====================================================================
{
  const env = freshEnv();
  const id = await applyFor(env);

  for (const [label, handler, method] of [
    ['GET /api/staff/applications', queueRoute.onRequestGet, 'GET'],
    ['PATCH /api/staff/applications', queueRoute.onRequestPatch, 'PATCH'],
  ]) {
    const anon = await handler({ request: req(method, 'https://wec-lc.test/api/staff/applications', { body: { applicationId: id, to: 'placement_pending' } }), env });
    check(`${label} refuses an unauthenticated caller`, anon.status === 401, anon.status);
    const learner = await handler({ request: req(method, 'https://wec-lc.test/api/staff/applications', { token: TOKENS.student, body: { applicationId: id, to: 'placement_pending' } }), env });
    check(`${label} refuses a learner`, learner.status === 403, learner.status);
  }

  const anonOffer = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer', { body: { applicationId: id, levelId: 1, kind: 'unconditional', expiresAt: '2026-12-01' } }), env,
  });
  check('Issuing an offer refuses an unauthenticated caller', anonOffer.status === 401, anonOffer.status);
  const learnerOffer = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer', { token: TOKENS.student, body: { applicationId: id, levelId: 1, kind: 'unconditional', expiresAt: '2026-12-01' } }), env,
  });
  check('...and refuses a learner', learnerOffer.status === 403, learnerOffer.status);
  const adminOffer = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer', { token: TOKENS.admin, body: { applicationId: id, levelId: 1, kind: 'unconditional', expiresAt: '2026-12-01' } }), env,
  });
  check('...while an administrator is admitted like any other officer', adminOffer.status !== 401 && adminOffer.status !== 403, adminOffer.status);

  const spoof = await queueRoute.onRequestPatch({
    request: req('PATCH', 'https://wec-lc.test/api/staff/applications', { token: TOKENS.staff, body: { applicationId: id, to: 'placement_pending', actorId: 'usr_admin' } }), env,
  });
  check('The actor cannot be named in the request', spoof.status === 422, spoof.status);
  const restHabit = await queueRoute.onRequestPatch({
    request: req('PATCH', 'https://wec-lc.test/api/staff/applications', { token: TOKENS.staff, body: { applicationId: id, status: 'placement_pending' } }), env,
  });
  check('`status` is refused in favour of `to`, so this cannot become a status setter', restHabit.status === 422);
  const setStatus = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer', { token: TOKENS.staff, body: { applicationId: id, levelId: 1, kind: 'unconditional', expiresAt: '2026-12-01', status: 'accepted' } }), env,
  });
  check('An offer\'s status cannot be chosen by the request', setStatus.status === 422);
  const badAction = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer?action=acccept', { body: { reference: id } }), env,
  });
  check('A misspelled action is refused rather than falling through to the staff door', badAction.status === 422);

  // The sub-path form is honoured as well as the query form, so adding
  // functions/api/admissions/offer/accept.js later changes nothing here.
  L.resetReferenceLookups();
  const subPath = await offerRoute.onRequestPost({
    request: req('POST', 'https://wec-lc.test/api/admissions/offer/accept', { body: { reference: id } }), env,
  });
  const subBody = await subPath.json();
  check('A request at /offer/accept reaches the applicant door, not the staff one',
    subPath.status === 422 && subBody.error === 'IllegalTransitionError', `${subPath.status} ${subBody.error}`);
  check('...and an illegal move carries the legal ones back with it',
    Array.isArray(subBody.legal) && subBody.legal.some((l) => l.to === 'placement_pending'), JSON.stringify(subBody.legal));
}

// =====================================================================
// H · WHAT THE APPLICANT MAY DO TO THEIR OWN APPLICATION
// =====================================================================
{
  const env = freshEnv();
  const staff = staffRow(env);
  L.resetReferenceLookups();

  // Withdrawing before an offer.
  const early = await applyFor(env, { email: 'early@example.com' });
  const noWhy = await throws(() => L.respondToOffer(env, { reference: early, action: 'withdraw', clientKey: 'h1', now: T0 }));
  check('Withdrawing without a reason is refused', noWhy && noWhy.name === 'ValidationError');
  const gone = await L.respondToOffer(env, { reference: early, action: 'withdraw', reason: 'I have accepted a place elsewhere.', clientKey: 'h1', now: T0 });
  check('An applicant can stop their own application without writing an email', gone.application.status === 'withdrawn');
  check('...with no account, and no actor id to invent',
    env.DB.prepare("SELECT actor_id FROM application_events WHERE application_id = ? AND to_status = 'withdrawn'").bind(early).first().actor_id === null);
  check('...but filed to the applicant, not to the platform',
    L.readReason(env.DB.prepare("SELECT reason FROM application_events WHERE application_id = ? AND to_status = 'withdrawn'").bind(early).first().reason).party === 'applicant');
  check('...and the reason kept rather than deleted',
    /accepted a place elsewhere/.test(L.readReason(env.DB.prepare("SELECT reason FROM application_events WHERE application_id = ? AND to_status = 'withdrawn'").bind(early).first().reason).note));

  // Declining an offer.
  const held = await applyFor(env, { email: 'held@example.com' });
  await L.staffTransition(env, { actor: staff, applicationId: held, to: 'placement_pending', now: T0 });
  await L.issueOffer(env, { actor: staff, applicationId: held, levelId: 1, kind: 'unconditional', expiresAt: new Date(T0 + 30 * DAY).toISOString(), now: T0 });

  const wrongVerb = await throws(() => L.respondToOffer(env, { reference: held, action: 'withdraw', reason: 'Changed my mind.', clientKey: 'h2', now: T0 + DAY }));
  check('An applicant holding an offer is told to decline it, not to withdraw around it',
    wrongVerb && /use action "decline"/i.test(wrongVerb.message), wrongVerb && wrongVerb.message);
  const declined = await L.respondToOffer(env, { reference: held, action: 'decline', reason: 'The start date does not work for me.', clientKey: 'h2', now: T0 + DAY });
  check('Declining settles the offer as declined', declined.offer.status === 'declined');
  check('...records why on the offer row', /start date/.test(declined.offer.declinedReason));
  check('...and closes the application as withdrawn', declined.application.status === 'withdrawn');
  const twice = await throws(() => L.respondToOffer(env, { reference: held, action: 'accept', clientKey: 'h2', now: T0 + 2 * DAY }));
  check('A declined offer cannot then be accepted', twice && twice.name === 'IllegalTransitionError');

  // Accepting twice.
  const keen = await applyFor(env, { email: 'keen@example.com' });
  await L.staffTransition(env, { actor: staff, applicationId: keen, to: 'placement_pending', now: T0 });
  await L.issueOffer(env, { actor: staff, applicationId: keen, levelId: 1, kind: 'unconditional', expiresAt: new Date(T0 + 30 * DAY).toISOString(), now: T0 });
  await L.respondToOffer(env, { reference: keen, action: 'accept', clientKey: 'h3', now: T0 + DAY });
  const again = await throws(() => L.respondToOffer(env, { reference: keen, action: 'accept', clientKey: 'h3', now: T0 + 2 * DAY }));
  check('An offer cannot be accepted twice', again && again.name === 'IllegalTransitionError');
  check('...and only one live offer row survives the whole exchange',
    env.DB.prepare("SELECT COUNT(*) AS n FROM offers WHERE application_id = ? AND status IN ('issued','accepted')").bind(keen).first().n === 1);
  const unknownAction = await throws(() => L.respondToOffer(env, { reference: keen, action: 'defer', clientKey: 'h3', now: T0 + 3 * DAY }));
  check('An action the College does not offer is refused, naming the ones it does',
    unknownAction && /accept, decline, withdraw/.test(unknownAction.message));
}

// =====================================================================
// I · THE QUEUE IS A QUEUE
// =====================================================================
{
  const env = freshEnv();
  const staff = staffRow(env);
  const first = await applyFor(env, { email: 'first@example.com', name: 'Aisha Ahmed', country: 'NG' });
  env.DB.prepare("UPDATE applications SET created_at = '2026-01-01T00:00:00.000Z' WHERE id = ?").bind(first).run();
  const second = await applyFor(env, { email: 'second@example.com', name: 'Bilal Okonkwo', country: 'GB' });
  env.DB.prepare("UPDATE applications SET created_at = '2026-06-01T00:00:00.000Z', source = 'referral' WHERE id = ?").bind(second).run();
  await L.staffTransition(env, { actor: staff, applicationId: second, to: 'placement_pending', now: T0 });

  const all = await L.applicationQueue(env, { now: T0 });
  check('The queue is oldest first — the application that has waited longest is at the top',
    all.applications[0].id === first, all.applications.map((a) => a.id === first ? 'first' : 'second').join(','));
  check('...saying how long each has waited', all.applications[0].daysWaiting > 200);
  check('...and how many sit at each stage', all.byStatus.submitted === 1 && all.byStatus.placement_pending === 1);

  const narrowed = await L.applicationQueue(env, { status: 'placement_pending', now: T0 });
  check('Filtering by status narrows the list', narrowed.total === 1 && narrowed.applications[0].id === second);
  check('...but NOT the tallies, so the rest of the queue does not disappear',
    narrowed.byStatus.submitted === 1 && narrowed.byStatus.placement_pending === 1);

  check('Filtering by country works', (await L.applicationQueue(env, { country: 'gb', now: T0 })).total === 1);
  check('Filtering by source works', (await L.applicationQueue(env, { source: 'referral', now: T0 })).total === 1);
  check('Filtering by level works', (await L.applicationQueue(env, { levelId: '1', now: T0 })).total === 2);
  check('Searching by name works', (await L.applicationQueue(env, { q: 'Okonkwo', now: T0 })).total === 1);
  check('Searching by email works', (await L.applicationQueue(env, { q: 'first@', now: T0 })).total === 1);
  // LIKE has its own wildcards; a search for a literal % must not match
  // every applicant the College has.
  check('A wildcard character in a search is a character, not a wildcard',
    (await L.applicationQueue(env, { q: '%%', now: T0 })).total === 0);

  const badStatus = await throws(() => L.applicationQueue(env, { status: 'pending' }));
  check('An unknown status filter is refused, naming the real ones',
    badStatus && /Unknown status/.test(badStatus.message) && /placement_pending/.test(badStatus.message));
  const badSource = await throws(() => L.applicationQueue(env, { source: 'carrier_pigeon' }));
  check('An unknown source filter is refused', badSource && badSource.name === 'ValidationError');
  const badLimit = await throws(() => L.applicationQueue(env, { limit: '5000' }));
  check('A limit beyond the cap is refused rather than silently clamped', badLimit && !!badLimit.fields.limit);
  const shortQ = await throws(() => L.applicationQueue(env, { q: 'a' }));
  check('A one-character search is refused', shortQ && !!shortQ.fields.q);
  check('Paging works', (await L.applicationQueue(env, { limit: '1', offset: '1', now: T0 })).applications[0].id === second);
}

// =====================================================================
// J · A SEND IS REPORTED, NEVER ASSERTED
// =====================================================================
{
  // No gateway at all — the state the College is actually in.
  const bare = freshEnv();
  const staff = staffRow(bare);
  const id = await applyFor(bare);
  const moved = await L.staffTransition(bare, { actor: staff, applicationId: id, to: 'placement_pending', now: T0 });
  check('Every notification entry says whether it sent',
    moved.notifications.every((n) => typeof n.sent === 'boolean'));
  check('...and, when it did not, why',
    moved.notifications.every((n) => n.sent || typeof n.reason === 'string'));
  check('A transition the catalog has no template for says so, and names the template it wants',
    moved.notifications[0].sent === false
      && moved.notifications[0].reason === 'no_template_in_catalog'
      && moved.notifications[0].event === 'placement_invitation',
    JSON.stringify(moved.notifications));

  // A configured gateway that refuses. This is the case that used to be
  // reported as a success.
  const wired = freshEnv({ RESEND_API_KEY: 'stub', RESEND_FROM_ADDRESS: 'admissions@example.com' });
  const wiredStaff = staffRow(wired);
  const wid = await applyFor(wired);
  wired.DB.prepare("UPDATE applications SET user_id = 'usr_student' WHERE id = ?").bind(wid).run();
  wired.DB.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at)
    VALUES ('enr_w', 'usr_student', 1, 'active', '2026-09-10T00:00:00.000Z')`).bind().run();
  await L.staffTransition(wired, { actor: wiredStaff, applicationId: wid, to: 'placement_pending', now: T0 });
  await L.issueOffer(wired, { actor: wiredStaff, applicationId: wid, levelId: 1, kind: 'unconditional', expiresAt: new Date(T0 + 20 * DAY).toISOString(), now: T0 });
  await L.respondToOffer(wired, { reference: wid, action: 'accept', clientKey: 'j1', now: T0 + DAY });

  MAIL = 'refuses';
  const refused = await L.staffTransition(wired, { actor: wiredStaff, applicationId: wid, to: 'enrolled', now: T0 + 2 * DAY });
  check('A gateway that refuses is reported as not sent, never as sent',
    refused.notifications[0].event === 'enrolment_confirmed' && refused.notifications[0].sent === false
      && refused.notifications[0].reason === 'gateway_unconfigured_or_refused',
    JSON.stringify(refused.notifications));
  check('...and the failure is in notification_log where support can find it',
    wired.DB.prepare("SELECT COUNT(*) AS n FROM notification_log WHERE status = 'failed'").bind().first().n >= 1);
  check('A failed notification never fails the transition it belongs to',
    refused.application.status === 'enrolled');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
