"use client"

import { type CSSProperties, useEffect, useRef, useState } from "react"
import { useOpenBoaExperience } from "./openboa-experience-context"

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export type StoryMotion =
  | "alignment"
  | "relay"
  | "synthesis"
  | "horizon"
  | "formation"
  | "orbit"
  | "loom"

export function useOpenBoaStory(sceneCount: number) {
  const rootRef = useRef<HTMLElement>(null)
  const frameRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const { setStoryProgress } = useOpenBoaExperience()

  useEffect(() => {
    const update = () => {
      frameRef.current = 0
      if (!rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      const range = Math.max(1, rootRef.current.scrollHeight - window.innerHeight)
      const normalized = clamp01(-rect.top / range)
      const nextProgress = normalized * Math.max(0, sceneCount - 1)
      setProgress(nextProgress)
      setStoryProgress(nextProgress)
    }
    const schedule = () => {
      if (frameRef.current) return
      frameRef.current = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule, { passive: true })
    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      cancelAnimationFrame(frameRef.current)
      setStoryProgress(0)
    }
  }, [sceneCount, setStoryProgress])

  return { rootRef, progress }
}

export function storySceneStyle(
  progress: number,
  index: number,
  sceneCount: number,
) {
  const begins = index === 0 ? -1 : index - 0.46
  const ends = index === sceneCount - 1 ? sceneCount : index + 0.4
  const visible = progress >= begins && progress <= ends
  return {
    visibility: visible ? "visible" : "hidden",
    pointerEvents: Math.abs(progress - index) < 0.34 ? "auto" : "none",
  } as const
}

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const phase = clamp01((value - edge0) / Math.max(0.001, edge1 - edge0))
  return phase * phase * (3 - 2 * phase)
}

function storyMotionVector(
  motion: StoryMotion,
  itemIndex: number,
  itemCount: number,
) {
  const ratio = itemCount <= 1 ? 0.5 : itemIndex / (itemCount - 1)
  const alternating = itemIndex % 2 === 0 ? -1 : 1

  if (motion === "alignment") {
    return {
      enterX: (ratio - 0.5) * 28,
      enterY: 12,
      exitX: (0.5 - ratio) * 18,
      exitY: -14,
    }
  }
  if (motion === "relay") {
    return { enterX: -28, enterY: 0, exitX: 24, exitY: 0 }
  }
  if (motion === "synthesis") {
    return {
      enterX: alternating * 30,
      enterY: (0.5 - ratio) * 12,
      exitX: alternating * -18,
      exitY: 0,
    }
  }
  if (motion === "horizon") {
    return {
      enterX: (0.5 - ratio) * 36,
      enterY: 10,
      exitX: (ratio - 0.5) * 24,
      exitY: -8,
    }
  }
  if (motion === "formation") {
    return { enterX: 0, enterY: 22, exitX: 0, exitY: -16 }
  }
  if (motion === "orbit") {
    return {
      enterX: 20,
      enterY: (ratio - 0.5) * 18,
      exitX: -18,
      exitY: (0.5 - ratio) * 14,
    }
  }
  return {
    enterX: alternating * 26,
    enterY: 8,
    exitX: alternating * -20,
    exitY: -8,
  }
}

export function storyItemStyle(
  progress: number,
  index: number,
  sceneCount: number,
  itemIndex: number,
  itemCount: number,
  motion: StoryMotion,
): CSSProperties {
  const ratio = itemCount <= 1 ? 0 : itemIndex / (itemCount - 1)
  const enterOffset = ratio * 0.20
  const exitOffset = (1 - ratio) * 0.20
  const enter = index === 0
    ? 1
    : smoothstep(index - 0.54 + enterOffset, index - 0.40 + enterOffset, progress)
  const exit = index === sceneCount - 1
    ? 1
    : 1 - smoothstep(index + 0.08 + exitOffset, index + 0.22 + exitOffset, progress)
  const opacity = clamp01(enter * exit)
  const vector = storyMotionVector(motion, itemIndex, itemCount)
  const translateX = vector.enterX * (1 - enter) + vector.exitX * (1 - exit)
  const translateY = vector.enterY * (1 - enter) + vector.exitY * (1 - exit)
  const scale = 0.992 + enter * 0.008 + (1 - exit) * 0.004

  return {
    opacity,
    transform: `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
    visibility: opacity <= 0.002 ? "hidden" : "visible",
  }
}
