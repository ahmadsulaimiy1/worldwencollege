// The Accreditation Evidence Centre, and the relation model under it.
//
// TWO ASSERTIONS CARRY THIS FILE, AND BOTH ARE ABOUT FABRICATION.
//
// 1. EVERY CITED DOCUMENT MUST OPEN. An evidence register that can cite
//    a document nobody can produce is worse than an empty one, because
//    it converts a known gap into an unknown one — a reviewer ticks the
//    row, and the absence surfaces only when they ask to see it. So this
//    file opens every `source_path` in the register, on disk.
//
// 2. NO RELATION MAY BE APPROVED THAT NOBODY APPROVED. "This lesson
//    teaches this competency" is an academic judgement. A graph that
//    inferred it would look complete and be fiction — undetectable
//    fiction, because a plausible mapping is indistinguishable from a
//    real one. Every relation is proposed until a named reviewer accepts
//    it, and the query feeding academic conclusions reads approved only.
//
// The rest is about the register refusing to flatter the College: gaps
// counted as prominently as holdings, `not_applicable` requiring a
// reason, and no view able to render without the disclaimer.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const E = await import(loadUrl('functions/_lib/registry/evidence.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const seed = readFileSync(`${ROOT}/sql/seed-evidence-centre.sql`, 'utf8');
const T0 = Date.parse('2027-01-15T09:00:00.000Z');

function freshEnv({ seeded = true } = {}) {
  const env = { DB: makeD1(schema) };
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_dir','clerk','c_d','dir@example.com','admin')`).bind().run();
  // The shim exposes only prepare(), so the seed is applied statement by
  // statement rather than through exec(). Split on the blank-line-plus-
  // INSERT boundary that the seed file uses, which keeps each multi-row
  // INSERT intact.
  if (seeded) {
    for (const stmt of seed.split(/;\s*\n(?=\s*(?:INSERT|--|$))/)) {
      const sql = stmt.replace(/^\s*--.*$/gm, '').trim();
      if (sql) env.DB.prepare(sql.replace(/;$/, '')).bind().run();
    }
  }
  return env;
}

// The shim exposes the underlying handle; if that ever changes, seeding
// silently does nothing and every assertion below becomes vacuous. So it
// is checked rather than assumed.
{
  const env = freshEnv();
  const n = env.DB.prepare('SELECT COUNT(*) AS n FROM evidence_items').bind().first().n;
  check('Precondition: the register seed actually loaded', n > 30, n);
}

// ---------------------------------------------------------------------
// THE DECISIVE ONE: every cited document exists on disk
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const r = await E.evidenceRegister(env, { now: T0 });
  const cited = r.items.filter((i) => i.sourcePath);

  check('The register cites documents', cited.length >= 10, cited.length);

  const missing = cited.filter((i) => !existsSync(path.join(ROOT, i.sourcePath)));
  check('EVERY cited document exists in the repository',
    missing.length === 0,
    missing.map((i) => `${i.reference} -> ${i.sourcePath}`).join('; '));

  // And they are not empty files that satisfy existsSync and nothing else.
  const trivial = cited.filter((i) => {
    const p = path.join(ROOT, i.sourcePath);
    return existsSync(p) && readFileSync(p, 'utf8').trim().length < 500;
  });
  check('...and none is a stub too short to be evidence of anything',
    trivial.length === 0, trivial.map((i) => i.reference).join(', '));

  // The schema enforces this, but the schema could be relaxed; the
  // register's honesty rests on it either way.
  const existsWithoutPath = r.items.filter((i) => i.state === 'exists' && !i.sourcePath);
  check('No item claims to exist without saying where',
    existsWithoutPath.length === 0, existsWithoutPath.map((i) => i.reference).join(', '));
}

// ---------------------------------------------------------------------
// The register does not flatter the College
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const r = await E.evidenceRegister(env, { now: T0 });

  check('All 23 collections the Executive named are represented',
    r.summary.collectionsWithNoItems.length === 0,
    r.summary.collectionsWithNoItems.join(', '));

  // The number that stops this being a marketing document.
  check('Gaps are counted as prominently as holdings',
    typeof r.summary.notEvidenced === 'number' && r.summary.notEvidenced > 0,
    `${r.summary.evidenced} evidenced / ${r.summary.notEvidenced} not`);
  check('...and the College currently cannot evidence most of the register',
    r.summary.notEvidenced > r.summary.evidenced,
    `${r.summary.evidenced} vs ${r.summary.notEvidenced}`);

  // Every row has to say something. "Not applicable" with no reason is
  // how a checklist gets quietly emptied.
  const silent = r.items.filter((i) => !i.statement || i.statement.length < 40);
  check('Every item explains its own state, whatever that state is',
    silent.length === 0, silent.map((i) => i.reference).join(', '));

  check('No view can render the register without the disclaimer',
    /holds no accreditation/i.test(r.disclaimer) && /has applied for none/i.test(r.disclaimer));
  check('...which states it is internal and anticipates nothing',
    /INTERNAL/.test(r.disclaimer) && /anticipates external recognition/i.test(r.disclaimer));

  // Named posts, not invented people.
  const named = r.items.filter((i) => i.ownerRole && /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(i.ownerRole)
    && !/Council|Senate|Registrar|Director|Officer|Committee/.test(i.ownerRole));
  check('Ownership names posts, never invented individuals',
    named.length === 0, named.map((i) => i.ownerRole).join(', '));
}

// ---------------------------------------------------------------------
// Revision keeps what the register used to say
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const before = await E.evidenceItem(env, { reference: 'QA-003', now: T0 });
  check('Precondition: the QA policy is pending', before.state === 'governance_pending');
  check('...with no history yet', before.versions.length === 0);

  const after = await E.reviseEvidence(env, {
    reference: 'QA-003',
    changes: { state: 'exists', sourcePath: 'docs/engineering-principles.md',
      statement: 'Adopted by the Governing Council.' },
    changeNote: 'Adopted following the Council meeting of 15 January.',
    changedBy: 'usr_dir', now: T0,
  });
  check('An item can be revised', after.state === 'exists' && after.version === 2);
  check('...and the previous state is kept, not overwritten',
    after.versions.length === 1 && after.versions[0].state === 'governance_pending',
    JSON.stringify(after.versions[0]).slice(0, 90));
  check('...with a note saying what changed and why',
    /Council meeting/.test(after.versions[0].changeNote));

  const noNote = await throws(() => E.reviseEvidence(env, {
    reference: 'QA-003', changes: { statement: 'x' }, changeNote: 'fix',
  }));
  check('A revision without a real explanation is refused', noNote && noNote.name === 'ValidationError');

  // The rule that keeps assertion 1 true over time.
  const noPath = await throws(() => E.reviseEvidence(env, {
    reference: 'AP-001', changes: { state: 'exists' },
    changeNote: 'Claiming this exists without saying where.',
  }));
  check('An item cannot become "exists" without a source path',
    noPath && noPath.name === 'ValidationError', noPath && noPath.message.slice(0, 60));

  const badState = await throws(() => E.reviseEvidence(env, {
    reference: 'AP-001', changes: { state: 'probably_fine' }, changeNote: 'An invented state.',
  }));
  check('An invented state is refused', badState && badState.name === 'ValidationError');
}

// ---------------------------------------------------------------------
// Review status is derived, so it cannot go stale
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  env.DB.prepare("UPDATE evidence_items SET next_review_at = '2026-01-01T00:00:00.000Z' WHERE reference = 'AREG-001'").bind().run();
  env.DB.prepare("UPDATE evidence_items SET next_review_at = '2027-01-25T00:00:00.000Z' WHERE reference = 'PS-001'").bind().run();
  env.DB.prepare("UPDATE evidence_items SET next_review_at = '2029-01-01T00:00:00.000Z' WHERE reference = 'PS-003'").bind().run();

  const r = await E.evidenceRegister(env, { now: T0 });
  const get = (ref) => r.items.find((i) => i.reference === ref);
  check('A review date in the past reads as overdue', get('AREG-001').reviewStatus === 'overdue');
  check('...one inside a month reads as due soon', get('PS-001').reviewStatus === 'due_soon');
  check('...and one far off reads as current', get('PS-003').reviewStatus === 'current');
  check('An item with an interval but no date is flagged, not ignored',
    get('QA-001').reviewStatus === 'not_scheduled', get('QA-001').reviewStatus);
  check('The summary counts overdue reviews', r.summary.overdueReviews === 1, r.summary.overdueReviews);
}

// ---------------------------------------------------------------------
// THE SECOND DECISIVE ONE: relations are proposed until approved
// ---------------------------------------------------------------------
{
  const env = freshEnv();

  const rel = await E.relate(env, {
    subjectType: 'learning_item', subjectId: 'itm_x', predicate: 'teaches',
    objectType: 'competency', objectId: 'cmp_clarity', assertedBy: 'usr_dir', now: T0,
  });
  // The default is load-bearing: a function that could create an
  // approved edge in one call is a function through which an import
  // script silently becomes an academic authority.
  check('A newly asserted relation is PROPOSED, never approved',
    rel.status === 'proposed', rel.status);

  const approvedOnly = await E.approvedRelations(env, { predicate: 'teaches' });
  check('...and does not appear in the approved graph',
    approvedOnly.count === 0, approvedOnly.count);

  const again = await E.relate(env, {
    subjectType: 'learning_item', subjectId: 'itm_x', predicate: 'teaches',
    objectType: 'competency', objectId: 'cmp_clarity',
  });
  check('Re-asserting the same relation is not a second fact',
    again.created === false && again.id === rel.id);

  // Found by sabotage: rewriting relate() to insert 'approved' directly
  // does not produce a wrong answer — it produces a CHECK violation,
  // because the schema requires an approved edge to carry an approval
  // timestamp. "An approved relation nobody approved" is therefore
  // impossible at the database level, not merely absent from the code.
  // Asserted here so a schema change that drops the constraint is caught
  // by a test rather than by a reviewer years later.
  const forged = await throws(() => env.DB.prepare(
    `INSERT INTO academic_relations (id, subject_type, subject_id, predicate, object_type, object_id, status)
     VALUES ('rel_forged','learning_item','itm_y','teaches','competency','cmp_reason','approved')`).bind().run());
  check('The database refuses an approved relation with no approval recorded',
    !!forged && /CHECK/i.test(forged.message), forged && forged.message.slice(0, 50));

  const noApprover = await throws(() => E.approveRelation(env, { relationId: rel.id }));
  check('Approval without an approver is refused',
    noApprover && /approval with no approver/i.test(noApprover.message));

  await E.approveRelation(env, { relationId: rel.id, approvedBy: 'usr_dir', now: T0 + 1000 });
  const now = await E.approvedRelations(env, { predicate: 'teaches' });
  check('Once approved, it counts', now.count === 1);

  // Re-asserting an approved edge must not quietly demote it.
  const third = await E.relate(env, {
    subjectType: 'learning_item', subjectId: 'itm_x', predicate: 'teaches',
    objectType: 'competency', objectId: 'cmp_clarity',
  });
  check('Re-asserting an APPROVED relation does not reset it to proposed',
    third.status === 'approved', third.status);

  await E.retireRelation(env, { relationId: rel.id, now: T0 + 2000 });
  check('A retired relation leaves the approved graph',
    (await E.approvedRelations(env, { predicate: 'teaches' })).count === 0);
  check('...but is kept for the record, not deleted',
    env.DB.prepare('SELECT status FROM academic_relations WHERE id = ?').bind(rel.id).first().status === 'retired');

  for (const missing of [{ subjectType: '', subjectId: 'a', predicate: 'p', objectType: 'b', objectId: 'c' },
    { subjectType: 'a', subjectId: 'b', predicate: '', objectType: 'c', objectId: 'd' }]) {
    const e = await throws(() => E.relate(env, missing));
    check('An incomplete relation is refused', !!e && e.name === 'ValidationError');
  }
}

// ---------------------------------------------------------------------
// Every seeded relation resolves to something real
// ---------------------------------------------------------------------
// The cost of one generic relation table is that referential integrity
// is the application's job. A dangling edge must therefore be a test
// failure rather than a silent hole in the graph.
{
  const env = freshEnv();
  const all = env.DB.prepare('SELECT * FROM academic_relations').bind().all().results;
  check('The cross-reference graph is populated', all.length >= 25, all.length);

  const refs = new Set(env.DB.prepare('SELECT reference FROM evidence_items').bind().all()
    .results.map((r) => r.reference));
  const comps = new Set(env.DB.prepare('SELECT id FROM competencies').bind().all()
    .results.map((r) => r.id));

  const dangling = all.filter((r) => {
    for (const [t, id] of [[r.subject_type, r.subject_id], [r.object_type, r.object_id]]) {
      if (t === 'evidence' && !refs.has(id)) return true;
      if (t === 'competency' && !comps.has(id)) return true;
    }
    return false;
  });
  check('No relation points at an evidence item or competency that does not exist',
    dangling.length === 0,
    dangling.map((r) => `${r.subject_id} -${r.predicate}-> ${r.object_id}`).join('; '));

  // Governance references must exist in the decisions document, or the
  // graph cites a decision nobody can read.
  const govDoc = readFileSync(path.join(ROOT, 'docs/governance-decisions.md'), 'utf8');
  const govRefs = [...new Set(all.filter((r) => r.subject_type === 'governance').map((r) => r.subject_id))];
  const unknownGov = govRefs.filter((g) => !new RegExp(`###\\s*${g}\\.`).test(govDoc));
  check('Every governance decision cited by the graph exists in the decisions document',
    unknownGov.length === 0, unknownGov.join(', '));

  const kpiIds = [...new Set(all.filter((r) => r.object_type === 'kpi').map((r) => r.object_id))];
  const metricsSrc = readFileSync(path.join(ROOT, 'functions/_lib/reports/institutional.js'), 'utf8');
  const unknownKpi = kpiIds.filter((k) => !metricsSrc.includes(`'${k}'`));
  check('Every KPI cited by the graph exists in the Metric Register',
    unknownKpi.length === 0, unknownKpi.join(', '));
}

// ---------------------------------------------------------------------
// One decision, everything it holds shut
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const impact = await E.governanceImpact(env, { decisionRef: 'A6d' });
  check('A governance decision names what it affects', impact.evidenceAffected.length >= 2,
    impact.evidenceAffected.length);
  check('...including the assessment-to-competency map',
    impact.evidenceAffected.some((e) => e.reference === 'CM-002'));
  // The number that makes a decision feel urgent rather than
  // administrative — and it counts every entry the decision would
  // unblock, not only those in one particular blocked state. A6d holds
  // shut both the competency map (governance_pending) and structured
  // learning outcomes (not_instrumented, because outcomes cannot be
  // structured until the mapping exists). An earlier version counted
  // only the first and understated the impact of the decision that most
  // needs taking.
  check('...and counts every entry it is holding shut, in any blocked state',
    impact.evidenceBlocked === 2, JSON.stringify(impact.blockedByState));
  check('...broken down by why each is blocked',
    impact.blockedByState.governance_pending === 1 && impact.blockedByState.not_instrumented === 1,
    JSON.stringify(impact.blockedByState));

  const d1 = await E.governanceImpact(env, { decisionRef: 'D1' });
  check('A data-protection decision reaches the policy register',
    d1.evidenceAffected.some((e) => e.reference === 'POL-001'));

  // Both directions: the policy must know which decisions govern it.
  const pol = await E.evidenceItem(env, { reference: 'POL-001', now: T0 });
  check('An evidence item knows which decisions are blocking it',
    pol.related.incoming.filter((r) => r.otherType === 'governance').length === 3,
    pol.related.incoming.length);
  check('...and the framework knows what it defines',
    (await E.evidenceItem(env, { reference: 'AREG-001', now: T0 }))
      .related.outgoing.some((r) => r.otherId === 'CF-001'));

  const gone = await throws(() => E.evidenceItem(env, { reference: 'NOPE-999' }));
  check('An unknown reference is a clean NotFound', gone && gone.name === 'NotFoundError');
}

// ---------------------------------------------------------------------
// THE REGISTER MUST NOT CALL AN ADOPTED DECISION UNADOPTED.
//
// Five evidence statements ended "Governance B3; not adopted." and
// similar. They were accurate for months. On 14 August 2026 the
// Executive adopted all twenty-five outstanding decisions, and from
// that moment the register was telling a reviewer the College was
// blocked on decisions it had already taken — the same shape of defect
// as the pages that went on saying "proposed" after adoption, and
// caught the same way: by reading the decisions register and requiring
// the evidence register to agree with it.
//
// The summary card above the table said it too, and worse: "Drafted,
// and waiting on a decision that has not been taken. These are not
// missing documents." Nine of the fourteen rows underneath it begin
// "No procedure exists", "No terms of reference exist", "The College
// has no written constitution". The card contradicted its own table.
{
  const seed = readFileSync(path.join(ROOT, 'sql/seed-evidence-centre.sql'), 'utf8');
  const gov = readFileSync(path.join(ROOT, 'docs/governance-decisions.md'), 'utf8');
  const outstanding = (gov.match(/\*\*Decision:\*\*\s*☐\s*awaiting/g) || []).length;

  // The binding: while nothing is outstanding, nothing in the evidence
  // register may describe a decision as unadopted.
  const stale = [...seed.matchAll(/[^']{0,90}not adopted[^']{0,40}/g)].map((m) => m[0].trim());
  check(`No evidence statement calls a decision unadopted — ${outstanding} still outstanding`,
    outstanding > 0 || stale.length === 0,
    stale.slice(0, 3).join(' | '));

  // Not a bare-word ban: the register is entitled to say a document has
  // not been written, and must keep saying so. What it may not do is
  // attribute that to a decision nobody took.
  check('...and it still says plainly which documents do not exist',
    (seed.match(/No procedure exists|no written constitution|No terms of reference exist|No risk register exists/g) || []).length >= 4);

  const evidencePage = readFileSync(path.join(ROOT, 'pages/governance-evidence.html'), 'utf8');
  check('The published page no longer calls the pending items drafted',
    !/Drafted, and waiting on a decision that has not been taken/.test(evidencePage));
  check('...and names the date the decisions were in fact taken',
    /14 August 2026/.test(evidencePage));

  // A sweep that only ever sees compliant text proves nothing.
  check('...and these checks do catch the wording they exist for',
    /[^']{0,90}not adopted[^']{0,40}/.test("'Governance B3; not adopted.'")
    && /Drafted, and waiting on a decision that has not been taken/
      .test('<p>Drafted, and waiting on a decision that has not been taken.</p>'));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
