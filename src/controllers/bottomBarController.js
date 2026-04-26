// src/controllers/bottomBarController.js
import { saveBottomBarConfig } from "../state/store.js";

export function wireBottomBar({ state, render }) {
  let dragFrom = null;

  function getVisibleOrder() {
    const cfg = state.ui.bottomBar;
    const order = Array.isArray(cfg.order) ? cfg.order : [];
    return order.filter((id) => id !== "config");
  }

  function getRealIndexFromVisibleIndex(visibleIdx) {
    const cfg = state.ui.bottomBar;
    const order = Array.isArray(cfg.order) ? cfg.order : [];

    let visibleCounter = -1;

    for (let i = 0; i < order.length; i += 1) {
      if (order[i] === "config") continue;
      visibleCounter += 1;
      if (visibleCounter === visibleIdx) return i;
    }

    return -1;
  }

  function reorder(fromIdx, toIdx) {
    const cfg = state.ui.bottomBar;
    const order = Array.isArray(cfg.order) ? cfg.order : [];

    const realFrom = getRealIndexFromVisibleIndex(fromIdx);
    const realTo = getRealIndexFromVisibleIndex(toIdx);

    if (
      Number.isNaN(fromIdx) ||
      Number.isNaN(toIdx) ||
      fromIdx < 0 ||
      toIdx < 0 ||
      realFrom < 0 ||
      realTo < 0 ||
      realFrom >= order.length ||
      realTo >= order.length ||
      realFrom === realTo
    ) {
      return;
    }

    const next = [...order];
    const [moved] = next.splice(realFrom, 1);
    next.splice(realTo, 0, moved);

    cfg.order = next;
    saveBottomBarConfig(cfg);
    render();
  }

  // =========================
  // DRAG & DROP (BOTTOM BAR)
  // =========================
  document.addEventListener("dragstart", (e) => {
    const btn = e.target.closest("[data-bbbar-drag]");
    if (!btn) return;

    const idx = Number(btn.getAttribute("data-bbbar-idx"));
    if (Number.isNaN(idx)) return;

    dragFrom = idx;

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try {
        e.dataTransfer.setData("text/plain", String(idx));
      } catch {}
    }
  });

  document.addEventListener("dragover", (e) => {
    if (dragFrom === null) return;

    const root = e.target.closest("[data-bbbar-root]");
    if (!root) return;

    const over = e.target.closest("[data-bbbar-drag]");
    if (!over) return;

    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  });

  document.addEventListener("drop", (e) => {
    if (dragFrom === null) return;

    const root = e.target.closest("[data-bbbar-root]");
    if (!root) return;

    const over = e.target.closest("[data-bbbar-drag]");
    if (!over) return;

    e.preventDefault();

    const dragTo = Number(over.getAttribute("data-bbbar-idx"));
    reorder(dragFrom, dragTo);

    dragFrom = null;
  });

  document.addEventListener("dragend", () => {
    dragFrom = null;
  });

  // =========================
  // CLICK HANDLING
  // =========================
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-big]");
    if (!btn) return;

    const id = String(btn.getAttribute("data-big") || "");

    // More menu toggle
    if (btn.matches("[data-more-toggle]")) {
      state.ui.bottomBar.moreOpen = !state.ui.bottomBar.moreOpen;
      render();
      return;
    }

    // Bottom bar is now only for area navigation
    // Add future area switching here if needed:
    // pacs, labor, briefe, termine, ...
    void id;
  });

  // Pick from "Mehr…" menu
  document.addEventListener("click", (e) => {
    const pick = e.target.closest("[data-more-pick]");
    if (!pick) return;

    const id = String(pick.getAttribute("data-more-pick") || "");
    if (!id || id === "config") return;

    const cfg = state.ui.bottomBar;
    const hiddenIdx = cfg.hidden.indexOf(id);
    if (hiddenIdx === -1) return;

    cfg.hidden.splice(hiddenIdx, 1);
    cfg.order.push(id);
    cfg.moreOpen = false;

    saveBottomBarConfig(cfg);
    render();
  });

  // Close "Mehr…" when clicking outside
  document.addEventListener("click", (e) => {
    const menu = e.target.closest("[data-more-menu]");
    const toggle = e.target.closest("[data-more-toggle]");
    if (menu || toggle) return;

    if (state.ui?.bottomBar?.moreOpen) {
      state.ui.bottomBar.moreOpen = false;
      render();
    }
  });
}