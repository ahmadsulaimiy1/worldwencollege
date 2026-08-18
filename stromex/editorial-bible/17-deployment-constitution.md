# Volume 17 — The Deployment Constitution

*What may be said about a system, and what must be true before it is said.*

---

## §17.1 The governing rule `[OBSERVED]`

From `SHRS digital-campus-master-deployment-directive`, verbatim, because
it is already the estate's law and is quoted in that document as the whole
point of it:

> **Never use "Live," "Production," "Deployed," or "Available" unless
> there is direct evidence.**

Every status label is checked against evidence found in the repository or
returned by an actual network request. **Where no evidence exists either
way, the document says so rather than estimating.**

## §17.2 The vocabulary `[OBSERVED]`

Defined once, applied consistently, everywhere in the estate — in
documents, in reports, in commit messages, in dashboards, and in every
sentence an AI operator writes:

| Status | Meaning |
|---|---|
| **Not Started** | No design decision or code exists for this. |
| **Designed** | A decision or plan is documented; no code written yet. |
| **Developed** | Code exists in the repository implementing it. |
| **Tested Locally** | Exercised against a local dev server and/or local database — **never against a public URL**. |
| **Merged** | Present in the default branch. |
| **Staging Verified** | Confirmed reachable and working at a public, non-production staging URL. |
| **Production Verified** | Confirmed reachable and working at the real production domain, **checked by an actual outbound request in this session**. |

Two properties make this vocabulary work, and both must be preserved:

- **"Merged" is not "deployed."** The estate has a great deal of Merged
  code that has never met a real provider.
- **Verification expires.** "Production Verified" means *checked in this
  session*. Last month's check is evidence about last month.

## §17.3 A hardcoded constant is not evidence `[OBSERVED]`

`SHRS shrs-digital-infrastructure-blueprint §1`, stated about its own
domain: a hardcoded origin string used to build absolute links "is not
evidence of a registered, resolvable, hosted domain."

**Generalise it.** A configuration value is evidence that someone intended
something. Evidence of a *fact* is a response from the thing itself.

## §17.4 The deployment sequence `[RULED — confidence High]`

Nothing skips a stage, and each stage has an exit condition that can be
checked by a machine:

| Stage | Exit condition |
|---|---|
| **Prepare** | Working tree clean; suite green including real-producer tests; the responsive gate green; secrets present for the target environment and **verified by a read**, not by presence |
| **Preview** | Deployed to a preview URL; health check run **against that URL**; smoke path walked in a real browser |
| **Promote** | Preview verified; a rollback target identified by name; the change record written |
| **Verify** | Health check against production; the primary journey walked; the deployment report produced (`SEB §11.10`) |
| **Watch** | Error rate and the health check observed for a defined window before the deployment is called finished |

## §17.5 A deployment that cannot be undone is not deployed, it is committed `[OBSERVED]`

`SX-EB Part II`'s reversibility value, applied at the deployment layer.
Before promoting: name the rollback target, and know that it still exists.
Schema changes are additive-first so that the application can go back even
when the schema cannot (`SEB §11.4`).

## §17.6 Preview deployments are where reality first arrives `[OBSERVED]`

`WEC-EP §3`'s honest register lists what is still unverified across the
estate, and **almost every row closes at a preview deployment with real
test-mode credentials**: live payment gateways, real R2 conditional-write
and lifecycle semantics, real email delivery, and a real identity
provider's actual claim set and key-rotation cadence.

**Binding.** Every project has a preview environment before it has a
production one. `SHRS`'s recorded state — "nothing in this project has
reached Staging Verified; no staging URL exists" — is the condition this
article exists to end.

## §17.7 Deploy the artefact you tested `[RULED — confidence High]`

The thing promoted to production is the **same build** that was verified in
preview, not a rebuild from the same commit. A rebuild is a new artefact
with new inputs — a different dependency resolution, a different
toolchain patch, a different clock.

Where a platform rebuilds per environment by necessity, that is recorded
as a known limitation and the verification is repeated after promotion,
rather than assumed to carry over.

## §17.8 Configuration parity is checked, not assumed `[RULED — confidence High]`

Most "it worked in preview" incidents are a missing environment variable.
Before promotion, the deployment compares the *names* present in each
environment — never the values — and refuses on a difference it was not
told to expect.

## §17.9 Domains, DNS and mail are one change `[OBSERVED]`

`WEC .env.example` records the constraint precisely: sending mail from a
domain you do not control fails SPF/DKIM outright, so the sending
addresses and the domain **must change at the same time — not before it
and not after it.**

**Binding.** A domain migration is a single planned change covering DNS,
TLS, sending identity, canonical URLs, redirects and cookie scope
(`SEB §10.3`), executed with a rollback, and verified by an actual
outbound request afterwards.

## §17.10 The estate's current deployment status `[OBSERVED — as of this Bible]`

Recorded here so that no future document has to guess, and so that the
first true entry can be dated:

| System | Status | Evidence |
|---|---|---|
| WEC-LC / AIPC site and backend | **Merged**; portions **Tested Locally** | Repository; test suite |
| SHRS digital campus | **Merged**; **Tested Locally** against a local Postgres | Its own directive's Phase 1 audit |
| Al-Madeenah site | **Developed / Merged**; a preview URL is named in its README | Not verified in this session (`SEB §28.2`) |
| StromeX MVP | **Merged**; audited | Its own independent audit |
| **StromeX Enterprise MCP** | **Tested Locally** — core and adapters against scripted mocks only; **no adapter has met a real credential** | `SEB §28.5` |

Nothing above is Production Verified by this Bible, because nothing was
checked by an outbound request in the session that wrote it.
