// src/controllers/headerController.js

import { clonePatientForQueue, getActiveSchein, mergePatientRecall } from "../state/store.js";

export function wireHeader({ state, render }) {
  function ensure() {
    state.ui = state.ui || {};
    state.ui.header = state.ui.header || {};
    state.ui.header.open = state.ui.header.open || {};
    state.ui.header.show = state.ui.header.show || {};
    if (typeof state.ui.header.minimized !== "boolean") {
      state.ui.header.minimized = false;
    }
  }

  function escapeHtmlLocal(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function askKeepLimitedChronic(patientName, itemLabel) {
    return new Promise((resolve) => {
      const existing = document.getElementById("limitedChronicModal");
      if (existing) existing.remove();

      const backdrop = document.createElement("div");
      backdrop.id = "limitedChronicModal";
      backdrop.style.position = "fixed";
      backdrop.style.inset = "0";
      backdrop.style.background = "rgba(20, 28, 48, 0.28)";
      backdrop.style.display = "flex";
      backdrop.style.alignItems = "center";
      backdrop.style.justifyContent = "center";
      backdrop.style.zIndex = "9999";

      const modal = document.createElement("div");
      modal.style.width = "min(520px, calc(100vw - 32px))";
      modal.style.background = "#f5f6fb";
      modal.style.border = "2px solid #7d8fc2";
      modal.style.boxShadow = "0 10px 28px rgba(0,0,0,0.16)";
      modal.style.padding = "18px";
      modal.style.fontFamily = "system-ui, sans-serif";
      modal.style.color = "#1f2a44";

      modal.innerHTML = `
        <div style="font-size:18px; font-weight:700; margin-bottom:10px;">
          Zeitlich begrenzte Dauerdiagnose
        </div>

        <div style="font-size:13px; color:#4e5f8e; margin-bottom:12px;">
          Patient: ${escapeHtmlLocal(patientName)}
        </div>

        <div style="font-size:15px; margin-bottom:8px;">
          Noch relevant?
        </div>

        <div style="
          border:1px solid #a9b6d8;
          background:#ffffff;
          padding:12px;
          font-size:15px;
          font-weight:700;
          line-height:1.35;
          margin-bottom:14px;
        ">
          ${escapeHtmlLocal(itemLabel)}
        </div>

        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button
            type="button"
            data-lc-remove
            style="
              min-width:110px;
              padding:9px 12px;
              border:1px solid #7d8fc2;
              background:#ffffff;
              color:#2b3b63;
              font-weight:700;
              cursor:pointer;
            "
          >
            Entfernen
          </button>

          <button
            type="button"
            data-lc-keep
            style="
              min-width:110px;
              padding:9px 12px;
              border:1px solid #7d8fc2;
              background:#4f669e;
              color:#ffffff;
              font-weight:700;
              cursor:pointer;
            "
          >
            Behalten
          </button>
        </div>
      `;

      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      const keepBtn = modal.querySelector("[data-lc-keep]");
      const removeBtn = modal.querySelector("[data-lc-remove]");

      let done = false;

      function finish(value) {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKeyDown, true);
        backdrop.remove();
        resolve(value);
      }

      function onKeyDown(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          finish(true);
          return;
        }

        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          finish(false);
          return;
        }
      }

      keepBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        finish(true);
      });

      removeBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        finish(false);
      });

      backdrop.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.target === backdrop) {
          finish(false);
        }
      });

      document.addEventListener("keydown", onKeyDown, true);
      requestAnimationFrame(() => keepBtn?.focus());
    });
  }

  function showRecallPopup(state, render) {
  const r = state.patient?.recallReminder;
  if (!r) return;

  if (r.dueDate) {
  const existing = document.getElementById("recallPopup");
  if (existing) existing.remove();
  return;
}

  
  if (state.ui?.recallPopupHiddenUntil) {
    const now = Date.now();
    if (now < state.ui.recallPopupHiddenUntil) return;
  }

  const existing = document.getElementById("recallPopup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "recallPopup";

  popup.style.position = "fixed";
  popup.style.top = "20px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";

  popup.style.background = "#fff4e8";
  popup.style.border = "1px solid #f0b48a";
  popup.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
  popup.style.padding = "12px 16px";
  popup.style.zIndex = "9999";
  popup.style.fontFamily = "system-ui";
  popup.style.minWidth = "320px";
  popup.style.borderRadius = "10px";

  popup.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
      <div style="font-size:14px; font-weight:600;">
        Wiedervorstellung planen
      </div>

      <button data-recall-close
        style="
          border:none;
          background:none;
          font-size:16px;
          cursor:pointer;
          line-height:1;
        "
      >✕</button>
    </div>

    <div style="margin-top:6px; font-size:13px; color:#6b3f1d;">
      Kein Termin gesetzt
    </div>
  `;

  document.body.appendChild(popup);

  const closeBtn = popup.querySelector("[data-recall-close]");

  closeBtn?.addEventListener("click", () => {
    // 👉 5 minuten ausblenden
    state.ui = state.ui || {};
    state.ui.recallPopupHiddenUntil = Date.now() + 5 * 60 * 1000;

    popup.remove();
  });
}

  async function askLimitedChronics(patient) {
    if (!patient || !Array.isArray(patient.limitedChronics)) return patient;

    const kept = [];

    for (const item of patient.limitedChronics) {
      const keep = await askKeepLimitedChronic(patient.name, item.label);

      if (keep) kept.push(item);
    }

    patient.limitedChronics = kept;

    const limitedLabels = kept.map((x) => x.label).filter(Boolean);
    const baseChronic = String(patient.chronic || "").trim();

    patient.chronic = [baseChronic, ...limitedLabels]
      .filter((x) => String(x || "").trim())
      .join(" | ");

    return patient;
  }

  async function switchToQueuePatient(queueId) {
    const activeSchein = getActiveSchein(state);
    const activeScheinName = activeSchein?.name || state.patient?.aktiverSchein || "";

    let nextPatient = clonePatientForQueue(queueId, activeScheinName);
    if (!nextPatient) return;

    nextPatient = await askLimitedChronics(nextPatient);
    nextPatient = mergePatientRecall(nextPatient, state.patientRecalls);

    state.activeQueueId = queueId;

    state.ui = state.ui || {};
    state.ui.queueActiveId = queueId;

    state.patient = nextPatient;

    render();
showRecallPopup(state, render);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-hdr-toggle]");
    if (!btn) return;

    ensure();

    const id = String(btn.getAttribute("data-hdr-toggle") || "");
    if (!id) return;

    state.ui.header.open[id] = !state.ui.header.open[id];
    render();
  });

  document.addEventListener("click", (e) => {
    const minBtn = e.target.closest("[data-hdr-minimize]");
    if (!minBtn) return;

    ensure();
    state.ui.header.minimized = !state.ui.header.minimized;
    render();
  });

  document.addEventListener("click", async (e) => {
    const next = e.target.closest("[data-queue-next]");
    if (!next) return;

    const q = state.ui.queue || state.queue || [];
    if (!q.length) return;

    const current = String(
      state.ui.queueActiveId ||
      state.activeQueueId ||
      q[0].id
    );

    const idx = q.findIndex((x) => String(x.id) === current);
    const nextIdx = (idx + 1) % q.length;
    const nextQueueId = q[nextIdx].id;

    await switchToQueuePatient(nextQueueId);
  });

document.addEventListener("recall-created", () => {
  render();
  showRecallPopup(state, render);
});
}