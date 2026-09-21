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
    "id": "burgundy-cream",
    "name": "Burgundy Cream",
    "description": "A warm vintage theme in burgundy, cream and camel, with light and dark variants.",
    "colors": {
      "editorBg": "#261719",
      "editorFg": "#F1E2D1",
      "mutedFg": "#BCA398",
      "accent": "#E794B0",
      "selectionBg": "#633044",
      "lineHighlightBg": "#604044",
      "activityBg": "#541A1A",
      "sidebarBg": "#321D20",
      "titleBg": "#541A1A",
      "border": "#604044",
      "buttonBg": "#810B38",
      "buttonFg": "#F1E2D1",
      "errorFg": "#E06C75",
      "warningFg": "#E5C07B"
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
    "id": "clover-haze",
    "name": "Clover Haze Theme",
    "description": "A gentle leaf-green and cream theme with misty lavender accents. Includes coordinated light and dark variants.",
    "colors": {
      "editorBg": "#222B25",
      "editorFg": "#F0EFDF",
      "mutedFg": "#A6B29B",
      "accent": "#C3AFDE",
      "selectionBg": "#51465F",
      "lineHighlightBg": "#2B352D",
      "activityBg": "#354638",
      "sidebarBg": "#2B372E",
      "titleBg": "#303E33",
      "border": "#465341",
      "buttonBg": "#BCA7D4",
      "buttonFg": "#292331",
      "errorFg": "#E69DA8",
      "warningFg": "#DDC58F"
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
    "id": "cozy-vintage",
    "name": "Cozy Vintage",
    "description": "A warm, low-saturation vintage-inspired VS Code theme with cozy dark and light variants for calm, comfortable coding.",
    "colors": {
      "editorBg": "#322A26",
      "editorFg": "#E7D3B1",
      "mutedFg": "#B49C84",
      "accent": "#B0CDE6",
      "selectionBg": "#5A4642",
      "lineHighlightBg": "#3B322D",
      "activityBg": "#2B2420",
      "sidebarBg": "#3A312C",
      "titleBg": "#2B2420",
      "border": "#52463F",
      "buttonBg": "#946D6D",
      "buttonFg": "#FDF4D2",
      "errorFg": "#D98B8B",
      "warningFg": "#D8B57A"
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
    "id": "macaron-dream",
    "name": "Macaron Dream",
    "description": "A premium pastel VS Code theme collection inspired by macaron desserts — soft, dreamy, elegant. Includes both Light and Dark themes for designers, AI creators, and indie developers.",
    "colors": {
      "editorBg": "#20213A",
      "editorFg": "#E6E1F2",
      "mutedFg": "#EDE9F6",
      "accent": "#FF8FAB",
      "selectionBg": "#3A3B5C",
      "lineHighlightBg": "#27284A",
      "activityBg": "#1C1D33",
      "sidebarBg": "#1C1D33",
      "titleBg": "#1C1D33",
      "border": "#3A3B5A",
      "buttonBg": "#FF8FAB",
      "buttonFg": "#17182B",
      "errorFg": "#E06C75",
      "warningFg": "#FFD166"
    }
  },
  {
    "id": "matcha-ivory",
    "name": "Matcha Ivory",
    "description": "A calm matcha green and warm ivory theme, with light and dark variants.",
    "colors": {
      "editorBg": "#20271F",
      "editorFg": "#F7F2EB",
      "mutedFg": "#A5AF9B",
      "accent": "#B4C695",
      "selectionBg": "#414E37",
      "lineHighlightBg": "#4B5844",
      "activityBg": "#293227",
      "sidebarBg": "#293227",
      "titleBg": "#293227",
      "border": "#4B5844",
      "buttonBg": "#8B9A6E",
      "buttonFg": "#20271F",
      "errorFg": "#E8A0A0",
      "warningFg": "#DBBD93"
    }
  },
  {
    "id": "mint-breeze",
    "name": "Mint Breeze",
    "description": "A fresh, soft and premium mint-green color theme for VS Code with light and dark modes for calm, focused creative coding.",
    "colors": {
      "editorBg": "#172523",
      "editorFg": "#D8E8E3",
      "mutedFg": "#6E918B",
      "accent": "#8FE6D2",
      "selectionBg": "#3E6F67",
      "lineHighlightBg": "#1E302D",
      "activityBg": "#121C1B",
      "sidebarBg": "#1E302D",
      "titleBg": "#121C1B",
      "border": "#263B37",
      "buttonBg": "#75D8C4",
      "buttonFg": "#0E1817",
      "errorFg": "#E06C75",
      "warningFg": "#F0B58A"
    }
  },
  {
    "id": "olive-dream",
    "name": "Olive Dream",
    "description": "A calm, natural, premium sage-green VS Code theme for creative developers, AI builders and designers.",
    "colors": {
      "editorBg": "#21271A",
      "editorFg": "#E6E2CC",
      "mutedFg": "#5E6A4A",
      "accent": "#A8BE84",
      "selectionBg": "#9CAB84",
      "lineHighlightBg": "#2A3122",
      "activityBg": "#171C12",
      "sidebarBg": "#1B2015",
      "titleBg": "#1B2015",
      "border": "#2A3122",
      "buttonBg": "#9CAB84",
      "buttonFg": "#21271A",
      "errorFg": "#E06C75",
      "warningFg": "#E0B85E"
    }
  },
  {
    "id": "opal-mist",
    "name": "Opal Mist Theme",
    "description": "Soft lavender gray, mist blue, pale green and cream in coordinated light and dark themes.",
    "colors": {
      "editorBg": "#242936",
      "editorFg": "#E7EAD9",
      "mutedFg": "#A4AEB0",
      "accent": "#ADB2D4",
      "selectionBg": "#4B5270",
      "lineHighlightBg": "#2D3441",
      "activityBg": "#3C415B",
      "sidebarBg": "#2D3942",
      "titleBg": "#343F4C",
      "border": "#495463",
      "buttonBg": "#ADB2D4",
      "buttonFg": "#242936",
      "errorFg": "#E69DA8",
      "warningFg": "#DFD5A5"
    }
  },
  {
    "id": "pastel-moonlight",
    "name": "Pastel Moonlight",
    "description": "A soft, modern pastel pink theme for creative developers. Dreamy, minimal, and easy on the eyes — designed for long, cozy coding sessions.",
    "colors": {
      "editorBg": "#1A1520",
      "editorFg": "#D8CED3",
      "mutedFg": "#A890A0",
      "accent": "#E2A4C4",
      "selectionBg": "#6B4A60",
      "lineHighlightBg": "#221B27",
      "activityBg": "#221B27",
      "sidebarBg": "#221B27",
      "titleBg": "#221B27",
      "border": "#5A3D52",
      "buttonBg": "#E2A4C4",
      "buttonFg": "#191919",
      "errorFg": "#E2A3AF",
      "warningFg": "#402F1B"
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
    "id": "plum-velvet",
    "name": "Plum Velvet Theme",
    "description": "A warm muted plum theme with velvet mauve and dusty rose accents. Includes light and dark variants.",
    "colors": {
      "editorBg": "#281F2A",
      "editorFg": "#EFE1E7",
      "mutedFg": "#B29BAE",
      "accent": "#D3AED2",
      "selectionBg": "#59415D",
      "lineHighlightBg": "#332737",
      "activityBg": "#4A304C",
      "sidebarBg": "#342737",
      "titleBg": "#3D2D40",
      "border": "#523E54",
      "buttonBg": "#C6A1C5",
      "buttonFg": "#281F2A",
      "errorFg": "#ED9CAE",
      "warningFg": "#DFC293"
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
