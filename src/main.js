// src/main.js
import "./style.css";

import {
  createInitialState,
  saveEntries,
  saveColumns,
  savePatientRecalls,
  todayDE,
  parseDEDateToKey
} from "./state/store.js";

import {
  startInput,
  resetInput,
  stepBack,
  prepareNextDiagnosis,
  handleTypeEnter,
  handleDiagEnter,
  handleCertEnter,
  handleArrMedEnter,
  handleArrDoseEnter,
  handleArrRxEnter,
  handleRclAmountEnter,
  handleRclUnitEnter,
  handleTxtEnter,
  handleTypeInput,
  handleDiagInput,
  handleCertInput,
  handleMedInput,
  handleArrDoseInput,
  handleArrRxInput,
  handleRclAmountInput,
  handleRclUnitInput,
  handleAuFromInput,
  handleAuToInput,
  handleAuFromEnter,
  handleAuToEnter
} from "./logic/inputFlow.js";

import { Header } from "./ui/header.js";
import { Actions } from "./ui/actions.js";
import { Filters, CustomRangeModal } from "./ui/filters.js";
import { Table, Dropdown } from "./ui/table.js";
import { wireActions } from "./controllers/actionsController.js";
import { ConfigModal } from "./ui/configModal.js";
import { ScheinModal } from "./ui/scheinModal.js";
import { wireConfig } from "./controllers/configController.js";
import { wireSchein } from "./controllers/scheinController.js";
import { wireHeader } from "./controllers/headerController.js";
import { wireBottomBar } from "./controllers/bottomBarController.js";
import { LayoutModal } from "./ui/layoutModal.js";
import { wireLayout } from "./controllers/layoutController.js";
import { BottomBar } from "./ui/bottombar.js";
import { Sidebar } from "./ui/sidebar.js";
import { TopBar } from "./ui/topbar.js";

const state = createInitialState();
let wired = false;

if (!state.ui) state.ui = {};
if (typeof state.ui.hostSidebarOpen !== "boolean") {
  state.ui.hostSidebarOpen = true;
}

/* =========================
   RENDER
========================= */
function render() {
  document.querySelector("#app").innerHTML = `
    <div class="shell ${state.ui?.visualStyle === "modern" ? "style-modern" : "style-classic"}">
      <div class="host-shell ${state.ui?.hostSidebarOpen === false ? "host-shell-collapsed" : "host-shell-open"}">
        ${Sidebar(state)}

        <div class="host-main">
          ${TopBar(state)}

          <div class="frame">
            ${Header(state)}
            <div class="content">
              ${Actions(state)}
              ${Filters(state)}
              ${Table(state)}
            </div>
            ${BottomBar(state)}
          </div>
        </div>
      </div>
    </div>

    <div id="dropdownMount">${Dropdown(state)}</div>
    <div id="configMount">${ConfigModal(state)}</div>
    <div id="scheinMount">${ScheinModal(state)}</div>
    <div id="layoutMount">${LayoutModal(state)}</div>
    <div id="customRangeMount">${CustomRangeModal(state)}</div>
  `;

  afterRenderBind();
  wire();
}

function focus(id) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (el) el.focus();
  });
}

function renderDropdownOnly() {
  const mount = document.getElementById("dropdownMount");
  if (!mount) return;
  mount.innerHTML = Dropdown(state);
}

function getVisibleRowIds() {
  return [...document.querySelectorAll("tr[data-row]")]
    .map((tr) => tr.getAttribute("data-row"))
    .filter(Boolean);
}

/* =========================
   VALIDATED COMMIT
========================= */

function commitRow(type, entry, extra = {}) {
  if (!type || !entry || !entry.trim()) return;

  const row = {
    id: crypto.randomUUID(),
    scheinId: state.activeScheinId || null,
    date: todayDE(),
    type,
    fg: "FG",
    entry,
    s: "0",
    ekz: "EKZ",
    bkz: "BKZ",
    locked: false,
    ...extra
  };

  state.entries = [row, ...state.entries].sort((a, b) =>
    parseDEDateToKey(b.date).localeCompare(parseDEDateToKey(a.date))
  );

  if (type === "RCL" && extra.recallReminder && state.patient?.patNr) {
    if (!state.patientRecalls) state.patientRecalls = {};

    const patNr = String(state.patient.patNr);
    state.patientRecalls[patNr] = { ...extra.recallReminder };

    state.patient = {
      ...state.patient,
      recallReminder: { ...extra.recallReminder }
    };

    savePatientRecalls(state.patientRecalls);
    document.dispatchEvent(new Event("recall-created"));
  }

  saveEntries(state.entries);
  resetInput(state);
  render();
}

function commitDiagnosisAndContinue(entry) {
  if (!entry || !entry.trim()) return;

  const row = {
    id: crypto.randomUUID(),
    scheinId: state.activeScheinId || null,
    date: todayDE(),
    type: "D",
    fg: "FG",
    entry,
    s: "0",
    ekz: "EKZ",
    bkz: "BKZ",
    locked: false
  };

  state.entries = [row, ...state.entries].sort((a, b) =>
    parseDEDateToKey(b.date).localeCompare(parseDEDateToKey(a.date))
  );

  saveEntries(state.entries);
  prepareNextDiagnosis(state);
  render();
}

function commitDiagnosisAndStartGreenRx(entry) {
  if (!entry || !entry.trim()) return;

  const row = {
    id: crypto.randomUUID(),
    scheinId: state.activeScheinId || null,
    date: todayDE(),
    type: "D",
    fg: "FG",
    entry,
    s: "0",
    ekz: "EKZ",
    bkz: "BKZ",
    locked: false
  };

  state.entries = [row, ...state.entries].sort((a, b) =>
    parseDEDateToKey(b.date).localeCompare(parseDEDateToKey(a.date))
  );

  saveEntries(state.entries);

  state.input.active = true;
  state.input.type = "ARR";
  state.input.step = "ARR_med";
  state.input.autofocusId = "medInput";

  state.input.d.codeOrQuery = "";
  state.input.d.certainty = "";

  state.input.arr.med = "";
  state.input.arr.dose = "";
  state.input.arr.rx = "G";

  state.input.rcl.amount = "";
  state.input.rcl.unit = "";

  state.input.txt = "";

  state.draft.type = "";
  state.draft.code = "";
  state.draft.text = "";

  state.dropdown.open = false;
  state.dropdown.items = [];
  state.dropdown.kind = "";
  state.dropdown.anchorRect = null;
  state.dropdown.activeIndex = 0;

  render();
}

/* =========================
   DELETE + FALLBACK
========================= */

function deleteSelectedRow() {
  const id = state.selection.rowId;
  if (!id) return;

  const row = state.entries.find((e) => e.id === id);
  if (!row) return;

  if (!window.confirm(`Eintrag vom ${row.date} (${row.type}) wirklich löschen?`))
    return;

  const ids = getVisibleRowIds();
  const idx = ids.indexOf(id);

  // check if recall row
if (row.type === "RCL" && state.patient?.patNr) {
  const patNr = String(state.patient.patNr);

  if (state.patientRecalls && state.patientRecalls[patNr]) {
    delete state.patientRecalls[patNr];
    savePatientRecalls(state.patientRecalls);
  }

  if (state.patient) {
    state.patient.recallReminder = null;
  }
}

state.entries = state.entries.filter((e) => e.id !== id);
  saveEntries(state.entries);

  if (ids.length <= 1) {
    state.selection.rowId = null;
  } else {
    state.selection.rowId =
      idx >= ids.length - 1 ? ids[ids.length - 2] : ids[idx + 1];
  }

  render();
}

function markSelectedRow(marker) {
  const id = state.selection?.rowId;
  if (!id) return;

  const idx = state.entries.findIndex((e) => e.id === id);
  if (idx < 0) return;

  state.entries[idx] = {
    ...state.entries[idx],
    marker: marker || ""
  };

  saveEntries(state.entries);
  render();
}

function copySelectedRowToToday() {
  const id = state.selection?.rowId;
  if (!id) return;

  const row = state.entries.find((e) => e.id === id);
  if (!row) return;

  const copy = {
    ...row,
    id: crypto.randomUUID(),
    date: todayDE(),
    locked: false
  };

  state.entries = [copy, ...state.entries].sort((a, b) =>
    parseDEDateToKey(b.date).localeCompare(parseDEDateToKey(a.date))
  );

  saveEntries(state.entries);
  state.selection.rowId = copy.id;
  render();
}

/* =========================
   EDIT MODE
========================= */

function parseDEntry(entry) {
  const parts = String(entry || "").split(/\s{2,}/);
  return {
    d_code: parts[0] ?? "",
    d_cert: parts[1] ?? "",
    d_text: parts.slice(2).join("  ") ?? ""
  };
}

function parseArrEntry(entry) {
  const parts = String(entry || "").split(/\s{2,}/);
  return {
    arr_med: parts[0] ?? "",
    arr_dose: parts[1] ?? "",
    arr_rx: parts[2] ?? ""
  };
}

function composeDEntry(draft) {
  const code = String(draft.d_code ?? "").trim();
  const cert = String(draft.d_cert ?? "").trim();
  const text = String(draft.d_text ?? "").trim();
  return `${code}   ${cert}   ${text}`.trim();
}

function composeArrEntry(draft) {
  const med = String(draft.arr_med ?? "").trim();
  const dose = String(draft.arr_dose ?? "").trim();
  const rx = String(draft.arr_rx ?? "").trim().toUpperCase();
  return `${med}   ${dose}   ${rx}`.trim();
}

function startEdit() {
  const id = state.selection.rowId;
  if (!id) return;

  const row = state.entries.find((e) => e.id === id);
  if (!row) return;

  const draft = { ...row };
  const t = String(row.type || "").toUpperCase();

  if (t === "D") Object.assign(draft, parseDEntry(row.entry));
  if (t === "ARR") Object.assign(draft, parseArrEntry(row.entry));

  state.edit = {
    active: true,
    rowId: id,
    colKey: state.columns[0]?.key || null,
    subKey: null,
    draft
  };

  render();
  focus("editInput");
}

function stopEdit(save) {
  if (!state.edit?.active) return;

  if (save) {
    const idx = state.entries.findIndex((e) => e.id === state.edit.rowId);
    if (idx >= 0) {
      const draft = { ...state.edit.draft };
      const t = String(draft.type || "").toUpperCase();

      if (t === "D") {
        draft.entry = composeDEntry(draft);
        delete draft.d_code;
        delete draft.d_cert;
        delete draft.d_text;
      }

      if (t === "ARR") {
        draft.entry = composeArrEntry(draft);
        draft.greenRx = String(draft.arr_rx || "").toUpperCase().trim() === "G";
        delete draft.arr_med;
        delete draft.arr_dose;
        delete draft.arr_rx;
      }

      state.entries[idx] = draft;
      saveEntries(state.entries);
    }
  }

  state.edit = { active: false };
  render();
}

function moveEditCol(delta) {
  const keys = state.columns.map((c) => c.key);
  const idx = keys.indexOf(state.edit.colKey);
  if (idx < 0) return;

  const row = state.entries.find((e) => e.id === state.edit.rowId);
  const rowType = String(row?.type ?? "").toUpperCase();

  if (state.edit.colKey === "entry" && (rowType === "D" || rowType === "ARR")) {
    const order =
      rowType === "D"
        ? ["d_code", "d_cert", "d_text"]
        : ["arr_med", "arr_dose", "arr_rx"];

    if (!state.edit.subKey) state.edit.subKey = order[0];

    const i = order.indexOf(state.edit.subKey);
    const nextI = i + delta;

    if (nextI >= 0 && nextI < order.length) {
      state.edit.subKey = order[nextI];
      render();
      focus("editInput");
      return;
    }

    state.edit.subKey = null;
  }

  const next = Math.max(0, Math.min(keys.length - 1, idx + delta));
  state.edit.colKey = keys[next];

  if (state.edit.colKey !== "entry") state.edit.subKey = null;

  render();
  focus("editInput");
}

/* =========================
   SELECTION
========================= */

function moveSelection(delta) {
  const ids = getVisibleRowIds();
  if (!ids.length) return;

  const current = state.selection.rowId;
  let idx = current ? ids.indexOf(current) : -1;

  if (idx < 0) {
    idx = delta > 0 ? 0 : ids.length - 1;
  } else {
    idx = Math.max(0, Math.min(ids.length - 1, idx + delta));
  }

  state.selection.rowId = ids[idx];
  render();
}

function focusForStep(step) {

  if (step === "AU_from") return "auFromInput";
if (step === "AU_to") return "auToInput";
  if (step === "type") return "typeInput";

  if (step === "D_diag") return "codeInput";
  if (step === "D_cert") return "certInput";

  if (step === "ARR_med") return "medInput";
  if (step === "ARR_dose") return "doseInput";
  if (step === "ARR_rx") return "rxInput";

  if (step === "RCL_amount") return "rclAmountInput";
  if (step === "RCL_unit") return "rclUnitInput";

  if (step === "TXT_text") return "txtInput";

  return "typeInput";
}

/* =========================
   KEYBOARD
========================= */

function wire() {
  if (wired) return;
  wired = true;

  wireActions({
    state,
    render,
    focus,
    startInput,
    startEdit,
    deleteSelectedRow,
    doStepBack,
    markSelectedRow
  });

  wireSchein({ state, render });
  wireHeader({ state, render });
  wireBottomBar({ state, render });
  wireLayout({ state, render });
  wireConfig({ state, render, focus });

  function doStepBack() {
    if (!state.input?.active) return;

    stepBack(state);
    render();
    focus(focusForStep(state.input.step));
    reopenDropdownForCurrentStep();
  }

  document.addEventListener(
    "focusin",
    (e) => {
      const id = e.target?.id;

      const stepFromId = (x) => {
        if (x === "typeInput") return "type";
        if (x === "codeInput") return "D_diag";
        if (x === "certInput") return "D_cert";
        if (x === "medInput") return "ARR_med";
        if (x === "doseInput") return "ARR_dose";
        if (x === "rxInput") return "ARR_rx";
        if (x === "rclAmountInput") return "RCL_amount";
        if (x === "rclUnitInput") return "RCL_unit";
        if (x === "txtInput") return "TXT_text";
        return null;
      };

      const step = stepFromId(id);
      if (!step) return;

      if (!state.input) state.input = {};
      state.input.active = true;
      state.input.step = step;
    },
    true
  );

  window.__editUpdate = (key, value) => {
    if (!state.edit?.active) return;
    if (!state.edit.draft) return;
    state.edit.draft[key] = value;
  };

  document.addEventListener(
    "beforeinput",
    (e) => {
      if (!state.input?.active) return;
      if (e.inputType !== "historyUndo") return;

      e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      stepBack(state);
      render();
    },
    true
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (!state.input?.active) return;

      const isZ = String(e.key || "").toLowerCase() === "z";
      if (!isZ) return;
      if (!(e.metaKey || e.ctrlKey)) return;

      e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();

      stepBack(state);
      render();
    },
    true
  );

  document.addEventListener("input", (e) => {
    console.log("INPUT EVENT:", e.target.id, e.target.value);
    if (state.edit?.active) {
      const sub = e.target?.getAttribute?.("data-edit-sub");
      const field = e.target?.getAttribute?.("data-edit-field");

      if (sub) {
        state.edit.colKey = "entry";
        state.edit.subKey = sub;
        state.edit.draft[sub] = e.target.value;

        if (sub === "d_code") {
          handleDiagInput(state, e.target.value, e.target);
          renderDropdownOnly();
          return;
        }

        if (sub === "d_cert") {
          handleCertInput(state, e.target.value, e.target);
          renderDropdownOnly();
          return;
        }

        if (sub === "arr_med") {
          handleMedInput(state, e.target.value, e.target);
          renderDropdownOnly();
          return;
        }

        if (sub === "arr_dose") {
          handleArrDoseInput(state, e.target.value, e.target);
          renderDropdownOnly();
          return;
        }

        if (sub === "arr_rx") {
          handleArrRxInput(state, e.target.value, e.target);
          renderDropdownOnly();
          return;
        }

        return;
      }

      if (field === "type") {
        state.edit.colKey = "type";
        state.edit.subKey = null;
        state.edit.draft.type = e.target.value;
        handleTypeInput(state, e.target.value, e.target);
        renderDropdownOnly();
        return;
      }
    }

    if (e.target.id === "typeInput") {
      handleTypeInput(state, e.target.value, e.target);
      renderDropdownOnly();
      return;
    }

    if (e.target.id === "codeInput") {
      handleDiagInput(state, e.target.value, e.target);
      renderDropdownOnly();
      return;
    }

    if (e.target.id === "certInput") {
      handleCertInput(state, e.target.value, e.target);
      renderDropdownOnly();
      return;
    }

    if (e.target.id === "medInput") {
      handleMedInput(state, e.target.value, e.target);
      renderDropdownOnly();
      return;
    }

    if (e.target.id === "doseInput") {
      handleArrDoseInput(state, e.target.value, e.target);
      renderDropdownOnly();
      return;
    }

    if (e.target.id === "rxInput") {
      handleArrRxInput(state, e.target.value, e.target);
      renderDropdownOnly();
      return;
    }

    if (e.target.id === "rclAmountInput") {
      handleRclAmountInput(state, e.target.value, e.target);
      renderDropdownOnly();
      return;
    }

    if (e.target.id === "rclUnitInput") {
      handleRclUnitInput(state, e.target.value, e.target);
      renderDropdownOnly();
      return;
    }

    if (e.target.id === "txtInput") {
      state.input.txt = e.target.value;
    }

    if (e.target.id === "auFromInput") {
  handleAuFromInput(state, e.target.value);
  return;
}

if (e.target.id === "auToInput") {
  handleAuToInput(state, e.target.value);
  return;
}
  });

  document.addEventListener("keydown", (e) => {
    const isTyping =
      e.target &&
      (e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable);

        if (
  state.input?.active &&
  state.input.step === "RCL_amount" &&
  state.dropdown?.kind === "rcl_hint" &&
  String(e.key || "").toLowerCase() === "k"
) {
  e.preventDefault();

  const date = new Date();

  state.input.rcl.calendarPreview = date;

  state.dropdown.open = true;
  state.dropdown.kind = "rcl_calendar";
  state.dropdown.items = [];

  const el = document.getElementById("rclAmountInput");
  if (el) state.dropdown.anchorRect = el.getBoundingClientRect();

  render();
  return;
}

    if (state.input?.active && isTyping) {

      // =========================
// K = Kalender direkt öffnen
// =========================
if (
  state.input?.active &&
  state.input.step === "RCL_unit" &&
  String(e.key || "").toLowerCase() === "k"
) {
  e.preventDefault();

  const date = new Date();

  state.input.rcl.calendarPreview = date;

  state.dropdown.open = true;
  state.dropdown.kind = "rcl_calendar";

  const el = document.getElementById("rclUnitInput");
  if (el) state.dropdown.anchorRect = el.getBoundingClientRect();

  render();
  return;
}

      if (e.key === "Escape") {
        e.preventDefault();
        resetInput(state);
        render();
        return;
      }

      if (e.key === "Backspace") {
        const el = e.target;
        const v = String(el?.value ?? "");
        const atStart =
          (el?.selectionStart ?? 0) === 0 && (el?.selectionEnd ?? 0) === 0;

        if (v.length === 0 && atStart) {
          e.preventDefault();
          stepBack(state);
          render();
          return;
        }
      }
    }

    if (
      e.target.id === "certInput" &&
      (e.key === "+" || e.code === "NumpadAdd")
    ) {
      e.preventDefault();

      const cert = String(state.input.d.certainty ?? "").trim().toUpperCase();
      const code = String(state.draft.code ?? state.input.d.codeOrQuery ?? "").trim();
      const text = String(state.draft.text ?? "").trim();

      if (!cert || !code || !text) return;

      const entry = `${code}   ${cert}   ${text}`.trim();
      commitDiagnosisAndContinue(entry);
      return;
    }

    if (e.target.id === "certInput" && String(e.key || "").toLowerCase() === "g") {
      e.preventDefault();

      const cert = String(state.input.d.certainty ?? "").trim().toUpperCase();
      const code = String(state.draft.code ?? state.input.d.codeOrQuery ?? "").trim();
      const text = String(state.draft.text ?? "").trim();

      if (!cert || !code || !text) return;

      const entry = `${code}   ${cert}   ${text}`.trim();
      commitDiagnosisAndStartGreenRx(entry);
      return;
    }

    if (state.edit?.active) {
      if (e.key === "Enter") {
        e.preventDefault();
        stopEdit(true);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        stopEdit(false);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveEditCol(+1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveEditCol(-1);
        return;
      }
      return;
    }

    const isCopyShortcut =
      String(e.key || "").toLowerCase() === "c" &&
      (e.metaKey || e.ctrlKey);

    if (!isTyping && !state.input?.active && !state.edit?.active && state.selection.rowId && isCopyShortcut) {
      e.preventDefault();
      copySelectedRowToToday();
      return;
    }

if (state.dropdown?.open) {

  

  // ========================
  // KALENDER (FIX)
  // =========================
  if (state.dropdown.kind === "rcl_calendar") {

    if (e.key === "Enter") {
      e.preventDefault();

      const date = state.input.rcl.calendarPreview;
      const today = new Date();
      today.setHours(0,0,0,0);

      if (date < today) return;

      const formatted = date.toLocaleDateString("de-DE");

      commitRow("RCL", `Recall am ${formatted}`, {
        recallReminder: {
          dueDate: formatted,
          timestamp: date.getTime()
        }
      });

      return;
    }

    return; // 👉 GANZ WICHTIG
  }

  // =========================
  // KALENDER
  // =========================
  if (state.dropdown.kind === "rcl_calendar") {

    if (e.key === "Enter") {
      e.preventDefault();

      const date = state.input.rcl.calendarPreview;
      const today = new Date();
      today.setHours(0,0,0,0);

      if (date < today) return;

      const formatted = date.toLocaleDateString("de-DE");

      commitRow("RCL", `Recall am ${formatted}`, {
        recallReminder: {
          dueDate: formatted,
          timestamp: date.getTime()
        }
      });

      return;
    }
  }

  const len = state.dropdown.items.length;

  // 👉 Pfeile bleiben Dropdown-Steuerung
  if (e.key === "ArrowDown") {
    if (!len) return;
    e.preventDefault();
    state.dropdown.activeIndex = (state.dropdown.activeIndex + 1) % len;
    renderDropdownOnly();
    return;
  }

  if (e.key === "ArrowUp") {
    if (!len) return;
    e.preventDefault();
    state.dropdown.activeIndex =
      (state.dropdown.activeIndex - 1 + len) % len;
    renderDropdownOnly();
    return;
  }

  // 👉 ENTER NUR blockieren wenn Dropdown wirklich benutzt wird
  if (e.key === "Enter" && len > 0) {

    const item = state.dropdown.items[state.dropdown.activeIndex];
    if (!item) return;

    // 👉 WICHTIG: NUR blockieren wenn Dropdown aktiv benutzt wird
    // → NICHT bei normalen Input Feldern
    const isRealDropdownUse =
  state.dropdown.kind !== "rcl_hint" &&
  state.dropdown.kind !== "rcl_calendar" &&
  state.input.step !== "type"; 

    if (isRealDropdownUse) {
      e.preventDefault();

      const code = item.code;

      if (state.dropdown.kind === "type") {
        state.input.type = String(code || "").toUpperCase();
        state.dropdown.open = false;
        handleTypeEnter(state);
        render();
        return;
      }

      if (state.dropdown.kind === "diag") {
        state.input.d.codeOrQuery = String(code || "");
        state.dropdown.open = false;
        handleDiagEnter(state);
        render();
        focus("certInput");
        return;
      }

      if (state.dropdown.kind === "cert") {
        state.input.d.certainty = String(code || "").toUpperCase();
        state.dropdown.open = false;
        state.input.active = true;
        state.input.step = "D_cert";
        render();
        return;
      }

      if (state.dropdown.kind === "med") {
        state.input.arr.med = String(code || "");
        state.dropdown.open = false;
        handleArrMedEnter(state);
        render();
        focus("doseInput");
        return;
      }

      if (state.dropdown.kind === "arr_dose") {
        state.input.arr.dose = String(code || "");
        state.dropdown.open = false;
        handleArrDoseEnter(state);
        render();
        focus("rxInput");
        return;
      }

      if (state.dropdown.kind === "arr_rx") {
        state.input.arr.rx = String(code || "").toUpperCase();
        state.dropdown.open = false;
        handleArrRxEnter(state, commitRow);
        return;
      }

      if (state.dropdown.kind === "rcl_unit") {
        state.input.rcl.unit = String(code || "").toUpperCase();
        state.dropdown.open = false;
        handleRclUnitEnter(state, commitRow);
        return;
      }

      return;
    }
  }

  if (e.key === "Escape") {
    e.preventDefault();
    state.dropdown.open = false;
    renderDropdownOnly();
    return;
  }
}


 

    if (e.target.id === "typeInput" && e.key === "Enter") {
      e.preventDefault();
      handleTypeEnter(state);
      render();
      return;
    }

    if (e.target.id === "codeInput" && e.key === "Enter") {
      e.preventDefault();
      handleDiagEnter(state);
      render();
      focus("certInput");
      return;
    }

    if (e.target.id === "certInput" && e.key === "Enter") {
      e.preventDefault();
      handleCertEnter(state, commitRow);
      return;
    }

    if (e.target.id === "medInput" && e.key === "Enter") {
      e.preventDefault();
      handleArrMedEnter(state);
      render();
      focus("doseInput");
      return;
    }

    if (e.target.id === "doseInput" && e.key === "Enter") {
      e.preventDefault();
      handleArrDoseEnter(state);
      render();
      focus("rxInput");
      return;
    }

    if (e.target.id === "rxInput" && e.key === "Enter") {
      e.preventDefault();
      handleArrRxEnter(state, commitRow);
      return;
    }

   if (e.target.id === "rclAmountInput" && e.key === "Enter") {
  e.preventDefault();
  handleRclAmountEnter(state);

  render();

  requestAnimationFrame(() => {
    focus("rclUnitInput");
  });

  return;
}

    if (e.target.id === "rclUnitInput" && e.key === "Enter") {
      e.preventDefault();
      handleRclUnitEnter(state, commitRow);
      return;
    }

    if (e.target.id === "auFromInput" && e.key === "Enter") {
  e.preventDefault();
  handleAuFromEnter(state);
  render();
  focus("auToInput");
  return;
}

if (e.target.id === "auToInput" && e.key === "Enter") {
  e.preventDefault();
  handleAuToEnter(state, commitRow);
  return;
}

    if (e.target.id === "txtInput" && e.key === "Enter") {
      const raw = String(e.target.value ?? "");
      const lines = raw.split("\n");
      const lastLine = lines[lines.length - 1] ?? "";

      if (lastLine.trim() !== "") {
        return;
      }

      e.preventDefault();
      handleTxtEnter(state, commitRow);
      return;
    }

    if (!isTyping && e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(+1);
      return;
    }

    if (!isTyping && e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
      return;
    }

    if (!isTyping && (e.key === "Delete" || e.key === "Backspace")) {
      e.preventDefault();
      deleteSelectedRow();
      return;
    }

   // =========================
// ENTER = IMMER INPUT STARTEN
// =========================
if (!isTyping && !state.input?.active && e.key === "Enter") {
  e.preventDefault();

  state.selection.rowId = null;

  startInput(state);
  render();
  focus("typeInput");
  return;
}

// =========================
// B = EDIT MODE
// =========================
if (!isTyping && state.selection.rowId && (e.key === "b" || e.key === "B")) {
  e.preventDefault();
  startEdit();
  return;
}

    if (!isTyping && state.selection.rowId && (e.key === "t" || e.key === "T")) {
      e.preventDefault();
      markSelectedRow("turquoise");
      return;
    }

    if (!isTyping && state.selection.rowId && (e.key === "y" || e.key === "Y")) {
      e.preventDefault();
      markSelectedRow("yellow");
      return;
    }

    if (!isTyping && state.selection.rowId && (e.key === "u" || e.key === "U")) {
      e.preventDefault();
      markSelectedRow("");
      return;
    }

    if (!isTyping && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      if (state.input?.active) return;

      const ids = getVisibleRowIds();
      if (!ids.length) return;

      const first = ids[0];
      state.selection.rowId = state.selection.rowId === first ? null : first;
      render();
      return;
    }

    if (!isTyping && !state.input?.active) {
      const k = String(e.key || "").toLowerCase();

        if (k === "1") {
          e.preventDefault();
          state.filters.marker = "turquoise";
          render();
          return;
        }

        if (k === "2") {
          e.preventDefault();
          state.filters.marker = "yellow";
          render();
          return;
        }

        if (k === "0") {
          e.preventDefault();
          state.filters.marker = null;
          render();
          return;
        }

      const toggleType = (code) => {
        if (!Array.isArray(state.filters.types)) state.filters.types = [];
        const c = String(code).toUpperCase();
        const set = new Set(
          state.filters.types.map((x) => String(x).toUpperCase())
        );
        if (set.has(c)) set.delete(c);
        else set.add(c);
        state.filters.types = [...set];
      };

      if (k === "h") {
        e.preventDefault();
        state.filters.heute = !state.filters.heute;
        render();
        return;
      }

      if (k === "d") {
        e.preventDefault();
        toggleType("D");
        render();
        return;
      }

      if (k === "b") {
        e.preventDefault();
        toggleType("B");
        render();
        return;
      }

      if (k === "m") {
        e.preventDefault();
        toggleType("ARR");
        render();
        return;
      }

      if (k === "r") {
        e.preventDefault();
        toggleType("RCL");
        render();
        return;
      }

      if (k === "a") {
        e.preventDefault();
        state.filters.types = [];
        render();
        return;
      }

      if (k === "g") {
        e.preventDefault();
        state.filters.greenRxOnly = !state.filters.greenRxOnly;
        render();
        return;
      }
    }

    if (!isTyping && state.input?.active && state.input.step === "D_cert" && e.key === "Enter") {
      e.preventDefault();
      handleCertEnter(state, commitRow);
      return;
    }

    if (
      !isTyping &&
      state.input?.active &&
      state.input.step === "D_cert" &&
      (e.key === "+" || e.code === "NumpadAdd")
    ) {
      e.preventDefault();

      const cert = String(state.input.d.certainty ?? "").trim().toUpperCase();
      const code = String(state.draft.code ?? state.input.d.codeOrQuery ?? "").trim();
      const text = String(state.draft.text ?? "").trim();

      if (!cert || !code || !text) return;

      const entry = `${code}   ${cert}   ${text}`.trim();
      commitDiagnosisAndContinue(entry);
      return;
    }

    if (
      !isTyping &&
      state.input?.active &&
      state.input.step === "D_cert" &&
      String(e.key || "").toLowerCase() === "g"
    ) {
      e.preventDefault();

      const cert = String(state.input.d.certainty ?? "").trim().toUpperCase();
      const code = String(state.draft.code ?? state.input.d.codeOrQuery ?? "").trim();
      const text = String(state.draft.text ?? "").trim();

      if (!cert || !code || !text) return;

      const entry = `${code}   ${cert}   ${text}`.trim();
      commitDiagnosisAndStartGreenRx(entry);
      return;
    }

  });

  document.addEventListener("change", (e) => {

    if (e.target.id === "filterFG") {
      state.filters.fg = e.target.value || null;
      render();
      return;
    }
    if (e.target.id === "filterRange") {
      state.filters.rangePreset = e.target.value;

      if (e.target.value === "custom") {
        state.filters.customRangeModalOpen = true;
      } else {
        state.filters.customRangeModalOpen = false;
      }

      render();
      return;
    }

    const customRangeEl = e.target.closest("[data-custom-range]");
    if (customRangeEl) {
      const code = String(customRangeEl.getAttribute("data-custom-range") || "").toUpperCase();
      if (!code) return;

      if (!state.filters.customRanges) state.filters.customRanges = {};
      if (!state.filters.customRanges[code]) {
        state.filters.customRanges[code] = {
          rangePreset: "all",
          collapsed: false
        };
      }

      state.filters.customRanges[code].rangePreset = customRangeEl.value;
      render();
      return;
    }

    const customCollapsedEl = e.target.closest("[data-custom-collapsed]");
    if (customCollapsedEl) {
      const code = String(customCollapsedEl.getAttribute("data-custom-collapsed") || "").toUpperCase();
      if (!code) return;

      if (!state.filters.customRanges) state.filters.customRanges = {};
      if (!state.filters.customRanges[code]) {
        state.filters.customRanges[code] = {
          rangePreset: "all",
          collapsed: false
        };
      }

      state.filters.customRanges[code].collapsed = !!customCollapsedEl.checked;
      render();
      return;
    }

    if (e.target.id === "filterHeute") {
      state.filters.heute = !!e.target.checked;
      render();
      return;
    }
  });

document.addEventListener("click", (e) => {

const recallBtn = e.target.closest("[data-recall-done]");
if (recallBtn) {
  if (state.patient?.recallReminder) {
    state.patient.recallReminder.done = true;
    render();
  }
  return;
}

    // =========================
// CALENDAR NAV
// =========================
const calNav = e.target.closest("[data-cal-nav]");
if (calNav && state.dropdown.kind === "rcl_calendar") {
  const dir = Number(calNav.getAttribute("data-cal-nav"));

  const date = new Date(state.input.rcl.calendarPreview);
  date.setMonth(date.getMonth() + dir);

  state.input.rcl.calendarPreview = date;

  render();
  return;
}

// =========================
// CALENDAR DAY PICK
// =========================
const calDay = e.target.closest("[data-day]");
if (calDay && state.dropdown.kind === "rcl_calendar") {
  const day = Number(calDay.getAttribute("data-day"));

  const date = new Date(state.input.rcl.calendarPreview);
  date.setDate(day);

  const today = new Date();
  today.setHours(0,0,0,0);

  if (date < today) return; // ❌ Vergangenheit block

  const formatted = date.toLocaleDateString("de-DE");

  commitRow("RCL", `Recall am ${formatted}`, {
    recallReminder: {
      dueDate: formatted,
      timestamp: date.getTime()
    }
  });

  return;
}
  

    const hostSidebarToggle = e.target.closest("[data-host-sidebar-toggle]");
    if (hostSidebarToggle) {
      if (!state.ui) state.ui = {};
      state.ui.hostSidebarOpen = state.ui.hostSidebarOpen === false;
      render();
      return;
    }

    const topConfigBtn = e.target.closest("[data-top-config]");
    if (topConfigBtn) {
      state.ui.layoutOpen = true;
      state.ui.layoutTab = "bottomBar";
      render();
      return;
    }

    const topNewBtn = e.target.closest("[data-top-new]");
    if (topNewBtn) {
      return;
    }

    const topSaveBtn = e.target.closest("[data-top-save]");
    if (topSaveBtn) {
      return;
    }

    const topCloseBtn = e.target.closest("[data-top-close]");
    if (topCloseBtn) {
      return;
    }

    const openCustomRangeBtn = e.target.closest("[data-open-custom-range]");
    if (openCustomRangeBtn) {
      state.filters.customRangeModalOpen = true;
      render();
      return;
    }

    const closeCustomRangeBtn = e.target.closest("[data-custom-range-close]");
    if (closeCustomRangeBtn) {
      state.filters.customRangeModalOpen = false;
      render();
      return;
    }

    const customRangeBackdrop = e.target.closest("[data-custom-range-backdrop]");
    if (customRangeBackdrop && e.target === customRangeBackdrop) {
      state.filters.customRangeModalOpen = false;
      render();
      return;
    }

    const resetCustomRangeBtn = e.target.closest("[data-custom-range-reset]");
    if (resetCustomRangeBtn) {
      state.filters.customRanges = {};
      render();
      return;
    }

    const expBtn = e.target.closest("[data-expander-btn]");
    if (expBtn) {
      const key = expBtn.getAttribute("data-expander-btn");
      if (!key) return;

      if (!state.ui) state.ui = {};
      if (!state.ui.expandedDates) state.ui.expandedDates = {};
      state.ui.expandedDates[key] = !state.ui.expandedDates[key];

      render();
      return;
    }

    const chip = e.target.closest("[data-filter-type]");
    if (chip) {
      const code = String(chip.getAttribute("data-filter-type") || "").toUpperCase();

      if (code === "GREEN") {
        state.filters.greenRxOnly = !state.filters.greenRxOnly;
        render();
        return;
      }

      if (!Array.isArray(state.filters.types)) state.filters.types = [];

      if (code === "ALL") {
        state.filters.types = [];
        render();
        return;
      }

      const set = new Set(
        state.filters.types.map((x) => String(x).toUpperCase())
      );
      if (set.has(code)) set.delete(code);
      else set.add(code);

      state.filters.types = [...set];
      render();
      return;
    }

    const fgFilter = e.target.closest("[data-fg-filter]");
if (fgFilter) {
  const rect = fgFilter.getBoundingClientRect();

  state.dropdown = {
    open: true,
    kind: "fg_filter",
    items: [
      { code: "", text: "Alle" },
      { code: "FG", text: "FG" },
      { code: "FG2", text: "FG2" },
      { code: "FG3", text: "FG3" }
    ],
    anchorRect: rect,
    activeIndex: 0
  };

  render();
  return;
}

    const pick = e.target.closest("[data-pick]");
    if (pick && state.dropdown?.open) {
      const idxStr = pick.getAttribute("data-index");
      const idx = Number(idxStr);
      if (!Number.isNaN(idx)) state.dropdown.activeIndex = idx;

      const len = state.dropdown.items.length;
      if (!len) return;

      const item = state.dropdown.items[state.dropdown.activeIndex];

      if (state.dropdown.kind === "fg_filter") {
        state.filters.fg = item.code || null;
        state.dropdown.open = false;
        render();
        return;
      }
      if (!item) return;

      const code = item.code;

      if (state.dropdown.kind === "type") {
        state.input.type = String(code || "").toUpperCase();
        state.dropdown.open = false;

        handleTypeEnter(state);
        render();
        return;
      }

      if (state.dropdown.kind === "diag") {
        state.input.d.codeOrQuery = String(code || "");
        state.dropdown.open = false;

        handleDiagEnter(state);
        render();
        focus("certInput");
        return;
      }

      if (state.dropdown.kind === "cert") {
        state.input.d.certainty = String(code || "").toUpperCase();
        state.dropdown.open = false;

        handleCertEnter(state, commitRow);
        return;
      }

      if (state.dropdown.kind === "med") {
        state.input.arr.med = String(code || "");
        state.dropdown.open = false;

        handleArrMedEnter(state);
        render();
        focus("doseInput");
        return;
      }

      if (state.dropdown.kind === "arr_dose") {
        state.input.arr.dose = String(code || "");
        state.dropdown.open = false;

        handleArrDoseEnter(state);
        render();
        focus("rxInput");
        return;
      }

      if (state.dropdown.kind === "arr_rx") {
        state.input.arr.rx = String(code || "").toUpperCase();
        state.dropdown.open = false;

        handleArrRxEnter(state, commitRow);
        return;
      }

      if (state.dropdown.kind === "rcl_unit") {
        state.input.rcl.unit = String(code || "").toUpperCase();
        state.dropdown.open = false;

        handleRclUnitEnter(state, commitRow);
        return;
      }
    }
  });
}

function afterRenderBind() {
  bindRowSelection();
  bindSort();
  bindColumnDragAndDrop();

  if (state.input?.active && state.input.autofocusId) {
    const id = state.input.autofocusId;
    state.input.autofocusId = null;
    focus(id);
  }
}

function bindRowSelection() {
  const body = document.getElementById("gridBody");
  if (!body) return;

  body.onclick = (e) => {
    const tr = e.target.closest("tr[data-row]");
    if (!tr) return;
    const id = tr.getAttribute("data-row");
    if (!id) return;

    state.selection.rowId = state.selection.rowId === id ? null : id;
    render();
  };
}

function bindSort() {
  const sortDate = document.getElementById("sortDate");
  if (!sortDate) return;

  sortDate.onclick = () => {
    state.filters.sortBy = "date";
    state.filters.sortDir = state.filters.sortDir === "desc" ? "asc" : "desc";
    render();
  };
}

function bindColumnDragAndDrop() {
  const ths = document.querySelectorAll("th[data-col-index]");
  if (!ths.length) return;

  let dragFrom = null;

  ths.forEach((th) => {
    th.ondragstart = (e) => {
      dragFrom = Number(th.getAttribute("data-col-index"));
      e.dataTransfer.effectAllowed = "move";
    };

    th.ondragover = (e) => {
      e.preventDefault();
    };

    th.ondrop = (e) => {
      e.preventDefault();
      const dragTo = Number(th.getAttribute("data-col-index"));

      if (
        Number.isNaN(dragFrom) ||
        Number.isNaN(dragTo) ||
        dragFrom === dragTo
      )
        return;

      const cols = [...state.columns];
      const [moved] = cols.splice(dragFrom, 1);
      cols.splice(dragTo, 0, moved);

      state.columns = cols;
      saveColumns(state.columns);
      render();
    };
  });
}
render();
