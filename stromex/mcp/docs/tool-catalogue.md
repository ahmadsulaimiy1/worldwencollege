# Tool Catalogue

*Every tool, with its authority class. Generated — regenerate with
`stromex-mcp catalogue --format=markdown`.*

**The class is the contract.** `read` observes; `write` runs
autonomously and is reversible; `protected` permanently destroys, needs a
human grant, and is refused outright on an institutional record whatever
the grant (`SEB §21.3`).

A provider with no credential contributes **no tools at all**, so a live
instance may expose fewer than this list. `stromex-mcp catalogue` prints
what yours actually has.

| Tool | Provider | Class | What it does |
|---|---|---|---|
| `brevo.account.get` | brevo | read | Brevo — account and plan |
| `brevo.campaign.create` | brevo | write | Brevo — create an email campaign |
| `brevo.campaign.list` | brevo | read | Brevo — list email campaigns |
| `brevo.campaign.send` | brevo | write | Brevo — send a campaign now |
| `brevo.contact.delete` | brevo | protected | Brevo — delete a contact |
| `brevo.contact.get` | brevo | read | Brevo — get a contact |
| `brevo.contact.list` | brevo | read | Brevo — list contacts |
| `brevo.contact.suppress` | brevo | write | Brevo — suppress or unsuppress a contact |
| `brevo.contact.upsert` | brevo | write | Brevo — create or update a contact |
| `brevo.events.get` | brevo | read | Brevo — delivery events |
| `brevo.list.create` | brevo | write | Brevo — create a contact list |
| `brevo.list.list` | brevo | read | Brevo — list contact lists |
| `brevo.statistics.get` | brevo | read | Brevo — delivery statistics |
| `brevo.template.create` | brevo | write | Brevo — create a template |
| `brevo.template.get` | brevo | read | Brevo — get a template |
| `brevo.template.list` | brevo | read | Brevo — list templates |
| `brevo.transactional.send` | brevo | write | Brevo — send a transactional email |
| `clerk.config.get` | clerk | read | Clerk — authentication configuration |
| `clerk.invitation.create` | clerk | write | Clerk — invite a user |
| `clerk.invitation.list` | clerk | read | Clerk — list invitations |
| `clerk.invitation.revoke` | clerk | write | Clerk — revoke an invitation |
| `clerk.membership.list` | clerk | read | Clerk — list organisation memberships |
| `clerk.membership.remove` | clerk | write | Clerk — remove a membership |
| `clerk.membership.set` | clerk | write | Clerk — add or change a membership |
| `clerk.organization.create` | clerk | write | Clerk — create an organisation |
| `clerk.organization.delete` | clerk | protected | Clerk — delete an organisation |
| `clerk.organization.invitation.create` | clerk | write | Clerk — invite a user to an organisation |
| `clerk.organization.list` | clerk | read | Clerk — list organisations |
| `clerk.user.ban` | clerk | write | Clerk — ban or unban a user |
| `clerk.user.count` | clerk | read | Clerk — count users |
| `clerk.user.create` | clerk | write | Clerk — create a user |
| `clerk.user.delete` | clerk | protected | Clerk — delete a user |
| `clerk.user.get` | clerk | read | Clerk — get a user |
| `clerk.user.list` | clerk | read | Clerk — list users |
| `clerk.user.lock` | clerk | write | Clerk — lock or unlock a user |
| `clerk.user.update` | clerk | write | Clerk — update a user |
| `cloudflare.account.list` | cloudflare | read | Cloudflare — list accounts |
| `cloudflare.d1.create` | cloudflare | write | Cloudflare — create a D1 database |
| `cloudflare.d1.delete` | cloudflare | protected | Cloudflare — delete a D1 database |
| `cloudflare.d1.export` | cloudflare | read | Cloudflare — export a D1 database |
| `cloudflare.d1.list` | cloudflare | read | Cloudflare — list D1 databases |
| `cloudflare.d1.query` | cloudflare | write | Cloudflare — run SQL against D1 |
| `cloudflare.dns.create` | cloudflare | write | Cloudflare — create a DNS record |
| `cloudflare.dns.delete` | cloudflare | protected | Cloudflare — delete a DNS record |
| `cloudflare.dns.list` | cloudflare | read | Cloudflare — list DNS records |
| `cloudflare.dns.update` | cloudflare | write | Cloudflare — update a DNS record |
| `cloudflare.durable-object.list` | cloudflare | read | Cloudflare — list Durable Object namespaces |
| `cloudflare.kv.key.list` | cloudflare | read | Cloudflare — list KV keys |
| `cloudflare.kv.namespace.create` | cloudflare | write | Cloudflare — create a KV namespace |
| `cloudflare.kv.namespace.list` | cloudflare | read | Cloudflare — list KV namespaces |
| `cloudflare.kv.value.delete` | cloudflare | protected | Cloudflare — delete a KV value |
| `cloudflare.kv.value.get` | cloudflare | read | Cloudflare — read a KV value |
| `cloudflare.kv.value.put` | cloudflare | write | Cloudflare — write a KV value |
| `cloudflare.pages.deploy` | cloudflare | write | Cloudflare — trigger a Pages deployment |
| `cloudflare.pages.deployment.list` | cloudflare | read | Cloudflare — list Pages deployments |
| `cloudflare.pages.deployment.logs` | cloudflare | read | Cloudflare — Pages build logs |
| `cloudflare.pages.domain.add` | cloudflare | write | Cloudflare — attach a custom domain to Pages |
| `cloudflare.pages.domain.list` | cloudflare | read | Cloudflare — list Pages custom domains |
| `cloudflare.pages.project.delete` | cloudflare | protected | Cloudflare — delete a Pages project |
| `cloudflare.pages.project.get` | cloudflare | read | Cloudflare — get a Pages project |
| `cloudflare.pages.project.list` | cloudflare | read | Cloudflare — list Pages projects |
| `cloudflare.pages.rollback` | cloudflare | write | Cloudflare — roll back a Pages deployment |
| `cloudflare.queue.create` | cloudflare | write | Cloudflare — create a Queue |
| `cloudflare.queue.delete` | cloudflare | protected | Cloudflare — delete a Queue |
| `cloudflare.queue.list` | cloudflare | read | Cloudflare — list Queues |
| `cloudflare.r2.create` | cloudflare | write | Cloudflare — create an R2 bucket |
| `cloudflare.r2.delete` | cloudflare | protected | Cloudflare — delete an R2 bucket |
| `cloudflare.r2.list` | cloudflare | read | Cloudflare — list R2 buckets |
| `cloudflare.worker.delete` | cloudflare | protected | Cloudflare — delete a Worker |
| `cloudflare.worker.deploy` | cloudflare | write | Cloudflare — deploy a Worker |
| `cloudflare.worker.get` | cloudflare | read | Cloudflare — get Worker settings |
| `cloudflare.worker.list` | cloudflare | read | Cloudflare — list Workers |
| `cloudflare.worker.secret.delete` | cloudflare | protected | Cloudflare — delete a Worker secret |
| `cloudflare.worker.secret.list` | cloudflare | read | Cloudflare — list Worker secrets |
| `cloudflare.worker.secret.put` | cloudflare | write | Cloudflare — set a Worker secret |
| `cloudflare.worker.tail.create` | cloudflare | write | Cloudflare — start a log tail |
| `cloudflare.zone.list` | cloudflare | read | Cloudflare — list zones |
| `github.branch.create` | github | write | GitHub — create a branch |
| `github.branch.list` | github | read | GitHub — list branches |
| `github.commit.push` | github | write | GitHub — commit files |
| `github.file.get` | github | read | GitHub — read a file |
| `github.issue.create` | github | write | GitHub — create an issue |
| `github.issue.list` | github | read | GitHub — list issues |
| `github.pull.create` | github | write | GitHub — open a pull request |
| `github.pull.list` | github | read | GitHub — list pull requests |
| `github.pull.merge` | github | write | GitHub — merge a pull request |
| `github.release.create` | github | write | GitHub — create a release |
| `github.release.list` | github | read | GitHub — list releases |
| `github.repo.create` | github | write | GitHub — create a repository |
| `github.repo.get` | github | read | GitHub — get a repository |
| `github.repo.list` | github | read | GitHub — list repositories |
| `github.secret.delete` | github | protected | GitHub — delete a repository secret |
| `github.secret.list` | github | read | GitHub — list repository secrets |
| `github.secret.put` | github | write | GitHub — set a repository secret |
| `github.tag.list` | github | read | GitHub — list tags |
| `github.variable.list` | github | read | GitHub — list repository variables |
| `github.variable.put` | github | write | GitHub — set a repository variable |
| `github.viewer.get` | github | read | GitHub — identify the credential |
| `github.workflow.list` | github | read | GitHub — list workflows |
| `github.workflow.run` | github | write | GitHub — trigger a workflow |
| `github.workflow.status` | github | read | GitHub — workflow run status |
| `neon.backup.create` | neon | write | Neon — take a backup |
| `neon.backup.restore` | neon | write | Neon — restore a branch |
| `neon.branch.create` | neon | write | Neon — create a branch |
| `neon.branch.delete` | neon | protected | Neon — delete a branch |
| `neon.branch.list` | neon | read | Neon — list branches |
| `neon.connection.get` | neon | read | Neon — get a connection handle |
| `neon.database.create` | neon | write | Neon — create a database |
| `neon.database.list` | neon | read | Neon — list databases |
| `neon.migration.apply` | neon | write | Neon — apply migrations |
| `neon.operation.list` | neon | read | Neon — list operations |
| `neon.performance.slow-queries` | neon | read | Neon — slowest queries |
| `neon.project.create` | neon | write | Neon — create a project |
| `neon.project.get` | neon | read | Neon — get a project |
| `neon.project.list` | neon | read | Neon — list projects |
| `neon.role.list` | neon | read | Neon — list roles |
| `neon.schema.get` | neon | read | Neon — get a schema |
| `neon.sql.run` | neon | write | Neon — run SQL |
| `resend.api-key.create` | resend | write | Resend — create an API key |
| `resend.api-key.delete` | resend | protected | Resend — revoke an API key |
| `resend.api-key.list` | resend | read | Resend — list API keys |
| `resend.domain.create` | resend | write | Resend — add a sending domain |
| `resend.domain.delete` | resend | protected | Resend — remove a sending domain |
| `resend.domain.get` | resend | read | Resend — get a sending domain |
| `resend.domain.list` | resend | read | Resend — list sending domains |
| `resend.domain.verify` | resend | write | Resend — verify a sending domain |
| `resend.email.batch` | resend | write | Resend — send a batch of emails |
| `resend.email.get` | resend | read | Resend — check a sent email |
| `resend.email.send` | resend | write | Resend — send a transactional email |
| `stromex.approval.list` | stromex | read | StromeX — list approval requests |
| `stromex.audit.query` | stromex | read | StromeX — query the audit trail |
| `stromex.audit.verify` | stromex | read | StromeX — verify the audit chain |
| `stromex.credentials.status` | stromex | read | StromeX — credential status |
| `stromex.handles.list` | stromex | read | StromeX — list credential handles |
| `stromex.health.check` | stromex | read | StromeX — health check |
| `stromex.policy.describe` | stromex | read | StromeX — describe the authority policy |
| `stromex.recovery.get` | stromex | read | StromeX — read a recovery journal entry |
| `stromex.recovery.list` | stromex | read | StromeX — list recovery journal entries |
| `stromex.version` | stromex | read | StromeX — server version and limits |
| `stromex.workflow.list` | stromex | read | StromeX — list workflows |
| `stromex.workflow.run` | stromex | write | StromeX — run a workflow |
| `vercel.deployment.create` | vercel | write | Vercel — trigger a deployment |
| `vercel.deployment.get` | vercel | read | Vercel — get a deployment |
| `vercel.deployment.list` | vercel | read | Vercel — list deployments |
| `vercel.deployment.logs` | vercel | read | Vercel — deployment build logs |
| `vercel.deployment.promote` | vercel | write | Vercel — promote a deployment |
| `vercel.deployment.rollback` | vercel | write | Vercel — roll back production |
| `vercel.domain.add` | vercel | write | Vercel — attach a domain to a project |
| `vercel.domain.buy` | vercel | write | Vercel — buy a domain |
| `vercel.domain.check` | vercel | read | Vercel — check domain availability and price |
| `vercel.domain.list` | vercel | read | Vercel — list project domains |
| `vercel.domain.remove` | vercel | protected | Vercel — detach a domain from a project |
| `vercel.env.delete` | vercel | protected | Vercel — delete an environment variable |
| `vercel.env.list` | vercel | read | Vercel — list environment variables |
| `vercel.env.set` | vercel | write | Vercel — set an environment variable |
| `vercel.project.create` | vercel | write | Vercel — create a project |
| `vercel.project.get` | vercel | read | Vercel — get a project |
| `vercel.project.list` | vercel | read | Vercel — list projects |

---

## Counts

| Class | Tools |
|---|---|
| read | 80 |
| write | 61 |
| protected | 17 |
| **total** | **158** |

## The protected seventeen

These are the only seventeen tools in the server that can permanently
remove something. Each requires a human grant, each captures a pre-image first,
and each is refused outright when its resource matches a
protected-resource pattern.

| Tool | What it destroys | What a pre-image can restore |
|---|---|---|
| `cloudflare.d1.delete` | A D1 database and every row | Metadata only — take `cloudflare.d1.export` first |
| `cloudflare.r2.delete` | A bucket and every object | Configuration only |
| `cloudflare.kv.value.delete` | One KV value | **Fully** — the value is recorded |
| `cloudflare.queue.delete` | A Queue and undelivered messages | Structure only |
| `cloudflare.pages.project.delete` | A Pages project and its whole deployment history | Build configuration and domains only — every rollback target is gone |
| `cloudflare.dns.delete` | A DNS record | **Fully** — every field is recorded |
| `cloudflare.worker.delete` | A Worker and its routes | Bindings only — the source comes from git |
| `cloudflare.worker.secret.delete` | A Worker secret | **Nothing** — Cloudflare never discloses values |
| `github.secret.delete` | A repository secret | **Nothing** — GitHub never discloses values |
| `neon.branch.delete` | A branch and its data | Metadata only |
| `vercel.env.delete` | An environment variable | Metadata only — encrypted values are not returned |
| `vercel.domain.remove` | A domain's attachment to a project | **Fully** — re-attach; DNS is untouched |
| `clerk.user.delete` | A user, their sessions and memberships | In principle only — treat as unrecoverable |
| `clerk.organization.delete` | An organisation and its memberships | Memberships are recorded; the id changes |
| `resend.domain.delete` | A sending domain | The DNS record set is recorded |
| `resend.api-key.delete` | An API key | **Nothing** — create a replacement |
| `brevo.contact.delete` | A contact and their history | Attributes and lists only |

**In almost every case there is a `write` alternative that achieves the
intent reversibly** — `clerk.user.ban`, `brevo.contact.suppress`,
`resend.domain.verify`, an archive or a revocation. Reach for it first.

## The one tool that spends money

`vercel.domain.buy`. It declares a purchase, so the policy engine gates
it against the spending policy — which ships disabled. The price is read
from Vercel immediately before purchase and passed as `expectedPrice`, so
a price that moved is rejected by the provider rather than silently
charged. `vercel.domain.check` is the read-only half and is always
available.
