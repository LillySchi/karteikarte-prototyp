// src/ui/scheinModal.js
import { escapeHtml, getActiveSchein } from "../state/store.js";

const KIND_OPTIONS = [
  { code: "KASSE", text: "Kasse" },
  { code: "PRIVAT", text: "Privat" },
  { code: "BG", text: "BG" },
  { code: "IGEL", text: "IGeL" }
];

export function ScheinModal(state) {
  if (!state?.ui?.scheinOpen) return "";

  const active = getActiveSchein(state);
  const draft = state.ui.scheinDraft || { selectedId: active?.id || null };
  const newDraft = state.ui.scheinNewDraft || { kind: "KASSE", name: "" };

  const scheine = state.scheine || [];
  const canDelete = scheine.length > 1;

  const list = scheine
    .map((s) => {
      const isActive = String(s.id) === String(active?.id);
      const isSelected = String(s.id) === String(draft.selectedId);

      return `
        <div class="schein-row">
          <button
            type="button"
            class="schein-item ${isSelected ? "on" : ""}"
            data-schein-pick="${escapeHtml(s.id)}"
            aria-pressed="${isSelected ? "true" : "false"}"
          >
            <div class="schein-title">${escapeHtml(s.name)}</div>
            <div class="schein-sub">
              ${escapeHtml(String(s.kind || "").toUpperCase())}
              ${isActive ? ` • <span class="schein-active-tag">AKTIV</span>` : ""}
            </div>
          </button>

          <button
            class="btn tiny schein-del"
            type="button"
            data-schein-delete="${escapeHtml(s.id)}"
            ${canDelete && !isActive ? "" : "disabled"}
            title="${
              isActive
                ? "Aktiven Schein erst wechseln"
                : canDelete
                ? "Schein löschen"
                : "Mindestens ein Schein muss bleiben"
            }"
          >✕</button>
        </div>
      `;
    })
    .join("");

  const kindOptions = KIND_OPTIONS.map(
    (k) => `<option value="${escapeHtml(k.code)}" ${String(newDraft.kind).toUpperCase() === k.code ? "selected" : ""}>
      ${escapeHtml(k.text)}
    </option>`
  ).join("");

  return `
    <div class="modal-backdrop" data-schein-backdrop>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Schein wechseln">
        <div class="modal-head">
          <div class="modal-title">Schein wechseln</div>
          <button class="btn tiny" type="button" data-schein-close>Schließen</button>
        </div>

        <div class="modal-body">
          <div class="cfg-grid">
            <div class="cfg-card">
              <div class="cfg-card-title">Aktiver Schein</div>
              <div class="cfg-help">
                <span class="schein-active">${escapeHtml(active?.name || "—")}</span>
              </div>

              <div class="schein-list">
                ${list || `<div class="fg-muted">Keine Scheine vorhanden.</div>`}
              </div>

              <div class="cfg-row-actions" style="margin-top:12px;">
                <button class="btn" type="button" data-schein-set-active>Als aktiv setzen</button>
                <button class="btn" type="button" data-schein-rename>Umbenennen</button>
              </div>
            </div>

            <div class="cfg-card">
              <div class="cfg-card-title">Neuen Schein anlegen</div>

              <div class="cfg-row">
                <label class="cfg-label">Typ</label>
                <select class="cfg-select ris-field" data-schein-new-kind>
                  ${kindOptions}
                </select>
              </div>

              <div class="cfg-row">
                <label class="cfg-label">Name</label>
                <input
                  class="cfg-input ris-field"
                  type="text"
                  value="${escapeHtml(newDraft.name || "")}"
                  placeholder="leer = automatischer Name"
                  data-schein-new-name
                />
              </div>

              <div class="cfg-row-actions">
                <button class="btn" type="button" data-schein-new>Anlegen</button>
              </div>

            </div>
          </div>
        </div>

        <div class="modal-foot">
          <button class="btn" type="button" data-schein-cancel>Abbrechen</button>
          <button class="btn primary" type="button" data-schein-apply>Übernehmen</button>
        </div>
      </div>
    </div>
  `;
}

export function ensureScheinDraft(state) {
  const active = getActiveSchein(state);
  state.ui = state.ui || {};

  if (!state.ui.scheinDraft) state.ui.scheinDraft = { selectedId: active?.id || null };
  if (!state.ui.scheinNewDraft) state.ui.scheinNewDraft = { kind: "KASSE", name: "" };
}