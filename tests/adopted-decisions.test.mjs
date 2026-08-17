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

// DECISIONS ADOPTED AFTER THE FOUNDING BATCH.
//
// Counted by pattern rather than by a second hard-coded date, because
// the first version of this file knew about exactly one adoption date
// and therefore computed a total that could only ever be right until the
// College decided something else. It stopped being right the day the
// refund policy and the appeals procedure were adopted: the register
// held 32 decisions, this test still computed 30, and it failed the PAGE
// for publishing the true number. A guardrail that has to be edited
// every time the institution acts is a guardrail pointed the wrong way.
//
// The set difference is deliberate — an entry adopted on the founding
// date is already counted above, and must not be counted twice.
const ALL_ADOPTIONS = gov.match(/ADOPTED \d{1,2} [A-Z][a-z]+ \d{4}/g) || [];
const adoptedLater = ALL_ADOPTIONS.filter((m) => !m.includes(ADOPTION_DATE)).length;

check(`No decision is outstanding — ${awaiting} awaiting`, awaiting === 0);
check(`${adoptedNow} decisions carry the ${ADOPTION_DATE} adoption line`, adoptedNow === 25, adoptedNow);
check(`${adoptedEarly} decisions were adopted earlier`, adoptedEarly >= 5, adoptedEarly);
check(`${adoptedLater} decision(s) were adopted after the founding batch`,
  adoptedLater >= 0, adoptedLater);
// Every later adoption must name its own authority in the same breath,
// which is the property that stops a decision acquiring force by having
// been typed into a document.
for (const stamp of ALL_ADOPTIONS.filter((m) => !m.includes(ADOPTION_DATE))) {
  const i = gov.indexOf(stamp);
  check(`"${stamp}" names the adopting authority`,
    /\((?:Executive|Senate|Board|BASCE)\)/.test(gov.slice(i, i + 120)),
    gov.slice(i, i + 60));
}
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
const total = adoptedNow + adoptedEarly + adoptedLater;
check(`The decisions page publishes the true total — ${total}`,
  decisionsPage.includes(String(total)), 'the page and the register disagree on the count');
check('...and names the date the twenty-five were taken',
  decisionsPage.includes(ADOPTION_DATE));
check('...and does not present executive decisions as academic ones',
  /ratification by the Academic Senate/i.test(decisionsPage));

// The two things adoption did NOT do. These are the sentences a
// confident-sounding page would drop first, and they are the reason
// the adoption is honest rather than a announcement.
//
// This assertion used to demand the words "No award is conferred until
// that appointment is made", and that sentence has since become false:
// the College taught from 2023 and has conferred awards at Level I and
// Level II. What adoption did NOT do is unchanged, so the check follows
// the surviving claim rather than the retired wording — no award is
// EXTERNALLY MODERATED until the Examiner is appointed, and the page
// must keep saying it in a form that admits the awards already made.
check('The decisions page still says no award is externally moderated',
  /no award is moderated externally until that appointment is made/i.test(decisionsPage));
check('...and does not let the appointment gap imply nothing was conferred',
  /awards this College has conferred were moderated by the College/i.test(decisionsPage));
check('...and that the competency mapping is commissioned, not finished',
  /not as a claim the work is finished/i.test(decisionsPage));

// ---------------------------------------------------------------------
// 3b · EVERY PAGE THAT PUBLISHES THE COUNT, NOT JUST THE REGISTER PAGE
// ---------------------------------------------------------------------
// Check 3 above read one page, and the count promptly drifted on three
// other surfaces: the Governance masthead said "30, all dated", its
// article state said "In force · 30 decisions", its colophon said 30 —
// while the same page's own prose said 32, and the Arabic edition said
// ٣٠ in two places and ٣٢ in a third. A figure that disagrees with
// itself on one page is worse than a figure nobody publishes, and it
// went unnoticed because the guard was pointed at a single file.
//
// So: every page in either language that states a number of decisions
// must state the register's number.
{
  const pagesDir = path.join(ROOT, 'pages');
  const files = readdirSync(pagesDir).filter((f) => f.endsWith('.html'));
  const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  const latin = (n) => n.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));

  // Both languages, and both the bare "N, all dated" of a masthead fact
  // and the "N decisions" of running prose.
  const PATTERNS = [
    /(\d+),\s*all dated/gi,
    /\b(\d+)\s+(?:governance\s+)?decisions\b/gi,
    /([٠-٩]+)،\s*كلها مؤرَّخة/g,
    /([٠-٩]+)\s+قرار(?:ًا)?\b/g,
  ];

  const wrong = [];
  for (const f of files) {
    const body = readFileSync(path.join(pagesDir, f), 'utf8');
    for (const re of PATTERNS) {
      for (const m of body.matchAll(re)) {
        const n = Number(latin(m[1]));
        // Small numbers are counting something else — "3 decisions of
        // the Board this cycle" — so only a figure in the register's
        // own range is read as a claim about the register. Two figures
        // are legitimate: the total in force, and the size of the
        // founding batch, which the decisions page states in its own
        // heading. Anything else is drift.
        if (n >= 20 && n !== total && n !== adoptedNow) wrong.push(`${f}: "${m[0].trim()}"`);
      }
    }
  }
  check(`Every page publishing a decisions count publishes ${total}`,
    wrong.length === 0, wrong.join('; '));

  // The spelled-out form the Arabic edition used, which no numeral
  // pattern can see. It is banned rather than parsed: a word does not
  // update when the register does.
  const spelled = files.filter((f) =>
    /القرارات الحاكمة ال(?:ثلاثون|ثلاثين|اثنان|اثنين)/.test(readFileSync(path.join(pagesDir, f), 'utf8')));
  check('No Arabic page spells the decisions total as a word',
    spelled.length === 0, spelled.join(', '));

  check('...and this sweep catches the drift it exists for',
    /(\d+),\s*all dated/i.test('<dd>30, all dated</dd>')
    && /([٠-٩]+)،\s*كلها مؤرَّخة/.test('<dd>٣٠، كلها مؤرَّخة</dd>')
    && latin('٣٠') === '30'
    // 30 is drift; 25 and 32 are the two figures a page may state.
    && 30 !== total && 30 !== adoptedNow && adoptedNow === 25);
}

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
//
// ── THE INVERSION, AND WHY IT IS NOT A RELAXATION ────────────────────
//
// This check used to require that every page claiming a graduate also
// said there were none. That was correct while the College had none.
// It has taught three cohorts since 2023 and conferred awards at
// Level I and Level II, so a check demanding the denial is now a check
// demanding a false sentence, and deleting it outright would leave the
// site free to say anything about its graduates at all.
//
// So the obligation is moved rather than dropped, onto the one fact
// about those awards that a prospective student is paying for and
// cannot discover for themselves: NOBODY OUTSIDE THE COLLEGE CHECKED
// THE STANDARD. A page may say it has graduates. It may not say so
// while leaving the reader to assume the award was externally examined.
const CLAIMS_GRADUATES =
  /\b(?:our|the College'?s|WEC-LC'?s)\s+graduates?\b|\b\d[\d,]*\s+graduates?\b|\bgraduates?\s+(?:have|has)\s+(?:gone|found|secured|been placed)/i;
const MODERATION_DISCLOSED =
  /internally moderated|moderated (?:inside|internally|by the College)|no External Examiner is appointed|College'?s own (?:academic )?authority|second-marked internally/i;
const claiming = pages.filter(([f, b]) => !f.endsWith('.ar.html') && CLAIMS_GRADUATES.test(b));
const unqualified = claiming.filter(([, b]) => !MODERATION_DISCLOSED.test(b));
check(`No page speaks of graduates without saying nobody outside checked — ${claiming.length} use a claiming construction`,
  unqualified.length === 0, unqualified.map(([f]) => f).join(', '));
check('...and that check does catch the constructions that would claim one',
  CLAIMS_GRADUATES.test('our graduates work across four continents')
  && CLAIMS_GRADUATES.test('127 graduates since 2024')
  && CLAIMS_GRADUATES.test('graduates have gone on to postgraduate study')
  && !CLAIMS_GRADUATES.test('recognised for excellence and graduate success')
  && !CLAIMS_GRADUATES.test('a graduate outcomes report, before a first graduate'));

// ── NO FIGURE REACHES THE SITE BY BEING TYPED CONFIDENTLY ────────────
//
// data/standing.json is the only source of a cohort or award count, and
// every count in it is currently null — the College holds the records
// and has not released the figures for publication. A numeral standing
// next to one of those nouns in a page SOURCE therefore did not come
// from the record; it came from somebody's estimate, and an estimate
// published as a figure by a fee-charging provider is the single claim
// on this site that could cost the College something real.
//
// The sweep reads pages/, not the built output, precisely so that
// {{N:…}} tokens — which resolve to a figure only when the record
// carries one — are invisible to it and hand-typed numbers are not.
const standing = JSON.parse(
  readFileSync(path.join(ROOT, 'data/standing.json'), 'utf8'));
const releasedCounts = Object.entries(standing.counts)
  .filter(([k, v]) => k !== 'released' && v != null).map(([, v]) => String(v));
const FIGURE_NOUN =
  /(?<!\{\{N:[a-z_]{0,32}\}\})\b(\d[\d,]*)\s+(?:students?|learners?|graduates?|awards?|enrolments?|certificates?)\b/gi;
const invented = [];
for (const [f, b] of pages) {
  for (const m of b.matchAll(FIGURE_NOUN)) {
    if (!releasedCounts.includes(m[1].replace(/,/g, ''))) invented.push(`${f}: "${m[0]}"`);
  }
}
check(`No page publishes a student, graduate or award count the record has not released — ${releasedCounts.length} released`,
  invented.length === 0, invented.join(' · '));
// A fresh regex: FIGURE_NOUN is global, and .test() on a global regex
// carries lastIndex from one call to the next. Reusing it here made the
// self-check pass or fail depending on what matchAll left behind.
check('...and that sweep does catch a figure typed into a paragraph',
  new RegExp(FIGURE_NOUN.source, 'i').test('and 214 students completed Level I that year'));

const awardsPage = readFileSync(path.join(ROOT, 'pages/students-awards.html'), 'utf8');
check('The awards page still says nobody outside the College examined the awards',
  /No External Examiner is appointed/i.test(awardsPage));

// A sweep that only sees compliant pages proves nothing about its reach.
check('...and these sweeps do catch the wording they exist for',
  STALE[0].re.test('the scheme is awaiting governance approval')
  && STALE[1].re.test('<td>Proposed</td>')
  && /مقترحة<\/td>/.test('<td>مقترحة</td>'));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
