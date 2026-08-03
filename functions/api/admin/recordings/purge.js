// POST /api/admin/recordings/purge
//
// Runs the retention policy. Staff only.
//
// It is an endpoint rather than a scheduled handler because Pages
// Functions have no cron trigger — a Worker does, Pages does not. The
// schedule therefore lives outside the application
// (.github/workflows/retention-purge.yml), which has the side benefit
// that every purge leaves a run record somewhere durable rather than
// happening invisibly.
//
// Defaults to a DRY RUN. Deleting a learner's coursework is not
// something an accidental request should be able to do, so destroying
// data requires saying so explicitly.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../../_lib/db.js';
import { requireStaff } from '../../../_lib/auth/session.js';
import { purgeExpiredRecordings, purgeRecordingsForUser } from '../../../_lib/lms/recording-storage.js';

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    const { confirm = false, limit = 200, userId = null } = body || {};

    // Erasure on request: a named person asking for their audio to go.
    // Distinct from retention expiry and never merely scheduled, so it
    // always requires the explicit confirm.
    if (userId) {
      if (confirm !== true) {
        throw new ValidationError('Erasing a learner\'s recordings requires confirm: true.', { confirm: 'Required' });
      }
      const result = await purgeRecordingsForUser(env, { userId });
      return jsonResponse({ mode: 'user-erasure', requestedBy: staff.id, ...result });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new ValidationError('limit must be an integer between 1 and 1000.', { limit: 'Invalid' });
    }
    const result = await purgeExpiredRecordings(env, { limit, dryRun: confirm !== true });
    return jsonResponse({ mode: 'retention', requestedBy: staff.id, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}
