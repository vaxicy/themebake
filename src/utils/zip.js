/**
 * ZIP packaging + browser download.
 *
 * The generated archive is meant to be unzipped and then pointed at with
 * "Load unpacked", so its layout matters: Chrome needs a **directory** whose root
 * contains `manifest.json`. A ZIP whose entries sit at the archive root would
 * scatter `manifest.json` and `icon.png` into whatever folder the user extracts
 * into — usually their Downloads folder, which they then cannot safely select.
 *
 * So every archive ThemeForge produces wraps its files in exactly one top-level
 * folder, `<slug>/`. One folder is the whole point; the folder's name is just the
 * theme name, lower-cased and sanitised.
 */

import JSZip from 'jszip'

/** Root-level `manifest.json` is required; Chrome reads it from the folder root. */
export const MANIFEST_FILENAME = 'manifest.json'

/**
 * Build a ZIP from a file list.
 *
 * @param {object} options
 * @param {{path:string, data:string|Blob|ArrayBuffer|Uint8Array}[]} options.files
 * @param {string|null} [options.folder=null]  Single top-level folder name, or
 *   null to place every entry at the archive root.
 * @returns {Promise<Blob>}
 */
export async function createZip({ files, folder = null }) {
  const zip = new JSZip()
  const root = folder ? zip.folder(folder) : zip

  for (const file of files ?? []) {
    if (!file || typeof file.path !== 'string' || !file.path) continue
    root.file(file.path, file.data)
  }

  // `DEFLATE` keeps the archive small and is universally readable. The payload is
  // a few hundred bytes of JSON plus a ~2 KB PNG, so this is instant either way.
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    mimeType: 'application/zip',
  })
}

/**
 * Trigger a browser download for a Blob.
 *
 * Uses an object URL + a synthetic anchor. The URL is always revoked, and the
 * anchor is always removed, including on the error path.
 *
 * @param {Blob}   blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)

  try {
    anchor.click()
  } finally {
    // Defer revocation so Safari/Firefox have time to start the download.
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
      anchor.remove()
    }, 1500)
  }
}

/**
 * Same as `downloadBlob` but for text (used for "copy/download manifest only").
 * @param {string} text
 * @param {string} filename
 * @param {string} [mime]
 */
export function downloadText(text, filename, mime = 'application/json') {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename)
}
