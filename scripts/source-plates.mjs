// scripts/source-plates.mjs — source photographic plates that the
// College is actually entitled to publish.
//
// WHY NOT PINTEREST.
//
// Pinterest is a pinboard, not a licensor. Almost everything on it is a
// copy of someone else's photograph, re-hosted without the maker's
// permission, and pinning does not transfer any right to republish. For
// an institution whose entire public argument is that its claims can be
// checked, an unlicensed photograph is not a small risk — it is the one
// kind of defect that contradicts the proposition on the page it
// decorates.
//
// So: Openverse. It indexes Wikimedia Commons, Flickr's Creative
// Commons pool, and a long list of museums and national libraries, and
// it returns the LICENCE AND THE CREATOR with every result. That is
// what makes an image publishable rather than merely available.
//
// WHAT THIS SCRIPT WILL AND WILL NOT DO
//
//   · It only accepts cc0, pdm, by and by-sa. Anything nc (no
//     commercial use) or nd (no derivatives) is refused: this is a fee-
//     charging college, so nc is unusable, and nd forbids the crop.
//   · It records creator, licence, licence version and source URL for
//     every file, and writes them into the register. by and by-sa
//     REQUIRE attribution, and an unattributed by image is an
//     infringing image however freely it was offered.
//   · It does not decide whether an image is usable. That is Part 0 of
//     docs/photography-brief.md — cultural compatibility, register,
//     and the line about captions asserting untruths — and it is
//     judged by looking at the photograph, not by trusting a keyword.
//     This script downloads candidates into a review directory. A
//     human (or a model that has actually rendered them) moves the
//     ones that pass.
//
// USAGE
//   node scripts/source-plates.mjs                 # fetch candidates
//   node scripts/source-plates.mjs --sheet         # write a contact sheet
//
// Candidates land in assets/images/_candidates/ with a sidecar JSON of
// their licence metadata. Nothing enters assets/images/plates/ without
// passing review and gaining a row in CREDITS.md.

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'assets/images/_candidates');

// Licences that permit commercial use and cropping. Anything outside
// this set is refused before the image is even looked at.
const ALLOWED = new Set(['cc0', 'pdm', 'by', 'by-sa']);

// THE SHOT LIST, drawn from the brief's own finding that people-free
// subjects pass Part 0 easily and are also the strongest results —
// architecture, interiors, manuscripts, instruments. Each slot names
// the page it is for, so a candidate is judged against a real place on
// the site rather than admired in the abstract.
// PUBLIC DOMAIN AND CC0 ARE PREFERRED, and not out of caution alone.
// A BY-SA photograph that is cropped to --plate-ratio and given the
// plate's tone overlay is an ADAPTATION, and ShareAlike attaches to the
// adaptation. That is a live obligation on a commercial site, and it is
// entirely avoidable by sourcing public-domain work — of which the
// national libraries and museums Openverse indexes have a great deal.
// `license` on a slot overrides the default set.
const SLOTS = [
  { key: 'reading-room',  q: 'library reading room interior',        for: 'Academics — the curriculum' },
  { key: 'lecture-hall',  q: 'university lecture hall interior',     for: 'Academics — teaching practice' },
  { key: 'manuscript',    q: 'illuminated manuscript page',          for: 'Press — the imprint' },
  { key: 'bookbinding',   q: 'bookbinding workshop hand press',      for: 'Press — the shelf' },
  { key: 'stacks',        q: 'library bookshelves stacks',           for: 'Press — the library' },
  { key: 'colonnade',     q: 'university quadrangle colonnade',      for: 'Admissions — the passage' },
  { key: 'gateway',       q: 'college gatehouse entrance archway',   for: 'Admissions — the threshold' },
  { key: 'senate-house',  q: 'senate house interior university',     for: 'Governance — the instrument' },
  { key: 'seal-wax',      q: 'wax seal document charter',            for: 'Governance — the articles' },
  { key: 'desk-study',    q: 'desk study lamp books notebook',       for: 'Students — the record' },
  { key: 'astrolabe',     q: 'astrolabe brass instrument',           for: 'The College — the ornament' },
  { key: 'globe-antique', q: 'antique terrestrial globe library',    for: 'The College — worldwide' },

  // Second pass. The eight slots above that returned nothing did so
  // because of the compound dimension filter, not because the archives
  // are empty — re-queried here in the vocabulary catalogues actually
  // use, and restricted to public-domain work.
  { key: 'quadrangle',    q: 'college quadrangle cloister',          license: 'cc0,pdm', for: 'Admissions — the passage' },
  { key: 'archway',       q: 'gatehouse archway university',         license: 'cc0,pdm', for: 'Admissions — the threshold' },
  { key: 'chamber',       q: 'historic assembly chamber interior',   license: 'cc0,pdm', for: 'Governance — the instrument' },
  { key: 'charter',       q: 'charter parchment document seal',      license: 'cc0,pdm', for: 'Governance — the articles' },
  { key: 'writing-desk',  q: 'writing desk inkwell quill study',     license: 'cc0,pdm', for: 'Students — the record' },
  { key: 'instrument',    q: 'astrolabe scientific instrument brass', license: 'cc0,pdm', for: 'The College — the ornament' },
  { key: 'globe-pd',      q: 'terrestrial globe map antique',        license: 'cc0,pdm', for: 'The College — worldwide' },
  { key: 'press-hand',    q: 'printing press letterpress type',      license: 'cc0,pdm', for: 'Press — the imprint' },
];

const API = 'https://api.openverse.org/v1/images/';

async function search(slot) {
  // aspect_ratio=wide + size=large together returned NOTHING for eight
  // of twelve slots — the two filters compound, and Openverse's
  // dimension metadata is sparse on museum and library scans. Cropping
  // is the plate's job anyway (--plate-ratio), so shape is not a
  // sourcing constraint. Licence is.
  const lic = slot.license || [...ALLOWED].join(',');
  const url = `${API}?q=${encodeURIComponent(slot.q)}`
    + `&license=${lic}`
    + '&page_size=12&mature=false';
  const r = await fetch(url, { headers: { 'User-Agent': 'WEC-LC plate sourcing (educational site)' } });
  if (!r.ok) { console.error(`  ${slot.key}: search failed ${r.status}`); return []; }
  const j = await r.json();
  return (j.results || []).filter((x) => ALLOWED.has(String(x.license).toLowerCase()));
}

async function download(url, dest) {
  const r = await fetch(url, { headers: { 'User-Agent': 'WEC-LC plate sourcing (educational site)' } });
  if (!r.ok) return false;
  const buf = Buffer.from(await r.arrayBuffer());
  // Under 25 KB is a thumbnail or an error page, not a plate.
  if (buf.length < 25000) return false;
  writeFileSync(dest, buf);
  return true;
}

mkdirSync(OUT, { recursive: true });
const manifest = [];

for (const slot of SLOTS) {
  process.stdout.write(`${slot.key.padEnd(15)}`);
  let results;
  try { results = await search(slot); }
  catch (e) { console.log(`search error: ${e.message}`); continue; }
  let kept = 0;
  for (const [i, hit] of results.entries()) {
    if (kept >= 3) break;                       // three candidates per slot is enough to choose from
    const src = hit.url;
    if (!src) continue;
    const ext = (src.match(/\.(jpe?g|png|webp)(\?|$)/i) || [, 'jpg'])[1].toLowerCase();
    const name = `${slot.key}-${i + 1}.${ext === 'jpeg' ? 'jpg' : ext}`;
    let ok = false;
    try { ok = await download(src, path.join(OUT, name)); } catch { ok = false; }
    if (!ok) continue;
    manifest.push({
      file: name, slot: slot.key, forPage: slot.for,
      title: hit.title || null,
      creator: hit.creator || null,
      creatorUrl: hit.creator_url || null,
      license: hit.license, licenseVersion: hit.license_version || null,
      licenseUrl: hit.license_url || null,
      source: hit.source || null,
      foreignLandingUrl: hit.foreign_landing_url || null,
      attributionRequired: ['by', 'by-sa'].includes(String(hit.license).toLowerCase()),
    });
    kept++;
  }
  console.log(`${kept} candidate(s)`);
}

writeFileSync(path.join(OUT, 'candidates.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${manifest.length} candidates in assets/images/_candidates/`);
console.log('NOTHING SHIPS until it is looked at against Part 0 of docs/photography-brief.md.');
