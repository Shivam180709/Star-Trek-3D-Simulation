import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SolarSystem, PlanetData, ShipState, CoursePlot } from '../types/simulation';
import { STAR_TREK_SOLAR_SYSTEMS } from '../three/solarSystems';
import {
  calculateWarpTransitTelemetry,
} from '../utils/scaleFormatters';
import {
  X,
  Compass,
  Globe,
  Rocket,
  Search,
  Crosshair,
  Layers,
  Anchor,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Link2,
} from 'lucide-react';

interface StarSystemMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  solarSystems: SolarSystem[];
  shipState: ShipState | null;
  activeCoursePlot: CoursePlot | null;
  onSetCourse: (systemId: string, planetId?: string, warpFactor?: number) => void;
  onSetCoordinatesCourse?: (
    coords: [number, number, number],
    systemId?: string,
    warpFactor?: number,
    label?: string
  ) => void;
  onCancelCourse: () => void;
  onDock?: (stationId?: string) => void;
  onUndock?: () => void;
}

type MapTab = 'galaxy' | 'orbits' | 'manifest';
type FilterType =
  | 'all'
  | 'stations'
  | 'planets'
  | 'federation'
  | 'klingon'
  | 'romulan'
  | 'cardassian'
  | 'dominion'
  | 'delta_borg';

type QuadrantFocus = 'all' | 'core' | 'frontiers';

const SOL_PLANET_TEXTURES: Record<string, string> = {
  sol_mercury: '/assets/planets/mercury.jpg',
  sol_venus: '/assets/planets/venus.jpg',
  sol_earth: '/assets/planets/earth.jpg',
  sol_moon: '/assets/aistudio/384add13b19d413d823b2b293bba3f1e_a45f0865.jpg',
  sol_mars: '/assets/planets/mars.jpg',
  sol_jupiter: '/assets/planets/jupiter.jpg',
  sol_saturn: '/assets/planets/saturn.jpg',
  sol_uranus: '/assets/planets/uranus.jpg',
  sol_neptune: '/assets/planets/neptune.jpg',
};

// Primary strategic Starfleet warp corridors (established interstellar lanes)
const STRATEGIC_WARP_LANES: [string, string][] = [
  ['sol_system', 'vulcan_system'],
  ['sol_system', 'andoria_system'],
  ['sol_system', 'wolf_359_system'],
  ['sol_system', 'alpha_centauri_system'],
  ['vulcan_system', 'andoria_system'],
  ['vulcan_system', 'kronos_system'],
  ['vulcan_system', 'romulus_system'],
  ['kronos_system', 'mempa_system'],
  ['kronos_system', 'rura_penthe_system'],
  ['romulus_system', 'krios_system'],
  ['romulus_system', 'remus_system'],
  ['sol_system', 'bajor_system'],
  ['bajor_system', 'cardassia_system'],
  ['bajor_system', 'idran_system'],
  ['idran_system', 'omarion_system'],
  ['cardassia_system', 'chintoka_system'],
  ['sol_system', 'starbase_12_sector'],
  ['sol_system', 'rigel_system'],
  ['delta_caretaker_system', 'borg_unicomplex_system'],
  ['galactic_barrier_sector', 'sol_system'],
];

// Deterministic visual position adjustments so the galactic astrometric chart matches the Starfleet Sector Cartography layout
const ASTROMETRIC_NODE_OFFSETS: Record<string, { dx: number; dy: number }> = {
  sol_system: { dx: -22, dy: -62 },
  vulcan_system: { dx: -26, dy: -115 },
  andoria_system: { dx: -52, dy: -75 },
  alpha_centauri_system: { dx: -10, dy: -32 },
  wolf_359_system: { dx: -60, dy: -15 },
  bajor_system: { dx: -68, dy: -30 },
  cardassia_system: { dx: -85, dy: -45 },
  chintoka_system: { dx: -60, dy: -42 },
  kronos_system: { dx: 35, dy: -35 },
  mempa_system: { dx: 48, dy: -45 },
  rura_penthe_system: { dx: 18, dy: -55 },
  romulus_system: { dx: 70, dy: -15 },
  remus_system: { dx: 52, dy: -22 },
  krios_system: { dx: 38, dy: -18 },
  idran_system: { dx: 55, dy: -20 },
  omarion_system: { dx: 65, dy: -30 },
  borg_unicomplex_system: { dx: -40, dy: 0 },
  delta_caretaker_system: { dx: -55, dy: 10 },
};

export const StarSystemMapModal: React.FC<StarSystemMapModalProps> = ({
  isOpen,
  onClose,
  solarSystems,
  shipState,
  activeCoursePlot,
  onSetCourse,
  onSetCoordinatesCourse,
  onCancelCourse,
  onDock,
  onUndock,
}) => {
  const [activeTab, setActiveTab] = useState<MapTab>('galaxy');
  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    shipState?.currentSystemId || 'sol_system'
  );
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>('sol_mercury');
  const [selectedWarp, setSelectedWarp] = useState<number>(shipState?.warpFactor || 6.0);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Astrometric Display & Interactive Canvas State
  const [quadrantFocus, setQuadrantFocus] = useState<QuadrantFocus>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showTerritories, setShowTerritories] = useState<boolean>(true);
  const [showAllLabels, setShowAllLabels] = useState<boolean>(true);
  const [hoveredSystemId, setHoveredSystemId] = useState<string | null>(null);

  // Bulletproof fallback to predefined systems
  const effectiveSolarSystems = useMemo(() => {
    return solarSystems && solarSystems.length > 0 ? solarSystems : STAR_TREK_SOLAR_SYSTEMS;
  }, [solarSystems]);

  const currentSystem: SolarSystem = useMemo(() => {
    const found = effectiveSolarSystems.find((s) => s.id === selectedSystemId);
    if (found) return found;
    const currentShipSys = effectiveSolarSystems.find((s) => s.id === shipState?.currentSystemId);
    if (currentShipSys) return currentShipSys;
    return effectiveSolarSystems[0] || STAR_TREK_SOLAR_SYSTEMS[0];
  }, [effectiveSolarSystems, selectedSystemId, shipState?.currentSystemId]);

  const selectedPlanet: PlanetData | undefined = useMemo(() => {
    if (!currentSystem || !currentSystem.planets || currentSystem.planets.length === 0) {
      return undefined;
    }
    if (selectedPlanetId) {
      const found = currentSystem.planets.find((p) => p.id === selectedPlanetId);
      if (found) return found;
    }
    return currentSystem.planets[0];
  }, [currentSystem, selectedPlanetId]);

  // Galactic map coordinate bounds mapping for 2D schematic rendering
  const mapSvgWidth = 840;
  const mapSvgHeight = 560;

  const mapCoordsToSvg = (x: number, z: number, sysId?: string) => {
    const minX = -195000;
    const maxX = 195000;
    const minZ = -235000;
    const maxZ = 15000;

    const normX = Math.max(0, Math.min(1, (x - minX) / (maxX - minX)));
    const normZ = Math.max(0, Math.min(1, (z - minZ) / (maxZ - minZ)));

    const offset = sysId && ASTROMETRIC_NODE_OFFSETS[sysId] ? ASTROMETRIC_NODE_OFFSETS[sysId] : { dx: 0, dy: 0 };

    return {
      sx: 60 + normX * (mapSvgWidth - 120) + offset.dx,
      sy: 55 + normZ * (mapSvgHeight - 105) + offset.dy,
    };
  };

  // Sol system astrometric center for polar concentric circles
  const solPos = useMemo(() => {
    const sol = effectiveSolarSystems.find((s) => s.id === 'sol_system') || effectiveSolarSystems[0];
    if (!sol) return { sx: 390, sy: 295 };
    return mapCoordsToSvg(sol.centerCoordinates[0], sol.centerCoordinates[2], 'sol_system');
  }, [effectiveSolarSystems]);

  // Dynamic ViewBox for SVG based on quadrant focus, zoom level, and pan offset
  const activeViewBox = useMemo(() => {
    let baseMinX = 0;
    let baseMinY = 0;
    let baseW = mapSvgWidth;
    let baseH = mapSvgHeight;

    if (quadrantFocus === 'core') {
      baseMinX = 150;
      baseMinY = 140;
      baseW = 540;
      baseH = 380;
    } else if (quadrantFocus === 'frontiers') {
      baseMinX = 30;
      baseMinY = 20;
      baseW = 680;
      baseH = 380;
    }

    const w = baseW / zoomLevel;
    const h = baseH / zoomLevel;
    const cx = baseMinX + baseW / 2 - panOffset.x;
    const cy = baseMinY + baseH / 2 - panOffset.y;
    const x = cx - w / 2;
    const y = cy - h / 2;

    return `${x} ${y} ${w} ${h}`;
  }, [quadrantFocus, zoomLevel, panOffset, mapSvgWidth, mapSvgHeight]);

  const handleSelectSystem = (sysId: string) => {
    setSelectedSystemId(sysId);
    const sys = effectiveSolarSystems.find((s) => s.id === sysId);
    if (sys && sys.planets && sys.planets.length > 0) {
      setSelectedPlanetId(sys.planets[0].id);
    } else {
      setSelectedPlanetId('');
    }
  };

  const handleSetCourseToSelected = () => {
    if (!currentSystem) return;
    if (selectedPlanet) {
      if (onSetCoordinatesCourse) {
        onSetCoordinatesCourse(
          selectedPlanet.position,
          currentSystem.id,
          selectedWarp,
          selectedPlanet.name
        );
      } else {
        onSetCourse(currentSystem.id, selectedPlanet.id, selectedWarp);
      }
    } else {
      if (onSetCoordinatesCourse) {
        onSetCoordinatesCourse(
          currentSystem.centerCoordinates,
          currentSystem.id,
          selectedWarp,
          currentSystem.primaryStar
        );
      } else {
        onSetCourse(currentSystem.id, undefined, selectedWarp);
      }
    }
    onClose();
  };

  const handleQuickEngage = (systemId: string, planetId?: string) => {
    const sys = effectiveSolarSystems.find((s) => s.id === systemId);
    const planet = sys?.planets?.find((p) => p.id === planetId);
    if (planet && onSetCoordinatesCourse) {
      onSetCoordinatesCourse(planet.position, systemId, selectedWarp, planet.name);
    } else {
      onSetCourse(systemId, planetId, selectedWarp);
    }
    onClose();
  };

  // Filtered planet list for whole manifest
  const allCelestialBodies = useMemo(() => {
    const list: { system: SolarSystem; planet: PlanetData }[] = [];
    effectiveSolarSystems.forEach((sys) => {
      if (sys.planets) {
        sys.planets.forEach((p) => {
          list.push({ system: sys, planet: p });
        });
      }
    });
    return list;
  }, [effectiveSolarSystems]);

  const filteredManifest = useMemo(() => {
    return allCelestialBodies.filter(({ system, planet }) => {
      if (filterType === 'stations' && planet.type !== 'starbase') return false;
      if (filterType === 'planets' && planet.type === 'starbase') return false;
      if (filterType === 'federation' && system.territory !== 'federation') return false;
      if (
        filterType === 'klingon' &&
        system.id !== 'kronos_system' &&
        !system.affiliation?.toLowerCase().includes('klingon')
      )
        return false;
      if (
        filterType === 'romulan' &&
        system.id !== 'romulus_system' &&
        !system.affiliation?.toLowerCase().includes('romulan')
      )
        return false;
      if (
        filterType === 'cardassian' &&
        system.id !== 'cardassia_system' &&
        !system.affiliation?.toLowerCase().includes('cardassian')
      )
        return false;
      if (
        filterType === 'dominion' &&
        !system.quadrant.toLowerCase().includes('gamma') &&
        !system.affiliation?.toLowerCase().includes('dominion')
      )
        return false;
      if (
        filterType === 'delta_borg' &&
        !system.quadrant.toLowerCase().includes('delta') &&
        !system.affiliation?.toLowerCase().includes('borg')
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          planet.name.toLowerCase().includes(q) ||
          system.name.toLowerCase().includes(q) ||
          (planet.description && planet.description.toLowerCase().includes(q)) ||
          planet.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allCelestialBodies, filterType, searchQuery]);

  // Real-time estimated transit duration and astronomical distance (planet.position is already in global 3D scene coordinates)
  const estimatedTransitStats = useMemo(() => {
    const currentPos = shipState
      ? [shipState.position.x, shipState.position.y, shipState.position.z]
      : [0, 25, -1120];
    const targetWorldPos = selectedPlanet
      ? selectedPlanet.position
      : currentSystem.centerCoordinates;

    const sceneDist = Math.hypot(
      targetWorldPos[0] - currentPos[0],
      targetWorldPos[1] - currentPos[1],
      targetWorldPos[2] - currentPos[2]
    );

    return calculateWarpTransitTelemetry(sceneDist, selectedWarp);
  }, [selectedPlanet, shipState, currentSystem, selectedWarp]);

  // Helper to render realistic 3D-lit planet spheres in the left PLANETARY BODIES sidebar
  const renderPlanetThumbnail = (planet: PlanetData) => {
    const solTex = SOL_PLANET_TEXTURES[planet.id];
    const isStation = planet.type === 'starbase';
    const isRinged =
      planet.id === 'sol_saturn' ||
      planet.id === 'sol_uranus' ||
      planet.name.toLowerCase().includes('saturn') ||
      Boolean(planet.ringColor);

    if (isStation) {
      return (
        <div className="relative w-14 h-14 mx-auto mb-2 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 via-blue-700 to-slate-950 border border-sky-400/70 shadow-[0_0_16px_rgba(56,189,248,0.45)] flex items-center justify-center relative overflow-hidden">
            <div className="w-8 h-3 rounded-full border border-cyan-200/80 bg-cyan-400/30" />
            <div className="absolute w-3 h-8 rounded-full border border-cyan-300/60 bg-sky-300/20" />
            <Anchor className="w-4 h-4 text-white relative z-10 drop-shadow" />
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-14 h-14 mx-auto mb-2 flex items-center justify-center">
        {/* Ring back */}
        {isRinged && (
          <div
            className="absolute w-16 h-4 rounded-full border-2 pointer-events-none"
            style={{
              borderColor: planet.ringColor || '#eab308',
              opacity: 0.65,
              transform: 'rotate(-18deg)',
            }}
          />
        )}

        {/* 3D Lit Planet Sphere */}
        <div
          className="w-12 h-12 rounded-full relative overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.85)] border border-white/10"
          style={{
            backgroundColor: planet.textureColor || '#38bdf8',
            backgroundImage: solTex
              ? `url(${solTex})`
              : `radial-gradient(circle at 35% 30%, ${planet.atmosphereColor || '#ffffff'}55 0%, ${
                  planet.textureColor || '#38bdf8'
                } 48%, #020617 95%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Procedural cloud / band striations for non-Sol worlds */}
          {!solTex && (
            <div
              className="absolute inset-0 opacity-45"
              style={{
                background:
                  planet.type === 'gas_giant'
                    ? 'repeating-linear-gradient(165deg, rgba(255,255,255,0.22) 0px, rgba(255,255,255,0.22) 3px, rgba(0,0,0,0.25) 3px, rgba(0,0,0,0.25) 7px)'
                    : 'radial-gradient(circle at 60% 55%, rgba(0,0,0,0.35) 10%, transparent 55%)',
              }}
            />
          )}

          {/* 3D Terminator & Specular Highlight Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.28) 0%, rgba(0,0,0,0.08) 42%, rgba(0,0,0,0.82) 88%, rgba(0,0,0,0.95) 100%)',
            }}
          />
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const isSelectedStation = selectedPlanet?.type === 'starbase';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-1.5 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div className="relative w-[calc(100vw-8px)] sm:w-[calc(100vw-12px)] h-[calc(100vh-8px)] sm:h-[calc(100vh-12px)] max-w-none max-h-none bg-[#040915] border border-[#0ea5e9]/50 rounded-xl shadow-[0_0_50px_rgba(2,132,199,0.35)] flex flex-col overflow-hidden text-slate-100 font-trek transition-all duration-200">
        {/* TOP LCARS HEADER BAR */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#071529] via-[#061020] to-[#040915] border-b border-sky-500/35 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* LCARS Orange Elbow Badge */}
            <div className="flex items-center shrink-0">
              <div className="w-11 h-9 rounded-tl-xl rounded-bl-sm bg-[#f59e0b] flex items-center justify-center text-slate-950 font-black text-xs tracking-wider shadow-inner">
                MAP
              </div>
              <div className="w-3 h-9 bg-[#fbbf24] border-l-2 border-[#040915] rounded-tr-sm rounded-br-sm" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold tracking-wider text-[#38bdf8] uppercase truncate">
                  ASTROMETRICS CARTOGRAPHY // SECTOR & PLANETARY MAP
                </h2>
                <span className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-[#0c2644] text-[#38bdf8] border border-sky-400/40 uppercase font-bold tracking-wider">
                  LCARS 47
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono-nums flex items-center gap-2 truncate mt-0.5">
                <span>
                  SECTOR:{' '}
                  <strong className="text-slate-300 font-normal">
                    {shipState?.currentSystemName || currentSystem.name || 'Sol System (Sector 001)'}
                  </strong>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[#10b981] font-semibold tracking-wide">
                  {shipState?.isDocked
                    ? `⚓ MOORED AT ${shipState.dockedStationName}`
                    : 'FREE FLIGHT TRAJECTORY'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick In-Flight Undock / Dock status */}
            {shipState?.isDocked ? (
              <button
                onClick={onUndock}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-700/40 cursor-pointer"
                title="Release docking clamps and resume impulse cruise [X key]"
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>Undock [X]</span>
              </button>
            ) : shipState?.canDockAtStation ? (
              <button
                onClick={() => onDock?.(shipState.canDockAtStation?.id)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase transition-colors flex items-center gap-1.5 animate-pulse shadow-md shadow-cyan-500/50 cursor-pointer"
                title="Dock starship for 100% hull repair and full photon torpedo reload [X key]"
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>Dock & Repair [X]</span>
              </button>
            ) : null}

            {/* CLOSE MODAL BUTTON */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#091326] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 cursor-pointer"
              title="Close Astrometrics Map"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SECONDARY MODE TABS BAR */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-2 border-b border-slate-800/90 bg-[#050b18] shrink-0 overflow-x-auto nav-scrollbar-x">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('galaxy')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'galaxy'
                  ? 'bg-[#0ea5e9] text-slate-950 shadow-[0_0_15px_rgba(14,165,233,0.4)] font-black'
                  : 'bg-[#091326] text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>GALACTIC SECTOR GRID</span>
            </button>

            <button
              onClick={() => setActiveTab('orbits')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'orbits'
                  ? 'bg-[#0ea5e9] text-slate-950 shadow-[0_0_15px_rgba(14,165,233,0.4)] font-black'
                  : 'bg-[#091326] text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>PLANETARY ORBITS ({currentSystem.name.split('(')[0].split('/')[0].trim().toUpperCase()})</span>
            </button>

            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'manifest'
                  ? 'bg-[#0ea5e9] text-slate-950 shadow-[0_0_15px_rgba(14,165,233,0.4)] font-black'
                  : 'bg-[#091326] text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>CELESTIAL MANIFEST ({allCelestialBodies.length})</span>
            </button>
          </div>

          {/* Right Quick System Selector & Active Course Status */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono-nums text-slate-400 bg-[#091326] px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-sky-400 uppercase font-bold">System:</span>
              <select
                value={selectedSystemId}
                onChange={(e) => handleSelectSystem(e.target.value)}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                {effectiveSolarSystems.map((sys) => (
                  <option key={sys.id} value={sys.id} className="bg-slate-950 text-slate-100">
                    {sys.name}
                  </option>
                ))}
              </select>
            </div>

            {activeCoursePlot && (
              <div className="flex items-center gap-2 text-xs font-mono-nums px-3 py-1 bg-sky-950/80 rounded-lg border border-sky-400/50 text-sky-200">
                <Rocket className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>
                  En route to <strong className="text-white">{activeCoursePlot.targetPlanet.name}</strong>
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-amber-300 font-bold">ETA ~{activeCoursePlot.etaSeconds}s</span>
                <button
                  onClick={onCancelCourse}
                  className="ml-1 text-[10px] px-2 py-0.5 rounded bg-red-600/80 hover:bg-red-500 text-white uppercase font-bold cursor-pointer"
                >
                  Disengage
                </button>
              </div>
            )}
          </div>
        </div>

        {/* THREE-COLUMN INTERACTIVE BODY */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* LEFT & CENTER AREA */}
          <div className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden min-h-0 bg-[#040915]">
            {/* Top Astrometric Control Bar (Always visible above left+center columns, matching reference) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-mono-nums shrink-0">
              {/* Left: SECTOR FOCUS */}
              <div className="flex items-center gap-1 bg-[#081225] p-1 rounded-lg border border-slate-800/90">
                <span className="text-[10px] uppercase text-slate-400 px-2 font-trek tracking-wider">
                  SECTOR FOCUS:
                </span>
                <button
                  onClick={() => {
                    setQuadrantFocus('all');
                    setZoomLevel(1.0);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    quadrantFocus === 'all'
                      ? 'bg-[#0ea5e9] text-slate-950 shadow-[0_0_10px_rgba(14,165,233,0.4)] font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  MILKY WAY
                </button>
                <button
                  onClick={() => {
                    setQuadrantFocus('core');
                    setZoomLevel(1.0);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    quadrantFocus === 'core'
                      ? 'bg-[#0ea5e9] text-slate-950 shadow-[0_0_10px_rgba(14,165,233,0.4)] font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  ALPHA & BETA
                </button>
                <button
                  onClick={() => {
                    setQuadrantFocus('frontiers');
                    setZoomLevel(1.0);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    quadrantFocus === 'frontiers'
                      ? 'bg-[#0ea5e9] text-slate-950 shadow-[0_0_10px_rgba(14,165,233,0.4)] font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  GAMMA & DELTA
                </button>
              </div>

              {/* Right: LAYER TOGGLES & ZOOM */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#081225] p-1 rounded-lg border border-slate-800/90">
                  <button
                    onClick={() => setShowCorridors(!showCorridors)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono-nums uppercase tracking-wider transition-all cursor-pointer ${
                      showCorridors
                        ? 'bg-[#0c2a4d] text-[#38bdf8] border border-sky-500/45 font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    LANES: {showCorridors ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setShowTerritories(!showTerritories)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono-nums uppercase tracking-wider transition-all cursor-pointer ${
                      showTerritories
                        ? 'bg-[#0c2a4d] text-[#38bdf8] border border-sky-500/45 font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    BORDERS: {showTerritories ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setShowAllLabels(!showAllLabels)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono-nums uppercase tracking-wider transition-all cursor-pointer ${
                      showAllLabels
                        ? 'bg-[#091930] text-slate-300 border border-slate-700/80'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    LABELS: {showAllLabels ? 'DETAILS' : 'CLEAN'}
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-[#081225] p-1 rounded-lg border border-slate-800/90">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(2.6, Number((z + 0.2).toFixed(1))))}
                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] px-1.5 font-mono-nums text-[#38bdf8] font-bold min-w-[40px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.2).toFixed(1))))}
                    className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setZoomLevel(1.0);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5 cursor-pointer"
                    title="Reset Astrometric View"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* INNER SPLIT: LEFT PLANETARY BODIES SIDEBAR + CENTER INTERACTIVE CANVAS */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3 overflow-hidden min-h-0">
              {/* LEFT SIDEBAR: PLANETARY BODIES (With Visible Vertical Scrollbar) */}
              <div className="w-full sm:w-[215px] md:w-[230px] rounded-2xl border border-sky-500/35 bg-[#060d1b] flex flex-col overflow-hidden shrink-0 max-h-[210px] sm:max-h-none shadow-inner">
                <div className="px-3 py-2.5 border-b border-slate-800/90 bg-[#081326] flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold tracking-wider uppercase text-[#38bdf8]">
                    PLANETARY BODIES
                  </span>
                  <span className="text-[10px] font-mono-nums px-1.5 py-0.5 rounded bg-sky-950/90 border border-sky-500/30 text-sky-300">
                    {currentSystem.planets?.length || 0}
                  </span>
                </div>

                {/* Compact System Selector inside Left Sidebar for effortless sector switching */}
                <div className="px-2.5 py-1.5 bg-[#050b16] border-b border-slate-800/70 shrink-0">
                  <select
                    value={selectedSystemId}
                    onChange={(e) => handleSelectSystem(e.target.value)}
                    className="w-full bg-[#091428] border border-slate-700/80 rounded-md px-2 py-1 text-[11px] font-mono-nums text-amber-300 font-semibold focus:outline-none focus:border-sky-400 cursor-pointer"
                    title="Switch Star System"
                  >
                    {effectiveSolarSystems.map((sys) => (
                      <option key={sys.id} value={sys.id} className="bg-slate-950 text-slate-100">
                        {sys.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vertical Scrollable Planet Cards List with Visible Scrollbar */}
                <div className="flex-1 overflow-y-auto nav-scrollbar-y p-2.5 space-y-2.5 min-h-0">
                  {currentSystem.planets && currentSystem.planets.length > 0 ? (
                    currentSystem.planets.map((planet) => {
                      const isTarget = selectedPlanet?.id === planet.id;
                      const isStation = planet.type === 'starbase';
                      const shortName = planet.name.split('(')[0].trim();
                      const displayType = isStation
                        ? 'Starbase'
                        : planet.type.replace('_', ' ');

                      return (
                        <div
                          key={planet.id}
                          onClick={() => setSelectedPlanetId(planet.id)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isTarget
                              ? 'bg-[#0b223e]/90 border-[#38bdf8] ring-1 ring-[#38bdf8]/50 shadow-[0_0_16px_rgba(56,189,248,0.22)]'
                              : 'bg-[#091224]/90 border-slate-800/90 hover:border-sky-500/40 hover:bg-[#0b172d]'
                          }`}
                        >
                          {/* 3D Planet Sphere Preview */}
                          {renderPlanetThumbnail(planet)}

                          {/* Bottom Row: Dot + Name/Type on left, WARP button on right */}
                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/25 shadow-sm"
                                style={{ backgroundColor: planet.textureColor || '#38bdf8' }}
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate leading-tight">
                                  {shortName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono-nums capitalize truncate leading-tight">
                                  {displayType}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickEngage(currentSystem.id, planet.id);
                              }}
                              className="px-2 py-1 rounded-md bg-[#0e3a5e] hover:bg-[#0ea5e9] text-[#38bdf8] hover:text-slate-950 border border-[#38bdf8]/45 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm"
                              title={`Plot and engage warp to ${planet.name}`}
                            >
                              <Link2 className="w-2.5 h-2.5" />
                              <span>WARP</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500 font-mono-nums">
                      No planetary bodies cataloged in this sector.
                    </div>
                  )}
                </div>
              </div>

              {/* CENTER INTERACTIVE VIEWPORT */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {activeTab === 'galaxy' && (
                  <div
                    className={`flex-1 relative rounded-xl border border-sky-500/35 bg-[#030814] overflow-hidden flex items-center justify-center shadow-inner min-h-0 ${
                      isDraggingMap ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).closest('[data-node="true"]')) return;
                      setIsDraggingMap(true);
                      dragStartRef.current = {
                        x: e.clientX,
                        y: e.clientY,
                        panX: panOffset.x,
                        panY: panOffset.y,
                      };
                    }}
                    onMouseMove={(e) => {
                      if (!isDraggingMap || !dragStartRef.current) return;
                      const dx = (e.clientX - dragStartRef.current.x) / zoomLevel;
                      const dy = (e.clientY - dragStartRef.current.y) / zoomLevel;
                      setPanOffset({
                        x: Math.max(-280, Math.min(280, dragStartRef.current.panX + dx)),
                        y: Math.max(-220, Math.min(220, dragStartRef.current.panY + dy)),
                      });
                    }}
                    onMouseUp={() => {
                      setIsDraggingMap(false);
                      dragStartRef.current = null;
                    }}
                    onMouseLeave={() => {
                      setIsDraggingMap(false);
                      dragStartRef.current = null;
                    }}
                    onWheel={(e) => {
                      const delta = e.deltaY < 0 ? 0.15 : -0.15;
                      setZoomLevel((z) => Math.max(0.7, Math.min(2.6, Number((z + delta).toFixed(2)))));
                    }}
                  >
                    <svg
                      viewBox={activeViewBox}
                      className="w-full h-full select-none bg-[#030814]"
                    >
                      <defs>
                        <pattern
                          id="astrometricCartesianGrid"
                          width="35"
                          height="35"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 35 0 L 0 0 0 35"
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="0.6"
                            opacity="0.45"
                          />
                        </pattern>

                        <radialGradient id="solCenterGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
                          <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </radialGradient>

                        <path
                          id="polarTelemetryArc"
                          d={`M ${solPos.sx - 155} ${solPos.sy - 30} A 158 158 0 0 1 ${solPos.sx + 155} ${
                            solPos.sy - 30
                          }`}
                        />
                      </defs>

                      {/* Deep Space Background & Fine Cartesian Grid */}
                      <rect x="-400" y="-400" width="1600" height="1400" fill="#030814" />
                      <rect
                        x="-400"
                        y="-400"
                        width="1600"
                        height="1400"
                        fill="url(#astrometricCartesianGrid)"
                      />

                      {/* Subtle Starfield Specks */}
                      {[
                        [85, 70, 1.1, '#94a3b8'],
                        [145, 130, 0.9, '#e2e8f0'],
                        [260, 65, 1.3, '#38bdf8'],
                        [690, 95, 1.2, '#fde047'],
                        [740, 210, 1.0, '#94a3b8'],
                        [650, 440, 1.1, '#38bdf8'],
                        [190, 470, 1.2, '#cbd5e1'],
                        [95, 340, 1.3, '#38bdf8'],
                        [520, 490, 0.9, '#a855f7'],
                        [320, 120, 1.0, '#f8fafc'],
                        [470, 80, 1.2, '#38bdf8'],
                        [770, 380, 1.0, '#fde047'],
                      ].map(([cx, cy, r, col], idx) => (
                        <circle
                          key={`star-${idx}`}
                          cx={Number(cx)}
                          cy={Number(cy)}
                          r={Number(r)}
                          fill={String(col)}
                          opacity="0.55"
                        />
                      ))}

                      {/* POLAR CONCENTRIC ASTROMETRIC CIRCLES & RADIAL AXES (Centered on Sol System) */}
                      <g opacity="0.65">
                        {[55, 105, 158, 212, 268, 328, 395].map((radius, idx) => (
                          <circle
                            key={`polar-r-${radius}`}
                            cx={solPos.sx}
                            cy={solPos.sy}
                            r={radius}
                            fill="none"
                            stroke={idx === 2 ? '#475569' : '#1e293b'}
                            strokeWidth={idx === 2 ? '1.1' : '0.8'}
                            strokeDasharray={idx % 2 === 1 ? '4 3' : undefined}
                          />
                        ))}

                        {/* Radial Polar Rays every 30 degrees */}
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                          const rad = (deg * Math.PI) / 180;
                          const x2 = solPos.sx + Math.cos(rad) * 420;
                          const y2 = solPos.sy + Math.sin(rad) * 420;
                          return (
                            <line
                              key={`ray-${deg}`}
                              x1={solPos.sx}
                              y1={solPos.sy}
                              x2={x2}
                              y2={y2}
                              stroke="#1e293b"
                              strokeWidth="0.7"
                            />
                          );
                        })}

                        {/* Diagonal Astrometric Graduated Tick Ruler (Top-Left to Bottom-Right) */}
                        <line
                          x1={solPos.sx - 280}
                          y1={solPos.sy - 210}
                          x2={solPos.sx + 280}
                          y2={solPos.sy + 210}
                          stroke="#475569"
                          strokeWidth="1"
                        />
                        {Array.from({ length: 45 }).map((_, i) => {
                          const t = (i - 22) * 12;
                          const angle = Math.atan2(210, 280);
                          const px = solPos.sx + Math.cos(angle) * t;
                          const py = solPos.sy + Math.sin(angle) * t;
                          const perpX = -Math.sin(angle) * (i % 5 === 0 ? 5 : 2.5);
                          const perpY = Math.cos(angle) * (i % 5 === 0 ? 5 : 2.5);
                          return (
                            <line
                              key={`tick-${i}`}
                              x1={px - perpX}
                              y1={py - perpY}
                              x2={px + perpX}
                              y2={py + perpY}
                              stroke="#64748b"
                              strokeWidth="0.85"
                            />
                          );
                        })}

                        {/* Curved Astrometric Arc Text */}
                        <text
                          fill="#64748b"
                          fontSize="7.5"
                          fontFamily="monospace"
                          letterSpacing="1.8"
                        >
                          <textPath href="#polarTelemetryArc" startOffset="50%" textAnchor="middle">
                            POLAR CONCENTRIC ASTROMETRIC TELEMETRY PROJECTION
                          </textPath>
                        </text>
                      </g>

                      {/* Astrometric Frame Numbers & Telemetry Readouts */}
                      <g fill="#64748b" fontSize="8" fontFamily="monospace" opacity="0.8">
                        <text x="18" y="20">7410.002</text>
                        <text x="98" y="20">1100</text>
                        <text x="485" y="18">DELTA QUADRANT</text>
                        <text x="588" y="20">3200</text>
                        <text x="15" y="122">430</text>
                        <text x="15" y="232">600</text>
                        <text x="155" y="232">MKIOMNANT</text>
                        <text x="165" y="340" transform="rotate(-90 165 340)">900</text>
                        <text x="598" y="340" transform="rotate(-90 598 340)">633</text>
                        <text x="695" y="140">NONULLANT</text>
                        <text x="645" y="232">MRWIIUULANT</text>
                        <text x="18" y="528">NOOSE: 386</text>
                        <text x="18" y="540">STD: 255</text>
                        <text x="160" y="518">RAD: 885</text>
                        <text x="595" y="520">1100G</text>
                        <text x="795" y="528" textAnchor="end">22G</text>
                        <text x="795" y="540" textAnchor="end">DOSSK. ADSOR. STAN</text>
                      </g>

                      {/* SECTOR NEUTRAL ZONE & EMPIRE TERRITORY BOUNDARIES */}
                      {showTerritories && (
                        <g>
                          {/* The Great Galactic Barrier (Milky Way Rim) */}
                          <path
                            d="M 20 52 Q 420 12, 820 52"
                            fill="none"
                            stroke="#ec4899"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                            opacity="0.85"
                          />
                          <text
                            x="420"
                            y="33"
                            textAnchor="middle"
                            fill="#f472b6"
                            fontSize="10.5"
                            fontWeight="bold"
                            letterSpacing="1.2"
                            stroke="#030814"
                            strokeWidth="3.5"
                            paintOrder="stroke fill"
                          >
                            ⚡ THE GREAT GALACTIC BARRIER // MILKY WAY RIM
                          </text>

                          {/* United Federation of Planets (Sector 001 Core Zone) */}
                          <ellipse
                            cx={solPos.sx - 15}
                            cy={solPos.sy + 60}
                            rx="125"
                            ry="95"
                            fill="rgba(14, 165, 233, 0.07)"
                            stroke="#0ea5e9"
                            strokeWidth="1.3"
                            strokeDasharray="5 4"
                          />
                          <text
                            x={solPos.sx - 15}
                            y={solPos.sy + 142}
                            textAnchor="middle"
                            fill="#38bdf8"
                            fontSize="10"
                            fontWeight="bold"
                            letterSpacing="0.8"
                            stroke="#030814"
                            strokeWidth="3.5"
                            paintOrder="stroke fill"
                          >
                            UNITED FEDERATION (SECTOR 001)
                          </text>
                          <text
                            x={solPos.sx - 15}
                            y={solPos.sy + 162}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="7.5"
                            fontFamily="monospace"
                          >
                            FED 1-40-100 DIES
                          </text>

                          {/* Klingon Empire Zone */}
                          <ellipse
                            cx={solPos.sx + 100}
                            cy={solPos.sy - 10}
                            rx="78"
                            ry="64"
                            fill="rgba(239, 68, 68, 0.07)"
                            stroke="#ef4444"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={solPos.sx + 96}
                            y={solPos.sy - 55}
                            textAnchor="middle"
                            fill="#f87171"
                            fontSize="9.5"
                            fontWeight="bold"
                            stroke="#030814"
                            strokeWidth="3"
                            paintOrder="stroke fill"
                          >
                            KLINGON EMPIRE (Qo&apos;noS)
                          </text>

                          {/* Romulan Star Empire Zone */}
                          <ellipse
                            cx={solPos.sx + 128}
                            cy={solPos.sy + 58}
                            rx="76"
                            ry="55"
                            fill="rgba(16, 185, 129, 0.08)"
                            stroke="#10b981"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                          />

                          {/* Cardassian Union Zone */}
                          <ellipse
                            cx={solPos.sx - 148}
                            cy={solPos.sy + 68}
                            rx="72"
                            ry="68"
                            fill="rgba(245, 158, 11, 0.08)"
                            stroke="#f59e0b"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={solPos.sx - 158}
                            y={solPos.sy + 35}
                            textAnchor="middle"
                            fill="#fbbf24"
                            fontSize="9.5"
                            fontWeight="bold"
                            stroke="#030814"
                            strokeWidth="3"
                            paintOrder="stroke fill"
                          >
                            CARDASSIAN UNION
                          </text>

                          {/* Dominion (Gamma Quadrant) */}
                          <ellipse
                            cx="118"
                            cy="168"
                            rx="65"
                            ry="54"
                            fill="rgba(168, 85, 247, 0.08)"
                            stroke="#a855f7"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="118"
                            y="138"
                            textAnchor="middle"
                            fill="#c084fc"
                            fontSize="9.5"
                            fontWeight="bold"
                            stroke="#030814"
                            strokeWidth="3"
                            paintOrder="stroke fill"
                          >
                            DOMINION (GAMMA)
                          </text>
                          <text
                            x="118"
                            y="102"
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="8"
                            fontFamily="monospace"
                          >
                            GAMMA QUADRANT
                          </text>

                          {/* Borg Space & Delta Frontier */}
                          <ellipse
                            cx="525"
                            cy="118"
                            rx="76"
                            ry="62"
                            fill="rgba(34, 197, 94, 0.08)"
                            stroke="#22c55e"
                            strokeWidth="1.2"
                            strokeDasharray="4 4"
                          />
                          <text
                            x="525"
                            y="68"
                            textAnchor="middle"
                            fill="#4ade80"
                            fontSize="9.5"
                            fontWeight="bold"
                            stroke="#030814"
                            strokeWidth="3"
                            paintOrder="stroke fill"
                          >
                            BORG SPACE & DELTA FRONTIER
                          </text>

                          {/* Quadrant Footer Labels */}
                          <text
                            x="245"
                            y="505"
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="8.5"
                            fontFamily="monospace"
                          >
                            = ALPHA QUADRANT
                          </text>
                          <text
                            x="455"
                            y="505"
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize="8.5"
                            fontFamily="monospace"
                          >
                            BETA QUADRANT =
                          </text>
                        </g>
                      )}

                      {/* ASTROMETRIC GOLDEN TRAJECTORY ARCS & STRATEGIC WARP LANES */}
                      {showCorridors && (
                        <g>
                          {/* Golden sweeping trajectory curves matching reference image */}
                          <path
                            d={`M 45 390 Q 210 470, ${solPos.sx} ${solPos.sy}`}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.1"
                            strokeDasharray="3 3"
                            opacity="0.55"
                          />
                          <path
                            d={`M ${solPos.sx} ${solPos.sy} Q 520 430, 665 495`}
                            fill="none"
                            stroke="#eab308"
                            strokeWidth="1.1"
                            strokeDasharray="3 3"
                            opacity="0.5"
                          />
                          <path
                            d={`M ${solPos.sx} 25 L ${solPos.sx - 18} 510`}
                            fill="none"
                            stroke="#0ea5e9"
                            strokeWidth="1.1"
                            strokeDasharray="4 3"
                            opacity="0.45"
                          />

                          {STRATEGIC_WARP_LANES.map(([sysAId, sysBId]) => {
                            const sysA = effectiveSolarSystems.find((s) => s.id === sysAId);
                            const sysB = effectiveSolarSystems.find((s) => s.id === sysBId);
                            if (!sysA || !sysB) return null;

                            const posA = mapCoordsToSvg(
                              sysA.centerCoordinates[0],
                              sysA.centerCoordinates[2],
                              sysA.id
                            );
                            const posB = mapCoordsToSvg(
                              sysB.centerCoordinates[0],
                              sysB.centerCoordinates[2],
                              sysB.id
                            );

                            const isHighPriority =
                              sysA.id === selectedSystemId ||
                              sysB.id === selectedSystemId ||
                              sysA.id === shipState?.currentSystemId ||
                              sysB.id === shipState?.currentSystemId;

                            return (
                              <line
                                key={`${sysAId}-${sysBId}`}
                                x1={posA.sx}
                                y1={posA.sy}
                                x2={posB.sx}
                                y2={posB.sy}
                                stroke={isHighPriority ? '#38bdf8' : '#334155'}
                                strokeWidth={isHighPriority ? 1.5 : 0.9}
                                strokeDasharray={isHighPriority ? '4 2' : '3 3'}
                                opacity={isHighPriority ? 0.8 : 0.45}
                              />
                            );
                          })}
                        </g>
                      )}

                      {/* INTERACTIVE STAR SYSTEM NODES */}
                      {effectiveSolarSystems.map((sys) => {
                        const { sx, sy } = mapCoordsToSvg(
                          sys.centerCoordinates[0],
                          sys.centerCoordinates[2],
                          sys.id
                        );
                        const isSelected = sys.id === selectedSystemId;
                        const isHere = sys.id === shipState?.currentSystemId;
                        const isHovered = sys.id === hoveredSystemId;
                        const isSol = sys.id === 'sol_system';

                        const starColor =
                          sys.id === 'sol_system'
                            ? '#fde047'
                            : sys.id === 'vulcan_system'
                            ? '#fb923c'
                            : sys.id === 'andoria_system'
                            ? '#38bdf8'
                            : sys.id === 'kronos_system' || sys.id === 'mempa_system'
                            ? '#f87171'
                            : sys.id === 'romulus_system' || sys.id === 'krios_system'
                            ? '#34d399'
                            : sys.id === 'cardassia_system' || sys.id === 'chintoka_system'
                            ? '#fbbf24'
                            : sys.id === 'idran_system' || sys.id === 'omarion_system'
                            ? '#e879f9'
                            : sys.id === 'delta_caretaker_system' || sys.id === 'borg_unicomplex_system'
                            ? '#22d3ee'
                            : '#38bdf8';

                        const displayLabel =
                          sys.id === 'sol_system'
                            ? 'SOL SYSTEM'
                            : sys.id === 'vulcan_system'
                            ? 'VULCAN'
                            : sys.id === 'andoria_system'
                            ? 'ANDORIA'
                            : sys.id === 'kronos_system'
                            ? "Qo'noS"
                            : sys.name.split('/')[0].replace('System', '').trim();

                        return (
                          <g
                            key={sys.id}
                            data-node="true"
                            className="cursor-pointer"
                            onClick={() => handleSelectSystem(sys.id)}
                            onDoubleClick={() => handleQuickEngage(sys.id)}
                            onMouseEnter={() => setHoveredSystemId(sys.id)}
                            onMouseLeave={() => setHoveredSystemId(null)}
                          >
                            {/* Sol Central Sunburst Halo */}
                            {isSol && (
                              <circle
                                cx={sx}
                                cy={sy}
                                r="28"
                                fill="url(#solCenterGlow)"
                              />
                            )}

                            {/* Outer Soft Glow */}
                            <circle
                              cx={sx}
                              cy={sy}
                              r={isSol ? '18' : isSelected || isHovered ? '15' : '11'}
                              fill={starColor}
                              opacity={isSelected || isHovered ? 0.45 : 0.25}
                            />

                            {/* Selected Target Rotating Reticle */}
                            {isSelected && (
                              <circle
                                cx={sx}
                                cy={sy}
                                r="20"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="1.6"
                                strokeDasharray="4 2"
                              >
                                <animateTransform
                                  attributeName="transform"
                                  type="rotate"
                                  from={`0 ${sx} ${sy}`}
                                  to={`360 ${sx} ${sy}`}
                                  dur="8s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            )}

                            {/* Current Ship Position Pulse */}
                            {isHere && (
                              <circle
                                cx={sx}
                                cy={sy}
                                r="24"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="1.4"
                                opacity="0.7"
                              >
                                <animate
                                  attributeName="r"
                                  values="16;28;16"
                                  dur="2.5s"
                                  repeatCount="indefinite"
                                />
                                <animate
                                  attributeName="opacity"
                                  values="0.85;0.15;0.85"
                                  dur="2.5s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            )}

                            {/* 3D Orb Core */}
                            <circle
                              cx={sx}
                              cy={sy}
                              r={isSol ? '9' : isSelected ? '7.5' : '6'}
                              fill={starColor}
                              stroke="#ffffff"
                              strokeWidth={isSelected || isSol ? '1.8' : '1.1'}
                            />

                            {/* Primary Star System Label */}
                            {(showAllLabels || isSelected || isHovered || isHere || isSol) && (
                              <g>
                                <text
                                  x={sx}
                                  y={sy + (isSol ? 20 : 16)}
                                  textAnchor="middle"
                                  fill={
                                    isSol
                                      ? '#fde047'
                                      : isSelected
                                      ? '#38bdf8'
                                      : isHovered
                                      ? '#ffffff'
                                      : '#f1f5f9'
                                  }
                                  fontSize={isSol ? '11' : isSelected ? '10.5' : '9.5'}
                                  fontWeight="bold"
                                  letterSpacing="0.4"
                                  stroke="#030814"
                                  strokeWidth="3.5"
                                  strokeLinejoin="round"
                                  paintOrder="stroke fill"
                                >
                                  {displayLabel}
                                </text>

                                {isSol && (
                                  <text
                                    x={sx}
                                    y={sy + 30}
                                    textAnchor="middle"
                                    fill="#fbbf24"
                                    fontSize="8"
                                    fontFamily="monospace"
                                    stroke="#030814"
                                    strokeWidth="3"
                                    paintOrder="stroke fill"
                                  >
                                    (SECTOR 001)
                                  </text>
                                )}
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                )}

                {activeTab === 'orbits' && (
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="flex items-center justify-between mb-2 px-1 text-xs text-slate-400 font-mono-nums shrink-0">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>
                          ORBITAL SYSTEM VIEW: <strong className="text-white">{currentSystem.name}</strong>
                        </span>
                      </span>
                      <span className="text-sky-300">CLICK ANY PLANET OR STARBASE TO INSPECT</span>
                    </div>

                    <div className="flex-1 relative rounded-xl border border-sky-500/40 bg-[#030814] overflow-hidden flex items-center justify-center p-2 min-h-0">
                      <svg viewBox="0 0 800 460" className="w-full h-full select-none">
                        <defs>
                          <radialGradient id="starCoreOrbital" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* Central Star */}
                        <circle cx="400" cy="230" r="52" fill="url(#starCoreOrbital)" />
                        <circle cx="400" cy="230" r="20" fill="#fef08a" stroke="#ffffff" strokeWidth="2" />
                        <text
                          x="400"
                          y="264"
                          textAnchor="middle"
                          fill="#fde68a"
                          fontSize="10.5"
                          fontWeight="bold"
                          stroke="#020617"
                          strokeWidth="3"
                          paintOrder="stroke fill"
                        >
                          {currentSystem.primaryStar.split('(')[0].trim()}
                        </text>

                        {(() => {
                          const primaryWorlds = currentSystem.planets.filter(
                            (p) => p.type !== 'moon' && p.type !== 'starbase'
                          );
                          const worldPositions = new Map<string, { px: number; py: number }>();

                          return (
                            <>
                              {primaryWorlds.map((world, wIdx) => {
                                const orbitRadius =
                                  75 +
                                  (wIdx + 1) * Math.max(32, Math.min(50, 285 / Math.max(1, primaryWorlds.length)));
                                const isSelected = world.id === selectedPlanet?.id;
                                const angle = (wIdx * 1.45 + 0.5) * Math.PI;
                                const px = 400 + Math.cos(angle) * orbitRadius;
                                const py = 230 + Math.sin(angle) * (orbitRadius * 0.7);
                                worldPositions.set(world.id, { px, py });

                                return (
                                  <ellipse
                                    key={`orbit-${world.id}`}
                                    cx="400"
                                    cy="230"
                                    rx={orbitRadius}
                                    ry={orbitRadius * 0.7}
                                    fill="none"
                                    stroke={isSelected ? '#38bdf8' : '#334155'}
                                    strokeWidth={isSelected ? '1.8' : '0.9'}
                                    strokeDasharray="3 3"
                                    opacity={0.7}
                                  />
                                );
                              })}

                              {currentSystem.planets.map((planet) => {
                                const isSelected = planet.id === selectedPlanet?.id;
                                const isStation = planet.type === 'starbase';
                                const isMoon = planet.type === 'moon';
                                const isGasGiant = planet.type === 'gas_giant';

                                let px = 400;
                                let py = 230;

                                if (isMoon) {
                                  const parentId = planet.parentPlanetId || primaryWorlds[0]?.id;
                                  const parentPos = worldPositions.get(parentId) || { px: 490, py: 230 };
                                  px = parentPos.px + 26;
                                  py = parentPos.py - 18;
                                } else if (isStation) {
                                  const parentId = planet.parentPlanetId || primaryWorlds[0]?.id;
                                  const parentPos = worldPositions.get(parentId) || { px: 490, py: 230 };
                                  px = parentPos.px - 26;
                                  py = parentPos.py + 20;
                                } else {
                                  const pos = worldPositions.get(planet.id);
                                  if (pos) {
                                    px = pos.px;
                                    py = pos.py;
                                  }
                                }

                                return (
                                  <g
                                    key={planet.id}
                                    className="cursor-pointer"
                                    onClick={() => setSelectedPlanetId(planet.id)}
                                    onDoubleClick={() => handleQuickEngage(currentSystem.id, planet.id)}
                                  >
                                    {(isMoon || isStation) && (
                                      <line
                                        x1={
                                          worldPositions.get(planet.parentPlanetId || primaryWorlds[0]?.id)?.px ||
                                          px
                                        }
                                        y1={
                                          worldPositions.get(planet.parentPlanetId || primaryWorlds[0]?.id)?.py ||
                                          py
                                        }
                                        x2={px}
                                        y2={py}
                                        stroke="#38bdf8"
                                        strokeWidth="0.8"
                                        strokeDasharray="2 2"
                                        opacity="0.5"
                                      />
                                    )}

                                    {isSelected && (
                                      <circle
                                        cx={px}
                                        cy={py}
                                        r={isStation ? '18' : isMoon ? '12' : '16'}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="2"
                                        strokeDasharray="3 2"
                                      >
                                        <animateTransform
                                          attributeName="transform"
                                          type="rotate"
                                          from={`0 ${px} ${py}`}
                                          to={`360 ${px} ${py}`}
                                          dur="6s"
                                          repeatCount="indefinite"
                                        />
                                      </circle>
                                    )}

                                    {isStation ? (
                                      <g>
                                        <rect
                                          x={px - 8}
                                          y={py - 8}
                                          width="16"
                                          height="16"
                                          rx="3"
                                          fill="#0284c7"
                                          stroke="#38bdf8"
                                          strokeWidth="1.5"
                                        />
                                        <text
                                          x={px}
                                          y={py + 4}
                                          textAnchor="middle"
                                          fill="#ffffff"
                                          fontSize="10"
                                          fontWeight="bold"
                                        >
                                          ⚓
                                        </text>
                                      </g>
                                    ) : isMoon ? (
                                      <circle
                                        cx={px}
                                        cy={py}
                                        r="5.5"
                                        fill={planet.textureColor || '#94a3b8'}
                                        stroke="#cbd5e1"
                                        strokeWidth="1"
                                      />
                                    ) : (
                                      <circle
                                        cx={px}
                                        cy={py}
                                        r={isGasGiant ? '13' : '9'}
                                        fill={planet.textureColor || '#38bdf8'}
                                        stroke="#f8fafc"
                                        strokeWidth="1.2"
                                      />
                                    )}

                                    <text
                                      x={px}
                                      y={isStation ? py + 16 : isMoon ? py + 13 : py - 13}
                                      textAnchor="middle"
                                      fill={isSelected ? '#38bdf8' : isMoon ? '#94a3b8' : '#e2e8f0'}
                                      fontSize={isMoon ? '8' : '9.5'}
                                      fontWeight={isSelected ? 'bold' : 'normal'}
                                      stroke="#020617"
                                      strokeWidth="3"
                                      paintOrder="stroke fill"
                                    >
                                      {planet.name.split('(')[0].trim()}
                                    </text>
                                  </g>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                )}

                {activeTab === 'manifest' && (
                  <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#050c1a] rounded-xl border border-sky-500/35 p-3">
                    {/* Search & Filter Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search planets, starbases, sectors..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-[#091326] border border-slate-700 rounded-lg text-xs font-trek text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {[
                          { id: 'all', label: 'All Bodies' },
                          { id: 'stations', label: '⚓ Starbases' },
                          { id: 'planets', label: '🪐 Worlds' },
                          { id: 'federation', label: 'Federation' },
                          { id: 'klingon', label: 'Klingon' },
                          { id: 'romulan', label: 'Romulan' },
                          { id: 'cardassian', label: 'Cardassian' },
                          { id: 'dominion', label: 'Dominion' },
                          { id: 'delta_borg', label: 'Delta / Borg' },
                        ].map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setFilterType(f.id as FilterType)}
                            className={`px-2.5 py-1 text-[10px] rounded-md transition-colors uppercase font-bold cursor-pointer ${
                              filterType === f.id
                                ? 'bg-[#0ea5e9] text-slate-950 shadow-sm'
                                : 'bg-[#091326] text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manifest Grid with Visible Vertical Scrollbar */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2.5 overflow-y-auto nav-scrollbar-y pr-1.5 min-h-0">
                      {filteredManifest.map(({ system, planet }) => {
                        const isSelected = planet.id === selectedPlanet?.id;
                        const isStation = planet.type === 'starbase';
                        return (
                          <div
                            key={planet.id}
                            onClick={() => {
                              setSelectedSystemId(system.id);
                              setSelectedPlanetId(planet.id);
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                              isSelected
                                ? 'bg-[#0b223e]/90 border-[#38bdf8] ring-1 ring-[#38bdf8]/50 shadow-md'
                                : 'bg-[#091326]/80 border-slate-800 hover:bg-[#0d1b34] hover:border-slate-700'
                            }`}
                          >
                            <div className="shrink-0 w-14">{renderPlanetThumbnail(planet)}</div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-bold text-white truncate font-trek">
                                  {planet.name}
                                </h4>
                                {isStation && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono font-bold uppercase shrink-0">
                                    Refit Dock
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-amber-300/90 font-mono-nums truncate">
                                {system.name.split('/')[0].trim()} · {planet.type.toUpperCase()}
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                {planet.description}
                              </p>

                              <div className="mt-2 flex items-center justify-end">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickEngage(system.id, planet.id);
                                  }}
                                  className="py-1 px-2.5 rounded-md bg-[#0ea5e9] hover:bg-sky-400 text-slate-950 font-trek font-black text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Rocket className="w-3 h-3" />
                                  <span>ENGAGE WARP</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: TARGET TELEMETRY & COURSE ENGAGEMENT */}
          <div className="w-full lg:w-[340px] xl:w-[360px] bg-[#060d1b] p-4 sm:p-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800/90 font-trek shrink-0 overflow-hidden">
            {/* Top & Scrollable Telemetry Inspector */}
            <div className="flex-1 overflow-y-auto nav-scrollbar-y pr-1 min-h-0">
              {/* Header: TARGET TELEMETRY + Faction Badge */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] font-mono-nums text-[#38bdf8] uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>TARGET TELEMETRY</span>
                </div>

                <span
                  className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    currentSystem?.territory === 'federation'
                      ? 'bg-[#091e38] border-sky-500/45 text-[#38bdf8]'
                      : 'bg-red-950/70 border-red-500/50 text-red-300'
                  }`}
                >
                  {currentSystem?.territory === 'federation' ? 'FEDERATION' : 'FRONTIER'}
                </span>
              </div>

              {/* Target Title & System Name */}
              <div className="pb-3.5 mb-3.5 border-b border-slate-800/90">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide leading-snug">
                  {selectedPlanet ? selectedPlanet.name : currentSystem?.name || 'Sector View'}
                </h3>
                <div className="text-xs text-slate-400 font-mono-nums mt-1">
                  System: <span className="text-[#fbbf24] font-semibold">{currentSystem?.name || 'Sol System (Sector 001)'}</span>
                </div>
              </div>

              {/* Starbase Refit Capabilities Banner (when a starbase is selected) */}
              {isSelectedStation && (
                <div className="mb-3.5 p-3 rounded-xl bg-gradient-to-br from-cyan-950/80 to-blue-950/90 border border-cyan-400/70 text-xs shadow-lg">
                  <div className="flex items-center gap-2 mb-1 font-bold text-cyan-300 uppercase tracking-wide">
                    <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                    <span>STARSHIP REPAIR & REARM FACILITY</span>
                  </div>
                  <p className="text-[11px] text-cyan-100/90 leading-relaxed font-mono-nums">
                    Certified Constitution-class berth. Full hull restoration (100%), shield recharge, and photon torpedo reload (30/30) upon docking.
                  </p>
                </div>
              )}

              {/* Key-Value Telemetry Table matching reference */}
              <div className="space-y-1 text-xs font-mono-nums mb-4">
                <div className="flex items-center justify-between py-2.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Classification:</span>
                  <span className="text-white font-bold uppercase tracking-wider">
                    {selectedPlanet
                      ? selectedPlanet.type.replace('_', ' ').toUpperCase()
                      : currentSystem?.spectralType || 'STAR'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Primary Star:</span>
                  <span className="text-[#fbbf24] font-semibold text-right">
                    {currentSystem?.primaryStar || 'Sol (Yellow Dwarf G2V)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Target Radius:</span>
                  <span className="text-white font-semibold">
                    {selectedPlanet ? `${selectedPlanet.radius * 100} km` : '696,340 km'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="text-slate-200 font-semibold">
                    {selectedPlanet
                      ? `[${selectedPlanet.position.join(', ')}]`
                      : `[${
                          currentSystem?.centerCoordinates
                            ? currentSystem.centerCoordinates.join(', ')
                            : '0, 0, 0'
                        }]`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-slate-800/80">
                  <span className="text-slate-400">Astrometric Range:</span>
                  <span className="text-[#38bdf8] font-bold">
                    {estimatedTransitStats.astronomicalReadout}
                  </span>
                </div>
              </div>

              {/* Description / Planetary Lore Box */}
              <div className="p-3.5 rounded-xl bg-[#091326]/90 border border-slate-800/90 text-xs text-slate-300 leading-relaxed font-sans shadow-inner">
                {selectedPlanet ? selectedPlanet.description : currentSystem?.description || ''}
              </div>
            </div>

            {/* BOTTOM ACTION DOCK: WARP FACTOR, EST. FLIGHT DURATION & ENGAGE BUTTON */}
            <div className="space-y-2.5 pt-3.5 mt-3 border-t border-slate-800/90 shrink-0">
              {/* Warp Factor Selector Row */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#081224] border border-slate-800/90">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#38bdf8] uppercase font-bold tracking-wider">
                    <Rocket className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>WARP FACTOR:</span>
                  </div>
                  <span className="text-[10px] font-mono-nums text-sky-300 font-bold">
                    {estimatedTransitStats.auPerSec.toFixed(2)} AU/s ({estimatedTransitStats.gmPerSec.toFixed(1)} Gm/s)
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {[4, 5, 6, 7, 8, 9, 9.9].map((w) => {
                    const isActive = Math.abs(selectedWarp - w) < 0.15;
                    return (
                      <button
                        key={w}
                        onClick={() => setSelectedWarp(w)}
                        className={`py-1 text-[10px] font-mono-nums rounded-md border transition-all cursor-pointer text-center ${
                          isActive
                            ? 'bg-[#0ea5e9] text-slate-950 font-black border-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.5)]'
                            : 'bg-[#050b16] text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {w === 9.9 ? '9.9' : `W${w}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Est. Flight Duration Row */}
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#081224] border border-slate-800/90 text-xs font-mono-nums">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Rocket className="w-3.5 h-3.5 text-[#fbbf24]" />
                  <span className="font-trek uppercase text-[10px] font-bold tracking-wider text-slate-400">
                    EST. FLIGHT DURATION:
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#fbbf24] font-black text-xs">
                    {estimatedTransitStats.formattedEta}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({estimatedTransitStats.distAu.toFixed(2)} AU · {estimatedTransitStats.compactDistanceKm} at W{selectedWarp.toFixed(1)})
                  </span>
                </div>
              </div>

              {/* Primary Engage Course CTA Button */}
              <button
                onClick={handleSetCourseToSelected}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0ea5e9] via-[#22d3ee] to-[#0ea5e9] hover:from-[#38bdf8] hover:to-[#67e8f9] text-slate-950 font-black uppercase tracking-wider text-xs transition-all shadow-[0_0_22px_rgba(14,165,233,0.45)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Rocket className="w-4 h-4 stroke-[2.5]" />
                <span>
                  ENGAGE COURSE TO{' '}
                  {(selectedPlanet
                    ? selectedPlanet.name.split('(')[0].trim()
                    : currentSystem?.name
                    ? currentSystem.name.split('/')[0].trim()
                    : 'DESTINATION'
                  ).toUpperCase()}
                </span>
              </button>

              {/* Disengage Button when a course is currently active */}
              {activeCoursePlot && (
                <button
                  onClick={onCancelCourse}
                  className="w-full py-1.5 px-3 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-bold uppercase tracking-wider text-[11px] transition-colors cursor-pointer"
                >
                  DISENGAGE ACTIVE COURSE (ALL STOP)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
