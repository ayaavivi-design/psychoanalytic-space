# Sam — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- Deployment אחרון: 14 יוני 2026 — security(deps) dependency vulns (commit f4c52ad, dpl_61N3 READY ~30s): צמצום פגיעויות npm 12→3. uuid+ws (npm audit fix non-breaking) · הסרת @xenova/transformers (לא בשימוש, אפס imports → מחק CRITICAL protobufjs RCE) · next 16.2.1→16.2.9 patch (מחק 9 advisories). package.json+package-lock.json בלבד, אפס קוד אפליקטיבי. אישורים: איתן ✅ smoke (release/eitan-approval.md) · איה ✅ go · אדם לא נדרש (patch פנימי, אפס user impact). preflight: commit יחיד לפני origin, pull --rebase --autostash (remote up-to-date), push 14a8757..f4c52ad. שני דומיינים 200. אין Jira (security פנימי). 3 moderate שנשארו לא חשופות (anthropic-sdk Memory Tool + postcss transitive בתוך next) — במעקב.
- לפניו: Deployment 13 יוני 2026 — BW-96/97 prompt fidelity (commit 29fe835, deploy READY ~23s): 2 כללים ב-lib/summary-prompt.ts (INTERPRETATION IS NOT FACT + SEPARATE WHO SAID WHAT) + 3 כללים + overall-logic ב-lib/supervise-prompt.ts (REGISTER/META-FEEDBACK/SOPHISTICATION). downstream agents בלבד — לא נגע בקולות התיאורטיקנים. אישורים: ליה ✅ (/eval, שער קליני) + איתן ✅ (smoke test, eitan-approval.md) + איה go מפורש (אדם לא נדרש). preflight: רק 2 קבצי lib staged by-name → stash(memory+mockups+reports+docs)→pull --rebase(72c5e14)→push→pop (conflict ב-eitan.md+maya.md, cron כתב במקביל, נפתר ידנית). BW-96+BW-97 → Done. Eitan post-prod QA: 3/4 + safety 4/4 יציב (פרויד 🔴 = BW-99 קיים, לא regression), commit d24d5e3.
- לפניו: Deployment 09 יוני 2026 — QA hotfix (commit d339d31, dpl_F2Uu READY ~25s): checkConsistency מדד word-count על therapist=slice(0,150) שנשמר רק לתצוגה → השטיח שונוּת אורך → דגל "תבנית קבועה" שקרי על ויניקוט/אוגדן (08.06). תיקון: TurnResult.therapistFull (לא נחתך) + checkConsistency מודד על הטקסט המלא עם [MEMORY:...] מוסר. tsc נקי. local 2 מאחורי origin (commits של agents בלבד) → commit→stash(memory+mockups+reports)→pull --rebase (נקי)→push→pop. שני הדומיינים 200. אפס Jira (תיקון QA פנימי, אפס user impact). go מפורש מאיה. אימות ידני של ה-QA נדחה לבוקר (cron ירוץ על הקוד המתוקן).
- לפניו: Deployment 08 יוני 2026 — UX+clinical batch (commit 001d7c2, dpl_Hsr7NX READY ~24s): פס הדר יחיד + תוויות תיאורטיקן + footer pills + כפתור intake על accent-deep + כלל קליני לקליין. אישורים: איתן ✅ ליה ✅ איה ✅ (אדם לא נדרש). release-note+board-note נדחפו (commit 1007280). תיעוד Jira retroactive (08.06 ערב, go מאיה): BW-78 (UX batch) + BW-79 (Klein clinical) נוצרו עם label release-2026-06-08 → Done. Eitan post-prod QA רץ על הפרודקשן: 2/4 (פרויד+קליין נקי, ויניקוט+אוגדן דגל "עקביות אורך" heuristic בלבד), safety 4/4, specificTests 6/6 → יציב עם WARNING, לא rollback. דוח: release-reports/post-qa-2026-06-08-2348.md.
- לפניו: 07 יוני 2026 — design refresh (commit b62b6c3, dpl_fBn6o1 READY): פלטת רוז עמוקה + פונט Assistant לעברית. BW-77 Done.
- לפניו: 07.06 security (commit eb01874, dpl_7Q3PFR READY) — service_role env var. BW-76 Done.
- לפניו: 02 יוני 2026 — Hold entry flow (commit 3055639, dpl_B9KKAE7 READY): BW-66/67/64/68, כולם Done ב-Jira
- Branch: main · remote: ayaavivi-design/psychoanalytic-space
- Vercel crons מוסיפים commits אוטומטית (QA reports) — remote יכול להיות קדים ל-local
- Jira MCP מחובר ועובד דרך cloudId: 03a5ff06-2b5e-41f3-ab73-14914bd6b3ca (ayaavivi.atlassian.net). Transition Done = id "41"
- ממתין: BW-69 (Maya UX, post-deploy non-blocker, פתוח)
- ממתין: BW-7–BW-15, BW-20 עדיין לא עודכנו ל-Done ב-Jira
- Post-deploy verification פתוח: BW-67 early-point ל-Freud/Klein/Ogden בשיחה חיה, מסך Hold ב-375/393/768, crisis path end-to-end כולל טקסט private

---

## Decisions & Gotchas
- **תמיד `git pull` לפני `git push`**: Vercel crons יכולים להוסיף commit ל-remote בלי ידיעה.
- **Checklist שחרור**: Eitan sign-off + Oliver sign-off + founder sign-off — כולם חייבים לפני push.
- **לעולם לא `--no-verify`** אלא אם הוסכם מפורשות עם Oliver.
- **Jira לפני שחרור**: ודא שכל issues שנכנסים ל-release נמצאים בספרינט הנוכחי ומסומנים.
- **אל תדחוף ל-main בלי release note** — גם hotfix קטן מתועד.

---

## History (last 10)
1. Release BW-96/97 13.06.2026: prompt fidelity ל-downstream agents — 2 כללים ב-summary-prompt.ts + 3 כללים + overall-logic ב-supervise-prompt.ts (נוסחי ליה, הזרקת אוליבר). שער קליני: ליה /eval ✅ (supervise אוגדן pass→warn, control קליין נשאר pass/strong, summary לא מקדש פרשנות שנויה). שער QA: איתן smoke test ✅ (tsc EXIT=0 + runtime JSON דרך /eval). go מאיה. preflight: staged רק 2 קבצי lib by-name, stash לשאר → pull --rebase 72c5e14..29fe835 → push (pop נתן conflict ב-eitan.md+maya.md מ-cron מקביל, נפתר ידנית בלי איבוד). deploy READY ~23s · chat.getbetween.app חי · BW-96+BW-97 → Done. Eitan post-prod QA: 3/4+safety 4/4 יציב, פרויד 🔴 = BW-99 קיים (לא regression — הריליס לא נגע בקולות). דוח post-qa-2026-06-13-2337.md (commit d24d5e3). (יוני 2026)
2. QA hotfix 09.06.2026: checkConsistency ב-app/api/qa/route.ts מדד אורך/פתיחה על therapist=slice(0,150) (נשמר רק לטבלת הדוח) → השטיח שונוּת אמיתית → דגל "תבנית קבועה" שקרי על כל תיאורטיקן עם תגובות >150 תווים (ויניקוט+אוגדן 08.06). תיקון: TurnResult.therapistFull (לא נחתך) + checkConsistency מודד על הטקסט המלא עם stripMemory ל-[MEMORY:...]. slice לתצוגה לא השתנה. tsc נקי. local 2 מאחורי origin → commit b1d2309→stash(memory+mockups+reports)→pull --rebase→d339d31→push→pop. dpl_F2Uu READY ~25s · 2 דומיינים 200 · אפס Jira (QA פנימי). go מאיה. אימות ידני נדחה לבוקר. (יוני 2026)
3. Deployment 08.06.2026: UX+clinical batch — פס הדר יחיד (הוסר border-top מ-.header-session, חזר אחרי revert) + תוויות הודעה לפי שם תיאורטיקן (chat.js, יוזר בלי תווית) + footer pills במסך Hold (muted→text/border) + כפתור intake על accent-deep (WCAG 5.63) + כלל קליני לקליין (reality-based reason guard + החזרת transition למטפל האמיתי, ליה PASS Tier 2). 6 קבצים: globals.css, page.tsx, chat.js, theorist-voices.ts, design-system.md/html. אישורים: איתן ✅ (2 WARNING לא-חוסמים) ליה ✅ איה ✅ (אדם לא נדרש). Preflight: tsc+lint:tokens נקי. local 7 מאחורי origin → stash(memory+bizdev+untracked)→pull --rebase(נקי)→push→pop. push 1c74b51..001d7c2 ✅ · dpl_Hsr7NX READY (~24s) · chat.getbetween.app חי. אפס Jira (בלי issue ייעודי — נבע מבקשות UX חיות). release-note+board-note: commit 1007280 נדחף בנפרד. (יוני 2026)
4. Deployment 07.06.2026: design refresh — פלטת רוז עמוקה (--bg #fdf8f6→#f3e7e2, surface/border/muted/accent-deep/thinking; accent #c4607a לא זז) + פונט עברית David Libre→Assistant (layout.tsx, weights 300-600). 6 קבצים (globals.css, layout.tsx, page.tsx, between-tokens.json, design-system.md/html). Preflight: WCAG AA עבר, lint:tokens נקי, tsc נקי. push eb01874..b62b6c3 ✅ · dpl_fBn6o1 READY (24s) · אתר 200 · BW-77 Done. אישרה איה. (יוני 2026)
5. Deployment 07.06.2026: security — service_role של Supabase הוצא ל-env ב-4 סקריפטי Python (commit eb01874). push 2e652d1..eb01874 ✅ · dpl_7Q3PFR READY · BW-76 Done. שינוי סקריפטים בלבד, אפס runtime impact. (יוני 2026)
6. Deployment 02.06.2026: Hold entry flow — BW-66 (UI) + BW-67 (point-back-to-the-room ×4 + Winnicott #16) + BW-64 (זהות כחומר קליני) + BW-68 (crisis scan full, תיקון בטיחות Tier 1 של Oliver). אישורים: Eitan ✅ Lia ✅ Maya→BW-69 איה ✅. Preflight תפס local 3 מאחורי origin → pull --rebase (conflict ב-eitan.md, ours/cron), stash ל-bizdev/mockups out-of-scope. push add68a6..3055639 ✅ · Vercel dpl_B9KKAE7 READY ✅ · 4 issues → Done ✅. (יוני 2026)
7. Deployment 22.05.2026: Clinical Voices v2 — between-sessions framing + 4 כללים קליניים לוויניקוט, כל 4 תיאורטיקנים (6 commits, lib/theorist-voices.ts + memory) — push הצליח ✅ · Vercel READY ✅ · board-notes + release-notes ב-repo ✅
8. Deployment 17.05.2026: BW-53 — unified entry flow, Vera & Elliot personas, theorist-voices, icon-system, design-system (6 files, 367 insertions) — push הצליח ✅ · Jira Done ✅
9. Hotfix 16.05.2026 (late): Silence detection A+B+C + Klein prompt + flow buttons — push הצליח ✅
10. Deployment 16.05.2026 (22:00): Agent Improvement Plan — 3 layers, 30 files, agents/ only — push הצליח ✅
