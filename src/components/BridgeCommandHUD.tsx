import React, { useState } from 'react';
import {
  BridgeStationId,
  ShipState,
  CelestialTarget,
  EnemyShipState,
  StarfleetMission,
  AlertLevel,
} from '../types/simulation';
import { soundEffects } from '../audio/soundEffects';
import {
  Compass,
  Shield,
  Crosshair,
  Radio,
  Atom,
  Wrench,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface BridgeCommandHUDProps {
  shipState: ShipState | null;
  activeStation: BridgeStationId;
  targets: CelestialTarget[];
  enemies: EnemyShipState[];
  activeMission: StarfleetMission | null;
  onSelectStation: (station: BridgeStationId) => void;
  onExitBridgeToChase: () => void;
  onResetLook: () => void;
  onAdjustLook: (dYaw: number, dPitch: number) => void;
  onSetHeadingAndPitch: (headingDeg: number, pitchDeg: number) => void;
  onSyncHardwareTelemetry: (params: {
    warpFactor?: number;
    throttlePercent?: number;
    shieldFreqMhz?: number;
    shieldsRaised?: boolean;
    wavelengthNm?: number;
    subspaceFreqMhz?: number;
    headingDeg?: number;
    pitchDeg?: number;
  }) => void;
  onSetThrottle: (percent: number) => void;
  onSetWarpFactor: (factor: number) => void;
  onToggleWarp: () => void;
  onTriggerBoost: () => void;
  onToggleShields: () => void;
  onSetShieldHarmonics: (efficiencyPercent: number) => void;
  onStartPhaser: () => void;
  onStopPhaser: () => void;
  onFireTorpedo: () => void;
  onTargetHostile: () => void;
  onLockEnemy: (enemyId: string) => void;
  onSelectTarget: (targetId: string) => void;
  onQuickPlotCourse: (targetId: string) => void;
  onSetAlert: (level: AlertLevel) => void;
  onFireDeflectorBeam: (coords?: [number, number, number], colorHex?: number, duration?: number) => void;
  onTriggerMission3DAction: (
    action: 'sensor_pulse' | 'launch_probe' | 'activate_node' | 'stabilize_field',
    nodeIndex?: number
  ) => void;
  onOpenPlanetaryScanner: () => void;
  onOpenObjectDetails?: () => void;
  onSetViewscreenZoom?: (zoom: number) => void;
  onToggleMissions: () => void;
  onDock: (stationId?: string) => void;
  onUndock: () => void;
  onAwardScienceXp: (xp: number, label: string) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onSummonHostiles?: () => void;
}

interface StationMeta {
  id: BridgeStationId;
  keyNum: string;
  shortLabel: string;
  officerName: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
}

const BRIDGE_STATIONS: StationMeta[] = [
  {
    id: 'captain',
    keyNum: '1',
    shortLabel: "Captain's Chair",
    officerName: 'Capt. Kirk',
    borderClass: 'border-amber-400/60',
    bgClass: 'bg-amber-500/20',
    textClass: 'text-amber-300',
  },
  {
    id: 'helm',
    keyNum: '2',
    shortLabel: 'Helm (Sulu)',
    officerName: 'Lt. Sulu',
    borderClass: 'border-yellow-400/60',
    bgClass: 'bg-yellow-500/20',
    textClass: 'text-yellow-300',
  },
  {
    id: 'science',
    keyNum: '3',
    shortLabel: 'Science (Spock)',
    officerName: 'Cmdr. Spock',
    borderClass: 'border-cyan-400/60',
    bgClass: 'bg-cyan-500/20',
    textClass: 'text-cyan-300',
  },
  {
    id: 'tactical',
    keyNum: '4',
    shortLabel: 'Tactical (Chekov)',
    officerName: 'Ens. Chekov',
    borderClass: 'border-rose-400/60',
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-300',
  },
  {
    id: 'comms',
    keyNum: '5',
    shortLabel: 'Comms (Uhura)',
    officerName: 'Lt. Uhura',
    borderClass: 'border-emerald-400/60',
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-300',
  },
  {
    id: 'engineering',
    keyNum: '6',
    shortLabel: 'Engineering (Scotty)',
    officerName: 'Lt. Cmdr. Scott',
    borderClass: 'border-orange-400/60',
    bgClass: 'bg-orange-500/20',
    textClass: 'text-orange-300',
  },
  {
    id: 'overview',
    keyNum: '7',
    shortLabel: 'Cutaway View [7]',
    officerName: 'Bridge Overview',
    borderClass: 'border-sky-400/60',
    bgClass: 'bg-sky-500/20',
    textClass: 'text-sky-300',
  },
];

export const BridgeCommandHUD: React.FC<BridgeCommandHUDProps> = ({
  shipState,
  activeStation,
  enemies,
  onSelectStation,
  onExitBridgeToChase,
  onResetLook,
  onAdjustLook,
  onTargetHostile,
  onOpenPlanetaryScanner,
  onOpenObjectDetails,
  onSetViewscreenZoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSummonHostiles,
}) => {
  const [viewscreenZoom, setViewscreenZoomState] = useState<number>(1);
  const [hideTopBar, setHideTopBar] = useState<boolean>(false);

  const cycleViewscreenZoom = () => {
    const next = viewscreenZoom === 1 ? 2 : viewscreenZoom === 2 ? 4 : 1;
    setViewscreenZoomState(next);
    onSetViewscreenZoom?.(next);
    soundEffects.playLcarsBeep(860, 0.06);
  };

  const cycleStationOrder = () => {
    const order: BridgeStationId[] = [
      'captain',
      'helm',
      'science',
      'tactical',
      'comms',
      'engineering',
      'overview',
    ];
    const idx = order.indexOf(activeStation);
    const next = order[(idx + 1) % order.length];
    soundEffects.playLcarsBeep(760, 0.06);
    onSelectStation(next);
  };

  const getStationIcon = (id: BridgeStationId) => {
    switch (id) {
      case 'captain':
        return <Shield className="w-3.5 h-3.5" />;
      case 'helm':
        return <Compass className="w-3.5 h-3.5" />;
      case 'science':
        return <Atom className="w-3.5 h-3.5" />;
      case 'tactical':
        return <Crosshair className="w-3.5 h-3.5" />;
      case 'comms':
        return <Radio className="w-3.5 h-3.5" />;
      case 'engineering':
        return <Wrench className="w-3.5 h-3.5" />;
      case 'overview':
        return <Eye className="w-3.5 h-3.5" />;
    }
  };

  const aliveHostiles = enemies.filter((e) => e.isAlive);
  const povZoomPct = Math.round((1 / (shipState?.cameraZoom || 1)) * 100);

  if (hideTopBar) {
    return (
      <div className="fixed top-[68px] right-4 z-40 pointer-events-auto">
        <button
          onClick={() => {
            soundEffects.playLcarsBeep(660, 0.05);
            setHideTopBar(false);
          }}
          className="px-2.5 py-1 rounded bg-slate-950/85 hover:bg-slate-900 border border-cyan-500/50 text-cyan-300 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md shadow-lg"
          title="Restore Bridge Station Selector Bar"
        >
          <Eye className="w-3 h-3" />
          Show Station Bar [Key 1: Cycle]
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-[68px] left-1/2 -translate-x-1/2 z-40 w-[96vw] max-w-6xl pointer-events-none select-none">
      {/* Positioned cleanly below LCARSHeader (top-[68px]) so it is never hidden behind the upper panel */}
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/75 border border-slate-700/70 backdrop-blur-md shadow-xl">
        {/* Station Selection Buttons (1-6) */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={cycleStationOrder}
            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
            title="Press '1' at any time to cycle through 3D Bridge Stations"
          >
            [Key 1] Next
          </button>

          {BRIDGE_STATIONS.map((st) => {
            const isActive = st.id === activeStation;
            return (
              <button
                key={st.id}
                onClick={() => {
                  soundEffects.playLcarsBeep(740, 0.05);
                  onSelectStation(st.id);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-trek uppercase tracking-wider transition-all border ${
                  isActive
                    ? `${st.bgClass} ${st.borderClass} ${st.textClass} font-bold shadow-sm`
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                {getStationIcon(st.id)}
                <span>{st.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Right Compact Camera, POV Zoom & Viewscreen Tools */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Quick Hostile Target Switch / Summon when at Tactical */}
          <button
            onClick={() => {
              soundEffects.playLcarsBeep(840, 0.05);
              if (aliveHostiles.length > 0) {
                onTargetHostile();
              } else {
                onSummonHostiles?.();
              }
            }}
            className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 text-[10px] font-mono font-bold uppercase flex items-center gap-1"
            title={
              aliveHostiles.length > 0
                ? 'Quick-Switch Locked Enemy Target [Tab]'
                : 'Summon Hostile Fleet to Lock & Test Torpedoes'
            }
          >
            <Crosshair className="w-3 h-3 text-rose-400" />
            {aliveHostiles.length > 0
              ? `Switch Hostile (${aliveHostiles.length})`
              : 'Summon Hostiles'}
          </button>

          {/* POV Camera Zoom In / Out (Matches outside ship POV zoom + Scroll Wheel) */}
          <div className="flex items-center bg-slate-900/75 rounded border border-cyan-500/40 p-0.5">
            <button
              onClick={() => {
                soundEffects.playLcarsBeep(720, 0.04);
                onZoomOut?.();
              }}
              className="px-1.5 py-0.5 text-cyan-300 hover:text-white flex items-center gap-0.5 text-[10px] font-mono"
              title="Zoom Out POV (Wider Bridge View / Scroll Down)"
            >
              <ZoomOut className="w-3 h-3" />
              <span>-</span>
            </button>
            <button
              onClick={() => {
                soundEffects.playLcarsBeep(800, 0.04);
                onResetZoom?.();
              }}
              className="px-1.5 py-0.5 text-[9px] font-mono text-slate-200 hover:text-cyan-300 border-x border-slate-700/70"
              title="Reset POV Zoom to 100%"
            >
              POV {povZoomPct}%
            </button>
            <button
              onClick={() => {
                soundEffects.playLcarsBeep(880, 0.04);
                onZoomIn?.();
              }}
              className="px-1.5 py-0.5 text-cyan-300 hover:text-white flex items-center gap-0.5 text-[10px] font-mono"
              title="Zoom In POV (Closer to 3D Console & Monitor / Scroll Up)"
            >
              <ZoomIn className="w-3 h-3" />
              <span>+</span>
            </button>
          </div>

          <button
            onClick={cycleViewscreenZoom}
            className={`px-2 py-1 rounded border text-[10px] font-mono font-bold uppercase transition-all ${
              viewscreenZoom > 1
                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title="Cycle 3D Main Viewscreen & Tactical Feed Magnification (1x / 2x / 4x)"
          >
            Screen {viewscreenZoom}x
          </button>

          {shipState?.selectedTargetId && (
            <>
              <button
                onClick={() => {
                  soundEffects.playLcarsBeep(820, 0.05);
                  onOpenObjectDetails?.();
                }}
                className="px-2 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 text-[10px] font-mono uppercase flex items-center gap-1"
                title="Inspect Target Dossier"
              >
                <Info className="w-3 h-3" />
                Dossier
              </button>
              <button
                onClick={() => {
                  soundEffects.playLcarsBeep(880, 0.05);
                  onOpenPlanetaryScanner();
                }}
                className="px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-[10px] font-mono uppercase flex items-center gap-1"
                title="Open Deep Spectroscopy Lab"
              >
                <Search className="w-3 h-3" />
                Scan Lab
              </button>
            </>
          )}

          {/* 360° Head Pan / Reset */}
          <div className="flex items-center bg-slate-900/60 rounded border border-slate-700/70 p-0.5">
            <button
              onClick={() => onAdjustLook(0.22, 0)}
              className="p-0.5 text-slate-300 hover:text-cyan-300"
              title="Look Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAdjustLook(0, 0.14)}
              className="p-0.5 text-slate-300 hover:text-cyan-300"
              title="Look Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetLook}
              className="px-1 text-[9px] font-mono text-cyan-300 hover:text-white flex items-center gap-0.5"
              title="Center Camera on Station Console & Monitor"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Center
            </button>
            <button
              onClick={() => onAdjustLook(0, -0.14)}
              className="p-0.5 text-slate-300 hover:text-cyan-300"
              title="Look Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onAdjustLook(-0.22, 0)}
              className="p-0.5 text-slate-300 hover:text-cyan-300"
              title="Look Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setHideTopBar(true)}
            className="p-1 rounded bg-slate-900/60 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white"
            title="Minimize Top Station Bar"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              soundEffects.playLcarsBeep(520, 0.06);
              onExitBridgeToChase();
            }}
            className="px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-600/80 text-slate-200 text-[10px] font-trek uppercase tracking-wider flex items-center gap-1"
            title="Switch to External Ship Camera [V]"
          >
            <Eye className="w-3 h-3 text-amber-400" />
            Ext Cam [V]
          </button>
        </div>
      </div>
    </div>
  );
};
