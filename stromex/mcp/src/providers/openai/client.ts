/**
 * OpenAI connector — the engineering council (`SEB §32`).
 *
 * Official API only. No browser automation, no scraped endpoint, no
 * unofficial integration: a consultation path that breaks when a vendor
 * changes their web UI is not an engineering platform.
 *
 * One control in here is not decoration. `assertNothingSecretOutbound`
 * runs the estate's own value-based redaction over the whole outbound
 * payload before it is sent, and **refuses the call** if the payload
 * changes. A registered secret about to leave for a third party is not a
 * thing to redact and send; it is a thing to stop.
 */

import { HttpClient, type FetchLike } from '../../core/http.js';
import { StromexError } from '../../core/errors.js';
import type { Logger } from '../../core/logger.js';
import type { SecretRef } from '../../core/secret.js';
import { redactText } from '../../core/redact.js';

export interface OpenAiClientOptions {
  apiKey: SecretRef;
  organisation?: string;
  project?: string;
  /** Default model. Overridable per call. */
  model?: string;
  logger?: Logger;
  fetchImpl?: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
  /**
   * Optional per-million-token prices, so a result can report cost. Left
   * unset the result reports tokens and says the cost is unpriced —
   * inventing a price would be publishing a figure nobody measured.
   */
  pricing?: { inputPerMTok?: number; outputPerMTok?: number; currency?: string };
}

export interface ConsultationRequest {
  /** The system/developer instruction: who the consultant is being asked to be. */
  instructions: string;
  /** The material and the question. */
  input: string;
  model?: string;
  maxOutputTokens?: number;
  /** Reasoning effort, where the chosen model supports it. */
  reasoningEffort?: 'low' | 'medium' | 'high';
  operation: string;
}

export interface ConsultationResult {
  model: string;
  text: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    reasoningTokens?: number;
    totalTokens?: number;
  };
  cost?: { amount: number; currency: string; basis: string };
  /** Present when the model stopped for a reason other than finishing. */
  incomplete?: string;
  requestId?: string;
}

interface ResponsesApiPayload {
  id?: string;
  model?: string;
  status?: string;
  incomplete_details?: { reason?: string };
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
  output_text?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    output_tokens_details?: { reasoning_tokens?: number };
  };
  error?: { message?: string; type?: string; code?: string };
}

export class OpenAiClient {
  readonly http: HttpClient;
  private readonly apiKey: SecretRef;
  private readonly defaultModel: string;
  /**
   * Public, because the spending gate needs to know which currency this
   * client bills in before it makes a metered call — and because a
   * consultation that cannot be priced cannot be counted against the cap,
   * which is a fact a caller is entitled to see.
   */
  readonly pricing: OpenAiClientOptions['pricing'];

  constructor(options: OpenAiClientOptions) {
    this.apiKey = options.apiKey;
    this.defaultModel = options.model ?? 'gpt-5';
    this.pricing = options.pricing;

    const extraHeaders: Record<string, string> = {};
    if (options.organisation) extraHeaders['openai-organization'] = options.organisation;
    if (options.project) extraHeaders['openai-project'] = options.project;

    this.http = new HttpClient({
      provider: 'openai',
      baseUrl: options.baseUrl ?? 'https://api.openai.com/v1',
      authHeaders: () => ({ authorization: `Bearer ${this.apiKey.reveal()}` }),
      defaultHeaders: extraHeaders,
      logger: options.logger,
      fetchImpl: options.fetchImpl,
      // A reasoning consultation is slow by design. A 30s timeout would
      // turn every useful answer into a timeout.
      timeoutMs: options.timeoutMs ?? 180_000,
      rateLimit: options.rateLimit,
      errorMessage: (_status, body) => {
        const payload = body as { error?: { message?: string; type?: string; code?: string } } | undefined;
        if (!payload?.error) return undefined;
        return [payload.error.type, payload.error.code, payload.error.message].filter(Boolean).join(': ');
      },
    });
  }

  credentialFingerprint(): string {
    return this.apiKey.fingerprint();
  }

  model(): string {
    return this.defaultModel;
  }

  async consult(request: ConsultationRequest): Promise<ConsultationResult> {
    const model = request.model ?? this.defaultModel;
    const body: Record<string, unknown> = {
      model,
      instructions: request.instructions,
      input: request.input,
      max_output_tokens: request.maxOutputTokens ?? 4000,
    };
    if (request.reasoningEffort) body['reasoning'] = { effort: request.reasoningEffort };

    assertNothingSecretOutbound(body, request.operation);

    const response = await this.http.request<ResponsesApiPayload>({
      method: 'POST',
      path: '/responses',
      operation: request.operation,
      body: { kind: 'json', value: body },
    });

    const payload = response.body;
    if (payload.error?.message) {
      throw new StromexError({
        code: 'PROVIDER_HTTP_ERROR',
        message: `OpenAI returned an error for ${request.operation}: ${payload.error.message}`,
        remediation: 'Read the error type and code against the OpenAI API documentation; most indicate a model name, a quota or a malformed request.',
        provider: 'openai',
        operation: request.operation,
      });
    }

    const text = extractText(payload);
    if (!text) {
      throw new StromexError({
        code: 'PROVIDER_HTTP_ERROR',
        message: `OpenAI returned no text for ${request.operation}${payload.incomplete_details?.reason ? ` (incomplete: ${payload.incomplete_details.reason})` : ''}.`,
        remediation:
          payload.incomplete_details?.reason === 'max_output_tokens'
            ? 'The response hit the output limit before producing text. Raise maxOutputTokens, or narrow the subject.'
            : 'Retry; if it persists, check the model name and the account quota.',
        provider: 'openai',
        operation: request.operation,
        retryable: true,
      });
    }

    const usage = {
      inputTokens: payload.usage?.input_tokens,
      outputTokens: payload.usage?.output_tokens,
      reasoningTokens: payload.usage?.output_tokens_details?.reasoning_tokens,
      totalTokens: payload.usage?.total_tokens,
    };

    return {
      model: payload.model ?? model,
      text,
      usage,
      ...(this.price(usage) ? { cost: this.price(usage)! } : {}),
      ...(payload.incomplete_details?.reason ? { incomplete: payload.incomplete_details.reason } : {}),
      ...(payload.id ? { requestId: payload.id } : {}),
    };
  }

  /** Lists the models the key can see — the cheapest possible health probe. */
  async listModels(): Promise<Array<{ id: string; owned_by?: string }>> {
    const response = await this.http.request<{ data?: Array<{ id: string; owned_by?: string }> }>({
      method: 'GET',
      path: '/models',
      operation: 'model.list',
    });
    return response.body.data ?? [];
  }

  private price(usage: ConsultationResult['usage']): ConsultationResult['cost'] | undefined {
    const input = this.pricing?.inputPerMTok;
    const output = this.pricing?.outputPerMTok;
    if (input === undefined || output === undefined) return undefined;
    if (usage.inputTokens === undefined || usage.outputTokens === undefined) return undefined;
    const amount = (usage.inputTokens / 1_000_000) * input + (usage.outputTokens / 1_000_000) * output;
    return {
      amount: Math.round(amount * 1e6) / 1e6,
      currency: this.pricing?.currency ?? 'USD',
      basis: `configured rates: ${input}/${output} per million input/output tokens`,
    };
  }
}

/**
 * The outbound secret guard.
 *
 * Every credential the process resolves is registered for value-based
 * redaction. If redaction changes the outbound payload, a registered
 * secret was about to be sent to a third party — and the correct response
 * is to refuse, not to redact and send. Redacting would hide the mistake
 * that put it there.
 */
export function assertNothingSecretOutbound(payload: unknown, operation: string): void {
  const serialised = JSON.stringify(payload);
  if (redactText(serialised) !== serialised) {
    throw new StromexError({
      code: 'POLICY_FORBIDDEN',
      message: `The material for ${operation} contains a credential this process holds. Nothing was sent to OpenAI.`,
      remediation:
        'Remove the credential from the subject and consult again. Send the shape, not the data: a schema instead of rows, a redacted sample instead of a real one (SEB §32.6).',
      provider: 'openai',
      operation,
    });
  }
}

function extractText(payload: ResponsesApiPayload): string {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const parts: string[] = [];
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}
