# Getting the first credential in

**A runbook, one provider at a time, starting with Cloudflare.**

Written under `SEB §18.14` — every term defined where it appears, the
mechanism explained, and the consequence of getting it wrong stated.

---

## What we are actually making

**An API key is not your login password.** Your login password proves a
*person* is who they say, and opens the whole account — billing, settings,
deleting things, and every API key inside it. An API key is a separate
string the company generates *for a program*, does one job, and can be
deleted on its own without locking anybody out.

**A program must never hold a login password** (`SEB §9.2b`). Every
control this system has — the spending limit, the delete protection, the
audit trail — lives inside the provider's API. A login password walks past
all of it by using the website instead.

## The order, and why

**Cloudflare first, alone.** Three reasons, and they are the reasons:

1. **Its keys can be made read-only.** A read-only key cannot change one
   character of anything. That makes the first real test almost risk-free.
2. **Its keys can be given an expiry date.** So a first attempt cannot
   quietly become a permanent credential nobody remembers.
3. **It unlocks the most.** The estate's DNS is on Cloudflare, so this is
   the key that makes the email fix possible.

If something in this code is wrong, we find out on the safest provider
rather than on the live login system.

---

## Cloudflare

### 1 · Create it

**Manage Account → Account API Tokens → Create Token → Create Custom
Token.** (Falls back to *profile → API Tokens* if the account-level page
is not offered; account-owned is preferred because it belongs to the
institution rather than to one person's login.)

**Name:** `stromex-mcp read-only`

**Permissions — exactly three, all `Read`:**

| Group | Permission | Access | Why this one |
|---|---|---|---|
| Account | Account Settings | **Read** | `doctor` calls `listAccounts()`; without this it cannot see anything at all |
| Zone | Zone | **Read** | To see which domains exist |
| Zone | DNS | **Read** | To read the records — the email findings depend on this |

**Nothing else.** "Edit" on any Cloudflare permission means full
create-read-update-**delete** on every resource of that type in the
account — there is no create-but-not-delete level. Read is genuinely
read.

**Resources:** Include → All accounts. Include → All zones.

**TTL:** one month. A first credential should not outlive the first test.

### 2 · Store it

Shown **once**. Into the password store immediately — never a chat, a
ticket, a screenshot or a desktop file.

### 3 · Prove it works, without anybody else seeing it

```sh
curl "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

| Answer | Meaning |
|---|---|
| `"success": true` with an account listed | Working. Note the account `id` — that is `CLOUDFLARE_ACCOUNT_ID` |
| `"success": false`, code `9109` / `10000` | Authentication failed — usually a truncated copy, or Account Settings Read not ticked |
| `"success": true` with an empty list | The token is valid but sees no account. The resource scope was set too narrowly |

**Send the code, never the token.** Every failure here is diagnosable from
the code alone.

### 4 · Hand it to the server

```sh
pass insert stromex/CLOUDFLARE_API_TOKEN
STROMEX_MCP_SECRET_COMMAND='pass show stromex/{name}'
stromex-mcp doctor
```

`doctor` asks each configured provider "are you there, and does this key
work?" and nothing else. It reads. It changes nothing.

Its output carries **fingerprints, never values** — twelve characters of a
one-way hash, enough to tell whether a key changed and useless for
impersonating it. That output is safe to share.

---

## The other seven, when we get to them

Same shape each time, and the differences are worth knowing in advance.

| Provider | Can it be read-only? | Can it expire? | The catch |
|---|---|---|---|
| **GitHub** | Yes, per-permission | **Yes** | Use a *fine-grained* token, not a classic one — a classic token has no per-repository dimension at all and grants write to every repo you can reach |
| **Vercel** | Only by the **role** of whoever made it | Yes, 1 day–1 year | The token cannot be limited; it is exactly as powerful as its creator |
| **Neon** | **No** — every key is Editor, read *and* write | **No** | Scope it to one project. That is the only limit available |
| **Resend** | Partly — `sending_access` or `full_access` | **No** | `full_access` includes deleting domains and other keys |
| **Clerk** | **No** | **No** | Any key is full control of the login system, including irreversible user deletion (`SEB-D 30`) |
| **Brevo** | **No** | **No** | Any key is full account access, including exporting every contact |
| **OpenAI** | Project-scoped | — | Set a project spend limit with "enforce a hard limit" — the cleanest real cap of the eight |

**Before Clerk and Brevo go in**, `SEB-D 30` requires the
protected-operation class to be re-verified against the live surface —
those three delete-protection tools are the only guard once an
unrestrictable key is installed, and they have so far only been proven
against a scripted stand-in.

## What never happens

- No credential is ever pasted into a chat, an issue, a commit or a
  screenshot. If one is, treat it as known to others: change it
  everywhere, enable multi-factor authentication, and do not attempt to
  judge whether it was "actually seen" (`SEB §9.2b`).
- No credential reaches the audit log. A caller-supplied secret is masked
  structurally, on every path (`SEB-D 31`).
- No credential is sent to OpenAI. The outbound payload is scanned and the
  call is refused if it would carry one.
