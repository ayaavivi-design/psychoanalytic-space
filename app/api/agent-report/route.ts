import { NextRequest, NextResponse } from 'next/server';
import { saveReportToGithub } from '@/lib/github-report';

// Agent report bridge — called by CCR scheduled agents to persist reports to GitHub.
//
// WHY: CCR `git push origin main` stopped working (~mid-May 2026 — credential lost
// write access). CCR agents also do NOT have GITHUB_TOKEN in their env. This endpoint
// lets agents POST a report; Vercel (which HAS GITHUB_TOKEN) does the actual write via
// the GitHub Contents API — the same mechanism QA-Bot already uses successfully.
//
// Auth: x-internal-token header must match INTERNAL_API_TOKEN env var (same secret
//       already used by /api/daily-summary).
// Body: { folder: string, filename: string, content: string }
//
// Security: agents receive only INTERNAL_API_TOKEN (least-privilege — can only write
//           a report file into an allow-listed folder). GITHUB_TOKEN never leaves Vercel.

// תיקיות מותרות לכתיבה — סוכן לא יכול לכתוב לאן שבא לו (least-privilege).
const ALLOWED_FOLDERS = new Set([
  'qa-analysis',
  'qa-reports',
  'judge-reports',
  'ceo-reports',
  'board-notes',
  'ux-reports',
  'daily-summaries',
]);

// שם קובץ בטוח בלבד — בלי path traversal, בלי תת-תיקיות.
const SAFE_FILENAME = /^[A-Za-z0-9._-]+$/;

export async function POST(req: NextRequest) {
  // 1. Auth
  const token = req.headers.get('x-internal-token');
  if (!token || token !== process.env.INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate env
  if (!process.env.GITHUB_TOKEN) {
    console.error('[agent-report] GITHUB_TOKEN not set');
    return NextResponse.json({ error: 'GitHub not configured' }, { status: 500 });
  }

  // 3. Parse body
  let folder: string, filename: string, content: string;
  try {
    const body = await req.json();
    folder = body.folder;
    filename = body.filename;
    content = body.content;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // 4. Validate inputs
  if (!folder || !filename || typeof content !== 'string') {
    return NextResponse.json(
      { error: 'Missing folder, filename, or content' },
      { status: 400 },
    );
  }
  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json(
      { error: `Folder not allowed. Use one of: ${[...ALLOWED_FOLDERS].join(', ')}` },
      { status: 400 },
    );
  }
  if (!SAFE_FILENAME.test(filename)) {
    return NextResponse.json(
      { error: 'Invalid filename — only letters, digits, dot, dash, underscore' },
      { status: 400 },
    );
  }

  // 5. Write via GitHub Contents API (Vercel holds GITHUB_TOKEN)
  const result = await saveReportToGithub(folder, filename, content);
  if (!result.ok) {
    console.error('[agent-report] save failed:', result.error);
    return NextResponse.json({ error: result.error ?? 'Save failed' }, { status: 502 });
  }

  return NextResponse.json({ saved: true, url: result.url });
}
