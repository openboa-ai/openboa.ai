"use client"

import Link, { type LinkProps } from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  createContext,
  type MouseEvent,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

export type OpenBoaScene = "landing" | "vision" | "about"
export type TransitionPhase = "ready" | "exiting" | "entering"

export interface OpenBoaExperienceState {
  scene: OpenBoaScene
  storyProgress: number
}

interface ExperienceContextValue {
  scene: OpenBoaScene
  phase: TransitionPhase
  navigate: (href: string) => void
  setStoryProgress: (progress: number) => void
  getExperienceState: () => OpenBoaExperienceState
}

const ExperienceContext = createContext<ExperienceContextValue | null>(null)

const pathToScene = (pathname: string): OpenBoaScene => {
  if (pathname.startsWith("/vision")) return "vision"
  if (pathname.startsWith("/about")) return "about"
  return "landing"
}

interface ExperienceProviderProps extends PropsWithChildren {
  onSceneChange?: (scene: OpenBoaScene) => void
}

export function OpenBoaExperienceProvider({
  children,
  onSceneChange,
}: ExperienceProviderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const initialScene = pathToScene(pathname)
  const [scene, setScene] = useState<OpenBoaScene>(initialScene)
  const [phase, setPhase] = useState<TransitionPhase>("entering")
  const sceneRef = useRef<OpenBoaScene>(initialScene)
  const storyProgressRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const setVisualScene = useCallback((nextScene: OpenBoaScene) => {
    sceneRef.current = nextScene
    storyProgressRef.current = 0
    setScene(nextScene)
    onSceneChange?.(nextScene)
  }, [onSceneChange])

  const finishEntering = useCallback(() => {
    const timer = setTimeout(() => setPhase("ready"), 720)
    timersRef.current.push(timer)
  }, [])

  useEffect(() => {
    finishEntering()
    return clearTimers
  }, [clearTimers, finishEntering])

  useEffect(() => {
    const routeScene = pathToScene(pathname)
    if (routeScene === sceneRef.current) return
    const frame = requestAnimationFrame(() => {
      clearTimers()
      setPhase("entering")
      setVisualScene(routeScene)
      finishEntering()
      window.scrollTo({ top: 0, behavior: "auto" })
    })
    return () => cancelAnimationFrame(frame)
  }, [clearTimers, finishEntering, pathname, setVisualScene])

  const navigate = useCallback((href: string) => {
    const nextScene = pathToScene(href)
    if (nextScene === sceneRef.current && pathname === href) return
    clearTimers()
    setPhase("exiting")
    const leaveTimer = setTimeout(() => {
      setVisualScene(nextScene)
      setPhase("entering")
      router.push(href)
      window.scrollTo({ top: 0, behavior: "auto" })
      finishEntering()
    }, 240)
    timersRef.current.push(leaveTimer)
  }, [clearTimers, finishEntering, pathname, router, setVisualScene])

  const setStoryProgress = useCallback((progress: number) => {
    if (!Number.isFinite(progress)) return
    storyProgressRef.current = Math.max(0, progress)
  }, [])

  const getExperienceState = useCallback(() => ({
    scene: sceneRef.current,
    storyProgress: storyProgressRef.current,
  }), [])

  const value = useMemo<ExperienceContextValue>(() => ({
    scene,
    phase,
    navigate,
    setStoryProgress,
    getExperienceState,
  }), [getExperienceState, navigate, phase, scene, setStoryProgress])

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  )
}

export function useOpenBoaExperience() {
  const context = useContext(ExperienceContext)
  if (!context) {
    throw new Error("OpenBoa experience context is unavailable.")
  }
  return context
}

interface ExperienceLinkProps extends LinkProps, PropsWithChildren {
  className?: string
  "aria-label"?: string
  "aria-current"?: "page"
}

export function ExperienceLink({
  href,
  children,
  ...props
}: ExperienceLinkProps) {
  const { navigate } = useOpenBoaExperience()
  const hrefString = typeof href === "string" ? href : href.pathname ?? "/"

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented
      || event.button !== 0
      || event.metaKey
      || event.ctrlKey
      || event.shiftKey
      || event.altKey
      || !hrefString.startsWith("/")
    ) return
    event.preventDefault()
    navigate(hrefString)
  }

  return (
    <Link href={href} onClick={onClick} {...props}>
      {children}
    </Link>
  )
}
