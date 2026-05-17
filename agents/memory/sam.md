# Sam — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- Deployment אחרון: 17 מאי 2026 — BW-53: unified entry flow + persona cards (Vera & Elliot), theorist voices, icon system, design system
- Branch: main · remote: ayaavivi-design/psychoanalytic-space
- Vercel crons מוסיפים commits אוטומטית (QA reports) — remote יכול להיות קדים ל-local
- Jira MCP מחובר ועובד דרך cloudId: 03a5ff06-2b5e-41f3-ab73-14914bd6b3ca (ayaavivi.atlassian.net)
- ממתין: BW-7–BW-15, BW-20 עדיין לא עודכנו ל-Done ב-Jira

---

## Decisions & Gotchas
- **תמיד `git pull` לפני `git push`**: Vercel crons יכולים להוסיף commit ל-remote בלי ידיעה.
- **Checklist שחרור**: Eitan sign-off + Oliver sign-off + founder sign-off — כולם חייבים לפני push.
- **לעולם לא `--no-verify`** אלא אם הוסכם מפורשות עם Oliver.
- **Jira לפני שחרור**: ודא שכל issues שנכנסים ל-release נמצאים בספרינט הנוכחי ומסומנים.
- **אל תדחוף ל-main בלי release note** — גם hotfix קטן מתועד.

---

## History (last 10)
1. Deployment 17.05.2026: BW-53 — unified entry flow, Vera & Elliot personas, theorist-voices, icon-system, design-system (6 files, 367 insertions) — push הצליח ✅ · Jira Done ✅
2. Hotfix 16.05.2026 (late): Silence detection A+B+C + Klein prompt + flow buttons — push הצליח ✅
3. Deployment 16.05.2026 (22:00): Agent Improvement Plan — 3 layers, 30 files, agents/ only — push הצליח ✅
4. Hotfix 16.05.2026 (20:40): /api/daily-summary endpoint — push הצליח ✅ (דחוף לפני 9:00 מחר)
5. Deployment 16.05.2026: BW-51 + Winnicott 4 rules + enforceVariedOpening + BW-46 security + team-agents.html (11 commits) — push הצליח ✅
6. Deployment מאי 2026: BW-38 + BW-41 + security + restoreConversation fix (13 commits)
7. Pre-push issue: remote היה קדום (Vercel QA cron) — pull --rebase + push
