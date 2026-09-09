# StromeX MCP — last run

Ran: 2026-09-09T23:02:14Z
Doctor outcome: failure
Write outcome: skipped

## doctor
```
StromeX Enterprise MCP 1.0.0 — doctor

State directory   /home/runner/.stromex-mcp
Audit log         /home/runner/.stromex-mcp/audit.jsonl
Protected ops     approval
Read-only         false
Spending          disabled
Protected patterns 15 (see stromex.policy.describe)

Credentials
  ✓ cloudflare  CLOUDFLARE_API_TOKEN=env:9b74cb0e8f00
  ✓ github      GITHUB_TOKEN=env:56d166a7ff99
  ✓ neon        NEON_API_KEY=env:865808907697
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
  ✓ cloudflare    312ms  1 account(s) visible
  ✓ github        225ms  authenticated as ahmadsulaimiy1
  ✗ neon           90ms  INPUT_INVALID: neon project.list failed with HTTP 400: org_id is required, you can find it on your organization settings page
      → The provider rejected the arguments. Read `details` for the field it named and call again with corrected arguments.

1 provider(s) failed. Nothing was changed.
```

## call github.variable.put
```
(skipped)
```
