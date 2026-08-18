/**
 * The engineering council's tool surface (`SEB §32.3`).
 *
 * Three design decisions worth knowing before reading the table.
 *
 * **Every tool takes a SUBJECT and a QUESTION, never a data handle.**
 * That is the structural enforcement of `SEB §32.6`: there is no
 * parameter through which a database connection, a bucket or a record set
 * could be handed to a third-party model. Send the shape, not the data.
 *
 * **Every tool is `write`, not `read`.** A consultation transmits
 * material outside the estate and costs money. Classifying it as
 * observation would be convenient and wrong — and it would remove
 * `dryRun`, which here shows the operator the exact outbound payload
 * before anything leaves.
 *
 * **Every tool has a SHAPED instruction.** An unshaped "review this"
 * returns generic advice from any model. The instructions below ask for
 * the specific thing that model is good at finding and that we are bad at
 * seeing in our own work.
 */

import { z } from 'zod';
import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { clientFor, plan } from '../support.js';
import type { OpenAiClient } from './client.js';

const openai = (ctx: Parameters<typeof clientFor>[0]) => clientFor<OpenAiClient>(ctx, 'openai');

/** The arguments every consultation shares. */
const consultationArgs = {
  subject: z
    .string()
    .min(1)
    .describe(
      'The material to be considered — code, a schema, a document, a design description, a policy draft. ' +
        'Send the SHAPE, not the data: a schema rather than rows, a redacted sample rather than a real one. ' +
        'Restricted data (safeguarding, identity documents, credentials, health, named individual records) must never appear here.',
    ),
  question: z.string().optional().describe('A specific focus. Omit for the tool\'s default line of attack.'),
  context: z.string().optional().describe('What the consultant needs to know to judge fairly — constraints, prior decisions, what is deliberately out of scope.'),
  model: z.string().optional().describe('Override the configured model.'),
  effort: z.enum(['low', 'medium', 'high']).optional().describe('Reasoning effort where the model supports it. Default high for reviews.'),
  maxOutputTokens: z.number().int().min(256).max(32_000).optional(),
} as const;

/** The standing preamble every consultant receives. */
const HOUSE_BRIEF = [
  'You are consulting for StromeX Technologies, which builds institutional platforms — registrars, certificate and transcript systems, learning platforms, and the public sites of educational institutions.',
  '',
  'Three standing constraints govern anything you recommend:',
  '  1. Institutional records are archived, superseded and revoked — never destroyed. Do not propose a deletion path for a certificate, transcript, student record, audit log or academic history.',
  '  2. No claim is published that the institution cannot evidence. Do not propose copy asserting accreditation, outcomes, numbers or partnerships.',
  '  3. Accessibility is a floor, not a feature. WCAG 2.1 AA, full RTL, and a 320px viewport are non-negotiable.',
  '',
  'Answer as a named expert would to a peer: specific, ordered by consequence, willing to say when something is fine.',
  'Do not restate the material back. Do not pad. Do not close by summarising what you just said.',
].join('\n');

interface Consultation {
  name: string;
  title: string;
  /** Shown to the model as its role and its line of attack. */
  instructions: string;
  /** Shown to the caller. */
  description: string;
  defaultEffort?: 'low' | 'medium' | 'high';
}

const CONSULTATIONS: Consultation[] = [
  {
    name: 'openai.review.architecture',
    title: 'Council — architecture review',
    description: 'An independent architecture review. Asks for failure modes, scaling limits, coupling, and the decision that will be regretted in three years.',
    instructions:
      'You are a principal architect reviewing a design you did not write.\n\n' +
      'Find, in this order: (1) the failure mode nobody has planned for; (2) the coupling that will make a future change expensive; ' +
      '(3) the scaling limit and the number at which it bites; (4) the single decision most likely to be regretted, and what to do instead; ' +
      '(5) anything genuinely good, said briefly, so the reader can tell you actually read it.\n\n' +
      'Number your findings. For each, state the consequence concretely — what breaks, when, and for whom.',
  },
  {
    name: 'openai.review.code',
    title: 'Council — code review',
    description: 'An adversarial code review. Asks for correctness bugs, edge cases and what the tests do not cover — not style.',
    instructions:
      'You are reviewing code adversarially. Ignore style entirely; a formatter handles that.\n\n' +
      'Find: correctness bugs with a concrete failing input; unhandled edge cases; race conditions; resource leaks; ' +
      'error paths that swallow information; and — most valuable — what the tests appear to assert but do not actually prove.\n\n' +
      'For each finding give: the location, the input or state that triggers it, and the wrong outcome. ' +
      'If you cannot construct a failing case, say the finding is speculative and rank it below the ones you can.',
  },
  {
    name: 'openai.review.security',
    title: 'Council — security review',
    description: 'A threat-model review. Asks for the attack the author did not imagine, and where the trust boundaries are wrong.',
    instructions:
      'You are a security reviewer. Work from trust boundaries outward.\n\n' +
      'Identify: every boundary where untrusted input crosses into trusted execution; authentication and authorisation gaps, ' +
      'especially where a control is documented but may not be enforced; injection surfaces including SSRF; secret handling; ' +
      'and the attack the author most plausibly did not imagine.\n\n' +
      'Rank by exploitability times consequence. Give a concrete attack narrative for each, not a category name.',
    defaultEffort: 'high',
  },
  {
    name: 'openai.review.ux',
    title: 'Council — experience review',
    description: 'A UX review. Asks for the step where a real person gives up, and what they will misunderstand.',
    instructions:
      'You are reviewing an experience for a specific reader: a parent on a three-year-old Android phone, on 3G, who has never used this system and is slightly anxious about the outcome.\n\n' +
      'Identify: the step where they give up; the thing they will misunderstand and act on; the moment they will not know whether it worked; ' +
      'and any place the interface asks them for something they do not have to hand.\n\n' +
      'Then, separately, do the same for an administrator using this forty times a day. Their failures are different and usually worse.',
  },
  {
    name: 'openai.review.accessibility',
    title: 'Council — accessibility review',
    description: 'An accessibility review against WCAG 2.1 AA, including RTL, motion sensitivity and screen-reader semantics.',
    instructions:
      'You are an accessibility specialist reviewing against WCAG 2.1 AA as a floor, not a target.\n\n' +
      'Cover: colour contrast on every ground including any dark register; focus order and focus visibility; keyboard-only operation; ' +
      'screen-reader semantics and the accessible name of every control; motion and vestibular safety, including whether reduced-motion carve-outs ' +
      'resolve to the FINISHED state rather than the hidden one; target sizes; text scaling to 200%; and full bidirectional (RTL) behaviour, ' +
      'which fails differently and more severely than LTR.\n\n' +
      'Give the specific criterion number for each finding.',
  },
  {
    name: 'openai.review.performance',
    title: 'Council — performance review',
    description: 'A performance review. Asks which metric regresses first and why, on the device the constitution names.',
    instructions:
      'You are reviewing performance for a three-year-old mid-range Android phone on a metered 3G connection. That device is the target, not a laptop.\n\n' +
      'Identify: the hot path; the largest avoidable payload; the work done on the main thread that need not be; ' +
      'the render or layout cost that will show as jank; and which metric will regress first as the system grows, with the growth number at which it does.\n\n' +
      'Prefer a measurement you can reason about to an optimisation you cannot justify.',
  },
  {
    name: 'openai.review.data-model',
    title: 'Council — data model review',
    description: 'A schema review. Asks which invariants are not enforced and which impossible states are representable.',
    instructions:
      'You are reviewing a data model.\n\n' +
      'Identify: (1) every invariant stated in prose that the schema does not enforce — uniqueness, referential integrity, check constraints, ' +
      'ON DELETE behaviour chosen by default rather than deliberately; (2) impossible states the model permits; ' +
      '(3) where a correction would overwrite history that someone may later dispute; ' +
      '(4) the migration that will be painful, and what to change now to avoid it.\n\n' +
      'Institutional records are archived, never deleted — flag any design that assumes deletion.',
  },
  {
    name: 'openai.review.api',
    title: 'Council — API design review',
    description: 'An API review. Asks what breaks a client, and what the naming will cost in five years.',
    instructions:
      'You are reviewing an API surface for people who will build against it for years.\n\n' +
      'Identify: naming that will read wrongly to someone who did not write it; versioning and compatibility hazards; ' +
      'error shapes a client cannot branch on; operations that are not idempotent but will be retried; ' +
      'pagination and ordering that will break at scale; and anything that leaks an implementation detail a client will come to depend on.',
  },
  {
    name: 'openai.review.documentation',
    title: 'Council — documentation review',
    description: 'A documentation review. Asks what a new reader cannot follow, and what is claimed but not true.',
    instructions:
      'You are a new engineer reading this documentation for the first time, with no prior context.\n\n' +
      'Identify: (1) the first point at which you could not proceed; (2) every claim that is asserted but not evidenced, ' +
      'especially any use of "production", "deployed", "verified" or "working" without stated evidence; ' +
      '(3) what the document does not say that you needed; (4) anything that has drifted out of date relative to the rest of the material.',
  },
  {
    name: 'openai.content.refine',
    title: 'Council — refine content',
    description: 'Content refinement for structure, precision and authority — bound by the anti-AI register.',
    instructions:
      'You are an institutional editor for a organisation whose voice is authoritative, precise and unhurried.\n\n' +
      'Improve structure, precision and authority. Then enforce the house register absolutely:\n' +
      '  · Numbers, never superlatives. A claim without a number, a date or a source is cut.\n' +
      '  · Ambition stated as a vision, never as a settled fact.\n' +
      '  · No editorial scaffolding: no "coming soon", no apology, no hedging, no placeholder voice.\n' +
      '  · No AI register. Banned outright: "delve", "leverage", "robust", "seamless", "cutting-edge", "unlock", "elevate", ' +
      '"in today\'s fast-paced world", "navigate the complexities of", and the construction "It\'s not just X — it\'s Y".\n' +
      '  · Vary sentence length. At least one short sentence per paragraph. No tricolon in every paragraph.\n' +
      '  · No closing paragraph that restates the opening. No emoji.\n\n' +
      'Return the improved text, then a short list of what you changed and why.',
  },
  {
    name: 'openai.content.vet',
    title: 'Council — anti-generic vetting pass',
    description: 'The gate at `SEB §30.14`. Asks a second model to identify every sentence that reads as machine-written, and say why.',
    instructions:
      'Identify every sentence in this text that reads as machine-written, and say precisely why.\n\n' +
      'Look for: corpus tells ("delve", "leverage", "robust", "seamless", "cutting-edge", "unlock", "elevate"); ' +
      'the construction "It\'s not just X — it\'s Y"; tricolon as a default rhythm; uniform sentence length; ' +
      'an em-dash in every third sentence; a closing paragraph that restates the opening; ' +
      '"Whether you\'re a X or a Y"; bulleted lists where prose would carry the argument; superlatives without a number; ' +
      'and the general absence of a specific human decision anywhere in the text.\n\n' +
      'Quote each offending sentence. Rank by how obvious the tell is. Then state, in one line, whether a careful reader would ' +
      'conclude this was machine-written — and be blunt.',
    defaultEffort: 'high',
  },
  {
    name: 'openai.policy.draft',
    title: 'Council — draft a governance instrument',
    description:
      'Drafts a complete governance instrument to the thirteen-section standard. Under `SEB §29.10` a gap in the specification is drafted, not flagged — but no fact about the institution is ever invented.',
    instructions:
      'Draft a complete governance instrument for an educational institution, to this exact structure:\n\n' +
      '  1. Policy Information (code, title, version, effective date, owner, approval authority, review cycle, next review date)\n' +
      '  2. Purpose · 3. Scope · 4. Definitions · 5. Policy Statement · 6. Roles and Responsibilities · 7. Procedures\n' +
      '  8. Monitoring and Compliance · 9. Records and Documentation · 10. Related Policies · 11. Exceptions\n' +
      '  12. Appeals and Complaints · 13. Review and Amendment\n' +
      '  · then a version-control table.\n\n' +
      'Immediately after section 1, include a callout headed "Before this governs a real decision" stating plainly what is and is not live today.\n\n' +
      'Rules: every period, threshold and authority you propose is marked as PROPOSED, pending confirmation, with your reasoning. ' +
      'Never invent a fact about the institution — no names, no registration numbers, no dates of incorporation, no figures. ' +
      'Where a fact is needed and not supplied, write the clause so it names the placeholder explicitly rather than inventing a value. ' +
      'End with a section titled "What this deliberately leaves open".',
    defaultEffort: 'high',
  },
  {
    name: 'openai.education.author',
    title: 'Council — author educational material',
    description: 'Curriculum, assessment items and rubrics. Every unit states what the learner knows afterwards that they did not before.',
    instructions:
      'You are an assessment and curriculum specialist.\n\n' +
      'Every unit you produce must carry: a stated learning objective; a difficulty calibration; a mastery check; ' +
      'and an explicit statement of what the learner knows afterwards that they did not before. Nothing ships without that last one.\n\n' +
      'Assessment items must have a defensible key and a stated reason each distractor is plausible. ' +
      'Rubrics must be usable by two different markers reaching the same grade.\n\n' +
      'Do not pad to create an appearance of completeness. Fewer, finished units beat more, provisional ones.',
  },
  {
    name: 'openai.research.brief',
    title: 'Council — research brief',
    description: 'Prior art and precedent: what the field already knows, and where the good work is.',
    instructions:
      'Produce a research brief on the question given.\n\n' +
      'Cover: what is already established and by whom; where practitioners disagree and why; the strongest counter-position to the obvious answer; ' +
      'and what would have to be true for the obvious answer to be wrong.\n\n' +
      'Distinguish clearly between what you know, what you infer, and what you are uncertain about. ' +
      'Where you cite, cite something checkable. Never fabricate a citation — say you could not find one.',
  },
  {
    name: 'openai.alternatives.generate',
    title: 'Council — generate alternatives',
    description: 'Three genuinely distinct approaches with trade-offs. The excellence procedure at `SEB §29.7` requires three positions, not three variants of one.',
    instructions:
      'Produce THREE genuinely distinct approaches — not three variants of one idea. If two of yours share a core assumption, replace one.\n\n' +
      'For each: the approach in two sentences; what it is best at; what it is worst at; what it costs to change your mind later; ' +
      'and the specific condition under which it is the right choice.\n\n' +
      'Then state which you would choose and why — and, separately, which you would choose if the constraint were long-term maintainability above all else. ' +
      'If those differ, say so plainly; that difference is the most useful thing in your answer.',
    defaultEffort: 'high',
  },
  {
    name: 'openai.validate.independent',
    title: 'Council — independent validation',
    description: 'One claim, one verdict, and the reasoning. The most valuable consultation and the least used.',
    instructions:
      'You are validating a single claim independently. Do not be agreeable.\n\n' +
      'State: whether the claim holds; the strongest argument against it; what evidence would settle it; ' +
      'and — if it does not hold — the corrected claim.\n\n' +
      'If the claim is unfalsifiable as stated, say so and rewrite it as something that could be checked. ' +
      'A verdict of "correct" is useful only if you genuinely tried to break it first; say what you tried.',
    defaultEffort: 'high',
  },
];

export function openaiTools(): ToolDefinition[] {
  const consultations = CONSULTATIONS.map((consultation) =>
    defineTool({
      name: consultation.name,
      title: consultation.title,
      description:
        `${consultation.description}\n\n` +
        'Sends material to OpenAI through the official API. Takes a SUBJECT and a QUESTION — never a data handle: ' +
        'restricted data (safeguarding, identity documents, credentials, health information, named individual records) must never be sent, ' +
        'and the connector refuses outright if the payload contains a credential this process holds. ' +
        'Pass dryRun=true to see the exact outbound payload without sending it.',
      provider: 'openai',
      operationClass: 'write',
      annotations: { idempotentHint: false, readOnlyHint: false, destructiveHint: false },
      inputSchema: consultationArgs,
      resource: () => consultation.name,
      handler: async (args, ctx) => {
        const client = openai(ctx);
        const input = [
          args.context ? `## Context\n${args.context}\n` : '',
          `## Subject\n${args.subject}\n`,
          args.question ? `## The question\n${args.question}` : '',
        ]
          .filter(Boolean)
          .join('\n');

        const request = {
          instructions: `${HOUSE_BRIEF}\n\n---\n\n${consultation.instructions}`,
          input,
          model: args.model,
          maxOutputTokens: args.maxOutputTokens,
          reasoningEffort: args.effort ?? consultation.defaultEffort,
          operation: consultation.name.replace('openai.', ''),
        };

        if (ctx.dryRun) {
          return plan(`Would consult ${args.model ?? client.model()} for ${consultation.title}`, {
            model: args.model ?? client.model(),
            instructions: request.instructions,
            input,
            reasoningEffort: request.reasoningEffort,
            maxOutputTokens: request.maxOutputTokens ?? 4000,
          });
        }

        /*
         * A metered provider. The cost is not knowable before the call, so
         * this is the only bound available: refuse the NEXT call once the
         * rolling window is out of headroom.
         *
         * Sixteen consultation tools spent real money for three releases
         * with no spending gate at all — bounded only by a token bucket,
         * which limits the RATE of spending and not its total (SEB-D 29).
         */
        if (client.pricing?.currency) ctx.assertSpendHeadroom(client.pricing.currency);

        const result = await client.consult(request);
        const warnings: string[] = [];

        // Recorded whatever it breached: the money has moved, and a charge
        // refused into oblivion is a charge nobody can reconcile.
        if (result.cost) {
          const { breach } = ctx.commitSpend(
            { amount: result.cost.amount, currency: result.cost.currency, description: `${consultation.title} (${result.model})` },
            { alreadyIncurred: true },
          );
          if (breach) warnings.push(`This consultation was charged and it breached the spending policy: ${breach}`);
        }
        if (result.incomplete) {
          warnings.push(`The response was incomplete (${result.incomplete}). Treat it as partial.`);
        }
        if (!result.cost) {
          warnings.push('Cost is unpriced: no per-token rates are configured, so tokens are reported, money is not, and THIS CALL DOES NOT COUNT AGAINST THE ROLLING CAP. Set OPENAI_PRICE_INPUT_PER_MTOK and OPENAI_PRICE_OUTPUT_PER_MTOK to price it.');
        }
        warnings.push('This is a consultation, not a decision. Weigh it, explain the trade-off in your own words, and record what you adopt (SEB §32.4).');

        return {
          summary: `${consultation.title} — ${result.model}, ${result.usage.totalTokens ?? '?'} tokens${result.cost ? `, ${result.cost.amount} ${result.cost.currency}` : ''}`,
          data: {
            model: result.model,
            finding: result.text,
            usage: result.usage,
            cost: result.cost,
            requestId: result.requestId,
          },
          warnings,
        };
      },
    }),
  );

  return [
    ...consultations,
    defineTool({
      name: 'openai.models.list',
      title: 'Council — list available models',
      description: 'Lists the models the configured key can see. The cheapest way to confirm the credential works and to find a model name.',
      provider: 'openai',
      operationClass: 'read',
      inputSchema: { filter: z.string().optional().describe('Substring match on the model id.') },
      handler: async (args, ctx) => {
        const models = await openai(ctx).listModels();
        const filtered = args.filter ? models.filter((model) => model.id.includes(args.filter!)) : models;
        return {
          summary: `${filtered.length} model(s) visible${args.filter ? ` matching ${args.filter}` : ''}`,
          data: { count: filtered.length, models: filtered.map((model) => model.id).sort() },
        };
      },
    }),
  ];
}
