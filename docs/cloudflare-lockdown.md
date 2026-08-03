# Locking down the preview, and switching on recording storage

Two things that can only be done in the Cloudflare dashboard. Neither
is a code change; both are recorded here so the reasoning survives the
clicking.

---

## 1. Cloudflare Access — make the preview private

### The problem it solves

`https://preview.wec-lc.pages.dev` is reachable by anyone who has the
URL. Nothing is linked to it, but "unlisted" is not "private": preview
URLs turn up in browser history, in messages, in analytics referrers,
and in anything anyone pastes anywhere. The site currently holds a real
learner database, an administration screen, and a programme that is not
finished.

Cloudflare Access puts an identity check **at the edge**, before a
request reaches the application at all. Someone who is not on the list
does not get a 403 from our code — they never reach our code.

### What is being chosen, and what is being given up

**Chosen: Access in front of the whole preview hostname.** Everything —
the marketing pages, the portal, the Listening Lab, the administration
screen — requires an approved email address before it loads.

The alternative was to protect only `/admin-enrolments.html`,
`/instructor-review.html` and `/api/admin/*`, leaving the learner site
public. That is the right shape **at launch**. It is the wrong shape
now, because the thing most in need of protection today is not the
admin screen — the API guards for that are tested — but the unfinished
public site itself.

**Given up:** the preview cannot be shown to anyone who is not on the
list. Adding someone is one line in the policy and takes about ten
seconds, so this is a small cost, but it is a real one — a link sent to
somebody not on the list shows them a login screen, not the site.

**Switching to the narrower version later** means editing the Access
application's path from the whole host to those three paths. Same
application, one field.

### What was actually done — 3 August 2026, verified

Zero Trust team domain: `raspy-cloud-4feb.cloudflareaccess.com`.

Application **WEC-LC preview**, created under **Access controls →
Applications → Add an application → Self-hosted and private → Public
DNS**, with **two** destinations:

| Destination | Covers |
|---|---|
| `wec-lc.pages.dev` | the production URL |
| `*.wec-lc.pages.dev` | the `preview.` alias **and every per-deployment URL** |

Policy `Owner only`: Action **Allow**, Include → **Emails** → the
owner's address. Session duration 24 hours.

Verified from a phone on mobile data — a genuinely separate device
rather than a private window on the same machine. Both
`wec-lc.pages.dev` and `preview.wec-lc.pages.dev` returned the
Cloudflare Access login screen instead of the site.

### Two things worth knowing for next time

**The Domain dropdown does not list `pages.dev`.** It only offers zones
in the account, and `pages.dev` is Cloudflare's own. The way through is
the **Switch to custom input** link directly beneath the Subdomain box —
easy to miss, and not in the dropdown itself. Once the first destination
exists, `wec-lc.pages.dev` *does* appear in the dropdown for later rows,
so the wildcard row can be entered as Subdomain `*` + Domain
`wec-lc.pages.dev` using the ordinary formatted fields.

**Two destinations, not one — this is the part that would have looked
finished while leaving the site open.** Pages gives every deployment a
permanent public URL of the form `<hash>.wec-lc.pages.dev`. Those never
expire, several already exist from earlier deploy runs, and they serve
the same site. Protecting `preview.wec-lc.pages.dev` alone would have
left all of them reachable. The wildcard is what closes them, including
ones that do not exist yet.

### Login method

The Cloudflare identity provider works but is a poor fit here: signing in
means a Cloudflare dashboard login **plus** an OAuth consent screen
titled "Unknown app wants to access your account" — which is legitimate
(it is the Access application asking to read which email you are signed
in as) but reads exactly like a phishing page, every time the 24-hour
session expires.

**One-time PIN** was added alongside it: email address, emailed code,
in. Nothing to configure, and it means adding someone later is just
their address on the policy rather than asking them to create a
Cloudflare account first.

### Two things that will bite

**Session expiry looks like a broken page, not a login prompt.** When
an Access session ends, the next `/api/...` request from an already-open
tab gets a redirect to the login screen. The JavaScript asked for JSON
and receives HTML, so the page reports something unhelpful rather than
"please sign in again". Reloading the page fixes it. This is worth
knowing before it happens at an awkward moment.

**Access is not a substitute for the application's own guards.** It
answers "may this person reach the site", not "may this person read that
learner's file". Every role check still applies underneath it, and
`tests/admin-route-guards.test.mjs` is what keeps them honest.

### It also blocks machines — the webhook bypass

Access turns away anything without a session, and a webhook has no
session. `POST /api/auth/webhook-clerk` is called by Clerk's servers
when someone signs up or changes their email; with the site-wide policy
in place those calls are refused at the edge, and Clerk eventually stops
retrying.

How much this matters, stated accurately: **sign-up still works.**
`requireUser()` provisions a local account on a learner's first
authenticated request rather than waiting for the webhook — built that
way deliberately, so a webhook that has not fired yet cannot break
somebody's first minute (see `tests/auth-provisioning.test.mjs`). What
stops working is the sync of email changes and account deletions from
Clerk.

The fix is a **second Access application** whose destination is the
single path `wec-lc.pages.dev/api/auth/webhook-clerk`, carrying a
**Bypass** policy with Everyone. Access evaluates the most specific
destination first, so the narrow bypass sits underneath the site-wide
Allow without opening anything else.

That endpoint is not unprotected as a result: it verifies a Svix
signature against `CLERK_WEBHOOK_SECRET` and rejects anything unsigned
or replayed. Access was never what was protecting it.

The same will be needed for each of `/api/payments/webhook-stripe`,
`webhook-paystack`, `webhook-flutterwave` and `webhook-opay` when a
gateway goes live — one bypass per path. Adding a bypass is the
*deliberate* act of putting a route back on the public internet, so it
is worth doing them one at a time rather than bypassing `/api/*`, which
would hand the whole API back to the open internet in a single click.

---

## 2. R2 — switch on voice recording storage

### What is broken without it

Everything except recordings works. The Listening Lab records audio,
tries to upload it, and reports a configuration error. The last deploy
detected this and continued deliberately: the workflow strips the
`[[r2_buckets]]` binding from `wrangler.toml`, prints a warning, and
ships the rest rather than failing the whole deployment over one
subsystem.

The failure was Cloudflare API error **10042** — R2 is not enabled on
the account.

### The steps

1. **Cloudflare dashboard → R2.** It asks for a payment method before
   the first bucket can exist, **including on the free tier**. The free
   allowance is 10 GB of storage and 1 million writes a month; learner
   voice clips are capped at 100 MB each by
   `functions/_lib/lms/recording-storage.js` and are typically well
   under a megabyte, so this will not be approached for a long time.

2. That is the whole manual part. **Do not create the bucket by hand** —
   the deploy workflow creates `wec-lc-recordings` if it is missing, and
   a hand-made bucket with a different name will not be found.

3. **Check the API token has R2 permission.** The token in the
   repository's `CLOUDFLARE_API_TOKEN` secret needs **Workers R2
   Storage: Edit** alongside Cloudflare Pages and D1. A token created
   before R2 was enabled probably does not have it. If it is missing,
   edit the token in **My Profile → API Tokens** and add the permission,
   or create a new one and replace the secret.

4. **Re-run the deploy workflow** (Actions → Deploy to Cloudflare Pages
   → Run workflow). The run summary says either that the bucket was
   created, or exactly why it was not.

### The bucket is private and must stay private

Nothing in the application ever hands out a public or signed URL for a
recording. Playback goes through `/api/lms/recording/audio`, which
authorises every request against the same rules as the rest of the LMS.
Enabling R2's public bucket access, or attaching a custom domain to the
bucket, would put learners' voices on the open internet — see
`docs/audio-platform-architecture.md` § 4.

### After it works

`recording_retention_days` is `null`: recordings are kept forever and
nothing is ever deleted. The purge mechanism is built and switched off,
because how long an institution may keep a learner's voice is a
data-protection decision with legal consequences — governance item
**D1**, still awaiting a decision.

---

## Order

Access first: it is free, immediate, and needs no redeploy. R2 second:
it needs a payment method and a workflow re-run.
