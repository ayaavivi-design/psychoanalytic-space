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
  // BW-104 — sidebar persona. Production: set from login choice (user_prefs.persona).
  // Local: driven by the dev tabs below so Aya can preview both interfaces.
  const [devPersona, setDevPersona] = useState<'patient' | 'therapist'>('patient');
  const [prodPersona, setProdPersona] = useState<'patient' | 'therapist'>('patient');
  // BW-112 — therapist hub: mode selection + theorist selection (UI state; send-wiring is step 1b).
  const [hubMode, setHubMode] = useState<'consult' | 'research' | null>(null);
  const [hubTheorists, setHubTheorists] = useState<string[]>([]);
  // BW-113 — therapist case-first flow.
  type TherapistCase = { id: string; label: string; created_at: string };
  type Consultation = { id: string; mode: string; theorists: string[]; anonymized_text: string; created_at: string };
  const [therapistView, setTherapistView] = useState<'cases' | 'hub' | 'caseDetail' | 'archive'>('cases');
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
    setMounted(true);
    setTheoristsOpen(true);
    setIsLocalhost(window.location.hostname === 'localhost');
    // BW-111 — production persona is SERVER-GATED by allowlist (/api/me), not a public choice.
    // Fail-closed: patient by default; only an allowlisted account resolves to therapist.
    (window as any).__resolvePersona = async () => {
      try {
        const gh = (window as any).getAuthHeaders;
        const headers = gh ? await gh() : {};
        const r = await fetch('/api/me', { headers });
        const d = await r.json();
        const p = d?.isTherapist ? 'therapist' : 'patient';
        setProdPersona(p);
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
    };
    window.addEventListener('holdtheoristchange', handleTheoristChange);
    return () => window.removeEventListener('holdtheoristchange', handleTheoristChange);
  }, []);

  const isHe = currentLang === 'he';
  const isDev = process.env.NODE_ENV !== 'production';
  // Local preview uses the dev tabs; production follows the login choice.
  const activePersona = isLocalhost ? devPersona : prodPersona;

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
  const startConsultation = async () => {
    const key = hubTheorists[0];
    if (!key) return;
    const material = consultText.trim();
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
      const r = await fetch('/api/analyze-note', { method: 'POST', headers, body: JSON.stringify({ text: t, mode: activePersona, gender }) });
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
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
        {body}
      </div>
    );
    const txt = (s: string) => <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{s}</div>;
    return (
      <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12 }}>
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
    : ['freud','klein','winnicott','ogden'];
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

          {/* BW-111 — persona is SERVER-GATED by allowlist (/api/me), not a public self-select.
              The old "מי אתה/את?" toggle was removed: therapist access is derived from the account
              after login, not chosen on the auth screen. Patient is the default for everyone else. */}

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
      <div id="sidebar" className={`persona-${activePersona}`}>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* BW-104 — dev-only persona preview tabs. Never rendered in production.
              height matches the main header (67px) so the tab underline shares the header's baseline. */}
          {isLocalhost && (
            <div style={{ height: 67, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
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
          <div style={{ padding: '10px 8px 6px', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* end-session moved out of sidebar — appears inline at bottom of chat */}
            <div className="sb-item" data-persona="both" onClick={() => (window as any).newChat()}>
              <span className="sb-icon"><PenLine size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-new-chat-label">שיחה חדשה</span>
            </div>
            <div className="sb-item" data-persona="therapist" onClick={() => (window as any).toggleWebSearch()} id="sb-websearch-btn" title="חיפוש באינטרנט">
              <span className="sb-icon"><Globe size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-websearch-label">חיפוש רשת: כבוי</span>
            </div>
            {/* BW-113 — therapist "Archive" = archived cases (patients), not conversation memory. */}
            <div className="sb-item" data-persona="therapist" onClick={() => { (window as any).bwExitChatToHome?.(); setTherapistView('archive'); setArchivedLoaded(false); }}>
              <span className="sb-icon"><Brain size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-memories-label">ארכיון</span>
            </div>
            <div className="sb-item" data-persona="patient" onClick={() => (window as any).openWriteArchive?.()}>
              <span className="sb-icon"><ScrollText size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-write-archive-label">{currentLang === 'he' ? 'מה כתבתי' : 'What I wrote'}</span>
            </div>
            <div className="sb-item" data-persona="both" onClick={() => (window as any).exportPDF()}>
              <span className="sb-icon"><Download size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-pdf-label">הורד PDF</span>
            </div>
            <div className="sb-item" data-persona="therapist" onClick={() => { (window as any).bwExitChatToHome?.(); setTherapistView('cases'); setCasesLoaded(false); }}>
              <span className="sb-icon"><ScrollText size={15} strokeWidth={1.75} /></span>
              <span className="sb-label">המקרים שלי</span>
            </div>
            <div className="sb-item" data-persona="therapist" onClick={() => (window as any).openSessionSummary()}>
              <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>◎</span>
              <span className="sb-label" id="sb-summary-label">סיכום התייעצות</span>
            </div>
            <div id="sb-write-summary-btn" className="sb-item" data-persona="patient" onClick={() => (window as any).openWriteSummary()} style={{ display: 'none' }}>
              <span className="sb-icon"><NotebookPen size={15} strokeWidth={1.75} /></span>
              <span className="sb-label" id="sb-write-summary-label">סיכום לכתיבה</span>
            </div>
            {/* BW-113 — מחקר חזר לסייד-בר כפריט עצמאי (לא קשור למקרה). */}
            {isLocalhost && (
              <div className="sb-item" data-persona="therapist" onClick={() => (window as any).enterExploreModeFromSidebar?.()}>
                <span className="sb-icon"><BookOpen size={15} strokeWidth={1.75} /></span>
                <span className="sb-label">מחקר</span>
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
          <div data-persona="therapist" style={{ borderTop: '1px solid var(--border)', padding: '6px 8px 4px' }}>
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
                style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 11, padding: 14, margin: '-12px -8px', borderRadius: 6, fontFamily: 'var(--font-rubik), sans-serif', fontWeight: 500, letterSpacing: '0.04em', transition: 'color 0.15s', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
              >
                <Globe size={16} strokeWidth={1.6} />
              </div>
            </div>
            <h1 dir="ltr" style={{ direction: 'ltr' }} suppressHydrationWarning>Between</h1>
            <div style={{ flexShrink: 0, minWidth: 80, display: 'flex', justifyContent: 'flex-end' }}>
              {/* שיחת היכרות (intake) — patient onboarding only; not rendered for therapists (BW-112). */}
              {activePersona === 'patient' && (
              <div id="header-intake-btn" onClick={() => (window as any).startIntake()} style={{ display: 'none', cursor: 'pointer', fontSize: 12, color: '#fff', background: 'var(--accent-deep)', borderRadius: 20, padding: '6px 16px', fontFamily: 'var(--font-rubik), sans-serif', fontWeight: 500, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
                שיחת היכרות
              </div>
              )}
            </div>
          </div>
          <div className="header-session">
            <div id="session-title" style={{ display: 'none' }}></div>
            <div style={{ flex: 1 }}></div>
            <div className="session-actions">
              {/* intake btn moved to header-top right slot; clinical-btn accessible via sidebar only */}
            </div>
          </div>
        </header>


        <div id="chat">
          {mounted && (
            <div className="welcome" id="welcome">
              {/* BW-41: back button — top-left corner of content area */}
              <span id="bw-back-btn" onClick={() => (window as any).goBackToChat()} style={{ position: 'absolute', top: 20, left: 24, fontSize: 12, color: 'var(--muted)', cursor: 'pointer', opacity: 0.7, display: 'none' }}>← חזרה</span>
              {/* Hold entry — patient only (therapist lands on direct conversation, no Hold) */}
              {activePersona === 'patient' && (
              <div id="bw-mode-select" style={{ flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
                <p id="bw-hold-heading" style={{ fontFamily: 'var(--font-assistant), sans-serif', fontSize: 19, fontWeight: 400, color: 'var(--text)', margin: 0, alignSelf: 'flex-start' }}>{isHe ? 'מה נשאר איתך?' : 'What stayed with you?'}</p>
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
                          pointerEvents: 'none', userSelect: 'none', lineHeight: 1.6,
                        }}
                      >
                        {isHe ? 'כתוב לעצמך או למטפל שלך או להביא לפגישה הבאה' : 'Write for yourself, for your therapist, or to bring to your next session.'}
                      </span>
                    )}
                  </div>
                  {/* Footer: mic + quiet save — row-reverse in RTL puts mic on the right */}
                  <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexDirection: isHe ? 'row-reverse' : 'row' }}>
                    <button
                      onClick={handleToggleVoice}
                      className={isRecording ? 'bw-mic-recording' : ''}
                      title={isHe ? 'הקלטה קולית' : 'Voice input'}
                      style={{
                        width: 44, height: 44, borderRadius: '50%', border: 'none', padding: 0,
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
                        background: 'transparent', border: 'none', padding: 0, height: 44,
                        cursor: holdText.trim() ? 'pointer' : 'default',
                        opacity: holdText.trim() ? 1 : 0.4,
                        display: 'inline-flex', alignItems: 'center',
                        transition: 'opacity 0.15s', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        border: '1px solid var(--muted)', borderRadius: 16, height: 30, padding: '0 12px',
                        fontSize: 11, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--text)',
                        display: 'inline-flex', alignItems: 'center',
                      }}>
                        {isHe ? 'סיכום כתיבה' : 'Writing summary'}
                      </span>
                    </button>
                    <button
                      onClick={handleHoldSave}
                      disabled={!holdText.trim()}
                      style={{
                        background: 'transparent', border: 'none', padding: 0, height: 44,
                        cursor: holdText.trim() ? 'pointer' : 'default',
                        opacity: holdText.trim() ? 1 : 0.4,
                        display: 'inline-flex', alignItems: 'center',
                        transition: 'opacity 0.15s', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        border: '1px solid var(--muted)', borderRadius: 16, height: 30, padding: '0 12px',
                        fontSize: 11, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--text)',
                        display: 'inline-flex', alignItems: 'center',
                      }}>
                        {isHe ? 'שמור' : 'Save'}
                      </span>
                    </button>
                  </div>
                  {/* Talk button removed: patient mode is Hold-only (no live conversation);
                      therapist gets a direct conversation entry instead of the Hold card. */}
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-rubik), sans-serif', margin: 0, width: '100%', textAlign: isHe ? 'right' : 'left' }}>
                  {isHe ? 'סמן טקסט כדי לסמן פרטי — לפני שמשתפים.' : 'Highlight text to mark private — before sharing.'}
                </p>
                {holdSaveStatus === 'saved' && (
                  <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', margin: 0 }}>{isHe ? 'נשמר.' : 'Saved.'}</p>
                )}
              </div>
              )}
              {/* BW-113 — therapist case-first landing: "My Cases". */}
              {activePersona === 'therapist' && therapistView === 'cases' && (
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
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '40px 0', lineHeight: 1.7 }}>{isHe ? 'עדיין אין מקרים. צרי מקרה ראשון כדי להתחיל לארגן התייעצויות.' : 'No cases yet. Create your first case to start organizing consultations.'}</p>
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
                <span onClick={() => { setTherapistView('cases'); setCasesLoaded(false); }} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', display: 'inline-block', marginBottom: 14 }}>{isHe ? '← המקרים שלי' : '← My cases'}</span>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 24, color: 'var(--text)', margin: 0 }}>{selectedCase.label}</h2>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button onClick={consultFromCase} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 22, padding: '8px 18px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', cursor: 'pointer' }}>{isHe ? '+ התייעצות על המקרה' : '+ Consult on the case'}</button>
                  </div>
                </div>
                {/* BW-116 — daily update section */}
                <div style={{ marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{isHe ? 'עדכון פגישה' : 'Session note'}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <textarea
                      value={dailyText}
                      onChange={e => setDailyText(e.target.value)}
                      placeholder={isHe ? 'מה עלה היום? כתבי עדכון על המקרה…' : "What came up today? Write a case update…"}
                      style={{ flex: 1, minHeight: 80, boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', outline: 'none' }}
                    />
                    <button
                      onClick={handleDailyVoice}
                      title={isDailyRecording ? (isHe ? 'עצור הקלטה' : 'Stop recording') : (isHe ? 'הקלט קול' : 'Record voice')}
                      style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 20, border: '1px solid var(--border)', background: isDailyRecording ? 'var(--accent-soft)' : 'var(--surface)', color: isDailyRecording ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                      <Mic size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>{isHe ? 'נשמר על המכשיר שלך. לא אצלנו.' : 'Saved on your device. Not with us.'}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      disabled={!dailyText.trim()}
                      onClick={saveDailyUpdate}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 22, padding: '7px 16px', fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: dailyText.trim() ? 'var(--text)' : 'var(--muted)', cursor: dailyText.trim() ? 'pointer' : 'default', opacity: dailyText.trim() ? 1 : 0.5 }}>
                      {isHe ? 'שמור' : 'Save'}
                    </button>
                    <button
                      disabled={!dailyText.trim() || analyzingNoteId === 'draft'}
                      onClick={() => analyzeNote(dailyText, 'draft')}
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 22, padding: '7px 16px', fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: dailyText.trim() ? 'var(--accent)' : 'var(--muted)', cursor: dailyText.trim() ? 'pointer' : 'default', opacity: dailyText.trim() ? 1 : 0.5 }}>
                      {isHe ? 'נתח' : 'Analyze'}
                    </button>
                    <button
                      disabled={!dailyText.trim()}
                      onClick={() => consultFromText(dailyText)}
                      style={{ background: dailyText.trim() ? 'var(--accent)' : 'var(--border)', border: 'none', borderRadius: 22, padding: '7px 16px', fontSize: 12, fontFamily: 'var(--font-rubik), sans-serif', color: dailyText.trim() ? '#fff' : 'var(--muted)', cursor: dailyText.trim() ? 'pointer' : 'default' }}>
                      {isHe ? 'התייעץ' : 'Consult'}
                    </button>
                  </div>
                  {renderNoteAnalysis('draft')}
                </div>
                {/* BW-116 — past updates from localStorage */}
                {caseUpdates.length > 0 && (
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
                {consultations.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '40px 0', lineHeight: 1.7 }}>{isHe ? 'עדיין אין התייעצויות במקרה הזה.' : 'No consultations in this case yet.'}</p>
                ) : (
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
                const HUB_THEORISTS: [string, string][] = [['freud', 'פרויד'], ['klein', 'קליין'], ['winnicott', 'ויניקוט'], ['ogden', 'אוגדן']];
                const chipStyle = (on: boolean): React.CSSProperties => ({
                  border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 22, padding: '7px 16px', fontSize: 13, cursor: 'pointer',
                  color: on ? '#fff' : 'var(--text)', background: on ? 'var(--accent)' : 'var(--surface)',
                });
                return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <button onClick={() => setTherapistView(selectedCase ? 'caseDetail' : 'cases')} style={{ alignSelf: 'flex-start', background: 'none', border: '1px solid var(--border)', borderRadius: 22, padding: '6px 14px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', color: 'var(--text)', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: 'var(--accent)' }}>←</span>{selectedCase ? selectedCase.label : (isHe ? 'המקרים שלי' : 'My cases')}</button>
                  <p style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', fontSize: 24, color: 'var(--text)', margin: '0 0 16px' }}>{isHe ? 'נחשוב על זה יחד.' : "Let's think this through together."}</p>
                  <textarea value={consultText} onChange={e => setConsultText(e.target.value)} placeholder={isHe ? 'מה עלה בפגישה? כתבי את החומר להתייעצות (יאונמז לפני שמירה)…' : 'What came up in the session? Write the material to consult on…'} style={{ width: '100%', maxWidth: 560, minHeight: 90, boxSizing: 'border-box', border: '1px solid var(--border)', borderRadius: 16, padding: '12px 16px', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical', marginBottom: 20 }} />
                  <div className="hub-helpcap">{isHe ? <>תיאורטיקן <b>אחד</b> — קול אחד, לעומק.<br/>כמה תיאורטיקנים — שולחן עגול, כל אחד מהמקום שלו.</> : <>One theorist — one voice, in depth.<br/>Several — a round table, each from their own place.</>}</div>
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
                    const canProceed = hubTheorists.length === 1;
                    const label = canProceed ? (isHe ? 'המשך להתייעצות' : 'Continue to consultation') : (isHe ? 'שולחן עגול — בקרוב' : 'Round table — coming soon');
                    return (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                        <button disabled={!canProceed}
                          onClick={canProceed ? startConsultation : undefined}
                          style={{ padding: '10px 28px', borderRadius: 22, border: 'none', fontSize: 13, fontFamily: 'var(--font-rubik), sans-serif', background: canProceed ? 'var(--accent)' : 'var(--border)', color: canProceed ? '#fff' : 'var(--muted)', cursor: canProceed ? 'pointer' : 'default' }}>
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
          <div style={{ background: 'var(--surface, #fffaf8)', border: '1px solid var(--border, #e6d6cf)', borderRadius: 16, padding: 32, maxWidth: 380, width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(196,96,122,0.12)' }}>
            <div style={{ fontSize: 32, color: '#c4607a', opacity: 0.3, marginBottom: 12, fontFamily: 'var(--font-cormorant), serif' }}>ψ</div>
            <h3 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 20, fontWeight: 300, fontStyle: 'italic', color: '#c4607a', marginBottom: 10 }}>בחרי תיאורטיקאי</h3>
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
