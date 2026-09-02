// Run with: node --experimental-sqlite tests/payment-options.test.mjs
//
// READ BEFORE YOU SPEND.
//
// `POST /api/payments/create-checkout` answers "what would this cost,
// in my currency, by what means" by INSERTING a payments row and
// handing the learner to a gateway. `checkoutOptions()` exists so those
// questions can be asked without spending the row, and this file
// asserts the three things that make it worth having.
//
//   IT QUOTES WHAT THE CREATE ROUTE WILL CHARGE. The level price, the
//   full-programme price and the instalment split all come from the
//   same sources and the same function the create route uses. A quote
//   the payment endpoint will not honour is worse than no quote.
//
//   IT REPORTS THE GATEWAYS THAT ARE CONFIGURED, WITH NO FALLBACK.
//   `suggestGateway()` answers `['stripe']` when nothing is configured
//   because it must name something to attempt; a checkout surface that
//   believed it would draw a button that answers 503.
//
//   IT NEVER PRESENTS THE FULL PROGRAMME AS A SAVING. Six levels sum to
//   two cents more than the aggregate price, because the College waives
//   the remainder. /admissions/tuition/ states that paying in full buys
//   no discount, and a checkout must not contradict the fee schedule it
//   is charging under.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const { checkoutOptions } = await import(loadUrl('functions/_lib/payments/options.js'));
const { computeInstalmentAmounts } = await import(loadUrl('functions/_lib/payments/instalments.js'));
const { NotFoundError } = await import(loadUrl('functions/_lib/db.js'));
const { onRequestGet: optionsEndpoint } = await import(loadUrl('functions/api/payments/options.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
            VALUES ('usr_buy', 'clerk', 'sub_buy', 'buyer@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
            VALUES ('usr_in', 'clerk', 'sub_in', 'enrolled@example.com', 'student')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at)
            VALUES ('enr_in_1', 'usr_in', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();

const buyer = { id: 'usr_buy', email: 'buyer@example.com', role: 'student' };
const enrolled = { id: 'usr_in', email: 'enrolled@example.com', role: 'student' };

// ── The prices are the College's, in the ledger currency ────────────
{
  const o = await checkoutOptions(env, { user: buyer });
  check('every programme level is offered', o.levels.length === 6, String(o.levels.length));
  check('a level is priced from programme_levels.price_usd_cents',
    o.levels[0].price.usdCents === 316667, String(o.levels[0].price.usdCents));
  check('...and the figure arrives formatted, so no surface has to format money itself',
    o.levels[0].price.ledger.text === '$3,166.67', o.levels[0].price.ledger.text);
  check('the level carries its roman numeral and its CEFR band, not just an id',
    o.levels[0].roman === 'I' && o.levels[0].cefr === 'A1');
  check('the full programme is priced from platform_config, not from six levels added up',
    o.fullProgramme.price.usdCents === 1900000, String(o.fullProgramme.price.usdCents));
  check('the sum of the six levels is published beside it',
    o.fullProgramme.sumOfLevels.usdCents === 1900002, String(o.fullProgramme.sumOfLevels.usdCents));
  check('a two-cent rounding waiver is reported as the same price, never as a saving',
    o.fullProgramme.comparison === 'same' && o.fullProgramme.difference.usdCents === 2,
    `${o.fullProgramme.comparison} / ${o.fullProgramme.difference.usdCents}`);
  check('the ledger currency is named on the payload, so a figure is never a bare number',
    o.currency.ledgerCurrency.code === 'USD' && o.currency.ledgerCurrency.symbol === '$');
  check('with no rate to convert at, no second figure is invented',
    o.levels[0].price.learner === null);
}

// ── The instalment split is the one that will be charged ────────────
{
  const o = await checkoutOptions(env, { user: buyer });
  check('the adopted instalment count is read from platform_config',
    o.instalments.count === 4, String(o.instalments.count));
  check('instalments are offered against a LEVEL, which is what the fee schedule publishes',
    o.instalments.appliesTo === 'level', o.instalments.appliesTo);
  check('and the absence of a charge for using them is stated rather than left to silence',
    o.instalments.surcharge.usdCents === 0);

  const quoted = o.levels[0].instalment.amounts.map((a) => a.usdCents);
  const charged = computeInstalmentAmounts(316667, 4);
  check('every instalment quoted is the amount computeInstalmentAmounts() will charge',
    JSON.stringify(quoted) === JSON.stringify(charged), `${quoted} vs ${charged}`);
  check('...and they sum back to the level fee exactly',
    quoted.reduce((a, b) => a + b, 0) === 316667);
  check('the first instalment is named, because it is the sum actually taken on the day',
    o.levels[0].instalment.first.usdCents === charged[0]);
}

// ── What the learner already holds ──────────────────────────────────
{
  const o = await checkoutOptions(env, { user: enrolled });
  check('a level the learner is already enrolled on is marked as held',
    o.levels[0].enrolment.held === true && o.levels[0].enrolment.status === 'active');
  check('...and a level they are not is not',
    o.levels[1].enrolment.held === false && o.levels[1].enrolment.status === null);

  db.prepare(`INSERT INTO instalment_plans (id, user_id, level_id, total_amount_usd_cents, instalment_count, status)
              VALUES ('ipl_t', 'usr_in', 2, 316667, 4, 'active')`).run();
  const again = await checkoutOptions(env, { user: enrolled });
  check('a live instalment plan against a level is named, so a second is not opened by accident',
    again.levels[1].instalment.planId === 'ipl_t', String(again.levels[1].instalment.planId));
  check('...and a level with no plan says so rather than carrying somebody else\'s',
    again.levels[2].instalment.planId === null);
}

// ── A second currency, and the rate that converted it ───────────────
{
  db.prepare(`UPDATE currencies SET is_active = 1, fx_rate_to_usd = 0.79,
                fx_rate_source = 'test', fx_rate_as_of = '2026-08-01T00:00:00.000Z'
              WHERE code = 'GBP'`).run();
  const o = await checkoutOptions(env, { user: buyer, currency: 'GBP' });
  check('a level asked for in sterling comes back in sterling AND in the ledger currency',
    o.levels[0].price.learner.currency === 'GBP' && o.levels[0].price.ledger.currency === 'USD');
  check('...converted at the stored rate, to the cent',
    o.levels[0].price.learner.minorUnits === 250167, String(o.levels[0].price.learner.minorUnits));
  check('...and carrying the day the rate was true, on the figure itself',
    o.levels[0].price.learner.rateAsOf === '2026-08-01T00:00:00.000Z');
  check('the rate is published too, so the conversion can be checked rather than trusted',
    o.currency.rate.unitsPerUsd === 0.79 && o.currency.rate.column === 'currencies.fx_rate_to_usd');
  check('every currency the College can actually take is offered as a choice',
    o.currency.choices.map((c) => c.code).sort().join(',') === 'GBP,USD',
    o.currency.choices.map((c) => c.code).join(','));
  check('a currency the College cannot take is refused by name, not quietly re-quoted in dollars',
    await (async () => {
      try { await checkoutOptions(env, { user: buyer, currency: 'NGN' }); return false; }
      catch (e) { return e instanceof NotFoundError && /NGN/.test(e.message); }
    })());
}

// ── Relief the College has already granted ──────────────────────────
// A checkout that ignores a scholarship the College awarded is a
// checkout quoting a price its own payment route will not charge.
{
  await db.prepare(`INSERT INTO scholarships (id, user_id, kind, value, approved_by, notes, created_at)
                    VALUES ('sch_b', 'usr_buy', 'percent', 25, 'usr_admin_x',
                            'A quarter off, for the test.', '2026-03-10T00:00:00.000Z')`).run();
  const o = await checkoutOptions(env, { user: buyer });
  check('a scholarship the learner holds is quoted into the price',
    o.levels[0].price.usdCents === 237500, String(o.levels[0].price.usdCents));
  check('...with the published fee beside it, so the relief is visible rather than implied',
    o.levels[0].published.usdCents === 316667 && o.levels[0].relief.usdCents === 79167);
  check('...and the same relief reaches the full programme',
    o.fullProgramme.price.usdCents === 1425000 && o.fullProgramme.published.usdCents === 1900000);
  check('the id the create route needs is handed back, or the charge would not match the quote',
    o.scholarship.sendAsScholarshipId === 'sch_b');

  // The create route refuses to combine a scholarship with an
  // instalmentPlanId, and createInstalmentPlan() strikes the plan on
  // the published fee. So the instalments quoted must be the published
  // ones — anything else would be a figure nothing will charge.
  check('instalments stay struck on the published fee, because that is what will be charged',
    o.levels[0].instalment.first.usdCents === 79167 && o.levels[0].instalment.reliefApplies === false);
  check('...and the payload says so outright rather than leaving two prices to be reconciled',
    o.scholarship.appliesToInstalments === false);

  await db.prepare("DELETE FROM scholarships WHERE id = 'sch_b'").run();
  const plain = await checkoutOptions(env, { user: buyer });
  check('with no relief, no reduced-from figure is invented',
    plain.levels[0].published === null && plain.levels[0].relief === null && plain.scholarship === null);
}

// ── The gateways, with no fallback in the answer ────────────────────
{
  const none = await checkoutOptions(env, { user: buyer });
  check('with nothing configured, the configured list is EMPTY — not a hopeful ["stripe"]',
    Array.isArray(none.payment.configured) && none.payment.configured.length === 0,
    JSON.stringify(none.payment.configured));
  check('...and no gateway is suggested either, so nothing can draw a button from it',
    none.payment.suggested === null);
  check('the gateways the platform KNOWS are still published, which is a different fact',
    none.payment.known.length === 4);

  const configured = await checkoutOptions(
    { DB: env.DB, STRIPE_SECRET_KEY: 'sk_test_x' }, { user: buyer },
  );
  check('with a key present, that gateway is reported as configured',
    configured.payment.configured.join(',') === 'stripe', configured.payment.configured.join(','));
  check('...and it becomes the suggestion',
    configured.payment.suggested === 'stripe');
}

// ── Nothing is created by asking ────────────────────────────────────
{
  // The whole reason this module exists. If asking the price wrote a
  // row, the endpoint would be the create route with extra steps.
  await checkoutOptions(env, { user: buyer });
  await checkoutOptions(env, { user: buyer, currency: 'GBP' });
  const payments = await db.prepare('SELECT COUNT(*) AS n FROM payments').first();
  const plans = await db.prepare('SELECT COUNT(*) AS n FROM instalment_plans').first();
  check('asking what something costs creates no payment row', payments.n === 0, String(payments.n));
  check('...and creates no instalment plan either', plans.n === 1, String(plans.n));
}

// ── The endpoint, with a real token ─────────────────────────────────
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
  const token = async (sub) => {
    const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
    const t = Math.floor(Date.now() / 1000);
    const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: t - 5, exp: t + 600 });
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
    return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
  };

  const routed = { ...env, CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
  const tok = await token('sub_buy');
  const call = (qs, headers) => optionsEndpoint({
    request: new Request(`https://wec-lc.test/api/payments/options${qs}`, { headers: headers || {} }),
    env: routed,
  });
  const asBuyer = (qs) => call(qs, { Authorization: `Bearer ${tok}` });

  check('the endpoint refuses an unauthenticated caller — a price list is not public here',
    (await call('')).status === 401, String((await call('')).status));

  const ok = await asBuyer('');
  const body = await ok.json();
  check('...and answers the signed-in learner', ok.status === 200 && body.levels.length === 6);

  const spoof = await asBuyer('?userId=usr_in');
  check('a parameter naming somebody else is refused outright, not quietly ignored',
    spoof.status === 422, String(spoof.status));
  check('...and the refusal names the field, so a client can correct it',
    Boolean((await (await asBuyer('?userId=usr_in')).json()).fields.userId));

  check('a malformed currency is a clean 422, not a 500 from further down',
    (await asBuyer('?currency=POUNDS')).status === 422);
  check('...and so is a malformed country', (await asBuyer('?country=GBR')).status === 422);
  check('a currency the College cannot take answers 404, by name',
    (await asBuyer('?currency=NGN')).status === 404);
  check('a currency it can take is honoured, lower case and all',
    (await (await asBuyer('?currency=gbp')).json()).currency.code === 'GBP');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
