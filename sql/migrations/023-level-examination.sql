-- 023 · The one table whose absence made the whole academic ledger inert
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_examination_events_examination'
--
-- The probe reads sqlite_master rather than any object this file
-- creates, for the reason 020 states at length: a probe that selects
-- from its own new table throws on every database the probe exists to
-- ask about. The index above is the LAST object this file creates, so
-- an interrupted run leaves the probe unsatisfied and the runner
-- retries — see scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS MIGRATION EXISTS
-- ============================================================
--
-- data/academic-regulations.json adopts the arithmetic of the award in
-- full, and functions/_lib/academic/marks.js implements every line of
-- it. Both have been correct and both have been unreachable, because
-- the quantity they are written around — the level examination — had no
-- table anywhere in the schema.
--
-- The consequence was not a missing feature. It was an institution
-- whose every academic answer was null, and docs/platform-capabilities.md
-- reported the chain in one row:
--
--   `levelMark()` is always `examination_not_recorded`; no honour can be
--   computed; no GPA can grow; graduation reaches `conditional` and
--   never `eligible`.
--
-- Read it forwards: nobody could pass a level. Not because a learner
-- fell short — because the College had nowhere to write down that they
-- sat the paper. Six of the eight conditions of the award reported
-- "recorded nowhere", a transcript could carry no grade point average,
-- and `graduation_eligibility` could reach `conditional` and stop
-- there, permanently, for every learner the College will ever have.
--
-- Everything below is already published. Not one figure, band, window,
-- clock or reason in this file was decided here:
--
--   /students/examinations/     entry, identity, conduct, interruption,
--                               lateness, mitigation, release, resits
--   /academics/tutor-handbook/  the second-marking tolerance, the two
--                               absolute cases, the third reader
--   data/academic-regulations.json § level_mark    the six gates
--
-- The schema's job here is to be able to hold what the College already
-- says it does. Where the published rule is a number, the number is in
-- a CHECK or a comment naming its source; where the published rule is a
-- judgement, the schema records who made it and when.
--
-- ============================================================
-- THE FOUR DECISIONS THIS SCHEMA MAKES, AND WHY
-- ============================================================
--
-- 1 · A PAPER IS VERSIONED, AND A SITTING POINTS AT A VERSION.
--
-- "Marked against a rubric published before the work" is the College's
-- central claim about every award it confers — it is on /faq/, on
-- /admissions/, on /academics/ai-policy/, in the tuition itemisation
-- and in the tutor handbook. A schema where the rubric a script was
-- marked against can be edited afterwards makes that claim
-- unverifiable, and an unverifiable claim about marking is the one kind
-- of claim this College may not carry.
--
-- So `examination_papers` carries a version and a `rubric_published_on`
-- date, criteria hang off the paper rather than off the level, and a
-- sitting stores `paper_id`. Re-cutting a rubric produces a NEW version
-- with a new publication date; the sittings already marked keep
-- pointing at the one they were marked against, and can be re-read
-- against it years later.
--
-- 2 · CRITERIA ARE MARKED AS PERCENTAGES AND CARRY A WEIGHT.
--
-- `level.gate.examination_criterion_floor` is published as fifty PER
-- CENT on each rubric criterion. Marking out of raw points would put a
-- conversion between the stored mark and the published floor, and a
-- conversion is a place for the floor to be applied to the wrong
-- quantity. A criterion is marked 0–100 and carries a weight; the
-- weights of a paper sum to 1.
--
-- 3 · A CRITERION MAY NAME A SKILL, AND THAT IS WHAT MAKES THE FOUR
--     SKILL SUB-MARKS EXIST AT ALL.
--
-- `level.gate.examination_skill_floor` is a floor on "each of the four
-- skill sub-marks within the examination". That quantity does not
-- follow from an overall mark; something has to say which criterion
-- measures which skill. `examination_criteria.skill_id` says so, and
-- the sub-mark is the weighted mean of the criteria carrying that
-- skill. A criterion may carry none — an integrated criterion measures
-- more than one thing and pretending otherwise would file its mark
-- under a skill it only half measures.
--
-- 4 · EVERY MARK IS A MARKER'S MARK. NOTHING IS OVERWRITTEN.
--
-- The handbook: "Both original marks stay on the record, so the
-- committee reads how the standard moved." `examination_marks` is
-- therefore keyed by (sitting, criterion, ROLE) and a second marker
-- writing 62 where the first wrote 71 adds a row. The mark that counts
-- is derived — never stored over the top of the marks that produced it.
--
-- ============================================================
-- WHAT THIS FILE DELIBERATELY DOES NOT DO
-- ============================================================
--
-- · IT SEEDS NO PAPER. Six levels and no published examination paper
--   is the true state of the College today, and a seeded paper would
--   be an academic instrument invented by a migration. A paper is
--   authored and published by a person through
--   functions/api/admin/examination-papers.js, and until one exists
--   every sitting endpoint reports `no_published_paper` by name.
--
-- · IT DOES NOT HOLD THE MODERATION SAMPLE. The handbook publishes a
--   five-part weighted sample and says a batch may be returned for
--   re-marking while one learner's mark may not be moved alone. That is
--   a second register about a cohort, not a column on a sitting, and
--   building half of it here would put a `moderated` flag on a row with
--   nothing behind it. `provisional` and `moderation_closed_at` record
--   what the published release rule needs and no more.
--
-- · IT INVENTS NO CALENDAR. `window_opens_on` and `window_closes_on`
--   are stored, not computed, because the ten-working-day window is
--   published in working days and the College has adopted no academic
--   calendar — docs/academic-calendar.md and /academics/#academic-year
--   both say so. addWorkingDays() in functions/_lib/registrar/cases.js
--   is the one place that counts them, and it counts Monday to Friday
--   with no holiday table, and says so.
-- ============================================================

-- ------------------------------------------------------------
-- The paper — set once, published with a date, never edited after
-- ------------------------------------------------------------
CREATE TABLE examination_papers (
  id                TEXT PRIMARY KEY,   -- 'xpr_' + uuid
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  -- Monotonic per level. A re-cut rubric is version 2, not an edit.
  version           INTEGER NOT NULL CHECK (version >= 1),

  title             TEXT NOT NULL,
  title_ar          TEXT,

  -- III · CONDUCT: "Every paper states its own conditions first … A
  -- condition announced afterwards is a rule invented to explain a
  -- mark." The conditions are the paper's, not the platform's, so they
  -- are text on the paper and not a settings screen.
  conditions        TEXT NOT NULL,
  conditions_ar     TEXT,

  -- Published defaults, overridable per paper because the page states
  -- them as this paper's conditions rather than as a global rule:
  --   open book by default            (III · The default)
  --   three hours from opening        (III · Three hours)
  --   a spoken component of at least fifteen minutes (II · Fifteen minutes)
  open_book         INTEGER NOT NULL DEFAULT 1 CHECK (open_book IN (0,1)),
  duration_minutes  INTEGER NOT NULL DEFAULT 180 CHECK (duration_minutes > 0),
  spoken_minutes    INTEGER NOT NULL DEFAULT 15 CHECK (spoken_minutes >= 0),
  -- I · ENTRY: "A level examination window stays open for ten working
  -- days and you choose your hour inside it."
  window_working_days INTEGER NOT NULL DEFAULT 10 CHECK (window_working_days > 0),

  -- THE DATE THE WHOLE MARKING CLAIM RESTS ON. Not nullable, and the
  -- library refuses a sitting whose window opens before it.
  rubric_published_on TEXT NOT NULL,

  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','retired')),
  authored_by       TEXT REFERENCES users(id),
  published_by      TEXT REFERENCES users(id),
  published_at      TEXT,
  retired_at        TEXT,

  -- Which version of the academic regulations composed this paper's
  -- gates. A paper that cannot say which rules it was cut under cannot
  -- be defended to a candidate who sat it under those rules.
  regulation_version TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- A published paper has been published BY somebody, ON a date. The
  -- constraint is here rather than in the library because a row that
  -- says "published" with no hand behind it is exactly the state the
  -- rubric claim cannot survive.
  CHECK (status <> 'published' OR (published_at IS NOT NULL AND published_by IS NOT NULL)),
  UNIQUE (level_id, version)
);

-- At most one published paper per level, enforced by the database
-- rather than by the code that reads it. Two published papers for one
-- level is two rubrics a candidate could be marked against, and which
-- one they got would depend on a sort order.
CREATE UNIQUE INDEX idx_examination_papers_published
  ON examination_papers(level_id) WHERE status = 'published';

-- ------------------------------------------------------------
-- The rubric — the criteria a script is scored against, one row each
-- ------------------------------------------------------------
CREATE TABLE examination_criteria (
  id                TEXT PRIMARY KEY,   -- 'xcr_' + uuid
  paper_id          TEXT NOT NULL REFERENCES examination_papers(id),
  sequence          INTEGER NOT NULL CHECK (sequence >= 1),
  code              TEXT NOT NULL,

  name              TEXT NOT NULL,
  name_ar           TEXT,
  -- IV · SECOND MARKING: "Each criterion is scored on its own
  -- descriptor, and the score written against the words that earned
  -- it." The descriptor is not optional, because a criterion with no
  -- descriptor is an impression with a number on it.
  descriptor        TEXT NOT NULL,
  descriptor_ar     TEXT,

  -- Weights across a paper sum to 1.0. Not expressible as a CHECK on a
  -- single row; asserted by publishPaper() and by
  -- tests/level-examination.test.mjs.
  weight            REAL NOT NULL CHECK (weight > 0 AND weight <= 1),

  -- WHAT MAKES THE FOUR SKILL SUB-MARKS EXIST. NULL is a real answer
  -- and means an integrated criterion — see decision 3 in the header.
  skill_id          TEXT REFERENCES language_skills(id),

  -- III · The exception: "The spoken components are closed." A criterion
  -- marked from the spoken paper is flagged, so a paper can be shown to
  -- carry one and the spoken gate has something to point at.
  spoken            INTEGER NOT NULL DEFAULT 0 CHECK (spoken IN (0,1)),

  UNIQUE (paper_id, code),
  UNIQUE (paper_id, sequence)
);
CREATE INDEX idx_examination_criteria_paper ON examination_criteria(paper_id, sequence);
CREATE INDEX idx_examination_criteria_skill ON examination_criteria(skill_id)
  WHERE skill_id IS NOT NULL;

-- ------------------------------------------------------------
-- The sitting
-- ------------------------------------------------------------
CREATE TABLE level_examinations (
  id                TEXT PRIMARY KEY,   -- 'lex_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  paper_id          TEXT NOT NULL REFERENCES examination_papers(id),

  -- VIII · RESITS: two resits for every summative assessment, so three
  -- sittings in all. The fourth is refused by the library with the rule
  -- named; the CHECK is the floor under that refusal.
  -- THE ORDINAL, NOT THE COUNT, and the CHECK is deliberately only
  -- that it is a positive whole number.
  --
  -- VIII allows two resits, so three SITTINGS THAT COUNT; IV says an
  -- attempt set aside "is struck from the count of resits". Those are
  -- different quantities, and this column is the first of them: a
  -- total, never-reused number for this learner at this level. A
  -- fourth row after two set-asides is attempt 4 and is still only the
  -- second COUNTING sitting.
  --
  -- The cap therefore cannot live here. A CHECK on the ordinal would
  -- refuse a candidate their second real attempt because their
  -- connection dropped twice, which is the opposite of what the
  -- published rule says. It is enforced against `counts_toward_resits`
  -- in enterCandidate(), which names the rule in its refusal.
  attempt           INTEGER NOT NULL CHECK (attempt >= 1),
  -- IV · INTERRUPTION: an attempt set aside "is struck from the count of
  -- resits". So the ordinal and the count are different quantities and
  -- the schema keeps them apart.
  counts_toward_resits INTEGER NOT NULL DEFAULT 1 CHECK (counts_toward_resits IN (0,1)),

  -- I · ENTRY: the window. Stored rather than computed — see the note on
  -- the calendar in the header.
  window_opens_on   TEXT NOT NULL,
  window_closes_on  TEXT NOT NULL,

  -- II · IDENTITY: "Each attempt is issued a reference you speak before
  -- a recorded task begins. It ties that recording to that attempt on
  -- that date." Unique across the College, because a reference that
  -- repeats ties a recording to two sittings.
  sitting_reference TEXT NOT NULL UNIQUE,

  -- III · CONDUCT: "A level examination runs for three hours from the
  -- moment you open it." due_at is opened_at + the paper's duration,
  -- written at opening so a later edit to a paper cannot move a clock
  -- that has already run.
  opened_at         TEXT,
  due_at            TEXT,
  submitted_at      TEXT,

  status            TEXT NOT NULL DEFAULT 'entered' CHECK (status IN (
                      'entered',        -- window issued, paper not opened
                      'open',           -- clock running
                      'submitted',      -- with the College, not yet marked
                      'marking',        -- a first mark exists
                      'reconciliation', -- two marks diverge; handbook IV
                      'released',       -- the cohort's mark is out
                      'set_aside',      -- IV · interruption or an upheld claim
                      'void'            -- I · the three things that end an attempt
                    )),

  -- IV · INTERRUPTION. 'learner_election' is the twice-a-level a learner
  -- takes on their own word; 'panel' is the third and beyond, which the
  -- mitigating circumstances panel decides. They are separated because
  -- the published allowance counts one of them and not the other.
  set_aside_reason  TEXT CHECK (set_aside_reason IS NULL OR set_aside_reason IN
                      ('learner_election','panel','platform_fault')),
  set_aside_at      TEXT,
  set_aside_by      TEXT REFERENCES users(id),
  set_aside_note    TEXT,

  -- I · ENTRY: "Three things, and only three" end an attempt. The CHECK
  -- is the published list and nothing else may be written into it.
  void_reason       TEXT CHECK (void_reason IS NULL OR void_reason IN
                      ('not_own_work','impersonation','conditions_breach')),
  void_at           TEXT,
  void_by           TEXT REFERENCES users(id),
  void_note         TEXT,

  -- V · DEADLINES, the published four bands. 'on_time' and 'grace' are
  -- marked in full; 'capped' is marked with the mark capped at the pass
  -- threshold; 'incomplete' is read and returned and re-sat.
  lateness          TEXT NOT NULL DEFAULT 'on_time'
                    CHECK (lateness IN ('on_time','grace','capped','incomplete')),
  late_working_days INTEGER CHECK (late_working_days IS NULL OR late_working_days >= 0),
  -- "A cap is lifted in full where an extension was granted or a
  -- mitigating claim is upheld." Lifting one is a decision by a named
  -- person, so it carries a hand and a reason or it did not happen.
  cap_lifted_by     TEXT REFERENCES users(id),
  cap_lifted_reason TEXT CHECK (cap_lifted_reason IS NULL OR cap_lifted_reason IN
                      ('extension_granted','mitigation_upheld')),
  cap_lifted_at     TEXT,

  -- II · IDENTITY and the spoken gate. The recording is the evidence;
  -- the pass is a person's judgement of it, and the two are separate
  -- columns because a recording that exists is not a paper that passed.
  spoken_recording_id TEXT REFERENCES learner_recordings(id),
  spoken_passed     INTEGER CHECK (spoken_passed IS NULL OR spoken_passed IN (0,1)),
  spoken_marked_by  TEXT REFERENCES users(id),
  spoken_marked_at  TEXT,

  -- VII · RESULTS: "Level examination marks go out at one hour rather
  -- than as each marker finishes", and are "provisional until moderation
  -- closes on the batch, within five working days of release".
  --
  -- released_mark is the figure the learner was actually shown. It is
  -- stored even though the marks it came from are all still here,
  -- because a re-mark after release must not silently rewrite what the
  -- College told somebody on the day.
  released_at       TEXT,
  released_mark     REAL CHECK (released_mark IS NULL OR (released_mark >= 0 AND released_mark <= 100)),
  released_by       TEXT REFERENCES users(id),
  provisional       INTEGER NOT NULL DEFAULT 1 CHECK (provisional IN (0,1)),
  moderation_closed_at TEXT,

  regulation_version TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- A lifted cap carries a hand and a date, or it did not happen.
  CHECK ((cap_lifted_at IS NULL) = (cap_lifted_by IS NULL)),
  -- A void or a set-aside carries its reason, and a reason carries its
  -- state. Neither half reaches the record without the other.
  CHECK ((status = 'void') = (void_reason IS NOT NULL)),
  CHECK ((status = 'set_aside') = (set_aside_reason IS NOT NULL)),
  -- A released sitting has a mark, a date and a hand.
  CHECK (status <> 'released' OR (released_at IS NOT NULL AND released_mark IS NOT NULL
                                  AND released_by IS NOT NULL)),
  UNIQUE (user_id, level_id, attempt)
);
CREATE INDEX idx_level_examinations_user ON level_examinations(user_id, level_id, attempt);
CREATE INDEX idx_level_examinations_status ON level_examinations(status, window_closes_on);
CREATE INDEX idx_level_examinations_paper ON level_examinations(paper_id);

-- ------------------------------------------------------------
-- A marker's marks — never overwritten, one row per criterion per role
-- ------------------------------------------------------------
CREATE TABLE examination_marks (
  id                TEXT PRIMARY KEY,   -- 'xmk_' + uuid
  examination_id    TEXT NOT NULL REFERENCES level_examinations(id),
  criterion_id      TEXT NOT NULL REFERENCES examination_criteria(id),

  -- IV · SECOND MARKING: two readers, and a third where a reconciliation
  -- does not settle in two working days, "whose mark stands".
  marker_role       TEXT NOT NULL CHECK (marker_role IN ('first','second','third')),
  marker_id         TEXT NOT NULL REFERENCES users(id),

  mark              REAL NOT NULL CHECK (mark >= 0 AND mark <= 100),
  -- "What the learner did well, the single change that would raise the
  -- mark most, and how to make it." The comment is the teaching; a mark
  -- with no comment is a number.
  comment           TEXT,
  marked_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  UNIQUE (examination_id, criterion_id, marker_role)
);
CREATE INDEX idx_examination_marks_exam ON examination_marks(examination_id, marker_role);
CREATE INDEX idx_examination_marks_marker ON examination_marks(marker_id, marked_at DESC);

-- ------------------------------------------------------------
-- Where two readers disagree — the handbook's own procedure, in a row
-- ------------------------------------------------------------
-- "Where the two marks fall within three percentage points, the first
-- stands. Beyond that the markers reconcile in writing. A disagreement
-- crossing an honours threshold or a skill floor is reconciled whatever
-- its size … A reconciliation that settles within two working days is
-- recorded and released. One that does not goes to a third marker,
-- whose mark stands."
--
-- A row exists only where reconciliation was actually required, so the
-- table is also the register the moderating committee reads: every case
-- a second marker escalated, with what settled it.
CREATE TABLE examination_reconciliations (
  id                TEXT PRIMARY KEY,   -- 'xrc_' + uuid
  examination_id    TEXT NOT NULL REFERENCES level_examinations(id),
  -- NULL means the disagreement is on the OVERALL mark rather than on
  -- one criterion — which is how an honours-threshold crossing arises
  -- even when no single criterion moved more than three points.
  criterion_id      TEXT REFERENCES examination_criteria(id),

  first_mark        REAL NOT NULL,
  second_mark       REAL NOT NULL,
  divergence        REAL NOT NULL CHECK (divergence >= 0),

  -- The three published triggers, and only those three.
  trigger_reason    TEXT NOT NULL CHECK (trigger_reason IN
                      ('tolerance','honour_threshold','skill_floor')),

  opened_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- Two working days from opening. Stored so the clock is the one that
  -- was running, not one recomputed later against a different calendar.
  settle_due_on     TEXT NOT NULL,

  -- "The markers reconcile IN WRITING." A settled reconciliation with
  -- no statement is not a settled reconciliation, and the CHECK says so.
  settled_at        TEXT,
  settled_mark      REAL CHECK (settled_mark IS NULL OR (settled_mark >= 0 AND settled_mark <= 100)),
  settled_by        TEXT REFERENCES users(id),
  statement         TEXT,
  -- 'agreed' is the two markers settling it; 'third_marker' is the
  -- escalation, and then the third marker's mark is the settled mark.
  settled_how       TEXT CHECK (settled_how IS NULL OR settled_how IN ('agreed','third_marker')),
  third_marker_id   TEXT REFERENCES users(id),

  CHECK ((settled_at IS NULL) = (settled_mark IS NULL)),
  CHECK (settled_at IS NULL OR (statement IS NOT NULL AND settled_by IS NOT NULL
                                AND settled_how IS NOT NULL)),
  CHECK (settled_how <> 'third_marker' OR third_marker_id IS NOT NULL),
  UNIQUE (examination_id, criterion_id, trigger_reason)
);
CREATE INDEX idx_examination_reconciliations_open
  ON examination_reconciliations(settle_due_on) WHERE settled_at IS NULL;
CREATE INDEX idx_examination_reconciliations_exam
  ON examination_reconciliations(examination_id);

-- ------------------------------------------------------------
-- The trail
-- ------------------------------------------------------------
-- docs/platform-capabilities.md § 10 records the same gap twice, on
-- announcements and on attendance: a state that can be changed with no
-- trace, so only the current hand survives. Both are named there as
-- wanting an events table mirroring `enrolment_events`. This one is
-- written at the same time as the table it belongs to rather than
-- being asked for afterwards, because an examination record is the most
-- consequential thing this College writes about a person and "who moved
-- this, and when" is not a question it may be unable to answer.
--
-- `actor_id` is nullable and a null means the platform did it — a
-- window that closed, a clock that ran out. The same honesty
-- enrolment_events carries.
CREATE TABLE examination_events (
  id                TEXT PRIMARY KEY,   -- 'xev_' + uuid
  examination_id    TEXT NOT NULL REFERENCES level_examinations(id),
  kind              TEXT NOT NULL CHECK (kind IN (
                      'entered','opened','submitted','marked','second_marked',
                      'reconciliation_opened','reconciliation_settled','third_marked',
                      'spoken_marked','released','moderation_closed',
                      'set_aside','voided','cap_lifted'
                    )),
  actor_id          TEXT REFERENCES users(id),
  note              TEXT,
  at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
-- Created LAST — this is the probe target this migration declares, so a
-- partially applied run is never recorded as complete. See the ordering
-- note in scripts/migrate.mjs.
CREATE INDEX idx_examination_events_examination
  ON examination_events(examination_id, at);
