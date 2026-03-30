'use client';
import { PenLine, Globe, Brain, Settings, LogOut, Languages, Sofa, Download } from 'lucide-react';

export default function Home() {
  return (
    <>
      {/* Auth screen */}
      <div id="auth-screen" style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 420, width: '90%', padding: '0 20px' }}>
          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 52, color: 'var(--accent)', opacity: 0.2, marginBottom: 16 }}>ψ</div>
          <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: 'var(--accent)', marginBottom: 8 }}>מרחב פסיכואנליטי לסקרנים</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>כניסה או הרשמה כדי להתחיל</p>

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
            <span onClick={() => (window as any).resetPassword?.()} style={{ fontSize: 12, color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline' }}>שכחתי סיסמה</span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8, marginTop: 20, opacity: 0.7 }}>
            השיחות נשמרות רק על המכשיר שלך ולא מועלות לשרת.
            <br />
            פרטי הכניסה מוצפנים ומאובטחים.
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, marginTop: 14, opacity: 0.6, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            ״מרחב פסיכואנליטי לסקרנים״ הוא כלי לימודי, מחקרי וייעוצי, אך אינו מהווה תחליף לטיפול פסיכולוגי. פסיכואנליזה היא תהליך המתרחש בין שני בני אדם ומבוססת על נוכחות רגשית וקשר אנושי חי — אלמנטים ששום טכנולוגיה אינה יכולה לשחזר. הממשק נועד לעזור לך לחשוב, להסתקרן ולהעמיק בהבנת המבנה הנפשי, אך אינו יכול להחליף את ההחזקה והליווי המקצועי שמספק מטפל אנושי.
          </p>
        </div>
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
              <span className="sb-label">הורד PDF</span>
            </div>
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
                ['ar','🇸🇦','العربية'],['it','🇮🇹','Italiano'],['pt','🇧🇷','Português'],
                ['ja','🇯🇵','日本語'],['zh','🇨🇳','中文']
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
            <h1 style={{ direction: 'rtl' }}>מרחב פסיכואנליטי לסקרנים</h1>
            <div className="header-psi">ψ</div>
          </div>
          <div className="header-session">
            <div id="session-title" style={{ display: 'none' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflowX: 'auto', minWidth: 0, scrollbarWidth: 'none' }}>
              {[
                ['freud','פרויד'],['klein','קליין'],['winnicott','ויניקוט'],
                ['ogden','אוגדן'],['loewald','לוואלד'],['bion','ביון'],
                ['kohut','קוהוט'],['heimann','היימן']
              ].map(([key, label]) => (
                <div key={key} className="theorist-tag" data-key={key}
                  onClick={(e) => (window as any).toggleTheorist(e.currentTarget, key)}>
                  {label}
                </div>
              ))}
            </div>
            <div className="session-actions">
              <div id="clinical-btn" className="memory-indicator" onClick={() => (window as any).toggleClinicalMode()} style={{ cursor: 'pointer' }} title="מצב יישום">
                <Sofa size={18} strokeWidth={1.75} />
                <span id="clinical-label">סשן</span>
              </div>
            </div>
          </div>
        </header>


        <div id="chat">
          <div className="welcome" id="welcome">
            <div className="ornament">ψ</div>
            <h2>ברוכ/ה הבא/ה</h2>
            <p>שאל/י כל שאלה בנושאי פסיכואנליזה — על תיאוריה, קליניקה, מושגים, או דרכי חשיבה של אנליטיקאים שונים.</p>
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
            <div style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.55, textAlign: 'center', paddingTop: 6, lineHeight: 1.5 }}>
              כלי לימודי ומחקרי בלבד · אינו מהווה תחליף לטיפול פסיכולוגי מקצועי
            </div>
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

    </>
  );
}
