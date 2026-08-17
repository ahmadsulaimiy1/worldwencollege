-- Migration 014 — award definitions, promoted from documentation into
-- the institutional data model.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_award_definitions_level'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
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
