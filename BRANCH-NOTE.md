# This branch is the Albalagh line

`claude/albalagh-college-website-f25gp0` carries **Albalagh International
Premium College**. It is not the same institution as the site on the
repository's default branch, and the two must not be merged again.

## What happened, on the record

On 17 August this branch was merged into the default branch
(`claude/worldwide-english-college-site-ezy1zo`) so that a Vercel preview
could be built from it. That was a mistake: the default branch is the
**WorldWide English College** line, actively developed by other sessions,
and putting a second institution's rebrand into it mixed two things that
should never have touched.

The merge did not survive — the default branch's Albalagh content was
subsequently reverted and the WEC-branded line continued. As of the last
check the default branch's `index.html` contains zero occurrences of
"Albalagh" and ten of the former brand, and `js/portal-data.js` exports
`WEC_LC_data` rather than the `AIPC_data` this branch defines.

**Nothing was lost.** Every Albalagh commit is intact here.

## The separation that still has to happen

Albalagh should live in its own repository. It cannot be moved from
inside a session: creating a GitHub repository requires a permission the
automation does not hold (`403 Resource not accessible by integration`).

The move, once an empty `albalagh-college` repository exists:

    git remote add albalagh https://github.com/<owner>/albalagh-college
    git push albalagh claude/albalagh-college-website-f25gp0:main

Then re-point the Vercel project at that repository. Until that happens,
the Vercel project named `albalagh-college` follows this repository's
DEFAULT branch and therefore serves **the other college** — an
Albalagh-named URL showing WorldWide English College. That is the whole
reason the separation matters.

## What is true of this branch

64 pages built, English and Arabic at exact parity, 2,730 assertions
passing, zero broken links across 12,637, and a full browser audit
across 74 pages with no accessibility, form, SEO or runtime findings.
The hosting it is written for is **Cloudflare Pages**; `vercel.json`
exists only so a static preview can be built, and on Vercel every
`/api/*` route is inert.
