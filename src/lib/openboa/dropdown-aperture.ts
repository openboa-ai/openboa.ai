const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
)
const clamp01 = (value: number) => clamp(value, 0, 1)
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const amount = clamp01((value - edge0) / (edge1 - edge0))
  return amount * amount * (3 - 2 * amount)
}

const OPEN_RESPONSE_MS = 180
const CLOSE_RESPONSE_MS = 280
const COLOR_OPEN_RESPONSE_MS = 420
const COLOR_CLOSE_RESPONSE_MS = 360
const BREATH_DURATION_MS = 5200

export interface DropdownApertureGeometry {
  centerX: number
  topY: number
  bottomY: number
  halfWidth: number
  featherX: number
  featherY: number
}

function advance(
  currentProgress: number,
  targetProgress: number,
  deltaMs: number,
  openResponseMs: number,
  closeResponseMs: number,
  reducedMotion: boolean,
) {
  const current = clamp01(currentProgress)
  const target = clamp01(targetProgress)
  if (reducedMotion) return target
  const responseMs = target > current ? openResponseMs : closeResponseMs
  const retention = Math.exp(-Math.max(0, deltaMs) / responseMs)
  return clamp01(target + (current - target) * retention)
}

export function advanceDropdownAperture(
  currentProgress: number,
  targetProgress: number,
  deltaMs: number,
  reducedMotion = false,
) {
  return advance(
    currentProgress,
    targetProgress,
    deltaMs,
    OPEN_RESPONSE_MS,
    CLOSE_RESPONSE_MS,
    reducedMotion,
  )
}

export function advanceDropdownColorMix(
  currentProgress: number,
  targetProgress: number,
  deltaMs: number,
  reducedMotion = false,
) {
  return advance(
    currentProgress,
    targetProgress,
    deltaMs,
    COLOR_OPEN_RESPONSE_MS,
    COLOR_CLOSE_RESPONSE_MS,
    reducedMotion,
  )
}

export function sampleDropdownTextOpacity(
  colorProgress: number,
  itemIndex: number,
  itemCount: number,
) {
  const count = Math.max(1, Math.floor(itemCount))
  const index = clamp(Math.floor(itemIndex), 0, count - 1)
  const depth = count === 1 ? 0 : index / (count - 1)
  const threshold = 0.16 + depth * 0.18
  return smoothstep(threshold, threshold + 0.4, clamp01(colorProgress))
}

export function shouldKeepDropdownOpen(
  targetOpen: boolean,
  colorProgress: number,
) {
  return targetOpen || sampleDropdownTextOpacity(colorProgress, 0, 1) > 0
}

export function sampleDropdownAperture(
  x: number,
  y: number,
  geometry: DropdownApertureGeometry,
  progress: number,
  elapsedMs = 0,
  colorProgress = 1,
) {
  const openProgress = clamp01(progress)
  if (openProgress <= 0 || y < geometry.topY) return 0

  const expansion = smoothstep(0, 1, openProgress)
  const frontY = geometry.topY
    + Math.max(0, geometry.bottomY - geometry.topY) * expansion
  const verticalMix = 1 - smoothstep(
    frontY,
    frontY + Math.max(1, geometry.featherY),
    y,
  )
  const fieldDepth = Math.max(1, geometry.bottomY - geometry.topY)
  const normalizedDepth = clamp01((y - geometry.topY) / fieldDepth)
  const bodySpread = smoothstep(0, 0.3, normalizedDepth)
  const phase = elapsedMs / BREATH_DURATION_MS * Math.PI * 2
  const widthWobble = (
    Math.sin(normalizedDepth * 7.4 + phase) * 0.07
    + Math.sin(normalizedDepth * 13.1 - phase * 0.61) * 0.035
  )
  const baseHalfWidth = Math.max(1, geometry.halfWidth)
  const localHalfWidth = baseHalfWidth
    * (0.38 + bodySpread * 0.62)
    * (1 + widthWobble)
  const localCenterX = geometry.centerX + baseHalfWidth * 0.045
    * Math.sin(normalizedDepth * 8.3 - phase * 0.7)
  const distanceOutside = Math.abs(x - localCenterX) - localHalfWidth
  const horizontalMix = 1 - smoothstep(
    0,
    Math.max(1, geometry.featherX),
    distanceOutside,
  )
  const depthDelay = normalizedDepth * 0.28
  const localColorProgress = clamp01(
    (clamp01(colorProgress) - depthDelay) / (1 - depthDelay),
  )
  return verticalMix * horizontalMix * smoothstep(0, 1, localColorProgress)
}
