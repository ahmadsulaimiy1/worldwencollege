// Run with: node --experimental-sqlite tests/announcements.test.mjs
//
// ANNOUNCEMENTS, AND THE THREE THINGS THAT WOULD GO WRONG SILENTLY.
//
// Most of what is asserted below is ordinary: a validator refuses a bad
// value, a status moves, a row survives a withdrawal. The file is long
// because three of the failures worth catching leave everything else
// working perfectly.
//
//  1. THE AUDIENCE THAT WIDENS BY ONE ROW. `audience_scope = 'learner'`
//     makes an announcement a private letter. A predicate that is
//     slightly too generous does not throw, does not slow anything down,
//     and shows one learner what the Registrar wrote to another. So the
//     scoping is asserted from BOTH ends of every scope — the person who
//     must receive it does, and every other fixture person does not —
//     including the learner who withdrew, the learner at the wrong level,
//     and the member of staff with no enrolment at all. The read-receipt
//     write is asserted the same way, because it takes an id from the
//     caller and would otherwise report which private notices exist by
//     which ids it accepts.
//
//  2. THE BADGE THAT DISAGREES WITH THE LIST. The unread count and the
//     feed are separate statements over one shared predicate. The count
//     is therefore asserted against a page size SMALLER than the number
//     of unread notices — the case where a count taken from the returned
//     rows would look right in every hand test and be wrong in
//     production.
//
//  3. THE ARABIC PAGE SHOWING ENGLISH WITHOUT SAYING SO. `announcements`
//     has no language column, so both editions live in `body` behind an
//     encoding. Two properties of that encoding are load-bearing and
//     neither is visible in a payload: a row written by anything other
//     than this code still decodes, and the primary body is the literal
//     start of the column so a raw render shows prose. Both are asserted
//     against bytes, not through the API. And every served edition is
//     asserted to declare its own language, direction and fallback — an
//     untranslated notice that does not say it is untranslated is
//     indistinguishable, on the page, from one that failed to load.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const lib = await import(loadUrl('functions/_lib/comms/announcements.js'));
const {
  AUDIENCE_SCOPES, ANNOUNCEMENT_STATUSES, LANGUAGES, DIRECTION,
  encodeEditions, decodeEditions, chooseEdition,
  learnerFeed, markRead, staffList, staffAnnouncement,
  createAnnouncement, updateAnnouncement, withdrawAnnouncement,
  parseLimit, parseLanguage,
} = lib;
const feedRoute = await import(loadUrl('functions/api/announcements/index.js'));
const staffRoute = await import(loadUrl('functions/api/staff/announcements.js'));

const schemaText = readFileSync(new URL('sql/schema.sql', `file://${ROOT}/`), 'utf8');
const env = { DB: makeD1(schemaText), CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
const sql = (text, ...args) => env.DB.prepare(text).bind(...args).run();
const one = (text, ...args) => env.DB.prepare(text).bind(...args).first();

const NOW = '2026-08-20T12:00:00.000Z';
const PAST = '2026-08-01T00:00:00.000Z';
const FUTURE = '2026-12-01T00:00:00.000Z';

/** Collect the field map off a ValidationError without swallowing a pass. */
async function refusal(fn) {
  try { await fn(); return { name: 'no error', fields: {} }; } catch (e) { return { name: e.name, fields: e.fields || {}, message: e.message, status: e.httpStatus }; }
}

// ---------------------------------------------------------------------
// 0 · THE VOCABULARY IS THE SCHEMA'S
// ---------------------------------------------------------------------
// Restating a CHECK constraint in JavaScript is how a 422 becomes a 500
// eighteen months later. These read the constraint text off disk.
const announcementsDdl = schemaText.slice(
  schemaText.indexOf('CREATE TABLE announcements'),
  schemaText.indexOf('CREATE INDEX idx_announcements_live'),
);
check('audience scopes are exactly the schema\'s three, with no cohort',
  AUDIENCE_SCOPES.every((s) => announcementsDdl.includes(`'${s}'`))
  && AUDIENCE_SCOPES.length === 3 && !AUDIENCE_SCOPES.includes('cohort'),
  AUDIENCE_SCOPES.join(', '));
check('statuses are exactly the schema\'s three',
  announcementsDdl.includes("CHECK (status IN ('draft','published','withdrawn'))")
  && ANNOUNCEMENT_STATUSES.join(',') === 'draft,published,withdrawn');
check('the languages are the ones users.preferred_language will accept',
  schemaText.includes("preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','ar'))")
  && LANGUAGES.join(',') === 'en,ar');
check('the withdrawal reason is mandatory in the table, not only in the code',
  announcementsDdl.includes("CHECK (status != 'withdrawn' OR (withdrawn_at IS NOT NULL AND withdrawn_reason IS NOT NULL))"));
check('a level audience is defined by the schema\'s own idea of a live enrolment',
  schemaText.includes('CREATE UNIQUE INDEX idx_enrolments_one_live_per_level')
  && /idx_enrolments_one_live_per_level[\s\S]{0,120}WHERE status != 'withdrawn'/.test(schemaText));

// ---------------------------------------------------------------------
// 1 · TWO EDITIONS IN TWO COLUMNS
// ---------------------------------------------------------------------
const enOnly = encodeEditions({ language: 'en', title: 'Fees', body: 'The fee deadline moves.' }, null);
check('an English-only notice puts its real title in the title column',
  enOnly.title === 'Fees');
check('and its body begins with the prose itself, so a raw render is readable',
  enOnly.body.startsWith('The fee deadline moves.'), JSON.stringify(enOnly.body));

const both = encodeEditions(
  { language: 'en', title: 'Fees', body: 'The fee deadline moves.' },
  { language: 'ar', title: 'الرسوم', body: 'تم تغيير موعد سداد الرسوم.' },
);
check('a bilingual notice still leads with the primary prose, unaltered',
  both.body.startsWith('The fee deadline moves.'));
check('and the second edition rides behind ASCII RS, which no keyboard produces',
  both.body.includes('\u001E') && both.body.includes('\u001F'));

const decoded = decodeEditions(both.title, both.body);
check('both editions come back exactly as they went in',
  decoded.primary.language === 'en' && decoded.primary.title === 'Fees'
  && decoded.primary.body === 'The fee deadline moves.'
  && decoded.alternate.language === 'ar' && decoded.alternate.title === 'الرسوم'
  && decoded.alternate.body === 'تم تغيير موعد سداد الرسوم.');

const arPrimary = encodeEditions({ language: 'ar', title: 'الرسوم', body: 'نص عربي.' }, null);
const arDecoded = decodeEditions(arPrimary.title, arPrimary.body);
check('an Arabic-only notice is publishable and remembers that it is Arabic',
  arDecoded.primary.language === 'ar' && arDecoded.alternate === null);

const legacy = decodeEditions('Old title', 'A body written before this encoding existed.');
check('a plain body with no separator still decodes, as a single English edition',
  legacy.primary.language === 'en' && legacy.alternate === null
  && legacy.primary.body === 'A body written before this encoding existed.');

const arBodyWithUS = encodeEditions(
  { language: 'en', title: 'T', body: 'B' },
  { language: 'ar', title: 'ع', body: 'سطر\nآخر' },
);
check('a multi-line translation survives the encoding intact',
  decodeEditions(arBodyWithUS.title, arBodyWithUS.body).alternate.body === 'سطر\nآخر');

const servedAr = chooseEdition(decoded, 'ar');
check('a reader who asked for Arabic gets the Arabic, right-to-left, with no fallback flag',
  servedAr.language === 'ar' && servedAr.direction === 'rtl' && servedAr.fallback === false
  && servedAr.body === 'تم تغيير موعد سداد الرسوم.');

const servedFallback = chooseEdition(decodeEditions(enOnly.title, enOnly.body), 'ar');
check('a reader who asked for Arabic and cannot have it is TOLD, not silently given English',
  servedFallback.language === 'en' && servedFallback.direction === 'ltr'
  && servedFallback.fallback === true && servedFallback.requestedLanguage === 'ar');
check('and the payload names every language the notice actually exists in',
  servedFallback.availableLanguages.join(',') === 'en'
  && chooseEdition(decoded, 'en').availableLanguages.sort().join(',') === 'ar,en');
check('direction is published for both languages so no page has to guess',
  DIRECTION.en === 'ltr' && DIRECTION.ar === 'rtl');

// ---------------------------------------------------------------------
// 2 · FIXTURES — one College, six people, five audiences
// ---------------------------------------------------------------------
for (const [id, sub, role, lang, name] of [
  ['usr_registrar', 'sub_registrar', 'staff', 'en', 'Registry Office'],
  ['usr_tutor', 'sub_tutor', 'staff', 'en', 'Tutor Desk'],
  ['usr_admin', 'sub_admin', 'admin', 'en', 'Administration'],
  ['usr_amina', 'sub_amina', 'student', 'ar', 'Amina'],
  ['usr_ben', 'sub_ben', 'student', 'en', 'Ben'],
  ['usr_carla', 'sub_carla', 'student', 'en', 'Carla'],
  ['usr_dara', 'sub_dara', 'student', 'en', 'Dara'],
]) {
  sql(`INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role, preferred_language, preferred_name)
       VALUES (?, 'clerk', ?, ?, 1, ?, ?, ?)`, id, sub, `${id}@example.com`, role, lang, name);
}

// Amina studies Level 3 and is active. Ben finished Level 3 and has not
// yet paid for Level 4 — the person an 'active only' predicate loses.
// Carla is at Level 5. Dara withdrew from Level 3 and is no longer
// addressed by it.
sql(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_a','usr_amina',3,'active',?)`, PAST);
sql(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_b3','usr_ben',3,'completed',?)`, PAST);
sql(`INSERT INTO enrolments (id, user_id, level_id, status) VALUES ('enr_b4','usr_ben',4,'pending_payment')`);
sql(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_c','usr_carla',5,'active',?)`, PAST);
sql(`INSERT INTO enrolments (id, user_id, level_id, status) VALUES ('enr_d','usr_dara',3,'withdrawn')`);

const registrar = one("SELECT * FROM users WHERE id='usr_registrar'");
const tutor = one("SELECT * FROM users WHERE id='usr_tutor'");
const admin = one("SELECT * FROM users WHERE id='usr_admin'");
const amina = one("SELECT * FROM users WHERE id='usr_amina'");
const ben = one("SELECT * FROM users WHERE id='usr_ben'");
const carla = one("SELECT * FROM users WHERE id='usr_carla'");
const dara = one("SELECT * FROM users WHERE id='usr_dara'");

// ---------------------------------------------------------------------
// 3 · AUTHORING — and what the College will not let staff write
// ---------------------------------------------------------------------
const institution = await createAnnouncement(env, {
  actor: registrar,
  now: NOW,
  body: {
    language: 'en',
    title: 'Registry opening hours',
    body: 'The Registry answers written enquiries every working day.',
    translation: { language: 'ar', title: 'ساعات عمل السجل', body: 'يجيب السجل على الاستفسارات كل يوم عمل.' },
    audienceScope: 'institution',
    status: 'published',
    publishFrom: PAST,
    pinned: true,
  },
});
check('a bilingual institution-wide notice is authored and published',
  institution.status === 'published' && institution.audience.scope === 'institution'
  && institution.pinned === true && institution.availableLanguages.sort().join(',') === 'ar,en');
check('the author is the session, recorded by name',
  institution.author.id === 'usr_registrar' && institution.author.name === 'Registry Office');
check('publishing stamps published_at, which the table will not do without',
  institution.publishedAt === NOW);

const levelThree = await createAnnouncement(env, {
  actor: tutor, now: NOW,
  body: {
    language: 'en', title: 'Level III speaking clinic',
    body: 'The Thursday clinic moves to Friday for four weeks.',
    audienceScope: 'level', levelId: 3, status: 'published', publishFrom: PAST,
  },
});
check('a level notice is authored against a real level', levelThree.audience.scope === 'level'
  && levelThree.audience.levelId === 3 && levelThree.audience.levelRoman === 'III');
check('an English-only notice is publishable and says so',
  levelThree.availableLanguages.join(',') === 'en' && levelThree.translation === null);

const levelFive = await createAnnouncement(env, {
  actor: tutor, now: NOW,
  body: {
    language: 'en', title: 'Level V dissertation dates', body: 'Submission windows are confirmed.',
    audienceScope: 'level', levelId: 5, status: 'published', publishFrom: PAST,
  },
});

const privateToAmina = await createAnnouncement(env, {
  actor: registrar, now: NOW,
  body: {
    language: 'ar', title: 'بخصوص ملفك', body: 'يرجى مراجعة السجل بخصوص وثيقة ناقصة.',
    audienceScope: 'learner', audienceUserId: 'usr_amina', status: 'published', publishFrom: PAST,
  },
});
check('a private notice to one learner is authored in Arabic and holds no level',
  privateToAmina.audience.scope === 'learner' && privateToAmina.audience.audienceUserId === 'usr_amina'
  && privateToAmina.audience.levelId === null && privateToAmina.primary.language === 'ar');

const draft = await createAnnouncement(env, {
  actor: registrar, now: NOW,
  body: { language: 'en', title: 'Not yet said', body: 'A draft.', audienceScope: 'institution' },
});
check('an announcement defaults to draft and carries no published_at',
  draft.status === 'draft' && draft.publishedAt === null);

const scheduled = await createAnnouncement(env, {
  actor: registrar, now: NOW,
  body: {
    language: 'en', title: 'Winter timetable', body: 'Published in advance.',
    audienceScope: 'institution', status: 'published', publishFrom: FUTURE,
  },
});
check('a notice may be published now and become live later', scheduled.publishFrom === FUTURE);

const expired = await createAnnouncement(env, {
  actor: registrar, now: NOW,
  body: {
    language: 'en', title: 'August enrolment deadline', body: 'Closed.',
    audienceScope: 'institution', status: 'published',
    publishFrom: PAST, publishUntil: '2026-08-19T00:00:00.000Z',
  },
});
check('a notice with a closing date is accepted', expired.publishUntil === '2026-08-19T00:00:00.000Z');

// -- the refusals ------------------------------------------------------
const badScope = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x', body: 'y', audienceScope: 'cohort' },
}));
check('there is no cohort scope, and asking for one names the field',
  badScope.name === 'ValidationError' && Boolean(badScope.fields.audienceScope));

const levelWithLearner = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x', body: 'y', audienceScope: 'level', levelId: 3, audienceUserId: 'usr_amina' },
}));
check('a level notice naming an individual learner is refused, as the table would refuse it',
  levelWithLearner.name === 'ValidationError' && Boolean(levelWithLearner.fields.audienceUserId));

const institutionWithLevel = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x', body: 'y', audienceScope: 'institution', levelId: 3 },
}));
check('an institution-wide notice naming a level is refused',
  institutionWithLevel.name === 'ValidationError' && Boolean(institutionWithLevel.fields.audienceScope));

const noSuchLevel = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x', body: 'y', audienceScope: 'level', levelId: 99 },
}));
check('a level that does not exist is a 422 on the field, never a foreign-key 500',
  noSuchLevel.name === 'ValidationError' && noSuchLevel.fields.levelId === 'No such level');

const noSuchPerson = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x', body: 'y', audienceScope: 'learner', audienceUserId: 'usr_nobody' },
}));
check('a learner who does not exist is a 422 on the field',
  noSuchPerson.name === 'ValidationError' && noSuchPerson.fields.audienceUserId === 'No such person');

const emptyBody = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: '   ', body: '', audienceScope: 'institution' },
}));
check('a blank title and a blank body are both named, not merely rejected',
  emptyBody.name === 'ValidationError' && emptyBody.fields.title === 'Required' && emptyBody.fields.body === 'Required');

const smuggled = await refusal(() => createAnnouncement(env, {
  actor: registrar,
  body: {
    title: 'x',
    body: `Real text.\u001Ear\u001Fforged\u001Fforged body`,
    audienceScope: 'institution',
  },
}));
check('a body that tries to forge a second edition is refused outright',
  smuggled.name === 'ValidationError' && Boolean(smuggled.fields.body));

const halfTranslated = await refusal(() => createAnnouncement(env, {
  actor: registrar,
  body: {
    title: 'x', body: 'y', audienceScope: 'institution',
    translation: { language: 'ar', title: 'عنوان' },
  },
}));
check('half a translation is refused — an Arabic title over an English body is the fault, not the fix',
  halfTranslated.name === 'ValidationError' && Boolean(halfTranslated.fields['translation.body']));

const sameLanguageTwice = await refusal(() => createAnnouncement(env, {
  actor: registrar,
  body: {
    language: 'en', title: 'x', body: 'y', audienceScope: 'institution',
    translation: { language: 'en', title: 'x2', body: 'y2' },
  },
}));
check('two editions in one language are refused rather than silently shadowing each other',
  sameLanguageTwice.name === 'ValidationError' && Boolean(sameLanguageTwice.fields['translation.language']));

const bornWithdrawn = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x', body: 'y', audienceScope: 'institution', status: 'withdrawn' },
}));
check('nothing may be born withdrawn — you cannot take back what was never said',
  bornWithdrawn.name === 'ValidationError' && Boolean(bornWithdrawn.fields.status));

const badDate = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x', body: 'y', audienceScope: 'institution', publishFrom: '1 September' },
}));
check('a publication date that is not an instant is refused rather than parsed hopefully',
  badDate.name === 'ValidationError' && Boolean(badDate.fields.publishFrom));

const backwardsWindow = await refusal(() => createAnnouncement(env, {
  actor: registrar,
  body: {
    title: 'x', body: 'y', audienceScope: 'institution',
    publishFrom: FUTURE, publishUntil: PAST,
  },
}));
check('a window that closes before it opens is refused, as the table would refuse it',
  backwardsWindow.name === 'ValidationError' && Boolean(backwardsWindow.fields.publishUntil));

const pinnedString = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x', body: 'y', audienceScope: 'institution', pinned: 'yes' },
}));
check('pinned is a boolean and "yes" is refused rather than coerced',
  pinnedString.name === 'ValidationError' && Boolean(pinnedString.fields.pinned));

const overlongTitle = await refusal(() => createAnnouncement(env, {
  actor: registrar, body: { title: 'x'.repeat(201), body: 'y', audienceScope: 'institution' },
}));
check('an overlong title is refused with the limit stated',
  overlongTitle.name === 'ValidationError' && /200/.test(overlongTitle.fields.title));

const crlf = await createAnnouncement(env, {
  actor: registrar, now: NOW,
  body: { title: 'Line endings', body: 'One.\r\nTwo.', audienceScope: 'institution' },
});
check('CRLF from a browser textarea is folded, not rejected — it carries no meaning a reader can see',
  crlf.primary.body === 'One.\nTwo.');

// ---------------------------------------------------------------------
// 4 · THE AUDIENCE, FROM BOTH ENDS
// ---------------------------------------------------------------------
const idsFor = async (user, opts = {}) => (await learnerFeed(env, { user, now: NOW, limit: 100, ...opts }))
  .announcements.map((a) => a.id);

const aminaIds = await idsFor(amina);
const benIds = await idsFor(ben);
const carlaIds = await idsFor(carla);
const daraIds = await idsFor(dara);
const registrarIds = await idsFor(registrar);

check('Amina receives the institution notice, her level\'s, and the letter written to her',
  aminaIds.includes(institution.id) && aminaIds.includes(levelThree.id)
  && aminaIds.includes(privateToAmina.id));
check('and nothing else — not Level V, not the draft, not the scheduled one, not the expired one',
  !aminaIds.includes(levelFive.id) && !aminaIds.includes(draft.id)
  && !aminaIds.includes(scheduled.id) && !aminaIds.includes(expired.id));

check('Ben, who completed Level III and has not paid for Level IV, still receives Level III',
  benIds.includes(levelThree.id));
check('and Ben does not receive the letter written to Amina',
  !benIds.includes(privateToAmina.id));

check('Carla, at Level V, receives Level V and not Level III',
  carlaIds.includes(levelFive.id) && !carlaIds.includes(levelThree.id));
check('and Carla does not receive the letter written to Amina either',
  !carlaIds.includes(privateToAmina.id));

check('Dara, who withdrew from Level III, is no longer addressed by it',
  !daraIds.includes(levelThree.id) && daraIds.includes(institution.id));

check('a member of staff has no enrolment and therefore receives institution notices only',
  registrarIds.includes(institution.id) && !registrarIds.includes(levelThree.id)
  && !registrarIds.includes(privateToAmina.id));

const aminaFeed = await learnerFeed(env, { user: amina, now: NOW, limit: 100 });
check('the pinned notice sorts first',
  aminaFeed.announcements[0].id === institution.id && aminaFeed.announcements[0].pinned === true);
check('no learner-facing announcement ever carries the author\'s email address',
  JSON.stringify(aminaFeed).indexOf('@example.com') === -1);

// -- the reader's language --------------------------------------------
check('Amina, whose account says Arabic, is served the Arabic edition of the bilingual notice',
  (() => {
    const a = aminaFeed.announcements.find((x) => x.id === institution.id);
    return a.language === 'ar' && a.direction === 'rtl' && a.fallback === false
      && a.title === 'ساعات عمل السجل';
  })());
check('and the English-only Level III notice reaches her flagged as a fallback, left-to-right',
  (() => {
    const a = aminaFeed.announcements.find((x) => x.id === levelThree.id);
    return a.language === 'en' && a.direction === 'ltr' && a.fallback === true
      && a.requestedLanguage === 'ar';
  })());
check('the feed carries the sentence an Arabic page must show over an English notice',
  typeof aminaFeed.untranslatedNotice.ar === 'string' && aminaFeed.untranslatedNotice.ar.length > 0
  && typeof aminaFeed.untranslatedNotice.en === 'string');
check('Ben, whose account says English, is served the English edition of the same notice',
  (await learnerFeed(env, { user: ben, now: NOW, limit: 100 }))
    .announcements.find((x) => x.id === institution.id).title === 'Registry opening hours');
check('and Ben may read the Arabic edition on request without changing his account',
  (await learnerFeed(env, { user: ben, now: NOW, limit: 100, language: 'ar' }))
    .announcements.find((x) => x.id === institution.id).language === 'ar');

// ---------------------------------------------------------------------
// 5 · THE BADGE
// ---------------------------------------------------------------------
check('everything addressed to Amina starts unread', aminaFeed.unread === 3);

const capped = await learnerFeed(env, { user: amina, now: NOW, limit: 1 });
check('the unread count is NOT capped by the page size — the badge would otherwise lie',
  capped.announcements.length === 1 && capped.unread === 3);

const marked = await markRead(env, { user: amina, announcementId: levelThree.id, now: NOW });
check('marking one read returns the new count so the badge settles in one round trip',
  marked.unread === 2 && marked.readAt === NOW && marked.dismissedAt === null);
check('and the feed agrees with it',
  (await learnerFeed(env, { user: amina, now: NOW, limit: 100 })).unread === 2);
check('the read notice is flagged read, in place, rather than disappearing',
  (await learnerFeed(env, { user: amina, now: NOW, limit: 100 }))
    .announcements.find((a) => a.id === levelThree.id).read === true);

const remarked = await markRead(env, { user: amina, announcementId: levelThree.id, now: '2026-08-21T09:00:00.000Z' });
check('reading it again does not move read_at — the FIRST reading is the fact',
  remarked.readAt === NOW);

const dismissed = await markRead(env, {
  user: amina, announcementId: levelThree.id, dismissed: true, now: '2026-08-21T09:00:00.000Z',
});
check('dismissing is a second, separate act and does not disturb the reading',
  dismissed.readAt === NOW && dismissed.dismissedAt === '2026-08-21T09:00:00.000Z');
check('and one receipt row is all there ever is', one(
  "SELECT COUNT(*) AS n FROM announcement_receipts WHERE user_id='usr_amina' AND announcement_id=?",
  levelThree.id).n === 1);
check('reading again after dismissal does not undo the dismissal',
  (await markRead(env, { user: amina, announcementId: levelThree.id, now: NOW }))
    .dismissedAt === '2026-08-21T09:00:00.000Z');

// -- the oracle that must not exist -----------------------------------
const benReadsAminasLetter = await refusal(() => markRead(env, {
  user: ben, announcementId: privateToAmina.id, now: NOW,
}));
check('Ben cannot mark Amina\'s private letter read — and gets 404, not 403',
  benReadsAminasLetter.name === 'NotFoundError' && benReadsAminasLetter.status === 404);
const invented = await refusal(() => markRead(env, {
  user: ben, announcementId: 'ann_invented', now: NOW,
}));
check('an id that was never issued gets the IDENTICAL answer, so the endpoint is no oracle',
  invented.name === 'NotFoundError' && invented.message === benReadsAminasLetter.message);
check('and no receipt row was written by either attempt',
  one("SELECT COUNT(*) AS n FROM announcement_receipts WHERE user_id='usr_ben'").n === 0);

const draftRead = await refusal(() => markRead(env, { user: amina, announcementId: draft.id, now: NOW }));
check('a draft cannot be marked read, because it was never said',
  draftRead.name === 'NotFoundError');
const noId = await refusal(() => markRead(env, { user: amina, now: NOW }));
check('a missing announcementId is a 422 naming the field',
  noId.name === 'ValidationError' && Boolean(noId.fields.announcementId));
const badDismissed = await refusal(() => markRead(env, {
  user: amina, announcementId: institution.id, dismissed: 'yes', now: NOW,
}));
check('dismissed is a boolean and "yes" is refused rather than coerced',
  badDismissed.name === 'ValidationError' && Boolean(badDismissed.fields.dismissed));

// ---------------------------------------------------------------------
// 6 · THE STAFF DESK
// ---------------------------------------------------------------------
const tutorBoard = await staffList(env, tutor, { limit: 100 });
check('a tutor sees the institution and level notices, which are addressed to everybody anyway',
  tutorBoard.basis === 'author'
  && tutorBoard.announcements.some((a) => a.id === institution.id)
  && tutorBoard.announcements.some((a) => a.id === levelThree.id));
check('a tutor does NOT see a private letter another member of staff wrote',
  !tutorBoard.announcements.some((a) => a.id === privateToAmina.id));
check('the author of that letter does see it',
  (await staffList(env, registrar, { limit: 100 })).announcements.some((a) => a.id === privateToAmina.id));
check('an administrator sees the board, and the payload says on what basis',
  (await staffList(env, admin, { limit: 100 })).basis === 'admin');
check('and the administrator\'s board includes the private letter',
  (await staffList(env, admin, { limit: 100 })).announcements.some((a) => a.id === privateToAmina.id));

const tutorFetchesPrivate = await refusal(() => staffAnnouncement(env, tutor, privateToAmina.id));
check('a tutor fetching that letter by id gets 404, not a copy of it',
  tutorFetchesPrivate.name === 'NotFoundError');

check('the staff view reports reach without naming who has not read it',
  (await staffAnnouncement(env, admin, levelThree.id)).readCount === 1
  && !('readers' in await staffAnnouncement(env, admin, levelThree.id)));

const filtered = await staffList(env, admin, { status: 'draft', limit: 100 });
check('the board filters by status', filtered.announcements.every((a) => a.status === 'draft')
  && filtered.announcements.some((a) => a.id === draft.id));
const badFilter = await refusal(() => staffList(env, admin, { status: 'pending' }));
check('an unknown status filter is a 422, not an empty list that looks like an answer',
  badFilter.name === 'ValidationError' && Boolean(badFilter.fields.status));

// -- amending ----------------------------------------------------------
const published = await updateAnnouncement(env, {
  actor: registrar, id: draft.id, now: NOW, body: { status: 'published' },
});
check('a draft can be published, and acquires the published_at the table requires',
  published.status === 'published' && published.publishedAt === NOW);
check('and it reaches its audience the moment it does',
  (await idsFor(ben)).includes(draft.id));

const retitled = await updateAnnouncement(env, {
  actor: registrar, id: institution.id, now: NOW,
  body: { title: 'Registry opening hours (corrected)' },
});
check('the text of a published notice may be corrected',
  retitled.primary.title === 'Registry opening hours (corrected)');
check('and correcting the English does not discard the Arabic edition beside it',
  retitled.translation !== null && retitled.translation.title === 'ساعات عمل السجل');

const translatedLater = await updateAnnouncement(env, {
  actor: tutor, id: levelThree.id, now: NOW,
  body: { translation: { language: 'ar', title: 'عيادة المحادثة', body: 'تنتقل العيادة إلى يوم الجمعة.' } },
});
check('a translation can be added to a notice that shipped without one',
  translatedLater.availableLanguages.sort().join(',') === 'ar,en');
check('and the Arabic reader stops seeing a fallback the moment it is',
  (await learnerFeed(env, { user: amina, now: NOW, limit: 100 }))
    .announcements.find((a) => a.id === levelThree.id).fallback === false);

const rescope = await refusal(() => updateAnnouncement(env, {
  actor: registrar, id: institution.id, now: NOW,
  body: { audienceScope: 'learner', audienceUserId: 'usr_amina' },
}));
check('the audience of a PUBLISHED notice is frozen — no unrecorded rewrite of who was told what',
  rescope.name === 'ValidationError' && Boolean(rescope.fields.audienceScope));

const redate = await refusal(() => updateAnnouncement(env, {
  actor: registrar, id: institution.id, now: NOW, body: { publishFrom: FUTURE },
}));
check('nor may a published notice be back-dated or postponed',
  redate.name === 'ValidationError' && Boolean(redate.fields.publishFrom));

const unpublish = await refusal(() => updateAnnouncement(env, {
  actor: registrar, id: institution.id, now: NOW, body: { status: 'draft' },
}));
check('a published notice cannot slip back to draft — that is a withdrawal, and withdrawals give reasons',
  unpublish.name === 'ValidationError' && Boolean(unpublish.fields.status));

const withdrawByPatch = await refusal(() => updateAnnouncement(env, {
  actor: registrar, id: institution.id, now: NOW, body: { status: 'withdrawn' },
}));
check('PATCH will not withdraw, because PATCH has nowhere to put the reason',
  withdrawByPatch.name === 'ValidationError' && /reason/i.test(withdrawByPatch.fields.status));

const stillDraft = await createAnnouncement(env, {
  actor: registrar, now: NOW,
  body: { language: 'en', title: 'Aimed wrongly', body: 'Addressed at the wrong level.', audienceScope: 'level', levelId: 3 },
});
const draftRescope = await updateAnnouncement(env, {
  actor: registrar, id: stillDraft.id, now: NOW,
  body: { audienceScope: 'level', levelId: 5 },
});
check('a DRAFT-era audience may still be corrected — nothing has been said yet',
  draftRescope.audience.scope === 'level' && draftRescope.audience.levelId === 5);
check('and a draft is invisible to its audience the whole time it is being corrected',
  !(await idsFor(carla)).includes(stillDraft.id));

const strangerEdits = await refusal(() => updateAnnouncement(env, {
  actor: tutor, id: institution.id, now: NOW, body: { title: 'Rewritten by somebody else' },
}));
check('a notice signed by one member of staff is not another\'s to rewrite — 403',
  strangerEdits.name === 'AuthorizationError' && strangerEdits.status === 403);
check('but an administrator may amend it',
  (await updateAnnouncement(env, { actor: admin, id: institution.id, now: NOW, body: { pinned: true } })).pinned === true);

const nothingToChange = await refusal(() => updateAnnouncement(env, {
  actor: registrar, id: institution.id, now: NOW, body: {},
}));
check('an empty PATCH is refused rather than reported as a successful no-op',
  nothingToChange.name === 'ValidationError');

const ghost = await refusal(() => updateAnnouncement(env, {
  actor: admin, id: 'ann_ghost', now: NOW, body: { pinned: true },
}));
check('amending an announcement that does not exist is a 404', ghost.name === 'NotFoundError');

// -- withdrawing -------------------------------------------------------
const noReason = await refusal(() => withdrawAnnouncement(env, {
  actor: tutor, id: levelThree.id, now: NOW,
}));
check('a withdrawal with no reason is refused — a blank answers no reviewer',
  noReason.name === 'ValidationError' && Boolean(noReason.fields.reason));

const strangerWithdraws = await refusal(() => withdrawAnnouncement(env, {
  actor: registrar, id: levelThree.id, reason: 'Not mine to withdraw.', now: NOW,
}));
check('and it is not another member of staff\'s to withdraw either — 403',
  strangerWithdraws.name === 'AuthorizationError');

const withdrawn = await withdrawAnnouncement(env, {
  actor: tutor, id: levelThree.id, reason: 'The clinic did not move; the notice was issued in error.', now: NOW,
});
check('the author withdraws it, with the reason on the record',
  withdrawn.status === 'withdrawn' && withdrawn.withdrawnAt === NOW
  && /issued in error/.test(withdrawn.withdrawnReason));
check('the row survives — nothing in this institution is deleted',
  one('SELECT COUNT(*) AS n FROM announcements WHERE id = ?', levelThree.id).n === 1);
check('so does its publication date, so the record still says it WAS published',
  one('SELECT published_at FROM announcements WHERE id = ?', levelThree.id).published_at === NOW);
check('and so do the receipts, so what learners had already read is still answerable',
  one('SELECT COUNT(*) AS n FROM announcement_receipts WHERE announcement_id = ?', levelThree.id).n === 1);
check('but it leaves every feed it was in',
  !(await idsFor(amina)).includes(levelThree.id));

const editWithdrawn = await refusal(() => updateAnnouncement(env, {
  actor: tutor, id: levelThree.id, now: NOW, body: { title: 'Quietly repurposed' },
}));
check('a withdrawn notice cannot be edited back into circulation — withdrawn is terminal',
  editWithdrawn.name === 'ValidationError' && Boolean(editWithdrawn.fields.status));

const doubleWithdraw = await refusal(() => withdrawAnnouncement(env, {
  actor: tutor, id: levelThree.id, reason: 'Again.', now: NOW,
}));
check('and it cannot be withdrawn twice', doubleWithdraw.name === 'ValidationError');

// ---------------------------------------------------------------------
// 7 · INPUT PARSING
// ---------------------------------------------------------------------
check('limit defaults rather than demanding a parameter', parseLimit(null) === 20);
check('limit accepts a whole number', parseLimit('5') === 5);
for (const bad of ['0', '101', '-1', 'ten', '2.5', '3; DROP']) {
  check(`limit refuses "${bad}" rather than coercing it`, (() => {
    try { parseLimit(bad); return false; } catch (e) { return e.name === 'ValidationError' && Boolean(e.fields.limit); }
  })());
}
check('language falls back to the reader\'s own account setting',
  parseLanguage(null, amina) === 'ar' && parseLanguage('', ben) === 'en');
check('an unknown language is refused rather than quietly served as English', (() => {
  try { parseLanguage('fr', amina); return false; } catch (e) { return e.name === 'ValidationError'; }
})());

// ---------------------------------------------------------------------
// 8 · THE ROUTES, WITH REAL TOKENS
// ---------------------------------------------------------------------
const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });
async function token(sub) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const t = Math.floor(Date.now() / 1000);
  const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: t - 5, exp: t + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const TOK = {
  amina: await token('sub_amina'), ben: await token('sub_ben'),
  registrar: await token('sub_registrar'), tutor: await token('sub_tutor'),
  admin: await token('sub_admin'),
};
const BASE = 'https://wec-lc.test/api';
const get = (url, tok) => new Request(url, tok ? { headers: { Authorization: `Bearer ${tok}` } } : undefined);
const send = (method, url, tok, body) => new Request(url, {
  method,
  headers: tok
    ? { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
});

check('GET /api/announcements refuses an unauthenticated caller',
  (await feedRoute.onRequestGet({ request: get(`${BASE}/announcements`), env })).status === 401);
check('POST /api/announcements refuses an unauthenticated caller',
  (await feedRoute.onRequestPost({ request: send('POST', `${BASE}/announcements`, null, {}), env })).status === 401);
for (const [name, fn] of [['GET', 'onRequestGet'], ['POST', 'onRequestPost'], ['PATCH', 'onRequestPatch'], ['DELETE', 'onRequestDelete']]) {
  check(`${name} /api/staff/announcements refuses an unauthenticated caller`,
    (await staffRoute[fn]({
      request: name === 'GET' ? get(`${BASE}/staff/announcements`) : send(name, `${BASE}/staff/announcements`, null, {}),
      env,
    })).status === 401);
  check(`${name} /api/staff/announcements refuses a learner — 403`,
    (await staffRoute[fn]({
      request: name === 'GET' ? get(`${BASE}/staff/announcements`, TOK.amina) : send(name, `${BASE}/staff/announcements`, TOK.amina, {}),
      env,
    })).status === 403);
}

const feedRes = await feedRoute.onRequestGet({ request: get(`${BASE}/announcements`, TOK.amina), env });
const feedBody = await feedRes.json();
check('a learner reads her own feed through the route',
  feedRes.status === 200 && feedBody.reader.language === 'ar' && feedBody.reader.direction === 'rtl'
  && feedBody.announcements.some((a) => a.id === privateToAmina.id));
check('and Ben\'s feed over the same route does not contain her letter',
  !(await (await feedRoute.onRequestGet({ request: get(`${BASE}/announcements`, TOK.ben), env })).json())
    .announcements.some((a) => a.id === privateToAmina.id));
check('the route takes no userId — supplying one on a GET changes nothing about whose feed comes back',
  (await (await feedRoute.onRequestGet({
    request: get(`${BASE}/announcements?userId=usr_amina`, TOK.ben), env,
  })).json()).announcements.every((a) => a.id !== privateToAmina.id));
check('and a userId in a POST body is REFUSED, not ignored',
  (await feedRoute.onRequestPost({
    request: send('POST', `${BASE}/announcements`, TOK.ben, { announcementId: institution.id, userId: 'usr_amina' }), env,
  })).status === 422);
check('a bad limit on the feed is a 422',
  (await feedRoute.onRequestGet({ request: get(`${BASE}/announcements?limit=9999`, TOK.amina), env })).status === 422);
check('an unknown ?language is a 422 rather than a silent English page',
  (await feedRoute.onRequestGet({ request: get(`${BASE}/announcements?language=fr`, TOK.amina), env })).status === 422);

const readRes = await feedRoute.onRequestPost({
  request: send('POST', `${BASE}/announcements`, TOK.ben, { announcementId: institution.id }), env,
});
check('marking read over the route returns the receipt and the new badge count',
  readRes.status === 200 && typeof (await readRes.clone().json()).unread === 'number'
  && Boolean((await readRes.json()).readAt));
check('marking somebody else\'s private letter read over the route is a 404',
  (await feedRoute.onRequestPost({
    request: send('POST', `${BASE}/announcements`, TOK.ben, { announcementId: privateToAmina.id }), env,
  })).status === 404);
check('a malformed JSON body is a 422, not a 500',
  (await feedRoute.onRequestPost({
    request: new Request(`${BASE}/announcements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOK.ben}`, 'Content-Type': 'application/json' },
      body: '{not json',
    }), env,
  })).status === 422);

const authored = await staffRoute.onRequestPost({
  request: send('POST', `${BASE}/staff/announcements`, TOK.registrar, {
    language: 'en', title: 'Written over the route', body: 'A notice authored through the staff endpoint.',
    audienceScope: 'level', levelId: 3, status: 'published', publishFrom: PAST,
  }),
  env,
});
const authoredBody = await authored.json();
check('staff author over the route, and it comes back 201 signed by the session',
  authored.status === 201 && authoredBody.author.id === 'usr_registrar');
check('an authorId in the body is refused, so nobody signs a colleague\'s name to a notice',
  (await staffRoute.onRequestPost({
    request: send('POST', `${BASE}/staff/announcements`, TOK.registrar, {
      title: 'x', body: 'y', audienceScope: 'institution', authorId: 'usr_admin',
    }), env,
  })).status === 422);

const patched = await staffRoute.onRequestPatch({
  request: send('PATCH', `${BASE}/staff/announcements?id=${authoredBody.id}`, TOK.registrar, { pinned: true }),
  env,
});
check('PATCH takes the id from the query string', patched.status === 200 && (await patched.json()).pinned === true);
check('an id in the query and a different id in the body is refused rather than guessed',
  (await staffRoute.onRequestPatch({
    request: send('PATCH', `${BASE}/staff/announcements?id=${authoredBody.id}`, TOK.registrar,
      { id: institution.id, pinned: false }), env,
  })).status === 422);
check('PATCH with no id at all is a 422',
  (await staffRoute.onRequestPatch({
    request: send('PATCH', `${BASE}/staff/announcements`, TOK.registrar, { pinned: false }), env,
  })).status === 422);

check('DELETE with no reason is a 422',
  (await staffRoute.onRequestDelete({
    request: send('DELETE', `${BASE}/staff/announcements?id=${authoredBody.id}`, TOK.registrar, {}), env,
  })).status === 422);
const deleted = await staffRoute.onRequestDelete({
  request: send('DELETE', `${BASE}/staff/announcements`, TOK.registrar,
    { id: authoredBody.id, reason: 'Superseded by the timetable circular.' }),
  env,
});
check('DELETE withdraws, keeps the row, and records why',
  deleted.status === 200 && (await deleted.json()).status === 'withdrawn'
  && one('SELECT COUNT(*) AS n FROM announcements WHERE id = ?', authoredBody.id).n === 1);

const staffGet = await staffRoute.onRequestGet({ request: get(`${BASE}/staff/announcements?limit=100`, TOK.admin), env });
check('an administrator reads the board over the route',
  staffGet.status === 200 && (await staffGet.json()).basis === 'admin');
check('a bad levelId filter on the staff route is a 422',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/announcements?levelId=three`, TOK.admin), env })).status === 422);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
