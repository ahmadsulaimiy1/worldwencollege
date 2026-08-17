-- Migration 015 — what the IEFC IS, and what the College can currently
-- evidence about it.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_programme_claims_state'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
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
   || 'normalised to the AIPC rubric policy — not auto-scored. Spoken work is captured as '
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
