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
  -- The sitting's ORDINAL — 1, 2, 3 — assigned once at submission and
  -- never recomputed. `resit.attempts` allows three sittings and
  -- `resit.interval` requires fourteen days between them, and both are
  -- questions about a numbered attempt; ORDER BY submitted_at answers
  -- them only while every row survives, so a sitting voided for
  -- misconduct or struck out on appeal would silently renumber the rest
  -- and hand the learner a fourth attempt. See migration 021 and
  -- functions/_lib/academic/reassessment.js.
  attempt           INTEGER,
  submitted_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_item ON quiz_attempts(learning_item_id);
CREATE UNIQUE INDEX idx_quiz_attempts_attempt ON quiz_attempts(user_id, learning_item_id, attempt);

CREATE TABLE assignment_submissions (
  id                TEXT PRIMARY KEY,   -- 'asub_' + uuid
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  user_id           TEXT NOT NULL REFERENCES users(id),
  content           TEXT,               -- text submission, or a URL once file upload exists
  status            TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','graded','returned')),
  grade             REAL,
  feedback          TEXT,
  -- The sitting's ordinal, by the same rule as quiz_attempts.attempt.
  attempt           INTEGER,
  submitted_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  graded_at         TEXT,
  graded_by         TEXT REFERENCES users(id)
);
CREATE INDEX idx_assignment_submissions_user ON assignment_submissions(user_id);
CREATE INDEX idx_assignment_submissions_item ON assignment_submissions(learning_item_id);
CREATE UNIQUE INDEX idx_assignment_submissions_attempt ON assignment_submissions(user_id, learning_item_id, attempt);

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
  -- THE ADOPTED PASS MARK, as a fraction of one: 0.7 is seventy per
  -- cent. It is no longer "a mechanism default, not a published WEC-LC
  -- academic standard", which is what this comment said until
  -- 20 August 2026. data/academic-regulations.json § marking_scale
  -- adopted seventy as the pass mark, and marks.js carries it as
  -- SCALE.passMark.
  --
  -- WHAT READS IT, AND WHAT NO LONGER DOES.
  -- functions/_lib/lms/content.js used to apply this key as its own
  -- completion rule — either component reaching it completed a module,
  -- with no composite. It does not any more; module completion is
  -- marks.js's `module.formula` and this key decides nothing about it.
  -- What still reads the key is scripts/build-students.js, which prints
  -- the figure on /students/assessment/ and its Arabic edition at build
  -- time.
  --
  -- So this is a MIRROR of the instrument, kept in configuration so
  -- that changing the pass mark stays a recorded decision rather than a
  -- code edit. tests/academic-standing.test.mjs fails the build if this
  -- value and the instrument's ever disagree.
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
  ('chp_aspirant',  1, 'Aspirant Chapter',  'English Aspirant of Worldwide English College',  'ApWEC',
   'Holders of the Level I award, who entered the tradition.'),
  ('chp_candidate', 2, 'Candidate Chapter', 'English Candidate of Worldwide English College', 'CnWEC',
   'Holders of the Level II award.'),
  ('chp_associate', 3, 'Associate Chapter', 'English Associate of Worldwide English College', 'AsWEC',
   'Holders of the Level III award.'),
  ('chp_envoy',     4, 'Envoy Chapter',     'English Envoy of Worldwide English College',     'EnWEC',
   'Holders of the Level IV award — trusted representatives and communicators.'),
  ('chp_orator',    5, 'Orator Chapter',    'English Orator of Worldwide English College',    'OrWEC',
   'Holders of the Level V award — high-level intellectual and professional communicators.'),
  ('chp_laureate',  6, 'Laureate Chapter',  'English Laureate of Worldwide English College',  'LrWEC',
   'Holders of the Level VI award — distinguished masters of the programme.');

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
  (1, 'awd_def_aspirant', 'English Aspirant of Worldwide English College', 'ApWEC', 'A1', 'Entry into the tradition',
   'honours the decision, which at A1 is the achievement. Beginning a language in adulthood is harder than any later step and is where most people stop. Overclaims nothing.',
   'The learner arrives with little or no English. By the end of Foundation, they can introduce themselves, handle short everyday exchanges (shopping, ordering food, asking directions, basic scheduling), read and write short simple texts, and understand slow, clear speech on familiar topics.',
   'By the end of Level I, the learner can: introduce themselves and others; ask/answer simple personal questions; describe their home, family, and daily routine in simple sentences; make simple purchases and requests; tell the time and discuss simple schedules; ask for and give basic directions; write a short personal message or form; understand short, simple spoken instructions given slowly and clearly.'),
  (2, 'awd_def_candidate', 'English Candidate of Worldwide English College', 'CnWEC', 'A2', 'Recognised learner of the College',
   'formal admission to candidature. The moment the College recognises someone as its own.',
   'The learner builds from survival phrases to handling routine tasks and simple social exchange — describing experiences, expressing simple opinions, and managing everyday situations with more independence.',
   'By the end of Level II, the learner can: describe past experiences and events in simple terms; express likes, dislikes, and simple opinions; make and respond to invitations, suggestions, and apologies; describe future plans and intentions; compare people, places, and things; give simple reasons and explanations; handle simple phone/service conversations; write short connected texts (a short email, a simple description, a short story).'),
  (3, 'awd_def_associate', 'English Associate of Worldwide English College', 'AsWEC', 'B1', 'Established member of the academic community',
   'membership. Not "can do B1 things"; belongs. This is the point on the Ascent where a learner stops being someone taking a course and becomes a member of an academic community, and the word says exactly that.',
   'The learner becomes a genuinely independent user — coping with most travel/work/study situations, expressing and defending opinions, and beginning structured, purposeful writing. This is also where academic English begins, introduced deliberately early rather than left until Advanced.',
   'By the end of Level III, the learner can: describe experiences, hopes, and ambitions with reasons; give a structured opinion and respond to a counter-opinion; write a structured paragraph/short essay with a clear topic sentence; handle unscripted, moderately complex conversations on familiar and some unfamiliar topics; understand the main points of clear standard input on work, school, or leisure; produce simple connected text on familiar topics; ask clarifying questions to manage a conversation.'),
  (4, 'awd_def_envoy', 'English Envoy of Worldwide English College', 'EnWEC', 'B2', 'Trusted representative and communicator',
   'one who can be sent: to the meeting, the client, the interview, to speak for someone other than themselves. B2 is precisely the representation threshold, and representation is what an employer is buying.',
   'The learner becomes fluent enough to follow extended discourse, argue a position in depth, and produce genuinely structured academic and professional writing. This level carries the heaviest step-up in register and complexity in the programme.',
   'By the end of Level IV, the learner can: understand extended speech and complex argumentation on familiar and abstract topics; interact with a degree of fluency that makes regular interaction with native speakers possible without strain on either party; produce clear, detailed text on a wide range of subjects; explain a viewpoint, weighing advantages/disadvantages; write a structured 4-5 paragraph essay with a clear thesis and evidence; participate in a structured meeting/seminar-style discussion; write a professional email/report in an appropriate register.'),
  (5, 'awd_def_orator', 'English Orator of Worldwide English College', 'OrWEC', 'C1', 'High-level intellectual and professional communicator',
   'composition and delivery: clear, structured argument on complex subjects, delivered fluently. That is oratory in the classical sense, and C1 is where the leadership and executive-communication strands become the substance of the award rather than an addition to it. Chosen over Scholar, which implies research and carries a funding connotation ("a scholar" is often someone with a scholarship).',
   'The learner refines fluency into precision — flexible, effective language use for social, academic, and professional purposes, including implicit meaning, nuance, and stylistic control.',
   'By the end of Level V, the learner can: understand a wide range of demanding, longer texts and recognise implicit meaning; express ideas fluently and spontaneously without much obvious searching for expression; use language flexibly and effectively for social, academic, and professional purposes; produce clear, well-structured, detailed text on complex subjects, controlling organisational patterns and cohesive devices; understand and produce nuanced, idiomatic, register-appropriate language; lead a discussion or negotiation to a productive outcome.'),
  (6, 'awd_def_laureate', 'English Laureate of Worldwide English College', 'LrWEC', 'C2', 'Distinguished master of the programme',
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
   || 'normalised to the WEC-LC rubric policy — not auto-scored. Spoken work is captured as '
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

-- ============================================================
-- 020 — THE INSTITUTION'S WORKING DAY
-- Mirrored from sql/migrations/020-institution.sql.
-- ============================================================
-- Seventy-six tables above could describe a curriculum, mark it, confer
-- an award for it and let a stranger verify the award. None of them
-- could answer a question a learner asks in their first week: what did
-- the College say to me, when can I speak to a tutor, who hears me if I
-- think a mark is wrong, am I on track, and when do I graduate.
--
-- The migration this mirrors carries the measured evidence for each gap
-- and the governance decisions the shapes below are taken from —
-- principally A7 (attendance, adopted 14 August 2026, with the
-- live-session/module-engagement question left OPEN and carried here in
-- `attendance_records.basis`) and E2 (complaints and appeals, adopted
-- 17 August 2026, whose three stages and working-day clock are the whole
-- shape of `registrar_cases`).
--
-- Nothing here is seeded. Milestones, orientation steps and graduation
-- ceremonies are institutional decisions, and the tables ship empty for
-- the same reason the competency mapping did.

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

  -- The College publishes honours first and a grade point average
  -- second. A four-point scale WAS adopted on 20 August 2026 — see
  -- data/academic-regulations.json § classification — so both columns
  -- are now written, `grade_scale` holding 'WEC 4.00', by
  -- functions/_lib/academic/standing.js for a learner who holds an
  -- award. They stay NULL for everyone else, and that is the whole
  -- point of them being nullable: a learner the College has certified
  -- nothing about has no average, and 0.00 would say the opposite.
  --
  -- `grade_scale` is required alongside a figure (the CHECK below), so
  -- a number can never outlive the scale that gives it meaning. This
  -- comment previously said no scale had been adopted and that both
  -- columns stayed NULL; that was true when it was written and stopped
  -- being true the day the scale was adopted.
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
