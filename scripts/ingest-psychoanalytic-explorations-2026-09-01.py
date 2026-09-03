# -*- coding: utf-8 -*-
"""
בליעת "Psycho-Analytic Explorations" (1989) לתוך knowledge_chunks · 01.09.2026
619 עמודים, PEP-Web/Routledge, טקסט נקי.

היקף, ולמה: כרך זה הוא אנתולוגיה, לא רק אוסף מאמרים קליניים. ארבעה חלקים:
Part 1 עיון ופרקטיקה (כלול) · Part 2 טיפול בילדים ומתבגרים (כלול) ·
Part 3 על עבודתם של אנליטיקאים אחרים, כולל "קליין על קנאה" (כלול, קול ראשון
גוף, גם כשהוא מגיב לאחרים) · Part 4 טיפולים גופניים — הלם חשמלי, לובוטומיה,
פיזיותרפיה (הוצא: אינו רישום קליני-אנליטי, וסיכון להזרים מינוח כזה לשיחה
עם מטופלת). הקדמת העורכים ו-"D.W.W.: A Reflection" מאת קלייר ויניקוט הוצאו
— אינם קולו שלו, כתובים עליו בגוף שלישי (בדיוק סיכון פריט 10 ב-OPEN_LOOPS).
Postscript "D.W.W. on D.W.W." נכלל — זו רפלקציה עצמית שלו.


הרצה בפועל, 01.09.2026: 408 קטעים חדשים נכנסו. שמורה כאן לתיעוד ולשחזור,
לא להרצה חוזרת — הרצה חוזרת תיצור כפילות.

28 קטעים חופפים קורפוס קיים הוצאו: 6 מתוך "Fear of Breakdown", 13 מתוך
"Playing and Reality", 9 מתוך "The Use of an Object" — אותם מאמרים נדפסו
פעמיים בכרכים שונים. זוהו בבדיקת חפיפה אוטומטית (סף 45%), לא ידנית.
"""
import sys, re, os
import fitz

PATH = "/Users/ayaaviviharel/Downloads/סוכן 3 - ויניקוט/Psychoanalytic-Explorations.pdf"
SOURCE_TITLE = "Psycho-Analytic Explorations"
SOURCE_YEAR = 1989
THEORIST = "winnicott"

def extract():
    doc = fitz.open(PATH)
    return "\n".join(page.get_text() for page in doc)

def clean(text):
    i_part1 = text.find("\nEarly Disillusion\nDated 24 October 1939\n1\n")
    i_part2 = text.find("Part Two", 400000)
    i_part3 = text.find("Part Three", 700000)
    i_part4 = text.find("Part Four", 1000000)
    i_ps    = text.find("Postscript: D.W.W. on D.W.W.", 1200000)
    i_index = text.find("\nIndex\n", 1250000)
    assert i_part1 > 0 and i_part2 > i_part1 and i_part3 > i_part2 \
        and i_part4 > i_part3 and i_ps > i_part4 and i_index > i_ps, "גבול לא נמצא"

    kept = text[i_part1:i_part4] + '\n\n' + text[i_ps:i_index]

    # מספרי עמוד בודדים על שורה משלהם
    kept = re.sub(r'\n\d{1,3}\n', '\n', kept)
    # כותרות רצות של החלקים עצמם, חוזרות על כל עמוד
    for h in ['Psycho-Analysis: Theory and Practice',
              'Psycho-Analytic Psychotherapy with Children and Adolescents',
              'On the Work of Other Analysts',
              'Postscript: D.W.W. on D.W.W.']:
        kept = kept.replace(h, '')

    kept = re.sub(r'\n{3,}', '\n\n', kept)
    kept = re.sub(r'[ \t]+\n', '\n', kept)
    return kept.strip()

def chunk_text(text, size=500, overlap=50):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunks.append(" ".join(words[i:i+size]))
        i += size - overlap
    chunks = [c for c in chunks if len(c.strip()) > 50]

    # 28 קטעים חופפים בפועל (45%+) מקורפוס קיים, נמדד 01.09.2026: 6 מתוך
    # "Fear of Breakdown", 13 מתוך "Playing and Reality", 9 מתוך
    # "The Use of an Object" — אותם מאמרים נדפסו פעמיים. מוצאים כאן.
    EXCLUDE = {56,57,58,59,60,61,128,129,130,131,132,134,135,136,137,138,139,140,141,173,174,175,176,177,178,179,180,181}
    chunks = [c for j, c in enumerate(chunks) if j not in EXCLUDE]
    return chunks

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "preview"
    raw = extract()
    cleaned = clean(raw)
    chunks = chunk_text(cleaned)

    print(f"טקסט גולמי: {len(raw)} תווים")
    print(f"אחרי סינון היקף וניקוי: {len(cleaned)} תווים ({100*len(cleaned)/len(raw):.1f}%)")
    print(f"קטעים: {len(chunks)}")

    if mode == "preview":
        out = os.environ.get("S", ".") + "/pe-cleaned-preview.txt"
        with open(out, "w", encoding="utf-8") as f:
            f.write(cleaned)
        print(f"\nנשמר לתצוגה: {out}")
        print("\n── 3 קטעים לדוגמה ──")
        for i in [0, len(chunks)//2, len(chunks)-1]:
            print(f"\n[{i}] ({len(chunks[i])} תווים):")
            print(chunks[i][:280])

    elif mode == "insert":
        import os as _os
        from sentence_transformers import SentenceTransformer
        from supabase import create_client
        for line in open(".env.local", encoding="utf-8"):
            if "=" in line and not line.startswith("#"):
                k, _, v = line.strip().partition("=")
                _os.environ.setdefault(k, v.strip().strip('"').strip("'"))
        SUPABASE_URL = _os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        SUPABASE_KEY = _os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        print("טוען מודל הטמעה מהמטמון המקומי...")
        model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        embeddings = model.encode(chunks, show_progress_bar=True, normalize_embeddings=True, batch_size=32).tolist()
        rows = [
            {"theorist": THEORIST, "source_title": SOURCE_TITLE, "source_year": SOURCE_YEAR,
             "content": c, "embedding": e}
            for c, e in zip(chunks, embeddings)
        ]
        for i in range(0, len(rows), 50):
            batch = rows[i:i+50]
            sb.table("knowledge_chunks").insert(batch).execute()
            print(f"  הוכנסו {i+len(batch)}/{len(rows)}")
        print(f"\n✓ הושלם · {len(rows)} קטעים חדשים תחת \"{SOURCE_TITLE}\" ({SOURCE_YEAR})")
