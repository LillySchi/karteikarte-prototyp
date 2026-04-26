export function Actions(state) {
  const markOpen = !!state?.ui?.markMenuOpen;

  return `
    <div class="button-row">
      <button class="btn" data-action="new"><span class="icon"></span>Neu</button>
      <button class="btn" data-action="edit"><span class="icon"></span>Ändern</button>
      <button class="btn" data-action="undo"><span class="icon"></span>Rückgängig</button>
      <button class="btn" data-action="search"><span class="icon"></span>Suche</button>
      <button class="btn" data-action="config"><span class="icon"></span>Konfigurieren</button>

      <div class="mark-menu-wrap">
        <button class="btn" data-action="mark-menu-toggle">
          <span class="icon"></span>Markieren
        </button>

        ${
          markOpen
            ? `
              <div class="mark-menu">
                <button class="mark-dot mark-dot--turquoise" data-action="mark-turquoise" title="Türkis"></button>
                <button class="mark-dot mark-dot--yellow" data-action="mark-yellow" title="Gelb"></button>
                <button class="mark-dot mark-dot--pink" data-action="mark-pink" title="Rosa"></button>
                <button class="mark-dot mark-dot--green" data-action="mark-green" title="Grün"></button>
                <button class="mark-clear" data-action="mark-clear">Ohne</button>
              </div>
            `
            : ""
        }
      </div>
    
      <button class="btn" data-action="delete"><span class="icon"></span>Löschen</button>
      
    </div>
  `;
}