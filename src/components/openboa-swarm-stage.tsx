"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { UPRIGHT_9_PATH } from "@/lib/brand";
import { useOpenBoa } from "@/components/openboa-context";

// Ultra-lean 36-point simplified 3D Upright 9 micro-wafer (~144 tris, crisp faceted edges)
function buildMicroUpright9Geometry(): THREE.ExtrudeGeometry {
  const loader = new SVGLoader();
  const svgDoc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="7 3 114 114"><path d="${UPRIGHT_9_PATH}"/></svg>`;
  const parsed = loader.parse(svgDoc);
  const rawShapes: THREE.Shape[] = [];
  for (const path of parsed.paths) {
    rawShapes.push(...path.toShapes());
  }

  const pts = rawShapes[0].getSpacedPoints(36);
  const simpleShape = new THREE.Shape(pts);

  const geometry = new THREE.ExtrudeGeometry(simpleShape, {
    depth: 18,
    bevelEnabled: false,
    curveSegments: 1,
  });

  geometry.scale(1, -1, 1);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  geometry.translate(-center.x, -center.y, -center.z);
  const maxDim = Math.max(size.x, size.y, 1);
  const norm = 0.045 / maxDim;
  geometry.scale(norm, norm, norm);
  geometry.computeVertexNormals();
  return geometry;
}

const SYMBOL_SWARM_VERTEX = /* glsl */ `
  attribute vec3 aPosHome;
  attribute vec3 aPosSphere;
  attribute vec3 aPosHorizon;
  attribute vec3 aPosApproach;
  attribute vec3 aRotAxis;
  attribute float aSeed;
  attribute float aScale;

  uniform float uTime;
  uniform float uOrbitAngle;
  uniform float uTunnelTravel;
  uniform float uBlendSphere;
  uniform float uBlendHorizon;
  uniform float uApproach;
  uniform float uRightBias;
  uniform float uApproachCenterX;
  uniform vec3 uCursor3D;
  uniform float uCharge;
  uniform float uBurst;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vEnergy;
  varying float vDepth;
  varying float vSeed;
  varying float vTextCalm;

  vec3 flowField(vec3 p, float t) {
    float x = sin(p.y * 0.54 + t * 0.65) + cos(p.z * 0.46 - t * 0.50);
    float y = sin(p.z * 0.50 + t * 0.58) + cos(p.x * 0.44 + t * 0.53);
    float z = sin(p.x * 0.54 - t * 0.62) + cos(p.y * 0.48 + t * 0.45);
    return vec3(x, y, z) * 0.40;
  }

  vec3 rotateAxis(vec3 v, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
  }

  void main() {
    // 1. Home / Vision Orbital Topologies (Möbius Wave -> Meridian Sphere -> Open Horizon)
    vec3 basePos = mix(aPosHome, aPosSphere, uBlendSphere);
    basePos = mix(basePos, aPosHorizon, uBlendHorizon);

    vec3 anchor = vec3(uRightBias, 0.0, -1.6);
    vec3 localOrbit = basePos - anchor;
    float ca = cos(uOrbitAngle);
    float sa = sin(uOrbitAngle);
    localOrbit.xz = mat2(ca, -sa, sa, ca) * localOrbit.xz;
    vec3 orbitalWorld = localOrbit + anchor;

    // 2. Distinct /approach Topology:
    //    Receding Rectilinear Architectural Wall-Planes with Breached Portal Corridor
    vec3 appLocal = aPosApproach;
    float zSpan = 10.8;
    float zMin = -7.8;
    float wrappedZ = mod(appLocal.z - zMin + uTunnelTravel, zSpan) + zMin;
    float edgeFade = smoothstep(zMin, zMin + 1.1, wrappedZ) * smoothstep(zMin + zSpan, zMin + zSpan - 1.1, wrappedZ);
    appLocal.z = wrappedZ;

    float archYaw = -0.36 + sin(uTime * 0.22) * 0.045;
    float cy = cos(archYaw);
    float sy = sin(archYaw);
    vec3 appCentered = vec3(appLocal.x, appLocal.y, appLocal.z + 2.4);
    appCentered.xz = mat2(cy, -sy, sy, cy) * appCentered.xz;
    vec3 approachAnchor = vec3(uApproachCenterX, 0.0, -2.4);
    vec3 approachWorld = appCentered + approachAnchor;

    vec3 activeAnchor = mix(anchor, approachAnchor, uApproach);
    vec3 worldCenter = mix(orbitalWorld, approachWorld, uApproach);

    // 3. Living fluid turbulence (calmer on rectilinear Approach walls so orthogonal lines stay sharp)
    vec3 flow = flowField(worldCenter * 0.58 + vec3(aSeed * 0.3), uTime + aSeed * 0.45);
    float calmStruct = clamp(uBlendSphere * 0.65 + uApproach * 0.88, 0.0, 0.9);
    worldCenter += flow * mix(0.54, 0.08, calmStruct);

    // 4. Cursor gravitational vortex (or architectural shear on /approach)
    vec3 toCur = worldCenter - uCursor3D;
    float dCur = length(toCur);
    float infl = exp(-dCur * dCur * 0.14);
    vec3 swirl = normalize(cross(toCur + vec3(0.0001), vec3(0.0, 0.0, 1.0)));
    vec3 shear = vec3(0.0, 0.0, 1.45) + normalize(toCur + vec3(0.0001)) * 0.95;
    vec3 cursorPush = mix(
      swirl * 1.55 + normalize(toCur + vec3(0.0001)) * 0.85,
      shear,
      uApproach
    );
    worldCenter += cursorPush * infl;

    // 5. Hold-to-break singularity implosion -> release shockwave burst
    vec3 fromCenter = worldCenter - activeAnchor;
    float radialLen = max(length(fromCenter), 0.001);
    vec3 dir = fromCenter / radialLen;
    worldCenter = mix(
      worldCenter,
      activeAnchor + dir * (0.95 + fract(aSeed * 7.3) * 1.65) + swirl * 1.5,
      uCharge * 0.78
    );
    worldCenter += dir * uBurst * (2.8 + fract(aSeed * 13.7) * 4.2);

    float energy = clamp(infl * 0.95 + uCharge * 0.9 + uBurst * 0.95 + length(flow) * 0.34, 0.0, 1.0);

    // 6. Faceted 3D micro-symbol orientation
    float spinAngle = mix(
      uOrbitAngle * (1.4 + fract(aSeed * 5.7) * 1.6) + uTime * 0.28,
      uTime * 0.45 + wrappedZ * 0.35,
      uApproach
    ) + aSeed * 6.28318 + infl * 2.4 + uCharge * 4.8 + uBurst * 3.6;

    float seamScale = mix(1.0, edgeFade, uApproach);
    vec3 localPos = position * aScale * seamScale * (1.0 + energy * 0.36);
    vec3 rotatedPos = rotateAxis(localPos, aRotAxis, spinAngle);
    vec3 rotatedNormal = rotateAxis(normal, aRotAxis, spinAngle);

    vec4 mvPos = modelViewMatrix * vec4(worldCenter + rotatedPos, 1.0);
    vec4 clipPos = projectionMatrix * mvPos;

    // Soften symbols passing directly behind left reading corridor for crisp editorial legibility
    vec2 ndc = clipPos.xy / max(clipPos.w, 0.001);
    float readingZone = exp(-dot((ndc - vec2(-0.36, -0.04)) * vec2(1.4, 2.0), (ndc - vec2(-0.36, -0.04)) * vec2(1.4, 2.0)));
    vTextCalm = readingZone * (1.0 - clamp(uRightBias * 0.18 + uApproach * 0.35, 0.0, 0.85));

    vNormal = normalize(normalMatrix * rotatedNormal);
    vViewDir = normalize(-mvPos.xyz);
    vDepth = max(-mvPos.z, 1.0);
    vEnergy = energy;
    vSeed = aSeed;

    gl_Position = clipPos;
  }
`;

const SYMBOL_SWARM_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uPolarity;
  uniform float uApproach;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vEnergy;
  varying float vDepth;
  varying float vSeed;
  varying float vTextCalm;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);

    vec3 keyDir = normalize(vec3(0.42, 0.78, 0.55));
    vec3 fillDir = normalize(vec3(-0.62, -0.22, 0.68));
    float diffKey = max(dot(n, keyDir), 0.0);
    float diffFill = max(dot(n, fillDir), 0.0);
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 2.1);
    float spec = pow(max(dot(reflect(-keyDir, n), v), 0.0), 20.0);

    vec3 lSky = vec3(0.968, 0.974, 0.982);
    vec3 lInk = mix(vec3(0.095, 0.335, 0.475), vec3(0.075, 0.255, 0.385), uApproach);
    vec3 lSlate = mix(vec3(0.425, 0.655, 0.795), vec3(0.28, 0.45, 0.58), uApproach);
    vec3 lGlaze = vec3(0.92, 0.96, 0.99);

    vec3 lBase = mix(lInk, lSlate, 0.25 + fract(vSeed * 4.1) * 0.65);
    vec3 lightCol = lBase * (0.68 + diffKey * 0.48 + diffFill * 0.16)
      + lGlaze * (spec * 0.55 + fresnel * 0.45);
    lightCol = mix(lightCol, lSky, vTextCalm * 0.48);

    vec3 dSky = vec3(0.016, 0.022, 0.034);
    vec3 dObsidian = vec3(0.045, 0.105, 0.165);
    vec3 dInk = mix(vec3(0.11, 0.36, 0.51), vec3(0.16, 0.33, 0.44), uApproach);
    vec3 dRim = mix(vec3(0.475, 0.702, 0.839), vec3(0.72, 0.84, 0.93), uApproach);
    vec3 dHot = vec3(0.92, 0.97, 1.0);

    vec3 dBase = mix(dObsidian, dInk, 0.3 + fract(vSeed * 3.9) * 0.7);
    vec3 darkCol = dBase * (0.52 + diffKey * 0.82 + diffFill * 0.26)
      + dRim * (fresnel * 1.35 + spec * 0.88)
      + mix(dRim, dHot, vEnergy) * (vEnergy * 0.68);
    darkCol = mix(darkCol, dSky, vTextCalm * 0.34);

    vec3 col = mix(lightCol, darkCol, uPolarity);
    vec3 fogCol = mix(lSky, dSky, uPolarity);

    float fogFactor = smoothstep(8.2, 22.0, vDepth);
    col = mix(col, fogCol, fogFactor * 0.8);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const DUST_VERTEX = /* glsl */ `
  attribute vec3 aPosSphere;
  attribute vec3 aPosHorizon;
  attribute vec3 aPosApproach;
  attribute float aSeed;
  attribute float aSize;

  uniform float uTime;
  uniform float uOrbitAngle;
  uniform float uTunnelTravel;
  uniform float uBlendSphere;
  uniform float uBlendHorizon;
  uniform float uApproach;
  uniform float uRightBias;
  uniform float uApproachCenterX;
  uniform vec3 uCursor3D;
  uniform float uCharge;
  uniform float uBurst;
  uniform float uPixelRatio;

  varying float vEnergy;
  varying float vDepth;
  varying float vSeed;
  varying float vEdgeFade;

  vec3 flowField(vec3 p, float t) {
    float x = sin(p.y * 0.54 + t * 0.65) + cos(p.z * 0.46 - t * 0.50);
    float y = sin(p.z * 0.50 + t * 0.58) + cos(p.x * 0.44 + t * 0.53);
    float z = sin(p.x * 0.54 - t * 0.62) + cos(p.y * 0.48 + t * 0.45);
    return vec3(x, y, z) * 0.40;
  }

  void main() {
    vec3 basePos = mix(position, aPosSphere, uBlendSphere);
    basePos = mix(basePos, aPosHorizon, uBlendHorizon);

    vec3 anchor = vec3(uRightBias, 0.0, -1.6);
    vec3 localOrbit = basePos - anchor;
    float ca = cos(uOrbitAngle);
    float sa = sin(uOrbitAngle);
    localOrbit.xz = mat2(ca, -sa, sa, ca) * localOrbit.xz;
    vec3 orbitalWorld = localOrbit + anchor;

    vec3 appLocal = aPosApproach;
    float zSpan = 10.8;
    float zMin = -7.8;
    float wrappedZ = mod(appLocal.z - zMin + uTunnelTravel, zSpan) + zMin;
    float edgeFade = smoothstep(zMin, zMin + 1.1, wrappedZ) * smoothstep(zMin + zSpan, zMin + zSpan - 1.1, wrappedZ);
    appLocal.z = wrappedZ;

    float archYaw = -0.36 + sin(uTime * 0.22) * 0.045;
    float cy = cos(archYaw);
    float sy = sin(archYaw);
    vec3 appCentered = vec3(appLocal.x, appLocal.y, appLocal.z + 2.4);
    appCentered.xz = mat2(cy, -sy, sy, cy) * appCentered.xz;
    vec3 approachAnchor = vec3(uApproachCenterX, 0.0, -2.4);
    vec3 approachWorld = appCentered + approachAnchor;

    vec3 activeAnchor = mix(anchor, approachAnchor, uApproach);
    vec3 p = mix(orbitalWorld, approachWorld, uApproach);

    vec3 flow = flowField(p * 0.58 + vec3(aSeed * 0.3), uTime + aSeed * 0.45);
    float calmStruct = clamp(uBlendSphere * 0.65 + uApproach * 0.88, 0.0, 0.9);
    p += flow * mix(0.56, 0.08, calmStruct);

    vec3 toCur = p - uCursor3D;
    float dCur = length(toCur);
    float infl = exp(-dCur * dCur * 0.14);
    vec3 swirl = normalize(cross(toCur + vec3(0.0001), vec3(0.0, 0.0, 1.0)));
    vec3 shear = vec3(0.0, 0.0, 1.45) + normalize(toCur + vec3(0.0001)) * 0.95;
    p += mix(swirl * 1.55 + normalize(toCur + vec3(0.0001)) * 0.85, shear, uApproach) * infl;

    vec3 fromCenter = p - activeAnchor;
    float radialLen = max(length(fromCenter), 0.001);
    vec3 dir = fromCenter / radialLen;
    p = mix(p, activeAnchor + dir * (0.9 + fract(aSeed * 7.3) * 1.7) + swirl * 1.5, uCharge * 0.78);
    p += dir * uBurst * (3.0 + fract(aSeed * 13.7) * 4.2);

    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    vDepth = max(-mvPos.z, 1.0);
    vSeed = aSeed;
    vEdgeFade = mix(1.0, edgeFade, uApproach);
    vEnergy = clamp(infl * 0.95 + uCharge * 0.9 + uBurst * 0.95 + length(flow) * 0.34, 0.0, 1.0);

    gl_PointSize = clamp(aSize * (15.0 / vDepth) * uPixelRatio * (1.0 + vEnergy * 0.6), 1.0, 5.8);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const DUST_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uPolarity;
  uniform float uApproach;

  varying float vEnergy;
  varying float vDepth;
  varying float vSeed;
  varying float vEdgeFade;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;

    float core = smoothstep(0.5, 0.08, r);
    float depthFade = smoothstep(26.0, 4.5, vDepth);

    vec3 lightCol = mix(vec3(0.11, 0.35, 0.49), vec3(0.45, 0.68, 0.82), fract(vSeed * 4.3));
    vec3 darkCol = mix(
      mix(vec3(0.24, 0.54, 0.72), vec3(0.46, 0.64, 0.78), uApproach),
      vec3(0.9, 0.97, 1.0),
      vEnergy * 0.78 + fract(vSeed * 3.1) * 0.22
    );

    vec3 col = mix(lightCol, darkCol, uPolarity);
    float alpha = core * depthFade * vEdgeFade * mix(0.42, 0.72, uPolarity) * (0.4 + vEnergy * 0.6);

    gl_FragColor = vec4(col, alpha);
  }
`;

function populateVisionTopologies(
  i: number,
  total: number,
  rand: () => number,
  homeOut: Float32Array,
  sphereOut: Float32Array,
  horizonOut: Float32Array,
  approachOut: Float32Array
) {
  const i3 = i * 3;
  const u = rand() * Math.PI * 2;
  const v = rand() * Math.PI * 2;
  const spread = (rand() - 0.5) * 0.9;

  // Topology 1 (Act 01 · Threshold): Full-bleed sweeping 3D Hyperbolic Möbius Manifold
  if (i < total * 0.82) {
    const majorR = 5.8 + Math.sin(u * 2.0) * 1.45;
    const minorR = 1.55 + Math.cos(u * 3.0) * 0.5;
    const twist = u * 1.5;
    const rx = (majorR + (minorR * Math.cos(v + twist) + spread * 0.45)) * Math.cos(u);
    const ry = (minorR * Math.sin(v + twist) + Math.sin(u * 2.0) * 1.35) * 0.92;
    const rz = (majorR + minorR * Math.cos(v + twist)) * Math.sin(u) * 0.68;
    homeOut[i3] = rx * 1.24 + 0.65;
    homeOut[i3 + 1] = ry * 1.12;
    homeOut[i3 + 2] = rz - 1.6;
  } else {
    homeOut[i3] = (rand() - 0.5) * 24.0;
    homeOut[i3 + 1] = (rand() - 0.5) * 13.5;
    homeOut[i3 + 2] = (rand() - 0.5) * 11.0 - 3.0;
  }

  // Topology 2 (Act 02 · Fracture / /vision): Architectural 3D Meridian Sphere anchored on right half
  if (i < total * 0.72) {
    const phi = Math.acos(2 * rand() - 1);
    const theta = Math.floor(rand() * 24) * (Math.PI / 12) + (rand() - 0.5) * 0.045;
    const r = 3.5 + (rand() - 0.5) * 0.12;
    sphereOut[i3] = 4.2 + r * Math.sin(phi) * Math.cos(theta);
    sphereOut[i3 + 1] = r * Math.cos(phi);
    sphereOut[i3 + 2] = -1.6 + r * Math.sin(phi) * Math.sin(theta);
  } else {
    const ringR = 4.75 + (rand() - 0.5) * 1.65;
    sphereOut[i3] = 4.2 + Math.cos(u) * ringR;
    sphereOut[i3 + 1] = (rand() - 0.5) * 0.14;
    sphereOut[i3 + 2] = -1.6 + Math.sin(u) * ringR;
  }

  // Topology 3 (Act 03 · Horizon): Expanding Open Orbital Canopy
  if (i < total * 0.7) {
    const ringIdx = i % 5;
    const radius = 3.2 + ringIdx * 1.85 + (rand() - 0.5) * 0.45;
    const elev = Math.sin(u * 2.0 + ringIdx * 0.8) * 1.35 + (ringIdx - 2) * 0.52;
    horizonOut[i3] = Math.cos(u) * radius * 1.18 + 1.2;
    horizonOut[i3 + 1] = elev + (rand() - 0.5) * 0.45;
    horizonOut[i3 + 2] = Math.sin(u) * radius * 0.78 - 1.8;
  } else {
    const rExp = 6.5 + rand() * 8.0;
    const phiH = Math.acos(2 * rand() - 1);
    horizonOut[i3] = rExp * Math.sin(phiH) * Math.cos(u) + 1.0;
    horizonOut[i3 + 1] = rExp * Math.cos(phiH) * 0.58;
    horizonOut[i3 + 2] = rExp * Math.sin(phiH) * Math.sin(u) - 3.0;
  }

  // Topology 4 (/approach · "How walls give way."):
  // Pure Rectilinear Architectural Wall-Planes with an Open Breached Corridor & Kinetic Momentum Rails
  if (i < total * 0.62) {
    const planeIdx = i % 6;
    const zPlane = -7.2 + planeIdx * 1.8 + (rand() - 0.5) * 0.06;
    const isVerticalRib = rand() < 0.52;
    let lx: number;
    let ly: number;

    if (isVerticalRib) {
      const col = Math.floor(rand() * 11) - 5;
      lx = col * 0.6 + (rand() - 0.5) * 0.045;
      ly = (rand() - 0.5) * 7.4;
    } else {
      const row = Math.floor(rand() * 13) - 6;
      lx = (rand() - 0.5) * 6.2;
      ly = row * 0.6 + (rand() - 0.5) * 0.045;
    }

    const breachW = 1.25;
    const breachH = 1.55;
    if (Math.abs(lx) < breachW && Math.abs(ly) < breachH) {
      if (rand() < 0.5) {
        lx = (lx >= 0 ? 1 : -1) * (breachW + (rand() - 0.5) * 0.08);
      } else {
        ly = (ly >= 0 ? 1 : -1) * (breachH + (rand() - 0.5) * 0.08);
      }
    }

    approachOut[i3] = lx;
    approachOut[i3 + 1] = ly;
    approachOut[i3 + 2] = zPlane;
  } else if (i < total * 0.88) {
    const lane = i % 8;
    const angleIdx = (lane / 8) * Math.PI * 2;
    const railX =
      lane < 4
        ? (lane % 2 === 0 ? -1 : 1) * (0.45 + Math.floor(lane / 2) * 0.68)
        : Math.cos(angleIdx) * 0.92;
    const railY =
      lane < 4
        ? (lane < 2 ? -1 : 1) * 0.72
        : Math.sin(angleIdx) * 1.15;

    approachOut[i3] = railX + (rand() - 0.5) * 0.07;
    approachOut[i3 + 1] = railY + (rand() - 0.5) * 0.07;
    approachOut[i3 + 2] = -7.8 + rand() * 10.8;
  } else {
    const side = rand() < 0.5 ? -1 : 1;
    approachOut[i3] = side * (3.25 + rand() * 0.9);
    approachOut[i3 + 1] = (rand() - 0.5) * 8.0;
    approachOut[i3 + 2] = -7.8 + rand() * 10.8;
  }
}

export function OpenBoaSwarmStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { appearance, holding, setActiveAct, setOrbitDir } = useOpenBoa();
  const [webglFallback, setWebglFallback] = useState(false);

  const stateRef = useRef({
    targetPolarity: appearance === "dark" ? 1 : 0,
    currentPolarity: appearance === "dark" ? 1 : 0,
    routeKind: pathname.startsWith("/vision")
      ? "vision"
      : pathname.startsWith("/approach")
        ? "approach"
        : "home",
    externalHold: holding,
  });

  useEffect(() => {
    stateRef.current.targetPolarity = appearance === "dark" ? 1 : 0;
  }, [appearance]);

  useEffect(() => {
    stateRef.current.routeKind = pathname.startsWith("/vision")
      ? "vision"
      : pathname.startsWith("/approach")
        ? "approach"
        : "home";
  }, [pathname]);

  useEffect(() => {
    stateRef.current.externalHold = holding;
  }, [holding]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setWebglFallback(true));
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.innerHTML = "";
    container.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      80
    );
    camera.position.set(0, 0.35, 11.4);

    let rng = 2026;
    const rand = () => {
      rng = (rng * 16807) % 2147483647;
      return (rng - 1) / 2147483646;
    };

    // LAYER 1: 14,000 Ultra-Fine 3D Upright 9 Micro-Symbols
    const SYMBOL_COUNT = 14000;
    const baseSymbolGeo = buildMicroUpright9Geometry();
    const instGeo = new THREE.InstancedBufferGeometry();
    instGeo.index = baseSymbolGeo.index;
    instGeo.attributes.position = baseSymbolGeo.attributes.position;
    instGeo.attributes.normal = baseSymbolGeo.attributes.normal;

    const symHome = new Float32Array(SYMBOL_COUNT * 3);
    const symSphere = new Float32Array(SYMBOL_COUNT * 3);
    const symHorizon = new Float32Array(SYMBOL_COUNT * 3);
    const symApproach = new Float32Array(SYMBOL_COUNT * 3);
    const symAxis = new Float32Array(SYMBOL_COUNT * 3);
    const symSeeds = new Float32Array(SYMBOL_COUNT);
    const symScales = new Float32Array(SYMBOL_COUNT);

    for (let i = 0; i < SYMBOL_COUNT; i++) {
      populateVisionTopologies(
        i,
        SYMBOL_COUNT,
        rand,
        symHome,
        symSphere,
        symHorizon,
        symApproach
      );
      symSeeds[i] = rand();
      symScales[i] = 0.42 + Math.pow(rand(), 2.8) * 1.18;

      const ax = rand() * 2 - 1;
      const ay = rand() * 2 - 1;
      const az = rand() * 2 - 1;
      const len = Math.hypot(ax, ay, az) || 1;
      symAxis[i * 3] = ax / len;
      symAxis[i * 3 + 1] = ay / len;
      symAxis[i * 3 + 2] = az / len;
    }

    instGeo.setAttribute("aPosHome", new THREE.InstancedBufferAttribute(symHome, 3));
    instGeo.setAttribute("aPosSphere", new THREE.InstancedBufferAttribute(symSphere, 3));
    instGeo.setAttribute("aPosHorizon", new THREE.InstancedBufferAttribute(symHorizon, 3));
    instGeo.setAttribute("aPosApproach", new THREE.InstancedBufferAttribute(symApproach, 3));
    instGeo.setAttribute("aRotAxis", new THREE.InstancedBufferAttribute(symAxis, 3));
    instGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(symSeeds, 1));
    instGeo.setAttribute("aScale", new THREE.InstancedBufferAttribute(symScales, 1));
    instGeo.instanceCount = SYMBOL_COUNT;

    const symbolMat = new THREE.ShaderMaterial({
      vertexShader: SYMBOL_SWARM_VERTEX,
      fragmentShader: SYMBOL_SWARM_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uOrbitAngle: { value: 0 },
        uTunnelTravel: { value: 0 },
        uBlendSphere: { value: 0 },
        uBlendHorizon: { value: 0 },
        uApproach: { value: 0 },
        uRightBias: { value: 0 },
        uApproachCenterX: { value: 4.5 },
        uCursor3D: { value: new THREE.Vector3(0, 0, 0) },
        uCharge: { value: 0 },
        uBurst: { value: 0 },
        uPolarity: { value: stateRef.current.currentPolarity },
      },
    });

    const symbolSwarm = new THREE.Mesh(instGeo, symbolMat);
    symbolSwarm.frustumCulled = false;
    scene.add(symbolSwarm);

    // LAYER 2: 32,000 Ultra-Fine Luminous Field Sparks
    const DUST_COUNT = 32000;
    const dustHome = new Float32Array(DUST_COUNT * 3);
    const dustSphere = new Float32Array(DUST_COUNT * 3);
    const dustHorizon = new Float32Array(DUST_COUNT * 3);
    const dustApproach = new Float32Array(DUST_COUNT * 3);
    const dustSeeds = new Float32Array(DUST_COUNT);
    const dustSizes = new Float32Array(DUST_COUNT);

    for (let i = 0; i < DUST_COUNT; i++) {
      populateVisionTopologies(
        i,
        DUST_COUNT,
        rand,
        dustHome,
        dustSphere,
        dustHorizon,
        dustApproach
      );
      dustSeeds[i] = rand();
      dustSizes[i] = 0.45 + Math.pow(rand(), 2.2) * 1.25;
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustHome, 3));
    dustGeo.setAttribute("aPosSphere", new THREE.BufferAttribute(dustSphere, 3));
    dustGeo.setAttribute("aPosHorizon", new THREE.BufferAttribute(dustHorizon, 3));
    dustGeo.setAttribute("aPosApproach", new THREE.BufferAttribute(dustApproach, 3));
    dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dustSeeds, 1));
    dustGeo.setAttribute("aSize", new THREE.BufferAttribute(dustSizes, 1));

    const dustMat = new THREE.ShaderMaterial({
      vertexShader: DUST_VERTEX,
      fragmentShader: DUST_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uOrbitAngle: { value: 0 },
        uTunnelTravel: { value: 0 },
        uBlendSphere: { value: 0 },
        uBlendHorizon: { value: 0 },
        uApproach: { value: 0 },
        uRightBias: { value: 0 },
        uApproachCenterX: { value: 4.5 },
        uCursor3D: { value: new THREE.Vector3(0, 0, 0) },
        uCharge: { value: 0 },
        uBurst: { value: 0 },
        uPolarity: { value: stateRef.current.currentPolarity },
        uPixelRatio: { value: dpr },
      },
    });

    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // Circular Orbital Reticle Ring (Home & Vision only — hidden on /approach)
    const ringGeo = new THREE.RingGeometry(6.0, 6.03, 140);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#175174"),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.11,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI * 0.38;
    ringMesh.position.set(0.6, 0, -1.6);
    scene.add(ringMesh);

    // Dedicated /approach Rectilinear Architectural Portal Wireframes
    const portalGroup = new THREE.Group();
    const portalLineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#175174"),
      transparent: true,
      opacity: 0,
    });
    const portalGeos: THREE.BufferGeometry[] = [];
    const portalMeshes: { mesh: THREE.LineLoop; baseZ: number }[] = [];

    const makeRectGeo = (w: number, h: number) => {
      const hw = w / 2;
      const hh = h / 2;
      const pts = [
        new THREE.Vector3(-hw, -hh, 0),
        new THREE.Vector3(hw, -hh, 0),
        new THREE.Vector3(hw, hh, 0),
        new THREE.Vector3(-hw, hh, 0),
      ];
      return new THREE.BufferGeometry().setFromPoints(pts);
    };

    const innerRectGeo = makeRectGeo(2.5, 3.1);
    const outerRectGeo = makeRectGeo(6.0, 7.2);
    portalGeos.push(innerRectGeo, outerRectGeo);

    for (let k = 0; k < 6; k++) {
      const zPlane = -7.2 + k * 1.8;
      const innerLoop = new THREE.LineLoop(innerRectGeo, portalLineMat);
      innerLoop.position.z = zPlane + 2.4;
      portalGroup.add(innerLoop);
      portalMeshes.push({ mesh: innerLoop, baseZ: zPlane });

      const outerLoop = new THREE.LineLoop(outerRectGeo, portalLineMat);
      outerLoop.position.z = zPlane + 2.4;
      portalGroup.add(outerLoop);
      portalMeshes.push({ mesh: outerLoop, baseZ: zPlane });
    }
    portalGroup.position.set(4.5, 0, -2.4);
    scene.add(portalGroup);

    const lightBg = new THREE.Color("#F7F8FA");
    const darkBg = new THREE.Color("#04060A");
    const curBg = lightBg.clone().lerp(darkBg, stateRef.current.currentPolarity);
    const lightRingCol = new THREE.Color("#175174");
    const darkRingCol = new THREE.Color("#79B3D6");

    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollTarget = 0;
    let scrollCur = 0;
    let lastScrollY = window.scrollY;
    let pointerHolding = false;
    let wasHolding = false;
    let charge = 0;
    let burst = 0;
    let contextLost = false;

    let blendSphere = stateRef.current.routeKind === "vision" ? 1 : 0;
    let blendHorizon = 0;
    let blendApproach = stateRef.current.routeKind === "approach" ? 1 : 0;
    let rightBias =
      window.innerWidth < 860
        ? 0
        : stateRef.current.routeKind === "vision"
          ? 4.2
          : stateRef.current.routeKind === "approach"
            ? 4.55
            : 0;
    let approachCenterX = window.innerWidth < 860 ? 0.0 : 4.55;
    let lastReportedAct = 0;

    let orbitDirTarget = 1;
    let orbitDirSmooth = 1;
    let orbitImpulse = 0;
    let orbitAngle = 0;
    let tunnelTravel = 0;
    let lastNow = performance.now();

    const applyOrbitDir = (dir: number) => {
      const label = dir >= 0 ? "cw" : "ccw";
      document.documentElement.dataset.orbitDir = label;
      setOrbitDir(label);
    };
    applyOrbitDir(1);

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 0.5) return;
      const nextDir = e.deltaY > 0 ? 1 : -1;
      if (nextDir !== orbitDirTarget) {
        orbitDirTarget = nextDir;
        applyOrbitDir(nextDir);
      }
      orbitImpulse += Math.max(-0.55, Math.min(0.55, e.deltaY * 0.0042));
      orbitImpulse = Math.max(-1.6, Math.min(1.6, orbitImpulse));
    };

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScrollY;
      lastScrollY = y;
      if (Math.abs(dy) > 1.5) {
        const nextDir = dy > 0 ? 1 : -1;
        if (nextDir !== orbitDirTarget) {
          orbitDirTarget = nextDir;
          applyOrbitDir(nextDir);
        }
        orbitImpulse += Math.max(-0.35, Math.min(0.35, dy * 0.005));
        orbitImpulse = Math.max(-1.6, Math.min(1.6, orbitImpulse));
      }
      const maxS = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollTarget = Math.min(Math.max(y / maxS, 0), 1);

      if (stateRef.current.routeKind === "home") {
        const nextAct = scrollTarget < 0.34 ? 0 : scrollTarget < 0.74 ? 1 : 2;
        if (nextAct !== lastReportedAct) {
          lastReportedAct = nextAct;
          setActiveAct(nextAct);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      ptr.ty = -(e.clientY / Math.max(window.innerHeight, 1)) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest("a, button, input, header, nav")) return;
      pointerHolding = true;
    };

    const onPointerUp = () => {
      pointerHolding = false;
    };

    const onResize = () => {
      const w = window.innerWidth;
      const h = Math.max(window.innerHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let rafId = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      if (contextLost) return;
      rafId = requestAnimationFrame(animate);
      if (document.hidden) {
        lastNow = now;
        return;
      }

      const dt = Math.min((now - lastNow) * 0.001, 0.05);
      lastNow = now;
      const t = reducedMotion ? 0 : (now - startTime) * 0.001;
      const st = stateRef.current;

      st.currentPolarity += (st.targetPolarity - st.currentPolarity) * (reducedMotion ? 1 : 0.08);
      scrollCur += (scrollTarget - scrollCur) * (reducedMotion ? 1 : 0.075);

      const isNarrow = window.innerWidth < 860;
      let targetSphere = 0;
      let targetHorizon = 0;
      let targetApproach = 0;
      let targetBias = 0;
      const targetApproachCenter = isNarrow ? 0.0 : 4.55;

      if (st.routeKind === "vision") {
        targetSphere = 1;
        targetHorizon = 0;
        targetApproach = 0;
        targetBias = isNarrow ? 0.0 : 4.2;
      } else if (st.routeKind === "approach") {
        targetSphere = 0;
        targetHorizon = 0;
        targetApproach = 1;
        targetBias = isNarrow ? 0.0 : 4.55;
      } else {
        const toAct2 = Math.min(Math.max((scrollCur - 0.1) / 0.38, 0), 1);
        const toAct3 = Math.min(Math.max((scrollCur - 0.56) / 0.36, 0), 1);
        targetSphere = toAct2 * (1 - toAct3);
        targetHorizon = toAct3;
        targetApproach = 0;
        targetBias = isNarrow ? 0.0 : targetSphere * 4.2 + targetHorizon * 1.1;
      }

      const morphRate = reducedMotion ? 1 : 0.065;
      blendSphere += (targetSphere - blendSphere) * morphRate;
      blendHorizon += (targetHorizon - blendHorizon) * morphRate;
      blendApproach += (targetApproach - blendApproach) * morphRate;
      rightBias += (targetBias - rightBias) * morphRate;
      approachCenterX += (targetApproachCenter - approachCenterX) * (reducedMotion ? 1 : 0.08);

      orbitDirSmooth += (orbitDirTarget - orbitDirSmooth) * 0.055;
      orbitImpulse *= 0.92;
      if (!reducedMotion) {
        orbitAngle += dt * (orbitDirSmooth * 0.13 + orbitImpulse);
        tunnelTravel += dt * (orbitDirSmooth * 0.72 + orbitImpulse * 2.1);
      }

      ptr.x += (ptr.tx - ptr.x) * 0.08;
      ptr.y += (ptr.ty - ptr.y) * 0.08;

      const isHoldingNow = !reducedMotion && (pointerHolding || st.externalHold);
      if (isHoldingNow) {
        charge = Math.min(1, charge + 0.032);
      } else {
        if (wasHolding && charge > 0.1) {
          burst = Math.min(1.0, charge * 1.25);
        }
        charge *= 0.9;
      }
      wasHolding = isHoldingNow;
      burst *= 0.94;

      document.documentElement.style.setProperty("--boa-charge", charge.toFixed(3));

      const nextBlend =
        st.currentPolarity > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
      if (dustMat.blending !== nextBlend) {
        dustMat.blending = nextBlend;
        dustMat.needsUpdate = true;
      }

      curBg.copy(lightBg).lerp(darkBg, st.currentPolarity);
      renderer.setClearColor(curBg, 1);

      const camZBase = isNarrow ? 15.2 : 11.4;
      camera.position.x = reducedMotion ? 0 : ptr.x * (isNarrow ? 0.6 : 1.35);
      camera.position.y = 0.35 + (reducedMotion ? 0 : ptr.y * (isNarrow ? 0.45 : 0.85));
      camera.position.z = camZBase - charge * 1.1;
      camera.lookAt(0, 0, -1.2);

      const cursorX = reducedMotion ? 99 : ptr.x * 8.4;
      const cursorY = reducedMotion ? 99 : ptr.y * 4.6;

      for (const mat of [symbolMat, dustMat]) {
        mat.uniforms.uTime.value = t;
        mat.uniforms.uOrbitAngle.value = orbitAngle;
        mat.uniforms.uTunnelTravel.value = tunnelTravel;
        mat.uniforms.uBlendSphere.value = blendSphere;
        mat.uniforms.uBlendHorizon.value = blendHorizon;
        mat.uniforms.uApproach.value = blendApproach;
        mat.uniforms.uRightBias.value = rightBias;
        mat.uniforms.uApproachCenterX.value = approachCenterX;
        mat.uniforms.uCursor3D.value.set(cursorX, cursorY, 0.4);
        mat.uniforms.uCharge.value = reducedMotion ? 0 : charge;
        mat.uniforms.uBurst.value = reducedMotion ? 0 : burst;
        mat.uniforms.uPolarity.value = st.currentPolarity;
      }

      ringMesh.position.x = 0.6 + rightBias * 0.85;
      ringMesh.scale.setScalar(1 - blendSphere * 0.24 + blendHorizon * 0.22);
      ringMat.color.copy(lightRingCol).lerp(darkRingCol, st.currentPolarity);
      ringMat.opacity = (0.1 + st.currentPolarity * 0.14) * (1 - blendApproach);
      ringMesh.rotation.z = orbitAngle * 0.55;

      portalGroup.visible = blendApproach > 0.02;
      if (portalGroup.visible) {
        portalGroup.position.set(approachCenterX, 0, -2.4);
        portalGroup.rotation.y = -0.36 + (reducedMotion ? 0 : Math.sin(t * 0.22) * 0.045);
        portalLineMat.color.copy(lightRingCol).lerp(darkRingCol, st.currentPolarity);
        portalLineMat.opacity = (0.16 + st.currentPolarity * 0.14) * blendApproach;
        const zSpan = 10.8;
        const zMin = -7.8;
        for (const item of portalMeshes) {
          const wrappedZ =
            ((((item.baseZ - zMin + tunnelTravel) % zSpan) + zSpan) % zSpan) + zMin;
          item.mesh.position.z = wrappedZ + 2.4;
        }
      }

      renderer.render(scene, camera);
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(rafId);
      setWebglFallback(true);
    };

    const onContextRestored = () => {
      contextLost = false;
      setWebglFallback(false);
      lastNow = performance.now();
      rafId = requestAnimationFrame(animate);
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      baseSymbolGeo.dispose();
      instGeo.dispose();
      dustGeo.dispose();
      ringGeo.dispose();
      for (const g of portalGeos) g.dispose();
      symbolMat.dispose();
      dustMat.dispose();
      ringMat.dispose();
      portalLineMat.dispose();
      renderer.dispose();
    };
  }, [setActiveAct, setOrbitDir]);

  return (
    <div
      ref={containerRef}
      className="persistent-stage"
      data-webgl-fallback={webglFallback ? "true" : undefined}
      aria-hidden="true"
      data-agent-hidden=""
    />
  );
}
