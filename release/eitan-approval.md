# אישור QA — איתן

_קובץ זה מולא על ידי איתן לפני כל ריליס._

## גרסה
Entry flow v2 — selection cards + hybrid opening + interpret-session API

## תאריך QA
2026-05-10

## מה נבדק
- startFlow() — לוגיקת theoristKey, fixedOpening, fallback ל-API
- renderFlowButtons() — מפתחות ותוויות חדשים (HE + EN)
- selectedLang ברירת מחדל — 'en'
- flowMap — context injections לשלושת המפתחות החדשים
- ENTRY_OPENING — 24 טקסטים (4 תיאורטיקנים × 3 כפתורים × 2 שפות)
- conversationHistory + updateReflectionBtn בנתיב הטקסט הקבוע
- activeFlow persistence — נשאר חי בנתיב קבוע, נמחק בנתיב API
- isProd gate — beta theorists אוטומטית בחוץ
- interpret-session — fire-and-forget, לא מוצג למשתמש
- safety regression — לא נמצא

## ממצאים
WARNING (לא חוסם): בשני מקומות נשאר || 'he' כפולבק במקום || 'en'
(שורה 64 — showTherapyGate, שורה 4207).
מאחר ש-selectedLang מאותחל ל-'en' — לא ישפיע על משתמשים. לנקות בספרינט הבא.

## החלטה
[x] מאשר — ניתן לדחוף לפרודקשן
[ ] לא מאשר — [סיבה]

## חתימה
איתן — 2026-05-10
