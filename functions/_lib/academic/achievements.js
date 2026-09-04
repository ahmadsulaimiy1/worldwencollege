/* ACHIEVEMENTS, BUILT AS AN ACADEMIC RECORD RATHER THAN AS A GAME.
 *
 * ────────────────────────────────────────────────────────────────
 * WHAT FAULT THIS FILE CORRECTS
 * ────────────────────────────────────────────────────────────────
 * The Board asked for "badges or milestones where appropriate", and the
 * qualifier is the instruction. Unqualified, the request has one obvious
 * implementation and it is the wrong one for this College: a streak, a
 * login badge, a ring that fills for minutes spent on a page. Every one
 * of those honours activity, and the first time a learner asks what a
 * badge certifies, an institution that honours activity has no answer
 * that survives being written down.
 *
 * sql/schema.sql closed that door before this file existed and it is
 * worth restating which door it closed, because it is not the obvious
 * one. It did not ban gamification by policy. It made it unwritable:
 * `milestone_definitions.evidence_source` is a CLOSED LIST OF EIGHT
 * TABLES, all of which hold assessed or attested academic evidence, and
 * no table recording a login, a visit or a session appears in it. A
 * streak milestone has nothing to read. So the constraint this file
 * works under is structural, and the work here is to honour facts the
 * College already assessed rather than to invent new things to count.
 *
 * The register itself — which fifteen facts, and the exact condition
 * behind each — is data/milestones.json, with the three that were wanted
 * and could not be checked recorded there as `not_defined` rather than
 * written badly.
 *
 * ────────────────────────────────────────────────────────────────
 * A PROPOSED DEFINITION AWARDS NOTHING, AND THAT IS THE MAIN RULE
 * ────────────────────────────────────────────────────────────────
 * `milestone_definitions` carries a CHECK that an approved definition
 * names its approver and the date they approved it. That constraint is
 * the whole governance of this feature: what a College honours is the
 * College's decision, taken by a person on a date, and not a decision an
 * engineer takes by adding an object to a JSON file.
 *
 * So awardMilestones() reads `status = 'approved'` and nothing else. The
 * register ships every definition as `proposed`, seedMilestoneDefinitions()
 * installs them that way, and a learner is told plainly that a proposed
 * definition is not in force — never shown a greyed-out prize with a
 * padlock on it, which is the same claim made dishonestly.
 *
 * ────────────────────────────────────────────────────────────────
 * AWARDED ON READ, WHICH recordStandingReview() IS NOT
 * ────────────────────────────────────────────────────────────────
 * functions/_lib/academic/standing.js refuses to freeze a standing on a
 * page load: "a review point is an act of the College, not a page load",
 * and a learner refreshing their record must not mint one. The opposite
 * is true here and the difference is real rather than convenient.
 *
 * A standing is a JUDGEMENT the College makes on a stated occasion from
 * figures frozen at that moment. A milestone is a READING of evidence
 * somebody else already judged — a mark a person gave, an award the
 * register conferred, a moderator's confirmation. Nothing is decided at
 * the moment of awarding; the deciding was the marking. So the sweep is
 * idempotent, it runs on read, and a learner sees the milestone the hour
 * they earn it instead of whenever a cron next fires.
 *
 * `earned_on` follows from the same reasoning and is the detail most
 * easily got wrong: it is the day the EVIDENCE is dated, never the day
 * the sweep ran. A sweep that runs a fortnight late must still record
 * the day the work was marked, or the register dates the College's
 * diligence rather than the learner's achievement.
 *
 * ────────────────────────────────────────────────────────────────
 * IT AWARDS AND IT NEVER WITHDRAWS
 * ────────────────────────────────────────────────────────────────
 * Evidence moves. An award can be revoked or replaced; a mark can be
 * amended. A sweep that noticed and quietly deleted the milestone would
 * be the software revising the College's own record with no reason
 * attached — and `learner_milestones` requires `revoked_reason` beside
 * `revoked_at` precisely because only a person can supply one.
 *
 * So: this file INSERTs and does nothing else. A milestone whose
 * evidence no longer holds is reported with that fact visible
 * (`evidenceStillStands: false`) and left standing, for a person to
 * revoke with a reason if the College decides to. And a revoked
 * milestone is never re-awarded, including from different evidence,
 * because re-awarding around a revocation is the sweep overruling the
 * person who made it.
 *
 * ────────────────────────────────────────────────────────────────
 * REPEATABLE, AND WHY NOTHING IN THE SHIPPED REGISTER IS
 * ────────────────────────────────────────────────────────────────
 * `UNIQUE(user_id, definition_id, evidence_id)` is the integrity rule
 * for a repeatable milestone: a second capstone is a second fact, a
 * re-run of the sweep over the first one is not. It cannot be the rule
 * for a NON-repeatable one — the same learner satisfying the condition
 * from a second, different row would pass that constraint cleanly — so
 * repeatable=0 is enforced here, in code, as at most one row per learner
 * per definition whatever evidence it was read from.
 *
 * Every definition in the shipped register is non-repeatable, and the
 * reason is a trap worth naming. A repeatable milestone needs an
 * evidence row that is STABLE per occasion. "The submission that
 * completed the level" is not stable: a later resit adds a row, the
 * chosen evidence moves, and the sweep awards the same fact twice with a
 * clean conscience and a clean UNIQUE index. Only rows the College
 * creates once per occasion — an award, a conferral — are safe, and the
 * register's repeatable slot is left for those.
 *
 * ────────────────────────────────────────────────────────────────
 * THE CONSTANTS BELOW ARE A RESTATEMENT AND THE TEST PINS THEM
 * ────────────────────────────────────────────────────────────────
 * A Pages Function has no filesystem and cannot read data/milestones.json
 * at run time, so REGISTER restates it. A restated constant is a
 * constant that will drift, so tests/achievements.test.mjs reads the file
 * off disk and fails the build the moment a code, a sequence, an
 * evidence source, a condition parameter or either edition of a label
 * stops matching. The arrangement, and the reasoning, are ENGAGEMENT's
 * in functions/_lib/academic/attendance.js.
 */

import { db, newId, nowIso, ValidationError, NotFoundError } from '../db.js';
import {
  HONOURS,
  PROGRESSION,
  SCALE,
  WEIGHTS,
  meetsThreshold,
  percentageFromFraction,
} from './marks.js';
import { computeLearnerStanding } from './standing.js';

/* ───────────────────────────────────────────────────────────────
 * THE REGISTER
 * ─────────────────────────────────────────────────────────────── */

export const REGISTER_INSTRUMENT = Object.freeze({
  id: 'wec.milestone_register',
  version: '1.0.0',
  adopted: false,
  source: 'data/milestones.json',
  readsFrom: 'wec.academic_regulations@1.0.0',
});

/** The five criteria pronunciation_feedback marks, in the schema's order. */
const PRONUNCIATION_CRITERIA = Object.freeze([
  'intelligibility', 'wordStress', 'sentenceStress', 'individualSounds', 'fluency',
]);

/** consecutive_engagement_windows — four windows of engage.window's seven days. */
const SUSTAINED_WINDOWS = 4;
const WINDOW_DAYS = 7;
const WINDOW_MS = WINDOW_DAYS * 86400000;

/** distinction_conferred — the two honours the marking scale defines by threshold. */
const DISTINCTION_HONOURS = Object.freeze(['distinction', 'high_distinction']);

/**
 * Every definition, in the register's order.
 *
 * `rule` names the evaluator below; `parameters` are the numbers the
 * condition is stated with, kept as data so the test can pin them to the
 * published register rather than to a literal buried in a function.
 */
export const REGISTER = Object.freeze([
  {
    code: 'first_work_marked',
    sequence: 1,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'assignment_submissions',
    name: { en: 'First Work Marked', ar: 'أول عمل مُصحَّح' },
    academicFact: {
      en: 'A piece of submitted coursework has been marked and returned by a member of academic staff.',
      ar: 'صُحِّح عملٌ مُسلَّم من أعمال المقرر وأُعيد إلى الطالب على يد أحد أعضاء هيئة التدريس.',
    },
    rule: 'assignment_marked',
    parameters: { required: 1 },
    remaining: {
      default: {
        en: 'Submit one assignment and have it marked. None of your submissions carries a mark yet.',
        ar: 'سلّم واجبًا واحدًا ودعه يُصحَّح. لا يحمل أيٌّ من تسليماتك درجةً بعد.',
      },
      awaiting_marking: {
        en: 'Work is with the College and awaiting a mark. Nothing is outstanding on your side.',
        ar: 'عملك لدى الكلية بانتظار التصحيح، ولا شيء متبقٍّ عليك.',
      },
    },
  },
  {
    code: 'module_passed',
    sequence: 2,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'assignment_submissions',
    name: { en: 'First Module Passed', ar: 'أول وحدة مجتازة' },
    academicFact: {
      en: 'One module is complete on the published composite of its quiz and its assignment, at or above the pass mark of 70.00 per cent.',
      ar: 'أُتمّت وحدة دراسية على التركيبة المنشورة من اختبارها وواجبها، بدرجة النجاح 70.00 بالمئة أو أعلى.',
    },
    rule: 'module_complete',
    parameters: { required: 1 },
    remaining: {
      default: {
        en: 'Complete one module: both its quiz and its assignment marked, and the combined mark at 70.00 or above. A module is never complete on the quiz alone.',
        ar: 'أتمّ وحدة واحدة: تصحيح اختبارها وواجبها معًا، والدرجة المجتمعة 70.00 أو أعلى. لا تكتمل وحدة بالاختبار وحده.',
      },
      awaiting_marking: {
        en: 'Both components of a module are with the College and one is still to be marked. The module completes when the second mark is recorded.',
        ar: 'ركنا إحدى الوحدات لدى الكلية وأحدهما لم يُصحَّح بعد. تكتمل الوحدة حين تُسجَّل الدرجة الثانية.',
      },
    },
  },
  {
    code: 'level_modules_complete',
    sequence: 3,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'assignment_submissions',
    name: { en: 'Every Module of a Level', ar: 'وحدات مستوى كاملة' },
    academicFact: {
      en: 'All ten modules of one programme level are complete — the first of the gates a level award is conferred on.',
      ar: 'اكتملت وحدات مستوى دراسي كامل، وعددها عشر، وهي أول شروط منح شهادة المستوى.',
    },
    rule: 'level_modules_complete',
    parameters: { modules_per_level: WEIGHTS.modulesPerLevel },
    remaining: {
      default: {
        en: 'Complete all {required} modules of one level. {observed} complete at your furthest level; {shortfall} to go.',
        ar: 'أتمّ وحدات مستوى واحد كاملة وعددها {required}. اكتملت {observed} في أبعد مستوياتك، وبقيت {shortfall}.',
      },
      no_modules_authored: {
        en: 'No level you are enrolled at has its modules published yet. This one is outstanding on the College, not on you.',
        ar: 'لم تُنشر بعد وحدات أيّ مستوى أنت مسجَّل فيه. هذا متبقٍّ على الكلية لا عليك.',
      },
    },
  },
  {
    code: 'competencies_all_marked',
    sequence: 4,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'competency_marks',
    name: { en: 'Marked Against Every Competency', ar: 'التصحيح في الكفايات جميعها' },
    academicFact: {
      en: "The learner's work has been marked against every competency the College holds — Clarity, Command, Judgement, Reason, Bearing and Reach.",
      ar: 'صُحِّح عمل الطالب في كل كفاية تعتمدها الكلية: الوضوح والتمكّن والتقدير والحجّة والحضور والامتداد.',
    },
    rule: 'competencies_all_marked',
    // Read from the competencies table at evaluation time and never
    // fixed at six: adding a competency must raise the bar rather than
    // leave the milestone quietly wrong about what it certifies.
    parameters: { required: 'every row in competencies' },
    remaining: {
      default: {
        en: 'Be marked against every competency. {observed} of {required} carry a mark; {shortfall} outstanding.',
        ar: 'أن تُصحَّح في كل كفاية. تحمل {observed} من {required} درجةً، وبقيت {shortfall}.',
      },
      no_competencies: {
        en: 'The College holds no competencies to be marked against.',
        ar: 'لا تحمل الكلية كفايات يُصحَّح عليها.',
      },
    },
  },
  {
    code: 'competency_moderated',
    sequence: 5,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'competency_marks',
    name: { en: 'Confirmed by a Second Marker', ar: 'تأكيد المصحّح الثاني' },
    academicFact: {
      en: "A competency mark on the learner's work has been confirmed by a moderator, marking it a second time and independently of the first marker.",
      ar: 'أكّد مُراجعٌ درجةَ كفايةٍ في عمل الطالب، فصحّحه مرّة ثانية مستقلًّا عن المصحّح الأول.',
    },
    rule: 'moderated_mark',
    parameters: { source: 'moderator', required: 1 },
    remaining: {
      default: {
        en: "Second marking is the College's act, not yours: it happens when a moderator reviews marked work of yours. Nothing here is outstanding on you.",
        ar: 'التصحيح الثاني فعل الكلية لا فعلك: يقع حين يراجع مُراجعٌ عملًا لك مُصحَّحًا. لا شيء هنا متبقٍّ عليك.',
      },
    },
  },
  {
    code: 'pronunciation_reassessed_higher',
    sequence: 6,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'learner_recordings',
    name: { en: 'Pronunciation Reassessed Higher', ar: 'نطقٌ أُعيد تقييمه فارتفع' },
    academicFact: {
      en: 'An instructor assessed a pronunciation task twice, and the later recording was marked higher on every criterion assessed both times.',
      ar: 'قيَّم المعلّمُ مهمّةَ نطقٍ مرّتين، فجاء التسجيل اللاحق أعلى درجةً في كل معيار قُيِّم في المرّتين.',
    },
    rule: 'pronunciation_improved',
    // Measured against the learner's OWN first attempt, because the
    // College publishes no pronunciation target anywhere — see
    // data/milestones.json § not_defined.milestone.pronunciation_target.
    // Borrowing the published pass mark of 70.00, which governs a module,
    // the level examination and the Pass honour and nothing else, would
    // be a fourth rule nobody adopted.
    parameters: {
      assessed_attempts_required: 2,
      assessor_source: 'instructor',
      improvement: 'strictly_higher_on_every_shared_criterion',
    },
    remaining: {
      default: {
        en: 'Record one pronunciation task, have it assessed, then record it again. Assessed attempts on your strongest item so far: {observed} of {required}.',
        ar: 'سجّل مهمّة نطق واحدة، ودعها تُقيَّم، ثم سجّلها ثانية. المحاولات المقيَّمة في أقوى مهمّاتك حتى الآن: {observed} من {required}.',
      },
      awaiting_second_assessment: {
        en: 'A second recording is with the College and awaiting assessment.',
        ar: 'تسجيل ثانٍ لدى الكلية بانتظار التقييم.',
      },
      not_yet_higher: {
        en: 'A task has been assessed twice and the later marks are not yet higher on every criterion marked both times. Record it again.',
        ar: 'قُيِّمت إحدى المهمّات مرّتين ولم ترتفع درجات اللاحقة بعدُ في كل معيار صُحِّح فيهما. سجّلها من جديد.',
      },
    },
  },
  {
    code: 'sustained_engagement',
    sequence: 7,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'attendance_records',
    name: { en: 'Four Windows Unbroken', ar: 'أربع نوافذ متتالية' },
    academicFact: {
      en: 'Work on the programme reached the College in four consecutive seven-day engagement windows.',
      ar: 'بلغ الكليةَ عملٌ في البرنامج في أربع نوافذ مشاركة متتالية، مدّة كل منها سبعة أيام.',
    },
    rule: 'consecutive_engagement_windows',
    parameters: {
      consecutive_windows: SUSTAINED_WINDOWS,
      window_days: WINDOW_DAYS,
      state: 'attended',
      basis: 'module_engagement',
    },
    remaining: {
      default: {
        en: 'Have work reach the College in {required} consecutive seven-day windows. Your longest unbroken run so far is {observed}.',
        ar: 'أن يبلغ الكليةَ عملٌ لك في {required} نوافذ متتالية من سبعة أيام. أطول تتابع لك حتى الآن {observed}.',
      },
      not_started: {
        en: 'No engagement window has closed yet, so there is no run to count. A window opens on the day your enrolment starts.',
        ar: 'لم تُغلق بعد أي نافذة مشاركة، فلا تتابع يُحسب. تُفتح النافذة يوم بدء تسجيلك.',
      },
    },
  },
  ...levelAwardDefinitions(),
  {
    code: 'first_distinction',
    sequence: 14,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'awards',
    name: { en: 'First Distinction', ar: 'أول تميّز' },
    academicFact: {
      en: 'A level award has been conferred at Distinction or High Distinction — a level mark of 88.00 or above with no skill below 80.00.',
      ar: 'مُنحت شهادة مستوى بمرتبة التميّز أو التميّز العالي: درجة مستوى 88.00 فما فوق دون أن تنزل مهارة عن 80.00.',
    },
    rule: 'distinction_conferred',
    parameters: { honours: DISTINCTION_HONOURS },
    remaining: {
      default: {
        en: 'Be conferred a level award at Distinction: a level mark of {threshold} or above, with no skill below {skill_floor}.',
        ar: 'أن تُمنح شهادة مستوى بمرتبة التميّز: درجة مستوى {threshold} فأعلى، دون أن تنزل مهارة عن {skill_floor}.',
      },
    },
  },
  {
    code: 'programme_complete',
    sequence: 15,
    status: 'proposed',
    repeatable: false,
    levelId: null,
    evidenceSource: 'awards',
    name: { en: 'The Programme in Full', ar: 'البرنامج كاملًا' },
    academicFact: {
      en: 'All six level awards of the International English Fluency Certificate are held — 120 credits, Level I through Level VI.',
      ar: 'حِيزت شهادات المستويات الستة كلها في شهادة الطلاقة في اللغة الإنجليزية الدولية: مئة وعشرون اعتمادًا، من المستوى الأول إلى السادس.',
    },
    rule: 'programme_complete',
    parameters: { levels: PROGRESSION.levels },
    remaining: {
      default: {
        en: 'Hold all {required} level awards. {observed} conferred; outstanding: {outstanding}.',
        ar: 'أن تحوز شهادات المستويات {required} كلها. مُنحت {observed}، وبقيت {shortfall}.',
      },
    },
  },
].map(Object.freeze));

/**
 * The six level awards, written once.
 *
 * Six definitions rather than one repeatable definition with a null
 * level, because each carries a different published award — a different
 * title, post-nominal, CEFR band and Arabic name — and a single
 * definition would have to render them from a lookup at display time.
 * They are also the only facts in the register the College creates
 * exactly once per occasion, which is what a repeatable definition
 * would have needed and none of the others has.
 */
function levelAwardDefinitions() {
  const AWARDS = [
    { levelId: 1, roman: 'I', en: 'English Aspirant', ar: 'طالب اللغة الإنجليزية', post: 'ApWEC', cefr: 'A1', arOrdinal: 'الأول' },
    { levelId: 2, roman: 'II', en: 'English Candidate', ar: 'مرشّح اللغة الإنجليزية', post: 'CnWEC', cefr: 'A2', arOrdinal: 'الثاني' },
    { levelId: 3, roman: 'III', en: 'English Associate', ar: 'زميل اللغة الإنجليزية', post: 'AsWEC', cefr: 'B1', arOrdinal: 'الثالث' },
    { levelId: 4, roman: 'IV', en: 'English Envoy', ar: 'موفد اللغة الإنجليزية', post: 'EnWEC', cefr: 'B2', arOrdinal: 'الرابع' },
    { levelId: 5, roman: 'V', en: 'English Orator', ar: 'خطيب اللغة الإنجليزية', post: 'OrWEC', cefr: 'C1', arOrdinal: 'الخامس' },
    { levelId: 6, roman: 'VI', en: 'English Laureate', ar: 'متوَّج اللغة الإنجليزية', post: 'LrWEC', cefr: 'C2', arOrdinal: 'السادس' },
  ];
  return AWARDS.map((a) => ({
    code: `level_award_${a.levelId}`,
    sequence: 7 + a.levelId,
    status: 'proposed',
    repeatable: false,
    levelId: a.levelId,
    evidenceSource: 'awards',
    name: { en: a.en, ar: a.ar },
    academicFact: {
      en: `The Level ${a.roman} award — ${a.en} of WorldWide English College, ${a.post}, CEFR ${a.cefr}, 20 credits — has been conferred and stands on the register.`,
      ar: `مُنحت شهادة المستوى ${a.arOrdinal} — ${a.ar} بكلية العالم للغة الإنجليزية، ${a.post}، الإطار الأوروبي ${a.cefr}، عشرون اعتمادًا — وهي قائمة في السجلّ.`,
    },
    rule: 'level_award_conferred',
    parameters: { level_id: a.levelId },
    remaining: {
      // BOTH editions count, and neither recites. The measurement
      // engine writes its account of the outstanding conditions in
      // English only, so splicing it into the sentence would give the
      // English reader a paragraph and the Arabic reader a number. The
      // conditions travel structured instead, in `detail`, where a
      // template renders them in either edition and each one carries
      // whose work it is.
      default: {
        en: `The Level ${a.roman} award is conferred when every condition of the level is met. {outstandingCount} remain, each named beside this with whose work it is.`,
        ar: `تُمنح شهادة المستوى ${a.arOrdinal} عند تحقق كل شروط المستوى. بقي منها {outstandingCount}، وكل شرط مذكور بجانبه ومعه صاحب العمل فيه.`,
      },
      awaiting_conferral: {
        en: `Every condition of Level ${a.roman} is met. The award is conferred when the Graduate Register writes it.`,
        ar: `تحقّقت شروط المستوى ${a.arOrdinal} كلها. وتُمنح الشهادة حين يكتبها سجلّ الخرّيجين.`,
      },
      not_reached: {
        en: a.levelId === 1
          ? 'Level I is not open on your record yet.'
          : `Level ${a.roman} is not open on your record yet. A level opens when the level before it is completed.`,
        ar: a.levelId === 1
          ? 'لم يُفتح المستوى الأول في سجلّك بعد.'
          : `لم يُفتح المستوى ${a.arOrdinal} في سجلّك بعد. يُفتح المستوى عند إتمام المستوى الذي قبله.`,
      },
    },
  }));
}

const BY_CODE = new Map(REGISTER.map((d) => [d.code, d]));

/**
 * The labelled statement that travels at the top of every payload, in
 * both editions.
 *
 * It is a required field rather than a caption the UI may drop, for the
 * reason engagementNotice() is: a grid of gold discs with no statement
 * over it is a badge wall whatever the API called it, and the sentence
 * that makes it something else has to be in the payload to be certain of
 * reaching the screen.
 */
export function achievementNotice() {
  return {
    id: 'mil.record_not_reward',
    label: {
      en: 'These mark academic facts',
      ar: 'هذه المحطّات تشير إلى وقائع أكاديمية',
    },
    statement: {
      en: 'Every milestone here marks something the College assessed or attested: work a person marked, a competency confirmed by a second marker, a pronunciation task reassessed, an award conferred on the register. Nothing on this page can be earned by signing in, by a run of days, or by time spent on the platform — the College keeps no record of any of those for an achievement to be read from. Nothing here is a condition of any award, a component of any mark, or an input to academic standing.',
      ar: 'كل محطّة هنا تشير إلى ما قيَّمته الكلية أو وثّقته: عملٌ صحّحه إنسان، وكفايةٌ أكّدها مصحّح ثانٍ، ومهمّةُ نطق أُعيد تقييمها، وشهادةٌ مُنحت في السجلّ. ولا يُنال شيء في هذه الصفحة بتسجيل دخول ولا بتتابع أيام ولا بزمن أمام المنصّة؛ فالكلية لا تحفظ من ذلك شيئًا تُقرأ منه محطّة. وليس شيء ممّا هنا شرطًا لشهادة، ولا ركنًا في درجة، ولا مدخلًا في الوقوف الأكاديمي.',
    },
    principles: [
      { id: 'mil.fact_not_activity', en: 'Every milestone marks an assessed or attested academic fact', ar: 'كل محطّة تشير إلى واقعة أكاديمية مُقيَّمة أو مُوثَّقة' },
      { id: 'mil.no_activity_measure', en: 'Nothing can be earned from a login, a streak or time on a page', ar: 'لا تُنال محطّة بتسجيل دخول ولا بمواظبة ولا بزمن أمام الشاشة' },
      { id: 'mil.evidence_travels', en: 'The row that earned it is carried on the record, not recomputed', ar: 'يُحمل على السجلّ الصفُّ الذي استُحقّت به، ولا يُعاد حسابه' },
      { id: 'mil.earned_on_the_day_the_fact_was_true', en: 'A milestone is dated to its evidence, not to the day the platform noticed', ar: 'تُؤرَّخ المحطّة بتاريخ دليلها لا بيوم انتباه النظام إليها' },
      { id: 'mil.never_silently_revoked', en: 'The platform awards and never withdraws', ar: 'يمنح النظام ولا يسحب' },
      { id: 'mil.route_is_published', en: 'An unearned milestone always states exactly what remains', ar: 'كل محطّة لم تُنل تُبيّن ما بقي لنيلها بالضبط' },
      { id: 'mil.no_penalty', en: 'A milestone not held is not a mark against anybody', ar: 'المحطّة غير المنالة ليست مأخذًا على أحد' },
    ],
    register: {
      instrument: REGISTER_INSTRUMENT.id,
      version: REGISTER_INSTRUMENT.version,
      published: REGISTER_INSTRUMENT.source,
    },
  };
}

/* ───────────────────────────────────────────────────────────────
 * INSTALLING AND APPROVING THE REGISTER
 * ─────────────────────────────────────────────────────────────── */

/**
 * Install every definition the register proposes, as `proposed`.
 *
 * Idempotent by `code`, and it NEVER touches a row that already exists.
 * An approved definition carries somebody's name and the date they
 * approved it; a re-run that refreshed a label would silently re-write a
 * definition under an approval given to different words.
 */
export async function seedMilestoneDefinitions(env) {
  const conn = db(env);
  const { results } = await conn.prepare('SELECT code FROM milestone_definitions').bind().all();
  const held = new Set(results.map((r) => r.code));

  const inserted = [];
  for (const def of REGISTER) {
    if (held.has(def.code)) continue;
    await conn.prepare(
      `INSERT INTO milestone_definitions
         (id, code, sequence, name, academic_fact, evidence_source, level_id, repeatable, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'proposed', ?)`)
      .bind(newId('mdf'), def.code, def.sequence, def.name.en, def.academicFact.en,
        def.evidenceSource, def.levelId, def.repeatable ? 1 : 0, nowIso())
      .run();
    inserted.push(def.code);
  }
  return { inserted, alreadyHeld: [...held], total: REGISTER.length };
}

/**
 * The College adopts one definition.
 *
 * `actorId` is required and is not a formality: the schema refuses an
 * approved row without an approver and a date, because an approval
 * nobody's name is on is a word rather than an act. Role is the caller's
 * check — this file does no authentication, the same division auth/
 * enforces everywhere else.
 */
export async function approveMilestoneDefinition(env, { code, actorId, at = null }) {
  const fields = {};
  if (typeof code !== 'string' || !code.trim()) fields.code = 'Required';
  if (typeof actorId !== 'string' || !actorId.trim()) fields.actorId = 'Required — an approval carries the name of whoever gave it';
  if (Object.keys(fields).length) throw new ValidationError('That milestone definition could not be approved.', fields);

  const row = await db(env).prepare('SELECT id, code, status FROM milestone_definitions WHERE code = ?').bind(code).first();
  if (!row) throw new NotFoundError('No milestone definition carries that code.');
  if (row.status === 'retired') {
    throw new ValidationError('A retired definition is not approved back into force; propose it again.', { code: 'Retired' });
  }

  const approvedAt = at || nowIso();
  await db(env)
    .prepare("UPDATE milestone_definitions SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?")
    .bind(actorId, approvedAt, row.id)
    .run();
  return { id: row.id, code: row.code, status: 'approved', approvedBy: actorId, approvedAt };
}

/* ───────────────────────────────────────────────────────────────
 * READING THE RECORD
 * ─────────────────────────────────────────────────────────────── */

/**
 * Everything fifteen conditions are decided from, in one pass.
 *
 * The measurement engine is called once and its module states are taken
 * as authoritative rather than recomputed here — a second implementation
 * of "is this module complete" is a second answer waiting to disagree
 * with the transcript. What this file reads for itself is the ROW IDS
 * the engine has no reason to carry, because a milestone without the row
 * that earned it is an assertion.
 */
async function readEvidence(env, userId) {
  const conn = db(env);
  const q = (sql) => conn.prepare(sql).bind(userId).all();

  const [report, awards, submissions, quizzes, competencyMarks, competencies, recordings, engagement, held, definitions] =
    await Promise.all([
      computeLearnerStanding(env, userId),
      q(`SELECT id, level_id AS levelId, honour, status, conferred_on AS conferredOn,
                award_title AS awardTitle, post_nominal AS postNominal
           FROM awards WHERE user_id = ? ORDER BY conferred_on ASC, level_id ASC`),
      q(`SELECT s.id AS id, i.unit_id AS unitId, s.status AS status, s.grade AS grade,
                s.submitted_at AS submittedAt, s.graded_at AS gradedAt
           FROM assignment_submissions s
           JOIN learning_items i ON i.id = s.learning_item_id
          WHERE s.user_id = ? ORDER BY s.submitted_at ASC, s.id ASC`),
      q(`SELECT a.id AS id, i.unit_id AS unitId, a.score AS score, a.submitted_at AS submittedAt
           FROM quiz_attempts a
           JOIN learning_items i ON i.id = a.learning_item_id
          WHERE a.user_id = ? ORDER BY a.submitted_at ASC, a.id ASC`),
      // Joined through the submission, which is what ties a competency
      // mark to a person: competency_marks carries no user_id of its own.
      q(`SELECT m.id AS id, m.competency_id AS competencyId, m.source AS source,
                m.mark AS mark, m.created_at AS createdAt
           FROM competency_marks m
           JOIN assignment_submissions s ON s.id = m.submission_id
          WHERE s.user_id = ? ORDER BY m.created_at ASC, m.id ASC`),
      conn.prepare('SELECT id, code, name FROM competencies ORDER BY sequence ASC').bind().all(),
      q(`SELECT r.id AS id, r.learning_item_id AS itemId, r.attempt AS attempt,
                r.submitted_at AS submittedAt, r.purged_at AS purgedAt,
                f.id AS feedbackId, f.source AS feedbackSource,
                f.intelligibility AS intelligibility, f.word_stress AS wordStress,
                f.sentence_stress AS sentenceStress, f.individual_sounds AS individualSounds,
                f.fluency AS fluency
           FROM learner_recordings r
           LEFT JOIN pronunciation_feedback f
             ON f.recording_id = r.id AND f.source = 'instructor'
          WHERE r.user_id = ? ORDER BY r.attempt ASC, r.submitted_at ASC, r.id ASC`),
      q(`SELECT id, window_start AS windowStart, window_end AS windowEnd
           FROM attendance_records
          WHERE user_id = ? AND basis = 'module_engagement' AND state = 'attended'
          ORDER BY window_start ASC, id ASC`),
      q(`SELECT id, definition_id AS definitionId, earned_on AS earnedOn,
                evidence_source AS evidenceSource, evidence_id AS evidenceId,
                awarded_by AS awardedBy, revoked_at AS revokedAt, revoked_reason AS revokedReason
           FROM learner_milestones WHERE user_id = ? ORDER BY earned_on ASC, id ASC`),
      conn.prepare(
        `SELECT id, code, sequence, name, academic_fact AS academicFact, evidence_source AS evidenceSource,
                level_id AS levelId, repeatable, status, approved_by AS approvedBy, approved_at AS approvedAt
           FROM milestone_definitions ORDER BY sequence ASC`).bind().all(),
    ]);

  const modules = report.levels.flatMap((level) =>
    level.modules.map((m) => ({ ...m, levelId: level.levelId })));

  return {
    userId,
    report,
    modules,
    awards: awards.results,
    submissions: submissions.results,
    quizzes: quizzes.results,
    competencyMarks: competencyMarks.results,
    competencies: competencies.results,
    recordings: recordings.results,
    engagement: engagement.results,
    held: held.results,
    definitions: definitions.results,
  };
}

/* ───────────────────────────────────────────────────────────────
 * THE ATTEMPT THAT COUNTED
 * ─────────────────────────────────────────────────────────────── */

/**
 * Which attempt in an ordered list carries the mark that stands.
 *
 * marks.js's countingMarkForAttempts() computes the MARK and has no
 * reason to return the row, so this mirrors its choice — the first
 * attempt if the first attempt passed, otherwise the last — to name the
 * row. Mirroring a rule is how two implementations drift, so
 * tests/achievements.test.mjs asserts this pick agrees with
 * countingMarkForAttempts() across every case it distinguishes:
 * a single attempt, a pass then a higher resit, a fail then a pass, and
 * an unmarked latest attempt.
 */
export function countingAttempt(attempts) {
  const list = Array.isArray(attempts) ? attempts : [];
  if (!list.length) return null;
  const firstPassed = Number.isFinite(list[0].percentage) && meetsThreshold(list[0].percentage, SCALE.passMark);
  return firstPassed ? list[0] : list[list.length - 1];
}

/** A date, from either a date or an ISO instant. `earned_on` is a day. */
function dayOf(value) {
  if (typeof value !== 'string' || !value) return null;
  return value.slice(0, 10);
}

const laterOf = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
};

/** The assignment attempts of one unit, in order, carrying their row ids. */
function assignmentAttempts(ctx, unitId) {
  return ctx.submissions
    .filter((s) => s.unitId === unitId)
    .map((s) => ({
      id: s.id,
      // A submission with no grade is an attempt whose mark does not
      // exist yet — null, never a fail. The same reading standing.js
      // takes, for the same reason.
      percentage: s.status === 'graded' && Number.isFinite(s.grade) ? percentageFromFraction(s.grade) : null,
      at: s.submittedAt,
      // The module completed when the MARK existed, not when the work
      // was handed in.
      markedAt: s.gradedAt || s.submittedAt,
    }));
}

function quizAttempts(ctx, unitId) {
  return ctx.quizzes
    .filter((a) => a.unitId === unitId)
    .map((a) => ({ id: a.id, percentage: percentageFromFraction(a.score), at: a.submittedAt, markedAt: a.submittedAt }));
}

/** The row and the day one complete module completed on. */
function moduleCompletion(ctx, module) {
  const assignment = countingAttempt(assignmentAttempts(ctx, module.unitId));
  const quiz = countingAttempt(quizAttempts(ctx, module.unitId));
  if (!assignment) return null;
  return {
    unitId: module.unitId,
    levelId: module.levelId,
    sequence: module.sequence,
    title: module.title,
    evidenceId: assignment.id,
    completedAt: laterOf(assignment.markedAt, quiz ? quiz.markedAt : null),
  };
}

/* ───────────────────────────────────────────────────────────────
 * THE CONDITIONS
 * ───────────────────────────────────────────────────────────────
 * One evaluator per `rule`. Each returns the same shape:
 *
 *   satisfied     whether the fact is true of this learner
 *   evidenceId    the row that makes it true, or null
 *   earnedOn      the DAY that row is dated to, or null
 *   observed      where the learner stands, in the condition's own unit
 *   required      what the condition asks for
 *   state         which `remaining` sentence to show while it is not met
 *   values        anything else the sentence interpolates
 *
 * No evaluator writes anything, and none of them can: awarding is one
 * function, below, so there is exactly one place a milestone can be
 * created and exactly one place the repeatable and revocation rules are
 * enforced.
 */

const RULES = {
  assignment_marked(ctx, def) {
    const marked = ctx.submissions.filter((s) => (s.status === 'graded' || s.status === 'returned') && s.grade != null);
    const ordered = [...marked].sort((a, b) => Date.parse(a.gradedAt || a.submittedAt) - Date.parse(b.gradedAt || b.submittedAt));
    const first = ordered[0] || null;
    return {
      satisfied: Boolean(first),
      evidenceId: first ? first.id : null,
      earnedOn: first ? dayOf(first.gradedAt || first.submittedAt) : null,
      observed: marked.length,
      required: def.parameters.required,
      state: first ? null : (ctx.submissions.length ? 'awaiting_marking' : 'default'),
    };
  },

  module_complete(ctx, def) {
    const complete = ctx.modules
      .filter((m) => m.state === 'marked' && m.complete)
      .map((m) => moduleCompletion(ctx, m))
      .filter(Boolean)
      .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt)
        || a.levelId - b.levelId || a.sequence - b.sequence);
    const first = complete[0] || null;
    const awaiting = ctx.modules.some((m) => m.state === 'awaiting_marking');
    return {
      satisfied: Boolean(first),
      evidenceId: first ? first.evidenceId : null,
      earnedOn: first ? dayOf(first.completedAt) : null,
      observed: complete.length,
      required: def.parameters.required,
      state: first ? null : (awaiting ? 'awaiting_marking' : 'default'),
    };
  },

  level_modules_complete(ctx, def) {
    const expected = def.parameters.modules_per_level;
    const byLevel = new Map();
    for (const m of ctx.modules) {
      if (!byLevel.has(m.levelId)) byLevel.set(m.levelId, []);
      byLevel.get(m.levelId).push(m);
    }

    let best = 0;
    let earned = null;
    for (const [levelId, modules] of byLevel) {
      const done = modules.filter((m) => m.state === 'marked' && m.complete);
      if (done.length > best) best = done.length;
      // level.gate.modules_complete exactly: every AUTHORED module
      // complete, and the level carrying the ten the regulations expect.
      if (modules.length !== expected || done.length !== modules.length) continue;
      const completions = done.map((m) => moduleCompletion(ctx, m)).filter(Boolean);
      if (completions.length !== done.length) continue;
      const last = completions.sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt)).at(-1);
      if (!earned || Date.parse(last.completedAt) < Date.parse(earned.completedAt)) {
        earned = { ...last, levelId };
      }
    }

    return {
      satisfied: Boolean(earned),
      evidenceId: earned ? earned.evidenceId : null,
      earnedOn: earned ? dayOf(earned.completedAt) : null,
      observed: best,
      required: expected,
      state: earned ? null : (byLevel.size ? 'default' : 'no_modules_authored'),
      values: earned ? { levelId: earned.levelId } : {},
      detail: {
        byLevel: [...byLevel.entries()].map(([levelId, modules]) => ({
          levelId,
          authored: modules.length,
          expected,
          complete: modules.filter((m) => m.state === 'marked' && m.complete).length,
        })),
      },
    };
  },

  competencies_all_marked(ctx) {
    const required = ctx.competencies.length;
    // The earliest mark in each competency. The set completes at the
    // latest of those firsts, which is the row that earned it.
    const firsts = new Map();
    for (const m of ctx.competencyMarks) {
      if (!firsts.has(m.competencyId)) firsts.set(m.competencyId, m);
    }
    const observed = [...firsts.keys()].filter((id) => ctx.competencies.some((c) => c.id === id)).length;
    const satisfied = required > 0 && observed >= required;
    const closing = satisfied
      ? [...firsts.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).at(-1)
      : null;
    return {
      satisfied,
      evidenceId: closing ? closing.id : null,
      earnedOn: closing ? dayOf(closing.createdAt) : null,
      observed,
      required,
      state: satisfied ? null : (required === 0 ? 'no_competencies' : 'default'),
    };
  },

  moderated_mark(ctx, def) {
    const moderated = ctx.competencyMarks.filter((m) => m.source === def.parameters.source);
    const first = moderated[0] || null;
    return {
      satisfied: Boolean(first),
      evidenceId: first ? first.id : null,
      earnedOn: first ? dayOf(first.createdAt) : null,
      observed: moderated.length,
      required: def.parameters.required,
      state: first ? null : 'default',
    };
  },

  pronunciation_improved(ctx, def) {
    const required = def.parameters.assessed_attempts_required;
    const live = ctx.recordings.filter((r) => !r.purgedAt);
    const byItem = new Map();
    for (const r of live) {
      if (!byItem.has(r.itemId)) byItem.set(r.itemId, []);
      byItem.get(r.itemId).push(r);
    }

    let deepest = 0;
    let assessedTwiceSomewhere = false;
    let unassessedSecond = false;
    let earned = null;

    for (const takes of byItem.values()) {
      const assessed = takes.filter((r) => r.feedbackId && r.feedbackSource === 'instructor');
      if (assessed.length > deepest) deepest = assessed.length;
      if (assessed.length >= required) assessedTwiceSomewhere = true;
      if (assessed.length === 1 && takes.length > assessed.length) unassessedSecond = true;
      if (assessed.length < required) continue;

      const baseline = assessed[0];
      for (const later of assessed.slice(1)) {
        // Only criteria marked BOTH times can be compared. A criterion
        // assessed once says nothing about movement, and treating an
        // unmarked one as zero would manufacture an improvement out of
        // the instructor's silence.
        const shared = PRONUNCIATION_CRITERIA.filter(
          (c) => Number.isFinite(baseline[c]) && Number.isFinite(later[c]));
        if (!shared.length) continue;
        if (!shared.every((c) => later[c] > baseline[c])) continue;
        if (!earned || Date.parse(later.submittedAt) < Date.parse(earned.submittedAt)) earned = later;
        break;
      }
    }

    return {
      satisfied: Boolean(earned),
      evidenceId: earned ? earned.id : null,
      earnedOn: earned ? dayOf(earned.submittedAt) : null,
      observed: deepest,
      required,
      state: earned ? null
        : (assessedTwiceSomewhere ? 'not_yet_higher' : (unassessedSecond ? 'awaiting_second_assessment' : 'default')),
    };
  },

  consecutive_engagement_windows(ctx, def) {
    const required = def.parameters.consecutive_windows;
    const starts = [...new Set(ctx.engagement.map((r) => r.windowStart))]
      .map((s) => ({ start: s, ms: Date.parse(s) }))
      .filter((s) => Number.isFinite(s.ms))
      .sort((a, b) => a.ms - b.ms);

    let run = 0;
    let longest = 0;
    let closing = null;
    for (let i = 0; i < starts.length; i++) {
      run = (i > 0 && starts[i].ms - starts[i - 1].ms === WINDOW_MS) ? run + 1 : 1;
      if (run > longest) longest = run;
      if (run >= required && !closing) closing = starts[i];
    }

    // The first row, in order, of the window that closed the run — the
    // same deterministic pick on every sweep, which is what keeps a
    // re-run from finding different evidence for one fact.
    const row = closing ? ctx.engagement.find((r) => r.windowStart === closing.start) : null;
    return {
      satisfied: Boolean(row),
      evidenceId: row ? row.id : null,
      // The day the fourth window CLOSED. A run of four is not a fact
      // until the fourth window is over.
      earnedOn: row ? dayOf(row.windowEnd) : null,
      observed: longest,
      required,
      state: row ? null : (starts.length ? 'default' : 'not_started'),
    };
  },

  level_award_conferred(ctx, def) {
    const levelId = def.parameters.level_id;
    const award = ctx.awards.find((a) => a.levelId === levelId && a.status === 'conferred') || null;
    const level = ctx.report.levels.find((l) => l.levelId === levelId) || null;
    // What remains comes from the measurement engine rather than from a
    // sentence written here, so a learner reads one account of the
    // outstanding conditions and not two that can disagree.
    const outstandingConditions = level ? level.graduation.outstandingConditions : [];
    const state = award ? null
      : (!level ? 'not_reached' : (outstandingConditions.length ? 'default' : 'awaiting_conferral'));
    return {
      satisfied: Boolean(award),
      evidenceId: award ? award.id : null,
      earnedOn: award ? dayOf(award.conferredOn) : null,
      observed: award ? 1 : 0,
      required: 1,
      state,
      values: { outstandingCount: outstandingConditions.length },
      // Structured beside the sentence: each named condition, and — the
      // half a sentence cannot carry — whether the outstanding work is
      // the learner's or the College's.
      detail: {
        levelId,
        graduationState: level ? level.graduation.state : null,
        outstanding: level && level.graduation.outstanding ? level.graduation.outstanding : null,
        conditions: outstandingConditions.map((c) => ({
          id: c.id, label: c.label, detail: c.detail, owner: c.owner, met: c.met,
        })),
      },
    };
  },

  distinction_conferred(ctx, def) {
    const honours = def.parameters.honours;
    const found = ctx.awards
      .filter((a) => a.status === 'conferred' && honours.includes(a.honour))
      .sort((a, b) => Date.parse(a.conferredOn) - Date.parse(b.conferredOn) || a.levelId - b.levelId);
    const first = found[0] || null;
    const distinction = HONOURS.find((h) => h.code === 'distinction');
    return {
      satisfied: Boolean(first),
      evidenceId: first ? first.id : null,
      earnedOn: first ? dayOf(first.conferredOn) : null,
      observed: found.length,
      required: 1,
      state: first ? null : 'default',
      values: {
        threshold: distinction.overallThreshold.toFixed(2),
        skill_floor: distinction.skillFloor.toFixed(2),
      },
    };
  },

  programme_complete(ctx, def) {
    const levels = def.parameters.levels;
    const conferred = ctx.awards.filter((a) => a.status === 'conferred');
    const held = [...new Set(conferred.map((a) => a.levelId))].sort((a, b) => a - b);
    const outstanding = levels.filter((id) => !held.includes(id));
    const last = outstanding.length ? null
      : [...conferred].sort((a, b) => Date.parse(a.conferredOn) - Date.parse(b.conferredOn) || a.levelId - b.levelId).at(-1);
    return {
      satisfied: Boolean(last),
      evidenceId: last ? last.id : null,
      earnedOn: last ? dayOf(last.conferredOn) : null,
      observed: held.length,
      required: levels.length,
      state: last ? null : 'default',
      values: {
        outstanding: outstanding.length
          ? `Level${outstanding.length === 1 ? '' : 's'} ${outstanding.join(', ')}`
          : null,
      },
      detail: { levelsHeld: held, levelsOutstanding: outstanding },
    };
  },
};

/* ───────────────────────────────────────────────────────────────
 * AWARDING
 * ─────────────────────────────────────────────────────────────── */

/**
 * Evaluate one learner against every APPROVED definition and write what
 * is newly earned.
 *
 * Three refusals, each of which is a way this could award wrongly:
 *
 *   · a definition that is not approved is not evaluated at all;
 *   · a non-repeatable definition already held is never awarded again,
 *     whatever new evidence satisfies it;
 *   · a definition whose milestone a PERSON revoked is never re-awarded,
 *     including from different evidence. A revocation is a judgement and
 *     a sweep that awarded around it would be the platform overruling
 *     the College.
 *
 * `awarded_by` is left NULL, which the schema reads as "the platform
 * read the fact". A milestone the platform derived must never carry a
 * member of staff's name, and the same rule in reverse means a
 * conferral a person made is never overwritten by this.
 */
export async function awardMilestones(env, userId, { ctx = null } = {}) {
  const context = ctx || await readEvidence(env, userId);
  const conn = db(env);

  const heldByDefinition = new Map();
  for (const row of context.held) {
    if (!heldByDefinition.has(row.definitionId)) heldByDefinition.set(row.definitionId, []);
    heldByDefinition.get(row.definitionId).push(row);
  }

  const awarded = [];
  const skipped = [];

  for (const row of context.definitions) {
    if (row.status !== 'approved') {
      skipped.push({ code: row.code, reason: `definition is ${row.status}, not approved` });
      continue;
    }
    const rule = BY_CODE.get(row.code);
    if (!rule || !RULES[rule.rule]) {
      // A definition in the table with no evaluator is visible rather
      // than silently inert: somebody added it by hand and the code that
      // would check it does not exist.
      skipped.push({ code: row.code, reason: 'no rule in this build evaluates that code' });
      continue;
    }

    const outcome = RULES[rule.rule](context, rule);
    if (!outcome.satisfied || !outcome.evidenceId) continue;

    const existing = heldByDefinition.get(row.id) || [];
    if (existing.some((m) => m.revokedAt)) {
      skipped.push({ code: row.code, reason: 'a person revoked this milestone; the platform does not award around a revocation' });
      continue;
    }
    if (!row.repeatable && existing.length) continue;
    if (existing.some((m) => m.evidenceId === outcome.evidenceId)) continue;

    const id = newId('mil');
    await conn.prepare(
      `INSERT INTO learner_milestones
         (id, user_id, definition_id, earned_on, evidence_source, evidence_id, awarded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
       ON CONFLICT (user_id, definition_id, evidence_id) DO NOTHING`)
      .bind(id, userId, row.id, outcome.earnedOn || dayOf(nowIso()), row.evidenceSource, outcome.evidenceId, nowIso())
      .run();

    const written = { id, code: row.code, definitionId: row.id, earnedOn: outcome.earnedOn, evidenceId: outcome.evidenceId };
    awarded.push(written);
    existing.push({ ...written, evidenceSource: row.evidenceSource, revokedAt: null });
    heldByDefinition.set(row.id, existing);
  }

  return { awarded, skipped, definitionsEvaluated: context.definitions.filter((d) => d.status === 'approved').length };
}

/* ───────────────────────────────────────────────────────────────
 * THE LEARNER'S OWN PAGE
 * ─────────────────────────────────────────────────────────────── */

const fill = (template, values) => String(template).replace(/\{(\w+)\}/g, (whole, key) => (
  values[key] === null || values[key] === undefined ? whole : String(values[key])
));

/** Both editions of one sentence, interpolated. */
function sentence(pair, values) {
  return { en: fill(pair.en, values), ar: fill(pair.ar, values) };
}

/**
 * Everything the register can say about one learner: what is held, what
 * is not, and — for every one of the latter — exactly what remains.
 *
 * `award` runs the sweep first so the page is never a snapshot of the
 * last cron. Callers pass the subject id and never take it from a
 * request; the endpoint takes it from the session, which is the rule
 * stated once in functions/api/student/dashboard.js.
 */
export async function learnerAchievements(env, userId, { award = true, now = null } = {}) {
  if (typeof userId !== 'string' || !userId) {
    throw new ValidationError('A learner id is required.', { userId: 'Required' });
  }

  let ctx = await readEvidence(env, userId);
  let sweep = { awarded: [], skipped: [], definitionsEvaluated: 0 };
  if (award) {
    sweep = await awardMilestones(env, userId, { ctx });
    // Re-read only the rows, not the whole record: the sweep changed
    // learner_milestones and nothing else.
    if (sweep.awarded.length) {
      const { results } = await db(env).prepare(
        `SELECT id, definition_id AS definitionId, earned_on AS earnedOn,
                evidence_source AS evidenceSource, evidence_id AS evidenceId,
                awarded_by AS awardedBy, revoked_at AS revokedAt, revoked_reason AS revokedReason
           FROM learner_milestones WHERE user_id = ? ORDER BY earned_on ASC, id ASC`).bind(userId).all();
      ctx = { ...ctx, held: results };
    }
  }

  const byDefinitionId = new Map();
  for (const row of ctx.held) {
    if (!byDefinitionId.has(row.definitionId)) byDefinitionId.set(row.definitionId, []);
    byDefinitionId.get(row.definitionId).push(row);
  }

  const earned = [];
  const unearned = [];
  const withdrawn = [];
  const notInForce = [];
  const unevaluable = [];

  for (const row of ctx.definitions) {
    const def = BY_CODE.get(row.code) || null;
    const rule = def && RULES[def.rule] ? RULES[def.rule] : null;
    const identity = {
      code: row.code,
      sequence: row.sequence,
      levelId: row.levelId,
      evidenceSource: row.evidenceSource,
      repeatable: Boolean(row.repeatable),
      name: def ? def.name : { en: row.name, ar: null },
      academicFact: def ? def.academicFact : { en: row.academicFact, ar: null },
    };

    if (row.status !== 'approved') {
      notInForce.push({
        ...identity,
        status: row.status,
        statement: {
          en: row.status === 'retired'
            ? 'Retired. The College no longer honours this, and any learner who holds it keeps it.'
            : 'Proposed and not yet adopted. The College honours nothing under this definition until it is approved, so it is listed here rather than shown as a prize you have not won.',
          ar: row.status === 'retired'
            ? 'محطّة متقاعدة. لم تعد الكلية تكرّمها، ومن ناله يبقى له.'
            : 'مقترحة ولم تُعتمد بعد. لا تكرّم الكلية شيئًا بهذه المحطّة قبل اعتمادها، فأُدرجت هنا بدل أن تُعرض جائزةً لم تُنَلْ.',
        },
      });
      continue;
    }
    if (!rule) {
      unevaluable.push({ ...identity, reason: 'No rule in this build evaluates that code.' });
      continue;
    }

    const rows = byDefinitionId.get(row.id) || [];
    const live = rows.filter((m) => !m.revokedAt);
    const revoked = rows.filter((m) => m.revokedAt);
    const outcome = rule(ctx, def);

    for (const m of revoked) {
      withdrawn.push({
        ...identity,
        milestoneId: m.id,
        earnedOn: m.earnedOn,
        revokedAt: m.revokedAt,
        // The reason is carried, always. A withdrawal a learner cannot
        // read the reason for is a deletion wearing a status column.
        revokedReason: m.revokedReason,
        evidence: { source: m.evidenceSource, id: m.evidenceId },
      });
    }

    for (const m of live) {
      earned.push({
        ...identity,
        milestoneId: m.id,
        earnedOn: m.earnedOn,
        evidence: { source: m.evidenceSource, id: m.evidenceId },
        awardedBy: m.awardedBy,
        recordedVia: m.awardedBy ? 'staff' : 'platform',
        // Evidence moves and this file never withdraws. Where the
        // condition no longer reads as true, that is shown rather than
        // acted on — a revocation needs a person and a reason.
        evidenceStillStands: outcome.satisfied,
      });
    }

    if (live.length && !row.repeatable) continue;

    const shortfall = Number.isFinite(outcome.required) && Number.isFinite(outcome.observed)
      ? Math.max(0, outcome.required - outcome.observed)
      : null;
    const values = { observed: outcome.observed, required: outcome.required, shortfall, ...(outcome.values || {}) };
    const key = outcome.state && def.remaining[outcome.state] ? outcome.state : 'default';
    unearned.push({
      ...identity,
      progress: { observed: outcome.observed, required: outcome.required, shortfall },
      state: key,
      remaining: sentence(def.remaining[key], values),
      detail: outcome.detail || null,
    });
  }

  const approved = ctx.definitions.filter((d) => d.status === 'approved').length;
  const proposed = ctx.definitions.filter((d) => d.status === 'proposed').length;

  return {
    notice: achievementNotice(),
    learner: { userId },
    register: {
      instrument: REGISTER_INSTRUMENT.id,
      version: REGISTER_INSTRUMENT.version,
      installed: ctx.definitions.length,
      proposedByTheRegister: REGISTER.length,
      approved,
      proposed,
      retired: ctx.definitions.filter((d) => d.status === 'retired').length,
      statement: {
        en: ctx.definitions.length === 0
          ? 'The milestone register is not installed on this database, so there is nothing to be earned. This is an absence of definitions, not a record of nothing achieved.'
          : (approved === 0
            ? `${proposed} milestone${proposed === 1 ? ' is' : 's are'} proposed and none is yet adopted, so nothing is awarded under them.`
            : `${approved} of ${ctx.definitions.length} milestone definitions are adopted and in force.`),
        ar: ctx.definitions.length === 0
          ? 'سجلّ المحطّات غير منصَّب على قاعدة البيانات هذه، فلا شيء يُنال. وهذا غياب تعريفات لا سجلّ إخفاق.'
          : (approved === 0
            ? `المحطّات المقترحة ${proposed}، ولم تُعتمد منها واحدة، فلا يُمنح بها شيء.`
            : `المعتمَد النافذ ${approved} من ${ctx.definitions.length} تعريفًا للمحطّات.`),
      },
    },
    summary: {
      earned: earned.length,
      unearned: unearned.length,
      withdrawn: withdrawn.length,
      notInForce: notInForce.length,
      awardedThisRequest: sweep.awarded.length,
    },
    earned: earned.sort((a, b) => a.sequence - b.sequence),
    unearned: unearned.sort((a, b) => a.sequence - b.sequence),
    withdrawn,
    notInForce,
    unevaluable,
    computedAt: now || nowIso(),
  };
}
