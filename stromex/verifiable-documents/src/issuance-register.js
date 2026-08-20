/* The Issuance Register, and the certificate-secret label convention.
 *
 * These are the two artefacts Volume 12 §12.12 (SEB-D 46) calls for and
 * that did not exist yet:
 *
 *   §12.12(4)  A BEAUTIFULLY DESIGNED, FINDABLE issuance register holding
 *              the NON-SECRET facts of issuance — reference numbers, verify
 *              links, holders, dates, current standing. It is the document
 *              that is *meant* to be opened and read. It carries no code
 *              that could unlock or forge a certificate; it points at
 *              records, it does not embody power.
 *
 *   §12.12(3)  The `pass` LABEL CONVENTION for the SECRETS — PDF-unlock
 *              codes, signing keys, private keys. Those never go in the
 *              repository and never go in the register above; they live in
 *              the GPG-encrypted `pass` store, each under its own label,
 *              deliberately scattered rather than gathered into one master
 *              document (a single page of every code would itself be a
 *              forgery key). This module computes the label — never the
 *              value. No function here accepts or returns a secret.
 *
 * The register is deterministic and pure, for the same reason the
 * certificate renderer is (certificate-render.js): a register you can
 * regenerate identically from the record is a register you can trust as a
 * recovery, not merely as a snapshot.
 */

import { escapeHtml, verificationUrl } from './certificate-render.js';
import { resolveIssuer, codePattern } from './issuer.js';

/** The kinds of certificate secret the estate stores. Each is a `pass` leaf. */
export const SECRET_KINDS = ['pdf-unlock', 'signing-key', 'private-key'];

/**
 * The canonical `pass` label for one certificate secret.
 *
 * Returns a STORE PATH, never a value — e.g.
 *   stromex/certificates/aipc/2026/AIPC-4K7P-9WQ2-MXR8T/pdf-unlock
 *
 * The label is derived only from non-secret identifiers (the ISSUER, the
 * year, the public verification code, the kind of secret) — never from a
 * hardcoded institution, so the convention is collective across every
 * estate project. Every segment is validated against a strict alphabet
 * rather than escaped, because a label is interpolated into a `pass`
 * command line and refusing a bad segment is verifiable where escaping is
 * a class of bug (the same rule secret.ts applies to secret names).
 *
 * `issuer` may be a profile, a known slug, or omitted (defaults to the
 * default issuer). The code is validated against THAT issuer's prefix, so
 * an AIPC code cannot be filed under Al-Madeenah's namespace by accident.
 */
export function certificateSecretLabel({ code, kind, year, issuer } = {}) {
  const iss = resolveIssuer(issuer);
  if (!SECRET_KINDS.includes(kind)) {
    throw new Error(`kind must be one of: ${SECRET_KINDS.join(', ')}.`);
  }
  const y = String(year ?? '');
  if (!/^[0-9]{4}$/.test(y)) {
    throw new Error('year must be a four-digit calendar year.');
  }
  // The verification code is the public identifier. It uses the issuer's
  // fixed alphabet (its prefix plus 2/3/4-9/A-Z minus ambiguous glyphs), so
  // a code that does not match that shape is not one of this issuer's
  // documents and is refused rather than sanitised into a plausible path.
  const c = String(code || '').toUpperCase();
  if (!codePattern(iss.codePrefix).test(c)) {
    throw new Error(`code must be a valid ${iss.codePrefix} verification code, e.g. ${iss.codePrefix}-XXXX-XXXX-XXXXX.`);
  }
  return `stromex/certificates/${iss.key}/${y}/${c}/${kind}`;
}

/**
 * A single register entry, reduced to what is safe to publish. Anything
 * not in this shape — marks, contact details, and above all any secret —
 * is dropped here rather than trusted to be absent upstream.
 */
function safeEntry(raw) {
  const r = raw || {};
  const code = r.verificationCode ?? r.verification_code ?? '';
  const year = String(r.conferredOn ?? r.conferred_on ?? r.issuedOn ?? '').slice(0, 4);
  return {
    code,
    holderName: r.holderName ?? r.holder_name ?? '',
    title: r.awardTitle ?? r.award_title ?? r.documentType ?? r.document_type ?? '',
    date: r.conferredOn ?? r.conferred_on ?? r.issuedOn ?? r.issued_at ?? '',
    status: r.status ?? 'conferred',
    year,
  };
}

const STATUS_LABEL = {
  conferred: 'Active',
  issued: 'Active',
  valid: 'Active',
  revoked: 'Withdrawn',
  replaced: 'Replaced',
  superseded: 'Superseded',
  withdrawn: 'Withdrawn',
  expired: 'Expired',
};

/**
 * Render the Issuance Register as a self-contained, beautifully designed
 * HTML document. Non-secret by construction: it is built from `safeEntry`,
 * which knows no secret field, and it emits the public verification code
 * (which authorises nothing) plus a verify link — never an unlock code, a
 * key, or any store label.
 *
 * `entries` may be award rows or issued-document rows, in either case /
 * casing; they are reduced to safe entries and rendered in the order
 * given (the caller decides ordering, because "by date" and "by holder"
 * are both legitimate and this function should not silently pick one).
 */
export function renderIssuanceRegister(
  { title = 'Issuance Register', subtitle = null, entries = [] } = {},
  { issuer } = {},
) {
  const iss = resolveIssuer(issuer);
  const origin = iss.verifyOrigin;
  const heading = subtitle ?? iss.legalName;
  const rows = entries.map(safeEntry).map((e) => `<tr>
      <td class="cartouche">${escapeHtml(e.code)}</td>
      <td>${escapeHtml(e.holderName)}</td>
      <td>${escapeHtml(e.title)}</td>
      <td>${escapeHtml(e.date)}</td>
      <td class="status status--${escapeHtml(e.status)}">${escapeHtml(STATUS_LABEL[e.status] ?? e.status)}</td>
      <td><a href="${escapeHtml(verificationUrl(e.code, origin))}">verify</a></td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  :root{
    --sx-obsidian:#0B0C10;--sx-ink:#12141B;--sx-alabaster:#F6F4EF;--sx-platinum:#EAE7DF;
    --sx-pewter:#D6D2C8;--sx-aurum:#C8A24C;--sx-brass:#9A7B3A;
    --sx-display:'Fraunces Variable','Fraunces',Georgia,serif;
    --sx-text:'Archivo Variable','Archivo','Helvetica Neue',Arial,sans-serif;
    --sx-cartouche:'Cinzel Variable','Cinzel','Trajan Pro',Georgia,serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--sx-obsidian);color:var(--sx-alabaster);font-family:var(--sx-text);
    padding:32px 20px;line-height:1.5}
  .wrap{max-width:1000px;margin:0 auto;background:var(--sx-alabaster);color:var(--sx-ink);
    border:1px solid var(--sx-aurum);border-radius:2px;overflow:hidden}
  header{padding:28px 32px;border-bottom:2px solid var(--sx-aurum);
    background:linear-gradient(180deg,var(--sx-platinum),var(--sx-alabaster))}
  h1{font-family:var(--sx-display);font-size:26px;color:var(--sx-obsidian);font-weight:600}
  .sub{font-family:var(--sx-cartouche);text-transform:uppercase;letter-spacing:.2em;
    font-size:11px;color:var(--sx-brass);margin-top:6px}
  .note{padding:14px 32px;font-size:12.5px;color:var(--sx-ink);background:var(--sx-platinum);
    border-bottom:1px solid var(--sx-pewter)}
  table{width:100%;border-collapse:collapse}
  th{font-family:var(--sx-cartouche);text-transform:uppercase;letter-spacing:.12em;font-size:10px;
    color:var(--sx-brass);text-align:left;padding:12px 16px;border-bottom:1px solid var(--sx-aurum)}
  td{padding:11px 16px;border-bottom:1px solid var(--sx-pewter);font-size:13px;vertical-align:top}
  tr:last-child td{border-bottom:none}
  .cartouche{font-family:var(--sx-cartouche);letter-spacing:.08em;color:var(--sx-obsidian)}
  .status{font-size:11px;font-weight:600}
  .status--conferred,.status--issued,.status--valid{color:var(--sx-brass)}
  .status--revoked,.status--withdrawn{color:#7a2e2e}
  .status--replaced,.status--superseded,.status--expired{color:var(--sx-ink)}
  a{color:var(--sx-brass)}
  footer{padding:18px 32px;font-size:11.5px;color:var(--sx-ink);background:var(--sx-obsidian);
    color:var(--sx-alabaster)}
  .empty{padding:40px 32px;text-align:center;color:var(--sx-ink);font-style:italic}
</style></head>
<body><div class="wrap">
  <header>
    <h1>${escapeHtml(title)}</h1>
    <div class="sub">${escapeHtml(heading)}</div>
  </header>
  <p class="note">This register holds only what is safe to read: the public reference number, the
    holder, the award, the date, the current standing and a verification link. It contains no
    unlock code, signing key or password — those live in the encrypted store, never here (§12.12).
    Every certificate below is recoverable from its Register record.</p>
  ${entries.length
    ? `<table><thead><tr>
        <th>Reference</th><th>Holder</th><th>Award / Document</th><th>Date</th><th>Standing</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table>`
    : '<p class="empty">No entries. As certificates are issued they appear here, newest as the caller orders them.</p>'}
  <footer>Recoverability over memorability — a certificate is reconstructable from this record, and
    no code has to be remembered to open it. Verify any entry at ${escapeHtml(origin)}/verify.html</footer>
</div></body></html>`;
}
