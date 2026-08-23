// EVIDENCE BEFORE CLAIMS, ENFORCED RATHER THAN REMEMBERED.
//
// The College's standing editorial rule is that it never publishes a
// capability, a status or an achievement it does not have. That rule has
// held so far because people kept remembering it. A rule that depends on
// memory holds until the week somebody is in a hurry, and the sentence
// that gets written then is the one a prospective student pays on.
//
// tests/published-claims.test.mjs already measures the NUMBERS on the
// marketing pages against the database. This file is the other half: it
// reads every page the site actually serves and looks for CLAIMS OF
// STANDING — accreditation, recognition, rankings, partnerships, awards,
// graduate outcomes, employer endorsement, testimonials, alumni counts —
// none of which the College possesses.
//
// ────────────────────────────────────────────────────────────────
// HOW IT AVOIDS BEING A NUISANCE
// ────────────────────────────────────────────────────────────────
// A blunt keyword scan would fire on every honest sentence that says
// "the College is not accredited", which is exactly the sentence the
// rule wants written. So each pattern is paired with the DENIALS that
// legitimately surround it, and a match is a finding only when no denial
// appears in the same sentence.
//
// That is a real limitation and worth stating: this catches a claim made
// plainly, not one made by implication across two paragraphs. It is a
// floor, not a ceiling, and it does not replace reading the page.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// --- Every page the site serves ---------------------------------------
const SKIP_DIRS = new Set(['node_modules', '.git', 'stromex', 'pages', 'partials',
  'publication', 'docs', 'tests', 'scripts', 'sql', 'functions', '.github']);

function servedPages(dir = ROOT, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) servedPages(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const pages = servedPages();
check(`Every served page is scanned — ${pages.length}`, pages.length >= 50, pages.length);

/** Visible text only: a claim inside a script or a comment is not published. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

function sentences(text) {
  return text.split(/(?<=[.!?;:])\s+|(?=—\s)/).map((s) => s.trim()).filter(Boolean);
}

// Each rule: the claim to look for, and the words that make a sentence
// carrying it honest rather than false.
// ────────────────────────────────────────────────────────────────
// ATTRIBUTION, NOT KEYWORDS
// ────────────────────────────────────────────────────────────────
// The first version of these rules matched the WORDS. It fired on four
// entirely honest sentences: a list of things the College has yet to
// obtain, a definition of what recognition means, an observation about
// what an accreditation panel looks for, and a statement that CEFR is
// recognised by universities. None of those is a claim about the
// College's standing, and a test that cries wolf is a test somebody
// switches off.
//
// So each rule now requires the claim to be ATTRIBUTED to the College —
// "we are accredited", "our partners", "accredited by" — rather than
// merely mentioned. The denials remain as a second guard for sentences
// that are attributed and then negated ("the College is not
// accredited"), which is the sentence the editorial rule most wants
// written.
//
// This is narrower than a keyword sweep and deliberately so. It catches
// a claim made plainly; it does not catch one made by implication
// across two paragraphs. A floor, not a ceiling.
const US = String.raw`(?:we|our|us|the College|this College|WEC|Worldwide English College)`;
const RULES = [
  {
    name: 'accreditation or regulated status',
    claim: new RegExp(
      // "recognised by" is deliberately NOT bare here. CEFR is described
      // as "the benchmark most widely recognised by universities", which
      // is true and is about CEFR, not about this College. The claim
      // only exists when what is recognised is OURS.
      String.raw`\b(?:accredited|validated|regulated)\s+by\b`
      + String.raw`|\bour\b[^.;:!?]{0,50}\b(?:recognised|accepted|approved)\s+by\b`
      + String.raw`|\bour\s+(?:accreditation|regulator|awarding body)\b`
      + String.raw`|\b${US}\b[^.;:!?]{0,40}\b(?:are|is|has|have|holds?)\b[^.;:!?]{0,30}\b(?:accredited|a degree[- ]awarding|an awarding body|regulated)\b`
      + String.raw`|\b(?:Ofqual|QAA)[- ]?(?:registered|recognised|regulated)\b`, 'i'),
    denial: /\b(not|no|never|without|cannot|does not|is not|are not|nor|neither|seeking|would|until|before|absence|unaccredited|non-accredited|any claim|claims of|honestly|has yet|to be published)\b/i,
  },
  {
    name: 'a ranking or league position',
    claim: new RegExp(
      String.raw`\b(?:ranked|ranking|league table)\b`
      + String.raw`|\b(?:award|prize)[- ]winning\b`
      + String.raw`|\b${US}\b[^.;:!?]{0,40}\b(?:world[- ]class|world[- ]leading|number one|#1|the best)\b`
      + String.raw`|\b(?:world[- ]class|world[- ]leading)\s+(?:college|education|teaching|institution|programme)\b`, 'i'),
    denial: /\b(not|no|never|without|does not|is not|are not|nor|neither|any claim|claims of|makes no)\b/i,
  },
  {
    name: 'a partnership or institutional endorsement',
    claim: /\b(in partnership with|partnered with|our partners|endorsed by|approved by|validated by|in association with|affiliated with)\b/i,
    denial: /\b(not|no|never|without|does not|is not|are not|nor|neither|any claim|claims of|makes no|would|means)\b/i,
  },
  {
    name: 'graduate outcomes or employer evidence',
    claim: /\b(our graduates (work|are employed|went on)|graduate employment rate|employers report|employer[- ]recognised|\d+% of (our )?(graduates|students|learners))\b/i,
    denial: /\b(not|no|never|without|does not|is not|are not|nor|neither|once there are|when there are|until|would)\b/i,
  },
  {
    name: 'student or alumni numbers',
    // A NUMBER is what makes this a claim. "learners worldwide" is scope
    // — who the College is for — and saying it is not the same as saying
    // how many there are. The first version conflated the two and fired
    // on the mission statement.
    claim: /\b(\d[\d,]{2,} (students|learners|alumni|graduates)|(students|learners|alumni|graduates) (across \d+|in \d+ countries|from \d+)|join (thousands|hundreds)|(thousands|hundreds) of (students|learners|alumni|graduates))\b/i,
    denial: /\b(not|no|never|none|without|does not|is not|are not|nor|neither|once|until|would|no one|nobody)\b/i,
  },
  {
    // ────────────────────────────────────────────────────────────
    // WHY THIS RULE EXISTS
    // ────────────────────────────────────────────────────────────
    // The homepage carried, for months, the sentence "Accreditation
    // candidacy is underway; its current stage ... published in full and
    // kept current — see institutional status". No accrediting body had
    // been approached. /about/#status listed accreditation under "In
    // progress — to be published here as confirmed", and the evidence
    // register held no accreditation item at all: the sentence cited as
    // its own evidence a page that contradicted it.
    //
    // The accreditation rule above did not fire, because a PROCESS claim
    // is not a STATUS claim. "We are accredited by X" is caught. "Our
    // candidacy is underway" asserts a formal standing with an awarding
    // or accrediting body just as firmly, and matches none of those
    // patterns. That gap is what this rule closes.
    name: 'progress toward an accreditation that has not been sought',
    claim: new RegExp(
      // "application" is NOT bare here. The admissions pages say
      // "Everything below is what will be submitted" about an
      // APPLICANT's application, which is not a claim about the College
      // at all — the first draft of this rule flagged it twice.
      String.raw`\b(?:accreditation|candidacy|candidate status)\b[^.;:!?]{0,60}\b(?:is |are )?(?:underway|in progress|submitted|lodged|pending|advancing|proceeding)\b`
      + String.raw`|\bapplication\s+for\s+accreditation\b[^.;:!?]{0,60}\b(?:underway|in progress|submitted|lodged|pending)\b`
      + String.raw`|\b(?:candidacy|candidate status)\s+(?:for|with)\b`
      + String.raw`|\b(?:seeking|applying for|pursuing|in preparation for)\s+accreditation\b`
      + String.raw`|\bour\s+(?:accreditation\s+)?(?:candidacy|application)\b`, 'i'),
    denial: /\b(not|no|never|none|without|cannot|does not|is not|are not|has not|have not|nor|neither|would|until|before|not begun|not yet|no accrediting body|any claim|claims of)\b|previously said|previously claimed|previously stated|used to say|no longer says|neither was true|was not true|is corrected/i,
  },
  {
    // The same sentence also said the College "operates under UK law
    // with professional counsel retained". No solicitor is engaged;
    // docs/master-roadmap.md costs that engagement as a future 2–4 hour
    // scoping call. A retained adviser is a professional relationship
    // somebody can be asked to name, and asserting one that does not
    // exist is the same class of fabrication as an invented
    // accreditation — it is simply cheaper to write.
    name: 'a professional adviser the College does not retain',
    claim: new RegExp(
      String.raw`\b(?:counsel|solicitors?|barristers?|auditors?|accountants?|insurers?|advisers?|advisors?)\s+(?:(?:is|are|was|were|has been|have been|being)\s+)?(?:retained|engaged|appointed|instructed)\b`
      + String.raw`|\b(?:retained|engaged|instructed)\s+(?:legal |professional |external )?(?:counsel|solicitors?|auditors?|advisers?|advisors?)\b`
      + String.raw`|\bour\s+(?:solicitors?|auditors?|accountants?|insurers?|legal (?:team|counsel|advisers?))\b`
      + String.raw`|\b(?:audited|insured|advised)\s+by\b`, 'i'),
    denial: /\b(not|no|never|none|without|cannot|does not|is not|are not|has not|have not|nor|neither|would|until|before|needs|requires|should|any claim|claims of)\b|previously said|previously claimed|previously stated|used to say|no longer says|neither was true|was not true|is corrected/i,
  },
  {
    name: 'a testimonial presented as a real person',
    claim: /\b(said [A-Z][a-z]+ [A-Z][a-z]+|["\u201C][^"\u201D]{40,}["\u201D][,]? (said|says) [A-Z])\b/,
    denial: /\b(illustrative|example|sample|hypothetical|not a real|would read)\b/i,
  },
];

// A page whose SUBJECT is the absence of these things — the evidence
// centre, the governance register — discusses them at length and
// honestly. Named explicitly rather than pattern-matched, so adding one
// is a decision somebody takes.
const SUBJECT_PAGES = new Set(['evidence', 'governance', 'standards']);

const findings = [];
for (const file of pages) {
  const rel = path.relative(ROOT, file);
  const section = rel.split(path.sep)[0].replace(/\.html$/, '');
  const text = visibleText(readFileSync(file, 'utf8'));
  for (const s of sentences(text)) {
    for (const rule of RULES) {
      if (!rule.claim.test(s)) continue;
      if (rule.denial.test(s)) continue;
      findings.push({ rel, section, rule: rule.name, sentence: s.slice(0, 160) });
    }
  }
}

// Reported grouped, because one bad phrase in a shared partial appears
// on sixty pages and a flat list would bury everything else.
const byRule = {};
for (const f of findings) (byRule[f.rule] ||= []).push(f);

for (const rule of RULES) {
  const hits = (byRule[rule.name] || []).filter((f) => !SUBJECT_PAGES.has(f.section));
  const where = [...new Set(hits.map((f) => f.rel))];
  check(`No page claims ${rule.name}`, hits.length === 0,
    hits.length ? `${hits.length} in ${where.length} page(s): ${where.slice(0, 3).join(', ')} — e.g. "${hits[0].sentence}"` : undefined);
}

// --- The capabilities built this week, and what the site may say ------
// Each of these EXISTS as a system and has produced NO data, which is a
// distinction the site must not blur. A page saying the College monitors
// attendance is true. A page saying learners attend is not.
const all = pages.map((f) => ({ rel: path.relative(ROOT, f), text: visibleText(readFileSync(f, 'utf8')) }));
const claimsSomewhere = (re) => all.filter((p) => re.test(p.text)).map((p) => p.rel);

const conferred = claimsSomewhere(/\b(our graduates|graduates of the College|have been awarded|qualification(s)? conferred|first cohort graduated)\b/i)
  .filter((rel) => !SUBJECT_PAGES.has(rel.split(path.sep)[0].replace(/\.html$/, '')));
check('No page speaks of graduates the College does not have', conferred.length === 0, conferred.join(', '));

const examiner = claimsSomewhere(/\bExternal Examiner\b/);
const examinerFalse = examiner.filter((rel) => {
  const p = all.find((x) => x.rel === rel);
  // Matched on MEANING rather than an enumeration of phrasings: the
  // first version of this listed six sentences somebody had written and
  // flagged the governance register, which says the same thing in a
  // seventh ("No award is conferred until that appointment is made").
  return !/(not (yet )?appointed|no External Examiner|(will not|does not|before .{0,30}) confer|until that appointment|once (that appointment is made|appointed)|must be appointed|no award is conferred)/i.test(p.text);
});
check('Wherever the External Examiner is mentioned, the page says none is appointed',
  examinerFalse.length === 0, examinerFalse.join(', '));

// --- Accreditation: the site may not be ahead of the record ----------
// The rules above catch a claim made in a sentence. This catches the
// same claim made in a table cell, which is where it hid: the homepage's
// pathway ledger marked ASIC, Accreditation UK, BAC, ISO 21001,
// awarding-organisation partnership and university partnerships all as
// "In preparation" while nothing had been prepared for any of them.
//
// It is driven by the record rather than by a word list, so it relaxes
// on its own the day a real accreditation file exists: if the evidence
// register gains an item for accreditation, this check stops applying
// and the site becomes free to describe what that item shows.
{
  const { DatabaseSync } = await import('node:sqlite');
  const adb = new DatabaseSync(':memory:');
  adb.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  adb.exec(readFileSync(path.join(ROOT, 'sql/seed-evidence-centre.sql'), 'utf8'));
  const accreditationEvidence = adb.prepare(
    `SELECT COUNT(*) n FROM evidence_items
       WHERE collection LIKE '%Accredit%' OR title LIKE '%accredit%'`).get().n;
  adb.close();

  check('the evidence register is readable for this check', true);

  if (accreditationEvidence > 0) {
    console.log(`SKIP the accreditation-position check — ${accreditationEvidence} evidence `
      + 'item(s) now exist, so the site may describe them');
  } else {
    // Words that assert motion toward accreditation. "Not begun",
    // "under long-term consideration" and the absence of a position are
    // all fine: they claim nothing.
    const MOTION = /\b(in preparation|underway|under way|in progress|submitted|lodged|pending|awaiting (?:a )?(?:decision|assessment|visit)|candidacy|candidate status|shortlisted|provisional(?:ly)? accredited)\b/i;
    const SCHEMES = /\b(ASIC|BAC|British Accreditation Council|Accreditation UK|ISO ?21001|Ofqual|QAA|British Council)\b/;
    const ahead = [];
    for (const p of all) {
      if (SUBJECT_PAGES.has(p.rel.split(path.sep)[0].replace(/\.html$/, ''))) continue;
      for (const s2 of sentences(p.text)) {
        if (!SCHEMES.test(s2) || !MOTION.test(s2)) continue;
        if (/\b(not|no|never|none|has not|have not|nor|neither|until|before|would|previously|used to)\b/i.test(s2)) continue;
        ahead.push(`${p.rel}: "${s2.slice(0, 130)}"`);
      }
    }
    check('No page claims motion toward an accreditation scheme while the record holds nothing',
      ahead.length === 0, `\n  ${ahead.join('\n  ')}`);

    // Positive control. If visibleText() or sentences() broke, the check
    // above would report zero and read as a clean site. The schemes ARE
    // named on the homepage's pathway ledger; if they are not found at
    // all, the scanner is broken, not the site.
    const namesSchemes = all.filter((p) => SCHEMES.test(p.text)).length;
    check('...and the scanner can see the pathway ledger at all', namesSchemes >= 2,
      `${namesSchemes} page(s) name an accreditation scheme`);
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
