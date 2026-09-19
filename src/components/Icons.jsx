/**
 * Inline SVG icon set.
 *
 * Hand-drawn for ThemeForge — deliberately NOT using Chrome/Google marks.
 * All icons inherit `currentColor` and are `aria-hidden` by default; the
 * surrounding control supplies the accessible name.
 */

const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

export function PaletteIcon({ size = 18, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M12 3a9 9 0 1 0 0 18h1.6a2.4 2.4 0 0 0 0-4.8h-.9a1.9 1.9 0 0 1 0-3.8H16A5 5 0 0 0 21 7.4C21 4.9 17 3 12 3Z" />
      <circle cx="7.8" cy="11.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="10.4" cy="7.6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7.9" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ResetIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4v4h4" />
    </svg>
  )
}

export function GitHubIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={1.5} {...rest}>
      <path d="M9 19c-4 1.2-4-2.2-5.5-2.7M15 21v-3.4a2.9 2.9 0 0 0-.8-2.3c2.7-.3 5.3-1.3 5.3-6a4.7 4.7 0 0 0-1.3-3.2 4.4 4.4 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 2.5 5.3 2.8 5.3 2.8a4.4 4.4 0 0 0-.1 3.3A4.7 4.7 0 0 0 4 9.3c0 4.7 2.6 5.7 5.2 6a2.9 2.9 0 0 0-.8 2.3V21" />
    </svg>
  )
}

export function InfoIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8h.01" strokeWidth="2.2" />
    </svg>
  )
}

export function CloseIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function DiceIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.2" />
      <circle cx="8.6" cy="8.6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="8.6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="15.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="15.4" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function DownloadIcon({ size = 18, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M12 3.5v11" />
      <path d="M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </svg>
  )
}

export function CodeIcon({ size = 17, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M9 6.5 4 12l5 5.5" />
      <path d="M15 6.5 20 12l-5 5.5" />
    </svg>
  )
}

export function CheckIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M5 12.8 9.4 17 19 7.6" />
    </svg>
  )
}

export function CopyIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <rect x="9" y="9" width="11" height="11" rx="2.4" />
      <path d="M15 6.5V5.6A2.1 2.1 0 0 0 12.9 3.5H5.6A2.1 2.1 0 0 0 3.5 5.6v7.3A2.1 2.1 0 0 0 5.6 15h.9" />
    </svg>
  )
}

export function WarningIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M10.3 3.8 2.9 17a2 2 0 0 0 1.8 3h14.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4" />
      <path d="M12 17h.01" strokeWidth="2.2" />
    </svg>
  )
}

export function ArrowLeftIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M19 12H5" />
      <path d="M11 6 5 12l6 6" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export function ReloadIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M20 11.5a8 8 0 1 0-2.2 5.6" />
      <path d="M20 5.5v6h-6" />
    </svg>
  )
}

export function StarIcon({ size = 14, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8Z" />
    </svg>
  )
}

export function SearchIcon({ size = 14, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <circle cx="11" cy="11" r="6.2" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  )
}

export function MoreIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <circle cx="12" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ---------------------------------------------------------------------------
   Icons added for the language switcher, palette studio and importer.
   Same drawing rules as above: 24x24 box, currentColor, 1.7 stroke.
   --------------------------------------------------------------------------- */

export function GlobeIcon({ size = 15, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.2 9.5h17.6M3.2 14.5h17.6" />
      <path d="M11.6 3a15 15 0 0 0 0 18 15 15 0 0 0 0-18Z" />
    </svg>
  )
}

/** Curved arrow left — "undo the last edit". */
export function UndoIcon({ size = 15, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M4 9.5h10.5a5 5 0 0 1 0 10H9.5" />
      <path d="M8 5.5 4 9.5l4 4" />
    </svg>
  )
}

/**
 * A 2x2 colour card — "build a theme from colours".
 *
 * Third attempt at this mark, and the first built entirely from *filled* shapes.
 * The earlier wand-plus-sparkles packed five stroked paths into 16px and collapsed
 * into a smudge; its replacement, a stroked droplet with an inner highlight arc,
 * fared no better — at button size the thin strokes broke up into what read as
 * stray specks around an unclear silhouette. Solid fills have no such failure
 * mode: four rounded tiles survive any size, and the two faded corners keep the
 * mark from reading as a plain square.
 */
export function SwatchIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} fill="currentColor" stroke="none" {...rest}>
      <rect x="3.2" y="3.2" width="8" height="8" rx="2.4" />
      <rect x="12.8" y="3.2" width="8" height="8" rx="2.4" opacity="0.45" />
      <rect x="3.2" y="12.8" width="8" height="8" rx="2.4" opacity="0.45" />
      <rect x="12.8" y="12.8" width="8" height="8" rx="2.4" />
    </svg>
  )
}

export function UploadIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M12 16V4.5" />
      <path d="M7.5 9 12 4.5 16.5 9" />
      <path d="M4.5 15.5v2.6a1.9 1.9 0 0 0 1.9 1.9h11.2a1.9 1.9 0 0 0 1.9-1.9v-2.6" />
    </svg>
  )
}

export function ImageIcon({ size = 16, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.6" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m4 17.5 4.6-4.4a1.7 1.7 0 0 1 2.4.05L14 16" />
      <path d="m13.6 14.4 1.9-1.8a1.7 1.7 0 0 1 2.4.05l2.1 2.1" />
    </svg>
  )
}

/** Filled check inside a shield — "contrast verified". */
export function ShieldCheckIcon({ size = 15, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M12 3.2 5 5.9v5.4c0 4.1 2.8 7.6 7 9.5 4.2-1.9 7-5.4 7-9.5V5.9Z" />
      <path d="m8.9 12.1 2.3 2.3 4-4.4" />
    </svg>
  )
}

/** Shield with an exclamation — contrast problem. */
export function ShieldAlertIcon({ size = 15, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M12 3.2 5 5.9v5.4c0 4.1 2.8 7.6 7 9.5 4.2-1.9 7-5.4 7-9.5V5.9Z" />
      <path d="M12 8.4v4.2" />
      <path d="M12 15.8h.01" strokeWidth="2.2" />
    </svg>
  )
}

export function TrashIcon({ size = 15, ...rest }) {
  return (
    <svg {...base} width={size} height={size} {...rest}>
      <path d="M4.5 6.8h15" />
      <path d="M9.2 6.8V5.2a1.4 1.4 0 0 1 1.4-1.4h2.8a1.4 1.4 0 0 1 1.4 1.4v1.6" />
      <path d="M6.6 6.8 7.5 19a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4l.9-12.2" />
      <path d="M10.6 10.4v6M13.4 10.4v6" />
    </svg>
  )
}

