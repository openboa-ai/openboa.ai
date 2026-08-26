export interface VisionScaleLabState {
  mode: number
  stage: number
  scroll: number
  reading: number
}

const PAPER = new Float32Array([0.9725, 0.9725, 0.9608, 1])

function requireValue<T>(value: T | null, label: string): T {
  if (value === null) throw new Error(`Unable to create WebGL ${label}.`)
  return value
}

export function mountVisionScaleLab(
  canvas: HTMLCanvasElement,
  getState: () => VisionScaleLabState,
) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    powerPreference: "high-performance",
  })

  if (!gl) {
    canvas.dataset.fieldState = "unsupported"
    return () => undefined
  }

  let disposed = false
  let frame = 0
  let width = 1
  let height = 1
  let dpr = 1
  let pointCount = 0
  let previousTime: number | null = null
  let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const modeMix = new Float32Array([
    1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
  ])
  const stageMix = new Float32Array([1, 0, 0, 0])
  let fieldScroll = 0
  const pointer = {
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    velocityX: 0,
    velocityY: 0,
    targetStrength: 0,
    strength: 0,
    lastX: -1000,
    lastY: -1000,
    lastTime: 0,
  }

  const vertexSource = `
    precision highp float;

    attribute vec2 a_position;
    attribute vec4 a_meta;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_dpr;
    uniform float u_reduced;
    uniform vec4 u_mode_a;
    uniform vec4 u_mode_b;
    uniform vec4 u_mode_c;
    uniform vec4 u_mode_d;
    uniform vec4 u_mode_e;
    uniform vec4 u_mode_f;
    uniform vec4 u_mode_g;
    uniform vec4 u_mode_h;
    uniform vec4 u_stage_mix;
    uniform float u_scroll;
    uniform float u_reading;
    uniform vec4 u_pointer;
    uniform vec2 u_pointer_velocity;

    varying float v_tone;
    varying float v_angle;
    varying float v_quiet;
    varying float v_paper;

    const float PI = 3.14159265359;

    float softBand(float value, float center, float width) {
      float d = abs(value - center) / max(width, 0.0001);
      return exp(-d * d * 2.2);
    }

    void main() {
      vec2 uv = a_position / u_resolution;
      float phase = a_meta.x;
      float toneSeed = a_meta.y;
      float rowPhase = a_meta.z;
      float columnPhase = a_meta.w;
      float t = u_time * (1.0 - u_reduced);

      float m0 = u_mode_a.x;
      float m1 = u_mode_a.y;
      float m2 = u_mode_a.z;
      float m3 = u_mode_a.w;
      float m4 = u_mode_b.x;
      float m5 = u_mode_b.y;
      float m6 = u_mode_b.z;
      float m7 = u_mode_b.w;
      float m8 = u_mode_c.x;
      float m9 = u_mode_c.y;
      float m10 = u_mode_c.z;
      float m11 = u_mode_c.w;
      float m12 = u_mode_d.x;
      float m13 = u_mode_d.y;
      float m14 = u_mode_d.z;
      float m15 = u_mode_d.w;
      float m16 = u_mode_e.x;
      float m17 = u_mode_e.y;
      float m18 = u_mode_e.z;
      float m19 = u_mode_e.w;
      float m20 = u_mode_f.x;
      float m21 = u_mode_f.y;
      float m22 = u_mode_f.z;
      float m23 = u_mode_f.w;
      float m24 = u_mode_g.x;
      float m25 = u_mode_g.y;
      float m26 = u_mode_g.z;
      float m27 = u_mode_g.w;
      float m28 = u_mode_h.x;
      float m29 = u_mode_h.y;
      float m30 = u_mode_h.z;
      float m31 = u_mode_h.w;

      float broadA = sin(uv.y * 13.0 + t * 0.31 + sin(uv.x * 6.0 - t * 0.17) * 1.7);
      float broadB = cos(uv.x * 10.0 - t * 0.23 + sin(uv.y * 7.0 + t * 0.13) * 1.5);
      vec2 skinAmbient = vec2(broadA * 5.6 + broadB * 1.5, broadB * 4.4);
      float relayPulse = sin(rowPhase * 0.24 + uv.x * 7.2 - t * 0.86);
      vec2 relayAmbient = vec2(
        cos(columnPhase * 0.12 + t * 0.31) * 3.8,
        relayPulse * 8.2
      );
      float braidPolarity = smoothstep(0.12, 0.88, uv.y) * 2.0 - 1.0;
      vec2 braidAmbient = vec2(
        braidPolarity * (5.4 + sin(uv.y * 8.0 + t * 0.36) * 2.2),
        sin(uv.x * 8.2 + braidPolarity * t * 0.52 + uv.y * 5.0) * 7.4
      );
      vec2 flockAmbient = vec2(
        sin(uv.x * 10.5 + sin(uv.y * 7.0) * 1.6 + t * 0.54) * 9.2,
        cos(uv.y * 9.0 + sin(uv.x * 6.0) * 1.5 - t * 0.47) * 8.0
      );
      vec2 connectedAmbient = skinAmbient * 0.58
        + relayAmbient * 0.20
        + braidAmbient * 0.13
        + flockAmbient * 0.09;

      float risingPhase = uv.y * 7.4 - t * 0.55 - u_scroll * 2.15;
      float risingCenter = 0.66
        + sin(risingPhase) * 0.115
        + sin(uv.y * 15.0 + t * 0.16) * 0.025;
      float risingDistance = abs(uv.x - risingCenter);
      float risingBody = 1.0 - smoothstep(0.22, 0.43, risingDistance);
      vec2 risingAmbient = vec2(
        cos(risingPhase) * 8.2 * risingBody,
        -15.0 * risingBody + sin(risingPhase * 1.7) * 3.2
      );
      float risingPaper = smoothstep(0.25, 0.52, risingDistance) * 0.94;

      float diagonalEdge = 0.40 + uv.y * 0.38
        + sin(uv.y * 8.0 - t * 0.27) * 0.032;
      float diagonalSigned = uv.x - diagonalEdge;
      float diagonalBody = smoothstep(-0.16, 0.11, diagonalSigned);
      vec2 diagonalAmbient = vec2(
        7.5 * diagonalBody,
        -8.5 * diagonalBody + sin((uv.x + uv.y) * 9.0 - t * 0.44) * 3.0
      );
      float diagonalPaper = smoothstep(0.08, 0.48, -diagonalSigned) * 0.96;

      float neighborPulse = sin(
        uv.x * 13.0 - t * 1.05 + rowPhase * 0.22
      );
      float neighborEnvelope = 0.5 + 0.5 * sin(
        uv.x * 3.4 - t * 0.31 + uv.y * 2.0
      );
      vec2 neighborAmbient = vec2(
        5.2 + neighborPulse * 3.0,
        neighborPulse * neighborEnvelope * 11.0
      );
      float neighborPaper = (1.0 - neighborEnvelope) * 0.16;

      float formationCycle = 0.5 + 0.5 * sin(t * 0.19 + u_scroll * 0.48);
      float formationReach = 0.07 + formationCycle * 0.46;
      float formationLeft = 1.0 - smoothstep(
        formationReach,
        formationReach + 0.17,
        uv.x
      );
      float formationRight = smoothstep(
        1.0 - formationReach - 0.17,
        1.0 - formationReach,
        uv.x
      );
      float formationTop = 1.0 - smoothstep(
        formationReach * 0.62,
        formationReach * 0.62 + 0.14,
        uv.y
      );
      float formationBottom = smoothstep(
        1.0 - formationReach * 0.62 - 0.14,
        1.0 - formationReach * 0.62,
        uv.y
      );
      float formationPresence = max(
        max(formationLeft, formationRight),
        max(formationTop, formationBottom) * 0.72
      );
      vec2 formationToCenter = normalize(vec2(0.52, 0.50) - uv + vec2(0.001));
      float formationWave = sin(
        (uv.x + uv.y) * 10.0 - t * 0.48
      ) + sin((uv.x - uv.y) * 9.0 + t * 0.42);
      vec2 formationAmbient = formationToCenter
        * formationPresence * (7.0 + formationCycle * 10.0)
        + vec2(formationWave * 2.5, formationWave * 4.2)
          * smoothstep(0.36, 0.92, formationPresence);
      float formationPaper = (1.0 - formationPresence) * 0.98;

      float splitProgress = smoothstep(0.14, 0.78, uv.x);
      float splitPolarity = smoothstep(0.46, 0.54, uv.y) * 2.0 - 1.0;
      float splitTarget = 0.50 + splitPolarity * splitProgress * 0.23;
      float splitDistance = abs(uv.y - splitTarget);
      float splitBody = 1.0 - smoothstep(0.10, 0.31, splitDistance);
      vec2 splitAmbient = vec2(
        (5.8 + splitProgress * 5.0) * splitBody,
        (splitTarget - uv.y) * 27.0 * splitBody
      );
      float splitPaper = smoothstep(0.19, 0.49, splitDistance) * 0.32;

      vec2 coilDelta = uv - vec2(0.61, 0.49);
      float coilRadius = length(coilDelta * vec2(1.0, 1.14));
      float coilTheta = atan(coilDelta.y, coilDelta.x);
      float coilBody = 1.0 - smoothstep(0.12, 0.66, coilRadius);
      float coilBand = 0.5 + 0.5 * sin(
        coilRadius * 30.0 - coilTheta * 3.0 - t * 0.82 - u_scroll * 0.58
      );
      vec2 coilNormal = normalize(coilDelta + vec2(0.001));
      vec2 coilTangent = vec2(-coilNormal.y, coilNormal.x);
      vec2 coilAmbient = coilTangent * (12.0 + coilBand * 10.0) * coilBody
        + coilNormal * (-7.0 + coilBand * 4.0) * coilBody;
      float coilPaper = (1.0 - smoothstep(0.018, 0.14, coilRadius)) * 0.40;

      vec2 voidDelta = uv - vec2(0.47, 0.50);
      float voidIrregular = sin(
        atan(voidDelta.y, voidDelta.x) * 6.0 - t * 0.14
      ) * 0.022 + sin(uv.x * 13.0 + uv.y * 8.0 + t * 0.10) * 0.018;
      float voidDistance = length(voidDelta * vec2(1.0, 1.08)) + voidIrregular;
      float voidBreath = 0.5 + 0.5 * sin(t * 0.24 + u_scroll * 0.62);
      float voidRadius = 0.105 + voidBreath * 0.095;
      float voidPressure = 1.0 - smoothstep(
        voidRadius,
        voidRadius + 0.18,
        voidDistance
      );
      vec2 voidNormal = normalize(voidDelta + vec2(0.001));
      vec2 voidAmbient = voidNormal * voidPressure * (12.0 + voidBreath * 10.0)
        + skinAmbient * (1.0 - voidPressure) * 0.58;
      float voidPaper = voidPressure * 0.94;

      vec2 pulseDelta = uv - vec2(0.54, 0.50);
      float pulseRadius = length(pulseDelta * vec2(1.0, 1.12));
      float compressionSignal = sin(pulseRadius * 31.0 - t * 1.05 + u_scroll * 0.7);
      vec2 pulseNormal = normalize(pulseDelta + vec2(0.001));
      vec2 pulseAmbient = pulseNormal * compressionSignal
        * (11.0 * exp(-pulseRadius * 1.35));
      float pulsePaper = smoothstep(-0.92, -0.12, -compressionSignal) * 0.14;

      float plumeHeight = 1.0 - uv.y;
      float plumeCenter = 0.59
        + sin(plumeHeight * 8.5 - t * 0.55 - u_scroll * 0.42) * 0.035;
      float plumeDistance = abs(uv.x - plumeCenter);
      float plumeWidth = 0.035 + plumeHeight * 0.115;
      float plumeColumn = 1.0 - smoothstep(
        plumeWidth,
        plumeWidth + 0.15,
        plumeDistance
      );
      float plumeLift = smoothstep(0.01, 0.18, plumeHeight)
        * (1.0 - smoothstep(0.94, 1.14, plumeHeight));
      vec2 capDelta = uv - vec2(0.59, 0.22);
      float capRadius = length(capDelta * vec2(1.0, 1.35));
      float plumeCap = 1.0 - smoothstep(0.10, 0.37, capRadius);
      vec2 capNormal = normalize(capDelta + vec2(0.001));
      vec2 eruptionAmbient = vec2(
        sin(plumeHeight * 12.0 - t * 0.62) * 3.8 * plumeColumn,
        -23.0 * plumeColumn * plumeLift
      ) + vec2(capNormal.x * 18.0, -6.0) * plumeCap;
      float eruptionPaper = (1.0 - max(plumeColumn, plumeCap)) * 0.10;

      float weaveA = sin((uv.x * 8.8 + uv.y * 10.2) - t * 0.52);
      float weaveB = sin((uv.x * 8.8 - uv.y * 10.2) - t * 0.46 + 1.2);
      float weaveExchange = 0.5 + 0.5 * sin(uv.x * 4.2 - t * 0.24);
      vec2 weaveAmbient = vec2(
        7.0 + (weaveA + weaveB) * 2.4,
        mix(weaveA, weaveB, weaveExchange) * 9.6
      );
      float weavePaper = (1.0 - abs(weaveA * weaveB)) * 0.10;

      float wakeHead = 0.56 + sin(t * 0.19 + u_scroll * 0.52) * 0.24;
      float wakeCenter = 0.51 + sin(uv.x * 5.8 - t * 0.31) * 0.075;
      float wakeVertical = abs(uv.y - wakeCenter);
      float wakeBehind = wakeHead - uv.x;
      float wakeTail = smoothstep(-0.08, 0.10, wakeBehind)
        * (1.0 - smoothstep(0.18, 0.92, wakeBehind));
      float wakeBody = (1.0 - smoothstep(0.08, 0.34, wakeVertical))
        * (0.34 + wakeTail * 0.66);
      vec2 wakeAmbient = vec2(
        8.0 * wakeBody,
        sin(wakeBehind * 22.0 - t * 0.76) * 11.0 * wakeTail * wakeBody
      );
      float wakePaper = (1.0 - wakeBody) * 0.22;

      float fountainHeight = 1.0 - uv.y;
      float fountainJetA = softBand(
        uv.x,
        0.59 + sin(fountainHeight * 7.0 - t * 0.52) * 0.025,
        0.095
      );
      float fountainJetB = softBand(
        uv.x,
        0.59 - fountainHeight * 0.22,
        0.11
      );
      float fountainJetC = softBand(
        uv.x,
        0.59 + fountainHeight * 0.22,
        0.11
      );
      float fountainJet = max(fountainJetA, max(fountainJetB, fountainJetC));
      float fountainArcHeight = 0.30 + abs(uv.x - 0.59) * 0.92;
      float fountainArc = softBand(uv.y, fountainArcHeight, 0.16)
        * smoothstep(0.10, 0.46, abs(uv.x - 0.59));
      float fountainSide = uv.x < 0.59 ? -1.0 : 1.0;
      vec2 fountainAmbient = vec2(
        fountainSide * fountainArc * 15.0
          + sin(fountainHeight * 11.0 - t * 0.72) * fountainJet * 2.8,
        -27.0 * fountainJet + fountainArc * 13.0
      );
      float fountainPaper = (1.0 - max(fountainJet, fountainArc)) * 0.12;

      vec2 globeDelta = uv - vec2(0.62, 0.50);
      float globeRadius = length(globeDelta * vec2(1.0, 1.10));
      float globeBody = 1.0 - smoothstep(0.38, 0.48, globeRadius);
      float globeLatitudeValue = globeDelta.y / 0.45;
      float globeLatitude = sqrt(max(
        0.0,
        1.0 - globeLatitudeValue * globeLatitudeValue
      ));
      float globeOrbit = sin(
        globeDelta.y * 19.0 + t * 0.42 + u_scroll * 0.36
      );
      vec2 globeAmbient = vec2(
        (10.0 + globeLatitude * 10.0) * globeBody,
        globeOrbit * 7.0 * globeBody
      ) + skinAmbient * (1.0 - globeBody) * 0.42;
      float globePaper = (1.0 - globeBody) * 0.54;

      vec2 reboundDelta = uv - vec2(0.55, 0.54);
      float reboundRadius = length(reboundDelta * vec2(1.0, 1.10));
      vec2 reboundNormal = normalize(reboundDelta + vec2(0.001));
      float reboundSignal = sin(
        reboundRadius * 39.0 - t * 1.52 - u_scroll * 0.76
      ) * exp(-reboundRadius * 0.82);
      vec2 reboundAmbient = reboundNormal * reboundSignal * 5.5;
      float reboundPaper = smoothstep(-0.96, -0.22, -reboundSignal) * 0.15;

      float tideAxisAngle = (0.25 + 0.25 * sin(t * 0.15)) * PI;
      vec2 tideAxis = vec2(cos(tideAxisAngle), sin(tideAxisAngle));
      vec2 tideNormal = vec2(-tideAxis.y, tideAxis.x);
      float tidePosition = dot(uv - vec2(0.5), tideAxis);
      float tideCross = dot(uv - vec2(0.5), tideNormal);
      float tideSignal = sin(
        tidePosition * 18.0 - t * 0.66 + sin(tideCross * 8.0) * 0.72
      );
      vec2 tideAmbient = tideNormal * tideSignal * 15.0
        + tideAxis * cos(tideCross * 10.0 - t * 0.31) * 4.2;
      float tidePaper = (1.0 - abs(tideSignal)) * 0.10;

      vec2 poleA = vec2(0.31, 0.50);
      vec2 poleB = vec2(0.77, 0.50);
      vec2 poleDeltaA = poleA - uv;
      vec2 poleDeltaB = poleB - uv;
      float poleDistanceA = length(poleDeltaA);
      float poleDistanceB = length(poleDeltaB);
      vec2 poleDirectionA = normalize(poleDeltaA + vec2(0.001));
      vec2 poleDirectionB = normalize(poleDeltaB + vec2(0.001));
      vec2 magneticAmbient = (
        poleDirectionA / (0.28 + poleDistanceA)
          + poleDirectionB / (0.28 + poleDistanceB)
      ) * 4.8 + vec2(0.0, sin((poleDistanceA - poleDistanceB) * 21.0 - t * 0.52) * 5.5);
      float magneticPaper = softBand(uv.x, 0.54, 0.11) * 0.12;

      float swarmFront = 0.50 + sin(t * 0.24 + u_scroll * 0.30) * 0.32;
      float swarmOrder = smoothstep(
        swarmFront - 0.26,
        swarmFront + 0.20,
        uv.x + sin(uv.y * 8.0 - t * 0.16) * 0.05
      );
      vec2 swarmOrdered = vec2(
        11.0,
        sin(uv.y * 8.2 - t * 0.42) * 3.4
      );
      vec2 swarmAmbient = mix(flockAmbient, swarmOrdered, swarmOrder);
      float swarmPaper = (1.0 - swarmOrder) * 0.08;

      vec2 ingressDelta = uv - vec2(0.55, 0.50);
      float ingressRadius = length(ingressDelta * vec2(1.0, 1.10));
      float ingressTheta = atan(ingressDelta.y, ingressDelta.x);
      vec2 ingressNormal = normalize(ingressDelta + vec2(0.001));
      vec2 ingressTangent = vec2(-ingressNormal.y, ingressNormal.x);
      float ingressCycle = 0.5 + 0.5 * sin(t * 0.18 + u_scroll * 0.44);
      float ingressFront = 0.72 - ingressCycle * 0.48;
      float ingressEdge = smoothstep(
        ingressFront - 0.13,
        ingressFront + 0.13,
        ingressRadius
      );
      float ingressArms = 0.5 + 0.5 * sin(
        ingressTheta * 5.0 - ingressRadius * 27.0 - t * 0.72
      );
      float ingressPresence = ingressEdge * (0.62 + ingressArms * 0.38);
      vec2 ingressAmbient = (
        ingressTangent * (10.0 + ingressArms * 10.0)
          - ingressNormal * (7.0 + ingressCycle * 6.0)
      ) * ingressPresence;
      float ingressSurface = 0.18 + ingressPresence * 0.82;
      float ingressPaper = (1.0 - ingressSurface) * 0.74;

      float moltFront = 0.20
        + (0.5 + 0.5 * sin(t * 0.17 + u_scroll * 0.38)) * 0.66;
      float moltCoordinate = uv.x + uv.y * 0.34
        + sin(uv.y * 9.0 - t * 0.22) * 0.045;
      float moltBand = softBand(moltCoordinate, moltFront, 0.14);
      float moltSurface = smoothstep(
        moltFront - 0.16,
        moltFront + 0.17,
        moltCoordinate
      );
      vec2 moltAmbient = vec2(18.0, -9.0) * moltBand
        + skinAmbient * (0.38 + moltSurface * 0.46);
      float moltPaper = (1.0 - moltSurface) * 0.74;

      vec2 ringsDelta = uv - vec2(0.61, 0.50);
      float ringsRadius = length(ringsDelta * vec2(1.0, 1.12));
      vec2 ringsNormal = normalize(ringsDelta + vec2(0.001));
      vec2 ringsTangent = vec2(-ringsNormal.y, ringsNormal.x);
      float ringA = softBand(ringsRadius, 0.17 + sin(t * 0.21) * 0.025, 0.075);
      float ringB = softBand(ringsRadius, 0.33 + cos(t * 0.17) * 0.032, 0.082);
      float ringC = softBand(ringsRadius, 0.50 + sin(t * 0.14) * 0.038, 0.095);
      float ringField = max(ringA, max(ringB, ringC));
      vec2 ringsAmbient = ringsTangent
        * (ringA * 21.0 - ringB * 16.0 + ringC * 12.0)
        + ringsNormal * sin(ringsRadius * 24.0 - t * 0.46) * 3.5;
      float ringsPaper = (1.0 - ringField) * 0.18;

      float canopyHeight = 1.0 - uv.y;
      float canopyTrunk = softBand(
        uv.x,
        0.58 + sin(canopyHeight * 6.0 - t * 0.32) * 0.025,
        0.095
      );
      float canopySplit = smoothstep(0.28, 0.72, canopyHeight);
      float canopyBranchLeft = softBand(
        uv.x,
        0.58 - canopySplit * 0.28,
        0.11 + canopyHeight * 0.03
      );
      float canopyBranchRight = softBand(
        uv.x,
        0.58 + canopySplit * 0.28,
        0.11 + canopyHeight * 0.03
      );
      float canopyField = max(
        canopyTrunk * (1.0 - canopySplit * 0.58),
        max(canopyBranchLeft, canopyBranchRight) * canopySplit
      );
      float canopySide = uv.x < 0.58 ? -1.0 : 1.0;
      vec2 canopyAmbient = vec2(
        canopySide * canopySplit * canopyField * 13.0,
        -22.0 * canopyField
      );
      float canopyPaper = (1.0 - canopyField) * 0.20;

      vec2 lensCenter = vec2(
        0.56 + sin(t * 0.17 + u_scroll * 0.31) * 0.16,
        0.50 + cos(t * 0.13) * 0.10
      );
      vec2 lensDelta = uv - lensCenter;
      float lensRadius = length(lensDelta * vec2(1.0, 1.15));
      float lensPressure = 1.0 - smoothstep(0.095, 0.285, lensRadius);
      vec2 lensNormal = normalize(lensDelta + vec2(0.001));
      vec2 lensTangent = vec2(-lensNormal.y, lensNormal.x);
      vec2 lensAmbient = lensTangent * lensPressure * 17.0
        + lensNormal * lensPressure * 9.0
        + skinAmbient * (1.0 - lensPressure) * 0.58;
      float lensPaper = lensPressure * 0.92;

      float counterSeamCenter = 0.50 + sin(uv.x * 4.0 - t * 0.21) * 0.055;
      float counterUpper = smoothstep(
        counterSeamCenter - 0.055,
        counterSeamCenter + 0.055,
        uv.y
      );
      float counterDirection = counterUpper * 2.0 - 1.0;
      float counterSeam = softBand(uv.y, counterSeamCenter, 0.13);
      vec2 counterAmbient = vec2(
        counterDirection * (13.0 + counterSeam * 5.0),
        sin(uv.x * 10.0 - t * 0.64) * counterSeam * 8.0
      );
      float counterPaper = counterSeam * 0.10;

      float cellularA = sin(
        uv.x * 7.0 + sin(uv.y * 5.0 - t * 0.18) * 1.45 - t * 0.36
      );
      float cellularB = cos(
        uv.y * 6.5 + sin(uv.x * 4.5 + t * 0.15) * 1.35 + t * 0.31
      );
      float cellularField = 0.5 + 0.5 * sin(cellularA * 1.7 + cellularB * 1.4);
      float cellularFront = 0.5 + sin(t * 0.20 + u_scroll * 0.35) * 0.22;
      float cellularActive = smoothstep(
        cellularFront - 0.18,
        cellularFront + 0.18,
        cellularField
      );
      vec2 cellularAmbient = vec2(
        sin(uv.y * 9.0 - t * 0.46) * 8.0,
        cos(uv.x * 8.0 + t * 0.41) * 8.5
      ) * (0.32 + cellularActive * 0.68);
      float cellularPaper = (1.0 - cellularActive) * 0.34;

      float reformCycle = 0.5 + 0.5 * sin(t * 0.16 + u_scroll * 0.46);
      float reformBoundary = 0.22 + reformCycle * 0.58
        + sin(uv.y * 7.0 - t * 0.25) * 0.075
        + sin(uv.y * 15.0 + t * 0.12) * 0.022;
      float reformSurface = smoothstep(
        reformBoundary - 0.14,
        reformBoundary + 0.16,
        uv.x
      );
      float reformEdge = softBand(uv.x, reformBoundary, 0.15);
      vec2 reformAmbient = vec2(
        (6.0 + reformEdge * 11.0) * reformSurface,
        sin(uv.y * 11.0 - t * 0.52) * reformEdge * 8.0
      );
      float reformPaper = (1.0 - reformSurface) * 0.70;

      float peristalticPhase = uv.y * 25.0 - t * 1.28 - u_scroll * 1.36;
      float peristalticCenter = 0.57
        + sin(uv.y * 7.2 - t * 0.36) * 0.13
        + sin(uv.y * 15.0 + t * 0.19) * 0.026;
      float peristalticDistance = abs(uv.x - peristalticCenter);
      float peristalticBody = 1.0 - smoothstep(0.18, 0.40, peristalticDistance);
      float peristalticContract = 0.5 + 0.5 * sin(peristalticPhase);
      float peristalticSide = uv.x < peristalticCenter ? 1.0 : -1.0;
      vec2 peristalticAmbient = vec2(
        peristalticSide * peristalticContract * 8.5,
        -7.0 - peristalticContract * 9.0
      ) * peristalticBody + skinAmbient * (1.0 - peristalticBody) * 0.36;
      float peristalticPaper = (1.0 - peristalticBody) * 0.30;

      float loomCycle = 0.5 + 0.5 * sin(t * 0.17 + u_scroll * 0.40);
      float loomReach = 0.11 + loomCycle * 0.41;
      float loomLeftCenter = loomReach
        + sin(uv.y * 12.0 - t * 0.52) * 0.034;
      float loomRightCenter = 1.0 - loomReach
        + sin(uv.y * 12.0 + t * 0.48 + 1.7) * 0.034;
      float loomLeft = softBand(uv.x, loomLeftCenter, 0.15);
      float loomRight = softBand(uv.x, loomRightCenter, 0.15);
      float loomCrossA = softBand(
        uv.x,
        0.50 + sin(uv.y * 10.5 - t * 0.58) * 0.15,
        0.12
      );
      float loomCrossB = softBand(
        uv.x,
        0.50 - sin(uv.y * 10.5 - t * 0.58) * 0.15,
        0.12
      );
      float loomInterlock = smoothstep(0.52, 0.86, loomCycle)
        * max(loomCrossA, loomCrossB);
      float loomField = max(max(loomLeft, loomRight), loomInterlock);
      float loomDirection = uv.x < 0.5 ? 1.0 : -1.0;
      vec2 loomAmbient = vec2(
        loomDirection * (9.0 + loomCycle * 8.0),
        sin(uv.y * 15.0 - t * 0.68 + loomDirection) * 7.0
      ) * loomField;
      float loomPaper = (1.0 - loomField) * 0.88;

      float healingSeam = 0.50
        + sin(uv.x * 7.4 - t * 0.28) * 0.075
        + sin(uv.x * 15.0 + t * 0.17) * 0.022;
      float healingCycle = 0.5 + 0.5 * sin(t * 0.20 + u_scroll * 0.43);
      float healingGap = 0.025 + healingCycle * 0.095;
      float healingDistance = abs(uv.y - healingSeam);
      float healingPressure = 1.0 - smoothstep(
        healingGap,
        healingGap + 0.15,
        healingDistance
      );
      float healingBridge = 0.5 + 0.5 * sin(
        uv.x * 19.0 - t * 1.06 - u_scroll * 0.72
      );
      float healingSide = uv.y < healingSeam ? -1.0 : 1.0;
      vec2 healingAmbient = vec2(
        healingBridge * 4.5,
        -healingSide * healingPressure * (7.0 + healingBridge * 8.0)
      ) + skinAmbient * (1.0 - healingPressure) * 0.48;
      float healingPaper = healingPressure * (0.56 + healingCycle * 0.34)
        * (0.62 + healingBridge * 0.38);

      vec2 mobiusDelta = (uv - vec2(0.57, 0.50)) * vec2(1.0, 1.28);
      float mobiusX2 = mobiusDelta.x * mobiusDelta.x;
      float mobiusY2 = mobiusDelta.y * mobiusDelta.y;
      float mobiusImplicit = abs(
        (mobiusX2 + mobiusY2) * (mobiusX2 + mobiusY2)
          - 0.19 * (mobiusX2 - mobiusY2)
      );
      float mobiusBand = exp(-mobiusImplicit * 210.0)
        * (1.0 - smoothstep(0.46, 0.70, length(mobiusDelta)));
      float mobiusTurn = sin(
        atan(mobiusDelta.y, mobiusDelta.x) * 2.0
          - t * 0.82 - u_scroll * 0.52
      );
      vec2 mobiusNormal = normalize(mobiusDelta + vec2(0.001));
      vec2 mobiusTangent = vec2(-mobiusNormal.y, mobiusNormal.x);
      vec2 mobiusAmbient = mobiusTangent * mobiusBand * (15.0 + mobiusTurn * 7.0)
        + mobiusNormal * mobiusBand * mobiusTurn * 7.0
        + skinAmbient * (1.0 - mobiusBand) * 0.34;
      float mobiusPaper = (1.0 - mobiusBand) * 0.54;

      vec2 islandA = uv - vec2(0.27, 0.35);
      vec2 islandB = uv - vec2(0.71, 0.31);
      vec2 islandC = uv - vec2(0.33, 0.72);
      vec2 islandD = uv - vec2(0.75, 0.68);
      float islandCycle = 0.5 + 0.5 * sin(t * 0.16 + u_scroll * 0.39);
      float islandRadius = 0.09 + islandCycle * 0.15;
      float islandField = max(
        max(1.0 - smoothstep(islandRadius, islandRadius + 0.16, length(islandA)),
          1.0 - smoothstep(islandRadius, islandRadius + 0.16, length(islandB))),
        max(1.0 - smoothstep(islandRadius, islandRadius + 0.16, length(islandC)),
          1.0 - smoothstep(islandRadius, islandRadius + 0.16, length(islandD)))
      );
      float islandBridgeH = softBand(uv.y, 0.50, 0.15) * islandCycle;
      float islandBridgeV = softBand(uv.x, 0.52, 0.16) * islandCycle;
      float synthesisField = max(islandField, max(islandBridgeH, islandBridgeV) * 0.82);
      vec2 synthesisDirection = normalize(vec2(0.52, 0.50) - uv + vec2(0.001));
      vec2 synthesisAmbient = synthesisDirection * synthesisField
        * (5.0 + islandCycle * 10.0)
        + vec2(sin(uv.y * 11.0 - t * 0.42), cos(uv.x * 10.0 + t * 0.38))
          * synthesisField * 4.5;
      float synthesisPaper = (1.0 - synthesisField) * 0.66;

      float unfurlCycle = 0.5 + 0.5 * sin(t * 0.15 + u_scroll * 0.46);
      float unfurlCenter = 0.50
        + sin(uv.x * 5.0 - t * 0.23) * 0.030
        + sin(uv.x * 11.0 + t * 0.11) * 0.010;
      float unfurlDistance = abs(uv.y - unfurlCenter);
      float unfurlHalfHeight = 0.075 + unfurlCycle * 0.19;
      float unfurlCore = 1.0 - smoothstep(
        unfurlHalfHeight * 0.82,
        unfurlHalfHeight + 0.12,
        unfurlDistance
      );
      float unfurlFeather = 1.0 - smoothstep(
        unfurlHalfHeight + 0.02,
        unfurlHalfHeight + 0.34,
        unfurlDistance
      );
      float unfurlPressure = max(unfurlCore, unfurlFeather * 0.58);
      float unfurlSide = uv.y < unfurlCenter ? -1.0 : 1.0;
      vec2 unfurlAmbient = vec2(
        (uv.x - 0.5) * unfurlPressure * 9.0,
        unfurlSide * unfurlPressure * (7.0 + unfurlCycle * 8.0)
      ) + skinAmbient * (1.0 - unfurlPressure) * 0.50;
      float unfurlPaper = clamp(
        unfurlCore * 0.68 + unfurlFeather * 0.26,
        0.0,
        0.94
      );

      float nucleusDistance = min(
        min(length(uv - vec2(0.25, 0.32)), length(uv - vec2(0.70, 0.28))),
        min(length(uv - vec2(0.38, 0.72)), length(uv - vec2(0.78, 0.67)))
      );
      float nucleusCycle = 0.5 + 0.5 * sin(t * 0.17 + u_scroll * 0.42);
      float nucleusReach = 0.06 + nucleusCycle * 0.46;
      float nucleusOrder = 1.0 - smoothstep(
        nucleusReach,
        nucleusReach + 0.18,
        nucleusDistance
      );
      float nucleusFront = softBand(nucleusDistance, nucleusReach, 0.085);
      vec2 nucleusAmbient = mix(
        flockAmbient * 0.66,
        vec2(7.5, sin(uv.x * 12.0 - t * 0.41) * 2.8),
        nucleusOrder
      ) + normalize(vec2(0.52, 0.50) - uv + vec2(0.001)) * nucleusFront * 8.0;
      float nucleusPaper = (1.0 - nucleusOrder) * 0.46;

      float perimeterDistance = min(
        min(uv.x, 1.0 - uv.x),
        min(uv.y, 1.0 - uv.y)
      );
      float perimeterCycle = 0.5 + 0.5 * sin(t * 0.18 + u_scroll * 0.44);
      float perimeterWidth = 0.15 + perimeterCycle * 0.16;
      float perimeterField = 1.0 - smoothstep(
        perimeterWidth,
        perimeterWidth + 0.16,
        perimeterDistance
      );
      vec2 perimeterTangent;
      if (uv.y <= uv.x && uv.y <= 1.0 - uv.x && uv.y <= 1.0 - uv.y) {
        perimeterTangent = vec2(1.0, 0.0);
      } else if (1.0 - uv.x <= uv.x && 1.0 - uv.x <= uv.y && 1.0 - uv.x <= 1.0 - uv.y) {
        perimeterTangent = vec2(0.0, 1.0);
      } else if (1.0 - uv.y <= uv.x && 1.0 - uv.y <= 1.0 - uv.x) {
        perimeterTangent = vec2(-1.0, 0.0);
      } else {
        perimeterTangent = vec2(0.0, -1.0);
      }
      vec2 perimeterAmbient = perimeterTangent * perimeterField
        * (10.0 + perimeterCycle * 6.0)
        + skinAmbient * (1.0 - perimeterField) * 0.26;
      float perimeterPaper = (1.0 - perimeterField) * 0.76;

      vec2 ambient = connectedAmbient * m0
        + risingAmbient * m1
        + diagonalAmbient * m2
        + (neighborAmbient * 0.64 + wakeAmbient * 0.36) * m3
        + formationAmbient * m4
        + (splitAmbient * 0.62 + weaveAmbient * 0.38) * m5
        + coilAmbient * m6
        + voidAmbient * m7
        + pulseAmbient * m8
        + eruptionAmbient * m9
        + fountainAmbient * m10
        + globeAmbient * m11
        + reboundAmbient * m12
        + tideAmbient * m13
        + magneticAmbient * m14
        + swarmAmbient * m15
        + ingressAmbient * m16
        + moltAmbient * m17
        + ringsAmbient * m18
        + canopyAmbient * m19
        + lensAmbient * m20
        + counterAmbient * m21
        + cellularAmbient * m22
        + reformAmbient * m23
        + peristalticAmbient * m24
        + loomAmbient * m25
        + healingAmbient * m26
        + mobiusAmbient * m27
        + synthesisAmbient * m28
        + unfurlAmbient * m29
        + nucleusAmbient * m30
        + perimeterAmbient * m31;
      float modePaper = risingPaper * m1
        + diagonalPaper * m2
        + (neighborPaper * 0.64 + wakePaper * 0.36) * m3
        + formationPaper * m4
        + (splitPaper * 0.62 + weavePaper * 0.38) * m5
        + coilPaper * m6
        + voidPaper * m7
        + pulsePaper * m8
        + eruptionPaper * m9
        + fountainPaper * m10
        + globePaper * m11
        + reboundPaper * m12
        + tidePaper * m13
        + magneticPaper * m14
        + swarmPaper * m15
        + ingressPaper * m16
        + moltPaper * m17
        + ringsPaper * m18
        + canopyPaper * m19
        + lensPaper * m20
        + counterPaper * m21
        + cellularPaper * m22
        + reformPaper * m23
        + peristalticPaper * m24
        + loomPaper * m25
        + healingPaper * m26
        + mobiusPaper * m27
        + synthesisPaper * m28
        + unfurlPaper * m29
        + nucleusPaper * m30
        + perimeterPaper * m31;

      float alignmentFront = 0.5 + 0.38 * sin(t * 0.29);
      float alignmentOrder = smoothstep(
        alignmentFront - 0.26,
        alignmentFront + 0.18,
        uv.x + sin(uv.y * 8.0 + t * 0.18) * 0.055
      );
      vec2 latent = vec2(
        sin(uv.x * 9.0 + uv.y * 7.0 + t * 0.43 + sin(uv.y * 5.0)),
        cos(uv.y * 8.0 - uv.x * 5.0 - t * 0.37 + sin(uv.x * 4.0))
      ) * 7.8;
      vec2 ordered = vec2(
        sin(uv.y * 9.0 + t * 0.42) * 7.2,
        cos(uv.x * 4.2 - t * 0.25) * 2.8
      );
      vec2 alignmentFlow = mix(latent, ordered, alignmentOrder);
      float alignmentAngle = mix(
        sin(uv.x * 8.0 + uv.y * 6.0 + t * 0.41) * 0.22,
        cos(uv.y * 7.0 + t * 0.33) * 0.12,
        alignmentOrder
      );

      vec2 seed = vec2(0.19, 0.57);
      vec2 seedDelta = uv - seed;
      float seedDistance = length(seedDelta * vec2(1.0, 1.18));
      float propagationPhase = seedDistance * 34.0 - t * 2.25 - rowPhase * 0.08;
      float propagationWave = sin(propagationPhase)
        * exp(-seedDistance * 1.32);
      float propagationLift = smoothstep(-0.15, 0.9, propagationWave);
      vec2 propagationNormal = normalize(seedDelta + vec2(0.001));
      vec2 propagationFlow = propagationNormal * propagationWave * 15.0
        + vec2(5.0, -2.0) * propagationLift;
      float propagationAngle = atan(propagationNormal.y, propagationNormal.x) * 0.16
        + propagationWave * 0.17;

      float upperCurve = 0.32 + sin(uv.x * 4.6 + t * 0.23) * 0.055;
      float lowerCurve = 0.70 + cos(uv.x * 4.1 - t * 0.19) * 0.065;
      float upperStream = softBand(uv.y, upperCurve, 0.15);
      float lowerStream = softBand(uv.y, lowerCurve, 0.16);
      float merge = smoothstep(0.18, 0.69, uv.x) * (1.0 - smoothstep(0.72, 1.03, uv.x));
      float exchange = sin(uv.x * 8.4 - t * 0.74 + rowPhase * 0.14);
      vec2 confluenceFlow = vec2(
        (upperStream + lowerStream) * (7.0 + exchange * 3.2),
        upperStream * merge * 27.0 - lowerStream * merge * 27.0
          + exchange * (upperStream + lowerStream) * 3.8
      );
      float confluenceAngle = (upperStream - lowerStream) * merge * 0.24
        + exchange * (upperStream + lowerStream) * 0.08;

      float horizonWidth = 0.055 + smoothstep(0.03, 0.92, uv.x) * 0.18;
      float horizonDistance = abs(uv.y - 0.52);
      float horizonPressure = 1.0 - smoothstep(
        horizonWidth,
        horizonWidth + 0.24,
        horizonDistance
      );
      float horizonSide = uv.y < 0.52 ? -1.0 : 1.0;
      vec2 horizonFlow = vec2(
        8.0 * smoothstep(0.0, 1.0, uv.x),
        horizonSide * horizonPressure * (34.0 + 42.0 * uv.x)
      );
      float horizonAngle = horizonSide * horizonPressure * 0.18;

      vec2 meaningFlow = alignmentFlow * u_stage_mix.x
        + propagationFlow * u_stage_mix.y
        + confluenceFlow * u_stage_mix.z
        + horizonFlow * u_stage_mix.w;
      float meaningAngle = alignmentAngle * u_stage_mix.x
        + propagationAngle * u_stage_mix.y
        + confluenceAngle * u_stage_mix.z
        + horizonAngle * u_stage_mix.w;

      float modeMeaningGain = dot(u_mode_a, vec4(0.94, 0.86, 0.80, 1.05))
        + dot(u_mode_b, vec4(0.96, 0.98, 0.91, 0.90))
        + dot(u_mode_c, vec4(1.04, 1.02, 0.98, 0.94))
        + dot(u_mode_d, vec4(1.08, 0.96, 0.92, 1.02))
        + dot(u_mode_e, vec4(0.92, 0.88, 0.96, 1.00))
        + dot(u_mode_f, vec4(0.90, 1.06, 1.00, 0.94))
        + dot(u_mode_g, vec4(1.08, 0.94, 0.98, 1.02))
        + dot(u_mode_h, vec4(0.96, 0.90, 1.04, 0.94));
      vec2 position = a_position + ambient + meaningFlow * modeMeaningGain;

      vec2 quietCenter = vec2(0.30, 0.48);
      vec2 quietDelta = uv - quietCenter;
      vec2 quietRadius = vec2(
        mix(0.28, 0.32, u_stage_mix.x + u_stage_mix.w),
        mix(0.20, 0.24, u_stage_mix.x + u_stage_mix.w)
      );
      float quietIrregular = sin(atan(quietDelta.y, quietDelta.x) * 5.0 + t * 0.18) * 0.055
        + sin(uv.x * 13.0 - uv.y * 8.0 + t * 0.12) * 0.035;
      float quietDistance = length(quietDelta / quietRadius) + quietIrregular;
      float quietPressure = 1.0 - smoothstep(0.44, 1.12, quietDistance);
      float readingPressure = quietPressure * u_reading;
      vec2 quietDirection = normalize(quietDelta / (quietRadius * quietRadius) + vec2(0.001));
      float quietGain = dot(u_stage_mix, vec4(1.0, 0.78, 0.70, 1.12));
      position += quietDirection * readingPressure * quietGain * vec2(60.0, 46.0);

      float desktopRail = step(681.0, u_resolution.x);
      vec2 railCenter = mix(vec2(0.50, 0.085), vec2(0.84, 0.50), desktopRail);
      vec2 railRadius = mix(vec2(0.55, 0.075), vec2(0.20, 0.31), desktopRail);
      vec2 railDelta = uv - railCenter;
      float railIrregular = sin(
        atan(railDelta.y, railDelta.x) * 5.0 - t * 0.12
      ) * 0.045 + sin(uv.x * 12.0 + uv.y * 7.0 + t * 0.09) * 0.025;
      float railDistance = length(railDelta / railRadius) + railIrregular;
      float railPaper = (1.0 - smoothstep(0.40, 1.10, railDistance)) * 0.76;

      vec2 pointerDelta = position - u_pointer.xy;
      float pointerDistance = length(pointerDelta);
      float pointerFalloff = exp(-pointerDistance * pointerDistance / 15500.0) * u_pointer.z;
      vec2 pointerNormal = normalize(pointerDelta + vec2(0.001));
      vec2 pointerTangent = vec2(-pointerNormal.y, pointerNormal.x);
      vec2 alignPointer = pointerTangent * dot(u_pointer_velocity, pointerTangent) * 0.045;
      vec2 agentPointer = pointerNormal * sin(pointerDistance * 0.055 - t * 3.2) * 12.0;
      vec2 businessPointer = pointerTangent * 13.0
        + pointerNormal * sin(pointerDistance * 0.035 - t * 1.8) * 4.0;
      vec2 horizonPointer = vec2(pointerNormal.x * 5.0, pointerNormal.y * 16.0);
      vec2 pointerFlow = alignPointer * u_stage_mix.x
        + agentPointer * u_stage_mix.y
        + businessPointer * u_stage_mix.z
        + horizonPointer * u_stage_mix.w;
      float pointerModeGain = dot(u_mode_a, vec4(0.96, 1.08, 0.86, 1.04))
        + dot(u_mode_b, vec4(0.92, 1.00, 0.94, 0.92))
        + dot(u_mode_c, vec4(1.12, 1.04, 1.08, 0.92))
        + dot(u_mode_d, vec4(1.16, 0.98, 1.04, 1.12))
        + dot(u_mode_e, vec4(1.08, 0.92, 1.12, 1.02))
        + dot(u_mode_f, vec4(1.06, 1.12, 1.00, 0.96))
        + dot(u_mode_g, vec4(1.10, 1.02, 0.96, 1.08))
        + dot(u_mode_h, vec4(1.02, 0.98, 1.06, 0.94));
      position += pointerFlow * pointerFalloff * pointerModeGain;

      vec2 clip = position / u_resolution * 2.0 - 1.0;
      clip.y *= -1.0;
      gl_Position = vec4(clip, 0.0, 1.0);

      float microBreath = sin(uv.x * 7.0 + uv.y * 5.0 + t * 0.48) * 0.042;
      float modeBreath = dot(u_mode_a, vec4(0.94, 0.96, 0.88, 1.02))
        + dot(u_mode_b, vec4(0.92, 0.98, 1.04, 0.90))
        + dot(u_mode_c, vec4(1.18, 1.04, 1.02, 0.90))
        + dot(u_mode_d, vec4(1.10, 1.06, 0.94, 1.08))
        + dot(u_mode_e, vec4(1.04, 0.92, 1.02, 1.08))
        + dot(u_mode_f, vec4(0.94, 1.10, 1.06, 0.98))
        + dot(u_mode_g, vec4(1.12, 1.00, 0.96, 1.04))
        + dot(u_mode_h, vec4(0.98, 0.92, 1.08, 0.96));
      float pulseSize = 1.0 + compressionSignal * 0.095 * m8;
      float behaviorSize = 1.0
        + max(plumeColumn * 0.035, plumeCap * 0.050) * m9
        + fountainJet * 0.045 * m10
        + globeBody * globeOrbit * 0.035 * m11
        + abs(reboundSignal) * 0.025 * m12
        + ringField * 0.035 * m18
        + canopyField * 0.040 * m19
        + cellularActive * 0.030 * m22
        + peristalticContract * peristalticBody * 0.040 * m24
        + mobiusBand * mobiusTurn * 0.030 * m27
        + nucleusFront * 0.028 * m30;
      float quietCompression = mix(1.0, 0.86, readingPressure);
      gl_PointSize = (38.0 + toneSeed * 8.0)
        * (1.0 + microBreath * modeBreath)
        * pulseSize
        * behaviorSize
        * quietCompression
        * u_dpr;

      float pointerAngle = pointerFalloff * dot(pointerFlow, pointerTangent) * 0.004;
      float modeAngle = m1 * sin(risingPhase) * 0.08
        + m2 * 0.09
        + m4 * formationWave * formationPresence * 0.055
        + m5 * splitPolarity * splitProgress * 0.13
        + m6 * coilBody * (0.11 + coilBand * 0.11)
        + m7 * voidNormal.y * voidPressure * 0.13
        + m9 * capNormal.x * plumeCap * 0.11
        + m10 * fountainSide * fountainArc * 0.13
        + m11 * globeOrbit * globeBody * 0.08
        + m12 * reboundSignal * 0.04
        + m13 * tideSignal * 0.09
        + m14 * (poleDistanceA - poleDistanceB) * 0.08
        + m15 * (1.0 - swarmOrder) * broadA * 0.08
        + m16 * ingressArms * ingressPresence * 0.11
        + m17 * moltBand * 0.10
        + m18 * (ringA - ringB + ringC) * 0.08
        + m19 * canopySide * canopyField * 0.09
        + m20 * lensNormal.y * lensPressure * 0.13
        + m21 * counterDirection * counterSeam * 0.10
        + m22 * (cellularA - cellularB) * cellularActive * 0.045
        + m23 * reformEdge * 0.08
        + m24 * peristalticSide * peristalticContract * peristalticBody * 0.10
        + m25 * loomDirection * loomField * 0.08
        + m26 * healingSide * healingPressure * 0.08
        + m27 * mobiusTurn * mobiusBand * 0.13
        + m28 * synthesisDirection.y * synthesisField * 0.08
        + m29 * unfurlSide * unfurlPressure * 0.09
        + m30 * nucleusFront * 0.08
        + m31 * (perimeterTangent.x + perimeterTangent.y) * perimeterField * 0.07;
      v_angle = meaningAngle + broadA * 0.07 + broadB * 0.045
        + pointerAngle + modeAngle;
      float macroDensity = 0.5 + 0.5 * sin(
        position.x * 0.010
          + sin(position.y * 0.008 + t * 0.16) * 2.4
      );
      float crossDensity = 0.5 + 0.5 * cos(
        position.y * 0.014 - t * 0.14 + phase * 0.35
      );
      v_tone = 0.08
        + macroDensity * 0.20
        + crossDensity * 0.07
        + toneSeed * 0.04;
      v_quiet = readingPressure;
      v_paper = max(clamp(modePaper, 0.0, 1.0), railPaper);
    }
  `

  const fragmentSource = `
    precision mediump float;

    uniform sampler2D u_texture;
    varying float v_tone;
    varying float v_angle;
    varying float v_quiet;
    varying float v_paper;

    void main() {
      vec2 centered = gl_PointCoord - vec2(0.5);
      float c = cos(v_angle);
      float s = sin(v_angle);
      vec2 uv = mat2(c, -s, s, c) * centered + vec2(0.5);
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;

      float alpha = texture2D(u_texture, uv).a;
      if (alpha <= 0.015) discard;

      vec3 terracotta100 = vec3(0.9529, 0.8510, 0.8235);
      vec3 terracotta500 = vec3(0.6510, 0.3098, 0.2353);
      float tone = smoothstep(0.09, 0.36, v_tone);
      vec3 color = mix(terracotta100, terracotta500, tone);
      float paperMix = max(v_quiet, v_paper);
      color = mix(color, vec3(0.9725, 0.9725, 0.9608), paperMix);
      gl_FragColor = vec4(color, alpha);
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
  const metaBuffer = requireValue(gl.createBuffer(), "metadata buffer")

  const attribute = (name: string) => {
    const location = gl.getAttribLocation(program, name)
    if (location < 0) throw new Error(`Missing WebGL attribute: ${name}`)
    return location
  }
  const uniform = (name: string) => (
    requireValue(gl.getUniformLocation(program, name), `uniform ${name}`)
  )

  const positionLocation = attribute("a_position")
  const metaLocation = attribute("a_meta")
  const resolutionLocation = uniform("u_resolution")
  const timeLocation = uniform("u_time")
  const dprLocation = uniform("u_dpr")
  const reducedLocation = uniform("u_reduced")
  const modeALocation = uniform("u_mode_a")
  const modeBLocation = uniform("u_mode_b")
  const modeCLocation = uniform("u_mode_c")
  const modeDLocation = uniform("u_mode_d")
  const modeELocation = uniform("u_mode_e")
  const modeFLocation = uniform("u_mode_f")
  const modeGLocation = uniform("u_mode_g")
  const modeHLocation = uniform("u_mode_h")
  const stageMixLocation = uniform("u_stage_mix")
  const scrollLocation = uniform("u_scroll")
  const readingLocation = uniform("u_reading")
  const pointerLocation = uniform("u_pointer")
  const pointerVelocityLocation = uniform("u_pointer_velocity")

  const seeded = (row: number, column: number) => {
    const value = Math.sin((row + 47) * 61.71 + (column + 29) * 37.19)
      * 43758.5453
    return value - Math.floor(value)
  }

  const upload = (
    buffer: WebGLBuffer,
    location: number,
    values: Float32Array,
    size: number,
  ) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0)
  }

  const rebuild = () => {
    const stepX = width < 680 ? 29 : 30
    const stepY = width < 680 ? 19 : 20
    const columns = Math.ceil(width / stepX) + 8
    const rows = Math.ceil(height / stepY) + 9
    const positions: number[] = []
    const metadata: number[] = []

    for (let row = rows; row >= -5; row -= 1) {
      const offset = Math.abs(row % 2) === 1 ? stepX * 0.5 : 0
      for (let column = -5; column < columns; column += 1) {
        const noise = seeded(row, column)
        positions.push(column * stepX + offset, row * stepY)
        metadata.push(
          noise * Math.PI * 2,
          seeded(row + 89, column + 31),
          row * 0.73,
          column * 0.67,
        )
      }
    }

    pointCount = positions.length / 2
    upload(positionBuffer, positionLocation, new Float32Array(positions), 2)
    upload(metaBuffer, metaLocation, new Float32Array(metadata), 4)
  }

  const resize = () => {
    if (disposed) return
    const rect = canvas.getBoundingClientRect()
    width = Math.max(1, rect.width)
    height = Math.max(1, rect.height)
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
    rebuild()
  }

  const texture = requireValue(gl.createTexture(), "scale texture")
  const textureImage = new Image()
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

  const approach = (current: number, target: number, delta: number, responseMs: number) => {
    if (reducedMotion) return target
    return current + (target - current) * (1 - Math.exp(-delta / responseMs))
  }

  const render = (now: number) => {
    if (disposed) return
    const delta = previousTime === null ? 16 : Math.min(64, Math.max(0, now - previousTime))
    previousTime = now
    const state = getState()
    const mode = Math.max(0, Math.min(31, Math.round(state.mode)))
    const stage = Math.max(0, Math.min(3, Math.round(state.stage)))
    const scrollTarget = Math.max(-1.6, Math.min(1.6, state.scroll))

    for (let index = 0; index < modeMix.length; index += 1) {
      modeMix[index] = approach(modeMix[index], index === mode ? 1 : 0, delta, 430)
    }
    for (let index = 0; index < stageMix.length; index += 1) {
      stageMix[index] = approach(stageMix[index], index === stage ? 1 : 0, delta, 720)
    }
    fieldScroll = approach(fieldScroll, scrollTarget, delta, 150)

    pointer.x = approach(pointer.x, pointer.targetX, delta, 62)
    pointer.y = approach(pointer.y, pointer.targetY, delta, 62)
    pointer.strength = approach(pointer.strength, pointer.targetStrength, delta, 110)
    pointer.velocityX = approach(pointer.velocityX, 0, delta, 210)
    pointer.velocityY = approach(pointer.velocityY, 0, delta, 210)

    gl.clearColor(PAPER[0], PAPER[1], PAPER[2], PAPER[3])
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)
    gl.uniform2f(resolutionLocation, width, height)
    gl.uniform1f(timeLocation, now * 0.001)
    gl.uniform1f(dprLocation, dpr)
    gl.uniform1f(reducedLocation, reducedMotion ? 1 : 0)
    gl.uniform4fv(modeALocation, modeMix.subarray(0, 4))
    gl.uniform4fv(modeBLocation, modeMix.subarray(4, 8))
    gl.uniform4fv(modeCLocation, modeMix.subarray(8, 12))
    gl.uniform4fv(modeDLocation, modeMix.subarray(12, 16))
    gl.uniform4fv(modeELocation, modeMix.subarray(16, 20))
    gl.uniform4fv(modeFLocation, modeMix.subarray(20, 24))
    gl.uniform4fv(modeGLocation, modeMix.subarray(24, 28))
    gl.uniform4fv(modeHLocation, modeMix.subarray(28, 32))
    gl.uniform4fv(stageMixLocation, stageMix)
    gl.uniform1f(scrollLocation, fieldScroll)
    gl.uniform1f(readingLocation, Math.max(0, Math.min(1, state.reading)))
    gl.uniform4f(pointerLocation, pointer.x, pointer.y, pointer.strength, 0)
    gl.uniform2f(pointerVelocityLocation, pointer.velocityX, pointer.velocityY)
    gl.drawArrays(gl.POINTS, 0, pointCount)
    frame = requestAnimationFrame(render)
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
    resize()
    canvas.dataset.fieldState = "ready"
    frame = requestAnimationFrame(render)
  }

  const onTextureError = () => {
    canvas.dataset.fieldState = "texture-error"
  }
  const onPointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const now = event.timeStamp
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const elapsed = Math.max(8, now - pointer.lastTime)
    pointer.targetX = x
    pointer.targetY = y
    pointer.velocityX = Math.max(-520, Math.min(520, (x - pointer.lastX) / elapsed * 1000))
    pointer.velocityY = Math.max(-520, Math.min(520, (y - pointer.lastY) / elapsed * 1000))
    pointer.targetStrength = 1
    pointer.lastX = x
    pointer.lastY = y
    pointer.lastTime = now
  }
  const onPointerLeave = () => {
    pointer.targetStrength = 0
  }
  const onReducedMotionChange = (event: MediaQueryListEvent) => {
    reducedMotion = event.matches
  }

  textureImage.addEventListener("load", onTextureLoad)
  textureImage.addEventListener("error", onTextureError)
  textureImage.src = "/textures/openboa-scale-cutout-aa-1024.png"
  window.addEventListener("pointermove", onPointerMove, { passive: true })
  document.addEventListener("pointerleave", onPointerLeave)
  window.addEventListener("resize", resize, { passive: true })
  reducedMotionQuery.addEventListener("change", onReducedMotionChange)

  return () => {
    disposed = true
    cancelAnimationFrame(frame)
    textureImage.removeEventListener("load", onTextureLoad)
    textureImage.removeEventListener("error", onTextureError)
    window.removeEventListener("pointermove", onPointerMove)
    document.removeEventListener("pointerleave", onPointerLeave)
    window.removeEventListener("resize", resize)
    reducedMotionQuery.removeEventListener("change", onReducedMotionChange)
    gl.deleteTexture(texture)
    gl.deleteBuffer(positionBuffer)
    gl.deleteBuffer(metaBuffer)
    gl.deleteProgram(program)
  }
}
