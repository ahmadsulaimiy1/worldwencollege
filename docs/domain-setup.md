# Connecting worldwencollege.co.uk

The domain is registered at **Naira Hosting**. The site is a
**Cloudflare Pages** project called `wec-lc`, currently reachable at
`wec-lc.pages.dev`.

Nothing in this repository can make the connection. It is two
dashboards: Cloudflare (add the custom domain) and Naira Hosting
(point the DNS). This file is the sequence.

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
