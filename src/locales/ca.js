// src/locales/ca.js
// Catalan UI strings — single source of truth for all user-visible text.
// Replace with an i18n library (react-i18next etc.) when multi-language support is needed.

export const t = {
  // ─── Global / loading ─────────────────────────────────────────
  loading: 'Carregant...',
  loadingEllipsis: 'Carregant…',
  cancel: 'Cancel·lar',
  save: 'Desar',
  delete: 'Eliminar',
  add: 'Afegir',
  edit: 'Editar',
  close: 'Tancar',
  confirm: 'Confirmar',
  search: 'Cerca',
  noResults: 'Sense resultats',
  saving: 'Guardant…',

  // ─── Navigation ───────────────────────────────────────────────
  nav: {
    home: 'Inici',
    shows: 'Espectacles',
    members: 'Persones',
    songs: 'Cançons',
    rehearsals: 'Assajos',
    analytics: 'Analítica',
    admin: 'Admin',
    feedback: 'Feedback',
    search: 'Cerca',
    searchHint: 'Cerca (⌘K)',
    collapse: 'Col·lapsar',
    expand: 'Expandir',
    signOut: 'Tancar sessió',
  },

  // ─── Show toolbar tabs ────────────────────────────────────────
  tabs: {
    setlist: 'Escaleta',
    staging: 'Pases',
    lights: 'Llums',
    poster: 'Pòster',
    mics: 'Micros',
    rider: 'Rider',
    document: 'Document',
  },

  // ─── Roles ────────────────────────────────────────────────────
  roles: {
    admin: 'Admin',
    director: 'Director',
    choreographer: 'Coreògraf',
    lighting: 'Il·luminador',
    sound: 'Tècnic de so',
    capDeCorda: 'Cap de corda',
    member: 'Cantaire',
    choir: 'Cor',
    musician: 'Músic',
    extra: 'Extra',
    // Dashboard persona labels
    administrator: 'Administrador',
    member_label: 'Membre',
  },

  // ─── Sections (permission system) ────────────────────────────
  sections: {
    shows:      { label: 'Espectacles', desc: 'Veure i gestionar concerts' },
    members:    { label: 'Persones',    desc: 'Roster de cantaires' },
    repertoire: { label: 'Repertori',   desc: 'Biblioteca de cançons' },
    staging:    { label: 'Posicions',   desc: 'Editor de posicions i moments' },
    lights:     { label: 'Llums',       desc: "Disseny de cues d'il·luminació" },
    mics:       { label: 'Micros',      desc: 'Assignacions de micròfons' },
    attendance: { label: 'Assajos',     desc: 'Assistència i italianes' },
    rider:      { label: 'Rider',       desc: 'Document tècnic imprimible' },
    users:      { label: 'Usuaris',     desc: 'Gestió de permisos (només admin)' },
  },

  // ─── Voice labels ─────────────────────────────────────────────
  voices: {
    soprano1: 'Soprano 1', soprano2: 'Soprano 2',
    alto1:    'Alto 1',    alto2:    'Alto 2',
    tenor1:   'Tenor 1',   tenor2:   'Tenor 2',
    baritone: 'Baríton',   bass:     'Baix',
    director: 'Admin',
    musician: 'Músic',
    extra:    'Extra',
  },

  // ─── Rehearsal types ──────────────────────────────────────────
  rehearsalTypes: {
    veu:         'Veu',
    coreo:       'Coreo',
    ambdues:     'Veu + Coreo',
    masterclass: 'Masterclass',
    posicions:   'Passi de posicions',
  },

  // ─── Attendance status ────────────────────────────────────────
  attendanceStatus: {
    present: 'Present',
    absent:  'Absent',
    excused: 'Excusat',
  },

  // ─── Absence reasons ──────────────────────────────────────────
  reasons: {
    viatge:   'Viatge',
    feina:    'Feina',
    malaltia: 'Malaltia',
    altre:    'Altre',
  },

  // ─── Attendance page ──────────────────────────────────────────
  attendance: {
    pageTitle:       'Assajos',
    newRehearsal:    'Nou assaig',
    addRehearsal:    'Afegir assaig',
    added:           'Assaig afegit',
    saved:           'Assaig desat',
    deleted:         'Assaig eliminat',
    deleteConfirm:   (date) => `Eliminar l'assaig del ${date} i tots els registres?`,
    scheduleLabel:   "Horari habitual d'assaig",
    tabRehearsals:   'Assajos',
    tabSummary:      'Resum acumulat',
    tabSongs:        'Per cançó',
    emptyHint:       'Afegeix una data per registrar l\'assistència.',
    upcoming:        'Proper',
    showAll:         (n) => `Veure tots (${n} assajos)`,
    absenceNotices:  'Avisos d\'absència',
    notComing:       'No vinc',
    whoNotComing:    'Qui no ve',
    reason:          'Motiu',
    sendNotice:      'Enviar avís',
    noAbsenceNotices: 'Ningú ha avisat d\'absència.',
    confirmAttendance: 'Confirma assistència',
    iAmComing:       'Hi vaig',
    iAmNotComing:    'No hi vaig',
    confirm:         'Confirma',
  },

  // ─── Dashboard ────────────────────────────────────────────────
  dashboard: {
    greeting: {
      morning:   'Bon dia',
      afternoon: 'Bona tarda',
      evening:   'Bona nit',
    },
    nextShow:       'Proper espectacle',
    upcomingRehearsals: 'Propers assajos',
    quickAccess:    'Accés ràpid',
    sections:       'Seccions',
    resume:         'Resum',
    shows:          'Espectacles',
    seeAll:         'Veure tots',
    activeMembers:  'Membres actius',
    songsInRepertoire: 'Cançons al repertori',
    positionEditor: 'Editor posicions',
    mySection:      'La meva corda',
    myPosition:     'La meva posició',
    repertoire:     'Repertori',
    birthdays:      'Aniversaris pròxims',
    today:          'Avui',
    todayExclaim:   'Avui!',
    tomorrow:       'Demà',
    tomorrowExclaim: 'Demà!',
    daysAgo:        (n) => `${n}d`,
    inDays:         (n) => `En ${n} dies`,
    alreadyPast:    'Ja passat',
    daysCount:      (n) => `${n} dies`,
    // Readiness bar labels
    positions:      'Posicions',
    lights:         'Llums',
    microphones:    'Micròfons',
    // NextShowCard
    todayExclamation: 'Avui!',
    tomorrowExclamation: 'Demà!',
    setlist:        'Setlist',
    // SingerDashboard songs to study
    songsToStudy:   'Temes a estudiar',
    moreTopics:     (n) => `${n} temes més`,
    hideTopics:     'Amaga',
    nextRehearsal:  'Proper assaig',
    rehearsal:      'Assaig',
    rehearsalGuide: "Guia d'assaig",
    lighting:       'Il·luminació',
  },

  // ─── Shows page ───────────────────────────────────────────────
  shows: {
    emptyHint: 'Crea el primer amb el botó de dalt.',
  },

  // ─── Songs page ───────────────────────────────────────────────
  songs: {
    pageTitle:     'Cançons',
    newSong:       'Nova cançó',
    editSong:      'Editar cançó',
    deleteSong:    'Cançó eliminada',
    deleteConfirm: 'Eliminar aquesta cançó del repertori?',
    emptySearch:   'Cap resultat per aquesta cerca.',
    emptyHint:     'Afegeix la primera cançó amb el botó de dalt.',
    searchPlaceholder: 'Cerca per títol o compositor…',
    titleLabel:    'Títol *',
    titlePlaceholder: 'El nom de la cançó',
    lyricsPlaceholder: 'Una línia per vers. Serveix per ancorar els cues de llum.',
    public:        'Pública',
    private:       'Privada',
    attachmentTypes: {
      reference: 'Referència / Link',
      score:     'Partitura',
      audio:     'Àudio',
      referenceShort: 'Referència',
      audioShort: 'Àudio',
    },
  },

  // ─── Setlist / SongForm ───────────────────────────────────────
  setlist: {
    songTypes: {
      song:       'Cançó',
      songDesc:   'Peça musical amb moments i posicions',
      text:       'Text parlat',
      textDesc:   'Fragment parlat per una o més persones',
      indication: 'Indicació',
      indicationDesc: 'Nota tècnica o de direcció',
    },
    searchSong:        'Cerca pel títol…',
    customTitle:       '— Títol personalitzat —',
    defaultTextTitle:  'Text parlat',
    defaultIndicTitle: 'Indicació',
    titleLabel:        'Títol',
    subtitleLabel:     'Subtítol',
    fromOtherSong:     "D'altra cançó…",
    songLabel:         'Cançó',
    textPlaceholder:   'Presentació, diàleg…',
    indicationPlaceholder: 'Canvi de posicions, teló…',
    textLabel:         'Text',
    indicationLabel:   'Indicació',
    textContentPlaceholder: 'El text que es dirà…',
    indicationContentPlaceholder: 'Instrucció per al director o tècnic…',
  },

  // ─── Editor ───────────────────────────────────────────────────
  editor: {
    momentTitle:       'Títol',
    momentSubtitle:    'Subtítol / referència',
    rowHeight:         'Alçada de la tarima (cm)',
    morMenu:           'Més…',
    trajectory:        'Trajectòria',
    removePosition:    'Eliminar posició',
    prevSong:          (title) => `Cançó anterior: ${title}`,
    nextSong:          (title) => `Cançó següent: ${title}`,
    touchToPlace:      (name) => `Toca el canvas per col·locar ${name}`,
    trajectoryHint:    'Toca/clica qualsevol punt per anar a aquell moment · Esc per sortir',
    canvasHint:        'Arrossega · Shift+clic per seleccionar · fletxes mouen selecció · Doble tap per treure · Mantén premut per menú',
    zoomReset:         '% · Reset',
  },

  // ─── Lights page ──────────────────────────────────────────────
  lights: {
    noSongs:              'Aquest espectacle encara no té cançons.',
    notLinkedToRepertoire: 'Aquesta cançó no està enllaçada al repertori. Enllaça-la des del setlist per poder editar-ne la lletra.',
    lyricsPlaceholder:   'Una línia per vers.\nLes línies buides separen estrofes.',
    lyricsAnchorHint:    'Els cues queden ancorats al número de línia: si afegeixes o esborres línies enmig, revisa els ancoratges.',
    renumberTitle:       'Reassignar memòries consecutivament (1, 2, 3...)',
    cueTitle:            'Títol / indicació…',
    addFollowspot:       'Afegir canó',
    followspotDefault:   (n) => `Canó ${n}`,
    structuralGroup:     'Estructura (teló, diàlegs, tracks…)',
    noCuesFired:         'Encara no s\'ha disparat cap cue.',
    noLyricsOrCues:      'Aquesta cançó no té ni lletra ni cues per reproduir.',
  },

  // ─── Lights page (continued) ──────────────────────────────────
  lightsConfirm: {
    deleteCue: 'Eliminar aquest cue de llums?',
  },

  // ─── Rider page ───────────────────────────────────────────────
  rider: {
    printButton: 'Imprimir',
  },

  // ─── Mics page ────────────────────────────────────────────────
  mics: {
    microphones: 'Micròfons',
  },

  // ─── Admin page ───────────────────────────────────────────────
  admin: {
    pageTitle:     "Gestió d'usuaris",
    pageSubtitle:  "Gestiona els rols i permisos dels membres de l'aplicació",
    simulateHint:  "Previsualitza l'aplicació des del punt de vista d'un altre rol sense canviar permisos reals.",
    exitSim:       'Sortir de simulació',
    activeSimBadge: 'Simulació activa',
    fullAccess:    (role) => `Accés total (rol ${role}). Els permisos no s'apliquen.`,
  },

  // ─── Analytics page ───────────────────────────────────────────
  analytics: {
    pageTitle:   'Analítica',
    noData:      "Sense dades d'assistència.",
    avgAttendance: 'Mitjana assistència',
    absences:    'Absències',
    attendance:  'Assistència',
    songs:       'Cançons',
    tabAttendance: 'Assistència',
  },

  // ─── Login page ───────────────────────────────────────────────
  login: {
    title:       'Iniciar sessió',
    emailLabel:  'Correu electrònic o usuari',
    demoHint:    'Accés demo: entra amb',
  },

  // ─── Profile menu ─────────────────────────────────────────────
  profile: {
    signOut:     'Tancar sessió',
    simActive:   'Simulació activa',
  },

  // ─── Offline banner ───────────────────────────────────────────
  offline: 'Sense connexió — els canvis es guardaran quan tornis a estar en línia',

  // ─── Global search ────────────────────────────────────────────
  globalSearch: {
    placeholder: 'Cerca persones, espectacles, cançons…',
    songSection: 'Cançons',
    emptyHint:   'Escriu per cercar persones, espectacles o cançons',
  },

  // ─── Shortcuts modal ──────────────────────────────────────────
  shortcuts: {
    undoLastChange:    'Desfer últim canvi',
    exitTrajectory:    'Sortir del mode trajectòria',
    contextMenu:       'Menú contextual de persona',
    doubleClick:       'Posar persona al centre del ratolí',
    nextMoment:        'Moment següent',
    startPauseAuto:    'Iniciar/pausar run-through automàtic',
    holdSelect:        'Seleccionar persona en el canvas',
    swipe:             'Navegar entre moments (mòbil)',
    goNext:            'GO (pas següent)',
  },

  // ─── Person profile overlay ───────────────────────────────────
  person: {
    height:  'Alçada',
    phone:   'Telèfon',
  },

  // ─── Confirm dialog ───────────────────────────────────────────
  confirm: {
    cancel: 'Cancel·lar',
  },

  // ─── Feedback button ──────────────────────────────────────────
  feedback: {
    thankYou:    'Gràcies pel suggeriment!',
    placeholder: 'Escriu aquí el teu suggeriment…',
  },

  // ─── Rehearsal detail modal ───────────────────────────────────
  rehearsalDetail: {
    locationPlaceholder: 'Sala, adreça…',
  },

  // ─── Poster page ──────────────────────────────────────────────
  poster: {
    altText:     'Pòster',
    uploadHint:  'Puja una imatge per al rètol',
    removeTitle: 'Eliminar pòster',
    formatHint:  'Format DIN vertical (A3: 297×420 mm). La imatge es retallarà per ajustar-se al format.',
  },

  // ─── Rehearsal focus picker ───────────────────────────────────
  rehearsalFocus: {
    holdHint: 'O mantén premut sobre una persona al canvas.',
  },

  // ─── Stage / MiniStage ───────────────────────────────────────
  stage: {
    audience:  'PÚBLIC',
    house:     'sala',
    spotlight: 'focus',
    spotlight_label: 'Canó',
  },

  // ─── LightsPlayer ─────────────────────────────────────────────
  lightsPlayer: {
    progressBar: 'Progrés — clicable amb indicadors de cues',
  },

  // ─── ScoreView ────────────────────────────────────────────────
  scoreView: {
    noLyrics: 'Aquesta cançó no té lletra al repertori.',
  },

  // ─── ShowToolbar breadcrumb ───────────────────────────────────
  breadcrumb: {
    shows: 'Espectacles',
  },

  // ─── SingerDashboard readiness ───────────────────────────────
  readiness: {
    positions: 'Posicions',
    lights:    'Llums',
    mics:      'Micròfons',
  },

  // ─── FeedbackAdmin ────────────────────────────────────────────
  feedbackAdmin: {
    anonymousUser: 'Usuari anònim',
    allPages:      'Totes les pàgines',
  },

  // ─── Achievements / Gamification ─────────────────────────────
  achievements: {
    title:          'Assoliments',
    totalXP:        (n) => `${n} XP`,
    xpLabel:        'XP totals',
    noBadges:       'Encara no has aconseguit cap insígnia.',
    progress:       'Propers assoliments',
    noProgress:     'Segueix assajant per desbloquejar insígnies!',
    earned:         'Obtinguda',
    earnedAt:       (date) => `Obtinguda el ${date}`,
    unlocked:       'Insígnia desbloqueada!',
    categories: {
      attendance:   'Assistència',
      engagement:   'Participació',
      contribution: 'Contribució',
    },
  },
}
