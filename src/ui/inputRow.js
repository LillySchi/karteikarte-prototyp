// src/ui/inputRow.js

import { escapeHtml } from "../state/store.js";

/* =========================
   HELPERS
========================= */

function af(state, id) {
  return state?.input?.autofocusId === id ? "autofocus" : "";
}

function focusTriggersDropdownAttr() {
  return `onfocus="this.dispatchEvent(new Event('input',{bubbles:true}))"`;
}

/* =========================
   INPUT ROW
========================= */

export function InputRow(state) {
  const step = state.input.step;

  const showType = true;
  const showDiag = step === "D_diag" || step === "D_cert";
  const showCert = step === "D_cert";

  const showArrMed = step === "ARR_med" || step === "ARR_dose" || step === "ARR_rx";
  const showArrDose = step === "ARR_dose" || step === "ARR_rx";
  const showArrRx = step === "ARR_rx";

  const showRclAmount = step === "RCL_amount" || step === "RCL_unit";
  const showRclUnit = step === "RCL_unit";

  const showTxt = step === "TXT_text";

  const disabledType = "";

  return `
    <tr class="input-row">
      <td colspan="${(state.columns || []).filter((c) => c.visible !== false).length}">
        <span class="inline-prefix">&gt; Typ</span>

        ${
          showType
            ? `
              <input
                id="typeInput"
                class="inline-input"
                style="width:140px"
                value="${escapeHtml(state.input.type)}"
                autocomplete="off"
                ${disabledType}
                ${af(state, "typeInput")}
                ${focusTriggersDropdownAttr()}
              />
            `
            : ""
        }

        ${
          showDiag
            ? `
              <input
                id="codeInput"
                class="inline-input"
                style="width:220px; margin-left:10px"
                value="${escapeHtml(state.input.d.codeOrQuery)}"
                autocomplete="off"
                ${af(state, "codeInput")}
                ${focusTriggersDropdownAttr()}
              />
            `
            : ""
        }

        ${
          showCert
            ? `
              <input
                id="certInput"
                class="inline-input"
                style="width:140px; margin-left:10px"
                value="${escapeHtml(state.input.d.certainty)}"
                autocomplete="off"
                ${af(state, "certInput")}
                ${focusTriggersDropdownAttr()}
              />
            `
            : ""
        }

        ${
          showArrMed
            ? `
              <input
                id="medInput"
                class="inline-input"
                style="width:320px; margin-left:10px"
                value="${escapeHtml(state.input.arr.med)}"
                autocomplete="off"
                ${af(state, "medInput")}
                ${focusTriggersDropdownAttr()}
              />
            `
            : ""
        }

        ${
          showArrDose
            ? `
              <input
                id="doseInput"
                class="inline-input"
                style="width:180px; margin-left:10px"
                value="${escapeHtml(state.input.arr.dose)}"
                autocomplete="off"
                ${af(state, "doseInput")}
                ${focusTriggersDropdownAttr()}
              />
            `
            : ""
        }

        ${
          showArrRx
            ? `
              <input
                id="rxInput"
                class="inline-input"
                style="width:120px; margin-left:10px"
                value="${escapeHtml(state.input.arr.rx)}"
                autocomplete="off"
                ${af(state, "rxInput")}
                ${focusTriggersDropdownAttr()}
              />
            `
            : ""
        }

      ${showRclAmount
  ? `
    <input
      id="rclAmountInput"
      class="inline-input"
      style="width:120px; margin-left:10px"
      value="${escapeHtml(state.input.rcl?.amount ?? "")}"
      autocomplete="off"
      ${af(state, "rclAmountInput")}
      ${focusTriggersDropdownAttr()}
    />
  `
  : ""
}

${showRclUnit
  ? `
    <input
      id="rclUnitInput"
      class="inline-input"
      style="width:140px; margin-left:10px"
      value="${escapeHtml(state.input.rcl?.unit ?? "")}"
      autocomplete="off"
      ${af(state, "rclUnitInput")}
      ${focusTriggersDropdownAttr()}
    />
  `
  : ""
}
     

        ${
          showTxt
            ? `
              <textarea
                id="txtInput"
                class="inline-input"
                style="width:520px; margin-left:10px; height:64px; resize:none; vertical-align:middle"
                autocomplete="off"
                ${af(state, "txtInput")}
              >${escapeHtml(state.input.txt)}</textarea>
            `
            : ""
        }
      </td>
    </tr>
  `;
}

