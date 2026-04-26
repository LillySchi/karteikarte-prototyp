// src/ui/filters.js

import { escapeHtml, TYPE_ITEMS } from "../state/store.js";

/* =========================
   HELPERS
========================= */

function option(value, label, current) {
  const sel = String(current) === String(value) ? "selected" : "";
  return `<option value="${escapeHtml(value)}" ${sel}>${escapeHtml(label)}</option>`;
}

function chip(code, label, active) {
  return `
    <button
      type="button"
      class="type-chip ${active ? "active" : ""}"
      data-filter-type="${escapeHtml(code)}"
    >${escapeHtml(label)}</button>
  `;
}

/* =========================
   CUSTOM RANGE ROW
========================= */

function customRangeRow(code, label, cfg = {}) {
  const range = cfg.rangePreset || "all";
  const collapsed = !!cfg.collapsed;

  return `
    <div class="custom-range-row">

      <div class="custom-range-label">
        <div class="cfg-code">${escapeHtml(code)}</div>
        <div class="cfg-text">${escapeHtml(label)}</div>
      </div>

      <select
        class="cfg-select compact"
        data-custom-range="${escapeHtml(code)}"
      >
        ${option("all", "Alle", range)}
        ${option("7d", "1 Woche", range)}
        ${option("1m", "1 Monat", range)}
        ${option("6m", "6 Monate", range)}
        ${option("1y", "1 Jahr", range)}
      </select>

      <label class="cfg-check">
        <input
          type="checkbox"
          data-custom-collapsed="${escapeHtml(code)}"
          ${collapsed ? "checked" : ""}
        />
        <span>eingeklappt</span>
      </label>

    </div>
  `;
}

/* =========================
   CUSTOM RANGE MODAL
========================= */

// src/ui/filters.js

export function CustomRangeModal(state) {
  if (!state.filters?.customRangeModalOpen) return "";

  const customRanges = state.filters?.customRanges || {};

  const rows = TYPE_ITEMS
    .filter((x) => x.code !== "?")
    .map((x) =>
      customRangeRow(x.code, x.text, customRanges[x.code] || {})
    )
    .join("");

  const greenCfg = customRanges.GREEN || {};

  return `
    <div class="modal-backdrop" data-custom-range-backdrop>
      <div class="modal modal--compact">
        <div class="modal-head">
          <div class="modal-title">Benutzerdefinierter Zeitraum</div>
          <button class="btn tiny" type="button" data-custom-range-close>Schließen</button>
        </div>

        <div class="modal-body">
          <div class="cfg-card">
            <div class="cfg-card-title">Zeiträume pro Bereich</div>

            <div class="cfg-cols">
              ${rows}
              ${customRangeRow("GREEN", "Grünes Rezept", greenCfg)}
            </div>
          </div>
        </div>

        <div class="modal-foot">
          <button class="btn" type="button" data-custom-range-reset>Zurücksetzen</button>
          <button class="btn primary" type="button" data-custom-range-close>Fertig</button>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   FILTER BAR
========================= */

export function Filters(state) {
  const range = state.filters?.rangePreset ?? "all";

  const activeTypes = new Set(
    Array.isArray(state.filters?.types)
      ? state.filters.types.map((x) => String(x).toUpperCase())
      : []
  );

  const chips = TYPE_ITEMS
    .filter((x) => x.code !== "?")
    .map((x) =>
      chip(x.code, x.code, activeTypes.has(String(x.code).toUpperCase()))
    );

  const allActive = activeTypes.size === 0;
  const greenOn = !!state.filters?.greenRxOnly;

  return `
    <div class="filters">
      <div class="filter filter--range">
        <label class="filter-label">Zeitraum</label>
        <select id="filterRange" class="filter-select">
          ${option("all", "Alle", range)}
          ${option("7d", "1 Woche", range)}
          ${option("1m", "1 Monat", range)}
          ${option("6m", "6 Monate", range)}
          ${option("1y", "1 Jahr", range)}
          ${option("custom", "Benutzerdefiniert", range)}
        </select>

        ${
          range === "custom"
            ? `
              <button
                type="button"
                class="btn primary tiny filter-edit-btn"
                data-open-custom-range
              >
                Bearbeiten
              </button>
            `
            : ""
        }
      </div>

      <div class="filter filter--types">
        <label class="filter-label">Zeilentyp</label>
        <div class="type-chips">
          ${chip("ALL", "Alle", allActive)}
          ${chips.join("")}
          ${chip("GREEN", "🟢 Rezept", greenOn)}
        </div>
      </div>

      <div class="filter filter--fg">
  <label class="filter-label">FG</label>

        <select id="filterFG" class="filter-select">
            <option value="">Alle</option>
            <option value="FG">FG</option>
            <option value="FG2">FG2</option>
            <option value="FG3">FG3</option>
        </select>
        </div>

      <div class="filter filter--heute">
        <label class="filter-label" for="filterHeute">Heute</label>
        <input id="filterHeute" type="checkbox" ${state.filters?.heute ? "checked" : ""}/>
      </div>
    </div>
  `;
}