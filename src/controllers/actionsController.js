// src/controllers/actionsController.js
export function wireActions({
  state,
  render,
  focus,
  startInput,
  startEdit,
  deleteSelectedRow,
  doStepBack,
  markSelectedRow
}) {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) {
      if (state.ui?.markMenuOpen) {
        state.ui.markMenuOpen = false;
        render();
      }
      return;
    }

    const action = btn.getAttribute("data-action");

    if (action !== "mark-menu-toggle" && !String(action).startsWith("mark-")) {
      if (state.ui?.markMenuOpen) {
        state.ui.markMenuOpen = false;
      }
    }

    if (action === "new") {
      startInput(state);
      render();
      focus("typeInput");
      return;
    }

    if (action === "edit") {
      if (!state.selection?.rowId) return;
      startEdit();
      return;
    }

    if (action === "delete") {
      if (!state.selection?.rowId) return;
      deleteSelectedRow();
      return;
    }

    if (action === "undo") {
      if (!state.input?.active) return;
      if (typeof doStepBack !== "function") return;
      doStepBack();
      return;
    }

    if (action === "search") {
      state.ui = state.ui || {};
      state.ui.searchOpen = true;
      render();
      focus("searchInput");
      return;
    }

    if (action === "config") {
      state.ui = state.ui || {};
      state.ui.configOpen = true;
      render();
      return;
    }

    if (action === "mark-menu-toggle") {
      state.ui = state.ui || {};
      state.ui.markMenuOpen = !state.ui.markMenuOpen;
      render();
      return;
    }

    if (action === "mark-turquoise") {
      if (typeof markSelectedRow !== "function") return;
      markSelectedRow("turquoise");
      state.ui.markMenuOpen = false;
      return;
    }

    if (action === "mark-yellow") {
      if (typeof markSelectedRow !== "function") return;
      markSelectedRow("yellow");
      state.ui.markMenuOpen = false;
      return;
    }

    if (action === "mark-pink") {
      if (typeof markSelectedRow !== "function") return;
      markSelectedRow("pink");
      state.ui.markMenuOpen = false;
      return;
    }

    if (action === "mark-green") {
      if (typeof markSelectedRow !== "function") return;
      markSelectedRow("green");
      state.ui.markMenuOpen = false;
      return;
    }

    if (action === "mark-clear") {
      if (typeof markSelectedRow !== "function") return;
      markSelectedRow("");
      state.ui.markMenuOpen = false;
    }
  });
}