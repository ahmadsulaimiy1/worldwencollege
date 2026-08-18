# Upgrade

*Changing the server without changing what it refuses.*

---

## 1. What must survive every upgrade

Before anything else, the invariants. An upgrade that breaks one of these
is not an upgrade:

1. **Nothing destroys an institutional record.** The built-in
   protected-resource patterns are extended, never shortened, without a
   recorded decision (`SEB §26.1`).
2. **The audit chain continues.** A schema change to the audit record is a
   MAJOR change and needs §5.
3. **No credential appears in a result, a log or an error.**
4. **Spending stays off** unless an operator turned it on.
5. **Every tool keeps its authority class**, or the change is announced.

The test suite asserts all five. If a change makes a test fail, the test
is almost certainly right.

## 2. Versioning

`MAJOR.MINOR.PATCH`.

| | When |
|---|---|
| **MAJOR** | An authority class changes; a tool is removed or renamed; the audit record schema changes; the envelope changes; a protected-resource default is removed |
| **MINOR** | A tool or provider is added; a workflow is added; an envelope field is added; a default is tightened |
| **PATCH** | A fix that changes no interface |

**Tightening is a MINOR change; loosening is MAJOR.** Adding a
protected-resource pattern makes the server refuse more, which is safe.
Removing one makes it refuse less, which is not.

## 3. Routine upgrade

```sh
git pull
npm ci
npm run typecheck
npm test                      # must be green before anything else
npm run build

node dist/index.js audit --verify     # the chain survived
node dist/index.js doctor             # every provider still answers
node dist/index.js catalogue > /tmp/after.txt
diff /tmp/before.txt /tmp/after.txt   # what changed in the surface
```

Take `/tmp/before.txt` **before** upgrading. The catalogue diff is the
change record for the tool surface, and it is the fastest way to see that
a tool quietly changed class.

Then, from a client: `stromex.policy.describe`. Confirm the protected
patterns, the protected-operation mode and the spending policy are what
you expect. A configuration default that changed under you is the thing
this check catches.

## 4. Upgrading the MCP SDK

The SDK is pinned. Treat a bump as its own change:

1. Read the SDK's changelog for **protocol** changes, not only API ones.
2. `npm install @modelcontextprotocol/sdk@<version>`
3. `npm test` — the end-to-end suite drives a real client over a real
   transport, so a protocol regression fails there.
4. Check `tools/list` still carries `outputSchema` and annotations on
   every tool; the e2e suite asserts this.
5. Connect a real client and call one read tool before trusting it.

**Do not upgrade the SDK and a provider adapter in the same commit.** When
something breaks you want to know which.

## 5. Changing the audit record schema

The most delicate change in the server, because the chain is computed over
the record.

- **Adding an optional field is safe.** `canonicalJson` sorts keys and
  drops `undefined`, so existing records still verify.
- **Renaming or removing a field breaks every record already written.**
  The chain does not "migrate"; it is a chain.

If a breaking change is genuinely necessary:

1. **Close the current log.** Move it aside with its date. Do not edit it.
2. Start a new one, and make the **first record** state that the schema
   changed, at which version, and where the previous log is.
3. Keep the old log forever (`SEB §26.4`). It remains verifiable under the
   old code, which is why the old code stays tagged.

## 6. Changing a provider adapter

Provider APIs move. When one does:

1. **Confirm from the provider's own published specification**, not from
   memory or from an error message. Vercel's list endpoint is `/v7` while
   a single deployment is `/v13`; that asymmetry is exactly the kind of
   thing a wrong assumption gets wrong.
2. **Update the integration test's routes in the same commit.** A route
   change without a test change is a test that now proves nothing.
3. If the provider changed an **error shape**, update `errorMessage` too —
   a remediation that no longer matches the error is worse than none.
4. If a capability moved from *available* to *not available*, say so in
   the tool description and in `stromex.version`'s known-limitations list.
   Do not silently drop the tool.

## 7. Adding a protected-resource pattern

The safest change in the server, and it needs no ceremony beyond a
recorded reason:

```ts
// core/policy.ts
export const DEFAULT_PROTECTED_RESOURCES = [
  // …
  '*alumni-record*',   // added <date>: the alumni register is permanent, per <decision>
];
```

Add the reason inline. A future reader deciding whether a pattern is too
broad needs the argument, not just the pattern.

**Removing one is a MAJOR change and needs a recorded decision by whoever
holds the authority in `SEB §0.7`.**

## 8. Rolling back

```sh
git checkout <previous-tag>
npm ci && npm run build
node dist/index.js audit --verify
node dist/index.js doctor
```

The state directory is compatible across MINOR and PATCH versions by
design. Across a MAJOR version, check §5 first: if the audit schema
changed, the old binary cannot read the new log, and the answer is the
preserved-and-restarted pattern, not a downgrade of the file.

## 9. Deprecating a tool

Never silently rename or remove. `SEB §20.6`: a renamed tool is a new
tool.

1. **MINOR**: add the replacement. Amend the old tool's description to
   begin `DEPRECATED — use <new name>. Removal in <version>.`
2. Leave both working for at least one MINOR cycle.
3. **MAJOR**: remove the old one, and say so in the release note.

## 10. After any upgrade

Read the audit log once. Not for compliance — to see that the first few
calls after the change did what you expected, with the classes you
expected, against the resources you expected. It takes two minutes and it
is the only check that looks at behaviour rather than at configuration.
