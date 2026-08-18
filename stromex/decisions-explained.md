# What you have decided, in plain words

**Every governance decision taken so far, rewritten without jargon.**
Written under `SEB-D 37`: a decision taken on an explanation you could not
fully follow is not a decision you made.

Each one says: **what it is · how it works · what you chose · what happens
if that turns out wrong.** Any of them can be changed. Say which.

---

## First, the words I kept using

| Word | What it means |
|---|---|
| **Provider** | An outside company whose service the system uses. You have eight: Cloudflare, GitHub, Neon, Vercel, Clerk, Resend, Brevo, OpenAI |
| **Credential** | A long password that lets a program act as you on one of those services. Also called a "key" or a "token" — same thing |
| **Scoping a credential** | Limiting what the password can do. Like a hotel key card that opens only your room, versus a master key that opens every room |
| **Expiry** | Some services let you stamp a date on a key, after which it stops working automatically. Others don't — those keys work forever until a human deletes them |
| **The MCP** | The program I built. It sits between me and the eight providers, and it is the thing that actually clicks the buttons |
| **A tool** | One action the MCP can take — "create a database", "send an email", "delete a user". There are 179 |
| **Read / write / protected** | The three risk levels I sort tools into. *Read* looks at things. *Write* changes things. *Protected* destroys things permanently, and always stops to ask you first |
| **The audit log** | A file recording every action the MCP took: what, when, on what, and whether it worked. It is append-only — new lines are added, old lines are never edited |
| **Rolling 30-day cap** | A spending limit measured over the last thirty days, counted backwards from today — not a calendar month. Spend £100 on the 3rd and it frees up again on the 3rd of next month |

---

## 1 · How much the system may spend (`SEB-D 28`)

**What it is.** The MCP can spend real money — buying a domain name, or
paying OpenAI to answer a question. This decides how much, without asking
you each time.

**How it works.** Three numbers. If any is exceeded, the action stops and
asks you.

**What you chose:**

| | |
|---|---|
| **Currency** | US dollars — because seven of the eight providers can only bill in dollars |
| **Most it may spend at once** | **$25.** Anything above stops and asks |
| **Most in any 30 days** | **$150** |
| **Which providers it may spend at** | Buying domains, paying OpenAI, sending email through Resend and Brevo |

**Why $150 and not more.** Running everything properly costs about $186 a
month — but almost none of that goes through the MCP. It goes on hosting
and bandwidth, which are billed by traffic, not by the MCP clicking
anything. What the MCP itself spends is about $50 a month on OpenAI. $150
gives it three times that.

**If this is wrong:** too low and the system stops mid-task to ask
permission for ordinary work. Too high and a bug that loops could spend
more than intended before anyone notices. Both are fixable in seconds —
it's one number in a settings file.

## 2 · The limits were not actually working (`SEB-D 29`)

**Not a decision you made — a fault I found and fixed. Recorded so it
isn't hidden.**

The 30-day limit was being read from the settings, displayed on screen,
and reported as active — and **no part of the program ever checked it**.
It had been that way since I wrote it. Three separate screens told an
operator a budget existed that did not.

Worse: after buying a domain, the system printed *"recorded in the audit
log with its cost"*. There was no field for cost in the audit log. It
said it had done something it had not done.

Also: buying a domain switched on **automatic yearly renewal** by default.
That turns a one-time purchase you approved into a charge every year
forever — and because the renewal is charged by the domain company
directly, the MCP never sees it, so it can never be counted or stopped.

All fixed. Auto-renew is now off unless you ask for it. And there is now a
test for each fault that fails if the fix is ever removed.

## 3 · What the credentials are allowed to do (`SEB-D 30`)

**This is the decision with the most risk attached.**

**What it is.** Each of the eight providers needs a credential. Some
companies let you make a limited one; some only make master keys.

**What each company can actually do**, from their own documentation:

| Provider | Can you limit it? |
|---|---|
| **GitHub** | Yes, very precisely — down to individual repositories, and keys can expire |
| **Cloudflare** | Mostly — per service, and keys can expire. But "edit" always includes "delete" |
| **Vercel** | Limited to one project, but you cannot control *what* it does within it |
| **Neon** | One project only, but always read **and** write. **No expiry, ever** |
| **Resend** | Two settings only: full access, or send-only. **No expiry** |
| **Clerk** | **No limits of any kind. No expiry.** Full control of your login system |
| **Brevo** | **No limits of any kind. No expiry.** Full control of your contacts |

**What you chose:**

- GitHub — **all repositories**, not just the one being worked on
- The others — **read and write**, as tightly limited as each allows
- Clerk and Brevo — **the real, live accounts**, not practice copies

**What that means concretely.** Clerk holds your users' logins. Brevo
holds your contact lists. Both keys are master keys that never expire. If
either leaks — a screenshot, an old laptop, a backup file — whoever finds
it can delete every user account or download your entire contact list, and
it keeps working until someone manually deletes it.

**What stands in the way.** Three tools marked *protected*: delete a user,
delete an organisation, delete a contact. Protected means the MCP stops
and makes you type the name of the thing before it will proceed. That is
the whole guard.

**The alternative I suggested.** A practice copy — Clerk lets you run a
fake version of your login system with no real users; Brevo lets you make
a separate sub-account with no real contacts. The MCP plays there; the
real thing stays untouched until you deliberately switch it over. It's
more setup, and you cannot test against real data.

**If this is wrong:** narrowing it later is easy — make a new key, delete
the old. But a leak that already happened cannot be undone.

## 4 · Where the passwords are stored (`SEB-D 34`)

**What it is.** Those eight credentials have to live somewhere the MCP can
read them and nobody else can.

**Why it matters more than it sounds.** Four of the eight — Neon, Resend,
Clerk, Brevo — issue keys that **never expire**. Nothing ever switches
them off automatically. So the only real protection is changing them
regularly, and how easy that is depends entirely on where they're kept.

**The three options, and how each behaves:**

| Where | Can you change a key without restarting the system? |
|---|---|
| **A password store** (what you chose) | Yes, within a minute |
| **A file on the machine** | Yes, within a minute. But the passwords sit on the disk in readable form |
| **Environment variables** | **No — the whole system must be restarted.** A running program cannot have these changed from outside |

**What you chose:** `pass` — a free password store that encrypts each
password in its own file using a key only you hold.

**One honest catch.** `pass` needs its encryption key unlocked to work,
and a server has nobody sitting there to type a password. If you unlock it
by removing the passphrase, the security is roughly the same as just using
a file — the encryption key becomes the thing worth stealing. What you
still gain: one file per password, and an automatic history of every time
each one changed. For four providers that will never tell you when a key
was last changed, that history is the only record that will exist.

**You also chose** to practise changing a key end-to-end before anything
goes live. The estate's own rule: a procedure nobody has ever run is not a
procedure.

## 5 · The spending limits at the providers (`SEB-D 32`)

**What it is.** Separate from the MCP's own limit. Each provider has its
own spending controls in its own website.

**Why it's separate.** The MCP's $150 only counts what the MCP itself
spends. Hosting and bandwidth are billed by traffic — visitors loading
pages — which never touches the MCP. It cannot see that spending, so it
cannot cap it.

**The size of the gap.** If something went badly wrong and ran unchecked
for thirty days, the arithmetic on published prices comes to **about
$43,200**. Most of it — two-thirds — is automated builds and bandwidth.
The MCP's $150 limit covers roughly $50 of that.

**What you chose:** the MCP's limit only, for now.

**Why that's defensible.** Nothing is live yet. No visitors, no traffic,
no automated builds running at volume. The $43,200 scenario needs a
running production site to be possible at all.

**What it means practically:** the provider-side limits become necessary
when you first put the site live — not when the credentials go in.

**Three of them cost nothing and are just switches left alone**, and
they're worth doing whenever you're next in those dashboards:

1. In **Resend**, leave "transactional overages" **off** — it already is.
   On, it lets sending continue past your paid limit and bill you.
2. In **Clerk**, leave **SMS login disabled**. Text messages cost money
   per message, and Clerk publishes no price for Nigerian numbers.
3. In **Brevo**, **never buy SMS credit**. Without it, the worst a fault
   can do is waste your email allowance rather than run up a bill.

## 6 · Where domains are bought (`SEB-D 35`, `SEB-D 36`)

**What it is.** A domain name is your web address — `worldwencollege.co.uk`.
You rent it yearly from a company called a registrar.

**What you chose:** buy from Cloudflare, which sells at cost — no
mark-up on the price they pay, either when you buy or when you renew.

**One correction worth repeating.** The $20 that prompted this is Vercel's
**monthly hosting fee**, not a mark-up on domains. On domains Vercel
charges $11.25 where Cloudflare charges about $10.60. **The registrar
change saves under a dollar a year.**

**Where the actual money is.** Your website is a set of fixed pages built
ahead of time — nothing calculated when a visitor arrives. **Cloudflare
hosts that kind of site free, with no bandwidth charge**, and your web
address already points at Cloudflare. Moving the hosting would save the
$20 a month — **$240 a year, against sixty cents.** Not decided; not
asked. Say if you want it costed.

**One thing that stays manual.** `worldwencollege.co.uk` is already
registered and already serving your site. `.co.uk` cannot be bought or
renewed automatically through either company's system, so its yearly
renewal is a manual job wherever it currently lives. **Nothing will
remind you.** Worth finding out when it expires.

## 7 · Email does not work yet, and why

**Not a decision — a finding, and it blocks real work.**

**How email proves it is genuine.** Anyone can put your address on an
email. Three public records stop that:

- **SPF** — a public list of which servers are allowed to send email using
  your web address.
- **DKIM** — a digital signature on each message, provable against a
  public key you publish.
- **DMARC** — an instruction to receiving mail servers about what to do
  when a message fails those checks, plus reports telling you it happened.

**What yours currently says.** I looked these up:

- **SPF** lists only Cloudflare's mail forwarding — **not Resend, not
  Brevo**.
- **DKIM** — no signature set up for either.
- **DMARC** — **none at all.**

**What follows.** Your domain can *receive* email and cannot *send* it. If
the system sent mail through Resend or Brevo today, it would fail the SPF
check — not bounce, but be marked as suspicious, which is worse in one
way: delivery quietly degrades instead of failing visibly. And with no
DMARC, anyone can send email pretending to be your school and nothing will
report it.

**The fix is small** and the MCP can do it, because your DNS is on
Cloudflare and it has the tools: verify the sending address at the
provider, then publish the records. Roughly twenty minutes once there is a
Cloudflare credential.

---

## What is still yours to decide

| | |
|---|---|
| **Q1** | Is StromeX Technologies part of Sulaimiy Education Group, or separate? Nothing on paper says |
| **Q2** | Which legal entity is responsible for each system's personal data? **Nothing holding real student data may go live until this is written down** |
| **Q4** | Are the record-keeping retention periods approved by the Board? Until then, nothing that deletes records may be built |
| **Q5** | Who is the second approver at the Nursery and Primary school? Currently one person holds both roles that are meant to check each other |
| **Q8** | Is the award-naming question settled? |
