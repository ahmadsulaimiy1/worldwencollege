/**
 * THE LINK CENSUS — every internal href and src on every built page,
 * resolved against what the deploy will actually contain.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ────────────────────────────────────────────────────────────────────
 * The Board asked for zero dead links before launch, and nothing in the
 * repository had ever checked. Every other guardrail here reads the
 * SOURCES in pages/; a dead link is a property of the BUILT site, of
 * the _redirects file, and of what is on disk — three things no source
 * check can see together.
 *
 * A 404 on a college's own site is not a cosmetic fault. It is read as
 * an institution that does not keep its own records, and it is read
 * that way by exactly the reader who was checking whether to trust it.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IT RESOLVES AGAINST, IN ORDER
 * ────────────────────────────────────────────────────────────────────
 *   1. a file on disk at that exact path
 *   2. a directory with an index.html (Cloudflare Pages serves it)
 *   3. path + '.html' (Pages' implicit extension)
 *   4. an exact rule in _redirects, of either kind
 *   5. a wildcard rule in _redirects
 *
 * A fragment is checked too, but separately and more gently: a missing
 * #anchor is a real fault and a much smaller one than a missing page,
 * so it is reported in its own list rather than mixed into the count
 * somebody is trying to drive to zero.
 *
 * External links are counted and listed, never fetched. A build that
 * depends on the reachability of somebody else's server is a build that
 * fails for reasons that are not about this repository.
 *
 *     node scripts/link-census.mjs            # summary
 *     node scripts/link-census.mjs --verbose  # every fault, with its page
 */
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');

const SKIP_DIRS = new Set(['node_modules', '.git', 'pages', 'partials', 'scripts',
  'tests', 'functions', 'sql', 'docs', 'publication', 'css', 'js']);

/** Every built HTML page in the deploy, which is every .html outside the sources. */
function builtPages(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full);
    if (statSync(full).isDirectory()) {
      if (SKIP_DIRS.has(rel.split(path.sep)[0])) continue;
      builtPages(full, out);
    } else if (name.endsWith('.html')) {
      out.push(rel);
    }
  }
  return out;
}

// ── _redirects, parsed the way Cloudflare Pages reads it ─────────────
const RULES = [];
if (existsSync(path.join(ROOT, '_redirects'))) {
  for (const line of readFileSync(path.join(ROOT, '_redirects'), 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const [from, to, code] = t.split(/\s+/);
    if (!from || !to) continue;
    RULES.push({ from, to, code: code || '302', wild: from.includes('*') });
  }
}
function redirected(p) {
  for (const r of RULES) {
    if (!r.wild) { if (r.from === p) return r; continue; }
    const re = new RegExp(`^${r.from.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    if (re.test(p)) return r;
  }
  return null;
}

/** Does the deploy serve this path? */
function serves(p) {
  const clean = p.split('#')[0].split('?')[0];
  const rel = decodeURIComponent(clean.replace(/^\//, ''));
  if (rel === '') return 'root';
  const abs = path.join(ROOT, rel);
  if (existsSync(abs) && statSync(abs).isFile()) return 'file';
  if (existsSync(abs) && statSync(abs).isDirectory()
      && existsSync(path.join(abs, 'index.html'))) return 'directory';
  if (existsSync(`${abs}.html`)) return 'implicit';
  const r = redirected(clean);
  if (r) return `redirect:${r.code}`;
  return null;
}

/** Fragment ids present in one built page. */
const idCache = new Map();
function idsIn(relPage) {
  if (idCache.has(relPage)) return idCache.get(relPage);
  const set = new Set();
  try {
    const body = readFileSync(path.join(ROOT, relPage), 'utf8');
    for (const m of body.matchAll(/\bid="([^"]+)"/g)) set.add(m[1]);
    for (const m of body.matchAll(/\bname="([^"]+)"/g)) set.add(m[1]);
  } catch { /* unreadable — the page-level check already reported it */ }
  idCache.set(relPage, set);
  return set;
}
/** The built page a site path resolves to, for fragment checking. */
function pageFor(p) {
  const clean = p.split('#')[0].split('?')[0];
  const rel = decodeURIComponent(clean.replace(/^\//, ''));
  if (rel === '') return 'index.html';
  if (existsSync(path.join(ROOT, rel, 'index.html'))) return path.join(rel, 'index.html');
  if (existsSync(path.join(ROOT, `${rel}.html`))) return `${rel}.html`;
  if (existsSync(path.join(ROOT, rel)) && rel.endsWith('.html')) return rel;
  const r = redirected(clean);
  if (r && !r.wild) return pageFor(r.to);
  return null;
}

// ── the sweep ────────────────────────────────────────────────────────
const pages = builtPages();
const dead = [];
const deadAnchors = [];
const external = new Map();
let checked = 0;

for (const page of pages) {
  const body = readFileSync(path.join(ROOT, page), 'utf8');
  const seen = new Set();
  for (const m of body.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (seen.has(raw)) continue;
    seen.add(raw);
    if (/^(mailto:|tel:|javascript:|data:|blob:)/i.test(raw)) continue;
    // A bare #fragment, and #i-icon references into the inlined sprite.
    if (raw.startsWith('#')) {
      if (raw.startsWith('#i-')) continue;         // icon sprite, checked elsewhere
      if (raw === '#') continue;
      if (!idsIn(page).has(raw.slice(1))) deadAnchors.push(`${page} -> ${raw}`);
      continue;
    }
    if (/^https?:\/\//i.test(raw)) {
      const host = new URL(raw).host;
      external.set(host, (external.get(host) || 0) + 1);
      continue;
    }
    if (!raw.startsWith('/')) continue;            // relative: none are authored here
    checked += 1;
    if (!serves(raw)) { dead.push(`${page} -> ${raw}`); continue; }
    const hash = raw.includes('#') ? raw.split('#')[1] : null;
    if (hash) {
      const target = pageFor(raw);
      if (target && !idsIn(target).has(hash)) deadAnchors.push(`${page} -> ${raw}`);
    }
  }
}

// ── orphans: a built page nothing links to ───────────────────────────
const linkedTo = new Set();
for (const page of pages) {
  const body = readFileSync(path.join(ROOT, page), 'utf8');
  for (const m of body.matchAll(/\bhref="(\/[^"#?]*)/g)) {
    const t = pageFor(m[1]);
    if (t) linkedTo.add(t);
  }
}
const orphans = pages.filter((p) => !linkedTo.has(p)
  && p !== 'index.html' && p !== '404.html' && p !== 'ar/index.html' && p !== 'ar/404.html');

// ── the report ───────────────────────────────────────────────────────
console.log(`\nLINK CENSUS — ${pages.length} built pages, ${checked} internal links resolved\n`);
console.log(`  dead links        ${String(dead.length).padStart(4)}`);
console.log(`  dead anchors      ${String(deadAnchors.length).padStart(4)}`);
console.log(`  orphan pages      ${String(orphans.length).padStart(4)}   (built, reachable only by typing the address)`);
console.log(`  external hosts    ${String(external.size).padStart(4)}   ${[...external.keys()].join(', ')}`);

const show = (label, list) => {
  if (!list.length) return;
  console.log(`\n${label}`);
  for (const l of (VERBOSE ? list : list.slice(0, 25))) console.log(`  ${l}`);
  if (!VERBOSE && list.length > 25) console.log(`  … and ${list.length - 25} more (--verbose)`);
};
show('DEAD LINKS', dead);
show('DEAD ANCHORS', deadAnchors);
show('ORPHAN PAGES', orphans);

console.log('');
process.exit(dead.length ? 1 : 0);
