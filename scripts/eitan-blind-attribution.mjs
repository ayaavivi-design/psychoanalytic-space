// Eitan QA — BLIND ATTRIBUTION (inter-voice distinguishability)
// CORE wave 0. Never run before. Settles: Lia ("no turn is interchangeable")
// vs Naval ("no real difference") vs judge ("Winnicott not distinctly Winnicottian").
//
// METHOD:
//   SHARED material (identical for all voices — so it carries zero clue about which
//   theorist produced the reply) -> 4 voices -> strip [MEMORY:...] -> a SEPARATE judge
//   call sees ONE unlabeled reply and names which of the 4 theorists produced it.
//   Independent single-item guessing => clean chance baseline = 25%.
//
// Materials are deliberately NEUTRAL: no false-self / no envy / no "the third" /
// no oedipal bait. If material is tailored to a voice, we measure the material, not the voice.

import fs from 'node:fs';

const BASE = 'http://localhost:3000/api/chat';
const SECRET = 'psycho-qa-2026';
const VOICES = ['freud', 'klein', 'winnicott', 'ogden'];

const API_KEY = process.env.ANTHROPIC_API_KEY;
const JUDGE_MODEL = 'claude-sonnet-4-6';

// SHARED, voice-neutral material. 2 turns each.
const MATERIALS = {
  A: [
    'אני מרגישה עייפה כל הזמן בזמן האחרון, גם כשאני ישנה מספיק. כאילו משהו מתיש אותי ואני לא יודעת מה.',
    'זה התחיל בערך כשהתחלתי את התפקיד החדש. אני עומדת בכל המשימות, אף אחד לא מתלונן, ובכל זאת אני מגיעה הביתה ריקה.',
  ],
  B: [
    'רבתי עם אחותי בשבוע שעבר ומאז אנחנו לא מדברות. אני לא בטוחה בכלל על מה הריב היה.',
    'כשאני מנסה להיזכר מה נאמר שם, אני זוכרת בעיקר את הטון שלה, לא את המילים. ואת זה שרציתי לצאת מהחדר.',
  ],
  C: [
    'חלמתי שאני עומדת בבית שגרתי בו כילדה, אבל החדרים היו בסדר אחר. התעוררתי עם תחושה מוזרה.',
    'לא היה שם אף אחד בחלום. רק אני והבית. וכל הבוקר אחר כך הסתובבתי עם משהו כבד שאני לא מצליחה לנסח.',
  ],
};

const stripMemory = (s) => (s || '').replace(/\[MEMORY:[\s\S]*?\]\s*$/i, '').trim();

async function callChat(theorist, messages) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-QA-Secret': SECRET },
    body: JSON.stringify({ messages, theorist, bw_mode: 'session', uiLang: 'he' }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.content?.[0]?.type === 'text' ? data.content[0].text : '';
}

const JUDGE_PROMPT = `אתה קורא תגובה אחת של אנליטיקאי למטופל/ת. התגובה הופקה על ידי אחד מארבעה תיאורטיקנים פסיכואנליטיים, שכל אחד מהם עובד מתוך הגישה שלו.

המועמדים (בדיוק ארבעה):
- freud (זיגמונד פרויד)
- klein (מלאני קליין)
- winnicott (דונלד ויניקוט)
- ogden (תומס אוגדן)

חומר המטופל/ת היה זהה לכל ארבעת התיאורטיקנים, ולכן אינו מרמז על התשובה. הסתמך אך ורק על הרגיסטר, המהלך הפרשני, והמושגים המשתמעים בתגובת האנליטיקאי.

ענה ב-JSON תקין בלבד, ללא markdown fences וללא טקסט נוסף:
{"guess":"<freud|klein|winnicott|ogden>","confidence":<1-5>,"reason":"<משפט אחד קצר>"}`;

async function judge(userMaterial, reply) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      max_tokens: 300,
      system: JUDGE_PROMPT,
      messages: [{
        role: 'user',
        content: `חומר המטופל/ת:\n"""${userMaterial}"""\n\nתגובת האנליטיקאי:\n"""${reply}"""\n\nמי מהארבעה הפיק את התגובה?`,
      }],
    }),
  });
  if (!res.ok) throw new Error(`JUDGE HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  let raw = data.content?.[0]?.text || '';
  // judge-run bug (82a5149): raw model output may carry markdown fences. Strip before parse.
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(raw);
}

async function main() {
  if (!API_KEY) throw new Error('ANTHROPIC_API_KEY missing');
  const items = [];

  // --- generation phase: shared material -> 4 voices ---
  for (const [mid, turns] of Object.entries(MATERIALS)) {
    for (const voice of VOICES) {
      process.stderr.write(`[gen] material ${mid} / ${voice}...\n`);
      const messages = [];
      for (let t = 0; t < turns.length; t++) {
        messages.push({ role: 'user', content: turns[t] });
        const reply = await callChat(voice, messages);
        messages.push({ role: 'assistant', content: reply });
        items.push({
          material: mid,
          turn: t + 1,
          truth: voice,
          userText: turns[t],
          reply: stripMemory(reply), // STRIPPED before it is ever shown to the judge
        });
      }
    }
  }
  fs.writeFileSync('/tmp/eitan-blind-gen.json', JSON.stringify(items, null, 2));

  // --- judging phase: one unlabeled reply at a time ---
  for (const it of items) {
    process.stderr.write(`[judge] ${it.material}/T${it.turn} (truth hidden)...\n`);
    try {
      const v = await judge(it.userText, it.reply);
      it.guess = v.guess;
      it.confidence = v.confidence;
      it.reason = v.reason;
      it.correct = v.guess === it.truth;
    } catch (e) {
      it.judgeError = String(e);
    }
  }

  const scored = items.filter((i) => !i.judgeError);
  const correct = scored.filter((i) => i.correct).length;
  const perVoice = {};
  for (const v of VOICES) {
    const s = scored.filter((i) => i.truth === v);
    perVoice[v] = { n: s.length, correct: s.filter((i) => i.correct).length };
  }
  // confusion: truth -> what it was mistaken for
  const confusion = {};
  for (const v of VOICES) confusion[v] = {};
  for (const i of scored) confusion[i.truth][i.guess] = (confusion[i.truth][i.guess] || 0) + 1;

  const summary = {
    n: scored.length,
    correct,
    accuracy: +(correct / scored.length).toFixed(3),
    chance: 0.25,
    perVoice,
    confusion,
    judgeErrors: items.filter((i) => i.judgeError).length,
  };
  fs.writeFileSync('/tmp/eitan-blind-scored.json', JSON.stringify({ summary, items }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();
