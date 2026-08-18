// Award definitions — the authoritative text, and the guarantee that it
// stays authoritative.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   Every definition in the database still appears, verbatim, in the
//   document it was transcribed from.
//
// The point of promoting this text out of documentation was so that a
// certificate, a graduate profile, a verification page, a transcript and
// the institutional API all say the SAME thing about what an award
// means. That guarantee lasts exactly as long as the two agree, and
// nothing but a test keeps them agreeing: somebody edits the award
// architecture and the database still serves last year's wording, or
// somebody edits the database and the document that governs it no longer
// describes what the College publishes.
//
// This fails in both directions.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const arch = readFileSync(`${ROOT}/docs/iefc-award-architecture.md`, 'utf8');
const framework = readFileSync(`${ROOT}/docs/curriculum-framework.md`, 'utf8');

// Both documents use markdown emphasis and hard-wrap their prose; the
// database holds neither. Normalising both sides is what makes this a
// comparison of MEANING rather than of formatting.
const flatten = (s) => s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
const flatArch = flatten(arch);
const flatFramework = flatten(framework);

const env = { DB: makeD1(schema) };
const { results: defs } = await env.DB.prepare(
  `SELECT level_id AS levelId, official_title AS officialTitle, post_nominal AS postNominal,
          cefr, standing, academic_purpose AS academicPurpose,
          graduate_profile AS graduateProfile, learning_outcomes AS learningOutcomes
     FROM award_definitions ORDER BY level_id`).all();

check('All six awards are defined', defs.length === 6, defs.length);
check('...one per level, in order', defs.map((d) => d.levelId).join(',') === '1,2,3,4,5,6',
  defs.map((d) => d.levelId).join(','));

// --- The definitions match their sources ------------------------------
{
  const drifted = [];
  for (const d of defs) {
    if (!flatArch.includes(flatten(d.officialTitle))) drifted.push(`title L${d.levelId}`);
    if (!flatArch.includes(flatten(d.standing))) drifted.push(`standing L${d.levelId}`);
    if (!flatArch.includes(flatten(d.academicPurpose))) drifted.push(`purpose L${d.levelId}`);
    if (!flatFramework.includes(flatten(d.graduateProfile))) drifted.push(`profile L${d.levelId}`);
    if (!flatFramework.includes(flatten(d.learningOutcomes))) drifted.push(`outcomes L${d.levelId}`);
  }
  check('Every definition still appears verbatim in its source document',
    drifted.length === 0, drifted.join(', '));
}

// --- Internal consistency ---------------------------------------------
{
  // The award definition and the programme level must agree about CEFR.
  // Two tables carrying the same fact is a place for them to disagree,
  // and a verification page reading one while a transcript reads the
  // other would show a graduate two different qualifications.
  const { results: mismatched } = await env.DB.prepare(
    `SELECT d.level_id AS levelId, d.cefr AS defCefr, l.cefr AS levelCefr
       FROM award_definitions d JOIN programme_levels l ON l.id = d.level_id
      WHERE d.cefr != l.cefr`).all();
  check('Every definition agrees with its programme level on CEFR',
    mismatched.length === 0, JSON.stringify(mismatched));

  // And with the alumni chapter that derives from it.
  const { results: chapterMismatch } = await env.DB.prepare(
    `SELECT c.name, c.award_title AS chapterTitle, d.official_title AS definitionTitle
       FROM alumni_chapters c JOIN award_definitions d ON d.level_id = c.level_id
      WHERE c.award_title != d.official_title OR c.post_nominal != d.post_nominal`).all();
  check('Every alumni chapter names the same award as the definition does',
    chapterMismatch.length === 0, JSON.stringify(chapterMismatch));
}

{
  const pns = defs.map((d) => d.postNominal);
  check('Post-nominals are distinct', new Set(pns).size === 6, pns.join(','));
  check('...and each is a real post-nominal, not a placeholder',
    pns.every((p) => /^[A-Z][a-z][A-Z]{3}$/.test(p)), pns.join(','));
  // The load-bearing decision of the award architecture: each award is
  // complete in itself. A definition describing a step toward something
  // else would contradict the standing it confers.
  check('No definition describes an award as a step toward another',
    defs.every((d) => !/step (?:toward|towards)/i.test(d.standing + d.academicPurpose)),
    defs.filter((d) => /step (?:toward|towards)/i.test(d.standing + d.academicPurpose))
      .map((d) => d.levelId).join(','));
}

{
  // Substance, not placeholders. A definition of forty characters would
  // pass every check above and tell a verifier nothing.
  const thin = defs.filter((d) => d.academicPurpose.length < 60
    || d.graduateProfile.length < 100 || d.learningOutcomes.length < 100);
  check('Every definition carries real substance, not a placeholder',
    thin.length === 0,
    thin.map((d) => `L${d.levelId}: ${d.academicPurpose.length}/${d.graduateProfile.length}/${d.learningOutcomes.length}`).join('; '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
