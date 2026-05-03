"""
count_chunks.py — ספירת קטעי knowledge_chunks לכל תיאורטיקן

מחזיר את מספר השורות ב-Supabase לכל תיאורטיקן. שימושי לאימות שה-ingest הסתיים.
שימוש: python3 scripts/debug_theorists2.py
תלויות: stdlib בלבד (urllib)
"""

import urllib.request
import json

import os

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://zyumcusveksvzihgvjrj.supabase.co")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]   # חובה: export SUPABASE_SERVICE_ROLE_KEY=...

def sql_query(query):
    """שאילתה ישירה דרך PostgREST RPC"""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    # זו לא פונקציה סטנדרטית, נשתמש בדרך אחרת

def rest_query(path):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

# ספירה לכל theorist בנפרד
theorists_to_check = ["freud", "klein", "winnicott", "loewald", "ogden", "bion", "kohut", "heimann"]

print("ספירה ישירה לכל תיאורטיקן:")
for t in theorists_to_check:
    # HEAD request עם Prefer: count=exact
    url = f"{SUPABASE_URL}/rest/v1/knowledge_chunks?theorist=eq.{t}&select=id"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "count=exact",
        "Range": "0-0",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            content_range = resp.headers.get("Content-Range", "")
            # Content-Range: 0-0/TOTAL
            total = content_range.split("/")[-1] if "/" in content_range else "?"
            print(f"  '{t}': {total} שורות")
    except Exception as e:
        print(f"  '{t}': שגיאה — {e}")
