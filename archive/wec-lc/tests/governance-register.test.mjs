// FOURTEEN NAMED PEOPLE, AND NOTHING ELSE.
//
// On 14 August 2026 the College attested a Board of Governors, an
// Academic Senate and a College Executive, and /about/governance/ went
// from a page about empty boxes to a page with real people's names and
// real universities on it. That is the single highest-stakes change this
// site has taken: a fabricated credential attributed to a named person
// is not a content bug, it is a false statement about somebody who can
// be looked up.
//
// docs/governance-register.md is therefore the only place a governor,
// senator or officer may come from, and this file enforces that in both
// directions — the same discipline tests/faculty-roster.test.mjs applies
// to the twenty teaching staff, which is where the pattern comes from.
//
//   Direction 1 — everybody in the register reaches the page.
//   Direction 2 — nobody reaches the page who is not in the register.
//
// Direction 2 is the one that matters. Without it, pasting a sixteenth
// name onto the page costs nothing and nothing notices.
//
// Two further things this file holds, because they are the claims the
// appointments could most easily have quietly broken:
//
//   - Constituted is not convened. The Senate has members and has not
//     met, so nothing may render as approved.
//   - The External Examiner post is still vacant, and every page that
//     said no award can be conferred still says it. Filling fourteen
//     internal posts moved exactly one item off that list, and the site
//     must not imply otherwise.
//
// Fourteen, not the fifteen supplied: the Executive's Director of
// Digital Learning was withdrawn because the faculty register had
// already attested that post to somebody else. The withdrawal is
// checked too — a withdrawal that leaves no trace is indistinguishable
// from never having happened.

import { readFileSync, existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// The register module is CommonJS, because the two generators that
// consume it are. Loading the real parser rather than reimplementing it
// here is deliberate: a test that reimplements its subject validates the
// reimplementation.
const GOV = createRequire(import.meta.url)('../scripts/lib/governance-register.js');

// The governance page moved to the top level with the pillar
// architecture — same content contract, new address.
const EN = path.join(ROOT, 'governance/index.html');
const AR = path.join(ROOT, 'ar/governance/index.html');
check('Both governance pages are built', existsSync(EN) && existsSync(AR));

const htmlText = (p) => readFileSync(p, 'utf8')
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&mdash;/g, '—').replace(/&rsquo;/g, '’').replace(/&amp;/g, '&')
  .replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');

const enText = htmlText(EN);
const arText = htmlText(AR);

const ALL = [...GOV.governors, ...GOV.senate, ...GOV.executive];
// Fourteen published, not the fifteen the College supplied. The
// Executive's Director of Digital Learning was withdrawn: the same post
// had been attested to somebody else two days earlier in the faculty
// register, and a directorship is a single office. Pinned as a literal
// so restoring that person is a deliberate edit here as well as in the
// register, and so a quiet drift in either direction fails.
check(`The register publishes fourteen people — ${ALL.length}`, ALL.length === 14,
  `${GOV.governors.length} governors, ${GOV.senate.length} senate, ${GOV.executive.length} executive`);

// ── Direction 1 — the register reaches the page ───────────────────────

{
  const missing = ALL.filter((r) => !enText.includes(r[0]));
  check('Every person in the register is named on the English page',
    missing.length === 0, missing.map((r) => r[0]).join(', '));

  const missingPost = ALL.filter((r) => !enText.includes(r[1]));
  check('...with the post the register gives them',
    missingPost.length === 0, missingPost.map((r) => `${r[0]} (${r[1]})`).join(', '));

  // Names stay in Latin script on the Arabic page, per the rule set for
  // /faculty/: translating a person's name or degree is a factual error
  // about them, and the safe form costs nothing.
  const missingAr = ALL.filter((r) => !arText.includes(r[0]));
  check('Every person is named on the Arabic page too, in Latin script',
    missingAr.length === 0, missingAr.map((r) => r[0]).join(', '));

  const missingArPost = ALL.filter((r) => !arText.includes(GOV.arabicFor(r[1])));
  check('...with their post rendered in Arabic',
    missingArPost.length === 0, missingArPost.map((r) => r[1]).join(', '));
}

// ── Direction 2 — THE ONE THAT MATTERS ────────────────────────────────
// Pull every person-shaped string out of the leadership sections and
// require the register to know it.
//
// The scan reads thirteen of the fourteen. "Ahmad Sulaimi" carries no
// honorific and no post-nominal, so nothing marks it out from ordinary
// prose, and a pattern loose enough to catch it would catch half the
// page. Stated here rather than papered over with a tuned regex:
// Direction 1 above still requires that name to be present, and the
// residual hole is that a fifteenth person written WITHOUT a title could
// be pasted in unnoticed. Anybody adding a governor is adding a titled
// one; if that ever stops being true, this is the check to widen.

const PERSON = /(?:Sheikh\s+)?(?:Prof\.|Professor|Dr\.|Mr\.|Mrs\.|Ms\.)\s+[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)+(?:,\s*(?:PhD|EdD|MEd|MSc|MBA|MA|BA|BSc|FCA))?/g;

for (const [label, text] of [['English', enText], ['Arabic', arText]]) {
  const slice = text.slice(text.indexOf('Leadership') >= 0 ? 0 : 0);
  const onPage = [...new Set(slice.match(PERSON) || [])];
  const known = new Set(ALL.map((r) => r[0]));
  // A register name may appear with or without its trailing
  // qualification, so match on the longest register name it starts with.
  const unregistered = onPage.filter((n) =>
    !known.has(n) && ![...known].some((k) => k.startsWith(n) || n.startsWith(k)));
  check(`No unregistered person appears on the ${label} page — ${onPage.length} names read`,
    unregistered.length === 0, unregistered.join(', '));
}

// Prove the scan reaches. A fifteenth person spliced into the page must
// be caught by the same comparison, not just by a count.
{
  const known = new Set(ALL.map((r) => r[0]));
  const sabotaged = enText + ' Dr. Gregory Alan Fairbairn, PhD Chancellor ';
  const found = [...new Set(sabotaged.match(PERSON) || [])].filter((n) =>
    !known.has(n) && ![...known].some((k) => k.startsWith(n) || n.startsWith(k)));
  check('...and that comparison does catch a fifteenth name spliced into the page',
    found.length === 1 && found[0] === 'Dr. Gregory Alan Fairbairn, PhD', found.join(', '));
}

// ── A credential the College did not supply is published as nothing ───
// Four of the five published executive officers were attested without
// qualifications. The failure mode this guards is not a typo; it is a
// plausible degree appearing under somebody's name because a template
// wanted a line there.

{
  const leaked = ALL
    .filter((r) => /^not supplied$/i.test((r[2] || '').trim()))
    .filter((r) => enText.includes('Not supplied') || arText.includes('Not supplied'));
  check('"Not supplied" is never printed as if it were a qualification',
    leaked.length === 0 && !enText.includes('Not supplied') && !arText.includes('Not supplied'));

  const blanks = ALL.filter((r) => /^not supplied$/i.test((r[2] || '').trim()));
  check(`The register really does carry unsupplied credentials — ${blanks.length} of them`,
    blanks.length >= 4, blanks.map((r) => r[0]).join(', '));
}

// ── The claims the appointments could have broken ─────────────────────

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
const bodies = Object.fromEntries(
  db.prepare('SELECT code, members_appointed AS m FROM academic_bodies').all().map((r) => [r.code, r.m]));
const events = db.prepare('SELECT body_code, event FROM academic_body_events').all();
db.close();

check('The register and the database agree on Senate membership',
  bodies.SENATE === GOV.SENATE_MEMBERS, `db ${bodies.SENATE} / register ${GOV.SENATE_MEMBERS}`);

check('BASCE is still unconstituted, and no page claims otherwise',
  bodies.BASCE === 0, `BASCE:${bodies.BASCE}`);

check('The Senate is recorded as constituted',
  events.some((e) => e.body_code === 'SENATE' && e.event === 'constituted'));

// The whole reason migration 016 records events rather than only a
// count. If a "convened" row ever appears, several pages assert the
// opposite in prose and must be settled by hand — scripts/build-about.js
// throws for the same reason.
check('...and NOT as convened, which is what keeps every mapping interim',
  !events.some((e) => e.event === 'convened'));

for (const [label, text, phrase] of [
  ['English', enText, 'not yet convened'],
  ['Arabic', arText, 'ولم ينعقد'],
]) {
  check(`The ${label} page says the Senate has not convened`, text.includes(phrase));
}

// The post fifteen appointments did not fill.
check('The External Examiner is still recorded as vacant', GOV.EXTERNAL_EXAMINER_VACANT);
check('The English page still says no award can be conferred',
  /cannot properly be conferred/i.test(enText));
check('The Arabic page still says it too', arText.includes('لا يمكن منحها لأحد'));

// The membership figure appears on the page as a figure, and it has to
// be the one the record holds. A number in prose is the easiest thing on
// a site to leave behind.
check('The published Senate figure matches the record',
  enText.includes(`${GOV.SENATE_MEMBERS} appointed members`),
  `looking for "${GOV.SENATE_MEMBERS} appointed members"`);

// ── The collisions, reported rather than asserted ─────────────────────
// Three posts or people appear in both registers with different content.
// None is a code defect and none can be settled from inside this
// repository, so they print on every run instead of failing — the same
// treatment tests/bilingual-links.test.mjs gives the Arabic backlog.
{
  const facultyDoc = readFileSync(path.join(ROOT, 'docs/faculty-register.md'), 'utf8');
  const facultyRows = facultyDoc
    .slice(facultyDoc.indexOf('## Academic staff'))
    .split('\n').filter((l) => l.trim().startsWith('|'))
    .map((l) => l.split('|').map((c) => c.trim()))
    .filter((c) => c[1] && c[1] !== 'Name' && !/^-+$/.test(c[1]));

  const facultyPosts = new Map(facultyRows.map((c) => [c[2], c[1]]));

  // A SUBJECT PROFESSORSHIP IS NOT A SINGULAR OFFICE, and treating it as
  // one is what made this reporter cry wolf on its first run. A
  // university may carry several Professors of English Language
  // Education and routinely does; only a named chair is unique. A
  // DIRECTORSHIP is singular, and two holders of one directorship is a
  // real defect — that distinction is the whole value of this check, so
  // it is drawn here rather than left to whoever reads the output.
  const sharedTitleIsOrdinary = (post) => /^Professor of |^Senior Professor of /.test(post);

  const shared = ALL.filter((r) => facultyPosts.has(r[1]) && facultyPosts.get(r[1]) !== r[0]);
  const clashes = shared.filter((r) => !sharedTitleIsOrdinary(r[1]))
    .map((r) => `${r[1]}: "${r[0]}" here, "${facultyPosts.get(r[1])}" in the faculty register`);
  const ordinary = shared.filter((r) => sharedTitleIsOrdinary(r[1]))
    .map((r) => `${r[1]} — ${r[0]} and ${facultyPosts.get(r[1])}`);

  check('No singular office is held by two different people',
    clashes.length === 0, clashes.join(' · '));

  // Confirm the distinction is doing work rather than exempting
  // everything, by handing it one of each.
  check('...and the check does still object to a shared directorship',
    !sharedTitleIsOrdinary('Director of Digital Learning')
    && sharedTitleIsOrdinary('Professor of English Language Education'));

  if (ordinary.length) {
    console.log(`\nNOTE ${ordinary.length} subject professorship(s) are held in both registers:`);
    for (const o of ordinary) console.log(`     ${o}`);
    console.log('     Not a collision — a subject chair is not a unique office. Recorded in');
    console.log('     docs/governance-register.md so nobody "fixes" it later.');
  }

  // The withdrawn officer must not have been quietly deleted. A
  // withdrawal that leaves no trace is indistinguishable from never
  // having happened, and this register's whole claim is that it records
  // what it decided not to publish.
  const registerDoc = readFileSync(path.join(ROOT, 'docs/governance-register.md'), 'utf8');
  const withdrawn = registerDoc.slice(registerDoc.indexOf('## Withdrawn'));
  check('The withdrawn officer is recorded, with the post and the reason',
    /## Withdrawn/.test(registerDoc)
    && withdrawn.includes('Mr. Ibrahim Hassan Yusuf')
    && withdrawn.includes('Director of Digital Learning'));

  check('...and does NOT appear on either published page',
    !enText.includes('Ibrahim Hassan Yusuf') && !arText.includes('Ibrahim Hassan Yusuf'));

  // The Withdrawn section sits after every roster table on purpose: the
  // parser slices each body between its heading and the next, so a
  // withdrawn row placed higher would be read back as a serving officer.
  check('...and the Withdrawn section is below every roster table, where the parser cannot read it',
    registerDoc.indexOf('## Withdrawn') > registerDoc.indexOf('## Independent External Examiner'));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
