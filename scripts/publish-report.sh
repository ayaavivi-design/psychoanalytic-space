#!/usr/bin/env bash
#
# publish-report.sh — מפרסם קובצי דוח דרך /api/agent-report במקום `git push`.
#
# רקע: CCR scheduled agents כבר לא מצליחים ל-`git push origin main` (נשבר ~מאי 2026).
# הסקריפט הזה שולח את קובצי הדוח שהסוכן יצר ל-endpoint ב-Vercel, ש-Vercel
# כותב אותם ל-GitHub דרך ה-Contents API (אותו מנגנון ש-QA-Bot כבר משתמש בו).
#
# שימוש:
#   AGENT_REPORT_TOKEN=... bash scripts/publish-report.sh <folder>
#
# <folder> — אחת מהתיקיות המותרות ב-endpoint (qa-analysis, judge-reports, וכו').
# הסקריפט שולח כל קובץ בתיקייה שהוא חדש או שונה לעומת ה-HEAD (untracked/modified).
#
# סודות: אין סוד בקובץ הזה. ה-token מגיע ממשתנה הסביבה AGENT_REPORT_TOKEN בלבד.
# הריפו ציבורי — אסור להכניס לכאן ערך token.

set -euo pipefail

FOLDER="${1:-}"
BASE_URL="${BASE_URL:-https://psychoanalytic-space.vercel.app}"
ENDPOINT="${BASE_URL}/api/agent-report"

if [ -z "$FOLDER" ]; then
  echo "❌ usage: AGENT_REPORT_TOKEN=... bash scripts/publish-report.sh <folder>" >&2
  exit 1
fi
if [ -z "${AGENT_REPORT_TOKEN:-}" ]; then
  echo "❌ AGENT_REPORT_TOKEN env var not set" >&2
  exit 1
fi
if [ ! -d "$FOLDER" ]; then
  echo "❌ folder not found: $FOLDER" >&2
  exit 1
fi

# מצא קבצים חדשים/שונים בתיקייה. שלושה מקרים, מאוחדים:
#   1. untracked / modified בעץ העבודה (git status)
#   2. committed מקומית אך לא קיים/שונה מ-origin/main (git diff)
# כך גם אם הסוכן עשה git commit בטעות — הקובץ עדיין יתפרסם.
git fetch origin main -q 2>/dev/null || true
{
  git status --porcelain -- "$FOLDER" | awk '{print $2}'
  git diff --name-only origin/main -- "$FOLDER" 2>/dev/null || true
} | grep -E '\.(md|txt)$' | sort -u > /tmp/publish-files.txt || true
mapfile -t FILES < /tmp/publish-files.txt

if [ "${#FILES[@]}" -eq 0 ]; then
  echo "ℹ️  אין קבצים חדשים/שונים ב-$FOLDER לפרסום."
  exit 0
fi

FAILED=0
for path in "${FILES[@]}"; do
  filename="$(basename "$path")"
  echo "→ מפרסם $filename ל-$FOLDER ..."

  # בונים JSON בבטחה עם python3 (escaping מלא של התוכן).
  payload="$(FOLDER="$FOLDER" FILENAME="$filename" FILEPATH="$path" python3 - <<'PY'
import json, os
with open(os.environ["FILEPATH"], encoding="utf-8") as f:
    content = f.read()
print(json.dumps({
    "folder": os.environ["FOLDER"],
    "filename": os.environ["FILENAME"],
    "content": content,
}))
PY
)"

  http_code="$(curl -sS -o /tmp/agent-report-resp.json -w '%{http_code}' \
    -X POST "$ENDPOINT" \
    -H "x-internal-token: ${AGENT_REPORT_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload")"

  if [ "$http_code" = "200" ]; then
    echo "  ✅ נשמר ($http_code)"
  else
    echo "  ❌ נכשל ($http_code): $(cat /tmp/agent-report-resp.json)" >&2
    FAILED=1
  fi
done

exit $FAILED
