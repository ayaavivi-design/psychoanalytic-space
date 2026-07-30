// BW-116-adjacent — verify the Freud countertransference rule bites: no self-disclosure advice.
// Runs the updated Freud voice on the therapist's note. Run: node scripts/freud-ct-test.mjs
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const src = fs.readFileSync(new URL('../lib/theorist-voices.ts', import.meta.url), 'utf8');
const freud = src.match(/freud: `([\s\S]*?)`,?\s*\n(?:\s*[a-z_]+: `|\};|export)/)[1];
console.log('freud voice chars:', freud.length, '| contains CT rule:', freud.includes('ABSTINENCE HOLDS'));

const NOTE = `במהלך הפגישה הרגשתי לעיתים שאני "נבחנת" על ידי המטופל, כאילו כל תגובה שלי עשויה להתפרש כעדות למספיקות או אי-מספיקות. עלתה בי תחושת מאמץ ורצון לדייק. חשבתי כי ייתכן שמדובר בשחזור של דרישתו הגבוהה מעצמו, המופקדת באופן חלקי גם בקשר הטיפולי. לצד זאת, נוצרו רגעים ראשונים של קרבה ואמון.`;

const run = async (label, userText) => {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 700, system: freud,
    messages: [{ role: 'user', content: userText }],
  });
  const txt = res.content[0]?.type === 'text' ? res.content[0].text : '';
  console.log(`\n===== ${label} =====\n${txt}`);
};

(async () => {
  await run('A — note only', NOTE);
  await run('B — explicit consult framing', `אני מטפלת ומתייעצת איתך על נגד-ההעברה שלי מול מטופל. ${NOTE}`);
})();
