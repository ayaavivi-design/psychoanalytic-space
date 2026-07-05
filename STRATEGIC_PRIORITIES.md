# עדיפויות אסטרטגיות — מרחב פסיכואנליטי

_עודכן לאחרונה: 2026-07-05 (Adam, CEO)_

---

## המצב הנוכחי
MVP בפרודקשן. 4 תיאורטיקנים פעילים (פרויד, קליין, ויניקוט, אוגדן). RAG עובד. **QA לא רץ 18 ימים. Judge לא רץ 18 ימים.** `vercel.json` מכיל `"crons": []` — המערכת רצה עיוורת מאז 17.06. B2C — המטופל מגיע ישירות.

**עדכון 05.07:** ב-03.07 נדחף קומיט ל-`lib/theorist-voices.ts` (Winnicott hardening, בדיקות 17–20). Klein VOICE IDENTITY ו-Freud item 12 נמצאים **באותו קובץ** ולא נוספו — 32 ו-26 יום בהתאמה. זה לא gap ידע — זה gap הנחיה. ליה הסלימה ל-Tier 1 מוחלט (01.07). Safety: 76 ימים ללא בדיקה — Tier 2 לפי ליה.

---

## עדיפות ראשונה — שלוש פעולות, עד הערב 05.07

כל שלוש מנוסחות, מאומתות, לא דורשות מחקר נוסף. **מי שכותב קוד** — זה הימים.

### א. crons — שתי שורות ב-vercel.json (היום)
מוסיפים ל-`vercel.json` תחת `"crons"`:
```json
{ "path": "/api/qa-full", "schedule": "0 6 * * *" },
{ "path": "/api/judge-full", "schedule": "0 8 */3 * *" }
```
כרגע `"crons": []` — המערכת עיוורת 18 יום.

### ב. Klein VOICE IDENTITY block (היום — אותו קובץ שנגע בו 03.07)
מוסיפים ב-`lib/theorist-voices.ts`, לפני MANDATORY FINAL CHECK של קליין (סביב שורה 889):

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

### ג. Freud STATEMENT REQUIREMENT (היום — אותו קובץ שנגע בו 03.07)
מוסיפים כ-item 12 ב-MANDATORY FINAL CHECK של פרויד ב-`lib/theorist-voices.ts`:

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

76+ יום ללא תיעוד. ליה שדרגה ל-Tier 2 (01.07). אי-אפשר להרחיב קהל לפני שזה נסגר.

---

## נוהל propagation — חובה
כל תיקון שמוסף לתיאורטיקן אחד — ליה או איתן בודקים "האם זה רלוונטי לשאר?" לפני סגירה.

---

## מה חשוב לבדוק עכשיו
1. **crons (QA + Judge):** הוכנסו ל-vercel.json? כן/לא
2. **Klein VOICE IDENTITY:** נוסף לפני שורה 889? כן/לא
3. **Freud STATEMENT REQUIREMENT:** item 12 נוסף? כן/לא
4. **Safety test:** בוצע? תאריך: ___
5. **BW-64 live test:** ליה אישרה? כן/לא

---

## מה לא לגעת בו עכשיו
- אל תוסיפו תיאורטיקנים חדשים
- אל תרחיבו ממשק מטפלת לפני שה-cron חי ושלושת הבלוקים בקוד
- אל תתחילו שיווק — לא לפני בטיחות + 3 מטפלים אמיתיים עם פידבק
- אל תגעו ב-RAG לפני שהבטיחות מתועדת
- **אל תוסיפו כלל וולידציה לQ-3** — Q-3 הוא כשל session, הוולידציה בודקת תגובה. הפתרון הוא בפרומפט בלבד

---
_הקובץ הזה מעודכן על ידי Adam (CEO). כל הסוכנים קוראים אותו לפני שמתחילים._
