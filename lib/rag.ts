import { createClient } from '@supabase/supabase-js';

const HF_ENDPOINT = 'https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction';

async function getEmbedding(text: string, attempt = 0): Promise<number[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000); // 25s — מספיק ל-HF cold start

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
  } finally {
    clearTimeout(timeout);
  }

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
    console.error('RAG search error:', e);
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
    console.error('RAG hybrid search error:', e);
    return searchKnowledge(query, theorist, count);   // fallback
  }
}

export function formatChunksForPrompt(
  chunks: { content: string; source_title: string; source_year: number | null }[]
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

  return `\n\nRELEVANT PASSAGES FROM ORIGINAL TEXTS — these are direct excerpts. Use them as ground for your response. You may quote directly with attribution:\n\n${passages}\n\n---\n\nIMPORTANT: If you used any of the passages above, add exactly one citation tag at the very end of your response, on its own line. Format: [מקור: title, year] if responding in Hebrew, or [Source: title, year] if responding in English. Use the title and year exactly as shown in the passage header. Only add this tag if you actually drew from one of the passages — omit it entirely if you did not.\n`;
}
