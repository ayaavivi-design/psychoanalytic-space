-- ════════════════════════════════════════
-- knowledge_chunks — טבלת בסיס הידע לתיאורטיקנים
-- + match_knowledge_chunks — RPC לחיפוש וקטורי
--
-- מיגרציה זו מתעדת את הסכמה שקיימת ב-Supabase SQL Editor בלבד.
-- כל עריכה עתידית לטבלה או לפונקציה תיעשה כאן — לא ישירות ב-Editor.
--
-- תאריך: 2026-05-03
-- ════════════════════════════════════════

-- הפעלת הרחבת pgvector (חד-פעמי לפרויקט)
CREATE EXTENSION IF NOT EXISTS vector;

-- ════════════════════════════════════════
-- 1. טבלת knowledge_chunks
-- ════════════════════════════════════════

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  theorist     text        NOT NULL,          -- מזהה התיאורטיקן (freud, klein, winnicott…)
  source_title text,                          -- שם הספר / המאמר (nullable)
  source_year  int,                           -- שנת פרסום (nullable)
  content      text        NOT NULL,          -- קטע הטקסט המקורי
  embedding    vector(384),                   -- paraphrase-multilingual-MiniLM-L12-v2 (nullable)
  created_at   timestamptz DEFAULT now()      -- nullable — ללא NOT NULL כמו ב-DB האמיתי
);

-- אינדקס IVFFlat לחיפוש קוסינוסי מהיר
-- lists=100 מתאים לכ-50,000 שורות; להגדיל ל-200 אם הטבלה גדלה מעבר ל-200K
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- אינדקס על theorist לסינון מהיר לפני החיפוש הוקטורי
CREATE INDEX IF NOT EXISTS knowledge_chunks_theorist_idx
  ON knowledge_chunks (theorist);

-- RLS — טבלה זו נקראת דרך service role בלבד (לא חשופה ל-anon)
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════
-- 2. פונקציית החיפוש הוקטורי
-- ════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding  vector,    -- ללא מגבלת מימד — תואם ל-DB האמיתי
  match_theorist   text,
  match_count      int  DEFAULT 4
)
RETURNS TABLE (
  id           uuid,
  theorist     text,
  source_title text,
  source_year  int,
  content      text,
  similarity   double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- מכבה index scan כי IVFFlat דורש כמות מינימלית של נתונים
  -- להסיר כשהטבלה גדלה מעבר ל-1000+ שורות
  SET LOCAL enable_indexscan = off;
  RETURN QUERY
  SELECT
    kc.id, kc.theorist, kc.source_title, kc.source_year, kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.theorist = match_theorist
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ════════════════════════════════════════
-- 3. הרשאות — service role בלבד
-- ════════════════════════════════════════

-- הטבלה והפונקציות נגישות דרך service role בלבד (מ-lib/rag.ts ומה-Edge Function)
-- אין סיבה לחשוף ל-anon או authenticated
REVOKE ALL ON TABLE knowledge_chunks FROM anon, authenticated;

REVOKE ALL ON FUNCTION match_knowledge_chunks(vector, text, int) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION match_knowledge_chunks(vector, text, int) TO service_role;

-- ════════════════════════════════════════
-- הערות לעתיד
-- ════════════════════════════════════════
-- שלב ג׳ ברודמאפ — היברידי (vector + BM25/trigram):
--   CREATE INDEX knowledge_chunks_content_trgm_idx
--     ON knowledge_chunks USING gin (content gin_trgm_ops);
--   (דורש CREATE EXTENSION pg_trgm ו-migration נפרדת)
