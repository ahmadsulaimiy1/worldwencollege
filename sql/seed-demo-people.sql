-- =====================================================================
--  FICTIONAL PLACEHOLDER ACCOUNTS — DEVELOPMENT AND DESIGN ONLY
-- =====================================================================
--
--  Every name in this file is invented. None of these people exist,
--  none of them work for WEC-LC, and none of the qualifications listed
--  in docs/org-chart-placeholders.md were awarded to anyone. They are
--  here for one reason: an administration screen designed against
--  three rows called "demo@example.com" looks nothing like the same
--  screen holding a real staff list, and design decisions made against
--  the first are wrong for the second.
--
--  THIS FILE MUST NEVER BE APPLIED TO A PRODUCTION DATABASE, AND NONE
--  OF THESE NAMES MAY APPEAR ON A PUBLIC PAGE. Both rules are enforced
--  by tests/demo-people.test.mjs, which fails the build if either is
--  broken. The rules are not a formality — a fabricated staff list on
--  an education provider's site is a misrepresentation whether or not
--  anyone intended it as one, and https://preview.wec-lc.pages.dev is
--  publicly reachable.
--
--  Three properties make an accident survivable:
--
--    ids       every row is 'usr_demo_*', so removing all of them is
--              DELETE FROM users WHERE id LIKE 'usr_demo_%';
--    emails    every address is on .invalid, a domain RFC 2606 reserves
--              precisely so that it can never resolve. If this file is
--              ever applied by mistake, no message can reach a real
--              person, and no sign-in can be attempted against it.
--    auth ids  every auth_provider_id is 'demo_*'. Clerk issues ids
--              beginning 'user_', so none of these rows can ever be
--              matched by a real session token — the accounts cannot be
--              signed into, only looked at.
--
--  Roles are NOT job titles. The platform knows three access levels:
--
--    admin     may appoint others and read every learner record
--    staff     may enrol, withdraw, review recordings, grade
--    student   no elevated access at all
--
--  So the split below is by "does this position need access to student
--  records", not by seniority. Six of the eighteen positions sit at
--  'student' because they have no business reading learner files —
--  finance, marketing, corporate sales, the CEO's assistant, and both
--  technology posts. Infrastructure access is a Cloudflare account
--  matter and is deliberately not the same thing as being able to open
--  a named learner's record.
--
--  The two 'admin' rows follow the recommendation in
--  docs/governance-decisions.md item A1 (owner plus one deputy). That
--  item is NOT adopted. If the Executive amends it, this file changes.
--
--  Apply locally with:
--    npx wrangler d1 execute wec-lc --local --file=sql/seed-demo-people.sql
--  Never with --remote.
-- =====================================================================

-- --- Administrator access (2) ----------------------------------------
INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role, preferred_name) VALUES
  ('usr_demo_ceo',       'clerk', 'demo_ceo',       'ahmad.alhassan@placeholder.invalid',     0, 'admin', 'Ahmad Kareem Al-Hassan'),
  ('usr_demo_registrar', 'clerk', 'demo_registrar', 'yusuf.rahman@placeholder.invalid',       0, 'admin', 'Yusuf Ibrahim Rahman');

-- --- Staff access: positions that work with learner records (10) -----
INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role, preferred_name) VALUES
  ('usr_demo_academic',   'clerk', 'demo_academic',   'sarah.hughes@placeholder.invalid',     0, 'staff', 'Sarah Elizabeth Hughes'),
  ('usr_demo_quality',    'clerk', 'demo_quality',    'omar.malik@placeholder.invalid',       0, 'staff', 'Omar Farooq Malik'),
  ('usr_demo_admissions', 'clerk', 'demo_admissions', 'rebecca.lawson@placeholder.invalid',   0, 'staff', 'Rebecca Anne Lawson'),
  ('usr_demo_success',    'clerk', 'demo_success',    'maryam.saleh@placeholder.invalid',     0, 'staff', 'Maryam Abdulrahman Saleh'),
  ('usr_demo_programme',  'clerk', 'demo_programme',  'zainab.hassan@placeholder.invalid',    0, 'staff', 'Zainab Ismail Hassan'),
  ('usr_demo_assessment', 'clerk', 'demo_assessment', 'james.wallace@placeholder.invalid',    0, 'staff', 'James Edward Wallace'),
  ('usr_demo_curriculum', 'clerk', 'demo_curriculum', 'bilal.siddiqui@placeholder.invalid',   0, 'staff', 'Bilal Ahmed Siddiqui'),
  ('usr_demo_tutor_1',    'clerk', 'demo_tutor_1',    'khadijah.rahman@placeholder.invalid',  0, 'staff', 'Khadijah Noor Rahman'),
  ('usr_demo_tutor_2',    'clerk', 'demo_tutor_2',    'daniel.collins@placeholder.invalid',   0, 'staff', 'Daniel Robert Collins'),
  ('usr_demo_services',   'clerk', 'demo_services',   'hafsa.mohammed@placeholder.invalid',   0, 'staff', 'Hafsa Ali Mohammed');

-- --- No elevated access: positions with no reason to open a learner
-- --- record. 'student' is the platform's name for "nothing granted",
-- --- not a claim that these people are studying here. (6)
INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role, preferred_name) VALUES
  ('usr_demo_learntech',  'clerk', 'demo_learntech',  'amina.siddiqi@placeholder.invalid',    0, 'student', 'Amina Noor Siddiqi'),
  ('usr_demo_finance',    'clerk', 'demo_finance',    'david.harrington@placeholder.invalid', 0, 'student', 'David Christopher Harrington'),
  ('usr_demo_marketing',  'clerk', 'demo_marketing',  'fatimah.almansoori@placeholder.invalid', 0, 'student', 'Fatimah Zahra Al-Mansoori'),
  ('usr_demo_security',   'clerk', 'demo_security',   'khalid.alnuaimi@placeholder.invalid',  0, 'student', 'Khalid Mohammed Al-Nuaimi'),
  ('usr_demo_corporate',  'clerk', 'demo_corporate',  'ibrahim.khan@placeholder.invalid',     0, 'student', 'Ibrahim Suleiman Khan'),
  ('usr_demo_execassist', 'clerk', 'demo_execassist', 'sophia.bennett@placeholder.invalid',   0, 'student', 'Sophia Grace Bennett');

-- No enrolments are created for any of these accounts. A placeholder
-- staff list is useful for designing the administration screens; a
-- placeholder set of *learner progress records* would be fabricated
-- academic history, which is a different thing and is not wanted.
