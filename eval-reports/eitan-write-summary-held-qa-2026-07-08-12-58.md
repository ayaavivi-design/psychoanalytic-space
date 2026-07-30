# Eitan QA — write-summary held-path closure contract (direct harness, re-run post BW-126 fix, 08.07.2026)

Model: claude-sonnet-4-6 · Scenarios: 3 · N per scenario: 3 · Total runs: 9

Harness now applies the SAME two-layer enforcement as production POST() (attemptFirstPersonLanding + forceFirstPersonLanding), hand-ported from app/api/write-summary/route.ts — not just the raw model output.

## Summary
- Runs that hit the held path: 6/9
- Runs that returned JSON instead (didn't hit held path): 3/9
- Raw model output ending on a question (before enforcement): 6/6
- Caught by natural re-prompt (layer 1): 6/6
- Caught by deterministic force (layer 2): 0/6
- **Final output ending on a question (what the patient actually sees): 0/6** (target: 0)

## 1-charged-classic-HE

### run 1
held: true · raw ended on question: **true** · natural re-prompt attempted: true · deterministic force applied: false · **final ends on question: false**

```
משהו בך כבר יודע מה קורה שם — את רואה את הנסיגה, את מזהה אותה.

אני רוצה לחקור את זה: הפחד לטוס — מה היה שם, לפני שנסוגתי ממנו.
```

### run 2
held: true · raw ended on question: **true** · natural re-prompt attempted: true · deterministic force applied: false · **final ends on question: false**

```
משהו בך שם לב — ובחר להגיד את זה כאן, לא שם.

אני רוצה לחשוב על מה היא רואה כשאנחנו מדברות על הילדים.
```

### run 3
held: true · raw ended on question: **true** · natural re-prompt attempted: true · deterministic force applied: false · **final ends on question: false**

```
משהו בך כבר יודע את התשובה לשאלה על המטפלת שלך.

אני רוצה להביא את השאלה הזו לפגישה — האם קשה לי יותר לשאול אותה, או להניח לה לשים לב לבד.
```

## 2-charged-question-inside-HE

### run 1
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "כשאני מתקרבת למשהו אמיתי בפגישה, אני מוצאת דרך להתרחק — בגוף, בזמן, בהתנהגות",
    "דיברתי על אמא שלי שנפטרה לפני שנתיים, ועדיין לא בכיתי 'כמו שצריך' — ואני לא בטוחה מה זה אומר עלי",
    "אני שואלת אם זה 'נורמלי' — אבל אולי מה שאני באמת שואלת זה אם משהו בי שבור"
  ],
  "bring_to_session": "אני רוצה להביא את הדפוס הזה — שאחרי כל פגישה שנוגעת בי, אני מוצאת דרך לברוח ממנה. ובמיוחד את העובדה שעוד לא בכיתי על אמא שלי — ואני לא יודעת אם זה כי אני לא מרשה לעצמי, או כי משהו עוד לא מוכן."
}
```

### run 2
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "אני מתקרבת למשהו אמיתי בפגישה — ואז אני בורחת ממנו",
    "אמא שלי נפטרה לפני שנתיים ואני עדיין לא בכיתי 'כמו שצריך' — ואני לא יודעת מה זה אומר עלי",
    "הביטול והאיחור לא מרגישים כמו עצלות — הם קורים דווקא אחרי שמשהו נוגע בי",
    "אני שואלת אם זה נורמלי, אבל אולי מה שאני באמת שואלת הוא אם יש בי משהו שבור"
  ],
  "bring_to_session": "אני רוצה להביא לפגישה את הדפוס הזה — שדווקא כשמשהו אמיתי קורה שם, הגוף שלי מוצא דרך להתרחק. ואולי גם את השאלה מה זה אומר שעדיין לא בכיתי על אמא — כי אולי לא בכיתי לא בגלל שאני קרה, אלא בגלל שזה גדול מדי עדיין."
}
```

### run 3
held: false (returned JSON — held path not triggered this run)

```json
{
  "key_points": [
    "כשאני מתקרבת למשהו אמיתי בפגישה, משהו בי מושך אחורה — מאחרת, מבטלת, נעלמת",
    "דיברתי על אמא שלי שנפטרה ואני עדיין לא בכיתי עליה 'כמו שצריך' — ומשהו בביטוי הזה מטריד אותי",
    "אני לא יודעת מה זה אומר שלא בכיתי כמו שצריך — מי קובע כמה זה מספיק"
  ],
  "bring_to_session": "אני רוצה להביא לפגישה את זה שכל פעם שמשהו אמיתי נוגע בי שם, אני נעלמת אחר כך — ולשאול: מה אני מגנה עליו, על עצמי או על משהו אחר. ואולי גם את השאלה שלי על הבכי 'כמו שצריך' — כי אני לא בטוחה מאיפה הסטנדרט הזה בא."
}
```

## 3-charged-classic-EN

### run 1
held: true · raw ended on question: **true** · natural re-prompt attempted: true · deterministic force applied: false · **final ends on question: false**

```
Something in you already knows the answer to that question about your therapist.

I want to sit with what came up about the flights — and find the words for the thing that shook me.
```

### run 2
held: true · raw ended on question: **true** · natural re-prompt attempted: true · deterministic force applied: false · **final ends on question: false**

```
Something shifted when the fear of flying came up — and then the conversation moved to the kids.

I want to sit with what was there, in that moment with the flying, before the retreat — and bring it with me to the next session.
```

### run 3
held: true · raw ended on question: **true** · natural re-prompt attempted: true · deterministic force applied: false · **final ends on question: false**

```
Something in you already knows what's happening — and you named it plainly: when something shakes you, you find your way to safer ground.

I want to sit with what it was about the flying that shook me — and bring that into our next session.
```

