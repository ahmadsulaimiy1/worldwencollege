-- The Accreditation Evidence Centre — the College's own register of
-- what it can and cannot evidence about its own practice.
--
-- INTERNAL QUALITY INSTRUMENT. Worldwide English College holds no
-- accreditation, recognition or affiliation and has applied for none.
--
-- ============================================================
-- HOW THIS FILE WAS WRITTEN, AND WHAT THAT GUARANTEES
-- ============================================================
--
-- Every row with state='exists' cites a path that is in this repository
-- TODAY, and tests/evidence-centre.test.mjs opens every one of them. A
-- register that can cite a document nobody can open is worse than an
-- empty register, because it converts a known gap into an unknown one.
--
-- Every other row states honestly why the evidence is absent. Nothing
-- here was written to make a collection look populated: of the 23
-- collections the Executive named, the College can currently evidence
-- fewer than half, and the register says so on its face.
--
-- Roles, not names. Naming a Director of Quality who does not exist
-- would be fabricating personnel on an education provider's record. The
-- post outlives the holder; the register names the post.

-- ---------------------------------------------------------------------
-- 1. GOVERNANCE
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_gov_001','GOV-001','Governance','Register of governance decisions awaiting approval','exists',
 'The complete list of academic and operational decisions the Executive has been asked to take, each with a recommendation and the consequences of not taking it. All twenty-five outstanding decisions in it were adopted by the Executive on 14 August 2026, and its adoption record states plainly that the academic items await ratification by the Academic Senate, which was constituted on 14 August 2026 with three members and has not yet ratified them, and that adoption confers no award.',
 'docs/governance-decisions.md','internal','Governing Council',6),
('ev_gov_002','GOV-002','Governance','Constitution of the Governing Council','governance_pending',
 'The College has no written constitution defining who governs it, how members are appointed, what powers they hold and how decisions are recorded. Until one exists, "the Executive approved this" has no defined meaning. This is the most fundamental gap in the register.',
 NULL,'internal','Governing Council',NULL),
('ev_gov_003','GOV-003','Governance','Terms of reference for the Academic Senate','governance_pending',
 'No terms of reference exist. The academic architecture repeatedly cites Senate approval as the authority for an award; nothing defines what the Senate is.',
 NULL,'internal','Academic Senate',NULL),
('ev_gov_004','GOV-004','Governance','Schedule of delegated authority','governance_pending',
 'Who may confer an award, withdraw one, change what a learner is charged, or destroy learner work. Partially implemented in software and recorded as governance A1, A2, A4, A5 and C5, all adopted by the Executive on 14 August 2026. No consolidated schedule has been written; the decisions exist one at a time, in a register, which is not the same as a schedule an auditor can read in one page.',
 NULL,'internal','Governing Council',NULL);

-- ---------------------------------------------------------------------
-- 2. ACADEMIC REGULATIONS
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_areg_001','AREG-001','Academic Regulations','Academic Framework','exists',
 'The constitutional academic document: level structure, credit model (1 WEC Credit = 10 notional hours), GLH/ILH/TQT definitions, the six-competency framework, and the terminology the College uses instead of marketing language.',
 'docs/academic-framework.md','public','Academic Senate',12),
('ev_areg_002','AREG-002','Academic Regulations','Progression rules','governance_pending',
 'What a learner must achieve to progress from one level to the next. Governance B1 and B2, adopted by the Executive on 14 August 2026 and awaiting ratification by the Academic Senate, which was constituted on 14 August 2026 with three members and has not yet ratified them. Until it does, the platform enforces a mechanism default explicitly labelled as not an academic standard.',
 NULL,'internal','Academic Senate',NULL),
('ev_areg_003','AREG-003','Academic Regulations','Admissions and entry requirements','governance_pending',
 'The College accepts applications and places learners at a level. No published entry requirement, placement policy or appeal against placement exists.',
 NULL,'internal','Registrar',NULL);

-- ---------------------------------------------------------------------
-- 3. ASSESSMENT REGULATIONS
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_asr_001','ASR-001','Assessment Regulations','Rubric policy','exists',
 'The College''s policy on assessment rubrics, applied to and enforced across all 60 authored assignments by tests/curriculum-consistency.test.mjs.',
 'docs/curriculum-framework.md','internal','Director of Academic Quality',12),
('ev_asr_002','ASR-002','Assessment Regulations','Pass marks and classification','governance_pending',
 'Module pass threshold, end-of-level examination pass mark, and the thresholds separating Pass, Merit, Distinction, High Distinction and Distinction of the College. Governance B1, B2 and C4b, adopted by the Executive on 14 August 2026 and awaiting ratification by the Academic Senate, which was constituted on 14 August 2026 with three members and has not yet ratified them; no regulation has been written from them. No award can be conferred until they are.',
 NULL,'internal','Academic Senate',NULL),
('ev_asr_003','ASR-003','Assessment Regulations','Resit and reassessment policy','governance_pending',
 'How many resits a learner may take, whether a resit mark is capped, and what happens when resits are exhausted. Governance B3, adopted by the Executive on 14 August 2026 &mdash; two resits, fourteen days apart, a third failure repeating the level. The decision exists; the policy has not been written and the platform does not yet enforce it.',
 NULL,'internal','Academic Senate',NULL),
('ev_asr_004','ASR-004','Assessment Regulations','Conduct of examinations','governance_pending',
 'How a summative assessment is invigilated, or what replaces invigilation on an asynchronous online programme. This bears directly on whether the College can defend the integrity of its own awards.',
 NULL,'internal','Registrar',NULL);

-- ---------------------------------------------------------------------
-- 4. QUALITY ASSURANCE
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_qa_001','QA-001','Quality Assurance','Engineering principles and verification standard','exists',
 'The standard the platform is built and verified to, including the requirement that a fix is confirmed by removing it and watching the test fail. Directly relevant to whether the College''s academic records can be relied upon.',
 'docs/engineering-principles.md','internal','Chief Technology Officer',12),
('ev_qa_002','QA-002','Quality Assurance','Programme review','exists',
 'A full review of the six-level curriculum against the framework, including findings and the corrections made in response.',
 'docs/curriculum-programme-review.md','internal','Director of Academic Quality',12),
('ev_qa_003','QA-003','Quality Assurance','Quality assurance policy','governance_pending',
 'A written statement of how the College assures the quality of its provision: what is reviewed, by whom, how often, and what happens when a review finds a problem. The reviews above were carried out; the policy requiring them does not exist.',
 NULL,'internal','Director of Academic Quality',NULL);

-- ---------------------------------------------------------------------
-- 5. PROGRAMME SPECIFICATIONS
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_ps_001','PS-001','Programme Specifications','IEFC programme specification','exists',
 'The International English Fluency Course: six levels, CEFR alignment, credit value, total qualification time, and the structure of each level.',
 'docs/curriculum-framework.md','public','Academic Senate',12),
('ev_ps_002','PS-002','Programme Specifications','Award architecture','exists',
 'The proposed titles, post-nominals, honours and ceremonial structure of the IEFC awards. Recorded as a PROPOSAL: governance C4 has not been taken, and no award has been conferred.',
 'docs/iefc-award-architecture.md','internal','Academic Senate',12),
('ev_ps_003','PS-003','Programme Specifications','Academic calendar','exists',
 'Cohort structure, intake dates and the shape of the academic year.',
 'docs/academic-calendar.md','public','Registrar',12);

-- ---------------------------------------------------------------------
-- 6-8. CURRICULUM MAPS, LEARNING OUTCOMES, COMPETENCY FRAMEWORK
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_cm_001','CM-001','Curriculum Maps','Level I–VI curriculum documents','exists',
 'Six authored curriculum documents covering all 60 modules, each specifying content, listening, pronunciation, quiz and assignment. Seeded into the platform and verified end to end by the per-level test suites.',
 'docs/curriculum-level-1-foundation.md','public','Academic Director',12),
('ev_cm_002','CM-002','Curriculum Maps','Assessment-to-competency map','governance_pending',
 'THE LARGEST GAP BETWEEN THE COLLEGE''S FRAMEWORK AND ITS PRACTICE. The Academic Framework requires every assessment to map to at least one competency and every competency to be assessed at least three times per level. Nothing is mapped: competencyCoverage() reports 0 of 360. The tables exist and are empty. Governance A6d — this is academic work for the Academic Director, and the platform will not generate it.',
 NULL,'internal','Academic Director',NULL),
('ev_lo_001','LO-001','Learning Outcomes','Module-level learning outcomes','not_instrumented',
 'The curriculum documents describe what each module covers, but the platform has no structured learning-outcome records — `units` carries a title and nothing else. Outcomes therefore cannot be mapped to assessments, reported on a transcript, or evidenced to a reviewer.',
 NULL,'internal','Academic Director',NULL),
('ev_cf_001','CF-001','Competency Framework','The six competencies','exists',
 'Clarity, Command, Judgement, Reason, Bearing and Reach, defined in the Academic Framework § IV and seeded into the platform as durable identifiers a transcript can cite.',
 'docs/academic-framework.md','public','Academic Senate',12);

-- ---------------------------------------------------------------------
-- 9-11. REVIEW AND MONITORING
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_er_001','ER-001','External Review Reports','External examiner reports','not_instrumented',
 'No external examiner has been appointed, so no independent view of the standard of the College''s assessment exists. This is among the first things any reviewer asks for, and the College currently has nothing to offer.',
 NULL,'internal','Academic Senate',NULL),
('ev_ir_001','IR-001','Internal Review Reports','Executive readiness report','exists',
 'An internal review of the platform''s readiness, with findings and their resolution.',
 'docs/executive-readiness-report.md','internal','Director of Academic Quality',12),
('ev_am_001','AM-001','Annual Monitoring','Annual programme monitoring report','scheduled',
 'The College has not completed a full academic year, so no annual monitoring report is due yet. The Institutional Metric Register supplies the data such a report would draw on. First report due at the end of the first full year of delivery.',
 NULL,'internal','Director of Academic Quality',12);

-- ---------------------------------------------------------------------
-- 12-14. RISK, FEEDBACK, OUTCOMES
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_rr_001','RR-001','Risk Registers','Institutional risk register','governance_pending',
 'No risk register exists. Several risks are already known and recorded elsewhere — no approved misconduct procedure while the platform stores learner voice recordings (C9); no adopted retention policy (D1, D2); a permanent register in tension with erasure rights (D3) — but they are scattered across documents rather than held, owned and reviewed in one place.',
 NULL,'internal','Governing Council',NULL),
('ev_sf_001','SF-001','Student Feedback','Student feedback instrument','exists',
 'The instrument exists. Surveys carry a stated purpose, a window and an anonymity setting chosen per survey, and that setting is structurally enforced: a response to an anonymous survey cannot hold an identity and a response to an attributable one cannot omit it, so the promise made when the survey was published cannot be broken later by carelessness. A companion register records what the College changed because of what learners said, or declined to change and why, and whether learners were told. No survey has been published and no learner has answered one, because nothing has been taught. Governance A7 item 2.',
 'sql/migrations/025-student-voice.sql','internal','Director of Student Affairs',12),
('ev_go_001','GO-001','Graduate Outcomes','Graduate destinations survey','not_instrumented',
 'No survey exists, and there are no graduates to send one to. Blocked behind the first conferral and behind consent to be contacted after leaving. Governance A7.',
 NULL,'internal','Registrar',NULL),
('ev_at_001','AT-001','Attendance','Live session attendance record','exists',
 'The record exists. Every row states how the College knows a learner was present — a provider join log, a named host''s register, or the learner''s own word — and those are counted separately, because they are not equivalent evidence. A platform record without the log''s times cannot be entered by hand. Sessions carry whether attendance was required, defaulting to not required, because this is an asynchronous programme. No session has been held. Governance A7 item 1. THE OPEN DECISION: what attendance MEANS — presence at a session, or engagement with the module — is not taken, and no attendance rate is published until it is.',
 'sql/migrations/024-attendance.sql','internal','Academic Director',12),
('ev_ei_001','EI-001','Student Success','Early intervention register','exists',
 'The register exists and contains no risk score. The College has taught nobody and therefore has no evidence about what predicts failure on its own programmes; a weighted model built now would be invented numbers that somebody would act on. Instead five named triggers state their rules in words, and every one records its threshold as NOT SET pending Academic Senate. A concern cannot be closed unless the learner was contacted, or unless a written reason says why no contact was needed — the distinction between support and a file kept about somebody. RECOMMENDED: set the thresholds from what actually happens to the first cohort.',
 'sql/migrations/026-student-success.sql','internal','Director of Student Affairs',12),
('ev_ga_001','GA-001','Graduate Register','Graduation audit before conferral','exists',
 'Every conferral now requires a passed graduation audit. Before this, conferAward() checked the FORM of a conferral — chain, signature, race — and never whether it was earned: the title, CEFR level, credits and hours all arrived from the caller, so a Mastery qualification could have been conferred on somebody who had completed nothing, correctly chained and permanently verifiable. The five requirements are taken verbatim from the WEQ graduation clauses adopted in migration 021, each citing its source. A check records met, not_met, or cannot_check — the third because recording "met" for a human act the platform cannot confirm would be a lie in the College''s own files. CONSEQUENCE: no External Examiner is appointed, so no audit can pass and nothing can be conferred. That is the framework''s own published position, now enforced. A learner who has completed every module, had every assignment graded and passed the stage examination still audits as not_met, and a test asserts it.',
 'sql/migrations/028-graduation-audit.sql','internal','Registrar',12),
('ev_ee_001','EE-001','External Examining','External Examiner register and reports','exists',
 'The register exists and is empty. Nothing here appoints anybody — an appointment is an institutional act. What has changed is that the graduation audit no longer answers "cannot check" from a hard-coded sentence: it reads this register, finds it empty, and reports not_met. The day somebody is appointed and reports, the same audit passes with no code change, and a test proves exactly that by appointing an examiner inside the test and watching a learner who has completed everything move from not_met to met. Constraints: an examiner declares conflicts at appointment (silence is refused; "none" is a declaration), and a report judging standards not met, or met with conditions, cannot be recorded without the College''s written response — because a report received and filed is a report ignored.',
 'sql/migrations/029-examining-and-moderation.sql','internal','Academic Director',12),
('ev_pl_001','PL-001','Academic Registry','Approved and countersigned pass list','exists',
 'The register exists and is empty. A pass list countersigned by the person who approved it is refused: one signature is an assertion, two is a control. The graduation audit reads this register for its PASS_LIST requirement, and distinguishes three failures a learner would experience differently — not on any list, on a list that was never countersigned, and on a list recording something other than a pass.',
 'sql/migrations/029-examining-and-moderation.sql','internal','Registrar',12),
('ev_qc_001','QC-001','Quality Assurance','Programme review and annual monitoring cycle','exists',
 'The cycle exists. docs/curriculum-programme-review.md was a thorough one-off; nothing obliged it to recur or recorded what became of its findings. Findings now name the register they came from and carry evidence that cannot be blank, and an action is either completed with a note saying what changed or carried forward into a successor that says so — never silently dropped. The chain makes "outstanding for three cycles" computable. No cycle has run. THE OPEN DECISION: the cadence. Twelve and sixty months are entered as proposals with basis NOT SET, pending Academic Senate.',
 'sql/migrations/027-quality-cycle.sql','internal','Academic Director',12);

-- ---------------------------------------------------------------------
-- 15-17. MODERATION, APPEALS, INTEGRITY
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_mod_001','MOD-001','Assessment Moderation','Internal moderation records','exists',
 'The register exists (migration 029) and is empty, because nothing has been marked. A moderator cannot be the first marker, and a divergence that changed the mark cannot be recorded without saying how it was settled. The metric reports MEAN DIVERGENCE rather than a moderation count, because a moderation process where the second marker always agrees is a rubber stamp with a timestamp. Until there are records the College still cannot evidence that its marking is consistent, and the readiness report says so — it counts records, not tables, after creating this one flipped that area to evidenced over an empty register.',
 'sql/migrations/029-examining-and-moderation.sql','internal','Director of Academic Quality',12),
('ev_dp_001','DP-001','Data Protection','Record of processing activities','exists',
 'The College holds personal data in 42 tables, including passport numbers, residential addresses, emergency contacts, scans of identity documents, portrait photographs and recordings of learners'' voices. The record of what is held, why, who else sees it and for how long now exists (migration 032) and is BOUND TO THE SCHEMA: every table with a personal-data-shaped column must be either described in a processing activity or listed as an explicit exclusion with a reason, so a new table holding personal data cannot be added without saying what the College does with it. Two retentions are settled from adopted decisions; nine are recorded as NOT DETERMINED rather than filled with a plausible number. NO LAWFUL BASIS IS RECORDED for any activity — that is a legal determination about a real institution in a real jurisdiction, and the schema refuses to publish an activity while its basis is undetermined.',
 'sql/migrations/032-processing-register.sql','internal','Registrar',12),
('ev_pn_001','PN-001','Data Protection','Published privacy notice','exists',
 'A privacy page is published at /support/privacy/ and is better than the sector norm: it opens by stating that the site runs no analytics, no advertising pixel and no third-party measurement of any kind, and a build check refuses the page if a tracker ever appears; it names the three actual processors rather than saying "service providers"; it distinguishes the enquiry form, which sends nothing and opens the visitor''s own mail client, from the application form, which does; and it declares the accountability gap rather than glossing it. It now also publishes the retention and erasure position adopted as D1, D2 and D3, and records that the page previously said those decisions were open when they had been taken. WHAT IS STILL MISSING, and why this is not yet a complete notice: no named data controller (the College''s legal status is unsettled), no lawful basis for any processing activity, no Data Protection owner appointed, and no international transfer position. Board Paper 02 puts all four to the Board. The full inventory behind the page is DP-001.',
 'pages/support-privacy.html','internal','Registrar',12),
('ev_ap_001','AP-001','Appeals','Academic appeals procedure','governance_pending',
 'No procedure exists by which a learner may challenge a mark, a progression decision or a withdrawal — the College has taken no such decision. What has changed is that it is now buildable the moment one is taken. The machinery exists (migration 030): four published grounds, a fifth row that exists solely to say that disagreement with academic judgement is NOT a ground, and constraints refusing an appeal heard by the person appealed against, an outcome without reasons, an appeal upheld with no statement of what changed, and closure without a Completion of Procedures statement — the document that lets a learner take the matter outside the College. The procedure itself ships as `proposed` and the schema refuses to let it become adopted without a body and a date. Recommended as governance C10. Nothing has been marked, so there is nothing to appeal against and the register is empty.',
 -- NO source path, deliberately. AP-001's evidence is an ADOPTED
 -- procedure and there is not one. Pointing this at the migration that
 -- builds the unadopted machinery would let a reader believe the
 -- evidence exists, which is the half-claim this register exists to
 -- prevent. The statement above says where the machinery is; the
 -- source_path stays NULL until a decision makes it real.
 NULL,'internal','Registrar',NULL),
('ev_ai_001','AI-001','Academic Integrity','Academic misconduct procedure','exists',
 'The procedure adopted under governance C9 exists and is enforced. Six categories of misconduct are defined with the evidence the College would have to show for each; the case register exists and is empty, because nothing has been taught and nobody has been assessed. The safeguards C9 required are CHECK constraints rather than guidance: a finding without notice, a finding before the learner could answer, a finding without reasons, a determination by the person who opened the case, an appeal heard by the person appealed against, and closure with an appeal outstanding are each impossible to record. Two matters remain for Senate: the standard response window, and the body that hears a referred case.',
 'docs/academic-integrity-procedure.md','internal','Registrar',12);

-- ---------------------------------------------------------------------
-- 18-19. STAFF
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_sd_001','SD-001','Staff Development','Staff development record','not_instrumented',
 'No record of teaching staff development is kept. The platform records who marked what and when, and nothing about the marker''s training or currency.',
 NULL,'internal','Academic Director',NULL),
('ev_fq_001','FQ-001','Faculty Qualifications','Register of teaching staff qualifications','not_instrumented',
 'No record of the qualifications of teaching staff exists. The College must not publish claims about the credentials of its faculty until it holds and can evidence them.',
 NULL,'restricted','Academic Director',NULL);

-- ---------------------------------------------------------------------
-- 20-23. POLICY, IMPROVEMENT, DECISIONS, SELF-EVALUATION
-- ---------------------------------------------------------------------
INSERT INTO evidence_items (id, reference, collection, title, state, statement, source_path, classification, owner_role, review_interval_months) VALUES
('ev_pol_001','POL-001','Policy Register','Data protection and retention policy','governance_pending',
 'Retention periods, erasure on request, and the conflict between a permanent tamper-evident register and a right to erasure. Governance D1, D2 and D3, adopted by the Executive on 14 August 2026; no retention policy has been written from them and the software does not yet enforce the periods. The platform ships in the safest available state — recordings are kept, never deleted, and the purge mechanism is switched off.',
 NULL,'internal','Chief Information Officer',NULL),
('ev_pol_002','POL-002','Policy Register','Accessibility policy','scheduled',
 'Accessibility is enforced in practice — every route is tested for a title, a lang attribute, exactly one h1, alt text on every image, no horizontal overflow, and 44px tap targets — but no written policy states the standard the College holds itself to. The practice exists; the policy does not.',
 NULL,'public','Chief Experience Officer',12),
('ev_ci_001','CI-001','Continuous Improvement Register','Defects found and corrected','exists',
 'The College''s record of problems found in its own systems and what was done about them, kept in the test suite''s documentation: each entry names the defect, how it was found, and the assertion that now prevents its return. Includes an 8.6% error-detection failure in verification codes and a chain-ordering defect that would have voided a batch conferral.',
 'tests/README.md','internal','Chief Technology Officer',6),
('ev_ed_001','ED-001','Executive Decisions','Adopted executive decisions','exists',
 'Decisions taken and implemented, distinguished from those merely recommended. Currently: P2.1 (public-key infrastructure for credentials) and P2.2 (digital wallet readiness without public claim).',
 'docs/executive-decision-brief.md','internal','Governing Council',12),
('ev_se_001','SE-001','Institutional Self-Evaluation','Self-evaluation instrument','exists',
 'The accreditation-readiness section of the Institutional Metric Register: what the College can and cannot evidence, area by area, carrying no score and opening with a statement that it holds no accreditation and has applied for none.',
 'functions/_lib/reports/institutional.js','internal','Director of Academic Quality',6);

-- ---------------------------------------------------------------------
-- CROSS-REFERENCES
-- ---------------------------------------------------------------------
-- The directive's central requirement: one governance decision links to
-- everything it affects, so taking it makes the consequences visible
-- rather than leaving them to be rediscovered.
--
-- These are recorded as APPROVED because they are not academic
-- judgements — each states a dependency that is already written down in
-- docs/governance-decisions.md and verifiable by reading it. Relations
-- that DO require academic judgement (which competency an assessment
-- assesses) are deliberately absent: none has been made, and asserting
-- them here would be exactly the fabrication the register exists to
-- prevent.
INSERT INTO academic_relations (id, subject_type, subject_id, predicate, object_type, object_id, status, approved_at, note) VALUES
('rel_b1_asr2','governance','B1','blocks','evidence','ASR-002','approved','2026-08-04T00:00:00.000Z','Pass thresholds cannot be published until adopted.'),
('rel_b2_asr2','governance','B2','blocks','evidence','ASR-002','approved','2026-08-04T00:00:00.000Z','Examination pass mark.'),
('rel_b3_asr3','governance','B3','blocks','evidence','ASR-003','approved','2026-08-04T00:00:00.000Z','Resit policy.'),
('rel_b1_areg2','governance','B1','blocks','evidence','AREG-002','approved','2026-08-04T00:00:00.000Z','Progression depends on the pass threshold.'),
('rel_c4_ps2','governance','C4','blocks','evidence','PS-002','approved','2026-08-04T00:00:00.000Z','The award architecture is a proposal until C4 is taken.'),
('rel_c5_gov4','governance','C5','blocks','evidence','GOV-004','approved','2026-08-04T00:00:00.000Z','Who may confer and withdraw an award.'),
('rel_c9_ai1','governance','C9','blocks','evidence','AI-001','approved','2026-08-04T00:00:00.000Z','No misconduct register may exist before an approved procedure.'),
('rel_d1_pol1','governance','D1','blocks','evidence','POL-001','approved','2026-08-04T00:00:00.000Z','Retention periods.'),
('rel_d2_pol1','governance','D2','blocks','evidence','POL-001','approved','2026-08-04T00:00:00.000Z','Erasure on request.'),
('rel_d3_pol1','governance','D3','blocks','evidence','POL-001','approved','2026-08-04T00:00:00.000Z','Permanent register against a right to erasure.'),
('rel_a6d_cm2','governance','A6d','blocks','evidence','CM-002','approved','2026-08-04T00:00:00.000Z','The assessment-to-competency map is the decision itself.'),
('rel_a6d_lo1','governance','A6d','blocks','evidence','LO-001','approved','2026-08-04T00:00:00.000Z','Outcomes must be structured before assessments can map to them.'),
('rel_a7_sf1','governance','A7','blocks','evidence','SF-001','approved','2026-08-04T00:00:00.000Z','Student feedback instrument. Built under A7 item 2; the anonymity decision A7 named is taken per survey rather than once for the College.'),
('rel_a7_go1','governance','A7','blocks','evidence','GO-001','approved','2026-08-04T00:00:00.000Z','Graduate destinations.'),
('rel_a4_gov4','governance','A4','blocks','evidence','GOV-004','approved','2026-08-04T00:00:00.000Z','Whether a fourth role is needed.'),
('rel_a5_gov4','governance','A5','blocks','evidence','GOV-004','approved','2026-08-04T00:00:00.000Z','Financial and erasure powers.'),

-- Evidence that governs other evidence. Reading the framework tells you
-- the competency framework is part of it; the graph should not require
-- you to have read it.
('rel_areg1_cf1','evidence','AREG-001','defines','evidence','CF-001','approved','2026-08-04T00:00:00.000Z','The six competencies are section IV of the Academic Framework.'),
('rel_areg1_ps1','evidence','AREG-001','governs','evidence','PS-001','approved','2026-08-04T00:00:00.000Z','The programme specification implements the framework.'),
('rel_ps1_cm1','evidence','PS-001','specifies','evidence','CM-001','approved','2026-08-04T00:00:00.000Z','The curriculum realises the specification.'),
('rel_asr1_cm1','evidence','ASR-001','governs','evidence','CM-001','approved','2026-08-04T00:00:00.000Z','The rubric policy applies to every authored assignment.'),

-- Evidence to the metric that measures it.
('rel_cm2_kpi','evidence','CM-002','measured_by','kpi','assessment.competencyCoverage','approved','2026-08-04T00:00:00.000Z','Coverage reports 0 of 360 mapped.'),
('rel_mod1_kpi','evidence','MOD-001','measured_by','kpi','assessment.moderation','approved','2026-08-04T00:00:00.000Z','The register exists and is empty; reported as insufficient_data, never as full moderation.'),
('rel_ai1_kpi','evidence','AI-001','measured_by','kpi','integrity.misconduct','approved','2026-08-04T00:00:00.000Z','The register exists and is empty; reported as insufficient_data, never as zero.'),
('rel_sf1_kpi','evidence','SF-001','measured_by','kpi','experience.studentFeedback','approved','2026-08-04T00:00:00.000Z','No instrument exists.'),
('rel_go1_kpi','evidence','GO-001','measured_by','kpi','outcomes.graduateDestinations','approved','2026-08-04T00:00:00.000Z','No survey and no graduates.'),

-- The competency framework to the six competencies themselves, so the
-- graph reaches from a governing document into the data.
('rel_cf1_clarity','evidence','CF-001','defines','competency','cmp_clarity','approved','2026-08-04T00:00:00.000Z',NULL),
('rel_cf1_command','evidence','CF-001','defines','competency','cmp_command','approved','2026-08-04T00:00:00.000Z',NULL),
('rel_cf1_judgement','evidence','CF-001','defines','competency','cmp_judgement','approved','2026-08-04T00:00:00.000Z',NULL),
('rel_cf1_reason','evidence','CF-001','defines','competency','cmp_reason','approved','2026-08-04T00:00:00.000Z',NULL),
('rel_cf1_bearing','evidence','CF-001','defines','competency','cmp_bearing','approved','2026-08-04T00:00:00.000Z',NULL),
('rel_cf1_reach','evidence','CF-001','defines','competency','cmp_reach','approved','2026-08-04T00:00:00.000Z',NULL);
