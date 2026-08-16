-- 018 · The application becomes a wizard, not a single form
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_application_drafts_user'
--
-- The probe reads sqlite_master rather than the table it creates or the
-- columns this file adds: a probe that selects from either throws on
-- every database where the migration has not run, which is every
-- database the probe exists to ask about. The index on application_drafts
-- is created LAST, so an interrupted run leaves the probe unsatisfied
-- and the runner retries — see scripts/migrate.mjs.
--
-- WHY THIS MIGRATION EXISTS
--
-- The public admissions form was one page, filled in and submitted in
-- one motion. Nothing carried a step across a visit: close the tab
-- halfway through and the work was gone. This migration adds a place
-- for that in-progress work to live, and a small number of further
-- questions a serious multi-step process reasonably asks — an
-- emergency contact, prior education, who is actually sponsoring
-- tuition when it is not the applicant themself.
--
-- WHAT IS STILL DELIBERATELY NOT COLLECTED
--
-- Migration 017 already declined date of birth and passport/ID number,
-- and the reasoning holds without change here: nothing at APPLICATION
-- stage needs an applicant's birthday or passport number, and holding
-- either turns this table into a richer target than it needs to be for
-- no compensating benefit — no licensed identity-verification provider
-- reads either field, so collecting them here would be data held for
-- its own sake. That documentation belongs to the residency process,
-- after an offer, not to a form anyone can fill in before the College
-- has decided anything. If a later phase adds a genuine post-offer
-- identity/visa-document step, it is a new table with its own migration
-- and its own stated retention terms — not a quiet extension of this
-- one.
--
-- THE DRAFT TABLE
--
-- application_drafts holds ONE row per applicant account, addressed by
-- user_id rather than by application id, because a draft exists before
-- an application does. `data` is a JSON blob rather than typed columns:
-- while the wizard is in progress the record is provisional by
-- definition (a step can be revisited, a field can be blanked and
-- retyped), and typed columns would mean this migration and the next
-- one after it fighting the same "is a half-finished value allowed
-- here" question the applications table already settled properly with
-- NULLable, CHECK-constrained columns. The draft is promoted into a
-- real `applications` row — typed, constrained, queryable — only at
-- final submission, exactly as today's single-step form already does;
-- see functions/api/admissions/apply.js. `completed_steps` is a JSON
-- array of step keys, read by the applicant's own dashboard to show
-- progress; it is advisory or the wizard's own bookkeeping, not a gate
-- enforced server-side against parts of the payload.

ALTER TABLE applications ADD COLUMN residential_address TEXT;
ALTER TABLE applications ADD COLUMN emergency_contact_name TEXT;
ALTER TABLE applications ADD COLUMN emergency_contact_relationship TEXT;
ALTER TABLE applications ADD COLUMN emergency_contact_phone TEXT;
-- What the applicant has already completed, not what a certificate
-- will later rest on — no verification of a claimed qualification
-- happens at application stage, so this is background for Admissions
-- and for placement guidance, not evidence of anything.
ALTER TABLE applications ADD COLUMN education_level TEXT
  CHECK (education_level IS NULL OR education_level IN
    ('secondary','undergraduate','postgraduate','doctorate','professional','other'));
ALTER TABLE applications ADD COLUMN education_institution TEXT;
-- Mirrors the reasoning already given for `funding` in migration 017:
-- an employer- or family-sponsored applicant needs an invoice or a
-- named contact, and discovering that after an offer has already cost
-- the College a week. NULL unless funding is not 'self'.
ALTER TABLE applications ADD COLUMN sponsor_name TEXT;
ALTER TABLE applications ADD COLUMN sponsor_relationship TEXT
  CHECK (sponsor_relationship IS NULL OR sponsor_relationship IN
    ('employer','parent_or_guardian','other_family','scholarship_body','government','other'));

CREATE TABLE application_drafts (
  id                        TEXT PRIMARY KEY,      -- 'draft_' + uuid
  user_id                   TEXT NOT NULL UNIQUE REFERENCES users(id),
  data                      TEXT NOT NULL DEFAULT '{}',  -- JSON: every field collected so far, by key
  completed_steps           TEXT NOT NULL DEFAULT '[]',  -- JSON array of step keys
  submitted_application_id  TEXT REFERENCES applications(id), -- set once promoted; draft is kept, not deleted
  created_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at                TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_application_drafts_user ON application_drafts(user_id);
