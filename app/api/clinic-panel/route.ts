import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

// /api/clinic-panel — SKELETON (Aya, 24.07.2026)
// Runs the 3-lens clinic fidelity panel on a conversation, EACH REVIEWER ON A DIFFERENT MODEL.
// Breaking the shared-model correlation is what moves the panel from "tripwire" toward "proof".
//
// STATUS: skeleton. Local-first. Not wired to a cron. Vera stays on Anthropic until OPENAI_API_KEY exists.
// ⚠️ Vercel caveat: reads agents/*.md at runtime via fs. Works locally; on Vercel the agents/ dir must be
//    bundled into the function (includeFiles / outputFileTracingIncludes) — handle when we deploy, not now.

export const maxDuration = 60;

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// ── Panel routing — the whole point. One reviewer per engine. Swap `engine` to re-route. ──
type Engine = 'anthropic' | 'gemini' | 'openai';
const PANEL: Record<string, { engine: Engine; promptFile: string; label: string }> = {
  lia:    { engine: 'anthropic', promptFile: 'agents/lia-prompt.md',            label: 'ליה (קלייניאנית-ויניקוטיאנית)' },
  vera:   { engine: 'openai',    promptFile: 'agents/reviewer-vera-prompt.md',  label: 'ורה (ביוניאנית)' },
  elliot: { engine: 'gemini',    promptFile: 'agents/reviewer-elliot-prompt.md', label: 'אליוט (לאקאני)' },
};

// ── Engine adapters — same signature, different vendor. ──
async function callAnthropic(system: string, user: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1500,
    system,
    messages: [{ role: 'user', content: user }],
  });
  return res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('');
}

async function callGemini(system: string, user: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 1500 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '';
}

async function callOpenAI(system: string, user: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

function runEngine(engine: Engine, system: string, user: string): Promise<string> {
  if (engine === 'anthropic') return callAnthropic(system, user);
  if (engine === 'gemini') return callGemini(system, user);
  return callOpenAI(system, user);
}

async function loadPrompt(promptFile: string): Promise<string> {
  return readFile(path.join(process.cwd(), promptFile), 'utf-8');
}

// ── The task each reviewer receives (blind read from their own lens). ──
function reviewTask(material: string): string {
  return `להלן חומר-שיחה מ-Between (מטופל מול תיאורטיקן) לניתוח קליני.

קרא/י אותו מהעדשה שלך בלבד, לבד, בלי להתייחס למבקרים אחרים. תן/י:
1. **ייחוס:** לאיזה מ-4 הקולות (פרויד/קליין/ויניקוט/אוגדן) היית מייחס/ת, והפיצ'ר שהכריע. אם אי אפשר לדעת — זה הממצא החשוב ביותר.
2. **שיפוט מהעדשה שלך** — נחיתה/הכלה/כבוד-לחוסר לפי הטבע שלך — עם סולם חומרה (Tier 1-4) וציטוט.

--- החומר ---
${material}`;
}

const ENGINE_LABEL: Record<Engine, string> = { anthropic: 'Claude', openai: 'GPT-4o', gemini: 'Gemini' };

function synthTask(reads: { lia: string; vera: string; elliot: string }): string {
  const routing = `ליה=${ENGINE_LABEL[PANEL.lia.engine]}, ורה=${ENGINE_LABEL[PANEL.vera.engine]}, אליוט=${ENGINE_LABEL[PANEL.elliot.engine]}`;
  return `שלושה מבקרים קליניים קראו את אותו חומר, כל אחד מעדשה שונה ועל מודל שונה (${routing}). הצלב/י:
- **הסכמה** (ייחוס + פסק) = אות חזק
- **מחלוקת** = אבחנתי (הקול עמום בדיוק שם)
- **פסק:** סולם החומרה שלך (ליה) קובע. שורה תחתונה אחת.
- **⚠️ עצמאות:** אם ההסכמה חשודה כהטיה משותפת — אמרי זאת.

**ליה —**
${reads.lia}

**ורה —**
${reads.vera}

**אליוט —**
${reads.elliot}`;
}

export async function POST(req: NextRequest) {
  // secret-gate — same convention as /api/qa-full
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let material = '';
  try {
    const body = await req.json();
    material = (body?.material || '').toString().trim();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  if (!material) return NextResponse.json({ error: 'missing "material"' }, { status: 400 });

  try {
    // 1. Load persona prompts.
    const [liaP, veraP, elliotP] = await Promise.all([
      loadPrompt(PANEL.lia.promptFile),
      loadPrompt(PANEL.vera.promptFile),
      loadPrompt(PANEL.elliot.promptFile),
    ]);
    const task = reviewTask(material);

    // 2. Three independent reads, in parallel, each on its own engine.
    //    allSettled so one missing key / failing engine doesn't sink the whole panel —
    //    you get the reviewers that ran, plus a clear message for the one that didn't.
    const settled = await Promise.allSettled([
      runEngine(PANEL.lia.engine, liaP, task),
      runEngine(PANEL.vera.engine, veraP, task),
      runEngine(PANEL.elliot.engine, elliotP, task),
    ]);
    const val = (i: number) =>
      settled[i].status === 'fulfilled'
        ? (settled[i] as PromiseFulfilledResult<string>).value
        : `⚠️ [read failed] ${(settled[i] as PromiseRejectedResult).reason?.message || 'unknown error'}`;
    const lia = val(0), vera = val(1), elliot = val(2);

    // 3. Synthesis — Lia (senior) cross-tabulates, on Anthropic (skipped if Lia's own read failed).
    const synthesis =
      settled[0].status === 'fulfilled'
        ? await callAnthropic(liaP, synthTask({ lia, vera, elliot }))
        : '⚠️ [synthesis skipped — Lia read failed]';

    return NextResponse.json({
      engines: { lia: PANEL.lia.engine, vera: PANEL.vera.engine, elliot: PANEL.elliot.engine },
      lia,
      vera,
      elliot,
      synthesis,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
