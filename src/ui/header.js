import { escapeHtml } from "../state/store.js";

function secToggle(id, title, open) {
  return `
    <button
      type="button"
      class="hdr-toggle"
      data-hdr-toggle="${escapeHtml(id)}"
      aria-expanded="${open ? "true" : "false"}"
    >
      <span class="hdr-toggle-arrow">${open ? "▼" : "▶"}</span>
      <span class="hdr-toggle-title">${escapeHtml(title)}</span>
    </button>
  `;
}

function oneLine(s) {
  return String(s ?? "")
    .replace(/\r?\n/g, " | ")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/\s{2,}/g, " ")
    .trim();
}


function renderQueue(state, minimized = false) {
  const q =
    state?.ui?.queue ||
    state?.queue || [
      { id: "q1", name: "Müller, Anna", time: "08:40" },
      { id: "q2", name: "Schmidt, Tom", time: "08:55" },
      { id: "q3", name: "Kaya, Elif", time: "09:10" }
    ];

  const items = Array.isArray(q) ? q : [];
  if (!items.length) return "";

  const activeId = String(state?.ui?.queueActiveId || items[0]?.id || "");
  const activeIdx = items.findIndex((x) => String(x.id) === activeId);
  const nextIdx = activeIdx >= 0 ? (activeIdx + 1) % items.length : 0;
  const nextPatient = items[nextIdx] || items[0];

  if (minimized) {
    return `
      <div
        class="queue"
        style="
          padding:0;
          margin:0;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:flex-start;
          gap:6px;
        "
      >
        <button
          class="queue-next"
          type="button"
          data-queue-next="1"
          style="margin:0; width:100%;"
        >
          Nächster Patient
        </button>

        <div
          style="
            font-size:12px;
            font-weight:700;
            text-align:center;
            line-height:1.15;
            margin:0;
          "
        >
          ${escapeHtml(nextPatient?.name || "")}
        </div>
      </div>
    `;
  }

  return `
    <div class="queue">
      <div class="queue-title">Warteschlange</div>

      <div class="queue-list">
        ${items
          .slice(0, 6)
          .map((it) => {
            const isOn = String(it.id) === activeId;
            return `
              <div class="queue-item ${isOn ? "on" : ""}">
                <div class="queue-time">${escapeHtml(it.time || "")}</div>
                <div class="queue-name">${escapeHtml(it.name || "")}</div>
              </div>
            `;
          })
          .join("")}
      </div>

      <button class="queue-next" type="button" data-queue-next="1">
        Nächster Patient
      </button>
    </div>
  `;
}

export function Header(state) {
  const p = state.patient || {};
  const ui = state.ui || {};
  const h = ui.header || {};
  const open = h.open || {};
  const show = h.show || {};
  const minimized = !!h.minimized;

  const allergiesInline = oneLine(p.allergies || "");

  return `
    <div class="header">
      <div
        class="patnr"
        style="${
          minimized
            ? `
              display:flex;
              align-items:flex-start;
              justify-content:center;
              padding:8px 10px 6px 10px;
            `
            : ""
        }"
      >
        ${
          minimized
            ? renderQueue(state, true)
            : `
              <div class="label">Pat. Nr</div>
              <div class="value">${escapeHtml(p.patNr || "")}</div>
              ${renderQueue(state, false)}
            `
        }
      </div>

      <div class="header-main" style="line-height:1.1; position:relative;">

        <button
          type="button"
          class="btn tiny"
          data-hdr-minimize
          style="
            position:absolute;
            top:8px;
            right:10px;
            min-width:28px;
            height:28px;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:0;
            border-radius:999px;
          "
          aria-label="${minimized ? "Header aufklappen" : "Header minimieren"}"
          title="${minimized ? "Header aufklappen" : "Header minimieren"}"
        >
          ${minimized ? "▴" : "▾"}
        </button>

        <div class="header-grid" style="grid-template-columns:160px 1fr auto; gap:6px 12px; margin:0; padding-right:80px;">
          <div class="hcell small">Patient:</div>

          <div class="hcell">
            <b>
              ${escapeHtml(p.name || "")}
              <span style="margin-left:4px;">
                *${escapeHtml(p.dob || "")} (${escapeHtml(p.age || "")})
              </span>
            </b>
          </div>

          <div class="hcell" style="justify-self:end;">
            <b>${escapeHtml(p.gender || "")}</b>
          </div>
        </div>

        <div class="header-grid" style="grid-template-columns:160px 1fr 200px; gap:6px 12px; margin:4px 0 0 0; padding-right:80px;">
          <div class="hcell small">Aktiver Schein:</div>
          <div class="hcell"><b>${escapeHtml(p.aktiverSchein || "")}</b></div>
          <div class="hcell" style="justify-self:end;">
            <b>Fall: ${escapeHtml(p.fall || "")}</b>
          </div>
        </div>

        ${
          minimized
            ? ""
            : `
              <div class="header-grid" style="grid-template-columns:160px 1fr auto; gap:6px 12px; margin:4px 0 0 0;">
                <div class="hcell small">Kasse:</div>
                <div class="hcell"><b>${escapeHtml(p.kasse || "")}</b></div>

               ${
                    p.recallReminder?.dueDate
                        ? `<div class="hcell" style="justify-self:end;">
                            <span style="
                            display:inline-flex;
                            align-items:center;
                            gap:6px;
                            padding:4px 10px;
                            border-radius:999px;
                            background:#e8f5ec;
                            color:#2e7d32;
                            font-weight:600;
                            font-size:12px;
                            border:1px solid #b7e1c1;
                            ">
                            Wiedervorstellung: ${escapeHtml(p.recallReminder.dueDate)}
                            </span>
                        </div>`
                        : `<div></div>`
                    }
                  
              </div>

              <div class="header-grid" style="grid-template-columns:160px 1fr; gap:6px 12px; margin:4px 0 0 0;">
                <div class="hcell small">Allergien:</div>
                <div class="hcell">
                  <span class="redline">${escapeHtml(allergiesInline)}</span>
                </div>
              </div>

              <div class="hdr-sections" style="margin-top:6px;">
                ${show.chronic ? `
                  ${secToggle("chronic", "Dauerdiagnosen", !!open.chronic)}
                  ${open.chronic ? `
                    <div class="hdr-sec-body">
                      <div class="header-grid">
                        <div class="hcell small">Chronisch:</div>
                        <div class="hcell">
                          <span class="redline">${escapeHtml(oneLine(p.chronic || "—"))}</span>
                        </div>
                      </div>
                    </div>
                  ` : ""}
                ` : ""}

                ${show.overview ? secToggle("overview","Überblick",!!open.overview) : ""}
                ${show.prevention ? secToggle("prevention","Vorsorge",!!open.prevention) : ""}
                ${show.order ? secToggle("order","Auftrag/Fall",!!open.order) : ""}
              </div>
            `
        }
      </div>
    </div>
  `;
}