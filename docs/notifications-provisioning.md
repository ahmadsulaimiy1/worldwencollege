# Notifications — provisioning state

What the code needs from Resend, what the connected Resend account
actually has, and what is therefore still blocking. Audited against the
live account on 2026-08-16.

The short version: **the integration code is finished and the account is
not provisioned.** No WEC-LC email can be sent today, and the reason is
one missing verified domain — not anything in this repository.

---

## What the code needs

`functions/_lib/notifications/resend-adapter.js` reads three variables,
set as Cloudflare Pages secrets (`npx wrangler pages secret put …`):

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | Bearer token. Sending scope is sufficient. |
| `RESEND_FROM_ADDRESS` | yes | Sending identity. **Its domain must be verified in Resend**, or every send returns 422. |
| `RESEND_REPLY_TO` | no | Where a reply goes. Unset omits the header. |

`NOTIFICATION_EMAIL` (see `.env.example`) is separate: it is where staff
are alerted, not a Resend setting, and it may point anywhere reachable.

Five events are templated in
`functions/_lib/notifications/events.js` — application received,
payment confirmed, payment failed, enrolment confirmed, and the staff
alert for a new application.

---

## What the account has

| | Found |
|---|---|
| Verified domains | `mail.shroyalschools.com` only |
| `worldwencollege.co.uk` | **absent** — not pending, not unverified, not present |
| API keys | one, named `Onboarding` (the key Resend creates at signup) |
| Webhooks | none |
| Templates | none |

### The blocker

There is no WEC-LC sending domain. The only verified domain on the
account belongs to a **different institution**, and it must not be used
here: sending College mail from `shroyalschools.com` would put another
organisation's name in the `From:` header of a WEC-LC applicant's
receipt, and would spend that organisation's sending reputation doing
it. Neither is ours to do.

So the next action is a decision about which name WEC-LC sends from,
followed by DNS. Both apex (`worldwencollege.co.uk`) and a subdomain
(`mail.` / `send.`) are legitimate; the subdomain is the more common
choice for transactional mail because it isolates sending reputation
from the domain a human types into a browser, and it is the pattern the
other domain on this account already follows.

Whichever is chosen, Resend issues DKIM and SPF records that have to be
added at the DNS host before `verify-domain` will pass.

### On the API key

`Onboarding` is the signup default and is full-access. Production
should use a separate **sending-only** key so that a leaked Pages secret
cannot list contacts, delete domains or mint further keys.

Create it in the Resend dashboard rather than through an assistant: a
key is only ever displayed once, and creating it through a chat
integration writes the secret into a conversation transcript.

---

## Not yet built

**Bounce and complaint handling.** No webhook is registered, so a
bounced application receipt is invisible. `notify()` records `sent` the
moment Resend *accepts* the message, which is a statement about the API
call and not about delivery — an applicant whose receipt hard-bounced
looks identical in `notification_log` to one who read it.

The handler shape already exists: `functions/_lib/payments/`
demonstrates the signed-webhook pattern this would follow, and
`notification_log` already carries `provider_ref`, which is the
`email.id` Resend reports events against. This is a real gap, and it is
worth doing before the founding cohort rather than after.

---

## Verifying, once a domain is verified

`GatewayNotConfiguredError` is thrown only when `RESEND_API_KEY` is
absent, so the error text tells you which of the two failure modes you
are in:

- `Resend is not configured — missing RESEND_API_KEY` → the secret is
  not set on the environment you are hitting.
- `Resend send failed: HTTP 422 — …not verified` → the key works and the
  domain does not.

`tests/notifications-adapter.test.mjs` covers the adapter's behaviour
against both, plus the proxy failures that sit in front of Resend
(non-JSON 502s, 429 rate limits, timeouts) without touching the network.
