-- WEC-LC platform schema — Cloudflare D1 (SQLite dialect).
-- Not yet applied to any real database. Run via:
--   wrangler d1 execute wec-lc --file=sql/schema.sql
-- once a real D1 database is provisioned (Decision #1, hosting).
--
-- Design goal: every payment feature named in the payments architecture
-- brief (instalments, scholarships, promo codes, corporate invoicing,
-- refunds, reconciliation) has a table it can be built against without
-- a schema migration later — even where the API endpoint for it isn't
-- implemented yet. See docs/payments-architecture.md for which tables
-- have working endpoints today vs. are schema-ready extension points.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Migration ledger — which files in sql/migrations/ this database has.
--
-- A database built from THIS file already contains every migration's end
-- state, so it needs none of them applied. scripts/migrate.mjs works
-- that out on its own: each migration declares a probe, the probes all
-- match here, and every file is recorded as `baseline` without being
-- run. Nothing has to be hand-entered, and a database that predates the
-- ledger is adopted the same way.
--
-- `method` distinguishes the two honestly: `applied` means this runner
-- executed the file; `baseline` means the effect was already present
-- and the file was recorded, not run. Collapsing them would lose the
-- one fact anybody investigating a schema drift needs.
-- ---------------------------------------------------------------------
CREATE TABLE schema_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL,
  method     TEXT NOT NULL CHECK (method IN ('applied','baseline'))
);

-- ---------------------------------------------------------------------
-- Identity — mirrors the auth provider (Clerk today), never the source
-- of truth for credentials. See docs/auth-architecture.md.
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                TEXT PRIMARY KEY,            -- our id, e.g. 'usr_' + uuid
  auth_provider     TEXT NOT NULL DEFAULT 'clerk',
  auth_provider_id  TEXT NOT NULL,               -- Clerk user id (sub claim)
  email             TEXT NOT NULL,
  email_verified    INTEGER NOT NULL DEFAULT 0,  -- 0/1
  role              TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','staff','admin')),
  preferred_name    TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','ar')),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(auth_provider, auth_provider_id)
);
CREATE INDEX idx_users_email ON users(email);

-- Appointments: who holds staff or administrator access (migration 003).
-- Separate from enrolment_events on purpose — an enrolment change says
-- what one learner may study; an appointment says what one person may
-- do to everybody else's records. Different questions, different
-- readers, and conflating them buries the few entries that matter.
--
-- `authority` is not `reason`, and both are required:
--   reason    — why this person
--   authority — under whose decision
-- Nothing here validates that the authority is real; it records what
-- was claimed, attributed to whoever claimed it.
--
-- actor_id is NOT NULL, unlike enrolment_events. A payment can create
-- an enrolment with no human involved; nothing should appoint an
-- administrator with no human involved. A future automated path would
-- have to change this constraint deliberately rather than slip through
-- a nullable column.
CREATE TABLE role_events (
  id                TEXT PRIMARY KEY,            -- 'rev_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  from_role         TEXT NOT NULL,
  to_role           TEXT NOT NULL,
  actor_id          TEXT NOT NULL REFERENCES users(id),
  reason            TEXT NOT NULL,
  authority         TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_role_events_user ON role_events(user_id, created_at);
CREATE INDEX idx_role_events_actor ON role_events(actor_id, created_at);

-- ---------------------------------------------------------------------
-- Programme structure — mirrors the confirmed IEFC facts already
-- published on the public site (academics-iefc.html). Seeded once,
-- not user-editable via the API.
-- ---------------------------------------------------------------------
CREATE TABLE programme_levels (
  id            INTEGER PRIMARY KEY,   -- 1..6
  roman         TEXT NOT NULL,         -- 'I'..'VI'
  name          TEXT NOT NULL,         -- 'Foundation Programme', etc.
  cefr          TEXT NOT NULL,         -- 'A1'..'C2'
  duration_months INTEGER NOT NULL DEFAULT 4,
  units         INTEGER NOT NULL DEFAULT 120,
  price_usd_cents INTEGER NOT NULL     -- 316667 = $3,166.67 — confirmed figure
);

-- ---------------------------------------------------------------------
-- Admissions — the applicant record from Step 2 of the public journey
-- (see admissions.html) through to a decision.
-- ---------------------------------------------------------------------
CREATE TABLE applications (
  id                TEXT PRIMARY KEY,   -- 'app_' + uuid
  user_id           TEXT REFERENCES users(id),  -- NULL until account created
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  country           TEXT,                -- ISO 3166-1 alpha-2, drives currency default
  self_assessed_level_id INTEGER REFERENCES programme_levels(id), -- from the public quiz, non-binding
  placement_level_id     INTEGER REFERENCES programme_levels(id), -- confirmed by Step 3 assessment
  status            TEXT NOT NULL DEFAULT 'submitted'
                    CHECK (status IN ('submitted','placement_pending','offer_sent','accepted','enrolled','withdrawn','rejected')),
  source            TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website','manual_bridge','referral')),
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_status ON applications(status);

-- ---------------------------------------------------------------------
-- Enrolments — one row per student per level, created once payment for
-- that level is confirmed. This, not `applications`, is the Student
-- Portal's source of truth for "what am I enrolled in right now."
-- ---------------------------------------------------------------------
CREATE TABLE enrolments (
  id                TEXT PRIMARY KEY,   -- 'enr_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  application_id    TEXT REFERENCES applications(id),
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  status            TEXT NOT NULL DEFAULT 'pending_payment'
                    CHECK (status IN ('pending_payment','active','completed','withdrawn')),
  started_at        TEXT,
  completed_at      TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_enrolments_user ON enrolments(user_id);
-- One LIVE enrolment per learner per level (migration 002). PARTIAL,
-- excluding 'withdrawn', because withdrawing and re-enrolling is a real
-- thing an institution does — history is kept, two *live* enrolments in
-- one level are not. Without this, student/progression.js can mark one
-- duplicate completed while another stays active, leaving a learner
-- simultaneously finished and in progress.
CREATE UNIQUE INDEX idx_enrolments_one_live_per_level
  ON enrolments(user_id, level_id)
  WHERE status != 'withdrawn';

-- Why an enrolment exists. A row in `enrolments` says a learner has
-- access; it does not say who granted it or why. Once staff can enrol
-- somebody without a payment, a scholarship, a bank transfer, a staff
-- test account and a mistake all look identical without this.
-- actor_id NULL means the system did it (a payment webhook) — honest,
-- because no person made that decision.
CREATE TABLE enrolment_events (
  id                TEXT PRIMARY KEY,           -- 'eev_' + uuid
  enrolment_id      TEXT NOT NULL REFERENCES enrolments(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  from_status       TEXT,                       -- NULL when first created
  to_status         TEXT NOT NULL,
  actor_id          TEXT REFERENCES users(id),  -- staff member, or NULL for system
  reason            TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_enrolment_events_user ON enrolment_events(user_id, created_at);
CREATE INDEX idx_enrolment_events_enrolment ON enrolment_events(enrolment_id);

-- ---------------------------------------------------------------------
-- Currency — config-driven, not hardcoded into application logic.
-- `fx_rate_to_usd` is NULL until a real rate source is connected;
-- a currency with a NULL rate is never offered at checkout (see
-- functions/_lib/currency.js). No rate here is fabricated.
-- ---------------------------------------------------------------------
CREATE TABLE currencies (
  code              TEXT PRIMARY KEY,   -- ISO 4217: USD, GBP, NGN, SAR, AED, QAR, KWD...
  symbol            TEXT NOT NULL,
  decimal_places    INTEGER NOT NULL DEFAULT 2,
  is_active         INTEGER NOT NULL DEFAULT 0,  -- 0 until a real rate/policy exists
  fx_rate_to_usd    REAL,                        -- NULL = not yet configured
  fx_rate_source    TEXT,                        -- e.g. 'policy_fixed' | 'openexchangerates' | NULL
  fx_rate_as_of     TEXT
);

-- Country → preferred currency/gateway hints (routing only, never
-- forces a choice — see functions/_lib/payments/router.js).
CREATE TABLE country_payment_routing (
  country_code      TEXT PRIMARY KEY,   -- ISO 3166-1 alpha-2
  default_currency  TEXT REFERENCES currencies(code),
  preferred_gateways TEXT NOT NULL      -- JSON array, ordered, e.g. '["paystack","flutterwave","stripe"]'
);

-- ---------------------------------------------------------------------
-- Platform configuration — a generic key/value store for business
-- policy that Executive Decision #5 requires to stay "configurable
-- wherever practical," rather than hardcoded into application logic
-- (full-programme pricing, discount stacking, instalment defaults,
-- and future policy keys as they're needed). Values are JSON-encoded
-- text, read via functions/_lib/config.js. A policy that needs real
-- relational structure gets its own table instead (promo_codes,
-- scholarships, instalment_plans above) — this table is for scalar
-- and small-object policy values only.
-- ---------------------------------------------------------------------
CREATE TABLE platform_config (
  key               TEXT PRIMARY KEY,
  value             TEXT NOT NULL,      -- JSON-encoded
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_by        TEXT REFERENCES users(id)  -- NULL for seed-inserted defaults
);

-- ---------------------------------------------------------------------
-- Discounts & promo codes — schema-ready; endpoint not yet implemented
-- (see docs/payments-architecture.md § Not Yet Implemented).
-- ---------------------------------------------------------------------
CREATE TABLE promo_codes (
  code              TEXT PRIMARY KEY,
  kind              TEXT NOT NULL CHECK (kind IN ('percent','fixed_amount')),
  value              REAL NOT NULL,      -- 15 (=15%) or 5000 (=$50.00 in cents context)
  currency          TEXT REFERENCES currencies(code), -- NULL if percent-based
  max_redemptions   INTEGER,
  redeemed_count    INTEGER NOT NULL DEFAULT 0,
  valid_from        TEXT,
  valid_until       TEXT,
  active            INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE scholarships (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id),
  kind              TEXT NOT NULL CHECK (kind IN ('percent','fixed_amount','full')),
  value             REAL,
  approved_by       TEXT,               -- staff user id — ties into the 3-signature pattern
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------
-- Corporate accounts — schema-ready; endpoint not yet implemented.
-- ---------------------------------------------------------------------
CREATE TABLE corporate_accounts (
  id                TEXT PRIMARY KEY,
  organisation_name TEXT NOT NULL,
  billing_email     TEXT NOT NULL,
  billing_currency  TEXT REFERENCES currencies(code),
  po_number_required INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE corporate_seats (
  id                TEXT PRIMARY KEY,
  corporate_account_id TEXT NOT NULL REFERENCES corporate_accounts(id),
  user_id           TEXT REFERENCES users(id),  -- NULL until the seat is claimed
  status            TEXT NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed','claimed','revoked'))
);

-- ---------------------------------------------------------------------
-- Payments — provider-agnostic core row. `provider`/`provider_ref` are
-- the only gateway-specific fields; everything else is uniform
-- regardless of which of the 4 gateways handled it. See
-- functions/_lib/payments/provider-interface.js.
-- ---------------------------------------------------------------------
CREATE TABLE instalment_plans (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id),
  level_id          INTEGER REFERENCES programme_levels(id), -- NULL if plan spans the full programme
  total_amount_usd_cents INTEGER NOT NULL,
  instalment_count  INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','defaulted','cancelled'))
);

CREATE TABLE payments (
  id                TEXT PRIMARY KEY,   -- 'pay_' + uuid — OUR id, referenced everywhere internally
  user_id           TEXT NOT NULL REFERENCES users(id),
  enrolment_id      TEXT REFERENCES enrolments(id),
  corporate_account_id TEXT REFERENCES corporate_accounts(id), -- set for corporate-invoiced payments
  kind              TEXT NOT NULL CHECK (kind IN ('full_programme','single_level','instalment')),
  level_id          INTEGER REFERENCES programme_levels(id), -- NULL for full-programme payments
  instalment_plan_id TEXT REFERENCES instalment_plans(id),
  amount_cents      INTEGER NOT NULL,   -- in `currency`'s minor unit
  currency          TEXT NOT NULL REFERENCES currencies(code),
  amount_usd_cents  INTEGER NOT NULL,   -- normalised, for reporting/reconciliation across currencies
  promo_code        TEXT REFERENCES promo_codes(code),
  scholarship_id    TEXT REFERENCES scholarships(id),
  provider          TEXT NOT NULL CHECK (provider IN ('stripe','paystack','flutterwave','opay')),
  provider_ref      TEXT,               -- the gateway's own charge/session id
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','succeeded','failed','refunded','partially_refunded')),
  failure_reason    TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  confirmed_at      TEXT
);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_provider_ref ON payments(provider, provider_ref);
CREATE INDEX idx_payments_status ON payments(status);

-- Every gateway webhook we receive, verified or not, for audit and
-- replay-safety (idempotency keyed on provider+event_id).
CREATE TABLE payment_webhook_events (
  id                TEXT PRIMARY KEY,
  provider          TEXT NOT NULL,
  event_id          TEXT NOT NULL,      -- the gateway's own event/idempotency id
  event_type        TEXT NOT NULL,
  payload_json       TEXT NOT NULL,
  signature_verified INTEGER NOT NULL DEFAULT 0,
  payment_id        TEXT,               -- our payment id, from the verified event's own
                    -- reference — set at log time so reconciliation reports can
                    -- LEFT JOIN payments directly instead of re-parsing payload_json
                    -- per gateway. NULL for unverified events or events that don't
                    -- carry a reference (parseWebhookEvent never ran for either).
                    -- Deliberately NOT a REFERENCES payments(id) FK: with
                    -- PRAGMA foreign_keys=ON (see top of this file), a hard
                    -- FK would make logging a webhook that names an
                    -- unknown/deleted payment id throw instead of insert —
                    -- exactly the case this column exists to let a
                    -- reconciliation report surface (see
                    -- functions/_lib/reports/reconciliation.js).
  processed_at      TEXT,               -- set once the event is signature-verified
                    -- and logged — NOT the same as "fully handled," see handled_at.
  handled_at        TEXT,               -- set only once applyPaymentUpdate() (and
                    -- any receipt/notification it triggers) completes without
                    -- throwing. A retried delivery of the same (provider, event_id)
                    -- short-circuits to "already processed" only when this is
                    -- set — if a prior attempt logged the event but then failed
                    -- partway through side effects, handled_at stays NULL and a
                    -- gateway retry correctly re-attempts them (safe to retry:
                    -- applyPaymentUpdate's own guards make every step idempotent).
                    -- See functions/_lib/payments/webhook-handler.js.
  received_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(provider, event_id)
);
CREATE INDEX idx_webhook_events_payment ON payment_webhook_events(payment_id);

-- ---------------------------------------------------------------------
-- Receipts, refunds, reconciliation — schema-ready. Receipt generation
-- has a working endpoint (see docs/payments-architecture.md); refund
-- workflow and reconciliation reporting are extension points pending
-- institutional refund policy.
-- ---------------------------------------------------------------------
CREATE TABLE receipts (
  id                TEXT PRIMARY KEY,
  payment_id        TEXT NOT NULL REFERENCES payments(id),
  receipt_number    TEXT NOT NULL UNIQUE, -- sequential, human-facing
  issued_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  pdf_url           TEXT,                 -- set once a PDF-generation step exists
  UNIQUE(payment_id)                      -- at most one receipt per payment — closes a
                    -- real race window where two concurrent webhook deliveries for the
                    -- same payment could otherwise both issue one (see webhook-handler.js).
);

-- A tiny atomic counter table — used for receipt numbering via
-- `UPDATE counters SET value = value + 1 WHERE name = ? RETURNING value`,
-- which SQLite (and D1) execute as a single atomic statement. This
-- replaces a `SELECT count(*) FROM receipts` approach, which is a real
-- race under concurrent webhook deliveries (two requests can read the
-- same count before either INSERT commits). See
-- functions/_lib/payments/webhook-handler.js.
CREATE TABLE counters (
  name              TEXT PRIMARY KEY,
  value             INTEGER NOT NULL DEFAULT 0
);
INSERT INTO counters (name, value) VALUES ('receipt_number', 0);

CREATE TABLE refunds (
  id                TEXT PRIMARY KEY,
  payment_id        TEXT NOT NULL REFERENCES payments(id),
  amount_cents      INTEGER NOT NULL,
  reason            TEXT NOT NULL,
  approved_by       TEXT,               -- staff user id — refunds need a named approver, not self-service
  status            TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','processed','rejected')),
  provider_refund_ref TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------
-- Notifications — outbound log, provider-agnostic (see
-- functions/_lib/notifications/provider-interface.js).
-- ---------------------------------------------------------------------
CREATE TABLE notification_log (
  id                TEXT PRIMARY KEY,
  user_id           TEXT REFERENCES users(id),
  event_type        TEXT NOT NULL,      -- 'application_received' | 'payment_confirmed' | ...
  channel           TEXT NOT NULL CHECK (channel IN ('email','sms')),
  provider          TEXT NOT NULL,
  provider_ref      TEXT,
  status            TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed')),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ---------------------------------------------------------------------
-- Learning Management System (LMS) — Milestone 1, per the Executive
-- Directive that WEC-LC builds and owns its LMS as a proprietary asset
-- rather than integrating a third-party product (see
-- docs/lms-architecture.md). Content hierarchy is
-- Course → Unit → LearningItem, matching the "one course per level,
-- ordered units, polymorphic content items" shape recommended for a
-- sequential CEFR-levelled programme like the IEFC.
--
-- This file itself stays content-free: `courses` is seeded here
-- (structural — one row per already-published programme level, titled
-- with that level's real, already-public name), but `units`,
-- `learning_items`, and `quiz_questions` are NOT seeded in this file.
-- Real curriculum content — authored per the Executive Directive
-- "Curriculum First" — lives in its own, separate seed file(s)
-- (sql/seed-curriculum-level-1.sql today; more as each level is
-- authored — see docs/curriculum-framework.md), applied after this
-- file, never baked into the schema itself. That separation is
-- deliberate: schema.sql is mechanism-only DDL, and curriculum content
-- will keep growing over many future authoring milestones — it does
-- not belong versioned alongside table definitions.
-- ---------------------------------------------------------------------
CREATE TABLE courses (
  id                TEXT PRIMARY KEY,   -- 'crs_' + uuid
  level_id          INTEGER NOT NULL UNIQUE REFERENCES programme_levels(id), -- one course per level for Milestone 1
  title             TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE units (
  id                TEXT PRIMARY KEY,   -- 'unt_' + uuid
  course_id         TEXT NOT NULL REFERENCES courses(id),
  sequence          INTEGER NOT NULL,   -- display/completion order within the course
  title             TEXT NOT NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_units_course ON units(course_id);

-- ---------------------------------------------------------------------
-- Audio layer — listening, pronunciation, learner voice, instructor
-- voice feedback.
--
-- Built because the curriculum demanded it, not speculatively: all 114
-- authored lesson items specify a LISTENING ACTIVITY and a
-- PRONUNCIATION PRACTICE, and before this layer existed the platform
-- had nowhere to put either (see docs/curriculum-programme-review.md,
-- Finding 1 — 0 rows of kind 'video', 2 of 660 quiz questions
-- referencing listening).
--
-- THE LOAD-BEARING DESIGN DECISION: `transcript` is NOT NULL while
-- `media_url` and the cue timings are NULLABLE. A listening script is
-- authored curriculum and exists now; the recording of it is a studio
-- production task with real voice talent and does not. Making the
-- script mandatory and the audio optional means the platform tells the
-- truth about its own state, degrades gracefully (a transcript-only
-- listening lesson is still a usable lesson), and never requires a
-- placeholder audio file to stand in for one that has not been made.
-- ---------------------------------------------------------------------

CREATE TABLE audio_assets (
  id                TEXT PRIMARY KEY,   -- 'aud_' + uuid
  kind              TEXT NOT NULL CHECK (kind IN ('listening','model_pronunciation','instructor_feedback','learner_recording')),
  title             TEXT NOT NULL,
  -- The authored script. Always present: it IS the curriculum content.
  transcript        TEXT NOT NULL,
  -- NULL until the recording is produced. Never a placeholder path.
  media_url         TEXT,
  duration_ms       INTEGER,
  -- Declared, not incidental: this programme teaches BrE/AmE
  -- differences explicitly, so a listening asset must state which
  -- variety a learner is hearing.
  variety           TEXT CHECK (variety IN ('BrE','AmE','other','mixed')),
  speaker_count     INTEGER NOT NULL DEFAULT 1,
  -- Words per minute the script is intended to be delivered at. Carries
  -- the level's listening difficulty explicitly instead of leaving it to
  -- whoever books the studio.
  target_wpm        INTEGER,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- One row per transcript segment: the unit of synchronisation, of
-- speaker attribution, and of "replay just this line". start_ms/end_ms
-- are NULL until the asset is recorded and timed; the segmentation
-- itself is authored up front and is useful without timings.
CREATE TABLE audio_cues (
  id                TEXT PRIMARY KEY,   -- 'cue_' + uuid
  audio_asset_id    TEXT NOT NULL REFERENCES audio_assets(id),
  sequence          INTEGER NOT NULL,
  speaker           TEXT,               -- 'Narrator', 'Amara', 'Interviewer'
  text              TEXT NOT NULL,
  start_ms          INTEGER,
  end_ms            INTEGER,
  UNIQUE(audio_asset_id, sequence)
);
CREATE INDEX idx_audio_cues_asset ON audio_cues(audio_asset_id);

-- What a pronunciation item actually drills. Structured rather than
-- prose so that progress can be reported per FOCUS ("your word stress
-- is behind your individual sounds") instead of per module, and so a
-- future speech-recognition scorer has a target to score against.
CREATE TABLE pronunciation_targets (
  id                TEXT PRIMARY KEY,   -- 'pron_' + uuid
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  sequence          INTEGER NOT NULL,
  focus             TEXT NOT NULL CHECK (focus IN ('phoneme','word_stress','sentence_stress','intonation','connected_speech','rhythm')),
  target            TEXT NOT NULL,      -- '/θ/ vs /s/'; 'PHOtograph -> phoTOGrapher'
  example           TEXT NOT NULL,      -- a sentence the learner says
  guidance          TEXT                -- what to do with the mouth/voice
);
CREATE INDEX idx_pronunciation_targets_item ON pronunciation_targets(learning_item_id);

-- `media_url` is where to PLAY this take from. For an R2-backed
-- recording that is the authorised streaming endpoint
-- (/api/lms/recording/audio?id=...), never a public URL — learner voice
-- is not publicly addressable. Rows predating object storage hold a
-- browser blob URL and have object_key IS NULL.
--
-- upload_status carries no CHECK constraint on purpose. These columns
-- reach existing databases through sql/migrations/001-recording-storage.sql,
-- and a constraint present on fresh databases but absent on migrated
-- ones is worse than none — it makes the schema the tests load differ
-- from the schema production runs. The allowed values
-- (pending|stored|failed|purged) are enforced in
-- functions/_lib/lms/recording-storage.js and asserted in
-- tests/recording-storage.test.mjs.
CREATE TABLE learner_recordings (
  id                TEXT PRIMARY KEY,   -- 'rec_' + uuid
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  media_url         TEXT NOT NULL,
  duration_ms       INTEGER,
  attempt           INTEGER NOT NULL DEFAULT 1,  -- learners re-record; keep the history
  status            TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed')),
  submitted_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- Object storage (migration 001)
  object_key        TEXT,               -- R2 key; NULL for pre-storage rows
  content_type      TEXT,
  bytes             INTEGER,
  sha256            TEXT,               -- integrity + de-duplication evidence
  upload_status     TEXT NOT NULL DEFAULT 'stored',
  upload_id         TEXT,               -- R2 multipart id while in flight
  retention_until   TEXT,               -- NULL = no retention policy set; never purged
  purged_at         TEXT                -- set when audio was deleted, row kept
);
CREATE INDEX idx_learner_recordings_user ON learner_recordings(user_id);
CREATE INDEX idx_learner_recordings_item ON learner_recordings(learning_item_id);
CREATE INDEX idx_learner_recordings_upload_status ON learner_recordings(upload_status);
CREATE INDEX idx_learner_recordings_retention ON learner_recordings(retention_until)
  WHERE retention_until IS NOT NULL AND purged_at IS NULL;

-- What makes an upload resumable rather than merely restartable. R2
-- returns a part's etag per request; those etags are required to
-- complete the upload and would otherwise die with the Worker
-- invocation. Recording them means a learner whose connection drops
-- resumes from the parts already held instead of re-sending the lot.
CREATE TABLE recording_upload_parts (
  recording_id      TEXT NOT NULL REFERENCES learner_recordings(id),
  part_number       INTEGER NOT NULL,
  etag              TEXT NOT NULL,
  bytes             INTEGER NOT NULL,
  uploaded_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (recording_id, part_number)
);

-- Feedback on a learner recording. `source` is what makes this layer
-- AI-ready without any AI being built: an automated pronunciation
-- scorer writes rows here with source='automated' and reviewer_id NULL,
-- alongside — never instead of — instructor rows, so the two can be
-- compared rather than silently substituted. The five sub-scores are
-- the assessment criteria the pronunciation strand is taught against.
CREATE TABLE pronunciation_feedback (
  id                TEXT PRIMARY KEY,   -- 'pfb_' + uuid
  recording_id      TEXT NOT NULL REFERENCES learner_recordings(id),
  source            TEXT NOT NULL CHECK (source IN ('instructor','automated')),
  reviewer_id       TEXT REFERENCES users(id),   -- NULL when source='automated'
  -- The instructor's own spoken feedback: modelling the correct form is
  -- worth more than describing it in text.
  audio_asset_id    TEXT REFERENCES audio_assets(id),
  comment           TEXT,
  intelligibility   REAL,               -- all 0..1, NULL if not assessed
  word_stress       REAL,
  sentence_stress   REAL,
  individual_sounds REAL,
  fluency           REAL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_pronunciation_feedback_recording ON pronunciation_feedback(recording_id);

-- Polymorphic content item within a unit. `body` is kind-dependent:
-- reading → the reading text itself; video → a video URL (Cloudflare
-- Stream once wired, see docs/lms-architecture.md); assignment →
-- instructions; live_session/quiz → unused (their own tables carry
-- the real data, joined via learning_item_id).
CREATE TABLE learning_items (
  id                TEXT PRIMARY KEY,   -- 'itm_' + uuid
  unit_id           TEXT NOT NULL REFERENCES units(id),
  sequence          INTEGER NOT NULL,
  kind              TEXT NOT NULL CHECK (kind IN ('reading','video','quiz','assignment','live_session','listening','pronunciation')),
  title             TEXT NOT NULL,
  body              TEXT,
  -- Set for kind='listening' and kind='pronunciation' (the audio the
  -- item is built around), and OPTIONALLY for kind='quiz' — a listening
  -- comprehension quiz is just a quiz whose item carries audio, which
  -- is why submitQuizAttempt() needed no changes to support listening
  -- assessment.
  audio_asset_id    TEXT REFERENCES audio_assets(id),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_learning_items_unit ON learning_items(unit_id);

CREATE TABLE quiz_questions (
  id                TEXT PRIMARY KEY,   -- 'qq_' + uuid
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  sequence          INTEGER NOT NULL,
  prompt            TEXT NOT NULL,
  choices_json      TEXT NOT NULL,      -- JSON array of choice strings
  correct_index     INTEGER NOT NULL,   -- index into choices_json
  -- For listening questions: the exact transcript segment this question
  -- tests. Lets a learner who got it wrong replay precisely the three
  -- seconds they misheard, rather than the whole recording — the single
  -- most useful thing a listening interface can do.
  audio_cue_id      TEXT REFERENCES audio_cues(id)
);
CREATE INDEX idx_quiz_questions_item ON quiz_questions(learning_item_id);

CREATE TABLE quiz_attempts (
  id                TEXT PRIMARY KEY,   -- 'qat_' + uuid
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  answers_json      TEXT NOT NULL,      -- JSON array of selected indices, aligned to question sequence
  score             REAL NOT NULL,      -- fraction correct, 0..1, computed server-side at submission
  submitted_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_item ON quiz_attempts(learning_item_id);

CREATE TABLE assignment_submissions (
  id                TEXT PRIMARY KEY,   -- 'asub_' + uuid
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  content           TEXT,               -- text submission, or a URL once file upload exists
  status            TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','graded','returned')),
  grade             REAL,
  feedback          TEXT,
  submitted_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  graded_at         TEXT,
  graded_by         TEXT REFERENCES users(id)
);
CREATE INDEX idx_assignment_submissions_user ON assignment_submissions(user_id);
CREATE INDEX idx_assignment_submissions_item ON assignment_submissions(learning_item_id);

-- Materialized per-student completion, one row per (user, unit) —
-- avoids recomputing "is this unit done" from quiz/assignment rows on
-- every dashboard load. Written by the same code path that records a
-- quiz attempt or a graded assignment; read by the Student Portal and
-- by progression.completeLevel() (see functions/_lib/student/progression.js).
CREATE TABLE unit_progress (
  id                TEXT PRIMARY KEY,   -- 'uprg_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  unit_id           TEXT NOT NULL REFERENCES units(id),
  status            TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  completed_at      TEXT,
  UNIQUE(user_id, unit_id)
);
CREATE INDEX idx_unit_progress_user ON unit_progress(user_id);

-- ---------------------------------------------------------------------
-- The Graduate Register (migration 005) — the College's permanent
-- academic record. Certificates, transcripts, digital badges and alumni
-- Chapters all derive their worth from being checkable against it.
--
-- TAMPER-EVIDENT: every award carries a SHA-256 digest over its own
-- fields AND the digest of the award before it. Altering a record breaks
-- every link after it. `prev_digest` is UNIQUE, which is what makes the
-- chain a chain rather than a tree — two conferrals racing to extend the
-- same head cannot both succeed. Deliberately NOT a blockchain and never
-- to be described as one; it is a hash chain in one institution's
-- database, which is the only honest meaning of "blockchain-ready".
--
-- REVOCATION IS VISIBLE: a withdrawn award is marked, never deleted.
-- CONSENT-SCOPED: public_consent gates the browsable register, never
-- verification by code — a code is something the graduate handed over.
-- ---------------------------------------------------------------------
CREATE TABLE awards (
  id                TEXT PRIMARY KEY,   -- 'awd_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),

  -- Denormalised on purpose. A certificate conferred in 2027 must still
  -- read as it did in 2027 even if the College later renames an award or
  -- restructures a level. An academic record that changes retrospectively
  -- because a lookup table changed is not a record.
  award_title       TEXT NOT NULL,      -- 'English Associate of Worldwide English College'
  post_nominal      TEXT NOT NULL,      -- 'AsWEC'
  cefr              TEXT NOT NULL,
  honour            TEXT NOT NULL DEFAULT 'pass'
                    CHECK (honour IN ('pass','merit','distinction','high_distinction','college_distinction')),
  credits           INTEGER NOT NULL,
  tqt_hours         INTEGER NOT NULL,
  citation          TEXT,
  holder_name       TEXT NOT NULL,      -- as it appears on the certificate

  conferred_on      TEXT NOT NULL,      -- date, not timestamp: a conferral is a day
  verification_code TEXT NOT NULL UNIQUE,

  status            TEXT NOT NULL DEFAULT 'conferred'
                    CHECK (status IN ('conferred','revoked','replaced')),
  revoked_at        TEXT,
  revoked_reason    TEXT,
  replaced_by_id    TEXT REFERENCES awards(id),

  -- Publication consent, separate from verification. Default 0: a
  -- graduate opts IN to being listed, never out.
  public_consent    INTEGER NOT NULL DEFAULT 0,

  prev_digest       TEXT NOT NULL UNIQUE,
  digest            TEXT NOT NULL UNIQUE,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_awards_user ON awards(user_id);
CREATE INDEX idx_awards_conferred ON awards(conferred_on);
-- One LIVE award per learner per level. PARTIAL, excluding replaced and
-- revoked rows, because a certificate can legitimately be replaced more
-- than once — a name correction, then a later one — and every superseded
-- row must survive. A plain UNIQUE(user_id, level_id, status) was tried
-- first and is wrong twice over: it forbids a second replacement, and it
-- blocks replacement entirely, since the successor is conferred before
-- the predecessor is marked. Found by tests/registry.test.mjs.
CREATE UNIQUE INDEX idx_awards_one_live_per_level
  ON awards(user_id, level_id) WHERE status = 'conferred';

-- Verification audit — WITHOUT identifying the checker.
--
-- The graduate and the College can see that an award was verified, how
-- often and with what result. Nobody can see WHO checked. That is not an
-- omission: the whole value of the portal is that a stranger can verify
-- without an account, and a log of checkers' identities would both
-- destroy that and create a personal-data holding with no purpose the
-- College could defend.
--
-- `code_attempted` is stored even when it matches nothing, because a run
-- of failed lookups is the signature of somebody enumerating the
-- register, and that is worth being able to see.
CREATE TABLE award_verifications (
  id                TEXT PRIMARY KEY,   -- 'ver_' + uuid
  award_id          TEXT REFERENCES awards(id),   -- NULL when the code matched nothing
  code_attempted    TEXT NOT NULL,
  outcome           TEXT NOT NULL CHECK (outcome IN ('valid','revoked','replaced','not_found','malformed')),
  channel           TEXT NOT NULL DEFAULT 'public' CHECK (channel IN ('public','api','qr')),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_award_verifications_time ON award_verifications(created_at);
CREATE INDEX idx_award_verifications_award ON award_verifications(award_id);

-- Time on task — the measurement behind the College's measured-hours
-- commitment (docs/academic-framework.md § I). One row per learner per
-- module, holding a total: the least data that answers "how long does
-- this module take", which is the only question it exists to answer.
--
-- `seconds` is incremented SERVER-SIDE from the server's own clock. The
-- client says only "I am still working". A client-supplied duration
-- would make the College's headline academic metric editable from a
-- browser console — see functions/_lib/lms/time-on-task.js.
CREATE TABLE time_on_task (
  id            TEXT PRIMARY KEY,   -- 'tot_' + uuid
  user_id       TEXT NOT NULL REFERENCES users(id),
  unit_id       TEXT NOT NULL REFERENCES units(id),  -- a MODULE in framework terms
  seconds       INTEGER NOT NULL DEFAULT 0,
  first_seen_at TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  UNIQUE(user_id, unit_id)
);
CREATE INDEX idx_time_on_task_user ON time_on_task(user_id);
CREATE INDEX idx_time_on_task_module ON time_on_task(unit_id);

-- Live classes are scheduled external join-links (Zoom/Meet/Teams),
-- not custom WebRTC — see docs/lms-architecture.md for why that's the
-- right MVP scope. `unit_id` is NULL for a level-wide session (e.g. a
-- weekly conversation class) not tied to one specific unit.
CREATE TABLE live_sessions (
  id                TEXT PRIMARY KEY,   -- 'lsn_' + uuid
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  unit_id           TEXT REFERENCES units(id),
  host_user_id      TEXT REFERENCES users(id),  -- staff member hosting
  title             TEXT NOT NULL,
  starts_at         TEXT NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 60,
  join_url          TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_live_sessions_level ON live_sessions(level_id);

-- ---------------------------------------------------------------------
-- Seed data — the one part of this file safe to run against a real DB
-- immediately, since these are already-confirmed public facts, not
-- placeholders.
-- ---------------------------------------------------------------------
INSERT INTO programme_levels (id, roman, name, cefr, duration_months, units, price_usd_cents) VALUES
  (1, 'I',   'Foundation Programme',        'A1', 4, 120, 316667),
  (2, 'II',  'Elementary Programme',        'A2', 4, 120, 316667),
  (3, 'III', 'Intermediate Programme',      'B1', 4, 120, 316667),
  (4, 'IV',  'Upper Intermediate Programme','B2', 4, 120, 316667),
  (5, 'V',   'Advanced Programme',          'C1', 4, 120, 316667),
  (6, 'VI',  'English Mastery Programme',   'C2', 4, 120, 316667);

-- Currencies: only USD is active today (it's the confirmed tuition
-- currency). Every other currency is present but inactive until
-- Decision #2 (currency policy) and a real rate source are resolved.
INSERT INTO currencies (code, symbol, decimal_places, is_active, fx_rate_to_usd, fx_rate_source) VALUES
  ('USD', '$', 2, 1, 1.0, 'base'),
  ('GBP', '£', 2, 0, NULL, NULL),
  ('NGN', '₦', 2, 0, NULL, NULL),
  ('SAR', '﷼', 2, 0, NULL, NULL),
  ('AED', 'د.إ', 2, 0, NULL, NULL),
  ('QAR', '﷼', 2, 0, NULL, NULL),
  ('KWD', 'د.ك', 3, 0, NULL, NULL);

-- Routing hints only — inactive currencies are skipped by the router
-- regardless of what's listed here (see currency.js).
INSERT INTO country_payment_routing (country_code, default_currency, preferred_gateways) VALUES
  ('NG', 'NGN', '["paystack","flutterwave","opay","stripe"]'),
  ('GB', 'GBP', '["stripe"]'),
  ('SA', 'SAR', '["stripe","flutterwave"]'),
  ('AE', 'AED', '["stripe","flutterwave"]'),
  ('QA', 'QAR', '["stripe"]'),
  ('KW', 'KWD', '["stripe"]');

-- Platform configuration defaults. Every value here is either an
-- already-published public fact (the $19,000 full-programme price) or
-- a deliberately conservative default policy, never a fabricated
-- figure — see docs/executive-decision-brief.md.
INSERT INTO platform_config (key, value) VALUES
  ('full_programme_price_usd_cents', '1900000'),
  -- $19,000 flat, matching the figure already published at
  -- /admissions/tuition/ — not derived from 6 × $3,166.67 (which
  -- rounds to $19,000.02), because $19,000 is the actual advertised
  -- and charged figure.
  ('full_programme_unlock_mode', '"progressive"'),
  -- Executive Decision #1: a full-programme payment enrols the
  -- student in Level I immediately; each subsequent level's enrolment
  -- is created automatically only once the prior level is marked
  -- completed. See functions/_lib/student/progression.js.
  ('discount_stacking_policy', '{"allowPromoAndScholarship":false}'),
  -- Conservative default (no stacking of a promo code and a
  -- scholarship on the same payment) pending a real institutional
  -- policy decision.
  ('instalment_default_count', '4'),
  -- Number of instalments offered by default when an instalment plan
  -- is created, pending a real cadence policy decision.
  ('lms_pass_threshold', '0.7'),
  -- Fraction (0..1) a quiz score or assignment grade must meet to mark
  -- a unit "completed" (functions/_lib/lms/content.js). A mechanism
  -- default, not a published WEC-LC academic standard — real
  -- competency thresholds are an Academic Director decision (see
  -- docs/master-roadmap.md § Decisions Needed, item 9), to be set here
  -- once one exists.
  ('recording_retention_days', 'null');
  -- How long a learner's voice recording may be kept. `null` means
  -- keep indefinitely and purge nothing, and it is null because this
  -- is a governance decision with data-protection consequences that
  -- has NOT been made — inventing a number here would be inventing
  -- policy. Only recordings completed while a real value is set are
  -- ever given a retention_until date, and only dated rows are ever
  -- eligible for deletion. Changing it does not retroactively shorten
  -- the terms a learner already recorded under.

-- One course per programme level for Milestone 1 — purely structural
-- (titled with the level's own real, already-published name), not
-- fabricated curriculum content. See the LMS section above.
INSERT INTO courses (id, level_id, title) VALUES
  ('crs_level_1', 1, 'Foundation Programme'),
  ('crs_level_2', 2, 'Elementary Programme'),
  ('crs_level_3', 3, 'Intermediate Programme'),
  ('crs_level_4', 4, 'Upper Intermediate Programme'),
  ('crs_level_5', 5, 'Advanced Programme'),
  ('crs_level_6', 6, 'English Mastery Programme');
