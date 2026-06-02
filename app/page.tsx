'use client';
import { useState, useEffect, useRef } from 'react';
import { PenLine, Globe, Brain, Settings, LogOut, Languages, Download, ChevronDown, BookOpen, Sofa, NotebookPen, Mic, ScrollText } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [theoristsOpen, setTheoristsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; top: number; left: number; flip: boolean } | null>(null);
  const [hoveredMode, setHoveredMode] = useState<string>('session');
  const [currentLang, setCurrentLang] = useState('en');
  const [holdText, setHoldText] = useState('');
  const [holdTheorist, setHoldTheorist] = useState('winnicott');
  const [showHoldTheoristPicker, setShowHoldTheoristPicker] = useState(false);
  const [holdSaveStatus, setHoldSaveStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseHoldTextRef = useRef('');
  const holdTextareaRef = useRef<HTMLDivElement>(null);

  const THEORIST_CARDS: Record<string, Record<string, { approach: string; concepts: string; forWhom: string }>> = {
    freud: {
      he: { approach: 'ארכיאולוגיה של הנפש — מה נדחק, מה חוזר, מה מסתתר מאחורי המילים', concepts: 'דחף, עיכוב, העברה, התנגדות, חלום', forWhom: 'מי שרוצה להבין שורשים, תסמינים חוזרים, או פשר של מה שלא מובן' },
      en: { approach: 'Archaeology of the mind — what is repressed, what returns, what hides behind words', concepts: 'Drive, repression, transference, resistance, dream', forWhom: 'Those seeking to understand roots, recurring patterns, or the meaning of what is unclear' },
    },
    klein: {
      he: { approach: 'עולם פנימי של אובייקטים — אהבה ושנאה, פיצול ואיחוד, מה שלא ניתן לעכל', concepts: 'קנאה, פיצול, השלכה, אובייקט טוב ורע', forWhom: 'מי שרוצה לעבוד עם רגשות עזים, קשיי קרבה, חרדות עמוקות' },
      en: { approach: 'Inner world of objects — love and hate, splitting and integration, what cannot be digested', concepts: 'Envy, splitting, projection, good and bad object', forWhom: 'Those working with intense emotions, difficulty with closeness, or deep anxieties' },
    },
    winnicott: {
      he: { approach: 'המרחב שבין — משחק, החזקה, ה"אני" האמיתי שמחפש לצאת', concepts: 'סביבה מאפשרת, עצמי אמיתי ומזויף, אובייקט מעבר', forWhom: 'מי שמרגיש שמתפקד אבל לא ממש חי, מי שמחפש מרחב ולא פרשנות' },
      en: { approach: 'The in-between space — play, holding, the true self seeking to emerge', concepts: 'Facilitating environment, true and false self, transitional object', forWhom: 'Those who feel they function but are not really alive, seeking space rather than interpretation' },
    },
    ogden: {
      he: { approach: 'מה שנוצר בין שני האנשים בחדר — לא בתוך האחד ולא בתוך האחר', concepts: 'שלישי אנליטי, רווריה, חלימה משותפת', forWhom: 'מי שרוצה לעבוד עם הדינמיקה בין מטפל למטופל, שפה ותהליך יצירתי' },
      en: { approach: 'What is created between the two people in the room — belonging to neither alone', concepts: 'Analytic third, reverie, co-dreaming', forWhom: 'Those interested in the therapist-patient dynamic, language, and creative process' },
    },
    vera: {
      he: { approach: 'נוכחות לפני פרשנות — להיות איתך לפני שעושים משהו עם מה שמביאים', concepts: 'הינכחות, החזקה, שהייה בחשכה, לב שומע', forWhom: 'מי שמעבד משהו מהפגישה האחרונה שעדיין לא שקע' },
      en: { approach: 'Presence before action — staying with what you carry before making it into meaning', concepts: 'Presencing, holding, staying in the dark, listening heart', forWhom: 'Those processing something from a recent session that has not yet settled' },
    },
    elliot: {
      he: { approach: 'שהייה במה שאין לו עדיין מילים — ללא פרשנות, ללא הסבר', concepts: 'מצב being, מצב doing, החזקה, הימנעות כשפה', forWhom: 'מי שעדיין בתוך הפגישה ולא מוכן לעשות ממנה סיפור' },
      en: { approach: 'Staying in what has no words yet — no interpretation, no rush toward meaning', concepts: 'Being state, doing state, holding without direction', forWhom: 'Those still inside something from the session, not ready to make it into a story' },
    },
  };
  const CARD_LABELS: Record<string, { approach: string; concepts: string; forWhom: string }> = {
    he: { approach: 'גישה', concepts: 'מושגים', forWhom: 'מתאים ל' },
    en: { approach: 'Approach', concepts: 'Concepts', forWhom: 'For whom' },
  };
  const THEORIST_NAMES_I18N: Record<string, Record<string, string>> = {
    freud:    { he: 'פרויד',   en: 'Freud'    },
    klein:    { he: 'קליין',   en: 'Klein'    },
    winnicott:{ he: 'ויניקוט', en: 'Winnicott'},
    ogden:    { he: 'אוגדן',   en: 'Ogden'    },
    vera:     { he: 'ורה',     en: 'Vera'     },
    elliot:   { he: 'אליוט',   en: 'Elliot'   },
  };
  const SESSION_TIP_I18N: Record<string, { title: string; text: string }> = {
    he: { title: 'סשן', text: 'התיאורטיקן הנבחר חושב איתך בין הפגישות — לעבד מה שעלה ולמצוא מה להביא לפגישה הבאה.' },
    en: { title: 'Session', text: 'The selected theorist thinks with you between sessions — to process what came up and find what to bring to your next session.' },
  };
  const EXPLORE_TIP_I18N: Record<string, { title: string; text: string }> = {
    he: { title: 'חיפוש', text: 'להבין גישה תיאורטית, לשאול על מושג — ללא עיבוד חומר אישי.' },
    en: { title: 'Explore', text: 'Understand a theoretical approach, ask about a concept — no personal material needed.' },
  };
  const WRITE_TIP_I18N: Record<string, { title: string; text: string }> = {
    he: { title: 'כתיבה', text: 'כתוב למטפל שלך — או רק לעצמך. מה שנשאר, מה שלא נאמר.' },
    en: { title: 'Write', text: 'Write to your therapist — or just for yourself. What stayed, what wasn\'t said.' },
  };
  const WELCOME_I18N: Record<string, { heading: string; apiText: string; privacyLink: string }> = {
    he: { heading: 'מה נשאר איתך', apiText: 'השיחות מעובדות דרך ממשק ה-API של אנתרופיק ואינן נשמרות על ידינו ואינן משמשות לאימון מודלים.', privacyLink: 'מדיניות פרטיות' },
    en: { heading: 'What stayed with you', apiText: "Conversations are processed through Anthropic's API and are not stored by us or used for model training.", privacyLink: 'Privacy Policy' },
  };
  const PRIVACY_I18N: Record<string, { title: string; paragraphs: { label: string; text: string }[]; btnOk: string }> = {
    he: {
      title: 'מדיניות פרטיות',
      paragraphs: [
        { label: 'שיחות', text: 'מעובדות דרך ממשק ה-API של אנתרופיק בלבד. אינן נשמרות על ידינו, ואינן משמשות לאימון מודלים.' },
        { label: 'זיכרון', text: 'נשמר באופן מקומי בדפדפן שלך בלבד. אנחנו לא רואים אותו ולא מאחסנים אותו.' },
        { label: 'מאגר ידע', text: 'קטעים מהספרות הפסיכואנליטית מאוחסנים אצלנו כמספרים בלבד לצורך חיפוש. תוכן השיחות שלך אינו נשמר שם.' },
        { label: 'זיהוי', text: 'אין שמירה של כתובות IP, זהות משתמש, או כל מידע מזהה אישי מעבר לנדרש לניהול החשבון.' },
      ],
      btnOk: 'הבנתי',
    },
    en: {
      title: 'Privacy Policy',
      paragraphs: [
        { label: 'Conversations', text: "Processed exclusively through Anthropic's API. Not stored by us and not used for model training." },
        { label: 'Memory', text: 'Stored locally in your browser only. We cannot see or store it.' },
        { label: 'Knowledge base', text: 'Excerpts from psychoanalytic literature are stored as numbers only for search purposes. Your conversation content is not stored there.' },
        { label: 'Identity', text: 'No storage of IP addresses, user identity, or any personally identifying information beyond what is required for account management.' },
      ],
      btnOk: 'Got it',
    },
  };
  const [authLangOpen, setAuthLangOpen] = useState(false);
  useEffect(() => {
    setMounted(true);
    setTheoristsOpen(true);
    setIsLocalhost(window.location.hostname === 'localhost');
    const savedMode = localStorage.getItem('bw_mode');
    if (savedMode === 'explore' || savedMode === 'write') setHoveredMode(savedMode);
    const code = (window as any).selectedLang?.code || 'he';
    setTimeout(() => (window as any).applyUITranslation?.(code), 0);
    // Expose tooltip controls so chat.js can trigger the rich theorist card
    // from entry-screen chips (same tooltip used in sidebar)
    (window as any).setHoldTheorist = (key: string) => setHoldTheorist(key);
    (window as any).setTheoristTooltip = (key: string, top: number, left: number, flip: boolean) => {
      setCurrentLang((window as any).selectedLang?.code || 'he');
      setTooltip({ text: key, top, left, flip });
    };
    (window as any).clearTheoristTooltip = () => setTooltip(null);
  }, []);
  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const code = (e as CustomEvent).detail?.code;
      if (code) setCurrentLang(code);
    };
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);

  useEffect(() => {
    const handleTheoristChange = (e: Event) => {
      const key = (e as CustomEvent).detail?.key;
      if (key) setHoldTheorist(key);
    };
    window.addEventListener('holdtheoristchange', handleTheoristChange);
    return () => window.removeEventListener('holdtheoristchange', handleTheoristChange);
  }, []);

  const isHe = currentLang === 'he';
  const isDev = process.env.NODE_ENV !== 'production';

  const HOLD_THEORIST_NAMES: Record<string, [string, string]> = {
    freud:    ['פרויד',   'Freud'],
    klein:    ['קליין',   'Klein'],
    winnicott:['ויניקוט', 'Winnicott'],
    ogden:    ['אוגדן',   'Ogden'],
    bion:     ['ביון',    'Bion'],
  };
  const getHoldTheoristName = (key: string) => {
    const pair = HOLD_THEORIST_NAMES[key];
    return pair ? (isHe ? pair[0] : pair[1]) : key;
  };

  const getHoldContent = () => {
    const el = holdTextareaRef.current;
    if (!el) return { full: '', public: '' };
    const full = el.innerText?.trim() || '';
    const clone = el.cloneNode(true) as HTMLDivElement;
    clone.querySelectorAll('.bw-private').forEach(s => s.remove());
    const pub = clone.innerText?.trim() || full;
    return { full, public: pub };
  };

  const handleHoldSave = () => {
    const { full, public: pub } = getHoldContent();
    if (!full) return;
    (window as any).saveWriteEntry?.(full, pub);
    setHoldSaveStatus('saved');
    setTimeout(() => setHoldSaveStatus(''), 2000);
  };

  const handleHoldShare = () => {
    const { full, public: pub } = getHoldContent();
    if (!full) return;
    (window as any).saveWriteEntry?.(full, pub);
    setHoldSaveStatus('shared');
    setTimeout(() => setHoldSaveStatus(''), 2500);
  };

  const handleEnterConversation = (theorist: string) => {
    setShowHoldTheoristPicker(false);
    const { full, public: pub } = getHoldContent();
    // Crisis check scans FULL text (incl. .bw-private) so distress marked
    // private still triggers the banner. Privacy preserved: only `pub` is
    // passed to the theorist below — bw-private content never reaches the model.
    if (full && (window as any).checkCrisis?.(full)) {
      (window as any).showCrisisBanner?.();
    }
    (window as any).enterHoldConversation?.(theorist, pub);
    if (holdTextareaRef.current) holdTextareaRef.current.innerHTML = '';
    setHoldText('');
    setHoldSaveStatus('');
  };

  const handleToggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const r = new SR();
    r.lang = isHe ? 'he-IL' : 'en-US';
    r.continuous = false;
    r.interimResults = true;
    baseHoldTextRef.current = holdTextareaRef.current?.innerText?.trim() || '';
    r.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text; else interim += text;
      }
      const ta = holdTextareaRef.current;
      if (final) {
        baseHoldTextRef.current = baseHoldTextRef.current ? baseHoldTextRef.current + ' ' + final : final;
        if (ta) ta.innerText = baseHoldTextRef.current;
        setHoldText(baseHoldTextRef.current);
      } else {
        const displayed = baseHoldTextRef.current ? baseHoldTextRef.current + ' ' + interim : interim;
        if (ta) ta.innerText = displayed;
        setHoldText(displayed);
      }
    };
    r.onerror = () => { setIsRecording(false); recognitionRef.current = null; };
    r.onend = () => { setIsRecording(false); recognitionRef.current = null; };
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
  };
  const THEORIST_LABELS: Record<string, [string, string]> = {
    freud:    [isHe ? 'פרויד'   : 'Freud',    isHe ? 'מה שלא נאמר'              : 'What is left unsaid'],
    klein:    [isHe ? 'קליין'   : 'Klein',    isHe ? 'מה שקשה לגעת בו'         : 'What is hard to touch'],
    winnicott:[isHe ? 'ויניקוט' : 'Winnicott',isHe ? 'המרחב להיות'             : 'The space to be'],
    ogden:    [isHe ? 'אוגדן'   : 'Ogden',    isHe ? 'מה שנוצר בין שנינו'      : 'What is created between us'],
    loewald:  [isHe ? 'לוואלד'  : 'Loewald',  isHe ? 'הקשר עצמו כגורם המרפא'  : 'The relationship as cure'],
    bion:     [isHe ? 'ביון'    : 'Bion',     isHe ? 'מה שעדיין לא ניתן לחשוב' : 'What cannot yet be thought'],
    kohut:    [isHe ? 'קוהוט'   : 'Kohut',    isHe ? 'הצורך להרגיש מובן'       : 'The need to feel understood'],
    heimann:  [isHe ? 'היימן'   : 'Heimann',  isHe ? 'מה שהמפגש מעורר בי'      : 'What the encounter stirs'],
  };
  const theoristKeys: string[] = isDev
    ? ['freud','klein','winnicott','ogden','loewald','bion','kohut','heimann']
    : ['freud','klein','winnicott','ogden','bion'];
  const THEORIST_LIST: [string, string, string][] = theoristKeys.map(k => [k, THEORIST_LABELS[k][0], THEORIST_LABELS[k][1]]);

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
                  ['en','🇬🇧','English'],['he','🇮🇱','עברית']
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
          <h2 id="auth-title" dir="ltr" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, fontWeight: 300, fontStyle: 'italic', color: 'var(--accent)', marginBottom: 8, direction: 'ltr' }} suppressHydrationWarning>Between</h2>
          <p id="auth-subtitle" style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 12 }}>מה שעלה בפגישה — אפשר להביא לכאן.</p>

          <div style={{ marginBottom: 16 }}>
            <div id="auth-persona-label" style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, opacity: 0.8 }}>מי אתה/את?</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['therapist','מטפל/ת'],['patient','בטיפול']] as [string,string][]).map(([key, label]) => (
                <button key={key} id={`persona-auth-${key}`}
                  onClick={() => {
                    const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}');
                    prefs.persona = key;
                    localStorage.setItem('user_prefs', JSON.stringify(prefs));
                    ['therapist','patient'].forEach(k => {
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
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-rubik), sans-serif', fontSize: 'var(--fs-body-md)', color: 'var(--text)', background: 'var(--surface)', outline: 'none', textAlign: 'left' }}
              onKeyDown={undefined}
            />
            <input id="auth-password" type="password" placeholder="סיסמה" dir="ltr"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-rubik), sans-serif', fontSize: 'var(--fs-body-md)', color: 'var(--text)', background: 'var(--surface)', outline: 'none', textAlign: 'left' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button id="signin-btn"
              onClick={() => (window as any).signIn?.()}
              style={{ flex: 1, background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', borderRadius: 'var(--radius-xl)', cursor: 'pointer' }}>
              כניסה
            </button>
            <button id="signup-btn"
              onClick={() => (window as any).signUp?.()}
              style={{ flex: 1, background: 'none', border: '1px solid var(--border)', color: 'var(--text)', padding: '10px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', borderRadius: 'var(--radius-xl)', cursor: 'pointer' }}>
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
Between הוא כלי לחשיבה ולהבנה עצמית ולא תחליף לטיפול. הוא נועד ללוות אנשים שנמצאים בתהליך: בטיפול, בהכשרה, או בחקירה עצמית. פסיכואנליזה מתרחשת בין שני בני אדם בנוכחות, בקשר, ובזמן. הממשק נועד לצד המטפל, לא במקומו.
          </p>
        </div>
        </>}
      </div>

      {/* Therapy gate — shown after auth for new users */}
      <div id="therapy-gate" style={{
        position: 'fixed', inset: 0, zIndex: 190, background: 'var(--bg)',
        display: 'none', alignItems: 'center', justifyContent: 'center'
      }} />

      {/* Sidebar */}
      <div id="sidebar">
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 8px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* end-session moved out of sidebar — appears inline at bottom of chat */}
            <div className="sb-item" onClick={() => (window as any).newChat()}>
              <span className="sb-icon"><PenLine size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-new-chat-label">שיחה חדשה</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).toggleWebSearch()} id="sb-websearch-btn" title="חיפוש באינטרנט">
              <span className="sb-icon"><Globe size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-websearch-label">חיפוש רשת: כבוי</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).openMemory()}>
              <span className="sb-icon"><Brain size={15} strokeWidth={1.75} /></span>
              <span className="sb-label"><span id="sb-memory-count">0</span> <span id="sb-memories-label">זיכרונות</span></span>
            </div>
            <div className="sb-item" onClick={() => (window as any).openWriteArchive?.()}>
              <span className="sb-icon"><ScrollText size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-write-archive-label">{currentLang === 'he' ? 'מה כתבתי' : 'What I wrote'}</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).exportPDF()}>
              <span className="sb-icon"><Download size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-pdf-label">הורד PDF</span>
            </div>
            <div className="sb-item admin-only" onClick={() => (window as any).openSessionSummary()}>
              <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>◎</span>
              <span className="sb-label" id="sb-summary-label">סיכום סשן</span>
            </div>
            <div id="sb-write-summary-btn" className="sb-item" onClick={() => (window as any).openWriteSummary()} style={{ display: 'none' }}>
              <span className="sb-icon"><NotebookPen size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-write-summary-label">סיכום לפגישה</span>
            </div>
            {/* Explore mode — גלוי רק ב-localhost */}
            {isLocalhost && (
              <div className="sb-item" onClick={() => (window as any).enterExploreModeFromSidebar?.()}>
                <span className="sb-icon"><BookOpen size={15} strokeWidth={1.75} /></span>
                <span className="sb-label">מחקר</span>
                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(לוקאל)' : '(local)'}</span>
              </div>
            )}
            {/* פיקוח קליני — גלוי רק ב-localhost */}
            {isLocalhost && (
              <div className="sb-item admin-only" onClick={() => (window as any).openSupervision()}>
                <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>⚲</span>
                <span className="sb-label" id="sb-supervision-label">פיקוח קליני</span>
                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(בטא)' : '(Beta)'}</span>
              </div>
            )}
            <div id="patient-reflection-btn" className="sb-item admin-only" onClick={() => (window as any).openPatientReflection()} style={{ display: 'none' }}>
              <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>◉</span>
              <span className="sb-label" id="sb-reflection-label">מה לקחתי מהשיחה</span>
            </div>
            {/* אנונימיזציה ופידבק — גלויים רק ב-localhost */}
            {/* anonymization removed from UI */}
            {isLocalhost && (
              <div className="sb-item admin-only" onClick={() => (window as any).openUserFeedback()}>
                <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>◈</span>
                <span className="sb-label" id="sb-feedback-label">פידבק משתמש</span>
                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(בטא)' : '(Beta)'}</span>
              </div>
            )}
            {/* חדר הבורד — גלוי רק ב-localhost */}
            {isLocalhost && (
              <div className="sb-item admin-only" onClick={() => (window as any).openBoardRoom()}>
                <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>⬡</span>
                <span className="sb-label" id="sb-board-label">חדר הבורד</span>
                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(בטא)' : '(Beta)'}</span>
              </div>
            )}
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
                {THEORIST_LIST.map(([key, label, tooltipText]) => (
                  <div key={key} className="theorist-tag sb-item" data-key={key}
                    style={{ paddingRight: 10, fontSize: 13 }}
                    onClick={(e) => (window as any).toggleTheorist(e.currentTarget, key)}>
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
          </div>
        </div>
      </div>

      {/* Main content */}
      <div id="main-content">
        <header>
          <div className="header-top" style={{ padding: '16px 24px', direction: 'ltr' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div onClick={() => (window as any).toggleSidebar()} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 18, padding: '2px 6px', borderRadius: 6, lineHeight: 1 }} id="sb-toggle-btn">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  <line x1="6" y1="1" x2="6" y2="17" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </div>
              <a
                id="header-support-btn"
                href="#"
                title="Contact support"
                onClick={(e) => {
                  e.preventDefault();
                  (window as any).openSupportModal?.();
                }}
                style={{ color: 'var(--muted)', lineHeight: 1, textDecoration: 'none', fontSize: 16, padding: '2px 4px', borderRadius: 6, transition: 'color 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
              >
                ?
              </a>
              <div
                id="header-lang-btn"
                onClick={(e) => { e.stopPropagation(); const nl = currentLang === 'he' ? 'en' : 'he'; setCurrentLang(nl); (window as any).selectLang?.(nl, nl === 'en' ? '🇬🇧' : '🇮🇱', nl === 'en' ? 'English' : 'עברית'); }}
                style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 11, padding: '2px 6px', borderRadius: 6, fontFamily: 'var(--font-rubik), sans-serif', fontWeight: 500, letterSpacing: '0.04em', transition: 'color 0.15s', lineHeight: 1, display: 'flex', alignItems: 'center', userSelect: 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
              >
                <Globe size={16} strokeWidth={1.6} />
              </div>
            </div>
            <h1 dir="ltr" style={{ direction: 'ltr' }} suppressHydrationWarning>Between</h1>
            <div style={{ flexShrink: 0, width: 80 }} />
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
              {/* clinical-btn removed from header — toggleClinicalMode accessible via sidebar only */}
            </div>
          </div>
        </header>


        <div id="chat">
          {mounted && (
            <div className="welcome" id="welcome">
              {/* BW-41: back button — top-left corner of content area */}
              <span id="bw-back-btn" onClick={() => (window as any).goBackToChat()} style={{ position: 'absolute', top: 20, left: 24, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', opacity: 0.7, display: 'none' }}>← חזרה</span>
              {/* Hold entry — default screen */}
              <div id="bw-mode-select" style={{ flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
                <p id="bw-hold-heading" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 19, fontWeight: 300, color: 'var(--text)', margin: 0, alignSelf: 'flex-start' }}>{isHe ? 'מה נשאר איתך?' : 'What stayed with you?'}</p>
                {/* Single card — everything inside (option ו) */}
                <div style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                  {/* Textarea — contenteditable for private-marking support */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div
                      id="bw-hold-textarea"
                      contentEditable
                      suppressContentEditableWarning
                      ref={holdTextareaRef}
                      onInput={e => { setHoldText((e.currentTarget as HTMLDivElement).innerText?.trim() || ''); if (holdSaveStatus) setHoldSaveStatus(''); }}
                      style={{
                        width: '100%', minHeight: 200, padding: '20px',
                        background: 'transparent',
                        color: 'var(--text)', fontSize: 15,
                        fontFamily: 'var(--font-rubik), sans-serif', lineHeight: 1.7,
                        direction: isHe ? 'rtl' : 'ltr', textAlign: isHe ? 'right' : 'left',
                        boxSizing: 'border-box', outline: 'none',
                        display: 'block', wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                      }}
                    />
                    {/* Placeholder — React-controlled, immune to contentEditable Chrome <br> bug */}
                    {!holdText && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute', top: 20,
                          right: isHe ? 20 : undefined, left: isHe ? undefined : 20,
                          color: 'var(--muted)', fontSize: 15,
                          fontFamily: 'var(--font-rubik), sans-serif',
                          pointerEvents: 'none', userSelect: 'none', lineHeight: 1.7,
                        }}
                      >
                        {isHe ? 'כתוב לעצמך. או כדי להביא לפגישה הבאה.' : 'Write for yourself. Or to bring to your next session.'}
                      </span>
                    )}
                  </div>
                  {/* Footer: mic + quiet save — row-reverse in RTL puts mic on the right */}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexDirection: isHe ? 'row-reverse' : 'row' }}>
                    <button
                      onClick={handleToggleVoice}
                      className={isRecording ? 'bw-mic-recording' : ''}
                      title={isHe ? 'הקלטה קולית' : 'Voice input'}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', border: 'none', padding: 0,
                        background: 'transparent', color: isRecording ? 'var(--accent)' : 'var(--muted)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'color 0.15s', flexShrink: 0,
                      }}
                    >
                      <Mic size={15} />
                    </button>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => (window as any).openHoldSummary?.()}
                      disabled={!holdText.trim()}
                      style={{
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: 16, height: 30, padding: '0 12px',
                        fontSize: 11, fontFamily: 'var(--font-rubik), sans-serif',
                        color: 'var(--muted)', cursor: holdText.trim() ? 'pointer' : 'default',
                        opacity: holdText.trim() ? 1 : 0.4,
                        display: 'inline-flex', alignItems: 'center',
                        transition: 'opacity 0.15s', flexShrink: 0,
                      }}
                    >
                      {isHe ? 'סיכום כתיבה' : 'Writing summary'}
                    </button>
                    <button
                      onClick={handleHoldSave}
                      disabled={!holdText.trim()}
                      style={{
                        background: 'transparent', border: '1px solid var(--border)',
                        borderRadius: 16, height: 30, padding: '0 12px',
                        fontSize: 11, fontFamily: 'var(--font-rubik), sans-serif',
                        color: 'var(--muted)', cursor: holdText.trim() ? 'pointer' : 'default',
                        opacity: holdText.trim() ? 1 : 0.4,
                        display: 'inline-flex', alignItems: 'center',
                        transition: 'opacity 0.15s', flexShrink: 0,
                      }}
                    >
                      {isHe ? 'שמור' : 'Save'}
                    </button>
                  </div>
                  {/* Full-width talk button inside card */}
                  <div style={{ padding: '10px 14px 14px' }}>
                    <button
                      onClick={() => handleEnterConversation(holdTheorist)}
                      disabled={!holdText.trim()}
                      style={{
                        width: '100%', height: 42,
                        background: 'var(--accent)', color: 'white', border: 'none',
                        borderRadius: 10, fontSize: 13,
                        fontFamily: 'var(--font-rubik), sans-serif',
                        cursor: holdText.trim() ? 'pointer' : 'default',
                        opacity: holdText.trim() ? 1 : 0.55,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {isHe ? `שיחה עם ${getHoldTheoristName(holdTheorist)} ←` : `Talk with ${getHoldTheoristName(holdTheorist)} →`}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-rubik), sans-serif', margin: 0, width: '100%', textAlign: isHe ? 'right' : 'left' }}>
                  {isHe ? 'סמן טקסט כדי לסמן פרטי — לפני שמשתפים.' : 'Highlight text to mark private — before sharing.'}
                </p>
                {holdSaveStatus === 'saved' && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', margin: 0 }}>{isHe ? 'נשמר.' : 'Saved.'}</p>
                )}
              </div>


              {/* flow buttons injected here by renderFlowButtons() */}
              <p id="welcome-api-text" style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, margin: 0, marginTop: 'auto', paddingTop: 52 }}>
                {(WELCOME_I18N[currentLang] || WELCOME_I18N['he']).apiText}{' '}
                <span id="privacy-link" onClick={() => { const m = document.getElementById('privacy-modal'); if(m) m.style.display='flex'; }}
                  style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                  {(WELCOME_I18N[currentLang] || WELCOME_I18N['he']).privacyLink}
                </span>
              </p>
            </div>
          )}
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

        {/* Supervision panel — overlay */}
        <div id="supervision-panel" onClick={(e) => { if (e.target === e.currentTarget) (window as any).closeSupervision(); }}>
          <div id="supervision-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: '#7a5080', margin: 0 }}>⚲ פיקוח קליני</h2>
              <span onClick={() => (window as any).closeSupervision()} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</span>
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <button id="sup-tab-active" className="sup-tab active" onClick={() => (window as any).switchSupervisionTab('active')}>שיחה פעילה</button>
              <button id="sup-tab-paste" className="sup-tab" onClick={() => (window as any).switchSupervisionTab('paste')}>הדבק שיחה</button>
            </div>

            {/* Active conversation mode */}
            <div id="sup-mode-active">
              <div id="sup-active-info" style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, padding: '10px 14px', background: 'rgba(91,58,94,0.05)', borderRadius: 6, marginBottom: 4 }}>
                אין שיחה פעילה
              </div>
            </div>

            {/* Paste mode */}
            <div id="sup-mode-paste" style={{ display: 'none' }}>
              <select id="sup-theorist-select" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)', fontSize: 13, marginBottom: 10, direction: 'rtl' }}>
                <option value="freud">פרויד</option>
                <option value="klein">קליין</option>
                <option value="winnicott">ויניקוט</option>
                <option value="ogden">אוגדן</option>
                <option value="loewald">לוואלד</option>
                <option value="bion">ביון</option>
                <option value="kohut">קוהוט</option>
                <option value="heimann">היימן</option>
              </select>
              <textarea id="sup-paste-input" placeholder="הדבק שיחה — כל פורמט מתקבל"
                style={{ width: '100%', minHeight: 150, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)', fontSize: 12, resize: 'vertical', direction: 'rtl', lineHeight: 1.7, boxSizing: 'border-box', fontFamily: 'var(--font-rubik), sans-serif' }}></textarea>
            </div>

            <button id="sup-run-btn" onClick={() => (window as any).runSupervisionPanel()}
              style={{ width: '100%', padding: '10px', background: '#5b3a5e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, marginTop: 14, transition: 'opacity 0.2s', fontFamily: 'var(--font-rubik), sans-serif' }}>
              הרץ פיקוח
            </button>

            <div id="sup-results" style={{ marginTop: 20 }}></div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <span className="memory-close" onClick={() => (window as any).closeSupervision()}>סגור</span>
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
            <div id="suggestion-bubbles" suppressHydrationWarning></div>
            <div className="hint" id="input-hint">Enter לשליחה · Shift+Enter לשורה חדשה</div>
            <div id="input-disclaimer" style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.55, textAlign: 'center', paddingTop: 6, lineHeight: 1.5 }}>
              For educational use only · Not a substitute for professional psychological treatment
            </div>
          </div>
        </div>

        {/* Privacy modal */}
        <div id="privacy-modal" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(45,36,32,0.4)', display: 'none', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div id="privacy-modal-inner" suppressHydrationWarning style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, maxWidth: 460, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', direction: currentLang === 'he' ? 'rtl' : 'ltr' }}>
            <div style={{ fontSize: 24, color: 'var(--accent)', marginBottom: 12, fontFamily: 'var(--font-cormorant), serif', textAlign: 'center' }}>ψ</div>
            <h3 id="privacy-title" suppressHydrationWarning style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 20, fontWeight: 300, color: 'var(--accent)', marginBottom: 20, textAlign: 'center' }}>
              {(PRIVACY_I18N[currentLang] || PRIVACY_I18N['he']).title}
            </h3>

            <div id="privacy-content" suppressHydrationWarning style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.9, fontFamily: 'var(--font-rubik), sans-serif' }}>
              {(PRIVACY_I18N[currentLang] || PRIVACY_I18N['he']).paragraphs.map((p, i, arr) => (
                <p key={i} style={{ marginBottom: i === arr.length - 1 ? 20 : 12 }}>
                  <strong>{p.label}</strong>{` — ${p.text}`}
                </p>
              ))}
            </div>

            <button id="privacy-btn-ok" suppressHydrationWarning onClick={() => { const m = document.getElementById('privacy-modal'); if(m) m.style.display='none'; }}
              style={{ display: 'block', margin: '0 auto', background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px 32px', borderRadius: 20, fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer' }}>
              {(PRIVACY_I18N[currentLang] || PRIVACY_I18N['he']).btnOk}
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
      {mounted && tooltip && (() => {
        const langCards = THEORIST_CARDS[tooltip.text];
        if (!langCards) return null;
        const card = langCards[currentLang] || langCards['he'];
        const labels = CARD_LABELS[currentLang] || CARD_LABELS['he'];
        const name = THEORIST_NAMES_I18N[tooltip.text]?.[currentLang] || THEORIST_NAMES_I18N[tooltip.text]?.['he'] || tooltip.text;
        const isRtl = currentLang === 'he';
        return (
          <div style={{
            position: 'fixed', top: tooltip.top, left: tooltip.left,
            pointerEvents: 'none', zIndex: 1000,
            background: 'var(--surface, #fff)', border: '1px solid var(--border, #ede4e0)',
            borderRadius: 12, padding: '14px 16px', width: 240,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            fontFamily: 'var(--font-rubik), sans-serif',
            direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent, #c4607a)', marginBottom: 10 }}>
              {name}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted, #a8948e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.approach}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.approach}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted, #a8948e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.concepts}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.concepts}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted, #a8948e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.forWhom}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.forWhom}</div>
            </div>
          </div>
        );
      })()}

    </>
  );
}
