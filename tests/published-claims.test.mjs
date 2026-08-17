// Numbers published to prospective students, measured against the
// database that is supposed to back them.
//
// This exists because of a real one. /academics/iefc/ publishes a Units
// column reading 120 per level and "seven hundred and twenty learning
// units" in its opening line. The platform holds 49 learning items per
// level and 294 in total — 41% of the advertised figure. Both numbers
// have a defensible meaning (720 is the curriculum framework's DESIGN:
// ten modules of roughly twelve learning units each), but the page
// presented the design as delivered content, on the page a prospective
// student reads before deciding to pay.
//
// Nobody wrote that as a lie. It drifted: the framework was written
// first, the marketing copy took its figures, and the authoring caught
// up more slowly than the copy implied. Drift is the normal way an
// institution ends up misrepresenting itself, and a document asking
// people to remember does not stop it. This does.
//
// The rule enforced here: **a page may publish a design figure, but not
// silently.** Where a number is not backed by the database, the page
// carrying it must also carry an explicit statement of what is
// designed versus what is delivered.
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// --- what is actually in the curriculum -------------------------------
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
for (let n = 1; n <= 6; n++) {
  db.exec(readFileSync(path.join(ROOT, `sql/seed-curriculum-level-${n}.sql`), 'utf8'));
}
const one = (sql) => db.prepare(sql).get();

const levels = one('SELECT COUNT(*) AS n FROM programme_levels').n;
const modules = one('SELECT COUNT(*) AS n FROM units').n;
const items = one('SELECT COUNT(*) AS n FROM learning_items').n;
const questions = one('SELECT COUNT(*) AS n FROM quiz_questions').n;
const perLevel = db.prepare(
  `SELECT c.level_id AS lvl, COUNT(li.id) AS n
     FROM courses c JOIN units u ON u.course_id = c.id
     JOIN learning_items li ON li.unit_id = u.id
     GROUP BY c.level_id ORDER BY c.level_id`,
).all();

console.log(`\nMeasured: ${levels} levels · ${modules} modules · ${items} learning items · ${questions} quiz questions`);
console.log(`Learning items per level: ${perLevel.map((r) => `${r.lvl}=${r.n}`).join(' ')}\n`);

// The IEFC page is a section of the Academics pillar now; the claims it
// carried moved with it.
const iefc = readFileSync(path.join(ROOT, 'pages/academics.html'), 'utf8');
const about = readFileSync(path.join(ROOT, 'pages/about.html'), 'utf8');

// ---------------------------------------------------------------------
// Claims the database CAN confirm — these must simply be true
// ---------------------------------------------------------------------
check('Six levels are published, and six exist', levels === 6, levels);
check('Sixty modules exist — the "ten modules per level" design is fully built',
  modules === 60, modules);
check('Every level has the same number of modules, as published',
  new Set(db.prepare('SELECT COUNT(*) AS n FROM units GROUP BY course_id').all().map((r) => r.n)).size === 1);
check('Every module carries a quiz and an assignment, as the table implies',
  one("SELECT COUNT(*) AS n FROM learning_items WHERE kind='quiz'").n === modules
  && one("SELECT COUNT(*) AS n FROM learning_items WHERE kind='assignment'").n === modules,
  `${one("SELECT COUNT(*) AS n FROM learning_items WHERE kind='quiz'").n} quizzes, ${one("SELECT COUNT(*) AS n FROM learning_items WHERE kind='assignment'").n} assignments`);

// ---------------------------------------------------------------------
// Claims the database CANNOT confirm — these must be disclosed
// ---------------------------------------------------------------------
// The published figure and the built figure. If these ever converge,
// the disclosure requirement below can be dropped — and this test will
// say so rather than leaving a stale warning on the site forever.
const PUBLISHED_UNITS_PER_LEVEL = 120;
const PUBLISHED_UNITS_TOTAL = 720;
const backed = items >= PUBLISHED_UNITS_TOTAL;

check('The page still publishes the design figure this test is watching',
  /<td>120<\/td>/.test(iefc), 'the claim moved — update this test rather than deleting it');

// ---------------------------------------------------------------------
// The terminology register (docs/academic-framework.md § XVII)
// ---------------------------------------------------------------------
// "Unit" previously meant a level, a module AND a lesson depending on
// where you read it, and that collision is exactly what let a published
// figure drift from the delivered content for months without anyone
// noticing. Ambiguity is not a style problem; it is how institutions
// come to misdescribe themselves. One word per concept, enforced.
const PUBLIC_PAGES = readdirSync(path.join(ROOT, 'pages'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => [f, readFileSync(path.join(ROOT, 'pages', f), 'utf8')]);

const unitOffenders = PUBLIC_PAGES.filter(([, body]) =>
  // "United Kingdom", "United Arab Emirates" and friends are not the
  // word we are policing.
  /\bunits?\b/i.test(body.replace(/United\s+\w+/gi, '')));
check('No public page uses "unit" — the word means three different things and is retired',
  unitOffenders.length === 0, unitOffenders.map(([f]) => f).join(', '));

// ---------------------------------------------------------------------
// Workload is the headline, not a content count
// ---------------------------------------------------------------------
// An hours figure is comparable across institutions and cannot be padded
// without becoming absurd; a lesson count is unverifiable by the reader
// and trivially inflated. The count is still true and still published in
// the structural table — it is simply no longer what the College leads
// with.
const iefcHead = iefc.slice(0, iefc.indexOf('</section>'));
check('The IEFC page leads with academic workload, not a lesson count',
  /AIPC Credits/.test(iefcHead) && /Total Qualification Time/.test(iefcHead), 'headline metrics are not workload');
check('...and no longer leads with a raw content count',
  !/Lessons Total|Units Total|Lessons Per Level|Units Per Level/i.test(iefcHead));

// The hours figure is the most checkable claim the College could get
// wrong, so the qualifications on it are mandatory, not optional.
check('The hours figure is declared a design figure, not a measurement',
  /design figure, not a measurement/i.test(iefc));
check('...with the commitment to replace it with measured hours',
  /measured from real time-on-task/i.test(iefc));
check('...and does NOT claim C2 is reachable in that time from no English',
  /not a claim that CEFR C2 can be reached/i.test(iefc));
check('The AIPC Credit is declared internal, not ECTS or CATS',
  /not ECTS or CATS/i.test(iefc) && /no transfer entitlement/i.test(iefc));

// ── THE GAP THIS CHECK WAS MISSING ──
//
// Every assertion above reads `iefc` — the IEFC page — and nothing
// checked whether another page published the same figures without the
// same qualifications. The home page did exactly that: it carried a
// per-level content count multiplying to the retired total, and a
// "twenty-four months from first word to professional mastery" claim
// the rest of the site had already stopped making, on the single most
// read page. A rule enforced on one page is not a rule.
//
// So: any English page that publishes the hours figure must carry the
// design-figure statement with it, wherever that page is.
{
  const pagesDir = path.join(ROOT, 'pages');
  const english = readdirSync(pagesDir)
    .filter((f) => f.endsWith('.html') && !f.endsWith('.ar.html'))
    .map((f) => [f, readFileSync(path.join(pagesDir, f), 'utf8')]);

  const publishHours = english.filter(([, b]) => /1,200\s*(hrs|hours)/i.test(b));
  const unqualified = publishHours.filter(([, b]) => !/design figure, not a measurement/i.test(b));
  check(`Every page publishing the 1,200-hour figure qualifies it — ${publishHours.length} page(s) publish it`,
    unqualified.length === 0, `unqualified: ${unqualified.map(([f]) => f).join(', ')}`);

  // The month claim the College retired. It survived on the home page
  // for exactly as long as nothing looked there.
  const months = english.filter(([, b]) => /twenty-four months|24 months/i.test(b));
  check('No English page claims a number of months from beginner to mastery',
    months.length === 0, months.map(([f]) => f).join(', '));

  // And the promise that mattered most: a certificate on completion,
  // when no award can be conferred at all.
  const promisesCert = english.filter(([, b]) =>
    /certificate the moment|certificate on completion|certificate upon completion/i.test(b));
  check('No English page promises a certificate on completion — none can be conferred',
    promisesCert.length === 0, promisesCert.map(([f]) => f).join(', '));

  // ── A LIVE CLASS AS A STEP THE APPLICANT WILL REACH ──
  //
  // No live session has ever run: the homepage says the seminars are
  // timetabled and not yet delivered, and /learning/platform/ lists
  // them on the roadmap. The admissions page meanwhile ended its
  // five-step journey at "Orientation & first live class", and its
  // masthead promised "from enquiry to your first live class" — the
  // first sentence an applicant reads on the page where they decide.
  //
  // Both were true of the plan and false of the College, and the
  // existing sweeps missed them because they check for months,
  // certificates and hour figures, not for capabilities.
  //
  // The pattern is deliberately narrow: it looks for a live class
  // offered as something the reader will personally get to. Pages are
  // free to DISCUSS live teaching — /admissions/dates/ weighs cohort
  // teaching as a rejected option and must keep being able to.
  const PROMISED_LIVE = /(your|the|first)\s+(first\s+)?live\s+(class|session|lesson)|live\s+(class|session)\s+(awaits|begins)/i;
  const promisesLive = english.filter(([, b]) => PROMISED_LIVE.test(b));
  check('No English page offers a live class as a step the applicant reaches',
    promisesLive.length === 0, promisesLive.map(([f]) => f).join(', '));

  // Same claim, same page, in the language the primary audience reads.
  const AR = readdirSync(pagesDir)
    .filter((f) => f.endsWith('.ar.html'))
    .map((f) => [f, readFileSync(path.join(pagesDir, f), 'utf8')]);
  const arPromisesLive = AR.filter(([, b]) =>
    /حصتك\s+(المباشرة\s+)?الأولى|حصتك\s+الأولى\s+المباشرة/.test(b));
  check('No Arabic page offers a live class as a step the applicant reaches',
    arPromisesLive.length === 0, arPromisesLive.map(([f]) => f).join(', '));

  // A sweep that only ever sees compliant pages proves nothing about
  // its own reach. Confirm each pattern catches its own regression.
  check('...and these sweeps do catch the wording they exist for',
    /twenty-four months|24 months/i.test('twenty-four months from first word')
    && /certificate the moment/i.test('a certificate the moment the final lesson is complete')
    && /1,200\s*hrs/i.test('<td>1,200 hrs</td>')
    && PROMISED_LIVE.test('enquiry to your first live class')
    && PROMISED_LIVE.test('Orientation &amp; first live class')
    // ...and does NOT fire on a page weighing live teaching as an option
    && !PROMISED_LIVE.test('shared pace, live classes where everyone is at the same point'));
}

// ── THINGS THE PLATFORM DOES NOT DO ──
//
// Three capabilities were advertised across five pages and two
// languages, and none of them exists:
//
//   Video. There is no video anywhere in the programme. The publishing
//   register records video support as "not supported by the curriculum"
//   — producing it would be a decision about what the College is, not a
//   gap in what it has written. "HD video lectures" appeared in the
//   methodology list and in the FAQ regardless.
//
//   Attendance. The evidence register records live-session attendance
//   as `not_instrumented`: nothing collects it. The academic framework
//   argues at length that attendance is the WRONG measure for an
//   asynchronous programme. "Attendance tracking" was advertised on the
//   platform page and "Track attendance" on the student portal.
//
//   Live classes as a delivered thing. None has run. The tuition page
//   listed them under what the fee buys, which is the closest thing on
//   this site to a contractual statement.
//
// Each is now stated as designed-and-not-yet-running, or removed. These
// sweeps stop them coming back the next time someone writes marketing
// copy from an older page.
{
  const pagesDir = path.join(ROOT, 'pages');
  const all = readdirSync(pagesDir).filter((f) => f.endsWith('.html'))
    .map((f) => [f, readFileSync(path.join(pagesDir, f), 'utf8')]);

  const video = all.filter(([, b]) => /HD video|video lectures|محاضرات فيديو/i.test(b));
  check('No page advertises video lectures — there is no video in the programme',
    video.length === 0, video.map(([f]) => f).join(', '));

  // "attendance" is allowed where the page explains that it is NOT
  // tracked, which several now do. What is banned is offering it.
  const attendance = all.filter(([, b]) =>
    /attendance tracking|track attendance|تتبّع الحضور|تتبع الحضور/i.test(b));
  check('No page offers attendance tracking — nothing collects it, and it is the wrong measure',
    attendance.length === 0, attendance.map(([f]) => f).join(', '));

  // The fee list is the closest thing here to a contract.
  const tuitionPages = all.filter(([f]) => /^admissions-tuition/.test(f));
  check('The tuition pages exist to be checked', tuitionPages.length >= 1);
  const promisesLive = tuitionPages.filter(([, b]) =>
    /<li>Live classes and recorded lessons<\/li>/.test(b));
  check('The fee list does not promise live classes as a delivered thing',
    promisesLive.length === 0, promisesLive.map(([f]) => f).join(', '));

  check('...and these sweeps do catch the wording they exist for',
    /HD video/i.test('HD video lectures')
    && /track attendance/i.test('Track attendance and see your progress')
    && /تتبّع الحضور/.test('قبول إلكتروني، تسجيل المقررات، تتبّع الحضور'));
}

// Per-lesson pricing tied to undelivered lessons was the most exposed
// claim on the site, and per-item pricing is discount language besides.
const tuition = readFileSync(path.join(ROOT, 'pages/admissions-tuition.html'), 'utf8');
check('Tuition is priced by level and credit, never per lesson',
  !/per\s*(unit|lesson)/i.test(tuition), 'per-item pricing found');

if (backed) {
  check('The published unit count is now fully backed by the curriculum — the disclosure can be retired',
    true, `${items} items >= ${PUBLISHED_UNITS_TOTAL}`);
} else {
  const shortfall = PUBLISHED_UNITS_TOTAL - items;
  console.log(`NOTE  ${items} of ${PUBLISHED_UNITS_TOTAL} learning units authored — ${shortfall} outstanding (${Math.round((items / PUBLISHED_UNITS_TOTAL) * 100)}%).`);

  check('An unbacked figure carries an explicit design-versus-delivered statement',
    /id="curriculum-status"/.test(iefc), 'no #curriculum-status disclosure on the IEFC page');
  check('...that says plainly it is the designed size, not what is published today',
    /designed size of each level, not the amount of content published/i.test(iefc));
  // The caveat's subject must be VISIBLE: a column that actually says
  // Lessons. A consolidation once relabelled this same 120 "Taught
  // Hours" — an inflated delivery claim under the College's own
  // framework (80 GLH per level) — while this file kept passing,
  // because it pinned the sentence and not the label the sentence is
  // about. The figure is a lesson count, and hours it must never be.
  check('...and the 120 is labelled as Lessons in the table itself',
    /<th scope="col">Lessons<\/th>/.test(iefc), 'no Lessons column header');
  check('...never as hours — 120 is the designed lesson count, not delivery',
    !/taught hours/i.test(iefc), '"taught hours" found on the page');
  check('...and does not hide behind vagueness — it names what IS complete',
    /sixty modules/i.test(iefc) && /still being written/i.test(iefc));
  check('The disclosure sits with the table, not on some other page',
    iefc.indexOf('id="curriculum-status"') > iefc.indexOf('<td>120</td>'),
    'disclosure appears before the claim it qualifies');
  check('The institutional status page lists it as outstanding too',
    /still being written/i.test(about) && /curriculum-status/.test(about),
    'about page does not carry it');
}

// ---------------------------------------------------------------------
// The claim must not quietly grow
// ---------------------------------------------------------------------
// A page is free to publish a design figure. It is not free to publish
// a LARGER one than the curriculum framework specifies, because at that
// point the number is not a design any more, it is an invention.
check('The published figure matches the curriculum design, not something larger',
  PUBLISHED_UNITS_PER_LEVEL * levels === PUBLISHED_UNITS_TOTAL,
  `${PUBLISHED_UNITS_PER_LEVEL} x ${levels} != ${PUBLISHED_UNITS_TOTAL}`);

const framework = readFileSync(path.join(ROOT, 'docs/curriculum-framework.md'), 'utf8');
check('...and the design figure is one the framework actually specifies',
  /10\s*,?\s*~?12 learning units|10 thematic modules/i.test(framework)
  || /120/.test(framework),
  'the framework does not state the per-level unit design');

// ---------------------------------------------------------------------
// EVERY LANGUAGE EDITION CARRIES THE SAME CLAIM
// ---------------------------------------------------------------------
// THE BLIND SPOT THIS CLOSES.
//
// Everything above reads pages/academics-iefc.html, pages/about.html and
// pages/admissions-tuition.html — the ENGLISH pages. The Arabic pages
// were scanned by exactly one check, the retired-word scan, whose regex
// is \bunits?\b and therefore matches no Arabic at all.
//
// So while the English site was migrated to AIPC Credits and Total
// Qualification Time, the Arabic site went on publishing the retired
// scheme in full: "سبعمائة وعشرون وحدة تعليمية" in the lede, 120 units
// per level and 720 in total on two pages, the units column in the fee
// table, the same figure in the FAQ and again in its JSON-LD twin — and
// "$26.39 لكل وحدة", per-unit pricing, which the English test above
// explicitly forbids because it ties a price to content that is 41%
// authored.
//
// The suite was green throughout. A guard that reads one language and
// reports on a bilingual site is not a guard, it is a reassurance.
{
  const AR = readdirSync(path.join(ROOT, 'pages'))
    .filter((f) => f.endsWith('.ar.html'))
    .map((f) => [f, readFileSync(path.join(ROOT, 'pages', f), 'utf8')]);
  check(`Arabic editions are checked at all — ${AR.length} pages`, AR.length > 0);

  // The retired figure, in Arabic numerals and in Arabic words.
  const carries720 = AR.filter(([, b]) => /720/.test(b) || /سبعمائة وعشرون/.test(b));
  check('No Arabic page publishes the retired 720 figure', carries720.length === 0,
    carries720.map(([f]) => f).join(', '));

  // The retired noun, as a published measure: "وحدة تعليمية" (learning
  // unit), "إجمالي الوحدات" (total units), "لكل وحدة" (per unit).
  const carriesUnit = AR.filter(([, b]) =>
    /وحدة تعليمية|إجمالي الوحدات|لكل وحدة|وحدة لكل مستوى/.test(b));
  check('No Arabic page publishes a learning-unit count or a per-unit price',
    carriesUnit.length === 0, carriesUnit.map(([f]) => f).join(', '));

  // The Arabic edition carried every claim the English one did, and
  // was checked for none of them. A rule enforced in one language is
  // not a rule either — the Arabic pages had the retired month figure,
  // the unqualified hours figure and the certificate promise, all
  // three, for as long as nothing looked.
  const arMonths = AR.filter(([, b]) => /٢٤ شهر|24 شهر|أربعة وعشرون شهر|أربعة وعشرين شهر/.test(b));
  check('No Arabic page claims a number of months from beginner to mastery',
    arMonths.length === 0, arMonths.map(([f]) => f).join(', '));

  const arHours = AR.filter(([, b]) => /1,200/.test(b));
  const arUnqualified = arHours.filter(([, b]) => !/رقم تصميم/.test(b));
  check(`Every Arabic page publishing the 1,200-hour figure qualifies it — ${arHours.length} publish it`,
    arUnqualified.length === 0, arUnqualified.map(([f]) => f).join(', '));

  const arCert = AR.filter(([, b]) => /شهادة رقمية عند الإتمام|شهادة عند الإتمام/.test(b));
  check('No Arabic page promises a certificate on completion — none can be conferred',
    arCert.length === 0, arCert.map(([f]) => f).join(', '));

  // Structured data is a claim a search engine repeats verbatim, and
  // nobody reads it. It said the course takes 24 months and that its
  // workload is four minutes.
  const allPages = readdirSync(path.join(ROOT, 'pages'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => [f, readFileSync(path.join(ROOT, 'pages', f), 'utf8')]);
  const badSchema = allPages.filter(([, b]) => /"P24M"|"PT4M"/.test(b));
  check('No page publishes a 24-month or four-minute duration in its structured data',
    badSchema.length === 0, badSchema.map(([f]) => f).join(', '));

  // And the corrected scheme has actually arrived, rather than the old
  // one merely having been deleted.
  const arIefc = AR.find(([f]) => f === 'academics.ar.html')[1];
  const arFee = AR.find(([f]) => f === 'admissions-tuition.ar.html')[1];
  check('The Arabic IEFC page carries the credit and hours scheme',
    /رصيد/.test(arIefc) && /الزمن الكلي للمؤهل/.test(arIefc));
  check('...and so does the Arabic tuition page', /رصيد|الأرصدة/.test(arFee));
}

// ---------------------------------------------------------------------
// THE FEE TABLE MUST ADD UP
// ---------------------------------------------------------------------
// Nothing above ever read the table as a table. Its total row said 720
// in a column whose own six rows said 20 — six twenties are 120, not
// 720 — and the row carried four cells where the header declares five,
// so the tuition total was printed under Total Qualification Time and
// the Tuition column had no total at all. On a public pricing page.
//
// A published number that contradicts the numbers directly above it is
// the most damaging kind, because a reader who checks it finds the
// institution cannot add up.
for (const [label, file] of [['English', 'admissions-tuition.html'],
  ['Arabic', 'admissions-tuition.ar.html']]) {
  const body = readFileSync(path.join(ROOT, 'pages', file), 'utf8');
  const table = body.slice(body.indexOf('<table class="ledger"'));
  const rows = [...table.slice(0, table.indexOf('</table>')).matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
    .map((m) => m[1]);
  const widthOf = (tr) => [...tr.matchAll(/<t[hd]([^>]*)>/g)]
    .reduce((a, m) => a + (Number((m[1].match(/colspan="(\d+)"/) || [])[1]) || 1), 0);
  const widths = [...new Set(rows.map(widthOf))];
  check(`The ${label} fee table has one column count throughout`, widths.length === 1,
    `row widths: ${widths.join(', ')}`);

  const nums = (tr) => [...tr.matchAll(/<td[^>]*>(?:<strong>)?([\d,]+)/g)]
    .map((m) => Number(m[1].replace(/,/g, '')));
  const bodyRows = rows.slice(1, -1);
  const totalRow = rows[rows.length - 1];
  const credits = bodyRows.map((r) => nums(r)[0]).filter(Number.isFinite);
  const summed = credits.reduce((a, b) => a + b, 0);
  const printed = nums(totalRow)[0];
  check(`...and the ${label} credit total equals the sum of its rows`, printed === summed,
    `printed ${printed}, rows sum to ${summed}`);
}


// ── THE CHAPTERS THE HOMEPAGE PROMISES ITSELF ────────────────────────
//
// The accreditation pathway shipped to the Arabic edition and silently
// missed the English one. The insert script asserted its anchor existed,
// THEN renumbered the chapter headings — mutating that same anchor away
// — and the replace quietly did nothing while reporting success. Three
// commits later the English page was still running I, II, III, IV, V,
// VI, VII, IX.
//
// Nothing caught it. The route audit checks that a page is not broken,
// and a page with a chapter missing is not broken; it is just missing a
// chapter. The typography audit measures what IS there. Both were green.
//
// Two checks, because they fail on different mistakes. The numerals
// catch a chapter that vanished from anywhere in the sequence, whatever
// it was; the pairing catches an edition that received a section its
// counterpart did not, which is the specific fault that happened here.
{
  const home = readFileSync(path.join(ROOT, 'pages/home.html'), 'utf8');
  const homeAr = readFileSync(path.join(ROOT, 'pages/home.ar.html'), 'utf8');
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  for (const [label, src] of [['English', home], ['Arabic', homeAr]]) {
    const found = [...src.matchAll(/"roman">([IVX]+)</g)].map((m) => m[1]);
    const expected = ROMAN.slice(0, found.length);
    check(`${label} homepage chapters are numbered without a gap — ${found.length} chapters`,
      found.join(',') === expected.join(','),
      `got ${found.join(', ')} — expected ${expected.join(', ')}`);
  }

  // Every chapter-level section id must exist in both editions. The two
  // pages are translations of one document, so a section in one and not
  // the other is a defect in whichever is missing it.
  const ids = (src) => new Set([...src.matchAll(/<section class="chapter[^"]*"[^>]*id="([^"]+)"/g)].map((m) => m[1]));
  const en = ids(home), ar = ids(homeAr);
  const missingAr = [...en].filter((i) => !ar.has(i));
  const missingEn = [...ar].filter((i) => !en.has(i));
  check(`Every homepage chapter exists in both editions — ${en.size} English, ${ar.size} Arabic`,
    missingAr.length === 0 && missingEn.length === 0,
    `missing from Arabic: ${missingAr.join(', ') || 'none'}; missing from English: ${missingEn.join(', ') || 'none'}`);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
