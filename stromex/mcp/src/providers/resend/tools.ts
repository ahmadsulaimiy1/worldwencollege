/**
 * Resend tool surface.
 *
 * `resend.api-key.create` is the one tool in this server that receives a
 * newly minted credential from a provider. It is handled the same way a
 * connection string is: the token goes into the handle vault and the
 * result carries a handle, never the token (`SEB §26.7`,
 * `core/vault.ts`).
 */

import { z } from 'zod';
import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { clientFor, listPayload, plan } from '../support.js';
import type { ResendClient } from './client.js';

const resend = (ctx: Parameters<typeof clientFor>[0]) => clientFor<ResendClient>(ctx, 'resend');

const messageShape = {
  from: z.string().min(1).describe('Must be an address on a domain verified in this Resend account, or the send is rejected.'),
  to: z.array(z.string().email()).min(1),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  replyTo: z.array(z.string().email()).optional(),
} as const;

export function resendTools(): ToolDefinition[] {
  return [
    defineTool({
      name: 'resend.email.send',
      title: 'Resend — send a transactional email',
      description:
        'Sends one transactional email. Real mail to a real person: it cannot be recalled, so use dryRun first when the recipient list is derived rather than typed.',
      provider: 'resend',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: { ...messageShape, tags: z.array(z.object({ name: z.string(), value: z.string() })).optional() },
      resource: (args) => args.to.join(','),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would send "${args.subject}" to ${args.to.length} recipient(s)`, { ...args, html: args.html ? `«${args.html.length} characters»` : undefined });
        const result = await resend(ctx).sendEmail(args);
        return { summary: `Sent "${args.subject}" to ${args.to.join(', ')}`, data: result };
      },
    }),

    defineTool({
      name: 'resend.email.batch',
      title: 'Resend — send a batch of emails',
      description: 'Sends up to 100 distinct messages in one request. Each message is separate — this is not a mailing list, and it does not deduplicate recipients.',
      provider: 'resend',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: { messages: z.array(z.object(messageShape)).min(1).max(100) },
      resource: (args) => `${args.messages.length} messages`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would send ${args.messages.length} message(s)`, { subjects: args.messages.map((m) => m.subject) });
        const result = await resend(ctx).sendBatch(args.messages);
        return { summary: `Sent ${args.messages.length} message(s)`, data: result };
      },
    }),

    defineTool({
      name: 'resend.email.get',
      title: 'Resend — check a sent email',
      description: 'Returns one sent email with its delivery status — the supported way to confirm that something actually arrived rather than merely being accepted.',
      provider: 'resend',
      operationClass: 'read',
      inputSchema: { id: z.string().min(1) },
      handler: async (args, ctx) => ({ summary: `Email ${args.id}`, data: await resend(ctx).getEmail(args.id) }),
    }),

    defineTool({
      name: 'resend.domain.list',
      title: 'Resend — list sending domains',
      description: 'Lists sending domains and their verification status.',
      provider: 'resend',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const body = (await resend(ctx).listDomains()) as { data?: unknown[] };
        return listPayload('domains', body.data ?? body, ['id', 'name', 'status', 'region', 'created_at']);
      },
    }),

    defineTool({
      name: 'resend.domain.create',
      title: 'Resend — add a sending domain',
      description:
        'Adds a sending domain and returns the DNS records that must exist before it will verify. Sending from a domain you do not control fails SPF and DKIM outright, so create these records — with cloudflare.dns.create — before switching any sending address.',
      provider: 'resend',
      operationClass: 'write',
      inputSchema: { name: z.string().min(1), region: z.string().optional() },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would add sending domain ${args.name}`, args);
        const domain = await resend(ctx).createDomain(args);
        return {
          summary: `Added sending domain ${args.name}`,
          data: domain,
          warnings: ['The returned DNS records must be created before verification will succeed. Change the domain and the sending addresses together, never one then the other.'],
        };
      },
    }),

    defineTool({
      name: 'resend.domain.verify',
      title: 'Resend — verify a sending domain',
      description: 'Asks Resend to re-check a domain\'s DNS. Safe to run repeatedly; DNS propagation means the first attempt after creating records often fails.',
      provider: 'resend',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { id: z.string().min(1) },
      resource: (args) => args.id,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would verify domain ${args.id}`, args);
        const result = await resend(ctx).verifyDomain(args.id);
        return { summary: `Requested verification of domain ${args.id}`, data: result };
      },
    }),

    defineTool({
      name: 'resend.domain.get',
      title: 'Resend — get a sending domain',
      description: 'Returns one sending domain with its required DNS records and their current state.',
      provider: 'resend',
      operationClass: 'read',
      inputSchema: { id: z.string().min(1) },
      handler: async (args, ctx) => ({ summary: `Domain ${args.id}`, data: await resend(ctx).getDomain(args.id) }),
    }),

    defineTool({
      name: 'resend.domain.delete',
      title: 'Resend — remove a sending domain',
      description: 'Removes a sending domain. Protected: every address on it stops sending immediately, which silently breaks password resets and admissions correspondence before anyone notices.',
      provider: 'resend',
      operationClass: 'protected',
      inputSchema: { id: z.string().min(1), name: z.string().min(1).describe('For the audit record and the protected-resource check.') },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: await resend(ctx).getDomain(args.id),
        restoreHint: 'Re-add with resend.domain.create and recreate the DNS records. The recorded DNS record set is what you need.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would remove sending domain ${args.name}`, args);
        await resend(ctx).deleteDomain(args.id);
        return { summary: `Removed sending domain ${args.name}`, warnings: ['Every address on this domain now fails to send.'] };
      },
    }),

    defineTool({
      name: 'resend.api-key.list',
      title: 'Resend — list API keys',
      description: 'Lists API key names and ids. Resend never returns a key\'s token after creation, and neither does this server.',
      provider: 'resend',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const body = (await resend(ctx).listApiKeys()) as { data?: unknown[] };
        return listPayload('API keys', body.data ?? body, ['id', 'name', 'created_at']);
      },
    }),

    defineTool({
      name: 'resend.api-key.create',
      title: 'Resend — create an API key',
      description:
        'Creates a Resend API key, scoped to sending only by default. The TOKEN IS NOT RETURNED: it goes into this process\'s handle vault and the result carries a handle, so the credential can be installed into Cloudflare, GitHub or Vercel without passing through the transcript. Resend shows a token exactly once, so if the handle expires unused the key must be recreated.',
      provider: 'resend',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: {
        name: z.string().min(1),
        permission: z.enum(['full_access', 'sending_access']).optional().describe('Defaults to sending_access — least privilege.'),
        domainId: z.string().optional().describe('Restrict the key to one domain.'),
      },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create Resend API key ${args.name}`, args);
        const created = await resend(ctx).createApiKey(args);
        const entry = ctx.vault.store({ value: created.token, label: `resend:${args.name}`, origin: 'resend.api-key.create' });
        return {
          summary: `Created Resend API key ${args.name} (expires from the vault at ${entry.expiresAt})`,
          data: { id: created.id, name: args.name, handle: entry.handle, expiresAt: entry.expiresAt },
          warnings: [
            'The token was deliberately not returned. Use the handle with `valueFromHandle` on a secret-setting tool, in this session. Resend cannot show the token again.',
          ],
        };
      },
    }),

    defineTool({
      name: 'resend.api-key.delete',
      title: 'Resend — revoke an API key',
      description: 'Revokes a Resend API key. Protected: anything still using it stops sending immediately, and the token cannot be recovered.',
      provider: 'resend',
      operationClass: 'protected',
      inputSchema: { id: z.string().min(1), name: z.string().min(1) },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: { id: args.id, name: args.name, keys: await resend(ctx).listApiKeys() },
        restoreHint: 'Create a replacement with resend.api-key.create and install it wherever the old one was used. The old token is gone.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would revoke API key ${args.name}`, args);
        await resend(ctx).deleteApiKey(args.id);
        return { summary: `Revoked Resend API key ${args.name}`, warnings: ['Any service still holding this key now fails to send.'] };
      },
    }),
  ];
}
