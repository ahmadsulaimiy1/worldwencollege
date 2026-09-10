# StromeX MCP — last run

Ran: 2026-09-10T00:54:58Z
Doctor outcome: failure
GitHub write outcome: skipped
Cloudflare write outcome: skipped
Neon write outcome: skipped
Vercel write outcome: skipped
Resend write outcome: skipped

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
  ✓ brevo       BREVO_API_KEY=env:c175ca92423b
  ✓ openai      OPENAI_API_KEY=env:edd5edfe3874

Live checks (one authenticated read each)
  ✓ cloudflare    312ms  1 account(s) visible
  ✓ github        198ms  authenticated as ahmadsulaimiy1
  ✓ neon          172ms  2 project(s) visible
  ✓ vercel        228ms  1 project(s) in the first page
  ✓ clerk         282ms  1 user(s)
  ✓ resend        188ms  2 sending domain(s)
  ✗ brevo         321ms  CREDENTIAL_REJECTED: brevo account.get failed with HTTP 401: unauthorized: Key not found
      → The brevo credential was rejected or lacks the required scope. Run `stromex-mcp doctor` and re-check the token's permissions against mcp/docs/installation.md.
  ✓ openai        706ms  123 model(s) visible; default gpt-5

1 provider(s) failed. Nothing was changed.
```

## call github.variable.put
```
(skipped)
```

## call cloudflare.kv.namespace.create / cloudflare.kv.value.put
```
(skipped)
```

## call neon.branch.create
```
(skipped)
```

## call vercel.env.set
```
(skipped)
```

## call resend.email.send
```
(skipped)
```
