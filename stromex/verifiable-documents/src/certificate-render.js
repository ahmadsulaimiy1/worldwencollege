/* Certificate rendering — turning a frozen record back into the document.
 *
 * ────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ────────────────────────────────────────────────────────────────
 * Volume 12 §12.9 records a real gap: the College can VERIFY a
 * certificate but has never been able to PRODUCE the printed document
 * from its own record. Volume 12 §12.12 (SEB-D 46) then made the
 * governing principle explicit — *recoverability over memorability*: a
 * certificate must be reconstructable from its record, never dependent on
 * a code somebody has to remember. This module is that principle made
 * real. It is the exact opposite of the Sultan Hanafi Royal Schools
 * failure, where a lost unlock code sealed a certificate shut forever.
 *
 * ────────────────────────────────────────────────────────────────
 * THE PROPERTY THAT MATTERS, AND IT IS TESTED
 * ────────────────────────────────────────────────────────────────
 * These renderers are PURE and DETERMINISTIC. They take a frozen record
 * and a fixed template and return a byte-identical document every time.
 * No `env`, no database, no `Date.now()`, no randomness — because a
 * document that regenerates differently on Tuesday is not a recovery of
 * the original, it is a new document that merely resembles it. Feed the
 * same award row in a year and you get the same certificate back. That is
 * what "recoverable from its record" means, asserted rather than claimed
 * (see tests/certificate-render.test.mjs).
 *
 * ────────────────────────────────────────────────────────────────
 * WHAT NEVER APPEARS HERE
 * ────────────────────────────────────────────────────────────────
 * No secret is ever rendered. The verification CODE is public by design —
 * it identifies an award, authorises nothing, and is printed on the
 * certificate so a stranger can check it (§12.2). PDF-unlock codes,
 * signing keys and private keys are a different class entirely: they live
 * in the `pass` store (§12.12, see issuance-register.js) and no field of
 * them is accepted by, or emitted from, any function in this file.
 *
 * The design vocabulary is Volume 30's: Fraunces for the display serif,
 * Archivo for text, and Cinzel — the inscriptional `cartouche` role — for
 * the reference number, on the Obsidian/Alabaster/Aurum palette. Fonts
 * degrade to system serif/sans so a regenerated file opens legibly
 * anywhere, which a recovery document must.
 */

import { toSvg } from './qr.js';
import { resolveIssuer, DEFAULT_ISSUER } from './issuer.js';

/**
 * The default verify origin, kept as a named export for callers that only
 * want the string. The engine itself no longer assumes it — every renderer
 * takes an `issuer` profile (issuer.js) and reads the origin from there, so
 * the same code renders for any estate institution.
 */
export const VERIFY_ORIGIN = DEFAULT_ISSUER.verifyOrigin;

const HONOUR_LABEL = {
  pass: 'Pass',
  merit: 'Merit',
  distinction: 'Distinction',
  high_distinction: 'High Distinction',
  college_distinction: 'Distinction of the College',
};

/**
 * Escape text for HTML. Every value that reaches the document goes through
 * this — a holder's name is data, never markup, and a certificate that
 * rendered a name as HTML would be a certificate you could forge with a
 * `<script>` in a registration form.
 */
export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** The public, no-login verification URL for a code (§12.2). */
export function verificationUrl(code, origin = VERIFY_ORIGIN) {
  return `${origin}/verify.html?code=${encodeURIComponent(String(code || ''))}`;
}

/**
 * The one place the estate's certificate typography and palette are
 * defined for a standalone, self-contained document. Inlined rather than
 * linked because a recovery document must open with no network and no
 * asset server — its look is part of the frozen master (§12.10), so it
 * belongs in the template, not in a stylesheet that could drift.
 */
function documentStyle() {
  return `
    :root{
      --sx-obsidian:#0B0C10; --sx-ink:#12141B; --sx-alabaster:#F6F4EF;
      --sx-platinum:#EAE7DF; --sx-pewter:#D6D2C8; --sx-aurum:#C8A24C;
      --sx-aurum-lit:#E8CE8C; --sx-brass:#9A7B3A;
      --sx-display:'Fraunces Variable','Fraunces',Georgia,'Times New Roman',serif;
      --sx-text:'Archivo Variable','Archivo','Helvetica Neue',Arial,sans-serif;
      --sx-cartouche:'Cinzel Variable','Cinzel','Trajan Pro',Georgia,serif;
    }
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:var(--sx-pewter);color:var(--sx-ink);font-family:var(--sx-text)}
    .sheet{
      position:relative;width:297mm;min-height:210mm;margin:0 auto;padding:22mm 24mm;
      background:var(--sx-alabaster);
      border:1.5mm solid var(--sx-aurum);
      outline:0.3mm solid var(--sx-brass);outline-offset:2mm;
    }
    .frame{position:absolute;inset:6mm;border:0.3mm solid var(--sx-brass);pointer-events:none}
    .masthead{text-align:center;letter-spacing:.02em}
    .institution{font-family:var(--sx-cartouche);text-transform:uppercase;letter-spacing:.22em;
      font-size:12pt;color:var(--sx-brass)}
    .kind{font-family:var(--sx-display);font-size:30pt;line-height:1.05;margin:8mm 0 2mm;color:var(--sx-obsidian)}
    .rule{width:44mm;height:0.4mm;background:var(--sx-aurum);margin:4mm auto}
    .conferral{text-align:center;font-size:11pt;color:var(--sx-ink);margin:2mm 0}
    .holder{font-family:var(--sx-display);font-size:26pt;text-align:center;color:var(--sx-obsidian);margin:3mm 0}
    .award{font-family:var(--sx-display);font-size:17pt;text-align:center;color:var(--sx-brass);margin:2mm 0}
    .meta{display:flex;justify-content:center;gap:10mm;flex-wrap:wrap;margin:6mm 0;font-size:10pt;color:var(--sx-ink)}
    .meta b{display:block;font-family:var(--sx-cartouche);letter-spacing:.14em;text-transform:uppercase;
      font-size:8pt;color:var(--sx-brass);margin-bottom:1mm}
    .citation{max-width:170mm;margin:4mm auto;text-align:center;font-style:italic;font-size:10.5pt;color:var(--sx-ink)}
    .foot{position:absolute;left:24mm;right:24mm;bottom:20mm;display:flex;justify-content:space-between;align-items:flex-end}
    .verify{font-size:8.5pt;color:var(--sx-ink);max-width:120mm}
    .cartouche{font-family:var(--sx-cartouche);letter-spacing:.16em;font-size:12pt;color:var(--sx-obsidian)}
    .qr{width:26mm;height:26mm}
    .assurance{margin-top:2mm;font-size:7.5pt;color:var(--sx-brass)}
    @media print{html,body{background:#fff}.sheet{margin:0;border-color:var(--sx-aurum)}}
  `.trim();
}

/**
 * A restrained guilloché rosette, drawn deterministically in-line so the
 * document needs no asset server. Concentric hypotrochoid-style petals —
 * enough to read as a security seal without pulling the full 11 KB master
 * seal. Fixed geometry: the same seal on every certificate, as a frozen
 * master requires (§12.10).
 */
function seal(centreText) {
  const rings = [];
  for (let r = 34; r >= 16; r -= 6) {
    const pts = [];
    const lobes = 24;
    for (let i = 0; i <= 360; i += 3) {
      const a = (i * Math.PI) / 180;
      const rad = r + 3 * Math.cos(lobes * a);
      pts.push(`${(60 + rad * Math.cos(a)).toFixed(2)},${(60 + rad * Math.sin(a)).toFixed(2)}`);
    }
    rings.push(`<polyline points="${pts.join(' ')}" fill="none" stroke="#9A7B3A" stroke-width="0.4"/>`);
  }
  return `<svg class="seal" width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="College seal">
    <circle cx="60" cy="60" r="40" fill="none" stroke="#C8A24C" stroke-width="1"/>
    ${rings.join('')}
    <text x="60" y="64" text-anchor="middle" font-family="'Cinzel Variable',serif" font-size="9"
      letter-spacing="1.5" fill="#0B0C10">${escapeHtml(centreText)}</text>
  </svg>`;
}

/**
 * Normalise an award record from either `signedClaims`/`publicView`
 * (camelCase) or a raw `awards` row (snake_case), so a caller can hand in
 * whichever they hold. Only the fields a certificate asserts are read;
 * anything else on the row is ignored.
 */
function normaliseAward(record) {
  const r = record || {};
  const honour = r.honour ?? null;
  return {
    holderName: r.holderName ?? r.holder_name ?? '',
    awardTitle: r.awardTitle ?? r.award_title ?? '',
    postNominal: r.postNominal ?? r.post_nominal ?? '',
    cefr: r.cefr ?? '',
    honourLabel: r.honourLabel ?? HONOUR_LABEL[honour] ?? honour ?? '',
    credits: r.credits ?? null,
    tqtHours: r.tqtHours ?? r.tqt_hours ?? null,
    citation: r.citation ?? null,
    conferredOn: r.conferredOn ?? r.conferred_on ?? '',
    verificationCode: r.verificationCode ?? r.verification_code ?? '',
    status: r.status ?? 'conferred',
  };
}

/**
 * Render an award certificate as a self-contained, print-ready HTML
 * document, built ONLY from the frozen record. Deterministic: same record
 * and options in, byte-identical document out.
 *
 * `signature`, when passed, is rendered honestly — a development-mode
 * signature says so on the face of the document rather than presenting a
 * padlock it has not earned (mirrors signing.js's own rule).
 */
export function renderAwardCertificate(record, { issuer, signature = null } = {}) {
  const iss = resolveIssuer(issuer);
  const origin = iss.verifyOrigin;
  const a = normaliseAward(record);
  const url = verificationUrl(a.verificationCode, origin);
  const qr = a.verificationCode ? toSvg(url, { level: 'Q', size: 98, label: null }) : '';
  const revoked = a.status === 'revoked' || a.status === 'replaced';

  const meta = [
    a.cefr ? `<span><b>Level</b>${escapeHtml(a.cefr)}</span>` : '',
    a.honourLabel ? `<span><b>Honour</b>${escapeHtml(a.honourLabel)}</span>` : '',
    a.credits != null ? `<span><b>Credits</b>${escapeHtml(a.credits)}</span>` : '',
    a.tqtHours != null ? `<span><b>Notional hours</b>${escapeHtml(a.tqtHours)}</span>` : '',
    a.conferredOn ? `<span><b>Conferred</b>${escapeHtml(a.conferredOn)}</span>` : '',
  ].filter(Boolean).join('');

  const assuranceLine = signature
    ? `<div class="assurance">${
        signature.mode === 'production'
          ? 'Cryptographically signed by the College. Verify the signature at the address above.'
          : 'Signed in development mode — authenticity rests on the Register entry, not on this signature.'
      }</div>`
    : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Certificate — ${escapeHtml(a.holderName)}</title>
<style>${documentStyle()}</style></head>
<body><main class="sheet"><div class="frame"></div>
  <header class="masthead">
    <div class="institution">${escapeHtml(iss.legalName)}</div>
    <h1 class="kind">Certificate of Award</h1>
    <div class="rule"></div>
  </header>
  <p class="conferral">This is to certify that</p>
  <p class="holder">${escapeHtml(a.holderName)}</p>
  <p class="conferral">has been conferred the award of</p>
  <p class="award">${escapeHtml(a.awardTitle)}${a.postNominal ? ` &nbsp;(${escapeHtml(a.postNominal)})` : ''}</p>
  <div class="meta">${meta}</div>
  ${a.citation ? `<p class="citation">${escapeHtml(a.citation)}</p>` : ''}
  ${revoked ? '<p class="citation" style="color:#9A7B3A">This award has been withdrawn. Verify the code for its current standing.</p>' : ''}
  <div class="foot">
    <div class="verify">
      ${seal(iss.sealMark)}
      <div class="cartouche">${escapeHtml(a.verificationCode)}</div>
      Verify at ${escapeHtml(origin)}/verify.html — no account required. This certificate is
      recoverable at any time from the Graduate Register; the code above authorises nothing.
      ${assuranceLine}
    </div>
    <div class="qr">${qr}</div>
  </div>
</main></body></html>`;
}

/**
 * Render a testimonial — the first generalisation of the doctrine
 * (SEB-D 47): a document whose subject is a person, in which the College
 * vouches for them. It is a person-document, so it uses the same
 * machinery as a certificate — a record, a public code, a QR, and the
 * same regeneration guarantee. Deterministic: same record in, byte-
 * identical letter out.
 *
 * The record carries: `subjectName` (who it is about), `body` (the
 * testimonial text), `signatoryName` and `signatoryTitle`, `issuedOn`,
 * `verificationCode`, `status`. Nothing else is read; a secret attached
 * to the record never reaches the page.
 */
export function renderTestimonial(record, { issuer } = {}) {
  const iss = resolveIssuer(issuer);
  const origin = iss.verifyOrigin;
  const r = record || {};
  const subjectName = r.subjectName ?? r.holderName ?? r.holder_name ?? '';
  const body = r.body ?? r.statement ?? '';
  const signatoryName = r.signatoryName ?? r.signatory_name ?? '';
  const signatoryTitle = r.signatoryTitle ?? r.signatory_title ?? '';
  const issuedOn = r.issuedOn ?? r.issued_on ?? r.conferredOn ?? r.conferred_on ?? '';
  const code = r.verificationCode ?? r.verification_code ?? '';
  const status = r.status ?? 'issued';
  const url = verificationUrl(code, origin);
  const qr = code ? toSvg(url, { level: 'Q', size: 98, label: null }) : '';
  const withdrawn = status === 'revoked' || status === 'withdrawn';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Testimonial — ${escapeHtml(subjectName)}</title>
<style>${documentStyle()}
  .body{max-width:172mm;margin:6mm auto;font-size:11.5pt;line-height:1.7;text-align:left;white-space:pre-wrap}
  .sign{max-width:172mm;margin:8mm auto 0;text-align:left}
  .sign .name{font-family:var(--sx-display);font-size:13pt;color:var(--sx-obsidian)}
  .sign .title{font-size:9.5pt;color:var(--sx-brass)}
</style></head>
<body><main class="sheet"><div class="frame"></div>
  <header class="masthead">
    <div class="institution">${escapeHtml(iss.legalName)}</div>
    <h1 class="kind">Testimonial</h1>
    <div class="rule"></div>
  </header>
  <p class="conferral">In respect of</p>
  <p class="holder">${escapeHtml(subjectName)}</p>
  ${issuedOn ? `<p class="conferral">${escapeHtml(issuedOn)}</p>` : ''}
  <div class="body">${escapeHtml(body)}</div>
  <div class="sign">
    <div class="name">${escapeHtml(signatoryName)}</div>
    <div class="title">${escapeHtml(signatoryTitle)}</div>
  </div>
  ${withdrawn ? '<p class="citation" style="color:#9A7B3A">This testimonial has been withdrawn. Verify the code for its current standing.</p>' : ''}
  <div class="foot">
    <div class="verify">
      ${seal(iss.sealMark)}
      <div class="cartouche">${escapeHtml(code)}</div>
      Verify at ${escapeHtml(origin)}/verify.html — no account required. This testimonial is
      recoverable at any time from its record; the code above authorises nothing.
    </div>
    <div class="qr">${qr}</div>
  </div>
</main></body></html>`;
}

/**
 * Render an issued document (transcript, diploma supplement, verification
 * statement) from its FROZEN payload — the `payload_json` stored at issue
 * (documents.js). Deterministic in the same way: this reproduces the
 * document the College sealed, it does not regenerate it from live data
 * (which is exactly the failure documents.js was built to avoid).
 */
export function renderIssuedDocument(record, { issuer } = {}) {
  const iss = resolveIssuer(issuer);
  const origin = iss.verifyOrigin;
  const p = record || {};
  const code = p.verificationCode ?? p.verification_code ?? '';
  const url = verificationUrl(code, origin);
  const qr = code ? toSvg(url, { level: 'Q', size: 98, label: null }) : '';
  const type = p.documentType ?? p.document_type ?? 'document';
  const titleMap = {
    transcript: 'Academic Transcript',
    diploma_supplement: 'Diploma Supplement',
    verification_statement: 'Verification Statement',
  };

  let body = '';
  if (type === 'transcript' && Array.isArray(p.entries)) {
    const rows = p.entries.map((e) => `<tr>
      <td>${escapeHtml(e.roman ?? e.levelId ?? '')}</td>
      <td>${escapeHtml(e.levelName ?? '')}</td>
      <td>${escapeHtml(e.cefr ?? '')}</td>
      <td>${escapeHtml(e.status ?? '')}</td>
      <td>${escapeHtml(e.award ? (e.award.title ?? '') : '')}</td>
    </tr>`).join('');
    body = `<table class="ledger"><thead><tr>
        <th>Level</th><th>Name</th><th>CEFR</th><th>Status</th><th>Award</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <p class="totals">Credits awarded: ${escapeHtml(p.creditsAwarded ?? 0)} · Notional hours: ${escapeHtml(p.tqtHoursAwarded ?? 0)}</p>`;
  } else if (p.statement) {
    body = `<p class="statement">${escapeHtml(p.statement)}</p>`;
  } else if (p.highestAward) {
    body = `<p class="statement">Highest award: ${escapeHtml(p.highestAward.title ?? p.highestAward.awardTitle ?? '')}
      ${p.highestAward.cefr ? `(${escapeHtml(p.highestAward.cefr)})` : ''}</p>`;
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(titleMap[type] ?? 'Document')} — ${escapeHtml(p.holderName ?? '')}</title>
<style>${documentStyle()}
  .ledger{width:100%;border-collapse:collapse;margin:6mm 0;font-size:9.5pt}
  .ledger th{font-family:var(--sx-cartouche);text-transform:uppercase;letter-spacing:.12em;font-size:7.5pt;
    color:var(--sx-brass);text-align:left;border-bottom:0.4mm solid var(--sx-aurum);padding:2mm 3mm}
  .ledger td{padding:2mm 3mm;border-bottom:0.2mm solid var(--sx-pewter)}
  .totals{text-align:center;font-size:9.5pt;color:var(--sx-ink);margin:3mm 0}
  .statement{max-width:170mm;margin:6mm auto;text-align:center;font-size:11pt}
</style></head>
<body><main class="sheet"><div class="frame"></div>
  <header class="masthead">
    <div class="institution">${escapeHtml(iss.legalName)}</div>
    <h1 class="kind">${escapeHtml(titleMap[type] ?? 'Document')}</h1>
    <div class="rule"></div>
  </header>
  <p class="conferral">Issued for</p>
  <p class="holder">${escapeHtml(p.holderName ?? '')}</p>
  ${p.issuedOn ? `<p class="conferral">on ${escapeHtml(p.issuedOn)}</p>` : ''}
  ${body}
  <div class="foot">
    <div class="verify">
      ${seal(iss.sealMark)}
      <div class="cartouche">${escapeHtml(code)}</div>
      Verify at ${escapeHtml(origin)}/verify.html — no account required. This is the document as
      the College sealed it; a newer one may exist without making this one false.
    </div>
    <div class="qr">${qr}</div>
  </div>
</main></body></html>`;
}

/**
 * A monogram tile — the deterministic placeholder for a holder photo.
 *
 * An ID card names a person and usually bears their photograph, but a
 * photograph is data the caller supplies (as a data: URI on the record).
 * When none is given the card must still render — and a recovery document
 * must render with no network — so it shows the holder's initials struck
 * in gold on obsidian rather than a broken image. Deterministic: the same
 * name yields the same monogram.
 */
function monogram(name) {
  const initials = String(name || '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  return `<div class="idc__mono">${escapeHtml(initials || '·')}</div>`;
}

/**
 * Render an identity card — a person-document, and the first generalisation
 * to a NON-paper form (SEB-D 47). Two faces at ISO/IEC 7810 ID-1 size
 * (85.6 × 54 mm, the real bank-card standard — a prestige detail that is
 * also simply correct), regenerable byte-identically from the record.
 *
 * The card is a verifiable document in its own right: it carries a
 * verification code and a QR that resolve at the issuer's portal, so a
 * gate officer or a librarian can confirm it without trusting the plastic.
 *
 * Record: `holderName`, `role` (Student / Faculty / Alumnus / Staff),
 * `membershipId` (the printed member number; defaults to the code),
 * `validFrom`, `validThru`, `verificationCode`, `status`, and an optional
 * `photoDataUri` (a self-contained data: URI — never a remote URL, which
 * would break both determinism and offline recovery).
 */
export function renderIdCard(record, { issuer } = {}) {
  const iss = resolveIssuer(issuer);
  const origin = iss.verifyOrigin;
  const r = record || {};
  const holderName = r.holderName ?? r.holder_name ?? '';
  const role = r.role ?? 'Member';
  const code = r.verificationCode ?? r.verification_code ?? '';
  const membershipId = r.membershipId ?? r.membership_id ?? code;
  const validFrom = r.validFrom ?? r.valid_from ?? '';
  const validThru = r.validThru ?? r.valid_thru ?? '';
  const status = r.status ?? 'active';
  const photo = typeof r.photoDataUri === 'string' && r.photoDataUri.startsWith('data:')
    ? `<img class="idc__photo-img" alt="" src="${escapeHtml(r.photoDataUri)}">`
    : monogram(holderName);
  const url = verificationUrl(code, origin);
  const qr = code ? toSvg(url, { level: 'Q', size: 84, label: null }) : '';
  const revoked = status === 'revoked' || status === 'withdrawn' || status === 'expired';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Identity Card — ${escapeHtml(holderName)}</title>
<style>
  :root{
    --sx-obsidian:#0B0C10;--sx-ink:#12141B;--sx-graphite:#1B1E27;--sx-alabaster:#F6F4EF;
    --sx-pewter:#D6D2C8;--sx-aurum:#C8A24C;--sx-aurum-lit:#E8CE8C;--sx-brass:#9A7B3A;
    --sx-display:'Fraunces Variable','Fraunces',Georgia,serif;
    --sx-text:'Archivo Variable','Archivo','Helvetica Neue',Arial,sans-serif;
    --sx-cartouche:'Cinzel Variable','Cinzel','Trajan Pro',Georgia,serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--sx-pewter);font-family:var(--sx-text);padding:12mm;display:flex;
    flex-wrap:wrap;gap:10mm;justify-content:center;align-items:flex-start}
  .idc{position:relative;width:85.6mm;height:54mm;border-radius:3.2mm;overflow:hidden;
    color:var(--sx-alabaster);
    background:
      radial-gradient(120% 140% at 12% -10%, rgba(232,206,140,.16), transparent 42%),
      linear-gradient(150deg, var(--sx-graphite), var(--sx-obsidian) 62%);
    box-shadow:0 1mm 3mm rgba(11,12,16,.35);
    outline:0.25mm solid var(--sx-aurum);outline-offset:-1.4mm}
  .idc__guilloche{position:absolute;inset:0;opacity:.10;pointer-events:none}
  .idc__hair{position:absolute;inset:2.2mm;border:0.2mm solid rgba(200,162,76,.5);border-radius:2mm;pointer-events:none}
  .idc__inst{position:absolute;top:3.4mm;left:5mm;right:5mm;font-family:var(--sx-cartouche);
    text-transform:uppercase;letter-spacing:.16em;font-size:6pt;color:var(--sx-aurum-lit)}
  .idc__kind{position:absolute;top:3.4mm;right:5mm;font-family:var(--sx-cartouche);
    letter-spacing:.24em;font-size:5.5pt;color:var(--sx-brass)}
  .idc__photo{position:absolute;left:5mm;top:11mm;width:22mm;height:28mm;border-radius:1.6mm;
    overflow:hidden;border:0.3mm solid var(--sx-aurum);
    background:linear-gradient(160deg,var(--sx-graphite),var(--sx-obsidian));
    display:flex;align-items:center;justify-content:center}
  .idc__photo-img{width:100%;height:100%;object-fit:cover}
  .idc__mono{font-family:var(--sx-display);font-size:20pt;color:var(--sx-aurum);letter-spacing:.02em}
  .idc__body{position:absolute;left:30mm;right:5mm;top:12mm}
  .idc__name{font-family:var(--sx-display);font-size:12pt;line-height:1.05;color:#fff}
  .idc__role{font-family:var(--sx-cartouche);text-transform:uppercase;letter-spacing:.16em;
    font-size:6.5pt;color:var(--sx-aurum-lit);margin-top:1.2mm}
  .idc__field{margin-top:2.6mm;font-size:6.5pt;color:var(--sx-pewter)}
  .idc__field b{display:block;font-family:var(--sx-cartouche);text-transform:uppercase;
    letter-spacing:.12em;font-size:5pt;color:var(--sx-brass);margin-bottom:.4mm}
  .idc__id{font-family:var(--sx-cartouche);letter-spacing:.10em;font-size:8pt;color:#fff}
  .idc__qr{position:absolute;right:4.4mm;bottom:4mm;width:15mm;height:15mm;background:#fff;
    padding:.6mm;border-radius:1mm}
  .idc__seal{position:absolute;left:5mm;bottom:3mm;width:14mm;height:14mm;opacity:.9}
  .idc--revoked::after{content:'WITHDRAWN';position:absolute;inset:0;display:flex;align-items:center;
    justify-content:center;font-family:var(--sx-cartouche);letter-spacing:.3em;font-size:12pt;
    color:rgba(184,80,80,.85);transform:rotate(-16deg)}
  /* Back face */
  .idc--back{background:linear-gradient(150deg,var(--sx-obsidian),var(--sx-graphite))}
  .idc__band{position:absolute;left:0;right:0;top:8mm;height:9mm;background:var(--sx-obsidian);
    border-top:0.2mm solid var(--sx-brass);border-bottom:0.2mm solid var(--sx-brass)}
  .idc__note{position:absolute;left:5mm;right:5mm;bottom:4mm;font-size:5.6pt;line-height:1.5;color:var(--sx-pewter)}
  .idc__note .v{color:var(--sx-aurum-lit)}
  @media print{body{background:#fff;padding:0}.idc{box-shadow:none}}
</style></head>
<body>
  <section class="idc${revoked ? ' idc--revoked' : ''}" aria-label="Identity card, front">
    <div class="idc__guilloche">${seal(iss.sealMark)}</div>
    <div class="idc__hair"></div>
    <div class="idc__inst">${escapeHtml(iss.legalName)}</div>
    <div class="idc__kind">Identity</div>
    <div class="idc__photo">${photo}</div>
    <div class="idc__body">
      <div class="idc__name">${escapeHtml(holderName)}</div>
      <div class="idc__role">${escapeHtml(role)}</div>
      <div class="idc__field"><b>Member №</b><span class="idc__id">${escapeHtml(membershipId)}</span></div>
      <div class="idc__field"><b>Valid</b>${escapeHtml(validFrom)}${validFrom && validThru ? ' — ' : ''}${escapeHtml(validThru)}</div>
    </div>
    <div class="idc__qr">${qr}</div>
  </section>
  <section class="idc idc--back" aria-label="Identity card, back">
    <div class="idc__guilloche">${seal(iss.sealMark)}</div>
    <div class="idc__hair"></div>
    <div class="idc__band"></div>
    <div class="idc__seal">${seal(iss.sealMark)}</div>
    <div class="idc__note">
      This card remains the property of ${escapeHtml(iss.legalName)} and must be surrendered on request.
      It is a verifiable document: confirm it at <span class="v">${escapeHtml(origin)}/verify.html</span>
      with the code <span class="v">${escapeHtml(code)}</span> — no account required. The card
      authorises nothing on its own; the record it points to is the authority, and is recoverable at any time.
    </div>
  </section>
</body></html>`;
}
