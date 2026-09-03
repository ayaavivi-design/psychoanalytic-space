# -*- coding: utf-8 -*-
"""
בליעת "Playing and Reality" (1971), הספר המלא, לתוך knowledge_chunks · 01.09.2026

המקור: PEP-Web, 77 עמודי PDF, טקסט נקי (לא סריקה) — לא מכיל מקף רך.
נדרש ניקוי: כותרת עמוד/URL/פוטר חוזרים על כל עמוד, ואזהרת זכויות יוצרים.
נחתך לפני "References" (ביבליוגרפיה בלבד, לא תוכן קליני), נשאר עד סוף Tailpiece.

הרצה בפועל, 01.09.2026: 100 קטעים חדשים נכנסו. שמורה כאן לתיעוד ולשחזור,
לא להרצה חוזרת — הרצה חוזרת תיצור כפילות, אין כאן בדיקת \"כבר קיים\".

ארבעה פרקים הוצאו בכוונה, לא רק פרק 1: 1, 6, 8, 9 הם שכתוב מילולי של
מאמרים שכבר יושבים בקורפוס תחת שמם המקורי (Transitional Objects ·
The Use of an Object · The Place Where We Live · Mirror-Role of Mother
and Family). נמדד: 26 מתוך 146 קטעים מלאים חפפו קורפוס קיים ב-38 עד 93
אחוז לפני ההוצאה, 3 מתוך 100 ב-30 עד 44 אחוז אחריה (חפיפה תמטית רגילה,
לא כפילות). References (ביבליוגרפיה) לא נכנס, כמו בשאר הקורפוס.
"""
import sys, re, os
import fitz

PATH = "/Users/ayaaviviharel/Downloads/סוכן 3 - ויניקוט/Playing_and_Reality.pdf"
SOURCE_TITLE = "Playing and Reality"
SOURCE_YEAR = 1971
THEORIST = "winnicott"

def extract():
    doc = fitz.open(PATH)
    return "\n".join(page.get_text() for page in doc)

def clean(text):
    # חיתוך: עד סוף Tailpiece, לפני References (מחפשים אחרי אמצע המסמך כדי לא
    # לפגוע ב"References" של תוכן העניינים בתחילת הקובץ)
    cut = text.find("\nReferences\n", 400000)
    if cut > 0:
        text = text[:cut]

    # שורות חוזרות בכל עמוד — כותרת/URL/פוטר/מספר עמוד/חותמת זמן
    patterns = [
        r'^PEP Web - Playing and Reality$',
        r'^http://www\.pep-web\.org/.*$',
        r'^\d{1,2} of 77$',
        r'^\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}\s*[AP]M$',
        r'^-\s*\d+\s*-$',
        r'^Winnicott, D\.W\. \(1971\)\. Playing and Reality\..*$',
    ]
    combined = re.compile('|'.join(patterns), re.MULTILINE)
    text = combined.sub('', text)

    # בלוק אזהרת הזכויות, נפרש על שתי שורות
    text = re.sub(
        r'WARNING!.{0,400}?whatsoever\.',
        '', text, flags=re.DOTALL
    )

    # צמצום שורות ריקות שנוצרו מהמחיקה
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+\n', '\n', text)
    text = text.strip()

    # שלושה פרקים נוספים, לא רק פרק 1, הם שכתוב מילולי של מאמרים שכבר יושבים
    # בקורפוס תחת שמם המקורי: פרק 6 = "The Use of an Object", פרק 8 = "The
    # Place Where We Live", פרק 9 = "Mirror-Role of Mother and Family in Child
    # Development". נמדד 01.09.2026: 26 מתוך 146 קטעים חדשים חפפו קורפוס קיים
    # ב-38 עד 93 אחוז, וכולם נפלו בתוך שלוש הכותרות האלה. פרק 7 (Location of
    # Cultural Experience) נבדק ואינו חופף — נשאר.
    #
    # השיטה: מוצאים את המיקום האמיתי (השני, לא זה שבתוכן העניינים) של כל
    # כותרת פרק, ומרכיבים מחדש רק את הפרקים שאינם ברשימת הכפולים.
    CHAPTERS = [
        (1,  '1 Transitional Objects and Transitional Phenomena'),
        (2,  '2 Dreaming, Fantasying, and Living'),
        (3,  '3 Playing A Theoretical Statement'),
        (4,  '4 Playing: Creative Activity and the Search for the Self'),
        (5,  '5 Creativity and its Origins'),
        (6,  '6 The Use of an Object'),
        (7,  '7 The Location of Cultural Experience'),
        (8,  '8 The Place where we Live'),
        (9,  '9 Mirror-role of Mother and Family'),
        (10, '10 Interrelating apart from Instinctual Drive'),
        (11, '11 Contemporary Concepts of Adolescent Development'),
    ]
    DUPLICATE = {1, 6, 8, 9}

    positions = []
    for num, needle in CHAPTERS:
        i = text.find(needle, 3000)  # אחרי תוכן העניינים
        if i < 0:
            raise ValueError(f'כותרת פרק {num} לא נמצאה: {needle!r}')
        positions.append((i, num))
    positions.sort()

    front_matter = text[:positions[0][0]]  # שער, תוכן עניינים, תודות, הקדמה
    kept = [front_matter]
    for idx, (start, num) in enumerate(positions):
        end = positions[idx + 1][0] if idx + 1 < len(positions) else len(text)
        if num not in DUPLICATE:
            kept.append(text[start:end])
    return '\n\n'.join(kept)

def chunk_text(text, size=500, overlap=50):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunks.append(" ".join(words[i:i+size]))
        i += size - overlap
    return [c for c in chunks if len(c.strip()) > 50]

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "preview"
    raw = extract()
    cleaned = clean(raw)
    chunks = chunk_text(cleaned)

    print(f"טקסט גולמי: {len(raw)} תווים")
    print(f"אחרי ניקוי: {len(cleaned)} תווים ({100*len(cleaned)/len(raw):.1f}%)")
    print(f"קטעים: {len(chunks)}")
    remaining_warn = cleaned.count("WARNING")
    remaining_pep = cleaned.count("PEP Web")
    remaining_soft = cleaned.count("­")
    print(f"שאריות: WARNING={remaining_warn} · PEP Web={remaining_pep} · מקף רך={remaining_soft}")

    if mode == "preview":
        out = os.environ.get("S", ".") + "/pr-cleaned-preview.txt"
        with open(out, "w", encoding="utf-8") as f:
            f.write(cleaned)
        print(f"\nנשמר לתצוגה: {out}")
        print("\n── 3 קטעים לדוגמה ──")
        for i in [0, len(chunks)//2, len(chunks)-1]:
            print(f"\n[{i}] ({len(chunks[i])} תווים):")
            print(chunks[i][:300])

    elif mode == "insert":
        import os as _os
        from sentence_transformers import SentenceTransformer
        from supabase import create_client
        # .env.local נטען ידנית · לא כתוב לשום מקום, נמסר רק כמפתחות חיבור
        for line in open(".env.local", encoding="utf-8"):
            if "=" in line and not line.startswith("#"):
                k, _, v = line.strip().partition("=")
                _os.environ.setdefault(k, v.strip().strip('"').strip("'"))
        SUPABASE_URL = _os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        SUPABASE_KEY = _os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        print("טוען מודל הטמעה מהמטמון המקומי...")
        model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
        embeddings = model.encode(chunks, show_progress_bar=True, normalize_embeddings=True).tolist()
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
