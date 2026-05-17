# Silence Detection — ניתוח באגים ותיקונים | 18.5.2026

## רקע

זיהוי שתיקה (Silence Detection) הוא פיצ'ר שפועל רק במצב סשן קליני (Situation A).
לאחר 5 דקות של חוסר פעילות בהקלדה, המערכת שולחת הודעת שתיקה למודל ומקבלת תגובה מהתיאורטיקן.

הבאגים זוהו בסשן דיבאג שהתקיים ב-15.5.2026 (worktree: `laughing-saha-753d7e`).
שני התיקונים אושרו ויושמו ב-18.5.2026 בענף הראשי (`public/chat.js`).

---

## באג A — שתי הודעות assistant ברצף

**קובץ:** `public/chat.js`, פונקציה `handleSilence()`

**מה היה:**
```js
// קוד ישן — שגוי
const recentHistory = conversationHistory.slice(-16);
const messages = [
  ...recentHistory.map(m => ({ role: m.role, content: m.content })),
  { role: 'user', content: '[Silence — the patient is present but not speaking]' }
];
// ה-push ל-conversationHistory קרה רק אחרי קבלת התגובה
```

**הבעיה:** ה-silence user message לא נדחף ל-`conversationHistory` לפני שנשלח ל-API. לכן אם `conversationHistory` הסתיים בהודעת assistant, ה-API קיבל רצף assistant → assistant — שמשבש את ההקשר ועלול לגרום לשגיאה.

**התיקון:**
```js
// Bug A fix: push silence user message to conversationHistory BEFORE API call
// so history never has two consecutive assistant messages
const silenceContent = window._lang === 'en'
  ? '[Silence — the patient is present but not speaking]'
  : '[שתיקה — המטופל נמצא אך לא מדבר כרגע]';
conversationHistory.push({ role: 'user', content: silenceContent });
const messages = conversationHistory.slice(-17).map(m => ({ role: m.role, content: m.content }));
```

**שורות בקוד:** 6173–6179

---

## באג C — silence detection מפסיק לעבוד אחרי כישלון

**קובץ:** `public/chat.js`, פונקציה `handleSilence()`, בלוק `catch`

**מה היה:**
```js
// קוד ישן — שגוי
} catch (e) {
  removeThinking();
  console.warn('Silence response failed:', e.message);
}
```

**הבעיה:** `silenceResponseSent` מוצב ל-`true` בתחילת הפונקציה (שורה 6165) כדי למנוע קריאות כפולות. אם הקריאה ל-API נכשלה, הדגל נשאר `true` לצמיתות — מה שמנע כל תגובת שתיקה עתידית עד לריענון הדף.

**התיקון:**
```js
} catch (e) {
  removeThinking();
  silenceResponseSent = false; // Bug C fix: reset so silence detection works after failure
  console.warn('Silence response failed:', e.message);
}
```

**שורות בקוד:** 6207–6210

---

## תיקון נוסף — removeThinking() חסר בנתיב empty reply

**קובץ:** `public/chat.js`, שורה 6196

**מה היה:**
```js
if (!reply) return;
```

**מה שונה:**
```js
if (!reply) { removeThinking(); return; }
```

**הסבר:** אם ה-API החזיר תגובה ריקה, ה-thinking indicator נשאר על המסך ללא הגבלה. תיקון קטן שנוסף במסגרת אותה סיבה.

---

## סיכום

| באג | חומרה | סטטוס |
|-----|-------|--------|
| A — שתי הודעות assistant ברצף | גבוה — שגיאת API | תוקן |
| C — silence לא מופעל אחרי כישלון | בינוני — פיצ'ר קופא | תוקן |
| removeThinking חסר | נמוך — UI תקוע | תוקן |

**מצב נוכחי:** שלושת התיקונים יושמו בענף הראשי. Silence detection אמור לעבוד כראוי במצב סשן קליני (Situation A).

---

_דוח נכתב על ידי: Eitan (QA)_
_תאריך: 18.5.2026_
