-- 020 · The College could teach a learner and could not run a day around them
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_notification_preferences_user'
--
-- The probe reads sqlite_master rather than any table this file creates.
-- A probe that selects from its own new table throws "no such table" on
-- every database where the migration has not run — which is every
-- database the probe exists to ask about. The index above is the LAST
-- object this file creates, so an interrupted run leaves the probe
-- unsatisfied and the runner retries — see scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS MIGRATION EXISTS
-- ============================================================
--
-- Seventy-six tables could describe a curriculum, mark it, confer an
-- award for it and let a stranger verify the award. None of them could
-- answer a question a learner asks in their first week.
--
-- The measured evidence, each item checkable in this repository today:
--
--   · `live_sessions` has existed since the LMS milestone and NOTHING
--     records who attended one. Governance decision A7, adopted
--     14 August 2026, tabulates that in those words: "live_sessions
--     exists; nothing records who attended". It is one of three
--     executive metrics the Institutional Metric Register reports as
--     `not_instrumented` rather than as zero.
--
--   · `applications.status` carries seven values. `grep -rn "UPDATE
--     applications" functions/` returns nothing, and no file in
--     functions/ contains the strings 'offer_sent' or
--     'placement_pending'. POST /api/admissions/apply does not name
--     `status` in its INSERT, so every application the College has ever
--     taken sits on the column default. Six of the seven values are
--     unreachable, which makes the CHECK constraint a description of an
--     admissions process no code performs.
--
--   · There is no row anywhere that says the College addressed its
--     learners, that a learner wrote to a tutor, that a tutorial was
--     booked, that an appeal was heard, or that anybody was eligible to
--     graduate. The complaints and appeals procedure (E2) was ADOPTED on
--     17 August 2026 with three stages and a working-day clock on each,
--     and had nowhere to record a single case.
--
-- This file builds the machinery for those. It publishes nothing, claims
-- nothing and seeds no institutional fact the College has not decided.
--
-- ============================================================
-- WHAT THIS MIGRATION CHANGES ABOUT EARLIER REASONING
-- ============================================================
--
-- Migration 013 gave four adopted governance decisions a shape in the
-- database and stopped there, on the correct principle that structure
-- follows decision. Decision A7 was adopted the following day and its
-- first item — attendance — was left deliberately unbuilt because one
-- question was open: "does attendance mean presence at a live session,
-- or engagement with the module? The platform can measure both."
--
-- That reasoning does not move, and this file does not resolve the
-- question. `attendance_records.basis` records WHICH of the two measures
-- each row is, so the two are counted separately and the Executive
-- decides from evidence rather than deciding before any exists. A single
-- undifferentiated "attendance" number would have answered the open
-- question by accident, in whichever direction the first implementer
-- happened to lean.
--
-- Nothing here instruments academic misconduct. A7 is explicit that the
-- register must not exist before the procedure does, "worse than having
-- neither", and C9's procedure is adopted but not yet written up.
-- `registrar_cases` deliberately has no 'misconduct' kind: a table that
-- would accept an allegation is a table somebody will file one in.
--
-- ============================================================
-- WHAT IS DELIBERATELY ABSENT
-- ============================================================
--
--   · A cohort entity. docs/academic-calendar.md is marked NOT ADOPTED
--     and names the cohort as "substantial and not yet built" software
--     awaiting an Executive choice between three operating models. What
--     runs today is Executive Decision #1 — rolling admission, self-
--     paced progression — under which the set of learners with a live
--     enrolment in a level IS the cohort. So an announcement's audience
--     is the institution, a level, or one named learner, and there is no
--     'cohort' scope pointing at a table that does not exist.
--
--   · Any seeded milestone, orientation step or graduation ceremony.
--     Each would be an institutional decision made by whoever typed this
--     file. The tables ship empty, exactly as `competencies` shipped its
--     mapping empty and for the same reason: an empty record that says
--     so is honest, and a plausible one is a fabrication with a
--     timestamp on it.
--
--   · A grade point average scale. `academic_standing_reviews` can hold
--     a GPA, and holding one without the scale it was computed on is how
--     a number outlives its meaning — so `grade_scale` is required
--     whenever the number is present. The College publishes honours
--     (pass to college_distinction), not a GPA, and until a scale is
--     adopted the column stays NULL.
--
--   · Any ON DELETE clause. Nothing in this schema has one, because
--     nothing in this institution is deleted: a withdrawn award is
--     marked, a purged recording keeps its row, a revoked relation is
--     retired. A learner row that could take an appeal record with it is
--     a learner row that can erase the College's answer to them.

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 1 · ATTENDANCE — engagement, recorded descriptively              │
-- └──────────────────────────────────────────────────────────────────┘
--
-- docs/academic-framework.md § XI is unambiguous: "The College is
-- asynchronous, so attendance is the wrong measure", and engagement is
-- measured instead — "descriptive, never punitive... Engagement data
-- exists to trigger support — a tutorial, a message, an offer — and
-- never a penalty."
--
-- That sentence is why this table has no consequence column. There is no
-- threshold, no penalty, no flag that withholds anything. What it holds
-- is a state, the evidence the state was read from, and who or what read
-- it — three facts a tutor can act on and none that a policy can be
-- built on without somebody adopting one first.
--
-- The four evidence kinds drawn from the platform are the four measures
-- § XI names: lessons completed against the published pace, laboratory
-- practice submitted, live sessions attended, assessments attempted on
-- schedule. Two more exist for the two occasions a human supplies the
-- fact instead.
CREATE TABLE attendance_records (
  id                TEXT PRIMARY KEY,   -- 'att_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),

  -- THE OPEN QUESTION, CARRIED RATHER THAN ANSWERED. Decision A7 asks
  -- whether attendance means presence at a live session or engagement
  -- with the module, and says the platform can measure both. It measures
  -- both, and says which — so neither is ever silently counted as the
  -- other, and the eventual decision is made against real figures.
  basis             TEXT NOT NULL CHECK (basis IN ('live_session','module_engagement')),
  live_session_id   TEXT REFERENCES live_sessions(id),
  unit_id           TEXT REFERENCES units(id),   -- a MODULE in framework terms

  -- The period the state describes. A live session's window is the
  -- session; a module's is whatever period the reader asked about, and
  -- storing both ends means a figure can be recomputed for a different
  -- period without pretending this row covered it.
  window_start      TEXT NOT NULL,
  window_end        TEXT NOT NULL,

  state             TEXT NOT NULL CHECK (state IN ('attended','partial','absent','excused')),
  -- Present only where it was actually measured. A live session that
  -- reports join and leave times has this; a module engagement window
  -- inferred from a completed lesson does not, and inventing a duration
  -- for it would put a number on the College's engagement reporting that
  -- nothing observed.
  minutes_present   INTEGER CHECK (minutes_present IS NULL OR minutes_present >= 0),

  -- WHAT THE STATE WAS READ FROM. The first four are the four engagement
  -- measures of § XI; the last two are the two ways a person supplies
  -- the fact instead of the platform observing it.
  evidence_kind     TEXT NOT NULL CHECK (evidence_kind IN
                      ('lesson_completion','laboratory_practice','live_session_join',
                       'assessment_attempt','staff_register','learner_declaration')),
  -- The id of the row the evidence is: a unit_progress id, a
  -- learner_recordings id, a quiz_attempts id. Not a foreign key,
  -- because it points into six different tables — the same reasoning
  -- academic_relations records for its endpoints, and with the same
  -- consequence: integrity here is the application's job.
  evidence_ref      TEXT,

  -- WHO OR WHAT. NULL means the platform read a signal and no person
  -- formed a view — the same honesty enrolment_events.actor_id carries,
  -- where a nullable actor means a payment webhook did it.
  recorded_by       TEXT REFERENCES users(id),
  recorded_via      TEXT NOT NULL CHECK (recorded_via IN
                      ('platform_signal','staff_register','learner_declaration')),

  -- Why, where the state is not self-explanatory. Required for
  -- 'excused': an excusal with no reason is an absence somebody quietly
  -- forgave, and the learner is entitled to know on what grounds.
  reason            TEXT,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (basis != 'live_session' OR (live_session_id IS NOT NULL AND unit_id IS NULL)),
  CHECK (basis != 'module_engagement' OR (unit_id IS NOT NULL AND live_session_id IS NULL)),
  CHECK (window_end > window_start),
  CHECK (state != 'excused' OR reason IS NOT NULL),
  -- 'partial' is a claim about how much, and a claim about how much
  -- without the amount is just 'attended' hedged.
  CHECK (state != 'partial' OR minutes_present IS NOT NULL),
  -- Only the platform may record anonymously. A register mark and a
  -- learner's own declaration are somebody's statement and are attributed.
  CHECK (recorded_via = 'platform_signal' OR recorded_by IS NOT NULL)
);
CREATE INDEX idx_attendance_user ON attendance_records(user_id, window_start DESC);
CREATE INDEX idx_attendance_session ON attendance_records(live_session_id)
  WHERE live_session_id IS NOT NULL;
CREATE INDEX idx_attendance_unit ON attendance_records(unit_id, window_start)
  WHERE unit_id IS NOT NULL;
-- One row per learner per session, and one per learner per module window.
-- PARTIAL because the two halves of this table are keyed differently and
-- a single unique constraint over nullable columns would enforce neither.
CREATE UNIQUE INDEX idx_attendance_one_per_session
  ON attendance_records(user_id, live_session_id) WHERE live_session_id IS NOT NULL;
CREATE UNIQUE INDEX idx_attendance_one_per_window
  ON attendance_records(user_id, unit_id, window_start) WHERE unit_id IS NOT NULL;

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 2 · ANNOUNCEMENTS — what the College said, and who has seen it   │
-- └──────────────────────────────────────────────────────────────────┘
--
-- An announcement is the only thing on this list that the institution
-- says rather than records, so it is the only one whose author must be a
-- named account and never the platform. `author_id` is NOT NULL for the
-- same reason role_events.actor_id is: nothing should address every
-- learner in the College with no person behind it.
--
-- The publication window is two columns rather than a single "live"
-- flag. An enrolment deadline announced on the 3rd and irrelevant after
-- the 20th should stop being new on the 20th without anybody
-- remembering to take it down, and a dashboard that shows a stale notice
-- is how learners stop reading notices.
CREATE TABLE announcements (
  id                TEXT PRIMARY KEY,   -- 'ann_' + uuid
  author_id         TEXT NOT NULL REFERENCES users(id),
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,

  -- THREE SCOPES, AND WHY THERE IS NO FOURTH. Under Executive Decision
  -- #1 the College admits continuously and learners progress at their
  -- own rate, so the people studying Level III together at any moment
  -- ARE the Level III cohort — the level scope already addresses them.
  -- A 'cohort' value would have to point at a table that
  -- docs/academic-calendar.md has not been authorised to create.
  audience_scope    TEXT NOT NULL CHECK (audience_scope IN ('institution','level','learner')),
  level_id          INTEGER REFERENCES programme_levels(id),
  audience_user_id  TEXT REFERENCES users(id),

  pinned            INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0,1)),

  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','withdrawn')),
  publish_from      TEXT NOT NULL,
  -- NULL means it stands until withdrawn. Deliberately allowed, unlike
  -- profile_shares.expires_at: a share is a bearer credential handed to
  -- one employer, whereas a standing notice about how to reach the
  -- Registrar should not expire on a date somebody had to guess.
  publish_until     TEXT,
  published_at      TEXT,
  -- A withdrawn announcement is marked, never deleted. What the College
  -- told its learners and then took back is precisely the thing a
  -- reviewer will ask about.
  withdrawn_at      TEXT,
  withdrawn_reason  TEXT,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (audience_scope != 'institution' OR (level_id IS NULL AND audience_user_id IS NULL)),
  CHECK (audience_scope != 'level'       OR (level_id IS NOT NULL AND audience_user_id IS NULL)),
  CHECK (audience_scope != 'learner'     OR (audience_user_id IS NOT NULL AND level_id IS NULL)),
  CHECK (publish_until IS NULL OR publish_until > publish_from),
  CHECK (status != 'published' OR published_at IS NOT NULL),
  CHECK (status != 'withdrawn' OR (withdrawn_at IS NOT NULL AND withdrawn_reason IS NOT NULL))
);
-- The dashboard's own query: live notices, pinned first, newest next.
-- Equality predicate then the sort columns, so the planner seeks and
-- never sorts — the shape idx_awards_roll was measured into.
CREATE INDEX idx_announcements_live
  ON announcements(status, pinned DESC, publish_from DESC);
CREATE INDEX idx_announcements_level
  ON announcements(level_id, publish_from DESC) WHERE level_id IS NOT NULL;
CREATE INDEX idx_announcements_learner
  ON announcements(audience_user_id, publish_from DESC) WHERE audience_user_id IS NOT NULL;

-- The receipt is what makes "what is new" answerable. Its ABSENCE is the
-- unread state, so no row is written when nothing has happened and the
-- table stays proportional to what learners actually read rather than to
-- announcements multiplied by learners.
--
-- `dismissed_at` is a second, separate act. A learner may read a notice
-- and want it to stay on the dashboard; collapsing the two would make
-- reading something the cost of losing it.
CREATE TABLE announcement_receipts (
  id                TEXT PRIMARY KEY,   -- 'anr_' + uuid
  announcement_id   TEXT NOT NULL REFERENCES announcements(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  read_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  dismissed_at      TEXT,
  UNIQUE (announcement_id, user_id)
);
CREATE INDEX idx_announcement_receipts_user ON announcement_receipts(user_id, read_at DESC);

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 3 · MESSAGING — a tutor sees their own learners, structurally     │
-- └──────────────────────────────────────────────────────────────────┘
--
-- THE AUTHORISATION IS THE MEMBERSHIP ROW, AND THAT IS THE WHOLE DESIGN.
--
-- The obvious alternative — a tutor sees every thread at the levels they
-- teach — needs a "levels they teach" fact the schema does not hold, and
-- would grant a new tutor retrospective sight of every conversation a
-- learner ever had at that level. So a thread is visible to exactly the
-- people in `message_participants`, a query for a tutor's threads is a
-- join through their own participant rows, and there is no query shape
-- that can return a thread they were never added to. Widening access
-- becomes an INSERT somebody performs and the trail records, rather than
-- a WHERE clause nobody reviews.
--
-- `left_at` rather than deletion: a tutor who hands a learner on should
-- stop seeing new messages without the record forgetting they were once
-- party to the conversation.
CREATE TABLE message_threads (
  id                TEXT PRIMARY KEY,   -- 'mth_' + uuid
  subject           TEXT NOT NULL,

  -- Scoped to a level or a module, never floating. A message about
  -- nothing in particular is a message no successor tutor can pick up.
  scope             TEXT NOT NULL CHECK (scope IN ('level','module')),
  level_id          INTEGER REFERENCES programme_levels(id),
  -- A unit already knows its course and its level, so a module-scoped
  -- thread does not repeat the level and cannot contradict it.
  unit_id           TEXT REFERENCES units(id),

  opened_by         TEXT NOT NULL REFERENCES users(id),
  -- 'answered' is not 'closed'. A learner whose question has been
  -- answered may still reply; a closed thread is one somebody decided is
  -- finished, and the two must be distinguishable on a tutor's list.
  status            TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','answered','closed')),
  closed_by         TEXT REFERENCES users(id),
  closed_at         TEXT,
  closed_reason     TEXT,

  -- Denormalised so a thread list is one index seek instead of a
  -- MAX(sent_at) per thread. Written by the same statement that inserts
  -- a message, exactly as unit_progress is written by the code path that
  -- records the attempt.
  last_message_at   TEXT NOT NULL,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (scope != 'level'  OR (level_id IS NOT NULL AND unit_id IS NULL)),
  CHECK (scope != 'module' OR unit_id IS NOT NULL),
  CHECK (status != 'closed' OR (closed_at IS NOT NULL AND closed_by IS NOT NULL))
);
CREATE INDEX idx_message_threads_activity ON message_threads(status, last_message_at DESC);
CREATE INDEX idx_message_threads_level
  ON message_threads(level_id, last_message_at DESC) WHERE level_id IS NOT NULL;

CREATE TABLE message_participants (
  id                TEXT PRIMARY KEY,   -- 'mpt_' + uuid
  thread_id         TEXT NOT NULL REFERENCES message_threads(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  -- What this person is to the thread, not what they are to the College.
  -- A registrar joining an escalated thread is not thereby the learner's
  -- tutor, and a list of "my learners" must not acquire them.
  party             TEXT NOT NULL CHECK (party IN ('learner','tutor','registrar')),
  added_by          TEXT REFERENCES users(id),

  -- READ STATE, AS A WATERMARK RATHER THAN A RECEIPT PER MESSAGE. An
  -- unread count is "messages after this timestamp", which is the same
  -- answer at a fraction of the rows: per-message receipts would write
  -- one row per participant per message for a conversation that is
  -- almost always two people, to answer a question neither of them asks.
  -- announcement_receipts is per-item because an announcement has no
  -- ordering to watermark against.
  last_read_at      TEXT,
  left_at           TEXT,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (thread_id, user_id)
);
CREATE INDEX idx_message_participants_user ON message_participants(user_id, left_at);

CREATE TABLE messages (
  id                TEXT PRIMARY KEY,   -- 'msg_' + uuid
  thread_id         TEXT NOT NULL REFERENCES message_threads(id),
  sender_id         TEXT NOT NULL REFERENCES users(id),
  body              TEXT NOT NULL,
  sent_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- Withdrawn, not deleted, and never without a reason — the rule
  -- academic_distinctions established. A message that can vanish without
  -- trace is a message a learner cannot later prove was sent to them.
  withdrawn_at      TEXT,
  withdrawn_reason  TEXT,
  CHECK (withdrawn_at IS NULL OR withdrawn_reason IS NOT NULL)
);
CREATE INDEX idx_messages_thread ON messages(thread_id, sent_at);

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 4 · TIMETABLE AND BOOKINGS — a seat, taken by a named learner     │
-- └──────────────────────────────────────────────────────────────────┘
--
-- `live_sessions` is not replaced and not duplicated. It answers "what
-- is scheduled"; these answer "who may take a place in it, and who did".
-- A slot may point at a live session — the seat at a scheduled class —
-- or stand alone as a tutor's own offered time, which is what a
-- one-to-one tutorial and an oral defence are.
--
-- The alternative was columns on `live_sessions` for capacity and
-- bookings. It was rejected because a live session is a broadcast
-- everybody at a level may join and a tutorial is a place one person
-- holds; giving one table both meanings would make "is this full" a
-- question with two right answers.
CREATE TABLE tutorial_slots (
  id                TEXT PRIMARY KEY,   -- 'slt_' + uuid
  tutor_id          TEXT NOT NULL REFERENCES users(id),
  -- Set when the slot is a place at an already-scheduled class.
  live_session_id   TEXT REFERENCES live_sessions(id),
  -- NULL level means open to any level — a general office hour.
  level_id          INTEGER REFERENCES programme_levels(id),
  unit_id           TEXT REFERENCES units(id),

  title             TEXT NOT NULL,
  -- 'oral_defence' is here because the academic framework requires every
  -- capstone to be defended live. A defence that has to be booked
  -- through the same machinery as an office hour is a defence that
  -- actually gets scheduled.
  kind              TEXT NOT NULL DEFAULT 'tutorial'
                    CHECK (kind IN ('tutorial','oral_defence','office_hour','workshop')),

  starts_at         TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  -- Capacity is declared here and ENFORCED IN THE APPLICATION: SQLite
  -- cannot count another table's rows in a CHECK, so the booking path
  -- must count live bookings inside the same statement that inserts one.
  -- Stated rather than assumed, in the manner of learner_recordings'
  -- upload_status note — a constraint the schema cannot carry must say
  -- where it is carried instead.
  capacity          INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0),
  join_url          TEXT,

  status            TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','closed','cancelled','held')),
  cancelled_at      TEXT,
  -- A tutor who cancels on a learner owes them the reason. This is the
  -- one column that turns a cancellation from something that happened
  -- into something somebody did.
  cancelled_reason  TEXT,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (status != 'cancelled' OR (cancelled_at IS NOT NULL AND cancelled_reason IS NOT NULL))
);
CREATE INDEX idx_tutorial_slots_tutor ON tutorial_slots(tutor_id, starts_at);
-- What a learner opening the timetable asks for, and nothing else.
-- PARTIAL, because a slot is bookable for days and then never again.
CREATE INDEX idx_tutorial_slots_open ON tutorial_slots(starts_at) WHERE status = 'open';
CREATE INDEX idx_tutorial_slots_session
  ON tutorial_slots(live_session_id) WHERE live_session_id IS NOT NULL;

CREATE TABLE slot_bookings (
  id                TEXT PRIMARY KEY,   -- 'bkg_' + uuid
  slot_id           TEXT NOT NULL REFERENCES tutorial_slots(id),
  user_id           TEXT NOT NULL REFERENCES users(id),

  -- WHO CANCELLED IS PART OF THE STATE, not a separate flag. "The
  -- learner did not come" and "the tutor called it off" are different
  -- facts about different people, and a single 'cancelled' value would
  -- let a tutor's cancellation read as a learner's on the learner's own
  -- record.
  status            TEXT NOT NULL DEFAULT 'booked'
                    CHECK (status IN ('booked','attended','no_show',
                                      'cancelled_by_learner','cancelled_by_tutor')),
  -- What the learner wants to use the time for. A tutor who reads it
  -- before the call spends the call on the problem.
  learner_note      TEXT,

  booked_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  cancelled_at      TEXT,
  cancellation_reason TEXT,

  CHECK (status NOT IN ('cancelled_by_learner','cancelled_by_tutor')
         OR (cancelled_at IS NOT NULL AND cancellation_reason IS NOT NULL))
);
CREATE INDEX idx_slot_bookings_slot ON slot_bookings(slot_id, status);
CREATE INDEX idx_slot_bookings_user ON slot_bookings(user_id, booked_at DESC);
-- One LIVE booking per learner per slot. PARTIAL, excluding both
-- cancelled states, because cancelling and rebooking the same slot is a
-- normal thing a learner does and the earlier booking must survive —
-- the reasoning idx_enrolments_one_live_per_level established.
CREATE UNIQUE INDEX idx_slot_bookings_one_live
  ON slot_bookings(slot_id, user_id)
  WHERE status NOT IN ('cancelled_by_learner','cancelled_by_tutor');

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 5 · APPLICANT LIFECYCLE — the status column, finally reachable    │
-- └──────────────────────────────────────────────────────────────────┘
--
-- `applications.status` has always had 'offer_sent' and 'accepted' in
-- its CHECK constraint and nothing has ever written either. What was
-- missing is not a status column; it is everything an offer needs to be
-- an offer — conditions, an expiry, an acceptance, and a record of who
-- moved the application and why.
--
-- application_events mirrors enrolment_events deliberately, down to the
-- nullable actor. Two audit trails with two shapes would be two things
-- to learn and two places to be inconsistent, and an admissions officer
-- reading one after the other should not have to translate.
CREATE TABLE application_events (
  id                TEXT PRIMARY KEY,   -- 'aev_' + uuid
  application_id    TEXT NOT NULL REFERENCES applications(id),
  from_status       TEXT,               -- NULL when the application is first created
  to_status         TEXT NOT NULL,
  -- NULL means the platform did it — an expiry sweep lapsing an offer,
  -- a payment webhook enrolling an accepted applicant. Honest, because
  -- no person made that decision.
  actor_id          TEXT REFERENCES users(id),
  reason            TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_application_events_application
  ON application_events(application_id, created_at);
CREATE INDEX idx_application_events_actor ON application_events(actor_id, created_at);

-- An offer is a promise with a date on it, and both halves are enforced.
--
-- `expires_at` is NOT NULL for the reason profile_shares.expires_at is:
-- an offer with no expiry is a place held open for ever, which the
-- College cannot honour and should therefore not be able to record. A
-- conditional offer with no conditions is the same fault in the other
-- direction — a condition nobody wrote down is a condition the applicant
-- cannot meet.
CREATE TABLE offers (
  id                TEXT PRIMARY KEY,   -- 'ofr_' + uuid
  application_id    TEXT NOT NULL REFERENCES applications(id),
  -- The level offered, which is not necessarily the level applied for:
  -- placement is confirmed by assessment, and the offer is made against
  -- the confirmed level.
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),

  kind              TEXT NOT NULL CHECK (kind IN ('conditional','unconditional')),
  conditions        TEXT,

  -- A named officer, never the platform. Nothing should offer a person a
  -- place with nobody behind it.
  issued_by         TEXT NOT NULL REFERENCES users(id),
  issued_at         TEXT NOT NULL,
  expires_at        TEXT NOT NULL,

  status            TEXT NOT NULL DEFAULT 'issued'
                    CHECK (status IN ('issued','accepted','declined','withdrawn','lapsed')),
  -- 'lapsed' is what an expiry sweep sets and 'withdrawn' is what the
  -- College does. An applicant who ran out of time and one the College
  -- changed its mind about are owed different letters.
  conditions_met_at TEXT,
  conditions_met_by TEXT REFERENCES users(id),
  accepted_at       TEXT,
  declined_at       TEXT,
  declined_reason   TEXT,
  withdrawn_at      TEXT,
  withdrawn_reason  TEXT,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (kind != 'conditional'   OR conditions IS NOT NULL),
  CHECK (kind != 'unconditional' OR conditions IS NULL),
  CHECK (expires_at > issued_at),
  CHECK (status != 'accepted'  OR accepted_at IS NOT NULL),
  CHECK (status != 'declined'  OR declined_at IS NOT NULL),
  CHECK (status != 'withdrawn' OR (withdrawn_at IS NOT NULL AND withdrawn_reason IS NOT NULL)),
  -- Somebody decided the conditions were met. Not the platform.
  CHECK (conditions_met_at IS NULL OR conditions_met_by IS NOT NULL)
);
CREATE INDEX idx_offers_application ON offers(application_id, issued_at DESC);
-- The expiry sweep's own query: live offers, by the date they run out.
CREATE INDEX idx_offers_expiry ON offers(expires_at) WHERE status = 'issued';
-- One LIVE offer per application. PARTIAL, so a lapsed or declined offer
-- can be followed by a fresh one — a re-offer after a deferral is a real
-- thing an admissions office does — while two open offers to the same
-- applicant, which is how a College ends up honouring the wrong one,
-- cannot exist.
CREATE UNIQUE INDEX idx_offers_one_live_per_application
  ON offers(application_id) WHERE status IN ('issued','accepted');

-- The orientation checklist. SHIPS EMPTY, and that is the point.
--
-- docs/academic-calendar.md, which would decide when orientation runs
-- and what it contains, is marked NOT ADOPTED. Seeding four plausible
-- steps here would put an institutional process into the database on the
-- authority of whoever typed this file — the same fabrication the
-- competency mapping refused, and for the same reason. The structure
-- exists so the process has somewhere to land the day it is decided.
CREATE TABLE orientation_steps (
  id                TEXT PRIMARY KEY,   -- 'ost_' + uuid
  code              TEXT NOT NULL UNIQUE,
  sequence          INTEGER NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  detail            TEXT NOT NULL,
  -- Whose job it is. A checklist that does not say who acts is a
  -- checklist where every outstanding item is the learner's fault.
  owner             TEXT NOT NULL CHECK (owner IN ('learner','registrar','finance','tutor')),
  required          INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0,1)),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE orientation_progress (
  id                TEXT PRIMARY KEY,   -- 'orp_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  step_id           TEXT NOT NULL REFERENCES orientation_steps(id),
  -- Which acceptance this checklist belongs to. NULL for a learner who
  -- reached the College by a route with no offer behind it.
  offer_id          TEXT REFERENCES offers(id),
  state             TEXT NOT NULL DEFAULT 'outstanding'
                    CHECK (state IN ('outstanding','in_progress','complete','waived')),
  -- What satisfied it: a kyc_documents id, a payments id, an
  -- attendance_records id for the orientation session itself.
  evidence_ref      TEXT,
  completed_at      TEXT,
  -- A waiver is somebody's decision and carries their name and their
  -- grounds. Without both it is a step quietly skipped.
  waived_by         TEXT REFERENCES users(id),
  waived_reason     TEXT,
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  UNIQUE (user_id, step_id),
  CHECK (state != 'complete' OR completed_at IS NOT NULL),
  CHECK (state != 'waived'   OR (waived_by IS NOT NULL AND waived_reason IS NOT NULL))
);
CREATE INDEX idx_orientation_progress_user ON orientation_progress(user_id, state);

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 6 · REGISTRAR CASES — one table, and the reason it is one         │
-- └──────────────────────────────────────────────────────────────────┘
--
-- THE DECISION: one `registrar_cases` table with a `kind` discriminator,
-- not five near-identical tables.
--
-- The five differ in what the learner is asking for and are identical in
-- what the institution does about it. Every one of them is: a person
-- raises a matter, it is heard at a stage by somebody not party to the
-- stage before, an answer is owed by a date, a decision is taken by a
-- named officer, and the whole thing is auditable afterwards. That is
-- one process, and governance decision E2 — ADOPTED 17 August 2026 —
-- describes it once for complaints and appeals together rather than
-- twice.
--
-- Five tables would mean five schemas to keep in step with one adopted
-- procedure, five audit trails, and — the fault that decided it — a
-- five-way UNION every time the Registrar asks the only question that
-- matters day to day: what is open, and what is late. With one table
-- that is one indexed query, and `idx_registrar_cases_due` below is it.
--
-- What the discriminator costs is honestly stated: a withdrawal has no
-- three-stage appeal and an appeal has no refund arithmetic, so some
-- columns are NULL for some kinds. That cost is a nullable column. The
-- alternative's cost is an institution that cannot see its own caseload.
--
-- MISCONDUCT IS NOT A KIND HERE. Decision A7 rules that a register must
-- not precede the procedure — "a misconduct register without an approved
-- procedure would invite staff to record allegations against learners
-- with no defined process, no right of reply and no appeal. That is
-- worse than having neither." C9's procedure is adopted in principle and
-- not yet written; until it is, this table cannot accept an allegation
-- because the CHECK constraint does not contain the word.
CREATE TABLE registrar_cases (
  id                TEXT PRIMARY KEY,   -- 'rcs_' + uuid
  -- The reference the learner is given and quotes back. Stable for the
  -- life of the case, in the manner of evidence_items.reference — a
  -- person chasing an appeal should not have to quote a UUID.
  reference         TEXT NOT NULL UNIQUE,
  user_id           TEXT NOT NULL REFERENCES users(id),

  kind              TEXT NOT NULL
                    CHECK (kind IN ('appeal','complaint','withdrawal','deferral','transfer')),
  -- WHAT THE CASE IS ABOUT, which is not the same as what was asked for,
  -- and which E2 makes load-bearing: stage three goes to the Governor
  -- for Academic Affairs on academic matters and the Governor for Ethics
  -- and Institutional Values on conduct, welfare or fair treatment. The
  -- routing is a published rule, so the fact it routes on is a column.
  matter            TEXT NOT NULL CHECK (matter IN
                      ('academic','conduct','welfare','fair_treatment','administrative')),

  enrolment_id      TEXT REFERENCES enrolments(id),
  level_id          INTEGER REFERENCES programme_levels(id),
  summary           TEXT NOT NULL,
  detail            TEXT,

  -- E2's three stages, named as it names them, plus the states either
  -- side of them. 'awaiting_information' stops the clock honestly: a
  -- case waiting on the learner is not a case the College is late on,
  -- and without it every pause looks like a breach.
  stage             TEXT NOT NULL DEFAULT 'received'
                    CHECK (stage IN ('received','stage_one','stage_two','stage_three',
                                     'awaiting_information','determined','closed')),
  -- The post that hears the current stage, as a ROLE and never a name —
  -- the rule evidence_items follows, because the post outlives whoever
  -- holds it and naming a person who does not hold it would be
  -- fabricating personnel.
  heard_by_role     TEXT,
  -- THE DEADLINE THE CURRENT STAGE IS BOUND BY. E2 sets them in working
  -- days — ten for a stage one answer, twenty for a stage two — and the
  -- working-day arithmetic belongs to the code that reads the published
  -- procedure, not to a column that would have to encode a calendar.
  answer_due        TEXT,

  outcome           TEXT CHECK (outcome IS NULL OR outcome IN
                      ('upheld','partly_upheld','not_upheld','substituted',
                       'returned_for_fresh_assessment','granted','refused',
                       'withdrawn_by_learner')),
  -- 'substituted' and 'returned_for_fresh_assessment' are E2's own words
  -- for what the Senate may do at stage two, and they are not the same
  -- as 'upheld': one replaces the decision, the other sends the work to
  -- a different marker, and a learner is entitled to know which happened.
  decision          TEXT,
  decided_by        TEXT REFERENCES users(id),
  decided_on        TEXT,

  opened_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  closed_at         TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- A determination names its maker, its date, its outcome and its
  -- reasons. A finding made without a documented process is not
  -- defensible — C9's rationale, enforced here rather than trusted.
  CHECK (stage != 'determined' OR (outcome IS NOT NULL AND decision IS NOT NULL
         AND decided_by IS NOT NULL AND decided_on IS NOT NULL)),
  CHECK (stage != 'closed' OR closed_at IS NOT NULL),
  -- A stage that is being heard is a stage the College owes an answer on
  -- by a date. Without this the clock E2 sets is optional.
  CHECK (stage NOT IN ('stage_one','stage_two','stage_three') OR answer_due IS NOT NULL)
);
CREATE INDEX idx_registrar_cases_user ON registrar_cases(user_id, opened_at DESC);
CREATE INDEX idx_registrar_cases_kind ON registrar_cases(kind, stage);
-- The Registrar's morning question, as one seek: what is still live, in
-- the order it falls due. PARTIAL, because a determined case has no
-- deadline left to breach and closed cases are the majority in the end.
CREATE INDEX idx_registrar_cases_due ON registrar_cases(answer_due)
  WHERE stage NOT IN ('determined','closed');

-- The trail, which is what makes E2's "no stage may be skipped by the
-- College to reach a faster conclusion" checkable. from_stage/to_stage
-- on every move means a skip is visible in the record rather than
-- inferable from an absence.
CREATE TABLE registrar_case_events (
  id                TEXT PRIMARY KEY,   -- 'rce_' + uuid
  case_id           TEXT NOT NULL REFERENCES registrar_cases(id),
  from_stage        TEXT,               -- NULL when the case is opened
  to_stage          TEXT NOT NULL,
  actor_id          TEXT REFERENCES users(id),
  -- The post the actor acted in. E2 rests on each stage being heard by
  -- somebody not party to the one before, and that is a claim about
  -- office as much as person.
  actor_role        TEXT,
  -- NOT NULL. A stage change with no note is the institution moving a
  -- person's case without saying why, which is precisely the thing an
  -- appeal procedure exists to prevent.
  note              TEXT NOT NULL,
  -- What the clock was reset to on entering the new stage, so a
  -- reviewer can see the deadline as it stood then rather than only as
  -- it stands now.
  answer_due_after  TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_registrar_case_events_case ON registrar_case_events(case_id, created_at);

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 7 · ACHIEVEMENTS — a milestone that names the fact it marks       │
-- └──────────────────────────────────────────────────────────────────┘
--
-- `academic_fact` is NOT NULL and it is the whole difference between
-- this and a badge system. A definition must say what academic thing is
-- true of a learner who holds it — "has completed every module of one
-- level", "has been marked against all six competencies" — because a
-- milestone that marks nothing is a decoration the College would then
-- have to defend on a transcript.
--
-- `evidence_source` is constrained to tables that hold academic facts.
-- Nothing can be earned from a login streak, because there is no table
-- in the list that records one.
--
-- SHIPS EMPTY. Which achievements the College honours is an institution's
-- decision about what it values, and the definitions carry a proposed /
-- approved / retired life for the same reason every other claim in this
-- schema does.
CREATE TABLE milestone_definitions (
  id                TEXT PRIMARY KEY,   -- 'mdf_' + uuid
  code              TEXT NOT NULL UNIQUE,
  sequence          INTEGER NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  -- The academic fact this marks, stated as a fact and not as praise.
  academic_fact     TEXT NOT NULL,
  -- Where that fact is read from. A closed list of tables that hold
  -- assessed or attested academic evidence.
  evidence_source   TEXT NOT NULL CHECK (evidence_source IN
                      ('unit_progress','quiz_attempts','assignment_submissions',
                       'competency_marks','attendance_records','awards',
                       'academic_distinctions','learner_recordings')),
  level_id          INTEGER REFERENCES programme_levels(id),
  -- Some facts are true once (finished Level I); some are true again
  -- each time (defended a capstone). Declared, so a dashboard does not
  -- have to guess which it is looking at.
  repeatable        INTEGER NOT NULL DEFAULT 0 CHECK (repeatable IN (0,1)),
  status            TEXT NOT NULL DEFAULT 'proposed'
                    CHECK (status IN ('proposed','approved','retired')),
  approved_by       TEXT REFERENCES users(id),
  approved_at       TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (status != 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE learner_milestones (
  id                TEXT PRIMARY KEY,   -- 'mil_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  definition_id     TEXT NOT NULL REFERENCES milestone_definitions(id),
  earned_on         TEXT NOT NULL,      -- a date: earning one is a day

  -- THE EVIDENCE THAT EARNED IT, carried on the row rather than
  -- recomputed. A milestone whose evidence cannot be produced is an
  -- assertion, and the first time a learner asks "why do I have this"
  -- the answer must be a row somebody can open.
  evidence_source   TEXT NOT NULL,
  evidence_id       TEXT NOT NULL,

  awarded_by        TEXT REFERENCES users(id),  -- NULL = the platform read the fact
  revoked_at        TEXT,
  revoked_reason    TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- The same evidence cannot earn the same milestone twice. This is the
  -- real integrity rule, and it is stricter than UNIQUE(user, definition)
  -- where it should be and looser where it should be: a repeatable
  -- milestone earned from a second capstone is a second fact, and a
  -- re-run of the awarding sweep over the first one is not.
  UNIQUE (user_id, definition_id, evidence_id),
  CHECK (revoked_at IS NULL OR revoked_reason IS NOT NULL)
);
CREATE INDEX idx_learner_milestones_user ON learner_milestones(user_id, earned_on DESC);
CREATE INDEX idx_learner_milestones_definition ON learner_milestones(definition_id);

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 8 · ACADEMIC STANDING — computed once, and explicable afterwards  │
-- └──────────────────────────────────────────────────────────────────┘
--
-- The three standings are not invented here. docs/academic-framework.md
-- names exactly three — In Good Standing, Under Review, Suspended
-- Progression — and adds the constraint that gives this table its shape:
-- "No standing removes access to learning. Nothing here expires, locks
-- or withdraws." So there is no column here that anything could gate on.
--
-- STORED, NOT RECOMPUTED, and the reason is not performance. A standing
-- is a statement the College made about a learner on a date, under a
-- version of its regulations, from figures that have since moved. Recompute
-- it on read and last quarter's Under Review silently becomes this
-- quarter's Good Standing — which is the same fault issued_documents
-- was built to close, where regenerating a transcript from live data
-- would make an honest historical document fail verification.
--
-- `basis_json` is what makes the stored figure answerable a year later.
CREATE TABLE academic_standing_reviews (
  id                TEXT PRIMARY KEY,   -- 'asr_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  enrolment_id      TEXT REFERENCES enrolments(id),
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  -- The review point this is the standing AT: '2027-Q1', 'level_midpoint'.
  -- Named rather than dated so two learners reviewed a week apart under
  -- the same review are comparable.
  review_point      TEXT NOT NULL,

  standing          TEXT NOT NULL CHECK (standing IN
                      ('in_good_standing','under_review','suspended_progression')),

  -- The College publishes honours, not a grade point average, and no GPA
  -- scale has been adopted. The column exists because a standing
  -- computed under a future scale must be able to record the number —
  -- and `grade_scale` is required alongside it, so a figure can never
  -- outlive the scale that gives it meaning. Both stay NULL until a
  -- scale is adopted.
  grade_point_average REAL,
  grade_scale       TEXT,

  -- Proportion of the level's modules completed at the review point,
  -- 0..1 — the same convention competency_marks and quiz_attempts use,
  -- so no reader has to ask whether a number is a fraction or a percent.
  completion        REAL CHECK (completion IS NULL OR (completion >= 0 AND completion <= 1)),

  -- WHICH RULES THIS WAS COMPUTED UNDER. Regulations change; a standing
  -- that does not say which version it was decided by cannot be defended
  -- to the learner it was decided about.
  regulation_version TEXT NOT NULL,
  -- The counts the standing was read from, frozen. Not a cache of the
  -- current truth — the record of what was true on the day, exactly as
  -- issued_documents.payload_json is.
  basis_json        TEXT NOT NULL,

  computed_at       TEXT NOT NULL,
  computed_by       TEXT REFERENCES users(id),  -- NULL = the platform
  -- Why, for anything other than good standing. Under Review "triggers a
  -- tutorial, not a sanction", and a tutorial nobody can explain the
  -- reason for is a summons.
  note              TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  UNIQUE (user_id, level_id, review_point),
  CHECK (grade_point_average IS NULL OR grade_scale IS NOT NULL),
  CHECK (standing = 'in_good_standing' OR note IS NOT NULL)
);
CREATE INDEX idx_academic_standing_user
  ON academic_standing_reviews(user_id, computed_at DESC);
-- Everyone who needs reaching, newest first. PARTIAL, because the
-- overwhelming majority of rows are — and the College should want them
-- to be — good standing.
CREATE INDEX idx_academic_standing_attention
  ON academic_standing_reviews(standing, computed_at DESC)
  WHERE standing != 'in_good_standing';

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 9 · GRADUATION — eligibility, and the list for a ceremony         │
-- └──────────────────────────────────────────────────────────────────┘
--
-- Two tables because they answer to two authorities. Eligibility is an
-- academic judgement about one learner against one level and is true
-- whether or not a ceremony is ever held; a graduation list is an
-- operational roll for one occasion, with names to be read aloud and
-- seats for guests. Merging them would make a learner's academic
-- standing depend on whether they could travel.
--
-- No ceremony is seeded. None has been scheduled, and a row here would
-- be a date the College had not committed to.
CREATE TABLE graduation_ceremonies (
  id                TEXT PRIMARY KEY,   -- 'gcy_' + uuid
  code              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  -- The cycle it belongs to: '2027-spring'. Held separately from the
  -- date because a ceremony can be moved without becoming a different
  -- ceremony, and everyone who completed since the last one still
  -- belongs to this one.
  cycle             TEXT NOT NULL,
  held_on           TEXT,               -- NULL until a date is committed to
  venue             TEXT,
  mode              TEXT NOT NULL DEFAULT 'undecided'
                    CHECK (mode IN ('in_person','online','hybrid','undecided')),
  status            TEXT NOT NULL DEFAULT 'planned'
                    CHECK (status IN ('planned','open','closed','held','cancelled')),
  -- When the roll closes. A graduand needs to know the date after which
  -- their name cannot be added.
  list_closes_at    TEXT,
  cancelled_at      TEXT,
  cancelled_reason  TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (status != 'held' OR held_on IS NOT NULL),
  CHECK (status != 'cancelled' OR (cancelled_at IS NOT NULL AND cancelled_reason IS NOT NULL))
);

CREATE TABLE graduation_eligibility (
  id                TEXT PRIMARY KEY,   -- 'gel_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  enrolment_id      TEXT REFERENCES enrolments(id),

  state             TEXT NOT NULL
                    CHECK (state IN ('not_eligible','conditional','eligible','conferred')),
  -- WHAT IS MISSING, required wherever anything is. A learner told only
  -- "not eligible" cannot become eligible, and an institution that
  -- cannot say what is outstanding is one nobody can finish at. The same
  -- rule graduate_profiles applies to a rejected portrait.
  outstanding       TEXT,
  -- Set once the award is actually conferred, which is the Graduate
  -- Register's act and not this table's. The FK means eligibility can
  -- never claim a conferral the register does not hold.
  award_id          TEXT REFERENCES awards(id),

  assessed_on       TEXT NOT NULL,
  assessed_by       TEXT REFERENCES users(id),  -- NULL = the platform's own check
  regulation_version TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  UNIQUE (user_id, level_id),
  CHECK (state IN ('eligible','conferred') OR outstanding IS NOT NULL),
  CHECK (state != 'conferred' OR award_id IS NOT NULL)
);
CREATE INDEX idx_graduation_eligibility_state ON graduation_eligibility(state, level_id);

CREATE TABLE graduation_list (
  id                TEXT PRIMARY KEY,   -- 'gls_' + uuid
  ceremony_id       TEXT NOT NULL REFERENCES graduation_ceremonies(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  -- Keyed to the eligibility record, not merely to the learner: a person
  -- may graduate at more than one level over the years, and a roll that
  -- knew only who they were could not say which award was being
  -- conferred on the day.
  eligibility_id    TEXT NOT NULL REFERENCES graduation_eligibility(id),

  attendance        TEXT NOT NULL DEFAULT 'undecided'
                    CHECK (attendance IN ('undecided','in_person','in_absentia','deferred_to_next')),
  guests            INTEGER NOT NULL DEFAULT 0 CHECK (guests >= 0),
  -- How the name is to be read aloud. Distinct from awards.holder_name,
  -- which is what the certificate says: a person may be certificated in
  -- full and announced by the name they use.
  name_as_read      TEXT,
  confirmed_at      TEXT,
  withdrawn_at      TEXT,
  withdrawn_reason  TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  UNIQUE (ceremony_id, eligibility_id),
  CHECK (withdrawn_at IS NULL OR withdrawn_reason IS NOT NULL)
);
CREATE INDEX idx_graduation_list_ceremony ON graduation_list(ceremony_id, attendance);
CREATE INDEX idx_graduation_list_user ON graduation_list(user_id);

-- ┌──────────────────────────────────────────────────────────────────┐
-- │ 10 · SETTINGS AND NOTIFICATION PREFERENCES                        │
-- └──────────────────────────────────────────────────────────────────┘
--
-- Nothing suitable existed. `users` holds a preferred language and
-- nothing else a learner would recognise as a setting, and
-- `notification_log` is an outbound record — it says what was sent, and
-- has never had anything to consult about whether to send it.
--
-- One row per person, keyed on user_id with no separate id, following
-- graduate_profiles exactly: a table that can only ever hold one row per
-- learner should say so in its primary key rather than needing a unique
-- index to promise it.
CREATE TABLE student_settings (
  user_id           TEXT PRIMARY KEY REFERENCES users(id),

  -- IANA zone. The single most useful setting the platform does not
  -- have: every live session, tutorial slot and deadline in this
  -- migration is stored in UTC and read by learners across the Gulf,
  -- West Africa and the UK, and "10:00" means three different hours to
  -- them.
  time_zone         TEXT,

  -- Where to write, when it is not the account address. An account is
  -- created against whatever address the applicant used; a learner whose
  -- employer sponsors them may want College mail elsewhere.
  contact_email     TEXT,
  contact_phone     TEXT,

  digest            TEXT NOT NULL DEFAULT 'immediate'
                    CHECK (digest IN ('immediate','daily','weekly','off')),
  -- Both ends or neither. A quiet period with one end is a rule nothing
  -- can apply, and the application would have to invent the other half.
  quiet_hours_start TEXT,
  quiet_hours_end   TEXT,

  -- The learner's own intention, used to set the pace their engagement
  -- is described against. Formative, never a commitment they can be held
  -- to — the same footing measured study time sits on under decision C8.
  study_days_per_week INTEGER CHECK (study_days_per_week IS NULL
                        OR (study_days_per_week BETWEEN 1 AND 7)),
  -- Default 0, opt IN. A sponsor paying the fee has bought tuition, not
  -- sight of a person's marks, and the graduate profile's visibility
  -- flags establish that a learner publishes their record deliberately
  -- or not at all.
  share_progress_with_sponsor INTEGER NOT NULL DEFAULT 0
                        CHECK (share_progress_with_sponsor IN (0,1)),

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK ((quiet_hours_start IS NULL) = (quiet_hours_end IS NULL))
);

-- One decision per person per event type per channel.
--
-- THE ABSENCE OF A ROW IS THE DEFAULT, not a refusal. A learner who has
-- never opened the settings page has no rows here, and the platform
-- sends what the event catalog says to send. Materialising a row per
-- learner per event per channel at signup would create thousands of
-- rows recording that nobody has expressed a preference.
--
-- `event_type` carries no CHECK constraint, deliberately, and for the
-- reason learner_recordings.upload_status carries none: the catalog is
-- in functions/_lib/notifications/events.js, adding a template is an
-- ordinary code change, and a constraint here would turn every new
-- notification into a schema migration — with the certain outcome that
-- the constraint and the catalog drift and the drift is invisible.
--
-- `channel` is restricted to what notification_log can actually record.
-- A preference for a channel the platform cannot send on is a switch
-- that does nothing, which is worse than no switch.
--
-- NOT EVERY EVENT IS SUPPRESSIBLE. A payment receipt and a decision on
-- an appeal are things the College owes a person, not marketing it may
-- withhold at their request. Which events those are belongs to the
-- catalog, and the sending path — not this table — must refuse to honour
-- a preference against one.
CREATE TABLE notification_preferences (
  id                TEXT PRIMARY KEY,   -- 'nprf_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  event_type        TEXT NOT NULL,
  channel           TEXT NOT NULL CHECK (channel IN ('email','sms')),
  allowed           INTEGER NOT NULL CHECK (allowed IN (0,1)),
  -- When the learner decided. A preference with no date cannot be shown
  -- to have predated the message somebody complains about.
  decided_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (user_id, event_type, channel)
);
-- Created LAST — this is the probe target migration 020 declares, so a
-- partially applied run is never recorded as complete. See the ordering
-- note in scripts/migrate.mjs.
CREATE INDEX idx_notification_preferences_user
  ON notification_preferences(user_id, event_type);
