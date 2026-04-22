'use client';
import { useState, useEffect } from 'react';
import { PenLine, Globe, Brain, Settings, LogOut, Languages, Sofa, Download, ChevronDown, BookOpen } from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [theoristsOpen, setTheoristsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; top: number; left: number; flip: boolean } | null>(null);
  const [sessionTip, setSessionTip] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const [currentLang, setCurrentLang] = useState('he');

  const THEORIST_CARDS: Record<string, Record<string, { approach: string; concepts: string; forWhom: string }>> = {
    freud: {
      he: { approach: 'ארכיאולוגיה של הנפש — מה נדחק, מה חוזר, מה מסתתר מאחורי המילים', concepts: 'דחף, עיכוב, העברה, התנגדות, חלום', forWhom: 'מי שרוצה להבין שורשים, תסמינים חוזרים, או פשר של מה שלא מובן' },
      en: { approach: 'Archaeology of the mind — what is repressed, what returns, what hides behind words', concepts: 'Drive, repression, transference, resistance, dream', forWhom: 'Those seeking to understand roots, recurring patterns, or the meaning of what is unclear' },
      de: { approach: 'Archäologie des Geistes — was verdrängt wird, was wiederkehrt, was sich hinter Worten verbirgt', concepts: 'Trieb, Verdrängung, Übertragung, Widerstand, Traum', forWhom: 'Wer Wurzeln, wiederkehrende Muster oder Verborgenes verstehen möchte' },
      es: { approach: 'Arqueología de la mente — lo reprimido, lo que regresa, lo que se oculta tras las palabras', concepts: 'Pulsión, represión, transferencia, resistencia, sueño', forWhom: 'Quien busca comprender raíces, patrones repetitivos o lo que permanece oscuro' },
      fr: { approach: 'Archéologie de l\'esprit — ce qui est refoulé, ce qui revient, ce qui se cache derrière les mots', concepts: 'Pulsion, refoulement, transfert, résistance, rêve', forWhom: 'Ceux qui cherchent à comprendre les racines, les répétitions ou ce qui reste obscur' },
      ru: { approach: 'Археология психики — вытесненное, возвращающееся, скрытое за словами', concepts: 'Влечение, вытеснение, перенос, сопротивление, сон', forWhom: 'Тем, кто хочет понять корни, повторяющиеся паттерны или смысл непонятного' },
      it: { approach: 'Archeologia della mente — ciò che è rimosso, ciò che ritorna, ciò che si nasconde dietro le parole', concepts: 'Pulsione, rimozione, transfert, resistenza, sogno', forWhom: 'Chi vuole comprendere radici, sintomi ricorrenti o il senso di ciò che resta oscuro' },
    },
    klein: {
      he: { approach: 'עולם פנימי של אובייקטים — אהבה ושנאה, פיצול ואיחוד, מה שלא ניתן לעכל', concepts: 'קנאה, פיצול, השלכה, אובייקט טוב ורע', forWhom: 'מי שרוצה לעבוד עם רגשות עזים, קשיי קרבה, חרדות עמוקות' },
      en: { approach: 'Inner world of objects — love and hate, splitting and integration, what cannot be digested', concepts: 'Envy, splitting, projection, good and bad object', forWhom: 'Those working with intense emotions, difficulty with closeness, or deep anxieties' },
      de: { approach: 'Innere Welt der Objekte — Liebe und Hass, Spaltung und Integration, was nicht verarbeitet werden kann', concepts: 'Neid, Spaltung, Projektion, gutes und böses Objekt', forWhom: 'Wer mit intensiven Gefühlen, Nähe-Problemen oder tiefen Ängsten arbeiten möchte' },
      es: { approach: 'Mundo interno de objetos — amor y odio, escisión e integración, lo que no puede digerirse', concepts: 'Envidia, escisión, proyección, objeto bueno y malo', forWhom: 'Quienes trabajan con emociones intensas, dificultades con la cercanía o ansiedades profundas' },
      fr: { approach: 'Monde intérieur d\'objets — amour et haine, clivage et intégration, ce qui ne peut être digéré', concepts: 'Envie, clivage, projection, bon et mauvais objet', forWhom: 'Ceux qui travaillent avec des émotions intenses, des difficultés de proximité ou des angoisses profondes' },
      ru: { approach: 'Внутренний мир объектов — любовь и ненависть, расщепление и интеграция', concepts: 'Зависть, расщепление, проекция, хороший и плохой объект', forWhom: 'Тем, кто работает с интенсивными чувствами, трудностями близости или глубокими тревогами' },
      it: { approach: 'Mondo interno degli oggetti — amore e odio, scissione e integrazione, ciò che non può essere digerito', concepts: 'Invidia, scissione, proiezione, oggetto buono e cattivo', forWhom: 'Chi vuole lavorare con emozioni intense, difficoltà di intimità o ansie profonde' },
    },
    winnicott: {
      he: { approach: 'המרחב שבין — משחק, החזקה, ה"אני" האמיתי שמחפש לצאת', concepts: 'סביבה מאפשרת, עצמי אמיתי ומזויף, אובייקט מעבר', forWhom: 'מי שמרגיש שמתפקד אבל לא ממש חי, מי שמחפש מרחב ולא פרשנות' },
      en: { approach: 'The in-between space — play, holding, the true self seeking to emerge', concepts: 'Facilitating environment, true and false self, transitional object', forWhom: 'Those who feel they function but are not really alive, seeking space rather than interpretation' },
      de: { approach: 'Der Zwischenraum — Spiel, Halten, das wahre Selbst, das hervortreten möchte', concepts: 'Ermöglichende Umgebung, wahres und falsches Selbst, Übergangsobjekt', forWhom: 'Wer sich funktionierend aber nicht wirklich lebendig fühlt, wer Raum statt Interpretation sucht' },
      es: { approach: 'El espacio intermedio — juego, sostén, el self verdadero que busca emerger', concepts: 'Ambiente facilitador, self verdadero y falso, objeto transicional', forWhom: 'Quienes sienten que funcionan pero no viven plenamente, quienes buscan espacio en lugar de interpretación' },
      fr: { approach: 'L\'espace intermédiaire — jeu, contenance, le vrai self cherchant à émerger', concepts: 'Environnement facilitateur, vrai et faux self, objet transitionnel', forWhom: 'Ceux qui se sentent fonctionner mais pas vraiment vivants, cherchant un espace plutôt qu\'une interprétation' },
      ru: { approach: 'Промежуточное пространство — игра, удержание, истинное «я», стремящееся выйти', concepts: 'Облегчающая среда, истинное и ложное «я», переходный объект', forWhom: 'Тем, кто функционирует, но не чувствует себя живым; ищущим пространство, а не интерпретацию' },
      it: { approach: 'Lo spazio intermedio — gioco, holding, il sé autentico che cerca di emergere', concepts: 'Ambiente facilitante, sé vero e falso, oggetto transizionale', forWhom: 'Chi si sente funzionante ma non davvero vivo, chi cerca spazio anziché interpretazione' },
    },
    ogden: {
      he: { approach: 'מה שנוצר בין שני האנשים בחדר — לא בתוך האחד ולא בתוך האחר', concepts: 'שלישי אנליטי, רווריה, חלימה משותפת', forWhom: 'מי שרוצה לעבוד עם הדינמיקה בין מטפל למטופל, שפה ותהליך יצירתי' },
      en: { approach: 'What is created between the two people in the room — belonging to neither alone', concepts: 'Analytic third, reverie, co-dreaming', forWhom: 'Those interested in the therapist-patient dynamic, language, and creative process' },
      de: { approach: 'Was zwischen den zwei Menschen im Raum entsteht — keinem allein gehörend', concepts: 'Analytisches Drittes, Reverie, gemeinsames Träumen', forWhom: 'Wer sich für die Therapeut-Patient-Dynamik, Sprache und kreative Prozesse interessiert' },
      es: { approach: 'Lo que se crea entre las dos personas en la sala — sin pertenecer a ninguno', concepts: 'Tercero analítico, ensoñación, co-soñar', forWhom: 'Quienes se interesan por la dinámica terapeuta-paciente, el lenguaje y el proceso creativo' },
      fr: { approach: 'Ce qui se crée entre les deux personnes dans la pièce — n\'appartenant à aucun seul', concepts: 'Tiers analytique, rêverie, co-rêverie', forWhom: 'Ceux intéressés par la dynamique thérapeute-patient, le langage et le processus créatif' },
      ru: { approach: 'То, что создаётся между двумя людьми в комнате — не принадлежащее ни одному', concepts: 'Аналитическая третья сторона, ревери, совместное сновидение', forWhom: 'Тем, кто интересуется динамикой терапевт-пациент, языком и творческим процессом' },
      it: { approach: 'Ciò che si crea tra le due persone nella stanza — non appartenendo a nessuna delle due', concepts: 'Terzo analitico, reverie, sognare insieme', forWhom: 'Chi è interessato alla dinamica terapeuta-paziente, al linguaggio e al processo creativo' },
    },
    loewald: {
      he: { approach: 'הקשר עצמו כגורם המרפא — האנליטיקאי כדמות הורית חדשה', concepts: 'הפנמה, זמן נפשי, אובייקט חדש, רצח אב כהכרח התפתחותי', forWhom: 'מי שמתעניין בממשק בין פרויד לרלציוניים, שינוי לאורך זמן' },
      en: { approach: 'The relationship itself as the healing force — the analyst as a new parental figure', concepts: 'Internalization, psychic time, new object, parricide as developmental necessity', forWhom: 'Those interested in the bridge between Freud and relational approaches, change over time' },
      de: { approach: 'Die Beziehung selbst als heilende Kraft — der Analytiker als neue elterliche Figur', concepts: 'Internalisierung, psychische Zeit, neues Objekt, Vatermord als Entwicklungsnotwendigkeit', forWhom: 'Wer sich für die Brücke zwischen Freud und relationalen Ansätzen interessiert' },
      es: { approach: 'La relación misma como fuerza curativa — el analista como nueva figura parental', concepts: 'Internalización, tiempo psíquico, objeto nuevo, parricidio como necesidad del desarrollo', forWhom: 'Quienes se interesan por el puente entre Freud y los enfoques relacionales, el cambio a lo largo del tiempo' },
      fr: { approach: 'La relation elle-même comme force guérissante — l\'analyste comme nouvelle figure parentale', concepts: 'Intériorisation, temps psychique, nouvel objet, parricide comme nécessité développementale', forWhom: 'Ceux intéressés par le pont entre Freud et les approches relationnelles, le changement dans le temps' },
      ru: { approach: 'Сами отношения как исцеляющая сила — аналитик как новая родительская фигура', concepts: 'Интернализация, психическое время, новый объект, отцеубийство как необходимость развития', forWhom: 'Тем, кто интересуется мостом между Фрейдом и реляционными подходами, изменением во времени' },
      it: { approach: 'La relazione stessa come forza guaritrice — l\'analista come nuova figura genitoriale', concepts: 'Internalizzazione, tempo psichico, oggetto nuovo, parricidio come necessità evolutiva', forWhom: 'Chi è interessato al ponte tra Freud e gli approcci relazionali, il cambiamento nel tempo' },
    },
    bion: {
      he: { approach: 'מה שעדיין לא ניתן לחשוב — כיצד רגשות הופכים לניתנים לעיכול', concepts: 'אלפא ובטא, מכיל-מוכל, O, ללא זיכרון וללא רצון', forWhom: 'מי שעובד עם מצבים קשים לניסוח, חוויות כאוטיות, גבולות החשיבה' },
      en: { approach: 'What cannot yet be thought — how emotions become thinkable', concepts: 'Alpha and beta elements, container-contained, O, without memory or desire', forWhom: 'Those working with hard-to-articulate states, chaotic experience, or the limits of thinking' },
      de: { approach: 'Was noch nicht gedacht werden kann — wie Gefühle denkbar werden', concepts: 'Alpha- und Beta-Elemente, Container-Contained, O, ohne Gedächtnis und Wunsch', forWhom: 'Wer mit schwer artikulierbaren Zuständen, chaotischer Erfahrung oder den Grenzen des Denkens arbeitet' },
      es: { approach: 'Lo que aún no puede pensarse — cómo las emociones se vuelven pensables', concepts: 'Elementos alfa y beta, contenedor-contenido, O, sin memoria ni deseo', forWhom: 'Quienes trabajan con estados difíciles de articular, experiencias caóticas o los límites del pensamiento' },
      fr: { approach: 'Ce qui ne peut pas encore être pensé — comment les émotions deviennent pensables', concepts: 'Éléments alpha et bêta, contenant-contenu, O, sans mémoire ni désir', forWhom: 'Ceux travaillant avec des états difficiles à articuler, des expériences chaotiques ou les limites de la pensée' },
      ru: { approach: 'То, что ещё не может быть помыслено — как эмоции становятся мыслимыми', concepts: 'Альфа и бета-элементы, контейнер-содержимое, O, без памяти и желания', forWhom: 'Тем, кто работает с труднопередаваемыми состояниями, хаотическим опытом или пределами мышления' },
      it: { approach: 'Ciò che ancora non può essere pensato — come le emozioni diventano pensabili', concepts: 'Elementi alfa e beta, contenitore-contenuto, O, senza memoria né desiderio', forWhom: 'Chi lavora con stati difficili da articolare, esperienze caotiche o i limiti del pensiero' },
    },
    kohut: {
      he: { approach: 'הצורך להרגיש מובן — לא לפרש, אלא לקלוט מבפנים', concepts: 'עצמי, אובייקט-עצמי, שיקוף, אידיאליזציה, חרדת פירוק', forWhom: 'מי שמרגיש שלא נראה, פגיעות נרקיסיסטית, אמפתיה כמתודה' },
      en: { approach: 'The need to feel understood — not to interpret, but to receive from within', concepts: 'Self, selfobject, mirroring, idealization, disintegration anxiety', forWhom: 'Those who feel unseen, dealing with narcissistic vulnerability, or seeking empathy as method' },
      de: { approach: 'Das Bedürfnis, verstanden zu werden — nicht interpretieren, sondern von innen aufnehmen', concepts: 'Selbst, Selbstobjekt, Spiegelung, Idealisierung, Desintegrationsangst', forWhom: 'Wer sich unsichtbar fühlt, mit narzisstischer Verletzlichkeit oder Empathie als Methode arbeitet' },
      es: { approach: 'La necesidad de sentirse comprendido — no interpretar, sino recibir desde adentro', concepts: 'Self, objeto del self, reflejo, idealización, angustia de desintegración', forWhom: 'Quienes se sienten invisibles, con vulnerabilidad narcisista, o buscan la empatía como método' },
      fr: { approach: 'Le besoin de se sentir compris — non pas interpréter, mais recevoir de l\'intérieur', concepts: 'Self, objet-self, miroir, idéalisation, angoisse de désintégration', forWhom: 'Ceux qui se sentent invisibles, avec une vulnérabilité narcissique, ou cherchant l\'empathie comme méthode' },
      ru: { approach: 'Потребность чувствовать себя понятым — не интерпретировать, а воспринимать изнутри', concepts: 'Самость, самообъект, зеркалирование, идеализация, тревога дезинтеграции', forWhom: 'Тем, кто чувствует себя невидимым, имеет нарциссическую уязвимость или ищет эмпатию как метод' },
      it: { approach: 'Il bisogno di sentirsi compresi — non interpretare, ma ricevere dall\'interno', concepts: 'Sé, oggetto-sé, mirroring, idealizzazione, angoscia di disintegrazione', forWhom: 'Chi si sente invisibile, con vulnerabilità narcisistica, o cerca l\'empatia come metodo' },
    },
    heimann: {
      he: { approach: 'מה שהמפגש מעורר במטפל — הקאונטרטרנספרנס כמכשיר הידע המרכזי', concepts: 'קאונטרטרנספרנס, מה שמושלך לתוך המטפל', forWhom: 'מי שמתעניין בתהליכים שקורים במטפל, סופרוויזיה, עיבוד פנימי' },
      en: { approach: 'What the encounter stirs in the therapist — countertransference as the central instrument of knowing', concepts: 'Countertransference, what is projected into the therapist', forWhom: 'Those interested in processes within the therapist, supervision, internal processing' },
      de: { approach: 'Was die Begegnung im Therapeuten auslöst — Gegenübertragung als zentrales Erkenntnisinstrument', concepts: 'Gegenübertragung, was in den Therapeuten projiziert wird', forWhom: 'Wer sich für Prozesse im Therapeuten interessiert, Supervision, innere Verarbeitung' },
      es: { approach: 'Lo que el encuentro despierta en el terapeuta — la contratransferencia como instrumento central de conocimiento', concepts: 'Contratransferencia, lo que se proyecta en el terapeuta', forWhom: 'Quienes se interesan por los procesos en el terapeuta, supervisión, procesamiento interno' },
      fr: { approach: 'Ce que la rencontre éveille chez le thérapeute — le contre-transfert comme instrument central de connaissance', concepts: 'Contre-transfert, ce qui est projeté dans le thérapeute', forWhom: 'Ceux intéressés par les processus chez le thérapeute, la supervision, le traitement interne' },
      ru: { approach: 'То, что встреча пробуждает в терапевте — контрперенос как центральный инструмент познания', concepts: 'Контрперенос, то, что проецируется в терапевта', forWhom: 'Тем, кто интересуется процессами внутри терапевта, супервизией, внутренней переработкой' },
      it: { approach: 'Ciò che l\'incontro suscita nel terapeuta — il controtransfert come strumento centrale di conoscenza', concepts: 'Controtransfert, ciò che viene proiettato nel terapeuta', forWhom: 'Chi è interessato ai processi nel terapeuta, alla supervisione, all\'elaborazione interna' },
    },
  };
  const CARD_LABELS: Record<string, { approach: string; concepts: string; forWhom: string }> = {
    he: { approach: 'גישה', concepts: 'מושגים', forWhom: 'מתאים ל' },
    en: { approach: 'Approach', concepts: 'Concepts', forWhom: 'For whom' },
    de: { approach: 'Ansatz', concepts: 'Konzepte', forWhom: 'Für wen' },
    es: { approach: 'Enfoque', concepts: 'Conceptos', forWhom: 'Para quién' },
    fr: { approach: 'Approche', concepts: 'Concepts', forWhom: 'Pour qui' },
    ru: { approach: 'Подход', concepts: 'Понятия', forWhom: 'Для кого' },
    it: { approach: 'Approccio', concepts: 'Concetti', forWhom: 'Per chi' },
  };
  const THEORIST_NAMES_I18N: Record<string, Record<string, string>> = {
    freud:    { he: 'פרויד',  en: 'Freud',    de: 'Freud',    es: 'Freud',    fr: 'Freud',    ru: 'Фрейд',  it: 'Freud'    },
    klein:    { he: 'קליין',  en: 'Klein',    de: 'Klein',    es: 'Klein',    fr: 'Klein',    ru: 'Кляйн',  it: 'Klein'    },
    winnicott:{ he: 'ויניקוט',en: 'Winnicott',de: 'Winnicott',es: 'Winnicott',fr: 'Winnicott',ru: 'Винникотт',it: 'Winnicott'},
    ogden:    { he: 'אוגדן',  en: 'Ogden',    de: 'Ogden',    es: 'Ogden',    fr: 'Ogden',    ru: 'Огден',  it: 'Ogden'    },
    loewald:  { he: 'לוואלד', en: 'Loewald',  de: 'Loewald',  es: 'Loewald',  fr: 'Loewald',  ru: 'Лёвальд',it: 'Loewald'  },
    bion:     { he: 'ביון',   en: 'Bion',     de: 'Bion',     es: 'Bion',     fr: 'Bion',     ru: 'Бион',   it: 'Bion'     },
    kohut:    { he: 'קוהוט',  en: 'Kohut',    de: 'Kohut',    es: 'Kohut',    fr: 'Kohut',    ru: 'Кохут',  it: 'Kohut'    },
    heimann:  { he: 'היימן',  en: 'Heimann',  de: 'Heimann',  es: 'Heimann',  fr: 'Heimann',  ru: 'Хайманн',it: 'Heimann'  },
  };
  const SESSION_TIP_I18N: Record<string, { title: string; text: string }> = {
    he: { title: 'מצב סשן קליני', text: 'התיאורטיקן הנבחר יגיב כאנליטיקאי בשיחה — לא כמרצה. מתאים להבאת חומר קליני, חלומות, או מצבים אישיים.' },
    en: { title: 'Clinical Session Mode', text: 'The selected theorist responds as an analyst in conversation — not as a lecturer. Suitable for clinical material, dreams, or personal situations.' },
    de: { title: 'Klinischer Sitzungsmodus', text: 'Der ausgewählte Theoretiker antwortet als Analytiker — nicht als Dozent. Geeignet für klinisches Material, Träume oder persönliche Situationen.' },
    es: { title: 'Modo de sesión clínica', text: 'El teórico seleccionado responde como analista — no como conferenciante. Adecuado para material clínico, sueños o situaciones personales.' },
    fr: { title: 'Mode session clinique', text: 'Le théoricien sélectionné répond comme analyste — pas comme conférencier. Adapté au matériel clinique, aux rêves ou aux situations personnelles.' },
    ru: { title: 'Режим клинической сессии', text: 'Выбранный теоретик отвечает как аналитик — не как лектор. Подходит для клинического материала, сновидений или личных ситуаций.' },
    it: { title: 'Modalità sessione clinica', text: 'Il teorico selezionato risponde come analista — non come docente. Adatto per materiale clinico, sogni o situazioni personali.' },
  };
  const WELCOME_I18N: Record<string, { apiText: string; privacyLink: string }> = {
    he: { apiText: 'השיחות מעובדות דרך ממשק ה-API של אנתרופיק ואינן נשמרות על ידינו ואינן משמשות לאימון מודלים.', privacyLink: 'מדיניות פרטיות' },
    en: { apiText: "Conversations are processed through Anthropic's API and are not stored by us or used for model training.", privacyLink: 'Privacy Policy' },
    de: { apiText: 'Gespräche werden über die API von Anthropic verarbeitet und weder von uns gespeichert noch für das Modelltraining verwendet.', privacyLink: 'Datenschutzrichtlinie' },
    es: { apiText: 'Las conversaciones se procesan a través de la API de Anthropic y no son almacenadas por nosotros ni usadas para el entrenamiento de modelos.', privacyLink: 'Política de privacidad' },
    fr: { apiText: "Les conversations sont traitées via l'API d'Anthropic et ne sont pas stockées par nous ni utilisées pour entraîner des modèles.", privacyLink: 'Politique de confidentialité' },
    ru: { apiText: 'Разговоры обрабатываются через API Anthropic, не хранятся нами и не используются для обучения моделей.', privacyLink: 'Политика конфиденциальности' },
    it: { apiText: "Le conversazioni vengono elaborate tramite l'API di Anthropic e non sono conservate da noi né utilizzate per addestrare i modelli.", privacyLink: 'Informativa sulla privacy' },
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
    de: {
      title: 'Datenschutzrichtlinie',
      paragraphs: [
        { label: 'Gespräche', text: 'Werden ausschließlich über die API von Anthropic verarbeitet. Werden nicht von uns gespeichert und nicht für Modelltraining verwendet.' },
        { label: 'Gedächtnis', text: 'Wird nur lokal in Ihrem Browser gespeichert. Wir können es weder sehen noch speichern.' },
        { label: 'Wissensdatenbank', text: 'Auszüge aus der psychoanalytischen Literatur werden nur als Zahlen für Suchzwecke gespeichert. Ihr Gesprächsinhalt wird dort nicht gespeichert.' },
        { label: 'Identität', text: 'Keine Speicherung von IP-Adressen, Benutzeridentität oder persönlichen Daten über das für die Kontoverwaltung Notwendige hinaus.' },
      ],
      btnOk: 'Verstanden',
    },
    es: {
      title: 'Política de privacidad',
      paragraphs: [
        { label: 'Conversaciones', text: 'Procesadas exclusivamente a través de la API de Anthropic. No las almacenamos ni las usamos para el entrenamiento de modelos.' },
        { label: 'Memoria', text: 'Almacenada solo localmente en tu navegador. No podemos verla ni almacenarla.' },
        { label: 'Base de conocimiento', text: 'Fragmentos de la literatura psicoanalítica almacenados solo como números para búsqueda. El contenido de tus conversaciones no se almacena allí.' },
        { label: 'Identidad', text: 'No se almacenan direcciones IP, identidad de usuario ni información personal más allá de lo requerido para la gestión de la cuenta.' },
      ],
      btnOk: 'Entendido',
    },
    fr: {
      title: 'Politique de confidentialité',
      paragraphs: [
        { label: 'Conversations', text: "Traitées exclusivement via l'API d'Anthropic. Non stockées par nous et non utilisées pour l'entraînement de modèles." },
        { label: 'Mémoire', text: 'Stockée uniquement localement dans votre navigateur. Nous ne pouvons ni la voir ni la stocker.' },
        { label: 'Base de connaissances', text: "Des extraits de la littérature psychanalytique sont stockés sous forme de nombres uniquement à des fins de recherche. Le contenu de vos conversations n'y est pas stocké." },
        { label: 'Identité', text: "Aucun stockage d'adresses IP, d'identité d'utilisateur ou d'informations personnelles au-delà de ce qui est nécessaire pour la gestion du compte." },
      ],
      btnOk: 'Compris',
    },
    ru: {
      title: 'Политика конфиденциальности',
      paragraphs: [
        { label: 'Беседы', text: 'Обрабатываются исключительно через API Anthropic. Не хранятся нами и не используются для обучения моделей.' },
        { label: 'Память', text: 'Хранится только локально в вашем браузере. Мы не можем её видеть или хранить.' },
        { label: 'База знаний', text: 'Фрагменты психоаналитической литературы хранятся только в виде чисел для поиска. Содержимое ваших разговоров там не хранится.' },
        { label: 'Идентификация', text: 'IP-адреса, личность пользователя или личные данные не хранятся сверх необходимого для управления аккаунтом.' },
      ],
      btnOk: 'Понятно',
    },
    it: {
      title: 'Informativa sulla privacy',
      paragraphs: [
        { label: 'Conversazioni', text: "Elaborate esclusivamente tramite l'API di Anthropic. Non memorizzate da noi e non utilizzate per addestrare modelli." },
        { label: 'Memoria', text: 'Conservata solo localmente nel tuo browser. Non possiamo vederla né conservarla.' },
        { label: 'Base di conoscenza', text: 'Estratti della letteratura psicoanalitica conservati solo come numeri a fini di ricerca. Il contenuto delle tue conversazioni non viene conservato lì.' },
        { label: 'Identità', text: "Nessuna conservazione di indirizzi IP, identità utente o informazioni personali oltre a quanto necessario per la gestione dell'account." },
      ],
      btnOk: 'Capito',
    },
  };
  const [authLangOpen, setAuthLangOpen] = useState(false);
  useEffect(() => {
    setMounted(true);
    setTheoristsOpen(true);
    const code = (window as any).selectedLang?.code || 'he';
    setTimeout(() => (window as any).applyUITranslation?.(code), 0);
  }, []);
  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const code = (e as CustomEvent).detail?.code;
      if (code) setCurrentLang(code);
    };
    window.addEventListener('langchange', handleLangChange);
    return () => window.removeEventListener('langchange', handleLangChange);
  }, []);
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
            <div className="sb-item" onClick={() => (window as any).openSupervision()}>
              <span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>⚲</span>
              <span className="sb-label">פיקוח קליני</span>
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
                      const cardHeight = 310;
                      const cardWidth = 240;
                      const vh = window.innerHeight;
                      const flip = r.top + cardHeight > vh - 16;
                      const rawTop = flip ? r.bottom - cardHeight : r.top;
                      const top = Math.min(Math.max(rawTop, 8), vh - cardHeight - 8);
                      const lang = (window as any).selectedLang?.code || 'he';
                      // Hebrew: sidebar on right side → card opens LEFT of sidebar (pink area)
                      // LTR: sidebar on right side → card opens LEFT of button
                      const isHe = lang === 'he';
                      const left = isHe
                        ? r.right + 8                                    // Hebrew: to the right of sidebar
                        : Math.max(8, r.left - cardWidth - 8);           // LTR: to the left of button
                      setCurrentLang(lang);
                      setTooltip({ text: key, top, left, flip });
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
              <div id="clinical-btn" className="memory-indicator" onClick={() => (window as any).toggleClinicalMode()}
                style={{ cursor: 'pointer' }} suppressHydrationWarning
                onMouseEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const lang = (window as any).selectedLang?.code || 'he';
                  setCurrentLang(lang);
                  const tipWidth = 240;
                  if (lang === 'he') {
                    // Hebrew: button is on LEFT side (RTL layout) → tooltip opens RIGHT, into the pink area
                    const left = Math.min(r.right + 8, window.innerWidth - tipWidth - 8);
                    setSessionTip({ top: r.bottom + 10, left });
                  } else {
                    // LTR: button is on RIGHT side → tooltip opens LEFT
                    const left = Math.max(8, r.left - tipWidth - 8);
                    setSessionTip({ top: r.bottom + 10, left });
                  }
                }}
                onMouseLeave={() => setSessionTip(null)}>
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
            <p id="welcome-api-text" suppressHydrationWarning style={{ fontSize: 11, color: 'var(--muted)', marginTop: 16, lineHeight: 1.6 }}>
              {(WELCOME_I18N[currentLang] || WELCOME_I18N['he']).apiText}{' '}
              <span id="privacy-link" suppressHydrationWarning onClick={() => { const m = document.getElementById('privacy-modal'); if(m) m.style.display='flex'; }}
                style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>
                {(WELCOME_I18N[currentLang] || WELCOME_I18N['he']).privacyLink}
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

        {/* Supervision bar — מוצג ידנית במצב קליני לאחר 3+ תורות */}
        <div id="supervision-bar" style={{ display: 'none', padding: '0 16px 8px', textAlign: 'center' }}>
          <button id="supervision-btn" onClick={() => (window as any).requestSupervision()}
            style={{ background: 'none', border: '1px solid #7a5080', borderRadius: 20, padding: '5px 18px', cursor: 'pointer', fontSize: 12, color: '#7a5080', letterSpacing: '0.02em', transition: 'all 0.2s' }}>
            ⚲ פיקוח על שיחה זו
          </button>
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

      {/* Session tooltip — fixed position, avoids overflow:hidden clipping */}
      {mounted && sessionTip && (
        <div style={{
          position: 'fixed', top: sessionTip.top,
          ...(sessionTip.left !== undefined ? { left: sessionTip.left } : { right: sessionTip.right }),
          pointerEvents: 'none', zIndex: 1000,
          background: 'var(--surface, #fff)', border: '1px solid var(--border, #ede4e0)',
          borderRadius: 10, padding: '10px 14px', width: 240,
          fontSize: 12, lineHeight: 1.7, color: 'var(--text)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          direction: currentLang === 'he' ? 'rtl' : 'ltr',
          textAlign: currentLang === 'he' ? 'right' : 'left',
        }}>
          <strong style={{ display: 'block', marginBottom: 4, color: 'var(--accent)' }}>
            {(SESSION_TIP_I18N[currentLang] || SESSION_TIP_I18N['he']).title}
          </strong>
          <span>{(SESSION_TIP_I18N[currentLang] || SESSION_TIP_I18N['he']).text}</span>
        </div>
      )}
    </>
  );
}
