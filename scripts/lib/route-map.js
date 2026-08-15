/**
 * THE ROUTE MAP.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS IS
 * ────────────────────────────────────────────────────────────────────
 * The architecture in docs/information-architecture.html retires
 * thirty-seven URLs: thirty-three that become deep-linked sections of a
 * pillar page, and four that move to a better address. This file is the
 * single record of that, and it has two consumers that must never
 * disagree:
 *
 *   · scripts/build-redirects.js writes the managed block of _redirects
 *     from it, so the redirect file cannot drift from the plan;
 *   · tests/route-map.test.mjs enforces it.
 *
 * Hand-maintaining a redirect file beside a migration plan is how a
 * retired URL ends up returning 404 to a printed volume six months
 * after anyone remembers writing it down.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY IT EXISTS BEFORE ANY PAGE HAS MOVED
 * ────────────────────────────────────────────────────────────────────
 * The whole point of building the harness first is that no page move
 * can be silent. Every entry therefore carries `migrated`, and the test
 * asserts a DIFFERENT thing depending on it:
 *
 *   migrated: false → the old page must still exist. The plan is
 *     describing reality, not wishing at it.
 *   migrated: true  → the old page must be gone, a redirect must exist,
 *     the target must resolve, and nothing on the site may still link
 *     to the old URL.
 *
 * So the map is honest at every point in the migration, and flipping
 * one flag is what turns the checks on for that route. A phase that
 * moves a page without flipping its flag fails; a phase that flips a
 * flag without moving the page fails too.
 *
 * ────────────────────────────────────────────────────────────────────
 * NO CHAINS
 * ────────────────────────────────────────────────────────────────────
 * A redirect target may never itself be a retired URL. The section
 * shorthands already in _redirects are the reason this needs saying:
 * `/apply` points at `/admissions/apply/`, which this map retires, so
 * without the rule a visitor typing /apply would take two hops to
 * arrive. The test forbids it and the generator resolves shorthands
 * through the map.
 */

/** `from` is retired. `to` is where it goes. `why` is the clause in the
 *  architecture it was judged against, so no disposition is unexplained
 *  at the point somebody is reading the code rather than the document. */
const RETIRED = [
  // ── into /about/ ──────────────────────────────────────────────────
  { from: '/about/vision/', to: '/about/#vision', why: 'section of the College pillar', migrated: false },
  { from: '/about/mission/', to: '/about/#mission', why: 'section of the College pillar', migrated: false },
  { from: '/about/philosophy/', to: '/about/#philosophy', why: 'section of the College pillar', migrated: false },
  { from: '/about/structure/', to: '/about/#structure', why: 'section of the College pillar', migrated: false },

  // ── into /governance/ ─────────────────────────────────────────────
  // The first three are MOVES: the page continues to exist, at an
  // address that says what it is. The rest are absorptions.
  { from: '/about/governance/', to: '/governance/', why: 'moved to the top level', migrated: true },
  { from: '/standards/evidence/', to: '/governance/evidence/', why: 'moved with its pillar', migrated: true },
  { from: '/standards/decisions/', to: '/governance/decisions/', why: 'moved with its pillar', migrated: true },
  { from: '/about/academic-senate/', to: '/governance/#senate', why: 'section of Governance', migrated: true },
  { from: '/about/basce/', to: '/governance/#basce', why: 'section of Governance', migrated: true },
  { from: '/about/quality-assurance/', to: '/governance/#quality', why: 'section of Governance', migrated: true },
  { from: '/standards/', to: '/governance/#standard', why: 'section of Governance', migrated: true },
  { from: '/standards/verification/', to: '/governance/#verification', why: 'section of Governance', migrated: true },
  { from: '/standards/research/', to: '/governance/#research', why: 'section of Governance, until research exists', migrated: true },

  // ── into /academics/ ──────────────────────────────────────────────
  { from: '/academics/iefc/', to: '/academics/#iefc', why: 'section of Academics', migrated: true },
  { from: '/study/', to: '/academics/#levels', why: 'section of Academics', migrated: true },
  { from: '/learning/', to: '/academics/#learning', why: 'section of Academics', migrated: true },
  { from: '/learning/platform/', to: '/academics/#campus', why: 'section of Academics', migrated: true },
  { from: '/support/technical/', to: '/academics/#campus', why: 'section of Academics', migrated: true },

  // ── into /academics/teaching/ ─────────────────────────────────────
  { from: '/teaching/', to: '/academics/teaching/', why: 'moved under Academics', migrated: true },
  { from: '/teaching/lesson-design/', to: '/academics/teaching/#design', why: 'section of Teaching Practice', migrated: true },
  { from: '/teaching/support/', to: '/academics/teaching/#support', why: 'section of Teaching Practice', migrated: true },
  { from: '/teaching/companion/', to: '/academics/teaching/#companion', why: 'section of Teaching Practice', migrated: true },
  { from: '/teaching/development/', to: '/academics/teaching/#development', why: 'section of Teaching Practice', migrated: true },

  // ── into /admissions/ ─────────────────────────────────────────────
  { from: '/admissions/apply/', to: '/admissions/#apply', why: 'section of Admissions', migrated: true },
  { from: '/admissions/entry-requirements/', to: '/admissions/#requirements', why: 'section of Admissions', migrated: true },
  { from: '/admissions/dates/', to: '/admissions/#dates', why: 'section of Admissions', migrated: true },
  { from: '/admissions/international/', to: '/admissions/#international', why: 'section of Admissions', migrated: true },
  { from: '/admissions/visas/', to: '/admissions/#visas', why: 'section of Admissions', migrated: true },
  { from: '/admissions/questions/', to: '/faq/', why: 'one Questions page, sitewide', migrated: true },

  // ── into /admissions/tuition/ ─────────────────────────────────────
  { from: '/admissions/payment/', to: '/admissions/tuition/#paying', why: 'section of Tuition, Fees & Funding', migrated: true },
  { from: '/admissions/scholarships/', to: '/admissions/tuition/#funding', why: 'section of Tuition, Fees & Funding', migrated: true },

  // ── into /students/ ───────────────────────────────────────────────
  { from: '/students/listening-lab/', to: '/students/#lab', why: 'section of Student Life', migrated: false },
  { from: '/students/support/', to: '/students/#support', why: 'section of Student Life', migrated: false },

  // ── into /press/ ──────────────────────────────────────────────────
  { from: '/press/standards/', to: '/press/#standards', why: 'section of Press & Library', migrated: false },
  { from: '/press/review/', to: '/press/#review', why: 'section of Press & Library', migrated: false },
  { from: '/press/programme/', to: '/press/#programme', why: 'section of Press & Library', migrated: false },
  { from: '/library/', to: '/press/#library', why: 'section of Press & Library', migrated: false },
];

/** Arabic editions retire alongside their English counterparts. Derived
 *  rather than listed: a hand-kept second list is a second thing to
 *  forget, and the Arabic site mirrors the English structure exactly. */
const arabic = (path) => (path === '/' ? '/ar/' : `/ar${path}`);
const RETIRED_AR = RETIRED.map((r) => ({
  ...r,
  from: arabic(r.from),
  to: r.to.startsWith('/') ? arabic(r.to) : r.to,
}));

// Two derived targets do not exist: the registers have no Arabic
// edition yet, so /ar/governance/evidence/ and /ar/governance/decisions/
// are pages nobody has written. Anyone reaching the retired Arabic URLs
// is following a guessed address — the honest destination is the Arabic
// pillar, whose registers section links onward to the English editions
// with the (EN) marker the bilingual-links test enforces.
for (const r of RETIRED_AR) {
  if (r.to === '/ar/governance/evidence/' || r.to === '/ar/governance/decisions/') {
    r.to = '/ar/governance/';
  }
  // Teaching Practice has no Arabic edition; the Academics pillar's
  // #teaching section summarises it in Arabic and crosses to the
  // English page with the (EN) marker.
  if (r.to.startsWith('/ar/academics/teaching/')) r.to = '/ar/academics/#teaching';
}

const ALL = [...RETIRED, ...RETIRED_AR];
const retiredSet = new Set(ALL.map((r) => r.from));

/** Strip the fragment: `/about/#vision` → `/about/`. */
const pageOf = (url) => url.split('#')[0];

/** Follow the map once — but only through routes that have actually
 *  migrated. Used by the redirect generator so an existing shorthand
 *  like `/apply` lands on the successor rather than on a URL that is
 *  itself about to 301 somewhere else. Resolving through a PENDING
 *  entry would point the shorthand at a page that does not exist yet,
 *  which the first run of the generator did: /apply briefly targeted
 *  /admissions/#apply while /admissions/apply/ was still the live page. */
function resolve(url) {
  const hit = ALL.find((r) => r.from === url && r.migrated);
  return hit ? hit.to : url;
}

module.exports = { RETIRED, RETIRED_AR, ALL, retiredSet, pageOf, resolve, arabic };
