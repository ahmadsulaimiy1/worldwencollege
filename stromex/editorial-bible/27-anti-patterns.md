# Volume 27 — Anti-patterns: the things we never do

*A register exists so each argument is won once.* `AMC-DX §15`

Items marked **∅** have **no revival trigger** and will not be revisited.
Items marked **⟳** carry the condition that would reopen them, following
the future-considerations discipline at `AMC-EB` / `docs/06-future-considerations-register.md`.

---

## §27.1 Engineering anti-patterns

| | Anti-pattern | Why |
|---|---|---|
| **∅** | **Deleting an institutional record to fix a problem** | `SEB §26.1`. There is always an archive, a supersession or a revocation that solves it. |
| **∅** | **Writing a purge or retention job before destruction authority exists** | `SEB §26.2`, quoting `SHRS IT-04 §7.6.1` directly. |
| **∅** | **Committing a secret, or logging one** | `SEB §26.7`. Redaction by key name is not a mitigation — a secret travels under names nobody predicted. |
| **∅** | **A test that supplies its own inputs as a subsystem's only test** | `WEC-EP §2`. It can only discover what its author already imagined. |
| **∅** | **A stand-in more permissive than the thing it stands in for** | `WEC-EP §2`. A shim that accepts anything tests nothing where it matters. |
| **∅** | **An assertion that can pass for the wrong reason** | `WEC-EP §2`. "The audio can be fetched back from the server" passed while nothing had reached the server, because a `blob:` URL fetches fine from inside the page. |
| **∅** | **Checking a stylesheet by reading it** | `AMC-EB §48.3`. 1,029 text checks passed on a site that scrolled sideways on every phone. |
| **∅** | **Claiming a control the code does not enforce** | `SEB §2.6`, `SEB §26.5`. Say *enforced*, *recordable* or *aspirational*. |
| **∅** | **Silent truncation, silent fallback, silent retry-forever** | If a system drops work, caps a result set, or swallows a failure, it says so in the result. |
| **∅** | **Catch-and-continue over an error nobody will read** | An error either changes what the caller does, or it is not an error. |
| **∅** | **A placeholder implementation where a production one is feasible** | Stubs are a form of claim. If it cannot be built, it is `[OPEN]`, not stubbed. |
| **∅** | **Fixing a failing test by weakening it** | Including skipping, quarantining, or widening a tolerance until it passes. |
| **∅** | **A schema change applied by hand to a live database** | Migrations are code, reviewed, reversible, and run by the same mechanism everywhere. |
| **∅** | **`console.log` on a stdio protocol channel** | One stray write corrupts the JSON-RPC stream and the session dies with an unhelpful parse error. All logging goes to stderr (`SEB §11.6`). |
| **⟳** | **Raw TCP Postgres from a Workers isolate** | Empirically hangs the isolate on the second request (`SHRS shrs-digital-infrastructure-blueprint §2`). *Trigger:* Cloudflare shipping supported persistent TCP pooling, verified by measurement, not by a changelog. |
| **⟳** | **A single global "mobile" breakpoint** | Means nothing is actually tuned; breakpoints belong to components (`AMC-EB §48.2`). *Trigger:* none foreseen. |

## §27.2 Governance and data anti-patterns

| | Anti-pattern | Why |
|---|---|---|
| **∅** | **A policy invented for SEO, or for the appearance of governance** | `SHRS authority-strategy §2b`: "A policy invented for SEO is a liability wearing a trust signal's clothes." Pages that state commitments are published *from documents the institution has adopted*, never from drafted copy. |
| **∅** | **Fabricating a fact about the institution** — a student number, an accreditation, a partnership, a named person, a registration number, a measured outcome | The rule that survives; `SEB §2.4` is absolute. **Note:** *drafting an instrument* — a policy, a regulation, a workflow, a proposed retention period — is now **required**, not forbidden, under `SEB §29.10`. The distinction is between inventing a fact and drafting a document |
| **∅** | **Two offices recorded under two spellings of one person's name** | It converted a real internal control into a fiction for an entire institution (`SHRS role-permission-matrix §3`). Identity is resolved to an id, never to a name a human typed. |
| **∅** | **An optional "approved by" field that nothing checks** | Found three times in one codebase. It reads as a control and is decoration (`SHRS approval-workflow-architecture §1`). |
| **∅** | **Deleting a rejected, withdrawn or declined record** | A family's history stays traceable. Status-change instead. |
| **∅** | **Publishing a scanned press clipping without the publisher's permission** | Cite and link. The vault keeps the scan under fair-dealing preservation; the site does not publish it (`SHRS archive-governance §3`). |
| **∅** | **Captioning a photograph from inference** | Captions come from the register's provenance field (`SHRS archive-governance §3`). |
| **∅** | **A single-source claim stated as established** | State it *as reported* (`SHRS authority-strategy §4`). |

## §27.3 Product and AI anti-patterns

| | Anti-pattern | Why |
|---|---|---|
| **∅** | **An AI system that does not disclose it is AI** | `SHRS IT-05 §5`. It never impersonates a staff member or an office. |
| **∅** | **An AI system guessing at fees, calendar dates, scholarship criteria or admission arrangements** | It says plainly that the fact is not published and points to a real contact (`SHRS IT-05 §5`). |
| **∅** | **An AI system handling a safeguarding disclosure** | It directs to a named human, immediately (`SHRS IT-05 §5`, `SW-01 §7.10`). |
| **∅** | **Generating Qur'anic or hadith text** | `SEB §26.9`. |
| **∅** | **Fabricating a citation rather than admitting none was found** | `SX-EB Part VIII`. |
| **∅** | **Dark patterns, manufactured urgency, engagement-bait notifications** | `SX-EB Part VI`. |
| **∅** | **Testimonials, faculty, statistics or partnerships that do not exist** | `SEB §2.4`. WEC-LC has no testimonials for exactly this reason, and says so. |
| **∅** | **A fake login form, or a "coming soon" that pretends to be a product** | WEC-LC's Student Portal preview offers an honest early-access path instead. |
| **∅** | **Padding curriculum to create an appearance of completeness** | `WEC-EP §4`. |
| **∅** | **Inventing academic policy where governance approval is required** | Resit, certification, assessment regulations, progression rules — and data policy with legal consequences (`WEC-EP §4`: `recording_retention_days` ships as `null` for exactly this reason). |
| **∅** | **New capability because it would be impressive rather than because the curriculum requires it** | `WEC-EP §4`. |

## §27.4 Design anti-patterns

Taken from `AMC-DX §15` and `WEC-EB Part III`, both of which exist as
deliberate alternatives to template convention, and extended by the
**Anti-Generic Register** at `SEB §29.6`, which adds: Bootstrap and its
descendants · Material Dashboard and every admin template · off-the-shelf
UI kits used as-is · the generic SaaS landing page · glassmorphism ·
neumorphism · neon accents · purple-to-blue gradients · isometric
illustration sets · the abstract blob · the 3D floating card · corporate
memphis figures · rounded-everything · the AI-product aesthetic of
2024–26 in every particular.

**And the register's own rule:** a convention becomes an anti-pattern the
moment it is recognisable as a convention. If a reader can name the
framework, the work has failed.

**None has a trigger.**

Icon-and-heading card grids · circular avatar team pages · photo-tile
galleries · "why choose us" tick lists · testimonial carousels · logo
clouds · countdown timers · hero video loops · chat bubbles · emoji in
institutional copy · stock photography · AI-generated faces · gradient
hero fills · glassmorphism · neon accents · large uniform radii · single
flat drop shadows · bouncing easing · parallax · scroll-jacking ·
typewriter effects on a heading · animated counters over unevidenced
numbers · "learn more" as a button label · sliders and carousels of any
kind · mega-menus deeper than one level · sticky elements other than the
header · pop-ups of every description.

Four more, from the estate's own recorded defects:

| | Anti-pattern | Why |
|---|---|---|
| **∅** | **A conic or radial gradient painted without a ring mask** | It fills its box from the centre and renders a hard pie-slice across the object's face — which is what the footer badges did on every page until it was found (`WEC-EB Part III`). |
| **∅** | **A perimeter light that never stops moving** | "A perimeter that is always moving is a casino; one that lights when you arrive at it is a threshold" (`WEC-EB Part III`). |
| **∅** | **A reduced-motion carve-out that resolves to the hidden state** | An entrance animation merely disabled leaves the element at `opacity: 0` — for a reader with vestibular sensitivity that is not a calmer page but a blank one (`WEC-EB Part III·b`). |
| **∅** | **Gold as small text on a light ground** | ≈2.3:1, well under AA. Substitute the bronze token (`WEC-EB Part III·b`). |

## §27.4a The AI register — rejected in all copy

The specific fingerprint, enforced by the vetting gate at `SEB §30.14`.
**None has a trigger.**

"delve" · "leverage" · "robust" · "seamless" · "cutting-edge" · "unlock" ·
"elevate" · "game-changing" · "in today's fast-paced world" · "navigate
the complexities of" · **"It's not just X — it's Y"** · tricolon in every
paragraph · a closing paragraph that restates the opening · an em-dash in
every third sentence · "Whether you're a X or a Y…" · bulleted lists where
prose would carry the argument · superlatives without a number.

## §27.5 Process anti-patterns

| | Anti-pattern | Why |
|---|---|---|
| **∅** | **Stopping to ask a question the escalation list says not to escalate** | `SEB §0.5`. Decide, record the confidence, continue. |
| **∅** | **Proceeding past a question the escalation list says to escalate** | The same article, in the other direction. Confidence is not authority. |
| **∅** | **A document that does not say what it left open** | `SEB §2.3`. |
| **∅** | **An amendment log entry that records the change but not the reasoning** | `SEB §0.6`. A future reader must be able to reconstruct the argument. |
| **∅** | **Batching a risky change and assuming it worked** | The estate's own publication discipline: one document at a time, built, verified in the output, then committed (`SHRS policy-code-index`, Publication actions). |
| **∅** | **Reporting completion before verification** | `SEB §17.2` vocabulary, every time. |
