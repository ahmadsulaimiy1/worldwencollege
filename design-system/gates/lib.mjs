/**
 * Shared machinery for the gates.
 *
 * The gates are the reason this directory is a design SYSTEM rather than
 * a stylesheet with opinions in the comments. SEB §30.17: a rule nobody
 * checks is a preference.
 *
 * These are deliberately simple text scanners rather than a full CSS
 * parser. A parser would be more correct and would also be a dependency,
 * a version, and a thing to keep working; the rules being checked are
 * lexical rules about what may appear in a declaration, and a scanner
 * checks those exactly. Where the scanner cannot be sure, it REPORTS
 * rather than passing — a gate that guesses in favour of the author is a
 * gate that does nothing.
 */

import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The tree the gates read.
 *
 * `SX_ROOT` overrides it, which exists so the gates can be TESTED — a
 * gate nobody has watched fail is a gate nobody knows works, and every
 * one of these would pass silently if its scanner were broken.
 * test/gates.test.mjs points them at a copy of `src/` with one defect
 * injected and asserts each gate finds it.
 */
export const root = process.env.SX_ROOT || join(dirname(fileURLToPath(import.meta.url)), '..');

/** Every stylesheet in `src/`, in a stable order. */
export async function stylesheets() {
  const dir = join(root, 'src');
  const names = (await readdir(dir)).filter((n) => n.endsWith('.css')).sort();
  return Promise.all(
    names.map(async (name) => ({
      name,
      path: relative(root, join(dir, name)),
      text: await readFile(join(dir, name), 'utf8'),
    })),
  );
}

/**
 * Strip comments before scanning.
 *
 * Comments in this system explain WHY a value was chosen, and they quote
 * the rejected values to do it. Scanning them produces failures for
 * prose, which trains everyone to ignore the gate.
 */
export function stripComments(css) {
  // Replaced with equal-length whitespace so line numbers survive.
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/**
 * Iterate declarations as `{ line, prop, value, raw }`.
 *
 * A small state machine rather than a line split, because the obvious
 * implementation is wrong in a way that is invisible: splitting each line
 * on `;` and taking the text before the first `:` treats
 *
 *     .sx-control--quiet { color: #7a7a7a; }
 *
 * as a declaration whose property is ".sx-control--quiet { color", which
 * fails the property-name check and is silently skipped. Every
 * single-line rule in the system — most of components.css — was being
 * scanned and discarded, while the gate reported a four-figure check
 * count and a green tick. test/gates.test.mjs found it by injecting a
 * hex colour the gate did not catch.
 *
 * The machine tracks strings, parens and braces, so a `:` in a media
 * query prelude, a `;` inside a data URI, and a `{` inside a string
 * cannot be mistaken for structure.
 */
export function* declarations(css) {
  const text = stripComments(css);
  let buffer = '';
  let line = 1;
  let startLine = 1;
  let quote = null;
  let depth = 0;          // parens

  const emit = () => {
    const at = buffer.indexOf(':');
    const prop = at < 0 ? '' : buffer.slice(0, at).trim();
    const value = at < 0 ? '' : buffer.slice(at + 1).trim();
    buffer = '';
    if (!prop || !value) return null;
    if (!/^-{0,2}[a-zA-Z][\w-]*$/.test(prop)) return null;    // at-rules, selectors
    return { line: startLine, prop, value, raw: `${prop}: ${value}` };
  };

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '\n') line += 1;

    if (quote) {
      buffer += c;
      if (c === quote && text[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; buffer += c; continue; }
    if (c === '(') depth += 1;
    if (c === ')') depth = Math.max(0, depth - 1);

    if (depth === 0 && c === '}') {
      // A block end may close a declaration that had no trailing
      // semicolon — `{ content: none }` is legal CSS and is exactly the
      // shape a hand-written one-liner takes.
      const decl = emit();
      if (decl) yield decl;
      startLine = line;
      continue;
    }
    if (depth === 0 && c === '{') {
      // A selector or at-rule prelude. Not a declaration.
      buffer = '';
      startLine = line;
      continue;
    }
    if (depth === 0 && c === ';') {
      const decl = emit();
      if (decl) yield decl;
      startLine = line;
      continue;
    }
    if (!buffer.trim() && /\s/.test(c)) { startLine = line; continue; }
    buffer += c;
  }

  // A final declaration with no trailing semicolon.
  const last = emit();
  if (last) yield last;
}

export function exemptions(css) {
  const found = new Map();
  const lines = css.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(/sx-gate-allow:\s*([\w-]+)\s*[—:-]?\s*(.*)$/);
    if (!m) continue;
    const gate = m[1];
    // The reason may run to the end of the comment, over several lines.
    let reason = m[2];
    let end = i;
    while (!lines[end].includes('*/') && end < lines.length - 1) {
      end += 1;
      reason += ` ${lines[end]}`;
    }
    reason = reason.replace(/\*\//g, '').replace(/\s+/g, ' ').trim();
    // It applies to the line the comment closes on (a trailing annotation)
    // and to the line after it (an annotation written above the rule).
    const note = { gate, reason };
    found.set(end + 1, note);
    found.set(end + 2, note);
  }
  return found;
}

export class Gate {
  constructor(name, article) {
    this.name = name;
    this.article = article;
    this.failures = [];
    this.exempted = [];
    this.checks = 0;
  }

  /**
   * Honour a per-line exemption, or don't.
   *
   * @returns {boolean} true when this line is exempt from THIS gate
   */
  exempt(map, line, where) {
    const note = map.get(line);
    if (!note || note.gate !== this.name) return false;
    this.exempted.push({ where, reason: note.reason || '(no reason given)' });
    return true;
  }

  check(ok, where, message) {
    this.checks += 1;
    if (!ok) this.failures.push({ where, message });
    return ok;
  }

  fail(where, message) {
    this.checks += 1;
    this.failures.push({ where, message });
  }

  report() {
    const head = `${this.name}  (${this.article})`;
    for (const e of this.exempted) {
      console.log(`  · exempt  ${e.where} — ${e.reason}`);
    }
    if (!this.failures.length) {
      const tail = this.exempted.length ? `, ${this.exempted.length} reasoned exemption(s)` : '';
      console.log(`✓ ${head} — ${this.checks} check(s), 0 failures${tail}`);
      return 0;
    }
    console.error(`✗ ${head} — ${this.failures.length} of ${this.checks} check(s) failed\n`);
    for (const f of this.failures) console.error(`  ${f.where}\n    ${f.message}`);
    console.error('');
    return 1;
  }
}

/* ── Colour, for the contrast gate ─────────────────────────────────── */

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** WCAG 2.1 relative luminance. */
export function luminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio, to two decimals. */
export function contrast(a, b) {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/**
 * The resolved palette, per register.
 *
 * Both registers are resolved separately and BOTH are checked. Checking
 * the dark one twice and declaring the system accessible is the standard
 * way a palette passes an audit it should have failed — half the tokens
 * mean something different on paper, which is the entire reason the
 * reading register exists.
 *
 * `var()` chains are followed, so `--sx-metal-text: var(--sx-aurum-lit)`
 * is checked as the colour it actually paints.
 */
export async function palette() {
  const css = stripComments(await readFile(join(root, 'src', 'tokens.css'), 'utf8'));

  const declared = (block) => {
    const map = new Map();
    for (const m of block.matchAll(/(--sx-[\w-]+)\s*:\s*([^;{}]+);/g)) {
      const value = m[2].trim();
      if (/^(#[0-9A-Fa-f]{3,8}|var\(--sx-[\w-]+\))$/.test(value) && !map.has(m[1])) map.set(m[1], value);
    }
    return map;
  };

  const rootBlock = css.match(/:root\s*{([\s\S]*?)\n}/);
  const base = declared(rootBlock ? rootBlock[1] : css);

  const readingBlock = css.match(/\[data-register='reading'\]\s*{([\s\S]*?)\n}/);
  const overrides = readingBlock ? declared(readingBlock[1]) : new Map();
  const reading = new Map([...base, ...overrides]);

  const resolve = (map) => {
    const out = new Map();
    for (const key of map.keys()) {
      let value = map.get(key);
      // Bounded, because a token that refers to itself should fail the
      // gate rather than hang it.
      for (let hops = 0; hops < 8 && value?.startsWith('var('); hops += 1) {
        value = map.get(value.slice(4, -1).trim());
      }
      if (typeof value === 'string' && value.startsWith('#')) out.set(key, value);
    }
    return out;
  };

  return { ceremonial: resolve(base), reading: resolve(reading) };
}
