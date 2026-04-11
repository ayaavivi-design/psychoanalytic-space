'use client';
import { useState, useEffect } from 'react';
import { PenLine, Globe, Brain, Settings, LogOut, Languages, Sofa, Download, ChevronDown, BookOpen } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [theoristsOpen, setTheoristsOpen] = useState(true);
  const [tooltip, setTooltip] = useState<{ text: string; top: number; left: number; flip: boolean } | null>(null);

  const THEORIST_CARDS: Record<string, { approach: string; concepts: string; forWhom: string }> = {
    freud:    { approach: 'ארכיאולוגיה של הנפש — מה נדחק, מה חוזר, מה מסתתר מאחורי המילים', concepts: 'דחף, עיכוב, העברה, התנגדות, חלום', forWhom: 'מי שרוצה להבין שורשים, תסמינים חוזרים, או פשר של מה שלא מובן' },
    klein:    { approach: 'עולם פנימי של אובייקטים — אהבה ושנאה, פיצול ואיחוד, מה שלא ניתן לעכל', concepts: 'קנאה, פיצול, השלכה, אובייקט טוב ורע', forWhom: 'מי שרוצה לעבוד עם רגשות עזים, קשיי קרבה, חרדות עמוקות' },
    winnicott: { approach: 'המרחב שבין — משחק, החזקה, ה"אני" האמיתי שמחפש לצאת', concepts: 'סביבה מאפשרת, עצמי אמיתי ומזויף, אובייקט מעבר', forWhom: 'מי שמרגיש שמתפקד אבל לא ממש חי, מי שמחפש מרחב ולא פרשנות' },
    ogden:    { approach: 'מה שנוצר בין שני האנשים בחדר — לא בתוך האחד ולא בתוך האחר', concepts: 'שלישי אנליטי, רווריה, חלימה משותפת', forWhom: 'מי שרוצה לעבוד עם הדינמיקה בין מטפל למטופל, שפה ותהליך יצירתי' },
    loewald:  { approach: 'הקשר עצמו כגורם המרפא — האנליטיקאי כדמות הורית חדשה', concepts: 'הפנמה, זמן נפשי, אובייקט חדש, רצח אב כהכרח התפתחותי', forWhom: 'מי שמתעניין בממשק בין פרויד לרלציוניים, שינוי לאורך זמן' },
    bion:     { approach: 'מה שעדיין לא ניתן לחשוב — כיצד רגשות הופכים לניתנים לעיכול', concepts: 'אלפא ובטא, מכיל-מוכל, O, ללא זיכרון וללא רצון', forWhom: 'מי שעובד עם מצבים קשים לניסוח, חוויות כאוטיות, גבולות החשיבה' },
    kohut:    { approach: 'הצורך להרגיש מובן — לא לפרש, אלא לקלוט מבפנים', concepts: 'עצמי, אובייקט-עצמי, שיקוף, אידיאליזציה, חרדת פירוק', forWhom: 'מי שמרגיש שלא נראה, פגיעות נרקיסיסטית, אמפתיה כמתודה' },
    heimann:  { approach: 'מה שהמפגש מעורר במטפל — הקאונטרטרנספרנס כמכשיר הידע המרכזי', concepts: 'קאונטרטרנספרנס, מה שמושלך לתוך המטפל', forWhom: 'מי שמתעניין בתהליכים שקורים במטפל, סופרוויזיה, עיבוד פנימי' },
  };
  const [authLangOpen, setAuthLangOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (theoristsOpen) {
      const code = (window as any).selectedLang?.code || 'he';
      setTimeout(() => (window as any).applyUITranslation?.(code), 0);
    }
  }, [theoristsOpen]);
  return (
    <>
      {/* Auth screen */}
      <div id="auth-screen" style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }} suppressHydrationWarning>
        {mounted && <>
          {/* Language selector — top right */}
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            <div onClick={() => setAuthLangOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--muted)', padding: '6px 10px', borderRadius: 8, border: '1px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
              <Globe size={15} strokeWidth={1.75} />
            </div>
            {authLangOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px', boxShadow: '0 4px 16px rgba(45,36,32,0.1)', zIndex: 210, minWidth: 130 }}>
                {([
                  ['he','🇮🇱','עברית'],['en','🇬🇧','English'],['de','🇩🇪','Deutsch'],
                  ['es','🇪🇸','Español'],['fr','🇫🇷','Français'],['ru','🇷🇺','Русский'],
                  ['it','🇮🇹','Italiano']
                ] as [string,string,string][]).map(([code, flag, name]) => (
                  <div key={code}
                    onClick={() => { (window as any).selectLangSB(code, flag, name); setAuthLangOpen(false); }}
                    style={{ padding: '7px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    {flag} {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        <div style={{ textAlign: 'center', maxWidth: 420, width: '90%', padding: '0 20px' }}>
          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 52, color: 'var(--accent)', opacity: 0.2, marginBottom: 16 }}>ψ</div>
          <h2 id="auth-title" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--accent)', marginBottom: 8 }}>מרחב פסיכואנליטי</h2>
          <p id="auth-subtitle" style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 12 }}>כניסה או הרשמה כדי להתחיל</p>

          <div style={{ marginBottom: 16 }}>
            <div id="auth-persona-label" style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, opacity: 0.8 }}>מי אתה/את?</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['therapist','מטפל/ת'],['student','לומד/ת'],['patient','בטיפול']] as [string,string][]).map(([key, label]) => (
                <button key={key} id={`persona-auth-${key}`}
                  onClick={() => {
                    const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
                    prefs.persona = key;
                    localStorage.setItem('user_prefs', JSON.stringify(prefs));
                    ['therapist','student','patient'].forEach(k => {
                      const btn = document.getElementById(`persona-auth-${k}`);
                      if (!btn) return;
                      btn.style.background = k === key ? 'var(--accent-soft)' : 'none';
                      btn.style.borderColor = k === key ? 'var(--accent)' : 'var(--border)';
                      btn.style.color = k === key ? 'var(--accent)' : 'var(--muted)';
                    });
                    (window as any).selectPersona?.(key);
                  }}
                  style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 8px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <input id="auth-email" type="email" placeholder="כתובת מייל" dir="ltr"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-rubik), sans-serif', fontSize: 14, color: 'var(--text)', background: 'var(--surface)', outline: 'none', textAlign: 'left' }}
              onKeyDown={undefined}
            />
            <input id="auth-password" type="password" placeholder="סיסמה" dir="ltr"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 4, fontFamily: 'var(--font-rubik), sans-serif', fontSize: 14, color: 'var(--text)', background: 'var(--surface)', outline: 'none', textAlign: 'left' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button id="signin-btn"
              onClick={() => (window as any).signIn?.()}
              style={{ flex: 1, background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', borderRadius: 4, cursor: 'pointer' }}>
              כניסה
            </button>
            <button id="signup-btn"
              onClick={() => (window as any).signUp?.()}
              style={{ flex: 1, background: 'none', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', borderRadius: 4, cursor: 'pointer' }}>
              הרשמה
            </button>
          </div>
          <div id="auth-error" style={{ display: 'none', fontSize: 12, color: '#c06060', marginTop: 8 }}></div>
          <div style={{ marginTop: 10, textAlign: 'center' }}>
            <span id="auth-forgot" onClick={() => (window as any).resetPassword?.()} style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}>שכחתי סיסמה</span>
          </div>
          <p id="auth-security" style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8, marginTop: 17, opacity: 0.7 }}>
            השיחות נשמרות רק על המכשיר שלך ולא מועלות לשרת.
            <br />
            פרטי הכניסה מוצפנים ומאובטחים.
          </p>
          <p id="auth-disclaimer" style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.85, marginTop: 12, opacity: 0.6, borderTop: '1px solid var(--border)', paddingTop: 14, width: 'calc(100% + 320px)', marginLeft: '-160px', marginRight: '-160px' }}>
״מרחב פסיכואנליטי״ הוא כלי לחשיבה ולהבנה עצמית ולא תחליף לטיפול. הוא נועד ללוות אנשים שנמצאים בתהליך: בטיפול, בהכשרה, או בחקירה עצמית. פסיכואנליזה מתרחשת בין שני בני אדם בנוכחות, בקשר, ובזמן. הממשק נועד לצד המטפל, לא במקומו.
          </p>
        </div>
        </>}
      </div>

      {/* Sidebar */}
      <div id="sidebar">
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 8px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div className="sb-item" onClick={() => (window as any).newChat()}>
              <span className="sb-icon"><PenLine size={15} strokeWidth={1.75} /></span>
              <span className="sb-label">שיחה חדשה</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).toggleWebSearch()} id="sb-websearch-btn" title="חיפוש באינטרנט">
              <span className="sb-icon"><Globe size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-websearch-label">חיפוש רשת: כבוי</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).openMemory()}>
              <span className="sb-icon"><Brain size={15} strokeWidth={1.75} /></span>
              <span className="sb-label"><span id="sb-memory-count">0</span> <span id="sb-memories-label">זיכרונות</span></span>
            </div>
            <div className="sb-item" onClick={() => (window as any).exportPDF()}>
              <span className="sb-icon"><Download size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-pdf-label">הורד PDF</span>
            </div>
          </div>

          {/* Theorists section */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '6px 8px 4px' }}>
            <div className="sb-item" onClick={() => setTheoristsOpen(o => !o)}>
              <span className="sb-icon"><BookOpen size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-theorists-label" style={{ flex: 1 }}>גישה תיאורטית</span>
              <ChevronDown size={13} strokeWidth={1.75} className="theorist-chevron" style={{ color: 'var(--muted)', flexShrink: 0, transition: 'transform 0.2s', transform: theoristsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </div>
            {theoristsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingTop: 2 }}>
                {([
                  ['freud','פרויד','מה שלא נאמר'],
                  ['klein','קליין','מה שקשה לגעת בו'],
                  ['winnicott','ויניקוט','המרחב להיות'],
                  ['ogden','אוגדן','מה שנוצר בין שנינו'],
                  ['loewald','לוואלד','הקשר עצמו כגורם המרפא'],
                  ['bion','ביון','מה שעדיין לא ניתן לומר'],
                  ['kohut','קוהוט','להרגיש מובן'],
                  ['heimann','היימן','מה שהמפגש מעורר בי'],
                ] as [string, string, string][]).map(([key, label, tooltipText]) => (
                  <div key={key} className="theorist-tag sb-item" data-key={key}
                    style={{ paddingRight: 10, fontSize: 13 }}
                    onClick={(e) => (window as any).toggleTheorist(e.currentTarget, key)}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const cardHeight = 220;
                      const flip = r.top + cardHeight > window.innerHeight - 16;
                      setTooltip({ text: key, top: flip ? r.bottom - cardHeight : r.top, left: r.right + 8, flip });
                    }}
                    onMouseLeave={() => setTooltip(null)}>
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', padding: 8 }}>
          <div className="sb-user-row" onClick={() => (window as any).toggleUserMenu()} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, direction: 'rtl' }} id="sb-user-row">
            <div className="sb-avatar" id="sb-avatar" style={{ flexShrink: 0 }}>A</div>
            <div className="sb-user-info" style={{ flex: 1 }}>
              <div className="sb-user-name" id="sb-user-name">משתמש</div>
              <div className="sb-user-sub" id="sb-user-email">הגדרות ופרופיל</div>
            </div>
          </div>
          <div id="sb-user-menu" style={{ display: 'none', padding: '2px 0' }}>
            <div className="sb-item" onClick={() => (window as any).openSettings()}>
              <span className="sb-icon"><Settings size={15} strokeWidth={1.75} /></span>
              <span className="sb-label">הגדרות</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).signOut()}>
              <span className="sb-icon"><LogOut size={15} strokeWidth={1.75} /></span>
              <span className="sb-label">התנתק</span>
            </div>
            <div className="sb-item" id="lang-btn-sb" onClick={(e) => { e.stopPropagation(); (window as any).sbLangToggle(); }}>
              <span className="sb-icon"><Languages size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-lang-label">עברית</span>
            </div>
            <div id="sb-lang-expand" style={{ display: 'none', padding: '2px 4px' }}>
              {[
                ['he','🇮🇱','עברית'],['en','🇬🇧','English'],['de','🇩🇪','Deutsch'],
                ['es','🇪🇸','Español'],['fr','🇫🇷','Français'],['ru','🇷🇺','Русский'],
                ['it','🇮🇹','Italiano']
              ].map(([code, flag, name]) => (
                <div key={code} className="sb-item" style={{ fontSize: 12, paddingRight: 24 }}
                  onClick={(e) => { e.stopPropagation(); (window as any).selectLangSB(code, flag, name); }}>
                  {flag} {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div id="main-content">
        <header>
          <div className="header-top" style={{ padding: '16px 24px', direction: 'ltr' }}>
            <div onClick={() => (window as any).toggleSidebar()} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 18, padding: '2px 6px', borderRadius: 6, lineHeight: 1, flexShrink: 0 }} id="sb-toggle-btn">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                <line x1="6" y1="1" x2="6" y2="17" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </div>
            <h1>מרחב פסיכואנליטי</h1>
            <div className="header-psi">ψ</div>
          </div>
          <div className="header-session">
            <div id="session-title" style={{ display: 'none' }}></div>
            <div style={{ flex: 1 }}></div>
            <div className="session-actions">
              <div id="header-intake-btn" onClick={() => (window as any).startIntake()} style={{ display: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--accent)', border: '1px solid var(--accent-dim)', borderRadius: 20, padding: '4px 14px', fontFamily: 'var(--font-rubik), sans-serif', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}>
                שיחת היכרות
              </div>
              <div id="clinical-btn" className="memory-indicator" onClick={() => (window as any).toggleClinicalMode()} style={{ cursor: 'pointer', position: 'relative' }}
                onMouseEnter={(e) => { const tip = (e.currentTarget as HTMLElement).querySelector('.session-tooltip') as HTMLElement; if (tip) tip.style.opacity = '1'; }}
                onMouseLeave={(e) => { const tip = (e.currentTarget as HTMLElement).querySelector('.session-tooltip') as HTMLElement; if (tip) tip.style.opacity = '0'; }}>
                <Sofa size={18} strokeWidth={1.75} />
                <span id="clinical-label">סשן</span>
                <div className="session-tooltip" style={{
                  position: 'absolute', top: 'calc(100% + 10px)', left: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px', width: 220,
                  fontSize: 12, lineHeight: 1.6, color: 'var(--text)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none',
                  textAlign: 'right', direction: 'rtl', zIndex: 100,
                }}>
                  <strong style={{ display: 'block', marginBottom: 4, color: 'var(--accent)' }}>מצב סשן קליני</strong>
                  התיאוריסט הנבחר יגיב כאנליטיקאי בשיחה — לא כמרצה. מתאים להבאת חומר קליני, חלומות, או מצבים אישיים.
                </div>
              </div>
            </div>
          </div>
        </header>


        <div id="chat">
          <div className="welcome" id="welcome">
            <div className="ornament">ψ</div>
            <h2>ברוכ/ה הבא/ה</h2>
            <p>שאל/י כל שאלה בנושאי פסיכואנליזה — על תיאוריה, קליניקה, מושגים, או דרכי חשיבה של אנליטיקאים שונים.</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 16, lineHeight: 1.6 }}>
              השיחות מעובדות דרך ממשק ה-API של אנתרופיק ואינן נשמרות על ידינו ואינן משמשות לאימון מודלים.{' '}
              <span onClick={() => { const m = document.getElementById('privacy-modal'); if(m) m.style.display='flex'; }}
                style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                מדיניות פרטיות
              </span>
            </p>
          </div>
        </div>

        <div id="memory-panel">
          <div className="memory-box">
            <h2>זיכרון שיחות</h2>
            <div id="memory-list"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="clear-memory" onClick={() => (window as any).clearMemory()}>מחק זיכרון</span>
              <span className="memory-close" onClick={() => (window as any).closeMemory()}>סגור</span>
            </div>
          </div>
        </div>

        <div className="input-area-outer">
          <div className="input-area">
            <div id="file-indicator" style={{ display: 'none', background: 'rgba(196,96,122,0.06)', border: '1px solid var(--accent-dim)', borderRadius: 10, padding: '8px 14px', marginBottom: 8, alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--accent)' }}>
              <span>📄</span>
              <span id="file-name" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}></span>
              <span onClick={() => (window as any).removeFile()} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: '0 4px' }} title="הסר קובץ">✕</span>
            </div>
            <div className="input-wrap">
              <input type="file" id="file-upload" accept=".txt,.pdf,.md,.doc,.docx,.rtf" style={{ display: 'none' }}
                onChange={(e) => (window as any).handleFileUpload(e.nativeEvent)} />
              <button onClick={() => document.getElementById('file-upload')?.click()} title="העלי מסמך"
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 10px', cursor: 'pointer', fontSize: 14, color: 'var(--muted)', transition: 'all 0.2s', flexShrink: 0 }}>📎</button>
              <textarea id="user-input" placeholder="הגדר/י מטרה או שאלה" rows={1}
                onKeyDown={(e) => (window as any).handleKey(e.nativeEvent)}
                onInput={(e) => (window as any).autoResize(e.currentTarget)}></textarea>
              <button id="send-btn" onClick={() => (window as any).sendMessage()}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 12V3M7.5 3L3 7M7.5 3L12 7" stroke="rgba(255,255,255,0.88)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="hint" id="input-hint">Enter לשליחה · Shift+Enter לשורה חדשה</div>
            <div id="input-disclaimer" style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.55, textAlign: 'center', paddingTop: 6, lineHeight: 1.5 }}>
              כלי לימודי ומחקרי בלבד · אינו מהווה תחליף לטיפול פסיכולוגי מקצועי
            </div>
          </div>
        </div>

        {/* Privacy modal */}
        <div id="privacy-modal" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(45,36,32,0.4)', display: 'none', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, maxWidth: 460, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', direction: 'rtl' }}>
            <div style={{ fontSize: 24, color: 'var(--accent)', marginBottom: 12, fontFamily: 'var(--font-cormorant), serif', textAlign: 'center' }}>ψ</div>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 20, fontWeight: 300, color: 'var(--accent)', marginBottom: 20, textAlign: 'center' }}>מדיניות פרטיות</h3>

            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.9, fontFamily: 'var(--font-rubik), sans-serif' }}>
              <p style={{ marginBottom: 12 }}><strong>שיחות</strong> — מעובדות דרך ממשק ה-API של אנתרופיק בלבד. אינן נשמרות על ידינו, ואינן משמשות לאימון מודלים.</p>
              <p style={{ marginBottom: 12 }}><strong>זיכרון</strong> — נשמר באופן מקומי בדפדפן שלך בלבד. אנחנו לא רואים אותו ולא מאחסנים אותו.</p>
              <p style={{ marginBottom: 12 }}><strong>מאגר ידע</strong> — קטעים מהספרות הפסיכואנליטית מאוחסנים אצלנו כמספרים בלבד לצורך חיפוש. תוכן השיחות שלך אינו נשמר שם.</p>
              <p style={{ marginBottom: 20 }}><strong>זיהוי</strong> — אין שמירה של כתובות IP, זהות משתמש, או כל מידע מזהה אישי מעבר לנדרש לניהול החשבון.</p>
            </div>

            <button onClick={() => { const m = document.getElementById('privacy-modal'); if(m) m.style.display='none'; }}
              style={{ display: 'block', margin: '0 auto', background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px 32px', borderRadius: 20, fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer' }}>
              הבנתי
            </button>
          </div>
        </div>

        {/* Choose theorist popup */}
        <div id="choose-popup" style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(45,36,32,0.35)', display: 'none', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: '#fff', border: '1px solid #ede4e0', borderRadius: 16, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(196,96,122,0.12)' }}>
            <div style={{ fontSize: 32, color: '#c4607a', opacity: 0.3, marginBottom: 12, fontFamily: 'var(--font-cormorant), serif' }}>ψ</div>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 20, fontWeight: 300, fontStyle: 'italic', color: '#c4607a', marginBottom: 10 }}>בחרי תיאורטיקאי</h3>
            <p style={{ fontSize: 13, color: '#a8948e', lineHeight: 1.8, marginBottom: 24 }}>לחצי על אחד מהשמות למעלה כדי להפעיל את הסוכן עם הידע המעמיק של אותה גישה.</p>
            <button onClick={() => { const p = document.getElementById('choose-popup'); if(p) p.style.display='none'; }}
              style={{ background: '#c4607a', border: 'none', color: '#fff', padding: '10px 28px', borderRadius: 20, fontSize: 14, fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer' }}>הבנתי</button>
          </div>
        </div>
      </div>

      {/* Theorist card tooltip */}
      {tooltip && (() => {
        const card = THEORIST_CARDS[tooltip.text];
        if (!card) return null;
        const names: Record<string,string> = { freud:'פרויד', klein:'קליין', winnicott:'ויניקוט', ogden:'אוגדן', loewald:'לוואלד', bion:'ביון', kohut:'קוהוט', heimann:'היימן' };
        return (
          <div style={{
            position: 'fixed', top: tooltip.top, left: tooltip.left,
            pointerEvents: 'none', zIndex: 1000,
            background: 'var(--surface, #fff)', border: '1px solid var(--border, #ede4e0)',
            borderRadius: 12, padding: '14px 16px', width: 240,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            fontFamily: 'var(--font-rubik), sans-serif',
            direction: 'rtl', textAlign: 'right',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent, #c4607a)', marginBottom: 10 }}>
              {names[tooltip.text]}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted, #a8948e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>גישה</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.approach}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted, #a8948e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>מושגים</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.concepts}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted, #a8948e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>מתאים ל</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.forWhom}</div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
