# Developer Guide

*How to add a tool, a provider or a workflow without weakening anything.*

---

## 1. The shape of the codebase

```
src/
  index.ts        CLI — serve · doctor · approve · approvals · audit · catalogue
  server.ts       assembly: stores, providers, tools, resources, instructions
  config.ts       typed configuration and the environment schema
  core/           the runtime — nothing here knows about any provider
  providers/<n>/  client.ts (typed methods) + tools.ts (schemas and classes)
  workflows/      engine.ts + definitions.ts + tools.ts
  platform/       the stromex.* tools
  test/           unit · integration · e2e · support
```

**`core/` never imports from `providers/`.** If a change makes it want to,
the abstraction is in the wrong place.

## 2. Adding a tool

```ts
defineTool({
  name: 'cloudflare.queue.purge',          // <provider>.<resource>.<verb>
  title: 'Cloudflare — purge a Queue',
  description: 'Discards every message currently in a Queue.',
  provider: 'cloudflare',
  operationClass: 'protected',             // read | write | protected
  inputSchema: { queueId: z.string().min(1), name: z.string().min(1) },
  resource: (args) => args.name,           // REQUIRED on protected tools
  preImage: async (args, ctx) => ({        // REQUIRED on protected tools
    preImage: await cf(ctx).getQueue(args.queueId),
    restoreHint: 'Messages cannot be restored. Re-drive from the producer.',
  }),
  handler: async (args, ctx) => {
    if (ctx.dryRun) return plan(`Would purge ${args.name}`, args);
    await cf(ctx).purgeQueue(args.queueId);
    return { summary: `Purged ${args.name}`, warnings: ['Messages are gone.'] };
  },
})
```

### The rules

1. **Choose the class by what happens if you are wrong**, not by the HTTP
   method. `SEB §20.6`: the verb should tell the class. `delete` is
   always protected; `archive` and `revoke` are always write.
2. **Every mutating handler starts with `if (ctx.dryRun)`.** `dryRun` is
   a context field, not an argument, so it can never be a flag a handler
   forgets to declare.
3. **`resource` names what a person would recognise** — a bucket name, a
   repository, a domain — because that string is what the
   protected-resource patterns are matched against and what appears in
   the audit record.
4. **A protected tool without `resource` or `preImage` is refused at the
   gate**, deliberately, as a definition defect.
5. **Say what you did not do.** `warnings` is where a provider limitation,
   a partial result or a skipped item belongs. Silence reads as success.
6. **Never return a credential.** If a provider hands you one, put it in
   `ctx.vault` and return the handle.
7. **Say the limitation in the description**, not only in the docs. The
   description is what a model reads at the moment it decides.

### Then write the test

Two tests minimum, and the second is the one that matters:

```ts
it('does the thing', async () => { /* … */ });
it('refuses on an institutional record, and sends nothing', async () => {
  const envelope = await invokeTool(definition, { name: 'wec-lc-recordings' }, h.context());
  assert.equal(envelope.error?.code, 'POLICY_PROTECTED_RESOURCE');
  assert.equal(provider.requests.length, 0);   // ← nothing happened
});
```

## 3. Adding a provider

Six steps, and none is optional.

1. **`config.ts`** — add the name to `PROVIDER_NAMES`, its credentials and
   purpose to `PROVIDER_CREDENTIALS`, and a conservative rate limit to
   `PROVIDER_TUNING`.
2. **`providers/<name>/client.ts`** — a class over the shared `HttpClient`.
   Give it `authHeaders`, an `errorMessage` that turns the provider's own
   error shape into one useful line, and a `credentialFingerprint()`.
   **Never construct a second HTTP client**; every guarantee lives in the
   shared one.
3. **`providers/<name>/tools.ts`** — the tool table.
4. **`providers/index.ts`** — construct the client, push the tools, and add
   a `HEALTH_PROBES` entry that performs one cheap authenticated **read**.
5. **Integration tests** against a scripted provider, covering the success
   path, the provider's *real* error shapes, and a policy refusal.
6. **`docs/installation.md`** — the scopes, starting read-only.

### Error mapping is worth care

```ts
errorMessage: (status, body) => {
  const payload = body as { errors?: Array<{ code?: number; message?: string }> };
  return payload.errors?.map((e) => `${e.code}: ${e.message}`).join('; ');
}
```

A generic "HTTP 400" helps nobody, least of all a model trying to correct
its own arguments.

### Watch for envelope semantics

Cloudflare can answer **HTTP 200 with `success: false`**. An adapter that
reads `result` without checking `success` silently treats a refusal as an
empty result. `unwrap()` exists for exactly that, and there is a test for
it — check whether your provider has the same habit.

## 4. Adding a workflow

```ts
{
  name: 'domain.cutover',
  title: 'Move a domain to a new provider',
  description: 'Says what it does, in the order it does it, and why the order matters.',
  requires: ['cloudflare', 'resend'],
  inputSchema: { domain: z.string().min(1) },
  steps: (input) => [
    { id: 'records', title: 'Create the DNS records first', tool: 'cloudflare.dns.create',
      args: () => ({ /* … */ }),
      capture: (envelope, state) => { state['recordId'] = /* … */; },
      compensate: (state) => undefined },   // ← never destroys
  ],
}
```

Rules:

- **Every step goes through the registry**, so policy, approval and audit
  apply. A workflow is never a way around the gate.
- **A workflow undoes what it created**, and nothing else. A compensation
  naming a protected tool is refused by the engine and reported as *not
  undone* — do not try to route around that.
- **A step whose failure should not stop the run** is `optional: true`,
  and the report still shows it failed.
- **Take the backup first.** `database.provision` does; copy it.
- **Test that every step names a tool that exists.** There is already a
  test that walks every shipped workflow and asserts this; it will catch
  a renamed tool for you.

## 5. Testing

| Layer | Command | What it proves |
|---|---|---|
| Unit | `npm run test:unit` | Core logic, with injected clocks and sinks |
| Integration | `npm run test:integration` | Real request construction and response handling against a scripted provider |
| End to end | `npm run test:e2e` | A real MCP client over a real stdio transport against a real server process |

Everything: `npm test`. No network. No credentials. 132 tests today.

### The scripted provider is deliberately strict

`SEB §23.3` — a stand-in must be no more permissive than the thing it
stands in for. So it:

- **throws on an unmatched request**, rather than returning `{}`;
- matches method, path **and** query;
- answers 401 when the auth header is absent **or empty after its prefix**;
- refuses a body on a 204, as the platform does;
- reads multipart parts as text, so a test can assert what was in them.

Every one of those rules was added because a laxer version let something
through.

### What the tests do not prove

**No adapter in this build has been exercised against a real credential.**
Every path is proven against a scripted provider whose routes were written
from published documentation. That is stated at `SEB §28.5` and in
`stromex.version`, and it closes at the first preview environment.

## 6. Style

- **Types describe the domain**, not the wire. `OperationClass`,
  `SecretRef`, `AuditRecord` — never `string` where a union exists.
- **Errors carry a code, a message and a remediation.** An error that
  cannot say what to do next is not finished being written.
- **Comments explain the argument**, the defect that taught the rule, and
  anything that will look like a mistake. Not the syntax.
- **Inject the clock and randomness.** A module calling `Date.now()`
  directly cannot be tested deterministically.
- **No silent failure and no silent success.** A truncation, a fallback or
  a skipped item appears in `warnings`.

## 7. Before you open a pull request

```sh
npm run typecheck && npm test && node dist/index.js catalogue
```

Then read your own diff against `SEB §26` and ask the one question that
matters: **could this destroy something?** If the answer is anything other
than a clear no, the class is `protected` and the review is a different
review.
