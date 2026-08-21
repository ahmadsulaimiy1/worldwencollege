/* THE DRAWER WITH NO HANDLE ON IT.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE FAULT THIS FILE CORRECTS, measured off this repository
 * ─────────────────────────────────────────────────────────────────────
 * `applications.status` has seven values. Before this file,
 * `grep -rn "UPDATE applications" functions/` returned one hit and it
 * was a comment. Nothing anywhere in sixty-odd route files could move an
 * application off the default the INSERT gives it, so six of the seven
 * statuses — placement_pending, offer_sent, accepted, enrolled,
 * withdrawn, rejected — were unreachable by any request the platform
 * could receive.
 *
 * The consequence was not a missing feature. pages/admissions.html
 * publishes a five-stage route in a table with an "Application state"
 * column, states each stage's state by name, and commits the College to
 * contacting every applicant about placement. Every application the form
 * created sat at `submitted` for ever while the page told the person who
 * submitted it that it would not. That is the commercially serious end
 * of the same fault the `confirmationSent` flag in apply.js was written
 * to close: the platform saying something to a buyer that the machine
 * underneath it could not do.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 1 · THE STATE MACHINE IS THE PUBLISHED ONE. IT IS NOT A NEW ONE.
 * ─────────────────────────────────────────────────────────────────────
 * TRANSITIONS below is pages/admissions.html § "Five stages, and what
 * each one really is" turned into a graph, edge for edge:
 *
 *     submitted → placement_pending → offer_sent → accepted → enrolled
 *
 * with `withdrawn` and `rejected` as the two endings the same page names
 * ("An application can also end at withdrawn or rejected"). Nothing here
 * invents a state, a shortcut or a stage the College has not published,
 * and the two edges that are not in that straight line both come from
 * published sentences rather than from convenience:
 *
 *   · offer_sent → placement_pending, on a withdrawn or LAPSED offer.
 *     The page's own timing commitment is that "if the date passes, the
 *     application carries to the next intake rather than lapsing — you
 *     are never asked to apply twice". An expired offer that closed the
 *     application would contradict that in the applicant's favour to
 *     nobody. So the offer lapses and the application steps back one
 *     stage, where a fresh offer can be issued against it.
 *
 *   · submitted → offer_sent DOES NOT EXIST, deliberately, even though
 *     it would be operationally convenient. The published table puts
 *     placement between them and says who does it — "a person, not the
 *     platform". An offer issued without a confirmed level is an offer
 *     of a place the College has not decided on.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 2 · A STATUS THAT IMPLIES A RECORD CANNOT BE SET WITHOUT THE RECORD
 * ─────────────────────────────────────────────────────────────────────
 * Every transition names the CHANNELS it may arrive through, and the
 * channel is checked before anything is written. `offer_sent` is
 * reachable only through `issueOffer()`, which writes the `offers` row in
 * the same act — so there is no request, malformed or well-formed, that
 * produces an application claiming an offer was sent with no offer
 * behind it. `enrolled` is reachable only where an ACTIVE enrolment
 * already exists for the offered level, because the published page says
 * that stage is "payment is confirmed, an account is created, and your
 * enrolment for that level begins", and a status is not allowed to be
 * the only evidence for a sentence like that.
 *
 * This is the same argument `message_participants` makes in migration
 * 020 — put the rule in the shape rather than in a branch somebody can
 * edit — applied to a status column instead of an authorisation.
 *
 * WHAT ACCEPTANCE DELIBERATELY DOES NOT DO. It does not manufacture an
 * enrolment row. functions/api/enrolment/confirm.js — the endpoint a
 * succeeded payment actually calls — begins with an idempotency branch
 * that returns any existing enrolment for that learner and level
 * VERBATIM, without activating it. An enrolment created here in
 * `pending_payment` would therefore be handed straight back to a learner
 * who had just paid, still pending, and they would never be let in. So
 * acceptance records the acceptance and returns what is genuinely
 * outstanding; the `enrolled` transition binds the enrolment the payment
 * path creates to the application it belongs to, filling the
 * `application_id` that path leaves NULL.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 3 · WHO ACTED, WHEN THE ACTOR HAS NO ACCOUNT
 * ─────────────────────────────────────────────────────────────────────
 * `application_events.actor_id` is nullable and migration 020 is explicit
 * that NULL means "the platform did it — an expiry sweep lapsing an
 * offer, a payment webhook enrolling an accepted applicant".
 *
 * An applicant accepting an offer is neither. They are a person making a
 * decision, and today they have no `users` row to point at: the College
 * cannot authenticate applicants (its auth provider's DNS does not
 * resolve) and `applications.user_id` is NULL for everyone who applied
 * without signing in. Writing those acceptances with a NULL actor would
 * file a person's decision under "the platform did it", which is exactly
 * the attribution that column exists to keep honest.
 *
 * There is no `party` or `actor_role` column to say so — `registrar_case_
 * events` has one and `application_events` does not — so the party is
 * recorded as a leading tag in `reason`: `[applicant]`, `[staff]`,
 * `[platform]`. Machine-readable, obvious in a raw dump, and never
 * silently absent. The missing column is reported as a gap rather than
 * added, since the schema is not this file's to change.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 4 · THE REFERENCE IS A BEARER CREDENTIAL
 * ─────────────────────────────────────────────────────────────────────
 * pages/admissions.html tells every applicant their `app_` identifier
 * "is the only key to your record, and it is deliberately the only key —
 * the College will not disclose an application state to anyone who does
 * not hold it, including someone who knows your email address". This
 * file keeps that literally:
 *
 *   · the reference is shape-checked before it reaches the database, so
 *     the lookup is not a general oracle for arbitrary strings;
 *   · the decision is made with timingSafeEqual against a same-length
 *     decoy when no row was found, so a hit and a miss cost the same and
 *     no prefix can be recovered a character at a time;
 *   · a miss and a malformed reference get the IDENTICAL refusal, since
 *     two different messages are two different answers;
 *   · every lookup — hit or miss — spends allowance from a fixed window,
 *     which is what bounds enumeration;
 *   · and there is nowhere to put an email address. Not "an email is
 *     ignored": callers that supply one are refused, by the rule
 *     functions/api/announcements/index.js states, so a client can never
 *     be built on a lookup the server never offered.
 *
 * ─────────────────────────────────────────────────────────────────────
 * 5 · A SEND IS REPORTED, NEVER ASSERTED
 * ─────────────────────────────────────────────────────────────────────
 * Every transition returns a `notifications` array in which each entry
 * carries `sent` and, when false, the reason. No caller of this module
 * may tell an applicant an email went out; it may only pass on what the
 * gateway actually did. The catalog in _lib/notifications/events.js
 * holds a template for exactly one of the six transitions
 * (`enrolment_confirmed`); the other five report
 * `no_template_in_catalog` and name the event the College would need,
 * which is the honest form of a gap. Availability is discovered at
 * runtime rather than hardcoded here, so the day a template is added the
 * platform starts sending it with no change to this file.
 */

import {
  db, newId, nowIso, ValidationError, NotFoundError, timingSafeEqual,
} from '../db.js';
import { AuthError } from '../auth/session.js';
import { notify } from '../notifications/events.js';

/* ───────────────────────────────────────────────────────────────
 * THE PUBLISHED JOURNEY
 * ─────────────────────────────────────────────────────────────── */

export const APPLICATION_STATUSES = [
  'submitted', 'placement_pending', 'offer_sent', 'accepted', 'enrolled',
  'withdrawn', 'rejected',
];

export const CLOSED_STATUSES = ['enrolled', 'withdrawn', 'rejected'];

export const PARTIES = ['applicant', 'staff', 'platform'];

/**
 * The five stages exactly as pages/admissions.html publishes them,
 * including which application states belong to each and who acts. It is
 * returned to the applicant so the page rendering their progress and the
 * page describing the route cannot drift apart — the drift published-
 * claims.test.mjs exists to catch, closed here by having one source.
 */
export const PUBLISHED_JOURNEY = [
  {
    number: 1, title: 'Estimate your level', states: [],
    who: 'You, in about thirty seconds',
    what: 'A one-question self-assessment suggests a starting level. It is not the placement decision and it binds nobody, including you.',
  },
  {
    number: 2, title: 'Submit the form', states: ['submitted'],
    who: 'You',
    what: 'The record is created immediately and the application reference is shown to you on the page.',
  },
  {
    number: 3, title: 'Placement', states: ['placement_pending'],
    who: 'A person, not the platform',
    what: 'A conversation and a short assessment to confirm which of the six levels you should enter.',
  },
  {
    number: 4, title: 'Offer', states: ['offer_sent', 'accepted'],
    who: 'Admissions, then you',
    what: 'A written offer naming your confirmed entry level, the fee for it, and the payment options open to you.',
  },
  {
    number: 5, title: 'Enrolment', states: ['enrolled'],
    who: 'You and the platform together',
    what: 'Payment is confirmed, an account is created, and your enrolment for that level begins.',
  },
];

/**
 * The College's published commitment for the stage that most often goes
 * quiet, quoted from pages/admissions.html rather than paraphrased —
 * "Placement contact within three working days ... a commitment the
 * College makes to every applicant. If it is missed, write to Admissions
 * and say so." An applicant reading their own status is exactly the
 * person who needs to be told what they are owed.
 */
export const PLACEMENT_COMMITMENT =
  'The College commits to making placement contact within three working days. If that is missed, write to Admissions and say so.';

/* ───────────────────────────────────────────────────────────────
 * THE GRAPH
 * ─────────────────────────────────────────────────────────────── */

/**
 * Where a transition may arrive from. A status is not merely a value a
 * caller may set; it is a value one particular act may produce.
 *
 *   queue             — PATCH /api/staff/applications, a named officer
 *   offer             — POST /api/admissions/offer, which writes the offer
 *   offer_response    — POST /api/admissions/offer (accept/decline/withdraw),
 *                       authenticated by the applicant's own reference
 *   offer_withdrawal  — the College withdrawing an offer it made
 *   expiry_sweep      — the platform, when an offer's own date passes
 */
export const CHANNELS = ['queue', 'offer', 'offer_response', 'offer_withdrawal', 'expiry_sweep'];

export const TRANSITIONS = [
  {
    from: 'submitted', to: 'placement_pending',
    by: ['staff'], channels: ['queue'], reasonRequiredFor: [],
    means: 'Placement has been arranged with the applicant.',
  },
  {
    from: 'placement_pending', to: 'offer_sent',
    by: ['staff'], channels: ['offer'], reasonRequiredFor: [],
    means: 'A written offer has been issued. Reachable only by issuing one.',
  },
  {
    from: 'offer_sent', to: 'accepted',
    by: ['applicant', 'staff'], channels: ['offer_response', 'queue'],
    reasonRequiredFor: ['staff'],
    means: 'The applicant has accepted the offer.',
  },
  {
    from: 'offer_sent', to: 'placement_pending',
    by: ['staff', 'platform'], channels: ['offer_withdrawal', 'expiry_sweep'],
    reasonRequiredFor: ['staff', 'platform'],
    means: 'The offer was withdrawn or its date passed. The application carries forward rather than lapsing.',
  },
  {
    from: 'offer_sent', to: 'withdrawn',
    by: ['applicant', 'staff'], channels: ['offer_response', 'queue'],
    reasonRequiredFor: ['applicant', 'staff'],
    means: 'The applicant declined the offer and is not proceeding.',
  },
  {
    from: 'submitted', to: 'withdrawn',
    by: ['applicant', 'staff'], channels: ['offer_response', 'queue'],
    reasonRequiredFor: ['applicant', 'staff'],
    means: 'The applicant is not proceeding.',
  },
  {
    from: 'placement_pending', to: 'withdrawn',
    by: ['applicant', 'staff'], channels: ['offer_response', 'queue'],
    reasonRequiredFor: ['applicant', 'staff'],
    means: 'The applicant is not proceeding.',
  },
  {
    from: 'accepted', to: 'withdrawn',
    by: ['applicant', 'staff'], channels: ['offer_response', 'queue'],
    reasonRequiredFor: ['applicant', 'staff'],
    means: 'The applicant accepted and has since withdrawn.',
  },
  {
    from: 'accepted', to: 'enrolled',
    by: ['staff', 'platform'], channels: ['queue'], reasonRequiredFor: [],
    requires: 'active_enrolment',
    means: 'Payment is confirmed and the enrolment for that level has begun.',
  },
  {
    from: 'submitted', to: 'rejected',
    by: ['staff'], channels: ['queue'], reasonRequiredFor: ['staff'],
    means: 'The College is not taking the application further.',
  },
  {
    from: 'placement_pending', to: 'rejected',
    by: ['staff'], channels: ['queue'], reasonRequiredFor: ['staff'],
    means: 'The College is not taking the application further.',
  },
];

/** Every status legally reachable from `from`, with who may do it. */
export function legalTransitionsFrom(from) {
  return TRANSITIONS.filter((t) => t.from === from)
    .map((t) => ({ to: t.to, by: t.by, channels: t.channels, means: t.means }));
}

/**
 * A refusal that names the legal moves instead of only the illegal one.
 * "Not allowed" tells an admissions officer nothing; the list tells them
 * what to do next, and tells a client author what the machine is.
 */
export class IllegalTransitionError extends ValidationError {
  constructor(message, fields, legal) {
    super(message, fields);
    this.name = 'IllegalTransitionError';
    this.legal = legal;
  }
}

function refuse(from, to, extra) {
  const legal = legalTransitionsFrom(from);
  const list = legal.length
    ? legal.map((l) => `${l.to} (by ${l.by.join(' or ')})`).join(', ')
    : 'nothing — this is a closed state';
  throw new IllegalTransitionError(
    `An application at "${from}" cannot move to "${to}". Legal from here: ${list}.${extra ? ` ${extra}` : ''}`,
    { to: `Not reachable from ${from}` },
    legal,
  );
}

/* ───────────────────────────────────────────────────────────────
 * VALIDATION PRIMITIVES
 * ─────────────────────────────────────────────────────────────── */

export const MAX_REASON = 2000;
export const MAX_CONDITIONS = 2000;
/** An offer held open for longer than a year is the fault expires_at exists to prevent. */
export const MAX_OFFER_DAYS = 365;

// The C0 range has no business in a sentence, and 0x1E/0x1F in
// particular are how a single stored string is later split into two by
// something downstream that treats them as separators.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function assertProse(value, field, max, fields) {
  if (typeof value !== 'string') {
    fields[field] = 'Must be text.';
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) { fields[field] = 'Required.'; return null; }
  if (trimmed.length > max) { fields[field] = `Keep this under ${max} characters.`; return null; }
  if (CONTROL.test(trimmed)) { fields[field] = 'Contains control characters.'; return null; }
  return trimmed;
}

function assertNoFields(body, forbidden, fields, why) {
  for (const key of forbidden) {
    if (body && body[key] !== undefined) fields[key] = why;
  }
}

/* ───────────────────────────────────────────────────────────────
 * THE PARTY TAG (see § 3 of the header)
 * ─────────────────────────────────────────────────────────────── */

const PARTY_TAG = /^\[(applicant|staff|platform)\]\s*/;

function composeReason(party, sentence) {
  return sentence ? `[${party}] ${sentence}` : `[${party}]`;
}

/** Split a stored reason back into who said it and what they said. */
export function readReason(stored) {
  if (typeof stored !== 'string' || !stored) return { party: null, note: null };
  const m = stored.match(PARTY_TAG);
  if (!m) return { party: null, note: stored };
  const note = stored.slice(m[0].length).trim();
  return { party: m[1], note: note || null };
}

/* ───────────────────────────────────────────────────────────────
 * REFERENCE LOOKUP ALLOWANCE
 * ─────────────────────────────────────────────────────────────── */

export const LOOKUP_WINDOW_MS = 5 * 60 * 1000;
export const LOOKUPS_PER_WINDOW = 20;
const MAX_TRACKED_KEYS = 5000;

/*
 * ISOLATE-LOCAL, AND SAID SO RATHER THAN IMPLIED.
 *
 * threads.js derives its allowance by counting rows in a window, which
 * is durable and shared. Nothing here can: a reference lookup writes no
 * row, and writing one per attempt would let anybody holding no
 * credential at all grow a table. There is no KV or Durable Object
 * binding in wrangler.toml to hold a counter either.
 *
 * So this bounds one isolate. That is worth having — it is what turns an
 * unbounded scripted sweep into a bounded one — and it is not worth
 * overstating: an attacker spread across isolates gets a multiple of it.
 * The reference itself is a version-4 UUID, so guessing is not the
 * threat model; harvesting a leaked list is, and this is what makes that
 * slow enough to notice. A durable limiter is reported as a gap.
 */
const lookupBuckets = new Map();

export function referenceLookupAllowance(key, now = Date.now()) {
  const bucketKey = key || 'unattributed';
  for (const [k, v] of lookupBuckets) if (v.resetAt <= now) lookupBuckets.delete(k);
  // A memory bound that fails closed on the newcomers rather than
  // forgetting the busy callers it is there to slow down.
  if (lookupBuckets.size > MAX_TRACKED_KEYS && !lookupBuckets.has(bucketKey)) {
    // `used` is one PAST the limit, not equal to it: the refusal below
    // is written as "spent more than the allowance", and a value equal
    // to it would sail through the very check this branch exists to
    // trigger.
    return {
      limit: LOOKUPS_PER_WINDOW, used: LOOKUPS_PER_WINDOW + 1, remaining: 0,
      resetAt: new Date(now + LOOKUP_WINDOW_MS).toISOString(),
    };
  }
  let bucket = lookupBuckets.get(bucketKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + LOOKUP_WINDOW_MS };
    lookupBuckets.set(bucketKey, bucket);
  }
  bucket.count += 1;
  return {
    limit: LOOKUPS_PER_WINDOW,
    used: bucket.count,
    remaining: Math.max(0, LOOKUPS_PER_WINDOW - bucket.count),
    resetAt: new Date(bucket.resetAt).toISOString(),
  };
}

/** For tests, so one block's allowance cannot leak into the next. */
export function resetReferenceLookups() {
  lookupBuckets.clear();
}

export class RateLimitError extends Error {
  constructor(message, allowance) {
    super(message);
    this.name = 'RateLimitError';
    this.httpStatus = 429;
    this.fields = { reference: 'Too many lookups in the last few minutes' };
    this.allowance = allowance;
  }
}

/* ───────────────────────────────────────────────────────────────
 * THE BEARER CHECK
 * ─────────────────────────────────────────────────────────────── */

/**
 * Deliberately narrow. A reference is what newId('app') produces, so a
 * string that cannot be one never reaches a query and this endpoint is
 * not a lookup service for arbitrary text.
 */
const REFERENCE_SHAPE = /^app_[A-Za-z0-9_-]{16,64}$/;

/**
 * One refusal, used for a malformed reference, an unknown one and a
 * reference for an application that was deleted. Two messages would be
 * two answers, and the second answer is "that reference exists".
 */
const NOT_DISCLOSED =
  'That reference does not open an application. The College will not disclose an application to anyone who does not hold its reference — including someone who knows the applicant\'s email address.';

/** A same-length string that is never equal, so a miss costs a full compare. */
function decoyFor(reference) {
  return '.'.repeat(reference.length);
}

/**
 * Resolve an application from the reference alone, in constant time,
 * spending allowance whether or not it hits.
 *
 * `clientKey` is the caller's address (CF-Connecting-IP at the route).
 * It is used for nothing but the allowance bucket and is never stored.
 */
export async function applicationByReference(env, { reference, clientKey = null, now = null } = {}) {
  const at = now || Date.now();
  const allowance = referenceLookupAllowance(clientKey, at);
  if (allowance.used > LOOKUPS_PER_WINDOW) {
    throw new RateLimitError(
      `Too many application lookups from this address. The next may be made at ${allowance.resetAt}.`,
      allowance,
    );
  }

  const ref = typeof reference === 'string' ? reference.trim() : '';
  if (!REFERENCE_SHAPE.test(ref)) throw new AuthError(NOT_DISCLOSED);

  const row = await db(env).prepare('SELECT * FROM applications WHERE id = ?').bind(ref).first();
  // The compare runs on every path, against a decoy of equal length when
  // there is no row, so a hit and a miss are indistinguishable by cost.
  const matches = timingSafeEqual(row ? row.id : decoyFor(ref), ref);
  if (!row || !matches) throw new AuthError(NOT_DISCLOSED);
  return { application: row, allowance };
}

/* ───────────────────────────────────────────────────────────────
 * NOTIFICATION — REPORTED, NEVER ASSERTED
 * ─────────────────────────────────────────────────────────────── */

/**
 * What the College would send at each transition. Only
 * `enrolment_confirmed` is in the catalog today; the rest are named so
 * the response says which template is missing rather than saying
 * nothing. Availability is discovered by calling notify() and reading
 * the failure, not by duplicating the catalog here.
 */
const APPLICANT_EVENT = {
  placement_pending: 'placement_invitation',
  offer_sent: 'offer_issued',
  accepted: 'offer_accepted',
  enrolled: 'enrolment_confirmed',
  withdrawn: 'application_withdrawn',
  rejected: 'application_decision',
};

/** The staff desk needs to know when an applicant acts on their own record. */
const STAFF_ALERT_EVENT = 'application_status_changed_alert';

async function fire(env, { event, audience, to, userId = null, data = {} }) {
  if (!to) return { event, audience, sent: false, reason: 'no_recipient_address' };
  try {
    const result = await notify(env, event, { to, userId, ...data });
    if (result && result.sent) return { event, audience, sent: true, reason: null };
    // notify() swallows every delivery failure and logs it; the honest
    // report of that is "not sent", with the reason the log will carry.
    return { event, audience, sent: false, reason: 'gateway_unconfigured_or_refused' };
  } catch (err) {
    const unknown = /Unknown notification event type/i.test(err && err.message ? err.message : '');
    return { event, audience, sent: false, reason: unknown ? 'no_template_in_catalog' : 'notification_error' };
  }
}

/* ───────────────────────────────────────────────────────────────
 * THE TRANSITION ITSELF
 * ─────────────────────────────────────────────────────────────── */

async function levelRow(env, levelId) {
  if (levelId == null) return null;
  return db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(levelId).first();
}

/** The level this application is actually about, best evidence first. */
export function offeredLevelId(application, offer) {
  if (offer && offer.level_id != null) return offer.level_id;
  if (application.placement_level_id != null) return application.placement_level_id;
  return application.self_assessed_level_id ?? null;
}

async function assertPrecondition(env, rule, { application, offer, to }) {
  if (rule !== 'active_enrolment') return null;
  if (!application.user_id) {
    throw new ValidationError(
      'This applicant has no account yet, so there is no enrolment to begin. An account is created at enrolment; see docs/auth-architecture.md.',
      { to: 'No account linked to this application' },
    );
  }
  const levelId = offeredLevelId(application, offer);
  if (levelId == null) {
    throw new ValidationError(
      'No level has been confirmed for this application, so there is nothing to enrol into.',
      { to: 'No confirmed level' },
    );
  }
  const enrolment = await db(env)
    .prepare("SELECT * FROM enrolments WHERE user_id = ? AND level_id = ? AND status = 'active'")
    .bind(application.user_id, levelId)
    .first();
  if (!enrolment) {
    throw new ValidationError(
      `"${to}" records that payment is confirmed and the enrolment has begun, and no active enrolment exists at Level ${levelId} for this applicant's account. POST /api/enrolment/confirm creates one from a succeeded payment.`,
      { to: `No active enrolment at level ${levelId}` },
    );
  }
  return enrolment;
}

/**
 * Move one application, write the event that says who moved it, and
 * report what the gateway did with the notification.
 *
 * The UPDATE is conditional on the status it was read at and the write
 * is refused if it changed no row, so two officers acting on the same
 * application at the same moment cannot both succeed — the second is
 * told what the status actually became rather than overwriting it.
 */
export async function transitionApplication(env, {
  application, to, party, actor = null, reason = null, channel,
  offer = null, placementLevelId = undefined, now = null,
}) {
  if (!application) throw new NotFoundError('No application found.');
  if (!APPLICATION_STATUSES.includes(to)) {
    throw new ValidationError(
      `"${to}" is not an application status. The statuses are: ${APPLICATION_STATUSES.join(', ')}.`,
      { to: 'Unknown status' },
    );
  }
  if (!PARTIES.includes(party)) {
    throw new ValidationError(`Unknown party "${party}".`, { party: 'Unknown' });
  }
  if (!CHANNELS.includes(channel)) {
    throw new ValidationError(`Unknown channel "${channel}".`, { channel: 'Unknown' });
  }

  const from = application.status;
  const rule = TRANSITIONS.find((t) => t.from === from && t.to === to);
  if (!rule) refuse(from, to);
  if (!rule.by.includes(party)) {
    refuse(from, to, `That move is made by ${rule.by.join(' or ')}, not by ${party}.`);
  }
  if (!rule.channels.includes(channel)) {
    refuse(from, to, `That move is made through ${rule.channels.join(' or ')}, not through ${channel}.`);
  }

  const fields = {};
  let sentence = null;
  if (rule.reasonRequiredFor.includes(party)) {
    sentence = assertProse(reason, 'reason', MAX_REASON, fields);
    if (Object.keys(fields).length) {
      throw new ValidationError(
        `Moving an application to "${to}" requires a reason. It is shown to the applicant on their own status page, so write it as something they may read.`,
        fields,
      );
    }
  } else if (reason != null && reason !== '') {
    sentence = assertProse(reason, 'reason', MAX_REASON, fields);
    if (Object.keys(fields).length) throw new ValidationError('Please check the reason.', fields);
  }

  const enrolment = rule.requires
    ? await assertPrecondition(env, rule.requires, { application, offer, to })
    : null;

  const at = now ? new Date(now).toISOString() : nowIso();

  // Placement is confirmed by assessment, so the confirmed level is
  // written where it is decided rather than being inferred later.
  let nextPlacement = application.placement_level_id;
  if (placementLevelId !== undefined && placementLevelId !== null) {
    const level = await levelRow(env, placementLevelId);
    if (!level) {
      throw new ValidationError('That is not a programme level.', { placementLevelId: 'Unknown level' });
    }
    nextPlacement = placementLevelId;
  }

  const updated = await db(env)
    .prepare('UPDATE applications SET status = ?, placement_level_id = ?, updated_at = ? WHERE id = ? AND status = ?')
    .bind(to, nextPlacement, at, application.id, from)
    .run();
  if (!updated || !updated.meta || updated.meta.changes !== 1) {
    const current = await db(env).prepare('SELECT status FROM applications WHERE id = ?').bind(application.id).first();
    if (!current) throw new NotFoundError('No application found.');
    refuse(current.status, to, `The application moved to "${current.status}" while this request was in flight.`);
  }

  const eventId = newId('aev');
  await db(env)
    .prepare('INSERT INTO application_events (id, application_id, from_status, to_status, actor_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(eventId, application.id, from, to, actor ? actor.id : null, composeReason(party, sentence), at)
    .run();

  // Bind the enrolment the payment path created to the application it
  // belongs to. That path has no application id to hand and leaves the
  // column NULL; this is the only moment the two are known together.
  if (enrolment && !enrolment.application_id) {
    await db(env)
      .prepare('UPDATE enrolments SET application_id = ? WHERE id = ? AND application_id IS NULL')
      .bind(application.id, enrolment.id)
      .run();
  }

  const level = await levelRow(env, offeredLevelId(application, offer));
  const notifications = [
    await fire(env, {
      event: APPLICANT_EVENT[to],
      audience: 'applicant',
      to: application.email,
      userId: application.user_id || null,
      data: {
        name: application.full_name,
        levelName: level ? level.name : 'your programme level',
        reference: application.id,
      },
    }),
  ];
  // An applicant acting on their own record is the one case Admissions
  // learns about from nowhere else, so the attempt is made and its
  // outcome reported rather than assumed.
  if (party === 'applicant' && env.NOTIFICATION_EMAIL) {
    notifications.push(await fire(env, {
      event: STAFF_ALERT_EVENT,
      audience: 'staff',
      to: env.NOTIFICATION_EMAIL,
      data: { reference: application.id, from, to, name: application.full_name },
    }));
  }

  const after = await db(env).prepare('SELECT * FROM applications WHERE id = ?').bind(application.id).first();
  return {
    application: after,
    event: { id: eventId, from, to, party, actorId: actor ? actor.id : null, note: sentence, at },
    notifications,
    enrolmentId: enrolment ? enrolment.id : null,
  };
}

/* ───────────────────────────────────────────────────────────────
 * OFFERS
 * ─────────────────────────────────────────────────────────────── */

export const OFFER_KINDS = ['conditional', 'unconditional'];

async function liveOffer(env, applicationId) {
  return db(env)
    .prepare("SELECT * FROM offers WHERE application_id = ? AND status IN ('issued','accepted') ORDER BY issued_at DESC")
    .bind(applicationId)
    .first();
}

export async function latestOffer(env, applicationId) {
  return db(env)
    .prepare('SELECT * FROM offers WHERE application_id = ? ORDER BY issued_at DESC')
    .bind(applicationId)
    .first();
}

/**
 * "Holds to the close of the intake it was made for" is a date, and a
 * date-only expiry means the end of that day rather than its first
 * instant — an offer that quietly died at midnight on the morning it was
 * said to hold until would be the College keeping the letter of its own
 * commitment against the applicant.
 */
function normaliseExpiry(raw, issuedAt, fields) {
  if (typeof raw !== 'string' || !raw.trim()) {
    fields.expiresAt = 'Required — an offer with no expiry is a place held open for ever.';
    return null;
  }
  const value = raw.trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) {
    fields.expiresAt = 'Use an ISO date (2026-11-30) or date-time.';
    return null;
  }
  const normalised = new Date(ms).toISOString();
  if (normalised <= issuedAt) {
    fields.expiresAt = 'Must be after the moment the offer is issued.';
    return null;
  }
  if (ms - Date.parse(issuedAt) > MAX_OFFER_DAYS * 86400000) {
    fields.expiresAt = `Must be within ${MAX_OFFER_DAYS} days — a longer hold is a place the College cannot honour.`;
    return null;
  }
  return normalised;
}

/**
 * Issue an offer and move the application in the same act. There is no
 * path to `offer_sent` that does not come through here, which is what
 * makes the status mean something.
 */
export async function issueOffer(env, {
  actor, applicationId, levelId, kind, conditions = null, expiresAt, reason = null, now = null,
}) {
  if (!actor || !actor.id) {
    throw new ValidationError('An offer is issued by a named officer, never by the platform.', {});
  }
  const fields = {};
  if (typeof applicationId !== 'string' || !applicationId.trim()) {
    throw new ValidationError('applicationId is required.', { applicationId: 'Required' });
  }
  const application = await db(env).prepare('SELECT * FROM applications WHERE id = ?').bind(applicationId.trim()).first();
  if (!application) throw new NotFoundError('No application found with that reference.');

  const level = Number.isInteger(levelId) ? await levelRow(env, levelId) : null;
  if (!level) fields.levelId = 'Name the programme level being offered, as a whole number 1 to 6.';

  if (!OFFER_KINDS.includes(kind)) {
    fields.kind = `One of: ${OFFER_KINDS.join(', ')}.`;
  }
  let conditionsText = null;
  if (kind === 'conditional') {
    conditionsText = assertProse(conditions, 'conditions', MAX_CONDITIONS, fields);
    if (!conditionsText && !fields.conditions) {
      fields.conditions = 'A conditional offer states its conditions — a condition nobody wrote down is one the applicant cannot meet.';
    }
  } else if (kind === 'unconditional' && conditions != null && conditions !== '') {
    // Refused rather than dropped: an officer who typed conditions into
    // an unconditional offer meant one of the two things, and silently
    // discarding the text picks for them.
    fields.conditions = 'An unconditional offer carries no conditions. Issue it as conditional, or clear this field.';
  }

  const issuedAt = now ? new Date(now).toISOString() : nowIso();
  const expiry = normaliseExpiry(expiresAt, issuedAt, fields);

  if (Object.keys(fields).length) throw new ValidationError('Please check the highlighted fields.', fields);

  // The live-offer check comes FIRST because it is the more useful
  // answer to the more likely mistake. An application at `offer_sent`
  // fails both tests, and being told "you cannot move to offer_sent from
  // offer_sent" describes the symptom while "there is already a live
  // offer, withdraw it first" describes the thing to do.
  const existing = await liveOffer(env, application.id);
  if (existing) {
    throw new ValidationError(
      `This application already has a live offer (${existing.id}, ${existing.status}, expiring ${existing.expires_at}). Withdraw it before issuing another — two open offers is how a College ends up honouring the wrong one.`,
      { applicationId: 'A live offer already exists' },
    );
  }

  if (application.status !== 'placement_pending') {
    refuse(application.status, 'offer_sent',
      application.status === 'submitted'
        ? 'Placement is confirmed by a person before an offer is made; move the application to placement_pending first.'
        : undefined);
  }

  const offerId = newId('ofr');
  await db(env)
    .prepare(`INSERT INTO offers
      (id, application_id, level_id, kind, conditions, issued_by, issued_at, expires_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?)`)
    .bind(offerId, application.id, level.id, kind, conditionsText, actor.id, issuedAt, expiry, issuedAt)
    .run();

  const offer = await db(env).prepare('SELECT * FROM offers WHERE id = ?').bind(offerId).first();
  const moved = await transitionApplication(env, {
    application, to: 'offer_sent', party: 'staff', actor, reason,
    channel: 'offer', offer,
    // The offer is made against the confirmed level, so the application
    // records that level rather than leaving the two able to disagree.
    placementLevelId: application.placement_level_id == null ? level.id : undefined,
    now: issuedAt,
  });

  return { offer: shapeOffer(offer, issuedAt), ...moved };
}

/** Set an offer's terminal state, refusing if it is no longer live. */
async function settleOffer(env, { offer, to, at, reason = null }) {
  const columns = {
    accepted: 'status = ?, accepted_at = ?',
    declined: 'status = ?, declined_at = ?, declined_reason = ?',
    withdrawn: 'status = ?, withdrawn_at = ?, withdrawn_reason = ?',
    lapsed: 'status = ?',
  }[to];
  const binds = to === 'accepted' ? [to, at]
    : to === 'lapsed' ? [to]
      : [to, at, reason];
  const res = await db(env)
    .prepare(`UPDATE offers SET ${columns} WHERE id = ? AND status = 'issued'`)
    .bind(...binds, offer.id)
    .run();
  if (!res || !res.meta || res.meta.changes !== 1) {
    const current = await db(env).prepare('SELECT status FROM offers WHERE id = ?').bind(offer.id).first();
    throw new ValidationError(
      `That offer is "${current ? current.status : 'gone'}" and can no longer be ${to === 'lapsed' ? 'lapsed' : to}.`,
      { offerId: `Offer is ${current ? current.status : 'missing'}` },
    );
  }
}

/**
 * An offer whose own date has passed, reconciled at the moment somebody
 * looks at it.
 *
 * There is no scheduled sweep — wrangler.toml declares no cron trigger —
 * so an offer would otherwise be shown as live indefinitely after the
 * date the College said it held until, and could be accepted after it.
 * Lazy reconciliation on read is the honest alternative to a promise
 * nothing keeps. The application steps back to placement_pending rather
 * than closing, which is the published commitment: "the application
 * carries to the next intake rather than lapsing — you are never asked
 * to apply twice."
 */
export async function lapseExpiredOffers(env, { applicationId, now = null } = {}) {
  const at = now ? new Date(now).toISOString() : nowIso();
  const expired = (await db(env)
    .prepare("SELECT * FROM offers WHERE application_id = ? AND status = 'issued' AND expires_at < ?")
    .bind(applicationId, at)
    .all()).results || [];
  const lapsed = [];
  for (const offer of expired) {
    await settleOffer(env, { offer, to: 'lapsed', at });
    const application = await db(env).prepare('SELECT * FROM applications WHERE id = ?').bind(applicationId).first();
    if (application && application.status === 'offer_sent') {
      await transitionApplication(env, {
        application, to: 'placement_pending', party: 'platform', actor: null,
        reason: `The offer issued on ${offer.issued_at} expired on ${offer.expires_at}. The application carries forward to the next intake; the applicant is not asked to apply again.`,
        channel: 'expiry_sweep', offer, now: at,
      });
    }
    lapsed.push(offer.id);
  }
  return lapsed;
}

export async function acceptOffer(env, { application, offer, party, actor = null, reason = null, now = null }) {
  const at = now ? new Date(now).toISOString() : nowIso();
  if (!offer || offer.status !== 'issued') {
    throw new ValidationError(
      offer ? `That offer is "${offer.status}" and cannot be accepted.` : 'There is no offer to accept on this application.',
      { offerId: offer ? `Offer is ${offer.status}` : 'No offer' },
    );
  }
  if (offer.expires_at < at) {
    throw new ValidationError(
      `That offer expired on ${offer.expires_at}. The application carries to the next intake rather than lapsing — Admissions will issue a fresh offer.`,
      { offerId: 'Offer expired' },
    );
  }
  await settleOffer(env, { offer, to: 'accepted', at });
  const moved = await transitionApplication(env, {
    application, to: 'accepted', party, actor, reason,
    channel: party === 'applicant' ? 'offer_response' : 'queue',
    offer, now: at,
  });
  const after = await db(env).prepare('SELECT * FROM offers WHERE id = ?').bind(offer.id).first();
  return { offer: shapeOffer(after, at), ...moved, outstanding: await outstandingFor(env, moved.application, after) };
}

export async function declineOffer(env, { application, offer, party, actor = null, reason, now = null }) {
  const at = now ? new Date(now).toISOString() : nowIso();
  const fields = {};
  const sentence = assertProse(reason, 'reason', MAX_REASON, fields);
  if (Object.keys(fields).length) {
    throw new ValidationError('Declining an offer records why. The College keeps the decision rather than deleting it.', fields);
  }
  if (!offer || offer.status !== 'issued') {
    throw new ValidationError(
      offer ? `That offer is "${offer.status}" and cannot be declined.` : 'There is no offer to decline on this application.',
      { offerId: offer ? `Offer is ${offer.status}` : 'No offer' },
    );
  }
  await settleOffer(env, { offer, to: 'declined', at, reason: sentence });
  const moved = await transitionApplication(env, {
    application, to: 'withdrawn', party, actor, reason: sentence,
    channel: party === 'applicant' ? 'offer_response' : 'queue', offer, now: at,
  });
  const after = await db(env).prepare('SELECT * FROM offers WHERE id = ?').bind(offer.id).first();
  return { offer: shapeOffer(after, at), ...moved };
}

/**
 * The College withdrawing an offer it made. `lapsed` and `withdrawn` are
 * kept apart deliberately, as migration 020 says: "an applicant who ran
 * out of time and one the College changed its mind about are owed
 * different letters."
 */
export async function withdrawOffer(env, { application, offer, actor, reason, now = null }) {
  const at = now ? new Date(now).toISOString() : nowIso();
  const fields = {};
  const sentence = assertProse(reason, 'reason', MAX_REASON, fields);
  if (Object.keys(fields).length) {
    throw new ValidationError('Withdrawing an offer requires a reason; it is shown to the applicant.', fields);
  }
  if (!offer || offer.status !== 'issued') {
    throw new ValidationError(
      offer ? `That offer is "${offer.status}" and cannot be withdrawn.` : 'There is no live offer on this application.',
      { offerId: offer ? `Offer is ${offer.status}` : 'No offer' },
    );
  }
  await settleOffer(env, { offer, to: 'withdrawn', at, reason: sentence });
  const moved = await transitionApplication(env, {
    application, to: 'placement_pending', party: 'staff', actor, reason: sentence,
    channel: 'offer_withdrawal', offer, now: at,
  });
  const after = await db(env).prepare('SELECT * FROM offers WHERE id = ?').bind(offer.id).first();
  return { offer: shapeOffer(after, at), ...moved };
}

/* ───────────────────────────────────────────────────────────────
 * THE APPLICANT'S OWN DOOR
 * ─────────────────────────────────────────────────────────────── */

export const APPLICANT_ACTIONS = ['accept', 'decline', 'withdraw'];

/**
 * The three things a person may do to their own application while
 * holding nothing but its reference. `withdraw` exists so that an
 * applicant before the offer stage is not obliged to write an email to
 * stop a process they started; `decline` is the same act once an offer
 * is on the table, and it settles the offer as well as the application.
 */
export async function respondToOffer(env, { reference, action, reason = null, clientKey = null, now = null } = {}) {
  if (!APPLICANT_ACTIONS.includes(action)) {
    throw new ValidationError(
      `action must be one of: ${APPLICANT_ACTIONS.join(', ')}.`,
      { action: 'Unknown action' },
    );
  }
  const at = now ? new Date(now).toISOString() : nowIso();
  const { application, allowance } = await applicationByReference(env, { reference, clientKey, now: Date.parse(at) });

  await lapseExpiredOffers(env, { applicationId: application.id, now: at });
  const current = await db(env).prepare('SELECT * FROM applications WHERE id = ?').bind(application.id).first();
  const offer = await liveOffer(env, application.id);

  if (action === 'accept') {
    if (current.status !== 'offer_sent') {
      refuse(current.status, 'accepted', 'There is no offer awaiting your answer.');
    }
    const result = await acceptOffer(env, {
      application: current, offer, party: 'applicant', actor: null,
      reason: 'Accepted by the applicant against their own reference.', now: at,
    });
    return { ...result, allowance };
  }
  if (action === 'decline') {
    if (current.status !== 'offer_sent') {
      refuse(current.status, 'withdrawn', 'There is no offer to decline. To stop your application, use action "withdraw".');
    }
    const result = await declineOffer(env, {
      application: current, offer, party: 'applicant', actor: null, reason, now: at,
    });
    return { ...result, allowance };
  }
  // withdraw
  if (current.status === 'offer_sent') {
    throw new ValidationError(
      'You hold an offer. Use action "decline" so the offer is settled as declined and not left open behind you.',
      { action: 'Use decline while an offer is open' },
    );
  }
  const result = await transitionApplication(env, {
    application: current, to: 'withdrawn', party: 'applicant', actor: null, reason,
    channel: 'offer_response', now: at,
  });
  return { ...result, allowance };
}

/* ───────────────────────────────────────────────────────────────
 * WHAT THE APPLICANT IS TOLD
 * ─────────────────────────────────────────────────────────────── */

function shapeOffer(row, at) {
  if (!row) return null;
  const live = row.status === 'issued' && row.expires_at >= at;
  return {
    id: row.id,
    levelId: row.level_id,
    kind: row.kind,
    conditions: row.conditions,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    status: row.status,
    acceptable: live,
    declinedReason: row.declined_reason,
    withdrawnReason: row.withdrawn_reason,
    acceptedAt: row.accepted_at,
  };
}

/**
 * What is genuinely outstanding, and WHOSE it is. An applicant told only
 * "pending" cannot tell the difference between a step of theirs and a
 * step of the College's, and the second is the one they are entitled to
 * chase.
 */
async function outstandingFor(env, application, offer) {
  const items = [];
  switch (application.status) {
    case 'submitted':
      items.push({ who: 'the College', what: 'Arrange your placement conversation and short assessment.', note: PLACEMENT_COMMITMENT });
      break;
    case 'placement_pending':
      items.push({ who: 'you', what: 'Attend the placement conversation and short assessment. It is not an entrance exam and cannot be failed.' });
      items.push({ who: 'the College', what: 'Confirm your entry level and write your offer.' });
      break;
    case 'offer_sent':
      items.push({
        who: 'you',
        what: offer && offer.kind === 'conditional'
          ? 'Read the conditions of your offer and answer it.'
          : 'Answer your offer.',
        by: offer ? offer.expires_at : null,
      });
      break;
    case 'accepted': {
      if (!application.user_id) {
        items.push({ who: 'the College', what: 'Create your student account. An account is created at enrolment, not at application.' });
      }
      items.push({ who: 'you', what: 'Confirm your payment plan and pay, which is what begins your enrolment.' });
      break;
    }
    default:
      break;
  }
  return items;
}

function nextStep(application) {
  switch (application.status) {
    case 'submitted':
      return { who: 'the College', what: 'A member of the founding team contacts you to arrange placement.' };
    case 'placement_pending':
      return { who: 'the College', what: 'Your entry level is confirmed and a written offer follows.' };
    case 'offer_sent':
      return { who: 'you', what: 'Accept or decline your offer.' };
    case 'accepted':
      return { who: 'you and the platform together', what: 'Payment is confirmed and your enrolment for that level begins.' };
    case 'enrolled':
      return { who: 'you', what: 'Your first lesson is available. Orientation opens the digital campus.' };
    case 'withdrawn':
      return { who: 'nobody', what: 'This application is closed. Applying again is open to you at any time.' };
    case 'rejected':
      return { who: 'nobody', what: 'This application is closed. The College keeps the decision rather than deleting it.' };
    default:
      return { who: 'nobody', what: 'This application is closed.' };
  }
}

function journeyFor(status) {
  const currentIndex = PUBLISHED_JOURNEY.findIndex((s) => s.states.includes(status));
  return PUBLISHED_JOURNEY.map((stage, i) => ({
    ...stage,
    state: currentIndex === -1
      ? (CLOSED_STATUSES.includes(status) && status !== 'enrolled' ? 'closed' : 'ahead')
      : i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'ahead',
  }));
}

/**
 * The whole of what a reference buys.
 *
 * NO NAME AND NO EMAIL ADDRESS LEAVES HERE. Neither is needed to answer
 * "where is my application, what is outstanding, and what happens next",
 * and a reference that turns up in a shared browser or a forwarded email
 * should buy the status of an application and not the identity of the
 * person behind it.
 */
export async function trackApplication(env, { reference, clientKey = null, now = null } = {}) {
  const at = now ? new Date(now).toISOString() : nowIso();
  const { application, allowance } = await applicationByReference(env, { reference, clientKey, now: Date.parse(at) });

  const lapsed = await lapseExpiredOffers(env, { applicationId: application.id, now: at });
  const current = lapsed.length
    ? await db(env).prepare('SELECT * FROM applications WHERE id = ?').bind(application.id).first()
    : application;

  const offer = await latestOffer(env, current.id);
  const events = (await db(env)
    .prepare('SELECT from_status, to_status, actor_id, reason, created_at FROM application_events WHERE application_id = ? ORDER BY created_at ASC, id ASC')
    .bind(current.id)
    .all()).results || [];

  const stage = PUBLISHED_JOURNEY.find((s) => s.states.includes(current.status)) || null;

  return {
    reference: current.id,
    status: current.status,
    submittedAt: current.created_at,
    updatedAt: current.updated_at,
    closed: CLOSED_STATUSES.includes(current.status),
    stage: stage ? { number: stage.number, of: PUBLISHED_JOURNEY.length, title: stage.title, who: stage.who } : null,
    journey: journeyFor(current.status),
    // The submission itself predates this machinery and writes no event,
    // so the timeline opens with it rather than starting mid-story.
    timeline: [
      { at: current.created_at, from: null, to: 'submitted', by: 'you', note: null },
      ...events.map((e) => {
        const { party, note } = readReason(e.reason);
        return {
          at: e.created_at,
          from: e.from_status,
          to: e.to_status,
          // Never a person's name. The College is an institution to the
          // applicant, and no officer is published into an office here.
          by: party === 'applicant' ? 'you' : party === 'platform' ? 'the platform' : 'the College',
          note,
        };
      }),
    ],
    offer: shapeOffer(offer, at),
    offerLapsed: lapsed.length > 0,
    outstanding: await outstandingFor(env, current, offer),
    next: nextStep(current),
    allowance,
  };
}

/* ───────────────────────────────────────────────────────────────
 * THE ADMISSIONS QUEUE
 * ─────────────────────────────────────────────────────────────── */

export const QUEUE_DEFAULT_LIMIT = 50;
export const QUEUE_MAX_LIMIT = 200;
export const SOURCES = ['website', 'manual_bridge', 'referral'];

function parseWholeNumber(raw, { field, fallback, min, max }) {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(String(raw))) {
    throw new ValidationError(`${field} must be a whole number.`, { [field]: 'A whole number' });
  }
  const n = Number(raw);
  if (n < min || n > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max}.`, { [field]: `Between ${min} and ${max}` });
  }
  return n;
}

function parseStatuses(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const wanted = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = wanted.filter((s) => !APPLICATION_STATUSES.includes(s));
  if (unknown.length) {
    throw new ValidationError(
      `Unknown status: ${unknown.join(', ')}. The statuses are: ${APPLICATION_STATUSES.join(', ')}.`,
      { status: 'Unknown status' },
    );
  }
  return wanted.length ? wanted : null;
}

/** LIKE has its own wildcards; a search for "100%" must not match everything. */
function likeTerm(value) {
  return `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/**
 * The queue, oldest first — which is the whole point of calling it a
 * queue. An admissions list sorted newest-first is how the application
 * that has waited longest becomes the one nobody sees.
 */
export async function applicationQueue(env, {
  status = null, source = null, country = null, levelId = null, q = null,
  limit = null, offset = null, now = null,
} = {}) {
  const at = now ? new Date(now).toISOString() : nowIso();
  const take = parseWholeNumber(limit, { field: 'limit', fallback: QUEUE_DEFAULT_LIMIT, min: 1, max: QUEUE_MAX_LIMIT });
  const skip = parseWholeNumber(offset, { field: 'offset', fallback: 0, min: 0, max: 100000 });

  const statuses = parseStatuses(status);
  const where = [];
  const binds = [];

  if (statuses) {
    where.push(`a.status IN (${statuses.map(() => '?').join(',')})`);
    binds.push(...statuses);
  }
  if (source) {
    if (!SOURCES.includes(source)) {
      throw new ValidationError(`Unknown source. One of: ${SOURCES.join(', ')}.`, { source: 'Unknown source' });
    }
    where.push('a.source = ?'); binds.push(source);
  }
  if (country) {
    if (!/^[A-Za-z]{2}$/.test(String(country))) {
      throw new ValidationError('country must be a two-letter code.', { country: 'Two letters' });
    }
    where.push('a.country = ?'); binds.push(String(country).toUpperCase());
  }
  if (levelId !== null && levelId !== undefined && levelId !== '') {
    const n = parseWholeNumber(levelId, { field: 'levelId', fallback: null, min: 1, max: 6 });
    where.push('(a.placement_level_id = ? OR (a.placement_level_id IS NULL AND a.self_assessed_level_id = ?))');
    binds.push(n, n);
  }
  if (q !== null && q !== undefined && q !== '') {
    const term = String(q).trim();
    if (term.length < 2) {
      throw new ValidationError('Search for at least two characters.', { q: 'Too short' });
    }
    where.push("(a.email LIKE ? ESCAPE '\\' OR a.full_name LIKE ? ESCAPE '\\')");
    binds.push(likeTerm(term), likeTerm(term));
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = (await db(env).prepare(
    `SELECT a.id, a.status, a.full_name, a.email, a.country, a.nationality, a.source,
            a.self_assessed_level_id, a.placement_level_id, a.user_id,
            a.purpose, a.funding, a.payment_plan, a.created_at, a.updated_at,
            o.id AS offer_id, o.kind AS offer_kind, o.conditions AS offer_conditions,
            o.status AS offer_status, o.expires_at AS offer_expires_at, o.level_id AS offer_level_id
       FROM applications a
       LEFT JOIN offers o
         ON o.application_id = a.id AND o.status IN ('issued','accepted')
       ${clause}
      ORDER BY a.created_at ASC, a.id ASC
      LIMIT ? OFFSET ?`,
  ).bind(...binds, take, skip).all()).results || [];

  const total = await db(env)
    .prepare(`SELECT COUNT(*) AS n FROM applications a ${clause}`)
    .bind(...binds)
    .first();

  // The counts a queue is read for — how many are waiting at each stage —
  // measured over the same filters MINUS the status filter, so narrowing
  // to one status does not hide the rest of the queue from the person
  // working it.
  const withoutStatus = [];
  const withoutStatusBinds = [];
  {
    let i = 0;
    for (const w of where) {
      const placeholders = (w.match(/\?/g) || []).length;
      const slice = binds.slice(i, i + placeholders);
      i += placeholders;
      if (!w.startsWith('a.status IN')) { withoutStatus.push(w); withoutStatusBinds.push(...slice); }
    }
  }
  const countClause = withoutStatus.length ? `WHERE ${withoutStatus.join(' AND ')}` : '';
  const byStatusRows = (await db(env)
    .prepare(`SELECT a.status AS status, COUNT(*) AS n FROM applications a ${countClause} GROUP BY a.status`)
    .bind(...withoutStatusBinds)
    .all()).results || [];
  const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
  for (const r of byStatusRows) byStatus[r.status] = r.n;

  // The last event per application in one pass, so the queue can show
  // who last touched each row without N further queries.
  const lastEvent = new Map();
  if (rows.length) {
    const ids = rows.map((r) => r.id);
    const evs = (await db(env).prepare(
      `SELECT application_id, from_status, to_status, actor_id, reason, created_at
         FROM application_events
        WHERE application_id IN (${ids.map(() => '?').join(',')})
        ORDER BY created_at ASC, id ASC`,
    ).bind(...ids).all()).results || [];
    for (const e of evs) lastEvent.set(e.application_id, e);
  }

  return {
    count: rows.length,
    total: total ? total.n : 0,
    limit: take,
    offset: skip,
    byStatus,
    filters: { status: statuses, source: source || null, country: country || null, levelId: levelId || null, q: q || null },
    applications: rows.map((r) => {
      const e = lastEvent.get(r.id);
      const read = e ? readReason(e.reason) : { party: null, note: null };
      return {
        id: r.id,
        status: r.status,
        fullName: r.full_name,
        email: r.email,
        country: r.country,
        nationality: r.nationality,
        source: r.source,
        purpose: r.purpose,
        funding: r.funding,
        paymentPlan: r.payment_plan,
        selfAssessedLevelId: r.self_assessed_level_id,
        placementLevelId: r.placement_level_id,
        hasAccount: Boolean(r.user_id),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        daysWaiting: Math.max(0, Math.floor((Date.parse(at) - Date.parse(r.created_at)) / 86400000)),
        offer: r.offer_id ? {
          id: r.offer_id, kind: r.offer_kind, conditions: r.offer_conditions,
          status: r.offer_status, expiresAt: r.offer_expires_at, levelId: r.offer_level_id,
          expired: r.offer_status === 'issued' && r.offer_expires_at < at,
        } : null,
        lastEvent: e ? { at: e.created_at, from: e.from_status, to: e.to_status, party: read.party, actorId: e.actor_id, note: read.note } : null,
        legalNext: legalTransitionsFrom(r.status),
      };
    }),
  };
}

/**
 * The queue's PATCH brain. A member of staff names the status they want
 * and this decides which act that is, so that the offer table and the
 * application can never end up describing different things — accepting
 * an offer through the queue settles the offer, declining through the
 * queue declines it, and neither is a bare status write.
 */
export async function staffTransition(env, {
  actor, applicationId, to, reason = null, placementLevelId = undefined, now = null,
}) {
  if (typeof applicationId !== 'string' || !applicationId.trim()) {
    throw new ValidationError('applicationId is required.', { applicationId: 'Required' });
  }
  const at = now ? new Date(now).toISOString() : nowIso();
  const application = await db(env).prepare('SELECT * FROM applications WHERE id = ?').bind(applicationId.trim()).first();
  if (!application) throw new NotFoundError('No application found with that reference.');

  if (to === 'offer_sent') {
    throw new IllegalTransitionError(
      'An application reaches "offer_sent" only by an offer being issued. POST /api/admissions/offer, which writes the offer and moves the application in one act.',
      { to: 'Issue an offer instead' },
      legalTransitionsFrom(application.status),
    );
  }

  await lapseExpiredOffers(env, { applicationId: application.id, now: at });
  const current = await db(env).prepare('SELECT * FROM applications WHERE id = ?').bind(application.id).first();
  const offer = await liveOffer(env, current.id);

  if (current.status === 'offer_sent' && to === 'accepted') {
    return acceptOffer(env, { application: current, offer, party: 'staff', actor, reason, now: at });
  }
  if (current.status === 'offer_sent' && to === 'withdrawn') {
    return declineOffer(env, { application: current, offer, party: 'staff', actor, reason, now: at });
  }
  if (current.status === 'offer_sent' && to === 'placement_pending') {
    return withdrawOffer(env, { application: current, offer, actor, reason, now: at });
  }

  return transitionApplication(env, {
    application: current, to, party: 'staff', actor, reason,
    channel: 'queue', offer, placementLevelId, now: at,
  });
}
