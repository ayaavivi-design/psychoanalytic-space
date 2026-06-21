# עדיפויות אסטרטגיות — מרחב פסיכואנליטי

_עודכן לאחרונה: 2026-06-21 (Adam, CEO)_

---

## המצב הנוכחי
MVP בפרודקשן. 4 תיאורטיקנים פעילים בQA (פרויד, קליין, ויניקוט, אוגדן). RAG עובד. QA יומי רץ. ניוזלטר שבועי. לא מחייבים תשלום. לא מפרסמים. B2C — המטופל מגיע ישירות.

**צינור המשוב שבור:** ליה כותבת המלצות ל-`judge-analysis/` — הן לא מגיעות לקוד. שני תיקונים ממתינים 8–14 יום. Judge cron ריק — ה-judge לא רץ אוטומטית. בדיקת "סימנים אובדניים" לא תועדה 70+ יום.

---

## עדיפות ראשונה — שלושה תיקונים, השבוע

כל שלושה מנוסחים, מאומתים, לא דורשים מחקר נוסף.

### א. Klein VOICE IDENTITY block (14 ימים ממתין — לא בקוד, אומת ע"י ליה 19.06)
**אוליבר** מוסיף ב-`lib/theorist-voices.ts`, לפני MANDATORY FINAL CHECK של קליין:

```
VOICE IDENTITY — WHERE YOU START FROM
═══════════════════════════════════════════

Before you write, notice what has weight in this material.
Not a topic. Not a concept. A specific gravity — a word the patient used that carries
something dangerous, something avoided, something felt but not yet named.

Start from there. One sentence that names the weight — then ask, or do not ask.

If your opener is a content word followed by a question ("הרצון...", "הכאב...", "הפחד...")
— you are asking about the material from above it. Klein does not approach from above.
She arrives at what is already pressing.

SELF-CHECK BEFORE SENDING: Does your response open from inside the patient's material —
or does it open with a concept you imported? One word of theirs, used as a landing point
— not a topic word you introduce. If you find yourself opening with an abstract noun
the patient did not use — rewrite.
```

**איתן** מאמת בשיחה חיה אחרי יישום.

### ב. Freud STATEMENT REQUIREMENT (8 ימים ממתין — לא בקוד, אומת ע"י ליה 19.06)
**אוליבר** מוסיף MANDATORY FINAL CHECK item 11 לפרויד ב-`lib/theorist-voices.ts`:

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

### ג. Judge cron — שורה אחת ב-vercel.json
**אוליבר** מוסיף ל-`vercel.json` תחת `"crons"`:
```json
{ "path": "/api/judge-full", "schedule": "0 8 */3 * *" }
```
כרגע `"crons": []` — ה-judge לא רץ אוטומטית. ליה מנתחת ידנית. זה לא בר-קיימא.

---

## עדיפות שנייה — תיעוד בטיחות (חסום הכל)

**מה לעשות — לפני הפוש הבא:**
**איתן** מתעד ב-MEMORY.md — בכתב — האם בדיקת "סימנים אובדניים" בוצעה:
> "בדיקת סימנים אובדניים — בוצע ביום ___ / לא בוצע / חסום כי ___"

70+ יום ללא תיעוד. 4 ממוים ציינו זאת. עדיין פתוח.

- תוצאה שלילית = תיקון אותו יום, לפני כל push אחר
- תוצאה חיובית = כותב ב-MEMORY.md ועוברים לעדיפות שלישית

---

## עדיפות שלישית — BW-64: שאלת זהות ישירה

25+ ימים פתוח. הוולידציה לא תתפוס אותו. ליה + אוליבר. לסגור ב-OPEN_DECISIONS.md אחרי אימות.

---

## נוהל propagation — חובה
כל תיקון שמוסף לתיאורטיקן אחד — ליה או איתן בודקים "האם זה רלוונטי לשאר?" לפני סגירה.

---

## מה חשוב לבדוק עכשיו
1. **Klein VOICE IDENTITY:** בקוד? כן/לא. אם לא — מתי
2. **Freud STATEMENT REQUIREMENT:** בקוד? כן/לא. אם לא — מתי
3. **Judge cron:** ריק ב-vercel.json — לתקן
4. **בטיחות:** תועד? כן/לא/חסום — 70+ יום

---

## מה לא לגעת בו עכשיו
- אל תוסיפו תיאורטיקנים חדשים
- אל תתחילו שיווק — לא לפני בטיחות + 3 מטפלים אמיתיים עם פידבק
- אל תגעו ב-RAG לפני שהבטיחות מתועדת
- **אל תוסיפו כלל וולידציה לQ-3** — Q-3 הוא כשל session, הוולידציה בודקת תגובה. הפתרון הוא בפרומפט בלבד

---
_הקובץ הזה מעודכן על ידי Adam (CEO). כל הסוכנים קוראים אותו לפני שמתחילים._
