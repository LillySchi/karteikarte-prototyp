// src/ui/configModal.js

import { escapeHtml, TYPE_ITEMS } from "../state/store.js";

/* =========================
   CONSTANTS
========================= */

const RANGE_PRESETS = [
  { code: "all", text: "Alle" },
  { code: "7d", text: "Letzte 7 Tage" },
  { code: "1m", text: "Letzter Monat" },
  { code: "6m", text: "Letzte 6 Monate" },
  { code: "1y", text: "Letztes Jahr" }
];

/* =========================
   MAIN MODAL
========================= */

export function ConfigModal(state) {
  if (!state?.ui?.configOpen) return "";

  const d = state.ui.configDraft || createDraftFromState(state);

  const typeCodes = TYPE_ITEMS
    .map((x) => String(x.code || "").toUpperCase())
    .filter((c) => c && c !== "?");

  const rangeOptions = RANGE_PRESETS.map(
    (p) =>
      `<option value="${escapeHtml(p.code)}" ${
        d.rangePreset === p.code ? "selected" : ""
      }>${escapeHtml(p.text)}</option>`
  ).join("");

  const sortOptions = `
    <option value="desc" ${d.sortDir === "desc" ? "selected" : ""}>Neueste zuerst</option>
    <option value="asc" ${d.sortDir === "asc" ? "selected" : ""}>Älteste zuerst</option>
  `;

  return `
    <div class="modal-backdrop" data-config-backdrop>
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">Tabellen-Konfiguration</div>
          <button class="btn tiny" type="button" data-config-close>Schließen</button>
        </div>

        <div class="modal-body">
          <div class="cfg-grid">

            <!-- =========================
                 SPALTEN
            ========================= -->

            <div class="cfg-card">
              <div class="cfg-card-title">Spalten</div>

              <div class="cfg-row">
                <label class="cfg-label">Reihenfolge</label>

                <div class="cfg-cols">
                  ${(d.columns || [])
                    .map((c, idx) => {
                      const isVisible = c.visible !== false;

                      return `
                        <div
                          class="cfg-col"
                          data-col-drag="1"
                          data-col-idx="${idx}"
                          draggable="true"
                        >
                          <div class="cfg-col-handle">⋮⋮</div>
                          <div class="cfg-col-label">${escapeHtml(c.label)}</div>

                          <label class="cfg-check" style="margin-left:auto;">
                            <input
                              type="checkbox"
                              data-col-visible="1"
                              data-col-idx="${idx}"
                              ${isVisible ? "checked" : ""}
                            />
                            <span>Anzeigen</span>
                          </label>
                        </div>
                      `;
                    })
                    .join("")}
                </div>

                <div class="cfg-row-actions">
                  <button class="btn" type="button" data-config-reset-cols>
                    Spalten zurücksetzen
                  </button>
                </div>
              </div>
            </div>

            <!-- =========================
                 FILTER
            ========================= -->

            <div class="cfg-card">
              <div class="cfg-card-title">Filter</div>

              <div class="cfg-row">
                <label class="cfg-label">Zeitraum</label>

                <div style="display:flex; gap:8px; align-items:center;">
                  <select class="cfg-select" data-cfg="rangePreset">
                    ${rangeOptions}
                    <option value="custom" ${
                      d.rangePreset === "custom" ? "selected" : ""
                    }>
                      Benutzerdefiniert
                    </option>
                  </select>

                  ${
                    d.rangePreset === "custom"
                      ? `
                        <button
                          class="btn tiny"
                          type="button"
                          data-open-custom-range
                        >
                          Bearbeiten
                        </button>
                      `
                      : ""
                  }
                </div>
              </div>

              <div class="cfg-row">
                <label class="cfg-label">Sortierung</label>
                <select class="cfg-select" data-cfg="sortDir">
                  ${sortOptions}
                </select>
              </div>

              <div class="cfg-row">
                <label class="cfg-label">Zeilentyp</label>

                <div class="cfg-chips">
                  <button class="chip ${!d.types?.length ? "on" : ""}" data-type="ALL">
                    Alle
                  </button>

                  ${typeCodes
                    .map((code) => {
                      const on = d.types?.includes(code);
                      return `
                        <button class="chip ${on ? "on" : ""}" data-type="${escapeHtml(code)}">
                          ${escapeHtml(code)}
                        </button>
                      `;
                    })
                    .join("")}
                </div>
              </div>

              <div class="cfg-row">
                <label class="cfg-check">
                  <input type="checkbox" data-cfg="greenRxOnly" ${d.greenRxOnly ? "checked" : ""}/>
                  Nur grünes Rezept
                </label>
              </div>

              <div class="cfg-row-actions">
                <button class="btn" type="button" data-config-reset-filters>
                  Filter zurücksetzen
                </button>
              </div>
            </div>

            <!-- =========================
                 WECHSEL ZUR LAYOUT KONFIG
            ========================= -->

            <div class="cfg-row">
              <div class="cfg-label">Weitere Einstellungen</div>

              <div class="cfg-row-actions">
                <button
                  class="btn"
                  type="button"
                  data-open-layout-config="1"
                >
                  Oberfläche konfigurieren
                </button>
              </div>
            </div>

          </div>
        </div>

        <div class="modal-foot">
          <button class="btn" type="button" data-config-cancel>Abbrechen</button>
          <button class="btn primary" type="button" data-config-apply>Übernehmen</button>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   DRAFT
========================= */

export function createDraftFromState(state) {
  return {
    columns: [...(state.columns || [])],
    rangePreset: state.filters?.rangePreset || "all",
    sortDir: state.filters?.sortDir || "desc",
    types: Array.isArray(state.filters?.types)
      ? [...state.filters.types.map((x) => String(x).toUpperCase())]
      : [],
    greenRxOnly: !!state.filters?.greenRxOnly,
    customRanges: { ...(state.filters?.customRanges || {}) }
  };
}