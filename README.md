# StromeX — Institutional Foundation

This subtree holds two permanent assets:

| | |
|---|---|
| **[`editorial-bible/`](editorial-bible/)** | **The StromeX Editorial Bible** — twenty-nine volumes of institutional constitution, standards and permanent rulings, derived from the whole existing estate. It governs every current and future StromeX project. Cited as `SEB §volume.article`. |
| **[`mcp/`](mcp/)** | **The StromeX Enterprise Infrastructure MCP** — the operational layer that executes the Bible: one authenticated, audited, policy-governed automation surface over Cloudflare, GitHub, Neon, Vercel, Clerk, Resend and Brevo. |

Read the Bible first. The MCP is downstream of it: every authority class,
every protected-operation rule and every audit obligation in the server's
code traces to an article here, and where the two disagree, the Bible wins
until it is amended (`SEB §0.3`).

---

## Why this lives in `worldwencollege`

It should not, permanently. This is institution-wide material and it is
here for one reason: **this is the only repository this session can write
to.** The four repositories it was derived from are listed in
`SEB §28.1`; six of the seven in the account were readable, one was not
attached for write access.

**The extraction is a one-command job when you want it**, and doing it
early is better than late:

```sh
git subtree split --prefix=stromex -b stromex-foundation
# then push that branch to a new repository, e.g. ahmadsulaimiy1/stromex-foundation
```

Nothing in this subtree imports from, or is imported by, the college site
around it. `stromex/mcp` carries its own `package.json`, its own
`node_modules`, its own build and its own test suite. That separation is
deliberate and should be preserved — see `SEB §4.9`.

**Verified, not assumed:** with this subtree in place, the college's own
`npm run build` produces its 64 pages and its full `npm test` suite passes
end to end. Neither sees `stromex/`.

## How to read the Bible

Start with:

1. **[`00-charter.md`](editorial-bible/00-charter.md)** — what the Bible is,
   who may amend it, how it is cited, and the three rules that govern the
   document itself.
2. **[`28-knowledge-graph-and-sources.md`](editorial-bible/28-knowledge-graph-and-sources.md)**
   — exactly what was studied to produce it, what could not be reached, and
   every question that is flagged for your confirmation rather than
   answered on your behalf.
3. **[`26-permanent-institutional-rulings.md`](editorial-bible/26-permanent-institutional-rulings.md)**
   — the short list of rules that outrank convenience everywhere.

Then whichever constitution governs the work in front of you.

## How to read the MCP

**[`mcp/README.md`](mcp/README.md)** first — the five guarantees and the
authority model in one page. Then, by what you are doing:

| | |
|---|---|
| Setting it up | [`mcp/docs/installation.md`](mcp/docs/installation.md) |
| Deciding whether to trust it | [`mcp/docs/security.md`](mcp/docs/security.md) — especially §3, on what approval does *not* defend against |
| Running it | [`mcp/docs/operations.md`](mcp/docs/operations.md) · [`mcp/docs/recovery.md`](mcp/docs/recovery.md) |
| Extending it | [`mcp/docs/developer-guide.md`](mcp/docs/developer-guide.md) · [`mcp/docs/blueprint.md`](mcp/docs/blueprint.md) |
| Checking what it has *not* proved | [`mcp/docs/not-verified.md`](mcp/docs/not-verified.md) |

## Status

**Draft v1.0 — not ratified.** No volume in this Bible has been adopted by
you. Everything in it is either (a) a principle *observed* operating
consistently across the existing estate and restated here, with its
sources cited, or (b) a decision taken under the executive-autonomy
protocol you already established at `AMC-D` and recorded with a confidence
level and a reversal note. Nothing is asserted as your settled policy
merely because it appears here.

The distinction between the two is marked in every volume, because a Bible
that cannot tell you which of its rules came from you and which came from
me is not usable as a constitution.
