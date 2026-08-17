// sql/seed-demo-people.sql — the fictional placeholder staff list.
//
// This file contains eighteen invented people. The whole arrangement
// rests on two promises: they never reach production, and they never
// reach a page the public can load. Documents make those promises;
// this file is what keeps them.
//
// The assertion that earns its keep is #4 below. Everything else here
// checks the seed's own shape, which is easy. #4 scans every file the
// site actually serves for every one of the eighteen names — so the
// day someone pastes "Prof. Sarah Elizabeth Hughes" into faculty.html
// to see how it looks, the suite fails before the commit lands rather
// than after a stranger reads it.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { makeD1 } from './d1-shim.mjs';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const SEED_REL = 'sql/seed-demo-people.sql';
const SEED_PATH = path.join(ROOT, SEED_REL);
check('The placeholder seed exists', existsSync(SEED_PATH), SEED_PATH);
const seedSql = readFileSync(SEED_PATH, 'utf8');

// ---------------------------------------------------------------------
// 6. It loads against the REAL schema, and holds what it claims to
// ---------------------------------------------------------------------
// Read the rows back out of a database rather than parsing the SQL by
// hand: a regex over the text would pass on a file that no longer
// applies cleanly, which is the opposite of what is wanted.
const schema = readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
let env;
try {
  env = { DB: makeD1(`${schema}\n${seedSql}`) };
  check('The seed applies cleanly to sql/schema.sql', true);
} catch (e) {
  check('The seed applies cleanly to sql/schema.sql', false, e.message);
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}

const { results: people } = await env.DB
  .prepare("SELECT id, email, auth_provider_id, role, preferred_name FROM users WHERE id LIKE 'usr_demo_%' ORDER BY id")
  .bind().all();

check('It seeds all eighteen positions from the chart', people.length === 18, people.length);
// Every assertion below derives from `people`. With an empty list most
// of them pass vacuously — `[].every(...)` is true, and the leak scan
// searches for nothing and finds nothing. A green run on zero rows
// would be the exact failure this suite keeps catching elsewhere, so
// stop here rather than report it.
if (people.length !== 18) {
  console.log('\nRefusing to run the remaining assertions against an empty seed — they would all pass for the wrong reason.');
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}

const { results: strays } = await env.DB
  .prepare("SELECT id FROM users WHERE id NOT LIKE 'usr_demo_%'").bind().all();
check('...and creates nothing outside the usr_demo_ prefix', strays.length === 0,
  strays.map((r) => r.id).join(', '));

const byRole = people.reduce((a, p) => { a[p.role] = (a[p.role] || 0) + 1; return a; }, {});
check('Two administrators, matching governance recommendation A1', byRole.admin === 2, JSON.stringify(byRole));
check('Ten with staff access — the positions that work with learner records',
  byRole.staff === 10, JSON.stringify(byRole));
check('Six with no elevated access at all', byRole.student === 6, JSON.stringify(byRole));

check('Every placeholder has a name to display', people.every((p) => (p.preferred_name || '').trim().length > 2));

// No fabricated academic history, and no invented appointment records:
// both were explicit decisions, so both are asserted rather than left
// to whoever edits the seed next.
const { count: enrolCount } = await env.DB
  .prepare("SELECT COUNT(*) AS count FROM enrolments WHERE user_id LIKE 'usr_demo_%'").bind().first();
check('No enrolments — placeholder staff, not fabricated academic history', enrolCount === 0, enrolCount);
const { count: roleEventCount } = await env.DB
  .prepare("SELECT COUNT(*) AS count FROM role_events").bind().first();
check('No appointment events — an audit trail of invented board minutes is worse than an empty one',
  roleEventCount === 0, roleEventCount);

// ---------------------------------------------------------------------
// 1-3. Three properties that make an accidental application survivable
// ---------------------------------------------------------------------
check('Every id is usr_demo_*, so one DELETE removes all of them',
  people.every((p) => p.id.startsWith('usr_demo_')),
  people.filter((p) => !p.id.startsWith('usr_demo_')).map((p) => p.id).join(', '));

// RFC 2606 reserves .invalid as permanently unresolvable. If this seed
// is ever applied to production by mistake, nothing addressed to these
// rows can reach a real person.
const badEmails = people.filter((p) => !/\.invalid$/.test(p.email));
check('Every address is on a reserved .invalid domain, so no mail can ever reach anyone',
  badEmails.length === 0, badEmails.map((p) => p.email).join(', '));

// Clerk issues subject ids beginning 'user_'. A 'demo_' prefix cannot
// collide, so no real session token can ever resolve to one of these
// accounts — they are visible, not sign-innable.
const badSubs = people.filter((p) => !p.auth_provider_id.startsWith('demo_'));
check('Every auth id is demo_*, so no real Clerk session can ever match one',
  badSubs.length === 0, badSubs.map((p) => p.auth_provider_id).join(', '));
check('...and none of them looks like a Clerk id',
  people.every((p) => !p.auth_provider_id.startsWith('user_')));

// ---------------------------------------------------------------------
// 4. THE ONE THAT MATTERS — no placeholder name reaches a served file
// ---------------------------------------------------------------------
// Scan what ships, not what the seed says. A fabricated staff list on
// an education provider's site is a misrepresentation whether or not
// anyone meant it as one, and the preview deployment is public.
const SERVED_EXT = new Set(['.html', '.htm', '.js', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'docs', 'tests', 'sql', '.github']);

function servedFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) servedFiles(full, out);
    else if (SERVED_EXT.has(path.extname(name).toLowerCase())) out.push(full);
  }
  return out;
}
const files = servedFiles(ROOT);
check('There is a public site to scan', files.length > 20, files.length);

// Match on surname as well as full name: "Harrington" alone on a page
// is the same fabrication as the full row, and is how it would
// realistically be pasted in.
//
// ONE EXEMPTION, and it is narrow. Since the faculty register was
// filled, real appointed staff share a surname with a placeholder —
// "Dr. Ahmed Al-Hassan" against placeholder "Dr. Ahmad Kareem
// Al-Hassan", and "Hassan" inside it against "Dr. Zainab Ismail
// Hassan". Those staff are published on /faculty/ by design, so a bare
// surname is no longer proof of a leak. Surnames the register actually
// contains stop being matched; the placeholder's FULL name, email and
// id still are, which is what a real leak would carry. The exemption is
// derived from the register rather than hard-coded, and asserted below
// so it cannot quietly widen into "surnames are no longer checked".
// Read the ROSTER TABLES only, not the whole register. The register
// also names placeholders in its warning note — "Dr. Omar Farooq
// Malik" — and matching the file as a whole exempted "Malik", a
// surname that belongs to no member of staff. Narrowing this to the
// two tables is the difference between "this surname is published
// because someone works here" and "this surname is mentioned
// somewhere in a document".
//
// SECOND REGISTER, SAME RULE. The governance register arrived on
// 14 August 2026 with fifteen more real people, and two of them share a
// surname with a placeholder: "Professor Amina Rahman" against
// "Dr. Yusuf Ibrahim Rahman" and "Ms. Khadijah Noor Rahman", and
// "Mrs. Rebecca Anne Collins" against "Mr. Daniel Robert Collins".
//
// That register names placeholders in its own prose too — it carries a
// note warning that "Rebecca Anne Collins" is a recombination of two
// placeholder names, which is worth somebody noticing. Reading the file
// as a whole would therefore exempt "Lawson" and "Hughes", surnames
// belonging to no member of staff. So the same narrowing applies: the
// three roster tables only, never the prose around them. This is the
// "Malik" lesson from the faculty register, arriving a second time in a
// different file, which is the usual way of finding out that a lesson
// was really a rule.
const rosterNames = (file, from, to) => {
  const doc = readFileSync(path.join(ROOT, file), 'utf8');
  const start = doc.indexOf(from);
  if (start < 0) throw new Error(`${file} is missing "${from}"`);
  const end = to ? doc.indexOf(to, start) : -1;
  return doc.slice(start, end < 0 ? doc.length : end)
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => l.split('|')[1] || '')
    .join('\n');
};
const registerText = [
  rosterNames('docs/faculty-register.md', '## Academic staff'),
  rosterNames('docs/governance-register.md', '## Board of Governors',
    '## Independent External Examiner'),
].join('\n');
check('Both registers have roster tables to read',
  registerText.split('\n').filter(Boolean).length >= 35,
  registerText.split('\n').filter(Boolean).length);
const exempted = [];
const needles = [];
for (const p of people) {
  const full = p.preferred_name.trim();
  needles.push({ person: full, text: full });
  const surname = full.split(/\s+/).pop();
  if (surname && surname.length >= 5) {
    if (registerText.includes(surname)) exempted.push(surname);
    else needles.push({ person: full, text: surname });
  }
  needles.push({ person: full, text: p.email });
  needles.push({ person: full, text: p.id });
}
// Pinned as a literal list, not a count. The exemption is the one place
// this test can be weakened without failing, so widening it has to be a
// deliberate edit to this line with a name attached to each addition.
check('Only surnames belonging to registered staff or governors are exempt from the surname scan',
  [...new Set(exempted)].sort().join(', ') === 'Al-Hassan, Collins, Hassan, Rahman',
  [...new Set(exempted)].sort().join(', ') || 'none');
check('...and every exempt surname really is a placeholder AND a registered name',
  exempted.every((s) => people.some((p) => p.preferred_name.endsWith(s)) && registerText.includes(s)));
check('...while most placeholder surnames are still scanned',
  needles.filter((n) => n.text.split(/\s+/).length === 1 && !n.text.includes('@')
    && !n.text.startsWith('usr_demo_')).length >= 10);

const leaks = [];
for (const file of files) {
  const body = readFileSync(file, 'utf8');
  for (const n of needles) {
    if (body.includes(n.text)) leaks.push(`${path.relative(ROOT, file)} contains "${n.text}" (${n.person})`);
  }
}
check('NO placeholder name, surname, email or id appears in any file the site serves',
  leaks.length === 0, leaks.slice(0, 6).join(' | '));

// A test that only ever looks at clean files proves nothing about its
// own reach. Plant a name in a copy of a real page and confirm the
// same scan catches it.
{
  const victim = files.find((f) => f.endsWith('.html'));
  const sabotaged = readFileSync(victim, 'utf8') + '\n<p>Prof. Sarah Elizabeth Hughes, Academic Director</p>\n';
  const caught = needles.some((n) => sabotaged.includes(n.text) && !readFileSync(victim, 'utf8').includes(n.text));
  check('...and that scan does catch a name if one is pasted into a page', caught === true);
}

// ---------------------------------------------------------------------
// 5. It cannot ride to production on the deploy path
// ---------------------------------------------------------------------
const migrations = readdirSync(path.join(ROOT, 'sql/migrations'));
check('The seed is not in sql/migrations/, which the deploy job applies wholesale',
  !migrations.some((f) => /demo-people/.test(f)), migrations.join(', '));

const workflow = readFileSync(path.join(ROOT, '.github/workflows/deploy-cloudflare.yml'), 'utf8');
check('The deploy workflow never names it', !workflow.includes('seed-demo-people'),
  (workflow.match(/.*seed-demo-people.*/) || [''])[0]);

// The seed step loops the twelve curriculum/audio seeds by number. If
// that ever becomes a glob over sql/seed-*.sql, this file goes remote
// with it — so assert the shape, not just the absence of the name.
check('...and the seed step names its files explicitly rather than globbing sql/seed-*.sql',
  !/--file=sql\/seed-\*|for\s+f\s+in\s+sql\/seed-/.test(workflow));

// The file must say what it is at the top. Someone opening it in a
// hurry, in an editor, with no docs in view, has to be told.
check('The seed file itself warns that the people are fictional',
  /FICTIONAL PLACEHOLDER/i.test(seedSql.slice(0, 400)));
check('...and that it must never be applied to production',
  /NEVER BE APPLIED TO A PRODUCTION DATABASE/i.test(seedSql));

check('The chart is documented where the seed points',
  existsSync(path.join(ROOT, 'docs/org-chart-placeholders.md')));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
