/**
 * Clerk tool surface.
 *
 * `clerk.user.delete` is protected, and — this is the important part —
 * the ordinary path offered instead is `ban` or `lock`, both reversible.
 * That is `SEB §2.2` applied to people: deactivate before you erase.
 */

import { z } from 'zod';
import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { clientFor, listPayload, plan } from '../support.js';
import type { ClerkClient } from './client.js';

const clerk = (ctx: Parameters<typeof clientFor>[0]) => clientFor<ClerkClient>(ctx, 'clerk');

export function clerkTools(): ToolDefinition[] {
  return [
    defineTool({
      name: 'clerk.user.list',
      title: 'Clerk — list users',
      description: 'Lists users, optionally filtered by a search query or exact email addresses.',
      provider: 'clerk',
      operationClass: 'read',
      inputSchema: {
        limit: z.number().int().min(1).max(500).optional(),
        offset: z.number().int().min(0).optional(),
        query: z.string().optional(),
        emailAddress: z.array(z.string().email()).optional(),
      },
      handler: async (args, ctx) => {
        const users = await clerk(ctx).listUsers(args);
        return listPayload('users', users, ['id', 'email_addresses', 'first_name', 'last_name', 'banned', 'locked', 'last_sign_in_at', 'created_at']);
      },
    }),

    defineTool({
      name: 'clerk.user.get',
      title: 'Clerk — get a user',
      description: 'Returns one user, including their identifiers, metadata and sign-in state.',
      provider: 'clerk',
      operationClass: 'read',
      inputSchema: { userId: z.string().min(1) },
      handler: async (args, ctx) => ({ summary: `Clerk user ${args.userId}`, data: await clerk(ctx).getUser(args.userId) }),
    }),

    defineTool({
      name: 'clerk.user.count',
      title: 'Clerk — count users',
      description: 'Returns the total user count for the instance.',
      provider: 'clerk',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const count = await clerk(ctx).countUsers();
        return { summary: `${count.total_count} users`, data: count };
      },
    }),

    defineTool({
      name: 'clerk.user.create',
      title: 'Clerk — create a user',
      description:
        'Creates a user. Prefer an invitation for real people: an invitation lets them set their own credential, where a created user needs one supplied. Metadata written here is visible to the application, so it is not a place for anything sensitive.',
      provider: 'clerk',
      operationClass: 'write',
      inputSchema: {
        emailAddress: z.array(z.string().email()).min(1),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        password: z.string().optional().describe('Omit where possible; an invitation is the better path.'),
        publicMetadata: z.record(z.string(), z.unknown()).optional(),
        privateMetadata: z.record(z.string(), z.unknown()).optional(),
        skipPasswordRequirement: z.boolean().optional(),
      },
      resource: (args) => args.emailAddress[0] ?? 'user',
      handler: async (args, ctx) => {
        const body = {
          email_address: args.emailAddress,
          first_name: args.firstName,
          last_name: args.lastName,
          password: args.password,
          public_metadata: args.publicMetadata,
          private_metadata: args.privateMetadata,
          skip_password_requirement: args.skipPasswordRequirement,
        };
        if (ctx.dryRun) return plan(`Would create Clerk user ${args.emailAddress.join(', ')}`, { ...body, password: args.password ? '«redacted»' : undefined });
        const user = await clerk(ctx).createUser(body);
        return { summary: `Created Clerk user ${args.emailAddress.join(', ')}`, data: user };
      },
    }),

    defineTool({
      name: 'clerk.user.update',
      title: 'Clerk — update a user',
      description: 'Patches a user. Only the fields supplied change.',
      provider: 'clerk',
      operationClass: 'write',
      inputSchema: {
        userId: z.string().min(1),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        publicMetadata: z.record(z.string(), z.unknown()).optional(),
        privateMetadata: z.record(z.string(), z.unknown()).optional(),
      },
      resource: (args) => args.userId,
      handler: async (args, ctx) => {
        const body = {
          first_name: args.firstName,
          last_name: args.lastName,
          public_metadata: args.publicMetadata,
          private_metadata: args.privateMetadata,
        };
        if (ctx.dryRun) return plan(`Would update Clerk user ${args.userId}`, body);
        const user = await clerk(ctx).updateUser(args.userId, body);
        return { summary: `Updated Clerk user ${args.userId}`, data: user };
      },
    }),

    defineTool({
      name: 'clerk.user.ban',
      title: 'Clerk — ban or unban a user',
      description:
        'Bans or unbans a user. A banned user cannot sign in, and every record about them is preserved. This is the supported way to remove someone\'s access — use it rather than deletion.',
      provider: 'clerk',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { userId: z.string().min(1), banned: z.boolean().describe('true bans, false unbans.') },
      resource: (args) => args.userId,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would ${args.banned ? 'ban' : 'unban'} ${args.userId}`, args);
        const result = args.banned ? await clerk(ctx).banUser(args.userId) : await clerk(ctx).unbanUser(args.userId);
        return { summary: `${args.banned ? 'Banned' : 'Unbanned'} Clerk user ${args.userId}`, data: result };
      },
    }),

    defineTool({
      name: 'clerk.user.lock',
      title: 'Clerk — lock or unlock a user',
      description: 'Locks or unlocks a user. A lock is a temporary sign-in block, lighter than a ban and equally reversible.',
      provider: 'clerk',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { userId: z.string().min(1), locked: z.boolean() },
      resource: (args) => args.userId,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would ${args.locked ? 'lock' : 'unlock'} ${args.userId}`, args);
        const result = args.locked ? await clerk(ctx).lockUser(args.userId) : await clerk(ctx).unlockUser(args.userId);
        return { summary: `${args.locked ? 'Locked' : 'Unlocked'} Clerk user ${args.userId}`, data: result };
      },
    }),

    defineTool({
      name: 'clerk.user.delete',
      title: 'Clerk — delete a user',
      description:
        'Permanently deletes a user, their sessions, their organisation memberships and their linked external accounts. Protected. Almost every reason to reach for this is better served by clerk.user.ban, which is reversible and preserves the record. A learner or staff member whose institutional record must survive is covered by SEB §26.1 and will be refused outright.',
      provider: 'clerk',
      operationClass: 'protected',
      inputSchema: { userId: z.string().min(1), emailAddress: z.string().optional().describe('Recorded in the audit trail and checked against the protected-resource patterns.') },
      resource: (args) => args.emailAddress ?? args.userId,
      preImage: async (args, ctx) => ({
        preImage: await clerk(ctx).getUser(args.userId),
        restoreHint:
          'The user object is recorded here, but Clerk cannot re-import a password hash, and the user id changes on recreation — every application row keyed to the old id would need remapping. Treat this as unrecoverable in practice.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete Clerk user ${args.userId}`, args);
        await clerk(ctx).deleteUser(args.userId);
        return {
          summary: `Deleted Clerk user ${args.userId}`,
          warnings: ['Their sessions, memberships and external account links are gone. Application rows keyed to the old user id now point at nothing.'],
        };
      },
    }),

    defineTool({
      name: 'clerk.organization.list',
      title: 'Clerk — list organisations',
      description: 'Lists organisations in the instance.',
      provider: 'clerk',
      operationClass: 'read',
      inputSchema: { limit: z.number().int().min(1).max(500).optional(), offset: z.number().int().min(0).optional(), query: z.string().optional() },
      handler: async (args, ctx) => {
        const body = (await clerk(ctx).listOrganizations(args)) as { data?: unknown[] };
        return listPayload('organisations', body.data ?? body, ['id', 'name', 'slug', 'members_count', 'created_at']);
      },
    }),

    defineTool({
      name: 'clerk.organization.create',
      title: 'Clerk — create an organisation',
      description: 'Creates an organisation. In this estate an organisation is normally one institution, so the slug should match the institution\'s established name (SEB §8.3).',
      provider: 'clerk',
      operationClass: 'write',
      inputSchema: {
        name: z.string().min(1),
        slug: z.string().optional(),
        createdBy: z.string().optional().describe('User id of the first administrator.'),
        publicMetadata: z.record(z.string(), z.unknown()).optional(),
      },
      resource: (args) => args.slug ?? args.name,
      handler: async (args, ctx) => {
        const body = { name: args.name, slug: args.slug, created_by: args.createdBy, public_metadata: args.publicMetadata };
        if (ctx.dryRun) return plan(`Would create organisation ${args.name}`, body);
        const organization = await clerk(ctx).createOrganization(body);
        return { summary: `Created organisation ${args.name}`, data: organization };
      },
    }),

    defineTool({
      name: 'clerk.organization.delete',
      title: 'Clerk — delete an organisation',
      description: 'Permanently deletes an organisation and every membership in it. Protected, and refused outright where the organisation names an institution.',
      provider: 'clerk',
      operationClass: 'protected',
      inputSchema: { organizationId: z.string().min(1), name: z.string().min(1).describe('For the audit record and the protected-resource check.') },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: { organizationId: args.organizationId, memberships: await clerk(ctx).listMemberships(args.organizationId) },
        restoreHint: 'Recreate with clerk.organization.create and re-add each recorded membership with clerk.membership.set. The organisation id changes.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete organisation ${args.name}`, args);
        await clerk(ctx).deleteOrganization(args.organizationId);
        return { summary: `Deleted organisation ${args.name}`, warnings: ['Every membership is gone, and the organisation id will not be reissued.'] };
      },
    }),

    defineTool({
      name: 'clerk.membership.list',
      title: 'Clerk — list organisation memberships',
      description: 'Lists who belongs to an organisation and in what role.',
      provider: 'clerk',
      operationClass: 'read',
      inputSchema: { organizationId: z.string().min(1), limit: z.number().int().min(1).max(500).optional() },
      handler: async (args, ctx) => ({
        summary: `Memberships of ${args.organizationId}`,
        data: await clerk(ctx).listMemberships(args.organizationId, args),
      }),
    }),

    defineTool({
      name: 'clerk.membership.set',
      title: 'Clerk — add or change a membership',
      description:
        'Adds a user to an organisation, or changes their role if they are already a member. Roles are Clerk role keys such as org:admin or org:member — map them to the institution\'s own role codes in application metadata, never by inventing a Clerk role per office.',
      provider: 'clerk',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { organizationId: z.string().min(1), userId: z.string().min(1), role: z.string().min(1) },
      resource: (args) => `${args.organizationId}:${args.userId}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would set ${args.userId} to ${args.role} in ${args.organizationId}`, args);
        const client = clerk(ctx);
        try {
          const created = await client.createMembership(args.organizationId, { user_id: args.userId, role: args.role });
          return { summary: `Added ${args.userId} to ${args.organizationId} as ${args.role}`, data: created };
        } catch {
          // Already a member: Clerk answers 422. Updating is the intent.
          const updated = await client.updateMembership(args.organizationId, args.userId, args.role);
          return { summary: `Changed ${args.userId} to ${args.role} in ${args.organizationId}`, data: updated };
        }
      },
    }),

    defineTool({
      name: 'clerk.membership.remove',
      title: 'Clerk — remove a membership',
      description: 'Removes a user from an organisation. The user account itself is untouched, which is why this is a write rather than a protected operation.',
      provider: 'clerk',
      operationClass: 'write',
      inputSchema: { organizationId: z.string().min(1), userId: z.string().min(1) },
      resource: (args) => `${args.organizationId}:${args.userId}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would remove ${args.userId} from ${args.organizationId}`, args);
        await clerk(ctx).deleteMembership(args.organizationId, args.userId);
        return { summary: `Removed ${args.userId} from ${args.organizationId}` };
      },
    }),

    defineTool({
      name: 'clerk.invitation.list',
      title: 'Clerk — list invitations',
      description: 'Lists instance invitations by status.',
      provider: 'clerk',
      operationClass: 'read',
      inputSchema: { status: z.enum(['pending', 'accepted', 'revoked', 'expired']).optional() },
      handler: async (args, ctx) => ({ summary: 'Invitations', data: await clerk(ctx).listInvitations(args.status) }),
    }),

    defineTool({
      name: 'clerk.invitation.create',
      title: 'Clerk — invite a user',
      description: 'Invites someone by email. The preferred way to bring a real person onto an instance, because they set their own credential.',
      provider: 'clerk',
      operationClass: 'write',
      inputSchema: {
        emailAddress: z.string().email(),
        redirectUrl: z.string().url().optional(),
        publicMetadata: z.record(z.string(), z.unknown()).optional(),
        notify: z.boolean().optional().describe('Whether Clerk sends the email. Defaults to true.'),
      },
      resource: (args) => args.emailAddress,
      handler: async (args, ctx) => {
        const body = { email_address: args.emailAddress, redirect_url: args.redirectUrl, public_metadata: args.publicMetadata, notify: args.notify };
        if (ctx.dryRun) return plan(`Would invite ${args.emailAddress}`, body);
        const invitation = await clerk(ctx).createInvitation(body);
        return { summary: `Invited ${args.emailAddress}`, data: invitation };
      },
    }),

    defineTool({
      name: 'clerk.invitation.revoke',
      title: 'Clerk — revoke an invitation',
      description: 'Revokes a pending invitation. Revocation, not deletion — the invitation record survives with a revoked status.',
      provider: 'clerk',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { invitationId: z.string().min(1) },
      resource: (args) => args.invitationId,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would revoke invitation ${args.invitationId}`, args);
        const result = await clerk(ctx).revokeInvitation(args.invitationId);
        return { summary: `Revoked invitation ${args.invitationId}`, data: result };
      },
    }),

    defineTool({
      name: 'clerk.organization.invitation.create',
      title: 'Clerk — invite a user to an organisation',
      description: 'Invites someone to an organisation with a role.',
      provider: 'clerk',
      operationClass: 'write',
      inputSchema: {
        organizationId: z.string().min(1),
        emailAddress: z.string().email(),
        role: z.string().min(1),
        inviterUserId: z.string().optional(),
        redirectUrl: z.string().url().optional(),
      },
      resource: (args) => `${args.organizationId}:${args.emailAddress}`,
      handler: async (args, ctx) => {
        const body = { email_address: args.emailAddress, role: args.role, inviter_user_id: args.inviterUserId, redirect_url: args.redirectUrl };
        if (ctx.dryRun) return plan(`Would invite ${args.emailAddress} to ${args.organizationId}`, body);
        const invitation = await clerk(ctx).createOrganizationInvitation(args.organizationId, body);
        return { summary: `Invited ${args.emailAddress} to ${args.organizationId} as ${args.role}`, data: invitation };
      },
    }),

    defineTool({
      name: 'clerk.config.get',
      title: 'Clerk — authentication configuration',
      description:
        'Returns the instance\'s JWT templates and its JWKS. These are the two configuration surfaces an application actually depends on: the template shapes the session token, and the JWKS is what a backend verifies against. LIMITATION: Clerk\'s broader instance settings are managed in its dashboard, and this server does not attempt to script them.',
      provider: 'clerk',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const client = clerk(ctx);
        const [templates, jwks] = await Promise.all([client.listJwtTemplates(), client.getJwks()]);
        return {
          summary: 'Clerk JWT templates and JWKS',
          data: { jwtTemplates: templates, jwks },
          warnings: ['A backend must refetch the JWKS when it sees an unknown key id, or a key rotation signs out every user until its cache expires (SEB §9.5).'],
        };
      },
    }),
  ];
}
