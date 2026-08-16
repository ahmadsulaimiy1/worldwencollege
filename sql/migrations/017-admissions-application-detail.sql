-- 017 · The application form asks more than five questions
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_applications_country'
--
-- The probe reads sqlite_master rather than the columns this file adds:
-- a probe that selects a column throws on every database where the
-- migration has not run, which is every database the probe exists to
-- ask about. The index is created LAST, so an interrupted run leaves the
-- probe unsatisfied and the runner retries — see scripts/migrate.mjs.
--
-- WHY THIS MIGRATION EXISTS
--
-- `applications` held full_name, email, country, a self-assessed level
-- and a source. That is enough to record that somebody applied; it is
-- not enough to admit them, and it is not enough to answer the first
-- three questions Admissions asks in reply — where are you, what are
-- you for, and who is paying.
--
-- Every column below is a question the application form now asks. The
-- rule applied when choosing them: a field earns its place only if the
-- College would otherwise have to email the applicant to ask it. Nothing
-- here is collected because it is interesting.
--
-- WHAT IS DELIBERATELY NOT COLLECTED
--
--   · Date of birth. The College admits adults, and the thing it needs
--     to know is whether the applicant is one — not their birthday.
--     `is_adult` answers the question without holding a date that would
--     make this table a richer target than it needs to be.
--   · Passport or ID number. Nothing at application stage needs it.
--     Immigration documentation belongs to the residency process, after
--     an offer, and to the Home Office rather than to this table.
--   · Payment details of any kind. Those belong to the payments
--     provider and must never reach this database.
--
-- Every column is NULLABLE. The form asks these questions; it does not
-- refuse an application that declines to answer one, and a schema that
-- required them would turn an optional question into a locked door.

ALTER TABLE applications ADD COLUMN phone            TEXT;
ALTER TABLE applications ADD COLUMN city             TEXT;
-- Nationality is NOT country of residence, and conflating them is the
-- commonest fault in an international admissions form. A learner living
-- in the Gulf on a Pakistani passport has one immigration position and
-- a learner living there on an Emirati one has another — and the
-- residency period's length follows exactly that distinction.
ALTER TABLE applications ADD COLUMN nationality      TEXT;   -- ISO 3166-1 alpha-2
ALTER TABLE applications ADD COLUMN is_adult         INTEGER;-- 1 = confirmed 18+
-- What the English is FOR. It does not change the pathway — the College
-- teaches one — but it changes which strand a tutor leans on, and it is
-- the single most useful sentence Admissions can read before replying.
ALTER TABLE applications ADD COLUMN purpose          TEXT
  CHECK (purpose IS NULL OR purpose IN
    ('university','career','government','examination','business','personal'));
-- When they intend to begin. Admission is continuous, so this is a
-- planning signal rather than an intake slot.
ALTER TABLE applications ADD COLUMN start_preference TEXT
  CHECK (start_preference IS NULL OR start_preference IN
    ('immediately','within_3_months','within_6_months','undecided'));
-- The residency that closes the pathway: their own city under
-- supervision, or the United Kingdom. Asked at application because it
-- is the answer that most changes what Admissions must explain back.
ALTER TABLE applications ADD COLUMN residency_interest TEXT
  CHECK (residency_interest IS NULL OR residency_interest IN
    ('own_city','uk_london','uk_manchester','uk_other','undecided'));
-- WHO PAYS is a tuition question, and it belongs on the application
-- rather than after an offer: an employer-sponsored applicant needs an
-- invoice and a purchase order, and discovering that at the payment
-- step has already cost the College a week.
ALTER TABLE applications ADD COLUMN funding          TEXT
  CHECK (funding IS NULL OR funding IN
    ('self','employer','family','scholarship','government','undecided'));
ALTER TABLE applications ADD COLUMN payment_plan     TEXT
  CHECK (payment_plan IS NULL OR payment_plan IN
    ('level_by_level','instalments','full_pathway','undecided'));
ALTER TABLE applications ADD COLUMN heard_via        TEXT;
-- The consent record. Not a checkbox that is forgotten the moment it is
-- ticked: the timestamp is what makes it evidence, and a privacy notice
-- the College cannot show it obtained agreement to is not a consent.
ALTER TABLE applications ADD COLUMN privacy_agreed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_applications_country ON applications(country);
