/**
 * CONFERRAL — the act the whole register was built for, and the one act
 * nothing could perform.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT FAULT THIS FILE CORRECTS
 * ────────────────────────────────────────────────────────────────────
 * `conferAward()` in ./awards.js has existed since the register
 * shipped. It writes the chained, signed, verifiable row that every
 * other credential in this platform hangs from: /verify/[code] checks
 * it, `issued_documents` composes transcripts out of it, the public
 * roll lists it, and /my-award.html draws it as the certificate the
 * College sells at five per cent of every level fee.
 *
 * `grep -rn "conferAward" functions/` returns exactly one file — the
 * one that defines it. No endpoint calls it. The tests call it, the
 * browser harness calls it, and production cannot.
 *
 * So the College could compute that a learner had met every published
 * condition of an award, could report that position to them on
 * /my-standing.html, and had no way to confer it. Every certificate
 * page would have been empty for every real learner for ever, and the
 * chain that ends at a stranger typing a code into /verify/ had no
 * beginning.
 *
 * ────────────────────────────────────────────────────────────────────
 * NOTHING ABOUT AN AWARD IS TYPED BY A PERSON
 * ────────────────────────────────────────────────────────────────────
 * `conferAward()` takes a title, a post-nominal, a CEFR band, a credit
 * count and an hours figure as arguments, because it is the low-level
 * writer. A console that asked a Registrar to type them would be a
 * console where a slip puts the wrong words on somebody's certificate
 * for ever — `awards` stores them denormalised precisely so they can
 * never be corrected in place.
 *
 * Every one of them therefore comes from a record:
 *
 *   title, post-nominal, CEFR   `award_definitions`, one row per level
 *   credits, hours              `CREDIT` in academic/marks.js
 *   honour                      `honourFor()`, from the marks
 *   holder name                 `users.preferred_name`
 *
 * The ONLY things a person supplies are the citation — which is a
 * sentence about this graduate and cannot come from a table — and
 * whether the graduate consented to appear on the public roll.
 *
 * ────────────────────────────────────────────────────────────────────
 * AND IT REFUSES ON THE SAME SET THAT PROGRESSION REFUSES ON
 * ────────────────────────────────────────────────────────────────────
 * `grad.level_award.all_of` — every published condition, and nothing
 * beyond them. standing.js already computes that set and
 * `graduationPosition()` already reduces it to four states. This file
 * confers on `eligible` and on nothing else, and its refusal quotes the
 * outstanding conditions rather than saying no.
 *
 * There is deliberately NO override. A conferral that a Registrar could
 * force past an unmet condition is a conferral that will one day be
 * forced, and the College's entire public position is that its awards
 * mean what the regulations say they mean.
 */

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { computeLearnerStanding } from '../academic/standing.js';
import { CREDIT } from '../academic/marks.js';
import { conferAward, revokeAward, replaceAward, HONOURS, HONOUR_LABEL, HONOUR_LABEL_AR } from './awards.js';

/** Prose fit for the face of a certificate: trimmed, bounded, no controls. */
function citationOf(value, { required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) throw new ValidationError('A citation is required.', { citation: 'Required.' });
    return null;
  }
  const v = String(value).replace(/\r\n?/g, '\n').trim();
  if (!v) return null;
  if (v.length > 600) {
    throw new ValidationError(
      'A citation is one or two sentences. Beyond six hundred characters it stops fitting on a certificate.',
      { citation: 'At most 600 characters.' },
    );
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B-\u001F\u007F]/.test(v)) {
    throw new ValidationError('A citation cannot contain control characters.', { citation: 'Invalid characters.' });
  }
  return v;
}

function reasonOf(value) {
  const v = String(value === null || value === undefined ? '' : value).replace(/\r\n?/g, '\n').trim();
  if (v.length < 10) {
    throw new ValidationError(
      'A reason is required, and it is read by the holder. Withdrawing or replacing an award without one leaves a person unable to find out why.',
      { reason: 'At least 10 characters.' },
    );
  }
  if (v.length > 1000) {
    throw new ValidationError('A reason is at most a thousand characters.', { reason: 'At most 1000 characters.' });
  }
  return v;
}

/**
 * The award this level confers, as the College has defined it.
 *
 * Returns null where no definition exists, and the caller reports that
 * BY NAME rather than composing a title. A level with no adopted award
 * definition is the College's unfinished work, and inventing "Level IV
 * Award" to get past it would put a title on a certificate that no
 * instrument adopted.
 */
export async function definitionFor(env, levelId) {
  const row = await db(env)
    .prepare(`SELECT id, level_id AS levelId, official_title AS officialTitle,
                     post_nominal AS postNominal, cefr, standing, academic_purpose AS academicPurpose,
                     graduate_profile AS graduateProfile, learning_outcomes AS learningOutcomes
                FROM award_definitions WHERE level_id = ?`)
    .bind(levelId)
    .first();
  return row || null;
}

/**
 * One candidate at one level: where they stand, what would be conferred,
 * and what — if anything — stops it.
 *
 * This is the object the console renders BEFORE offering the act, so a
 * Registrar reads the conditions and the exact wording of the award
 * before they confer rather than after.
 */
export async function conferralFor(env, { userId, levelId }) {
  const level = Number(levelId);
  if (!Number.isInteger(level) || level < 1 || level > 6) {
    throw new ValidationError('A programme level is a whole number from 1 to 6.', { levelId: 'Not a level.' });
  }

  const account = await db(env)
    .prepare('SELECT id, preferred_name AS name, email FROM users WHERE id = ?')
    .bind(userId).first();
  if (!account) throw new NotFoundError('Unknown person.');

  const standing = await computeLearnerStanding(env, userId);
  const position = standing.levels.find((l) => l.levelId === level) || null;
  const definition = await definitionFor(env, level);

  // The blockers, each named. Order matters only in that the reader
  // should see the academic ones first — those are about the candidate;
  // the rest are about the College's own records.
  const blockers = [];
  if (!position) {
    blockers.push({
      id: 'no_record',
      detail: 'This learner has no record at that level.',
      owner: 'college',
    });
  } else if (position.graduation.state === 'conferred') {
    blockers.push({
      id: 'already_conferred',
      detail: `An award is already held at this level, conferred on ${position.graduation.conferredOn}.`,
      owner: 'college',
    });
  } else if (position.graduation.state !== 'eligible') {
    for (const c of position.graduation.outstandingConditions) {
      blockers.push({ id: c.id, detail: `${c.label} — ${c.detail}`, owner: c.owner });
    }
  } else {
    // Governance C5 (adopted 14 August 2026): conferral is "on the
    // authority of the Registrar acting under a Board-approved pass
    // list" — the review and the write are never the same act by the
    // same person. Meeting the academic conditions is not, by itself,
    // authority to confer; a Registrar also needs a real, recorded,
    // independent confirmation on file. See registry/pass-list.js,
    // whose own confer() enforces this same rule for its own callers.
    const passListEntry = await db(env)
      .prepare(`SELECT id FROM pass_list_entries
                 WHERE user_id = ? AND level_id = ? AND decision = 'confirmed'
                   AND superseded = 0 AND conferred_award_id IS NULL
                 ORDER BY created_at DESC LIMIT 1`)
      .bind(userId, level).first();
    if (!passListEntry) {
      blockers.push({
        id: 'no_pass_list_confirmation',
        detail: 'No Independent Examiner has confirmed this award on the pass list yet — see /examiner-review.html.',
        owner: 'college',
      });
    }
  }
  if (!definition) {
    blockers.push({
      id: 'no_award_definition',
      detail: `The College has adopted no award definition for Level ${level}, so there is no title to confer.`,
      owner: 'college',
    });
  }
  if (!account.name || String(account.name).trim().length < 2) {
    blockers.push({
      id: 'no_holder_name',
      detail: 'The account holds no name. A certificate names a person, and the College does not invent one.',
      owner: 'college',
    });
  }

  const honour = position ? position.honour : null;

  return {
    candidate: { id: account.id, name: account.name, email: account.email },
    levelId: level,
    // EXACTLY what would be written, composed from records and shown
    // before the act. See the head of this file.
    award: definition
      ? {
        levelId: level,
        awardTitle: definition.officialTitle,
        postNominal: definition.postNominal,
        cefr: definition.cefr,
        standing: definition.standing,
        credits: CREDIT.perLevel,
        tqtHours: CREDIT.tqtHoursPerLevel,
        honour: honour && honour.honour ? honour.honour.code : null,
        honourLabel: honour && honour.honour ? HONOUR_LABEL[honour.honour.code] : null,
        honourLabelAr: honour && honour.honour ? HONOUR_LABEL_AR[honour.honour.code] : null,
        holderName: account.name,
      }
      : null,
    // The award id where one is held, so the console can offer
    // withdrawal without a second round trip to find it.
    awardId: position ? position.graduation.awardId : null,
    position: position
      ? {
        state: position.graduation.state,
        levelMark: position.levelMark.mark,
        conditions: position.graduation.conditions,
        outstanding: position.graduation.outstandingConditions,
        learnerOwes: position.graduation.learnerOwes,
      }
      : null,
    blockers,
    mayConfer: blockers.length === 0,
    regulationVersion: standing.regulationVersion,
  };
}

/**
 * The queue: everyone the College could confer on, and everyone it
 * nearly could.
 *
 * BOUNDED BY A CHEAP QUERY FIRST. computeLearnerStanding() is a dozen
 * reads per learner, so running it over every account would make this
 * console unopenable the day the College has a thousand of them. The
 * candidate set is drawn from `enrolments` — a learner with no
 * enrolment at a level cannot be conferred at it — and only then is the
 * expensive read done.
 *
 * THREE GROUPS, and the middle one is the point of the screen:
 *
 *   eligible    — every published condition met. The Registrar acts.
 *   conditional — the LEARNER owes nothing and the COLLEGE does. These
 *                 are the people waiting on the College, and a console
 *                 that only listed the ready ones would hide them.
 *   conferred   — held, with the code, so the screen is a register and
 *                 not just an inbox.
 */
export async function conferralQueue(env, { limit = 100 } = {}) {
  const rows = (await db(env)
    .prepare(`SELECT DISTINCT e.user_id AS userId, e.level_id AS levelId
                FROM enrolments e
               WHERE e.status IN ('active','completed')
               ORDER BY e.user_id, e.level_id
               LIMIT ?`)
    .bind(Math.max(1, Math.min(500, Number(limit) || 100)))
    .all()).results;

  const byUser = new Map();
  for (const r of rows) {
    if (!byUser.has(r.userId)) byUser.set(r.userId, []);
    byUser.get(r.userId).push(r.levelId);
  }

  const eligible = [];
  const conditional = [];
  const conferred = [];

  for (const [userId, levels] of byUser) {
    const standing = await computeLearnerStanding(env, userId);
    const account = await db(env)
      .prepare('SELECT preferred_name AS name, email FROM users WHERE id = ?')
      .bind(userId).first();
    for (const levelId of levels) {
      const position = standing.levels.find((l) => l.levelId === levelId);
      if (!position) continue;
      const entry = {
        userId,
        name: (account && account.name) || (account && account.email) || userId,
        levelId,
        roman: position.roman,
        levelName: position.name,
        state: position.graduation.state,
        levelMark: position.levelMark.mark,
        honour: position.honour && position.honour.honour ? position.honour.honour.code : null,
        outstanding: position.graduation.outstandingConditions.map((c) => ({
          id: c.id, label: c.label, detail: c.detail, owner: c.owner,
        })),
        awardCode: null,
        conferredOn: position.graduation.conferredOn,
      };
      if (entry.state === 'conferred') {
        const award = await db(env)
          .prepare(`SELECT verification_code AS code FROM awards
                     WHERE user_id = ? AND level_id = ? AND status = 'conferred' LIMIT 1`)
          .bind(userId, levelId).first();
        entry.awardCode = award ? award.code : null;
        conferred.push(entry);
      } else if (entry.state === 'eligible') {
        eligible.push(entry);
      } else if (entry.state === 'conditional') {
        conditional.push(entry);
      }
      // `not_eligible` is deliberately absent. It means the LEARNER has
      // work outstanding, and a conferral console is not the place a
      // Registrar reads about somebody's unfinished modules — that is
      // /staff-learners.html, where the teaching relation is checked.
    }
  }

  return {
    eligible,
    conditional,
    conferred,
    basis: 'Every learner with a live or completed enrolment, at each level they hold one. Learners with work of their own outstanding are not listed here: that is a teaching matter and is read on My Learners.',
    honours: HONOURS.map((code) => ({ code, label: HONOUR_LABEL[code], labelAr: HONOUR_LABEL_AR[code] })),
  };
}

/**
 * Confer.
 *
 * Every value but the citation and the consent is read from a record.
 * The refusal is the position's own outstanding conditions, quoted, so
 * a Registrar told no is told what would change it.
 */
export async function confer(env, {
  actor, userId, levelId, citation = null, publicConsent = false, at = nowIso(),
} = {}) {
  if (!actor || !actor.id) throw new ValidationError('A Registrar is required.', { actor: 'Required.' });

  const view = await conferralFor(env, { userId, levelId });
  if (!view.mayConfer) {
    throw new ValidationError(
      `This award cannot be conferred yet: ${view.blockers.map((b) => b.detail).join(' · ')}`,
      Object.fromEntries(view.blockers.map((b) => [b.id, b.detail])),
    );
  }

  const a = view.award;
  const result = await conferAward(env, {
    userId,
    levelId: a.levelId,
    awardTitle: a.awardTitle,
    postNominal: a.postNominal,
    cefr: a.cefr,
    honour: a.honour || 'pass',
    credits: a.credits,
    tqtHours: a.tqtHours,
    holderName: a.holderName,
    citation: citationOf(citation),
    publicConsent: Boolean(publicConsent),
    actorId: actor.id,
    now: Date.parse(at),
  });

  // The eligibility row is brought into line with the register in the
  // same act. Two records of one event that can disagree is how a
  // learner comes to be told they are eligible for an award they
  // already hold.
  //
  // WRITTEN WHERE THERE IS NONE, not only updated. standing.js persists
  // an eligibility row when it computes one, but a learner conferred on
  // in the same session that first read their standing may have none
  // yet — and an UPDATE that matched no row would leave the register
  // holding a conferral the eligibility table denies.
  const existing = await db(env)
    .prepare('SELECT id FROM graduation_eligibility WHERE user_id = ? AND level_id = ?')
    .bind(userId, a.levelId).first();
  if (existing) {
    await db(env)
      .prepare(`UPDATE graduation_eligibility
                   SET state = 'conferred', award_id = ?, assessed_on = ?, assessed_by = ?
                 WHERE id = ?`)
      .bind(result.id, at.slice(0, 10), actor.id, existing.id)
      .run();
  } else {
    await db(env)
      .prepare(`INSERT INTO graduation_eligibility
                  (id, user_id, level_id, state, outstanding, award_id,
                   assessed_on, assessed_by, regulation_version)
                VALUES (?, ?, ?, 'conferred', NULL, ?, ?, ?, ?)`)
      .bind(newId('gel'), userId, a.levelId, result.id,
        at.slice(0, 10), actor.id, view.regulationVersion)
      .run();
  }

  // Closes the pass-list entry conferralFor() required above — the
  // examiner's confirmation and this act are chained the same way
  // registry/pass-list.js's own confer() chains them, whichever route
  // wrote the award.
  await db(env)
    .prepare(`UPDATE pass_list_entries SET conferred_award_id = ?
               WHERE user_id = ? AND level_id = ? AND decision = 'confirmed'
                 AND superseded = 0 AND conferred_award_id IS NULL`)
    .bind(result.id, userId, a.levelId).run();

  return { award: conferredView(result), conferredBy: actor.id, at };
}

/**
 * What a conferral hands back.
 *
 * MAPPED, not raw. conferAward() is the low-level writer and returns
 * the row it inserted, in the column names the table uses. Every other
 * award-shaped payload in this platform is the camelCase public view,
 * and a console reading `verification_code` in one branch and
 * `verificationCode` in another is a console with one of the two
 * spellings wrong wherever nobody exercised it. One mapper, used by
 * both conferral and replacement, cannot disagree with itself.
 */
function conferredView(row) {
  return {
    id: row.id,
    verificationCode: row.verification_code,
    awardTitle: row.award_title,
    postNominal: row.post_nominal,
    levelId: row.level_id,
    cefr: row.cefr,
    honour: row.honour,
    credits: row.credits,
    tqtHours: row.tqt_hours,
    holderName: row.holder_name,
    citation: row.citation ?? null,
    conferredOn: row.conferred_on,
    status: row.status,
    seq: row.seq,
    digest: row.digest,
    signature: row.signature ? { kid: row.signature.kid, mode: row.signature.mode } : null,
  };
}

/**
 * Withdrawal and replacement, in two acts — governance C5.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS IS NOT A SINGLE FUNCTION, THE WAY confer() IS NOT EITHER
 * ─────────────────────────────────────────────────────────────────────
 * C5's rule for conferral is that the review and the write are never
 * the same act by the same person — an Independent Examiner confirms,
 * a different administrator executes. C5's rule for withdrawal and
 * replacement is the same shape for a stronger reason: "withdrawing an
 * award is the one operation in the system that destroys something a
 * person owns, and it should not be within the unilateral power of any
 * single account, including the founder's." So an administrator
 * PROPOSES the act with a reason (requestWithdrawal / requestReplacement)
 * and a DIFFERENT administrator's countersignature is what actually
 * executes it (countersignActionRequest). Proposing alone writes only
 * to award_action_requests (migration 026); the awards table is
 * untouched until countersignature.
 *
 * validateReplacementChanges() is called at BOTH proposal and
 * countersignature — at proposal so a bad request is refused
 * immediately rather than discovered by the second officer, and again
 * at countersignature as the actual gate before the write, since a
 * request is data at rest between the two acts and is re-validated
 * rather than trusted.
 */
function validateReplacementChanges(changes) {
  const allowed = {};
  if (changes.holderName !== undefined) {
    const name = String(changes.holderName || '').trim();
    if (name.length < 2) {
      throw new ValidationError('A certificate names a person.', { holderName: 'Required.' });
    }
    allowed.holderName = name;
  }
  if (changes.citation !== undefined) allowed.citation = citationOf(changes.citation);
  if (!Object.keys(allowed).length) {
    throw new ValidationError(
      'A replacement changes something. The two things a replacement may change are the holder\'s name and the citation; a mark, a level or an honour is not corrected by reissue.',
      { changes: 'Nothing to change.' },
    );
  }
  return allowed;
}

async function insertActionRequest(env, { awardId, action, reason, changes, actor }) {
  if (!actor || !actor.id) throw new ValidationError('A Registrar is required.', { actor: 'Required.' });
  const award = await db(env).prepare('SELECT id FROM awards WHERE id = ?').bind(awardId).first();
  if (!award) throw new NotFoundError('Unknown award.');
  const id = newId('aar');
  await db(env).prepare(
    `INSERT INTO award_action_requests (id, award_id, action, reason, changes, proposed_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).bind(id, awardId, action, reasonOf(reason), changes ? JSON.stringify(changes) : null, actor.id).run();
  return requestView(await loadActionRequest(env, id));
}

/**
 * Propose withdrawing an award. Writes nothing to `awards` — see the
 * head comment above. The reason is required and is not a formality:
 * once executed, verification publishes it and /my-award.html draws it
 * on the holder's own screen.
 */
export async function requestWithdrawal(env, { actor, awardId, reason } = {}) {
  return insertActionRequest(env, { awardId, action: 'withdraw', reason, changes: null, actor });
}

/**
 * Propose replacing an award — the corrected-name case, and the only
 * one the College publishes. /admissions/international/ promises that
 * "a misspelt, mis-ordered or changed name is corrected by writing to
 * the Registrar, and digital certificates and transcripts are reissued
 * free for life", and that "the earlier form is kept, so an old
 * certificate still verifies" — replaceAward() already does exactly
 * that; countersignActionRequest() is the act that reaches it.
 */
export async function requestReplacement(env, { actor, awardId, reason, changes = {} } = {}) {
  const allowed = validateReplacementChanges(changes);
  return insertActionRequest(env, { awardId, action: 'replace', reason, changes: allowed, actor });
}

async function loadActionRequest(env, requestId) {
  const row = await db(env).prepare('SELECT * FROM award_action_requests WHERE id = ?').bind(requestId).first();
  if (!row) throw new NotFoundError('Unknown request.');
  return row;
}

function requestView(row) {
  return {
    id: row.id,
    awardId: row.award_id,
    action: row.action,
    reason: row.reason,
    changes: row.changes ? JSON.parse(row.changes) : null,
    proposedBy: row.proposed_by,
    proposedAt: row.proposed_at,
    countersignedBy: row.countersigned_by,
    countersignedAt: row.countersigned_at,
    executed: Boolean(row.executed),
    cancelled: Boolean(row.cancelled),
  };
}

/**
 * The countersignature — the act that actually executes a proposed
 * withdrawal or replacement. Refuses if the countersigning officer IS
 * the proposing officer: that is the entire control C5 asks for, and
 * it is enforced here rather than trusted to the UI, which is the only
 * place "one account, including the founder's" is actually stopped.
 */
export async function countersignActionRequest(env, { actor, requestId, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('A Registrar is required.', { actor: 'Required.' });
  const row = await loadActionRequest(env, requestId);
  if (row.cancelled) throw new ValidationError('This request was cancelled.', { requestId: 'Cancelled.' });
  if (row.executed) throw new ValidationError('This request has already been executed.', { requestId: 'Already executed.' });
  if (row.proposed_by === actor.id) {
    throw new ValidationError(
      'A withdrawal or replacement must be countersigned by a different officer than the one who proposed it.',
      { actor: 'Cannot countersign your own request.' },
    );
  }

  let result;
  if (row.action === 'withdraw') {
    result = { award: await revokeAward(env, { awardId: row.award_id, reason: row.reason, now: Date.parse(at) }) };
  } else {
    const changes = validateReplacementChanges(row.changes ? JSON.parse(row.changes) : {});
    const replaced = await replaceAward(env, {
      awardId: row.award_id, reason: row.reason, changes, now: Date.parse(at),
    });
    result = { replaced: replaced.replaced, replacement: conferredView(replaced.replacement) };
  }

  await db(env).prepare(
    `UPDATE award_action_requests SET countersigned_by = ?, countersigned_at = ?, executed = 1
     WHERE id = ?`,
  ).bind(actor.id, at, requestId).run();

  return { ...result, action: row.action, proposedBy: row.proposed_by, countersignedBy: actor.id, at };
}

/**
 * The proposer's own way out before a second officer acts. Never
 * available once countersigned — withdrawing a proposal after the
 * award has already been touched would be a second, undocumented
 * change to the register.
 */
export async function cancelActionRequest(env, { actor, requestId, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('A Registrar is required.', { actor: 'Required.' });
  const row = await loadActionRequest(env, requestId);
  if (row.executed) throw new ValidationError('This request has already been executed.', { requestId: 'Already executed.' });
  if (row.cancelled) return requestView(row);
  await db(env).prepare(
    'UPDATE award_action_requests SET cancelled = 1, cancelled_at = ? WHERE id = ?',
  ).bind(at, requestId).run();
  return requestView(await loadActionRequest(env, requestId));
}

/**
 * Every request awaiting a second officer — what a Registrar's console
 * shows as "awaiting countersignature", across every proposer.
 */
export async function pendingActionRequests(env, { limit = 100 } = {}) {
  const { results } = await db(env).prepare(
    `SELECT r.id, r.award_id AS awardId, r.action, r.reason, r.changes,
            r.proposed_by AS proposedBy, r.proposed_at AS proposedAt,
            a.holder_name AS holderName, a.verification_code AS verificationCode,
            u.email AS proposedByEmail, u.preferred_name AS proposedByName
       FROM award_action_requests r
       JOIN awards a ON a.id = r.award_id
       JOIN users u ON u.id = r.proposed_by
      WHERE r.executed = 0 AND r.cancelled = 0
      ORDER BY r.proposed_at ASC LIMIT ?`,
  ).bind(Math.max(1, Math.min(500, Number(limit) || 100))).all();
  return results.map((r) => ({ ...r, changes: r.changes ? JSON.parse(r.changes) : null }));
}
