import React, { useState } from 'react';
import {
  CameraViewMode,
  ShipState,
  CelestialTarget,
  TacticalLogEvent,
  SolarSystem,
  StarfleetMission,
  MissionPerformanceReport,
  OfficerProfileRecord,
} from '../types/simulation';
import { TacticalHUDTicker } from './TacticalLogConsole';
import { HUDMissionOverlay } from './HUDMissionOverlay';
import {
  formatAstronomicalDistance,
  formatStarshipVelocity,
  getKinematicVelocityTelemetry,
} from '../utils/scaleFormatters';
import {
  Target,
  Zap,
  Shield,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Anchor,
  Rocket,
  Wrench,
  RefreshCw,
  Flame,
  BatteryCharging,
} from 'lucide-react';

interface FlightHUDProps {
  shipState: ShipState | null;
  currentView: CameraViewMode;
  targets: CelestialTarget[];
  solarSystems?: SolarSystem[];
  enemies?: any[];
  enemiesAliveCount?: number;
  onLockEnemy?: (enemyId: string) => void;
  onDisengageWarp?: () => void;
  onSetWarpFactor?: (factor: number) => void;
  onSummonNextWave?: () => void;
  onDock?: (stationId?: string) => void;
  onUndock?: () => void;
  onOpenStationOps?: () => void;
  onDeployDrones?: (count: number, mode: 'ablative' | 'structural' | 'microweld' | 'overhaul') => void;
  onRecallDrones?: () => void;
  onToggleClamps?: () => void;
  onToggleShorePower?: () => void;
  onRefuelAntimatter?: () => void;
  onReloadTorpedoes?: (type: 'photon' | 'quantum' | 'tricobalt') => void;
  onPurgeCoolant?: () => void;
  onGrantShoreLeave?: () => void;
  onTestDamageDemo?: () => void;
  onToggleNavigation?: () => void;
  onGoToNearestSpaceDock?: () => void;
  onTriggerBoost?: () => void;
  onClearTarget?: () => void;
  // In-HUD Mission & Officer Props
  activeMission?: StarfleetMission | null;
  lastMissionReport?: MissionPerformanceReport | null;
  isMissionScannerOpen?: boolean;
  isMissionConsoleExpanded?: boolean;
  isOfficerPopoverOpen?: boolean;
  activeOfficerCode?: string | null;
  missionsCompletedCount?: number;
  onToggleMissionScanner?: () => void;
  onSetMissionConsoleExpanded?: (expanded: boolean) => void;
  onCloseOfficerPopover?: () => void;
  onOpenOfficerPopover?: () => void;
  onAcceptMission?: (mission: StarfleetMission) => void;
  onAbortMission?: () => void;
  onClearDebrief?: () => void;
  onWarpToMissionZone?: (systemId: string, planetId: string) => void;
  onSetShieldHarmonics?: (efficiencyPercent: number) => void;
  onStartPlanetaryDefenseWave?: () => void;
  onFireDeflectorBeam?: (coords?: [number, number, number], colorHex?: number, duration?: number) => void;
  onTriggerHazardShake?: (intensity?: number) => void;
  onTriggerMission3DAction?: (action: 'sensor_pulse' | 'launch_probe' | 'activate_node' | 'stabilize_field', nodeIndex?: number) => void;
  onStartPhaser?: () => void;
  onStopPhaser?: () => void;
  onFireTorpedo?: () => void;
  onTargetHostile?: () => void;
  onCompleteMission?: (metrics: {
    accuracyScore: number;
    tacticalEfficiencyScore: number;
    diplomaticOrScienceScore: number;
    elapsedSeconds: number;
    bonusCompleted: boolean;
  }) => void;
  onProfileActivated?: (profile: OfficerProfileRecord) => void;
  onProfileDisconnected?: () => void;
  recentLogs?: TacticalLogEvent[];
  onOpenFullLog?: () => void;
  isScannerOpen?: boolean;
}

export const FlightHUD: React.FC<FlightHUDProps> = ({
  shipState,
  currentView,
  targets,
  solarSystems = [],
  enemies = [],
  enemiesAliveCount = 0,
  onLockEnemy,
  onDisengageWarp,
  onSetWarpFactor,
  onSummonNextWave,
  onDock,
  onUndock,
  onDeployDrones,
  onRecallDrones,
  onToggleClamps,
  onToggleShorePower,
  onRefuelAntimatter,
  onReloadTorpedoes,
  onPurgeCoolant,
  onGrantShoreLeave,
  onTestDamageDemo,
  onToggleNavigation,
  onGoToNearestSpaceDock,
  onTriggerBoost,
  onClearTarget,
  activeMission = null,
  lastMissionReport = null,
  isMissionScannerOpen = false,
  isMissionConsoleExpanded = false,
  isOfficerPopoverOpen = false,
  activeOfficerCode = null,
  missionsCompletedCount = 0,
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
  onTriggerHazardShake,
  onTriggerMission3DAction,
  onStartPhaser,
  onStopPhaser,
  onFireTorpedo,
  onTargetHostile,
  onCompleteMission,
  onProfileActivated,
  onProfileDisconnected,
  recentLogs,
  onOpenFullLog,
  isScannerOpen = false,
}) => {
  const [isOrdnanceCollapsed, setIsOrdnanceCollapsed] = useState<boolean>(false);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState<boolean>(false);
  const [droneCountSelect, setDroneCountSelect] = useState<number>(4);

  if (!shipState) return null;

  const isRedAlert = shipState.alertLevel === 'red';
  const selectedTarget = targets.find((t) => t.id === shipState.selectedTargetId);
  const stationOps = shipState.stationOperations;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none">
      {/* Red Alert Screen Edge Warning Pulse */}
      {isRedAlert && (
        <div className="absolute inset-0 border-4 border-red-600/70 shadow-[inset_0_0_50px_rgba(220,38,38,0.35)] animate-pulse pointer-events-none" />
      )}

      {/* Spacetime-Warping Gravitational Lensing & White Hole Ejection Visual Overlay */}
      {shipState.blackHoleTransit?.active && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {/* Radial Relativistic Lensing & Chromatic Horizon Ring */}
          {(shipState.blackHoleTransit.phase === 'infall' || shipState.blackHoleTransit.phase === 'singularity') && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[140vw] h-[140vw] rounded-full border-[24px] border-purple-500/35 shadow-[inset_0_0_160px_rgba(168,85,247,0.65),0_0_140px_rgba(56,189,248,0.55)] animate-spin" />
              <div className="absolute w-[92vw] h-[92vw] rounded-full border-[12px] border-amber-400/45 shadow-[inset_0_0_120px_rgba(249,115,22,0.55)] animate-ping" />
              {shipState.blackHoleTransit.phase === 'singularity' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-950/55 via-cyan-500/25 to-fuchsia-950/55 mix-blend-screen animate-pulse" />
              )}
            </div>
          )}

          {/* White Hole / White Dwarf Ejection Flash into Qo'noS */}
          {shipState.blackHoleTransit.phase === 'ejection' && (
            <div
              className="absolute inset-0 bg-gradient-to-b from-cyan-100/70 via-sky-300/40 to-transparent mix-blend-screen transition-opacity duration-300"
              style={{ opacity: Math.max(0, 1 - shipState.blackHoleTransit.progress) }}
            />
          )}
        </div>
      )}

      {/* Top Unobtrusive Status & Notification Stack (Anchored right below LCARS Header, completely clear of starship and chase view) */}
      <div className={`absolute ${currentView === 'interior_bridge' ? 'top-28' : 'top-14 sm:top-15'} left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none max-w-[95vw]`}>
        {/* IN-HUD MISSION OVERLAY (Scanner, Waypoint Compass, Active 3-Stage Mini-Games, Debrief & 6-Digit ID) */}
        {(currentView !== 'interior_bridge' ||
          isMissionScannerOpen ||
          isMissionConsoleExpanded ||
          isOfficerPopoverOpen ||
          Boolean(activeMission) ||
          Boolean(lastMissionReport)) &&
          onToggleMissionScanner &&
          onSetMissionConsoleExpanded &&
          onCloseOfficerPopover &&
          onOpenOfficerPopover &&
          onAcceptMission &&
          onAbortMission &&
          onClearDebrief &&
          onSetShieldHarmonics &&
          onStartPlanetaryDefenseWave &&
          onFireDeflectorBeam &&
          onTriggerHazardShake &&
          onCompleteMission &&
          onProfileActivated &&
          onProfileDisconnected && (
            <HUDMissionOverlay
              shipState={shipState}
              solarSystems={solarSystems}
              activeMission={activeMission}
              lastMissionReport={lastMissionReport}
              enemies={enemies}
              enemiesAliveCount={enemiesAliveCount}
              onLockEnemy={onLockEnemy}
              isMissionScannerOpen={isMissionScannerOpen}
              isMissionConsoleExpanded={isMissionConsoleExpanded}
              isOfficerPopoverOpen={isOfficerPopoverOpen}
              activeOfficerCode={activeOfficerCode}
              missionsCompletedCount={missionsCompletedCount}
              onToggleMissionScanner={onToggleMissionScanner}
              onSetMissionConsoleExpanded={onSetMissionConsoleExpanded}
              onCloseOfficerPopover={onCloseOfficerPopover}
              onOpenOfficerPopover={onOpenOfficerPopover}
              onAcceptMission={onAcceptMission}
              onAbortMission={onAbortMission}
              onClearDebrief={onClearDebrief}
              onWarpToMissionZone={onWarpToMissionZone}
              onSetShieldHarmonics={onSetShieldHarmonics}
              onStartPlanetaryDefenseWave={onStartPlanetaryDefenseWave}
              onFireDeflectorBeam={onFireDeflectorBeam}
              onTriggerHazardShake={onTriggerHazardShake}
              onTriggerMission3DAction={onTriggerMission3DAction}
              onStartPhaser={onStartPhaser}
              onStopPhaser={onStopPhaser}
              onFireTorpedo={onFireTorpedo}
              onTargetHostile={onTargetHostile}
              onCompleteMission={onCompleteMission}
              onProfileActivated={onProfileActivated}
              onProfileDisconnected={onProfileDisconnected}
            />
          )}
        {/* BLACK HOLE GRAVITATIONAL PULL & SINGULARITY TRANSIT BANNER */}
        {shipState.blackHoleTransit?.active && (
          <div className={`px-4 py-1.5 rounded-xl border text-center shadow-2xl flex flex-col items-center gap-0.5 min-w-[310px] max-w-[480px] pointer-events-auto backdrop-blur-md ${
            shipState.blackHoleTransit.phase === 'ejection'
              ? 'bg-cyan-950/95 border-cyan-300 shadow-cyan-500/40'
              : shipState.blackHoleTransit.phase === 'singularity' || shipState.blackHoleTransit.phase === 'infall'
              ? 'bg-purple-950/95 border-fuchsia-400 shadow-purple-500/50 animate-pulse'
              : 'bg-amber-950/95 border-amber-400 shadow-amber-500/30'
          }`}>
            <div className="text-[11px] font-trek font-bold uppercase tracking-wider flex items-center gap-2 text-white">
              <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
                shipState.blackHoleTransit.phase === 'ejection' ? 'bg-cyan-300' : 'bg-fuchsia-400'
              }`} />
              <span>
                {shipState.blackHoleTransit.phase === 'pulling' && '🌀 GRAVITATIONAL WELL: SOL BLACK HOLE PULLING SHIP'}
                {shipState.blackHoleTransit.phase === 'infall' && '⚠️ CROSSING EVENT HORIZON · TIDAL INFALL'}
                {shipState.blackHoleTransit.phase === 'singularity' && '🌌 SPACETIME SINGULARITY WARP · EINSTEIN-ROSEN BRIDGE'}
                {shipState.blackHoleTransit.phase === 'ejection' && "✨ WHITE HOLE EJECTION · ARRIVING IN QO'NOS SYSTEM"}
              </span>
            </div>
            <div className="text-[9.5px] font-mono-nums text-slate-200 flex items-center gap-2">
              {shipState.blackHoleTransit.phase === 'pulling' ? (
                <>
                  <span>Event Horizon Range: <strong className="text-amber-300">{formatAstronomicalDistance(shipState.blackHoleTransit.distance, 'compact')}</strong></span>
                  <span>·</span>
                  <span>Pull Intensity: <strong className="text-fuchsia-300">{Math.round(shipState.blackHoleTransit.progress * 100)}%</strong></span>
                </>
              ) : shipState.blackHoleTransit.phase === 'ejection' ? (
                <span className="text-cyan-200">Ejected from Qo'noS White Dwarf Singularity into Klingon Homeworld Sector</span>
              ) : (
                <span className="text-fuchsia-200">Extreme Relativistic Lensing · Warping Spacetime Continuum to Qo'noS</span>
              )}
            </div>
            <div className="w-full h-1 bg-slate-900/90 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all duration-100 ${
                  shipState.blackHoleTransit.phase === 'ejection'
                    ? 'bg-cyan-300 shadow-[0_0_8px_#67e8f9]'
                    : 'bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400'
                }`}
                style={{ width: `${Math.max(8, Math.min(100, Math.round(shipState.blackHoleTransit.progress * 100)))}%` }}
              />
            </div>
          </div>
        )}
        {/* CRITICAL ALERT: INCOMING HOSTILE TORPEDO (Compact & Sleek) */}
        {shipState.hasIncomingTorpedo && (
          <div className="px-3.5 py-1 rounded-lg bg-red-600/95 border border-amber-300 text-center shadow-lg shadow-red-950/80 animate-bounce pointer-events-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="text-white font-trek font-bold text-xs uppercase tracking-wider">
              ⚠️ CRITICAL: INCOMING TORPEDO!
            </span>
            <span className="px-1.5 py-0.5 rounded bg-black/50 text-[9px] text-amber-200 font-mono-nums">
              EVASIVE BOOST [SHIFT]
            </span>
          </div>
        )}

        {/* Evasive Boost Active Banner (Sleek, Compact, Non-obtrusive) */}
        {shipState.isBoostActive && (
          <div className="px-3.5 py-1 rounded-xl bg-cyan-950/90 border border-cyan-400 text-center shadow-lg shadow-cyan-950/80 flex flex-col items-center gap-0.5 min-w-[280px] max-w-[420px] pointer-events-auto">
            <div className="text-[11px] font-trek text-cyan-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>⚡ EVASIVE OVERDRIVE [{Math.round(shipState.boostCharge ?? 0)}%]</span>
              <span className="text-cyan-400/60">·</span>
              <span className="text-[10px] text-cyan-300 font-mono-nums">{formatStarshipVelocity(false, shipState.warpFactor, shipState.throttlePercent, true, true)}</span>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-cyan-300/80 font-mono-nums">
              <span>75% Disruptor Deflection</span>
              <span>·</span>
              <span className="text-amber-300">Press [Shift] to Stop</span>
            </div>
            {/* Dynamic Slim Depletion Bar */}
            <div className="w-full h-1 bg-slate-900/90 rounded-full overflow-hidden mt-0.5">
              <div
                className="h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] transition-all duration-100"
                style={{ width: `${Math.max(0, Math.min(100, shipState.boostCharge ?? 0))}%` }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Bridge / Helm Viewscreen Targeting Crosshair */}
      {(currentView === 'bridge' || currentView === 'chase') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center opacity-70">
            {/* Center reticle */}
            <div className="w-2.5 h-2.5 rounded-full border border-sky-400/80 bg-sky-400/20" />
            
            {/* Crosshair ticks */}
            <div className="absolute top-0 w-0.5 h-4 bg-sky-400/60" />
            <div className="absolute bottom-0 w-0.5 h-4 bg-sky-400/60" />
            <div className="absolute left-0 w-4 h-0.5 bg-sky-400/60" />
            <div className="absolute right-0 w-4 h-0.5 bg-sky-400/60" />

            {/* Tactical brackets */}
            <div className={`absolute inset-0 border rounded-full transition-colors ${
              shipState.lockedEnemy ? 'border-red-500/80 animate-pulse' : 'border-sky-500/30'
            }`} />
            
            {/* Target vector cue if locked on planet */}
            {selectedTarget && !shipState.lockedEnemy && (
              <div className="absolute -bottom-8 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/85 border border-sky-500/40 text-[10px] font-mono-nums text-sky-300 pointer-events-auto">
                <Target className="w-3 h-3 text-sky-400" />
                <span className="font-semibold text-white">{selectedTarget.name}</span>
                <span className="text-slate-400">· {formatAstronomicalDistance(selectedTarget.distance, 'compact')}</span>
                {onClearTarget && (
                  <button
                    onClick={onClearTarget}
                    className="ml-1 px-1.5 py-0.2 rounded bg-slate-800 hover:bg-red-600/70 text-slate-300 hover:text-white border border-slate-700 text-[8.5px] font-trek uppercase font-bold transition-colors shadow-sm"
                    title="Deselect Target / Clear Navigation Path [Z Key]"
                  >
                    × [Z]
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ENEMY TARGET LOCK BOX */}
      {shipState.lockedEnemy && currentView !== 'interior_bridge' && (
        <div className={`absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 p-3 backdrop-blur-md rounded-xl shadow-2xl text-xs font-mono-nums min-w-[340px] pointer-events-auto z-30 ${
          shipState.lockedEnemy.isMothership
            ? 'bg-amber-950/90 border-2 border-amber-500 shadow-amber-900/50'
            : 'bg-red-950/85 border border-red-500/70'
        }`}>
          <div className="flex items-center justify-between border-b border-red-800/80 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-trek font-bold text-red-200 uppercase tracking-wider">
                {shipState.lockedEnemy.isMothership ? '👑 FLAGSHIP:' : 'HOSTILE:'} {shipState.lockedEnemy.name}
              </span>
              {shipState.lockedEnemy.isElite && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded text-[9px] font-trek font-bold">
                  ELITE
                </span>
              )}
              {shipState.lockedEnemy.isCloaked && (
                <span className="px-1.5 py-0.2 bg-cyan-700 text-cyan-100 rounded text-[9px] font-mono animate-pulse">
                  CLOAKED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {shipState.lockedEnemy.rank && (
                <span className="text-[10px] text-amber-300 font-mono">
                  [{shipState.lockedEnemy.rank}]
                </span>
              )}
              <span className="px-1.5 py-0.5 rounded bg-red-900/60 text-[10px] uppercase font-semibold text-red-200">
                {shipState.lockedEnemy.faction}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 mb-2 flex items-center justify-between">
            <span className={shipState.lockedEnemy.isMothership ? 'text-amber-300 font-bold' : ''}>
              Class: {shipState.lockedEnemy.shipClass}
            </span>
            <span className="text-red-300 font-bold">{formatAstronomicalDistance(shipState.lockedEnemy.distanceToPlayer, 'compact')}</span>
          </div>

          {/* Enemy Shields & Hull */}
          <div className="space-y-1 mb-2">
            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                <span>Shields</span>
                <span className="text-sky-300 font-bold">{shipState.lockedEnemy.shieldPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-100"
                  style={{ width: `${shipState.lockedEnemy.shieldPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                <span>Hull Integrity</span>
                <span className="text-red-400 font-bold">{shipState.lockedEnemy.hullPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${shipState.lockedEnemy.hullPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-amber-300 font-mono-nums bg-slate-950/80 px-2 py-1 rounded border border-amber-500/30 mb-2">
            <span>⚡ Torpedo: <strong className="text-red-400">Antimatter Blast</strong> (-50% to -70% Shields)</span>
            <span>🔥 Phasers: <strong className="text-orange-400">58 DMG/s</strong></span>
          </div>

          <div className="text-[10px] text-center text-red-300 font-trek uppercase tracking-wide bg-red-900/40 py-1 rounded">
            Press <kbd className="px-1 bg-red-950 rounded">T</kbd> Launch Homing Torpedo · <kbd className="px-1 bg-red-950 rounded">Space</kbd> Phasers · <kbd className="px-1 bg-red-950 rounded">Tab</kbd> Next · <kbd className="px-1 bg-red-950 rounded">Z</kbd> Unlock Target
          </div>
        </div>
      )}

      {/* Spacedock Interior Bay Indicator */}
      {currentView === 'spacedock_bay' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-950/90 border border-sky-400/60 rounded-full text-center shadow-lg backdrop-blur-md">
          <span className="text-[11px] font-mono-nums text-sky-300 font-bold tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            SPACEDOCK ONE INTERNAL HANGAR SLIP · Atmospheric Force-Field Containment Active
          </span>
        </div>
      )}

      {/* Upper-Left Flight Telemetry & Tactical Ordnance HUD (Hidden in 3D Bridge Interior unless moored at Spacedock) */}
      {(currentView !== 'interior_bridge' || shipState.isDocked) && (
      <div className={`absolute top-20 flex flex-col gap-2 max-w-[260px] max-h-[calc(100vh-175px)] overflow-y-auto pointer-events-auto z-20 transition-all duration-300 pr-1 ${isScannerOpen ? 'left-4 sm:left-[436px]' : 'left-4'}`}>
        {/* Tactical Ordnance Panel (Phasers & Torpedoes & Nearest Space Dock) - FIRST! */}
        <div className="p-3 bg-slate-950/85 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-mono-nums shadow-lg">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[11px] font-trek text-amber-400 uppercase tracking-wide">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-orange-400" />
              <span>Tactical Ordnance</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className={shipState.isFiringPhasers ? 'text-red-400 animate-pulse font-bold' : 'text-slate-400 text-[10px]'}>
                {shipState.isFiringPhasers ? 'FIRING' : 'ARMED'}
              </span>
              <button
                onClick={() => setIsOrdnanceCollapsed((prev) => !prev)}
                className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isOrdnanceCollapsed ? 'Expand Tactical Ordnance' : 'Collapse Tactical Ordnance'}
              >
                {isOrdnanceCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {!isOrdnanceCollapsed && (
            <div className="space-y-1.5">
              {/* Phasers Energy */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span className="flex items-center gap-1">
                    <Crosshair className="w-2.5 h-2.5 text-orange-400" /> Phaser Banks
                  </span>
                  <span className={shipState.phaserEnergy < 20 ? 'text-red-400 font-bold' : 'text-orange-300'}>
                    {shipState.phaserEnergy}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100"
                    style={{ width: `${shipState.phaserEnergy}%` }}
                  />
                </div>
              </div>

              {/* Photon Torpedo Count */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Photon Torpedoes:</span>
                <div className="flex items-center gap-1">
                  <span className="text-red-400 font-bold">{shipState.torpedoCount}</span>
                  <span className="text-slate-500 text-[10px]">/ 24</span>
                </div>
              </div>

              {/* Compact Shield % & Hull % in lower portion of Tactical Ordnance */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono-nums">
                <div className="flex items-center gap-1" title="Deflector Shield Integrity">
                  <Shield className={`w-2.5 h-2.5 ${shipState.shieldsRaised ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="text-slate-400">Shields:</span>
                  <span
                    className={`font-bold ${
                      !shipState.shieldsRaised
                        ? 'text-slate-400'
                        : shipState.shieldIntegrity > 50
                        ? 'text-sky-300'
                        : shipState.shieldIntegrity > 25
                        ? 'text-amber-400'
                        : 'text-red-400 animate-pulse'
                    }`}
                  >
                    {Math.round(shipState.shieldIntegrity)}%
                  </span>
                  <span className="text-[8.5px] text-slate-500">
                    ({shipState.shieldsRaised ? 'UP' : 'DN'})
                  </span>
                </div>
                <span className="text-slate-700">|</span>
                <div className="flex items-center gap-1" title="Primary Hull Integrity">
                  <span className="text-slate-400">Hull:</span>
                  <span
                    className={`font-bold ${
                      shipState.hullIntegrity > 60
                        ? 'text-emerald-400'
                        : shipState.hullIntegrity > 30
                        ? 'text-amber-400'
                        : 'text-red-500 animate-pulse'
                    }`}
                  >
                    {Math.round(shipState.hullIntegrity)}%
                  </span>
                </div>
              </div>

              {/* Quick Action: Nearest Space Dock Refill & Repair - Prominent Top Button */}
              {onGoToNearestSpaceDock && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={onGoToNearestSpaceDock}
                    className="w-full py-1.5 px-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-trek font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-500/25 active:scale-95"
                    title="Warp or auto-dock at nearest space dock for 100% repairs and photon torpedo refills"
                  >
                    <Anchor className="w-3.5 h-3.5 text-slate-950" />
                    <span>
                      {shipState.isDocked
                        ? `Moored: ${shipState.dockedStationName || 'Space Dock'}`
                        : '⚓ Nearest Space Dock'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flight Telemetry Panel - SECOND (Below Ordnance) */}
        <div className="p-3 bg-slate-950/85 backdrop-blur-md rounded-lg border border-slate-800 text-xs font-mono-nums shadow-lg">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[11px] font-trek text-amber-400 uppercase tracking-wide">
            <div className="flex items-center gap-1.5 truncate">
              <span>{shipState.currentSystemName || 'Sector 001'}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 text-[10px]">{currentView.replace('_', ' ').toUpperCase()}</span>
            </div>
            <button
              onClick={() => setIsTelemetryCollapsed((prev) => !prev)}
              className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title={isTelemetryCollapsed ? 'Expand Telemetry' : 'Collapse Telemetry'}
            >
              {isTelemetryCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>

          {!isTelemetryCollapsed && (
            <div className="space-y-1.5">
              {/* Speed / Propulsion Mode */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Drive:
                </span>
                <span className={`font-semibold ${shipState.isWarping ? 'text-sky-300 animate-pulse' : 'text-amber-300'}`}>
                  {shipState.isWarping ? `WARP FACTOR ${shipState.warpFactor.toFixed(1)}` : 'IMPULSE DRIVE'}
                </span>
              </div>

              {(() => {
                const rawSceneSpeed = shipState.velocity
                  ? Math.hypot(shipState.velocity.x, shipState.velocity.y, shipState.velocity.z)
                  : undefined;
                const liveSceneSpeed =
                  shipState.isDocked ||
                  (!shipState.isWarping && !shipState.isBoostActive && shipState.throttlePercent <= 0 && (rawSceneSpeed ?? 0) < 0.5)
                    ? 0
                    : rawSceneSpeed;
                const velTelemetry = getKinematicVelocityTelemetry(
                  shipState.isWarping,
                  shipState.warpFactor,
                  shipState.throttlePercent,
                  shipState.isBoostActive,
                  liveSceneSpeed
                );
                const cFormatted =
                  velTelemetry.canonWarp.cMultiple >= 100
                    ? Math.round(velTelemetry.canonWarp.cMultiple).toLocaleString('en-US')
                    : velTelemetry.canonWarp.cMultiple.toFixed(1);

                return (
                  <div className="space-y-1 bg-slate-900/75 p-1.5 rounded border border-slate-800/90">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10.5px]">Velocity (km/s):</span>
                      <span
                        className={`font-bold text-[11px] ${
                          shipState.isBoostActive
                            ? 'text-cyan-300 animate-pulse'
                            : shipState.isWarping
                            ? 'text-sky-300'
                            : 'text-slate-100'
                        }`}
                      >
                        {velTelemetry.kinematicKms < 100
                          ? '0 km/s (Full Stop)'
                          : velTelemetry.kinematicSciKms}
                      </span>
                    </div>

                    {velTelemetry.kinematicKms >= 100 && (
                      <div className="flex items-center justify-between text-[9.5px] text-slate-300">
                        <span className="text-slate-500">Exact km/s:</span>
                        <span className="font-mono-nums text-amber-300 font-semibold">
                          {velTelemetry.kinematicFullKms}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[9.5px] pt-0.5 border-t border-slate-800/70">
                      <span className="text-slate-400">Radar Δd/Δt:</span>
                      <span className="font-mono-nums text-emerald-400 font-semibold">
                        {velTelemetry.kinematicKms < 100
                          ? '0.00 AU/s'
                          : `${velTelemetry.kinematicAuPerSec >= 10 ? velTelemetry.kinematicAuPerSec.toFixed(1) : velTelemetry.kinematicAuPerSec.toFixed(2)} AU/s`}
                      </span>
                    </div>

                    {shipState.isWarping && (
                      <div className="flex items-center justify-between text-[9.5px] pt-0.5 border-t border-slate-800/70">
                        <span className="text-sky-400/90">Star Trek W{shipState.warpFactor.toFixed(1)}:</span>
                        <span className="font-mono-nums text-sky-200 font-semibold" title={`Canon TNG W${shipState.warpFactor.toFixed(1)}: ${cFormatted}c (${velTelemetry.canonWarp.fullZerosKms})`}>
                          {cFormatted}c ({velTelemetry.canonWarp.scientificKms})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Throttle Gauge Bar */}
              <div className="pt-1">
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                  <span>Throttle</span>
                  <span>{shipState.throttlePercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      shipState.isWarping ? 'bg-sky-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${shipState.throttlePercent}%` }}
                  />
                </div>
              </div>

              {/* Evasive Thruster Boost */}
              <div className="pt-1 border-t border-slate-800/80">
                <div className="flex justify-between items-center text-[10px] mb-0.5">
                  <span className="text-slate-400">⚡ Evasive Boost:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold font-mono-nums ${
                      shipState.isBoostActive
                        ? 'text-cyan-300 animate-pulse font-bold'
                        : (shipState.boostCharge ?? 100) >= 100
                        ? 'text-emerald-400'
                        : 'text-amber-300'
                    }`}>
                      {shipState.isBoostActive
                        ? `BURST ${Math.round(shipState.boostCharge ?? 0)}%`
                        : (shipState.boostCharge ?? 100) < 100
                        ? `${Math.round(shipState.boostCharge ?? 100)}% (+1.5%/s)`
                        : `${Math.round(shipState.boostCharge ?? 100)}%`}
                    </span>
                    {onTriggerBoost && (
                      <button
                        onClick={onTriggerBoost}
                        className={`px-1.5 py-0.2 rounded text-[8.5px] font-trek uppercase font-bold tracking-wider transition-all shadow-sm ${
                          shipState.isBoostActive
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
                            : (shipState.boostCharge ?? 100) > 2
                            ? 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40'
                            : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                        }`}
                        title={shipState.isBoostActive ? "Stop Evasive Boost [Shift] (Auto-recharges at +1.5%/s)" : "Engage Evasive Boost [Shift] (Recharges at +1.5%/s when stopped)"}
                      >
                        {shipState.isBoostActive ? 'STOP' : 'BOOST'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      shipState.isBoostActive ? 'bg-cyan-400 animate-pulse' : (shipState.boostCharge ?? 100) < 100 ? 'bg-amber-400/90' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, shipState.boostCharge ?? 100))}%` }}
                  />
                </div>
              </div>

              {/* IN-HUD SPACE STATION DOCK & INTERACTIVE OPERATIONS CONSOLE (No separate modal, manual interactive refills!) */}
              <div className="pt-1.5 border-t border-slate-800/80">
                {shipState.isDocked ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/90 border border-emerald-400/70 text-slate-100 flex flex-col gap-2 shadow-lg">
                    {/* Header & Undock */}
                    <div className="flex items-center justify-between border-b border-emerald-800/70 pb-1">
                      <span className="flex items-center gap-1 text-[10.5px] font-trek font-extrabold uppercase tracking-wide text-emerald-300">
                        <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Moored // Interactive Ops</span>
                      </span>
                      <button
                        onClick={onUndock}
                        className="px-2 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-trek font-extrabold text-[9px] uppercase tracking-wide transition-all shadow cursor-pointer"
                        title="Disengage mooring clamps [U key]"
                      >
                        Undock [U]
                      </button>
                    </div>

                    <div className="text-[10px] font-mono-nums text-emerald-200 truncate font-bold">
                      {shipState.dockedStationName || 'Deep Space Spacedock One'}
                    </div>

                    {/* Live Status Readout */}
                    <div className="grid grid-cols-2 gap-1 text-[9.5px] font-mono-nums bg-slate-950/70 p-1.5 rounded border border-emerald-500/30">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hull:</span>
                        <strong className={shipState.hullIntegrity < 100 ? 'text-amber-300' : 'text-emerald-300'}>
                          {Math.round(shipState.hullIntegrity)}%
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shields:</span>
                        <strong className={shipState.shieldIntegrity < 100 ? 'text-amber-300' : 'text-sky-300'}>
                          {Math.round(shipState.shieldIntegrity)}%
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Torps:</span>
                        <strong className={shipState.torpedoCount < 30 ? 'text-amber-300' : 'text-cyan-300'}>
                          {shipState.torpedoCount}/30
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Boost:</span>
                        <strong className={(shipState.boostCharge ?? 100) < 100 ? 'text-amber-300' : 'text-cyan-300'}>
                          {Math.round(shipState.boostCharge ?? 100)}%
                        </strong>
                      </div>
                    </div>

                    {/* 1. Interactive 3D Hull Repair Drones Control */}
                    <div className="space-y-1 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                      <div className="flex items-center justify-between text-[9.5px]">
                        <span className="text-cyan-300 font-bold uppercase flex items-center gap-1">
                          <Wrench className="w-2.5 h-2.5" /> 3D Repair Drones
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4].map((cnt) => (
                            <button
                              key={cnt}
                              onClick={() => setDroneCountSelect(cnt)}
                              className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold cursor-pointer ${
                                droneCountSelect === cnt
                                  ? 'bg-cyan-400 text-slate-950'
                                  : 'bg-slate-900 text-slate-400 hover:text-white'
                              }`}
                            >
                              {cnt}x
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {stationOps?.dronesDeployed ? (
                          <button
                            onClick={onRecallDrones}
                            className="flex-1 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9.5px] uppercase tracking-wider cursor-pointer"
                          >
                            Recall Drones ({stationOps.droneCount} Active)
                          </button>
                        ) : (
                          <button
                            onClick={() => onDeployDrones?.(droneCountSelect, 'overhaul')}
                            className="flex-1 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[9.5px] uppercase tracking-wider cursor-pointer"
                          >
                            Deploy {droneCountSelect} Drones (Repair Hull)
                          </button>
                        )}
                        {onTestDamageDemo && (
                          <button
                            onClick={onTestDamageDemo}
                            className="px-1.5 py-1 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-[8.5px] font-bold uppercase cursor-pointer"
                            title="Simulate -45% hull damage to test 3D repair drones"
                          >
                            -45% Hull
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Interactive Reload Torpedoes & Recharge Boost/Shields Buttons */}
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => onReloadTorpedoes?.('photon')}
                        disabled={stationOps?.isReloadingTorpedoes || shipState.torpedoCount >= 30}
                        className={`py-1.5 px-1.5 rounded font-bold text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          stationOps?.isReloadingTorpedoes
                            ? 'bg-amber-500/30 border border-amber-400 text-amber-200 animate-pulse'
                            : shipState.torpedoCount >= 30
                            ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                            : 'bg-orange-500 hover:bg-orange-400 text-slate-950 shadow'
                        }`}
                        title="Manually reload Photon Torpedo tubes to 30/30"
                      >
                        <Flame className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {stationOps?.isReloadingTorpedoes
                            ? `Loading ${shipState.torpedoCount}/30`
                            : shipState.torpedoCount >= 30
                            ? 'Torps Full (30)'
                            : 'Reload Torps'}
                        </span>
                      </button>

                      <button
                        onClick={onRefuelAntimatter}
                        disabled={
                          stationOps?.isRefuelingAntimatter &&
                          (shipState.boostCharge ?? 100) >= 100 &&
                          shipState.shieldIntegrity >= 100
                        }
                        className={`py-1.5 px-1.5 rounded font-bold text-[9.5px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          stationOps?.isRefuelingAntimatter
                            ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 animate-pulse'
                            : (shipState.boostCharge ?? 100) >= 100 &&
                              shipState.shieldIntegrity >= 100 &&
                              (stationOps?.antimatterLevel ?? 100) >= 100
                            ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                            : 'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow'
                        }`}
                        title="Manually recharge Evasive Boost, Shields, Phasers & Antimatter to 100%"
                      >
                        <BatteryCharging className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {stationOps?.isRefuelingAntimatter
                            ? 'Recharging...'
                            : 'Refill Boost/Shield'}
                        </span>
                      </button>
                    </div>

                    {/* 3. Quick Station Utility Row (Clamps, Coolant, Crew Morale) */}
                    <div className="grid grid-cols-3 gap-1 text-[8.5px]">
                      <button
                        onClick={onToggleClamps}
                        className={`py-1 rounded border font-bold uppercase cursor-pointer ${
                          stationOps?.clampsEngaged
                            ? 'bg-emerald-900/60 border-emerald-400/50 text-emerald-200'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {stationOps?.clampsEngaged ? 'Clamps LOCKED' : 'Clamps OPEN'}
                      </button>
                      <button
                        onClick={onPurgeCoolant}
                        className="py-1 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-bold uppercase cursor-pointer"
                      >
                        Coolant ({stationOps?.coolantTempKelvin || 310}K)
                      </button>
                      <button
                        onClick={onGrantShoreLeave}
                        className="py-1 rounded bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 font-bold uppercase cursor-pointer"
                      >
                        Morale ({stationOps?.crewMoralePercent || 100}%)
                      </button>
                    </div>
                  </div>
                ) : shipState.canDockAtStation ? (
                  <div className="p-2 rounded-lg bg-cyan-950/85 border border-cyan-400/70 text-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 text-[10px] font-trek font-bold uppercase tracking-wide text-cyan-300">
                        <Anchor className="w-3 h-3 text-cyan-400 animate-bounce" />
                        <span>Docking In Range</span>
                      </span>
                      <button
                        onClick={() => onDock?.(shipState.canDockAtStation?.id)}
                        className="px-2.5 py-0.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-trek font-bold text-[9.5px] uppercase tracking-wide transition-all shadow animate-pulse cursor-pointer"
                        title="Moor at space station to access interactive HUD repair & refill controls [U key]"
                      >
                        Dock [U]
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono-nums">
                      <span className="text-slate-200 truncate max-w-[130px] font-semibold text-[9.5px]">
                        {shipState.canDockAtStation.name}
                      </span>
                      <span className="text-cyan-300 text-[9px] font-bold shrink-0">
                        {shipState.canDockAtStation.distance} km
                      </span>
                    </div>
                    <div className="text-[8.5px] font-mono text-slate-400 mt-0.5">
                      Interactive HUD Drones, Torp & Boost Refill
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-mono-nums py-0.5">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Anchor className="w-2.5 h-2.5 text-slate-500" />
                      <span>Station Mooring:</span>
                    </span>
                    <span className="text-slate-400 text-[9px]">
                      Approach &lt;480 km [U]
                    </span>
                  </div>
                )}
              </div>

              {/* Dynamic Automated Course & Arrival ETA Card (Compact & High Precision) */}
              {shipState.activeCoursePlot && shipState.activeCoursePlot.isEngaged && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-500/40 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-trek uppercase tracking-wide text-sky-300 font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <Rocket className="w-3 h-3 text-sky-400 animate-pulse" />
                        <span>TRANSIT ETA:</span>
                      </span>
                      <span className="text-amber-300 font-mono-nums font-black text-xs">
                        {shipState.activeCoursePlot.etaSeconds <= 0
                          ? '< 1s (ORBIT)'
                          : `~${shipState.activeCoursePlot.etaSeconds}s`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-300 mb-0.5">
                      <span className="truncate max-w-[130px] text-white font-semibold">
                        → {shipState.activeCoursePlot.targetPlanet.name}
                      </span>
                      <span className="text-sky-300 font-mono-nums font-bold">
                        {shipState.activeCoursePlot.distance.toLocaleString()} km
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono-nums text-slate-400 mb-1">
                      <span>Dest Coords:</span>
                      <span className="text-cyan-300">
                        [{shipState.activeCoursePlot.destinationPos.map(c => Math.round(c)).join(', ')}]
                      </span>
                    </div>

                    {shipState.activeCoursePlot.safetyTelemetry?.isOffsetApplied && (
                      <div className="text-[9px] text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 mb-1 flex items-center justify-between font-mono-nums">
                        <span>PERIMETER SAFEGUARD:</span>
                        <span>+{shipState.activeCoursePlot.safetyTelemetry.clearanceDistance}km</span>
                      </div>
                    )}

                    {/* Precision Arrival Progress Bar */}
                    <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all duration-150"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              8,
                              100 -
                                (Math.min(25, shipState.activeCoursePlot.etaSeconds) / 25) * 88
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Free Warp Cruise Indicator (When warping without active course plot) */}
              {shipState.isWarping && !shipState.activeCoursePlot && (
                <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Rocket className="w-3 h-3 text-sky-400 animate-pulse" /> Subspace:
                  </span>
                  <span className="text-sky-300 font-mono-nums font-bold">WARP CRUISE ACTIVE</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time Tactical Alerts (Directly stacked under panels) */}
        {recentLogs && recentLogs.length > 0 && onOpenFullLog && (
          <TacticalHUDTicker
            recentLogs={recentLogs}
            onOpenFullLog={onOpenFullLog}
          />
        )}
      </div>
      )}

      {/* Real-time Warp Transit HUD - Streamlined & Compact ETA Strip (No redundant warp selector buttons) */}
      {currentView !== 'interior_bridge' && (shipState.isWarping || (shipState.activeCoursePlot && shipState.activeCoursePlot.isEngaged)) && (
        <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95vw] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.35)] text-slate-100 font-trek">
            {/* Pulsing Status & Target Destination */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <Rocket className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                {shipState.activeCoursePlot
                  ? shipState.activeCoursePlot.targetPlanet.name
                  : 'WARP CRUISE'}
              </span>
            </div>

            <div className="h-3.5 w-px bg-slate-800" />

            {/* Read-Only Warp Factor Tag */}
            <div className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/30 font-semibold shrink-0">
              WARP {shipState.warpFactor.toFixed(1)}
            </div>

            <div className="h-3.5 w-px bg-slate-800" />

            {/* High-Accuracy ETA Display */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">ETA:</span>
              <span className="text-xs sm:text-sm font-mono-nums font-black text-amber-300">
                {shipState.activeCoursePlot
                  ? shipState.activeCoursePlot.etaSeconds <= 0
                    ? '< 1s'
                    : `~${shipState.activeCoursePlot.etaSeconds}s`
                  : 'CRUISING'}
              </span>
            </div>

            {/* Remaining Distance */}
            {shipState.activeCoursePlot && (
              <>
                <div className="h-3.5 w-px bg-slate-800 hidden sm:block" />
                <div className="text-[10px] font-mono-nums text-slate-300 hidden sm:block shrink-0">
                  <span className="text-slate-400">DIST: </span>
                  <span className="font-semibold text-white">
                    {shipState.activeCoursePlot.distance.toLocaleString()} km
                  </span>
                </div>
              </>
            )}

            {/* Quick Drop Warp Button */}
            {onDisengageWarp && (
              <button
                onClick={onDisengageWarp}
                className="ml-1 px-2.5 py-0.5 rounded-full bg-red-600/80 hover:bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider transition-colors shadow-sm shrink-0 active:scale-95"
                title="Drop out of warp to impulse speed and restore manual helm [Ctrl+Alt+R]"
              >
                Drop [Ctrl+Alt+R]
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
