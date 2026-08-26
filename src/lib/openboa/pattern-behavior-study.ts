/**
 * Internal OpenBoa pattern-behavior vocabulary.
 *
 * These studies are methodology references, not page-ready scenes. Production
 * compositions should select and adapt a behavior to the meaning, aperture,
 * and spatial rhythm of the screen instead of copying a lab state directly.
 */

export const retainedPatternBehaviorNames = [
  "Connected Current",
  "Serpentine Ascent",
  "Diagonal Remnant",
  "Relay Wake",
  "Inward Formation",
  "Coiling Vortex",
  "Expanding Void",
  "Compression Breath",
  "Eruption Plume",
  "Fountain Rise",
  "Orbital Globe",
  "Rebound Wave",
  "Cross Tide",
  "Magnetic Poles",
  "Swarm Alignment",
  "Spiral Ingress",
  "Molting Shear",
  "Orbital Rings",
  "Branching Canopy",
  "Gravity Lens",
  "Counterflow Shear",
  "Cellular Propagation",
  "Boundary Reform",
  "Edge Loom",
  "Fracture Healing",
  "Möbius Turn",
  "Island Synthesis",
  "Horizon Unfurl",
  "Lattice Nucleation",
  "Perimeter Circuit",
] as const

export const parkedPatternBehaviorNames = [
  "Braided Bifurcation",
  "Peristaltic Transit",
] as const

const retainedPatternBehaviors = new Set<string>(retainedPatternBehaviorNames)

export function getPatternBehaviorStudyStatus(name: string) {
  return retainedPatternBehaviors.has(name) ? "retained" : "parked"
}
