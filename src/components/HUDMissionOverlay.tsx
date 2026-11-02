import React, { useState, useEffect, useMemo } from 'react';
import {
  StarfleetMission,
  MissionArchetype,
  SolarSystem,
  ShipState,
  MissionPerformanceReport,
  OfficerProfileRecord,
} from '../types/simulation';
import {
  generateProceduralStarfleetMission,
  officerProfileStore,
} from '../data/starfleetMissionsData';
import { soundEffects } from '../audio/soundEffects';
import { formatAstronomicalDistance } from '../utils/scaleFormatters';
import {
  Compass,
  Radar,
  Radio,
  Atom,
  ShieldAlert,
  Magnet,
  Sparkles,
  CheckCircle2,
  Crosshair,
  Award,
  Zap,
  Navigation,
  ChevronDown,
  ChevronUp,
  X,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  LogIn,
  UserPlus,
  LogOut,
  Flame,
  Rocket,
  Shield,
  Activity,
} from 'lucide-react';

interface HUDMissionOverlayProps {
  shipState: ShipState;
  solarSystems: SolarSystem[];
  activeMission: StarfleetMission | null;
  lastMissionReport: MissionPerformanceReport | null;
  enemies?: any[];
  enemiesAliveCount: number;
  onLockEnemy?: (enemyId: string) => void;
  isMissionScannerOpen: boolean;
  isMissionConsoleExpanded: boolean;
  isOfficerPopoverOpen: boolean;
  activeOfficerCode: string | null;
  missionsCompletedCount: number;
  onToggleMissionScanner: () => void;
  onSetMissionConsoleExpanded: (expanded: boolean) => void;
  onCloseOfficerPopover: () => void;
  onOpenOfficerPopover: () => void;
  onAcceptMission: (mission: StarfleetMission) => void;
  onAbortMission: () => void;
  onClearDebrief: () => void;
  onWarpToMissionZone?: (systemId: string, planetId: string) => void;
  onSetShieldHarmonics: (efficiencyPercent: number) => void;
  onStartPlanetaryDefenseWave: () => void;
  onFireDeflectorBeam: (coords?: [number, number, number], colorHex?: number, duration?: number) => void;
  onTriggerMission3DAction?: (
    action: 'sensor_pulse' | 'launch_probe' | 'activate_node' | 'stabilize_field',
    nodeIndex?: number
  ) => void;
  onTriggerHazardShake: (intensity?: number) => void;
  onStartPhaser?: () => void;
  onStopPhaser?: () => void;
  onFireTorpedo?: () => void;
  onTargetHostile?: () => void;
  onCompleteMission: (metrics: {
    accuracyScore: number;
    tacticalEfficiencyScore: number;
    diplomaticOrScienceScore: number;
    elapsedSeconds: number;
    bonusCompleted: boolean;
  }) => void;
  onProfileActivated: (profile: OfficerProfileRecord) => void;
  onProfileDisconnected: () => void;
  onOpenCommendation?: () => void;
}

const ARCHETYPE_LABELS: Record<MissionArchetype, string> = {
  first_contact: 'First Contact',
  anomaly_investigation: 'Anomaly Survey',
  planetary_defense: 'Planetary Defense',
  magnetosphere_rescue: 'Ecological Rescue',
};

const ARCHETYPE_ICONS: Record<MissionArchetype, React.ReactNode> = {
  first_contact: <Radio className="w-3.5 h-3.5 text-cyan-400" />,
  anomaly_investigation: <Atom className="w-3.5 h-3.5 text-purple-400" />,
  planetary_defense: <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
  magnetosphere_rescue: <Magnet className="w-3.5 h-3.5 text-amber-400" />,
};

export const HUDMissionOverlay: React.FC<HUDMissionOverlayProps> = ({
  shipState,
  solarSystems,
  activeMission,
  lastMissionReport,
  enemies = [],
  enemiesAliveCount,
  onLockEnemy,
  isMissionScannerOpen,
  isMissionConsoleExpanded,
  isOfficerPopoverOpen,
  activeOfficerCode,
  missionsCompletedCount,
  onToggleMissionScanner,
  onSetMissionConsoleExpanded,
  onCloseOfficerPopover,
  onOpenOfficerPopover,
  onAcceptMission,
  onAbortMission,
  onClearDebrief,
  onWarpToMissionZone,
  onSetShieldHarmonics,
  onStartPlanetaryDefenseWave,
  onFireDeflectorBeam,
  onTriggerMission3DAction,
  onTriggerHazardShake,
  onStartPhaser,
  onStopPhaser,
  onFireTorpedo,
  onTargetHostile,
  onCompleteMission,
  onProfileActivated,
  onProfileDisconnected,
  onOpenCommendation,
}) => {
  const wp = shipState.missionWaypoint;
  const currentSystemId = shipState.currentSystemId || 'sol_system';

  // --- Scanner State ---
  const [scannedMission, setScannedMission] = useState<StarfleetMission>(() =>
    generateProceduralStarfleetMission(solarSystems, currentSystemId)
  );
  const [selectedArchetypeFilter, setSelectedArchetypeFilter] = useState<MissionArchetype | 'random'>('random');
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const handleScanDirectives = (archetypeOverride?: MissionArchetype | 'random') => {
    const filter = archetypeOverride !== undefined ? archetypeOverride : selectedArchetypeFilter;
    soundEffects.playLcarsBeep(880, 0.12);
    setIsScanning(true);
    setTimeout(() => {
      const next = generateProceduralStarfleetMission(
        solarSystems,
        currentSystemId,
        filter === 'random' ? undefined : filter
      );
      setScannedMission(next);
      setIsScanning(false);
      soundEffects.playLcarsAcknowledge();
    }, 220);
  };

  // --- Active Mission Mini-Game State ---
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [startTimeMs, setStartTimeMs] = useState<number>(Date.now());
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [animTick, setAnimTick] = useState<number>(0);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const triggerBanner = (msg: string) => {
    setActionBanner(msg);
    setTimeout(() => {
      setActionBanner((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  // Type 1: First Contact & Xenolinguistics
  const [fcFreq, setFcFreq] = useState<number>(1400);
  const [fcPhase, setFcPhase] = useState<number>(90);
  const [fcLockedTransceivers, setFcLockedTransceivers] = useState<number>(0);
  const [fcTokenSelections, setFcTokenSelections] = useState<Record<number, number>>({});
  const [fcDiplomaticRound, setFcDiplomaticRound] = useState<number>(0);
  const [fcTrustScore, setFcTrustScore] = useState<number>(50);
  const [fcAlienReply, setFcAlienReply] = useState<string | null>(null);

  // Type 2: Anomaly Investigation
  const [anLaserNm, setAnLaserNm] = useState<number>(420);
  const [anLockedLines, setAnLockedLines] = useState<number[]>([]);
  const [anUserTesla, setAnUserTesla] = useState<number>(12.0);
  const [anSurgeNeutralizedCount, setAnSurgeNeutralizedCount] = useState<number>(0);
  const [anSweepPhase, setAnSweepPhase] = useState<number>(0);
  const [anSweepHits, setAnSweepHits] = useState<number>(0);

  // Type 3: Planetary Defense
  const [pdShieldFreq, setPdShieldFreq] = useState<number>(250);
  const [pdNutationDeg, setPdNutationDeg] = useState<number>(45);
  const [pdWaveStarted, setPdWaveStarted] = useState<boolean>(false);
  const [pdEmpCooldown, setPdEmpCooldown] = useState<number>(0);
  const [pdGridNodes, setPdGridNodes] = useState<boolean[]>([false, false, false]);

  // Type 4: Magnetosphere Rescue
  const [mrResonanceGhz, setMrResonanceGhz] = useState<number>(42.0);
  const [mrApertureDeg, setMrApertureDeg] = useState<number>(25);
  const [mrWindowCursor, setMrWindowCursor] = useState<number>(50);
  const [mrCuspsCharged, setMrCuspsCharged] = useState<boolean[]>([false, false, false]);
  const [mrBeamAccuracySum, setMrBeamAccuracySum] = useState<number>(0);
  const [mrShieldRestoration, setMrShieldRestoration] = useState<number>(18);

  // --- Officer 6-Digit ID Popover State ---
  const [officerTab, setOfficerTab] = useState<'restore' | 'create'>('restore');
  const [restoreCodeInput, setRestoreCodeInput] = useState<string>('');
  const [callsignInput, setCallsignInput] = useState<string>('');
  const [officerError, setOfficerError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Reset mini-game state when a new mission becomes active
  useEffect(() => {
    if (!activeMission) return;
    setCurrentStage(1);
    setStartTimeMs(Date.now());
    setElapsedSec(0);
    setActionBanner(null);

    if (activeMission.firstContactData) {
      setFcFreq(Math.max(400, Math.round(activeMission.firstContactData.targetFreqMhz - 42)));
      setFcPhase(45);
    }
    setFcLockedTransceivers(0);
    setFcTokenSelections({});
    setFcDiplomaticRound(0);
    setFcTrustScore(50);
    setFcAlienReply(null);

    setAnLaserNm(410);
    setAnLockedLines([]);
    if (activeMission.anomalyData) {
      setAnUserTesla(Number(Math.max(2, activeMission.anomalyData.optimalMagneticTesla - 4.5).toFixed(1)));
    }
    setAnSurgeNeutralizedCount(0);
    setAnSweepPhase(0);
    setAnSweepHits(0);

    if (activeMission.defenseData) {
      setPdShieldFreq(Math.round(activeMission.defenseData.disruptorFreqThz - 26));
      setPdNutationDeg(45);
    }
    setPdWaveStarted(false);
    setPdEmpCooldown(0);
    setPdGridNodes([false, false, false]);

    if (activeMission.magnetosphereData) {
      setMrResonanceGhz(Number(Math.max(12, activeMission.magnetosphereData.targetResonanceGhz - 8.5).toFixed(1)));
      setMrApertureDeg(Math.max(10, activeMission.magnetosphereData.targetApertureDeg - 10));
    }
    setMrCuspsCharged([false, false, false]);
    setMrBeamAccuracySum(0);
    setMrShieldRestoration(18);
  }, [activeMission?.id]);

  // High-frequency live animation & telemetry loop for active HUD mini-games
  useEffect(() => {
    if (!activeMission || !isMissionConsoleExpanded) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setElapsedSec(Math.floor((now - startTimeMs) / 1000));
      setAnimTick((t) => (t + 1) % 10000);
      setAnSweepPhase((prev) => (prev + 5) % 100);
      const t = now / 320;
      setMrWindowCursor(Math.round(50 + Math.sin(t) * 44));
      setPdEmpCooldown((c) => Math.max(0, Number((c - 0.08).toFixed(2))));
    }, 80);
    return () => clearInterval(timer);
  }, [activeMission, isMissionConsoleExpanded, startTimeMs]);

  // --- Accuracy Helpers ---
  // Live subtle subspace drift for First Contact so tuning feels alive
  const liveTargetFreq = useMemo(() => {
    if (!activeMission?.firstContactData) return 1420;
    const drift = Math.sin(animTick * 0.08) * 3.5;
    return Number((activeMission.firstContactData.targetFreqMhz + drift).toFixed(1));
  }, [activeMission?.firstContactData, animTick]);

  const fcFreqAccuracy = useMemo(() => {
    if (!activeMission?.firstContactData) return 0;
    const freqErr = Math.abs(fcFreq - liveTargetFreq);
    const phaseErr = Math.abs(fcPhase - activeMission.firstContactData.targetPhaseDeg);
    const freqScore = Math.max(0, 100 - freqErr * 0.75);
    const phaseScore = Math.max(0, 100 - phaseErr * 0.45);
    return Math.round(freqScore * 0.65 + phaseScore * 0.35);
  }, [activeMission?.firstContactData, fcFreq, fcPhase, liveTargetFreq]);

  const pdHarmonicAccuracy = useMemo(() => {
    if (!activeMission?.defenseData) return 0;
    const freqErr = Math.abs(pdShieldFreq - activeMission.defenseData.disruptorFreqThz);
    const nutErr = Math.abs(pdNutationDeg - activeMission.defenseData.optimalNutationDeg);
    const fScore = Math.max(0, 100 - freqErr * 1.25);
    const nScore = Math.max(0, 100 - nutErr * 0.4);
    return Math.round(fScore * 0.7 + nScore * 0.3);
  }, [activeMission?.defenseData, pdShieldFreq, pdNutationDeg]);

  const mrCalibrationAccuracy = useMemo(() => {
    if (!activeMission?.magnetosphereData) return 0;
    const freqErr = Math.abs(mrResonanceGhz - activeMission.magnetosphereData.targetResonanceGhz);
    const apErr = Math.abs(mrApertureDeg - activeMission.magnetosphereData.targetApertureDeg);
    const fScore = Math.max(0, 100 - freqErr * 2.2);
    const aScore = Math.max(0, 100 - apErr * 2.0);
    return Math.round(fScore * 0.6 + aScore * 0.4);
  }, [activeMission?.magnetosphereData, mrResonanceGhz, mrApertureDeg]);

  const handleFinalizeMission = (
    accuracyScore: number,
    diplomaticOrScienceScore: number,
    bonusCompleted: boolean
  ) => {
    soundEffects.playPromotionChime();
    const hull = shipState?.hullIntegrity ?? 100;
    const shields = shipState?.shieldIntegrity ?? 100;
    const tacticalEfficiencyScore = Math.round(hull * 0.65 + shields * 0.35);

    onCompleteMission({
      accuracyScore: Math.max(0, Math.min(100, Math.round(accuracyScore))),
      tacticalEfficiencyScore,
      diplomaticOrScienceScore: Math.max(0, Math.min(100, Math.round(diplomaticOrScienceScore))),
      elapsedSeconds: Math.max(10, elapsedSec),
      bonusCompleted,
    });
  };

  // --- Officer Profile Handlers ---
  const handleCreateOfficerCode = () => {
    setOfficerError(null);
    const prog = shipState.progression || {
      xp: 0,
      level: 1,
      rank: 'Ensign' as const,
      nextLevelXp: 500,
      totalEnemiesDestroyed: 0,
      scoutsDestroyed: 0,
      cruisersDestroyed: 0,
      mothershipsDestroyed: 0,
      activeThreatLevel: 'Standard' as const,
    };
    const record = officerProfileStore.createNewProfile(
      callsignInput.trim() || 'Starfleet Science Officer',
      prog,
      shipState.adaptiveDifficulty?.combatRating ?? 100
    );
    onProfileActivated(record);
  };

  const handleRestoreOfficerCode = (e: React.FormEvent) => {
    e.preventDefault();
    setOfficerError(null);
    const clean = restoreCodeInput.replace(/\D/g, '').slice(0, 6);
    if (clean.length !== 6) {
      setOfficerError('Enter a valid 6-digit Officer ID.');
      return;
    }
    const existing = officerProfileStore.restoreProfile(clean);
    if (!existing) {
      setOfficerError(`No profile found for #${clean}.`);
      return;
    }
    onProfileActivated(existing);
    setRestoreCodeInput('');
  };

  return (
    <>
      {/* 1. ON-DEMAND 6-DIGIT OFFICER ID HUD POPOVER (Top-Right Below Header, Non-Blocking) */}
      {isOfficerPopoverOpen && (
        <div className="fixed top-14 right-4 z-40 w-[330px] bg-slate-950/92 backdrop-blur-md border border-amber-500/70 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.25)] p-3 text-xs font-mono pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>6-Digit Exhibition ID</span>
            </div>
            <button
              onClick={onCloseOfficerPopover}
              className="p-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeOfficerCode ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-emerald-300 uppercase">Active Officer Code</div>
                  <div className="text-lg font-bold tracking-[0.2em] text-white tabular-nums">
                    {activeOfficerCode}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(activeOfficerCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 1800);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={onProfileDisconnected}
                    className="p-1 rounded bg-slate-900 hover:bg-red-950/60 border border-slate-700 text-slate-400 hover:text-red-300 cursor-pointer"
                    title="Disconnect Code"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[8.5px]">RANK</div>
                  <div className="text-amber-300 font-bold truncate">{shipState.progression?.rank || 'Ensign'}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[8.5px]">TOTAL XP</div>
                  <div className="text-cyan-300 font-bold">{(shipState.progression?.xp || 0).toLocaleString()}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[8.5px]">MISSIONS</div>
                  <div className="text-emerald-300 font-bold">{missionsCompletedCount}</div>
                </div>
              </div>
              {onOpenCommendation && (
                <button
                  onClick={() => {
                    onCloseOfficerPopover();
                    onOpenCommendation();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-cyan-400 hover:from-amber-400 hover:to-cyan-300 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer transition-all"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View / Print Mission Commendation</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => {
                    setOfficerTab('restore');
                    setOfficerError(null);
                  }}
                  className={`py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                    officerTab === 'restore' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Enter 6-Digit ID
                </button>
                <button
                  onClick={() => {
                    setOfficerTab('create');
                    setOfficerError(null);
                  }}
                  className={`py-1 rounded text-[10px] font-bold uppercase cursor-pointer ${
                    officerTab === 'create' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  New 6-Digit ID
                </button>
              </div>

              {officerTab === 'restore' ? (
                <form onSubmit={handleRestoreOfficerCode} className="space-y-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={restoreCodeInput}
                    onChange={(e) => setRestoreCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    placeholder="000000"
                    className="w-full py-1.5 px-2.5 rounded bg-slate-900 border border-cyan-500/40 text-center text-base font-bold tracking-[0.35em] text-cyan-300 focus:outline-none focus:border-cyan-400 select-text"
                  />
                  {officerError && (
                    <div className="text-[10px] text-red-300 bg-red-950/60 border border-red-500/40 rounded px-2 py-1">
                      {officerError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Restore Rank & XP</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={24}
                    value={callsignInput}
                    onChange={(e) => setCallsignInput(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    placeholder="Callsign (Optional)"
                    className="w-full py-1.5 px-2.5 rounded bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 select-text"
                  />
                  <button
                    onClick={handleCreateOfficerCode}
                    className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Generate 6-Digit ID</span>
                  </button>
                </div>
              )}

              {onOpenCommendation && (
                <button
                  onClick={() => {
                    onCloseOfficerPopover();
                    onOpenCommendation();
                  }}
                  className="w-full py-1.5 px-2.5 rounded bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>View / Print Mission Commendation</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. IN-HUD MISSION COMMAND SCANNER (Compact HUD Widget at Top-Center, Non-Blocking) */}
      {isMissionScannerOpen && (
        <div className="pointer-events-auto w-[94vw] max-w-[560px] bg-slate-950/90 backdrop-blur-md border border-amber-500/70 rounded-xl shadow-[0_0_35px_rgba(245,158,11,0.22)] p-3 text-xs font-mono animate-in fade-in zoom-in-95 duration-150">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-300 uppercase tracking-wider text-xs">
                Starfleet HUD Directive Scanner [J]
              </span>
              <span className="text-[10px] text-cyan-300">
                · {shipState.progression?.rank || 'Ensign'} ({(shipState.progression?.xp || 0).toLocaleString()} XP)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleScanDirectives()}
                disabled={isScanning}
                className="px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-cyan-400 hover:from-amber-400 hover:to-cyan-300 text-slate-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer"
              >
                <Radar className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning...' : 'Scan Deep Space'}</span>
              </button>
              <button
                onClick={onToggleMissionScanner}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Minimize HUD Scanner [J]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Archetype Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {(['random', 'first_contact', 'anomaly_investigation', 'planetary_defense', 'magnetosphere_rescue'] as const).map(
              (arch) => (
                <button
                  key={arch}
                  onClick={() => {
                    setSelectedArchetypeFilter(arch);
                    handleScanDirectives(arch);
                  }}
                  className={`px-2 py-1 rounded text-[9.5px] uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1 ${
                    selectedArchetypeFilter === arch
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {arch !== 'random' && ARCHETYPE_ICONS[arch]}
                  <span>{arch === 'random' ? 'All 4 Archetypes' : ARCHETYPE_LABELS[arch]}</span>
                </button>
              )
            )}
          </div>

          {/* Scanned Directive Summary Card */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-cyan-400 uppercase">
                  {ARCHETYPE_ICONS[scannedMission.archetype]}
                  <span>{scannedMission.archetypeLabel}</span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">
                    Tier {scannedMission.difficulty}/5 (+{scannedMission.baseXp} Base XP)
                  </span>
                </div>
                <div className="text-sm font-bold text-white uppercase tracking-wide mt-0.5">
                  {scannedMission.title}
                </div>
                <div className="text-[10.5px] text-slate-300">
                  Target: <strong className="text-amber-300">{scannedMission.targetPlanetName}</strong> ({scannedMission.targetSystemName})
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
              {scannedMission.scienceBriefing.summary}
            </p>

            {/* Real Astrophysics Briefing Snippet */}
            <div className="p-2 rounded bg-cyan-950/35 border border-cyan-500/30 text-[10.5px] text-cyan-100">
              <span className="font-bold text-cyan-300 uppercase">{scannedMission.scienceBriefing.conceptTitle}: </span>
              <span>{scannedMission.scienceBriefing.exhibitionFact}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1 gap-2">
              <div className="text-[10px] text-slate-400 truncate">
                Bonus (+180 XP): <span className="text-emerald-300">{scannedMission.bonusObjectiveText}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {activeMission && (
                  <button
                    onClick={onAbortMission}
                    className="px-2 py-1 rounded bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-200 text-[10px] uppercase font-bold cursor-pointer"
                  >
                    Abort Current
                  </button>
                )}
                <button
                  onClick={() => onAcceptMission(scannedMission)}
                  className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Accept & Launch Directive</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ACTIVE MISSION WAYPOINT COMPASS & IN-HUD INTERACTIVE MINI-GAME CONSOLE */}
      {activeMission && wp && wp.status !== 'completed' && (
        <div className="pointer-events-auto flex flex-col items-center gap-1.5 w-[94vw] max-w-[600px]">
          {/* Compact Waypoint Compass Strip */}
          <div
            className={`w-full px-3.5 py-2 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-3 transition-all ${
              wp.isInProximity
                ? 'bg-slate-950/92 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.28)]'
                : 'bg-slate-950/88 border-cyan-500/60 shadow-[0_0_20px_rgba(34,211,238,0.18)]'
            }`}
          >
            {/* Compass Dial */}
            <div className="relative w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
              <div className="absolute top-0.5 w-0.5 h-1 bg-slate-500" />
              <div className="absolute bottom-0.5 w-0.5 h-1 bg-slate-600" />
              <div className="absolute left-0.5 w-1 h-0.5 bg-slate-600" />
              <div className="absolute right-0.5 w-1 h-0.5 bg-slate-600" />
              <div
                className="w-full h-full flex items-center justify-center transition-transform duration-150"
                style={{ transform: `rotate(${wp.bearingDeg}deg)` }}
              >
                <Navigation
                  className={`w-4 h-4 -mt-0.5 ${
                    wp.isInProximity
                      ? 'text-emerald-400 fill-emerald-400/30'
                      : Math.abs(wp.bearingDeg) < 15
                      ? 'text-cyan-300 fill-cyan-400/30'
                      : 'text-amber-400 fill-amber-400/20'
                  }`}
                />
              </div>
            </div>

            {/* Telemetry */}
            <div className="flex-1 min-w-0 font-mono">
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-cyan-400 font-bold uppercase tracking-wider truncate">
                  {activeMission.title}
                </span>
                <span className="text-slate-500">→</span>
                <span className="text-amber-300 font-bold truncate">{wp.targetName}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10.5px] tabular-nums mt-0.5">
                <span className="text-slate-300">
                  DIST:{' '}
                  <strong className={wp.isInProximity ? 'text-emerald-300' : 'text-cyan-300'}>
                    {formatAstronomicalDistance(wp.distanceKm, 'compact')}
                  </strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">
                  HDG:{' '}
                  <strong className={Math.abs(wp.bearingDeg) <= 12 ? 'text-emerald-300' : 'text-amber-300'}>
                    {wp.bearingDeg > 0 ? `+${wp.bearingDeg}° STBD` : wp.bearingDeg < 0 ? `${wp.bearingDeg}° PORT` : '0° AHEAD'}
                  </strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-300">
                  ELEV:{' '}
                  <strong className="text-sky-300">
                    {wp.elevationDeg > 5 ? `+${wp.elevationDeg}° UP [W]` : wp.elevationDeg < -5 ? `${wp.elevationDeg}° DN [S]` : 'LEVEL'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Controls right inside HUD bar */}
            <div className="shrink-0 flex items-center gap-1.5 font-mono">
              {!wp.isInProximity && onWarpToMissionZone && (
                <button
                  onClick={() => onWarpToMissionZone(activeMission.targetSystemId, activeMission.targetPlanetId)}
                  className="px-2.5 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer"
                  title="Auto-align and warp to mission target zone"
                >
                  <Zap className="w-3 h-3" />
                  <span>Warp to Zone</span>
                </button>
              )}
              <button
                onClick={() => onSetMissionConsoleExpanded(!isMissionConsoleExpanded)}
                className={`px-2.5 py-1.5 rounded font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                  wp.isInProximity
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{isMissionConsoleExpanded ? 'Hide Console [E]' : 'Active Ops [E]'}</span>
                {isMissionConsoleExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button
                onClick={onAbortMission}
                className="p-1.5 rounded bg-slate-900 hover:bg-red-950 border border-slate-700 text-slate-400 hover:text-red-300 cursor-pointer"
                title="Abort Mission"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* IN-HUD INTERACTIVE 3-STAGE MISSION CONSOLE (Translucent, Compact, Connected to 3D Scene!) */}
          {isMissionConsoleExpanded && (
            <div className="w-full bg-slate-950/88 backdrop-blur-md border border-cyan-500/60 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.22)] p-3 text-xs font-mono space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Stage Progress & Live Action Feedback Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        if (st <= currentStage) setCurrentStage(st as 1 | 2 | 3);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer ${
                        currentStage === st
                          ? 'bg-amber-500 text-slate-950'
                          : st < currentStage
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 text-slate-500'
                      }`}
                    >
                      {st < currentStage && <CheckCircle2 className="w-3 h-3" />}
                      <span>Phase 0{st}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 tabular-nums">
                  <span className="truncate max-w-[230px] text-cyan-300/90">{activeMission.scienceBriefing.formulaOrLaw}</span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">{elapsedSec}s</span>
                </div>
              </div>

              {/* Plain-English Cosmic Fun Fact & 3D Environment Guide */}
              <div className="px-2.5 py-1.5 rounded bg-slate-900/95 border border-cyan-500/35 text-[10px] text-slate-200 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-amber-300 font-bold uppercase tracking-wider mr-1">
                    {activeMission.archetype === 'anomaly_investigation'
                      ? `🌌 3D ${activeMission.anomalyData?.anomalyType} Live in View:`
                      : activeMission.archetype === 'first_contact'
                      ? `🛸 3D ${activeMission.firstContactData?.speciesName} Flagship in Orbit:`
                      : activeMission.archetype === 'planetary_defense'
                      ? `⚔️ Live 3D Fleet Defense (${activeMission.defenseData?.outpostName}):`
                      : `🛡️ 3D Planetary Magnetosphere Crisis:`}
                  </span>
                  <span className="text-slate-300">{activeMission.scienceBriefing.exhibitionFact}</span>
                </div>
              </div>

              {actionBanner && (
                <div className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-400/60 text-emerald-200 text-[10.5px] font-bold flex items-center gap-1.5 animate-pulse">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{actionBanner}</span>
                </div>
              )}

              {/* ===================================================================
                  ARCHETYPE 1: FIRST CONTACT & XENOLINGUISTICS (LIVE 3D ENVOY LINK)
                  =================================================================== */}
              {activeMission.archetype === 'first_contact' && activeMission.firstContactData && (
                <div>
                  {currentStage === 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-bold uppercase text-[11px]">
                          1. Live Drifting Subspace Transceiver Lock ({fcLockedTransceivers}/3 Nodes)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setFcFreq(liveTargetFreq);
                              setFcPhase(activeMission.firstContactData!.targetPhaseDeg);
                              soundEffects.playLcarsBeep(880, 0.1);
                            }}
                            className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 text-[9px] font-bold uppercase cursor-pointer"
                            title="Snap sliders to match the alien carrier wave"
                          >
                            ⚡ Auto-Match Wave
                          </button>
                          <span className={`font-bold text-xs ${fcFreqAccuracy >= 80 ? 'text-emerald-400' : 'text-amber-300'}`}>
                            Coherence: {fcFreqAccuracy}%
                          </span>
                        </div>
                      </div>

                      {/* Live Animated Dual-Wave Constructive Interference Oscilloscope */}
                      <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
                        <svg viewBox="0 0 400 64" className="w-full h-14 bg-slate-950 rounded border border-slate-800/80">
                          {/* Alien Envoy Drifting Carrier Wave */}
                          <path
                            d={Array.from({ length: 80 })
                              .map((_, i) => {
                                const x = i * 5;
                                const freqNorm = liveTargetFreq / 400;
                                const phaseRad = (activeMission.firstContactData!.targetPhaseDeg * Math.PI) / 180 + animTick * 0.14;
                                const y = 32 + Math.sin(i * 0.18 * freqNorm + phaseRad) * 21;
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`;
                              })
                              .join(' ')}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="4 3"
                          />
                          {/* Enterprise Tuned Transceiver Wave */}
                          <path
                            d={Array.from({ length: 80 })
                              .map((_, i) => {
                                const x = i * 5;
                                const freqNorm = fcFreq / 400;
                                const phaseRad = (fcPhase * Math.PI) / 180 + animTick * 0.14;
                                const y = 32 + Math.sin(i * 0.18 * freqNorm + phaseRad) * 21;
                                return `${i === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`;
                              })
                              .join(' ')}
                            fill="none"
                            stroke={fcFreqAccuracy >= 80 ? '#10b981' : '#22d3ee'}
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400">Live Drift: {liveTargetFreq} MHz</span>
                            <span className="text-cyan-300 font-bold">{fcFreq.toFixed(1)} MHz</span>
                          </div>
                          <input
                            type="range"
                            min={Math.max(100, Math.floor(activeMission.firstContactData.targetFreqMhz - 80))}
                            max={Math.ceil(activeMission.firstContactData.targetFreqMhz + 80)}
                            step={0.5}
                            value={fcFreq}
                            onChange={(e) => setFcFreq(Number(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400">Target Phase: {activeMission.firstContactData.targetPhaseDeg}°</span>
                            <span className="text-amber-300 font-bold">{fcPhase}°</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={240}
                            step={5}
                            value={fcPhase}
                            onChange={(e) => setFcPhase(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (fcFreqAccuracy >= 75) {
                              const nextIdx = fcLockedTransceivers;
                              const nextCount = Math.min(3, fcLockedTransceivers + 1);
                              setFcLockedTransceivers(nextCount);
                              onTriggerMission3DAction?.('sensor_pulse', nextIdx);
                              triggerBanner(`3D Subspace Transceiver Node 0${nextCount}/03 Locked with ${activeMission.firstContactData!.vesselName}!`);
                              if (nextCount >= 3) {
                                setTimeout(() => setCurrentStage(2), 500);
                              }
                            } else {
                              soundEffects.playLcarsBeep(320, 0.15);
                              triggerBanner('Signal Coherence below 75% — match the amber wave frequency & phase first!');
                            }
                          }}
                          className={`flex-1 py-1.5 rounded font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            fcFreqAccuracy >= 75
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>
                            {fcFreqAccuracy >= 75
                              ? `Fire 3D Subspace Lock Pulse (${fcLockedTransceivers}/3 Locked)`
                              : 'Align Wave Coherence ≥ 75% to Pulse 3D Envoy Node'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {currentStage === 2 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-bold uppercase text-[11px]">
                          2. Universal Translator Xenolinguistic Matrix
                        </span>
                        <span className="text-[10px] text-emerald-300">
                          Decoded: {Object.keys(fcTokenSelections).length}/{activeMission.firstContactData.cipherSequence.length}
                        </span>
                      </div>
                      <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                        {activeMission.firstContactData.cipherSequence.map((packet, idx) => {
                          const picked = fcTokenSelections[idx];
                          const isCorrect = picked === packet.correctIndex;
                          return (
                            <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-amber-300 font-bold">{packet.prompt}</span>
                                {picked !== undefined && (
                                  <span className={`text-[9.5px] font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {isCorrect ? '✓ VERIFIED' : '✗ NOISE'}
                                  </span>
                                )}
                              </div>
                              <div className="text-[9.5px] text-slate-400">{packet.scientificHint}</div>
                              <div className="grid grid-cols-3 gap-1 pt-0.5">
                                {packet.options.map((opt, optIdx) => (
                                  <button
                                    key={opt}
                                    onClick={() => {
                                      setFcTokenSelections((prev) => ({ ...prev, [idx]: optIdx }));
                                      if (optIdx === packet.correctIndex) {
                                        soundEffects.playLcarsAcknowledge();
                                        onTriggerMission3DAction?.('sensor_pulse', idx);
                                      } else {
                                        soundEffects.playLcarsBeep(340, 0.12);
                                      }
                                    }}
                                    className={`text-left px-2 py-1 rounded text-[9.5px] border truncate cursor-pointer ${
                                      picked === optIdx
                                        ? optIdx === packet.correctIndex
                                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 font-bold'
                                          : 'bg-red-500/25 border-red-400 text-red-200 font-bold'
                                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-cyan-500/40'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => {
                          onTriggerMission3DAction?.('launch_probe', 1);
                          setCurrentStage(3);
                        }}
                        disabled={Object.keys(fcTokenSelections).length < activeMission.firstContactData.cipherSequence.length}
                        className={`w-full py-1.5 rounded font-bold text-[10.5px] uppercase tracking-wider cursor-pointer ${
                          Object.keys(fcTokenSelections).length >= activeMission.firstContactData.cipherSequence.length
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Transmit Decoded Matrix to 3D Envoy Cruiser → Phase 03
                      </button>
                    </div>
                  )}

                  {currentStage === 3 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-300 font-bold uppercase text-[11px]">
                          3. Live Bridge Diplomatic Exchange ({activeMission.firstContactData.speciesName})
                        </span>
                        <span className="text-emerald-300 font-bold text-[10.5px]">
                          Diplomatic Trust: {fcTrustScore}%
                        </span>
                      </div>

                      {/* Trust Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 transition-all duration-300"
                          style={{ width: `${Math.max(10, Math.min(100, fcTrustScore))}%` }}
                        />
                      </div>

                      {(() => {
                        const exchanges = activeMission.firstContactData!.diplomaticExchanges;
                        const activeEx = exchanges[Math.min(fcDiplomaticRound, exchanges.length - 1)];
                        return (
                          <div className="space-y-2">
                            <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10.5px] text-amber-200">
                              <div className="text-[9px] text-cyan-400 uppercase mb-0.5">
                                Incoming Visual Hail ({activeMission.firstContactData!.vesselName}):
                              </div>
                              "{activeEx.alienHail}"
                            </div>

                            {fcAlienReply ? (
                              <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-400/60 space-y-2">
                                <div className="text-[10.5px] text-emerald-200 font-bold">
                                  Envoy Response: "{fcAlienReply}"
                                </div>
                                <button
                                  onClick={() => {
                                    setFcAlienReply(null);
                                    if (fcDiplomaticRound + 1 < exchanges.length) {
                                      setFcDiplomaticRound((r) => r + 1);
                                    } else {
                                      const correctTokens = activeMission.firstContactData!.cipherSequence.filter(
                                        (t, idx) => fcTokenSelections[idx] === t.correctIndex
                                      ).length;
                                      const tokenAccuracy = Math.round(
                                        (correctTokens / activeMission.firstContactData!.cipherSequence.length) * 100
                                      );
                                      const avgAccuracy = Math.round(fcFreqAccuracy * 0.5 + tokenAccuracy * 0.5);
                                      handleFinalizeMission(avgAccuracy, fcTrustScore, avgAccuracy >= 88 && fcTrustScore >= 85);
                                    }
                                  }}
                                  className="w-full py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider cursor-pointer"
                                >
                                  {fcDiplomaticRound + 1 < exchanges.length
                                    ? 'Proceed to Final Diplomatic Accord →'
                                    : 'Conclude First Contact Accord & Claim XP'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {activeEx.choices.map((ch, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      const nextTrust = Math.max(20, Math.min(100, fcTrustScore + ch.scoreDelta));
                                      setFcTrustScore(nextTrust);
                                      setFcAlienReply(ch.alienResponse);
                                      onTriggerMission3DAction?.('sensor_pulse', idx);
                                    }}
                                    className="w-full text-left p-2 rounded border bg-slate-900 border-slate-800 text-slate-200 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all cursor-pointer"
                                  >
                                    <div className="text-[9px] text-cyan-300 uppercase mb-0.5">{ch.strategyTag}</div>
                                    <div className="text-[10.5px] font-bold">{ch.label}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================================
                  ARCHETYPE 2: ASTROPHYSICAL ANOMALY INVESTIGATION (INTERACTIVE LASER SPECTROMETER & 3D PROBES)
                  =================================================================== */}
              {activeMission.archetype === 'anomaly_investigation' && activeMission.anomalyData && (
                <div>
                  {currentStage === 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-bold uppercase text-[11px]">
                          1. Interactive Laser Optical Spectrometer ({anLockedLines.length}/{activeMission.anomalyData.spectralLines.length} Lines)
                        </span>
                        <span className="text-cyan-300 font-bold text-xs tabular-nums">
                          Laser: {anLaserNm} nm
                        </span>
                      </div>

                      {/* Visual Rainbow Emission Spectrum Bar with Fraunhofer Lines & Laser Reticle */}
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-2">
                        <div className="relative h-10 rounded overflow-hidden border border-slate-700 bg-gradient-to-r from-violet-950 via-sky-900 to-rose-950">
                          {activeMission.anomalyData.spectralLines.map((line, idx) => {
                            const pct = Math.max(4, Math.min(96, ((line.wavelengthNm - 100) / 600) * 100));
                            const isLocked = anLockedLines.includes(idx);
                            return (
                              <div
                                key={idx}
                                className="absolute top-0 bottom-0 flex flex-col items-center"
                                style={{ left: `${pct}%` }}
                              >
                                <div
                                  className={`w-1.5 h-full ${isLocked ? 'animate-pulse' : ''}`}
                                  style={{
                                    backgroundColor: isLocked ? '#10b981' : line.colorHex,
                                    boxShadow: `0 0 10px ${isLocked ? '#10b981' : line.colorHex}`,
                                  }}
                                />
                              </div>
                            );
                          })}

                          {/* User Laser Cursor */}
                          <div
                            className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_#ffffff] transition-all duration-75"
                            style={{ left: `${Math.max(2, Math.min(98, ((anLaserNm - 100) / 600) * 100))}%` }}
                          />
                        </div>

                        <input
                          type="range"
                          min={100}
                          max={700}
                          step={1}
                          value={anLaserNm}
                          onChange={(e) => setAnLaserNm(Number(e.target.value))}
                          className="w-full accent-purple-400 cursor-pointer"
                        />

                        {/* Spectral Line Status Tags */}
                        <div className="grid grid-cols-3 gap-1.5">
                          {activeMission.anomalyData.spectralLines.map((line, idx) => {
                            const isLocked = anLockedLines.includes(idx);
                            const isNear = Math.abs(anLaserNm - line.wavelengthNm) <= 18;
                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setAnLaserNm(Math.round(line.wavelengthNm));
                                  if (!anLockedLines.includes(idx)) {
                                    const next = [...anLockedLines, idx];
                                    setAnLockedLines(next);
                                    onTriggerMission3DAction?.('sensor_pulse', idx);
                                    triggerBanner(`Locked ${line.element} (${line.wavelengthNm} nm)! 3D Spectral Beam Fired.`);
                                    if (next.length >= activeMission.anomalyData!.spectralLines.length) {
                                      setTimeout(() => setCurrentStage(2), 500);
                                    }
                                  }
                                }}
                                className={`p-1.5 rounded border text-left text-[9.5px] cursor-pointer transition-all ${
                                  isLocked
                                    ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 font-bold'
                                    : isNear
                                    ? 'bg-purple-950/80 border-purple-400 text-white animate-pulse'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-purple-500/50'
                                }`}
                              >
                                <div className="font-bold truncate">{line.element}</div>
                                <div className="text-[8.5px] text-slate-400">
                                  {isLocked ? '✓ LOCKED IN 3D' : `Click or Tune ${line.wavelengthNm} nm`}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStage === 2 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-bold uppercase text-[11px]">
                          2. Relativistic Plasma Surge Containment ({anSurgeNeutralizedCount}/2 Surges)
                        </span>
                        <span className="text-amber-300 text-[10.5px]">
                          Flux: {activeMission.anomalyData.radiationFluxSvHr} Sv/hr
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-400">
                            Target Magnetic Containment: {activeMission.anomalyData.optimalMagneticTesla} T
                          </span>
                          <span className="text-cyan-300 font-bold">{anUserTesla.toFixed(1)} T</span>
                        </div>
                        <input
                          type="range"
                          min={2.0}
                          max={25.0}
                          step={0.5}
                          value={anUserTesla}
                          onChange={(e) => setAnUserTesla(Number(e.target.value))}
                          className="w-full accent-purple-400 cursor-pointer"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const err = Math.abs(anUserTesla - activeMission.anomalyData!.optimalMagneticTesla);
                          if (err <= 3.0) {
                            const next = anSurgeNeutralizedCount + 1;
                            setAnSurgeNeutralizedCount(next);
                            onTriggerMission3DAction?.('sensor_pulse', next);
                            triggerBanner(`Plasma Surge 0${next}/02 Contained via ${anUserTesla.toFixed(1)} T Multipole Field!`);
                            if (next >= 2) {
                              setTimeout(() => setCurrentStage(3), 450);
                            }
                          } else {
                            onTriggerHazardShake(0.6);
                            triggerBanner(`Containment mismatch (${anUserTesla.toFixed(1)} T vs ${activeMission.anomalyData!.optimalMagneticTesla} T)! Tune closer!`);
                          }
                        }}
                        className="w-full py-1.5 rounded bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider cursor-pointer"
                      >
                        Discharge 3D Magnetic Containment Pulse ({anSurgeNeutralizedCount}/2 Neutralized)
                      </button>
                    </div>
                  )}

                  {currentStage === 3 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-bold uppercase text-[11px]">
                          3. Launch 3D Class-VIII Quantum Probes ({anSweepHits}/3 Orbiting Nodes)
                        </span>
                        <span className="text-[10px] text-cyan-300">
                          Launch in [{activeMission.anomalyData.probeResonanceWindowMin}%–{activeMission.anomalyData.probeResonanceWindowMax}%]
                        </span>
                      </div>
                      <div className="relative h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="absolute top-0 bottom-0 bg-emerald-500/30 border-x border-emerald-400"
                          style={{
                            left: `${activeMission.anomalyData.probeResonanceWindowMin}%`,
                            width: `${
                              activeMission.anomalyData.probeResonanceWindowMax -
                              activeMission.anomalyData.probeResonanceWindowMin
                            }%`,
                          }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-2.5 bg-cyan-300 shadow-[0_0_12px_#22d3ee]"
                          style={{ left: `${anSweepPhase}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const inWindow =
                              anSweepPhase >= activeMission.anomalyData!.probeResonanceWindowMin - 8 &&
                              anSweepPhase <= activeMission.anomalyData!.probeResonanceWindowMax + 8;
                            if (inWindow) {
                              const nextHits = Math.min(3, anSweepHits + 1);
                              setAnSweepHits(nextHits);
                              onTriggerMission3DAction?.('launch_probe', nextHits - 1);
                              triggerBanner(`3D Class-VIII Probe 0${nextHits}/03 Impacted Quantum Node in 3D Space!`);
                            } else {
                              onTriggerHazardShake(0.8);
                              triggerBanner('Resonance window missed! Wait for the cyan needle to enter the green zone.');
                            }
                          }}
                          disabled={anSweepHits >= 3}
                          className={`flex-1 py-1.5 rounded font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                            anSweepHits >= 3
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow'
                          }`}
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          <span>
                            {anSweepHits >= 3 ? 'All 3 Quantum Probes Locked in 3D!' : 'Launch 3D Class-VIII Science Probe'}
                          </span>
                        </button>
                        {anSweepHits >= 3 && (
                          <button
                            onClick={() => {
                              const teslaAcc = Math.max(
                                0,
                                100 - Math.abs(anUserTesla - activeMission.anomalyData!.optimalMagneticTesla) * 6
                              );
                              const finalAcc = Math.round(100 * 0.55 + teslaAcc * 0.45);
                              handleFinalizeMission(finalAcc, 96, (shipState.hullIntegrity ?? 100) >= 85 && finalAcc >= 85);
                            }}
                            className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider cursor-pointer"
                          >
                            Complete Survey
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===================================================================
                  ARCHETYPE 3: PLANETARY DEFENSE (LIVE 3D FLEET DOGFIGHT & SATELLITES)
                  =================================================================== */}
              {activeMission.archetype === 'planetary_defense' && activeMission.defenseData && (() => {
                const aliveHostileShips = enemies.filter((e) => e && e.isAlive);
                const liveEnemiesAlive =
                  shipState.combatWaveState?.status === 'active'
                    ? Math.max(aliveHostileShips.length, shipState.combatWaveState?.enemiesAlive ?? 0)
                    : aliveHostileShips.length;
                const waveTotalShips =
                  shipState.combatWaveState?.totalEnemiesInWave ||
                  activeMission.defenseData.enemyWaveCount ||
                  3;
                const allHostilesDestroyed = pdWaveStarted && liveEnemiesAlive === 0;

                return (
                  <div>
                    {currentStage === 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-red-300 font-bold uppercase text-[11px]">
                            1. Disruptor Phase-Cancellation Radar ({activeMission.defenseData.factionDisplayName})
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setPdShieldFreq(activeMission.defenseData!.disruptorFreqThz);
                                setPdNutationDeg(activeMission.defenseData!.optimalNutationDeg);
                                soundEffects.playLcarsBeep(920, 0.1);
                              }}
                              className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 text-[9px] font-bold uppercase cursor-pointer"
                            >
                              ⚡ Auto-Tune Shields
                            </button>
                            <span className="text-emerald-400 font-bold text-xs">
                              Reflection: {pdHarmonicAccuracy}%
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-slate-400">
                                Hostile Disruptor: {activeMission.defenseData.disruptorFreqThz} THz
                              </span>
                              <span className="text-cyan-300 font-bold">{pdShieldFreq.toFixed(1)} THz</span>
                            </div>
                            <input
                              type="range"
                              min={180}
                              max={350}
                              step={0.5}
                              value={pdShieldFreq}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setPdShieldFreq(val);
                              }}
                              className="w-full accent-cyan-400 cursor-pointer"
                            />
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-slate-400">
                                Target Nutation: {activeMission.defenseData.optimalNutationDeg}°
                              </span>
                              <span className="text-amber-300 font-bold">{pdNutationDeg}°</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={180}
                              step={15}
                              value={pdNutationDeg}
                              onChange={(e) => setPdNutationDeg(Number(e.target.value))}
                              className="w-full accent-amber-400 cursor-pointer"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onSetShieldHarmonics(pdHarmonicAccuracy);
                            onTriggerMission3DAction?.('sensor_pulse', 0);
                            triggerBanner(`3D Multiphasic Shield Bubble Locked at ${pdHarmonicAccuracy}% Reflection!`);
                            setCurrentStage(2);
                          }}
                          disabled={pdHarmonicAccuracy < 75}
                          className={`w-full py-1.5 rounded font-bold text-[10.5px] uppercase tracking-wider cursor-pointer ${
                            pdHarmonicAccuracy >= 75
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {pdHarmonicAccuracy >= 75
                            ? `Energize 3D Multiphasic Shields (${pdHarmonicAccuracy}%) → Phase 02 Fleet Combat`
                            : 'Tune Frequency & Nutation Until Reflection ≥ 75%'}
                        </button>
                      </div>
                    )}

                    {currentStage === 2 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-red-300 font-bold uppercase text-[11px]">
                            2. Live 3D Fleet Engagement ({activeMission.defenseData.outpostName})
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-cyan-300">
                              Outpost Shield: <strong>{wp.defendedPlanetIntegrity ?? 100}%</strong>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded border font-bold text-[10.5px] ${
                                allHostilesDestroyed
                                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                                  : 'bg-red-950 border-red-500/50 text-red-200 animate-pulse'
                              }`}
                            >
                              {pdWaveStarted
                                ? allHostilesDestroyed
                                  ? '✓ ALL HOSTILES DESTROYED'
                                  : `Hostiles Remaining: ${liveEnemiesAlive}/${waveTotalShips}`
                                : `Wave Size: ${activeMission.defenseData.enemyWaveCount} Ships`}
                            </span>
                          </div>
                        </div>

                        {!pdWaveStarted ? (
                          <button
                            onClick={() => {
                              setPdWaveStarted(true);
                              onStartPlanetaryDefenseWave();
                              triggerBanner(
                                `RED ALERT: ${activeMission.defenseData!.enemyWaveCount} ${activeMission.defenseData!.factionDisplayName} Vessels Warping In! Destroy all hostiles!`
                              );
                            }}
                            className="w-full py-2 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] cursor-pointer"
                          >
                            ⚔️ Warp In {activeMission.defenseData.enemyWaveCount} {activeMission.defenseData.factionDisplayName} Vessels in 3D Space
                          </button>
                        ) : (
                          <div className="space-y-2">
                            {/* Synchronized Live 3D Enemy Squadron Target Roster */}
                            {aliveHostileShips.length > 0 && (
                              <div className="grid grid-cols-3 gap-1.5 bg-slate-950/90 p-1.5 rounded border border-red-500/35">
                                {aliveHostileShips.slice(0, 6).map((enemy) => {
                                  const isLocked = shipState.lockedEnemy?.id === enemy.id;
                                  const shieldPct = Math.round(enemy.shieldPercent ?? 100);
                                  const hullPct = Math.round(enemy.hullPercent ?? 100);
                                  return (
                                    <button
                                      key={enemy.id}
                                      onClick={() => onLockEnemy?.(enemy.id)}
                                      className={`p-1.5 rounded border text-left transition-all cursor-pointer ${
                                        isLocked
                                          ? 'bg-red-950/90 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.35)]'
                                          : 'bg-slate-900/90 border-slate-800 hover:border-red-400/60'
                                      }`}
                                      title="Click to lock weapons onto this hostile vessel"
                                    >
                                      <div className="flex items-center justify-between text-[9px] font-bold truncate">
                                        <span className={isLocked ? 'text-amber-300' : 'text-red-200'}>
                                          {isLocked ? '🎯 ' : ''}{enemy.name}
                                        </span>
                                      </div>
                                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-sky-400" style={{ width: `${shieldPct}%` }} />
                                      </div>
                                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                                        <div className="h-full bg-red-500" style={{ width: `${hullPct}%` }} />
                                      </div>
                                      <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                                        <span>SHD {shieldPct}%</span>
                                        <span className="text-red-300 font-bold">HULL {hullPct}%</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Live In-HUD Tactical Weapon Deck */}
                            <div className="grid grid-cols-4 gap-1.5">
                              <button
                                onClick={onTargetHostile}
                                className="py-1.5 px-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-amber-500/50 text-amber-300 font-bold text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Crosshair className="w-3 h-3" />
                                <span>Next [Tab]</span>
                              </button>
                              <button
                                onMouseDown={onStartPhaser}
                                onMouseUp={onStopPhaser}
                                onMouseLeave={onStopPhaser}
                                className="py-1.5 px-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Flame className="w-3 h-3" />
                                <span>Phaser [Space]</span>
                              </button>
                              <button
                                onClick={onFireTorpedo}
                                className="py-1.5 px-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Zap className="w-3 h-3" />
                                <span>Torp [T] ({shipState.torpedoCount})</span>
                              </button>
                              <button
                                disabled={pdEmpCooldown > 0}
                                onClick={() => {
                                  setPdEmpCooldown(4.0);
                                  onTriggerMission3DAction?.('sensor_pulse', 0);
                                  onSetShieldHarmonics(Math.min(100, pdHarmonicAccuracy + 10));
                                  triggerBanner('3D Deflector Polaron Pulse Fired — Shields Reinforced!');
                                }}
                                className={`py-1.5 px-1.5 rounded font-bold text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer ${
                                  pdEmpCooldown > 0
                                    ? 'bg-slate-900 text-slate-500 cursor-not-allowed'
                                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                                }`}
                              >
                                <Shield className="w-3 h-3" />
                                <span>{pdEmpCooldown > 0 ? `${pdEmpCooldown.toFixed(0)}s` : 'Deflector Pulse'}</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800">
                              <span>
                                {allHostilesDestroyed
                                  ? 'All hostile ships destroyed! Proceed to Phase 03 to lock the orbital defense grid.'
                                  : `Destroy all ${liveEnemiesAlive} remaining enemy vessel${liveEnemiesAlive === 1 ? '' : 's'} in 3D space to secure the sector!`}
                              </span>
                              <button
                                onClick={() => setCurrentStage(3)}
                                disabled={!allHostilesDestroyed}
                                className={`px-3 py-1 rounded font-bold uppercase shrink-0 ml-2 ${
                                  allHostilesDestroyed
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 animate-pulse cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                }`}
                              >
                                {allHostilesDestroyed
                                  ? 'Fleet Destroyed → Phase 03'
                                  : `${liveEnemiesAlive} Hostile${liveEnemiesAlive === 1 ? '' : 's'} Left`}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {currentStage === 3 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-red-300 font-bold uppercase text-[11px]">
                            3. Beam-Charge 3D Orbital Defense Satellites
                          </span>
                          <span className="text-[10px] text-cyan-300">
                            Click each satellite to fire a 3D Deflector Power Beam
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {['Satellite Alpha', 'Satellite Beta', 'Satellite Gamma'].map((node, i) => (
                            <button
                              key={node}
                              onClick={() => {
                                setPdGridNodes((prev) => {
                                  const next = [...prev];
                                  next[i] = true;
                                  return next;
                                });
                                onTriggerMission3DAction?.('activate_node', i);
                                triggerBanner(`3D Power Beam Locked → ${node} ONLINE in Orbit!`);
                              }}
                              className={`p-2 rounded border text-center text-[10px] font-bold uppercase cursor-pointer transition-all ${
                                pdGridNodes[i]
                                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-cyan-400'
                              }`}
                            >
                              {pdGridNodes[i] ? '✓ 3D SAT ONLINE' : '⚡ BEAM CHARGE'}
                              <div className="text-[9px] font-normal text-slate-400 truncate mt-0.5">{node}</div>
                            </button>
                          ))}
                        </div>
                        {pdGridNodes.every(Boolean) && (
                          <button
                            disabled={!allHostilesDestroyed}
                            onClick={() => {
                              handleFinalizeMission(
                                pdHarmonicAccuracy,
                                100,
                                pdHarmonicAccuracy >= 88 && (shipState.hullIntegrity ?? 100) >= 75
                              );
                            }}
                            className={`w-full py-1.5 rounded font-bold text-[10.5px] uppercase tracking-wider ${
                              allHostilesDestroyed
                                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {allHostilesDestroyed
                              ? 'Complete Planetary Defense & Claim XP'
                              : `Destroy Remaining ${liveEnemiesAlive} Hostile Ship(s) First`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ===================================================================
                  ARCHETYPE 4: MAGNETOSPHERE & ECOLOGICAL RESCUE (3-CUSP 3D DEFLECTOR BEAMS)
                  =================================================================== */}
              {activeMission.archetype === 'magnetosphere_rescue' && activeMission.magnetosphereData && (
                <div>
                  {currentStage === 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-300 font-bold uppercase text-[11px]">
                          1. Deflector Cyclotron Calibration ({activeMission.magnetosphereData.crisisType})
                        </span>
                        <span className="text-emerald-400 font-bold text-xs">
                          Alignment: {mrCalibrationAccuracy}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400">Target: {activeMission.magnetosphereData.targetResonanceGhz} GHz</span>
                            <span className="text-cyan-300 font-bold">{mrResonanceGhz.toFixed(1)} GHz</span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={90}
                            step={0.5}
                            value={mrResonanceGhz}
                            onChange={(e) => setMrResonanceGhz(Number(e.target.value))}
                            className="w-full accent-cyan-400 cursor-pointer"
                          />
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400">Target Aperture: {activeMission.magnetosphereData.targetApertureDeg}°</span>
                            <span className="text-amber-300 font-bold">{mrApertureDeg}°</span>
                          </div>
                          <input
                            type="range"
                            min={5}
                            max={60}
                            step={1}
                            value={mrApertureDeg}
                            onChange={(e) => setMrApertureDeg(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onTriggerMission3DAction?.('sensor_pulse', 0);
                          triggerBanner(`Deflector Dish Charged with ${activeMission.magnetosphereData!.recommendedParticle}!`);
                          setCurrentStage(2);
                        }}
                        disabled={mrCalibrationAccuracy < 75}
                        className={`w-full py-1.5 rounded font-bold text-[10.5px] uppercase tracking-wider cursor-pointer ${
                          mrCalibrationAccuracy >= 75
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {mrCalibrationAccuracy >= 75
                          ? `Lock Deflector Matrix (${mrCalibrationAccuracy}%) → Phase 02 3D Beam Firing`
                          : 'Calibrate Sliders Until Alignment ≥ 75%'}
                      </button>
                    </div>
                  )}

                  {currentStage === 2 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-300 font-bold uppercase text-[11px]">
                          2. Fire 3D {activeMission.magnetosphereData.recommendedParticle} into 3 Planetary Cusps
                        </span>
                        <span className="text-[10px] text-cyan-300">
                          Fire in Window [35%–65%]
                        </span>
                      </div>
                      <div className="relative h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                        <div className="absolute top-0 bottom-0 left-[35%] w-[30%] bg-emerald-500/30 border-x border-emerald-400" />
                        <div
                          className="absolute top-0 bottom-0 w-2.5 bg-amber-300 shadow-[0_0_12px_#fbbf24]"
                          style={{ left: `${mrWindowCursor}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {['North Polar Cusp', 'Equatorial Belt', 'South Polar Cusp'].map((cuspName, idx) => (
                          <button
                            key={cuspName}
                            disabled={mrCuspsCharged[idx]}
                            onClick={() => {
                              const dist = Math.abs(mrWindowCursor - 50);
                              const shotAcc = Math.round(Math.max(55, 100 - dist * 1.2));
                              setMrBeamAccuracySum((prev) => prev + shotAcc);
                              setMrCuspsCharged((prev) => {
                                const next = [...prev];
                                next[idx] = true;
                                if (next.every(Boolean)) {
                                  setMrShieldRestoration(100);
                                  setTimeout(() => setCurrentStage(3), 550);
                                } else {
                                  setMrShieldRestoration((r) => Math.min(95, r + 28));
                                }
                                return next;
                              });
                              onTriggerMission3DAction?.('stabilize_field', idx);
                              triggerBanner(`3D Deflector Beam Fired → ${cuspName} Restored (${shotAcc}% Resonance)!`);
                            }}
                            className={`p-2 rounded border text-center text-[10px] font-bold uppercase cursor-pointer transition-all ${
                              mrCuspsCharged[idx]
                                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300'
                                : 'bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border-cyan-400 text-white hover:bg-cyan-500/30'
                            }`}
                          >
                            {mrCuspsCharged[idx] ? '✓ CUSP RESTORED' : '🔥 FIRE 3D BEAM'}
                            <div className="text-[8.5px] font-normal text-slate-300 truncate mt-0.5">{cuspName}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentStage === 3 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-300 font-bold uppercase text-[11px]">
                          3. Planetary Magnetopause Stabilized ({mrShieldRestoration}%)
                        </span>
                        <span className="text-cyan-300 text-[10px]">3D Planetary Shield Cage Active</span>
                      </div>
                      <button
                        onClick={() => {
                          const avgBeamAcc = Math.round(mrBeamAccuracySum / 3) || 88;
                          const combinedAcc = Math.round(mrCalibrationAccuracy * 0.5 + avgBeamAcc * 0.5);
                          handleFinalizeMission(combinedAcc, 98, combinedAcc >= 88);
                        }}
                        className="w-full py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10.5px] uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      >
                        Complete Ecological Rescue & Claim XP
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. IN-HUD MISSION DEBRIEF & XP BREAKDOWN CARD (Compact Top-Center HUD Card, Non-Blocking) */}
      {lastMissionReport && (
        <div className="pointer-events-auto w-[94vw] max-w-[520px] bg-slate-950/92 backdrop-blur-md border border-emerald-400/80 rounded-xl shadow-[0_0_35px_rgba(16,185,129,0.28)] p-3 text-xs font-mono space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-lg font-black text-emerald-300">
                {lastMissionReport.grade}
              </div>
              <div>
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  DIRECTIVE COMPLETE · +{lastMissionReport.totalXpEarned} XP
                </div>
                <div className="text-xs font-bold text-white uppercase">{lastMissionReport.missionTitle}</div>
              </div>
            </div>
            <button
              onClick={onClearDebrief}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[8.5px]">BASE</div>
              <div className="text-white font-bold">+{lastMissionReport.baseXpEarned}</div>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[8.5px]">ACCURACY ({lastMissionReport.accuracyScore}%)</div>
              <div className="text-cyan-300 font-bold">+{lastMissionReport.accuracyBonusXp}</div>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[8.5px]">TACTICAL ({lastMissionReport.tacticalEfficiencyScore}%)</div>
              <div className="text-amber-300 font-bold">+{lastMissionReport.tacticalBonusXp}</div>
            </div>
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[8.5px]">SPEED/BONUS</div>
              <div className="text-emerald-300 font-bold">+{lastMissionReport.speedBonusXp}</div>
            </div>
          </div>

          {/* Rank & XP Bar */}
          <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-bold uppercase">
                {lastMissionReport.newRank} (Lvl {lastMissionReport.newLevel})
              </span>
              {lastMissionReport.promoted && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold text-[9px] uppercase">
                  PROMOTED!
                </span>
              )}
            </div>
            <span className="text-cyan-300 font-bold tabular-nums">
              {lastMissionReport.newXp.toLocaleString()} / {lastMissionReport.nextLevelXp.toLocaleString()} XP
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between pt-1 gap-1.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenOfficerPopover}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>{activeOfficerCode ? `ID #${activeOfficerCode}` : 'Save 6-Digit ID'}</span>
              </button>
              {onOpenCommendation && (
                <button
                  onClick={onOpenCommendation}
                  className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow cursor-pointer"
                >
                  <Award className="w-3 h-3" />
                  <span>View / Print Commendation</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onClearDebrief();
                  onToggleMissionScanner();
                }}
                className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Scan Next Directive</span>
              </button>
              <button
                onClick={onClearDebrief}
                className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase cursor-pointer"
              >
                Resume Flight
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
