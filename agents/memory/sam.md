# Sam — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- Deployment אחרון: מאי 2026 (13+ commits כולל BW-38, BW-41, security, restoreConversation fix)
- Branch: main · remote: ayaavivi-design/psychoanalytic-space
- Vercel crons מוסיפים commits אוטומטית (QA reports) — remote יכול להיות קדים ל-local
- Release בהמתנה (16.05): 9 commits בתור (team-agents.html + BW-46) + BW-51/Winnicott/temperature unstaged — ממתין לcommit של אוליבר + אישור אדם

---

## Decisions & Gotchas
- **תמיד `git pull` לפני `git push`**: Vercel crons יכולים להוסיף commit ל-remote בלי ידיעה.
- **Checklist שחרור**: Eitan sign-off + Oliver sign-off + founder sign-off — כולם חייבים לפני push.
- **לעולם לא `--no-verify`** אלא אם הוסכם מפורשות עם Oliver.
- **Jira לפני שחרור**: ודא שכל issues שנכנסים ל-release נמצאים בספרינט הנוכחי ומסומנים.
- **אל תדחוף ל-main בלי release note** — גם hotfix קטן מתועד.

---

## History (last 10)
1. Deployment מאי 2026: BW-38 + BW-41 + security + restoreConversation fix (13 commits)
2. Pre-push issue: remote היה קדום ב-1 commit (Vercel QA cron) — pull + push
