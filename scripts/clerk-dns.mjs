// Read — and on request repair — the DNS records behind the Clerk
// custom domain this deployment authenticates against.
//
// WHY THIS EXISTS.
//
// The live site returned HTTP 530 from clerk.worldwencollege.co.uk for
// both its signing keys and its browser SDK. 530 is Cloudflare's
// "Origin DNS error" (1016): a record for the hostname exists and
// points at Cloudflare, and Cloudflare cannot resolve what is behind
// it. On a Clerk custom domain that means the CNAME was left PROXIED
// where Clerk requires DNS only. Nobody could sign in, and no amount of
// correct configuration in this repository or in Cloudflare Pages could
// change that.
//
// /api/health/auth can now say that. It cannot fix it. This can — using
// the same CLOUDFLARE_API_TOKEN the deploy already holds.
//
// WHAT IT WILL NOT TOUCH.
//
// Records are selected by their CONTENT, never by their name. A record
// is a Clerk record only if it is a CNAME pointing at a Clerk-owned
// host. Guessing from names — "anything starting with clerk" — would
// eventually meet somebody's own `accounts` record and switch off its
// proxying, which is a second outage caused by fixing the first.
//
// Read-only unless MODE=fix. Never prints the token.

const API = 'https://api.cloudflare.com/client/v4';

// Clerk serves custom-domain Frontend APIs from hosts it owns. A CNAME
// pointing at one of these is a Clerk record whatever it is called; a
// CNAME pointing anywhere else is not, whatever it is called.
const CLERK_TARGET = /(^|\.)(clerk\.services|clerk\.com|accounts\.dev|clerkstage\.dev)$/i;

export function isClerkRecord(rec) {
  if (!rec || rec.type !== 'CNAME') return false;
  return CLERK_TARGET.test(String(rec.content || '').replace(/\.$/, ''));
}

// Which zone holds this hostname. The registrable domain cannot be
// worked out from the string alone — worldwencollege.co.uk is two
// labels of suffix and example.com is one — so each candidate suffix is
// offered to the API and the zone that exists is the answer.
//
// Most specific first, which is how DNS itself resolves a name: the
// closest enclosing zone owns the record. clerk.worldwencollege.co.uk
// yields clerk.worldwencollege.co.uk, then worldwencollege.co.uk, then
// co.uk — so a delegated subzone is found if it exists, the real zone
// if it does not, and a broader zone is never matched ahead of a
// narrower one that also exists.
export function zoneCandidates(host) {
  const parts = String(host || '').split('.').filter(Boolean);
  const out = [];
  for (let i = 0; i <= parts.length - 2; i++) {
    out.push(parts.slice(i).join('.'));
  }
  return out;
}

// What has to change, and what is already right. Separated from the
// requests so the decision can be tested without a network.
export function plan(records) {
  const clerk = (records || []).filter(isClerkRecord);
  return {
    clerk,
    proxied: clerk.filter((r) => r.proxied === true),
    correct: clerk.filter((r) => r.proxied !== true),
  };
}

async function api(path, { token, method = 'GET', body, fetchImpl = fetch } = {}) {
  const resp = await fetchImpl(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await resp.json(); } catch { /* a non-JSON error page */ }
  return { status: resp.status, json };
}

function describe(r) {
  return `${String(r.name).padEnd(38)} ${String(r.type).padEnd(6)} -> `
    + `${String(r.content).padEnd(46)} ${r.proxied ? 'PROXIED  <- must be DNS only' : 'DNS only'}`;
}

export async function run({ token, host, mode = 'report', log = console.log, fetchImpl } = {}) {
  const call = (path, opts) => api(path, { token, fetchImpl, ...opts });

  if (!token) {
    log('No CLOUDFLARE_API_TOKEN available, so the DNS behind the Clerk domain cannot be read.');
    return { ok: false, reason: 'no-token' };
  }
  if (!host) {
    log('No Clerk host resolved for this deployment, so there is no zone to look in.');
    return { ok: false, reason: 'no-host' };
  }

  let zone = null;
  for (const name of zoneCandidates(host)) {
    const { status, json } = await call(`/zones?name=${encodeURIComponent(name)}`);
    if (status === 401 || status === 403) {
      log(`The API token cannot read zones (HTTP ${status}). Add "Zone -> Zone -> Read" and `
        + '"Zone -> DNS -> Edit" to it, scoped to this zone, to let the deploy report and '
        + 'repair these records. Nothing has been changed.');
      return { ok: false, reason: 'forbidden' };
    }
    const found = json && json.result && json.result[0];
    if (found) { zone = found; break; }
  }
  if (!zone) {
    log(`No Cloudflare zone found for ${host}. If DNS for this domain is hosted elsewhere, `
      + 'the records have to be changed there instead.');
    return { ok: false, reason: 'no-zone' };
  }

  const { status, json } = await call(`/zones/${zone.id}/dns_records?per_page=200`);
  if (status !== 200 || !json || !json.result) {
    log(`Could not list DNS records for ${zone.name} (HTTP ${status}).`);
    return { ok: false, reason: 'list-failed' };
  }

  const { clerk, proxied, correct } = plan(json.result);
  log(`Zone ${zone.name} — ${clerk.length} record${clerk.length === 1 ? '' : 's'} pointing at Clerk:`);
  if (!clerk.length) {
    log(`  none. ${host} has no CNAME to a Clerk host in this zone, so the records Clerk asked `
      + 'for were never added. Clerk dashboard -> Domains lists them.');
    return { ok: false, reason: 'no-records', zone: zone.name };
  }
  clerk.forEach((r) => log(`  ${describe(r)}`));

  if (!proxied.length) {
    log('Every Clerk record is DNS only. The proxy setting is not what is wrong here.');
    return { ok: true, changed: [], proxied: 0, correct: correct.length, zone: zone.name };
  }

  if (mode !== 'fix') {
    log(`${proxied.length} record${proxied.length === 1 ? ' is' : 's are'} proxied and must be `
      + 'DNS only. Cloudflare answers 530 for a proxied record whose target it cannot resolve, '
      + 'and serves its own certificate rather than Clerk’s, which the browser refuses. '
      + 'Re-run this workflow with fix_clerk_dns enabled to change them.');
    return { ok: false, reason: 'proxied', proxied: proxied.length, zone: zone.name };
  }

  const changed = [];
  for (const r of proxied) {
    const res = await call(`/zones/${zone.id}/dns_records/${r.id}`, {
      method: 'PATCH', body: { proxied: false },
    });
    if (res.status === 200 && res.json && res.json.success) {
      changed.push(r.name);
      log(`  switched ${r.name} to DNS only.`);
    } else {
      const err = res.json && res.json.errors && res.json.errors[0];
      log(`  could NOT change ${r.name} (HTTP ${res.status}${err ? `: ${err.message}` : ''}). `
        + 'The token most likely lacks "Zone -> DNS -> Edit".');
    }
  }
  return { ok: changed.length === proxied.length, changed, proxied: proxied.length, zone: zone.name };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await run({
    token: process.env.CLOUDFLARE_API_TOKEN,
    host: process.env.CLERK_HOST,
    mode: process.env.MODE || 'report',
  });
  process.exit(result.ok ? 0 : 1);
}
