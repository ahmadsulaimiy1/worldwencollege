/**
 * THE INSTITUTION THAT EXISTS.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS FILE IS THE FIRST THING THE MASTER PLAN READS
 * ────────────────────────────────────────────────────────────────────
 * The master plan opened its decade in 2027 with thirty-four learners
 * admitted, and built its demand on a reachable market of 78,900 that
 * it described as the one quantity never researched. It was modelling
 * an institution about to begin.
 *
 * The College was inaugurated in 2023. Its Principal has attested,
 * from the enrolment register and the assessment record, that eight
 * cohorts have been taught, that more than 22,000 learners in over 60
 * countries have studied with it, and that awards have been conferred
 * at Level I and Level II. That record was in data/standing.json the
 * whole time, the website read it, and neither publication ever opened
 * the file.
 *
 * So the plan starts here. Everything in this module is attested and
 * already published by the College; nothing in it is modelled.
 *
 * WHAT IT WILL NOT GIVE YOU. The record holds counts — enrolled,
 * completed at each level, awards conferred — and has not released
 * them. They are null in the file, and `released()` throws rather than
 * return them, so a renderer cannot publish an unreleased count by
 * reaching for a field that happens to exist. Nor is there any
 * financial history here: the record attests reach and cohorts, not
 * revenue, and the plan must not imply otherwise.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const S = JSON.parse(readFileSync(path.join(ROOT, 'data/standing.json'), 'utf8'));

/** Who attested the record, when, and from what. */
export const ATTESTED = Object.freeze({ ...S.attested });

/** The year the College was inaugurated. */
export const INAUGURATED = S.inaugurated;

/** Cohorts taught to date, and the one in study now. */
export const COHORTS = Object.freeze({
  run: S.cohorts.run,
  current: S.cohorts.current,
  intakesPerYear: S.cohorts.intakes_per_year,
});

/** The reach the College attests — learners who have studied with it,
 *  which is NOT the same quantity as enrolment on the qualification
 *  and must never be presented as if it were. */
export const REACH = Object.freeze({
  learners: S.reach.learners,
  countries: S.reach.countries,
  gulf: S.reach.gulf,
  saudi: S.reach.saudi,
  seatsOpen: S.reach.seats_open,
});

/** The College's own published sentences, used verbatim so the plan
 *  says exactly what the institution says and nothing stronger. */
export const SAYS = Object.freeze({ ...S.prose.en });

/** Years the institution has been teaching at the start of the plan. */
export const yearsTeachingBy = (year) => Math.max(0, year - INAUGURATED);

/**
 * An unreleased count, asked for by name. Throws unless the record has
 * released it — there is deliberately no way to read one quietly.
 */
export function released(key) {
  if (!(key in S.counts) || key === 'released') {
    throw new Error(`the record holds no count called "${key}"`);
  }
  const v = S.counts[key];
  if (v == null) {
    throw new Error(`"${key}" is held in the College's record and has not been released; `
      + 'the plan may not publish it');
  }
  return v;
}

/** What the record says about conferral, precisely. The Board paper
 *  once told the Board that the College stood two appointments away
 *  from its "first conferred award". Awards had been conferred at
 *  Level I and Level II, under the College's own academic authority
 *  and moderated inside it. What awaits appointments is different and
 *  narrower, and this states it. */
export const CONFERRAL = Object.freeze({
  conferred: Boolean(SAYS.CONFERRED),
  /* The record's own sentence, not a restatement of it — which levels
     have been conferred is the record's to say. */
  statement: SAYS.CONFERRED.replace(/&nbsp;/g, ' '),
  authority: 'the College’s own academic authority',
  moderated: 'inside the College',
  awaiting: [
    'approval of the competency mappings, which awaits a Board of Academic Standards with appointed members',
    'external moderation, which awaits the appointment of an External Examiner',
  ],
});
