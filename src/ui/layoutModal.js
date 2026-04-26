// src/ui/layoutModal.js

import {
  escapeHtml,
  labelForBottomBarId,
  BOTTOMBAR_PRESETS
} from "../state/store.js";

function tabBtn(active, key, label) {
  const on = active === key ? "chip on" : "chip";
  return `
    <button
      class="${on}"
      type="button"
      data-layout-tab="${escapeHtml(key)}"
    >
      ${escapeHtml(label)}
    </button>
  `;
}

/* =========================
   PROFILE TAB
========================= */

function renderProfileTab(state) {
  const currentPreset = state?.ui?.bottomBar?.preset || "ALLGEMEIN";
  const keys = Object.keys(BOTTOMBAR_PRESETS || {});

  return `
    <div class="cfg-card">
      <div class="cfg-card-title">Konfigurationsprofil</div>

      <div class="cfg-row">
        <div class="cfg-label">Voreinstellung</div>

        <div class="cfg-row-actions">
          ${keys
            .map((k) => {
              const cls =
                String(currentPreset) === String(k) ? "btn primary" : "btn";

              return `
                <button
                  class="${cls}"
                  type="button"
                  data-bb-preset="${escapeHtml(k)}"
                >
                  ${escapeHtml(k)}
                </button>
              `;
            })
            .join("")}
        </div>
      </div>

      <div class="cfg-row">
        <div class="cfg-label">Weitere Einstellungen</div>

        <div class="cfg-row-actions">
          <button
            class="btn"
            type="button"
            data-open-table-config="1"
          >
            Tabelle konfigurieren
          </button>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   BOTTOM BAR
========================= */

function renderBottomBarTab(state) {
  const cfg = state?.ui?.bottomBar || { order: [], hidden: [] };
  const shown = cfg.order || [];
  const hidden = cfg.hidden || [];
  const isModern = state?.ui?.visualStyle === "modern";

  return `
    <div class="layout-bb-grid">
      <div class="bb-card">
        <div class="bb-card-title">Aktionsleiste</div>

        <div class="bb-list">
          ${shown
            .map(
              (id, idx) => `
                <div class="bb-item" draggable="true" data-bb-drag="1" data-bb-idx="${idx}">
                  <div class="bb-handle">⋮⋮</div>
                  <div class="bb-label">${escapeHtml(labelForBottomBarId(id))}</div>

                  <div class="bb-actions">
                    ${
                      !isModern
                        ? `
                        <button class="btn tiny" data-bb-move="up" data-bb-idx="${idx}">↑</button>
                        <button class="btn tiny" data-bb-move="down" data-bb-idx="${idx}">↓</button>
                      `
                        : ""
                    }
                    <button class="btn tiny" data-bb-hide="1" data-bb-idx="${idx}">Aus</button>
                  </div>
                </div>
              `
            )
            .join("")}
        </div>
      </div>

      <div class="bb-card">
        <div class="bb-card-title">Mehr…</div>

        <div class="bb-chiplist">
          ${hidden
            .map(
              (id) => `
                <button class="bb-chip" data-bb-show="${escapeHtml(id)}">
                  + ${escapeHtml(labelForBottomBarId(id))}
                </button>
              `
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

/* =========================
   HEADER
========================= */

function renderHeaderTab(state) {
  const hdr = state?.ui?.header || { show: {}, open: {} };

  const rows = [
    { key: "chronic", label: "Chronisch / Hinweise" },
    { key: "overview", label: "Übersicht" },
    { key: "prevention", label: "Vorsorge" },
    { key: "order", label: "Auftrag / Fall" }
  ];

  return `
    <div class="cfg-card">
      <div class="cfg-card-title">Patienteninformation</div>

      <div class="cfg-cols">
        ${rows
          .map(
            (r) => `
              <div class="cfg-col">
                <div class="cfg-col-label">${escapeHtml(r.label)}</div>

                <label class="cfg-check">
                  <input type="checkbox" data-hdr-show="${r.key}" ${hdr.show?.[r.key] ? "checked" : ""}/>
                  <span>Anzeigen</span>
                </label>

                <label class="cfg-check">
                  <input type="checkbox" data-hdr-open="${r.key}" ${hdr.open?.[r.key] ? "checked" : ""}/>
                  <span>Standardmäßig geöffnet</span>
                </label>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

/* =========================
   STYLE
========================= */

function renderStyleTab(state) {
  const current = state?.ui?.visualStyle || "classic";

  return `
    <div class="cfg-card">
      <div class="cfg-card-title">Darstellung</div>

      <div class="cfg-row-actions">
        <button class="${current === "classic" ? "btn primary" : "btn"}" data-style-set="classic">
          Klassisch
        </button>

        <button class="${current === "modern" ? "btn primary" : "btn"}" data-style-set="modern">
          Modern
        </button>
      </div>
    </div>
  `;
}

/* =========================
   MAIN
========================= */

export function LayoutModal(state) {
  if (!state?.ui?.layoutOpen) return "";

  const tab = state?.ui?.layoutTab || "profile";

  return `
    <div class="modal-backdrop" data-layout-backdrop>
      <div class="modal">
        <div class="modal-head">
          <div class="modal-title">Allgemeine Konfiguration</div>
          <button class="btn" data-layout-close>Schließen</button>
        </div>

        <div class="modal-body">
          <div class="cfg-chips">
            ${tabBtn(tab, "profile", "Konfigurationsprofil")}
            ${tabBtn(tab, "bottomBar", "Aktionsleiste")}
            ${tabBtn(tab, "header", "Patienteninformation")}
            ${tabBtn(tab, "style", "Darstellung")}
          </div>

          ${
            tab === "profile"
              ? renderProfileTab(state)
              : tab === "bottomBar"
              ? renderBottomBarTab(state)
              : tab === "header"
              ? renderHeaderTab(state)
              : renderStyleTab(state)
          }
        </div>

        <div class="modal-foot">
          <button class="btn" data-layout-close>Fertig</button>
        </div>
      </div>
    </div>
  `;
}