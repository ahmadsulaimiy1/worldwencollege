# WEC — Engineering Standards

**Version 1.0** — 1 September 2026

This is the baseline engineering standard for this repository: how code
gets written, reviewed, tested, and shipped. It sits above
`docs/engineering-principles.md`, which is the deeper, hard-won record
of *why* the testing rules below exist — read that document for the
defects that produced them. This one is the checklist.

---

## 1. Scope

Applies to everything under version control in this repository: the
static site build (`scripts/build.js`, `partials/`, `pages/`), Cloudflare
Pages Functions (`functions/`), shared frontend behaviour (`js/`,
`css/`), and the deployment workflow. Content accuracy rules (never
fabricate institutional facts, never invent unapproved academic policy)
are governed separately by `docs/editorial-bible.md` and
§4 of `docs/engineering-principles.md` — this document does not restate
them.

## 2. Code style and structure

- Built pages (`index.html`, `about/`, `academics/`, etc.) are
  generated output — never hand-edit them. Edit the source in
  `pages/` and `partials/`, then run `node scripts/build.js`.
- Every English page needs its Arabic (`.ar`) counterpart, registered
  in `pages/manifest.json`, per the README's "Adding its Arabic
  counterpart" section. A page without a working `altHref` in both
  directions is incomplete.
- New RTL-sensitive CSS (`border-left`, `text-align: left`, etc.) must
  ship with its `[dir="rtl"]` override in `css/brand.css` in the same
  change — not as a follow-up.
- No new frontend dependencies without a stated reason. The site is
  deliberately framework-free; `js/site.js` is the only shared
  behaviour layer.

## 3. Version control

- Branch per change, descriptive name, one logical change per PR.
- Commit messages describe *why*, not just *what* — this repo's
  history is read as a design record (see `docs/engineering-principles.md`
  §2 for the standard this sets).
- Never hand-edit generated output as part of a source change; the
  build step must be re-run and its output committed alongside the
  source edit.

## 4. Testing

Governed in full by `docs/engineering-principles.md`. The binding rule,
restated here because it is the one that must never regress:

> Every subsystem must have at least one test driven by the real
> producer of its inputs — a real browser, a real encoder, a real
> signature, a real payload — not by inputs the test invented.

Before merging:

- New server-side logic in `functions/` needs a test that exercises it
  through something that behaves like the real caller (a real browser
  request, a real signed payload), not a hand-built stub of one.
- A stand-in (`r2-shim.mjs` and anything like it) must reject everything
  the real service it stands in for would reject. A permissive shim is
  a defect, not a convenience.
- Check `docs/engineering-principles.md` §3 (the open-defect register)
  before claiming a subsystem is verified — several integrations are
  explicitly marked open pending real credentials, and must not be
  described as tested until they are.

## 5. Security

- No secrets in the repository. `.env.example` documents required
  variables; real values live in Cloudflare Pages secrets and GitHub
  Actions secrets only.
- New Pages Functions must validate their own auth (`Authorization`
  header, JWT verification) rather than trusting an upstream check that
  may not run in every path — the missing-`Authorization`-header defect
  in `docs/engineering-principles.md` §2 happened exactly this way.
- `_headers` carries the site's security headers; a new route that
  needs different headers extends `_headers`, it does not bypass it.

## 6. Review

- A PR needs at least one reviewer who did not write the change.
- A reviewer approving frontend changes must confirm the Arabic mirror
  renders correctly RTL, not just that the English page looks right.
- Don't approve a PR whose tests were newly added to make a previously
  failing case pass without checking the test would have caught the
  original bug — see the "assertion that can pass for the wrong reason"
  rule in `docs/engineering-principles.md` §2.

## 7. Deployment

- Production is Cloudflare Pages, deployed via
  `.github/workflows/deploy-cloudflare.yml` (manual `workflow_dispatch`
  only, per that workflow's own header, until it has run green by hand
  at least once).
- A Vercel preview is a design/content preview only — `/api/*` routes
  404 there and `_headers`/`_redirects` are not applied. Never treat a
  Vercel URL as equivalent to the deployed site when verifying a fix.

## 8. Documentation

- A new architectural decision or standing constraint goes in `docs/`,
  not only in a PR description — PR descriptions are not discoverable
  six months later.
- This document changes only for standards that apply across the whole
  repository. A finding specific to one subsystem's tests belongs in
  `docs/engineering-principles.md` instead.

---

## Changelog

- **1.0** (2026-09-01) — Initial version.
