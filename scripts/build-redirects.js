#!/usr/bin/env node
/**
 * THE MANAGED BLOCK OF _redirects.
 *
 * Everything outside the markers below is hand-written and stays that
 * way: the apex-to-www rule, the .html extension rules, the section
 * shorthands, and the note explaining why /verify is deliberately not
 * redirected. Those are judgements, not data.
 *
 * Everything INSIDE the markers is generated from
 * scripts/lib/route-map.js, because it is data — thirty-seven English
 * routes and their Arabic counterparts, each with exactly one
 * successor. Maintaining that by hand beside a migration plan is how a
 * printed volume ends up pointing at a 404.
 *
 * Only MIGRATED routes get a rule. A redirect written before the page
 * moves would shadow the page that is still there, so the generator
 * writes a rule the moment a route's `migrated` flag flips and not
 * before. tests/route-map.test.mjs checks the block matches the map, so
 * forgetting to run this fails the build rather than shipping quietly.
 *
 * Run: node scripts/build-redirects.js
 */

const fs = require('fs');
const path = require('path');
const { ALL, resolve } = require('./lib/route-map');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, '_redirects');
const OPEN = '# >>> GENERATED FROM scripts/lib/route-map.js — DO NOT EDIT BY HAND';
const CLOSE = '# <<< END GENERATED';

const migrated = ALL.filter((r) => r.migrated);

// Longest `from` first. Cloudflare takes the first match, and a rule
// for /standards/ placed above /standards/evidence/ would swallow it.
migrated.sort((a, b) => b.from.length - a.from.length);

const width = Math.max(0, ...migrated.map((r) => r.from.length));
const rules = migrated.length
  ? migrated.map((r) => `${r.from.padEnd(width)}  ${r.to}  301`).join('\n')
  : '# (no routes migrated yet — this block fills in as each phase lands)';

const block = `${OPEN}
#
# The architecture in docs/information-architecture.html retires these
# URLs. Each one is indexed, may be printed in a published volume, and
# must never return 404. ${migrated.length} of ${ALL.length} planned routes have moved
# so far; the rest keep serving their own page until their phase lands.
#
${rules}
${CLOSE}`;

let text = fs.readFileSync(FILE, 'utf8');
if (text.includes(OPEN)) {
  const start = text.indexOf(OPEN);
  const end = text.indexOf(CLOSE) + CLOSE.length;
  if (end < start) throw new Error('_redirects: the generated markers are out of order.');
  text = text.slice(0, start) + block + text.slice(end);
} else {
  text = `${text.trimEnd()}\n\n${block}\n`;
}

// The hand-written shorthands must not point at a URL this map retires,
// or a visitor who types /apply takes two hops. Resolving them here
// keeps the judgement (which shorthands exist) hand-written and the
// destination correct.
text = text.replace(/^(\/[a-z-]+ +)(\/\S+)( +301)$/gm, (line, lead, target, tail) => {
  const fixed = resolve(target);
  return fixed === target ? line : `${lead}${fixed}${tail}`;
});

fs.writeFileSync(FILE, text);
console.log(`_redirects: ${migrated.length} of ${ALL.length} planned routes have migrated.`);
if (!migrated.length) console.log('Nothing to write yet — the harness is in place ahead of the moves.');
