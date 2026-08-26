import type { ApertureBounds } from "./quiet-aperture"

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const progress = clamp01((value - edge0) / (edge1 - edge0))
  return progress * progress * (3 - 2 * progress)
}

const mix = (from: number, to: number, progress: number) => (
  from + (to - from) * progress
)

const chapterPhase = (storyProgress: number, finalIndex: number) => {
  const safeProgress = Math.min(finalIndex, Math.max(0, storyProgress))
  const index = Math.min(finalIndex, Math.floor(safeProgress))
  const nextIndex = Math.min(finalIndex, index + 1)
  const local = smoothstep(0, 1, safeProgress - index)
  return { index, nextIndex, local }
}

interface OrganicFieldOptions {
  corePaddingX: number
  corePaddingY: number
  featherX: number
  featherY: number
  rotation: number
  phase: number
  time: number
}

export interface StoryApertureGeometry {
  bounds: ApertureBounds
  fragments: readonly ApertureBounds[]
}

interface NormalizedFallback {
  centerX: number
  centerY: number
  width: number
  height: number
}

const fallbackBounds = (
  viewportWidth: number,
  viewportHeight: number,
  fallback: NormalizedFallback,
): ApertureBounds => {
  const width = fallback.width * viewportWidth
  const height = fallback.height * viewportHeight
  const centerX = fallback.centerX * viewportWidth
  const centerY = fallback.centerY * viewportHeight
  return {
    left: centerX - width * 0.5,
    top: centerY - height * 0.5,
    right: centerX + width * 0.5,
    bottom: centerY + height * 0.5,
  }
}

/**
 * Produces the irregular ink-like reading field around the measured copy.
 * The complete text bounds remain in the off-white core; only the compact
 * outer feather contains translucent scales. This keeps layout and material
 * geometry coupled across viewport sizes.
 */
function sampleInkFragment(
  x: number,
  y: number,
  bounds: ApertureBounds,
  options: OrganicFieldOptions,
  fragmentIndex: number,
) {
  const centerX = (bounds.left + bounds.right) * 0.5
  const centerY = (bounds.top + bounds.bottom) * 0.5
  const halfWidth = Math.max((bounds.right - bounds.left) * 0.5, 1)
  const halfHeight = Math.max((bounds.bottom - bounds.top) * 0.5, 1)
  const offsetX = x - centerX
  const offsetY = y - centerY

  // A horizontal capsule covers each real line fragment. Merging capsules
  // follows the typography's stagger and line lengths, avoiding a single
  // rectangular or elliptical mask around the whole composition.
  const segmentHalf = Math.max(0, halfWidth - halfHeight)
    + options.corePaddingX
  const endpointX = Math.max(Math.abs(offsetX) - segmentHalf, 0)
  const coreRadius = halfHeight * Math.SQRT2 + options.corePaddingY
  const radialDistance = Math.hypot(endpointX, offsetY)
  const outside = Math.max(radialDistance - coreRadius, 0)

  if (outside === 0) return 1

  const angle = Math.atan2(offsetY, Math.max(endpointX, 0.001))
  const fragmentPhase = options.phase + fragmentIndex * 0.83
  const longitudinal = (
    offsetX + offsetY * Math.tan(options.rotation)
  ) / Math.max(48, halfWidth)
  const irregularContour =
    Math.sin(angle * 2.7 + fragmentPhase + options.time * 0.10) * 0.070
    + Math.sin(angle * 5.3 - fragmentPhase * 0.68 - options.time * 0.065) * 0.036
    + Math.sin(longitudinal * 5.4 + fragmentPhase * 1.35) * 0.048
    + Math.sin(longitudinal * 11.2 - fragmentPhase * 0.42) * 0.018
  const breath = Math.sin(
    options.time * 0.38 + angle * 1.45 + fragmentPhase,
  ) * 0.024
  const endWeight = Math.abs(Math.cos(angle))
  const baseFeather = options.featherY
    + (options.featherX - options.featherY) * endWeight
  const feather = baseFeather * Math.max(
    0.78,
    1 + irregularContour + breath,
  )

  return 1 - smoothstep(0, feather, outside)
}

function sampleOrganicField(
  x: number,
  y: number,
  geometry: StoryApertureGeometry,
  options: OrganicFieldOptions,
) {
  const fragments = geometry.fragments.length > 0
    ? geometry.fragments
    : [geometry.bounds]
  let quiet = 0

  fragments.forEach((fragment, index) => {
    const fragmentQuiet = sampleInkFragment(x, y, fragment, options, index)
    // Probabilistic union softens the joins between adjacent line pools; no
    // separate outer silhouette is needed, so the boundary stays asymmetric.
    quiet = 1 - (1 - quiet) * (1 - fragmentQuiet)
  })

  return clamp01(quiet)
}

function measuredOrFallback(
  chapterBounds: readonly StoryApertureGeometry[],
  chapter: number,
  viewportWidth: number,
  viewportHeight: number,
  fallback: NormalizedFallback,
) {
  return chapterBounds[chapter]
    ?? (() => {
      const bounds = fallbackBounds(viewportWidth, viewportHeight, fallback)
      return { bounds, fragments: [bounds] }
    })()
}

function sampleVisionChapter(
  chapter: number,
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  mobile: boolean,
  time: number,
  chapterBounds: readonly StoryApertureGeometry[],
) {
  const normalizedX = x / viewportWidth
  const normalizedY = y / viewportHeight

  // Approved Horizon composition: intentionally preserved without measured
  // bounds so its wide, screen-level opening remains unchanged.
  if (chapter === 3) {
    const center = 0.505
      + Math.sin(normalizedX * 6.2 - time * 0.16) * 0.018
      + Math.sin(normalizedX * 13.0 + time * 0.09) * 0.007
    const distance = Math.abs(normalizedY - center)
    const halfHeight = mobile ? 0.245 : 0.255
    return 1 - smoothstep(halfHeight * 0.70, halfHeight + 0.18, distance)
  }

  const common = {
    corePaddingX: mobile ? 14 : 20,
    corePaddingY: mobile ? 8 : 12,
    featherX: mobile ? 46 : Math.min(88, Math.max(68, viewportWidth * 0.055)),
    featherY: mobile ? 38 : Math.min(64, Math.max(48, viewportWidth * 0.038)),
    time,
  }

  if (chapter === 0) {
    return sampleOrganicField(
      x,
      y,
      measuredOrFallback(chapterBounds, chapter, viewportWidth, viewportHeight, {
        centerX: mobile ? 0.48 : 0.32,
        centerY: mobile ? 0.66 : 0.68,
        width: mobile ? 0.78 : 0.55,
        height: mobile ? 0.30 : 0.28,
      }),
      { ...common, rotation: -0.045, phase: 0.8 },
    )
  }

  if (chapter === 1) {
    return sampleOrganicField(
      x,
      y,
      measuredOrFallback(chapterBounds, chapter, viewportWidth, viewportHeight, {
        centerX: mobile ? 0.50 : 0.70,
        centerY: mobile ? 0.48 : 0.43,
        width: mobile ? 0.78 : 0.43,
        height: mobile ? 0.24 : 0.24,
      }),
      { ...common, rotation: -0.035, phase: 2.2 },
    )
  }

  return sampleOrganicField(
    x,
    y,
    measuredOrFallback(chapterBounds, chapter, viewportWidth, viewportHeight, {
      centerX: mobile ? 0.48 : 0.35,
      centerY: mobile ? 0.53 : 0.53,
      width: mobile ? 0.80 : 0.50,
      height: mobile ? 0.25 : 0.25,
    }),
    { ...common, rotation: 0.035, phase: 4.4 },
  )
}

export function sampleVisionAperture(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  storyProgress: number,
  timeMs = 0,
  reducedMotion = false,
  chapterBounds: readonly StoryApertureGeometry[] = [],
) {
  const width = Math.max(1, viewportWidth)
  const height = Math.max(1, viewportHeight)
  const time = reducedMotion ? 0 : timeMs * 0.001
  const phase = chapterPhase(storyProgress, 3)
  return mix(
    sampleVisionChapter(
      phase.index,
      x,
      y,
      width,
      height,
      width <= 768,
      time,
      chapterBounds,
    ),
    sampleVisionChapter(
      phase.nextIndex,
      x,
      y,
      width,
      height,
      width <= 768,
      time,
      chapterBounds,
    ),
    phase.local,
  )
}

function sampleAboutChapter(
  chapter: number,
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  mobile: boolean,
  time: number,
  chapterBounds: readonly StoryApertureGeometry[],
) {
  const common = {
    corePaddingX: mobile ? 14 : 20,
    corePaddingY: mobile ? 8 : 12,
    featherX: mobile ? 46 : Math.min(88, Math.max(68, viewportWidth * 0.055)),
    featherY: mobile ? 38 : Math.min(64, Math.max(48, viewportWidth * 0.038)),
    time,
  }

  if (chapter === 0) {
    return sampleOrganicField(
      x,
      y,
      measuredOrFallback(chapterBounds, chapter, viewportWidth, viewportHeight, {
        centerX: mobile ? 0.48 : 0.40,
        centerY: mobile ? 0.58 : 0.57,
        width: mobile ? 0.80 : 0.66,
        height: mobile ? 0.48 : 0.34,
      }),
      { ...common, rotation: -0.035, phase: 1.7 },
    )
  }

  if (chapter === 1) {
    return sampleOrganicField(
      x,
      y,
      measuredOrFallback(chapterBounds, chapter, viewportWidth, viewportHeight, {
        centerX: mobile ? 0.50 : 0.68,
        centerY: mobile ? 0.54 : 0.53,
        width: mobile ? 0.80 : 0.46,
        height: mobile ? 0.50 : 0.45,
      }),
      { ...common, rotation: -0.03, phase: 3.8 },
    )
  }

  return sampleOrganicField(
    x,
    y,
    measuredOrFallback(chapterBounds, chapter, viewportWidth, viewportHeight, {
      centerX: mobile ? 0.50 : 0.39,
      centerY: mobile ? 0.52 : 0.53,
      width: mobile ? 0.80 : 0.62,
      height: mobile ? 0.48 : 0.37,
    }),
    { ...common, rotation: -0.035, phase: 5.2 },
  )
}

export function sampleAboutAperture(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  storyProgress: number,
  timeMs = 0,
  reducedMotion = false,
  chapterBounds: readonly StoryApertureGeometry[] = [],
) {
  const width = Math.max(1, viewportWidth)
  const height = Math.max(1, viewportHeight)
  const time = reducedMotion ? 0 : timeMs * 0.001
  const phase = chapterPhase(storyProgress, 2)
  return mix(
    sampleAboutChapter(
      phase.index,
      x,
      y,
      width,
      height,
      width <= 768,
      time,
      chapterBounds,
    ),
    sampleAboutChapter(
      phase.nextIndex,
      x,
      y,
      width,
      height,
      width <= 768,
      time,
      chapterBounds,
    ),
    phase.local,
  )
}

export function sceneMixTarget(scene: "landing" | "vision" | "about") {
  return {
    landing: scene === "landing" ? 1 : 0,
    vision: scene === "vision" ? 1 : 0,
    about: scene === "about" ? 1 : 0,
  }
}
