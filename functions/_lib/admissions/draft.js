// The wizard's in-progress state — one row per applicant account. See
// sql/migrations/018-admissions-wizard.sql for the schema and the
// reasoning (a JSON blob while provisional, promoted into a typed,
// constrained `applications` row only at final submission).

import { db, newId, ValidationError } from '../db.js';
import { STEP_KEYS, stepForField, validateStepFields } from './fields.js';

function parseDraftRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    data: JSON.parse(row.data || '{}'),
    completedSteps: JSON.parse(row.completed_steps || '[]'),
    submittedApplicationId: row.submitted_application_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDraft(env, userId) {
  const row = await db(env)
    .prepare('SELECT * FROM application_drafts WHERE user_id = ?')
    .bind(userId)
    .first();
  return parseDraftRow(row);
}

// Idempotent: a second call with no draft yet present creates exactly
// one row (D1/SQLite has no upsert-on-unique-conflict-return-existing
// primitive here, so this re-selects after a failed insert rather than
// racing two writers into two rows).
export async function getOrCreateDraft(env, userId) {
  const existing = await getDraft(env, userId);
  if (existing) return existing;

  const id = newId('draft');
  try {
    await db(env)
      .prepare('INSERT INTO application_drafts (id, user_id) VALUES (?, ?)')
      .bind(id, userId)
      .run();
  } catch {
    // Another request for the same user won the race — read what it wrote.
  }
  const row = await getDraft(env, userId);
  if (!row) throw new Error('Could not create or read an application draft.');
  return row;
}

// Saves one step's worth of fields, merging into whatever the draft
// already holds rather than replacing it — a step can be revisited
// without losing every other step's answers. Rejects a field that
// belongs to a DIFFERENT step, so a client bug in one step's form can
// never silently corrupt another step's already-saved data.
export async function saveDraftStep(env, userId, step, fields) {
  if (!STEP_KEYS.includes(step)) {
    throw new ValidationError('Unknown wizard step.', { step: 'Not a recognised step.' });
  }
  const misplaced = Object.keys(fields || {}).filter((f) => stepForField(f) !== step);
  if (misplaced.length) {
    throw new ValidationError('These fields do not belong to this step.', Object.fromEntries(misplaced.map((f) => [f, `Belongs to a different step.`])));
  }
  const fieldErrors = validateStepFields(fields);
  if (Object.keys(fieldErrors).length) {
    throw new ValidationError('Please check the highlighted fields.', fieldErrors);
  }

  const draft = await getOrCreateDraft(env, userId);
  const mergedData = { ...draft.data, ...fields };
  const completedSteps = draft.completedSteps.includes(step)
    ? draft.completedSteps
    : [...draft.completedSteps, step];

  await db(env)
    .prepare(`UPDATE application_drafts
      SET data = ?, completed_steps = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE user_id = ?`)
    .bind(JSON.stringify(mergedData), JSON.stringify(completedSteps), userId)
    .run();

  return getDraft(env, userId);
}

// Called by apply.js once a final submission succeeds, so the
// applicant's dashboard can show "submitted" against the real
// application rather than the wizard's own step-completion state. The
// draft row is kept, not deleted — it is the applicant's only record
// of what they originally entered step by step, and deleting it on
// success would erase exactly the audit trail a "did I actually submit
// this" support question needs.
export async function markDraftSubmitted(env, userId, applicationId) {
  await db(env)
    .prepare(`UPDATE application_drafts
      SET submitted_application_id = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE user_id = ?`)
    .bind(applicationId, userId)
    .run();
}
