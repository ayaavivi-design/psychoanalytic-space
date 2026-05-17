"use strict";

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  PageOrientation,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageBreak,
  HeadingLevel,
} = require("/opt/homebrew/lib/node_modules/docx");

const fs = require("fs");
const path = require("path");

// ─── Constants ────────────────────────────────────────────────────────────────

// A4 landscape in DXA (1 DXA = 1/1440 inch = 1/20 pt)
// docx-js takes portrait dimensions + orientation flag, then swaps internally.
const PAGE_W = 11906; // A4 short side (portrait width)
const PAGE_H = 16838; // A4 long side (portrait height)
const MARGIN = 720;   // ~0.5 inch

// After orientation swap, actual rendered width = PAGE_H − 2×MARGIN = 15398 DXA
const CONTENT_W = PAGE_H - MARGIN * 2; // 15398

// Colors (without #)
const BG        = "fdf8f6";
const TITLE_CLR = "2d2420";
const MUTED_CLR = "a8948e";
const ACCENT    = "c4607a";
const WHITE     = "FFFFFF";

// Sizes (half-points: 1pt = 2 half-pts)
const SZ_MAIN  = 96;  // 48pt — title-slide main title
const SZ_SLIDE = 52;  // 26pt — content-slide title
const SZ_BODY  = 30;  // 15pt — body
const SZ_SMALL = 20;  // 10pt — slide number
const SZ_SUB   = 32;  // 16pt — subtitle / tagline

// Font
const SERIF  = "Times New Roman"; // Cormorant fallback
const SANS   = "Arial";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// RTL-safe paragraph options (apply to every Hebrew paragraph)
const RTL = { bidirectional: true };

function slideNum(n) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 0, after: 200 },
    ...RTL,
    children: [
      new TextRun({
        text: String(n).padStart(2, "0"),
        font: SANS,
        size: SZ_SMALL,
        color: MUTED_CLR,
        bold: false,
        rightToLeft: true,
      }),
    ],
  });
}

// Large vertical spacer paragraph
function spacer(lines = 1) {
  return new Paragraph({
    children: [],
    spacing: { before: 0, after: 300 * lines },
    ...RTL,
  });
}

// Divider line (1pt, accent color)
function rule() {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: ACCENT, space: 1 },
    },
    spacing: { before: 120, after: 320 },
    ...RTL,
    children: [],
  });
}

// ─── Slide builders ───────────────────────────────────────────────────────────

/**
 * Type A — Title slide
 * Large centered title + subtitle below, lots of whitespace
 */
function slideA({ num, title, subtitle, note }) {
  const paras = [];
  paras.push(slideNum(num));
  // Big top padding
  paras.push(spacer(4));

  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      bidirectional: true,
      children: [
        new TextRun({
          text: title,
          font: SERIF,
          size: SZ_MAIN,
          color: TITLE_CLR,
          italics: true,
          bold: false,
          rightToLeft: true,
        }),
      ],
    })
  );

  if (subtitle) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 300 },
        bidirectional: true,
        children: [
          new TextRun({
            text: subtitle,
            font: SANS,
            size: SZ_SUB,
            color: MUTED_CLR,
            bold: false,
            rightToLeft: true,
          }),
        ],
      })
    );
  }

  if (note) {
    paras.push(spacer(1));
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        bidirectional: true,
        children: [
          new TextRun({
            text: note,
            font: SANS,
            size: SZ_SMALL,
            color: MUTED_CLR,
            italics: true,
            rightToLeft: true,
          }),
        ],
      })
    );
  }

  return paras;
}

/**
 * Type B — Content slide
 * Slide title right-aligned, body below, optional accent word highlighted inline
 */
function slideB({ num, title, titleAccent, body, bodyAccentWord }) {
  const paras = [];
  paras.push(slideNum(num));
  paras.push(spacer(2));

  const rtlRun = (text, extra = {}) =>
    new TextRun({ text, font: SERIF, size: SZ_SLIDE, color: TITLE_CLR, bold: false, rightToLeft: true, ...extra });

  // Title — may contain an accent word
  if (titleAccent) {
    const idx = title.indexOf(titleAccent);
    const before = idx >= 0 ? title.slice(0, idx) : title;
    const after  = idx >= 0 ? title.slice(idx + titleAccent.length) : "";

    const runs = [];
    if (before) runs.push(rtlRun(before));
    runs.push(rtlRun(titleAccent, { color: ACCENT }));
    if (after) runs.push(rtlRun(after));

    paras.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 200 },
        bidirectional: true,
        children: runs,
      })
    );
  } else {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 200 },
        bidirectional: true,
        children: [rtlRun(title)],
      })
    );
  }

  paras.push(rule());

  if (body) {
    const bodyRun = (text, extra = {}) =>
      new TextRun({ text, font: SANS, size: SZ_BODY, color: TITLE_CLR, rightToLeft: true, ...extra });

    let runs = [];
    if (bodyAccentWord && body.includes(bodyAccentWord)) {
      const idx = body.indexOf(bodyAccentWord);
      const pre  = body.slice(0, idx);
      const post = body.slice(idx + bodyAccentWord.length);
      if (pre)  runs.push(bodyRun(pre));
      runs.push(bodyRun(bodyAccentWord, { color: ACCENT }));
      if (post) runs.push(bodyRun(post));
    } else {
      runs = [bodyRun(body)];
    }

    paras.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 0, after: 0 },
        bidirectional: true,
        children: runs,
      })
    );
  }

  return paras;
}

/**
 * Type C — Demo slide
 * Title, then a placeholder bordered box (1-row table), then caption
 */
function slideC({ num, title, subtitle, caption }) {
  const paras = [];
  paras.push(slideNum(num));
  paras.push(spacer(1));

  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      bidirectional: true,
      children: [
        new TextRun({ text: title, font: SERIF, size: SZ_SLIDE, color: MUTED_CLR, italics: true, rightToLeft: true }),
      ],
    })
  );

  if (subtitle) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 400 },
        bidirectional: true,
        children: [
          new TextRun({ text: subtitle, font: SANS, size: SZ_BODY, color: MUTED_CLR, rightToLeft: true }),
        ],
      })
    );
  }

  // Placeholder box — table with a single bordered cell
  const boxBorder = { style: BorderStyle.SINGLE, size: 8, color: ACCENT };
  const boxTable = new Table({
    width: { size: Math.floor(CONTENT_W * 0.7), type: WidthType.DXA },
    columnWidths: [Math.floor(CONTENT_W * 0.7)],
    rows: [
      new TableRow({
        height: { value: 3600, rule: "exact" },
        children: [
          new TableCell({
            borders: { top: boxBorder, bottom: boxBorder, left: boxBorder, right: boxBorder },
            width: { size: Math.floor(CONTENT_W * 0.7), type: WidthType.DXA },
            shading: { fill: "f9f3f0", type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 160, bottom: 160, left: 240, right: 240 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "▶", font: SANS, size: 60, color: ACCENT }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Wrap table in a centered paragraph container
  paras.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [],
    })
  );
  // docx tables are block-level; we push them after the paragraph
  paras.push(boxTable);
  paras.push(spacer(1));

  if (caption) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        bidirectional: true,
        children: [
          new TextRun({ text: caption, font: SANS, size: SZ_SMALL, color: MUTED_CLR, italics: true, rightToLeft: true }),
        ],
      })
    );
  }

  return paras;
}

// ─── Build all 10 slides ──────────────────────────────────────────────────────

const slides = [
  // Slide 1 — Opening
  slideA({
    num: 1,
    title: "הפגישה נגמרת",
    subtitle: "מה קורה לתהליך בין הפגישה לפגישה הבאה?",
  }),

  // Slide 2 — The Problem
  slideB({
    num: 2,
    title: "הזמן שבין",
    body: "מה שעלה בחדר ולא הספיק להבשיל — נעלם. לא כי המטופל לא רוצה לעבד. כי אין לאן.",
    bodyAccentWord: "נעלם",
  }),

  // Slide 3 — The Product
  slideA({
    num: 3,
    title: "Between",
    subtitle: "מרחב שיחה למטופלים בין פגישות — לעיבוד מה שעלה, לחשיבה על מה שיגיע.",
  }),

  // Slide 4 — Differentiation (money slide)
  slideB({
    num: 4,
    title: "לא AI שיודע — נוכחויות",
    titleAccent: "נוכחויות",
    body: "פרויד לא קוהוט. קליין לא ויניקוט. כל קול נבנה לעומק מהטקסטים המקוריים — לא ידע כללי, קול ספציפי.",
  }),

  // Slide 5 — Demo
  slideC({
    num: 5,
    title: "[הדמו]",
    subtitle: "שיחה אמיתית — חיה או מוקלטת",
    caption: "שיחה אמיתית עם ויניקוט — עיבוד חומר מהפגישה האחרונה",
  }),

  // Slide 6 — Trust
  slideB({
    num: 6,
    title: "מה שמגן על הטיפול",
    body: "Between לא יכול לפעול בלי מטפל. הגבולות לא רק משפטיים — הם ארכיטקטוניים.",
    bodyAccentWord: "ארכיטקטוניים",
  }),

  // Slide 7 — GTM
  slideB({
    num: 7,
    title: "הדרך לשוק",
    body: "מטפל שמאמין → מטפל ממליץ → מטופל משתמש. לא מודעות. לא App Store. אמון.",
    bodyAccentWord: "אמון",
  }),

  // Slide 8 — Defensibility
  slideB({
    num: 8,
    title: "הנכס שלא ניתן לשכפול",
    body: "כל קול נבנה בנפרד. ChatGPT יכול לספר על ויניקוט — לא להיות ויניקוט בשיחה.",
  }),

  // Slide 9 — Traction
  slideB({
    num: 9,
    title: "היכן אנחנו עומדים",
    body: "4 תיאורטיקנים חיים, QA יומי אוטומטי, Safety interceptor מאומת — MVP בפרודקשן.",
    bodyAccentWord: "בפרודקשן",
  }),

  // Slide 10 — CTA
  slideA({
    num: 10,
    title: "הצעד הבא",
    subtitle: '"אני רוצה שתנסה שבוע. תגיד לי מה הרגשת."',
    note: "[למשקיע — TBD]",
  }),
];

// ─── Assemble sections (one section per slide = one page) ────────────────────

const sections = slides.map((slideContent, i) => {
  const isFirst = i === 0;

  // Flatten: slideContent may contain Tables (non-Paragraph) mixed with Paragraphs
  const children = slideContent; // already an array of Paragraph|Table

  return {
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
    children,
  };
});

// ─── Create Document ──────────────────────────────────────────────────────────

const doc = new Document({
  // Right-to-left document
  styles: {
    default: {
      document: {
        run: {
          font: SANS,
          size: SZ_BODY,
          color: TITLE_CLR,
        },
        paragraph: {
          bidirectional: true,
        },
      },
    },
  },
  sections,
});

// ─── Write file ───────────────────────────────────────────────────────────────

const OUT = "/Users/ayaaviviharel/psychoanalytic-space/bizdev/presentation-2026-05.docx";

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  const stats = fs.statSync(OUT);
  console.log("✓ File written:", OUT);
  console.log("  Size:", (stats.size / 1024).toFixed(1), "KB");
}).catch((err) => {
  console.error("✗ Error:", err.message);
  process.exit(1);
});
