// AN ADOPTED DECISION THAT NOBODY IMPLEMENTED IS WORSE THAN AN
// UNADOPTED ONE.
//
// Governance D1 — delete a learner's voice recording after 730 days —
// was adopted on 14 August 2026 and was still not in force on 22
// August. `recording_retention_days` remained 'null', which the
// software reads as "keep indefinitely, purge nothing", and the comment
// beside it said the decision "has NOT been made".
//
// So the record contradicted itself, and the side that was wrong was
// the side the software actually obeys. The College's live position was
// indefinite retention of voice data while its governance register said
// two years. If a regulator had asked, the register would have been the
// document handed over, and the database would have been the truth.
//
// Nobody was affected because nobody has recorded anything. That is
// luck, not design.
//
// THE FAILURE WAS NOT THAT SOMEBODY FORGOT. It was that forgetting was
// invisible: the decisions register and the schema are separate files
// that happened to agree until they did not, which is the same shape as
// the sitemap that listed 20 of 76 pages and the deploy that named a
// database nobody had.
//
// So this reads the register and requires the schema to match it. A
// decision marked adopted, carrying an "In force:" line, must be in
// force — and a decision that names no consequence is reported rather
// than silently skipped, because "no line" and "no consequence" are
// different statements.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const gov = readFileSync(path.join(ROOT, 'docs/governance-decisions.md'), 'utf8');
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));

// Split the register into decisions, so an "In force:" line is read
// against the decision it belongs to rather than the nearest one.
const sections = gov.split(/\n(?=### )/).filter((s) => /^### /.test(s));
check(`The decisions register parses into decisions — ${sections.length}`, sections.length >= 25, sections.length);

const adopted = sections.filter((s) => /\*\*Decision:\*\*\s*☑/.test(s));
check(`Adopted decisions are found — ${adopted.length}`, adopted.length >= 25, adopted.length);

// --- Every declared consequence is actually in force -------------------
const claims = [];
for (const s of adopted) {
  const title = (/^### (.+)$/m.exec(s) || [])[1] || '(untitled)';
  for (const m of s.matchAll(/\*\*In force:\*\*\s*`([a-z_]+)\s*=\s*([^`]+)`/g)) {
    claims.push({ title, key: m[1], value: m[2].trim() });
  }
}
check(`Adopted decisions declare their consequences — ${claims.length} declared`,
  claims.length >= 1, claims.map((c) => c.key).join(', '));

const wrong = [];
for (const c of claims) {
  const row = db.prepare('SELECT value FROM platform_config WHERE key = ?').get(c.key);
  if (!row) { wrong.push(`${c.key}: not in platform_config at all`); continue; }
  if (String(row.value) !== c.value) {
    wrong.push(`${c.key}: register says ${c.value}, schema says ${row.value}`);
  }
}
check('Every adopted decision that names a setting is in force in the schema',
  wrong.length === 0, wrong.join(' | '));

// --- The specific one that was wrong, asserted by name -----------------
// Named as well as covered by the rule above, because this is the
// decision that was adopted and unimplemented and it should be
// impossible to lose it again by rewording a heading.
{
  const d1 = sections.find((s) => /^### D1\./.test(s));
  check('D1 — voice recording retention — is in the register', !!d1);
  check('...and is adopted', d1 && /\*\*Decision:\*\*\s*☑/.test(d1));
  check('...and declares what being in force means', d1 && /\*\*In force:\*\*/.test(d1));
  const live = db.prepare("SELECT value FROM platform_config WHERE key = 'recording_retention_days'").get();
  check('...and the software will actually delete after 730 days',
    live && live.value === '730', live && live.value);
  check('...rather than keeping voice data indefinitely',
    live && live.value !== 'null' && live.value !== null, live && live.value);
}

// --- And the record no longer contradicts itself -----------------------
{
  const schema = readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
  const near = schema.slice(Math.max(0, schema.indexOf("('recording_retention_days'") - 200),
    schema.indexOf("('recording_retention_days'") + 1400);
  check('The schema no longer says the retention decision was never taken',
    !/has NOT been made/.test(near), near.slice(0, 120));
  check('...and names the decision it is implementing',
    /D1/.test(near) && /14 August 2026/.test(near));
}

// --- Decisions that name no consequence are reported, not hidden -------
// Most adopted decisions are procedural and have no single setting
// behind them. That is fine and must stay visible: an empty list here
// would otherwise look identical to a register nobody had checked.
{
  const withNoLine = adopted.filter((s) => !/\*\*In force:\*\*/.test(s)).length;
  check(`${withNoLine} adopted decisions declare no single setting, and ${claims.length} do`,
    withNoLine + claims.length >= adopted.length,
    `${withNoLine} + ${claims.length} vs ${adopted.length}`);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
