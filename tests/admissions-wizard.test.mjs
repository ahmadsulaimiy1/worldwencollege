// Run with: node --experimental-sqlite tests/admissions-wizard.test.mjs
//
// The admissions wizard's draft-persistence layer: an applicant can
// save one step, leave, come back, and see exactly what they already
// entered — plus the auth boundary around it, and the handoff into the
// existing, unmodified POST /api/admissions/apply at final submission.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');

const { getOrCreateDraft, saveDraftStep, markDraftSubmitted } = await import(loadUrl('functions/_lib/admissions/draft.js'));
const { onRequestGet: draftGet, onRequestPut: draftPut } = await import(loadUrl('functions/api/admissions/draft.js'));
const { onRequestPost: apply } = await import(loadUrl('functions/api/admissions/apply.js'));

// ---------------------------------------------------------------------
// Part 1 — the pure draft-storage logic, no HTTP/auth involved. Same
// convention tests/student-dashboard.test.mjs uses: seed a `users` row
// directly and call the library functions with its id.
// ---------------------------------------------------------------------
{
  const env = { DB: makeD1(schema) };
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_1', 'clerk', 'sub_1', 'applicant@example.com', 'student')`).run();

  const created = await getOrCreateDraft(env, 'usr_1');
  check('getOrCreateDraft: creates a draft with no completed steps', created.completedSteps.length === 0);
  const again = await getOrCreateDraft(env, 'usr_1');
  check('getOrCreateDraft: is idempotent (same draft id)', again.id === created.id);

  const afterIdentity = await saveDraftStep(env, 'usr_1', 'identity', { fullName: 'Amina Yusuf', nationality: 'NG', country: 'NG' });
  check('saveDraftStep: marks the step complete', afterIdentity.completedSteps.includes('identity'));
  check('saveDraftStep: stores the fields', afterIdentity.data.fullName === 'Amina Yusuf');

  const afterContact = await saveDraftStep(env, 'usr_1', 'contact', { email: 'amina@example.com', city: 'Abuja' });
  check('saveDraftStep: a second step does not erase the first', afterContact.data.fullName === 'Amina Yusuf' && afterContact.data.email === 'amina@example.com');
  check('saveDraftStep: both steps now marked complete', afterContact.completedSteps.length === 2);

  const resaved = await saveDraftStep(env, 'usr_1', 'identity', { fullName: 'Amina Y. Yusuf' });
  check('saveDraftStep: a step can be revisited without duplicating itself in completedSteps', resaved.completedSteps.filter((s) => s === 'identity').length === 1);
  check('saveDraftStep: revisiting overwrites only the fields sent', resaved.data.fullName === 'Amina Y. Yusuf' && resaved.data.email === 'amina@example.com');

  const misplaced = await saveDraftStep(env, 'usr_1', 'contact', { fullName: 'Wrong step for this field' }).then(() => null).catch((e) => e);
  check('saveDraftStep: rejects a field that belongs to a different step', misplaced && misplaced.name === 'ValidationError');

  const badEnum = await saveDraftStep(env, 'usr_1', 'funding', { funding: 'not_a_real_option' }).then(() => null).catch((e) => e);
  check('saveDraftStep: rejects an invalid enum value', badEnum && badEnum.name === 'ValidationError');

  const badEmail = await saveDraftStep(env, 'usr_1', 'contact', { email: 'not-an-email' }).then(() => null).catch((e) => e);
  check('saveDraftStep: rejects a malformed email', badEmail && badEmail.name === 'ValidationError');

  const unknownStep = await saveDraftStep(env, 'usr_1', 'not_a_real_step', {}).then(() => null).catch((e) => e);
  check('saveDraftStep: rejects an unknown step key', unknownStep && unknownStep.name === 'ValidationError');

  // Second applicant, isolated data — proves no cross-applicant leakage.
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_2', 'clerk', 'sub_2', 'other@example.com', 'student')`).run();
  await saveDraftStep(env, 'usr_2', 'identity', { fullName: 'Someone Else' });
  const draft1 = await getOrCreateDraft(env, 'usr_1');
  const draft2 = await getOrCreateDraft(env, 'usr_2');
  check('draft isolation: applicant 1 never sees applicant 2\'s data', draft1.data.fullName !== draft2.data.fullName && draft1.id !== draft2.id);

  env.DB.prepare(`INSERT INTO applications (id, full_name, email) VALUES ('app_fake_id_for_test', 'Amina Yusuf', 'amina@example.com')`).run();
  await markDraftSubmitted(env, 'usr_1', 'app_fake_id_for_test');
  const afterSubmit = await getOrCreateDraft(env, 'usr_1');
  check('markDraftSubmitted: links the real application id onto the draft', afterSubmit.submittedApplicationId === 'app_fake_id_for_test');
  check('markDraftSubmitted: applicant 2\'s draft is untouched', (await getOrCreateDraft(env, 'usr_2')).submittedApplicationId == null);
}

// ---------------------------------------------------------------------
// Part 2 — the HTTP endpoints, with a REAL signed session token (same
// technique tests/auth-provisioning.test.mjs uses), proving the auth
// boundary is real rather than assumed.
// ---------------------------------------------------------------------
{
  const b64url = (bytes) => Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

  const kp = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });

  async function token(claims) {
    const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
    const now = Math.floor(Date.now() / 1000);
    const p = enc({ iat: now - 5, exp: now + 600, ...claims });
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
    return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
  }

  const env = { DB: makeD1(schema), CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_3', 'clerk', 'sub_3', 'applicant2@example.com', 'student')`).run();
  const goodToken = await token({ sub: 'sub_3', email: 'applicant2@example.com', email_verified: true });

  const noAuthResp = await draftGet({ request: new Request('https://x/api/admissions/draft'), env });
  check('GET draft: 401 with no Authorization header', noAuthResp.status === 401);

  const getResp = await draftGet({ request: new Request('https://x/api/admissions/draft', { headers: { authorization: `Bearer ${goodToken}` } }), env });
  const getBody = await getResp.json();
  check('GET draft: 200 with a real session', getResp.status === 200);
  check('GET draft: lists all 8 wizard steps', Array.isArray(getBody.steps) && getBody.steps.length === 8 && getBody.steps[getBody.steps.length - 1] === 'review');
  check('GET draft: no application yet', getBody.application === null);

  const putResp = await draftPut({
    request: new Request('https://x/api/admissions/draft', {
      method: 'PUT',
      headers: { authorization: `Bearer ${goodToken}` },
      body: JSON.stringify({ step: 'identity', fields: { fullName: 'Test Two', nationality: 'GB', country: 'GB' } }),
    }),
    env,
  });
  const putBody = await putResp.json();
  check('PUT draft: 200 and the step is recorded complete', putResp.status === 200 && putBody.completedSteps.includes('identity'));

  // Final submit, authenticated — proves apply.js's optional-auth path
  // attaches user_id and marks the draft submitted, without changing
  // the existing anonymous contract tests/admissions-and-currency.test.mjs
  // already covers.
  const applyResp = await apply({
    request: new Request('https://x/api/admissions/apply', {
      method: 'POST',
      headers: { authorization: `Bearer ${goodToken}` },
      body: JSON.stringify({ fullName: 'Test Two', email: 'applicant2@example.com', country: 'GB' }),
    }),
    env,
  });
  const applyBody = await applyResp.json();
  check('apply (authenticated): 201', applyResp.status === 201);

  const row = env.DB.prepare('SELECT user_id FROM applications WHERE id = ?').bind(applyBody.applicationId).first();
  check('apply (authenticated): application row carries user_id', row.user_id === 'usr_3');

  const afterApply = await draftGet({ request: new Request('https://x/api/admissions/draft', { headers: { authorization: `Bearer ${goodToken}` } }), env });
  const afterApplyBody = await afterApply.json();
  check('GET draft after submit: shows the real application', afterApplyBody.application && afterApplyBody.application.id === applyBody.applicationId && afterApplyBody.application.status === 'submitted');

  // An invalid/expired token must degrade to "anonymous", not error —
  // apply.js's own stated contract (see optionalUser()'s comment).
  const applyBadToken = await apply({
    request: new Request('https://x/api/admissions/apply', {
      method: 'POST',
      headers: { authorization: 'Bearer not-a-real-token' },
      body: JSON.stringify({ fullName: 'Anonymous Still Works', email: 'anon@example.com', country: 'US' }),
    }),
    env,
  });
  check('apply (garbage token): still 201, degrades to anonymous rather than erroring', applyBadToken.status === 201);
}

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
