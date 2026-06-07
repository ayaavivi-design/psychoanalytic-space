"""
הכנסת קובץ בודד — ללא כפילויות
שימוש: python3 scripts/ingest_one.py <path> <theorist> <title> [year]
"""

import os
import sys
import re
import io
import fitz
from PIL import Image
from sentence_transformers import SentenceTransformer
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://zyumcusveksvzihgvjrj.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]   # export SUPABASE_SERVICE_ROLE_KEY=...
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

if len(sys.argv) < 4:
    print("שימוש: python3 ingest_one.py <path> <theorist> <title> [year]")
    sys.exit(1)

file_path   = sys.argv[1]
theorist    = sys.argv[2]
title       = sys.argv[3]
year        = int(sys.argv[4]) if len(sys.argv) > 4 else None

print("טוען מודל...")
model = SentenceTransformer(MODEL_NAME)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# קרא PDF — עם fallback ל-OCR אם הטקסט ריק
doc = fitz.open(file_path)
text = "\n".join(page.get_text() for page in doc.pages())

if len(text.strip()) < 50:
    print("טקסט רגיל ריק — מנסה OCR...")
    try:
        import pytesseract
        pages_text = []
        for page in doc.pages():
            mat = fitz.Matrix(3, 3)
            pix = page.get_pixmap(matrix=mat)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            t = pytesseract.image_to_string(img, lang="eng")
            t = re.sub(r"WARNING!.*?whatsoever\.", "", t, flags=re.DOTALL)
            t = re.sub(r"- \d+ -", "", t)
            pages_text.append(t.strip())
        text = "\n\n".join(pages_text)
        print(f"OCR הצליח: {len(text)} תווים")
    except Exception as e:
        print(f"OCR נכשל: {e}")

print(f"טקסט: {len(text)} תווים")

# חלק לקטעים
words = text.split()
chunks = []
i = 0
while i < len(words):
    chunk = " ".join(words[i:i+CHUNK_SIZE])
    if len(chunk.strip()) > 50:
        chunks.append(chunk)
    i += CHUNK_SIZE - CHUNK_OVERLAP

print(f"נוצרו {len(chunks)} קטעים")

# הטמע — עם נורמליזציה
embeddings = model.encode(chunks, show_progress_bar=True, normalize_embeddings=True).tolist()

# בדוק כפילויות לפי כותרת מקור
existing = supabase.table("knowledge_chunks").select("source_title").eq("theorist", theorist).eq("source_title", title).limit(1).execute()
if existing.data:
    print(f"⚠️  כבר קיים חומר מ-'{title}' עבור {theorist}. מחיקה ראשון...")
    supabase.table("knowledge_chunks").delete().eq("theorist", theorist).eq("source_title", title).execute()
    print("  נמחק.")

# הכנס
rows = [{"theorist": theorist, "source_title": title, "source_year": year, "content": c, "embedding": e}
        for c, e in zip(chunks, embeddings)]

for i in range(0, len(rows), 50):
    batch = rows[i:i+50]
    supabase.table("knowledge_chunks").insert(batch).execute()
    print(f"  הוכנסו {min(i+50, len(rows))}/{len(rows)} קטעים")

print(f"✅ הושלם: {len(rows)} קטעים ל-{theorist} / {title}")
