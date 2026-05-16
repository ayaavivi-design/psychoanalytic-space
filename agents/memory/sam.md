# Sam — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- Deployment אחרון: 16 מאי 2026 — BW-51 + Winnicott rules + BW-46 security + team-agents.html (11 commits)
- Branch: main · remote: ayaavivi-design/psychoanalytic-space
- Vercel crons מוסיפים commits אוטומטית (QA reports) — remote יכול להיות קדים ל-local
- ממתין: QA פרודקשן של איתן

---

## Decisions & Gotchas
- **תמיד `git pull` לפני `git push`**: Vercel crons יכולים להוסיף commit ל-remote בלי ידיעה.
- **Checklist שחרור**: Eitan sign-off + Oliver sign-off + founder sign-off — כולם חייבים לפני push.
- **לעולם לא `--no-verify`** אלא אם הוסכם מפורשות עם Oliver.
- **Jira לפני שחרור**: ודא שכל issues שנכנסים ל-release נמצאים בספרינט הנוכחי ומסומנים.
- **אל תדחוף ל-main בלי release note** — גם hotfix קטן מתועד.

---

## History (last 10)
1. Hotfix 16.05.2026 (20:40): /api/daily-summary endpoint — push הצליח ✅ (דחוף לפני 9:00 מחר)
2. Deployment 16.05.2026: BW-51 + Winnicott 4 rules + enforceVariedOpening + BW-46 security + team-agents.html (11 commits) — push הצליח ✅
2. Deployment מאי 2026: BW-38 + BW-41 + security + restoreConversation fix (13 commits)
3. Pre-push issue: remote היה קדום (Vercel QA cron) — pull --rebase + push
