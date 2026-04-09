"""
סקריפט הכנסת מאמרים למאגר הוקטורים
הרצה: python3 scripts/ingest.py
"""

import os
import sys
import fitz  # PyMuPDF
import docx
from sentence_transformers import SentenceTransformer
from supabase import create_client

# ─── הגדרות ───────────────────────────────────────────────
SUPABASE_URL = "https://zyumcusveksvzihgvjrj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dW1jdXN2ZWtzdnppaGd2anJqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQzNTU2MywiZXhwIjoyMDkwMDExNTYzfQ.YFZqq9Mtxne66hK_YihJt049rw7Co8Is3-jy6Rz9ZUc"

CHUNK_SIZE   = 500   # מילים לכל קטע
CHUNK_OVERLAP = 50   # חפיפה בין קטעים

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

# ─── טעינת מודל ───────────────────────────────────────────
print("טוען מודל הטמעה (בפעם הראשונה לוקח כמה דקות)...")
model = SentenceTransformer(MODEL_NAME)
print("המודל מוכן.")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── פונקציות עזר ─────────────────────────────────────────

def read_pdf(path):
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)

def read_docx(path):
    doc = docx.Document(path)
    return "\n".join(p.text for p in doc.paragraphs)

def read_txt(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

def read_file(path):
    ext = path.lower().split(".")[-1]
    if ext == "pdf":   return read_pdf(path)
    if ext == "docx":  return read_docx(path)
    if ext in ("txt", "md"): return read_txt(path)
    raise ValueError(f"סוג קובץ לא נתמך: {ext}")

def chunk_text(text, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    words  = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i+size])
        chunks.append(chunk)
        i += size - overlap
    return chunks

def insert_chunks(theorist, source_title, source_year, chunks):
    texts      = [c for c in chunks if len(c.strip()) > 50]
    embeddings = model.encode(texts, show_progress_bar=True).tolist()

    rows = [
        {
            "theorist":     theorist,
            "source_title": source_title,
            "source_year":  source_year,
            "content":      text,
            "embedding":    emb,
        }
        for text, emb in zip(texts, embeddings)
    ]

    # הכנסה ב-batches של 50
    for i in range(0, len(rows), 50):
        batch = rows[i:i+50]
        supabase.table("knowledge_chunks").insert(batch).execute()
        print(f"  הוכנסו {i+len(batch)}/{len(rows)} קטעים")

# ─── הפעלה ────────────────────────────────────────────────

def ingest(file_path, theorist, source_title, source_year=None):
    print(f"\nמעבד: {file_path}")
    text   = read_file(file_path)
    chunks = chunk_text(text)
    print(f"נוצרו {len(chunks)} קטעים")
    insert_chunks(theorist, source_title, source_year, chunks)
    print("✓ הושלם")

# ─── רשימת המאמרים להכנסה ─────────────────────────────────
# ערכי: (נתיב לקובץ, שם תיאוריסט, כותרת מקור, שנה)
# הוסיפי כאן את הקבצים שלך:

FILES = [
    # קליין — כבר נכנס
    # ("/Users/ayaaviviharel/Downloads/סוכן 2 - קליין/...", "klein", ...),

    # ויניקוט — כבר נכנס
    # ("/Users/ayaaviviharel/Downloads/סוכן 3 - ויניקוט/...", "winnicott", ...),

    # לוואלד — כבר נכנס
    # ביון — כבר נכנס

    # קוהוט
    ("/Users/ayaaviviharel/Downloads/סוכן 7 - קוהוט/Kohut_MrZ.pdf",                                                                                                      "kohut", "The Two Analyses of Mr. Z",                              1979),
    ("/Users/ayaaviviharel/Downloads/סוכן 7 - קוהוט/kohut-h-and-wolf-e-1978-the-disorders-of-the-self-and-their-treatment-an-outline.pdf",                               "kohut", "The Disorders of the Self and Their Treatment",           1978),
    ("/Users/ayaaviviharel/Downloads/סוכן 7 - קוהוט/kohut-introspection-empathy-and-psychoanalysisAPA.007.0459A-pepweb.pdf",                                             "kohut", "Introspection, Empathy and Psychoanalysis",              1959),
    ("/Users/ayaaviviharel/Downloads/סוכן 7 - קוהוט/Kohut-On-introspection-1959.pdf",                                                                                    "kohut", "On Introspection",                                       1959),
    ("/Users/ayaaviviharel/Downloads/סוכן 7 - קוהוט/preview-9781134883936_A24665244.pdf",                                                                                "kohut", "The Analysis of the Self",                               None),

    # היימן
    ("/Users/ayaaviviharel/Downloads/סוכן 8 - הימן/9780203013755_previewpdf.pdf",                   "heimann", "About Children and Children-No-Longer",    None),
    ("/Users/ayaaviviharel/Downloads/סוכן 8 - הימן/9780429473661_previewpdf.pdf",                   "heimann", "Heimann Selected Writings Vol 1",           None),
    ("/Users/ayaaviviharel/Downloads/סוכן 8 - הימן/9780429477546_previewpdf.pdf",                   "heimann", "Heimann Selected Writings Vol 2",           None),
    ("/Users/ayaaviviharel/Downloads/סוכן 8 - הימן/Heimann On_Counter_Transference.pdf",            "heimann", "On Counter-Transference",                   1950),
    ("/Users/ayaaviviharel/Downloads/סוכן 8 - הימן/preview-9781134952953_A24761982.pdf",            "heimann", "Heimann — Further Writings",                None),
    ("/Users/ayaaviviharel/Downloads/סוכן 8 - הימן/פאולה-היימן-1950-על-קאונטרטרנספרנס.pdf",        "heimann", "על קאונטרטרנספרנס",                         1950),

    # ביון
    ("/Users/ayaaviviharel/Downloads/סוכן 6 - ביון/943729350-A-THEORY-OF-THINKING-Wilfred-Bion.pdf",                                    "bion", "A Theory of Thinking",                    1962),
    ("/Users/ayaaviviharel/Downloads/סוכן 6 - ביון/Bion_Attacks_on_Linking.pdf",                                                        "bion", "Attacks on Linking",                       1959),
    ("/Users/ayaaviviharel/Downloads/סוכן 6 - ביון/BION-A-Theory-of-Thinking.pdf",                                                      "bion", "A Theory of Thinking (alt)",               1962),
    ("/Users/ayaaviviharel/Downloads/סוכן 6 - ביון/Bion-Cogitations-Notes_on_Memory_and_Desire-pp_380-383.pdf",                         "bion", "Notes on Memory and Desire",               1967),
    ("/Users/ayaaviviharel/Downloads/סוכן 6 - ביון/Bion(1985)ContainerAndContained.pdf",                                                "bion", "Container and Contained",                  1985),
    ("/Users/ayaaviviharel/Downloads/סוכן 6 - ביון/Reading-Bion-Chapter-4.pdf",                                                         "bion", "Reading Bion — Chapter 4",                 None),
    ("/Users/ayaaviviharel/Downloads/סוכן 6 - ביון/Second-Thoughts-1967-Chap-2.pdf",                                                    "bion", "Second Thoughts",                          1967),
]

if __name__ == "__main__":
    if len(FILES) == 0:
        print("⚠️  אין קבצים ברשימה. ערכי את FILES בתחתית הסקריפט.")
        sys.exit(0)
    for args in FILES:
        ingest(*args)
    print("\n✅ כל הקבצים הוכנסו בהצלחה.")
