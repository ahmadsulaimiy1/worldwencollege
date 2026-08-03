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

### The steps

Cloudflare's dashboard is reorganised regularly, so these are described
by what you are looking for rather than by an exact menu path.

1. **Cloudflare dashboard → Zero Trust.** First time only, it asks you
   to pick a team name — any name; it becomes part of the login URL —
   and to choose a plan. **Free** covers up to 50 users. It may ask for
   a payment method to complete the free plan; nothing is charged.

2. **Zero Trust → Access → Applications → Add an application →
   Self-hosted.**

3. **Application domain:** `preview.wec-lc.pages.dev`, path left empty
   (the whole site).

4. **Policy:** name it something like `Owner only`. Action **Allow**.
   Rule: **Include → Emails →** your own address.

5. **Identity provider:** if none is configured, enable **One-time PIN**.
   That emails a code to the address on the list, which needs no Google
   or Microsoft setup and is enough for one person.

6. Save. Open the preview URL in a private window — you should get a
   Cloudflare login screen, not the site.

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
