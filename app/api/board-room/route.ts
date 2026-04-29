import { NextResponse } from 'next/server';

// קורא את הדוחות האחרונים של כל הסוכנים מ-GitHub (ציבורי, ללא טוקן)
const GITHUB_BASE = 'https://api.github.com/repos/ayaavivi-design/psychoanalytic-space/contents';

async function getLatestFile(folder: string): Promise<{ date: string; content: string } | null> {
  try {
    const res = await fetch(`${GITHUB_BASE}/${folder}`, {
      headers: { 'User-Agent': 'psychoanalytic-space-board' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const files = await res.json();
    if (!Array.isArray(files) || !files.length) return null;

    const sorted = files
      .filter((f: { type: string }) => f.type === 'file')
      .sort((a: { name: string }, b: { name: string }) => b.name.localeCompare(a.name));
    if (!sorted.length) return null;

    const latest = sorted[0];
    const fileRes = await fetch(latest.download_url, { next: { revalidate: 300 } });
    if (!fileRes.ok) return null;
    const content = await fileRes.text();

    const dateMatch = latest.name.match(/(\d{4}-\d{2}-\d{2})/);
    return { date: dateMatch?.[1] ?? latest.name, content };
  } catch {
    return null;
  }
}

export async function GET() {
  const [ceo, naval, ux] = await Promise.all([
    getLatestFile('ceo-reports'),
    getLatestFile('board-notes'),
    getLatestFile('ux-reports'),
  ]);

  // parse michal's JSON
  let michalFeedback = null;
  let michalTheorist: string | null = null;
  let michalMode: string | null = null;
  if (ux?.content) {
    try {
      const parsed = JSON.parse(ux.content);
      michalFeedback = parsed.feedback ?? null;
      michalTheorist = parsed.theorist ?? null;
      michalMode     = parsed.session_mode ?? parsed.feedback?.session_mode ?? null;
    } catch { /* noop */ }
  }

  return NextResponse.json({
    ran:    ceo   ? { date: ceo.date,   content: ceo.content }                                             : null,
    naval:  naval ? { date: naval.date, content: naval.content }                                           : null,
    michal: ux    ? { date: ux.date,    feedback: michalFeedback, theorist: michalTheorist, mode: michalMode } : null,
  });
}
