import * as THREE from 'three';
import { SolarSystem, PlanetData } from '../types/simulation';

// Texture caches to prevent redundant procedural canvas creation and eliminate lag
const textureCache = new Map<string, THREE.CanvasTexture>();
const bumpTextureCache = new Map<string, THREE.CanvasTexture>();
const starTextureCache = new Map<string, THREE.CanvasTexture>();
const ringTextureCache = new Map<string, THREE.CanvasTexture>();

// Deterministic pseudo-random helper for multi-octave geological and atmospheric detail
function fractHash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// Map of Sol System bodies to downloaded real-life 2K NASA / Solar System Scope equirectangular textures
const SOL_REAL_TEXTURE_PATHS: Record<string, string> = {
  sol_mercury: './assets/planets/mercury.jpg',
  sol_venus: './assets/planets/venus.jpg',
  sol_earth: './assets/planets/earth.jpg',
  sol_moon: './assets/planets/moon.jpg',
  sol_mars: './assets/planets/mars.jpg',
  sol_jupiter: './assets/planets/jupiter.jpg',
  sol_saturn: './assets/planets/saturn.jpg',
  sol_uranus: './assets/planets/uranus.jpg',
  sol_neptune: './assets/planets/neptune.jpg',
};

const loadedImageCache = new Map<string, HTMLImageElement>();

function loadCachedImage(url: string, onLoad: (img: HTMLImageElement) => void): void {
  if (loadedImageCache.has(url)) {
    const cached = loadedImageCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) {
      onLoad(cached);
      return;
    }
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    loadedImageCache.set(url, img);
    onLoad(img);
  };
  img.src = url;
}

// High-Definition Stellar Photosphere Texture Generator (Uses real 2K Solar Photosphere map + Granulation & Active Regions)
export function createStarPhotosphereTexture(
  spectralType: string,
  starColorHex: number
): THREE.CanvasTexture {
  const cacheKey = `${spectralType}_${starColorHex.toString(16)}_v3`;
  if (starTextureCache.has(cacheKey)) {
    return starTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  const baseCol = new THREE.Color(starColorHex);
  const hotCol = baseCol.clone().lerp(new THREE.Color(0xffffff), 0.65);
  const midCol = baseCol.clone();
  const coolCol = baseCol.clone().multiplyScalar(0.58);
  const spotUmbraCol = baseCol.clone().multiplyScalar(0.18);

  // 1. Base Photosphere Gradient with Equatorial Brilliance
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, `#${coolCol.getHexString()}`);
  bgGrad.addColorStop(0.2, `#${midCol.getHexString()}`);
  bgGrad.addColorStop(0.5, `#${hotCol.getHexString()}`);
  bgGrad.addColorStop(0.8, `#${midCol.getHexString()}`);
  bgGrad.addColorStop(1, `#${coolCol.getHexString()}`);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Dense Solar Granulation Cells
  for (let i = 0; i < 1400; i++) {
    const gx = fractHash(i * 1.13) * w;
    const gy = fractHash(i * 2.47) * h;
    const gr = 6 + fractHash(i * 3.89) * 20;
    const isBright = i % 3 !== 0;

    const cellGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    if (isBright) {
      cellGrad.addColorStop(0, `rgba(255, 255, 255, 0.42)`);
      cellGrad.addColorStop(
        0.6,
        `rgba(${Math.round(hotCol.r * 255)}, ${Math.round(hotCol.g * 255)}, ${Math.round(hotCol.b * 255)}, 0.24)`
      );
      cellGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      cellGrad.addColorStop(
        0,
        `rgba(${Math.round(coolCol.r * 255)}, ${Math.round(coolCol.g * 255)}, ${Math.round(coolCol.b * 255)}, 0.45)`
      );
      cellGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }
    ctx.fillStyle = cellGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Magnetic Active Regions
  for (let s = 0; s < 22; s++) {
    const sx = (160 + s * 86 + fractHash(s * 9.1) * 80) % w;
    const sy = 220 + fractHash(s * 5.3) * (h - 440);
    const spotRadius = 10 + fractHash(s * 7.7) * 24;

    ctx.fillStyle = `#${coolCol.getHexString()}`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, spotRadius * 1.35, spotRadius * 0.95, fractHash(s * 2) * Math.PI, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `#${spotUmbraCol.getHexString()}`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, spotRadius * 0.65, spotRadius * 0.48, fractHash(s * 2) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;

  // Overlay real 2K Solar Photosphere image (./assets/planets/sun.jpg) tinted to the star's spectral class
  loadCachedImage('./assets/planets/sun.jpg', (img) => {
    ctx.save();
    ctx.drawImage(img, 0, 0, w, h);
    if (starColorHex !== 0xfef08a && starColorHex !== 0xfde047) {
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = `#${baseCol.getHexString()}`;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
    tex.needsUpdate = true;
  });

  starTextureCache.set(cacheKey, tex);
  return tex;
}

// High-Definition Concentric Planetary Ring Texture Generator
// Matches the user's attached Saturn reference image (`images.jpg`) with slate-blue, silver-ice, and warm-cream concentric bands!
export function createPlanetaryRingTexture(
  ringColorHex: string,
  planetId?: string
): THREE.CanvasTexture {
  const cacheKey = `${planetId || 'ring'}_${ringColorHex}_v3`;
  if (ringTextureCache.has(cacheKey)) {
    return ringTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const cx = 512;
  const cy = 512;

  const isSaturn = planetId === 'sol_saturn';
  const baseCol = new THREE.Color(ringColorHex || '#fde68a');
  const lightCol = baseCol.clone().lerp(new THREE.Color(0xffffff), 0.45);
  const darkCol = baseCol.clone().multiplyScalar(0.55);

  // Palette matching attached Saturn reference image (`images.jpg`):
  // Cool slate-blue inner/outer rings + silver-white & warm cream central rings
  const saturnSlateDark = new THREE.Color('#2b3d54');
  const saturnSlateBlue = new THREE.Color('#5c7694');
  const saturnSilverIce = new THREE.Color('#cbd5e1');
  const saturnWarmCream = new THREE.Color('#e2cdb0');

  // Draw high-resolution concentric ringlets from inner radius (185px) to outer radius (500px)
  for (let r = 185; r <= 500; r += 0.75) {
    const t = (r - 185) / (500 - 185); // 0.0 (inner C-ring) -> 1.0 (outer A/F-ring)

    // Prominent Cassini Division (t ≈ 0.65..0.70) & Encke Gap (t ≈ 0.89..0.91)
    if (isSaturn && ((t > 0.65 && t < 0.695) || (t > 0.89 && t < 0.908))) {
      continue;
    }
    if (!isSaturn && t > 0.66 && t < 0.69) {
      continue;
    }

    const fineRipple =
      0.62 +
      0.22 * Math.sin(t * 140.0) +
      0.14 * Math.cos(t * 340.0) +
      0.12 * Math.sin(t * 55.0);
    const edgeFade = Math.sin(t * Math.PI);

    let c: THREE.Color;
    let alpha: number;

    if (isSaturn) {
      // Match attached `images.jpg` ring structure:
      // Inner C-ring (0..0.22): translucent dark slate-blue
      // Inner-mid B-ring (0.22..0.46): bright silver-ice & warm cream bands
      // Outer-mid B-ring (0.46..0.65): high-density slate-blue & silver striations
      // Outer A-ring (0.70..1.0): cool slate-blue transitioning to deep navy-slate edge
      if (t < 0.22) {
        c = saturnSlateDark.clone().lerp(saturnSlateBlue, t / 0.22);
        alpha = (0.35 + 0.45 * (t / 0.22)) * fineRipple;
      } else if (t < 0.48) {
        const sub = (t - 0.22) / 0.26;
        c = saturnWarmCream.clone().lerp(saturnSilverIce, 0.5 + 0.5 * Math.sin(sub * 32.0));
        alpha = (0.85 + 0.14 * Math.sin(sub * 45.0)) * fineRipple;
      } else if (t < 0.65) {
        const sub = (t - 0.48) / 0.17;
        c = saturnSilverIce.clone().lerp(saturnSlateBlue, 0.4 + 0.4 * Math.cos(sub * 28.0));
        alpha = 0.92 * fineRipple;
      } else {
        const sub = (t - 0.70) / 0.30;
        c = saturnSlateBlue.clone().lerp(saturnSlateDark, Math.min(1, sub * 0.85));
        alpha = (0.88 - sub * 0.25) * fineRipple * Math.min(1, (1 - t) * 8);
      }
      alpha = Math.max(0.06, Math.min(0.96, alpha));
    } else {
      alpha = Math.max(
        0.08,
        Math.min(0.92, fineRipple * edgeFade * (t < 0.22 ? 0.45 : 0.95))
      );
      c =
        t < 0.64
          ? baseCol.clone().lerp(lightCol, 0.5 + 0.5 * Math.sin(t * 60))
          : baseCol.clone().lerp(darkCol, 0.35);
    }

    ctx.strokeStyle = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(
      c.b * 255
    )}, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  ringTextureCache.set(cacheKey, tex);
  return tex;
}

// Topographic Bump Map Generator (Automatically upgrades with real 2K planetary relief for Sol System worlds!)
export function createPlanetBumpTexture(
  type: PlanetData['type'],
  planetId?: string
): THREE.CanvasTexture {
  const cacheKey = `bump_${planetId || type}_v4`;
  if (bumpTextureCache.has(cacheKey)) {
    return bumpTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, w, h);

  if (type === 'gas_giant') {
    for (let b = 0; b < 64; b++) {
      const y = (b / 64) * h;
      ctx.fillStyle = b % 2 === 0 ? '#929292' : '#707070';
      ctx.fillRect(0, y, w, h / 64);
    }
  } else {
    const seed = (planetId || type).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const isLunar = type === 'moon' || planetId === 'sol_moon' || planetId === 'sol_mercury';

    if (isLunar) {
      // Depressed basaltic maria basins in bump heightmap
      for (let m = 0; m < 14; m++) {
        const mx = fractHash(m * 3.1 + seed) * w;
        const my = (0.18 + fractHash(m * 5.7 + seed) * 0.64) * h;
        const mr = 45 + fractHash(m * 2.3 + seed) * 85;
        const mg = ctx.createRadialGradient(mx, my, mr * 0.1, mx, my, mr);
        mg.addColorStop(0, '#4a4a4a');
        mg.addColorStop(0.75, '#5c5c5c');
        mg.addColorStop(1, 'rgba(128,128,128,0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.ellipse(mx, my, mr * 1.25, mr * 0.9, fractHash(m) * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const craterCount = isLunar ? 520 : 320;
    for (let i = 0; i < craterCount; i++) {
      const rx = fractHash(i * 1.7 + seed) * w;
      const ry = fractHash(i * 2.9 + seed) * h;
      const rr = isLunar
        ? 2 + Math.pow(fractHash(i * 4.3 + seed), 2.4) * 38
        : 4 + fractHash(i * 4.3 + seed) * 32;

      if (isLunar || planetId === 'sol_mars') {
        // Raised crater rim crest
        ctx.strokeStyle = '#ececec';
        ctx.lineWidth = Math.max(1.2, rr * 0.14);
        ctx.beginPath();
        ctx.arc(rx, ry, rr, 0, Math.PI * 2);
        ctx.stroke();

        // Depressed crater bowl interior
        ctx.fillStyle = '#2e2e2e';
        ctx.beginPath();
        ctx.arc(rx, ry, rr * 0.82, 0, Math.PI * 2);
        ctx.fill();

        // Central rebound peak for larger complex craters
        if (rr > 14) {
          ctx.fillStyle = '#e2e2e2';
          ctx.beginPath();
          ctx.arc(rx, ry, rr * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const g = ctx.createRadialGradient(rx, ry, 0, rx, ry, rr);
        g.addColorStop(0, i % 2 === 0 ? '#cccccc' : '#505050');
        g.addColorStop(1, 'rgba(128,128,128,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(rx, ry, rr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  // If this Sol planet has a real 2K surface map, derive high-resolution topographic bump relief from it!
  if (planetId && SOL_REAL_TEXTURE_PATHS[planetId]) {
    loadCachedImage(SOL_REAL_TEXTURE_PATHS[planetId], (img) => {
      ctx.save();
      ctx.filter =
        planetId === 'sol_moon'
          ? 'grayscale(100%) contrast(175%) brightness(98%)'
          : 'grayscale(100%) contrast(145%)';
      ctx.drawImage(img, 0, 0, w, h);
      ctx.restore();
      tex.needsUpdate = true;
    });
  }

  bumpTextureCache.set(cacheKey, tex);
  return tex;
}

// Helper: Paints a photorealistic Lunar surface (matching user reference image `384add13b19d413d823b2b293bba3f1e_a45f0865.jpg`)
// Features bright silver-ash anorthositic highlands, dark slate-charcoal basaltic maria basins,
// multi-scale 3D-rimmed impact craters with central peaks, and bright radial ejecta ray systems.
function paintPhotorealisticLunarSurface(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number = 101,
  isOverlayOnly: boolean = false
) {
  ctx.save();

  if (!isOverlayOnly) {
    // 1. Base Anorthositic Lunar Highland Regolith (Natural silver-ash to chalky grey gradient)
    const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
    baseGrad.addColorStop(0.0, '#c4c8ce');
    baseGrad.addColorStop(0.22, '#b2b6bd');
    baseGrad.addColorStop(0.5, '#9ea3ab');
    baseGrad.addColorStop(0.78, '#adb2b9');
    baseGrad.addColorStop(1.0, '#bfc3ca');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Mottled Highland Regolith Albedo Variations
    for (let i = 0; i < 220; i++) {
      const hx = fractHash(i * 1.91 + seed) * w;
      const hy = fractHash(i * 3.17 + seed) * h;
      const hr = (18 + fractHash(i * 2.73 + seed) * 65) * (w / 1024);
      const isLight = i % 2 === 0;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
      g.addColorStop(0, isLight ? 'rgba(235, 238, 242, 0.26)' : 'rgba(105, 110, 118, 0.24)');
      g.addColorStop(1, 'rgba(160, 165, 172, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Dark Basaltic Lunar Maria Basins (Matching Mare Imbrium, Serenitatis, Tranquillitatis, Crisium, Procellarum)
    const mariaBasins = [
      { x: 0.36, y: 0.34, rx: 0.13, ry: 0.16, rot: -0.2, dark: '#3d4046' }, // Mare Imbrium
      { x: 0.24, y: 0.48, rx: 0.16, ry: 0.22, rot: 0.15, dark: '#43464c' }, // Oceanus Procellarum
      { x: 0.51, y: 0.36, rx: 0.085, ry: 0.11, rot: 0.1, dark: '#383b40' }, // Mare Serenitatis
      { x: 0.57, y: 0.49, rx: 0.095, ry: 0.12, rot: -0.25, dark: '#3a3d43' }, // Mare Tranquillitatis
      { x: 0.68, y: 0.39, rx: 0.055, ry: 0.075, rot: 0.05, dark: '#34373c' }, // Mare Crisium
      { x: 0.63, y: 0.59, rx: 0.065, ry: 0.095, rot: 0.3, dark: '#40444a' }, // Mare Foecunditatis
      { x: 0.41, y: 0.63, rx: 0.09, ry: 0.10, rot: -0.1, dark: '#45484f' }, // Mare Nubium
      { x: 0.32, y: 0.61, rx: 0.065, ry: 0.08, rot: 0.2, dark: '#3e4147' }, // Mare Humorum
      { x: 0.44, y: 0.20, rx: 0.11, ry: 0.045, rot: 0.0, dark: '#464a51' }, // Mare Frigoris
    ];

    for (let b = 0; b < mariaBasins.length; b++) {
      const m = mariaBasins[b];
      const cx = ((m.x + (seed === 101 ? 0 : fractHash(b + seed) * 0.35)) % 1.0) * w;
      const cy = m.y * h;
      const rx = m.rx * w;
      const ry = m.ry * h;

      for (let lobe = 0; lobe < 7; lobe++) {
        const ang = (lobe / 7) * Math.PI * 2 + m.rot;
        const dist = lobe === 0 ? 0 : 0.38 + fractHash(b * 7 + lobe + seed) * 0.28;
        const lx = cx + Math.cos(ang) * rx * dist;
        const ly = cy + Math.sin(ang) * ry * dist;
        const lrx = rx * (lobe === 0 ? 0.95 : 0.62);
        const lry = ry * (lobe === 0 ? 0.95 : 0.62);

        const mGrad = ctx.createRadialGradient(lx, ly, lrx * 0.1, lx, ly, Math.max(lrx, lry));
        mGrad.addColorStop(0, m.dark);
        mGrad.addColorStop(0.68, '#484c52');
        mGrad.addColorStop(1, 'rgba(72, 76, 82, 0)');
        ctx.fillStyle = mGrad;
        ctx.beginPath();
        ctx.ellipse(lx, ly, lrx, lry, m.rot + lobe * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 4. Prominent Bright Radial Ejecta Ray Systems (Matching Tycho, Copernicus, Kepler & Highland Ray Craters)
  const rayCenters = [
    { x: 0.26, y: 0.27, rays: 26, len: 0.22, alpha: isOverlayOnly ? 0.22 : 0.38 }, // Upper-left highland ray system (as in reference image)
    { x: 0.43, y: 0.77, rays: 32, len: 0.28, alpha: isOverlayOnly ? 0.20 : 0.36 }, // Southern Tycho ray system
    { x: 0.35, y: 0.44, rays: 22, len: 0.16, alpha: isOverlayOnly ? 0.18 : 0.32 }, // Copernicus ray system
    { x: 0.27, y: 0.47, rays: 18, len: 0.13, alpha: isOverlayOnly ? 0.16 : 0.28 }, // Kepler ray system
  ];

  for (let rc = 0; rc < rayCenters.length; rc++) {
    const c = rayCenters[rc];
    const rx = c.x * w;
    const ry = c.y * h;
    const maxLen = c.len * w;

    for (let r = 0; r < c.rays; r++) {
      const ang = (r / c.rays) * Math.PI * 2 + fractHash(rc * 19 + r) * 0.22;
      const rayLen = maxLen * (0.45 + fractHash(rc * 31 + r * 3.7) * 0.65);
      const ex = rx + Math.cos(ang) * rayLen;
      const ey = ry + Math.sin(ang) * rayLen * 0.85;

      const rGrad = ctx.createLinearGradient(rx, ry, ex, ey);
      rGrad.addColorStop(0, `rgba(248, 250, 252, ${c.alpha})`);
      rGrad.addColorStop(0.35, `rgba(226, 232, 240, ${(c.alpha * 0.55).toFixed(3)})`);
      rGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');

      ctx.strokeStyle = rGrad;
      ctx.lineWidth = (1.2 + fractHash(r * 5.1) * 2.2) * (w / 1024);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  // 5. Multi-Scale Crisp Rimmed Impact Craters (Dark shadowed floor + bright sunlit rim + central peak)
  const scale = w / 1024;
  const craterTotal = isOverlayOnly ? 260 : 540;
  for (let i = 0; i < craterTotal; i++) {
    const cx = fractHash(i * 2.17 + seed) * w;
    const cy = (0.04 + fractHash(i * 3.83 + seed) * 0.92) * h;
    const sizeDistribution = Math.pow(fractHash(i * 5.19 + seed), 2.8);
    const r = (1.6 + sizeDistribution * 24) * scale;

    const rimAlpha = isOverlayOnly ? 0.36 : 0.68;
    const shadowAlpha = isOverlayOnly ? 0.32 : 0.62;

    // Shadowed interior crater bowl
    const bowlGrad = ctx.createRadialGradient(
      cx - r * 0.18,
      cy - r * 0.18,
      r * 0.05,
      cx,
      cy,
      r
    );
    bowlGrad.addColorStop(0, `rgba(38, 41, 46, ${shadowAlpha})`);
    bowlGrad.addColorStop(0.72, `rgba(62, 66, 73, ${(shadowAlpha * 0.8).toFixed(2)})`);
    bowlGrad.addColorStop(1, 'rgba(140, 145, 152, 0)');
    ctx.fillStyle = bowlGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Crisp bright raised circular crater rim
    ctx.strokeStyle = `rgba(236, 240, 245, ${rimAlpha})`;
    ctx.lineWidth = Math.max(0.8 * scale, r * 0.13);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
    ctx.stroke();

    // Inner northwest shadow crescent for 3D depth
    ctx.strokeStyle = `rgba(20, 22, 26, ${(shadowAlpha * 0.85).toFixed(2)})`;
    ctx.lineWidth = Math.max(0.7 * scale, r * 0.11);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.80, Math.PI * 0.85, Math.PI * 1.75);
    ctx.stroke();

    // Central rebound peak on larger complex craters
    if (r > 9 * scale) {
      ctx.fillStyle = `rgba(232, 236, 242, ${(rimAlpha * 0.9).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1.2 * scale, r * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Applies the exact visual grading of the user's attached reference images onto the real 2K planetary maps:
 * - `sol_moon` (`384add13b19d413d823b2b293bba3f1e_a45f0865.jpg`): Photorealistic true-color Lunar Reconnaissance Orbiter mosaic with high-contrast dark basaltic maria (Mare Imbrium, Serenitatis, Tranquillitatis, Crisium, Procellarum), bright silver-ash cratered highlands, and crisp white radial ejecta rays!
 * - `sol_saturn` (`images.jpg`): Real 2K Saturn bands graded with cool slate-blue/cyan polar hemisphere transitioning into warm golden-amber and ochre equatorial cloud bands!
 * - `sol_earth` (`d5b91bd899844e49b99db646c2246203.jpeg`): Real 2K Earth Blue Marble enhanced with deep royal-navy oceans, turquoise coastal shelves, lush emerald lowlands, golden-tan desert plateaus, snow-white polar caps, and delicate swirling white clouds!
 */
function compositeRealSolPlanetTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  planetId: string,
  baseImg: HTMLImageElement,
  tex: THREE.CanvasTexture
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  if (planetId === 'sol_moon') {
    // === USER REFERENCE IMAGE (`384add13b19d413d823b2b293bba3f1e_a45f0865.jpg`): PHOTOREALISTIC LUNAR SURFACE ===
    // 1. Draw the real 2K NASA Lunar Reconnaissance Orbiter global map with crisp natural ash-grey contrast
    ctx.filter = 'grayscale(100%) contrast(138%) brightness(104%)';
    ctx.drawImage(baseImg, 0, 0, w, h);
    ctx.filter = 'none';

    // 2. Overlay fine micro-crater rim sharpness and bright radial highland ejecta rays (GPU-accelerated 2D canvas ops)
    paintPhotorealisticLunarSurface(ctx, w, h, 101, true);

  } else if (planetId === 'sol_saturn') {
    // === USER REFERENCE IMAGE 2 (`images.jpg`): COOL SLATE-BLUE / CERULEAN POLAR HEMISPHERE & WARM GOLDEN-AMBER EQUATORIAL BANDS ===
    // 1. Draw the real 2K Saturn banded cloud map
    ctx.filter = 'contrast(135%) saturate(125%)';
    ctx.drawImage(baseImg, 0, 0, w, h);
    ctx.filter = 'none';

    // 2. Blend the reference image's distinct atmospheric color gradient:
    //    North/Upper polar hemisphere: cool cerulean/slate-blue (#3b6e8c -> #5b8fa8)
    //    Mid-latitude storm belt: rich warm burnt-amber & terracotta (#c87d4b -> #e09f67)
    //    Equatorial zone: creamy golden-ochre (#f3cba0 -> #ebd2b0)
    //    South/Lower polar hemisphere: deep slate-blue shadow (#1e3a52 -> #2b4c66)
    ctx.globalCompositeOperation = 'overlay';
    const satGrad = ctx.createLinearGradient(0, 0, 0, h);
    satGrad.addColorStop(0.0, '#2c5d7c');
    satGrad.addColorStop(0.24, '#4e84a3');
    satGrad.addColorStop(0.38, '#b87344');
    satGrad.addColorStop(0.52, '#e6b88a');
    satGrad.addColorStop(0.66, '#d49b6a');
    satGrad.addColorStop(0.80, '#3b698a');
    satGrad.addColorStop(1.0, '#172e42');
    ctx.fillStyle = satGrad;
    ctx.fillRect(0, 0, w, h);

    // 3. Soft-light pass to reinforce the crisp cerulean polar hood & warm amber band contrast
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = satGrad;
    ctx.fillRect(0, 0, w, h);

    // 4. Subtle mottled atmospheric storm cells & band texture matching `images.jpg`
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 420; i++) {
      const sx = fractHash(i * 2.13) * w;
      const sy = (0.28 + fractHash(i * 4.71) * 0.42) * h;
      const srX = 8 + fractHash(i * 1.9) * 28;
      const srY = 2 + fractHash(i * 3.3) * 6;
      ctx.fillStyle =
        i % 2 === 0 ? 'rgba(255, 237, 213, 0.14)' : 'rgba(124, 45, 18, 0.12)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, srX, srY, 0, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (planetId === 'sol_earth') {
    // === USER REFERENCE IMAGE 3 (`d5b91bd899844e49b99db646c2246203.jpeg`): HYPER-REALISTIC BLUE MARBLE EARTH ===
    // 1. Draw the real 2K NASA Blue Marble Earth Daymap with enhanced vibrancy & relief contrast
    ctx.filter = 'contrast(118%) saturate(132%) brightness(104%)';
    ctx.drawImage(baseImg, 0, 0, w, h);
    ctx.filter = 'none';

    // 2. Also composite the real 2K Earth Clouds map (`./assets/planets/earth_clouds.jpg`) using 'screen' blending
    loadCachedImage('./assets/planets/earth_clouds.jpg', (cloudImg) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.42;
      ctx.drawImage(cloudImg, 0, 0, w, h);
      ctx.restore();
      tex.needsUpdate = true;
    });

  } else if (planetId === 'sol_venus') {
    // === REAL 2K VENUS ATMOSPHERE + SUBTLE SURFACE RADAR RELIEF ===
    ctx.filter = 'contrast(118%) saturate(115%)';
    ctx.drawImage(baseImg, 0, 0, w, h);
    ctx.filter = 'none';

    loadCachedImage('./assets/planets/venus_surface.jpg', (surfImg) => {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.25;
      ctx.drawImage(surfImg, 0, 0, w, h);
      ctx.restore();
      tex.needsUpdate = true;
    });

  } else {
    // === MERCURY, MARS, JUPITER, URANUS, NEPTUNE: REAL 2K NASA GLOBAL MOSAICS ===
    ctx.filter =
      planetId === 'sol_jupiter' || planetId === 'sol_mars'
        ? 'contrast(116%) saturate(118%)'
        : planetId === 'sol_neptune' || planetId === 'sol_uranus'
        ? 'contrast(120%) saturate(125%)'
        : 'contrast(122%)';
    ctx.drawImage(baseImg, 0, 0, w, h);
    ctx.filter = 'none';
  }

  ctx.restore();
  tex.needsUpdate = true;
}

// High-Fidelity Planetary Texture Builder (Loads real 2K maps for Sol System + procedural fallback)
export function createPlanetTexture(
  type: PlanetData['type'],
  baseColor: string,
  planetId?: string
): THREE.CanvasTexture {
  const cacheKey = `${planetId || type}_${baseColor}_v4`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  // Use 2048x1024 (2K) for Sol System planets to preserve full 2K photographic sharpness
  const isSolBody = Boolean(planetId && planetId.startsWith('sol_'));
  canvas.width = isSolBody ? 2048 : 1024;
  canvas.height = isSolBody ? 1024 : 512;
  const ctx = canvas.getContext('2d')!;
  const w = canvas.width;
  const h = canvas.height;
  const sx = w / 1024;
  const sy = h / 512;

  ctx.save();
  ctx.scale(sx, sy);

  // Helper to paint multi-lobed fractal-like continental landmasses with coastal shelves & mountain spines
  const paintDetailedContinent = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    shelfColor: string,
    lowlandColor: string,
    highlandColor: string,
    peakColor: string,
    seedOffset: number
  ) => {
    ctx.fillStyle = shelfColor;
    for (let l = 0; l < 14; l++) {
      const ang = (l / 14) * Math.PI * 2;
      const dist = 0.55 + fractHash(seedOffset + l * 1.3) * 0.45;
      const lx = cx + Math.cos(ang) * rx * dist;
      const ly = cy + Math.sin(ang) * ry * dist;
      ctx.beginPath();
      ctx.ellipse(lx, ly, rx * 0.52, ry * 0.48, ang * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = lowlandColor;
    for (let l = 0; l < 18; l++) {
      const ang = (l / 18) * Math.PI * 2;
      const dist = 0.45 + fractHash(seedOffset + l * 2.1) * 0.42;
      const lx = cx + Math.cos(ang) * rx * dist;
      const ly = cy + Math.sin(ang) * ry * dist;
      ctx.beginPath();
      ctx.ellipse(lx, ly, rx * 0.42, ry * 0.38, ang * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = highlandColor;
    for (let l = 0; l < 10; l++) {
      const ang = (l / 10) * Math.PI * 2;
      const dist = fractHash(seedOffset + l * 3.7) * 0.45;
      const lx = cx + Math.cos(ang) * rx * dist;
      const ly = cy + Math.sin(ang) * ry * dist;
      ctx.beginPath();
      ctx.ellipse(lx, ly, rx * 0.28, ry * 0.24, ang, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = peakColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.45, cy - ry * 0.2);
    ctx.quadraticCurveTo(cx, cy + ry * 0.15, cx + rx * 0.45, cy - ry * 0.1);
    ctx.stroke();
  };

  // Immediate procedural base while async 2K image loads (or for non-Sol systems)
  if (planetId === 'sol_earth') {
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#040d21');
    oceanGrad.addColorStop(0.22, '#081d45');
    oceanGrad.addColorStop(0.5, '#0b2b5e');
    oceanGrad.addColorStop(0.78, '#081d45');
    oceanGrad.addColorStop(1, '#040d21');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    paintDetailedContinent(215, 165, 92, 68, '#0284c7', '#2e5a27', '#c29b61', '#f8fafc', 11);
    paintDetailedContinent(315, 335, 68, 95, '#0284c7', '#254d1f', '#365e2d', '#f1f5f9', 37);
    paintDetailedContinent(540, 275, 86, 98, '#0284c7', '#365e2d', '#d4a373', '#fde68a', 67);
    paintDetailedContinent(715, 168, 155, 78, '#0284c7', '#2e5a27', '#ddb892', '#ffffff', 83);
    paintDetailedContinent(845, 365, 62, 46, '#06b6d4', '#b07d4f', '#9c6644', '#fde68a', 113);
  } else if (planetId === 'sol_moon') {
    // Immediate photorealistic Lunar surface matching user's Moon reference image
    paintPhotorealisticLunarSurface(ctx, 1024, 512, 101, false);
  } else if (planetId === 'sol_saturn') {
    // Immediate slate-cyan to golden-amber Saturn fallback matching `images.jpg`
    const satGrad = ctx.createLinearGradient(0, 0, 0, 512);
    satGrad.addColorStop(0.0, '#2c5d7c');
    satGrad.addColorStop(0.26, '#5689a8');
    satGrad.addColorStop(0.42, '#c8804d');
    satGrad.addColorStop(0.55, '#ecc395');
    satGrad.addColorStop(0.72, '#c48b5c');
    satGrad.addColorStop(1.0, '#1b364d');
    ctx.fillStyle = satGrad;
    ctx.fillRect(0, 0, 1024, 512);
  } else if (planetId === 'sol_europa') {
    // === EUROPA (REALISTIC VOYAGER/GALILEO ICY CRUST WITH REDDISH-BROWN SULFURIC LINEAE FRACTURES) ===
    const eurGrad = ctx.createLinearGradient(0, 0, 0, 512);
    eurGrad.addColorStop(0, '#cbd5e1');
    eurGrad.addColorStop(0.3, '#f1f5f9');
    eurGrad.addColorStop(0.65, '#e2e8f0');
    eurGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = eurGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Reddish-brown hydrated salt / sulfuric acid chaos terrain patches (Conamara Chaos)
    for (let c = 0; c < 28; c++) {
      const cx = fractHash(c * 3.1) * 1024;
      const cy = 60 + fractHash(c * 5.7) * 390;
      const cr = 25 + fractHash(c * 2.3) * 65;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, cr);
      g.addColorStop(0, 'rgba(154, 52, 18, 0.52)');
      g.addColorStop(0.6, 'rgba(180, 83, 9, 0.25)');
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cr * 1.3, cr * 0.8, fractHash(c) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Criss-crossing global tectonic ice lineae bands
    for (let l = 0; l < 65; l++) {
      ctx.strokeStyle = l % 3 === 0 ? 'rgba(124, 45, 18, 0.55)' : 'rgba(180, 83, 9, 0.38)';
      ctx.lineWidth = l % 5 === 0 ? 2.6 : 1.2;
      ctx.beginPath();
      const x0 = fractHash(l * 1.9) * 1024;
      const y0 = fractHash(l * 4.3) * 512;
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(
        (x0 + 180) % 1024,
        (y0 + 90) % 512,
        (x0 + 360) % 1024,
        (y0 - 70 + 512) % 512,
        (x0 + 540) % 1024,
        (y0 + 110) % 512
      );
      ctx.stroke();
    }
  } else if (planetId === 'sol_titan') {
    // === TITAN (CASSINI PHOTOCHEMICAL GOLDEN-ORANGE HAZE, DARK DUNE BELTS & KRAKEN MARE LAKES) ===
    const titGrad = ctx.createLinearGradient(0, 0, 0, 512);
    titGrad.addColorStop(0, '#78350f');
    titGrad.addColorStop(0.22, '#b45309');
    titGrad.addColorStop(0.5, '#f59e0b');
    titGrad.addColorStop(0.78, '#d97706');
    titGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = titGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Dark equatorial hydrocarbon dune seas (Shangri-La, Fensal, Aztlan) & Xanadu bright continent
    ctx.fillStyle = 'rgba(69, 26, 3, 0.42)';
    for (let d = 0; d < 16; d++) {
      ctx.beginPath();
      ctx.ellipse(80 + d * 62, 260 + Math.sin(d) * 28, 70, 32, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    // North polar liquid methane seas (Kraken Mare & Ligeia Mare)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.ellipse(420, 68, 95, 28, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Detached north polar blue-teal stratospheric hood
    const hoodGrad = ctx.createLinearGradient(0, 0, 0, 75);
    hoodGrad.addColorStop(0, 'rgba(56, 189, 248, 0.38)');
    hoodGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = hoodGrad;
    ctx.fillRect(0, 0, 1024, 75);
  } else if (planetId === 'sol_pluto') {
    // === PLUTO (NEW HORIZONS TRUE-COLOR: TOMBAUGH REGIO NITROGEN HEART & CTHULHU MACULA THOLINS) ===
    const plutoGrad = ctx.createLinearGradient(0, 0, 0, 512);
    plutoGrad.addColorStop(0, '#a88b73');
    plutoGrad.addColorStop(0.35, '#cbb299');
    plutoGrad.addColorStop(0.65, '#8c583a');
    plutoGrad.addColorStop(1, '#5c3a28');
    ctx.fillStyle = plutoGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Cthulhu Macula (Dark Crimson-Brown Equatorial Tholin Belt)
    for (let c = 0; c < 24; c++) {
      ctx.fillStyle = c % 2 === 0 ? 'rgba(59, 17, 8, 0.78)' : 'rgba(92, 28, 12, 0.65)';
      ctx.beginPath();
      ctx.ellipse(60 + c * 32, 295 + Math.sin(c * 1.3) * 26, 62, 42, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tombaugh Regio (Bright Cream-White Nitrogen-Ice Heart: Sputnik Planitia)
    ctx.fillStyle = '#f5ebe0';
    ctx.beginPath();
    ctx.moveTo(512, 185);
    ctx.bezierCurveTo(445, 130, 365, 195, 435, 285);
    ctx.bezierCurveTo(475, 335, 512, 370, 512, 370);
    ctx.bezierCurveTo(512, 370, 549, 335, 589, 285);
    ctx.bezierCurveTo(659, 195, 579, 130, 512, 185);
    ctx.fill();

    // Sputnik Planitia Cellular Nitrogen Convection Polygons
    ctx.strokeStyle = 'rgba(180, 145, 115, 0.38)';
    ctx.lineWidth = 1.2;
    for (let p = 0; p < 28; p++) {
      const px = 440 + (p % 7) * 20;
      const py = 195 + Math.floor(p / 7) * 26;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cratered northern terrains
    for (let i = 0; i < 110; i++) {
      const cx = fractHash(i * 3.7) * 1024;
      const cy = 25 + fractHash(i * 6.1) * 220;
      const r = 3 + fractHash(i * 2.3) * 14;
      ctx.strokeStyle = 'rgba(245, 235, 224, 0.42)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (planetId === 'qonos_prime') {
    const qGrad = ctx.createLinearGradient(0, 0, 0, 512);
    qGrad.addColorStop(0, '#022c22');
    qGrad.addColorStop(0.5, '#064e3b');
    qGrad.addColorStop(1, '#022c22');
    ctx.fillStyle = qGrad;
    ctx.fillRect(0, 0, 1024, 512);

    paintDetailedContinent(280, 230, 160, 110, '#047857', '#292524', '#44403c', '#ea580c', 19);
    paintDetailedContinent(710, 260, 175, 115, '#047857', '#1c1917', '#3f3f46', '#f97316', 43);

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2.4;
    for (let r = 0; r < 28; r++) {
      const rx = (r * 67 + 140) % 1024;
      const ry = 95 + ((r * 31) % 320);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 28, ry + 14);
      ctx.lineTo(rx + 48, ry - 6);
      ctx.stroke();
    }
  } else if (planetId === 'romulus_prime') {
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 1024, 512);
    paintDetailedContinent(310, 225, 145, 95, '#0d9488', '#059669', '#047857', '#f1f5f9', 31);
    paintDetailedContinent(725, 265, 155, 105, '#0d9488', '#059669', '#065f46', '#f1f5f9', 73);
  } else if (planetId === 'vulcan_prime') {
    const vulcGrad = ctx.createLinearGradient(0, 0, 0, 512);
    vulcGrad.addColorStop(0, '#7c2d12');
    vulcGrad.addColorStop(0.5, '#c2410c');
    vulcGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = vulcGrad;
    ctx.fillRect(0, 0, 1024, 512);

    paintDetailedContinent(340, 240, 180, 110, '#9a3412', '#7c2d12', '#431407', '#fdba74', 55);
    paintDetailedContinent(760, 250, 165, 105, '#9a3412', '#7c2d12', '#431407', '#fed7aa', 88);
  } else if (type === 'terran') {
    const col = new THREE.Color(baseColor || '#1e40af');
    ctx.fillStyle = '#0c2d5c';
    ctx.fillRect(0, 0, 1024, 512);
    const landHex = `#${col.getHexString()}`;
    paintDetailedContinent(260, 210, 135, 90, '#0284c7', landHex, '#14532d', '#f1f5f9', 17);
    paintDetailedContinent(690, 270, 150, 95, '#0284c7', landHex, '#166534', '#e2e8f0', 61);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1024, 26);
    ctx.fillRect(0, 512 - 28, 1024, 28);
  } else if (type === 'ocean') {
    ctx.fillStyle = '#075985';
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 18; i++) {
      paintDetailedContinent(
        (i * 95 + 60) % 1024,
        80 + ((i * 43) % 350),
        42,
        26,
        '#06b6d4',
        '#10b981',
        '#047857',
        '#f8fafc',
        i * 7
      );
    }
  } else if (type === 'gas_giant') {
    const baseC = new THREE.Color(baseColor || '#0284c7');
    const lightC = baseC.clone().lerp(new THREE.Color(0xffffff), 0.45);
    const darkC = baseC.clone().multiplyScalar(0.55);
    const bands = 56;
    for (let b = 0; b < bands; b++) {
      const y = (b / bands) * 512;
      const c = b % 3 === 0 ? lightC : b % 3 === 1 ? baseC : darkC;
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(0, y, 1024, 512 / bands + 2);
    }
  } else if (type === 'desert' || type === 'volcanic') {
    ctx.fillStyle = baseColor || '#b45309';
    ctx.fillRect(0, 0, 1024, 512);
    paintDetailedContinent(310, 240, 175, 110, '#78350f', '#9a3412', '#451a03', '#fdba74', 29);
    paintDetailedContinent(740, 260, 165, 105, '#78350f', '#7c2d12', '#290f02', '#f97316', 81);
  } else if (type === 'ice') {
    ctx.fillStyle = baseColor || '#0284c7';
    ctx.fillRect(0, 0, 1024, 512);
    ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
    for (let i = 0; i < 32; i++) {
      ctx.beginPath();
      ctx.ellipse((i * 67) % 1024, (i * 29) % 512, 95, 34, i * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(12, 74, 110, 0.55)';
    ctx.lineWidth = 2;
    for (let l = 0; l < 40; l++) {
      ctx.beginPath();
      ctx.moveTo((l * 53) % 1024, (l * 37) % 512);
      ctx.bezierCurveTo(
        (l * 53 + 120) % 1024,
        (l * 37 + 60) % 512,
        (l * 53 + 220) % 1024,
        (l * 37 - 40 + 512) % 512,
        (l * 53 + 310) % 1024,
        (l * 37 + 90) % 512
      );
      ctx.stroke();
    }
  } else {
    const moonSeed = (planetId || baseColor || 'moon')
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 101);
    paintPhotorealisticLunarSurface(ctx, 1024, 512, moonSeed, false);
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  // Load real 2K planetary texture map and apply reference image grading when ready
  if (planetId && SOL_REAL_TEXTURE_PATHS[planetId]) {
    loadCachedImage(SOL_REAL_TEXTURE_PATHS[planetId], (img) => {
      compositeRealSolPlanetTexture(ctx, w, h, planetId, img, texture);
    });
  }

  textureCache.set(cacheKey, texture);
  return texture;
}

export const STAR_TREK_SOLAR_SYSTEMS: SolarSystem[] = [
  {
    "id": "sol_system",
    "name": "Sol System (Sector 001)",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Sol (Yellow Dwarf G2V)",
    "spectralType": "Class G",
    "centerCoordinates": [
      0,
      0,
      0
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Capital sector of the United Federation of Planets and Starfleet Command Headquarters.",
    "planets": [
      {
        "id": "sol_mercury",
        "name": "Mercury (Class-B Scorched Rock)",
        "systemId": "sol_system",
        "type": "volcanic",
        "radius": 22,
        "position": [
          -450,
          15,
          -600
        ],
        "textureColor": "#78716c",
        "description": "Innermost terrestrial planet, heavily cratered with Caloris Basin and extreme day/night thermal variance."
      },
      {
        "id": "sol_venus",
        "name": "Venus (Class-N Greenhouse Veil)",
        "systemId": "sol_system",
        "type": "desert",
        "radius": 42,
        "position": [
          -880,
          -25,
          -920
        ],
        "textureColor": "#f59e0b",
        "atmosphereColor": "#fde047",
        "description": "Dense greenhouse world shrouded in swirling golden sulfuric clouds and volcanic rift valleys."
      },
      {
        "id": "sol_earth",
        "name": "Earth (Class-M Capital)",
        "systemId": "sol_system",
        "type": "terran",
        "radius": 48,
        "position": [
          0,
          0,
          -1450
        ],
        "textureColor": "#1e40af",
        "atmosphereColor": "#60a5fa",
        "description": "Capital of the United Federation of Planets, seat of the Federation Council and Starfleet Command."
      },
      {
        "id": "sol_moon",
        "name": "The Moon (Luna / Class-D)",
        "systemId": "sol_system",
        "type": "moon",
        "radius": 15,
        "position": [
          115,
          25,
          -1390
        ],
        "parentPlanetId": "sol_earth",
        "textureColor": "#94a3b8",
        "description": "Earth natural cratered satellite, home to Armstrong Base and Lunar observatories."
      },
      {
        "id": "sol_mars",
        "name": "Mars (Class-N Crimson Desert)",
        "systemId": "sol_system",
        "type": "desert",
        "radius": 36,
        "position": [
          1450,
          30,
          -1700
        ],
        "textureColor": "#dc2626",
        "atmosphereColor": "#f87171",
        "description": "The Red Planet, featuring towering Olympus Mons, Valles Marineris canyon, and Utopia Planitia."
      },
      {
        "id": "sol_jupiter",
        "name": "Jupiter (Class-J Majestic Gas Giant)",
        "systemId": "sol_system",
        "type": "gas_giant",
        "radius": 110,
        "position": [
          -2900,
          45,
          2300
        ],
        "textureColor": "#ea580c",
        "atmosphereColor": "#fed7aa",
        "description": "King of the Sol System with turbulent cloud bands, cyclonic storms, and the Great Red Spot."
      },
      {
        "id": "sol_europa",
        "name": "Europa (Class-P Ice Moon)",
        "systemId": "sol_system",
        "type": "moon",
        "radius": 16,
        "position": [
          -2760,
          58,
          2400
        ],
        "parentPlanetId": "sol_jupiter",
        "textureColor": "#e0f2fe",
        "description": "Icy Jovian moon with fractured surface ridges over deep subterranean oceans."
      },
      {
        "id": "sol_saturn",
        "name": "Saturn (Class-J Ringed Jewel)",
        "systemId": "sol_system",
        "type": "gas_giant",
        "radius": 95,
        "position": [
          3700,
          -35,
          3600
        ],
        "textureColor": "#ca8a04",
        "atmosphereColor": "#fef08a",
        "hasRings": true,
        "ringInner": 120,
        "ringOuter": 215,
        "ringColor": "#fde68a",
        "description": "Spectacular ringed giant with billions of ice boulders in resonant orbital tracks."
      },
      {
        "id": "sol_titan",
        "name": "Titan (Methane Moon)",
        "systemId": "sol_system",
        "type": "moon",
        "radius": 18,
        "position": [
          3860,
          -20,
          3730
        ],
        "parentPlanetId": "sol_saturn",
        "textureColor": "#f59e0b",
        "description": "Saturn massive shrouded moon with liquid hydrocarbon lakes and thick orange smog."
      },
      {
        "id": "sol_uranus",
        "name": "Uranus (Class-I Aquamarine Ice Giant)",
        "systemId": "sol_system",
        "type": "gas_giant",
        "radius": 68,
        "position": [
          5400,
          50,
          -2600
        ],
        "textureColor": "#06b6d4",
        "atmosphereColor": "#67e8f9",
        "hasRings": true,
        "ringInner": 82,
        "ringOuter": 120,
        "ringColor": "#a5f3fc",
        "description": "Tilted ice giant surrounded by delicate crystalline dust rings and methane ice clouds."
      },
      {
        "id": "sol_neptune",
        "name": "Neptune (Class-I Deep Azure World)",
        "systemId": "sol_system",
        "type": "gas_giant",
        "radius": 65,
        "position": [
          -6300,
          -45,
          -4200
        ],
        "textureColor": "#1d4ed8",
        "atmosphereColor": "#60a5fa",
        "description": "Outer blue giant exhibiting supersonic wind speeds and high-altitude methane cloud formations."
      },
      {
        "id": "sol_pluto",
        "name": "Pluto & Charon (Class-D Crystalline Ice Dwarf)",
        "systemId": "sol_system",
        "type": "ice",
        "radius": 20,
        "position": [
          7400,
          65,
          5600
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#bae6fd",
        "description": "Dwarf planet at the edge of the Kuiper Belt with heart-shaped nitrogen ice plains and companion Charon."
      },
      {
        "id": "sol_black_hole",
        "name": "Sol Singularity (Black Hole · 21 AU Beyond Pluto)",
        "systemId": "sol_system",
        "type": "anomaly",
        "radius": 90,
        "position": [
          11335,
          110,
          8600
        ],
        "textureColor": "#f97316",
        "atmosphereColor": "#38bdf8",
        "hasRings": true,
        "ringInner": 110,
        "ringOuter": 380,
        "ringColor": "#f97316",
        "description": "Kerr-metric gravitational singularity situated 21 AU beyond Pluto outside the Sol planetary orbits. Features a blazing relativistic accretion disk and Einstein lensing halo; entering its event horizon transits through spacetime to the Qo'noS White Hole."
      }
    ]
  },
  {
    "id": "vulcan_system",
    "name": "40 Eridani / Vulcan System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "40 Eridani A (Orange Dwarf K1V)",
    "spectralType": "Class K",
    "centerCoordinates": [
      38000,
      700,
      -48000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Founding member world of the Federation, homeworld of the logical Vulcan species.",
    "planets": [
      {
        "id": "vulcan_prime",
        "name": "Vulcan (Class-M)",
        "systemId": "vulcan_system",
        "type": "desert",
        "radius": 35,
        "position": [
          38259,
          573,
          -46732
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#f59e0b",
        "description": "Arid, mountainous world with higher gravity and thinner atmosphere than Earth."
      },
      {
        "id": "vulcan_tkhut",
        "name": "T'Khut (Sister Planet)",
        "systemId": "vulcan_system",
        "type": "volcanic",
        "radius": 24,
        "position": [
          37561,
          915,
          -50145
        ],
        "parentPlanetId": "vulcan_prime",
        "textureColor": "#78350f",
        "atmosphereColor": "#f97316",
        "description": "Massive geologically active companion planet dominating Vulcan red-orange sky."
      }
    ]
  },
  {
    "id": "andoria_system",
    "name": "Procyon / Andorian System",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Procyon (Luminous Subgiant F5)",
    "spectralType": "Class F",
    "centerCoordinates": [
      -42000,
      -500,
      -48000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Home territory of the passionate Andorian Imperial Guard and founding Federation member.",
    "planets": [
      {
        "id": "andoria_gas_giant",
        "name": "Ka'Thelan (Ringed Giant)",
        "systemId": "andoria_system",
        "type": "gas_giant",
        "radius": 72,
        "position": [
          -43197,
          -525,
          -47492
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#38bdf8",
        "hasRings": true,
        "ringInner": 88,
        "ringOuter": 140,
        "ringColor": "#7dd3fc",
        "description": "Majestic turquoise gas giant orbited by inhabited ice moon Andoria."
      },
      {
        "id": "andoria_moon",
        "name": "Andoria (Class-P Ice World)",
        "systemId": "andoria_system",
        "type": "ice",
        "radius": 12,
        "position": [
          -39975,
          -457,
          -48859
        ],
        "parentPlanetId": "andoria_gas_giant",
        "textureColor": "#0369a1",
        "atmosphereColor": "#bae6fd",
        "description": "Glacial moon with underground geothermal cities fueled by subterranean heat veins."
      }
    ]
  },
  {
    "id": "tellar_system",
    "name": "61 Cygni / Tellar Prime System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "61 Cygni (Binary Star K-V)",
    "spectralType": "Class K Binary",
    "centerCoordinates": [
      -32000,
      400,
      -32000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Homeworld of the formidable Tellarite founders, renowned master shipwrights and debaters.",
    "planets": [
      {
        "id": "tellar_prime",
        "name": "Tellar Prime (Class-M)",
        "systemId": "tellar_system",
        "type": "terran",
        "radius": 35,
        "position": [
          -32793,
          400,
          -33154
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#fbbf24",
        "description": "Mountainous world of expansive iron-rich peaks and geothermal valleys."
      }
    ]
  },
  {
    "id": "betazed_system",
    "name": "Beta Zeta / Betazed System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Beta Zeta (Yellow Main Sequence)",
    "spectralType": "Class G",
    "centerCoordinates": [
      -46000,
      800,
      -26000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Serene Federation world of the empathic Betazoids, celebrated for its pristine oceans and art.",
    "planets": [
      {
        "id": "betazed_prime",
        "name": "Betazed (Class-M Telepathic Haven)",
        "systemId": "betazed_system",
        "type": "terran",
        "radius": 35,
        "position": [
          -45028,
          750,
          -27006
        ],
        "textureColor": "#059669",
        "atmosphereColor": "#34d399",
        "description": "Lush paradise of the Opal Sea and Lake El-Nar. Federation Council cultural center."
      }
    ]
  },
  {
    "id": "trill_system",
    "name": "Trillius / Trill System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Trillius Prime (Blue-White F2V)",
    "spectralType": "Class F",
    "centerCoordinates": [
      -58000,
      -600,
      -24000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Enlightened world of Joined Trill symbionts and the Symbiosis Commission.",
    "planets": [
      {
        "id": "trill_prime",
        "name": "Trill (Class-M Joined World)",
        "systemId": "trill_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -56819,
          -525,
          -23252
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#38bdf8",
        "description": "Temperate sapphire ocean world containing the ancient subterranean Caves of Mak'ala."
      }
    ]
  },
  {
    "id": "risa_system",
    "name": "Epsilon Ceti / Risa System",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Epsilon Ceti B (Warm Orange Star)",
    "spectralType": "Class K",
    "centerCoordinates": [
      34000,
      300,
      -22000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Famed subtropical pleasure resort world transformed by planetary weather-control grids.",
    "planets": [
      {
        "id": "risa_prime",
        "name": "Risa (Class-M Pleasure Planet)",
        "systemId": "risa_system",
        "type": "terran",
        "radius": 35,
        "position": [
          33499,
          495,
          -20707
        ],
        "textureColor": "#0d9488",
        "atmosphereColor": "#2dd4bf",
        "description": "Subtropical island world where Starfleet crews seek R&R under artificial balmy breezes."
      }
    ]
  },
  {
    "id": "wolf359_sector",
    "name": "Wolf 359 Sector",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Wolf 359 (Red Flare Dwarf M6V)",
    "spectralType": "Class M Dwarf",
    "centerCoordinates": [
      18000,
      -500,
      -22000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Catastrophic battleground of 2367 where 39 Starfleet vessels fell to a single Borg Cube.",
    "planets": [
      {
        "id": "wolf359_memorial_buoy",
        "name": "Wolf 359 Starfleet Memorial Buoy",
        "systemId": "wolf359_sector",
        "type": "anomaly",
        "radius": 28,
        "position": [
          16588,
          -458,
          -22186
        ],
        "textureColor": "#e2e8f0",
        "description": "Permanent deep-space memorial and subspace beacon honoring the 11,000 lost Starfleet personnel."
      },
      {
        "id": "saratoga_wreckage",
        "name": "USS Saratoga Graveyard Hulk",
        "systemId": "wolf359_sector",
        "type": "anomaly",
        "radius": 24,
        "position": [
          16619,
          -466,
          -22228
        ],
        "textureColor": "#475569",
        "description": "Preserved battle-scarred hull drifting in solemn orbit as a historical warning."
      }
    ]
  },
  {
    "id": "spacedock_one_sector",
    "name": "Sector 001 Void (Deep Space Spacedock)",
    "quadrant": "Alpha-Beta Deep Space Void",
    "primaryStar": "Interstellar Deep Space (No Central Star)",
    "spectralType": "Deep Space Void",
    "centerCoordinates": [
      14200,
      350,
      -12800
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Pitch-black interstellar deep-space sector housing Starfleet Deep Space Spacedock One, completely isolated from any planetary systems or stellar gravity wells.",
    "planets": [
      {
        "id": "sol_spacedock",
        "name": "Starfleet Deep Space Spacedock One",
        "systemId": "spacedock_one_sector",
        "type": "starbase",
        "radius": 14,
        "position": [
          14200,
          350,
          -12800
        ],
        "textureColor": "#cbd5e1",
        "description": "Monumental Starfleet Deep Space Outpost Spacedock stationed in the empty interstellar void, equipped with external gantry rings, internal berthing bays, automated repair drone swarms, and antimatter supply arrays."
      }
    ]
  },
  {
    "id": "starbase74_sector",
    "name": "Deep Space Dock 74 (Interstellar Void)",
    "quadrant": "Alpha-Beta Deep Space Void",
    "primaryStar": "Interstellar Deep Space (No Central Star)",
    "spectralType": "Deep Space Void",
    "centerCoordinates": [
      24000,
      450,
      -28000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Isolated deep-space Spacedock complex positioned in the dark interstellar void far from any planet or solar system.",
    "planets": [
      {
        "id": "starbase_74_megadock",
        "name": "Deep Space Dock 74 (Interstellar Void)",
        "systemId": "starbase74_sector",
        "type": "starbase",
        "radius": 14,
        "position": [
          24000,
          450,
          -28000
        ],
        "textureColor": "#0ea5e9",
        "description": "Monumental Deep-Space Spacedock stationed in empty interstellar space light-years from any star or planet, providing full hull repairs and torpedo rearm."
      }
    ]
  },
  {
    "id": "deneb_system",
    "name": "Deneb IV / Farpoint Sector",
    "quadrant": "Alpha Quadrant Frontier",
    "primaryStar": "Deneb Kaitos (Luminous Supergiant A2Ia)",
    "spectralType": "Class A Supergiant",
    "centerCoordinates": [
      -42000,
      700,
      -62000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Frontier outpost sector visited on the maiden voyage of the USS Enterprise-D, home to the sentient spaceborne entity at Farpoint Station.",
    "planets": [
      {
        "id": "deneb_iv",
        "name": "Deneb IV (Class-M Bandi World)",
        "systemId": "deneb_system",
        "type": "terran",
        "radius": 35,
        "position": [
          -40639,
          716,
          -62327
        ],
        "textureColor": "#059669",
        "atmosphereColor": "#6ee7b7",
        "description": "Vast temperate world colonized by the Bandi people, surrounded by geo-thermal crystal valleys."
      }
    ]
  },
  {
    "id": "babel_system",
    "name": "Babel Neutral System",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Babel Primary (Class G)",
    "spectralType": "Class G",
    "centerCoordinates": [
      22000,
      400,
      -32000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Designated neutral diplomatic world where the historic Babel Conferences united Federation founders.",
    "planets": [
      {
        "id": "babel_prime",
        "name": "Babel Planetoid (Class-M Diplomatic World)",
        "systemId": "babel_system",
        "type": "terran",
        "radius": 35,
        "position": [
          22593,
          400,
          -30732
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#7dd3fc",
        "description": "Demilitarized planetoid hosting high-level peace accords and multi-species negotiations."
      }
    ]
  },
  {
    "id": "bolian_system",
    "name": "Bolarus IX / Bolian Sector",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Bolarus Star (Class F)",
    "spectralType": "Class F",
    "centerCoordinates": [
      -34000,
      -400,
      -46000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Homeworld of the amiable and cooperative Bolian species, celebrated for its expansive azure oceanic archipelagos and financial exchanges.",
    "planets": [
      {
        "id": "bolarus_ix",
        "name": "Bolarus IX (Azure Archipelago World)",
        "systemId": "bolian_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -35125,
          -358,
          -45167
        ],
        "textureColor": "#0369a1",
        "atmosphereColor": "#38bdf8",
        "description": "Pristine ocean world with hundreds of tropical island cities and deep-sea geothermal power taps."
      }
    ]
  },
  {
    "id": "benzar_system",
    "name": "Benzar / Benzite Sector",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Benzar Sun (Class K)",
    "spectralType": "Class K",
    "centerCoordinates": [
      -42000,
      -500,
      -40000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "High-gravity world of the meticulous Benzites, known for its crystalline spires and nitrogen-heavy atmosphere.",
    "planets": [
      {
        "id": "benzar_prime",
        "name": "Benzar (Geothermal Spire World)",
        "systemId": "benzar_system",
        "type": "desert",
        "radius": 35,
        "position": [
          -43041,
          -593,
          -40931
        ],
        "textureColor": "#7c2d12",
        "atmosphereColor": "#fdba74",
        "description": "Mineral-rich world studded with towering silica spires and geothermally regulated subterranean habitations."
      }
    ]
  },
  {
    "id": "ceti_alpha_system",
    "name": "Ceti Alpha Sector",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Ceti Alpha (Red Dwarf M1V)",
    "spectralType": "Class M Dwarf",
    "centerCoordinates": [
      28000,
      -300,
      -38000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Desolate system where Ceti Alpha VI exploded in 2267, shifting the orbit of Ceti Alpha V and creating a harsh wasteland.",
    "planets": [
      {
        "id": "ceti_alpha_v",
        "name": "Ceti Alpha V (Harsh Desert Wasteland)",
        "systemId": "ceti_alpha_system",
        "type": "desert",
        "radius": 35,
        "position": [
          28659,
          -467,
          -39108
        ],
        "textureColor": "#78350f",
        "atmosphereColor": "#ea580c",
        "description": "Barren planet swept by intense sandstorms, exile world of Khan Noonien Singh and his followers."
      },
      {
        "id": "botany_bay_relic",
        "name": "SS Botany Bay Derelict Relic",
        "systemId": "ceti_alpha_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          26885,
          -17,
          -36125
        ],
        "textureColor": "#475569",
        "description": "Preserved orbital debris and historical beacon marking the 20th-century sleeper ship discovery site."
      }
    ]
  },
  {
    "id": "kronos_system",
    "name": "Qo'noS / Klingon Imperial Territory",
    "quadrant": "Beta Quadrant Combat Zone",
    "primaryStar": "Klingon Prime (Volcanic Star)",
    "spectralType": "Class K (Klingon Territory)",
    "centerCoordinates": [
      76000,
      1400,
      -82000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Sovereign heart of the Klingon Empire. Hostile Birds-of-Prey and Negh'Var Flagships patrol this frontier and aggressively engage Federation intruders.",
    "planets": [
      {
        "id": "qonos_prime",
        "name": "Qo'noS (Klingon Homeworld)",
        "systemId": "kronos_system",
        "type": "volcanic",
        "radius": 35,
        "position": [
          77230,
          1337,
          -81583
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#f97316",
        "description": "Capital homeworld of the Klingon Empire, First City, and the Great Hall of the Klingon High Council."
      },
      {
        "id": "praxis_remnant",
        "name": "Praxis (Shattered Dilithium Remnant)",
        "systemId": "kronos_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          75286,
          1089,
          -79942
        ],
        "textureColor": "#78350f",
        "hasRings": true,
        "ringInner": 33,
        "ringOuter": 55,
        "ringColor": "#d97706",
        "description": "Cataclysmically fractured dilithium celestial remnant surrounded by high-energy volcanic rings."
      },
      {
        "id": "rura_penthe",
        "name": "Rura Penthe (Dilithium Penal World)",
        "systemId": "kronos_system",
        "type": "ice",
        "radius": 32,
        "position": [
          72879,
          1560,
          -83059
        ],
        "textureColor": "#64748b",
        "atmosphereColor": "#94a3b8",
        "description": "Notorious sub-zero Klingon penal world shielded by a magnetic dampening barrier. Dilithium mines manned by prisoners."
      },
      {
        "id": "boreth_monastery",
        "name": "Boreth (Sacred Monastery of Kahless)",
        "systemId": "kronos_system",
        "type": "terran",
        "radius": 32,
        "position": [
          77460,
          2036,
          -86209
        ],
        "textureColor": "#92400e",
        "atmosphereColor": "#fbbf24",
        "description": "Sacred planetary sanctuary of the Klingon Empire housing the holy clerics and sacred Monastery of Kahless the Unforgettable."
      },
      {
        "id": "kronos_white_hole",
        "name": "Qo'noS White Hole (White Dwarf · Outer Sector)",
        "systemId": "kronos_system",
        "type": "anomaly",
        "radius": 75,
        "position": [
          79100,
          2400,
          -90900
        ],
        "textureColor": "#e0f2fe",
        "atmosphereColor": "#38bdf8",
        "hasRings": true,
        "ringInner": 95,
        "ringOuter": 310,
        "ringColor": "#38bdf8",
        "description": "Incandescent White Hole / White Dwarf exit singularity situated 21 AU beyond the outermost Qo'noS planetary orbit, ejecting relativistic matter and vessels arriving from the Sol Black Hole."
      }
    ]
  },
  {
    "id": "khitomer_system",
    "name": "Khitomer Sector",
    "quadrant": "Beta Quadrant Border Zone",
    "primaryStar": "Khitomer Binary Sun",
    "spectralType": "Class F/K Binary",
    "centerCoordinates": [
      62000,
      1000,
      -68000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Site of the historic Khitomer Accords and Camp Khitomer peace conference.",
    "planets": [
      {
        "id": "khitomer_colony",
        "name": "Khitomer (Class-M Colony)",
        "systemId": "khitomer_system",
        "type": "terran",
        "radius": 35,
        "position": [
          61819,
          861,
          -66619
        ],
        "textureColor": "#15803d",
        "atmosphereColor": "#4ade80",
        "description": "Lush colony world guarded by both Starfleet and Klingon border patrols."
      }
    ]
  },
  {
    "id": "narendra_system",
    "name": "Narendra Sector",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Narendra Star (Class G)",
    "spectralType": "Class G",
    "centerCoordinates": [
      68000,
      1100,
      -64000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Site of the legendary defense where the Enterprise-C sacrificed herself protecting a Klingon outpost against Romulans.",
    "planets": [
      {
        "id": "narendra_iii",
        "name": "Narendra III (Class-M Sacred Outpost)",
        "systemId": "narendra_system",
        "type": "desert",
        "radius": 35,
        "position": [
          66604,
          1095,
          -63901
        ],
        "textureColor": "#b45309",
        "atmosphereColor": "#f59e0b",
        "description": "Venerated Klingon outpost world where warrior blood and Starfleet valor united the two powers."
      }
    ]
  },
  {
    "id": "mempa_system",
    "name": "Mempa Sector / Fleet Staging Ground",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Mempa Sun (Class K Red Giant)",
    "spectralType": "Class K Giant",
    "centerCoordinates": [
      84000,
      1200,
      -90000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Strategic bastion sector where the Klingon Defense Force stages heavy Battlecruisers for empire defense.",
    "planets": [
      {
        "id": "mempa_prime",
        "name": "Mempa Prime (Class-M Fortress World)",
        "systemId": "mempa_system",
        "type": "terran",
        "radius": 35,
        "position": [
          83624,
          1200,
          -91349
        ],
        "textureColor": "#854d0e",
        "atmosphereColor": "#ca8a04",
        "description": "Heavily fortified redoubt world containing subterranean weapons caches and training academies for Klingon warriors."
      }
    ]
  },
  {
    "id": "krios_system",
    "name": "Kriosian System / Frontier World",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Krios Primary (Class F)",
    "spectralType": "Class F",
    "centerCoordinates": [
      54000,
      800,
      -74000
    ],
    "territory": "non_federation",
    "affiliation": "Klingon Empire",
    "description": "Ancestral world of the empathic metamorphs, historic border dispute territory between Klingons and neighboring powers.",
    "planets": [
      {
        "id": "krios_prime",
        "name": "Krios Prime (Tropical Jungle World)",
        "systemId": "krios_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          55157,
          770,
          -74591
        ],
        "textureColor": "#047857",
        "atmosphereColor": "#34d399",
        "description": "Lush tropical paradise world of vast green seas, ancient stone temples, and exotic flora."
      },
      {
        "id": "valt_minor",
        "name": "Valt Minor (Sister Colony)",
        "systemId": "krios_system",
        "type": "terran",
        "radius": 32,
        "position": [
          52041,
          850,
          -73000
        ],
        "textureColor": "#059669",
        "atmosphereColor": "#6ee7b7",
        "description": "Neighboring agrarian world settled by Valtese colonists under treaty accords."
      }
    ]
  },
  {
    "id": "romulus_system",
    "name": "Romulus / Romulan Star Empire",
    "quadrant": "Beta Quadrant Combat Zone",
    "primaryStar": "Romulan Binary Sun",
    "spectralType": "Class F Binary",
    "centerCoordinates": [
      82000,
      1500,
      -46000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Star Empire",
    "description": "Guarded frontier of the Romulan Star Empire. Cloaked Warbirds and Scimitar Dreadnought Motherships strike without warning.",
    "planets": [
      {
        "id": "romulus_prime",
        "name": "Romulus (Ch'Rihan Emerald Homeworld)",
        "systemId": "romulus_system",
        "type": "terran",
        "radius": 35,
        "position": [
          82811,
          1601,
          -44989
        ],
        "textureColor": "#065f46",
        "atmosphereColor": "#34d399",
        "description": "Emerald twin homeworld of the Romulan people, seat of the Romulan Senate and Imperial Palace."
      },
      {
        "id": "remus_prime",
        "name": "Remus (Ch'Havran Dilithium Mining World)",
        "systemId": "romulus_system",
        "type": "desert",
        "radius": 32,
        "position": [
          80628,
          1328,
          -47711
        ],
        "textureColor": "#1e293b",
        "atmosphereColor": "#10b981",
        "description": "Tidally locked harsh world of dilithium mining pits and heavy defense stations."
      }
    ]
  },
  {
    "id": "neutral_zone_sector",
    "name": "Deep Space Dock K-7 (Neutral Zone Void)",
    "quadrant": "Beta Quadrant Deep Space Void",
    "primaryStar": "Interstellar Deep Space (No Central Star)",
    "spectralType": "Deep Space Void",
    "centerCoordinates": [
      64000,
      900,
      -54000
    ],
    "isWarZone": false,
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Isolated deep-space Spacedock K-7 stationed in the empty interstellar void between Federation, Klingon, and Romulan space, far from any planet or star.",
    "planets": [
      {
        "id": "outpost_4",
        "name": "Deep Space Dock K-7 (Neutral Zone Void)",
        "systemId": "neutral_zone_sector",
        "type": "starbase",
        "radius": 14,
        "position": [
          64000,
          900,
          -54000
        ],
        "textureColor": "#64748b",
        "description": "Deep-space Spacedock complex positioned in uncharted interstellar void far from any planet or solar system, providing frontline repairs and torpedo resupply."
      }
    ]
  },
  {
    "id": "hobus_system",
    "name": "Hobus Supernova Sector",
    "quadrant": "Beta Quadrant Deep Space",
    "primaryStar": "Hobus Volatile Giant",
    "spectralType": "Supernova Precursor",
    "centerCoordinates": [
      92000,
      1700,
      -48000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Star Empire",
    "description": "Unstable cosmic sector radiating exotic subspace flux and dark matter shockwaves.",
    "planets": [
      {
        "id": "hobus_prime",
        "name": "Hobus Prime (Volcanic Extraction World)",
        "systemId": "hobus_system",
        "type": "volcanic",
        "radius": 35,
        "position": [
          90768,
          1800,
          -48658
        ],
        "textureColor": "#b91c1c",
        "atmosphereColor": "#ef4444",
        "description": "Superheated resource world threatened by stellar instability."
      }
    ]
  },
  {
    "id": "devron_system",
    "name": "Devron Sector / Neutral Frontier",
    "quadrant": "Beta Quadrant Neutral Zone",
    "primaryStar": "Devron Sun (Class G)",
    "spectralType": "Class G",
    "centerCoordinates": [
      72000,
      1200,
      -38000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Star Empire",
    "description": "Contested sector located at the edge of Romulan territory, location of the tri-temporal anti-time rift anomaly.",
    "planets": [
      {
        "id": "devron_iii",
        "name": "Devron III (Barren Dust World)",
        "systemId": "devron_system",
        "type": "desert",
        "radius": 35,
        "position": [
          72378,
          1324,
          -39238
        ],
        "textureColor": "#57534e",
        "atmosphereColor": "#a8a29e",
        "description": "Lifeless mineral world scarred by past conflicts and orbital bombardments."
      },
      {
        "id": "temporal_anomaly",
        "name": "Anti-Time Subspace Rift Anomaly",
        "systemId": "devron_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          71361,
          990,
          -35905
        ],
        "textureColor": "#c084fc",
        "description": "Pulsing multi-dimensional tear radiating tachyon particles that grow backwards through spacetime."
      }
    ]
  },
  {
    "id": "cheron_system",
    "name": "Cheron Battleground Sector",
    "quadrant": "Beta Quadrant",
    "primaryStar": "Cheron Star (Class B Blue Subgiant)",
    "spectralType": "Class B",
    "centerCoordinates": [
      88000,
      1400,
      -36000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Romulan Star Empire",
    "description": "Location of the decisive 2160 Battle of Cheron that ended the Earth-Romulan War and led to the creation of the Neutral Zone.",
    "planets": [
      {
        "id": "cheron_prime",
        "name": "Cheron (Historic War Planetoid)",
        "systemId": "cheron_system",
        "type": "ice",
        "radius": 35,
        "position": [
          89294,
          1394,
          -35878
        ],
        "textureColor": "#1e3a8a",
        "atmosphereColor": "#60a5fa",
        "description": "Frozen iron-crusted world surrounded by centuries-old navigational debris from the Earth-Romulan War."
      },
      {
        "id": "romulan_minefield",
        "name": "Cloaked Plasma Minefield Relay",
        "systemId": "cheron_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          85810,
          1410,
          -36206
        ],
        "textureColor": "#10b981",
        "description": "Automated cloaked ordnance grid warning Starfleet vessels against penetrating deeper into Romulan space."
      }
    ]
  },
  {
    "id": "cardassia_system",
    "name": "Cardassia System / Cardassian Union",
    "quadrant": "Alpha Quadrant Combat Zone",
    "primaryStar": "Cardassia Star (Orange Giant)",
    "spectralType": "Class K Giant",
    "centerCoordinates": [
      -92000,
      -1000,
      -42000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Cardassian Union",
    "description": "Authoritarian capital of the Cardassian Union and Obsidian Order, guarded by Galor-class warships.",
    "planets": [
      {
        "id": "cardassia_prime",
        "name": "Cardassia Prime (Class-M Arid World)",
        "systemId": "cardassia_system",
        "type": "desert",
        "radius": 35,
        "position": [
          -91862,
          -1000,
          -40707
        ],
        "textureColor": "#a16207",
        "atmosphereColor": "#ca8a04",
        "description": "Heavily fortified homeworld of the Cardassians, characterized by obsidian spires and harsh sun."
      },
      {
        "id": "cardassia_iv",
        "name": "Cardassia IV (Military Outpost & Shipyards)",
        "systemId": "cardassia_system",
        "type": "volcanic",
        "radius": 32,
        "position": [
          -92234,
          -1000,
          -44187
        ],
        "textureColor": "#854d0e",
        "atmosphereColor": "#eab308",
        "description": "Strategic military shipyard and fortified fleet construction complex."
      }
    ]
  },
  {
    "id": "chintoka_system",
    "name": "Chin'toka Sector / Dominion War Front",
    "quadrant": "Alpha Quadrant Combat Zone",
    "primaryStar": "Chin'toka Sun (Class F)",
    "spectralType": "Class F",
    "centerCoordinates": [
      -102000,
      -1200,
      -48000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Cardassian Union",
    "description": "Fiercely contested system where Allied Federation-Klingon-Romulan fleets clashed against Cardassian automated platforms and the Breen.",
    "planets": [
      {
        "id": "chintoka_iii",
        "name": "Chin'toka III (Class-M Fortress World)",
        "systemId": "chintoka_system",
        "type": "terran",
        "radius": 35,
        "position": [
          -103239,
          -1180,
          -47607
        ],
        "textureColor": "#713f12",
        "atmosphereColor": "#eab308",
        "description": "Strategic planet garrisoned by heavy Cardassian planetary defense fortifications."
      },
      {
        "id": "orbital_weapon_platform",
        "name": "Automated Weapon Platform Array",
        "systemId": "chintoka_system",
        "type": "anomaly",
        "radius": 26,
        "position": [
          -99903,
          -1233,
          -48665
        ],
        "textureColor": "#dc2626",
        "description": "Self-powered uncrewed orbital weapons platforms armed with regenerating shields and spinal plasma torpedoes."
      }
    ]
  },
  {
    "id": "celtris_system",
    "name": "Celtris Sector / Obsidian Stronghold",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Celtris Star (Class M Red Star)",
    "spectralType": "Class M",
    "centerCoordinates": [
      -96000,
      -900,
      -32000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Cardassian Union",
    "description": "Secret Cardassian intelligence sector housing covert testing grounds and cavern bases in the obsidian mountain ranges.",
    "planets": [
      {
        "id": "celtris_iii",
        "name": "Celtris III (Subterranean Cavern World)",
        "systemId": "celtris_system",
        "type": "desert",
        "radius": 35,
        "position": [
          -96681,
          -1022,
          -33217
        ],
        "textureColor": "#44403c",
        "atmosphereColor": "#78716c",
        "description": "Barren planet concealing labyrinthine subterranean military research complexes deep beneath its mantle."
      }
    ]
  },
  {
    "id": "bajor_system",
    "name": "Bajoran System & Deep Space Nine",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Bajor-B'hava'el (Class G)",
    "spectralType": "Class G",
    "centerCoordinates": [
      -80000,
      -800,
      -34000
    ],
    "territory": "federation",
    "affiliation": "Bajoran Republic / Starfleet",
    "description": "Sacred territory guarding the only stable wormhole to the Gamma Quadrant, protected by Starfleet and Deep Space 9.",
    "planets": [
      {
        "id": "bajor_prime",
        "name": "Bajor (Class-M Spiritual World)",
        "systemId": "bajor_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -79013,
          -927,
          -34837
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#38bdf8",
        "description": "Verdant, spiritual world deeply devoted to the Prophets and ancient celestial orbs."
      },
      {
        "id": "bajor_wormhole",
        "name": "Bajoran Wormhole (Celestial Temple)",
        "systemId": "bajor_system",
        "type": "anomaly",
        "radius": 40,
        "position": [
          -80600,
          -750,
          -33600
        ],
        "textureColor": "#38bdf8",
        "description": "Swirling subspace singularity leading directly to the Idran system in the Gamma Quadrant."
      }
    ]
  },
  {
    "id": "denorios_void_sector",
    "name": "Denorios Belt Void (Deep Space 9)",
    "quadrant": "Alpha-Gamma Border Void",
    "primaryStar": "Denorios Interstellar Void (No Central Star)",
    "spectralType": "Deep Space Void",
    "centerCoordinates": [
      -72000,
      480,
      -42000
    ],
    "territory": "federation",
    "affiliation": "Bajoran Provisional Govt / Starfleet",
    "description": "Remote deep-space void outpost located in the Denorios asteroid belt far from any star or planet, guarding the threshold to the Bajoran Wormhole.",
    "planets": [
      {
        "id": "deep_space_nine",
        "name": "Deep Space 9 (Denorios Void Outpost)",
        "systemId": "denorios_void_sector",
        "type": "starbase",
        "radius": 14,
        "position": [
          -72000,
          480,
          -42000
        ],
        "textureColor": "#94a3b8",
        "description": "Nor-class deep space outpost with upper docking pylons, habitat ring, central promenade, and automated maintenance facilities."
      }
    ]
  },
  {
    "id": "badlands_sector",
    "name": "The Badlands Sector",
    "quadrant": "Alpha Quadrant Plasma Frontier",
    "primaryStar": "Plasma Core Anomaly",
    "spectralType": "Plasma Storm Field",
    "centerCoordinates": [
      -98000,
      -700,
      -54000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Contested Plasma Zone",
    "description": "Violent subspace storms and fiery plasma vortices that render sensors nearly blind. Haven for Maquis raiders.",
    "planets": [
      {
        "id": "badlands_storm_core",
        "name": "Badlands Plasma Storm Nebula",
        "systemId": "badlands_sector",
        "type": "nebula",
        "radius": 110,
        "position": [
          -96895,
          -828,
          -53150
        ],
        "textureColor": "#ea580c",
        "atmosphereColor": "#f97316",
        "description": "Swirling tempest of fiery plasma eddies that disrupt shields and warp drive."
      }
    ]
  },
  {
    "id": "ferenginar_system",
    "name": "Ferenginar / Ferengi Alliance",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Ferengi Sun (Yellow-Orange Dwarf)",
    "spectralType": "Class K",
    "centerCoordinates": [
      -62000,
      600,
      -46000
    ],
    "territory": "non_federation",
    "affiliation": "Ferengi Alliance",
    "description": "Capital world of the profit-driven Ferengi Alliance and seat of the Grand Nagus.",
    "planets": [
      {
        "id": "ferenginar_prime",
        "name": "Ferenginar (Class-M Torrential Rain World)",
        "systemId": "ferenginar_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -62622,
          475,
          -44752
        ],
        "textureColor": "#047857",
        "atmosphereColor": "#34d399",
        "description": "Damp, perpetually rain-soaked world famous for the 40-story Tower of Commerce."
      }
    ]
  },
  {
    "id": "breen_system",
    "name": "Breen Confederacy / Sub-Zero Frontier",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Breen Sun (Frozen White Dwarf)",
    "spectralType": "Class D Dwarf",
    "centerCoordinates": [
      -74000,
      800,
      -70000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Breen Confederacy",
    "description": "Mysterious, xenophobic species encased in refrigerated environmental suits. Infamous for energy-dampening weapon technology.",
    "planets": [
      {
        "id": "breen_homeworld",
        "name": "Breen (Sub-Zero Refrigerated Glacial World)",
        "systemId": "breen_system",
        "type": "ice",
        "radius": 35,
        "position": [
          -75353,
          818,
          -70359
        ],
        "textureColor": "#0284c7",
        "atmosphereColor": "#bae6fd",
        "description": "Glacial tundra world containing subterranean cryogenic cities and orbital defense bunkers."
      }
    ]
  },
  {
    "id": "mutara_sector",
    "name": "Mutara Sector & Genesis Range",
    "quadrant": "Alpha Quadrant",
    "primaryStar": "Mutara Nebula Core",
    "spectralType": "Class B Stellar Nursery",
    "centerCoordinates": [
      -36000,
      1400,
      -74000
    ],
    "territory": "non_federation",
    "affiliation": "Contested Neutral Zone",
    "description": "Dense subspace nebula containing intense electromagnetic discharges and the historic Genesis testing ground.",
    "planets": [
      {
        "id": "mutara_nebula_cloud",
        "name": "Mutara Ion Nebula",
        "systemId": "mutara_sector",
        "type": "nebula",
        "radius": 110,
        "position": [
          -35924,
          1400,
          -75298
        ],
        "textureColor": "#9333ea",
        "atmosphereColor": "#c084fc",
        "description": "Volatile violet gas nebula that completely neutralizes shields and blinds optical sensors."
      },
      {
        "id": "regula_planetoid",
        "name": "Regula (Class-D Planetoid)",
        "systemId": "mutara_sector",
        "type": "desert",
        "radius": 32,
        "position": [
          -34162,
          1400,
          -72790
        ],
        "textureColor": "#475569",
        "atmosphereColor": "#94a3b8",
        "description": "Lifeless astronomical rock selected for secret Federation terraforming experimentation."
      },
      {
        "id": "genesis_planet",
        "name": "Genesis World (Prototype Evolution)",
        "systemId": "mutara_sector",
        "type": "terran",
        "radius": 32,
        "position": [
          -38949,
          1400,
          -72520
        ],
        "textureColor": "#059669",
        "atmosphereColor": "#6ee7b7",
        "description": "Vibrant rapidly evolving experimental paradise world formed by Genesis Matrix reaction."
      }
    ]
  },
  {
    "id": "briar_patch_sector",
    "name": "Sector 44140 / The Briar Patch",
    "quadrant": "Beta Quadrant Isolated Space",
    "primaryStar": "Ba'ku Sun (Golden Luminary)",
    "spectralType": "Metaphasic Source",
    "centerCoordinates": [
      44000,
      800,
      -76000
    ],
    "territory": "non_federation",
    "affiliation": "Ba'ku Sanctuary",
    "description": "Enigmatic region of false vacuum pockets and metaphasic radiation clouds that regenerate organic cells.",
    "planets": [
      {
        "id": "baku_homeworld",
        "name": "Ba'ku (Metaphasic Paradise World)",
        "systemId": "briar_patch_sector",
        "type": "terran",
        "radius": 35,
        "position": [
          45287,
          791,
          -76184
        ],
        "textureColor": "#16a34a",
        "atmosphereColor": "#86efac",
        "hasRings": true,
        "ringInner": 44,
        "ringOuter": 74,
        "ringColor": "#facc15",
        "description": "Peaceful world whose planetary rings emit metaphasic radiation granting eternal biological youth."
      },
      {
        "id": "briar_patch_nebula",
        "name": "Briar Patch Metaphasic Cloud",
        "systemId": "briar_patch_sector",
        "type": "nebula",
        "radius": 130,
        "position": [
          41822,
          816,
          -75688
        ],
        "textureColor": "#eab308",
        "atmosphereColor": "#facc15",
        "description": "Golden luminous gas cloud with high sensor dispersion that suffocates conventional warp manifolds."
      }
    ]
  },
  {
    "id": "gorn_sector",
    "name": "Gorn Hegemony / Cestus Expanse",
    "quadrant": "Beta / Alpha Border",
    "primaryStar": "Gornar Prime (Deep Blue Giant)",
    "spectralType": "Class B Giant",
    "centerCoordinates": [
      62000,
      -900,
      -108000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Gorn Hegemony",
    "description": "Hostile territory claimed by the reptilian Gorn Hegemony. Enormous deep-blue Dominator Dreadnoughts defend these border outposts.",
    "planets": [
      {
        "id": "gornar_homeworld",
        "name": "Gornar (Class-M Reptilian World)",
        "systemId": "gorn_sector",
        "type": "volcanic",
        "radius": 35,
        "position": [
          62437,
          -778,
          -106782
        ],
        "textureColor": "#1e3a8a",
        "atmosphereColor": "#38bdf8",
        "description": "Sweltering jungle and craggy fortress world inhabited by the formidable Gorn military."
      },
      {
        "id": "cestus_outpost",
        "name": "Cestus III Border Planetoid",
        "systemId": "gorn_sector",
        "type": "desert",
        "radius": 32,
        "position": [
          61260,
          -1107,
          -110061
        ],
        "textureColor": "#172554",
        "atmosphereColor": "#0ea5e9",
        "description": "Border planetoid site of historical clashes between Starfleet and Gorn landing forces."
      }
    ]
  },
  {
    "id": "tholian_sector",
    "name": "Tholian Assembly / Lathan Sector",
    "quadrant": "Alpha / Beta Frontier",
    "primaryStar": "Tholia Sun (Superheated Orange Star)",
    "spectralType": "Class Y Star",
    "centerCoordinates": [
      108000,
      -1000,
      -30000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Tholian Assembly",
    "description": "Xenophobic, punctilious crystalline species. Tholian vessels spin lethal energy webs to trap intruders.",
    "planets": [
      {
        "id": "tholia_prime",
        "name": "Tholia (Class-Y Crystalline World)",
        "systemId": "tholian_sector",
        "type": "volcanic",
        "radius": 35,
        "position": [
          106888,
          -899,
          -29335
        ],
        "textureColor": "#ea580c",
        "atmosphereColor": "#fb923c",
        "description": "Superheated world of molten silica and crystalline hive spires."
      },
      {
        "id": "tholian_web_beacon",
        "name": "Tholian Spatial Web Perimeter Beacon",
        "systemId": "tholian_sector",
        "type": "anomaly",
        "radius": 26,
        "position": [
          109883,
          -1170,
          -31126
        ],
        "textureColor": "#fb923c",
        "description": "Pulsing energy beacon projecting a high-tensile tractor web perimeter."
      }
    ]
  },
  {
    "id": "idran_system",
    "name": "Idran System / Gamma Quadrant Terminal",
    "quadrant": "Gamma Quadrant (Via Wormhole)",
    "primaryStar": "Idran Binary (Blue-White Subgiants)",
    "spectralType": "Class B Binary",
    "centerCoordinates": [
      -148000,
      -1300,
      -118000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Dominion Space",
    "description": "Terminus of the Bajoran Wormhole in the Gamma Quadrant, located 70,000 light-years from Bajor.",
    "planets": [
      {
        "id": "idran_prime",
        "name": "Idran I (Supermassive Gas Giant)",
        "systemId": "idran_system",
        "type": "gas_giant",
        "radius": 70,
        "position": [
          -148881,
          -1157,
          -118945
        ],
        "textureColor": "#4338ca",
        "atmosphereColor": "#818cf8",
        "hasRings": true,
        "ringInner": 88,
        "ringOuter": 147,
        "ringColor": "#a5b4fc",
        "description": "Immense indigo gas giant whose gravitational field stabilizes the Gamma Quadrant wormhole aperture."
      },
      {
        "id": "gamma_wormhole_terminus",
        "name": "Gamma Quadrant Wormhole Aperture",
        "systemId": "idran_system",
        "type": "wormhole",
        "radius": 40,
        "position": [
          -146509,
          -1542,
          -116401
        ],
        "textureColor": "#a855f7",
        "atmosphereColor": "#c084fc",
        "description": "Subspace aperture connecting back to the Bajor sector in the Alpha Quadrant."
      }
    ]
  },
  {
    "id": "omarion_system",
    "name": "Omarion Sector / Founders' Homeworld",
    "quadrant": "Gamma Quadrant",
    "primaryStar": "Omarion Sun (Pale Violet Star)",
    "spectralType": "Class A Star",
    "centerCoordinates": [
      -172000,
      -1500,
      -142000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Dominion Space",
    "description": "Guarded heart of the Dominion empire and sacred home of the Changeling Great Link.",
    "planets": [
      {
        "id": "founders_homeworld",
        "name": "The Great Link Sanctuary (Founders)",
        "systemId": "omarion_system",
        "type": "ocean",
        "radius": 35,
        "position": [
          -171181,
          -1387,
          -143129
        ],
        "textureColor": "#831843",
        "atmosphereColor": "#f472b6",
        "description": "Shimmering ocean world where billions of Changelings merge into the collective consciousness of the Great Link."
      }
    ]
  },
  {
    "id": "delta_caretaker_system",
    "name": "Delta Quadrant / Caretaker Array Sector",
    "quadrant": "Delta Quadrant Frontier",
    "primaryStar": "Nacene Tri-Star System",
    "spectralType": "Exotic Flare Star",
    "centerCoordinates": [
      138000,
      1600,
      -158000
    ],
    "territory": "non_federation",
    "affiliation": "Unexplored Delta Space",
    "description": "Location 70,000 light-years in the Delta Quadrant where the Nacene Caretaker Array pulled starships across the galaxy.",
    "planets": [
      {
        "id": "caretaker_array",
        "name": "The Caretaker Array Megastructure",
        "systemId": "delta_caretaker_system",
        "type": "anomaly",
        "radius": 24,
        "position": [
          139185,
          1573,
          -157465
        ],
        "textureColor": "#06b6d4",
        "atmosphereColor": "#67e8f9",
        "description": "Immense alien space station generating coherent tetryon displacement waves across galactic space."
      },
      {
        "id": "ocampa_v",
        "name": "Ocampa V (Subterranean Sanctuary World)",
        "systemId": "delta_caretaker_system",
        "type": "desert",
        "radius": 32,
        "position": [
          135995,
          1645,
          -158905
        ],
        "textureColor": "#c2410c",
        "atmosphereColor": "#fb923c",
        "description": "Arid surface world protecting the telepathic Ocampa civilization living in energy-sustained underground cities."
      }
    ]
  },
  {
    "id": "borg_unicomplex_system",
    "name": "Borg Collective Transwarp Perimeter",
    "quadrant": "Delta Quadrant / Borg Space",
    "primaryStar": "Subspace Dark Core",
    "spectralType": "Class X Singularity",
    "centerCoordinates": [
      178000,
      2000,
      -188000
    ],
    "isWarZone": true,
    "territory": "non_federation",
    "affiliation": "Borg Collective",
    "description": "Domain of the cybernetic Borg Collective. Massive Cubes, Spheres, and Transwarp hubs patrol this lethal zone.",
    "planets": [
      {
        "id": "borg_unicomplex",
        "name": "Borg Unicomplex Central Node",
        "systemId": "borg_unicomplex_system",
        "type": "anomaly",
        "radius": 24,
        "position": [
          177712,
          2000,
          -186732
        ],
        "textureColor": "#166534",
        "atmosphereColor": "#22c55e",
        "description": "Trillions of interconnected cybernetic structures housing the Borg Queen and hive mind nexus."
      },
      {
        "id": "transwarp_hub",
        "name": "Transwarp Conduit Hub 01",
        "systemId": "borg_unicomplex_system",
        "type": "wormhole",
        "radius": 40,
        "position": [
          178488,
          2000,
          -190145
        ],
        "textureColor": "#22c55e",
        "atmosphereColor": "#86efac",
        "description": "Vast artificial subspace gateway enabling instantaneous deployment across all four quadrants."
      }
    ]
  },
  {
    "id": "galactic_barrier_sector",
    "name": "Deep Space Dock Aegis (Galactic Rim Void)",
    "quadrant": "Galactic Rim Deep Space Void",
    "primaryStar": "Interstellar Deep Space (No Central Star)",
    "spectralType": "Deep Space Void",
    "centerCoordinates": [
      22000,
      1200,
      -218000
    ],
    "territory": "federation",
    "affiliation": "United Federation of Planets",
    "description": "Outermost Starfleet Deep-Space Spacedock stationed in the pitch-black galactic rim void far from any planet or solar system.",
    "planets": [
      {
        "id": "aegis_deep_array",
        "name": "Deep Space Dock Aegis (Galactic Rim Void)",
        "systemId": "galactic_barrier_sector",
        "type": "starbase",
        "radius": 14,
        "position": [
          22000,
          1200,
          -218000
        ],
        "textureColor": "#cbd5e1",
        "description": "The outermost Starfleet Deep-Space Spacedock stationed in empty extragalactic void far from any planet or solar system."
      }
    ]
  }
];

// --- UNIVERSAL 3D COORDINATE SYSTEM HELPERS ---
export interface UniversalCelestialBody {
  id: string;
  name: string;
  systemId: string;
  systemName: string;
  type: string;
  radius: number;
  hasRings?: boolean;
  ringOuter?: number;
  position: [number, number, number]; // Coordinates relative to current active solar system frame
  worldPosition: [number, number, number]; // Absolute universal coordinates
}

let _cachedUniversalBodies: UniversalCelestialBody[] | null = null;

// Returns a flattened list of all known celestial objects in the galaxy with both local and universal world positions
export function getAllUniversalCelestialBodies(): UniversalCelestialBody[] {
  if (_cachedUniversalBodies) return _cachedUniversalBodies;
  const list: UniversalCelestialBody[] = [];
  for (const sys of STAR_TREK_SOLAR_SYSTEMS) {
    const [scx, scy, scz] = sys.centerCoordinates;
    // Central Primary Star (Skip for Deep Space Void sectors which have no central star)
    if (!sys.spectralType.includes('Deep Space Void')) {
      const starRadius = sys.spectralType.includes('Supergiant')
        ? 165
        : sys.spectralType.includes('Giant')
        ? 150
        : sys.spectralType.includes('Dwarf')
        ? 120
        : 135;

      list.push({
        id: sys.id + "_primary_star",
        name: sys.primaryStar,
        systemId: sys.id,
        systemName: sys.name,
        type: 'star',
        radius: starRadius,
        position: [scx, scy, scz],
        worldPosition: [scx, scy, scz],
      });
    }

    // Planetary Bodies, Moons, Outposts & Starbases
    for (const p of sys.planets) {
      list.push({
        id: p.id,
        name: p.name,
        systemId: sys.id,
        systemName: sys.name,
        type: p.type,
        radius: p.radius || 35,
        hasRings: p.hasRings,
        ringOuter: p.ringOuter,
        position: p.position,
        worldPosition: [p.position[0] + scx, p.position[1] + scy, p.position[2] + scz],
      });
    }
  }
  _cachedUniversalBodies = list;
  return list;
}

// Safety Collision Calculation:
// Evaluates any arbitrary target coordinates [x, y, z] against all nearby stars, planets, moons, and stations.
// If the destination falls inside or dangerously close to an object (even its exact center),
// this function computes a safe standoff position outside the object's surface along the ship's approach direction.
export function calculateSafeCoordinates(
  targetPos: [number, number, number],
  shipPos: [number, number, number],
  activeSystemId: string,
  extraBuffer: number = 140
): {
  safePos: [number, number, number];
  isOffsetApplied: boolean;
  clearanceDistance: number;
  standoffObject?: UniversalCelestialBody;
  approachVector: [number, number, number];
} {
  const bodies = getAllUniversalCelestialBodies();
  const tx = targetPos[0];
  const ty = targetPos[1];
  const tz = targetPos[2];

  let closestBody: UniversalCelestialBody | null = null;
  let minSurfaceDist = Infinity;
  let computedSafeRadius = 0;

  for (const b of bodies) {
    // Only check bodies in the target context / system frame
    const bx = b.position[0];
    const by = b.position[1];
    const bz = b.position[2];

    const dx = tx - bx;
    const dy = ty - by;
    const dz = tz - bz;
    const distToCenter = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Physical radius plus ring clearance and buffer
    const baseRadius = b.radius || 40;
    const ringRadius = (b.hasRings && b.ringOuter) ? b.ringOuter : 0;
    // Standard safety zone: surface + buffer (for sol_black_hole, allow entry into gravitational pull zone at 310 units)
    const safeRadius = b.id === 'sol_black_hole'
      ? 310
      : Math.max(baseRadius * 2.5 + extraBuffer, ringRadius + extraBuffer, 220);

    const surfaceDist = distToCenter - safeRadius;
    if (distToCenter < safeRadius && surfaceDist < minSurfaceDist) {
      minSurfaceDist = surfaceDist;
      closestBody = b;
      computedSafeRadius = safeRadius;
    }
  }

  // Calculate approach direction from ship position towards destination
  let appX = shipPos[0] - tx;
  let appY = shipPos[1] - ty;
  let appZ = shipPos[2] - tz;
  let appLen = Math.sqrt(appX * appX + appY * appY + appZ * appZ);

  if (appLen < 0.001) {
    // Ship is already exactly at coordinate, default approach from elevated diagonal
    appX = 0;
    appY = 0.3;
    appZ = 1;
    appLen = Math.sqrt(appX * appX + appY * appY + appZ * appZ);
  }

  // Normalize approach vector (from destination towards approaching ship)
  appX /= appLen;
  appY /= appLen;
  appZ /= appLen;

  // Ensure pleasant viewing angle: don't approach precisely along the flat equator if planet has rings
  if (Math.abs(appY) < 0.18) {
    appY = 0.22;
    const reNorm = Math.sqrt(appX * appX + appY * appY + appZ * appZ);
    appX /= reNorm;
    appY /= reNorm;
    appZ /= reNorm;
  }

  if (closestBody) {
    // The requested coordinates are inside or too close to a celestial body!
    // Standoff point: object center + offset along approach direction by safeRadius
    const bx = closestBody.position[0];
    const by = closestBody.position[1];
    const bz = closestBody.position[2];

    // Compute direction from body center to ship approach
    let fromBodyX = shipPos[0] - bx;
    let fromBodyY = shipPos[1] - by;
    let fromBodyZ = shipPos[2] - bz;
    let fromBodyLen = Math.sqrt(fromBodyX * fromBodyX + fromBodyY * fromBodyY + fromBodyZ * fromBodyZ);

    if (fromBodyLen < 1) {
      fromBodyX = appX;
      fromBodyY = appY;
      fromBodyZ = appZ;
      fromBodyLen = 1;
    } else {
      fromBodyX /= fromBodyLen;
      fromBodyY /= fromBodyLen;
      fromBodyZ /= fromBodyLen;
    }

    if (Math.abs(fromBodyY) < 0.18) {
      fromBodyY = 0.22;
      const reNorm = Math.sqrt(fromBodyX * fromBodyX + fromBodyY * fromBodyY + fromBodyZ * fromBodyZ);
      fromBodyX /= reNorm;
      fromBodyY /= reNorm;
      fromBodyZ /= reNorm;
    }

    const safePos: [number, number, number] = [
      Math.round(bx + fromBodyX * computedSafeRadius),
      Math.round(by + fromBodyY * computedSafeRadius),
      Math.round(bz + fromBodyZ * computedSafeRadius),
    ];

    return {
      safePos,
      isOffsetApplied: true,
      clearanceDistance: Math.round(computedSafeRadius),
      standoffObject: closestBody,
      approachVector: [fromBodyX, fromBodyY, fromBodyZ],
    };
  }

  // Destination is in deep open space, no celestial body collision danger detected
  return {
    safePos: [Math.round(tx), Math.round(ty), Math.round(tz)],
    isOffsetApplied: false,
    clearanceDistance: 0,
    approachVector: [appX, appY, appZ],
  };
}
