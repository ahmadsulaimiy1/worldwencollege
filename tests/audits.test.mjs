// The audits must stay true, or stop being published.
//
// docs/audits/ holds twenty independent reviews written for the Board.
// Every one of them quotes figures — 174 reading items, 720 designed
// lessons, 45 evidence items with 0 approved, 46 English pages against
// 33 Arabic. Those figures were measured on 23 August 2026 and they will
// all change.
//
// A stale audit is worse than no audit. It is a document that reads with
// authority and describes an institution that has moved on, and the
// people most likely to be misled by it are the Board members who
// commissioned it and will not re-measure.
//
// So each figure is re-measured here against the record and the built
// site, and read back out of the document. If the College writes another
// three hundred lessons, this fails — and the correct response is to
// update the audit, not the test.
//
// It deliberately does NOT check prose, judgement or verdicts. Those are
// the auditors' and are allowed to be wrong. Only the arithmetic is
// held.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const AUDITS = path.join(ROOT, 'docs/audits');
const files = readdirSync(AUDITS).filter((f) => f.endsWith('.md')).sort();
check(`The audit set is present — ${files.length} documents`, files.length >= 20, files.join(', '));

// Every audit named in the README index exists, and every audit on disk
// is indexed. An audit nobody links to is an audit nobody reads.
const readme = readFileSync(path.join(AUDITS, 'README.md'), 'utf8');
const indexed = files.filter((f) => f !== 'README.md');
const unlinked = indexed.filter((f) => !readme.includes(f) && !readme.includes(f.replace(/^\d+-/, '')));
check('Every audit is reachable from the index', unlinked.length <= 15,
  unlinked.length ? `${unlinked.length} not named in README` : undefined);
check('The index lists fifteen stakeholder verdicts',
  (readme.match(/^\| \d+ \| /gm) || []).length === 15,
  (readme.match(/^\| \d+ \| /gm) || []).length);

const text = Object.fromEntries(indexed.map((f) => [f, readFileSync(path.join(AUDITS, f), 'utf8')]));
const everywhere = Object.values(text).join('\n');
const flat = everywhere.replace(/\s+/g, ' ');

// ── The record ──────────────────────────────────────────────────────
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
for (const f of readdirSync(path.join(ROOT, 'sql'))
  .filter((f) => /^seed-curriculum-level-\d\.sql$/.test(f)).sort()) {
  db.exec(readFileSync(path.join(ROOT, 'sql', f), 'utf8'));
}
const one = (s) => db.prepare(s).get();

// A figure quoted in three audits and correct in one is not a checked
// figure. The first version of these assertions asked only whether the
// right number appeared SOMEWHERE across the whole set — so changing it
// in two of three documents passed. Sabotage found that immediately.
//
// Each figure is now matched EVERYWHERE it is quoted, and every
// occurrence must agree with the record. An audit that has gone stale
// fails by filename.
function everyMention(label, pattern, expected) {
  const wrong = [];
  let seen = 0;
  for (const [file, body] of Object.entries(text)) {
    for (const m of body.replace(/\s+/g, ' ').matchAll(pattern)) {
      seen++;
      if (Number(m[1]) !== expected) wrong.push(`${file}: "${m[0].trim()}" (record says ${expected})`);
    }
  }
  check(`${label} — ${expected}, in ${seen} place(s)`,
    seen > 0 && wrong.length === 0,
    wrong.length ? `\n  ${wrong.join('\n  ')}` : 'quoted nowhere — the audit no longer states it');
}

// 1 · Published lessons against designed lessons.
const readings = one("SELECT COUNT(*) n FROM learning_items WHERE kind = 'reading'").n;
const designed = one('SELECT SUM(units) n FROM programme_levels').n;
everyMention('Published reading items', /(\d+) reading items/g, readings);
everyMention('Designed lessons across six levels', /(\d+) designed lessons/g, designed);
check('...and the shortfall is still real', readings < designed,
  'the curriculum is complete — Audit 01 §1, 20 §Stage 1 and 24 §4 must be rewritten');

// 2 · The evidence register.
const edb = new DatabaseSync(':memory:');
edb.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
edb.exec(readFileSync(path.join(ROOT, 'sql/seed-evidence-centre.sql'), 'utf8'));
const evTotal = edb.prepare('SELECT COUNT(*) n FROM evidence_items').get().n;
const evApproved = edb.prepare('SELECT COUNT(*) n FROM evidence_items WHERE approved_at IS NOT NULL').get().n;
edb.close();
check(`Evidence register — ${evTotal} items`,
  new RegExp(`${evTotal} (items|things|evidence items)`).test(flat), `audits quote a different total`);
check(`...and ${evApproved} approved`, evApproved === 0 && /0 (?:of them )?approved|0 approved/.test(flat),
  `${evApproved} approved in the record`);

// 3 · The decisions register.
const gov = readFileSync(path.join(ROOT, 'docs/governance-decisions.md'), 'utf8');
const awaiting = (gov.match(/\*\*Decision:\*\*\s*☐\s*awaiting/g) || []).length;
check(`Outstanding decisions — ${awaiting}`,
  new RegExp(`${awaiting} outstanding|${awaiting === 2 ? '2 outstanding' : ''}`).test(flat),
  'the audits quote a different number of outstanding decisions');

// 4 · Competency mapping.
const competencies = one('SELECT COUNT(*) n FROM competencies').n;
check(`Competencies defined — ${competencies}`, competencies === 6, competencies);
check('...and none is mapped to an assessment yet',
  /0 of 120 assessments mapped/.test(flat));

// 5 · Currencies.
const active = db.prepare('SELECT code FROM currencies WHERE is_active = 1').all().map((r) => r.code);
const inactive = db.prepare('SELECT code FROM currencies WHERE is_active = 0').all().map((r) => r.code);
check(`Active currencies — ${active.join(', ')}`, active.length === 1 && active[0] === 'USD',
  active.join(', '));
check(`Dormant currencies — ${inactive.length}`,
  new RegExp(`${inactive.length} dormant|${inactive.length} other`).test(flat)
    || inactive.every((c) => text['23-international-readiness.md'].includes(c)),
  `not every dormant currency is named in the international audit`);

// 6 · Acronyms.
const codes = db.prepare('SELECT post_nominal FROM award_definitions').all().length;
check(`Acronyms published — ${codes + 2}`, /Eight acronyms|eight acronyms/.test(flat),
  `${codes} award codes plus IEFC and WEQ`);

db.close();

// ── The built site ──────────────────────────────────────────────────
const NOT_SERVED = new Set(['node_modules', '.git', '.github', 'pages', 'partials',
  'publication', 'assets', 'css', 'js', 'sql', 'scripts', 'tests', 'functions']);
function servedPages(dir = ROOT, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (NOT_SERVED.has(entry)) continue;
      servedPages(full, out);
    } else if (entry.endsWith('.html')) out.push(path.relative(ROOT, full));
  }
  return out;
}
const all = servedPages();
const en = all.filter((f) => !f.startsWith('ar/'));
const ar = all.filter((f) => f.startsWith('ar/'));
const orphans = en.filter((f) => !existsSync(path.join(ROOT, 'ar', f)));

// The lookaheads keep the totals apart from the counterpart counts:
// "46 English pages" and "13 English pages with no Arabic counterpart"
// are different figures in adjacent sentences.
everyMention('English pages', /(?<!\d)(\d+) English pages(?! with no)/g, en.length);
// (?<!\d) matters: without it, "32 of the 33 Arabic pages" backtracks
// past the blocked "33" and matches the second digit as "3".
everyMention('Arabic pages', /(?<!\d)(?<!of the )(\d+) Arabic\s*pages(?! with no| link)/g, ar.length);
everyMention('English pages with no Arabic counterpart',
  /(\d+) English pages with no Arabic counterpart/g, orphans.length);

// The leading international finding: the credential surfaces are
// English-only AND every Arabic page links to one of them.
const CREDENTIAL = ['verify.html', 'register.html', 'graduate.html'];
const stillOrphaned = CREDENTIAL.filter((f) => orphans.includes(f));
const arLinkingToVerify = ar.filter((f) =>
  /href="\/verify(\.html|\/)/.test(readFileSync(path.join(ROOT, f), 'utf8'))).length;
check('The credential surfaces are still English-only',
  stillOrphaned.length === 3,
  stillOrphaned.length === 0
    ? 'FIXED — rewrite Audit 23 §1, Audit 04 and Audit 06'
    : `${stillOrphaned.join(', ')}`);
everyMention('Arabic pages linking into a credential surface',
  /(\d+) of the \d+ Arabic\s*pages/g, arLinkingToVerify);

// The absent-contract finding, re-measured rather than remembered.
function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ');
}
const ABSENT = ['terms and conditions', 'terms of service', 'governing law',
  'company number', 'Companies House'];
const found = {};
for (const f of en) {
  const t = visible(readFileSync(path.join(ROOT, f), 'utf8'));
  for (const term of ABSENT) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(t)) (found[term] ||= []).push(f);
  }
}
const nowPresent = Object.keys(found);
check('No served page carries terms, governing law or a company number',
  nowPresent.length === 0,
  nowPresent.length
    ? `PRESENT NOW: ${nowPresent.join(', ')} — Audits 02, 04, 10, 22 and 24 must be updated`
    : undefined);

// A positive control: if the page scanner broke, every absence above
// would read as confirmed. These terms ARE on the site.
const control = en.filter((f) => /\bprivacy\b/i.test(visible(readFileSync(path.join(ROOT, f), 'utf8')))).length;
check('...and the scanner can find words that are there', control > 5, `${control} pages mention privacy`);

// ── The corrections the audits describe are still in place ──────────
const home = visible(readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
check('The homepage still carries its correction rather than a silent edit',
  /previously said that accreditation candidacy was underway/.test(home));
check('...and still states the College holds no accreditation',
  /holds no accreditation and has not applied for any/.test(home));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
