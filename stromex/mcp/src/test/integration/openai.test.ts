/**
 * The engineering council, against a scripted OpenAI.
 *
 * The test that matters most here is the outbound secret guard: a
 * credential this process holds must never leave for a third party, and
 * the correct response is to REFUSE rather than to redact and send —
 * redacting would hide the mistake that put it there.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { invokeTool } from '../../core/registry.js';
import { SecretRef } from '../../core/secret.js';
import { StromexError } from '../../core/errors.js';
import { __resetSecretRegistryForTests, registerSecretValue } from '../../core/redact.js';
import { harness, tool } from '../support/harness.js';
import { scriptedProvider } from '../support/scripted-fetch.js';
import { OpenAiClient, assertNothingSecretOutbound } from '../../providers/openai/client.js';
import { openaiTools } from '../../providers/openai/tools.js';

const key = () => new SecretRef('OPENAI_API_KEY', 'sk-test-value-0123456789', 'env');

/** A minimal, correctly-shaped Responses API reply. */
const reply = (text: string, usage?: Record<string, unknown>) => ({
  id: 'resp_abc123',
  model: 'gpt-5',
  status: 'completed',
  output: [{ type: 'message', content: [{ type: 'output_text', text }] }],
  usage: usage ?? { input_tokens: 1200, output_tokens: 800, total_tokens: 2000, output_tokens_details: { reasoning_tokens: 300 } },
});

describe('OpenAI connector', () => {
  it('posts to the Responses API with a shaped instruction and the house brief', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      requireHeaderPrefix: 'Bearer ',
      routes: [{ method: 'POST', path: '/v1/responses', body: reply('1. The write path has no idempotency key.') }],
    });
    const h = harness().withClient('openai', new OpenAiClient({ apiKey: key(), fetchImpl: provider.fetch }));

    const envelope = await invokeTool(
      tool(openaiTools(), 'openai.review.architecture'),
      { subject: 'A queue consumer that writes to Postgres.', question: 'What fails at scale?' },
      h.context(),
    );

    assert.equal(envelope.ok, true);
    const sent = provider.requests[0]!.body as { model: string; instructions: string; input: string; max_output_tokens: number };
    assert.equal(sent.model, 'gpt-5');
    assert.match(sent.instructions, /StromeX Technologies/, 'the house brief travels with every consultation');
    assert.match(sent.instructions, /never destroyed/, 'and it carries the standing constraint on institutional records');
    assert.match(sent.instructions, /principal architect/, 'plus this tool\'s own line of attack');
    assert.match(sent.input, /## Subject/);
    assert.match(sent.input, /## The question/);

    const data = envelope.data as { finding: string; usage: { totalTokens: number } };
    assert.match(data.finding, /idempotency key/);
    assert.equal(data.usage.totalTokens, 2000);
  });

  it('REFUSES to send material containing a credential this process holds', async () => {
    __resetSecretRegistryForTests();
    registerSecretValue('ghp_a_real_looking_token_value');
    const provider = scriptedProvider({ requireHeader: 'authorization', routes: [] });
    const h = harness().withClient('openai', new OpenAiClient({ apiKey: key(), fetchImpl: provider.fetch }));

    const envelope = await invokeTool(
      tool(openaiTools(), 'openai.review.code'),
      { subject: 'const token = "ghp_a_real_looking_token_value";\nfetch(url, { headers: { authorization: token } });' },
      h.context(),
    );

    assert.equal(envelope.ok, false);
    assert.equal(envelope.error?.code, 'POLICY_FORBIDDEN');
    assert.match(envelope.error!.message, /contains a credential this process holds/);
    assert.match(envelope.error!.remediation, /Send the shape, not the data/);
    assert.equal(provider.requests.length, 0, 'nothing left the process');
  });

  it('guards the payload directly, and refuses rather than redacting', () => {
    __resetSecretRegistryForTests();
    registerSecretValue('a-registered-secret-value');
    assert.throws(
      () => assertNothingSecretOutbound({ input: 'here is a-registered-secret-value' }, 'review.code'),
      (error: StromexError) => error.code === 'POLICY_FORBIDDEN',
    );
    assert.doesNotThrow(() => assertNothingSecretOutbound({ input: 'nothing sensitive here' }, 'review.code'));
  });

  it('shows the exact outbound payload under dryRun and sends nothing', async () => {
    const provider = scriptedProvider({ requireHeader: 'authorization', routes: [] });
    const h = harness().withClient('openai', new OpenAiClient({ apiKey: key(), fetchImpl: provider.fetch }));

    const envelope = await invokeTool(
      tool(openaiTools(), 'openai.content.vet'),
      { subject: 'It is not just a website — it is an experience.', dryRun: true },
      h.context(),
    );

    assert.equal(envelope.ok, true);
    assert.equal(envelope.dryRun, true);
    assert.equal(provider.requests.length, 0);
    const planned = (envelope.data as { wouldSend: { instructions: string; input: string } }).wouldSend;
    assert.match(planned.instructions, /machine-written/);
    assert.match(planned.input, /not just a website/);
  });

  it('reports tokens and says plainly that the cost is unpriced when no rates are configured', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'POST', path: '/v1/responses', body: reply('fine') }],
    });
    const h = harness().withClient('openai', new OpenAiClient({ apiKey: key(), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(openaiTools(), 'openai.validate.independent'), { subject: 'A claim.' }, h.context());

    assert.equal((envelope.data as { cost?: unknown }).cost, undefined);
    assert.match(envelope.warnings!.join(' '), /Cost is unpriced/);
  });

  it('prices the call when rates are configured', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'POST', path: '/v1/responses', body: reply('fine', { input_tokens: 1_000_000, output_tokens: 500_000, total_tokens: 1_500_000 }) }],
    });
    const h = harness().withClient(
      'openai',
      new OpenAiClient({ apiKey: key(), fetchImpl: provider.fetch, pricing: { inputPerMTok: 2, outputPerMTok: 8, currency: 'USD' } }),
    );
    const envelope = await invokeTool(tool(openaiTools(), 'openai.validate.independent'), { subject: 'A claim.' }, h.context());
    const cost = (envelope.data as { cost: { amount: number; currency: string } }).cost;
    assert.equal(cost.amount, 6, '1M input at 2 plus 0.5M output at 8');
    assert.equal(cost.currency, 'USD');
  });

  it('always warns that a consultation is not a decision', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'POST', path: '/v1/responses', body: reply('do it this way') }],
    });
    const h = harness().withClient('openai', new OpenAiClient({ apiKey: key(), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(openaiTools(), 'openai.alternatives.generate'), { subject: 'How to store certificates.' }, h.context());
    assert.match(envelope.warnings!.join(' '), /consultation, not a decision/);
  });

  it('says why a response was empty rather than returning nothing', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        {
          method: 'POST',
          path: '/v1/responses',
          body: { id: 'resp_x', model: 'gpt-5', status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [] },
        },
      ],
    });
    const h = harness().withClient('openai', new OpenAiClient({ apiKey: key(), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(openaiTools(), 'openai.review.security'), { subject: 'A big system.' }, h.context());

    assert.equal(envelope.ok, false);
    assert.match(envelope.error!.message, /no text/);
    assert.match(envelope.error!.remediation, /Raise maxOutputTokens/);
  });

  it('surfaces OpenAI\'s own error type, code and message', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        {
          method: 'POST',
          path: '/v1/responses',
          status: 400,
          body: { error: { message: 'The model `gpt-nonexistent` does not exist.', type: 'invalid_request_error', code: 'model_not_found' } },
        },
      ],
    });
    const h = harness().withClient('openai', new OpenAiClient({ apiKey: key(), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(openaiTools(), 'openai.review.ux'), { subject: 'A form.', model: 'gpt-nonexistent' }, h.context());

    assert.equal(envelope.ok, false);
    assert.match(envelope.error!.message, /model_not_found/);
    assert.match(envelope.error!.message, /does not exist/);
  });

  it('exposes no parameter through which a data handle could be passed', () => {
    for (const definition of openaiTools()) {
      const keys = Object.keys(definition.inputSchema);
      for (const forbidden of ['connectionHandle', 'handle', 'databaseId', 'bucket', 'namespaceId', 'valueFromHandle', 'path']) {
        assert.ok(!keys.includes(forbidden), `${definition.name} exposes ${forbidden}, which would let restricted data reach a third-party model`);
      }
    }
  });

  it('classifies every consultation as write, not read', () => {
    for (const definition of openaiTools()) {
      if (definition.name === 'openai.models.list') {
        assert.equal(definition.operationClass, 'read');
        continue;
      }
      assert.equal(
        definition.operationClass,
        'write',
        `${definition.name} transmits material outside the estate and costs money; classifying it as observation would be convenient and wrong`,
      );
    }
  });

  it('offers the sixteen consultations the constitution names, plus the model list', () => {
    const names = openaiTools().map((definition) => definition.name).sort();
    assert.equal(names.length, 17);
    for (const expected of [
      'openai.review.architecture',
      'openai.review.code',
      'openai.review.security',
      'openai.review.ux',
      'openai.review.accessibility',
      'openai.review.performance',
      'openai.review.data-model',
      'openai.review.api',
      'openai.review.documentation',
      'openai.content.refine',
      'openai.content.vet',
      'openai.policy.draft',
      'openai.education.author',
      'openai.research.brief',
      'openai.alternatives.generate',
      'openai.validate.independent',
    ]) {
      assert.ok(names.includes(expected), `missing ${expected}`);
    }
  });
});
