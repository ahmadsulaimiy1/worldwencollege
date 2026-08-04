/* The Accreditation Evidence Centre — the College's institutional
 * memory — and the relation model that connects it to everything else.
 *
 * ────────────────────────────────────────────────────────────────
 * WHAT THIS IS NOT
 * ────────────────────────────────────────────────────────────────
 * Worldwide English College holds no accreditation, recognition or
 * affiliation, and has applied for none. This is the instrument by which
 * the College evaluates ITSELF. Every view built on it carries that
 * statement, and `DISCLAIMER` below is the single source of it so no
 * page can render the register without it.
 *
 * ────────────────────────────────────────────────────────────────
 * THE ABSENCE OF EVIDENCE IS ITSELF EVIDENCE
 * ────────────────────────────────────────────────────────────────
 * The ordinary failure of a system like this is that it lists what the
 * institution HAS. A reviewer then sees fourteen populated rows and
 * infers that fourteen is the whole of it. Here every item the College
 * has undertaken to hold is registered whether or not it exists, and the
 * summary reports the gaps as prominently as the holdings — currently 14
 * evidenced against 23 not.
 *
 * ────────────────────────────────────────────────────────────────
 * RELATIONS ARE PROPOSED BEFORE THEY ARE TRUE
 * ────────────────────────────────────────────────────────────────
 * "This lesson teaches this competency" is an academic judgement, not a
 * computation. A graph that inferred it from a lesson title would look
 * complete and be fiction — and it would be fiction nobody could detect,
 * because a plausible mapping is indistinguishable from a real one.
 *
 * So every relation is `proposed` until an academic reviewer approves
 * it, and `approvedRelations()` — the query that feeds every academic
 * conclusion — reads approved edges only. Proposed edges are how the
 * mapping work gets done; they are visible, and they never count.
 */
import { db, ValidationError, NotFoundError } from '../db.js';

export const DISCLAIMER = 'Worldwide English College holds no accreditation, recognition or affiliation from any external body, and has applied for none. The Accreditation Evidence Centre is an INTERNAL quality-assurance instrument by which the College evaluates its own practice. Nothing in it constitutes, implies or anticipates external recognition.';

export const STATES = ['exists', 'scheduled', 'governance_pending', 'not_instrumented', 'not_applicable'];

/** The states in which the College can actually show a reviewer something. */
const EVIDENCED = new Set(['exists']);

export const COLLECTIONS = [
  'Governance', 'Academic Regulations', 'Assessment Regulations', 'Quality Assurance',
  'Programme Specifications', 'Curriculum Maps', 'Learning Outcomes', 'Competency Framework',
  'External Review Reports', 'Internal Review Reports', 'Annual Monitoring', 'Risk Registers',
  'Student Feedback', 'Graduate Outcomes', 'Assessment Moderation', 'Appeals',
  'Academic Integrity', 'Staff Development', 'Faculty Qualifications', 'Policy Register',
  'Continuous Improvement Register', 'Executive Decisions', 'Institutional Self-Evaluation',
];

const newId = (p) => `${p}_${crypto.randomUUID()}`;

const SELECT_ITEM = `SELECT id, reference, collection, title, state, statement,
    source_path AS sourcePath, classification, retention,
    owner_role AS ownerRole, author_role AS authorRole, reviewer_role AS reviewerRole,
    approver_role AS approverRole, approved_at AS approvedAt,
    review_interval_months AS reviewIntervalMonths, next_review_at AS nextReviewAt,
    version, supersedes_id AS supersedesId, created_at AS createdAt, updated_at AS updatedAt
  FROM evidence_items`;

/**
 * Review status, derived rather than stored.
 *
 * A stored status is a status that goes stale the moment nobody updates
 * it, which is exactly the failure a review schedule exists to prevent.
 */
function reviewStatus(item, now) {
  if (!item.nextReviewAt) return item.reviewIntervalMonths ? 'not_scheduled' : 'no_schedule';
  const due = Date.parse(item.nextReviewAt);
  if (due <= now) return 'overdue';
  if (due - now <= 30 * 86400000) return 'due_soon';
  return 'current';
}

/** The whole register, or one collection of it. */
export async function evidenceRegister(env, { collection = null, state = null, now = Date.now() } = {}) {
  const { results } = await db(env)
    .prepare(`${SELECT_ITEM}
               WHERE (? IS NULL OR collection = ?) AND (? IS NULL OR state = ?)
               ORDER BY collection, reference`)
    .bind(collection, collection, state, state).all();

  const items = results.map((i) => ({ ...i, reviewStatus: reviewStatus(i, now) }));

  const byState = {};
  const byCollection = {};
  for (const i of items) {
    byState[i.state] = (byState[i.state] || 0) + 1;
    const c = byCollection[i.collection] || (byCollection[i.collection] = { total: 0, evidenced: 0 });
    c.total++;
    if (EVIDENCED.has(i.state)) c.evidenced++;
  }

  // Collections the Executive named that hold nothing at all. Reported
  // explicitly: a collection missing from the listing reads as a
  // collection nobody thought of, rather than one that is empty.
  const empty = COLLECTIONS.filter((c) => !byCollection[c]);

  const evidenced = items.filter((i) => EVIDENCED.has(i.state)).length;
  return {
    disclaimer: DISCLAIMER,
    summary: {
      total: items.length,
      evidenced,
      notEvidenced: items.length - evidenced,
      byState,
      collections: COLLECTIONS.length,
      collectionsWithNoItems: empty,
      overdueReviews: items.filter((i) => i.reviewStatus === 'overdue').length,
    },
    byCollection,
    items,
  };
}

/**
 * One item, with its history and everything it is connected to.
 *
 * The cross-references are the point. A reviewer reading a governance
 * decision needs to see every policy, programme, assessment, competency
 * and metric it bears on, without knowing to go looking.
 */
export async function evidenceItem(env, { reference, now = Date.now() }) {
  const item = await db(env).prepare(`${SELECT_ITEM} WHERE reference = ?`).bind(reference).first();
  if (!item) throw new NotFoundError('No evidence item with that reference.');

  const [versions, related] = await Promise.all([
    db(env).prepare(`SELECT version, state, statement, source_path AS sourcePath,
                            change_note AS changeNote, recorded_at AS recordedAt
                       FROM evidence_versions WHERE evidence_id = ? ORDER BY version DESC`)
      .bind(item.id).all(),
    relationsFor(env, { type: 'evidence', id: item.reference }),
  ]);

  return { ...item, reviewStatus: reviewStatus(item, now), versions: versions.results, related };
}

/**
 * Revise an item, keeping what it used to say.
 *
 * The previous state is written to `evidence_versions` BEFORE the update,
 * so a failure between the two leaves the history complete and the item
 * stale — which is recoverable — rather than the item updated and its
 * history missing, which is not.
 */
export async function reviseEvidence(env, {
  reference, changes = {}, changeNote, changedBy = null, now = Date.now(),
}) {
  const note = String(changeNote || '').trim();
  if (note.length < 10) {
    throw new ValidationError('A revision to the evidence register must say what changed and why.', { changeNote: 'Required' });
  }
  const item = await db(env).prepare('SELECT * FROM evidence_items WHERE reference = ?').bind(reference).first();
  if (!item) throw new NotFoundError('No evidence item with that reference.');

  if (changes.state !== undefined && !STATES.includes(changes.state)) {
    throw new ValidationError(`Unknown evidence state: ${changes.state}.`, { state: 'Invalid' });
  }
  const nextState = changes.state ?? item.state;
  const nextPath = changes.sourcePath !== undefined ? changes.sourcePath : item.source_path;
  if (nextState === 'exists' && !nextPath) {
    throw new ValidationError(
      'Evidence that exists must say where it is. An item citing no source cannot be produced for a reviewer.',
      { sourcePath: 'Required' },
    );
  }

  await db(env)
    .prepare(`INSERT INTO evidence_versions (id, evidence_id, version, state, statement, source_path, changed_by, change_note, recorded_at)
              VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(newId('evv'), item.id, item.version, item.state, item.statement, item.source_path,
      changedBy, note, new Date(now).toISOString())
    .run();

  const sets = ['version = version + 1', 'updated_at = ?'];
  const binds = [new Date(now).toISOString()];
  const map = {
    state: 'state', statement: 'statement', sourcePath: 'source_path', title: 'title',
    classification: 'classification', retention: 'retention', ownerRole: 'owner_role',
    authorRole: 'author_role', reviewerRole: 'reviewer_role', approverRole: 'approver_role',
    approvedAt: 'approved_at', nextReviewAt: 'next_review_at',
  };
  for (const [k, col] of Object.entries(map)) {
    if (changes[k] === undefined) continue;
    sets.push(`${col} = ?`); binds.push(changes[k]);
  }
  binds.push(item.id);
  await db(env).prepare(`UPDATE evidence_items SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();

  return evidenceItem(env, { reference, now });
}

// ---------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------

/**
 * Assert a relation. PROPOSED — never true on assertion alone.
 *
 * The default is deliberate and load-bearing. A function that could
 * create an approved edge in one call is a function through which an
 * import script silently becomes an academic authority.
 */
export async function relate(env, {
  subjectType, subjectId, predicate, objectType, objectId,
  assertedBy = null, note = null, now = Date.now(),
}) {
  for (const [k, v] of Object.entries({ subjectType, subjectId, predicate, objectType, objectId })) {
    if (!v || !String(v).trim()) throw new ValidationError(`${k} is required to assert a relation.`, { [k]: 'Required' });
  }
  const existing = await db(env)
    .prepare(`SELECT id, status FROM academic_relations
               WHERE subject_type = ? AND subject_id = ? AND predicate = ? AND object_type = ? AND object_id = ?`)
    .bind(subjectType, subjectId, predicate, objectType, objectId).first();
  // Re-asserting an existing relation is not a second fact, and must not
  // silently reset an approved edge to proposed.
  if (existing) return { id: existing.id, status: existing.status, created: false };

  const id = newId('rel');
  await db(env)
    .prepare(`INSERT INTO academic_relations (id, subject_type, subject_id, predicate, object_type, object_id, status, asserted_by, note, created_at)
              VALUES (?,?,?,?,?,?, 'proposed', ?,?,?)`)
    .bind(id, subjectType, subjectId, predicate, objectType, objectId, assertedBy, note, new Date(now).toISOString())
    .run();
  return { id, status: 'proposed', created: true };
}

/** An academic reviewer accepts a relation. Only these count. */
export async function approveRelation(env, { relationId, approvedBy, now = Date.now() }) {
  if (!approvedBy) {
    throw new ValidationError(
      'Approving an academic relation records who accepted it. An approval with no approver is an assertion.',
      { approvedBy: 'Required' },
    );
  }
  const row = await db(env).prepare('SELECT id, status FROM academic_relations WHERE id = ?').bind(relationId).first();
  if (!row) throw new NotFoundError('Unknown relation.');
  if (row.status === 'approved') return { relationId, status: 'approved', changed: false };
  await db(env)
    .prepare("UPDATE academic_relations SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?")
    .bind(approvedBy, new Date(now).toISOString(), relationId).run();
  return { relationId, status: 'approved', changed: true };
}

export async function retireRelation(env, { relationId, now = Date.now() }) {
  const row = await db(env).prepare('SELECT id FROM academic_relations WHERE id = ?').bind(relationId).first();
  if (!row) throw new NotFoundError('Unknown relation.');
  // Retired, never deleted. A relation the College once asserted and
  // later withdrew is part of how its thinking changed.
  await db(env)
    .prepare("UPDATE academic_relations SET status = 'retired', retired_at = ? WHERE id = ?")
    .bind(new Date(now).toISOString(), relationId).run();
  return { relationId, status: 'retired' };
}

/**
 * Everything connected to one node, in both directions.
 *
 * Both directions matter: a governance decision needs to know what it
 * affects, and a policy needs to know which decision governs it. A
 * one-directional graph makes the second question require knowing the
 * answer in advance.
 */
export async function relationsFor(env, { type, id, status = null }) {
  const [out, incoming] = await Promise.all([
    db(env).prepare(`SELECT id, predicate, object_type AS otherType, object_id AS otherId,
                            status, note, approved_at AS approvedAt
                       FROM academic_relations
                      WHERE subject_type = ? AND subject_id = ? AND (? IS NULL OR status = ?)
                      ORDER BY predicate, object_id`)
      .bind(type, id, status, status).all(),
    db(env).prepare(`SELECT id, predicate, subject_type AS otherType, subject_id AS otherId,
                            status, note, approved_at AS approvedAt
                       FROM academic_relations
                      WHERE object_type = ? AND object_id = ? AND (? IS NULL OR status = ?)
                      ORDER BY predicate, subject_id`)
      .bind(type, id, status, status).all(),
  ]);
  return {
    outgoing: out.results,
    incoming: incoming.results,
    // Counted separately so a caller can see at a glance how much of
    // this node's graph is asserted but not yet accepted.
    approved: [...out.results, ...incoming.results].filter((r) => r.status === 'approved').length,
    proposed: [...out.results, ...incoming.results].filter((r) => r.status === 'proposed').length,
  };
}

/**
 * The approved graph only — the query every academic conclusion uses.
 *
 * Separate function rather than a parameter, so that reading unapproved
 * edges into an academic conclusion requires deliberately calling
 * something else.
 */
export async function approvedRelations(env, { predicate = null, subjectType = null, objectType = null } = {}) {
  const { results } = await db(env)
    .prepare(`SELECT id, subject_type AS subjectType, subject_id AS subjectId, predicate,
                     object_type AS objectType, object_id AS objectId, approved_at AS approvedAt
                FROM academic_relations
               WHERE status = 'approved'
                 AND (? IS NULL OR predicate = ?)
                 AND (? IS NULL OR subject_type = ?)
                 AND (? IS NULL OR object_type = ?)
               ORDER BY subject_type, subject_id, predicate`)
    .bind(predicate, predicate, subjectType, subjectType, objectType, objectType).all();
  return { count: results.length, relations: results };
}

/**
 * What one governance decision affects.
 *
 * The directive's central requirement: a decision should link to every
 * policy, programme, assessment, competency, KPI and document it bears
 * on, so that taking it makes the consequences visible rather than
 * leaving them to be rediscovered.
 */
export async function governanceImpact(env, { decisionRef }) {
  const rel = await relationsFor(env, { type: 'governance', id: decisionRef });
  const evidenceRefs = [...rel.outgoing, ...rel.incoming]
    .filter((r) => r.otherType === 'evidence').map((r) => r.otherId);

  let blocking = [];
  if (evidenceRefs.length) {
    const placeholders = evidenceRefs.map(() => '?').join(',');
    const { results } = await db(env)
      .prepare(`SELECT reference, collection, title, state FROM evidence_items
                 WHERE reference IN (${placeholders}) ORDER BY reference`)
      .bind(...evidenceRefs).all();
    blocking = results;
  }
  return {
    decision: decisionRef,
    relations: rel,
    evidenceAffected: blocking,
    // The number that makes a governance decision feel urgent rather
    // than administrative: how many register entries it is holding shut.
    //
    // Counted as "not yet evidenced", not as "governance_pending".
    // Deciding A6d unblocks CM-002 (pending on the decision) AND LO-001
    // (uninstrumented, because outcomes cannot be structured until the
    // mapping exists). Counting only the first understated the impact of
    // exactly the decision that most needs taking — found by a test
    // expecting 2 and getting 1.
    evidenceBlocked: blocking.filter((b) => b.state !== 'exists').length,
    blockedByState: blocking.reduce((acc, b) => {
      if (b.state !== 'exists') acc[b.state] = (acc[b.state] || 0) + 1;
      return acc;
    }, {}),
  };
}
