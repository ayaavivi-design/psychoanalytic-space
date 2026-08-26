'use client';
import { useState, useEffect, useRef } from 'react';
import { PenLine, Globe, Settings, LogOut, Languages, Download, ChevronDown, BookOpen, Sofa, Mic, ScrollText, MessageCirclePlus, Sparkles, HelpCircle } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [theoristsOpen, setTheoristsOpen] = useState(true);
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
    setTheoristsOpen(true);
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
    const clearWritingSurface = () => {
      setDailyText('');
      setConsultText('');
      setHubTheorists([]);
      setConsultPickerOpen(false);
      setNoteAnalysis(prev => { const n = { ...prev }; delete n['draft']; return n; });
    };
    window.addEventListener('bwnewchat', clearWritingSurface);
    return () => window.removeEventListener('bwnewchat', clearWritingSurface);
  }, []);

  const isHe = currentLang === 'he';
  const isDev = process.env.NODE_ENV !== 'production';
  // Local preview uses the dev tabs; production follows the login choice.
  const activePersona = isLocalhost ? devPersona : prodPersona;

  // Mirror holdTheorist onto the sidebar highlight — but only once the patient has actually
  // written something (same gate as the continue button: holdText.trim()). Before any writing
  // the sidebar stays neutral. Set-on-only: we never actively clear here, to avoid flicker when
  // entering a conversation (handleEnterConversation blanks holdText for a tick before the
  // opening text fills it). Uses the existing .active mechanism (bwSetActiveTheorist). No loop —
  // it re-dispatches holdtheoristchange with the same key, so setHoldTheorist is a no-op.
  useEffect(() => {
    if (mounted && activePersona === 'patient' && holdText.trim()) {
      (window as any).bwSetActiveTheorist?.(holdTheorist);
    }
  }, [holdTheorist, activePersona, mounted, holdText]);

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
    try {
      const gh = (window as any).getAuthHeaders;
      const headers = { 'Content-Type': 'application/json', ...(gh ? await gh() : {}) };
      let gender = '';
      try { gender = JSON.parse(localStorage.getItem('intake_completed') || '{}').gender || ''; } catch { /* none */ }
      const r = await fetch('/api/analyze-note', { method: 'POST', headers, body: JSON.stringify({ text: t, mode: activePersona, gender, theorist: holdTheorist }) });
      const data = await r.json();
      if (data && !data.error) {
        setNoteAnalysis(prev => ({ ...prev, [key]: data }));
        // BW-116 — if analyzing a SAVED note, persist the analysis onto it
        if (key !== 'draft' && selectedCase) {
          setCaseUpdates(prev => {
            const updated = prev.map(u => u.id === key ? { ...u, analysis: data } : u);
            localStorage.setItem(`bw_case_updates_${selectedCase.id}`, JSON.stringify(updated));
            return updated;
          });
        }
      }
    } catch { /* ignore */ }
    setAnalyzingNoteId(null);
  };
  // BW-116 — inline render of the reflection for a note (no theorist named — woven between the lines)
  const renderNoteAnalysis = (key: string) => {
    if (analyzingNoteId === key) {
      return <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>{isHe ? 'רגע…' : 'One moment…'}</div>;
    }
    const a = noteAnalysis[key];
    if (!a) return null;
    const section = (label: string, body: React.ReactNode) => (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        {body}
      </div>
    );
    const txt = (s: string) => <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{s}</div>;
    return (
      <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        {a.countertransference && section(isHe ? 'מה עלה בך' : 'What moved in you', txt(a.countertransference))}
        {a.what_opened && section(isHe ? 'מה נפתח' : 'What opened', txt(a.what_opened))}
        {a.what_remained && section(isHe ? 'מה נותר פתוח' : 'What remained', txt(a.what_remained))}
        {a.invitation && section(isHe ? 'הזמנה' : 'Invitation', <div style={{ fontSize: 13, color: 'var(--accent)', lineHeight: 1.6 }}>{a.invitation}</div>)}
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
    // Default save: commit the writing to the local archive once, on continue.
    if (full) (window as any).saveWriteEntry?.(full, pub);
    (window as any).enterHoldConversation?.(theorist, pub);
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
  // סגנון אחיד לכלי השיחה ב-‎.session-actions. שקט בכוונה: השורה יושבת מעל השיחה ואסור לה
  // למשוך את העין אליה. גובה 32 ולא 44, כי אלה כלים משניים ולא פעולה ראשית.
  const sessionToolStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-xs)',
    height: 32, padding: '0 var(--space-sm)', borderRadius: 'var(--radius-sm)',
    border: '1px solid transparent', background: 'transparent', color: 'var(--muted)',
    cursor: 'pointer', fontSize: 'var(--fs-body-sm)', fontFamily: 'var(--font-rubik), sans-serif',
    whiteSpace: 'nowrap', transition: 'color 0.15s, background 0.15s',
  };

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
          <p id="auth-subtitle" style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 12 }}>מרחב לחשוב על מה שנשאר בין מפגש למפגש.</p>

          {/* BW-111 — login persona CHOICE. The choice is a request; therapist is granted only if the
              account is on the allowlist (server-gated via /api/me in __resolvePersona). Else → patient. */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, opacity: 0.8 }}>כניסה כ:</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['patient','בטיפול'],['therapist','מטפל/ת']] as [string,string][]).map(([key, label]) => (
                <button key={key} id={`persona-choice-${key}`}
                  onClick={() => {
                    try { localStorage.setItem('bw_persona_choice', key); } catch {}
                    ['patient','therapist'].forEach(k => {
                      const btn = document.getElementById(`persona-choice-${k}`);
                      if (!btn) return;
                      btn.style.background = k === key ? 'var(--accent-soft)' : 'none';
                      btn.style.borderColor = k === key ? 'var(--accent)' : 'var(--border)';
                      btn.style.color = k === key ? 'var(--accent)' : 'var(--muted)';
                    });
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
            השיחות נשמרות רק על המכשיר שלך. אנחנו לא שומרים אותן אצלנו.
            <br />
            פרטי הכניסה מוצפנים ומאובטחים.
          </p>
          <p id="auth-disclaimer" style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.85, marginTop: 12, opacity: 0.6, borderTop: '1px solid var(--border)', paddingTop: 14, width: 'calc(100% + 320px)', marginLeft: '-160px', marginRight: '-160px' }}>
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
      <div id="sidebar" className={`persona-${activePersona}`}>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* כיווץ הסייד-בר — אייקון בלבד בראש התפריט, מעל הכל (הכרעת איה 25.08). עבר לכאן
              מהכותרת, שם ישב מעל אזור הכתיבה בלי קשר לשיחה. נשאר ‎.sb-item כדי שיתיישר עם
              עמודת האייקונים שמתחתיו ויקבל את אותו ריחוף, רק בלי ‎.sb-label. בטוח במצב מכווץ:
              הסייד-בר מתכווץ ל-52px ואינו נעלם, ולכן האייקון נשאר גלוי ולחיץ. */}
          <div style={{ padding: '8px 8px 0' }}>
            <div className="sb-item" data-persona="both" id="sb-toggle-btn" onClick={() => (window as any).toggleSidebar()} title={currentLang === 'he' ? 'כיווץ התפריט' : 'Collapse menu'}>
              <span className="sb-icon">
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                  <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                  <line x1="6" y1="1" x2="6" y2="17" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </span>
            </div>
          </div>
          {/* BW-104 — dev-only persona preview tabs. Never rendered in production.
              הגובה היה 67px כדי שקו התוויות יישב על קו הבסיס של הכותרת. מאז שהמתג עלה לראש
              התפריט (25.08) ההתיישרות הזו לא מתקיימת, וזו רהיטות לוקאל בלבד. */}
          {isLocalhost && (
            <div style={{ marginTop: 6, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: 9, color: 'var(--muted)', opacity: 0.6, letterSpacing: 0.3, padding: '0 10px 4px' }}>{isHe ? 'תצוגת פיתוח' : 'Dev preview'}</div>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                {([['patient', isHe ? 'בטיפול' : 'In therapy'], ['therapist', isHe ? 'מטפל/ת' : 'Therapist']] as ['patient' | 'therapist', string][]).map(([key, label]) => (
                  <div key={key} onClick={() => { if (key !== devPersona) { (window as any).bwExitChatToHome?.(); setDevPersona(key); } }}
                    style={{
                      flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 13, cursor: 'pointer',
                      color: devPersona === key ? 'var(--accent)' : 'var(--muted)',
                      fontWeight: devPersona === key ? 500 : 400,
                      borderBottom: devPersona === key ? '2px solid var(--accent)' : '2px solid transparent',
                      marginBottom: -1, transition: 'color 0.15s',
                    }}>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ padding: '16px 8px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* end-session moved out of sidebar — appears inline at bottom of chat */}
            <div className="sb-item" data-persona="both" onClick={() => (window as any).newChat()}>
              <span className="sb-icon"><PenLine size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-new-chat-label">שיחה חדשה</span>
            </div>
            {/* חיפוש רשת ירד מכאן לתפריט הפרופיל (הכרעת איה, פריט 2) — הוא הגדרה נמשכת, לא פעולה. */}
            <div className="sb-item" data-persona="patient" onClick={() => (window as any).openWriteArchive?.()}>
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
            {false && activePersona === 'therapist' && cases.length > 0 && (
              <>
                <div className="sb-item" onClick={() => setCasesOpen(o => !o)}>
                  <span className="sb-icon"><ScrollText size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label" style={{ flex: 1 }}>{isHe ? 'המקרים שלי' : 'My cases'}</span>
                  <ChevronDown size={13} strokeWidth={1.75} style={{ color: 'var(--muted)', flexShrink: 0, transition: 'transform 0.2s', transform: casesOpen ? 'rotate(180deg)' : 'none' }} />
                </div>
                {casesOpen && cases.map(c => (
                  <div key={c.id} className="sb-item" style={{ paddingRight: 10, fontSize: 13 }}
                    onClick={() => openCase(c)}>
                    <span className="sb-label">{c.label}</span>
                  </div>
                ))}
              </>
            )}
            {/* BW-113 — מחקר חזר לסייד-בר כפריט עצמאי (לא קשור למקרה). */}
            {isLocalhost && (
              <div id="sb-explore-btn" className="sb-item" data-persona="therapist" onClick={() => (window as any).enterExploreModeFromSidebar?.()}>
                <span className="sb-icon"><BookOpen size={15} strokeWidth={1.75} /></span>
                <span className="sb-label">{currentLang === 'he' ? 'מחקר' : 'Research'}</span>
                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(לוקאל)' : '(local)'}</span>
              </div>
            )}
            {/* פיקוח קליני הוסר מה-UI (קו אדום CORE: לא תחליף לסופרוויזיה; ההתייעצות מכסה את הצורך). הראוט/הפונקציה נשארו בקוד — הפיך. BW-112. */}
            <div id="patient-reflection-btn" className="sb-item admin-only" data-persona="patient" onClick={() => (window as any).openPatientReflection()} style={{ display: 'none' }}>
              <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>◉</span>
              <span className="sb-label" id="sb-reflection-label">מה לקחתי מהשיחה</span>
            </div>
            {/* אנונימיזציה ופידבק — גלויים רק ב-localhost */}
            {/* anonymization removed from UI */}
            {isLocalhost && (
              <div className="sb-item admin-only" data-persona="admin" onClick={() => (window as any).openUserFeedback()}>
                <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>◈</span>
                <span className="sb-label" id="sb-feedback-label">פידבק משתמש</span>
                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(בטא)' : '(Beta)'}</span>
              </div>
            )}
            {/* חדר הבורד — גלוי רק ב-localhost */}
            {isLocalhost && (
              <div className="sb-item admin-only" data-persona="admin" onClick={() => (window as any).openBoardRoom()}>
                <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>⬡</span>
                <span className="sb-label" id="sb-board-label">חדר הבורד</span>
                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400, letterSpacing: 0.3, marginRight: 4 }}>{currentLang === 'he' ? '(בטא)' : '(Beta)'}</span>
              </div>
            )}
          </div>

          {/* Theorists section */}
          <div style={{ borderTop: '1px solid var(--border)', padding: '6px 8px 4px' }}>
            <div className="sb-item" onClick={() => setTheoristsOpen(o => !o)}>
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
            {/* חיפוש רשת, שפה וצור קשר רוכזו כאן מהסייד-בר ומהכותרת (הכרעת איה, פריטים 2 ו-4).
                אותם מזהים ואותן מחלקות ‎js-*-label כמו קודם, כדי ש-applyUITranslation ימשיך לעדכן. */}
            <div className="sb-item" data-persona="therapist" onClick={() => (window as any).toggleWebSearch()} id="sb-websearch-btn" title="חיפוש באינטרנט">
              <span className="sb-icon"><Globe size={15} strokeWidth={1.75} /></span>
              <span className="sb-label js-websearch-label">חיפוש רשת: כבוי</span>
            </div>
            <div className="sb-item" onClick={(e) => { e.stopPropagation(); const nl = currentLang === 'he' ? 'en' : 'he'; setCurrentLang(nl); (window as any).selectLang?.(nl, nl === 'en' ? '🇬🇧' : '🇮🇱', nl === 'en' ? 'English' : 'עברית'); }}>
              <span className="sb-icon"><Languages size={15} strokeWidth={1.75} /></span>
              <span className="sb-label">{currentLang === 'he' ? 'שפה: עברית' : 'Language: English'}</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).openSupportModal?.()}>
              <span className="sb-icon"><HelpCircle size={15} strokeWidth={1.75} /></span>
              <span className="sb-label">{currentLang === 'he' ? 'צור קשר' : 'Contact'}</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).openSettings()}>
              <span className="sb-icon"><Settings size={15} strokeWidth={1.75} /></span>
              <span className="sb-label js-settings-label">הגדרות</span>
            </div>
            <div className="sb-item" onClick={() => (window as any).signOut()}>
              <span className="sb-icon"><LogOut size={15} strokeWidth={1.75} /></span>
              <span className="sb-label js-signout-label">התנתק</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div id="main-content">
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
              <div id="header-intake-btn" onClick={() => (window as any).startIntake()} style={{ display: 'none', cursor: 'pointer', fontSize: 12, color: '#fff', background: 'var(--accent-deep)', borderRadius: 20, padding: '6px 16px', fontFamily: 'var(--font-rubik), sans-serif', fontWeight: 500, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
                שיחת היכרות
              </div>
              )}
              {/* Mobile-only account entry — opens #bw-account-menu (tools + account), the phone stand-in for the hidden sidebar. */}
              <div className="bw-header-avatar" onClick={(e) => { e.stopPropagation(); (window as any).toggleAccountMenu(); }} title="חשבון" style={{ cursor: 'pointer', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                <div className="sb-avatar">A</div>
              </div>
            </div>
            {/* Mobile account menu — mirrors the sidebar's tools + account, persona-scoped exactly like #sidebar.
                Labels reuse the shared .js-*-label classes so applyUITranslation updates both copies. */}
            <div id="bw-account-menu" className={`persona-${activePersona}`} style={{ display: 'none' }}>
              {/* 1. Account row — avatar + name + email. Name/email copied from #sb-user-* at open (toggleAccountMenu). */}
              <div className="bw-acct-account-row">
                <div className="sb-avatar">A</div>
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
                  <span className="sb-label">{currentLang === 'he' ? 'צור קשר' : 'Contact'}</span>
                </div>
                <div className="sb-item" onClick={() => { (window as any).signOut(); (window as any).closeAccountMenu?.(); }}>
                  <span className="sb-icon"><LogOut size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label js-signout-label">התנתק</span>
                </div>
              </div>
              {/* 4. Tools (therapist) + PDF (gated) + intake (patient). */}
              <div className="bw-acct-section">
                <div className="sb-item" data-persona="therapist" onClick={() => { (window as any).toggleWebSearch(); (window as any).closeAccountMenu?.(); }}>
                  <span className="sb-icon"><Globe size={15} strokeWidth={1.75} /></span>
                  <span className="sb-label js-websearch-label">חיפוש רשת: כבוי</span>
                </div>
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
                  style={sessionToolStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Sparkles size={14} strokeWidth={1.75} />
                  <span>{(activeApproach && THEORIST_LABELS[activeApproach]?.[0]) || (isHe ? 'גישה' : 'Approach')}</span>
                  <ChevronDown size={12} strokeWidth={1.75} style={{ transition: 'transform 0.2s', transform: sessionApproachOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>
                {activePersona === 'therapist' && (
                <button
                  onClick={() => (window as any).openSessionSummary?.()}
                  title={isHe ? 'סיכום התייעצות' : 'Consultation summary'}
                  style={sessionToolStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1 }}>◎</span>
                  <span>{isHe ? 'סיכום' : 'Summary'}</span>
                </button>
                )}
                <button
                  id="bw-session-pdf"
                  onClick={() => (window as any).exportPDF?.()}
                  title={isHe ? 'הורד PDF' : 'Download PDF'}
                  style={sessionToolStyle}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
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
                      <div key={key} className={`theorist-tag sb-item${activeApproach === key ? ' active' : ''}`} data-key={key}
                        style={{ paddingInlineEnd: 10, fontSize: 13 }}
                        onClick={(e) => { (window as any).toggleTheorist(e.currentTarget, key); setSessionApproachOpen(false); }}>
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>


        <div id="chat">
          {mounted && (
            <div className="welcome" id="welcome">
              {/* BW-41: back button — top-left corner of content area */}
              <span id="bw-back-btn" onClick={() => (window as any).goBackToChat()} style={{ position: 'absolute', top: 20, left: 24, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', opacity: 0.7, display: 'none' }}>← חזרה</span>
              {/* BW-111 — chose "therapist" at login but not on the allowlist → entered as patient. */}
              {personaNotice && !isLocalhost && (
                <div style={{ width: '100%', background: 'var(--thinking)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{isHe ? 'גישת מטפלים בהזמנה בלבד כרגע — נכנסת כמטופל/ת.' : 'Therapist access is invite-only for now — you\'re in as a patient.'}</span>
                  <span onClick={() => setPersonaNotice(false)} style={{ fontSize: 14, color: 'var(--muted)', cursor: 'pointer', userSelect: 'none' }}>✕</span>
                </div>
              )}
              {/* Hold entry — patient only (therapist lands on direct conversation, no Hold) */}
              {activePersona === 'patient' && (
              <div id="bw-mode-select" style={{ flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
                <p id="bw-hold-heading" style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 'var(--fs-heading-card)', fontWeight: 400, color: 'var(--text)', margin: 0, alignSelf: 'flex-start' }}>{isHe ? 'מה נשאר איתך?' : 'What stayed with you?'}</p>
                {/* Single card — everything inside (option ו) */}
                <div style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                  {/* Textarea — contenteditable for private-marking support */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div
                      id="bw-hold-textarea"
                      contentEditable
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
                        width: '100%', minHeight: 200, padding: '20px 20px 48px',
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
                          textAlign: isHe ? 'right' : 'left',
                          color: 'var(--muted)', fontSize: 15,
                          fontFamily: 'var(--font-rubik), sans-serif',
                          pointerEvents: 'none', userSelect: 'none', lineHeight: 1.6,
                        }}
                      >
                        {isHe ? 'כתוב לעצמך או למטפל שלך או להביא לפגישה הבאה' : 'Write for yourself, for your therapist, or to bring to your next session.'}
                      </span>
                    )}
                    {/* המיקרופון עבר לתוך השדה (הכרעת איה, פריט 1), כמו אצל המטפלת. */}
                    {speechSupported && (
                      <button
                        onClick={handleToggleVoice}
                        className={`bw-mic${isRecording ? ' bw-mic-recording' : ''}`}
                        aria-pressed={isRecording}
                        title={isHe ? 'הקלטה קולית' : 'Voice input'}
                      >
                        <Mic size={15} />
                      </button>
                    )}
                  </div>
                  {/* Voice picker — mobile has no sidebar, so switching the theorist's voice
                      happens here. Mobile-only: on desktop the sidebar already switches voice,
                      and duplicating it below the writing card breaks hierarchy (UX-RULE 9).
                      Exactly one chip is always active (default winnicott); reuses .theorist-tag.
                      Its own row above the footer, so it never joins the footer flex line
                      (that would worsen the primary-button jump, bug 6). */}
                  {isMobile && (
                  <div style={{ borderTop: '1px solid var(--border)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', padding: 'var(--space-sm) var(--space-md)', minHeight: 44, alignItems: 'center' }}>
                    {(['freud', 'klein', 'winnicott', 'ogden'] as const).map(key => (
                      <span
                        key={key}
                        className={`theorist-tag${holdTheorist === key ? ' active' : ''}`}
                        onClick={() => setHoldTheorist(key)}
                      >
                        {getHoldTheoristName(key)}
                      </span>
                    ))}
                  </div>
                  )}
                  {/* Footer: mic + continue. Parent is direction:rtl in Hebrew, so plain
                      'row' puts mic at the start (right) and the continue button at the end (left). */}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row', flexWrap: 'wrap' }}>
                    {/* המיקרופון ירד מכאן לתוך השדה. */}
                    <div style={{ flex: 1 }} />
                    {/* Secondary action — analyze the writing. Gated on written text (BW-122:
                        no fixed discharge-button from frame one; the gesture appears only
                        after the patient has written). Calls chat.js's openWriteSummary(),
                        which since BW-129 hits /api/analyze-note in patient mode (merged with
                        the old write-summary tool — see lib/analyze-note-prompt.ts). */}
                    {holdText.trim() && (
                      <button
                        onClick={() => (window as any).openWriteSummary?.()}
                        style={{
                          background: 'transparent', border: 'none', padding: 0, height: 44,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                          transition: 'opacity 0.15s', flexShrink: 0, marginInlineEnd: 8,
                        }}
                      >
                        <span style={{
                          background: 'transparent', border: '1px solid var(--accent)', borderRadius: 16, height: 30, padding: '0 14px',
                          fontSize: 11, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--accent)',
                          display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
                        }}>
                          {isHe ? 'מה יש כאן' : "What's here"}
                        </span>
                      </button>
                    )}
                    {/* Primary action — continue into a held conversation with the theorist.
                        Label follows the sidebar selection via holdTheorist (holdtheoristchange). */}
                    <button
                      onClick={() => handleEnterConversation(holdTheorist)}
                      disabled={!holdText.trim()}
                      style={{
                        background: 'transparent', border: 'none', padding: 0, height: 44,
                        cursor: holdText.trim() ? 'pointer' : 'default',
                        opacity: holdText.trim() ? 1 : 0.4,
                        display: 'inline-flex', alignItems: 'center',
                        transition: 'opacity 0.15s', flexShrink: 1, minWidth: 0,
                      }}
                    >
                      <span style={{
                        background: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 16, minHeight: 30, height: 'auto', padding: '0 var(--space-md)',
                        fontSize: 'var(--fs-body-md)', fontFamily: 'var(--font-rubik), sans-serif', color: '#fff',
                        display: 'inline-flex', alignItems: 'center', whiteSpace: 'normal',
                      }}>
                        {isHe ? `המשך לשיחה עם ${getHoldTheoristName(holdTheorist)}` : `Continue with ${getHoldTheoristName(holdTheorist)}`}
                      </span>
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12, flexDirection: isHe ? 'row-reverse' : 'row' }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-rubik), sans-serif', margin: 0, textAlign: isHe ? 'right' : 'left' }}>
                    {isHe ? 'סמן טקסט כדי לסמן פרטי, לפני שמשתפים.' : 'Highlight text to mark private, before sharing.'}
                  </p>
                  <button
                    onClick={() => (window as any).openWriteArchive?.()}
                    style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {isHe ? 'מה כתבתי' : 'What I wrote'}
                  </button>
                </div>
                {/* Ephemerality — stated as a value, not read as a failure. Content is never
                    persisted server-side by design (MEMORY.md, "תוכן שיחות לא נשמר בשרת").
                    Left unsaid it reads as "my history got deleted"; PDF is the only keeping.
                    <bdi> isolates the Latin run so the bidi algorithm can't break the RTL line. */}
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-rubik), sans-serif', margin: 0, textAlign: isHe ? 'right' : 'left', lineHeight: 1.7 }}>
                  {isHe
                    ? <>מה שנכתב כאן לא נשמר אצלנו. זה מרחב לכתוב בו בחופשיות. אם משהו חשוב לך לשמור, אפשר להוריד קובץ (<bdi>PDF</bdi>) ולשמור אותו אצלך.</>
                    : 'Nothing written here is kept by us. This is a space to write freely. If you want to keep something, download it as a PDF.'}
                </p>
                {holdSaveStatus === 'saved' && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', margin: 0 }}>{isHe ? 'נשמר.' : 'Saved.'}</p>
                )}
              </div>
              )}
              {/* BW-113 — therapist case-first landing: "My Cases". Hidden during step-1 auto-entry to land on the writing page. */}
              {activePersona === 'therapist' && therapistView === 'cases' && therapistReady && (
              <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 24, color: 'var(--text)', margin: 0 }}>{isHe ? 'המקרים שלי' : 'My cases'}</h2>
                  <button onClick={() => setShowNewCase(v => !v)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 22, padding: '9px 20px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer' }}>{isHe ? '+ מקרה חדש' : '+ New case'}</button>
                </div>
                {showNewCase && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <input value={newCaseLabel} onChange={e => setNewCaseLabel(e.target.value)} placeholder={isHe ? 'תווית למקרה (פסבדונים — לא שם אמיתי)' : 'Case label (pseudonym, not a real name)'} style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 16, padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--surface)', color: 'var(--text)' }} />
                    <button onClick={() => createCase(newCaseLabel)} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 22, padding: '9px 18px', fontSize: 13, cursor: 'pointer' }}>{isHe ? 'צור' : 'Create'}</button>
                  </div>
                )}
                {cases.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '40px 0', lineHeight: 1.7 }}>{isHe ? `עדיין אין מקרים. ${gv('צרי','צור','צור/י')} מקרה ראשון כדי להתחיל לארגן התייעצויות.` : 'No cases yet. Create your first case to start organizing consultations.'}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cases.map(c => (
                      <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, position: 'relative', display: 'flex', alignItems: 'stretch', direction: 'ltr' }}>
                        {/* accent strip — physical left, ltr-first */}
                        <div style={{ width: 3, background: 'var(--accent)', flexShrink: 0, borderTopLeftRadius: 11, borderBottomLeftRadius: 11 }} />
                        {/* card body */}
                        <div onClick={() => renamingCaseId !== c.id ? openCase(c) : undefined}
                          style={{ flex: 1, padding: '14px 16px', cursor: renamingCaseId === c.id ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', gap: 3, direction: 'rtl', textAlign: 'start' }}>
                          {renamingCaseId === c.id ? (
                            <input autoFocus value={renamingLabel} onChange={e => setRenamingLabel(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') renameCase(c.id, renamingLabel); if (e.key === 'Escape') setRenamingCaseId(null); }}
                              style={{ width: '100%', fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 19, fontWeight: 500, border: 'none', borderBottom: '1px solid var(--accent)', background: 'transparent', color: 'var(--text)', outline: 'none', padding: '0 0 2px', boxSizing: 'border-box', direction: 'rtl' }} />
                          ) : (
                            <>
                              <span style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 19, fontWeight: 500, color: 'var(--text)', lineHeight: 1.2 }}>{c.label}</span>
                              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-rubik), sans-serif' }}>{new Date(c.created_at).toLocaleDateString(isHe ? 'he-IL' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                            </>
                          )}
                        </div>
                        {/* three-dot menu — physical right */}
                        <span onClick={e => { e.stopPropagation(); setOpenMenuCaseId(id => id === c.id ? null : c.id); }}
                          style={{ fontSize: 16, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1, padding: '4px 14px 4px 10px', alignSelf: 'center', userSelect: 'none', flexShrink: 0 }}>⋮</span>
                        {openMenuCaseId === c.id && (<>
                          <div onClick={() => setOpenMenuCaseId(null)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                          <div style={{ position: 'absolute', top: 42, right: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 100, minWidth: 160, overflow: 'hidden', direction: 'rtl' }}>
                            <div onClick={e => { e.stopPropagation(); setRenamingCaseId(c.id); setRenamingLabel(c.label); setOpenMenuCaseId(null); }} style={{ padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--text)', cursor: 'pointer' }}>{isHe ? 'ערוך שם' : 'Rename'}</div>
                            <div onClick={e => { e.stopPropagation(); archiveCase(c.id, true).then(() => setCasesLoaded(false)); setOpenMenuCaseId(null); }} style={{ padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--text)', cursor: 'pointer', borderTop: '1px solid var(--border)' }}>{isHe ? 'העבר לארכיון' : 'Archive'}</div>
                            <div onClick={e => { e.stopPropagation(); setOpenMenuCaseId(null); deleteCaseById(c.id, c.label); }} style={{ padding: '10px 16px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--accent)', cursor: 'pointer', borderTop: '1px solid var(--border)' }}>{isHe ? 'מחק מקרה' : 'Delete case'}</div>
                          </div>
                        </>)}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <button onClick={() => { setTherapistView('hub'); setHubMode(null); setHubTheorists([]); }} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', borderRadius: 22, padding: '8px 18px', fontSize: 13, cursor: 'pointer' }}>{isHe ? 'התייעצות חדשה' : 'New consultation'}</button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.6, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>{isHe ? 'הערות רפלקציה, לא רשומה קלינית. ההערות נשארות אצלך; התייעצויות מאונמזות לפני שמירה. התוויות הן כינויים.' : 'Reflection notes, not a clinical record. Notes stay on your device; consultations are anonymized before saving. Labels are pseudonyms.'}</p>
              </div>
              )}
              {/* BW-113 — case detail: consultation timeline. */}
              {activePersona === 'therapist' && therapistView === 'caseDetail' && selectedCase && (
              <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
                <p style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 19, fontWeight: 400, color: 'var(--text)', margin: '0 0 16px' }}>{isHe ? 'מה עלה לך מהפגישה?' : 'What came up in the session?'}</p>
                {/* BW-116 — daily update section */}
                <div style={{ marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' }}>
                  {/* המיקרופון עבר לתוך השדה (הכרעת איה, פריט 1). הריפוד התחתון פונה לו מקום
                      כדי שהטקסט לא ייכתב מתחתיו, והעוטף relative כי ‎.bw-mic מוחלט. */}
                  <div style={{ position: 'relative', width: '100%' }}>
                    <textarea
                      value={dailyText}
                      onChange={e => setDailyText(e.target.value)}
                      placeholder={isHe ? `מה עלה היום? ${gv('כתבי', 'כתוב', 'כתוב/י')} עדכון על המקרה…` : "What came up today? Write a case update…"}
                      style={{ width: '100%', minHeight: 240, maxHeight: '50vh', overflowY: 'auto', boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px 44px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', outline: 'none', display: 'block' }}
                    />
                    <button
                      onClick={handleDailyVoice}
                      className={`bw-mic${isDailyRecording ? ' bw-mic-recording' : ''}`}
                      aria-pressed={isDailyRecording}
                      title={isDailyRecording ? (isHe ? 'עצור הקלטה' : 'Stop recording') : (isHe ? 'הקלט קול' : 'Record voice')}
                    >
                      <Mic size={15} />
                    </button>
                  </div>
                  {/* The "saved on your device" line came down with "שמור" (Aya, 22.08). dailyText is
                      state only — with no save action nothing is stored anywhere, so the sentence
                      would have claimed a save that no longer happens. Replacement copy: Shaun. */}
                  {/* Single aligned action row — mic + buttons flush to the start side (mirrors patient footer).
                      Hidden once an analysis exists: the analysis is the destination, not a step. */}
                  {!noteAnalysis['draft'] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap', flexDirection: isHe ? 'row-reverse' : 'row' }}>
                    {/* המיקרופון ירד מכאן לתוך השדה. השורה נשארת כעוגן לפעולות שמופיעות אחרי כתיבה. */}
                    {/* Gating is appear/disappear, never disabled-and-greyed — a visible-but-dimmed
                        control reads as "you are not enough for this yet". Decision 09.07. */}
                    {/* "שמור" removed from the UI (Aya, 22.08) — an archive contradicts the ephemeral
                        promise this space makes. The two ways out are: analyze, or go on to a
                        conversation. saveDailyUpdate() is kept in the code, unwired — reversible. */}
                    <div style={{ flex: 1 }} />
                  </div>
                  )}
                  {renderNoteAnalysis('draft')}
                  {/* Mode 2א — the analysis landed. Two quiet, equal actions behind a hairline;
                      neither is accent-filled, so the analysis stays the strongest thing here. */}
                  {!!noteAnalysis['draft'] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', flexDirection: isHe ? 'row-reverse' : 'row' }}>
                    <span
                      onClick={() => setConsultPickerOpen(o => !o)}
                      style={{ fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--accent)', cursor: 'pointer' }}>
                      {isHe ? 'לחשוב על זה עם מישהו' : 'Think it through with someone'} {consultPickerOpen ? '⌃' : '⌄'}
                    </span>
                    <div style={{ flex: 1 }} />
                    <span
                      onClick={() => { setNoteAnalysis(prev => { const n = { ...prev }; delete n['draft']; return n; }); setConsultPickerOpen(false); }}
                      style={{ fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--muted)', cursor: 'pointer' }}>
                      {isHe ? 'חזרה לכתיבה' : 'Back to writing'}
                    </span>
                  </div>
                  )}
                  {/* Ephemeral consultation — theorist pills live INSIDE the writing card and are
                      gated on its text, because that is what they act on (startConsultation(dailyText)).
                      As a floating sibling they survived "שמור" — which empties dailyText — and sat
                      wedged between an empty box and the saved note, inert, while the note below
                      carried its own working נתח/התייעץ. Anchored to the text, they leave with it.
                      Once an analysis exists they collapse behind the "think it through" line above,
                      so the output is not immediately followed by a second, unasked-for decision. */}
                  {!!dailyText.trim() && (!noteAnalysis['draft'] || consultPickerOpen) && (() => {
                  const HUB_THEORISTS: [string, string][] = [['freud', isHe ? 'פרויד' : 'Freud'], ['klein', isHe ? 'קליין' : 'Klein'], ['winnicott', isHe ? 'ויניקוט' : 'Winnicott'], ['ogden', isHe ? 'אוגדן' : 'Ogden']];
                  const chipStyle = (on: boolean): React.CSSProperties => ({
                    border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
                    borderRadius: 'var(--radius-xl)', padding: '8px 12px', fontSize: 13, cursor: 'pointer',
                    color: on ? '#fff' : 'var(--text)', background: on ? 'var(--accent)' : 'var(--surface)',
                  });
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
                  const isRoundtable = hubTheorists.length >= 2;
                  return (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div className="hub-helpcap">{isHe ? <>מאיזו גישה?<br/>אחד לעומק, או כמה יחד לשולחן עגול.</> : <>From which approach?<br/>One in depth, or several at a round table.</>}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12, maxWidth: 560 }}>
                        {HUB_THEORISTS.map(([k, name]) => {
                          const on = hubTheorists.includes(k);
                          return <span key={k} onClick={() => setHubTheorists(on ? hubTheorists.filter(x => x !== k) : [...hubTheorists, k])} style={chipStyle(on)}>{name}{on ? ' ✓' : ''}</span>;
                        })}
                      </div>
                      {hubTheorists.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>{hubTheorists.length === 1 ? (isHe ? 'נבחר אחד — התייעצות ממוקדת.' : 'One selected — focused consultation.') : (isHe ? `נבחרו ${hubTheorists.length} — שולחן עגול.` : `${hubTheorists.length} selected — round table.`)}</div>
                      )}
                      {/* Both actions live here, after the approach is chosen (Aya, 25.08). The trigger
                          for showing them is a DECISION, not a character count — which is why this
                          satisfies the 09.07 rule (appear/disappear, never disabled-and-greyed) without
                          bending it: nothing is dimmed, and nothing appears before she has chosen who.
                          "נתח" moved down from the row above for the same reason. It was already
                          voice-dependent — /api/analyze-note prepends the chosen theorist's block — the
                          choice was simply being made silently for her. */}
                      {hubTheorists.length >= 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                          {!isRoundtable && analyzingNoteId !== 'draft' && (
                            <button
                              onClick={() => analyzeNote(dailyText, 'draft')}
                              style={{ padding: '12px 20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--accent)', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'transparent', color: 'var(--accent)', cursor: 'pointer' }}>
                              {isHe ? 'נתח' : 'Analyze'}
                            </button>
                          )}
                          <button
                            onClick={isRoundtable ? openRoundtableMockup : () => startConsultation(dailyText)}
                            style={{ padding: '12px 20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--accent)', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
                            {isRoundtable ? (isHe ? 'שולחן עגול' : 'Round table') : (isHe ? 'שיחה' : 'Talk')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  })()}
                </div>
                {/* BW-116 — past updates from localStorage.
                    REMOVED FROM THE UI (Aya, 22.08): an archive of clinical writing contradicts the
                    ephemeral promise. The reading/writing code and the localStorage keys are left
                    intact — flip `false` back to `caseUpdates.length > 0` to restore. Existing
                    entries on a device are not deleted, only no longer shown. */}
                {false && caseUpdates.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{isHe ? 'עדכונים קודמים' : 'Past updates'}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {caseUpdates.map(u => (
                        <div key={u.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
                          {editingDailyId === u.id ? (
                            <>
                              <textarea autoFocus value={editingDailyText} onChange={e => setEditingDailyText(e.target.value)}
                                style={{ width: '100%', minHeight: 80, boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical' }} />
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button onClick={() => setEditingDailyId(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 22, padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--muted)', cursor: 'pointer' }}>{isHe ? 'ביטול' : 'Cancel'}</button>
                                <button onClick={() => saveDailyEdit(u.id)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 22, padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: '#fff', cursor: 'pointer' }}>{isHe ? 'שמור' : 'Save'}</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, color: 'var(--muted)', flex: 1 }}>{new Date(u.created_at).toLocaleDateString(isHe ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                <span onClick={() => { setEditingDailyId(u.id); setEditingDailyText(u.text); }} style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer', opacity: 0.6, marginInlineEnd: 10 }} title={isHe ? 'ערוך' : 'Edit'}>✎</span>
                                <span onClick={() => deleteCaseUpdate(u.id)} style={{ fontSize: 11, color: 'var(--muted)', cursor: 'pointer', opacity: 0.6 }} title={isHe ? 'מחק' : 'Delete'}>✕</span>
                              </div>
                              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{u.text}</div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                                <button
                                  disabled={analyzingNoteId === u.id}
                                  onClick={() => analyzeNote(u.text, u.id)}
                                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 22, padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--accent)', cursor: 'pointer' }}>
                                  {isHe ? 'נתח' : 'Analyze'}
                                </button>
                                <button
                                  onClick={() => consultFromText(u.text)}
                                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 22, padding: '5px 14px', fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--accent)', cursor: 'pointer' }}>
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
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>
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
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 18px', cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 22, background: 'var(--accent-soft, rgba(196,96,122,0.07))', color: 'var(--accent)', border: '1px solid var(--border)' }}>{modeLabel}</span>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{(co.theorists || []).join(' · ')}</span>
                            <span style={{ fontSize: 11, color: 'var(--muted)', marginInlineStart: 'auto' }}>{new Date(co.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span onClick={e => { e.stopPropagation(); deleteConsultation(co.id); }} style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer', opacity: 0.5, lineHeight: 1 }} title={isHe ? 'מחק' : 'Delete'}>✕</span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6, opacity: 0.85, whiteSpace: expandedConsultId === co.id ? 'pre-wrap' : 'normal' }}>
                            {expandedConsultId === co.id
                              ? co.anonymized_text
                              : <>{co.anonymized_text.slice(0, 160)}{co.anonymized_text.length > 160 ? <span style={{ color: 'var(--accent)' }}> קרא עוד</span> : ''}</>
                            }
                          </div>
                          {co.mode === 'note' && expandedConsultId === co.id && (
                            <span onClick={e => { e.stopPropagation(); openEditNote(co); }} style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}>{isHe ? 'ערוך' : 'Edit'}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
              {/* BW-113 — therapist archive: archived cases (patients), with restore. */}
              {activePersona === 'therapist' && therapistView === 'archive' && (
              <div style={{ width: '100%', maxWidth: 720, margin: '0 auto' }}>
                <span onClick={() => { setTherapistView('cases'); setCasesLoaded(false); }} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', display: 'inline-block', marginBottom: 14 }}>{isHe ? '← המקרים שלי' : '← My cases'}</span>
                <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 24, color: 'var(--text)', margin: '0 0 24px' }}>{isHe ? 'ארכיון' : 'Archive'}</h2>
                {archivedCases.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>{isHe ? 'אין מקרים בארכיון.' : 'No archived cases.'}</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {archivedCases.map(c => (
                      <div key={c.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
                        <div style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 19, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>{c.label}</div>
                        <button onClick={async () => { await archiveCase(c.id, false); setArchivedLoaded(false); setCasesLoaded(false); }} style={{ background: 'none', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: 22, padding: '6px 14px', fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer' }}>{isHe ? 'שחזר' : 'Restore'}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
              {/* BW-112 — Therapist hub: mode selection. Reached from a case ("New consultation"). */}
              {activePersona === 'therapist' && therapistView === 'hub' && (() => {
                const HUB_THEORISTS: [string, string][] = [['freud', isHe ? 'פרויד' : 'Freud'], ['klein', isHe ? 'קליין' : 'Klein'], ['winnicott', isHe ? 'ויניקוט' : 'Winnicott'], ['ogden', isHe ? 'אוגדן' : 'Ogden']];
                const chipStyle = (on: boolean): React.CSSProperties => ({
                  border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 22, padding: '7px 16px', fontSize: 13, cursor: 'pointer',
                  color: on ? '#fff' : 'var(--text)', background: on ? 'var(--accent)' : 'var(--surface)',
                });
                return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <button onClick={() => setTherapistView(selectedCase ? 'caseDetail' : 'cases')} style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid var(--border)', borderRadius: 22, padding: '6px 14px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--text)', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: 'var(--accent)' }}>←</span>{selectedCase ? selectedCase.label : (isHe ? 'המקרים שלי' : 'My cases')}</button>
                  <p style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 24, color: 'var(--text)', margin: '0 0 16px' }}>{isHe ? 'נחשוב על זה יחד.' : "Let's think this through together."}</p>
                  <textarea value={consultText} onChange={e => setConsultText(e.target.value)} placeholder={isHe ? `מה עלה בפגישה? ${gv('כתבי','כתוב','כתוב/י')} את החומר להתייעצות (יאונמז לפני שמירה)…` : 'What came up in the session? Write the material to consult on…'} style={{ width: '100%', maxWidth: 560, minHeight: 90, boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 16, padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical', marginBottom: 20 }} />
                  <div className="hub-helpcap">{isHe ? <>מאיזו גישה?<br/>אחד לעומק, או כמה יחד לשולחן עגול.</> : <>From which approach?<br/>One in depth, or several at a round table.</>}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20, maxWidth: 560 }}>
                    {HUB_THEORISTS.map(([k, name]) => {
                      const on = hubTheorists.includes(k);
                      return <span key={k} onClick={() => setHubTheorists(on ? hubTheorists.filter(x => x !== k) : [...hubTheorists, k])} style={chipStyle(on)}>{name}{on ? ' ✓' : ''}</span>;
                    })}
                  </div>
                  {hubTheorists.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>{hubTheorists.length === 1 ? (isHe ? 'נבחר אחד — התייעצות ממוקדת.' : 'One selected — focused consultation.') : (isHe ? `נבחרו ${hubTheorists.length} — שולחן עגול.` : `${hubTheorists.length} selected — round table.`)}</div>
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
                          style={{ padding: '10px 28px', borderRadius: 22, border: 'none', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
                          {label}
                        </button>
                      </div>
                    );
                  })()}
                </div>
                );
              })()}


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
          <div style={{ background: 'var(--surface, #fffaf8)', border: '1px solid var(--border, #e6d6cf)', borderRadius: 16, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(196,96,122,0.12)' }}>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 20, fontWeight: 300, fontStyle: 'italic', color: '#c4607a', marginBottom: 10 }}>{gv('בחרי','בחר','בחר/י')} תיאורטיקן</h3>
            <p style={{ fontSize: 13, color: 'var(--muted, #74645e)', lineHeight: 1.8, marginBottom: 24 }}>לחצי על אחד מהשמות למעלה כדי להפעיל את הסוכן עם הידע המעמיק של אותה גישה.</p>
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
            background: 'var(--surface, #fff)', border: '1px solid var(--border, #e6d6cf)',
            borderRadius: 12, padding: '14px 16px', width: 240,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            fontFamily: 'var(--font-rubik), sans-serif',
            direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent, #c4607a)', marginBottom: 10 }}>
              {name}
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted, #74645e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.approach}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.approach}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted, #74645e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.concepts}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.concepts}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--muted, #74645e)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{labels.forWhom}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{card.forWhom}</div>
            </div>
          </div>
        );
      })()}

    </>
  );
}
