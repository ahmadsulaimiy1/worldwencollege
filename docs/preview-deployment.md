# WEC-LC — Internal Preview Deployment

*How to deploy the current build to a preview environment, what will
work, and what will not. Written because the build is verified and
deploy-ready but **could not be deployed from the development
environment** — see § 1.*

---

## 0. Status — deployed

**Live at https://preview.wec-lc.pages.dev** (3 August 2026, via
`.github/workflows/deploy-cloudflare.yml`, run #2).

- Pages project `wec-lc`, branch `preview`, 207 files + Functions bundle
- D1 `wec-lc` (`531b5b52-…`) created and seeded: 31 tables, 1.74 MB
- Verification ran before the deploy and passed: static build, backend
  suite, curriculum consistency, route audit, Listening Lab, auth
  contract
- Confirmed live in a browser, not inferred from a green build: the
  home page renders on the real typography, and
  `GET /api/admissions/status?id=nope` returns
  `No application found with that id.` — which exercises the whole
  chain end to end (Pages route → Functions runtime → `env.DB`
  binding → a real query against the seeded schema). A missing or
  unbound D1 fails this with a binding error rather than a clean
  not-found, so the *shape* of the answer is the evidence, not merely
  that a response arrived.

Not yet configured: Clerk (so the Portal, Listening Lab and instructor
workspace render but 401 on every API call — § 4), payment gateways,
Resend, object storage for recordings (§ 5).

**The URL is publicly reachable.** A Pages preview URL is not private;
put Cloudflare Access in front of the project if this needs to stay
internal.

§ 1 below is kept as the record of why this took a runbook rather than
a single command: the development sandbox has no route to Cloudflare's
API, and still doesn't — the deploy runs from GitHub Actions, which
does.

---

## 1. Why this is a runbook and not a URL

The deployment was requested and could not be performed. Stated
plainly, with the evidence:

| Check | Result |
|---|---|
| `CLOUDFLARE_API_TOKEN` / `CF_API_TOKEN` in environment | **not set** |
| `VERCEL_TOKEN`, `NETLIFY_AUTH_TOKEN` | **not set** |
| `curl https://api.cloudflare.com` | `000` — no route |
| `curl https://api.vercel.com` | `000` — no route |
| `curl https://api.netlify.com` | `000` — no route |
| `wrangler` installed | yes, 3.114.17, **unauthenticated** |
| `wrangler.toml` `database_id` | `REPLACE_WITH_REAL_D1_DATABASE_ID` |

The development sandbox has no outbound route to any deployment
provider's API and holds no credentials for one. No amount of
configuration in this repository changes that: the deploy has to be
run from a machine that can reach the provider and is logged in.

Everything that *can* be done ahead of that has been: the build runs,
every route is verified, and the commands below are the complete
sequence.

---

## 2. Pre-deployment verification — actually run, results below

```
npm run build                                  # 22 pages from pages/manifest.json
npm test                                       # 794 assertions, 0 failures
node --experimental-sqlite tests/curriculum-consistency.test.mjs   # 57, 0 failures
node tests/browser/route-audit.mjs             # 8, 0 failures — all 27 routes
node tests/browser/listening-lab.mjs           # 40, 0 failures
```

The route audit covers **every built route**, not a sample:

- all 27 routes respond without error
- no first-party asset failures
- no uncaught script errors on any route
- every route has a non-empty `<title>` and a `lang` attribute
- every route has exactly one `h1`
- every image carries an `alt` attribute
- no horizontal overflow at 1440px (the Lab is separately verified at
  390px and 768px)

Webfont requests to `fonts.googleapis.com` are aborted during the audit
— they hang through the sandbox proxy — which means **every page was
verified rendering on the `brand.css` fallback stack**, i.e. the state a
visitor with a blocked or slow CDN actually sees.

---

## 3. Deploying to Cloudflare Pages

Cloudflare is the right target: the repo is already a Pages project
(`wrangler.toml`, `pages_build_output_dir = "."`) and the API is
Pages Functions under `functions/`, which no other host runs natively.

### 3.0 What "going live" actually requires — three things, not one

Connecting the repository to Cloudflare is necessary and **not
sufficient**. The public site goes live on the Pages connection alone.
The LMS and the Student Portal need all three of the following, and
each one fails in a different, visible way:

| # | Requirement | If it's missing |
|---|---|---|
| 1 | **Pages project** connected to this repository | Nothing is live at all. |
| 2 | **D1 database** created, bound as `DB`, with `sql/schema.sql` and all 12 seed files applied | Public pages load; every `/api/lms/*` call fails — no curriculum, no quizzes, no listening. |
| 3 | **Clerk**: `CLERK_JWKS_URL` + `CLERK_WEBHOOK_SECRET` as Pages secrets, **and** a publishable key in `js/auth-config.js` | Everything renders, and every authenticated call returns **401**. `requireUser()` (`functions/_lib/auth/session.js`) has no token to verify, so the Portal shows illustrative static content and the Listening Lab says "Sign in to open the Listening Lab." |

Requirement 3 has two halves and both are needed. The Pages secrets let
the *server* verify a token; the publishable key lets the *browser*
obtain one. Setting only the server half leaves the pages exactly as
unauthenticated as before.

There is also a fourth thing that is not a credential: object storage
for learner recordings does not exist yet (§ 5.1). Recording works;
the bytes stay in the browser.

### 3.1 Option A — connect the Git repository (recommended)

This is the "link it with Cloudflare" path, and it needs no CLI and no
API token. Done once in the dashboard:

1. **Workers & Pages → Create → Pages → Connect to Git**, and pick
   `ahmadsulaimiy1/worldwencollege`.
2. Build settings:
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `/` (the repo root — matches
     `pages_build_output_dir = "."`)
   - Production branch: choose deliberately. Setting it to something
     other than the working branch means every push to
     `claude/worldwide-english-college-site-ezy1zo` publishes as a
     **preview** deployment with its own URL, which is what an internal
     preview should be.
3. **Settings → Bindings → D1 database**: create `wec-lc`
   (Storage & Databases → D1), then bind it with the variable name
   **`DB`**. The binding name is not cosmetic — every Function reads
   `env.DB`.
4. **Settings → Variables and Secrets**: add the secrets listed in
   § 3.4 as and when they exist.
5. Seed the database once (§ 3.3). Cloudflare's build step does not do
   this and never will — it is data, not build output.

After that every push to the connected branch redeploys automatically.

### 3.2 Option B — from a machine with the CLI

```bash
# 1. Authenticate (opens a browser, or use CLOUDFLARE_API_TOKEN)
npx wrangler login

# 2. Create the database and record the id it prints
npx wrangler d1 create wec-lc
#    -> put that id into wrangler.toml's database_id

# 3. Seed it — see § 3.3

# 4. Build and deploy to a PREVIEW branch (not production)
npm run build
npx wrangler pages deploy . --branch=preview
```

Step 4 prints the preview URL, of the form
`https://<hash>.wec-lc.pages.dev`.

**Deploy to `--branch=preview`, not production.** Cloudflare treats any
branch other than the production branch as a preview deployment with
its own URL, which is what was asked for.

### 3.2b Option C — from CI

`.github/workflows/deploy-cloudflare.yml` does Option B from GitHub
Actions, which *can* reach Cloudflare's API. It runs the full
verification suite first and refuses to deploy if anything fails. It is
manual-dispatch only and tells you exactly which secret or variable is
missing rather than failing obscurely. The file header lists everything
it needs.

### 3.3 Seeding — order matters

```bash
npx wrangler d1 execute wec-lc --remote --file=sql/schema.sql
for n in 1 2 3 4 5 6; do
  npx wrangler d1 execute wec-lc --remote --file=sql/seed-curriculum-level-$n.sql
  npx wrangler d1 execute wec-lc --remote --file=sql/seed-audio-level-$n.sql
done
```

Curriculum before audio **at each level**: the audio rows carry foreign
keys onto that level's learning items, and the schema enforces them.
The seeds are `INSERT`s, not upserts — run them once, against a new
database.

### 3.4 Secrets, with their real names

```bash
npx wrangler pages secret put CLERK_JWKS_URL          # https://<instance>.clerk.accounts.dev/.well-known/jwks.json
npx wrangler pages secret put CLERK_WEBHOOK_SECRET    # whsec_...
npx wrangler pages secret put STRIPE_SECRET_KEY       # test key for preview
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
npx wrangler pages secret put PAYSTACK_SECRET_KEY
npx wrangler pages secret put FLW_SECRET_KEY
npx wrangler pages secret put FLW_WEBHOOK_SECRET_HASH
npx wrangler pages secret put OPAY_SECRET_KEY
npx wrangler pages secret put RESEND_API_KEY
npx wrangler pages secret put RESEND_FROM_ADDRESS
npx wrangler pages secret put NOTIFICATION_EMAIL
```

`.env.example` is the authoritative list. (An earlier revision of this
document named a `CLERK_SECRET_KEY` — no such variable is read anywhere
in `functions/`. The two Clerk values above are the real ones.)

The **publishable** key is not a secret and is not set this way. It is
one line in `js/auth-config.js`:

```js
window.WEC_LC_AUTH = { clerkPublishableKey: 'pk_live_...' };
```

Either commit it or let the CI workflow write it from the
`CLERK_PUBLISHABLE_KEY` repository variable.

---

## 4. What will work in the preview, and what will not

### Works fully on Pages + D1 alone, no credentials needed

- Every public page (English and Arabic — 27 routes)
- Admissions form submission
- All animation, typography and responsive behaviour

### Needs Clerk as well — everything behind `requireUser()`

Named individually, because "the LMS goes live" is not a single switch:

| Surface | Without Clerk | With Clerk |
|---|---|---|
| Student Portal | Renders as an illustrative static preview | Real session, real enrolment and payment history |
| Listening Lab | Loads, then says "Sign in to open the Listening Lab" | Transcripts, cue navigation, bookmarks, notes, recording, comprehension graded server-side, progress, pronunciation profile |
| Instructor review workspace | "Could not load the queue" | Real queue, real scoring against the learner's own drill targets |
| Curriculum content (`/api/lms/unit`) | 401 | All six levels, 900 questions, served from D1 |
| Offline worker | Caches the shell only | Caches this learner's unit content, scoped to their identity |

Every one of those endpoints calls `requireUser()`, which needs a
verifiable Bearer token. There is no partial state: a deployment with
D1 but no Clerk serves the public site perfectly and answers 401 to
every LMS request.

### Works, but in a deliberately safe preview state

| Area | Behaviour without production credentials |
|---|---|
| **Payments** | No gateway keys. `create-checkout` will fail at the gateway call. Use Stripe **test** keys for a working sandbox flow. |
| **Email** | No Resend key. `notifyStaff()` logs and continues — it never blocks a submission. |
| **Learner recordings** | Recording and playback work in-browser; the audio is a blob URL and the bytes do not reach a server. See § 5. |
| **Audio playback** | Every listening is in **script mode** — no recordings exist. This is by design, not a deployment gap. |

Secret names and the publishable-key line are in § 3.4.

---

## 5. Known limitations carried into the preview

These are pre-existing and documented elsewhere; repeated here so the
preview is not mistaken for a complete product.

1. **No object storage for learner recordings.** Takes are blob URLs.
   They play back in the tab that made them and nowhere else. This is
   the highest-priority production gap
   (`docs/audio-platform-architecture.md` § 4).
2. **No audio recordings.** All 120 audio assets have `media_url NULL`.
   The Lab runs in script mode throughout, honestly labelled.
   Attaching narration later is an `UPDATE` — no redesign.
3. **No background sync.** The service worker never caches mutations,
   so an offline quiz submission fails visibly rather than appearing to
   succeed.
4. **Academic policy not set.** Resit rules, certification policy,
   assessment regulations and PART A/B conventions are held for
   governance approval and have deliberately not been invented.
5. **Auth is untestable from here.** Every authenticated endpoint's 401
   boundary is verified; what happens past it needs a real Clerk token
   (`tests/README.md` § What's covered).

### 5.1 A defect found while preparing this link, now fixed

Worth recording, because of how it survived a green suite.

The Listening Lab and the instructor review workspace sent **no
`Authorization` header at all**. Both would have returned 401 on every
single request against a real Cloudflare deployment — including one
with Clerk fully configured. The 40-assertion browser suite could not
see it: `tests/browser/lab-server.mjs` hard-coded `userId: 'usr_demo'`
and never inspected request headers, so the harness had a hole exactly
where production has a check. The tests measured the page's behaviour
accurately, against a server that was easier than the real one.

Fixed by routing both pages through `js/api-auth.js`, which mints a
Clerk token per request (Clerk tokens expire in about a minute; one
captured at page load would work for the first call and 401 for the
rest of a listening session). `tests/browser/lab-auth.mjs` now runs the
harness with `LAB_REQUIRE_AUTH=1` and asserts the header contract
directly — 14 assertions, and removing the fix fails 8 of them.

The same pass found that the offline cache was keyed by URL only. The
Cache API ignores request headers, so `/api/lms/unit?id=X` was one
entry no matter who asked — and that response carries the asker's own
recordings and attempt history. On a shared machine it would have
handed the next learner the previous one's work. The curriculum cache
is now named per signed-in user, an authenticated request made before
the worker knows who is signed in is neither served from cache nor
written to it, and signing out drops the caches.

---

## 6. After deploying

Re-run the route audit against the deployed origin to confirm the
preview matches the local verification:

```bash
LAB_BASE=https://<your-preview>.pages.dev node tests/browser/route-audit.mjs
```

(The audit currently targets its local harness; pointing it at a remote
origin is a small change to `BASE` and is the natural next step once a
preview URL exists.)
