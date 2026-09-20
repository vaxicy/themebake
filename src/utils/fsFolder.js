/**
 * Write the theme folder straight to disk — no ZIP, nothing to unzip.
 *
 * "Load unpacked" wants a *directory* whose root holds `manifest.json`, and the
 * only way a web page can create one is the File System Access API
 * (`showDirectoryPicker`). Desktop Chrome and Edge implement it; Firefox, Safari
 * and every mobile browser do not, which is why the ZIP path stays as the
 * fallback — and why it stays at all, since the Chrome Web Store only accepts a
 * ZIP.
 *
 * This is the only DOM-touching part of packaging, kept out of `package.js` on
 * purpose: that module has to stay runnable in Node for `scripts/verify.mjs`.
 */

/** Whether this browser can write into a directory the user picks. */
export function canWriteFolder() {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function'
}

/**
 * Ask for a directory, then write `files` into a `<folder>/` subdirectory of it.
 *
 * The folder is created (or reused) rather than assumed empty, and each file is
 * written through a `FileSystemWritableFileStream` — a plain string or Blob works,
 * which is what `buildThemePackage` hands over.
 *
 * @param {object} options
 * @param {{path:string,data:unknown}[]} options.files
 * @param {string} options.folder  Folder to create inside the chosen directory.
 * @returns {Promise<string>} the chosen directory's own name, for the toast
 * @throws {DOMException} `AbortError` when the user cancels the picker; the caller
 *   treats that as a non-event rather than an error.
 */
export async function writeThemeFolder({ files, folder }) {
  const root = await window.showDirectoryPicker({ id: 'themebake-output', mode: 'readwrite' })
  const dir = await root.getDirectoryHandle(folder, { create: true })

  for (const file of files ?? []) {
    if (!file || typeof file.path !== 'string' || !file.path) continue
    const handle = await dir.getFileHandle(file.path, { create: true })
    const writable = await handle.createWritable()
    await writable.write(file.data)
    await writable.close()
  }

  return root.name
}
