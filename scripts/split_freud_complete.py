"""
השלמת הפיצול — מכניס רק את המאמרים החסרים (W104 ואילך)
שימוש: python3 scripts/split_freud_complete.py
"""

import os
import fitz
from sentence_transformers import SentenceTransformer
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://zyumcusveksvzihgvjrj.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]   # export SUPABASE_SERVICE_ROLE_KEY=...
PDF_PATH    = "/Users/ayaaviviharel/Downloads/סוכן 1 - פרויד/Freud complete Works.pdf"
THEORIST    = "freud"
CHUNK_SIZE  = 500
OVERLAP     = 50
START_FROM  = 103   # 0-indexed — W104 = index 103

PAPERS = [
    ("Studies on Hysteria", 1893),
    ("The Neuro-Psychoses of Defence", 1895),
    ("Obsessions and Phobias: Their Psychical Mechanism and Their Aetiology", 1895),
    ("Heredity and the Aetiology of the Neuroses", 1896),
    ("Further Remarks on the Neuro-Psychoses of Defence", 1896),
    ("The Aetiology of Hysteria", 1896),
    ("Sexuality in the Aetiology of the Neuroses", 1898),
    ("The Psychical Mechanism of Forgetfulness", 1898),
    ("Screen Memories", 1899),
    ("The Interpretation of Dreams", 1900),
    ("On Dreams", 1901),
    ("The Psychopathology of Everyday Life", 1901),
    ("Freud's Psycho-Analytic Procedure", 1904),
    ("Fragment of an Analysis of a Case of Hysteria (Dora)", 1905),
    ("Three Essays on the Theory of Sexuality", 1905),
    ("On Psychotherapy", 1905),
    ("My Views on the Part Played by Sexuality in the Aetiology of the Neuroses", 1906),
    ("Psychical (or Mental) Treatment", 1905),
    ("Psychopathic Characters on the Stage", 1905),
    ("Jokes and Their Relation to the Unconscious", 1905),
    ("Delusions and Dreams in Jensen's Gradiva", 1907),
    ("Psycho-Analysis and the Establishment of the Facts in Legal Proceedings", 1906),
    ("Obsessive Actions and Religious Practices", 1907),
    ("The Sexual Enlightenment of Children", 1907),
    ("Creative Writers and Day-Dreaming", 1908),
    ("Hysterical Phantasies and Their Relation to Bisexuality", 1908),
    ("Character and Anal Erotism", 1908),
    ("Civilized Sexual Morality and Modern Nervous Illness", 1908),
    ("On the Sexual Theories of Children", 1908),
    ("Some General Remarks on Hysterical Attacks", 1909),
    ("Family Romances", 1909),
    ("Analysis of a Phobia in a Five-Year-Old Boy (Little Hans)", 1909),
    ("Notes upon a Case of Obsessional Neurosis (Rat Man)", 1909),
    ("Five Lectures on Psycho-Analysis", 1910),
    ("Leonardo da Vinci and a Memory of His Childhood", 1910),
    ("The Future Prospects of Psycho-Analytic Therapy", 1910),
    ("The Antithetical Meaning of Primal Words", 1910),
    ("A Special Type of Choice of Object Made by Men (Psychology of Love I)", 1910),
    ("On the Universal Tendency to Debasement in the Sphere of Love (Psychology of Love II)", 1912),
    ("The Taboo of Virginity (Psychology of Love III)", 1918),
    ("Wild Psycho-Analysis", 1910),
    ("Psycho-Analytic Notes on an Autobiographical Account of a Case of Paranoia (Schreber)", 1911),
    ("The Dynamics of Transference", 1912),
    ("On Beginning the Treatment", 1913),
    ("Remembering, Repeating and Working-Through", 1914),
    ("Observations on Transference-Love", 1915),
    ("Dreams in Folklore", 1911),
    ("On Psycho-Analysis", 1911),
    ("Types of Onset of Neurosis", 1912),
    ("Contributions to a Discussion on Masturbation", 1912),
    ("A Note on the Unconscious in Psycho-Analysis", 1912),
    ("An Evidential Dream", 1913),
    ("The Occurrence in Dreams of Material from Fairy Tales", 1913),
    ("The Theme of the Three Caskets", 1913),
    ("Two Lies Told by Children", 1913),
    ("The Disposition to Obsessional Neurosis", 1913),
    ("Great is Diana of the Ephesians", 1911),
    ("Totem and Taboo", 1913),
    ("The Claims of Psycho-Analysis to Scientific Interest", 1913),
    ("Observations and Examples from Analytic Practice", 1913),
    ("Fausse Reconnaissance in Psycho-Analytic Treatment", 1914),
    ("The Moses of Michelangelo", 1914),
    ("Some Reflections on Schoolboy Psychology", 1914),
    ("On the History of the Psycho-Analytic Movement", 1914),
    ("On Narcissism: An Introduction", 1914),
    ("Instincts and Their Vicissitudes", 1915),
    ("Repression", 1915),
    ("The Unconscious", 1915),
    ("Mourning and Melancholia", 1915),
    ("A Case of Paranoia Running Counter to the Psycho-Analytic Theory of the Disease", 1915),
    ("Thoughts for the Times on War and Death", 1915),
    ("On Transience", 1916),
    ("Some Character-Types Met with in Psycho-Analytic Work", 1916),
    ("A Mythological Parallel to a Visual Obsession", 1916),
    ("A Connection between a Symbol and a Symptom", 1916),
    ("Introductory Lectures on Psycho-Analysis", 1916),
    ("From the History of an Infantile Neurosis (Wolf Man)", 1914),
    ("A Difficulty in the Path of Psycho-Analysis", 1917),
    ("A Childhood Recollection from Dichtung und Wahrheit", 1917),
    ("Lines of Advance in Psycho-Analytic Therapy", 1919),
    ("On the Teaching of Psycho-Analysis in Universities", 1919),
    ("A Child is Being Beaten", 1919),
    ("Introduction to Psycho-Analysis and the War Neuroses", 1919),
    ("The Uncanny", 1919),
    ("Beyond the Pleasure Principle", 1920),
    ("Group Psychology and the Analysis of the Ego", 1921),
    ("The Psychogenesis of a Case of Homosexuality in a Woman", 1920),
    ("Psycho-Analysis and Telepathy", 1921),
    ("Dreams and Telepathy", 1922),
    ("Two Encyclopaedia Articles", 1923),
    ("The Ego and the Id", 1923),
    ("A Seventeenth-Century Demonological Neurosis", 1923),
    ("Remarks on the Theory and Practice of Dream-Interpretation", 1923),
    ("The Infantile Genital Organization", 1923),
    ("Neurosis and Psychosis", 1924),
    ("The Economic Problem of Masochism", 1924),
    ("The Dissolution of the Oedipus Complex", 1924),
    ("The Loss of Reality in Neurosis and Psychosis", 1924),
    ("A Short Account of Psycho-Analysis", 1924),
    ("The Resistances to Psycho-Analysis", 1925),
    ("A Note upon the Mystic Writing-Pad", 1925),
    ("Negation", 1925),
    ("Some Psychical Consequences of the Anatomical Distinction between the Sexes", 1925),
    # ── מכאן החסרים ──
    ("An Autobiographical Study", 1925),
    ("Inhibitions, Symptoms and Anxiety", 1926),
    ("The Question of Lay Analysis", 1926),
    ("Psycho-Analysis", 1926),
    ("The Future of an Illusion", 1927),
    ("Civilization and Its Discontents", 1930),
    ("Fetishism", 1927),
    ("Humour", 1927),
    ("A Religious Experience", 1928),
    ("Dostoevsky and Parricide", 1928),
    ("Some Dreams of Descartes", 1929),
    ("The Goethe Prize", 1930),
    ("Libidinal Types", 1931),
    ("Female Sexuality", 1931),
    ("New Introductory Lectures on Psycho-Analysis", 1933),
    ("The Acquisition and Control of Fire", 1932),
    ("Why War?", 1933),
    ("A Disturbance of Memory on the Acropolis", 1936),
    ("Moses and Monotheism", 1939),
    ("An Outline of Psycho-Analysis", 1940),
    ("Analysis Terminable and Interminable", 1937),
    ("Constructions in Analysis", 1937),
    ("Splitting of the Ego in the Process of Defence", 1940),
    ("Some Elementary Lessons in Psycho-Analysis", 1940),
]

def chunk_text(text):
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        c = " ".join(words[i:i+CHUNK_SIZE])
        if len(c.strip()) > 50:
            chunks.append(c)
        i += CHUNK_SIZE - OVERLAP
    return chunks

def main():
    print("טוען PDF...")
    doc  = fitz.open(PDF_PATH)
    toc  = doc.get_toc()
    w_entries = [(t, p) for _, t, p in toc if t.startswith("W")]

    print(f"נמצאו {len(w_entries)} ערכי W | מתחיל מ-W{START_FROM+1} ({PAPERS[START_FROM][0]})")
    print("טוען מודל embedding...")
    model    = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    total = min(len(w_entries), len(PAPERS))
    ingested = skipped = 0

    for i in range(START_FROM, total):
        _, start_page = w_entries[i]
        end_page = w_entries[i+1][1] - 1 if i + 1 < len(w_entries) else len(doc)
        title, year = PAPERS[i]

        # דלג אם כבר קיים
        exists = supabase.table("knowledge_chunks").select("id", count="exact")\
            .eq("theorist", THEORIST).eq("source_title", title).execute()
        if exists.count and exists.count > 0:
            print(f"  [{i+1}/{total}] SKIP (קיים) — {title}")
            skipped += 1
            continue

        text = "\n".join(doc[p].get_text() for p in range(start_page-1, min(end_page, len(doc)))).strip()
        if len(text) < 100:
            print(f"  [{i+1}/{total}] SKIP (טקסט קצר) — {title}")
            skipped += 1
            continue

        chunks     = chunk_text(text)
        embeddings = model.encode(chunks, normalize_embeddings=True).tolist()
        rows = [{"theorist": THEORIST, "source_title": title, "source_year": year,
                 "content": c, "embedding": e} for c, e in zip(chunks, embeddings)]

        for j in range(0, len(rows), 50):
            supabase.table("knowledge_chunks").insert(rows[j:j+50]).execute()

        ingested += 1
        print(f"  [{i+1}/{total}] ✅ {title} ({year}) — {len(chunks)} קטעים")

    print(f"\nהושלם: {ingested} הוכנסו | {skipped} דולגו")

if __name__ == "__main__":
    main()
