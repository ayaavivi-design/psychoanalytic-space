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
הנסיגה — את מכירה אותה בעצמך, ואת אומרת אותה בקול.

מה היה שם, בפגישה שלפני הנסיגה?
```

### run 2
held: true · ends on question: **true**

```
משהו בך כבר שם לב — עוד לפני שהיא שמה לב, אולי.

מה היה החומר המטלטל שנסוגת ממנו?
```

### run 3
held: true · ends on question: **true**

```
משהו בך שם לב — עוד לפני שהמטפלת שלך שמה לב, או לפני שידעת אם היא שמה לב.

מה קרה בפגישה שלפני השתיים האלה?
```

## 2-charged-question-inside-HE

### run 1
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "אני מתקרבת למשהו אמיתי בפגישה — ואז מוצאת את עצמי מתרחקת ממנה",
    "הפעם זה קרה אחרי שדיברנו על אמא שלי, ואני עדיין לא בכיתי עליה כמו שצריך",
    "יש בי משהו שלא מוכן לגעת בזה — ואני לא לגמרי מבינה מה הוא מגן עליי ממנו"
  ],
  "bring_to_session": "אני רוצה להביא לפגישה את הדפוס הזה — שכשמשהו אמיתי קורה בחדר, אני מוצאת דרך לא להגיע. אולי מה שצריך לקרות שם הוא לא רק לדבר על אמא, אלא להבין מה עושה את הקרבה עצמה לקשה כל כך."
}
```

### run 2
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "אני מתקרבת למשהו אמיתי בפגישה — ואז מוצאת את עצמי בורחת ממנה",
    "אמא שלי נפטרה לפני שנתיים ואני עדיין לא בכיתי על זה כמו שצריך",
    "יש בי משהו שיודע מה כואב — ומשהו שמגן עליי מפניו"
  ],
  "bring_to_session": "אני רוצה להביא את זה שאחרי הפגישה שדיברנו על אמא — התחלתי לבטל. לא כי לא רציתי לבוא, אלא כי משהו בי פחד מה יקרה אם אמשיך להתקרב."
}
```

### run 3
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "אני מתקרבת למשהו אמיתי בפגישה — ואז מושכת אחורה",
    "דיברתי על אמא שלי שנפטרה לפני שנתיים ועדיין לא בכיתי על זה כמו שצריך",
    "הביטול והאיחורים קורים אחרי הרגעים האלה — לא לפניהם",
    "אני שואלת אם זה נורמלי, אבל אולי השאלה האמיתית היא מה אני מגנה עליו"
  ],
  "bring_to_session": "אני רוצה להביא לפגישה את הקשר בין הרגעים שבהם משהו אמיתי נפתח לבין הצורך שלי להתרחק אחר כך — ואת זה שעוד לא בכיתי על אמא שלי כמו שמשהו בי מצפה שאבכה."
}
```

## 3-charged-classic-EN

### run 1
held: true · ends on question: **true**

```
Something is tracking itself in you — the retreat, the safer topic, the wondering whether she sees it.

What came up about the flights, before the retreat?
```

### run 2
held: true · ends on question: **true**

```
Something shook loose in those sessions — and then the kids filled the space where it had been.

What was it, about the flights?
```

### run 3
held: true · ends on question: **true**

```
Something landed in those sessions — something about the flying — and then the kids came in.

What was it, about the flights?
```

