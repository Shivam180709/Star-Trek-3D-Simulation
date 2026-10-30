const fs = require('fs');

// We will build the new high-fidelity enterprise model script for src/three/shipModel.ts
const code = `/**
 * USS Enterprise (NCC-1701) - Constitution Class / Movie-Accurate Kelvin & Reference Model
 * Photorealistic procedural 3D model with PBR metallic-roughness materials (#a4aebc, satin pearl finish),
 * 4096 x 4096 procedural Aztec plating with concentric grid lines & radial seams,
 * curved bold "NCC - 1701" and "U.S.S. ENTERPRISE" Starfleet decals,
 * sealed Bussard collectors with solid rear backplates, spinning rotor blades,
 * flush embedded blue warp grilles, grounded bridge teardrop fairing,
 * continuous 3D lofted aerodynamic wing connecting neck,
 * movie-accurate Kelvin navigational deflector with 36 illuminated spokes & electric-blue glow,
 * rear shuttlebay with symmetrical closed clamshell doors,
 * and watertight monolithic geometry.
 *
 * Coordinates are aligned with standard Three.js convention:
 * - Forward (Bow / Saucer / Deflector / Weapons) = -Z
 * - Aft (Stern / Impulse / Shuttlebay / Nacelle exhausts) = +Z
 * - Starboard (Right nacelle / Green beacon) = +X
 * - Port (Left nacelle / Red beacon) = -X
 * - Dorsal (Bridge / Strobe) = +Y
 * - Ventral (Planetary sensor dome) = -Y
 */
import * as THREE from 'three';

export type AlertMode = 'normal' | 'yellow' | 'red';
export type HullFinish = 'standard' | 'classic' | 'section31' | 'wireframe';

export interface EnterpriseController {
  group: THREE.Group;
  saucerGroup: THREE.Group;
  neckGroup: THREE.Group;
  engGroup: THREE.Group;
  pylonsGroup: THREE.Group;
  nacelleLeftGroup: THREE.Group;
  nacelleRightGroup: THREE.Group;
  getTorpedoOrigin: () => THREE.Vector3;
  getPhaserOrigins: () => [THREE.Vector3, THREE.Vector3];
  getSubsystemPosition: (name: string) => THREE.Vector3;
  setAlertMode: (mode: AlertMode) => void;
  setWarpActive: (active: boolean) => void;
  setHullFinish: (finish: HullFinish) => void;
  setExploded: (factor: number) => void;
  update: (deltaSeconds: number, elapsedSeconds: number) => void;
  dispose: () => void;
}

export interface EnterpriseComponents {
  root: THREE.Group;
  saucer: THREE.Group;
  secondaryHull: THREE.Group;
  deflectorDish: THREE.Mesh;
  deflectorGlow: THREE.PointLight;
  bussardLeft: THREE.Mesh;
  bussardRight: THREE.Mesh;
  bussardGlowLeft: THREE.PointLight;
  bussardGlowRight: THREE.PointLight;
  warpCoilsLeft: THREE.Mesh;
  warpCoilsRight: THREE.Mesh;
  impulseEngine: THREE.Mesh;
  impulseGlow: THREE.PointLight;
  shieldBubble: THREE.Mesh;
  phaserOriginLeft: THREE.Vector3;
  phaserOriginRight: THREE.Vector3;
  torpedoOrigin: THREE.Vector3;
  subsystemNodes: Map<string, THREE.Vector3>;
  controller: EnterpriseController;
}

function pseudoHash(x: number, y: number): number {
  const sin = Math.sin(x * 12.9898 + y * 78.233);
  return (sin * 43758.5453123) % 1;
}

/**
 * 4096 x 4096 Procedural CanvasTexture for the Saucer Dorsal Hull
 * Reading upright and clear from the Chase Camera!
 */
function createSaucerDorsalTexture(): THREE.CanvasTexture {
  const size = 4096;
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width: size, height: size, getContext: () => null } as unknown as HTMLCanvasElement);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    // 1. Base hull coat: Movie-accurate Starfleet pearlescent studio grey
    ctx.fillStyle = '#a4aebc';
    ctx.fillRect(0, 0, size, size);

    // 2. Clear two-tone pearlescent Aztec paneling pattern
    const ringStep = 68;
    for (let r = 380; r < 2010; r += ringStep) {
      const sectors = Math.floor((r * Math.PI * 2) / 110);
      for (let s = 0; s < sectors; s++) {
        const a0 = (s / sectors) * Math.PI * 2;
        const a1 = ((s + 0.96) / sectors) * Math.PI * 2;
        const h1 = Math.abs(pseudoHash(r, s));
        const h2 = Math.abs(pseudoHash(r * 2.3, s * 1.9));
        if (h1 > 0.22) {
          ctx.beginPath();
          ctx.arc(cx, cy, r + ringStep * 0.94, a0, a1);
          ctx.arc(cx, cy, r + 2, a1, a0, true);
          ctx.closePath();
          if (h1 > 0.72) {
            ctx.fillStyle = 'rgba(235, 242, 252, 0.45)';
          } else if (h2 > 0.5) {
            ctx.fillStyle = 'rgba(195, 205, 220, 0.35)';
          } else {
            ctx.fillStyle = 'rgba(135, 148, 168, 0.32)';
          }
          ctx.fill();
        }
        if (h2 > 0.62) {
          const midA = (a0 + a1) * 0.5;
          ctx.beginPath();
          ctx.arc(cx, cy, r + ringStep * 0.5, a0, midA);
          ctx.arc(cx, cy, r + 3, midA, a0, true);
          ctx.closePath();
          ctx.fillStyle = 'rgba(125, 138, 158, 0.36)';
          ctx.fill();
        }
      }
    }

    // 3. Crisp concentric saucer grid seams
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.55)';
    ctx.lineWidth = 2.5;
    const concentricRings = [
      380, 520, 660, 800, 940, 1080, 1220, 1360, 1500, 1640, 1780, 1920, 2010,
    ];
    concentricRings.forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 4. Crisp radial saucer spoke grid seams
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.45)';
    ctx.lineWidth = 2.0;
    const numSpokes = 64;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * 380, cy + Math.sin(angle) * 380);
      ctx.lineTo(cx + Math.cos(angle) * 2010, cy + Math.sin(angle) * 2010);
      ctx.stroke();
    }

    // 5. Starfleet Red Pennant Framing Arcs on Forward Saucer (centered on Bow = -Math.PI / 2)
    const outerPennantR = 1710;
    ctx.strokeStyle = '#c41e24';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, outerPennantR, Math.PI * 1.17, Math.PI * 1.83);
    ctx.stroke();

    const innerPennantR = 1320;
    ctx.strokeStyle = '#c41e24';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, innerPennantR, Math.PI * 1.22, Math.PI * 1.78);
    ctx.stroke();

    // Golden Starfleet Delta Chevron Arrows at pennant tips
    [outerPennantR, innerPennantR].forEach((pR) => {
      [Math.PI * 1.175, Math.PI * 1.825].forEach((arrowAngle) => {
        const ax = cx + Math.cos(arrowAngle) * pR;
        const ay = cy + Math.sin(arrowAngle) * pR;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(arrowAngle + Math.PI / 2);
        ctx.fillStyle = '#f0b020';
        ctx.beginPath();
        ctx.moveTo(-10, -16);
        ctx.lineTo(16, 0);
        ctx.lineTo(-10, 16);
        ctx.lineTo(-2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    });

    // 6. Forward Yellow/Amber RCS Thruster Quads
    const rcsAngles = [Math.PI * 1.28, Math.PI * 1.72, Math.PI * 0.28, Math.PI * 0.72];
    rcsAngles.forEach((ang) => {
      const rx = cx + Math.cos(ang) * 1940;
      const ry = cy + Math.sin(ang) * 1940;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = '#e69022';
      ctx.fillRect(-18, -28, 36, 56);
      ctx.strokeStyle = '#683605';
      ctx.lineWidth = 2;
      ctx.strokeRect(-18, -28, 36, 56);
      ctx.fillStyle = '#0f1115';
      [-12, 12].forEach((ny) => {
        ctx.fillRect(-12, ny - 5, 10, 10);
        ctx.fillRect(2, ny - 5, 10, 10);
      });
      ctx.restore();
    });

    // Helper for curved text along arc centered at -Math.PI / 2 (Bow / Forward)
    // Left-to-right reading when viewed from behind the ship looking forward!
    const drawCurvedText = (
      text: string,
      radius: number,
      centerAngle: number,
      extraLetterSpacingPx: number,
      font: string,
      color: string
    ) => {
      ctx.save();
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const chars = text.split('');
      const charWidths = chars.map((ch) => {
        if (ch === ' ') return ctx.measureText('M').width * 0.35;
        return ctx.measureText(ch).width;
      });

      const angularWidths = charWidths.map((w) => (w + extraLetterSpacingPx) / radius);
      const totalAngle = angularWidths.reduce((sum, a) => sum + a, 0);

      // Start at left (centerAngle - totalAngle/2) and step to right
      let currentAngle = centerAngle - totalAngle / 2;
      for (let i = 0; i < chars.length; i++) {
        const halfA = angularWidths[i] / 2;
        const charAngle = currentAngle + halfA;
        currentAngle += angularWidths[i];

        if (chars[i] !== ' ') {
          const x = cx + Math.cos(charAngle) * radius;
          const y = cy + Math.sin(charAngle) * radius;
          ctx.save();
          ctx.translate(x, y);
          // Tangent angle so tops of letters point outward towards bow edge
          ctx.rotate(charAngle + Math.PI / 2);
          ctx.fillText(chars[i], 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    };

    // "NCC - 1701" - Bold main Starfleet registry decal on forward bow
    drawCurvedText(
      'NCC - 1701',
      1520,
      -Math.PI / 2,
      18,
      'bold 240px "Arial", "Helvetica Neue", "Segoe UI", sans-serif',
      '#030508'
    );

    // "U.S.S. ENTERPRISE" on concentric arc in front of the bridge
    drawCurvedText(
      'U.S.S.  ENTERPRISE',
      1120,
      -Math.PI / 2,
      14,
      'bold 130px "Arial", "Helvetica Neue", "Segoe UI", sans-serif',
      '#030508'
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 4096 x 4096 Procedural CanvasTexture for the Saucer Ventral Hull
 */
function createSaucerVentralTexture(): THREE.CanvasTexture {
  const size = 4096;
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width: size, height: size, getContext: () => null } as unknown as HTMLCanvasElement);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    ctx.fillStyle = '#a4aebc';
    ctx.fillRect(0, 0, size, size);

    // Ventral Aztec paneling pattern
    const ringStep = 72;
    for (let r = 240; r < 960; r += ringStep) {
      const sectors = Math.floor((r * Math.PI * 2) / 100);
      for (let s = 0; s < sectors; s++) {
        const a0 = (s / sectors) * Math.PI * 2;
        const a1 = ((s + 0.95) / sectors) * Math.PI * 2;
        const h = Math.abs(pseudoHash(r * 1.7, s * 2.1));
        if (h > 0.28) {
          ctx.beginPath();
          ctx.arc(cx, cy, r + ringStep * 0.92, a0, a1);
          ctx.arc(cx, cy, r + 2, a1, a0, true);
          ctx.closePath();
          ctx.fillStyle = h > 0.7 ? 'rgba(235, 242, 252, 0.42)' : 'rgba(135, 148, 168, 0.32)';
          ctx.fill();
        }
      }
    }

    // Crisp concentric grid seams
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.55)';
    ctx.lineWidth = 2.5;
    [250, 420, 600, 780, 920].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crisp radial grid seams
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.45)';
    ctx.lineWidth = 2.0;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 250, cy + Math.sin(a) * 250);
      ctx.lineTo(cx + Math.cos(a) * 920, cy + Math.sin(a) * 920);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Nacelle Base Hull Texture
 */
function createNacelleBaseTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 512;
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  if (ctx) {
    ctx.fillStyle = '#a4aebc';
    ctx.fillRect(0, 0, width, height);

    for (let x = 60; x < width - 60; x += 110) {
      for (let y = 30; y < height - 30; y += 70) {
        const h = Math.abs(pseudoHash(x * 1.5, y * 2.1));
        if (h > 0.32) {
          ctx.fillStyle = h > 0.72 ? 'rgba(235, 242, 252, 0.38)' : 'rgba(135, 148, 168, 0.3)';
          ctx.fillRect(x + 2, y + 2, 106, 66);
        }
      }
    }

    ctx.strokeStyle = 'rgba(45, 55, 72, 0.55)';
    ctx.lineWidth = 2.0;
    for (let y = 32; y < height; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 16;
  return texture;
}

/**
 * Procedural Red Nacelle Strap Texture with bold NCC-1701 & chevrons
 */
function createNacelleStrapTexture(isPort: boolean): THREE.CanvasTexture {
  const width = 2048;
  const height = 256;
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  if (ctx) {
    ctx.clearRect(0, 0, width, height);

    // Primary red stripe band
    ctx.fillStyle = '#c41e24';
    ctx.fillRect(40, 68, width - 80, 120);

    ctx.strokeStyle = '#220305';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 68, width - 80, 120);

    // Starfleet chevron arrows
    const arrowX = isPort ? 160 : width - 160;
    ctx.fillStyle = '#f0b020';
    ctx.beginPath();
    const dir = isPort ? -1 : 1;
    ctx.moveTo(arrowX + dir * 60, 128);
    ctx.lineTo(arrowX - dir * 40, 80);
    ctx.lineTo(arrowX - dir * 20, 128);
    ctx.lineTo(arrowX - dir * 40, 176);
    ctx.closePath();
    ctx.fill();

    // Bold black "NCC-1701" in-line decal
    ctx.fillStyle = '#05070a';
    ctx.font = 'bold 96px "Arial", "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NCC - 1701', width * 0.52, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

/**
 * Procedural Secondary Hull Texture with illuminated windows
 */
function createHullSideTexture(): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const width = 2048;
  const height = 1024;
  const c1 = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);
  const c2 = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);
  c1.width = width;
  c1.height = height;
  c2.width = width;
  c2.height = height;
  const ctx1 = c1.getContext ? c1.getContext('2d') : null;
  const ctx2 = c2.getContext ? c2.getContext('2d') : null;

  if (ctx1 && ctx2) {
    ctx1.fillStyle = '#a4aebc';
    ctx1.fillRect(0, 0, width, height);

    ctx2.fillStyle = '#000000';
    ctx2.fillRect(0, 0, width, height);

    // Aztec panels
    for (let x = 40; x < width - 40; x += 120) {
      for (let y = 40; y < height - 40; y += 80) {
        const h = Math.abs(pseudoHash(x * 1.3, y * 1.7));
        if (h > 0.35) {
          ctx1.fillStyle = h > 0.72 ? 'rgba(235, 242, 252, 0.4)' : 'rgba(135, 148, 168, 0.32)';
          ctx1.fillRect(x + 2, y + 2, 116, 76);
        }
      }
    }

    // Windows
    ctx1.fillStyle = '#fffdf0';
    ctx2.fillStyle = '#fffae0';
    for (let row = 0; row < 6; row++) {
      const y = 320 + row * 65;
      for (let col = 0; col < 28; col++) {
        const x = 200 + col * 58;
        if (pseudoHash(row, col) > 0.12) {
          ctx1.fillRect(x, y, 14, 18);
          ctx2.fillRect(x, y, 14, 18);
        }
      }
    }
  }

  const map = new THREE.CanvasTexture(c1);
  const emissiveMap = new THREE.CanvasTexture(c2);
  map.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

/**
 * Procedural Deflector Texture
 */
function createDeflectorTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width: size, height: size, getContext: () => null } as unknown as HTMLCanvasElement);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext ? canvas.getContext('2d') : null;

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 480);
    grad.addColorStop(0, '#00e1ff');
    grad.addColorStop(0.35, '#0088ee');
    grad.addColorStop(0.7, '#003388');
    grad.addColorStop(1, '#050a14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#00f7ff';
    ctx.lineWidth = 3;
    for (let r = 80; r < 460; r += 50) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Warp Grille Texture
 */
function createWarpGrilleTexture(): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const width = 1024;
  const height = 256;
  const c1 = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);
  const c2 = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);
  c1.width = width;
  c1.height = height;
  c2.width = width;
  c2.height = height;
  const ctx1 = c1.getContext ? c1.getContext('2d') : null;
  const ctx2 = c2.getContext ? c2.getContext('2d') : null;

  if (ctx1 && ctx2) {
    ctx1.fillStyle = '#061326';
    ctx1.fillRect(0, 0, width, height);

    ctx2.fillStyle = '#000000';
    ctx2.fillRect(0, 0, width, height);

    // Glowing cyan horizontal coils
    for (let y = 16; y < height - 16; y += 22) {
      const grad = ctx1.createLinearGradient(0, y, width, y);
      grad.addColorStop(0, '#0088ff');
      grad.addColorStop(0.5, '#00e5ff');
      grad.addColorStop(1, '#0088ff');

      ctx1.fillStyle = grad;
      ctx1.fillRect(20, y, width - 40, 14);

      ctx2.fillStyle = '#00f0ff';
      ctx2.fillRect(20, y, width - 40, 14);
    }
  }

  const map = new THREE.CanvasTexture(c1);
  const emissiveMap = new THREE.CanvasTexture(c2);
  map.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

/**
 * Procedural Honeycomb Impulse Exhaust Texture
 */
function createImpulseHoneycombTexture(): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const width = 512;
  const height = 256;
  const c1 = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);
  const c2 = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : ({ width, height, getContext: () => null } as unknown as HTMLCanvasElement);
  c1.width = width;
  c1.height = height;
  c2.width = width;
  c2.height = height;
  const ctx1 = c1.getContext ? c1.getContext('2d') : null;
  const ctx2 = c2.getContext ? c2.getContext('2d') : null;

  if (ctx1 && ctx2) {
    ctx1.fillStyle = '#100502';
    ctx1.fillRect(0, 0, width, height);

    ctx2.fillStyle = '#000000';
    ctx2.fillRect(0, 0, width, height);

    ctx1.fillStyle = '#ff4400';
    ctx2.fillStyle = '#ff5500';
    const r = 10;
    for (let y = 14; y < height - 14; y += 18) {
      for (let x = 14; x < width - 14; x += 18) {
        ctx1.beginPath();
        ctx1.arc(x, y, r * 0.45, 0, Math.PI * 2);
        ctx1.fill();

        ctx2.beginPath();
        ctx2.arc(x, y, r * 0.45, 0, Math.PI * 2);
        ctx2.fill();
      }
    }
  }

  const map = new THREE.CanvasTexture(c1);
  const emissiveMap = new THREE.CanvasTexture(c2);
  map.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

/**
 * Builds the complete photorealistic USS Enterprise NCC-1701 3D model
 */
export function buildEnterpriseModel(): EnterpriseComponents {
  const root = new THREE.Group();
  root.name = 'USS_Enterprise_NCC1701';

  // Master model scale factor: gives the ship magnificent presence and fits perfectly inside Spacedock!
  const MODEL_SCALE = 1.75;
  const modelWrapper = new THREE.Group();
  modelWrapper.scale.setScalar(MODEL_SCALE);
  root.add(modelWrapper);

  const saucerTopTex = createSaucerDorsalTexture();
  const saucerBotTex = createSaucerVentralTexture();
  const nacelleBaseTex = createNacelleBaseTexture();
  const nacelleStrapStbdTex = createNacelleStrapTexture(false);
  const nacelleStrapPortTex = createNacelleStrapTexture(true);
  const hullSideTex = createHullSideTexture();
  const deflectorTex = createDeflectorTexture();
  const warpGrilleTex = createWarpGrilleTexture();
  const impulseHoneycombTex = createImpulseHoneycombTexture();

  // PBR Movie-Accurate Studio Materials
  const primaryHullMat = new THREE.MeshStandardMaterial({
    color: 0xa4aebc,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const dorsalHullMat = new THREE.MeshStandardMaterial({
    map: saucerTopTex,
    color: 0xffffff,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const ventralHullMat = new THREE.MeshStandardMaterial({
    map: saucerBotTex,
    color: 0xffffff,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const nacelleHullMat = new THREE.MeshStandardMaterial({
    map: nacelleBaseTex,
    color: 0xffffff,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const nacelleStrapStbdMat = new THREE.MeshStandardMaterial({
    map: nacelleStrapStbdTex,
    color: 0xffffff,
    metalness: 0.18,
    roughness: 0.45,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const nacelleStrapPortMat = new THREE.MeshStandardMaterial({
    map: nacelleStrapPortTex,
    color: 0xffffff,
    metalness: 0.18,
    roughness: 0.45,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e222a,
    metalness: 0.55,
    roughness: 0.38,
    side: THREE.DoubleSide,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.85,
    roughness: 0.22,
    side: THREE.DoubleSide,
  });

  const hullWindowMat = new THREE.MeshStandardMaterial({
    map: hullSideTex.map,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: hullSideTex.emissiveMap,
    emissiveIntensity: 0.55,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const warpBlueGlowMat = new THREE.MeshStandardMaterial({
    map: warpGrilleTex.map,
    color: 0x33aaff,
    emissive: new THREE.Color(0x0088ee),
    emissiveMap: warpGrilleTex.emissiveMap,
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.1,
  });

  const bussardShellMat = new THREE.MeshStandardMaterial({
    color: 0xff5511,
    emissive: new THREE.Color(0xff3300),
    emissiveIntensity: 1.8,
    roughness: 0.22,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });

  const impulseGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: new THREE.Color(0xff3300),
    emissiveIntensity: 2.8,
    roughness: 0.2,
  });

  const alertStrobeMat = new THREE.MeshStandardMaterial({
    color: 0xff1111,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    roughness: 0.2,
  });

  const portNavMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: new THREE.Color(0xff0000),
    emissiveIntensity: 4.5,
  });

  const stbdNavMat = new THREE.MeshStandardMaterial({
    color: 0x00ff44,
    emissive: new THREE.Color(0x00ff44),
    emissiveIntensity: 4.5,
  });

  const strobeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.0,
  });

  // Planar UV mapping for curved saucer geometry
  const applySaucerPlanarUV = (geo: THREE.BufferGeometry, maxRadius = 6.52) => {
    const pos = geo.attributes.position;
    const count = pos.count;
    const uvs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // u: 0 (port) to 1 (starboard)
      uvs[i * 2] = x / (2 * maxRadius) + 0.5;
      // v: 0 (forward bow) to 1 (aft stern) with z < 0 at bow
      uvs[i * 2 + 1] = z / (2 * maxRadius) + 0.5;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  };

  // ==========================================
  // 1. PRIMARY HULL (SAUCER SECTION)
  // Bow is at -Z, Aft is at +Z
  // ==========================================
  const saucerGroup = new THREE.Group();
  saucerGroup.name = 'PrimaryHull_Saucer';
  const initialSaucerPos = new THREE.Vector3(0, 2.35, -4.8);
  saucerGroup.position.copy(initialSaucerPos);
  modelWrapper.add(saucerGroup);

  // Upper Dorsal Saucer Surface - Closed solid apex
  const dorsalPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.86),
    new THREE.Vector2(0.85, 0.85),
    new THREE.Vector2(1.25, 0.82),
    new THREE.Vector2(2.15, 0.72),
    new THREE.Vector2(2.35, 0.52),
    new THREE.Vector2(4.2, 0.42),
    new THREE.Vector2(6.25, 0.22),
    new THREE.Vector2(6.5, 0.1),
  ];
  const dorsalGeo = new THREE.LatheGeometry(dorsalPoints, 128);
  applySaucerPlanarUV(dorsalGeo, 6.5);
  const dorsalMesh = new THREE.Mesh(dorsalGeo, dorsalHullMat);
  saucerGroup.add(dorsalMesh);

  // Lower Ventral Saucer Surface
  const ventralPoints: THREE.Vector2[] = [
    new THREE.Vector2(6.5, -0.06),
    new THREE.Vector2(6.32, -0.14),
    new THREE.Vector2(4.8, -0.28),
    new THREE.Vector2(2.4, -0.45),
    new THREE.Vector2(1.15, -0.68),
    new THREE.Vector2(0.0, -0.72),
  ];
  const ventralGeo = new THREE.LatheGeometry(ventralPoints, 128);
  applySaucerPlanarUV(ventralGeo, 6.5);
  const ventralMesh = new THREE.Mesh(ventralGeo, ventralHullMat);
  saucerGroup.add(ventralMesh);

  // Saucer Outer Rim Band with Illuminated Windows
  const rimBandGeo = new THREE.CylinderGeometry(6.505, 6.505, 0.16, 128, 1, false);
  const rimBandMesh = new THREE.Mesh(rimBandGeo, hullWindowMat);
  rimBandMesh.position.y = 0.02;
  saucerGroup.add(rimBandMesh);

  // Navigation Running Lights on Saucer Rim (Port = Red at -X, Starboard = Green at +X)
  const portSaucerLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), portNavMat);
  portSaucerLight.position.set(-6.48, 0.05, 0);
  saucerGroup.add(portSaucerLight);

  const stbdSaucerLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), stbdNavMat);
  stbdSaucerLight.position.set(6.48, 0.05, 0);
  saucerGroup.add(stbdSaucerLight);

  // Command Bridge Superstructure
  const bridgeTeardropGroup = new THREE.Group();
  bridgeTeardropGroup.position.set(0, 0.84, 0.05);
  saucerGroup.add(bridgeTeardropGroup);

  const tearBaseGeo = new THREE.CylinderGeometry(0.52, 0.82, 0.22, 48);
  tearBaseGeo.scale(0.85, 1.0, 1.55);
  const tearBaseMesh = new THREE.Mesh(tearBaseGeo, primaryHullMat);
  tearBaseMesh.position.set(0, 0.11, 0.15);
  bridgeTeardropGroup.add(tearBaseMesh);

  const midBridgeGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.14, 48);
  midBridgeGeo.scale(0.9, 1.0, 1.25);
  const midBridgeMesh = new THREE.Mesh(midBridgeGeo, primaryHullMat);
  midBridgeMesh.position.set(0, 0.26, 0.05);
  bridgeTeardropGroup.add(midBridgeMesh);

  const bridgeDomeGeo = new THREE.SphereGeometry(0.38, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
  bridgeDomeGeo.scale(0.95, 0.55, 1.15);
  const bridgeDomeMesh = new THREE.Mesh(bridgeDomeGeo, chromeMat);
  bridgeDomeMesh.position.set(0, 0.33, 0.02);
  bridgeTeardropGroup.add(bridgeDomeMesh);

  // Synchronized White Strobe Beacon on Bridge Apex
  const bridgeStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), strobeWhiteMat);
  bridgeStrobe.position.set(0, 0.55, 0.02);
  bridgeTeardropGroup.add(bridgeStrobe);

  // Forward Bridge Viewscreen (facing -Z)
  const viewscreen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.1), warpBlueGlowMat);
  viewscreen.position.set(0, 0.28, -0.45);
  bridgeTeardropGroup.add(viewscreen);

  // Impulse Propulsion Unit at Aft Rim of Saucer (+Z)
  const impulseGroup = new THREE.Group();
  impulseGroup.name = 'Saucer_Impulse_Thrusters';
  impulseGroup.position.set(0, 0.08, 6.15);
  saucerGroup.add(impulseGroup);

  const impulseHousingGeo = new THREE.BoxGeometry(3.6, 0.44, 1.05);
  const impulseHousingMesh = new THREE.Mesh(impulseHousingGeo, darkTrimMat);
  impulseHousingMesh.position.set(0, 0.14, 0);
  impulseGroup.add(impulseHousingMesh);

  const upperLipGeo = new THREE.BoxGeometry(3.2, 0.14, 0.75);
  const upperLipMesh = new THREE.Mesh(upperLipGeo, primaryHullMat);
  upperLipMesh.position.set(0, 0.36, -0.1);
  impulseGroup.add(upperLipMesh);

  const honeycombMat = new THREE.MeshStandardMaterial({
    map: impulseHoneycombTex.map,
    emissive: new THREE.Color(0xff3300),
    emissiveMap: impulseHoneycombTex.emissiveMap,
    emissiveIntensity: 3.6,
    roughness: 0.25,
    metalness: 0.2,
  });

  let primaryImpulseMesh: THREE.Mesh | null = null;
  [-0.92, 0.92].forEach((tx) => {
    // Glowing honeycomb thruster face facing aft (+Z)
    const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.26, 0.06), honeycombMat);
    grilleMesh.position.set(tx, 0.14, 0.53);
    impulseGroup.add(grilleMesh);
    if (!primaryImpulseMesh) primaryImpulseMesh = grilleMesh;

    const frameGeo = new THREE.BoxGeometry(1.22, 0.34, 0.08);
    const frameMesh = new THREE.Mesh(frameGeo, darkTrimMat);
    frameMesh.position.set(tx, 0.14, 0.50);
    impulseGroup.add(frameMesh);
  });

  const dividerGeo = new THREE.BoxGeometry(0.38, 0.42, 0.22);
  const dividerMesh = new THREE.Mesh(dividerGeo, darkTrimMat);
  dividerMesh.position.set(0, 0.14, 0.51);
  impulseGroup.add(dividerMesh);

  // Twin Downward Spotlights illuminating the neck
  [-0.38, 0.38].forEach((lx) => {
    const spotFixture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 0.12, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xddeeff),
        emissiveIntensity: 4.5,
      })
    );
    spotFixture.position.set(lx, -0.08, 0.25);
    spotFixture.rotation.x = -0.35;
    impulseGroup.add(spotFixture);
  });

  const impulsePointLight = new THREE.PointLight(0xff3300, 1.2, 12);
  impulsePointLight.position.set(0, 0.14, 0.85);
  impulseGroup.add(impulsePointLight);

  // Ventral Planetary Sensor Dome
  const ventralDomeGeo = new THREE.SphereGeometry(1.15, 36, 20, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
  const ventralDome = new THREE.Mesh(ventralDomeGeo, chromeMat);
  ventralDome.position.set(0, -0.52, 0);
  ventralDome.scale.set(1, 0.45, 1);
  saucerGroup.add(ventralDome);

  const ventralRingGeo = new THREE.CylinderGeometry(1.55, 1.35, 0.18, 48, 1, false);
  const ventralRing = new THREE.Mesh(ventralRingGeo, hullWindowMat);
  ventralRing.position.set(0, -0.58, 0);
  saucerGroup.add(ventralRing);

  // Ventral Phaser Strips (forward facing)
  [-2.8, 2.8].forEach((px) => {
    const phaserStrip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.25), darkTrimMat);
    phaserStrip.position.set(px, -0.4, -2.5);
    phaserStrip.rotation.y = px > 0 ? 0.4 : -0.4;
    saucerGroup.add(phaserStrip);
  });

  // ==========================================
  // 2. CONNECTING NECK - Continuous 3D Lofted Wing
  // ==========================================
  const neckGroup = new THREE.Group();
  neckGroup.name = 'ConnectingNeck';
  modelWrapper.add(neckGroup);

  const createSculptedNeckGeo = (): THREE.BufferGeometry => {
    const slicesY = 32;
    const radialSegments = 36;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const yBottom = -0.45;
    const yTop = 2.45;

    for (let j = 0; j <= slicesY; j++) {
      const v = j / slicesY;
      const y = yBottom + (yTop - yBottom) * v;

      // Centerline sweeps forward as it goes up to meet saucer
      const zCenter = -0.1 + (1.0 - v) * 0.4 - v * 2.8;

      const waistFactor = Math.sin(v * Math.PI);
      const halfWidth = 0.35 + (1.0 - waistFactor) * 0.48;
      const lengthZ = 4.8 - v * 0.8;

      for (let i = 0; i <= radialSegments; i++) {
        const u = i / radialSegments;
        const theta = u * Math.PI * 2;

        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);

        const x = sinT * halfWidth;
        const z = zCenter + cosT * (lengthZ * 0.5);

        positions.push(x, y, z);
        uvs.push(u, v);
      }
    }

    for (let j = 0; j < slicesY; j++) {
      for (let i = 0; i < radialSegments; i++) {
        const a = j * (radialSegments + 1) + i;
        const b = (j + 1) * (radialSegments + 1) + i;
        const c = (j + 1) * (radialSegments + 1) + (i + 1);
        const d = j * (radialSegments + 1) + (i + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  const neckGeo = createSculptedNeckGeo();
  const neckMesh = new THREE.Mesh(neckGeo, primaryHullMat);
  neckGroup.add(neckMesh);

  // Forward Photon Torpedo Launcher Bay at base of neck (facing -Z)
  const launcherCowl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.72, 1.4), darkTrimMat);
  launcherCowl.position.set(0, 0.5, -2.6);
  neckGroup.add(launcherCowl);

  [-0.38, 0.38].forEach((tx) => {
    const tubeNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.16, 16), darkTrimMat);
    tubeNozzle.rotation.x = -Math.PI / 2;
    tubeNozzle.position.set(tx, 0.5, -3.32);
    neckGroup.add(tubeNozzle);

    const tubeCore = new THREE.Mesh(
      new THREE.CircleGeometry(0.065, 16),
      new THREE.MeshBasicMaterial({ color: 0xff2200 })
    );
    tubeCore.position.set(tx, 0.5, -3.41);
    tubeCore.rotation.y = Math.PI;
    neckGroup.add(tubeCore);
  });

  // ==========================================
  // 3. SECONDARY ENGINEERING HULL
  // Forward is -Z, Aft is +Z
  // ==========================================
  const engGroup = new THREE.Group();
  engGroup.name = 'SecondaryHull_Engineering';
  engGroup.position.set(0, -0.65, 2.8);
  modelWrapper.add(engGroup);

  const createWatertightEngHullGeo = (): THREE.BufferGeometry => {
    const lengthSlices = 48;
    const radialSegments = 36;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const zFront = -3.8;
    const zAft = 4.4;

    for (let j = 0; j <= lengthSlices; j++) {
      const v = j / lengthSlices;
      const z = zFront + (zAft - zFront) * v;

      let rBase = 1.35;
      if (v < 0.2) {
        rBase = 1.05 + Math.sin((v / 0.2) * Math.PI * 0.5) * 0.38;
      } else if (v < 0.65) {
        rBase = 1.43 + Math.sin(((v - 0.2) / 0.45) * Math.PI) * 0.18;
      } else {
        const aftV = (v - 0.65) / 0.35;
        rBase = 1.43 - aftV * 0.48;
      }

      for (let i = 0; i <= radialSegments; i++) {
        const u = i / radialSegments;
        const theta = u * Math.PI * 2;

        const sinT = Math.sin(theta);
        const cosT = Math.cos(theta);

        const x = sinT * rBase * 0.95;
        let y = cosT * rBase * 1.02;

        // Keel flattening on ventral side
        if (cosT < -0.3) {
          y = -rBase * 0.85 + (cosT + 0.3) * 0.25;
        }

        positions.push(x, y, z);
        uvs.push(u, v);
      }
    }

    for (let j = 0; j < lengthSlices; j++) {
      for (let i = 0; i < radialSegments; i++) {
        const a = j * (radialSegments + 1) + i;
        const b = (j + 1) * (radialSegments + 1) + i;
        const c = (j + 1) * (radialSegments + 1) + (i + 1);
        const d = j * (radialSegments + 1) + (i + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  const engHullGeo = createWatertightEngHullGeo();
  const engHullMesh = new THREE.Mesh(engHullGeo, hullWindowMat);
  engGroup.add(engHullMesh);

  // KELVIN NAVIGATIONAL DEFLECTOR DISH (Facing -Z)
  const deflectorAssembly = new THREE.Group();
  deflectorAssembly.name = 'Kelvin_Deflector_Assembly';
  deflectorAssembly.position.set(0, 0, -3.65);
  engGroup.add(deflectorAssembly);

  const backingDishGeo = new THREE.SphereGeometry(1.36, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42);
  backingDishGeo.rotateX(Math.PI / 2);
  const backingDishMat = new THREE.MeshStandardMaterial({
    color: 0x060c18,
    metalness: 0.55,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const backingDish = new THREE.Mesh(backingDishGeo, backingDishMat);
  backingDish.scale.set(1, 1, 0.32);
  deflectorAssembly.add(backingDish);

  // Inner Glowing Electric-Blue Core Disc
  const coreDiscGeo = new THREE.CircleGeometry(0.52, 48);
  const coreDiscMat = new THREE.MeshStandardMaterial({
    color: 0x0077ee,
    emissive: new THREE.Color(0x00a8ff),
    emissiveIntensity: 3.8,
    roughness: 0.2,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const coreDisc = new THREE.Mesh(coreDiscGeo, coreDiscMat);
  coreDisc.position.z = -0.04;
  coreDisc.rotation.y = Math.PI;
  deflectorAssembly.add(coreDisc);

  // Center focal cyan-white emitter bead
  const centerFocalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 5.5,
  });
  const centerBead = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), centerFocalMat);
  centerBead.position.z = -0.08;
  deflectorAssembly.add(centerBead);

  // Inner & Outer Glowing Cyan Torus Rings
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 4.8,
    roughness: 0.1,
  });
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.024, 16, 64), ringMat);
  innerRing.position.z = -0.06;
  deflectorAssembly.add(innerRing);

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.022, 16, 64), ringMat);
  outerRing.position.z = -0.12;
  deflectorAssembly.add(outerRing);

  // Array of 36 Luminous Cyan Radial Spokes
  const numSpokes = 36;
  const rInner = 0.52;
  const rOuter = 1.22;
  const spokeLen = rOuter - rInner;
  const rMid = (rInner + rOuter) * 0.5;
  const spokeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 5.0,
    roughness: 0.1,
    metalness: 0.1,
  });
  const beadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 5.5,
  });
  const spokeGeo = new THREE.CylinderGeometry(0.016, 0.016, spokeLen, 8);
  const beadGeo = new THREE.SphereGeometry(0.038, 12, 12);

  for (let s = 0; s < numSpokes; s++) {
    const angle = (s / numSpokes) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.position.set(cos * rMid, sin * rMid, -0.08);
    spoke.rotation.z = angle - Math.PI / 2;
    deflectorAssembly.add(spoke);

    const bead = new THREE.Mesh(beadGeo, beadMat);
    bead.position.set(cos * rOuter, sin * rOuter, -0.12);
    deflectorAssembly.add(bead);
  }

  const deflectorCollar = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.08, 16, 64), darkTrimMat);
  deflectorCollar.position.z = -0.15;
  deflectorAssembly.add(deflectorCollar);

  const deflectorPointLight = new THREE.PointLight(0x00d8ff, 1.2, 14.0);
  deflectorPointLight.position.set(0, 0, -0.55);
  deflectorAssembly.add(deflectorPointLight);

  // Rear Shuttlebay at Aft (+Z)
  const shuttlebayGroup = new THREE.Group();
  shuttlebayGroup.position.set(0, 0.12, 4.46);
  engGroup.add(shuttlebayGroup);

  const cowlShape = new THREE.Shape();
  cowlShape.absarc(0, 0, 1.05, 0, Math.PI, false);
  cowlShape.lineTo(-1.05, -0.2);
  cowlShape.lineTo(-1.18, -0.2);
  cowlShape.absarc(0, 0, 1.18, Math.PI, 0, true);
  cowlShape.lineTo(1.05, -0.2);
  cowlShape.closePath();

  const cowlExtrude = new THREE.ExtrudeGeometry(cowlShape, {
    depth: 1.2,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  const hangarArch = new THREE.Mesh(cowlExtrude, primaryHullMat);
  hangarArch.position.set(0, 0.08, -0.1);
  shuttlebayGroup.add(hangarArch);

  // Closed clamshell doors (facing +Z)
  const doorGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.12, 32, 1, false, 0, Math.PI);
  doorGeo.rotateX(Math.PI / 2);
  const doorMesh = new THREE.Mesh(doorGeo, darkTrimMat);
  doorMesh.position.set(0, 0.08, 0.95);
  shuttlebayGroup.add(doorMesh);

  // ==========================================
  // 4. NACELLE PYLONS & WARP NACELLES
  // Nacelles flank the ship at Port (-X) and Starboard (+X), extending aft (+Z)
  // ==========================================
  const pylonsGroup = new THREE.Group();
  pylonsGroup.name = 'WarpPylons';
  modelWrapper.add(pylonsGroup);

  const nacelleLeftGroup = new THREE.Group();
  nacelleLeftGroup.name = 'Nacelle_Port';
  const initialNacLeftPos = new THREE.Vector3(-4.5, 3.85, 7.2);
  nacelleLeftGroup.position.copy(initialNacLeftPos);
  modelWrapper.add(nacelleLeftGroup);

  const nacelleRightGroup = new THREE.Group();
  nacelleRightGroup.name = 'Nacelle_Starboard';
  const initialNacRightPos = new THREE.Vector3(4.5, 3.85, 7.2);
  nacelleRightGroup.position.copy(initialNacRightPos);
  modelWrapper.add(nacelleRightGroup);

  const bussardRotors: THREE.Object3D[] = [];
  const bussardLights: THREE.PointLight[] = [];
  let bussardMeshLeft: THREE.Mesh | null = null;
  let bussardMeshRight: THREE.Mesh | null = null;
  let warpCoilMeshLeft: THREE.Mesh | null = null;
  let warpCoilMeshRight: THREE.Mesh | null = null;

  [-1, 1].forEach((side) => {
    // Pylon struts sweeping upward, outward, and backward from secondary hull to nacelles
    const P_root = new THREE.Vector3(side * 1.15, -0.45, 2.9);
    const P_tip = new THREE.Vector3(side * 4.4, 3.35, 6.2);
    const dir = new THREE.Vector3().subVectors(P_tip, P_root);
    const pylonLen = dir.length();
    const mid = new THREE.Vector3().addVectors(P_root, P_tip).multiplyScalar(0.5);

    const pylonGeo = new THREE.BoxGeometry(0.34, pylonLen + 0.9, 1.6);
    const pylonMesh = new THREE.Mesh(pylonGeo, primaryHullMat);
    const pylonQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    pylonMesh.quaternion.copy(pylonQuat);
    pylonMesh.position.copy(mid);
    pylonsGroup.add(pylonMesh);

    // Glowing warp grills along inward face of pylon
    const pylonGrillGeo = new THREE.BoxGeometry(0.10, pylonLen * 0.65, 0.32);
    const pylonGrill = new THREE.Mesh(pylonGrillGeo, warpBlueGlowMat);
    pylonGrill.quaternion.copy(pylonQuat);
    pylonGrill.position.copy(mid);
    pylonGrill.position.x += side * 0.17;
    pylonsGroup.add(pylonGrill);

    const targetNacelleGroup = side === -1 ? nacelleLeftGroup : nacelleRightGroup;

    // Solid closed cylindrical nacelle body (lathed along Z axis)
    // Front apex at z = -5.2 (forward), rear apex at z = +5.2 (aft)
    const nacPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, -5.2),
      new THREE.Vector2(1.05, -5.2),
      new THREE.Vector2(1.05, -4.85),
      new THREE.Vector2(1.05, -2.3),
      new THREE.Vector2(1.02, -2.15),
      new THREE.Vector2(0.98, 1.5),
      new THREE.Vector2(0.84, 4.4),
      new THREE.Vector2(0.64, 5.4),
      new THREE.Vector2(0.35, 5.2),
      new THREE.Vector2(0.0, 5.2),
    ];
    const nacBodyGeo = new THREE.LatheGeometry(nacPoints, 64);
    nacBodyGeo.rotateX(-Math.PI / 2);
    const nacBodyMesh = new THREE.Mesh(nacBodyGeo, nacelleHullMat);
    targetNacelleGroup.add(nacBodyMesh);

    // BUSSARD COLLECTOR (at forward cap z = -5.18 facing -Z)
    const backplateGeo = new THREE.CylinderGeometry(1.04, 1.04, 0.08, 48);
    backplateGeo.rotateX(Math.PI / 2);
    const backplateMesh = new THREE.Mesh(backplateGeo, primaryHullMat);
    backplateMesh.position.set(0, 0, -5.16);
    targetNacelleGroup.add(backplateMesh);

    const bussardCollar = new THREE.Mesh(new THREE.TorusGeometry(1.01, 0.04, 24, 64), chromeMat);
    bussardCollar.position.z = -5.18;
    targetNacelleGroup.add(bussardCollar);

    const bussardDomeGeo = new THREE.SphereGeometry(1.045, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    bussardDomeGeo.rotateX(-Math.PI / 2);
    const bussardDome = new THREE.Mesh(bussardDomeGeo, bussardShellMat);
    bussardDome.position.z = -5.18;
    targetNacelleGroup.add(bussardDome);

    if (side === -1) bussardMeshLeft = bussardDome;
    else bussardMeshRight = bussardDome;

    const bussardLight = new THREE.PointLight(0xff4400, 0.35, 4.5);
    bussardLight.position.set(0, 0, -5.25);
    targetNacelleGroup.add(bussardLight);
    bussardLights.push(bussardLight);

    // Internal spinning rotor blades
    const rotorGroup = new THREE.Group();
    rotorGroup.position.z = -5.25;
    targetNacelleGroup.add(rotorGroup);
    bussardRotors.push(rotorGroup);

    const coreBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xffaa00),
        emissiveIntensity: 2.6,
      })
    );
    coreBulb.position.z = -0.1;
    rotorGroup.add(coreBulb);

    const numBlades = 12;
    for (let b = 0; b < numBlades; b++) {
      const bladeAngle = (b / numBlades) * Math.PI * 2;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.82, 0.18),
        new THREE.MeshStandardMaterial({
          color: 0xff6600,
          emissive: new THREE.Color(0xff2200),
          emissiveIntensity: 2.2,
        })
      );
      blade.position.set(Math.cos(bladeAngle) * 0.42, Math.sin(bladeAngle) * 0.42, -0.04);
      blade.rotation.z = bladeAngle + 0.35;
      rotorGroup.add(blade);
    }

    // Flush embedded cyan-blue warp grilles along nacelle body
    const warpGrilleGeo = new THREE.BoxGeometry(0.12, 0.55, 6.2);
    const warpGrille = new THREE.Mesh(warpGrilleGeo, warpBlueGlowMat);
    warpGrille.position.set(-side * 0.98, 0, 0.4);
    targetNacelleGroup.add(warpGrille);

    if (side === -1) warpCoilMeshLeft = warpGrille;
    else warpCoilMeshRight = warpGrille;

    // Outward red strap livery with NCC-1701 decal
    const strapGeo = new THREE.PlaneGeometry(0.48, 7.2);
    strapGeo.rotateZ(Math.PI / 2);
    strapGeo.rotateY(side * Math.PI / 2);
    const strapMat = side === -1 ? nacelleStrapPortMat : nacelleStrapStbdMat;
    const strapMesh = new THREE.Mesh(strapGeo, strapMat);
    strapMesh.position.set(side * 1.06, 0.1, 0.2);
    targetNacelleGroup.add(strapMesh);

    // Navigational beacons on nacelle aft fins
    const navLightMat = side === -1 ? portNavMat : stbdNavMat;
    const navBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), navLightMat);
    navBeacon.position.set(side * 0.65, 0.82, 4.8);
    targetNacelleGroup.add(navBeacon);
  });

  // ==========================================
  // 5. DEFENSIVE SHIELD BUBBLE
  // Dynamic force-field envelope centered around Enterprise
  // ==========================================
  const shieldGeo = new THREE.SphereGeometry(24, 36, 28);
  shieldGeo.scale(1.0, 0.52, 1.35);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.8,
    transparent: true,
    opacity: 0.0,
    wireframe: true,
    roughness: 0.1,
  });
  const shieldBubble = new THREE.Mesh(shieldGeo, shieldMat);
  shieldBubble.position.set(0, 2.0, 0);
  root.add(shieldBubble);

  // ==========================================
  // 6. WEAPON & TELEMETRY SUBSYSTEM POSITIONS
  // World positions relative to root at scale 1.75
  // ==========================================
  const phaserOriginLeft = new THREE.Vector3(-4.9, 3.4, -12.8);
  const phaserOriginRight = new THREE.Vector3(4.9, 3.4, -12.8);
  const torpedoOrigin = new THREE.Vector3(0, 0.88, -13.2);

  const subsystemNodes = new Map<string, THREE.Vector3>();
  subsystemNodes.set('bridge', new THREE.Vector3(0, 5.6, -8.3));
  subsystemNodes.set('saucer', new THREE.Vector3(0, 4.1, -8.4));
  subsystemNodes.set('deflector', new THREE.Vector3(0, -1.1, -11.3));
  subsystemNodes.set('deflector_dish', new THREE.Vector3(0, -1.1, -11.3));
  subsystemNodes.set('impulse', new THREE.Vector3(0, 4.25, 2.36));
  subsystemNodes.set('impulse_engines', new THREE.Vector3(0, 4.25, 2.36));
  subsystemNodes.set('shuttlebay', new THREE.Vector3(0, -0.93, 12.7));
  subsystemNodes.set('warp_core', new THREE.Vector3(0, -1.1, 0));
  subsystemNodes.set('port_nacelle', new THREE.Vector3(-7.88, 6.74, 12.6));
  subsystemNodes.set('starboard_nacelle', new THREE.Vector3(7.88, 6.74, 12.6));
  subsystemNodes.set('nacelles', new THREE.Vector3(7.88, 6.74, 12.6));
  subsystemNodes.set('phaser_banks', new THREE.Vector3(0, 3.4, -12.8));
  subsystemNodes.set('torpedo_bay', torpedoOrigin.clone());
  subsystemNodes.set('shields', new THREE.Vector3(0, 2.0, 0));
  subsystemNodes.set('sensor_array', new THREE.Vector3(0, 0.25, -8.4));

  // ==========================================
  // 7. ANIMATION & CONTROLLER LOGIC
  // ==========================================
  let currentAlert: AlertMode = 'normal';
  let isWarpActive = false;

  const setAlertMode = (mode: AlertMode) => {
    currentAlert = mode;
  };

  const setWarpActive = (active: boolean) => {
    isWarpActive = active;
  };

  const setHullFinish = (finish: HullFinish) => {
    switch (finish) {
      case 'standard':
        primaryHullMat.color.setHex(0xa4aebc);
        primaryHullMat.metalness = 0.22;
        primaryHullMat.roughness = 0.52;
        primaryHullMat.wireframe = false;
        dorsalHullMat.wireframe = false;
        ventralHullMat.wireframe = false;
        darkTrimMat.wireframe = false;
        break;
      case 'classic':
        primaryHullMat.color.setHex(0xf0f3f8);
        primaryHullMat.metalness = 0.2;
        primaryHullMat.roughness = 0.45;
        primaryHullMat.wireframe = false;
        dorsalHullMat.wireframe = false;
        ventralHullMat.wireframe = false;
        darkTrimMat.wireframe = false;
        break;
      case 'section31':
        primaryHullMat.color.setHex(0x12151a);
        primaryHullMat.metalness = 0.82;
        primaryHullMat.roughness = 0.22;
        primaryHullMat.wireframe = false;
        dorsalHullMat.wireframe = false;
        ventralHullMat.wireframe = false;
        darkTrimMat.wireframe = false;
        break;
      case 'wireframe':
        primaryHullMat.color.setHex(0x00e1ff);
        primaryHullMat.wireframe = true;
        dorsalHullMat.wireframe = true;
        ventralHullMat.wireframe = true;
        darkTrimMat.wireframe = true;
        break;
    }
  };

  const setExploded = (factor: number) => {
    saucerGroup.position.set(
      initialSaucerPos.x,
      initialSaucerPos.y + factor * 3.8,
      initialSaucerPos.z - factor * 3.2
    );
    nacelleLeftGroup.position.set(
      initialNacLeftPos.x - factor * 3.2,
      initialNacLeftPos.y + factor * 1.2,
      initialNacLeftPos.z + factor * 3.0
    );
    nacelleRightGroup.position.set(
      initialNacRightPos.x + factor * 3.2,
      initialNacRightPos.y + factor * 1.2,
      initialNacRightPos.z + factor * 3.0
    );
  };

  const update = (deltaSeconds: number, elapsedSeconds: number) => {
    const spinMultiplier = isWarpActive ? 3.5 : currentAlert === 'red' ? 2.2 : 1.0;
    if (bussardRotors.length >= 2) {
      bussardRotors[0].rotation.z += deltaSeconds * 2.8 * spinMultiplier;
      bussardRotors[1].rotation.z -= deltaSeconds * 2.8 * spinMultiplier;
    }

    // Navigation white strobes (pulsing on bridge and fins)
    const strobeCycle = elapsedSeconds % 1.4;
    const isStrobeOn = strobeCycle < 0.12;
    strobeWhiteMat.emissiveIntensity = isStrobeOn ? 5.0 : 0.0;

    // Warp & Bussard Pulse
    const warpBase = isWarpActive ? 4.8 : 2.2;
    const pulse = 1.0 + Math.sin(elapsedSeconds * (isWarpActive ? 8.5 : 3.0)) * 0.12;
    warpBlueGlowMat.emissiveIntensity = warpBase * pulse;
    bussardShellMat.emissiveIntensity = (isWarpActive ? 2.8 : 1.8) * pulse;
    bussardLights.forEach((light) => {
      light.intensity = (isWarpActive ? 3.5 : 2.2) * pulse;
    });

    // Alert Modes Lighting
    if (currentAlert === 'red') {
      const strobe = Math.sin(elapsedSeconds * 6.5) > 0 ? 1 : 0;
      alertStrobeMat.emissive.setHex(0xff0000);
      alertStrobeMat.emissiveIntensity = strobe * 4.5;
      spokeMat.emissive.setHex(strobe ? 0xff2200 : 0x881100);
      deflectorPointLight.color.setHex(0xff2200);
    } else if (currentAlert === 'yellow') {
      alertStrobeMat.emissive.setHex(0xffaa00);
      alertStrobeMat.emissiveIntensity = 2.0 + Math.sin(elapsedSeconds * 4.0) * 1.5;
      spokeMat.emissive.setHex(0xffaa00);
      deflectorPointLight.color.setHex(0xffaa00);
    } else {
      alertStrobeMat.emissiveIntensity = 0;
      spokeMat.emissive.setHex(0x00f7ff);
      deflectorPointLight.color.setHex(0x00d8ff);
    }
  };

  const dispose = () => {
    saucerTopTex.dispose();
    saucerBotTex.dispose();
    nacelleBaseTex.dispose();
    nacelleStrapStbdTex.dispose();
    nacelleStrapPortTex.dispose();
    hullSideTex.map.dispose();
    hullSideTex.emissiveMap.dispose();
    deflectorTex.dispose();
    warpGrilleTex.map.dispose();
    warpGrilleTex.emissiveMap.dispose();
    impulseHoneycombTex.map.dispose();
    impulseHoneycombTex.emissiveMap.dispose();
  };

  const controller: EnterpriseController = {
    group: root,
    saucerGroup,
    neckGroup,
    engGroup,
    pylonsGroup,
    nacelleLeftGroup,
    nacelleRightGroup,
    getTorpedoOrigin: () => torpedoOrigin.clone(),
    getPhaserOrigins: () => [phaserOriginLeft.clone(), phaserOriginRight.clone()],
    getSubsystemPosition: (name: string) => subsystemNodes.get(name.toLowerCase())?.clone() || root.position.clone(),
    setAlertMode,
    setWarpActive,
    setHullFinish,
    setExploded,
    update,
    dispose,
  };

  return {
    root,
    saucer: saucerGroup,
    secondaryHull: engGroup,
    deflectorDish: coreDisc,
    deflectorGlow: deflectorPointLight,
    bussardLeft: bussardMeshLeft || coreDisc,
    bussardRight: bussardMeshRight || coreDisc,
    bussardGlowLeft: bussardLights[0] || deflectorPointLight,
    bussardGlowRight: bussardLights[1] || deflectorPointLight,
    warpCoilsLeft: warpCoilMeshLeft || coreDisc,
    warpCoilsRight: warpCoilMeshRight || coreDisc,
    impulseEngine: primaryImpulseMesh || coreDisc,
    impulseGlow: impulsePointLight,
    shieldBubble,
    phaserOriginLeft,
    phaserOriginRight,
    torpedoOrigin,
    subsystemNodes,
    controller,
  };
}

/**
 * Compatible export for createKelvinEnterprise
 */
export function createKelvinEnterprise(): EnterpriseController {
  const comp = buildEnterpriseModel();
  return comp.controller;
}
`;

fs.writeFileSync('/tmp/generate_shipModel.ts', code);
console.log('Generated /tmp/generate_shipModel.ts');
