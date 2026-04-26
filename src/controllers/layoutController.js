// src/controllers/layoutController.js

import { saveBottomBarConfig, defaultBottomBarConfig } from "../state/store.js";

/**
 * Layout Controller
 * - Handles layout configuration modal
 * - Bottom bar (Aktionsleiste) ordering / visibility
 * - Header visibility + default open state
 * - Style switching (classic / modern)
 * - Navigation shortcut → Tabellen-Konfiguration
 */

export function wireLayout({ state, render }) {
  let dragFromIdx = null;

  function close() {
    state.ui.layoutOpen = false;
    render();
  }

  function getDragIdx(target) {
    const row = target?.closest?.("[data-bb-drag]");
    if (!row) return null;
    const idx = Number(row.getAttribute("data-bb-idx"));
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
     DRAG & DROP (Bottom Bar)
  ========================= */

  document.addEventListener("dragstart", (e) => {
    if (!state.ui?.layoutOpen) return;
    if ((state.ui.layoutTab || "bottomBar") !== "bottomBar") return;

    const from = getDragIdx(e.target);
    if (from === null) return;

    dragFromIdx = from;

    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(from));
    } catch {}
  });

  document.addEventListener("dragenter", (e) => {
    if (!state.ui?.layoutOpen) return;
    if ((state.ui.layoutTab || "bottomBar") !== "bottomBar") return;

    const to = getDragIdx(e.target);
    if (to === null) return;

    e.preventDefault();
  });

  document.addEventListener("dragover", (e) => {
    if (!state.ui?.layoutOpen) return;
    if ((state.ui.layoutTab || "bottomBar") !== "bottomBar") return;

    const to = getDragIdx(e.target);
    if (to === null) return;

    e.preventDefault();

    try {
      e.dataTransfer.dropEffect = "move";
    } catch {}
  });

  document.addEventListener("drop", (e) => {
    if (!state.ui?.layoutOpen) return;
    if ((state.ui.layoutTab || "bottomBar") !== "bottomBar") return;

    const to = getDragIdx(e.target);
    if (to === null) return;

    e.preventDefault();

    let from = dragFromIdx;

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

    const cfg = state.ui.bottomBar;
    cfg.order = moveItem(cfg.order, from, to);

    saveBottomBarConfig(cfg);
    render();
  });

  document.addEventListener("dragend", () => {
    dragFromIdx = null;
  });

  /* =========================
     CLICK HANDLER
  ========================= */

  document.addEventListener("click", (e) => {
    if (!state.ui?.layoutOpen) return;

    /* CLOSE MODAL */
    if (e.target.closest("[data-layout-close]")) {
      e.preventDefault();
      close();
      return;
    }

    /* BACKDROP CLICK */
    const bd = e.target.closest("[data-layout-backdrop]");
    if (bd && !e.target.closest(".modal")) {
      close();
      return;
    }

    /* TAB SWITCH */
    const tab = e.target.closest("[data-layout-tab]");
    if (tab) {
      e.preventDefault();
      state.ui.layoutTab = tab.getAttribute("data-layout-tab");
      render();
      return;
    }

    /* SHORTCUT → TABLE CONFIG */
    const openTableCfg = e.target.closest("[data-open-table-config]");
    if (openTableCfg) {
      e.preventDefault();
      state.ui.layoutOpen = false;
      state.ui.configOpen = true;
      render();
      return;
    }

    /* STYLE SWITCH */
    const styleBtn = e.target.closest("[data-style-set]");
    if (styleBtn) {
      e.preventDefault();
      state.ui.visualStyle = styleBtn.getAttribute("data-style-set") || "classic";
      render();
      return;
    }

    /* =========================
       BOTTOM BAR
    ========================= */

    const presetBtn = e.target.closest("[data-bb-preset]");
    if (presetBtn) {
      e.preventDefault();
      const preset = presetBtn.getAttribute("data-bb-preset") || "ALLGEMEIN";

      state.ui.bottomBar = defaultBottomBarConfig(preset);
      state.ui.bottomBar.preset = preset;

      saveBottomBarConfig(state.ui.bottomBar);
      render();
      return;
    }

    const move = e.target.closest("[data-bb-move]");
    if (move) {
      e.preventDefault();

      const dir = move.getAttribute("data-bb-move");
      const idx = Number(move.getAttribute("data-bb-idx"));
      const cfg = state.ui.bottomBar;

      if (Number.isNaN(idx)) return;

      const next = dir === "up" ? idx - 1 : idx + 1;
      if (next < 0 || next >= cfg.order.length) return;

      const tmp = cfg.order[idx];
      cfg.order[idx] = cfg.order[next];
      cfg.order[next] = tmp;

      saveBottomBarConfig(cfg);
      render();
      return;
    }

    const hide = e.target.closest("[data-bb-hide]");
    if (hide) {
      e.preventDefault();

      const idx = Number(hide.getAttribute("data-bb-idx"));
      const cfg = state.ui.bottomBar;

      if (Number.isNaN(idx) || idx < 0 || idx >= cfg.order.length) return;

      const id = cfg.order.splice(idx, 1)[0];
      cfg.hidden.unshift(id);

      saveBottomBarConfig(cfg);
      render();
      return;
    }

    const show = e.target.closest("[data-bb-show]");
    if (show) {
      e.preventDefault();

      const id = String(show.getAttribute("data-bb-show") || "");
      const cfg = state.ui.bottomBar;

      const i = cfg.hidden.indexOf(id);
      if (i === -1) return;

      cfg.hidden.splice(i, 1);
      cfg.order.push(id);

      saveBottomBarConfig(cfg);
      render();
      return;
    }

    /* =========================
       HEADER
    ========================= */

    const hdrShow = e.target.closest("[data-hdr-show]");
    if (hdrShow) {
      const key = hdrShow.getAttribute("data-hdr-show");

      state.ui.header.show[key] = !!hdrShow.checked;

      if (!hdrShow.checked) {
        state.ui.header.open[key] = false;
      }

      render();
      return;
    }

    const hdrOpen = e.target.closest("[data-hdr-open]");
    if (hdrOpen) {
      const key = hdrOpen.getAttribute("data-hdr-open");
      state.ui.header.open[key] = !!hdrOpen.checked;

      render();
      return;
    }
  });
}