import * as THREE from 'three';
import { CelestialTarget, SolarSystem, PlanetData } from '../types/simulation';
import {
  STAR_TREK_SOLAR_SYSTEMS,
  createPlanetTexture,
  createPlanetBumpTexture,
  createStarPhotosphereTexture,
  createPlanetaryRingTexture,
} from './solarSystems';
import { ParticleExplosionManager } from './particleExplosion';
import { WarpEffectManager } from './warpEffect';
import {
  buildStarfleetOrbitalDrydock,
  buildMonumentalSpacedock,
  updateAllStarbaseAmbience,
} from './starbaseModels';

export interface WeaponProjectile {
  mesh: THREE.Object3D;
  prevPosition: THREE.Vector3;
  velocity: THREE.Vector3;
  targetEnemyId: string | null;
  targetStaticPos: THREE.Vector3 | null;
  life: number;
  maxLife: number;
  type: 'torpedo';
  thrustPlume?: THREE.Mesh;
  active: boolean;
}

// Scratch structures to guarantee zero-allocation math during torpedo guidance and flight
const _scratchToTarget = new THREE.Vector3();
const _scratchVelDir = new THREE.Vector3();
const _scratchTorpedoForward = new THREE.Vector3(0, 0, -1);

export interface SpaceEnvironment {
  scene: THREE.Scene;
  starfield: THREE.Points;
  warpTunnel: THREE.LineSegments | THREE.Group;
  warpEffect: WarpEffectManager;
  systems: SolarSystem[];
  planets: PlanetData[];
  targetMeshes: Map<string, THREE.Object3D>;
  explosionManager: ParticleExplosionManager;
  update: (
    delta: number,
    isWarping: boolean,
    warpFactor: number,
    shipPosition: THREE.Vector3,
    shipOrientation?: THREE.Quaternion,
    camera?: THREE.Camera | THREE.Vector3,
    onCheckTorpedoHit?: (pos: THREE.Vector3, prevPos: THREE.Vector3) => boolean,
    getLiveTargetPos?: (enemyId?: string | null, currentPos?: THREE.Vector3) => THREE.Vector3 | null
  ) => void;
  updateStarbaseAmbience: (
    delta: number,
    time: number,
    shipPos: THREE.Vector3,
    isDocked: boolean,
    isRepairing: boolean,
    dockedStationId: string | null,
    camera?: THREE.Camera
  ) => void;
  firePhasers: (fromLeft: THREE.Vector3, fromRight: THREE.Vector3, targetPos: THREE.Vector3 | null, forwardDir: THREE.Vector3) => void;
  stopPhasers: () => void;
  launchTorpedo: (origin: THREE.Vector3, direction: THREE.Vector3, targetEnemyId?: string | null, targetStaticPos?: THREE.Vector3 | null) => void;
  triggerExplosion: (pos: THREE.Vector3, scale?: number) => void;
  destructTarget: (id: string) => void;
  setActiveSystem?: (systemId: string) => void;
  updateSpacetimeWarpEffect?: (
    delta: number,
    time: number,
    active: boolean,
    phase: 'pulling' | 'infall' | 'singularity' | 'ejection',
    progress: number,
    shipPos: THREE.Vector3,
    shipQuat: THREE.Quaternion
  ) => void;
}

// Procedural Round Star Orb Texture (eliminates square pixel stars)
function createRoundStarSpriteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.22, 'rgba(245, 250, 255, 0.92)');
  grad.addColorStop(0.55, 'rgba(180, 215, 255, 0.35)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Procedural Volumetric Cosmic Cloud Texture for Colorful Nebulae
function createVolumetricNebulaTexture(
  primaryColor: string,
  secondaryColor: string,
  accentColor: string,
  seed: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  // Base diffuse cloud core
  const baseGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 245);
  baseGrad.addColorStop(0, primaryColor);
  baseGrad.addColorStop(0.45, secondaryColor);
  baseGrad.addColorStop(0.78, accentColor);
  baseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Layered volumetric cloud billows & ionization filaments
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const angle = ((i * 137.5 + seed * 43) % 360) * (Math.PI / 180);
    const dist = 25 + ((i * 29 + seed * 17) % 115);
    const bx = cx + Math.cos(angle) * dist;
    const by = cy + Math.sin(angle) * dist;
    const br = 65 + ((i * 31) % 85);

    const puffGrad = ctx.createRadialGradient(bx, by, 4, bx, by, br);
    puffGrad.addColorStop(0, i % 3 === 0 ? primaryColor : i % 3 === 1 ? secondaryColor : accentColor);
    puffGrad.addColorStop(0.55, i % 2 === 0 ? secondaryColor : 'rgba(147, 51, 234, 0.14)');
    puffGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = puffGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function getSystemStarColor(systemId: string): number {
  if (systemId === 'sol_system') return 0xfef08a;
  if (systemId === 'vulcan_system') return 0xfdba74;
  if (systemId === 'andoria_system') return 0xffffff;
  if (systemId === 'kronos_system' || systemId === 'mempa_system') return 0xef4444;
  if (systemId === 'romulus_system' || systemId === 'krios_system') return 0x34d399;
  if (systemId === 'cardassia_system' || systemId === 'chintoka_system') return 0xf59e0b;
  if (systemId === 'bajor_system' || systemId === 'babel_system') return 0xfef08a;
  if (systemId === 'ferenginar_system' || systemId === 'briar_patch_sector') return 0xfbbf24;
  if (systemId === 'gorn_sector' || systemId === 'bolian_system' || systemId === 'cheron_system') return 0x60a5fa;
  if (systemId === 'mutara_sector' || systemId === 'tholian_sector') return 0xf97316;
  if (systemId === 'idran_system') return 0x818cf8;
  if (systemId === 'omarion_system') return 0xf472b6;
  if (systemId === 'delta_caretaker_system') return 0x06b6d4;
  if (systemId === 'borg_unicomplex_system') return 0x22c55e;
  if (systemId === 'galactic_barrier_sector') return 0xec4899;
  if (systemId === 'deneb_system') return 0xffffff;
  return 0xfde047;
}

export function buildSpaceEnvironment(scene: THREE.Scene): SpaceEnvironment {
  // 1. Ambient & Galactic Illumination (Calibrated for cinematic deep-space contrast)
  const spaceAmbient = new THREE.AmbientLight(0x0f172a, 0.22);
  scene.add(spaceAmbient);

  // Key Galaxy Core Sun
  const keySun = new THREE.DirectionalLight(0xfff7ed, 1.2);
  keySun.position.set(2400, 3200, 1800);
  scene.add(keySun);

  // Rim Fill Light
  const fillSun = new THREE.DirectionalLight(0x38bdf8, 0.45);
  fillSun.position.set(-3000, -1500, -2500);
  scene.add(fillSun);

  // Dynamic Primary Stellar Point Light (Smoothly tracks and illuminates whichever star system Enterprise/camera is closest to)
  const localStellarLight = new THREE.PointLight(0xfef08a, 2.8, 28000);
  scene.add(localStellarLight);

  // 2. Multi-Layered Deep-Space Starfield (Natural distant round stars without extra cross-flare shining)
  const roundStarTex = createRoundStarSpriteTexture();

  const starfieldGroup = new THREE.Group();
  starfieldGroup.name = 'MultiLayered_Cosmic_Starfield';
  scene.add(starfieldGroup);

  const starColorPalette = [
    new THREE.Color(0xffffff), // Pure white
    new THREE.Color(0xdbeafe), // Cool A-type cyan-white
    new THREE.Color(0x93c5fd), // Blue-white O/B supergiant
    new THREE.Color(0x38bdf8), // Electric blue hypergiant
    new THREE.Color(0xfef08a), // Yellow dwarf G-type
    new THREE.Color(0xfdba74), // Orange K-type
    new THREE.Color(0xfca5a5), // Red M-type
    new THREE.Color(0xd8b4fe), // Violet Wolf-Rayet star
  ];

  // Layer 2A: Dense Fine Pinpoint Starfield (28,000 stars)
  const starCount = 28000;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 1600 + Math.random() * 44000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * (i % 3 === 0 ? 0.36 : 0.88);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);

    const c = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
    starColors[i * 3] = c.r;
    starColors[i * 3 + 1] = c.g;
    starColors[i * 3 + 2] = c.b;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starMat = new THREE.PointsMaterial({
    size: 20,
    map: roundStarTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    alphaTest: 0.02,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const starfield = new THREE.Points(starGeo, starMat);
  starfieldGroup.add(starfield);

  // Layer 2B: Crisp Mid-Scale Galactic Band Stars (8,500 natural round stars, no artificial cross-flare spikes)
  const midStarCount = 8500;
  const midStarGeo = new THREE.BufferGeometry();
  const midStarPos = new Float32Array(midStarCount * 3);
  const midStarCol = new Float32Array(midStarCount * 3);

  for (let i = 0; i < midStarCount; i++) {
    const radius = 1400 + Math.random() * 36000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() - 0.5) * 1.45);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi) * 0.45;
    const z = radius * Math.sin(phi) * Math.sin(theta);

    const tilt = 0.32;
    midStarPos[i * 3] = x * Math.cos(tilt) - y * Math.sin(tilt);
    midStarPos[i * 3 + 1] = x * Math.sin(tilt) + y * Math.cos(tilt);
    midStarPos[i * 3 + 2] = z;

    const c = starColorPalette[i % starColorPalette.length];
    midStarCol[i * 3] = c.r;
    midStarCol[i * 3 + 1] = c.g;
    midStarCol[i * 3 + 2] = c.b;
  }

  midStarGeo.setAttribute('position', new THREE.BufferAttribute(midStarPos, 3));
  midStarGeo.setAttribute('color', new THREE.BufferAttribute(midStarCol, 3));

  const midStarMat = new THREE.PointsMaterial({
    size: 40,
    map: roundStarTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.02,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  starfieldGroup.add(new THREE.Points(midStarGeo, midStarMat));

  // 3. Localized Nebula Textures (Used ONLY at actual Nebula locations like Mutara, Briar Patch, Azure, Badlands so normal space stays dark & playable)
  const nebulaPalettes = [
    {
      primary: 'rgba(168, 85, 247, 0.28)',
      secondary: 'rgba(192, 38, 211, 0.18)',
      accent: 'rgba(79, 70, 229, 0.10)',
      tint: 0xd8b4fe,
    },
    {
      primary: 'rgba(37, 99, 235, 0.26)',
      secondary: 'rgba(14, 165, 233, 0.16)',
      accent: 'rgba(99, 102, 241, 0.10)',
      tint: 0x7dd3fc,
    },
    {
      primary: 'rgba(217, 119, 6, 0.24)',
      secondary: 'rgba(225, 29, 72, 0.16)',
      accent: 'rgba(147, 51, 234, 0.08)',
      tint: 0xfde68a,
    },
    {
      primary: 'rgba(219, 39, 119, 0.24)',
      secondary: 'rgba(126, 34, 206, 0.18)',
      accent: 'rgba(56, 189, 248, 0.10)',
      tint: 0xf472b6,
    },
  ];

  const nebulaTextures = nebulaPalettes.map((pal, idx) =>
    createVolumetricNebulaTexture(pal.primary, pal.secondary, pal.accent, idx + 1)
  );

  const customShaderMaterials: THREE.ShaderMaterial[] = [];

  // 3C. Wrapping 3D Space Rocks / Drifting Interstellar Asteroids & Comets
  // Ensures both Sol and the interstellar space between solar systems are populated with 3D cosmic bodies (matching reference image!)
  const wrappingRocksGroup = new THREE.Group();
  wrappingRocksGroup.name = 'Drifting_Interstellar_Asteroids';
  scene.add(wrappingRocksGroup);

  interface DriftingSpaceRock {
    mesh: THREE.Mesh;
    offset: THREE.Vector3;
    rotSpeed: THREE.Vector3;
    driftVel: THREE.Vector3;
  }
  const driftingRocks: DriftingSpaceRock[] = [];
  const rockCount = 48;

  const baseRockGeos = [0, 1, 2].map((seed) => {
    const geo = new THREE.DodecahedronGeometry(1, 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const n =
        1 +
        0.22 * Math.sin(vx * 2.7 + seed * 1.9) * Math.cos(vy * 2.3 - seed) +
        0.12 * Math.cos(vz * 3.5 + seed);
      pos.setXYZ(i, vx * n, vy * n * 0.82, vz * n);
    }
    geo.computeVertexNormals();
    return geo;
  });

  const rockPaletteMats = [
    new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.92, metalness: 0.18 }),
    new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.88, metalness: 0.22 }),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.25 }),
  ];

  for (let i = 0; i < rockCount; i++) {
    const rMesh = new THREE.Mesh(baseRockGeos[i % baseRockGeos.length], rockPaletteMats[i % rockPaletteMats.length]);
    const scale = 2.2 + (i % 7) * 1.6 + (i % 11 === 0 ? 6.5 : 0);
    rMesh.scale.set(scale * 1.15, scale * 0.88, scale);

    // Distribute around ship in a 1,100-unit radius shell, keeping inner 75 units clear of the ship
    const angle = (i / rockCount) * Math.PI * 2 + (i % 5) * 0.4;
    const dist = 85 + ((i * 53) % 920);
    const ox = Math.cos(angle) * dist;
    const oy = (((i * 37) % 440) - 220);
    const oz = Math.sin(angle) * dist;

    const offset = new THREE.Vector3(ox, oy, oz);
    rMesh.position.copy(offset);
    wrappingRocksGroup.add(rMesh);

    driftingRocks.push({
      mesh: rMesh,
      offset,
      rotSpeed: new THREE.Vector3(
        ((i % 5) - 2) * 0.25,
        (((i + 2) % 5) - 2) * 0.25,
        (((i + 4) % 5) - 2) * 0.2
      ),
      driftVel: new THREE.Vector3(
        Math.sin(i * 1.7) * 3.5,
        Math.cos(i * 2.3) * 1.2,
        Math.cos(i * 1.1) * 3.5
      ),
    });
  }

  // Helper: Build Kerr-Metric Black Hole with Swirling Relativistic Accretion Disk & Gravitational Lensing (Gargantua style)
  const buildBlackHoleAnomaly = (radius: number, systemId: string = 'sol_system'): THREE.Group => {
    const bhGroup = new THREE.Group();
    bhGroup.name = 'Sol_Black_Hole_Singularity';

    // 1. Pitch-Black Event Horizon Shadow Sphere (absorbs 100% of light)
    const horizonGeo = new THREE.SphereGeometry(radius, 48, 36);
    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    bhGroup.add(horizonMesh);

    // 2. Gravitational Lensing Einstein Ring & Photon Capture Halo (Custom GLSL Fresnel/Lensing Shader)
    const lensingUniforms = {
      uTime: { value: 0 },
    };
    const lensingMat = new THREE.ShaderMaterial({
      uniforms: lensingUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewDir = normalize(-mvPos.xyz);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float ndotv = clamp(dot(vNormal, vViewDir), 0.0, 1.0);
          // Intense photon ring right around the event horizon edge + outer Einstein gravitational lensing ring
          float photonRing = exp(-pow((ndotv - 0.72) * 9.5, 2.0));
          float einsteinHalo = exp(-pow((ndotv - 0.38) * 4.5, 2.0)) * 0.65;
          float shimmer = 0.88 + 0.12 * sin(uTime * 5.0 + vNormal.x * 12.0 - vNormal.y * 9.0);

          vec3 hotGold = vec3(1.0, 0.88, 0.55);
          vec3 lensedOrange = vec3(1.0, 0.45, 0.12);
          vec3 relativisticCyan = vec3(0.35, 0.82, 1.0);

          vec3 col = hotGold * photonRing * 1.6 + mix(lensedOrange, relativisticCyan, 0.35) * einsteinHalo;
          float alpha = clamp((photonRing * 1.2 + einsteinHalo) * shimmer, 0.0, 1.0);
          gl_FragColor = vec4(col * shimmer, alpha);
        }
      `,
    });
    customShaderMaterials.push(lensingMat);
    const lensingSphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.55, 48, 36), lensingMat);
    bhGroup.add(lensingSphere);

    // 3. Relativistic Swirling Accretion Disk Shader (Keplerian differential shear + Doppler beaming)
    const diskUniforms = {
      uTime: { value: 0 },
    };
    const accretionDiskMat = new THREE.ShaderMaterial({
      uniforms: diskUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          if (r < 0.23 || r > 0.99) discard;

          float normR = clamp((r - 0.23) / 0.76, 0.0, 1.0);
          float angle = atan(p.y, p.x);

          // Keplerian differential orbital velocity (inner plasma spins much faster than outer plasma)
          float keplerSpeed = 2.8 / pow(normR + 0.18, 0.85);
          float swirlAngle = angle + uTime * keplerSpeed - normR * 16.0;

          // Multi-scale turbulent spiral filaments
          float spiral1 = 0.5 + 0.5 * sin(swirlAngle * 3.0 + sin(normR * 20.0 - uTime * 3.2) * 1.6);
          float spiral2 = 0.5 + 0.5 * cos(swirlAngle * 7.0 - normR * 32.0 + uTime * 4.8);
          float rings = 0.6 + 0.4 * sin(normR * 45.0 - uTime * 2.5);
          float plasmaDensity = mix(spiral1, spiral2, 0.45) * rings;

          // Relativistic Doppler beaming (approaching side glows hotter/brighter)
          float doppler = 1.0 + 0.32 * cos(angle - 0.45);

          // Blackbody temperature color gradient from inner ISCO photon ring to outer disk
          vec3 innerHot = vec3(1.0, 0.97, 0.86);     // Blinding white-gold
          vec3 midOrange = vec3(1.0, 0.46, 0.08);    // Fiery relativistic orange
          vec3 outerCrimson = vec3(0.82, 0.12, 0.38);// Deep crimson-violet outer edge

          vec3 baseCol = normR < 0.32
            ? mix(innerHot, midOrange, normR / 0.32)
            : mix(midOrange, outerCrimson, (normR - 0.32) / 0.68);

          // Radial edge masks
          float innerFade = smoothstep(0.23, 0.29, r);
          float outerFade = 1.0 - smoothstep(0.68, 0.99, r);
          float intensity = (0.45 + 0.85 * plasmaDensity) * doppler * (1.35 - normR * 0.55);

          float alpha = clamp(innerFade * outerFade * intensity, 0.0, 0.96);
          gl_FragColor = vec4(baseCol * intensity * 1.35, alpha);
        }
      `,
    });
    customShaderMaterials.push(accretionDiskMat);

    // Primary Equatorial Accretion Disk
    const diskSize = radius * 8.6;
    const primaryDisk = new THREE.Mesh(new THREE.PlaneGeometry(diskSize, diskSize, 1, 1), accretionDiskMat);
    primaryDisk.rotation.x = Math.PI * 0.44;
    primaryDisk.rotation.z = -0.18;
    bhGroup.add(primaryDisk);

    // 4. Gravitational Lensing Warped Upper & Lower Accretion Arches (Gargantua double-humped light bending!)
    const lensedArchSize = radius * 5.6;
    const upperLensedArch = new THREE.Mesh(new THREE.PlaneGeometry(lensedArchSize, lensedArchSize), accretionDiskMat);
    upperLensedArch.rotation.x = Math.PI * 0.06;
    upperLensedArch.rotation.z = -0.18;
    bhGroup.add(upperLensedArch);

    const lowerLensedArch = new THREE.Mesh(new THREE.PlaneGeometry(lensedArchSize * 0.92, lensedArchSize * 0.92), accretionDiskMat);
    lowerLensedArch.rotation.x = -Math.PI * 0.08;
    lowerLensedArch.rotation.y = Math.PI * 0.22;
    bhGroup.add(lowerLensedArch);

    // 5. Infalling Relativistic Plasma Particle Spiral
    const spiralCount = 420;
    const spiralGeo = new THREE.BufferGeometry();
    const spiralPos = new Float32Array(spiralCount * 3);
    const spiralCol = new Float32Array(spiralCount * 3);
    const cGold = new THREE.Color(0xfef08a);
    const cOrange = new THREE.Color(0xf97316);

    for (let i = 0; i < spiralCount; i++) {
      const t = i / spiralCount;
      const r = radius * (1.15 + t * 3.2);
      const a = t * Math.PI * 16;
      spiralPos[i * 3] = Math.cos(a) * r;
      spiralPos[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.35 * (1 - t * 0.5);
      spiralPos[i * 3 + 2] = Math.sin(a) * r;

      const c = cGold.clone().lerp(cOrange, t);
      spiralCol[i * 3] = c.r;
      spiralCol[i * 3 + 1] = c.g;
      spiralCol[i * 3 + 2] = c.b;
    }
    spiralGeo.setAttribute('position', new THREE.BufferAttribute(spiralPos, 3));
    spiralGeo.setAttribute('color', new THREE.BufferAttribute(spiralCol, 3));
    const spiralPoints = new THREE.Points(
      spiralGeo,
      new THREE.PointsMaterial({
        size: 8,
        map: roundStarTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    spiralPoints.rotation.z = -0.18;
    bhGroup.add(spiralPoints);
    animatedAnomalies.push({ mesh: spiralPoints, speed: 1.4, type: 'corona', systemId });

    return bhGroup;
  };

  // Helper: Build White Hole / White Dwarf Exit Singularity in Qo'noS System
  const buildWhiteHoleAnomaly = (radius: number): THREE.Group => {
    const whGroup = new THREE.Group();
    whGroup.name = 'Kronos_White_Hole_Singularity';

    // 1. Blinding Incandescent White Dwarf / White Hole Core
    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.85, 36, 28),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    whGroup.add(coreMesh);

    // 2. Radiant Cyan-White Relativistic Repulsion Corona
    const whUniforms = { uTime: { value: 0 } };
    const whDiskMat = new THREE.ShaderMaterial({
      uniforms: whUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          if (r < 0.18 || r > 0.99) discard;
          float normR = clamp((r - 0.18) / 0.81, 0.0, 1.0);
          float angle = atan(p.y, p.x);

          // Outward streaming relativistic shockwaves
          float wave = 0.5 + 0.5 * sin(normR * 28.0 - uTime * 5.5 + sin(angle * 4.0) * 1.2);
          float rays = 0.5 + 0.5 * cos(angle * 8.0 - uTime * 2.2 + normR * 10.0);

          vec3 colWhite = vec3(1.0, 1.0, 1.0);
          vec3 colCyan = vec3(0.22, 0.78, 1.0);
          vec3 colViolet = vec3(0.68, 0.45, 1.0);

          vec3 col = normR < 0.4
            ? mix(colWhite, colCyan, normR / 0.4)
            : mix(colCyan, colViolet, (normR - 0.4) / 0.6);

          float fade = (1.0 - smoothstep(0.62, 0.99, r)) * smoothstep(0.18, 0.26, r);
          float alpha = clamp(fade * (0.45 + 0.55 * wave * rays), 0.0, 0.95);
          gl_FragColor = vec4(col * (1.2 + wave * 0.6), alpha);
        }
      `,
    });
    customShaderMaterials.push(whDiskMat);

    const whDiskSize = radius * 7.8;
    const whDisk = new THREE.Mesh(new THREE.PlaneGeometry(whDiskSize, whDiskSize), whDiskMat);
    whDisk.rotation.x = Math.PI * 0.42;
    whGroup.add(whDisk);

    const whCrossDisk = new THREE.Mesh(new THREE.PlaneGeometry(whDiskSize * 0.68, whDiskSize * 0.68), whDiskMat);
    whCrossDisk.rotation.x = Math.PI * 0.08;
    whGroup.add(whCrossDisk);

    // Brilliant Core Glow Sprite
    const burstSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: roundStarTex,
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    burstSprite.scale.set(radius * 7.5, radius * 7.5, 1);
    whGroup.add(burstSprite);

    return whGroup;
  };

  // 3D Spacetime-Warping Singularity Tunnel (Activated when Enterprise enters the Black Hole event horizon!)
  const spacetimeWarpGroup = new THREE.Group();
  spacetimeWarpGroup.name = 'Spacetime_Singularity_Tunnel';
  spacetimeWarpGroup.visible = false;
  scene.add(spacetimeWarpGroup);

  const stTunnelRings: THREE.Mesh[] = [];
  for (let i = 0; i < 18; i++) {
    const rGeo = new THREE.TorusGeometry(18 + (i % 4) * 4, 0.85, 12, 48);
    const rMat = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xfef08a : i % 3 === 1 ? 0xf97316 : 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const rMesh = new THREE.Mesh(rGeo, rMat);
    rMesh.position.set(0, 0, -i * 18);
    spacetimeWarpGroup.add(rMesh);
    stTunnelRings.push(rMesh);
  }

  const updateSpacetimeWarpEffect = (
    delta: number,
    time: number,
    active: boolean,
    phase: 'pulling' | 'infall' | 'singularity' | 'ejection',
    progress: number,
    shipPos: THREE.Vector3,
    shipQuat: THREE.Quaternion
  ) => {
    if (!active || phase === 'pulling') {
      spacetimeWarpGroup.visible = false;
      return;
    }
    spacetimeWarpGroup.visible = true;
    spacetimeWarpGroup.position.copy(shipPos);
    spacetimeWarpGroup.quaternion.copy(shipQuat);

    for (let i = 0; i < stTunnelRings.length; i++) {
      const ring = stTunnelRings[i];
      const mat = ring.material as THREE.MeshBasicMaterial;
      // Stream rings rapidly past the ship along +Z
      ring.position.z += delta * 260;
      if (ring.position.z > 45) {
        ring.position.z -= 18 * 18;
      }
      const wave = Math.sin(time * 8 + i * 0.7);
      ring.position.x = Math.cos(time * 5 + i * 0.5) * 4.5 * progress;
      ring.position.y = Math.sin(time * 5 + i * 0.5) * 4.5 * progress;
      ring.rotation.z = time * 3.5 + i * 0.3;
      const s = 0.7 + 0.45 * (1 + wave * 0.5);
      ring.scale.set(s, s, 1);

      if (phase === 'ejection') {
        mat.color.setHex(i % 2 === 0 ? 0xffffff : 0x38bdf8);
        mat.opacity = Math.max(0, (1 - progress) * 0.9);
      } else {
        mat.color.setHex(i % 3 === 0 ? 0xfef08a : i % 3 === 1 ? 0xf97316 : 0xa855f7);
        mat.opacity = 0.78;
      }
    }
  };

  // 4. Cinematic Star Trek Warp Effect System (Streaks, Subspace Bubble, Flash, Spatial Distortion)
  const warpEffect = new WarpEffectManager(scene);
  const warpTunnel = warpEffect.group as any;

  // 5. Build Primary Stars, Planets, Space Stations, Nebulae & Anomalies across all 40 Systems
  // Core rule: Each solar system is isolated and separated. Only the active solar system is visible!
  const targetMeshes = new Map<string, THREE.Object3D>();
  const animatedAnomalies: { mesh: THREE.Object3D; speed: number; type: string; systemId?: string }[] = [];
  const allPlanets: PlanetData[] = [];
  const activeLODObjects: { lod: THREE.LOD; systemId: string }[] = [];
  const systemDetailedGroups = new Map<string, THREE.Group>();
  const systemHydrators = new Map<string, (() => void)[]>();
  const hydratedSystems = new Set<string>();
  let currentActiveSystemId = 'sol_system';

  const hydrateSystemTextures = (systemId: string) => {
    if (hydratedSystems.has(systemId)) return;
    hydratedSystems.add(systemId);
    const callbacks = systemHydrators.get(systemId);
    if (callbacks) {
      for (const fn of callbacks) fn();
      systemHydrators.delete(systemId);
    }
  };

  const setActiveSystem = (systemId: string) => {
    currentActiveSystemId = systemId;
    hydrateSystemTextures(systemId);
    for (const [id, group] of systemDetailedGroups) {
      group.visible = (id === currentActiveSystemId);
    }
  };

  for (const system of STAR_TREK_SOLAR_SYSTEMS) {
    const starColor = getSystemStarColor(system.id);
    const [cx, cy, cz] = system.centerCoordinates;
    const isInitialActiveSystem = system.id === currentActiveSystemId;
    const hydratorList: (() => void)[] = [];
    if (!isInitialActiveSystem) {
      systemHydrators.set(system.id, hydratorList);
    } else {
      hydratedSystems.add(system.id);
    }

    // Isolated system group: Only the current active solar system is visible!
    const systemDetailedGroup = new THREE.Group();
    systemDetailedGroup.name = `system_${system.id}`;
    // Sol system is visible by default at launch; all other systems hidden until warp arrival
    systemDetailedGroup.visible = isInitialActiveSystem;
    scene.add(systemDetailedGroup);
    systemDetailedGroups.set(system.id, systemDetailedGroup);

    // 5A. Central Primary Star in System (Skip for Deep Space Void sectors so deep-space spacedocks sit in true empty interstellar space!)
    if (!system.spectralType.includes('Deep Space Void')) {
      const starGroup = new THREE.Group();
      starGroup.position.set(cx, cy, cz);

      const starRadius = system.spectralType.includes('Supergiant')
        ? 165
        : system.spectralType.includes('Giant')
        ? 150
        : system.spectralType.includes('Dwarf')
        ? 120
        : 135;

      // Star Photosphere Core with Detailed Procedural Granulation & Sunspot Texture
      const starCoreGeo = new THREE.SphereGeometry(starRadius, 40, 32);
      const starCoreMat = new THREE.MeshBasicMaterial({
        color: isInitialActiveSystem ? 0xffffff : starColor,
      });
      if (isInitialActiveSystem) {
        starCoreMat.map = createStarPhotosphereTexture(system.spectralType, starColor);
      } else {
        hydratorList.push(() => {
          starCoreMat.color.setHex(0xffffff);
          starCoreMat.map = createStarPhotosphereTexture(system.spectralType, starColor);
          starCoreMat.needsUpdate = true;
        });
      }
      const starCoreMesh = new THREE.Mesh(starCoreGeo, starCoreMat);
      starGroup.add(starCoreMesh);
      animatedAnomalies.push({ mesh: starCoreMesh, speed: 0.016, type: 'corona', systemId: system.id });

      // Tasteful, Subtle Solar Corona Shell
      const coronaGeo = new THREE.SphereGeometry(starRadius * 1.09, 28, 20);
      const coronaMat = new THREE.MeshBasicMaterial({
        color: starColor,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      starGroup.add(coronaMesh);
      animatedAnomalies.push({ mesh: coronaMesh, speed: 0.04, type: 'corona', systemId: system.id });

      // 5B. Concentric Planetary Orbit Trajectory Guides (Matching authentic solar system schematic)
      for (const planet of system.planets) {
        if (planet.type === 'moon' || planet.type === 'starbase' || planet.id === 'sol_black_hole' || planet.id === 'kronos_white_hole') continue;
        const dx = planet.position[0] - cx;
        const dz = planet.position[2] - cz;
        const orbitR = Math.hypot(dx, dz);
        if (orbitR > 250) {
          const segCount = 64;
          const orbitPts: THREE.Vector3[] = [];
          for (let s = 0; s <= segCount; s++) {
            const a = (s / segCount) * Math.PI * 2;
            orbitPts.push(new THREE.Vector3(Math.cos(a) * orbitR, 0, Math.sin(a) * orbitR));
          }
          const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts);
          const orbitMat = new THREE.LineBasicMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.32,
            depthWrite: false,
          });
          const orbitLine = new THREE.Line(orbitGeo, orbitMat);
          starGroup.add(orbitLine);
        }
      }

      // Secondary Lunar Orbit Guides around Host Planets
      for (const planet of system.planets) {
        if (planet.type === 'moon') {
          const parent = system.planets.find(
            (p) => p.id === (planet as any).parentPlanetId || (p.type !== 'moon' && p.type !== 'starbase')
          );
          if (parent) {
            const mdx = planet.position[0] - parent.position[0];
            const mdz = planet.position[2] - parent.position[2];
            const moonDist = Math.hypot(mdx, mdz);
            if (moonDist > 30) {
              const mPts: THREE.Vector3[] = [];
              for (let s = 0; s <= 36; s++) {
                const a = (s / 36) * Math.PI * 2;
                mPts.push(
                  new THREE.Vector3(
                    parent.position[0] + Math.cos(a) * moonDist,
                    parent.position[1],
                    parent.position[2] + Math.sin(a) * moonDist
                  )
                );
              }
              const mGeo = new THREE.BufferGeometry().setFromPoints(mPts);
              const mMat = new THREE.LineBasicMaterial({
                color: 0x64748b,
                transparent: true,
                opacity: 0.22,
                depthWrite: false,
              });
              const mLine = new THREE.Line(mGeo, mMat);
              systemDetailedGroup.add(mLine);
            }
          }
        }
      }

      systemDetailedGroup.add(starGroup);
      targetMeshes.set(system.id + '_primary_star', starGroup);
    }

    // 5D. Build Planetary Bodies, Moons, Stations, Rings, Nebulae & Anomalies
    for (const planet of system.planets) {
      allPlanets.push(planet);
      const planetGroup = new THREE.Group();
      planetGroup.position.set(planet.position[0], planet.position[1], planet.position[2]);

      if (planet.id === 'sol_black_hole') {
        const bhMesh = buildBlackHoleAnomaly(planet.radius, system.id);
        planetGroup.add(bhMesh);
      } else if (planet.id === 'kronos_white_hole') {
        const whMesh = buildWhiteHoleAnomaly(planet.radius);
        planetGroup.add(whMesh);
      } else if (planet.type === 'starbase') {
        // Standard / Monumental Spacedock Design (all starbases now use the new Spacedock design)
        const complex = buildMonumentalSpacedock(planet.id, [0, 0, 0], planet.radius);
        if (planet.parentPlanetId) {
          const parent = system.planets.find((p: PlanetData) => p.id === planet.parentPlanetId);
          if (parent) {
            const toParent = new THREE.Vector3(...parent.position).sub(new THREE.Vector3(...planet.position)).normalize();
            complex.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), toParent);
          }
        }
        planetGroup.add(complex.root);
      } else if (planet.type === 'wormhole') {
        // The Celestial Temple / Bajoran Wormhole to the Gamma Quadrant
        const discRadius = planet.radius * 2.2;
        const outerDiscGeo = new THREE.RingGeometry(planet.radius * 0.4, discRadius, 36);
        const outerDiscMat = new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        });
        const outerDisc = new THREE.Mesh(outerDiscGeo, outerDiscMat);
        outerDisc.rotation.x = Math.PI * 0.45;
        planetGroup.add(outerDisc);

        const innerDiscGeo = new THREE.RingGeometry(planet.radius * 0.1, planet.radius * 1.2, 28);
        const innerDiscMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
        });
        const innerDisc = new THREE.Mesh(innerDiscGeo, innerDiscMat);
        innerDisc.rotation.x = Math.PI * 0.45;
        planetGroup.add(innerDisc);

        const coreFlareGeo = new THREE.SphereGeometry(planet.radius * 0.5, 16, 16);
        const coreFlare = new THREE.Mesh(coreFlareGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        planetGroup.add(coreFlare);

        animatedAnomalies.push({ mesh: outerDisc, speed: 0.8, type: 'wormhole_outer', systemId: system.id });
        animatedAnomalies.push({ mesh: innerDisc, speed: -1.2, type: 'wormhole_inner', systemId: system.id });
      } else if (planet.type === 'nebula') {
        // Volumetric Multi-Layered Cosmic Gas Nebula Cloud (Mutara / Badlands / Briar Patch)
        const cloudRadius = planet.radius * 2.4;
        const nebColor = new THREE.Color(planet.textureColor || '#9333ea');

        for (let lobe = 0; lobe < 6; lobe++) {
          const spriteMat = new THREE.SpriteMaterial({
            map: nebulaTextures[lobe % nebulaTextures.length],
            color: nebColor,
            transparent: true,
            opacity: 0.52,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const sprite = new THREE.Sprite(spriteMat);
          sprite.position.set(
            (Math.random() - 0.5) * (cloudRadius * 0.85),
            (Math.random() - 0.5) * (cloudRadius * 0.65),
            (Math.random() - 0.5) * (cloudRadius * 0.85)
          );
          const s = cloudRadius * (1.4 + (lobe % 3) * 0.45);
          sprite.scale.set(s, s * 0.82, 1);
          planetGroup.add(sprite);
        }

        // Particle Ion Dust Swarm
        const partCount = 180;
        const partGeo = new THREE.BufferGeometry();
        const partPos = new Float32Array(partCount * 3);
        for (let pIdx = 0; pIdx < partCount; pIdx++) {
          partPos[pIdx * 3] = (Math.random() - 0.5) * cloudRadius * 2.6;
          partPos[pIdx * 3 + 1] = (Math.random() - 0.5) * cloudRadius * 2.6;
          partPos[pIdx * 3 + 2] = (Math.random() - 0.5) * cloudRadius * 2.6;
        }
        partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
        const partMat = new THREE.PointsMaterial({
          color: planet.atmosphereColor ? new THREE.Color(planet.atmosphereColor) : nebColor,
          size: 16,
          map: roundStarTex,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const particles = new THREE.Points(partGeo, partMat);
        planetGroup.add(particles);

        animatedAnomalies.push({ mesh: planetGroup, speed: 0.05, type: 'nebula', systemId: system.id });
      } else if (planet.id === 'caretaker_array') {
        // The Caretaker Array Megastructure (Nacene Displacement Emitter)
        const coreGeo = new THREE.CylinderGeometry(planet.radius * 0.4, planet.radius * 0.6, planet.radius * 1.5, 16);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, metalness: 0.85, roughness: 0.2 });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        planetGroup.add(coreMesh);

        // 3 Radial Collector Pylons
        for (let a = 0; a < 3; a++) {
          const ang = (a / 3) * Math.PI * 2;
          const armGeo = new THREE.BoxGeometry(planet.radius * 1.4, planet.radius * 0.15, planet.radius * 0.25);
          const armMat = new THREE.MeshStandardMaterial({ color: 0x0e7490, metalness: 0.8 });
          const arm = new THREE.Mesh(armGeo, armMat);
          arm.position.set(Math.cos(ang) * planet.radius * 0.7, 0, Math.sin(ang) * planet.radius * 0.7);
          arm.rotation.y = ang;
          planetGroup.add(arm);
        }

        // Tetryon Displacement Emitter Ring
        const ringGeo = new THREE.TorusGeometry(planet.radius * 1.2, planet.radius * 0.08, 12, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        planetGroup.add(ringMesh);

        const emitterBeacon = new THREE.Mesh(
          new THREE.SphereGeometry(planet.radius * 0.18, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee })
        );
        planetGroup.add(emitterBeacon);
      } else if (planet.id === 'borg_unicomplex') {
        // Borg Unicomplex Central Node: Cluster of Cybernetic Cubes & Green Conduits
        for (let c = 0; c < 5; c++) {
          const cSize = planet.radius * (0.35 + (c % 3) * 0.15);
          const cGeo = new THREE.BoxGeometry(cSize, cSize, cSize);
          const cMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.9,
            roughness: 0.35,
          });
          const cMesh = new THREE.Mesh(cGeo, cMat);
          const ang = (c / 5) * Math.PI * 2;
          const dist = (c === 0 ? 0 : planet.radius * 0.65);
          cMesh.position.set(Math.cos(ang) * dist, ((c % 3) - 1) * planet.radius * 0.3, Math.sin(ang) * dist);
          planetGroup.add(cMesh);
        }

        // Borg Green Shield Grid Shell
        const shieldGeo = new THREE.SphereGeometry(planet.radius * 1.15, 18, 14);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        planetGroup.add(shieldMesh);
      } else if (planet.id === 'galactic_barrier_rift') {
        // The Great Galactic Barrier: Shimmering Energetic Tachyon Veil
        const veilGeo = new THREE.CylinderGeometry(planet.radius * 1.5, planet.radius * 1.8, planet.radius * 2.5, 24, 1, true);
        const veilMat = new THREE.MeshBasicMaterial({
          color: 0xec4899,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        });
        const veilMesh = new THREE.Mesh(veilGeo, veilMat);
        veilMesh.rotation.z = Math.PI / 4;
        planetGroup.add(veilMesh);
      } else {
        // Natural Planet Sphere or Moon with High-Definition 2K Surface Texture, Topographic Bump Map & LOD
        const isMoon = planet.type === 'moon';
        const isGasGiant = planet.type === 'gas_giant';
        const isSolPlanet = planet.id.startsWith('sol_');
        const sphereMat = new THREE.MeshStandardMaterial({
          bumpScale: planet.id === 'sol_moon' ? 2.45 : isMoon ? 1.95 : isGasGiant ? 0.35 : planet.type === 'ocean' ? 0.45 : 1.35,
          roughness: isMoon ? 0.93 : isGasGiant ? 0.78 : planet.type === 'ocean' ? 0.28 : 0.54,
          metalness: isMoon ? 0.02 : planet.type === 'ocean' ? 0.22 : 0.08,
        });

        if (isInitialActiveSystem) {
          sphereMat.map = createPlanetTexture(planet.type, planet.textureColor, planet.id);
          sphereMat.bumpMap = createPlanetBumpTexture(planet.type, planet.id);
        } else {
          hydratorList.push(() => {
            sphereMat.map = createPlanetTexture(planet.type, planet.textureColor, planet.id);
            sphereMat.bumpMap = createPlanetBumpTexture(planet.type, planet.id);
            sphereMat.needsUpdate = true;
          });
        }

        // Planetary LOD System: Slashes vertex count during high-speed flight and distant combat
        const planetLOD = new THREE.LOD();

        // --- LOD 0: Cinematic High-Detail Geometry (< 2,200 units) ---
        const highDetailPlanetGroup = new THREE.Group();
        const sphereGeoHigh = new THREE.SphereGeometry(
          planet.radius,
          isSolPlanet ? 64 : isGasGiant ? 48 : isMoon ? 40 : 40,
          isSolPlanet ? 48 : isGasGiant ? 36 : isMoon ? 30 : 30
        );
        const sphereHigh = new THREE.Mesh(sphereGeoHigh, sphereMat);
        if (planet.id === 'sol_saturn') {
          // Match the axial tilt of Saturn in the user's attached reference image (`images.jpg`)
          sphereHigh.rotation.z = -0.38;
        }
        highDetailPlanetGroup.add(sphereHigh);
        animatedAnomalies.push({ mesh: sphereHigh, speed: isMoon ? 0.008 : 0.022, type: 'corona', systemId: system.id });

        // Dedicated 3D Atmospheric Cloud Layer for Earth (`./assets/planets/earth_clouds.jpg`)
        if (planet.id === 'sol_earth') {
          const cloudTex = new THREE.TextureLoader().load('./assets/planets/earth_clouds.jpg');
          cloudTex.colorSpace = THREE.SRGBColorSpace;
          cloudTex.wrapS = THREE.RepeatWrapping;
          cloudTex.wrapT = THREE.ClampToEdgeWrapping;
          const cloudMat = new THREE.MeshStandardMaterial({
            map: cloudTex,
            alphaMap: cloudTex,
            transparent: true,
            opacity: 0.48,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            roughness: 0.9,
          });
          const cloudSphere = new THREE.Mesh(
            new THREE.SphereGeometry(planet.radius * 1.012, 56, 40),
            cloudMat
          );
          highDetailPlanetGroup.add(cloudSphere);
          animatedAnomalies.push({ mesh: cloudSphere, speed: 0.032, type: 'corona', systemId: system.id });
        }

        // Subtle Atmospheric Rim Glow for terrestrial planets with atmosphereColor
        if (planet.atmosphereColor && !isMoon) {
          const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.036, 36, 28);
          const atmoMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color(planet.atmosphereColor),
            transparent: true,
            opacity: planet.id === 'sol_earth' ? 0.18 : 0.22,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
          });
          const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
          highDetailPlanetGroup.add(atmoMesh);
        }

        // High-Detail Concentric Planetary Rings with Cassini Division Texture
        if (planet.hasRings && planet.ringInner && planet.ringOuter) {
          const ringSize = planet.ringOuter * 2.18;
          const ringGeo = new THREE.PlaneGeometry(ringSize, ringSize);
          const ringMat = new THREE.MeshStandardMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.95,
            roughness: 0.55,
            metalness: 0.15,
            depthWrite: false,
          });
          if (isInitialActiveSystem) {
            ringMat.map = createPlanetaryRingTexture(planet.ringColor || '#fed7aa', planet.id);
          } else {
            hydratorList.push(() => {
              ringMat.map = createPlanetaryRingTexture(planet.ringColor || '#fed7aa', planet.id);
              ringMat.needsUpdate = true;
            });
          }
          const ring = new THREE.Mesh(ringGeo, ringMat);
          if (planet.id === 'sol_saturn') {
            // Match the sweeping diagonal ring angle of the user's attached Saturn reference image (`images.jpg`)
            ring.rotation.x = Math.PI * 0.39;
            ring.rotation.y = -0.36;
          } else {
            ring.rotation.x = Math.PI * 0.42;
            ring.rotation.y = Math.PI * 0.12;
          }
          highDetailPlanetGroup.add(ring);
        }

        planetLOD.addLevel(highDetailPlanetGroup, 0);

        // --- LOD 1: Streamlined Low-Poly Distant Geometry (>= 2,200 units) ---
        // Slashes polygon count from ~2,400 to ~160 vertices, completely eliminating overdraw
        const lowDetailPlanetGroup = new THREE.Group();
        const sphereGeoLow = new THREE.SphereGeometry(planet.radius, 16, 12);
        const sphereLow = new THREE.Mesh(sphereGeoLow, sphereMat);
        lowDetailPlanetGroup.add(sphereLow);

        if (planet.hasRings && planet.ringInner && planet.ringOuter) {
          const ringGeoLow = new THREE.RingGeometry(planet.ringInner, planet.ringOuter, 28);
          const ringMatLow = new THREE.MeshBasicMaterial({
            color: new THREE.Color(planet.id === 'sol_saturn' ? '#7c93ad' : planet.ringColor || '#fed7aa'),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.78,
          });
          const ringLow = new THREE.Mesh(ringGeoLow, ringMatLow);
          if (planet.id === 'sol_saturn') {
            ringLow.rotation.x = Math.PI * 0.39;
            ringLow.rotation.y = -0.36;
          } else {
            ringLow.rotation.x = Math.PI * 0.42;
            ringLow.rotation.y = Math.PI * 0.12;
          }
          lowDetailPlanetGroup.add(ringLow);
        }

        planetLOD.addLevel(lowDetailPlanetGroup, 2200);

        planetGroup.add(planetLOD);
        activeLODObjects.push({ lod: planetLOD, systemId: system.id });
      }

      if (planet.type === 'starbase' && !planet.parentPlanetId) {
        // Deep-space Spacedocks (far from any planet or solar system) stay persistently visible in deep space
        scene.add(planetGroup);
      } else {
        systemDetailedGroup.add(planetGroup);
      }
      targetMeshes.set(planet.id, planetGroup);
    }
  }

  // 6. Tactical Asteroids for Target Practice & Combat Drill
  const asteroidId = 'asteroid_target_alpha';
  const astGroup = new THREE.Group();
  astGroup.position.set(-180, 45, -340);

  const rockGeo = new THREE.DodecahedronGeometry(22, 2);
  const posAttr = rockGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);
    const noise = 1 + (Math.sin(vx * 0.35) + Math.cos(vy * 0.35)) * 0.15;
    posAttr.setXYZ(i, vx * noise, vy * noise, vz * noise);
  }
  rockGeo.computeVertexNormals();

  const rockMesh = new THREE.Mesh(
    rockGeo,
    new THREE.MeshStandardMaterial({
      color: 0x71717a,
      roughness: 0.95,
      metalness: 0.2,
    })
  );
  astGroup.add(rockMesh);
  scene.add(astGroup);
  targetMeshes.set(asteroidId, astGroup);

  // 7. Particle Explosion System
  const explosionManager = new ParticleExplosionManager(scene);

  // 8. Weapons: 3D Volumetric Dual Phaser Beams with High-Energy Nadion Plasma
  // Unlike flat 1-pixel WebGL lines (which vanish at glancing angles or along camera rays),
  // these 3D volumetric cylinder meshes retain visible thickness, emissive core, and outer glow sheath from ALL angles.
  const createPhaserBeamGroup = () => {
    const group = new THREE.Group();
    group.visible = false;

    // Unit cylinder centered at origin, height 1 along Y-axis
    // Inner high-temperature core (blinding white-yellow nadion burst)
    const innerGeo = new THREE.CylinderGeometry(0.45, 0.45, 1, 10, 1, true);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // Mid plasma corona (vibrant Starfleet high-yield orange)
    const midGeo = new THREE.CylinderGeometry(1.3, 1.3, 1, 10, 1, true);
    const midMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const midMesh = new THREE.Mesh(midGeo, midMat);
    group.add(midMesh);

    // Outer dissipation halo (soft deep red-orange energy wash)
    const outerGeo = new THREE.CylinderGeometry(2.6, 2.6, 1, 10, 1, true);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    group.add(outerMesh);

    return group;
  };

  const phaserLeftBeamGroup = createPhaserBeamGroup();
  const phaserRightBeamGroup = createPhaserBeamGroup();
  scene.add(phaserLeftBeamGroup);
  scene.add(phaserRightBeamGroup);

  // Emitter Muzzle Flares (Ensures beams are brilliantly visible even when firing directly toward or away from camera)
  const muzzleGeo = new THREE.SphereGeometry(1.6, 12, 12);
  const muzzleMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const muzzleLeft = new THREE.Mesh(muzzleGeo, muzzleMat);
  const muzzleRight = new THREE.Mesh(muzzleGeo, muzzleMat.clone());
  muzzleLeft.visible = false;
  muzzleRight.visible = false;
  scene.add(muzzleLeft);
  scene.add(muzzleRight);

  // Target Impact Flare
  const phaserImpactGeo = new THREE.SphereGeometry(3.5, 16, 16);
  const phaserImpactMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const phaserImpact = new THREE.Mesh(phaserImpactGeo, phaserImpactMat);
  phaserImpact.visible = false;
  scene.add(phaserImpact);

  const yAxisUnit = new THREE.Vector3(0, 1, 0);
  const beamDirVec = new THREE.Vector3();
  const beamMidVec = new THREE.Vector3();

  const orientPhaserBeam = (group: THREE.Group, start: THREE.Vector3, end: THREE.Vector3) => {
    const dist = start.distanceTo(end);
    if (dist < 0.2) return;

    beamMidVec.addVectors(start, end).multiplyScalar(0.5);
    group.position.copy(beamMidVec);

    beamDirVec.subVectors(end, start).normalize();
    group.quaternion.setFromUnitVectors(yAxisUnit, beamDirVec);

    // Scale cylinder along its Y axis to match distance, with subtle pulse
    const pulse = 1.0 + (Math.random() - 0.5) * 0.12;
    group.scale.set(pulse, dist, pulse);
    group.visible = true;
  };

  // 9. Weapons: Photon Torpedo Projectiles (Matching Authentic Sleek Missile Design)
  // Chrome silver tapered fuselage, pointed conical nose cone, 4 swept stabilizer fins,
  // red segmented propulsion collar with ribbed ring bands, and glowing fiery exhaust nozzle.
  function buildPhotonTorpedoMesh(): { group: THREE.Group; thrustPlume: THREE.Mesh } {
    const group = new THREE.Group();

    // Polished titanium / chrome silver metallic casing
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.18,
    });

    const darkPanelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.35,
    });

    // 1. Pointed Nose Cone (Nose points towards -Z, the standard Three.js forward)
    const noseGeo = new THREE.ConeGeometry(0.58, 1.2, 16);
    const noseMesh = new THREE.Mesh(noseGeo, chromeMat);
    noseMesh.rotation.x = -Math.PI / 2;
    noseMesh.position.set(0, 0, -2.1);
    group.add(noseMesh);

    // Sharp forward apex tip
    const tipGeo = new THREE.ConeGeometry(0.2, 0.4, 12);
    const tipMesh = new THREE.Mesh(tipGeo, darkPanelMat);
    tipMesh.rotation.x = -Math.PI / 2;
    tipMesh.position.set(0, 0, -2.8);
    group.add(tipMesh);

    // 2. Streamlined Forward & Mid Cylindrical Fuselage
    const forwardHullGeo = new THREE.CylinderGeometry(0.58, 0.72, 1.1, 16);
    const forwardHullMesh = new THREE.Mesh(forwardHullGeo, chromeMat);
    forwardHullMesh.rotation.x = Math.PI / 2;
    forwardHullMesh.position.set(0, 0, -1.05);
    group.add(forwardHullMesh);

    // Mid fuselage body with aerodynamic taper
    const midHullGeo = new THREE.CylinderGeometry(0.72, 0.75, 1.3, 16);
    const midHullMesh = new THREE.Mesh(midHullGeo, chromeMat);
    midHullMesh.rotation.x = Math.PI / 2;
    midHullMesh.position.set(0, 0, 0.1);
    group.add(midHullMesh);

    // Circumferential panel joint seam
    const seamGeo = new THREE.CylinderGeometry(0.74, 0.74, 0.08, 16);
    const seamMesh = new THREE.Mesh(seamGeo, darkPanelMat);
    seamMesh.rotation.x = Math.PI / 2;
    seamMesh.position.set(0, 0, -0.45);
    group.add(seamMesh);

    // 3. Four Lateral Swept Stabilizer Fins / Winglets
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.85, -0.35);
    finShape.quadraticCurveTo(0.95, -0.75, 0.55, -0.9);
    finShape.lineTo(0, -0.7);
    finShape.closePath();

    const finExtrudeSettings = {
      steps: 1,
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    };
    const finGeo = new THREE.ExtrudeGeometry(finShape, finExtrudeSettings);
    finGeo.center();

    for (let i = 0; i < 4; i++) {
      const finMesh = new THREE.Mesh(finGeo, chromeMat);
      const angle = (i * Math.PI) / 2;
      finMesh.rotation.z = angle;
      finMesh.position.set(
        Math.cos(angle) * 0.92,
        Math.sin(angle) * 0.92,
        -0.05
      );
      group.add(finMesh);
    }

    // 4. Rear Red Propulsion Housing / Rocket Booster Collar
    const redBoosterMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.55,
      roughness: 0.32,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.4,
    });

    const boosterGeo = new THREE.CylinderGeometry(0.76, 0.74, 1.15, 16);
    const boosterMesh = new THREE.Mesh(boosterGeo, redBoosterMat);
    boosterMesh.rotation.x = Math.PI / 2;
    boosterMesh.position.set(0, 0, 1.25);
    group.add(boosterMesh);

    // Segmented Ring Bands on the Red Collar
    const ringBandMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      metalness: 0.65,
      roughness: 0.25,
    });
    for (const zOffset of [0.9, 1.25, 1.6]) {
      const ringGeo = new THREE.CylinderGeometry(0.81, 0.81, 0.12, 16);
      const ringMesh = new THREE.Mesh(ringGeo, ringBandMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(0, 0, zOffset);
      group.add(ringMesh);
    }

    // 5. Thruster Exhaust Nozzle Rim (Aft)
    const nozzleRimGeo = new THREE.CylinderGeometry(0.66, 0.52, 0.35, 16);
    const nozzleRimMesh = new THREE.Mesh(nozzleRimGeo, darkPanelMat);
    nozzleRimMesh.rotation.x = Math.PI / 2;
    nozzleRimMesh.position.set(0, 0, 1.95);
    group.add(nozzleRimMesh);

    // 6. Glowing Incandescent Rocket Exhaust Core & Plume
    const coreFlameGeo = new THREE.SphereGeometry(0.38, 12, 12);
    const coreFlameMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const coreFlameMesh = new THREE.Mesh(coreFlameGeo, coreFlameMat);
    coreFlameMesh.position.set(0, 0, 2.05);
    group.add(coreFlameMesh);

    // Outer fiery plasma thrust plume (pointing backwards +Z)
    const thrustPlumeGeo = new THREE.ConeGeometry(0.68, 2.6, 12);
    const thrustPlumeMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const thrustPlumeMesh = new THREE.Mesh(thrustPlumeGeo, thrustPlumeMat);
    thrustPlumeMesh.rotation.x = Math.PI / 2;
    thrustPlumeMesh.position.set(0, 0, 3.2);
    group.add(thrustPlumeMesh);

    // Inner bright yellow flame core
    const innerPlumeGeo = new THREE.ConeGeometry(0.38, 1.8, 12);
    const innerPlumeMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerPlumeMesh = new THREE.Mesh(innerPlumeGeo, innerPlumeMat);
    innerPlumeMesh.rotation.x = Math.PI / 2;
    innerPlumeMesh.position.set(0, 0, 2.8);
    group.add(innerPlumeMesh);

    return { group, thrustPlume: thrustPlumeMesh };
  }

  // Pre-allocated zero-allocation photon torpedo pool
  const torpedoPoolSize = 8;
  const projectiles: WeaponProjectile[] = [];
  for (let tp = 0; tp < torpedoPoolSize; tp++) {
    const { group: torpedoMesh, thrustPlume } = buildPhotonTorpedoMesh();
    torpedoMesh.visible = false;
    scene.add(torpedoMesh);
    projectiles.push({
      mesh: torpedoMesh,
      prevPosition: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      targetEnemyId: null,
      targetStaticPos: null,
      life: 0,
      maxLife: 4.5,
      type: 'torpedo',
      thrustPlume,
      active: false,
    });
  }

  const launchTorpedo = (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    targetEnemyId?: string | null,
    targetStaticPos?: THREE.Vector3 | null
  ) => {
    let p = projectiles.find((item) => !item.active);
    if (!p) {
      p = projectiles.reduce((oldest, item) => (item.life > oldest.life ? item : oldest), projectiles[0]);
    }
    p.active = true;
    p.life = 0;
    p.mesh.position.copy(origin);
    p.prevPosition.copy(origin);
    const forward = direction.clone().normalize();
    p.velocity.copy(forward).multiplyScalar(280);
    p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), forward);
    p.targetEnemyId = targetEnemyId || null;
    p.targetStaticPos = targetStaticPos ? targetStaticPos.clone() : null;
    p.mesh.visible = true;
  };

  const triggerExplosion = (pos: THREE.Vector3, scale: number = 1.0) => {
    explosionManager.triggerExplosion(pos, scale);
  };

  const firePhasers = (
    fromLeft: THREE.Vector3,
    fromRight: THREE.Vector3,
    targetPos: THREE.Vector3 | null,
    forwardDir: THREE.Vector3
  ) => {
    const end = targetPos
      ? targetPos.clone()
      : fromLeft.clone().add(forwardDir.clone().normalize().multiplyScalar(450));

    orientPhaserBeam(phaserLeftBeamGroup, fromLeft, end);
    orientPhaserBeam(phaserRightBeamGroup, fromRight, end);

    muzzleLeft.visible = true;
    muzzleLeft.position.copy(fromLeft);
    muzzleLeft.scale.setScalar(1 + Math.random() * 0.4);

    muzzleRight.visible = true;
    muzzleRight.position.copy(fromRight);
    muzzleRight.scale.setScalar(1 + Math.random() * 0.4);

    if (targetPos) {
      phaserImpact.visible = true;
      phaserImpact.position.copy(targetPos);
      phaserImpact.scale.setScalar(1.2 + Math.random() * 0.9);
    } else {
      phaserImpact.visible = false;
    }
  };

  const stopPhasers = () => {
    phaserLeftBeamGroup.visible = false;
    phaserRightBeamGroup.visible = false;
    muzzleLeft.visible = false;
    muzzleRight.visible = false;
    phaserImpact.visible = false;
  };

  const destructTarget = (id: string) => {
    const obj = targetMeshes.get(id);
    if (obj) {
      triggerExplosion(obj.position, 2.5);
      obj.scale.multiplyScalar(0.7);
    }
  };

  // Main Tick
  const update = (
    delta: number,
    isWarping: boolean,
    warpFactor: number,
    shipPosition: THREE.Vector3,
    shipOrientation?: THREE.Quaternion,
    camera?: THREE.Camera | THREE.Vector3,
    onCheckTorpedoHit?: (pos: THREE.Vector3, prevPos: THREE.Vector3) => boolean,
    getLiveTargetPos?: (enemyId?: string | null, currentPos?: THREE.Vector3) => THREE.Vector3 | null
  ) => {
    // Strictly isolate solar systems: only the active solar system is visible!
    // Distant solar systems are light-years away and never overlap in local flight view.
    const activeSys =
      STAR_TREK_SOLAR_SYSTEMS.find((s) => s.id === currentActiveSystemId) ||
      STAR_TREK_SOLAR_SYSTEMS[0];

    localStellarLight.position.set(
      activeSys.centerCoordinates[0],
      activeSys.centerCoordinates[1],
      activeSys.centerCoordinates[2]
    );
    localStellarLight.color.setHex(getSystemStarColor(activeSys.id));
    localStellarLight.intensity = 3.8;

    for (const [id, group] of systemDetailedGroups) {
      const isCurrent = (id === currentActiveSystemId);
      if (group.visible !== isCurrent) {
        group.visible = isCurrent;
      }
    }

    // Keep multi-layered starfield centered around the ship with subtle parallax
    // so distant solar systems (like Qo'noS) and deep interstellar space are always surrounded by crisp stars
    starfieldGroup.position.set(
      shipPosition.x * 0.96,
      shipPosition.y * 0.96,
      shipPosition.z * 0.96
    );

    // Update custom GLSL shaders (Black Hole Accretion Disk, Gravitational Lensing, White Hole Shockwave)
    const elapsed = performance.now() * 0.001;
    for (let i = 0; i < customShaderMaterials.length; i++) {
      customShaderMaterials[i].uniforms.uTime.value = elapsed;
    }

    // Wrap 3D craggy space rocks modularly around the ship so interstellar space never feels empty
    const boxHalf = 1100;
    const boxSize = boxHalf * 2;
    for (let i = 0; i < driftingRocks.length; i++) {
      const rock = driftingRocks[i];
      rock.offset.addScaledVector(rock.driftVel, delta);

      let rx = ((rock.offset.x - shipPosition.x + boxHalf) % boxSize);
      if (rx < 0) rx += boxSize;
      rx -= boxHalf;

      let ry = ((rock.offset.y - shipPosition.y + boxHalf) % boxSize);
      if (ry < 0) ry += boxSize;
      ry -= boxHalf;

      let rz = ((rock.offset.z - shipPosition.z + boxHalf) % boxSize);
      if (rz < 0) rz += boxSize;
      rz -= boxHalf;

      // Keep a clean clearance corridor around the Enterprise so drifting space rocks never block the camera
      const distSq = rx * rx + ry * ry + rz * rz;
      if (distSq < 90 * 90) {
        const d = Math.max(1, Math.sqrt(distSq));
        rx = (rx / d) * 95;
        ry = (ry / d) * 95;
      }

      rock.mesh.position.set(
        shipPosition.x + rx,
        shipPosition.y + ry,
        shipPosition.z + rz
      );
      rock.mesh.rotation.x += delta * rock.rotSpeed.x;
      rock.mesh.rotation.y += delta * rock.rotSpeed.y;
      rock.mesh.rotation.z += delta * rock.rotSpeed.z;
    }

    // Rotate nearby celestial bodies gently (within 9000 units of ship)
    const sx = shipPosition.x;
    const sz = shipPosition.z;
    for (const [, mesh] of targetMeshes) {
      if (mesh.parent && !mesh.parent.visible) continue;
      const dx = mesh.position.x - sx;
      const dz = mesh.position.z - sz;
      if (dx * dx + dz * dz < 81000000) {
        mesh.rotation.y += delta * 0.012;
      }
    }

    // Animate wormholes, black hole lensing/disks, and nebulae in the active system only
    for (const anom of animatedAnomalies) {
      if (anom.systemId && anom.systemId !== currentActiveSystemId) continue;
      if (anom.type === 'wormhole_outer' || anom.type === 'wormhole_inner') {
        anom.mesh.rotation.z += delta * anom.speed;
      } else if (anom.type === 'corona') {
        anom.mesh.rotation.y += delta * anom.speed;
      }
    }

    // Update active dynamic Level of Detail (LOD) objects with camera in the active system only
    if (camera) {
      const cam = (camera as any).isCamera ? (camera as THREE.Camera) : null;
      if (cam) {
        for (let i = 0; i < activeLODObjects.length; i++) {
          const item = activeLODObjects[i];
          if (item.systemId === currentActiveSystemId) {
            item.lod.update(cam);
          }
        }
      }
    }

    const camPos = (camera as any)?.isCamera ? (camera as THREE.Camera).position : (camera as THREE.Vector3);

    // Update Cinematic Star Trek Warp Visuals (Star streaks, subspace bubble, rings, flashes)
    warpEffect.update(
      delta,
      isWarping,
      warpFactor,
      shipPosition,
      shipOrientation || new THREE.Quaternion(),
      camPos
    );

    // Update active torpedoes & collision detection (zero-allocation pool)
    const tempPrevPos = new THREE.Vector3();
    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.active) continue;

      p.life += delta;
      tempPrevPos.copy(p.prevPosition);
      p.prevPosition.copy(p.mesh.position);

      if (getLiveTargetPos) {
        const livePos = getLiveTargetPos(p.targetEnemyId, p.mesh.position);
        if (livePos) {
          _scratchToTarget.copy(livePos).sub(p.mesh.position).normalize();
          p.velocity.lerp(_scratchToTarget.multiplyScalar(320), delta * 7.5);
        } else if (p.targetStaticPos) {
          _scratchToTarget.copy(p.targetStaticPos).sub(p.mesh.position).normalize();
          p.velocity.lerp(_scratchToTarget.multiplyScalar(280), delta * 5.0);
        }
      } else if (p.targetStaticPos) {
        _scratchToTarget.copy(p.targetStaticPos).sub(p.mesh.position).normalize();
        p.velocity.lerp(_scratchToTarget.multiplyScalar(280), delta * 4.5);
      }

      p.mesh.position.addScaledVector(p.velocity, delta);

      // Orient torpedo model towards its current velocity and spin along longitudinal axis
      if (p.velocity.lengthSq() > 0.01) {
        _scratchVelDir.copy(p.velocity).normalize();
        p.mesh.quaternion.setFromUnitVectors(_scratchTorpedoForward, _scratchVelDir);
        p.mesh.rotateZ(p.life * 14); // authentic missile spin in flight
      }

      // Animate fiery engine exhaust plume flicker
      if (p.thrustPlume) {
        const flicker = 1.0 + (Math.random() - 0.5) * 0.28;
        p.thrustPlume.scale.set(flicker, 1.0 + Math.random() * 0.35, flicker);
      }

      // Check hit on enemy ships
      if (onCheckTorpedoHit && onCheckTorpedoHit(p.mesh.position, tempPrevPos)) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      // Check collision with nearby celestial target meshes (< 600 km)
      let collided = false;
      const px = p.mesh.position.x;
      const py = p.mesh.position.y;
      const pz = p.mesh.position.z;
      for (const [id, tMesh] of targetMeshes) {
        const dx = tMesh.position.x - px;
        const dy = tMesh.position.y - py;
        const dz = tMesh.position.z - pz;
        const dSq = dx * dx + dy * dy + dz * dz;
        if (dSq > 360000) continue; // 600^2

        const dist = Math.sqrt(dSq);
        const radius = id.startsWith('sol_earth') || id.includes('giant') ? 55 : 28;

        if (dist < radius) {
          triggerExplosion(p.mesh.position, 1.8);
          p.active = false;
          p.mesh.visible = false;
          collided = true;
          break;
        }
      }

      if (!collided && p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
      }
    }

    // Update particle explosions
    explosionManager.update(delta);

    // Update Spacedock lighting, beacons, and camera-distance LOD
    updateAllStarbaseAmbience(
      delta,
      performance.now() * 0.001,
      shipPosition,
      false,
      false,
      null,
      (camera as any)?.isCamera ? (camera as THREE.Camera) : undefined
    );
  };

  const updateStarbaseAmbience = (
    delta: number,
    time: number,
    shipPos: THREE.Vector3,
    isDocked: boolean,
    isRepairing: boolean,
    dockedStationId: string | null,
    camera?: THREE.Camera
  ) => {
    updateAllStarbaseAmbience(delta, time, shipPos, isDocked, isRepairing, dockedStationId, camera);
  };

  return {
    scene,
    starfield,
    warpTunnel,
    warpEffect,
    systems: STAR_TREK_SOLAR_SYSTEMS,
    planets: allPlanets,
    targetMeshes,
    explosionManager,
    update,
    updateStarbaseAmbience,
    updateSpacetimeWarpEffect,
    firePhasers,
    stopPhasers,
    launchTorpedo,
    triggerExplosion,
    destructTarget,
    setActiveSystem,
  };
}
