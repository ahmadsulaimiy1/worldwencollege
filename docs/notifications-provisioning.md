# Notifications — provisioning state

What the code needs from an email provider, what the connected accounts
actually have, and what is therefore still blocking. Audited 2026-08-16.

**Brevo is the provider. Resend is the fallback and stays wired.**
`functions/_lib/notifications/events.js` chooses at runtime — Brevo when
`BREVO_API_KEY` is set, Resend otherwise — so switching is a matter of
which secret exists on the environment, with no code change and no
redeploy of anything but the secret.

The reasoning for Brevo is recorded at the head of
`functions/_lib/notifications/brevo-adapter.js` and is not repeated
here. The short of it: Resend's free tier allows one verified sending
domain per account, and this account's single slot is held by a live
domain belonging to another school that sends sign-in codes people
depend on. It cannot be reclaimed. Without a verified domain Resend
sends only to the account holder's own address — which covers the staff
alert and leaves every applicant with no confirmation.

---

## What the code needs

Set as Cloudflare Pages secrets (`npx wrangler pages secret put …`).

**Brevo — the live path**

| Variable | Required | Purpose |
|---|---|---|
| `BREVO_API_KEY` | yes | Also the switch: its presence selects Brevo. |
| `BREVO_FROM_ADDRESS` | yes | Must be a verified sender, or an address on a domain authenticated in Brevo. |
| `BREVO_FROM_NAME` | no | Defaults to the College's name. |

**Resend — the fallback path**

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | Bearer token; sending scope suffices. |
| `RESEND_FROM_ADDRESS` | yes | Domain must be verified in Resend, or every send is a 422. |
| `RESEND_REPLY_TO` | no | Where a reply goes. Unset omits the header. |

`NOTIFICATION_EMAIL` is separate from both: it is where staff are
alerted, not a provider setting, and may point anywhere reachable.

Five events are templated in `events.js` — application received,
payment confirmed, payment failed, enrolment confirmed, and the staff
alert for a new application.

---

## Account state at the audit

**Resend.** One verified domain, `mail.shroyalschools.com`, belonging to
a different institution. No `worldwencollege.co.uk` — not pending, not
unverified, absent. One API key, `Onboarding`, which is the full-access
key Resend creates at signup. No webhooks, no templates.

That other domain must not be used to send College mail: it would put
another organisation's name in the `From:` header of a WEC-LC
applicant's receipt and spend that organisation's sending reputation
doing it. Neither is ours to do.

**Brevo.** Not audited from here — the adapter was written against the
documented API. Before the founding cohort, confirm in the Brevo
dashboard that `worldwencollege.co.uk` is authenticated (DKIM/SPF
published at the DNS host) rather than merely added, and that
`BREVO_FROM_ADDRESS` is on it.

### On API keys

Whichever provider is live, production should use a **sending-only**
key, so a leaked Pages secret cannot list contacts, delete domains or
mint further keys. Create it in the provider's dashboard rather than
through an assistant integration: a key is displayed once, and creating
it through a chat writes the secret into a transcript.

---

## Not yet built

**Bounce and complaint handling.** No webhook is registered with either
provider, so a bounced application receipt is invisible. `notify()`
records `sent` the moment the provider *accepts* the message, which is
a statement about the API call and not about delivery — an applicant
whose receipt hard-bounced looks identical in `notification_log` to one
who read it.

The shape already exists: `functions/_lib/payments/` demonstrates the
signed-webhook pattern this would follow, and `notification_log`
carries `provider_ref`, which is the id the provider reports events
against. Worth doing before the founding cohort rather than after.

---

## Reading a failure

`notification_log.provider` names the gateway that actually ran, so a
row can be attributed correctly once both providers have been used on
the same deployment. `GatewayNotConfiguredError` is thrown only when the
relevant API key is absent, which separates the two failure modes:

- `… is not configured — missing BREVO_API_KEY` / `RESEND_API_KEY` →
  the secret is not set on the environment you are hitting.
- `Resend send failed: HTTP 422 — …not verified` → the key works and the
  domain does not.

`tests/notifications-adapter.test.mjs` covers both, plus the proxy
failures that sit in front of a provider rather than inside it —
non-JSON 502s, 429 rate limits, timeouts — without touching the network.
