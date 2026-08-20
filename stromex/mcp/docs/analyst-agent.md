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

**Two kinds of barrier, and they are not the same in law:**

| Kind | Example | Can a human approve it? |
|---|---|---|
| **A decision that is the operator's to make** | "This trial needs an account; the terms permit automated signup — go ahead" | **Yes.** One-click approve/decline. The operator is deciding something they are entitled to decide |
| **A barrier the service built to keep programs out** | A CAPTCHA; an anti-automation block; terms that forbid automated signup | **No.** Authorisation for access belongs to the *service*, not the operator. A human clicking "approve" cannot grant a permission that was never theirs to give |

This is the crux and it is easy to miss: **unauthorised access is defined
by whether the service authorised it, not by whether the operator did.**
So the second kind is never behind the approval button. The agent reports
it — *"a person must do this part manually"* — and stops.

**Why this protects the institution, not just abstract ethics.** Under
the UK Computer Misuse Act 1990 and Nigeria's Cybercrimes Act 2015,
defeating an access control is an offence regardless of intent, and it
voids the terms of every service worth studying. An agent that did it
would put the school's name on an intrusion. The Founder's own brief ends
*"while staying within legal and ethical boundaries"* — this clause is the
one place that boundary and the earlier line disagreed, and the boundary
wins (`SEB §31`, the conflict-resolution rule: safety and law come first).

## The division of labour

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

**The Analyst acts only on systems it was authorised to access, only in
ways their terms allow, confirms email only in an inbox it owns, and
stops-and-asks rather than forcing any barrier a service put up.**

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
