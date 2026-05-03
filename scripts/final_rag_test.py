"""
final_rag_test.py — בדיקת תקינות RAG לכל 8 התיאורטיקנים

מריץ 3 שאילתות על כל תיאורטיקן ומדווח על מספר קטעים ודמיון.
שימוש: python3 scripts/final_rag_test.py
תלויות: pip install requests
"""

import requests
import math

import os

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://zyumcusveksvzihgvjrj.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]   # חובה: export SUPABASE_SERVICE_ROLE_KEY=...
HF_KEY       = os.environ["HF_API_KEY"]                  # חובה: export HF_API_KEY=...
HF_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction"

h = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}

def emb(text):
    r = requests.post(HF_URL, headers={"Authorization": f"Bearer {HF_KEY}", "Content-Type": "application/json"},
                      json={"inputs": text})
    raw = r.json()
    v = raw[0] if isinstance(raw[0], list) else raw
    n = math.sqrt(sum(x*x for x in v))
    return [x/n for x in v] if n > 0 else v

def search(q, theorist):
    e = emb(q)
    r = requests.post(f"{SUPABASE_URL}/rest/v1/rpc/match_knowledge_chunks", headers=h,
                      json={"query_embedding": e, "match_theorist": theorist, "match_count": 4})
    data = r.json()
    return data if isinstance(data, list) else []

THEORISTS = ["freud", "klein", "winnicott", "loewald", "ogden", "bion", "kohut", "heimann"]
QUERIES = [
    "transference and the analytic relationship",
    "unconscious fantasy and inner world",
    "holding environment and early development",
]

print("=" * 70)
print("בדיקת RAG — כל התיאורטיקנים")
print("=" * 70)

all_ok = True
for q in QUERIES:
    print(f"\n📝 שאילתה: '{q}'")
    print("-" * 50)
    for t in THEORISTS:
        results = search(q, t)
        if results:
            sims = [round(r.get("similarity", 0), 3) for r in results]
            print(f"  ✓ {t:10} → {len(results)} קטעים, דמיון={sims}")
        else:
            print(f"  ✗ {t:10} → 0 קטעים")
            all_ok = False

print("\n" + "=" * 70)
if all_ok:
    print("✅ כל התיאורטיקנים עובדים עם כל השאילתות!")
else:
    print("⚠️  חלק מהתיאורטיקנים עדיין מחזירים 0 קטעים")
