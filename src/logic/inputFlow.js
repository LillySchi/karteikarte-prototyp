// src/logic/inputFlow.js
import {
  TYPE_ITEMS,
  DIAG_SUGGESTIONS,
  DIAG_CERTAINTY,
  MED_SUGGESTIONS,
  filterList
} from "../state/store.js";

const RCL_UNITS = [
  { code: "T", text: "Tage" },
  { code: "W", text: "Wochen" },
  { code: "M", text: "Monate" },
  { code: "K", text: "Kalender öffnen" }
];

// Green should be on top
const ARR_RX_ITEMS = [
  { code: "G", text: "Grünes Rezept" },
  { code: "K", text: "Kasse (GKV)" },
  { code: "P", text: "Privat" }
];

const ARR_DOSE_ITEMS = [
  { code: "1-0-0", text: "morgens" },
  { code: "0-1-0", text: "mittags" },
  { code: "0-0-1", text: "abends" },
  { code: "1-0-1", text: "morgens + abends" },
  { code: "1-1-1", text: "morgens + mittags + abends" },
  { code: "0-0-0", text: "bei Bedarf" }
];

function normalizeDose(raw) {
  const s = String(raw ?? "").trim();

  const digits = s.replace(/[^\d]/g, "");
  if (/^[01]{3}$/.test(digits)) {
    return `${digits[0]}-${digits[1]}-${digits[2]}`;
  }

  const m = s.match(/^\s*([01])\s*[-/ ]\s*([01])\s*[-/ ]\s*([01])\s*$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  return s;
}

function formatDateDE(dt) {
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function buildRecallReminder(amount, unit) {
  const n = Number(amount);
  const now = new Date();
  const due = new Date(now.getTime());

  if (unit === "T") due.setDate(due.getDate() + n);
  if (unit === "W") due.setDate(due.getDate() + n * 7);
  if (unit === "M") due.setMonth(due.getMonth() + n);

  const unitText =
    unit === "T" ? "Tagen" :
    unit === "W" ? "Wochen" :
    unit === "M" ? "Monaten" :
    unit;

  const dueDate = formatDateDE(due);

  return {
    amount: n,
    unit,
    dueDate,
    label: `Recall in ${n} ${unitText} · fällig am ${dueDate}`
  };
}

function setAutofocus(state, id) {
  state.input.autofocusId = id;
}

function closeDropdown(state) {
  state.dropdown.open = false;
  state.dropdown.items = [];
  state.dropdown.kind = "";
  state.dropdown.anchorRect = null;
  state.dropdown.activeIndex = 0;
}

function pickActiveCode(state) {
  if (!state.dropdown?.open) return null;
  const items = state.dropdown.items || [];
  const idx = Number(state.dropdown.activeIndex ?? 0);
  const it = items[idx];
  return it ? it.code : null;
}

function bestIndex(items, q) {
  const query = String(q ?? "").trim().toUpperCase();
  if (!query) return 0;
  const exact = items.findIndex((it) => String(it.code).toUpperCase() === query);
  if (exact >= 0) return exact;
  const starts = items.findIndex((it) => String(it.code).toUpperCase().startsWith(query));
  if (starts >= 0) return starts;
  return 0;
}

function openDropdown(state, kind, items, el, q) {
  if (!Array.isArray(items) || items.length === 0) {
    if (el) state.dropdown.anchorRect = el.getBoundingClientRect();
    closeDropdown(state);
    return;
  }

  state.dropdown.open = true;
  state.dropdown.kind = kind;
  state.dropdown.items = items;
  state.dropdown.anchorRect = el ? el.getBoundingClientRect() : state.dropdown.anchorRect;
  state.dropdown.activeIndex = bestIndex(items, q);
}

function ensureInputShape(state) {
  if (!state.input) state.input = {};
  if (!state.input.d) state.input.d = { codeOrQuery: "", certainty: "" };

  if (!state.input.arr) state.input.arr = { med: "", dose: "", rx: "" };
  if (typeof state.input.arr.med !== "string") state.input.arr.med = "";
  if (typeof state.input.arr.dose !== "string") state.input.arr.dose = "";
  if (typeof state.input.arr.rx !== "string") state.input.arr.rx = "";

  if (!state.input.rcl) state.input.rcl = { amount: "", unit: "" };
  if (!state.input.au) state.input.au = { from: "", to: "" };

  if (typeof state.input.txt !== "string") state.input.txt = "";
  if (typeof state.input.type !== "string") state.input.type = "";

  if (!state.dropdown) {
    state.dropdown = { open: false, kind: "", items: [], anchorRect: null, activeIndex: 0 };
  }

  if (!state.draft) state.draft = { type: "", code: "", text: "" };
}

export function startInput(state) {
  ensureInputShape(state);
  state.input.active = true;
  state.input.step = "type";
  setAutofocus(state, "typeInput");
}

export function resetInput(state) {
  ensureInputShape(state);
  state.input.active = false;
  state.input.step = "idle";
  state.input.type = "";
  state.input.autofocusId = null;

  state.input.d.codeOrQuery = "";
  state.input.d.certainty = "";

  state.input.arr.med = "";
  state.input.arr.dose = "";
  state.input.arr.rx = "";

  state.input.rcl.amount = "";
state.input.rcl.unit = "";
state.input.rcl.targetDate = null;

state.input.au.from = "";
state.input.au.to = "";

  state.input.txt = "";

  state.draft.type = "";
  state.draft.code = "";
  state.draft.text = "";

  closeDropdown(state);
}

export function prepareNextDiagnosis(state) {
  ensureInputShape(state);

  state.input.active = true;
  state.input.type = "D";
  state.input.step = "D_diag";
  state.input.autofocusId = "codeInput";

  state.input.d.codeOrQuery = "";
  state.input.d.certainty = "";

  state.draft.type = "";
  state.draft.code = "";
  state.draft.text = "";

  closeDropdown(state);
}

export function prepareGreenRxFromDiagnosis(state) {
  ensureInputShape(state);

  state.input.active = true;
  state.input.type = "ARR";
  state.input.step = "ARR_med";
  state.input.autofocusId = "medInput";

  state.input.d.codeOrQuery = "";
  state.input.d.certainty = "";

  state.input.arr.med = "";
  state.input.arr.dose = "";
  state.input.arr.rx = "G";

  state.draft.type = "";
  state.draft.code = "";
  state.draft.text = "";

  closeDropdown(state);
}

export function stepBack(state) {
  ensureInputShape(state);
  closeDropdown(state);

  const step = state.input.step;

  if (step === "D_cert") { state.input.step = "D_diag"; setAutofocus(state,"codeInput"); return; }
  if (step === "D_diag") { state.input.step = "type";   setAutofocus(state,"typeInput"); return; }

  if (step === "ARR_rx")   { state.input.step = "ARR_dose"; setAutofocus(state,"doseInput"); return; }
  if (step === "ARR_dose") { state.input.step = "ARR_med";  setAutofocus(state,"medInput");  return; }
  if (step === "ARR_med")  { state.input.step = "type";     setAutofocus(state,"typeInput"); return; }

  if (step === "RCL_unit")   { state.input.step = "RCL_amount"; setAutofocus(state,"rclAmountInput"); return; }
  if (step === "RCL_amount") { state.input.step = "type";       setAutofocus(state,"typeInput");      return; }

  if (step === "TXT_text") { state.input.step = "type"; setAutofocus(state,"typeInput"); return; }

  state.input.step = "type";
  setAutofocus(state, "typeInput");
}

/* =========================
   INPUT (opens dropdown)
========================= */

export function handleTypeInput(state, raw, el) {
  ensureInputShape(state);
  state.input.type = String(raw ?? "").toUpperCase();
  const items = filterList(TYPE_ITEMS, state.input.type, 20, "prefix");
  openDropdown(state, "type", items, el, state.input.type);
}

export function handleDiagInput(state, raw, el) {
  ensureInputShape(state);
  state.input.d.codeOrQuery = String(raw ?? "");
  const items = filterList(DIAG_SUGGESTIONS, state.input.d.codeOrQuery, 20, "smart");
  openDropdown(state, "diag", items, el, state.input.d.codeOrQuery);
}

export function handleCertInput(state, raw, el) {
  ensureInputShape(state);
  state.input.d.certainty = String(raw ?? "").toUpperCase();
  const items = filterList(DIAG_CERTAINTY, state.input.d.certainty, 40, "prefix");
  openDropdown(state, "cert", items, el, state.input.d.certainty);
}

export function handleMedInput(state, raw, el) {
  ensureInputShape(state);
  state.input.arr.med = String(raw ?? "");
  const items = filterList(MED_SUGGESTIONS, state.input.arr.med, 20, "smart");
  openDropdown(state, "med", items, el, state.input.arr.med);
}

export function handleArrDoseInput(state, raw, el) {
  ensureInputShape(state);

  const normalized = normalizeDose(raw);
  state.input.arr.dose = normalized;

  const items = filterList(ARR_DOSE_ITEMS, normalized, 20, "smart");
  openDropdown(state, "arr_dose", items, el, normalized);
}

export function handleArrRxInput(state, raw, el) {
  ensureInputShape(state);
  state.input.arr.rx = String(raw ?? "").toUpperCase();
  openDropdown(state, "arr_rx", ARR_RX_ITEMS, el, state.input.arr.rx);
}

export function handleRclAmountInput(state, raw, el) {
  ensureInputShape(state);

  const value = String(raw ?? "").trim();

  // =========================
// SHORTCUTS +7 / +14 / +30
// =========================
if (value.startsWith("+")) {
  const days = Number(value.replace("+", ""));

  if (!isNaN(days)) {
    const now = new Date();
    const target = new Date();
    target.setDate(now.getDate() + days);

    state.input.rcl.targetDate = formatDateDE(target); 

    state.input.rcl.amount = String(days);

    // 👉 KEIN Kalender öffnen!
    state.dropdown.open = false;

    return;
  }
}

  // FALL 1: Slash → Kalendermodus
  if (value.includes("/")) {
    state.input.rcl.amount = value;

    state.dropdown.open = true;
    state.dropdown.kind = "rcl_calendar";
    state.dropdown.items = []; // nicht nötig hier
    state.dropdown.anchorRect = el.getBoundingClientRect();

    // Datum parsen
    const [dayStr, monthStr] = value.split("/");
    const day = Number(dayStr);
    const month = Number(monthStr);

    const now = new Date();
    let year = now.getFullYear();

    let targetMonth = isNaN(month) ? now.getMonth() : month - 1;

    // wenn Monat schon vorbei → nächstes Jahr
    if (!isNaN(month) && targetMonth < now.getMonth()) {
      year += 1;
    }

    const targetDate = new Date(
      year,
      isNaN(targetMonth) ? now.getMonth() : targetMonth,
      isNaN(day) ? now.getDate() : day
    );

    state.input.rcl.calendarPreview = targetDate;

    return;
  }

  //  FALL 2: normaler Flow
  state.input.rcl.amount = value.replace(/[^\d]/g, "");

  state.dropdown.open = true;
state.dropdown.kind = "rcl_hint";
state.dropdown.items = [
  { code: "K", text: "Kalender öffnen (K)" },
  { code: "INFO", text: "oder Zahl oder Datum eingeben" }
];
state.dropdown.anchorRect = el.getBoundingClientRect();
state.dropdown.activeIndex = 0;
  if (el) state.dropdown.anchorRect = el.getBoundingClientRect();
}

export function handleRclUnitInput(state, value, el) {
    console.log("RCL UNIT INPUT TRIGGERED", value);
  state.input.rcl.unit = value;

  const list = [
    { code: "T", text: "Tage" },
    { code: "W", text: "Wochen" },
    { code: "M", text: "Monate" }
  ];

  state.dropdown.items = list.filter((x) =>
    x.text.toLowerCase().includes(value.toLowerCase()) ||
    x.code.toLowerCase().includes(value.toLowerCase())
  );

  state.dropdown.kind = "rcl_unit";
  state.dropdown.open = true;
  state.dropdown.anchorRect = el.getBoundingClientRect();
  state.dropdown.activeIndex = 0;
}

export function handleTxtInput(state, raw, el) {
  ensureInputShape(state);
  state.input.txt = String(raw ?? "");
  closeDropdown(state);
  if (el) state.dropdown.anchorRect = el.getBoundingClientRect();
}

/* =========================
   ENTER (advances)
========================= */
export function handleTypeEnter(state) {
  ensureInputShape(state);

  const picked = state.dropdown.kind === "type" ? pickActiveCode(state) : null;
  const typed = String(state.input.type ?? "").trim().toUpperCase();

  let code = String(picked || typed).toUpperCase();

  if (code === "RECALL" || code === "VORSORGE") code = "RCL";

  state.input.type = code;
  closeDropdown(state);

  if (code === "D") {
    state.input.step = "D_diag";
    setAutofocus(state, "codeInput");
    return;
  }

  if (code === "ARR") {
    state.input.step = "ARR_med";
    setAutofocus(state, "medInput");
    return;
  }

  if (code === "RCL") {
    state.input.step = "RCL_amount";
    setAutofocus(state, "rclAmountInput");
    return;
  }

  // 🔥 NEU: AU FLOW
  if (code === "AU") {
    state.input.step = "AU_from";
    setAutofocus(state, "auFromInput");
    return;
  }

  if (code === "TXT") {
    state.input.step = "TXT_text";
    setAutofocus(state, "txtInput");
    return;
  }

  if (code === "B" || code === "IMP" || code === "?") {
    state.input.step = "TXT_text";
    setAutofocus(state, "txtInput");
    return;
  }

  state.input.step = "TXT_text";
  setAutofocus(state, "txtInput");
}

export function handleDiagEnter(state) {
  ensureInputShape(state);

  const picked = state.dropdown.kind === "diag" ? pickActiveCode(state) : null;

  if (picked) {
    const found = DIAG_SUGGESTIONS.find((x) => x.code === picked);
    if (found) {
      state.draft.code = found.code;
      state.draft.text = found.text;
      state.input.d.codeOrQuery = found.code;
    } else {
      state.draft.code = picked;
      state.draft.text = picked;
      state.input.d.codeOrQuery = picked;
    }
  } else {
    const q = String(state.input.d.codeOrQuery ?? "").trim();
    const found = DIAG_SUGGESTIONS.find((x) => String(x.code).toUpperCase() === q.toUpperCase());
    if (found) {
      state.draft.code = found.code;
      state.draft.text = found.text;
      state.input.d.codeOrQuery = found.code;
    } else {
      state.draft.code = q;
      state.draft.text = q;
      state.input.d.codeOrQuery = q;
    }
  }

  closeDropdown(state);
  state.input.step = "D_cert";
  setAutofocus(state, "certInput");
}

export function handleCertEnter(state, commitRow) {
  ensureInputShape(state);

  const picked = state.dropdown.kind === "cert" ? pickActiveCode(state) : null;
  const typed = String(state.input.d.certainty ?? "").trim().toUpperCase();
  const cert = String(picked || typed).toUpperCase();
  if (!cert) return;

  state.input.d.certainty = cert;
  closeDropdown(state);

  const code = String(state.draft.code ?? state.input.d.codeOrQuery ?? "").trim();
  const text = String(state.draft.text ?? "").trim();
  if (!code || !text) return;

  const entry = `${code}   ${cert}   ${text}`.trim();
  commitRow("D", entry);
}

export function handleArrMedEnter(state) {
  ensureInputShape(state);

  const picked = state.dropdown.kind === "med" ? pickActiveCode(state) : null;
  if (picked) state.input.arr.med = String(picked);

  closeDropdown(state);
  state.input.step = "ARR_dose";
  setAutofocus(state, "doseInput");
}

export function handleArrDoseEnter(state) {
  ensureInputShape(state);

  const med = String(state.input.arr.med ?? "").trim();
  if (!med) return;

  const picked = state.dropdown.kind === "arr_dose" ? pickActiveCode(state) : null;

  if (picked) {
    state.input.arr.dose = String(picked);
  } else {
    state.input.arr.dose = normalizeDose(state.input.arr.dose);
  }

  const dose = String(state.input.arr.dose ?? "").trim();
  if (!dose) return;

  closeDropdown(state);
  state.input.step = "ARR_rx";
  setAutofocus(state, "rxInput");
}

export function handleArrRxEnter(state, commitRow) {
  ensureInputShape(state);

  const med = String(state.input.arr.med ?? "").trim();
  const dose = normalizeDose(state.input.arr.dose);

  const picked = state.dropdown.kind === "arr_rx" ? pickActiveCode(state) : null;
  const typed = String(state.input.arr.rx ?? "").trim().toUpperCase();
  const rx = String(picked || typed).toUpperCase();

  if (!med || !dose || !rx) return;

  closeDropdown(state);

  const isGreen = rx === "G";
  const entry = `${med}   ${dose}   ${rx}`.trim();

  commitRow("ARR", entry, { greenRx: isGreen });
}

export function handleRclAmountEnter(state) {
  ensureInputShape(state);

  const amount = String(state.input.rcl.amount ?? "").trim();
  if (!amount) return;

  // 👉 STEP WECHSEL (DAS FEHLT BEI DIR)
  state.input.step = "RCL_unit";
  setAutofocus(state, "rclUnitInput");

  // Dropdown vorbereiten
  state.dropdown.open = true;
  state.dropdown.kind = "rcl_unit";
  state.dropdown.items = RCL_UNITS;
  state.dropdown.activeIndex = 0;

  const el = document.getElementById("rclAmountInput");
  if (el) {
    state.dropdown.anchorRect = el.getBoundingClientRect();
  }
}

export function handleRclUnitEnter(state, commitRow) {
  ensureInputShape(state);

  const amount = String(state.input.rcl.amount ?? "").trim();
  const picked = state.dropdown.kind === "rcl_unit" ? pickActiveCode(state) : null;
  const typed = String(state.input.rcl.unit ?? "").trim().toUpperCase();
  const unit = String(picked || typed).toUpperCase();

  if (!amount || !unit) return;

  closeDropdown(state);

  if (unit === "K") {
    const date = new Date();

    state.input.rcl.calendarPreview = date;

    state.dropdown.open = true;
    state.dropdown.kind = "rcl_calendar";

    const el = document.getElementById("rclUnitInput");
    if (el) state.dropdown.anchorRect = el.getBoundingClientRect();

    return;
  }

  const reminder = buildRecallReminder(amount, unit);

  // 👉 FALL 1: nur Planung (z.B. +30)
  if (state.input.rcl.targetDate) {
    commitRow("RCL", reminder.label, {
      recallReminder: {
        targetDate: state.input.rcl.targetDate,
        dueDate: null
      }
    });
    return;
  }

  // 👉 FALL 2: klassischer Recall
  commitRow("RCL", reminder.label, {
    recallReminder: reminder
  });
} // 🔥 DIESE KLAMMER HAT GEFEHLT

export function handleAuFromInput(state, raw) {
  state.input.au.from = String(raw ?? "");
}

export function handleAuToInput(state, raw) {
  state.input.au.to = String(raw ?? "");
}

export function handleAuFromEnter(state) {
  if (!state.input.au.from) return;

  state.input.step = "AU_to";
  setAutofocus(state, "auToInput");
}

export function handleAuToEnter(state, commitRow) {
  const from = state.input.au.from;
  const to = state.input.au.to;

  if (!from || !to) return;

  const entry = `AU ${from} – ${to}`;
  commitRow("AU", entry);

state.input.au.from = "";
state.input.au.to = "";
state.input.step = "type";
setAutofocus(state, "typeInput");
}

// =========================
// TXT ENTER (SEPARAT!)
// =========================
export function handleTxtEnter(state, commitRow) {
  ensureInputShape(state);

  const type = String(state.input.type ?? "").trim().toUpperCase() || "TXT";
  const raw = String(state.input.txt ?? "");

  const lines = raw.split("\n");
  const lastLine = lines[lines.length - 1];

  if (lastLine.trim() !== "") {
    state.input.txt = raw + "\n";
    return;
  }

  const txt = raw.trim();
  if (!txt) return;

  commitRow(type === "TXT" ? "TXT" : type, txt);
}