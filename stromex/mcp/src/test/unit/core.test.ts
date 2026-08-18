/**
 * Unit tests for the core runtime.
 *
 * Every guard is tested twice: once that it refuses, and once that
 * NOTHING HAPPENED when it refused (`SEB §23.9`). The estate's own
 * approval work established that property as the one that mattered, and
 * it is the one asserted here.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuditLog, canonicalJson, memorySink } from '../../core/audit.js';
import { ApprovalStore, digestArguments, memoryIo } from '../../core/approval.js';
import { HandleVault, resolveSecretArgument } from '../../core/vault.js';
import { PolicyEngine, globMatch } from '../../core/policy.js';
import { Logger } from '../../core/logger.js';
import { REDACTION_PLACEHOLDER, __resetSecretRegistryForTests, redactText, redactValue, registerSecretValue } from '../../core/redact.js';
import { SecretRef, SecretResolver, parseEnv } from '../../core/secret.js';
import { StromexError, codeForHttpStatus, toStromexError } from '../../core/errors.js';
import { DEFAULT_RETRY_POLICY, delayFor, parseRetryAfter, shouldRetry } from '../../core/retry.js';
import { CircuitBreaker, TokenBucket } from '../../core/ratelimit.js';

const at = (iso: string) => () => new Date(iso);

describe('redaction', () => {
  it('redacts by value wherever the value appears, not by key name', () => {
    __resetSecretRegistryForTests();
    registerSecretValue('super-secret-token-value');
    const text = 'Authorization failed for super-secret-token-value in header X-Anything';
    assert.equal(redactText(text), `Authorization failed for ${REDACTION_PLACEHOLDER} in header X-Anything`);
  });

  it('extracts and redacts the password component of a connection URI', () => {
    __resetSecretRegistryForTests();
    registerSecretValue('postgres://app:hunter2hunter2@db.example.com/main');
    // The password alone, appearing without its URI, is still caught.
    assert.equal(redactText('pw=hunter2hunter2'), `pw=${REDACTION_PLACEHOLDER}`);
  });

  it('refuses to register a value short enough to blank out unrelated text', () => {
    __resetSecretRegistryForTests();
    registerSecretValue('abc');
    assert.equal(redactText('abc def'), 'abc def');
  });

  it('walks nested structures and survives a cycle', () => {
    __resetSecretRegistryForTests();
    registerSecretValue('leaked-value-here-1234');
    const cyclic: Record<string, unknown> = { note: 'leaked-value-here-1234' };
    cyclic['self'] = cyclic;
    const out = redactValue(cyclic) as Record<string, unknown>;
    assert.equal(out['note'], REDACTION_PLACEHOLDER);
    assert.equal(out['self'], '[circular]');
  });
});

describe('SecretRef', () => {
  it('cannot be printed by any of the three routes a value normally escapes through', () => {
    __resetSecretRegistryForTests();
    const secret = new SecretRef('TEST_TOKEN', 'the-actual-secret-value', 'env');
    assert.equal(String(secret), REDACTION_PLACEHOLDER);
    assert.equal(JSON.stringify({ secret }), `{"secret":"${REDACTION_PLACEHOLDER}"}`);
    assert.equal(`${secret}`, REDACTION_PLACEHOLDER);
    assert.equal(secret.reveal(), 'the-actual-secret-value');
  });

  it('registers itself for redaction on construction', () => {
    __resetSecretRegistryForTests();
    new SecretRef('TEST_TOKEN', 'registers-itself-on-construction', 'env');
    assert.equal(redactText('saw registers-itself-on-construction here'), `saw ${REDACTION_PLACEHOLDER} here`);
  });

  it('fingerprints stably and non-reversibly', () => {
    const a = new SecretRef('A', 'same-value-both-times', 'env');
    const b = new SecretRef('B', 'same-value-both-times', 'env');
    const c = new SecretRef('C', 'a-different-value-here', 'env');
    assert.equal(a.fingerprint(), b.fingerprint());
    assert.notEqual(a.fingerprint(), c.fingerprint());
    assert.equal(a.fingerprint().length, 12);
    assert.ok(!a.fingerprint().includes('same-value'));
  });
});

describe('env file parsing', () => {
  it('handles export, quotes and comments, and does not interpolate', () => {
    const parsed = parseEnv(
      ['# a comment', 'export A=one', 'B="two"', "C='three'", 'D=$A-not-interpolated', '', 'MALFORMED'].join('\n'),
    );
    assert.deepEqual(parsed, { A: 'one', B: 'two', C: 'three', D: '$A-not-interpolated' });
  });
});

describe('logging', () => {
  it('writes structured records and redacts on the way out', () => {
    __resetSecretRegistryForTests();
    registerSecretValue('secret-in-a-log-line');
    const lines: string[] = [];
    const logger = new Logger({ level: 'debug', sink: (line) => lines.push(line), now: at('2026-08-18T09:00:00.000Z') });
    logger.warn('provider said', { detail: 'token secret-in-a-log-line rejected' });
    const record = JSON.parse(lines[0]!) as Record<string, string>;
    assert.equal(record['level'], 'warn');
    assert.equal(record['ts'], '2026-08-18T09:00:00.000Z');
    assert.ok(!record['detail']!.includes('secret-in-a-log-line'));
  });

  it('drops records below the configured level', () => {
    const lines: string[] = [];
    new Logger({ level: 'warn', sink: (line) => lines.push(line) }).info('ignored');
    assert.equal(lines.length, 0);
  });
});

describe('policy — the authority model', () => {
  const engine = new PolicyEngine();

  it('always permits reads', () => {
    assert.equal(engine.evaluate({ tool: 't', provider: 'p', operationClass: 'read' }).decision, 'allow');
  });

  it('permits reversible writes autonomously — the delegated authority is real', () => {
    assert.equal(engine.evaluate({ tool: 't', provider: 'p', operationClass: 'write', resource: 'anything' }).decision, 'allow');
  });

  it('requires approval for a protected operation on an ordinary resource', () => {
    const decision = engine.evaluate({ tool: 'x.delete', provider: 'p', operationClass: 'protected', resource: 'scratch-bucket' });
    assert.equal(decision.decision, 'approval_required');
    assert.equal(decision.decision === 'approval_required' && decision.requiresBackup, true);
  });

  it('REFUSES a protected operation on an institutional record, with no approval path', () => {
    for (const resource of [
      'aipc-recordings',
      'student-records-2026',
      'shrs-transcripts',
      'certificates-archive',
      'stromex-audit',
      'app-production',
    ]) {
      const decision = engine.evaluate({ tool: 'x.delete', provider: 'p', operationClass: 'protected', resource });
      assert.equal(decision.decision, 'deny', `${resource} should be refused outright`);
      assert.equal(decision.decision === 'deny' && decision.code, 'POLICY_PROTECTED_RESOURCE');
      assert.match(decision.reason, /Archive, revoke, supersede or deactivate/);
    }
  });

  it('refuses a protected resource even when protected operations are set to allow', () => {
    const permissive = new PolicyEngine({ protectedOperations: 'allow' });
    const decision = permissive.evaluate({ tool: 'x.delete', provider: 'p', operationClass: 'protected', resource: 'aipc-recordings' });
    assert.equal(decision.decision, 'deny');
  });

  it('treats a dry run as a read, so nobody is trained to approve reflexively', () => {
    const decision = engine.evaluate({ tool: 'x.delete', provider: 'p', operationClass: 'protected', resource: 'scratch', dryRun: true });
    assert.equal(decision.decision, 'allow');
  });

  it('refuses every mutating operation in read-only mode', () => {
    const readOnly = new PolicyEngine({ readOnly: true });
    assert.equal(readOnly.evaluate({ tool: 't', provider: 'p', operationClass: 'write' }).decision, 'deny');
    assert.equal(readOnly.evaluate({ tool: 't', provider: 'p', operationClass: 'read' }).decision, 'allow');
  });

  it('refuses a provider outside the allowed list', () => {
    const scoped = new PolicyEngine({ allowedProviders: ['github'] });
    assert.equal(scoped.evaluate({ tool: 't', provider: 'cloudflare', operationClass: 'read' }).decision, 'deny');
  });

  describe('spending', () => {
    it('refuses any purchase while spending is disabled — the shipped default', () => {
      const decision = engine.evaluate({
        tool: 'buy',
        provider: 'vercel',
        operationClass: 'write',
        purchase: { amount: 1, currency: 'USD', description: 'a domain' },
      });
      assert.equal(decision.decision, 'deny');
      assert.equal(decision.decision === 'deny' && decision.code, 'POLICY_SPEND_LIMIT');
    });

    it('permits a purchase under the limit once a policy exists', () => {
      const spending = new PolicyEngine({ spending: { enabled: true, currency: 'USD', maxSinglePurchase: 50, monthlyCap: 200 } });
      assert.equal(
        spending.evaluate({ tool: 'buy', provider: 'vercel', operationClass: 'write', purchase: { amount: 20, currency: 'USD', description: 'd' } }).decision,
        'allow',
      );
    });

    it('escalates a purchase above the single-purchase limit', () => {
      const spending = new PolicyEngine({ spending: { enabled: true, currency: 'USD', maxSinglePurchase: 50, monthlyCap: 200 } });
      assert.equal(
        spending.evaluate({ tool: 'buy', provider: 'vercel', operationClass: 'write', purchase: { amount: 90, currency: 'USD', description: 'd' } }).decision,
        'approval_required',
      );
    });

    it('refuses a mismatched currency rather than converting it', () => {
      const spending = new PolicyEngine({ spending: { enabled: true, currency: 'USD', maxSinglePurchase: 50, monthlyCap: 200 } });
      const decision = spending.evaluate({
        tool: 'buy',
        provider: 'vercel',
        operationClass: 'write',
        purchase: { amount: 10, currency: 'NGN', description: 'd' },
      });
      assert.equal(decision.decision, 'deny');
      assert.match(decision.reason, /does not convert currencies/);
    });
  });

  it('matches globs without treating regex metacharacters as syntax', () => {
    assert.ok(globMatch('aipc-*', 'aipc-recordings'));
    assert.ok(globMatch('*audit*', 'stromex-audit-log'));
    assert.ok(globMatch('a?c', 'abc'));
    assert.ok(!globMatch('a.c', 'abc'), 'a dot must be literal, not "any character"');
    assert.ok(!globMatch('prod', 'production'));
  });
});

describe('audit', () => {
  it('chains records and detects an edit, a removal and a reorder', () => {
    const sink = memorySink();
    const log = new AuditLog({ path: '(memory)', sink, now: at('2026-08-18T09:00:00.000Z') });
    for (const tool of ['a.read', 'b.write', 'c.delete']) {
      log.append({
        actor: 'test',
        tool,
        provider: 'p',
        operation: 'op',
        operationClass: 'read',
        outcome: 'ok',
        durationMs: 1,
        requestId: 'req',
      });
    }
    assert.equal(log.verify().ok, true);
    assert.equal(log.verify().total, 3);

    // Edit the middle record's contents, leaving its hash in place.
    const edited = JSON.parse(sink.lines[1]!) as Record<string, unknown>;
    edited['tool'] = 'b.something-else';
    sink.lines[1] = JSON.stringify(edited);
    const broken = new AuditLog({ path: '(memory)', sink }).verify();
    assert.equal(broken.ok, false);
    assert.equal(broken.brokenAtSeq, 2);
    assert.match(broken.reason!, /edited after it was written/);
  });

  it('detects a removed record', () => {
    const sink = memorySink();
    const log = new AuditLog({ path: '(memory)', sink });
    for (let index = 0; index < 3; index += 1) {
      log.append({ actor: 'a', tool: 't', provider: 'p', operation: 'o', operationClass: 'read', outcome: 'ok', durationMs: 0, requestId: 'r' });
    }
    sink.lines.splice(1, 1);
    const result = new AuditLog({ path: '(memory)', sink }).verify();
    assert.equal(result.ok, false);
    assert.match(result.reason!, /removed or reordered/);
  });

  it('redacts arguments at write time', () => {
    __resetSecretRegistryForTests();
    registerSecretValue('a-secret-in-arguments');
    const sink = memorySink();
    const log = new AuditLog({ path: '(memory)', sink });
    log.append({
      actor: 'a',
      tool: 't',
      provider: 'p',
      operation: 'o',
      operationClass: 'write',
      outcome: 'ok',
      durationMs: 0,
      requestId: 'r',
      arguments: { value: 'a-secret-in-arguments' },
    });
    assert.ok(!sink.lines[0]!.includes('a-secret-in-arguments'));
    assert.ok(sink.lines[0]!.includes(REDACTION_PLACEHOLDER));
  });

  it('canonicalises JSON so key order cannot break verification', () => {
    assert.equal(canonicalJson({ b: 1, a: 2 }), canonicalJson({ a: 2, b: 1 }));
    assert.equal(canonicalJson({ b: 1, a: 2 }), '{"a":2,"b":1}');
  });

  it('queries newest first and filters', () => {
    const log = new AuditLog({ path: '(memory)', sink: memorySink() });
    log.append({ actor: 'a', tool: 'x.read', provider: 'p', operation: 'o', operationClass: 'read', outcome: 'ok', durationMs: 0, requestId: 'r' });
    log.append({ actor: 'a', tool: 'y.delete', provider: 'q', operation: 'o', operationClass: 'protected', outcome: 'denied', durationMs: 0, requestId: 'r' });
    assert.equal(log.query()[0]!.tool, 'y.delete');
    assert.equal(log.query({ outcome: 'denied' }).length, 1);
    assert.equal(log.query({ provider: 'p' })[0]!.tool, 'x.read');
  });
});

describe('approvals', () => {
  const base = () => new ApprovalStore({ path: '(memory)', io: memoryIo(), ttlSeconds: 900, now: at('2026-08-18T09:00:00.000Z') });

  it('binds a grant to the exact arguments it was requested for', () => {
    const store = base();
    const request = store.create({ tool: 'x.delete', provider: 'p', resource: 'staging-bucket', description: 'delete it', argumentsDigest: digestArguments({ name: 'staging-bucket' }) });
    store.approve(request.id, { approvedBy: 'operator', channel: 'cli', phrase: request.confirmationPhrase });

    assert.throws(
      () => store.consume(request.id, digestArguments({ name: 'production-bucket' })),
      (error: StromexError) => error.code === 'POLICY_APPROVAL_INVALID',
      'an approval for one resource must not be replayable against another',
    );
    // And the grant survives the failed attempt, unconsumed.
    assert.equal(store.get(request.id)!.status, 'approved');
    assert.doesNotThrow(() => store.consume(request.id, digestArguments({ name: 'staging-bucket' })));
  });

  it('is single-use', () => {
    const store = base();
    const request = store.create({ tool: 'x.delete', provider: 'p', description: 'd', argumentsDigest: 'digest' });
    store.approve(request.id, { approvedBy: 'operator', channel: 'cli', phrase: request.confirmationPhrase });
    store.consume(request.id, 'digest');
    assert.throws(() => store.consume(request.id, 'digest'), (error: StromexError) => error.code === 'POLICY_APPROVAL_INVALID');
  });

  it('refuses a wrong confirmation phrase', () => {
    const store = base();
    const request = store.create({ tool: 'x.delete', provider: 'p', description: 'd', argumentsDigest: 'digest' });
    assert.throws(
      () => store.approve(request.id, { approvedBy: 'operator', channel: 'cli', phrase: 'YES' }),
      (error: StromexError) => error.code === 'POLICY_APPROVAL_INVALID',
    );
    assert.equal(store.get(request.id)!.status, 'pending');
  });

  it('cannot be consumed while merely pending', () => {
    const store = base();
    const request = store.create({ tool: 'x.delete', provider: 'p', description: 'd', argumentsDigest: 'digest' });
    assert.throws(() => store.consume(request.id, 'digest'), (error: StromexError) => error.code === 'POLICY_APPROVAL_INVALID');
  });

  it('expires', () => {
    let clock = new Date('2026-08-18T09:00:00.000Z');
    const store = new ApprovalStore({ path: '(memory)', io: memoryIo(), ttlSeconds: 60, now: () => clock });
    const request = store.create({ tool: 'x.delete', provider: 'p', description: 'd', argumentsDigest: 'digest' });
    store.approve(request.id, { approvedBy: 'operator', channel: 'cli', phrase: request.confirmationPhrase });
    clock = new Date('2026-08-18T09:05:00.000Z');
    assert.throws(() => store.consume(request.id, 'digest'), (error: StromexError) => error.code === 'POLICY_APPROVAL_EXPIRED');
  });

  it('builds a phrase that names the resource, so typing it proves it was read', () => {
    const store = base();
    const request = store.create({ tool: 'cloudflare.r2.delete', provider: 'cloudflare', resource: 'scratch-bucket', description: 'd', argumentsDigest: 'x' });
    assert.equal(request.confirmationPhrase, 'DELETE SCRATCH-BUCKET');
  });
});

describe('handle vault', () => {
  it('issues a handle, reveals once, and registers the value for redaction', () => {
    __resetSecretRegistryForTests();
    const vault = new HandleVault({ now: at('2026-08-18T09:00:00.000Z') });
    const entry = vault.store({ value: 'postgres://u:p@h/db-with-enough-length', label: 'neon', origin: 'test' });
    assert.match(entry.handle, /^vh_/);
    assert.equal(vault.reveal(entry.handle), 'postgres://u:p@h/db-with-enough-length');
    assert.equal(redactText('uri postgres://u:p@h/db-with-enough-length here'), `uri ${REDACTION_PLACEHOLDER} here`);
  });

  it('expires handles and says so rather than returning nothing', () => {
    let clock = new Date('2026-08-18T09:00:00.000Z');
    const vault = new HandleVault({ ttlSeconds: 60, now: () => clock });
    const entry = vault.store({ value: 'value-long-enough', label: 'l', origin: 'o' });
    clock = new Date('2026-08-18T09:05:00.000Z');
    assert.throws(() => vault.reveal(entry.handle), (error: StromexError) => error.code === 'PRECONDITION_FAILED');
  });

  it('requires exactly one of value or valueFromHandle', () => {
    const vault = new HandleVault();
    assert.throws(() => resolveSecretArgument({}, vault), (error: StromexError) => error.code === 'INPUT_INVALID');
    assert.throws(
      () => resolveSecretArgument({ value: 'a-value-here', valueFromHandle: 'vh_x' }, vault),
      (error: StromexError) => error.code === 'INPUT_INVALID',
    );
    assert.equal(resolveSecretArgument({ value: 'a-value-here' }, vault), 'a-value-here');
  });

  it('never exposes a value through list()', () => {
    const vault = new HandleVault();
    vault.store({ value: 'a-very-secret-value', label: 'l', origin: 'o' });
    assert.ok(!JSON.stringify(vault.list()).includes('a-very-secret-value'));
  });
});

describe('retry policy', () => {
  it('replays a network failure only for a method that is safe to replay', () => {
    const policy = DEFAULT_RETRY_POLICY;
    assert.equal(shouldRetry({ attempt: 1, policy, method: 'GET', networkFailure: true }), true);
    assert.equal(shouldRetry({ attempt: 1, policy, method: 'POST', networkFailure: true }), false);
    assert.equal(shouldRetry({ attempt: 1, policy, method: 'POST', idempotent: true, networkFailure: true }), true);
  });

  it('always retries a 429, whatever the method — it is a scheduling instruction', () => {
    assert.equal(shouldRetry({ attempt: 1, policy: DEFAULT_RETRY_POLICY, method: 'POST', status: 429 }), true);
  });

  it('does not retry a 409 unless the write is defined as idempotent', () => {
    assert.equal(shouldRetry({ attempt: 1, policy: DEFAULT_RETRY_POLICY, method: 'POST', status: 409 }), false);
    assert.equal(shouldRetry({ attempt: 1, policy: DEFAULT_RETRY_POLICY, method: 'PUT', status: 409, idempotent: true }), true);
  });

  it('does not retry a 400 or a 404', () => {
    assert.equal(shouldRetry({ attempt: 1, policy: DEFAULT_RETRY_POLICY, method: 'GET', status: 400 }), false);
    assert.equal(shouldRetry({ attempt: 1, policy: DEFAULT_RETRY_POLICY, method: 'GET', status: 404 }), false);
  });

  it('stops at the attempt limit', () => {
    assert.equal(shouldRetry({ attempt: 4, policy: DEFAULT_RETRY_POLICY, method: 'GET', status: 500 }), false);
  });

  it('uses full jitter — the delay is bounded by the exponential ceiling, not equal to it', () => {
    const policy = DEFAULT_RETRY_POLICY;
    assert.equal(delayFor({ attempt: 1, policy, random: () => 0 }), 0);
    assert.equal(delayFor({ attempt: 1, policy, random: () => 0.999 }), Math.floor(0.999 * 300));
    assert.equal(delayFor({ attempt: 3, policy, random: () => 1 }), 1200);
    // The ceiling is capped so a long outage does not produce a 40-minute wait.
    assert.equal(delayFor({ attempt: 20, policy, random: () => 1 }), policy.maxDelayMs);
  });

  it('honours Retry-After but bounds it', () => {
    const policy = DEFAULT_RETRY_POLICY;
    assert.equal(delayFor({ attempt: 1, policy, retryAfterSeconds: 5 }), 5000);
    assert.equal(delayFor({ attempt: 1, policy, retryAfterSeconds: 99_999 }), policy.maxRetryAfterMs);
  });

  it('parses Retry-After as seconds or as an HTTP date', () => {
    const now = new Date('2026-08-18T09:00:00.000Z');
    assert.equal(parseRetryAfter('30', now), 30);
    assert.equal(parseRetryAfter('Tue, 18 Aug 2026 09:00:30 GMT', now), 30);
    assert.equal(parseRetryAfter(null, now), undefined);
    assert.equal(parseRetryAfter('nonsense', now), undefined);
  });
});

describe('rate limiting and circuit breaking', () => {
  it('hands out a burst then makes the caller wait', () => {
    let ms = 0;
    const bucket = new TokenBucket({ refillPerSecond: 1, capacity: 2, now: () => ms });
    assert.equal(bucket.reserve(), 0);
    assert.equal(bucket.reserve(), 0);
    assert.ok(bucket.reserve() > 0, 'the third call in an empty bucket must wait');
    ms = 2000;
    assert.equal(bucket.reserve(), 0);
  });

  it('opens after consecutive failures and half-opens after the cooldown', () => {
    let ms = 0;
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000, now: () => ms });
    assert.equal(breaker.allowRequest(), true);
    breaker.recordFailure();
    assert.equal(breaker.state(), 'closed');
    breaker.recordFailure();
    assert.equal(breaker.state(), 'open');
    assert.equal(breaker.allowRequest(), false);
    ms = 1500;
    assert.equal(breaker.state(), 'half-open');
    assert.equal(breaker.allowRequest(), true, 'one probe is allowed');
    assert.equal(breaker.allowRequest(), false, 'and only one');
    breaker.recordSuccess();
    assert.equal(breaker.state(), 'closed');
  });
});

describe('errors', () => {
  it('maps statuses to codes a caller can branch on', () => {
    assert.equal(codeForHttpStatus(401), 'CREDENTIAL_REJECTED');
    assert.equal(codeForHttpStatus(404), 'PROVIDER_NOT_FOUND');
    assert.equal(codeForHttpStatus(409), 'PROVIDER_CONFLICT');
    assert.equal(codeForHttpStatus(429), 'PROVIDER_RATE_LIMITED');
    assert.equal(codeForHttpStatus(503), 'PROVIDER_UNAVAILABLE');
  });

  it('does not invent a remediation for an unanticipated failure', () => {
    const error = toStromexError(new Error('something nobody predicted'));
    assert.equal(error.code, 'INTERNAL');
    assert.match(error.remediation, /was not anticipated/);
  });

  it('classifies a timeout as retryable', () => {
    const abort = new Error('timed out');
    abort.name = 'TimeoutError';
    const error = toStromexError(abort);
    assert.equal(error.code, 'PROVIDER_TIMEOUT');
    assert.equal(error.retryable, true);
  });

  it('serialises to a shape carrying code, message and remediation', () => {
    const json = new StromexError({ code: 'INPUT_INVALID', message: 'm', remediation: 'r' }).toJSON();
    assert.deepEqual(Object.keys(json).sort(), ['code', 'message', 'remediation', 'retryable']);
  });
});

/*
 * SEB-D 31. Rotation must take effect without a restart.
 *
 * The resolver memoised every secret for the lifetime of the process, so a
 * credential rotated in the vault kept resolving to the old value until
 * somebody restarted the server — while `doctor` cheerfully reported the
 * new fingerprint. `installation.md §4a` and `SEB §9.2` both promised the
 * opposite. It also made a one-hour GitHub App installation token
 * unusable, which is the single best credential available to this estate.
 */
describe('credential rotation', () => {
  it('an environment rotation is live on the very next call', () => {
    const env: NodeJS.ProcessEnv = { TEST_TOKEN: 'first-value-long-enough' };
    const resolver = new SecretResolver({ env });

    assert.equal(resolver.resolve('TEST_TOKEN')!.reveal(), 'first-value-long-enough');
    env['TEST_TOKEN'] = 'second-value-long-enough';
    assert.equal(
      resolver.resolve('TEST_TOKEN')!.reveal(),
      'second-value-long-enough',
      'the rotated value was not picked up — a restart would be needed, which is the defect',
    );
  });

  it('the fingerprint moves with the value, so an operator can see the rotation', () => {
    const env: NodeJS.ProcessEnv = { TEST_TOKEN: 'first-value-long-enough' };
    const resolver = new SecretResolver({ env });
    const before = resolver.resolve('TEST_TOKEN')!.fingerprint();
    env['TEST_TOKEN'] = 'second-value-long-enough';
    assert.notEqual(resolver.resolve('TEST_TOKEN')!.fingerprint(), before);
  });

  it('a command-resolved secret is cached briefly, then re-resolved', () => {
    let calls = 0;
    let clock = 0;
    // The command resolver spawns a process, so it is the one source worth
    // caching. The TTL is what bounds how stale a rotation can be.
    const resolver = new SecretResolver({
      env: {},
      command: 'echo {name}',
      now: () => clock,
    });
    const runCommand = Reflect.get(resolver, 'runCommand') as (n: string) => string | undefined;
    Reflect.set(resolver, 'runCommand', (name: string) => {
      calls += 1;
      return `resolved-${name}-${calls}`;
    });

    assert.equal(resolver.resolve('TEST_TOKEN')!.reveal(), 'resolved-TEST_TOKEN-1');
    assert.equal(resolver.resolve('TEST_TOKEN')!.reveal(), 'resolved-TEST_TOKEN-1', 'inside the TTL, cached');
    assert.equal(calls, 1, 'the command should not be spawned twice inside the TTL');

    clock += 60_001;
    assert.equal(resolver.resolve('TEST_TOKEN')!.reveal(), 'resolved-TEST_TOKEN-2', 'past the TTL, re-resolved');
    assert.ok(typeof runCommand === 'function');
  });

  it('a resolve failure is never cached as absence', () => {
    let available = false;
    const resolver = new SecretResolver({ env: {}, command: 'echo {name}' });
    Reflect.set(resolver, 'runCommand', () => (available ? 'now-available-value' : undefined));

    assert.equal(resolver.resolve('TEST_TOKEN'), undefined);
    available = true;
    assert.ok(
      resolver.resolve('TEST_TOKEN'),
      'a secret manager that was briefly unreachable was remembered as absent',
    );
  });
});

/*
 * SEB-D 33. The operator file was a SNAPSHOT taken at startup.
 *
 * `SEB §9.2` names it as one of three permitted homes and requires every
 * credential to be "rotatable without a code change and without
 * downtime". Editing the file did nothing until a restart — and a file
 * chmod'ed to 0644 after startup was never noticed at all, because the
 * mode was checked exactly once.
 *
 * The comment claiming the file was re-read per call was written in the
 * same change that fixed the env path, and was simply wrong about the
 * file. It is recorded here because a wrong comment about a security
 * control is worse than no comment.
 */
describe('the operator file as a live source', () => {
  it('picks up an edit without a restart', () => {
    let contents: Record<string, string> = { TEST_TOKEN: 'first-value-long-enough' };
    let clock = 0;
    const resolver = new SecretResolver({ env: {}, loadFile: () => contents, now: () => clock });

    assert.equal(resolver.resolve('TEST_TOKEN')!.reveal(), 'first-value-long-enough');
    contents = { TEST_TOKEN: 'second-value-long-enough' };

    assert.equal(resolver.resolve('TEST_TOKEN')!.reveal(), 'first-value-long-enough', 'inside the TTL, cached');
    clock += 60_001;
    assert.equal(
      resolver.resolve('TEST_TOKEN')!.reveal(),
      'second-value-long-enough',
      'the edited file was never re-read — rotation would need a restart',
    );
  });

  it('re-checks the mode on every reload, not only at startup', () => {
    let clock = 0;
    let reads = 0;
    const resolver = new SecretResolver({
      env: {},
      loadFile: () => {
        reads += 1;
        // A file chmod'ed to 0644 after the server booted.
        if (reads > 1) throw new StromexError({ code: 'CONFIG_INVALID', message: 'group-readable', remediation: 'chmod 600' });
        return { TEST_TOKEN: 'first-value-long-enough' };
      },
      now: () => clock,
    });

    assert.ok(resolver.resolve('TEST_TOKEN'));
    clock += 60_001;
    // The last good values are kept rather than taking the server down,
    // but the loader ran again — which is what makes the mode check live.
    assert.ok(resolver.resolve('TEST_TOKEN'));
    assert.equal(reads, 2, 'the file was never re-read, so its mode was never re-checked');
  });

  it('keeps the last good values when the file is briefly unreadable', () => {
    let clock = 0;
    let broken = false;
    const resolver = new SecretResolver({
      env: {},
      loadFile: () => {
        if (broken) throw new Error('ENOENT — an editor renaming over it');
        return { TEST_TOKEN: 'first-value-long-enough' };
      },
      now: () => clock,
    });

    assert.ok(resolver.resolve('TEST_TOKEN'));
    broken = true;
    clock += 60_001;
    assert.equal(
      resolver.resolve('TEST_TOKEN')!.reveal(),
      'first-value-long-enough',
      'an atomic save briefly makes the file absent; that must not take the server down',
    );
  });

  it('the environment still wins over the file, and that is deliberate', () => {
    const resolver = new SecretResolver({
      env: { TEST_TOKEN: 'from-the-environment-value' },
      loadFile: () => ({ TEST_TOKEN: 'from-the-file-value-here' }),
    });
    assert.equal(resolver.resolve('TEST_TOKEN')!.source, 'env');
  });
});

/*
 * SEB-D 34. Q10 chose `pass`, which means the command resolver is now the
 * primary path — and its failure modes had to become legible.
 *
 * Every real secret manager fails the same way on a server: `pass` with a
 * locked GPG key, `op` with an expired session, `vault` with an expired
 * token. All three block on an interactive prompt nobody will answer.
 */
describe('the secret command', () => {
  it('treats a timeout as a hard, explained failure — never as "not configured"', () => {
    // A REAL blocking command against a real spawnSync. `pass` with a
    // locked GPG key, `op` with an expired session and `vault` with an
    // expired token all do exactly this: block on a prompt nobody will
    // answer.
    const resolver = new SecretResolver({ env: {}, command: 'sleep 5', commandTimeoutMs: 150 });

    assert.throws(
      () => resolver.resolve('TEST_TOKEN'),
      (e: StromexError) => e.code === 'CONFIG_INVALID' && /timed out/.test(e.message),
      'a locked keyring would present as eight providers quietly missing, with nothing saying why',
    );
  });

  it('records WHY a command failed, so "not configured" is not the whole story', () => {
    // A real non-zero exit with real stderr — what `pass` does when the
    // GPG key is absent.
    const resolver = new SecretResolver({
      env: {},
      command: 'echo "gpg: decryption failed: No secret key" >&2; exit 1',
    });

    assert.equal(resolver.resolve('TEST_TOKEN'), undefined, 'a missing optional credential is still not fatal');
    const [entry] = resolver.status(['TEST_TOKEN']);
    assert.equal(entry!.configured, false);
    assert.match(entry!.failure ?? '', /No secret key/, 'the operator is left guessing');
  });

  it('resolves a real value from a real command', () => {
    const resolver = new SecretResolver({ env: {}, command: 'echo resolved-value-for-{name}' });
    const ref = resolver.resolve('TEST_TOKEN');
    assert.equal(ref!.reveal(), 'resolved-value-for-TEST_TOKEN');
    assert.equal(ref!.source, 'command');
  });

  it('clears the recorded failure once the command starts working', () => {
    let broken = true;
    const resolver = new SecretResolver({
      env: {},
      command: 'sh -c \'if [ -n "$SX_OK" ]; then echo a-good-value-here; else echo broken >&2; exit 1; fi\'',
    });
    // First call fails; the reason is recorded.
    assert.equal(resolver.resolve('TEST_TOKEN'), undefined);
    assert.ok(resolver.commandFailure('TEST_TOKEN'));

    // Now make it succeed, and confirm the stale reason does not linger.
    broken = false;
    process.env['SX_OK'] = '1';
    try {
      resolver.invalidate();
      assert.ok(resolver.resolve('TEST_TOKEN'));
      assert.equal(resolver.commandFailure('TEST_TOKEN'), undefined, 'a stale failure reason outlived the failure');
    } finally {
      delete process.env['SX_OK'];
    }
    assert.equal(broken, false);
  });

  it('refuses to interpolate a name outside /^[A-Z0-9_]+$/ rather than escaping it', () => {
    const resolver = new SecretResolver({ env: {}, command: 'pass show stromex/{name}' });
    assert.throws(
      () => resolver.resolve('TOKEN; rm -rf /'),
      (e: StromexError) => e.code === 'CONFIG_INVALID' && /Refusing to interpolate/.test(e.message),
      'refusing is verifiable; escaping is a class of bug',
    );
  });
});
