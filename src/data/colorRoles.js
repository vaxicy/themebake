/**
 * What each editable colour *is* — the vocabulary the AI recolour prompt speaks.
 *
 * A model cannot choose a colour well from an id alone. Told `mutedFg: #6E6A8A` it
 * does not know whether that is a surface (so "make it dark" pushes it down), text
 * (pushed up), the accent (the one thing allowed to be saturated), or a hairline.
 * And it cannot tell `omniboxBackground` from `ntpBackground` without a name. That
 * missing context is most of why a request like "换成深色主题" comes back pale.
 *
 * The classification is a fact about the field, so it lives with the fields:
 * `themeFields.js` and `vscode/fields.js` each tag theirs with `aiRole`, and the
 * prompt prints the gloss below next to the field's label. The set is closed on
 * purpose — `verify.mjs` fails if a field names a role that is not here — so a new
 * field cannot reach the model as a bare id.
 *
 * `background*` is the group that decides whether a palette *is* light or dark (see
 * `paletteTone` in `utils/aiRecolor.js`), which is what makes a mismatch between
 * "make it dark" and a pale answer detectable instead of merely disappointing.
 */

/**
 * @type {{id: string, gloss: string}[]}
 */
export const COLOR_ROLES = [
  { id: 'background', gloss: 'a surface that other colours sit on' },
  { id: 'backgroundAlt', gloss: 'a neighbouring surface, a step apart in lightness' },
  { id: 'backgroundInset', gloss: 'a recessed surface, e.g. an input or a floating panel' },
  { id: 'overlay', gloss: 'a highlight laid over a background (selection, current line)' },
  { id: 'text', gloss: 'text or glyphs drawn on a background' },
  { id: 'textMuted', gloss: 'secondary text drawn on a background' },
  { id: 'textOnAccent', gloss: 'text drawn on top of the accent fill' },
  { id: 'accent', gloss: 'the palette’s one saturated emphasis colour' },
  { id: 'accentSoft', gloss: 'a soft accent used as a fill (buttons, badges)' },
  { id: 'line', gloss: 'a border or a divider' },
  { id: 'semantic', gloss: 'an error or warning signal, kept recognisable' },
]

export const COLOR_ROLE_IDS = COLOR_ROLES.map((role) => role.id)

const GLOSS_BY_ROLE = new Map(COLOR_ROLES.map((role) => [role.id, role.gloss]))

/** The prompt-ready description of a role, or `''` for an unknown one. */
export function colorRoleGloss(id) {
  return GLOSS_BY_ROLE.get(id) ?? ''
}

/**
 * Whether a role is part of the group that gives a palette its light-or-dark
 * character. Accents and text follow the surfaces; the surfaces decide.
 */
export function isBackgroundRole(id) {
  return id === 'background' || id === 'backgroundAlt' || id === 'backgroundInset'
}
