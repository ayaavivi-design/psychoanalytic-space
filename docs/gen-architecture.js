// Architecture diagram generator for Between / Psychoanalytic Space
// Run: NODE_PATH=/opt/homebrew/lib/node_modules node docs/gen-architecture.js

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, PageOrientation, BorderStyle, WidthType, ShadingType,
  VerticalAlign
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─── Layout ─────────────────────────────────────────────────────────────────
// A4 landscape: pass portrait dims, docx-js swaps them
// Content width = 16838 − 1440 − 1440 = 13958 DXA
const PAGE_W  = 11906;
const PAGE_H  = 16838;
const MARGIN  = 1008; // ~0.7"
const CW      = PAGE_H - MARGIN * 2; // 14822 DXA content width

const FONT = 'Arial';

// ─── Colors ─────────────────────────────────────────────────────────────────
const C = {
  l1: { bg: 'D6EAF8', hdr: '1A5276', chip: '2E86C1' }, // Frontend  — blue
  l2: { bg: 'EAD5F5', hdr: '6C3483', chip: '8E44AD' }, // API       — purple
  l3: { bg: 'D5F5E3', hdr: '1A7A4A', chip: '27AE60' }, // AI Core   — green
  l4: { bg: 'FDEBD0', hdr: 'BA4A00', chip: 'E67E22' }, // Data      — orange
  l5: { bg: 'E5E8E8', hdr: '4D5656', chip: '717D7E' }, // Automation— gray
  l6: { bg: 'AED6F1', hdr: '1A2980', chip: '2980B9' }, // Infra     — navy
  white: 'FFFFFF',
  title: '1A2980',
  sub:   '5D6D7E',
  arrow: 'AAB7B8',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const nb = () => {
  const s = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return { top: s, bottom: s, left: s, right: s };
};
const sb = (color = 'CCCCCC', size = 4) => {
  const s = { style: BorderStyle.SINGLE, size, color };
  return { top: s, bottom: s, left: s, right: s };
};
const run = (text, opts = {}) => new TextRun({ text, font: FONT, ...opts });
const para = (children, opts = {}) =>
  new Paragraph({ children: Array.isArray(children) ? children : [children], spacing: { before: 0, after: 0 }, ...opts });

// Down-arrow separator between layers
const arrowPara = () =>
  para([run('▼', { size: 28, color: C.arrow })], {
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
  });

// ─── Component chip (small labeled box) ─────────────────────────────────────
function chip(label, chipColor, width = 2600) {
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: [width],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            shading: { fill: C.white, type: ShadingType.CLEAR },
            borders: sb(chipColor, 6),
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              para(run(label, { size: 17, color: chipColor, bold: true }), {
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ─── Layer box ──────────────────────────────────────────────────────────────
// contentRows: array of TableRow
function layerBox(label, colors, contentRows) {
  const headerRow = new TableRow({
    children: [
      new TableCell({
        width: { size: CW, type: WidthType.DXA },
        shading: { fill: colors.hdr, type: ShadingType.CLEAR },
        borders: nb(),
        margins: { top: 90, bottom: 90, left: 220, right: 220 },
        children: [
          para(run(label, { size: 22, bold: true, color: C.white })),
        ],
      }),
    ],
  });

  return new Table({
    width: { size: CW, type: WidthType.DXA },
    columnWidths: [CW],
    rows: [headerRow, ...contentRows],
  });
}

// A single full-width content row inside a layer
function contentRow(bgColor, children) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: CW, type: WidthType.DXA },
        shading: { fill: bgColor, type: ShadingType.CLEAR },
        borders: nb(),
        margins: { top: 140, bottom: 140, left: 220, right: 220 },
        children,
      }),
    ],
  });
}

// Chips in a row — embed using an inner table with many columns
function chipsRow(chips, bgColor, gap = 200) {
  const n = chips.length;
  const chipWidth = Math.floor((CW - 440 - gap * (n - 1)) / n);

  const cells = chips.map((c, i) => {
    const isLast = i === n - 1;
    return new TableCell({
      width: { size: chipWidth + (isLast ? (CW - 440 - gap * (n - 1) - chipWidth * n) : 0), type: WidthType.DXA },
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      borders: nb(),
      margins: { top: 0, bottom: 0, left: i === 0 ? 0 : gap / 2, right: isLast ? 0 : gap / 2 },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        para(run(c.label, { size: 17, color: c.color || '#000000', bold: false }), {
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  });

  const colWidths = chips.map((_, i) =>
    i === n - 1
      ? chipWidth + (CW - 440 - gap * (n - 1) - chipWidth * n)
      : chipWidth
  );

  // Build bordered chip cells properly
  const chipCells = chips.map((c, i) => {
    const cw = colWidths[i];
    return new TableCell({
      width: { size: cw, type: WidthType.DXA },
      shading: { fill: bgColor, type: ShadingType.CLEAR },
      borders: nb(),
      margins: { top: 0, bottom: 0, left: i === 0 ? 0 : 100, right: i === n - 1 ? 0 : 100 },
      children: [
        new Table({
          width: { size: cw - (i === 0 ? 0 : 200) - (i === n - 1 ? 0 : 200), type: WidthType.DXA },
          columnWidths: [cw - (i === 0 ? 0 : 200) - (i === n - 1 ? 0 : 200)],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: cw - (i === 0 ? 0 : 200) - (i === n - 1 ? 0 : 200), type: WidthType.DXA },
                  shading: { fill: C.white, type: ShadingType.CLEAR },
                  borders: sb(c.border || C.l1.chip, 6),
                  margins: { top: 70, bottom: 70, left: 100, right: 100 },
                  children: [
                    para(run(c.label, { size: 18, color: c.border || C.l1.chip, bold: true }), {
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
  });

  const innerRow = new TableRow({ children: chipCells });
  const innerTable = new Table({
    width: { size: CW - 440, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [innerRow],
  });

  return contentRow(bgColor, [innerTable]);
}

// ─── Build document ──────────────────────────────────────────────────────────
const sections = [];

// ── Layer 1: Frontend
const layer1 = layerBox('LAYER 1 — FRONTEND', C.l1, [
  chipsRow(
    [
      { label: 'Next.js 16 App Router', border: C.l1.chip },
      { label: 'React 19 UI', border: C.l1.chip },
      { label: 'chat.js (vanilla JS, ~5000 lines)', border: C.l1.chip },
    ],
    C.l1.bg
  ),
  contentRow(C.l1.bg, [
    para([
      run('Components:  ', { size: 17, color: C.l1.hdr, bold: true }),
      run('Theorist selector   ·   Flow buttons   ·   Sidebar tools   ·   Memory display', { size: 17, color: C.l1.hdr }),
    ]),
  ]),
]);

// ── Layer 2: API Routes
const layer2 = layerBox('LAYER 2 — API ROUTES  (Vercel Edge)', C.l2, [
  chipsRow(
    [
      { label: '/api/chat', border: C.l2.chip },
      { label: '/api/interpret-session', border: C.l2.chip },
      { label: '/api/rag-search', border: C.l2.chip },
      { label: '/api/web-search', border: C.l2.chip },
    ],
    C.l2.bg
  ),
  chipsRow(
    [
      { label: '/api/qa-quick', border: C.l2.chip },
      { label: '/api/judge-report', border: C.l2.chip },
      { label: '/api/karen-ux', border: C.l2.chip },
      { label: '/api/ceo-report', border: C.l2.chip },
    ],
    C.l2.bg
  ),
]);

// ── Layer 3: AI Core
const layer3 = layerBox('LAYER 3 — AI CORE', C.l3, [
  chipsRow(
    [
      { label: 'Claude Opus 4.6  →  8 Theorist Agents\nFreud · Klein · Winnicott · Ogden · Loewald · Bion · Kohut · Heimann', border: C.l3.chip },
      { label: 'Claude Haiku 4.5  →  Session interpretation · QA · Judge', border: C.l3.chip },
    ],
    C.l3.bg
  ),
  chipsRow(
    [
      { label: 'Output Validation Loop\n(single-question enforcement)', border: C.l3.chip },
      { label: 'RAG Engine\nHuggingFace MiniLM-L12 (384d)\nHybrid: 70% vector + 30% BM25', border: C.l3.chip },
    ],
    C.l3.bg
  ),
]);

// ── Layer 4: Data
const layer4 = layerBox('LAYER 4 — DATA', C.l4, [
  chipsRow(
    [
      { label: 'Supabase  ·  knowledge_chunks  (RAG corpus per theorist)', border: C.l4.chip },
      { label: 'Supabase  ·  user_conversations  (usage tracking)', border: C.l4.chip },
    ],
    C.l4.bg
  ),
]);

// ── Layer 5: Automation
const layer5 = layerBox('LAYER 5 — AUTOMATION', C.l5, [
  chipsRow(
    [
      { label: 'Karen UX — daily 08:00', border: C.l5.chip },
      { label: 'Eitan QA — daily 10:00', border: C.l5.chip },
      { label: 'Lia Judge — every 3 days', border: C.l5.chip },
      { label: 'Adam CEO memo — weekly', border: C.l5.chip },
      { label: 'Naval Board note — weekly', border: C.l5.chip },
    ],
    C.l5.bg
  ),
  contentRow(C.l5.bg, [
    para(run('All run as Vercel Native Crons · CCR Remote Routines — paused', { size: 16, color: C.l5.hdr, italics: true })),
  ]),
]);

// ── Layer 6: Infrastructure
const layer6 = layerBox('LAYER 6 — INFRASTRUCTURE', C.l6, [
  chipsRow(
    [
      { label: 'Vercel\nDeployment · Edge functions · Native crons', border: C.l6.chip },
      { label: 'GitHub\nSource repo · Agent reports\n(ux-reports/ · ceo-reports/ · board-notes/)', border: C.l6.chip },
      { label: 'Resend\nTransactional email\n(QA reports · Judge reports)', border: C.l6.chip },
    ],
    C.l6.bg
  ),
]);

// ─── Assemble ────────────────────────────────────────────────────────────────
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: {
            width: PAGE_W,
            height: PAGE_H,
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: [
        // Title
        para(run('Between — Technical Architecture', { size: 40, bold: true, color: C.title }), {
          spacing: { before: 0, after: 60 },
        }),
        para(run('Psychoanalytic Space  ·  May 2026', { size: 22, color: C.sub }), {
          spacing: { before: 0, after: 280 },
        }),

        // Layers with arrows
        layer1,
        arrowPara(),
        layer2,
        arrowPara(),
        layer3,
        arrowPara(),
        layer4,
        arrowPara(),
        layer5,
        arrowPara(),
        layer6,

        // Footer note
        para(run(''), { spacing: { before: 200, after: 0 } }),
        para(run('Generated by Between engineering team · All AI calls via Anthropic API · Infrastructure on Vercel', {
          size: 16, color: 'AAAAAA', italics: true,
        }), { alignment: AlignmentType.CENTER }),
      ],
    },
  ],
});

// ─── Write ───────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'architecture.docx');
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Saved: ${outPath}`);
}).catch(console.error);
