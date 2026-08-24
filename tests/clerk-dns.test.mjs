// scripts/clerk-dns.mjs decides which records on a live DNS zone to
// switch off proxying for. It runs with a token that can edit DNS for
// the College's own domain, so the cost of getting the selection rule
// wrong is not a failed build — it is somebody else's outage.
//
// These assertions are about the decision, not the plumbing: which
// records it claims, which it refuses to touch, and whether it can be
// made to write anything at all without being told to.

import { isClerkRecord, zoneCandidates, plan, run } from '../scripts/clerk-dns.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  if (cond) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}`); }
};

const cname = (name, content, proxied) => ({ id: name, type: 'CNAME', name, content, proxied });

// ---------------------------------------------------------------------
// 1 · Which records are Clerk's
// ---------------------------------------------------------------------
// By CONTENT, never by name. A rule that claimed "anything called
// clerk*" would eventually meet a record somebody else owns; a rule
// that claimed "anything called accounts" would meet one almost
// immediately, since `accounts` is an ordinary subdomain name.
check('A CNAME to a Clerk frontend-api host is claimed',
  isClerkRecord(cname('clerk.worldwencollege.co.uk', 'frontend-api.clerk.services', true)));
check('...and to Clerk mail', isClerkRecord(cname('clkmail', 'mail.gh4pn.clerk.services', false)));
check('...and to a DKIM host', isClerkRecord(cname('clk._domainkey', 'dkim1.gh4pn.clerk.services', false)));
check('...and to accounts.clerk.services',
  isClerkRecord(cname('accounts', 'accounts.clerk.services', true)));
check('...and to a development instance', isClerkRecord(cname('x', 'y.accounts.dev', false)));
check('...and a trailing dot does not defeat it',
  isClerkRecord(cname('clerk', 'frontend-api.clerk.services.', true)));

check('A record merely NAMED clerk is not claimed',
  !isClerkRecord(cname('clerk', 'something.example.com', true)),
  'name-based selection would switch off a stranger’s proxying');
check('...nor one named accounts pointing elsewhere',
  !isClerkRecord(cname('accounts', 'accounts.google.com', true)));
check('...nor a lookalike suffix',
  !isClerkRecord(cname('clerk', 'frontend-api.clerk.services.evil.example', true)),
  'the anchor must be the END of the host');
check('...nor a substring match',
  !isClerkRecord(cname('clerk', 'notclerk.services', true)));
check('An A record is never claimed, whatever it points at',
  !isClerkRecord({ type: 'A', name: 'clerk', content: '1.2.3.4', proxied: true }));
check('A TXT record is never claimed',
  !isClerkRecord({ type: 'TXT', name: 'clerk', content: 'frontend-api.clerk.services' }));
check('Junk is never claimed',
  !isClerkRecord(null) && !isClerkRecord({}) && !isClerkRecord({ type: 'CNAME' }));

// ---------------------------------------------------------------------
// 2 · Which zone to look in
// ---------------------------------------------------------------------
// The registrable domain cannot be read off the string: .co.uk takes
// two labels and .com takes one. So every enclosing name is offered to
// the API, most specific first — the same order DNS itself resolves in,
// where the closest enclosing zone owns the record.
{
  const c = zoneCandidates('clerk.worldwencollege.co.uk');
  check('A delegated subzone would be found first', c[0] === 'clerk.worldwencollege.co.uk', c.join(', '));
  check('...then the real zone', c[1] === 'worldwencollege.co.uk');
  // The one that matters: a zone the College does not own must never be
  // matched ahead of one it does.
  check('...and a public suffix is never offered before the domain itself',
    c.indexOf('co.uk') > c.indexOf('worldwencollege.co.uk'), c.join(', '));
  check('...on a two-label domain too',
    zoneCandidates('clerk.example.com').includes('example.com'));
  check('A single label yields no zone to guess at', zoneCandidates('localhost').length === 0);
}

// ---------------------------------------------------------------------
// 3 · What the plan says
// ---------------------------------------------------------------------
{
  const records = [
    cname('clerk.worldwencollege.co.uk', 'frontend-api.clerk.services', true),
    cname('accounts.worldwencollege.co.uk', 'accounts.clerk.services', true),
    cname('clkmail.worldwencollege.co.uk', 'mail.gh4pn.clerk.services', false),
    cname('www.worldwencollege.co.uk', 'wec-lc.pages.dev', true),
    { type: 'A', name: 'worldwencollege.co.uk', content: '1.2.3.4', proxied: true },
  ];
  const p = plan(records);
  check('The plan claims only the Clerk records', p.clerk.length === 3, p.clerk.length);
  check('...separating the two that are proxied', p.proxied.length === 2, p.proxied.length);
  check('...from the one already right', p.correct.length === 1);
  check('...and leaves the site’s own proxied records alone',
    !p.clerk.some((r) => /pages\.dev/.test(r.content))
      && !p.proxied.some((r) => r.name.startsWith('www')),
    'the www record is proxied ON PURPOSE and must stay that way');
}

// ---------------------------------------------------------------------
// 4 · It cannot write unless it is told to
// ---------------------------------------------------------------------
// The default is report. A run that silently repaired a live zone
// because somebody re-ran a deploy would be a worse fault than the one
// it repairs.
{
  const zone = { id: 'z1', name: 'worldwencollege.co.uk' };
  const records = [cname('clerk.worldwencollege.co.uk', 'frontend-api.clerk.services', true)];
  const writes = [];
  const fetchImpl = async (url, opts) => {
    const method = (opts && opts.method) || 'GET';
    if (method !== 'GET') writes.push(`${method} ${url}`);
    // The visibility probe: a token that can see zones at all.
    if (url.includes('/zones?per_page')) {
      return new Response(JSON.stringify({ result: [zone] }), { status: 200 });
    }
    if (url.includes('/zones?name=worldwencollege.co.uk')) {
      return new Response(JSON.stringify({ result: [zone] }), { status: 200 });
    }
    if (url.includes('/zones?name=')) return new Response(JSON.stringify({ result: [] }), { status: 200 });
    if (url.includes('/dns_records?')) {
      return new Response(JSON.stringify({ result: records }), { status: 200 });
    }
    return new Response(JSON.stringify({ success: true, result: {} }), { status: 200 });
  };

  const lines = [];
  const reported = await run({
    token: 't', host: 'clerk.worldwencollege.co.uk',
    log: (m) => lines.push(m), fetchImpl,
  });
  check('report mode makes no write of any kind', writes.length === 0, writes.join(', '));
  check('...and does not claim success while the fault stands', reported.ok === false);
  check('...naming how many records are wrong', reported.proxied === 1);
  check('...and saying what turns it into a repair',
    lines.join('\n').includes('fix_clerk_dns'), lines.join('\n'));
  check('...and printing the record so a human can check the decision',
    /clerk\.worldwencollege\.co\.uk.*frontend-api\.clerk\.services.*PROXIED/s.test(lines.join('\n')));

  writes.length = 0;
  const fixed = await run({
    token: 't', host: 'clerk.worldwencollege.co.uk', mode: 'fix',
    log: () => {}, fetchImpl,
  });
  check('fix mode patches exactly the proxied Clerk record',
    writes.length === 1 && /PATCH .*\/zones\/z1\/dns_records\/clerk\.worldwencollege\.co\.uk$/.test(writes[0]),
    writes.join(', '));
  check('...and reports what it changed', fixed.ok === true
    && fixed.changed.length === 1 && fixed.changed[0] === 'clerk.worldwencollege.co.uk');
}

// ---------------------------------------------------------------------
// 5 · It never claims to have fixed what it could not
// ---------------------------------------------------------------------
{
  const fetchImpl = async (url, opts) => {
    const method = (opts && opts.method) || 'GET';
    if (url.includes('/zones?per_page') || url.includes('/zones?name=worldwencollege.co.uk')) {
      return new Response(JSON.stringify({ result: [{ id: 'z1', name: 'worldwencollege.co.uk' }] }), { status: 200 });
    }
    if (url.includes('/zones?name=')) return new Response(JSON.stringify({ result: [] }), { status: 200 });
    if (url.includes('/dns_records?')) {
      return new Response(JSON.stringify({
        result: [cname('clerk.worldwencollege.co.uk', 'frontend-api.clerk.services', true)],
      }), { status: 200 });
    }
    if (method === 'PATCH') {
      return new Response(JSON.stringify({
        success: false, errors: [{ message: 'Authentication error' }],
      }), { status: 403 });
    }
    return new Response('{}', { status: 200 });
  };
  const lines = [];
  const denied = await run({
    token: 't', host: 'clerk.worldwencollege.co.uk', mode: 'fix',
    log: (m) => lines.push(m), fetchImpl,
  });
  check('A refused PATCH is reported as a failure, not a repair',
    denied.ok === false && denied.changed.length === 0);
  check('...naming the permission the token is missing',
    /Zone -> DNS -> Edit/.test(lines.join('\n')), lines.join('\n'));
}

// A token that cannot even read stops before it starts, and says so
// rather than reporting an empty zone as a clean one.
{
  const lines = [];
  const forbidden = await run({
    token: 't', host: 'clerk.worldwencollege.co.uk',
    log: (m) => lines.push(m),
    fetchImpl: async () => new Response('{}', { status: 403 }),
  });
  check('A token that cannot read zones says so', forbidden.reason === 'forbidden');
  check('...and states plainly that nothing was changed',
    /Nothing has been changed/.test(lines.join('\n')));
}

// ---------------------------------------------------------------------
// 6 · "I could not see it" is not "it is not there"
// ---------------------------------------------------------------------
// Cloudflare does NOT answer 403 for a token with no Zone permissions.
// It answers 200 with an empty list — indistinguishable, to a naive
// check, from a token that can see zones and found no match. The first
// version of this script conflated them and reported that
// worldwencollege.co.uk's DNS "must be hosted elsewhere". It is not.
// That sends somebody to the wrong registrar looking for a record that
// is not there.
{
  const lines = [];
  const blind = await run({
    token: 't', host: 'clerk.worldwencollege.co.uk',
    log: (m) => lines.push(m),
    // A Pages/D1/R2-scoped token: usable, and sees no zones.
    fetchImpl: async () => new Response(JSON.stringify({ success: true, result: [] }), { status: 200 }),
  });
  check('A token that can see no zones is a distinct finding',
    blind.reason === 'no-zone-visibility', blind.reason);
  check('...reported as a fact about the TOKEN, not about the domain',
    /statement about the TOKEN/.test(lines.join('\n')), lines.join('\n'));
  check('...and it must NOT claim the DNS is hosted elsewhere',
    !/hosted elsewhere/.test(lines.join('\n')),
    'that claim was never established and sends somebody to the wrong registrar');
  check('...naming the permissions that would let it look',
    /Zone -> Zone -> Read/.test(lines.join('\n'))
      && /Zone -> DNS -> Edit/.test(lines.join('\n')));
  check('...and offering the by-hand route meanwhile',
    /Cloudflare -> DNS -> Records/.test(lines.join('\n')));
}

// The claim IS earned when the token can see zones and none matches —
// and naming what it can see separates "hosted elsewhere" from "right
// domain, wrong Cloudflare account".
{
  const lines = [];
  const elsewhere = await run({
    token: 't', host: 'clerk.worldwencollege.co.uk',
    log: (m) => lines.push(m),
    fetchImpl: async (url) => {
      if (/\/zones\?per_page/.test(url)) {
        return new Response(JSON.stringify({ result: [{ id: 'z9', name: 'someother.example' }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ result: [] }), { status: 200 });
    },
  });
  check('A visible-but-unmatched zone list earns the "elsewhere" claim',
    elsewhere.reason === 'no-zone');
  check('...and names the zones the token can actually see',
    /someother\.example/.test(lines.join('\n')), lines.join('\n'));
  check('...offering "wrong account" as the other reading',
    /wrong one/.test(lines.join('\n')));
}

// No records at all is a different fault from proxied records, and has
// a different fix: they were never added.
{
  const lines = [];
  const none = await run({
    token: 't', host: 'clerk.worldwencollege.co.uk',
    log: (m) => lines.push(m),
    fetchImpl: async (url) => {
      if (url.includes('/zones?per_page') || url.includes('/zones?name=worldwencollege.co.uk')) {
        return new Response(JSON.stringify({ result: [{ id: 'z1', name: 'worldwencollege.co.uk' }] }), { status: 200 });
      }
      if (url.includes('/zones?name=')) return new Response(JSON.stringify({ result: [] }), { status: 200 });
      return new Response(JSON.stringify({ result: [cname('www', 'wec-lc.pages.dev', true)] }), { status: 200 });
    },
  });
  check('A zone with no Clerk records is a distinct finding',
    none.reason === 'no-records');
  check('...pointing at where the records are listed',
    /Clerk dashboard -> Domains/.test(lines.join('\n')));
}

// Without a token it must not pretend to have looked.
{
  const noToken = await run({ token: '', host: 'clerk.worldwencollege.co.uk', log: () => {} });
  check('No token means no claim about the zone', noToken.reason === 'no-token');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
