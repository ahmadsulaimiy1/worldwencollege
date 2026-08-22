// AN INSTITUTION THAT CANNOT LIST WHAT IT HOLDS CANNOT ANSWER FOR IT.
//
// Forty-two tables in this schema hold personal data: passport numbers,
// residential addresses, emergency contacts, scans of identity
// documents, portrait photographs, and recordings of learners speaking.
//
// The inventory in migration 032 is a snapshot, and a snapshot rots.
// What does not rot is this: every table with a personal-data-shaped
// column must be either COVERED by a processing activity or EXPLICITLY
// EXCLUDED with a reason. A new table holding personal data cannot be
// added without somebody saying what the College does with it.
//
// The exclusions matter as much as the coverage. "We looked at this one
// and it is curriculum content, not a person" is a judgement, and a
// judgement that is written down can be re-read and disagreed with. A
// pattern that silently skipped those tables would be the same
// judgement, made once, by whoever wrote the regular expression.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));

const tables = db.prepare(
  `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
  .all().map((r) => r.name);

// Columns that mean a row is about an identifiable person.
const PERSONAL = /^(user_id|holder_name|email|full_name|preferred_name|display_name|phone|telephone|residential_address|nationality|passport_number|emergency_contact_name|emergency_contact_phone|sponsor_name|billing_email|contact_email|organisation_name|host_user_id|portrait_key|recording_id|audio_asset_id|audio_cue_id|edition_name|country_code|country|scholarship_id)$/;

const holdsPersonal = tables.filter((t) =>
  db.prepare('SELECT name FROM pragma_table_info(?)').all(t).some((c) => PERSONAL.test(c.name)));

check(`Every table is examined — ${tables.length}`, tables.length >= 100, tables.length);
check(`Tables shaped like they hold personal data — ${holdsPersonal.length}`,
  holdsPersonal.length >= 40, holdsPersonal.length);

// --- Coverage ---------------------------------------------------------
const activities = db.prepare('SELECT * FROM processing_activities ORDER BY sequence').all();
const excluded = new Map(db.prepare('SELECT table_name, reason FROM processing_exclusions').all()
  .map((r) => [r.table_name, r.reason]));

const covered = new Map();
for (const a of activities) {
  for (const t of a.source_tables.split(',').map((x) => x.trim()).filter(Boolean)) {
    covered.set(t, a.code);
  }
}

check(`Processing activities are recorded — ${activities.length}`, activities.length >= 10, activities.length);

// A description pointing at a table that does not exist is a
// description of nothing, and a rename would produce exactly that.
const orphans = [...covered.keys()].filter((t) => !tables.includes(t));
check('Every table named in the register actually exists',
  orphans.length === 0, orphans.join(', '));
const goneExclusions = [...excluded.keys()].filter((t) => !tables.includes(t));
check('...and so does every table listed as an exclusion',
  goneExclusions.length === 0, goneExclusions.join(', '));

// THE ASSERTION THIS FILE EXISTS FOR.
const undescribed = holdsPersonal.filter((t) => !covered.has(t) && !excluded.has(t));
check('Every table holding personal data is described or explicitly excused',
  undescribed.length === 0, undescribed.join(', '));

check('Every exclusion gives a reason somebody can disagree with',
  [...excluded.values()].every((r) => r && r.length > 25),
  [...excluded.entries()].filter(([, r]) => !r || r.length <= 25).map(([t]) => t).join(', '));

// --- Honesty about what has not been decided --------------------------
{
  const undetermined = activities.filter((a) => a.lawful_basis === 'NOT DETERMINED');
  check(`No lawful basis is invented — ${undetermined.length} of ${activities.length} undetermined`,
    undetermined.length === activities.length,
    activities.filter((a) => a.lawful_basis !== 'NOT DETERMINED').map((a) => a.code).join(', '));

  const published = activities.filter((a) => a.status === 'published');
  check('Nothing is published as a privacy notice yet', published.length === 0,
    published.map((a) => a.code).join(', '));

  let refused = false;
  try {
    db.prepare(`UPDATE processing_activities SET status = 'published' WHERE code = 'ADMISSIONS'`).run();
  } catch { refused = true; }
  check('...and an activity cannot be published while its lawful basis is undetermined', refused);
}

// --- The record agrees with the decisions that HAVE been taken --------
{
  const speech = activities.find((a) => a.code === 'SPEECH');
  check('Voice recordings are marked higher risk', speech && speech.higher_risk === 1);
  check('...and their retention quotes the decision that is in force',
    speech && /730 days/.test(speech.retention) && /D1/.test(speech.retention), speech && speech.retention);
  const live = db.prepare("SELECT value FROM platform_config WHERE key = 'recording_retention_days'").get();
  check('...and matches what the software will actually do',
    live && live.value === '730', live && live.value);

  const outcomes = activities.find((a) => a.code === 'OUTCOMES');
  check('The permanent register says it is permanent, and why',
    outcomes && /Permanent/.test(outcomes.retention) && /D3/.test(outcomes.retention),
    outcomes && outcomes.retention.slice(0, 60));

  const identity = activities.find((a) => a.code === 'ADMISSIONS');
  check('Identity documents are marked higher risk', identity && identity.higher_risk === 1);
  check('...and the register repeats that uploading is not verifying',
    identity && /not the same as verifying/i.test(identity.purpose));
}

// --- Every activity says who else sees the data -----------------------
{
  const vague = activities.filter((a) => !/Cloudflare|Clerk|Resend|Stripe|Paystack|Flutterwave|Opay|graduate shares/i.test(a.recipients));
  check('Every activity names the processors that actually see the data',
    vague.length === 0, vague.map((a) => a.code).join(', '));
  const speech = activities.find((a) => a.code === 'SPEECH');
  check('...and voice recordings say plainly that no third party gets them',
    speech && /No third party receives recordings/.test(speech.recipients));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
