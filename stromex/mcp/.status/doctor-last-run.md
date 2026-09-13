# StromeX MCP — last run

Ran: 2026-09-13T20:14:13Z
Doctor outcome: failure
GitHub write outcome: success
Cloudflare write outcome: success
Neon write outcome: success
Vercel write outcome: success
Resend write outcome: success
Clerk write outcome: success
OpenAI write outcome: success

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
  ✓ cloudflare    293ms  1 account(s) visible
  ✓ github        142ms  authenticated as ahmadsulaimiy1
  ✓ neon          163ms  2 project(s) visible
  ✓ vercel        294ms  1 project(s) in the first page
  ✓ clerk         483ms  1 user(s)
  ✓ resend        167ms  2 sending domain(s)
  ✗ brevo         305ms  CREDENTIAL_REJECTED: brevo account.get failed with HTTP 401: unauthorized: Key not found
      → The brevo credential was rejected or lacks the required scope. Run `stromex-mcp doctor` and re-check the token's permissions against mcp/docs/installation.md.
  ✓ openai        640ms  130 model(s) visible; default gpt-5

1 provider(s) failed. Nothing was changed.
```

## call github.variable.put
```
{"ts":"2026-09-13T20:13:45.374Z","level":"info","msg":"server assembled","providers":["github"],"tools":37,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "github.variable.put",
  "provider": "github",
  "operation": "variable.put",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_086d0cec64a5490d9aa6",
  "durationMs": 284,
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
  "requestId": "req_643d597bb6a74cf2b99e",
  "durationMs": 488,
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
  "requestId": "req_37dedb66e3ce440db5cf",
  "durationMs": 691,
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
  "requestId": "req_dbbc7bc7ea2f460da4f1",
  "durationMs": 202,
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
{"ts":"2026-09-13T20:13:48.207Z","level":"info","msg":"server assembled","providers":["vercel"],"tools":30,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "vercel.env.set",
  "provider": "vercel",
  "operation": "env.set",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_5d9929003c6c46edbdfb",
  "durationMs": 319,
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
        "value": "eyJ2IjoidjIiLCJjIjoiMGhzb3hxSXpUcklWYXNFemxqTzNzdXJqd0x4S1pnWmhma0FtV2pSUFM4Y0hyVnBtd1MzcXN3RE5EWHpYOS9UK1J5VzdQc3c5bUZ3VUszTUlic0hmVWpScUdDbWJuRHVXbGlTNzFVc05qMmlHaXFHdFJmdHdPR0JNVC9rZzg1N05tSGY4eGc9PSIsImsiOlsxODQsMSwyLDMsMCwxMjAsMTA3LDExOSwxNTMsMjMsMjIzLDExNywxODMsMTIwLDU3LDE5NiwxMSwyOCwyNDksMTE5LDEwNCwyMTMsMTY5LDE2MSwxNDEsMTQyLDk5LDY1LDQ5LDIxMiwzMCwxOTksOTcsMjA0LDIxOCw3NywxMDUsMTc5LDEsMTc0LDEzOCw0LDIyNiwyMSwxOTIsODgsMTQ2LDc2LDE1NiwzNiw5Miw5OCwxNjIsMTU0LDMwLDAsMCwwLDEyNiw0OCwxMjQsNiw5LDQyLDEzNCw3MiwxMzQsMjQ3LDEzLDEsNyw2LDE2MCwxMTEsNDgsMTA5LDIsMSwwLDQ4LDEwNCw2LDksNDIsMTM0LDcyLDEzNCwyNDcsMTMsMSw3LDEsNDgsMzAsNiw5LDk2LDEzNCw3MiwxLDEwMSwzLDQsMSw0Niw0OCwxNyw0LDEyLDk0LDIwNywxMjUsMTg1LDI1MiwyOCw1NSwxOTUsMTI4LDIzMywxMDksODAsMiwxLDE2LDEyOCw1OSwyMjAsMjA2LDIzNiw4MywyMyw1Miw0LDI5LDIwMCwxODUsNDUsNDIsMjU0LDE0Nyw0NywxMDAsMjQ1LDEwNSwyNTMsMTY2LDcwLDMxLDIwMywyNDUsMTA5LDc2LDE0NywyMzksMTMwLDI1NSwyMTAsMTg0LDcyLDExMywxMjAsMjQxLDE5MywxOTEsMjQ3LDEwOCwxOTAsMjQsMTM2LDc4LDEyMSwyNDcsNzcsMTI0LDI0NSw2NiwxNjcsMjI4LDIwMyw1NSwxNjQsMjMsMTI1LDIxLDE5MV19",
        "target": [
          "preview"
        ],
        "configurationId": null,
        "id": "YL11dEFjlYIt2Jlh",
        "key": "STROMEX_MCP_LAST_AUTONOMOUS_RUN",
        "createdAt": 1789001960668,
        "updatedAt": 1789330428461,
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
{"ts":"2026-09-13T20:13:48.793Z","level":"info","msg":"server assembled","providers":["resend"],"tools":24,"protectedOperations":"approval","readOnly":false,"spending":false}
{
  "tool": "resend.email.send",
  "provider": "resend",
  "operation": "email.send",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_67ee00ddd9b5471881c4",
  "durationMs": 142,
  "ok": true,
  "summary": "Sent \"StromeX MCP -- autonomous write proof\" to ahmadbinibrohim@gmail.com",
  "data": {
    "id": "c90434d4-51dd-431d-ba75-5ed594dd9bb7"
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
  "requestId": "req_acf4e1ef25c3475f8586",
  "durationMs": 131,
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
  "requestId": "req_0e60433339e64018bd9d",
  "durationMs": 183,
  "ok": true,
  "summary": "Invited ahmadbinibrohim+stromexmcpproof@gmail.com",
  "data": {
    "object": "invitation",
    "id": "inv_3JHugxDHsI0LzKGpD65C6gMlHWD",
    "email_address": "ahmadbinibrohim+stromexmcpproof@gmail.com",
    "public_metadata": {},
    "status": "pending",
    "url": "https://clerk.worldwencollege.co.uk/v1/tickets/accept?ticket=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlaXMiOjI1OTIwMDAsImV4cCI6MTc5MTkyMjQyOSwiaWlkIjoiaW5zXzNIelZ2a0M1c09zdHU5SHRpOGQ4NXF5bmhhcCIsInNpZCI6Imludl8zSkh1Z3hESHNJMEx6S0dwRDY1QzZnTWxIV0QiLCJzdCI6Imludml0YXRpb24ifQ.II3fc33rcSimuN4qZvmx5sMV6GyYJsJHex3W-NZq5JTAEJUjVaKetxFHiDl9J1xoz3FDZ1MjMB6ww3PmQfq-cJYQYQ0hDCNc-nvsJjEezAQIbJJofNjm3X8dyRxmOwkIWEB2GucB4FRCZ7mCAqoQP5RPzWrvrY1rQZF6j6KmKx-UZ2ZUbFOALSWMLwJsUslryDACbUojl0fXn0iVF_YQGrR-8lv_1gtzCeqFEBQFHl_PiWj1X9r6gCK41G2HgdqHdc6gZC_F8JLWb6q7SrikhjY-xs6d-BQJdvnKWbHw4b8Klz5fVk9dwNHKwW0DYD-JE31MsHc_2AQ--uDPAB9I1A",
    "expires_at": 1791922429754,
    "created_at": 1789330429755,
    "updated_at": 1789330429755
  },
  "auditSeq": 8
}

{
  "tool": "clerk.invitation.revoke",
  "provider": "clerk",
  "operation": "invitation.revoke",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_fa7271ffcf08489a8994",
  "durationMs": 159,
  "ok": true,
  "summary": "Revoked invitation inv_3JHugxDHsI0LzKGpD65C6gMlHWD",
  "data": {
    "object": "invitation",
    "id": "inv_3JHugxDHsI0LzKGpD65C6gMlHWD",
    "email_address": "ahmadbinibrohim+stromexmcpproof@gmail.com",
    "public_metadata": {},
    "revoked": true,
    "status": "revoked",
    "expires_at": 1791922429754,
    "created_at": 1789330429755,
    "updated_at": 1789330430201
  },
  "auditSeq": 9
}
```

## call openai.validate.independent
```
{"ts":"2026-09-13T20:13:50.512Z","level":"info","msg":"server assembled","providers":["openai"],"tools":30,"protectedOperations":"approval","readOnly":false,"spending":true}
{
  "tool": "openai.validate.independent",
  "provider": "openai",
  "operation": "validate.independent",
  "operationClass": "write",
  "dryRun": false,
  "requestId": "req_7702dcce3f274989af4b",
  "durationMs": 22517,
  "ok": true,
  "summary": "Council — independent validation — gpt-5-2025-08-07, 1877 tokens, 0.019034 USD",
  "data": {
    "model": "gpt-5-2025-08-07",
    "finding": "Igor Petrov, Security Architecture\n\nVerdict: Not proven by this run alone.\n\nStrongest argument against it\n- A single CI log can’t exclude a mocked OpenAI client, a human approval in the workflow, or an environment gate that required manual intervention. Nor does it prove that a spending cap was actually configured and enforceable, only that the observed spend was below some claimed number. “Policy-gated” is also unproven unless you show both the policy in force and a decision trail (allow/deny) tied to a specific, immutable policy version.\n\nWhat evidence would settle it\n- Real OpenAI call provenance\n  - Raw request/response metadata from the run: request-ids, model, endpoint, base_url = https://api.openai.com, SDK/version and commit SHAs, with no “mock”, “dry_run”, or alternate base URL.\n  - Matching entries from the OpenAI org’s usage/billing or audit logs for the same request-ids and timestamps.\n\n- Unattended and autonomous execution\n  - Workflow YAML showing the trigger (e.g., schedule or push), with no environment protection rules, manual approvals, or required reviewers; and job logs with “needs-approval” disabled.\n  - Evidence the content decision came from the model/tooling (inputs/outputs shown), not a checked-in fixture. If you use temperature=0, show non-trivial prompt-to-output trace; if >0, include seed and full prompt to prove the model generated it.\n  - Attestation that secrets were obtained via OIDC to a secret manager at runtime (no hand-injected API keys).\n\n- Policy-gated enforcement (not just “we think policy was applied”)\n  - The exact policy file (e.g., Rego/Cedar/custom) with version hash pinned in the workflow.\n  - Logs from the policy engine showing an ALLOW decision for this action, including policy version and inputs evaluated.\n  - A companion negative test from the same commit demonstrating a DENY path for a disallowed write, with logs.\n\n- Spending cap configured and respected\n  - Screenshot/API export of the org/project spend cap configuration in OpenAI (or your rate-limit/budget gateway), including the cap value and current usage at the time of the run.\n  - Logs from your budget enforcer documenting the cap check and remaining budget during the run.\n  - A controlled follow-up run that attempts to exceed the cap and is blocked, with corresponding logs and failed OpenAI calls.\n\n- Supply chain integrity\n  - Pin action SHAs, container digests, and OpenAI SDK version; include GitHub OIDC provenance/SLSA attestation for the run to rule out tampering.\n\nCorrected claim (what this run can honestly assert by itself)\n- “This run shows a successful unattended OpenAI write executed by stromex-mcp under a policy hook, with spend below a stated threshold.” It does not, by itself, prove autonomy, that the policy gate actually enforced decisions, or that a configured spending cap exists and would block overage.",
    "usage": {
      "inputTokens": 349,
      "outputTokens": 1528,
      "reasoningTokens": 896,
      "totalTokens": 1877
    },
    "cost": {
      "amount": 0.019034,
      "currency": "USD",
      "basis": "configured rates: 2/12 per million input/output tokens"
    },
    "requestId": "resp_06d8dc184c1db8e4006aa703ff8dd087d2a7e9ac7b9ba31420"
  },
  "warnings": [
    "This is a consultation, not a decision. Weigh it, explain the trade-off in your own words, and record what you adopt (SEB §32.4)."
  ],
  "auditSeq": 10
}
```
