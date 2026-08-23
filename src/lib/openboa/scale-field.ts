import { OPENBOA_COLORS } from "@/design-system/generated/openboa-token-values"
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
  philosophy: HTMLElement
}

const EMPTY_BOUNDS: ApertureBounds = { left: 0, top: 0, right: 1, bottom: 1 }

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
    philosophy,
  } = elements
  const projectsLinks = [...projectsPopover.querySelectorAll<HTMLElement>("a")]
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
  let reducedMotion = reducedMotionQuery.matches
  let disposed = false
  let projectsMenuPinned = false
  let dropdownTargetOpen = false
  let dropdownApertureProgress = 0
  let dropdownColorProgress = 0
  let previousRenderTime: number | null = null
  let animationFrame = 0
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
  const onMenuPointerEnter = () => setDropdownTarget(true)
  const onMenuPointerLeave = (event: PointerEvent) => {
    if (
      event.relatedTarget instanceof Node
      && projectsMenu.contains(event.relatedTarget)
    ) return
    if (!projectsMenuPinned) setDropdownTarget(false)
  }
  const onMenuFocusIn = () => setDropdownTarget(true)
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
    projectsMenuPinned = false
    setDropdownTarget(false)
    projectsSummary.focus()
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

    varying float v_tone;
    varying float v_angle;
    varying float v_quiet;
    varying float v_nav_aperture;

    void main() {
      vec2 position = a_position;
      float t = u_time * (1.0 - u_reduced);
      float broadA = sin(position.y * 0.013 + t * 0.32 + sin(position.x * 0.004 - t * 0.13) * 2.2);
      float broadB = cos(position.x * 0.009 - t * 0.24 + sin(position.y * 0.006 + t * 0.18) * 1.8);
      float micro = sin(a_phase + t * 0.55);
      float ambientMotion = mix(1.0, u_motion_floor, a_quiet);

      position.x += (broadA * 6.5 + broadB * 2.2) * ambientMotion;
      position.y += (broadB * 5.0 + micro * 1.4) * ambientMotion;
      position += a_interaction.xy;

      vec2 clip = (position / u_resolution) * 2.0 - 1.0;
      clip.y *= -1.0;
      gl_Position = vec4(clip, 0.0, 1.0);

      float ambientScale = 1.0 + (micro * 0.10 + broadA * 0.045) * ambientMotion;
      gl_PointSize = (38.0 + a_weight * 8.0) * ambientScale * a_interaction.z * u_dpr;
      v_angle = (broadA * 0.13 + broadB * 0.08) * ambientMotion + a_interaction.w;
      float macroDensity = 0.5 + 0.5 * sin(position.x * 0.010 + sin(position.y * 0.008 + t * 0.16) * 2.4);
      float crossDensity = 0.5 + 0.5 * cos(position.y * 0.014 - t * 0.14 + a_phase * 0.35);
      v_tone = 0.08 + macroDensity * 0.20 + crossDensity * 0.07 + a_weight * 0.015;
      v_quiet = a_quiet;
      v_nav_aperture = a_nav_aperture;
    }
  `

  const fragmentSource = `
    precision mediump float;

    uniform sampler2D u_texture;
    uniform vec3 u_paper_color;
    uniform vec3 u_scale_0;
    uniform vec3 u_scale_1;
    uniform vec3 u_scale_2;
    uniform vec3 u_scale_3;
    uniform vec3 u_scale_4;
    uniform vec3 u_scale_5;
    varying float v_tone;
    varying float v_angle;
    varying float v_quiet;
    varying float v_nav_aperture;

    vec3 scaleColor(float tone) {
      if (tone < 0.12) return u_scale_0;
      if (tone < 0.17) return u_scale_1;
      if (tone < 0.22) return u_scale_2;
      if (tone < 0.27) return u_scale_3;
      if (tone < 0.33) return u_scale_4;
      return u_scale_5;
    }

    void main() {
      vec2 centered = gl_PointCoord - vec2(0.5);
      float c = cos(v_angle);
      float s = sin(v_angle);
      vec2 uv = mat2(c, -s, s, c) * centered + vec2(0.5);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

      float fillAlpha = texture2D(u_texture, uv).a;
      if (fillAlpha <= 0.002) discard;

      float paperMix = max(v_quiet, v_nav_aperture);
      vec3 color = mix(scaleColor(v_tone), u_paper_color, paperMix);
      gl_FragColor = vec4(color, fillAlpha);
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
  const paperColorLocation = uniform("u_paper_color")
  const scaleColorLocations = [0, 1, 2, 3, 4, 5].map((index) => (
    uniform(`u_scale_${index}`)
  ))

  const seeded = (row: number, column: number) => {
    const value = Math.sin((row + 47) * 61.71 + (column + 29) * 37.19)
      * 43758.5453
    return value - Math.floor(value)
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
    quietBounds = unionTextBounds(
      [...philosophy.querySelectorAll("h1, .context")],
      philosophy,
    )
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
      quietData[index] = mergeQuietApertures(
        centralQuietData[index],
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
  const palette = [
    OPENBOA_COLORS.terracotta50.rgb,
    OPENBOA_COLORS.terracotta100.rgb,
    OPENBOA_COLORS.terracotta200.rgb,
    OPENBOA_COLORS.terracotta300.rgb,
    OPENBOA_COLORS.terracotta400.rgb,
    OPENBOA_COLORS.terracotta500.rgb,
  ]

  const render = (now: number) => {
    if (disposed) return
    const deltaMs = previousRenderTime === null
      ? 0
      : Math.min(64, Math.max(0, now - previousRenderTime))
    previousRenderTime = now
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
    gl.uniform3fv(paperColorLocation, new Float32Array(OPENBOA_COLORS.canvas.rgb))
    scaleColorLocations.forEach((location, index) => {
      gl.uniform3fv(location, new Float32Array(palette[index]))
    })
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
  }
  const debugWindow = window as typeof window & { __openBoaMotion?: typeof motionDebug }
  debugWindow.__openBoaMotion = motionDebug

  return () => {
    disposed = true
    cancelAnimationFrame(animationFrame)
    resizeObserver.disconnect()
    mutationObserver.disconnect()
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
