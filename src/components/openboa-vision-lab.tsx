"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import {
  mountVisionScaleLab,
  type VisionScaleLabState,
} from "@/lib/openboa/vision-scale-lab"
import { getPatternBehaviorStudyStatus } from "@/lib/openboa/pattern-behavior-study"
import styles from "./openboa-vision-lab.module.css"

const modes = [
  {
    name: "Connected Current",
    shortName: "Connected",
    description: "The approved landing surface moves as one continuously connected skin.",
  },
  {
    name: "Serpentine Ascent",
    shortName: "Ascend",
    description: "A continuous body climbs through the field with the muscular rhythm of a moving snake.",
  },
  {
    name: "Diagonal Remnant",
    shortName: "Diagonal",
    description: "The skin gathers along one living diagonal without becoming a separate layer.",
  },
  {
    name: "Relay Wake",
    shortName: "Relay Wake",
    description: "A local signal passes through neighboring rows and leaves a delayed material memory.",
  },
  {
    name: "Inward Formation",
    shortName: "Formation",
    description: "Terracotta scales enter from the edges and interlock into one emerging skin.",
  },
  {
    name: "Braided Bifurcation",
    shortName: "Braid",
    description: "One current divides into interlaced paths, then returns to a shared flow.",
  },
  {
    name: "Coiling Vortex",
    shortName: "Coil",
    description: "The skin coils inward like a snake forming a living spiral around its center.",
  },
  {
    name: "Expanding Void",
    shortName: "Void",
    description: "An off-white cavity grows from within the skin while its boundary remains alive.",
  },
  {
    name: "Compression Breath",
    shortName: "Breath",
    description: "The field compresses and releases as one breathable material body.",
  },
  {
    name: "Eruption Plume",
    shortName: "Eruption",
    description: "A concentrated point surges upward, then escapes outward as a widening plume.",
  },
  {
    name: "Fountain Rise",
    shortName: "Fountain",
    description: "Several currents rise from one source and return through coordinated arcs.",
  },
  {
    name: "Orbital Globe",
    shortName: "Globe",
    description: "The flat skin reads as a rotating sphere through shared orbital motion.",
  },
  {
    name: "Rebound Wave",
    shortName: "Rebound",
    description: "Concentric signals travel outward and return as a soft material rebound.",
  },
  {
    name: "Cross Tide",
    shortName: "Cross Tide",
    description: "A broad wave slowly changes axis from horizontal to vertical and back again.",
  },
  {
    name: "Magnetic Poles",
    shortName: "Poles",
    description: "Two distant centers pull one connected surface into a shared field of force.",
  },
  {
    name: "Swarm Alignment",
    shortName: "Align",
    description: "Many local directions resolve into one emergent collective orientation.",
  },
  {
    name: "Spiral Ingress",
    shortName: "Ingress",
    description: "Terracotta enters from the perimeter through spiral arms and gathers inward.",
  },
  {
    name: "Molting Shear",
    shortName: "Molt",
    description: "A living boundary travels across the skin as one layer sheds and reforms.",
  },
  {
    name: "Orbital Rings",
    shortName: "Rings",
    description: "Several material rings orbit at different speeds without losing surface continuity.",
  },
  {
    name: "Branching Canopy",
    shortName: "Canopy",
    description: "One upward current branches into a distributed crown of coordinated paths.",
  },
  {
    name: "Gravity Lens",
    shortName: "Lens",
    description: "The skin bends around a moving off-white lens and reconnects behind it.",
  },
  {
    name: "Counterflow Shear",
    shortName: "Counterflow",
    description: "Opposing currents pass along one shared seam and exchange momentum.",
  },
  {
    name: "Cellular Propagation",
    shortName: "Cellular",
    description: "Large neighborhoods recruit adjacent scales through a continuous chain reaction.",
  },
  {
    name: "Boundary Reform",
    shortName: "Reform",
    description: "An irregular terracotta boundary dissolves into off-white, then constructs itself again.",
  },
  {
    name: "Peristaltic Transit",
    shortName: "Peristalsis",
    description: "A muscular contraction travels through one continuous body and carries the surface forward.",
  },
  {
    name: "Edge Loom",
    shortName: "Edge Loom",
    description: "Terracotta threads enter from opposing edges and weave an ordered skin over off-white.",
  },
  {
    name: "Fracture Healing",
    shortName: "Healing",
    description: "A living seam opens, then neighboring scales bridge the fracture in a measured sequence.",
  },
  {
    name: "Möbius Turn",
    shortName: "Möbius",
    description: "One current circulates through a figure-eight path that appears to turn through itself.",
  },
  {
    name: "Island Synthesis",
    shortName: "Synthesis",
    description: "Separate material islands grow connective tissue and resolve into one shared surface.",
  },
  {
    name: "Horizon Unfurl",
    shortName: "Unfurl",
    description: "A narrow opening stretches laterally until the skin reveals a wider horizon.",
  },
  {
    name: "Lattice Nucleation",
    shortName: "Nucleation",
    description: "Local points of order recruit the organic field into a coherent overlapping lattice.",
  },
  {
    name: "Perimeter Circuit",
    shortName: "Perimeter",
    description: "The surface enters, circulates, and reforms through one continuous living boundary.",
  },
] as const

const stages = [
  {
    eyebrow: "Imagination → realization",
    title:
      "Humanity is defined not only by what it can understand, but by what it can imagine and realize.",
    behavior: "Latent alignment",
  },
  {
    eyebrow: "Agents",
    title: "Agents are expanding the scope of human creation.",
    behavior: "Distributed propagation",
  },
  {
    eyebrow: "Business of Agents",
    title:
      "OpenBoa explores this new horizon through the Business of Agents.",
    behavior: "Confluence and exchange",
  },
  {
    eyebrow: "Human possibility",
    title: "To expand the horizon of human possibility.",
    behavior: "Open horizon",
  },
] as const

export function OpenBoaVisionLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<VisionScaleLabState>({
    mode: 0,
    stage: 0,
    scroll: 0,
    reading: 0,
  })
  const [mode, setMode] = useState(0)
  const [stage, setStage] = useState(0)
  const [fieldScroll, setFieldScroll] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [view, setView] = useState<"pattern" | "meaning">("pattern")

  useEffect(() => {
    stateRef.current = {
      mode,
      stage,
      scroll: fieldScroll,
      reading: view === "meaning" ? 1 : 0,
    }
  }, [fieldScroll, mode, stage, view])

  useEffect(() => {
    if (!canvasRef.current) return
    return mountVisionScaleLab(canvasRef.current, () => stateRef.current)
  }, [])

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setStage((current) => (current + 1) % stages.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [playing])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setStage((current) => (current + 1) % stages.length)
        setPlaying(false)
      } else if (event.key === "ArrowLeft") {
        setStage((current) => (current - 1 + stages.length) % stages.length)
        setPlaying(false)
      } else if (event.key === "ArrowDown") {
        setMode((current) => (current + 1) % modes.length)
      } else if (event.key === "ArrowUp") {
        setMode((current) => (current - 1 + modes.length) % modes.length)
      } else if (event.key === " ") {
        event.preventDefault()
        setPlaying((current) => !current)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      setFieldScroll((current) => {
        const next = current + event.deltaY * 0.0011
        return Math.max(-1.6, Math.min(1.6, next))
      })
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    return () => window.removeEventListener("wheel", onWheel)
  }, [])

  const selectStage = (nextStage: number) => {
    setStage(nextStage)
    setPlaying(false)
  }

  return (
    <main
      className={styles.lab}
      data-view={view}
    >
      <canvas
        className={styles.canvas}
        ref={canvasRef}
        aria-hidden="true"
      />

      <header className={styles.header}>
        <Link className={styles.brand} href="/vision" aria-label="Back to OpenBoa vision">
          <Image
            src="/openboa-logo-horizontal.png"
            width={320}
            height={79}
            alt="OpenBoa"
            priority
            unoptimized
          />
        </Link>
        <p className={styles.studyLabel}>Pattern behavior study</p>

        <div className={styles.viewSwitch} aria-label="Study view">
          <button
            type="button"
            data-active={view === "pattern"}
            aria-pressed={view === "pattern"}
            onClick={() => setView("pattern")}
          >
            Pattern
          </button>
          <button
            type="button"
            data-active={view === "meaning"}
            aria-pressed={view === "meaning"}
            onClick={() => setView("meaning")}
          >
            Meaning
          </button>
        </div>

        <nav className={styles.modeNav} aria-label="Pattern behavior comparison">
          {modes.map((item, index) => (
            <button
              type="button"
              key={item.name}
              className={styles.modeButton}
              data-active={mode === index}
              data-study-status={getPatternBehaviorStudyStatus(item.name)}
              aria-pressed={mode === index}
              onClick={() => setMode(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.shortName}</strong>
            </button>
          ))}
        </nav>
      </header>

      <div className={styles.copyStack} aria-live="polite">
        {stages.map((item, index) => (
          <section
            className={styles.copy}
            data-active={stage === index}
            aria-hidden={stage !== index}
            key={item.behavior}
          >
            <p className={styles.eyebrow}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.eyebrow}
            </p>
            {index === 0 ? <h1>{item.title}</h1> : <h2>{item.title}</h2>}
            <p className={styles.behavior}>{item.behavior}</p>
          </section>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.stageControls} aria-label="Meaning states">
          {stages.map((item, index) => (
            <button
              type="button"
              key={item.behavior}
              className={styles.stageButton}
              data-active={stage === index}
              aria-label={`Show ${item.eyebrow}`}
              aria-pressed={stage === index}
              onClick={() => selectStage(index)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <i />
            </button>
          ))}
        </div>

        <button
          className={styles.playButton}
          type="button"
          aria-pressed={playing}
          onClick={() => setPlaying((current) => !current)}
        >
          {playing ? "Pause" : "Play"}
        </button>

        <div className={styles.modeDescription}>
          <strong>{modes[mode].name}</strong>
          <span>{modes[mode].description}</span>
        </div>

        <p className={styles.interactionHint}>Scroll · move cursor</p>
      </footer>
    </main>
  )
}
