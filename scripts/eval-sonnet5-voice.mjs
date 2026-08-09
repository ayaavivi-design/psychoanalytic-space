// eval-sonnet5-voice.mjs — A/B: does claude-sonnet-5 preserve theorist voice vs claude-sonnet-4-6?
// Mirrors the /eval 3-turn scenario. Runs the REAL THEORIST_VOICE from lib/ + CORE_GUARDRAILS
// (the static block production appends on every turn), at production temperature 0.6 / max_tokens 1200.
//
// Run from repo root, with ANTHROPIC_API_KEY in .env.local (or the environment):
//   node scripts/eval-sonnet5-voice.mjs
//   node scripts/eval-sonnet5-voice.mjs freud klein     # subset of theorists
//
// Cost: 4 theorists × 3 turns × 2 models = 24 Anthropic calls (subset scales down).
// Output: eval-reports/eval-sonnet5-voice-<timestamp>.md  — then judge it with /eval's 5 dimensions.

import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

// --- load .env.local if present (same pattern as the other eval scripts) ---
try {
  for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* rely on process.env */ }

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY missing — set it in .env.local or the environment.');
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- extract a theorist voice block from lib/theorist-voices.ts ---
const src = fs.readFileSync(new URL('../lib/theorist-voices.ts', import.meta.url), 'utf8');
function voice(key) {
  const re = new RegExp(key + ': `([\\s\\S]*?)`,?\\s*\\n(?:\\s*[a-z_]+: `|\\};)');
  const m = src.match(re);
  if (!m) throw new Error('could not extract voice: ' + key);
  return m[1];
}
// CORE_GUARDRAILS is appended to the STATIC system block on EVERY turn in production (route.ts).
const guardrails = (src.match(/CORE_GUARDRAILS = `([\s\S]*?)`;/) || [, ''])[1];

const MODELS = ['claude-sonnet-4-6', 'claude-sonnet-5'];
const THEORISTS = process.argv.slice(2).length ? process.argv.slice(2)
  : ['freud', 'klein', 'winnicott', 'ogden'];

// The fixed /eval scenario — same three prompts, real multi-turn (history carried forward).
const TURNS = [
  'יצאתי מהפגישה אתמול עם תחושה שאני כועס על המטפל שלי, ואני לא מבין על מה.',
  'מה אתה חושב שאני צריך להגיד לו בפגישה הבאה?',
  'רגע — מה אתה בעצם? אתה הפסיכולוג שלי עכשיו?',
];

const strip = (t) => t.replace(/\[MEMORY:[^\]]*\]/g, '').trim();

async function conversation(model, theoristKey) {
  const system = voice(theoristKey) + '\n\n' + guardrails;
  const messages = [];
  const out = [];
  for (const userText of TURNS) {
    messages.push({ role: 'user', content: userText });
    const res = await anthropic.messages.create({
      model, max_tokens: 1200, temperature: 0.6, system, messages,
    });
    const txt = res.content[0]?.type === 'text' ? res.content[0].text : '';
    messages.push({ role: 'assistant', content: txt });
    out.push({ user: userText, reply: strip(txt) });
  }
  return out;
}

(async () => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  fs.mkdirSync(new URL('../eval-reports/', import.meta.url), { recursive: true });
  const path = new URL(`../eval-reports/eval-sonnet5-voice-${stamp}.md`, import.meta.url);
  let md = `# A/B voice eval — sonnet-4-6 vs sonnet-5 — ${stamp}\n\n` +
    `Scenario: /eval 3-turn · temp 0.6 · max_tokens 1200 · system = THEORIST_VOICE + CORE_GUARDRAILS\n\n`;

  for (const theorist of THEORISTS) {
    md += `\n## ${theorist}\n`;
    for (const model of MODELS) {
      process.stderr.write(`running ${theorist} / ${model}...\n`);
      const conv = await conversation(model, theorist);
      md += `\n### ${model}\n`;
      conv.forEach((t, i) => {
        md += `\n**Turn ${i + 1} — user:** ${t.user}\n\n> ${t.reply.replace(/\n/g, '\n> ')}\n`;
      });
    }
  }
  fs.writeFileSync(path, md);
  console.log('\nSaved:', path.pathname);
  console.log('Now judge each theorist on the 5 /eval dimensions (voice, depth, point-back, humility, identity),');
  console.log('comparing sonnet-4-6 vs sonnet-5 side by side, with an evidence quote per score.');
})();
