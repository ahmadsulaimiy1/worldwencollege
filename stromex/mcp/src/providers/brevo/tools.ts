/**
 * Brevo tool surface.
 *
 * `brevo.contact.delete` is protected and will be refused outright for
 * any contact whose identifier matches the protected-resource patterns.
 * `brevo.contact.suppress` — a reversible blacklist flag — is the
 * supported way to stop mailing someone, and is what a data-protection
 * request should normally reach for first (`SEB §2.2`, `SEB §22.10`).
 */

import { z } from 'zod';
import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { clientFor, listPayload, plan } from '../support.js';
import type { BrevoClient } from './client.js';

const brevo = (ctx: Parameters<typeof clientFor>[0]) => clientFor<BrevoClient>(ctx, 'brevo');

const senderShape = z.object({ email: z.string().email(), name: z.string().optional() });

export function brevoTools(): ToolDefinition[] {
  return [
    defineTool({
      name: 'brevo.account.get',
      title: 'Brevo — account and plan',
      description: 'Returns the Brevo account, its plan and its remaining credits. The cheapest way to confirm the credential works.',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => ({ summary: 'Brevo account', data: await brevo(ctx).getAccount() }),
    }),

    defineTool({
      name: 'brevo.contact.list',
      title: 'Brevo — list contacts',
      description: 'Lists contacts. Contact records are personal data: do not export them anywhere without a logged reason (SEB §21.1).',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: { limit: z.number().int().min(1).max(1000).optional(), offset: z.number().int().min(0).optional() },
      handler: async (args, ctx) => {
        const body = await brevo(ctx).listContacts(args);
        return {
          summary: `${body.contacts?.length ?? 0} contacts of ${body.count ?? 'unknown'} total`,
          data: { count: body.count, items: body.contacts ?? [] },
        };
      },
    }),

    defineTool({
      name: 'brevo.contact.get',
      title: 'Brevo — get a contact',
      description: 'Returns one contact by email address or id.',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: { identifier: z.string().min(1) },
      handler: async (args, ctx) => ({ summary: `Contact ${args.identifier}`, data: await brevo(ctx).getContact(args.identifier) }),
    }),

    defineTool({
      name: 'brevo.contact.upsert',
      title: 'Brevo — create or update a contact',
      description: 'Creates a contact, or updates it if the email already exists. Idempotent, so a re-run of a synchronisation step does not fail.',
      provider: 'brevo',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: {
        email: z.string().email(),
        attributes: z.record(z.string(), z.unknown()).optional().describe('Brevo attribute names, usually upper-case: FIRSTNAME, LASTNAME, …'),
        listIds: z.array(z.number().int()).optional(),
      },
      resource: (args) => args.email,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would upsert contact ${args.email}`, args);
        const result = await brevo(ctx).createContact(args);
        return { summary: `Upserted contact ${args.email}`, data: result };
      },
    }),

    defineTool({
      name: 'brevo.contact.suppress',
      title: 'Brevo — suppress or unsuppress a contact',
      description:
        'Sets or clears a contact\'s email blacklist flag. This is how you stop mailing someone: the record survives, the suppression is auditable, and it is reversible. Reach for this before ever considering deletion.',
      provider: 'brevo',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { identifier: z.string().min(1), suppressed: z.boolean() },
      resource: (args) => args.identifier,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would ${args.suppressed ? 'suppress' : 'unsuppress'} ${args.identifier}`, args);
        await brevo(ctx).updateContact(args.identifier, { emailBlacklisted: args.suppressed });
        return { summary: `${args.suppressed ? 'Suppressed' : 'Unsuppressed'} contact ${args.identifier}` };
      },
    }),

    defineTool({
      name: 'brevo.contact.delete',
      title: 'Brevo — delete a contact',
      description:
        'Permanently deletes a contact and their engagement history. Protected. In almost every case brevo.contact.suppress is the correct action instead — including for a data-protection request, which is answered by a named human under the retention policy, not by an automated cascade (SEB §22.10).',
      provider: 'brevo',
      operationClass: 'protected',
      inputSchema: { identifier: z.string().min(1) },
      resource: (args) => args.identifier,
      preImage: async (args, ctx) => ({
        preImage: await brevo(ctx).getContact(args.identifier),
        restoreHint: 'Recreate with brevo.contact.upsert using the recorded attributes and list memberships. Engagement history is not restorable.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete contact ${args.identifier}`, args);
        await brevo(ctx).deleteContact(args.identifier);
        return { summary: `Deleted contact ${args.identifier}`, warnings: ['Their engagement history is gone and cannot be rebuilt.'] };
      },
    }),

    defineTool({
      name: 'brevo.list.list',
      title: 'Brevo — list contact lists',
      description: 'Lists contact lists and their sizes.',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: { limit: z.number().int().min(1).max(50).optional(), offset: z.number().int().min(0).optional() },
      handler: async (args, ctx) => {
        const body = await brevo(ctx).listLists(args);
        return listPayload('lists', body.lists ?? [], ['id', 'name', 'totalSubscribers', 'totalBlacklisted', 'folderId']);
      },
    }),

    defineTool({
      name: 'brevo.list.create',
      title: 'Brevo — create a contact list',
      description: 'Creates a contact list inside a folder.',
      provider: 'brevo',
      operationClass: 'write',
      inputSchema: { name: z.string().min(1), folderId: z.number().int() },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create list ${args.name}`, args);
        const list = await brevo(ctx).createList(args);
        return { summary: `Created list ${args.name}`, data: list };
      },
    }),

    defineTool({
      name: 'brevo.transactional.send',
      title: 'Brevo — send a transactional email',
      description: 'Sends one transactional email, either from inline content or from a Brevo template with parameters.',
      provider: 'brevo',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: {
        sender: senderShape,
        to: z.array(z.object({ email: z.string().email(), name: z.string().optional() })).min(1),
        subject: z.string().optional().describe('Required unless templateId supplies one.'),
        htmlContent: z.string().optional(),
        textContent: z.string().optional(),
        templateId: z.number().int().optional(),
        params: z.record(z.string(), z.unknown()).optional().describe('Template parameters.'),
        replyTo: senderShape.optional(),
        tags: z.array(z.string()).optional(),
      },
      resource: (args) => args.to.map((r) => r.email).join(','),
      handler: async (args, ctx) => {
        if (ctx.dryRun) {
          return plan(`Would send to ${args.to.length} recipient(s)`, { ...args, htmlContent: args.htmlContent ? `«${args.htmlContent.length} characters»` : undefined });
        }
        const result = await brevo(ctx).sendTransactional(args);
        return { summary: `Sent transactional email to ${args.to.map((r) => r.email).join(', ')}`, data: result };
      },
    }),

    defineTool({
      name: 'brevo.template.list',
      title: 'Brevo — list templates',
      description: 'Lists transactional email templates.',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: { limit: z.number().int().min(1).max(1000).optional(), offset: z.number().int().min(0).optional() },
      handler: async (args, ctx) => ({ summary: 'Brevo templates', data: await brevo(ctx).listTemplates(args) }),
    }),

    defineTool({
      name: 'brevo.template.get',
      title: 'Brevo — get a template',
      description: 'Returns one transactional template with its content.',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: { templateId: z.number().int() },
      handler: async (args, ctx) => ({ summary: `Template ${args.templateId}`, data: await brevo(ctx).getTemplate(args.templateId) }),
    }),

    defineTool({
      name: 'brevo.template.create',
      title: 'Brevo — create a template',
      description: 'Creates a transactional email template. Institutional email is governed by the voice and editorial standards, not written ad hoc at send time.',
      provider: 'brevo',
      operationClass: 'write',
      inputSchema: {
        templateName: z.string().min(1),
        subject: z.string().min(1),
        sender: senderShape,
        htmlContent: z.string().min(1),
        isActive: z.boolean().optional(),
      },
      resource: (args) => args.templateName,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create template ${args.templateName}`, { ...args, htmlContent: `«${args.htmlContent.length} characters»` });
        const template = await brevo(ctx).createTemplate(args);
        return { summary: `Created template ${args.templateName}`, data: template };
      },
    }),

    defineTool({
      name: 'brevo.campaign.list',
      title: 'Brevo — list email campaigns',
      description: 'Lists email campaigns by status.',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: { status: z.string().optional(), limit: z.number().int().min(1).max(100).optional() },
      handler: async (args, ctx) => ({ summary: 'Brevo campaigns', data: await brevo(ctx).listCampaigns(args) }),
    }),

    defineTool({
      name: 'brevo.campaign.create',
      title: 'Brevo — create an email campaign',
      description: 'Creates an email campaign as a draft. Creating never sends: sending is a separate, deliberate call.',
      provider: 'brevo',
      operationClass: 'write',
      inputSchema: {
        name: z.string().min(1),
        subject: z.string().min(1),
        sender: senderShape,
        htmlContent: z.string().optional(),
        templateId: z.number().int().optional(),
        listIds: z.array(z.number().int()).optional(),
        scheduledAt: z.string().optional().describe('RFC3339. Omit to leave it a draft.'),
      },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        const body = {
          name: args.name,
          subject: args.subject,
          sender: args.sender,
          htmlContent: args.htmlContent,
          templateId: args.templateId,
          recipients: args.listIds ? { listIds: args.listIds } : undefined,
          scheduledAt: args.scheduledAt,
        };
        if (ctx.dryRun) return plan(`Would create campaign ${args.name}`, { ...body, htmlContent: args.htmlContent ? `«${args.htmlContent.length} characters»` : undefined });
        const campaign = await brevo(ctx).createCampaign(body);
        return { summary: `Created campaign ${args.name}${args.scheduledAt ? ` scheduled for ${args.scheduledAt}` : ' as a draft'}`, data: campaign };
      },
    }),

    defineTool({
      name: 'brevo.campaign.send',
      title: 'Brevo — send a campaign now',
      description:
        'Sends an existing campaign immediately, to every contact on its lists. This cannot be recalled. Run brevo.campaign.list first and confirm the recipient lists are the ones you mean.',
      provider: 'brevo',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: { campaignId: z.number().int() },
      resource: (args) => `campaign:${args.campaignId}`,
      handler: async (args, ctx) => {
        const campaign = await brevo(ctx).getCampaign(args.campaignId);
        if (ctx.dryRun) return plan(`Would send campaign ${args.campaignId} now`, campaign);
        await brevo(ctx).sendCampaignNow(args.campaignId);
        return { summary: `Sent campaign ${args.campaignId}`, data: campaign, warnings: ['Sending cannot be recalled.'] };
      },
    }),

    defineTool({
      name: 'brevo.statistics.get',
      title: 'Brevo — delivery statistics',
      description: 'Returns aggregated transactional delivery statistics — sends, deliveries, bounces, opens, clicks — over a period.',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: {
        days: z.number().int().min(1).max(90).optional(),
        startDate: z.string().optional().describe('YYYY-MM-DD'),
        endDate: z.string().optional().describe('YYYY-MM-DD'),
        tag: z.string().optional(),
      },
      handler: async (args, ctx) => ({ summary: 'Brevo delivery statistics', data: await brevo(ctx).aggregatedReport(args) }),
    }),

    defineTool({
      name: 'brevo.events.get',
      title: 'Brevo — delivery events',
      description: 'Returns individual delivery events — the place to look when one specific message did not arrive.',
      provider: 'brevo',
      operationClass: 'read',
      inputSchema: {
        limit: z.number().int().min(1).max(500).optional(),
        email: z.string().email().optional(),
        event: z.string().optional().describe('delivered, hardBounces, softBounces, opened, clicks, …'),
        days: z.number().int().min(1).max(30).optional(),
      },
      handler: async (args, ctx) => ({ summary: 'Brevo delivery events', data: await brevo(ctx).events(args) }),
    }),
  ];
}
