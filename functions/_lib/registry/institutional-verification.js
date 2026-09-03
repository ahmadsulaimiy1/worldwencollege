/**
 * The Principle of Institutional Verification.
 *
 * ────────────────────────────────────────────────────────────────────
 * THREE LAYERS, ANSWERED SEPARATELY
 * ────────────────────────────────────────────────────────────────────
 *
 *   1. IDENTITY AUTHENTICITY  — is this the person the College awarded?
 *   2. CREDENTIAL INTEGRITY   — has this credential been altered?
 *   3. INSTITUTIONAL STANDING — what is the current status of the award?
 *
 * These are INDEPENDENT, and the reason to separate them is that they
 * genuinely disagree. A certificate can be perfectly genuine (integrity
 * intact), belong to exactly the person named on it (identity verified),
 * and still confer nothing, because the award was withdrawn last month
 * (standing: withdrawn).
 *
 * A single verdict — "valid" or "invalid" — cannot express that, and
 * every way of collapsing it misleads somebody. Call it invalid and an
 * employer concludes the document is a forgery, which is a serious
 * accusation about a real person. Call it valid and a university admits
 * a candidate on a qualification the College has withdrawn.
 *
 * So every layer answers for itself, and the summary never averages
 * them.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT "VERIFIED" IS ALLOWED TO MEAN
 * ────────────────────────────────────────────────────────────────────
 * Only that a check ran and passed. Where a check cannot run — because
 * the award predates signing, or because the signing infrastructure is
 * still in development mode — the layer says so in those words rather
 * than reporting a pass it did not earn. `state` carries the machine
 * answer and `statement` carries the sentence a person reads, and they
 * are generated together so they cannot disagree.
 *
 * ────────────────────────────────────────────────────────────────────
 * TWO LANGUAGES, ONE ANSWER
 * ────────────────────────────────────────────────────────────────────
 * Every sentence a person reads is composed here, in both languages,
 * and travels together: `label`/`labelAr`, `statement`/`statementAr`,
 * `detail`/`detailAr`. The page selects; it does not translate.
 *
 * This is not decoration. /ar/verify.html is the page an Arabic
 * employer opens from a QR code on a certificate, and it used to answer
 * an Arabic question with "Verified — award in good standing" and seven
 * English paragraphs about hash chains.
 */
import { verifyCode, verifyChain } from './awards.js';

const db = (env) => env.DB;

// The vocabulary. Every check resolves to exactly one of these, and an
// interface can style them without knowing what was checked.
export const STATES = {
  verified: 'The check ran and passed.',
  failed: 'The check ran and did not pass.',
  not_applicable: 'The check does not apply to this credential.',
  unavailable: 'The check could not be run.',
  development: 'The check passed against infrastructure that is not yet production-grade.',
};

export const STATES_AR = {
  verified: 'أُجري الفحص ونجح.',
  failed: 'أُجري الفحص ولم ينجح.',
  not_applicable: 'لا ينطبق هذا الفحص على هذه الشهادة.',
  unavailable: 'تعذّر إجراء الفحص.',
  development: 'نجح الفحص أمام بنيةٍ ليست بعدُ بدرجة الإنتاج.',
};

const LAYERS = ['identity', 'integrity', 'standing'];

/**
 * Isolate a value dropped into a sentence.
 *
 * A graduate's name, a date, a key id: none of them belong to the
 * language of the sentence they land in, and an Arabic statement
 * carrying a Latin name renders it with the neighbouring punctuation
 * migrating to the wrong end — "منحت الكلية هذه الشهادة لـDemonstration
 * Graduate." with the full stop on the left.
 *
 * U+2068 FIRST STRONG ISOLATE … U+2069 POP DIRECTIONAL ISOLATE is what
 * <bdi> compiles to, in plain text. It is used HERE rather than in the
 * page because the sentence is composed here: the page receives a
 * string and cannot know which part of it was data.
 */
const iso = (v) => '\u2068' + v + '\u2069';

/**
 * One check, in both languages.
 *
 * `ar` carries {label, statement, detail}; anything it omits falls back
 * to the English, which is legible where a blank would not be.
 */
function check(id, label, state, statement, detail = null, ar = {}) {
  return {
    id, label, state, statement, detail,
    labelAr: ar.label || null,
    statementAr: ar.statement || null,
    detailAr: ar.detail || null,
  };
}

/**
 * Verify a credential across all three layers.
 *
 * `code` is an award verification code. The result is deliberately
 * verbose: an employer is making a decision about a person, and a
 * verification that answers in one word gives them nothing to act on
 * when the answer is complicated.
 */
export async function institutionalVerification(env, { code, channel = 'public', now = Date.now() }) {
  const base = await verifyCode(env, { code, channel, now });

  // Nothing to verify. Answered as its own shape rather than as three
  // layers of failure, because "this code is not in the register" is a
  // different statement from "this credential failed our checks".
  if (base.outcome !== 'valid' && base.outcome !== 'revoked' && base.outcome !== 'replaced') {
    return {
      found: false,
      outcome: base.outcome,
      message: base.message,
      layers: null,
    };
  }

  const award = base.award;
  const identity = [];
  const integrity = [];
  const standing = [];

  // ---- 1. IDENTITY AUTHENTICITY -------------------------------------
  identity.push(check('holder', 'Graduate identity', 'verified',
    `The College conferred this award on ${iso(award.holderName)}.`,
    award.holderName,
    { label: 'هويّة الخرّيج', statement: `منحت الكلية هذه الشهادة لـ${iso(award.holderName)}.` }));
  identity.push(check('register', 'Graduate Register entry', 'verified',
    'This award has an entry in the Graduate Register.',
    award.verificationCode,
    { label: 'القيد في سجل الخرّيجين', statement: 'لهذه الشهادة قيدٌ في سجل خرّيجي الكلية.' }));
  identity.push(check('conferred', 'Conferral date', 'verified',
    `Conferred on ${iso(award.conferredOn)}.`, award.conferredOn,
    { label: 'تاريخ المنح', statement: `مُنحت في ${iso(award.conferredOn)}.` }));

  // ---- 2. CREDENTIAL INTEGRITY --------------------------------------
  // The register chain. This is the check that would catch a record
  // altered in the database itself, which no signature on a document
  // can detect.
  const chain = await verifyChain(env);
  integrity.push(chain.intact
    ? check('chain', 'Register chain', 'verified',
      `The Graduate Register's hash chain is intact across all ${chain.checked} entries.`,
      `${chain.checked} entries`,
      { label: 'سلسلة السجل',
        statement: `سلسلة بصمات سجل الخرّيجين سليمة عبر قيوده كلّها، وعددها ${chain.checked}.`,
        detail: `${chain.checked} قيدًا` })
    : check('chain', 'Register chain', 'failed',
      'The Graduate Register\'s hash chain does not verify. This is an institutional '
      + 'fault, not a fault in this credential, and the College is required to investigate it.',
      chain.brokenAt || null,
      { label: 'سلسلة السجل',
        statement: 'سلسلة بصمات سجل الخرّيجين لا تتحقّق. وهذا خلل مؤسسي لا خلل في هذه '
          + 'الشهادة، والكلية ملزمة بالتحقيق فيه.' }));

  // The signature. Reported honestly against the state of the signing
  // infrastructure — the P2.1 decision requires that a development-mode
  // signature never claims production-grade assurance.
  //
  // Taken from verifyCode()'s own result rather than looked up again:
  // awardSignature() is private to awards.js, and a second lookup here
  // would be a second implementation of "is this signed", free to
  // disagree with the first.
  const sig = base.signature || { present: false };
  if (!sig.present) {
    integrity.push(check('signature', 'Digital signature', 'not_applicable',
      sig.message || 'This award predates the College\'s credential signing and carries no signature. '
      + 'It remains verifiable against the Graduate Register.',
      null,
      { label: 'التوقيع الرقمي',
        statement: 'هذه الشهادة أسبق من توقيع الكلية الرقمي للشهادات فلا توقيع عليها، '
          + 'وتبقى قابلة للتحقّق أمام سجل الخرّيجين.' }));
  } else if (!sig.valid) {
    integrity.push(check('signature', 'Digital signature', 'failed',
      'The digital signature on this credential does not verify against the College\'s published key.',
      null,
      { label: 'التوقيع الرقمي',
        statement: 'التوقيع الرقمي على هذه الشهادة لا يتحقّق أمام مفتاح الكلية المنشور.' }));
  } else if (sig.mode !== 'production') {
    // Named as its own state, not folded into 'verified'. A verifier is
    // entitled to know the difference and to weigh it themselves.
    integrity.push(check('signature', 'Digital signature', 'development',
      'The signature verifies against the College\'s published key. That key is held in '
      + 'development key management, not a production hardware security module, so the '
      + 'signature does not yet carry production-grade assurance. The Graduate Register '
      + 'remains the authoritative record.',
      sig.kid || null,
      { label: 'التوقيع الرقمي',
        statement: 'يتحقّق التوقيع أمام مفتاح الكلية المنشور. غير أنّ هذا المفتاح محفوظ في '
          + 'إدارة مفاتيح تطويرية لا في وحدة أمان عتادية إنتاجية، فلا يحمل التوقيع بعدُ ضمانَ '
          + 'درجة الإنتاج. ويبقى سجل الخرّيجين هو السجل المعتمد.' }));
  } else {
    integrity.push(check('signature', 'Digital signature', 'verified',
      'The digital signature verifies against the College\'s published key.', sig.kid || null,
      { label: 'التوقيع الرقمي',
        statement: 'يتحقّق التوقيع الرقمي أمام مفتاح الكلية المنشور.' }));
  }

  integrity.push(check('code', 'Verification code', 'verified',
    'The code is well formed and its check character is correct.', award.verificationCode,
    { label: 'رمز التحقّق', statement: 'الرمز سليم البنية، ورمز تدقيقه صحيح.' }));

  // ---- 3. INSTITUTIONAL STANDING ------------------------------------
  // The layer that can disagree with the other two, which is the whole
  // reason they are separated.
  if (base.outcome === 'valid') {
    standing.push(check('standing', 'Current standing', 'verified',
      'This award is current. The College recognises it today.', 'Active',
      { label: 'الحال الراهن', statement: 'هذه الشهادة قائمة، والكلية تعترف بها اليوم.',
        detail: 'قائمة' }));
  } else if (base.outcome === 'revoked') {
    standing.push(check('standing', 'Current standing', 'failed',
      'This award has been WITHDRAWN by the College and confers nothing. The certificate '
      + 'itself may be entirely genuine; it is the award that no longer stands.',
      'Withdrawn',
      { label: 'الحال الراهن',
        statement: 'سحبت الكلية هذه الشهادة فلم تعد تمنح شيئًا. وقد تكون الوثيقة نفسها صحيحة '
          + 'تمامًا؛ وإنما الشهادة هي التي لم تعد قائمة.',
        detail: 'مسحوبة' }));
  } else {
    standing.push(check('standing', 'Current standing', 'failed',
      'This award has been SUPERSEDED by a later one — usually a correction. The replacement '
      + 'is the credential that stands.', 'Superseded',
      { label: 'الحال الراهن',
        statement: 'استُبدلت هذه الشهادة بأخرى لاحقة، وهي في الغالب تصويب. والبديلة هي '
          + 'الشهادة القائمة.',
        detail: 'مُستبدَلة' }));
  }

  // ---- The award's own meaning --------------------------------------
  const definition = await db(env).prepare(
    `SELECT official_title AS officialTitle, post_nominal AS postNominal, cefr, standing,
            academic_purpose AS academicPurpose, graduate_profile AS graduateProfile,
            learning_outcomes AS learningOutcomes
       FROM award_definitions WHERE level_id = ?`).bind(award.level.id).first();

  const layers = { identity, integrity, standing };

  return {
    found: true,
    outcome: base.outcome,
    award,
    // The authoritative description, from the institutional data model
    // rather than composed here — so the certificate, the profile, this
    // page and the API all say the same thing.
    definition: definition || null,
    layers,
    summary: summarise(layers),
    checkedAt: new Date(now).toISOString(),
  };
}

/**
 * A summary that does not average.
 *
 * `headline` is the ONE thing a verifier needs first, and it is driven
 * by standing rather than by a count of passes: an employer looking at
 * a withdrawn award needs to see "withdrawn" before anything else, no
 * matter how many integrity checks passed.
 */
export function summarise(layers) {
  const all = LAYERS.flatMap((l) => layers[l]);
  const failed = all.filter((c) => c.state === 'failed');
  const standingFailed = layers.standing.some((c) => c.state === 'failed');

  return {
    counts: {
      verified: all.filter((c) => c.state === 'verified').length,
      development: all.filter((c) => c.state === 'development').length,
      failed: failed.length,
      notApplicable: all.filter((c) => c.state === 'not_applicable').length,
      unavailable: all.filter((c) => c.state === 'unavailable').length,
      total: all.length,
    },
    // Standing first, always. The commonest dangerous misreading is a
    // withdrawn award whose paperwork is impeccable.
    headline: standingFailed
      ? layers.standing.find((c) => c.state === 'failed').detail
      : (failed.length ? 'Checks failed' : 'Verified'),
    headlineAr: standingFailed
      ? layers.standing.find((c) => c.state === 'failed').detailAr
      : (failed.length ? 'فحوص لم تنجح' : 'مُتحقَّق منها'),
    // The machine answer, so an interface never has to compare a
    // HEADLINE — a sentence, and now a sentence in two languages —
    // against a literal string to decide how to colour itself.
    verdict: standingFailed ? 'standing_failed' : (failed.length ? 'failed' : 'verified'),
    // Said in words, because "3 of 7" tells a verifier nothing about
    // what to do.
    statement: standingFailed
      ? 'This credential is authentic but the award it records does not currently stand. '
        + 'Read the standing section before relying on it.'
      : failed.length
        ? 'One or more checks did not pass. Each is explained below.'
        : 'Every check the College can run against this credential has passed.',
    statementAr: standingFailed
      ? 'هذه الوثيقة صحيحة، غير أنّ الشهادة التي تسجّلها ليست قائمة اليوم. اقرأ قسم الحال '
        + 'قبل الاعتماد عليها.'
      : failed.length
        ? 'لم ينجح فحصٌ أو أكثر. وكلٌّ منها مشروح أدناه.'
        : 'نجح كلُّ فحصٍ تستطيع الكلية إجراءه على هذه الوثيقة.',
  };
}
