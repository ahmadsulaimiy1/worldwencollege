# WEC-LC — Internal Preview Deployment

*How to deploy the current build to a preview environment, what will
work, and what will not. Written because the build is verified and
deploy-ready but **could not be deployed from the development
environment** — see § 1.*

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

```bash
# 1. Authenticate (opens a browser, or use CLOUDFLARE_API_TOKEN)
npx wrangler login

# 2. Create the database and record the id it prints
npx wrangler d1 create wec-lc
#    -> put that id into wrangler.toml's database_id

# 3. Apply schema, then every curriculum + audio seed IN ORDER
npx wrangler d1 execute wec-lc --remote --file=sql/schema.sql
for n in 1 2 3 4 5 6; do
  npx wrangler d1 execute wec-lc --remote --file=sql/seed-curriculum-level-$n.sql
  npx wrangler d1 execute wec-lc --remote --file=sql/seed-audio-level-$n.sql
done

# 4. Build and deploy to a PREVIEW branch (not production)
npm run build
npx wrangler pages deploy . --branch=preview
```

Step 4 prints the preview URL, of the form
`https://<hash>.wec-lc.pages.dev`.

**Deploy to `--branch=preview`, not production.** Cloudflare treats any
branch other than the production branch as a preview deployment with
its own URL, which is what was asked for.

---

## 4. What will work in the preview, and what will not

### Works fully, no credentials needed

- Every public page (English and Arabic — 27 routes)
- The Listening Lab: transcripts, cue navigation, bookmarks, notes,
  comprehension graded server-side, progress, pronunciation profile
- Instructor review workspace
- All six curriculum levels, 900 questions, served from D1
- Offline service worker
- All animation, typography and responsive behaviour

### Works, but in a deliberately safe preview state

| Area | Behaviour without production credentials |
|---|---|
| **Authentication** | No Clerk key configured, so `requireUser()` rejects. The Student Portal preview pages render illustrative static content; the Lab and instructor workspace will 401 until a key exists. |
| **Payments** | No gateway keys. `create-checkout` will fail at the gateway call. Use Stripe **test** keys for a working sandbox flow. |
| **Email** | No Resend key. `notifyStaff()` logs and continues — it never blocks a submission. |
| **Learner recordings** | Recording and playback work in-browser; the audio is a blob URL and the bytes do not reach a server. See § 5. |
| **Audio playback** | Every listening is in **script mode** — no recordings exist. This is by design, not a deployment gap. |

### Secrets to set when they exist

```bash
npx wrangler pages secret put CLERK_SECRET_KEY
npx wrangler pages secret put STRIPE_SECRET_KEY        # test key for preview
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
npx wrangler pages secret put PAYSTACK_SECRET_KEY
npx wrangler pages secret put FLUTTERWAVE_SECRET_KEY
npx wrangler pages secret put OPAY_SECRET_KEY
npx wrangler pages secret put RESEND_API_KEY
npx wrangler pages secret put NOTIFICATION_EMAIL
```

`.env.example` is the authoritative list.

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
