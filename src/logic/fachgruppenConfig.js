export const FACHGRUPPEN = {
  hausarzt: {
    label: "Hausarzt",
    defaultTypes: ["D", "B", "ARR", "RCL", "TXT"],
    defaultDiagnoses: ["J06.9", "M54.5", "I10"],
    defaultMedPrefix: "G",
    rezeptTyp: "GKV"
  },

  orthopaedie: {
    label: "Orthopädie",
    defaultTypes: ["D", "ARR", "RCL", "TXT"],
    defaultDiagnoses: ["M54.5"],
    defaultMedPrefix: "G",
    rezeptTyp: "GKV"
  },

  privatpraxis: {
    label: "Privatpraxis",
    defaultTypes: ["D", "B", "ARR", "RCL", "TXT"],
    defaultDiagnoses: ["I10"],
    defaultMedPrefix: "KP",
    rezeptTyp: "Privat"
  }
};