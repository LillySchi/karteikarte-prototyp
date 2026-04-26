// src/ui/topbar.js
function action(label, attr) {
  return `
    <button type="button" class="topbar-link" ${attr}>
      <span class="topbar-link-icon" aria-hidden="true"></span>
      <span class="topbar-link-text">${label}</span>
    </button>
  `;
}

export function TopBar() {
  return `
    <div class="topbar">
      <div class="topbar-left"></div>

      <div class="topbar-actions">
        ${action("SPEICHERN", 'data-top-save="1"')}
        ${action("NEU", 'data-top-new="1"')}
        ${action("KONFIGURATION", 'data-top-config="1"')}
        ${action("VERLASSEN", 'data-top-close="1"')}
      </div>
    </div>
  `;
}