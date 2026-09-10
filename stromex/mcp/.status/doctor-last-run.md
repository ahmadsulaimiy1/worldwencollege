# StromeX MCP — last run

Ran: 2026-09-10T02:33:28Z
Doctor outcome: failure
GitHub write outcome: success
Cloudflare write outcome: success
Neon write outcome: success
Vercel write outcome: success
Resend write outcome: success
Clerk write outcome: success
OpenAI write outcome: failure

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
  ✓ cloudflare    328ms  1 account(s) visible
  ✓ github        151ms  authenticated as ahmadsulaimiy1
  ✓ neon          215ms  2 project(s) visible
  ✓ vercel        283ms  1 project(s) in the first page
  ✓ clerk         446ms  1 user(s)
  ✓ resend        159ms  2 sending domain(s)
  ✗ brevo         271ms  CREDENTIAL_REJECTED: brevo account.get failed with HTTP 401: unauthorized: Key not found
      → The brevo credential was rejected or lacks the required scope. Run `stromex-mcp doctor` and re-check the token's permissions against mcp/docs/installation.md.
  ✓ openai       1258ms  123 model(s) visible; default gpt-5

1 provider(s) failed. Nothing was changed.
```

## call github.variable.put
```
{"ts":"2026-09-10T02:33:15.938Z","level":"info","msg":"server assembled","providers":["github"],"tools":37,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "github.variable.put",
  "provider": "github",
  "operation": "variable.put",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_944b436f25474aee9757",
  "durationMs": 316,
  "ok": true,
  "summary": "Updated variable STROMEX_MCP_LAST_AUTONOMOUS_RUN",
  "data": {
    "name": "STROMEX_MCP_LAST_AUTONOMOUS_RUN",
    "created": false
  },
  "auditSeq": 1
}
```

## call cloudflare.kv.namespace.create / cloudflare.kv.value.put
```
{
  "tool": "cloudflare.kv.namespace.list",
  "provider": "cloudflare",
  "operation": "kv.namespace.list",
  "operationClass": "read",
  "dryRun": false,
  "requestId": "req_e8884a8a394d4805aa31",
  "durationMs": 487,
  "ok": true,
  "summary": "1 KV namespaces",
  "data": {
    "count": 1,
    "items": [
      {
        "id": "f471971a426e4059ade21256c5aaad3f",
        "title": "stromex-mcp-proof",
        "supports_url_encoding": true
      }
    ]
  },
  "auditSeq": 2
}

Namespace stromex-mcp-proof already exists (f471971a426e4059ade21256c5aaad3f) from an earlier run; reusing it instead of creating a duplicate.

{
  "tool": "cloudflare.kv.value.put",
  "provider": "cloudflare",
  "operation": "kv.value.put",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_1828a0b8706e4d4c94ce",
  "durationMs": 767,
  "ok": true,
  "summary": "Wrote KV key last_autonomous_run",
  "auditSeq": 3
}
```

## call neon.branch.create
```
{
  "tool": "neon.branch.list",
  "provider": "neon",
  "operation": "branch.list",
  "operationClass": "read",
  "dryRun": false,
  "requestId": "req_a2a581cbabf14e51838a",
  "durationMs": 207,
  "ok": true,
  "summary": "2 branches",
  "data": {
    "count": 2,
    "items": [
      {
        "id": "br-purple-base-zayzqzt8",
        "name": "production",
        "default": true,
        "protected": false,
        "created_at": "2026-07-27T10:52:19Z",
        "current_state": "ready"
      },
      {
        "id": "br-cool-rice-zat7ruen",
        "name": "stromex-mcp-proof",
        "parent_id": "br-purple-base-zayzqzt8",
        "default": false,
        "protected": false,
        "created_at": "2026-09-10T00:59:19Z",
        "current_state": "ready"
      }
    ]
  },
  "auditSeq": 4
}

Branch stromex-mcp-proof already exists (br-cool-rice-zat7ruen) from an earlier run -- the create-write was already proven then, and is deliberately not repeated every 6 hours to avoid BRANCH_ALREADY_EXISTS and unbounded branch accumulation.
```

## call vercel.env.set
```
{"ts":"2026-09-10T02:33:18.842Z","level":"info","msg":"server assembled","providers":["vercel"],"tools":30,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "vercel.env.set",
  "provider": "vercel",
  "operation": "env.set",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_3d647a11ab374e99abec",
  "durationMs": 318,
  "ok": true,
  "summary": "Set STROMEX_MCP_LAST_AUTONOMOUS_RUN on prj_42YG9LlfYzxjW0st9hN4h6k0ZHtv for preview",
  "data": {
    "key": "STROMEX_MCP_LAST_AUTONOMOUS_RUN",
    "target": [
      "preview"
    ],
    "result": {
      "created": {
        "type": "encrypted",
        "value": "eyJ2IjoidjIiLCJjIjoiekh5MDZFU0xhNmdCVk1wY2VGQTFCdmtQZmdtOTJxRzJHUFY4T25MMVE3bGFGL1VmTmpmQ3EveDhXUGFpQkNKV2ZMR1lTNzBHMy82RTZJL2ZKNC9TOTcxbzdKUVduU1JSMm9RdVAxOVgxSnZEVzBXQUNHSFZKQnVyK0Y2VnFGcVFUVXo3aXc9PSIsImsiOlsxODQsMSwyLDMsMCwxMjAsMTA3LDExOSwxNTMsMjMsMjIzLDExNywxODMsMTIwLDU3LDE5NiwxMSwyOCwyNDksMTE5LDEwNCwyMTMsMTY5LDE2MSwxNDEsMTQyLDk5LDY1LDQ5LDIxMiwzMCwxOTksOTcsMjA0LDIxOCw3NywxMDUsMTc5LDEsMTc0LDEzOCw0LDIyNiwyMSwxOTIsODgsMTQ2LDc2LDE1NiwzNiw5Miw5OCwxNjIsMTU0LDMwLDAsMCwwLDEyNiw0OCwxMjQsNiw5LDQyLDEzNCw3MiwxMzQsMjQ3LDEzLDEsNyw2LDE2MCwxMTEsNDgsMTA5LDIsMSwwLDQ4LDEwNCw2LDksNDIsMTM0LDcyLDEzNCwyNDcsMTMsMSw3LDEsNDgsMzAsNiw5LDk2LDEzNCw3MiwxLDEwMSwzLDQsMSw0Niw0OCwxNyw0LDEyLDk0LDIwNywxMjUsMTg1LDI1MiwyOCw1NSwxOTUsMTI4LDIzMywxMDksODAsMiwxLDE2LDEyOCw1OSwyMjAsMjA2LDIzNiw4MywyMyw1Miw0LDI5LDIwMCwxODUsNDUsNDIsMjU0LDE0Nyw0NywxMDAsMjQ1LDEwNSwyNTMsMTY2LDcwLDMxLDIwMywyNDUsMTA5LDc2LDE0NywyMzksMTMwLDI1NSwyMTAsMTg0LDcyLDExMywxMjAsMjQxLDE5MywxOTEsMjQ3LDEwOCwxOTAsMjQsMTM2LDc4LDEyMSwyNDcsNzcsMTI0LDI0NSw2NiwxNjcsMjI4LDIwMyw1NSwxNjQsMjMsMTI1LDIxLDE5MV19",
        "target": [
          "preview"
        ],
        "configurationId": null,
        "id": "YL11dEFjlYIt2Jlh",
        "key": "STROMEX_MCP_LAST_AUTONOMOUS_RUN",
        "createdAt": 1789001960668,
        "updatedAt": 1789007599089,
        "createdBy": "TSBilVo4Aio3S07lQy6Mym3M",
        "updatedBy": "TSBilVo4Aio3S07lQy6Mym3M"
      },
      "failed": []
    }
  },
  "auditSeq": 5
}
```

## call resend.email.send
```
{"ts":"2026-09-10T02:33:19.424Z","level":"info","msg":"server assembled","providers":["resend"],"tools":24,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "resend.email.send",
  "provider": "resend",
  "operation": "email.send",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_6df82d0e933d420d9601",
  "durationMs": 132,
  "ok": true,
  "summary": "Sent \"StromeX MCP -- autonomous write proof\" to ahmadbinibrohim@gmail.com",
  "data": {
    "id": "1212e918-4aca-49c0-bd6a-a7781ee3c004"
  },
  "auditSeq": 6
}
```

## call clerk.invitation.create / clerk.invitation.revoke
```
{
  "tool": "clerk.invitation.list",
  "provider": "clerk",
  "operation": "invitation.list",
  "operationClass": "read",
  "dryRun": false,
  "requestId": "req_e338ec1b011445fa9c39",
  "durationMs": 135,
  "ok": true,
  "summary": "Invitations",
  "data": [],
  "auditSeq": 7
}

{
  "tool": "clerk.invitation.create",
  "provider": "clerk",
  "operation": "invitation.create",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_5750e9c9e6b04b7cbcfb",
  "durationMs": 225,
  "ok": true,
  "summary": "Invited ahmadbinibrohim+stromexmcpproof@gmail.com",
  "data": {
    "object": "invitation",
    "id": "inv_3J7MLvLAL7vl9CXoe14kYrjyiUK",
    "email_address": "ahmadbinibrohim+stromexmcpproof@gmail.com",
    "public_metadata": {},
    "status": "pending",
    "url": "https://clerk.worldwencollege.co.uk/v1/tickets/accept?ticket=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlaXMiOjI1OTIwMDAsImV4cCI6MTc5MTU5OTYwMCwiaWlkIjoiaW5zXzNIelZ2a0M1c09zdHU5SHRpOGQ4NXF5bmhhcCIsInNpZCI6Imludl8zSjdNTHZMQUw3dmw5Q1hvZTE0a1lyanlpVUsiLCJzdCI6Imludml0YXRpb24ifQ.j-nWNf8njjz2zwfUi7szcRz95o5sYl95aRydARnNy3x7MgnrhvR3gBDyrdNJ2MQnu4U_fiTjI-ia9k4Yp9DoBo7sAzwqYsBrlZD_cuLFLMsCbbsc-299kdLiU3ikab4cM-1XcgO0imzLoo9i1dPADB11Fzh8vD7eDTDVcMgtEMWzLuR3qp30lpGrmb4yTMZiNvbg2ClMbpbJ5n-v8dBsiXdVgvF9eEd9DEfKyfdQ7sorQEttLxh4xCpIHDWsgHPDCmuyCvSC0Dqe2RUsY9cQ3Xw6s-RPAmsF9V2tEjHSyqwcwQHTBCGAhm9bieHLGm1-gd_W7bgnh1_lNc6EgSmgdQ",
    "expires_at": 1791599600412,
    "created_at": 1789007600413,
    "updated_at": 1789007600413
  },
  "auditSeq": 8
}

{
  "tool": "clerk.invitation.revoke",
  "provider": "clerk",
  "operation": "invitation.revoke",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_a248354651fe409caa4a",
  "durationMs": 151,
  "ok": true,
  "summary": "Revoked invitation inv_3J7MLvLAL7vl9CXoe14kYrjyiUK",
  "data": {
    "object": "invitation",
    "id": "inv_3J7MLvLAL7vl9CXoe14kYrjyiUK",
    "email_address": "ahmadbinibrohim+stromexmcpproof@gmail.com",
    "public_metadata": {},
    "revoked": true,
    "status": "revoked",
    "expires_at": 1791599600412,
    "created_at": 1789007600413,
    "updated_at": 1789007600843
  },
  "auditSeq": 9
}
```

## call openai.validate.independent
```
{"ts":"2026-09-10T02:33:21.156Z","level":"info","msg":"server assembled","providers":["openai"],"tools":30,"protectedOperations":"approval","readOnly":false,"spending":true}
{"ts":"2026-09-10T02:33:22.886Z","level":"warn","msg":"retryable provider response","provider":"openai","operation":"validate.independent","attempt":1,"status":429,"delay":185}
{"ts":"2026-09-10T02:33:24.946Z","level":"warn","msg":"retryable provider response","provider":"openai","operation":"validate.independent","attempt":2,"status":429,"delay":37}
{"ts":"2026-09-10T02:33:25.392Z","level":"warn","msg":"retryable provider response","provider":"openai","operation":"validate.independent","attempt":3,"status":429,"delay":528}
{"ts":"2026-09-10T02:33:28.332Z","level":"error","msg":"tool failed","tool":"openai.validate.independent","code":"PROVIDER_RATE_LIMITED","resource":"openai.validate.independent"}
{
  "tool": "openai.validate.independent",
  "provider": "openai",
  "operation": "validate.independent",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_4388e797e4be46abae53",
  "durationMs": 7174,
  "ok": false,
  "summary": "openai.validate.independent failed: openai validate.independent failed with HTTP 429: insufficient_quota: credit_balance_exhausted: You have no credits remaining. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing/.",
  "error": {
    "code": "PROVIDER_RATE_LIMITED",
    "message": "openai validate.independent failed with HTTP 429: insufficient_quota: credit_balance_exhausted: You have no credits remaining. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing/.",
    "remediation": "Rate limited. The client already backs off; if this persists, lower the configured request rate for this provider.",
    "retryable": true,
    "httpStatus": 429,
    "details": {
      "error": {
        "message": "You have no credits remaining. Add credits to continue using the API at https://platform.openai.com/settings/organization/billing/.",
        "type": "insufficient_quota",
        "param": null,
        "code": "credit_balance_exhausted"
      }
    }
  },
  "auditSeq": 10
}
```
