// Run with: node --experimental-sqlite tests/notifications-adapter.test.mjs
//
// The Resend adapter, tested against the failures that actually happen
// in front of Resend rather than the one that happens inside it.
//
// This exists because of a real defect. The adapter called resp.json()
// unconditionally, so a 502 from an edge proxy — an HTML page, not
// JSON — threw "Unexpected token '<'" and the HTTP status never
// reached anyone. That matters more here than in most places:
// events.js deliberately swallows send failures so a receipt email
// cannot fail a payment webhook, which means this string and the
// notification_log row are the ONLY signal that admissions email has
// stopped working.
import { loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const { resendAdapter } = await import(loadUrl('functions/_lib/notifications/resend-adapter.js'));

const ENV = { RESEND_API_KEY: 're_test', RESEND_FROM_ADDRESS: 'admissions@worldwencollege.co.uk' };
const MSG = { to: 'applicant@example.com', subject: 'Test', html: '<p>Hello <b>you</b></p><ul><li>One</li></ul>' };

const realFetch = globalThis.fetch;
// Every retry path sleeps; with the real timers this file would take
// ~3s of wall clock to assert things that are pure logic.
const realSleepHost = globalThis.setTimeout;
function withInstantBackoff(fn) {
  globalThis.setTimeout = (cb, ms) => (ms >= 400 ? realSleepHost(cb, 0) : realSleepHost(cb, ms));
  return fn().finally(() => { globalThis.setTimeout = realSleepHost; });
}

/** Queue of canned responses; records every request made. */
function stubFetch(responses) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const next = responses[Math.min(calls.length - 1, responses.length - 1)];
    if (typeof next === 'function') return next();
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      text: async () => next.body === undefined ? '' : next.body,
    };
  };
  return calls;
}

// --- the defect this file was written for ---------------------------
{
  stubFetch([{ status: 502, body: '<html><body>Bad Gateway</body></html>' }]);
  let err;
  await withInstantBackoff(async () => {
    try { await resendAdapter.send(MSG, ENV); } catch (e) { err = e; }
  });
  check('A non-JSON 502 does not surface as a JSON parse error',
    err && !/JSON|Unexpected token/i.test(err.message), err && err.message);
  check('...and the HTTP status reaches the log, which is the whole point',
    err && err.message.includes('502'), err && err.message);
}

{
  stubFetch([{ status: 422, body: JSON.stringify({ message: 'The from address is not verified' }) }]);
  let err;
  try { await resendAdapter.send(MSG, ENV); } catch (e) { err = e; }
  check("Resend's own message is preserved when it sends one",
    err && err.message.includes('not verified') && err.message.includes('422'), err && err.message);
}

{
  const calls = stubFetch([{ status: 422, body: JSON.stringify({ message: 'unverified' }) }]);
  try { await resendAdapter.send(MSG, ENV); } catch { /* expected */ }
  check('A 422 is not retried — an unverified domain will not fix itself', calls.length === 1, `${calls.length} attempts`);
}

// --- retry, which is the difference between a lost receipt and a sent one
{
  const calls = stubFetch([
    { status: 429, body: JSON.stringify({ message: 'Too many requests' }) },
    { status: 200, body: JSON.stringify({ id: 'eml_recovered' }) },
  ]);
  const out = await withInstantBackoff(() => resendAdapter.send(MSG, ENV));
  check('A 429 is retried and the send succeeds', out && out.providerRef === 'eml_recovered');
  check('...on the second attempt, not more', calls.length === 2, `${calls.length} attempts`);
}

{
  const calls = stubFetch([{ status: 503, body: '' }]);
  await withInstantBackoff(async () => {
    try { await resendAdapter.send(MSG, ENV); } catch { /* expected */ }
  });
  check('A persistent 5xx gives up after three attempts rather than looping',
    calls.length === 3, `${calls.length} attempts`);
}

{
  const calls = stubFetch([
    { status: 500, body: '' },
    { status: 200, body: JSON.stringify({ id: 'eml_1' }) },
  ]);
  await withInstantBackoff(() => resendAdapter.send(MSG, ENV));
  const keys = calls.map((c) => c.init.headers['idempotency-key']);
  check('Retries carry an idempotency key, so a landed send is not delivered twice',
    keys[0] && keys[0] === keys[1], JSON.stringify(keys));
}

// --- the payload ----------------------------------------------------
{
  const calls = stubFetch([{ status: 200, body: JSON.stringify({ id: 'eml_2' }) }]);
  await resendAdapter.send(MSG, ENV);
  const sent = calls[0].body;
  check('A plain-text alternative is sent alongside the HTML', typeof sent.text === 'string' && sent.text.length > 0);
  check('...with the markup stripped rather than escaped', !/[<>]/.test(sent.text), sent.text);
  check('...and the words preserved', sent.text.includes('Hello you') && sent.text.includes('One'), JSON.stringify(sent.text));
  check('No reply_to is invented when none is configured', sent.reply_to === undefined);
}

{
  const calls = stubFetch([{ status: 200, body: JSON.stringify({ id: 'eml_3' }) }]);
  await resendAdapter.send(MSG, { ...ENV, RESEND_REPLY_TO: 'info@worldwencollege.co.uk' });
  check('A configured reply-to is passed through, so replies reach a human',
    calls[0].body.reply_to === 'info@worldwencollege.co.uk');
}

// --- the unconfigured case, which is still the live state -----------
{
  let err;
  try { await resendAdapter.send(MSG, { RESEND_FROM_ADDRESS: 'x@y.z' }); } catch (e) { err = e; }
  check('A missing API key still throws GatewayNotConfiguredError, not a fetch error',
    err && err.constructor.name === 'GatewayNotConfiguredError', err && err.constructor.name);
}

globalThis.fetch = realFetch;

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
