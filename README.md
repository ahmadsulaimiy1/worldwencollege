# Al-Madinah International College

The public site of a distance-learning college of the Qur'ānic and Islamic
sciences — Lagos, Nigeria, established 1441 / 2020.

Static, no framework, bilingual English / Arabic. Thirty-two pages: sixteen in
English at the root, sixteen in Arabic under `/ar/`, each a mirror of the other
with its own content file, its own chrome and its own web app manifest.

**Live:** <https://www.al-madinahcollege.com>

---

## How it is built

One generator, one manifest, two trees:

```
node scripts/build-madinah.js
```

It reads `madinah-src/manifest.json`, assembles each page from a content file
plus the shared partials, and writes finished `index.html` files into the
repository root. **The output is committed.** Nothing builds on the host — the
deployment is a static file server — so the generator must be run and its
output committed in the same change as any edit to `madinah-src/`.

```
madinah-src/
  manifest.json          Every page: slug, output path, title, description,
                         content file, and an `ar` block giving the Arabic
                         title, description and content file. One entry
                         produces both routes. A missing `ar` block is a
                         build-time warning naming the page.
  pages/                 Page bodies only, no chrome.
                           about.html      English
                           about.ar.html   Arabic
  partials/              head, topbar, header, footer, dock, icons —
                         `.ar.html` variants where the two differ.

scripts/build-madinah.js Assembles the above. Self-contained: fs and path.
```

Arabic links are rewritten by **exact route lookup**, not by prefixing a
regular expression — every English route is mapped to its Arabic counterpart
and anything unmapped is left alone. Two earlier attempts at this used a
pattern, and both silently linked the whole Arabic tree back into English.

Photographs are placed through a build token, `{{PHOTO:name|ratio|caption}}`,
which emits a figure **only if the file exists on disk**. A slot with no
photograph produces nothing rather than a broken frame.

## The written record

```
docs/al-madinah/
  editorial-bible.md          The design and editorial law of this site.
                              Cited in commits and comments as `EB §n`.
                              Includes a register of defects found and a
                              register of the Founder's rulings.
  founding-plan.md            What the College is and what it publishes.
  material-note.md            The five grounds and how they are composed.
  transfer-from-al-madeenah.md  A closed register: what was taken from the
                              predecessor repository, and what was refused.
  preview-deployment.md       How this is deployed, and what to watch.
```

The editorial bible is the College's own. An earlier one was inherited and is
no longer followed; `EB §0` sets out what it imposed and why it was dropped.
It is archived at `archive/wec-lc/docs/editorial-bible.md`.

## Layout

```
index.html, about/, faculties/, awards/, admissions/, …   Built English pages
ar/…                                                      Built Arabic mirror
css/    brand.css      Tokens: palette, type, the transliteration repair
        pages.css      Page furniture
        atelier.css    Components
        madinah.css    The house layer — grounds, plates, gilt, the orbit
        riwaq.css      The student ledger
        arabic.css     Type layer for the script. Loaded LAST in /ar/.
js/     madinah-atelier.js   Prayer times, Hijrī date, counters
        madinah-tactile.js   Depth, material sound (opt-in), typewriter
assets/ madinah/       Crest, favicon, share cards, app icons
        fonts/         Four subset faces. See assets/fonts/LICENCE.md
        photography/   Photographs, with a consent register beside them
                       that is withheld from the deployment
archive/wec-lc/        The previous occupant of this repository, intact and
                       inert: WorldWide English College — London Campus, its
                       pages, its toolchain, its editorial bible. Nothing
                       here is served, and nothing here is consulted.
```

## Typography, briefly

The display face is Bodoni Moda, and it cannot spell this College's subject:
it carries no macrons and no underdots, so thirteen of the thirty-one
non-ASCII characters the site actually sets were falling through to whatever
the reader's machine had. `Qur'ānic` was reaching the screen as `Qur'anic`.

`css/brand.css` opens with the repair — a second family, bound by
`unicode-range` to exactly the blocks Bodoni lacks, named first in the stacks
that need it, and self-hosted so a failed request cannot misspell a heading.
The reasoning is written out in full at the head of that file.

## Deployment

Vercel, as a static host. `vercel.json` stubs the build and install commands
because the output is already committed; `.vercelignore` withholds everything
the site does not need to *serve* — the generator, the page sources, the
archive, the documentation, and the photography consent register.

Vercel publishes **production from the repository's default branch**. If the
default branch is not this site's branch, the production URL will serve
whatever is.
