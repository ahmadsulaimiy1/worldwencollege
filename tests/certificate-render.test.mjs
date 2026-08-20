// Certificate rendering and the Issuance Register — Volume 12 §12.12.
//
// THE ASSERTIONS THIS FILE EXISTS FOR:
//
//   1. A certificate regenerates BYTE-IDENTICALLY from its record. That
//      is what "recoverable from its record, not from memory" means, and
//      a renderer that drifted between runs would be producing a new
//      document that merely resembles the original — the exact SHRS
//      failure §12.12 was written against.
//
//   2. No secret ever reaches a rendered document or the register. The
//      public verification code may appear (it authorises nothing); an
//      unlock code, key or store label may not.
//
//   3. The `pass` label convention computes a store PATH from non-secret
//      identifiers, validates every segment, and never embeds a value.
import { loadUrl } from './helpers.mjs';

const R = await import(loadUrl('functions/_lib/registry/certificate-render.js'));
const REG = await import(loadUrl('functions/_lib/registry/issuance-register.js'));
const ISS = await import(loadUrl('functions/_lib/registry/issuer.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
function threw(fn, re) {
  try { fn(); return 'did not throw'; } catch (e) { return re.test(e.message) ? null : 'wrong error: ' + e.message; }
}

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

// ── 1. Determinism: the recovery guarantee ──────────────────────────
{
  const a = R.renderAwardCertificate(AWARD);
  const b = R.renderAwardCertificate(AWARD);
  check('An award certificate regenerates byte-identically', a === b,
    'two renders of the same record differ');
  check('...and it is a complete HTML document', a.startsWith('<!doctype html>') && a.includes('</html>'));
  check('...naming the holder and the award', a.includes('Aisha binte Rahman') && a.includes('Level IV'));
  check('...and carrying the public verification code', a.includes('AIPC-4K7P-9WQ2-MXR8T'));

  // Snake_case row and camelCase claims must produce the same document —
  // a caller should not have to know which shape they hold.
  const snake = R.renderAwardCertificate({
    holder_name: 'Aisha binte Rahman',
    award_title: 'International English Fluency Certificate — Level IV',
    post_nominal: 'IEFC IV', cefr: 'B2', honour: 'distinction', credits: 30,
    tqt_hours: 300, citation: 'For sustained excellence across the level.',
    conferred_on: '2026-07-01', verification_code: 'AIPC-4K7P-9WQ2-MXR8T', status: 'conferred',
  });
  check('A snake_case row renders identically to camelCase claims', snake === a);
}

// ── 2. No secret escapes into the document ──────────────────────────
{
  // A malicious/careless caller attaches secrets to the record. They must
  // not surface: the renderer reads only the fields a certificate asserts.
  const withSecrets = { ...AWARD,
    pdfUnlock: 'TOPSECRET-UNLOCK-9931',
    privateKey: 'PRIV-KEY-DEADBEEF',
    passLabel: 'stromex/certificates/aipc/2026/AIPC-4K7P-9WQ2-MXR8T/pdf-unlock' };
  const html = R.renderAwardCertificate(withSecrets);
  check('A stray unlock code on the record never reaches the certificate', !html.includes('TOPSECRET-UNLOCK-9931'));
  check('A stray private key never reaches the certificate', !html.includes('DEADBEEF'));
  check('A stray store label never reaches the certificate', !html.includes('/pdf-unlock'));
}

// ── 3. HTML-escaping: a name is data, never markup ──────────────────
{
  const evil = R.renderAwardCertificate({ ...AWARD, holderName: '<script>alert(1)</script>' });
  check('A holder name is escaped, not injected', !evil.includes('<script>alert(1)</script>') && evil.includes('&lt;script&gt;'));
}

// ── 4. Issued-document renderer (frozen payload) ────────────────────
{
  const payload = {
    documentType: 'transcript', holderName: 'Aisha binte Rahman', issuedOn: '2026-08-01',
    verificationCode: 'AIPC-4K7P-9WQ2-MXR8T',
    entries: [{ roman: 'IV', levelName: 'Upper Intermediate', cefr: 'B2', status: 'awarded', award: { title: 'IEFC IV' } }],
    creditsAwarded: 30, tqtHoursAwarded: 300,
  };
  const t1 = R.renderIssuedDocument(payload);
  const t2 = R.renderIssuedDocument(payload);
  check('A transcript regenerates byte-identically from its frozen payload', t1 === t2);
  check('...showing the level ledger', t1.includes('Upper Intermediate') && t1.includes('B2'));
}

// ── 4b. Testimonial: the doctrine generalises (SEB-D 47) ────────────
{
  const TESTIMONIAL = {
    subjectName: 'Aisha binte Rahman',
    body: 'The College knows this student to be diligent, articulate and of excellent character.\nWe recommend her without reservation.',
    signatoryName: 'Dr Imran Hafiz',
    signatoryTitle: 'Principal, London Campus',
    issuedOn: '2026-08-10',
    verificationCode: 'AIPC-QW52-7NKP-3RM8V',
    status: 'issued',
  };
  const a = R.renderTestimonial(TESTIMONIAL);
  const b = R.renderTestimonial(TESTIMONIAL);
  check('A testimonial regenerates byte-identically from its record', a === b);
  check('...naming the subject, the words and the signatory',
    a.includes('Aisha binte Rahman') && a.includes('without reservation') && a.includes('Dr Imran Hafiz'));
  check('...carrying its public verification code', a.includes('AIPC-QW52-7NKP-3RM8V'));
  check('A stray secret on a testimonial record never reaches the page',
    !R.renderTestimonial({ ...TESTIMONIAL, pdfUnlock: 'LEAK-9931' }).includes('LEAK-9931'));
  check('A testimonial body is escaped, not injected',
    !R.renderTestimonial({ ...TESTIMONIAL, body: '<img src=x onerror=alert(1)>' }).includes('<img src=x'));
}

// ── 5. The pass-label convention ────────────────────────────────────
{
  const label = REG.certificateSecretLabel({ code: 'AIPC-4K7P-9WQ2-MXR8T', kind: 'pdf-unlock', year: '2026' });
  check('A certificate secret label is a store path, not a value',
    label === 'stromex/certificates/aipc/2026/AIPC-4K7P-9WQ2-MXR8T/pdf-unlock', label);
  check('A bad kind is refused', threw(() => REG.certificateSecretLabel({ code: 'AIPC-4K7P-9WQ2-MXR8T', kind: 'password', year: '2026' }), /kind must be one of/) === null);
  check('A non-year is refused', threw(() => REG.certificateSecretLabel({ code: 'AIPC-4K7P-9WQ2-MXR8T', kind: 'pdf-unlock', year: '26' }), /four-digit/) === null);
  check('A malformed code is refused rather than sanitised',
    threw(() => REG.certificateSecretLabel({ code: '../etc/passwd', kind: 'pdf-unlock', year: '2026' }), /valid AIPC/) === null);
}

// ── 5b. The engine is COLLECTIVE, not one institution's (SEB-D 47) ───
{
  // A second institution, defined at call time — the engine owns no
  // institution, it is told who the issuer is.
  const AMICAS = ISS.defineIssuer({
    key: 'amicas',
    legalName: 'Al-Madeenah International College for Arabic & Islamic Studies',
    codePrefix: 'AMIC',
    verifyOrigin: 'https://almadeenah.example',
    sealMark: 'AMIC',
  });
  const cert = R.renderAwardCertificate(AWARD, { issuer: AMICAS });
  check('A certificate renders for a DIFFERENT institution with no engine edits',
    cert.includes('Al-Madeenah International College') && cert.includes('almadeenah.example'));
  check('...and does not leak the default institution into it',
    !cert.includes('Albalagh International Premium College'));

  // The pass label is namespaced by issuer, and a code is validated
  // against THAT issuer's prefix.
  const label = REG.certificateSecretLabel({ code: 'AMIC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: AMICAS });
  check('A secret label is namespaced by the issuer key',
    label === 'stromex/certificates/amicas/2026/AMIC-4K7P-9WQ2-MXR8T/signing-key', label);
  check('An AIPC code is refused under a different issuer\'s namespace',
    threw(() => REG.certificateSecretLabel({ code: 'AIPC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: AMICAS }), /valid AMIC/) === null);
  check('An unknown issuer slug is refused, not guessed',
    threw(() => REG.certificateSecretLabel({ code: 'AMIC-4K7P-9WQ2-MXR8T', kind: 'signing-key', year: '2026', issuer: 'nope' }), /Unknown issuer/) === null);
  check('A profile with a non-https verify origin is refused',
    threw(() => ISS.defineIssuer({ key: 'demo', legalName: 'Demo College', codePrefix: 'DEMO', verifyOrigin: 'http://insecure' }), /https origin/) === null);
}

// ── 6. The Issuance Register document ───────────────────────────────
{
  const doc = REG.renderIssuanceRegister({ entries: [AWARD, { ...AWARD, status: 'revoked', verificationCode: 'AIPC-8T3M-2XK9-P4WQ7' }] });
  const doc2 = REG.renderIssuanceRegister({ entries: [AWARD, { ...AWARD, status: 'revoked', verificationCode: 'AIPC-8T3M-2XK9-P4WQ7' }] });
  check('The register regenerates byte-identically', doc === doc2);
  check('...listing each reference and holder', doc.includes('AIPC-4K7P-9WQ2-MXR8T') && doc.includes('Aisha binte Rahman'));
  check('...showing standing (Active / Withdrawn)', doc.includes('Active') && doc.includes('Withdrawn'));
  check('...and carrying no secret even when one is attached to an entry',
    !REG.renderIssuanceRegister({ entries: [{ ...AWARD, pdfUnlock: 'SECRET-XYZ' }] }).includes('SECRET-XYZ'));
  const empty = REG.renderIssuanceRegister({ entries: [] });
  check('An empty register renders honestly rather than blank', empty.includes('No entries'));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
