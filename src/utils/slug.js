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
 *
 * Two flavours live here. `toSafeFilename` / `toSlug` are for names **we** derive
 * from free text, so they lower-case and dashify. `toSafeName` is for names the
 * **user** typed, and keeps their case and spaces — only what a filesystem
 * genuinely rejects is touched.
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

/**
 * Separators Windows/macOS/Linux reject, collapsed into a single dash so that
 * "a/b" reads as "a-b" instead of silently gluing the two words together.
 */
const ILLEGAL_RUN = /[\\/:*?"<>|\u0000-\u001F\u007F]+/g

/**
 * Sanitise a name the user typed **without changing how it reads**.
 *
 * A folder name is not derived from anything — the user typed it — so
 * "Blush Matcha Theme" has to stay exactly that. Only what a filesystem genuinely
 * rejects is removed:
 *   - characters Windows/macOS/Linux refuse (a run of them becomes one dash)
 *   - leading/trailing dots, spaces and dashes (Windows cannot create the first
 *     two, a leading dot hides the entry on unix, and stripping the dashes is what
 *     stops a name of nothing but illegal characters from surviving as "-")
 *   - Windows reserved device names (CON, PRN, …)
 *
 * Case, interior spaces and underscores are preserved. Returns `''` when nothing
 * usable is left, so the caller can pick its own fallback.
 *
 * @param {string} name
 * @returns {string}
 */
export function toSafeName(name) {
  let base = String(name ?? '')
    .replace(ILLEGAL_RUN, '-')
    .replace(/^[.\s-]+|[.\s-]+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/[.\s-]+$/g, '')

  if (!base) return ''
  if (WINDOWS_RESERVED.test(base)) base = `${base}-theme`
  return base
}
