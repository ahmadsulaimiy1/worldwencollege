/** The editable edition. Renders the shared block list to DOCX. */
import { FRONT, BODY } from './blocks.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, TableOfContents,
  Header, Footer, PageNumber, LevelFormat, convertInchesToTwip,
} from 'docx';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const SERIF = 'Cambria';
const SANS = 'Calibri';
const INK = '14264A';
const GOLD = '9A7A38';
const SOFT = '4B5768';
const RULE = 'C9CEDA';
const TONE = { ok: '1E6B3A', warn: '8A6B2E', gap: '8C1F2F', neutral: INK };
const TONE_FILL = { warn: 'FBF6EA', gap: 'FBF0F1', neutral: 'F4F6FA' };

const CONTENT_DXA = 9000;

const P = (text, o = {}) => new Paragraph({
  alignment: o.align,
  spacing: { before: o.before ?? 0, after: o.after ?? 150, line: o.line ?? 300 },
  children: [new TextRun({
    text, font: o.font || SERIF, size: o.size || 21, color: o.color || '1A1A1A',
    bold: o.bold, italics: o.italic, allCaps: o.caps, characterSpacing: o.tracking,
  })],
});

const rule = () => new Paragraph({
  spacing: { before: 40, after: 220 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 } },
  children: [new TextRun({ text: '' })],
});

function panel(b) {
  const lines = [b.title, ...b.lines];
  return new Table({
    width: { size: CONTENT_DXA, type: WidthType.DXA },
    columnWidths: [CONTENT_DXA],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.SINGLE, size: 18, color: TONE[b.tone] || INK },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: CONTENT_DXA, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: TONE_FILL[b.tone] || TONE_FILL.neutral },
        margins: { top: 220, bottom: 220, left: 280, right: 260 },
        children: lines.map((l, i) => P(l, {
          size: i === 0 ? 19 : 20,
          bold: i === 0, caps: i === 0, tracking: i === 0 ? 50 : 0,
          font: i === 0 ? SANS : SERIF,
          color: i === 0 ? (TONE[b.tone] || INK) : '1A1A1A',
          after: i === lines.length - 1 ? 0 : 130, line: 290,
        })),
      })],
    })],
  });
}

function table(b) {
  const widths = b.widths.map((pct) => Math.round(CONTENT_DXA * pct / 100));
  // Percentages are authored; DXA is what Word and Google Docs both
  // honour. Rounding can drift a twip or two from the total, so the
  // last column absorbs the difference — a table whose columns do not
  // sum to its width renders ragged.
  const drift = CONTENT_DXA - widths.reduce((a, x) => a + x, 0);
  widths[widths.length - 1] += drift;

  const cell = (text, i, head) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: INK } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [P(String(text ?? ''), {
      font: SANS, size: head ? 16 : 18, after: 0, line: 260,
      bold: head, color: head ? 'FFFFFF' : '1A1A1A', caps: head, tracking: head ? 30 : 0,
    })],
  });

  return new Table({
    width: { size: CONTENT_DXA, type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: RULE },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({ tableHeader: true, children: b.headers.map((h, i) => cell(h, i, true)) }),
      ...b.rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}

function render(b) {
  switch (b.kind) {
    case 'halfTitle':
      return [P('', { after: 2800 }), P(b.text, {
        align: AlignmentType.CENTER, font: SANS, size: 22, color: INK,
        bold: true, caps: true, tracking: 130,
      })];
    case 'title':
      return [
        P('', { after: 1800 }),
        P(b.institution, { align: AlignmentType.CENTER, font: SANS, size: 18, color: GOLD, bold: true, caps: true, tracking: 180 }),
        P(b.campus, { align: AlignmentType.CENTER, font: SERIF, size: 20, color: SOFT, italic: true, after: 720 }),
        ...b.lines.map((l, i) => P(l, {
          align: AlignmentType.CENTER, font: SERIF, size: 52, color: INK, bold: true,
          after: i === b.lines.length - 1 ? 280 : 40, line: 580,
        })),
        rule(),
        P(b.subtitle, { align: AlignmentType.CENTER, font: SERIF, size: 24, color: SOFT, italic: true, after: 1500 }),
        P(b.edition, { align: AlignmentType.CENTER, font: SANS, size: 17, color: INK, bold: true, caps: true, tracking: 120 }),
        P(b.editionNote, { align: AlignmentType.CENTER, font: SANS, size: 17, color: SOFT, after: 900 }),
        P(b.press, { align: AlignmentType.CENTER, font: SANS, size: 15, color: SOFT, caps: true, tracking: 90 }),
      ];
    case 'h1':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: !b.noBreak,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: b.text, font: SERIF, size: 32, bold: true, color: INK })],
      })];
    case 'h2':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_2, spacing: { before: 380, after: 150 },
        children: [new TextRun({ text: b.text, font: SERIF, size: 26, bold: true, color: INK })],
      })];
    case 'h3':
      return [new Paragraph({
        heading: HeadingLevel.HEADING_3, spacing: { before: 320, after: 80 },
        children: [new TextRun({ text: b.text, font: SERIF, size: 22, bold: true, color: INK })],
      })];
    case 'label':
      return [P(b.text, { font: SANS, size: 15, color: GOLD, bold: true, caps: true, tracking: 60, before: 260, after: 70 })];
    case 'state':
      return [P(b.text, { font: SANS, size: 15, bold: true, caps: true, tracking: 60, color: TONE[b.tone], after: 100 })];
    case 'p':
      return [P(b.text, {
        size: b.lead ? 23 : (b.small ? 16 : 21),
        color: b.small ? SOFT : (b.quote || b.eyebrow ? INK : '1A1A1A'),
        font: b.small || b.eyebrow ? SANS : SERIF,
        italic: b.italic || b.quote, bold: b.bold || b.eyebrow,
        line: b.quote ? 340 : 300, after: b.quote ? 200 : 150,
      })];
    case 'rule': return [rule()];
    case 'bullets':
      return b.items.map((x) => new Paragraph({
        numbering: { reference: 'wec-bullets', level: 0 },
        spacing: { after: 100, line: 290 },
        children: [new TextRun({ text: x, font: SERIF, size: 21 })],
      }));
    case 'table': return [table(b), P('', { after: 200 })];
    case 'panel': return [panel(b), P('', { after: 220 })];
    case 'toc': return [new TableOfContents('Contents', { hyperlinks: true, headingStyleRange: '1-2' })];
    case 'pageBreak': return [new Paragraph({ children: [new PageBreak()] })];
    default: throw new Error(`unknown block kind: ${b.kind}`);
  }
}

const PAGE = {
  size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
  margin: {
    top: convertInchesToTwip(1.1), bottom: convertInchesToTwip(1.0),
    left: convertInchesToTwip(1.15), right: convertInchesToTwip(1.0),
  },
};

const doc = new Document({
  creator: 'Worldwide English College',
  title: 'The International English Fluency Certificate — Curriculum, Award Architecture and Academic Framework',
  description: 'The reference edition of the IEFC curriculum and academic framework, generated from the College\'s academic database.',
  subject: 'English language qualification; curriculum; academic framework',
  keywords: 'IEFC, Worldwide English College, CEFR, English, curriculum, qualification',
  numbering: {
    config: [{
      reference: 'wec-bullets',
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 440, hanging: 250 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: SERIF, size: 21 } },
      heading1: { run: { font: SERIF, size: 32, bold: true, color: INK } },
      heading2: { run: { font: SERIF, size: 26, bold: true, color: INK } },
      heading3: { run: { font: SERIF, size: 22, bold: true, color: INK } },
    },
  },
  sections: [
    { properties: { page: PAGE }, children: FRONT.flatMap(render) },
    {
      properties: { page: PAGE },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 220 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE, space: 6 } },
            children: [new TextRun({
              text: 'The International English Fluency Certificate',
              font: SANS, size: 14, color: SOFT, allCaps: true, characterSpacing: 40,
            })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: 16, color: SOFT })],
          })],
        }),
      },
      children: BODY.flatMap(render),
    },
  ],
});

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
const out = path.join(ROOT, 'publication', 'IEFC Flagship Curriculum.docx');
writeFileSync(out, await Packer.toBuffer(doc));
console.log(`DOCX  ${out}`);
