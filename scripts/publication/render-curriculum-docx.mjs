/**
 * The editable companion to the flagship edition.
 *
 * Same curriculum, every lesson in full. DOCX cannot carry the print
 * edition's per-level colour identity, chapter openers or drop caps —
 * that limitation is real and is why the PDF is the flagship — but it
 * carries every word, properly styled and navigable, so a faculty can
 * edit the curriculum rather than only read it.
 */
import { buildCurriculum } from './curriculum.mjs';
import { paletteFor, STAGE_MARK, EMPHASIS_STAGES } from './design.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, TableOfContents,
  Header, Footer, PageNumber, convertInchesToTwip,
} from 'docx';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const C = buildCurriculum();
const SERIF = 'Cambria';
const SANS = 'Calibri';
const hex = (h) => h.replace('#', '').toUpperCase();
const KIND_LABEL = { reading: 'Lesson', quiz: 'Assessed Quiz', assignment: 'Assessed Assignment' };

const P = (text, o = {}) => new Paragraph({
  alignment: o.align,
  spacing: { before: o.before ?? 0, after: o.after ?? 110, line: o.line ?? 280 },
  indent: o.indent,
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
  border: o.leftBar ? { left: { style: BorderStyle.SINGLE, size: 12, color: o.leftBar, space: 8 } } : undefined,
  children: (Array.isArray(text) ? text : [{ t: text }]).map((r) => new TextRun({
    text: r.t, font: r.font || o.font || SERIF, size: r.size || o.size || 19,
    color: r.color || o.color || '1A1A1A', bold: r.bold ?? o.bold, italics: r.italic ?? o.italic,
    allCaps: r.caps ?? o.caps, characterSpacing: r.tracking ?? o.tracking,
  })),
});

function stageParas(s, pal) {
  const out = [];
  if (s.head) {
    const runs = [{ t: `${s.icon ? STAGE_MARK[s.icon] + '  ' : ''}${s.head}`, font: SANS, size: 15, bold: true, caps: true, tracking: 40, color: hex(pal.ink) }];
    if (s.timing) runs.push({ t: `   ${s.timing}`, font: SANS, size: 14, italic: true, color: '6B7280' });
    out.push(P(runs, { before: 130, after: 50,
      fill: s.icon && EMPHASIS_STAGES.has(s.icon) ? hex(pal.wash) : undefined }));
  }
  for (const p of s.parts) {
    if (p.type === 'dialogue') {
      out.push(P([
        { t: `${p.speaker}  `, font: SANS, size: 14, bold: true, color: hex(pal.mid) },
        { t: p.text },
      ], { leftBar: hex(pal.mid), indent: { left: 200 }, after: 40 }));
    } else if (p.type === 'item') {
      out.push(P([
        { t: `${p.marker}  `, font: SANS, size: 15, bold: true, color: hex(pal.mid) },
        { t: p.text },
      ], { indent: { left: 340, hanging: 200 }, after: 50 }));
    } else {
      out.push(P(p.text, { after: 80 }));
    }
  }
  return out;
}

function quizParas(les, pal) {
  const out = [];
  les.questions.forEach((q) => {
    out.push(P([
      { t: `${q.sequence}.  `, font: SANS, size: 15, bold: true, color: hex(pal.mid) },
      { t: q.prompt },
    ], { before: 90, after: 40, indent: { left: 300, hanging: 300 } }));
    q.choices.forEach((c, i) => {
      out.push(P([
        { t: `${String.fromCharCode(65 + i)}   `, font: SANS, size: 14, bold: true,
          color: i === q.correctIndex ? hex(pal.mid) : '8A90A0' },
        { t: c, font: SANS, size: 17, bold: i === q.correctIndex,
          color: i === q.correctIndex ? hex(pal.ink) : '333333' },
      ], { indent: { left: 620, hanging: 220 }, after: 20 }));
    });
  });
  out.push(P('ANSWER KEY', { font: SANS, size: 14, bold: true, caps: true, tracking: 50,
    color: hex(pal.ink), before: 140, after: 40, fill: hex(pal.wash) }));
  out.push(P(les.questions.map((q) => `${q.sequence} ${String.fromCharCode(65 + q.correctIndex)}`).join('    '),
    { font: SANS, size: 17, fill: hex(pal.wash), after: 140 }));
  return out;
}

const children = [];

// Title
children.push(P('', { after: 2400 }));
children.push(P('WORLDWIDE ENGLISH COLLEGE', { align: AlignmentType.CENTER, font: SANS, size: 17,
  color: '9A7A38', bold: true, caps: true, tracking: 200 }));
children.push(P('London Campus', { align: AlignmentType.CENTER, size: 19, color: '4B5768', italic: true, after: 620 }));
for (const l of ['The International', 'English Fluency', 'Certificate']) {
  children.push(P(l, { align: AlignmentType.CENTER, size: 50, color: '14264A', bold: true, after: 30, line: 560 }));
}
children.push(P('The Complete Curriculum', { align: AlignmentType.CENTER, size: 26, color: '14264A',
  italic: true, before: 220, after: 120 }));
children.push(P(`Six Levels · ${C.totals.modules} Modules · ${C.totals.lessons} Items · `
  + `${C.totals.questions} Assessment Questions`,
{ align: AlignmentType.CENTER, font: SANS, size: 16, color: '4B5768', after: 900 }));
children.push(P('EDITABLE EDITION', { align: AlignmentType.CENTER, font: SANS, size: 15,
  color: '14264A', bold: true, caps: true, tracking: 140 }));
children.push(P('Companion to the flagship print edition', { align: AlignmentType.CENTER,
  font: SANS, size: 15, color: '4B5768' }));
children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 140 },
  children: [new TextRun({ text: 'Contents', font: SERIF, size: 32, bold: true, color: '14264A' })] }));
children.push(new TableOfContents('Contents', { hyperlinks: true, headingStyleRange: '1-3' }));
children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 140 },
  children: [new TextRun({ text: 'Editorial Note', font: SERIF, size: 32, bold: true, color: '14264A' })] }));
children.push(P('This volume carries the curriculum itself — every authored lesson, every assessment '
  + 'question with its answer key, and every assignment brief with its rubric, set from the '
  + 'College\'s academic database.', { size: 21 }));
children.push(P(`It contains ${C.totals.lessons} authored items across ${C.totals.modules} modules `
  + `and six levels: ${C.totals.bodyWords.toLocaleString('en-GB')} words of lesson content and `
  + `${C.totals.questions} assessment questions. Every figure is counted at generation.`));
children.push(P(`The College's public materials state 720 learning units across the qualification. `
  + `That figure is not met: the module architecture is complete at ${C.totals.modules} modules, `
  + `but lesson-level depth within them is still being authored. This volume prints what exists `
  + `and does not pad it.`));
children.push(P('The print edition carries the same content with a full editorial design — per-level '
  + 'colour identity, chapter openers and typographic apparatus that DOCX cannot reproduce. This '
  + 'edition exists so the curriculum can be edited, not only read.'));

// The curriculum
for (const lv of C.levels) {
  const pal = paletteFor(lv.roman);
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 60 },
    children: [new TextRun({ text: `Level ${lv.roman} — ${lv.name}`, font: SERIF, size: 34,
      bold: true, color: hex(pal.ink) })],
  }));
  children.push(P(`${lv.awardTitle} · ${lv.postNominal} · CEFR ${lv.cefr} · ${lv.months} months`,
    { font: SANS, size: 17, bold: true, color: hex(pal.mid), after: 160 }));
  if (lv.graduateProfile) children.push(P(lv.graduateProfile, { size: 21, after: 120 }));
  if (lv.purpose) children.push(P(lv.purpose, { size: 19, italic: true, color: '4B5768',
    fill: hex(pal.wash), leftBar: hex(pal.mid), after: 200 }));

  for (const mod of lv.modules) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2, pageBreakBefore: true, spacing: { after: 40 },
      children: [new TextRun({ text: `Module ${mod.sequence} — ${mod.title}`, font: SERIF,
        size: 26, bold: true, color: hex(pal.ink) })],
    }));
    children.push(P(`Level ${lv.roman} · ${mod.lessons.length} items`,
      { font: SANS, size: 15, color: '6B7280', after: 160 }));

    for (const les of mod.lessons) {
      children.push(P(`${KIND_LABEL[les.kind] || 'Lesson'} ${lv.roman}.${mod.sequence}.${les.sequence}`,
        { font: SANS, size: 13, bold: true, caps: true, tracking: 60, color: hex(pal.mid), before: 200, after: 20 }));
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3, spacing: { after: 90 },
        children: [new TextRun({ text: les.title, font: SERIF, size: 22, bold: true, color: hex(pal.ink) })],
      }));
      for (const s of les.stages) children.push(...stageParas(s, pal));
      if (les.kind === 'quiz') children.push(...quizParas(les, pal));
    }
  }
}

const PAGE = {
  size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
  margin: { top: convertInchesToTwip(0.95), bottom: convertInchesToTwip(0.85),
    left: convertInchesToTwip(1.0), right: convertInchesToTwip(0.9) },
};

const doc = new Document({
  creator: 'Worldwide English College',
  title: 'The International English Fluency Certificate — The Complete Curriculum',
  description: `The complete IEFC curriculum: ${C.totals.lessons} authored items across `
    + `${C.totals.modules} modules and six levels.`,
  subject: 'English language curriculum; complete teaching programme',
  keywords: 'IEFC, Worldwide English College, CEFR, curriculum, lesson plans',
  styles: {
    default: {
      document: { run: { font: SERIF, size: 19 } },
      heading1: { run: { font: SERIF, size: 34, bold: true, color: '14264A' } },
      heading2: { run: { font: SERIF, size: 26, bold: true, color: '14264A' } },
      heading3: { run: { font: SERIF, size: 22, bold: true, color: '14264A' } },
    },
  },
  sections: [{
    properties: { page: PAGE },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT, spacing: { after: 160 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'D3D8E2', space: 6 } },
        children: [new TextRun({ text: 'IEFC · The Complete Curriculum', font: SANS, size: 13,
          color: '8A90A0', allCaps: true, characterSpacing: 40 })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: SANS, size: 15, color: '6B7280' })],
      })] }),
    },
    children,
  }],
});

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
const out = path.join(ROOT, 'publication', 'IEFC Complete Curriculum.docx');
writeFileSync(out, await Packer.toBuffer(doc));
console.log(`DOCX      ${out}`);
console.log(`  ${children.length} paragraphs · ${C.totals.lessons} items · ${C.totals.questions} questions`);
void Table; void TableRow; void TableCell; void WidthType;
