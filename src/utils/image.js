/**
 * Image colour extraction — fully local, no AI, no network, no dependency.
 *
 * Two strategies, chosen automatically:
 *
 *   bands    Flat palette cards (the common designer screenshot). Finds the
 *            swatch block, splits it into bands, and returns the bands in their
 *            original order with the **exact** colours that were painted.
 *
 *   clusters Photos / illustrations / swatch grids. Quantises pixels into
 *            buckets, runs a deterministic k-means over cluster centroids, and
 *            merges near-duplicates.
 *
 * ---------------------------------------------------------------------------
 * Why "bands" needs three stages, not one
 * ---------------------------------------------------------------------------
 * A palette card pasted as a screenshot is mostly not palette. It arrives with a
 * page margin, a row of action buttons, and printed hex/rgb labels. Averaging
 * whole lines over a full-width screenshot therefore mixes page white into every
 * swatch — which washes the colours out, merges bands that were deliberately
 * distinct, and turns the label area into an extra band. `detectBands` narrows
 * the problem before it measures:
 *
 *   1. infer the page background from the border ring and trim it away
 *   2. keep only the longest run of lines that are internally *uniform* — the
 *      swatch block; a line of text is not uniform, so labels drop out
 *   3. take each band's interior per-channel **median**, which is the exact
 *      colour, immune to the anti-aliased lines between bands and rounded corners
 *
 * Reading the printed hex labels with OCR is deliberately *not* done: the
 * swatches themselves are the ground truth, so recovering them exactly makes the
 * labels redundant, and an OCR pass would be a large, font-dependent liability
 * with no dependency budget to spend on it.
 *
 * ---------------------------------------------------------------------------
 * DELIBERATE SIMPLICITY: the user stays in control
 * ---------------------------------------------------------------------------
 * Heuristics for "which band is the background, not a palette colour" get
 * unreliable fast (a palette card's own first swatch is often the same white as
 * the page). Rather than guess, `detectBands` returns every substantial band and
 * the UI renders them as **removable swatches** — one click to drop a stray
 * background colour, fully predictable, no magic.
 *
 * The pure functions below take a raw RGBA buffer, so they are unit-testable in
 * Node without a canvas.
 */

const MAX_FILE_BYTES = 10 * 1024 * 1024
const SAMPLE_EDGE = 320
const MAX_SAMPLES = 20000

/** Fraction of adjacent pixel pairs that must match for an image to read as "flat". */
const FLATNESS_THRESHOLD = 0.72
const ADJACENT_SIMILAR = 26

/**
 * Sum of |dr|+|dg|+|db| below which two lines are treated as the same band.
 *
 * Deliberately tight: two adjacent pastel swatches on a real palette card can sit
 * as close as 30 apart (#FBEFEF vs #FFE2E2), so a coarse threshold silently eats
 * a colour. Splitting eagerly is safe because `COLOR_MERGE_DISTANCE` below
 * re-joins anything that was split by nothing but compression noise.
 */
const LINE_SIMILARITY = 16
const BAND_MIN_SHARE = 0.03
const BAND_MIN_LINES = 2
const BAND_MAX = 8
const COLOR_MERGE_DISTANCE = 20

/**
 * A line only counts as a swatch line if its own pixels are this close to the
 * line's mean. A solid swatch scores near 0; a line that crosses several
 * swatches, or that contains text, scores well over 100 and is rejected.
 */
const LINE_SOLID_SPREAD = 34

/** Distance from the page background above which a pixel counts as content. */
const CONTENT_DISTANCE = 26

/** Fraction trimmed from each end of a band before sampling its colour. */
const BAND_TRIM = 0.22

/** Fraction trimmed from the cross axis of a band before sampling. */
const EDGE_INSET = 0.06

/** Share of the border ring a colour needs to own before it counts as "page background". */
const BACKGROUND_RING_SHARE = 0.5

const CLUSTER_K = 6
const CLUSTER_ITERATIONS = 14
const QUANT_BITS = 5
const BACKGROUND_SHARE = 0.45

function distance(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b)
}

function toHex({ r, g, b }) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
  return (
    '#' +
    [r, g, b]
      .map((c) => clamp(c).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

function toRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function chromaOf({ r, g, b }) {
  return (Math.max(r, g, b) - Math.min(r, g, b)) / 255
}

/**
 * How "flat" is this image? Measured as the share of horizontally adjacent
 * pixel pairs that are nearly identical. Flat vector art scores near 1, a photo
 * scores well under 0.5.
 *
 * @param {Uint8ClampedArray} data RGBA
 */
export function measureFlatness(data, width, height) {
  let similar = 0
  let total = 0
  const step = Math.max(1, Math.floor(height / 160))

  for (let y = 0; y < height; y += step) {
    const row = y * width * 4
    for (let x = 1; x < width; x += 2) {
      const i = row + x * 4
      const d =
        Math.abs(data[i] - data[i - 4]) +
        Math.abs(data[i + 1] - data[i - 3]) +
        Math.abs(data[i + 2] - data[i - 2])
      if (d < ADJACENT_SIMILAR) similar += 1
      total += 1
    }
  }

  return total === 0 ? 0 : similar / total
}

/**
 * Pixel offset for line `i`, position `j` along `axis`.
 * axis 0 walks rows (i = y, j = x); axis 1 walks columns (i = x, j = y).
 */
function pixelIndex(i, j, width, axis) {
  return axis === 0 ? i * width + j : j * width + i
}

/**
 * The page background, if the artwork leaves a margin.
 *
 * A palette card pasted as a screenshot sits on a page white that is not part of
 * the palette; row averages that span it come out washed out, which is how a
 * four-colour card ends up reported as three colours plus white.
 *
 * A page background *frames* the artwork, so the candidate has to run along most
 * of the border — not merely be the most common colour on it. Without that test a
 * two-band card, whose top swatch already fills half the border, would have that
 * swatch dismissed as "page" and trimmed away.
 *
 * Returns `null` when no colour frames the image, i.e. there is no margin to trim.
 */
function borderBackground(data, width, height) {
  const sample = (x, y) => {
    const o = (y * width + x) * 4
    return { r: data[o], g: data[o + 1], b: data[o + 2] }
  }
  const matches = (a, b) =>
    Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) <= CONTENT_DISTANCE

  const samples = []
  const stepX = Math.max(1, Math.floor(width / 64))
  const stepY = Math.max(1, Math.floor(height / 64))
  for (let x = 0; x < width; x += stepX) {
    samples.push(sample(x, 0))
    samples.push(sample(x, height - 1))
  }
  for (let y = 0; y < height; y += stepY) {
    samples.push(sample(0, y))
    samples.push(sample(width - 1, y))
  }
  if (!samples.length) return null

  const buckets = new Map()
  for (const s of samples) {
    const key = ((s.r >> 3) << 10) | ((s.g >> 3) << 5) | (s.b >> 3)
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0 }
    bucket.r += s.r
    bucket.g += s.g
    bucket.b += s.b
    bucket.count += 1
    buckets.set(key, bucket)
  }

  let best = null
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket
  }
  if (!best || best.count / samples.length < BACKGROUND_RING_SHARE) return null

  const candidate = { r: best.r / best.count, g: best.g / best.count, b: best.b / best.count }

  const sideRatio = (points) => {
    let hit = 0
    for (const p of points) if (matches(p, candidate)) hit += 1
    return points.length ? hit / points.length : 0
  }

  const sides = [[], [], [], []]
  for (let x = 0; x < width; x += 1) {
    sides[0].push(sample(x, 0))
    sides[1].push(sample(x, height - 1))
  }
  for (let y = 0; y < height; y += 1) {
    sides[2].push(sample(0, y))
    sides[3].push(sample(width - 1, y))
  }

  const framingSides = sides.filter((points) => sideRatio(points) >= 0.7).length
  return framingSides >= 3 ? candidate : null
}

/** Smallest box containing every pixel that differs from the page background. */
function contentBox(data, width, height, background) {
  const full = { x0: 0, y0: 0, x1: width - 1, y1: height - 1 }
  if (!background) return full

  const differs = (x, y) => {
    const o = (y * width + x) * 4
    return (
      Math.abs(data[o] - background.r) +
        Math.abs(data[o + 1] - background.g) +
        Math.abs(data[o + 2] - background.b) >
      CONTENT_DISTANCE
    )
  }

  let x0 = 0
  for (let x = 0; x < width; x += 1) {
    let hit = false
    for (let y = 0; y < height; y += 1) {
      if (differs(x, y)) {
        hit = true
        break
      }
    }
    if (hit) {
      x0 = x
      break
    }
  }

  let x1 = width - 1
  for (let x = width - 1; x >= 0; x -= 1) {
    let hit = false
    for (let y = 0; y < height; y += 1) {
      if (differs(x, y)) {
        hit = true
        break
      }
    }
    if (hit) {
      x1 = x
      break
    }
  }

  let y0 = 0
  for (let y = 0; y < height; y += 1) {
    let hit = false
    for (let x = x0; x <= x1; x += 1) {
      if (differs(x, y)) {
        hit = true
        break
      }
    }
    if (hit) {
      y0 = y
      break
    }
  }

  let y1 = height - 1
  for (let y = height - 1; y >= 0; y -= 1) {
    let hit = false
    for (let x = x0; x <= x1; x += 1) {
      if (differs(x, y)) {
        hit = true
        break
      }
    }
    if (hit) {
      y1 = y
      break
    }
  }

  // A degenerate box means the background test misfired; fall back to everything.
  if (x1 - x0 < 1 || y1 - y0 < 1) return full
  return { x0, y0, x1, y1 }
}

/**
 * Profile every line along one axis, inside the content box only.
 *
 * Produces each line's mean colour *and* how far its pixels stray from that
 * mean. That spread is what separates a swatch line from a text line: the two
 * have wildly different statistics even though both average out to a pale grey.
 */
function profileLines(data, box, axis, width) {
  const lineStart = axis === 0 ? box.y0 : box.x0
  const lineEnd = axis === 0 ? box.y1 : box.x1
  const crossStart = axis === 0 ? box.x0 : box.y0
  const crossEnd = axis === 0 ? box.x1 : box.y1
  const crossSpan = crossEnd - crossStart + 1
  const inset = crossSpan >= 40 ? Math.floor(crossSpan * EDGE_INSET) : 0
  const lo = crossStart + inset
  const hi = crossEnd - inset

  const profiles = []
  for (let i = lineStart; i <= lineEnd; i += 1) {
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    for (let j = lo; j <= hi; j += 1) {
      const o = pixelIndex(i, j, width, axis) * 4
      r += data[o]
      g += data[o + 1]
      b += data[o + 2]
      n += 1
    }
    if (!n) {
      profiles.push({ r: 0, g: 0, b: 0, spread: Infinity })
      continue
    }

    const mr = r / n
    const mg = g / n
    const mb = b / n
    let deviation = 0
    for (let j = lo; j <= hi; j += 1) {
      const o = pixelIndex(i, j, width, axis) * 4
      deviation +=
        Math.abs(data[o] - mr) + Math.abs(data[o + 1] - mg) + Math.abs(data[o + 2] - mb)
    }
    profiles.push({ r: mr, g: mg, b: mb, spread: deviation / n })
  }

  return profiles
}

/** Maximal runs of consecutive solid lines. */
function solidRuns(profiles) {
  const runs = []
  let start = -1

  for (let i = 0; i <= profiles.length; i += 1) {
    const solid = i < profiles.length && profiles[i].spread <= LINE_SOLID_SPREAD
    if (solid) {
      if (start < 0) start = i
    } else if (start >= 0) {
      runs.push({ start, end: i - 1 })
      start = -1
    }
  }

  return runs
}

/** Split one solid run into bands of consecutive, visually identical lines. */
function splitBands(profiles, run) {
  const groups = []
  let current = { ...profiles[run.start], start: run.start, end: run.start, count: 1 }

  for (let i = run.start + 1; i <= run.end; i += 1) {
    const line = profiles[i]
    if (distance(line, current) < LINE_SIMILARITY) {
      const n = current.count
      current.r = (current.r * n + line.r) / (n + 1)
      current.g = (current.g * n + line.g) / (n + 1)
      current.b = (current.b * n + line.b) / (n + 1)
      current.count += 1
      current.end = i
    } else {
      groups.push(current)
      current = { ...line, start: i, end: i, count: 1 }
    }
  }

  groups.push(current)
  return groups
}

/**
 * Exact colour of a band: the per-channel **median** of its interior pixels.
 *
 * Sampling the middle of the band steps past the anti-aliased transition lines
 * at band boundaries and the rounded corners at the ends of a swatch block, and
 * a median ignores whatever stray pixel survives that.
 */
function bandColor(data, box, axis, width, start, end) {
  const length = end - start + 1
  const trim = length >= 6 ? Math.max(1, Math.floor(length * BAND_TRIM)) : 0
  const from = start + trim
  const to = end - trim

  const crossStart = axis === 0 ? box.x0 : box.y0
  const crossEnd = axis === 0 ? box.x1 : box.y1
  const crossSpan = crossEnd - crossStart + 1
  const inset = crossSpan >= 40 ? Math.floor(crossSpan * EDGE_INSET) : 0
  const lo = crossStart + inset
  const hi = crossEnd - inset

  const total = (to - from + 1) * (hi - lo + 1)
  const step = Math.max(1, Math.floor(total / 4000))

  const rs = []
  const gs = []
  const bs = []
  let counter = 0
  for (let i = from; i <= to; i += 1) {
    for (let j = lo; j <= hi; j += 1) {
      counter += 1
      if (counter % step) continue
      const o = pixelIndex(i, j, width, axis) * 4
      rs.push(data[o])
      gs.push(data[o + 1])
      bs.push(data[o + 2])
    }
  }
  if (!rs.length) return null

  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
  }
  return { r: median(rs), g: median(gs), b: median(bs) }
}

/**
 * Extract flat colour bands from a palette card.
 *
 * A palette card screenshot is mostly *not* palette: it has a page margin, a row
 * of action buttons, and printed hex/rgb labels. Averaging whole lines across a
 * full-width screenshot mixes all of that into the swatches. So the search is
 * narrowed first, then measured:
 *
 *   1. find the page background from the border ring, trim it off
 *   2. profile every line and keep the longest run whose pixels are internally
 *      uniform — the swatch block. Text rows and spanning rows are not uniform.
 *   3. split that run into bands, then take each band's interior **median**,
 *      which is the exact colour that was painted
 *
 * Both axes are tried, so horizontal and vertical cards both work.
 *
 * @param {Uint8ClampedArray} data RGBA
 * @returns {{ hex: string, share: number }[] | null} in original order
 */
export function detectBands(data, width, height) {
  if (!width || !height) return null

  const background = borderBackground(data, width, height)
  const box = contentBox(data, width, height, background)

  const candidates = []
  for (const axis of [0, 1]) {
    const profiles = profileLines(data, box, axis, width)

    for (const run of solidRuns(profiles)) {
      const runLength = run.end - run.start + 1
      const groups = splitBands(profiles, run).filter(
        (g) => g.count / runLength >= BAND_MIN_SHARE && g.count >= BAND_MIN_LINES,
      )
      if (groups.length < 2 || groups.length > BAND_MAX) continue

      // A real palette card is regular; accidental banding in photo content is not.
      const shares = groups.map((g) => g.count / runLength)
      const mean = shares.reduce((a, s) => a + s, 0) / shares.length
      const variance = shares.reduce((a, s) => a + (s - mean) ** 2, 0) / shares.length

      candidates.push({ axis, run, groups, runLength, variance })
    }
  }

  if (!candidates.length) return null

  // Prefer the run holding the most distinct colours, then the longest such run
  // (the swatch block rather than a stray white strip), then the most regular.
  candidates.sort(
    (a, b) =>
      b.groups.length - a.groups.length ||
      b.runLength - a.runLength ||
      a.variance - b.variance,
  )
  const best = candidates[0]

  const colors = []
  for (const group of best.groups) {
    const refined = bandColor(data, box, best.axis, width, group.start, group.end) ?? group
    const hex = toHex(refined)
    const existing = colors.find((c) => distance(toRgb(c.hex), toRgb(hex)) < COLOR_MERGE_DISTANCE)
    if (existing) {
      existing.share += group.count / best.runLength
      continue
    }
    colors.push({ hex, share: group.count / best.runLength })
  }

  return colors.length >= 2 ? colors : null
}

/**
 * Dominant-colour clustering for non-flat images.
 *
 * Deterministic: no `Math.random` anywhere. Pixels are quantised into
 * `2^QUANT_BITS` per channel buckets, k-means runs over the bucket centroids
 * weighted by population, and the seed centres are chosen by weighted
 * farthest-point sampling.
 *
 * @param {Uint8ClampedArray} data RGBA
 * @returns {{ hex: string, share: number }[]} sorted light -> dark
 */
export function clusterColors(data, width, height, k = CLUSTER_K) {
  const total = width * height
  const stride = Math.max(1, Math.floor(total / MAX_SAMPLES))
  const shift = 8 - QUANT_BITS

  /** @type {Map<number, {r:number,g:number,b:number,count:number}>} */
  const buckets = new Map()

  for (let p = 0; p < total; p += stride) {
    const o = p * 4
    if (data[o + 3] < 128) continue // skip transparent pixels
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const key = ((r >> shift) << (QUANT_BITS * 2)) | ((g >> shift) << QUANT_BITS) | (b >> shift)

    const bucket = buckets.get(key)
    if (bucket) {
      bucket.r += r
      bucket.g += g
      bucket.b += b
      bucket.count += 1
    } else {
      buckets.set(key, { r, g, b, count: 1 })
    }
  }

  const points = [...buckets.values()].map((b) => ({
    r: b.r / b.count,
    g: b.g / b.count,
    b: b.b / b.count,
    count: b.count,
  }))

  if (points.length === 0) return []

  const totalCount = points.reduce((sum, p) => sum + p.count, 0)

  // Fewer distinct buckets than requested centres: no clustering needed, but the
  // result still goes through `finalise` so the backdrop rule applies here too.
  if (points.length <= k) {
    return finalise(
      points.map((p) => ({ hex: toHex(p), share: p.count / totalCount })),
      k,
    )
  }

  // --- weighted farthest-point initialisation -----------------------------
  const centres = [points.reduce((max, p) => (p.count > max.count ? p : max), points[0])]
  while (centres.length < k) {
    let best = null
    let bestScore = -1
    for (const p of points) {
      let nearest = Infinity
      for (const c of centres) nearest = Math.min(nearest, distance(p, c))
      const score = nearest * Math.sqrt(p.count)
      if (score > bestScore) {
        bestScore = score
        best = p
      }
    }
    if (!best) break
    centres.push(best)
  }

  // --- Lloyd iterations ---------------------------------------------------
  let assignment = new Array(points.length).fill(0)
  for (let iteration = 0; iteration < CLUSTER_ITERATIONS; iteration += 1) {
    let moved = false
    for (let i = 0; i < points.length; i += 1) {
      let bestIndex = 0
      let bestDistance = Infinity
      for (let c = 0; c < centres.length; c += 1) {
        const d = distance(points[i], centres[c])
        if (d < bestDistance) {
          bestDistance = d
          bestIndex = c
        }
      }
      if (assignment[i] !== bestIndex) {
        assignment[i] = bestIndex
        moved = true
      }
    }

    const sums = centres.map(() => ({ r: 0, g: 0, b: 0, count: 0 }))
    for (let i = 0; i < points.length; i += 1) {
      const target = sums[assignment[i]]
      target.r += points[i].r * points[i].count
      target.g += points[i].g * points[i].count
      target.b += points[i].b * points[i].count
      target.count += points[i].count
    }
    for (let c = 0; c < centres.length; c += 1) {
      if (sums[c].count > 0) {
        centres[c] = {
          r: sums[c].r / sums[c].count,
          g: sums[c].g / sums[c].count,
          b: sums[c].b / sums[c].count,
          count: sums[c].count,
        }
      }
    }

    if (!moved) break
  }

  // --- merge near-duplicates, then hand off to the shared finaliser ---------
  const merged = []
  for (const centre of centres) {
    if (!centre.count) continue
    const hex = toHex(centre)
    const existing = merged.find((m) => distance(toRgb(m.hex), toRgb(hex)) < COLOR_MERGE_DISTANCE)
    if (existing) {
      existing.share += centre.count / totalCount
    } else {
      merged.push({ hex, share: centre.count / totalCount })
    }
  }

  return finalise(merged, k)
}

function luminance(hex) {
  const { r, g, b } = toRgb(hex)
  const channel = (c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/**
 * Shared post-processing for both clustering paths — the "few buckets" shortcut
 * and the full k-means run must agree, or the same image would be reported
 * differently depending on how many distinct colours it happens to contain.
 *
 * Order of operations:
 *   1. rank by area (share of pixels) so "dominant" really means dominant
 *   2. drop a dominant, near-neutral backdrop (page white / studio grey)
 *   3. cap at k
 *   4. present light -> dark, which is how designers read a palette
 *
 * @param {{hex:string, share:number}[]} entries  shares must sum to ~1
 */
function finalise(entries, k) {
  const ranked = [...entries].sort((a, b) => b.share - a.share)

  let result = ranked
  if (
    result.length > 2 &&
    result[0].share > BACKGROUND_SHARE &&
    chromaOf(toRgb(result[0].hex)) < 0.12
  ) {
    result = result.slice(1)
  }

  return result.slice(0, k).sort((a, b) => luminance(b.hex) - luminance(a.hex))
}

// ---------------------------------------------------------------------------
// Browser entry point
// ---------------------------------------------------------------------------

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  // Safari fallback: <img> + object URL.
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('image decode failed'))
      el.src = url
    })
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Extract a palette from an image file or pasted bitmap.
 *
 * @param {Blob|File} file
 * @param {{ max?: number }} [options]
 * @returns {Promise<{ok:true, colors:{hex:string,share:number}[], strategy:'bands'|'clusters', width:number, height:number}
 *                 | {ok:false, error:string}>}
 *   `error` is an i18n key.
 */
export async function extractPaletteFromImage(file, { max = CLUSTER_K } = {}) {
  if (!file) return { ok: false, error: 'import.errorBadImage' }
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'import.errorTooBig' }
  if (file.type && !file.type.startsWith('image/')) {
    return { ok: false, error: 'import.errorBadFile' }
  }

  let bitmap
  try {
    bitmap = await loadBitmap(file)
  } catch {
    return { ok: false, error: 'import.errorBadImage' }
  }

  const sourceWidth = bitmap.width ?? 0
  const sourceHeight = bitmap.height ?? 0
  if (!sourceWidth || !sourceHeight) return { ok: false, error: 'import.errorBadImage' }

  const scale = Math.min(1, SAMPLE_EDGE / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return { ok: false, error: 'import.errorBadImage' }

  context.drawImage(bitmap, 0, 0, width, height)
  if (typeof bitmap.close === 'function') bitmap.close()

  let imageData
  try {
    imageData = context.getImageData(0, 0, width, height)
  } catch {
    return { ok: false, error: 'import.errorBadImage' }
  }

  const { data } = imageData
  const flatness = measureFlatness(data, width, height)

  if (flatness >= FLATNESS_THRESHOLD) {
    const bands = detectBands(data, width, height)
    if (bands && bands.length >= 2) {
      return { ok: true, colors: bands.slice(0, Math.max(max, 4)), strategy: 'bands', width, height }
    }
  }

  const clusters = clusterColors(data, width, height, max)
  if (!clusters.length) return { ok: false, error: 'import.errorNoColors' }

  return { ok: true, colors: clusters, strategy: 'clusters', width, height }
}
