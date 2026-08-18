/**
 * Provider assembly.
 *
 * Builds exactly the clients whose credentials exist, and exposes the
 * tool definitions for those providers only. A provider that is not
 * configured contributes no tools at all — rather than tools that fail
 * at call time, which teaches a model that failures are normal.
 */

import { PROVIDER_TUNING, activeProviders, type ProviderName, type StromexConfig } from '../config.js';
import type { FetchLike } from '../core/http.js';
import type { Logger } from '../core/logger.js';
import type { ToolDefinition } from '../core/registry.js';
import { CloudflareClient } from './cloudflare/client.js';
import { cloudflareTools } from './cloudflare/tools.js';
import { GitHubClient } from './github/client.js';
import { githubTools } from './github/tools.js';
import { NeonClient } from './neon/client.js';
import { neonTools } from './neon/tools.js';
import { VercelClient } from './vercel/client.js';
import { vercelTools } from './vercel/tools.js';
import { ClerkClient } from './clerk/client.js';
import { clerkTools } from './clerk/tools.js';
import { ResendClient } from './resend/client.js';
import { resendTools } from './resend/tools.js';
import { BrevoClient } from './brevo/client.js';
import { brevoTools } from './brevo/tools.js';

export interface ProviderBundle {
  clients: Record<string, unknown>;
  tools: ToolDefinition[];
  active: ProviderName[];
}

export interface BuildProvidersOptions {
  config: StromexConfig;
  logger: Logger;
  /** Injected by the integration test suite. */
  fetchImpl?: FetchLike;
}

export function buildProviders(options: BuildProvidersOptions): ProviderBundle {
  const { config, logger, fetchImpl } = options;
  const active = activeProviders(config);
  const clients: Record<string, unknown> = {};
  const tools: ToolDefinition[] = [];

  for (const name of active) {
    const tuning = PROVIDER_TUNING[name];
    const shared = { logger, fetchImpl, timeoutMs: tuning.timeoutMs, rateLimit: tuning.rateLimit };

    switch (name) {
      case 'cloudflare':
        clients[name] = new CloudflareClient({
          ...shared,
          token: config.secrets.require('CLOUDFLARE_API_TOKEN', 'operate Cloudflare'),
          accountId: config.secrets.resolve('CLOUDFLARE_ACCOUNT_ID')?.reveal(),
        });
        tools.push(...cloudflareTools());
        break;
      case 'github':
        clients[name] = new GitHubClient({ ...shared, token: config.secrets.require('GITHUB_TOKEN', 'operate GitHub') });
        tools.push(...githubTools());
        break;
      case 'neon':
        clients[name] = new NeonClient({ ...shared, apiKey: config.secrets.require('NEON_API_KEY', 'operate Neon') });
        tools.push(...neonTools());
        break;
      case 'vercel':
        clients[name] = new VercelClient({
          ...shared,
          token: config.secrets.require('VERCEL_TOKEN', 'operate Vercel'),
          teamId: config.secrets.resolve('VERCEL_TEAM_ID')?.reveal(),
        });
        tools.push(...vercelTools());
        break;
      case 'clerk':
        clients[name] = new ClerkClient({ ...shared, secretKey: config.secrets.require('CLERK_SECRET_KEY', 'operate Clerk') });
        tools.push(...clerkTools());
        break;
      case 'resend':
        clients[name] = new ResendClient({ ...shared, apiKey: config.secrets.require('RESEND_API_KEY', 'operate Resend') });
        tools.push(...resendTools());
        break;
      case 'brevo':
        clients[name] = new BrevoClient({ ...shared, apiKey: config.secrets.require('BREVO_API_KEY', 'operate Brevo') });
        tools.push(...brevoTools());
        break;
    }
  }

  return { clients, tools, active };
}

/**
 * One cheap authenticated read per provider — the health probe.
 *
 * Each entry deliberately calls a *real* endpoint rather than pinging the
 * host: a process that is up and holding a rejected credential is exactly
 * the failure a health check exists to catch (`SEB §11.5`).
 */
export const HEALTH_PROBES: Record<ProviderName, (client: unknown) => Promise<{ detail: string }>> = {
  cloudflare: async (client) => {
    const accounts = await (client as CloudflareClient).listAccounts();
    return { detail: `${accounts.length} account(s) visible` };
  },
  github: async (client) => {
    const viewer = await (client as GitHubClient).viewer();
    return { detail: `authenticated as ${viewer.login}` };
  },
  neon: async (client) => {
    const projects = await (client as NeonClient).listProjects();
    return { detail: `${projects.length} project(s) visible` };
  },
  vercel: async (client) => {
    const body = (await (client as VercelClient).listProjects(1)) as { projects?: unknown[] };
    return { detail: `${body.projects?.length ?? 0} project(s) in the first page` };
  },
  clerk: async (client) => {
    const count = await (client as ClerkClient).countUsers();
    return { detail: `${count.total_count} user(s)` };
  },
  resend: async (client) => {
    const body = (await (client as ResendClient).listDomains()) as { data?: unknown[] };
    return { detail: `${body.data?.length ?? 0} sending domain(s)` };
  },
  brevo: async (client) => {
    const account = (await (client as BrevoClient).getAccount()) as { email?: string; plan?: unknown };
    return { detail: `account ${account.email ?? '(unnamed)'}` };
  },
};

export function credentialFingerprint(client: unknown): string | undefined {
  const candidate = client as { credentialFingerprint?: () => string };
  return typeof candidate.credentialFingerprint === 'function' ? candidate.credentialFingerprint() : undefined;
}

export function circuitState(client: unknown): string | undefined {
  const candidate = client as { http?: { circuitState?: () => string } };
  return candidate.http?.circuitState?.();
}
