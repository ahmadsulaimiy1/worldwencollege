# Connecting worldwencollege.co.uk

**DONE — 12 August 2026.** Both hostnames are Active with SSL, and
resolve on Cloudflare's authoritative nameservers and on public
resolvers:

    worldwencollege.co.uk       104.21.55.109  172.67.171.27
    www.worldwencollege.co.uk   172.67.171.27  104.21.55.109

Nameservers `merlin` / `zariyah.ns.cloudflare.com`, moved at Naira
Hosting. Production deployment: run #9, commit 55cf655 — the FIRST
production deployment this project has ever had.

The rest of this file is kept as the record of how, and of the two
things that had to be fixed on the way.

---

## THE THING THAT WILL CATCH YOU NEXT: pushing does not deploy

`.github/workflows/deploy-cloudflare.yml` has **no `push:` trigger**. It
is `workflow_dispatch` only, on purpose — deploying is a decision, not a
consequence of committing, and a site that redeploys on every push to a
working branch would publish half-finished work.

The cost is that a commit can be pushed, green, and reviewed while the
live site still serves something months old. That happened on 13 August
2026: the faculty roster was committed, pushed and described as live
while `worldwencollege.co.uk` was still serving run #9's build from
commit 55cf655, which said the College was *"currently recruiting"*.

**So: `git push` changes the repository. Nothing else.** To change the
site, run the workflow:

    Actions → Deploy to Cloudflare Pages → Run workflow
      branch:           main        ← production. Anything else is a preview.
      seed_database:    false       ← true only for a brand-new D1
      apply_migrations: true        ← safe; applies only what is missing

Then check the run went green before saying anything is live. The
`branch: main` input is what makes it production; the workflow's own
`ref` (which branch's code to build) is separate and is the working
branch.

---

## What actually blocked it, and why neither was DNS

Both were long-standing faults that only a real deploy could expose,
because the workflow had not run since 3 August.

**The lock file was out of sync.** `pdfjs-dist` was added to
package.json and package-lock.json was never regenerated. `npm ci`
refuses that by design, so the job died at the install step in twelve
seconds without running a test. Fixed in 732ae36, and pinned to 4.6.82
rather than the caret range, which now resolves to 4.10.38 and drags in
thirteen native canvas binaries this project has never run against.

**Chromium was installed after the tests that need it.** The install
step sat immediately above the tests/browser/ scripts — correct when
written, wrong once the publication work added PDF tests to the
auto-discovered backend suite. publication-craft rasterises a rendered
page and publication-editions renders the flagship; both launch a
browser. Fixed in 55cf655.

Neither could reproduce locally: this machine has Chromium already, and
node_modules was already installed. A green local suite against a red
CI is the signature of a fault that lives in the environment.

---

## The original sequence, for the next domain

The domain is registered at **Naira Hosting**. The site is a
**Cloudflare Pages** project called `wec-lc`, also reachable at
`wec-lc.pages.dev`.

Nothing in this repository can make the connection. It is two
dashboards: Cloudflare (add the custom domain) and Naira Hosting
(point the DNS). Below is the sequence.

**And one thing the sequence originally missed:** attaching a custom
domain is not enough on its own. The domain binds to the PRODUCTION
environment, and this project's Pages production branch is `main` —
deliberately a branch that does not exist in the repository, so that
every ordinary deploy lands in Preview. Until the deploy workflow was
run with `branch: main`, Production had never been built and the domain
resolved to Cloudflare serving nothing.

---

## Before you start: the one decision

`docs/cloudflare-lockdown.md` records that Cloudflare Access currently
locks the site to the owner's email address, on two destinations:

| Destination | Covers |
|---|---|
| `wec-lc.pages.dev` | the production URL |
| `*.wec-lc.pages.dev` | the preview alias and every per-deployment URL |

**A custom domain is a different hostname, so Access will not cover
it.** The moment `www.worldwencollege.co.uk` resolves, the site is
public to anyone who types it — the lockdown does not follow the
domain across.

**DECIDED — 7 August 2026: go public.** The custom domain serves the
site openly. Cloudflare Access is deliberately NOT extended to it, and
nothing below adds it to the Zero Trust application.

What that means in practice, recorded so nobody has to re-derive it:
the site states publicly that the College holds no accreditation, has
no appointed staff, and carries a competency framework marked
*interim*. Those statements are accurate and deliberate, and they are
now readable by anyone, including search engines. That was the choice,
not an oversight.

`wec-lc.pages.dev` and `*.wec-lc.pages.dev` STAY behind Access. That
combination is intentional and useful: the public reads the real
domain, and the deployment URLs — including every permanent
per-deployment hash URL — remain closed.

**To reverse it later:** open the Zero Trust application **WEC-LC
preview** and add two destinations, `worldwencollege.co.uk` and
`www.worldwencollege.co.uk`. The existing `Owner only` policy then
covers them and the site closes again. Anything already indexed by a
search engine stays in its cache for a while regardless.

---

## Route A — move the nameservers to Cloudflare (recommended)

This is the shorter path and the one that makes the apex domain work
properly. It moves *DNS* to Cloudflare; the domain stays registered
with Naira Hosting and you keep paying them for it.

1. **Cloudflare dashboard → Add a domain → `worldwencollege.co.uk`.**
   Choose the Free plan. Cloudflare scans the existing records — if
   Naira Hosting is currently serving email for this domain, check
   that the MX records were picked up before you continue.

2. Cloudflare shows **two nameservers**, of the form
   `something.ns.cloudflare.com`. Copy both.

3. **Naira Hosting → your domain → Nameservers.** Replace whatever is
   there with Cloudflare's two. Save.

   `.co.uk` nameserver changes are usually live within an hour and
   occasionally take up to 24. Cloudflare emails you when the zone
   goes **Active**; nothing below works until it does.

4. **Cloudflare → Workers & Pages → `wec-lc` → Custom domains → Set up
   a custom domain.** Add:

   - `www.worldwencollege.co.uk` — **this is the canonical host.** The
     site's `<link rel="canonical">`, every `og:url`, and the sitemap
     line in `robots.txt` all already point at `www`. Do not make the
     apex canonical instead without changing those, or every page will
     advertise a URL that redirects.
   - `worldwencollege.co.uk` — the apex, so the bare domain resolves.

   Cloudflare creates the DNS records itself. No manual CNAME needed.

5. **Redirect apex → www**, so there is one canonical host and not two
   copies of the site. Cloudflare dashboard → the domain → **Rules →
   Redirect Rules → Create rule**:

   - Field `Hostname`, operator `equals`, value `worldwencollege.co.uk`
   - Type: Dynamic, Expression:
     `concat("https://www.worldwencollege.co.uk", http.request.uri.path)`
   - Status code **301**, and tick *Preserve query string*.

---

## Route B — keep DNS at Naira Hosting

Workable, slower, and the apex is awkward.

- `www` → **CNAME** → `wec-lc.pages.dev`
- The apex (`@`) cannot be a CNAME under the DNS standard. If Naira
  Hosting supports **ALIAS** or **CNAME flattening**, point it at
  `wec-lc.pages.dev`. If it does not, use their URL-forwarding feature
  to send `worldwencollege.co.uk` → `https://www.worldwencollege.co.uk`.

You still add both hostnames under **Pages → Custom domains** so
Cloudflare will issue the TLS certificate; it will tell you the
verification record to create.

---

## After it resolves — three things that will otherwise break

1. **Clerk.** The publishable key is bound to allowed origins. Add
   `https://www.worldwencollege.co.uk` (and the apex) in the Clerk
   dashboard, or every authenticated call returns 401 and the portal,
   the Listening Lab and the instructor workspace all render and do
   nothing.

2. **Payment webhooks.** Stripe, Paystack, Flutterwave and Opay each
   hold an endpoint URL pointing at `wec-lc.pages.dev`. They keep
   working, but the live endpoints should move to the real domain so
   the deployment URL can eventually be retired.

3. **The Access webhook bypass.** `docs/cloudflare-lockdown.md` § 1
   records a bypass policy for the single path
   `wec-lc.pages.dev/api/auth/webhook-clerk`. If you keep Access on and
   add the custom domain to it, that bypass needs the domain's path
   adding too, or Clerk's webhook starts failing silently.

---

## What is already correct in this repository

Nothing needs changing here for the domain to work. Every page's
canonical tag, `og:url` and `og:image` already use
`https://www.worldwencollege.co.uk`, and `robots.txt` already points
the sitemap there. The repository has been written for this domain
since the site was built; it has simply never had DNS behind it.
