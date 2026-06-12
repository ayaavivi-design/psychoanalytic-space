# Maya — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- design-system.html: v1.3 — מסונכרן עם globals.css (יוני 2026: accent-deep swatch, font-david, layout-content-max, RTL flip fix, heading-sm הוסר, heading-lg→David Libre, BW-41 phantom הוסר, אייקוני פרסונה = קליין/אוגדן כסימון נקבה/זכר בלבד). **נדחף לפרודקשן (commits e1ac775, f7a2d9b).**
- globals.css: כל font-sizes מטוקנות (--fs-*), כל border-radius מטוקנות (--radius-*)
- components.md: 7 קומפוננטים מתועדים (Bubble, Input, Sidebar, Modal, Tooltip, Flow, Suggestions)
- icon-system.md: Lucide (size=15, strokeWidth=1.75) + רשימת Unicode מאושרת
- UX-RULES.md: 9 כללים פעילים
- between-tokens.json: source of truth לכל מדידה
- **Hold UI (`/hold` route) — ממצאי מאי 2026:** padding-top 48px→28px, כרטיס max-height 360px, כותרת color→var(--text), placeholder opacity 0.9, כפתור שמור מוסתר עד hasContent. "שתף עם המטפל"/"שיחה" לא קיימים ב-/hold — שאלה פרודקטית פתוחה.
- **מסך בחירה (BW-41) — ממצאי מאי 2026:**
  - Mode toggle: שני האפשרויות `--muted` בטעינה — אין selected state ברירת מחדל. צריך: "סשן" נבחר כברירת מחדל.
  - welcome padding-top: 8px בפועל — צריך 32px (space-xl).
  - שתי כותרות זהות 19px — צריך היררכיה: ראשית 20px italic, שנייה 19px.
  - theorist grid: `margin: 0 195px` ידני — צריך `width:fit-content; margin:0 auto`.
- **Domain:** psychoanalytic-space.vercel.app ו-chat.getbetween.app = אותו deployment. הראשון לפיתוח/QA, השני לשיווק/משתמשים.
- design-system.md: עודכן עם לינקי live בראש הקובץ.

---

## Decisions & Gotchas
- **Tooltip**: React fixed-position state component בלבד — לעולם לא CSS `::after`. clipping ב-overflow containers.
- **User bubble**: background: var(--accent-soft) + border subtle — לא solid accent (#c4607a).
- **Input wrap**: border-radius: var(--radius-lg) = 16px — לא 24px.
- **line-height בועות**: 1.85 — לא לשנות. נבחר ספציפית לקריאות עברית.
- **נרמול גדלים**: 10px→11px (--fs-caption) · 14px→13px (--fs-body-md) · 17px→18px (--fs-heading-card) · 16px→15px (--fs-body-lg).
- **Breakpoints**: לא תומכים ב-var() בתוך @media — ערכים hardcoded: 600px · 900px · 1200px.
- **design-system.html**: self-contained, לא יורש globals.css — כל שינוי טוקן חייב sync ידני לקובץ הזה.
- **preview_eval = prototype בלבד**: CSS שמוזרק דרך eval הוא זמני. לא לדווח "מוכן" בלי לכתוב לקוד האמיתי.
- **`--muted` = #80706a (לא #a8948e)** — שונה יוני 2026 לעמידה ב-WCAG AA (4.49/4.73). #a8948e הישן נכשל (2.73/2.88). admin/page.tsx עדיין עם #a8948e hardcoded (פנימי). מיילים משתמשים ב-hex ליטרלי כי אין CSS var.

---

## History (last 10)
1. **דוח אונבורדינג 2026-06-12 (ONBOARDING-2026-06-12.md).** ממצא קריטי: `step-theorist` לעולם לא מוצג — `.theorist-tag` לא בDOM כי `theoristsOpen=false` כברירת מחדל. step-intake עובד לmשתמשים חדשים ✓. config עודכן: step-theorist text עם שמות קונקרטיים + "בסרגל הצד". open: תיקון קוד לאוליבר (קריטי), welcome_headline לשון (ממתין), מנגנון חזרה להילי (ממתין).
1. **דיזיין סיסטם — זוקק, נדחף, ושמות פרסונה שונו (יוני 2026, אישורי איה + push מפורש).** סגירת מחזור הזיקוק: BW-41 phantom הוסר, ואז לבקשת איה אייקוני הפרסונה ורה/אליוט → **קליין (נקבה) / אוגדן (זכר)** — שמות התיאורטיקנים האמיתיים. בקוד ורה/אליוט נשארים מוקפאים (`if(false)`), לא נגעתי. התיאורים ("ראש+קוקו"/"page.tsx only") + שורת ההסבר התחתונה הוסרו — האייקונים הם **סימון מגדר בלבד**. **נדחף ב-3 commits** (`e1ac775` זיקוק+שמות, `f7a2d9b` סימון מגדר, ועוד `4c366d4` אכיפת טוקנים ב-prompts של maya+dev). **BW-74 נפתח לאוליבר** (פונט Frank Ruhl Libre נטען ב-layout.tsx אבל var(--font-frank) לא בשימוש). **gotcha תהליך: שרת `mcp__atlassian` החזיר ריק לכל בקשה (session לא מאומת) — עברתי לשרת Atlassian השני (`0bdec50d...`, cloudId 03a5ff06) שעבד.** dev.md memory של אוליבר — באג מספור (7×"2" ב-History) — השארתי לו.
1b. **המשך זיקוק — הסרת BW-41 phantom (יוני 2026, אישור איה "כן").** הסרתי מ-design-system.html את כל דפוס מסך הכניסה BW-41 (טוגל מצב סשן/לחקור + רשת תיאורטיקנים 2×2 + כפתור "המשך"): 3 מחיקות — (1) סקשן "מסך כניסה מאוחד BW-41" השלם; (2) העמודה הימנית ב-"Button Variants" (Mode Pill Toggle + Theorist Pill Grid + Confirm); (3) CSS יתום `.bw-mode-track/.bw-mode-pill/.theorist-pill/.t-name/.bw-confirm-btn`. **אומת מול הקוד החי: `bw-mode-pill`/`theorist-pill`/`bw-confirm-btn` = אפס שימושים ב-chat.js+page.tsx** (`flow-btn` כן קיים=3). המסך הוחלף בזרימת Hold. אחרי: 11 סקשנים, 0 שאריות, grid-2 עם ילד אחד (עמודה שמאלית שלמה — btn-primary 173×38). **ורה/אליוט — נשארים (החלטת איה: שימושי לסימון תיאורטיקנים זכר/נקבה).** **פונטים — הדף נקי:** 3 הפונטים שמוצגים (Cormorant/Rubik/David) נפתרים נכון ובנפרד בממשק החי (אומת: getComputedStyle על :root, --font-cormorant≠--font-david — **הגוצ'ה הישנה "Cormorant→David" סטייל/לא נכונה יותר**). **gotcha חדש: layout.tsx טוען Frank Ruhl Libre (`--font-frank`) אבל `var(--font-frank)` = אפס שימושים — טעינת פונט מבוזבזת, פריט קוד לאוליבר (לא בדף).**
1. **זיקוק design-system.html — נסגר (יוני 2026, אישור איה "א'"+"מאשרת").** האבחנה: לא היו "צבעים מיותרים" — ספירת var() הוכיחה שכל 10 הצבעים בשימוש (accent-deep 1, thinking 1 — בודדים אבל אמיתיים, נשארו). ה"מבולגן ולא מקצועי" היה **באג RTL**: שמות טוקנים (`--border`) וערכי hex (`#ede4e0`) רונדרו הפוך ("border--"/"ede4e0#") כי תוכן LTR בתוך עמוד RTL + `.color-grid` display:grid מילא ימין→שמאל (סדר פלטה אקראי). תיקון: `direction:ltr` על grid/color-name/color-value/type-token. **3 drift אמת תוקנו (sync לקוד):** (א) נוסף swatch `--accent-deep #b54f6b` (היה חסר, צבע ה-CTA האמיתי); (ב) `--font-david` + `--layout-content-max 900px` ל-:root; (ג) `heading-lg` תוקן Rubik→David Libre (בממשק זה David Libre — אומת computed). **`heading-sm` הוסר** מ-design-system.html וגם מ-between-tokens.json — לא היה טוקן ב-globals.css (10 גדלים בלבד); 19px חי רק כערך קשיח אחד ב-chat.js:684 (drift אמיתי בקוד, לא בדוק — להעלות לאוליבר). אומת חי: 10 type-rows, accent-deep present, hex/names קוראים LTR, token-lint נקי. **gotcha: עמוד תיעוד RTL חייב `direction:ltr` על כל אלמנט שמציג קוד/hex/אנגלית טכנית — אחרת flip.**
2. דוח אונבורדינג ראשון (יוני 2026): onboarding-reports/ONBOARDING-2026-06-05.md. 5 ממצאים עיקריים — theorist step academic, gender bugs בtour, sidebar ◉ debug text, welcome_headline לשון. Config עודכן. מנגנון חזרה חסר — הועבר להילי. welcome_headline קופי — הועבר לשון.
2. **BW-69 #5 (muted contrast) — תוקן לפי הכרעת איה (יוני 2026): `--muted` #a8948e → #80706a.** איה ראתה mockup השוואה (muted-contrast.html, נמחק אחרי) והכריעה לתקן. **הפוך מההכרעה הראשונית שלה ("לא בעיה") — היא ביקשה לראות ויזואלית קודם, ואז שינתה דעה. דפוס: איה מחליטה על צבע/קונטרסט רק אחרי mockup.** בוצע ב-5 מקומות: `globals.css:8` (טוקן קנוני, מעדכן 334 שימושי var(--muted)), `between-tokens.json:25`, `design-system.html:17`+swatch 554-555, `page.tsx:760` + fallbacks 789/793/797 → var(--muted,#80706a), `api/support/route.ts:40` (hex ליטרלי כי מייל לא תומך CSS var). **admin/page.tsx (17 hardcoded) הושאר — דשבורד פנימי, מחוץ ל-scope (אישור איה).** mockups HTML לא נגעתי (ארכיון). קונטרסט: 4.49 על bg (גבול — 0.01 מתחת 4.5, מעוגל עובר), 4.73 על surface ✓. tsc exit 0. אומת חי: getComputedStyle('--muted')=#80706a, דיסקליימר ב-auth screen קריא יותר. **סיבוב שני — איה שאלה "תיקנת בכל מקום?" וגיליתי שפספסתי את chat.js (הממשק הראשי vanilla JS):** chat.js:1639-1641 (fallback tooltip, רינדר נכון דרך var אבל hex ישן) + chat.js:8572 (#a8948e hardcoded בתווית תמלול — רינדר ישן, miss אמיתי) — שניהם תוקנו ל-#80706a. **gotcha: chat.js הוא הממשק הראשי — תמיד לגרוף גם אותו, לא רק page.tsx/globals.css.** ב-chat.js:8572 יש פלטה עצמאית בכלי UX-feedback הפנימי (buildConvTab, פרסונת michal): בועות #f0ebe8/#f7f2f9, תווית סוכן #8a6a95 (סגול לא-טוקן) — לא נגעתי, זו החלטת עיצוב נפרדת לא BW-69.
3. **BW-69 #6 (touch targets) — אימות חי על preview @375 (יוני 2026).** מדידה אמיתית (card inner 327px): mic 28×28, "סיכום כתיבה" 83×30, "שמור" 49×30, talk "שיחה עם ויניקוט" 303×42. **הפוטר לא עושה overflow — 327px עם ~140px slack (flex spacer).** רדיוס 16 על summary/save/talk אומת חי = תיקון #1 בקוד. **מסקנה: אין בעיית רוחב/צפיפות באף viewport** — כל הגבהים inline px קבועים → זהים ב-375/393/768; 375 (הצר ביותר) כבר נכנס בנוחות, אז הרחבים בטוחים יותר. **מסגור a11y מתוקן: WCAG 2.2 AA Target Size = 24px (לא 44). 44 הוא Apple HIG / WCAG AAA.** מול 24: רק Globe בהדר נכשל (28×20, גובה 20<24). מול 44: כולם נכשלים. **המלצה (אפס/מינימום שינוי ויזואלי):** mic→44×44 hit box שקוף (אייקון נשאר 15, אין שינוי נראה); Globe→padding ל-hit area ≥44 (מתקן את הכשל ה-WCAG היחיד); talk 42→44 (2px, טריוויאלי); summary/save — **להשאיר 30px "שקט"** (עוברים 24 AA, וכוונת ה"שמור השקט" מכוונת — לא לכפות 44 שיהפוך פוטר שקט לרועש). מקומי, אפס blast radius. gotcha: chat.js מסתיר את ה-welcome — אי אפשר לצלם את כרטיס ה-Hold בלי auth אמיתי; מדדתי ע"י clone של הפוטר ל-host גלוי ברוחב 327.
4. **BW-69 #4 (white-on-accent contrast) — נסגר ע"י איה (יוני 2026): לא מתקנים.** איה ראתה mockup השוואת גוונים (#c4607a 3.96 ✗ עד #a03d5c 6.33 ✓) והכריעה שהכפתור נראה מעולה כמו שהוא. ההכרעה: 3.96 הוא כשל *תקן* (WCAG AA), לא כשל *עין* — הכפתור קריא לחלוטין; לא שווה לגעת בצבע המותג עבור דלתא של 0.54. **אין `--accent-strong`. לא להחזיר את הפידבק הזה (כלל 5).** #5 (muted) עדיין פתוח כבעיית a11y רוחבית נפרדת — לא נסגר.
5. **BW-69 אימות + תוכנית (יוני 2026):** כל 6 הפריטים עדיין קיימים בקוד (page.tsx 540-617), שום דבר לא תוקן מאז הכתיבה. **מקומי-בטוח (לתקן מיד):** #1 talk radius 10→16, #2 footer padding 14→12, #3 placeholder line-height 1.7→1.6. **מקומי+אימות חי:** #6 touch targets (footer h30→44, talk h42→44, mic 28→44) — צפוף על 375, חובה screenshot. **גלובלי = החלטת מותג (לא BW-69):** #4 white-on-accent 3.96 fail — טקסט כהה גרוע יותר (3.83), הפתרון היחיד הכהיית רקע → המלצה טוקן חדש `--accent-strong` #b04e6b (5.06) רק ל-CTA עם טקסט לבן; #5 muted 2.88/2.73 fail — צריך ~#80706a (4.49) אבל muted חי בכל המוצר, בעיית a11y רוחבית, session נפרד עם שון. **Gotcha: ניגודיות accent/muted אף פעם לא Hold-local — הטוקנים גלובליים.**
2. Hold UI deep audit (מאי 2026): 13 ממצאים — ראה פירוט למטה.
2. Hold UI review (מאי 2026): 7 ממצאים — padding-top גבוה (48→28px), כרטיס מתפח (flex:1 בלי max-height), כותרת בצבע muted (contrast fail), placeholder בהיר מדי, כפתור שמור נראה שבור כשריק, שתף+שיחה לא קיימים ב-/hold route (שאלה פרודקטית פתוחה לאיה/הילי).
2. מפרט עיצוב מצגת ולידציה — שמור ב-bizdev/presentation-design-spec-2026-05.md (מאי 2026)
3. סקירת UI מלאה — מאי 2026: 5 ממצאים קונקרטיים (ראה למטה)
4. ניתוח מסך הבחירה (BW-41): 4 ממצאים — mode toggle ללא selected state, padding-top נמוך, כותרות זהות, grid margin ידני. עדכון design-system.md עם לינקי live.
5. design-system.html v1.1: full token sync, bubble spec fix, States demo + Grid/Breakpoints sections
6. components.md: 7 קומפוננטים מתועדים עם CSS spec + forbidden patterns לכל אחד
7. icon-system.md: Lucide + Unicode two-language system, approved lists, size specs
8. font-size tokenization: globals.css — 37 ערכי hardcoded → 10 tokens (--fs-*)
9. border-radius fix: תיקון תיעוד design-system.md (radius-lg היה מתועד כ-14px, נכון 16px)

## ממצאי Hold UI deep audit — מאי 2026

### 13 ממצאים מוכחים (מדידה בפועל)

1. **כותרת — font-family שגוי**: `"David Libre"` בפועל במקום `Cormorant Garamond`. `var(--font-cormorant)` מתפרשת ל-David Libre — bug טכני.
2. **welcome padding-top: 0px** — צריך `--space-xl` = 32px (דלתא: -32px). תוכן צף גבוה מדי.
3. **line-height כותרת: 1.9** — לא בטוקנים. צריך 1.3–1.6.
4. **container gap: 16px** — לא בסקאלה (4/8/12/20/32). הקרוב `--space-lg` = 20px (דלתא: -4px).
5. **footer padding: 10px 16px** — לא עקבי עם body padding 20px. צריך 10px 20px (דלתא: +4px אופקי).
6. **גבהים לא עקביים**: שמור=35.5px, ניתוח=37.5px, שיחה=38px — שלושה גבהים שונים בשורה אחת.
7. **היררכיה הפוכה**: "שמור" קיבל Primary CTA (accent מלא) — "שיחה" קיבל accent-soft. פעולת הליבה נראית משנית.
8. **"ניתוח" border color**: `var(--border)` = מדהה ברקע. צריך `var(--muted)`.
9. **split button border broken**: `borderRight: "2px outset rgb(0,0,0)"` — browser default שגוי. נראה שבור לחלוטין.
10. **6 כפתורים בו-זמנית**: 3 פעולות + 3 suggestions = עומס קוגניטיבי.
11. **hint "סמן טקסט" לא מזהיר**: נראה כ-metadata, לא כ-affordance.
12. **footer כרטיס לא נבנה**: mic + ארכיון + hint — 3 elements שלא מדברים.
13. **RTL split button**: border direction לא תקין ב-RTL.

### קריטי ביותר
- היררכיית כפתורים הפוכה (שמור > שיחה במראה, הפוך בחשיבות)
- גבהים לא עקביים בשורת כפתורים
- font-family שגוי בכותרת (David Libre במקום Cormorant)

---

## ממצאי סקירת UI — מאי 2026

### ממצא 1 — welcome padding-top: 8px (קיים), צריך 32px
- **קובץ:** `app/globals.css`, selector `.welcome`
- **ממצא:** `padding: 8px 40px` — ה-8px בראש גורם לתוכן לצוף גבוה מדי ומאבד את תחושת המרכוז האנכי
- **תיקון:** `padding: var(--space-xl) 40px` = 32px בראש
- **למה:** ה-`justify-content: flex-start` מתנהג נכון רק אם יש padding מספיק מהראש. בלעדיו, הכותרת נוחתת ישירות מתחת ל-header ונראית כאילו נשמטה.

### ממצא 2 — `שיחת היכרות` chip — מיקום תלוי, בולט מדי בצד שמאל
- **קובץ:** `app/globals.css`, `app/page.tsx` — `.header-session`
- **ממצא:** ה-chip `שיחת היכרות` מופיע כ-`position: absolute` (ריצה לראש לפי screenshot) ומרוחק מהאלמנטים שהוא מתאר. הוא צף בחלל ריק מתחת לשם `Between` בלי הקשר ויזואלי ברור.
- **תיקון:** להעביר אותו להיות חלק מה-`header-session` row, עם `margin-inline-end: auto` כדי לשבת בצד הנכון. `padding: 4px var(--space-md)`.

### ממצא 3 — בועת AI: background לא-טוקן + gap בין הודעות: 28px hardcoded
- **קובץ:** `app/globals.css`, selectors `.message.assistant .message-body` ו-`#chat`
- **ממצא א:** `background: rgba(253,248,246,0.7)` — ערך שאינו טוקן. הצבע הוא וריאציה של `--bg` ב-70% אטימות. צריך: `background: var(--bg)` או `var(--surface)`.
- **ממצא ב:** `gap: 28px` ב-`#chat` — לא בטוקנים (הסקאלה: 4/8/12/20/32). הכי קרוב הוא `--space-xl` = 32px.
- **תיקון:** `.message.assistant .message-body { background: var(--surface); }` ו-`#chat { gap: var(--space-xl); }`

### ממצא 4 — כפתורי auth screen: border-radius 4px hardcoded, font-size 14px hardcoded
- **קובץ:** `app/page.tsx` — inline styles של `#auth-email`, `#auth-password`, `#signin-btn`, `#signup-btn`
- **ממצא:** `borderRadius: 4` (= `--radius-xs`) על שדות קלט — אבל לפי המערכת, input צריך `--radius-lg` = 16px (כמו `.input-wrap`). כפתורים עם `borderRadius: 4` — צריך `--radius-xl` = 22px (pill). `fontSize: 14` — לא בטוקנים (הסקאלה: 9/11/12/13/15/18/20/22/26/48).
- **תיקון:** `borderRadius: 'var(--radius-lg)'` על inputs, `borderRadius: 'var(--radius-xl)'` על כפתורים, `fontSize: 'var(--fs-body-md)'` = 13px.

### ממצא 5 — copy: "כלי" בדיסקליימר — מילה שאסורה לפי copy-voice.md
- **קובץ:** `app/page.tsx` — `#auth-disclaimer`
- **ממצא:** הטקסט כולל "Between הוא **כלי** לחשיבה" — "כלי" נמצא ברשימת "מילים שלא" ב-`docs/copy-voice.md`. הסיבה: Between היא לא כלי — היא נוכחות.
- **תיקון מוצע (לעבור דרך שון):** "Between נועד לחשיבה ולהבנה עצמית" — ללא המילה "כלי". לסמן לשון לאישור שון לפני עדכון.
