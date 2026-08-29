'use client';
import { useState, useEffect, useRef } from 'react';
import { PenLine, Globe, Settings, LogOut, Languages, Download, ChevronDown, BookOpen, Sofa, Mic, ScrollText, MessageCirclePlus, Sparkles, HelpCircle } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  // theoristsOpen ירד עם רשימת התיאורטיקנים מהסייד-בר. isMobile נשאר מוצהר אך אינו נקרא
  // עוד מאז שהגידור על בורר הקול ירד; לא הסרתי אותו כי הוא עשוי לשמש שוב, והאפקט שמעדכן
  // אותו זול.
  const [casesOpen, setCasesOpen] = useState(false);
  const [consultsOpen, setConsultsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; top: number; left: number; flip: boolean } | null>(null);
  const [hoveredMode, setHoveredMode] = useState<string>('session');
  const [currentLang, setCurrentLang] = useState('en');
  const [holdText, setHoldText] = useState('');
  const [holdTheorist, setHoldTheorist] = useState('winnicott');
  // לשון פנייה לפי ההגדרה של המשתמש/ת. עד 21.08 המסכים האלה היו בלשון נקבה קבועה,
  // כך שמטפל גבר נפגש ב"כתבי" ו"בחרי" כבר במסך הראשון. כשאין הגדרה — צורת הלוכסן.
  const [userGender, setUserGender] = useState('');
  // המייל בכרטיס החשבון · בבעלות React, ראה ההערה ב-chat.js ליד bw-user-email
  const [userEmail, setUserEmail] = useState('');
  const gv = (fem: string, masc: string, both: string) =>
    userGender === 'male' ? masc : userGender === 'female' ? fem : both;
  const [showHoldTheoristPicker, setShowHoldTheoristPicker] = useState(false);
  const [holdSaveStatus, setHoldSaveStatus] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  // Mobile gate for the voice-picker chips: the sidebar (the desktop voice switcher)
  // hides at max-width:600px (globals.css), so the chips only earn their place below 600.
  // Set in useEffect, never at render — a render-time width read desyncs SSR/client (hydration).
  const [isMobile, setIsMobile] = useState(false);
  // Web Speech API is absent on iOS Safari — hide the mic there rather than show a dead button.
  // Safe as a lazy initializer: the write card is client-only (mounted gate), so no SSR/hydration mismatch.
  const [speechSupported] = useState(() => typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  const recognitionRef = useRef<any>(null);
  const baseHoldTextRef = useRef('');
  const holdTextareaRef = useRef<HTMLDivElement>(null);
  const holdDraftTimerRef = useRef<any>(null);
  const holdDraftRestoredRef = useRef(false);

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
  /* מסך הכניסה מציג פעולה אחת בלבד. שתי פעולות שוות משקל גרמו לשני משתמשים
     לנסות כניסה לפני שנרשמו (דיווח איה, 28.08). דפדפן שכבר התחבר פעם נושא
     את bw_has_account, וכל השאר נחשב חדש. */
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  useEffect(() => {
    try { if (localStorage.getItem('bw_has_account') === '1') setAuthMode('signin'); } catch {}
  }, []);
  // BW-104 — sidebar persona. Production: set from login choice (user_prefs.persona).
  // Local: driven by the dev tabs below so Aya can preview both interfaces.
  const [devPersona, setDevPersona] = useState<'patient' | 'therapist'>('patient');
  const [prodPersona, setProdPersona] = useState<'patient' | 'therapist'>('patient');
  // BW-111 — shown when a user chose "therapist" at login but is not on the allowlist.
  const [personaNotice, setPersonaNotice] = useState(false);
  // BW-112 — therapist hub: mode selection + theorist selection (UI state; send-wiring is step 1b).
  const [hubMode, setHubMode] = useState<'consult' | 'research' | null>(null);
  const [hubTheorists, setHubTheorists] = useState<string[]>([]);
  // After "נתח" the analysis is the destination (mode 2א) — the theorist picker collapses
  // behind one quiet line and reopens only on request, so it stops competing with the output.
  const [consultPickerOpen, setConsultPickerOpen] = useState(false);
  // בורר הגישה שבתוך השיחה (שלב 2, הכרעת איה). נפתח מ-‎.session-actions ולא מהסייד-בר.
  const [sessionApproachOpen, setSessionApproachOpen] = useState(false);
  // הניתוח של הטיוטה נפתח במודל ולא נפרש בתוך הכרטיס (הכרעת איה, פריט 10, לבדיקה).
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  // שגיאת ניתוח לפי מפתח פתק. עד עכשיו analyzeNote בלעה כל כישלון: לא היה else ל-
  // ‎if (!data.error) וה-catch היה ריק, ולכן 401, 500 או נפילת רשת החזירו את המסך
  // לשקט מוחלט אחרי "רגע…". זה מה שנקרא כמו כפתור מקולקל, וזה גם מנע מאיה למסור
  // מה נכשל, כי המסך לא אמר לה כלום.
  const [noteError, setNoteError] = useState<Record<string, string>>({});
  // מצב הכיווץ עבר לבעלות React. קודם chat.js הוסיף ‎.collapsed ל-‎#sidebar ידנית, ו-React
  // מרנדר את אותו אלמנט עם className שנגזר מהפרסונה, כך שכל רינדור מחדש מחק את המחלקה.
  // זה לא נראה כל עוד מכווץ היה חריג; מרגע שהוא ברירת המחדל (הכרעת איה) זה נשבר מיד.
  // ברירת המחדל true גם בשרת, כך שאין הבהוב למי שלא בחר; מי שבחר לפתוח מתוקן באפקט למטה.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  // הגישה הפעילה בפועל, כולל מצב "אף אחת". נפרד מ-holdTheorist, שיש לו ברירת מחדל ויניקוט
  // ושמתעלם מביטול בחירה, ולכן אינו יכול לייצג "עדיין לא נבחרה גישה".
  const [activeApproach, setActiveApproach] = useState<string | null>(null);
  // BW-113 — therapist case-first flow.
  type TherapistCase = { id: string; label: string; created_at: string };
  type Consultation = { id: string; mode: string; theorists: string[]; anonymized_text: string; created_at: string };
  const [therapistView, setTherapistView] = useState<'cases' | 'hub' | 'caseDetail' | 'archive'>('cases');
  // Ephemeral-consultation step 1 — therapist lands directly on the writing page (skip roster). Guards initial auto-entry.
  const [therapistReady, setTherapistReady] = useState(false);
  const [cases, setCases] = useState<TherapistCase[]>([]);
  const [casesLoaded, setCasesLoaded] = useState(false);
  const [newCaseLabel, setNewCaseLabel] = useState('');
  const [showNewCase, setShowNewCase] = useState(false);
  // הרשימה הנפתחת של בורר הגישה · העיצוב החדש, 28.08
  const [selOpen, setSelOpen] = useState(false);
  // תפריט החשבון · נפתח בזרימה מעל הכרטיס ודוחף את הרשימה, ראה globals.css
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // תפריט ההגדרות עבר מהסייד-בר לפינה הימנית של הבר השחור (הכרעת איה 29.08)
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  // גיבוי הלוגו · אם קובץ הסימן נכשל, הבר מציג את המילה ולא נשאר ריק
  const [logoFailed, setLogoFailed] = useState(false);
  // "מה כתבתי" הוא מסך בעיצוב, לא שכבה. שתי שפות המכל בעיצוב נפרדות:
  // מסך נבנה מבר עליון, קו, כותרת גדולה ופוטר; מודל מכותרת קטנה, פתיח וסרגל.
  type WriteEntry = { id: number | string; date?: string; fullText?: string; publicText?: string };
  const [patientView, setPatientView] = useState<'write' | 'archive'>('write');
  // מסך המחקר · בוחרים גישה לפני הכניסה, כמו במסך הכתיבה (הכרעת איה 29.08)
  const [researchPicking, setResearchPicking] = useState(false);
  const [researchApproach, setResearchApproach] = useState<string | null>(null);
  const [researchSelOpen, setResearchSelOpen] = useState(false);
  // מצב המחקר בפועל · chat.js משדר, React מרנדר
  const [researchOn, setResearchOn] = useState(false);
  // חיפוש רשת · השורה בעיצוב היא תווית קבועה וערך בקצה. ‎toggleWebSearch‎ כתב
  // מחרוזת מחוברת ("חיפוש רשת: דלוק") לתוך התווית ולא נגע בערך, ולכן התווית
  // אמרה דלוק והערך לידה נשאר כבוי. אותו דפוס של שני מקורות (פריט 17).
  const [webSearchOn, setWebSearchOn] = useState(false);
  // השם מ"שם או כינוי" · נקרא כשתפריט החשבון נפתח, כי saveSettings כותב
  // ל-localStorage ואין אירוע שמודיע על כך.
  const [profileName, setProfileName] = useState('');
  const [avatarSrc, setAvatarSrc] = useState('');
  const [researchText, setResearchText] = useState('');
  const [writeEntries, setWriteEntries] = useState<WriteEntry[]>([]);
  // טקסט שממתין להיכתב לשדה הכתיבה אחרי שהמסך נטען (פתיחת רשומה מהארכיון)
  const [pendingWrite, setPendingWrite] = useState<string | null>(null);
  const loadWriteEntries = () => {
    try { setWriteEntries(JSON.parse(localStorage.getItem('bw_writes') || '[]')); }
    catch { setWriteEntries([]); }
  };
  // קריאות ישנות ל-openWriteArchive (קישור בתוך מסך הכתיבה) מנותבות למסך
  useEffect(() => {
    const open = () => { loadWriteEntries(); setPatientView('archive'); };
    window.addEventListener('bw-open-write-archive', open);
    return () => window.removeEventListener('bw-open-write-archive', open);
  }, []);
  // שלושת המודלים מהעיצוב החדש · שיתוף, סיכום התייעצות, צרי קשר
  type SummaryData = {
    theorist?: string; session_length?: string; themes?: string[];
    key_moments?: { patient_quote?: string; clinical_significance?: string }[];
    what_opened?: string; what_remained?: string; theorist_approach?: string; next_session_focus?: string;
  };
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareWithAnalysis, setShareWithAnalysis] = useState(true);
  const [shareState, setShareState] = useState<'' | 'sending' | 'sent' | 'error'>('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [summaryState, setSummaryState] = useState<'' | 'loading' | 'error'>('');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactState, setContactState] = useState<'' | 'sending' | 'sent' | 'error'>('');
  const [selectedCase, setSelectedCase] = useState<TherapistCase | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultsLoaded, setConsultsLoaded] = useState(false);
  const [showManualWrite, setShowManualWrite] = useState(false);
  const [manualText, setManualText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [consultText, setConsultText] = useState('');
  const [archivedCases, setArchivedCases] = useState<TherapistCase[]>([]);
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [expandedConsultId, setExpandedConsultId] = useState<string | null>(null);
  // BW-116 — daily case updates (localStorage, migrates to Supabase in BW-115)
  const [dailyText, setDailyText] = useState('');
  const [isDailyRecording, setIsDailyRecording] = useState(false);
  const dailyRecognitionRef = useRef<any>(null);
  const baseDailyTextRef = useRef('');
  // BW-116 — inline Winnicott analysis of a note (key = 'draft' or note id)
  type NoteAnalysis = {
    countertransference?: string | null;
    what_opened?: string;
    what_remained?: string;
    invitation?: string | null;
    next_session_focus?: string;
  };
  const [caseUpdates, setCaseUpdates] = useState<{id: string; text: string; created_at: string; analysis?: NoteAnalysis}[]>([]);
  const [editingDailyId, setEditingDailyId] = useState<string | null>(null);
  const [editingDailyText, setEditingDailyText] = useState('');
  const [noteAnalysis, setNoteAnalysis] = useState<Record<string, NoteAnalysis>>({});
  const [analyzingNoteId, setAnalyzingNoteId] = useState<string | null>(null);
  // Three-dot case card menu
  const [openMenuCaseId, setOpenMenuCaseId] = useState<string | null>(null);
  const [renamingCaseId, setRenamingCaseId] = useState<string | null>(null);
  const [renamingLabel, setRenamingLabel] = useState('');
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    setMounted(true);
    // העיצוב החדש הסיר את האייקונים, ואיתם את כפתור הכיווץ: בסרגל מכווץ לא נשאר
    // מה להראות. הסייד-בר פתוח תמיד, והעדפה שמורה מהעבר אינה משוחזרת, אחרת מי
    // שכיווץ פעם היה נתקע ב-52 פיקסלים בלי שום דרך לפתוח. 28.08.2026.
    setSidebarCollapsed(false);
    try { localStorage.removeItem('sidebar_collapsed'); } catch { /* ignore */ }
    (window as any).toggleSidebar = () => setSidebarCollapsed(v => {
      const next = !v;
      try { localStorage.setItem('sidebar_collapsed', String(next)); } catch { /* ignore */ }
      return next;
    });
    setIsLocalhost(window.location.hostname === 'localhost');
    // BW-111 — production persona is SERVER-GATED by allowlist (/api/me), not a public choice.
    // Fail-closed: patient by default; only an allowlisted account resolves to therapist.
    (window as any).__resolvePersona = async () => {
      let choice = 'patient';
      try { choice = localStorage.getItem('bw_persona_choice') || 'patient'; } catch {}
      try { setUserGender(JSON.parse(localStorage.getItem('user_prefs') || '{}').gender || ''); } catch {}
      try {
        const gh = (window as any).getAuthHeaders;
        const headers = gh ? await gh() : {};
        const r = await fetch('/api/me', { headers });
        const d = await r.json();
        const allowed = !!d?.isTherapist;
        // Therapist mode only when the user CHOSE it AND is on the allowlist. Fail-closed to patient.
        const p = (choice === 'therapist' && allowed) ? 'therapist' : 'patient';
        setProdPersona(p);
        setPersonaNotice(choice === 'therapist' && !allowed);
        try { const prefs = JSON.parse(localStorage.getItem('user_prefs') || '{}'); prefs.persona = p; localStorage.setItem('user_prefs', JSON.stringify(prefs)); } catch {}
      } catch { setProdPersona('patient'); }
    };
    (window as any).__resolvePersona();
    (window as any).__setSidebarPersona = (p: string) => {
      if (p === 'therapist' || p === 'patient') setProdPersona(p);
    };
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
      // performTheoristSwitch מסמן ‎.active רק על האלמנט שנלחץ. מרגע שיש שני עותקים של
      // הצ'יפים, בסייד-בר ובשורת השיחה, זה משאיר את העותק השני כבוי: בחירה מהשיחה השאירה
      // את הסייד-בר בלי סימון. הסנכרון כאן מיישר את כל העותקים לפי מקור האמת שב-chat.js.
      setActiveApproach(key || null);
      document.querySelectorAll('.theorist-tag[data-key]').forEach(t => {
        t.classList.toggle('active', !!key && t.getAttribute('data-key') === key);
      });
    };
    window.addEventListener('holdtheoristchange', handleTheoristChange);
    return () => window.removeEventListener('holdtheoristchange', handleTheoristChange);
  }, []);

  // מודל הניתוח: Escape סוגר, והגלילה מאחוריו ננעלת כדי שהגלגלת לא תזיז את הכתיבה שמתחת.
  useEffect(() => {
    if (!analysisModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAnalysisModalOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [analysisModalOpen]);

  // בורר הגישה שבשורת השיחה: סגירה בלחיצה בחוץ, ב-Escape, וכשהשיחה נגמרת (chat.js מכבה את
  // הקבוצה ושולח bwsessiontoolshide). בלי זה הפופאובר נשאר פתוח מעל מסך ריק אחרי "שיחה חדשה".
  useEffect(() => {
    if (!sessionApproachOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest('#bw-session-tools')) setSessionApproachOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSessionApproachOpen(false); };
    const onHide = () => setSessionApproachOpen(false);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('bwsessiontoolshide', onHide);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('bwsessiontoolshide', onHide);
    };
  }, [sessionApproachOpen]);

  // "שיחה חדשה" left the therapist writing box full (23.08). performNewChat() lives in chat.js and
  // clears everything it can reach — conversationHistory, #user-input, the draft, the DOM — but the
  // therapist card is React state here, and vanilla code cannot reach it. Nothing bridged the two:
  // holdtheoristchange was the only event crossing the boundary. So the text simply stayed, and a
  // new conversation opened on top of the previous case's writing.
  useEffect(() => {
    const clearWritingSurface = (e?: Event) => {
      // "חזרה לכתיבה" מתוך מחקר מחזירה למסך הכתיבה של המחקר. היעד מגיע
      // מ-chat.js על האירוע עצמו, כי הוא זה שיודע באיזה מצב היינו.
      setResearchPicking((e as CustomEvent | undefined)?.detail?.back === 'research');
      setDailyText('');
      setConsultText('');
      setHubTheorists([]);
      setConsultPickerOpen(false);
      // בחירת הגישה מתאפסת גם היא. בלי זה שיחה חדשה נפתחה על התיאורטיקן
      // האחרון, כלומר על בחירה שהמטופלת לא עשתה הפעם, והלוח נראה פתוח
      // בזמן שהרמז "מתחילים כאן" כבר לא מוצג.
      setActiveApproach(null);
      setResearchApproach(null);
      setSelOpen(false);
      setResearchSelOpen(false);
      setNoteAnalysis(prev => { const n = { ...prev }; delete n['draft']; return n; });
      setAnalysisModalOpen(false);
      // שדה הכתיבה של המטופלת נשכח כאן בפעם הראשונה. הוא contentEditable ולא נשלט על ידי
      // React, ולכן setHoldText לבדו לא מרוקן את המסך: צריך לגעת ב-DOM דרך ה-ref.
      // ובלי לבטל את טיימר הדיבאונס ולמחוק את bw_hold_draft, הטקסט חוזר בטעינה הבאה.
      // אותן ארבע שורות בדיוק שכבר קיימות ב-handleEnterConversation.
      // מסך "מה כתבתי" נסגר · בלעדיו הוא נשאר פתוח אחרי שיחה חדשה, מסך
      // הכתיבה נשאר מוסתר, והכפתורים שבתוכו נראים כמתים.
      setPatientView('write');
      if (holdDraftTimerRef.current) clearTimeout(holdDraftTimerRef.current);
      if (holdTextareaRef.current) holdTextareaRef.current.innerHTML = '';
      setHoldText('');
      setHoldSaveStatus('');
      try { localStorage.removeItem('bw_hold_draft'); } catch { /* ignore */ }
    };
    window.addEventListener('bwnewchat', clearWritingSurface);
    return () => window.removeEventListener('bwnewchat', clearWritingSurface);
  }, []);

  const isHe = currentLang === 'he';
  useEffect(() => {
    const take = (e: Event) => setResearchOn(!!(e as CustomEvent).detail);
    window.addEventListener('bw-explore-mode', take);
    try { setResearchOn(localStorage.getItem('bw_mode') === 'explore'); } catch { /* ignore */ }
    return () => window.removeEventListener('bw-explore-mode', take);
  }, []);
  useEffect(() => {
    const take = (e: Event) => setWebSearchOn(!!(e as CustomEvent).detail);
    window.addEventListener('bw-websearch', take);
    setWebSearchOn(!!(window as any).webSearch);
    return () => window.removeEventListener('bw-websearch', take);
  }, []);
  // chat.js משדר את המייל אחרי אימות מוצלח. גם קריאה ראשונית, למקרה
  // שהאימות הסתיים לפני שהמאזין נרשם.
  useEffect(() => {
    const take = (e: Event) => setUserEmail(((e as CustomEvent).detail as string) || '');
    window.addEventListener('bw-user-email', take);
    const now = (window as any)._userEmail;
    if (now) setUserEmail(now);
    return () => window.removeEventListener('bw-user-email', take);
  }, []);
  // במה כל תיאורטיקן עוסק · מוצג לצד השם, כי מטופלת אינה מכירה את השמות (פריט 18)
  const THEORIST_DESC: Record<string, string> = isHe
    ? { freud: 'מה שלא נאמר', klein: 'מה שקשה לגעת בו', winnicott: 'המרחב להיות', ogden: 'מה שנוצר בין שנינו' }
    : { freud: 'what goes unsaid', klein: 'what is hard to touch', winnicott: 'the space to be', ogden: 'what forms between us' };
  const isDev = process.env.NODE_ENV !== 'production';
  // Local preview uses the dev tabs; production follows the login choice.
  const activePersona = isLocalhost ? devPersona : prodPersona;

  // רענון השם בכל פתיחה של התפריט
  useEffect(() => {
    if (!headerMenuOpen) return;
    try {
      const p = JSON.parse(localStorage.getItem('user_prefs') || '{}');
      setProfileName((p.name || '').trim());
      setAvatarSrc(p.avatar || '');
    } catch { /* ignore */ }
  }, [headerMenuOpen]);
  // ‎chat.js‎ משדר ברגע שהתמונה מתחלפת בהגדרות, כדי שהעיגול יתעדכן
  // בלי לסגור ולפתוח את התפריט.
  useEffect(() => {
    const readPrefs = () => {
      try {
        const p = JSON.parse(localStorage.getItem('user_prefs') || '{}');
        setProfileName((p.name || '').trim());
        setAvatarSrc(p.avatar || '');
      } catch { /* ignore */ }
    };
    const takeAvatar = (e: Event) => setAvatarSrc(((e as CustomEvent).detail as string) || '');
    window.addEventListener('bw-avatar', takeAvatar);
    window.addEventListener('bw-prefs', readPrefs);
    readPrefs();
    return () => { window.removeEventListener('bw-avatar', takeAvatar); window.removeEventListener('bw-prefs', readPrefs); };
  }, []);

  // ‎#bw-mode-select‎ (שורת הפעולות של מסך הכתיבה) מוסתר ב-CSS כברירת מחדל,
  // ו-‎showModeSelect()‎ הוא שמציב לו ‎flex‎. הוא רץ פעם אחת בעליית העמוד, ורק
  // אם הפרסונה כבר הייתה מטופלת באותו רגע. לכן כל מעבר מאוחר יותר למטופלת
  // השאיר את השורה מוסתרת: גם מתג הפיתוח, וגם המרוץ בפרודקשן, שבו
  // ‎__resolvePersona‎ עונה מהשרת אחרי שהבדיקה כבר רצה כמטפלת.
  // כאן React מודיע ברגע שעץ המטופלת קיים, ורק כשאין שיחה על המסך.
  useEffect(() => {
    if (!mounted || activePersona !== 'patient') return;
    const chatEl = document.getElementById('chat');
    const hasTurns = !!chatEl?.querySelector('.message');
    if (hasTurns) return;
    (window as any).showModeSelect?.();
  }, [activePersona, mounted]);


  // Mirror holdTheorist onto the sidebar highlight — but only once the patient has actually
  // written something (same gate as the continue button: holdText.trim()). Before any writing
  // the sidebar stays neutral. Set-on-only: we never actively clear here, to avoid flicker when
  // entering a conversation (handleEnterConversation blanks holdText for a tick before the
  // opening text fills it). Uses the existing .active mechanism (bwSetActiveTheorist). No loop —
  // it re-dispatches holdtheoristchange with the same key, so setHoldTheorist is a no-op.
  // ‎holdTheorist‎ נושא ברירת מחדל ('winnicott') ולכן אינו עדות לבחירה. כשהמראה
  // רצה עליו, כל טעינה עם טיוטה שמורה שידרה ‎holdtheoristchange‎ עם ויניקוט,
  // ‎activeApproach‎ נדלק, הרמז "מתחילים כאן" נעלם, והלוח נפתח על תיאורטיקן
  // שהמטופלת לא בחרה. המראה רצה עכשיו על ‎activeApproach‎, שנקבע רק בבחירה.
  useEffect(() => {
    if (mounted && activePersona === 'patient' && activeApproach && holdText.trim()) {
      (window as any).bwSetActiveTheorist?.(activeApproach);
    }
  }, [activeApproach, activePersona, mounted, holdText]);

  // Analytics (event-only, anonymous). app_opened = retention anchor; fires once per load.
  const appOpenedRef = useRef(false);
  useEffect(() => {
    if (!mounted || appOpenedRef.current) return;
    appOpenedRef.current = true;
    window.bwTrack?.('app_opened', { persona: activePersona });
  }, [mounted, activePersona]);

  // theorist_selected — fires on every real change; skips the initial default value.
  const theoristSelRef = useRef(false);
  useEffect(() => {
    if (!theoristSelRef.current) { theoristSelRef.current = true; return; }
    window.bwTrack?.('theorist_selected', { theorist: holdTheorist });
  }, [holdTheorist]);

  // Restore a locally-saved writing draft when the patient writing screen mounts.
  // Runs once (holdDraftRestoredRef) so it never clobbers live edits. Stored as
  // HTML to preserve .bw-private marks.
  useEffect(() => {
    if (activePersona !== 'patient' || !mounted) return;
    if (holdDraftRestoredRef.current) return;
    const el = holdTextareaRef.current;
    if (!el) return;
    let draft = '';
    try { draft = localStorage.getItem('bw_hold_draft') || ''; } catch { /* ignore */ }
    if (draft) {
      el.innerHTML = draft;
      setHoldText(el.innerText?.trim() || '');
    }
    holdDraftRestoredRef.current = true;
  }, [activePersona, mounted]);

  // BW-113 — load/create therapist cases (auth via chat.js getAuthHeaders).
  const loadCases = async () => {
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = gh ? await gh() : {};
      const res = await fetch('/api/cases', { headers });
      if (res.ok) { const d = await res.json(); setCases(Array.isArray(d.cases) ? d.cases : []); }
    } catch { /* ignore */ }
    setCasesLoaded(true);
  };
  // ── שלושת המודלים · מחוברים לראוטים שכבר קיימים בריפו ──
  // השיתוף בונה את גוף המייל מהכתיבה עצמה. מה שסומן כפרטי מוחלף בחסימה
  // ולא נשלח, וזה מה שהמסך מבטיח למטופלת.
  const buildShareHtml = () => {
    const el = holdTextareaRef.current;
    if (!el) return '';
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.bw-private').forEach(n => {
      const b = document.createElement('span');
      b.textContent = '▉▉▉▉▉';
      b.setAttribute('style', 'color:#9A9A95;letter-spacing:1px');
      n.replaceWith(b);
    });
    return clone.innerHTML;
  };
  // הניתוח שמצורף הוא זה שכבר רץ על הטיוטה. אם לא רץ, אין מה לצרף.
  const draftAnalysisHtml = () => {
    const a = noteAnalysis['draft'];
    if (!a) return '';
    const rows: [string, string | null | undefined][] = [
      [isHe ? 'מה נפתח' : 'What opened', a.what_opened],
      [isHe ? 'מה נשאר' : 'What remained', a.what_remained],
      [isHe ? 'מה להביא לפגישה' : 'To bring to the session', a.next_session_focus],
    ];
    return '<h3 style="font-weight:400">' + (isHe ? 'הניתוח' : 'The analysis') + '</h3>'
      + rows.filter(([, v]) => !!v).map(([k, v]) => '<p><b>' + k + '</b><br>' + v + '</p>').join('');
  };
  const sendShare = async () => {
    const mail = shareEmail.trim();
    if (!mail) return;
    setShareState('sending');
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      const body = '<div style="font-family:sans-serif;line-height:1.8;direction:rtl">'
        + '<h2 style="font-weight:400">מה נשאר איתי מהפגישה</h2>'
        + buildShareHtml()
        + (shareWithAnalysis && draftAnalysisHtml() ? '<hr style="margin:24px 0;border:none;border-top:1px solid #D6D6D2">' + draftAnalysisHtml() : '')
        + '</div>';
      const res = await fetch('/api/send-to-therapist', {
        method: 'POST', headers,
        body: JSON.stringify({ email: mail, subject: 'מהמרחב שבין הפגישות', html: body }),
      });
      setShareState(res.ok ? 'sent' : 'error');
    } catch { setShareState('error'); }
  };
  // הסיכום קורא ל-/api/session-summary עם התמליל החי ומרנדר את עשרת השדות
  // ש-lib/summary-prompt.ts מחזיר. אין כאן שדה שהומצא.
  const readGender = () => {
    try { return JSON.parse(localStorage.getItem('intake_completed') || '{}').gender || ''; } catch { return ''; }
  };
  const openSummary = async () => {
    setSummaryOpen(true); setSummaryState('loading'); setSummaryData(null);
    try {
      const turns = Array.from(document.querySelectorAll('#chat .message')).map(m => {
        const who = m.classList.contains('user') ? (isHe ? 'מטופל/ת' : 'Patient') : (m.querySelector('.message-role')?.textContent || '');
        return who + ': ' + (m.querySelector('.message-body')?.textContent || '').trim();
      }).filter(t => t.length > 3);
      if (!turns.length) { setSummaryState('error'); return; }
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      const res = await fetch('/api/session-summary', {
        method: 'POST', headers,
        body: JSON.stringify({ transcript: turns.join('\n\n'), theorist: activeApproach || holdTheorist, gender: readGender() }),
      });
      if (!res.ok) { setSummaryState('error'); return; }
      const j = await res.json();
      setSummaryData((j.summary || j) as SummaryData); setSummaryState('');
    } catch { setSummaryState('error'); }
  };
  const sendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) return;
    setContactState('sending');
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      const res = await fetch('/api/support', {
        method: 'POST', headers,
        body: JSON.stringify({ subject: contactSubject.trim(), message: contactMessage.trim(), userEmail: contactEmail.trim() }),
      });
      setContactState(res.ok ? 'sent' : 'error');
    } catch { setContactState('error'); }
  };
  const createCase = async (label: string) => {
    const l = label.trim();
    if (!l) return;
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      const res = await fetch('/api/cases', { method: 'POST', headers, body: JSON.stringify({ label: l }) });
      if (res.ok) { setNewCaseLabel(''); setShowNewCase(false); setCasesLoaded(false); }
    } catch { /* ignore */ }
  };
  useEffect(() => {
    if (activePersona === 'therapist' && therapistView === 'cases' && !casesLoaded) loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersona, therapistView, casesLoaded]);
  const loadConsultations = async (caseId: string) => {
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = gh ? await gh() : {};
      const res = await fetch(`/api/consultations?case_id=${encodeURIComponent(caseId)}`, { headers });
      if (res.ok) { const d = await res.json(); setConsultations(Array.isArray(d.consultations) ? d.consultations : []); }
    } catch { /* ignore */ }
    setConsultsLoaded(true);
  };
  // BW-116 — load daily updates for a case from localStorage
  const loadCaseUpdates = (caseId: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem(`bw_case_updates_${caseId}`) || '[]');
      const notes = Array.isArray(stored) ? stored : [];
      setCaseUpdates(notes);
      // BW-116 — hydrate inline analyses attached to saved notes
      const hydrated: Record<string, NoteAnalysis> = {};
      notes.forEach((n: { id: string; analysis?: NoteAnalysis }) => { if (n.analysis) hydrated[n.id] = n.analysis; });
      setNoteAnalysis(hydrated);
    } catch { setCaseUpdates([]); setNoteAnalysis({}); }
  };
  const openCase = (c: TherapistCase) => { setSelectedCase(c); setConsultsLoaded(false); setConsultations([]); setShowManualWrite(false); setManualText(''); loadCaseUpdates(c.id); setDailyText(''); setTherapistView('caseDetail'); };
  // Ephemeral-consultation step 1 — therapist entry skips the roster and lands on the existing writing page.
  // Reuses the case-bound writing view unchanged: open the most recent case, or create a default one if none exist.
  const enterTherapistWriting = async () => {
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = gh ? await gh() : {};
      const res = await fetch('/api/cases', { headers });
      let list: TherapistCase[] = [];
      if (res.ok) { const d = await res.json(); list = Array.isArray(d.cases) ? d.cases : []; }
      let target = list[0];
      if (!target) {
        const cr = await fetch('/api/cases', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ label: isHe ? 'התייעצות' : 'Consultation' }) });
        if (cr.ok) target = await cr.json();
      }
      if (target) { setCases(list.length ? list : [target]); openCase(target); }
    } catch { /* ignore */ }
    setTherapistReady(true);
  };
  useEffect(() => {
    if (activePersona === 'therapist' && !therapistReady && !selectedCase) enterTherapistWriting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersona, therapistReady, selectedCase]);
  // Ephemeral therapist: the writing page is a welcome view — keep the bottom composer hidden.
  // Switching to the therapist tab calls bwExitChatToHome() before the sidebar class flips, so that
  // path can't reliably add bw-selecting; do it here when the persona becomes therapist.
  // startConsultation() removes bw-selecting when a consultation dialogue actually begins.
  useEffect(() => {
    if (activePersona === 'therapist') document.body.classList.add('bw-selecting');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersona]);
  useEffect(() => {
    if (therapistView === 'caseDetail' && selectedCase && !consultsLoaded) loadConsultations(selectedCase.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapistView, selectedCase, consultsLoaded]);
  const saveNote = async () => {
    const t = manualText.trim();
    if (!t || !selectedCase) return;
    setSavingNote(true);
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      const res = editingId
        ? await fetch('/api/consultations', { method: 'PATCH', headers, body: JSON.stringify({ id: editingId, text: t }) })
        : await fetch('/api/consultations', { method: 'POST', headers, body: JSON.stringify({ case_id: selectedCase.id, mode: 'note', theorists: [], text: t }) });
      if (res.ok) { setManualText(''); setShowManualWrite(false); setEditingId(null); setConsultsLoaded(false); }
    } catch { /* ignore */ }
    setSavingNote(false);
  };
  const openEditNote = (co: Consultation) => { setEditingId(co.id); setManualText(co.anonymized_text); setShowManualWrite(true); };
  // BW-113 — single-theorist consultation: anonymize + file under case, then seed the live chat.
  const startConsultation = async (materialOverride?: string) => {
    const key = hubTheorists[0];
    if (!key) return;
    // Declare the mode instead of inheriting it (23.08). Until now only ONE line in the whole
    // codebase ever wrote bw_mode for a therapist: the localhost "מחקר" button writing 'explore'.
    // Consultation wrote nothing, so it was not a chosen state at all — it was whatever happened
    // when nobody had chosen research, decided by a negative default at send time. One silent
    // click, at any point in the past, then fixed the voice permanently: the key is shared with
    // the patient persona and nothing ever cleared it. Writing it here is what makes the system
    // self-healing — any stale value, from a source we found or one we did not, is corrected the
    // moment a consultation starts. Two modes, two moments of intent, two explicit writes.
    try { localStorage.setItem('bw_mode', 'consult'); } catch { /* private mode */ }
    const material = (typeof materialOverride === 'string' ? materialOverride : consultText).trim();
    let seed = material;
    try {
      if (selectedCase && material) {
        const gh = (window as any).getAuthHeaders;
        const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
        const res = await fetch('/api/consultations', { method: 'POST', headers, body: JSON.stringify({ case_id: selectedCase.id, mode: 'consult', theorists: [key], text: material }) });
        if (res.ok) { const d = await res.json(); if (typeof d.anonymized_text === 'string') seed = d.anonymized_text; }
      }
    } catch { /* ignore */ }
    if ((window as any).bwSetActiveTheorist) (window as any).bwSetActiveTheorist(key);
    // Always navigate to chat — hide hub/welcome regardless of whether there is seeded text.
    // sendMessage() returns early on empty input, so we must hide welcome explicitly here.
    // Also remove bw-selecting — showModeSelect() adds it on page load, confirmTheoristEntry()
    // removes it in patient flow, but therapist goes via startConsultation which skips that path.
    document.body.classList.remove('bw-selecting');
    const _welcomeEl = document.getElementById('welcome');
    if (_welcomeEl) _welcomeEl.style.display = 'none';
    const input = document.getElementById('user-input') as HTMLInputElement | HTMLTextAreaElement | null;
    if (input) {
      if (seed) input.value = seed;
      if (seed.trim() && (window as any).sendMessage) {
        (window as any).sendMessage(); // captures text synchronously before its first await
        input.value = ''; // BW-116 — clear the seed so it doesn't linger duplicated in the composer
        input.style.height = 'auto';
      } else { input.focus(); }
    }
    setConsultText('');
  };
  const archiveCase = async (id: string, archived: boolean) => {
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      await fetch('/api/cases', { method: 'PATCH', headers, body: JSON.stringify({ id, archived }) });
    } catch { /* ignore */ }
  };
  const loadArchived = async () => {
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = gh ? await gh() : {};
      const res = await fetch('/api/cases?archived=1', { headers });
      if (res.ok) { const d = await res.json(); setArchivedCases(Array.isArray(d.cases) ? d.cases : []); }
    } catch { /* ignore */ }
    setArchivedLoaded(true);
  };
  useEffect(() => {
    if (activePersona === 'therapist' && therapistView === 'archive' && !archivedLoaded) loadArchived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersona, therapistView, archivedLoaded]);

  // BW-116 — daily update actions
  const saveDailyUpdate = () => {
    const t = dailyText.trim();
    if (!t || !selectedCase) return;
    const id = `${Date.now()}`;
    // BW-116 — if the draft was analyzed, attach the analysis to the saved note
    const draftAnalysis = noteAnalysis['draft'];
    const entry = { id, text: t, created_at: new Date().toISOString(), ...(draftAnalysis ? { analysis: draftAnalysis } : {}) };
    const updated = [entry, ...caseUpdates];
    localStorage.setItem(`bw_case_updates_${selectedCase.id}`, JSON.stringify(updated));
    setCaseUpdates(updated);
    setDailyText('');
    // move the draft analysis onto the saved note, clear the draft
    setNoteAnalysis(prev => {
      const next = { ...prev };
      if (draftAnalysis) next[id] = draftAnalysis;
      delete next['draft'];
      return next;
    });
  };
  const deleteCaseUpdate = (uid: string) => {
    if (!selectedCase) return;
    if (!window.confirm(isHe ? 'למחוק את העדכון?' : 'Delete this update?')) return;
    const updated = caseUpdates.filter(u => u.id !== uid);
    localStorage.setItem(`bw_case_updates_${selectedCase.id}`, JSON.stringify(updated));
    setCaseUpdates(updated);
  };
  const deleteCase = async () => {
    if (!selectedCase) return;
    if (!window.confirm(isHe ? `למחוק את המקרה "${selectedCase.label}" לצמיתות? לא ניתן לשחזר.` : `Delete "${selectedCase.label}" permanently? This cannot be undone.`)) return;
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = gh ? await gh() : {};
      await fetch(`/api/cases?id=${encodeURIComponent(selectedCase.id)}`, { method: 'DELETE', headers });
      localStorage.removeItem(`bw_case_updates_${selectedCase.id}`);
    } catch { /* ignore */ }
    setCasesLoaded(false);
    setTherapistView('cases');
  };
  const deleteCaseById = async (id: string, label: string) => {
    if (!window.confirm(isHe ? `למחוק את המקרה "${label}" לצמיתות? לא ניתן לשחזר.` : `Delete "${label}" permanently? This cannot be undone.`)) return;
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = gh ? await gh() : {};
      await fetch(`/api/cases?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers });
      localStorage.removeItem(`bw_case_updates_${id}`);
    } catch { /* ignore */ }
    setCasesLoaded(false);
  };
  const renameCase = async (id: string, newLabel: string) => {
    const t = newLabel.trim();
    if (!t) { setRenamingCaseId(null); return; }
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      await fetch('/api/cases', { method: 'PATCH', headers, body: JSON.stringify({ id, label: t }) });
      setCases(prev => prev.map(c => c.id === id ? { ...c, label: t } : c));
      if (selectedCase?.id === id) setSelectedCase(prev => prev ? { ...prev, label: t } : prev);
    } catch { /* ignore */ }
    setRenamingCaseId(null);
  };
  const saveDailyEdit = (id: string) => {
    const t = editingDailyText.trim();
    if (!t || !selectedCase) return;
    const updated = caseUpdates.map(u => u.id === id ? { ...u, text: t } : u);
    localStorage.setItem(`bw_case_updates_${selectedCase.id}`, JSON.stringify(updated));
    setCaseUpdates(updated);
    setEditingDailyId(null);
  };
  const deleteConsultation = async (id: string) => {
    if (!window.confirm(isHe ? 'למחוק את הרשומה?' : 'Delete this record?')) return;
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = gh ? await gh() : {};
      await fetch(`/api/consultations?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers });
      setConsultations(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
  };
  // BW-116 — "Consult" = take text to the hub (theorist conversation)
  const consultFromText = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setConsultText(t);
    setHubMode(null);
    setHubTheorists([]);
    setTherapistView('hub');
  };
  // BW-116 — "Consult" from the case header: seed with the 3 most recent notes
  const consultFromCase = () => {
    const recent = caseUpdates.slice(0, 3).map(u => u.text).join('\n\n');
    setConsultText(recent);
    setHubMode(null);
    setHubTheorists([]);
    setTherapistView('hub');
  };
  // BW-116 — "Analyze" = Winnicott holds the note inline (colleague register)
  const analyzeNote = async (text: string, key: string) => {
    const t = text.trim();
    if (!t || analyzingNoteId) return;
    setAnalyzingNoteId(key);
    setNoteError(prev => { const n = { ...prev }; delete n[key]; return n; });
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      let gender = '';
      try { gender = JSON.parse(localStorage.getItem('intake_completed') || '{}').gender || ''; } catch { /* none */ }
      const r = await fetch('/api/analyze-note', { method: 'POST', headers, body: JSON.stringify({ text: t, mode: activePersona, gender, theorist: holdTheorist }) });
      // גוף לא-JSON הוא בעצמו מצב כישלון אפשרי, ולכן הפרסינג עטוף בנפרד.
      let data: any = null;
      try { data = await r.json(); } catch { /* body is not JSON */ }
      if (!r.ok || !data || data.error) {
        setNoteError(prev => ({ ...prev, [key]: (data && data.error) || `http_${r.status}` }));
      }
      if (r.ok && data && !data.error) {
        setNoteAnalysis(prev => ({ ...prev, [key]: data }));
        // הטיוטה נפתחת במודל. פתק שמור ממשיך להיפרש בשורה שלו, שם המודל היה מנתק
        // את הניתוח מהפתק שהוא מתייחס אליו.
        if (key === 'draft') setAnalysisModalOpen(true);
        // BW-116 — if analyzing a SAVED note, persist the analysis onto it
        if (key !== 'draft' && selectedCase) {
          setCaseUpdates(prev => {
            const updated = prev.map(u => u.id === key ? { ...u, analysis: data } : u);
            localStorage.setItem(`bw_case_updates_${selectedCase.id}`, JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch {
      setNoteError(prev => ({ ...prev, [key]: 'network' }));
    }
    setAnalyzingNoteId(null);
  };
  // BW-116 — the reflection for a note (no theorist named — woven between the lines).
  // הגוף הופרד מהמעטפת כדי שאותו תוכן ישמש גם את המודל של הטיוטה וגם את הרינדור בשורה
  // של פתק שמור, בלי שני מקורות שיתפצלו עם הזמן.
  // תרגום קוד הכישלון למשפט שאפשר לפעול לפיו. הקוד עצמו נשאר בסוגריים, כדי שאיה
  // תוכל למסור אותו כשהיא מדווחת. parse_failed הוא מסלול מכוון בשרת למצב מטפלת
  // (analyze-note/route.ts), ולכן הוא מקבל ניסוח משלו ולא "משהו השתבש".
  const analyzeErrorText = (code: string) => {
    if (code === 'network') return isHe ? 'לא הצלחנו להגיע לשרת.' : 'Could not reach the server.';
    // השרת מחזיר גוף JSON עם error:'Unauthorized', ולכן ה-401 לא מגיע לכאן כ-http_401.
    if (code === 'http_401' || code === 'Unauthorized') return isHe ? 'ההתחברות פגה. רענני את הדף.' : 'Session expired. Reload the page.';
    if (code === 'parse_failed') return isHe ? 'הניתוח חזר בצורה שאי אפשר להציג.' : 'The reflection came back unreadable.';
    if (code === 'Missing text') return isHe ? 'אין מספיק טקסט לנתח.' : 'Not enough text to analyze.';
    return isHe ? 'הניתוח נכשל.' : 'The analysis failed.';
  };
  const renderNoteAnalysisBody = (a: any) => {
    const section = (label: string, body: React.ReactNode) => (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        {body}
      </div>
    );
    const txt = (s: string) => <div style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.6 }}>{s}</div>;
    return (
      <>
        {a.countertransference && section(isHe ? 'מה עלה בך' : 'What moved in you', txt(a.countertransference))}
        {a.what_opened && section(isHe ? 'מה נפתח' : 'What opened', txt(a.what_opened))}
        {a.what_remained && section(isHe ? 'מה נותר פתוח' : 'What remained', txt(a.what_remained))}
        {a.invitation && section(isHe ? 'הזמנה' : 'Invitation', <div style={{ fontSize: 16, color: 'var(--accent)', lineHeight: 1.6 }}>{a.invitation}</div>)}
        {a.next_session_focus && section(isHe ? 'לפגישה הבאה' : 'Next session', txt(a.next_session_focus))}
      </>
    );
  };
  const renderNoteAnalysis = (key: string) => {
    if (analyzingNoteId === key) {
      return <div style={{ marginTop: 12, fontSize: 15, color: 'var(--muted)', fontStyle: 'italic' }}>{isHe ? 'רגע…' : 'One moment…'}</div>;
    }
    const a = noteAnalysis[key];
    if (!a) return null;
    const section = (label: string, body: React.ReactNode) => (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        {body}
      </div>
    );
    const txt = (s: string) => <div style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.6 }}>{s}</div>;
    return (
      <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        {a.countertransference && section(isHe ? 'מה עלה בך' : 'What moved in you', txt(a.countertransference))}
        {a.what_opened && section(isHe ? 'מה נפתח' : 'What opened', txt(a.what_opened))}
        {a.what_remained && section(isHe ? 'מה נותר פתוח' : 'What remained', txt(a.what_remained))}
        {a.invitation && section(isHe ? 'הזמנה' : 'Invitation', <div style={{ fontSize: 16, color: 'var(--accent)', lineHeight: 1.6 }}>{a.invitation}</div>)}
        {a.next_session_focus && section(isHe ? 'לפגישה הבאה' : 'Next session', txt(a.next_session_focus))}
      </div>
    );
  };
  const handleDailyVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isDailyRecording) { dailyRecognitionRef.current?.stop(); return; }
    const r = new SR();
    r.lang = isHe ? 'he-IL' : 'en-US';
    r.continuous = false;
    r.interimResults = true;
    baseDailyTextRef.current = dailyText;
    r.onresult = (e: any) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text; else interim += text;
      }
      if (final) {
        baseDailyTextRef.current = baseDailyTextRef.current ? baseDailyTextRef.current + ' ' + final : final;
        setDailyText(baseDailyTextRef.current);
      } else {
        setDailyText(baseDailyTextRef.current ? baseDailyTextRef.current + ' ' + interim : interim);
      }
    };
    r.onerror = () => { setIsDailyRecording(false); dailyRecognitionRef.current = null; };
    r.onend = () => { setIsDailyRecording(false); dailyRecognitionRef.current = null; };
    dailyRecognitionRef.current = r;
    r.start();
    setIsDailyRecording(true);
  };

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
    if (!el) return { full: '', public: '', display: '' };
    const full = el.innerText?.trim() || '';
    const clone = el.cloneNode(true) as HTMLDivElement;
    clone.querySelectorAll('.bw-private').forEach(s => s.remove());
    const pub = clone.innerText?.trim() || full;
    // גרסת התצוגה · אותו טקסט כמו זה שנשלח, אבל הקטעים שהוסרו מסומנים
    // בחסימה במקום להיעלם בשקט. אותה מחווה כמו בתצוגה המקדימה של השיתוף:
    // רואים איפה היה משהו, ולא מה היה.
    const dclone = el.cloneNode(true) as HTMLDivElement;
    dclone.querySelectorAll('.bw-private').forEach(sp => sp.replaceWith(document.createTextNode('▉▉▉▉▉')));
    const display = dclone.innerText?.trim() || pub;
    return { full, public: pub, display };
  };

  // לחיצה על רשומה ב"מה כתבתי" מחזירה את הכתיבה למסך הכתיבה. לכרטיס לא היה
  // מאזין כלל, רק לכפתור המחיקה שבתוכו, ולכן לחיצה עליו לא עשתה דבר.
  // שדה הכתיבה הוא contentEditable ואינו נשלט על ידי React, ולכן כותבים
  // אליו דרך ה-ref, אותו דפוס שכבר קיים בניקוי המסך.
  const openWriteEntry = (entry: WriteEntry) => {
    const text = entry.fullText || entry.publicText || '';
    if (!text) return;
    setPatientView('write');
    setHoldText(text);
    // ‎requestAnimationFrame‎ כאן רץ לפני שמסך הכתיבה הספיק להירנדר, ולכן
    // ה-ref היה עדיין ריק והטקסט לא נחת. הכתיבה עוברת לאפקט שרץ אחרי
    // שהמסך קיים.
    setPendingWrite(text);
  };

  // הכתיבה לשדה נעשית אחרי שמסך הכתיבה קיים. השדה הוא contentEditable
  // ואינו נשלט על ידי React, ולכן הוא נכתב דרך ה-ref ולא דרך value.
  useEffect(() => {
    if (pendingWrite === null || patientView !== 'write') return;
    const el = holdTextareaRef.current;
    if (!el) return;
    // הטיוטה נשמרת כ-HTML והרשומה בארכיון נשמרת כטקסט. הצבה ל-innerText
    // איבדה את שבירות השורה, ולכן ההמרה נעשית כאן במפורש: בריחה מתווי HTML
    // ואז שורה לכל <br>, אותו מבנה שהשדה כותב לעצמו.
    el.innerHTML = pendingWrite
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .split('\n').join('<br>');
    setPendingWrite(null);
  }, [pendingWrite, patientView]);

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
    const { full, public: pub, display } = getHoldContent();
    // Crisis check scans FULL text (incl. .bw-private) so distress marked
    // private still triggers the banner. Privacy preserved: only `pub` is
    // passed to the theorist below — bw-private content never reaches the model.
    if (full && (window as any).checkCrisis?.(full)) {
      (window as any).showCrisisBanner?.();
    }
    // Default save: commit the writing to the local archive once, on continue.
    if (full) (window as any).saveWriteEntry?.(full, pub);
    (window as any).enterHoldConversation?.(theorist, pub, display);
    window.bwTrack?.('conversation_entered', { theorist });
    if (holdTextareaRef.current) holdTextareaRef.current.innerHTML = '';
    setHoldText('');
    setHoldSaveStatus('');
    // Clear the working draft — it has now been archived.
    if (holdDraftTimerRef.current) clearTimeout(holdDraftTimerRef.current);
    try { localStorage.removeItem('bw_hold_draft'); } catch { /* ignore */ }
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
    : ['freud','klein','winnicott','ogden'];
  const THEORIST_LIST: [string, string, string][] = theoristKeys.map(k => [k, THEORIST_LABELS[k][0], THEORIST_LABELS[k][1]]);
  // הסגנון של כלי השיחה עבר ל-‎.bw-session-tool ב-globals.css. הנימוק שעמד כאן, "גובה 32
  // כי אלה כלים משניים", היה הצדקה עצמית: מאיה מדדה ופסלה, מינימום המגע הוא 44.

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
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--muted)', padding: '6px 10px', borderRadius: 6, border: '1px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
              <Globe size={15} strokeWidth={1.75} />
            </div>
            {authLangOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px', boxShadow: '0 4px 16px rgba(45,36,32,0.1)', zIndex: 210, minWidth: 130 }}>
                {([
                  ['en','🇬🇧','English'],['he','🇮🇱','עברית']
                ] as [string,string,string][]).map(([code, flag, name]) => (
                  <div key={code}
                    onClick={() => { (window as any).selectLangSB(code, flag, name); setAuthLangOpen(false); }}
                    style={{ padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    {flag} {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        {/* מסך הכניסה בעיצוב החדש · 28.08.2026.
            השם ב-Assistant ולא בסריף איטלקי, לפי הכרעת הלוגו.
            הפריסה מיושרת לתחילת השורה ולא ממורכזת, כי בעברית זה נקרא טוב יותר. */}
        <div style={{ textAlign: 'start', maxWidth: 420, width: '90%', padding: '0 20px' }}>
          <h2 id="auth-title" dir="ltr" style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 40, fontWeight: 200, letterSpacing: '.02em', color: 'var(--text)', marginBottom: 10, direction: 'ltr', textAlign: 'start' }} suppressHydrationWarning>Between</h2>
          <p id="auth-subtitle" style={{ fontSize: 'var(--fs-body-lg)', color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>מרחב לחשוב על מה שנשאר בין מפגש למפגש.</p>

          {/* BW-111 — login persona CHOICE. The choice is a request; therapist is granted only if the
              account is on the allowlist (server-gated via /api/me in __resolvePersona). Else → patient. */}
          <div style={{ marginBottom: 16 }}>
            {/* הטקסטים כאן היו קבועים בעברית, ו-applyUITranslation חיפש מזהים
                אחרים (persona-auth-*) שאיש אינו מרנדר, ולכן בממשק האנגלי
                נשארה עברית. React מרנדר, ולכן React גם בוחר את השפה. */}
            <div style={{ fontSize: 'var(--fs-caption)', letterSpacing: '.08em', fontWeight: 700, color: 'var(--muted)', marginBottom: 9 }}>{isHe ? 'כניסה כ' : 'Sign in as'}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['patient', isHe ? 'בטיפול' : 'In therapy'],['therapist', isHe ? 'מטפל/ת' : 'Therapist']] as [string,string][]).map(([key, label]) => (
                <button key={key} id={`persona-choice-${key}`}
                  onClick={() => {
                    try { localStorage.setItem('bw_persona_choice', key); } catch {}
                    ['patient','therapist'].forEach(k => {
                      const btn = document.getElementById(`persona-choice-${k}`);
                      if (!btn) return;
                      const on = k === key;
                      btn.style.background = on ? 'var(--accent-deep)' : 'transparent';
                      btn.style.borderColor = on ? 'var(--accent-deep)' : 'var(--border)';
                      btn.style.color = on ? '#fff' : 'var(--text)';
                      btn.style.fontWeight = on ? '600' : '500';
                    });
                  }}
                  style={{ flex: 1, height: 44, background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-body-md)', fontWeight: 500, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--text)', cursor: 'pointer', transition: 'all 0.25s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <input id="auth-email" type="email" placeholder="כתובת מייל" dir="ltr"
              style={{ width: '100%', height: 44, padding: '0 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-rubik), sans-serif', fontSize: 'var(--fs-body-md)', color: 'var(--text)', background: 'var(--field)', outline: 'none', textAlign: 'left' }}
              onKeyDown={undefined}
            />
            <input id="auth-password" type="password" placeholder="סיסמה" dir="ltr"
              style={{ width: '100%', height: 44, padding: '0 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-rubik), sans-serif', fontSize: 'var(--fs-body-md)', color: 'var(--text)', background: 'var(--field)', outline: 'none', textAlign: 'left' }}
            />
          </div>

          {/* פעולה ראשית אחת. השנייה נשארת ב-DOM כי chat.js כותב לתוכה בהחלפת שפה. */}
          <div style={{ marginBottom: 12 }}>
            <button id="signin-btn"
              onClick={() => (window as any).signIn?.()}
              style={{ display: authMode === 'signin' ? 'block' : 'none', width: '100%', height: 44, background: 'var(--accent-deep)', border: '1px solid var(--accent-deep)', color: '#fff', fontSize: 'var(--fs-body-md)', fontWeight: 600, fontFamily: 'var(--font-rubik), sans-serif', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              כניסה
            </button>
            <button id="signup-btn"
              onClick={() => (window as any).signUp?.()}
              style={{ display: authMode === 'signup' ? 'block' : 'none', width: '100%', height: 44, background: 'var(--accent-deep)', border: '1px solid var(--accent-deep)', color: '#fff', fontSize: 'var(--fs-body-md)', fontWeight: 600, fontFamily: 'var(--font-rubik), sans-serif', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              הרשמה
            </button>
          </div>
          <div id="auth-error" style={{ display: 'none', fontSize: 15, color: '#c06060', marginTop: 8 }}></div>
          <div style={{ marginTop: 14, textAlign: 'start', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span id="auth-forgot" onClick={() => (window as any).resetPassword?.()}
              style={{ display: authMode === 'signin' ? 'inline' : 'none', fontSize: 'var(--fs-body-sm)', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 4 }}>שכחתי סיסמה</span>
            <span onClick={() => setAuthMode(m => m === 'signup' ? 'signin' : 'signup')}
              style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--muted)', cursor: 'pointer' }}>
              {authMode === 'signup'
                ? <>כבר יש לך חשבון? <span style={{ color: 'var(--accent-deep)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 }}>כניסה</span></>
                : <>אין לך עדיין חשבון? <span style={{ color: 'var(--accent-deep)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4 }}>הרשמה</span></>}
            </span>
          </div>
          <p id="auth-security" style={{ fontSize: 'var(--fs-caption)', color: 'var(--muted)', lineHeight: 1.8, marginTop: 18 }}>
            השיחות נשמרות רק על המכשיר שלך. אנחנו לא שומרים אותן אצלנו.
            <br />
            פרטי הכניסה מוצפנים ומאובטחים.
          </p>
          <p id="auth-disclaimer" style={{ fontSize: 'var(--fs-caption)', color: 'var(--muted)', lineHeight: 1.85, marginTop: 22, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
מרחב לחשיבה בין מפגשים — לא תחליף לטיפול ולא לסופרוויז'ן. העבודה קורית בין שני בני אדם: בנוכחות, בקשר, בזמן.
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
      <div id="sidebar" className={`persona-${activePersona}${sidebarCollapsed ? ' collapsed' : ''}`}>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* כיווץ הסייד-בר — אייקון בלבד בראש התפריט, מעל הכל (הכרעת איה 25.08). עבר לכאן
              מהכותרת, שם ישב מעל אזור הכתיבה בלי קשר לשיחה. נשאר ‎.sb-item כדי שיתיישר עם
              עמודת האייקונים שמתחתיו ויקבל את אותו ריחוף, רק בלי ‎.sb-label. בטוח במצב מכווץ:
              הסייד-בר מתכווץ ל-52px ואינו נעלם, ולכן האייקון נשאר גלוי ולחיץ. */}
          {/* המותג · Between תמיד, גם בממשק עברי (הכרעת איה 28.08), בלי סימן גרפי */}
          <div className="n-brand">
            <span className="n-n">Between</span>
            <button className="n-iconbtn n-sideclose" id="sb-toggle-btn" aria-label={isHe ? 'סגירת התפריט' : 'Close menu'}
              onClick={() => (window as any).toggleSidebar()}>✕</button>
          </div>
          {/* BW-104 · מתג הפרסונות עבר לבר העליון, כמו בקובץ העיצוב. */}
          <div style={{ padding: '16px 8px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* end-session moved out of sidebar — appears inline at bottom of chat */}
            <div className="sb-item" data-persona="both" onClick={() => { setResearchPicking(false); setPatientView('write'); (window as any).newChat(); }}>
              <span className="sb-icon"><PenLine size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-new-chat-label">שיחה חדשה</span>
            </div>
            {/* חיפוש רשת ירד מכאן לתפריט הפרופיל (הכרעת איה, פריט 2) — הוא הגדרה נמשכת, לא פעולה. */}
            {activePersona === 'patient' && <div className="sb-section-label">{isHe ? 'שלי' : 'Mine'}</div>}
            <div className={`sb-item${patientView === 'archive' ? ' active' : ''}`} data-persona="patient" onClick={() => { loadWriteEntries(); setPatientView('archive'); }}>
              <span className="sb-icon"><ScrollText size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-write-archive-label">{currentLang === 'he' ? 'מה כתבתי' : 'What I wrote'}</span>
            </div>
            {/* הורד PDF וסיכום התייעצות ירדו מכאן לשורת השיחה (שלב 2, הכרעת איה). שניהם נוגעים
                לשיחה הנוכחית בלבד, ולכן מקומם בתוכה ולא בתפריט שמלווה גם את מסך הבית.
                בורר הגישה נשאר כאן בכוונה: הוא משנה תיאורטיקן גם לפני שנפתחה שיחה, והסרתו
                הייתה סוגרת דרך קיימת. יורד רק אחרי שאיה תאשר שהמסלול שבשיחה עובד. */}
            {/* המקרים עברו לסייד-בר 21.08 (הכרעת מאיה). קודם ההתייעצויות הקודמות ישבו
                פתוחות בתחתית מסך הכתיבה והתחרו בעבודה עצמה. רמה אחת בלבד — הדרופדאון
                מציג מקרים, וההתייעצויות נשארות בתוך המקרה; רשימה מקוננת בסייד-בר צר
                היא מלכודת. ומרונדר רק כשיש מקרה — דרופדאון שנפתחת אל כלום אומרת
                למשתמש חדש שהוא פספס משהו. אותו רכיב של "גישה תיאורטית". */}
            {/* BW-113 — מחקר הוא מצב עבודה ולא מקרה. הכרעת איה 29.08: הוא ישב
                בתחתית קבוצת "מקרים" ונקרא כשם של מטופל נוסף ברשימה. הועבר
                לקבוצה משלו, מעל הרשימה. */}
            {isLocalhost && activePersona === 'therapist' && (
              <>
                <div className="sb-section-label">{isHe ? 'מצב עבודה' : 'Mode'}</div>
                <div id="sb-explore-btn" className={`sb-item${researchPicking || researchOn ? ' active' : ''}`} data-persona="therapist"
                  onClick={() => {
                    // פעיל -> יציאה דרך אותה פונקציה שמנקה את השיחה.
                    // כבוי -> מסך בחירת גישה, ולא כניסה מיידית לברירת מחדל.
                    if (localStorage.getItem('bw_mode') === 'explore') { (window as any).enterExploreModeFromSidebar?.(); setResearchPicking(false); return; }
                    setResearchApproach(null); setResearchSelOpen(false); setResearchPicking(true);
                  }}>
                  <span className="sb-icon"><BookOpen size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label">{currentLang === 'he' ? 'מחקר' : 'Research'}</span>
                  {/* "בבחירה" גובר על "פעיל": בזמן בחירה אין שיחה, ולומר עליה
                      פעיל הוא לתאר מצב שאינו קיים. קרה גם כשחוזרים לכתיבת
                      המחקר, שם bw_mode נשאר explore בכוונה (הוא מגדר את הקול). */}
                  <span className="n-val" id="sb-explore-val">{researchPicking ? (isHe ? 'בבחירה' : 'Choosing') : researchOn ? (isHe ? 'פעיל' : 'On') : (isHe ? 'כבוי' : 'Off')}</span>
                </div>
              </>
            )}
            {activePersona === 'therapist' && (
              <>
                <div className="sb-section-label">{isHe ? 'מקרים' : 'Cases'}</div>
                <div className={`sb-item${!researchPicking && therapistView === 'cases' ? ' active' : ''}`}
                  onClick={() => { setResearchPicking(false); setTherapistView('cases'); setCasesLoaded(false); }}>
                  <span className="sb-label">{isHe ? 'כל המקרים' : 'All cases'}</span>
                </div>
                {cases.map(c => (
                  <div key={c.id} className={`sb-item sb-sub${!researchPicking && !researchOn && selectedCase?.id === c.id && therapistView === 'caseDetail' ? ' active' : ''}`} onClick={() => { setResearchPicking(false); openCase(c); }}>
                    <span className="sb-label">{c.label}</span>
                  </div>
                ))}
                {/* הארכיון היה קיים במלואו בקוד ולא הייתה אליו שום כניסה:
                    "העברה לארכיון" הזיזה מקרה למקום שאי אפשר לראות. */}
                <div className={`sb-item${!researchPicking && therapistView === 'archive' ? ' active' : ''}`}
                  onClick={() => { setResearchPicking(false); setArchivedLoaded(false); setTherapistView('archive'); }}>
                  <span className="sb-label">{isHe ? 'ארכיון' : 'Archive'}</span>
                </div>
              </>
            )}
            {/* פיקוח קליני הוסר מה-UI (קו אדום CORE: לא תחליף לסופרוויזיה; ההתייעצות מכסה את הצורך). הראוט/הפונקציה נשארו בקוד — הפיך. BW-112. */}
            {/* "מה לקחתי מהשיחה" ירד מכאן לשורת כלי השיחה (הכרעת איה). הוא היה כפתור של שיחה
                שיושב בתפריט של הממשק כולו: updateReflectionBtn כבר גידר אותו על
                conversationHistory >= 2, כלומר התלות בשיחה הייתה קיימת והמיקום בלבד סתר אותה. */}
            {/* אנונימיזציה ופידבק — גלויים רק ב-localhost */}
            {/* anonymization removed from UI */}
            {/* פריטי פיתוח · אותו נימוק כמו מחקר, אסור שייקראו כפריט ברשימת המקרים */}
            {isLocalhost && <div className="sb-section-label">{isHe ? 'פיתוח' : 'Dev'}</div>}
            {isLocalhost && (
              <div className="sb-item admin-only" data-persona="admin" onClick={() => (window as any).openUserFeedback()}>
                <span className="sb-icon" style={{ fontSize: 16, lineHeight: 1 }}>◈</span>
                <span className="sb-label" id="sb-feedback-label">פידבק משתמש</span>
                <span style={{ fontSize: 13, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(בטא)' : '(Beta)'}</span>
              </div>
            )}
            {/* חדר הבורד — גלוי רק ב-localhost */}
            {isLocalhost && (
              <div className="sb-item admin-only" data-persona="admin" onClick={() => (window as any).openBoardRoom()}>
                <span className="sb-icon" style={{ fontSize: 16, lineHeight: 1 }}>⬡</span>
                <span className="sb-label" id="sb-board-label">חדר הבורד</span>
                <span style={{ fontSize: 13, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(בטא)' : '(Beta)'}</span>
              </div>
            )}
          </div>

          {/* רשימת התיאורטיקנים ירדה מכאן (הכרעת איה, פריט 6). הבחירה שייכת למקום שהיא
              פועלת עליו: המטופלת בוחרת בבורר הקול שבכרטיס הכתיבה, המטפלת בצ'יפים של
              "מאיזו גישה?", ובתוך שיחה חיה שניהם דרך בורר הגישה שבשורת הכלים.
              הגידור isMobile על בורר הקול ירד באותו קומיט, אחרת מטופלת בדסקטופ הייתה
              נשארת נעולה על ויניקוט בלי שום דרך לשנות. */}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', padding: 8, position: 'relative' }}>
          {userMenuOpen && (
          <div id="sb-user-menu" className="n-acctmenu">
            {/* חיפוש רשת, שפה וצור קשר רוכזו כאן מהסייד-בר ומהכותרת (הכרעת איה, פריטים 2 ו-4).
                אותם מזהים ואותן מחלקות ‎js-*-label כמו קודם, כדי ש-applyUITranslation ימשיך לעדכן. */}
            {/* ⛔ ירד מה-UI 29.08.2026 · ראה ההערה בתפריט הבר */}
            {false && <button className="n-mi" data-persona="therapist" onClick={() => (window as any).toggleWebSearch()} id="sb-websearch-btn">
              <span>{isHe ? 'חיפוש רשת' : 'Web search'}</span>
              <span className="n-val">{webSearchOn ? (isHe ? 'דלוק' : 'On') : (isHe ? 'כבוי' : 'Off')}</span>
            </button>}
            <button className="n-mi" onClick={(e) => { e.stopPropagation(); const nl = currentLang === 'he' ? 'en' : 'he'; setCurrentLang(nl); (window as any).selectLang?.(nl, nl === 'en' ? '🇬🇧' : '🇮🇱', nl === 'en' ? 'English' : 'עברית'); }}>
              <span>{isHe ? 'שפה' : 'Language'}</span>
              <span className="n-val">{currentLang === 'he' ? 'עברית' : 'English'}</span>
            </button>
            <button className="n-mi" onClick={() => { setContactState(''); setContactEmail((window as any)._userEmail || ''); setContactOpen(true); }}>
              <span>{isHe ? 'צרי קשר' : 'Contact'}</span>
            </button>
            <div className="n-div" />
            <button className="n-mi js-settings-label" onClick={() => (window as any).openSettings()}>{isHe ? 'הגדרות' : 'Settings'}</button>
            <button className="n-mi js-signout-label" onClick={() => (window as any).signOut()}>{isHe ? 'התנתק' : 'Sign out'}</button>
          </div>
          )}
          {/* כרטיס החשבון · מהעיצוב החדש: המייל בשורה הראשית ו"הגדרות ופרופיל"
              מתחתיו, בלי עיגול אווטאר.
              ‎#sb-user-name‎ נשאר בעץ ומוסתר: הוא אינו מוצג בעיצוב החדש, אבל
              ייצוא ה-PDF ומודל התמיכה קוראים ממנו את שם המשתמש. */}
          <button className="n-acct sb-user-row" onClick={() => setUserMenuOpen(v => !v)} id="sb-user-row" aria-expanded={userMenuOpen}>
            <span className="n-e" id="sb-user-email">{userEmail || (isHe ? 'משתמש' : 'User')}</span>
            <span className="n-r" id="sb-user-sub-label">{isHe ? 'הגדרות ופרופיל' : 'Settings and profile'}</span>
            <span id="sb-user-name" hidden />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div id="main-content">
        {/* ═══ הבר השחור ═══
            נשמר מקובץ העיצוב (‎.proto‎). Between בצד שמאל, ההגדרות בצד ימין.
            ‎direction:ltr‎ על הבר קובע ששמאל הוא שמאל פיזי גם בממשק עברי. */}
        <div className="bw-topbar">
          {/* הלוגו · יונק הדבש עם מילת Between. הבר כהה ולכן נטענת גרסת
              הלבן. אם הקובץ חסר, הדפדפן מסתיר את התמונה והמילה נשארת
              כטקסט, כך שהבר לעולם אינו ריק. */}
          <span className="bw-topbar-mark">
            {/* ברירת המחדל היא שהסימן מוצג · רק כשל טעינה מחליף אותו במילה.
                ‎onLoad‎ אינו אמין כאן: תמונה שכבר במטמון נטענת לפני ש-React
                מחבר את המטפל, והאירוע לא נורה כלל. */}
            {!logoFailed && (
              <img src="/between-logo-light.svg" alt="Between"
                onError={() => setLogoFailed(true)} />
            )}
            {logoFailed && <span className="bw-topbar-wordmark">Between</span>}
          </span>
          {isLocalhost && (
            <div className="bw-topbar-grp">
              {([['patient', isHe ? 'מטופלת' : 'Patient'], ['therapist', isHe ? 'מטפלת' : 'Therapist']] as ['patient' | 'therapist', string][]).map(([key, label]) => (
                <button key={key} className={`bw-topbar-btn${devPersona === key ? ' on' : ''}`}
                  onClick={() => { if (key !== devPersona) { (window as any).bwExitChatToHome?.(); setDevPersona(key); } }}>
                  {label}
                </button>
              ))}
            </div>
          )}
          <div className="bw-topbar-end">
            <button className="bw-topbar-btn" aria-haspopup="menu" aria-expanded={headerMenuOpen}
              onClick={() => setHeaderMenuOpen(v => !v)}>
              <Settings size={14} strokeWidth={1.75} />
              <span>{isHe ? 'הגדרות' : 'Settings'}</span>
            </button>
            {headerMenuOpen && (<>
              <div className="bw-topbar-scrim" onClick={() => setHeaderMenuOpen(false)} />
              <div className="bw-topbar-menu n-acctmenu" dir={isHe ? 'rtl' : 'ltr'}>
                <div className="n-who">
                  <span className="n-av">
                    {avatarSrc
                      ? <img src={avatarSrc} alt="" />
                      : (profileName || userEmail || 'A').charAt(0).toUpperCase()}
                  </span>
                  {profileName && <span className="n-n">{profileName}</span>}
                  <span className="n-e"><bdi>{userEmail}</bdi></span>
                </div>
                {/* חיפוש רשת הוא כלי של מטפלת בלבד (BRAIN). הגידור ב-CSS מכוון
                    ל-‎#sidebar‎ ול-‎#bw-account-menu‎, ותפריט הבר אינו אף אחד מהם,
                    ולכן מטופלת ראתה אותו. הגידור כאן הוא ב-React, שמרנדר את
                    התפריט ויודע מי הפרסונה. זה חשוב במיוחד כי במצב הזה אימות
                    הפלט מדולג והקול אינו מובטח. */}
{/* ⛔ חיפוש רשת ירד מה-UI 29.08.2026 בהכרעת איה. הקוד ו-route נשארו
                    והמחיקה הפיכה, כמו שנעשה עם פיקוח קליני ואנונימיזציה.
                    הסיבה: בריצה חיה במצב הזה אימות הפלט מדולג והקול מתמוטט
                    לגנרי. `window.webSearch` נשאר false ולעולם אינו נדלק,
                    ולכן השרת תמיד מריץ RAG בלי אינטרנט. */}
                {false && (
                <button className="n-mi" onClick={() => { (window as any).toggleWebSearch?.(); }}>
                  <span>{isHe ? 'חיפוש רשת' : 'Web search'}</span>
                  <span className="n-val">{webSearchOn ? (isHe ? 'דלוק' : 'On') : (isHe ? 'כבוי' : 'Off')}</span>
                </button>
                )}
                <button className="n-mi" onClick={() => { const nl = currentLang === 'he' ? 'en' : 'he'; setCurrentLang(nl); (window as any).selectLang?.(nl, nl === 'en' ? '🇬🇧' : '🇮🇱', nl === 'en' ? 'English' : 'עברית'); }}>
                  <span>{isHe ? 'שפה' : 'Language'}</span>
                  <span className="n-val">{currentLang === 'he' ? 'עברית' : 'English'}</span>
                </button>
                <button className="n-mi" onClick={() => { setHeaderMenuOpen(false); setContactState(''); setContactEmail((window as any)._userEmail || ''); setContactOpen(true); }}>
                  <span>{isHe ? 'צרי קשר' : 'Contact'}</span>
                </button>
                <div className="n-div" />
                <button className="n-mi" onClick={() => { setHeaderMenuOpen(false); (window as any).openSettings?.(); }}>{isHe ? 'הגדרות ופרופיל' : 'Settings and profile'}</button>
                <button className="n-mi" onClick={() => { setHeaderMenuOpen(false); (window as any).signOut?.(); }}>{isHe ? 'התנתק' : 'Sign out'}</button>
              </div>
            </>)}
          </div>
        </div>
        <header>
          <div className="header-top" style={{ padding: '16px 24px', direction: 'ltr' }}>
            {/* הכותרת התרוקנה משלושה אייקונים (הכרעת איה, פריטים 4 ו-5): מתג הסייד-בר עבר לתוך
                הסייד-בר, וצור קשר והשפה עברו לתפריט הפרופיל.
                ה-h1 ממורכז ב-position:absolute ולכן אינו תורם גובה, ושאר עמודות הכותרת מוסתרות
                בדסקטופ. בלי העוגן הזה לא נשאר ל-header-top אף ילד בזרימה, הבר התכווץ מ-89px
                ל-45px והשם נדבק לקצה. הגובה 44 הוא בדיוק מה שאשכול האייקונים החזיק קודם.
                אין כאן display בסגנון שורה בכוונה: ‎.header-left { display: none } במובייל הובס
                עד היום בדיוק בגלל ה-display:flex שישב כאן, ולכן האייקונים נשארו בכותרת המובייל
                בניגוד להערה שטענה שהם נושרים. בלעדיו הכלל עובד והכותרת חוזרת ל-56px. */}
            <div className="header-left" style={{ flexShrink: 0, minWidth: 80, height: 44 }} />
            <h1 dir="ltr" style={{ direction: 'ltr' }} suppressHydrationWarning>Between</h1>
            <div style={{ flexShrink: 0, minWidth: 80, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              {/* Mobile-only: new conversation. Bubble+plus (Claude Design 24.07) — a pencil read as "edit", not "new conversation". */}
              <div
                className="bw-header-newchat"
                onClick={() => (window as any).newChat()}
                title="שיחה חדשה"
                style={{ cursor: 'pointer', color: 'var(--text)', borderRadius: 'var(--radius-md)', lineHeight: 1, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <MessageCirclePlus size={21} strokeWidth={1.75} />
              </div>
              {/* שיחת היכרות (intake) — patient onboarding only; not rendered for therapists (BW-112). */}
              {activePersona === 'patient' && (
              <div id="header-intake-btn" onClick={() => (window as any).startIntake()} style={{ display: 'none', alignItems: 'center', justifyContent: 'center', lineHeight: 1, cursor: 'pointer', height: 'var(--h-ctl)', fontSize: 'var(--fs-body-md)', color: 'var(--text)', background: 'transparent', border: '1px solid var(--text)', borderRadius: 'var(--radius-sm)', padding: '0 18px', fontFamily: 'var(--font-rubik), sans-serif', fontWeight: 600, transition: 'all 0.25s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { const t = e.currentTarget as HTMLElement; t.style.borderColor = 'var(--accent-deep)'; t.style.color = 'var(--accent700)'; }}
                onMouseLeave={(e) => { const t = e.currentTarget as HTMLElement; t.style.borderColor = 'var(--text)'; t.style.color = 'var(--text)'; }}>
                שיחת היכרות
              </div>
              )}
              {/* Mobile-only account entry — opens #bw-account-menu (tools + account), the phone stand-in for the hidden sidebar. */}
              <div className="bw-header-avatar" onClick={(e) => { e.stopPropagation(); (window as any).toggleAccountMenu(); }} title="חשבון" style={{ cursor: 'pointer', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                <div className="sb-avatar">{avatarSrc
                  ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }} />
                  : (profileName || userEmail || 'A').charAt(0).toUpperCase()}</div>
              </div>
            </div>
            {/* Mobile account menu — mirrors the sidebar's tools + account, persona-scoped exactly like #sidebar.
                Labels reuse the shared .js-*-label classes so applyUITranslation updates both copies. */}
            <div id="bw-account-menu" className={`persona-${activePersona}`} style={{ display: 'none' }}>
              {/* 1. Account row — avatar + name + email. Name/email copied from #sb-user-* at open (toggleAccountMenu). */}
              <div className="bw-acct-account-row">
                <div className="sb-avatar">{avatarSrc
                  ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '50%' }} />
                  : (profileName || userEmail || 'A').charAt(0).toUpperCase()}</div>
                <div style={{ overflow: 'hidden' }}>
                  <div className="bw-acct-name">{currentLang === 'he' ? 'משתמש' : 'User'}</div>
                  <div className="bw-acct-email"></div>
                </div>
              </div>
              {/* 2. Language toggle HE/EN — was missing on mobile (Claude Design). Reuses selectLang. */}
              <div className="bw-acct-lang">
                <button className={currentLang === 'he' ? 'active' : ''} onClick={() => { if (currentLang !== 'he') { setCurrentLang('he'); (window as any).selectLang?.('he', '🇮🇱', 'עברית'); } }}>עברית</button>
                <button className={currentLang === 'en' ? 'active' : ''} onClick={() => { if (currentLang !== 'en') { setCurrentLang('en'); (window as any).selectLang?.('en', '🇬🇧', 'English'); } }}>English</button>
              </div>
              {/* 3. Account — settings, signout (essentials the design omitted; a mobile user must be able to sign out). */}
              <div className="bw-acct-section">
                <div className="sb-item" onClick={() => { (window as any).openSettings(); (window as any).closeAccountMenu?.(); }}>
                  <span className="sb-icon"><Settings size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label js-settings-label">הגדרות</span>
                </div>
                {/* צור קשר — ירד מסימן השאלה שבכותרת (הכרעת איה, פריט 4). */}
                <div className="sb-item" onClick={() => { (window as any).openSupportModal?.(); (window as any).closeAccountMenu?.(); }}>
                  <span className="sb-icon"><HelpCircle size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label">{currentLang === 'he' ? 'צרי קשר' : 'Contact'}</span>
                </div>
                <div className="sb-item" onClick={() => { (window as any).signOut(); (window as any).closeAccountMenu?.(); }}>
                  <span className="sb-icon"><LogOut size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label js-signout-label">התנתק</span>
                </div>
              </div>
              {/* 4. Tools (therapist) + PDF (gated) + intake (patient). */}
              <div className="bw-acct-section">
                {/* ⛔ ירד מה-UI 29.08.2026 · ראה ההערה בתפריט הבר */}
                {false && <div className="sb-item" data-persona="therapist" onClick={() => { (window as any).toggleWebSearch(); (window as any).closeAccountMenu?.(); }}>
                  <span className="sb-icon"><Globe size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label">{isHe ? 'חיפוש רשת' : 'Web search'}</span>
                  <span className="n-val">{webSearchOn ? (isHe ? 'דלוק' : 'On') : (isHe ? 'כבוי' : 'Off')}</span>
                </div>}
                {/* סיכום התייעצות ירד גם מכאן: שורת כלי השיחה גלויה במובייל, ולכן הסיכום
                    נגיש שם בזמן שיחה, וזה המקום היחיד שבו הוא רלוונטי. */}
                {activePersona === 'patient' && (
                <div className="sb-item" data-persona="patient" onClick={() => { (window as any).startIntake?.(); (window as any).closeAccountMenu?.(); }}>
                  <span className="sb-icon"><Sparkles size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label">שיחת היכרות</span>
                </div>
                )}
              </div>
            </div>
          </div>
          <div className="header-session">
            <div id="session-title" style={{ display: 'none' }}></div>
            <div style={{ flex: 1 }}></div>
            <div className="session-actions">
              {/* intake btn moved to header-top right slot; clinical-btn accessible via sidebar only */}
              {/* כלי השיחה (שלב 2, הכרעת איה): "כל מה שקשור לשיחה שאני עושה צריך להיות בתוך
                  השיחה". PDF, סיכום התייעצות ובורר הגישה ירדו מהסייד-בר לכאן. הקבוצה מוסתרת
                  עד שיש שיחה חיה, ו-chat.js updatePdfBtn מדליק אותה לפי conversationHistory.
                  הכפתור הוורוד שהיה כאן במובייל אוחד לסגנון שקט אחד, כדי ששורת הכלים לא
                  תתחרה בשיחה עצמה. */}
              <div id="bw-session-tools" style={{ display: 'none', alignItems: 'center', gap: 'var(--space-xs)', position: 'relative' }}>
                <button
                  onClick={() => setSessionApproachOpen(o => !o)}
                  title={isHe ? 'שינוי גישה תיאורטית' : 'Change theoretical approach'}
                  className="bw-session-tool"
                >
                  <Sparkles size={14} strokeWidth={1.75} />
                  <span>{(activeApproach && THEORIST_LABELS[activeApproach]?.[0]) || (isHe ? 'גישה' : 'Approach')}</span>
                  <ChevronDown size={12} strokeWidth={1.75} style={{ transition: 'transform 0.2s', transform: sessionApproachOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {activePersona === 'therapist' && (
                <button
                  onClick={() => (window as any).openSessionSummary?.()}
                  title={isHe ? 'סיכום התייעצות' : 'Consultation summary'}
                  className="bw-session-tool"
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>◎</span>
                  <span>{isHe ? 'סיכום' : 'Summary'}</span>
                </button>
                )}
                {/* "מה לקחתי מהשיחה" — עבר לכאן מהסייד-בר. הגידור לא השתנה: chat.js
                    updateReflectionBtn מדליק אותו לפי isAdmin ו-conversationHistory >= 2,
                    ולכן הוא נולד מוסתר ו-chat.js הוא שמדליק, בדיוק כמו קודם. */}
                {activePersona === 'patient' && (
                <button
                  id="patient-reflection-btn-old"
                  onClick={() => (window as any).openPatientReflection?.()}
                  title={isHe ? 'מה לקחתי מהשיחה' : 'What I took from the conversation'}
                  className="bw-session-tool"
                  style={{ display: 'none' }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>◉</span>
                  <span>{isHe ? 'מה לקחתי' : 'What I took'}</span>
                </button>
                )}
                <button
                  id="bw-session-pdf-old"
                  onClick={() => (window as any).exportPDF?.()}
                  title={isHe ? 'הורד PDF' : 'Download PDF'}
                  className="bw-session-tool"
                >
                  <Download size={14} strokeWidth={1.75} />
                  <span>PDF</span>
                </button>
                {/* הצ'יפים נושאים ‎.theorist-tag ו-data-key בדיוק כמו בסייד-בר, ולכן
                    performTheoristSwitch מנקה ומסמן את שני העותקים באותה קריאה. הקריאה היא
                    ל-toggleTheorist ולא ל-bwSetActiveTheorist, כדי שהחלפת גישה באמצע שיחה
                    תמשיך לעבור דרך מודל האזהרה הקיים. */}
                {sessionApproachOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', insetInlineStart: 0, zIndex: 60, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 24px rgba(45,36,32,0.12)', padding: 'var(--space-xs)', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 150 }}>
                    {THEORIST_LIST.map(([key, label]) => (
                      <div key={key} className={`theorist-tag with-sub sb-item${activeApproach === key ? ' active' : ''}`} data-key={key}
                        style={{ fontSize: 16 }}
                        onClick={(e) => { (window as any).toggleTheorist(e.currentTarget, key); setSessionApproachOpen(false); }}>
                        <span>{label}{activeApproach === key ? ' ✓' : ''}</span>
                        <span className="tt-sub">{THEORIST_LABELS[key]?.[1]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>


        {/* הבר העליון של השיחה · מהעיצוב החדש. מוצג רק כשיש שיחה חיה, כלומר
            כשמסך הפתיחה מוסתר. ‎:has()‎ עושה את הגידור בלי לשכפל מצב מ-chat.js. */}
        <div className="n-topbar" id="bw-talk-topbar">
          <span>{isHe ? '\u05e9\u05d9\u05d7\u05d4 \u05e2\u05dd ' : 'A conversation with '}{(activeApproach && THEORIST_LABELS[activeApproach]?.[0]) || (isHe ? '\u05ea\u05d9\u05d0\u05d5\u05e8\u05d8\u05d9\u05e7\u05df' : 'a theorist')}</span>
          {selectedCase && <span className="n-ix">{selectedCase.label}</span>}
          <span>{new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit' })}</span>
        </div>
        <div className="n-hr" id="bw-talk-hr" />
        <div id="chat">
          {mounted && (
            <div className={`welcome${patientView === 'archive' ? ' bw-archive-open' : ''}`} id="welcome">
              {/* BW-41: back button — top-left corner of content area */}
              <span id="bw-back-btn" onClick={() => (window as any).goBackToChat()} style={{ position: 'absolute', top: 20, left: 24, fontSize: 15, color: 'var(--muted)', cursor: 'pointer', opacity: 0.7, display: 'none' }}>← חזרה</span>
              {/* BW-111 — chose "therapist" at login but not on the allowlist → entered as patient. */}
              {personaNotice && !isLocalhost && (
                <div style={{ width: '100%', background: 'var(--thinking)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>{isHe ? 'גישת מטפלים בהזמנה בלבד כרגע, נכנסת כמטופל/ת.' : 'Therapist access is invite-only for now — you\'re in as a patient.'}</span>
                  <span onClick={() => setPersonaNotice(false)} style={{ fontSize: 16, color: 'var(--muted)', cursor: 'pointer', userSelect: 'none' }}>✕</span>
                </div>
              )}
              {/* ═══ מסך: מחקר ═══
                  אותה זרימה כמו הכתיבה: בוחרים גישה, ורק אז נכנסים. עד היום
                  הלחיצה קפצה ישר לשיחה עם ברירת מחדל, בלי לשאול. */}
              {activePersona === 'therapist' && researchPicking && (
              <div style={{ width: '100%' }}>
                <div className="n-topbar">
                  <span>{isHe ? 'מחקר' : 'Research'}</span>
                  <span>{new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <div className="n-hr" />
                <h1 className="n-h">{isHe ? 'דרך איזו גישה נחקור?' : 'Through which approach?'}</h1>

                <div className={`n-plate${researchApproach ? '' : ' n-locked'}`}>
                  <div className="n-zone-head">
                    <span className="n-lbl">{isHe ? 'דרך הגישה של' : 'Through the approach of'}</span>
                    <button className={`n-sel${researchApproach ? '' : ' n-primed'}`} aria-haspopup="listbox" aria-expanded={researchSelOpen}
                      onClick={() => setResearchSelOpen(v => !v)}>
                      {researchApproach
                        ? <span>{getHoldTheoristName(researchApproach)}{' '}<span className="n-sub">{THEORIST_DESC[researchApproach]}</span></span>
                        : <span>{isHe ? 'בחרי גישה' : 'Choose an approach'}</span>}
                      <span className={`n-chev${researchSelOpen ? ' n-open' : ''}`}>⌄</span>
                    </button>
                    {!researchApproach && <span className="n-hintstart"><span>{isHe ? '\u2192' : '\u2190'}</span>{isHe ? 'מתחילים כאן' : 'Start here'}</span>}
                    <div className={`n-menu${researchSelOpen ? ' n-open' : ''}`} role="listbox">
                      {(['freud', 'klein', 'winnicott', 'ogden'] as const).map(key => (
                        <button key={key} className="n-mi" role="option" aria-selected={researchApproach === key}
                          onClick={() => { setResearchApproach(key); setResearchSelOpen(false); }}>
                          <span className="n-nm">{getHoldTheoristName(key)}</span>
                          <span className="n-ds">{THEORIST_DESC[key]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* אזור הכתיבה · שדה אמיתי ולא הערה בתוך מלבן לבן. במחקר יש
                      שאלה, והיא מה שנכנס לשיחה. נעול עד שנבחרה גישה, כמו בכתיבה. */}
                  <div className="n-zone-write">
                    <textarea
                      value={researchText}
                      disabled={!researchApproach}
                      onChange={e => setResearchText(e.target.value)}
                      placeholder={researchApproach
                        ? (isHe ? 'מה את רוצה לחקור? אפשר גם רק להיכנס ולהתחיל משם.' : 'What do you want to explore? You can also just enter and start there.')
                        : (isHe ? 'בחרי גישה כדי להתחיל לכתוב.' : 'Choose an approach to start writing.')}
                      style={{ width: '100%', minHeight: 140, maxHeight: '40vh', overflowY: 'auto', boxSizing: 'border-box', border: 'none', padding: 0, fontSize: 16, fontWeight: 300, lineHeight: 1.85, fontFamily: 'var(--font-rubik), sans-serif', background: 'transparent', color: researchApproach ? 'var(--text)' : 'var(--off)', caretColor: 'var(--accent)', resize: 'vertical', outline: 'none', display: 'block' }}
                    />
                    {!researchApproach && (
                      <div className="n-locknote">{isHe ? 'המחקר נפתח אחרי בחירת הגישה, כי הוא נעשה מתוכה.' : 'Research opens once an approach is chosen. It is done from within it.'}</div>
                    )}
                  </div>
                </div>

                <div className="n-actions">
                  <button className="n-btn n-ghost" onClick={() => setResearchPicking(false)}>{isHe ? 'ביטול' : 'Cancel'}</button>
                  <span className="n-sp" />
                  <button className="n-btn n-solid" disabled={!researchApproach}
                    onClick={() => {
                      const q = researchText.trim();
                      setResearchPicking(false);
                      (window as any).bwStartExplore?.(researchApproach);
                      // השאלה שנכתבה נכנסת לשיחה. ההמתנה נותנת לפתיחה של
                      // התיאורטיקן להירנדר לפני שהשאלה נשלחת.
                      if (q) setTimeout(() => {
                        const inp = document.getElementById('user-input') as HTMLTextAreaElement | null;
                        if (!inp) return;
                        inp.value = q;
                        inp.dispatchEvent(new Event('input', { bubbles: true }));
                        (window as any).sendMessage?.();
                        setResearchText('');
                      }, 900);
                    }}>
                    {isHe ? 'המשך למחקר' : 'Continue to research'}
                  </button>
                </div>
                <div className="n-botbar">{isHe
                  ? 'מחקר הוא חשיבה על החומר התיאורטי עצמו. הוא נפרד מהתייעצות על מקרה, ואינו נשמר תחת מקרה.'
                  : 'Research is thinking about the theory itself. It is separate from a case consultation and is not saved under a case.'}</div>
              </div>
              )}
              {/* ═══ מסך: מה כתבתי ═══
                  מסך ולא שכבה, כמו בעיצוב. כרום של מסך בלבד: בר עליון, קו,
                  כותרת גדולה, כרטיסים, הערת ארעיות ופוטר. */}
              {activePersona === 'patient' && patientView === 'archive' && (
              <div style={{ width: '100%' }}>
                <div className="n-topbar">
                  <span>{isHe ? 'מה כתבתי' : 'What I wrote'}</span>
                  <span>{new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <div className="n-hr" />
                <h1 className="n-h">{isHe ? 'מה שכבר עלה' : 'What has already come up'}</h1>

                {writeEntries.length === 0 ? (
                  <div className="n-empty">
                    <div className="n-t">{isHe ? 'עדיין לא כתבת כאן' : 'Nothing here yet'}</div>
                    <div className="n-d">{isHe
                      ? 'מה שנכתב במסך הכתיבה ונשמר מופיע כאן, בדפדפן הזה בלבד ולכמה ימים.'
                      : 'What you write and save appears here, in this browser only and for a few days.'}</div>
                  </div>
                ) : (<>
                  {writeEntries.map(e => (
                    <div key={String(e.id)} className="n-card" role="button" tabIndex={0}
                      onClick={() => openWriteEntry(e)}
                      onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openWriteEntry(e); } }}>
                      <button className="n-more" aria-label={isHe ? 'מחיקה' : 'Delete'}
                        onClick={ev => {
                          ev.stopPropagation(); // אחרת המחיקה פותחת גם את הרשומה
                          if (!window.confirm(isHe ? 'למחוק את הרשומה הזו?' : 'Delete this entry?')) return;
                          (window as any).deleteWriteEntry?.(e.id);
                          loadWriteEntries();
                        }}>×</button>
                      <div className="n-t">{(e.publicText || e.fullText || '—').split('\n')[0].slice(0, 90)}</div>
                      <div className="n-m">{e.date || ''}</div>
                    </div>
                  ))}
                  <div className="n-empty" style={{ marginTop: 14, border: 'none', padding: '14px 0' }}>
                    {isHe
                      ? <>מה שנכתב לפני כן כבר לא כאן.<br />המרחב אינו שומר, וההורדה היא הדרך היחידה לזכור.</>
                      : <>What was written before is no longer here.<br />The space does not keep, and downloading is the only way to remember.</>}
                  </div>
                </>)}

                <div className="n-actions">
                  <span className="n-sp" />
                  <button className="n-btn n-ghost" onClick={() => setPatientView('write')}>{isHe ? 'חזרה לכתיבה' : 'Back to writing'}</button>
                </div>
                <div className="n-botbar">{isHe
                  ? 'המרחב משרת את הטיפול. מה שמתבהר כאן, מקומו בחדר.'
                  : 'The space serves the therapy. What becomes clear here belongs in the room.'}</div>
              </div>
              )}
              {/* Hold entry — patient only (therapist lands on direct conversation, no Hold) */}
              {/* ה-display של המסך הזה בבעלות chat.js (showModeSelect מציב flex בשורה).
                  כשהצבתי אותו מ-React, undefined מחק את הערך שלו והמסך נשאר מוסתר
                  אחרי "שיחה חדשה". ההסתרה נעשית עכשיו במחלקה על האב. */}
              {activePersona === 'patient' && (
                <div id="bw-mode-select" style={{ flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
                {/* בר עליון וקו שחור · מהעיצוב החדש, 28.08 */}
                <div className="n-topbar" style={{ width: '100%' }}>
                  <span>{isHe ? 'הפגישה האחרונה' : 'Last session'}</span>
                  <span>{new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <div className="n-hr" style={{ width: '100%' }}></div>
                {/* ‎h1‎ ולא ‎p‎ · הכלל בקובץ הוא ‎h1.h‎, בורר שמוגבל לסוג האלמנט, ולכן
                    פסקה לא קיבלה אותו וזה היה המסך היחיד עם כותרת קטנה. */}
                <h1 id="bw-hold-heading" className="n-h" style={{ alignSelf: 'flex-start' }}>{isHe ? 'מה נשאר איתך?' : 'What stayed with you?'}</h1>
                {/* משטח הכתיבה · מבנה העיצוב החדש, 28.08: אזור בחירת גישה מעל,
                    אזור כתיבה מתחת, והכתיבה נעולה עד שנבחרה גישה. */}
                <div className={`n-plate${activeApproach ? '' : ' n-locked'}`} style={{ width: '100%' }}>
                  {/* אזור 1 · בחירת הגישה, פעיל תמיד */}
                  <div className="n-zone-head">
                    <span className="n-lbl">{isHe ? 'דרך הגישה של' : 'Through the approach of'}</span>
                    <button className={`n-sel${activeApproach ? '' : ' n-primed'}`} aria-haspopup="listbox" aria-expanded={selOpen}
                      onClick={() => setSelOpen(v => !v)}>
                      {activeApproach
                        ? <span>{getHoldTheoristName(activeApproach)}{' '}<span className="n-sub">{THEORIST_DESC[activeApproach]}</span></span>
                        : <span>{isHe ? 'בחרי גישה' : 'Choose an approach'}</span>}
                      <span className={`n-chev${selOpen ? ' n-open' : ''}`}>⌄</span>
                    </button>
                    {!activeApproach && <span className="n-hintstart"><span>{isHe ? '\u2192' : '\u2190'}</span>{isHe ? 'מתחילים כאן' : 'Start here'}</span>}
                    <div className={`n-menu${selOpen ? ' n-open' : ''}`} role="listbox" aria-label={isHe ? 'בחירת גישה' : 'Choose an approach'}>
                      {(['freud', 'klein', 'winnicott', 'ogden'] as const).map(key => (
                        <button key={key} className="n-mi" role="option" aria-selected={activeApproach === key}
                          onClick={() => { setHoldTheorist(key); setActiveApproach(key); setSelOpen(false); }}>
                          <span className="n-nm">{getHoldTheoristName(key)}</span>
                          <span className="n-ds">{THEORIST_DESC[key]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* אזור 2 · הכתיבה, האזור היחיד שמשנה מצב */}
                  <div className="n-zone-write">
                    <div
                      id="bw-hold-textarea"
                      contentEditable={!!activeApproach}
                      suppressContentEditableWarning
                      ref={holdTextareaRef}
                      onInput={e => {
                        const el = e.currentTarget as HTMLDivElement;
                        setHoldText(el.innerText?.trim() || '');
                        if (holdSaveStatus) setHoldSaveStatus('');
                        // Default local draft — debounced. Saved as HTML so private marks survive.
                        if (holdDraftTimerRef.current) clearTimeout(holdDraftTimerRef.current);
                        const html = el.innerHTML;
                        const txt = el.innerText?.trim() || '';
                        holdDraftTimerRef.current = setTimeout(() => {
                          try { if (txt) localStorage.setItem('bw_hold_draft', html); else localStorage.removeItem('bw_hold_draft'); } catch { /* ignore */ }
                        }, 400);
                      }}
                      style={{
                        width: '100%', minHeight: 200, padding: '0 0 44px',
                        background: 'transparent',
                        color: activeApproach ? 'var(--text)' : 'var(--off)',
                        fontSize: 16, fontWeight: 300, lineHeight: 1.85,
                        fontFamily: 'var(--font-rubik), sans-serif',
                        caretColor: 'var(--accent)',
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
                          right: isHe ? 23 : undefined, left: isHe ? undefined : 23,
                          textAlign: isHe ? 'right' : 'left',
                          color: 'var(--field-ph)', fontSize: 'var(--fs-body-lg)',
                          fontFamily: 'var(--font-rubik), sans-serif',
                          pointerEvents: 'none', userSelect: 'none', lineHeight: 1.85,
                        }}
                      >
                        {activeApproach
                          ? (isHe ? 'גם אם עוד אין לזה מילים.' : "Even if there aren't words for it yet.")
                          : (isHe ? 'בחרי גישה כדי להתחיל לכתוב.' : 'Choose an approach to start writing.')}
                      </span>
                    )}
                    {/* המיקרופון עבר לתוך השדה (הכרעת איה, פריט 1), כמו אצל המטפלת. */}
                    {speechSupported && activeApproach && (
                      <button
                        onClick={handleToggleVoice}
                        className={`bw-mic${isRecording ? ' bw-mic-recording' : ''}`}
                        aria-pressed={isRecording}
                        title={isHe ? 'הקלטה קולית' : 'Voice input'}
                      >
                        <Mic size={15} />
                      </button>
                    )}
                    {!activeApproach && (
                      <div className="n-locknote">{isHe ? 'שדה הכתיבה נפתח אחרי בחירת הגישה, כי הניתוח והשיחה נעשים מתוכה.' : 'Writing opens once an approach is chosen. The analysis and the talk come from it.'}</div>
                    )}
                  </div>
                </div>
                {/* ההוראה על סימון פרטי · מגודרת על טקסט, כי לפני שנכתב משהו אין מה לסמן */}
                {!!holdText.trim() && (
                  <div className="n-privhint">{isHe ? 'אפשר לסמן קטע בכתיבה ולשמור אותו רק לעצמך. מה שסומן לא ייכלל בשיתוף עם המטפל/ת.' : 'You can mark part of the writing to keep to yourself. What is marked is left out of what you share.'}</div>
                )}
                {/* שורת הפעולות · מתחת ללוח, מהעיצוב החדש */}
                <div className="n-actions">
                  <button className="n-btn n-ghost" disabled={!activeApproach || !holdText.trim()}
                    onClick={() => { setShareState(''); setShareOpen(true); }}>{isHe ? 'שיתוף עם המטפל/ת' : 'Share with therapist'}</button>
                  <span className="n-sp" />
                  <button className="n-btn n-ghost" disabled={!activeApproach || !holdText.trim()} onClick={handleHoldSave}>
                    {holdSaveStatus === 'saved' ? (isHe ? 'נשמר ✓' : 'Saved ✓') : (isHe ? 'שמור' : 'Save')}
                  </button>
                  <button className="n-btn n-ghost" disabled={!activeApproach || !holdText.trim()}
                    onClick={() => (window as any).openWriteSummary?.()}>{isHe ? 'נתח' : 'Analyse'}</button>
                  <button className="n-btn n-solid" disabled={!activeApproach || !holdText.trim()}
                    onClick={() => handleEnterConversation(holdTheorist)}>{isHe ? 'המשך לשיחה' : 'Continue'}</button>
                </div>
                {/* Ephemerality — stated as a value, not read as a failure. Content is never
                    persisted server-side by design (MEMORY.md, "תוכן שיחות לא נשמר בשרת").
                    Left unsaid it reads as "my history got deleted"; PDF is the only keeping.
                    <bdi> isolates the Latin run so the bidi algorithm can't break the RTL line. */}
                <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-rubik), sans-serif', margin: 0, textAlign: isHe ? 'right' : 'left', lineHeight: 1.7 }}>
                  {isHe
                    ? <>מה שנכתב כאן לא נשמר אצלנו. &quot;שמור&quot; מחזיק אותו בדפדפן הזה בלבד, ואפשר למצוא אותו ב&quot;מה כתבתי&quot; לכמה ימים, עד שהדפדפן מנקה. אם משהו חשוב לך לאורך זמן, אפשר להוריד קובץ (<bdi>PDF</bdi>) ולשמור אותו אצלך.</>
                    : <>Nothing written here is kept by us. &quot;Save&quot; holds it in this browser only, and you&apos;ll find it under &quot;What I wrote&quot; for a few days, until the browser clears it. If something matters for longer, download it as a <bdi>PDF</bdi>.</>}
                </p>
                {holdSaveStatus === 'saved' && (
                  <p style={{ fontSize: 16, color: 'var(--muted)', fontFamily: 'var(--font-assistant), sans-serif', margin: 0 }}>{isHe ? 'נשמר.' : 'Saved.'}</p>
                )}
              </div>
              )}
              {/* BW-113 — therapist case-first landing: "My Cases". Hidden during step-1 auto-entry to land on the writing page. */}
              {activePersona === 'therapist' && !researchPicking && therapistView === 'cases' && therapistReady && (
              <div className="n-wrap">
                {/* מסך המקרים · מבנה העיצוב החדש, 28.08 */}
                <div className="n-topbar">
                  <span>{isHe ? 'המקרים שלי' : 'My cases'}</span>
                  <span>{new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <div className="n-hr" />
                <h1 className="n-h">{isHe ? 'על מה נעבוד היום?' : 'What are we working on today?'}</h1>

                {cases.length === 0 ? (
                  <div className="n-empty">
                    <div className="n-t">{isHe ? 'עדיין אין מקרים' : 'No cases yet'}</div>
                    <div className="n-d">{isHe ? 'מקרה הוא תווית שמארגנת התייעצויות. אפשר לפתוח את הראשון עכשיו, ואפשר גם למחוק אותו אחר כך.' : 'A case is a label that organizes consultations. You can open the first one now, and delete it later.'}</div>
                    <button className="n-btn n-solid" onClick={() => setShowNewCase(true)}>{isHe ? 'פתיחת מקרה ראשון' : 'Open first case'}</button>
                  </div>
                ) : (
                  <div>
                    {cases.map(c => (
                      <div key={c.id} className="n-card" onClick={() => renamingCaseId !== c.id ? openCase(c) : undefined}>
                        <button className="n-more" aria-label={isHe ? 'עוד' : 'More'}
                          onClick={e => { e.stopPropagation(); setOpenMenuCaseId(id => id === c.id ? null : c.id); }}>⋯</button>
                        {openMenuCaseId === c.id && (<>
                          {/* שכבת הסגירה חייבת לשבת מתחת לתפריט. ב-99 היא ישבה מעליו
                              (התפריט הוא 40), ולכן כל לחיצה אמיתית פגעה בה וסגרה את
                              התפריט במקום להפעיל את הפריט. לחיצה תכנותית עקפה את זה
                              ולכן הבדיקה הראשונה לא תפסה את הכשל. */}
                          <div onClick={e => { e.stopPropagation(); setOpenMenuCaseId(null); }} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
                          <div className="n-cardmenu n-open" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setRenamingCaseId(c.id); setRenamingLabel(c.label); setOpenMenuCaseId(null); }}>{isHe ? 'שינוי שם' : 'Rename'}</button>
                            <button onClick={() => { archiveCase(c.id, true).then(() => setCasesLoaded(false)); setOpenMenuCaseId(null); }}>{isHe ? 'העברה לארכיון' : 'Archive'}</button>
                            <button onClick={() => { setOpenMenuCaseId(null); deleteCaseById(c.id, c.label); }}>{isHe ? 'מחיקת המקרה' : 'Delete case'}</button>
                          </div>
                        </>)}
                        {renamingCaseId === c.id ? (
                          <input className="n-rename" autoFocus value={renamingLabel} onClick={e => e.stopPropagation()}
                            onBlur={() => renameCase(c.id, renamingLabel)}
                            onChange={e => setRenamingLabel(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') renameCase(c.id, renamingLabel); if (e.key === 'Escape') setRenamingCaseId(null); }} />
                        ) : (
                          <div className="n-t">{c.label}</div>
                        )}
                        <div className="n-m">{new Date(c.created_at).toLocaleDateString(isHe ? 'he-IL' : 'en-US', { month: 'long', day: 'numeric' })}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* בקובץ העיצוב יש כאן פעולה אחת בלבד. "התייעצות חדשה" פתח את
                    מסך ה-hub הישן, שאינו חלק מהעיצוב, והוסר בהכרעת איה 29.08. */}
                <div className="n-actions">
                  <button className="n-btn n-ghost" onClick={() => { setNewCaseLabel(''); setShowNewCase(true); }}>{isHe ? 'מקרה חדש' : 'New case'}</button>
                  <span className="n-sp" />
                </div>
                <div className="n-botbar">{isHe ? 'הערות רפלקציה, לא רשומה קלינית. התוויות הן כינויים, וההתייעצויות מאונמזות לפני שמירה.' : 'Reflection notes, not a clinical record. Labels are pseudonyms; consultations are anonymized before saving.'}</div>
              </div>
              )}
              {/* BW-113 — case detail: consultation timeline. */}
              {activePersona === 'therapist' && !researchPicking && therapistView === 'caseDetail' && selectedCase && (
              <div className="n-wrap">
                {/* בר עליון וקו שחור · מהעיצוב החדש, 28.08 */}
                <div className="n-topbar">
                  <span>{selectedCase?.label}</span>
                  <span>{new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <div className="n-hr"></div>
                <h1 className="n-h">{isHe ? 'מה עלה לך מהפגישה?' : 'What came up in the session?'}</h1>
                {/* BW-116 — daily update section */}
                {/* ── לוח דו־אזורי · הזרימה שאושרה 28.08 ──────────────────────
                    הגישה נבחרת למעלה, לפני הכתיבה, והכתיבה נעולה עד שנבחרה.
                    קודם הצ׳יפים הופיעו מתחת לטקסט, כלומר הבחירה נעשתה אחרי
                    שכבר נכתב, והניתוח היה נגזר מקול שנבחר בדיעבד. */}
                {(() => {
                  const HUB_THEORISTS: [string, string][] = [['freud', isHe ? 'פרויד' : 'Freud'], ['klein', isHe ? 'קליין' : 'Klein'], ['winnicott', isHe ? 'ויניקוט' : 'Winnicott'], ['ogden', isHe ? 'אוגדן' : 'Ogden']];
                  const picked = hubTheorists.length >= 1;
                  const isRoundtable = hubTheorists.length >= 2;
                  const chipStyle = (on: boolean): React.CSSProperties => ({
                    border: '1px solid ' + (on ? 'var(--accent-deep)' : 'var(--border)'),
                    borderRadius: 'var(--radius-sm)', padding: '0 14px', height: 44,
                    display: 'inline-flex', alignItems: 'center',
                    fontSize: 'var(--fs-body-md)', fontWeight: on ? 600 : 500, cursor: 'pointer',
                    color: on ? '#fff' : 'var(--text)', background: on ? 'var(--accent-deep)' : 'transparent',
                  });
                  const openRoundtableMockup = () => {
                    document.getElementById('bw-rt-mockup')?.remove();
                    const ov = document.createElement('div');
                    ov.id = 'bw-rt-mockup';
                    ov.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(17,17,17,0.55);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
                    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
                    ov.innerHTML = '<div style="position:relative;width:640px;max-width:94vw;height:88vh;background:var(--bg);border-radius:var(--radius-lg);overflow:hidden;box-shadow:0 16px 48px rgba(17,17,17,0.18);">'
                      + '<button onclick="document.getElementById(\'bw-rt-mockup\').remove()" style="position:absolute;top:8px;left:12px;z-index:2;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);width:32px;height:32px;font-size:17px;color:var(--muted);cursor:pointer;line-height:1;">×</button>'
                      + '<iframe src="/roundtable-mockup.html" style="width:100%;height:100%;border:none;"></iframe>'
                      + '</div>';
                    document.body.appendChild(ov);
                  };
                  return (
                  <>
                    <div className={`n-plate${picked ? '' : ' n-locked'}`} style={{ marginBottom: 16 }}>
                      {/* אזור 1 · בחירת הגישה, פעיל תמיד */}
                      <div className="n-zone-head">
                        <span className="n-lbl">{isHe ? 'דרך הגישה של' : 'Through the approach of'}</span>
                        <button className={`n-sel${picked ? '' : ' n-primed'}`} aria-haspopup="listbox" aria-expanded={selOpen}
                          onClick={() => setSelOpen(v => !v)}>
                          {picked
                            ? <span>{HUB_THEORISTS.find(([k]) => k === hubTheorists[0])?.[1]}{' '}<span className="n-sub">{THEORIST_DESC[hubTheorists[0]]}</span></span>
                            : <span>{isHe ? 'בחרי גישה' : 'Choose an approach'}</span>}
                          <span className={`n-chev${selOpen ? ' n-open' : ''}`}>⌄</span>
                        </button>
                        {!picked && <span className="n-hintstart"><span>{isHe ? '\u2192' : '\u2190'}</span>{isHe ? 'מתחילים כאן' : 'Start here'}</span>}
                        {isRoundtable &&<span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--muted)' }}>{isHe ? `נבחרו ${hubTheorists.length}, שולחן עגול` : `${hubTheorists.length} selected, round table`}</span>}
                        <div className={`n-menu${selOpen ? ' n-open' : ''}`} role="listbox" aria-label={isHe ? 'בחירת גישה' : 'Choose an approach'}>
                          {HUB_THEORISTS.map(([k, name]) => (
                            <button key={k} className="n-mi" role="option" aria-selected={hubTheorists.includes(k)}
                              onClick={() => { setHubTheorists([k]); setSelOpen(false); }}>
                              <span className="n-nm">{name}</span>
                              <span className="n-ds">{THEORIST_DESC[k]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* אזור 2 · הכתיבה, האזור היחיד שמשנה מצב */}
                      <div className="n-zone-write" style={{ position: 'relative' }}>
                        <textarea
                          value={dailyText}
                          disabled={!picked}
                          onChange={e => setDailyText(e.target.value)}
                          placeholder={picked ? (isHe ? 'בלי לסדר את זה קודם.' : 'No need to tidy it first.') : (isHe ? 'בחרי גישה כדי להתחיל לכתוב.' : 'Choose an approach to start writing.')}
                          style={{ width: '100%', minHeight: 220, maxHeight: '50vh', overflowY: 'auto', boxSizing: 'border-box', border: 'none', padding: '0 0 44px', fontSize: 16, fontWeight: 300, lineHeight: 1.85, fontFamily: 'var(--font-rubik), sans-serif', background: 'transparent', color: picked ? 'var(--text)' : 'var(--off)', caretColor: 'var(--accent)', resize: 'vertical', outline: 'none', display: 'block' }}
                        />
                        {picked && (
                          <button
                            onClick={handleDailyVoice}
                            className={`bw-mic${isDailyRecording ? ' bw-mic-recording' : ''}`}
                            aria-pressed={isDailyRecording}
                            title={isDailyRecording ? (isHe ? 'עצור הקלטה' : 'Stop recording') : (isHe ? 'הקלט קול' : 'Record voice')}
                          >
                            <Mic size={15} />
                          </button>
                        )}
                        {!picked && (
                          <div className="n-locknote">{isHe ? 'שדה הכתיבה נפתח אחרי בחירת הגישה, כי הניתוח והשיחה נעשים מתוכה.' : 'Writing opens once an approach is chosen. The analysis and the talk come from it.'}</div>
                        )}
                      </div>
                    </div>
                    {/* שלוש הפעולות · מתחת ללוח, כמו בקובץ העיצוב:
                        שמור · נתח · המשך לשיחה. "שמור" חסר עד כה, ו-saveDailyUpdate
                        היה קיים במלואו בלי שאף כפתור קרא לו. */}
                    <div className="n-actions">
                      <span className="n-sp" />
                      <button
                        disabled={!picked || !dailyText.trim() || !selectedCase}
                        onClick={saveDailyUpdate}
                        className="n-btn n-ghost">
                        {isHe ? 'שמור' : 'Save'}
                      </button>
                      {!isRoundtable && (
                        <button
                          disabled={!picked || !dailyText.trim() || analyzingNoteId === 'draft'}
                          onClick={() => analyzeNote(dailyText, 'draft')}
                          className="n-btn n-ghost">
                          {isHe ? 'נתח' : 'Analyze'}
                        </button>
                      )}
                      <button
                        disabled={!picked || !dailyText.trim()}
                        onClick={isRoundtable ? openRoundtableMockup : () => startConsultation(dailyText)}
                        className="n-btn n-solid">
                        {isRoundtable ? (isHe ? 'שולחן עגול' : 'Round table') : (isHe ? 'המשך לשיחה' : 'Continue to talk')}
                      </button>
                    </div>
                    {/* הפוטר · קיים בקובץ העיצוב ולא היה במסך הזה */}
                    <div className="n-botbar">{isHe ? 'הערות רפלקציה, לא רשומה קלינית.' : 'Reflection notes, not a clinical record.'}</div>
                  </>
                  );
                })()}
                {/* BW-116 — past updates from localStorage.
                    REMOVED FROM THE UI (Aya, 22.08): an archive of clinical writing contradicts the
                    ephemeral promise. The reading/writing code and the localStorage keys are left
                    intact — flip `false` back to `caseUpdates.length > 0` to restore. Existing
                    entries on a device are not deleted, only no longer shown. */}
                {false && caseUpdates.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{isHe ? 'עדכונים קודמים' : 'Past updates'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {caseUpdates.map(u => (
                        <div key={u.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px' }}>
                          {editingDailyId === u.id ? (
                            <>
                              <textarea autoFocus value={editingDailyText} onChange={e => setEditingDailyText(e.target.value)}
                                style={{ width: '100%', minHeight: 80, boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 16, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical' }} />
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button onClick={() => setEditingDailyId(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 14px', fontSize: 15, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--muted)', cursor: 'pointer' }}>{isHe ? 'ביטול' : 'Cancel'}</button>
                                <button onClick={() => saveDailyEdit(u.id)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 15, fontFamily: 'var(--font-rubik), sans-serif', color: '#fff', cursor: 'pointer' }}>{isHe ? 'שמור' : 'Save'}</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, color: 'var(--muted)', flex: 1 }}>{new Date(u.created_at).toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span onClick={() => { setEditingDailyId(u.id); setEditingDailyText(u.text); }} style={{ fontSize: 16, color: 'var(--muted)', cursor: 'pointer', opacity: 0.6, marginInlineEnd: 10 }} title={isHe ? 'ערוך' : 'Edit'}>✎</span>
                                <span onClick={() => deleteCaseUpdate(u.id)} style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer', opacity: 0.6 }} title={isHe ? 'מחק' : 'Delete'}>✕</span>
                              </div>
                              <div style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.6 }}>{u.text}</div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                                <button
                                  disabled={analyzingNoteId === u.id}
                                  onClick={() => analyzeNote(u.text, u.id)}
                                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 14px', fontSize: 15, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--accent)', cursor: 'pointer' }}>
                                  {isHe ? 'נתח' : 'Analyze'}
                                </button>
                                <button
                                  onClick={() => consultFromText(u.text)}
                                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 14px', fontSize: 15, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--accent)', cursor: 'pointer' }}>
                                  {isHe ? 'התייעץ' : 'Consult'}
                                </button>
                              </div>
                              {renderNoteAnalysis(u.id)}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* בהחלטת איה 21.08 — הזיכרון יורד מהממשק של המטפל/ת. הקוד נשאר, הפיצ'ר עתידי.
                    הכלל המנחה: מסך הכתיבה מציג את מה שנכתב עכשיו, לא היסטוריה.
                    להחזרה — לשנות false ל-consultations.length > 0 בשני הבלוקים. */}
                {false && consultations.length > 0 && (
                  <div className="sb-item" onClick={() => setConsultsOpen(o => !o)}
                    style={{ alignSelf: 'flex-start', padding: '6px 0', cursor: 'pointer', background: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {isHe ? `התייעצויות קודמות · ${consultations.length}` : `Previous consultations · ${consultations.length}`}
                    </span>
                    <ChevronDown size={12} strokeWidth={1.75} style={{ color: 'var(--muted)', transition: 'transform 0.2s', transform: consultsOpen ? 'rotate(180deg)' : 'none' }} />
                  </div>
                )}
                {false && consultations.length > 0 && consultsOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {consultations.map(co => {
                      const modeLabel = co.mode === 'roundtable' ? (isHe ? 'שולחן עגול' : 'Round table') : co.mode === 'research' ? (isHe ? 'מחקר' : 'Research') : co.mode === 'note' ? (isHe ? 'עדכון ידני' : 'Manual note') : (isHe ? 'התייעצות' : 'Consultation');
                      return (
                        <div key={co.id}
                          onClick={() => setExpandedConsultId(id => id === co.id ? null : co.id)}
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 18px', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 13, padding: '3px 10px', borderRadius: 6, background: 'var(--accent-soft, rgba(196,96,122,0.07))', color: 'var(--accent)', border: '1px solid var(--border)' }}>{modeLabel}</span>
                            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{(co.theorists || []).join(' · ')}</span>
                            <span style={{ fontSize: 13, color: 'var(--muted)', marginInlineStart: 'auto' }}>{new Date(co.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span onClick={e => { e.stopPropagation(); deleteConsultation(co.id); }} style={{ fontSize: 16, color: 'var(--muted)', cursor: 'pointer', opacity: 0.5, lineHeight: 1 }} title={isHe ? 'מחק' : 'Delete'}>✕</span>
                          </div>
                          <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6, opacity: 0.85, whiteSpace: expandedConsultId === co.id ? 'pre-wrap' : 'normal' }}>
                            {expandedConsultId === co.id
                              ? co.anonymized_text
                              : <>{co.anonymized_text.slice(0, 160)}{co.anonymized_text.length > 160 ? <span style={{ color: 'var(--accent)' }}> קרא עוד</span> : ''}</>
                            }
                          </div>
                          {co.mode === 'note' && expandedConsultId === co.id && (
                            <span onClick={e => { e.stopPropagation(); openEditNote(co); }} style={{ display: 'inline-block', marginTop: 8, fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}>{isHe ? 'ערוך' : 'Edit'}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
              {/* BW-113 — therapist archive: archived cases (patients), with restore. */}
              {activePersona === 'therapist' && !researchPicking && therapistView === 'archive' && (
              /* המסך היחיד שנשאר במבנה הישן: h2 בסגנון שורה, פונט רוביק, ורשת
                 שתי עמודות. עכשיו הוא בשפת המסך של הקובץ, כמו כל השאר:
                 בר עליון, קו שחור, כותרת h1, כרטיסים, ופוטר. */
              <div className="n-wrap">
                <div className="n-topbar">
                  <span>{isHe ? 'ארכיון' : 'Archive'}</span>
                  <span>{new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit' })}</span>
                </div>
                <div className="n-hr" />
                <h1 className="n-h">{isHe ? 'מקרים שנסגרו' : 'Closed cases'}</h1>

                {archivedCases.length === 0 ? (
                  <div className="n-empty">
                    <div className="n-t">{isHe ? 'אין מקרים בארכיון' : 'No archived cases'}</div>
                    <div className="n-d">{isHe
                      ? 'מקרה שמועבר לארכיון יופיע כאן, ואפשר להחזיר אותו לרשימה בכל רגע.'
                      : 'A case you archive appears here, and can be restored to the list at any time.'}</div>
                  </div>
                ) : (
                  archivedCases.map(c => (
                    /* בלי n-archived · המחלקה מוסיפה "· בארכיון" אחרי הכותרת,
                       וזה מיותר במסך שכולו ארכיון, וגם קבוע בעברית */
                    <div key={c.id} className="n-card">
                      <div className="n-t">{c.label}</div>
                      <div className="n-m">
                        <button className="n-btn n-plain n-sm" style={{ marginTop: 10 }}
                          onClick={async () => { await archiveCase(c.id, false); setArchivedLoaded(false); setCasesLoaded(false); }}>
                          {isHe ? 'שחזור' : 'Restore'}
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className="n-actions">
                  <span className="n-sp" />
                  <button className="n-btn n-ghost" onClick={() => { setTherapistView('cases'); setCasesLoaded(false); }}>
                    {isHe ? 'המקרים שלי' : 'My cases'}
                  </button>
                </div>
                <div className="n-botbar">{isHe
                  ? 'הערות רפלקציה, לא רשומה קלינית. התוויות הן כינויים, וההתייעצויות מאונמזות לפני שמירה.'
                  : 'Reflection notes, not a clinical record. Labels are nicknames, and consultations are anonymised before saving.'}</div>
              </div>
              )}
              {/* BW-112 — Therapist hub: mode selection. Reached from a case ("New consultation"). */}
              {activePersona === 'therapist' && !researchPicking && therapistView === 'hub' && (() => {
                const HUB_THEORISTS: [string, string][] = [['freud', isHe ? 'פרויד' : 'Freud'], ['klein', isHe ? 'קליין' : 'Klein'], ['winnicott', isHe ? 'ויניקוט' : 'Winnicott'], ['ogden', isHe ? 'אוגדן' : 'Ogden']];
                const chipStyle = (on: boolean): React.CSSProperties => ({
                  border: '1px solid ' + (on ? 'var(--accent-deep)' : 'var(--border)'),
                  borderRadius: 6, padding: '7px 16px', fontSize: 16, cursor: 'pointer',
                  color: on ? '#fff' : 'var(--text)', background: on ? 'var(--accent)' : 'var(--surface)',
                });
                return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <button onClick={() => setTherapistView(selectedCase ? 'caseDetail' : 'cases')} style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', fontSize: 16, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--text)', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: 'var(--accent)' }}>←</span>{selectedCase ? selectedCase.label : (isHe ? 'המקרים שלי' : 'My cases')}</button>
                  <p style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 'var(--fs-heading-lg)', fontWeight: 400, color: 'var(--text)', margin: '0 0 16px' }}>{isHe ? 'נחשוב על זה יחד.' : "Let's think this through together."}</p>
                  {/* הערת ליה: "(יאונמז לפני שמירה)" ישבה בתוך הפתיח, כלומר הודעה משפטית
                      בתוך מחווה של הזמנה לכתוב, ומי שקוראת אותה עוברת מקשב לזהירות באותה
                      שורה. ההערה ירדה לשורה שקטה מתחת לשדה. היא לא רוככה ולא הוסתרה.
                      הגובה עלה מ-90 ל-200: זה היה השדה הקטן ביותר מבין שלושת מסכי הכתיבה
                      ודווקא הוא מיועד לחומר הקליני הארוך ביותר (מדידת מאיה). */}
                  <textarea value={consultText} onChange={e => setConsultText(e.target.value)} placeholder={isHe ? 'מה שעלה בפגישה, כמו שעלה.' : 'What came up in the session, as it came up.'} style={{ width: '100%', maxWidth: 560, minHeight: 200, boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', fontSize: 16, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical', marginBottom: 'var(--space-sm)' }} />
                  <div style={{ maxWidth: 560, width: '100%', fontSize: 'var(--fs-caption)', color: 'var(--muted)', marginBottom: 'var(--space-lg)', textAlign: isHe ? 'right' : 'left' }}>
                    {isHe ? 'החומר עובר אנונימיזציה לפני שמירה.' : 'The material is anonymized before saving.'}
                  </div>
                  <div className="hub-helpcap">{isHe ? <>מאיזו גישה?<br/>אחד לעומק, או כמה יחד לשולחן עגול.</> : <>From which approach?<br/>One in depth, or several at a round table.</>}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20, maxWidth: 560 }}>
                    {HUB_THEORISTS.map(([k, name]) => {
                      const on = hubTheorists.includes(k);
                      return <span key={k} onClick={() => setHubTheorists(on ? hubTheorists.filter(x => x !== k) : [...hubTheorists, k])} style={chipStyle(on)}>{name}{on ? ' ✓' : ''}</span>;
                    })}
                  </div>
                  {hubTheorists.length > 0 && (
                    <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>{hubTheorists.length === 1 ? (isHe ? 'נבחר אחד, התייעצות ממוקדת.' : 'One selected, focused consultation.') : (isHe ? `נבחרו ${hubTheorists.length} — שולחן עגול.` : `${hubTheorists.length} selected — round table.`)}</div>
                  )}
                  {hubTheorists.length >= 1 && (() => {
                    const isRoundtable = hubTheorists.length >= 2;
                    const label = isRoundtable ? (isHe ? 'שולחן עגול' : 'Round table') : (isHe ? 'המשך להתייעצות' : 'Continue to consultation');
                    // Round table is a visual demo only — clicking opens the mockup overlay (no backend).
                    const openRoundtableMockup = () => {
                      document.getElementById('bw-rt-mockup')?.remove();
                      const ov = document.createElement('div');
                      ov.id = 'bw-rt-mockup';
                      ov.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(45,36,32,0.55);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
                      ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
                      ov.innerHTML = '<div style="position:relative;width:640px;max-width:94vw;height:88vh;background:var(--bg);border-radius:16px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.22);">'
                        + '<button onclick="document.getElementById(\'bw-rt-mockup\').remove()" style="position:absolute;top:8px;left:12px;z-index:2;background:var(--surface);border:1px solid var(--border);border-radius:50%;width:30px;height:30px;font-size:17px;color:var(--muted);cursor:pointer;line-height:1;">×</button>'
                        + '<iframe src="/roundtable-mockup.html" style="width:100%;height:100%;border:none;"></iframe>'
                        + '</div>';
                      document.body.appendChild(ov);
                    };
                    return (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                        <button
                          onClick={isRoundtable ? openRoundtableMockup : () => startConsultation()}
                          style={{ padding: '10px 28px', borderRadius: 6, border: 'none', fontSize: 16, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
                          {label}
                        </button>
                      </div>
                    );
                  })()}
                </div>
                );
              })()}


              {/* flow buttons injected here by renderFlowButtons() */}
              <p id="welcome-api-text" style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0, marginTop: 'auto', paddingTop: 52 }}>
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
              <h2 style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 26, fontWeight: 300, color: '#7a5080', margin: 0 }}>⚲ פיקוח קליני</h2>
              <span onClick={() => (window as any).closeSupervision()} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</span>
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <button id="sup-tab-active" className="sup-tab active" onClick={() => (window as any).switchSupervisionTab('active')}>שיחה פעילה</button>
              <button id="sup-tab-paste" className="sup-tab" onClick={() => (window as any).switchSupervisionTab('paste')}>הדבק שיחה</button>
            </div>

            {/* Active conversation mode */}
            <div id="sup-mode-active">
              <div id="sup-active-info" style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.8, padding: '10px 14px', background: 'rgba(91,58,94,0.05)', borderRadius: 6, marginBottom: 4 }}>
                אין שיחה פעילה
              </div>
            </div>

            {/* Paste mode */}
            <div id="sup-mode-paste" style={{ display: 'none' }}>
              <select id="sup-theorist-select" style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)', fontSize: 16, marginBottom: 10, direction: 'rtl' }}>
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
                style={{ width: '100%', minHeight: 150, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)', fontSize: 15, resize: 'vertical', direction: 'rtl', lineHeight: 1.7, boxSizing: 'border-box', fontFamily: 'var(--font-rubik), sans-serif' }}></textarea>
            </div>

            <button id="sup-run-btn" onClick={() => (window as any).runSupervisionPanel()}
              style={{ width: '100%', padding: '10px', background: '#5b3a5e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, marginTop: 14, transition: 'opacity 0.2s', fontFamily: 'var(--font-rubik), sans-serif' }}>
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
            <div id="file-indicator" style={{ display: 'none', background: 'rgba(196,96,122,0.06)', border: '1px solid var(--accent-dim)', borderRadius: 6, padding: '8px 14px', marginBottom: 8, alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--accent)' }}>
              <span>📄</span>
              <span id="file-name" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}></span>
              <span onClick={() => (window as any).removeFile()} style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 16, padding: '0 4px' }} title="הסר קובץ">✕</span>
            </div>
            {/* תיבת הכתיבה · מהעיצוב החדש: מלבן לבן בלבד, בלי פקדים בתוכו.
                הפעולות ירדו לשורה מתחתיו, שם הן נקראות כפעולות ולא כקישוט של השדה. */}
            <div className="input-wrap">
              <input type="file" id="file-upload" accept=".txt,.pdf,.md,.doc,.docx,.rtf" style={{ display: 'none' }}
                onChange={(e) => (window as any).handleFileUpload(e.nativeEvent)} />
              <textarea id="user-input" placeholder={isHe ? 'להמשיך לכתוב…' : 'Keep writing…'} rows={1}
                onKeyDown={(e) => (window as any).handleKey(e.nativeEvent)}
                onInput={(e) => (window as any).autoResize(e.currentTarget)}></textarea>
            </div>
            <div id="suggestion-bubbles" suppressHydrationWarning></div>
            {/* שורת הפעולות של השיחה · מהעיצוב החדש. הכלים שישבו בכותרת ירדו לכאן,
                כי הם נוגעים לשיחה הנוכחית בלבד. הצד השקט משמאל, הפעולה הראשית בקצה. */}
            <div className="n-actions" id="bw-talk-actions">
              <button className="n-btn n-plain n-sm" onClick={() => document.getElementById('file-upload')?.click()}
                title={isHe ? 'העלאת מסמך' : 'Upload document'}>{isHe ? 'צרף מסמך' : 'Attach'}</button>
              <button className="n-btn n-plain n-sm" id="bw-session-pdf" onClick={() => (window as any).exportPDF?.()}>{isHe ? 'הורד PDF' : 'Download PDF'}</button>
              {activePersona === 'therapist' && (
                <button className="n-btn n-plain n-sm" onClick={openSummary}>{isHe ? 'סיכום התייעצות' : 'Consultation summary'}</button>
              )}
              {activePersona === 'patient' && (
                <button className="n-btn n-plain n-sm" id="patient-reflection-btn" style={{ display: 'none' }}
                  onClick={() => (window as any).openPatientReflection?.()}>{isHe ? 'מה לקחתי' : 'What I took'}</button>
              )}
              <span className="n-sp" />
              <button className="n-btn n-ghost" onClick={() => (window as any).bwExitChatToHome?.()}>{isHe ? 'חזרה לכתיבה' : 'Back to writing'}</button>
              <button className="n-btn n-solid" id="send-btn" onClick={() => (window as any).sendMessage()}>{isHe ? 'שלח' : 'Send'}</button>
            </div>
            <div className="n-botbar" id="input-disclaimer">
              {isHe
                ? 'השיחה חיה בדפדפן הזה בלבד ואינה נשמרת בשרת. ה-PDF הוא הדרך היחידה לשמור אותה.'
                : 'This conversation lives in this browser only and is not stored on a server. The PDF is the only way to keep it.'}
            </div>
            <div className="hint" id="input-hint" style={{ display: 'none' }}>Enter לשליחה · Shift+Enter לשורה חדשה</div>
          </div>
        </div>

        {/* ═══ מודל: מקרה חדש ═══
            מבנה הקובץ אחד לאחד: כותרת, שורת פתיח, שדה עם תווית, קופסת
            האזהרה על פסבדונים, וסרגל פעולות תחתון. עד כה זו הייתה שורת
            קלט מוטבעת במסך, וזה לא מה שעוצב. */}
        {showNewCase && (
          <div className="n-ovl n-open" onClick={e => { if (e.target === e.currentTarget) setShowNewCase(false); }}>
            <div className="n-modal" style={{ width: 520 }}>
              <h3>{isHe ? 'מקרה חדש' : 'New case'}</h3>
              <p className="n-lead">{isHe
                ? 'מקרה הוא תווית שמארגנת התייעצויות. אין בו שדות נוספים, ואין בו תיק.'
                : 'A case is a label that organizes consultations. It has no other fields and no file.'}</p>
              <div className="n-fieldrow">
                <label htmlFor="nc-label">{isHe ? 'תווית למקרה' : 'Case label'}</label>
                <input className="n-inp" id="nc-label" autoFocus autoComplete="off" value={newCaseLabel}
                  onChange={e => setNewCaseLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && newCaseLabel.trim()) createCase(newCaseLabel); if (e.key === 'Escape') setShowNewCase(false); }}
                  placeholder={isHe ? 'למשל: מקרה ו׳' : 'e.g. Case F'} />
                <div className="n-bound">
                  <div className="n-t">{isHe ? 'פסבדונים, לא שם אמיתי' : 'A pseudonym, not a real name'}</div>
                  <div className="n-d">{isHe
                    ? 'אלה הערות רפלקציה ולא רשומה קלינית. אל תכתבי כאן שם, ראשי תיבות או פרט מזהה. ההתייעצויות עצמן מאונמזות לפני שמירה.'
                    : 'These are reflection notes, not a clinical record. Do not write a name, initials or any identifying detail. Consultations are anonymized before saving.'}</div>
                </div>
              </div>
              <div className="n-foot">
                <button className="n-btn n-ghost" onClick={() => setShowNewCase(false)}>{isHe ? 'ביטול' : 'Cancel'}</button>
                <button className="n-btn n-solid" disabled={!newCaseLabel.trim()} onClick={() => createCase(newCaseLabel)}>{isHe ? 'צור' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ מודל: שיתוף עם המטפל/ת ═══ */}
        {shareOpen && (
          <div className="n-ovl n-open" onClick={e => { if (e.target === e.currentTarget) setShareOpen(false); }}>
            <div className="n-modal n-share" style={{ width: 640 }}>
              <h3>{isHe ? 'שיתוף עם המטפל/ת' : 'Share with your therapist'}</h3>
              <p className="n-lead">{isHe
                ? 'זה בדיוק מה שיישלח. מה שסימנת כפרטי לא נכלל, ומופיע כאן כחסימה כדי שתראי איפה הוא היה.'
                : 'This is exactly what will be sent. What you marked private is left out, and shown here as a block so you can see where it was.'}</p>
              <div className="n-prev" dangerouslySetInnerHTML={{ __html: buildShareHtml() }} />
              <div className="n-fieldrow" style={{ marginTop: 'var(--s5)' }}>
                <label htmlFor="share-mail">{isHe ? 'המייל של המטפל/ת' : "Therapist's email"}</label>
                <input className="n-inp" id="share-mail" type="email" value={shareEmail}
                  onChange={e => { setShareEmail(e.target.value); setShareState(''); }}
                  placeholder={isHe ? 'name@example.com' : 'name@example.com'} />
              </div>
              {!!noteAnalysis['draft'] && (
                <div className="n-opt" style={{ marginTop: 'var(--s5)' }}>
                  <input type="checkbox" id="share-analysis" checked={shareWithAnalysis} onChange={e => setShareWithAnalysis(e.target.checked)} />
                  <div>
                    <div className="n-t">{isHe ? 'לצרף גם את הניתוח' : 'Attach the analysis too'}</div>
                    <div className="n-d">{isHe
                      ? 'הניתוח נכתב דרך הגישה שבחרת. הוא מתייחס למה שכתבת, כולל לקטעים שסימנת כפרטיים.'
                      : 'The analysis was written through the approach you chose. It refers to what you wrote, including the parts you marked private.'}</div>
                  </div>
                </div>
              )}
              {shareState === 'error' && <p className="n-note" style={{ color: 'var(--accent-deep)', fontWeight: 600 }}>{isHe ? 'השליחה נכשלה. אפשר לנסות שוב.' : 'Sending failed. You can try again.'}</p>}
              {shareState === 'sent' && <p className="n-note" style={{ fontWeight: 600 }}>{isHe ? 'נשלח.' : 'Sent.'}</p>}
              <div className="n-foot">
                <button className="n-btn n-solid" disabled={!shareEmail.trim() || shareState === 'sending' || shareState === 'sent'} onClick={sendShare}>
                  {shareState === 'sending' ? (isHe ? 'שולח…' : 'Sending…') : (isHe ? 'שליחה' : 'Send')}
                </button>
                <button className="n-btn n-ghost" onClick={() => setShareOpen(false)}>{isHe ? 'סגירה' : 'Close'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ מודל: סיכום התייעצות ═══
            עשרת השדות הם בדיוק אלה ש-lib/summary-prompt.ts מחזיר. */}
        {summaryOpen && (
          <div className="n-ovl n-open" onClick={e => { if (e.target === e.currentTarget) setSummaryOpen(false); }}>
            <div className="n-modal n-sum" style={{ width: 660 }}>
              <h3>{isHe ? 'סיכום התייעצות' : 'Consultation summary'}</h3>
              {summaryState === 'loading' && <p className="n-lead">{isHe ? 'קורא את השיחה…' : 'Reading the conversation…'}</p>}
              {summaryState === 'error' && <p className="n-lead">{isHe ? 'לא הצלחנו להפיק סיכום. צריך שיחה עם כמה תורות.' : 'Could not produce a summary. A conversation with a few turns is needed.'}</p>}
              {summaryData && (<>
                <p className="n-lead">
                  {selectedCase ? selectedCase.label + ' · ' : ''}
                  {new Date().toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: '2-digit', month: '2-digit' })}
                  {summaryData.theorist ? ' · ' + (isHe ? 'דרך הגישה של ' : 'through the approach of ') : ''}
                  {summaryData.theorist ? <b>{summaryData.theorist}</b> : null}
                </p>
                <div className="n-meta">
                  {summaryData.session_length && <span className="n-chip">{summaryData.session_length}</span>}
                  {(summaryData.themes || []).map((t, i) => <span key={i} className="n-chip n-n">{t}</span>)}
                </div>
                {summaryData.theorist_approach && (
                  <div className="n-sec"><h4>{isHe ? 'מה אפיין את הגישה' : 'What characterized the approach'}</h4><p>{summaryData.theorist_approach}</p></div>
                )}
                {!!(summaryData.key_moments || []).length && (
                  <div className="n-sec">
                    <h4>{isHe ? 'רגעים מרכזיים' : 'Key moments'}</h4>
                    {(summaryData.key_moments || []).map((m, i) => (
                      <div className="n-moment" key={i}>
                        <p className="n-quote">{m.patient_quote}</p>
                        <p className="n-why">{m.clinical_significance}</p>
                      </div>
                    ))}
                  </div>
                )}
                {summaryData.what_opened && <div className="n-sec"><h4>{isHe ? 'מה נפתח' : 'What opened'}</h4><p>{summaryData.what_opened}</p></div>}
                {summaryData.what_remained && <div className="n-sec"><h4>{isHe ? 'מה נשאר פתוח' : 'What remained open'}</h4><p>{summaryData.what_remained}</p></div>}
                {summaryData.next_session_focus && (
                  <div className="n-bring"><h4>{isHe ? 'מה להביא לפגישה הבאה' : 'To bring to the next session'}</h4><p>{summaryData.next_session_focus}</p></div>
                )}
              </>)}
              <div className="n-foot">
                <span className="n-sp" />
                <button className="n-btn n-ghost" onClick={() => setSummaryOpen(false)}>{isHe ? 'סגירה' : 'Close'}</button>
                <button className="n-btn n-solid" disabled={!summaryData} onClick={() => (window as any).exportPDF?.()}>{isHe ? 'הורד PDF' : 'Download PDF'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ מודל: צרי קשר ═══
            השדות והמצבים נלקחו מ-/api/support ולא הומצאו. */}
        {contactOpen && (
          <div className="n-ovl n-open" onClick={e => { if (e.target === e.currentTarget) setContactOpen(false); }}>
            <div className="n-modal">
              {contactState !== 'sent' ? (<>
                <h3>{isHe ? 'צרי קשר' : 'Contact us'}</h3>
                <p className="n-lead">{isHe ? 'נשמח לשמוע. נחזור אלייך בהקדם, לכתובת שמופיעה למטה.' : "We'd love to hear from you. We'll get back to you at the address below."}</p>
                <div className="n-fieldrow">
                  <label htmlFor="c-subj">{isHe ? 'נושא' : 'Subject'}</label>
                  <input className="n-inp" id="c-subj" value={contactSubject} onChange={e => setContactSubject(e.target.value)}
                    placeholder={isHe ? 'תארי בקצרה' : 'Describe it briefly'} />
                </div>
                <div className="n-fieldrow">
                  <label htmlFor="c-msg">{isHe ? 'הודעה' : 'Message'}</label>
                  <textarea className="n-inp" id="c-msg" style={{ height: 150 }} value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)} placeholder={isHe ? 'פרטי כאן…' : 'Tell us more…'} />
                </div>
                <div className="n-fieldrow">
                  <label htmlFor="c-mail">{isHe ? 'המייל שלך' : 'Your email'}</label>
                  <input className="n-inp" id="c-mail" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                  <p className="n-note" style={{ marginTop: 8 }}>{isHe
                    ? 'נחזור לכתובת הזו. אפשר לשנות אותה כאן בלי לשנות את חשבון הכניסה.'
                    : "We'll reply to this address. You can change it here without changing your login."}</p>
                </div>
                {contactState === 'error' && <p className="n-note" style={{ color: 'var(--accent-deep)', fontWeight: 600 }}>{isHe ? 'השליחה נכשלה. אפשר לנסות שוב.' : 'Sending failed. You can try again.'}</p>}
                <div className="n-foot">
                  <button className="n-btn n-solid" disabled={!contactSubject.trim() || !contactMessage.trim() || contactState === 'sending'} onClick={sendContact}>
                    {contactState === 'sending' ? (isHe ? 'שולח…' : 'Sending…') : (isHe ? 'שליחה' : 'Send')}
                  </button>
                  <button className="n-btn n-ghost" onClick={() => setContactOpen(false)}>{isHe ? 'ביטול' : 'Cancel'}</button>
                </div>
              </>) : (<>
                <div className="n-donemark">✓</div>
                <h3>{isHe ? 'ההודעה נשלחה' : 'Message sent'}</h3>
                <p className="n-lead">{isHe ? `נחזור אלייך לכתובת ${contactEmail}. אין צורך לעשות דבר נוסף.` : `We'll get back to you at ${contactEmail}. Nothing else is needed.`}</p>
                <div className="n-foot">
                  <button className="n-btn n-ghost" onClick={() => { setContactOpen(false); setContactState(''); setContactSubject(''); setContactMessage(''); }}>{isHe ? 'סגירה' : 'Close'}</button>
                </div>
              </>)}
            </div>
          </div>
        )}

        {/* Privacy modal */}
        <div id="privacy-modal" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(45,36,32,0.4)', display: 'none', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div id="privacy-modal-inner" suppressHydrationWarning style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 32, maxWidth: 460, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', direction: currentLang === 'he' ? 'rtl' : 'ltr' }}>
            <h3 id="privacy-title" suppressHydrationWarning style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 22, fontWeight: 300, color: 'var(--accent)', marginBottom: 20, textAlign: 'center' }}>
              {(PRIVACY_I18N[currentLang] || PRIVACY_I18N['he']).title}
            </h3>

            <div id="privacy-content" suppressHydrationWarning style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.9, fontFamily: 'var(--font-rubik), sans-serif' }}>
              {(PRIVACY_I18N[currentLang] || PRIVACY_I18N['he']).paragraphs.map((p, i, arr) => (
                <p key={i} style={{ marginBottom: i === arr.length - 1 ? 20 : 12 }}>
                  <strong>{p.label}</strong>{` — ${p.text}`}
                </p>
              ))}
            </div>

            <button id="privacy-btn-ok" suppressHydrationWarning onClick={() => { const m = document.getElementById('privacy-modal'); if(m) m.style.display='none'; }}
              style={{ display: 'block', margin: '0 auto', background: 'var(--accent)', border: 'none', color: '#fff', padding: '10px 32px', borderRadius: 6, fontSize: 16, fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer' }}>
              {(PRIVACY_I18N[currentLang] || PRIVACY_I18N['he']).btnOk}
            </button>
          </div>
        </div>

        {/* Choose theorist popup */}
        <div id="choose-popup" style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(45,36,32,0.35)', display: 'none', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(196,96,122,0.12)' }}>
            <h3 style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 22, fontWeight: 300, color: '#c4607a', marginBottom: 10 }}>{gv('בחרי','בחר','בחר/י')} תיאורטיקן</h3>
            <p style={{ fontSize: 16, color: 'var(--muted, #74645e)', lineHeight: 1.8, marginBottom: 24 }}>לחצי על אחד מהשמות למעלה כדי להפעיל את הסוכן עם הידע המעמיק של אותה גישה.</p>
            <button onClick={() => { const p = document.getElementById('choose-popup'); if(p) p.style.display='none'; }}
              style={{ background: '#c4607a', border: 'none', color: '#fff', padding: '10px 28px', borderRadius: 6, fontSize: 16, fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer' }}>הבנתי</button>
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
            background: 'var(--surface, #fff)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '14px 16px', width: 240,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            fontFamily: 'var(--font-rubik), sans-serif',
            direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left',
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent, #c4607a)', marginBottom: 10 }}>
              {name}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--muted, #74645e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.approach}</div>
              <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>{card.approach}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--muted, #74645e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.concepts}</div>
              <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>{card.concepts}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--muted, #74645e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.forWhom}</div>
              <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>{card.forWhom}</div>
            </div>
          </div>
        );
      })()}

      {/* מודל הניתוח (הכרעת איה, פריט 10, לבדיקה). קודם הניתוח נפרש בתוך כרטיס הכתיבה
          ודחף את הכתיבה עצמה מטה. כאן הוא מקבל מסך משלו, והכתיבה נשארת שלמה מאחוריו.
          המשקל והצללית זהים למודל החלפת הגישה שב-chat.js, כדי ששני המודלים ייקראו כאותו
          רכיב. סגירה: כפתור, לחיצה על הרקע, ו-Escape. הניתוח עצמו נשמר ב-noteAnalysis
          ולא נמחק בסגירה, ולכן "הצג את הניתוח" מחזיר אליו. */}
      {analysisModalOpen && !!noteAnalysis['draft'] && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setAnalysisModalOpen(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(45,36,32,0.28)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)' }}
        >
          <div style={{ position: 'relative', width: 560, maxWidth: '94vw', maxHeight: '86vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 16px 48px rgba(45,36,32,0.22)', padding: 'var(--space-lg)', direction: isHe ? 'rtl' : 'ltr' }}>
            <button
              onClick={() => setAnalysisModalOpen(false)}
              title={isHe ? 'סגירה' : 'Close'}
              style={{ position: 'absolute', top: 'var(--space-sm)', insetInlineEnd: 'var(--space-sm)', width: 44, height: 44, borderRadius: '50%', border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: 20, lineHeight: 1, cursor: 'pointer' }}
            >×</button>
            <div style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 'var(--fs-heading-card)', color: 'var(--text)', marginBottom: 'var(--space-xs)' }}>
              {isHe ? 'נתח' : 'Analyse'}
            </div>
            {renderNoteAnalysisBody(noteAnalysis['draft'])}
          </div>
        </div>
      )}
    </>
  );
}
