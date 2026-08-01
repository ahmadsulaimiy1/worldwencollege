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
-- Identity — mirrors the auth provider (Clerk today), never the source
-- of truth for credentials. See docs/auth-architecture.md.
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                TEXT PRIMARY KEY,            -- our id, e.g. 'usr_' + uuid
  auth_provider     TEXT NOT NULL DEFAULT 'clerk',
  auth_provider_id  TEXT NOT NULL,               -- Clerk user id (sub claim)
  email             TEXT NOT NULL,
  email_verified    INTEGER NOT NULL DEFAULT 0,  -- 0/1
  role              TEXT NOT NULL DEFAULT 'student', -- student | staff | admin
  preferred_name    TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en', -- en | ar
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(auth_provider, auth_provider_id)
);
CREATE INDEX idx_users_email ON users(email);

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
  status            TEXT NOT NULL DEFAULT 'submitted',
                    -- submitted | placement_pending | offer_sent | accepted | enrolled | withdrawn | rejected
  source            TEXT NOT NULL DEFAULT 'website', -- website | manual_bridge | referral
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
  status            TEXT NOT NULL DEFAULT 'pending_payment',
                    -- pending_payment | active | completed | withdrawn
  started_at        TEXT,
  completed_at      TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_enrolments_user ON enrolments(user_id);

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
-- Discounts & promo codes — schema-ready; endpoint not yet implemented
-- (see docs/payments-architecture.md § Not Yet Implemented).
-- ---------------------------------------------------------------------
CREATE TABLE promo_codes (
  code              TEXT PRIMARY KEY,
  kind              TEXT NOT NULL,      -- 'percent' | 'fixed_amount'
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
  kind              TEXT NOT NULL,      -- 'percent' | 'fixed_amount' | 'full'
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
  status            TEXT NOT NULL DEFAULT 'unclaimed' -- unclaimed | claimed | revoked
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
  status            TEXT NOT NULL DEFAULT 'active' -- active | completed | defaulted | cancelled
);

CREATE TABLE payments (
  id                TEXT PRIMARY KEY,   -- 'pay_' + uuid — OUR id, referenced everywhere internally
  user_id           TEXT NOT NULL REFERENCES users(id),
  enrolment_id      TEXT REFERENCES enrolments(id),
  corporate_account_id TEXT REFERENCES corporate_accounts(id), -- set for corporate-invoiced payments
  kind              TEXT NOT NULL,      -- 'full_programme' | 'single_level' | 'instalment'
  level_id          INTEGER REFERENCES programme_levels(id), -- NULL for full-programme payments
  instalment_plan_id TEXT REFERENCES instalment_plans(id),
  amount_cents      INTEGER NOT NULL,   -- in `currency`'s minor unit
  currency          TEXT NOT NULL REFERENCES currencies(code),
  amount_usd_cents  INTEGER NOT NULL,   -- normalised, for reporting/reconciliation across currencies
  promo_code        TEXT REFERENCES promo_codes(code),
  scholarship_id    TEXT REFERENCES scholarships(id),
  provider          TEXT NOT NULL,      -- 'stripe' | 'paystack' | 'flutterwave' | 'opay'
  provider_ref      TEXT,               -- the gateway's own charge/session id
  status            TEXT NOT NULL DEFAULT 'pending',
                    -- pending | processing | succeeded | failed | refunded | partially_refunded
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
  processed_at      TEXT,
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
  pdf_url           TEXT                  -- set once a PDF-generation step exists
);

CREATE TABLE refunds (
  id                TEXT PRIMARY KEY,
  payment_id        TEXT NOT NULL REFERENCES payments(id),
  amount_cents      INTEGER NOT NULL,
  reason            TEXT NOT NULL,
  approved_by       TEXT,               -- staff user id — refunds need a named approver, not self-service
  status            TEXT NOT NULL DEFAULT 'requested', -- requested | approved | processed | rejected
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
  channel           TEXT NOT NULL,      -- 'email' | 'sms'
  provider          TEXT NOT NULL,
  provider_ref      TEXT,
  status            TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

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
