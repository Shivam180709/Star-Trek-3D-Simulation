import React, { useState, useMemo } from 'react';
import { SolarSystem, PlanetData, CoursePlot, ShipState } from '../types/simulation';
import {
  STAR_TREK_SOLAR_SYSTEMS,
  calculateSafeCoordinates,
} from '../three/solarSystems';
import {
  formatAstronomicalDistance,
  calculateWarpTransitTelemetry,
  SCENE_UNITS_PER_AU,
} from '../utils/scaleFormatters';
import {
  X,
  Navigation,
  Compass,
  Globe,
  CheckCircle2,
  Rocket,
  Shield,
  MapPin,
  Crosshair,
  Lock,
  Activity,
} from 'lucide-react';

interface NavigationConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  solarSystems: SolarSystem[];
  shipState?: ShipState | null;
  activeCoursePlot: CoursePlot | null;
  currentSystemId: string;
  currentWarpFactor?: number;
  onSetWarpFactor?: (factor: number) => void;
  onSetCourse: (systemId: string, planetId?: string, warpFactor?: number) => void;
  onSetCoordinatesCourse?: (
    coords: [number, number, number],
    systemId?: string,
    warpFactor?: number,
    label?: string
  ) => void;
  onCancelCourse: () => void;
}

const SOL_PLANET_TEXTURES: Record<string, string> = {
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

export const NavigationConsole: React.FC<NavigationConsoleProps> = ({
  isOpen,
  onClose,
  solarSystems,
  shipState,
  activeCoursePlot,
  currentSystemId,
  currentWarpFactor = 6.0,
  onSetWarpFactor,
  onSetCourse,
  onSetCoordinatesCourse,
  onCancelCourse,
}) => {
  // Navigation Mode: 'systems' (Planetary Catalog) or 'coords' (Universal 3D Coordinates)
  const [navMode, setNavMode] = useState<'systems' | 'coords'>('systems');

  // Solar system & planet selection state
  const [selectedSystemId, setSelectedSystemId] = useState<string>(currentSystemId || 'sol_system');
  const [selectedPlanetId, setSelectedPlanetId] = useState<string>('');
  const [selectedWarpFactor, setSelectedWarpFactor] = useState<number>(currentWarpFactor);
  const [navTerritory, setNavTerritory] = useState<
    'all' | 'federation' | 'klingon' | 'romulan' | 'cardassian' | 'frontier'
  >('all');

  // Interactive scanning & calibration states
  const [scanMode, setScanMode] = useState<'active' | 'deep' | 'prog'>('active');
  const [selectedTelemetryNode, setSelectedTelemetryNode] = useState<number>(8);
  const [orbitalZoomScale, setOrbitalZoomScale] = useState<number>(1.0);
  const [calibrationTrim, setCalibrationTrim] = useState<number>(68);

  // Custom 3D coordinates input state
  const [coordX, setCoordX] = useState<string>('-450');
  const [coordY, setCoordY] = useState<string>('15');
  const [coordZ, setCoordZ] = useState<string>('-600');
  const [coordLabel, setCoordLabel] = useState<string>('');

  const effectiveSolarSystems = useMemo(() => {
    return solarSystems && solarSystems.length > 0 ? solarSystems : STAR_TREK_SOLAR_SYSTEMS;
  }, [solarSystems]);

  const filteredSystems = useMemo(() => {
    return effectiveSolarSystems.filter((sys) => {
      if (navTerritory === 'federation') return sys.territory === 'federation';
      if (navTerritory === 'klingon')
        return sys.affiliation?.toLowerCase().includes('klingon') || sys.id === 'kronos_system';
      if (navTerritory === 'romulan')
        return sys.affiliation?.toLowerCase().includes('romulan') || sys.id === 'romulus_system';
      if (navTerritory === 'cardassian')
        return sys.affiliation?.toLowerCase().includes('cardassian') || sys.id === 'cardassia_system';
      if (navTerritory === 'frontier')
        return (
          !sys.territory ||
          (sys.territory !== 'federation' &&
            !sys.affiliation?.toLowerCase().includes('klingon') &&
            !sys.affiliation?.toLowerCase().includes('romulan') &&
            !sys.affiliation?.toLowerCase().includes('cardassian'))
        );
      return true;
    });
  }, [effectiveSolarSystems, navTerritory]);

  const currentSystem = useMemo(() => {
    return (
      effectiveSolarSystems.find((s) => s.id === selectedSystemId) ||
      effectiveSolarSystems[0] ||
      STAR_TREK_SOLAR_SYSTEMS[0]
    );
  }, [effectiveSolarSystems, selectedSystemId]);

  const activePlanet = useMemo((): PlanetData | undefined => {
    if (!currentSystem?.planets || currentSystem.planets.length === 0) return undefined;
    if (selectedPlanetId) {
      const found = currentSystem.planets.find((p) => p.id === selectedPlanetId);
      if (found) return found;
    }
    return currentSystem.planets[0];
  }, [currentSystem, selectedPlanetId]);

  // Parse entered custom coordinates
  const parsedCoords = useMemo((): [number, number, number] => {
    const x = parseFloat(coordX) || 0;
    const y = parseFloat(coordY) || 0;
    const z = parseFloat(coordZ) || 0;
    return [Math.round(x), Math.round(y), Math.round(z)];
  }, [coordX, coordY, coordZ]);

  // Target coordinates depending on mode
  const targetCoordinates = useMemo((): [number, number, number] => {
    if (navMode === 'coords') return parsedCoords;
    return activePlanet ? activePlanet.position : currentSystem.centerCoordinates;
  }, [navMode, parsedCoords, activePlanet, currentSystem]);

  // Real-time automatic collision safety evaluation for the active destination
  const activeSafety = useMemo(() => {
    const shipPosTuple: [number, number, number] = shipState
      ? [shipState.position.x, shipState.position.y, shipState.position.z]
      : [0, 25, -1120];
    const sysId = currentSystem ? currentSystem.id : 'sol_system';
    return calculateSafeCoordinates(targetCoordinates, shipPosTuple, sysId, 140);
  }, [targetCoordinates, shipState, currentSystem]);

  // Detailed multi-unit transit telemetry (AU, Gm, Mm, km, ETA)
  const transitTelemetry = useMemo(() => {
    const currentPos = shipState
      ? [shipState.position.x, shipState.position.y, shipState.position.z]
      : [0, 25, -1120];

    // All planet positions in STAR_TREK_SOLAR_SYSTEMS are already in universal 3D scene coordinates
    const targetWorldPos: [number, number, number] =
      navMode === 'coords'
        ? activeSafety.safePos
        : activePlanet
        ? activePlanet.position
        : currentSystem.centerCoordinates;

    const sceneDist = Math.hypot(
      targetWorldPos[0] - currentPos[0],
      targetWorldPos[1] - currentPos[1],
      targetWorldPos[2] - currentPos[2]
    );

    return calculateWarpTransitTelemetry(sceneDist, selectedWarpFactor);
  }, [activePlanet, shipState, currentSystem, selectedWarpFactor, navMode, activeSafety]);

  // Presets of all universal celestial bodies in the currently selected system
  const systemPresets = useMemo(() => {
    const presets: { label: string; coords: [number, number, number]; type: string }[] = [];
    if (!currentSystem) return presets;

    presets.push({
      label: `${currentSystem.primaryStar} (Primary Star)`,
      coords: currentSystem.centerCoordinates,
      type: 'star',
    });

    for (const p of currentSystem.planets) {
      presets.push({
        label: p.name,
        coords: p.position,
        type: p.type,
      });
    }
    return presets;
  }, [currentSystem]);

  // Compute 2D orbital map positions for all planets in currentSystem
  const orbitalDiagramData = useMemo(() => {
    const planets = currentSystem?.planets || [];
    const maxDist = Math.max(
      1800,
      ...planets.map((p) => Math.hypot(p.position[0], p.position[2]))
    );

    return planets.map((p, idx) => {
      const rawDist = Math.hypot(p.position[0], p.position[2]);
      const angle = Math.atan2(p.position[2], p.position[0]);
      // Normalized radius between 0.16 and 0.92 so inner and outer orbits are clearly spaced
      const normR = Math.min(
        0.94,
        0.16 + ((idx + 1) / Math.max(planets.length, 1)) * 0.52 + (rawDist / maxDist) * 0.26
      );
      const rx = normR * 175 * orbitalZoomScale;
      const ry = normR * 105 * orbitalZoomScale;
      const px = 220 + Math.cos(angle) * rx;
      const py = 148 + Math.sin(angle) * ry;
      const standoffAu = Math.max(1.25, ((p.radius || 25) * 2.5 + 140) / SCENE_UNITS_PER_AU);

      return {
        planet: p,
        rx,
        ry,
        px,
        py,
        angle,
        standoffAu,
      };
    });
  }, [currentSystem, orbitalZoomScale]);

  if (!isOpen) return null;

  const handleWarpChange = (wf: number) => {
    const clamped = Math.max(1.0, Math.min(9.9, Number(wf.toFixed(1))));
    setSelectedWarpFactor(clamped);
    onSetWarpFactor?.(clamped);
  };

  const handleEngageCourse = () => {
    if (navMode === 'coords') {
      if (onSetCoordinatesCourse) {
        onSetCoordinatesCourse(
          parsedCoords,
          currentSystem.id,
          selectedWarpFactor,
          coordLabel || undefined
        );
      } else {
        onSetCourse(currentSystem.id, activePlanet?.id, selectedWarpFactor);
      }
    } else {
      onSetCourse(currentSystem.id, activePlanet?.id, selectedWarpFactor);
    }
    onClose();
  };

  const handleSelectPlanetCard = (planet: PlanetData) => {
    setSelectedPlanetId(planet.id);
    setCoordX(planet.position[0].toString());
    setCoordY(planet.position[1].toString());
    setCoordZ(planet.position[2].toString());
    setCoordLabel(planet.name);
  };

  const handleSelectPreset = (coords: [number, number, number], name: string) => {
    setCoordX(coords[0].toString());
    setCoordY(coords[1].toString());
    setCoordZ(coords[2].toString());
    setCoordLabel(name);
  };

  const activeOrbitalTarget =
    orbitalDiagramData.find((d) => d.planet.id === activePlanet?.id) || orbitalDiagramData[0];

  // Ship icon position in orbital diagram
  const shipDiagramPos = { x: 185, y: 138 };
  const targetDiagramPos = activeOrbitalTarget
    ? { x: activeOrbitalTarget.px, y: activeOrbitalTarget.py }
    : { x: 310, y: 195 };

  // Curved Bezier control point for the cyan orbital trajectory
  const curveCtrlX = (shipDiagramPos.x + targetDiagramPos.x) * 0.5 + 28;
  const curveCtrlY = Math.max(shipDiagramPos.y, targetDiagramPos.y) + 46;

  // Target display title for the big CTA banner
  const targetBannerTitle =
    navMode === 'coords'
      ? coordLabel
        ? `${coordLabel.toUpperCase()} [${parsedCoords.join(', ')}]`
        : `COORDINATES [${parsedCoords.join(', ')}]`
      : (activePlanet?.name || currentSystem.name).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-1 sm:p-1.5 select-none">
      {/* Outer Console Frame with Very Slim Boundary & Visible Vertical Scrollbar */}
      <div className="relative w-[calc(100vw-8px)] sm:w-[calc(100vw-12px)] h-[calc(100vh-8px)] sm:h-[calc(100vh-12px)] max-w-none max-h-none overflow-y-auto nav-scrollbar-y bg-[#050b16] border border-sky-500/50 rounded-xl shadow-[0_0_50px_rgba(14,165,233,0.28)] text-slate-100 flex flex-col p-3 sm:p-4 gap-3">
        {/* ===================================================================
            1. TOP HEADER BAR: SCANNING TAGS, TITLE & STARDATE CALIBRATION
           =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-500/40">
          {/* Left Interactive Scanning Status Matrix */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setScanMode('active')}
                className={`px-2.5 py-0.5 rounded text-[10px] font-trek font-bold uppercase tracking-wider border transition-colors ${
                  scanMode === 'active'
                    ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                SCANNING
              </button>
              <button
                onClick={() => setScanMode('deep')}
                className={`px-2.5 py-0.5 rounded text-[10px] font-trek font-bold uppercase tracking-wider border transition-colors ${
                  scanMode === 'deep'
                    ? 'bg-sky-950/90 text-sky-300 border-sky-400/60'
                    : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                SUBSPACE FITTING
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setScanMode('prog')}
                className="px-2.5 py-0.5 rounded text-[10px] font-trek font-bold uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.45)]"
              >
                SCANNING
              </button>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono-nums uppercase tracking-wider bg-slate-900/90 text-slate-300 border border-slate-700">
                SCAN: PROG
              </span>
            </div>
          </div>

          {/* Center Title */}
          <div className="text-center flex-1 min-w-[260px]">
            <h1 className="text-xl sm:text-3xl font-trek font-extrabold uppercase tracking-[0.12em] text-sky-400 drop-shadow-[0_0_14px_rgba(56,189,248,0.45)]">
              NAVIGATION & TARGET COURSE PLOTTER
            </h1>
          </div>

          {/* Right Stardate, Calibration & Close Button */}
          <div className="flex items-center gap-3">
            <div className="text-right font-mono-nums text-[11px] leading-tight">
              <div className="text-slate-100 font-bold tracking-wider">
                STARDATE: {shipState?.stardate || '5427-1F21'}
              </div>
              <div className="text-slate-400">
                CALIBRATION: <span className="text-sky-300">{calibrationTrim} mm</span>
              </div>
              <div className="text-amber-400 font-semibold">
                CALIBRATION: {(selectedWarpFactor * 0.012).toFixed(3)} rm
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900/90 hover:bg-red-600/80 border border-slate-700 hover:border-red-400 text-slate-300 hover:text-white transition-all"
              title="Close Navigation & Target Course Plotter [N / Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Course Plot Banner (if currently warping) */}
        {activeCoursePlot && (
          <div className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-sky-950/90 via-slate-900 to-amber-950/60 border border-sky-400/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Rocket className="w-4 h-4 text-sky-400 animate-pulse" />
              <span className="font-trek font-bold uppercase tracking-wider text-sky-300">
                ACTIVE WARP COURSE LOCKED:
              </span>
              <span className="text-white font-bold">{activeCoursePlot.targetSystem.name}</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-300 font-semibold">{activeCoursePlot.targetPlanet.name}</span>
              <span className="font-mono-nums text-sky-200 text-[11px] ml-2">
                ({formatAstronomicalDistance(activeCoursePlot.distance, 'standard')} · ETA ~{activeCoursePlot.etaSeconds}s)
              </span>
            </div>
            <button
              onClick={onCancelCourse}
              className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-trek font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
            >
              Disengage Course (All Stop)
            </button>
          </div>
        )}

        {/* ===================================================================
            2. UPPER SPLIT GRID: PLANETARY CATALOG (LEFT) & ORBITAL ROUTE (RIGHT)
           =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* LEFT COLUMN (5 Cols): PLANETARY CATALOG / UNIVERSAL 3D COORDS */}
          <div className="lg:col-span-5 bg-[#081121]/95 border border-slate-800/90 rounded-xl p-3 flex flex-col gap-2.5 shadow-inner">
            {/* Mode Switcher: Planetary Catalog vs Universal 3D Coords */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNavMode('systems')}
                className={`py-2 px-3 rounded-lg text-xs font-trek uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 border ${
                  navMode === 'systems'
                    ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.45)]'
                    : 'bg-[#0b1629] text-slate-300 hover:text-white border-slate-700/80'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>PLANETARY CATALOG</span>
              </button>
              <button
                onClick={() => setNavMode('coords')}
                className={`py-2 px-3 rounded-lg text-xs font-trek uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 border ${
                  navMode === 'coords'
                    ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.45)]'
                    : 'bg-[#0b1629] text-slate-300 hover:text-white border-slate-700/80'
                }`}
              >
                <Crosshair className="w-4 h-4" />
                <span>UNIVERSAL 3D COORDS</span>
              </button>
            </div>

            {/* Sector Filter Strip (with Visible Horizontal Scrollbar) */}
            <div className="flex items-center gap-1.5 overflow-x-auto nav-scrollbar-x pb-1.5">
              {[
                { id: 'all', label: 'ALL SECTORS' },
                { id: 'federation', label: 'FEDERATION' },
                { id: 'klingon', label: 'KLINGON' },
                { id: 'romulan', label: 'ROMULAN' },
                { id: 'cardassian', label: 'CARDASSIAN' },
                { id: 'frontier', label: 'DEEP SPACE' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setNavTerritory(t.id as any)}
                  className={`px-2.5 py-1 rounded text-[11px] font-trek font-bold uppercase tracking-wider whitespace-nowrap border transition-colors ${
                    navTerritory === t.id
                      ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-sm'
                      : 'bg-[#0c182d] text-slate-300 hover:text-white border-slate-700/80'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Star System Selection Strip (with Visible Horizontal Scrollbar) */}
            <div className="flex items-center gap-1.5 overflow-x-auto nav-scrollbar-x pb-1.5">
              {filteredSystems.map((sys) => {
                const isSelected = sys.id === currentSystem.id;
                const isHere = sys.id === currentSystemId;
                const isFed = sys.territory === 'federation';

                return (
                  <button
                    key={sys.id}
                    onClick={() => {
                      setSelectedSystemId(sys.id);
                      setSelectedPlanetId('');
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-sky-500 text-slate-950 font-bold border-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                        : 'bg-[#0c182d] border-slate-700/80 text-slate-300 hover:text-white hover:border-sky-500/50'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {sys.id === 'sol_system'
                        ? 'Sol System (Sector 001)'
                        : sys.name.split('/')[0].trim()}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono-nums font-bold uppercase ${
                        isFed
                          ? isSelected
                            ? 'bg-slate-900 text-sky-300'
                            : 'bg-sky-950 text-sky-400 border border-sky-500/40'
                          : isSelected
                          ? 'bg-slate-900 text-amber-300'
                          : 'bg-red-950 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {isFed ? 'FED' : 'NON-FED'}
                    </span>
                    {isHere && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]"
                        title="Current Starship Sector"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* SCROLLABLE PLANETARY CARDS OR 3D COORDINATES WORKSTATION (Visible Vertical Scrollbar) */}
            <div className="h-[340px] overflow-y-auto nav-scrollbar-y pr-2 space-y-2.5">
              {navMode === 'systems' ? (
                currentSystem.planets.map((planet) => {
                  const isTarget = activePlanet?.id === planet.id;
                  const texUrl = SOL_PLANET_TEXTURES[planet.id];
                  const standoffAu = Math.max(
                    1.25,
                    ((planet.radius || 25) * 2.5 + 140) / SCENE_UNITS_PER_AU
                  ).toFixed(2);

                  return (
                    <div
                      key={planet.id}
                      onClick={() => handleSelectPlanetCard(planet)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isTarget
                          ? 'bg-[#0c1d36]/95 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.28)]'
                          : 'bg-[#091324]/90 border-slate-800 hover:border-sky-500/50 hover:bg-[#0b172b]'
                      }`}
                    >
                      {/* Card Header: Dot + Planet Name + Classification */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30 shadow-sm"
                            style={{ backgroundColor: planet.textureColor }}
                          />
                          <h4 className="text-sm font-trek font-bold text-white truncate">
                            {planet.name}
                          </h4>
                        </div>
                        <span className="text-xs font-trek font-bold uppercase tracking-wider text-sky-400 shrink-0">
                          {planet.type.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Subheader: Coordinates, Distance & Radius */}
                      <div className="flex items-center justify-between text-xs font-mono-nums text-slate-300 mb-2">
                        <span>Coordinates: [{planet.position.join(', ')}]</span>
                        <span className="text-amber-300 font-semibold">
                          Dist: {formatAstronomicalDistance(
                            Math.hypot(
                              planet.position[0] - (shipState?.position.x ?? 0),
                              planet.position[1] - (shipState?.position.y ?? 25),
                              planet.position[2] - (shipState?.position.z ?? -1120)
                            ),
                            'compact'
                          )}
                        </span>
                      </div>

                      {/* Dual Visual Box + Center Telemetry Column (Matches Reference Image) */}
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Left Visual: Planet Optical / Surface Sphere Render */}
                        <div className="col-span-5 h-24 rounded-lg bg-[#040912] border border-slate-800/90 relative overflow-hidden flex items-center justify-center">
                          <div
                            className="w-16 h-16 rounded-full relative shadow-[inset_-8px_-8px_16px_rgba(0,0,0,0.85),0_0_16px_rgba(56,189,248,0.2)]"
                            style={{
                              backgroundColor: planet.textureColor,
                              backgroundImage: texUrl ? `url(${texUrl})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {/* Subtle spherical mesh overlay */}
                            <div className="absolute inset-0 rounded-full border border-white/20 bg-gradient-to-tr from-black/65 via-transparent to-white/15" />
                          </div>
                          {/* Vector Axis Arrow */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 120 90">
                            <line
                              x1="60"
                              y1="45"
                              x2="98"
                              y2="20"
                              stroke="#38bdf8"
                              strokeWidth="1.4"
                              strokeDasharray="2 2"
                            />
                            <polygon points="98,20 91,21 95,26" fill="#38bdf8" />
                          </svg>
                        </div>

                        {/* Middle Column: Coordinate & Standoff Telemetry Readout */}
                        <div className="col-span-2 text-right font-mono-nums text-[10px] leading-tight text-slate-400 pr-1">
                          <div className="text-slate-300 font-bold">COD</div>
                          <div>{planet.position[0]}</div>
                          <div>{planet.radius}</div>
                          <div>{planet.position[1]}</div>
                          <div>{planet.position[2]}</div>
                          <div className="text-slate-300 font-bold mt-1">OGOS</div>
                          <div>-{Math.abs(planet.position[1]) || 25}</div>
                          <div>-00</div>
                        </div>

                        {/* Right Visual: 3D Wireframe Globe & Orbital Vector SVG */}
                        <div className="col-span-5 flex flex-col">
                          <div className="h-20 rounded-lg bg-[#040912] border border-slate-800/90 relative overflow-hidden flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 130 84">
                              {/* Equatorial Orbital Ring */}
                              <ellipse
                                cx="65"
                                cy="44"
                                rx="48"
                                ry="16"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="1.2"
                                strokeOpacity="0.75"
                                transform="rotate(-14 65 44)"
                              />
                              {/* Wireframe Sphere */}
                              <circle
                                cx="65"
                                cy="44"
                                r="25"
                                fill="rgba(14,165,233,0.08)"
                                stroke="#38bdf8"
                                strokeWidth="1.2"
                              />
                              <ellipse
                                cx="65"
                                cy="44"
                                rx="25"
                                ry="9"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="0.8"
                                strokeOpacity="0.65"
                              />
                              <ellipse
                                cx="65"
                                cy="44"
                                rx="11"
                                ry="25"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="0.8"
                                strokeOpacity="0.65"
                              />
                              {/* North Polar Axis & Tangent Vector */}
                              <line x1="65" y1="44" x2="65" y2="8" stroke="#facc15" strokeWidth="1.4" />
                              <polygon points="65,6 62,12 68,12" fill="#facc15" />
                              <line x1="65" y1="44" x2="104" y2="52" stroke="#38bdf8" strokeWidth="1.4" />
                              <polygon points="106,52 99,49 100,55" fill="#38bdf8" />
                            </svg>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono-nums mt-1 px-0.5">
                            <span className="text-amber-400 font-bold uppercase">SAFE STANDOFF:</span>
                            <span className="text-amber-300 font-bold">{standoffAu} AU</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* UNIVERSAL 3D COORDINATES MODE */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#0b182e] border border-cyan-500/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-trek font-bold uppercase text-cyan-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-cyan-400" /> Direct 3D Vector Input
                      </span>
                      <span className="text-[10px] font-mono-nums text-slate-400">
                        Sector: {currentSystem.name.split('/')[0]}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-mono-nums">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-0.5">
                          X Coord
                        </label>
                        <input
                          type="number"
                          value={coordX}
                          onChange={(e) => setCoordX(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-0.5">
                          Y Coord
                        </label>
                        <input
                          type="number"
                          value={coordY}
                          onChange={(e) => setCoordY(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase mb-0.5">
                          Z Coord
                        </label>
                        <input
                          type="number"
                          value={coordZ}
                          onChange={(e) => setCoordZ(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={coordLabel}
                      onChange={(e) => setCoordLabel(e.target.value)}
                      placeholder="Optional Waypoint Label (e.g. High-Orbit Science Point)"
                      className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
                    />

                    <div className="text-[11px] font-mono-nums text-emerald-300 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Safe Standoff Vector:</span>
                      <span className="font-bold">[{activeSafety.safePos.join(', ')}]</span>
                    </div>
                  </div>

                  {/* Clickable System Coordinate Presets */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-trek uppercase font-bold text-sky-400">
                      Quick Sector Presets (Click to Load Coordinates)
                    </div>
                    {systemPresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleSelectPreset(preset.coords, preset.label)}
                        className="w-full p-2.5 rounded-lg bg-[#091324] border border-slate-800 hover:border-cyan-400/70 text-left flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{preset.label}</div>
                          <div className="text-[10px] uppercase text-slate-400">{preset.type}</div>
                        </div>
                        <span className="font-mono-nums text-xs text-cyan-300">
                          [{preset.coords.join(', ')}]
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (7 Cols): INTERACTIVE SYSTEM ORBITAL ROUTE DIAGRAM */}
          <div className="lg:col-span-7 bg-[#071020]/95 border border-amber-500/35 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden shadow-inner">
            {/* Corner Bracket Accents */}
            <div className="w-3 h-3 border-t-2 border-l-2 border-amber-400 absolute top-2 left-2 pointer-events-none" />
            <div className="w-3 h-3 border-t-2 border-r-2 border-amber-400 absolute top-2 right-2 pointer-events-none" />
            <div className="w-3 h-3 border-b-2 border-l-2 border-amber-400 absolute bottom-2 left-2 pointer-events-none" />
            <div className="w-3 h-3 border-b-2 border-r-2 border-amber-400 absolute bottom-2 right-2 pointer-events-none" />

            {/* Top Row inside Orbital Route Box: Title, Telemetry Points Grid & Multi-Scale Distance Readouts */}
            <div className="flex flex-wrap items-start justify-between gap-2 z-10">
              <div>
                <h2 className="text-base sm:text-lg font-trek font-bold uppercase tracking-wider text-slate-100">
                  <span className="text-amber-400">
                    {currentSystem.name.split('/')[0].trim().toUpperCase()}
                  </span>{' '}
                  ORBITAL ROUTE
                </h2>

                {/* Interactive Telemetry Points Matrix */}
                <div className="mt-1.5">
                  <div className="text-[10px] font-trek uppercase tracking-wider text-sky-400 font-bold mb-1">
                    TELEMETRY POINTS
                  </div>
                  <div className="grid grid-cols-7 gap-1 w-fit">
                    {Array.from({ length: 28 }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTelemetryNode(idx)}
                        className={`w-2.5 h-2.5 rounded-[2px] border transition-colors ${
                          selectedTelemetryNode === idx
                            ? 'bg-sky-400 border-white shadow-[0_0_8px_#38bdf8]'
                            : idx % 9 === 0
                            ? 'bg-sky-500/40 border-sky-400/60'
                            : 'bg-slate-900/80 border-sky-500/30 hover:border-sky-400'
                        }`}
                        title={`Telemetry Sensor Node #${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Top-Right Astronomical Distance Readouts (AU, km, Gm, Mm) */}
              <div className="text-right font-mono-nums text-xs space-y-0.5 bg-slate-950/75 px-3 py-2 rounded-lg border border-slate-800/90">
                <div className="text-slate-300">
                  DISTANCE:{' '}
                  <span className="text-white font-bold">
                    ~{transitTelemetry.distAu.toFixed(2)} AU
                  </span>
                </div>
                <div className="text-slate-300">
                  KILOMETERS:{' '}
                  <span className="text-sky-300 font-semibold">
                    {transitTelemetry.compactDistanceKm}
                  </span>
                </div>
                <div className="text-slate-300">
                  AU: <span className="text-amber-300">{transitTelemetry.distAu.toFixed(3)} AU</span>
                </div>
                <div className="text-slate-300">
                  LOA/MM:{' '}
                  <span className="text-slate-200">
                    ~{(transitTelemetry.distMm / 1_000_000).toFixed(3)}B Mm
                  </span>
                </div>
                <div className="text-slate-300">
                  GIGAMETERS:{' '}
                  <span className="text-emerald-300 font-semibold">
                    {transitTelemetry.distGm.toFixed(2)} Gm
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Tilted Elliptical Orbital Route Map */}
            <div className="relative my-1 flex items-center justify-center">
              <svg
                className="w-full h-[270px] sm:h-[295px] overflow-visible"
                viewBox="0 0 440 295"
              >
                <defs>
                  <radialGradient id="centralStarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="35%" stopColor="#facc15" />
                    <stop offset="70%" stopColor="#ea580c" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* SAFE STANDOFF BUFFER Outer Cyan Glowing Boundary Ellipse */}
                <ellipse
                  cx="220"
                  cy="148"
                  rx={192 * orbitalZoomScale}
                  ry={116 * orbitalZoomScale}
                  fill="rgba(6, 182, 212, 0.03)"
                  stroke="#22d3ee"
                  strokeWidth="2.2"
                />
                <text
                  x="220"
                  y={148 - 121 * orbitalZoomScale}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="9.5"
                  fontWeight="bold"
                  letterSpacing="0.08em"
                >
                  SAFE STANDOFF BUFFER
                </text>
                <text
                  x="220"
                  y={148 + 113 * orbitalZoomScale}
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="9.5"
                  fontWeight="bold"
                  letterSpacing="0.08em"
                >
                  SAFE STANDOFF BUFFER
                </text>

                {/* Crosshair Axes */}
                <line
                  x1="24"
                  y1="148"
                  x2="416"
                  y2="148"
                  stroke="rgba(56, 189, 248, 0.35)"
                  strokeWidth="1"
                />
                <line
                  x1="220"
                  y1="26"
                  x2="220"
                  y2="270"
                  stroke="rgba(56, 189, 248, 0.35)"
                  strokeWidth="1"
                />

                {/* Vertical Scale Labels (10 Gm, 20, 30, 50 Gm) */}
                <g fontSize="8.5" fill="#7dd3fc" fontFamily="monospace">
                  <text x="224" y="122">10</text>
                  <text x="224" y="131">Gm</text>
                  <text x="224" y="102">20</text>
                  <text x="224" y="84">30</text>
                  <text x="224" y="56">50</text>
                  <text x="224" y="65" fill="#f59e0b">Gm</text>
                </g>

                {/* Horizontal Scale Labels (-5, 5, AU, 1000, 2000, MAX) */}
                <g fontSize="8.5" fill="#7dd3fc" fontFamily="monospace">
                  <text x="36" y="144">-5</text>
                  <text x="162" y="144">5</text>
                  <text x="266" y="144">AU</text>
                  <text x="292" y="144">1000</text>
                  <text x="330" y="144">2000</text>
                  <text x="364" y="144">1400</text>
                  <text x="392" y="144">MAX</text>
                </g>

                {/* Planetary Orbital Ellipses & Clickable Planets */}
                {orbitalDiagramData.map((d) => {
                  const isSelected = activePlanet?.id === d.planet.id;
                  return (
                    <g
                      key={d.planet.id}
                      onClick={() => handleSelectPlanetCard(d.planet)}
                      className="cursor-pointer"
                    >
                      <ellipse
                        cx="220"
                        cy="148"
                        rx={d.rx}
                        ry={d.ry}
                        fill="none"
                        stroke={isSelected ? '#38bdf8' : 'rgba(148, 163, 184, 0.32)'}
                        strokeWidth={isSelected ? '1.6' : '0.9'}
                        strokeDasharray={isSelected ? undefined : '3 2'}
                      />
                      {/* Planet Node on Orbit */}
                      <circle
                        cx={d.px}
                        cy={d.py}
                        r={isSelected ? 6.5 : 4.2}
                        fill={d.planet.textureColor || '#38bdf8'}
                        stroke={isSelected ? '#ffffff' : '#0f172a'}
                        strokeWidth="1.5"
                      />
                      {isSelected && (
                        <circle
                          cx={d.px}
                          cy={d.py}
                          r="11"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="1.4"
                          strokeDasharray="2 2"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Central Primary Star */}
                <circle cx="220" cy="148" r="24" fill="url(#centralStarGlow)" />
                <circle
                  cx="220"
                  cy="148"
                  r="11"
                  fill="#fde047"
                  stroke="#fef08a"
                  strokeWidth="1.5"
                />

                {/* Glowing Cyan Orbital Route Trajectory Curve (Ship -> Target Standoff) */}
                <path
                  d={`M ${shipDiagramPos.x} ${shipDiagramPos.y} Q ${curveCtrlX} ${curveCtrlY} ${targetDiagramPos.x} ${targetDiagramPos.y}`}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                />

                {/* USS Enterprise Origin Marker */}
                <g transform={`translate(${shipDiagramPos.x - 10}, ${shipDiagramPos.y - 10})`}>
                  <circle cx="10" cy="10" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
                  <text x="10" y="-3" textAnchor="middle" fill="#bae6fd" fontSize="7.5" fontFamily="monospace">
                    NCC-1701
                  </text>
                </g>

                {/* Target Navigation Lock Marker & Callouts */}
                <g>
                  <line
                    x1={targetDiagramPos.x}
                    y1={targetDiagramPos.y}
                    x2={targetDiagramPos.x}
                    y2="262"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                  />
                  <text
                    x={Math.min(365, targetDiagramPos.x + 6)}
                    y="260"
                    fill="#fbbf24"
                    fontSize="8.5"
                    fontWeight="bold"
                  >
                    NAVIGATION
                  </text>
                  <text
                    x={Math.min(365, targetDiagramPos.x + 6)}
                    y="270"
                    fill="#fbbf24"
                    fontSize="8.5"
                    fontWeight="bold"
                  >
                    LOCK
                  </text>

                  {/* Upper Right Navigation Locked On Callout */}
                  <polyline
                    points="335,76 335,44 366,44"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.1"
                  />
                  <rect
                    x="329"
                    y="72"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                  />
                  <text x="370" y="42" fill="#fbbf24" fontSize="8.5" fontWeight="bold">
                    NAVIGATION
                  </text>
                  <text x="370" y="52" fill="#fbbf24" fontSize="8.5" fontWeight="bold">
                    LOCKED ON
                  </text>
                </g>
              </svg>
            </div>

            {/* Bottom Row inside Orbital Route Box: Lower Telemetry Grid & Zoom Scale Controls */}
            <div className="flex items-end justify-between gap-2 z-10">
              <div>
                <div className="text-[10px] font-trek uppercase tracking-wider text-sky-400 font-bold mb-1">
                  TELEMETRY POINTS
                </div>
                <div className="grid grid-cols-7 gap-1 w-fit">
                  {Array.from({ length: 28 }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTelemetryNode(idx)}
                      className={`w-2.5 h-2.5 rounded-[2px] border transition-colors ${
                        (selectedTelemetryNode + 6) % 28 === idx
                          ? 'bg-cyan-400 border-white shadow-[0_0_8px_#22d3ee]'
                          : 'bg-slate-900/80 border-sky-500/30 hover:border-sky-400'
                      }`}
                      title={`Subspace Telemetry Point #${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Lock Badge & Interactive Orbital Map Zoom Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-slate-950/90 border border-sky-500/40 text-[10px] font-mono-nums text-sky-300">
                  <Lock className="w-3 h-3 text-sky-400" />
                  <span>STANDOFF LOCKED</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded border border-slate-800 text-[10px] font-mono-nums">
                  <button
                    onClick={() => setOrbitalZoomScale((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    -
                  </button>
                  <span className="px-1.5 text-sky-300 font-bold">
                    {Math.round(orbitalZoomScale * 100)}%
                  </span>
                  <button
                    onClick={() => setOrbitalZoomScale((z) => Math.min(1.25, +(z + 0.1).toFixed(2)))}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            3. MIDDLE ROW: WARP MATRIX SELECTOR (LEFT) & EST. FLIGHT COMPUTATION (RIGHT)
           =================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* LEFT (6 Cols): ARCHED WARP MATRIX SELECTOR */}
          <div className="lg:col-span-6 bg-[#081121]/95 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-trek font-bold uppercase tracking-wider text-amber-400">
                  WARP MATRIX SELECTOR
                </h3>
                <div className="text-[10px] font-mono-nums text-sky-400/80 leading-tight uppercase">
                  <div>WARP FIELD DIGITAL</div>
                  <div>SUBSPACE HARMONIC</div>
                  <div>VELOCITY</div>
                </div>
              </div>
              <div className="text-right font-trek">
                <div className="text-xs font-bold text-amber-300 uppercase">MAX</div>
                <div className="text-lg font-extrabold text-amber-400 leading-none">9.9</div>
              </div>
            </div>

            {/* Interactive SVG Curved Speedometer Arc Gauge (Click any segment to set Warp Factor!) */}
            <div className="relative my-1">
              <svg className="w-full h-28 overflow-visible" viewBox="0 0 420 112">
                {/* Outer & Inner Curved Arc Rails */}
                <path
                  d="M 22 104 Q 175 18 392 26"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeOpacity="0.65"
                />
                <path
                  d="M 42 108 Q 182 44 382 54"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  strokeOpacity="0.45"
                />

                {/* 36 Interactive Segmented Warp Wedges along the curve */}
                {Array.from({ length: 36 }).map((_, idx) => {
                  const t = idx / 35; // 0 -> 1
                  const segWarp = 1.0 + t * 8.9; // 1.0 -> 9.9
                  const isActive = segWarp <= selectedWarpFactor + 0.08;
                  const isHighWarp = segWarp >= 8.5;

                  // Quadratic Bezier interpolation for top and bottom points of each segment
                  const u = 1 - t;
                  const topX = u * u * 26 + 2 * u * t * 175 + t * t * 388;
                  const topY = u * u * 100 + 2 * u * t * 22 + t * t * 30;
                  const botX = u * u * 44 + 2 * u * t * 182 + t * t * 378;
                  const botY = u * u * 105 + 2 * u * t * 46 + t * t * 52;

                  const fillCol = isActive
                    ? isHighWarp
                      ? '#f59e0b'
                      : '#0ea5e9'
                    : 'rgba(15, 23, 42, 0.85)';

                  return (
                    <g
                      key={idx}
                      onClick={() => handleWarpChange(segWarp)}
                      className="cursor-pointer hover:opacity-90"
                    >
                      <line
                        x1={topX}
                        y1={topY}
                        x2={botX}
                        y2={botY}
                        stroke={fillCol}
                        strokeWidth="6.5"
                      />
                    </g>
                  );
                })}

                {/* Scale Tick Numbers Underneath Curve */}
                <g fontSize="9.5" fill="#cbd5e1" fontFamily="monospace" fontWeight="bold">
                  <text x="68" y="96">1</text>
                  <text x="115" y="82">2</text>
                  <text x="172" y="70">4</text>
                  <text x="225" y="64">5</text>
                  <text x="272" y="63">6</text>
                  <text x="318" y="65">8</text>
                  <text x="350" y="67" fill="#fbbf24">9</text>
                  <text x="374" y="68" fill="#f59e0b">W</text>
                </g>
              </svg>
            </div>

            {/* Bottom Cruise Speed Controls & Preset Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/90">
              <div className="flex items-center gap-1.5">
                <Rocket className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-trek font-bold uppercase text-sky-400">
                  CRUISE SPEED:
                </span>
                <span className="text-sm font-mono-nums font-bold text-white">
                  Warp {selectedWarpFactor.toFixed(1)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 9.9].map((wf) => (
                  <button
                    key={wf}
                    onClick={() => handleWarpChange(wf)}
                    className={`px-1.5 py-1 rounded text-[10px] font-mono-nums font-bold border transition-all cursor-pointer ${
                      Math.abs(selectedWarpFactor - wf) < 0.15
                        ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                        : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:border-sky-500/50'
                    }`}
                  >
                    {wf === 9.9 ? '9.9' : `W${wf}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT (6 Cols): EST. FLIGHT COMPUTATION */}
          <div className="lg:col-span-6 bg-[#081121]/95 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-trek font-bold uppercase tracking-wider text-slate-200">
                EST. FLIGHT COMPUTATION:
              </h3>
              <span className="text-xs font-mono-nums text-sky-400">
                Subspace Velocity Verified
              </span>
            </div>

            {/* Center Computation Readout Box: Giant ETA + Multi-Unit Matrix */}
            <div className="my-2 p-3.5 rounded-xl bg-[#050b14] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="text-4xl sm:text-5xl font-trek font-extrabold text-amber-400 tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.35)]">
                ~{transitTelemetry.seconds}s
              </div>

              <div className="flex-1 min-w-[230px] font-mono-nums text-xs sm:text-sm space-y-1">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sky-400 font-bold">AU</span>
                  <span className="text-slate-200">
                    ({transitTelemetry.distAu.toFixed(2)} AU)
                  </span>
                  <span className="text-slate-400 text-right">
                    ({transitTelemetry.auPerSec.toFixed(2)}/s at W{selectedWarpFactor.toFixed(1)})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sky-400 font-bold">Mm/</span>
                  <span className="text-slate-200">
                    ({(transitTelemetry.distMm / 1_000_000).toFixed(3)}B Mm)
                  </span>
                  <span className="text-slate-400 text-right">
                    ({(transitTelemetry.auPerSec * 1.48).toFixed(2)} at W{selectedWarpFactor.toFixed(1)})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sky-400 font-bold">Gm</span>
                  <span className="text-slate-200">
                    ({transitTelemetry.distGm.toFixed(3)} Gm)
                  </span>
                  <span className="text-slate-400 text-right">
                    ({transitTelemetry.gmPerSec.toFixed(2)}/s at W{selectedWarpFactor.toFixed(1)})
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Subspace Calibration Bar */}
            <div className="space-y-1">
              <div className="relative h-3 rounded bg-slate-900 border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-300 transition-all duration-200"
                  style={{ width: `${(selectedWarpFactor / 9.9) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono-nums text-slate-400">
                <span>SUBSPACE COCHRANE INDEX</span>
                <span className="text-amber-400 font-bold">
                  ▲ WARP {selectedWarpFactor.toFixed(1)} LOCKED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            4. HERO ENGAGEMENT BANNER ("LAY IN COURSE TO ... & ENGAGE!")
           =================================================================== */}
        <div className="rounded-2xl border-2 border-cyan-400/90 bg-gradient-to-b from-[#0b2244] via-[#07162c] to-[#051020] p-3.5 sm:p-4 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
          {/* Primary Clickable Action Header Button */}
          <button
            onClick={handleEngageCourse}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500/25 via-cyan-500/35 to-sky-500/25 hover:from-sky-500/45 hover:via-cyan-400/55 hover:to-sky-500/45 border border-cyan-300/70 transition-all group mb-3 shadow-lg"
          >
            <div className="text-lg sm:text-2xl md:text-3xl font-trek font-extrabold uppercase tracking-[0.08em] text-cyan-300 group-hover:text-white drop-shadow-[0_0_12px_rgba(34,211,238,0.6)] flex items-center justify-center gap-3">
              <Navigation className="w-6 h-6 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              <span className="truncate">
                LAY IN COURSE TO {targetBannerTitle} & ENGAGE!
              </span>
            </div>
          </button>

          {/* Lower Engagement Telemetry & Reticle Deck */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Left Reticle Crosshair */}
            <div className="md:col-span-2 flex items-center justify-center">
              <svg className="w-24 h-24" viewBox="0 0 100 100">
                <path d="M 10 26 L 10 10 L 26 10" fill="none" stroke="#f59e0b" strokeWidth="2" />
                <path d="M 74 10 L 90 10 L 90 26" fill="none" stroke="#f59e0b" strokeWidth="2" />
                <path d="M 10 74 L 10 90 L 26 90" fill="none" stroke="#f59e0b" strokeWidth="2" />
                <path d="M 74 90 L 90 90 L 90 74" fill="none" stroke="#f59e0b" strokeWidth="2" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="18" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
                <line x1="12" y1="50" x2="36" y2="50" stroke="#f59e0b" strokeWidth="1.8" />
                <line x1="64" y1="50" x2="88" y2="50" stroke="#f59e0b" strokeWidth="1.8" />
                <line x1="50" y1="12" x2="50" y2="36" stroke="#f59e0b" strokeWidth="1.8" />
                <line x1="50" y1="64" x2="50" y2="88" stroke="#f59e0b" strokeWidth="1.8" />
                <circle cx="50" cy="50" r="2.5" fill="#fbbf24" />
              </svg>
            </div>

            {/* Interactive Warp Engagement Matrix Grid */}
            <div className="md:col-span-3 flex justify-center">
              <div className="grid grid-cols-8 gap-0.5 p-1.5 bg-[#040a14] border border-amber-500/40 rounded">
                {Array.from({ length: 40 }).map((_, idx) => {
                  const warpMap: Record<number, number> = {
                    10: 4,
                    12: 4,
                    17: 6,
                    19: 8,
                    20: 8,
                    26: 8,
                    28: 9,
                  };
                  const cellWarp = warpMap[idx];
                  const isSelectedCell =
                    cellWarp !== undefined && Math.round(selectedWarpFactor) === cellWarp;

                  return (
                    <button
                      key={idx}
                      onClick={() => cellWarp && handleWarpChange(cellWarp)}
                      className={`w-6 h-5 text-[9px] font-mono-nums font-bold flex items-center justify-center border transition-colors ${
                        isSelectedCell
                          ? 'bg-sky-500 text-slate-950 border-white'
                          : cellWarp
                          ? 'bg-sky-950/90 text-sky-300 border-sky-500/50 hover:bg-sky-800'
                          : 'bg-[#071120] border-slate-800/80 text-transparent'
                      }`}
                    >
                      {cellWarp ? `W${cellWarp}` : '.'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center Lock-On Reticle Crosshair */}
            <div className="md:col-span-2 flex items-center justify-center">
              <svg className="w-24 h-24" viewBox="0 0 100 100">
                <path d="M 10 26 L 10 10 L 26 10" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <path d="M 74 10 L 90 10 L 90 26" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <path d="M 10 74 L 10 90 L 26 90" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <path d="M 74 90 L 90 90 L 90 74" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="50" cy="50" r="26" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
                <line x1="20" y1="50" x2="80" y2="50" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 4" />
                <line x1="50" y1="20" x2="50" y2="80" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 4" />
              </svg>
            </div>

            {/* Right Engagement Matrix & Lock-On Bar */}
            <div className="md:col-span-5 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7 font-mono-nums text-xs space-y-0.5">
                  <div className="text-sm font-trek font-bold uppercase text-sky-400">
                    ENGAGEMENT MATRIX
                  </div>
                  <div className="text-slate-200">
                    COORDINATES: [{targetCoordinates.join(', ')}]
                  </div>
                  <div className="text-slate-300">
                    SAFE VECTOR: [{activeSafety.safePos.join(', ')}]
                  </div>
                  <div className="text-slate-300">
                    COORDINATES : +2.976+34.67
                  </div>
                  <div className="text-amber-300">
                    LOADING: {(selectedWarpFactor * 0.205).toFixed(2)} Lam
                  </div>
                </div>

                <div className="sm:col-span-5 space-y-1">
                  <div className="text-sm font-trek font-bold uppercase text-sky-400">
                    LOCK-ON BAR
                  </div>
                  <div className="h-3.5 rounded bg-slate-900 border border-slate-700 overflow-hidden flex items-center">
                    <div className="h-full w-4/5 bg-sky-400 text-[9px] font-mono-nums font-bold text-slate-950 px-1.5 flex items-center">
                      BAR
                    </div>
                  </div>
                  <div className="h-3.5 rounded bg-slate-900 border border-slate-700 overflow-hidden flex items-center">
                    <div className="h-full w-2/3 bg-cyan-400 text-[9px] font-mono-nums font-bold text-slate-950 px-1.5 flex items-center">
                      049R
                    </div>
                  </div>
                  <div className="h-3.5 rounded bg-slate-900 border border-slate-700 overflow-hidden flex items-center">
                    <div className="h-full w-full bg-emerald-400 text-[9px] font-mono-nums font-bold text-slate-950 px-1.5 flex items-center">
                      LOCK-ON
                    </div>
                  </div>
                </div>
              </div>

              {/* Segmented Power Capacitor Bar */}
              <div className="p-1.5 rounded-lg bg-[#040a14] border border-amber-500/50 flex items-center gap-1">
                {Array.from({ length: 24 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-3.5 flex-1 rounded-[1px] ${
                      idx < 14
                        ? 'bg-sky-400'
                        : idx < 20
                        ? 'bg-emerald-400'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            5. BOTTOM COLLISION SAFETY SYSTEM & CYBERNETIC TELEMETRY FOOTER
           =================================================================== */}
        <div className="pt-1 border-t border-slate-800/90 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm sm:text-base font-trek font-extrabold uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-400">COLLISION SAFETY SYSTEM:</span>
              <span className="text-emerald-400">
                ACTIVE (Autonomous Standoff Enforced)
              </span>
            </div>
            <div className="text-xs font-trek font-bold uppercase text-amber-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>SCANNING ARRAYS NOMINAL</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-[11px] font-mono-nums">
            {/* Left Telemetry Bars */}
            <div className="md:col-span-4 space-y-1">
              {[
                { label: 'DENSE', skyW: '70%', ambW: '25%' },
                { label: 'NUMBERS', skyW: '55%', ambW: '0%' },
                { label: 'GRAPHS', skyW: '62%', ambW: '12%' },
                { label: 'STATUS', skyW: '48%', ambW: '0%' },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-slate-900 rounded-sm overflow-hidden flex border border-slate-800">
                    <div className="h-full bg-sky-400" style={{ width: row.skyW }} />
                    {row.ambW !== '0%' && (
                      <div className="h-full bg-amber-400" style={{ width: row.ambW }} />
                    )}
                  </div>
                  <span className="w-16 text-[10px] text-slate-400">{row.label}</span>
                </div>
              ))}
            </div>

            {/* Center Cybernetic Telemetry Metrics */}
            <div className="md:col-span-5 flex flex-col justify-between bg-[#07101f] p-2.5 rounded-lg border border-slate-800/90">
              <div className="flex items-center justify-between mb-1">
                <span className="font-trek font-bold uppercase text-slate-300 text-xs">
                  CYBERNETIC TELEMETRY
                </span>
                <span className="font-trek font-bold uppercase text-amber-400 text-xs">
                  STARDA:33
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs font-bold text-sky-400">
                <div>
                  <div>+ - 49.5</div>
                  <div className="text-[9px] text-slate-400 font-normal">GEOMETRIC</div>
                </div>
                <div>
                  <div>- 721%</div>
                  <div className="text-[9px] text-slate-400 font-normal">FLUX</div>
                </div>
                <div>
                  <div>- 320%</div>
                  <div className="text-[9px] text-slate-400 font-normal">VECTOR</div>
                </div>
                <div>
                  <div>53x87 mm</div>
                  <div className="text-[9px] text-slate-400 font-normal">SCANNING BINS</div>
                </div>
              </div>
            </div>

            {/* Right Blueprint Line Frame Graph */}
            <div className="md:col-span-3 flex items-center justify-between gap-2 bg-[#07101f] p-2.5 rounded-lg border border-slate-800/90">
              <div className="space-y-1 flex-1">
                <div className="h-1.5 bg-sky-400/80 rounded-xs w-4/5" />
                <div className="h-1.5 bg-sky-500/50 rounded-xs w-3/5" />
                <div className="h-1.5 bg-amber-400/80 rounded-xs w-2/3" />
                <div className="text-[9px] text-slate-400 uppercase pt-1">
                  BLUEPRINT LINE FRAME
                </div>
              </div>
              <div className="w-20 h-14 relative border border-sky-500/40 rounded flex items-center justify-center">
                <line x1="0" y1="28" x2="80" y2="28" stroke="#38bdf8" />
                <div className="w-full h-[1px] bg-sky-400/60 absolute" />
                <div className="h-full w-[1px] bg-sky-400/60 absolute" />
                <div className="w-3 h-3 rotate-45 bg-slate-200/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
