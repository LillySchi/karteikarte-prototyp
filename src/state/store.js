// src/state/store.js
export const LS_KEY = "ris_demo_table_v1";
export const LS_COLS_KEY = "ris_demo_columns_v1";

export const LS_SCHEINE_KEY = "ris_demo_scheine_v1";
export const LS_ACTIVE_SCHEIN_KEY = "ris_demo_active_schein_v1";
export const LS_BOTTOMBAR_KEY = "ris_demo_bottombar_v1";

export const LS_PATIENT_RECALLS_KEY = "ris_demo_patient_recalls_v1";

export const TYPE_ITEMS = [
  { code: "D", text: "Diagnose" },
  { code: "B", text: "Befund" },
  { code: "ARR", text: "Medikation" },
  { code: "AU", text: "Arbeitsunfähigkeitsbescheinigung" },
  { code: "RCL", text: "Vorsorge" },
  { code: "TXT", text: "Text" },
  { code: "IMP", text: "Impfung" },
  { code: "?", text: "Suche öffnen" }
];

export const DIAG_SUGGESTIONS = [
  { code: "J06.9", text: "Grippaler Infekt" },
  { code: "M54.5", text: "Rückenschmerz" },
  { code: "R10.4", text: "Bauchschmerzen" },
  { code: "I10", text: "Essentielle Hypertonie" }
];

export const DIAG_CERTAINTY = [
  { code: "G", text: "gesichert" },
  { code: "A", text: "ausgeschlossen" },
  { code: "V", text: "Verdachtsdiagnose" },
  { code: "Z", text: "symptomlos" },
  { code: "RV", text: "rechts, Verdacht" },
  { code: "RZ", text: "rechts, symptomlos" },
  { code: "RA", text: "rechts, ausgeschlossen" },
  { code: "RG", text: "rechts, gesichert" },
  { code: "LV", text: "links, Verdacht" },
  { code: "LZ", text: "links, symptomlos" },
  { code: "LA", text: "links, ausgeschlossen" },
  { code: "LG", text: "links, gesichert" },
  { code: "BV", text: "beidseitig, Verdacht" },
  { code: "BZ", text: "beidseitig, symptomlos" },
  { code: "BA", text: "beidseitig, ausgeschlossen" },
  { code: "BG", text: "beidseitig, gesichert" }
];

export const MED_SUGGESTIONS = [
  { code: "Ibuprofen 600 mg", text: "Ibuprofen 600 mg" },
  { code: "Ibuprofen 800 mg", text: "Ibuprofen 800 mg" },
  { code: "Paracetamol 500 mg", text: "Paracetamol 500 mg" },
  { code: "Amoxicillin 500 mg", text: "Amoxicillin 500 mg" }
];

export function todayDE() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function parseDEDateToKey(de) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(de);
  if (!m) return "00000000";
  return `${m[3]}${m[2]}${m[1]}`;
}

export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function filterList(list, q, limit = 10, mode = "smart") {
  const query = String(q ?? "").trim().toLowerCase();
  if (!query) return list.slice(0, limit);

  const allowContains = mode !== "prefix";

  const scored = list
    .map((x) => {
      const code = String(x.code ?? "").toLowerCase();
      const text = String(x.text ?? "").toLowerCase();

      let score = 999;

      if (code.startsWith(query)) score = 0;
      else if (text.startsWith(query)) score = 1;
      else if (allowContains && code.includes(query)) score = 2;
      else if (allowContains && text.includes(query)) score = 3;

      return { x, score };
    })
    .filter((r) => r.score !== 999)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const ac = String(a.x.code ?? "");
      const bc = String(b.x.code ?? "");
      return ac.localeCompare(bc);
    })
    .map((r) => r.x);

  return scored.slice(0, limit);
}

/* =========================
   SCHEINE
========================= */

function quarterLabelFromDate(dt = new Date()) {
  const y = dt.getFullYear();
  const q = Math.floor(dt.getMonth() / 3) + 1;
  return `Q${q}/${y}`;
}

export function createDefaultSchein() {
  return {
    id: crypto.randomUUID(),
    name: `Kasse ${quarterLabelFromDate()}`,
    kind: "KASSE",
    createdAt: Date.now()
  };
}

export function demoScheine() {
  return [
    {
      id: crypto.randomUUID(),
      name: "Kasse Q2/2025",
      kind: "KASSE",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 120
    },
    {
      id: crypto.randomUUID(),
      name: "Privat 01/2026",
      kind: "PRIVAT",
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30
    }
  ];
}

export function loadScheine() {
  try {
    const raw = localStorage.getItem(LS_SCHEINE_KEY);
    if (!raw) return demoScheine();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return demoScheine();
    return parsed;
  } catch {
    return demoScheine();
  }
}

export function saveScheine(scheine) {
  localStorage.setItem(LS_SCHEINE_KEY, JSON.stringify(scheine));
}

export function loadActiveScheinId(fallbackId) {
  try {
    const raw = localStorage.getItem(LS_ACTIVE_SCHEIN_KEY);
    return raw || fallbackId || null;
  } catch {
    return fallbackId || null;
  }
}

export function saveActiveScheinId(id) {
  localStorage.setItem(LS_ACTIVE_SCHEIN_KEY, String(id || ""));
}

export function getActiveSchein(state) {
  const list = state?.scheine || [];
  const id = state?.activeScheinId;
  const found = list.find((x) => String(x.id) === String(id));
  return found || (list.length ? list[0] : null);
}

export function ensureActiveSchein(state) {
  if (!state.scheine || !state.scheine.length) {
    state.scheine = [createDefaultSchein()];
    saveScheine(state.scheine);
  }

  if (!state.activeScheinId) {
    state.activeScheinId = state.scheine[0].id;
    saveActiveScheinId(state.activeScheinId);
  }

  const s = getActiveSchein(state);
  if (s && state.patient) state.patient.aktiverSchein = s.name;
}

export function loadPatientRecalls() {
  try {
    const raw = localStorage.getItem(LS_PATIENT_RECALLS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function savePatientRecalls(recalls) {
  localStorage.setItem(LS_PATIENT_RECALLS_KEY, JSON.stringify(recalls || {}));
}

export function mergePatientRecall(patient, patientRecalls) {
  if (!patient) return patient;

  const patNr = String(patient.patNr || "");
  const stored = patientRecalls?.[patNr] || null;

  return {
    ...patient,
    recallReminder: stored
  };
}

/* =========================
   ENTRIES
========================= */

export function demoEntries() {
  return [
    {
      id: crypto.randomUUID(),
      date: "15.01.2026",
      type: "D",
      fg: "FG",
      entry: "J06.9   G   Grippaler Infekt",
      s: "0",
      ekz: "EKZ",
      bkz: "BKZ",
      locked: false
    },
    {
      id: crypto.randomUUID(),
      date: "15.01.2026",
      type: "B",
      fg: "FG",
      entry: "Klinischer Befund: Rachen gerötet, Temp. 38,2 °C",
      s: "0",
      ekz: "EKZ",
      bkz: "BKZ",
      locked: false
    },
    {
      id: crypto.randomUUID(),
      date: "12.06.2025",
      type: "ARR",
      fg: "FG",
      entry: "Ibuprofen 600 mg   3× tägl.   5 Tage   G",
      s: "0",
      ekz: "EKZ",
      bkz: "BKZ",
      locked: false,
      greenRx: true
    },
    {
      id: crypto.randomUUID(),
      date: "12.06.2025",
      type: "ARR",
      fg: "FG",
      entry: "Ibuprofen 600 mg   3× tägl.   5 Tage   G",
      s: "0",
      ekz: "EKZ",
      bkz: "BKZ",
      locked: false
    }
  ].sort((a, b) =>
    parseDEDateToKey(b.date).localeCompare(parseDEDateToKey(a.date))
  );
}

export function loadEntries() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return demoEntries();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return demoEntries();

    return parsed.map((e) => ({
    locked: false,
    marker: "",
    ...e
    }));
  } catch {
    return demoEntries();
  }
}

export function saveEntries(entries) {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

/* =========================
   COLUMNS
========================= */

export function loadColumns(defaultCols) {
  try {
    const raw = localStorage.getItem(LS_COLS_KEY);
    if (!raw) return defaultCols;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultCols;
    return parsed;
  } catch {
    return defaultCols;
  }
}

export function saveColumns(columns) {
  localStorage.setItem(LS_COLS_KEY, JSON.stringify(columns));
}

/* =========================
   BOTTOM BAR
========================= */

export const BOTTOMBAR_ITEMS = [
  { id: "leave", label: "Verlassen" },
  { id: "save", label: "Speichern" },
  { id: "undo", label: "Rückgängig" },
  { id: "patientSearch", label: "Patient Suchen" },
  { id: "forms", label: "Formulare" },
  { id: "archive", label: "Archiv" },
  { id: "pacs", label: "PACS" },
  { id: "lab", label: "Labor" },
  { id: "appointments", label: "Termine" },
  { id: "print", label: "Drucken" },
  { id: "export", label: "Export" },
  { id: "config", label: "Konfiguration" }
];

export const BOTTOMBAR_PRESETS = {
  ALLGEMEIN: [
    "leave",
    "save",
    "undo",
    "patientSearch",
    "forms",
    "print",
    "export",
    "config"
  ],
  RADIOLOGIE: [
    "leave",
    "save",
    "undo",
    "patientSearch",
    "pacs",
    "archive",
    "print",
    "export",
    "config"
  ]
};

export function defaultBottomBarConfig(preset = "ALLGEMEIN") {
  const order = BOTTOMBAR_PRESETS[preset] || BOTTOMBAR_PRESETS.ALLGEMEIN;
  const set = new Set(order);

  return {
    preset,
    order: [...order],
    hidden: BOTTOMBAR_ITEMS.map((x) => x.id).filter((id) => !set.has(id)),
    moreOpen: false
  };
}

export function loadBottomBarConfig(fallbackPreset = "ALLGEMEIN") {
  try {
    const raw = localStorage.getItem(LS_BOTTOMBAR_KEY);
    if (!raw) return defaultBottomBarConfig(fallbackPreset);

    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.order) ||
      !Array.isArray(parsed.hidden)
    ) {
      return defaultBottomBarConfig(fallbackPreset);
    }

    const known = new Set(BOTTOMBAR_ITEMS.map((x) => x.id));
    const seen = new Set();

    const order = parsed.order
      .map((x) => String(x))
      .filter((id) => known.has(id) && !seen.has(id) && (seen.add(id), true));

    const hidden = parsed.hidden
      .map((x) => String(x))
      .filter((id) => known.has(id) && !seen.has(id) && (seen.add(id), true));

    const missing = BOTTOMBAR_ITEMS.map((x) => x.id).filter((id) => !seen.has(id));

    return {
      preset: String(parsed.preset || fallbackPreset),
      order,
      hidden: [...hidden, ...missing],
      moreOpen: !!parsed.moreOpen
    };
  } catch {
    return defaultBottomBarConfig(fallbackPreset);
  }
}

export function saveBottomBarConfig(cfg) {
  localStorage.setItem(LS_BOTTOMBAR_KEY, JSON.stringify(cfg));
}

export function labelForBottomBarId(id) {
  const item = BOTTOMBAR_ITEMS.find((x) => x.id === id);
  return item ? item.label : String(id || "");
}

/* =========================
   INITIAL STATE
========================= */

export const DEMO_PATIENTS = {
  q1: {
    patNr: "1500",
    name: "Müller, Anna",
    dob: "01.01.1970",
    age: "56 J",
    gender: "W",
    kasse: "AOK Plus",
    allergies: "Penicillin | Marcumar | Herzschrittmacher",
    chronic: "Diabetes mellitus Typ 2 | Hypertonie",
    aktiverSchein: "",
    fall: "4711",
    limitedChronics: [
      { label: "PPI-Prophylaxe bis 31.03.2026" },
      { label: "Postoperative Schonung bis 20.03.2026" }
    ]
  },

  q2: {
    patNr: "1501",
    name: "Schmidt, Tom",
    dob: "14.04.1988",
    age: "37 J",
    gender: "M",
    kasse: "TK",
    allergies: "—",
    chronic: "Asthma bronchiale",
    aktiverSchein: "",
    fall: "4712",
    limitedChronics: [
      { label: "Arbeitsunfähigkeits-bezogene Schonung bis 15.03.2026" }
    ]
  },

  q3: {
    patNr: "1502",
    name: "Kaya, Elif",
    dob: "22.09.1995",
    age: "30 J",
    gender: "W",
    kasse: "Barmer",
    allergies: "Latex",
    chronic: "Hashimoto-Thyreoiditis",
    aktiverSchein: "",
    fall: "4713",
    limitedChronics: []
  }
};

export function clonePatientForQueue(queueId, activeScheinName = "") {
  const base = DEMO_PATIENTS[String(queueId)];
  if (!base) return null;

  return {
    ...base,
    aktiverSchein: activeScheinName,
    limitedChronics: Array.isArray(base.limitedChronics)
      ? base.limitedChronics.map((x) => ({ ...x }))
      : []
  };
}

export function createInitialState() {
 const defaultColumns = [
  { key: "date", label: "Datum", widthClass: "col-date", sortable: true, visible: true },
  { key: "type", label: "Typ", widthClass: "col-type", visible: true },
  { key: "fg", label: "FG", widthClass: "col-fg", visible: true },
  { key: "entry", label: "Eintrag", widthClass: "col-entry", visible: true },
  { key: "s", label: "S", widthClass: "col-s", visible: true },
  { key: "ekz", label: "EKZ", widthClass: "col-ekz", visible: true },
  { key: "bkz", label: "BKZ", widthClass: "col-bkz", visible: true }
];

  const scheine = loadScheine();
  const activeScheinId = loadActiveScheinId(scheine[0]?.id || null);
  const activeScheinName =
    scheine.find((s) => String(s.id) === String(activeScheinId))?.name ||
    scheine[0]?.name ||
    "";

  const patientRecalls = loadPatientRecalls();

  const st = {
    columns: loadColumns(defaultColumns),

    scheine,
    activeScheinId,
    patientRecalls,

    patient: mergePatientRecall(
      clonePatientForQueue("q2", activeScheinName) || {
        patNr: "1500",
        name: "Müller, Anna",
        dob: "01.01.1970",
        age: "56 J",
        gender: "W",
        kasse: "AOK Plus",
        allergies: "Penicillin | Marcumar | Herzschrittmacher",
        chronic: "z.B Diabetes)",
        aktiverSchein: activeScheinName,
        fall: "4711",
        limitedChronics: [],
        recallReminder: null
      },
      patientRecalls
    ),

    queue: [
      { id: "q1", name: "Müller, Anna", time: "08:40", status: "wartend" },
      { id: "q2", name: "Schmidt, Tom", time: "09:00", status: "dran" },
      { id: "q3", name: "Kaya, Elif", time: "09:20", status: "wartend" }
    ],
    activeQueueId: "q2",

    filters: {
      zeitraum: "Zeitraum",
      zeilentyp: "Zeilentyp",
      reihenfolge: "Reihenfolge",
      nurAktuellerSchein: true,

      heute: false,
      volltext: false,
      sortBy: "date",
      sortDir: "desc",

      greenRxOnly: false,

      rangePreset: "all",
      typeFilter: "all",
      types: [],

      customRanges: {},
      customRangeModalOpen: false
    },

    ui: {
      expandedDates: {},
      configOpen: false,
      configDraft: null,
      scheinOpen: false,
      scheinDraft: null,

      layoutOpen: false,
      layoutTab: "bottomBar",
      visualStyle: "classic",

      bottomBar: loadBottomBarConfig("ALLGEMEIN"),

      header: {
        show: {
          chronic: true,
          overview: true,
          prevention: true,
          order: true
        },
        open: {
          chronic: false,
          overview: false,
          prevention: false,
          order: false
        }
      }
    },

    entries: loadEntries(),

    draft: { type: "", code: "", text: "" },

   input: {
  active: false,
  step: "idle",
  type: "",
  locked: false,
  autofocusId: null,

  d: { codeOrQuery: "", certainty: "" },
  arr: { med: "", dose: "", rx: "" },
  rcl: { amount: "", unit: "" },

  au: { from: "", to: "" }, 

  txt: ""
},

    selection: { rowId: null },

    edit: { active: false, rowId: null, colKey: null, draft: {} },

    dropdown: {
      open: false,
      kind: "",
      items: [],
      anchorRect: null,
      activeIndex: 0
    }
  };

  if (st.activeScheinId) {
    let changed = false;
    st.entries = (st.entries || []).map((e) => {
      if (e && !e.scheinId) {
        changed = true;
        return { ...e, scheinId: st.activeScheinId };
      }
      return e;
    });
    if (changed) saveEntries(st.entries);
  }

  ensureActiveSchein(st);
  return st;
}