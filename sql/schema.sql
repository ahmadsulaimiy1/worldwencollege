-- WEC platform schema — Cloudflare D1 (SQLite dialect).
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
-- Counting the remaining administrators before a demotion, and listing
-- appointees, both scanned this table in full. The first guards the
-- "you cannot remove the last administrator" rule, and a guard that
-- gets slower as the College grows is a guard that eventually gets
-- removed for being slow.
CREATE INDEX idx_users_role ON users(role);

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
  -- The detail the application form collects. Mirrored in
  -- sql/migrations/017-admissions-application-detail.sql, which carries
  -- the reasoning for each column and exists for databases created
  -- before this block did.
  phone             TEXT,
  city              TEXT,
  nationality       TEXT,                -- ISO 3166-1 alpha-2; NOT the same fact as country
  is_adult          INTEGER,             -- 1 = confirmed 18+
  purpose           TEXT CHECK (purpose IS NULL OR purpose IN
                      ('university','career','government','examination','business','personal')),
  start_preference  TEXT CHECK (start_preference IS NULL OR start_preference IN
                      ('immediately','within_3_months','within_6_months','undecided')),
  residency_interest TEXT CHECK (residency_interest IS NULL OR residency_interest IN
                      ('own_city','uk_london','uk_manchester','uk_other','undecided')),
  funding           TEXT CHECK (funding IS NULL OR funding IN
                      ('self','employer','family','scholarship','government','undecided')),
  payment_plan      TEXT CHECK (payment_plan IS NULL OR payment_plan IN
                      ('level_by_level','instalments','full_pathway','undecided')),
  heard_via         TEXT,
  privacy_agreed_at TEXT,
  -- The wizard's further questions. Mirrored in
  -- sql/migrations/018-admissions-wizard.sql, which carries the
  -- reasoning for each column (and states what is still deliberately
  -- not collected) for databases created before this block did.
  residential_address    TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  education_level   TEXT CHECK (education_level IS NULL OR education_level IN
                      ('secondary','undergraduate','postgraduate','doctorate','professional','other')),
  education_institution TEXT,
  sponsor_name      TEXT,
  sponsor_relationship TEXT CHECK (sponsor_relationship IS NULL OR sponsor_relationship IN
                      ('employer','parent_or_guardian','other_family','scholarship_body','government','other')),
  -- Optional, opt-in, from sql/migrations/019-kyc-documents.sql. Never
  -- required at application stage — see that migration for why an
  -- applicant may still choose to provide it from day one.
  passport_number   TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_country ON applications(country);
CREATE INDEX idx_applications_status ON applications(status);

-- ---------------------------------------------------------------------
-- Application drafts — the wizard's in-progress state, one row per
-- applicant account, promoted into a real `applications` row (typed,
-- constrained) only at final submission. See
-- sql/migrations/018-admissions-wizard.sql for the full reasoning.
-- ---------------------------------------------------------------------
CREATE TABLE application_drafts (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL UNIQUE REFERENCES users(id),
  data                      TEXT NOT NULL DEFAULT '{}',
  completed_steps           TEXT NOT NULL DEFAULT '[]',
  submitted_application_id  TEXT REFERENCES applications(id),
  created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_application_drafts_user ON application_drafts(user_id);

-- ---------------------------------------------------------------------
-- KYC documents — an applicant's OPTIONAL, opt-in identity-document
-- upload (passport or national ID), available from the first day of
-- the application rather than deferred to after an offer, for anyone
-- who chooses to provide it. Uploaded, never automatically verified —
-- see sql/migrations/019-kyc-documents.sql for the full reasoning and
-- functions/_lib/admissions/kyc-storage.js for where the file itself
-- lives (R2, never a public URL).
-- ---------------------------------------------------------------------
CREATE TABLE kyc_documents (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id),
  document_type     TEXT NOT NULL DEFAULT 'passport'
                    CHECK (document_type IN ('passport','national_id','other')),
  object_key        TEXT NOT NULL,
  original_filename TEXT,
  content_type      TEXT NOT NULL,
  size_bytes        INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'uploaded'
                    CHECK (status IN ('uploaded','reviewed','rejected')),
  uploaded_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_kyc_documents_user ON kyc_documents(user_id);

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
-- Events whose signature did not verify: the reconciliation report's
-- security question, and the first thing anybody investigating a
-- suspected forgery reaches for. PARTIAL, because these rows are — and
-- must remain — a vanishing fraction of the table.
CREATE INDEX idx_webhook_unverified
  ON payment_webhook_events(received_at DESC) WHERE signature_verified = 0;

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
-- Directive that WEC builds and owns its LMS as a proprietary asset
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
  award_title       TEXT NOT NULL,      -- 'Certificate in Applied English Communication'
  post_nominal      TEXT NOT NULL,      -- 'CAEC'
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

  -- The chain's position, as an explicit total order. The LINKS remain
  -- the authority on order; this is a lookup convenience so that finding
  -- the end of the chain is an index seek rather than a scan of every
  -- award the College has ever made. verifyChain() asserts the two agree
  -- rather than trusting this column — a denormalisation nothing checks
  -- is a second source of truth waiting to disagree with the first.
  -- Deliberately not part of the hashed content: the digest covers what
  -- the certificate asserts, and sequence is bookkeeping.
  seq               INTEGER,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_awards_user ON awards(user_id);
CREATE INDEX idx_awards_conferred ON awards(conferred_on);
-- UNIQUE so two conferrals cannot claim the same position: a lost race
-- becomes a refused INSERT the caller retries, exactly as prev_digest
-- UNIQUE already does for the links.
CREATE UNIQUE INDEX idx_awards_seq ON awards(seq);
-- The public roll as /api/register asks for it: live, consented, newest
-- first. Equality predicates then the sort column, so the planner seeks
-- and never sorts. Measured 7.25ms -> 1.88ms at 50,000 awards.
CREATE INDEX idx_awards_roll ON awards(status, public_consent, conferred_on DESC);
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
  -- Migration 024. Whether being there was required, or offered. This is
  -- an asynchronous programme: most live sessions are an offer, and
  -- marking a learner absent from something they were never required to
  -- attend manufactures a problem out of the programme working as
  -- designed. Absence only means anything where this is 1.
  attendance_expected INTEGER NOT NULL DEFAULT 0
                    CHECK (attendance_expected IN (0, 1)),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_live_sessions_level ON live_sessions(level_id);

-- Migration 024 — who was actually there.
--
-- Governance A7 put attendance first among the three metrics the
-- College had undertaken to report and could not compute at all:
-- "live_sessions exists; nothing records who attended."
--
-- A7 also named the one decision attendance needs — whether attendance
-- means presence at a live session or engagement with the module — and
-- that decision is not taken here. This table records the FACT and
-- leaves the DEFINITION open. The metric register reports presence
-- counts and says plainly that the rate is undefined pending the Board.
--
-- `source` is not metadata. An attendance record that cannot say how it
-- was made cannot be used for anything that matters. The three sources
-- are not equivalent: `platform` is a join log and therefore evidence;
-- `host` is attributable contemporaneous testimony; `self` is the
-- learner's word, recorded because it is sometimes all there is and
-- flagged because a College that treats it as equivalent to a join log
-- is not really keeping a register.
CREATE TABLE session_attendance (
  id            TEXT PRIMARY KEY,   -- 'att_' + uuid
  session_id    TEXT NOT NULL REFERENCES live_sessions(id),
  user_id       TEXT NOT NULL REFERENCES users(id),

  state         TEXT NOT NULL CHECK (state IN ('present','absent','excused')),
  source        TEXT NOT NULL CHECK (source IN ('platform','host','self')),

  -- Present only. A join time is what makes 'present' a fact rather
  -- than an opinion.
  joined_at     TEXT,
  left_at       TEXT,

  -- Excused only: why. An excusal nobody has to justify is an excusal
  -- that will be handed out to whoever asks most persistently.
  reason        TEXT,

  recorded_by   TEXT NOT NULL REFERENCES users(id),
  recorded_at   TEXT NOT NULL,

  -- One record per learner per session. Two contradictory rows is the
  -- state a register exists to prevent.
  UNIQUE (session_id, user_id),

  CHECK (state <> 'present' OR joined_at IS NOT NULL),
  CHECK (state = 'present' OR joined_at IS NULL),
  CHECK (left_at IS NULL OR (joined_at IS NOT NULL AND left_at >= joined_at)),
  CHECK (state <> 'excused' OR (reason IS NOT NULL AND TRIM(reason) <> '')),
  -- A platform record is a join log; a person cannot enter one by hand
  -- and call it evidence, so it must carry the times the log produced.
  CHECK (source <> 'platform' OR (joined_at IS NOT NULL AND left_at IS NOT NULL))
);
CREATE INDEX idx_session_attendance_user ON session_attendance(user_id);
CREATE INDEX idx_session_attendance_session ON session_attendance(session_id);


-- ---------------------------------------------------------------------
-- Migration 025 — the student voice.
--
-- Governance A7 ranked student feedback second among the three metrics
-- the College could not compute at all: "no instrument collects learner
-- opinion". Nothing here had ever asked a learner what they thought.
-- The platform can say what a learner did and nothing about whether any
-- of it was any good.
--
-- A7 named the decision: anonymity. It is not one decision but one per
-- survey — a course evaluation should be anonymous, a report of a
-- broken video should not, because nobody can fix it without asking
-- which video. So anonymity is a property of the SURVEY, and it is
-- structurally enforced: feedback_responses carries the survey's
-- anonymity bound to it by a composite foreign key, so a response to an
-- anonymous survey CANNOT hold a user_id, and one to an attributable
-- survey cannot omit it. A College that promises anonymity and stores
-- identity anyway has done something worse than not asking; here the
-- row will not insert.
--
-- feedback_actions is the difference between a feedback instrument and
-- a quality enhancement system: what changed because of what learners
-- said, or what did not and why. Silence is what kills the second
-- survey's response rate.
-- ---------------------------------------------------------------------
CREATE TABLE feedback_surveys (
  id            TEXT PRIMARY KEY,     -- 'svy_' + uuid
  code          TEXT NOT NULL UNIQUE, -- 'L1-M03-EVAL'
  title         TEXT NOT NULL,

  -- What is being asked about.
  scope         TEXT NOT NULL CHECK (scope IN ('module','level','programme','support','tutor')),
  level_id      INTEGER REFERENCES programme_levels(id),
  unit_id       TEXT REFERENCES units(id),

  -- What will be done with the answers. See the note above.
  purpose       TEXT NOT NULL,

  -- Chosen per survey, and binding on every response to it.
  anonymous     INTEGER NOT NULL CHECK (anonymous IN (0, 1)),

  opens_at      TEXT NOT NULL,
  closes_at     TEXT NOT NULL,

  created_by    TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL,

  -- A module survey is about a module; naming one is not optional.
  CHECK (scope <> 'module' OR unit_id IS NOT NULL),
  CHECK (scope <> 'level'  OR level_id IS NOT NULL),
  -- A window that closes before it opens collects nothing and looks
  -- like it collected nothing because nobody cared.
  CHECK (closes_at > opens_at),
  CHECK (TRIM(purpose) <> ''),

  -- The target of the composite foreign key below. This is what makes
  -- the anonymity promise structural rather than aspirational.
  UNIQUE (id, anonymous)
);

CREATE TABLE feedback_questions (
  id            TEXT PRIMARY KEY,     -- 'fq_' + uuid
  survey_id     TEXT NOT NULL REFERENCES feedback_surveys(id),
  sequence      INTEGER NOT NULL,
  prompt        TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('scale','text','choice')),

  -- Scale only, and both ends or neither.
  scale_min     INTEGER,
  scale_max     INTEGER,
  -- Choice only.
  choices_json  TEXT,

  required      INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1)),

  UNIQUE (survey_id, sequence),
  CHECK (kind <> 'scale' OR (scale_min IS NOT NULL AND scale_max IS NOT NULL AND scale_max > scale_min)),
  CHECK (kind = 'scale' OR (scale_min IS NULL AND scale_max IS NULL)),
  CHECK (kind <> 'choice' OR choices_json IS NOT NULL),
  CHECK (kind = 'choice' OR choices_json IS NULL),

  -- The target of the composite foreign key on feedback_answers: an
  -- answer must be shaped like the question it answers.
  UNIQUE (id, kind)
);
CREATE INDEX idx_feedback_questions_survey ON feedback_questions(survey_id);

CREATE TABLE feedback_responses (
  id            TEXT PRIMARY KEY,     -- 'fr_' + uuid
  survey_id     TEXT NOT NULL,

  -- Carried from the survey and bound to it. Not a copy that could
  -- drift: the composite foreign key makes the pair unforgeable.
  anonymous     INTEGER NOT NULL CHECK (anonymous IN (0, 1)),

  user_id       TEXT REFERENCES users(id),
  submitted_at  TEXT NOT NULL,

  FOREIGN KEY (survey_id, anonymous) REFERENCES feedback_surveys(id, anonymous),

  -- An anonymous survey cannot know who answered.
  CHECK (anonymous = 0 OR user_id IS NULL),
  -- An attributable one must.
  CHECK (anonymous = 1 OR user_id IS NOT NULL)
);
CREATE INDEX idx_feedback_responses_survey ON feedback_responses(survey_id);
-- One response per learner per survey — but only where there is a
-- learner to count. A partial index, because an anonymous survey has
-- no identity to deduplicate on and pretending otherwise would be the
-- de-anonymisation this file exists to prevent.
CREATE UNIQUE INDEX idx_feedback_one_per_learner
  ON feedback_responses(survey_id, user_id) WHERE user_id IS NOT NULL;

CREATE TABLE feedback_answers (
  id            TEXT PRIMARY KEY,
  response_id   TEXT NOT NULL REFERENCES feedback_responses(id),
  question_id   TEXT NOT NULL,
  question_kind TEXT NOT NULL,

  scale_value   INTEGER,
  text_value    TEXT,
  choice_index  INTEGER,

  FOREIGN KEY (question_id, question_kind) REFERENCES feedback_questions(id, kind),

  UNIQUE (response_id, question_id),

  -- Exactly one answer, of the shape the question asked for.
  CHECK ((scale_value IS NOT NULL) + (text_value IS NOT NULL) + (choice_index IS NOT NULL) = 1),
  CHECK (question_kind <> 'scale'  OR scale_value  IS NOT NULL),
  CHECK (question_kind <> 'text'   OR text_value   IS NOT NULL),
  CHECK (question_kind <> 'choice' OR choice_index IS NOT NULL)
);
CREATE INDEX idx_feedback_answers_response ON feedback_answers(response_id);

-- What the College did about it. See the note above: the second kind of
-- row — heard and not acted on, with a reason — matters as much as the
-- first.
CREATE TABLE feedback_actions (
  id            TEXT PRIMARY KEY,
  survey_id     TEXT NOT NULL REFERENCES feedback_surveys(id),
  finding       TEXT NOT NULL,   -- what learners said, in summary
  outcome       TEXT NOT NULL CHECK (outcome IN ('changed','planned','declined','referred')),
  detail        TEXT NOT NULL,   -- what was changed, or why it was not
  decided_by    TEXT NOT NULL REFERENCES users(id),
  decided_at    TEXT NOT NULL,
  -- Where learners can read the answer. A decision nobody told them
  -- about is a decision they will report as being ignored.
  reported_to_learners_at TEXT,

  CHECK (TRIM(detail) <> '')
);
CREATE INDEX idx_feedback_actions_survey ON feedback_actions(survey_id);
CREATE INDEX idx_feedback_answers_question ON feedback_answers(question_id);

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
  -- default, not a published WEC academic standard — real
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

-- =====================================================================
-- GRADUATE IDENTITY (migration 007)
--
-- The competency spine required by docs/academic-framework.md IV, the
-- graduate's lifelong profile, CPD, and consent-based sharing.
--
-- The competency tables ship EMPTY apart from the six competencies
-- themselves. Mapping 360 assessments to competencies is academic work
-- for the Academic Director; inventing the mapping here would produce a
-- fabricated academic record. competencyCoverage() reports the gap
-- honestly instead.
-- =====================================================================
-- ------------------------------------------------------------
-- The six competencies
-- ------------------------------------------------------------
-- Seeded, because these are not invented here — they are quoted from the
-- constitutional framework, section IV. Rows are stable identifiers a
-- transcript can reference for the next fifty years, so `code` is the
-- durable key and the display name may be revised without breaking a
-- record that cites it.
CREATE TABLE competencies (
  id            TEXT PRIMARY KEY,     -- 'cmp_clarity' etc — readable on purpose
  code          TEXT NOT NULL UNIQUE, -- 'CLARITY'
  sequence      INTEGER NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT INTO competencies (id, code, sequence, name, description) VALUES
  ('cmp_clarity',   'CLARITY',   1, 'Clarity',   'Understood the first time, by the audience actually present'),
  ('cmp_command',   'COMMAND',   2, 'Command',   'Controls the language rather than being carried by it'),
  ('cmp_judgement', 'JUDGEMENT', 3, 'Judgement', 'Chooses register, channel and moment; knows what not to say'),
  ('cmp_reason',    'REASON',    4, 'Reason',    'Constructs an argument, tests it, concedes what should be conceded'),
  ('cmp_bearing',   'BEARING',   5, 'Bearing',   'Holds a room, a call, a difficult conversation'),
  ('cmp_reach',     'REACH',     6, 'Reach',     'Communicates across cultures, and across the distance between expert and layperson');

-- Which competencies an assessment claims to assess. The framework's
-- rule is counted over THIS table, so an unmapped curriculum reports as
-- unmapped rather than as compliant-by-absence.
CREATE TABLE assessment_competencies (
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  competency_id     TEXT NOT NULL REFERENCES competencies(id),
  -- Weight is not a mark. It records how much of this assessment bears
  -- on this competency, so a task that touches Reach in passing does not
  -- count the same as one built around it.
  weight            REAL NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 1.0),

  -- THE GOVERNANCE TRAIL.
  --
  -- A mapping with no author and no authority is an opinion that has
  -- acquired the authority of a database row. assessment_skills already
  -- carried a trail; this table did not, and the difference showed the
  -- moment a mapping was actually made.
  --
  -- 'interim' is the honest state for work done under authority
  -- delegated to the Press in the absence of appointed members. It is
  -- NOT 'approved': BASCE exists as a body with members_appointed = 0,
  -- and a mapping cannot be approved by a board that has no members.
  -- 'approved' is reserved for the day it does.
  status            TEXT NOT NULL DEFAULT 'proposed'
                    CHECK (status IN ('proposed','interim','approved','retired')),
  -- Which body the decision is made under, by code: 'BASCE', 'SENATE'.
  authority         TEXT REFERENCES academic_bodies(code),
  -- Why this assessment bears on this competency. Required in practice
  -- by the test, not by the schema, because a rationale added later is
  -- better than a mapping refused now.
  rationale         TEXT,
  decided_on        TEXT,
  PRIMARY KEY (learning_item_id, competency_id)
);
CREATE INDEX idx_assessment_competencies_competency
  ON assessment_competencies(competency_id);

-- A mark against one competency, for one submission.
--
-- Separate from `assignment_submissions.score` rather than replacing it.
-- The aggregate is what a learner sees today and what every existing
-- test asserts; removing it to make room for this would have been a
-- migration that breaks working behaviour to enable behaviour that does
-- not exist yet.
CREATE TABLE competency_marks (
  id            TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES assignment_submissions(id),
  competency_id TEXT NOT NULL REFERENCES competencies(id),
  -- 0..1, matching pronunciation_feedback. NOT a percentage and not a
  -- grade: the translation from competency marks to a level result is
  -- governance B1/B2 and is not decided.
  mark          REAL NOT NULL CHECK (mark >= 0 AND mark <= 1),
  marked_by     TEXT REFERENCES users(id),
  -- 'instructor' | 'moderator' | 'automated'. A moderated mark and a
  -- first-marker mark are different evidence and an assessment board
  -- must be able to tell them apart.
  source        TEXT NOT NULL DEFAULT 'instructor'
                CHECK (source IN ('instructor','moderator','automated')),
  comment       TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (submission_id, competency_id, source)
);
CREATE INDEX idx_competency_marks_submission ON competency_marks(submission_id);

-- ------------------------------------------------------------
-- The graduate profile
-- ------------------------------------------------------------
-- One row per person, created on demand. Everything defaults to PRIVATE.
--
-- Each visibility flag is a separate named column rather than a single
-- "public" switch, because they are separate decisions: a graduate may
-- want an employer to see their awards and not their study hours, and
-- collapsing that into one boolean would force them to publish more than
-- they meant to in order to publish anything.
CREATE TABLE graduate_profiles (
  user_id           TEXT PRIMARY KEY REFERENCES users(id),
  -- The public address, chosen by the graduate. Nullable: a profile
  -- exists before it has a name, and a private profile never needs one.
  handle            TEXT UNIQUE,
  display_name      TEXT,
  biography         TEXT,
  headline          TEXT,
  country_code      TEXT,

  is_public         INTEGER NOT NULL DEFAULT 0,
  show_transcript   INTEGER NOT NULL DEFAULT 0,
  show_competencies INTEGER NOT NULL DEFAULT 0,
  show_cpd          INTEGER NOT NULL DEFAULT 0,
  -- Study hours are the most personal of these. Measured time on task
  -- says how long someone struggled, which is not what a certificate
  -- asserts and not an employer's business unless the graduate says so.
  show_study_time   INTEGER NOT NULL DEFAULT 0,
  -- 012 — the two sections migration 011 introduced. Separate switches:
  -- an employer reads "Writing" and knows what it means, where
  -- "Judgement" needs the College's framework explained, so a graduate
  -- may reasonably publish one and not the other.
  show_skills       INTEGER NOT NULL DEFAULT 0,
  show_distinctions INTEGER NOT NULL DEFAULT 0,

  -- 013 — Executive Portrait Policy. Optional, never required, and
  -- reviewed before publication. Deliberately on the PROFILE and not on
  -- the award: a certificate is a statement about a qualification and a
  -- photograph is not part of it, so no query can end up filtering
  -- awards by portrait status.
  portrait_key      TEXT,
  -- 'none' distinguishes "never uploaded" from "uploaded and removed".
  portrait_status   TEXT NOT NULL DEFAULT 'none'
                    CHECK (portrait_status IN ('none','pending_review','published','rejected','removed')),
  portrait_submitted_at TEXT,
  portrait_reviewed_by  TEXT REFERENCES users(id),
  portrait_reviewed_at  TEXT,
  portrait_note     TEXT,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_graduate_profiles_public
  ON graduate_profiles(handle) WHERE is_public = 1;

-- Continuing Professional Development, after the award.
--
-- `verified_by` is nullable and means what it says: a self-declared
-- entry is evidence of intent, a verified one is evidence of fact, and
-- the profile must show which is which. A CPD list that presented both
-- identically would be the graduate's word rendered in the College's
-- typeface.
CREATE TABLE cpd_records (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  provider      TEXT,
  kind          TEXT NOT NULL DEFAULT 'course'
                CHECK (kind IN ('course','workshop','conference','examination','publication','teaching','other')),
  hours         REAL CHECK (hours IS NULL OR hours > 0),
  completed_on  TEXT NOT NULL,
  evidence_url  TEXT,
  verified_by   TEXT REFERENCES users(id),
  verified_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_cpd_user ON cpd_records(user_id, completed_on DESC);

-- ------------------------------------------------------------
-- Consent-based sharing
-- ------------------------------------------------------------
-- A graduate hands an employer a link that shows an agreed slice of
-- their record for an agreed time, and can withdraw it.
--
-- THE TOKEN IS STORED AS A HASH, never in the clear. A share link is a
-- bearer credential: anyone holding it sees the record. A database dump
-- of live tokens would therefore be a dump of live access to every
-- graduate's academic history, and hashing means that even the College
-- cannot reconstruct a link it has issued.
--
-- `expires_at` is NOT NULL on purpose. A share that never expires is a
-- publication the graduate did not consent to; they consented to showing
-- one employer, once.
CREATE TABLE profile_shares (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  token_hash    TEXT NOT NULL UNIQUE,
  label         TEXT,                 -- 'Application to X' — the graduate's own note
  scope_json    TEXT NOT NULL,        -- which sections this link may show
  expires_at    TEXT NOT NULL,
  revoked_at    TEXT,
  view_count    INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_profile_shares_token ON profile_shares(token_hash);
CREATE INDEX idx_profile_shares_user ON profile_shares(user_id, created_at DESC);

-- =====================================================================
-- CREDENTIAL SIGNING (migration 008) — Executive Decision P2.1, ADOPTED
--
-- Public-key infrastructure for everything the College issues. The
-- private key never appears in application code or an ordinary
-- environment variable; the architecture targets a KMS/HSM from the
-- outset; until one is provisioned the layer is marked DEVELOPMENT and
-- claims no production assurance; verification uses the public key only;
-- rotation never invalidates a credential already issued; and every
-- signing operation leaves an immutable record.
--
-- The CHECK constraints below are how those rules are ENFORCED rather
-- than merely documented — most importantly, a row with backend='kms'
-- is structurally incapable of holding private key material.
-- =====================================================================
CREATE TABLE signing_keys (
  -- The key id that travels inside every signature. Long-lived and
  -- public: it appears in the JWKS and in each issued credential.
  kid             TEXT PRIMARY KEY,

  -- 'development' — a key this platform generated and holds.
  -- 'kms'         — a key held by a Key Management Service or HSM; the
  --                 College holds only its public half and asks the
  --                 service to sign.
  backend         TEXT NOT NULL CHECK (backend IN ('development','kms')),

  -- ES256 (ECDSA P-256 + SHA-256). Chosen over RSA for signature size —
  -- these end up in QR codes and printed footers — and because every
  -- major KMS offers it. Recorded per key rather than assumed, so a
  -- future algorithm change is a new key rather than a schema change.
  algorithm       TEXT NOT NULL DEFAULT 'ES256',

  public_jwk      TEXT NOT NULL,

  -- DEVELOPMENT ONLY, and the CHECK is what guarantees that.
  dev_private_jwk TEXT,

  -- For backend='kms': the service's own identifier for the key. The
  -- College never holds the private half; it holds the address of the
  -- thing that does.
  kms_key_ref     TEXT,

  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','retired','revoked')),

  -- 'retired' means "no longer signs, still verifies" — the ordinary end
  -- of a key's life. 'revoked' means the key is believed compromised and
  -- signatures made with it can no longer be trusted; that is a
  -- different and much more serious statement, and conflating the two
  -- would let a routine rotation read as a security incident, or worse,
  -- the reverse.
  revoked_reason  TEXT,

  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  activated_at    TEXT,
  retired_at      TEXT,

  CHECK (dev_private_jwk IS NULL OR backend = 'development'),
  CHECK (backend != 'kms' OR kms_key_ref IS NOT NULL),
  CHECK (status != 'revoked' OR revoked_reason IS NOT NULL)
);

-- One key signs at a time. Partial, so retired keys accumulate freely.
CREATE UNIQUE INDEX idx_signing_keys_one_active
  ON signing_keys(status) WHERE status = 'active';

-- Every signing operation, permanently.
--
-- Append-only by intent: nothing in the application updates or deletes a
-- row here. It answers the question an investigator actually asks —
-- "what did this institution sign, with which key, and when" — including
-- for keys since retired and credentials since withdrawn.
CREATE TABLE credential_signatures (
  id              TEXT PRIMARY KEY,
  kid             TEXT NOT NULL REFERENCES signing_keys(kid),

  -- What was signed. Not a foreign key: the same machinery signs awards,
  -- transcripts, diploma supplements and verification statements, and a
  -- column that could only point at one table would have forced a second
  -- audit trail for the others.
  subject_type    TEXT NOT NULL
                  CHECK (subject_type IN ('award','transcript','diploma_supplement','verification','profile')),
  subject_id      TEXT NOT NULL,

  -- SHA-256 of the canonical payload. The payload itself is NOT stored:
  -- it is reconstructible from the record it describes, and keeping a
  -- second copy would create a second thing that can disagree with the
  -- first.
  payload_digest  TEXT NOT NULL,
  signature       TEXT NOT NULL,

  -- Carried on the record, not inferred from the key at read time. A
  -- credential signed in development must still say so in 2047, even if
  -- the key that signed it has since been re-registered against a KMS.
  mode            TEXT NOT NULL CHECK (mode IN ('development','production')),

  signed_by       TEXT REFERENCES users(id),
  signed_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_credential_signatures_kid ON credential_signatures(kid, signed_at DESC);
CREATE INDEX idx_credential_signatures_subject
  ON credential_signatures(subject_type, subject_id);

-- =====================================================================
-- ISSUED DOCUMENTS AND INSTITUTIONAL VERIFICATION (migration 009)
--
-- An award is immutable; a TRANSCRIPT is a snapshot that changes as the
-- learner progresses. Verifying an issued transcript by regenerating it
-- from live data would fail the moment its holder completed another
-- module — indistinguishably from forgery. So `payload_json` freezes the
-- document as issued: not a cache of the current truth, but the record
-- of what the College asserted on a particular day.
-- =====================================================================
CREATE TABLE issued_documents (
  id              TEXT PRIMARY KEY,   -- 'doc_' + uuid

  document_type   TEXT NOT NULL
                  CHECK (document_type IN ('transcript','diploma_supplement','verification_statement')),

  user_id         TEXT NOT NULL REFERENCES users(id),

  -- Same code scheme as awards: unguessable, transcribable, self-checking.
  -- A document code and an award code are told apart by which table
  -- answers, not by their shape — so a checker who types either into the
  -- portal gets the right answer without having to know what they hold.
  verification_code TEXT NOT NULL UNIQUE,

  -- The document exactly as issued. See the note above: this is not a
  -- cache, it is the record of what was asserted on the day.
  payload_json    TEXT NOT NULL,

  signature       TEXT NOT NULL,
  kid             TEXT NOT NULL REFERENCES signing_keys(kid),

  -- 'issued'      — current
  -- 'superseded'  — a newer document of the same type was issued
  -- 'withdrawn'   — the College withdrew it (an error, or a withdrawn award)
  --
  -- Superseded documents STILL VERIFY. A university that received a
  -- transcript in 2027 needs to confirm the College really issued that
  -- document; whether a fuller one exists now is a separate question,
  -- and the answer says both.
  status          TEXT NOT NULL DEFAULT 'issued'
                  CHECK (status IN ('issued','superseded','withdrawn')),
  superseded_by   TEXT REFERENCES issued_documents(id),
  withdrawn_at    TEXT,
  withdrawn_reason TEXT,

  -- Optional validity window. Institutions often require a transcript
  -- issued within the last N months; expiry here means "the College no
  -- longer vouches this is current", never "this was not issued".
  expires_at      TEXT,

  issued_by       TEXT REFERENCES users(id),
  issued_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (status != 'withdrawn' OR withdrawn_reason IS NOT NULL)
);
CREATE INDEX idx_issued_documents_user
  ON issued_documents(user_id, document_type, issued_at DESC);
CREATE INDEX idx_issued_documents_code ON issued_documents(verification_code);

-- ------------------------------------------------------------
-- Institutional verification
-- ------------------------------------------------------------
-- An employer checking one certificate uses the public portal. A
-- university admissions office checking four hundred applicants in
-- February needs an interface, and giving them one is how the College
-- stops them screen-scraping the portal.
--
-- REGISTERED, not anonymous — and that is a deliberate asymmetry with
-- the public portal, which records nothing about who is checking. The
-- difference is consent: a graduate hands their code to an employer
-- knowing it will be checked, whereas an institution making bulk
-- automated queries against the register is doing something the College
-- should be able to see, attribute and stop.
--
-- The key is stored as a HASH. A leaked table of live API keys would be
-- a leaked ability to query the register at scale under someone else's
-- name.
CREATE TABLE verifying_institutions (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'employer'
                  CHECK (kind IN ('employer','university','government','agency')),
  contact_email   TEXT,
  country_code    TEXT,

  api_key_hash    TEXT UNIQUE,

  -- Per-day cap. Not billing — a limit is what turns "somebody is
  -- enumerating the register" from an unbounded harvest into a bounded
  -- one that shows up in the audit the next morning.
  daily_limit     INTEGER NOT NULL DEFAULT 500 CHECK (daily_limit > 0),

  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','suspended','revoked')),
  suspended_reason TEXT,

  approved_by     TEXT REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (status = 'active' OR suspended_reason IS NOT NULL)
);

-- Every institutional check, attributed.
--
-- Deliberately unlike `award_verifications`, which records NOTHING about
-- who checked. The public portal promises anonymity because a stranger
-- verifying a certificate they were handed deserves it. An institution
-- holding an API key agreed to be identified as a condition of holding
-- one, and the College needs the record to answer "who has been reading
-- our register, and how much of it".
CREATE TABLE institution_checks (
  id              TEXT PRIMARY KEY,
  institution_id  TEXT NOT NULL REFERENCES verifying_institutions(id),
  code_attempted  TEXT NOT NULL,
  outcome         TEXT NOT NULL,
  checked_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_institution_checks_institution
  ON institution_checks(institution_id, checked_at DESC);

-- =====================================================================
-- ACCREDITATION EVIDENCE CENTRE + RELATION MODEL (migration 010)
--
-- An INTERNAL quality instrument. The College holds no accreditation,
-- recognition or affiliation, and has applied for none.
--
-- The absence of evidence is itself evidence: every item the College has
-- undertaken to hold is registered whether or not it exists, with one of
-- five honest states. `statement` is NOT NULL on every row — including
-- 'not_applicable', because "not applicable" without a reason is how a
-- checklist gets quietly emptied.
--
-- `academic_relations` is one table for both the Evidence Centre's
-- cross-references and the Academic Knowledge Graph, because they are
-- the same structure. Its `status` column is what makes the graph
-- academic rather than computational: "this lesson teaches this
-- competency" is a judgement, and only `approved` edges feed academic
-- conclusions.
-- =====================================================================
CREATE TABLE evidence_items (
  id              TEXT PRIMARY KEY,   -- 'ev_' + uuid

  -- The human reference an auditor cites in a report: 'GOV-003'.
  -- Stable for the life of the item, across every version of it.
  reference       TEXT NOT NULL UNIQUE,

  collection      TEXT NOT NULL,
  title           TEXT NOT NULL,

  state           TEXT NOT NULL
                  CHECK (state IN ('exists','scheduled','governance_pending','not_instrumented','not_applicable')),

  -- Why this state. NOT NULL for every row, including 'exists' — a
  -- reviewer needs to know what the document demonstrates, not merely
  -- that a file is present.
  statement       TEXT NOT NULL,

  -- Where the evidence is, when it exists. A repository path, and
  -- tests/evidence-centre.test.mjs asserts every 'exists' row with a
  -- path actually resolves to a file. An evidence register that can
  -- cite a document nobody can open is worse than an empty one.
  source_path     TEXT,

  classification  TEXT NOT NULL DEFAULT 'internal'
                  CHECK (classification IN ('public','internal','restricted')),
  retention       TEXT,

  -- Governance metadata. Roles rather than names: naming a person who
  -- does not hold the post would be fabricating personnel, and the post
  -- outlives whoever holds it.
  owner_role      TEXT,
  author_role     TEXT,
  reviewer_role   TEXT,
  approver_role   TEXT,
  approved_at     TEXT,

  review_interval_months INTEGER CHECK (review_interval_months IS NULL OR review_interval_months > 0),
  next_review_at  TEXT,

  version         INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  supersedes_id   TEXT REFERENCES evidence_items(id),

  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- An approved item names who approved it. An approval with no
  -- approving role is an assertion.
  CHECK (approved_at IS NULL OR approver_role IS NOT NULL),
  -- Evidence that exists says where it is.
  CHECK (state != 'exists' OR source_path IS NOT NULL)
);
CREATE INDEX idx_evidence_collection ON evidence_items(collection, reference);
CREATE INDEX idx_evidence_state ON evidence_items(state);
CREATE INDEX idx_evidence_review ON evidence_items(next_review_at) WHERE next_review_at IS NOT NULL;

-- Immutable history. Append-only by intent: nothing updates or deletes
-- a row here, so "what did this policy say in March 2028, and who
-- approved it" is answerable years later.
CREATE TABLE evidence_versions (
  id              TEXT PRIMARY KEY,
  evidence_id     TEXT NOT NULL REFERENCES evidence_items(id),
  version         INTEGER NOT NULL,
  state           TEXT NOT NULL,
  statement       TEXT NOT NULL,
  source_path     TEXT,
  changed_by      TEXT REFERENCES users(id),
  change_note     TEXT NOT NULL,
  recorded_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (evidence_id, version)
);
CREATE INDEX idx_evidence_versions_item ON evidence_versions(evidence_id, version DESC);

-- ------------------------------------------------------------
-- The relation model
-- ------------------------------------------------------------
-- One table, deliberately, because the Evidence Centre's cross-
-- references and the Academic Knowledge Graph are the same structure
-- seen from two ends. A governance decision that affects a policy, a
-- policy that governs an assessment, an assessment that verifies a
-- competency, a competency that justifies an award — all one shape.
--
-- STATUS IS WHAT MAKES THIS ACADEMIC RATHER THAN COMPUTATIONAL.
--
-- "This lesson teaches this competency" is an academic judgement. A
-- graph that inferred it from a lesson title would look complete and be
-- fiction. So every relation carries a status:
--
--   proposed  — asserted, not yet reviewed. Present, visible, NOT relied on.
--   approved  — an academic reviewer accepted it. Only these count.
--   retired   — withdrawn, kept for the record.
--
-- Queries that feed academic conclusions read `approved` only. Proposed
-- relations are how the mapping work gets DONE — draft, review, approve —
-- without the draft ever being mistaken for the finding.
CREATE TABLE academic_relations (
  id              TEXT PRIMARY KEY,

  subject_type    TEXT NOT NULL,
  subject_id      TEXT NOT NULL,
  predicate       TEXT NOT NULL,
  object_type     TEXT NOT NULL,
  object_id       TEXT NOT NULL,

  status          TEXT NOT NULL DEFAULT 'proposed'
                  CHECK (status IN ('proposed','approved','retired')),

  -- Not a foreign key: subjects and objects live in a dozen different
  -- tables, and a column that could only point at one of them would have
  -- forced a separate join table per pair — which is precisely the
  -- design that makes a knowledge graph impossible to extend.
  --
  -- The cost is that referential integrity is the application's job
  -- here. tests/knowledge-graph.test.mjs asserts every relation resolves
  -- to something real, so a dangling edge is a test failure rather than
  -- a silent hole in the graph.
  asserted_by     TEXT REFERENCES users(id),
  approved_by     TEXT REFERENCES users(id),
  approved_at     TEXT,
  retired_at      TEXT,
  note            TEXT,

  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- One edge per (subject, predicate, object). Re-asserting an existing
  -- relation is not a second fact.
  UNIQUE (subject_type, subject_id, predicate, object_type, object_id),
  CHECK (status != 'approved' OR approved_at IS NOT NULL)
);
CREATE INDEX idx_academic_relations_subject
  ON academic_relations(subject_type, subject_id, status);
CREATE INDEX idx_academic_relations_object
  ON academic_relations(object_type, object_id, status);

-- ============================================================
-- 011 — LANGUAGE SKILLS AND ACADEMIC DISTINCTIONS
-- Mirrored from sql/migrations/011-skills-and-distinctions.sql.
-- ============================================================
-- ============================================================
-- WHY A SECOND FRAMEWORK, ALONGSIDE THE COMPETENCIES
-- ============================================================
--
-- The College already has six competencies — Clarity, Command,
-- Judgement, Reason, Bearing, Reach. They describe what a communicator
-- can DO, and they are the College's own contribution.
--
-- They are not the same thing as the four language skills, and neither
-- can be derived from the other. CEFR is DEFINED skill by skill: a
-- reader at B2 may be a speaker at B1, and a qualification that
-- reported a single level without saying which skills stood where
-- would be hiding the most useful thing it knows. An employer hiring
-- for a call centre and a university admitting to a taught master's
-- are asking about different skills, and both are entitled to an
-- answer.
--
-- So this is a second, orthogonal framework, mapped separately.
--
-- ============================================================
-- WHAT THIS MIGRATION DELIBERATELY DOES NOT DO
-- ============================================================
--
-- It does not attribute a single assessment to a single skill.
--
-- Deciding that a particular assignment evidences Writing rather than
-- Reading is academic judgement. It is exactly the kind of judgement
-- the Knowledge Graph directive said must be represented as an
-- explicit relationship that can be reviewed, approved and audited —
-- never inferred by the software because the mapping looked obvious.
--
-- The consequence is that on the day this migration runs, every
-- graduate's skill profile reports `unmapped`. That is not a bug and
-- not an empty result: it is the true statement that the College has
-- not yet mapped its assessments to the skills, and it stays visible
-- until somebody with the authority to do so does it and signs their
-- name to it.

-- ------------------------------------------------------------
-- The four skills
-- ------------------------------------------------------------
-- Seeded, not user-created. These four are fixed by CEFR and by every
-- comparable qualification in the world; making them editable would
-- invite a local variation that nobody outside the College could read.
CREATE TABLE IF NOT EXISTS language_skills (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  sequence      INTEGER NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  -- The pair each skill belongs to. Reception and production are the
  -- distinction that actually predicts difficulty, and a profile that
  -- groups them reads far better than four bars in a row.
  mode          TEXT NOT NULL CHECK (mode IN ('receptive','productive')),
  description   TEXT NOT NULL
);

INSERT OR IGNORE INTO language_skills (id, code, sequence, name, mode, description) VALUES
  ('skl_listening', 'LISTENING', 1, 'Listening', 'receptive',
   'Understands speech at natural pace, including unfamiliar accents and imperfect conditions'),
  ('skl_reading',   'READING',   2, 'Reading',   'receptive',
   'Reads for argument and detail, not only for gist, across registers'),
  ('skl_speaking',  'SPEAKING',  3, 'Speaking',  'productive',
   'Speaks with control of grammar, pronunciation and register, in real time'),
  ('skl_writing',   'WRITING',   4, 'Writing',   'productive',
   'Writes to a purpose and an audience, and revises');

-- ------------------------------------------------------------
-- Which assessments evidence which skill — a reviewable claim
-- ------------------------------------------------------------
-- Mirrors assessment_competencies deliberately. Two frameworks with
-- two different mapping mechanisms would be two things to audit, two
-- places to be inconsistent, and two explanations to give a reviewer.
CREATE TABLE IF NOT EXISTS assessment_skills (
  id                TEXT PRIMARY KEY,
  -- Keyed on the learning item, exactly as assessment_competencies is.
  -- The unit is the module; the learning item is the individual quiz or
  -- assignment, and that is the thing an academic actually judges.
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  skill_id          TEXT NOT NULL REFERENCES language_skills(id),

  -- How much of this assessment is really about this skill. A speaking
  -- task assessed for pronunciation is not 100% Speaking if half the
  -- marks are for the argument.
  weight            REAL NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 1.0),

  -- The governance trail. A mapping with no proposer and no approver is
  -- an opinion that has acquired the authority of a database row.
  status            TEXT NOT NULL DEFAULT 'proposed'
                    CHECK (status IN ('proposed','approved','retired')),
  proposed_by       TEXT REFERENCES users(id),
  proposed_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  approved_by       TEXT REFERENCES users(id),
  approved_at       TEXT,
  rationale         TEXT,

  -- An approval must record who and when. Without this, 'approved' is a
  -- word rather than an act.
  CHECK (status != 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_assessment_skills_skill ON assessment_skills(skill_id, status);
CREATE INDEX IF NOT EXISTS idx_assessment_skills_item ON assessment_skills(learning_item_id, status);
-- One live claim per assessment per skill. A retired mapping stays, so
-- the partial index excludes it rather than the row being deleted.
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_skills_unique
  ON assessment_skills(learning_item_id, skill_id)
  WHERE status != 'retired';

-- ------------------------------------------------------------
-- Academic distinctions — contribution that is not a mark
-- ------------------------------------------------------------
-- ONE table for leadership, presentation, research and service rather
-- than four bespoke features. They differ in what they describe, not in
-- how the institution handles them: each is a claim about a person,
-- each needs evidence, each needs somebody willing to approve it, and
-- each must be withdrawable without vanishing.
--
-- Nothing here is inferred from platform activity. "Led a seminar" is
-- not something the software can observe, and a record generated from
-- attendance data would be a plausible-sounding fabrication with a
-- timestamp on it.
CREATE TABLE IF NOT EXISTS academic_distinctions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),

  kind          TEXT NOT NULL CHECK (kind IN (
                  'leadership',     -- held a role: cohort representative, mentor
                  'presentation',   -- presented to an audience beyond the class
                  'research',       -- a project or investigation with an output
                  'service',        -- contribution to the College or its community
                  'prize'           -- a named award decided by a panel
                )),
  title         TEXT NOT NULL,
  summary       TEXT,
  -- Where it happened, in the College's own structure where it applies.
  level_id      INTEGER REFERENCES programme_levels(id),
  awarded_on    TEXT NOT NULL,
  -- Who says so. An external body's name is recorded as text because
  -- the College does not hold a register of other institutions.
  awarded_by    TEXT,
  evidence_url  TEXT,

  -- The same three-state life as every other institutional claim.
  status        TEXT NOT NULL DEFAULT 'proposed'
                CHECK (status IN ('proposed','approved','withdrawn')),
  approved_by   TEXT REFERENCES users(id),
  approved_at   TEXT,
  withdrawn_at  TEXT,
  withdrawn_reason TEXT,

  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (status != 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  -- A withdrawal without a reason is a deletion wearing a status
  -- column. The reason is what makes the record still auditable.
  CHECK (status != 'withdrawn' OR (withdrawn_at IS NOT NULL AND withdrawn_reason IS NOT NULL))
);
-- Created last: the probe at the top of this file looks for it, so a
-- partially applied migration is never recorded as complete.
CREATE INDEX IF NOT EXISTS idx_distinctions_user ON academic_distinctions(user_id, status);

-- ============================================================
-- 013 — ADOPTED GOVERNANCE DECISIONS
-- Mirrored from sql/migrations/013-governance-decisions.sql.
-- ============================================================
-- ============================================================
-- 1. EXECUTIVE PORTRAIT POLICY (approved)
-- ============================================================
--
-- Optional, never required. Square, professional. Reviewed before
-- publication. Removed immediately if an award is withdrawn or at the
-- graduate's request. Certificates and verification remain valid
-- regardless of portrait status.
--
-- That last clause is the one with teeth, and it is why the portrait
-- lives HERE, on the profile, and not on the award. A certificate is a
-- statement about a qualification; a photograph is not part of it. If
-- these shared a table, a portrait dispute would sit one careless JOIN
-- away from a credential, and some future query would end up filtering
-- awards by portrait status.
-- The portrait columns are declared inline on graduate_profiles above.

-- ============================================================
-- 2. ALUMNI CHAPTERS (approved)
-- ============================================================
--
-- One real organisation — the Worldwide English College Alumni Society
-- — with six chapters, one per IEFC award.
--
-- The chapters are reference data because they are real and named. But
-- MEMBERSHIP IS NOT STORED. A graduate belongs to the chapter of their
-- highest live award, which is a fact already in the awards table, and
-- copying it here would create a second answer to the same question
-- that drifts the first time an award is revoked or replaced.
--
-- No officers are seeded, and no membership counts. The Society has no
-- officers yet; inventing a President would be exactly the fabrication
-- this project has refused everywhere else.
CREATE TABLE IF NOT EXISTS alumni_chapters (
  id            TEXT PRIMARY KEY,
  level_id      INTEGER NOT NULL UNIQUE REFERENCES programme_levels(id),
  name          TEXT NOT NULL UNIQUE,
  -- The award whose holders belong here, denormalised for display only.
  award_title   TEXT NOT NULL,
  post_nominal  TEXT NOT NULL,
  description   TEXT NOT NULL,
  -- Officers are elected, not appointed by a migration. Until a chapter
  -- has members enough to hold an election, this stays 0 and the
  -- interface says so.
  officers_elected INTEGER NOT NULL DEFAULT 0 CHECK (officers_elected IN (0, 1))
);

INSERT OR IGNORE INTO alumni_chapters (id, level_id, name, award_title, post_nominal, description) VALUES
  ('chp_aspirant',  1, 'Foundation Chapter',   'Essential Certificate in English Communication',        'ECIC',
   'Holders of the Foundation Stage qualification, who began a language in adulthood and did not stop.'),
  ('chp_candidate', 2, 'Development Chapter',  'Higher Certificate in English Communication',           'HCIC',
   'Holders of the Development Stage qualification, independent in the English of ordinary life.'),
  ('chp_associate', 3, 'Application Chapter',  'Certificate in Applied English Communication',          'CAEC',
   'Holders of the Application Stage qualification, who use English for work and study rather than only in it.'),
  ('chp_envoy',     4, 'Professional Chapter', 'Higher Certificate in Applied English Communication',   'HCAEC',
   'Holders of the Professional Stage qualification, who can be sent to speak for someone other than themselves.'),
  ('chp_orator',    5, 'Advanced Chapter',     'Advanced Certificate in English Communication',         'ACEC',
   'Holders of the Advanced Stage qualification, who control nuance, register and implication.'),
  ('chp_laureate',  6, 'Mastery Chapter',      'Worldwide English Proficiency Certificate',             'WEPC',
   'Holders of the College''s highest qualification, who have completed the Worldwide English Qualifications framework in full.');

-- ============================================================
-- 3. SKILL DESCRIPTORS, NOT PERCENTAGES (Academic Senate)
-- ============================================================
--
-- Executive institutions do not reduce communication ability to a
-- percentage. Five ordered descriptors replace the number.
--
-- The DESCRIPTORS are decided — the Executive named them. The
-- THRESHOLDS are not: nobody has said what evidence makes a graduate
-- "Proficient" rather than "Developing", and that is a harder academic
-- question than naming the bands. It is left explicitly unanswered
-- rather than filled with round numbers that would look decided.
--
-- The consequence is that a skill descriptor requires TWO approvals: the
-- assessment-to-skill mapping, and the threshold that turns evidence
-- into a band. Until both exist, no descriptor is reported.
CREATE TABLE IF NOT EXISTS skill_descriptors (
  id            TEXT PRIMARY KEY,
  sequence      INTEGER NOT NULL UNIQUE,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL,

  -- The evidence threshold for this band, as a proportion of available
  -- marks on approved mapped assessments. NULL until the Senate sets it.
  -- Nullable rather than defaulted: a default would BE a decision, made
  -- by whoever typed the migration.
  threshold_min REAL CHECK (threshold_min IS NULL OR (threshold_min >= 0 AND threshold_min <= 1)),
  approved_by   TEXT REFERENCES users(id),
  approved_at   TEXT,
  CHECK (threshold_min IS NULL OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

INSERT OR IGNORE INTO skill_descriptors (id, sequence, code, name, description) VALUES
  ('skd_emerging',      1, 'EMERGING',      'Emerging',
   'Beginning to operate in the skill, with support and in familiar conditions.'),
  ('skd_developing',    2, 'DEVELOPING',    'Developing',
   'Operates independently in familiar conditions; still effortful in unfamiliar ones.'),
  ('skd_proficient',    3, 'PROFICIENT',    'Proficient',
   'Operates reliably across the range the level describes.'),
  ('skd_advanced',      4, 'ADVANCED',      'Advanced',
   'Operates with control and range beyond what the level requires.'),
  ('skd_distinguished', 5, 'DISTINGUISHED', 'Distinguished',
   'Operates at a standard that would be recognised well outside the College.');

-- ============================================================
-- 4. BOARD OF ACADEMIC STANDARDS AND CURRICULUM EXCELLENCE
-- ============================================================
--
-- Established as the authority for the competency framework. No members
-- are seeded: a board with invented members is worse than no board, and
-- the Executive has established the body without yet appointing to it.
--
-- Recorded in the academic_bodies table so that approvals elsewhere can
-- reference an authority that exists, rather than naming one in prose.
CREATE TABLE IF NOT EXISTS academic_bodies (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  remit         TEXT NOT NULL,
  established_on TEXT NOT NULL,
  -- 0 until people are appointed. The interface must be able to say
  -- "established, not yet constituted", which is the true position.
  members_appointed INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO academic_bodies (id, code, name, remit, established_on) VALUES
  ('bod_basce', 'BASCE', 'Board of Academic Standards and Curriculum Excellence',
   'Defines institutional competencies; maps every assessment to one or more competencies; '
   || 'ensures each competency is assessed multiple times across each level; approves competency '
   || 'descriptors; reviews mappings annually; maintains the integrity of the competency framework.',
   '2026-08-04'),
  ('bod_senate', 'SENATE', 'Academic Senate',
   'Approves the mapping between assessments and the four language skills, and the descriptor '
   || 'thresholds that turn assessed evidence into a skill descriptor.',
   '2026-08-04');

-- Created last: the probe at the top looks for it, so a partially
-- applied migration is never recorded as complete.
CREATE INDEX IF NOT EXISTS idx_portrait_review
  ON graduate_profiles(portrait_status, portrait_submitted_at);

-- ============================================================
-- 014 — AWARD DEFINITIONS
-- Mirrored from sql/migrations/014-award-definitions.sql.
-- ============================================================
-- ============================================================
-- WHY THIS IS A TABLE AND NOT A DOCUMENT
-- ============================================================
--
-- What an award MEANS was authoritative text living in
-- docs/iefc-award-architecture.md and docs/curriculum-framework.md. A
-- certificate, a graduate profile, a verification page, a transcript
-- and the institutional API each need to say it, and while it lived in
-- prose each of them would have said it slightly differently — which is
-- how an institution ends up with five descriptions of one
-- qualification and no way to tell which is official.
--
-- The text below is TRANSCRIBED from those documents, not rewritten.
-- tests/award-definitions.test.mjs asserts that each definition still
-- appears in its source document, so the two cannot drift apart in
-- either direction: editing the document without the database, or the
-- database without the document, fails the suite.
--
-- ============================================================
-- WHAT IS DELIBERATELY ABSENT
-- ============================================================
--
-- No credit value, no Total Qualification Time, no grading scale. Those
-- are carried on the AWARD ITSELF (awards.credits, awards.tqt_hours),
-- denormalised at conferral so a certificate issued in 2027 still reads
-- as it did in 2027. A definition that also carried them would be a
-- second source of truth for the numbers a certificate asserts.
CREATE TABLE IF NOT EXISTS award_definitions (
  id              TEXT PRIMARY KEY,
  level_id        INTEGER NOT NULL UNIQUE REFERENCES programme_levels(id),

  -- The official title, exactly as it appears on the certificate.
  official_title  TEXT NOT NULL UNIQUE,
  post_nominal    TEXT NOT NULL UNIQUE,
  cefr            TEXT NOT NULL,

  -- The standing the award confers — what the holder IS, not what they
  -- can do. Each award is complete in itself; this is the sentence that
  -- says so.
  standing        TEXT NOT NULL,
  -- Why the College uses this word, in the College's own words.
  academic_purpose TEXT NOT NULL,
  -- Who the holder is, at the point of conferral.
  graduate_profile TEXT NOT NULL,
  -- What they can do. Transcribed from the curriculum framework, so the
  -- award and the curriculum cannot describe different qualifications.
  learning_outcomes TEXT NOT NULL
);

INSERT OR IGNORE INTO award_definitions
  (level_id, id, official_title, post_nominal, cefr, standing,
   academic_purpose, graduate_profile, learning_outcomes) VALUES
  (1, 'awd_def_aspirant', 'Essential Certificate in English Communication', 'ECIC', 'A1', 'Entry into the tradition',
   'honours the decision, which at A1 is the achievement. Beginning a language in adulthood is harder than any later step and is where most people stop. Overclaims nothing.',
   'The learner arrives with little or no English. By the end of Foundation, they can introduce themselves, handle short everyday exchanges (shopping, ordering food, asking directions, basic scheduling), read and write short simple texts, and understand slow, clear speech on familiar topics.',
   'By the end of Level I, the learner can: introduce themselves and others; ask/answer simple personal questions; describe their home, family, and daily routine in simple sentences; make simple purchases and requests; tell the time and discuss simple schedules; ask for and give basic directions; write a short personal message or form; understand short, simple spoken instructions given slowly and clearly.'),
  (2, 'awd_def_candidate', 'Higher Certificate in English Communication', 'HCIC', 'A2', 'Recognised learner of the College',
   'formal admission to candidature. The moment the College recognises someone as its own.',
   'The learner builds from survival phrases to handling routine tasks and simple social exchange — describing experiences, expressing simple opinions, and managing everyday situations with more independence.',
   'By the end of Level II, the learner can: describe past experiences and events in simple terms; express likes, dislikes, and simple opinions; make and respond to invitations, suggestions, and apologies; describe future plans and intentions; compare people, places, and things; give simple reasons and explanations; handle simple phone/service conversations; write short connected texts (a short email, a simple description, a short story).'),
  (3, 'awd_def_associate', 'Certificate in Applied English Communication', 'CAEC', 'B1', 'Established member of the academic community',
   'membership. Not "can do B1 things"; belongs. This is the point on the Ascent where a learner stops being someone taking a course and becomes a member of an academic community, and the word says exactly that.',
   'The learner becomes a genuinely independent user — coping with most travel/work/study situations, expressing and defending opinions, and beginning structured, purposeful writing. This is also where academic English begins, introduced deliberately early rather than left until Advanced.',
   'By the end of Level III, the learner can: describe experiences, hopes, and ambitions with reasons; give a structured opinion and respond to a counter-opinion; write a structured paragraph/short essay with a clear topic sentence; handle unscripted, moderately complex conversations on familiar and some unfamiliar topics; understand the main points of clear standard input on work, school, or leisure; produce simple connected text on familiar topics; ask clarifying questions to manage a conversation.'),
  (4, 'awd_def_envoy', 'Higher Certificate in Applied English Communication', 'HCAEC', 'B2', 'Trusted representative and communicator',
   'one who can be sent: to the meeting, the client, the interview, to speak for someone other than themselves. B2 is precisely the representation threshold, and representation is what an employer is buying.',
   'The learner becomes fluent enough to follow extended discourse, argue a position in depth, and produce genuinely structured academic and professional writing. This level carries the heaviest step-up in register and complexity in the programme.',
   'By the end of Level IV, the learner can: understand extended speech and complex argumentation on familiar and abstract topics; interact with a degree of fluency that makes regular interaction with native speakers possible without strain on either party; produce clear, detailed text on a wide range of subjects; explain a viewpoint, weighing advantages/disadvantages; write a structured 4-5 paragraph essay with a clear thesis and evidence; participate in a structured meeting/seminar-style discussion; write a professional email/report in an appropriate register.'),
  (5, 'awd_def_orator', 'Advanced Certificate in English Communication', 'ACEC', 'C1', 'High-level intellectual and professional communicator',
   'composition and delivery: clear, structured argument on complex subjects, delivered fluently. That is oratory in the classical sense, and C1 is where the leadership and executive-communication strands become the substance of the award rather than an addition to it. Chosen over Scholar, which implies research and carries a funding connotation ("a scholar" is often someone with a scholarship).',
   'The learner refines fluency into precision — flexible, effective language use for social, academic, and professional purposes, including implicit meaning, nuance, and stylistic control.',
   'By the end of Level V, the learner can: understand a wide range of demanding, longer texts and recognise implicit meaning; express ideas fluently and spontaneously without much obvious searching for expression; use language flexibly and effectively for social, academic, and professional purposes; produce clear, well-structured, detailed text on complex subjects, controlling organisational patterns and cohesive devices; understand and produce nuanced, idiomatic, register-appropriate language; lead a discussion or negotiation to a productive outcome.'),
  (6, 'awd_def_laureate', 'Worldwide English Proficiency Certificate', 'WEPC', 'C2', 'Distinguished master of the programme',
   'the crown. Conferred rather than accumulated, associated with distinction rather than administration, and — critically — not confusable with a degree. Master was rejected outright: a reasonable person reads it as a master''s degree, and an architecture whose summit is a misunderstanding is not an architecture.',
   'The capstone level. The learner refines toward near-native command: spontaneous, precise, and persuasive across virtually any register or context, capable of leading, teaching, and representing an organisation in English at the highest level.',
   'By the end of Level VI, the learner can: understand with ease virtually everything heard or read; summarise information from different spoken and written sources, reconstructing arguments and accounts coherently; express themselves spontaneously, very fluently, and precisely, differentiating finer shades of meaning even in complex situations; produce publication- quality written work; represent a position or organisation persuasively at a senior/leadership level; mentor or coach another learner''s English development, demonstrating command of the language as a system, not just as a skill.');

-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_award_definitions_level ON award_definitions(level_id);

-- ============================================================
-- 015 — THE PROGRAMME DEFINITION AND ITS SEVEN CLAIMS
-- Mirrored from sql/migrations/015-programme-definition.sql.
-- ============================================================
-- ============================================================
-- THE DEFINITION, AND WHY IT IS DECOMPOSED
-- ============================================================
--
-- The Executive's definition of the qualification:
--
--   "IEFC is an advanced academic qualification built on CEFR
--    proficiency, extending it through competency verification,
--    leadership, professional communication, critical thinking,
--    authentic assessment, and independently verifiable digital
--    credentials."
--
-- That is the most public claim the College makes. It is stored whole,
-- because a definition paraphrased differently on each page is not a
-- definition — but it is ALSO decomposed into the seven things it
-- asserts, because the standing rule is that every public claim must be
-- verifiable, and a sentence cannot be verified as a whole.
--
-- Each element therefore carries an evidence state and the thing that
-- evidences it. Where the College cannot yet evidence an element, the
-- record says so, and the interface is expected to say so too.
--
-- ============================================================
-- WHAT THIS MIGRATION REVEALS
-- ============================================================
--
-- Six of the seven elements are evidenced today. One is not:
-- COMPETENCY VERIFICATION. The framework exists, the six competencies
-- are defined, the marking table is built — and zero of the sixty
-- assessments are mapped to it, so nothing has been verified against
-- any competency for anybody.
--
-- That is not a small gap at the edge of the definition. It is the
-- element that distinguishes "an advanced academic qualification" from
-- "a well-built CEFR course", and it is the reason BASCE was
-- established. The claim is recorded here as the Executive stated it
-- and reported as not-yet-evidenced, so the distance between the two is
-- visible rather than papered over.
CREATE TABLE IF NOT EXISTS programme_definition (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  -- The definition, whole and verbatim. Every page that describes the
  -- qualification reads THIS, so the College says one thing.
  statement     TEXT NOT NULL,
  adopted_on    TEXT NOT NULL,
  adopted_by    TEXT NOT NULL
);

INSERT OR IGNORE INTO programme_definition (id, code, name, statement, adopted_on, adopted_by) VALUES
  ('prg_iefc', 'IEFC', 'International English Fluency Course',
   'IEFC is an advanced academic qualification built on CEFR proficiency, extending it through '
   || 'competency verification, leadership, professional communication, critical thinking, '
   || 'authentic assessment, and independently verifiable digital credentials.',
   '2026-08-04', 'Executive');

-- ------------------------------------------------------------
-- The seven claims, each answerable on its own
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programme_claims (
  id            TEXT PRIMARY KEY,
  programme_id  TEXT NOT NULL REFERENCES programme_definition(id),
  sequence      INTEGER NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  -- The element as the definition names it.
  claim         TEXT NOT NULL,

  -- The same vocabulary the Evidence Centre uses, so a reviewer learns
  -- one set of words for the whole institution.
  --
  --   evidenced        the platform can show this, now, from its own data
  --   partial          real but incomplete, and the shortfall is named
  --   not_evidenced    stated by the Executive; nothing yet supports it
  --   governance_pending  blocked on a decision, not on work
  state         TEXT NOT NULL
                CHECK (state IN ('evidenced','partial','not_evidenced','governance_pending')),
  -- WHAT evidences it — a table, a count, a route. Specific enough that
  -- a reviewer can go and look.
  evidence      TEXT NOT NULL,
  -- What is missing, where anything is. NULL only when state =
  -- 'evidenced', enforced below: a shortfall with no description is a
  -- gap nobody can close.
  shortfall     TEXT,

  CHECK (state = 'evidenced' OR shortfall IS NOT NULL),
  CHECK (state != 'evidenced' OR shortfall IS NULL)
);

INSERT OR IGNORE INTO programme_claims
  (id, programme_id, sequence, code, claim, state, evidence, shortfall) VALUES

  ('clm_cefr', 'prg_iefc', 1, 'CEFR_PROFICIENCY',
   'Built on CEFR proficiency',
   'evidenced',
   'Six programme levels mapped A1 to C2 in programme_levels, each with an award definition '
   || 'carrying the same CEFR band (award_definitions). Sixty modules authored across the six levels.',
   NULL),

  -- The one that cannot be claimed today.
  ('clm_competency', 'prg_iefc', 2, 'COMPETENCY_VERIFICATION',
   'Extended through competency verification',
   'not_evidenced',
   'The framework exists: six competencies defined in `competencies`, a mapping table '
   || '(assessment_competencies) and a marking table (competency_marks) with per-submission marks '
   || 'from named markers. The Board of Academic Standards and Curriculum Excellence (BASCE) is '
   || 'established as its authority.',
   'ZERO of the sixty assessments are mapped to any competency, so no competency has been verified '
   || 'for any graduate. This is the element that distinguishes an advanced academic qualification '
   || 'from a well-built CEFR course, and it is the reason BASCE exists. BASCE is established but '
   || 'not yet constituted; until it is appointed and completes the mapping, the College cannot '
   || 'evidence this part of its own definition.'),

  ('clm_leadership', 'prg_iefc', 3, 'LEADERSHIP',
   'Extended through leadership',
   'partial',
   'Leadership is taught: dedicated modules at Level V (Leadership and Persuasion, Professional '
   || 'Advocacy) and Level IV (Meetings and Negotiation), with presentation modules across levels. '
   || 'Leadership contribution outside assessment is recordable in academic_distinctions, approved '
   || 'by a named person.',
   'Taught and recordable, but not yet ASSESSED against a framework: leadership sits within the '
   || 'BEARING and REACH competencies, which share the mapping gap above. A distinction record is '
   || 'evidence that somebody led something; it is not a verified attainment.'),

  ('clm_professional', 'prg_iefc', 4, 'PROFESSIONAL_COMMUNICATION',
   'Extended through professional communication',
   'evidenced',
   'Professional communication is the spine of Levels IV to VI: The World of Work, Meetings and '
   || 'Negotiation, Professional Advocacy, Research and Presentation, and the academic writing '
   || 'sequence. Assessed by assignment against published rubrics.',
   NULL),

  ('clm_critical', 'prg_iefc', 5, 'CRITICAL_THINKING',
   'Extended through critical thinking',
   'evidenced',
   'Taught and assessed from Level III upward: Opinions and Debate, Arguing a Position, Media '
   || 'Literacy and Critical Reading, and the critical-thinking element normalised across quizzes '
   || 'in the V1.0 consistency sweep.',
   NULL),

  ('clm_authentic', 'prg_iefc', 6, 'AUTHENTIC_ASSESSMENT',
   'Extended through authentic assessment',
   'evidenced',
   'Sixty assignments, one per module, each marked by a person against a published rubric '
   || 'normalised to the WEC rubric policy — not auto-scored. Spoken work is captured as '
   || 'learner recordings and reviewed in the instructor workspace.',
   NULL),

  ('clm_credentials', 'prg_iefc', 7, 'VERIFIABLE_CREDENTIALS',
   'Independently verifiable digital credentials',
   'partial',
   'A hash-chained Graduate Register; ES256 credential signing with published JWKS; QR codes '
   || 'verified against an independent decoder; issued documents frozen at issue; and a public '
   || 'verification portal answering across identity, integrity and standing without requiring '
   || 'the verifier to hold an account or the issuer to participate.',
   'The signing key is held in development key management, not a production HSM or KMS. Under '
   || 'Executive decision P2.1 the signing layer therefore claims no production-grade assurance, '
   || 'and every verification says so on its face. The Graduate Register remains the authoritative '
   || 'record until a production KMS is provisioned.');

-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_programme_claims_state ON programme_claims(state, sequence);

-- ─────────────────────────────────────────────────────────────────────
-- EXERCISE MATERIALS
--
-- Fifty practice stages across the programme hand the learner something:
-- "You are given 8 sentence pairs", "Sort 10 sentence prompts", "a
-- provided paragraph". Until this table existed, none of those things
-- did. The instruction was in the lesson and the material it referred
-- to was nowhere, which meant a learner working alone met a task they
-- could not start and a teacher had to invent the items before every
-- class.
--
-- APPROVAL IS PART OF THE RECORD, NOT A PROCESS AROUND IT.
-- These items are curriculum. They were drafted by the Press to fill a
-- gap the Press found, and the College has no appointed academic body
-- to approve them. So the approval state is a column: every set says
-- who drafted it and whether anyone with academic standing has signed
-- it off. Nothing prints as approved until something is.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exercise_sets (
  id                TEXT PRIMARY KEY,
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  -- Which stage of the lesson the set belongs to: 'guided',
  -- 'independent', 'homework', 'extension'.
  stage             TEXT NOT NULL,
  -- The instruction as the lesson states it, copied so that a set can
  -- be checked against the task it claims to serve.
  brief             TEXT NOT NULL,
  -- What the learner is handed: 'sentence_pairs', 'jumbled', 'cards',
  -- 'excerpts', 'gapped', 'matching', 'sorting'.
  kind              TEXT NOT NULL,
  approval_state    TEXT NOT NULL DEFAULT 'press_drafted'
                      CHECK (approval_state IN ('press_drafted','academically_approved')),
  drafted_by        TEXT NOT NULL DEFAULT 'WEC Press',
  approved_by       TEXT,
  approved_on       TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS exercise_items (
  id                TEXT PRIMARY KEY,
  exercise_set_id   TEXT NOT NULL REFERENCES exercise_sets(id),
  sequence          INTEGER NOT NULL,
  -- What the learner reads.
  prompt            TEXT NOT NULL,
  -- The expected answer where one exists. NULL where the task is open
  -- and a learner's own sentence is the answer -- never a placeholder.
  answer            TEXT,
  note              TEXT,
  UNIQUE (exercise_set_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_exercise_sets_item ON exercise_sets(learning_item_id);
CREATE INDEX IF NOT EXISTS idx_exercise_items_set ON exercise_items(exercise_set_id);

-- ─────────────────────────────────────────────────────────────────────
-- SELF-CHECKS
--
-- Every teaching lesson states what a learner can do by the end of it.
-- Until this table, no lesson gave the learner any way to find out
-- whether they could. The module quiz arrives ten lessons later, which
-- is where a learner discovers they misunderstood lesson three.
--
-- A self-check is not a quiz. It is three or four short prompts a
-- learner attempts alone, immediately, with the answer beside them —
-- and one of them is deliberately the thing learners get wrong.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS self_checks (
  id                TEXT PRIMARY KEY,
  learning_item_id  TEXT NOT NULL UNIQUE REFERENCES learning_items(id),
  -- What the learner is being asked to verify, in their own terms.
  intro             TEXT NOT NULL,
  approval_state    TEXT NOT NULL DEFAULT 'press_drafted'
                      CHECK (approval_state IN ('press_drafted','academically_approved')),
  drafted_by        TEXT NOT NULL DEFAULT 'WEC Press',
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS self_check_items (
  id                TEXT PRIMARY KEY,
  self_check_id     TEXT NOT NULL REFERENCES self_checks(id),
  sequence          INTEGER NOT NULL,
  prompt            TEXT NOT NULL,
  answer            TEXT NOT NULL,
  -- Where a prompt targets a known confusion, what the confusion is.
  -- NULL where none has been identified: never a guess.
  trap              TEXT,
  UNIQUE (self_check_id, sequence)
);

-- ─────────────────────────────────────────────────────────────────────
-- PEDAGOGICAL INTELLIGENCE
--
-- Seventeen fields per lesson, of which THREE can be derived from the
-- curriculum as it stands — prerequisite concepts, time required, and
-- concepts unlocked — and fourteen cannot. The fourteen are what a
-- teacher learns by teaching, and this College has taught nobody.
--
-- So the record exists with every underived field marked
-- 'not_yet_evidenced'. That is not a placeholder: it is the difference
-- between a curriculum that knows what it does not know and one that
-- fills the gap with plausible prose. When cohorts have been taught,
-- these fields fill with evidence. Until then the emptiness is the
-- honest reading, and it is queryable.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedagogy_records (
  id                TEXT PRIMARY KEY,
  learning_item_id  TEXT NOT NULL UNIQUE REFERENCES learning_items(id),
  field             TEXT NOT NULL,
  value             TEXT,
  evidence_state    TEXT NOT NULL DEFAULT 'not_yet_evidenced'
                      CHECK (evidence_state IN
                        ('derived_from_curriculum','observed_in_teaching','not_yet_evidenced')),
  source            TEXT
);

CREATE TABLE IF NOT EXISTS pedagogy_fields (
  key               TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  sequence          INTEGER NOT NULL,
  -- Can this field be derived from the curriculum, or must it be
  -- observed in a classroom?
  derivable         INTEGER NOT NULL DEFAULT 0,
  note              TEXT
);

CREATE TABLE IF NOT EXISTS pedagogy_entries (
  id                TEXT PRIMARY KEY,
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  field_key         TEXT NOT NULL REFERENCES pedagogy_fields(key),
  value             TEXT,

  -- ── FIVE KINDS OF KNOWLEDGE, AND WHY THE DISTINCTION IS THE POINT ──
  --
  -- This record was built with three states and 1,616 of 1,938 entries
  -- empty, on the reasoning that a teacher's knowledge comes from
  -- teaching and this College has taught nobody. That was right about
  -- one kind of knowledge and wrong about three others, and the
  -- conflation left the Teacher's Companion unbuildable for a reason
  -- that did not apply to most of what it would contain.
  --
  --   derived_from_curriculum — read off the programme itself. The
  --     prerequisite a lesson names, the minutes its stages declare,
  --     the confusion its own self-check trap identifies.
  --
  --   established_pedagogy — attested in the international teaching of
  --     English and not particular to this institution: that the
  --     third-person -s is among the most persistent errors for
  --     learners of every first language, that countability is
  --     arbitrary and must be memorised. Synthesis, not observation,
  --     and it must be marked as synthesis.
  --
  --   educational_expertise — a designed judgement by the people who
  --     wrote the curriculum: how else to explain this, what analogy
  --     holds, how to stretch a learner who has finished early. It is
  --     authored, defensible, and improvable by anyone who teaches it
  --     and finds better.
  --
  --   observed_in_teaching — what happened in a real room with real
  --     learners. CANNOT BE INVENTED. Nothing may carry this state
  --     until somebody teaches.
  --
  --   not_yet_evidenced — the honest empty. Kept, and still the right
  --     state for anything the four above cannot truthfully supply.
  --
  -- A reader must never mistake the second and third for the fourth,
  -- which is why they are separate values in a CHECK constraint rather
  -- than a note in a preface nobody reads.
  evidence_state    TEXT NOT NULL DEFAULT 'not_yet_evidenced'
                      CHECK (evidence_state IN
                        ('derived_from_curriculum','established_pedagogy',
                         'educational_expertise','observed_in_teaching','not_yet_evidenced')),
  source            TEXT,
  UNIQUE (learning_item_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_selfcheck_item ON self_checks(learning_item_id);
CREATE INDEX IF NOT EXISTS idx_pedagogy_item ON pedagogy_entries(learning_item_id);

-- ─────────────────────────────────────────────────────────────────────
-- VOCABULARY SETS
--
-- A lesson's VOCABULARY REINFORCEMENT stage is a good activity — "food
-- flashcard naming race", "family-tree labelling race" — and it names a
-- word set without listing it. That is correct for a lesson plan and
-- useless for a flashcard: the teacher running the race has to invent
-- the words, differently each time, which is the same failure the
-- supplied-material pass corrected in the practice stages.
--
-- So the words live here rather than being written into the stage. The
-- stage keeps its activity; the set carries what the activity needs.
--
-- Every headword carries an example sentence, because a card with a
-- word on one side and a translation on the other teaches a word out of
-- the only context that fixes it. `note` is present where English is
-- arbitrary — no article with country names, uncountable "hair" — and
-- NULL where it is not, rather than being filled with a guess.
--
-- Press-drafted like everything else authored here. `approval_state`
-- is a column, not a claim in a comment.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocabulary_sets (
  id                TEXT PRIMARY KEY,
  learning_item_id  TEXT NOT NULL UNIQUE REFERENCES learning_items(id),
  title             TEXT NOT NULL,
  -- What the lesson's own vocabulary stage does with this set, so the
  -- printed card pack and the classroom activity stay connected.
  activity          TEXT NOT NULL,
  approval_state    TEXT NOT NULL DEFAULT 'press_drafted'
                      CHECK (approval_state IN ('press_drafted','academically_approved'))
);

CREATE TABLE IF NOT EXISTS vocabulary_items (
  id                TEXT PRIMARY KEY,
  vocabulary_set_id TEXT NOT NULL REFERENCES vocabulary_sets(id),
  sequence          INTEGER NOT NULL,
  headword          TEXT NOT NULL,
  part_of_speech    TEXT NOT NULL CHECK (part_of_speech IN
                      ('noun','verb','adjective','adverb','phrase','preposition',
                       'determiner','pronoun','number')),
  -- A sentence the learner could say, at this level, using only
  -- language the lesson has taught.
  example           TEXT NOT NULL,
  -- Where English is arbitrary and must be learned rather than
  -- reasoned. NULL where there is nothing to warn about.
  note              TEXT,
  UNIQUE (vocabulary_set_id, headword)
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_set_item ON vocabulary_sets(learning_item_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_items_set ON vocabulary_items(vocabulary_set_id);

-- ─────────────────────────────────────────────────────────────────────
-- SOLO REINFORCEMENT ACTIVITIES
--
-- Most lessons in this programme are collaborative because their
-- objective is communicative: you cannot practise asking a stranger
-- their name without a stranger. That is pedagogy, not a defect, and
-- the Learning Architecture makes it explicit.
--
-- But a learner who misses a class, studies between sessions, or has no
-- partner tonight still needs something to do — and the danger is
-- obvious. A solo activity written to fill that gap quietly becomes the
-- lesson, the pair work is skipped, and a communicative curriculum
-- turns into a worksheet.
--
-- So the constraint is in the schema rather than in a style note.
-- Every solo activity MUST name the collaborative task it serves
-- (`serves_task`, NOT NULL) and MUST declare whether it PREPARES the
-- learner for that task or CONSOLIDATES it afterwards. There is no
-- third value. 'replaces' is not in the CHECK constraint and cannot be
-- inserted, which means the database itself refuses to store a solo
-- activity as a substitute for the collaborative task.
--
-- `check_yourself` is required for the same reason a self-check is: an
-- activity done alone with no way of knowing whether it was done right
-- teaches whatever the learner happened to do.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS solo_activities (
  id                TEXT PRIMARY KEY,
  learning_item_id  TEXT NOT NULL UNIQUE REFERENCES learning_items(id),
  -- Which stage of the lesson the collaborative task lives in.
  serves_stage      TEXT NOT NULL CHECK (serves_stage IN
                      ('guided','speaking','writing','listening','reading')),
  -- The task itself, named so a learner can see what they are working
  -- towards and a teacher can see what has NOT been done instead.
  serves_task       TEXT NOT NULL,
  -- Reinforcement, never replacement. Two values, and the third one
  -- everybody would reach for is deliberately absent.
  relation          TEXT NOT NULL CHECK (relation IN ('prepares','consolidates')),
  activity          TEXT NOT NULL,
  -- How the learner knows, alone, whether they did it right.
  check_yourself    TEXT NOT NULL,
  approval_state    TEXT NOT NULL DEFAULT 'press_drafted'
                      CHECK (approval_state IN ('press_drafted','academically_approved'))
);

CREATE INDEX IF NOT EXISTS idx_solo_activities_item ON solo_activities(learning_item_id);

-- ─────────────────────────────────────────────────────────────────────
-- LEARNING OUTCOMES
--
-- A learning outcome is a claim about what a learner can do. The
-- programme has had objectives — per lesson, written for the teacher —
-- since it was authored, and it has never had outcomes, which are a
-- different instrument: an objective says what a lesson intends, an
-- outcome says what the institution will stand behind.
--
-- The difference is enforced here rather than trusted. Every outcome
-- must name at least one ASSESSMENT that evidences it, through
-- learning_outcome_evidence. An outcome nothing assesses is a claim
-- nothing tests, and a programme full of those is a prospectus rather
-- than a curriculum.
--
-- `status` uses the same vocabulary as the competency mapping, for the
-- same reason: 'interim' is work done under authority delegated in the
-- absence of appointed members, and it is not 'approved'.
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_outcomes (
  id            TEXT PRIMARY KEY,
  -- 'level' outcomes are what the award stands behind; 'module'
  -- outcomes are what a module contributes to them.
  scope         TEXT NOT NULL CHECK (scope IN ('level','module')),
  level_roman   TEXT NOT NULL,
  unit_id       TEXT REFERENCES units(id),
  code          TEXT NOT NULL UNIQUE,
  sequence      INTEGER NOT NULL,
  -- Written in the form an outcome takes: the learner is the subject
  -- and the verb is something observable.
  statement     TEXT NOT NULL,
  -- The competency this outcome bears on. Every outcome belongs to one,
  -- so the framework and the outcomes cannot drift apart.
  competency_id TEXT NOT NULL REFERENCES competencies(id),
  -- For a level outcome, the module outcome it aggregates from is found
  -- through the evidence table rather than duplicated here.
  status        TEXT NOT NULL DEFAULT 'proposed'
                CHECK (status IN ('proposed','interim','approved','retired')),
  authority     TEXT REFERENCES academic_bodies(code),
  decided_on    TEXT,
  CHECK (scope = 'level' OR unit_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS learning_outcome_evidence (
  outcome_id       TEXT NOT NULL REFERENCES learning_outcomes(id),
  learning_item_id TEXT NOT NULL REFERENCES learning_items(id),
  -- What this assessment shows about this outcome. Not decoration: it
  -- is what an examiner reads when asked why this task counts.
  shows            TEXT NOT NULL,
  PRIMARY KEY (outcome_id, learning_item_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_outcomes_level ON learning_outcomes(level_roman, scope);
CREATE INDEX IF NOT EXISTS idx_outcome_evidence_item
  ON learning_outcome_evidence(learning_item_id);

-- ============================================================
-- 016 — THE SENATE IS CONSTITUTED
-- Mirrored from sql/migrations/016-senate-constituted.sql.
-- ============================================================
-- Constituted is not convened. A body with members CAN approve; it has
-- not necessarily approved anything. `members_appointed` alone cannot
-- express that distinction, and at nought members nobody noticed,
-- because at nought the two questions collapse into one. They separate
-- the moment anybody is appointed — so the event is recorded, not just
-- the number.
--
-- BASCE is deliberately absent. The roster attested on 14 August 2026
-- names no member of it, and reading the Board's Governor for Academic
-- Affairs as BASCE membership would convert thirty interim competency
-- mappings into approved ones on the strength of a job title.
--
-- The people are in docs/governance-register.md, not here. This table
-- records what a BODY did and when.
CREATE TABLE IF NOT EXISTS academic_body_events (
  id            TEXT PRIMARY KEY,
  body_code     TEXT NOT NULL REFERENCES academic_bodies(code),
  event         TEXT NOT NULL
                CHECK (event IN ('established','constituted','convened','dissolved')),
  occurred_on   TEXT NOT NULL,
  members_after INTEGER NOT NULL,
  authority     TEXT NOT NULL,
  note          TEXT NOT NULL,
  UNIQUE (body_code, event)
);

INSERT OR IGNORE INTO academic_body_events
  (id, body_code, event, occurred_on, members_after, authority, note)
SELECT 'abe_' || lower(code) || '_established', code, 'established', established_on, 0,
       'Founder, under delegated authority to the Press',
       'Body constituted on paper with no members appointed.'
FROM academic_bodies;

INSERT OR IGNORE INTO academic_body_events
  (id, body_code, event, occurred_on, members_after, authority, note)
VALUES
  ('abe_senate_constituted', 'SENATE', 'constituted', '2026-08-14', 3,
   'Board of Governors',
   'Three members appointed and attested by the College: Dean of Academic Affairs, '
   || 'Professor of English Language Education, Professor of Applied Linguistics. '
   || 'Named in docs/governance-register.md. The Senate has not yet convened, so the '
   || 'mappings and thresholds within its remit remain interim.');

UPDATE academic_bodies
   SET members_appointed = 3
 WHERE code = 'SENATE';

CREATE INDEX IF NOT EXISTS idx_academic_body_events
  ON academic_body_events(body_code, event);

-- ---------------------------------------------------------------------
-- THE EDITIONS REGISTER (migration 020)
--
-- The artifact-document half of the Verifiable Document Doctrine
-- (`SEB-D 47`). A person-document asks "did the College issue this, to
-- this person"; an edition asks "is this the genuine content, unaltered".
--
-- Every rendered edition already computes a Document ID — a digest over
-- the complete curriculum content — and prints it, with a QR, into the
-- physical book. Nothing recorded it, so that QR resolved to nothing:
-- a promise printed into a permanent object that the College could not
-- keep. This table is what makes it keepable.
--
-- `content_digest` is UNIQUE because the digest is what the edition IS;
-- two rows sharing one would mean the register held two answers for one
-- edition. A superseded edition STILL VERIFIES — a reader holding the
-- 2026 printing needs to know the College published it, not merely that
-- a later printing exists.
--
-- It proves content identity and nothing more: not authorship, and not
-- that a given physical copy came from the College.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS editions (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  document_id     TEXT NOT NULL UNIQUE,
  content_digest  TEXT NOT NULL UNIQUE
                  CHECK (length(content_digest) = 64),
  issue_code      TEXT NOT NULL,
  edition_name    TEXT,
  publication_id  TEXT,
  print_identifier TEXT,
  year            INTEGER,
  counts_json     TEXT,
  registrations_json TEXT,
  status          TEXT NOT NULL DEFAULT 'in-print'
                  CHECK (status IN ('in-print','superseded','withdrawn')),
  superseded_by   TEXT REFERENCES editions(id),
  withdrawn_at    TEXT,
  withdrawn_reason TEXT,
  registered_by   TEXT REFERENCES users(id),
  registered_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_editions_digest ON editions(content_digest);
-- ============================================================
-- 021 — WORLDWIDE ENGLISH QUALIFICATIONS (WEQ)
-- Mirrored from sql/migrations/021-weq-framework.sql, which carries the
-- full reasoning. This block must leave a fresh database in the same
-- state the migration leaves an existing one.
-- ============================================================
-- ============================================================
-- WHAT THE BOARD RESOLVED, AND WHAT IT SUPERSEDES
-- ============================================================
--
-- Governance C4 adopted a ladder of STANDING on 14 August 2026 —
-- Aspirant, Candidate, Associate, Envoy, Orator, Laureate, with
-- post-nominals ECIC–WEPC. It chose those words deliberately over
-- capability language, and its recorded reason was that standing
-- language does not date: "aspirant, candidate, associate, envoy,
-- orator and laureate will still be legible when everyone who founded
-- this College is dead."
--
-- The Executive Board has now resolved otherwise, and the reason is not
-- that the old argument was wrong. It is that the old architecture
-- answered the wrong question. A ladder of standing describes where a
-- learner stands INSIDE the College. It does not travel. A learner who
-- finishes the second stage and stops holds — under C4 — the standing of
-- an Higher Certificate in English Communication, which is legible
-- and honourable and means nothing whatever to an employer in Jakarta.
--
-- The Board's judgement is that a College whose learners are adults
-- paying their own money owes them something they can carry out of the
-- building. So the six become six QUALIFICATIONS, each complete in
-- itself, under one named framework:
--
--   Worldwide English Qualifications (WEQ)
--
-- This migration supersedes C4 in the register rather than erasing it.
-- The old architecture is kept, struck through, with the reasoning
-- intact, because a College that quietly rewrites its own decisions has
-- no decisions.
--
-- ============================================================
-- WHAT DID NOT CHANGE, AND MUST NOT
-- ============================================================
--
-- docs/weq-framework.md § I carries three rules. The Board changed the
-- vocabulary of the first and neither of the others:
--
--   1. These are the COLLEGE'S OWN qualifications. Not regulated
--      qualifications, not degrees, not professional-body grades, not
--      equivalent to any of those. The previous wording was "awards,
--      not qualifications", which was a true sentence defending the
--      right thing with the wrong word: any institution may award its
--      own qualifications, and the College does. What it may not do is
--      dress one as something a regulator issued. That prohibition is
--      unchanged and load-bearing.
--
--   2. CEFR-aligned and extended — never "above". The CEFR ends at C2.
--      The Mastery Stage maps to C2 and the framework carries the
--      broader achievement. Never "above the CEFR", "higher than C2",
--      "C3", "exceeds CEFR level".
--
--   3. No claim of accreditation or recognition. Nothing here is
--      accredited, recognised, validated or equivalent to anything.
--      Where standing must be described the sentence is: A QUALIFICATION
--      OF WORLDWIDE ENGLISH COLLEGE. That is complete and honourable.
--
-- Rule 3 is why this migration does not use the phrase "internationally
-- recognised", which the resolution's own draft reached for. Recognition
-- is a fact about other institutions, and no other institution has
-- recognised anything. What is true, and is what the column says, is
-- that the qualifications are aligned to an international reference
-- framework and describe internationally intelligible ability.
--
-- ============================================================
-- WHY THE COLUMNS AND NOT A DOCUMENT
-- ============================================================
--
-- Same reason as migration 014: a certificate, a transcript entry, a
-- verification page, the prospectus and the institutional API each have
-- to say what a qualification IS, and prose in six places is six
-- qualifications. tests/award-definitions.test.mjs binds every field
-- below to docs/weq-framework.md in both directions.
--
-- ============================================================
-- WHAT IS DELIBERATELY ABSENT
-- ============================================================
--
-- No per-qualification competency MAP. The Academic Framework requires
-- every assessment to map to at least one competency, the evidence
-- register carries that as CM-002, and the mapping is commissioned and
-- unstarted. The `competencies` column below says what each stage is
-- DESIGNED to develop, which is derivable from the curriculum. It does
-- not say which assessment evidences which competency, because nobody
-- has done that work and a plausible mapping is indistinguishable from
-- a real one.
--
-- No employer recognition, no graduate destinations, no salary claim.
-- The `workplace_readiness` column describes what a holder CAN DO at
-- work, derived from the outcomes. It does not describe what any
-- employer thinks, because no employer has been asked.

-- ---------------------------------------------------------------------
-- THE FRAMEWORK ITSELF, AS ONE ROW
-- ---------------------------------------------------------------------
-- One row, because there is one framework, and because every generator
-- that prints its name should read it from the same place. A framework
-- name that lives in forty template literals is forty names the day
-- somebody edits thirty-nine of them.
CREATE TABLE IF NOT EXISTS qualification_framework (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  abbreviation  TEXT NOT NULL UNIQUE,
  -- One sentence, for a reader who has never heard of the College.
  statement     TEXT NOT NULL,
  -- The public pathway, in the Board's own order. Stage names, not
  -- qualification names: the qualifications already contain the words
  -- Essential and Higher, and a pathway that repeated them would read
  -- as a list of products rather than a journey.
  pathway       TEXT NOT NULL,
  -- The limit, carried with the name so it cannot be dropped by a page
  -- that quotes one without the other.
  standing_note TEXT NOT NULL,
  adopted_on    TEXT NOT NULL,
  adopted_by    TEXT NOT NULL
);

INSERT OR IGNORE INTO qualification_framework
  (id, name, abbreviation, statement, pathway, standing_note, adopted_on, adopted_by) VALUES
  ('qf_weq', 'Worldwide English Qualifications', 'WEQ',
   'The framework under which Worldwide English College awards its own qualifications in English communication, from first contact with the language to full proficiency at the ceiling of the international reference framework.',
   'Foundation → Development → Application → Professional → Advanced → Mastery',
   'Every qualification in this framework is a qualification of Worldwide English College. None is accredited, recognised, validated or equivalent to any regulated qualification, and no external body has assessed them. The College says so on every page that names them.',
   '18 August 2026', 'the Executive Board');

-- ---------------------------------------------------------------------
-- THE SIX, EXTENDED
-- ---------------------------------------------------------------------
-- Added to award_definitions rather than placed in a second table: one
-- qualification is one row. A parallel table would be a second answer
-- to "what is the Professional Stage", which is the failure migration
-- 014 was written to prevent.
--
-- SQLite has no ADD COLUMN IF NOT EXISTS, and this file is applied by
-- scripts/migrate.mjs exactly once against a database whose probe index
-- is absent. The ALTERs are therefore unguarded on purpose; if you are
-- reading this because one failed, the probe at the top is wrong, not
-- the ALTERs.
ALTER TABLE award_definitions ADD COLUMN stage TEXT;
ALTER TABLE award_definitions ADD COLUMN award_code TEXT;
ALTER TABLE award_definitions ADD COLUMN exit_statement TEXT;
ALTER TABLE award_definitions ADD COLUMN competencies TEXT;
ALTER TABLE award_definitions ADD COLUMN academic_readiness TEXT;
ALTER TABLE award_definitions ADD COLUMN workplace_readiness TEXT;
ALTER TABLE award_definitions ADD COLUMN international_use TEXT;
ALTER TABLE award_definitions ADD COLUMN practical_applications TEXT;
ALTER TABLE award_definitions ADD COLUMN progression_requirement TEXT;
ALTER TABLE award_definitions ADD COLUMN assessment_framework TEXT;
ALTER TABLE award_definitions ADD COLUMN graduation_requirement TEXT;

-- ---------------------------------------------------------------------
-- THE SIX QUALIFICATIONS
-- ---------------------------------------------------------------------
-- learning_outcomes is NOT rewritten. It is transcribed from the
-- curriculum framework, the curriculum did not change, and rewriting it
-- to sound like the new names would have been the one edit here capable
-- of making the record describe a programme the College does not teach.
--
-- Everything else is written for the new architecture, because the old
-- text existed to justify words the Board has retired: "Aspirant
-- honours the decision" is not an argument for the Foundation Stage.

UPDATE award_definitions SET
  stage = 'Foundation',
  award_code = 'ECIC',
  official_title = 'Essential Certificate in English Communication',
  post_nominal = 'ECIC',
  standing = 'A complete qualification in essential English communication',
  academic_purpose =
    'names what it certifies and nothing else. A learner who arrives with no English and leaves able to introduce themselves, shop, ask directions, and understand slow clear speech has acquired the essential layer of a language — the layer everything else is built on and the layer most adult learners never reach, because beginning a language in adulthood is where most people stop. The word Essential is doing two jobs: it is the floor of the framework, and it is the part without which none of the rest functions.',
  exit_statement =
    'A learner may stop here. The Essential Certificate is not a receipt for a term of study; it certifies that its holder can operate in English in the situations ordinary life actually produces. Roughly a third of the people who begin a language never reach that point.',
  competencies =
    'Designed to develop: intelligible pronunciation of the sounds English uses and the stress patterns that carry meaning; a working core vocabulary of everyday objects, places, times and relationships; the present and simple past as usable systems rather than tables; and the confidence to speak while still getting it wrong, which is the competence the whole framework depends on and the one most adult beginners lack.',
  academic_readiness =
    'Ready to study in English at no academic level. This is stated plainly because it is what is true: the Foundation Stage prepares a learner for the Development Stage, not for a university seminar. Academic English begins at the Application Stage and is built deliberately from there.',
  workplace_readiness =
    'A holder can manage the English an ordinary workplace produces at its edges: greeting a visitor, taking a name and a number, following a short spoken instruction given slowly, reading a simple notice or form, writing a short message. They cannot yet hold a work conversation, and the College does not suggest otherwise.',
  international_use =
    'Aligned to CEFR A1, the first rung of the Common European Framework of Reference, which is the reference most institutions and employers outside the English-speaking world actually use. A1 is internationally intelligible as a description of ability. It is not a recognition of this qualification, and none is claimed.',
  practical_applications =
    'Travel and arrival: airports, hotels, transport, directions, shops, restaurants. First contact at work. Reading signage, menus, forms and short notices. Simple written messages. The English a person needs in the first week of being somewhere English is spoken.',
  progression_requirement =
    'Entry is open: the Foundation Stage assumes no prior English and no prior qualification. Progression to the Development Stage requires the Foundation Stage examination to be passed under the assessment framework below.',
  assessment_framework =
    'Nine module quizzes of ten questions each, one rubric-graded assignment per module against the published criteria, and one end-of-stage examination of twenty questions. Module quizzes pass at 70%. The examination passes at 70% overall with no single assessed criterion below 50%, so a learner cannot pass by being strong at one thing and absent at another. Two resits are permitted, no sooner than fourteen days apart; a third failure repeats the stage.',
  graduation_requirement =
    'All ten modules completed, all ten assignments submitted and graded, and the end-of-stage examination passed. Conferral is on the authority of the Registrar acting under an approved pass list, countersigned. No qualification in this framework has been conferred on anyone: the College has not yet appointed the External Examiner whose independent sign-off it requires before it will confer anything.'
WHERE level_id = 1;

UPDATE award_definitions SET
  stage = 'Development',
  award_code = 'HCIC',
  official_title = 'Higher Certificate in English Communication',
  post_nominal = 'HCIC',
  standing = 'A complete qualification in independent everyday English communication',
  academic_purpose =
    'marks the point at which a learner stops assembling phrases and starts using a language. The Development Stage is where survival English becomes independent English: describing what happened, saying what one thinks, making arrangements, handling the service conversation that goes wrong. Higher is used in its ordinary sense — the second certificate in a sequence of certificates — and the College notes plainly that in some national vocabularies a Higher Certificate sits above a Certificate. Here it does not; the order of this framework is the order of the stages, and every page that names a qualification names its stage beside it.',
  exit_statement =
    'A learner may stop here. The Higher Certificate certifies independence in the English of ordinary life: its holder can be left to manage a routine day in English without a translator and without rehearsal.',
  competencies =
    'Designed to develop: narrative — the ability to say what happened, in order, with the tenses that make sequence clear; opinion, with a reason attached; the social register of invitation, refusal, apology and suggestion; comparison; and the collocation strand, which is where a learner stops sounding assembled and starts sounding fluent.',
  academic_readiness =
    'Not yet ready for academic study in English. The Development Stage builds the everyday language that academic English will later be built on, and the College is explicit that these are different registers rather than more and less of the same one.',
  workplace_readiness =
    'A holder can hold a routine work conversation: describe what they did, explain a simple problem, take and pass on a message with detail in it, write a short connected email. They can work alongside English speakers on familiar tasks. They cannot yet argue a position, chair anything, or write to a client.',
  international_use =
    'Aligned to CEFR A2. A2 is the level most commonly named in international settings as the threshold of basic independent use, and is internationally intelligible as a description of ability. It is not a recognition of this qualification, and none is claimed.',
  practical_applications =
    'Daily working life in an English-speaking environment. Service and retail roles. Travel beyond the arrival week. Social English: making plans, telling a story, disagreeing pleasantly. Short written correspondence.',
  progression_requirement =
    'Entry requires the Essential Certificate, or placement at the equivalent standard through the College''s entry assessment. Progression to the Application Stage requires the Development Stage examination to be passed.',
  assessment_framework =
    'Nine module quizzes of ten questions, one rubric-graded assignment per module, and one end-of-stage examination of twenty questions. Quizzes pass at 70%; the examination at 70% overall with no assessed criterion below 50%. Two resits, fourteen days apart; a third failure repeats the stage.',
  graduation_requirement =
    'All ten modules completed, all ten assignments graded, and the end-of-stage examination passed. Conferral is by the Registrar under an approved and countersigned pass list. Nothing has been conferred: no External Examiner is yet appointed, and the College will not confer without one.'
WHERE level_id = 2;

UPDATE award_definitions SET
  stage = 'Application',
  award_code = 'CAEC',
  official_title = 'Certificate in Applied English Communication',
  post_nominal = 'CAEC',
  standing = 'A complete qualification in applied English for work and study',
  academic_purpose =
    'is the hinge of the framework, and Applied is the word that says so. Up to here the learner has been acquiring English. From here they are using it for something: structuring an argument, writing a paragraph that holds together, following a discussion on a subject they did not choose. Academic English begins at this stage, deliberately early, rather than being held back until a learner is nearly finished and has to learn a second register in a hurry.',
  exit_statement =
    'A learner may stop here, and many should. The Certificate in Applied English Communication certifies the standard most often asked for by employers hiring for English-using roles and by institutions admitting to foundation and pre-degree study: an independent user who can be given a task in English and produce something usable.',
  competencies =
    'Designed to develop: structured argument — a claim, a reason, an example, a conclusion; the paragraph as a single movement of thought; managing a conversation, including the clarifying question, which is the skill that separates a learner who copes from one who is stuck; reading for main idea against reading for detail; and the beginnings of register control between the spoken and the written.',
  academic_readiness =
    'Ready for foundation and pre-degree study taught in English, and for the reading load that comes with it. A holder can write a structured short essay, take usable notes from a lecture delivered in clear standard English, and ask a question in a seminar. Full undergraduate study normally expects the Professional Stage standard.',
  workplace_readiness =
    'A holder can work in English rather than merely alongside it: explain a process, give a structured opinion in a meeting, write a clear internal report or a customer-facing email, handle an unscripted call. This is the stage at which English stops limiting what work a person can be given.',
  international_use =
    'Aligned to CEFR B1, the level most widely cited internationally as the threshold of independent use and the most commonly specified minimum in workplace and study settings outside the English-speaking world. Internationally intelligible as a description of ability; not a recognition of this qualification, and none is claimed.',
  practical_applications =
    'Work in English-using roles. Foundation and pre-degree study. Structured writing: reports, summaries, short essays, professional correspondence. Meetings and discussion. Independent travel and residence.',
  progression_requirement =
    'Entry requires the Higher Certificate, or placement at the equivalent standard through the College''s entry assessment. An entry diagnostic is set at this stage and revisited within it, because this is where the register changes and a learner placed wrongly here will struggle for four months before anyone notices. Progression to the Professional Stage requires the Application Stage examination to be passed.',
  assessment_framework =
    'Nine module quizzes of ten questions, one rubric-graded assignment per module against criteria that now include discourse coherence and register, and one end-of-stage examination of twenty questions. Quizzes pass at 70%; the examination at 70% overall with no assessed criterion below 50%. Two resits, fourteen days apart; a third failure repeats the stage.',
  graduation_requirement =
    'All ten modules completed, all ten assignments graded, and the end-of-stage examination passed. Conferral is by the Registrar under an approved and countersigned pass list. Nothing has been conferred, and nothing will be until an External Examiner is appointed.'
WHERE level_id = 3;

UPDATE award_definitions SET
  stage = 'Professional',
  award_code = 'HCAEC',
  official_title = 'Higher Certificate in Applied English Communication',
  post_nominal = 'HCAEC',
  standing = 'A complete qualification in professional and academic English',
  academic_purpose =
    'certifies the standard at which a person can be sent — to the meeting, the client, the interview, the seminar — to speak for someone other than themselves. This is the heaviest step in the framework and the College says so rather than smoothing it: the jump in register and complexity between the Application and Professional Stages is larger than any other, and it is the stage learners most often need to repeat.',
  exit_statement =
    'A learner may stop here, and for most professional purposes this is the qualification to hold. The Higher Certificate in Applied English Communication certifies a user who can follow extended argument, hold their own in it, and produce written English that a professional reader will take seriously.',
  competencies =
    'Designed to develop: extended argument, held across several turns and several paragraphs; evidence — the difference between an assertion and a supported claim; the four-to-five paragraph essay with a thesis; negotiation and meeting behaviour; media literacy and critical reading, which is the competence that lets a holder tell a source from a claim; and professional register as a controlled choice rather than an accident.',
  academic_readiness =
    'Ready for undergraduate study taught in English. A holder can read at volume, write a structured essay with a defended thesis, participate in seminar discussion, and follow a lecture on an unfamiliar abstract subject. This is the standard universities normally describe when they ask for evidence of English.',
  workplace_readiness =
    'A holder can represent an employer in English: run a meeting, negotiate a straightforward agreement, present a position, write a report or proposal for an external reader, and interview or be interviewed. English is no longer a constraint on the seniority of the work.',
  international_use =
    'Aligned to CEFR B2, the level most frequently specified internationally for professional employment and for university admission. Internationally intelligible as a description of ability; not a recognition of this qualification, and none is claimed.',
  practical_applications =
    'Professional roles requiring English with external parties. Undergraduate study. Reports, proposals, presentations, negotiation. Interviews. Working across borders with colleagues who share no other language.',
  progression_requirement =
    'Entry requires the Certificate in Applied English Communication, or placement at the equivalent standard. An entry diagnostic is set and revisited, for the same reason as at the Application Stage and with more force, this being the largest step in the framework. Progression to the Advanced Stage requires the Professional Stage examination to be passed.',
  assessment_framework =
    'Nine module quizzes of ten questions, one rubric-graded assignment per module against criteria that now include evidence and argument quality, and one end-of-stage examination of twenty questions. Quizzes pass at 70%; the examination at 70% overall with no assessed criterion below 50%. Two resits, fourteen days apart; a third failure repeats the stage.',
  graduation_requirement =
    'All ten modules completed, all ten assignments graded, and the end-of-stage examination passed. Conferral is by the Registrar under an approved and countersigned pass list. Nothing has been conferred, and nothing will be until an External Examiner is appointed.'
WHERE level_id = 4;

UPDATE award_definitions SET
  stage = 'Advanced',
  award_code = 'ACEC',
  official_title = 'Advanced Certificate in English Communication',
  post_nominal = 'ACEC',
  standing = 'A complete qualification in advanced English across academic and professional contexts',
  academic_purpose =
    'certifies precision. Fluency was settled at the Professional Stage; the Advanced Stage is about control — of nuance, of implication, of register, of the difference between a sentence that is correct and one that is right. Advanced is used in its plain sense and is not a superlative: the framework has a stage above it.',
  exit_statement =
    'A learner may stop here. The Advanced Certificate certifies a user who reads what is implied as well as what is stated, and who writes with deliberate control of tone — the standard at which English becomes an instrument rather than a medium.',
  competencies =
    'Designed to develop: idiom and nuance, including what is meant but not said; style and voice as choices a writer makes; discourse analysis; research and presentation; leadership and persuasion; and cross-cultural communication, which at this level means anticipating how a thing will land somewhere else rather than translating it correctly.',
  academic_readiness =
    'Ready for postgraduate-level study and for extended independent written work taught in English. A holder can read demanding long-form texts, recognise implicit meaning and authorial position, and produce clear well-structured writing on complex subjects with controlled organisation and cohesion.',
  workplace_readiness =
    'A holder can lead in English: chair a difficult discussion, take a negotiation to a productive outcome, write for publication or for a senior external audience, and adjust register deliberately for the room. They can advocate a position professionally and be persuasive in doing it.',
  international_use =
    'Aligned to CEFR C1, the level associated internationally with proficient use in demanding academic and professional settings. Internationally intelligible as a description of ability; not a recognition of this qualification, and none is claimed.',
  practical_applications =
    'Senior professional communication. Postgraduate study. Public speaking and advocacy. Writing for external publication. Leading teams and negotiations across languages and cultures.',
  progression_requirement =
    'Entry requires the Higher Certificate in Applied English Communication, or placement at the equivalent standard. Progression to the Mastery Stage requires the Advanced Stage examination to be passed.',
  assessment_framework =
    'Nine module quizzes of ten questions, one rubric-graded assignment per module against criteria that now include rhetorical effectiveness, and one end-of-stage examination of twenty questions. Quizzes pass at 70%; the examination at 70% overall with no assessed criterion below 50%. Two resits, fourteen days apart; a third failure repeats the stage.',
  graduation_requirement =
    'All ten modules completed, all ten assignments graded, and the end-of-stage examination passed. Conferral is by the Registrar under an approved and countersigned pass list. Nothing has been conferred, and nothing will be until an External Examiner is appointed.'
WHERE level_id = 5;

UPDATE award_definitions SET
  stage = 'Mastery',
  award_code = 'WEPC',
  official_title = 'Worldwide English Proficiency Certificate',
  post_nominal = 'WEPC',
  standing = 'The College''s highest qualification: comprehensive proficiency in English',
  academic_purpose =
    'carries the College''s own name because it is the qualification the College is willing to be judged by. It does not say Certificate in something; it says proficiency, without qualification, because at this stage there is no remaining domain of English in which the holder is a learner. It is the only qualification in the framework named for the institution, and that is deliberate: a holder of the WEPC is presenting Worldwide English College''s judgement of them, not a module count.',
  exit_statement =
    'This is where the framework ends. The Worldwide English Proficiency Certificate is the completion of the Worldwide English Qualifications framework and the highest qualification the College awards.',
  competencies =
    'Designed to develop: command of English as a system rather than a skill — the ability to explain why a construction works, not only to use it; synthesis across sources; publication-quality written work; representation of an organisation at senior level; and the capacity to teach or mentor another learner''s English, which is the point at which a user demonstrably owns the language.',
  academic_readiness =
    'Ready for any study conducted in English, including doctoral work and independent research. A holder can understand with ease virtually everything read or heard, summarise from multiple sources reconstructing arguments coherently, and produce writing of publication standard.',
  workplace_readiness =
    'A holder can operate in English at any level an organisation contains: represent it publicly, write its external material, lead its negotiations, and develop the English of others within it. No workplace communication task is out of reach on grounds of language.',
  international_use =
    'Aligned to CEFR C2, the highest level of the Common European Framework of Reference. The CEFR ends at C2 and the College does not present anything above it: where more is wanted after the Mastery Stage it is a post-programme fellowship, not an invented rung. C2 is internationally intelligible as a description of ability. It is not a recognition of this qualification, and none is claimed.',
  practical_applications =
    'Senior and public-facing roles in English. Doctoral and research study. Publication. Teaching, coaching and mentoring English. Representing an organisation internationally at the level where the language is expected to be invisible.',
  progression_requirement =
    'Entry requires the Advanced Certificate in English Communication, or placement at the equivalent standard. There is no stage beyond this one.',
  assessment_framework =
    'Nine module quizzes of ten questions, one rubric-graded assignment per module against criteria that now include independent judgement, and a capstone Mastery Examination of twenty questions. Quizzes pass at 70%; the examination at 70% overall with no assessed criterion below 50%. Two resits, fourteen days apart; a third failure repeats the stage.',
  graduation_requirement =
    'All ten modules completed, all ten assignments graded, and the capstone examination passed, which completes the Worldwide English Qualifications framework in full. Conferral is by the Registrar under an approved and countersigned pass list. Nothing has been conferred, and nothing will be until an External Examiner is appointed.'
WHERE level_id = 6;

CREATE INDEX IF NOT EXISTS idx_award_definitions_stage ON award_definitions(stage);

-- ============================================================
-- 022 — THE SPEAKING ASSESSMENT FRAMEWORK
-- Mirrored from sql/migrations/022-speaking-assessment.sql, which
-- carries the full reasoning. This block must leave a fresh database in
-- the same state the migration leaves an existing one.
-- ============================================================
-- ============================================================
-- THE GAP THIS CLOSES
-- ============================================================
--
-- The College examines writing and comprehension. It has never once
-- heard a learner speak.
--
-- Sixty rubric-graded assignments, nine hundred quiz questions, six
-- examinations — and a candidate could hold the Worldwide English
-- Proficiency Certificate, the College's highest qualification in
-- English COMMUNICATION, without any person having listened to them say
-- a sentence. Every qualification descriptor claims spoken capability.
-- Not one of them evidenced it.
--
-- The gap was found by a commercial paper rather than an academic
-- review, which is worth recording: the Finance Committee, asked why a
-- premium price was not defensible, answered that the College sells
-- almost no human contact — and the missing contact turned out to be
-- missing assessment.
--
-- ============================================================
-- ONE STANDARD, TWO METHODS
-- ============================================================
--
-- The Board's direction is that a WEPC is a WEPC however it was taught.
-- So the criteria, the bands and the pass standard below are single and
-- shared. What differs is capture:
--
--   ASYNCHRONOUS. The candidate records against a released prompt and a
--   marker assesses the recording. Buildable today: learner_recordings
--   already carries media, duration, attempt, retention and a sha256,
--   and the recording upload path is tested end to end.
--
--   LIVE. The candidate speaks with an assessor in real time. Richer,
--   and the only way to assess genuine unrehearsed interaction — which
--   is why the INTERACTION criterion is capped for asynchronous capture
--   rather than pretended (see speaking_criteria.async_ceiling).
--
-- The method is recorded against the attempt, not against the
-- qualification, and it never appears on the certificate.
--
-- ============================================================
-- WHAT IS DELIBERATELY ABSENT
-- ============================================================
--
-- No automated scoring. Speech recognition can measure pronunciation
-- against a model; it cannot judge whether a candidate answered the
-- question. A framework that graded speaking by machine would be
-- claiming an academic judgement no machine has made.
--
-- No pass mark that a candidate can reach while unintelligible.
-- INTELLIGIBILITY carries a floor of its own, for the same reason the
-- examination has a per-criterion floor: a candidate who cannot be
-- understood has not demonstrated spoken English, whatever else they did
-- well.
--
-- Nothing is scheduled, delivered or conferred by this migration. It
-- defines the framework. tests/speaking-assessment.test.mjs holds it to
-- the qualification descriptors it must serve.

CREATE TABLE IF NOT EXISTS speaking_criteria (
  id            TEXT PRIMARY KEY,
  level_id      INTEGER NOT NULL REFERENCES programme_levels(id),
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  sequence      INTEGER NOT NULL,
  -- What this criterion looks like AT THIS STAGE. The criteria are
  -- constant across the framework so a reader can compare a Foundation
  -- candidate with a Mastery one on the same five dimensions; the
  -- descriptors are what rise.
  descriptor    TEXT NOT NULL,
  -- The highest band this criterion can honestly reach when the
  -- candidate is recorded rather than met.
  --
  -- Asynchronous capture cannot assess genuine interaction: a candidate
  -- speaking to a prompt is not taking a turn, cannot be interrupted,
  -- and has nothing to respond to that they did not already read. The
  -- College's options were to pretend otherwise, to drop the criterion,
  -- or to say plainly that this method reaches PROFICIENT and no
  -- further. It says so.
  --
  -- NULL means no ceiling: the criterion is fully assessable either way.
  -- A candidate assessed asynchronously is told this before they begin.
  async_ceiling TEXT REFERENCES skill_descriptors(code),
  UNIQUE (level_id, code)
);

CREATE TABLE IF NOT EXISTS speaking_assessments (
  id                  TEXT PRIMARY KEY,
  level_id            INTEGER NOT NULL REFERENCES programme_levels(id),
  occasion            TEXT NOT NULL CHECK (occasion IN ('midpoint','final')),
  title               TEXT NOT NULL,
  task                TEXT NOT NULL,
  -- Preparation is zero at Foundation on purpose: at A1 the assessment
  -- is of speech, not of memory, so the prompts are seen in advance and
  -- there is nothing to prepare in the room.
  preparation_minutes INTEGER NOT NULL,
  response_minutes    INTEGER NOT NULL,
  is_summative        INTEGER NOT NULL CHECK (is_summative IN (0,1)),
  -- Percentage of the qualification's final assessment. The midpoint
  -- carries none: it exists to tell a learner where they stand while
  -- there is still time to act on it.
  weight_percent      INTEGER NOT NULL,
  UNIQUE (level_id, occasion)
);

INSERT OR IGNORE INTO speaking_criteria
  (id, level_id, code, name, sequence, descriptor, async_ceiling) VALUES
  ('spc_1_intelligibility', 1, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Understood by a sympathetic listener used to non-native speech, in familiar topics, with repetition available.', NULL),
  ('spc_1_fluency', 1, 'FLUENCY', 'Fluency', 2, 'Speaks in short phrases with frequent pausing. Pausing to search for a word is expected at this stage and is not penalised.', NULL),
  ('spc_1_range', 1, 'RANGE', 'Range', 3, 'Deploys the present and simple past, everyday nouns and the module vocabulary. Errors are frequent and do not obscure meaning.', NULL),
  ('spc_1_interaction', 1, 'INTERACTION', 'Interaction', 4, 'Answers direct questions and asks simple ones. May need a question repeated.', 'PROFICIENT'),
  ('spc_1_appropriacy', 1, 'APPROPRIACY', 'Appropriacy', 5, 'Distinguishes a greeting from a request. Politeness is formulaic and that is correct at A1.', NULL),
  ('spc_2_intelligibility', 2, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Understood by a listener not used to non-native speech, in familiar topics.', NULL),
  ('spc_2_fluency', 2, 'FLUENCY', 'Fluency', 2, 'Sustains a short account with pausing at clause boundaries rather than mid-phrase.', NULL),
  ('spc_2_range', 2, 'RANGE', 'Range', 3, 'Narrates in past, present and future. Reaches for the right word and often finds it.', NULL),
  ('spc_2_interaction', 2, 'INTERACTION', 'Interaction', 4, 'Sustains a routine exchange, responds to a follow-up, and can ask for clarification.', 'PROFICIENT'),
  ('spc_2_appropriacy', 2, 'APPROPRIACY', 'Appropriacy', 5, 'Adjusts between a friend and a stranger. Can invite, refuse and apologise without giving offence.', NULL),
  ('spc_3_intelligibility', 3, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Understood without strain across familiar and some unfamiliar topics. Stress and rhythm carry meaning rather than obscuring it.', NULL),
  ('spc_3_fluency', 3, 'FLUENCY', 'Fluency', 2, 'Speaks at length on a prepared topic and copes with an unprepared one, with self-repair rather than collapse.', NULL),
  ('spc_3_range', 3, 'RANGE', 'Range', 3, 'Gives structured opinion with a reason and an example. Vocabulary begins to be chosen rather than retrieved.', NULL),
  ('spc_3_interaction', 3, 'INTERACTION', 'Interaction', 4, 'Manages the conversation: follows up, disagrees, and asks the clarifying question that keeps it moving.', 'PROFICIENT'),
  ('spc_3_appropriacy', 3, 'APPROPRIACY', 'Appropriacy', 5, 'Moves between spoken and more formal registers deliberately, if not yet precisely.', NULL),
  ('spc_4_intelligibility', 4, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Understood without strain on abstract topics. Pronunciation does not draw attention to itself.', NULL),
  ('spc_4_fluency', 4, 'FLUENCY', 'Fluency', 2, 'Sustains extended argument with the fluency that lets a listener attend to the content rather than the delivery.', NULL),
  ('spc_4_range', 4, 'RANGE', 'Range', 3, 'Weighs advantage against disadvantage, supports a claim with evidence, and controls the language of comparison and concession.', NULL),
  ('spc_4_interaction', 4, 'INTERACTION', 'Interaction', 4, 'Holds a position under challenge, concedes a point without losing the argument, and can chair a short discussion.', 'PROFICIENT'),
  ('spc_4_appropriacy', 4, 'APPROPRIACY', 'Appropriacy', 5, 'Speaks as a representative — to a client, an interviewer, a meeting — and sounds like one.', NULL),
  ('spc_5_intelligibility', 5, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Fully intelligible including at speed and under interruption.', NULL),
  ('spc_5_fluency', 5, 'FLUENCY', 'Fluency', 2, 'Spontaneous, with little obvious searching. Hesitation is rhetorical rather than lexical.', NULL),
  ('spc_5_range', 5, 'RANGE', 'Range', 3, 'Controls nuance, implication and idiom. Chooses between near-synonyms for effect.', NULL),
  ('spc_5_interaction', 5, 'INTERACTION', 'Interaction', 4, 'Leads a discussion or negotiation to an outcome, manages disagreement, and reads what is not said.', 'PROFICIENT'),
  ('spc_5_appropriacy', 5, 'APPROPRIACY', 'Appropriacy', 5, 'Adjusts register mid-utterance for a mixed audience, deliberately and without visible effort.', NULL),
  ('spc_6_intelligibility', 6, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Fully intelligible in any register, accent-neutral in the sense that accent never impedes.', NULL),
  ('spc_6_fluency', 6, 'FLUENCY', 'Fluency', 2, 'Indistinguishable from a highly educated speaker in ease and precision.', NULL),
  ('spc_6_range', 6, 'RANGE', 'Range', 3, 'Differentiates finer shades of meaning in complex situations; explains the language as a system, not only uses it.', NULL),
  ('spc_6_interaction', 6, 'INTERACTION', 'Interaction', 4, 'Represents an organisation at senior level; mentors another speaker; handles the hostile question.', 'PROFICIENT'),
  ('spc_6_appropriacy', 6, 'APPROPRIACY', 'Appropriacy', 5, 'Judges what a situation requires before speaking, including when not to.', NULL);

INSERT OR IGNORE INTO speaking_assessments
  (id, level_id, occasion, title, task, preparation_minutes, response_minutes, is_summative, weight_percent) VALUES
  ('spa_1_mid', 1, 'midpoint', 'A short guided exchange (formative)', 'Two everyday situations drawn from the modules studied — an introduction and a transaction. Prompts are seen in advance, because at A1 the assessment is of speech, not of memory.', 0, 4, 0, 0),
  ('spa_1_final', 1, 'final', 'A short guided exchange', 'Two everyday situations drawn from the modules studied — an introduction and a transaction. Prompts are seen in advance, because at A1 the assessment is of speech, not of memory.', 0, 4, 1, 20),
  ('spa_2_mid', 2, 'midpoint', 'An account and an exchange (formative)', 'Recount an event, then handle an unprepared follow-up. The follow-up is unseen.', 5, 5, 0, 0),
  ('spa_2_final', 2, 'final', 'An account and an exchange', 'Recount an event, then handle an unprepared follow-up. The follow-up is unseen.', 5, 5, 1, 20),
  ('spa_3_mid', 3, 'midpoint', 'An opinion, defended (formative)', 'State a position on a prepared topic, then answer two unseen challenges to it.', 10, 7, 0, 0),
  ('spa_3_final', 3, 'final', 'An opinion, defended', 'State a position on a prepared topic, then answer two unseen challenges to it.', 10, 7, 1, 20),
  ('spa_4_mid', 4, 'midpoint', 'A structured argument (formative)', 'Present a case for four minutes, then defend it under questioning. Preparation is fifteen minutes with notes permitted.', 15, 10, 0, 0),
  ('spa_4_final', 4, 'final', 'A structured argument', 'Present a case for four minutes, then defend it under questioning. Preparation is fifteen minutes with notes permitted.', 15, 10, 1, 20),
  ('spa_5_mid', 5, 'midpoint', 'A discussion led to an outcome (formative)', 'Take a discussion on an unfamiliar complex topic to a stated conclusion, managing disagreement.', 15, 12, 0, 0),
  ('spa_5_final', 5, 'final', 'A discussion led to an outcome', 'Take a discussion on an unfamiliar complex topic to a stated conclusion, managing disagreement.', 15, 12, 1, 20),
  ('spa_6_mid', 6, 'midpoint', 'A capstone address and defence (formative)', 'Speak for six minutes on a subject of the candidate''s choosing at professional standard, then defend it against expert questioning.', 20, 15, 0, 0),
  ('spa_6_final', 6, 'final', 'A capstone address and defence', 'Speak for six minutes on a subject of the candidate''s choosing at professional standard, then defend it against expert questioning.', 20, 15, 1, 20);

-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_speaking_criteria_level ON speaking_criteria(level_id);

-- ============================================================
-- 023 — THE ACADEMIC INTEGRITY PROCEDURE
-- Mirrored from sql/migrations/023-academic-integrity.sql, which carries
-- the full reasoning. This block must leave a fresh database in the same
-- state the migration leaves an existing one.
-- ============================================================
-- ============================================================
-- WHY THIS EXISTS NOW
-- ============================================================
--
-- Governance C9 was adopted on 14 August 2026 and required a procedure
-- covering what constitutes misconduct on an online language programme,
-- who investigates, the learner's right to respond before a finding, the
-- range of outcomes, and an appeal to someone not involved in the
-- original decision. Its rationale named the risk exactly: the platform
-- stores voice recordings and written submissions, which makes detection
-- possible and therefore makes the absence of a procedure a live risk
-- rather than a theoretical one.
--
-- The evidence register carried it as AI-001: "No procedure and no case
-- register." Both halves are answered here.
--
-- It became urgent this week. C9 names impersonation in a spoken
-- assessment as one of the two common cases, and until migration 022
-- there were no spoken assessments to be impersonated in. Building the
-- speaking framework created the risk the procedure was adopted to
-- manage, and leaving a four-day gap between them would have been a
-- choice rather than an oversight.
--
-- ============================================================
-- THE PROCEDURE IS IN THE SCHEMA, NOT ONLY IN THE DOCUMENT
-- ============================================================
--
-- A misconduct procedure that lives only in prose is a procedure that
-- gets skipped when somebody is in a hurry, and the finding that results
-- is indefensible — to the learner, to an appeal, and to any future
-- regulator reading the case file.
--
-- So the constraints below make an indefensible finding IMPOSSIBLE TO
-- RECORD rather than merely discouraged:
--
--   * a determination cannot exist unless the learner was notified;
--   * a determination cannot exist unless the learner had the chance to
--     respond — either they did, or the window closed;
--   * the person who opened a case may not determine it;
--   * an appeal may not be heard by the person who determined it;
--   * a case cannot be closed while an appeal is open.
--
-- Each of these is a CHECK. If the College ever wants to make a finding
-- without notifying the learner, it will have to alter its own schema to
-- do it, and that is a conversation somebody will have to have out loud.
--
-- ============================================================
-- WHAT IS DELIBERATELY ABSENT
-- ============================================================
--
-- No automated detection, and no similarity score. Text-matching
-- software reports overlap; it does not know whether a learner cheated,
-- and a case opened on a percentage is a case opened on nothing. Every
-- case here is opened by a named person who is willing to say why.
--
-- No penalty tariff. The outcomes are a vocabulary, not a sentencing
-- table. A first-year learner who quoted badly and a candidate who paid
-- someone to sit their speaking assessment are not on the same scale,
-- and a table that put them there would be doing the determining body's
-- job badly.
--
-- No cases. The register is empty because nothing has been taught,
-- nobody has been assessed, and no misconduct has occurred. An empty
-- case register is the honest state of this College today, and
-- tests/academic-integrity.test.mjs asserts it stays empty until there
-- is something real to record.

CREATE TABLE IF NOT EXISTS misconduct_categories (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sequence    INTEGER NOT NULL,
  -- What it is, in words a learner can understand, because the first
  -- reader of this is a person being accused of it.
  definition  TEXT NOT NULL,
  -- What the College would have to show. Written down so that an
  -- allegation nobody can evidence is visibly an allegation nobody can
  -- evidence.
  evidence_expected TEXT NOT NULL
);

INSERT OR IGNORE INTO misconduct_categories (code, name, sequence, definition, evidence_expected) VALUES
  ('NOT_OWN_WORK', 'Work that is not the learner''s own', 1,
   'Submitting written work produced by another person, by a service, or by a machine, and presenting it as your own. This includes work bought, commissioned, or generated on your behalf.',
   'The submission itself, and a stated reason for doubting authorship — a discontinuity in standard, a register the learner has not otherwise shown, or an admission. A similarity percentage is not on its own a reason.'),
  ('IMPERSONATION', 'Impersonation in an assessment', 2,
   'Another person taking an assessment in your place, or speaking in a recorded or live speaking assessment while it is presented as yours. Named in governance C9 as one of the two common cases on an online programme.',
   'The recording, and a comparison against other speech the College holds from the same learner. Where the assessment was live, the assessor''s account.'),
  ('COLLUSION', 'Collusion', 3,
   'Producing work jointly with another learner and submitting it as independent work. Studying together is encouraged; submitting together is not.',
   'The two submissions, and what they share that independent work would not.'),
  ('FABRICATION', 'Fabricated evidence', 4,
   'Inventing a source, a quotation, a datum or an experience in assessed work, or altering a document submitted to the College.',
   'The fabricated element, and what shows it to be fabricated.'),
  ('EXAM_MISCONDUCT', 'Examination misconduct', 5,
   'Using prohibited material during an examination, communicating with another person during it, or attempting to obtain the questions in advance.',
   'What was used or exchanged, and how it was observed.'),
  ('MISREPRESENTATION', 'Misrepresentation to the College', 6,
   'Giving false information in an application, a placement assessment, a claim for extenuating circumstances, or a request for a qualification to be reissued.',
   'The statement made and the fact contradicting it.');

CREATE TABLE IF NOT EXISTS misconduct_cases (
  id              TEXT PRIMARY KEY,      -- 'mis_' + uuid
  reference       TEXT NOT NULL UNIQUE,  -- the human reference: 'AI-2026-001'
  user_id         TEXT NOT NULL REFERENCES users(id),
  category        TEXT NOT NULL REFERENCES misconduct_categories(code),

  -- What work is in question. Exactly one should be set; a case about
  -- nothing in particular is not a case.
  learning_item_id TEXT REFERENCES learning_items(id),
  recording_id     TEXT REFERENCES learner_recordings(id),
  award_id         TEXT REFERENCES awards(id),

  stage           TEXT NOT NULL DEFAULT 'opened'
                  CHECK (stage IN ('opened','notified','response_received',
                                   'determined','appeal_open','appeal_determined','closed')),

  -- ---- Investigation -------------------------------------------------
  opened_by       TEXT NOT NULL REFERENCES users(id),
  opened_at       TEXT NOT NULL,
  allegation      TEXT NOT NULL,   -- what is alleged, in the opener's words

  -- ---- The learner's right to answer ---------------------------------
  -- C9: "the learner's right to respond before a finding". Not a
  -- courtesy — the constraint below makes a finding without it
  -- unrecordable.
  notified_at     TEXT,
  response_due    TEXT,
  response_at     TEXT,
  response        TEXT,

  -- ---- Determination -------------------------------------------------
  determined_by   TEXT REFERENCES users(id),
  determined_at   TEXT,
  outcome         TEXT CHECK (outcome IS NULL OR outcome IN
                    ('no_case_to_answer','warning','work_annulled',
                     'module_annulled','qualification_annulled','referred_to_senate')),
  reasons         TEXT,            -- why. Required with any outcome.

  -- ---- Appeal --------------------------------------------------------
  -- C9: "an appeal to someone not involved in the original decision."
  appeal_lodged_at   TEXT,
  appeal_heard_by    TEXT REFERENCES users(id),
  appeal_decided_at  TEXT,
  appeal_outcome     TEXT CHECK (appeal_outcome IS NULL OR appeal_outcome IN
                       ('upheld','overturned','varied')),
  appeal_reasons     TEXT,

  closed_at       TEXT,

  -- A case is about one piece of work.
  CHECK ((learning_item_id IS NOT NULL) + (recording_id IS NOT NULL) + (award_id IS NOT NULL) = 1),

  -- No finding without notice.
  CHECK (determined_at IS NULL OR notified_at IS NOT NULL),
  -- No finding until the learner has answered or the window has closed.
  CHECK (determined_at IS NULL OR response_at IS NOT NULL OR response_due IS NOT NULL),
  -- No finding without reasons. An outcome with no reasons cannot be appealed
  -- against, which makes the appeal right decorative.
  CHECK (outcome IS NULL OR (reasons IS NOT NULL AND determined_by IS NOT NULL)),
  -- The investigator does not judge their own case.
  CHECK (determined_by IS NULL OR determined_by <> opened_by),
  -- The appeal is not heard by the person appealed against.
  CHECK (appeal_heard_by IS NULL OR appeal_heard_by <> determined_by),
  -- An appeal decision needs someone to have heard it, and reasons.
  CHECK (appeal_outcome IS NULL OR (appeal_heard_by IS NOT NULL AND appeal_reasons IS NOT NULL)),
  -- A case cannot be closed while an appeal is outstanding.
  CHECK (closed_at IS NULL OR appeal_lodged_at IS NULL OR appeal_decided_at IS NOT NULL)
);

-- The audit trail. Append-only by convention and by the absence of any
-- update path: what happened, when, and who did it.
CREATE TABLE IF NOT EXISTS misconduct_case_events (
  id          TEXT PRIMARY KEY,
  case_id     TEXT NOT NULL REFERENCES misconduct_cases(id),
  event       TEXT NOT NULL,
  actor_id    TEXT REFERENCES users(id),
  note        TEXT,
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_misconduct_events_case ON misconduct_case_events(case_id);
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_misconduct_cases_user ON misconduct_cases(user_id);
