# OpenBoa.ai Design QA

## Visual & Motion Calibration

- **Brand System**: `@openboa/yogurt@0.2.0-local.1` (`slate.700` `#175174` light / `slate.300` `#79B3D6` dark, neutral paper/obsidian surfaces, Upright 9 mark, self-hosted variable `Rethink Sans`).
- **Default Polarity**: Light (`#F7F8FA` stage / `#FFFFFF` & `#F4F4F1` Yogurt neutral tokens) with interactive Dark toggle (`#04060A` stage / `#0A0A0D` & `#131317` Yogurt neutral tokens).
- **Persistent 3D Stage (`src/components/openboa-swarm-stage.tsx`)**:
  - Layer 1: `14,000` instanced 36-point simplified 3D `Upright 9` micro-symbols (`norm = 0.045`).
  - Layer 2: `32,000` luminous field sparks (`46,000` total units).
  - Topologies:
    - `/` Act 01 (`Threshold`): Full-bleed hyperbolic Möbius wave (`cw`/`ccw` persistent scroll orbit).
    - `/` Act 02 (`Fracture`) & `/vision`: Right-anchored meridian sphere + equatorial ring.
    - `/` Act 03 (`Horizon`): Open concentric orbital canopy.
    - `/approach`: Right-anchored receding rectilinear architectural wall-planes with an open breached portal corridor, kinetic Z-axis light rails, and synchronized 3D wireframe frames (`DEPTH ↗` / `DEPTH ↙` infinite Z-glide).
- **Typography Scale**:
  - Desktop (`1440x900`): Act 01 `H1 = ~135px`, lead `~26px`.
  - Mobile (`390x844`): Act 01 `H1 = ~50px`, lead `~18px`, `0px` horizontal overflow.
- **Interactions**:
  - Cursor vortex/shear across all routes.
  - Whisper-quiet `Hold anywhere` cue (`18px` hairline reticle, zero box chrome at rest) plus anywhere-press harmonic implosion (`--boa-charge` `0 -> 1`) and release shockwave burst.
  - Strictly silent (zero audio).

## Accessibility & Resilience

- `prefers-reduced-motion: reduce` disables continuous orbital/tunnel motion, GSAP split reveals, and Lenis smoothing.
- `webglcontextlost` / `webglcontextrestored` and WebGL-unavailable initialization fall back cleanly to CSS stage surfaces without blocking navigation or copy.
- Decorative WebGL stage and corner reticles set `aria-hidden="true"` and `data-agent-hidden=""`.
