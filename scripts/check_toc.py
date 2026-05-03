"""
קריאת עמוד ה-TABLE כדי להבין את מיפוי W1..W128
"""
import sys
import fitz

path = sys.argv[1] if len(sys.argv) > 1 else "/Users/ayaaviviharel/Downloads/סוכן 1 - פרויד/Freud complete Works.pdf"

doc = fitz.open(path)
toc = doc.get_toc()

# הדפס את כל 128 ערכי ה-TOC עם מספרי עמודים
print("=== כל ערכי ה-TOC ===")
for level, title, page in toc:
    print(f"עמ׳ {page:5d} — {title}")

print()
print("=== תוכן עמוד ה-TABLE (עמ׳ 2-4) ===")
for p in range(1, 5):  # עמודים 2-5 (0-indexed: 1-4)
    if p < len(doc):
        print(f"\n--- עמוד {p+1} ---")
        print(doc[p].get_text())
