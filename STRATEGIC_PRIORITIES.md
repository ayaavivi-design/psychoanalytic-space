# עדיפויות אסטרטגיות — מרחב פסיכואנליטי

_עודכן לאחרונה: 2026-07-12 (Adam, CEO)_

---

## המצב הנוכחי
MVP בפרודקשן. 4 תיאורטיקנים פעילים (פרויד, קליין, ויניקוט, אוגדן). RAG עובד. **Crons פעילים** — QA יומי + Judge כל 3 ימים (אושר 10.07). CORE_GUARDRAILS Wave 1 נכנסה (G8/G9/G11, Hold-B anti-scripting, 07.07). B2C — המטופל מגיע ישירות.

**Klein VOICE IDENTITY block — 37 יום, עדיין לא בקוד.** ליה אימתה ישירות (10.07, שורות 875-912). ×2 O-7 catches בפרודקשן. **Deadline: 14.07.**

---

## עדיפות ראשונה — Klein VOICE IDENTITY block (deadline: 14.07)

**הניסוח מוכן. אין מחקר. זה copy-paste.**

מוסיפים לפני שורה 892 ב-`lib/theorist-voices.ts` (לפני MANDATORY FINAL CHECK של קליין):

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

**אחרי יישום:** איתן מאמת בשיחה חיה (O-7 pattern: opener מילת תוכן שלא הגיעה מהמטופל).

**אם ב-14.07 הבלוק לא בקוד — אין commit נוסף ל-theorist-voices.ts.**

---

## עדיפות שנייה — Safety test מלא (8/8 תיאורטיקנים)

ב-07.07 נוסף phrase חסר לזיהוי דטרמיניסטי (commit 63812de). אומת ידנית N=4 בלבד.

**נדרש:** בדיקה מלאה על כל 8 תיאורטיקנים עם כל ה-phrasing העדכנית.
**בעלים:** איתן
**חוסם:** הרחבת קהל, שיווק, ו-Stripe — לא לפני שזה נסגר.

---

## עדיפות שלישית — מדידת הניוזלטר (לפני Stripe)

שון מפרסם 3+ ניוזלטרים בשבוע (גיליונות 39–41). הפוזיציונינג חד. אין מדידה.

**נדרש לפני כל דיון על Stripe:**
- כמה subscribers?
- click-through rate ל-between.space?
- כמה מהם מגיעים לאפליקציה?

אם לא יודעים — זה הנתון הראשון לדעת, לפני כל החלטה עסקית.

---

## עדיפות רביעית — Freud STATEMENT REQUIREMENT (רק אחרי Klein מאומת)

**לא לגעת לפני ש-Klein VOICE IDENTITY עבר אימות חי מאיתן.**

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

**אחרי יישום:** איתן מאמת בשיחה חיה.

---

## BW-64 — שאלת זהות ישירה (ממתינה לאימות ליה)

הכלל נוסח ב-OPEN_DECISIONS.md. מחכה ל-live test מליה → לסגור ב-OPEN_DECISIONS.md אחרי אישור.

---

## נוהל propagation — חובה
כל תיקון שמוסף לתיאורטיקן אחד — ליה או איתן בודקים "האם זה רלוונטי לשאר?" לפני סגירה.

---

## מה חשוב לבדוק עכשיו
1. **Klein VOICE IDENTITY:** נוסף לפני שורה 892? כן/לא — deadline 14.07
2. **Safety test 8/8:** בוצע? תאריך: ___
3. **מדידת ניוזלטר:** subscribers + click-through ידועים? כן/לא
4. **Freud item 12:** רק אחרי Klein מאומת — לא לגעת לפני
5. **BW-64 live test:** ליה אישרה? כן/לא

---

## מה לא לגעת בו עכשיו
- אל תוסיפו תיאורטיקנים חדשים
- אל תרחיבו ממשק מטפלת
- **אל תפתחו Stripe** — לא לפני Klein validated + safety 8/8
- אל תשנו קצב הניוזלטר — עד שיש מדידה
- אל תגעו ב-RAG
- **אל תוסיפו Freud item 12 לפני Klein validated**
- **אל תוסיפו כלל וולידציה ל-Q-3** — Q-3 הוא כשל session, הפתרון בפרומפט בלבד

---
_הקובץ הזה מעודכן על ידי Adam (CEO). כל הסוכנים קוראים אותו לפני שמתחילים._
