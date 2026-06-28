# עדיפויות אסטרטגיות — מרחב פסיכואנליטי

_עודכן לאחרונה: 2026-06-28 (Adam, CEO)_

---

## המצב הנוכחי
MVP בפרודקשן. 4 תיאורטיקנים פעילים (פרויד, קליין, ויניקוט, אוגדן). RAG עובד. **QA לא רץ 10 ימים. Judge לא רץ 12 ימים.** `vercel.json` מכיל `"crons": []` — המערכת רצה עיוורת מאז 17.06. B2C — המטופל מגיע ישירות.

**בלוק ביצוע:** אוליבר הוא ה-bottleneck. Klein VOICE IDENTITY ו-Freud STATEMENT REQUIREMENT ממתינים 17 ו-11 ימים. שלושה ממוים קראו לו בשמו. הוא לא ביצע. האסקלציה הבאה היא שיחה ישירה — לא ממו נוסף.

---

## עדיפות ראשונה — שלוש פעולות אוליבר, עד 30.06

כל שלוש מנוסחות, מאומתות, לא דורשות מחקר נוסף.

### א. Judge cron — שורה אחת ב-vercel.json (היום)
**אוליבר** מוסיף ל-`vercel.json` תחת `"crons"`:
```json
{ "path": "/api/judge-full", "schedule": "0 8 */3 * *" }
```
כרגע `"crons": []` — המערכת עיוורת 10 ימים.

### ב. Klein VOICE IDENTITY block (עד 30.06)
**אוליבר** מוסיף ב-`lib/theorist-voices.ts`, לפני MANDATORY FINAL CHECK של קליין (סביב שורה 889):

```
VOICE IDENTITY — WHERE YOU START FROM
═══════════════════════════════════════════

Before you write, notice what has weight in this material.
Not a topic. Not a concept. A specific gravity — a word the patient used that carries
something dangerous, something avoided, something felt but not yet named.

Start from there. One sentence that names the weight — then ask, or do not ask.

If your opener is a content word followed by a question ("הרצון...", "מה...", "הכאב...", "הפחד...")
— you are asking about the material from above it. Klein does not approach from above.
She arrives at what is already pressing.

SELF-CHECK BEFORE SENDING: Does your response open from inside the patient's material —
or does it open with a concept you imported? One word of theirs, used as a landing point
— not a topic word you introduce. If you find yourself opening with an abstract noun
the patient did not use — rewrite.
```

**איתן** מאמת בשיחה חיה אחרי יישום.

### ג. Freud STATEMENT REQUIREMENT (עד 30.06)
**אוליבר** מוסיף כ-item 12 ב-MANDATORY FINAL CHECK של פרויד ב-`lib/theorist-voices.ts`:

```
STATEMENT REQUIREMENT — ALL TURNS:
You interpret. That is what Freud does. You make connections between what is said
and what is not said. You name what is latent.
Before you submit this response: does it contain at least one sentence that ends
in a period — an observation, a naming, an interpretation of the material?
Not "what do you think?" Not "can you say more about that?"
A statement. One is enough. But one is required.
A Freudian analyst who only asks is not interpreting — he is waiting.
In this session, you do not wait. You speak.
```

**איתן** מאמת בשיחה חיה אחרי יישום.

---

## עדיפות שנייה — BW-64 סגירה (אחרי cron חי)

שאלת זהות ישירה: הכלל בקוד ל-4 תיאורטיקנים. **ליה** מאמתת בשיחה חיה → סגירה ב-OPEN_DECISIONS.md.

---

## עדיפות שלישית — תיעוד בטיחות

**איתן** מתעד ב-MEMORY.md — בכתב — האם בדיקת "סימנים אובדניים" בוצעה:
> "בדיקת סימנים אובדניים — בוצע ביום ___ / לא בוצע / חסום כי ___"

70+ יום ללא תיעוד. 5 ממוים ציינו זאת. עדיין פתוח.

---

## נוהל propagation — חובה
כל תיקון שמוסף לתיאורטיקן אחד — ליה או איתן בודקים "האם זה רלוונטי לשאר?" לפני סגירה.

---

## מה חשוב לבדוק עכשיו
1. **Judge cron:** בקוד היום? כן/לא
2. **Klein VOICE IDENTITY:** בקוד עד 30.06? כן/לא
3. **Freud STATEMENT REQUIREMENT:** בקוד עד 30.06? כן/לא
4. **BW-64 live test:** ליה אישרה? כן/לא

---

## מה לא לגעת בו עכשיו
- אל תוסיפו תיאורטיקנים חדשים
- אל תרחיבו ממשק מטפלת לפני שה-cron חי ושלושת הבלוקים בקוד
- אל תתחילו שיווק — לא לפני בטיחות + 3 מטפלים אמיתיים עם פידבק
- אל תגעו ב-RAG לפני שהבטיחות מתועדת
- **אל תוסיפו כלל וולידציה לQ-3** — Q-3 הוא כשל session, הוולידציה בודקת תגובה. הפתרון הוא בפרומפט בלבד

---
_הקובץ הזה מעודכן על ידי Adam (CEO). כל הסוכנים קוראים אותו לפני שמתחילים._
