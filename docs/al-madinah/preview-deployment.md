# The preview deployment

**Preview URL (the College):**
`https://albalagh-college-git-clau-b5ac53-ahmadbinibrohim-3178s-projects.vercel.app`

A branch-alias URL, so it tracks the head of
`claude/abisulaimiycollege-data-extraction-6b66sm`: every push redeploys it and
the address does not change.

## What is deployed, and what is not

The project is **`albalagh-college`** on Vercel, in
`ahmadbinibrohim-3178s-projects`. It already existed and was already linked to
this repository, so it was reused rather than duplicated — a second project on
one repository would mean two things claiming to be the site.

That has one consequence worth knowing before anyone shares a link:

> **The project's PRODUCTION URL — `albalagh-college.vercel.app` — serves
> WorldWide English College, not this one.** The repository's default branch is
> still `claude/worldwide-english-college-site-ezy1zo`, and Vercel builds the
> default branch for production. The College lives on the branch alias above.

To make the College the production site, the repository's default branch must
change, or the Vercel project's production branch must be pointed at this one.
Both are dashboard decisions and neither has been taken here.

## How it is served

No build and no install. `scripts/build-madinah.js` runs **before** the commit,
on the machine that then verifies the output at 390px and 1280px in both trees;
the 32 pages, the sitemap and the assets are committed. Running the generator
again on a build server proves nothing and can only diverge, so `vercel.json`
stubs both commands.

`.vercelignore` withholds everything the site does not need to serve —
`archive/`, `docs/`, `scripts/`, `madinah-src/`, `tests/`, `sql/`. The first
deployment kept the last two of those and they were fetchable:
`/madinah-src/manifest.json` and `/scripts/build-madinah.js` each returned 200
on a public address.

## The one rule this configuration turns on

`trailingSlash: true` normalises a request **before** the redirect table is
consulted. Every `source` in `vercel.json` must therefore end in a slash. This
caught two rules in two different ways:

- `/apply` returned a 308 and looked like it worked. That was the
  trailing-slash rule answering with `/apply/`, which then had nowhere to go.
- `/madinah/` redirected correctly while `/madinah/awards/` 404'd — the exact
  source matched, and `:path*` does not match the final slash. The wildcards
  are written `/madinah/:path*/`.

## Verified on the deployed site

| | |
|---|---|
| 32 routes | all 200 |
| 19 CSS/JS/asset URLs | all 200, and **byte-identical** to the files verified locally |
| 17 of 18 pages sampled | byte-identical; the home page differs only by Vercel's injected preview-feedback script |
| `/madinah/…` redirects | all 308 to the root equivalent, Arabic included, every target 200 |
| spoken shorthands | `/apply/ /charges/ /fees/ /tuition/ /programmes/ /quran/ /rules/ /disclosure/ /chains/ /asanid/ /ijazah/` all resolve |
| `docs/`, `archive/`, `madinah-src/`, `scripts/`, `package.json` | 404 |
| security headers | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` present |

The browser render was **not** re-run against the live URL: this sandbox routes
outbound HTTPS through a proxy that its Chromium is not configured for. The
byte-comparison above is what stands in for it, and it is stronger for CSS and
JS than a render would be — the deployed stylesheets and scripts are the same
bytes that produced the verified pages.
