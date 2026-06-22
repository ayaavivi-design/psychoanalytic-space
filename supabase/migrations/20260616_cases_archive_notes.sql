-- BW-113 — case archive + manual notes.
-- ארכוב מקרה: archived_at (NULL = פעיל). עדכון ידני: mode 'note' (כתיבה חופשית של המטפל, מאונמזת).

ALTER TABLE therapist_cases ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS therapist_cases_active_idx ON therapist_cases (user_id, archived_at, created_at DESC);

ALTER TABLE case_consultations DROP CONSTRAINT IF EXISTS case_consultations_mode_check;
ALTER TABLE case_consultations ADD CONSTRAINT case_consultations_mode_check
  CHECK (mode IN ('consult', 'roundtable', 'research', 'note'));
