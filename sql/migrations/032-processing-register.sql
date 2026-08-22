-- Migration 032 — the record of processing activities.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_processing_tables'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS EXISTS
-- ============================================================
--
-- Forty-two tables in this schema hold personal data. Among them:
-- passport numbers, residential addresses, emergency contacts,
-- scans of identity documents, portrait photographs, and recordings of
-- learners' voices.
--
-- The College has adopted retention and erasure decisions (D1, D2, D3)
-- and has published no privacy notice. A data subject cannot exercise a
-- right they have never been told they have, and an institution that
-- cannot list what it holds cannot honestly answer a subject access
-- request, a regulator, or a sponsor's due diligence.
--
-- This is the list. It is the thing a privacy notice is written FROM,
-- and it is deliberately built before the notice, because a notice
-- written from memory describes the College somebody imagines rather
-- than the one that exists.
--
-- ============================================================
-- WHAT IS FACTUAL HERE AND WHAT IS NOT
-- ============================================================
--
-- FACTUAL, and therefore recorded: what data exists, which tables hold
-- it, why the platform collects it, who else sees it, and — where a
-- decision exists — how long it is kept. All of that is readable from
-- the code and the decisions register.
--
-- NOT FACTUAL, and therefore NOT recorded: the lawful basis for each
-- activity. That is a legal determination about a real institution in a
-- real jurisdiction, and the College's own legal status is not yet
-- settled. Every row carries `lawful_basis = 'NOT DETERMINED'`, and the
-- schema refuses to let an activity be published while any basis is
-- undetermined.
--
-- Board Paper 02 puts the four decisions this needs in front of the
-- Board. Until they are taken, this register is internal: complete
-- enough to answer "what do you hold", not complete enough to publish
-- as a privacy notice, and it says which of those it is.
--
-- ============================================================
-- THE GUARDRAIL
-- ============================================================
--
-- tests/processing-register.test.mjs reads the schema, finds every
-- table with a personal-data-shaped column, and requires each one to be
-- either covered by an activity below or listed as an explicit
-- exclusion with a reason. A new table holding personal data cannot be
-- added without describing what the College does with it.
--
-- That is the part that lasts. The inventory is a snapshot; the rule
-- that the inventory must stay complete is the institution.

CREATE TABLE IF NOT EXISTS processing_activities (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  sequence      INTEGER NOT NULL,

  -- What is held, in words a learner would recognise.
  data_categories TEXT NOT NULL,
  -- Which tables. Comma-separated; the test binds every name here to a
  -- real table, so a rename cannot quietly orphan a description.
  source_tables TEXT NOT NULL,
  -- Why the platform collects it. Factual: readable from the code.
  purpose       TEXT NOT NULL,
  -- Who else sees it. Factual: the processors actually in the stack.
  recipients    TEXT NOT NULL,
  -- How long, where a decision exists. 'NOT DETERMINED' otherwise.
  retention     TEXT NOT NULL,

  -- A legal determination, not an engineering one.
  lawful_basis  TEXT NOT NULL DEFAULT 'NOT DETERMINED',

  -- Identity documents, voice recordings and photographs carry more
  -- risk than a module completion, and a register that flattened that
  -- would be useless for deciding what to protect hardest.
  higher_risk   INTEGER NOT NULL DEFAULT 0 CHECK (higher_risk IN (0, 1)),

  status        TEXT NOT NULL DEFAULT 'internal' CHECK (status IN ('internal','published')),

  CHECK (TRIM(data_categories) <> '' AND TRIM(purpose) <> '' AND TRIM(recipients) <> ''),
  -- Nothing is published as a privacy notice while its lawful basis is
  -- undetermined. A notice that cannot say why it is allowed to hold
  -- your passport number is not a notice.
  CHECK (status <> 'published' OR lawful_basis <> 'NOT DETERMINED')
);

-- Tables that LOOK like they hold personal data and do not. Recorded
-- with a reason rather than pattern-matched away, because "we decided
-- this one is fine" is exactly the judgement that should be written
-- down and re-read.
CREATE TABLE IF NOT EXISTS processing_exclusions (
  table_name    TEXT PRIMARY KEY,
  reason        TEXT NOT NULL,
  CHECK (TRIM(reason) <> '')
);

INSERT OR IGNORE INTO processing_activities
  (code, name, sequence, data_categories, source_tables, purpose, recipients, retention, higher_risk) VALUES
  ('ACCOUNT', 'Account and access', 1,
   'Email address, preferred name, role, and the history of role changes.',
   'users,role_events',
   'To let a person sign in, to show them their own record and nobody else''s, and to keep an attributable history of who was given which powers and when.',
   'Clerk (authentication); Cloudflare (hosting and database).',
   'NOT DETERMINED', 0),
  ('ADMISSIONS', 'Applications and identity', 2,
   'Full name, email, telephone, country, nationality, residential address, emergency contact, sponsor, passport number, and scans of identity documents.',
   'applications,application_drafts,kyc_documents',
   'To decide an application, to place the applicant at the right level, and — where the applicant chooses to supply them — to hold identity documents. Uploading a document is not the same as verifying one: nothing here checks a document against a real identity.',
   'Cloudflare (hosting, database, and private object storage for documents); Resend (application acknowledgement email).',
   'NOT DETERMINED', 1),
  ('ENROLMENT', 'Enrolment', 3,
   'Which levels a learner is enrolled on, their status, and the history of changes to it.',
   'enrolments,enrolment_events,corporate_seats',
   'To give a learner access to the programme they enrolled on, and to keep an attributable record of every change to that enrolment.',
   'Cloudflare (hosting and database).',
   'NOT DETERMINED', 0),
  ('LEARNING', 'Study activity', 4,
   'Modules completed, quiz attempts and scores, submitted assignments and their marks, time spent studying, and attendance at live sessions.',
   'unit_progress,quiz_attempts,assignment_submissions,time_on_task,session_attendance',
   'To teach: to show a learner where they are, to mark their work, and to notice when somebody has stopped so that they can be offered help rather than found at the end of the level.',
   'Cloudflare (hosting and database).',
   'NOT DETERMINED', 0),
  ('SPEECH', 'Voice recordings', 5,
   'Audio recordings of the learner speaking, their duration and fingerprint, and the feedback given on them.',
   'learner_recordings,recording_upload_parts,pronunciation_feedback',
   'To assess speaking, which cannot be assessed without hearing the learner. Playback is authorised on every request; no public or signed URL is ever handed out.',
   'Cloudflare (private object storage and database). No third party receives recordings and none is sent for automated analysis.',
   '730 days from recording, after which the audio is deleted and the assessment record and its SHA-256 fingerprint are kept. Governance D1, in force.', 1),
  ('OUTCOMES', 'Qualifications and academic record', 6,
   'Awards conferred, the name as it appears on the certificate, graduation audits, pass lists, distinctions, issued documents and CPD records.',
   'awards,conferrals,graduation_audits,pass_list_entries,academic_distinctions,issued_documents,cpd_records',
   'To confer a qualification and to let anybody holding a certificate check that it is real. The Register is permanent by design: a qualification that could be deleted on request could not be relied upon by the people it is shown to.',
   'Cloudflare (hosting and database). A verification response discloses only what the certificate itself asserts.',
   'Permanent. Governance D3: a conferred award is not deleted on request; the remedies offered instead are removal from the browsable register and suppression of the holder''s name.', 0),
  ('PROFILE', 'Public graduate profile', 7,
   'Display name, country, portrait photograph, and the shares a graduate has created.',
   'graduate_profiles,profile_shares',
   'To let a graduate present their qualification, entirely at their own choice. Publication is opt-in: nothing appears without consent and consent can be withdrawn.',
   'Cloudflare (hosting, database and object storage). Whoever the graduate shares a link with.',
   'NOT DETERMINED', 1),
  ('PAYMENTS', 'Fees', 8,
   'Payments, instalment plans and scholarship awards. Card details are never seen by the College.',
   'payments,instalment_plans,scholarships',
   'To take and reconcile tuition payments and to administer instalments and scholarships.',
   'The payment gateway used for the transaction (Stripe, Paystack, Flutterwave or Opay), which handles the card data directly; Cloudflare (hosting and database); Resend (receipts).',
   'NOT DETERMINED', 0),
  ('SUPPORT', 'Concerns, appeals and conduct', 9,
   'Records of concerns raised about a learner''s progress, academic appeals they have lodged, misconduct cases, and survey responses.',
   'learner_concerns,appeals,misconduct_cases,feedback_responses',
   'To support a learner who appears to be struggling, to hear a challenge to a decision, to handle an allegation fairly, and to learn from what learners say. A survey published as anonymous cannot store who answered it — that is enforced in the schema, not merely intended.',
   'Cloudflare (hosting and database).',
   'NOT DETERMINED', 1),
  ('COMMUNICATIONS', 'Messages sent', 10,
   'A log of the notifications the College has sent to a person and whether they were delivered.',
   'notification_log',
   'To know whether a learner was actually told something — an appeal outcome or a misconduct notice that never arrived is not notice.',
   'Resend (email delivery); Cloudflare (hosting and database).',
   'NOT DETERMINED', 0),
  ('STAFF_AND_PARTNERS', 'Staff, examiners and verifying institutions', 11,
   'Names and affiliations of appointed External Examiners, the staff hosting live sessions, corporate account contacts, and institutions registered to verify qualifications.',
   'external_examiners,live_sessions,corporate_accounts,verifying_institutions',
   'To record who holds an academic office, who taught a session, and which institutions are entitled to verify a qualification in bulk.',
   'Cloudflare (hosting and database).',
   'NOT DETERMINED', 0);

INSERT OR IGNORE INTO processing_exclusions (table_name, reason) VALUES
  ('audio_cues', 'Curriculum content. Carries audio_asset_id, which references a College-authored recording of a scripted dialogue, not a learner.'),
  ('learning_items', 'Curriculum content. audio_asset_id references College-authored audio.'),
  ('quiz_questions', 'Curriculum content. audio_cue_id references a segment of College-authored audio.'),
  ('editions', 'A register of published document editions. edition_name names a document, not a person.'),
  ('country_payment_routing', 'Configuration. country_code is a market, not a person''s country.'),
  ('graduation_requirements', 'Policy text. No personal data.'),
  ('appeal_grounds', 'Policy text. No personal data.'),
  ('misconduct_categories', 'Policy text. No personal data.'),
  ('intervention_triggers', 'Policy text. No personal data.');

CREATE INDEX IF NOT EXISTS idx_processing_risk ON processing_activities(higher_risk);
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_processing_tables ON processing_activities(sequence);
