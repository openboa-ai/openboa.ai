const FRAME_MS = 1000 / 60
const OFFSCREEN = -10000

const clamp = (value: number, min: number, max: number) => (
  Math.min(max, Math.max(min, value))
)

const responseBlend = (elapsedMs: number, responseMs: number) => (
  responseMs <= 0 ? 1 : 1 - Math.exp(-elapsedMs / responseMs)
)

export interface UnderSkinState {
  x: number
  y: number
  directionX: number
  directionY: number
  impulse: number
  energy: number
  presence: number
  active: boolean
}

export interface ScaleMotionEffect {
  ridge: number
  shiftX: number
  shiftY: number
  sizeScale: number
  angle: number
}

interface UnderSkinCurrentOptions {
  positionResponseMs?: number
  velocityResponseMs?: number
  energyAttackMs?: number
  energyReleaseMs?: number
  velocityHoldMs?: number
  decayMs?: number
  leaveDecayMs?: number
}

export class UnderSkinCurrent {
  private readonly positionResponseMs: number
  private readonly velocityResponseMs: number
  private readonly energyAttackMs: number
  private readonly energyReleaseMs: number
  private readonly velocityHoldMs: number
  private readonly decayMs: number
  private readonly leaveDecayMs: number
  private x = OFFSCREEN
  private y = OFFSCREEN
  private targetX = OFFSCREEN
  private targetY = OFFSCREEN
  private rawVelocityX = 0
  private rawVelocityY = 0
  private velocityX = 0
  private velocityY = 0
  private directionX = 1
  private directionY = 0
  private impulse = 0
  private energy = 0
  private presence = 0
  private active = false
  private initialized = false
  private lastMoveTime: number | null = null
  private lastFrameTime: number | null = null

  constructor({
    positionResponseMs = 22,
    velocityResponseMs = 48,
    energyAttackMs = 42,
    energyReleaseMs = 140,
    velocityHoldMs = 34,
    decayMs = 220,
    leaveDecayMs = 180,
  }: UnderSkinCurrentOptions = {}) {
    this.positionResponseMs = positionResponseMs
    this.velocityResponseMs = velocityResponseMs
    this.energyAttackMs = energyAttackMs
    this.energyReleaseMs = energyReleaseMs
    this.velocityHoldMs = velocityHoldMs
    this.decayMs = decayMs
    this.leaveDecayMs = leaveDecayMs
  }

  move(x: number, y: number, timeMs: number) {
    if (![x, y, timeMs].every(Number.isFinite)) return

    const resumesCurrent = this.initialized && this.active

    if (resumesCurrent && this.lastMoveTime !== null) {
      const rawElapsed = timeMs - this.lastMoveTime
      const dx = x - this.targetX
      const dy = y - this.targetY

      if (rawElapsed > 0 && rawElapsed <= 96) {
        const elapsed = clamp(rawElapsed, 1, 64)
        this.rawVelocityX = dx * FRAME_MS / elapsed
        this.rawVelocityY = dy * FRAME_MS / elapsed
      } else {
        this.rawVelocityX = 0
        this.rawVelocityY = 0
      }
    } else {
      this.x = x
      this.y = y
      this.rawVelocityX = 0
      this.rawVelocityY = 0
      this.velocityX = 0
      this.velocityY = 0
      this.energy = 0
      this.initialized = true
    }

    this.targetX = x
    this.targetY = y
    this.active = true
    this.presence = 1
    this.lastMoveTime = timeMs
  }

  leave() {
    this.active = false
  }

  frame(timeMs: number): UnderSkinState {
    const previous = this.lastFrameTime ?? timeMs
    const elapsed = clamp(Math.max(0, timeMs - previous), 0, 64)
    this.lastFrameTime = timeMs

    if (this.initialized) {
      const positionBlend = responseBlend(elapsed, this.positionResponseMs)
      this.x += (this.targetX - this.x) * positionBlend
      this.y += (this.targetY - this.y) * positionBlend
    }

    const age = this.lastMoveTime === null
      ? Number.POSITIVE_INFINITY
      : Math.max(0, timeMs - this.lastMoveTime)
    const releaseMs = this.active ? this.decayMs : this.leaveDecayMs
    const velocityFade = Number.isFinite(age)
      ? Math.exp(-Math.max(0, age - this.velocityHoldMs) / releaseMs)
      : 0
    const targetVelocityX = this.rawVelocityX * velocityFade
    const targetVelocityY = this.rawVelocityY * velocityFade
    const velocityBlend = responseBlend(elapsed, this.velocityResponseMs)

    this.velocityX += (targetVelocityX - this.velocityX) * velocityBlend
    this.velocityY += (targetVelocityY - this.velocityY) * velocityBlend

    const speed = Math.hypot(this.velocityX, this.velocityY)
    if (speed > 0.08) {
      this.directionX = this.velocityX / speed
      this.directionY = this.velocityY / speed
    }
    this.impulse = clamp(speed / 14, 0, 1)
    const targetEnergy = clamp(
      Math.hypot(targetVelocityX, targetVelocityY) / 14,
      0,
      1,
    )
    const energyResponseMs = targetEnergy > this.energy
      ? this.energyAttackMs
      : this.energyReleaseMs
    this.energy += (targetEnergy - this.energy) * responseBlend(
      elapsed,
      energyResponseMs,
    )

    if (!this.active) {
      this.presence *= Math.exp(-elapsed / this.leaveDecayMs)
    }

    return {
      x: this.x,
      y: this.y,
      directionX: this.directionX,
      directionY: this.directionY,
      impulse: this.impulse,
      energy: this.energy,
      presence: this.presence,
      active: this.active,
    }
  }
}

export function sampleUnderSkinCurrent(
  dx: number,
  dy: number,
  state: UnderSkinState,
): ScaleMotionEffect {
  const directionLength = Math.hypot(state.directionX, state.directionY) || 1
  const directionX = state.directionX / directionLength
  const directionY = state.directionY / directionLength
  const perpendicularX = -directionY
  const perpendicularY = directionX
  const along = dx * directionX + dy * directionY
  const across = dx * perpendicularX + dy * perpendicularY
  const alongNormal = along / 132
  const acrossNormal = across / 68
  const profile = Math.exp(-0.5 * (
    alongNormal * alongNormal + acrossNormal * acrossNormal
  ))
  const impulse = clamp(state.impulse, 0, 1)
  const energy = clamp(state.energy, 0, 1)
  const presence = clamp(state.presence, 0, 1)
  const materialStrength = presence * (0.20 + energy * 0.80)
  const ridge = profile * materialStrength

  const flowPx = profile * presence * impulse * 6.5
  const alongTuckPx = -alongNormal * ridge * 1.35
  const acrossTuckPx = -acrossNormal * ridge * 3.4

  return {
    ridge,
    shiftX: directionX * (flowPx + alongTuckPx) + perpendicularX * acrossTuckPx,
    shiftY: directionY * (flowPx + alongTuckPx) + perpendicularY * acrossTuckPx,
    sizeScale: 1 + ridge * (0.055 + energy * 0.045),
    angle: clamp(-(dx / 118) * ridge * 0.05, -0.055, 0.055),
  }
}
