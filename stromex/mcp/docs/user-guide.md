# User Guide

*For the person — or the agent — using the server. What it will do, what
it will refuse, and how to get the most out of it.*

---

## 1. What this is

One surface over Cloudflare, GitHub, Neon, Vercel, Clerk, Resend and
Brevo. Ask for infrastructure work in plain language; the server performs
it through the providers' own APIs, records everything, and refuses the
small number of things it is built to refuse.

## 2. What it will do without asking

Everything reversible. Design, code, provision, configure, migrate,
deploy, monitor, repair, document. Specifically:

- Create repositories, branches, commits, pull requests, issues, releases
- Set repository secrets and variables; trigger and watch Actions
- Deploy Workers; set Worker secrets; create D1, R2, KV, Queues
- Create and change DNS records; attach custom domains
- Trigger and roll back Cloudflare Pages and Vercel deployments
- Set environment variables; attach domains
- Create Neon projects, branches and databases; run SQL; apply migrations;
  take backup branches and restore from them
- Create and manage Clerk users, organisations, memberships, invitations
- Send transactional email; add and verify sending domains
- Manage contacts, lists, templates and campaigns

**This is delegated authority and it is meant to be used.** An agent that
stops to ask whether it may create a branch has misread the model.

## 3. What it will not do

### It will never destroy an institutional record

Certificates · transcripts · student records · registrar data · academic
history · uploaded documents · audit logs · production stores.

The refusal is **terminal**. There is no approval that unlocks it, and no
configuration flag that removes the built-in patterns. What you get
instead is `POLICY_PROTECTED_RESOURCE` and a pointer to the archive,
revoke, supersede or deactivate operation for the same resource — all of
which are ordinary writes needing no approval.

If something genuinely must be destroyed, a person does it in the
provider's console, deliberately, with the trail that leaves.

### It will not destroy anything else without a human

Deleting an ordinary bucket, a DNS record, a Worker, a secret — each
raises an approval request naming the resource and a phrase to type. A
human approves at a terminal, or through their client if it supports
elicitation. The limits of that control are set out honestly in
`docs/security.md § 3`; read it before relying on it.

### It will not spend money

Automatic purchasing is off until an operator sets an explicit policy
naming the providers, the maximum single purchase and the monthly cap.
Until then, `vercel.domain.check` will tell you what a domain costs and
`vercel.domain.buy` will refuse.

## 4. Getting the most out of it

**Ask for the outcome, not the call.** "Set up a preview environment for
the admissions service and tell me what it cost" is a better instruction
than a list of tool names.

**Dry-run anything that matters.**

> Run the production deploy workflow as a dry run and show me the plan.

Every mutating tool takes `dryRun`. It constructs the exact request and
sends nothing.

**Ask what it will refuse, before you need it to.**

> Describe the policy this server enforces.

**Ask for the estate.**

> Run the estate.report workflow.

Read-only: it walks every configured provider and reports what exists,
the policy in force, and the integrity of the audit chain.

**Ask what happened.**

> Show me every denied or approval-required action in the last week.

## 5. Reading a result

Every tool returns the same envelope:

| Field | Meaning |
|---|---|
| `ok` | Did it do what was asked |
| `summary` | One line, suitable for a report |
| `dryRun` | True when nothing was sent |
| `data` | The provider payload, normalised and redacted |
| `warnings` | **Read these.** Provider limitations and things not done |
| `error` | `code`, `message`, and a `remediation` saying what to do next |
| `approval` | Present when a human grant is needed, with how to give it |
| `auditSeq` | Which audit record this call produced |

**`warnings` is where the honesty lives.** A result with `ok: true` and a
warning saying the domain will not verify until DNS propagates has told
you something a bare success would not.

## 6. When it refuses

| Code | What it means | What to do |
|---|---|---|
| `POLICY_PROTECTED_RESOURCE` | An institutional record | Use archive, revoke or supersede. This will not be unlocked |
| `POLICY_APPROVAL_REQUIRED` | A human must grant it | Approve at a terminal, then call again with `approvalId` and identical arguments |
| `POLICY_SPEND_LIMIT` | No spending policy, or above its ceiling | Set a policy deliberately, or buy it by hand |
| `POLICY_FORBIDDEN` | This instance is read-only, or protected operations are disabled | A configuration decision — change it deliberately |
| `CREDENTIAL_MISSING` | That provider is not configured here | `stromex-mcp doctor` lists what is absent |
| `CREDENTIAL_REJECTED` | The key is wrong or lacks a scope | Check the token's permissions against the installation guide |
| `PROVIDER_UNAVAILABLE` | The provider, or an open circuit breaker | Wait. The client already backed off |

## 7. Credentials never come back to you

If you ask for a database connection string, you get a **handle** and the
non-secret parts — host, database, role. The handle can be passed to any
tool that sets a secret, so the credential travels from Neon to GitHub or
Cloudflare without ever appearing in the conversation.

Handles are in-process, short-lived, and there is no tool that reads one
back as text. This is deliberate, and it is why the workflow
`secrets.install-database` exists.

## 8. Where to look next

| Question | Document |
|---|---|
| How do I install and scope credentials? | `docs/installation.md` |
| What exactly does it refuse, and what are the limits of that? | `docs/security.md` |
| How do I run it day to day? | `docs/operations.md` |
| Something is gone. What now? | `docs/recovery.md` |
| Why is it built this way? | `docs/blueprint.md`, and the Editorial Bible |
| What is every tool? | `docs/tool-catalogue.md`, or `stromex-mcp catalogue` |
