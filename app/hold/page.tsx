'use client';

import { useState, useEffect, useRef } from 'react';

// ─── crisis detection — client-side, no server ───────────────────────────────

const CRISIS_KEYWORDS_HE = [
  'אובדנות','אובדני','אובדנית',
  'להתאבד','התאבדות','התאבדתי','אתאבד',
  'לפגוע בעצמי','פוגע בעצמי','פוגעת בעצמי','פגעתי בעצמי',
  'פגיעה עצמית','חותך את עצמי','חותכת את עצמי',
  'לא רוצה לחיות','לא רוצה לחיות יותר','לא רוצה להמשיך לחיות',
  'לסיים את החיים','לסיים את חיי','לסיים הכל',
  'לשים לזה סוף','לשים קץ','לשים קץ לחיים',
  'לגמור עם זה','לגמור עם הכל',
  'חשבתי לסיים','רוצה למות','רוצה להיעלם',
  'אין לי סיבה לחיות','אין טעם להמשיך',
  'לא יכול יותר','לא יכולה יותר','כבר לא יכול','כבר לא יכולה',
  'לא רוצה להתעורר','אם לא הייתי פה',
  'רוצה שהכל ייגמר','לא שווה לחיות','החיים לא שווים',
  'נמאס לי לחיות','הייתי רוצה לא להתעורר',
  'בא לי למות','באה לי למות','בא לה למות','בא לו למות',
  'לא רואה טעם להמשיך','אין לי טעם להמשיך',
  'יהיה יותר קל בלעדיי','אם לא הייתי כאן',
  'עייף מלחיות','עייפה מלחיות',
];

const CRISIS_KEYWORDS_EN = [
  'suicid','kill myself','end my life','end it all',
  'self-harm','self harm','cutting myself','hurt myself',
  "don't want to live",'want to die','want to disappear',
  'no reason to live','no point in living',
  "can't go on","can't take it anymore",
];

function detectCrisis(text: string): boolean {
  const n = text.toLowerCase();
  return CRISIS_KEYWORDS_HE.some(k => n.includes(k)) ||
         CRISIS_KEYWORDS_EN.some(k => n.includes(k));
}

// ─── copy ─────────────────────────────────────────────────────────────────────

const COPY = {
  he: {
    title: 'מה שנשאר פתוח',
    placeholder: 'מה נשאר איתך מהפגישה?',
    hint: 'נשאר על המכשיר שלך בלבד.',
    hintError: 'משהו השתבש. נסי שוב.',
    saveBtn: 'שמור',
    saving: '...',
    saved: 'נשמר.',
    savedHint: 'נשאר על המכשיר שלך בלבד.',
    again: 'כתוב עוד',
    archive: 'ארכיון',
    archiveTitle: 'ארכיון',
    archiveEmpty: 'עדיין לא כתבת כאן כלום.',
    back: '← חזרה',
    crisis: [
      'צריך לעצור כאן ולדבר ישירות.',
      '',
      'מה שכתבת מדאיג אותי. אם את/ה עוברת מחשבות על פגיעה בעצמך או על לא להמשיך לחיות — המקום הנכון עכשיו הוא לא כאן.',
      '',
      'פנה/י לעזרה עכשיו:',
      'ער"ן: 1201 — חינמי, 24/7, אנונימי',
      'סה"ר: sahar.org.il — צ\'אט ותמיכה',
      'מד"א: 101',
      'המטפל/ת שלך — אם אפשר, פנה/י אליה/ו גם מחוץ לשעות הפגישה',
      '',
      'Between לא מחליף תמיכה אנושית, ולא בנוי לרגעים כאלה.',
    ],
  },
  en: {
    title: 'What stayed with you',
    placeholder: "What's still with you?",
    hint: 'Stays on your device only.',
    hintError: 'Something went wrong. Try again.',
    saveBtn: 'Save',
    saving: '...',
    saved: 'Saved.',
    savedHint: 'Stays on your device only.',
    again: 'Write again',
    archive: 'Archive',
    archiveTitle: 'Archive',
    archiveEmpty: "You haven't written here yet.",
    back: '← Back',
    crisis: [
      'I need to stop here and speak with you directly.',
      '',
      "What you wrote concerns me. If you're having thoughts of harming yourself or not wanting to continue living — this is not the right place right now.",
      '',
      'Please reach out for help now:',
      'Crisis Text Line: Text HOME to 741741',
      'National Suicide Prevention Lifeline: 988',
      'Emergency services: 911',
      'Your therapist — if possible, reach out even outside of session hours',
      '',
      'Between is not a substitute for human support, and was not built for moments like this.',
    ],
  },
};

const LS_KEY = 'bw_hold_entries';

// ─── component ────────────────────────────────────────────────────────────────

export default function HoldPage() {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'crisis' | 'archive'>('idle');
  const [entries, setEntries] = useState<{ content: string; created_at: string }[]>([]);
  const [isEn, setIsEn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const baseContentRef = useRef('');
  const recognitionRef = useRef<unknown>(null);

  // client-only init — runs after mount, avoids SSR/client hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem('bw_lang');
    const code = saved ??
      (window as { selectedLang?: { code: string } }).selectedLang?.code ??
      (navigator.language.startsWith('he') ? 'he' : 'en');
    setIsEn(code === 'en');
    setVoiceSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  const toggleLang = () => {
    const next = !isEn;
    setIsEn(next);
    localStorage.setItem('bw_lang', next ? 'en' : 'he');
  };

  const openArchive = () => {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '[]') as { content: string; created_at: string }[];
    setEntries(saved.slice().reverse());
    setStatus('archive');
  };

  const deleteEntry = (createdAt: string) => {
    const saved = JSON.parse(localStorage.getItem(LS_KEY) || '[]') as { content: string; created_at: string }[];
    const updated = saved.filter(e => e.created_at !== createdAt);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    setEntries(updated.slice().reverse());
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(isEn ? 'en-GB' : 'he-IL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSave = () => {
    if (!content.trim() || status === 'saving') return;
    setStatus('saving');

    if (detectCrisis(content)) {
      setStatus('crisis');
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem(LS_KEY) || '[]') as unknown[];
      existing.push({ content: content.trim(), created_at: new Date().toISOString() });
      localStorage.setItem(LS_KEY, JSON.stringify(existing));
      setStatus('saved');
    } catch {
      setStatus('idle');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any)?.stop();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = new SR() as any;
    r.lang = isEn ? 'en-US' : 'he-IL';
    r.continuous = false;
    r.interimResults = true;
    baseContentRef.current = content;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      if (final) {
        baseContentRef.current = baseContentRef.current ? baseContentRef.current + ' ' + final : final;
        setContent(baseContentRef.current);
      } else {
        setContent(baseContentRef.current ? baseContentRef.current + ' ' + interim : interim);
      }
    };
    r.onend = () => { setIsRecording(false); recognitionRef.current = null; };
    r.onerror = () => { setIsRecording(false); recognitionRef.current = null; };
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
  };

  const t = isEn ? COPY.en : COPY.he;
  const dir = isEn ? 'ltr' : 'rtl';
  const hasContent = content.trim().length > 0;

  return (
    <>
      <style>{`
        #hold-textarea::placeholder { color: var(--muted); opacity: 0.7; }
        #hold-save-btn:not(:disabled):hover { background: var(--accent-dim) !important; border-color: var(--accent-dim) !important; }
        @keyframes bw-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .bw-mic-recording { animation: bw-pulse 1.2s ease-in-out infinite; }
      `}</style>

      {/* full-screen background */}
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--bg)', zIndex: 10 }} />

      {/* centered content */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
        <div style={{
          width: '100%',
          maxWidth: '600px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 28px 32px',
          boxSizing: 'border-box',
          direction: dir,
          fontFamily: 'var(--font-rubik), sans-serif',
        }}>

          {/* logo */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '26px', fontWeight: 300, fontStyle: 'italic', color: 'var(--accent)', letterSpacing: '0.04em' }}>Between</span>
          </div>

          {/* heading row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '20px', fontWeight: 300, color: 'var(--muted)' }}>
              {t.title}
            </div>
            <button onClick={toggleLang} title={isEn ? 'Switch to Hebrew' : 'עבור לאנגלית'} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--muted)', fontSize: '11px', fontFamily: 'var(--font-rubik), sans-serif', padding: '4px', opacity: 0.7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>{isEn ? 'עב' : 'EN'}</span>
            </button>
          </div>

          {/* crisis */}
          {status === 'crisis' && (
            <div style={{ flex: 1, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', lineHeight: 1.9, overflowY: 'auto' }}>
              {t.crisis.map((line, i) =>
                line === '' ? <br key={i} /> : <p key={i} style={{ margin: '4px 0', fontSize: '15px', color: 'var(--text)' }}>{line}</p>
              )}
            </div>
          )}

          {/* main form */}
          {(status === 'idle' || status === 'saving') && (
            <>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxSizing: 'border-box' }}>
                <textarea
                  id="hold-textarea"
                  value={content}
                  onChange={(e) => { baseContentRef.current = e.target.value; setContent(e.target.value); }}
                  dir={dir}
                  autoFocus
                  placeholder={t.placeholder}
                  style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font-rubik), sans-serif', fontSize: '15px', lineHeight: 1.85, color: 'var(--text)', backgroundColor: 'transparent', resize: 'none', direction: dir, width: '100%', boxSizing: 'border-box', minHeight: '220px' }}
                />
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <span>{t.hint}</span>
                  <span onClick={openArchive} style={{ cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px', whiteSpace: 'nowrap', [isEn ? 'marginLeft' : 'marginRight']: '12px', flexShrink: 0 }}>{t.archive}</span>
                  {voiceSupported && (
                    <button onClick={toggleRecording} className={isRecording ? 'bw-mic-recording' : ''} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', [isEn ? 'marginLeft' : 'marginRight']: '10px', color: isRecording ? 'var(--accent)' : 'var(--muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      {isRecording
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                      }
                    </button>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button id="hold-save-btn" onClick={handleSave} disabled={!hasContent || status === 'saving'} style={{ background: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '22px', cursor: hasContent ? 'pointer' : 'default', fontFamily: 'var(--font-rubik), sans-serif', fontSize: '13px', color: '#fff', opacity: hasContent ? 1 : 0.35, transition: 'opacity 0.15s', padding: '9px 28px' }}>
                  {status === 'saving' ? t.saving : t.saveBtn}
                </button>
              </div>
            </>
          )}

          {/* archive */}
          {status === 'archive' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '18px', fontWeight: 300, color: 'var(--muted)' }}>
                  {t.archiveTitle}
                </div>
                <span onClick={() => setStatus('idle')} style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                  {t.back}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {entries.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '20px' }}>{t.archiveEmpty}</p>
                ) : (
                  entries.map((entry, i) => (
                    <div key={i} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{formatDate(entry.created_at)}</span>
                        <button onClick={() => deleteEntry(entry.created_at)} title={isEn ? 'Delete' : 'מחק'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--muted)', opacity: 0.5, lineHeight: 1, fontSize: '14px' }}>×</button>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap', direction: entry.content.match(/[֐-׿]/) ? 'rtl' : 'ltr' }}>
                        {entry.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* saved */}
          {status === 'saved' && (
            <>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxSizing: 'border-box' }}>
                <div style={{ flex: 1 }} />
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '16px', fontSize: '11px', color: 'var(--muted)' }}>{t.savedHint}</div>
              </div>
              <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: '22px', fontWeight: 300, color: 'var(--muted)', letterSpacing: '0.03em' }}>{t.saved}</span>
                <span onClick={() => { setContent(''); setStatus('idle'); }} style={{ fontSize: '12px', color: 'var(--muted)', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer', opacity: 0.7 }}>{t.again}</span>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
}
