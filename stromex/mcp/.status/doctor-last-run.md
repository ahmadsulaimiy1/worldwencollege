# StromeX MCP — last run

Ran: 2026-09-14T17:36:43Z
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
  ✓ cloudflare    766ms  1 account(s) visible
  ✓ github        220ms  authenticated as ahmadsulaimiy1
  ✓ neon          228ms  2 project(s) visible
  ✓ vercel        110ms  1 project(s) in the first page
  ✓ clerk         642ms  1 user(s)
  ✓ resend        173ms  2 sending domain(s)
  ✗ brevo         494ms  CREDENTIAL_REJECTED: brevo account.get failed with HTTP 401: unauthorized: Key not found
      → The brevo credential was rejected or lacks the required scope. Run `stromex-mcp doctor` and re-check the token's permissions against mcp/docs/installation.md.
  ✓ openai        676ms  130 model(s) visible; default gpt-5

1 provider(s) failed. Nothing was changed.
```

## call github.variable.put
```
{"ts":"2026-09-14T17:33:37.919Z","level":"info","msg":"server assembled","providers":["github"],"tools":37,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "github.variable.put",
  "provider": "github",
  "operation": "variable.put",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_8493bf2f1cec44099a68",
  "durationMs": 508,
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
  "requestId": "req_0b9f2391222e434190ab",
  "durationMs": 334,
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
  "requestId": "req_8f2702eda9f24ed39252",
  "durationMs": 766,
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
  "requestId": "req_96c1b9f07fb94952942e",
  "durationMs": 236,
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
{"ts":"2026-09-14T17:33:40.872Z","level":"info","msg":"server assembled","providers":["vercel"],"tools":30,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "vercel.env.set",
  "provider": "vercel",
  "operation": "env.set",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_51510693cb224d67a1ab",
  "durationMs": 134,
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
        "value": "eyJ2IjoidjIiLCJjIjoiN3FWbUV0KzEwNjMwQmJMYjFDMTYrZHNXNVFkYVZhOVlsMThLSVdGanJ5ejRHdVRHSVErcnNCaHpGUDB2YVhhem1iY255dmtRUWx4MElkNUoxQkxQQUMwUzE0ZWdmQlJUNERaQm02dE9tZGozYUdBVjBHa2hNNXlIakZEUnhYRGkwV1B4eWc9PSIsImsiOlsxODQsMSwyLDMsMCwxMjAsMTA3LDExOSwxNTMsMjMsMjIzLDExNywxODMsMTIwLDU3LDE5NiwxMSwyOCwyNDksMTE5LDEwNCwyMTMsMTY5LDE2MSwxNDEsMTQyLDk5LDY1LDQ5LDIxMiwzMCwxOTksOTcsMjA0LDIxOCw3NywxMDUsMTc5LDEsMTc1LDIyNSwxMDgsNzYsMTYsMTMxLDE0NCwxMDYsMjQsMTU5LDEyOCwxOTEsMjA0LDI0NCwyNDQsMjIzLDAsMCwwLDEyNiw0OCwxMjQsNiw5LDQyLDEzNCw3MiwxMzQsMjQ3LDEzLDEsNyw2LDE2MCwxMTEsNDgsMTA5LDIsMSwwLDQ4LDEwNCw2LDksNDIsMTM0LDcyLDEzNCwyNDcsMTMsMSw3LDEsNDgsMzAsNiw5LDk2LDEzNCw3MiwxLDEwMSwzLDQsMSw0Niw0OCwxNyw0LDEyLDE1NSwxMzQsMTg4LDM5LDIzLDgwLDk5LDE5MiwxNDMsNjQsMjUxLDY3LDIsMSwxNiwxMjgsNTksMzUsMjUwLDE1MiwxMjEsMjExLDE2NywxODIsMTY5LDE4NiwxNzIsODQsMjEzLDkwLDExMywyNTMsMjM0LDI3LDE3NCw1MiwxODEsMTIsNzEsMjQ0LDE0Myw1MywxMTQsNDEsOTYsMTMzLDIxMSw1MywyMjksNTIsMjIxLDE3MywyMjQsMjQ4LDI0Miw5NywyMzUsMjAyLDEzNiwxOTMsOTMsMTI1LDE2LDE3MiwyMDIsNDgsMTc1LDM0LDIxNiwxMjEsMTM3LDg5LDEwNiwxODgsNDIsMTM1XX0=",
        "target": [
          "preview"
        ],
        "configurationId": null,
        "id": "YL11dEFjlYIt2Jlh",
        "key": "STROMEX_MCP_LAST_AUTONOMOUS_RUN",
        "createdAt": 1789001960668,
        "updatedAt": 1789407220974,
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
{"ts":"2026-09-14T17:33:41.274Z","level":"info","msg":"server assembled","providers":["resend"],"tools":24,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "resend.email.send",
  "provider": "resend",
  "operation": "email.send",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_ab30db23cd53403b918a",
  "durationMs": 210,
  "ok": true,
  "summary": "Sent \"StromeX MCP -- autonomous write proof\" to ahmadbinibrohim@gmail.com",
  "data": {
    "id": "6212a7c5-e3ae-422c-a71f-0e6fb0170000"
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
  "requestId": "req_e97b1026797f4ad097ad",
  "durationMs": 151,
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
  "requestId": "req_bf2a9b7423a4487f9965",
  "durationMs": 182,
  "ok": true,
  "summary": "Invited ahmadbinibrohim+stromexmcpproof@gmail.com",
  "data": {
    "object": "invitation",
    "id": "inv_3JKQLKmqfzLYXjwiAZb8FMyou1q",
    "email_address": "ahmadbinibrohim+stromexmcpproof@gmail.com",
    "public_metadata": {},
    "status": "pending",
    "url": "https://clerk.worldwencollege.co.uk/v1/tickets/accept?ticket=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlaXMiOjI1OTIwMDAsImV4cCI6MTc5MTk5OTIyMiwiaWlkIjoiaW5zXzNIelZ2a0M1c09zdHU5SHRpOGQ4NXF5bmhhcCIsInNpZCI6Imludl8zSktRTEttcWZ6TFlYandpQVpiOEZNeW91MXEiLCJzdCI6Imludml0YXRpb24ifQ.U1N3fROr7T9h0zq-9sT7HRyO-oF80mk1d-GzRfr3JWg0xOvubuNRajxMOZap1F8in8HSRoDtMjNv13bwQOVYIIVxnJcHfXdn3FWVqmh5km4mPc1-pBAGGDoakh4FKsSt7gs05pwRtfSOtk-P0M5g_Fo0kkEJRf1jetXrViG9NfHs8XCrh-MY-l0lUy6Q9PRQbWcNecnHs8iMTGvfCS6iyiNj0anqFhzyeYU6-lwdr-lrkvtaPA5F5lK4DJNVLEGxYq5dNvyjZwK702Ngqu70bwbw7nqvkAqe7PCltx4c8LfQn6Uku0w4Ald9eKJhzo0zUlW02ODckMpQaLrA-XppBA",
    "expires_at": 1791999222303,
    "created_at": 1789407222304,
    "updated_at": 1789407222304
  },
  "auditSeq": 8
}

{
  "tool": "clerk.invitation.revoke",
  "provider": "clerk",
  "operation": "invitation.revoke",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_513bb852bdb04983b57e",
  "durationMs": 179,
  "ok": true,
  "summary": "Revoked invitation inv_3JKQLKmqfzLYXjwiAZb8FMyou1q",
  "data": {
    "object": "invitation",
    "id": "inv_3JKQLKmqfzLYXjwiAZb8FMyou1q",
    "email_address": "ahmadbinibrohim+stromexmcpproof@gmail.com",
    "public_metadata": {},
    "revoked": true,
    "status": "revoked",
    "expires_at": 1791999222303,
    "created_at": 1789407222304,
    "updated_at": 1789407222756
  },
  "auditSeq": 9
}
```

## call openai.validate.independent
```
{"ts":"2026-09-14T17:33:43.084Z","level":"info","msg":"server assembled","providers":["openai"],"tools":30,"protectedOperations":"approval","readOnly":false,"spending":true}
{"ts":"2026-09-14T17:36:43.093Z","level":"error","msg":"tool failed","tool":"openai.validate.independent","code":"PROVIDER_TIMEOUT","resource":"openai.validate.independent"}
{
  "tool": "openai.validate.independent",
  "provider": "openai",
  "operation": "validate.independent",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_2282b3002a21468ea0c1",
  "durationMs": 180007,
  "ok": false,
  "summary": "openai.validate.independent failed: Request aborted: Timed out after 180000ms",
  "error": {
    "code": "PROVIDER_TIMEOUT",
    "message": "Request aborted: Timed out after 180000ms",
    "remediation": "Retry; if it recurs, raise the per-provider timeout in configuration or check provider status.",
    "retryable": true
  },
  "auditSeq": 10
}
```
