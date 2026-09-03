/**
 * The print edition. Renders the SAME block list to HTML and prints it
 * through Chromium, which gives embedded fonts, vector rules, selectable
 * text, a document outline and real print metadata.
 *
 * LibreOffice would have been the safer route — rendering the PDF from
 * the DOCX makes divergence impossible — but it cannot load any document
 * in this environment, including a one-line text file, so it is not an
 * option. Two renderers therefore read one content definition, and
 * tests/publication.test.mjs compares the text of both artefacts token by
 * token rather than trusting that they agree.
 */
import { FRONT, BODY } from './blocks.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function render(b) {
  switch (b.kind) {
    case 'halfTitle': return `<section class="half"><p>${esc(b.text)}</p></section>`;
    case 'title': return `<section class="title">
      <p class="ti">${esc(b.institution)}</p>
      <p class="tc">${esc(b.campus)}</p>
      <h1 class="tt">${b.lines.map((l) => `<span>${esc(l)}</span>`).join('')}</h1>
      <hr>
      <p class="ts">${esc(b.subtitle)}</p>
      <p class="te">${esc(b.edition)}</p>
      <p class="ten">${esc(b.editionNote)}</p>
      <p class="tp">${esc(b.press)}</p></section>`;
    case 'h1': return `<h1 id="${slug(b.text)}"${b.noBreak ? ' class="nobreak"' : ''}>${esc(b.text)}</h1>`;
    case 'h2': return `<h2 id="${slug(b.text)}">${esc(b.text)}</h2>`;
    case 'h3': return `<h3>${esc(b.text)}</h3>`;
    case 'label': return `<p class="label">${esc(b.text)}</p>`;
    case 'state': return `<p class="state s-${b.tone}">${esc(b.text)}</p>`;
    case 'p': {
      const c = [b.lead && 'lead', b.small && 'small', b.quote && 'quote',
        b.eyebrow && 'eyebrow', b.bold && 'b', b.italic && 'i'].filter(Boolean).join(' ');
      return `<p${c ? ` class="${c}"` : ''}>${esc(b.text)}</p>`;
    }
    case 'rule': return '<hr>';
    case 'bullets': return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'table': {
      const cols = b.widths.map((w) => `<col style="width:${w}%">`).join('');
      const head = `<tr>${b.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
      const rows = b.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
      return `<table><colgroup>${cols}</colgroup><thead>${head}</thead><tbody>${rows}</tbody></table>`;
    }
    case 'panel':
      return `<aside class="panel p-${b.tone}"><p class="pt">${esc(b.title)}</p>${
        b.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</aside>`;
    case 'toc': {
      // A real contents list, built from the blocks rather than left to a
      // field the PDF cannot resolve. Page numbers are deliberately
      // absent: this renderer does not know them, and a contents list
      // with wrong numbers is worse than one with none. The PDF's own
      // outline carries the navigation.
      const items = BODY.filter((x) => x.kind === 'h1')
        .map((x) => `<li><a href="#${slug(x.text)}">${esc(x.text)}</a></li>`).join('');
      return `<ul class="toc">${items}</ul>`;
    }
    case 'pageBreak': return '<div class="pb"></div>';
    default: throw new Error(`unknown block kind: ${b.kind}`);
  }
}

const CSS = `
@page { size: A4; margin: 22mm 25mm 20mm 28mm; }
@page :first { margin-top: 0; }
* { box-sizing: border-box; }
body {
  margin: 0; color: #1A1A1A;
  font-family: Cambria, "Nimbus Roman", Georgia, "Times New Roman", serif;
  font-size: 10.5pt; line-height: 1.62;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1, h2, h3 { color: #14264A; font-weight: 700; break-after: avoid; }
h1 { font-size: 20pt; line-height: 1.15; margin: 0 0 6pt; break-before: page; letter-spacing: -.01em; }
h1.nobreak, .half + h1 { break-before: auto; }
h2 { font-size: 14pt; margin: 20pt 0 7pt; }
h3 { font-size: 11.5pt; margin: 16pt 0 4pt; }
p { margin: 0 0 7pt; orphans: 3; widows: 3; }
hr { border: 0; border-top: .6pt solid #C9CEDA; margin: 2pt 0 11pt; }
.pb { break-after: page; }

.lead { font-size: 11.5pt; line-height: 1.6; }
.small { font-size: 8pt; color: #4B5768; font-family: Calibri, "Nimbus Sans", Arial, sans-serif; }
.b { font-weight: 700; }
.i { font-style: italic; }
.quote { font-size: 12pt; font-style: italic; color: #14264A; line-height: 1.55; margin: 0 0 10pt; }
.eyebrow { font-family: Calibri, "Nimbus Sans", Arial, sans-serif; font-size: 9pt; font-weight: 700; color: #9A7A38; }
.label {
  font-family: Calibri, "Nimbus Sans", Arial, sans-serif;
  font-size: 7.5pt; font-weight: 700; letter-spacing: .13em; text-transform: uppercase;
  color: #9A7A38; margin: 13pt 0 3pt; break-after: avoid;
}
.state {
  font-family: Calibri, "Nimbus Sans", Arial, sans-serif;
  font-size: 7.5pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin: 0 0 5pt;
}
.s-ok { color: #1E6B3A; } .s-warn { color: #8A6B2E; } .s-gap { color: #8C1F2F; }

ul { margin: 0 0 9pt; padding-left: 15pt; }
ul li { margin: 0 0 4pt; padding-left: 3pt; }
ul li::marker { color: #9A7A38; content: '– '; }

table { width: 100%; border-collapse: collapse; margin: 0 0 12pt; font-size: 9pt;
  font-family: Calibri, "Nimbus Sans", Arial, sans-serif; break-inside: auto; }
thead { display: table-header-group; }
th {
  background: #14264A; color: #fff; text-align: left; padding: 5pt 7pt;
  font-size: 7.5pt; letter-spacing: .06em; text-transform: uppercase; font-weight: 700;
}
td { padding: 5pt 7pt; border-bottom: .5pt solid #E2E6EE; vertical-align: top; line-height: 1.45; }
tr { break-inside: avoid; }

.panel {
  border-left: 2.6pt solid #14264A; background: #F4F6FA;
  padding: 9pt 12pt; margin: 0 0 12pt; break-inside: avoid;
}
.panel .pt {
  font-family: Calibri, "Nimbus Sans", Arial, sans-serif; font-size: 7.5pt; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; color: #14264A; margin: 0 0 5pt;
}
.panel p { font-size: 9.5pt; line-height: 1.55; margin: 0 0 5pt; }
.panel p:last-child { margin-bottom: 0; }
.p-warn { border-left-color: #9A7A38; background: #FBF6EA; }
.p-warn .pt { color: #8A6B2E; }
.p-gap { border-left-color: #A32638; background: #FBF0F1; }
.p-gap .pt { color: #8C1F2F; }

.toc { list-style: none; padding: 0; margin: 0; column-count: 1; }
.toc li { margin: 0 0 6pt; padding: 0 0 5pt; border-bottom: .4pt dotted #C9CEDA; }
.toc li::marker { content: ''; }
.toc a { color: #14264A; text-decoration: none; font-size: 10.5pt; }

/* Front matter */
.half { height: 247mm; display: flex; align-items: center; justify-content: center; text-align: center; break-after: page; }
.half p {
  font-family: Calibri, "Nimbus Sans", Arial, sans-serif; font-size: 11pt; font-weight: 700;
  letter-spacing: .22em; text-transform: uppercase; color: #14264A; max-width: 22em; line-height: 2;
}
.title { height: 247mm; display: flex; flex-direction: column; justify-content: center; text-align: center; break-after: page; }
.title .ti { font-family: Calibri, "Nimbus Sans", Arial, sans-serif; font-size: 9pt; font-weight: 700;
  letter-spacing: .3em; text-transform: uppercase; color: #9A7A38; margin: 0 0 3pt; }
.title .tc { font-style: italic; color: #4B5768; font-size: 10pt; margin: 0 0 34pt; }
.title .tt { break-before: auto; margin: 0 0 14pt; font-size: 33pt; line-height: 1.12; letter-spacing: -.015em; }
.title .tt span { display: block; }
.title hr { width: 42%; margin: 0 auto 12pt; border-top: .8pt solid #C9CEDA; }
.title .ts { font-style: italic; color: #4B5768; font-size: 12pt; margin: 0 0 60pt; }
.title .te { font-family: Calibri, "Nimbus Sans", Arial, sans-serif; font-size: 8.5pt; font-weight: 700;
  letter-spacing: .2em; text-transform: uppercase; color: #14264A; margin: 0 0 2pt; }
.title .ten { font-family: Calibri, "Nimbus Sans", Arial, sans-serif; font-size: 8.5pt; color: #4B5768; margin: 0 0 44pt; }
.title .tp { font-family: Calibri, "Nimbus Sans", Arial, sans-serif; font-size: 7.5pt;
  letter-spacing: .16em; text-transform: uppercase; color: #4B5768; margin: 0; }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>The International English Fluency Certificate — Curriculum, Award Architecture and Academic Framework</title>
<meta name="author" content="Worldwide English College">
<meta name="subject" content="English language qualification; curriculum; academic framework">
<meta name="keywords" content="IEFC, Worldwide English College, CEFR, English, curriculum, qualification">
<style>${CSS}</style></head><body>
${FRONT.map(render).join('\n')}
${BODY.map(render).join('\n')}
</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.print.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });

const out = path.join(ROOT, 'publication', 'IEFC Flagship Curriculum.pdf');
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,       // the panels and table heads carry meaning
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: `<div style="font:400 6.5pt Calibri,Arial,sans-serif;color:#8A90A0;
    width:100%;padding:0 25mm;text-align:right;letter-spacing:.08em;text-transform:uppercase;">
    The International English Fluency Certificate</div>`,
  footerTemplate: `<div style="font:400 7.5pt Calibri,Arial,sans-serif;color:#6B7280;
    width:100%;padding:0 25mm;text-align:center;"><span class="pageNumber"></span></div>`,
  margin: { top: '22mm', bottom: '20mm', left: '25mm', right: '25mm' },
  tagged: true,                // accessibility: a tagged PDF has structure
  outline: true,               // bookmarks, from the heading hierarchy
});
await browser.close();
console.log(`PDF   ${out}`);
