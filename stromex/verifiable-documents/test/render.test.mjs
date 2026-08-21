/**
 * The verifiable-document engine — Volume 12 §12.12, SEB-D 47.
 *
 * THE ASSERTIONS THIS FILE EXISTS FOR:
 *
 *   1. A document regenerates BYTE-IDENTICALLY from its record. That is
 *      what "recoverable from its record, not from memory" means; a
 *      renderer that drifted between runs would produce a new document
 *      that merely resembles the original — the exact SHRS failure.
 *   2. No secret ever reaches a rendered document or the register. The
 *      public verification code may appear (it authorises nothing); an
 *      unlock code, key or store label may not.
 *   3. The engine is COLLECTIVE: it owns no institution, it is told the
 *      issuer. The same code renders for any estate project.
 *   4. The `pass` label convention computes a store PATH from non-secret
 *      identifiers, validates every segment, and never embeds a value.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import * as R from '../src/certificate-render.js';
import * as REG from '../src/issuance-register.js';
import * as ISS from '../src/issuer.js';

const AWARD = {
  holderName: 'Aisha binte Rahman',
  awardTitle: 'International English Fluency Certificate — Level IV',
  postNominal: 'IEFC IV',
  cefr: 'B2',
  honour: 'distinction',
  credits: 30,
  tqtHours: 300,
  citation: 'For sustained excellence across the level.',
  conferredOn: '2026-07-01',
  verificationCode: 'WEC-4K7P-9WQ2-MXR8T',
  status: 'conferred',
};

test('an award certificate regenerates byte-identically and is complete', () => {
  const a = R.renderAwardCertificate(AWARD);
  const b = R.renderAwardCertificate(AWARD);
  assert.equal(a, b, 'two renders of the same record differ');
  assert.ok(a.startsWith('<!doctype html>') && a.includes('</html>'));
  assert.ok(a.includes('Aisha binte Rahman') && a.includes('Level IV'));
  assert.ok(a.includes('WEC-4K7P-9WQ2-MXR8T'));
});

test('a snake_case row renders identically to camelCase claims', () => {
  const a = R.renderAwardCertificate(AWARD);
  const snake = R.renderAwardCertificate({
    holder_name: 'Aisha binte Rahman',
    award_title: 'International English Fluency Certificate — Level IV',
    post_nominal: 'IEFC IV', cefr: 'B2', honour: 'distinction', credits: 30,
    tqt_hours: 300, citation: 'For sustained excellence across the level.',
    conferred_on: '2026-07-01', verification_code: 'WEC-4K7P-9WQ2-MXR8T', status: 'conferred',
  });
  assert.equal(snake, a);
});

test('no stray secret on the record reaches the certificate', () => {
  const html = R.renderAwardCertificate({ ...AWARD,
    pdfUnlock: 'TOPSECRET-UNLOCK-9931', privateKey: 'PRIV-KEY-DEADBEEF',
    passLabel: 'stromex/certificates/wec/2026/WEC-4K7P-9WQ2-MXR8T/pdf-unlock' });
  assert.ok(!html.includes('TOPSECRET-UNLOCK-9931'));
  assert.ok(!html.includes('DEADBEEF'));
  assert.ok(!html.includes('/pdf-unlock'));
});

test('a holder name is escaped, not injected', () => {
  const evil = R.renderAwardCertificate({ ...AWARD, holderName: '<script>alert(1)</script>' });
  assert.ok(!evil.includes('<script>alert(1)</script>') && evil.includes('&lt;script&gt;'));
});

test('a transcript regenerates byte-identically from its frozen payload', () => {
  const payload = {
    documentType: 'transcript', holderName: 'Aisha binte Rahman', issuedOn: '2026-08-01',
    verificationCode: 'WEC-4K7P-9WQ2-MXR8T',
    entries: [{ roman: 'IV', levelName: 'Upper Intermediate', cefr: 'B2', status: 'awarded', award: { title: 'IEFC IV' } }],
    creditsAwarded: 30, tqtHoursAwarded: 300,
  };
  const t1 = R.renderIssuedDocument(payload);
  assert.equal(t1, R.renderIssuedDocument(payload));
  assert.ok(t1.includes('Upper Intermediate') && t1.includes('B2'));
});

test('a testimonial regenerates byte-identically and generalises the doctrine', () => {
  const T = {
    subjectName: 'Aisha binte Rahman',
    body: 'The College knows this student to be diligent, articulate and of excellent character.\nWe recommend her without reservation.',
    signatoryName: 'Dr Imran Hafiz', signatoryTitle: 'Principal, London Campus',
    issuedOn: '2026-08-10', verificationCode: 'WEC-QW52-7NKP-3RM8V', status: 'issued',
  };
  const a = R.renderTestimonial(T);
  assert.equal(a, R.renderTestimonial(T));
  assert.ok(a.includes('Aisha binte Rahman') && a.includes('without reservation') && a.includes('Dr Imran Hafiz'));
  assert.ok(a.includes('WEC-QW52-7NKP-3RM8V'));
  assert.ok(!R.renderTestimonial({ ...T, pdfUnlock: 'LEAK-9931' }).includes('LEAK-9931'));
  assert.ok(!R.renderTestimonial({ ...T, body: '<img src=x onerror=alert(1)>' }).includes('<img src=x'));
});

test('the pass-label convention is a store path, validated, never a value', () => {
  assert.equal(
    REG.certificateSecretLabel({ code: 'WEC-4K7P-9WQ2-MXR8T', kind: 'pdf-unlock', year: '2026' }),
    'stromex/certificates/wec/2026/WEC-4K7P-9WQ2-MXR8T/pdf-unlock');
  assert.throws(() => REG.certificateSecretLabel({ code: 'WEC-4K7P-9WQ2-MXR8T', kind: 'password', year: '2026' }), /kind must be one of/);
  assert.throws(() => REG.certificateSecretLabel({ code: 'WEC-4K7P-9WQ2-MXR8T', kind: 'pdf-unlock', year: '26' }), /four-digit/);
  assert.throws(() => REG.certificateSecretLabel({ code: '../etc/passwd', kind: 'pdf-unlock', year: '2026' }), /valid WEC/);
});

test('the engine is COLLECTIVE — a second institution renders with no engine edits', () => {
  const AMICAS = ISS.defineIssuer({
    key: 'amicas', legalName: 'Al-Madeenah International College for Arabic & Islamic Studies',
    codePrefix: 'AMIC', verifyOrigin: 'https://almadeenah.example', sealMark: 'AMIC',
  });
  const cert = R.renderAwardCertificate(AWARD, { issuer: AMICAS });
  assert.ok(cert.includes('Al-Madeenah International College') && cert.includes('almadeenah.example'));
  assert.ok(!cert.includes('Worldwide English College'), 'default institution leaked in');

  assert.equal(
    REG.certificateSecretLabel({ code: 'AMIC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: AMICAS }),
    'stromex/certificates/amicas/2026/AMIC-4K7P-9WQ2-MXR8T/signing-key');
  assert.throws(() => REG.certificateSecretLabel({ code: 'WEC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: AMICAS }), /valid AMIC/);
  assert.throws(() => REG.certificateSecretLabel({ code: 'AMIC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: 'nope' }), /Unknown issuer/);
  assert.throws(() => ISS.defineIssuer({ key: 'demo', legalName: 'Demo College', codePrefix: 'DEMO', verifyOrigin: 'http://insecure' }), /https origin/);
});

test('the issuance register is beautiful, non-secret, and regenerates identically', () => {
  const entries = [AWARD, { ...AWARD, status: 'revoked', verificationCode: 'WEC-8T3M-2XK9-P4WQ7' }];
  const doc = REG.renderIssuanceRegister({ entries });
  assert.equal(doc, REG.renderIssuanceRegister({ entries }));
  assert.ok(doc.includes('WEC-4K7P-9WQ2-MXR8T') && doc.includes('Aisha binte Rahman'));
  assert.ok(doc.includes('Active') && doc.includes('Withdrawn'));
  assert.ok(!REG.renderIssuanceRegister({ entries: [{ ...AWARD, pdfUnlock: 'SECRET-XYZ' }] }).includes('SECRET-XYZ'));
  assert.ok(REG.renderIssuanceRegister({ entries: [] }).includes('No entries'));
});

test('the shared QR encoder has not drifted from the site copy (converge, do not fork)', () => {
  // Until the site imports this package directly, two copies of the QR
  // encoder exist and MUST stay byte-identical — a divergence would make a
  // certificate's QR differ from what the site verifies. This guard fails
  // the moment they part, so the duplication cannot rot silently. Remove it
  // when functions/ imports src/qr.js instead of its own copy.
  const here = readFileSync(fileURLToPath(new URL('../src/qr.js', import.meta.url)), 'utf8');
  const site = readFileSync(fileURLToPath(new URL('../../../functions/_lib/registry/qr.js', import.meta.url)), 'utf8');
  assert.equal(here, site, 'stromex/verifiable-documents/src/qr.js has drifted from functions/_lib/registry/qr.js');
});

import * as DT from '../src/document-types.js';

test('an ID card regenerates byte-identically, is a verifiable document, keeps no secret', () => {
  const CARD = {
    holderName: 'Aisha binte Rahman', role: 'Student', membershipId: 'WEC-STU-004812',
    validFrom: '2026-09', validThru: '2027-08', verificationCode: 'WEC-4K7P-9WQ2-MXR8T', status: 'active',
  };
  const a = R.renderIdCard(CARD);
  assert.equal(a, R.renderIdCard(CARD));
  assert.ok(a.startsWith('<!doctype html>') && a.includes('Identity Card'));
  assert.ok(a.includes('Aisha binte Rahman') && a.includes('Student') && a.includes('WEC-STU-004812'));
  assert.ok(a.includes('WEC-4K7P-9WQ2-MXR8T'), 'the verification code the QR resolves is on the card');
  assert.ok(!R.renderIdCard({ ...CARD, pdfUnlock: 'LEAK-42' }).includes('LEAK-42'));
});

test('an ID card renders a monogram when no photo, and a supplied data-URI photo otherwise', () => {
  const base = { holderName: 'Yusuf al-Amin', role: 'Faculty', verificationCode: 'WEC-8T3M-2XK9-P4WQ7' };
  assert.ok(R.renderIdCard(base).includes('idc__mono'), 'no photo → monogram placeholder');
  const withPhoto = R.renderIdCard({ ...base, photoDataUri: 'data:image/png;base64,AAAA' });
  assert.ok(withPhoto.includes('idc__photo-img') && withPhoto.includes('data:image/png;base64,AAAA'));
  // A remote URL is refused as a photo — it would break determinism and offline recovery.
  assert.ok(!R.renderIdCard({ ...base, photoDataUri: 'https://evil.example/x.png' }).includes('evil.example'));
});

test('an ID card for a different institution renders with no engine edits', () => {
  const AMICAS = ISS.defineIssuer({
    key: 'amicas', legalName: 'Al-Madeenah International College for Arabic & Islamic Studies',
    codePrefix: 'AMIC', verifyOrigin: 'https://almadeenah.example', sealMark: 'AMIC',
  });
  const card = R.renderIdCard({ holderName: 'Sumayyah Q', role: 'Alumnus', verificationCode: 'AMIC-4K7P-9WQ2-MXR8T' }, { issuer: AMICAS });
  assert.ok(card.includes('Al-Madeenah International College') && card.includes('almadeenah.example'));
  assert.ok(!card.includes('Worldwide English College'));
});

test('the document-type registry catalogues the built-ins and dispatches generically', () => {
  const keys = DT.documentTypes().map((t) => t.key);
  for (const k of ['award-certificate', 'testimonial', 'id-card', 'transcript']) assert.ok(keys.includes(k), `missing ${k}`);
  // Every built-in declares a valid subject and a renderer.
  for (const t of DT.documentTypes()) {
    assert.ok(DT.SUBJECTS.includes(t.subject));
    assert.equal(typeof t.render, 'function');
  }
  const viaRegistry = DT.renderDocument('award-certificate', AWARD);
  assert.equal(viaRegistry, R.renderAwardCertificate(AWARD), 'the registry dispatches to the same renderer');
  assert.throws(() => DT.renderDocument('no-such-type', {}), /Unknown document type/);
});

test('the registry is the extension point — a NEW type is data, not engine code', () => {
  let called = null;
  DT.registerDocumentType('library-card', {
    title: 'Library Card', subject: 'person',
    render: (rec, opts) => { called = { rec, opts }; return '<!doctype html><html><!--library card--></html>'; },
  });
  const out = DT.renderDocument('library-card', { holderName: 'Test' }, { issuer: 'wec' });
  assert.ok(out.includes('library card') && called.rec.holderName === 'Test');
  assert.ok(DT.documentTypes().some((t) => t.key === 'library-card'));
  // A built-in cannot be shadowed by accident.
  assert.throws(() => DT.registerDocumentType('award-certificate', { title: 'X', subject: 'person', render: () => '' }), /already registered/);
  // A malformed type is refused.
  assert.throws(() => DT.registerDocumentType('Bad Key', { title: 'X', subject: 'person', render: () => '' }), /lowercase slug/);
  assert.throws(() => DT.registerDocumentType('good-key', { title: 'X', subject: 'nonsense', render: () => '' }), /subject one of/);
});

import * as PUB from '../src/publication-record.js';

const EDITION = {
  title: 'The IEFC Curriculum — Flagship Edition',
  documentId: 'GQ08-FZ9Q-DQHB-6X8D',
  contentDigest: 'a'.repeat(64),
  issueCode: 'E01.R00.01',
  editionName: 'First',
  publicationId: 'WEC/IEFC/CUR/2026/E01',
  printIdentifier: 'E01.R00.01-7K2M',
  year: 2026,
  counts: { levels: 6, modules: 60, lessons: 720 },
  registrations: [
    { field: 'ISBN', value: 'Not assigned', authority: 'International ISBN Agency' },
    { field: 'DOI', value: 'Not registered', authority: 'A DOI registration agency' },
  ],
  status: 'in-print',
};

test('an edition of record regenerates byte-identically and states its identity', () => {
  const a = PUB.renderPublicationRecord(EDITION);
  assert.equal(a, PUB.renderPublicationRecord(EDITION));
  assert.ok(a.includes('GQ08-FZ9Q-DQHB-6X8D') && a.includes('E01.R00.01'));
  assert.ok(a.includes('The IEFC Curriculum'));
  assert.ok(a.includes('Edition of Record'));
});

test('an edition record carries the honesty bound — what the College does NOT hold', () => {
  const a = PUB.renderPublicationRecord(EDITION);
  assert.ok(a.includes('Not assigned') && a.includes('International ISBN Agency'),
    'an unheld registration is named with its authority, never invented');
  assert.ok(a.includes('it is not a signature') && a.includes('does not certify authorship'),
    'the digest notice states what the digest does NOT prove');
});

test('digest comparison gives four honest outcomes and never a fabricated verdict', () => {
  const good = 'a'.repeat(64);
  const other = 'b'.repeat(64);
  assert.equal(PUB.compareDigest({ recordDigest: good, candidateDigest: good }).outcome, 'identical');
  assert.equal(PUB.compareDigest({ recordDigest: good, candidateDigest: other }).outcome, 'altered');
  assert.equal(PUB.compareDigest({ recordDigest: null, candidateDigest: good }).outcome, 'not_found');
  assert.equal(PUB.compareDigest({ recordDigest: good, candidateDigest: 'not-a-digest' }).outcome, 'malformed');
  // Case and whitespace are normalised — a digest pasted from a PDF still matches.
  assert.equal(PUB.compareDigest({ recordDigest: good, candidateDigest: `  ${good.toUpperCase()} ` }).outcome, 'identical');
});

test('an edition record is an ARTIFACT-subject type in the registry and renders per issuer', () => {
  const t = DT.documentType('publication');
  assert.equal(t.subject, 'artifact', 'the subject is the document itself, not a person');
  assert.equal(DT.renderDocument('publication', EDITION), PUB.renderPublicationRecord(EDITION));

  const AMICAS = ISS.defineIssuer({
    key: 'amicas2', legalName: 'Al-Madeenah International College for Arabic & Islamic Studies',
    codePrefix: 'AMIC', verifyOrigin: 'https://almadeenah.example', sealMark: 'AMIC',
  });
  const forOther = PUB.renderPublicationRecord(EDITION, { issuer: AMICAS });
  assert.ok(forOther.includes('almadeenah.example'));
  assert.ok(!forOther.includes('worldwencollege'), 'default origin leaked into another issuer\'s record');
});

test('the default issuer points at the origin the site is ACTUALLY served from', () => {
  // A verify URL printed into a physical book must resolve. The live site is
  // served from worldwencollege.co.uk; an unregistered .com would be a
  // promise the College cannot keep.
  assert.equal(ISS.WEC.verifyOrigin, 'https://www.worldwencollege.co.uk');
});
