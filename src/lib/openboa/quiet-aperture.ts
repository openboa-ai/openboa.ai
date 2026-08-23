import type { ScaleMotionEffect } from "./under-skin-current"

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const clamp = (value: number, minimum: number, maximum: number) => (
  Math.min(maximum, Math.max(minimum, value))
)
const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

export interface ApertureBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export const QUIET_APERTURE = Object.freeze({
  innerEdge: 0.45,
  featherXMin: 79.2,
  featherXMax: 244.8,
  featherXViewportRatio: 0.19125,
  featherYMin: 81.2,
  featherYMax: 128.8,
  featherYViewportRatio: 0.100625,
  shapePower: 4,
  motionFloor: 0.74,
  colorMix: 1,
})

const LOCAL_APERTURE = Object.freeze({
  corePaddingX: 22,
  corePaddingY: 12,
  featherX: 85,
  featherY: 50,
  shapePower: 2.6,
  irregularity: 0.09,
  breathAmplitude: 0.055,
  breathPeriodMs: 7200,
})

const HEADER_APERTURE = Object.freeze({
  mobileBreakpoint: 768,
  regionPhaseOffsetMs: 1800,
})

const superellipseRadius = (
  directionX: number,
  directionY: number,
  radiusX: number,
  radiusY: number,
  power: number,
) => (
  1 / (
    (Math.abs(directionX) / radiusX) ** power
    + (Math.abs(directionY) / radiusY) ** power
  ) ** (1 / power)
)

export function sampleQuietAperture(
  x: number,
  y: number,
  bounds: ApertureBounds,
  viewportWidth = 1280,
) {
  const centerX = (bounds.left + bounds.right) * 0.5
  const centerY = (bounds.top + bounds.bottom) * 0.5
  const radiusX = Math.max((bounds.right - bounds.left) * 0.5, 1)
  const radiusY = Math.max((bounds.bottom - bounds.top) * 0.5, 1)
  const offsetX = x - centerX
  const offsetY = y - centerY
  const distance = Math.hypot(offsetX, offsetY)

  if (distance === 0) return 1

  const safeViewportWidth = Number.isFinite(viewportWidth)
    ? Math.max(viewportWidth, 0)
    : 1280
  const featherX = clamp(
    safeViewportWidth * QUIET_APERTURE.featherXViewportRatio,
    QUIET_APERTURE.featherXMin,
    QUIET_APERTURE.featherXMax,
  )
  const featherY = clamp(
    safeViewportWidth * QUIET_APERTURE.featherYViewportRatio,
    QUIET_APERTURE.featherYMin,
    QUIET_APERTURE.featherYMax,
  )
  const directionX = offsetX / distance
  const directionY = offsetY / distance
  const innerRadius = superellipseRadius(
    directionX,
    directionY,
    radiusX * QUIET_APERTURE.innerEdge,
    radiusY * QUIET_APERTURE.innerEdge,
    QUIET_APERTURE.shapePower,
  )
  const outerRadius = superellipseRadius(
    directionX,
    directionY,
    radiusX + featherX,
    radiusY + featherY,
    QUIET_APERTURE.shapePower,
  )

  return 1 - smoothstep(innerRadius, outerRadius, distance)
}

export function sampleLocalAperture(
  x: number,
  y: number,
  bounds: ApertureBounds,
  timeMs = 0,
  reducedMotion = false,
) {
  const centerX = (bounds.left + bounds.right) * 0.5
  const centerY = (bounds.top + bounds.bottom) * 0.5
  const halfWidth = Math.max((bounds.right - bounds.left) * 0.5, 0)
  const halfHeight = Math.max((bounds.bottom - bounds.top) * 0.5, 0)
  const offsetX = x - centerX
  const offsetY = y - centerY
  const outsideX = Math.max(
    Math.abs(offsetX) - halfWidth - LOCAL_APERTURE.corePaddingX,
    0,
  )
  const outsideY = Math.max(
    Math.abs(offsetY) - halfHeight - LOCAL_APERTURE.corePaddingY,
    0,
  )

  if (outsideX === 0 && outsideY === 0) return 1

  const angle = Math.atan2(offsetY, offsetX)
  const motionTime = reducedMotion || !Number.isFinite(timeMs) ? 0 : timeMs
  const breathPhase = motionTime / LOCAL_APERTURE.breathPeriodMs * Math.PI * 2
  const irregularContour =
    Math.sin(angle * 3 + 0.72) * LOCAL_APERTURE.irregularity
    + Math.sin(angle * 5 - 0.38) * LOCAL_APERTURE.irregularity * 0.48
  const breathingContour = Math.sin(breathPhase + angle * 1.7 + 0.83)
    * LOCAL_APERTURE.breathAmplitude
  const contourScale = 1 + irregularContour + breathingContour
  const featherX = LOCAL_APERTURE.featherX * contourScale
  const featherY = LOCAL_APERTURE.featherY * (
    1 + irregularContour * 0.7 + breathingContour * 0.82
  )
  const normalizedDistance = (
    (outsideX / featherX) ** LOCAL_APERTURE.shapePower
    + (outsideY / featherY) ** LOCAL_APERTURE.shapePower
  ) ** (1 / LOCAL_APERTURE.shapePower)

  if (normalizedDistance >= 1) return 0
  return 1 - smoothstep(0, 1, normalizedDistance)
}

const normalizeBounds = (bounds: ApertureBounds | null) => {
  if (!bounds) return null
  const { left, top, right, bottom } = bounds
  if (![left, top, right, bottom].every(Number.isFinite)) return null
  return {
    left: Math.min(left, right),
    top: Math.min(top, bottom),
    right: Math.max(left, right),
    bottom: Math.max(top, bottom),
  }
}

export function headerApertureRegions(
  viewportWidth: number,
  brandBounds: ApertureBounds,
  navBounds: ApertureBounds,
) {
  const brand = normalizeBounds(brandBounds)
  const nav = normalizeBounds(navBounds)
  if (!brand || !nav) return []

  if (viewportWidth <= HEADER_APERTURE.mobileBreakpoint) {
    return [{
      left: Math.min(brand.left, nav.left),
      top: Math.min(brand.top, nav.top),
      right: Math.max(brand.right, nav.right),
      bottom: Math.max(brand.bottom, nav.bottom),
    }]
  }

  return [brand, nav]
}

export function sampleHeaderAperture(
  x: number,
  y: number,
  regions: ApertureBounds[],
  timeMs = 0,
  reducedMotion = false,
) {
  let strongest = 0
  regions.forEach((region, index) => {
    strongest = Math.max(
      strongest,
      sampleLocalAperture(
        x,
        y,
        region,
        timeMs + index * HEADER_APERTURE.regionPhaseOffsetMs,
        reducedMotion,
      ),
    )
  })
  return strongest
}

export function mergeQuietApertures(...strengths: number[]) {
  return strengths.reduce(
    (strongest, strength) => Math.max(strongest, clamp01(strength)),
    0,
  )
}

export function attenuateScaleMotion(
  effect: ScaleMotionEffect,
  quiet: number,
) {
  const scale = 1 - clamp01(quiet) * (1 - QUIET_APERTURE.motionFloor)
  return {
    shiftX: effect.shiftX * scale,
    shiftY: effect.shiftY * scale,
    sizeScale: 1 + (effect.sizeScale - 1) * scale,
    angle: effect.angle * scale,
  }
}
