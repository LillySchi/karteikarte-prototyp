// src/ui/bottombar.js
import { escapeHtml, labelForBottomBarId } from "../state/store.js";

function bigBtn(id, label, idx) {
  const isMore = id === "__more__";
  const attrs = isMore
    ? `data-more-toggle="1"`
    : `draggable="true" data-bbbar-drag="1" data-bbbar-idx="${idx}"`;

  return `
    <div class="bigbtn ${isMore ? "bigbtn-more" : ""}"
         data-big="${escapeHtml(id)}"
         title="${escapeHtml(label)}"
         ${attrs}>
      <div class="bigicon"></div>
      <div class="biglabel">${escapeHtml(label)}</div>
    </div>
  `;
}

export function BottomBar(state) {
  const cfg = state?.ui?.bottomBar || { order: [], hidden: [], moreOpen: false };

  const shownRaw = Array.isArray(cfg.order) ? cfg.order : [];
  const hiddenRaw = Array.isArray(cfg.hidden) ? cfg.hidden : [];

  // Config belongs to topbar now -> never render it in bottom bar
  const shown = shownRaw.filter((id) => id !== "config");
  const hidden = hiddenRaw.filter((id) => id !== "config");

  const moreLabel = "Mehr…";

  return `
    <div class="bottombar" data-bbbar-root="1">
      ${shown.map((id, idx) => bigBtn(id, labelForBottomBarId(id), idx)).join("")}

      ${hidden.length ? bigBtn("__more__", moreLabel, -1) : ""}

      ${hidden.length && cfg.moreOpen ? `
        <div class="more-menu" data-more-menu="1">
          ${hidden.map((id) => `
            <button class="more-item" type="button" data-more-pick="${escapeHtml(id)}">
              ${escapeHtml(labelForBottomBarId(id))}
            </button>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}