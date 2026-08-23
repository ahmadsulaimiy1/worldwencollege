#!/usr/bin/env node
// Put the deployment's ACTUAL Clerk host into the Content-Security-Policy.
//
// WHY THIS EXISTS.
//
// The report-only CSP shipped with `https://*.clerk.accounts.dev` and
// `https://*.clerk.com` in script-src and connect-src. Those cover a
// Clerk DEVELOPMENT instance. They do not cover a PRODUCTION one, whose
// Frontend API is a domain of the College's own —
// clerk.worldwencollege.co.uk — matching neither wildcard.
//
// Report-only blocks nothing, so today that is a reporting gap rather
// than an outage. The moment the policy is promoted to enforcing on a
// production Clerk instance, it becomes exactly the failure the note in
// _headers warns about: sign-in breaks silently, in production, for one
// real learner at a time.
//
// The host is derived from the publishable key the deploy already
// holds — the same derivation the Functions use to find their JWKS
// endpoint — so the policy cannot disagree with the instance it is
// protecting. One value, three consumers.
//
// Run by .github/workflows/deploy-cloudflare.yml before the publish.
// Idempotent: running it twice adds the host once.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEADERS = path.join(ROOT, '_headers');

// Same rule as functions/_lib/auth/clerk-adapter.js, and deliberately
// duplicated rather than imported: this runs in Node at build time and
// that runs in a Worker at request time, and a shared module would have
// to satisfy both toolchains for four lines of base64.
export function hostFromPublishableKey(key) {
  if (typeof key !== 'string' || !key.includes('_')) return null;
  const encoded = key.split('_').pop();
  if (!encoded) return null;
  let decoded;
  try { decoded = Buffer.from(encoded, 'base64').toString('utf8'); } catch { return null; }
  const host = decoded.replace(/\$+$/, '').trim();
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(host) ? host : null;
}

export function withClerkHost(headers, host) {
  if (!host) return headers;
  const origin = `https://${host}`;
  return headers.replace(
    /^(\s*Content-Security-Policy-Report-Only:.*)$/m,
    (line) => {
      if (line.includes(origin)) return line; // idempotent
      // Added to the two directives that actually load and talk to
      // Clerk. Not to default-src: widening the fallback would grant
      // the host every directive that inherits from it, including ones
      // Clerk has no business in.
      return line
        .replace(/(script-src [^;]*)/, `$1 ${origin}`)
        .replace(/(connect-src [^;]*)/, `$1 ${origin}`);
    },
  );
}

const key = process.env.CLERK_PUBLISHABLE_KEY || process.argv[2] || '';
if (import.meta.url === `file://${process.argv[1]}`) {
  const host = hostFromPublishableKey(key);
  if (!host) {
    console.log('No usable publishable key — the CSP keeps its wildcard Clerk origins only.');
    process.exit(0);
  }
  const before = readFileSync(HEADERS, 'utf8');
  const after = withClerkHost(before, host);
  if (before === after) {
    console.log(`CSP already names ${host}.`);
  } else {
    writeFileSync(HEADERS, after);
    console.log(`CSP now names this deployment's Clerk host: ${host}`);
  }
}
