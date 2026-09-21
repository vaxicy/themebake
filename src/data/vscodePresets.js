/**
 * VS Code preset themes, extracted from the hand-made theme folders by
 * `scripts/extract-vscode-presets.mjs` — do not edit by hand; re-run the
 * script instead.
 *
 * Each preset carries only the 14 master colour fields of the VS Code
 * workbench; the full `colors` map and `tokenColors` are derived from these
 * at build time (see `vscode/build.js`).
 *
 * @type {{id:string,name:string,description:string,colors:Record<string,string>}[]}
 */
export const VSCODE_PRESETS = [
  {
    "id": "blue-reverie",
    "name": "Blue Reverie Theme",
    "description": "A dreamy blue, lavender and blush theme with coordinated light and dark variants.",
    "colors": {
      "editorBg": "#1D2538",
      "editorFg": "#E8EDFA",
      "mutedFg": "#A3ADC5",
      "accent": "#8AB4FF",
      "selectionBg": "#454463",
      "lineHighlightBg": "#424D68",
      "activityBg": "#353451",
      "sidebarBg": "#253149",
      "titleBg": "#253149",
      "border": "#424D68",
      "buttonBg": "#8AB4FF",
      "buttonFg": "#1D2538",
      "errorFg": "#F1A4BC",
      "warningFg": "#E8C792"
    }
  },
  {
    "id": "blush-cloud",
    "name": "Blush Cloud",
    "description": "A soft, dreamy VS Code theme of blush pink clouds, warm cream paper and a misty blue sky. Light & dark.",
    "colors": {
      "editorBg": "#191824",
      "editorFg": "#E6DCEE",
      "mutedFg": "#6E6380",
      "accent": "#D9A6C7",
      "selectionBg": "#4A4158",
      "lineHighlightBg": "#282536",
      "activityBg": "#191824",
      "sidebarBg": "#282536",
      "titleBg": "#191824",
      "border": "#403849",
      "buttonBg": "#D9A6C7",
      "buttonFg": "#191824",
      "errorFg": "#E06C75",
      "warningFg": "#E0C178"
    }
  },
  {
    "id": "candy-breeze",
    "name": "Candy Breeze",
    "description": "A sweet, airy pastel theme in candy pink, ice blue, mint and butter yellow. Includes light and dark variants.",
    "colors": {
      "editorBg": "#292633",
      "editorFg": "#F3EAF2",
      "mutedFg": "#AAA1B8",
      "accent": "#F4C9DF",
      "selectionBg": "#554257",
      "lineHighlightBg": "#51465E",
      "activityBg": "#493544",
      "sidebarBg": "#293742",
      "titleBg": "#303E49",
      "border": "#51465E",
      "buttonBg": "#F4C9DF",
      "buttonFg": "#454052",
      "errorFg": "#F3A8B5",
      "warningFg": "#F6FFDC"
    }
  },
  {
    "id": "cozy-latte",
    "name": "Cozy Latte",
    "description": "A warm, coffee-inspired VS Code theme collection. Cozy light & dark modes for long, comfortable coding sessions — like a warm latte beside your keyboard.",
    "colors": {
      "editorBg": "#261F1A",
      "editorFg": "#E4D7C2",
      "mutedFg": "#B3A18B",
      "accent": "#D1A574",
      "selectionBg": "#5A4635",
      "lineHighlightBg": "#30271F",
      "activityBg": "#211B17",
      "sidebarBg": "#30271F",
      "titleBg": "#211B17",
      "border": "#4A3B2E",
      "buttonBg": "#D1A574",
      "buttonFg": "#211B17",
      "errorFg": "#E28C7E",
      "warningFg": "#E2A65A"
    }
  },
  {
    "id": "dusty-petal",
    "name": "Dusty Petal Theme",
    "description": "A refined dusty rose and graphite VS Code theme with carefully crafted light and dark variants.",
    "colors": {
      "editorBg": "#262021",
      "editorFg": "#E8DDE0",
      "mutedFg": "#9B8A8E",
      "accent": "#E29BA8",
      "selectionBg": "#46393D",
      "lineHighlightBg": "#2A2427",
      "activityBg": "#2A2427",
      "sidebarBg": "#221D1E",
      "titleBg": "#1F1A1C",
      "border": "#3A3033",
      "buttonBg": "#C97E8E",
      "buttonFg": "#1F1A1C",
      "errorFg": "#E29BA8",
      "warningFg": "#E5C07B"
    }
  },
  {
    "id": "jade-veil",
    "name": "Jade Veil Theme",
    "description": "A calm muted jade palette with coordinated light and dark variants.",
    "colors": {
      "editorBg": "#1F2D29",
      "editorFg": "#E2EFE3",
      "mutedFg": "#A0B9A8",
      "accent": "#B1D3B9",
      "selectionBg": "#405F51",
      "lineHighlightBg": "#293932",
      "activityBg": "#354E45",
      "sidebarBg": "#293C34",
      "titleBg": "#30463D",
      "border": "#476255",
      "buttonBg": "#88BDA4",
      "buttonFg": "#203B30",
      "errorFg": "#E69DA8",
      "warningFg": "#DCC39D"
    }
  },
  {
    "id": "lavender-mist",
    "name": "Lavender Mist",
    "description": "A dreamy lavender-inspired VS Code theme collection. Soft purple light & moonlit dark modes for a calm, aesthetic coding experience — like creating in purple moonlight and mist.",
    "colors": {
      "editorBg": "#1D1930",
      "editorFg": "#D6D0E8",
      "mutedFg": "#9C93B5",
      "accent": "#B9A7FF",
      "selectionBg": "#514878",
      "lineHighlightBg": "#24203A",
      "activityBg": "#171525",
      "sidebarBg": "#24203A",
      "titleBg": "#171525",
      "border": "#40365F",
      "buttonBg": "#B9A7FF",
      "buttonFg": "#1D1930",
      "errorFg": "#E091A8",
      "warningFg": "#E5C08A"
    }
  },
  {
    "id": "peach-sorbet",
    "name": "Peach Sorbet Theme",
    "description": "Warm peach, soft coral and berry accents in coordinated light and dark themes.",
    "colors": {
      "editorBg": "#302321",
      "editorFg": "#F8E5DC",
      "mutedFg": "#C0A198",
      "accent": "#FFB9B9",
      "selectionBg": "#674248",
      "lineHighlightBg": "#3B2B27",
      "activityBg": "#573936",
      "sidebarBg": "#3D2C28",
      "titleBg": "#47312C",
      "border": "#61453E",
      "buttonBg": "#FFDDD2",
      "buttonFg": "#593D38",
      "errorFg": "#E69DA8",
      "warningFg": "#EAC18C"
    }
  },
  {
    "id": "soft-sky",
    "name": "Soft Sky",
    "description": "A premium pastel blue VS Code theme inspired by a soft morning sky, gentle clouds, and calm ocean horizons. Soft blue-gray layers with warm cream accents for relaxed, elegant coding.",
    "colors": {
      "editorBg": "#141D2A",
      "editorFg": "#C6D2E0",
      "mutedFg": "#8FA2B8",
      "accent": "#FFE3B0",
      "selectionBg": "#4A6B9D",
      "lineHighlightBg": "#1A2534",
      "activityBg": "#0E1621",
      "sidebarBg": "#111A26",
      "titleBg": "#0E1621",
      "border": "#1A2534",
      "buttonBg": "#3D5A8A",
      "buttonFg": "#EAF2FB",
      "errorFg": "#E58FA2",
      "warningFg": "#E8C47A"
    }
  }
]
