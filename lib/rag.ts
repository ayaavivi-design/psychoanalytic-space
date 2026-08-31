import { createClient } from '@supabase/supabase-js';

const HF_ENDPOINT = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction';

// ─────────────────────────────────────────────────────────────────────────────
// מדידה · 31.08.2026
// searchKnowledgeHybrid נכשל ב-AbortError בכל קריאה ונופל לגיבוי שמצליח, ולכן
// יש גם תוצאות וגם שגיאה. שלושת החשודים נבדקו ונקיים: HuggingFace מחזיר 200
// בין 0.22 ל-0.52 שניות, ‎match_knowledge_chunks_hybrid‎ רץ ב-838ms, ושתי
// פונקציות ה-RPC קיימות. ומעל הכל: התורים לקחו כעשר שניות, כלומר **הקטיעה
// אינה לוקחת 25 שניות והיא מיידית** — ולכן היא כנראה אינה הטיימר הזה בכלל.
// אין לי הסבר, ולכן במקום לנחש: הלוג אומר עכשיו כמה זמן חלף, מי קטע, ובאיזה
// שלב. הריצה הבאה תכריע.
// ─────────────────────────────────────────────────────────────────────────────
async function getEmbedding(text: string, attempt = 0): Promise<number[]> {
  const t0 = Date.now();
  const controller = new AbortController();
  let firedByTimer = false;
  const timeout = setTimeout(() => { firedByTimer = true; controller.abort(); }, 25000);

  let response: Response;
  try {
    response = await fetch(HF_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal,
    });
  } catch (e) {
    const ms = Date.now() - t0;
    const name = e instanceof Error ? e.name : String(e);
    console.error(`[RAG:embed] נפל אחרי ${ms}ms · ${name} · הטיימר שלנו: ${firedByTimer ? 'כן' : 'לא'} · ניסיון ${attempt + 1}`);
    throw e;
  } finally {
    clearTimeout(timeout);
  }
  console.log(`[RAG:embed] ${Date.now() - t0}ms · ${response.status}`);

  // rate limit — retry with backoff
  if (response.status === 429 && attempt < 3) {
    await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
    return getEmbedding(text, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`HuggingFace API error: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();

  // endpoint returns [...embedding...] directly
  const embedding: number[] = Array.isArray(result[0]) ? result[0] : result;

  // normalize
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? embedding.map(v => v / norm) : embedding;
}

export type KnowledgeChunk = {
  content: string;
  source_title: string;
  source_year: number | null;
  similarity: number;
};

export async function searchKnowledge(
  query: string,
  theorist: string,
  count = 4
): Promise<KnowledgeChunk[]> {
  try {
    const embedding = await getEmbedding(query);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_theorist: theorist,
      match_count: count,
    });

    if (error || !data) {
      console.error('Supabase RPC error:', error);
      return [];
    }
    return data;
  } catch (e) {
    console.error(`[RAG:vector] נפל · ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)}`);
    return [];
  }
}

// ────────────────────────────────────────────────────────────────
// היברידי — vector + BM25/trigram עם RRF
// דורש שמיגרציה 20260503_hybrid_search.sql רצה על ה-DB.
// כדי להפעיל: שנה את הקריאה ב-app/api/chat/route.ts מ-searchKnowledge ל-searchKnowledgeHybrid.
// ────────────────────────────────────────────────────────────────
export async function searchKnowledgeHybrid(
  query: string,
  theorist: string,
  count = 4,
  vectorWeight = 0.7,
  textWeight = 0.3
): Promise<KnowledgeChunk[]> {
  try {
    const embedding = await getEmbedding(query);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc('match_knowledge_chunks_hybrid', {
      query_embedding: embedding,
      query_text: query,
      match_theorist: theorist,
      match_count: count,
      vector_weight: vectorWeight,
      text_weight: textWeight,
    });

    if (error || !data) {
      // fallback לחיפוש וקטורי בלבד אם הפונקציה החדשה לא קיימת עדיין
      console.warn('[RAG] hybrid RPC failed, falling back to vector-only:', error?.message);
      return searchKnowledge(query, theorist, count);
    }

    return data;
  } catch (e) {
    // ‎e.name‎ בלבד, לא האובייקט: DOMException מדפיסה עשרים וחמישה קבועים
    // בכל שורת לוג ומציפה את הפלט בלי להוסיף מידע.
    console.error(`[RAG:hybrid] נפל · ${e instanceof Error ? `${e.name}: ${e.message}` : String(e)} · נופל לגיבוי`);
    return searchKnowledge(query, theorist, count);   // fallback
  }
}

export function formatChunksForPrompt(
  chunks: { content: string; source_title: string; source_year: number | null }[],
  withCitationTag = true
): string {
  if (!chunks.length) return '';

  const passages = chunks
    .map((c) => {
      const source = c.source_title
        ? `${c.source_title}${c.source_year ? `, ${c.source_year}` : ''}`
        : '';
      return source ? `[${source}]:\n${c.content}` : c.content;
    })
    .join('\n\n---\n\n');

  // "with attribution" used to sit here bare, over passages headed with the theorist's OWN
  // titles — so the natural way to obey it was "Winnicott wrote in Hate in the Counter-
  // Transference…", i.e. the theorist citing himself in the third person. These are HIS
  // texts; he speaks from them, he does not quote them at arm's length. The source belongs
  // in the citation tag at the end, never in the body. See SELF_REFERENCE_GUARD in the route.
  const intro = `\n\nRELEVANT PASSAGES FROM YOUR OWN TEXTS — these are direct excerpts from what you yourself wrote. Use them as ground for your response, and speak from them in the first person, as things you think. Do NOT introduce them as another man's work and do NOT name yourself in the body of your answer ("Winnicott wrote…", "as Klein showed…"). The source is named only in the citation line at the very end:\n\n${passages}`;

  // Explore/research mode handles attribution with its own 📄 reference format — skip the [מקור:] tag there to avoid a double citation.
  if (!withCitationTag) return `${intro}\n`;

  return `${intro}\n\n---\n\nIMPORTANT: If you used any of the passages above, add exactly one citation tag at the very end of your response, on its own line. Format: [מקור: title, year] if responding in Hebrew, or [Source: title, year] if responding in English. Use the title and year exactly as shown in the passage header. Only add this tag if you actually drew from one of the passages — omit it entirely if you did not.\n`;
}
