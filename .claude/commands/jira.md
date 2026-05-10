# Jira — ניהול משימות ופיתוח Between

**פרויקט ברירת מחדל:** BW (שם: "Team Between" | Board ID: 1)
**סוכנים עם גישה:** הילי, סם, אדם, איתן
**שרת MCP:** Atlassian (https://mcp.atlassian.com/v1/sse)

---

## מה הסקיל הזה עושה

נהל את לוח ג'ירה של Between — יצירת issues, עדכון סטטוס, ניהול ספרינטים, וסנכרון עם ה-OPEN_DECISIONS.md.

**תמיד השתמש בפרויקט BW** אלא אם הבקשה מציינת אחרת.

**שפה: כל ה-issues בג'ירה — כותרת ותיאור — חייבים להיות באנגלית בלבד. שפה פשוטה וברורה.**

---

## פעולות זמינות

### 1. יצירת Issue
```
/jira create [task|bug|story|epic] "[כותרת]"
```
- **Task** — משימה כללית, שיפור, תחזוקה
- **Bug** — תקלה שדווחה ע"י QA או משתמש
- **Story** — פיצ'ר חדש מנקודת מבט משתמש
- **Epic** — יוזמה גדולה שמכילה מספר stories

### 2. חיפוש ושאילתות
```
/jira search "[שאלה חופשית או JQL]"
/jira sprint — הצג את הספרינט הנוכחי
/jira board — כל ה-issues הפתוחים
```

### 3. עדכון סטטוס
```
/jira done [BTW-XXX]
/jira update [BTW-XXX] status "[To Do|In Progress|In Review|Done]"
```

### 4. ספרינטים
```
/jira sprint new "[שם]" [תאריך התחלה] [תאריך סיום]
/jira sprint add [BTW-XXX] — הוסף issue לספרינט הנוכחי
/jira sprint close — סגור ספרינט נוכחי
```

### 5. סנכרון החלטות → Jira
```
/jira sync-decisions
```
קורא את OPEN_DECISIONS.md ויוצר Jira task לכל החלטה פתוחה.

---

## פורמט Issue לפי סוג

### Task
- **Summary:** פועל + מה ("Add payment integration", "Fix onboarding bug")
- **Description:** למה זה חשוב, מה צריך לקרות, הגדרת Done
- **Priority:** High / Medium / Low
- **Label:** שם הסוכן שיצר (eitan-qa, hili-pm, etc.)

### Bug
- **Summary:** `[BUG] [component] — תיאור קצר`
- **Description:**
  - מה קרה: [תיאור]
  - מה היה צריך לקרות: [ציפייה]
  - שלבים לשחזור: [steps]
  - חומרה: Critical / High / Medium
- **Priority:** תמיד High אם זה safety issue
- **Label:** `qa-report`, `safety` (אם רלוונטי)

### Story
- **Summary:** `As a [user], I want [action] so that [outcome]`
- **Description:** Acceptance criteria ממוספרים
- **Label:** `roadmap`

---

## כיצד להשתמש בכלי MCP

בעת ביצוע, השתמש בכלי Atlassian MCP הזמינים:

- **יצירת issue:** חפש כלי בשם `create_jira_issue` או `jira_create_issue`
- **חיפוש:** חפש כלי JQL search
- **עדכון/transition:** חפש כלי update או transition
- **ספרינטים:** חפש כלי sprint management

לפני כל פעולה — ציין מה בדיוק אתה הולך לעשות ואמת עם המשתמש לפני ביצוע.

---

## סנכרון OPEN_DECISIONS.md → Jira (פירוט)

כאשר מופעל `/jira sync-decisions`:

1. קרא את `OPEN_DECISIONS.md`
2. עבור כל החלטה פתוחה — בדוק אם כבר קיים Jira task עם label `open-decision` ואותה כותרת
3. אם לא קיים — צור task:
   - Summary: שם ההחלטה
   - Description: הפירוט מהקובץ כולל "למה זה חשוב" ו"אופציות על השולחן"
   - Label: `open-decision`
   - Priority: High (ברירת מחדל לכל החלטה תקועה)
4. דווח: אילו tasks נוצרו, אילו כבר קיימים, אילו דולגו

---

## פורמט דוח לאחר כל פעולה

```
✅ Jira — פעולות שבוצעו

פרויקט: BTW | תאריך: [DATE]

נוצר:
  [BTW-XXX] [Summary] — [סוג] | [Priority]

עודכן:
  [BTW-XXX] → [סטטוס חדש]

לא בוצע:
  [תיאור הסיבה]
```

---

## כללים

- לעולם אל תיצור issue בלי לציין Summary ברור
- bugs שמגיעים מ-QA מקבלים תמיד label `qa-report`
- issues שנסגרים ב-OPEN_DECISIONS.md → עדכן ל-Done בג'ירה
- ספרינט: שבועיים. תאריך התחלה תמיד יום ראשון.
