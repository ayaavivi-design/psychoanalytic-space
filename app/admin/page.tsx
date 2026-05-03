'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const THEORIST_LABELS: Record<string, string> = {
  winnicott: 'ויניקוט', freud: 'פרויד', klein: 'קליין', bion: 'ביון',
  kohut: 'קוהוט', ogden: 'אוגדן', loewald: 'לוואלד', heimann: 'היימן',
};

interface UserRow {
  email: string;
  createdAt: string;
  convCount: number;
  lastActive: string | null;
}

interface Stats {
  totalRegistered: number;
  totalConversations: number;
  thisWeek: number;
  retention: { conv1: number; conv2: number; conv3: number; conv4plus: number };
  features: {
    hadSummary: number; hadSupervision: number;
    pdfDownloaded: number; sentToTherapist: number; usedClinicalMode: number;
  };
  theorists: [string, number][];
  avgMessages: number;
  allUsers: UserRow[];
}

function pct(n: number, total: number) {
  if (!total) return '0%';
  return Math.round((n / total) * 100) + '%';
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  return `לפני ${days} ימים`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// בונה נתוני גרף — הרשמות לפי שבוע (8 שבועות אחרונים)
function buildWeeklyBuckets(users: UserRow[]) {
  const now = Date.now();
  const buckets: { label: string; count: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const start = now - (w + 1) * 7 * 86400000;
    const end   = now - w * 7 * 86400000;
    const startDate = new Date(start);
    const label = `${startDate.getDate()}/${startDate.getMonth() + 1}`;
    const count = users.filter(u => {
      const t = new Date(u.createdAt).getTime();
      return t >= start && t < end;
    }).length;
    buckets.push({ label, count });
  }
  return buckets;
}

// Toggle button
function Toggle({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          padding: '4px 12px', borderRadius: 20, border: '1px solid',
          borderColor: value === o.key ? '#c4607a' : '#ede4e0',
          background: value === o.key ? '#c4607a' : 'transparent',
          color: value === o.key ? '#fff' : '#a8948e',
          cursor: 'pointer', fontSize: 11, fontFamily: 'Rubik, sans-serif',
          transition: 'all 0.15s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// גרף עמודות SVG
function BarChart({ data, color = '#c4607a' }: { data: { label: string; count: number }[]; color?: string }) {
  const maxVal = Math.max(...data.map(d => d.count), 1);
  const h = 120;
  const barW = 32;
  const gap = 12;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={totalW} height={h + 32} style={{ display: 'block', margin: '0 auto' }}>
        {data.map((d, i) => {
          const barH = Math.round((d.count / maxVal) * h);
          const x = i * (barW + gap);
          return (
            <g key={i}>
              <rect x={x} y={h - barH} width={barW} height={barH}
                fill={color} opacity={0.85} rx={4} />
              {d.count > 0 && (
                <text x={x + barW / 2} y={h - barH - 5}
                  textAnchor="middle" fontSize={10} fill="#a8948e">{d.count}</text>
              )}
              <text x={x + barW / 2} y={h + 18}
                textAnchor="middle" fontSize={9} fill="#ccc">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersView, setUsersView] = useState<'table' | 'chart'>('table');
  const [retentionView, setRetentionView] = useState<'cards' | 'chart'>('cards');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError('לא מחובר — יש להיכנס עם חשבון אדמין'); setLoading(false); return; }
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `שגיאה ${res.status}`);
        setLoading(false);
        return;
      }
      setStats(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf8f6', fontFamily: 'Rubik, sans-serif', color: '#a8948e' }}>
        טוען...
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdf8f6', fontFamily: 'Rubik, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#c4607a' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>ψ</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }
  if (!stats) return null;

  const { retention, features, theorists, allUsers } = stats;
  const maxTheorist = theorists[0]?.[1] || 1;
  const weeklyData = buildWeeklyBuckets(allUsers);
  const retentionData = [
    { label: 'שיחה 1', count: retention.conv1 },
    { label: 'שיחה 2', count: retention.conv2 },
    { label: 'שיחה 3', count: retention.conv3 },
    { label: 'שיחה 4+', count: retention.conv4plus },
  ];

  const filteredUsers = allUsers.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f6', fontFamily: 'Rubik, sans-serif', direction: 'rtl', padding: '40px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontStyle: 'italic', color: '#c4607a' }}>Between</span>
          <span style={{ fontSize: 13, color: '#a8948e' }}>— דשבורד</span>
          <span style={{ fontSize: 11, color: '#ccc', marginRight: 'auto' }}>{new Date().toLocaleDateString('he-IL')}</span>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'משתמשים רשומים', value: stats.totalRegistered },
            { label: 'סה"כ שיחות', value: stats.totalConversations },
            { label: 'שיחות השבוע', value: stats.thisWeek },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #ede4e0', borderRadius: 10, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, color: '#a8948e', marginBottom: 6, letterSpacing: '0.06em' }}>{label}</div>
              <div style={{ fontSize: 32, fontWeight: 300, color: '#2d2420' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Retention */}
        <SectionHeader title="Retention — פאנל שיחות">
          <Toggle
            options={[{ key: 'cards', label: '⊞ כרטיסים' }, { key: 'chart', label: '▦ גרף' }]}
            value={retentionView}
            onChange={v => setRetentionView(v as 'cards' | 'chart')}
          />
        </SectionHeader>
        <div style={{ background: '#fff', border: '1px solid #ede4e0', borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
          {retentionView === 'cards' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {retentionData.map(({ label, count }) => {
                  const p = retention.conv1 ? Math.round((count / retention.conv1) * 100) : 0;
                  return (
                    <div key={label} style={{ border: '1px solid #ede4e0', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: '#a8948e', marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 28, fontWeight: 300, color: '#2d2420', marginBottom: 4 }}>{count}</div>
                      <div style={{ fontSize: 12, color: p === 100 ? '#a8948e' : p >= 50 ? '#2d8a5e' : '#c4607a', fontWeight: 500 }}>{p}%</div>
                      <div style={{ marginTop: 8, height: 4, background: '#f5f0f7', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${p}%`, background: '#c4607a', borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: 11, color: '#ccc' }}>
                * אחוזים מחושבים יחסית למשתמשים שפתחו לפחות שיחה אחת ({retention.conv1})
              </div>
            </>
          ) : (
            <BarChart data={retentionData} />
          )}
        </div>

        {/* Feature Usage */}
        <Section title="שימוש בכלים">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'סיכום סשן', n: features.hadSummary, icon: '◎' },
              { label: 'פיקוח קליני', n: features.hadSupervision, icon: '⚲' },
              { label: 'הורד PDF', n: features.pdfDownloaded, icon: '↓' },
              { label: 'שלח למטפל', n: features.sentToTherapist, icon: '✉' },
              { label: 'מצב סשן 🛋', n: features.usedClinicalMode, icon: '🛋' },
            ].map(({ label, n, icon }) => (
              <div key={label} style={{ border: '1px solid #ede4e0', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 6, opacity: 0.6 }}>{icon}</div>
                <div style={{ fontSize: 24, fontWeight: 300, color: '#2d2420', marginBottom: 4 }}>{n}</div>
                <div style={{ fontSize: 10, color: '#a8948e', lineHeight: 1.4 }}>{label}</div>
                <div style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>{pct(n, stats.totalConversations)} מהשיחות</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Theorists + Depth */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          <Section title="תיאורטיקנים" noMargin>
            {theorists.length === 0 ? (
              <div style={{ fontSize: 12, color: '#ccc', padding: '8px 0' }}>אין נתונים עדיין</div>
            ) : theorists.map(([t, n]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 64, fontSize: 12, color: '#2d2420', flexShrink: 0 }}>{THEORIST_LABELS[t] || t}</div>
                <div style={{ flex: 1, height: 8, background: '#f5f0f7', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((n / maxTheorist) * 100)}%`, background: '#c4607a', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: '#a8948e', width: 28, textAlign: 'left', flexShrink: 0 }}>{n}</div>
              </div>
            ))}
          </Section>
          <Section title="עומק שיחה" noMargin>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, fontWeight: 200, color: '#c4607a', lineHeight: 1 }}>{stats.avgMessages || '—'}</div>
              <div style={{ fontSize: 12, color: '#a8948e', marginTop: 8 }}>הודעות ממוצע לשיחה</div>
              {stats.avgMessages > 0 && (
                <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>
                  {stats.avgMessages < 4 ? 'נמוך — ייתכן bounce' : stats.avgMessages < 10 ? 'בינוני' : 'עמוק — engagement אמיתי'}
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Users Section */}
        <SectionHeader title={`משתמשים — ${allUsers.length} רשומים`}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש לפי מייל..."
              style={{
                padding: '4px 10px', border: '1px solid #ede4e0', borderRadius: 20,
                fontSize: 11, fontFamily: 'Rubik, sans-serif', color: '#2d2420',
                background: '#fff', outline: 'none', direction: 'ltr', width: 160,
              }}
            />
            <Toggle
              options={[{ key: 'table', label: '≡ רשימה' }, { key: 'chart', label: '▦ גרף' }]}
              value={usersView}
              onChange={v => setUsersView(v as 'table' | 'chart')}
            />
          </div>
        </SectionHeader>
        <div style={{ background: '#fff', border: '1px solid #ede4e0', borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
          {usersView === 'chart' ? (
            <>
              <div style={{ fontSize: 11, color: '#a8948e', marginBottom: 16 }}>הרשמות לפי שבוע — 8 שבועות אחרונים</div>
              <BarChart data={weeklyData} />
            </>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid #ede4e0' }}>
                    {['אימייל', 'תאריך הרשמה', 'שיחות', 'פעילות אחרונה'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: '#a8948e', fontWeight: 500, fontSize: 10, letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '20px 12px', color: '#ccc', textAlign: 'center', fontSize: 12 }}>לא נמצאו תוצאות</td></tr>
                  ) : filteredUsers.map((u, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f0f7' }}>
                      <td style={{ padding: '9px 12px', color: '#2d2420', direction: 'ltr' }}>{u.email}</td>
                      <td style={{ padding: '9px 12px', color: '#a8948e' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          background: u.convCount >= 3 ? 'rgba(196,96,122,0.1)' : u.convCount === 0 ? '#f9f6fb' : '#f5f0f7',
                          color: u.convCount >= 3 ? '#c4607a' : u.convCount === 0 ? '#ccc' : '#a8948e',
                          borderRadius: 12, padding: '2px 10px', fontWeight: 500, minWidth: 24,
                        }}>{u.convCount}</span>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#a8948e' }}>{timeAgo(u.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length > 0 && (
                <div style={{ fontSize: 10, color: '#ccc', marginTop: 10, paddingTop: 8, borderTop: '1px solid #f5f0f7' }}>
                  מציג {filteredUsers.length} מתוך {allUsers.length} משתמשים
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 8 }}>
          Between Analytics — {new Date().toLocaleString('he-IL')}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: '#a8948e', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}

function Section({ title, children, noMargin }: { title: string; children: React.ReactNode; noMargin?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ede4e0', borderRadius: 10, padding: '20px 24px', marginBottom: noMargin ? 0 : 24 }}>
      <div style={{ fontSize: 10, color: '#a8948e', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>{title}</div>
      {children}
    </div>
  );
}
