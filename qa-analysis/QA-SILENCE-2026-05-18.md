# QA Silence Detection — דוח מאוחד | 18.5.2026

_דוח זה מאחד את ממצאי שני הסבבים: הדוח הראשוני (15.5.2026) ודוח הביקורת של איתן (17-18.5.2026)._
_קובץ ישן: `silence-detection-2026-05-18.md` — שניים המסמכים כעת בקובץ הזה._

---

## רקע

זיהוי שתיקה (Silence Detection) פועל רק במצב סשן קליני (Situation A / `window.clinicalMode`).
לאחר 5 דקות של חוסר פעילות, המערכת שולחת הודעת שתיקה למודל ומקבלת תגובת תיאורטיקן.

---

## תרחישי QA — PASS / FAIL / CONCERN

| # | תרחיש | ממצא ראשוני | ממצא איתן | סטטוס סופי |
|---|--------|------------|-----------|------------|
| 1 | שתי הודעות assistant ברצף לפני silence | FAIL | PASS (תוקן בסבב 1) | PASS |
| 2 | silenceResponseSent נשאר true אחרי כישלון API | FAIL | PASS (תוקן בסבב 1) | PASS |
| 3 | thinking indicator נשאר לאחר reply ריק | CONCERN | PASS (תוקן בסבב 1) | PASS |
| 4 | restoreConversation לא מאפס silence state | לא נבדק | FAIL | תוקן — PASS |
| 5 | startFlow לא מפעיל timer אחרי opening message | לא נבדק | FAIL — באג ראשי | תוקן — PASS |
| 6 | reply ריק אחרי trim() נדחף להיסטוריה | לא נבדק | FAIL | תוקן — PASS |

---

## תיקונים שיושמו בסבב 1 (15.5.2026)

### באג A — שתי הודעות assistant ברצף

**קובץ:** `public/chat.js` → `handleSilence()`

**הבעיה:** הודעת ה-silence user לא נדחפה ל-`conversationHistory` לפני הקריאה ל-API. אם ההיסטוריה הסתיימה בהודעת assistant, ה-API קיבל רצף assistant → assistant — מה שמשבש הקשר ועלול לגרום לשגיאה.

**התיקון:**
```js
// Bug A fix: push silence user message to conversationHistory BEFORE API call
conversationHistory.push({ role: 'user', content: silenceContent });
const messages = conversationHistory.slice(-17).map(m => ({ role: m.role, content: m.content }));
```

**שורות:** 6173–6179

---

### באג C — silenceResponseSent קופא אחרי כישלון

**קובץ:** `public/chat.js` → `handleSilence()` → בלוק `catch`

**הבעיה:** הדגל `silenceResponseSent` מוצב ל-`true` בתחילת הפונקציה כדי למנוע כפילויות. כישלון API השאיר אותו `true` לצמיתות — מנע כל תגובת שתיקה עתידית עד לריענון.

**התיקון:**
```js
} catch (e) {
  removeThinking();
  silenceResponseSent = false; // Bug C fix: reset so silence detection works after failure
  console.warn('Silence response failed:', e.message);
}
```

**שורות:** 6207–6210

---

### תיקון נוסף — removeThinking חסר

**קובץ:** `public/chat.js`, שורה 6206

`if (!reply) return;` שונה ל: `if (!reply) { removeThinking(); return; }`

---

## תיקונים שיושמו בסבב 2 (18.5.2026) — ממצאי איתן

### באג B1 — restoreConversation לא מאפס silence state

**קובץ:** `public/chat.js` → `restoreConversation()`

**הבעיה:** כאשר המשתמש פתח שיחה שמורה, `silenceTimer` ו-`silenceResponseSent` לא אופסו. אם לפני כן נשלחה תגובת שתיקה (ו-`silenceResponseSent = true`), לא הייתה אפשרות לקבל תגובת שתיקה בשיחה החדשה.

**התיקון** (אחרי `closeMemory()`):
```js
clearTimeout(silenceTimer);
silenceResponseSent = false;
```

**שורות:** 5591–5592

---

### באג B2 — startFlow לא מפעיל silence timer (הבאג הראשי)

**קובץ:** `public/chat.js` → `startFlow()`

**הבעיה:** זהו ככל הנראה הבאג הראשי שמנע את פעולת Silence Detection. כאשר `startFlow` מציג את ה-opening message (הן בנתיב fixed והן ב-API fallback), ה-silence timer **לא** הופעל. כל ה-timer logic היה מוגדר רק בתוך `handleSendMessage` ובתוך אירועי keyup/input — לא ב-`startFlow`. מכיוון שה-opening message מגיע *לפני* כל הקלדת משתמש, ה-timer לא התחיל.

**התיקון** (נתיב fixed opening, אחרי `updateReflectionBtn()`):
```js
if (window.clinicalMode && !silenceResponseSent) {
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(handleSilence, SILENCE_THRESHOLD_MS);
}
```

**התיקון** (נתיב API fallback, בתוך `if (reply) { ... }`):
```js
if (window.clinicalMode && !silenceResponseSent) {
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(handleSilence, SILENCE_THRESHOLD_MS);
}
```

**שורות:** 706–709 (fixed), 744–747 (API fallback)

---

### באג B3 — reply ריק אחרי trim() נדחף להיסטוריה

**קובץ:** `public/chat.js` → `handleSilence()`, אחרי ה-`replace`

**הבעיה:** אם ה-API החזיר תגובה שכל תוכנה היה MEMORY blocks (שנמחקים ע"י ה-regex), לאחר `.trim()` ה-reply היה ריק. אך ה-guard הקיים (`if (!reply) { removeThinking(); return; }`) בדק את זה **לפני** ה-replace — לא אחריו. reply ריק נדחף להיסטוריה ונוצרה הודעת assistant ריקה.

**התיקון** (אחרי שורת ה-replace וה-trim):
```js
reply = reply.replace(/\[MEMORY[^\]]*\][^\n]*/g, '').trim();
if (!reply) { return; }
conversationHistory.push({ role: 'assistant', content: reply });
```

**שורות:** 6208–6209

---

## סיכום כולל

| באג | חומרה | מוצא על ידי | סטטוס |
|-----|-------|------------|--------|
| A — assistant→assistant ברצף | גבוה | דוח ראשוני | תוקן |
| C — silenceResponseSent קופא | בינוני | דוח ראשוני | תוקן |
| removeThinking חסר | נמוך | דוח ראשוני | תוקן |
| B1 — restoreConversation לא מאפס | בינוני | איתן | תוקן |
| B2 — startFlow לא מפעיל timer | **גבוה — באג ראשי** | איתן | תוקן |
| B3 — reply ריק אחרי trim() | נמוך | איתן | תוקן |

**מצב נוכחי:** 6 באגים יושמו. Silence Detection אמור לפעול כראוי בכל תרחישי הכניסה למצב סשן קליני.

---

_דוח נכתב על ידי: Eitan (QA) + ביקורת צוות_
_תאריך: 18.5.2026_
