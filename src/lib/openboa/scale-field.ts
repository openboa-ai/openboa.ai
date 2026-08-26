import {
  advanceDropdownAperture,
  advanceDropdownColorMix,
  sampleDropdownAperture,
  sampleDropdownTextOpacity,
  shouldKeepDropdownOpen,
  type DropdownApertureGeometry,
} from "./dropdown-aperture"
import {
  QUIET_APERTURE,
  attenuateScaleMotion,
  headerApertureRegions,
  mergeQuietApertures,
  sampleHeaderAperture,
  sampleLocalAperture,
  sampleQuietAperture,
  type ApertureBounds,
} from "./quiet-aperture"
import {
  UnderSkinCurrent,
  sampleUnderSkinCurrent,
  type UnderSkinState,
} from "./under-skin-current"
import {
  sampleAboutAperture,
  sampleVisionAperture,
  sceneMixTarget,
  type StoryApertureGeometry,
} from "./experience-aperture"

type ScaleFieldScene = "landing" | "vision" | "about"

interface ScaleFieldExperienceState {
  scene: ScaleFieldScene
  storyProgress: number
}

interface ScaleFieldElements {
  root: HTMLElement
  canvas: HTMLCanvasElement
  quietField: HTMLElement
  brandLogo: HTMLImageElement
  siteNav: HTMLElement
  projectsMenu: HTMLDetailsElement
  projectsSummary: HTMLElement
  projectsLabel: HTMLElement
  projectsPopover: HTMLElement
  siteFootnote: HTMLElement
  siteSocial: HTMLElement
  contentRoot: HTMLElement
  getExperienceState: () => ScaleFieldExperienceState
}

const EMPTY_BOUNDS: ApertureBounds = { left: 0, top: 0, right: 1, bottom: 1 }
// The living-scale field is an art-directed image layer, not a semantic UI
// surface. Keep the approved v33 background calibration independent from the
// design-token palette so its continuous depth and tonal flow do not quantize.
const APPROVED_BACKGROUND_PAPER = new Float32Array([0.9725, 0.9725, 0.9608])

function unionTextBounds(elements: Element[], fallback: Element): ApertureBounds {
  const rects: DOMRect[] = []
  elements.forEach((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    for (const rect of range.getClientRects()) {
      if (rect.width > 0 && rect.height > 0) rects.push(rect)
    }
  })

  if (rects.length === 0) rects.push(fallback.getBoundingClientRect())
  return {
    left: Math.min(...rects.map((rect) => rect.left)),
    top: Math.min(...rects.map((rect) => rect.top)),
    right: Math.max(...rects.map((rect) => rect.right)),
    bottom: Math.max(...rects.map((rect) => rect.bottom)),
  }
}

function textFragmentBounds(elements: Element[]) {
  const fragments: ApertureBounds[] = []
  elements.forEach((element) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    for (const rect of range.getClientRects()) {
      if (rect.width <= 0 || rect.height <= 0) continue
      fragments.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      })
    }
  })
  return fragments
}

function requireValue<T>(value: T | null, label: string): T {
  if (value === null) throw new Error(`Unable to create WebGL ${label}.`)
  return value
}

export function mountScaleField(elements: ScaleFieldElements) {
  const {
    root,
    canvas,
    quietField,
    brandLogo,
    siteNav,
    projectsMenu,
    projectsSummary,
    projectsLabel,
    projectsPopover,
    siteFootnote,
    siteSocial,
    contentRoot,
    getExperienceState,
  } = elements
  const projectsLinks = [...projectsPopover.querySelectorAll<HTMLElement>("a")]
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
  let reducedMotion = reducedMotionQuery.matches
  let disposed = false
  let projectsMenuPinned = false
  let dropdownTargetOpen = false
  let suppressNextMenuFocusOpen = false
  let dropdownApertureProgress = 0
  let dropdownColorProgress = 0
  let previousRenderTime: number | null = null
  let animationFrame = 0
  const initialExperience = getExperienceState()
  const initialMix = sceneMixTarget(initialExperience.scene)
  let landingMix = initialMix.landing
  let visionMix = initialMix.vision
  let aboutMix = initialMix.about
  let storyProgress = initialExperience.storyProgress
  let dropdownLayout: DropdownApertureGeometry = {
    centerX: 0,
    topY: 44,
    bottomY: 160,
    halfWidth: 88,
    featherX: 64,
    featherY: 68,
  }

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  })

  if (!gl) {
    canvas.dataset.fieldState = "unsupported"
    return () => undefined
  }

  const syncDropdownBoundary = () => {
    const quietBounds = quietField.getBoundingClientRect()
    const labelBounds = projectsLabel.getBoundingClientRect()
    const navBounds = siteNav.getBoundingClientRect()
    const popoverBounds = projectsPopover.getBoundingClientRect()
    const popoverHeight = Math.max(projectsPopover.scrollHeight, popoverBounds.height)
    const popoverWidth = Math.max(1, popoverBounds.width)

    dropdownLayout = {
      centerX: (labelBounds.left + labelBounds.right) / 2 - quietBounds.left,
      topY: navBounds.bottom - quietBounds.top - 8,
      bottomY: Math.max(
        navBounds.bottom - quietBounds.top + 1,
        popoverBounds.top - quietBounds.top + popoverHeight + 12,
      ),
      halfWidth: Math.max(54, popoverWidth * 0.5),
      featherX: Math.min(72, Math.max(54, popoverWidth * 0.36)),
      featherY: Math.min(82, Math.max(64, popoverHeight * 0.9)),
    }
  }

  const setDropdownTarget = (targetOpen: boolean) => {
    dropdownTargetOpen = targetOpen
    if (dropdownTargetOpen) projectsMenu.open = true
  }
  const onMenuPointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    setDropdownTarget(true)
  }
  const onMenuPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return
    if (
      event.relatedTarget instanceof Node
      && projectsMenu.contains(event.relatedTarget)
    ) return
    if (!projectsMenuPinned) setDropdownTarget(false)
  }
  const onMenuFocusIn = () => {
    if (suppressNextMenuFocusOpen) {
      suppressNextMenuFocusOpen = false
      return
    }
    setDropdownTarget(true)
  }
  const onMenuFocusOut = (event: FocusEvent) => {
    if (
      !projectsMenuPinned
      && (!(event.relatedTarget instanceof Node)
        || !projectsMenu.contains(event.relatedTarget))
    ) setDropdownTarget(false)
  }
  const onSummaryClick = (event: MouseEvent) => {
    event.preventDefault()
    projectsMenuPinned = !projectsMenuPinned
    setDropdownTarget(projectsMenuPinned)
  }
  const onDocumentPointerDown = (event: PointerEvent) => {
    if (
      dropdownTargetOpen
      && (!(event.target instanceof Node) || !projectsMenu.contains(event.target))
    ) {
      projectsMenuPinned = false
      setDropdownTarget(false)
    }
  }
  const onMenuKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return
    event.preventDefault()
    projectsMenuPinned = false
    setDropdownTarget(false)
    if (document.activeElement !== projectsSummary) {
      suppressNextMenuFocusOpen = true
      projectsSummary.focus({ preventScroll: true })
      suppressNextMenuFocusOpen = false
    }
  }

  projectsMenu.addEventListener("pointerenter", onMenuPointerEnter)
  projectsMenu.addEventListener("pointerleave", onMenuPointerLeave)
  projectsMenu.addEventListener("focusin", onMenuFocusIn)
  projectsMenu.addEventListener("focusout", onMenuFocusOut)
  projectsSummary.addEventListener("click", onSummaryClick)
  projectsMenu.addEventListener("keydown", onMenuKeyDown)
  document.addEventListener("pointerdown", onDocumentPointerDown)

  const resizeObserver = new ResizeObserver(syncDropdownBoundary)
  resizeObserver.observe(projectsPopover)
  const mutationObserver = new MutationObserver(syncDropdownBoundary)
  mutationObserver.observe(projectsPopover, { childList: true, subtree: true })
  syncDropdownBoundary()

  const current = new UnderSkinCurrent({ decayMs: 220, leaveDecayMs: 180 })
  let cssWidth = 0
  let cssHeight = 0
  let dpr = 1
  let pointCount = 0
  let basePositions = new Float32Array()
  let centralQuietData = new Float32Array()
  let quietData = new Float32Array()
  let navApertureData = new Float32Array()
  let interactionData = new Float32Array()
  let quietBounds = EMPTY_BOUNDS
  let headerRegions: ApertureBounds[] = []
  let footnoteBounds = EMPTY_BOUNDS
  let socialBounds = EMPTY_BOUNDS
  let visionApertureBounds: StoryApertureGeometry[] = []
  let aboutApertureBounds: StoryApertureGeometry[] = []
  let latestMotionState = current.frame(performance.now())

  const vertexSource = `
    precision highp float;

    attribute vec2 a_position;
    attribute float a_phase;
    attribute float a_weight;
    attribute float a_quiet;
    attribute float a_nav_aperture;
    attribute vec4 a_interaction;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_dpr;
    uniform float u_reduced;
    uniform float u_motion_floor;
    uniform highp float u_vision_mix;
    uniform highp float u_about_mix;
    uniform float u_story_progress;

    varying float v_tone;
    varying float v_angle;
    varying float v_quiet;
    varying float v_nav_aperture;

    float softBand(float value, float center, float width) {
      float distance = abs(value - center) / max(width, 0.0001);
      return exp(-distance * distance * 2.2);
    }

    float sceneWeight(float progress, float index) {
      return 1.0 - smoothstep(0.0, 1.0, abs(progress - index));
    }

    void main() {
      vec2 position = a_position;
      vec2 uv = a_position / u_resolution;
      float t = u_time * (1.0 - u_reduced);
      float broadA = sin(position.y * 0.013 + t * 0.32 + sin(position.x * 0.004 - t * 0.13) * 2.2);
      float broadB = cos(position.x * 0.009 - t * 0.24 + sin(position.y * 0.006 + t * 0.18) * 1.8);
      float micro = sin(a_phase + t * 0.55);
      float ambientMotion = mix(1.0, u_motion_floor, a_quiet);

      position.x += (broadA * 6.5 + broadB * 2.2) * ambientMotion;
      position.y += (broadB * 5.0 + micro * 1.4) * ambientMotion;
      float visibleMaterial = 1.0 - a_quiet * 0.84;
      float internalSceneMix = max(u_vision_mix, u_about_mix);
      float apertureQuiet = max(a_quiet, a_nav_aperture);
      float apertureScale = mix(
        1.0,
        1.0 - smoothstep(0.08, 0.96, apertureQuiet) * 0.08,
        internalSceneMix
      );

      float w0 = sceneWeight(u_story_progress, 0.0);
      float w1 = sceneWeight(u_story_progress, 1.0);
      float w2 = sceneWeight(u_story_progress, 2.0);
      float w3 = sceneWeight(u_story_progress, 3.0);
      float weightTotal = max(0.0001, w0 + w1 + w2 + w3);
      w0 /= weightTotal;
      w1 /= weightTotal;
      w2 /= weightTotal;
      w3 /= weightTotal;

      float alignmentOrder = smoothstep(
        0.18,
        0.84,
        uv.x + sin(uv.y * 8.0 + t * 0.18) * 0.055
      );
      vec2 latentFlow = vec2(
        sin(uv.x * 9.0 + uv.y * 7.0 + t * 0.43 + sin(uv.y * 5.0)),
        cos(uv.y * 8.0 - uv.x * 5.0 - t * 0.37 + sin(uv.x * 4.0))
      ) * 7.0;
      vec2 orderedFlow = vec2(
        sin(uv.y * 9.0 + t * 0.42) * 7.4,
        cos(uv.x * 4.2 - t * 0.25) * 2.6
      );
      vec2 alignmentFlow = mix(latentFlow, orderedFlow, alignmentOrder);
      float alignmentAngle = mix(
        sin(uv.x * 8.0 + uv.y * 6.0 + t * 0.41) * 0.18,
        cos(uv.y * 7.0 + t * 0.33) * 0.10,
        alignmentOrder
      );

      vec2 relayDelta = uv - vec2(0.18, 0.57);
      float relayDistance = length(relayDelta * vec2(1.0, 1.18));
      float relayWave = sin(
        relayDistance * 34.0 - t * 2.05 - a_phase * 0.16
      ) * exp(-relayDistance * 1.38);
      vec2 relayNormal = normalize(relayDelta + vec2(0.001));
      vec2 relayFlow = relayNormal * relayWave * 14.0
        + vec2(4.2, -1.6) * smoothstep(-0.15, 0.9, relayWave);
      float relayAngle = atan(relayNormal.y, relayNormal.x) * 0.13
        + relayWave * 0.14;

      float upperCurve = 0.31 + sin(uv.x * 4.6 + t * 0.23) * 0.052;
      float lowerCurve = 0.71 + cos(uv.x * 4.1 - t * 0.19) * 0.058;
      float upperStream = softBand(uv.y, upperCurve, 0.15);
      float lowerStream = softBand(uv.y, lowerCurve, 0.16);
      float confluenceReach = smoothstep(0.18, 0.69, uv.x)
        * (1.0 - smoothstep(0.72, 1.03, uv.x));
      float confluenceExchange = sin(uv.x * 8.4 - t * 0.74 + a_phase);
      vec2 confluenceFlow = vec2(
        (upperStream + lowerStream) * (6.5 + confluenceExchange * 2.4),
        upperStream * confluenceReach * 22.0
          - lowerStream * confluenceReach * 22.0
          + confluenceExchange * (upperStream + lowerStream) * 3.2
      );
      float confluenceAngle = (upperStream - lowerStream) * confluenceReach * 0.20
        + confluenceExchange * (upperStream + lowerStream) * 0.07;

      float horizonCenter = 0.505
        + sin(uv.x * 6.2 - t * 0.16) * 0.018
        + sin(uv.x * 13.0 + t * 0.09) * 0.007;
      float horizonDistance = abs(uv.y - horizonCenter);
      float horizonPressure = 1.0 - smoothstep(0.18, 0.46, horizonDistance);
      float horizonSide = uv.y < horizonCenter ? -1.0 : 1.0;
      vec2 horizonFlow = vec2(
        (uv.x - 0.5) * horizonPressure * 6.0,
        horizonSide * horizonPressure * (17.0 + 18.0 * uv.x)
      );
      float horizonAngle = horizonSide * horizonPressure * 0.16;

      vec2 visionFlow = alignmentFlow * w0
        + relayFlow * w1
        + confluenceFlow * w2
        + horizonFlow * w3;
      float visionAngle = alignmentAngle * w0
        + relayAngle * w1
        + confluenceAngle * w2
        + horizonAngle * w3;

      vec2 formationCenter = vec2(0.59, 0.50);
      vec2 formationDirection = normalize(formationCenter - uv + vec2(0.001));
      float formationEdge = max(
        smoothstep(0.28, 0.62, abs(uv.x - 0.5)),
        smoothstep(0.30, 0.55, abs(uv.y - 0.5)) * 0.72
      );
      float formationPulse = 0.72 + sin((uv.x + uv.y) * 9.0 - t * 0.42) * 0.28;
      vec2 formationFlow = formationDirection
        * formationEdge * formationPulse * 11.0;
      float formationAngle = formationDirection.y * formationEdge * 0.11;

      float narrowViewport = 1.0 - smoothstep(768.0, 769.0, u_resolution.x);
      vec2 coilCenter = mix(
        vec2(0.27, 0.50),
        vec2(0.50, 0.30),
        narrowViewport
      );
      vec2 coilDelta = (uv - coilCenter) * vec2(1.0, 1.16);
      float coilRadius = length(coilDelta);
      float coilTheta = atan(coilDelta.y, coilDelta.x);
      float coilBody = 1.0 - smoothstep(0.10, 0.52, coilRadius);
      float coilBand = 0.5 + 0.5 * sin(
        coilRadius * 30.0 - coilTheta * 2.0 - t * 0.66
      );
      vec2 coilNormal = normalize(coilDelta + vec2(0.001));
      vec2 coilTangent = vec2(-coilNormal.y, coilNormal.x);
      float coilFlowStrength = mix(1.0, 0.48, narrowViewport);
      vec2 coilFlow = (
        coilTangent * (10.0 + coilBand * 8.0) * coilBody
        - coilNormal * (3.5 + coilBand * 2.0) * coilBody
      ) * coilFlowStrength;
      float coilAngle = coilBody * (0.08 + coilBand * 0.12);

      float loomUpperCenter = 0.18 + uv.x * 0.34
        + sin(uv.x * 8.0 - t * 0.30) * 0.035;
      float loomLowerCenter = 0.82 - uv.x * 0.27
        + sin(uv.x * 7.0 + t * 0.27) * 0.038;
      float loomUpper = softBand(uv.y, loomUpperCenter, 0.14);
      float loomLower = softBand(uv.y, loomLowerCenter, 0.14);
      float loomInterlock = softBand(
        uv.y,
        0.50 + sin(uv.x * 10.0 - t * 0.36) * 0.105,
        0.12
      ) * smoothstep(0.42, 0.74, uv.x);
      vec2 loomFlow = vec2(
        (loomUpper + loomLower + loomInterlock) * 8.0,
        (loomUpper - loomLower) * 11.0
          + sin(uv.x * 11.0 - t * 0.58) * loomInterlock * 7.0
      );
      float loomAngle = (loomUpper - loomLower) * 0.10
        + loomInterlock * sin(uv.x * 9.0 - t * 0.40) * 0.08;

      vec2 aboutFlow = formationFlow * w0
        + coilFlow * w1
        + loomFlow * w2;
      float aboutAngle = formationAngle * w0
        + coilAngle * w1
        + loomAngle * w2;

      position += visionFlow * u_vision_mix * visibleMaterial * (1.0 - u_reduced);
      position += aboutFlow * u_about_mix * visibleMaterial * (1.0 - u_reduced);
      position += a_interaction.xy;

      vec2 clip = (position / u_resolution) * 2.0 - 1.0;
      clip.y *= -1.0;
      gl_Position = vec4(clip, 0.0, 1.0);

      float ambientScale = 1.0 + (micro * 0.10 + broadA * 0.045) * ambientMotion;
      float visionScale = 1.0 + abs(relayWave) * w1 * 0.038
        + horizonPressure * w3 * 0.024;
      float aboutScale = 1.0 + coilBand * coilBody * w1 * 0.032
        + loomInterlock * w2 * 0.028;
      float behaviorScale = mix(1.0, visionScale, u_vision_mix)
        * mix(1.0, aboutScale, u_about_mix);
      gl_PointSize = (38.0 + a_weight * 8.0)
        * ambientScale * behaviorScale * a_interaction.z * u_dpr
        * apertureScale;
      v_angle = (broadA * 0.13 + broadB * 0.08) * ambientMotion
        + visionAngle * u_vision_mix
        + aboutAngle * u_about_mix
        + a_interaction.w;
      float scenePhase = u_story_progress * 1.72
        * (u_vision_mix + u_about_mix * 0.66);
      float macroDensity = 0.5 + 0.5 * sin(position.x * 0.010 + sin(position.y * 0.008 + t * 0.16 + scenePhase) * 2.4);
      float crossDensity = 0.5 + 0.5 * cos(position.y * 0.014 - t * 0.14 + a_phase * 0.35 - scenePhase * 0.72);
      v_tone = 0.08 + macroDensity * 0.20 + crossDensity * 0.07 + a_weight * 0.04;
      v_quiet = a_quiet;
      v_nav_aperture = a_nav_aperture;
    }
  `

  const fragmentSource = `
    precision mediump float;

    uniform sampler2D u_texture;
    uniform vec3 u_paper_color;
    uniform float u_quiet_color_mix;
    uniform highp float u_vision_mix;
    uniform highp float u_about_mix;
    varying float v_tone;
    varying float v_angle;
    varying float v_quiet;
    varying float v_nav_aperture;

    void main() {
      vec2 centered = gl_PointCoord - vec2(0.5);
      float c = cos(v_angle);
      float s = sin(v_angle);
      vec2 uv = mat2(c, -s, s, c) * centered + vec2(0.5);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

      float fillAlpha = texture2D(u_texture, uv).a;
      if (fillAlpha <= 0.002) discard;

      vec3 terracotta100 = vec3(0.9529, 0.8510, 0.8235);
      vec3 terracotta500 = vec3(0.6510, 0.3098, 0.2353);
      float tone = smoothstep(0.09, 0.36, v_tone);
      vec3 scaleColor = mix(terracotta100, terracotta500, tone);
      float internalSceneMix = max(u_vision_mix, u_about_mix);
      float landingPaperMix = v_quiet * u_quiet_color_mix;
      float scenePaperMix = landingPaperMix * (1.0 - internalSceneMix);
      float landingNavPaperMix = v_nav_aperture * (1.0 - internalSceneMix);
      float paperMix = max(scenePaperMix, landingNavPaperMix);
      scaleColor = mix(scaleColor, u_paper_color, paperMix);
      float internalQuiet = max(v_quiet, v_nav_aperture);
      float warmBridge = smoothstep(0.02, 0.66, internalQuiet);
      float offWhiteMerge = smoothstep(0.16, 0.84, internalQuiet);
      vec3 internalColor = mix(scaleColor, terracotta100, warmBridge * 0.72);
      internalColor = mix(internalColor, u_paper_color, offWhiteMerge);
      scaleColor = mix(scaleColor, internalColor, internalSceneMix);
      float internalFillAlpha = smoothstep(0.03, 0.18, fillAlpha);
      float finalFillAlpha = mix(fillAlpha, internalFillAlpha, internalSceneMix);
      gl_FragColor = vec4(scaleColor, finalFillAlpha);
    }
  `

  const compile = (type: number, source: string) => {
    const shader = requireValue(gl.createShader(type), "shader")
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error"
      gl.deleteShader(shader)
      throw new Error(message)
    }
    return shader
  }

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource)
  const program = requireValue(gl.createProgram(), "program")
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Unknown WebGL link error")
  }
  gl.useProgram(program)

  const positionBuffer = requireValue(gl.createBuffer(), "position buffer")
  const phaseBuffer = requireValue(gl.createBuffer(), "phase buffer")
  const weightBuffer = requireValue(gl.createBuffer(), "weight buffer")
  const quietBuffer = requireValue(gl.createBuffer(), "quiet buffer")
  const navApertureBuffer = requireValue(gl.createBuffer(), "navigation buffer")
  const interactionBuffer = requireValue(gl.createBuffer(), "interaction buffer")

  const attribute = (name: string) => {
    const location = gl.getAttribLocation(program, name)
    if (location < 0) throw new Error(`Missing WebGL attribute: ${name}`)
    return location
  }
  const uniform = (name: string) => (
    requireValue(gl.getUniformLocation(program, name), `uniform ${name}`)
  )
  const positionLocation = attribute("a_position")
  const phaseLocation = attribute("a_phase")
  const weightLocation = attribute("a_weight")
  const quietLocation = attribute("a_quiet")
  const navApertureLocation = attribute("a_nav_aperture")
  const interactionLocation = attribute("a_interaction")
  const resolutionLocation = uniform("u_resolution")
  const timeLocation = uniform("u_time")
  const dprLocation = uniform("u_dpr")
  const reducedLocation = uniform("u_reduced")
  const motionFloorLocation = uniform("u_motion_floor")
  const visionMixLocation = uniform("u_vision_mix")
  const aboutMixLocation = uniform("u_about_mix")
  const storyProgressLocation = uniform("u_story_progress")
  const paperColorLocation = uniform("u_paper_color")
  const quietColorMixLocation = uniform("u_quiet_color_mix")

  const seeded = (row: number, column: number) => {
    const value = Math.sin((row + 47) * 61.71 + (column + 29) * 37.19)
      * 43758.5453
    return value - Math.floor(value)
  }

  const resolveLandingBounds = () => {
    const targets = [
      ...contentRoot.querySelectorAll<HTMLElement>("[data-landing-aperture]"),
    ]
    if (targets.length === 0) return quietBounds
    return unionTextBounds(targets, contentRoot)
  }

  const syncLandingAperture = () => {
    quietBounds = resolveLandingBounds()
    if (pointCount === 0 || centralQuietData.length !== pointCount) return
    for (let index = 0; index < pointCount; index += 1) {
      centralQuietData[index] = sampleQuietAperture(
        basePositions[index * 2],
        basePositions[index * 2 + 1],
        quietBounds,
        cssWidth,
      )
    }
  }

  const measureStoryTarget = (target: HTMLElement) => {
    const animatedItems = [
      ...target.querySelectorAll<HTMLElement>(".story-copy-item"),
    ]
    const previousTransforms = animatedItems.map((item) => item.style.transform)
    animatedItems.forEach((item) => {
      item.style.transform = "none"
    })

    const copyElements = [
      ...target.querySelectorAll<HTMLElement>("[data-aperture-copy]"),
    ]
    const measuredElements = copyElements.length > 0 ? copyElements : [target]
    const fragments = textFragmentBounds(measuredElements)
    const bounds = fragments.length > 0
      ? {
        left: Math.min(...fragments.map((fragment) => fragment.left)),
        top: Math.min(...fragments.map((fragment) => fragment.top)),
        right: Math.max(...fragments.map((fragment) => fragment.right)),
        bottom: Math.max(...fragments.map((fragment) => fragment.bottom)),
      }
      : target.getBoundingClientRect()

    animatedItems.forEach((item, index) => {
      item.style.transform = previousTransforms[index]
    })
    return { bounds, fragments }
  }

  const syncStoryApertures = () => {
    const visionTargets = [
      ...contentRoot.querySelectorAll<HTMLElement>(
        ".vision-page [data-aperture-target]",
      ),
    ]
    const aboutTargets = [
      ...contentRoot.querySelectorAll<HTMLElement>(
        ".about-page [data-aperture-target]",
      ),
    ]
    // Retain the previous route's bounds during the material crossfade.
    if (visionTargets.length > 0) {
      visionApertureBounds = visionTargets.map(measureStoryTarget)
    }
    if (aboutTargets.length > 0) {
      aboutApertureBounds = aboutTargets.map(measureStoryTarget)
    }
  }

  const uploadAttribute = (
    buffer: WebGLBuffer,
    location: number,
    values: Float32Array,
    size: number,
    usage: number,
  ) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, values, usage)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
  }

  const rebuildField = () => {
    const stepX = 30
    const stepY = 20
    const columns = Math.ceil(cssWidth / stepX) + 5
    const rows = Math.ceil(cssHeight / stepY) + 6
    const positions: number[] = []
    const phases: number[] = []
    const weights: number[] = []
    const quietStrengths: number[] = []
    quietBounds = resolveLandingBounds()
    syncStoryApertures()
    headerRegions = headerApertureRegions(
      cssWidth,
      brandLogo.getBoundingClientRect(),
      siteNav.getBoundingClientRect(),
    )
    footnoteBounds = unionTextBounds(
      [...siteFootnote.querySelectorAll("span")],
      siteFootnote,
    )
    socialBounds = unionTextBounds(
      [...siteSocial.querySelectorAll(".social-icon")],
      siteSocial,
    )

    for (let row = rows - 1; row >= -3; row -= 1) {
      const offset = row % 2 ? stepX * 0.5 : 0
      for (let column = -3; column < columns; column += 1) {
        const x = column * stepX + offset
        const y = row * stepY
        const noise = seeded(row, column)
        positions.push(x, y)
        phases.push(noise * Math.PI * 2)
        weights.push(noise)
        quietStrengths.push(sampleQuietAperture(x, y, quietBounds, cssWidth))
      }
    }

    pointCount = phases.length
    basePositions = new Float32Array(positions)
    centralQuietData = new Float32Array(quietStrengths)
    quietData = new Float32Array(centralQuietData)
    navApertureData = new Float32Array(pointCount)
    interactionData = new Float32Array(pointCount * 4)
    for (let index = 0; index < pointCount; index += 1) {
      interactionData[index * 4 + 2] = 1
    }

    uploadAttribute(positionBuffer, positionLocation, basePositions, 2, gl.STATIC_DRAW)
    uploadAttribute(phaseBuffer, phaseLocation, new Float32Array(phases), 1, gl.STATIC_DRAW)
    uploadAttribute(weightBuffer, weightLocation, new Float32Array(weights), 1, gl.STATIC_DRAW)
    uploadAttribute(quietBuffer, quietLocation, quietData, 1, gl.DYNAMIC_DRAW)
    uploadAttribute(
      navApertureBuffer,
      navApertureLocation,
      navApertureData,
      1,
      gl.DYNAMIC_DRAW,
    )
    uploadAttribute(
      interactionBuffer,
      interactionLocation,
      interactionData,
      4,
      gl.DYNAMIC_DRAW,
    )
  }

  const syncContentApertures = () => {
    syncLandingAperture()
    syncStoryApertures()
  }
  const contentResizeObserver = new ResizeObserver(syncContentApertures)
  contentResizeObserver.observe(contentRoot)
  const contentMutationObserver = new MutationObserver(() => {
    requestAnimationFrame(syncContentApertures)
  })
  contentMutationObserver.observe(contentRoot, {
    childList: true,
    subtree: true,
  })

  const updateInteraction = (state: UnderSkinState, now: number) => {
    for (let index = 0; index < pointCount; index += 1) {
      const offset = index * 4
      const x = basePositions[index * 2]
      const y = basePositions[index * 2 + 1]
      const effect = reducedMotion
        ? { ridge: 0, shiftX: 0, shiftY: 0, sizeScale: 1, angle: 0 }
        : sampleUnderSkinCurrent(x - state.x, y - state.y, state)
      const localFootnoteQuiet = sampleLocalAperture(
        x,
        y,
        footnoteBounds,
        now,
        reducedMotion,
      )
      const localSocialQuiet = sampleLocalAperture(
        x,
        y,
        socialBounds,
        now + 1800,
        reducedMotion,
      )
      const visionQuiet = visionMix > 0.001
        ? sampleVisionAperture(
          x,
          y,
          cssWidth,
          cssHeight,
          storyProgress,
          now,
          reducedMotion,
          visionApertureBounds,
        )
        : 0
      const aboutQuiet = aboutMix > 0.001
        ? sampleAboutAperture(
          x,
          y,
          cssWidth,
          cssHeight,
          storyProgress,
          now,
          reducedMotion,
          aboutApertureBounds,
        )
        : 0
      const sceneQuiet = Math.min(
        1,
        centralQuietData[index] * landingMix
          + visionQuiet * visionMix
          + aboutQuiet * aboutMix,
      )
      quietData[index] = mergeQuietApertures(
        sceneQuiet,
        localFootnoteQuiet,
        localSocialQuiet,
      )
      const quietEffect = attenuateScaleMotion(effect, quietData[index])
      interactionData[offset] = quietEffect.shiftX
      interactionData[offset + 1] = quietEffect.shiftY
      interactionData[offset + 2] = quietEffect.sizeScale
      interactionData[offset + 3] = quietEffect.angle
      navApertureData[index] = mergeQuietApertures(
        sampleHeaderAperture(x, y, headerRegions, now, reducedMotion),
        sampleDropdownAperture(
          x,
          y,
          dropdownLayout,
          dropdownApertureProgress,
          reducedMotion ? 0 : now,
          dropdownColorProgress,
        ),
      )
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, quietBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, quietData)
    gl.bindBuffer(gl.ARRAY_BUFFER, interactionBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, interactionData)
    gl.bindBuffer(gl.ARRAY_BUFFER, navApertureBuffer)
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, navApertureData)
  }

  const resize = () => {
    if (disposed) return
    const rect = canvas.getBoundingClientRect()
    cssWidth = rect.width
    cssHeight = rect.height
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(cssWidth * dpr)
    canvas.height = Math.round(cssHeight * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
    syncDropdownBoundary()
    rebuildField()
  }

  const texture = requireValue(gl.createTexture(), "scale texture")
  const textureImage = new Image()

  const render = (now: number) => {
    if (disposed) return
    const deltaMs = previousRenderTime === null
      ? 0
      : Math.min(64, Math.max(0, now - previousRenderTime))
    previousRenderTime = now
    const experience = getExperienceState()
    const targetMix = sceneMixTarget(experience.scene)
    const sceneResponse = reducedMotion
      ? 1
      : 1 - Math.exp(-Math.max(0, deltaMs) / 520)
    const storyResponse = reducedMotion
      ? 1
      : 1 - Math.exp(-Math.max(0, deltaMs) / 135)
    landingMix += (targetMix.landing - landingMix) * sceneResponse
    visionMix += (targetMix.vision - visionMix) * sceneResponse
    aboutMix += (targetMix.about - aboutMix) * sceneResponse
    storyProgress += (experience.storyProgress - storyProgress) * storyResponse
    const dropdownTarget = dropdownTargetOpen ? 1 : 0
    dropdownApertureProgress = advanceDropdownAperture(
      dropdownApertureProgress,
      dropdownTarget,
      deltaMs,
      reducedMotion,
    )
    dropdownColorProgress = advanceDropdownColorMix(
      dropdownColorProgress,
      dropdownTarget,
      deltaMs,
      reducedMotion,
    )
    projectsLinks.forEach((link, index) => {
      const opacity = sampleDropdownTextOpacity(
        dropdownColorProgress,
        index,
        projectsLinks.length,
      )
      link.style.setProperty("--dropdown-text-opacity", opacity.toFixed(4))
    })
    projectsMenu.open = shouldKeepDropdownOpen(
      dropdownTargetOpen,
      dropdownColorProgress,
    )
    latestMotionState = current.frame(now)
    updateInteraction(latestMotionState, now)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    gl.uniform2f(resolutionLocation, cssWidth, cssHeight)
    gl.uniform1f(timeLocation, now * 0.001)
    gl.uniform1f(dprLocation, dpr)
    gl.uniform1f(reducedLocation, reducedMotion ? 1 : 0)
    gl.uniform1f(motionFloorLocation, QUIET_APERTURE.motionFloor)
    gl.uniform1f(visionMixLocation, visionMix)
    gl.uniform1f(aboutMixLocation, aboutMix)
    gl.uniform1f(storyProgressLocation, storyProgress)
    gl.uniform3fv(paperColorLocation, APPROVED_BACKGROUND_PAPER)
    gl.uniform1f(quietColorMixLocation, QUIET_APERTURE.colorMix)
    gl.drawArrays(gl.POINTS, 0, pointCount)
    animationFrame = requestAnimationFrame(render)
  }

  const onTextureLoad = () => {
    if (disposed) return
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      textureImage,
    )
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)
    resize()
    canvas.dataset.fieldState = "ready"
    root.dataset.fieldReady = "true"
    animationFrame = requestAnimationFrame(render)
  }
  const onTextureError = () => {
    canvas.dataset.fieldState = "texture-error"
  }
  textureImage.addEventListener("load", onTextureLoad)
  textureImage.addEventListener("error", onTextureError)
  textureImage.src = "/textures/openboa-scale-cutout-aa-1024.png"

  const onPointerMove = (event: PointerEvent) => {
    current.move(event.clientX, event.clientY, event.timeStamp)
  }
  const onPointerLeave = () => current.leave()
  const onReducedMotionChange = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches
  }
  window.addEventListener("pointermove", onPointerMove, { passive: true })
  document.addEventListener("pointerleave", onPointerLeave)
  window.addEventListener("resize", resize, { passive: true })
  reducedMotionQuery.addEventListener("change", onReducedMotionChange)
  document.fonts?.ready.then(() => {
    if (!disposed && canvas.dataset.fieldState === "ready") resize()
  })

  const motionDebug = {
    getState: () => ({ ...latestMotionState }),
    getQuietBounds: () => ({ ...quietBounds }),
    getHeaderApertureRegions: () => headerRegions.map((bounds) => ({ ...bounds })),
    getDropdownApertureLayout: () => ({ ...dropdownLayout }),
    getLocalFootnoteBounds: () => ({ ...footnoteBounds }),
    getLocalSocialBounds: () => ({ ...socialBounds }),
    getVisionApertureBounds: () => (
      visionApertureBounds.map((geometry) => ({
        bounds: { ...geometry.bounds },
        fragments: geometry.fragments.map((bounds) => ({ ...bounds })),
      }))
    ),
    getAboutApertureBounds: () => (
      aboutApertureBounds.map((geometry) => ({
        bounds: { ...geometry.bounds },
        fragments: geometry.fragments.map((bounds) => ({ ...bounds })),
      }))
    ),
  }
  const debugWindow = window as typeof window & { __openBoaMotion?: typeof motionDebug }
  debugWindow.__openBoaMotion = motionDebug

  return () => {
    disposed = true
    cancelAnimationFrame(animationFrame)
    resizeObserver.disconnect()
    mutationObserver.disconnect()
    contentResizeObserver.disconnect()
    contentMutationObserver.disconnect()
    projectsMenu.removeEventListener("pointerenter", onMenuPointerEnter)
    projectsMenu.removeEventListener("pointerleave", onMenuPointerLeave)
    projectsMenu.removeEventListener("focusin", onMenuFocusIn)
    projectsMenu.removeEventListener("focusout", onMenuFocusOut)
    projectsSummary.removeEventListener("click", onSummaryClick)
    projectsMenu.removeEventListener("keydown", onMenuKeyDown)
    document.removeEventListener("pointerdown", onDocumentPointerDown)
    window.removeEventListener("pointermove", onPointerMove)
    document.removeEventListener("pointerleave", onPointerLeave)
    window.removeEventListener("resize", resize)
    reducedMotionQuery.removeEventListener("change", onReducedMotionChange)
    textureImage.removeEventListener("load", onTextureLoad)
    textureImage.removeEventListener("error", onTextureError)
    gl.deleteTexture(texture)
    ;[
      positionBuffer,
      phaseBuffer,
      weightBuffer,
      quietBuffer,
      navApertureBuffer,
      interactionBuffer,
    ].forEach((buffer) => gl.deleteBuffer(buffer))
    gl.deleteProgram(program)
    delete debugWindow.__openBoaMotion
  }
}
