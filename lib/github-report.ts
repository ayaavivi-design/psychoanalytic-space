// שומרת דוח markdown ל-GitHub repo (qa-reports/ או judge-reports/)
// דורשת GITHUB_TOKEN ב-Vercel environment variables
// אם אין טוקן — נכשלת בשקט (לא שוברת את הרוט הראשי)

const REPO = 'ayaavivi-design/psychoanalytic-space';
const GITHUB_API = 'https://api.github.com';

export async function saveReportToGithub(
  folder: string,
  filename: string,
  content: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn('[github-report] GITHUB_TOKEN חסר — דוח לא נשמר ל-GitHub');
    return { ok: false, error: 'GITHUB_TOKEN missing' };
  }

  const path = `${folder}/${filename}`;
  const url = `${GITHUB_API}/repos/${REPO}/contents/${path}`;
  const encoded = Buffer.from(content, 'utf-8').toString('base64');

  // בודקת אם הקובץ כבר קיים (למקרה של הרצה כפולה באותו יום)
  let sha: string | undefined;
  try {
    const existing = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'psychoanalytic-space-bot',
      },
    });
    if (existing.ok) {
      const data = await existing.json();
      sha = data.sha;
    }
  } catch { /* אם לא קיים — ממשיכים */ }

  const body: Record<string, unknown> = {
    message: `${folder.replace('-reports', '')} report ${filename.replace(/\.[^.]+$/, '')}`,
    content: encoded,
    committer: { name: 'QA-Bot', email: 'qa@psychoanalytic-space.local' },
  };
  if (sha) body.sha = sha;

  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'psychoanalytic-space-bot',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[github-report] שגיאה:', err);
      return { ok: false, error: err };
    }

    const data = await res.json();
    return { ok: true, url: data.content?.html_url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[github-report] שגיאה:', msg);
    return { ok: false, error: msg };
  }
}
