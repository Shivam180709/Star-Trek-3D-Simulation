/**
 * USS Enterprise (NCC-1701) - Constitution Class / Movie-Accurate Reference Model
 * Direct implementation grounded in https://github.com/Shivam180709/Enterprise-Model
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
  setHullIntegrity: (integrity: number) => void;
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

/**
 * Deterministic pseudo-random number for consistent Aztec paneling across frames
 */
function pseudoHash(x: number, y: number): number {
  const sin = Math.sin(x * 12.9898 + y * 78.233);
  return (sin * 43758.5453123) % 1;
}

/**
 * 4096 x 4096 Procedural CanvasTexture for the Saucer Dorsal Hull:
 * - Bright pearlescent Starfleet studio grey (#a4aebc) base coat with subtle two-tone Aztec tiles
 * - Concentric saucer grid lines & 64 radial seams
 * - "U.S.S. ENTERPRISE" and "NCC - 1701" decals on the forward bow (facing -Z)
 * - Starfleet red pennant stripe framing arcs and forward RCS thruster quads
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

    // 1. Base hull coat: Movie-accurate Starfleet pearlescent studio grey (PBR calibrated)
    ctx.fillStyle = '#a4aebc';
    ctx.fillRect(0, 0, size, size);

    // 2. Clear two-tone pearlescent Aztec paneling pattern with visible contrast
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

          // Multi-tone metallic Aztec armor plating
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

    // 3. Crisp concentric saucer grid seams (high-definition panel lines)
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

    // 5. Starfleet Red Pennant Framing Arc on Forward Saucer (between registry and ship name, matching user Image 2)
    const pennantR = 1420;
    ctx.strokeStyle = '#c41e24';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, pennantR, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();

    // Golden Starfleet Delta Chevron Arrows at pennant tips
    [Math.PI * 1.18, Math.PI * 1.82].forEach((arrowAngle) => {
      const ax = cx + Math.cos(arrowAngle) * pennantR;
      const ay = cy + Math.sin(arrowAngle) * pennantR;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(arrowAngle + Math.PI / 2);
      ctx.fillStyle = '#f0b020';
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.lineTo(18, 0);
      ctx.lineTo(-10, 18);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // 6. Forward Yellow/Amber RCS Thruster Quads with Micro Nozzles at Outer Rim
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

    // 7. Proportional Curved Text Drawing Helper
    // Measures character widths and applies clean Starfleet kerning
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
          ctx.rotate(charAngle + Math.PI / 2);
          ctx.fillText(chars[i], 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    };

    // 8. FORWARD (BOW) DECALS - MOVIE-ACCURATE STARFLEET MARKINGS (Matching user Image 2):
    // "NCC - 1701" - Main Starfleet Registry in bold crisp solid black on forward dorsal bow outer radius
    drawCurvedText(
      'NCC - 1701',
      1630,
      -Math.PI / 2, // Centered on forward bow (-Z)
      20,
      'bold 240px "Arial", "Helvetica Neue", "Segoe UI", sans-serif',
      '#030508'
    );

    // "U.S.S. ENTERPRISE" on inner concentric arc in front of the bridge
    drawCurvedText(
      'U.S.S.  ENTERPRISE',
      1220,
      -Math.PI / 2,
      14,
      'bold 130px "Arial", "Helvetica Neue", "Segoe UI", sans-serif',
      '#030508'
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = true; // Crucial: true maps canvas top (bow text) to uv.y = 1.0 (-Z bow)
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 4096 x 4096 Procedural CanvasTexture for the Saucer Ventral Hull (Underside):
 * Movie-accurate studio grey (#a4aebc), multi-tone Aztec panels, crisp seams, and planetary sensor dome.
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
  texture.flipY = true;
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

    // Aztec armor plating
    for (let x = 40; x < width - 40; x += 110) {
      for (let y = 15; y < height - 15; y += 50) {
        const h = Math.abs(pseudoHash(x * 1.7, y * 2.3));
        if (h > 0.32) {
          ctx.fillStyle = h > 0.72 ? 'rgba(235, 242, 252, 0.40)' : 'rgba(135, 148, 168, 0.30)';
          ctx.fillRect(x + 2, y + 2, 106, 46);
        }
      }
    }

    // Crisp horizontal panel seams
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.50)';
    ctx.lineWidth = 2.0;
    [25, 230, 480].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    // Vertical panel seams
    for (let x = 160; x < width; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, height - 15);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Nacelle Red Strap & Black NCC-1701 Livery Texture:
 * Replicates repo with 100% fidelity:
 * Red chevrons (<< or >>), horizontal solid red strap, inline bold black "NCC-1701",
 * continuing red strap, and dark aft termination vent cap with vertical cooling slats.
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
    // 1. Base hull coat
    ctx.fillStyle = '#a4aebc';
    ctx.fillRect(0, 0, width, height);

    // 2. Aztec armor plating
    for (let x = 40; x < width - 40; x += 110) {
      for (let y = 15; y < height - 15; y += 50) {
        const h = Math.abs(pseudoHash(x * 1.7, y * 2.3));
        if (h > 0.32) {
          ctx.fillStyle = h > 0.72 ? 'rgba(235, 242, 252, 0.40)' : 'rgba(135, 148, 168, 0.30)';
          ctx.fillRect(x + 2, y + 2, 106, 46);
        }
      }
    }

    // 3. Crisp horizontal panel seams
    ctx.strokeStyle = 'rgba(45, 55, 72, 0.50)';
    ctx.lineWidth = 2.0;
    [25, 230].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    });

    const cy = height / 2; // 128
    const strapH = 48;
    const strapY = cy - strapH / 2;
    const redColor = '#c41414'; // Vibrant Starfleet red
    const blackColor = '#05070a'; // Deep solid black

    if (!isPort) {
      // Starboard: Forward is on the LEFT, Aft on the RIGHT
      const drawChevronLeft = (tipX: number) => {
        ctx.fillStyle = redColor;
        ctx.beginPath();
        ctx.moveTo(tipX, cy);
        ctx.lineTo(tipX + 28, cy - strapH / 2);
        ctx.lineTo(tipX + 40, cy - strapH / 2);
        ctx.lineTo(tipX + 16, cy);
        ctx.lineTo(tipX + 40, cy + strapH / 2);
        ctx.lineTo(tipX + 28, cy + strapH / 2);
        ctx.closePath();
        ctx.fill();
      };

      drawChevronLeft(110);
      drawChevronLeft(145);

      const fwdStrapStart = 195;
      const fwdStrapEnd = 840;
      ctx.fillStyle = redColor;
      ctx.fillRect(fwdStrapStart, strapY, fwdStrapEnd - fwdStrapStart, strapH);

      ctx.save();
      ctx.font = '900 52px "Arial Black", "Impact", "Arial", sans-serif';
      ctx.fillStyle = blackColor;
      ctx.textBaseline = 'middle';
      const text = 'NCC-1701';
      let textX = 868;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        ctx.fillText(ch, textX, cy + 1);
        textX += ctx.measureText(ch).width + 6;
      }
      const textEnd = textX;
      ctx.restore();

      const aftStrapStart = textEnd + 24;
      const aftStrapEnd = 1860;
      ctx.fillStyle = redColor;
      ctx.fillRect(aftStrapStart, strapY, aftStrapEnd - aftStrapStart, strapH);

      // Aft dark vent/louver cap
      const ventX = aftStrapEnd + 10;
      const ventW = 56;
      const ventH = strapH + 6;
      const ventY = cy - ventH / 2;
      ctx.fillStyle = '#181d26';
      ctx.fillRect(ventX, ventY, ventW, ventH);
      ctx.strokeStyle = '#424c5e';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(ventX, ventY, ventW, ventH);

      for (let vx = ventX + 8; vx < ventX + ventW - 4; vx += 7) {
        ctx.strokeStyle = '#606c82';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vx, ventY + 4);
        ctx.lineTo(vx, ventY + ventH - 4);
        ctx.stroke();
      }
    } else {
      // Port orientation: Forward on the RIGHT, Aft on the LEFT
      const ventX = 120;
      const ventW = 56;
      const ventH = strapH + 6;
      const ventY = cy - ventH / 2;
      ctx.fillStyle = '#181d26';
      ctx.fillRect(ventX, ventY, ventW, ventH);
      ctx.strokeStyle = '#424c5e';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(ventX, ventY, ventW, ventH);

      for (let vx = ventX + 8; vx < ventX + ventW - 4; vx += 7) {
        ctx.strokeStyle = '#606c82';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vx, ventY + 4);
        ctx.lineTo(vx, ventY + ventH - 4);
        ctx.stroke();
      }

      const aftStrapStart = ventX + ventW + 10;
      const aftStrapEnd = 760;
      ctx.fillStyle = redColor;
      ctx.fillRect(aftStrapStart, strapY, aftStrapEnd - aftStrapStart, strapH);

      ctx.save();
      ctx.font = '900 52px "Arial Black", "Impact", "Arial", sans-serif';
      ctx.fillStyle = blackColor;
      ctx.textBaseline = 'middle';
      const text = 'NCC-1701';
      let textX = 788;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        ctx.fillText(ch, textX, cy + 1);
        textX += ctx.measureText(ch).width + 6;
      }
      const textEnd = textX;
      ctx.restore();

      const fwdStrapStart = textEnd + 24;
      const fwdStrapEnd = 1780;
      ctx.fillStyle = redColor;
      ctx.fillRect(fwdStrapStart, strapY, fwdStrapEnd - fwdStrapStart, strapH);

      const drawChevronRight = (tipX: number) => {
        ctx.fillStyle = redColor;
        ctx.beginPath();
        ctx.moveTo(tipX, cy);
        ctx.lineTo(tipX - 28, cy - strapH / 2);
        ctx.lineTo(tipX - 40, cy - strapH / 2);
        ctx.lineTo(tipX - 16, cy);
        ctx.lineTo(tipX - 40, cy + strapH / 2);
        ctx.lineTo(tipX - 28, cy + strapH / 2);
        ctx.closePath();
        ctx.fill();
      };
      drawChevronRight(1895);
      drawChevronRight(1860);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
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

    for (let x = 40; x < width - 40; x += 120) {
      for (let y = 40; y < height - 40; y += 80) {
        const h = Math.abs(pseudoHash(x * 1.3, y * 1.7));
        if (h > 0.35) {
          ctx1.fillStyle = h > 0.72 ? 'rgba(235, 242, 252, 0.4)' : 'rgba(135, 148, 168, 0.32)';
          ctx1.fillRect(x + 2, y + 2, 116, 76);
        }
      }
    }

    ctx1.fillStyle = '#fffdf0';
    ctx2.fillStyle = '#fffae0';
    for (let row = 0; row < 6; row++) {
      const y = 320 + row * 65;
      for (let col = 0; col < 28; col++) {
        const x = 180 + col * 58;
        if (Math.sin(row * 4.3 + col * 7.1) > -0.5) {
          ctx1.fillRect(x, y, 16, 22);
          ctx2.fillRect(x, y, 16, 22);
        }
      }
    }
  }

  const map = new THREE.CanvasTexture(c1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 16;
  map.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(c2);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
  emissiveMap.anisotropy = 16;
  emissiveMap.needsUpdate = true;

  return { map, emissiveMap };
}

/**
 * Movie-accurate glowing Navigational Deflector Dish texture:
 * Radiant cyan-white spoke lines (48 vanes), outer luminous nodes, segmented brass/gold core, and dark central aperture.
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

    // 1. Deep cinematic obsidian/space-blue backdrop
    ctx.fillStyle = '#020612';
    ctx.fillRect(0, 0, size, size);

    const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 490);
    bgGrad.addColorStop(0.0, '#0a1a30');
    bgGrad.addColorStop(0.35, '#051226');
    bgGrad.addColorStop(0.7, '#020917');
    bgGrad.addColorStop(1.0, '#01040a');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 480, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer luminous cyan glow corona behind the spokes
    const corona = ctx.createRadialGradient(cx, cy, 200, cx, cy, 460);
    corona.addColorStop(0.0, 'rgba(0, 180, 240, 0.05)');
    corona.addColorStop(0.6, 'rgba(0, 210, 255, 0.28)');
    corona.addColorStop(0.9, 'rgba(72, 230, 255, 0.45)');
    corona.addColorStop(1.0, 'rgba(0, 140, 220, 0.0)');
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, 465, 0, Math.PI * 2);
    ctx.fill();

    // 3. Radiant Cyan Spoke Lines
    const vanes = 48;
    const rInner = 175;
    const rOuter = 445;

    // Pass 1: Cyan bloom
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.55)';
    ctx.lineWidth = 8.0;
    ctx.lineCap = 'round';
    for (let i = 0; i < vanes; i++) {
      const a = (i / vanes) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx + cos * rInner, cy + sin * rInner);
      ctx.lineTo(cx + cos * rOuter, cy + sin * rOuter);
      ctx.stroke();
    }

    // Pass 2: Razor-sharp white/cyan core line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.2;
    for (let i = 0; i < vanes; i++) {
      const a = (i / vanes) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(cx + cos * rInner, cy + sin * rInner);
      ctx.lineTo(cx + cos * rOuter, cy + sin * rOuter);
      ctx.stroke();

      // Outer emitter bead
      ctx.fillStyle = '#00f7ff';
      ctx.beginPath();
      ctx.arc(cx + cos * rOuter, cy + sin * rOuter, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + cos * rOuter, cy + sin * rOuter, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Outer Concentric Connecting Cyan Ring
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Middle Segmented Brass/Gold Concentric Core Ring
    const brassR = 215;
    ctx.strokeStyle = '#e6a832';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, brassR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#fff0b8';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.arc(cx, cy, brassR, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Central Dark Aperture Emitter Hub
    const innerApertureR = 145;
    const apertureGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, innerApertureR);
    apertureGrad.addColorStop(0.0, '#001a33');
    apertureGrad.addColorStop(0.4, '#003366');
    apertureGrad.addColorStop(0.8, '#001a26');
    apertureGrad.addColorStop(1.0, '#020612');
    ctx.fillStyle = apertureGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, innerApertureR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.arc(cx, cy, innerApertureR, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Warp Coil Hexagonal Blue Grille Texture
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
    ctx1.fillStyle = '#061324';
    ctx1.fillRect(0, 0, width, height);

    ctx2.fillStyle = '#0284c7';
    ctx2.fillRect(0, 0, width, height);

    ctx1.strokeStyle = '#38bdf8';
    ctx1.lineWidth = 2.5;
    for (let x = 0; x < width; x += 18) {
      ctx1.beginPath();
      ctx1.moveTo(x, 0);
      ctx1.lineTo(x, height);
      ctx1.stroke();
    }

    ctx2.fillStyle = '#e0f2fe';
    for (let x = 0; x < width; x += 36) {
      ctx2.fillRect(x + 4, 18, 12, height - 36);
    }
  }

  const map = new THREE.CanvasTexture(c1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.anisotropy = 16;
  map.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(c2);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.ClampToEdgeWrapping;
  emissiveMap.anisotropy = 16;
  emissiveMap.needsUpdate = true;

  return { map, emissiveMap };
}

/**
 * Procedural Impulse Engine Honeycomb Texture
 */
function createImpulseHoneycombTexture(): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const width = 512;
  const height = 128;
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
    // Outer border of dark casing
    ctx1.fillStyle = '#0f1115';
    ctx1.fillRect(0, 0, width, height);

    ctx2.fillStyle = '#000000';
    ctx2.fillRect(0, 0, width, height);

    // Inner glowing radiant red chamber
    ctx1.fillStyle = '#b81204';
    ctx1.fillRect(4, 4, width - 8, height - 8);

    ctx2.fillStyle = '#ff1c05';
    ctx2.fillRect(4, 4, width - 8, height - 8);

    // Fine Starfleet honeycomb radiator grid
    const cellW = 16;
    const cellH = 14;
    for (let x = 6; x < width - 12; x += cellW) {
      for (let y = 6; y < height - 10; y += cellH) {
        // Glowing hot core
        ctx1.fillStyle = '#ff5522';
        ctx1.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
        ctx2.fillStyle = '#ff9944';
        ctx2.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        // Dark dividing matrix lines
        ctx1.strokeStyle = '#220804';
        ctx1.lineWidth = 1.8;
        ctx1.strokeRect(x, y, cellW, cellH);

        ctx2.strokeStyle = '#660800';
        ctx2.lineWidth = 1.0;
        ctx2.strokeRect(x, y, cellW, cellH);
      }
    }
  }

  const map = new THREE.CanvasTexture(c1);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 16;
  map.needsUpdate = true;

  const emissiveMap = new THREE.CanvasTexture(c2);
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.wrapS = THREE.RepeatWrapping;
  emissiveMap.wrapT = THREE.RepeatWrapping;
  emissiveMap.anisotropy = 16;
  emissiveMap.needsUpdate = true;

  return { map, emissiveMap };
}

/**
 * Master Enterprise Builder returning EnterpriseComponents
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
    roughness: 0.35,
    envMapIntensity: 0.35,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8e0e8,
    metalness: 0.85,
    roughness: 0.15,
    envMapIntensity: 0.5,
  });

  const redStripeMat = new THREE.MeshStandardMaterial({
    color: 0xc41414,
    metalness: 0.2,
    roughness: 0.4,
  });

  const hullWindowMat = new THREE.MeshStandardMaterial({
    map: hullSideTex.map,
    emissiveMap: hullSideTex.emissiveMap,
    emissive: new THREE.Color(0xfffae0),
    emissiveIntensity: 0.65,
    metalness: 0.25,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const warpBlueGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 4.8,
    roughness: 0.1,
    metalness: 0.1,
  });

  const deflectorDishMat = new THREE.MeshStandardMaterial({
    map: deflectorTex,
    color: 0xffffff,
    emissive: new THREE.Color(0x00bfff),
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.4,
    side: THREE.DoubleSide,
  });

  const bussardShellMat = new THREE.MeshStandardMaterial({
    color: 0xff5500,
    metalness: 0.1,
    roughness: 0.2,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });

  const impulseGlowMat = new THREE.MeshStandardMaterial({
    map: impulseHoneycombTex.map,
    emissiveMap: impulseHoneycombTex.emissiveMap,
    color: 0xffffff,
    emissive: new THREE.Color(0xff3300),
    emissiveIntensity: 3.5,
    roughness: 0.2,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  const alertStrobeMat = new THREE.MeshStandardMaterial({
    color: 0xff1100,
    emissive: new THREE.Color(0xff0000),
    emissiveIntensity: 0.0,
  });

  const portNavMat = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    emissive: new THREE.Color(0xff0000),
    emissiveIntensity: 2.5,
  });

  const stbdNavMat = new THREE.MeshStandardMaterial({
    color: 0x22ff44,
    emissive: new THREE.Color(0x00ff22),
    emissiveIntensity: 2.5,
  });

  const strobeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.0,
  });

  const allMaterials = [
    primaryHullMat,
    dorsalHullMat,
    ventralHullMat,
    nacelleHullMat,
    nacelleStrapStbdMat,
    nacelleStrapPortMat,
    darkTrimMat,
    chromeMat,
    redStripeMat,
    hullWindowMat,
    warpBlueGlowMat,
    bussardShellMat,
    impulseGlowMat,
    alertStrobeMat,
    portNavMat,
    stbdNavMat,
    strobeWhiteMat,
  ];

  // ==========================================
  // SHADER-BASED PROCEDURAL HULL DAMAGE SYSTEM (ACTIVE WHEN HULL INTEGRITY < 50%)
  // Procedurally renders carbon scorch marks, structural hull breaches with exposed glowing internal ribs,
  // and high-frequency electrical arc sparking across the Enterprise hull plating!
  // ==========================================
  const hullDamageUniforms = {
    uDamageLevel: { value: 0.0 },
    uDamageTime: { value: 0.0 },
  };

  const injectHullDamageShader = (mat: THREE.MeshStandardMaterial, scaleFreq: number = 0.72) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uDamageLevel = hullDamageUniforms.uDamageLevel;
      shader.uniforms.uDamageTime = hullDamageUniforms.uDamageTime;
      shader.uniforms.uDmgScale = { value: scaleFreq };

      shader.vertexShader =
        `
        uniform float uDamageLevel;
        uniform float uDmgScale;
        varying vec3 vDmgLocalPos;
        varying vec3 vDmgLocalNormal;

        float dmgVertHash(vec3 p) {
          p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vDmgLocalPos = position * uDmgScale;
        vDmgLocalNormal = normal;
        if (uDamageLevel > 0.001) {
          float bWave = sin(vDmgLocalPos.x * 2.3) * cos(vDmgLocalPos.y * 2.7) * sin(vDmgLocalPos.z * 1.9);
          float dentMask = smoothstep(0.48, 0.85, abs(bWave));
          transformed -= normal * (dentMask * uDamageLevel * 0.055);
        }
        `
      );

      shader.fragmentShader =
        `
        uniform float uDamageLevel;
        uniform float uDamageTime;
        varying vec3 vDmgLocalPos;
        varying vec3 vDmgLocalNormal;

        float dmgHash3(vec3 p) {
          p = fract(p * vec3(0.1031, 0.1030, 0.0973));
          p += dot(p, p.yxz + 33.33);
          return fract((p.x + p.y) * p.z);
        }

        float dmgNoise3(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(
              mix(dmgHash3(i + vec3(0, 0, 0)), dmgHash3(i + vec3(1, 0, 0)), f.x),
              mix(dmgHash3(i + vec3(0, 1, 0)), dmgHash3(i + vec3(1, 1, 0)), f.x),
              f.y
            ),
            mix(
              mix(dmgHash3(i + vec3(0, 0, 1)), dmgHash3(i + vec3(1, 0, 1)), f.x),
              mix(dmgHash3(i + vec3(0, 1, 1)), dmgHash3(i + vec3(1, 1, 1)), f.x),
              f.y
            ),
            f.z
          );
        }

        float dmgFbm3(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * dmgNoise3(p);
            p = p * 2.07 + vec3(1.7, 9.2, 4.3);
            a *= 0.5;
          }
          return v;
        }
        ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>
        float dmgScorchMask = 0.0;
        float dmgBreachMask = 0.0;
        float dmgEmberRim = 0.0;
        float dmgSparkArc = 0.0;
        float dmgStructuralRibs = 0.0;

        if (uDamageLevel > 0.001) {
          // Anisotropic plasma burn coordinates (streaked slightly along aft +Z flight axis)
          vec3 burnCoord = vec3(vDmgLocalPos.x * 1.15, vDmgLocalPos.y * 1.25, vDmgLocalPos.z * 0.72);
          float nMacro = dmgFbm3(burnCoord * 0.85);
          float nDetail = dmgFbm3(vDmgLocalPos * 3.4 + vec3(nMacro * 1.8));
          float impactField = nMacro * 0.65 + nDetail * 0.35;

          // Threshold drops as uDamageLevel increases (more scorches and hull breaches open up below 50% hull)
          float scorchThresh = mix(0.66, 0.36, uDamageLevel);
          dmgScorchMask = smoothstep(scorchThresh - 0.10, scorchThresh + 0.08, impactField);

          // Structural Hull Breach: deep inner core of blast crater where outer Aztec plating is torn away
          float breachThresh = scorchThresh + 0.11;
          dmgBreachMask = smoothstep(breachThresh, breachThresh + 0.045, impactField);

          // Molten superheated tritanium rim around the structural breach
          dmgEmberRim = clamp(dmgScorchMask - dmgBreachMask, 0.0, 1.0) * smoothstep(breachThresh - 0.07, breachThresh, impactField);

          // Exposed internal structural deck girders & conduits inside hull breach
          float gx = abs(sin(vDmgLocalPos.x * 26.0));
          float gy = abs(sin(vDmgLocalPos.y * 32.0));
          float gz = abs(sin(vDmgLocalPos.z * 26.0));
          dmgStructuralRibs = step(0.82, max(gx, max(gy, gz)));

          // High-frequency procedural electrical arcs & sparking around breach perimeters
          float arcRidge = 1.0 - abs(dmgNoise3(vDmgLocalPos * 6.5 + vec3(uDamageTime * 11.0, -uDamageTime * 8.0, uDamageTime * 5.0)) * 2.0 - 1.0);
          arcRidge = pow(clamp(arcRidge, 0.0, 1.0), 7.0);
          float cellSeed = floor(vDmgLocalPos.x * 2.5) * 13.0 + floor(vDmgLocalPos.y * 2.5) * 29.0 + floor(vDmgLocalPos.z * 2.5) * 47.0;
          float sparkStrobe = step(0.66, fract(sin(floor(uDamageTime * 22.0) * 19.7 + cellSeed) * 43758.5453));
          dmgSparkArc = arcRidge * sparkStrobe * smoothstep(scorchThresh - 0.04, breachThresh + 0.05, impactField);

          // 1. Carbon Scorch Marks & Soot-Blackened Armor Plating
          vec3 sootColor = vec3(0.035, 0.035, 0.042);
          vec3 heatTint = vec3(0.19, 0.12, 0.07);
          vec3 scorchedAlbedo = mix(heatTint, sootColor, smoothstep(0.2, 0.85, dmgScorchMask));
          diffuseColor.rgb = mix(diffuseColor.rgb, scorchedAlbedo, dmgScorchMask * 0.92);

          // 2. Structural Hull Breach Interior (Dark torn cavity + metallic deck girders)
          vec3 cavityColor = mix(vec3(0.01, 0.01, 0.015), vec3(0.25, 0.16, 0.10), dmgStructuralRibs);
          diffuseColor.rgb = mix(diffuseColor.rgb, cavityColor, dmgBreachMask);
        }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        #include <roughnessmap_fragment>
        if (uDamageLevel > 0.001) {
          // Charred hull and open breaches become matte and rough
          roughnessFactor = mix(roughnessFactor, 0.94, dmgScorchMask);
        }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <metalnessmap_fragment>',
        `
        #include <metalnessmap_fragment>
        if (uDamageLevel > 0.001) {
          metalnessFactor = mix(metalnessFactor, 0.08, dmgScorchMask * 0.85);
          metalnessFactor = mix(metalnessFactor, 0.85, dmgBreachMask * dmgStructuralRibs);
        }
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        if (uDamageLevel > 0.001) {
          // 3. Molten Plasma Fire & Exposed Superheated Hull Breach Glow
          float firePulse = 0.65 + 0.35 * sin(uDamageTime * 14.0 + vDmgLocalPos.x * 7.0 + vDmgLocalPos.z * 5.0);
          vec3 moltenCore = mix(vec3(0.95, 0.18, 0.01), vec3(1.0, 0.68, 0.14), firePulse * (1.0 - dmgStructuralRibs * 0.6));
          totalEmissiveRadiance += moltenCore * (dmgBreachMask * (1.8 + uDamageLevel * 2.4));

          // Glowing orange-red seared metal rim around the breach tear
          totalEmissiveRadiance += vec3(1.0, 0.32, 0.03) * (dmgEmberRim * 2.6 * firePulse);

          // 4. Procedural Electrical Arcs & Welding Sparks
          vec3 sparkColor = mix(vec3(0.45, 0.88, 1.0), vec3(1.0, 0.92, 0.55), fract(vDmgLocalPos.x * 9.3 + uDamageTime * 15.0));
          totalEmissiveRadiance += sparkColor * (dmgSparkArc * (4.5 + uDamageLevel * 4.0));
        }
        `
      );
    };
    mat.needsUpdate = true;
  };

  // Apply procedural hull damage shader to all exterior Enterprise hull & trim materials
  [
    primaryHullMat,
    dorsalHullMat,
    ventralHullMat,
    nacelleHullMat,
    nacelleStrapStbdMat,
    nacelleStrapPortMat,
    hullWindowMat,
    darkTrimMat,
  ].forEach((m) => injectHullDamageShader(m));

  // Helper for planar UV mapping (forward = -Z)
  const applySaucerPlanarUV = (geo: THREE.BufferGeometry, maxRadius = 6.52) => {
    const pos = geo.attributes.position;
    const count = pos.count;
    const uvs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      uvs[i * 2] = x / (2 * maxRadius) + 0.5;
      uvs[i * 2 + 1] = -z / (2 * maxRadius) + 0.5; // -Z is forward bow
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  };

  // ==========================================
  // 1. PRIMARY HULL (SAUCER SECTION) - SOLID WATERTIGHT MESH
  // Forward is -Z, Aft is +Z
  // ==========================================
  const saucerGroup = new THREE.Group();
  saucerGroup.name = 'PrimaryHull_Saucer';
  const initialSaucerPos = new THREE.Vector3(0, 2.35, -4.8);
  saucerGroup.position.copy(initialSaucerPos);
  modelWrapper.add(saucerGroup);

  // Lathe points defining the upper dorsal saucer surface
  const dorsalPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.95),
    new THREE.Vector2(0.55, 0.92),
    new THREE.Vector2(1.2, 0.82),
    new THREE.Vector2(2.1, 0.68),
    new THREE.Vector2(3.2, 0.52),
    new THREE.Vector2(4.4, 0.35),
    new THREE.Vector2(5.5, 0.18),
    new THREE.Vector2(6.2, 0.08),
    new THREE.Vector2(6.5, 0.04),
    new THREE.Vector2(6.52, 0.0),
  ];
  const dorsalGeo = new THREE.LatheGeometry(dorsalPoints, 128);
  applySaucerPlanarUV(dorsalGeo, 6.52);
  const dorsalMesh = new THREE.Mesh(dorsalGeo, dorsalHullMat);
  saucerGroup.add(dorsalMesh);

  // Lathe points defining the lower ventral saucer surface
  const ventralPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, -0.65),
    new THREE.Vector2(0.65, -0.62),
    new THREE.Vector2(1.3, -0.55),
    new THREE.Vector2(2.2, -0.42),
    new THREE.Vector2(3.4, -0.28),
    new THREE.Vector2(4.6, -0.16),
    new THREE.Vector2(5.6, -0.07),
    new THREE.Vector2(6.3, -0.02),
    new THREE.Vector2(6.52, 0.0),
  ];
  const ventralGeo = new THREE.LatheGeometry(ventralPoints, 128);
  applySaucerPlanarUV(ventralGeo, 6.52);
  const ventralMesh = new THREE.Mesh(ventralGeo, ventralHullMat);
  saucerGroup.add(ventralMesh);

  // Saucer Outer Rim Band with Illuminated Deck Windows
  const rimBandGeo = new THREE.CylinderGeometry(6.505, 6.505, 0.08, 128, 1, true);
  const rimBandMesh = new THREE.Mesh(rimBandGeo, hullWindowMat);
  saucerGroup.add(rimBandMesh);

  // Navigation Running Lights on Saucer Rim
  const portSaucerLight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), portNavMat);
  portSaucerLight.position.set(-6.48, 0, 0);
  saucerGroup.add(portSaucerLight);

  const stbdSaucerLight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), stbdNavMat);
  stbdSaucerLight.position.set(6.48, 0, 0);
  saucerGroup.add(stbdSaucerLight);

  // GROUNDED BRIDGE MODULE & SLEEK TEARDROP FAIRING
  const bridgeTeardropGroup = new THREE.Group();
  bridgeTeardropGroup.position.set(0, 0.94, 0);
  saucerGroup.add(bridgeTeardropGroup);

  // Tier 1: Grounded Teardrop streamlined fairing
  const tearShape = new THREE.Shape();
  tearShape.moveTo(0, -1.8);
  tearShape.bezierCurveTo(0.9, -1.2, 0.9, 0.7, 0, 1.1);
  tearShape.bezierCurveTo(-0.9, 0.7, -0.9, -1.2, 0, -1.8);

  const tearExtrude = new THREE.ExtrudeGeometry(tearShape, {
    depth: 0.32,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.08,
    bevelThickness: 0.06,
  });
  tearExtrude.rotateX(-Math.PI / 2);
  const tearBaseMesh = new THREE.Mesh(tearExtrude, primaryHullMat);
  tearBaseMesh.position.set(0, -0.05, 0);
  bridgeTeardropGroup.add(tearBaseMesh);

  // Tier 2: Mid bridge cylindrical collar
  const midBridgeGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.14, 48);
  const midBridgeMesh = new THREE.Mesh(midBridgeGeo, primaryHullMat);
  midBridgeMesh.position.set(0, 0.36, -0.05);
  bridgeTeardropGroup.add(midBridgeMesh);

  // Tier 3: Command Bridge Dome
  const bridgeDomeGeo = new THREE.SphereGeometry(0.38, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
  bridgeDomeGeo.scale(1, 0.48, 1);
  const bridgeDomeMesh = new THREE.Mesh(bridgeDomeGeo, chromeMat);
  bridgeDomeMesh.position.set(0, 0.43, -0.05);
  bridgeTeardropGroup.add(bridgeDomeMesh);

  // Synchronized White Strobe Beacon on Bridge Dome Apex
  const bridgeStrobeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), strobeWhiteMat);
  bridgeStrobeMesh.position.set(0, 0.62, -0.05);
  bridgeTeardropGroup.add(bridgeStrobeMesh);

  // Forward Bridge Viewscreen (facing -Z)
  const viewscreenMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.06), darkTrimMat);
  viewscreenMesh.position.set(0, 0.45, -0.42);
  bridgeTeardropGroup.add(viewscreenMesh);

  // ==========================================
  // DEDICATED REAR SAUCER IMPULSE PROPULSION UNIT
  // Located at aft (+Z) of the saucer rim (Matching user Images 2 & 3!)
  // ==========================================
  const impulseGroup = new THREE.Group();
  impulseGroup.name = 'Saucer_Impulse_Unit';
  impulseGroup.position.set(0, 0.12, 6.10);
  saucerGroup.add(impulseGroup);

  // 1. Sleek, low-profile dark impulse casing housing (Image 3)
  const impulseHousingGeo = new THREE.BoxGeometry(3.6, 0.44, 0.85);
  const impulseHousingMesh = new THREE.Mesh(impulseHousingGeo, darkTrimMat);
  impulseHousingMesh.position.set(0, 0.04, -0.05);
  impulseGroup.add(impulseHousingMesh);

  // Upper aerodynamic beveled lip blending smoothly into saucer dorsal slope (Image 2 & 3)
  const upperLipGeo = new THREE.BoxGeometry(3.3, 0.12, 0.70);
  const upperLipMesh = new THREE.Mesh(upperLipGeo, primaryHullMat);
  upperLipMesh.position.set(0, 0.22, -0.08);
  impulseGroup.add(upperLipMesh);

  // 2. Dual Honeycomb Exhaust Grilles (Left & Right) facing aft (+Z) (Image 3)
  let impulseLeftMesh: THREE.Mesh | null = null;
  [-0.95, 0.95].forEach((gx, idx) => {
    // Glowing exhaust aperture facing aft (+Z)
    const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.28, 0.10), impulseGlowMat);
    grilleMesh.position.set(gx, 0.04, 0.40);
    impulseGroup.add(grilleMesh);
    if (idx === 0) impulseLeftMesh = grilleMesh;

    // Dark beveled frame surrounding each thruster port
    const frameGeo = new THREE.BoxGeometry(1.25, 0.36, 0.06);
    const frameMesh = new THREE.Mesh(frameGeo, darkTrimMat);
    frameMesh.position.set(gx, 0.04, 0.36);
    impulseGroup.add(frameMesh);
  });

  // 3. Central Dark Divider Wedge between thrusters (Image 3)
  const dividerGeo = new THREE.BoxGeometry(0.38, 0.42, 0.18);
  const dividerMesh = new THREE.Mesh(dividerGeo, darkTrimMat);
  dividerMesh.position.set(0, 0.04, 0.41);
  impulseGroup.add(dividerMesh);

  // Central Glowing Red Beacon Light in divider (as seen in user Image 3!)
  const centerBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xff2200,
      emissive: new THREE.Color(0xff1100),
      emissiveIntensity: 4.5,
      roughness: 0.1,
    })
  );
  centerBeacon.position.set(0, 0.04, 0.50);
  impulseGroup.add(centerBeacon);

  // 4. Horizontal Accent Slats extending to port and starboard along saucer rim (Image 3)
  [-2.15, 2.15].forEach((sx) => {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.10), darkTrimMat);
    slat.position.set(sx, 0.04, 0.38);
    impulseGroup.add(slat);
  });

  // 5. Twin Downward Spotlights illuminating the neck spine (Image 3)
  [-0.38, 0.38].forEach((lx) => {
    const spotFixture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.8, roughness: 0.2 })
    );
    spotFixture.position.set(lx, -0.16, 0.0);
    spotFixture.rotation.x = -0.3;
    impulseGroup.add(spotFixture);

    const downLight = new THREE.PointLight(0xaaddff, 0.5, 6.0);
    downLight.position.set(lx, -0.22, 0.0);
    impulseGroup.add(downLight);
  });

  const impulseMainGlowLight = new THREE.PointLight(0xff3300, 2.0, 14);
  impulseMainGlowLight.position.set(0, 0.04, 1.0);
  impulseGroup.add(impulseMainGlowLight);

  // Ventral Planetary Sensor Dome
  const ventralDomeGeo = new THREE.SphereGeometry(1.15, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
  ventralDomeGeo.scale(1, 0.42, 1);
  const ventralDome = new THREE.Mesh(ventralDomeGeo, chromeMat);
  ventralDome.position.set(0, -0.65, 0);
  saucerGroup.add(ventralDome);

  const ventralRingGeo = new THREE.CylinderGeometry(1.55, 1.35, 0.18, 48, 1, false);
  const ventralRing = new THREE.Mesh(ventralRingGeo, hullWindowMat);
  ventralRing.position.set(0, -0.58, 0);
  saucerGroup.add(ventralRing);

  // Ventral Phaser Strips (facing forward -Z)
  [-2.8, 2.8].forEach((px) => {
    const phaserStrip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.25), darkTrimMat);
    phaserStrip.position.set(px, -0.4, -2.5);
    phaserStrip.rotation.y = px > 0 ? -0.4 : 0.4;
    saucerGroup.add(phaserStrip);
  });

  // ==========================================
  // 2. DORSAL CONNECTING NECK - ORGANIC 3D LOFTED AERODYNAMIC WING
  // Continuous 3D lofted airfoil connecting secondary hull to saucer
  // ==========================================
  const neckGroup = new THREE.Group();
  neckGroup.name = 'ConnectingNeck';
  modelWrapper.add(neckGroup);

  const createSculptedKelvinNeckGeo = (): THREE.BufferGeometry => {
    const slicesY = 32;
    const radialSegments = 36;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const yBottom = -0.45; // Deep inside secondary hull
    const yTop = 2.45;     // Deep inside saucer underside

    for (let iy = 0; iy <= slicesY; iy++) {
      const t = iy / slicesY;
      const y = yBottom + t * (yTop - yBottom);

      // In standard coords, forward is -Z. Cutwater sweeps forward to -Z.
      const zFront = -(2.22 + 1.43 * Math.pow(t, 0.82));
      const zBack = -(-0.35 - 0.90 * Math.pow(t, 0.92));

      const chordLen = zBack - zFront;
      const zMid = (zFront + zBack) * 0.5;

      const waistFactor = Math.pow(Math.abs(t - 0.52) * 2, 2.2);
      const halfWidth = 0.26 + 0.38 * waistFactor;

      for (let ir = 0; ir <= radialSegments; ir++) {
        const u = ir / radialSegments;
        const angle = u * Math.PI * 2;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        let localZ = 0;
        if (cosA >= 0) {
          localZ = -cosA * (zMid - zFront);
        } else {
          localZ = -cosA * (zBack - zMid);
        }
        const worldZ = zMid + localZ;

        const chordPos = THREE.MathUtils.clamp((worldZ - zFront) / chordLen, 0, 1);
        const tearFactor = 4.0 * chordPos * (1.0 - chordPos);
        const profileTear = Math.pow(Math.max(0, tearFactor), 0.55);
        const worldX = sinA * halfWidth * profileTear;

        positions.push(worldX, y, worldZ);
        uvs.push(u, t);
      }
    }

    for (let iy = 0; iy < slicesY; iy++) {
      for (let ir = 0; ir < radialSegments; ir++) {
        const a = iy * (radialSegments + 1) + ir;
        const b = (iy + 1) * (radialSegments + 1) + ir;
        const c = (iy + 1) * (radialSegments + 1) + (ir + 1);
        const d = iy * (radialSegments + 1) + (ir + 1);

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

  const sculptedNeckGeo = createSculptedKelvinNeckGeo();
  const neckMesh = new THREE.Mesh(sculptedNeckGeo, primaryHullMat);
  neckGroup.add(neckMesh);

  // Forward Photon Torpedo Launcher Bay (facing -Z)
  const torpedoBayGeo = new THREE.BoxGeometry(0.38, 0.44, 0.46);
  const torpedoBayMesh = new THREE.Mesh(torpedoBayGeo, darkTrimMat);
  torpedoBayMesh.position.set(0, 0.82, -2.72);
  neckGroup.add(torpedoBayMesh);

  // Twin launcher tube nozzles with glowing cyan launcher cores
  [-0.11, 0.11].forEach((tx) => {
    const tubeNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.16, 16), darkTrimMat);
    tubeNozzle.rotation.x = -Math.PI / 2;
    tubeNozzle.position.set(tx, 0.82, -2.92);
    neckGroup.add(tubeNozzle);

    const tubeCore = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), warpBlueGlowMat);
    tubeCore.position.set(tx, 0.82, -2.96);
    neckGroup.add(tubeCore);
  });

  // Micro Illuminated Deck Windows on Neck Flanks
  const neckWindowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xfff8db),
    emissiveIntensity: 0.8,
  });
  [-1, 1].forEach((side) => {
    for (let r = 0; r < 4; r++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.04, 0.06), neckWindowMat);
      win.position.set(side * 0.28, 0.45 + r * 0.38, -0.65 - r * 0.28);
      neckGroup.add(win);
    }
  });

  // ==========================================
  // 3. SECONDARY HULL (ENGINEERING SECTION, DEFLECTOR DISH & SYMMETRICAL SHUTTLEBAY)
  // Forward is -Z, Aft is +Z
  // ==========================================
  const engGroup = new THREE.Group();
  engGroup.name = 'SecondaryHull_Engineering';
  const initialEngPos = new THREE.Vector3(0, -1.45, 1.1);
  engGroup.position.copy(initialEngPos);
  modelWrapper.add(engGroup);

  // Closed watertight lathe mesh with recessed cylindrical forward deflector opening
  const engPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 3.25),   // Recessed inner hub of deflector housing
    new THREE.Vector2(1.18, 3.48),  // Inner recessed dish perimeter
    new THREE.Vector2(1.42, 3.75),  // Inner beveled wall of cowl opening
    new THREE.Vector2(1.52, 3.82),  // Front outer lip of opening
    new THREE.Vector2(1.64, 3.65),  // Outer hull shoulder
    new THREE.Vector2(1.72, 2.4),
    new THREE.Vector2(1.68, 0.5),
    new THREE.Vector2(1.48, -1.8),
    new THREE.Vector2(1.22, -3.6),
    new THREE.Vector2(0.95, -4.45),
    new THREE.Vector2(0.0, -4.5),   // SOLID SEALED AFT APEX
  ];
  const engHullGeo = new THREE.LatheGeometry(engPoints, 64);
  engHullGeo.rotateX(-Math.PI / 2); // Rotate so Y=3.82 points to -Z (Forward)
  const engHullMesh = new THREE.Mesh(engHullGeo, hullWindowMat);
  engGroup.add(engHullMesh);

  // MOVIE-ACCURATE KELVIN NAVIGATIONAL DEFLECTOR
  // Features 36 luminous cyan radial spokes with outer emitter beads, concentric rings, and electric-blue glow
  const deflectorAssembly = new THREE.Group();
  deflectorAssembly.name = 'Kelvin_Deflector_Assembly';
  deflectorAssembly.position.set(0, 0, -3.82);
  engGroup.add(deflectorAssembly);

  // 1. Concave Dark Metallic Backing Dish
  const backingDishGeo = new THREE.SphereGeometry(1.36, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42);
  backingDishGeo.rotateX(Math.PI / 2);
  const backingDishMat = new THREE.MeshStandardMaterial({
    map: deflectorTex,
    color: 0xffffff,
    metalness: 0.75,
    roughness: 0.25,
    emissive: new THREE.Color(0x004466),
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
  });
  const backingDish = new THREE.Mesh(backingDishGeo, backingDishMat);
  backingDish.position.set(0, 0, 0.35);
  deflectorAssembly.add(backingDish);

  // 2. Inner Glowing Electric-Blue Core Disc
  const coreDiscGeo = new THREE.CircleGeometry(0.52, 48);
  const coreDiscMat = new THREE.MeshStandardMaterial({
    color: 0x00f7ff,
    emissive: new THREE.Color(0x00d8ff),
    emissiveIntensity: 4.5,
    roughness: 0.1,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const coreDisc = new THREE.Mesh(coreDiscGeo, coreDiscMat);
  coreDisc.position.set(0, 0, 0.18);
  deflectorAssembly.add(coreDisc);

  // Central dark aperture iris
  const irisGeo = new THREE.CircleGeometry(0.18, 32);
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x02050c });
  const iris = new THREE.Mesh(irisGeo, irisMat);
  iris.position.set(0, 0, 0.17);
  deflectorAssembly.add(iris);

  // 3. Inner & Outer Glowing Cyan Torus Rings
  const innerRingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 4.0,
    metalness: 0.1,
    roughness: 0.1,
  });
  const innerTorus = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.024, 16, 64), innerRingMat);
  innerTorus.position.set(0, 0, 0.12);
  deflectorAssembly.add(innerTorus);

  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00bfff),
    emissiveIntensity: 3.2,
    metalness: 0.1,
    roughness: 0.1,
  });
  const outerTorus = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.024, 16, 64), outerRingMat);
  outerTorus.position.set(0, 0, 0.02);
  deflectorAssembly.add(outerTorus);

  // 4. Array of 36 Luminous Cyan Radial Spokes
  const numSpokes = 36;
  const rInner = 0.54;
  const rOuter = 1.24;
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
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.position.set(cosA * rMid, sinA * rMid, 0.06);
    spoke.rotation.z = angle - Math.PI / 2;
    deflectorAssembly.add(spoke);

    const bead = new THREE.Mesh(beadGeo, beadMat);
    bead.position.set(cosA * rOuter, sinA * rOuter, 0.02);
    deflectorAssembly.add(bead);
  }

  // Stepped Dark Bezel Collar Ring
  const deflectorCollar = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.075, 16, 64), darkTrimMat);
  deflectorCollar.position.set(0, 0, -0.05);
  deflectorAssembly.add(deflectorCollar);

  // Radiant Electric Cyan Beam Point Light
  const deflectorPointLight = new THREE.PointLight(0x00d8ff, 1.2, 14.0);
  deflectorPointLight.position.set(0, 0, -0.45);
  deflectorAssembly.add(deflectorPointLight);

  // REAR SHUTTLEBAY & SYMMETRICAL CLOSED CLAMSHELL DOORS (at Aft +Z)
  const shuttlebayGroup = new THREE.Group();
  shuttlebayGroup.position.set(0, 0.12, 4.46);
  engGroup.add(shuttlebayGroup);

  // Smooth Overhanging Hangar Cowl Arch
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

  // Symmetrical Closed Clamshell Dome Cap
  const clamshellDomeGeo = new THREE.SphereGeometry(0.95, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
  clamshellDomeGeo.rotateX(Math.PI / 2);
  clamshellDomeGeo.scale(0.96, 0.82, 0.38);
  const clamshellMat = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    metalness: 0.7,
    roughness: 0.3,
  });
  const clamshellDome = new THREE.Mesh(clamshellDomeGeo, clamshellMat);
  clamshellDome.position.set(0, 0, 0.02);
  shuttlebayGroup.add(clamshellDome);

  // Vertical Center Parting Seam
  const clamshellSeam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.6, 0.22), darkTrimMat);
  clamshellSeam.position.set(0, 0.1, 0.18);
  shuttlebayGroup.add(clamshellSeam);

  // Horizontal Approach Runway with Guidance Lights
  const runwayGeo = new THREE.BoxGeometry(0.24, 0.04, 1.5);
  const runwayMat = new THREE.MeshStandardMaterial({
    color: 0x00f7ff,
    emissive: new THREE.Color(0x00e5ff),
    emissiveIntensity: 2.0,
  });
  const runwayMesh = new THREE.Mesh(runwayGeo, runwayMat);
  runwayMesh.position.set(0, -0.2, 0.65);
  shuttlebayGroup.add(runwayMesh);

  // ==========================================
  // 4. WARP NACELLES & PYLONS - SEAMLESS, EMBEDDED & WATERTIGHT
  // Starboard = +X, Port = -X, Bussards = -Z, Exhausts = +Z
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
    // 1. Mathematically anchored Pylon Strut (ZERO gap, sweeping upward, outward and backward)
    // Anchored in upper rear flank of secondary hull to underside forward-mid nacelle
    const P_root = new THREE.Vector3(side * 1.15, -0.45, 2.9);
    const P_tip = new THREE.Vector3(side * 4.4, 3.35, 6.2);
    const dir = new THREE.Vector3().subVectors(P_tip, P_root);
    const pylonLen = dir.length();
    const mid = new THREE.Vector3().addVectors(P_root, P_tip).multiplyScalar(0.5);

    // Solid aerodynamic airfoil strut deeply penetrating secondary hull & nacelle
    const pylonGeo = new THREE.BoxGeometry(0.34, pylonLen + 0.9, 1.6);
    const pylonMesh = new THREE.Mesh(pylonGeo, primaryHullMat);
    const pylonQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    pylonMesh.quaternion.copy(pylonQuat);
    pylonMesh.position.copy(mid);
    pylonsGroup.add(pylonMesh);

    // Solid Root Fairing Cuff embedding into secondary hull flank
    const rootCuff = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.82, 2.1), primaryHullMat);
    rootCuff.position.set(side * 1.35, -0.45, 2.9);
    rootCuff.rotation.z = -side * 0.48;
    rootCuff.rotation.y = -side * 0.18;
    pylonsGroup.add(rootCuff);

    // Solid Nacelle Saddle Fairing embedding into nacelle cylinder keel
    const nacSaddle = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.70, 2.0), primaryHullMat);
    nacSaddle.position.set(side * 4.4, 3.35, 6.2);
    nacSaddle.rotation.z = -side * 0.25;
    pylonsGroup.add(nacSaddle);

    // Glowing Cyan-Blue Warp Energy Grills along inner face of the pylon
    const pylonGrillGeo = new THREE.BoxGeometry(0.10, pylonLen * 0.65, 0.32);
    const pylonGrill = new THREE.Mesh(pylonGrillGeo, warpBlueGlowMat);
    pylonGrill.quaternion.copy(pylonQuat);
    pylonGrill.position.copy(mid);
    pylonGrill.position.x += side * 0.17;
    pylonsGroup.add(pylonGrill);

    const targetNacelleGroup = side === -1 ? nacelleLeftGroup : nacelleRightGroup;

    // Solid closed cylindrical nacelle body (with livery texture)
    // Starts at front cap (0, 5.2) and closes at rear cap (0, -5.2)
    const nacPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 5.2),   // SOLID SEALED FRONT APEX (points to -Z)
      new THREE.Vector2(0.35, 5.2),
      new THREE.Vector2(0.64, 5.4),
      new THREE.Vector2(0.84, 4.4),
      new THREE.Vector2(0.98, 1.5),
      new THREE.Vector2(1.02, -2.15),
      new THREE.Vector2(1.05, -2.3),
      new THREE.Vector2(1.05, -4.85),
      new THREE.Vector2(1.05, -5.2),
      new THREE.Vector2(0.0, -5.2),  // SOLID SEALED AFT APEX (points to +Z)
    ];
    const nacBodyGeo = new THREE.LatheGeometry(nacPoints, 64);
    nacBodyGeo.rotateX(-Math.PI / 2); // Front (Y=5.2) points to -Z
    const nacBodyMesh = new THREE.Mesh(nacBodyGeo, nacelleHullMat);
    targetNacelleGroup.add(nacBodyMesh);

    // BUSSARD COLLECTOR (at front cap z = -5.16)
    // 1. Solid opaque metallic-grey backplate disc at the base
    const backplateGeo = new THREE.CylinderGeometry(1.04, 1.04, 0.08, 48);
    backplateGeo.rotateX(-Math.PI / 2);
    const backplateMesh = new THREE.Mesh(backplateGeo, primaryHullMat);
    backplateMesh.position.set(0, 0, -5.16);
    targetNacelleGroup.add(backplateMesh);

    // 2. Bussard Forward Collar Ring matching exact nacelle radius
    const bussardCollar = new THREE.Mesh(new THREE.TorusGeometry(1.01, 0.04, 24, 64), chromeMat);
    bussardCollar.position.set(0, 0, -5.18);
    targetNacelleGroup.add(bussardCollar);

    // 3. Orange Bussard Collector Hemisphere Dome matching exact front radius 1.05
    const bussardDomeGeo = new THREE.SphereGeometry(1.045, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    bussardDomeGeo.rotateX(-Math.PI / 2);
    const bussardDome = new THREE.Mesh(bussardDomeGeo, bussardShellMat);
    bussardDome.position.set(0, 0, -5.18);
    targetNacelleGroup.add(bussardDome);

    if (side === -1) bussardMeshLeft = bussardDome;
    else bussardMeshRight = bussardDome;

    // 4. Internal Glowing Amber Point Light sealed inside the dome
    const bussardLight = new THREE.PointLight(0xff4400, 0.28, 4.0);
    bussardLight.position.set(0, 0, -5.25);
    targetNacelleGroup.add(bussardLight);
    bussardLights.push(bussardLight);

    // 5. Internal Spinning Rotor Blades inside the sealed dome
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 0, -5.25);
    targetNacelleGroup.add(rotorGroup);
    bussardRotors.push(rotorGroup);

    const coreBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xffaa00),
        emissiveIntensity: 2.8,
      })
    );
    coreBulb.position.set(0, 0, 0.1);
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
      blade.position.set(Math.cos(bladeAngle) * 0.42, Math.sin(bladeAngle) * 0.42, 0.04);
      blade.rotation.z = bladeAngle + 0.35;
      rotorGroup.add(blade);
    }

    // MOVIE-ACCURATE NACELLE FLANKS
    // Mount red strap & black NCC-1701 banner on both flanks of each nacelle
    const createStrapMesh = (xPos: number, facesPositiveX: boolean) => {
      const geo = new THREE.BufferGeometry();
      const zFront = -3.8;
      const zAft = 4.4;
      const yTop = 0.35;
      const yBot = -0.03;

      const pos = new Float32Array([
        xPos, yTop, zFront,
        xPos, yBot, zFront,
        xPos, yBot, zAft,
        xPos, yTop, zAft,
      ]);

      const uvs = facesPositiveX
        ? new Float32Array([0, 0, 0, 1, 1, 1, 1, 0])
        : new Float32Array([1, 0, 1, 1, 0, 1, 0, 0]);

      const indices = facesPositiveX ? [0, 1, 2, 0, 2, 3] : [0, 3, 2, 0, 2, 1];

      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mat = facesPositiveX ? nacelleStrapStbdMat : nacelleStrapPortMat;
      return new THREE.Mesh(geo, mat);
    };

    targetNacelleGroup.add(createStrapMesh(-1.058, false));
    targetNacelleGroup.add(createStrapMesh(1.058, true));

    // Outboard Chamfer Bevels (Upper & Lower)
    const outboardDir = side;
    const outboardX = outboardDir * 1.055;
    const zFront = -3.8;
    const zAft = 4.4;
    const yTop = 0.35;
    const yBot = -0.03;

    // Upper chamfer
    const upChamferGeo = new THREE.BufferGeometry();
    const upChamferPos = new Float32Array([
      outboardX, yTop, zFront,
      outboardDir * 0.88, 0.82, zFront,
      outboardDir * 0.88, 0.82, zAft,
      outboardX, yTop, zAft,
    ]);
    upChamferGeo.setAttribute('position', new THREE.BufferAttribute(upChamferPos, 3));
    upChamferGeo.setIndex(outboardDir === -1 ? [0, 1, 2, 0, 2, 3] : [0, 3, 2, 0, 2, 1]);
    upChamferGeo.computeVertexNormals();
    targetNacelleGroup.add(new THREE.Mesh(upChamferGeo, primaryHullMat));

    // Lower chamfer
    const botChamferGeo = new THREE.BufferGeometry();
    const botChamferPos = new Float32Array([
      outboardX, yBot, zFront,
      outboardX, yBot, zAft,
      outboardDir * 0.88, -0.82, zAft,
      outboardDir * 0.88, -0.82, zFront,
    ]);
    botChamferGeo.setAttribute('position', new THREE.BufferAttribute(botChamferPos, 3));
    botChamferGeo.setIndex(outboardDir === -1 ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3]);
    botChamferGeo.computeVertexNormals();
    targetNacelleGroup.add(new THREE.Mesh(botChamferGeo, primaryHullMat));

    // 3D Physical Cooling Louver Trench on the Outboard Flank
    const louverTrench = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 5.2), darkTrimMat);
    louverTrench.position.set(outboardDir * 1.045, -0.32, 0.4);
    targetNacelleGroup.add(louverTrench);

    for (let sy = -0.045; sy <= 0.045; sy += 0.03) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.010, 5.16), primaryHullMat);
      slat.position.set(outboardDir * 1.052, -0.32 + sy, 0.4);
      targetNacelleGroup.add(slat);
    }

    // 3D Physical Forward and Aft RCS Quad Housings on Outboard Shoulder
    [
      { z: -3.2, y: 0.58 },
      { z: 3.8, y: 0.58 },
    ].forEach((rcs) => {
      const rcsBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.18), darkTrimMat);
      rcsBox.position.set(outboardDir * 1.01, rcs.y, rcs.z);
      targetNacelleGroup.add(rcsBox);

      const rcsFace = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.12, 0.14),
        new THREE.MeshStandardMaterial({
          color: 0xe69022,
          emissive: new THREE.Color(0x8a4502),
          emissiveIntensity: 0.4,
        })
      );
      rcsFace.position.set(outboardDir * 1.07, rcs.y, rcs.z);
      targetNacelleGroup.add(rcsFace);
    });

    // INBOARD WARP FIELD CHILLER GRILLES (Along lower inboard flank)
    const inboardDir = -side;
    const grilleInnerX = inboardDir * 0.98;
    const grilleY = -0.22;

    const plasmaStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 4.6), warpBlueGlowMat);
    plasmaStrip.position.set(grilleInnerX, grilleY, 0.5);
    targetNacelleGroup.add(plasmaStrip);

    if (side === -1) warpCoilMeshLeft = plasmaStrip;
    else warpCoilMeshRight = plasmaStrip;

    const trench = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 4.64), darkTrimMat);
    trench.position.set(inboardDir * 0.95, grilleY, 0.5);
    targetNacelleGroup.add(trench);

    const warpInnerLight = new THREE.PointLight(0x00d8ff, 0.35, 5.0);
    warpInnerLight.position.set(grilleInnerX, grilleY, 0.5);
    targetNacelleGroup.add(warpInnerLight);

    // 18 vertical dark chiller slats
    for (let k = 0; k < 18; k++) {
      const slatZ = -1.8 + k * 0.25;
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.05), darkTrimMat);
      slat.position.set(grilleInnerX, grilleY, slatZ);
      targetNacelleGroup.add(slat);
    }

    // Aft Nacelle Exhaust Navigation Beacon
    const aftNavLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      side === -1 ? portNavMat : stbdNavMat
    );
    aftNavLight.position.set(side * 0.65, 0.82, 4.8);
    targetNacelleGroup.add(aftNavLight);
  });

  // ==========================================
  // 5. DEFENSIVE SHIELD BUBBLE
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
  shieldBubble.position.set(0, 0.5, 0);
  root.add(shieldBubble);

  // Origins for torpedoes and phasers in world coordinates
  const torpedoOrigin = new THREE.Vector3(0, 0.82 * MODEL_SCALE, -2.96 * MODEL_SCALE);
  const phaserOriginLeft = new THREE.Vector3(-2.8 * MODEL_SCALE, -0.4 * MODEL_SCALE, -2.5 * MODEL_SCALE);
  const phaserOriginRight = new THREE.Vector3(2.8 * MODEL_SCALE, -0.4 * MODEL_SCALE, -2.5 * MODEL_SCALE);

  const subsystemNodes = new Map<string, THREE.Vector3>();
  subsystemNodes.set('saucer', new THREE.Vector3(0, 2.35 * MODEL_SCALE, -4.8 * MODEL_SCALE));
  subsystemNodes.set('bridge', new THREE.Vector3(0, 3.65 * MODEL_SCALE, -4.3 * MODEL_SCALE));
  subsystemNodes.set('deflector', new THREE.Vector3(0, -1.45 * MODEL_SCALE, -4.9 * MODEL_SCALE));
  subsystemNodes.set('impulse', new THREE.Vector3(0, 2.47 * MODEL_SCALE, 1.30 * MODEL_SCALE));
  subsystemNodes.set('nacelles', new THREE.Vector3(0, 3.85 * MODEL_SCALE, 7.2 * MODEL_SCALE));
  subsystemNodes.set('warpCoils', new THREE.Vector3(0, 3.85 * MODEL_SCALE, 7.2 * MODEL_SCALE));
  subsystemNodes.set('bussards', new THREE.Vector3(4.5 * MODEL_SCALE, 3.85 * MODEL_SCALE, -5.2 * MODEL_SCALE));
  subsystemNodes.set('shuttlebay', new THREE.Vector3(0, -1.33 * MODEL_SCALE, 5.5 * MODEL_SCALE));
  subsystemNodes.set('engineering', new THREE.Vector3(0, -1.45 * MODEL_SCALE, 1.1 * MODEL_SCALE));

  // ==========================================
  // 5B. 3D VOLUMETRIC HULL BREACH SPARK EMITTERS & ARC LIGHTS (< 50% HULL INTEGRITY)
  // ==========================================
  const hullDamageEffectsGroup = new THREE.Group();
  hullDamageEffectsGroup.name = 'HullDamage_SparkAndBreachEffects';
  hullDamageEffectsGroup.visible = false;
  modelWrapper.add(hullDamageEffectsGroup);

  // Key structural breach points across Saucer, Neck, Engineering Hull, and Warp Nacelles
  const breachAnchors = [
    new THREE.Vector3(-2.4, 2.85, -6.8),  // Saucer Dorsal Port Bow
    new THREE.Vector3(3.1, 2.75, -3.4),   // Saucer Dorsal Starboard Aft
    new THREE.Vector3(-1.8, 1.85, -5.2),  // Saucer Ventral Port
    new THREE.Vector3(0.35, 1.15, -1.8),  // Connecting Neck Spine
    new THREE.Vector3(-1.35, -1.05, 0.4), // Secondary Engineering Hull Port
    new THREE.Vector3(1.25, -1.25, 2.8),  // Secondary Engineering Hull Starboard Aft
    new THREE.Vector3(-4.5, 4.65, 5.8),   // Port Warp Nacelle Dorsal Breach
    new THREE.Vector3(4.5, 4.65, 8.1),    // Starboard Warp Nacelle Aft Breach
  ];

  // Shader-driven 3D Spark Eruption Particles at all 8 breach sites
  const sparksPerBreach = 28;
  const totalDamageSparks = breachAnchors.length * sparksPerBreach;
  const sparkOrigins = new Float32Array(totalDamageSparks * 3);
  const sparkVelocities = new Float32Array(totalDamageSparks * 3);
  const sparkSeeds = new Float32Array(totalDamageSparks);

  breachAnchors.forEach((anchor, bIdx) => {
    const outNormal = anchor.clone().normalize();
    if (outNormal.y === 0) outNormal.y = 0.5;
    outNormal.normalize();

    for (let s = 0; s < sparksPerBreach; s++) {
      const idx = bIdx * sparksPerBreach + s;
      sparkOrigins[idx * 3] = anchor.x + (Math.abs(pseudoHash(idx, 1)) - 0.5) * 0.45;
      sparkOrigins[idx * 3 + 1] = anchor.y + (Math.abs(pseudoHash(idx, 2)) - 0.5) * 0.25;
      sparkOrigins[idx * 3 + 2] = anchor.z + (Math.abs(pseudoHash(idx, 3)) - 0.5) * 0.45;

      // Erupt outward with random tangential spray
      const vx = outNormal.x * 1.6 + (Math.abs(pseudoHash(idx, 4)) - 0.5) * 2.2;
      const vy = outNormal.y * 1.8 + (Math.abs(pseudoHash(idx, 5)) - 0.3) * 2.0;
      const vz = outNormal.z * 1.6 + (Math.abs(pseudoHash(idx, 6)) - 0.5) * 2.2;
      sparkVelocities[idx * 3] = vx;
      sparkVelocities[idx * 3 + 1] = vy;
      sparkVelocities[idx * 3 + 2] = vz;
      sparkSeeds[idx] = Math.abs(pseudoHash(idx, 7));
    }
  });

  const damageSparkGeo = new THREE.BufferGeometry();
  damageSparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkOrigins, 3));
  damageSparkGeo.setAttribute('aVelocity', new THREE.BufferAttribute(sparkVelocities, 3));
  damageSparkGeo.setAttribute('aSeed', new THREE.BufferAttribute(sparkSeeds, 1));

  const damageSparkMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: hullDamageUniforms.uDamageTime,
      uDamageLevel: hullDamageUniforms.uDamageLevel,
    },
    vertexShader: `
      attribute vec3 aVelocity;
      attribute float aSeed;
      uniform float uTime;
      uniform float uDamageLevel;
      varying float vLife;
      varying float vSeed;

      void main() {
        vSeed = aSeed;
        // Staccato burst cycle per spark
        float rate = 1.6 + fract(aSeed * 7.3) * 1.8;
        float cycle = fract(uTime * rate + aSeed * 11.0);
        vLife = cycle;

        // Only emit during active electrical burst windows
        float burstGate = step(0.32, fract(sin(floor(uTime * rate + aSeed * 11.0) * 43.17) * 193.3));
        vec3 displaced = position + aVelocity * (cycle * 1.35 * uDamageLevel);
        // Subtle gravity/inertial drag curve
        displaced.y -= cycle * cycle * 0.55;

        vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = burstGate * (1.0 - cycle * 0.75) * (95.0 / max(1.0, -mvPosition.z)) * (0.5 + 0.5 * uDamageLevel);
      }
    `,
    fragmentShader: `
      varying float vLife;
      varying float vSeed;

      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        float d = length(c);
        if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d);
        // Alternate between white-hot welding sparks, golden plasma embers, and electric blue-white arcs
        vec3 col = vSeed > 0.62
          ? mix(vec3(0.35, 0.85, 1.0), vec3(1.0, 1.0, 1.0), core)
          : mix(vec3(1.0, 0.28, 0.02), vec3(1.0, 0.92, 0.55), core);
        float alpha = core * (1.0 - vLife);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const damageSparkPoints = new THREE.Points(damageSparkGeo, damageSparkMat);
  damageSparkPoints.frustumCulled = false;
  hullDamageEffectsGroup.add(damageSparkPoints);

  // Dynamic Flickering Hull Breach Point Lights
  const breachLights: THREE.PointLight[] = [];
  [breachAnchors[0], breachAnchors[1], breachAnchors[4], breachAnchors[6]].forEach((pos, idx) => {
    const light = new THREE.PointLight(idx % 2 === 0 ? 0xff5500 : 0x38bdf8, 0, 7.5);
    light.position.copy(pos).add(new THREE.Vector3(0, 0.35, 0));
    hullDamageEffectsGroup.add(light);
    breachLights.push(light);
  });

  // ==========================================
  // 6. ANIMATION CONTROLLER
  // ==========================================
  let currentHullIntegrity = 100;

  const setHullIntegrity = (integrity: number) => {
    currentHullIntegrity = Math.max(0, Math.min(100, integrity));
    if (currentHullIntegrity < 50) {
      // Ramp damage shader intensity from 0.28 (just below 50%) up to 1.0 (at 0% hull)
      const severity = (50 - currentHullIntegrity) / 50;
      hullDamageUniforms.uDamageLevel.value = 0.28 + severity * 0.72;
      hullDamageEffectsGroup.visible = true;
    } else {
      hullDamageUniforms.uDamageLevel.value = 0.0;
      hullDamageEffectsGroup.visible = false;
    }
  };

  const setAlertMode = (mode: AlertMode) => {
    switch (mode) {
      case 'red':
        alertStrobeMat.emissive.setHex(0xff0000);
        alertStrobeMat.emissiveIntensity = 4.5;
        bussardLights.forEach((l) => l.color.setHex(0xff2200));
        break;
      case 'yellow':
        alertStrobeMat.emissive.setHex(0xffaa00);
        alertStrobeMat.emissiveIntensity = 2.5;
        bussardLights.forEach((l) => l.color.setHex(0xffaa00));
        break;
      case 'normal':
      default:
        alertStrobeMat.emissiveIntensity = 0.0;
        bussardLights.forEach((l) => l.color.setHex(0xff4400));
        break;
    }
  };

  const setWarpActive = (active: boolean) => {
    warpBlueGlowMat.emissiveIntensity = active ? 8.5 : 4.8;
    deflectorDishMat.emissiveIntensity = active ? 4.2 : 2.2;
    bussardShellMat.opacity = active ? 0.92 : 0.72;
  };

  const setHullFinish = (finish: HullFinish) => {
    allMaterials.forEach((mat) => {
      if (finish === 'wireframe') {
        mat.wireframe = true;
      } else {
        mat.wireframe = false;
        if (finish === 'section31') {
          mat.color.setHex(0x181a20);
          mat.metalness = 0.85;
          mat.roughness = 0.2;
        } else if (finish === 'classic') {
          mat.color.setHex(0xced6e0);
          mat.metalness = 0.05;
          mat.roughness = 0.7;
        } else {
          mat.color.setHex(0xa4aebc);
          mat.metalness = 0.22;
          mat.roughness = 0.52;
        }
      }
    });
  };

  const setExploded = (factor: number) => {
    saucerGroup.position.set(
      initialSaucerPos.x,
      initialSaucerPos.y + factor * 3.8,
      initialSaucerPos.z - factor * 3.2
    );
    engGroup.position.set(
      initialEngPos.x,
      initialEngPos.y - factor * 2.8,
      initialEngPos.z + factor * 1.5
    );
    nacelleLeftGroup.position.set(
      initialNacLeftPos.x - factor * 4.2,
      initialNacLeftPos.y + factor * 1.5,
      initialNacLeftPos.z + factor * 3.5
    );
    nacelleRightGroup.position.set(
      initialNacRightPos.x + factor * 4.2,
      initialNacRightPos.y + factor * 1.5,
      initialNacRightPos.z + factor * 3.5
    );
  };

  const update = (deltaSeconds: number, elapsedSeconds: number) => {
    // 1. Spinning Bussard Collector Rotor Blades
    bussardRotors.forEach((rotor) => {
      rotor.rotation.z += deltaSeconds * 2.8;
    });

    // 2. Synchronized Starfleet White Strobe Beacon
    const strobeCycle = (elapsedSeconds * 1.5) % 1.0;
    strobeWhiteMat.emissiveIntensity = strobeCycle < 0.12 ? 8.0 : 0.0;

    // 3. Nav Lights Gentle Pulse
    const navPulse = 2.0 + Math.sin(elapsedSeconds * 3.0) * 0.5;
    portNavMat.emissiveIntensity = navPulse;
    stbdNavMat.emissiveIntensity = navPulse;

    // 4. Advance Procedural Hull Damage Shader Time & Flickering Breach Arcs (< 50% Hull Integrity)
    hullDamageUniforms.uDamageTime.value = elapsedSeconds;
    if (hullDamageEffectsGroup.visible) {
      const dmgLvl = hullDamageUniforms.uDamageLevel.value;
      breachLights.forEach((light, idx) => {
        const flicker = Math.sin(elapsedSeconds * (28 + idx * 7)) * Math.cos(elapsedSeconds * (19 + idx * 5));
        light.intensity = flicker > 0.15 ? (1.4 + flicker * 2.8) * dmgLvl : 0.25 * dmgLvl;
      });
    }
  };

  const getSubsystemPosition = (name: string): THREE.Vector3 => {
    const key = name.toLowerCase();
    if (subsystemNodes.has(key)) {
      return root.localToWorld(subsystemNodes.get(key)!.clone());
    }
    return root.position.clone();
  };

  const getTorpedoOrigin = (): THREE.Vector3 => {
    return root.localToWorld(torpedoOrigin.clone());
  };

  const getPhaserOrigins = (): [THREE.Vector3, THREE.Vector3] => {
    return [
      root.localToWorld(phaserOriginLeft.clone()),
      root.localToWorld(phaserOriginRight.clone()),
    ];
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
    damageSparkGeo.dispose();
    damageSparkMat.dispose();
    allMaterials.forEach((mat) => mat.dispose());
  };

  const controller: EnterpriseController = {
    group: root,
    saucerGroup,
    neckGroup,
    engGroup,
    pylonsGroup,
    nacelleLeftGroup,
    nacelleRightGroup,
    getTorpedoOrigin,
    getPhaserOrigins,
    getSubsystemPosition,
    setAlertMode,
    setWarpActive,
    setHullFinish,
    setExploded,
    setHullIntegrity,
    update,
    dispose,
  };

  return {
    root,
    saucer: saucerGroup,
    secondaryHull: engGroup,
    deflectorDish: backingDish,
    deflectorGlow: deflectorPointLight,
    bussardLeft: bussardMeshLeft || backingDish,
    bussardRight: bussardMeshRight || backingDish,
    bussardGlowLeft: bussardLights[0] || deflectorPointLight,
    bussardGlowRight: bussardLights[1] || deflectorPointLight,
    warpCoilsLeft: warpCoilMeshLeft || backingDish,
    warpCoilsRight: warpCoilMeshRight || backingDish,
    impulseEngine: impulseLeftMesh || backingDish,
    impulseGlow: impulseMainGlowLight,
    shieldBubble,
    phaserOriginLeft,
    phaserOriginRight,
    torpedoOrigin,
    subsystemNodes,
    controller,
  };
}

export function createKelvinEnterprise(): EnterpriseController {
  const comp = buildEnterpriseModel();
  return comp.controller;
}
