/**
 * The named workflows.
 *
 * Each one composes tools that already exist; none reaches a provider
 * directly. Read them as the executable form of the operations runbook —
 * where the runbook and these disagree, one of them is wrong and it is
 * worth finding out which.
 */

import { z } from 'zod';
import type { WorkflowDefinition } from './engine.js';

/** Reads a string out of the run state, or fails loudly rather than sending "undefined". */
function str(state: Record<string, unknown>, key: string): string {
  const value = state[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Workflow state is missing ${key}; the step that should have captured it did not run or captured nothing.`);
  }
  return value;
}

export const WORKFLOWS: WorkflowDefinition[] = [
  {
    name: 'project.bootstrap',
    title: 'Bootstrap a new project',
    description:
      'Creates the repository, the database project, and the first branch, then records the connection as a handle for later configuration steps. Stops before deploying anything: bootstrapping and deploying are separate decisions.',
    requires: ['github', 'neon'],
    inputSchema: {
      name: z.string().min(1).describe('Project name. Used for the repository and the database project.'),
      owner: z.string().min(1).describe('GitHub owner.'),
      org: z.string().optional().describe('Create the repository under this organisation.'),
      description: z.string().optional(),
      private: z.boolean().optional(),
      regionId: z.string().optional().describe('Neon region. A residency decision, not a latency one.'),
    },
    steps: (input) => [
      {
        id: 'repo',
        title: 'Create the GitHub repository',
        tool: 'github.repo.create',
        args: () => ({ name: input['name'], org: input['org'], description: input['description'], private: input['private'] ?? true }),
        capture: (envelope, state) => {
          const data = envelope.data as { full_name?: string; default_branch?: string } | undefined;
          state['repoFullName'] = data?.full_name;
          state['defaultBranch'] = data?.default_branch ?? 'main';
        },
        // A repository is an institutional record: it is never destroyed
        // as compensation. Archiving is the human's call, not the undo's.
        compensate: () => undefined,
      },
      {
        id: 'neon-project',
        title: 'Create the Neon project',
        tool: 'neon.project.create',
        args: () => ({ name: input['name'], regionId: input['regionId'] }),
        capture: (envelope, state) => {
          const data = envelope.data as
            | { project?: { id?: string }; branch?: { id?: string }; databases?: Array<{ name?: string }>; roles?: Array<{ name?: string }> }
            | undefined;
          state['neonProjectId'] = data?.project?.id;
          state['neonBranchId'] = data?.branch?.id;
          state['neonDatabase'] = data?.databases?.[0]?.name;
          state['neonRole'] = data?.roles?.[0]?.name;
        },
        compensate: () => undefined,
      },
      {
        id: 'connection',
        title: 'Take a connection handle',
        tool: 'neon.connection.get',
        when: (state) => typeof state['neonProjectId'] === 'string',
        args: (state) => ({
          projectId: str(state, 'neonProjectId'),
          branchId: state['neonBranchId'],
          databaseName: str(state, 'neonDatabase'),
          roleName: str(state, 'neonRole'),
          pooled: true,
        }),
        capture: (envelope, state) => {
          const data = envelope.data as { handle?: string; host?: string } | undefined;
          state['connectionHandle'] = data?.handle;
          state['databaseHost'] = data?.host;
        },
      },
    ],
  },

  {
    name: 'secrets.install-database',
    title: 'Install a database credential into an application',
    description:
      'Moves a Neon connection string into a GitHub repository secret and a Cloudflare Worker secret without the value ever appearing in a result, a log or the transcript. This is the intended use of the handle vault.',
    requires: ['neon', 'github'],
    inputSchema: {
      projectId: z.string().min(1),
      branchId: z.string().optional(),
      databaseName: z.string().min(1),
      roleName: z.string().min(1),
      owner: z.string().min(1),
      repo: z.string().min(1),
      secretName: z.string().regex(/^[A-Z_][A-Z0-9_]*$/).describe('e.g. DATABASE_URL'),
      workerName: z.string().optional().describe('Also install it as a Cloudflare Worker secret.'),
    },
    steps: (input) => [
      {
        id: 'connection',
        title: 'Take a connection handle',
        tool: 'neon.connection.get',
        args: () => ({
          projectId: input['projectId'],
          branchId: input['branchId'],
          databaseName: input['databaseName'],
          roleName: input['roleName'],
          pooled: true,
        }),
        capture: (envelope, state) => {
          state['connectionHandle'] = (envelope.data as { handle?: string } | undefined)?.handle;
        },
      },
      {
        id: 'github-secret',
        title: 'Install it as a GitHub repository secret',
        tool: 'github.secret.put',
        args: (state) => ({
          owner: input['owner'],
          repo: input['repo'],
          name: input['secretName'],
          valueFromHandle: str(state, 'connectionHandle'),
        }),
        // Deleting a secret is protected; the engine refuses a protected
        // compensation anyway, so this is left to a human deliberately.
        compensate: () => undefined,
      },
      {
        id: 'worker-secret',
        title: 'Install it as a Cloudflare Worker secret',
        tool: 'cloudflare.worker.secret.put',
        when: () => typeof input['workerName'] === 'string',
        args: (state) => ({
          name: input['workerName'],
          key: input['secretName'],
          valueFromHandle: str(state, 'connectionHandle'),
        }),
        optional: true,
      },
    ],
  },

  {
    name: 'database.provision',
    title: 'Provision a database branch and apply migrations',
    description:
      'Takes a backup branch, creates or reuses a working branch, applies migrations, and reports drift. The backup is taken FIRST — a migration workflow whose first step is not a backup is a migration workflow that has not been thought about.',
    requires: ['neon'],
    inputSchema: {
      projectId: z.string().min(1),
      sourceBranchId: z.string().min(1),
      databaseName: z.string().min(1),
      roleName: z.string().min(1),
      label: z.string().min(1).describe('Why this is happening, e.g. "v3-schema". Becomes the backup branch name.'),
      migrations: z.array(z.object({ name: z.string().min(1), sql: z.string().min(1) })).min(1),
    },
    steps: (input) => [
      {
        id: 'backup',
        title: 'Take a backup branch first',
        tool: 'neon.backup.create',
        args: () => ({ projectId: input['projectId'], sourceBranchId: input['sourceBranchId'], label: input['label'] }),
        capture: (envelope, state) => {
          state['backupBranchId'] = (envelope.data as { branch?: { id?: string } } | undefined)?.branch?.id;
        },
      },
      {
        id: 'connection',
        title: 'Take a connection handle',
        tool: 'neon.connection.get',
        args: () => ({
          projectId: input['projectId'],
          branchId: input['sourceBranchId'],
          databaseName: input['databaseName'],
          roleName: input['roleName'],
          pooled: false,
        }),
        capture: (envelope, state) => {
          state['connectionHandle'] = (envelope.data as { handle?: string } | undefined)?.handle;
        },
      },
      {
        id: 'migrate',
        title: 'Apply the migrations',
        tool: 'neon.migration.apply',
        args: (state) => ({ connectionHandle: str(state, 'connectionHandle'), migrations: input['migrations'] }),
        capture: (envelope, state) => {
          state['migrationResult'] = envelope.data;
        },
        // Restoring is a real, reversible Neon operation, so it is a
        // legitimate compensation — Neon preserves the pre-restore state
        // as its own branch, so nothing is destroyed by undoing.
        compensate: (state) =>
          typeof state['backupBranchId'] === 'string'
            ? {
                tool: 'neon.backup.restore',
                args: {
                  projectId: input['projectId'],
                  branchId: input['sourceBranchId'],
                  sourceBranchId: state['backupBranchId'],
                },
              }
            : undefined,
      },
      {
        id: 'schema',
        title: 'Record the resulting schema',
        tool: 'neon.schema.get',
        args: () => ({ projectId: input['projectId'], branchId: input['sourceBranchId'], databaseName: input['databaseName'] }),
        optional: true,
      },
    ],
  },

  {
    name: 'deploy.prepare',
    title: 'Prepare a production deployment',
    description:
      'Read-only. Confirms the branch exists, the last workflow run succeeded, a rollback target exists, and the providers are healthy — then reports. It changes nothing, which is what makes it safe to run before every deployment.',
    requires: ['github'],
    inputSchema: {
      owner: z.string().min(1),
      repo: z.string().min(1),
      branch: z.string().min(1),
      vercelProjectId: z.string().optional(),
      cloudflarePagesProject: z.string().optional(),
    },
    steps: (input) => [
      { id: 'health', title: 'Check every configured provider', tool: 'stromex.health.check', args: () => ({}) },
      {
        id: 'branch',
        title: 'Confirm the branch exists',
        tool: 'github.branch.list',
        args: () => ({ owner: input['owner'], repo: input['repo'], perPage: 100 }),
      },
      {
        id: 'ci',
        title: 'Read the most recent workflow runs',
        tool: 'github.workflow.status',
        args: () => ({ owner: input['owner'], repo: input['repo'], branch: input['branch'], perPage: 5 }),
      },
      {
        id: 'rollback-target-vercel',
        title: 'Identify a Vercel rollback target',
        tool: 'vercel.deployment.list',
        when: () => typeof input['vercelProjectId'] === 'string',
        args: () => ({ projectId: input['vercelProjectId'], target: 'production', limit: 5 }),
        optional: true,
      },
      {
        id: 'rollback-target-pages',
        title: 'Identify a Cloudflare Pages rollback target',
        tool: 'cloudflare.pages.deployment.list',
        when: () => typeof input['cloudflarePagesProject'] === 'string',
        args: () => ({ project: input['cloudflarePagesProject'] }),
        optional: true,
      },
    ],
  },

  {
    name: 'deploy.production',
    title: 'Deploy to production and verify',
    description:
      'Triggers the deployment, then verifies. The verification step is not optional decoration: a deployment that was accepted and is not serving is the failure mode this workflow exists to catch (`SEB §17.4`).',
    requires: [],
    inputSchema: {
      target: z.enum(['vercel', 'cloudflare-pages']),
      project: z.string().min(1).describe('Vercel project id, or Cloudflare Pages project name.'),
      projectName: z.string().optional().describe('Vercel project NAME, required for a Vercel deployment.'),
      branch: z.string().optional(),
    },
    steps: (input) => [
      {
        id: 'deploy-vercel',
        title: 'Trigger the Vercel deployment',
        tool: 'vercel.deployment.create',
        when: () => input['target'] === 'vercel',
        args: () => ({ name: input['projectName'] ?? input['project'], project: input['project'], target: 'production' }),
        capture: (envelope, state) => {
          state['deploymentId'] = (envelope.data as { id?: string; uid?: string } | undefined)?.id ?? (envelope.data as { uid?: string } | undefined)?.uid;
        },
      },
      {
        id: 'deploy-pages',
        title: 'Trigger the Cloudflare Pages deployment',
        tool: 'cloudflare.pages.deploy',
        when: () => input['target'] === 'cloudflare-pages',
        args: () => ({ project: input['project'], branch: input['branch'] }),
        capture: (envelope, state) => {
          state['deploymentId'] = (envelope.data as { id?: string } | undefined)?.id;
        },
      },
      {
        id: 'verify-vercel',
        title: 'Verify the Vercel deployment state',
        tool: 'vercel.deployment.get',
        when: (state) => input['target'] === 'vercel' && typeof state['deploymentId'] === 'string',
        args: (state) => ({ deployment: str(state, 'deploymentId') }),
      },
      {
        id: 'verify-pages',
        title: 'Read the Cloudflare Pages build log',
        tool: 'cloudflare.pages.deployment.logs',
        when: (state) => input['target'] === 'cloudflare-pages' && typeof state['deploymentId'] === 'string',
        args: (state) => ({ project: input['project'], deploymentId: str(state, 'deploymentId') }),
        optional: true,
      },
      { id: 'health', title: 'Health check every provider afterwards', tool: 'stromex.health.check', args: () => ({}) },
    ],
  },

  {
    name: 'deploy.rollback',
    title: 'Roll back a production deployment',
    description: 'Points production back at a named previous deployment and verifies the result. Reversible by rolling forward, so no approval is required — speed matters more than ceremony during an incident.',
    requires: [],
    inputSchema: {
      target: z.enum(['vercel', 'cloudflare-pages']),
      project: z.string().min(1),
      deploymentId: z.string().min(1),
    },
    steps: (input) => [
      {
        id: 'rollback-vercel',
        title: 'Roll Vercel back',
        tool: 'vercel.deployment.rollback',
        when: () => input['target'] === 'vercel',
        args: () => ({ projectId: input['project'], deploymentId: input['deploymentId'] }),
      },
      {
        id: 'rollback-pages',
        title: 'Roll Cloudflare Pages back',
        tool: 'cloudflare.pages.rollback',
        when: () => input['target'] === 'cloudflare-pages',
        args: () => ({ project: input['project'], deploymentId: input['deploymentId'] }),
      },
      {
        id: 'verify',
        title: 'Verify the rolled-back deployment',
        tool: 'vercel.deployment.get',
        when: () => input['target'] === 'vercel',
        args: () => ({ deployment: input['deploymentId'] }),
        optional: true,
      },
    ],
  },

  {
    name: 'email.configure-domain',
    title: 'Configure a sending domain end to end',
    description:
      'Adds the sending domain to Resend, creates the DNS records it requires in Cloudflare, then asks Resend to verify. The ordering is the point: creating records after switching a sending address means every message in between fails SPF and DKIM.',
    requires: ['resend', 'cloudflare'],
    inputSchema: {
      domain: z.string().min(1),
      zoneId: z.string().min(1).describe('Cloudflare zone id for this domain.'),
    },
    steps: (input) => [
      {
        id: 'add-domain',
        title: 'Add the sending domain to Resend',
        tool: 'resend.domain.create',
        args: () => ({ name: input['domain'] }),
        capture: (envelope, state) => {
          const data = envelope.data as { id?: string; records?: Array<Record<string, unknown>> } | undefined;
          state['resendDomainId'] = data?.id;
          state['dnsRecords'] = data?.records ?? [];
        },
      },
      {
        id: 'report-records',
        title: 'Report the DNS records that must exist',
        tool: 'resend.domain.get',
        when: (state) => typeof state['resendDomainId'] === 'string',
        args: (state) => ({ id: str(state, 'resendDomainId') }),
      },
      {
        id: 'verify',
        title: 'Ask Resend to verify the domain',
        tool: 'resend.domain.verify',
        when: (state) => typeof state['resendDomainId'] === 'string',
        args: (state) => ({ id: str(state, 'resendDomainId') }),
        // DNS propagation means the first attempt often fails; that is
        // information, not a reason to abandon the whole workflow.
        optional: true,
      },
    ],
  },

  {
    name: 'estate.report',
    title: 'Produce an estate report',
    description:
      'Read-only. Walks every configured provider and reports what exists, plus the policy this instance enforces and the integrity of its own audit chain. This is the report to run before an audit, and the one to keep.',
    requires: [],
    inputSchema: {},
    steps: () => [
      { id: 'policy', title: 'The policy this instance enforces', tool: 'stromex.policy.describe', args: () => ({}) },
      { id: 'credentials', title: 'Which credentials are configured', tool: 'stromex.credentials.status', args: () => ({}) },
      { id: 'health', title: 'Provider health', tool: 'stromex.health.check', args: () => ({}) },
      { id: 'audit', title: 'Audit chain integrity', tool: 'stromex.audit.verify', args: () => ({}) },
      { id: 'recovery', title: 'Recovery journal', tool: 'stromex.recovery.list', args: () => ({ limit: 25 }), optional: true },
      { id: 'repos', title: 'GitHub repositories', tool: 'github.repo.list', args: () => ({ perPage: 100 }), optional: true },
      { id: 'workers', title: 'Cloudflare Workers', tool: 'cloudflare.worker.list', args: () => ({}), optional: true },
      { id: 'pages', title: 'Cloudflare Pages projects', tool: 'cloudflare.pages.project.list', args: () => ({}), optional: true },
      { id: 'd1', title: 'Cloudflare D1 databases', tool: 'cloudflare.d1.list', args: () => ({}), optional: true },
      { id: 'r2', title: 'Cloudflare R2 buckets', tool: 'cloudflare.r2.list', args: () => ({}), optional: true },
      { id: 'neon', title: 'Neon projects', tool: 'neon.project.list', args: () => ({}), optional: true },
      { id: 'vercel', title: 'Vercel projects', tool: 'vercel.project.list', args: () => ({ limit: 100 }), optional: true },
      { id: 'resend', title: 'Resend sending domains', tool: 'resend.domain.list', args: () => ({}), optional: true },
    ],
  },
];
