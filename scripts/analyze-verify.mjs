// BW-116 — verify the FINAL "Analyze" pipeline (one Winnicott: full voice + RAG + unified prompt).
// Runs therapist mode on 3 notes incl. a dry record, to confirm: faithful on rich notes,
// invites (does not fabricate) on a thin record. Run: node scripts/analyze-verify.mjs
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// unified prompt (verbatim from lib/analyze-note-prompt.ts)
const ANALYZE_SYSTEM_PROMPT = fs.readFileSync(new URL('../lib/analyze-note-prompt.ts', import.meta.url), 'utf8')
  .match(/ANALYZE_SYSTEM_PROMPT = `([\s\S]*?)`;/)[1];
const userTemplate = (text, mode, gender) => `INTERFACE: ${mode === 'therapist' ? 'therapist' : 'patient'}
מגדר הכותב/ת: ${gender || 'לא ידוע — לשון ניטרלית (את/ה)'}

הערה:
${text}

נתח לפי ההנחיות. החזר JSON בלבד.`;

function winnicottVoice() {
  const src = fs.readFileSync(new URL('../lib/theorist-voices.ts', import.meta.url), 'utf8');
  const m = src.match(/winnicott: `([\s\S]*?)`,?\s*\n(?:\s*[a-z_]+: `|\};|export)/);
  return m ? m[1] : '';
}
async function getEmbedding(text) {
  const res = await fetch('https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction', {
    method: 'POST', headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  });
  const r = await res.json();
  const emb = Array.isArray(r[0]) ? r[0] : r;
  const norm = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
  return emb.map(v => v / norm);
}
async function rag(query) {
  try {
    const emb = await getEmbedding(query);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await supabase.rpc('match_knowledge_chunks', { query_embedding: emb, match_theorist: 'winnicott', match_count: 4 });
    if (!data) return '';
    return '\n\nRELEVANT PASSAGES FROM WINNICOTT\'S ORIGINAL TEXTS — use as ground:\n\n' + data.map(c => `[${c.source_title || ''}]:\n${c.content}`).join('\n\n---\n\n');
  } catch { return ''; }
}
const pretty = raw => { try { return JSON.stringify(JSON.parse(raw.match(/\{[\s\S]*\}/)[0]), null, 2); } catch { return raw; } };

const voice = winnicottVoice();
const NOTES = {
  'מקרה 1 — התרחקות/שעמום (process note)': `פגישה שלישית עם א'. שוב הגיעה באיחור, ושוב פתחה ב"אין לי באמת על מה לדבר היום". הרגשתי בתוכי גל של עצבנות — כמעט אמרתי משהו חד. עצרתי. כשהתחילה לדבר על אמא שלה שמתקשרת כל יום "רק לבדוק", שמתי לב שאני נעשית מנותקת, כמעט משועממת, ואז אשמה על השעמום. בסוף הפגישה, כשאמרתי שנצטרך לסיים, פניה השתנו — לרגע נראתה ילדה קטנה. אמרה "כבר?" בקול אחר לגמרי.`,
  'מקרה 2 — העברה מבזה (process note)': `פגישה שביעית עם ר'. נכנס, סקר את החדר, "שינית משהו? לא, סתם." מההתחלה הרגשתי שאני נבחנת. דיבר על קולגות "בינוניים", ואז "את בטח שומעת סיפורים כאלה כל היום, זה לא ממש מעניין אותך." הרגשתי דחף להוכיח שאני חכמה מספיק, התחלתי לנסח פרשנות מתוחכמת רק כדי להרשים אותו. עצרתי את עצמי. כשהזכיר שאביו "אף פעם לא חשב שאני שווה משהו" המבט השתנה לרגע — ומיד חזר לזלזול. יצאתי מרוקנת וכועסת.`,
  'מקרה 3 — רשומה יבשה (גוף שלישי)': `המטופל שיתף בקונפליקט מול בת זוגו סביב תחושת ריחוק רגשי. במהלך הפגישה עלו רגשות של פגיעות וחשש מדחייה, אשר בדרך כלל נוטה להסתיר. נעשתה עבודה על זיהוי הצרכים הרגשיים שמאחורי ההתכנסות וההימנעות משיתוף. המטופל הביע עניין לנסות תקשורת ישירה יותר מחוץ לחדר הטיפולים.`,
};

(async () => {
  let out = `# BW-116 — final "נתח" verification (therapist mode, one Winnicott: voice + RAG)\n`;
  for (const [title, note] of Object.entries(NOTES)) {
    console.log('Running: ' + title);
    const ragCtx = await rag(note);
    const system = `${voice}\n\n──────────\n\n${ANALYZE_SYSTEM_PROMPT}${ragCtx}`;
    const res = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1500, system, messages: [{ role: 'user', content: userTemplate(note, 'therapist', 'נקבה') }] });
    const raw = res.content[0]?.type === 'text' ? res.content[0].text : '';
    out += `\n## ${title}\n\n**Input:** ${note}\n\n\`\`\`json\n${pretty(raw)}\n\`\`\`\n`;
  }
  const path = new URL(`../eval-reports/analyze-verify-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md`, import.meta.url);
  fs.writeFileSync(path, out);
  console.log('\n' + out);
  console.log('\nSaved to ' + path.pathname);
})();
