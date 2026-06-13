# אישור QA — איתן

_קובץ זה מולא על ידי איתן לפני כל ריליס._

## גרסה
dependency vulns — npm audit remediation (3 צעדים, package.json + package-lock.json בלבד)

## תאריך QA
2026-06-14

## מה נבדק (smoke test — לא QA מלא)
שלושה שינויי dependency שאוליבר ביצע לוקאלית:
1. `npm audit fix` non-breaking → uuid + ws (transitive, lockfile בלבד)
2. הסרת `@xenova/transformers` מ-package.json → מחק את ה-CRITICAL (protobufjs RCE) + 3 High תלויים
3. next `16.2.1` → `16.2.9` (patch) → מחק 9 advisories של next + ה-high

**תוצאת audit:** 12 → 3 פגיעויות. Critical 1→0, High 4→0, Moderate 7→3.
3 שנותרו לא בני-תיקון בטוח: 2× @anthropic-ai/sdk (Memory Tool — לא בשימוש, Messages API בלבד) + postcss (transitive בתוך next, התיקון = הורדת next ל-9.3.3).

**אימות שביצעתי בעצמי:**
- `npx tsc --noEmit` → EXIT=0
- `npm run build` → EXIT=0, ✓ Compiled successfully (אפס warnings)
- **lockfile נקי**: אפס `@xenova/transformers`, אפס `protobufjs` ב-package-lock.json. `npm ls @xenova/transformers` → empty. (התיקייה ב-node_modules היא שארית מקומית בלבד — Vercel מריץ `npm ci` מה-lockfile → ה-CRITICAL לא חוזר בפרודקשן.)
- **טעינת אתר חיה** (dev server, port 3000): כל הבקשות 200 OK (chunks של next 16.2.9, layout+page, chat.js, CDN). אפס console errors, אפס failed requests.
- **שיחה מקצה-לקצה** (`/api/qa-quick?theorist=freud`): HTTP 200 ב-10.4s, 3 תורות, **ragChunks=3**, אפס דגלי תוכן. RAG עבד בלי @xenova/transformers — הוכחה שהחבילה הייתה מתה (embeddings מ-HuggingFace remote API).

## ממצאים
PASS — אין regression. הסרת החבילה לא שברה את RAG (3 chunks חזרו), next 16.2.9 לא שבר routing/runtime (route handler אמיתי החזיר 200 + שיחה תקינה). השינוי הוא package.json + lockfile בלבד, אפס קוד אפליקטיבי.
היקף: smoke טכני. QA פרודקשן מלא יורץ אחרי deploy (eitan-prod).

## החלטה
[x] מאשר — ניתן לדחוף לפרודקשן
[ ] לא מאשר — [סיבה]

## חתימה
איתן — 2026-06-14
