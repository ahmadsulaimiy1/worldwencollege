# Credentials — where they live, and how to rotate them

**Answers `SEB §28.4` Q10.** Ruled `SEB-D 34`: the estate's credentials
live in **`pass`**, the GPG-backed store, reached through the MCP's
command-resolver seam.

Read `SEB §9.2` first. This is how it is actually operated.

---

## 1. Why this matters more than it looks

**Four of the eight providers issue credentials that cannot expire.**
Established from their own documentation on 2026-08-18:

| Cannot expire | What the provider says |
|---|---|
| **Neon** | Every key type is *"valid until deliberately revoked"* |
| **Resend** | *"no built-in expiration date or automatic rotation mechanism"* |
| **Clerk** | No expiry, no scope, no ACL. Full admin over the instance until deleted |
| **Brevo** | No expiry on a plain `api-key` |

| Can expire | |
|---|---|
| **GitHub** | Fine-grained PATs take an expiry; App installation tokens expire in **one hour**, mandatory |
| **Cloudflare** | `not_before` / `expires_on`, plus a client-IP allowlist |
| **Vercel** | 1 day to 1 year |

A credential with no expiry has **no automatic off-switch**. A copy that
escapes — into a screenshot, an old laptop, a backup of a `.env`, a former
contractor's password manager — keeps working until a human deletes it.

Those same four also **cannot be scoped** (`SEB-D 30`). So for Neon,
Resend, Clerk and Brevo, **rotation is the entire control**, and how
easily a credential can be rotated is a property of where it lives.

## 2. The three homes, measured

| Home | Rotatable without restart | Permissions enforced | Notes |
|---|---|---|---|
| **`pass` (command)** | ✅ within 60s | GPG + filesystem | Rotatable by someone who is *not* whoever started the server. `SEB §9.2`'s first preference |
| **Operator file, 0600** | ✅ within 60s, mode re-checked every reload | ✅ group/world-readable is a startup failure | Values sit on disk in plaintext |
| **Process environment** | ❌ **restart only** | ❌ none | Visible in `/proc`, crash dumps and child processes. A process cannot have its environment changed from outside after it is spawned (`SEB-D 33`) |

Resolution order is env → file → command (most specific wins). **That is
not the same as preference order**, and the server warns at startup when a
secret command is configured *and* a credential is also present in the
environment — because the environment wins, so the store is never
consulted for that name and rotating it there does nothing.

## 3. Setting up `pass`

```sh
# One GPG key for the estate's secrets. Use a real passphrase.
gpg --full-generate-key            # RSA 4096 or ed25519; note the key id
pass init <KEY-ID>

# Optional but recommended: back the store with git, which gives you a
# rotation history for free.
pass git init
pass git remote add origin <a PRIVATE repository>
```

Then one entry per credential, named exactly as the server names it:

```sh
pass insert stromex/CLOUDFLARE_API_TOKEN
pass insert stromex/GITHUB_TOKEN
pass insert stromex/NEON_API_KEY
pass insert stromex/VERCEL_TOKEN
pass insert stromex/CLERK_SECRET_KEY
pass insert stromex/RESEND_API_KEY
pass insert stromex/BREVO_API_KEY
pass insert stromex/OPENAI_API_KEY
```

And point the server at it:

```sh
STROMEX_MCP_SECRET_COMMAND='pass show stromex/{name}'
```

`{name}` must match `/^[A-Z0-9_]+$/` or the server **refuses to
interpolate it rather than escaping it** — refusing is verifiable,
escaping is a class of bug.

### The unattended-auth problem, stated honestly

**`pass` needs an unlocked GPG key.** On a server there is nobody to type
a passphrase, and a `pinentry` prompt that nobody answers will block until
the 20-second timeout — which the server now treats as a **hard, explained
failure** rather than as "that credential is not configured"
(`SEB-D 34`). Two ways to live with it:

| | |
|---|---|
| **`gpg-agent` with a long cache** | `default-cache-ttl 34560000` / `max-cache-ttl 34560000` in `~/.gnupg/gpg-agent.conf`. Unlock once per boot, by hand. Stronger, and it needs a human present at every restart |
| **A passphrase-less key at 0600** | No prompt, ever. **Be clear-eyed: this is roughly equivalent in strength to the mode-checked operator file** — the key file *is* the secret. What `pass` still buys is one file per credential, a git history of every rotation, and a store that is not one `cat` away from disclosure |

Neither is wrong. The first is stronger; the second is what most unattended
deployments actually do. Choose deliberately and record which.

## 4. The rotation procedure

`SEB §11.7`: **a rotation procedure that has never been executed is not a
rotation procedure.** Ruled `SEB-D 34`: this is rehearsed end-to-end on a
real credential before anything reaches production.

Rotate in this order. Do not vary it — every step exists because skipping
it has a specific failure.

| | Step | Why this order |
|---|---|---|
| **1** | **Mint the new credential at the same scope**, in the provider's console | Same scope, or the rehearsal proves nothing about the credential you actually use |
| **2** | Record the *old* fingerprint: `stromex-mcp doctor` | It is what you will compare against. Twelve hex characters, non-reversible |
| **3** | **`pass edit stromex/<NAME>`** — replace the value | Both credentials are now live at the provider. This is the whole point of doing it in this order |
| **4** | Wait up to **60 seconds**, then `stromex-mcp doctor` again | The command resolver's TTL. The fingerprint should have changed |
| **5** | **Confirm the fingerprint moved**, and that the provider still answers | If it did not move, the value is being shadowed — check the environment (§2) |
| **6** | Exercise one real read against that provider | A fingerprint proves the *value* changed, not that the new value *works* |
| **7** | **Only now, revoke the old credential** at the provider | Revoking first is how a rotation becomes an outage |
| **8** | Note the rotation in the audit trail | Every record now carries `credentialFingerprint`, so the cutover is visible in the log rather than remembered |

**`pass git log` is your rotation history.** For four providers that will
never tell you themselves when a key was last changed, it is the only
record that exists.

## 4a. The rotation-due register — the replacement for expiry

`SEB-D 45` reversed the earlier decision to expire the estate's keys after
a year: **working keys never expire**, because a full-write infrastructure
key that lapses at an unattended moment takes the whole automation layer
down. That ruling came with one obligation, and this register discharges
it: *"never expire" must not become "never rotate."*

`stromex.credentials.status` is that register. For every configured
credential it reports:

- **`ageDays`** — how long *this server* has been seeing the current value.
- **`dueAt`** and **`daysUntilDue`** — one rotation interval from first
  sight (default **365 days**; set `STROMEX_ROTATION_INTERVAL_DAYS` to
  change it).
- **`overdue`** — true once the interval has passed. Overdue providers are
  named in the tool's summary and raised as a warning.
- **`firstSighting`** — true the first time this server ever saw the key,
  when the age is a *floor*, not a fact (see the honest gaps below).

**Write-capable providers are listed first**, because a full-write key that
has silently gone un-rotated is the exact exposure the never-expire
decision accepted. "Write-capable" is derived from the real tool surface —
a provider is write-capable when any of its tools changes or destroys a
resource — so it can never drift out of step with what the server can do.

**How the clock works.** The register keys off the credential's
**fingerprint** — the same 12-hex, non-reversible SHA-256 prefix the audit
log already stores. When the fingerprint changes, that *is* a rotation from
the server's point of view, so the clock resets to zero and the new
`dueAt` is one interval out. Recording a first-observation timestamp is the
only write `stromex.credentials.status` performs, it touches no provider,
and an unchanged credential is not re-written on every call.

**The honest gaps**, stated because a register that overstates its
certainty is the failure `SEB-D 27` exists to prevent:

- No provider API reveals when a key was *minted*. Age is measured from
  first sight here, so on a brand-new install every key reads "age 0" on
  day one even if the key itself is old. For a genuinely old key that is
  optimistic, and `firstSighting` flags exactly those rows.
- A key rotated in the vault but not yet resolved by the server shows its
  old age until the next resolution refreshes the fingerprint — a lag of at
  most one observation.

The register lives at `~/.stromex-mcp/rotation.json` (override with
`STROMEX_MCP_ROTATION_PATH`), mode `0600`, and rebuilds itself from the
next observation if removed. It holds only names, fingerprints and dates —
never a value.

## 5. What the server guarantees, and what it does not

**Guaranteed, and tested:**

- A `SecretRef` cannot be accidentally printed — `toString`, `toJSON` and
  Node's inspection hook all return `«redacted»`; plaintext exits only
  through `.reveal()`, which is greppable.
- Redaction is **by value, not by key name**, so a credential is caught
  inside a connection URI, inside a provider's echo of a request, and
  inside a stack trace.
- A declared secret argument is masked **structurally** out of the audit
  record on every path — validation failure, denial, awaiting approval,
  dry run, handler throw, success (`SEB-D 31`).
- The operator file's mode is re-checked on **every** reload, not only at
  startup (`SEB-D 33`).
- A secret-command **timeout is fatal and explained**, never silently
  "not configured" (`SEB-D 34`).

**Not guaranteed, and you should know it:**

- **The audit trail is tamper-EVIDENT, not tamper-proof.** Anyone who can
  write the file can rewrite the chain from a chosen point. Making it
  tamper-proof needs an external append-only sink — `chattr +a`, a log
  collector, or object-lock storage — and none is implemented.
- **Values shorter than 8 characters are not registered for redaction**,
  because blanking a 4-character string would destroy unrelated output.
  Declared secret arguments are masked structurally regardless of length;
  a short credential arriving any other way is not.
- **No adapter in this build has met a real credential** yet
  (`not-verified.md §1`). Request construction and response handling are
  proven against scripted providers written from published documentation;
  the endpoint paths themselves are unverified.
