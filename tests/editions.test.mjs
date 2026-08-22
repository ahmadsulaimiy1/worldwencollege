// functions/_lib/registry/editions.js — the Editions Register.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   A Document ID printed into a physical book must resolve to the
//   edition of record — and a copy whose content has been altered must
//   be told apart from one that has not.
//
// Every rendered edition already computes and prints that digest; what
// never existed was anywhere recording it, so the QR in a bound book
// resolved to nothing. These tests hold the register to the promise the
// printed page already makes.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const E = await import(loadUrl('functions/_lib/registry/editions.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const T0 = Date.parse('2026-08-20T09:00:00.000Z');
const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);

const freshEnv = () => ({ DB: makeD1(schema) });

const EDITION = {
  title: 'The IEFC Curriculum — Flagship Edition',
  documentId: 'GQ08-FZ9Q-DQHB-6X8D',
  contentDigest: DIGEST_A,
  issueCode: 'E01.R00.01',
  editionName: 'First',
  publicationId: 'WEC/IEFC/CUR/2026/E01',
  printIdentifier: 'E01.R00.01-7K2M',
  year: 2026,
  counts: { levels: 6, modules: 60 },
  registrations: [{ field: 'ISBN', value: 'Not assigned', authority: 'International ISBN Agency' }],
  now: T0,
};

// ── Registering ──────────────────────────────────────────────────────
{
  const env = freshEnv();
  const first = await E.registerEdition(env, EDITION);
  check('An edition is recorded, so its printed Document ID now resolves', first.created === true);
  check('...carrying its digest, issue and extent',
    first.contentDigest === DIGEST_A && first.issueCode === 'E01.R00.01' && first.counts.levels === 6);
  check('...and the honest not-assigned registrations round-trip',
    first.registrations[0].authority === 'International ISBN Agency');

  // A rebuild of unchanged content is a normal event, not an error — but
  // it must not create a second row, because the digest IS the identity.
  const again = await E.registerEdition(env, EDITION);
  check('Re-registering identical content returns the existing record, not a duplicate',
    again.created === false && again.documentId === 'GQ08-FZ9Q-DQHB-6X8D');
  const all = await E.editionsRegister(env);
  check('...so the register still holds exactly one edition', all.count === 1, String(all.count));
}

// ── Refusals ─────────────────────────────────────────────────────────
{
  const env = freshEnv();
  check('A missing digest is refused — it is what identifies the edition',
    (await throws(() => E.registerEdition(env, { ...EDITION, contentDigest: null })))?.name === 'ValidationError');
  check('A truncated digest is refused rather than stored',
    (await throws(() => E.registerEdition(env, { ...EDITION, contentDigest: 'abc123' })))?.name === 'ValidationError');
  check('An untitled edition is refused',
    (await throws(() => E.registerEdition(env, { ...EDITION, title: '' })))?.name === 'ValidationError');
  check('A missing Document ID is refused — it is what a reader types',
    (await throws(() => E.registerEdition(env, { ...EDITION, documentId: '' })))?.name === 'ValidationError');
}

// ── Verifying: the question the doctrine exists to settle ────────────
{
  const env = freshEnv();
  await E.registerEdition(env, EDITION);

  const found = await E.verifyEdition(env, { documentId: 'GQ08-FZ9Q-DQHB-6X8D' });
  check('A printed Document ID resolves to the edition of record', found.outcome === 'valid');
  check('...and lower case or stray spacing still resolves',
    (await E.verifyEdition(env, { documentId: '  gq08-fz9q-dqhb-6x8d ' })).outcome === 'valid');

  const missing = await E.verifyEdition(env, { documentId: 'ZZZZ-ZZZZ-ZZZZ-ZZZZ' });
  check('An unknown Document ID is a true answer, not an error', missing.outcome === 'not_found' && missing.edition === null);
  check('An empty Document ID is answered as malformed',
    (await E.verifyEdition(env, { documentId: '' })).outcome === 'malformed');

  // The content check — the whole point.
  const same = await E.verifyEdition(env, { documentId: 'GQ08-FZ9Q-DQHB-6X8D', candidateDigest: DIGEST_A.toUpperCase() });
  check('A copy whose content matches is reported identical', same.content.outcome === 'identical');
  const altered = await E.verifyEdition(env, { documentId: 'GQ08-FZ9Q-DQHB-6X8D', candidateDigest: DIGEST_B });
  check('A copy whose content does NOT match is reported altered', altered.content.outcome === 'altered');
  check('...while the edition itself is still reported as genuinely published',
    altered.outcome === 'valid', 'status describes currency; content describes integrity');
  const bad = await E.verifyEdition(env, { documentId: 'GQ08-FZ9Q-DQHB-6X8D', candidateDigest: 'not-a-digest' });
  check('A malformed candidate digest is named, not silently treated as a mismatch',
    bad.content.outcome === 'malformed');
  check('No content verdict is invented when no copy was offered',
    found.content === null);
}

// ── Superseding and withdrawing: never deletion ──────────────────────
{
  const env = freshEnv();
  await E.registerEdition(env, EDITION);
  await E.registerEdition(env, { ...EDITION, documentId: 'HH11-KK22-MM33-NN44', contentDigest: DIGEST_B, issueCode: 'E02.R00.01', editionName: 'Second' });
  await E.supersedeEdition(env, { documentId: 'GQ08-FZ9Q-DQHB-6X8D', bySupersedingDocumentId: 'HH11-KK22-MM33-NN44' });

  const old = await E.verifyEdition(env, { documentId: 'GQ08-FZ9Q-DQHB-6X8D' });
  check('A superseded edition STILL VERIFIES — the College did publish it', old.outcome === 'superseded');
  check('...and points the reader at the current edition', old.supersededBy?.documentId === 'HH11-KK22-MM33-NN44');
  check('...with a message that does not call an honest older copy a forgery',
    /remains an\s+accurate record/.test(old.message), old.message);
  check('An edition cannot supersede itself',
    (await throws(() => E.supersedeEdition(env, { documentId: 'HH11-KK22-MM33-NN44', bySupersedingDocumentId: 'HH11-KK22-MM33-NN44' })))?.name === 'ValidationError');

  await E.withdrawEdition(env, { documentId: 'HH11-KK22-MM33-NN44', reason: 'A material error in Level IV.' });
  const gone = await E.verifyEdition(env, { documentId: 'HH11-KK22-MM33-NN44' });
  check('A withdrawn edition is marked, dated and reasoned — never deleted',
    gone.outcome === 'withdrawn' && gone.withdrawnReason === 'A material error in Level IV.' && !!gone.withdrawnAt);
  check('...and it is still IN the register, because the record is permanent',
    (await E.editionsRegister(env)).count === 2);
  check('Withdrawing without a reason is refused',
    (await throws(() => E.withdrawEdition(env, { documentId: 'GQ08-FZ9Q-DQHB-6X8D', reason: '' })))?.name === 'ValidationError');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
