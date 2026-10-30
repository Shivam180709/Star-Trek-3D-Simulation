import React, { useState } from 'react';
import { CameraViewMode, ShipState } from '../types/simulation';
import {
  Video,
  Zap,
  Crosshair,
  Shield,
  Rocket,
  Compass,
  ChevronUp,
  ShieldAlert,
  Target,
  Radio,
  Award,
  Cpu,
  X,
} from 'lucide-react';

interface LCARSControlsProps {
  shipState: ShipState | null;
  currentView: CameraViewMode;
  onSetCameraView: (view: CameraViewMode) => void;
  onSetThrottle: (throttle: number) => void;
  onSetWarpFactor: (factor: number) => void;
  onToggleWarp: () => void;
  onStartPhaser: () => void;
  onStopPhaser: () => void;
  onFireTorpedo: () => void;
  onToggleShields: () => void;
  onToggleAutoPilot: () => void;
  onTargetHostile?: () => void;
  onSummonHostiles?: () => void;
  combatAssist?: boolean;
  onToggleCombatAssist?: () => void;
  onTriggerBoost?: () => void;
  onToggleTacticalLog?: () => void;
  onToggleNavigation?: () => void;
  isNavigationOpen?: boolean;
  onToggleMap?: () => void;
  onDock?: (stationId?: string) => void;
  onUndock?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
}

export const LCARSControls: React.FC<LCARSControlsProps> = ({
  shipState,
  currentView,
  onSetCameraView,
  onSetThrottle,
  onSetWarpFactor,
  onToggleWarp,
  onStartPhaser,
  onStopPhaser,
  onFireTorpedo,
  onToggleShields,
  onToggleAutoPilot,
  onTargetHostile,
  onSummonHostiles,
  combatAssist = true,
  onToggleCombatAssist,
  onTriggerBoost,
  onToggleTacticalLog,
  onToggleNavigation,
  isNavigationOpen,
  onToggleMap,
  onDock,
  onUndock,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const [isCameraMenuOpen, setIsCameraMenuOpen] = useState<boolean>(false);
  const [showAdaptiveModal, setShowAdaptiveModal] = useState<boolean>(false);

  const wave = shipState?.combatWaveState;
  const adaptive = wave?.adaptiveDifficulty || shipState?.adaptiveDifficulty;
  const threatLevel = wave?.threatLevel || shipState?.progression?.activeThreatLevel || 'Standard';
  const aiTier = adaptive?.fleetIntelligenceTier || 'Standard';
  const successRate = `${adaptive?.playerSuccessRate ?? 100}%`;

  const cameraModes: { id: CameraViewMode; label: string; icon: string }[] = [
    { id: 'chase', label: 'Chase View', icon: '🚀' },
    { id: 'interior_bridge', label: 'Bridge Interior (3D)', icon: '🏛️' },
    { id: 'bridge', label: 'Helm Viewscreen', icon: '👁️' },
    { id: 'beauty', label: 'Starfleet Showcase (3/4)', icon: '✨' },
    { id: 'bow', label: 'Bow View (Front)', icon: '🎯' },
    { id: 'stern', label: 'Stern View (Aft)', icon: '🔥' },
    { id: 'registry', label: 'NCC-1701 Close-Up', icon: '🔍' },
    { id: 'cinematic', label: 'Cinematic Flyby', icon: '🎬' },
    { id: 'saucer', label: 'Saucer Deck 1', icon: '🛸' },
    { id: 'nacelle', label: 'Warp Nacelle', icon: '⚡' },
    { id: 'deflector', label: 'Deflector Bow', icon: '🌀' },
    { id: 'spacedock_bay', label: 'Spacedock Bay (Interior)', icon: '⚓' },
    { id: 'orbit', label: '360° Free Orbit', icon: '🔄' },
  ];

  const currentCam = cameraModes.find((c) => c.id === currentView) || cameraModes[0];
  const isWarping = shipState?.isWarping ?? false;
  const currentWarp = shipState?.warpFactor ?? 4.0;
  const throttle = shipState?.throttlePercent ?? 0;
  const shieldsRaised = shipState?.shieldsRaised ?? false;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex flex-col gap-1 px-2.5 py-1.5 bg-slate-950/95 backdrop-blur-xl border-t border-amber-500/50 text-slate-100 select-none shadow-2xl">
      {/* Floating Camera POV Pop-up Menu */}
      {isCameraMenuOpen && (
        <div className="absolute bottom-20 left-3 z-50 bg-slate-950 border border-amber-500/50 rounded-xl p-1.5 shadow-2xl shadow-black/80 flex flex-col gap-1 min-w-[200px]">
          <div className="px-2 py-1 text-[10px] font-trek text-amber-400 uppercase tracking-wider border-b border-slate-800">
            Select Camera Perspective
          </div>
          {cameraModes.map((cam) => (
            <button
              key={cam.id}
              onClick={() => {
                onSetCameraView(cam.id);
                setIsCameraMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors font-medium text-left ${
                currentView === cam.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{cam.icon}</span>
              <span>{cam.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Adaptive Combat Telemetry Floating Popover Modal */}
      {showAdaptiveModal && adaptive && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[440px] max-w-[95vw] rounded-xl bg-slate-950/95 backdrop-blur-xl border border-sky-500/60 shadow-2xl shadow-sky-950/70 p-3.5 text-left text-xs pointer-events-auto animate-in fade-in zoom-in-95 duration-150 z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-500/30">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-trek font-bold text-sky-400 uppercase tracking-widest text-[11px]">
                ADAPTIVE DIFFICULTY ENGINE // LCARS 47
              </span>
            </div>
            <button
              onClick={() => setShowAdaptiveModal(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Close Telemetry"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mb-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-trek text-sky-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Player Success & Performance Rating
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-trek uppercase text-[10px] font-bold border border-amber-500/40">
                Tier: {adaptive.skillTier}
              </span>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-[11px] font-mono-nums mb-1">
                <span className="text-slate-300">Hostile Neutralization Success Rate:</span>
                <span className="font-bold text-emerald-400">{adaptive.playerSuccessRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    adaptive.playerSuccessRate >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : adaptive.playerSuccessRate >= 60
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                      : 'bg-gradient-to-r from-red-500 to-amber-500'
                  }`}
                  style={{ width: `${adaptive.playerSuccessRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono-nums text-slate-300 pt-1 border-t border-slate-800/80">
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[9px] uppercase">Combat Rating</div>
                <div className="text-amber-400 font-bold text-xs">{adaptive.combatRating} <span className="text-[9px] text-slate-500">/ 270</span></div>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[9px] uppercase">Win Streak</div>
                <div className="text-sky-300 font-bold text-xs">{adaptive.winStreak} waves</div>
              </div>
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[9px] uppercase">Accuracy</div>
                <div className="text-emerald-400 font-bold text-xs">{adaptive.playerAccuracyPercent}%</div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/40 text-[10px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-trek text-red-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-red-400" />
                Fleet AI Counter-Scaling
              </span>
              <span className="px-2 py-0.5 rounded bg-red-600/30 text-red-300 font-trek uppercase text-[10px] font-bold border border-red-500/50">
                Tier {adaptive.fleetIntelligenceLevel} ({adaptive.fleetIntelligenceTier})
              </span>
            </div>
            <div className="flex justify-between p-1 bg-slate-950/70 rounded">
              <span className="text-slate-300">Damage Scaling:</span>
              <span className="font-bold text-orange-400">+{Math.round((adaptive.adaptiveDamageMultiplier - 1) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ROW 1: Flight Propulsion, Camera POV, Intelligence & Threat Telemetry */}
      <div className="flex items-center justify-between gap-1.5 w-full">
        {/* Left: Camera POV, Zoom, Dogfight Assist & Officer Rank */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Camera POV Dropdown Button */}
          <button
            onClick={() => setIsCameraMenuOpen(!isCameraMenuOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-amber-500/40 text-[11px] font-medium text-amber-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            title="Switch Camera POV"
          >
            <Video className="w-3 h-3 text-amber-400" />
            <span className="font-trek uppercase tracking-wide">{currentCam.label}</span>
            <ChevronUp className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {/* Camera POV Zoom In / Out Controls */}
          {onZoomIn && onZoomOut && (
            <div className="flex items-center bg-slate-900 border border-amber-500/40 rounded p-0.5 text-[10px] font-mono-nums">
              <button
                onClick={onZoomIn}
                className="w-4 h-4 flex items-center justify-center text-amber-300 hover:text-white hover:bg-slate-800 rounded font-bold transition-colors"
                title="Camera Zoom In [+ / Scroll Up]"
              >
                +
              </button>
              <button
                onClick={onResetZoom}
                className="px-1 h-4 flex items-center justify-center text-[9px] text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors font-medium"
                title="Reset Zoom to 100% [0 key]"
              >
                {Math.round(100 / (shipState?.cameraZoom ?? 1.0))}%
              </button>
              <button
                onClick={onZoomOut}
                className="w-4 h-4 flex items-center justify-center text-amber-300 hover:text-white hover:bg-slate-800 rounded font-bold transition-colors"
                title="Camera Zoom Out [- / Scroll Down]"
              >
                -
              </button>
            </div>
          )}

          {/* Combat Auto-Aim / Tracking Assist */}
          {onToggleCombatAssist && (
            <button
              onClick={onToggleCombatAssist}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-trek uppercase transition-colors ${
                combatAssist
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
              title="Automatically guides ship and phaser weapons towards locked hostile"
            >
              <Target className="w-3 h-3" />
              <span className="hidden sm:inline">Assist: {combatAssist ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* Officer Rank & Level Badge */}
          <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold font-trek uppercase text-[10px]">
            <Award className="w-2.5 h-2.5 text-amber-400" />
            <span>{shipState?.progression?.rank || 'Commander'}</span>
            <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-500/30 text-amber-200">
              LVL {shipState?.progression?.level || 4}
            </span>
          </div>
        </div>

        {/* Center: Impulse & Warp Propulsion Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded-lg border border-slate-700/80 shrink-0">
          {/* Impulse Presets */}
          <div className="flex items-center gap-0.5">
            <span className="text-[9.5px] font-trek text-amber-400 mr-1 hidden sm:inline uppercase font-bold">Impulse:</span>
            {[
              { label: 'Stop', val: 0 },
              { label: '1/4', val: 25 },
              { label: '1/2', val: 50 },
              { label: 'Full', val: 100 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => onSetThrottle(p.val)}
                className={`px-1.5 py-0.5 text-[9.5px] font-mono-nums rounded border transition-colors ${
                  throttle === p.val
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
                title={`Set impulse throttle to ${p.label} (${p.val}%)`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-3 bg-slate-700 mx-0.5" />

          {/* Warp Factor Stepper & Engagement */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5 bg-slate-950 px-1 py-0.5 rounded border border-sky-500/30">
              <span className="text-[9.5px] font-trek text-sky-400 uppercase hidden sm:inline font-bold">Warp:</span>
              <button
                onClick={() => onSetWarpFactor(Math.max(1.0, Math.round((currentWarp - 0.5) * 10) / 10))}
                className="w-3.5 h-3.5 flex items-center justify-center text-[9px] font-mono text-slate-400 hover:text-white bg-slate-900 rounded"
                title="Decrease Warp Factor (-0.5)"
              >
                -
              </button>
              <span className="text-[9.5px] font-mono-nums font-bold text-sky-300 px-0.5">
                W{currentWarp.toFixed(1)}
              </span>
              <button
                onClick={() => onSetWarpFactor(Math.min(9.9, Math.round((currentWarp + 0.5) * 10) / 10))}
                className="w-3.5 h-3.5 flex items-center justify-center text-[9px] font-mono text-slate-400 hover:text-white bg-slate-900 rounded"
                title="Increase Warp Factor (+0.5)"
              >
                +
              </button>
            </div>

            {/* Quick Factor Presets */}
            <div className="hidden sm:flex items-center gap-0.5">
              {[1, 2, 4, 6, 8].map((f) => (
                <button
                  key={f}
                  onClick={() => onSetWarpFactor(f)}
                  className={`px-1 py-0.5 text-[9px] font-mono-nums rounded border transition-colors ${
                    Math.abs(currentWarp - f) < 0.15
                      ? 'bg-sky-500 text-slate-950 font-bold border-sky-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={`Set Warp Factor ${f} [Ctrl+Alt+${f}]`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Live Course Navigation ETA Badge */}
            {shipState?.activeCoursePlot && (isWarping || shipState.activeCoursePlot.phase === 'warping') && (
              <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950 border border-sky-400/50 text-[9.5px] font-mono-nums text-sky-200">
                <Rocket className="w-2.5 h-2.5 text-sky-400 animate-pulse" />
                <span>ETA:</span>
                <span className="font-bold text-amber-300">~{shipState.activeCoursePlot.etaSeconds}s</span>
              </div>
            )}

            {/* Warp Toggle Button */}
            {(() => {
              const isTransitActive = isWarping || Boolean(shipState?.activeCoursePlot?.isEngaged);
              return (
                <button
                  onClick={onToggleWarp}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-trek uppercase tracking-wide font-bold transition-all shadow-md flex items-center gap-1 ${
                    isTransitActive
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/40 animate-pulse'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-500/30'
                  }`}
                  title={isTransitActive ? 'Drop out of warp speed & cancel course [Ctrl+Alt+R]' : `Engage warp engines [Ctrl+Alt+1..9 or Click]`}
                >
                  <Rocket className="w-2.5 h-2.5" />
                  <span>{isTransitActive ? 'DROP [Ctrl+Alt+R]' : `WARP`}</span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Right: Threat Level, Fleet AI Tier, Player Success Rate (Requested by User) */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[10.5px] font-mono-nums shadow-inner shrink-0">
          {/* Threat Level */}
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-trek text-slate-400 uppercase font-bold tracking-wider">Threat:</span>
            <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-trek font-bold uppercase shadow-sm ${
              threatLevel === 'Lethal' || threatLevel === 'Extreme'
                ? 'bg-red-600 text-white animate-pulse'
                : threatLevel === 'Critical'
                ? 'bg-orange-600 text-white'
                : threatLevel === 'Severe'
                ? 'bg-amber-600 text-slate-950 font-black'
                : 'bg-slate-800 text-amber-300 border border-amber-500/30'
            }`}>
              {threatLevel}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          {/* AI Counter-Scaling Tier */}
          <button
            onClick={() => setShowAdaptiveModal(!showAdaptiveModal)}
            className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer group"
            title="Click to view Adaptive Fleet Intelligence Telemetry"
          >
            <Cpu className="w-2.5 h-2.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-[9.5px] font-trek text-slate-400 uppercase font-bold">AI:</span>
            <span className="text-amber-300 font-bold font-mono text-[10px]">{aiTier}</span>
          </button>

          <span className="text-slate-600">|</span>

          {/* Success Rate */}
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] font-trek text-slate-400 uppercase font-bold">Success:</span>
            <span className={`font-bold font-mono text-[10px] ${
              (adaptive?.playerSuccessRate ?? 100) >= 75 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {successRate}
            </span>
          </div>

          {/* Active Wave & Quick Engage Next Wave Button */}
          {wave && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-trek uppercase font-bold text-[9.5px] tracking-wide">
                W{wave.level}
              </span>
              {wave.status !== 'active' && onSummonHostiles && (
                <button
                  onClick={onSummonHostiles}
                  className="ml-0.5 px-1.5 py-0.2 rounded bg-red-600/90 hover:bg-red-500 text-white font-trek font-bold text-[8.5px] uppercase transition-colors flex items-center gap-0.5 shadow-sm"
                  title="Engage Next Hostile Wave"
                >
                  <span>⚔️</span>
                  <span>Engage W{wave.status === 'cleared' ? wave.level + 1 : wave.level}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ROW 2: Tactical Combat Actions & Ship Operations */}
      <div className="flex items-center justify-between gap-1.5 w-full border-t border-slate-800/80 pt-1">
        {/* Left: Tactical Combat Weapons (Phasers, Torpedo, Target, Shields, Boost) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Fire Phasers */}
          <button
            onMouseDown={onStartPhaser}
            onMouseUp={onStopPhaser}
            onTouchStart={onStartPhaser}
            onTouchEnd={onStopPhaser}
            className={`py-1 px-2.5 rounded text-[11px] font-trek uppercase tracking-wider font-bold border transition-colors flex items-center gap-1.5 ${
              shipState?.isFiringPhasers
                ? 'bg-orange-600 text-white border-orange-400 shadow-md shadow-orange-500/50'
                : 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30'
            }`}
            title="Fire continuous phasers (Spacebar)"
          >
            <Crosshair className="w-3 h-3" />
            <span>Phasers [Space]</span>
          </button>

          {/* Fire Torpedo */}
          <button
            onClick={onFireTorpedo}
            disabled={(shipState?.torpedoCount ?? 0) <= 0}
            className="py-1 px-2.5 rounded text-[11px] font-trek uppercase tracking-wider font-bold border transition-colors bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30 disabled:opacity-40 flex items-center gap-1.5"
            title="Launch photon torpedo (T key)"
          >
            <Zap className="w-3 h-3" />
            <span>Torpedo ({shipState?.torpedoCount ?? 0}) [T]</span>
          </button>

          {/* Target Hostile Lock */}
          {onTargetHostile && (
            <button
              onClick={onTargetHostile}
              className="py-1 px-2 rounded text-[11px] font-trek uppercase bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/50 transition-colors flex items-center gap-1"
              title="Target Next Hostile Ship (Tab)"
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Target [Tab]</span>
            </button>
          )}

          {/* Shields Toggle + Compact Small Shield/Hull % */}
          <button
            onClick={onToggleShields}
            className={`py-1 px-2 rounded text-[11px] font-trek uppercase font-semibold border transition-colors flex items-center gap-1.5 ${
              shieldsRaised
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle Deflector Shields"
          >
            <Shield className="w-3 h-3" />
            <span>{shieldsRaised ? 'Shields UP' : 'Shields DN'}</span>
            <span className="text-[9.5px] font-mono-nums opacity-90">
              {Math.round(shipState?.shieldIntegrity ?? 100)}%
            </span>
          </button>

          {/* Compact Small Hull % Badge in Lower Tactical Bar */}
          <div
            className="py-1 px-1.5 rounded bg-slate-900/80 border border-slate-800 text-[9.5px] font-mono-nums flex items-center gap-1"
            title="Primary Duranium Hull Integrity (%)"
          >
            <span className="text-slate-400 uppercase">Hull</span>
            <span
              className={`font-bold ${
                (shipState?.hullIntegrity ?? 100) > 60
                  ? 'text-emerald-400'
                  : (shipState?.hullIntegrity ?? 100) > 30
                  ? 'text-amber-400'
                  : 'text-red-500 animate-pulse'
              }`}
            >
              {Math.round(shipState?.hullIntegrity ?? 100)}%
            </span>
          </div>

          {/* Evasive Thruster Boost */}
          {onTriggerBoost && (
            <button
              onClick={onTriggerBoost}
              className={`py-1 px-2 rounded text-[11px] font-trek uppercase font-bold border transition-all flex items-center gap-1 ${
                shipState?.isBoostActive
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/50 animate-pulse'
                  : (shipState?.boostCharge ?? 100) > 3
                  ? 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
              }`}
              title={shipState?.isBoostActive ? "Stop Evasive Thruster Boost [Shift Key] (Auto-recharges at +1.5%/s)" : "Engage emergency evasive thruster boost [Shift Key] (Recharges at +1.5%/s when stopped)"}
            >
              <span>⚡</span>
              <span>
                {shipState?.isBoostActive
                  ? `Stop Boost [Shift] (${Math.round(shipState?.boostCharge ?? 0)}%)`
                  : (shipState?.boostCharge ?? 100) < 100
                  ? `Boost [Shift] (${Math.round(shipState?.boostCharge ?? 100)}% +1.5%/s)`
                  : `Boost [Shift] (${Math.round(shipState?.boostCharge ?? 100)}%)`}
              </span>
            </button>
          )}
        </div>

        {/* Right: Station Refit & Operations (Dock/Undock, Course [N], Star Map [M], Log [L], War Zone) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Space Station Dock / Undock Action */}
          {shipState?.isDocked ? (
            <button
              onClick={onUndock}
              className="py-1 px-2.5 rounded text-[11px] font-trek uppercase font-bold border transition-colors bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-600/40 flex items-center gap-1"
              title="Disengage mooring clamps and depart starbase [X key]"
            >
              <span>⚓</span>
              <span>Undock [X]</span>
            </button>
          ) : shipState?.canDockAtStation ? (
            <button
              onClick={() => onDock?.(shipState.canDockAtStation?.id)}
              className="py-1 px-2.5 rounded text-[11px] font-trek uppercase font-bold border transition-colors bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/50 flex items-center gap-1 animate-pulse"
              title="Dock at station for 100% hull repair and full torpedo reload [X key]"
            >
              <span>⚓</span>
              <span>Dock & Refit [X]</span>
            </button>
          ) : null}

          {/* Quick Course Plotter Drawer */}
          {onToggleNavigation && (
            <button
              onClick={onToggleNavigation}
              className={`py-1 px-2 rounded text-[11px] font-trek uppercase font-bold border transition-all flex items-center gap-1 shadow-sm ${
                isNavigationOpen
                  ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md shadow-sky-500/40'
                  : 'bg-sky-500/20 hover:bg-sky-500/35 text-sky-300 border-sky-400/50 hover:border-sky-300'
              }`}
              title="Stellar Cartography & Emergency Escape Course Plotter Menu [N key]"
            >
              <span>🧭</span>
              <span>Course [N]</span>
            </button>
          )}

          {/* Star System & Planetary Map Option */}
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              className="py-1 px-2 rounded text-[11px] font-trek uppercase font-bold border transition-all bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border-amber-400/50 hover:border-amber-300 flex items-center gap-1 shadow-sm"
              title="View all star systems, planets, and space stations [M key]"
            >
              <span>🗺️</span>
              <span>Map [M]</span>
            </button>
          )}

          {/* Tactical Log Overlay Toggle */}
          {onToggleTacticalLog && (
            <button
              onClick={onToggleTacticalLog}
              className="py-1 px-2 rounded text-[11px] font-trek uppercase bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1"
              title="Toggle Tactical Telemetry Event Log Overlay [L Key]"
            >
              <span>📜</span>
              <span>Log [L]</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
