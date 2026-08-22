# The cost model

**Derived from published provider list prices, retrieved 2026-08-18, in
answer to `SEB §28.4` Q3.** The Founder ruled "price it first" rather than
approving a figure neither party had grounded, and this is that pricing.

Every figure is cited. Anything that could not be verified against a
first-party page is marked **⚠** and is *not* load-bearing in the
recommendation.

---

## 1. What this document is for

`SEB §26.6` requires a spending policy to name four things, one of which
is a rolling monthly cap. A cap is only meaningful between two numbers:

> **It must sit above what legitimate work costs**, or it fires during a
> term-start enrolment surge, a genuine parent newsletter, or a week when
> the team is actually shipping — and a cap that trips on real work gets
> raised in a panic, raised again, and is decorative inside a month.
>
> **It must sit far below what a runaway costs**, or it protects nothing.

So this document establishes both ends.

## 2. Three scenarios

Assumptions: one small institution ≈ 1,000 students and ~500 staff/parent
accounts; the OpenAI council runs ~30–40 shaped calls per working day at
~5,000 input / ~2,000 output tokens each.

### A — development only · **≈ $23/month**

Free tiers throughout, one staging environment, no production traffic, no
real personal data.

**⚠ One compliance flag, and it is not a rounding error:** Vercel's Hobby
tier is *"restricted to non-commercial, personal use only."* StromeX
Technologies is a commercial entity, so even a staging deployment is
arguably outside fair use. Vercel Pro puts A at **≈ $43/month**, and that
is the honest number for this scenario.

GitHub is genuinely $0 here and worth understanding why: with **no payment
method on file**, usage stops at the free quota rather than billing. That
is a real ceiling, and it is the correct failure mode for a development
account. **Do not attach a card until scenario B.**

### B — staging + light production · **≈ $186/month** (band $185–260)

| Provider | Line | Monthly |
|---|---|---|
| Vercel | Pro, 1 deploying seat (includes $20 usage credit, 1 TB transfer, 10M edge requests) | $20 |
| Neon | Launch: production + staging compute, storage, 7-day restore | ~$31 |
| Clerk | Pro, per application (50,000 MRU included; ~1,500 real users is far inside) | $25 |
| Resend | Pro, 50,000 emails/month | $20 |
| Cloudflare | Workers Paid | $5 |
| Brevo | Starter — needed only because Brevo Free's **300/day** cap cannot deliver one 1,000-parent newsletter | $9 |
| GitHub | 3 Team seats + Actions overage | ~$24 |
| OpenAI | The council | ~$50 |
| Domain | `worldwencollege.com` amortised (⚠ registry-set; renewal price unconfirmed) | $0.94 |

The variance in the band is Neon compute (a chattier app that defeats
scale-to-zero doubles it), a second Vercel deploying seat (+$20), and a
heavy CI month.

**Three step functions deliberately excluded**, because each is a decision
rather than a slope: Clerk B2B Authentication (+$100/mo), Vercel add-ons
(SAML $300, Advanced Deployment Protection $150, Static IPs $100/project)
— **all of which are excluded from Vercel's own spend management and bill
straight through any cap** — and Nigerian VAT plus the card issuer's FX
spread, neither of which is a published figure.

**⚠ Superseded — see §6.** `.ng` and `.com.ng` are not required; the estate's TLDs are `.com`, `.org` and `.co.uk`. Vercel does not sell
them (confirmed: empty registrar API result, absent from the published TLD
table). They must come from a NiRA-accredited registrar, and they are
**unbudgeted**.

### C — runaway, 30 days · **≈ $43,200**

An unattended agent loops and nobody catches it for a full billing cycle.
Arithmetic on published rates and published concurrency ceilings.

| Provider | Failure mode | 30-day |
|---|---|---|
| **GitHub Actions** | Commit/retry loop saturates the 60-job standard-runner ceiling | **$15,552** |
| **Vercel** | Redeploy loop + cache-busting self-fetch | **$13,820** |
| **Neon** | Branch-per-task loop with scale-to-zero disabled | **$7,754** |
| **Cloudflare** | Self-triggering Worker, KV write loop, R2 PUT loop | **$4,537** |
| **Clerk** | Identity churn across day boundaries (SMS **off**) | **$1,000** |
| **OpenAI** | Council loop, bounded by the account's usage tier | **$500** |
| **Resend** | Send loop — **$0**: overages are opt-in and off by default | **$0** |
| **Brevo** | Send loop — **$0 incremental**: prepaid, no overage rate | **$0** |

**GitHub Actions is 36% and Vercel 32% — 68% between them** — and both
have the same root cause: an agent that can trigger builds in a loop. One
control covers most of the exposure.

**R2's zero egress is the single largest structural mitigant in the
estate**, and it is free. Storage that charges for egress is where a
runaway becomes unbounded.

### The three preconditions that make C an order of magnitude worse

| Trigger | Mechanism | Exposure |
|---|---|---|
| **GitHub larger runners enabled** | 1,000-job concurrency on Team and Enterprise alike; included minutes **do not apply**; billed from minute one | **≈ $95,000** |
| **OpenAI tier promotion** | Automatic at $1,000 cumulative paid: approved ceiling goes $5,000 → **$200,000/month**. You do not opt in | **up to $200,000** |
| **Clerk SMS auth enabled** | 1 SMS/s = 86,400/day. **⚠ No Nigerian rate is published — only "market rate."** At typical high-cost-destination rates | **$26,000 – $780,000** |

With all three live: **$250,000 – $1,000,000 per 30 days.**

## 3. What this server's cap does and does not cover

**`STROMEX_SPEND_MONTHLY_CAP` counts only what passes through
`ctx.commitSpend`** — domain purchases and the OpenAI council. It cannot
see Vercel bandwidth, GitHub Actions minutes, Neon compute-hours or
Cloudflare requests, because none of those are tool calls. They are billed
by traffic and by CI.

**So the server's cap covers roughly $50 of a $43,200 exposure**, and
sizing it as though it covered the rest would be the exact failure this
document exists to prevent.

Ruled (`SEB-D 28`): **US$150**, which is ~3× the council's expected use
with room for a few registrations.

## 4. Where the real protection is

Per-provider, in each provider's own dashboard. **This server cannot set
any of it**, and four of the five only *alert*.

| Provider | Suggested | The control, and whether it actually stops anything |
|---|---|---|
| **Vercel** | $100 | Spend Management with **"Pause production deployment" explicitly ticked**. The $200 default notifies and stops nothing. Even when ticked, spend is checked "every few minutes" and projects "can keep serving traffic and accruing usage for several minutes" |
| **GitHub** | $60 | **"Stop usage when budget limit is reached"** — a genuine hard stop, and the best of the eight. **Plus an org policy disabling larger runners**, which removes the largest tail risk in the estate for free |
| **OpenAI** | $100 | A project-scoped limit with **"Enforce a hard limit"**. The cleanest real cap any of these vendors ships |
| **Neon** | $60 | Per-project **consumption quotas** (`compute_time_seconds`, `data_transfer_bytes`) set **at project-create time via the API** — off by default, so an agent that creates its own projects creates unbounded ones. Neon's "spending limit" is alert-only; automatic suspension is documented as "coming soon" |
| **Cloudflare** | $40 | **Informational only.** Cloudflare's docs say verbatim that budget alerts *"do not pause or cap usage"*, and they are processed a day in arrears. The real control has to be a kill switch built into the Worker |
| **Clerk** | — | **No spending control of any kind exists.** Exceeding a tier triggers a grace period, so the failure mode is *keeps working and keeps billing* |
| **Resend** | — | Already hard-stopped by default |
| **Brevo** | — | Already hard-stopped by default (prepaid) |

### The three negative controls

Worth more than any number, and they cost nothing. Each is the only lever
that converts a $0-exposure provider into a five-figure one.

1. **Leave Resend's Transactional Overages OFF.** It is opt-in and off by
   default; hitting the quota stops sending and offers an upgrade.
2. **Leave Clerk SMS authentication DISABLED.** Email and TOTP only.
3. **Never load an SMS or WhatsApp credit balance onto Brevo.**

**Status: not actioned.** The Founder ruled `SEB-D 32` — the server's cap
only, for now — on the basis that nothing is in production, so scenario C
is not reachable today. This table is the runbook for when it is.

## 5. Currency

**Seven of the eight bill in USD and cannot do otherwise.** Brevo is the
only one with genuine multi-currency billing — 16 currencies — and its own
public pricing API **rejects NGN with HTTP 400**: *"The value you selected
is not a valid choice."*

Vercel states it most plainly: *"You can pay in any currency so long as
the credit card provider allows charging in USD after conversion"* — the
charge is USD and the card issuer does the FX.

This is why `SEB-D 28` denominates the policy in USD while recording the
Naira ceiling as the authority. The server refuses a currency mismatch
rather than converting (`policy.ts`), so an NGN-denominated policy would
refuse every purchase in scope while reporting itself as enabled.

**⚠ Not established:** Neon and Resend never state a currency in words
anywhere — USD is inferred from `$` pricing and the absence of any
alternative. Clerk's documented USD-only statement is about *Clerk
Billing* (the product you use to charge your users), not strictly about
how Clerk invoices you.


---

## 6. Domains — what the registrar can and cannot do

**Corrected 2026-08-18.** The estate does not need `.ng` or `.com.ng`; the
TLDs in use are `.com`, `.org` and `.co.uk`.

### The finding that matters

**Vercel's registrar does not carry `.co.uk` — and `.co.uk` is the
estate's primary domain.**

Read from Vercel's own supported-TLD table (`/docs/domains/supported-domains`,
last updated 2026-06-23) and confirmed against the live registrar API on
2026-08-18:

| TLD | Carried by Vercel | Live price |
|---|---|---|
| `.com` | ✅ | **$11.25** / year |
| `.org` | ✅ | **$8.49** / year |
| `.school` | ✅ | **$9.99** / year |
| `.academy` | ✅ | **$21.99** / year |
| `.education` | ✅ | **$29.50** / year |
| `.college` | ✅ | **$29.99** / year |
| **`.co.uk`** | ❌ **not in the table** | — |
| **`.uk`** | ❌ | API: *"The TLD .uk is not currently supported."* |

Not in the table either: `.ac.uk`, `.sch.uk`. What *is* there and is a
trap — **`.uk.com` and `.uk.net`**, which are CentralNic commercial
second-level domains, not UK ccTLDs. They look British and are not.

**Consequence:** `vercel.domain.buy` can register `.com`, `.org` and the
education TLDs, and **can never touch the estate's primary domain**.
**Superseded as the default by `SEB-D 36`** — see §8; Vercel is now the
fallback registrar, not the first choice.
`.co.uk` registration, renewal and transfer live at a Nominet-accredited
registrar, outside this server. The MCP's domain tooling is for defensive
`.com`/`.org` registrations, not for the domain the institution runs on.

**Two of those prices exceed the US$25 single-purchase limit** —
`.education` at $29.50 and `.college` at $29.99. Those will stop and ask
for approval, which is the limit working as designed rather than a
problem.

### A trap in the availability check, now fixed

Vercel answers `available: false` **both** for a name somebody owns and
for a TLD it does not sell. Verified: `.co.uk` returns `available: false`
with no error at all, exactly as a taken `.com` does, while `.uk` returns
an explicit *"not currently supported"*. Same cause, two signals, one of
them illegible.

`vercel.domain.check` now reports three outcomes rather than two, and says
plainly that an uncarried TLD is **not evidence the domain is registered
to anybody**.

## 7. What the estate's DNS actually says

Resolved 2026-08-18. This is evidence, not assertion, and it answers most
of `SEB §28.4` Q7 for the one domain that is live.

**`worldwencollege.co.uk` — registered, live, entirely on Cloudflare.**

| Record | Value | Reading |
|---|---|---|
| `A` | `172.67.171.27`, `104.21.55.109` | Cloudflare proxy |
| `NS` | `zariyah.ns.cloudflare.com`, `merlin.ns.cloudflare.com` | DNS is on Cloudflare, so `cloudflare.dns.*` tools can manage it |
| `MX` | `route1/2/3.mx.cloudflare.net` | **Cloudflare Email Routing** — forwarding only |
| `TXT` | `v=spf1 include:_spf.mx.cloudflare.net ~all` | SPF authorises Cloudflare Email Routing **and nothing else** |
| `_dmarc` | **absent** | No DMARC policy at all |
| DKIM | no `resend.` or `brevo.` selector | Neither sending provider is set up |

### What follows from that

1. **The domain can receive mail and cannot send it.** Cloudflare Email
   Routing forwards; it is not a sending provider.
2. **Mail sent from this domain via Resend or Brevo would fail SPF
   today.** The record authorises only Cloudflare. `~all` is a softfail,
   so it would likely be accepted-and-marked rather than rejected — which
   is worse in one respect: it degrades deliverability quietly instead of
   failing loudly.
3. **There is no DMARC record**, so there is no policy, no aggregate
   reporting, and nothing telling receivers what to do with mail that
   fails. The domain is spoofable.
4. **Before any email workflow runs**, the sending domain must be verified
   at the provider and its DKIM and SPF records published — which the MCP
   can do, because DNS is on Cloudflare and `cloudflare.dns.*` is
   available. `resend.domain.*` and the Cloudflare DNS tools together
   cover the whole path.

**Still open in Q7:** whether any other domain is owned, who holds the
`.co.uk` registration, when it renews, and whether the registrar account
is under estate control. None of that is answerable from DNS.


---

## 8. Registrar — Cloudflare, at cost (`SEB-D 36`)

**Cloudflare Registrar sells at cost.** Its own words: *"Register and
renew these domains at cost without any markups or add-on fees"*, across
300+ extensions. The **Registrar API went to beta in April** and covers
search, availability-and-price, register, and status — so this is
automatable, and `cloudflare.registrar.*` implements it.

### What it saves, honestly

| | Vercel | Cloudflare |
|---|---|---|
| `.com`, first year and renewal | $11.25 | ~$10.60 at cost |

**Under a dollar per domain per year.** The change is still right — at-cost
*renewal* compounds, and it puts the domain lifecycle where DNS already
lives — but the "$20" that motivated it is Vercel's **Pro plan fee**, not
a domain markup.

**The $20/month is worth attacking separately, and is worth 400× more.**
The college site is a static build — 64 pages from `node scripts/build.js`
— and its DNS is already entirely on Cloudflare. **Cloudflare Pages serves
static sites free, with unlimited bandwidth.** Dropping Vercel saves
**$240/year**. Recorded as an option; it is a hosting decision that has
not been put to the Founder.

### What Cloudflare's registrar does NOT solve

| | |
|---|---|
| **`.co.uk`** | Refused by the API with `extension_not_supported_via_api`. **This is no longer a constraint on new registrations** — the estate takes whatever extension is available (`SEB-D 36`, amended). It remains true of `worldwencollege.co.uk`, which is already registered and already serving: renewal and DNS for it stay manual |
| **Renewals** | Not in the API beta. Every renewal is manual, at every registrar, for every domain |
| **Transfers** | Not in the API beta. Moving `worldwencollege.co.uk` in is a manual job |

### Two properties that shaped the tool

- **Registrations are non-refundable once complete.** So
  `cloudflare.registrar.register` prices *first*, and the money gate fires
  before the provider is called. A test asserts that a refused
  registration sends nothing.
- **A Cloudflare Registrar domain must use Cloudflare nameservers.**
  Harmless here — the estate already does — but disqualifying for any
  domain that has to live elsewhere.
