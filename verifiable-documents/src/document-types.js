/* The Document-Type Registry — where "room for everything to come" lives.
 *
 * ────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ────────────────────────────────────────────────────────────────
 * SEB-D 47 rules that the class of verifiable documents is open and will
 * grow — certificates today; ID cards, reference letters, book editions,
 * fee receipts and things not yet imagined tomorrow. An engine that meets
 * that with a `switch` statement forces a code change for every new kind,
 * and code changes are where regressions live.
 *
 * So the engine meets it with a REGISTRY instead. Each type is one
 * declarative entry — its human title, its subject (person or artifact),
 * and the pure renderer that turns a record into a document. Adding a kind
 * the estate decides to issue is `register(...)`, not a new branch through
 * the renderer. That is the headroom the Founder asked for: the future is
 * data here, not a rewrite.
 *
 * The registry owns no institution — every renderer still takes an issuer
 * (issuer.js), so a registered type renders for any estate project.
 */

import {
  renderAwardCertificate,
  renderTestimonial,
  renderIssuedDocument,
  renderIdCard,
} from './certificate-render.js';

/** The two subjects a verifiable document can have (SEB-D 47). */
export const SUBJECTS = ['person', 'artifact'];

/**
 * The built-in types. Each entry is `{ title, subject, render }`. The key
 * is the stable identifier a caller names; the title is what a human reads.
 * Ordered as a person would meet them, not alphabetically.
 */
const REGISTRY = new Map();

function seed(key, def) {
  REGISTRY.set(key, freezeType(key, def));
}

function freezeType(key, def) {
  if (!/^[a-z][a-z0-9-]{1,40}$/.test(String(key || ''))) {
    throw new Error(`document type key "${key}" must be a lowercase slug, e.g. "id-card".`);
  }
  if (!SUBJECTS.includes(def.subject)) {
    throw new Error(`document type "${key}" needs subject one of: ${SUBJECTS.join(', ')}.`);
  }
  if (typeof def.render !== 'function') {
    throw new Error(`document type "${key}" needs a render(record, { issuer }) function.`);
  }
  if (!def.title || String(def.title).length < 2) {
    throw new Error(`document type "${key}" needs a human title.`);
  }
  return Object.freeze({ key, title: def.title, subject: def.subject, render: def.render });
}

seed('award-certificate', { title: 'Certificate of Award', subject: 'person', render: renderAwardCertificate });
seed('testimonial', { title: 'Testimonial', subject: 'person', render: renderTestimonial });
seed('id-card', { title: 'Identity Card', subject: 'person', render: renderIdCard });
// The frozen issued documents (documents.js) share one renderer, keyed by
// the payload's own documentType; registered here so the catalogue is whole.
seed('transcript', { title: 'Academic Transcript', subject: 'person', render: renderIssuedDocument });
seed('diploma-supplement', { title: 'Diploma Supplement', subject: 'person', render: renderIssuedDocument });
seed('verification-statement', { title: 'Verification Statement', subject: 'person', render: renderIssuedDocument });

/**
 * Register a NEW verifiable-document type — the extension point. Refuses to
 * silently overwrite a built-in unless `replace` is set, because shadowing
 * "award-certificate" by accident is a footgun, not a feature.
 */
export function registerDocumentType(key, def, { replace = false } = {}) {
  if (REGISTRY.has(key) && !replace) {
    throw new Error(`document type "${key}" is already registered; pass { replace: true } to override it deliberately.`);
  }
  REGISTRY.set(key, freezeType(key, def));
  return REGISTRY.get(key);
}

/** One type's definition, or undefined. */
export function documentType(key) {
  return REGISTRY.get(key);
}

/** The whole catalogue, in registration order — for menus and docs. */
export function documentTypes() {
  return [...REGISTRY.values()];
}

/**
 * Render any registered type generically: name the type, hand it the
 * record and the issuer, get the document back. This is the one call a
 * caller needs, and it is stable as the catalogue grows.
 */
export function renderDocument(typeKey, record, opts = {}) {
  const type = REGISTRY.get(typeKey);
  if (!type) {
    throw new Error(`Unknown document type "${typeKey}". Known: ${[...REGISTRY.keys()].join(', ')}.`);
  }
  return type.render(record, opts);
}
