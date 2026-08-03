// functions/_lib/registry/awards.js — the Graduate Register.
//
// The Register is the College's permanent academic record, and every
// other credential artefact derives its worth from being checkable
// against it. So these assertions are mostly about the ways a register
// stops being trustworthy: a record edited after the fact, a code that
// can be guessed or mistyped into somebody else's award, a withdrawal
// that quietly vanishes, and a verification response that leaks more
// than the certificate it verifies.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const reg = await import(loadUrl('functions/_lib/registry/awards.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const T0 = Date.parse('2027-03-14T10:00:00.000Z');

function freshEnv(n = 3) {
  const env = { DB: makeD1(schema) };
  for (let i = 1; i <= n; i++) {
    env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
      VALUES ('usr_${i}','clerk','c_${i}','g${i}@example.com','student')`).bind().run();
  }
  return env;
}

const AWARD = {
  levelId: 3,
  awardTitle: 'English Associate of Worldwide English College',
  postNominal: 'AsWEC',
  cefr: 'B1',
  credits: 20,
  tqtHours: 200,
  holderName: 'Demonstration Graduate',
};

// ---------------------------------------------------------------------
// Verification codes: unguessable, transcribable, self-checking
// ---------------------------------------------------------------------
{
  const codes = new Set();
  for (let i = 0; i < 500; i++) codes.add(reg.newVerificationCode());
  check('Codes are unique across five hundred draws', codes.size === 500, codes.size);

  const code = reg.newVerificationCode();
  check('...formatted for reading aloud from a printed certificate',
    /^WEC-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{5}$/.test(code), code);
  check('...and contain no glyph anyone confuses when transcribing',
    !/[01OIL U]/.test(code.replace(/^WEC-/, '').replace(/-/g, '')), code);

  check('A code round-trips through the parser', reg.parseCode(code).code === code);
  check('...in lower case', reg.parseCode(code.toLowerCase()).code === code);
  check('...without its dashes', reg.parseCode(code.replace(/-/g, '')).code === code);
  check('...with stray whitespace', reg.parseCode('  ' + code + ' ').code === code);
  check('...and without the WEC prefix at all', reg.parseCode(code.replace(/^WEC-/, '')).code === code);
  // O/0 and I/L/1 are excluded from the alphabet so they never appear in
  // a real code. A code containing one was mistyped, and there is no
  // correct substitution — guessing could resolve to a stranger's award,
  // which is worse than asking the checker to look again.
  check('...but a code containing an excluded glyph is rejected, not guessed at',
    reg.parseCode(code.replace(/^WEC-/, '').replace(/-/g, '').replace(/^./, '0')).ok === false);

  // A typo must fail, not resolve to a stranger's award. That is the
  // whole reason for a check character — it is not security, it is
  // preventing the worst possible wrong answer.
  const body = code.replace(/^WEC-/, '').replace(/-/g, '');
  const swapped = body.slice(0, 3) + body[4] + body[3] + body.slice(5);
  check('A transposed pair of characters is rejected, not silently resolved',
    reg.parseCode('WEC-' + swapped).ok === false, swapped);

  const altered = (body[0] === 'A' ? 'B' : 'A') + body.slice(1);
  check('A single wrong character is rejected', reg.parseCode('WEC-' + altered).ok === false);
  check('Nonsense is rejected', reg.parseCode('hello').ok === false);
  check('An empty code is rejected', reg.parseCode('').ok === false);
  check('A non-string is rejected without throwing', reg.parseCode(null).ok === false);
}

// ---------------------------------------------------------------------
// Conferral and the chain
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const a1 = await reg.conferAward(env, { userId: 'usr_1', ...AWARD, now: T0 });
  check('An award is conferred with a verification code', /^WEC-/.test(a1.verification_code), a1.verification_code);
  check('...chained from the genesis marker as the first record',
    a1.prevDigest === reg.GENESIS, a1.prevDigest);
  check('...carrying a digest', /^[0-9a-f]{64}$/.test(a1.digest), a1.digest);

  const a2 = await reg.conferAward(env, { userId: 'usr_2', ...AWARD, now: T0 + 1000 });
  check('The next award chains from the previous one', a2.prevDigest === a1.digest);

  const chain = await reg.verifyChain(env);
  check('The chain verifies intact', chain.intact === true && chain.checked === 2, JSON.stringify(chain));
}

// ---------------------------------------------------------------------
// THE ASSERTION THE WHOLE DESIGN EXISTS FOR
// ---------------------------------------------------------------------
// A register that can be edited without trace is a register nobody
// should trust. Alter a conferred record directly in the database — the
// way a compromise or a well-meaning correction would — and the chain
// must find it, and name the row.
{
  const env = freshEnv();
  const a1 = await reg.conferAward(env, { userId: 'usr_1', ...AWARD, now: T0 });
  await reg.conferAward(env, { userId: 'usr_2', ...AWARD, now: T0 + 1000 });
  await reg.conferAward(env, { userId: 'usr_3', ...AWARD, now: T0 + 2000 });
  check('Precondition: three awards, chain intact', (await reg.verifyChain(env)).intact === true);

  // Somebody upgrades a Pass to a Distinction, directly in the table.
  env.DB.prepare(`UPDATE awards SET honour = 'distinction' WHERE id = '${a1.id}'`).bind().run();

  const broken = await reg.verifyChain(env);
  check('Editing a conferred record breaks the chain', broken.intact === false, JSON.stringify(broken));
  check('...and names the exact record that was altered', broken.brokenAt === a1.id, broken.brokenAt);
  check('...with a reason a registrar can act on',
    /altered since it was conferred/i.test(broken.reason || ''), broken.reason);
}

{
  // Deleting a record from the middle is the other way a register is
  // quietly rewritten, and it must be just as visible.
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_1', ...AWARD, now: T0 });
  const a2 = await reg.conferAward(env, { userId: 'usr_2', ...AWARD, now: T0 + 1000 });
  const a3 = await reg.conferAward(env, { userId: 'usr_3', ...AWARD, now: T0 + 2000 });
  env.DB.prepare(`DELETE FROM awards WHERE id = '${a2.id}'`).bind().run();

  const broken = await reg.verifyChain(env);
  check('Removing a record from the middle breaks the chain', broken.intact === false);
  check('...at the record that no longer follows anything',
    broken.brokenAt === a3.id, broken.brokenAt);
  check('...saying a record was inserted, removed or reordered',
    /inserted, removed or reordered/i.test(broken.reason || ''), broken.reason);
}

{
  // The chain is a chain, not a tree. Two conferrals cannot both extend
  // the same head — the database refuses the second, so integrity rests
  // on a constraint rather than on requests not overlapping.
  const env = freshEnv();
  const a1 = await reg.conferAward(env, { userId: 'usr_1', ...AWARD, now: T0 });
  const e = await throws(() => env.DB.prepare(
    `INSERT INTO awards (id,user_id,level_id,award_title,post_nominal,cefr,honour,credits,tqt_hours,
       holder_name,conferred_on,verification_code,status,public_consent,prev_digest,digest,created_at)
     VALUES ('awd_forged','usr_2',3,'x','x','B1','pass',20,200,'Forged','2027-03-14','WEC-AAAA-AAAA-AAAAA',
       'conferred',0,'${reg.GENESIS}','deadbeef','2027-03-14T10:00:00.000Z')`).bind().run());
  check('A second award cannot chain from the same predecessor', !!e, e && e.message.slice(0, 60));
  check('...leaving the real chain intact', (await reg.verifyChain(env)).intact === true);
}

// ---------------------------------------------------------------------
// Verification: what a checker gets, and what they must not
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const a = await reg.conferAward(env, {
    userId: 'usr_1', ...AWARD, honour: 'distinction',
    citation: 'In recognition of a structured presentation defended under questioning.',
    now: T0,
  });

  const good = await reg.verifyCode(env, { code: a.verification_code, now: T0 + 60000 });
  check('A valid code verifies', good.outcome === 'valid', good.outcome);
  check('...naming the holder and the award',
    good.award.holderName === 'Demonstration Graduate'
    && /English Associate/.test(good.award.awardTitle), JSON.stringify(good.award).slice(0, 80));
  check('...with the honour in words a reader understands',
    good.award.honourLabel === 'Distinction', good.award.honourLabel);
  check('...the CEFR band, credits and qualification time',
    good.award.cefr === 'B1' && good.award.credits === 20 && good.award.tqtHours === 200);

  // A verification response carrying more than the certificate asserts
  // would be a data leak with a padlock icon on it.
  const keys = Object.keys(good.award);
  check('The response carries no email, no marks, no internal identifiers',
    !keys.some((k) => /email|mark|score|progress|userId|user_id|id$/i.test(k)), keys.join(', '));

  const mistyped = await reg.verifyCode(env, { code: 'WEC-AAAA-BBBB-CCCCC', now: T0 });
  check('A well-formed but unknown code says so plainly',
    ['not_found', 'malformed'].includes(mistyped.outcome) && mistyped.award === null, mistyped.outcome);
  check('...with a message that tells the checker what to do',
    typeof mistyped.message === 'string' && mistyped.message.length > 20, mistyped.message);
}

// ---------------------------------------------------------------------
// Revocation is visible, replacement points forward
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_1', ...AWARD, now: T0 });
  await reg.revokeAward(env, { awardId: a.id, reason: 'Conferred in error following an integrity finding.', now: T0 + 86400000 });

  const res = await reg.verifyCode(env, { code: a.verification_code, now: T0 + 90000000 });
  check('A revoked award still resolves — it does not vanish', res.award !== null);
  check('...and says it was withdrawn', res.outcome === 'revoked' && res.award.status === 'revoked', res.outcome);
  check('...with the date and the reason', !!res.award.revokedAt && /integrity finding/.test(res.award.revokedReason || ''));

  const noReason = await throws(() => reg.revokeAward(env, { awardId: a.id, reason: '' }));
  check('Withdrawal without a reason is refused', noReason && noReason.name === 'ValidationError');
}

{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_1', ...AWARD, now: T0 });
  const { replacement } = await reg.replaceAward(env, {
    awardId: a.id, reason: 'Holder name corrected at the graduate\'s request.',
    changes: { holderName: 'Demonstration Graduate-Smith' }, now: T0 + 86400000,
  });

  const old = await reg.verifyCode(env, { code: a.verification_code, now: T0 + 90000000 });
  check('An old code resolves to a replaced award rather than a dead end', old.outcome === 'replaced');
  check('...and points at the current certificate, so the checker is not stranded',
    old.award.replacementCode === replacement.verification_code, old.award.replacementCode);

  const current = await reg.verifyCode(env, { code: replacement.verification_code, now: T0 + 90000000 });
  check('The replacement verifies as valid', current.outcome === 'valid');
  check('...with the correction applied', current.award.holderName === 'Demonstration Graduate-Smith');
  check('...and the original conferral date preserved, because that did not change',
    current.award.conferredOn === old.award.conferredOn, current.award.conferredOn);
  check('The chain survives a replacement', (await reg.verifyChain(env)).intact === true);
}

// ---------------------------------------------------------------------
// The audit log records the check, never the checker
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const a = await reg.conferAward(env, { userId: 'usr_1', ...AWARD, now: T0 });
  await reg.verifyCode(env, { code: a.verification_code, now: T0 + 1000 });
  await reg.verifyCode(env, { code: a.verification_code, channel: 'qr', now: T0 + 2000 });
  await reg.verifyCode(env, { code: 'WEC-ZZZZ-ZZZZ-ZZZZZ', now: T0 + 3000 });

  const summary = await reg.verificationSummary(env, { awardId: a.id });
  check('Verifications are counted for the award', summary.total === 2, summary.total);
  check('...with the most recent time', !!summary.lastAt);

  const cols = env.DB.prepare("SELECT name FROM pragma_table_info('award_verifications')").bind().all().results.map((r) => r.name);
  check('The log holds nothing that identifies the checker',
    !cols.some((c) => /ip|agent|referer|referrer|email|user_id|session/i.test(c)), cols.join(', '));

  // A run of failed lookups is the signature of somebody walking the
  // register, and being able to see that is worth the row.
  const failed = env.DB.prepare("SELECT COUNT(*) AS n FROM award_verifications WHERE outcome != 'valid'").bind().first();
  check('Failed lookups are recorded too, so enumeration is visible', failed.n >= 1, failed.n);
}

// ---------------------------------------------------------------------
// Consent scopes the browsable register, never verification
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const priv = await reg.conferAward(env, { userId: 'usr_1', ...AWARD, holderName: 'Private Graduate', now: T0 });
  await reg.conferAward(env, { userId: 'usr_2', ...AWARD, holderName: 'Listed Graduate', publicConsent: true, now: T0 + 1000 });

  const list = await reg.publicRegister(env);
  check('The browsable register lists only graduates who consented',
    list.count === 1 && list.entries[0].holderName === 'Listed Graduate', JSON.stringify(list.entries));

  // The decisive one: a code is something the graduate chose to hand
  // somebody. Refusing it because they declined to be LISTED would
  // defeat the entire purpose of the system.
  const byCode = await reg.verifyCode(env, { code: priv.verification_code, now: T0 + 5000 });
  check('...but a code still verifies for a graduate who is not listed',
    byCode.outcome === 'valid' && byCode.award.holderName === 'Private Graduate', byCode.outcome);
}

// ---------------------------------------------------------------------
// Award history — every level, because every level is an achievement
// ---------------------------------------------------------------------
// The Register covers ALL award holders, not only Laureates. A register
// listing only the summit tells every other graduate their award was not
// worth recording.
{
  const env = freshEnv();
  await reg.conferAward(env, { userId: 'usr_1', ...AWARD, levelId: 1, awardTitle: 'English Aspirant of Worldwide English College', postNominal: 'ApWEC', cefr: 'A1', now: T0 });
  await reg.conferAward(env, { userId: 'usr_1', ...AWARD, levelId: 2, awardTitle: 'English Candidate of Worldwide English College', postNominal: 'CnWEC', cefr: 'A2', now: T0 + 1000 });
  await reg.conferAward(env, { userId: 'usr_1', ...AWARD, levelId: 3, honour: 'merit', now: T0 + 2000 });

  const hist = await reg.awardHistory(env, { userId: 'usr_1' });
  check('A graduate\'s history holds every award, not only the highest', hist.awards.length === 3, hist.awards.length);
  check('...in level order', hist.awards.map((a) => a.level.id).join(',') === '1,2,3');
  check('...naming the highest currently held', hist.highest.postNominal === 'AsWEC', hist.highest.postNominal);
  check('...with credits totalled across the Ascent', hist.creditsTotal === 60, hist.creditsTotal);
  check('...and qualification time totalled', hist.tqtHoursTotal === 600, hist.tqtHoursTotal);
}

// ---------------------------------------------------------------------
// Conferral refuses what it should
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const noName = await throws(() => reg.conferAward(env, { userId: 'usr_1', ...AWARD, holderName: '' }));
  check('An award with no holder name is refused — a certificate names a person',
    noName && noName.name === 'ValidationError', noName && noName.name);

  const badHonour = await throws(() => reg.conferAward(env, { userId: 'usr_1', ...AWARD, honour: 'summa' }));
  check('An invented honour is refused', badHonour && badHonour.name === 'ValidationError');

  const ghost = await throws(() => reg.conferAward(env, { userId: 'usr_nobody', ...AWARD }));
  check('An award to a person who does not exist is refused', ghost && ghost.name === 'NotFoundError');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
