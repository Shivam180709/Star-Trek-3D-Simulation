// Shader-Based Subspace Distortion & Chromatic Aberration Field
// Custom GLSL shader that envelops the USS Enterprise during warp flight (specifically active when warpFactor > 1.0).
// Creates authentic Star Trek spatial dilation, prismatic chromatic aberration fringes (RGB channel splitting),
// relativistic wavefront compression, and dynamic refractive ripples.

import * as THREE from 'three';

export interface SubspaceDistortionUniforms {
  uTime: { value: number };
  uWarpFactor: { value: number };
  uIntensity: { value: number };
  uFrequency: { value: number };
  uChromaticSeparation: { value: number };
  uCameraPos: { value: THREE.Vector3 };
}

export const SubspaceDistortionVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;
  varying vec2 vUv;
  varying vec3 vViewDirection;

  uniform float uTime;
  uniform float uWarpFactor;
  uniform float uIntensity;
  uniform float uFrequency;

  // 3D Simplex-like coherent noise for spatial distortion
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vLocalPosition = position;

    // Subspace compression wave along Z-axis (longitudinal travel axis)
    float wavePhase = position.z * (0.045 * uFrequency) - uTime * (3.5 + uWarpFactor * 1.8);
    float wave = sin(wavePhase) * cos(position.x * 0.08);

    // Multi-octave subspace noise displacement
    vec3 noiseCoord = position * 0.06 + vec3(0.0, 0.0, -uTime * (1.2 + uWarpFactor * 0.8));
    float noiseVal = snoise(noiseCoord);

    // Dynamic vertex pulse displacement: scales with warp intensity
    float displacement = (wave * 0.6 + noiseVal * 0.4) * uIntensity * 1.6;
    vec3 newPos = position + normal * displacement;

    vec4 worldPos = modelMatrix * vec4(newPos, 1.0);
    vWorldPosition = worldPos.xyz;
    vViewDirection = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const SubspaceDistortionFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;
  varying vec2 vUv;
  varying vec3 vViewDirection;

  uniform float uTime;
  uniform float uWarpFactor;
  uniform float uIntensity;
  uniform float uFrequency;
  uniform float uChromaticSeparation;

  void main() {
    // If intensity is 0 (warpFactor <= 1.0 or not warping), discard fragment immediately
    if (uIntensity < 0.005) {
      discard;
    }

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDirection);

    // Fresnel rim term for subspace sheath edge glow
    float NdotV = max(0.0, dot(normal, viewDir));
    float fresnel = pow(1.0 - NdotV, 2.8);

    // Longitudinal subspace compression waves (Star Trek warp field ripples)
    float travelZ = vLocalPosition.z;
    float phaseSpeed = uTime * (4.0 + uWarpFactor * 2.2);
    float spatialFreq = 0.08 * uFrequency;

    // Prismatic Chromatic Aberration Separation:
    // Split the phase calculation into separate Red, Green, and Blue spectrum wave offsets!
    float split = uChromaticSeparation * (0.08 + uWarpFactor * 0.025);

    // Red spectrum phase (shifted aft)
    float phaseR = (travelZ + split * 24.0) * spatialFreq - phaseSpeed;
    float waveR = sin(phaseR) * 0.5 + 0.5;

    // Green spectrum phase (central harmonic)
    float phaseG = travelZ * spatialFreq - phaseSpeed;
    float waveG = sin(phaseG) * 0.5 + 0.5;

    // Blue spectrum phase (shifted forward)
    float phaseB = (travelZ - split * 24.0) * spatialFreq - phaseSpeed;
    float waveB = sin(phaseB) * 0.5 + 0.5;

    // High-frequency relativistic micro-ripples that intensify with warp factor
    float microWave = sin(travelZ * (0.35 * uFrequency) - phaseSpeed * 2.5) * 0.5 + 0.5;
    float microGlow = pow(microWave, 3.0) * (0.2 + uWarpFactor * 0.08);

    // Chromatic RGB Color Composition
    // Low warp (W1-W3): soft sapphire & electric cyan
    // Mid warp (W4-W6): vibrant cyan with ruby-red and amethyst spectral edges
    // High warp (W7-W9.9): intense hyper-spectral rainbow fringes & incandescent blue-white core
    vec3 colorR = vec3(1.0, 0.15, 0.45) * pow(waveR, 3.5);
    vec3 colorG = vec3(0.1, 0.95, 0.65) * pow(waveG, 3.0);
    vec3 colorB = vec3(0.2, 0.65, 1.00) * pow(waveB, 2.5);

    vec3 chromaticField = (colorR * 0.75 + colorG * 0.85 + colorB * 1.35) * (0.4 + uWarpFactor * 0.08);

    // Core subspace glow: blend electric cyan & sapphire
    vec3 coreColor = mix(vec3(0.01, 0.45, 0.95), vec3(0.55, 0.85, 1.0), min(1.0, uWarpFactor / 9.0));
    vec3 edgeColor = mix(vec3(0.22, 0.75, 1.0), vec3(0.95, 0.25, 0.85), min(1.0, uChromaticSeparation * 1.5));

    vec3 finalColor = coreColor * (fresnel * 0.9 + 0.15) + chromaticField + edgeColor * (fresnel * 1.4 + microGlow);

    // Compute final alpha transparency
    float baseAlpha = mix(0.12, 0.48, min(1.0, (uWarpFactor - 1.0) / 8.9));
    float finalAlpha = (fresnel * 0.85 + chromaticField.b * 0.45 + microGlow * 0.3) * baseAlpha * uIntensity;

    gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 0.85));
  }
`;

export function createSubspaceDistortionMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: SubspaceDistortionVertexShader,
    fragmentShader: SubspaceDistortionFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWarpFactor: { value: 1.0 },
      uIntensity: { value: 0.0 },
      uFrequency: { value: 1.0 },
      uChromaticSeparation: { value: 0.0 },
      uCameraPos: { value: new THREE.Vector3() },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
