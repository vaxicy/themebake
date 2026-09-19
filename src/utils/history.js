/**
 * Undo stack for the theme draft.
 *
 * ---------------------------------------------------------------------------
 * Why this is not just "push on every change"
 * ---------------------------------------------------------------------------
 * `<input type="color">` fires a change event continuously while the user drags
 * around the OS colour picker. Pushing a snapshot per event would mean a single
 * drag costs dozens of Ctrl+Z presses, which makes undo useless in exactly the
 * situation people reach for it. So consecutive edits to the **same** field
 * within `COALESCE_MS` collapse into one step, while touching a different field —
 * or applying a preset, randomising, importing — always starts a new one.
 *
 * The stack is plain data, so it is unit-testable in Node with an injected clock.
 */

/** How many steps to keep. Deep enough to cover a session, bounded in memory. */
export const HISTORY_LIMIT = 60

/** Consecutive edits to one field inside this window are one undo step. */
export const COALESCE_MS = 700

export function createHistory(limit = HISTORY_LIMIT) {
  return { past: [], limit, lastField: null, lastAt: 0 }
}

/**
 * Record a snapshot *before* the mutation it should undo.
 *
 * @param {ReturnType<typeof createHistory>} history
 * @param {unknown} snapshot   opaque to this module; the caller decides the shape
 * @param {string|null} field  field id for coalescing, or null for a discrete
 *                             action (preset apply, reset, import) that must
 *                             never merge with the edit before it
 * @param {number} [now]       injected clock, for tests
 */
export function record(history, snapshot, field = null, now = Date.now()) {
  const coalesce =
    field !== null &&
    history.lastField === field &&
    history.past.length > 0 &&
    now - history.lastAt <= COALESCE_MS

  if (!coalesce) {
    history.past.push(snapshot)
    if (history.past.length > history.limit) history.past.shift()
  }

  history.lastField = field
  history.lastAt = now
  return history
}

/**
 * Pop the most recent snapshot, or null when there is nothing to undo.
 * Coalescing is broken afterwards so the next edit cannot merge into the step
 * that was just restored.
 */
export function undo(history) {
  if (!history.past.length) return null
  history.lastField = null
  history.lastAt = 0
  return history.past.pop()
}

export function canUndo(history) {
  return history.past.length > 0
}
