/**
 * THE CRAFTSMANSHIP AUDIT.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS IS MEASURED RATHER THAN LOOKED AT
 * ────────────────────────────────────────────────────────────────────
 * A spread-by-spread review of a 477-page book is 239 judgements, and a
 * human art director makes them by looking. I cannot look at 239
 * spreads and honestly claim I judged each one — and a review I cannot
 * substantiate is worse than none, because it launders an impression
 * into a finding.
 *
 * So the defects that CAN be measured are measured, across every
 * element in the book, and the ones that cannot are named as
 * unmeasured rather than quietly counted as passed.
 *
 * MEASURED HERE
 *   Runts — a paragraph or heading whose last line is one short word.
 *   Justification stress — lines set so loose they open rivers.
 *   Heading hierarchy — levels skipped, which breaks navigation.
 *   Type sizes below the legibility floor for print.
 *   Table structure — header cells that are not header cells.
 *   Stroke, tracking and radius values that fall outside the system.
 *
 * NOT MEASURED, AND SAID SO
 *   Rivers proper (requires glyph-level raster analysis).
 *   Optical balance of a spread as a composition.
 *   Whether a given page "earns its place" editorially.
 *
 * The audit runs against the rendered HTML using the book's own
 * stylesheet at the book's own measure, so what it measures is what the
 * page does.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** The text measure in CSS pixels: A4 less the mirrored margins. */
export const MEASURE_MM = 210 - 26 - 16;
export const MEASURE_PX = Math.round((MEASURE_MM / 25.4) * 96);

export async function audit(htmlPath = `${ROOT}/publication/.flagship.html`) {
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: { width: MEASURE_PX + 40, height: 1200 } });
  await page.setContent(readFileSync(htmlPath, 'utf8'), { waitUntil: 'load' });

  const findings = await page.evaluate((measure) => {
    // Constrain the body to the true text measure so the line breaking
    // the audit sees is the line breaking the printed page will have.
    const host = document.body;
    host.style.width = `${measure}px`;
    host.style.margin = '0';

    // Group client rects into visual lines.
    //
    // The tolerance is a fraction of the line height, not a fixed 2 px.
    // A fixed tolerance splits a line whenever an inline child sits on a
    // different baseline — an icon, a small-caps label, a superior
    // figure — and reports each fragment as its own line. The first
    // version of this audit did exactly that and returned 697 runts, of
    // which almost none were runts: they were flex rows and dialogue
    // speaker labels being counted as short final lines. A measurement
    // that produces mostly false positives is not a strict measurement,
    // it is a broken one, and acting on it would have meant "fixing"
    // several hundred paragraphs that were correctly set.
    const lineBoxes = (el) => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 14;
      const r = document.createRange();
      r.selectNodeContents(el);
      const rects = [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 0.5);
      const lines = [];
      for (const rc of rects) {
        const line = lines.find((l) => Math.abs(l.top - rc.top) < lh * 0.6);
        if (line) {
          line.left = Math.min(line.left, rc.left);
          line.right = Math.max(line.right, rc.right);
          line.top = Math.min(line.top, rc.top);
        } else {
          lines.push({ top: rc.top, left: rc.left, right: rc.right });
        }
      }
      return lines.sort((a, b) => a.top - b.top);
    };

    /**
     * Only elements that are a single continuous text flow can have a
     * runt. A flex or grid container's "last line" is a column, and a
     * paragraph containing a floated drop cap has a first line that is
     * not a line. Excluding them is not weakening the audit — it is
     * confining it to the cases where the question makes sense.
     */
    const isPlainFlow = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display !== 'block' && cs.display !== 'list-item'
        && cs.display !== 'table-cell') return false;
      for (const child of el.children) {
        const ccs = getComputedStyle(child);
        if (['flex', 'grid', 'block', 'table'].includes(ccs.display)) return false;
        if (ccs.float !== 'none') return false;
        if (child.tagName === 'svg' || child.tagName === 'OL' || child.tagName === 'UL') return false;
      }
      return true;
    };

    const out = {
      runts: [], stress: [], headingSkips: [], smallType: [],
      tables: [], counts: {},
    };

    // ---- Runts: a last line carrying one short word ------------------
    const textEls = [...document.querySelectorAll(
      'p, h1, h2, h3, h4, h5, li, td, figcaption, .lead, .fig__n')];
    let multiLine = 0;
    for (const el of textEls) {
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length < 12) continue;
      if (!isPlainFlow(el)) continue;
      const lines = lineBoxes(el);
      if (lines.length < 2) continue;
      multiLine++;
      const width = el.getBoundingClientRect().width || measure;
      const last = lines[lines.length - 1];
      const lastW = last.right - last.left;
      const words = txt.split(/\s+/);
      const lastWord = words[words.length - 1] || '';
      // A runt: the final line is under 18% of the measure AND is a
      // single short word. Both conditions, because a short final line
      // of three words is a normal, well-set paragraph ending.
      // Measure the last WORD rather than estimating a word count from
      // the line's width: if the final line is no wider than its final
      // word, that word is alone on the line and the paragraph has a
      // runt. Estimating from character counts guesses; this measures.
      if (lastW / width < 0.2 && lastWord.length <= 14) {
        const probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
        const ecs = getComputedStyle(el);
        probe.style.font = ecs.font || `${ecs.fontSize} ${ecs.fontFamily}`;
        probe.style.fontSize = ecs.fontSize;
        probe.style.fontFamily = ecs.fontFamily;
        probe.style.fontWeight = ecs.fontWeight;
        probe.style.letterSpacing = ecs.letterSpacing;
        probe.textContent = lastWord;
        document.body.appendChild(probe);
        const wordW = probe.getBoundingClientRect().width;
        probe.remove();
        if (wordW > 0 && lastW <= wordW * 1.35) {
          out.runts.push({
            tag: el.tagName.toLowerCase(),
            cls: typeof el.className === 'string' ? el.className : '',
            ratio: Math.round((lastW / width) * 1000) / 1000,
            lines: lines.length,
            text: txt.slice(0, 70),
            tail: words.slice(-3).join(' '),
          });
        }
      }

      // ---- Justification stress ------------------------------------
      // A justified line holding very few words is a line stretched to
      // the measure — the condition that opens rivers. Counted only on
      // elements that are actually justified.
      const cs = getComputedStyle(el);
      if (cs.textAlign === 'justify' && lines.length > 2) {
        const est = txt.length / lines.length;
        if (est > 0 && lines.length >= 3) {
          const perLine = txt.split(/\s+/).length / lines.length;
          if (perLine < 4.2) {
            out.stress.push({
              cls: (typeof el.className === 'string' && el.className) || el.tagName.toLowerCase(),
              wordsPerLine: Math.round(perLine * 10) / 10,
              lines: lines.length,
              text: txt.slice(0, 60),
            });
          }
        }
      }
    }
    out.counts.multiLine = multiLine;
    out.counts.textEls = textEls.length;

    // ---- Heading hierarchy -------------------------------------------
    const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    let prev = 0;
    for (const h of heads) {
      const lvl = Number(h.tagName[1]);
      if (prev && lvl > prev + 1) {
        out.headingSkips.push({ from: prev, to: lvl, text: (h.textContent || '').trim().slice(0, 50) });
      }
      prev = lvl;
    }
    out.counts.headings = heads.length;

    // ---- Type size floor ---------------------------------------------
    // 5.5 pt is the practical floor for printed apparatus; below it the
    // ink spreads on uncoated stock and the character closes up.
    const seen = new Map();
    for (const el of document.querySelectorAll('*')) {
      if (!el.textContent || !el.textContent.trim()) continue;
      const cs = getComputedStyle(el);
      const px = parseFloat(cs.fontSize);
      if (!px) continue;
      const pt = Math.round((px * 0.75) * 10) / 10;
      const key = `${(typeof el.className === 'string' && el.className)
        || el.getAttribute('class') || el.tagName.toLowerCase()}|${pt}`;
      if (pt < 5.5 && !seen.has(key)) {
        seen.set(key, true);
        out.smallType.push({
          cls: (typeof el.className === 'string' && el.className)
            || el.getAttribute('class') || el.tagName.toLowerCase(),
          pt,
          inSvg: !!el.closest('svg'),
          // Where it lives, so a finding can be acted on rather than
          // merely counted.
          owner: (el.closest('[class]') && (el.closest('[class]').getAttribute('class') || ''))
            || (el.closest('svg') && el.closest('svg').getAttribute('aria-label')) || '?',
          sample: (el.textContent || '').trim().slice(0, 24),
        });
      }
    }

    // ---- Table structure ---------------------------------------------
    for (const t of document.querySelectorAll('table')) {
      const hasHead = !!t.querySelector('thead th, tr th');
      const scoped = [...t.querySelectorAll('th')].every((th) => th.hasAttribute('scope'));
      out.tables.push({ cls: t.className || '(unclassed)', hasHead, scoped,
        rows: t.querySelectorAll('tr').length });
    }
    out.counts.tables = document.querySelectorAll('table').length;

    return out;
  }, MEASURE_PX);

  await browser.close();
  return findings;
}

// ---- Static audits, run over the source rather than the DOM ----------

/**
 * The visual-consistency audit: every stroke weight, tracking value and
 * corner radius the book actually uses, so outliers are visible.
 *
 * A design system is a claim that a finite set of values is in use. The
 * only way to know whether that claim is true is to count them.
 */
export function vocabulary(html) {
  const css = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
  const grab = (re, src = css) => {
    const m = new Map();
    for (const x of src.matchAll(re)) {
      const v = x[1].trim();
      m.set(v, (m.get(v) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  return {
    // Rule weights in the stylesheet.
    borders: grab(/border(?:-[a-z]+)?:\s*([\d.]+pt)/g),
    tracking: grab(/letter-spacing:\s*([-\d.]+em)/g),
    radii: grab(/border-radius:\s*([\d.]+[a-z]+)/g),
    // Stroke weights across every drawn ornament and figure in the body.
    strokes: grab(/stroke-width="([\d.]+)"/g, html),
  };
}
