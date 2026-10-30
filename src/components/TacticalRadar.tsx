import React, { useState, useMemo } from 'react';
import { EnemyShipState, PlanetData, ShipState } from '../types/simulation';
import {
  Radio,
  Crosshair,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Anchor,
  Sun,
  Shield,
  Navigation,
} from 'lucide-react';
import { getObjectDetails } from '../data/celestialObjectDatabase';
import { LCARSObjectInfoPanel } from './LCARSObjectInfoPanel';
import { STAR_TREK_SOLAR_SYSTEMS } from '../three/solarSystems';
import {
  formatAstronomicalDistance,
  formatRadarRingDistance,
} from '../utils/scaleFormatters';

interface TacticalRadarProps {
  shipState: ShipState | null;
  enemies: EnemyShipState[];
  planets: PlanetData[];
  onLockEnemy: (id: string) => void;
  onSelectPlanet: (id: string) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onOpenObjectDetails?: () => void;
  onPlotCourse?: (targetId: string) => void;
  onDock?: (stationId: string) => void;
  onClearTarget?: () => void;
}

interface ProcessedBlip {
  id: string;
  name: string;
  category: 'star' | 'planet' | 'moon' | 'starbase' | 'enemy';
  screenX: number;
  screenY: number;
  rawX: number;
  rawY: number;
  isInside: boolean;
  dist: number;
  color?: string;
  isTarget: boolean;
  isLocked: boolean;
  isMothership?: boolean;
  faction?: string;
  hasOffset: boolean;
  parentRawX?: number;
  parentRawY?: number;
}

export const TacticalRadar: React.FC<TacticalRadarProps> = ({
  shipState,
  enemies,
  planets,
  onLockEnemy,
  onSelectPlanet,
  isOpen = true,
  onToggleOpen,
  onOpenObjectDetails,
  onPlotCourse,
  onDock,
  onClearTarget,
}) => {
  // Radar range in km: DEFAULT is 15,000 km to cover the complete solar system
  const [rangeScale, setRangeScale] = useState<number>(15000);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  // Display Mode: 'flight' (Flight Heading-Up with fixed forward arrow)
  //               'sector' (Sector North-Up with rotating starship heading arrow)
  const [radarMode, setRadarMode] = useState<'sector' | 'flight'>('flight');

  // Compute selected object telemetry details (properly clears when deselected via Z)
  const selectedTargetId = shipState?.selectedTargetId || shipState?.lockedEnemy?.id || null;
  const objectInfo = useMemo(() => {
    if (!shipState || !selectedTargetId) return null;
    return getObjectDetails(selectedTargetId, shipState.position, enemies);
  }, [selectedTargetId, shipState?.position, enemies]);

  // Current system primary star coordinates
  const currentSystem = useMemo(() => {
    if (!shipState) return STAR_TREK_SOLAR_SYSTEMS[0];
    return STAR_TREK_SOLAR_SYSTEMS.find((s) => s.id === shipState.currentSystemId) || STAR_TREK_SOLAR_SYSTEMS[0];
  }, [shipState?.currentSystemId]);

  const radarSize = 192;
  const center = radarSize / 2;
  const radius = center - 8;

  // Convert 3D world coordinates to 2D radar coordinates (X and Z relative to ship)
  const shipX = shipState?.position?.x ?? 0;
  const shipZ = shipState?.position?.z ?? 0;

  // Real-time horizontal ship forward vector (normalized in horizontal X-Z plane)
  // Standard flight orientation: Bow is -Z (0, 0, -1), Starboard is +X (1, 0, 0)
  const rawForwardX = shipState?.forwardDirection?.x ?? 0;
  const rawForwardZ = shipState?.forwardDirection?.z ?? -1;
  const fLen = Math.hypot(rawForwardX, rawForwardZ) || 1;
  const forwardX = rawForwardX / fLen;
  const forwardZ = rawForwardZ / fLen;

  // Starboard right vector perpendicular to forward vector in horizontal X-Z plane
  const rightX = -forwardZ;
  const rightZ = forwardX;

  // Starship compass heading in degrees (000° = North/-Z, 090° = East/+X, 180° = South/+Z, 270° = West/-X)
  const shipHeadingDeg = useMemo(() => {
    const deg = (Math.atan2(forwardX, -forwardZ) * 180) / Math.PI;
    return (deg + 360) % 360;
  }, [forwardX, forwardZ]);

  const projectToRadar = (worldX: number, worldZ: number) => {
    const dx = worldX - shipX;
    const dz = worldZ - shipZ;

    const scale = radius / rangeScale;
    let screenX = center;
    let screenY = center;

    if (radarMode === 'sector') {
      // Sector Map (North-Up): Standard celestial cartography
      // -Z is North (UP on screen), +X is East (RIGHT on screen)
      screenX = center + dx * scale;
      screenY = center + dz * scale;
    } else {
      // Flight Heading-Up: Ahead is UP (-Y from center)
      const rx = dx * rightX + dz * rightZ;
      const rForward = dx * forwardX + dz * forwardZ;
      screenX = center + rx * scale;
      screenY = center - rForward * scale;
    }

    const dist = Math.hypot(dx, dz);
    const isInside = dist <= rangeScale;

    return { screenX, screenY, isInside, dist: Math.round(dist) };
  };

  // Navigational Range Scale presets for quick zoom stepping
  const RANGE_STEPS = [1200, 3000, 8000, 15000, 25000];
  const handleZoomIn = () => {
    const curIdx = RANGE_STEPS.indexOf(rangeScale);
    if (curIdx > 0) setRangeScale(RANGE_STEPS[curIdx - 1]);
    else if (curIdx === -1) {
      const smaller = RANGE_STEPS.filter((r) => r < rangeScale);
      if (smaller.length > 0) setRangeScale(smaller[smaller.length - 1]);
    }
  };
  const handleZoomOut = () => {
    const curIdx = RANGE_STEPS.indexOf(rangeScale);
    if (curIdx >= 0 && curIdx < RANGE_STEPS.length - 1) setRangeScale(RANGE_STEPS[curIdx + 1]);
    else if (curIdx === -1) {
      const larger = RANGE_STEPS.filter((r) => r > rangeScale);
      if (larger.length > 0) setRangeScale(larger[0]);
    }
  };

  // Selected Target Navigational Vector Calculation (Path system integration)
  const navTargetInfo = useMemo(() => {
    if (!shipState) return null;
    const targetId = shipState.selectedTargetId || shipState.lockedEnemy?.id || shipState.activeCoursePlot?.targetPlanet?.id;
    if (!targetId) return null;

    let targetWorldX: number | null = null;
    let targetWorldZ: number | null = null;
    let targetName = '';
    let category = 'planet';

    if (shipState.selectedTargetPosition) {
      targetWorldX = shipState.selectedTargetPosition[0];
      targetWorldZ = shipState.selectedTargetPosition[2];
    }

    const planet = planets.find((p) => p.id === targetId);
    if (planet) {
      if (targetWorldX === null || targetWorldZ === null) {
        targetWorldX = planet.position[0];
        targetWorldZ = planet.position[2];
      }
      targetName = planet.name;
      category = planet.type === 'starbase' ? 'starbase' : planet.type === 'moon' ? 'moon' : 'planet';
    } else {
      const enemy = enemies.find((e) => e.id === targetId && e.isAlive);
      if (enemy) {
        if (targetWorldX === null || targetWorldZ === null) {
          targetWorldX = enemy.position[0];
          targetWorldZ = enemy.position[2];
        }
        targetName = enemy.name;
        category = 'enemy';
      } else if (targetId.endsWith('_primary_star')) {
        targetWorldX = currentSystem.centerCoordinates[0];
        targetWorldZ = currentSystem.centerCoordinates[2];
        targetName = currentSystem.primaryStar;
        category = 'star';
      } else if (shipState.activeCoursePlot?.destinationPos) {
        targetWorldX = shipState.activeCoursePlot.destinationPos[0];
        targetWorldZ = shipState.activeCoursePlot.destinationPos[2];
        targetName = shipState.activeCoursePlot.targetPlanet?.name || 'Destination';
      }
    }

    if (targetWorldX === null || targetWorldZ === null) return null;

    const dx = targetWorldX - shipX;
    const dz = targetWorldZ - shipZ;
    const dist = Math.hypot(dx, dz);

    // If starship is near destination (<= 130 km), remove/hide dotted line as requested
    if (dist <= 130) {
      return null;
    }

    const scale = radius / rangeScale;
    let rawScreenX = center;
    let rawScreenY = center;

    if (radarMode === 'sector') {
      // Sector Mode: Target screen coordinates match world X and Z
      rawScreenX = center + dx * scale;
      rawScreenY = center + dz * scale;
    } else {
      // Flight Mode: Target screen coordinates relative to forward heading
      const rx = dx * rightX + dz * rightZ;
      const rForward = dx * forwardX + dz * forwardZ;
      rawScreenX = center + rx * scale;
      rawScreenY = center - rForward * scale;
    }

    const screenDist = Math.hypot(rawScreenX - center, rawScreenY - center);
    const isInside = dist <= rangeScale && screenDist <= radius;

    let endX = rawScreenX;
    let endY = rawScreenY;
    const angle = Math.atan2(rawScreenY - center, rawScreenX - center);

    if (!isInside) {
      // Clamped to radar boundary circle
      endX = center + Math.cos(angle) * radius;
      endY = center + Math.sin(angle) * radius;
    }

    return {
      targetId,
      targetName,
      dist: Math.round(dist),
      isInside,
      startX: center,
      startY: center,
      endX,
      endY,
      angle,
      category,
    };
  }, [
    shipState?.selectedTargetId,
    shipState?.lockedEnemy?.id,
    shipState?.activeCoursePlot,
    planets,
    enemies,
    currentSystem,
    shipX,
    shipZ,
    forwardX,
    forwardZ,
    rightX,
    rightZ,
    rangeScale,
    radius,
    center,
    radarMode,
    shipState?.selectedTargetPosition,
  ]);

  // Relative heading difference to selected target for directional steering guidance
  const targetSteeringInfo = useMemo(() => {
    if (!navTargetInfo) return null;
    const dx = navTargetInfo.endX - center;
    const dy = navTargetInfo.endY - center;
    // In screen coords, ahead is UP (dx = 0, dy < 0)
    const bearingRad = Math.atan2(dx, -dy);
    const bearingDeg = ((bearingRad * 180) / Math.PI + 360) % 360;
    const offsetDeg = bearingDeg > 180 ? bearingDeg - 360 : bearingDeg;
    const isAligned = Math.abs(offsetDeg) <= 6;
    return {
      bearingDeg: Math.round(bearingDeg),
      offsetDeg: Math.round(offsetDeg),
      isAligned,
      turnDirection: offsetDeg > 0 ? ('RIGHT' as const) : ('LEFT' as const),
      absTurnDeg: Math.abs(Math.round(offsetDeg)),
    };
  }, [navTargetInfo, center]);

  const aliveEnemies = enemies.filter((e) => e.isAlive);
  const wave = shipState?.combatWaveState;

  // Process and declutter radar blips to completely resolve overlapping elements:
  // - Primary Star & Major Planets maintain true positions
  // - Co-located Starbases / Spacedocks and Moons are radially separated with guide indicators
  // - Close-formation enemy squadrons are fanned out so every hostile is clearly clickable
  // - Clearance around central Enterprise icon is guaranteed
  const processedBlips: ProcessedBlip[] = useMemo(() => {
    if (!shipState) return [];
    const rawList: ProcessedBlip[] = [];

    // 1. Primary Star
    const starId = `${currentSystem.id}_primary_star`;
    const starProj = projectToRadar(
      currentSystem.centerCoordinates[0],
      currentSystem.centerCoordinates[2]
    );
    if (starProj.isInside) {
      rawList.push({
        id: starId,
        name: currentSystem.primaryStar,
        category: 'star',
        screenX: starProj.screenX,
        screenY: starProj.screenY,
        rawX: starProj.screenX,
        rawY: starProj.screenY,
        isInside: true,
        dist: starProj.dist,
        color: '#f59e0b',
        isTarget: shipState.selectedTargetId === starId,
        isLocked: false,
        hasOffset: false,
      });
    }

    // 2. Planets, Moons & Starbases strictly in the current solar system
    const systemPlanets = planets.filter((p) => p.systemId === currentSystem.id);
    for (const p of systemPlanets) {
      const proj = projectToRadar(p.position[0], p.position[2]);
      if (!proj.isInside) continue;

      const cat: 'planet' | 'moon' | 'starbase' =
        p.type === 'starbase' ? 'starbase' : p.type === 'moon' ? 'moon' : 'planet';

      rawList.push({
        id: p.id,
        name: p.name,
        category: cat,
        screenX: proj.screenX,
        screenY: proj.screenY,
        rawX: proj.screenX,
        rawY: proj.screenY,
        isInside: true,
        dist: proj.dist,
        color: p.textureColor || (cat === 'starbase' ? '#38bdf8' : '#94a3b8'),
        isTarget: shipState.selectedTargetId === p.id,
        isLocked: false,
        hasOffset: false,
      });
    }

    // 3. Alive Hostile Warships
    for (const e of aliveEnemies) {
      const proj = projectToRadar(e.position[0], e.position[2]);
      if (!proj.isInside) continue;

      rawList.push({
        id: e.id,
        name: e.name,
        category: 'enemy',
        screenX: proj.screenX,
        screenY: proj.screenY,
        rawX: proj.screenX,
        rawY: proj.screenY,
        isInside: true,
        dist: proj.dist,
        color: '#ef4444',
        isTarget: shipState.selectedTargetId === e.id,
        isLocked: shipState.lockedEnemy?.id === e.id,
        isMothership: e.isMothership,
        faction: e.faction,
        hasOffset: false,
      });
    }

    // 4. Overlap Resolution Algorithm:
    // When elements are closer than 14px, radially fan out companions (starbases, moons, escorts)
    // so every single element is distinctly visible and clickable.
    const resolved: ProcessedBlip[] = [];
    const minSeparation = 15;

    // Anchor primary bodies (stars and major planets) first
    const primaryBodies = rawList.filter((b) => b.category === 'star' || b.category === 'planet');
    for (const pb of primaryBodies) {
      // Ensure clearance from central player icon if ship is directly on top of planet/star
      const dToCenter = Math.hypot(pb.screenX - center, pb.screenY - center);
      if (dToCenter < 10) {
        pb.screenX += 12;
        pb.screenY -= 10;
        pb.hasOffset = true;
      }
      resolved.push(pb);
    }

    // Position secondary bodies (starbases, moons) relative to their anchor parents
    const secondaryBodies = rawList.filter((b) => b.category === 'starbase' || b.category === 'moon');
    const companionCounts = new Map<string, number>();

    for (const sb of secondaryBodies) {
      // Find nearest primary body
      let nearestParent: ProcessedBlip | null = null;
      let minParentDist = Infinity;

      for (const pb of primaryBodies) {
        const d = Math.hypot(sb.rawX - pb.rawX, sb.rawY - pb.rawY);
        if (d < minParentDist) {
          minParentDist = d;
          nearestParent = pb;
        }
      }

      if (nearestParent && minParentDist < minSeparation) {
        // Offset companion radially around host parent
        const count = companionCounts.get(nearestParent.id) || 0;
        companionCounts.set(nearestParent.id, count + 1);

        // Angle distribution: Starbases at -45° (top right), Moons at 135° (bottom left)
        let angle = sb.category === 'starbase' ? -Math.PI / 4 : (3 * Math.PI) / 4;
        if (count > 0) {
          angle += (count * Math.PI) / 3;
        }

        const offsetDist = 18;
        sb.screenX = nearestParent.screenX + Math.cos(angle) * offsetDist;
        sb.screenY = nearestParent.screenY + Math.sin(angle) * offsetDist;
        sb.hasOffset = true;
        sb.parentRawX = nearestParent.screenX;
        sb.parentRawY = nearestParent.screenY;
      } else {
        // Check clearance against center
        const dToCenter = Math.hypot(sb.screenX - center, sb.screenY - center);
        if (dToCenter < 10) {
          sb.screenX += 12;
          sb.screenY += 12;
          sb.hasOffset = true;
        }
      }
      resolved.push(sb);
    }

    // Position hostile enemy ships and resolve tight formation clusters
    const hostileBodies = rawList.filter((b) => b.category === 'enemy');
    for (let i = 0; i < hostileBodies.length; i++) {
      const hb = hostileBodies[i];
      for (let j = 0; j < i; j++) {
        const prev = hostileBodies[j];
        const d = Math.hypot(hb.screenX - prev.screenX, hb.screenY - prev.screenY);
        if (d < minSeparation) {
          // Push slightly in opposite direction
          const angle = Math.atan2(hb.screenY - prev.screenY, hb.screenX - prev.screenX) || (i * 1.2);
          hb.screenX = prev.screenX + Math.cos(angle) * minSeparation;
          hb.screenY = prev.screenY + Math.sin(angle) * minSeparation;
          hb.hasOffset = true;
        }
      }
      // Check clearance against center player icon
      const dToCenter = Math.hypot(hb.screenX - center, hb.screenY - center);
      if (dToCenter < 10) {
        hb.screenX += 13;
        hb.screenY -= 12;
        hb.hasOffset = true;
      }
      resolved.push(hb);
    }

    return resolved;
  }, [shipState, currentSystem, planets, aliveEnemies, shipX, shipZ, shipHeadingDeg, rangeScale, shipState?.selectedTargetId, shipState?.lockedEnemy?.id]);

  // Return null if shipState is not yet initialized
  if (!shipState) return null;

  // If dismissed or toggled off by user, show clean floating mini pill that won't block any view
  if (!isOpen || isDismissed) {
    return (
      <div className="absolute top-[68px] sm:top-[74px] right-3 z-30 pointer-events-auto select-none">
        <button
          onClick={() => {
            setIsDismissed(false);
            onToggleOpen?.();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-trek uppercase tracking-wide backdrop-blur-md shadow-lg transition-all ${
            shipState.isUnderAttack || shipState.hasIncomingTorpedo
              ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
              : aliveEnemies.length > 0
              ? 'bg-amber-950/90 border-amber-500/70 text-amber-200'
              : 'bg-slate-950/85 border-sky-500/40 text-sky-300 hover:bg-slate-900'
          }`}
          title="Open Tactical Radar [R]"
        >
          <Radio className="w-3.5 h-3.5 animate-pulse text-sky-400" />
          <span>Radar [R]</span>
          {aliveEnemies.length > 0 && (
            <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[10px] font-mono-nums font-bold">
              {aliveEnemies.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Ring distance labels based on current range scale in realistic astronomical units (Gm / AU)
  const halfRingLabel = formatRadarRingDistance(rangeScale / 2);
  const maxRingLabel = formatRadarRingDistance(rangeScale);

  return (
    <div className="absolute top-[68px] sm:top-[74px] right-2 sm:right-3.5 z-30 flex flex-col items-end select-none pointer-events-auto w-[275px] sm:w-[305px] md:w-[325px] max-h-[calc(100vh-170px)]">
      {/* Radar Container */}
      <div className="bg-slate-950/95 backdrop-blur-md rounded-xl border border-sky-500/40 p-2 sm:p-2.5 shadow-2xl shadow-sky-950/50 flex flex-col items-center w-full shrink-0">
        {/* Radar Header */}
        <div className="w-full flex items-center justify-between pb-1.5 mb-1 border-b border-slate-800 text-[11px] font-trek text-sky-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5 min-w-0">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse shrink-0" />
            <span className="font-bold truncate">Tactical Radar</span>
            <span className="text-[9px] text-slate-500 font-mono-nums shrink-0 hidden sm:inline">
              [{currentSystem.name.split('(')[0].trim()}]
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Quick Zoom Buttons */}
            <div className="flex items-center bg-slate-900 border border-sky-500/40 rounded overflow-hidden">
              <button
                onClick={handleZoomIn}
                className="px-1.5 py-0.5 text-[9px] font-bold text-sky-300 hover:bg-sky-500/20 hover:text-white transition-colors"
                title="Zoom Radar In (Combat / Orbit)"
              >
                +
              </button>
              <div className="w-[1px] h-3 bg-sky-500/30" />
              <button
                onClick={handleZoomOut}
                className="px-1.5 py-0.5 text-[9px] font-bold text-sky-300 hover:bg-sky-500/20 hover:text-white transition-colors"
                title="Zoom Radar Out (System / Sector)"
              >
                −
              </button>
            </div>

            {/* Range Selector: Full Solar System Default */}
            <select
              value={rangeScale}
              onChange={(e) => setRangeScale(Number(e.target.value))}
              className="bg-slate-900 border border-sky-500/40 rounded px-1.5 py-0.5 text-[9px] font-mono-nums text-amber-300 focus:outline-none cursor-pointer"
              title="Radar Scanning Radius"
            >
              <option value={15000}>63.8 AU (Solar System)</option>
              <option value={25000}>106.4 AU (Outer Sector)</option>
              <option value={8000}>34.0 AU (Mid System)</option>
              <option value={3000}>12.8 AU (Planetary Orbit)</option>
              <option value={1200}>5.1 AU / 764 Gm (Combat)</option>
            </select>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:text-white text-slate-400 hover:bg-slate-850 rounded transition-colors"
              title={isCollapsed ? 'Expand Radar' : 'Collapse Radar'}
            >
              {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 hover:text-red-400 text-slate-400 hover:bg-slate-850 rounded transition-colors"
              title="Minimize Radar (Press R or click button to restore)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embedded Scanner Alert Banner */}
        {shipState.hasIncomingTorpedo ? (
          <div className="w-full py-0.5 px-1.5 mb-1 bg-red-600 text-white rounded text-[9px] font-trek font-bold uppercase tracking-wider text-center animate-bounce flex items-center justify-center gap-1 shadow-sm">
            <AlertTriangle className="w-3 h-3 animate-ping" />
            <span>CRITICAL: INCOMING TORPEDO</span>
          </div>
        ) : shipState.isUnderAttack ? (
          <div className="w-full py-0.5 px-1.5 mb-1 bg-red-950 border border-red-500 text-red-200 rounded text-[9px] font-trek font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>UNDER ATTACK ({shipState.shieldIntegrity}%)</span>
          </div>
        ) : wave && wave.status === 'active' ? (
          <div className="w-full py-0.5 px-1.5 mb-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded text-[9px] font-mono-nums flex items-center justify-between">
            <span className="font-trek uppercase font-bold text-amber-400">LVL {wave.level}</span>
            <span className="text-red-400 font-semibold">{aliveEnemies.length} Hostiles</span>
          </div>
        ) : wave && wave.status === 'cleared' ? (
          <div className="w-full py-0.5 px-1.5 mb-1 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 rounded text-[9px] font-trek font-bold uppercase text-center">
            <span>SECTOR SECURED</span>
          </div>
        ) : null}

        {!isCollapsed && (
          <>
            {/* Radar Flight Mode Toggle & Heading Strip */}
            <div className="w-full flex items-center justify-between px-1 mb-1.5 text-[8.5px] font-mono-nums">
              <button
                onClick={() => setRadarMode((prev) => (prev === 'flight' ? 'sector' : 'flight'))}
                className={`px-1.5 py-0.5 rounded text-[8px] font-trek font-bold uppercase tracking-wider transition-colors border ${
                  radarMode === 'flight'
                    ? 'bg-sky-500/20 text-sky-200 border-sky-400/60 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle Radar Mode: FLIGHT (Heading-Up) vs SECTOR (North-Up)"
              >
                {radarMode === 'flight' ? '🧭 FLIGHT [HDG-UP]' : '🗺️ SECTOR [NORTH-UP]'}
              </button>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-trek uppercase text-[8px]">HDG</span>
                <span className="text-sky-300 font-bold">
                  {Math.round(shipHeadingDeg).toString().padStart(3, '0')}°
                </span>
                {targetSteeringInfo && (
                  <span
                    className={`px-1 py-0.2 rounded font-trek font-bold text-[7.5px] uppercase ${
                      targetSteeringInfo.isAligned
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                    }`}
                  >
                    {targetSteeringInfo.isAligned
                      ? '▲ ALIGNED'
                      : targetSteeringInfo.turnDirection === 'RIGHT'
                      ? `TURN ► ${targetSteeringInfo.absTurnDeg}°`
                      : `◄ TURN ${targetSteeringInfo.absTurnDeg}°`}
                  </span>
                )}
              </div>
            </div>

            {/* 2D Circular Radar Display */}
            <div
              className="relative rounded-full border-2 border-sky-500/70 bg-slate-950/95 overflow-hidden shadow-[inset_0_0_20px_rgba(2,132,199,0.3)] cursor-crosshair"
              style={{ width: radarSize, height: radarSize }}
            >
              {/* Concentric Range Rings */}
              <div className="absolute inset-[25%] rounded-full border border-sky-500/20 pointer-events-none" />
              <div className="absolute inset-[50%] rounded-full border border-sky-500/35 pointer-events-none" />
              <div className="absolute inset-[75%] rounded-full border border-sky-500/20 pointer-events-none" />

              {/* Crosshair Axes with Center Clearance */}
              <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-sky-500/30 pointer-events-none" />
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-sky-500/30 pointer-events-none" />

              {/* Cardinal Heading Ticks */}
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[6.5px] font-mono-nums font-bold text-sky-300 pointer-events-none">
                {radarMode === 'flight' ? 'FWD' : '000° N'}
              </span>
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[6.5px] font-mono-nums font-bold text-slate-500 pointer-events-none">
                {radarMode === 'flight' ? 'AFT' : '180° S'}
              </span>
              <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[6.5px] font-mono-nums font-bold text-slate-500 pointer-events-none">
                {radarMode === 'flight' ? 'PORT' : '270° W'}
              </span>
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[6.5px] font-mono-nums font-bold text-slate-500 pointer-events-none">
                {radarMode === 'flight' ? 'STBD' : '090° E'}
              </span>

              {/* Range Scale Tick Labels along vertical axis */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[7px] font-mono-nums text-sky-400/80 pointer-events-none">
                {maxRingLabel}
              </div>
              <div className="absolute top-[26%] left-1/2 -translate-x-1/2 text-[6.5px] font-mono-nums text-sky-400/60 pointer-events-none">
                {halfRingLabel}
              </div>

              {/* Sweeping Radar Scanner Line */}
              <div className="absolute inset-0 rounded-full border-t-2 border-sky-400/50 animate-spin pointer-events-none opacity-35 [animation-duration:3.5s]" />

              {/* SVG Connector Lines and Navigational Dotted White Path */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {/* Companion Offset Lines */}
                {processedBlips.map((blip) => {
                  if (blip.hasOffset && blip.parentRawX !== undefined && blip.parentRawY !== undefined) {
                    return (
                      <line
                        key={`line_${blip.id}`}
                        x1={blip.parentRawX}
                        y1={blip.parentRawY}
                        x2={blip.screenX}
                        y2={blip.screenY}
                        stroke={blip.category === 'starbase' ? '#38bdf8' : '#94a3b8'}
                        strokeWidth="0.8"
                        strokeDasharray="2 2"
                        opacity="0.45"
                      />
                    );
                  }
                  return null;
                })}

                {/* Dotted White Navigation Path Line to Target */}
                {navTargetInfo && (
                  <g key="radar_nav_path_group">
                    {/* Glowing Cyan Track Glow */}
                    <line
                      x1={navTargetInfo.startX}
                      y1={navTargetInfo.startY}
                      x2={navTargetInfo.endX}
                      y2={navTargetInfo.endY}
                      stroke="#0284c7"
                      strokeWidth="3.5"
                      strokeDasharray="4 3"
                      opacity="0.4"
                    />
                    {/* Crisp High-Visibility Dotted White Line */}
                    <line
                      x1={navTargetInfo.startX}
                      y1={navTargetInfo.startY}
                      x2={navTargetInfo.endX}
                      y2={navTargetInfo.endY}
                      stroke="#ffffff"
                      strokeWidth="1.6"
                      strokeDasharray="3 3"
                      opacity="0.95"
                      filter="drop-shadow(0 0 2px #38bdf8)"
                    />
                    {/* Destination Endpoint Waypoint Bead */}
                    <circle
                      cx={navTargetInfo.endX}
                      cy={navTargetInfo.endY}
                      r={navTargetInfo.isInside ? 3 : 3.5}
                      fill={navTargetInfo.isInside ? '#ffffff' : '#38bdf8'}
                      stroke="#ffffff"
                      strokeWidth="1.2"
                    />
                    {/* If out-of-range, pulse beacon at boundary */}
                    {!navTargetInfo.isInside && (
                      <circle
                        cx={navTargetInfo.endX}
                        cy={navTargetInfo.endY}
                        r="6"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.2"
                        className="animate-ping"
                        opacity="0.8"
                      />
                    )}
                  </g>
                )}
              </svg>

              {/* Out of Range Target Rim Distance Badge */}
              {navTargetInfo && !navTargetInfo.isInside && (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 px-1 py-0.2 rounded bg-slate-950/95 border border-sky-400 text-[6.5px] font-mono-nums text-sky-200 shadow-md whitespace-nowrap"
                  style={{
                    left: center + Math.cos(navTargetInfo.angle) * (radius - 11),
                    top: center + Math.sin(navTargetInfo.angle) * (radius - 11),
                  }}
                >
                  <span className="font-bold text-amber-300">
                    {formatAstronomicalDistance(navTargetInfo.dist, 'compact')}
                  </span>
                </div>
              )}

              {/* Center: USS Enterprise Starship Arrow Indicator (Front vs Back Clearly Indicated) */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 flex flex-col items-center justify-center"
                style={{ left: center, top: center }}
              >
                <div
                  className="flex flex-col items-center justify-center"
                  style={{
                    transform: `rotate(${radarMode === 'sector' ? shipHeadingDeg : 0}deg)`,
                    transformOrigin: '12px 12px',
                    transition: 'transform 0.08s linear',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="drop-shadow-[0_0_8px_rgba(56,189,248,0.95)]"
                  >
                    {/* Outer directional alignment ring */}
                    <circle
                      cx="12"
                      cy="12"
                      r="10.5"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="0.6"
                      strokeDasharray="2 2"
                      opacity="0.3"
                    />

                    {/* Starship Chevron Arrow pointing straight UP (Forward) */}
                    <polygon
                      points="12,2 20,20 12,15.5 4,20"
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    {/* Forward bridge / sensor dome */}
                    <circle cx="12" cy="8.5" r="1.8" fill="#ffffff" />
                    {/* Center Forward Keel Line */}
                    <line
                      x1="12"
                      y1="2"
                      x2="12"
                      y2="7.5"
                      stroke="#38bdf8"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    {/* Aft Impulse Thrusters: Vivid Glowing Amber Pip clearly marking REAR */}
                    <circle
                      cx="12"
                      cy="16"
                      r="1.6"
                      fill="#f97316"
                      stroke="#fbbf24"
                      strokeWidth="0.6"
                    />
                  </svg>
                  {/* Front direction indicator text */}
                  <span className="text-[6.5px] font-mono font-bold text-sky-300 tracking-wider -mt-0.5 opacity-90 uppercase">
                    ▲ FWD
                  </span>
                </div>
              </div>

              {/* Decluttered Interactive Blips */}
              {processedBlips.map((blip) => {
                const isSelected = blip.isTarget || blip.isLocked;

                // Handle click action
                const handleClick = () => {
                  if (blip.category === 'enemy') {
                    onLockEnemy(blip.id);
                  } else {
                    onSelectPlanet(blip.id);
                  }
                };

                return (
                  <button
                    key={blip.id}
                    onClick={handleClick}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group z-20 p-1 focus:outline-none transition-transform"
                    style={{ left: blip.screenX, top: blip.screenY }}
                    title={`${blip.name} · ${formatAstronomicalDistance(blip.dist, 'standard')}`}
                  >
                    {/* 1. Primary Star Blip */}
                    {blip.category === 'star' && (
                      <div className="relative flex items-center justify-center">
                        <div
                          className={`rounded-full transition-transform bg-amber-400 ${
                            isSelected
                              ? 'w-4 h-4 ring-2 ring-white animate-pulse'
                              : 'w-3 h-3 group-hover:scale-125 shadow-sm shadow-amber-500'
                          }`}
                        />
                        <div className="absolute inset-0 rounded-full border border-amber-300/40 animate-ping opacity-30" />
                      </div>
                    )}

                    {/* 2. Space Station / Starbase Blip: Distinct Cyan Station Anchor Icon */}
                    {blip.category === 'starbase' && (
                      <div
                        className={`rounded flex items-center justify-center transition-all ${
                          isSelected
                            ? 'w-4 h-4 bg-sky-500 text-slate-950 font-bold ring-2 ring-sky-300 animate-pulse'
                            : 'w-3 h-3 bg-sky-950 border border-sky-400 text-sky-300 group-hover:scale-125 shadow-sm shadow-sky-500/50'
                        }`}
                      >
                        <Anchor className="w-2 h-2" />
                      </div>
                    )}

                    {/* 3. Planet Blip: Colored sphere with atmosphere halo */}
                    {blip.category === 'planet' && (
                      <div
                        className={`rounded-full transition-transform ${
                          isSelected
                            ? 'w-3.5 h-3.5 ring-2 ring-amber-400'
                            : 'w-2.5 h-2.5 group-hover:scale-125'
                        }`}
                        style={{ backgroundColor: blip.color || '#38bdf8' }}
                      />
                    )}

                    {/* 4. Natural Satellite / Moon Blip */}
                    {blip.category === 'moon' && (
                      <div
                        className={`rounded-full transition-transform ${
                          isSelected
                            ? 'w-3 h-3 ring-2 ring-amber-400 bg-slate-200'
                            : 'w-2 h-2 bg-slate-400 group-hover:scale-125'
                        }`}
                      />
                    )}

                    {/* 5. Hostile Warship Blip */}
                    {blip.category === 'enemy' && (
                      <div
                        className={`flex items-center justify-center transition-all ${
                          blip.isLocked
                            ? 'w-4 h-4 bg-red-600 rounded-sm ring-2 ring-red-400 animate-pulse'
                            : blip.isMothership
                            ? 'w-3.5 h-3.5 bg-amber-500 text-slate-950 rounded ring-1 ring-amber-300'
                            : 'w-2.5 h-2.5 bg-red-500 rounded-full group-hover:scale-150'
                        }`}
                      >
                        {blip.isLocked ? (
                          <Crosshair className="w-2.5 h-2.5 text-white" />
                        ) : blip.isMothership ? (
                          <span className="text-[7px] font-bold">M</span>
                        ) : null}
                      </div>
                    )}

                    {/* Target Selection Brackets */}
                    {isSelected && (
                      <div className="absolute -inset-1 border border-amber-400/80 rounded pointer-events-none animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Navigational Track Strip */}
            {navTargetInfo && (
              <div className="w-full mt-2 px-2 py-1 rounded bg-sky-950/80 border border-sky-500/50 text-[9.5px] font-mono-nums flex items-center justify-between text-sky-200 shadow-sm">
                <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                  <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-pulse shrink-0" />
                  <span className="text-slate-400 font-trek uppercase text-[8.5px] shrink-0 font-bold">NAV TRACK:</span>
                  <span className="font-semibold text-white truncate text-[9.5px]">{navTargetInfo.targetName}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-amber-300 font-bold text-[9.5px]">
                    {formatAstronomicalDistance(navTargetInfo.dist, 'compact')}
                  </span>
                  {!navTargetInfo.isInside && (
                    <span className="text-[7.5px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 uppercase font-mono">
                      OUT
                    </span>
                  )}
                  {onClearTarget && (
                    <button
                      onClick={onClearTarget}
                      className="px-1.5 py-0.2 rounded bg-slate-800 hover:bg-red-600/60 text-slate-300 hover:text-white border border-slate-700 text-[8px] font-trek uppercase font-bold transition-colors ml-0.5"
                      title="Clear Target and Active Route [Z Key]"
                    >
                      Clear [Z]
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Quick Scanner Telemetry Legend & AI Status */}
            <div className="w-full mt-1.5 pt-1 border-t border-slate-800 text-[9px] font-mono-nums flex flex-col gap-1 text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>{aliveEnemies.length} Hostiles</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-sky-950 border border-sky-400 text-sky-300 flex items-center justify-center text-[7px]">⚓</span>
                  <span>Starbase</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>USS 1701</span>
                </span>
              </div>

              {wave?.adaptiveDifficulty && (
                <div className="flex items-center justify-between pt-0.5 text-[8.5px] border-t border-slate-900">
                  <span className="text-amber-400 font-trek uppercase">
                    AI: {wave.adaptiveDifficulty.fleetIntelligenceTier}
                  </span>
                  {wave.adaptiveDifficulty.predictiveLeadAim ? (
                    <span className="text-red-400 font-bold animate-pulse">⚡ LEAD AIM</span>
                  ) : (
                    <span className="text-slate-500 font-mono-nums">x{wave.adaptiveDifficulty.adaptiveDamageMultiplier} DMG</span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Interactive Object Information Panel directly below the radar */}
      <LCARSObjectInfoPanel
        objectInfo={objectInfo}
        onOpenDetails={onOpenObjectDetails || (() => {})}
        onPlotCourse={onPlotCourse}
        onDock={onDock}
        isDocked={shipState.isDocked}
        className="flex-1 min-h-0"
      />
    </div>
  );
};
