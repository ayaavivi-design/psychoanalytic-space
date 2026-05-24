# Hili — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- ספרינט נוכחי: פעיל (מאי 2026)
- BW-38: Done · BW-41: Done · BW-64: In Progress
- פתוח: מודל תשלום (ממתין לאלכס) · QA results לאייה (חסום על GITHUB_TOKEN ב-Vercel)
- לינה: מסמכים משפטיים לפני launch ציבורי

---

## Competitive Intelligence — להציף בדיוני B2B ו-therapist partnerships

- **Therapy Mallard** (therapymallard.com): מקליט פגישות, מתמלל, מחלץ goals/themes. כלי productivity, CBT-oriented. **לא מתחרה ישיר** — הקלטת פגישה פסיכואנליטית לא תואמת את הframe הקליני. מטפל פסיכואנליטי לא ימליץ עליו.
- **Flourish** (myflourish.ai): AI companion בשם Sunnie, Stanford/Harvard-backed, RCT-validated, CBT/DBT/mindfulness, gamification, קהילה. **לא מתחרה ישיר** — מכוון לmass market, לא לפסיכואנליטי. אבל: יש להם therapist recommendations ו-institutional credibility.
- **ה-whitespace של Between**: אין כלי שמכוון ספציפית למטופלים פסיכואנליטיים/פסיכודינמיים, שמכבד את הframe, שעובד עם קול תיאורטיקן ייחודי. זו הבחנה שמטפלים פסיכואנליטיים מבינים מיד.
- **RCT angle לB2B**: מחקר קטן שמודד "האם מטופלים שמשתמשים בBetween מביאים יותר חומר לפגישה הבאה?" — מספיק לפתוח דלתות קליניות ואינסטיטוציות. לא צריך RCT גדול. לשקול כשמגיעים לשלב therapist partnerships.
- **Therapy Journal** (therapyjournal.app): יומן עם templates מובנים, ספריית קורסים (CBT/psychoeducation), שיתוף entries עם מטפל. **מנגנון B2B**: "Therapist Code" — מטפל מפיץ קוד, מטופל מכניס בפרופיל, entries משותפים נגישים למטפל. פשוט, ללא חיכוך — כדאי לשקול כ-UX pattern אם Between הולכת B2B. המוצר עצמו CBT/solution-focused ("Feel Grateful" כשלב הכנה לפגישה — אנטיתטי לframe פסיכואנליטי). לא מתחרה ישיר. נקודה נוספת: "Invite Therapist" נמצא בניווט הראשי — B2B הוא הלב, לא תוספת. לשקול: אם Between הולכת B2B, האם זה כפתור גלוי בממשק או flow נפרד לחלוטין.

---

## Decisions & Gotchas
- **אל תיצרי Jira issue בלי לבדוק duplicates** — תמיד חפשי קודם ב-JQL.
- **QA bugs**: label `qa-report`, priority High אם safety issue.
- **לפני כל commit**: לוודא שהשינוי של route.ts נכנס לcommit — זה נפל פעם אחת (MEMORY_TAG_INSTRUCTION נשאר uncommitted ולא הגיע לפרודקשן).
- **open-decisions sync**: לפני sprint planning — קרי OPEN_DECISIONS.md ובדקי מה תקוע.
- **לא לבלבל בין Jira task לאפיון** — task = מה לממש, לא איך.

---

## History (last 10)
1. BW-64 נוצר ועבר ל-In Progress (22.05.2026): Tier 2 — identity question treated as clinical material, all 4 theorists. מקור: ליה + איתן QA post-production. label: qa-report.
2. Session 22.05.2026: fix(memory) — MEMORY_TAG_INSTRUCTION was never committed (explains 0 memories since BW-46). Write save now opt-in toggle. All pushed to production.
2. Jira update 22.05.2026: BW-61 Done (archive bug HE) + BW-62 Done (description centering+minHeight) + BW-63 To Do (design system audit — touch targets, spacing, hierarchy)
2. Jira update מאי 2026: BW-41 Done + BW-38 Done + security fix logged
3. Sprint review: כל קומיטי מאי 2026 מתועדים ב-Jira
4. BW-53 נוצר (17.05.2026): Story — Session Mode persona cards (Vera & Elliot). פרויקט BW (לא BTW). 3 AC gaps פתוחים: copy→Shaun, silhouette→Maya, memory→Hili+Aya.
