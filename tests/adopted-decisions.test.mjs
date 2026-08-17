// THE REGISTER AND THE SITE MUST AGREE ABOUT WHAT IS DECIDED.
//
// For months the site described a set of rules as "proposed" and
// "awaiting governance approval", and that was accurate. On 14 August
// 2026 all twenty-five outstanding decisions were adopted. From that
// moment, every page still saying "proposed" was wrong — and nothing
// would have caught it, because the pages and the register are separate
// files that happened to agree.
//
// That is the same shape as the sitemap that listed 20 of 76 pages: two
// artefacts that agree by coincidence rather than by construction. So
// this reads the register, and requires the published pages to match it.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const gov = readFileSync(path.join(ROOT, 'docs/governance-decisions.md'), 'utf8');
const ADOPTION_DATE = '14 August 2026';

// ---------------------------------------------------------------------
// 1 · THE REGISTER ITSELF
// ---------------------------------------------------------------------
const awaiting = (gov.match(/\*\*Decision:\*\*\s*☐\s*awaiting/g) || []).length;
const adoptedNow = (gov.match(new RegExp(`ADOPTED ${ADOPTION_DATE}`, 'g')) || []).length;
const adoptedEarly = (gov.match(/\*\(adopted [^)]+\)\*/g) || []).length;

check(`No decision is outstanding — ${awaiting} awaiting`, awaiting === 0);
check(`${adoptedNow} decisions carry the ${ADOPTION_DATE} adoption line`, adoptedNow === 25, adoptedNow);
check(`${adoptedEarly} decisions were adopted earlier`, adoptedEarly >= 5, adoptedEarly);
check('The register names the adopting authority rather than leaving it implied',
  /Adopting authority:\*\*\s*the Executive/i.test(gov));

// The honest limit on an executive adoption, which is the part most
// likely to be quietly dropped later: neither academic body has members,
// so the academic items are adopted subject to ratification. If that
// qualification disappears, the College is claiming senate policy it
// does not have.
check('...and states that the academic items await Senate ratification',
  /ratification by the Academic Senate/i.test(gov));
check('...and states plainly that adoption confers no award',
  /does not confer any award/i.test(gov));

// ---------------------------------------------------------------------
// 2 · NO PUBLISHED PAGE STILL CALLS AN ADOPTED RULE A PROPOSAL
// ---------------------------------------------------------------------
const pagesDir = path.join(ROOT, 'pages');
const pages = readdirSync(pagesDir).filter((f) => f.endsWith('.html'))
  .map((f) => [f, readFileSync(path.join(pagesDir, f), 'utf8')]);
check(`Pages exist to be checked — ${pages.length}`, pages.length > 50);

// The specific wordings the site used while these were outstanding.
// Each is a phrase a reader would take as "this rule is not settled".
const STALE = [
  { re: /awaiting governance approval/i, what: 'awaiting governance approval' },
  { re: /<td>Proposed<\/td>/, what: 'a "Proposed" status cell' },
  { re: /Proposed, not adopted/i, what: '"Proposed, not adopted"' },
  { re: /there is no adopted procedure/i, what: '"there is no adopted procedure"' },
  { re: /decisions nobody has taken/i, what: '"decisions nobody has taken"' },
  { re: /مقترحة<\/td>/, what: 'an Arabic "proposed" status cell' },
  { re: /بانتظار الإقرار من الجهة الحاكمة/, what: 'Arabic "awaiting governance approval"' },
];
for (const s of STALE) {
  const hits = pages.filter(([, b]) => s.re.test(b));
  check(`No page still publishes ${s.what}`, hits.length === 0, hits.map(([f]) => f).join(', '));
}

// ---------------------------------------------------------------------
// 3 · THE DECISIONS PAGE PUBLISHES THE REGISTER'S OWN NUMBERS
// ---------------------------------------------------------------------
// The register moved with the Governance pillar — same content
// contract, new address under /governance/.
const decisionsPage = readFileSync(path.join(ROOT, 'pages/governance-decisions.html'), 'utf8');
const total = adoptedNow + adoptedEarly;
check(`The decisions page publishes the true total — ${total}`,
  decisionsPage.includes(String(total)), 'the page and the register disagree on the count');
check('...and names the date the twenty-five were taken',
  decisionsPage.includes(ADOPTION_DATE));
check('...and does not present executive decisions as academic ones',
  /ratification by the Academic Senate/i.test(decisionsPage));

// The two things adoption did NOT do. These are the sentences a
// confident-sounding page would drop first, and they are the reason
// the adoption is honest rather than a announcement.
check('The decisions page still says no award is conferred',
  /No award is conferred until that appointment/i.test(decisionsPage));
check('...and that the competency mapping is commissioned, not finished',
  /not as a claim the work is finished/i.test(decisionsPage));

// ---------------------------------------------------------------------
// 4 · WHAT ADOPTION MUST NOT HAVE SILENTLY CHANGED
// ---------------------------------------------------------------------
// Adopting a conferral procedure is exactly the moment an institution
// starts describing itself as able to confer. It cannot.
//
// The first version of this check banned the phrase "first graduates"
// and failed on two pages that used it inside a counterfactual — "if
// verification were built after the first graduates, they would hold
// credentials nobody could check" — in a paragraph whose opening
// sentence is "No award has been conferred". The pages were right and
// the check was wrong: a bare phrase match cannot tell a claim from a
// hypothetical.
//
// The reliable form is positive rather than prohibitive. A page may
// discuss graduates freely; what it may not do is discuss them without
// somewhere saying there are none.
// Narrowing it a second time, and the reason is worth recording. The
// bare word "graduate" is doing four innocent jobs on this site: the
// vision statement quoted verbatim says "graduate success"; the
// evidence register has a "Graduate Outcomes" collection; the decisions
// register has "the graduate profile"; and a page may describe what a
// graduate *would* be able to do. None of those claims a graduate
// exists.
//
// What claims one exists is a possessive or a count: "our graduates",
// "the College's graduates", "127 graduates", "graduates have gone on
// to". So the check matches those, and only those.
const CLAIMS_GRADUATES =
  /\b(?:our|the College'?s|AIPC'?s)\s+graduates?\b|\b\d[\d,]*\s+graduates?\b|\bgraduates?\s+(?:have|has)\s+(?:gone|found|secured|been placed)/i;
const NO_GRADUATES = /no award has been conferred|nothing has been conferred|no cohort has been taught|conferred on (?:anyone|no one|nobody)|no graduates?\b|no graduate exists/i;
const claiming = pages.filter(([f, b]) => !f.endsWith('.ar.html') && CLAIMS_GRADUATES.test(b));
const unqualified = claiming.filter(([, b]) => !NO_GRADUATES.test(b));
check(`No page speaks of graduates as existing — ${claiming.length} use a claiming construction`,
  unqualified.length === 0, unqualified.map(([f]) => f).join(', '));
check('...and that check does catch the constructions that would claim one',
  CLAIMS_GRADUATES.test('our graduates work across four continents')
  && CLAIMS_GRADUATES.test('127 graduates since 2024')
  && CLAIMS_GRADUATES.test('graduates have gone on to postgraduate study')
  && !CLAIMS_GRADUATES.test('recognised for excellence and graduate success')
  && !CLAIMS_GRADUATES.test('a graduate outcomes report, before a first graduate'));

const awardsPage = readFileSync(path.join(ROOT, 'pages/students-awards.html'), 'utf8');
check('The awards page still says why nothing has been conferred',
  /No External Examiner is appointed/i.test(awardsPage));
check('...and still says the honours scheme has been applied to nobody',
  /applied to no one|applied to nobody/i.test(awardsPage));

// A sweep that only sees compliant pages proves nothing about its reach.
check('...and these sweeps do catch the wording they exist for',
  STALE[0].re.test('the scheme is awaiting governance approval')
  && STALE[1].re.test('<td>Proposed</td>')
  && /مقترحة<\/td>/.test('<td>مقترحة</td>'));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
