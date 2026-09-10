# StromeX MCP — last run

Ran: 2026-09-10T01:56:03Z
Doctor outcome: failure
GitHub write outcome: success
Cloudflare write outcome: failure
Neon write outcome: failure
Vercel write outcome: success
Resend write outcome: success
Clerk write outcome: failure

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
  ✓ cloudflare    432ms  1 account(s) visible
  ✓ github        272ms  authenticated as ahmadsulaimiy1
  ✓ neon          285ms  2 project(s) visible
  ✓ vercel        185ms  1 project(s) in the first page
  ✓ clerk         602ms  1 user(s)
  ✓ resend        176ms  2 sending domain(s)
  ✗ brevo         466ms  CREDENTIAL_REJECTED: brevo account.get failed with HTTP 401: unauthorized: Key not found
      → The brevo credential was rejected or lacks the required scope. Run `stromex-mcp doctor` and re-check the token's permissions against mcp/docs/installation.md.
  ✓ openai        963ms  123 model(s) visible; default gpt-5

1 provider(s) failed. Nothing was changed.
```

## call github.variable.put
```
{"ts":"2026-09-10T01:56:00.319Z","level":"info","msg":"server assembled","providers":["github"],"tools":37,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "github.variable.put",
  "provider": "github",
  "operation": "variable.put",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_eda60153950f4878ac06",
  "durationMs": 510,
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
(skipped)
```

## call neon.branch.create
```
{"ts":"2026-09-10T01:56:01.930Z","level":"info","msg":"server assembled","providers":["neon"],"tools":30,"protectedOperations":"approval","readOnly":false,"spending":false}
{"ts":"2026-09-10T01:56:02.392Z","level":"error","msg":"tool failed","tool":"neon.branch.create","code":"PROVIDER_CONFLICT","resource":"orange-dawn-28507285/stromex-mcp-proof"}
{
  "tool": "neon.branch.create",
  "provider": "neon",
  "operation": "branch.create",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_d80ab6174b82404db358",
  "durationMs": 461,
  "ok": false,
  "summary": "neon.branch.create failed: neon branch.create failed with HTTP 409: BRANCH_ALREADY_EXISTS: branch already exists; branch_name:\"stromex-mcp-proof\"",
  "error": {
    "code": "PROVIDER_CONFLICT",
    "message": "neon branch.create failed with HTTP 409: BRANCH_ALREADY_EXISTS: branch already exists; branch_name:\"stromex-mcp-proof\"",
    "remediation": "The resource already exists or is in a conflicting state. Read it first, then update rather than create.",
    "retryable": false,
    "httpStatus": 409,
    "details": {
      "request_id": "aa458959-91b3-444d-99e9-13892fc9479b",
      "code": "BRANCH_ALREADY_EXISTS",
      "message": "branch already exists; branch_name:\"stromex-mcp-proof\""
    }
  },
  "auditSeq": 3
}
```

## call vercel.env.set
```
{"ts":"2026-09-10T01:56:02.588Z","level":"info","msg":"server assembled","providers":["vercel"],"tools":30,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "vercel.env.set",
  "provider": "vercel",
  "operation": "env.set",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_adf0f891e18a4e1394be",
  "durationMs": 210,
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
        "value": "eyJ2IjoidjIiLCJjIjoiS3F2NTU4czROQVdnS215S0paRFg1RWJEVTBnREhuZC9BMjdBZHRBcG44aHAzeWc3aEQyLysxem9KeUhiaEk0TTRLSG12bTF6YUwyVnRDa2t0cWwrNTFFZm04UWxTeGxGRjZIaUY1eHd0MTI3SUwrK0F5SjZyL0g3b0xGQ0dXOEI3NmozSHc9PSIsImsiOlsxODQsMSwyLDMsMCwxMjAsMTA3LDExOSwxNTMsMjMsMjIzLDExNywxODMsMTIwLDU3LDE5NiwxMSwyOCwyNDksMTE5LDEwNCwyMTMsMTY5LDE2MSwxNDEsMTQyLDk5LDY1LDQ5LDIxMiwzMCwxOTksOTcsMjA0LDIxOCw3NywxMDUsMTc5LDEsMjE3LDY3LDIxNSwxNTQsMjE0LDIzMiwxNDUsMTY3LDMyLDU4LDE4NSwyMTQsMjQwLDMwLDIxOSw3NSwwLDAsMCwxMjYsNDgsMTI0LDYsOSw0MiwxMzQsNzIsMTM0LDI0NywxMywxLDcsNiwxNjAsMTExLDQ4LDEwOSwyLDEsMCw0OCwxMDQsNiw5LDQyLDEzNCw3MiwxMzQsMjQ3LDEzLDEsNywxLDQ4LDMwLDYsOSw5NiwxMzQsNzIsMSwxMDEsMyw0LDEsNDYsNDgsMTcsNCwxMiw0NywxLDEzMSw4OCw1MCwxNjksMzksOTUsMTM0LDE2NCwxMTcsNDMsMiwxLDE2LDEyOCw1OSw3NCwxOTksODUsODUsNTgsNjksNTcsMTgwLDMxLDk0LDExOSwxODIsMTU4LDkyLDE3MSwxNjEsMjIsMjAwLDk5LDI1NCw1OCwyMzMsMzYsNDMsMTE2LDIwNSwxNTYsMjE5LDE5OSwxMzgsMTgsMzksMTAzLDg1LDIxMywxMzYsODMsODcsMjIyLDg5LDQwLDIwMiwxMDgsNzgsNzIsMTUzLDYwLDEzOSwyMjQsMTU1LDIwLDIxMiwyMTIsMjQzLDEyMywyNDQsMTMzLDI1MiwxMDddfQ==",
        "target": [
          "preview"
        ],
        "configurationId": null,
        "id": "YL11dEFjlYIt2Jlh",
        "key": "STROMEX_MCP_LAST_AUTONOMOUS_RUN",
        "createdAt": 1789001960668,
        "updatedAt": 1789005362765,
        "createdBy": "TSBilVo4Aio3S07lQy6Mym3M",
        "updatedBy": "TSBilVo4Aio3S07lQy6Mym3M"
      },
      "failed": []
    }
  },
  "auditSeq": 4
}
```

## call resend.email.send
```
{"ts":"2026-09-10T01:56:02.994Z","level":"info","msg":"server assembled","providers":["resend"],"tools":24,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "resend.email.send",
  "provider": "resend",
  "operation": "email.send",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_e54d979ee3494ac68555",
  "durationMs": 295,
  "ok": true,
  "summary": "Sent \"StromeX MCP -- autonomous write proof\" to ahmadbinibrohim@gmail.com",
  "data": {
    "id": "c7d48c37-8134-41d7-8017-722e9e448a15"
  },
  "auditSeq": 5
}
```

## call clerk.invitation.create / clerk.invitation.revoke
```
(skipped)
```
