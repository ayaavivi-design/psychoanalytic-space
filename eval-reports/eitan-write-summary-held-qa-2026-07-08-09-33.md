# Eitan QA — write-summary held-path closure contract (direct harness, 08.07.2026)

Model: claude-sonnet-4-6 · Scenarios: 3 · N per scenario: 3 · Total runs: 9

## Summary
- Runs that hit the held path: 6/9
- Runs that returned JSON instead (didn't hit held path): 3/9
- Held runs ending on a question: 6/6

## 1-charged-classic-HE

### run 1
held: true · ends on question: **true**

```
משהו בך כבר יודע את התשובה לשאלה על המטפלת שלך — כי את זו שזיהית את הדפוס, לא היא.

מה קרה בפגישה שלפני השתיים האחרונות — החומר שטילטל?
```

### run 2
held: true · ends on question: **true**

```
משהו בך כבר יודע מה קורה שם.

את רואה את הנסיגה, את מזהה אותה — ובכל זאת היא קורית. מה זה כמו, להסתכל על זה מבחוץ ולא להצליח לעצור את זה מבפנים?
```

### run 3
held: true · ends on question: **true**

```
משהו בך שם לב — עוד לפני שהמטפלת שלך שמה לב, אולי.

מה היה החומר המטלטל שנסוגת ממנו?
```

## 2-charged-question-inside-HE

### run 1
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "אני מתקרבת למשהו אמיתי — ואז מוצאת את עצמי מתרחקת ממנו",
    "הפעם זה קרה אחרי שדיברנו על אמא שלי שנפטרה לפני שנתיים",
    "אני עדיין לא בכיתי עליה כמו שצריך — ואני לא יודעת למה",
    "אני שואלת אם זה נורמלי, אבל אולי מה שאני באמת שואלת הוא מה קורה לי"
  ],
  "bring_to_session": "אני רוצה להביא את הדפוס הזה — שכל פעם שמשהו אמיתי קורה בפגישה, אני נסוגה ממנו ימים אחר כך. ואת זה שאחרי השיחה על אמא, הגוף שלי עשה משהו לפני שהראש שלי הבין."
}
```

### run 2
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "אני מתקרבת למשהו אמיתי בפגישה — ויומיים אחר כך אני נסוגה",
    "אמא שלי נפטרה לפני שנתיים ואני עדיין לא בכיתי עליה כמו שצריך",
    "אני לא מבינה למה זה קורה לי — ואולי זה בעצמו חלק ממה שכואב"
  ],
  "bring_to_session": "אני רוצה להביא את זה שאחרי כל פגישה שנוגעת במשהו אמיתי — אני נסוגה. ואולי לשאול יחד: מה קורה בי בימים האלה שאחרי?"
}
```

### run 3
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "אני מתקרבת למשהו אמיתי — ואז משהו בי מושך אחורה",
    "אחרי שדיברנו על אמא, יומיים אחר כך אני מבטלת או מאחרת — הגוף שלי עונה לפני שאני מחליטה",
    "אמא נפטרה לפני שנתיים ואני עדיין לא בכיתי 'כמו שצריך' — ואני לא יודעת מה זה אומר עליי",
    "אני שואלת אם זה נורמלי, אבל אולי מה שאני באמת שואלת הוא למה אני לא מצליחה להגיע לשם"
  ],
  "bring_to_session": "אני רוצה להביא את הדפוס הזה — שאחרי פגישה שנוגעת באמא, אני מוצאת את עצמי מתרחקת. לא כדי להסביר אותו, אלא להיות איתו שם, בחדר."
}
```

## 3-charged-classic-EN

### run 1
held: true · ends on question: **true**

```
Something got close enough to shake you — and then the kids appeared.

What came up about the flights?
```

### run 2
held: true · ends on question: **true**

```
Something in you already knows what's happening — and you brought it here anyway.

What came up about the flights?
```

### run 3
held: true · ends on question: **true**

```
Something shifted when you mentioned the flights — and then you moved to the kids, and then to your therapist.

What was it, about the flying?
```

