// BW-116 — Compare two "Analyze" pipelines for a therapist's session note, in Winnicott's voice.
// Option A: production session-summary (sonnet + summary prompt + theorist name). No RAG.
// Option B: same, plus Winnicott's FULL voice block + RAG passages from his original texts.
// Run: node scripts/analyze-pipeline-test.mjs  [path-to-note.txt]
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// --- load .env.local ---
for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const MODEL = 'claude-sonnet-4-6';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- sample therapist note (override with a file arg) ---
const noteArg = process.argv[2];
const NOTE = noteArg
  ? fs.readFileSync(noteArg, 'utf8')
  : `פגישה שלישית עם א'. שוב הגיעה באיחור, ושוב פתחה ב"אין לי באמת על מה לדבר היום". הרגשתי בתוכי גל של עצבנות — כמעט אמרתי משהו חד. עצרתי. כשהתחילה לדבר על אמא שלה שמתקשרת כל יום "רק לבדוק", שמתי לב שאני נעשית מנותקת, כמעט משועממת, ואז אשמה על השעמום. בסוף הפגישה, כשאמרתי שנצטרך לסיים, פניה השתנו — לרגע נראתה ילדה קטנה. אמרה "כבר?" בקול אחר לגמרי. נשארתי עם משהו לא גמור, תחושה שהאיחורים והשעמום שלי הם בעצם משהו שקורה בינינו, לא רק עליה.`;

// --- summary prompt (verbatim from lib/summary-prompt.ts) ---
const SUMMARY_SYSTEM_PROMPT = `You are a senior psychoanalytic clinician writing a session summary.
You receive a transcript of a psychoanalytic session and return a structured clinical summary in JSON.
Write all text values in Hebrew. Keep JSON keys in English.

Return ONLY valid JSON. The very first character must be { and the very last must be }. No prose, no markdown code fences.

FORMAT:
{
  "theorist": "name of the theorist conducting the session",
  "session_length": "short | medium | long",
  "themes": ["2-4 central themes that emerged"],
  "key_moments": [
    { "patient_quote": "exact or near-exact patient words", "clinical_significance": "one sentence - why this moment mattered" }
  ],
  "what_opened": "1-2 sentences - what became alive, what surfaced or shifted during the session",
  "what_remained": "1-2 sentences - threads left unresolved, material that was touched but not worked through",
  "theorist_approach": "1-2 sentences - what characterized the theorist's approach in this session. Do NOT use the word 'מטפל' - refer to the theorist by name or as 'הגישה'.",
  "next_session_focus": "1 concrete suggestion - written in first person from the patient's perspective"
}

Rules:
- key_moments: 1-3 items maximum. Choose only the sharpest ones.
- Be clinically precise, not generic.
- INTERPRETATION IS NOT FACT: an interpretation the theorist offered is a hypothesis, not established truth. Never write it as 'was revealed' unless the patient took it up.
- SEPARATE WHO SAID WHAT: distinguish what the patient brought from what the theorist proposed.
- Write in the voice of a thoughtful clinician, not a bureaucrat.`;

const userTemplate = (transcript, theorist, gender) => `
תיאורטיקן: ${theorist}
מגדר המשתמש/ת: ${gender || 'לא ידוע — השתמש בלשון ניטרלית (את/ה)'}

תמליל הסשן:
${transcript}

כתוב סיכום קליני מלא לפי ההנחיות. החזר JSON בלבד.
`;

// --- extract Winnicott's full voice block from lib/theorist-voices.ts ---
function winnicottVoice() {
  const src = fs.readFileSync(new URL('../lib/theorist-voices.ts', import.meta.url), 'utf8');
  const m = src.match(/winnicott: `([\s\S]*?)`,?\s*\n(?:\s*[a-z_]+: `|\};|export)/);
  return m ? m[1] : '';
}

// --- RAG: embed via HF, match via supabase RPC ---
async function getEmbedding(text) {
  const res = await fetch('https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  });
  const result = await res.json();
  const emb = Array.isArray(result[0]) ? result[0] : result;
  const norm = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
  return emb.map(v => v / norm);
}
async function ragPassages(query) {
  try {
    const emb = await getEmbedding(query);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.rpc('match_knowledge_chunks', { query_embedding: emb, match_theorist: 'winnicott', match_count: 6 });
    if (error || !data) { console.error('RAG error:', error); return { text: '', count: 0 }; }
    const passages = data.map(c => `[${c.source_title || ''}${c.source_year ? `, ${c.source_year}` : ''}]:\n${c.content}`).join('\n\n---\n\n');
    return { text: passages ? `\n\nRELEVANT PASSAGES FROM WINNICOTT'S ORIGINAL TEXTS — use them as ground:\n\n${passages}\n` : '', count: data.length };
  } catch (e) { console.error('RAG exception:', e); return { text: '', count: 0 }; }
}

async function call(system, user) {
  const res = await anthropic.messages.create({ model: MODEL, max_tokens: 1500, system, messages: [{ role: 'user', content: user }] });
  return res.content[0]?.type === 'text' ? res.content[0].text : '';
}

const pretty = raw => { try { return JSON.stringify(JSON.parse(raw.match(/\{[\s\S]*\}/)[0]), null, 2); } catch { return raw; } };

(async () => {
  console.log('Running Option A (production summary, no RAG)…');
  const a = await call(SUMMARY_SYSTEM_PROMPT, userTemplate(NOTE, 'winnicott', 'נקבה'));

  console.log('Fetching RAG passages + Winnicott voice for Option B…');
  const rag = await ragPassages(NOTE);
  const voice = winnicottVoice();
  console.log(`  voice block: ${voice.length} chars · RAG passages: ${rag.count}`);
  const systemB = `${voice}\n\n──────────\n\nNow, in the voice and approach above, write a structured clinical session summary.\n\n${SUMMARY_SYSTEM_PROMPT}${rag.text}`;
  console.log('Running Option B (full Winnicott voice + RAG)…');
  const b = await call(systemB, userTemplate(NOTE, 'winnicott', 'נקבה'));

  const out = `# BW-116 — "נתח" pipeline comparison (Winnicott)\n\n## Input note\n\n${NOTE}\n\n---\n\n## Option A — production summary (sonnet, theorist name only, NO RAG)\n\n\`\`\`json\n${pretty(a)}\n\`\`\`\n\n---\n\n## Option B — full Winnicott voice + RAG (${rag.count} passages from his texts)\n\n\`\`\`json\n${pretty(b)}\n\`\`\`\n`;
  fs.mkdirSync(new URL('../eval-reports/', import.meta.url), { recursive: true });
  const path = new URL(`../eval-reports/analyze-pipeline-test-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md`, import.meta.url);
  fs.writeFileSync(path, out);
  console.log('\n' + out);
  console.log('\nSaved to ' + path.pathname);
})();
