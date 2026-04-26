// src/ui/table.js
import { InputRow } from "../ui/inputRow.js";
import { escapeHtml, todayDE, parseDEDateToKey } from "../state/store.js";

function getVisibleColumns(state) {
  return (state.columns || []).filter((col) => col.visible !== false);
}

export function Table(state) {
  return `
    <div class="table-wrap">
      <table class="grid">
        <thead>
          <tr>
            ${renderHeader(state)}
          </tr>
        </thead>
        <tbody id="gridBody">
          ${state.filters.sortDir === "desc" ? renderInputRow(state) : ""}
          ${renderRows(state)}
          ${state.filters.sortDir === "asc" ? renderInputRow(state) : ""}
        </tbody>
      </table>
    </div>

    <div class="status-row">
      <div class="date">${todayDE()}</div>
      <div class="status">Status: keine offenen Leistungen</div>
    </div>
  `;
}

function renderHeader(state) {
  const visibleColumns = getVisibleColumns(state);

  return visibleColumns
    .map((col, idx) => {

        if (col.key === "date") return renderDateHeaderCell(state, col, idx);

      if (col.key === "fg") {
  return `
    <th
      class="${escapeHtml(col.widthClass)} clickable"
      data-fg-filter
      draggable="true"
      data-col-index="${idx}"
    >
      ${escapeHtml(col.label)}
    </th>
  `;
}

      return `
        <th
          class="${escapeHtml(col.widthClass)}"
          draggable="true"
          data-col-index="${idx}"
        >
          ${escapeHtml(col.label)}
        </th>
      `;
    })
    .join("");
}

function renderDateHeaderCell(state, col, idx) {
  const ascOn = state.filters.sortBy === "date" && state.filters.sortDir === "asc";
  const descOn = state.filters.sortBy === "date" && state.filters.sortDir === "desc";

  return `
    <th
      class="${escapeHtml(col.widthClass)} sortable"
      id="sortDate"
      draggable="true"
      data-col-index="${idx}"
      data-sort-key="date"
    >
      <div class="sortwrap">
        <span>${escapeHtml(col.label)}</span>
        <span class="sorticons">
          <span class="${ascOn ? "on" : ""}">▲</span>
          <span class="${descOn ? "on" : ""}">▼</span>
        </span>
      </div>
    </th>
  `;
}

function renderRows(state) {
  const rows = applyFilters(state);
  const today = todayDE();

  const activeTypes =
    Array.isArray(state.filters.types) && state.filters.types.length
      ? new Set(state.filters.types.map((x) => String(x).toUpperCase()))
      : null;

  const includeGreen = !!state.filters.greenRxOnly;

  const groups = new Map();
  for (const r of rows) {
    const k = parseDEDateToKey(r.date);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  const dateKeys = [...groups.keys()].sort((a, b) => {
    const dir = state.filters.sortDir === "asc" ? 1 : -1;
    return a.localeCompare(b) * dir;
  });

  let out = "";

  for (const dateKey of dateKeys) {
    const items = groups.get(dateKey) || [];
    const dateStr = items[0]?.date || "";

    const hasGreenOnDate = items.some((x) => !!x.greenRx);

    const expanded =
      !!(state.ui && state.ui.expandedDates && state.ui.expandedDates[dateKey]);

    let basePrimary = [];
    let baseSecondary = [];

    for (const item of items) {
      const bucket = getCustomBucket(state, item);

      if (bucket === "primary") basePrimary.push(item);
      if (bucket === "secondary") baseSecondary.push(item);
    }

    let primary = basePrimary;
    let secondary = baseSecondary;

    if (activeTypes || includeGreen) {
      primary = basePrimary.filter((x) =>
        matchesTypeSelection(x, activeTypes, includeGreen)
      );

      secondary = [
        ...basePrimary.filter((x) => !matchesTypeSelection(x, activeTypes, includeGreen)),
        ...baseSecondary
      ];
    }

    let printedDate = false;

    if (!primary.length && !secondary.length) {
      continue;
    }

    if (primary.length) {
      for (const r of primary) {
        out += renderDataRow(state, r, today, !printedDate, hasGreenOnDate);
        printedDate = true;
      }
    }

    if (secondary.length) {
      out += renderExpanderRow(
        state,
        dateKey,
        dateStr,
        secondary,
        primary.length === 0,
        !printedDate,
        hasGreenOnDate
      );

      if (expanded) {
        for (const r of secondary) {
          out += renderDataRow(state, r, today, false, hasGreenOnDate);
        }
      }
    }
  }

  return out;
}

function renderDataRow(state, r, today, showDateCell, hasGreenOnDate) {
  const dot = hasGreenOnDate
    ? `<span class="dot-green" title="Grünes Rezept"></span>`
    : "";

  const dateCell = showDateCell
    ? `<td class="date-cell ${r.date === today ? "date-today" : ""}">${dot}${escapeHtml(
        r.date
      )}</td>`
    : `<td class="date-cell date-blank"></td>`;

  const isSelected = state.selection?.rowId === r.id;
  const isLocked = !!r.locked;
  const isEditing = state.edit?.active && state.edit.rowId === r.id;

  const markerClass =
    r.marker === "turquoise"
      ? "row-marker-turquoise"
      : r.marker === "yellow"
      ? "row-marker-yellow"
      : r.marker === "pink"
      ? "row-marker-pink"
      : r.marker === "green"
      ? "row-marker-green"
      : "";

  return `
    <tr
      data-row="${escapeHtml(r.id)}"
      class="${isSelected ? "row-selected" : ""} ${isLocked ? "row-locked" : ""} ${markerClass}"
    >
      ${getVisibleColumns(state)
        .map((col) => {
          if (col.key === "date") {
            if (!isEditing) return dateCell;
            return renderEditCell(state, col, r);
          }
          if (isEditing) return renderEditCell(state, col, r);
          return renderCell(col, r);
        })
        .join("")}
    </tr>
  `;
}

function renderExpanderRow(
  state,
  dateKey,
  dateStr,
  hiddenRows,
  isOnlyRowForDate,
  showDateCell,
  hasGreenOnDate
) {
  const expanded =
    !!(state.ui && state.ui.expandedDates && state.ui.expandedDates[dateKey]);

  const types = [...new Set(hiddenRows.map((r) => String(r.type).toUpperCase()))].sort();
  const typeLabel = types.join(", ");

  const label = expanded
    ? `▲ ${typeLabel} ausblenden`
    : `▼ ${typeLabel} anzeigen`;

  const dot = hasGreenOnDate
    ? `<span class="dot-green" title="Grünes Rezept"></span>`
    : "";

  return `
    <tr class="expander-row">
      ${getVisibleColumns(state)
        .map((col) => {
          if (col.key === "date") {
            if (!showDateCell) return `<td class="date-cell date-blank"></td>`;
            return `<td class="date-cell ${dateStr === todayDE() ? "date-today" : ""}">${dot}${escapeHtml(
              dateStr
            )}</td>`;
          }

          if (col.key === "entry") {
            return `
              <td class="entry-text">
                <button
                  type="button"
                  class="expander-btn"
                  data-expander-btn="${escapeHtml(dateKey)}"
                >${escapeHtml(label)}</button>
              </td>
            `;
          }

          return `<td class="fg-muted"></td>`;
        })
        .join("")}
    </tr>
  `;
}

function renderEditCell(state, col, r) {
  const value = state.edit?.draft?.[col.key] ?? "";
  const activeCol = state.edit?.colKey === col.key;

  if (col.key === "entry") {
    const t = String(r.type || "").toUpperCase();
    if (t === "D") return renderEditEntryD(state, activeCol);
    if (t === "ARR") return renderEditEntryARR(state, activeCol);
  }

  if (!activeCol) return `<td>${escapeHtml(value)}</td>`;

  return `
    <td>
      <input
        id="editInput"
        class="edit-input"
        value="${escapeHtml(value)}"
        data-edit-field="${escapeHtml(col.key)}"
        oninput="window.__editUpdate('${escapeHtml(col.key)}', this.value)"
      />
    </td>
  `;
}

function renderEditEntryD(state, activeCol) {
  const code = state.edit?.draft?.d_code ?? "";
  const cert = state.edit?.draft?.d_cert ?? "";
  const text = state.edit?.draft?.d_text ?? "";

  const activeSub = state.edit?.subKey || "d_code";

  if (!activeCol) {
    const preview = `${code}   ${cert}   ${text}`.trim();
    return `<td>${escapeHtml(preview)}</td>`;
  }

  const idFor = (k) => (activeSub === k ? "editInput" : "");

  return `
    <td>
      <div class="edit-split">
        <input
          id="${idFor("d_code")}"
          class="edit-input edit-part edit-part--code"
          value="${escapeHtml(code)}"
          data-edit-sub="d_code"
          oninput="window.__editUpdate('d_code', this.value)"
        />
        <input
          id="${idFor("d_cert")}"
          class="edit-input edit-part edit-part--cert"
          value="${escapeHtml(cert)}"
          data-edit-sub="d_cert"
          oninput="window.__editUpdate('d_cert', this.value)"
        />
        <input
          id="${idFor("d_text")}"
          class="edit-input edit-part edit-part--text"
          value="${escapeHtml(text)}"
          data-edit-sub="d_text"
          oninput="window.__editUpdate('d_text', this.value)"
        />
      </div>
    </td>
  `;
}

function renderEditEntryARR(state, activeCol) {
  const med = state.edit?.draft?.arr_med ?? "";
  const dose = state.edit?.draft?.arr_dose ?? "";
  const rx = state.edit?.draft?.arr_rx ?? "";

  const activeSub = state.edit?.subKey || "arr_med";

  if (!activeCol) {
    const preview = `${med}   ${dose}   ${rx}`.trim();
    return `<td>${escapeHtml(preview)}</td>`;
  }

  const idFor = (k) => (activeSub === k ? "editInput" : "");

  return `
    <td>
      <div class="edit-split">
        <input
          id="${idFor("arr_med")}"
          class="edit-input edit-part edit-part--med"
          value="${escapeHtml(med)}"
          data-edit-sub="arr_med"
          oninput="window.__editUpdate('arr_med', this.value)"
        />
        <input
          id="${idFor("arr_dose")}"
          class="edit-input edit-part edit-part--dose"
          value="${escapeHtml(dose)}"
          data-edit-sub="arr_dose"
          oninput="window.__editUpdate('arr_dose', this.value)"
        />
        <input
          id="${idFor("arr_rx")}"
          class="edit-input edit-part edit-part--rx"
          value="${escapeHtml(rx)}"
          data-edit-sub="arr_rx"
          oninput="window.__editUpdate('arr_rx', this.value)"
        />
      </div>
    </td>
  `;
}

function renderCell(col, r) {
  if (col.key === "date") return "";

  if (col.key === "type") {
    const lock = r.locked ? `<span class="lock">🔒</span>` : "";
    return `<td><div class="type-badge">${escapeHtml(r.type)}${lock}</div></td>`;
  }

  if (col.key === "entry") {
    const dot = r.greenRx ? `<span class="dot-green" title="Grünes Rezept"></span>` : "";
    const multilineClass =
      String(r.type || "").toUpperCase() === "TXT" ? " entry-text--multiline" : "";

    return `<td class="entry-text${multilineClass}">${dot}${escapeHtml(r.entry)}</td>`;
  }

  if (col.key === "fg" || col.key === "s" || col.key === "ekz" || col.key === "bkz") {
    return `<td class="fg-muted">${escapeHtml(r[col.key])}</td>`;
  }

  return `<td>${escapeHtml(r[col.key] ?? "")}</td>`;
}

function keyToDate(key) {
  const s = String(key || "");
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  return new Date(y, (m || 1) - 1, d || 1);
}

function dateToKey(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function addDays(dt, days) {
  const x = new Date(dt.getTime());
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(dt, months) {
  const x = new Date(dt.getTime());
  x.setMonth(x.getMonth() + months);
  return x;
}

function presetFromKey(preset, nowKey) {
  if (!preset || preset === "all") return null;

  const now = keyToDate(nowKey);

  if (preset === "7d") return dateToKey(addDays(now, -7));
  if (preset === "1m") return dateToKey(addMonths(now, -1));
  if (preset === "6m") return dateToKey(addMonths(now, -6));
  if (preset === "1y") return dateToKey(addMonths(now, -12));

  return null;
}

function getCustomRuleForRow(state, row) {
  const customRanges = state.filters?.customRanges || {};

  if (row?.greenRx && customRanges.GREEN) {
    return customRanges.GREEN;
  }

  const type = String(row?.type || "").toUpperCase();
  return customRanges[type] || null;
}

function matchesRangePreset(row, preset, nowKey) {
  if (!preset || preset === "all") return true;

  const fromKey = presetFromKey(preset, nowKey);
  if (!fromKey) return true;

  const rowKey = parseDEDateToKey(row.date);
  return rowKey >= fromKey && rowKey <= nowKey;
}

function getCustomBucket(state, row) {
  if (state.filters?.rangePreset !== "custom") return "primary";

  const nowKey = parseDEDateToKey(todayDE());
  const rule = getCustomRuleForRow(state, row);

  if (!rule) return "primary";

  const preset = rule.rangePreset || "all";
  const collapsed = !!rule.collapsed;

  if (matchesRangePreset(row, preset, nowKey)) return "primary";
  if (collapsed) return "secondary";

  return "hidden";
}

function matchesTypeSelection(row, activeTypes, includeGreen) {
  const typeMatch = activeTypes
    ? activeTypes.has(String(row.type).toUpperCase())
    : false;

  const greenMatch = includeGreen ? !!row.greenRx : false;

  return typeMatch || greenMatch;
}

function applyFilters(state) {
  let list = [...state.entries];

  if (state.filters?.fg) {
    list = list.filter(e => String(e.fg) === state.filters.fg);
    }

   if (state.filters?.marker) {
    list = list.filter(e => e.marker === state.filters.marker);
  }

  if (state.filters?.heute) {
    const t = todayDE();
    list = list.filter((e) => e.date === t);
  }

  const preset = state.filters?.rangePreset || "all";
  const nowKey = parseDEDateToKey(todayDE());

  if (preset !== "custom") {
    const fromKey = presetFromKey(preset, nowKey);

    if (fromKey) {
      list = list.filter((e) => {
        const k = parseDEDateToKey(e.date);
        return k >= fromKey && k <= nowKey;
      });
    }
  }

  const dir = state.filters?.sortDir === "asc" ? 1 : -1;

  if (state.filters?.sortBy === "date") {
    list.sort((a, b) => {
      const ka = parseDEDateToKey(a.date);
      const kb = parseDEDateToKey(b.date);
      return ka.localeCompare(kb) * dir;
    });
  }

  return list;
}

function renderInputRow(state) {
  return InputRow(state);
}

export function Dropdown(state) {
  if (state.dropdown?.kind === "rcl_calendar") {
    return renderCalendar(state);
  }

  if (!state.dropdown?.open || !state.dropdown?.anchorRect) return "";

  const r = state.dropdown.anchorRect;
  const left = Math.round(r.left + window.scrollX);
  const top = Math.round(r.bottom + window.scrollY + 6);

  const activeIndex = Number(state.dropdown.activeIndex ?? 0);

  return `
    <div class="dropdown" id="dropdown" style="left:${left}px; top:${top}px;">
      ${(state.dropdown.items || [])
        .map((it, idx) => {
          const isActive = idx === activeIndex;
          return `
            <div
              class="dropdown-item ${isActive ? "active" : ""}"
              data-pick="${escapeHtml(it.code)}"
              data-index="${idx}"
            >
              <div class="dropdown-code">${escapeHtml(it.code)}</div>
              <div class="dropdown-text">${escapeHtml(it.text)}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCalendar(state) {
  const date = state.input?.rcl?.calendarPreview;
  if (!date || !state.dropdown?.anchorRect) return "";

  const r = state.dropdown.anchorRect;
  const left = Math.round(r.left + window.scrollX);
  const top = Math.round(r.bottom + window.scrollY + 6);

  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];

  // leere Felder vor Monatsstart
  for (let i = 0; i < startWeekday; i++) {
    cells.push(`<div class="cal-day"></div>`);
  }

  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);

    const isSelected = day === date.getDate();
    const isPast = cellDate < today;
    const isToday = cellDate.getTime() === today.getTime();

    cells.push(`
      <div
        class="cal-day 
          ${isSelected ? "active" : ""} 
          ${isPast ? "cal-day--past" : ""} 
          ${isToday ? "today" : ""}
        "
        data-day="${day}"
      >
        ${day}
      </div>
    `);
  }

  return `
    <div class="dropdown calendar" style="left:${left}px; top:${top}px;">
      
      <div class="cal-header">
        <button type="button" class="cal-nav" data-cal-nav="-1">‹</button>
        ${date.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
        <button type="button" class="cal-nav" data-cal-nav="1">›</button>
      </div>

      <div class="cal-grid">
        ${cells.join("")}
      </div>

    </div>
  `;
}