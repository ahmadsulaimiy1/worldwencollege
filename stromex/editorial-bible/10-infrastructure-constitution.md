# Volume 10 — The Infrastructure Constitution

*The standard stack, why each piece is in it, and the rules for adding an
eighth provider.*

---

## §10.1 The standard stack `[OBSERVED]`

Settled by measurement, not preference (`SHRS shrs-digital-infrastructure-blueprint §2`,
`WEC docs/technical-architecture.md`):

| Layer | Choice | Why this one |
|---|---|---|
| **Edge / hosting** | Cloudflare Pages + Pages Functions (Workers runtime) | Routes are already written to the `onRequestGet/Post({ request, env })` shape; zero rewrite to deploy |
| **Database** | **Neon Postgres over HTTP** (`@neondatabase/serverless`) | Workers cannot hold a persistent TCP connection. **Empirically confirmed**: a plain `pg.Pool` hangs the Workers isolate on a second request, forcing a runtime kill. Neon's HTTP driver exists to avoid exactly this |
| **Object storage** | Cloudflare R2 | Private by default; every read authorised by the application, never a public or signed URL |
| **Transactional email** | Resend (fetch-only REST, no SDK, no npm dependency, works unmodified in a Workers isolate) | |
| **Marketing / bulk email** | Brevo | Chosen where a free tier permits authenticating your own domain — a real constraint, recorded in `WEC .env.example` |
| **Identity** | Clerk | JWKS-verified JWTs; webhooks via Svix |
| **Alternative hosting** | Vercel | Used where a project's framework wants it (`AMC`) |
| **Source, CI, releases** | GitHub | |
| **Embedded/edge data** | Cloudflare D1, KV, Durable Objects, Queues | Where the workload is genuinely edge-local |

**Alternatives considered and not recommended**, with reasons recorded
rather than implied: Cloudflare D1 as a primary store for a
Postgres-shaped schema (would require rewriting every `DISTINCT ON` /
`RETURNING` / `ON CONFLICT` query for no functional gain); Supabase (a
real alternative, but would mean rewriting every call site to PostgREST or
reintroducing the TCP problem Neon was chosen to avoid).

## §10.2 A new provider needs a measured reason `[RULED — confidence High]`

The standard for adding to §10.1 is the standard §10.1 was built to: a
written justification naming the specific problem the incumbent could not
solve, with the evidence. "It is more modern" is not evidence. "We
measured the isolate hanging on the second request" is.

Every provider added must be reachable behind **one interface owned by us**
(`SEB §4.5`), and must be added to the MCP as an adapter with the same
guarantees as the other seven, or it is not integrated — it is a manual
dependency, and that is recorded as such.

## §10.3 Domain architecture `[OBSERVED]`

`SHRS shrs-digital-infrastructure-blueprint §1` sets the pattern and,
more usefully, the warning:

| Subdomain | Purpose |
|---|---|
| apex | Public marketing site |
| `portal.` | Guardian / student / staff portals, unified under one subdomain |
| `admissions.` | Admissions funnel |
| `lms.` | Learning management |
| `library.` | Digital library |
| `staff.` | Staff-only surfaces, separated from guardian/student traffic |
| `registry.` | Registrar's Office, if it warrants its own |
| `verify.` *(or an apex path)* | The public verification register — **no login** |

**The warning, which is the valuable part.** Introducing subdomains later
means cookie-domain scoping, CORS for cross-subdomain fetches, and DNS +
TLS per subdomain. *This is real migration work, not a byproduct of buying
a domain.* Scope it as its own step, **after** a staging environment
proves the single-origin model works, not before.

`[OPEN]` **Which domains are actually owned and renewed is unknown**
(`SEB §28.4` Q7). A hardcoded origin constant is not evidence of a
registered, resolvable, hosted domain — `SHRS` says so about its own, and
`WEC .env.example` records that sending mail from a domain you do not
control fails SPF/DKIM outright, so the sending addresses and the domain
must change **at the same time**, not before and not after.

## §10.4 Environments `[RULED — confidence High]`

Three, and the middle one is the one the estate does not yet have:

| Environment | Purpose | Rule |
|---|---|---|
| **Local** | Development against a local database and `wrangler pages dev` | Never touches a real provider account |
| **Preview / staging** | A public, non-production URL; **the first place anything meets a real provider** | Every credential is a test-mode or read-scoped credential. This is where "Staging Verified" is earned (`SEB §17.2`) |
| **Production** | | Nothing reaches it that has not been Staging Verified |

`SHRS` records that **nothing in that project has ever reached Staging
Verified, because no staging URL exists.** Creating one is the single
highest-value infrastructure action available to the estate, because it
converts a long list of "Developed" into evidence — and because most of
the estate's open verification gaps (`WEC-EP §3`: live payment gateways,
real R2 semantics, real Resend delivery, a real Clerk instance's claim set
and rotation cadence) close the moment a preview deployment with real
test-mode credentials exists.

## §10.5 Bindings and configuration `[OBSERVED]`

- Bindings (D1, R2, KV, Queues, Durable Objects) are declared in committed
  configuration; **secrets never are** (`WEC wrangler.toml`).
- Buckets holding personal data are **private and stay private** — nothing
  ever hands out a public or signed URL; every read goes through an
  endpoint that authorises the request first (`WEC wrangler.toml`,
  `RECORDINGS` and `KYC_DOCUMENTS`).
- Placeholder identifiers in committed config are labelled as
  placeholders, in the file, in words.
- A bucket the deployment needs is created by the deployment, not by hand.

## §10.6 Data residency is an architecture constraint, not a legal footnote `[OBSERVED — critical and open]`

`AMC-D C-1`, marked **critical and open**: serving Nigerian (NDPA 2023),
UK/EU (GDPR), Gulf and US students from one deployment with no stated
lawful transfer basis is **unlawful processing in at least two named
markets**. It "must be resolved before any real student data exists."

`SX-EB Part VIII` commits to regional data-residency options for markets
that require them, notably GCC and EU.

**Binding.** No system holding real personal data is deployed until its
controller, its lawful basis and its residency position are written down
(`SEB §28.4` Q2). This gates production, not development.

## §10.7 Backups, monitoring and disaster recovery `[OBSERVED — as named gaps]`

`SHRS digital-campus-master-deployment-directive` records all three as
**Not Started**: no backup policy, schedule or tooling; no uptime
monitoring, error tracking or log aggregation; no DR plan, no tested
restore, no RTO/RPO targets.

**Binding, and the ordering matters:**

1. **A backup that has never been restored is not a backup.** A restore is
   rehearsed on a schedule and the rehearsal is recorded.
2. **RTO and RPO are stated numbers**, per system, agreed before the
   system holds real data — not derived after an incident.
3. Backups of institutional records are themselves institutional records
   (`SEB §26.1`): a production backup is not deleted by an automated
   system.
4. Monitoring exists before scale requires it: `SX-EB Part IX` makes
   observability, rate limiting and abuse detection **mandatory at 10,000
   users**, which means they are built before 10,000, not at it.

## §10.8 Cost is an engineering constraint `[OBSERVED]`

`SX-EB Part IX`: cost-per-user is tracked from 1,000 users and becomes "a
hard product constraint, not a finance afterthought" at 100,000.

**Binding.** Every provider resource created by automation is tagged or
named so its owner and project are recoverable from the provider console
alone (`SEB §20.3`), and every workflow that provisions resources reports
what it created so nothing is orphaned.

## §10.9 The infrastructure inventory `[RULED — confidence High]`

A single register, versioned in the repository, listing every provider
resource the estate depends on: account, resource type, identifier,
project, purpose, owner, and whether the MCP manages it.

The reason it is an article: **the estate currently cannot answer "what do
we have?" from any single document**, and every one of `SEB §28.4`'s
infrastructure questions — which domains, which accounts, which databases
— exists because that register does not.

The MCP's `stromex.inventory.*` tools exist to populate it from the
providers themselves rather than from memory, and the register is
committed so that its diff is a change log.
