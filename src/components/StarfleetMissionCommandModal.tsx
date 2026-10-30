import React, { useState } from 'react';
import {
  StarfleetMission,
  MissionArchetype,
  SolarSystem,
  PlayerProgression,
} from '../types/simulation';
import { generateProceduralStarfleetMission } from '../data/starfleetMissionsData';
import { soundEffects } from '../audio/soundEffects';
import {
  Compass,
  Radio,
  Shield,
  Zap,
  Award,
  X,
  Navigation,
  Sparkles,
  Activity,
  Crosshair,
  BookOpen,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface StarfleetMissionCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  solarSystems: SolarSystem[];
  currentSystemId: string;
  progression?: PlayerProgression;
  activeMission: StarfleetMission | null;
  activeOfficerCode: string | null;
  onAcceptMission: (mission: StarfleetMission) => void;
  onAbortMission: () => void;
  onOpenWorkstation: () => void;
  onOpenOfficerProfile: () => void;
  isInProximity?: boolean;
}

export const StarfleetMissionCommandModal: React.FC<StarfleetMissionCommandModalProps> = ({
  isOpen,
  onClose,
  solarSystems,
  currentSystemId,
  progression,
  activeMission,
  activeOfficerCode,
  onAcceptMission,
  onAbortMission,
  onOpenWorkstation,
  onOpenOfficerProfile,
  isInProximity = false,
}) => {
  const [scannedMission, setScannedMission] = useState<StarfleetMission>(() =>
    generateProceduralStarfleetMission(solarSystems, currentSystemId)
  );
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<MissionArchetype | 'random'>('random');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  if (!isOpen) return null;

  const displayedMission = activeMission || scannedMission;
  const level = progression?.level || 1;
  const rank = progression?.rank || 'Ensign';
  const xp = progression?.xp || 0;
  const nextLevelXp = progression?.nextLevelXp || 500;
  const xpProgressPercent = Math.min(100, Math.max(4, Math.round((xp / Math.max(1, nextLevelXp)) * 100)));

  const handleScanForMission = (overrideFilter?: MissionArchetype | 'random') => {
    const filterToUse = overrideFilter !== undefined ? overrideFilter : selectedArchetypeFilter;
    setIsScanning(true);
    soundEffects.playLcarsBeep(920, 0.12);
    setTimeout(() => {
      const next = generateProceduralStarfleetMission(
        solarSystems,
        currentSystemId,
        filterToUse === 'random' ? undefined : filterToUse
      );
      setScannedMission(next);
      setIsScanning(false);
      soundEffects.playLcarsAcknowledge();
    }, 220);
  };

  const getArchetypeBadgeStyle = (arch: MissionArchetype) => {
    switch (arch) {
      case 'first_contact':
        return {
          color: 'text-amber-400',
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/10',
          icon: <Radio className="w-4 h-4 text-amber-400" />,
        };
      case 'anomaly_investigation':
        return {
          color: 'text-purple-300',
          border: 'border-purple-500/40',
          bg: 'bg-purple-500/10',
          icon: <Activity className="w-4 h-4 text-purple-400" />,
        };
      case 'planetary_defense':
        return {
          color: 'text-red-400',
          border: 'border-red-500/40',
          bg: 'bg-red-500/10',
          icon: <Shield className="w-4 h-4 text-red-400" />,
        };
      case 'magnetosphere_rescue':
        return {
          color: 'text-cyan-300',
          border: 'border-cyan-500/40',
          bg: 'bg-cyan-500/10',
          icon: <Zap className="w-4 h-4 text-cyan-400" />,
        };
    }
  };

  const badgeStyle = getArchetypeBadgeStyle(displayedMission.archetype);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 select-none overflow-y-auto">
      <div className="w-full max-w-6xl bg-[#07090E] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top LCARS Command Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#111827] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-7 rounded-tl-lg bg-amber-500 flex items-center justify-center text-slate-950 font-trek font-bold text-xs">
              OPS
            </div>
            <div>
              <h2 className="font-trek font-bold text-base sm:text-lg tracking-wider text-amber-400 uppercase">
                Starfleet Mission Command & Deep-Space Directives
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-2 font-mono tabular-nums">
                <span>Science Exhibition Interactive Operations</span>
                <span aria-hidden="true">·</span>
                <span>Stardate {displayedMission.stardate}</span>
              </div>
            </div>
          </div>

          {/* Officer Rank Progression & On-Demand 6-Digit Profile Button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-trek font-bold text-white uppercase">{rank}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono tabular-nums text-amber-400 font-semibold">LVL {level}</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                  </span>
                </div>
                <div className="w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${xpProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onOpenOfficerProfile}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/50 text-cyan-300 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Create or Restore 6-Digit Exhibition Officer Profile"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-trek uppercase tracking-wide">
                {activeOfficerCode ? `Officer ID: ${activeOfficerCode}` : '6-Digit Officer ID'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Mission Command [J]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (4 cols): Procedural Deep-Space Mission Scanner */}
          <div className="lg:col-span-4 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                01. Subspace Directive Scanner
              </div>
              <h3 className="text-base font-semibold text-white">
                Search Deep Space for Directives
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Scan Federation and frontier sectors to procedurally generate a scientific or tactical mission across four core Starfleet archetypes.
              </p>
            </div>

            {/* Prominent Search for Mission CTA */}
            <button
              onClick={() => handleScanForMission()}
              disabled={isScanning || Boolean(activeMission)}
              className={`w-full py-3 px-4 rounded-lg font-trek font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMission
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 active:scale-[0.99]'
              }`}
            >
              <Compass className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>
                {isScanning
                  ? 'Scanning Subspace Bands...'
                  : activeMission
                  ? 'Directive Currently Active'
                  : 'Search for Mission'}
              </span>
            </button>

            {/* Archetype Filter Selector (Functional Segmented Buttons) */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-2 font-medium">
                Scanner Band Filter (Optional):
              </div>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'random', label: 'All Subspace Bands (Random Archetype)' },
                  { id: 'first_contact', label: 'Type 1 · First Contact & Xenolinguistics' },
                  { id: 'anomaly_investigation', label: 'Type 2 · Astrophysical Anomaly Scan' },
                  { id: 'planetary_defense', label: 'Type 3 · Planetary Defense (Enemy Wave)' },
                  { id: 'magnetosphere_rescue', label: 'Type 4 · Magnetosphere & Ecological Rescue' },
                ].map((tab) => {
                  const isSelected = selectedArchetypeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      disabled={Boolean(activeMission)}
                      onClick={() => {
                        const nextFilter = tab.id as MissionArchetype | 'random';
                        setSelectedArchetypeFilter(nextFilter);
                        handleScanForMission(nextFilter);
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                      } ${activeMission ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="truncate">{tab.label}</span>
                      {isSelected && <span className="text-[10px] font-mono text-amber-400">ACTIVE</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Navigation Instructions Box */}
            <div className="mt-auto p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>Exhibition Flight Protocol</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                1. Accept a directive to lock target coordinates onto your HUD Directional Compass.
              </p>
              <p className="text-slate-400 leading-relaxed">
                2. Manually steer (<kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[10px]">W</kbd><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[10px]">A</kbd><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[10px]">S</kbd><kbd className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded font-mono text-[10px]">D</kbd>) and engage Warp Drive to fly into the <strong className="text-slate-200">480 km proximity zone</strong>.
              </p>
              <p className="text-slate-400 leading-relaxed">
                3. Open the Full-Screen LCARS Workstation upon arrival to complete scientific calibrations and earn Ranked XP.
              </p>
            </div>
          </div>

          {/* Right Column (8 cols): Procedural Mission Dossier & Astrophysics Briefing */}
          <div className="lg:col-span-8 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
            {/* Mission Title & Metadata Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs mb-1.5">
                  {badgeStyle.icon}
                  <span className={`font-semibold uppercase tracking-wider ${badgeStyle.color}`}>
                    {displayedMission.archetypeLabel}
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    Difficulty: {'★'.repeat(displayedMission.difficulty)}{'☆'.repeat(5 - displayedMission.difficulty)} ({displayedMission.difficulty}/5)
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                    Base Reward: +{displayedMission.baseXp} XP
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {displayedMission.title}
                </h3>
              </div>

              {activeMission && (
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>DIRECTIVE IN PROGRESS</span>
                </div>
              )}
            </div>

            {/* Target Astrometric Telemetry Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  Target Star System
                </div>
                <div className="text-sm font-semibold text-white mt-0.5 truncate">
                  {displayedMission.targetSystemName}
                </div>
                <div className="text-xs font-mono tabular-nums text-amber-400 mt-0.5">
                  Sector ID: {displayedMission.targetSystemId}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  Destination Body
                </div>
                <div className="text-sm font-semibold text-white mt-0.5 truncate">
                  {displayedMission.targetPlanetName}
                </div>
                <div className="text-xs font-mono tabular-nums text-cyan-400 mt-0.5">
                  Proximity Threshold: ≤ 480 km
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  Sector Waypoint Vector
                </div>
                <div className="text-sm font-mono tabular-nums font-semibold text-white mt-0.5">
                  [{displayedMission.targetCoordinates.join(', ')}]
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-400 mt-0.5">
                  Manual Helm & Warp Required
                </div>
              </div>
            </div>

            {/* Real-World Science Exhibition Briefing Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Science Exhibition Astrophysics Briefing
                  </span>
                </div>
                <span className="text-xs font-mono tabular-nums text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded">
                  {displayedMission.scienceBriefing.formulaOrLaw}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  {displayedMission.scienceBriefing.conceptTitle}
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {displayedMission.scienceBriefing.summary}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#111827] border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-amber-400 uppercase tracking-wide font-mono mr-1.5">
                  Real-World Physics Connection:
                </span>
                {displayedMission.scienceBriefing.exhibitionFact}
              </div>
            </div>

            {/* Archetype-Specific Operational Parameters */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-slate-400 font-mono uppercase mr-2">Bonus Objective:</span>
                <span className="text-slate-100 font-medium">{displayedMission.bonusObjectiveText}</span>
              </div>
              <div className="font-mono tabular-nums text-emerald-400 font-semibold">
                +180 Bonus XP
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="mt-auto pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {!activeMission ? (
                <>
                  <button
                    onClick={() => handleScanForMission()}
                    className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Scan Another Sector
                  </button>
                  <button
                    onClick={() => {
                      onAcceptMission(displayedMission);
                      onClose();
                    }}
                    className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                  >
                    <Crosshair className="w-4 h-4" />
                    <span>Accept Directive & Plot Manual Waypoint</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onAbortMission}
                    className="px-4 py-2.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Abort Current Directive</span>
                  </button>

                  <div className="flex items-center gap-3">
                    {isInProximity ? (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenWorkstation();
                        }}
                        className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Open Full-Screen Mission Workstation</span>
                      </button>
                    ) : (
                      <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Return to Helm & Pilot to Waypoint</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
