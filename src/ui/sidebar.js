// src/ui/sidebar.js

function icon(id, active = false) {
  return `
    <button
      type="button"
      class="host-sidebar-icon ${active ? "on" : ""}"
      data-sidebar-item="${id}"
    >
      <span class="host-sidebar-icon-box"></span>
    </button>
  `;
}

export function Sidebar(state) {
  const open = state?.ui?.hostSidebarOpen !== false;

  const active = state?.ui?.activeSidebarItem || "karte";

  return `
    <aside class="host-sidebar ${open ? "is-open" : "is-collapsed"}">
      <div class="host-sidebar-top">
        <button
          type="button"
          class="host-sidebar-toggle"
          data-host-sidebar-toggle="1"
        >
          ${open ? "◀" : "▶"}
        </button>
      </div>

      <div class="host-sidebar-icons">
        ${icon("karte", active === "karte")}
        ${icon("patienten", active === "patienten")}
        ${icon("termine", active === "termine")}
        ${icon("einstellungen", active === "einstellungen")}
      </div>
    </aside>
  `;
}