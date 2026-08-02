// Run with: node --experimental-sqlite tests/curriculum-consistency.test.mjs
//
// Programme-wide consistency harness for the WEC-LC curriculum
// (Academic Edition v1.0). Where the per-level sweeps
// (curriculum-level-N.test.mjs) verify that each level WORKS — content
// loads, quizzes score, assignments grade — this file verifies that the
// six levels agree with EACH OTHER and with the published policy in
// docs/curriculum-framework.md.
//
// It exists because docs/curriculum-programme-review.md found real
// inconsistencies across the levels that no per-level test could see:
// a level omitting its own signature rubric criterion, quiz lengths
// differing between levels, rubric headings that a parser cannot read.
// Encoding those findings as assertions is what stops them recurring —
// a future module that breaks the model fails the build rather than
// waiting for the next manual review.
//
// Every rule below is stated normatively in
// docs/curriculum-framework.md § Rubric policy. If a rule here and the
// document disagree, that is itself the bug.
import { readFileSync, existsSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
let sql = schema;
for (let n = 1; n <= 6; n++) sql += '\n' + readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8');
// Audio seeds are separate files, applied per level as the strand is
// built out. existsSync rather than a hard list so a newly-authored
// level is picked up without editing this line.
for (let n = 1; n <= 6; n++) {
  const p = `${ROOT}/sql/seed-audio-level-${n}.sql`;
  if (existsSync(p)) sql += '\n' + readFileSync(p, 'utf8');
}
const db = makeD1(sql);

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

const LEVELS = [1, 2, 3, 4, 5, 6];

// --- The published rubric policy, in machine-readable form ---------------
const CORE = ['grammatical accuracy', 'vocabulary range', 'task completion'];
// The end-of-level exams widen the first core criterion to the whole level.
const CORE_ALIASES = { 'grammatical accuracy': ['grammatical accuracy', 'grammatical range and accuracy'] };
const SIGNATURE = {
  1: 'clarity & intelligibility',
  2: 'communicative quality',
  3: 'discourse coherence & register',
  4: 'evidence & argument quality',
  5: 'rhetorical effectiveness',
  6: 'independent judgement',
};
// Criteria selectable for a task on top of core + signature.
const SPOKEN_POOL = ['fluency and delivery', 'coherence'];
const DECLARED = new Set([...CORE, ...CORE_ALIASES['grammatical accuracy'], ...Object.values(SIGNATURE), ...SPOKEN_POOL]);

// --- Parsing -------------------------------------------------------------
// Mirrors the machine contract in the rubric policy: "GRADING RUBRIC:"
// then a numbered list of "(n) Name -- description". The parser tolerates
// a parenthetical qualifier inside a criterion name, because several
// assignments legitimately write "Communicative quality (new emphasis at
// this level) --". An earlier version of this parser did NOT, which is
// how the programme review's first published rubric table came to be
// wrong; the tolerance is deliberate and load-bearing.
const canon = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z& ]/g, '').replace(/\s+/g, ' ').trim();

function parseCriteria(body) {
  const marks = [...body.matchAll(/\((\d)\)\s*([^-—]{3,70}?)\s+--\s/g)].map((m) => ({ n: +m[1], name: canon(m[2]) }));
  const out = [];
  let expect = 1;
  for (const m of marks) if (m.n === expect) { out.push(m.name); expect++; }
  return out;
}

const assignments = db.prepare(
  `SELECT u.course_id AS lvl, u.sequence AS seq, i.id, i.body
   FROM learning_items i JOIN units u ON u.id = i.unit_id
   WHERE i.kind = 'assignment' ORDER BY u.course_id, u.sequence`
).all().results.map((r) => ({ ...r, level: +r.lvl.replace('crs_level_', ''), criteria: parseCriteria(r.body) }));

check('All 60 rubric-graded assignments are present', assignments.length === 60);

// --- Rule 1: heading is a machine contract -------------------------------
{
  const bad = assignments.filter((a) => !/GRADING RUBRIC(\s*\([^)]*\))?:/.test(a.body));
  check(`Every assignment opens its rubric with "GRADING RUBRIC:"${bad.length ? ' — offenders: ' + bad.map((b) => b.id).join(', ') : ''}`, bad.length === 0);
}

// --- Rule 2: the core three are mandatory everywhere ---------------------
for (const c of CORE) {
  const accepted = CORE_ALIASES[c] || [c];
  const bad = assignments.filter((a) => !accepted.some((n) => a.criteria.includes(n)));
  check(`Core criterion "${c}" appears in all 60 assignments${bad.length ? ' — missing from: ' + bad.map((b) => b.id).join(', ') : ''}`, bad.length === 0);
}

// --- Rule 3: a level signature applies to EVERY assignment of its level --
// This is the rule the programme previously failed, at Levels IV and V.
for (const lv of LEVELS) {
  const sig = SIGNATURE[lv];
  const inLevel = assignments.filter((a) => a.level === lv);
  const bad = inLevel.filter((a) => !a.criteria.includes(sig));
  check(`Level ${lv}: signature criterion "${sig}" is on all ${inLevel.length} assignments${bad.length ? ' — missing from: ' + bad.map((b) => b.id).join(', ') : ''}`, bad.length === 0);
}

// --- Rule 4: end-of-level exams carry every signature still LIVE ---------
// The cumulativity guarantee: rotating genre criteria is allowed inside a
// level only because the exam sweeps up everything still in force. Three
// signatures assess one rising dimension and subsume their predecessor
// (clarity → communicative quality → rhetorical effectiveness), so a
// retired criterion is not expected in a later exam — a C2 examination
// should not be graded on A1 intelligibility.
const RETIRED_AFTER = { 1: 1, 2: 4 }; // level I's signature retires after L1; level II's after L4
const liveAt = (lv) => LEVELS.filter((n) => n <= lv && (RETIRED_AFTER[n] === undefined || lv <= RETIRED_AFTER[n])).map((n) => SIGNATURE[n]);
for (const lv of LEVELS) {
  const exam = assignments.find((a) => a.level === lv && a.seq === 10);
  const live = liveAt(lv);
  const missing = live.filter((c) => !exam.criteria.includes(c));
  check(`Level ${lv} examination carries every live signature (${live.length})${missing.length ? ' — missing: ' + missing.join(', ') : ''}`, missing.length === 0);
}

// --- Rule 5: no undeclared criterion names -------------------------------
// Guards against the same idea reappearing under a new name, which is how
// Level I ended up with five names for one criterion.
{
  const undeclared = new Set();
  for (const a of assignments) for (const c of a.criteria) if (!DECLARED.has(c)) undeclared.add(`${a.id}:${c}`);
  check(`No assignment uses an undeclared criterion name${undeclared.size ? ' — found: ' + [...undeclared].join(', ') : ''}`, undeclared.size === 0);
}

// --- Rule 6: rubric size stays within the policy band --------------------
for (const a of assignments) {
  const min = a.level <= 2 ? 4 : 5;
  const max = a.seq === 10 ? 9 : 6;
  if (a.criteria.length < min || a.criteria.length > max) {
    check(`${a.id}: rubric has ${a.criteria.length} criteria, outside the policy band ${min}-${max}`, false);
  }
}
check('Every rubric size is within the policy band for its level', true);

// --- Rule 7: quiz length is uniform across levels ------------------------
{
  const counts = db.prepare(
    `SELECT u.course_id AS lvl, u.sequence AS seq, COUNT(q.id) AS c
     FROM quiz_questions q JOIN learning_items i ON i.id = q.learning_item_id
     JOIN units u ON u.id = i.unit_id
     WHERE i.kind = 'quiz'   -- listening items carry their own comprehension
                             -- questions; this rule is about module quizzes
     GROUP BY 1, 2 ORDER BY 1, 2`
  ).all().results;
  const contentBad = counts.filter((r) => r.seq !== 10 && r.c !== 10);
  const examBad = counts.filter((r) => r.seq === 10 && r.c !== 20);
  check(`Every content module (1-9) at every level has a 10-question quiz${contentBad.length ? ' — offenders: ' + contentBad.map((r) => r.lvl + '.M' + r.seq + '=' + r.c).join(', ') : ''}`, contentBad.length === 0);
  check(`Every end-of-level examination has 20 questions${examBad.length ? ' — offenders: ' + examBad.map((r) => r.lvl + '.M' + r.seq + '=' + r.c).join(', ') : ''}`, examBad.length === 0);
}

// --- Rule 8: structural uniformity across the six levels -----------------
for (const lv of LEVELS) {
  const units = db.prepare('SELECT COUNT(*) AS c FROM units WHERE course_id = ?').bind(`crs_level_${lv}`).first();
  check(`Level ${lv} has exactly 10 modules`, units.c === 10);
}
// A module's baseline is 5 learning items (4 for Module 10). A module
// that has gained the audio strand carries 2 more: a listening item and
// a pronunciation lab. Both shapes are legal; anything else is not.
// AUDIO_MODULES is the explicit, declared rollout state — it is listed
// here rather than inferred so that a module silently LOSING its audio
// strand fails the build instead of being read as "not rolled out yet".
const AUDIO_LEVELS = [1, 2, 3, 4, 5, 6];
const AUDIO_MODULES = new Set(
  AUDIO_LEVELS.flatMap((lv) => Array.from({ length: 10 }, (_, i) => `unt_l${lv}_m${i + 1}`))
);
{
  const rows = db.prepare(
    `SELECT u.id AS unitId, u.course_id AS lvl, u.sequence AS seq, COUNT(i.id) AS c
     FROM learning_items i JOIN units u ON u.id = i.unit_id GROUP BY 1, 2, 3`
  ).all().results;
  const expected = (r) => (r.seq === 10 ? 4 : 5) + (AUDIO_MODULES.has(r.unitId) ? 2 : 0);
  const bad = rows.filter((r) => r.c !== expected(r));
  check(`Every module has its expected learning-item count (5, or 4 for Module 10, plus 2 where the audio strand has been built)${bad.length ? ' — offenders: ' + bad.map((r) => r.unitId + '=' + r.c + ' (expected ' + expected(r) + ')').join(', ') : ''}`, bad.length === 0);
}
{
  // Every declared audio module must carry BOTH strands, a real script,
  // and cue segmentation. Half-built audio is worse than none: it makes
  // the interface promise a listening lesson it cannot deliver.
  const bad = [];
  for (const unitId of AUDIO_MODULES) {
    const kinds = db.prepare(`SELECT kind FROM learning_items WHERE unit_id = ?`).bind(unitId).all().results.map((r) => r.kind);
    if (!kinds.includes('listening') || !kinds.includes('pronunciation')) { bad.push(`${unitId}: missing a strand`); continue; }
    const assets = db.prepare(
      `SELECT a.id, a.transcript, (SELECT COUNT(*) FROM audio_cues c WHERE c.audio_asset_id = a.id) AS cues
       FROM audio_assets a JOIN learning_items i ON i.audio_asset_id = a.id WHERE i.unit_id = ?`
    ).bind(unitId).all().results;
    if (!assets.length) bad.push(`${unitId}: no audio asset`);
    for (const a of assets) {
      if (!a.transcript || !a.transcript.trim()) bad.push(`${a.id}: empty transcript`);
    }
    const listening = db.prepare(`SELECT id FROM learning_items WHERE unit_id = ? AND kind = 'listening'`).bind(unitId).first();
    const qs = db.prepare('SELECT COUNT(*) AS c FROM quiz_questions WHERE learning_item_id = ?').bind(listening.id).first();
    if (qs.c < 3) bad.push(`${listening.id}: only ${qs.c} comprehension questions`);
    const cued = db.prepare('SELECT COUNT(*) AS c FROM quiz_questions WHERE learning_item_id = ? AND audio_cue_id IS NOT NULL').bind(listening.id).first();
    if (cued.c !== qs.c) bad.push(`${listening.id}: ${qs.c - cued.c} questions not anchored to a cue`);
    const targets = db.prepare(`SELECT COUNT(*) AS c FROM pronunciation_targets t JOIN learning_items i ON i.id = t.learning_item_id WHERE i.unit_id = ?`).bind(unitId).first();
    if (targets.c < 2) bad.push(`${unitId}: only ${targets.c} pronunciation targets`);
  }
  check(`Every module with the audio strand has both item kinds, a real transcript, cue-anchored comprehension questions, and pronunciation targets${bad.length ? ' — ' + bad.join('; ') : ''}`, bad.length === 0);
}

// --- Rule 9: every module has one quiz and one assignment ----------------
{
  const rows = db.prepare(
    `SELECT u.id, SUM(CASE WHEN i.kind='quiz' THEN 1 ELSE 0 END) AS q,
            SUM(CASE WHEN i.kind='assignment' THEN 1 ELSE 0 END) AS a
     FROM units u JOIN learning_items i ON i.unit_id = u.id GROUP BY u.id`
  ).all().results;
  const bad = rows.filter((r) => r.q !== 1 || r.a !== 1);
  check(`All 60 modules have exactly one quiz and one assignment${bad.length ? ' — offenders: ' + bad.map((r) => r.id).join(', ') : ''}`, bad.length === 0);
}

// --- Rule 10: every quiz question is well formed -------------------------
{
  const qs = db.prepare('SELECT id, choices_json, correct_index FROM quiz_questions').all().results;
  const bad = qs.filter((q) => {
    let ch;
    try { ch = JSON.parse(q.choices_json); } catch { return true; }
    return !Array.isArray(ch) || ch.length !== 4 || q.correct_index < 0 || q.correct_index > 3;
  });
  check(`Every quiz question has 4 parseable choices and an in-range answer key (${qs.length} questions)${bad.length ? ' — offenders: ' + bad.slice(0, 5).map((b) => b.id).join(', ') : ''}`, bad.length === 0);
}

// --- Rule 11: no duplicate answer-key position runs ----------------------
// A quiz whose answers are all the same index is a seeding accident, not
// a quiz. Catches copy-paste errors that the per-level sweeps cannot see,
// because submitting the real key still scores 100%.
{
  const quizzes = db.prepare(`SELECT id FROM learning_items WHERE kind = 'quiz'`).all().results;
  const bad = [];
  for (const qz of quizzes) {
    const keys = db.prepare('SELECT correct_index FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence').bind(qz.id).all().results.map((r) => r.correct_index);
    if (keys.length && new Set(keys).size === 1) bad.push(qz.id);
  }
  check(`No quiz has every answer at the same position${bad.length ? ' — offenders: ' + bad.join(', ') : ''}`, bad.length === 0);
}

// --- Rule 11b: answer keys are distributed across the four positions -----
// An assessment-validity rule. Before v1.0, 66% of all correct answers sat
// at position (b) and 5 of 642 at (d) — a learner who always chose (b)
// passed several modules without reading the questions. The per-level
// sweeps could never catch this: submitting the real key still scores 100%
// whatever the key happens to be.
{
  const quizzes = db.prepare(`SELECT id FROM learning_items WHERE kind = 'quiz'`).all().results;
  const bad = [];
  const overall = [0, 0, 0, 0];
  for (const qz of quizzes) {
    const keys = db.prepare('SELECT correct_index FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence').bind(qz.id).all().results.map((r) => r.correct_index);
    const counts = [0, 0, 0, 0];
    keys.forEach((k) => { counts[k]++; overall[k]++; });
    if (Math.max(...counts) / keys.length > 0.5) bad.push(`${qz.id}(${counts.join('/')})`);
  }
  check(`No quiz places more than half its answers at one position${bad.length ? ' — offenders: ' + bad.join(', ') : ''}`, bad.length === 0);
  const total = overall.reduce((a, b) => a + b, 0);
  const shares = overall.map((c) => c / total);
  check(`Programme-wide answer positions are each 20-30% of the key (a/b/c/d = ${overall.join('/')} of ${total})`,
    shares.every((s) => s >= 0.2 && s <= 0.3));
}

// --- Rule 11c: the audio curriculum actually escalates -------------------
// Structural completeness is not pedagogical progression. These rules
// assert that the listening strand gets genuinely harder across the six
// levels rather than merely existing at each of them.
{
  const perLevel = [];
  for (const lv of AUDIO_LEVELS) {
    const rows = db.prepare(`SELECT target_wpm AS w, transcript AS t FROM audio_assets WHERE kind = 'listening' AND id LIKE 'aud_l${lv}_%'`).all().results;
    perLevel.push({
      lv,
      minWpm: Math.min(...rows.map((r) => r.w)),
      maxWpm: Math.max(...rows.map((r) => r.w)),
      avgWords: rows.reduce((a, r) => a + r.t.split(/\s+/).length, 0) / rows.length,
    });
  }
  const wpmRises = perLevel.every((p, i) => i === 0 || p.minWpm > perLevel[i - 1].minWpm);
  check(`Listening pace rises at every level (${perLevel.map((p) => `L${p.lv}:${p.minWpm}-${p.maxWpm}`).join(' ')})`, wpmRises);
  const lengthRises = perLevel.every((p, i) => i === 0 || p.avgWords >= perLevel[i - 1].avgWords);
  check(`Listening scripts lengthen at every level (${perLevel.map((p) => `L${p.lv}:${Math.round(p.avgWords)}w`).join(' ')})`, lengthRises);
  // A1 must stay well below natural conversational pace (~150 wpm) and
  // C2 must reach it: an unaccommodated C2 listening at A1 pace would be
  // the level failing its own objective.
  check('A1 listening stays well below natural conversational pace', perLevel[0].maxWpm <= 110);
  check('C2 listening reaches unmodified native professional pace', perLevel[perLevel.length - 1].minWpm >= 150);
}
{
  // No script, comprehension question or piece of pronunciation guidance
  // may be reused anywhere in the programme. Duplication here would be
  // the exact "padding to create an appearance of completeness" this
  // project has refused throughout.
  const dup = (rows, label) => {
    const seen = new Set(); const bad = [];
    for (const v of rows) { if (seen.has(v)) bad.push(v.slice(0, 40)); seen.add(v); }
    check(`No duplicate ${label} anywhere in the programme (${rows.length} items)${bad.length ? ' — repeated: ' + bad.slice(0, 3).join(' | ') : ''}`, bad.length === 0);
  };
  dup(db.prepare("SELECT transcript AS v FROM audio_assets WHERE kind = 'listening'").all().results.map((r) => r.v.trim()), 'listening script');
  dup(db.prepare("SELECT q.prompt AS v FROM quiz_questions q JOIN learning_items i ON i.id = q.learning_item_id WHERE i.kind = 'listening'").all().results.map((r) => r.v.trim()), 'listening comprehension question');
  dup(db.prepare('SELECT guidance AS v FROM pronunciation_targets').all().results.map((r) => r.v.trim()), 'pronunciation guidance');
}
{
  // Every audio asset must be honest about its recording status: a
  // transcript always, and either a full recording (url AND duration) or
  // none at all. A url with no duration would be a half-wired asset the
  // player could not lay out.
  const bad = db.prepare(`SELECT id, transcript, media_url AS u, duration_ms AS d FROM audio_assets`).all().results
    .filter((a) => !a.transcript || !a.transcript.trim() || (a.u === null) !== (a.d === null));
  check(`Every audio asset has a real transcript and a consistent recording state${bad.length ? ' — offenders: ' + bad.map((b) => b.id).join(', ') : ''}`, bad.length === 0);
}

// --- Rule 11d: v1.0 curriculum refinements stay applied ------------------
{
  const overviewHas = (id, needle) => {
    const r = db.prepare('SELECT body FROM learning_items WHERE id = ?').bind(id).first();
    return Boolean(r && r.body && r.body.includes(needle));
  };
  // The lexical strand must reach Levels I and II, not start abruptly at
  // Level III. Every module at both levels carries collocations.
  const missingColl = [];
  for (const lv of [1, 2]) {
    for (let m = 1; m <= 10; m++) {
      const id = m === 10 ? `itm_l${lv}_m10_revguide` : `itm_l${lv}_m${m}_overview`;
      if (!overviewHas(id, 'COLLOCATION')) missingColl.push(id);
    }
  }
  check(`Levels I and II carry a collocation strand in all 20 modules${missingColl.length ? ' — missing: ' + missingColl.join(', ') : ''}`, missingColl.length === 0);

  // The diagnostic-and-revisit loop at the programme's two largest steps
  // (A2->B1 and B1->B2) plus the C2 mastery diagnostic. A diagnostic
  // written but never revisited is just a worksheet, so both ends are
  // asserted.
  const diagMissing = [];
  for (const lv of [3, 4]) {
    if (!overviewHas(`itm_l${lv}_m1_overview`, 'ENTRY DIAGNOSTIC')) diagMissing.push(`L${lv} entry`);
    if (!overviewHas(`itm_l${lv}_m10_revlesson`, 'REVISITING YOUR ENTRY DIAGNOSTIC')) diagMissing.push(`L${lv} revisit`);
  }
  if (!overviewHas('itm_l6_m10_examassignment', 'MODULE 1 MASTERY DIAGNOSTIC')) diagMissing.push('L6 revisit');
  check(`Entry diagnostics are set AND revisited at every level that has one${diagMissing.length ? ' — missing: ' + diagMissing.join(', ') : ''}`, diagMissing.length === 0);

  // A roman numeral in a module title promises a sequel. "Past
  // Experiences I" had none anywhere in the 60 modules. The comparison
  // strips the "Module N: " prefix first — an earlier version of this
  // rule did not, and wrongly flagged Academic Writing I/II/III, which
  // genuinely do form a series across Levels IV and V.
  const stripNum = (t) => t.replace(/^Module\s+\d+:\s*/, '');
  const seriesBase = (t) => stripNum(t).replace(/\s+(I{1,3}|IV|V)$/, '').trim();
  const titles = db.prepare('SELECT title FROM units').all().results.map((u) => u.title);
  const numbered = titles.filter((t) => /\s+(I{1,3}|IV|V)$/.test(stripNum(t)));
  const orphans = numbered.filter((t) => titles.filter((o) => seriesBase(o) === seriesBase(t)).length < 2);
  check(`Every numbered module title has a real sibling in its series${orphans.length ? ' — orphaned: ' + orphans.join(', ') : ''} (${numbered.length} numbered titles checked)`, orphans.length === 0);
}

// --- Rule 12: lesson template elements -----------------------------------
{
  const lessons = db.prepare(
    `SELECT id, body FROM learning_items WHERE kind = 'reading' AND (id LIKE '%lesson%')`
  ).all().results;
  // CRITICAL THINKING joined this list in v1.0. It was previously absent
  // from all 18 Level I lessons and one Level II lesson; at A1 the prompt
  // is choice-based or a single corrected sentence rather than an
  // abstract discussion, but the element is now genuinely universal.
  const REQUIRED = ['LEARNING OBJECTIVES', 'WARM-UP', 'PRESENTATION', 'LISTENING', 'READING ACTIVITY',
    'WRITING TASK', 'PRONUNCIATION PRACTICE', 'VOCABULARY REINFORCEMENT', 'FORMATIVE ASSESSMENT',
    'HOMEWORK', 'EXTENSION', 'CRITICAL THINKING'];
  for (const el of REQUIRED) {
    const bad = lessons.filter((l) => !l.body.includes(el));
    check(`Template element "${el}" present in all ${lessons.length} lesson items${bad.length ? ' — missing from: ' + bad.slice(0, 6).map((b) => b.id).join(', ') : ''}`, bad.length === 0);
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
