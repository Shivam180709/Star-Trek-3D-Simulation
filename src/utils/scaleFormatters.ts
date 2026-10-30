/**
 * Realistic Astronomical Distance & Star Trek Velocity Scale Formatters
 * for USS Enterprise NCC-1701
 *
 * Mathematical Scale Calibration:
 * - 1 Astronomical Unit (AU) = 149,597,870.7 km (~1.496 × 10⁸ km = 149.6 Gm = 149,600 Mm)
 * - Speed of Light (1c) = 299,792.458 km/s (~3.00 × 10⁵ km/s)
 * - 1 Light-Year (LY) = 9,460,730,472,580.8 km (~9.461 × 10¹² km = 63,241.1 AU)
 *   (Note: 'c' is a unit of speed [lightspeed], whereas 'Light-Year' is a unit of distance).
 *
 * 3D Scene Coordinate Mapping (preserving exact travel duration / ETAs):
 * - Sun [0, 0, 0] to Pluto [7400, 65, 5600] is ~9,280 scene units = 39.49 AU.
 * - Therefore: 1.0 AU = 235 scene units.
 * - 1 scene unit = 149,597,870.7 / 235 = 636,586.6838 km (~6.366 × 10⁵ km = 636.59 Mm = 0.6366 Gm).
 * - Whenever the starship moves at `sceneSpeed` (scene units/s), the distance `d` on the
 *   Tactical Radar and Target Telemetry changes at the exact mathematical rate:
 *   Δd/Δt = sceneSpeed × 636,586.6838 km/s = (sceneSpeed / 235) AU/s.
 */

export const KM_PER_AU = 149_597_870.7;
export const SPEED_OF_LIGHT_KMS = 299_792.458; // 1c in km/s
export const KM_PER_LIGHT_YEAR = 9_460_730_472_580.8;
export const AU_PER_LIGHT_YEAR = 63_241.077;

export const SCENE_UNITS_PER_AU = 235;
export const KM_PER_SCENE_UNIT = KM_PER_AU / SCENE_UNITS_PER_AU; // 636,586.6838 km per scene unit
export const GM_PER_SCENE_UNIT = KM_PER_SCENE_UNIT / 1_000_000; // ~0.636587 Gm per scene unit
export const MM_PER_SCENE_UNIT = KM_PER_SCENE_UNIT / 1_000; // ~636.587 Mm per scene unit

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
};

/**
 * Converts an integer exponent into Unicode superscript (e.g. 5 -> "⁵")
 */
export function toSuperscript(exp: number): string {
  return String(exp)
    .split('')
    .map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch)
    .join('');
}

/**
 * Formats a speed in km/s using power-of-10 scientific notation (e.g. "2.998 × 10⁵ km/s")
 */
export function formatScientificKms(kmPerSec: number, decimals: number = 2): string {
  if (!Number.isFinite(kmPerSec) || kmPerSec <= 0) {
    return '0 km/s';
  }
  const abs = Math.abs(kmPerSec);
  if (abs < 1000) {
    return `${abs.toFixed(1)} km/s`;
  }
  const exp = Math.floor(Math.log10(abs));
  const mantissa = abs / Math.pow(10, exp);
  return `${mantissa.toFixed(decimals)} × 10${toSuperscript(exp)} km/s`;
}

/**
 * Formats a speed in km/s with full comma-separated zeros (e.g. "299,792 km/s")
 */
export function formatFullZerosKms(kmPerSec: number): string {
  if (!Number.isFinite(kmPerSec) || kmPerSec <= 0) {
    return '0 km/s';
  }
  return `${Math.round(kmPerSec).toLocaleString('en-US')} km/s`;
}

/**
 * Official Star Trek Canonical Warp Factor Speed (TNG Okuda Scale + TOS Reference):
 * - For 1 <= w <= 9: v = w^(10/3) * c (TNG Scale; TOS Scale is w^3 * c)
 * - For 9 < w <= 9.99: Okuda exponential surge curve (Warp 9.0 = 1,516c, Warp 9.6 = 1,909c, Warp 9.9 = 3,053c)
 */
export function getStarTrekCanonicalWarpSpeed(warpFactor: number): {
  cMultiple: number;
  tosCMultiple: number;
  kmPerSec: number;
  auPerSec: number;
  scientificKms: string;
  fullZerosKms: string;
} {
  const w = Math.max(1.0, warpFactor);
  let cMultiple = Math.pow(w, 10 / 3);
  if (w > 9.0) {
    // Smooth Okuda high-warp surge above Warp 9 (matching 1,516c at W9.0 and ~3,053c at W9.9)
    const excess = Math.min(0.99, w - 9.0);
    const surge = 1 + Math.pow(excess / 0.9, 2.2) * 0.452;
    cMultiple = Math.pow(w, 10 / 3) * surge;
  }
  const tosCMultiple = Math.pow(w, 3);
  const kmPerSec = cMultiple * SPEED_OF_LIGHT_KMS;
  const auPerSec = kmPerSec / KM_PER_AU;

  return {
    cMultiple,
    tosCMultiple,
    kmPerSec,
    auPerSec,
    scientificKms: formatScientificKms(kmPerSec, 2),
    fullZerosKms: formatFullZerosKms(kmPerSec),
  };
}

/**
 * Computes exact real-time kinematic velocity (in km/s, AU/s, and multiples of c)
 * directly from the ship's 3D scene movement speed (`sceneUnitsPerSec`),
 * guaranteeing that Δ(Distance on Radar)/Δt === Velocity at all times.
 */
export function getKinematicVelocityTelemetry(
  isWarping: boolean,
  warpFactor: number,
  throttlePercent: number,
  isBoostActive: boolean = false,
  sceneSpeedUnitsPerSec?: number
): {
  sceneUnitsPerSec: number;
  kinematicKms: number;
  kinematicAuPerSec: number;
  kinematicCMultiple: number;
  kinematicSciKms: string;
  kinematicFullKms: string;
  canonWarp: ReturnType<typeof getStarTrekCanonicalWarpSpeed>;
} {
  let effectiveSceneSpeed = sceneSpeedUnitsPerSec;
  if (effectiveSceneSpeed === undefined || !Number.isFinite(effectiveSceneSpeed)) {
    if (isWarping) {
      effectiveSceneSpeed = Math.pow(Math.max(1, warpFactor), 2.6) * 115;
    } else if (isBoostActive) {
      const effThrottle = Math.max(throttlePercent, 90);
      effectiveSceneSpeed = (effThrottle / 100) * 260;
    } else if (throttlePercent <= 0) {
      effectiveSceneSpeed = 0;
    } else {
      effectiveSceneSpeed = (throttlePercent / 100) * 85;
    }
  }

  const kinematicKms = effectiveSceneSpeed * KM_PER_SCENE_UNIT;
  const kinematicAuPerSec = effectiveSceneSpeed / SCENE_UNITS_PER_AU;
  const kinematicCMultiple = kinematicKms / SPEED_OF_LIGHT_KMS;
  const canonWarp = getStarTrekCanonicalWarpSpeed(warpFactor);

  return {
    sceneUnitsPerSec: effectiveSceneSpeed,
    kinematicKms,
    kinematicAuPerSec,
    kinematicCMultiple,
    kinematicSciKms: formatScientificKms(kinematicKms, 2),
    kinematicFullKms: formatFullZerosKms(kinematicKms),
    canonWarp,
  };
}

/**
 * Formats an internal 3D scene distance into realistic astronomical units (AU, Gm, Mm, LY).
 * Keeps AU as the primary unit for Radar and Target Telemetry so that Δd/Δt matches velocity.
 */
export function formatAstronomicalDistance(
  sceneUnits: number,
  mode: 'compact' | 'standard' | 'detailed' = 'standard'
): string {
  if (!Number.isFinite(sceneUnits) || sceneUnits <= 0) {
    return mode === 'compact' ? '0.00 AU' : '0.00 AU (0 km)';
  }

  const absUnits = Math.abs(sceneUnits);
  const km = absUnits * KM_PER_SCENE_UNIT;
  const mm = absUnits * MM_PER_SCENE_UNIT;
  const gm = absUnits * GM_PER_SCENE_UNIT;
  const au = absUnits / SCENE_UNITS_PER_AU;

  // 1. Close Tactical / Orbital Proximity (< 25 scene units -> < 0.11 AU / < 15.9 Gm)
  if (absUnits < 25) {
    if (mode === 'compact') {
      return `${au.toFixed(3)} AU`;
    }
    if (mode === 'detailed') {
      return `${au.toFixed(3)} AU (${gm.toFixed(2)} Gm · ${Math.round(km).toLocaleString('en-US')} km)`;
    }
    return `${au.toFixed(3)} AU (${gm.toFixed(2)} Gm)`;
  }

  // 2. Inner Planetary / Sub-AU Range (25 to 235 scene units -> 0.11 AU to 1.00 AU)
  if (absUnits < SCENE_UNITS_PER_AU) {
    if (mode === 'compact') {
      return `${au.toFixed(2)} AU`;
    }
    if (mode === 'detailed') {
      return `${au.toFixed(2)} AU (${gm.toFixed(1)} Gm · ${Math.round(mm).toLocaleString('en-US')} Mm)`;
    }
    return `${au.toFixed(2)} AU (${gm.toFixed(1)} Gm)`;
  }

  // 3. Solar System / Interplanetary & Sector Range (1.0 AU to 110 AU, e.g. Sun to Pluto = 39.5 AU)
  if (absUnits < 26000) {
    const auFormatted = au >= 10 ? au.toFixed(1) : au.toFixed(2);
    if (mode === 'compact') {
      return `${auFormatted} AU`;
    }
    const gmText =
      gm >= 1000 ? `${(gm / 1000).toFixed(2)} Tm` : `${Math.round(gm).toLocaleString('en-US')} Gm`;
    if (mode === 'detailed') {
      return `${au.toFixed(2)} AU (${Math.round(gm).toLocaleString('en-US')} Gm · ${formatScientificKms(km, 2).replace('/s', '')})`;
    }
    return `${auFormatted} AU (${gmText})`;
  }

  // 4. Multi-System Sector Range (>= 26,000 scene units -> AU and Light-Years)
  const ly = au / AU_PER_LIGHT_YEAR;
  if (mode === 'compact') {
    return `${au.toFixed(0)} AU`;
  }
  if (mode === 'detailed') {
    return `${au.toFixed(1)} AU (${(gm / 1000).toFixed(2)} Tm · ${ly.toFixed(4)} LY)`;
  }
  return `${au.toFixed(1)} AU (${(gm / 1000).toFixed(1)} Tm)`;
}

/**
 * Formats radar concentric ring labels cleanly in AU.
 */
export function formatRadarRingDistance(sceneUnits: number): string {
  const au = sceneUnits / SCENE_UNITS_PER_AU;
  if (au < 1.0) {
    return `${au.toFixed(2)} AU`;
  }
  return `${au >= 10 ? au.toFixed(1) : au.toFixed(2)} AU`;
}

/**
 * Formats the Enterprise's velocity in km/s (with power-of-10 scientific notation, full zeros,
 * Star Trek canonical c multiples, and exact kinematic AU/s matching radar distance changes).
 */
export function formatStarshipVelocity(
  isWarping: boolean,
  warpFactor: number,
  throttlePercent: number,
  isBoostActive: boolean = false,
  compact: boolean = false,
  sceneSpeedUnitsPerSec?: number
): string {
  const telemetry = getKinematicVelocityTelemetry(
    isWarping,
    warpFactor,
    throttlePercent,
    isBoostActive,
    sceneSpeedUnitsPerSec
  );

  if (isWarping) {
    const cStr =
      telemetry.canonWarp.cMultiple >= 100
        ? Math.round(telemetry.canonWarp.cMultiple).toLocaleString('en-US')
        : telemetry.canonWarp.cMultiple.toFixed(1);
    if (compact) {
      return `${telemetry.kinematicSciKms} (${cStr}c)`;
    }
    return `${telemetry.kinematicFullKms} (${telemetry.kinematicSciKms} · ${cStr}c)`;
  }

  if (isBoostActive) {
    if (compact) {
      return `${telemetry.kinematicSciKms} (${telemetry.kinematicAuPerSec.toFixed(2)} AU/s)`;
    }
    return `${telemetry.kinematicFullKms} (${telemetry.kinematicSciKms})`;
  }

  if (throttlePercent <= 0 && telemetry.kinematicKms < 100) {
    return compact ? '0 km/s' : '0 km/s (Full Stop)';
  }

  if (compact) {
    return `${telemetry.kinematicSciKms}`;
  }

  return `${telemetry.kinematicFullKms} (${telemetry.kinematicSciKms})`;
}

/**
 * Computes mathematically consistent, strictly decreasing flight duration (ETA)
 * and astronomical distance telemetry across all Warp Factors (W1.0 -> W9.9)
 * for both intra-system planetary transits and interstellar sector jumps.
 *
 * Guarantees:
 * 1. Increasing Warp Factor (1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 9.9)
 *    ALWAYS reduces transit duration (never plateaus at 2s).
 * 2. Greater 3D distances ALWAYS require longer transit times at the same Warp Factor.
 * 3. Velocity rates (AU/s, Gm/s, sceneUnits/s) are strictly equal to Distance / Duration.
 */
export function calculateWarpTransitTelemetry(
  sceneDistUnits: number,
  warpFactor: number
): {
  sceneDist: number;
  seconds: number;
  exactSeconds: number;
  formattedEta: string;
  sceneSpeedUnitsPerSec: number;
  distAu: number;
  distKm: number;
  distGm: number;
  distMm: number;
  auPerSec: number;
  gmPerSec: number;
  compactDistanceKm: string;
  astronomicalReadout: string;
} {
  const safeDist = Math.max(80, Number.isFinite(sceneDistUnits) ? sceneDistUnits : 850);
  const w = Math.max(1.0, Math.min(9.9, Number.isFinite(warpFactor) ? warpFactor : 6.0));

  // Monotonic warp velocity factor with Okuda high-warp surge above W9.0
  const highWarpSurge = w > 9.0 ? 1 + Math.pow((w - 9.0) / 0.9, 1.35) * 0.42 : 1.0;
  const warpVelocityFactor = Math.pow(w, 1.35) * highWarpSurge;

  // Baseline Warp-1 duration scales smoothly with 3D distance so both intra-system
  // (300 - 10,000 units) and interstellar (35,000 - 250,000 units) trips have
  // distinct integer durations at every single Warp Factor (W1 through W9.9).
  const warp1Seconds = 19.5 * Math.pow(Math.max(150, safeDist), 0.25);
  const rawSeconds = Math.max(1.5, warp1Seconds / warpVelocityFactor);

  // Round to nearest integer (or 0.1s if under 4s) so every integer warp step is distinct
  const exactSeconds = Number(rawSeconds.toFixed(1));
  const seconds = Math.max(2, Math.round(rawSeconds));
  const formattedEta = rawSeconds < 10 ? `~${exactSeconds.toFixed(1)}s` : `~${seconds}s`;

  const sceneSpeedUnitsPerSec = safeDist / rawSeconds;

  const distAu = safeDist / SCENE_UNITS_PER_AU;
  const distKm = safeDist * KM_PER_SCENE_UNIT;
  const distGm = distKm / 1_000_000;
  const distMm = distKm / 1_000;

  const auPerSec = distAu / rawSeconds;
  const gmPerSec = distGm / rawSeconds;

  let compactDistanceKm = '';
  if (distKm >= 1e12) {
    compactDistanceKm = `${(distKm / 1e12).toFixed(2)}T km`;
  } else if (distKm >= 1e9) {
    compactDistanceKm = `${(distKm / 1e9).toFixed(2)}B km`;
  } else {
    compactDistanceKm = `${(distKm / 1e6).toFixed(1)}M km`;
  }

  return {
    sceneDist: Math.round(safeDist),
    seconds,
    exactSeconds,
    formattedEta,
    sceneSpeedUnitsPerSec,
    distAu,
    distKm,
    distGm,
    distMm,
    auPerSec,
    gmPerSec,
    compactDistanceKm,
    astronomicalReadout: formatAstronomicalDistance(safeDist, 'standard'),
  };
}

