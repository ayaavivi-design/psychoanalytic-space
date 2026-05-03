'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const THEORIST_LABELS: Record<string, string> = {
  winnicott: 'ויניקוט',
  freud: 'פרויד',
  klein: 'קליין',
  bion: 'ביון',
  kohut: 'קוהוט',
  ogden: 'אוגדן',
  loewald: 'לוואלד',
  heimann: 'היימן',
};

interface Stats {
  totalRegistered: number;
  totalConversations: number;
  thisWeek: number;
  retention: { conv1: number; conv2: number; conv3: number; conv4plus: number };
  features: {
    hadSummary: number;
    hadSupervision: number;
    pdfDownloaded: number;
    sentToTherapist: number;
    usedClinicalMode: number;
  };
  theorists: [string, number][];
  avgMessages: number;
  userList: { email: string; convCount: number; lastActive: string }[];
}

function pct(n: number, total: number) {
  if (!total) return '0%';
  return Math.round((n / total) * 100) + '%';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  return `לפני ${days} ימים`;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('לא מחובר — יש להיכנס עם חשבון אדמין');
        setLoading(false);
        return;
      }
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

  const { retention, features, theorists, userList } = stats;
  const maxTheorist = theorists[0]?.[1] || 1;

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f6', fontFamily: 'Rubik, sans-serif', direction: 'rtl', padding: '40px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontStyle: 'italic', color: '#c4607a' }}>Between</span>
          <span style={{ fontSize: 13, color: '#a8948e' }}>— דשבורד</span>
          <span style={{ fontSize: 11, color: '#ccc', marginRight: 'auto' }}>{new Date().toLocaleDateString('he-IL')}</span>
        </div>

        {/* Top KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
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

        {/* Retention Funnel */}
        <Section title="Retention — פאנל שיחות">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'שיחה 1', n: retention.conv1, base: retention.conv1 },
              { label: 'שיחה 2', n: retention.conv2, base: retention.conv1 },
              { label: 'שיחה 3', n: retention.conv3, base: retention.conv1 },
              { label: 'שיחה 4+', n: retention.conv4plus, base: retention.conv1 },
            ].map(({ label, n, base }) => {
              const p = base ? Math.round((n / base) * 100) : 0;
              return (
                <div key={label} style={{ background: '#fff', border: '1px solid #ede4e0', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#a8948e', marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 300, color: '#2d2420', marginBottom: 4 }}>{n}</div>
                  <div style={{ fontSize: 12, color: p === 100 ? '#a8948e' : p >= 50 ? '#2d8a5e' : '#c4607a', fontWeight: 500 }}>
                    {p}%
                  </div>
                  <div style={{ marginTop: 8, height: 4, background: '#f5f0f7', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${p}%`, background: '#c4607a', borderRadius: 4, transition: 'width 0.4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#ccc' }}>
            * אחוזים מחושבים יחסית למשתמשים שפתחו לפחות שיחה אחת ({retention.conv1})
          </div>
        </Section>

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
              <div key={label} style={{ background: '#fff', border: '1px solid #ede4e0', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, marginBottom: 6, opacity: 0.6 }}>{icon}</div>
                <div style={{ fontSize: 24, fontWeight: 300, color: '#2d2420', marginBottom: 4 }}>{n}</div>
                <div style={{ fontSize: 10, color: '#a8948e', lineHeight: 1.4 }}>{label}</div>
                <div style={{ fontSize: 10, color: '#ccc', marginTop: 2 }}>
                  {pct(n, stats.totalConversations)} מהשיחות
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Two columns: theorists + avg depth */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Theorists */}
          <Section title="תיאורטיקנים" noMargin>
            {theorists.length === 0 ? (
              <div style={{ fontSize: 12, color: '#ccc', padding: '8px 0' }}>אין נתונים עדיין</div>
            ) : theorists.map(([t, n]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 64, fontSize: 12, color: '#2d2420', flexShrink: 0 }}>
                  {THEORIST_LABELS[t] || t}
                </div>
                <div style={{ flex: 1, height: 8, background: '#f5f0f7', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((n / maxTheorist) * 100)}%`, background: '#c4607a', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: '#a8948e', width: 28, textAlign: 'left', flexShrink: 0 }}>{n}</div>
              </div>
            ))}
          </Section>

          {/* Avg depth */}
          <Section title="עומק שיחה" noMargin>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, fontWeight: 200, color: '#c4607a', lineHeight: 1 }}>
                {stats.avgMessages || '—'}
              </div>
              <div style={{ fontSize: 12, color: '#a8948e', marginTop: 8 }}>הודעות ממוצע לשיחה</div>
              {stats.avgMessages > 0 && (
                <div style={{ fontSize: 11, color: '#ccc', marginTop: 4 }}>
                  {stats.avgMessages < 4 ? 'נמוך — ייתכן bounce' :
                   stats.avgMessages < 10 ? 'בינוני' :
                   'עמוק — engagement אמיתי'}
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* Users Table */}
        <Section title={`משתמשים (${userList.length} אחרונים)`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ede4e0' }}>
                  {['אימייל', 'שיחות', 'פעילות אחרונה'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: '#a8948e', fontWeight: 500, letterSpacing: '0.05em', fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {userList.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f5f0f7' }}>
                    <td style={{ padding: '10px 12px', color: '#2d2420' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px', color: '#2d2420', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', background: u.convCount >= 3 ? 'rgba(196,96,122,0.1)' : '#f5f0f7',
                        color: u.convCount >= 3 ? '#c4607a' : '#a8948e',
                        borderRadius: 12, padding: '2px 10px', fontWeight: 500
                      }}>{u.convCount}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#a8948e' }}>{timeAgo(u.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <div style={{ fontSize: 10, color: '#ccc', textAlign: 'center', marginTop: 32 }}>
          Between Analytics — {new Date().toLocaleString('he-IL')}
        </div>
      </div>
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
