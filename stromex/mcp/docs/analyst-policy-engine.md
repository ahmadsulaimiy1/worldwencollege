# The Analyst policy engine — design

**A design document, not running code.** It specifies how the Analyst
agent (`mcp/docs/analyst-agent.md`, decisions `SEB-D 40`/`41`/`42`) turns
the Founder's written policy into per-site decisions, so it can be built
the moment its foundations exist.

Written to `SEB §18.14` — terms defined as they appear; `SEB` is the
StromeX Editorial Bible (the institution's rulebook), `§` reads "section".

---

## 1 · What the policy engine is

A small decision procedure that sits in front of every action the Analyst
might take on an outside service, and answers one question: **may we do
this, on this target, right now?** It reads two inputs — the Founder's
**policy** and an **authorisation register** — and produces one of three
outcomes: *proceed*, *hand the human one step*, or *decline*.

It exists so the company can move quickly without a person judging every
pop-up, while never doing something no policy could make lawful.

## 2 · The Founder's policy — what it contains

A single document the Founder writes and can change at will. The engine
reads it; it never overrides it. Proposed shape:

```yaml
# what the Analyst may study
allow:
  categories: [lms, school-portal, competitor-product]
  data_we_supply: [research-persona-name, research-inbox-address]
forbid:
  categories: [anything-requiring-payment-details, anything-medical]
  never_supply: [real-student-data, staff-personal-data, real-payment-cards]
terms:
  # register even where terms forbid automated signup?
  accept_terms_that_forbid_automation: false   # a civil breach; the company's call
data_handling:
  screenshots_of_third_party_ui: allowed        # for internal study only
  republishing_captured_material: forbidden     # respects their IP (SEB §29, §33)
```

Everything here is the company's own conduct, which the company is
entitled to decide. The engine enforces it exactly.

## 3 · The authorisation register — the one thing policy cannot fake

A separate list, because it records a fact about the **outside world**,
not a company preference: **which targets have authorised us.**

```yaml
authorised_targets:
  - domain: "*.our-own-domain.com"
    basis: owned
  - domain: "client-x.example"
    basis: signed-engagement
    scope_ref: "ROE-2026-014"          # the rules-of-engagement document
    valid_until: "2026-11-30"
```

A target is "authorised" only if it is on this list, in date. The engine
reads it; **the agent cannot add to it** — only a human can, because
adding an entry is asserting that a real authorisation document exists.

## 4 · The decision procedure

For each intended action on a target, in order:

1. **Policy check.** Is this target's category allowed, and is the action
   within policy? No → **decline**, logged with the rule that refused.
2. **Public tier.** Does the action need any account at all? No → **proceed**.
3. **Terms tier.** Registration or accepting terms:
   - Terms permit automated registration → **proceed** under policy.
   - Terms forbid it → proceed only if the policy's
     `accept_terms_that_forbid_automation` is true, and then **flag it as a
     civil breach** so the record shows the company chose it knowingly.
     Otherwise **decline**.
4. **Access-control tier.** A CAPTCHA or anti-bot challenge appears:
   - **Target is on the authorisation register, in date** → **proceed**
     automatically under policy. The owner authorised us.
   - **Not authorised** → the agent **never defeats it by machine**.
     Instead it **pauses and hands the human the single step** — "solve
     this box to prove a human is present" — then continues. A human
     solving the challenge the site asked for is exactly what the site
     wanted; a machine defeating it is not, and no policy can convert the
     one into the other.
     If no human is available, the target is **skipped**, not forced.

**The line, stated once:** the policy decides *what the company does*; the
authorisation register decides *whether a target's lock may be opened by
machine*; and a human solving a CAPTCHA is never a bypass, because the
CAPTCHA was only ever asking for a human.

## 5 · Everything is logged

Every decision — proceed, hand-off, decline — is written to the same
hash-chained audit trail as the rest of the system (`SEB §21`), naming the
target, the tier, the rule or authorisation that applied, and the outcome.
So the company can show, later and to anyone including its own counsel,
that the agent acted within policy and within authorisation on every
target it touched. For a compliance-conscious firm this record is the
point, not a side effect.

## 6 · What is automated, and what is not

| Automated | A human, briefly |
|---|---|
| Reading public material; exploring; mapping; capturing; comparing; filing | Creating an account where terms require a human |
| Registering where terms and policy permit | Solving a CAPTCHA on an un-authorised target (~10s) |
| Confirming the verification email in the research inbox | Adding an entry to the authorisation register |
| Proceeding on authorised targets under policy | — |

The hours are automated. The seconds are not, and cannot be.

## 7 · Build dependencies

Unchanged from the charter: browser automation (the server speaks to APIs,
not web pages, today), the research inbox (needs email configured), and the
knowledge base it files into (Phase 10, `SEB §36.8`). This document is the
design; it is built when those exist.
