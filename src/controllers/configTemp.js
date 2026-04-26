// src/controllers/configController.js

import { saveColumns } from "../state/store.js";
import { createDraftFromState } from "../ui/configModal.js";

function getDefaultColumns() {
  return [
    { key: "date", label: "Datum", widthClass: "col-date", sortable: true, visible: true },
    { key: "type", label: "Typ", widthClass: "col-type", visible: true },
    { key: "fg", label: "FG", widthClass: "col-fg", visible: true },
    { key: "entry", label: "Eintrag", widthClass: "col-entry", visible: true },
    { key: "s", label: "S", widthClass: "col-s", visible: true },
    { key: "ekz", label: "EKZ", widthClass: "col-ekz", visible: true },
    { key: "bkz", label: "BKZ", widthClass: "col-bkz", visible: true }
  ];
}

export function wireConfig({ state, render }) {
  let dragColFromIdx = null;

  function ensureDraft() {
    state.ui = state.ui || {};
    if (!state.ui.configDraft) state.ui.configDraft = createDraftFromState(state);
    return state.ui.configDraft;
  }

  function openConfig() {
    state.ui = state.ui || {};
    state.ui.configOpen = true;
    state.ui.configDraft = createDraftFromState(state);
    render();
  }

  function closeConfig() {
    if (!state.ui) return;
    state.ui.configOpen = false;
    state.ui.configDraft = null;
    render();
  }

  function applyConfig() {
    const d = state.ui?.configDraft;
    if (!d) return;

    if (Array.isArray(d.columns) && d.columns.length) {
      state.columns = [...d.columns];
      saveColumns(state.columns);
    }

    state.filters = state.filters || {};
    state.filters.rangePreset = d.rangePreset || "all";
    state.filters.sortDir = d.sortDir || "desc";
    state.filters.types = Array.isArray(d.types) ? [...d.types] : [];
    state.filters.greenRxOnly = !!d.greenRxOnly;
    state.filters.customRanges = { ...(d.customRanges || {}) };

    closeConfig();
  }

  function getColDragIdx(target) {
    const row = target?.closest?.("[data-col-drag]");
    if (!row) return null;
    const idx = Number(row.getAttribute("data-col-idx"));
    return Number.isNaN(idx) ? null : idx;
  }

  function moveItem(arr, from, to) {
    if (!Array.isArray(arr)) return arr;
    if (from === to) return arr;
    if (from < 0 || to < 0) return arr;
    if (from >= arr.length || to >= arr.length) return arr;

    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  }

  /* =========================
     DRAG
  ========================= */

  document.addEventListener("dragstart", (e) => {
    if (!state.ui?.configOpen) return;

    const from = getColDragIdx(e.target);
    if (from === null) return;

    dragColFromIdx = from;

    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(from));
    } catch {}
  });

  document.addEventListener("dragover", (e) => {
    if (!state.ui?.configOpen) return;

    const to = getColDragIdx(e.target);
    if (to === null) return;

    e.preventDefault();

    try {
      e.dataTransfer.dropEffect = "move";
    } catch {}
  });

  document.addEventListener("drop", (e) => {
    if (!state.ui?.configOpen) return;

    const to = getColDragIdx(e.target);
    if (to === null) return;

    e.preventDefault();

    let from = dragColFromIdx;

    if (from === null) {
      try {
        const raw = e.dataTransfer.getData("text/plain");
        const n = Number(raw);
        from = Number.isNaN(n) ? null : n;
      } catch {
        from = null;
      }
    }

    if (from === null || from === to) return;

    const d = ensureDraft();
    if (!Array.isArray(d.columns)) return;

    d.columns = moveItem(d.columns, from, to);
    render();
  });

  document.addEventListener("dragend", () => {
    dragColFromIdx = null;
  });

  /* =========================
     CLICK
  ========================= */

  document.addEventListener("click", (e) => {
    const openBtn = e.target.closest("[data-action='config']");
    if (openBtn) {
      e.preventDefault();
      openConfig();
      return;
    }

    if (!state.ui?.configOpen) return;

    /* Layout öffnen */
    const openLayout = e.target.closest("[data-open-layout-config]");
    if (openLayout) {
      e.preventDefault();
      state.ui.configOpen = false;
      state.ui.layoutOpen = true;
      render();
      return;
    }

    /* Custom Range öffnen */
    const openCustom = e.target.closest("[data-open-custom-range]");
    if (openCustom) {
      e.preventDefault();
      state.filters = state.filters || {};
      state.filters.customRangeModalOpen = true;
      render();
      return;
    }

    const backdrop = e.target.closest("[data-config-backdrop]");
    if (backdrop && e.target === backdrop) {
      closeConfig();
      return;
    }

    if (e.target.closest("[data-config-close]")) {
      closeConfig();
      return;
    }

    if (e.target.closest("[data-config-cancel]")) {
      closeConfig();
      return;
    }

    if (e.target.closest("[data-config-apply]")) {
      applyConfig();
      return;
    }

    const moveBtn = e.target.closest("[data-col-move]");
    if (moveBtn) {
      const dir = moveBtn.getAttribute("data-col-move");
      const idx = Number(moveBtn.getAttribute("data-col-idx"));
      const d = ensureDraft();

      const next = dir === "up" ? idx - 1 : idx + 1;
      if (next < 0 || next >= d.columns.length) return;

      const cols = [...d.columns];
      const tmp = cols[idx];
      cols[idx] = cols[next];
      cols[next] = tmp;
      d.columns = cols;

      render();
      return;
    }

    if (e.target.closest("[data-config-reset-cols]")) {
      const d = ensureDraft();
      d.columns = getDefaultColumns();
      render();
      return;
    }

    if (e.target.closest("[data-config-reset-filters]")) {
      const d = ensureDraft();
      d.rangePreset = "all";
      d.sortDir = "desc";
      d.types = [];
      d.greenRxOnly = false;
      d.customRanges = {};
      render();
      return;
    }

    const typeBtn = e.target.closest("[data-type]");
    if (typeBtn) {
      const code = String(typeBtn.getAttribute("data-type") || "").toUpperCase();
      const d = ensureDraft();

      if (code === "ALL") {
        d.types = [];
        render();
        return;
      }

      const set = new Set((d.types || []).map((x) => String(x).toUpperCase()));
      if (set.has(code)) set.delete(code);
      else set.add(code);
      d.types = [...set];

      render();
      return;
    }
  });

  /* =========================
     CHANGE
  ========================= */

  document.addEventListener("change", (e) => {
    if (!state.ui?.configOpen) return;

    const cfgEl = e.target.closest("[data-cfg]");
    if (cfgEl) {
      const key = cfgEl.getAttribute("data-cfg");
      const d = ensureDraft();

      if (key === "rangePreset") d.rangePreset = cfgEl.value;
      if (key === "sortDir") d.sortDir = cfgEl.value;
      if (key === "greenRxOnly") d.greenRxOnly = !!cfgEl.checked;

      render();
      return;
    }

    const colVisibleEl = e.target.closest("[data-col-visible]");
    if (colVisibleEl) {
      const idx = Number(colVisibleEl.getAttribute("data-col-idx"));
      const d = ensureDraft();

      d.columns[idx] = {
        ...d.columns[idx],
        visible: !!colVisibleEl.checked
      };

      render();
      return;
    }
  });

  /* =========================
     KEY
  ========================= */

  document.addEventListener("keydown", (e) => {
    if (!state.ui?.configOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeConfig();
    }
  });
}