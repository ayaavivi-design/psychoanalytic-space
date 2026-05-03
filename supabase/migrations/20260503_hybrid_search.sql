-- ════════════════════════════════════════
-- היברידי — vector + BM25/trigram
--
-- מה זה עושה:
--   1. מוסיף עמודת tsvector מחושבת לחיפוש מלא (Hebrew + English)
--   2. מוסיף אינדקס trigram לחיפוש fuzzy
--   3. מוסיף פונקציה match_knowledge_chunks_hybrid
--      שמשלבת את שני הציונים עם RRF (Reciprocal Rank Fusion)
--
-- לא נוגע ב-match_knowledge_chunks הקיימת — אפשר לחזור אחורה בכל שלב.
-- כדי להפעיל: החלף את הקריאה ב-lib/rag.ts מ-match_knowledge_chunks ל-match_knowledge_chunks_hybrid
--
-- תאריך: 2026-05-03
-- ════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ════════════════════════════════════════
-- 1. עמודת full-text search — 'simple' config
-- ════════════════════════════════════════
-- 'simple' lowercases ומחלקת לטוקנים — עובד גם לעברית (ללא stemming)
-- GENERATED ALWAYS AS STORED — מחושב אוטומטית בכל INSERT/UPDATE
ALTER TABLE knowledge_chunks
  ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

-- ════════════════════════════════════════
-- 2. אינדקסים
-- ════════════════════════════════════════

-- GIN על tsvector לחיפוש מלא
CREATE INDEX IF NOT EXISTS knowledge_chunks_content_tsv_idx
  ON knowledge_chunks USING gin (content_tsv);

-- GIN trigram לחיפוש חלקי / fuzzy
CREATE INDEX IF NOT EXISTS knowledge_chunks_content_trgm_idx
  ON knowledge_chunks USING gin (content gin_trgm_ops);

-- ════════════════════════════════════════
-- 3. פונקציית חיפוש היברידי — RRF
-- ════════════════════════════════════════
-- RRF (Reciprocal Rank Fusion): score = Σ 1/(k + rank)
--   k=60 — ערך סטנדרטי (TREC 2009)
-- vector_weight / text_weight — שולטים בחלוקה; ברירת מחדל 0.7/0.3
-- כשאין התאמת טקסט (שאלה מופשטת) — הפונקציה נשענת על וקטורים בלבד
-- ════════════════════════════════════════

CREATE OR REPLACE FUNCTION match_knowledge_chunks_hybrid(
  query_embedding  vector,    -- ללא מגבלת מימד — תואם ל-match_knowledge_chunks
  query_text       text,
  match_theorist   text,
  match_count      int   DEFAULT 4,
  vector_weight    float DEFAULT 0.7,
  text_weight      float DEFAULT 0.3
)
RETURNS TABLE (
  content      text,
  source_title text,
  source_year  int,
  similarity   double precision
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  candidate_pool int := match_count * 5;   -- רשת רחבה לפני ה-RRF
  rrf_k          int := 60;
BEGIN
  RETURN QUERY
  WITH

  -- ── שלב א׳: מועמדים וקטוריים ──────────────────────────────────────────
  vector_candidates AS (
    SELECT
      kc.id,
      kc.content,
      kc.source_title,
      kc.source_year,
      ROW_NUMBER() OVER (ORDER BY kc.embedding <=> query_embedding) AS vrank
    FROM knowledge_chunks kc
    WHERE kc.theorist = match_theorist
    ORDER BY kc.embedding <=> query_embedding
    LIMIT candidate_pool
  ),

  -- ── שלב ב׳: מועמדים טקסטואליים (BM25-like via ts_rank_cd) ────────────
  -- plainto_tsquery מקבל שאילתה חופשית (לא צריך לנקות את הקלט)
  -- @@ operator מסנן רק שורות שיש להן לפחות token אחד מהשאילתה
  text_candidates AS (
    SELECT
      kc.id,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(kc.content_tsv, plainto_tsquery('simple', query_text)) DESC
      ) AS trank
    FROM knowledge_chunks kc
    WHERE
      kc.theorist = match_theorist
      AND kc.content_tsv @@ plainto_tsquery('simple', query_text)
    ORDER BY ts_rank_cd(kc.content_tsv, plainto_tsquery('simple', query_text)) DESC
    LIMIT candidate_pool
  ),

  -- ── שלב ג׳: RRF ───────────────────────────────────────────────────────
  fused AS (
    SELECT
      vc.id,
      vc.content,
      vc.source_title,
      vc.source_year,
      -- ציון RRF = חלק וקטורי + חלק טקסטואלי (אם קיים)
      (vector_weight  / (rrf_k + vc.vrank)) +
      COALESCE(text_weight / (rrf_k + tc.trank), 0) AS rrf_score
    FROM vector_candidates vc
    LEFT JOIN text_candidates tc ON vc.id = tc.id
  )

  SELECT
    f.content,
    f.source_title,
    f.source_year,
    f.rrf_score::float AS similarity
  FROM fused f
  ORDER BY f.rrf_score DESC
  LIMIT match_count;

END;
$$;

-- ════════════════════════════════════════
-- הרשאות — זהה ל-match_knowledge_chunks
-- ════════════════════════════════════════
REVOKE ALL ON FUNCTION match_knowledge_chunks_hybrid(vector, text, text, int, float, float)
  FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION match_knowledge_chunks_hybrid(vector, text, text, int, float, float)
  TO service_role;

-- הרשאות גם ל-postgres role (מריץ המיגרציות)
GRANT  EXECUTE ON FUNCTION match_knowledge_chunks_hybrid(vector, text, text, int, float, float)
  TO postgres;
