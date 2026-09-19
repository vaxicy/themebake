/**
 * Filename hygiene for the generated ZIP.
 *
 * The theme name is free text and lands in a `download` attribute, so it must be
 * reduced to something every OS accepts. Rules:
 *   - strip characters Windows/macOS/Linux reject: \ / : * ? " < > | and control chars
 *   - collapse whitespace to single dashes
 *   - strip leading/trailing dots and dashes (Windows dislikes trailing dots)
 *   - collapse repeated separators
 *   - guard against Windows reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
 *   - enforce a length cap that leaves room for the ".zip" suffix
 *   - always fall back to a usable name
 */

const ILLEGAL_CHARS = /[\\/:*?"<>|\u0000-\u001F\u007F]/g
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

const MAX_BASE_LENGTH = 64

/**
 * @param {string} name
 * @param {string} [extension='zip']
 * @returns {string} a safe filename, e.g. `periwinkle-dream.zip`
 */
export function toSafeFilename(name, extension = 'zip') {
  const ext = extension.replace(/^\./, '')

  let base = String(name ?? '')
    .replace(ILLEGAL_CHARS, ' ')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, '')

  // Unicode letters are intentionally preserved so a name like "\u66AE\u8272" still produces a
  // meaningful filename — browsers and Windows/macOS/Linux all handle UTF-8 in a
  // download name. If nothing usable is left at all, fall back to a safe default.
  if (!base || !/[a-z0-9]/i.test(base)) base = 'chrome-theme'

  if (WINDOWS_RESERVED.test(base)) base = `${base}-theme`

  return `${base}.${ext}`
}

/** Slug used for the ZIP-internal file name and for display in the Toaster. */
export function toSlug(name) {
  return toSafeFilename(name).replace(/\.zip$/, '')
}
