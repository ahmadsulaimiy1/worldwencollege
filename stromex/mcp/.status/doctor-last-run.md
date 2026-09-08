# StromeX MCP doctor — last run

Ran: 2026-09-08T16:34:03Z
Outcome: success

```
StromeX Enterprise MCP 1.0.0 — doctor

State directory   /home/runner/.stromex-mcp
Audit log         /home/runner/.stromex-mcp/audit.jsonl
Protected ops     approval
Read-only         false
Spending          disabled
Protected patterns 15 (see stromex.policy.describe)

Credentials
  ✗ cloudflare  not configured — missing CLOUDFLARE_API_TOKEN
      needed to manage Workers, Pages, D1, R2, KV, Queues and DNS
  ✓ github      GITHUB_TOKEN=env:56d166a7ff99
  ✗ neon        not configured — missing NEON_API_KEY
      needed to manage Postgres projects, branches, databases and migrations
  ✗ vercel      not configured — missing VERCEL_TOKEN
      needed to manage projects, deployments, environment variables and domains
  ✗ clerk       not configured — missing CLERK_SECRET_KEY
      needed to manage users, organisations, memberships and invitations
  ✗ resend      not configured — missing RESEND_API_KEY
      needed to send transactional email and manage sending domains
  ✗ brevo       not configured — missing BREVO_API_KEY
      needed to manage contacts, lists, campaigns and transactional email
  ✗ openai      not configured — missing OPENAI_API_KEY
      needed to consult the engineering council — independent review, alternatives, drafting and validation

Live checks (one authenticated read each)
  ✓ github        267ms  authenticated as ahmadsulaimiy1

All configured providers answered.
```
