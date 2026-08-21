/* Artifact-documents — provenance for books, editions and printed matter.
 *
 * ────────────────────────────────────────────────────────────────
 * THE OTHER HALF OF THE DOCTRINE
 * ────────────────────────────────────────────────────────────────
 * SEB-D 47 rules two subjects, and this module is the second one.
 *
 *   A PERSON-document asks "did the College issue this, to this person?"
 *   An ARTIFACT-document asks "is this the genuine edition, UNALTERED?"
 *
 * The second question is answered by a CONTENT DIGEST — a SHA-256
 * fingerprint computed over every word of the edition. Change one
 * character of one lesson and the digest changes, so two copies bearing
 * the same Document ID carry identical content, and a copy bearing a
 * different one is a different edition however similar it looks. The
 * estate already computes this at print time
 * (`scripts/publication/identity.mjs`); what did not exist was anything
 * that RESOLVES it. A QR printed into a physical book that resolves to
 * nothing is a promise the College cannot keep — and books are already
 * in print carrying one.
 *
 * ────────────────────────────────────────────────────────────────
 * THE HONESTY BOUND, INHERITED VERBATIM
 * ────────────────────────────────────────────────────────────────
 * `identity.mjs` refuses to print an invented ISBN, DOI or legal-deposit
 * number, naming the external authority instead — fabricating one would
 * forge a third party's registry. This module carries that rule through
 * to the rendered record, and adds the matching honesty about the digest
 * itself: a content digest proves CONTENT IDENTITY, not authorship and
 * not provenance of the physical copy. Saying more than that would teach
 * a reader to trust a check that does not hold.
 */

import { escapeHtml } from './certificate-render.js';
import { resolveIssuer } from './issuer.js';
import { toSvg } from './qr.js';

/** What a content digest does and does not prove. Stated on every record. */
export const DIGEST_NOTICE =
  'The Document ID is a rendering of a SHA-256 digest computed over the complete content of this '
  + 'edition. Two copies bearing the same Document ID carry identical content; a copy bearing a '
  + 'different one is a different edition, however similar it appears. The digest covers content '
  + 'only: it is not a signature, it does not certify authorship, and it does not prove that a '
  + 'particular physical copy came from the College.';

/**
 * The public verification URL for an artifact-document. Unlike a
 * person-document (which is found by its verification code), an edition is
 * found by its Document ID, so the path differs and the issuer's origin is
 * still the authority for where it lives.
 */
export function publicationVerifyUrl(documentId, origin) {
  return `${origin}/verify.html?doc=${encodeURIComponent(String(documentId || ''))}`;
}

/**
 * Compare a digest computed NOW over a copy in hand against the digest of
 * record. Pure, and deliberately total: every outcome is a true answer to
 * a fair question, never an error and never a fabricated verdict — the
 * three-honest-states rule (§12.2), in artifact form.
 *
 * `identical`  the copy's content matches the edition of record
 * `altered`    a record exists, and this copy's content is NOT it
 * `not_found`  no edition of record carries that Document ID
 * `malformed`  the input is not a digest at all
 */
export function compareDigest({ recordDigest, candidateDigest } = {}) {
  const norm = (d) => String(d || '').trim().toLowerCase();
  const a = norm(recordDigest);
  const b = norm(candidateDigest);
  if (!/^[0-9a-f]{64}$/.test(b)) {
    return { outcome: 'malformed',
      message: 'That is not a SHA-256 content digest. A digest is 64 hexadecimal characters.' };
  }
  if (!/^[0-9a-f]{64}$/.test(a)) {
    return { outcome: 'not_found',
      message: 'No edition of record carries that Document ID.' };
  }
  if (a === b) {
    return { outcome: 'identical',
      message: 'This copy carries the content of the edition of record, unaltered.' };
  }
  return { outcome: 'altered',
    message: 'An edition of record exists under this Document ID, and this copy\'s content is not it. '
      + 'The copy has been altered, or it is a different edition than it claims.' };
}

/**
 * Render an edition's provenance record — the artifact-document that a
 * reader holding a book reaches by its QR. Pure and deterministic: the
 * same record renders byte-identically, so it is itself recoverable.
 *
 * Record fields (all non-secret, all already computed by identity.mjs):
 * `title`, `documentId`, `contentDigest`, `issueCode`, `editionName`,
 * `publicationId`, `year`, `printIdentifier`, `counts`, `registrations`
 * (the honest not-assigned rows), and `status`.
 */
export function renderPublicationRecord(record, { issuer } = {}) {
  const iss = resolveIssuer(issuer);
  const origin = iss.verifyOrigin;
  const r = record || {};
  const documentId = r.documentId ?? r.document_id ?? '';
  const title = r.title ?? 'Edition of record';
  const status = r.status ?? 'in-print';
  const withdrawn = status === 'withdrawn' || status === 'superseded';
  const url = publicationVerifyUrl(documentId, origin);
  const qr = documentId ? toSvg(url, { level: 'Q', size: 96, label: null }) : '';

  const row = (k, v) => (v === undefined || v === null || v === ''
    ? '' : `<tr><th scope="row">${escapeHtml(k)}</th><td class="mono">${escapeHtml(v)}</td></tr>`);

  const registrations = Array.isArray(r.registrations) ? r.registrations : [];
  const regRows = registrations.map((g) => `<tr>
      <th scope="row">${escapeHtml(g.field)}</th>
      <td class="mono">${escapeHtml(g.value)}</td>
      <td class="auth">${escapeHtml(g.authority)}</td>
    </tr>`).join('');

  const counts = r.counts && typeof r.counts === 'object'
    ? Object.entries(r.counts).map(([k, v]) =>
      `<span><b>${escapeHtml(k)}</b>${escapeHtml(v)}</span>`).join('') : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Edition of Record — ${escapeHtml(title)}</title>
<style>
  :root{
    --sx-obsidian:#0B0C10;--sx-ink:#12141B;--sx-graphite:#1B1E27;--sx-alabaster:#F6F4EF;
    --sx-platinum:#EAE7DF;--sx-pewter:#D6D2C8;--sx-aurum:#C8A24C;--sx-aurum-lit:#E8CE8C;--sx-brass:#9A7B3A;
    --sx-display:'Fraunces Variable','Fraunces',Georgia,serif;
    --sx-text:'Archivo Variable','Archivo','Helvetica Neue',Arial,sans-serif;
    --sx-cartouche:'Cinzel Variable','Cinzel','Trajan Pro',Georgia,serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--sx-obsidian);font-family:var(--sx-text);color:var(--sx-alabaster);
    padding:32px 20px;line-height:1.55}
  .wrap{max-width:920px;margin:0 auto;background:var(--sx-alabaster);color:var(--sx-ink);
    border:1px solid var(--sx-aurum);border-radius:2px;overflow:hidden}
  header{padding:26px 32px;border-bottom:2px solid var(--sx-aurum);
    background:linear-gradient(180deg,var(--sx-platinum),var(--sx-alabaster));
    display:flex;justify-content:space-between;gap:24px;align-items:flex-start}
  .inst{font-family:var(--sx-cartouche);text-transform:uppercase;letter-spacing:.2em;
    font-size:10px;color:var(--sx-brass)}
  h1{font-family:var(--sx-display);font-size:25px;color:var(--sx-obsidian);margin-top:6px;font-weight:600}
  .kind{font-family:var(--sx-cartouche);letter-spacing:.18em;text-transform:uppercase;
    font-size:9px;color:var(--sx-brass);margin-top:8px}
  .qr{width:88px;height:88px;flex:none}
  .status{padding:12px 32px;font-family:var(--sx-cartouche);letter-spacing:.16em;
    text-transform:uppercase;font-size:10px;
    background:${withdrawn ? '#7a2e2e' : 'var(--sx-obsidian)'};color:var(--sx-aurum-lit)}
  table{width:100%;border-collapse:collapse}
  th,td{padding:10px 32px;border-bottom:1px solid var(--sx-pewter);font-size:13px;text-align:left;
    vertical-align:top}
  th{font-family:var(--sx-cartouche);text-transform:uppercase;letter-spacing:.1em;font-size:9.5px;
    color:var(--sx-brass);width:34%}
  .mono{font-family:var(--sx-cartouche);letter-spacing:.06em;word-break:break-all;color:var(--sx-obsidian)}
  .auth{font-size:11.5px;color:var(--sx-ink);opacity:.8}
  .section{padding:16px 32px 4px;font-family:var(--sx-cartouche);text-transform:uppercase;
    letter-spacing:.16em;font-size:9.5px;color:var(--sx-brass);border-top:1px solid var(--sx-aurum)}
  .counts{display:flex;flex-wrap:wrap;gap:22px;padding:12px 32px 18px;font-size:13px}
  .counts b{display:block;font-family:var(--sx-cartouche);text-transform:uppercase;letter-spacing:.12em;
    font-size:9px;color:var(--sx-brass)}
  .notice{padding:18px 32px;font-size:12px;color:var(--sx-ink);background:var(--sx-platinum);
    border-top:1px solid var(--sx-pewter)}
  footer{padding:16px 32px;background:var(--sx-obsidian);color:var(--sx-pewter);font-size:11.5px}
  footer .v{color:var(--sx-aurum-lit)}
</style></head>
<body><div class="wrap">
  <header>
    <div>
      <div class="inst">${escapeHtml(iss.legalName)}</div>
      <h1>${escapeHtml(title)}</h1>
      <div class="kind">Edition of Record</div>
    </div>
    <div class="qr">${qr}</div>
  </header>
  <div class="status">${withdrawn ? 'Withdrawn / superseded — see the note below' : 'In print — this is the edition of record'}</div>
  <table>
    ${row('Document ID', documentId)}
    ${row('Content digest (SHA-256)', r.contentDigest ?? r.content_digest)}
    ${row('Issue', r.issueCode ?? r.issue_code)}
    ${row('Edition', r.editionName ?? r.edition_name)}
    ${row('Publication ID', r.publicationId ?? r.publication_id)}
    ${row('Print identifier', r.printIdentifier ?? r.print_identifier)}
    ${row('Year', r.year)}
  </table>
  ${counts ? `<div class="section">Extent</div><div class="counts">${counts}</div>` : ''}
  ${regRows ? `<div class="section">External registrations — what the College does NOT hold</div>
    <table>${regRows}</table>` : ''}
  <p class="notice">${escapeHtml(DIGEST_NOTICE)}</p>
  <footer>Verify any edition at <span class="v">${escapeHtml(origin)}/verify.html</span> — no account
    required. This record is recoverable from the edition's own content at any time.</footer>
</div></body></html>`;
}
