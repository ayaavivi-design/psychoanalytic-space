#!/usr/bin/env node
// token-lint — מדווח hex שלא קיים ב-docs/between-tokens.json
// כלי ידני (לא hook אוטומטי): npm run lint:tokens — להרצה לפני release.
// סורק רק משטחים שכפופים לדיזיין סיסטם. chat.js (legacy, ~105 hex) מוחרג בכוונה.
// אכיפה של UX-RULES.md כלל 1+2.

import { readFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url).pathname;
const FILES = ["app/globals.css", "app/page.tsx"];

// hex מאושרים = טוקנים מ-between-tokens.json + חריגים מתועדים
const tokensRaw = readFileSync(ROOT + "docs/between-tokens.json", "utf8");
const tokenHex = new Set(
  (tokensRaw.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())
);

// חריגים מאושרים (פלטת כלים קליניים פנימיים + גווני hover) — לא טוקנים, אך לגיטימיים
const APPROVED_EXCEPTIONS = new Set([
  "#5b3a5e", "#7a5080", "#8a6a95", // לבנדר — כלים פנימיים
  "#b0506a", "#c06060", "#c0a0a0", // hover / variant shades
]);

const allowed = new Set([...tokenHex, ...APPROVED_EXCEPTIONS]);

let violations = 0;
for (const rel of FILES) {
  let text;
  try {
    text = readFileSync(ROOT + rel, "utf8");
  } catch {
    continue;
  }
  const found = new Set(
    (text.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())
  );
  const bad = [...found].filter((h) => !allowed.has(h));
  if (bad.length) {
    console.log(`\n❌ ${rel} — hex לא מוכר (${bad.length}):`);
    for (const h of bad) console.log(`   ${h}`);
    violations += bad.length;
  }
}

if (violations === 0) {
  console.log("✅ token-lint: אין hex לא-מוכר ב-globals.css / page.tsx");
  process.exit(0);
} else {
  console.log(
    `\nסה"כ ${violations} hex לא-מוכרים. אם לגיטימי — הוסף ל-APPROVED_EXCEPTIONS בסקריפט. אחרת — מפה לטוקן ב-between-tokens.json.`
  );
  process.exit(1);
}
