/**
 * THE BOOK AS HTML — composed from one solved run, before any page is
 * poured. Used by the renderer, and by the tests, which read the whole
 * book without a browser.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { facts } from './facts.mjs';
import { css } from './style.mjs';
import { cover, edition, contents, brief } from './front.mjs';
import { stage1, stage2 } from './stages1.mjs';
import { stage3, stage4 } from './stages2.mjs';
import { stage5, stage6 } from './stages3.mjs';
import { stage7, stage8, stage9, stage10 } from './stages4.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const FACES = readFileSync(path.join(ROOT, 'assets/fonts/monograph-faces.css'), 'utf8');

export function compose() {
  const F = facts();
  const STAGES = [
    { n: 'I', title: 'Institutional doctrine', say: 'What the College is, the standard it keeps and the rules it runs by', id: 'stage-1', build: stage1 },
    { n: 'II', title: 'Academic architecture', say: 'The qualification, its assessment and the curriculum', id: 'stage-2', build: stage2 },
    { n: 'III', title: 'Market architecture', say: 'Where the College recruits, what markets pay, what a learner costs to find', id: 'stage-3', build: stage3 },
    { n: 'IV', title: 'Commercial architecture', say: 'The routes as products, how each fee is built, the margin and scale', id: 'stage-4', build: stage4 },
    { n: 'V', title: 'Operating model', say: 'People, pay, the platform and the institution’s running costs', id: 'stage-5', build: stage5 },
    { n: 'VI', title: 'Financial model', say: 'The basis, the ten-year statement, cash, capital and the cases', id: 'stage-6', build: stage6 },
    { n: 'VII', title: 'Ten-year roadmap', say: 'Each year’s objective, actions, resources, measures, money and gate', id: 'stage-7', build: stage7 },
    { n: 'VIII', title: 'Governance', say: 'Reserved decisions, academic governance, gates, measures and risks', id: 'stage-8', build: stage8 },
    { n: 'IX', title: 'Investment case', say: 'What is asked, what it builds, when it returns and how it is protected', id: 'stage-9', build: stage9 },
    { n: 'X', title: 'Appendices', say: 'The basis of the plan, the register, the model by term, a glossary', id: 'stage-10', build: stage10 },
  ];

  const parts = [
    cover(F),
    edition(F),
    contents(F, [
      { title: 'The plan in brief', say: 'The College, its routes, its capital, its cases and the decisions asked of the Board', id: 'brief', front: true },
      ...STAGES.map((s) => ({ n: s.n, title: s.title, say: s.say, id: s.id })),
    ]),
    ...brief(F),
    ...STAGES.flatMap((s) => s.build(F)),
  ];

  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
  <title>WEC-LC Ten-Year Institutional Master Plan — Board &amp; Investment Edition ${F.period}</title>
  <style>${css(FACES)}</style></head><body>${parts.join('\n')}</body></html>`;
  return { F, html };
}
