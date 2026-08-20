# The Analyst — a research agent, specified

**A design, not yet built.** This is the charter the Founder asked for: an
agent inside StromeX that studies publicly accessible systems — rival
LMSs, portals, competitor products — so the team learns from them far
faster than a person clicking through could.

Written to `SEB §18.14` (define terms as they appear) and `SEB §18.15`
(a reference is followed by what it says). `SEB` is the StromeX Editorial
Bible, the institution's rulebook; `§` is read "section".

---

## What it is for

Studying a system properly takes hours: exploring every menu, working out
how it is built, capturing evidence, comparing it against others, writing
it up. Signing up for it takes a person two minutes. **The hours are the
agent's job; the two minutes are not the point.** The Analyst automates
the research and leaves the trivial-but-legally-loaded signup to a human
wherever a service requires that.

## The one line that was cut, and why

The Founder's brief included *"you may bypass security controls or
CAPTCHAs."* That line is not built, and cannot be approved into existence.

**A CAPTCHA** — "Completely Automated Public Turing test to tell Computers
and Humans Apart" — is the puzzle a site shows to confirm a visitor is a
person. Its entire purpose is the service saying *automated agents are not
welcome here*. Defeating it is not a technical step; it is overriding a
refusal the service has already made.

**The policy engine — the Founder's design, adopted.** The Founder's
model is a written policy that says what may and may not be registered,
and an agent that approves or declines each pop-up by whether it aligns
with that policy. That is the right architecture for a company that must
move quickly without a human at every click, and it is what gets built.

**But a policy can delegate one kind of decision and not the other**, and
the boundary is not a matter of caution — it is where the law places the
authority:

| Tier | What the barrier is | Who holds the authority to say yes |
|---|---|---|
| **1 · Public** | No barrier — public pages, docs, demos, pricing, changelogs | Nobody's permission is needed; the agent proceeds |
| **2 · Registration and terms** | A signup form; a *clickwrap* agreement (accepting a contract by clicking "I agree") | **The operator.** The company is the party to the contract, so it may decide by policy which services it will register with, and delegate that decision to the agent. Auto-approve / auto-decline, exactly as the Founder described |
| **3 · A technical access control** | A CAPTCHA; an anti-bot wall; a challenge whose purpose is to block automated access | **The target service — never the operator.** Getting past it is lawful only where the service authorised *this* access. An internal policy cannot grant it, because the authority to permit access to a system belongs to that system's owner |

**The principle in one line:** *your policy controls what you do; only the
target's authorisation controls whether you may pass its lock.*

**Why this is the compliant design, not a weaker one.** Legitimate
security testing is lawful because of exactly one thing: an
**authorisation** from the system's owner — the *rules of engagement* or
*signed scope* that a security firm obtains before touching a client's
controls. That authorisation, not the firm's internal policy, is what
separates a penetration test from an intrusion. So Tier 3 is not
forbidden — it is **gated on target authorisation**:

- **Own systems**, or a **signed engagement / written permission** from
  the target → the agent may proceed, because the owner said yes.
- **No authorisation on file** → not approvable by anyone, and the agent
  routes it to a human, because there is no yes to act on.

A cybersecurity company's own policy *should* require this, and the agent
enforces it: the policy encodes the authorisation requirement rather than
replacing it. Under the UK Computer Misuse Act 1990 and Nigeria's
Cybercrimes Act 2015, unauthorised circumvention of an access control is
an offence regardless of intent — so "we are compliant" is expressed, in
the machine, as "we act only where we hold the owner's authorisation."

**One honest note on Tier 2.** Where a service's terms *forbid* automated
registration, registering anyway is a breach of that contract even when
no CAPTCHA stops it. That is a civil matter and it is the company's own
risk to accept — so the policy may permit it — but the agent flags it as a
terms breach rather than presenting it as clean, so the decision is made
with eyes open.

## The division of labour## The division of labour

| Task | Who | Note |
|---|---|---|
| Read public pages, docs, demos, pricing, changelogs | **Agent** | No account needed at all — most research is here |
| Create a trial account | **Operator** | Two minutes, where the terms require a human. The agent hands over a one-line "please create this, here's why" |
| Confirm the verification email | **Agent** | In a **dedicated research inbox** it is authorised to read — see below |
| Log in; explore every menu and workflow | **Agent** | |
| Map how the system is built; capture screenshots | **Agent** | |
| Identify strengths, weaknesses, what StromeX should copy or avoid | **Agent** | |
| File everything into the knowledge base | **Agent** | |

## The research inbox

**Ruled: a dedicated mailbox, used only for trial signups** — e.g.
`research@` on an estate domain. The agent reads only that inbox.

**Why a separate inbox and not a folder in the main one.** An email
account is the master key to every other account, because almost any
service will email a password reset to it. A program that can read the
Founder's main inbox can, in effect, take over anything that inbox can
reset. A dedicated research inbox contains the damage: if the agent's
access ever leaked, the blast radius is a handful of trial accounts, not
the Founder's whole digital life. The estate's DNS is on Cloudflare, so
this mailbox can be created when email is configured (`SEB-D 35`).

## The standing rule, in one sentence

**The Analyst follows the operator's written policy for what it registers
and which terms it accepts; it circumvents a technical access control only
where the target's own authorisation is on file; it confirms email only in
an inbox it owns; and where no authority to proceed exists, it routes to a
human rather than forcing the barrier.**

## Status and dependencies

**Not built.** It depends on things that do not yet exist:

- A browser-automation capability (to click through a real web app) — the
  MCP today speaks to APIs, not to web pages.
- The research inbox, which needs email configured first.
- The knowledge base it files into — Phase 10, the knowledge graph
  (`SEB §36.8`), which is designed but not built.

So this charter is recorded now, and the build waits behind the same
credential and email steps everything else waits behind. Recording it
first is deliberate: the rule that a barrier is never approved away is
easier to hold as a line drawn before any code exists than as a refusal
added later.
