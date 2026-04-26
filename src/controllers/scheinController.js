// src/controllers/scheinController.js
import { saveScheine, saveActiveScheinId, getActiveSchein } from "../state/store.js";
import { ensureScheinDraft } from "../ui/scheinModal.js";

function defaultNameForKind(kind) {
  const dt = new Date();
  const y = dt.getFullYear();
  const q = Math.floor(dt.getMonth() / 3) + 1;

  if (kind === "KASSE") return `Kasse Q${q}/${y}`;
  if (kind === "PRIVAT") return `Privat ${String(dt.getMonth() + 1).padStart(2, "0")}/${y}`;
  if (kind === "BG") return `BG ${String(dt.getMonth() + 1).padStart(2, "0")}/${y}`;
  if (kind === "IGEL") return `IGeL ${String(dt.getMonth() + 1).padStart(2, "0")}/${y}`;
  return `Schein ${String(dt.getMonth() + 1).padStart(2, "0")}/${y}`;
}

function createSchein({ kind, name }) {
  const cleanKind = String(kind || "KASSE").toUpperCase();
  const cleanName = String(name || "").trim() || defaultNameForKind(cleanKind);

  return {
    id: crypto.randomUUID(),
    kind: cleanKind,
    name: cleanName,
    createdAt: Date.now()
  };
}

export function wireSchein({ state, render }) {
  function closeSchein() {
    state.ui = state.ui || {};
    state.ui.scheinOpen = false;
    state.ui.scheinDraft = null;
    state.ui.scheinNewDraft = null;
    render();
  }

  function openSchein() {
    state.ui = state.ui || {};
    state.ui.scheinOpen = true;
    ensureScheinDraft(state);
    render();
  }

  function persistActiveToPatient() {
    const active = getActiveSchein(state);
    if (active && state.patient) state.patient.aktiverSchein = active.name;
  }

  function applySchein() {
    ensureScheinDraft(state);

    const id = state.ui.scheinDraft?.selectedId;
    if (!id) return;

    state.activeScheinId = id;
    persistActiveToPatient();

    saveScheine(state.scheine || []);
    saveActiveScheinId(state.activeScheinId);

    closeSchein();
  }

  function setSelectedAsActive() {
    ensureScheinDraft(state);

    const id = state.ui.scheinDraft?.selectedId;
    if (!id) return;

    state.activeScheinId = id;
    persistActiveToPatient();

    saveScheine(state.scheine || []);
    saveActiveScheinId(state.activeScheinId);

    render();
  }

  function pickSchein(id) {
    ensureScheinDraft(state);
    state.ui.scheinDraft.selectedId = id;
    render();
  }

  function newScheinFromDraft() {
    ensureScheinDraft(state);

    const kind = state.ui?.scheinNewDraft?.kind || "KASSE";
    const name = state.ui?.scheinNewDraft?.name || "";

    const s = createSchein({ kind, name });

    state.scheine = [...(state.scheine || []), s];
    saveScheine(state.scheine || []);

    state.ui.scheinDraft.selectedId = s.id;
    state.ui.scheinNewDraft.name = "";
    render();
  }

  function renameSelected() {
    ensureScheinDraft(state);

    const id = state.ui.scheinDraft?.selectedId;
    if (!id) return;

    const s = (state.scheine || []).find((x) => String(x.id) === String(id));
    if (!s) return;

    const next = window.prompt("Neuer Name für den Schein:", s.name);
    if (next === null) return;

    const clean = String(next || "").trim();
    if (!clean) return;

    state.scheine = (state.scheine || []).map((x) =>
      String(x.id) === String(id) ? { ...x, name: clean } : x
    );

    persistActiveToPatient();
    saveScheine(state.scheine || []);
    render();
  }

  function deleteById(idToDelete) {
    ensureScheinDraft(state);

    if (!idToDelete) return;
    if ((state.scheine || []).length <= 1) return;

    const active = getActiveSchein(state);
    if (String(idToDelete) === String(active?.id)) {
      window.alert("Der aktive Schein kann nicht gelöscht werden. Bitte erst einen anderen aktiv setzen.");
      return;
    }

    const s = (state.scheine || []).find((x) => String(x.id) === String(idToDelete));
    if (!s) return;

    const ok = window.confirm(
      `Schein "${s.name}" wirklich löschen?\n\nEinträge werden dem aktiven Schein zugeordnet.`
    );
    if (!ok) return;

    const activeId = state.activeScheinId;

    state.entries = (state.entries || []).map((e) => {
      if (!e) return e;
      if (String(e.scheinId || "") === String(idToDelete)) {
        return { ...e, scheinId: activeId };
      }
      return e;
    });

    state.scheine = (state.scheine || []).filter((x) => String(x.id) !== String(idToDelete));
    saveScheine(state.scheine || []);

    state.ui.scheinDraft.selectedId = activeId;
    render();
  }

  document.addEventListener("input", (e) => {
    if (!state?.ui?.scheinOpen) return;

    if (e.target?.hasAttribute?.("data-schein-new-name")) {
      state.ui = state.ui || {};
      state.ui.scheinNewDraft = state.ui.scheinNewDraft || { kind: "KASSE", name: "" };
      state.ui.scheinNewDraft.name = e.target.value;
    }
  });

  document.addEventListener("change", (e) => {
    if (!state?.ui?.scheinOpen) return;

    if (e.target?.hasAttribute?.("data-schein-new-kind")) {
      state.ui = state.ui || {};
      state.ui.scheinNewDraft = state.ui.scheinNewDraft || { kind: "KASSE", name: "" };
      state.ui.scheinNewDraft.kind = e.target.value;
      render();
      return;
    }

    if (e.target?.hasAttribute?.("data-schein-enter-apply")) {
      state.ui = state.ui || {};
      state.ui.scheinEnterApply = !!e.target.checked;
      render();
    }
  });

  document.addEventListener("click", (e) => {
    const actionBtn = e.target.closest("[data-action]");
    if (actionBtn) {
      const action = actionBtn.getAttribute("data-action");
      if (action === "schein") {
        openSchein();
        return;
      }
    }

    if (!state?.ui?.scheinOpen) return;

    const backdrop = e.target.closest("[data-schein-backdrop]");
    if (backdrop && e.target === backdrop) {
      closeSchein();
      return;
    }

    if (e.target.closest("[data-schein-close]")) {
      closeSchein();
      return;
    }
    if (e.target.closest("[data-schein-cancel]")) {
      closeSchein();
      return;
    }

    if (e.target.closest("[data-schein-apply]")) {
      applySchein();
      return;
    }

    if (e.target.closest("[data-schein-set-active]")) {
      setSelectedAsActive();
      return;
    }

    if (e.target.closest("[data-schein-rename]")) {
      renameSelected();
      return;
    }

    const del = e.target.closest("[data-schein-delete]");
    if (del) {
      if (del.disabled) return;
      const id = del.getAttribute("data-schein-delete");
      deleteById(id);
      return;
    }

    const pick = e.target.closest("[data-schein-pick]");
    if (pick) {
      const id = pick.getAttribute("data-schein-pick");
      if (id) pickSchein(id);
      return;
    }

    if (e.target.closest("[data-schein-new]")) {
      newScheinFromDraft();
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!state?.ui?.scheinOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeSchein();
      return;
    }

    if (e.key === "Enter" && !!state.ui?.scheinEnterApply) {
      const tag = String(e.target?.tagName || "").toUpperCase();
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || !!e.target?.isContentEditable;
      if (isTyping) return;

      e.preventDefault();
      applySchein();
    }
  });
}