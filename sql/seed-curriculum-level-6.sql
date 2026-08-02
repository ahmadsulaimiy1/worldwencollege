-- WEC-LC — Real curriculum content seed: Level VI ("English Mastery
-- Programme," C2) — the programme's capstone level. Authored per your
-- Level VI directive: "not simply another language level... the
-- capstone of the WEC-LC academic journey," representing mastery
-- rather than merely proficiency. See docs/curriculum-framework.md
-- (the six-level architecture, including this level's Executive
-- Academic Objective and the recorded decision to re-theme its ten
-- modules by professional domain) and
-- docs/curriculum-level-6-mastery.md (this level's module map,
-- § What's different from Level V, and Module 1's full prose version)
-- plus docs/curriculum/level-6/module-{02..10}-*.md for Modules 2-10.
--
-- Deliberately a SEPARATE file from sql/schema.sql and from the
-- other level seed files — see any of their headers for why
-- curriculum content is never baked into schema.sql. Apply after
-- schema.sql:
--   wrangler d1 execute wec-lc --file=sql/schema.sql
--   wrangler d1 execute wec-lc --file=sql/seed-curriculum-level-6.sql

-- ---------------------------------------------------------------------
-- Module 1: Mastery Diagnostic & Executive Leadership
-- Full prose version: docs/curriculum-level-6-mastery.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m1', 'crs_level_6', 1, 'Module 1: Mastery Diagnostic & Executive Leadership');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m1_overview', 'unt_l6_m1', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: It is imperative that... -- We recommend that the committee review... -- I take full responsibility for... -- On reflection, what I would do differently is... -- The decision rests with me. -- Let me set out where we stand.

DISCOURSE MARKERS (functional set -- accountable leadership framing): "I take responsibility for", "the decision rests with", "on reflection", "what I would do differently is" -- language that assigns ownership explicitly rather than diffusing it. This register has a genuine ethical dimension: the passive constructions available at earlier levels ("mistakes were made") let a speaker describe a failure without owning it, and this module deliberately teaches the opposite move.

PHRASAL VERBS & COLLOCATIONS: "step up" (take on greater responsibility when needed), "carry the can" (BrE idiom: take the blame, often for others'' actions), "set the direction", "own the outcome", "front up (to something)" (face a difficulty or one''s own error openly).

BrE / AmE NOTE: a British company has a "board of directors" in which "executive" and "non-executive directors" sit, with a "chairman/chair" as the senior independent figure; American usage more commonly distinguishes "inside" and "outside directors" and uses "board member", with "Chairman of the Board" and "CEO" sometimes held by the same person -- a structure British corporate-governance convention has generally discouraged. The terms are not interchangeable across the two systems.

KEY VOCABULARY: executive-leadership vocabulary (mandate, remit, accountability, delegation, succession, stewardship), reflective-practice vocabulary (self-assessment, blind spot, development plan, growth edge). Intercultural note: how directly a leader is expected to claim personal responsibility varies significantly across professional cultures; this module teaches explicit ownership as one widely respected international-executive convention, while naming that its directness is itself culturally situated.'),

('itm_l6_m1_lesson1', 'unt_l6_m1', 2, 'reading', 'Lesson 1.1 -- It Is Imperative That He Be Informed -- The Subjunctive in Executive Register',
'LEARNING OBJECTIVES: (1) form the mandative subjunctive correctly after verbs and adjectives of demand, recommendation, and necessity, (2) recognise that the subjunctive form is invariant -- no third-person -s, and "be" rather than "is/are", (3) choose appropriately between subjunctive and the "should"-alternative, knowing which is more formal and which is more common in British usage, (4) draft a formal recommendation or resolution.

PREREQUISITE KNOWLEDGE: Level V, Module 3 (inversion for emphasis) and Module 4 (hedging/qualifying).

WARM-UP (5 min): Your instructor writes two versions of one recommendation -- "We recommend that the committee reviews the policy" and "We recommend that the committee review the policy" -- which is correct? (Both are used; the second is the subjunctive and the more formal.)

PRESENTATION (10 min): "It is imperative that every director be briefed before the vote. The board requires that the report be circulated in advance. We propose that the chair convene an extraordinary meeting." The subjunctive uses the BASE FORM regardless of subject -- "be", not "is"; "convene", not "convenes" -- and its negative is "not + base form" ("We insist that he not attend"), with no auxiliary "do". Register/variety nuance: American English uses the mandative subjunctive very consistently in formal writing; British English frequently prefers "should + base form", with the bare subjunctive reading as either very formal or slightly American to some British readers. Neither is wrong; a mastery-level writer chooses knowingly.

GUIDED PRACTICE (10 min): Convert 8 "should"-form recommendations into bare-subjunctive form and identify which of a further 4 sentences contain a subjunctive error.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draft 5 formal recommendations relating to a real or invented organisational decision, using the subjunctive accurately, then exchange with a partner who checks each for the invariant base form and correct negation. Read your strongest recommendation aloud in a formal register; your partner responds in kind.

CRITICAL THINKING / DISCUSSION PROMPT: "The subjunctive survives almost exclusively in formal, institutional English -- resolutions, recommendations, legal drafting. Why do you think a construction that has largely disappeared from everyday speech persists so strongly in these specific contexts?"

LISTENING ACTIVITY (5 min): Listen to a formal board-meeting extract (6-8 sentences) containing several subjunctive constructions and transcribe the exact verb forms used, noting any "should"-alternatives.

READING ACTIVITY -- EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short formal governance document extract (180-200 words) using subjunctive constructions. Answer 2 literal questions and 2 independent-judgement questions ("Does the document''s formality serve its readers, or does it obscure what is actually being decided? Justify your view with specific reference to the text.").

WRITING TASK (5 min): Draft a three-sentence formal resolution using the subjunctive at least twice.

PRONUNCIATION PRACTICE (5 min): The slightly marked stress and pacing of formal subjunctive constructions read aloud ("It is IMperative that every DIRector be BRIEFED") -- the deliberate, weighted delivery formal resolutions receive when read into a meeting record.

VOCABULARY REINFORCEMENT: an executive-governance vocabulary matching game (mandate, remit, accountability, delegation, succession, stewardship) with precise definitions -- note that "remit" (BrE, the scope of one''s authority) is itself a register marker.

FORMATIVE ASSESSMENT: Instructor checks accurate invariant base forms and correct subjunctive negation during independent practice.

HOMEWORK: Complete the Level VI ENTRY DIAGNOSTIC: a structured self-assessment across the eight graduate attributes (rating current confidence, naming one specific piece of evidence for each rating), plus two areas you most want to develop this level. This becomes your personal focus plan, revisited in Module 10.

REVISION: Lesson 1.2 opens with learners naming one diagnostic focus area aloud.

EXTENSION: Find (or construct) one example of the "were"-subjunctive in formal usage ("If this were to proceed...") and explain how it differs in function from the mandative subjunctive.'),

('itm_l6_m1_lesson2', 'unt_l6_m1', 3, 'reading', 'Lesson 1.2 -- Leading and Accounting -- The Executive Briefing & Reflective Leadership Writing',
'LEARNING OBJECTIVES: (1) deliver a concise executive briefing that opens with the decision required, not the background, (2) assign responsibility explicitly using accountable-leadership framing, (3) write reflectively about your own leadership or professional practice without either self-promotion or performative self-criticism, (4) connect a reflective insight to a specific, evidenced change in practice.

PREREQUISITE KNOWLEDGE: Lesson 1.1 (subjunctive, formal recommendation register); Level V, Module 9 (bottom-line-up-front structure and the executive briefing).

WARM-UP (5 min): Your instructor delivers two 30-second briefings on the same invented situation -- one that describes a problem, one that states a decision and asks for a specific authorisation -- which would a senior audience find more useful?

PRESENTATION (10 min): The executive briefing at leadership level: THE DECISION REQUIRED ("I''m asking the board to approve X"), THE ESSENTIAL CONTEXT (two sentences, no more), THE RISK OWNED ("The principal risk is Y; I''m accountable for managing it"), THE ASK (a specific, time-bound authorisation). Reflective leadership writing has two failure modes: SELF-PROMOTION DISGUISED AS REFLECTION ("My greatest weakness is that I care too much about quality") and PERFORMATIVE SELF-CRITICISM (elaborate blame that commits to no change). A genuine reflective piece names a specific decision, states honestly what it cost, identifies the reasoning error, and commits to a concrete different action.

GUIDED PRACTICE (10 min): Evaluate 6 short reflective extracts, classifying each as genuine reflection, self-promotion, or performative self-criticism, and justifying the classification.

INDEPENDENT PRACTICE (10 min): Using a real or invented professional decision, draft a four-part reflective paragraph (decision -> cost -> reasoning error -> concrete change) and a 60-second executive briefing on a related matter.

SPEAKING ACTIVITY -- EXECUTIVE BRIEFING: Deliver the 60-second briefing to a partner or small group acting as a senior audience, who may interrupt once with a direct challenge to your ownership of the risk ("Whose responsibility is this if it fails?").

CRITICAL THINKING / DISCUSSION PROMPT: "Is there a real difference between a leader who takes responsibility and one who merely says they take responsibility? What, specifically, would you look for as evidence of the first?"

LISTENING ACTIVITY (5 min): Listen to two executive briefings and identify which one genuinely owns the risk and which one distributes it, citing the specific language used.

READING ACTIVITY (5 min): Read a short published-style reflective leadership extract and identify its decision, cost, reasoning error, and committed change -- or note precisely which of the four is missing.

WRITING TASK (5 min): Expand your reflective paragraph, adding one sentence that connects the insight explicitly to your Lesson 1.1 diagnostic focus areas.

PRONUNCIATION PRACTICE (5 min): Steady, unhurried delivery when accepting responsibility aloud -- rushing this language signals discomfort and undercuts the words, while over-slowing it sounds theatrical.

VOCABULARY REINFORCEMENT: a reflective-practice vocabulary matching game (self-assessment, blind spot, development plan, growth edge) plus this module''s phrasal-verb set, with attention to which are register-appropriate in formal written reflection ("carry the can" is vivid but informal).

FORMATIVE ASSESSMENT: Instructor checks that reflective writing reaches a concrete committed change, and that briefings open with the decision required rather than background.

HOMEWORK: Finalise your reflective leadership essay draft for Module 1''s assignment.

REVISION: This lesson opens with the diagnostic focus-area recap. Module 1''s Quiz and Assignment draw on both lessons.

EXTENSION: Write a second, contrasting reflection on a decision that went well, identifying what was genuinely skill and what was genuinely luck.'),

('itm_l6_m1_quiz', 'unt_l6_m1', 4, 'quiz', 'Module 1 Quiz -- Mastery Diagnostic & Executive Leadership', NULL),

('itm_l6_m1_assignment', 'unt_l6_m1', 5, 'assignment', 'Module 1 Assignment -- A Reflective Leadership Essay & Executive Briefing',
'INSTRUCTIONS: Complete two parts. PART A (writing, this level''s first genre): a reflective leadership essay, 600-750 words, on a real or realistic professional decision you led or observed closely. It must name the decision, state honestly what it cost, identify the reasoning error or blind spot involved, and commit to a specific, concrete change in practice. Include at least 2 accurate mandative subjunctive constructions in any formal recommendation you make, and at least 2 accountable-leadership framing phrases from this module. PART B (speaking): an executive briefing, 60-90 seconds, on a related decision -- opening with the decision required, giving essential context in no more than two sentences, explicitly owning the principal risk, and closing with a specific, time-bound ask. Respond to at least one direct challenge to your ownership of that risk.

GRADING RUBRIC: (1) Grammatical accuracy -- correct invariant subjunctive forms and negation; accurate formal register throughout. (2) Vocabulary range -- at least 4 distinct executive-leadership or reflective-practice terms used precisely, plus one phrasal verb/collocation from this module used at an appropriate register. (3) Task completion -- decision, cost, reasoning error, and committed change all present in Part A; decision-first structure, owned risk, and time-bound ask all present in Part B. (4) Independent judgement -- does the reflection reach a genuinely self-critical insight the writer clearly arrived at themselves, rather than a conventional or flattering one? Does the committed change follow logically from the identified error? (5) Discourse coherence & register -- is the essay''s register reflective and professional without slipping into either self-promotion or performative self-criticism, and does the spoken briefing sustain composure under direct challenge?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m1_1', 'itm_l6_m1_quiz', 1, '"It is imperative that every director ___ briefed before the vote." (mandative subjunctive)', '["is","be","will be","being"]', 1),
('qq_l6_m1_2', 'itm_l6_m1_quiz', 2, '"The board requires that the report ___ circulated in advance."', '["is","be","was","has been"]', 1),
('qq_l6_m1_3', 'itm_l6_m1_quiz', 3, '"We propose that the chair ___ an extraordinary meeting."', '["convenes","convene","convened","is convening"]', 1),
('qq_l6_m1_4', 'itm_l6_m1_quiz', 4, 'How is the mandative subjunctive negated?', '["with \"doesn''t\" + base form","with \"not\" + base form","with \"isn''t\"","it cannot be negated"]', 1),
('qq_l6_m1_5', 'itm_l6_m1_quiz', 5, 'Which is the more common British alternative to the bare subjunctive in a formal recommendation?', '["\"should\" + base form","\"will\" + base form","the past simple","the present continuous"]', 0),
('qq_l6_m1_6', 'itm_l6_m1_quiz', 6, 'In British corporate governance, a director who is not part of the company''s management team is usually called a:', '["outside director","non-executive director","board observer","silent partner"]', 1),
('qq_l6_m1_7', 'itm_l6_m1_quiz', 7, 'Which opening is most appropriate for an executive briefing to a senior audience?', '["an extended account of the background","the decision required","an apology for taking their time","a list of everyone consulted"]', 1),
('qq_l6_m1_8', 'itm_l6_m1_quiz', 8, 'Which of these is genuine reflection rather than self-promotion?', '["\"My greatest weakness is that I care too much about quality.\"","\"I delayed the decision by three weeks because I over-weighted one stakeholder''s objection; next time I will set a decision deadline in advance.\"","\"Everything went well because of my leadership.\"","\"Mistakes were made by the team.\""]', 1),
('qq_l6_m1_9', 'itm_l6_m1_quiz', 9, 'Which phrase means "face a difficulty or one''s own error openly"?', '["step up","front up to","set the direction","own the outcome"]', 1),
('qq_l6_m1_10', 'itm_l6_m1_quiz', 10, 'In British usage, "remit" most precisely means:', '["a payment","the scope of one''s authority or responsibility","a reminder","a resignation"]', 1);

-- ---------------------------------------------------------------------
-- Module 2: Diplomacy & International Relations
-- Full prose version: docs/curriculum/level-6/module-02-diplomacy-international-relations.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m2', 'crs_level_6', 2, 'Module 2: Diplomacy & International Relations');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m2_overview', 'unt_l6_m2', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: It would not be unhelpful if... -- There is a view that... -- It may be felt in some quarters that... -- We would be reluctant to see... -- This is not a position we could readily support. -- We note with interest...

DISCOURSE MARKERS (functional set -- diplomatic distance): "there is a view that", "it may be felt that", "in some quarters", "we would be reluctant to see" -- impersonal constructions that advance a position while attributing it to no named person, allowing a negotiator to signal a stance that can later be adjusted without anyone visibly reversing themselves. Diplomatic hedging is not vagueness; it is deliberate preservation of manoeuvring room.

LITOTES AND CALIBRATED UNDERSTATEMENT: affirming something by negating its opposite ("not unhelpful", "no small achievement", "we are not unaware of your concerns"). Its function is precision of degree: "not unhelpful" is genuinely weaker praise than "helpful", and both parties understand this. The scale runs: unhelpful < not helpful < not unhelpful < helpful.

PHRASAL VERBS & COLLOCATIONS: "sound out [a party]" (discreetly test their position), "walk back [a statement]" (retreat from a stated position publicly), "paper over [differences]" (conceal disagreement rather than resolve it), "broker [an agreement]", "table [a proposal]" (see the BrE/AmE note).

BrE / AmE NOTE (two, both consequential): First, "to table a proposal" means to put it forward for discussion in British and most Commonwealth usage, but to postpone or shelve it in American usage -- a genuine, complete reversal, one of very few places where the two varieties produce directly opposite readings of the same formal sentence. Second, British ministries are led by a "Secretary of State" or "Minister" within a "Department"; the American equivalent is a "Secretary" heading a "Department"; "Minister" is not used for US federal officials.

KEY VOCABULARY: diplomatic vocabulary (communique, demarche, accession, ratification, bilateral/multilateral, good offices, without prejudice), IR vocabulary (sovereignty, mandate, sanctions regime, normalisation). Intercultural note: the degree of indirectness expected in diplomatic exchange varies by tradition and seniority; some multilateral settings have moved deliberately toward plainer language.'),

('itm_l6_m2_lesson1', 'unt_l6_m2', 2, 'reading', 'Lesson 2.1 -- It Would Not Be Unhelpful -- Diplomatic Hedging, Litotes & Impersonal Register',
'LEARNING OBJECTIVES: (1) form impersonal diplomatic constructions accurately, (2) produce and interpret litotes at the correct strength, (3) recognise that diplomatic hedging preserves manoeuvring room rather than merely softening tone, (4) read a diplomatic text for what it declines to say.

PREREQUISITE KNOWLEDGE: Level V, Module 4 (hedging and qualifying claims) and Module 5 (graded politeness modality).

WARM-UP (5 min): Your instructor writes three responses to the same proposal -- "We disagree," "We have some concerns," and "This is not a position we could readily support" -- rank them by strength of objection. (The third is generally the strongest, which is counter-intuitive to most learners.)

PRESENTATION (10 min): "There is a view that the timetable may prove ambitious. It may be felt in some quarters that further consultation would be prudent. We would be reluctant to see the matter pressed to a vote at this stage." None of these sentences names who holds the view, which means no individual has to reverse themselves if the position later shifts -- the function of the construction, not a decoration. The litotes scale: "unhelpful" < "not helpful" < "not unhelpful" < "helpful" -- a genuine four-point scale most learners collapse into two.

GUIDED PRACTICE (10 min): Convert 8 direct statements into impersonal diplomatic register, then place 6 litotes expressions on a strength scale from strongest objection to strongest approval.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Rewrite a blunt half-page position statement into full diplomatic register, then exchange with a partner, who states plainly what position they believe the rewritten text actually holds -- a direct test of whether the hedging preserved meaning or destroyed it.

CRITICAL THINKING / DISCUSSION PROMPT: "Diplomatic language is often criticised as evasive. Having now written it deliberately, do you think its indirectness is primarily a way of avoiding accountability, or a genuine tool for keeping negotiations alive? Can it be both at once?"

LISTENING ACTIVITY (5 min): Listen to a short diplomatic exchange (6-8 turns) and write, in plain English, what each party''s actual position is.

READING ACTIVITY -- EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short communique-style text (180-220 words). Answer 2 literal questions and 2 independent-judgement questions ("Identify one point on which the parties have clearly not agreed, despite the text implying progress. What language reveals this?").

WRITING TASK (5 min): Write four sentences advancing a position you actually hold, using impersonal construction and at least one litotes -- then, underneath, write the plain-English version, and check they genuinely match.

PRONUNCIATION PRACTICE (5 min): The level, unemphatic delivery diplomatic register requires -- this language loses its function entirely if delivered with visible emotion, and the deliberate flatness is itself the professional skill.

VOCABULARY REINFORCEMENT: a diplomatic-vocabulary matching game (communique, demarche, accession, ratification, bilateral, good offices, without prejudice).

FORMATIVE ASSESSMENT: Instructor checks that hedged rewrites remain decodable -- the position must survive the hedging.

HOMEWORK: Select a real or invented international issue with at least three distinct party interests and prepare a one-paragraph brief of your assigned party''s position, ready for Lesson 2.2''s negotiation.

REVISION: Lesson 2.2 opens with learners stating their party''s core interest in one sentence.

EXTENSION: Find one example of litotes in a real speech or document and explain precisely what strength it conveys and why plainer wording was avoided.'),

('itm_l6_m2_lesson2', 'unt_l6_m2', 3, 'reading', 'Lesson 2.2 -- Around the Table -- Multi-Party Diplomatic Negotiation & Strategic Recommendations',
'LEARNING OBJECTIVES: (1) conduct a negotiation with three or more parties, tracking multiple interests simultaneously, (2) signal flexibility without conceding, and firmness without foreclosing, (3) identify and use the distinction between a party''s stated position and its underlying interest, (4) write a set of strategic recommendations that are specific, prioritised, and honest about trade-offs.

PREREQUISITE KNOWLEDGE: Lesson 2.1 (diplomatic register); Level V, Module 5 (intercultural negotiation).

WARM-UP (5 min): Your instructor states a negotiating position ("We require the deadline to be extended by six months") and asks you to propose three different underlying interests that could produce that same stated position.

PRESENTATION (10 min): POSITION vs. INTEREST: a position is what a party says it wants; an interest is why. Two parties with incompatible positions may have compatible interests, which is what makes agreement possible at all. Multi-party technique: tracking each party''s interest aloud ("As I understand it, your concern is primarily about sequencing rather than the substance"), building a coalition on a sub-issue, and using diplomatic register to keep an unattractive option formally alive ("We would not wish to rule that out at this stage"). The strategic-recommendations format: PRIORITISED (not a flat list), SPECIFIC (named action, owner, timeframe), and HONEST ABOUT TRADE-OFFS (each recommendation states what it costs).

GUIDED PRACTICE (10 min): You are given 6 stated positions and infer a plausible underlying interest for each, then propose one option that could satisfy two apparently opposed interests.

INDEPENDENT PRACTICE (10 min): In groups of three or four, using your Lesson 2.1 homework briefs, prepare your party''s opening statement, one concession you could make, and one point you cannot move on.

SPEAKING ACTIVITY -- MULTI-PARTY DIPLOMATIC NEGOTIATION: Groups conduct a full negotiation (8-10 minutes): opening statements in diplomatic register, a substantive exchange in which each party must correctly identify at least one other party''s underlying interest, and an attempt to reach a communique-style joint statement -- or an honest acknowledgement of where agreement was not reached.

CRITICAL THINKING / DISCUSSION PROMPT: "In your negotiation, was any agreement reached that papered over a real disagreement rather than resolving it? Is such an agreement worth having?"

LISTENING ACTIVITY (5 min): Listen to a three-party negotiation extract and map each party''s stated position against its likely underlying interest.

READING ACTIVITY (5 min): Read a short set of published-style strategic recommendations and assess whether each is genuinely specific and prioritised, or whether any is a generality dressed as a recommendation.

WRITING TASK (5 min): Draft two strategic recommendations arising from your negotiation, each naming an action, an owner, a timeframe, and its trade-off.

PRONUNCIATION PRACTICE (5 min): The measured pacing and deliberate pausing of multi-party negotiation -- including the professional use of a silence after another party''s statement, which in this register signals consideration rather than confusion.

VOCABULARY REINFORCEMENT: a negotiation-collocation matching game (sound out, walk back, paper over, broker, table -- with the BrE/AmE "table" reversal explicitly re-tested).

FORMATIVE ASSESSMENT: Instructor checks that each learner correctly identifies at least one other party''s underlying interest, and that recommendations name a trade-off rather than presenting costless options.

HOMEWORK: Complete your strategic recommendations for Module 2''s assignment.

REVISION: This lesson opens with the Lesson 2.1 party-interest recap. Module 2''s Quiz and Assignment draw on both lessons.

EXTENSION: Draft the joint communique in full diplomatic register, ensuring it is honest about what was not agreed while remaining publishable by all parties.'),

('itm_l6_m2_quiz', 'unt_l6_m2', 4, 'quiz', 'Module 2 Quiz -- Diplomacy & International Relations', NULL),

('itm_l6_m2_assignment', 'unt_l6_m2', 5, 'assignment', 'Module 2 Assignment -- Strategic Recommendations & a Diplomatic Negotiation',
'INSTRUCTIONS: Complete two parts on one real or invented international issue with at least three distinct party interests. PART A (writing, this level''s second genre): strategic recommendations, 600-750 words, comprising a brief situation assessment, an analysis of each party''s stated position and inferred underlying interest, and 3-4 prioritised recommendations -- each naming a specific action, an owner, a timeframe, and its trade-off. Write the recommendations in appropriate diplomatic register, including at least one litotes used at the correct strength. PART B (speaking): a diplomatic negotiation, 3-4 minutes as your assigned party. You must state your position in diplomatic register, correctly identify at least one other party''s underlying interest aloud, and either signal a genuine concession or decline one without foreclosing the discussion.

GRADING RUBRIC: (1) Grammatical accuracy -- accurate impersonal constructions and correctly formed litotes; sustained high-formal register. (2) Vocabulary range -- at least 4 distinct diplomatic/IR terms used precisely, plus one phrasal verb/collocation from this module. (3) Task completion -- situation assessment, position/interest analysis, and prioritised recommendations with trade-offs in Part A; position statement, interest identification, and concession handling in Part B. (4) Independent judgement -- does the position/interest analysis reach a genuinely non-obvious inference about at least one party, rather than restating stated positions? (5) Discourse coherence & register -- is the diplomatic register sustained without the underlying position becoming unrecoverable, and are the recommendations decodable into plain action?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m2_1', 'itm_l6_m2_quiz', 1, 'In British and Commonwealth usage, "to table a proposal" means:', '["to postpone it","to put it forward for discussion","to reject it","to vote on it immediately"]', 1),
('qq_l6_m2_2', 'itm_l6_m2_quiz', 2, 'In American usage, "to table a proposal" means:', '["to put it forward for discussion","to postpone or shelve it","to ratify it","to publish it"]', 1),
('qq_l6_m2_3', 'itm_l6_m2_quiz', 3, 'Which is the strongest objection, in diplomatic register?', '["We have some concerns.","This is not a position we could readily support.","We would like more information.","We note the proposal."]', 1),
('qq_l6_m2_4', 'itm_l6_m2_quiz', 4, '"It may be felt in some quarters that further consultation would be prudent." The main function of this construction is to:', '["identify precisely who holds the view","advance a position without attributing it to a named person","express strong personal emotion","close the discussion permanently"]', 1),
('qq_l6_m2_5', 'itm_l6_m2_quiz', 5, '"Not unhelpful" conveys:', '["stronger praise than \"helpful\"","weaker praise than \"helpful\"","exactly the same as \"helpful\"","outright criticism"]', 1),
('qq_l6_m2_6', 'itm_l6_m2_quiz', 6, 'What is the difference between a party''s position and its interest?', '["there is none","the position is what it says it wants; the interest is why","the interest is always public","the position is always hidden"]', 1),
('qq_l6_m2_7', 'itm_l6_m2_quiz', 7, 'In the United Kingdom, the head of a government department is typically titled:', '["Minister or Secretary of State","Attorney","Governor","Commissioner only"]', 0),
('qq_l6_m2_8', 'itm_l6_m2_quiz', 8, 'Which phrase means "discreetly test a party''s position before committing"?', '["walk back","sound out","paper over","broker"]', 1),
('qq_l6_m2_9', 'itm_l6_m2_quiz', 9, 'Which phrase means "conceal a disagreement rather than resolve it"?', '["broker","sound out","paper over","table"]', 2),
('qq_l6_m2_10', 'itm_l6_m2_quiz', 10, 'A strategic recommendation is strongest when it is:', '["general enough to suit any situation","specific, prioritised, and honest about its trade-off","presented as costless","unattributed to any owner"]', 1);

-- ---------------------------------------------------------------------
-- Module 3: Global Business Strategy
-- Full prose version: docs/curriculum/level-6/module-03-global-business-strategy.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m3', 'crs_level_6', 3, 'Module 3: Global Business Strategy');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m3_overview', 'unt_l6_m3', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Central to this strategy is... -- So significant were the gains that... -- What this does not address is... -- Our working assumption is... -- The evidence supports X; the inference is Y; the recommendation is Z.

DISCOURSE MARKERS (functional set -- separating evidence, inference, and recommendation): "the evidence indicates", "from which we infer", "on that basis we recommend", "our working assumption is" -- the single most important disciplinary habit in strategic writing. Most weak executive reports fail not because their recommendation is wrong but because the reader cannot tell where observed fact ends and interpretation begins. Naming the three layers explicitly is what makes a strategy document auditable.

PHRASAL VERBS & COLLOCATIONS: "scale back [an initiative]" (reduce its scope deliberately), "double down (on a strategy)" (commit further despite early difficulty), "spin off [a division]" (separate it into an independent entity), "shore up [a position]" (strengthen something weakening), "bed in" (BrE: of a change or system, to become established and start working properly over time).

BrE / AmE NOTE -- A GENUINE FALSE FRIEND: "turnover" in British business English means REVENUE ("the company reported a turnover of 40 million pounds"); in American business English, "turnover" almost always means STAFF ATTRITION ("we have a turnover problem in engineering"). A single sentence can therefore be read as a statement about sales or about resignations depending on the reader''s variety. Related: British "profit and loss account" vs. American "income statement"; British "shares/shareholder" vs. American "stock/stockholder".

KEY VOCABULARY: strategy vocabulary (value proposition, competitive moat, market positioning, capital allocation, scenario planning, downside case). Intercultural note: boardroom communication norms differ markedly -- the degree to which junior presenters are expected to be challenged directly varies by corporate and national culture; this module rehearses direct in-meeting challenge as a convention rather than a universal.'),

('itm_l6_m3_lesson1', 'unt_l6_m3', 2, 'reading', 'Lesson 3.1 -- Central to This Strategy Is -- Fronting & Complex Inversion for Strategic Emphasis',
'LEARNING OBJECTIVES: (1) front a complement for emphasis, with the subject-verb inversion this triggers, (2) form so/such inversions accurately, (3) choose between fronting, cleft (Level V, Module 6) and inversion (Level V, Module 3) according to which element genuinely needs emphasis, (4) avoid the characteristic failure of this register -- emphasis applied so frequently that nothing is emphasised.

PREREQUISITE KNOWLEDGE: Level V, Module 3 (inversion after negative adverbials) and Module 6 (cleft sentences).

WARM-UP (5 min): Your instructor writes one plain sentence and three emphatic rewrites -- a cleft, a negative-adverbial inversion, and a fronted complement -- which element does each version emphasise?

PRESENTATION (10 min): COMPLEMENT FRONTING: "Central to this strategy is a fundamental shift in how we allocate capital." (Compare the plain "A fundamental shift in how we allocate capital is central to this strategy" -- same content, different weight.) SO/SUCH INVERSION: "So significant were the first-quarter gains that the board approved a second phase." "Such was the scale of the change that three functions were restructured." Fronting puts the evaluative frame first and the substance in the stressed final position. The failure mode: a document in which every sentence is emphatic reads as breathless, and the reader stops registering emphasis at all -- these constructions work by contrast with plainer neighbours.

GUIDED PRACTICE (10 min): Convert 8 plain strategic sentences into fronted or inverted form as directed, then -- for 4 further sentences -- choose whether a cleft, an inversion, or a fronting best serves the emphasis required, and justify the choice.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draft a 6-sentence strategic paragraph in which EXACTLY TWO sentences use an emphasis construction and the rest are deliberately plain, then exchange with a partner, who identifies which two were emphasised and whether those were the right two.

CRITICAL THINKING / DISCUSSION PROMPT: "Emphasis constructions make a claim feel more significant. Does that make them a legitimate tool of clear communication, or a way of making a thin argument sound weighty? How would you tell, as a reader, which you were looking at?"

LISTENING ACTIVITY (5 min): Listen to a short strategy presentation extract and note each emphasis construction used and which element it foregrounds.

READING ACTIVITY -- EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short strategic-report extract (180-220 words) using emphasis constructions. Answer 2 literal questions and 2 independent-judgement questions ("Identify one claim that is emphasised more strongly than its supporting evidence warrants. What would you need to see to accept it?").

WRITING TASK (5 min): Write three sentences about a real or invented strategic decision: one fronted, one so/such inversion, one deliberately plain -- and say which carries the most weight and why.

PRONUNCIATION PRACTICE (5 min): The stress contour of a fronted sentence read aloud -- the fronted element takes a lifted, sustained delivery and the sentence resolves onto a strongly stressed final noun phrase.

VOCABULARY REINFORCEMENT: a strategy-vocabulary matching game (value proposition, competitive moat, market positioning, capital allocation, scenario planning, downside case).

FORMATIVE ASSESSMENT: Instructor checks correct inversion after fronting (a frequent error is fronting without inverting) and, more importantly, restraint -- no more than two emphasis constructions per paragraph.

HOMEWORK: Select a real or invented strategic decision facing an organisation you know, and note the evidence available, what you infer from it, and what you would recommend -- kept as three separate lists, ready for Lesson 3.2.

REVISION: Lesson 3.2 opens with learners naming their strategic decision in one sentence.

EXTENSION: Rewrite a paragraph from your own Level V work using one emphasis construction, and assess honestly whether it improved.'),

('itm_l6_m3_lesson2', 'unt_l6_m3', 3, 'reading', 'Lesson 3.2 -- The Board Will See You Now -- Boardroom Presentation & the Executive Report',
'LEARNING OBJECTIVES: (1) structure an executive report that visibly separates evidence, inference, and recommendation, (2) state working assumptions explicitly, so they can be challenged, (3) present to a board-level audience and respond to challenges aimed at your assumptions rather than your conclusions, (4) concede an assumption without abandoning a recommendation where that is honest -- or withdraw the recommendation, where it is not.

PREREQUISITE KNOWLEDGE: Lesson 3.1 (emphasis constructions); Level V, Module 9 (bottom-line-up-front executive reporting) and Module 8 (defending a position under challenge).

WARM-UP (5 min): Your instructor states a recommendation and asks the class to challenge it -- then points out that most challenges attacked the conclusion, and asks what a challenge to the assumption beneath it would have looked like.

PRESENTATION (10 min): The three-layer discipline: EVIDENCE ("Unit sales fell 12% across two consecutive quarters" -- observable, checkable), INFERENCE ("From which we infer that the decline is structural rather than seasonal" -- a judgement, and the layer where reasonable people disagree), RECOMMENDATION ("On that basis we recommend deferring the capacity expansion"). The WORKING ASSUMPTION statement -- "Our working assumption is that competitor pricing holds at current levels; if that assumption fails, the recommendation changes" -- is the mark of a serious strategy document: it tells the board exactly which assumption to interrogate, and pre-commits the author to changing their view if it breaks. Boardroom Q&A in which the challenge lands on the assumption has two honest responses: conceding the assumption while showing the recommendation survives on other grounds, and conceding that it does not.

GUIDED PRACTICE (10 min): Sort 9 statements from a provided report into evidence, inference, and recommendation, then identify the two unstated assumptions the report depends on.

INDEPENDENT PRACTICE (10 min): Using your Lesson 3.1 homework lists, draft the core of an executive report -- evidence, inference, recommendation, each labelled -- plus one explicitly stated working assumption, and prepare a 90-second board presentation.

SPEAKING ACTIVITY -- BOARDROOM PRESENTATION: Present to a small group acting as a board, which must challenge the STATED ASSUMPTION (not the conclusion); respond honestly, either defending the recommendation on other grounds or conceding that it does not survive.

CRITICAL THINKING / DISCUSSION PROMPT: "Stating your working assumption invites people to attack it. Why might a presenter do that deliberately? Is there a situation where you would judge it wiser not to?"

LISTENING ACTIVITY (5 min): Listen to a board exchange and identify whether the challenge was aimed at evidence, inference, or assumption -- and whether the presenter answered the question actually asked.

READING ACTIVITY (5 min): Read a short executive report extract and mark where it blurs inference into evidence -- the most common failure of the genre.

WRITING TASK (5 min): Write your report''s recommendation section, including one sentence naming the condition under which you would change your recommendation.

PRONUNCIATION PRACTICE (5 min): Unhurried, level delivery when conceding a point under board challenge -- conceding quickly and calmly reads as confidence, while a rushed or defensive concession undermines the entire presentation.

VOCABULARY REINFORCEMENT: a business-English precision game including the "turnover" false friend, "profit and loss account"/"income statement", and "shares"/"stock", with learners identifying which variety each sentence assumes.

FORMATIVE ASSESSMENT: Instructor checks that evidence, inference, and recommendation are genuinely separated (not merely labelled) and that at least one working assumption is stated in falsifiable terms.

HOMEWORK: Complete your executive report for Module 3''s assignment.

REVISION: This lesson opens with the Lesson 3.1 decision recap. Module 3''s Quiz and Assignment draw on both lessons.

EXTENSION: Write the DOWNSIDE CASE -- a short section setting out what happens if your central inference is wrong.'),

('itm_l6_m3_quiz', 'unt_l6_m3', 4, 'quiz', 'Module 3 Quiz -- Global Business Strategy', NULL),

('itm_l6_m3_assignment', 'unt_l6_m3', 5, 'assignment', 'Module 3 Assignment -- An Executive Report & Boardroom Presentation',
'INSTRUCTIONS: Complete two parts on one real or invented strategic decision. PART A (writing, this level''s third genre): an executive report, 700-850 words, that visibly separates EVIDENCE, INFERENCE, and RECOMMENDATION -- using this module''s discourse markers to signal each transition -- and states at least one WORKING ASSUMPTION in falsifiable terms, naming the condition under which the recommendation would change. Use exactly two emphasis constructions from Lesson 3.1, no more, placed where the emphasis is genuinely warranted. PART B (speaking): a boardroom presentation, 90 seconds to 2 minutes, delivering the report''s core to a board-level audience, and responding to at least one challenge aimed at your stated assumption.

GRADING RUBRIC: (1) Grammatical accuracy -- correct inversion after fronting; accurate so/such constructions; sustained formal register. (2) Vocabulary range -- at least 4 distinct strategy or governance terms used precisely, plus one phrasal verb/collocation from this module; no misuse of the "turnover" false friend. (3) Task completion -- evidence, inference, recommendation, and a falsifiable working assumption all present and distinguishable in Part A; a challenge to the assumption answered honestly in Part B. (4) Independent judgement -- is the inference genuinely the writer''s own reasoning from the evidence presented, and does the recommendation follow from it rather than preceding it? (5) Discourse coherence & register -- is emphasis used with restraint so that it still functions, and does the report remain auditable?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m3_1', 'itm_l6_m3_quiz', 1, '"Central to this strategy ___ a fundamental shift in capital allocation." (fronted complement)', '["is","it is","being","which is"]', 0),
('qq_l6_m3_2', 'itm_l6_m3_quiz', 2, '"So significant ___ the first-quarter gains that the board approved a second phase."', '["was","were","they were","have been"]', 1),
('qq_l6_m3_3', 'itm_l6_m3_quiz', 3, '"___ was the scale of the change that three functions were restructured."', '["So","Such","Very","Much"]', 1),
('qq_l6_m3_4', 'itm_l6_m3_quiz', 4, 'What is the characteristic failure of emphasis constructions in strategic writing?', '["they are grammatically incorrect","overuse, so that nothing registers as emphasised","they are too informal","they cannot be used in reports"]', 1),
('qq_l6_m3_5', 'itm_l6_m3_quiz', 5, 'In British business English, "turnover" normally means:', '["staff attrition","revenue","profit","inventory"]', 1),
('qq_l6_m3_6', 'itm_l6_m3_quiz', 6, 'In American business English, "turnover" most often means:', '["revenue","staff attrition","dividend","market share"]', 1),
('qq_l6_m3_7', 'itm_l6_m3_quiz', 7, '"Unit sales fell 12% across two consecutive quarters." In the three-layer discipline, this is:', '["evidence","inference","recommendation","assumption"]', 0),
('qq_l6_m3_8', 'itm_l6_m3_quiz', 8, '"From which we infer that the decline is structural rather than seasonal." This is:', '["evidence","inference","recommendation","observation"]', 1),
('qq_l6_m3_9', 'itm_l6_m3_quiz', 9, 'Why does a serious strategy document state its working assumptions explicitly?', '["to lengthen the report","to tell the reader exactly which assumption to interrogate, and to pre-commit the author to changing their view if it fails","to avoid making a recommendation","to prevent any challenge"]', 1),
('qq_l6_m3_10', 'itm_l6_m3_quiz', 10, 'Which phrase means "strengthen something that is weakening"?', '["scale back","spin off","shore up","bed in"]', 2);

-- ---------------------------------------------------------------------
-- Module 4: Public Policy
-- Full prose version: docs/curriculum/level-6/module-04-public-policy.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m4', 'crs_level_6', 4, 'Module 4: Public Policy');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m4_overview', 'unt_l6_m4', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: The authority shall... -- An applicant must... -- The Secretary of State may... -- Providers are to ensure that... -- Assessed against the criterion of..., option B performs... -- On balance, and subject to the caveat that...

DISCOURSE MARKERS (functional set -- criterion-based assessment): "assessed against the criterion of", "on this measure", "subject to the caveat that", "the option that best satisfies" -- language for evaluating options against declared standards rather than asserting a preference. State your criteria before you state your conclusion, so a reader can disagree with the criteria rather than merely with you.

PHRASAL VERBS & COLLOCATIONS: "roll out [a policy]" (implement it progressively), "phase in/phase out" (introduce or withdraw gradually), "ring-fence [funding]" (BrE: protect a budget from being spent on anything else), "water down [a provision]" (weaken it, usually through negotiation), "bring [a measure] into force".

BrE / AmE NOTE -- A REAL GRAMMATICAL DIVERGENCE: British English frequently treats COLLECTIVE NOUNS AS PLURAL when the members are acting individually: "the Government ARE considering the proposal"; "the committee HAVE reached different conclusions". American English almost invariably treats them as SINGULAR: "the government IS considering". Both are correct within their variety; in policy writing a mastery-level writer chooses one convention and applies it consistently. Related: British "Parliament", "Whitehall", and "the Treasury" map onto American "Congress", "the federal bureaucracy", and "the Treasury Department", but the institutions are not equivalent.

KEY VOCABULARY: policy vocabulary (statutory instrument, consultation, impact assessment, unintended consequence, implementation gap, sunset clause, discretion), evaluation vocabulary (efficacy, equity, feasibility, proportionality, deadweight cost). Intercultural note: the relationship between elected officials and permanent civil servants differs substantially between systems; this module''s drafting conventions follow a Westminster-derived model, named as a choice rather than presented as universal.'),

('itm_l6_m4_lesson1', 'unt_l6_m4', 2, 'reading', 'Lesson 4.1 -- Shall, Must, May, Should -- The Modality of Obligation in Policy Drafting',
'LEARNING OBJECTIVES: (1) distinguish the operative force of shall, must, is to, may, and should in a policy or regulatory text, (2) recognise that "may" confers discretion, not permission-as-politeness, and that misreading it inverts a provision''s meaning, (3) identify where a drafted provision is ambiguous as to whether it binds, (4) draft a short set of provisions in which each obligation''s force is unambiguous.

PREREQUISITE KNOWLEDGE: Level V, Module 4 (hedging and qualifying claims) and Level VI, Module 1 (the subjunctive in formal recommendation).

WARM-UP (5 min): Your instructor writes four provisions differing only in modal -- "The authority SHALL publish...", "MUST publish...", "MAY publish...", "SHOULD publish..." -- which of the four could a court or regulator enforce?

PRESENTATION (10 min): The operative scale: SHALL -- the traditional drafting term of obligation, binding (now criticised in plain-language drafting movements precisely because lay readers read it as future tense, and increasingly replaced by "must"); MUST -- binding obligation, unambiguous to lay readers, the preferred modern form; IS TO -- binding, common in British statutory instruments, slightly softer in tone; MAY -- confers a DISCRETION (the body can act, and cannot be compelled to), which lay readers routinely misread as mere permission; SHOULD -- non-binding guidance, persuasive only. Substituting "should" for "must" in a single provision can remove an entire enforcement mechanism, which is precisely why such substitutions are negotiated so hard -- the module''s "water down" collocation names exactly this move.

GUIDED PRACTICE (10 min): Classify 8 provisions by operative force (binding / discretionary / guidance), then identify which of 4 further provisions are genuinely ambiguous as to whether they bind, and why.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draft 5 provisions for a real or invented regulatory scheme -- at least one binding, one discretionary, one guidance -- then exchange with a partner, who states for each whether the addressee could be compelled to act.

CRITICAL THINKING / DISCUSSION PROMPT: "Plain-language drafting movements argue that ''shall'' should be abolished in favour of ''must'', because ordinary readers misunderstand it. Traditional drafters argue that centuries of case law give ''shall'' a settled meaning that ''must'' lacks. Which argument do you find stronger, and why?"

LISTENING ACTIVITY (5 min): Listen to a committee discussion of a draft provision and identify precisely which modal change is being proposed and what it would do to the provision''s force.

READING ACTIVITY -- EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short regulatory extract (180-220 words). Answer 2 literal questions and 2 independent-judgement questions ("Identify one provision whose operative force is unclear. Would you redraft it as binding or discretionary, and what turns on that choice?").

WRITING TASK (5 min): Redraft three ambiguous provisions so that each one''s operative force is unambiguous.

PRONUNCIATION PRACTICE (5 min): The deliberate, evenly weighted delivery of provisions read aloud into a record -- modal verbs in this register receive full, unreduced pronunciation, because the distinction between them carries legal weight.

VOCABULARY REINFORCEMENT: a policy-vocabulary matching game (statutory instrument, consultation, impact assessment, unintended consequence, implementation gap, sunset clause, discretion).

FORMATIVE ASSESSMENT: Instructor checks that each drafted provision''s force is read by the partner as the drafter intended -- the only meaningful test of drafting precision.

HOMEWORK: Select a real or invented policy problem with at least three plausible options and draft the CRITERIA by which you will assess them (not yet the assessment), ready for Lesson 4.2.

REVISION: Lesson 4.2 opens with learners reading out their criteria.

EXTENSION: Find a real provision using "may" and explain what would change if it read "must".'),

('itm_l6_m4_lesson2', 'unt_l6_m4', 3, 'reading', 'Lesson 4.2 -- Weighing the Options -- Policy Analysis & the Policy Panel',
'LEARNING OBJECTIVES: (1) structure a policy analysis around declared criteria applied consistently to every option, (2) resist the characteristic failure of the genre -- reverse-engineering criteria to justify a preferred option, (3) represent a defined constituency in a policy panel while engaging honestly with the analysis, (4) state a recommendation with its caveats and its distributional consequences.

PREREQUISITE KNOWLEDGE: Lesson 4.1 (modality of obligation); Level V, Module 4 (stakeholder meetings and policy briefs).

WARM-UP (5 min): Your instructor presents a policy analysis whose criteria are transparently chosen to make one option win -- how can you tell?

PRESENTATION (10 min): The option-appraisal structure: CRITERIA DECLARED FIRST (efficacy, equity, feasibility, proportionality, cost -- with each defined, because "equity" undefined does no work), EVERY OPTION ASSESSED AGAINST EVERY CRITERION (including the option the analyst dislikes, assessed fairly), THE TRADE-OFF NAMED EXPLICITLY ("Option B is more effective but less equitable; the choice between them is a value judgement, not a technical one"), and THE RECOMMENDATION STATED WITH ITS DISTRIBUTIONAL CONSEQUENCE ("this recommendation concentrates the cost on X while spreading the benefit across Y"). The genre''s characteristic failure: criteria selected after the conclusion. The tell is usually a criterion that appears once, does decisive work, and is never mentioned again.

GUIDED PRACTICE (10 min): Assess 3 provided options against 3 provided criteria in a simple matrix, then identify which single criterion, if reweighted, would change the winning option -- the sensitivity question every serious analysis should answer.

INDEPENDENT PRACTICE (10 min): Using your Lesson 4.1 homework criteria, assess your own three options and draft the trade-off statement and recommendation, including its distributional consequence.

SPEAKING ACTIVITY -- POLICY PANEL DISCUSSION: In groups, you are assigned distinct constituencies affected by the policy (those who bear the cost, those who receive the benefit, those responsible for implementation) and hold a panel discussion (6-8 minutes) in which each must engage with the ANALYSIS, not merely assert their constituency''s preference -- and each must concede at least one point where the analysis genuinely disfavours them.

CRITICAL THINKING / DISCUSSION PROMPT: "Policy analysis presents itself as technical, but the choice and weighting of criteria is a value judgement. Does that make the technical apparatus dishonest, or is making the value judgement explicit and contestable precisely its purpose?"

LISTENING ACTIVITY (5 min): Listen to a policy panel exchange and identify one contribution that engaged with the analysis and one that merely restated a constituency''s preference.

READING ACTIVITY (5 min): Read a short published-style policy analysis and assess whether its criteria were genuinely declared in advance or appear reverse-engineered.

WRITING TASK (5 min): Write your analysis''s trade-off paragraph, naming explicitly what is being traded against what, and who bears each side of the trade.

PRONUNCIATION PRACTICE (5 min): Neutral, non-advocating delivery for reading an option appraisal aloud -- the analyst''s voice in this genre is deliberately even across options, and audible enthusiasm for one option undermines the appraisal''s credibility.

VOCABULARY REINFORCEMENT: an evaluation-vocabulary matching game (efficacy, equity, feasibility, proportionality, deadweight cost), plus a British/American collective-noun agreement drill.

FORMATIVE ASSESSMENT: Instructor checks that every option is assessed against every criterion -- including the option the learner disfavours -- and that the recommendation names a distributional consequence.

HOMEWORK: Complete your policy analysis for Module 4''s assignment.

REVISION: This lesson opens with the Lesson 4.1 criteria recap. Module 4''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a SENSITIVITY PARAGRAPH identifying the single assumption or criterion weighting that, if changed, would reverse your recommendation.'),

('itm_l6_m4_quiz', 'unt_l6_m4', 4, 'quiz', 'Module 4 Quiz -- Public Policy', NULL),

('itm_l6_m4_assignment', 'unt_l6_m4', 5, 'assignment', 'Module 4 Assignment -- A Policy Analysis & Panel Contribution',
'INSTRUCTIONS: Complete two parts on one real or invented policy problem with at least three plausible options. PART A (writing, this level''s fourth genre): a policy analysis, 700-850 words, which declares its assessment criteria BEFORE any assessment, defines each criterion, assesses EVERY option against EVERY criterion (including the option you personally disfavour, assessed fairly), states the central trade-off explicitly, and closes with a recommendation naming its distributional consequence and at least one caveat. Draft at least 3 provisions implementing your recommendation, using "must", "may", and "should" with correct and deliberate operative force. PART B (speaking): a policy panel contribution, 2-3 minutes, representing a defined constituency -- engaging with the analysis rather than merely asserting a preference, and conceding at least one point where the analysis genuinely disfavours your constituency.

GRADING RUBRIC: (1) Grammatical accuracy -- modal verbs used with correct and consistent operative force; consistent collective-noun agreement in whichever variety the learner adopts. (2) Vocabulary range -- at least 4 distinct policy or evaluation terms used precisely, plus one phrasal verb/collocation from this module. (3) Task completion -- criteria declared and defined first, all options assessed against all criteria, trade-off stated, distributional consequence named, and 3 correctly-forced provisions drafted in Part A; constituency represented with a genuine concession in Part B. (4) Independent judgement -- is the disfavoured option genuinely assessed fairly, and does the recommendation follow from the criteria rather than the criteria from the recommendation? (5) Discourse coherence & register -- is the analytical voice even across options, and is the register appropriate to a document intended for decision-makers?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m4_1', 'itm_l6_m4_quiz', 1, 'In regulatory drafting, "The authority may publish guidance" confers:', '["a binding obligation","a discretion the authority cannot be compelled to exercise","a prohibition","non-binding guidance to the public"]', 1),
('qq_l6_m4_2', 'itm_l6_m4_quiz', 2, 'Which modal creates a binding obligation and is preferred by plain-language drafting movements?', '["should","must","may","might"]', 1),
('qq_l6_m4_3', 'itm_l6_m4_quiz', 3, 'Why do plain-language drafters criticise "shall"?', '["it is grammatically incorrect","lay readers often read it as a future tense rather than an obligation","it is too modern","it cannot be used with institutions"]', 1),
('qq_l6_m4_4', 'itm_l6_m4_quiz', 4, '"Providers are to ensure that records are retained." This provision is:', '["binding","purely advisory","a prohibition","a discretion"]', 0),
('qq_l6_m4_5', 'itm_l6_m4_quiz', 5, 'Substituting "should" for "must" in a provision typically:', '["strengthens it","removes its enforceability","has no effect","makes it retrospective"]', 1),
('qq_l6_m4_6', 'itm_l6_m4_quiz', 6, 'In British English, which is standard when the members of a body are acting individually?', '["\"The Government is considering\" only","\"The Government are considering\"","neither is acceptable","\"The Government were consider\""]', 1),
('qq_l6_m4_7', 'itm_l6_m4_quiz', 7, 'What is the characteristic failure of a weak policy analysis?', '["too many options considered","criteria reverse-engineered to justify a predetermined option","declaring criteria in advance","assessing every option fairly"]', 1),
('qq_l6_m4_8', 'itm_l6_m4_quiz', 8, 'A serious policy analysis states its recommendation together with:', '["nothing further","its distributional consequence -- who bears the cost and who receives the benefit","only its political feasibility","a guarantee of success"]', 1),
('qq_l6_m4_9', 'itm_l6_m4_quiz', 9, 'In British usage, to "ring-fence" funding means to:', '["reduce it","protect it from being spent on anything else","delay it","publish it"]', 1),
('qq_l6_m4_10', 'itm_l6_m4_quiz', 10, 'Which phrase means "weaken a provision, usually through negotiation"?', '["roll out","phase in","water down","bring into force"]', 2);
