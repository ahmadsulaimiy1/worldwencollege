# StromeX MCP — last run

Ran: 2026-09-09T23:36:42Z
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
  ✓ vercel      VERCEL_TOKEN=env:1a1f5cfb7195
  ✓ clerk       CLERK_SECRET_KEY=env:aa9db8c80ade
  ✓ resend      RESEND_API_KEY=env:26dee232ef8d
  ✓ brevo       BREVO_API_KEY=env:a6c9d21b0bf2
  ✗ openai      not configured — missing OPENAI_API_KEY
      needed to consult the engineering council — independent review, alternatives, drafting and validation

Live checks (one authenticated read each)
  ✓ cloudflare    241ms  1 account(s) visible
  ✓ github        235ms  authenticated as ahmadsulaimiy1
  ✓ neon          212ms  2 project(s) visible
  ✓ vercel         88ms  1 project(s) in the first page
  ✓ clerk         562ms  1 user(s)
  ✓ resend        166ms  2 sending domain(s)
  ✗ brevo         529ms  CREDENTIAL_REJECTED: brevo account.get failed with HTTP 401: unauthorized: Key not found
      → The brevo credential was rejected or lacks the required scope. Run `stromex-mcp doctor` and re-check the token's permissions against mcp/docs/installation.md.

1 provider(s) failed. Nothing was changed.
```

## call github.variable.put
```
(skipped)
```
