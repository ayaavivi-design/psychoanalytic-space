// register-gap-verify.mjs — שער ליה: האם הפרפרז מרים את המילים האמיתיות של איה מעל 0.59?
// before (raw) מול after (paraphrased), וקטור-בלבד, apples-to-apples מול הטבלה של ליה (12.07).
// לוקאלי בלבד, קריאה — לא נדחף. הרצה: node scripts/register-gap-verify.mjs
import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .map(l => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean)
    .map(m => [m[1], m[2]])
);
const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const SKEY = env.SUPABASE_SERVICE_ROLE_KEY;
const HF   = env.HUGGINGFACE_API_KEY;
const ANTH = env.ANTHROPIC_API_KEY;
const HF_URL = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction';

const PARAPHRASE_SYSTEM = `You reframe a patient's own words (usually colloquial Hebrew) into a short, neutral search query for a psychoanalytic knowledge base written in English.

Rules:
- Output 2–3 short sentences of plain theoretical English describing the emotional theme and psychic experience present in the text.
- Translate affect and theme into theoretical vocabulary (e.g. fragmentation, disconnection, loss, control, shame, longing) — but stay DESCRIPTIVE.
- Do NOT diagnose, interpret, or infer hidden meaning. Describe what is present, not what it "really means".
- Do NOT address the patient, do NOT give advice, do NOT ask questions.
- Output only the reframed query text — no preamble, no quotes, no labels.`;

async function paraphrase(q) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTH, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 150, system: PARAPHRASE_SYSTEM, messages: [{ role: 'user', content: q }] }),
  });
  const j = await r.json();
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim() || q;
}

async function emb(text) {
  const r = await fetch(HF_URL, { method: 'POST', headers: { Authorization: `Bearer ${HF}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs: text }) });
  const raw = await r.json();
  const v = Array.isArray(raw[0]) ? raw[0] : raw;
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return n > 0 ? v.map(x => x / n) : v;
}

async function topSim(q, theorist) {
  const e = await emb(q);
  const r = await fetch(`${SUPA}/rest/v1/rpc/match_knowledge_chunks`, {
    method: 'POST', headers: { apikey: SKEY, Authorization: `Bearer ${SKEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query_embedding: e, match_theorist: theorist, match_count: 4 }),
  });
  const d = await r.json();
  return Array.isArray(d) && d.length ? Math.max(...d.map(c => c.similarity || 0)) : 0;
}

const SENTENCES = [
  'כאב בגרון ומועקה',
  'למה הכל כל כך מורכב אצלי ומנותק?',
  'זה העליב אותי... הכי משוחרר שיכול להיות',
];
const VOICES = ['freud', 'klein', 'winnicott', 'ogden'];

console.log('שער register-gap — before(raw) מול after(paraphrase), top-sim, רף 0.59\n');
for (const s of SENTENCES) {
  const para = await paraphrase(s);
  console.log(`\n📝 "${s}"`);
  console.log(`   → paraphrase: "${para.replace(/\n/g, ' ')}"`);
  const rawS = {}, parS = {};
  for (const v of VOICES) { rawS[v] = await topSim(s, v); parS[v] = await topSim(para, v); }
  for (const v of VOICES) {
    const cross = parS[v] >= 0.59 ? '✅' : '❌';
    const delta = (parS[v] - rawS[v] >= 0 ? '+' : '') + (parS[v] - rawS[v]).toFixed(3);
    console.log(`   ${v.padEnd(10)} raw ${rawS[v].toFixed(3)} → para ${parS[v].toFixed(3)} (${delta}) ${cross}`);
  }
}
