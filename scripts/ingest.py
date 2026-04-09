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
    ("/Users/ayaaviviharel/Downloads/סוכן 1 - פרויד/Freud complete Works.pdf", "freud", "Freud Complete Works", None),
]

if __name__ == "__main__":
    if len(FILES) == 0:
        print("⚠️  אין קבצים ברשימה. ערכי את FILES בתחתית הסקריפט.")
        sys.exit(0)
    for args in FILES:
        ingest(*args)
    print("\n✅ כל הקבצים הוכנסו בהצלחה.")
