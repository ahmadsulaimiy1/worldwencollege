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
'KEY PHRASES: It is imperative that... — We recommend that the committee review... — I take full responsibility for... — On reflection, what I would do differently is... — The decision rests with me. — Let me set out where we stand.

DISCOURSE MARKERS (functional set — accountable leadership framing): "I take responsibility for", "the decision rests with", "on reflection", "what I would do differently is" — language that assigns ownership explicitly rather than diffusing it. This register has a genuine ethical dimension: the passive constructions available at earlier levels ("mistakes were made") let a speaker describe a failure without owning it, and this module deliberately teaches the opposite move.

PHRASAL VERBS & COLLOCATIONS: "step up" (take on greater responsibility when needed), "carry the can" (BrE idiom: take the blame, often for others'' actions), "set the direction", "own the outcome", "front up (to something)" (face a difficulty or one''s own error openly).

BrE / AmE NOTE: a British company has a "board of directors" in which "executive" and "non-executive directors" sit, with a "chairman/chair" as the senior independent figure; American usage more commonly distinguishes "inside" and "outside directors" and uses "board member", with "Chairman of the Board" and "CEO" sometimes held by the same person — a structure British corporate-governance convention has generally discouraged. The terms are not interchangeable across the two systems.

KEY VOCABULARY: executive-leadership vocabulary (mandate, remit, accountability, delegation, succession, stewardship), reflective-practice vocabulary (self-assessment, blind spot, development plan, growth edge). Intercultural note: how directly a leader is expected to claim personal responsibility varies significantly across professional cultures; this module teaches explicit ownership as one widely respected international-executive convention, while naming that its directness is itself culturally situated.'),

('itm_l6_m1_lesson1', 'unt_l6_m1', 2, 'reading', 'Lesson 1.1 — It Is Imperative That He Be Informed — The Subjunctive in Executive Register',
'LEARNING OBJECTIVES: (1) form the mandative subjunctive correctly after verbs and adjectives of demand, recommendation, and necessity, (2) recognise that the subjunctive form is invariant — no third-person -s, and "be" rather than "is/are", (3) choose appropriately between subjunctive and the "should"-alternative, knowing which is more formal and which is more common in British usage, (4) draft a formal recommendation or resolution.

PREREQUISITE KNOWLEDGE: Level V, Module 3 (inversion for emphasis) and Module 4 (hedging/qualifying).

WARM-UP (5 min): Your instructor writes two versions of one recommendation — "We recommend that the committee reviews the policy" and "We recommend that the committee review the policy" — which is correct? (Both are used; the second is the subjunctive and the more formal.)

PRESENTATION (10 min): "It is imperative that every director be briefed before the vote. The board requires that the report be circulated in advance. We propose that the chair convene an extraordinary meeting." The subjunctive uses the BASE FORM regardless of subject — "be", not "is"; "convene", not "convenes" — and its negative is "not + base form" ("We insist that he not attend"), with no auxiliary "do". Register/variety nuance: American English uses the mandative subjunctive very consistently in formal writing; British English frequently prefers "should + base form", with the bare subjunctive reading as either very formal or slightly American to some British readers. Neither is wrong; a mastery-level writer chooses knowingly.

GUIDED PRACTICE (10 min): Convert 8 "should"-form recommendations into bare-subjunctive form and identify which of a further 4 sentences contain a subjunctive error.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draft 5 formal recommendations relating to a real or invented organisational decision, using the subjunctive accurately, then exchange with a partner who checks each for the invariant base form and correct negation. Read your strongest recommendation aloud in a formal register; your partner responds in kind.

CRITICAL THINKING / DISCUSSION PROMPT: "The subjunctive survives almost exclusively in formal, institutional English — resolutions, recommendations, legal drafting. Why do you think a construction that has largely disappeared from everyday speech persists so strongly in these specific contexts?"

LISTENING ACTIVITY (5 min): Listen to a formal board-meeting extract (6-8 sentences) containing several subjunctive constructions and transcribe the exact verb forms used, noting any "should"-alternatives.

READING ACTIVITY — EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short formal governance document extract (180-200 words) using subjunctive constructions. Answer 2 literal questions and 2 independent-judgement questions ("Does the document''s formality serve its readers, or does it obscure what is actually being decided? Justify your view with specific reference to the text.").

WRITING TASK (5 min): Draft a three-sentence formal resolution using the subjunctive at least twice.

PRONUNCIATION PRACTICE (5 min): The slightly marked stress and pacing of formal subjunctive constructions read aloud ("It is IMperative that every DIRector be BRIEFED") — the deliberate, weighted delivery formal resolutions receive when read into a meeting record.

VOCABULARY REINFORCEMENT: an executive-governance vocabulary matching game (mandate, remit, accountability, delegation, succession, stewardship) with precise definitions — note that "remit" (BrE, the scope of one''s authority) is itself a register marker.

FORMATIVE ASSESSMENT: Instructor checks accurate invariant base forms and correct subjunctive negation during independent practice.

HOMEWORK: Complete the Level VI ENTRY DIAGNOSTIC: a structured self-assessment across the eight graduate attributes (rating current confidence, naming one specific piece of evidence for each rating), plus two areas you most want to develop this level. This becomes your personal focus plan, revisited in Module 10.

REVISION: Lesson 1.2 opens with learners naming one diagnostic focus area aloud.

EXTENSION: Find (or construct) one example of the "were"-subjunctive in formal usage ("If this were to proceed...") and explain how it differs in function from the mandative subjunctive.'),

('itm_l6_m1_lesson2', 'unt_l6_m1', 3, 'reading', 'Lesson 1.2 — Leading and Accounting — The Executive Briefing & Reflective Leadership Writing',
'LEARNING OBJECTIVES: (1) deliver a concise executive briefing that opens with the decision required, not the background, (2) assign responsibility explicitly using accountable-leadership framing, (3) write reflectively about your own leadership or professional practice without either self-promotion or performative self-criticism, (4) connect a reflective insight to a specific, evidenced change in practice.

PREREQUISITE KNOWLEDGE: Lesson 1.1 (subjunctive, formal recommendation register); Level V, Module 9 (bottom-line-up-front structure and the executive briefing).

WARM-UP (5 min): Your instructor delivers two 30-second briefings on the same invented situation — one that describes a problem, one that states a decision and asks for a specific authorisation — which would a senior audience find more useful?

PRESENTATION (10 min): The executive briefing at leadership level: THE DECISION REQUIRED ("I''m asking the board to approve X"), THE ESSENTIAL CONTEXT (two sentences, no more), THE RISK OWNED ("The principal risk is Y; I''m accountable for managing it"), THE ASK (a specific, time-bound authorisation). Reflective leadership writing has two failure modes: SELF-PROMOTION DISGUISED AS REFLECTION ("My greatest weakness is that I care too much about quality") and PERFORMATIVE SELF-CRITICISM (elaborate blame that commits to no change). A genuine reflective piece names a specific decision, states honestly what it cost, identifies the reasoning error, and commits to a concrete different action.

GUIDED PRACTICE (10 min): Evaluate 6 short reflective extracts, classifying each as genuine reflection, self-promotion, or performative self-criticism, and justifying the classification.

INDEPENDENT PRACTICE (10 min): Using a real or invented professional decision, draft a four-part reflective paragraph (decision -> cost -> reasoning error -> concrete change) and a 60-second executive briefing on a related matter.

SPEAKING ACTIVITY — EXECUTIVE BRIEFING: Deliver the 60-second briefing to a partner or small group acting as a senior audience, who may interrupt once with a direct challenge to your ownership of the risk ("Whose responsibility is this if it fails?").

CRITICAL THINKING / DISCUSSION PROMPT: "Is there a real difference between a leader who takes responsibility and one who merely says they take responsibility? What, specifically, would you look for as evidence of the first?"

LISTENING ACTIVITY (5 min): Listen to two executive briefings and identify which one genuinely owns the risk and which one distributes it, citing the specific language used.

READING ACTIVITY (5 min): Read a short published-style reflective leadership extract and identify its decision, cost, reasoning error, and committed change — or note precisely which of the four is missing.

WRITING TASK (5 min): Expand your reflective paragraph, adding one sentence that connects the insight explicitly to your Lesson 1.1 diagnostic focus areas.

PRONUNCIATION PRACTICE (5 min): Steady, unhurried delivery when accepting responsibility aloud — rushing this language signals discomfort and undercuts the words, while over-slowing it sounds theatrical.

VOCABULARY REINFORCEMENT: a reflective-practice vocabulary matching game (self-assessment, blind spot, development plan, growth edge) plus this module''s phrasal-verb set, with attention to which are register-appropriate in formal written reflection ("carry the can" is vivid but informal).

FORMATIVE ASSESSMENT: Instructor checks that reflective writing reaches a concrete committed change, and that briefings open with the decision required rather than background.

HOMEWORK: Finalise your reflective leadership essay draft for Module 1''s assignment.

REVISION: This lesson opens with the diagnostic focus-area recap. Module 1''s Quiz and Assignment draw on both lessons.

EXTENSION: Write a second, contrasting reflection on a decision that went well, identifying what was genuinely skill and what was genuinely luck.'),

('itm_l6_m1_quiz', 'unt_l6_m1', 4, 'quiz', 'Module 1 Quiz — Mastery Diagnostic & Executive Leadership', NULL),

('itm_l6_m1_assignment', 'unt_l6_m1', 5, 'assignment', 'Module 1 Assignment — A Reflective Leadership Essay & Executive Briefing',
'INSTRUCTIONS: Complete two parts. PART A (writing, this level''s first genre): a reflective leadership essay, 600-750 words, on a real or realistic professional decision you led or observed closely. It must name the decision, state honestly what it cost, identify the reasoning error or blind spot involved, and commit to a specific, concrete change in practice. Include at least 2 accurate mandative subjunctive constructions in any formal recommendation you make, and at least 2 accountable-leadership framing phrases from this module. PART B (speaking): an executive briefing, 60-90 seconds, on a related decision — opening with the decision required, giving essential context in no more than two sentences, explicitly owning the principal risk, and closing with a specific, time-bound ask. Respond to at least one direct challenge to your ownership of that risk.

GRADING RUBRIC: (1) Grammatical accuracy — correct invariant subjunctive forms and negation; accurate formal register throughout. (2) Vocabulary range — at least 4 distinct executive-leadership or reflective-practice terms used precisely, plus one phrasal verb/collocation from this module used at an appropriate register. (3) Task completion — decision, cost, reasoning error, and committed change all present in Part A; decision-first structure, owned risk, and time-bound ask all present in Part B. (4) Independent judgement — does the reflection reach a genuinely self-critical insight the writer clearly arrived at themselves, rather than a conventional or flattering one? Does the committed change follow logically from the identified error? (5) Discourse coherence & register — is the essay''s register reflective and professional without slipping into either self-promotion or performative self-criticism, and does the spoken briefing sustain composure under direct challenge?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m1_1', 'itm_l6_m1_quiz', 1, '"It is imperative that every director ___ briefed before the vote." (mandative subjunctive)', '["is","will be","being","be"]', 3),
('qq_l6_m1_2', 'itm_l6_m1_quiz', 2, '"The board requires that the report ___ circulated in advance."', '["is","be","was","has been"]', 1),
('qq_l6_m1_3', 'itm_l6_m1_quiz', 3, '"We propose that the chair ___ an extraordinary meeting."', '["convene","convenes","convened","is convening"]', 0),
('qq_l6_m1_4', 'itm_l6_m1_quiz', 4, 'How is the mandative subjunctive negated?', '["with \"doesn''t\" + base form","with \"isn''t\"","with \"not\" + base form","it cannot be negated"]', 2),
('qq_l6_m1_5', 'itm_l6_m1_quiz', 5, 'Which is the more common British alternative to the bare subjunctive in a formal recommendation?', '["\"will\" + base form","\"should\" + base form","the past simple","the present continuous"]', 1),
('qq_l6_m1_6', 'itm_l6_m1_quiz', 6, 'In British corporate governance, a director who is not part of the company''s management team is usually called a:', '["outside director","board observer","silent partner","non-executive director"]', 3),
('qq_l6_m1_7', 'itm_l6_m1_quiz', 7, 'Which opening is most appropriate for an executive briefing to a senior audience?', '["an extended account of the background","an apology for taking their time","the decision required","a list of everyone consulted"]', 2),
('qq_l6_m1_8', 'itm_l6_m1_quiz', 8, 'Which of these is genuine reflection rather than self-promotion?', '["\"I delayed the decision by three weeks because I over-weighted one stakeholder''s objection; next time I will set a decision deadline in advance.\"","\"My greatest weakness is that I care too much about quality.\"","\"Everything went well because of my leadership.\"","\"Mistakes were made by the team.\""]', 0),
('qq_l6_m1_9', 'itm_l6_m1_quiz', 9, 'Which phrase means "face a difficulty or one''s own error openly"?', '["front up to","step up","set the direction","own the outcome"]', 0),
('qq_l6_m1_10', 'itm_l6_m1_quiz', 10, 'In British usage, "remit" most precisely means:', '["a payment","a reminder","the scope of one''s authority or responsibility","a resignation"]', 2);

-- ---------------------------------------------------------------------
-- Module 2: Diplomacy & International Relations
-- Full prose version: docs/curriculum/level-6/module-02-diplomacy-international-relations.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m2', 'crs_level_6', 2, 'Module 2: Diplomacy & International Relations');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m2_overview', 'unt_l6_m2', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: It would not be unhelpful if... — There is a view that... — It may be felt in some quarters that... — We would be reluctant to see... — This is not a position we could readily support. — We note with interest...

DISCOURSE MARKERS (functional set — diplomatic distance): "there is a view that", "it may be felt that", "in some quarters", "we would be reluctant to see" — impersonal constructions that advance a position while attributing it to no named person, allowing a negotiator to signal a stance that can later be adjusted without anyone visibly reversing themselves. Diplomatic hedging is not vagueness; it is deliberate preservation of manoeuvring room.

LITOTES AND CALIBRATED UNDERSTATEMENT: affirming something by negating its opposite ("not unhelpful", "no small achievement", "we are not unaware of your concerns"). Its function is precision of degree: "not unhelpful" is genuinely weaker praise than "helpful", and both parties understand this. The scale runs: unhelpful < not helpful < not unhelpful < helpful.

PHRASAL VERBS & COLLOCATIONS: "sound out [a party]" (discreetly test their position), "walk back [a statement]" (retreat from a stated position publicly), "paper over [differences]" (conceal disagreement rather than resolve it), "broker [an agreement]", "table [a proposal]" (see the BrE/AmE note).

BrE / AmE NOTE (two, both consequential): First, "to table a proposal" means to put it forward for discussion in British and most Commonwealth usage, but to postpone or shelve it in American usage — a genuine, complete reversal, one of very few places where the two varieties produce directly opposite readings of the same formal sentence. Second, British ministries are led by a "Secretary of State" or "Minister" within a "Department"; the American equivalent is a "Secretary" heading a "Department"; "Minister" is not used for US federal officials.

KEY VOCABULARY: diplomatic vocabulary (communique, demarche, accession, ratification, bilateral/multilateral, good offices, without prejudice), IR vocabulary (sovereignty, mandate, sanctions regime, normalisation). Intercultural note: the degree of indirectness expected in diplomatic exchange varies by tradition and seniority; some multilateral settings have moved deliberately toward plainer language.'),

('itm_l6_m2_lesson1', 'unt_l6_m2', 2, 'reading', 'Lesson 2.1 — It Would Not Be Unhelpful — Diplomatic Hedging, Litotes & Impersonal Register',
'LEARNING OBJECTIVES: (1) form impersonal diplomatic constructions accurately, (2) produce and interpret litotes at the correct strength, (3) recognise that diplomatic hedging preserves manoeuvring room rather than merely softening tone, (4) read a diplomatic text for what it declines to say.

PREREQUISITE KNOWLEDGE: Level V, Module 4 (hedging and qualifying claims) and Module 5 (graded politeness modality).

WARM-UP (5 min): Your instructor writes three responses to the same proposal — "We disagree," "We have some concerns," and "This is not a position we could readily support" — rank them by strength of objection. (The third is generally the strongest, which is counter-intuitive to most learners.)

PRESENTATION (10 min): "There is a view that the timetable may prove ambitious. It may be felt in some quarters that further consultation would be prudent. We would be reluctant to see the matter pressed to a vote at this stage." None of these sentences names who holds the view, which means no individual has to reverse themselves if the position later shifts — the function of the construction, not a decoration. The litotes scale: "unhelpful" < "not helpful" < "not unhelpful" < "helpful" — a genuine four-point scale most learners collapse into two.

GUIDED PRACTICE (10 min): Convert 8 direct statements into impersonal diplomatic register, then place 6 litotes expressions on a strength scale from strongest objection to strongest approval.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Rewrite a blunt half-page position statement into full diplomatic register, then exchange with a partner, who states plainly what position they believe the rewritten text actually holds — a direct test of whether the hedging preserved meaning or destroyed it.

CRITICAL THINKING / DISCUSSION PROMPT: "Diplomatic language is often criticised as evasive. Having now written it deliberately, do you think its indirectness is primarily a way of avoiding accountability, or a genuine tool for keeping negotiations alive? Can it be both at once?"

LISTENING ACTIVITY (5 min): Listen to a short diplomatic exchange (6-8 turns) and write, in plain English, what each party''s actual position is.

READING ACTIVITY — EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short communique-style text (180-220 words). Answer 2 literal questions and 2 independent-judgement questions ("Identify one point on which the parties have clearly not agreed, despite the text implying progress. What language reveals this?").

WRITING TASK (5 min): Write four sentences advancing a position you actually hold, using impersonal construction and at least one litotes — then, underneath, write the plain-English version, and check they genuinely match.

PRONUNCIATION PRACTICE (5 min): The level, unemphatic delivery diplomatic register requires — this language loses its function entirely if delivered with visible emotion, and the deliberate flatness is itself the professional skill.

VOCABULARY REINFORCEMENT: a diplomatic-vocabulary matching game (communique, demarche, accession, ratification, bilateral, good offices, without prejudice).

FORMATIVE ASSESSMENT: Instructor checks that hedged rewrites remain decodable — the position must survive the hedging.

HOMEWORK: Select a real or invented international issue with at least three distinct party interests and prepare a one-paragraph brief of your assigned party''s position, ready for Lesson 2.2''s negotiation.

REVISION: Lesson 2.2 opens with learners stating their party''s core interest in one sentence.

EXTENSION: Find one example of litotes in a real speech or document and explain precisely what strength it conveys and why plainer wording was avoided.'),

('itm_l6_m2_lesson2', 'unt_l6_m2', 3, 'reading', 'Lesson 2.2 — Around the Table — Multi-Party Diplomatic Negotiation & Strategic Recommendations',
'LEARNING OBJECTIVES: (1) conduct a negotiation with three or more parties, tracking multiple interests simultaneously, (2) signal flexibility without conceding, and firmness without foreclosing, (3) identify and use the distinction between a party''s stated position and its underlying interest, (4) write a set of strategic recommendations that are specific, prioritised, and honest about trade-offs.

PREREQUISITE KNOWLEDGE: Lesson 2.1 (diplomatic register); Level V, Module 5 (intercultural negotiation).

WARM-UP (5 min): Your instructor states a negotiating position ("We require the deadline to be extended by six months") and asks you to propose three different underlying interests that could produce that same stated position.

PRESENTATION (10 min): POSITION vs. INTEREST: a position is what a party says it wants; an interest is why. Two parties with incompatible positions may have compatible interests, which is what makes agreement possible at all. Multi-party technique: tracking each party''s interest aloud ("As I understand it, your concern is primarily about sequencing rather than the substance"), building a coalition on a sub-issue, and using diplomatic register to keep an unattractive option formally alive ("We would not wish to rule that out at this stage"). The strategic-recommendations format: PRIORITISED (not a flat list), SPECIFIC (named action, owner, timeframe), and HONEST ABOUT TRADE-OFFS (each recommendation states what it costs).

GUIDED PRACTICE (10 min): You are given 6 stated positions and infer a plausible underlying interest for each, then propose one option that could satisfy two apparently opposed interests.

INDEPENDENT PRACTICE (10 min): In groups of three or four, using your Lesson 2.1 homework briefs, prepare your party''s opening statement, one concession you could make, and one point you cannot move on.

SPEAKING ACTIVITY — MULTI-PARTY DIPLOMATIC NEGOTIATION: Groups conduct a full negotiation (8-10 minutes): opening statements in diplomatic register, a substantive exchange in which each party must correctly identify at least one other party''s underlying interest, and an attempt to reach a communique-style joint statement — or an honest acknowledgement of where agreement was not reached.

CRITICAL THINKING / DISCUSSION PROMPT: "In your negotiation, was any agreement reached that papered over a real disagreement rather than resolving it? Is such an agreement worth having?"

LISTENING ACTIVITY (5 min): Listen to a three-party negotiation extract and map each party''s stated position against its likely underlying interest.

READING ACTIVITY (5 min): Read a short set of published-style strategic recommendations and assess whether each is genuinely specific and prioritised, or whether any is a generality dressed as a recommendation.

WRITING TASK (5 min): Draft two strategic recommendations arising from your negotiation, each naming an action, an owner, a timeframe, and its trade-off.

PRONUNCIATION PRACTICE (5 min): The measured pacing and deliberate pausing of multi-party negotiation — including the professional use of a silence after another party''s statement, which in this register signals consideration rather than confusion.

VOCABULARY REINFORCEMENT: a negotiation-collocation matching game (sound out, walk back, paper over, broker, table — with the BrE/AmE "table" reversal explicitly re-tested).

FORMATIVE ASSESSMENT: Instructor checks that each learner correctly identifies at least one other party''s underlying interest, and that recommendations name a trade-off rather than presenting costless options.

HOMEWORK: Complete your strategic recommendations for Module 2''s assignment.

REVISION: This lesson opens with the Lesson 2.1 party-interest recap. Module 2''s Quiz and Assignment draw on both lessons.

EXTENSION: Draft the joint communique in full diplomatic register, ensuring it is honest about what was not agreed while remaining publishable by all parties.'),

('itm_l6_m2_quiz', 'unt_l6_m2', 4, 'quiz', 'Module 2 Quiz — Diplomacy & International Relations', NULL),

('itm_l6_m2_assignment', 'unt_l6_m2', 5, 'assignment', 'Module 2 Assignment — Strategic Recommendations & a Diplomatic Negotiation',
'INSTRUCTIONS: Complete two parts on one real or invented international issue with at least three distinct party interests. PART A (writing, this level''s second genre): strategic recommendations, 600-750 words, comprising a brief situation assessment, an analysis of each party''s stated position and inferred underlying interest, and 3-4 prioritised recommendations — each naming a specific action, an owner, a timeframe, and its trade-off. Write the recommendations in appropriate diplomatic register, including at least one litotes used at the correct strength. PART B (speaking): a diplomatic negotiation, 3-4 minutes as your assigned party. You must state your position in diplomatic register, correctly identify at least one other party''s underlying interest aloud, and either signal a genuine concession or decline one without foreclosing the discussion.

GRADING RUBRIC: (1) Grammatical accuracy — accurate impersonal constructions and correctly formed litotes; sustained high-formal register. (2) Vocabulary range — at least 4 distinct diplomatic/IR terms used precisely, plus one phrasal verb/collocation from this module. (3) Task completion — situation assessment, position/interest analysis, and prioritised recommendations with trade-offs in Part A; position statement, interest identification, and concession handling in Part B. (4) Independent judgement — does the position/interest analysis reach a genuinely non-obvious inference about at least one party, rather than restating stated positions? (5) Discourse coherence & register — is the diplomatic register sustained without the underlying position becoming unrecoverable, and are the recommendations decodable into plain action?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m2_1', 'itm_l6_m2_quiz', 1, 'In British and Commonwealth usage, "to table a proposal" means:', '["to put it forward for discussion","to postpone it","to reject it","to vote on it immediately"]', 0),
('qq_l6_m2_2', 'itm_l6_m2_quiz', 2, 'In American usage, "to table a proposal" means:', '["to put it forward for discussion","to ratify it","to postpone or shelve it","to publish it"]', 2),
('qq_l6_m2_3', 'itm_l6_m2_quiz', 3, 'Which is the strongest objection, in diplomatic register?', '["We have some concerns.","This is not a position we could readily support.","We would like more information.","We note the proposal."]', 1),
('qq_l6_m2_4', 'itm_l6_m2_quiz', 4, '"It may be felt in some quarters that further consultation would be prudent." The main function of this construction is to:', '["identify precisely who holds the view","express strong personal emotion","close the discussion permanently","advance a position without attributing it to a named person"]', 3),
('qq_l6_m2_5', 'itm_l6_m2_quiz', 5, '"Not unhelpful" conveys:', '["stronger praise than \"helpful\"","exactly the same as \"helpful\"","weaker praise than \"helpful\"","outright criticism"]', 2),
('qq_l6_m2_6', 'itm_l6_m2_quiz', 6, 'What is the difference between a party''s position and its interest?', '["the position is what it says it wants; the interest is why","there is none","the interest is always public","the position is always hidden"]', 0),
('qq_l6_m2_7', 'itm_l6_m2_quiz', 7, 'In the United Kingdom, the head of a government department is typically titled:', '["Attorney","Governor","Commissioner only","Minister or Secretary of State"]', 3),
('qq_l6_m2_8', 'itm_l6_m2_quiz', 8, 'Which phrase means "discreetly test a party''s position before committing"?', '["walk back","sound out","paper over","broker"]', 1),
('qq_l6_m2_9', 'itm_l6_m2_quiz', 9, 'Which phrase means "conceal a disagreement rather than resolve it"?', '["broker","paper over","sound out","table"]', 1),
('qq_l6_m2_10', 'itm_l6_m2_quiz', 10, 'A strategic recommendation is strongest when it is:', '["general enough to suit any situation","presented as costless","unattributed to any owner","specific, prioritised, and honest about its trade-off"]', 3);

-- ---------------------------------------------------------------------
-- Module 3: Global Business Strategy
-- Full prose version: docs/curriculum/level-6/module-03-global-business-strategy.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m3', 'crs_level_6', 3, 'Module 3: Global Business Strategy');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m3_overview', 'unt_l6_m3', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Central to this strategy is... — So significant were the gains that... — What this does not address is... — Our working assumption is... — The evidence supports X; the inference is Y; the recommendation is Z.

DISCOURSE MARKERS (functional set — separating evidence, inference, and recommendation): "the evidence indicates", "from which we infer", "on that basis we recommend", "our working assumption is" — the single most important disciplinary habit in strategic writing. Most weak executive reports fail not because their recommendation is wrong but because the reader cannot tell where observed fact ends and interpretation begins. Naming the three layers explicitly is what makes a strategy document auditable.

PHRASAL VERBS & COLLOCATIONS: "scale back [an initiative]" (reduce its scope deliberately), "double down (on a strategy)" (commit further despite early difficulty), "spin off [a division]" (separate it into an independent entity), "shore up [a position]" (strengthen something weakening), "bed in" (BrE: of a change or system, to become established and start working properly over time).

BrE / AmE NOTE — A GENUINE FALSE FRIEND: "turnover" in British business English means REVENUE ("the company reported a turnover of 40 million pounds"); in American business English, "turnover" almost always means STAFF ATTRITION ("we have a turnover problem in engineering"). A single sentence can therefore be read as a statement about sales or about resignations depending on the reader''s variety. Related: British "profit and loss account" vs. American "income statement"; British "shares/shareholder" vs. American "stock/stockholder".

KEY VOCABULARY: strategy vocabulary (value proposition, competitive moat, market positioning, capital allocation, scenario planning, downside case). Intercultural note: boardroom communication norms differ markedly — the degree to which junior presenters are expected to be challenged directly varies by corporate and national culture; this module rehearses direct in-meeting challenge as a convention rather than a universal.'),

('itm_l6_m3_lesson1', 'unt_l6_m3', 2, 'reading', 'Lesson 3.1 — Central to This Strategy Is — Fronting & Complex Inversion for Strategic Emphasis',
'LEARNING OBJECTIVES: (1) front a complement for emphasis, with the subject-verb inversion this triggers, (2) form so/such inversions accurately, (3) choose between fronting, cleft (Level V, Module 6) and inversion (Level V, Module 3) according to which element genuinely needs emphasis, (4) avoid the characteristic failure of this register — emphasis applied so frequently that nothing is emphasised.

PREREQUISITE KNOWLEDGE: Level V, Module 3 (inversion after negative adverbials) and Module 6 (cleft sentences).

WARM-UP (5 min): Your instructor writes one plain sentence and three emphatic rewrites — a cleft, a negative-adverbial inversion, and a fronted complement — which element does each version emphasise?

PRESENTATION (10 min): COMPLEMENT FRONTING: "Central to this strategy is a fundamental shift in how we allocate capital." (Compare the plain "A fundamental shift in how we allocate capital is central to this strategy" — same content, different weight.) SO/SUCH INVERSION: "So significant were the first-quarter gains that the board approved a second phase." "Such was the scale of the change that three functions were restructured." Fronting puts the evaluative frame first and the substance in the stressed final position. The failure mode: a document in which every sentence is emphatic reads as breathless, and the reader stops registering emphasis at all — these constructions work by contrast with plainer neighbours.

GUIDED PRACTICE (10 min): Convert 8 plain strategic sentences into fronted or inverted form as directed, then — for 4 further sentences — choose whether a cleft, an inversion, or a fronting best serves the emphasis required, and justify the choice.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draft a 6-sentence strategic paragraph in which EXACTLY TWO sentences use an emphasis construction and the rest are deliberately plain, then exchange with a partner, who identifies which two were emphasised and whether those were the right two.

CRITICAL THINKING / DISCUSSION PROMPT: "Emphasis constructions make a claim feel more significant. Does that make them a legitimate tool of clear communication, or a way of making a thin argument sound weighty? How would you tell, as a reader, which you were looking at?"

LISTENING ACTIVITY (5 min): Listen to a short strategy presentation extract and note each emphasis construction used and which element it foregrounds.

READING ACTIVITY — EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short strategic-report extract (180-220 words) using emphasis constructions. Answer 2 literal questions and 2 independent-judgement questions ("Identify one claim that is emphasised more strongly than its supporting evidence warrants. What would you need to see to accept it?").

WRITING TASK (5 min): Write three sentences about a real or invented strategic decision: one fronted, one so/such inversion, one deliberately plain — and say which carries the most weight and why.

PRONUNCIATION PRACTICE (5 min): The stress contour of a fronted sentence read aloud — the fronted element takes a lifted, sustained delivery and the sentence resolves onto a strongly stressed final noun phrase.

VOCABULARY REINFORCEMENT: a strategy-vocabulary matching game (value proposition, competitive moat, market positioning, capital allocation, scenario planning, downside case).

FORMATIVE ASSESSMENT: Instructor checks correct inversion after fronting (a frequent error is fronting without inverting) and, more importantly, restraint — no more than two emphasis constructions per paragraph.

HOMEWORK: Select a real or invented strategic decision facing an organisation you know, and note the evidence available, what you infer from it, and what you would recommend — kept as three separate lists, ready for Lesson 3.2.

REVISION: Lesson 3.2 opens with learners naming their strategic decision in one sentence.

EXTENSION: Rewrite a paragraph from your own Level V work using one emphasis construction, and assess honestly whether it improved.'),

('itm_l6_m3_lesson2', 'unt_l6_m3', 3, 'reading', 'Lesson 3.2 — The Board Will See You Now — Boardroom Presentation & the Executive Report',
'LEARNING OBJECTIVES: (1) structure an executive report that visibly separates evidence, inference, and recommendation, (2) state working assumptions explicitly, so they can be challenged, (3) present to a board-level audience and respond to challenges aimed at your assumptions rather than your conclusions, (4) concede an assumption without abandoning a recommendation where that is honest — or withdraw the recommendation, where it is not.

PREREQUISITE KNOWLEDGE: Lesson 3.1 (emphasis constructions); Level V, Module 9 (bottom-line-up-front executive reporting) and Module 8 (defending a position under challenge).

WARM-UP (5 min): Your instructor states a recommendation and asks the class to challenge it — then points out that most challenges attacked the conclusion, and asks what a challenge to the assumption beneath it would have looked like.

PRESENTATION (10 min): The three-layer discipline: EVIDENCE ("Unit sales fell 12% across two consecutive quarters" — observable, checkable), INFERENCE ("From which we infer that the decline is structural rather than seasonal" — a judgement, and the layer where reasonable people disagree), RECOMMENDATION ("On that basis we recommend deferring the capacity expansion"). The WORKING ASSUMPTION statement — "Our working assumption is that competitor pricing holds at current levels; if that assumption fails, the recommendation changes" — is the mark of a serious strategy document: it tells the board exactly which assumption to interrogate, and pre-commits the author to changing their view if it breaks. Boardroom Q&A in which the challenge lands on the assumption has two honest responses: conceding the assumption while showing the recommendation survives on other grounds, and conceding that it does not.

GUIDED PRACTICE (10 min): Sort 9 statements from a provided report into evidence, inference, and recommendation, then identify the two unstated assumptions the report depends on.

INDEPENDENT PRACTICE (10 min): Using your Lesson 3.1 homework lists, draft the core of an executive report — evidence, inference, recommendation, each labelled — plus one explicitly stated working assumption, and prepare a 90-second board presentation.

SPEAKING ACTIVITY — BOARDROOM PRESENTATION: Present to a small group acting as a board, which must challenge the STATED ASSUMPTION (not the conclusion); respond honestly, either defending the recommendation on other grounds or conceding that it does not survive.

CRITICAL THINKING / DISCUSSION PROMPT: "Stating your working assumption invites people to attack it. Why might a presenter do that deliberately? Is there a situation where you would judge it wiser not to?"

LISTENING ACTIVITY (5 min): Listen to a board exchange and identify whether the challenge was aimed at evidence, inference, or assumption — and whether the presenter answered the question actually asked.

READING ACTIVITY (5 min): Read a short executive report extract and mark where it blurs inference into evidence — the most common failure of the genre.

WRITING TASK (5 min): Write your report''s recommendation section, including one sentence naming the condition under which you would change your recommendation.

PRONUNCIATION PRACTICE (5 min): Unhurried, level delivery when conceding a point under board challenge — conceding quickly and calmly reads as confidence, while a rushed or defensive concession undermines the entire presentation.

VOCABULARY REINFORCEMENT: a business-English precision game including the "turnover" false friend, "profit and loss account"/"income statement", and "shares"/"stock", with learners identifying which variety each sentence assumes.

FORMATIVE ASSESSMENT: Instructor checks that evidence, inference, and recommendation are genuinely separated (not merely labelled) and that at least one working assumption is stated in falsifiable terms.

HOMEWORK: Complete your executive report for Module 3''s assignment.

REVISION: This lesson opens with the Lesson 3.1 decision recap. Module 3''s Quiz and Assignment draw on both lessons.

EXTENSION: Write the DOWNSIDE CASE — a short section setting out what happens if your central inference is wrong.'),

('itm_l6_m3_quiz', 'unt_l6_m3', 4, 'quiz', 'Module 3 Quiz — Global Business Strategy', NULL),

('itm_l6_m3_assignment', 'unt_l6_m3', 5, 'assignment', 'Module 3 Assignment — An Executive Report & Boardroom Presentation',
'INSTRUCTIONS: Complete two parts on one real or invented strategic decision. PART A (writing, this level''s third genre): an executive report, 700-850 words, that visibly separates EVIDENCE, INFERENCE, and RECOMMENDATION — using this module''s discourse markers to signal each transition — and states at least one WORKING ASSUMPTION in falsifiable terms, naming the condition under which the recommendation would change. Use exactly two emphasis constructions from Lesson 3.1, no more, placed where the emphasis is genuinely warranted. PART B (speaking): a boardroom presentation, 90 seconds to 2 minutes, delivering the report''s core to a board-level audience, and responding to at least one challenge aimed at your stated assumption.

GRADING RUBRIC: (1) Grammatical accuracy — correct inversion after fronting; accurate so/such constructions; sustained formal register. (2) Vocabulary range — at least 4 distinct strategy or governance terms used precisely, plus one phrasal verb/collocation from this module; no misuse of the "turnover" false friend. (3) Task completion — evidence, inference, recommendation, and a falsifiable working assumption all present and distinguishable in Part A; a challenge to the assumption answered honestly in Part B. (4) Independent judgement — is the inference genuinely the writer''s own reasoning from the evidence presented, and does the recommendation follow from it rather than preceding it? (5) Discourse coherence & register — is emphasis used with restraint so that it still functions, and does the report remain auditable?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m3_1', 'itm_l6_m3_quiz', 1, '"Central to this strategy ___ a fundamental shift in capital allocation." (fronted complement)', '["it is","being","is","which is"]', 2),
('qq_l6_m3_2', 'itm_l6_m3_quiz', 2, '"So significant ___ the first-quarter gains that the board approved a second phase."', '["were","was","they were","have been"]', 0),
('qq_l6_m3_3', 'itm_l6_m3_quiz', 3, '"___ was the scale of the change that three functions were restructured."', '["So","Very","Much","Such"]', 3),
('qq_l6_m3_4', 'itm_l6_m3_quiz', 4, 'What is the characteristic failure of emphasis constructions in strategic writing?', '["they are grammatically incorrect","overuse, so that nothing registers as emphasised","they are too informal","they cannot be used in reports"]', 1),
('qq_l6_m3_5', 'itm_l6_m3_quiz', 5, 'In British business English, "turnover" normally means:', '["revenue","staff attrition","profit","inventory"]', 0),
('qq_l6_m3_6', 'itm_l6_m3_quiz', 6, 'In American business English, "turnover" most often means:', '["revenue","dividend","staff attrition","market share"]', 2),
('qq_l6_m3_7', 'itm_l6_m3_quiz', 7, '"Unit sales fell 12% across two consecutive quarters." In the three-layer discipline, this is:', '["inference","evidence","recommendation","assumption"]', 1),
('qq_l6_m3_8', 'itm_l6_m3_quiz', 8, '"From which we infer that the decline is structural rather than seasonal." This is:', '["evidence","recommendation","observation","inference"]', 3),
('qq_l6_m3_9', 'itm_l6_m3_quiz', 9, 'Why does a serious strategy document state its working assumptions explicitly?', '["to lengthen the report","to avoid making a recommendation","to prevent any challenge","to tell the reader exactly which assumption to interrogate, and to pre-commit the author to changing their view if it fails"]', 3),
('qq_l6_m3_10', 'itm_l6_m3_quiz', 10, 'Which phrase means "strengthen something that is weakening"?', '["scale back","shore up","spin off","bed in"]', 1);

-- ---------------------------------------------------------------------
-- Module 4: Public Policy
-- Full prose version: docs/curriculum/level-6/module-04-public-policy.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m4', 'crs_level_6', 4, 'Module 4: Public Policy');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m4_overview', 'unt_l6_m4', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: The authority shall... — An applicant must... — The Secretary of State may... — Providers are to ensure that... — Assessed against the criterion of..., option B performs... — On balance, and subject to the caveat that...

DISCOURSE MARKERS (functional set — criterion-based assessment): "assessed against the criterion of", "on this measure", "subject to the caveat that", "the option that best satisfies" — language for evaluating options against declared standards rather than asserting a preference. State your criteria before you state your conclusion, so a reader can disagree with the criteria rather than merely with you.

PHRASAL VERBS & COLLOCATIONS: "roll out [a policy]" (implement it progressively), "phase in/phase out" (introduce or withdraw gradually), "ring-fence [funding]" (BrE: protect a budget from being spent on anything else), "water down [a provision]" (weaken it, usually through negotiation), "bring [a measure] into force".

BrE / AmE NOTE — A REAL GRAMMATICAL DIVERGENCE: British English frequently treats COLLECTIVE NOUNS AS PLURAL when the members are acting individually: "the Government ARE considering the proposal"; "the committee HAVE reached different conclusions". American English almost invariably treats them as SINGULAR: "the government IS considering". Both are correct within their variety; in policy writing a mastery-level writer chooses one convention and applies it consistently. Related: British "Parliament", "Whitehall", and "the Treasury" map onto American "Congress", "the federal bureaucracy", and "the Treasury Department", but the institutions are not equivalent.

KEY VOCABULARY: policy vocabulary (statutory instrument, consultation, impact assessment, unintended consequence, implementation gap, sunset clause, discretion), evaluation vocabulary (efficacy, equity, feasibility, proportionality, deadweight cost). Intercultural note: the relationship between elected officials and permanent civil servants differs substantially between systems; this module''s drafting conventions follow a Westminster-derived model, named as a choice rather than presented as universal.'),

('itm_l6_m4_lesson1', 'unt_l6_m4', 2, 'reading', 'Lesson 4.1 — Shall, Must, May, Should — The Modality of Obligation in Policy Drafting',
'LEARNING OBJECTIVES: (1) distinguish the operative force of shall, must, is to, may, and should in a policy or regulatory text, (2) recognise that "may" confers discretion, not permission-as-politeness, and that misreading it inverts a provision''s meaning, (3) identify where a drafted provision is ambiguous as to whether it binds, (4) draft a short set of provisions in which each obligation''s force is unambiguous.

PREREQUISITE KNOWLEDGE: Level V, Module 4 (hedging and qualifying claims) and Level VI, Module 1 (the subjunctive in formal recommendation).

WARM-UP (5 min): Your instructor writes four provisions differing only in modal — "The authority SHALL publish...", "MUST publish...", "MAY publish...", "SHOULD publish..." — which of the four could a court or regulator enforce?

PRESENTATION (10 min): The operative scale: SHALL — the traditional drafting term of obligation, binding (now criticised in plain-language drafting movements precisely because lay readers read it as future tense, and increasingly replaced by "must"); MUST — binding obligation, unambiguous to lay readers, the preferred modern form; IS TO — binding, common in British statutory instruments, slightly softer in tone; MAY — confers a DISCRETION (the body can act, and cannot be compelled to), which lay readers routinely misread as mere permission; SHOULD — non-binding guidance, persuasive only. Substituting "should" for "must" in a single provision can remove an entire enforcement mechanism, which is precisely why such substitutions are negotiated so hard — the module''s "water down" collocation names exactly this move.

GUIDED PRACTICE (10 min): Classify 8 provisions by operative force (binding / discretionary / guidance), then identify which of 4 further provisions are genuinely ambiguous as to whether they bind, and why.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draft 5 provisions for a real or invented regulatory scheme — at least one binding, one discretionary, one guidance — then exchange with a partner, who states for each whether the addressee could be compelled to act.

CRITICAL THINKING / DISCUSSION PROMPT: "Plain-language drafting movements argue that ''shall'' should be abolished in favour of ''must'', because ordinary readers misunderstand it. Traditional drafters argue that centuries of case law give ''shall'' a settled meaning that ''must'' lacks. Which argument do you find stronger, and why?"

LISTENING ACTIVITY (5 min): Listen to a committee discussion of a draft provision and identify precisely which modal change is being proposed and what it would do to the provision''s force.

READING ACTIVITY — EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short regulatory extract (180-220 words). Answer 2 literal questions and 2 independent-judgement questions ("Identify one provision whose operative force is unclear. Would you redraft it as binding or discretionary, and what turns on that choice?").

WRITING TASK (5 min): Redraft three ambiguous provisions so that each one''s operative force is unambiguous.

PRONUNCIATION PRACTICE (5 min): The deliberate, evenly weighted delivery of provisions read aloud into a record — modal verbs in this register receive full, unreduced pronunciation, because the distinction between them carries legal weight.

VOCABULARY REINFORCEMENT: a policy-vocabulary matching game (statutory instrument, consultation, impact assessment, unintended consequence, implementation gap, sunset clause, discretion).

FORMATIVE ASSESSMENT: Instructor checks that each drafted provision''s force is read by the partner as the drafter intended — the only meaningful test of drafting precision.

HOMEWORK: Select a real or invented policy problem with at least three plausible options and draft the CRITERIA by which you will assess them (not yet the assessment), ready for Lesson 4.2.

REVISION: Lesson 4.2 opens with learners reading out their criteria.

EXTENSION: Find a real provision using "may" and explain what would change if it read "must".'),

('itm_l6_m4_lesson2', 'unt_l6_m4', 3, 'reading', 'Lesson 4.2 — Weighing the Options — Policy Analysis & the Policy Panel',
'LEARNING OBJECTIVES: (1) structure a policy analysis around declared criteria applied consistently to every option, (2) resist the characteristic failure of the genre — reverse-engineering criteria to justify a preferred option, (3) represent a defined constituency in a policy panel while engaging honestly with the analysis, (4) state a recommendation with its caveats and its distributional consequences.

PREREQUISITE KNOWLEDGE: Lesson 4.1 (modality of obligation); Level V, Module 4 (stakeholder meetings and policy briefs).

WARM-UP (5 min): Your instructor presents a policy analysis whose criteria are transparently chosen to make one option win — how can you tell?

PRESENTATION (10 min): The option-appraisal structure: CRITERIA DECLARED FIRST (efficacy, equity, feasibility, proportionality, cost — with each defined, because "equity" undefined does no work), EVERY OPTION ASSESSED AGAINST EVERY CRITERION (including the option the analyst dislikes, assessed fairly), THE TRADE-OFF NAMED EXPLICITLY ("Option B is more effective but less equitable; the choice between them is a value judgement, not a technical one"), and THE RECOMMENDATION STATED WITH ITS DISTRIBUTIONAL CONSEQUENCE ("this recommendation concentrates the cost on X while spreading the benefit across Y"). The genre''s characteristic failure: criteria selected after the conclusion. The tell is usually a criterion that appears once, does decisive work, and is never mentioned again.

GUIDED PRACTICE (10 min): Assess 3 provided options against 3 provided criteria in a simple matrix, then identify which single criterion, if reweighted, would change the winning option — the sensitivity question every serious analysis should answer.

INDEPENDENT PRACTICE (10 min): Using your Lesson 4.1 homework criteria, assess your own three options and draft the trade-off statement and recommendation, including its distributional consequence.

SPEAKING ACTIVITY — POLICY PANEL DISCUSSION: In groups, you are assigned distinct constituencies affected by the policy (those who bear the cost, those who receive the benefit, those responsible for implementation) and hold a panel discussion (6-8 minutes) in which each must engage with the ANALYSIS, not merely assert their constituency''s preference — and each must concede at least one point where the analysis genuinely disfavours them.

CRITICAL THINKING / DISCUSSION PROMPT: "Policy analysis presents itself as technical, but the choice and weighting of criteria is a value judgement. Does that make the technical apparatus dishonest, or is making the value judgement explicit and contestable precisely its purpose?"

LISTENING ACTIVITY (5 min): Listen to a policy panel exchange and identify one contribution that engaged with the analysis and one that merely restated a constituency''s preference.

READING ACTIVITY (5 min): Read a short published-style policy analysis and assess whether its criteria were genuinely declared in advance or appear reverse-engineered.

WRITING TASK (5 min): Write your analysis''s trade-off paragraph, naming explicitly what is being traded against what, and who bears each side of the trade.

PRONUNCIATION PRACTICE (5 min): Neutral, non-advocating delivery for reading an option appraisal aloud — the analyst''s voice in this genre is deliberately even across options, and audible enthusiasm for one option undermines the appraisal''s credibility.

VOCABULARY REINFORCEMENT: an evaluation-vocabulary matching game (efficacy, equity, feasibility, proportionality, deadweight cost), plus a British/American collective-noun agreement drill.

FORMATIVE ASSESSMENT: Instructor checks that every option is assessed against every criterion — including the option the learner disfavours — and that the recommendation names a distributional consequence.

HOMEWORK: Complete your policy analysis for Module 4''s assignment.

REVISION: This lesson opens with the Lesson 4.1 criteria recap. Module 4''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a SENSITIVITY PARAGRAPH identifying the single assumption or criterion weighting that, if changed, would reverse your recommendation.'),

('itm_l6_m4_quiz', 'unt_l6_m4', 4, 'quiz', 'Module 4 Quiz — Public Policy', NULL),

('itm_l6_m4_assignment', 'unt_l6_m4', 5, 'assignment', 'Module 4 Assignment — A Policy Analysis & Panel Contribution',
'INSTRUCTIONS: Complete two parts on one real or invented policy problem with at least three plausible options. PART A (writing, this level''s fourth genre): a policy analysis, 700-850 words, which declares its assessment criteria BEFORE any assessment, defines each criterion, assesses EVERY option against EVERY criterion (including the option you personally disfavour, assessed fairly), states the central trade-off explicitly, and closes with a recommendation naming its distributional consequence and at least one caveat. Draft at least 3 provisions implementing your recommendation, using "must", "may", and "should" with correct and deliberate operative force. PART B (speaking): a policy panel contribution, 2-3 minutes, representing a defined constituency — engaging with the analysis rather than merely asserting a preference, and conceding at least one point where the analysis genuinely disfavours your constituency.

GRADING RUBRIC: (1) Grammatical accuracy — modal verbs used with correct and consistent operative force; consistent collective-noun agreement in whichever variety the learner adopts. (2) Vocabulary range — at least 4 distinct policy or evaluation terms used precisely, plus one phrasal verb/collocation from this module. (3) Task completion — criteria declared and defined first, all options assessed against all criteria, trade-off stated, distributional consequence named, and 3 correctly-forced provisions drafted in Part A; constituency represented with a genuine concession in Part B. (4) Independent judgement — is the disfavoured option genuinely assessed fairly, and does the recommendation follow from the criteria rather than the criteria from the recommendation? (5) Discourse coherence & register — is the analytical voice even across options, and is the register appropriate to a document intended for decision-makers?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m4_1', 'itm_l6_m4_quiz', 1, 'In regulatory drafting, "The authority may publish guidance" confers:', '["a binding obligation","a prohibition","non-binding guidance to the public","a discretion the authority cannot be compelled to exercise"]', 3),
('qq_l6_m4_2', 'itm_l6_m4_quiz', 2, 'Which modal creates a binding obligation and is preferred by plain-language drafting movements?', '["should","must","may","might"]', 1),
('qq_l6_m4_3', 'itm_l6_m4_quiz', 3, 'Why do plain-language drafters criticise "shall"?', '["lay readers often read it as a future tense rather than an obligation","it is grammatically incorrect","it is too modern","it cannot be used with institutions"]', 0),
('qq_l6_m4_4', 'itm_l6_m4_quiz', 4, '"Providers are to ensure that records are retained." This provision is:', '["purely advisory","a prohibition","binding","a discretion"]', 2),
('qq_l6_m4_5', 'itm_l6_m4_quiz', 5, 'Substituting "should" for "must" in a provision typically:', '["strengthens it","removes its enforceability","has no effect","makes it retrospective"]', 1),
('qq_l6_m4_6', 'itm_l6_m4_quiz', 6, 'In British English, which is standard when the members of a body are acting individually?', '["\"The Government is considering\" only","neither is acceptable","\"The Government were consider\"","\"The Government are considering\""]', 3),
('qq_l6_m4_7', 'itm_l6_m4_quiz', 7, 'What is the characteristic failure of a weak policy analysis?', '["too many options considered","declaring criteria in advance","criteria reverse-engineered to justify a predetermined option","assessing every option fairly"]', 2),
('qq_l6_m4_8', 'itm_l6_m4_quiz', 8, 'A serious policy analysis states its recommendation together with:', '["its distributional consequence — who bears the cost and who receives the benefit","nothing further","only its political feasibility","a guarantee of success"]', 0),
('qq_l6_m4_9', 'itm_l6_m4_quiz', 9, 'In British usage, to "ring-fence" funding means to:', '["protect it from being spent on anything else","reduce it","delay it","publish it"]', 0),
('qq_l6_m4_10', 'itm_l6_m4_quiz', 10, 'Which phrase means "weaken a provision, usually through negotiation"?', '["roll out","phase in","water down","bring into force"]', 2);

-- ---------------------------------------------------------------------
-- Module 5: Law & Justice
-- Full prose version: docs/curriculum/level-6/module-05-law-and-justice.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m5', 'crs_level_6', 5, 'Module 5: Law & Justice');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m5_overview', 'unt_l6_m5', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Provided that... — Save where... — Notwithstanding subsection (2)... — For the purposes of this section, "X" means... — It follows that... — The distinction is material because...

DISCOURSE MARKERS (functional set — reasoning from rule to conclusion): "it follows that", "on that reasoning", "the distinction is material because", "this does not, however, establish that" — markers that make each step of an argument''s movement visible, so a reader can identify precisely which step they reject. A legal-style argument is constructed so that disagreement can be LOCATED, not merely felt.

PHRASAL VERBS & COLLOCATIONS: "turn on [a point]" (depend decisively on it — "the case turns on whether notice was given"), "fall within/outside [the scope]", "set aside [a decision]" (annul it on review), "give rise to [a duty]", "draw a distinction (between)".

BrE / AmE NOTE: British practice distinguishes "barrister" (advocacy in court) from "solicitor" (advice, drafting, preparation); American practice uses "attorney" or "lawyer" for both. Beyond personnel: British "claimant" vs. American "plaintiff" for the party bringing a civil action (England and Wales changed from "plaintiff" in 1999); British "barrister''s chambers" vs. American "law firm"; British judges are addressed by rank-specific forms, whereas American practice generally uses "Your Honor" across most courts.

KEY VOCABULARY: legal-reasoning vocabulary (statute, precedent, obiter, ratio, jurisdiction, burden of proof, standard of proof, remedy, construe), critique vocabulary (premise, warrant, counter-example, elision, category error). Intercultural note: common-law systems (reasoning from decided cases) and civil-law systems (reasoning from codified principle) structure legal argument differently; this module teaches common-law-style reasoning explicitly as one tradition among several.'),

('itm_l6_m5_lesson1', 'unt_l6_m5', 2, 'reading', 'Lesson 5.1 — Provided That, Save Where, Notwithstanding — Legal Precision & Defined Terms',
'LEARNING OBJECTIVES: (1) use "provided that", "save where", "subject to", "notwithstanding", and "unless" with their precise operative effect, (2) recognise that a DEFINED TERM means exactly what its definition says within that document, regardless of ordinary usage, (3) trace how a proviso or exception modifies the rule it attaches to, (4) identify ambiguity created by an undefined term doing decisive work.

PREREQUISITE KNOWLEDGE: Level VI, Module 4 (modality of obligation).

WARM-UP (5 min): Your instructor writes a rule and the same rule with a proviso attached ("A licence shall be granted... provided that the applicant has held no prior revocation") — what, precisely, does the proviso change about who receives a licence?

PRESENTATION (10 min): The exceptive/conditional set: PROVIDED THAT — attaches a condition that must be satisfied for the main provision to operate; SAVE WHERE / EXCEPT WHERE — carves out a category from the main provision''s reach; SUBJECT TO — subordinates this provision to another, which prevails in conflict; NOTWITHSTANDING — the reverse: this provision prevails despite the other; UNLESS — a negative condition. "Subject to" and "notwithstanding" are OPPOSITES IN EFFECT, and confusing them inverts which provision wins. DEFINED TERMS: "For the purposes of this section, ''employee'' includes a contractor engaged for more than 90 days" — inside this document, "employee" now means exactly that, and ordinary usage is irrelevant.

GUIDED PRACTICE (10 min): State the effect of 8 provisions containing a proviso or exception (who is caught, who is excluded), then resolve 3 conflicts between provisions using "subject to"/"notwithstanding" correctly.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draft a short rule with (a) one proviso, (b) one carve-out, and (c) one defined term, then exchange with a partner, who states in plain English exactly who the rule catches and who it does not.

CRITICAL THINKING / DISCUSSION PROMPT: "Legal drafting is deliberately more precise than ordinary language, and deliberately harder to read. Is that trade-off justified? Who benefits from precision, and who is disadvantaged by the difficulty?"

LISTENING ACTIVITY (5 min): Listen to a short exchange in which a drafting ambiguity is identified and resolved, and note precisely which word was at issue.

READING ACTIVITY — EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short statutory or contractual extract (180-220 words) with provisos and defined terms. Answer 2 literal construal questions and 2 independent-judgement questions ("Identify one term doing decisive work that is not defined. What is the strongest argument for each of two possible readings?").

WRITING TASK (5 min): Draft a definitions clause for three terms used in your Module 4 policy provisions, making each definition narrower than ordinary usage in at least one respect.

PRONUNCIATION PRACTICE (5 min): The clear articulation of conditional connectives read aloud — "provided that" and "notwithstanding" receive full, unhurried delivery in legal reading, because their operative effect depends on being heard exactly.

VOCABULARY REINFORCEMENT: a legal-reasoning vocabulary matching game (statute, precedent, obiter, ratio, jurisdiction, burden of proof, standard of proof, remedy, construe).

FORMATIVE ASSESSMENT: Instructor checks that "subject to" and "notwithstanding" are used with correct (opposite) effect, and that defined terms are actually relied on in the drafted rule.

HOMEWORK: Select a published argument, article, or position paper you genuinely DISAGREE WITH on a topic you know well, and identify precisely which step of its reasoning you reject — ready for Lesson 5.2.

REVISION: Lesson 5.2 opens with learners naming the step they reject in one sentence.

EXTENSION: Redraft one of your own provisions to close an ambiguity a partner identified, then re-test it on a different partner.'),

('itm_l6_m5_lesson2', 'unt_l6_m5', 3, 'reading', 'Lesson 5.2 — Stating the Case — The Scholarly Critique & Oral Defence',
'LEARNING OBJECTIVES: (1) reconstruct another author''s argument fairly, in its strongest form, before criticising it, (2) locate disagreement at a specific step — premise, warrant, inference, or scope — rather than rejecting an argument wholesale, (3) write a scholarly critique that disagrees with a more expert source and justifies the disagreement, (4) defend your own argument orally against sustained adversarial questioning without either capitulating or becoming rigid.

PREREQUISITE KNOWLEDGE: Lesson 5.1 (precision, locating ambiguity); Level V, Module 8 (defending a position under challenge).

WARM-UP (5 min): Your instructor states an argument and offers two criticisms — one attacking a weakened version, one attacking its actual strongest form — which criticism is more damaging, and why?

PRESENTATION (10 min): The STEELMAN BEFORE CRITIQUE discipline: restate the target argument in its strongest, most charitable form (better, if possible, than the original author put it), then criticise. An argument defeated only in its weak form is not defeated. LOCATING THE DISAGREEMENT at one of four specific points: the PREMISE (a stated fact is wrong or unsupported), the WARRANT (the premise does not license the inference drawn), the INFERENCE (the reasoning contains a recognised error), or the SCOPE (the conclusion is sound but narrower than claimed). "I disagree with this article" is not a critique; "the argument''s second premise holds only for publicly-listed firms, which the conclusion does not restrict itself to" is. ORAL DEFENCE: receiving a question, identifying which of the four points it attacks, and answering that point rather than a more comfortable one.

GUIDED PRACTICE (10 min): You are given 6 criticisms and classify each as attacking a premise, warrant, inference, or scope — then identify the two that attack a straw version rather than the actual argument.

INDEPENDENT PRACTICE (10 min): Using your Lesson 5.1 homework source, write (a) a fair, strongest-form restatement of the argument you disagree with, and (b) a precisely located critique naming which of the four points you reject and why.

SPEAKING ACTIVITY — ORAL DEFENCE: Present your critique to a small group, which then defends the original argument adversarially — pressing at least three questions, at least one of which challenges whether your restatement was genuinely fair. You must answer the question actually asked.

CRITICAL THINKING / DISCUSSION PROMPT: "You have just criticised a source more expert than you. What entitled you to do so — and what would have made the criticism illegitimate?"

LISTENING ACTIVITY (5 min): Listen to an academic exchange and identify which of the four points each objection attacks, and whether the respondent answered that point or substituted another.

READING ACTIVITY (5 min): Read a published-style scholarly critique and assess whether its restatement of the target argument is genuinely fair, or quietly weakened.

WRITING TASK (5 min): Write the paragraph of your critique that states, as generously as you can, what is genuinely right about the argument you are criticising.

PRONUNCIATION PRACTICE (5 min): Steady, unhurried delivery when answering an adversarial question — including the professional use of a short pause to identify what is actually being asked, which reads as rigour rather than hesitation.

VOCABULARY REINFORCEMENT: a critique-vocabulary matching game (premise, warrant, counter-example, elision, category error) with precise definitions and one worked example of each.

FORMATIVE ASSESSMENT: Instructor checks that the restatement is genuinely charitable (a partner who holds the original view should accept it as fair) and that the critique names a specific one of the four points.

HOMEWORK: Complete your scholarly critique for Module 5''s assignment.

REVISION: This lesson opens with the Lesson 5.1 rejected-step recap. Module 5''s Quiz and Assignment draw on both lessons.

EXTENSION: Identify the strongest available reply to your own critique and answer it in advance — the move that most distinguishes a scholarly critique from an objection.'),

('itm_l6_m5_quiz', 'unt_l6_m5', 4, 'quiz', 'Module 5 Quiz — Law & Justice', NULL),

('itm_l6_m5_assignment', 'unt_l6_m5', 5, 'assignment', 'Module 5 Assignment — A Scholarly Critique & Oral Defence',
'INSTRUCTIONS: Complete two parts on one published argument, article, or position paper you genuinely disagree with, on a topic you know well. PART A (writing, this level''s fifth genre): a scholarly critique, 800-950 words, which (i) restates the target argument in its strongest, most charitable form — a reader who holds that view should accept your restatement as fair; (ii) states clearly what is right about it; (iii) locates your disagreement at a specific point, naming whether you reject a PREMISE, a WARRANT, an INFERENCE, or the SCOPE of the conclusion; (iv) justifies that rejection with reasoning or evidence; and (v) states what would change your mind. Use at least 3 of this module''s reasoning discourse markers. PART B (speaking): an oral defence, 3-4 minutes, presenting your critique and answering at least three adversarial questions — including at least one challenging whether your restatement was genuinely fair.

GRADING RUBRIC: (1) Grammatical accuracy — precise use of conditional and exceptive connectives; accurate, sustained formal-analytical register. (2) Vocabulary range — at least 4 distinct legal-reasoning or critique terms used precisely, plus one phrasal verb/collocation from this module. (3) Task completion — charitable restatement, acknowledgement of merit, specifically located disagreement, justification, and a falsifiability statement all present in Part A; three adversarial questions answered on the point asked in Part B. (4) Independent judgement — is the disagreement genuinely the learner''s own, located at a specific step, and defensible against a reader who holds the original view? Does the critique defeat the argument''s strongest form rather than a weakened version? (5) Discourse coherence & register — is the critical register firm but scholarly (never dismissive of the author personally), and can a reader trace the exact point of divergence without ambiguity?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m5_1', 'itm_l6_m5_quiz', 1, '"A licence shall be granted, provided that the applicant has held no prior revocation." The proviso:', '["removes the obligation entirely","applies only to appeals","has no legal effect","attaches a condition that must be satisfied for the provision to operate"]', 3),
('qq_l6_m5_2', 'itm_l6_m5_quiz', 2, 'If provision A is expressed to be "subject to" provision B, then in a conflict:', '["A prevails","B prevails","both are void","the later-numbered provision prevails"]', 1),
('qq_l6_m5_3', 'itm_l6_m5_quiz', 3, 'If provision A applies "notwithstanding" provision B, then in a conflict:', '["A prevails","B prevails","neither applies","a court must strike both out"]', 0),
('qq_l6_m5_4', 'itm_l6_m5_quiz', 4, '"For the purposes of this section, ''employee'' includes a contractor engaged for more than 90 days." Within this document, "employee":', '["retains its ordinary everyday meaning","is ambiguous and unenforceable","means exactly what the definition says, regardless of ordinary usage","applies only to contractors"]', 2),
('qq_l6_m5_5', 'itm_l6_m5_quiz', 5, 'What does the "steelman before critique" discipline require?', '["restating the target argument in its weakest form","restating it in its strongest, most charitable form before criticising","ignoring the original argument","agreeing with it"]', 1),
('qq_l6_m5_6', 'itm_l6_m5_quiz', 6, '"The argument''s second premise holds only for publicly-listed firms, which the conclusion does not restrict itself to." This criticism attacks the argument''s:', '["grammar","author","publication venue","scope"]', 3),
('qq_l6_m5_7', 'itm_l6_m5_quiz', 7, 'In England and Wales, the party bringing a civil action is now called the:', '["plaintiff","petitioner only","claimant","prosecutor"]', 2),
('qq_l6_m5_8', 'itm_l6_m5_quiz', 8, 'Which phrase means "depend decisively on a point"?', '["turn on","fall within","set aside","give rise to"]', 0),
('qq_l6_m5_9', 'itm_l6_m5_quiz', 9, 'Which phrase means "annul a decision on review"?', '["set aside","give rise to","draw a distinction","fall outside"]', 0),
('qq_l6_m5_10', 'itm_l6_m5_quiz', 10, 'Which is a genuine critique rather than a mere objection?', '["\"I disagree with this article.\"","\"This is badly written.\"","\"The warrant does not license the inference: the correlation reported supports association, not the causal claim drawn from it.\"","\"The author is not well known.\""]', 2);

-- ---------------------------------------------------------------------
-- Module 6: Innovation & Emerging Technologies
-- Full prose version: docs/curriculum/level-6/module-06-innovation-emerging-technologies.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m6', 'crs_level_6', 6, 'Module 6: Innovation & Emerging Technologies');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m6_overview', 'unt_l6_m6', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Were this to succeed,... — Had the approach been available earlier,... — This is best understood as... — To put it in non-technical terms,... — The honest answer is that we do not yet know whether... — What would have to be true for this to work is...

DISCOURSE MARKERS (functional set — calibrated speculation): "were this to succeed", "what would have to be true for this to work is", "the honest answer is that we do not yet know whether", "on current evidence, the most we can say is". The module''s central discipline is STATING WHAT WOULD HAVE TO BE TRUE — a technique that converts vague optimism into a testable proposition, and the single most useful habit in evaluating innovation claims.

PHRASAL VERBS & COLLOCATIONS: "scale up" (increase capacity, distinguished from "scale back", Module 3), "bear out [a hypothesis]" (of evidence, to confirm it), "pan out" (work out successfully in the end), "rule out [a possibility]", "build on [prior work]" — note that "bear out" and "pan out" are near-synonyms differing in register ("bear out" is neutral-formal and transitive; "pan out" is informal and intransitive).

BrE / AmE NOTE: British "aluminium" vs. American "aluminum" (a genuine spelling AND pronunciation difference, four syllables vs. three); British "maths" vs. American "math"; British "specialisation" vs. American "specialization". More consequentially for proposals: British funding language uses "bid" and "tender" where American usage often prefers "proposal" and "solicitation" — and a British "tender" is a formal competitive procurement process, not merely an offer.

KEY VOCABULARY: innovation vocabulary (proof of concept, prototype, iteration, adoption curve, technical debt, failure mode, feasibility), proposal vocabulary (deliverable, milestone, work package, principal investigator, dissemination). Intercultural note: norms around how confidently an innovation should be pitched vary sharply — some funding cultures reward bold projection, others penalise it as unserious; this module teaches calibrated confidence as the standard that travels best.'),

('itm_l6_m6_lesson1', 'unt_l6_m6', 2, 'reading', 'Lesson 6.1 — Were This to Succeed — Speculative Register & Technical-to-General Translation',
'LEARNING OBJECTIVES: (1) use "were + to"-infinitive and inverted conditional forms accurately in formal speculative register, (2) state what would have to be true for a proposition to hold, converting vague claims into testable ones, (3) translate technical material for a non-specialist audience without distorting it, (4) recognise the two failure modes of technical translation — distortion and condescension.

PREREQUISITE KNOWLEDGE: Level V, Module 1 (mixed conditionals) and Level VI, Module 5 (conditional precision).

WARM-UP (5 min): Your instructor writes "If this were to succeed, it would change the field" and "Were this to succeed, it would change the field" — what differs? (The second is the same meaning at a markedly higher register, achieved by inversion and the deletion of "if".)

PRESENTATION (10 min): Inverted conditionals: "Were this to succeed, ..." (present/future hypothetical); "Had the approach been available five years ago, ..." (past counterfactual); "Should the trial confirm these results, ..." (open future condition, formal). The inversion REPLACES "if", and "if" must then be omitted — "If were this to succeed" is an error. The WHAT WOULD HAVE TO BE TRUE technique: instead of "this technology could transform logistics" (unfalsifiable optimism), write "for this to transform logistics, three things would have to be true: unit cost would have to fall below X, regulatory approval would have to extend to Y, and existing infrastructure would have to accommodate Z" — the same claim, now testable. Technical translation has two failure modes: DISTORTION (simplifying until the claim is no longer true) and CONDESCENSION. The test of good translation is that a specialist would accept it as accurate AND a non-specialist would find it useful.

GUIDED PRACTICE (10 min): Convert 6 "if"-conditionals into inverted form, then rewrite 4 vague innovation claims as "what would have to be true" propositions.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Take a technical concept you genuinely understand and write two versions — one for a specialist, one for an intelligent non-specialist — then exchange with a partner, who states what they now understand and whether anything felt condescending.

CRITICAL THINKING / DISCUSSION PROMPT: "Every simplification loses something. How do you decide which losses are acceptable and which make the translation dishonest?"

LISTENING ACTIVITY (5 min): Listen to a technical explanation delivered to a general audience and identify one point where simplification was well-judged and one where it may have distorted.

READING ACTIVITY — EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a short innovation-claim text (180-220 words). Answer 2 literal questions and 2 independent-judgement questions ("Rewrite the central claim as a ''what would have to be true'' proposition. On current evidence, which of those conditions is least likely to hold?").

WRITING TASK (5 min): Write three inverted-conditional sentences about a technology or approach you know, and one "what would have to be true" proposition.

PRONUNCIATION PRACTICE (5 min): The distinct intonation contour of an inverted conditional read aloud — the fronted "Were"/"Had"/"Should" carries a lifted, sustained delivery, with a clear juncture before the main clause, which signals to a listener that a conditional (not a question) has begun.

VOCABULARY REINFORCEMENT: an innovation-vocabulary matching game (proof of concept, prototype, iteration, adoption curve, technical debt, failure mode, feasibility).

FORMATIVE ASSESSMENT: Instructor checks that "if" is correctly omitted in inverted conditionals, and that "what would have to be true" propositions are genuinely testable rather than restated optimism.

HOMEWORK: Select a real or invented project you could plausibly seek funding for, and note the problem it addresses, the approach, one deliverable, and one honest risk — ready for Lesson 6.2.

REVISION: Lesson 6.2 opens with learners stating their project''s problem in one sentence.

EXTENSION: Write the same technical explanation for a third audience — a funder who is neither specialist nor lay, but who must judge whether to invest.'),

('itm_l6_m6_lesson2', 'unt_l6_m6', 3, 'reading', 'Lesson 6.2 — From the Stage — The Keynote Address & the Grant Proposal',
'LEARNING OBJECTIVES: (1) structure a keynote address around a single controlling idea rather than a survey of information, (2) carry a general audience through unfamiliar material using an anchoring analogy, (3) write a grant or project proposal with a stated problem, approach, deliverable, timeline, and an honestly disclosed risk, (4) close a keynote on a resolution the audience can carry away.

PREREQUISITE KNOWLEDGE: Lesson 6.1 (speculative register, technical translation); Level V, Module 7 (the research-informed presentation).

WARM-UP (5 min): Your instructor delivers 30 seconds of a talk organised as a list of facts, then 30 seconds of the same material organised around one controlling idea — which could the class still summarise a week later?

PRESENTATION (10 min): The keynote''s architecture: ONE CONTROLLING IDEA (a keynote that tries to convey five ideas conveys none — the most common failure); AN OPENING THAT EARNS ATTENTION without gimmick; AN ANCHORING ANALOGY a general audience can hold onto while unfamiliar material is introduced; TWO OR THREE MOVEMENTS that each return to and deepen the controlling idea; and A RESOLUTION — not a summary, but a statement of what the idea asks of the audience. The grant/project proposal structure: PROBLEM (specific, demonstrably unsolved), APPROACH (what you will actually do, in enough detail to be assessed), DELIVERABLES AND MILESTONES (dated, verifiable), RISK (honestly disclosed, with mitigation) — disclosed risk STRENGTHENS a proposal, because assessors discount proposals that claim no risk, concluding the applicant has not thought hard enough.

GUIDED PRACTICE (10 min): You are given 4 keynote outlines and identify which have a genuine controlling idea and which are surveys; then draft an anchoring analogy for one unfamiliar concept.

INDEPENDENT PRACTICE (10 min): Using your Lesson 6.1 homework project, draft your proposal''s problem and approach sections, and outline a keynote built on one controlling idea derived from the project.

SPEAKING ACTIVITY — KEYNOTE ADDRESS: Deliver a 3-4 minute keynote extract to the group — establishing the controlling idea, deploying the anchoring analogy, and closing on a resolution. The audience is asked afterwards to state the controlling idea in one sentence; if they cannot, the keynote has not yet worked.

CRITICAL THINKING / DISCUSSION PROMPT: "A keynote is designed to move an audience, and a grant proposal is designed to persuade assessors. Both are advocacy. What distinguishes legitimate advocacy for an idea from overselling it — and does disclosing risk really help, or is that just a convention?"

LISTENING ACTIVITY (5 min): Listen to a keynote extract, state its controlling idea in one sentence, and identify the anchoring analogy.

READING ACTIVITY (5 min): Read a short proposal extract and assess whether its stated risk is genuine or token — the distinction assessors are trained to make.

WRITING TASK (5 min): Write your proposal''s risk section: one genuine risk, why it is genuine, and what you would do if it materialised.

PRONUNCIATION PRACTICE (5 min): Keynote delivery — a wider pitch range and more deliberate pausing than any register practised so far, with the controlling idea receiving its own isolated, unhurried delivery each time it recurs.

VOCABULARY REINFORCEMENT: a proposal-vocabulary matching game (deliverable, milestone, work package, principal investigator, dissemination) plus the BrE/AmE "bid"/"tender" vs. "proposal"/"solicitation" distinction.

FORMATIVE ASSESSMENT: Instructor checks that the audience can independently state the keynote''s controlling idea, and that the proposal''s disclosed risk is genuine rather than token.

HOMEWORK: Complete your grant proposal for Module 6''s assignment.

REVISION: This lesson opens with the Lesson 6.1 project-problem recap. Module 6''s Quiz and Assignment draw on both lessons.

EXTENSION: Write the single sentence a sceptical assessor would use to reject your proposal, then revise the proposal to answer it.'),

('itm_l6_m6_quiz', 'unt_l6_m6', 4, 'quiz', 'Module 6 Quiz — Innovation & Emerging Technologies', NULL),

('itm_l6_m6_assignment', 'unt_l6_m6', 5, 'assignment', 'Module 6 Assignment — A Grant Proposal & Keynote Address',
'INSTRUCTIONS: Complete two parts on one real or invented project. PART A (writing, this level''s sixth genre): a grant or project proposal, 700-850 words, stating a SPECIFIC, DEMONSTRABLY UNSOLVED PROBLEM; an APPROACH described in enough detail to be assessed; at least two dated, verifiable DELIVERABLES OR MILESTONES; and one HONESTLY DISCLOSED RISK with its mitigation. Include at least 2 inverted conditionals and one "what would have to be true" proposition. PART B (speaking): a keynote address extract, 3-4 minutes, built on a single controlling idea derived from the project, using an anchoring analogy to carry a general audience through the unfamiliar material, and closing on a resolution rather than a summary.

GRADING RUBRIC: (1) Grammatical accuracy — correctly formed inverted conditionals with "if" omitted; accurate speculative register throughout. (2) Vocabulary range — at least 4 distinct innovation or proposal terms used precisely, plus one phrasal verb/collocation from this module at an appropriate register. (3) Task completion — problem, approach, dated deliverables, and a genuine disclosed risk with mitigation in Part A; a single controlling idea, an anchoring analogy, and a resolution in Part B. (4) Independent judgement — is the stated problem genuinely unsolved (not merely unaddressed by the applicant), and is the disclosed risk the one that would actually threaten the project, rather than a safe one? (5) Rhetorical effectiveness — could a listener state the keynote''s controlling idea in one sentence afterwards, and does the anchoring analogy genuinely aid understanding rather than decorate? (6) Discourse coherence & register — is the technical material translated without distortion or condescension, and is speculative confidence calibrated?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m6_1', 'itm_l6_m6_quiz', 1, '"___ this to succeed, it would change the field." (inverted conditional)', '["If were","Was","If it were to were","Were"]', 3),
('qq_l6_m6_2', 'itm_l6_m6_quiz', 2, '"___ the approach been available five years ago, the outcome would have differed."', '["If had","Had","Have","Should have"]', 1),
('qq_l6_m6_3', 'itm_l6_m6_quiz', 3, 'In an inverted conditional, "if" must be:', '["omitted","retained before the inversion","replaced with \"whether\"","moved to the end"]', 0),
('qq_l6_m6_4', 'itm_l6_m6_quiz', 4, 'Which converts a vague innovation claim into a testable one?', '["\"This technology could transform logistics.\"","\"This technology is revolutionary.\"","\"For this to transform logistics, unit cost would have to fall below X and regulatory approval would have to extend to Y.\"","\"Experts are excited about this.\""]', 2),
('qq_l6_m6_5', 'itm_l6_m6_quiz', 5, 'What are the two failure modes of technical-to-general translation?', '["length and brevity","distortion and condescension","formality and informality","speed and hesitation"]', 1),
('qq_l6_m6_6', 'itm_l6_m6_quiz', 6, 'A keynote address should be organised around:', '["as many ideas as time allows","a list of facts","the speaker''s biography","a single controlling idea"]', 3),
('qq_l6_m6_7', 'itm_l6_m6_quiz', 7, 'Why does honestly disclosing risk generally strengthen a grant proposal?', '["it shortens the proposal","it is legally required everywhere","assessors discount proposals claiming no risk, concluding the applicant has not thought hard enough","it removes the need for milestones"]', 2),
('qq_l6_m6_8', 'itm_l6_m6_quiz', 8, 'In British usage, a formal competitive procurement process is called a:', '["tender","solicitation","requisition","docket"]', 0),
('qq_l6_m6_9', 'itm_l6_m6_quiz', 9, 'Which phrase means "of evidence, to confirm a hypothesis"?', '["bear out","pan out","scale up","rule out"]', 0),
('qq_l6_m6_10', 'itm_l6_m6_quiz', 10, 'Which pair differ mainly in register, meaning roughly "work out successfully"?', '["rule out / build on","scale up / scale back","bear out (neutral-formal, transitive) / pan out (informal, intransitive)","build on / bear out"]', 2);

-- ---------------------------------------------------------------------
-- Module 7: Media & Public Communication
-- Full prose version: docs/curriculum/level-6/module-07-media-public-communication.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m7', 'crs_level_6', 7, 'Module 7: Media & Public Communication');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m7_overview', 'unt_l6_m7', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Not X, but Y. — We can do this; we must do this; we will do this. — Here is what we know. Here is what we do not yet know. Here is what we are doing. — I am not going to speculate, but I will tell you... — Let me correct the premise of that question.

DISCOURSE MARKERS (functional set — controlled correction under pressure): "let me correct the premise of that question", "I''d distinguish between X and Y there", "that''s not quite what happened, and the difference matters", "I won''t speculate, but what I can tell you is" — language for declining a framing without declining to answer. CORRECTING A QUESTION IS NOT EVADING IT, and the difference is visible to an audience.

RHETORICAL DEVICES: TRICOLON — three parallel elements, the third often longest ("we can do this; we must do this; and we will do this, starting today"). ANAPHORA — repetition of the opening words across successive clauses. ANTITHESIS — paired opposites in parallel structure ("not X, but Y"). Named explicitly, because at mastery level these must be chosen, not stumbled into — and because their overuse is the defining failure of hollow public speech.

PHRASAL VERBS & COLLOCATIONS: "front-foot [a story]" (BrE: address an emerging story proactively — a cricket metaphor), "put out [a statement]", "stand something up" (journalistic idiom: verify a claim sufficiently to publish), "head off [criticism]", "set the record straight".

BrE / AmE NOTE: British "the press" and "Fleet Street" (a historical metonym for the national newspaper industry) vs. American "the media"; British "presenter" vs. American "host"; British "advert/advertisement" vs. American "ad/commercial"; British "redtop" for a mass-market tabloid, which has no direct American equivalent term. The Level V, Module 6 pair — "newsreader" (BrE) / "news anchor" (AmE) — is used substantively here.

KEY VOCABULARY: media vocabulary (embargo, on/off the record, background, attribution, doorstep, right of reply), crisis vocabulary (holding statement, situation report, single source of truth, reputational exposure). Intercultural note: what counts as a legitimately adversarial interview varies sharply by media culture — in some traditions sustained interruption signals rigour, in others discourtesy.'),

('itm_l6_m7_lesson1', 'unt_l6_m7', 2, 'reading', 'Lesson 7.1 — Three Things, and a Turn — Rhetorical Devices at Scale & the Opinion Editorial',
'LEARNING OBJECTIVES: (1) construct tricolon, anaphora, and antithesis deliberately and accurately, (2) judge when a rhetorical device earns its place and when it substitutes for substance, (3) write an opinion editorial that establishes a position, concedes the strongest counter-argument, and resolves — within a strict word limit, (4) cut an editorial to length without losing its argument.

PREREQUISITE KNOWLEDGE: Level V, Module 3 (inversion) and Module 6 (cleft sentences); Level VI, Module 3 (fronting).

WARM-UP (5 min): Your instructor reads two versions of one sentence — plain, and in tricolon — and asks which is more memorable; then reads a passage in which EVERY sentence is a tricolon, and asks what has happened to the effect.

PRESENTATION (10 min): TRICOLON: three parallel elements, the third typically longest and carrying the weight ("It is a question of fairness, of practicality, and of whether we are willing to be judged by what we do rather than what we announce"). ANAPHORA: successive clauses opening with the same words, building pressure. ANTITHESIS: parallel structure holding two opposites in tension ("Not because it is easy, but because it is right"). The governing rule: these devices work by CONTRAST WITH PLAINER SURROUNDING TEXT — a speech constructed entirely of them is exhausting and sounds evasive, because an audience senses that structure is doing work that argument should do. The OP-ED ARCHITECTURE: a first paragraph that stakes the position without preamble; a concession of the strongest counter-argument placed EARLY (not buried at the end, where it reads as an afterthought); the argument proper; and a close that resolves rather than summarises — all within 700-800 words, because the form''s discipline is its constraint.

GUIDED PRACTICE (10 min): Construct one tricolon, one anaphora, and one antithesis on a shared topic, then evaluate 4 provided passages for whether each device earns its place.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draft an op-ed opening paragraph (staking a position in under 60 words) and the concession paragraph, then exchange with a partner, who states the position and judges whether the concession engages the STRONGEST counter-argument or a convenient weaker one. Read your opening aloud; the group votes on whether the position was unmistakable within the first two sentences.

CRITICAL THINKING / DISCUSSION PROMPT: "Rhetorical devices make prose more persuasive without adding evidence. Is that a legitimate part of argument, or a way of winning agreement one has not earned? Does your answer change depending on whether the underlying argument is sound?"

LISTENING ACTIVITY (5 min): Listen to a speech extract and identify each rhetorical device and whether it earns its place.

READING ACTIVITY — EXTENDED READING & INDEPENDENT JUDGEMENT (8 min): Read a published-style op-ed (200-240 words). Answer 2 literal questions and 2 independent-judgement questions ("Does the concession engage the strongest counter-argument available, or a weaker one? What would the strongest version have been?").

WRITING TASK (5 min): Cut a provided 250-word passage to 180 words without losing any element of its argument — the core editorial skill.

PRONUNCIATION PRACTICE (5 min): Tricolon delivery — the three elements take rising emphasis with a distinct pause before the third, and the third is delivered more slowly; getting this contour wrong flattens the device entirely.

VOCABULARY REINFORCEMENT: a rhetorical-device identification game: find and name tricolon, anaphora, and antithesis in a short provided speech, and mark one instance where the device is doing work that evidence should be doing.

FORMATIVE ASSESSMENT: Instructor checks that devices are used sparingly and that each op-ed opening stakes an unmistakable position within two sentences.

HOMEWORK: Select a real or invented organisational crisis scenario in which the facts are genuinely incomplete, and note what is known, what is not yet known, and what is being done — ready for Lesson 7.2.

REVISION: Lesson 7.2 opens with learners stating their scenario in one sentence.

EXTENSION: Rewrite your op-ed opening without any rhetorical device at all, and judge honestly which version is stronger.'),

('itm_l6_m7_lesson2', 'unt_l6_m7', 3, 'reading', 'Lesson 7.2 — Under the Lights — The Hostile Interview & Crisis Leadership Communication',
'LEARNING OBJECTIVES: (1) correct a question''s false premise without appearing evasive, (2) maintain message discipline under sustained interruption while remaining truthful, (3) deliver a crisis holding statement structured as what we know / what we do not yet know / what we are doing, (4) decline to speculate while still giving the audience genuine information.

PREREQUISITE KNOWLEDGE: Lesson 7.1 (rhetorical devices, public register); Level V, Module 6 (handling loaded questions) and Module 8 (crisis communication''s four-part structure).

WARM-UP (5 min): Your instructor asks a question with a false premise ("Given that the organisation ignored these warnings for two years, why should anyone trust it now?") — how do you answer truthfully if the premise is simply wrong?

PRESENTATION (10 min): PREMISE CORRECTION: "Let me correct the premise there — the warnings were received eleven months ago, not two years, and here is what happened in that period." Correcting a premise is NOT evasion, and an audience can tell the difference — evasion changes the subject, premise-correction answers the corrected question directly. MESSAGE DISCIPLINE UNDER INTERRUPTION: returning to the substantive point after an interruption without visible irritation, and conceding a genuine hit immediately rather than defending an indefensible point (which costs more credibility than the concession). The CRISIS HOLDING STATEMENT: here is what we know / here is what we do not yet know / here is what we are doing / here is when you will hear from us next. The second element is the one most organisations omit and the one that most builds credibility: stating the limits of your knowledge is what makes the rest believable.

GUIDED PRACTICE (10 min): Identify the false premise in 6 hostile questions and draft a correcting answer for each that still addresses the underlying concern.

INDEPENDENT PRACTICE (10 min): Using your Lesson 7.1 homework scenario, draft a 60-second crisis holding statement using the four-part structure, and anticipate three hostile questions.

SPEAKING ACTIVITY — HOSTILE INTERVIEW & CRISIS STATEMENT: Deliver your holding statement, then face a 2-3 minute hostile interview from the group, including at least one false-premise question and at least one sustained interruption. You must correct at least one premise, concede at least one genuine point, and decline at least one invitation to speculate while still providing information.

CRITICAL THINKING / DISCUSSION PROMPT: "In a crisis, an organisation''s lawyers usually advise saying as little as possible; its communications advisers usually advise saying more, sooner. When those two pieces of advice conflict, whose should prevail — and what does your answer say about who the organisation believes it is accountable to?"

LISTENING ACTIVITY (5 min): Listen to a hostile interview extract and identify one genuine premise correction and one instance of evasion — and articulate what distinguished them.

READING ACTIVITY (5 min): Read two crisis statements and identify which one states the limits of its own knowledge, and what that does to its credibility.

WRITING TASK (5 min): Write the "what we do not yet know" section of your crisis statement — the element most organisations omit.

PRONUNCIATION PRACTICE (5 min): Steady delivery under interruption — the professional skill is completing a sentence at unchanged pace after being cut across, since accelerating signals panic and stopping concedes the floor.

VOCABULARY REINFORCEMENT: a media-vocabulary matching game (embargo, on/off the record, background, attribution, doorstep, right of reply, holding statement) — noting that "off the record" and "on background" are NOT synonyms and confusing them has real professional consequences.

FORMATIVE ASSESSMENT: Instructor checks that at least one premise is corrected without evasion, one genuine point conceded, and the holding statement includes an explicit statement of what is not yet known.

HOMEWORK: Complete your opinion editorial for Module 7''s assignment.

REVISION: This lesson opens with the Lesson 7.1 scenario recap. Module 7''s Quiz and Assignment draw on both lessons.

EXTENSION: Draft the follow-up statement issued 48 hours later, when some of the "not yet known" items have been resolved — including at least one that turned out worse than hoped.'),

('itm_l6_m7_quiz', 'unt_l6_m7', 4, 'quiz', 'Module 7 Quiz — Media & Public Communication', NULL),

('itm_l6_m7_assignment', 'unt_l6_m7', 5, 'assignment', 'Module 7 Assignment — An Opinion Editorial & Crisis Response',
'INSTRUCTIONS: Complete two parts. PART A (writing, this level''s seventh genre): an opinion editorial, STRICTLY 700-800 words — the word limit is part of the assessment. It must stake an unmistakable position within its first two sentences, concede the strongest available counter-argument early, argue its case, and close on a resolution rather than a summary. Use NO MORE THAN THREE rhetorical devices from this module in total, each placed where it genuinely earns its position. PART B (speaking): a crisis response, comprising a 60-90 second holding statement structured as what we know / what we do not yet know / what we are doing / when you will hear from us next, followed by a 2-3 minute hostile interview in which you correct at least one false premise, concede at least one genuine point, and decline at least one invitation to speculate while still providing real information.

GRADING RUBRIC: (1) Grammatical accuracy — accurately constructed rhetorical devices; sustained public-facing register. (2) Vocabulary range — at least 4 distinct media or crisis terms used precisely, plus one phrasal verb/collocation from this module; correct distinction between "off the record" and "on background" if either is used. (3) Task completion — position staked within two sentences, strongest counter-argument conceded early, resolution reached, and word limit observed in Part A; all four holding-statement elements, a premise correction, a genuine concession, and a declined speculation in Part B. (4) Independent judgement — is the counter-argument conceded genuinely the strongest one available, and is the editorial''s position one the writer has actually reasoned to? (5) Rhetorical effectiveness — do the devices used strengthen the argument rather than substitute for it, and would the editorial survive the removal of every device with its argument intact? (6) Discourse coherence & register — does the interview performance distinguish visibly between correcting a premise and evading a question, and does the holding statement remain truthful under incomplete information?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m7_1', 'itm_l6_m7_quiz', 1, '"It is a question of fairness, of practicality, and of whether we are willing to be judged by what we do." This is an example of:', '["anaphora","antithesis","tricolon","litotes"]', 2),
('qq_l6_m7_2', 'itm_l6_m7_quiz', 2, '"Not because it is easy, but because it is right." This is an example of:', '["antithesis","tricolon","anaphora","ellipsis"]', 0),
('qq_l6_m7_3', 'itm_l6_m7_quiz', 3, 'Repetition of the same opening words across successive clauses is called:', '["antithesis","tricolon","nominalisation","anaphora"]', 3),
('qq_l6_m7_4', 'itm_l6_m7_quiz', 4, 'What is the governing rule for using rhetorical devices at scale?', '["use one in every sentence","they work by contrast with plainer surrounding text","they should be hidden from the audience","they replace the need for evidence"]', 1),
('qq_l6_m7_5', 'itm_l6_m7_quiz', 5, 'In an opinion editorial, the strongest counter-argument should be conceded:', '["early, where it reads as confidence rather than damage control","at the very end, as an afterthought","never","only if the editor requires it"]', 0),
('qq_l6_m7_6', 'itm_l6_m7_quiz', 6, '"Let me correct the premise there — the warnings were received eleven months ago, not two years." This is:', '["evasion","speculation","premise correction, which answers the corrected question directly","a refusal to answer"]', 2),
('qq_l6_m7_7', 'itm_l6_m7_quiz', 7, 'Which element do most organisations omit from a crisis holding statement, and which most builds credibility?', '["what we know","what we do not yet know","what we are doing","the organisation''s name"]', 1),
('qq_l6_m7_8', 'itm_l6_m7_quiz', 8, 'In British media usage, "Fleet Street" is a metonym for:', '["broadcasting regulators","advertising agencies","the film industry","the national newspaper industry"]', 3),
('qq_l6_m7_9', 'itm_l6_m7_quiz', 9, 'Which phrase means "address an emerging story proactively rather than reactively"?', '["put out","stand up","head off","front-foot"]', 3),
('qq_l6_m7_10', 'itm_l6_m7_quiz', 10, 'In journalism, to "stand up" a claim means to:', '["publish it without checking","verify it sufficiently to publish","retract it","deny it publicly"]', 1);

-- ---------------------------------------------------------------------
-- Module 8: Research & Scholarship
-- Full prose version: docs/curriculum/level-6/module-08-research-and-scholarship.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m8', 'crs_level_6', 8, 'Module 8: Research & Scholarship');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m8_overview', 'unt_l6_m8', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: This paper argues that... — The literature has largely overlooked... — These results are consistent with, though they do not establish, ... — A limitation of this approach is... — Further work would be required before... — I''ll make one argument today, in three steps. — That is outside what my data can support.

DISCOURSE MARKERS THIS MODULE (functional set — the hedging ladder): demonstrates -> indicates -> suggests -> is consistent with -> may indicate. These are not stylistic alternatives. They are a calibrated scale of epistemic strength, and moving one rung in either direction changes what a paper is claiming. The most common substantive criticism of academic writing at this level is not that the evidence is weak but that the CLAIM OUTRUNS THE EVIDENCE — that the writer wrote "demonstrates" where the data only supports "is consistent with". Mastery here is not learning more hedges; it is learning to place a claim on the right rung and defend that placement.

PHRASAL VERBS & COLLOCATIONS: draw on [a body of work] (use it as a foundation), bear out [a hypothesis] (support it with evidence), rule out [an explanation] (eliminate it), account for [variance] (explain it), set out [an argument] (present it systematically), follow up [a finding] (investigate it further). Collocations: a robust finding, compelling evidence, a substantial body of literature, a significant caveat, a plausible mechanism.

BrE / AmE NOTE — the one that matters most for scholarly writing. British and American English differ in QUOTATION PUNCTUATION, and in a quotation-heavy academic text the difference is visible on every page. American convention places commas and full stops INSIDE the closing quotation mark regardless of whether they belong to the quoted material. British convention ("logical quotation") places them OUTSIDE unless they were part of the original. British practice is the more defensible for scholarship, because it never silently alters what is inside the quotation marks. Related: the -ise/-ize question is NOT a British/American divide — Oxford spelling uses -ize (organize, recognize) in British English, so a journal demanding -ize is not demanding Americanisation. What IS genuinely British is whilst, amongst, and analyse/programme (though computer "program" is program everywhere).

KEY VOCABULARY PREVIEWED: research vocabulary (hypothesis, methodology, sample, corpus, replication, peer review, preprint, confounding factor, effect size, generalisability), metadiscourse vocabulary (hedge, booster, stance, warrant, caveat, corollary). Intercultural note: the degree of directness expected when disagreeing with an established source in print varies substantially between academic cultures, as does whether the first person ("I argue") is acceptable; this module teaches the Anglophone international-journal convention, and names it as one convention rather than the universal standard.'),

('itm_l6_m8_lesson1', 'unt_l6_m8', 2, 'reading', 'Lesson 8.1 — Suggests, Indicates, Demonstrates: Metadiscourse & Calibrated Claim in the Research Paper',
'LEARNING OBJECTIVES: By the end of this lesson you can (1) identify and use hedges, boosters, attitude markers and engagement markers accurately; (2) place a claim on the hedging ladder at the rung its evidence actually supports, and defend the placement; (3) choose between integral and non-integral citation deliberately; (4) select reporting verbs whose implied stance matches your intended stance; (5) write a three-move introduction that establishes a territory, identifies a gap, and states what the paper will do.

PREREQUISITE KNOWLEDGE: Level V Module 7 (research and presentation) and Module 2 (academic writing III); Level VI Module 3 (the evidence -> inference -> recommendation discipline). This lesson moves that discipline into the register in which it is most exposed, because a scholarly reader is trained specifically to detect the gap between claim and warrant.

WARM-UP (5 min): Instructor writes one finding on the board and five sentences reporting it, differing only in reporting verb and hedge. Learners rank the five by strength of claim, then say which the finding actually supports. The predictable result — that the group agrees on the ranking but disagrees on where the finding sits — is the lesson''s opening.

PRESENTATION (10 min): Introduce the four categories of metadiscourse with a worked example of each. HEDGES (may, appears to, tends to, arguably, in most cases) reduce commitment. BOOSTERS (clearly, demonstrably, without question) increase it — and are far more dangerous, because an unearned booster destroys a reader''s trust in every other claim in the paper. ATTITUDE MARKERS (strikingly, unfortunately, importantly) signal the writer''s evaluation. ENGAGEMENT MARKERS (consider, note that, one might object) address the reader directly and are the writer''s main tool for anticipating objection. Then model INTEGRAL vs NON-INTEGRAL CITATION: "Ramirez (2019) argues that..." foregrounds the AUTHOR, and is right when the source is itself the subject of discussion; "it has been argued that... (Ramirez, 2019)" foregrounds the CLAIM, and is right when the claim matters more than who made it. Finally, the STANCE CARRIED BY REPORTING VERBS: "argues" is neutral; "demonstrates" endorses; "claims" and "asserts" signal scepticism; "concedes" and "acknowledges" imply the source is giving ground. Writers routinely say "claims" when they mean "argues" and thereby disparage a source they intended to treat respectfully.

GUIDED PRACTICE (10 min): Learners are given 6 findings paired with 6 claim sentences and must identify which are over-claimed, which are over-hedged, and rewrite each at the correct rung. Over-hedging is assessed as an error of equal weight to over-claiming, because a paper that hedges everything commits to nothing and cannot be disagreed with.

INDEPENDENT PRACTICE (10 min): Learners write the THREE-MOVE INTRODUCTION to their Module 8 research paper: move one establishes the territory (in no more than three sentences); move two establishes the gap (what the existing literature has not settled — stated as a gap, not as a criticism of individuals); move three occupies it (what this paper does, in one sentence beginning "This paper argues that..."). The move-two/move-three join is where most introductions fail, because the stated gap and the stated contribution do not actually correspond.

SPEAKING ACTIVITY: In pairs, each learner reads move two and move three aloud; the partner''s only task is to say whether the contribution answers the gap that was just stated. Nothing else is discussed.

CRITICAL THINKING / DISCUSSION PROMPT: "Hedging makes a claim harder to refute. Is careful hedging therefore a form of intellectual honesty, or a way of protecting oneself from being wrong? Where is the line between the two — and can you state a test that distinguishes them?"

LISTENING ACTIVITY (5 min): Listen to a researcher describing a finding twice — once to a specialist audience and once to a general one — and identify every point at which the hedging changes, then judge whether any of those changes altered the substance of the claim.

READING ACTIVITY — extended reading & independent judgement (8 min): Read an adapted journal-article extract (220-260 words). Answer 2 literal comprehension questions and 2 independent-judgement questions ("Identify one claim whose strength exceeds its stated evidence. What is the strongest defensible version of that claim?").

WRITING TASK (5 min): Take a provided over-claimed paragraph and rewrite it so every claim sits at a defensible rung — without making the paragraph say nothing.

PRONUNCIATION PRACTICE (5 min): Contrastive stress on hedges when speaking about research — "these results are consistent WITH the hypothesis; they do not ESTABLISH it." Unstressed, the distinction is inaudible and an audience hears the stronger claim.

VOCABULARY REINFORCEMENT: A reporting-verb stance-sorting task — learners sort 15 reporting verbs into endorsing, neutral and distancing, then find the two whose classification the group disagrees about and articulate why.

FORMATIVE ASSESSMENT: Instructor checks that each introduction contains all three moves, that move three answers move two, and that no booster appears without evidence in support.

HOMEWORK: Draft the results-and-discussion section of your research paper, and write the LIMITATIONS paragraph first — before the discussion — so the discussion is written inside the constraint rather than retrofitted to it.

REVISION: Lesson 8.2 opens with each learner stating their paper''s central argument in one sentence and its principal limitation in one sentence.

EXTENSION: Take your own strongest claim and write the paragraph a hostile reviewer would write against it, then decide whether to revise the claim or to answer the reviewer in the paper.'),

('itm_l6_m8_lesson2', 'unt_l6_m8', 3, 'reading', 'Lesson 8.2 — Twelve Minutes and Ten Questions: The Conference Presentation',
'LEARNING OBJECTIVES: By the end of this lesson you can (1) convert a written research paper into a spoken conference presentation rather than reading it aloud; (2) signpost a spoken argument so an audience can follow it without the text in front of them; (3) recognise the four kinds of question asked at conferences and respond to each appropriately; (4) answer "I don''t know" in a form that strengthens rather than weakens your position.

PREREQUISITE KNOWLEDGE: Lesson 8.1; Level VI Module 5 (oral defence) and Module 6 (keynote structure). The keynote taught you to carry one controlling idea to a large audience; this lesson teaches the opposite constraint — a specialist audience, a short slot, and questioners who have read the literature you are citing.

WARM-UP (5 min): Instructor reads 90 seconds of dense written academic prose aloud, then delivers the same content as speech. Learners identify what changed: sentence length, the explicit numbering of parts, the repetition of the key term where the written version used a pronoun.

PRESENTATION (10 min): Establish the form''s first rule — A CONFERENCE PRESENTATION IS NOT THE PAPER. The paper''s job is to be complete; the presentation''s job is to make one argument land and to make the audience want to read the paper. Model the structure: one argument, stated within the first 45 seconds; three supporting moves, each explicitly announced ("that is the first of three"); the limitation stated by the speaker before anyone asks; and a close that returns to the argument. Then model the FOUR KINDS OF CONFERENCE QUESTION. (1) The CLARIFICATION — answer briefly and move on. (2) The GENUINE CHALLENGE — the valuable one; restate it in a single clause to confirm you have understood, then answer directly, and concede the part that is right. (3) The "HAVE YOU READ X" — a reading suggestion wearing the costume of a question; thank the questioner, say honestly whether you have read it, and say what you will do with it. (4) The question that is ACTUALLY THE QUESTIONER''S OWN PAPER — acknowledge the point, find the one element that genuinely bears on your work, respond to that element, and stop. Across all four the professional pattern is the same: thank, restate in one clause, answer, STOP. The stopping is the hardest part, because a nervous speaker keeps talking and thereby converts a good answer into a weak one.

GUIDED PRACTICE (10 min): Learners are given 8 questions and classify each into the four types, then draft a one-clause restatement for each. Two of the eight are deliberately ambiguous between types 2 and 4, which the group must argue about.

INDEPENDENT PRACTICE (10 min): Learners rehearse the opening 90 seconds of their presentation — argument stated, three moves announced — to a partner, who must be able to repeat the argument and name the three moves afterwards without notes.

SPEAKING ACTIVITY: Micro-Q&A rounds — each learner takes three questions from the group, including at least one type-3 and one type-4, and is assessed on whether they STOPPED after answering.

CRITICAL THINKING / DISCUSSION PROMPT: "At a conference, the sharpest challenge often comes from the most senior person in the room. In some academic cultures that is a mark of serious engagement and a compliment; in others, publicly challenging a junior scholar is avoided as discourteous. If you are presenting to an international audience, which convention should govern the room — and who decides?"

LISTENING ACTIVITY (5 min): Listen to two answers to the same hostile question and identify which conceded the valid part and which defended the whole position, then judge which left the speaker in a stronger position.

READING ACTIVITY (5 min): Read four abstracts and judge for each whether the abstract''s claim matches the strength its stated method could support.

WRITING TASK (5 min): Write the sentence in which you state your own study''s principal limitation aloud, before questions — phrased so that stating it strengthens your credibility rather than inviting attack.

PRONUNCIATION PRACTICE (5 min): Delivering "that is outside what my data can support" at unchanged pace and without rising intonation — a rise turns an honest limit into an apology and invites the questioner to press.

VOCABULARY REINFORCEMENT: A conference-vocabulary matching game (abstract, plenary, panel, discussant, poster session, proceedings, call for papers, blind review), distinguishing "discussant" (a respondent formally assigned to critique a paper) from "chair" — a confusion that produces real embarrassment.

FORMATIVE ASSESSMENT: Instructor checks that the argument is stated within 45 seconds, that all three moves are explicitly announced, and that each learner stopped after answering at least two questions.

HOMEWORK: Complete the research paper for Module 8''s assignment.

REVISION: This lesson opens with the Lesson 8.1 argument-and-limitation recap. Module 8''s Quiz and Assignment draw on both lessons.

EXTENSION: Prepare a 30-second version of your argument for the corridor conversation after the session — the format in which most academic collaboration actually begins.'),

('itm_l6_m8_quiz', 'unt_l6_m8', 4, 'quiz', 'Module 8 Quiz — Research & Scholarship', NULL),

('itm_l6_m8_assignment', 'unt_l6_m8', 5, 'assignment', 'Module 8 Assignment — A Research Paper & Conference Presentation',
'INSTRUCTIONS: Complete two parts. PART A (writing, this level''s eighth genre): a research paper, 1,200-1,500 words, using the supplied source material. It must contain a three-move introduction with an explicitly stated gap; a claim in every substantive paragraph placed at a defensible rung of the hedging ladder; at least six citations using BOTH integral and non-integral forms, each chosen deliberately; reporting verbs whose stance matches your intended stance; and a limitations section identifying at least one limitation that genuinely constrains your conclusion. PART B (speaking): a conference presentation, 10-12 minutes, in which the central argument is stated within the first 45 seconds and each of three supporting moves is explicitly announced, followed by 5 minutes of questions including at least one type-2 genuine challenge, one type-3 "have you read X", and one type-4 question that is really the questioner''s own work.

GRADING RUBRIC: (1) Grammatical accuracy — accurate metadiscourse; sustained publication-standard academic register. (2) Vocabulary range — at least 5 distinct research or metadiscourse terms used precisely, plus one phrasal verb/collocation from this module. (3) Task completion — three-move introduction, six citations in both forms and a limitations section in Part A; argument within 45 seconds, three announced moves and all three question types handled in Part B. (4) Independent judgement — is every claim placed at the rung its evidence supports, and is the stated limitation one that genuinely constrains the conclusion rather than a token concession? (5) Rhetorical effectiveness — does the introduction''s stated contribution actually answer the gap it stated, and does the presentation make an audience want to read the paper? (6) Discourse coherence & register — is the integral/non-integral citation choice consistent with what each passage is about, and does the speaker stop after answering?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m8_1', 'itm_l6_m8_quiz', 1, 'On the hedging ladder, which of these makes the STRONGEST claim?', '["is consistent with","demonstrates","may indicate","suggests"]', 1),
('qq_l6_m8_2', 'itm_l6_m8_quiz', 2, 'An unearned booster ("this clearly proves...") is dangerous chiefly because:', '["it is grammatically incorrect","journals ban the word clearly","it lengthens the sentence","it costs the reader trust in every other claim in the paper"]', 3),
('qq_l6_m8_3', 'itm_l6_m8_quiz', 3, '"Ramirez (2019) argues that..." is an example of:', '["non-integral citation","a hedge","integral citation","an engagement marker"]', 2),
('qq_l6_m8_4', 'itm_l6_m8_quiz', 4, 'Non-integral citation is the right choice when:', '["the claim matters more than who made it","the author is famous","you are criticising the source","the source is very recent"]', 0),
('qq_l6_m8_5', 'itm_l6_m8_quiz', 5, 'Which reporting verb signals SCEPTICISM towards the source?', '["argues","demonstrates","notes","claims"]', 3),
('qq_l6_m8_6', 'itm_l6_m8_quiz', 6, 'In a three-move introduction, move two:', '["states the paper''s conclusion","establishes the gap the paper will occupy","thanks the funders","summarises the methods"]', 1),
('qq_l6_m8_7', 'itm_l6_m8_quiz', 7, '"Consider the case of..." and "one might object that..." are examples of:', '["engagement markers","hedges","boosters","attitude markers"]', 0),
('qq_l6_m8_8', 'itm_l6_m8_quiz', 8, 'British "logical quotation" places a full stop OUTSIDE the closing quotation mark when:', '["always, without exception","the quotation is longer than one line","the stop was not part of the original quoted material","the source is American"]', 2),
('qq_l6_m8_9', 'itm_l6_m8_quiz', 9, 'Which phrasal verb means "support a hypothesis with evidence"?', '["rule out","draw on","bear out","follow up"]', 2),
('qq_l6_m8_10', 'itm_l6_m8_quiz', 10, 'A questioner spends ninety seconds describing their own related research. The professional response is to:', '["find the one element that genuinely bears on your work, respond to it, and stop","apologise for not citing them","decline to answer","agree with everything said"]', 0);

-- ---------------------------------------------------------------------
-- Module 9: Ethics & Responsible Leadership
-- Full prose version: docs/curriculum/level-6/module-09-ethics-responsible-leadership.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m9', 'crs_level_6', 9, 'Module 9: Ethics & Responsible Leadership');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m9_overview', 'unt_l6_m9', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Even if that were true, it would not follow that... — Granted that..., the question remains... — However pressing the commercial case, ... — I want to state plainly what this position costs. — Let me summarise where we differ. — I want to bring in someone who has not yet spoken.

DISCOURSE MARKERS THIS MODULE (functional set — honest concession): even if, even though, granted that, admittedly, to be sure... nevertheless, whether or not, much as. The distinction that governs the whole set: EVEN THOUGH CONCEDES A FACT ("even though the policy raised costs" — it did), while EVEN IF CONCEDES A HYPOTHESIS ("even if the policy raised costs" — it may not have). Choosing the wrong one either concedes something untrue or refuses to concede something true, and in an ethical argument both are damaging. This module''s central discipline follows from that grammar: a moral argument that claims nobody is harmed by it is almost always concealing something, and "even if" is the grammar of admitting the cost.

PHRASAL VERBS & COLLOCATIONS: stand by [a decision] (continue to support it under pressure), back down (abandon a position), speak up (raise an objection when silence is easier), turn a blind eye to (deliberately fail to notice), square [X] with [Y] (reconcile two apparently inconsistent things), weigh up (consider comparatively). Collocations: moral hazard, conflict of interest, duty of care, in good faith, the reasonable person, a legitimate expectation.

BrE / AmE NOTE — a false friend with real consequences in this domain. SCHEME is neutral in British English and denotes an organised, usually official, arrangement: a pension scheme, a compliance scheme, a graduate scheme, a government scheme. In American English "scheme" is strongly PEJORATIVE and implies a plot or a swindle. An organisation describing its own "ethics scheme" to an American audience is, to that audience''s ear, confessing. The American equivalents are plan, program, or initiative. Related: British "redundancy" (dismissal for economic reasons — an ordinary, non-shameful term) corresponds to American "layoff".

KEY VOCABULARY PREVIEWED: ethics vocabulary (integrity, accountability, transparency, complicity, culpability, mitigation, proportionality, stewardship, candour), leadership vocabulary (discretion, precedent, exemplarity, institutional memory, tone from the top). Intercultural note: whether an ethical objection is expected to be raised publicly in the meeting, privately afterwards, or through a formal channel varies substantially between organisational and national cultures; the module treats all three as legitimate routes and asks learners to say which they would use and why, rather than asserting one as correct.'),

('itm_l6_m9_lesson1', 'unt_l6_m9', 2, 'reading', 'Lesson 9.1 — Even If, Granted That, However Much: Concessive Structures & the Language of Moral Reasoning',
'LEARNING OBJECTIVES: By the end of this lesson you can (1) use "even if" and "even though" with full accuracy and explain the difference in what each commits you to; (2) construct however-inversion ("however compelling the argument may be") and the whatever/whoever concessive forms; (3) recognise the three principal frames in which moral arguments are made — consequences, duties and character — and name the frame a speaker is arguing from; (4) state what your own position costs, in a form a reader can hold you to.

PREREQUISITE KNOWLEDGE: Level V Module 8 (professional advocacy); Level VI Module 4 (modality of obligation) and Module 5 (locating disagreement at premise, warrant, inference or scope). This lesson supplies the missing piece: what to do when the disagreement is not about any of those, but about which considerations count.

WARM-UP (5 min): Instructor writes two sentences differing by one word — "even though the trial was rushed, the drug works" and "even if the trial was rushed, the drug works" — and asks the group what each speaker has committed themselves to. The answers diverge immediately, which is the point.

PRESENTATION (10 min): Establish the concessive system precisely. EVEN THOUGH + a FACT the speaker accepts. EVEN IF + a HYPOTHESIS the speaker does not necessarily accept, and often specifically does NOT accept — which is why "even if that were true, it would not follow that..." is the most useful single sentence frame in disputed argument: it grants the opponent''s premise without conceding it, then defeats the inference anyway. WHETHER OR NOT covers both branches. Then model HOWEVER-INVERSION: "however compelling the commercial case may be", "however many precedents exist" — however + adjective/adverb (or much/many + noun) + subject + verb, with the concession front-loaded so the main clause lands last. Then move from grammar to reasoning. Introduce the three FRAMES: an argument from CONSEQUENCES ("on balance the harm outweighs the benefit"), an argument from DUTIES ("regardless of outcome, we owe our staff an honest account"), and an argument from CHARACTER ("what kind of institution do we become if we do this?"). Each frame licenses different vocabulary and different evidence, and two people arguing from different frames can exchange perfectly good arguments indefinitely without touching each other. Naming the frame — "I think we are arguing from different starting points; you are arguing from consequences and I am arguing from an obligation" — is the C2 move that converts a stalled disagreement into a productive one.

GUIDED PRACTICE (10 min): Learners complete 8 concessive gaps choosing between "even if", "even though" and "whether or not", justifying each choice by stating what the speaker is committed to. They then classify 6 short arguments by frame, including two that mix frames without acknowledging it.

INDEPENDENT PRACTICE (10 min): Learners take this module''s ethical case, state their position in one sentence, then write the COST PARAGRAPH — a paragraph beginning "I want to state plainly what this position costs", naming who is worse off if they are right, and by how much. A position with no stated cost is returned for redrafting.

SPEAKING ACTIVITY: Learners read only their cost paragraph aloud. The group''s single task is to judge whether the cost named is the real one or a lesser one substituted for it.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it possible to make an ethical decision well while being unable to explain why it was right? If a leader''s judgement is sound but their reasoning is inarticulate, should we trust the judgement — and what does an organisation lose if its decisions cannot be explained?"

LISTENING ACTIVITY (5 min): Listen to two speakers disagreeing about the same case and identify the frame each is arguing from, then identify the moment at which one of them switches frames mid-argument without saying so.

READING ACTIVITY — extended reading & independent judgement (8 min): Read an ethical case commentary (220-260 words). Answer 2 literal questions and 2 independent-judgement questions ("Which frame does the author argue from? Reconstruct the strongest version of the argument from a different frame.").

WRITING TASK (5 min): Rewrite three flat assertions as however-inverted concessions, then judge for each whether the concession strengthens or weakens the sentence''s force.

PRONUNCIATION PRACTICE (5 min): The concessive contour — the fronted concessive clause takes a sustained non-final intonation and a clear pause before the main clause, which takes the nuclear stress. Delivered flat, a concession sounds like agreement and the audience misses that a counter-argument is coming.

VOCABULARY REINFORCEMENT: An ethics-collocation task — learners match moral hazard, conflict of interest, duty of care, in good faith and legitimate expectation to short scenarios, and identify the one scenario that fits two of them.

FORMATIVE ASSESSMENT: Instructor checks that "even if" and "even though" are used correctly, that each learner has named the frame they are arguing from, and that every position carries a stated cost.

HOMEWORK: Prepare your opening two-minute contribution for the deliberation in Lesson 9.2, and separately prepare a one-sentence FAIR SUMMARY of the position you most disagree with.

REVISION: Lesson 9.2 opens with learners exchanging those summaries with someone who HOLDS the opposing position, who says whether they accept it.

EXTENSION: Rewrite your argument entirely within a frame you do not personally find persuasive, and report which parts survived the translation and which did not.'),

('itm_l6_m9_lesson2', 'unt_l6_m9', 3, 'reading', 'Lesson 9.2 — The Chair Holds the Room: Chaired Ethical Deliberation & the Conference Paper',
'LEARNING OBJECTIVES: By the end of this lesson you can (1) chair a deliberation — opening the frame, keeping time, bringing in silent participants, and interrupting a dominant speaker without discourtesy; (2) summarise a position you oppose in terms its holder accepts; (3) distinguish deliberation from debate and adopt the success criteria of each; (4) write a conference paper that takes a position in a live scholarly debate.

PREREQUISITE KNOWLEDGE: Lesson 9.1; Level VI Module 4 (the policy panel) and Module 5 (steelman-before-critique). The panel taught representing a constituency; this lesson teaches HOLDING THE ROOM — a role with authority but no vote.

WARM-UP (5 min): Instructor reads 60 seconds of a discussion in which one speaker has taken the floor and will not release it, and asks the group to draft the single sentence a chair should say next.

PRESENTATION (10 min): Distinguish the two formats first. DEBATE seeks to win; success is measured by whether your position prevailed. DELIBERATION seeks a decision the group can own; success is measured by whether everyone can state the decision, the reasons for it, and the strongest objection to it — INCLUDING those who lost the argument. Applying debate''s success criteria to a deliberation is the commonest reason organisational discussions leave resentment behind. Then model the CHAIR''S LANGUAGE SET: opening the frame ("we are deciding X, not Y; we have thirty minutes; I want to hear the objection before we hear the plan"); interrupting without discourtesy ("let me hold you there — I want to test that against what we heard earlier"); bringing in ("I want to bring in someone who has not yet spoken"); fair summary ("if I can summarise where we differ: you are arguing that..., and you are arguing that...; the disagreement is about X, not about Y"). Name the hardest of these explicitly: SUMMARISING A POSITION YOU OPPOSE IN TERMS ITS HOLDER WOULD ACCEPT. A chair who cannot do this loses the room''s trust permanently, and no later fairness recovers it. Finally, model the CONFERENCE PAPER as a written genre distinct from Module 8''s research paper: shorter, argument-led rather than method-led, positioned within a live scholarly debate, and written to be DELIVERED — which means it must survive being heard once, without re-reading.

GUIDED PRACTICE (10 min): Learners are given 6 deliberation moments (a dominant speaker; a silent participant; a factual dispute derailing a values dispute; two people agreeing while believing they disagree; an ad hominem; time running out with no decision) and draft the chair''s next sentence for each.

INDEPENDENT PRACTICE (10 min): Learners write the opening paragraph of their conference paper, which must name the debate it is entering, state the position it takes, and indicate what would have to be true for that position to be wrong.

SPEAKING ACTIVITY — the chaired ethical deliberation: In groups of five, learners deliberate the supplied case for 15 minutes with a rotating chair. Each participant must use at least one concessive structure from Lesson 9.1 and state one cost of their own position. The chair is assessed on the fair summary and on bringing in the quietest participant, NOT on whether a decision was reached.

CRITICAL THINKING / DISCUSSION PROMPT: "A chair is supposed to be neutral. But choosing who speaks, when to close a line of discussion, and how to summarise the disagreement are all substantive choices. Is a genuinely neutral chair possible — and if not, what should a chair disclose?"

LISTENING ACTIVITY (5 min): Listen to two chair summaries of the same disagreement and judge which one the losing side would accept as fair, and what specifically made the difference.

READING ACTIVITY (5 min): Read two conference-paper openings and identify which one states what would falsify its own position.

WRITING TASK (5 min): Write the fair summary you would give as chair of the disagreement your own group just had — including the side you argued against.

PRONUNCIATION PRACTICE (5 min): The chair''s interruption — a lowered pitch and slightly increased volume on the first two words, then an immediate return to normal delivery. Raised pitch reads as alarm; sustained volume reads as domination; the drop-then-return contour reads as authority.

VOCABULARY REINFORCEMENT: A leadership-vocabulary sorting task (discretion, precedent, exemplarity, stewardship, candour, tone from the top), each matched to the situation in which it is the operative consideration.

FORMATIVE ASSESSMENT: Instructor checks that each chair produced a fair summary accepted by both sides, and that every participant stated a cost of their own position.

HOMEWORK: Complete the conference paper for Module 9''s assignment.

REVISION: This lesson opens with the exchanged fair summaries from Lesson 9.1. Module 9''s Quiz and Assignment draw on both lessons.

EXTENSION: Write the minute of the deliberation — the record a reader who was not present would rely on — then ask a participant whether they recognise their own position in it.'),

('itm_l6_m9_quiz', 'unt_l6_m9', 4, 'quiz', 'Module 9 Quiz — Ethics & Responsible Leadership', NULL),

('itm_l6_m9_assignment', 'unt_l6_m9', 5, 'assignment', 'Module 9 Assignment — A Conference Paper & a Chaired Ethical Deliberation',
'INSTRUCTIONS: Complete two parts. PART A (writing, this level''s ninth genre): a conference paper, 900-1,100 words, entering a live debate on the supplied ethical case. It must name the debate it is entering; state its position; state explicitly what would have to be true for that position to be wrong; use at least three concessive or concessive-conditional structures from this module, with "even if" and "even though" each used at least once and each used correctly; name the frame it argues from; and include a paragraph stating plainly what the position costs and to whom. It must be written to be HEARD ONCE. PART B (speaking): a chaired ethical deliberation, 15-18 minutes, in which you serve BOTH as a participant and, for part of the session, as chair. As participant you must state one cost of your own position and use at least one concessive structure. As chair you must bring in the quietest participant, interrupt a dominant speaker without discourtesy, and deliver a summary of the disagreement that the side you personally oppose accepts as fair.

GRADING RUBRIC: (1) Grammatical accuracy — concessive and concessive-conditional structures accurately formed, with the even if/even though distinction observed; however-inversion correctly constructed. (2) Vocabulary range — at least 5 distinct ethics or leadership terms used precisely, plus one phrasal verb/collocation from this module. (3) Task completion — debate named, position stated, falsification condition given, frame named and cost paragraph present in Part A; participation, chairing, bringing-in, interruption and fair summary all performed in Part B. (4) Independent judgement — is the cost named the real one, and is the falsification condition one that could genuinely occur? (5) Rhetorical effectiveness — does the paper survive being heard once, and does the fair summary earn the opposing side''s assent? (6) Discourse coherence & register — is the frame maintained consistently, or does the argument switch frames without acknowledging it, and is the chair''s register distinguishable from the participant''s?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m9_1', 'itm_l6_m9_quiz', 1, '"Even though the trial was rushed, the drug works." The speaker is committed to the view that:', '["the trial WAS rushed","the trial may not have been rushed","the drug does not work","nothing about the trial"]', 0),
('qq_l6_m9_2', 'itm_l6_m9_quiz', 2, '"Even if that were true, it would not follow that..." is useful because it:', '["concedes the opponent''s conclusion","avoids the argument","grants the premise without accepting it, then defeats the inference","changes the subject"]', 2),
('qq_l6_m9_3', 'itm_l6_m9_quiz', 3, 'Which is correctly formed?', '["However the argument is compelling","However compelling the argument may be","However compelling may be the argument","However is compelling the argument"]', 1),
('qq_l6_m9_4', 'itm_l6_m9_quiz', 4, '"Regardless of outcome, we owe our staff an honest account" is an argument from:', '["consequences","character","precedent","duties"]', 3),
('qq_l6_m9_5', 'itm_l6_m9_quiz', 5, 'Naming the frame an opponent is arguing from is valuable chiefly because:', '["it wins the argument","it is polite","it converts a stalled disagreement into a productive one","it ends the discussion"]', 2),
('qq_l6_m9_6', 'itm_l6_m9_quiz', 6, 'In British English, "a compliance scheme" means:', '["an organised official arrangement for compliance","a plot to evade compliance","a legal penalty","an audit failure"]', 0),
('qq_l6_m9_7', 'itm_l6_m9_quiz', 7, 'Which phrasal verb means "deliberately fail to notice"?', '["weigh up","stand by","speak up","turn a blind eye to"]', 3),
('qq_l6_m9_8', 'itm_l6_m9_quiz', 8, 'Deliberation differs from debate in that its success is measured by:', '["whose position prevailed","whether everyone can state the decision, its reasons and the strongest objection to it","how long it lasted","whether a vote was unanimous"]', 1),
('qq_l6_m9_9', 'itm_l6_m9_quiz', 9, 'The hardest chairing skill named in this module is:', '["keeping to time","summarising a position you oppose in terms its holder would accept","opening the meeting","taking the minute"]', 1),
('qq_l6_m9_10', 'itm_l6_m9_quiz', 10, 'A position stated with no acknowledged cost is treated in this module as:', '["especially strong","correctly hedged","an argument from character","probably concealing something"]', 3);

-- ---------------------------------------------------------------------
-- Module 10: Capstone -- Global Challenges & Sustainable Development,
-- and the Mastery Examination. The final module of the final level.
-- Uses the Module 10 pattern from every level: 4 learning items
-- (revision guide, revision lesson, 20-question exam, comprehensive
-- rubric-graded assessment) rather than 5.
-- Full prose version: docs/curriculum/level-6/module-10-capstone-mastery-examination.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l6_m10', 'crs_level_6', 10, 'Module 10: Capstone — Global Challenges & Mastery Examination');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l6_m10_revguide', 'unt_l6_m10', 1, 'reading', 'Level VI Revision Guide',
'Level VI is organised by PROFESSIONAL DOMAIN, not by communication mode, because at mastery level the domain IS the difficulty: register is only demonstrable inside a real field. This guide is organised the same way.

THE TEN DOMAINS, THEIR PRECISION FOCUS, AND THEIR OUTPUTS.
M1 executive leadership — subjunctive, high-formal register — reflective leadership essay; executive briefing.
M2 diplomacy & international relations — impersonal constructions, litotes, diplomatic hedging — strategic recommendations; diplomatic negotiation.
M3 global business strategy — complement fronting with inversion — executive report; boardroom presentation.
M4 public policy — modality of obligation (shall/must/is to/may/should) — policy analysis; policy panel.
M5 law & justice — conditional and exception operators, defined terms — scholarly critique; oral defence.
M6 innovation & emerging technologies — inverted conditionals — grant proposal; keynote address.
M7 media & public communication — tricolon, anaphora, antithesis, crisis register — opinion editorial; media interview and crisis statement.
M8 research & scholarship — metadiscourse, the hedging ladder, citation stance — research paper; conference presentation.
M9 ethics & responsible leadership — concessive and concessive-conditional structures — conference paper; chaired ethical deliberation.
M10 global challenges & sustainable development — integration, self-editing — professional portfolio; capstone presentation and oral defence.

THE INTELLECTUAL THREAD RUNNING THROUGH ALL NINE. Each module introduced one discipline that is not a matter of language at all, but which cannot be executed without the language. M1: taking responsibility in the first person, without qualification. M2: separating a POSITION from the INTEREST underneath it. M3: keeping evidence, inference and recommendation in three distinguishable layers, and stating the working assumption in falsifiable terms. M4: declaring the criteria before declaring the conclusion, so a reader can disagree with the criteria rather than merely with you. M5: steelmanning before critiquing, and locating a disagreement precisely at premise, warrant, inference or scope. M6: asking "what would have to be true?", which converts optimism into a testable proposition. M7: distinguishing correcting a premise from evading a question, and saying what you do not yet know. M8: calibrating every claim to the rung of the hedging ladder its evidence actually supports. M9: naming the frame you are arguing from, and stating plainly what your position costs. Module 10 asks for all nine at once, on one problem, sustained across a portfolio.

THE SIX-LEVEL ARC. Level I (A1) built the capacity to survive in English: present simple, immediate needs, concrete vocabulary. Level II (A2) added the past and the future and the first sustained turns of conversation, and introduced COMMUNICATIVE QUALITY as an assessed criterion. Level III (B1) made the learner an independent user — extended discourse, opinions defended, and the arrival of DISCOURSE COHERENCE AND REGISTER as a criterion. Level IV (B2) moved from communication to argument: analytical reading, evidence-based discussion, academic writing, and the criterion of EVIDENCE AND ARGUMENT QUALITY. Level V (C1) moved from argument to INTELLECTUAL communication — synthesis, research, executive and leadership registers, and the criterion of RHETORICAL EFFECTIVENESS. Level VI (C2) adds the last criterion and the one that distinguishes mastery from proficiency: INDEPENDENT JUDGEMENT — not whether the learner can execute a genre correctly, but whether the choices made inside it are ones the learner has actually reasoned to and can defend under challenge.

GRAMMAR CONSOLIDATED ACROSS LEVEL VI: subjunctive in mandative clauses (M1); impersonal and passive-agentive constructions and litotes (M2); fronting with subject-verb inversion (M3); the operative modality of obligation (M4); provided that / save where / subject to / notwithstanding / unless, including the fact that "subject to" and "notwithstanding" are OPPOSITES IN EFFECT (M5); inverted conditionals with "if" omitted (M6); the rhetorical triad (M7); hedges, boosters, attitude and engagement markers (M8); even if vs even though, whether or not, and however-inversion (M9).

BrE / AmE DIVERGENCES TAUGHT IN LEVEL VI: "table" a motion — a COMPLETE REVERSAL (BrE bring forward for discussion; AmE postpone) (M2); "turnover" — BrE revenue, AmE staff attrition (M3); collective nouns taking plural agreement in BrE, "the Government are" (M4); barrister/solicitor vs attorney, claimant vs plaintiff (M5); aluminium/aluminum and bid/tender vs proposal/solicitation (M6); Fleet Street, presenter/host, front-foot, stand up (M7); quotation punctuation — logical (BrE) vs inside-the-quotes (AmE), and the fact that -ise/-ize is NOT a BrE/AmE divide (M8); "scheme" — neutral in BrE, pejorative in AmE (M9). A mastery-level writer chooses one variety and holds it consistently, and knows which of these differences change MEANING rather than merely spelling.'),

('itm_l6_m10_revlesson', 'unt_l6_m10', 2, 'reading', 'Revision Lesson — Integration & Self-Editing to Publication Standard',
'LEARNING OBJECTIVES: By the end of this lesson you can (1) apply a four-pass self-editing protocol rather than editing by instinct; (2) identify the characteristic failure of each Level VI genre in your own work; (3) assemble a portfolio whose pieces demonstrate range rather than repetition; (4) prepare for an oral defence of your own written work.

PREREQUISITE KNOWLEDGE: All of Modules 1-9.

WARM-UP (5 min): Learners take the weakest paragraph from any piece they have written this level and, in silence, mark the single sentence they would defend last. That sentence is usually the one to cut.

PRESENTATION (12 min): Introduce the FOUR-PASS SELF-EDITING PROTOCOL, to be run in this order and never simultaneously, because each pass looks for something the others cannot see. (1) THE CLAIM PASS — read only for calibration. For every claim, ask what rung of the hedging ladder it sits on and what rung the evidence supports. Fix every mismatch in both directions, over-claiming AND over-hedging. (2) THE ROUTE PASS — read as a reader who has never seen the document, and mark every point at which you had to look backwards to understand a sentence. Each mark is a structural fault, not a sentence fault, and is almost always fixed by moving something earlier rather than by rewriting the sentence. (3) THE VOICE PASS — read aloud. Anything you cannot say in one breath is too long; anything that sounds like someone else is borrowed; anything that sounds like nobody is nominalised to death. (4) THE CUT PASS — remove ten per cent. Not five, not "where possible" — ten. The constraint is the instrument: at ten per cent you begin cutting sentences you liked, which is where the genuine redundancies live.

Then name the CHARACTERISTIC FAILURE OF EACH GENRE so learners can audit their own portfolio against it: the reflective essay that performs humility rather than exercising it (M1); the strategic recommendation too diplomatic to say what it recommends (M2); the executive report whose inference layer has quietly merged with its evidence layer (M3); the policy analysis whose criteria were reverse-engineered from a conclusion already reached (M4); the scholarly critique that attacks the weakest version of its target (M5); the grant proposal that conceals rather than discloses its risks (M6); the editorial that mistakes rhetorical devices for argument (M7); the research paper whose claim outruns its evidence (M8); and the ethical position that names no cost (M9).

GUIDED PRACTICE (12 min): Learners run the CLAIM PASS on a provided 300-word extract, compare marks in pairs, and account for every disagreement.

INDEPENDENT PRACTICE (15 min): Learners run all four passes on one of their own Level VI pieces and record what each pass caught. If a pass caught nothing, they re-run it — a pass that catches nothing almost always means it was not run separately.

SPEAKING ACTIVITY — defence rehearsal: In threes, one learner presents their capstone argument for three minutes; the other two ask the two questions they most expect an examiner to ask; the presenter answers, then says which question they answered WORST and why.

CRITICAL THINKING / DISCUSSION PROMPT: "Across six levels, this programme has asked you to concede counter-arguments, state costs, disclose limitations, and admit what you do not know. Every one of those makes an argument harder to win in the short term. Has the programme taught you something true about communication — or something that only works in institutions that already reward candour? Answer honestly; the answer is part of your reflective analysis."

LISTENING ACTIVITY (8 min): Listen to two capstone presentations and identify, for each, the single question that would most damage it — then judge which presenter had already anticipated that question.

READING ACTIVITY (8 min): Read two portfolio contents pages and judge which demonstrates genuine RANGE across genre and register and which repeats one register under nine different titles.

WRITING TASK (8 min): Draft the opening paragraph of the six-level reflective analysis, naming one specific thing you could not do at the start of Level I, one you could not do at the start of Level V, and one you still cannot do.

PRONUNCIATION PRACTICE (6 min): Sustained intelligibility under pressure across a long turn — maintaining sentence stress, tonic placement and pace through a five-minute answer without the compression and rising terminals that fatigue produces. Recorded and self-assessed against your own Module 1 diagnostic recording: the direct measurement of a level''s worth of progress.

VOCABULARY REINFORCEMENT: Produce a personal glossary of 30 terms from across Level VI''s nine domains, marked for the register in which each is appropriate, and identify the five you still use imprecisely.

FORMATIVE ASSESSMENT: Instructor confirms that all four editing passes were run separately, that the portfolio''s pieces span at least five distinct genres, and that the reflective draft names a genuine remaining limitation rather than a decorative one.

HOMEWORK: Complete the portfolio and the capstone presentation.

REVISION: The Mastery Examination draws on Modules 1-9 in full.

EXTENSION: Write the 200-word abstract of your capstone as it would appear in a conference programme, then the one-sentence version you would use in conversation — the compression test that reveals whether the argument was ever really one argument.'),

('itm_l6_m10_examquiz', 'unt_l6_m10', 3, 'quiz', 'Mastery Examination — Grammar, Vocabulary & Judgement', NULL),

('itm_l6_m10_examassignment', 'unt_l6_m10', 4, 'assignment', 'Mastery Examination — The Capstone',
'INSTRUCTIONS: This is the final assessment of the WEC-LC programme. It has four parts, all on a single global challenge chosen by you from the domain of GLOBAL CHALLENGES AND SUSTAINABLE DEVELOPMENT — a challenge with genuine trade-offs, on which informed people disagree.

PART A — THE PROFESSIONAL PORTFOLIO. Five pieces on the chosen challenge, in five DIFFERENT genres drawn from Level VI''s nine, totalling 3,000-3,500 words, with a contents page stating for each piece its genre, its intended reader and its register. The portfolio must demonstrate range: five pieces that read alike fail this part regardless of individual quality.

PART B — THE CAPSTONE PRESENTATION. 15 minutes to a mixed audience of specialists and non-specialists, carrying one controlling idea, stating its own principal limitation before questions, and naming explicitly what would have to be true for its recommendation to be wrong.

PART C — THE ORAL DEFENCE. 15 minutes of questioning by examiners who have read the portfolio. It will include at least one challenge to a PREMISE rather than to a conclusion; at least one question you cannot answer from your evidence, where "that is outside what my evidence supports" is the correct and expected answer; and at least one invitation to abandon a position, which you must either defend on stated grounds or concede on stated grounds — silence and capitulation both fail.

PART D — THE SIX-LEVEL REFLECTIVE ANALYSIS. 700-900 words accounting for your development across the whole programme. It must name at least one specific capability acquired at each of Levels III, IV, V and VI; revisit the personal focus plan written in the MODULE 1 MASTERY DIAGNOSTIC and state honestly which of its aims were met and which were not; and identify at least one genuine remaining limitation, stated specifically enough that a reader could design the next piece of work to address it.

GRADING RUBRIC: (1) Grammatical accuracy — accuracy sustained across five genres and three spoken formats, with each genre''s characteristic structures correctly deployed; errors, where they occur, do not impede meaning at any point. (2) Vocabulary range — precise domain vocabulary across at least four of Level VI''s nine domains, with register consistently matched to reader; one variety of English chosen and held. (3) Task completion — five distinct genres with contents page in Part A; controlling idea, stated limitation and falsification condition in Part B; premise challenge, honest non-answer, and reasoned defence or concession in Part C; per-level capabilities, Module 1 diagnostic revisited, and a specific remaining limitation in Part D. (4) Evidence & argument quality — is every claim across the portfolio placed at a strength its evidence supports, and does the capstone position rest on evidence the learner can produce under defence? (5) Independent judgement — the criterion that distinguishes mastery from proficiency: are the choices made inside each genre ones you have reasoned to and can defend under challenge, and is your position on the chosen challenge one you hold rather than one you have assembled? (6) Rhetorical effectiveness — does each portfolio piece work on the reader it names, and does the presentation land its controlling idea with a mixed audience? (7) Discourse coherence & register — do five pieces on one challenge read as five genuinely different genres addressed to five different readers, rather than one register retitled?

A grade at or above the platform''s pass threshold marks Module 10, Level VI, and the WEC-LC programme complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l6_m10_1', 'itm_l6_m10_examquiz', 1, '(M1) "The board recommends that the chief executive ___ the findings before publication."', '["review","reviews","will review","reviewed"]', 0),
('qq_l6_m10_2', 'itm_l6_m10_examquiz', 2, '(M1) An executive briefing that takes responsibility uses:', '["the process failed","mistakes were made","I took the decision, and it was wrong","circumstances intervened"]', 2),
('qq_l6_m10_3', 'itm_l6_m10_examquiz', 3, '(M2) "That would not be unhelpful" sits on the litotes scale:', '["below not helpful","between not helpful and helpful","above helpful","identical to unhelpful"]', 1),
('qq_l6_m10_4', 'itm_l6_m10_examquiz', 4, '(M2) A negotiator''s INTEREST, as distinct from their POSITION, is:', '["what they are asking for","their opening offer","their walk-away point","what they need the outcome to achieve"]', 3),
('qq_l6_m10_5', 'itm_l6_m10_examquiz', 5, '(M3) "Central to this strategy ___ the assumption that demand recovers by 2028."', '["are","it is","is","being"]', 2),
('qq_l6_m10_6', 'itm_l6_m10_examquiz', 6, '(M3) In British business usage, "turnover" most commonly means:', '["revenue","staff attrition","profit margin","inventory rotation"]', 0),
('qq_l6_m10_7', 'itm_l6_m10_examquiz', 7, '(M4) Which modal confers DISCRETION rather than obligation in policy drafting?', '["shall","must","is to","may"]', 3),
('qq_l6_m10_8', 'itm_l6_m10_examquiz', 8, '(M4) A criterion-based option appraisal requires that:', '["only the preferred option is assessed","every option is assessed against every declared criterion, including the disfavoured option","criteria are chosen after the conclusion","trade-offs are omitted"]', 1),
('qq_l6_m10_9', 'itm_l6_m10_examquiz', 9, '(M5) "___ any provision to the contrary, this section applies." (the operator that OVERRIDES)', '["Subject to","Notwithstanding","Provided that","Save where"]', 1),
('qq_l6_m10_10', 'itm_l6_m10_examquiz', 10, '(M5) To STEELMAN an argument before critiquing it means to:', '["restate it in its weakest form","ignore it","attribute it to an authority","restate it in its strongest defensible form"]', 3),
('qq_l6_m10_11', 'itm_l6_m10_examquiz', 11, '(M6) "___ the trial to confirm these results, deployment could begin next year." (inverted conditional)', '["Should","If","Unless","Provided"]', 0),
('qq_l6_m10_12', 'itm_l6_m10_examquiz', 12, '(M6) Asking "what would have to be true for this to work?" principally serves to:', '["generate optimism","avoid commitment","convert a vague claim into a testable proposition","shorten the proposal"]', 2),
('qq_l6_m10_13', 'itm_l6_m10_examquiz', 13, '(M7) "It is a question of cost, of fairness, and of whether we are willing to be judged by what we do." This is:', '["anaphora","antithesis","litotes","tricolon"]', 3),
('qq_l6_m10_14', 'itm_l6_m10_examquiz', 14, '(M7) The element most organisations omit from a crisis holding statement — and the one that most builds credibility — is:', '["what we know","what we do not yet know","what we are doing","the next update time"]', 1),
('qq_l6_m10_15', 'itm_l6_m10_examquiz', 15, '(M8) On the hedging ladder, which claim is WEAKEST?', '["demonstrates","indicates","may indicate","suggests"]', 2),
('qq_l6_m10_16', 'itm_l6_m10_examquiz', 16, '(M8) "It has been argued that... (Ramirez, 2019)" is NON-INTEGRAL citation, appropriate when:', '["the claim matters more than who made it","the author is the subject of discussion","the source is being criticised","the source is unpublished"]', 0),
('qq_l6_m10_17', 'itm_l6_m10_examquiz', 17, '(M9) "___ the commercial case may be, the obligation stands."', '["However compelling","However the compelling","How compelling","Whatever compelling"]', 0),
('qq_l6_m10_18', 'itm_l6_m10_examquiz', 18, '(M9) "Even if the data were accurate, the conclusion would not follow." The speaker:', '["accepts that the data are accurate","rejects the conclusion''s premise","does not commit to the data being accurate","concedes the conclusion"]', 2),
('qq_l6_m10_19', 'itm_l6_m10_examquiz', 19, '(M2/M9) Which pair of terms is NEUTRAL in British English but misleading or pejorative to an American reader?', '["lift / elevator","table [a motion] and scheme","autumn / fall","queue / line"]', 1),
('qq_l6_m10_20', 'itm_l6_m10_examquiz', 20, '(M8/M4) A writer states criteria only after reaching a conclusion, and reports a finding as "demonstrates" where the method supports "is consistent with". These are, respectively:', '["two stylistic preferences","correct practice in both cases","hedging and boosting","reverse-engineered criteria and an over-claim"]', 3);
