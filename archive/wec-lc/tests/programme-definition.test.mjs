// The IEFC definition, and the seven claims it makes.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   The stored state of a claim must agree with what the platform's own
//   data shows — and where it does not, the observation wins.
//
// A definition is the most public thing an institution says about
// itself. This one asserts seven things, and six of them are true
// today. The seventh — competency verification — is the element that
// distinguishes an advanced academic qualification from a well-built
// CEFR course, and zero of the sixty assessments are mapped to any
// competency.
//
// Recording that honestly is not enough on its own, because a stored
// state goes stale in BOTH directions: if BASCE completes the mapping
// and nobody edits the row, the College understates itself forever; if
// the mapping were retired, it would overstate. So the claims that can
// be derived are derived, every time.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const P = await import(loadUrl('functions/_lib/registry/programme.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const seeds = [1, 2, 3, 4, 5, 6].map((n) => readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));

// makeD1() takes the whole schema and exec()s it, so the curriculum
// seeds are simply appended. An earlier attempt split the seed files on
// semicolons and fed them through prepare() one at a time; that broke a
// multi-row INSERT in half and failed on a foreign key. The shim's own
// entry point already does this correctly — there was no reason to
// reimplement it worse.
function freshEnv({ curriculum = false } = {}) {
  return { DB: makeD1(curriculum ? schema + '\n' + seeds.join('\n') : schema) };
}

// --- The definition ---------------------------------------------------
{
  const env = freshEnv();
  const d = await P.definition(env);
  check('The programme definition is stored', !!d);
  check('...whole and verbatim, as the Executive stated it',
    d.statement === 'IEFC is an advanced academic qualification built on CEFR proficiency, '
      + 'extending it through competency verification, leadership, professional communication, '
      + 'critical thinking, authentic assessment, and independently verifiable digital credentials.',
    d.statement);
  check('...recording who adopted it and when', d.adoptedBy === 'Executive' && d.adoptedOn === '2026-08-04',
    `${d.adoptedBy} / ${d.adoptedOn}`);

  check('It is decomposed into seven claims', d.claims.length === 7, d.claims.length);
  // Every element the sentence names must appear as a claim. A
  // definition asserting something no claim covers would be an
  // unverifiable clause hiding inside a verifiable sentence.
  const covered = ['CEFR_PROFICIENCY', 'COMPETENCY_VERIFICATION', 'LEADERSHIP',
    'PROFESSIONAL_COMMUNICATION', 'CRITICAL_THINKING', 'AUTHENTIC_ASSESSMENT',
    'VERIFIABLE_CREDENTIALS'];
  check('...one for every element the sentence names',
    covered.every((c) => d.claims.some((x) => x.code === c)),
    d.claims.map((c) => c.code).join(','));

  // The schema forbids the two dishonest shapes: a shortfall with no
  // gap, and a gap with no shortfall.
  check('Every claim short of evidenced names what is missing',
    d.claims.filter((c) => c.state !== 'evidenced').every((c) => (c.shortfall || '').length > 40),
    d.claims.filter((c) => c.state !== 'evidenced' && (c.shortfall || '').length <= 40).map((c) => c.code).join(','));
  check('...and every evidenced claim names what evidences it',
    d.claims.every((c) => (c.evidence || '').length > 40));
}

// --- The honest position, today ---------------------------------------
{
  const env = freshEnv({ curriculum: true });
  const v = await P.verifiedClaims(env);

  check('The claims are re-derived from live data, not taken on trust',
    v.claims.every((c) => 'observed' in c && 'agrees' in c));
  check('...and every stored state agrees with what the data shows',
    v.disagreements.length === 0,
    v.disagreements.map((c) => `${c.code}: stored ${c.state}, observed ${c.observed}`).join('; '));

  // The finding that matters.
  const comp = v.claims.find((c) => c.code === 'COMPETENCY_VERIFICATION');
  check('Competency verification is reported as NOT evidenced',
    (comp.observed || comp.state) === 'not_evidenced', comp.observed || comp.state);
  check('...with the real curriculum loaded, so this is not an empty database',
    v.measurements.assessments >= 100, v.measurements.assessments);
  check('...and zero assessments mapped to any competency',
    v.measurements.assessmentsMappedToCompetencies === 0,
    v.measurements.assessmentsMappedToCompetencies);
  check('...named as the distinction between a qualification and a course',
    /distinguishes an advanced academic qualification/.test(comp.shortfall), comp.shortfall);
  check('...pointing at BASCE as the body that must close it',
    /BASCE/.test(comp.shortfall));

  // Credentials: real, and honestly qualified while the key is not
  // production-grade.
  const cred = v.claims.find((c) => c.code === 'VERIFIABLE_CREDENTIALS');
  check('Verifiable credentials is reported as partial, not evidenced',
    (cred.observed || cred.state) === 'partial', cred.observed || cred.state);
  check('...because the signing key is not in production key management',
    /development key management/.test(cred.shortfall), cred.shortfall);

  check('Four of the seven are fully evidenced', v.counts.evidenced === 4, JSON.stringify(v.counts));
  check('...two partial, one not evidenced',
    v.counts.partial === 2 && v.counts.not_evidenced === 1, JSON.stringify(v.counts));
}

// --- The observation must win over the stored row ---------------------
{
  // If BASCE completes the mapping and nobody edits the table, the
  // College would go on understating itself. The observation moves; the
  // stored row does not; the disagreement is reported.
  const env = freshEnv({ curriculum: true });
  const item = await env.DB.prepare(
    "SELECT id FROM learning_items WHERE kind = 'assignment' LIMIT 1").bind().first();
  check('Precondition: there is a real assessment to map', !!item, JSON.stringify(item));
  await env.DB.prepare(
    'INSERT INTO assessment_competencies (learning_item_id, competency_id, weight) VALUES (?, ?, 1.0)')
    .bind(item.id, 'cmp_clarity').run();

  const v = await P.verifiedClaims(env);
  const comp = v.claims.find((c) => c.code === 'COMPETENCY_VERIFICATION');
  check('Mapping an assessment moves the OBSERVED state, without editing the row',
    comp.state === 'not_evidenced' && comp.observed === 'partial',
    `stored ${comp.state}, observed ${comp.observed}`);
  check('...and the disagreement is reported rather than hidden',
    v.disagreements.some((c) => c.code === 'COMPETENCY_VERIFICATION'),
    v.disagreements.map((c) => c.code).join(','));
  // The summary must never be more optimistic than the platform, and
  // here it is LESS: counts follow the observation.
  check('...with the counts following the observation, not the stored row',
    v.counts.not_evidenced === 0 && v.counts.partial === 3, JSON.stringify(v.counts));
}

// --- What a page is allowed to publish --------------------------------
{
  const env = freshEnv({ curriculum: true });
  const s = await P.publishableStatement(env);

  check('The statement is publishable', !!s && s.statement.length > 100);
  // The caveat is not optional and not left to the page to remember.
  // Publishing the sentence alone would be the College making a claim
  // its own data contradicts.
  check('...and never without its caveat while an element is unevidenced',
    !!s.caveat && /does not yet evidence every element/.test(s.caveat), s.caveat);
  check('...naming the element that is missing',
    /competency verification/i.test(s.caveat), s.caveat);
  check('...and pointing somewhere a reader can check the position',
    /Evidence Centre/.test(s.caveat), s.caveat);
  check('The partial elements are qualified separately from the missing one',
    s.qualifications.length === 2, JSON.stringify(s.qualifications.map((q) => q.claim)));
  check('...and the definition is not reported as fully evidenced',
    s.fullyEvidenced === false);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
