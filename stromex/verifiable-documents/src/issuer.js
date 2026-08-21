/* The Issuer Profile — what makes the verifiable-document engine COLLECTIVE.
 *
 * ────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ────────────────────────────────────────────────────────────────
 * The verifiable-document engine (certificate-render.js,
 * issuance-register.js) is a SHARED estate capability, not a feature of
 * one school. SEB-D 47 records the doctrine; this module is the seam that
 * keeps it honest: every value that belongs to a *particular* institution
 * — its legal name, its verification-code prefix, its verify origin, its
 * seal mark, its `pass` namespace — lives HERE, in a profile the caller
 * supplies, and NOWHERE in the engine.
 *
 * So the engine renders a certificate for Albalagh, for Al-Madeenah, for
 * Sultan Hanafi Royal Schools, or for any future project, with the same
 * code and no edits — it is told who the issuer is, it does not assume.
 * An engine that hardcodes one institution is not a collective capability;
 * it is that institution's private tool wearing a general name.
 *
 * ────────────────────────────────────────────────────────────────
 * THE HONESTY BOUND (carried from identity.mjs and SEB-D 47)
 * ────────────────────────────────────────────────────────────────
 * A profile asserts only what its institution can itself stand behind. We
 * define concretely only the profiles whose facts are known. A project
 * without a settled legal name or a live domain does not get an invented
 * one — `defineIssuer` is the factory that adds it when the facts exist.
 */

/**
 * A concrete issuer profile. `key` namespaces `pass` labels and is the
 * project's short handle; `codePrefix` is the verification-code namespace;
 * `verifyOrigin` is where its no-login verify portal lives; `sealMark` is
 * the short text struck into the document seal.
 */
export function defineIssuer({ key, legalName, codePrefix, verifyOrigin, sealMark }) {
  const k = String(key || '').toLowerCase();
  if (!/^[a-z0-9-]{2,32}$/.test(k)) {
    throw new Error('issuer.key must be a short slug of a–z, 0–9 and hyphens.');
  }
  if (!/^[A-Z][A-Z0-9]{1,11}$/.test(String(codePrefix || ''))) {
    throw new Error('issuer.codePrefix must be 2–12 uppercase letters/digits, e.g. WEC.');
  }
  if (!/^https:\/\/[^\s/]+$/.test(String(verifyOrigin || ''))) {
    throw new Error('issuer.verifyOrigin must be an https origin with no trailing path.');
  }
  const name = String(legalName || '').trim();
  if (name.length < 2) throw new Error('issuer.legalName is required.');
  return Object.freeze({
    key: k,
    legalName: name,
    codePrefix: codePrefix,
    verifyOrigin: verifyOrigin.replace(/\/+$/, ''),
    sealMark: String(sealMark || codePrefix).slice(0, 6),
  });
}

/**
 * The one profile whose facts are settled today: Worldwide English
 * College, whose live register issues `WEC-` codes and whose
 * portal is www.worldwencollege.co.uk — the origin the site is actually
 * served from. It is the DEFAULT only so that existing
 * callers keep working; it holds no privileged status in the engine.
 */
export const WEC = defineIssuer({
  key: 'wec',
  legalName: 'Worldwide English College — London Campus',
  codePrefix: 'WEC',
  verifyOrigin: 'https://www.worldwencollege.co.uk',
  sealMark: 'WEC',
});

/**
 * The registry of known issuers, keyed by slug. Other estate institutions
 * (Al-Madeenah, Sultan Hanafi Royal Schools, …) are added with
 * `defineIssuer` once their legal name and domain are settled — not
 * before, per the honesty bound.
 */
export const ISSUERS = { wec: WEC };

/** The default issuer used when a caller supplies none. */
export const DEFAULT_ISSUER = WEC;

/**
 * Resolve whatever a caller passed — a profile object, a known slug, or
 * nothing — to a validated issuer profile. Passing an object re-validates
 * it, so a hand-built profile cannot smuggle a bad origin or prefix into a
 * rendered document.
 */
export function resolveIssuer(issuer) {
  if (!issuer) return DEFAULT_ISSUER;
  if (typeof issuer === 'string') {
    const found = ISSUERS[issuer.toLowerCase()];
    if (!found) throw new Error(`Unknown issuer "${issuer}". Define it with defineIssuer() first.`);
    return found;
  }
  // A frozen profile from this module is already validated; anything else
  // is re-run through the factory so its invariants are enforced.
  return Object.isFrozen(issuer) && issuer.key ? issuer : defineIssuer(issuer);
}

/** The verification-code shape for one issuer, e.g. /^WEC-…$/ for Worldwide English College. */
export function codePattern(codePrefix) {
  return new RegExp(`^${codePrefix}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{5}$`);
}
