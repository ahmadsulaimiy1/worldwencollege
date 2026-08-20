# @stromex/verifiable-documents

The **collective verifiable-document engine** for the estate. It belongs to no
single institution: every project — Albalagh, Al-Madeenah, Sultan Hanafi Royal
Schools, and any future one — uses this one engine and supplies its own
**issuer profile**. Governed by the *Verifiable Document Doctrine* (`SEB-D 47`)
and Volume 12 §12.12.

## The doctrine, in one line

> If the estate issues it and a stranger may need to trust it, it is a
> **verifiable document** — verifiable with no account, **regenerable from its
> record**, honest about its state, with secrets in the store and non-secrets
> in the register.

## What it does

| Module | Purpose |
|---|---|
| `src/issuer.js` | The **issuer profile** — every institution-specific value (legal name, code prefix, verify origin, seal mark, `pass` namespace). `defineIssuer()` builds and validates one; the engine hardcodes none. |
| `src/certificate-render.js` | Pure, deterministic renderers: `renderAwardCertificate`, `renderTestimonial`, `renderIssuedDocument`, `renderIdCard`. Same record + issuer in → byte-identical HTML out. This is the "recoverable from its record" guarantee. |
| `src/document-types.js` | The **type registry** — the extension point. Each verifiable-document type is one declarative entry (`title`, `subject`, `render`); `registerDocumentType()` adds a new kind as data, `renderDocument(type, record, {issuer})` dispatches generically. New document kinds are configuration, not engine edits. |
| `src/issuance-register.js` | `renderIssuanceRegister` (the beautiful, non-secret register) and `certificateSecretLabel` (the `pass` label convention — a store path, never a value). |
| `src/qr.js` | The verification QR encoder (ISO/IEC 18004), independently decoder-tested. |

## Adding a new document kind (the headroom)

```js
import { registerDocumentType, renderDocument } from '@stromex/verifiable-documents/document-types';

registerDocumentType('reference-letter', {
  title: 'Reference Letter',
  subject: 'person',                       // 'person' or 'artifact'
  render: (record, { issuer }) => `<!doctype html>…`,
});

const html = renderDocument('reference-letter', record, { issuer: AIPC });
```

Built-in types cannot be shadowed by accident; malformed keys and subjects
are refused. The future is data here, not a rewrite.

## Two subjects, two mechanisms, one doctrine

- **Person-documents** — certificate, testimonial, transcript, reference, ID
  card. The record names a person; verify means "the College issued this, to
  this person."
- **Artifact-documents** — books, editions, letters. The subject is the
  document itself; verify means "this is the genuine edition, unaltered" — a
  **content hash** plus signature (the provenance model, Volume 33).

## Usage

```js
import { defineIssuer } from '@stromex/verifiable-documents/issuer';
import { renderAwardCertificate } from '@stromex/verifiable-documents/certificate-render';

const AIPC = defineIssuer({
  key: 'aipc',
  legalName: 'Albalagh International Premium College — London Campus',
  codePrefix: 'AIPC',
  verifyOrigin: 'https://worldwencollege.com',
  sealMark: 'AIPC',
});

const html = renderAwardCertificate(awardRecord, { issuer: AIPC });
```

Each project runs **its own verify portal on its own domain** (the issuer's
`verifyOrigin`), all backed by this shared engine.

## Tests

```sh
npm test    # node --test
```

The suite proves regeneration determinism, that no secret escapes a rendered
document, that a *different* institution renders with no engine edits, and —
until the site imports `src/qr.js` directly — that the shared QR encoder has
not drifted from the site's copy (`functions/_lib/registry/qr.js`).

## Not yet done

- The site (`functions/`) still has its own `certificate-render`-free verify
  portal; wiring each project's portal to this engine is the next step.
- Publication (artifact-document) verification is ordered work — the site
  already computes content-hash Document IDs (`scripts/publication/identity.mjs`)
  but the portal does not yet resolve them.
- Production KMS signing lives in the site's `signing.js`, still development-mode.
