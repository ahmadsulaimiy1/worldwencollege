-- 022 · The academic frameworks could not speak to an Arabic reader
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_competencies_sequence'
--
-- The probe reads sqlite_master rather than any column this file adds,
-- for the reason 020 gives at length: a probe that selects from its own
-- new object throws on every database the probe exists to ask about.
-- The index below is the LAST object this file creates.
--
-- ============================================================
-- WHY THIS MIGRATION EXISTS
-- ============================================================
--
-- Every English page of this site has an Arabic edition, and the two
-- ship together. That has been true of the pages for a long time. It
-- was not true of the DATABASE, and the place it showed was the one
-- page a stranger reads to decide whether to believe a graduate.
--
-- /ar/graduate.html served an Arabic masthead and then filled the
-- record beneath it out of these three tables — in English. An Arabic
-- employer reading an Arabic credential was told the graduate's skills
-- were "Listening", "Reading", "Speaking" and "Writing", and their
-- competencies "Clarity", "Command", "Judgement". Found by rendering
-- the page, not by reading it.
--
-- ============================================================
-- WHERE THE ARABIC COMES FROM
-- ============================================================
--
-- NOT from this file's author. Every string below is already published
-- by the College, and this migration ADOPTS it rather than composing a
-- second version of it:
--
--   · the four skills and their glosses — /ar/students/assessment/
--   · the six competencies and their glosses — /ar/about/
--
-- `tests/framework-arabic.test.mjs` reads those two pages and fails the
-- build if the database and the published pages ever disagree. That
-- guard is the whole reason it is safe to hold a published fact in two
-- places, and it is the same arrangement `tests/level-names.test.mjs`
-- keeps over the six programme levels.
--
-- The five SKILL DESCRIPTORS are the exception, and deliberately so:
-- they are published nowhere, because the Academic Senate has not set
-- the thresholds that would let one be reported. Their Arabic is
-- written here from the College's own English gloss, and no page
-- asserts it yet. When the Senate approves the thresholds and the
-- descriptors reach a page, that page and this table come under the
-- same guard as the rest.
--
-- Columns are NULLABLE and the English is never touched. A payload
-- hands both names back and the page chooses; where the Arabic is
-- absent the English stands, which is legible, rather than a blank,
-- which is not.

ALTER TABLE language_skills ADD COLUMN name_ar TEXT;
ALTER TABLE language_skills ADD COLUMN description_ar TEXT;

UPDATE language_skills SET
  name_ar = 'الاستماع',
  description_ar = 'فهم الكلام بسرعته الطبيعية، بما في ذلك اللهجات غير المألوفة والظروف غير المثالية'
  WHERE id = 'skl_listening';
UPDATE language_skills SET
  name_ar = 'القراءة',
  description_ar = 'القراءة للحجّة وللتفصيل، لا للفكرة العامة فقط، عبر مستويات لغوية مختلفة'
  WHERE id = 'skl_reading';
UPDATE language_skills SET
  name_ar = 'التحدّث',
  description_ar = 'التحدّث بضبط للقواعد والنطق ومستوى اللغة، في الزمن الحقيقي'
  WHERE id = 'skl_speaking';
UPDATE language_skills SET
  name_ar = 'الكتابة',
  description_ar = 'الكتابة لغرض ولقارئ، ثم المراجعة'
  WHERE id = 'skl_writing';

ALTER TABLE skill_descriptors ADD COLUMN name_ar TEXT;
ALTER TABLE skill_descriptors ADD COLUMN description_ar TEXT;

UPDATE skill_descriptors SET
  name_ar = 'ناشئ',
  description_ar = 'يبدأ العمل بالمهارة، بمساندة وفي ظروف مألوفة.'
  WHERE id = 'skd_emerging';
UPDATE skill_descriptors SET
  name_ar = 'نامٍ',
  description_ar = 'يعمل مستقلًّا في الظروف المألوفة، ويجد المشقّة في غيرها.'
  WHERE id = 'skd_developing';
UPDATE skill_descriptors SET
  name_ar = 'متمكّن',
  description_ar = 'يعمل باطّراد عبر المدى الذي يصفه المستوى.'
  WHERE id = 'skd_proficient';
UPDATE skill_descriptors SET
  name_ar = 'متقدّم',
  description_ar = 'يعمل بضبطٍ ومدًى يجاوزان ما يطلبه المستوى.'
  WHERE id = 'skd_advanced';
UPDATE skill_descriptors SET
  name_ar = 'متميّز',
  description_ar = 'يعمل على مستوًى يُعترف به خارج الكلية.'
  WHERE id = 'skd_distinguished';

ALTER TABLE competencies ADD COLUMN name_ar TEXT;
ALTER TABLE competencies ADD COLUMN description_ar TEXT;

UPDATE competencies SET
  name_ar = 'الوضوح',
  description_ar = 'يُفهَم من أول مرة، من الجمهور الحاضر فعلًا'
  WHERE id = 'cmp_clarity';
UPDATE competencies SET
  name_ar = 'التمكّن',
  description_ar = 'يتحكم في اللغة بدل أن تحمله هي'
  WHERE id = 'cmp_command';
UPDATE competencies SET
  name_ar = 'الحصافة',
  description_ar = 'يختار السجل والقناة واللحظة، ويعرف ما لا يُقال'
  WHERE id = 'cmp_judgement';
UPDATE competencies SET
  name_ar = 'الاستدلال',
  description_ar = 'يبني حجة، ويختبرها، ويسلّم بما ينبغي التسليم به'
  WHERE id = 'cmp_reason';
UPDATE competencies SET
  name_ar = 'الحضور',
  description_ar = 'يمسك قاعةً، أو مكالمةً، أو محادثةً صعبة'
  WHERE id = 'cmp_bearing';
UPDATE competencies SET
  name_ar = 'البلوغ',
  description_ar = 'يتواصل عبر الثقافات، وعبر المسافة بين المختص وغير المختص'
  WHERE id = 'cmp_reach';

-- The last object this file creates, and the probe above.
CREATE INDEX IF NOT EXISTS idx_competencies_sequence ON competencies(sequence);
