# Albalagh International Premium College — London Campus (AIPC)

Static, no-framework, bilingual (English / Arabic RTL) build. See
`docs/editorial-bible.md` for the brand system and `docs/site-architecture.md`
for the full site map.

## Structure

```
index.html, about/, academics/, ...   Built English pages — do not hand-edit, regenerate instead
ar/                                    Built Arabic (RTL) mirror of every English page
css/brand.css          Design system (palette, type, RTL overrides, all page CSS)
js/site.js              Shared behaviour (nav, accordion, scroll-reveal, mailto forms)
assets/images/         Crest/favicon art
partials/               Shared chrome, reused by every page
  head.html              <head> contents, with {{TITLE}} / {{DESCRIPTION}} tokens
  topbar.html / .ar.html Top contact bar, with {{ALT_HREF}} language-switcher token
  header.html / .ar.html Logo + primary nav, per language
  footer.html / .ar.html Site footer, per language
pages/                  One content file per page (page body only, no chrome)
  home.html, about.html, ...          English content
  home.ar.html, about.ar.html, ...    Arabic content (same slug + .ar suffix)
  manifest.json           Registers every page: slug, output path, title,
                           description, content file, lang/dir/altHref
scripts/build.js        Assembles partials + a page's content into a full
                        HTML document for every entry in pages/manifest.json
```

## Adding an English page

1. Write the page's unique content (no `<head>`, topbar, header, or footer —
   those come from `partials/`) into a new file under `pages/`.
2. Add an entry to `pages/manifest.json` with a `slug`, the `output` path
   (e.g. `academics/iefc/index.html` for a clean URL), a `title`, a
   `description`, and the `contentFile` you just wrote. Set `altHref` to
   that page's Arabic counterpart path (e.g. `/ar/academics/iefc/`).
3. Run the build.

## Adding its Arabic counterpart

1. Translate the content into a sibling file with a `.ar` suffix (e.g.
   `pages/academics-iefc.ar.html` next to `pages/academics-iefc.html`) —
   full sentences, not machine-translated filler. Keep the institution
   name, `IEFC`, and CEFR codes (`A1`–`C2`) in Latin script wrapped in
   `dir="ltr"` spans (the Unicode bidi algorithm doesn't reliably keep
   embedded Latin/numeric runs in reading order inside RTL text).
2. Add a manifest entry: same shape as the English one, plus `"lang": "ar"`,
   `"dir": "rtl"`, and `altHref` pointing back at the English page.
3. Run the build. Amiri/Cairo are appended as fallbacks in `css/brand.css`,
   so Arabic glyphs render correctly automatically. If a new page introduces
   a component with a physical `border-left`/`text-align:left`/etc. that
   doesn't already have an RTL counterpart in the `[dir="rtl"]` rules at the
   end of `css/brand.css`, add one there.

## Building

```
node scripts/build.js
```

Regenerates every page listed in `pages/manifest.json`. No dependencies to
install — the script only uses Node's built-in `fs`/`path` modules.

## Local preview

```
python3 -m http.server 8000
```

then open `http://localhost:8000/` (or `/ar/` for the Arabic homepage).
Asset and stylesheet references are root-relative (e.g. `/css/brand.css`),
so the site must be served — it will not render correctly opened directly
as a `file://` URL.

## What this is (and isn't) yet

This is the full public institutional website — home, about, academics
(programme hub + the IEFC programme in detail), admissions (including a
client-side level self-assessment tool), tuition, faculty, a student portal
preview, FAQ, contact, and a branded 404 — in English and Arabic.

It is **not** a working Learning Management System, student/staff/admin
portals with real authentication, a payments backend, or a mobile app —
those need real infrastructure, credentials, and operational decisions
(hosting, a database, a payment processor, real staff accounts) that belong
to AIPC's actual operators, not something to fabricate into a repo. The
Student Portal page previews what that experience will contain and gives a
route to request early access; `/student-portal/preview/` is a high-fidelity,
front-end-only *design* preview of the dashboard (built on `css/dashboard.css`,
a new dashboard-oriented component layer) — noindex'd, excluded from
`sitemap.xml`/`robots.txt`, unlinked from primary navigation, and permanently
banner-labelled as illustrative, not a real account. The "Apply"/"Contact"
flows are honest `mailto:` links, not fake AJAX submissions, until a real
backend exists.

Facts not yet confirmed (registered London HQ address, named leadership/
faculty, formal accreditation, first-cohort start date) are shown as clearly
labelled "Institutional Status" callouts rather than invented — see
`docs/editorial-bible.md` for why. "London Campus" itself is resolved: it
names AIPC's administrative headquarters — delivery is online-first
worldwide by design, not a placeholder for premises that don't exist (see
About → Our Operating Model).
