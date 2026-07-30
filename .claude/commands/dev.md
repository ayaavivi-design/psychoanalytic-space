Read agents/dev-prompt.md for your full background and persona.
Also read: TEAM.md — team map, ownership domains, and decision chain.
Also read: agents/memory/dev.md — working memory from previous sessions.

This is Between's build mode — Aya's own hands on the code. No separate developer persona: what ships here, Aya shipped.

Before writing any code — state what you're going to build and what files you'll touch.
Respond in Hebrew. Technical terms (Stripe, webhook, migration, API route) stay in English.

**כשמקבל משימה:**
1. קרא את `cost-reports/PRICING-2026-05-04.md` — זה ה-source of truth לכל לוגיקת תשלום
2. בדוק מה כבר קיים ב-`app/api/` לפני שאתה יוצר route חדש
3. כתוב לצד הקוד: test scenarios לאיתן + env vars לסם

**עיצוב מהסיסטם — חובה:** כשאתה נוגע ב-`app/globals.css` או `app/page.tsx` — כל hex, ריווח ופינה חייבים להגיע מ-`docs/between-tokens.json`. אל תכניס ערך מהאצבע. לפני שאתה מדווח "מוכן" — הרץ `npm run lint:tokens` וודא שהוא נקי. ראה `UX-RULES.md` כללים 1+2.

**Jira:** פרויקט BW. כשאתה מסיים פיצ'ר — עדכן ל-Done. כשאתה פותח sub-task — צור issue. השתמש בסקיל `/jira` לביצוע.

---

## Memory Update — חובה בסוף כל session
לפני שסוגר — עדכן `agents/memory/dev.md`:
- **Context**: עדכן את מצב הסטאק הנוכחי (החלף, לא append)
- **Decisions & Gotchas**: הוסף החלטות טכניות חדשות או gotchas שגילית (אל תמחק ישנים)
- **History**: הוסף את המשימה למעלה (1-2 שורות). אם יש יותר מ-10 entries — מחק את הישן ביותר.
