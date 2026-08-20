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
  verificationCode: 'AIPC-4K7P-9WQ2-MXR8T',
  status: 'conferred',
};

test('an award certificate regenerates byte-identically and is complete', () => {
  const a = R.renderAwardCertificate(AWARD);
  const b = R.renderAwardCertificate(AWARD);
  assert.equal(a, b, 'two renders of the same record differ');
  assert.ok(a.startsWith('<!doctype html>') && a.includes('</html>'));
  assert.ok(a.includes('Aisha binte Rahman') && a.includes('Level IV'));
  assert.ok(a.includes('AIPC-4K7P-9WQ2-MXR8T'));
});

test('a snake_case row renders identically to camelCase claims', () => {
  const a = R.renderAwardCertificate(AWARD);
  const snake = R.renderAwardCertificate({
    holder_name: 'Aisha binte Rahman',
    award_title: 'International English Fluency Certificate — Level IV',
    post_nominal: 'IEFC IV', cefr: 'B2', honour: 'distinction', credits: 30,
    tqt_hours: 300, citation: 'For sustained excellence across the level.',
    conferred_on: '2026-07-01', verification_code: 'AIPC-4K7P-9WQ2-MXR8T', status: 'conferred',
  });
  assert.equal(snake, a);
});

test('no stray secret on the record reaches the certificate', () => {
  const html = R.renderAwardCertificate({ ...AWARD,
    pdfUnlock: 'TOPSECRET-UNLOCK-9931', privateKey: 'PRIV-KEY-DEADBEEF',
    passLabel: 'stromex/certificates/aipc/2026/AIPC-4K7P-9WQ2-MXR8T/pdf-unlock' });
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
    verificationCode: 'AIPC-4K7P-9WQ2-MXR8T',
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
    issuedOn: '2026-08-10', verificationCode: 'AIPC-QW52-7NKP-3RM8V', status: 'issued',
  };
  const a = R.renderTestimonial(T);
  assert.equal(a, R.renderTestimonial(T));
  assert.ok(a.includes('Aisha binte Rahman') && a.includes('without reservation') && a.includes('Dr Imran Hafiz'));
  assert.ok(a.includes('AIPC-QW52-7NKP-3RM8V'));
  assert.ok(!R.renderTestimonial({ ...T, pdfUnlock: 'LEAK-9931' }).includes('LEAK-9931'));
  assert.ok(!R.renderTestimonial({ ...T, body: '<img src=x onerror=alert(1)>' }).includes('<img src=x'));
});

test('the pass-label convention is a store path, validated, never a value', () => {
  assert.equal(
    REG.certificateSecretLabel({ code: 'AIPC-4K7P-9WQ2-MXR8T', kind: 'pdf-unlock', year: '2026' }),
    'stromex/certificates/aipc/2026/AIPC-4K7P-9WQ2-MXR8T/pdf-unlock');
  assert.throws(() => REG.certificateSecretLabel({ code: 'AIPC-4K7P-9WQ2-MXR8T', kind: 'password', year: '2026' }), /kind must be one of/);
  assert.throws(() => REG.certificateSecretLabel({ code: 'AIPC-4K7P-9WQ2-MXR8T', kind: 'pdf-unlock', year: '26' }), /four-digit/);
  assert.throws(() => REG.certificateSecretLabel({ code: '../etc/passwd', kind: 'pdf-unlock', year: '2026' }), /valid AIPC/);
});

test('the engine is COLLECTIVE — a second institution renders with no engine edits', () => {
  const AMICAS = ISS.defineIssuer({
    key: 'amicas', legalName: 'Al-Madeenah International College for Arabic & Islamic Studies',
    codePrefix: 'AMIC', verifyOrigin: 'https://almadeenah.example', sealMark: 'AMIC',
  });
  const cert = R.renderAwardCertificate(AWARD, { issuer: AMICAS });
  assert.ok(cert.includes('Al-Madeenah International College') && cert.includes('almadeenah.example'));
  assert.ok(!cert.includes('Albalagh International Premium College'), 'default institution leaked in');

  assert.equal(
    REG.certificateSecretLabel({ code: 'AMIC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: AMICAS }),
    'stromex/certificates/amicas/2026/AMIC-4K7P-9WQ2-MXR8T/signing-key');
  assert.throws(() => REG.certificateSecretLabel({ code: 'AIPC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: AMICAS }), /valid AMIC/);
  assert.throws(() => REG.certificateSecretLabel({ code: 'AMIC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: 'nope' }), /Unknown issuer/);
  assert.throws(() => ISS.defineIssuer({ key: 'demo', legalName: 'Demo College', codePrefix: 'DEMO', verifyOrigin: 'http://insecure' }), /https origin/);
});

test('the issuance register is beautiful, non-secret, and regenerates identically', () => {
  const entries = [AWARD, { ...AWARD, status: 'revoked', verificationCode: 'AIPC-8T3M-2XK9-P4WQ7' }];
  const doc = REG.renderIssuanceRegister({ entries });
  assert.equal(doc, REG.renderIssuanceRegister({ entries }));
  assert.ok(doc.includes('AIPC-4K7P-9WQ2-MXR8T') && doc.includes('Aisha binte Rahman'));
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
