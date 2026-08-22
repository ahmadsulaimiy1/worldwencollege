-- Migration 021 — Worldwide English Qualifications (WEQ).
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_award_definitions_stage'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHAT THE BOARD RESOLVED, AND WHAT IT SUPERSEDES
-- ============================================================
--
-- Governance C4 adopted a ladder of STANDING on 14 August 2026 —
-- Aspirant, Candidate, Associate, Envoy, Orator, Laureate, with
-- post-nominals ApWEC–LrWEC. It chose those words deliberately over
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
-- an English Candidate of Worldwide English College, which is legible
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
    'Designed to develop: structured argument — a claim, a reason, an example, a conclusion; the paragraph as a unit of thought; managing a conversation, including the clarifying question, which is the skill that separates a learner who copes from one who is stuck; reading for main idea against reading for detail; and the beginnings of register control between the spoken and the written.',
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
