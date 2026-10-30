import React, { useState } from 'react';
import {
  Shield,
  Wrench,
  Zap,
  Anchor,
  Flame,
  Users,
  Activity,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Gauge,
  Cpu,
  Layers,
} from 'lucide-react';
import { StationOperationsState } from '../types/simulation';
import { soundEffects } from '../audio/soundEffects';

interface StationOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stationOps: StationOperationsState | null;
  onDeployDrones: (count: number, mode: 'ablative' | 'structural' | 'microweld' | 'overhaul') => void;
  onRecallDrones: () => void;
  onToggleClamps: () => void;
  onToggleShorePower: () => void;
  onRefuelAntimatter: () => void;
  onReloadTorpedoes: (type: 'photon' | 'quantum' | 'tricobalt') => void;
  onRealignDilithium: (frequency: number) => void;
  onPurgeCoolant: () => void;
  onGrantShoreLeave: () => void;
  onTriageMedical: () => void;
  onUndock: () => void;
  onTestDamageDemo?: () => void;
}

export const StationOperationsModal: React.FC<StationOperationsModalProps> = ({
  isOpen,
  onClose,
  stationOps,
  onDeployDrones,
  onRecallDrones,
  onToggleClamps,
  onToggleShorePower,
  onRefuelAntimatter,
  onReloadTorpedoes,
  onRealignDilithium,
  onPurgeCoolant,
  onGrantShoreLeave,
  onTriageMedical,
  onUndock,
  onTestDamageDemo,
}) => {
  const [activeTab, setActiveTab] = useState<'hull' | 'clamps' | 'antimatter' | 'torpedoes' | 'warp_core' | 'coolant' | 'crew'>('hull');
  const [selectedDroneCount, setSelectedDroneCount] = useState<number>(2);
  const [selectedRepairMode, setSelectedRepairMode] = useState<'ablative' | 'structural' | 'microweld' | 'overhaul'>('structural');
  const [dilithiumSliderVal, setDilithiumSliderVal] = useState<number>(stationOps?.dilithiumFrequencyMhz ?? 248.5);
  const [selectedTorpedoType, setSelectedTorpedoType] = useState<'photon' | 'quantum' | 'tricobalt'>('photon');

  if (!isOpen || !stationOps) return null;

  const hullPct = Math.round(stationOps.hullIntegrity);
  const isHullDamaged = hullPct < 100;
  const isProceduralDamageActive = hullPct < 50;

  const playTabBeep = () => {
    soundEffects.playLcarsBeep(680, 0.08);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-950 border border-amber-500/50 shadow-2xl shadow-amber-950/40 overflow-hidden text-slate-100">
        
        {/* ======================================================== */}
        {/* LCARS TOP MASTHEAD BANNER & STATION DESIGNATION */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-slate-950 font-trek uppercase tracking-widest font-extrabold text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-950" />
            </div>
            <span className="text-sm font-black tracking-wider">
              {stationOps.stationName || 'STARFLEET DEEP SPACE OUTPOST SPACEDOCK ONE'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950/30 font-mono font-bold tracking-normal text-slate-950">
              BERTH 01 // INTERSTELLAR VOID OUTPOST
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundEffects.playLcarsAcknowledge();
                onUndock();
                onClose();
              }}
              className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-900 text-amber-300 font-trek font-bold text-[10px] tracking-wider transition-colors shadow"
              title="Disengage clamps and depart station [X]"
            >
              UNDOCK SHIP [X]
            </button>
            <button
              onClick={() => {
                soundEffects.playLcarsBeep(520, 0.08);
                onClose();
              }}
              className="p-1 rounded hover:bg-slate-950/30 text-slate-950 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LCARS SUB-BAR: QUICK STATUS INDICATORS */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-amber-500/30 text-[11px] font-mono-nums text-slate-300">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>MOORING:</span>
              <span className="text-slate-100 font-bold">{stationOps.clampsEngaged ? 'LOCKED (14.7 PSI)' : 'DISENGAGED'}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>HULL INTEGRITY:</span>
              <span className={`font-bold ${hullPct < 50 ? 'text-red-400 animate-pulse' : hullPct < 100 ? 'text-amber-300' : 'text-emerald-400'}`}>
                {hullPct}%
              </span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>POWER:</span>
              <span className="text-slate-100 font-bold">{stationOps.shorePowerConnected ? 'SHORE GRID FEED' : 'INTERNAL REACTOR'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onTestDamageDemo && (
              <button
                onClick={() => {
                  onTestDamageDemo();
                  soundEffects.playLcarsAcknowledge();
                }}
                className="px-2 py-0.5 rounded bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/50 text-[10px] font-trek font-bold uppercase transition-all shadow"
                title="Inflict 45% combat damage to demonstrate procedural scorch marks and drone welding repairs"
              >
                Simulate Combat Damage (-45%)
              </button>
            )}
            <span className="text-[10px] font-mono text-slate-400">STARDATE 47214.8</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN BODY: LCARS VERTICAL ELBOW NAVIGATION & CONTENT */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[480px]">
          
          {/* LEFT LCARS NAVIGATION COLUMN */}
          <div className="w-full md:w-64 bg-slate-950/90 border-r border-amber-500/30 flex flex-col p-2.5 gap-1.5 shrink-0 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-trek font-bold uppercase tracking-widest text-amber-400/80 border-b border-slate-800">
              Station Subsystems // LCARS 47
            </div>

            {/* Subsystem 1: Hull Maintenance & Repair Drones (Centerpiece) */}
            <button
              onClick={() => {
                setActiveTab('hull');
                playTabBeep();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                activeTab === 'hull'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-trek uppercase tracking-wide">Hull Maintenance</span>
                  <span className={`text-[9.5px] font-mono-nums ${activeTab === 'hull' ? 'text-slate-950' : 'text-slate-400'}`}>
                    Repair Drones · {hullPct}%
                  </span>
                </div>
              </div>
              {stationOps.dronesDeployed && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            {/* Subsystem 2: Docking Clamps & Pressurization */}
            <button
              onClick={() => {
                setActiveTab('clamps');
                playTabBeep();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                activeTab === 'clamps'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-trek uppercase tracking-wide">Docking Clamps</span>
                  <span className={`text-[9.5px] font-mono-nums ${activeTab === 'clamps' ? 'text-slate-950' : 'text-slate-400'}`}>
                    Hydraulic Gantries · {stationOps.clampsEngaged ? '14.7 PSI' : '0 PSI'}
                  </span>
                </div>
              </div>
            </button>

            {/* Subsystem 3: Antimatter & Deuterium Refueling */}
            <button
              onClick={() => {
                setActiveTab('antimatter');
                playTabBeep();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                activeTab === 'antimatter'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-trek uppercase tracking-wide">Antimatter Refuel</span>
                  <span className={`text-[9.5px] font-mono-nums ${activeTab === 'antimatter' ? 'text-slate-950' : 'text-slate-400'}`}>
                    Magnetic Core · {Math.round(stationOps.antimatterLevel)}%
                  </span>
                </div>
              </div>
              {stationOps.isRefuelingAntimatter && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            {/* Subsystem 4: Photon & Quantum Torpedo Resupply */}
            <button
              onClick={() => {
                setActiveTab('torpedoes');
                playTabBeep();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                activeTab === 'torpedoes'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-trek uppercase tracking-wide">Torpedo Resupply</span>
                  <span className={`text-[9.5px] font-mono-nums ${activeTab === 'torpedoes' ? 'text-slate-950' : 'text-slate-400'}`}>
                    Carousel Hoist · {stationOps.torpedoCount}/30
                  </span>
                </div>
              </div>
              {stationOps.isReloadingTorpedoes && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Subsystem 5: Warp Core & Dilithium Matrix */}
            <button
              onClick={() => {
                setActiveTab('warp_core');
                playTabBeep();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                activeTab === 'warp_core'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-trek uppercase tracking-wide">Warp Core Diagnostics</span>
                  <span className={`text-[9.5px] font-mono-nums ${activeTab === 'warp_core' ? 'text-slate-950' : 'text-slate-400'}`}>
                    Dilithium Matrix · {stationOps.dilithiumAlignmentPercent}%
                  </span>
                </div>
              </div>
            </button>

            {/* Subsystem 6: Reactor Coolant Purging */}
            <button
              onClick={() => {
                setActiveTab('coolant');
                playTabBeep();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                activeTab === 'coolant'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-trek uppercase tracking-wide">Coolant Purge</span>
                  <span className={`text-[9.5px] font-mono-nums ${activeTab === 'coolant' ? 'text-slate-950' : 'text-slate-400'}`}>
                    Radiators · {stationOps.coolantTempKelvin} K
                  </span>
                </div>
              </div>
              {stationOps.isPurgingCoolant && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            {/* Subsystem 7: Crew Transfers & Shore Leave */}
            <button
              onClick={() => {
                setActiveTab('crew');
                playTabBeep();
              }}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                activeTab === 'crew'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-trek uppercase tracking-wide">Crew & Shore Leave</span>
                  <span className={`text-[9.5px] font-mono-nums ${activeTab === 'crew' ? 'text-slate-950' : 'text-slate-400'}`}>
                    Readiness · {stationOps.crewMoralePercent}%
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* RIGHT LCARS SUBSYSTEM DETAILS DISPLAY */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-950/60">

            {/* ======================================================== */}
            {/* TAB 1: HULL MAINTENANCE & REPAIR DRONES (THE CENTERPIECE) */}
            {/* ======================================================== */}
            {activeTab === 'hull' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
                  <div>
                    <h3 className="font-trek text-base md:text-lg text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-amber-400" />
                      <span>AUTONOMOUS REPAIR DRONES // PROCEDURAL HULL RESTORATION</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Spacedock repair drones deploy from wall alcoves to weld damaged sections with laser arcs and restore procedural tritanium plating over time.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                      stationOps.dronesDeployed
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 animate-pulse'
                        : hullPct >= 100
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                        : 'bg-amber-950 text-amber-300 border border-amber-500'
                    }`}>
                      {stationOps.dronesDeployed ? `DRONES ACTIVE (${stationOps.droneCount} UNITS)` : hullPct >= 100 ? 'HULL NOMINAL (100%)' : 'DRONES ON STANDBY'}
                    </span>
                  </div>
                </div>

                {/* Live Progress Bar & Integrity Telemetry */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono-nums">
                    <div className="flex items-center gap-2">
                      <Activity className={`w-4 h-4 ${hullPct < 50 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
                      <span className="font-trek font-bold uppercase text-slate-200">Structural Plating Integrity:</span>
                      <span className={`text-base font-extrabold ${hullPct < 50 ? 'text-red-400' : hullPct < 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {hullPct}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>Repair Rate: <strong className="text-cyan-300">+{stationOps.repairRatePerSec.toFixed(1)}%/sec</strong></span>
                      <span>·</span>
                      <span>ETA to 100%: <strong className="text-amber-300">{stationOps.estimatedSecondsRemaining}s</strong></span>
                    </div>
                  </div>

                  {/* Progressive Bar */}
                  <div className="w-full h-3.5 rounded-full bg-slate-950 p-0.5 border border-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        hullPct < 50
                          ? 'bg-gradient-to-r from-red-600 via-amber-500 to-amber-400'
                          : 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400'
                      } ${stationOps.dronesDeployed ? 'animate-pulse' : ''}`}
                      style={{ width: `${hullPct}%` }}
                    />
                  </div>

                  {/* Procedural Shader Status Readout */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono-nums">
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-trek">Scorch Marks</div>
                      <div className={`font-bold ${isProceduralDamageActive ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isProceduralDamageActive ? 'Visible (FBM Carbon)' : 'Clear & Polished'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-trek">Structural Breaches</div>
                      <div className={`font-bold ${isProceduralDamageActive ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isProceduralDamageActive ? 'Torn Plating (Molten Rim)' : 'Ablative Tritanium Sealed'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-trek">Spark Arcs</div>
                      <div className={`font-bold ${isProceduralDamageActive ? 'text-cyan-300' : 'text-emerald-400'}`}>
                        {isProceduralDamageActive ? 'High-Freq Filaments' : 'Nominal Current'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <div className="text-slate-400 text-[10px] uppercase font-trek">Shader Cutoff</div>
                      <div className="text-slate-200 font-bold">50% Integrity</div>
                    </div>
                  </div>
                </div>

                {/* Drone Deployment Configuration Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Drone Swarm Size Selector */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2.5">
                    <div className="text-xs font-trek uppercase font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Drone Swarm Allocation</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Select the number of autonomous Starfleet repair drones dispatched to the ship:</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          onClick={() => {
                            setSelectedDroneCount(count);
                            if (stationOps.dronesDeployed) {
                              onDeployDrones(count, selectedRepairMode);
                            } else {
                              soundEffects.playLcarsBeep(640, 0.08);
                            }
                          }}
                          className={`py-2 rounded-lg font-mono-nums text-xs font-bold transition-all ${
                            selectedDroneCount === count
                              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/40'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {count} {count === 1 ? 'Drone' : 'Drones'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Repair Protocol Mode */}
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2.5">
                    <div className="text-xs font-trek uppercase font-bold text-amber-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Repair Protocol Protocol</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Calibrates laser welding emitter frequency and tritanium feed rate:</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                      {[
                        { id: 'structural', label: 'Structural Matrix (+1.4x)' },
                        { id: 'ablative', label: 'Ablative Plating (+1.1x)' },
                        { id: 'microweld', label: 'Micro-Welding (+1.0x)' },
                        { id: 'overhaul', label: 'Full Overhaul (+1.8x)' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedRepairMode(m.id as any);
                            if (stationOps.dronesDeployed) {
                              onDeployDrones(selectedDroneCount, m.id as any);
                            } else {
                              soundEffects.playLcarsBeep(640, 0.08);
                            }
                          }}
                          className={`py-1.5 px-2 rounded-lg text-left text-[11px] font-semibold transition-all ${
                            selectedRepairMode === m.id
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Primary Drone Action Button */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  {!stationOps.dronesDeployed ? (
                    <button
                      onClick={() => onDeployDrones(selectedDroneCount, selectedRepairMode)}
                      className="flex-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 font-trek font-extrabold uppercase text-sm tracking-wider shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.99]"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Deploy Repair Drones ({selectedDroneCount} Units)</span>
                    </button>
                  ) : (
                    <button
                      onClick={onRecallDrones}
                      className="flex-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-trek font-extrabold uppercase text-sm tracking-wider shadow-lg shadow-red-600/30 transition-all active:scale-[0.99]"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Recall Drones to Bay Alcoves</span>
                    </button>
                  )}

                  <div className="text-[11px] font-mono text-slate-400 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Watch in 3D: Drones orbit the USS Enterprise and actively emit laser welding beams and sparks!</span>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: DOCKING CLAMP PRESSURIZATION & UMBILICALS */}
            {/* ======================================================== */}
            {activeTab === 'clamps' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="pb-2 border-b border-amber-500/30">
                  <h3 className="font-trek text-base md:text-lg text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-2">
                    <Anchor className="w-5 h-5 text-amber-400" />
                    <span>DOCKING CLAMP PRESSURIZATION & SHORE UMBILICALS</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Articulated hydraulic mooring arms with magnetic clamping pads, atmospheric collar pressurization, and station grid shore power.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Clamps Card */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-trek font-bold text-slate-200 uppercase text-xs">Primary Magnetic Moorings</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${stationOps.clampsEngaged ? 'bg-emerald-950 text-emerald-300 border border-emerald-500' : 'bg-amber-950 text-amber-300 border border-amber-500'}`}>
                        {stationOps.clampsEngaged ? 'HYDRAULICS LOCKED' : 'RETRACTED'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Telescoping hydraulic gantry arms extend from the bay walls to secure the starship's primary and secondary hulls.
                    </p>

                    <button
                      onClick={onToggleClamps}
                      className={`py-2 px-3 rounded-lg font-trek font-bold uppercase text-xs tracking-wider transition-all ${
                        stationOps.clampsEngaged
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      }`}
                    >
                      {stationOps.clampsEngaged ? 'Disengage Mooring Clamps' : 'Engage & Lock Mooring Clamps'}
                    </button>
                  </div>

                  {/* Pressurization Card */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-trek font-bold text-slate-200 uppercase text-xs">Atmospheric Umbilical Seal</span>
                      <span className="font-mono-nums text-xs font-bold text-cyan-300">
                        {stationOps.clampPressurePsi.toFixed(1)} PSI
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${(stationOps.clampPressurePsi / 14.7) * 100}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-400">
                      Standard Starfleet Class-M pressure: 14.7 PSI. Seals personnel gangways between Spacedock concourses and Enterprise airlocks.
                    </p>
                  </div>
                </div>

                {/* Shore Power & Life Support */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-trek font-bold text-slate-200 uppercase text-xs">Station Auxiliary Shore Power</div>
                      <div className="text-xs text-slate-400">Takes main reactor offline to conserve deuterium and allow preventative core maintenance.</div>
                    </div>
                    <button
                      onClick={onToggleShorePower}
                      className={`py-1.5 px-3 rounded-lg font-trek font-bold uppercase text-xs transition-all ${
                        stationOps.shorePowerConnected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {stationOps.shorePowerConnected ? 'Shore Power Active' : 'Connect Shore Power'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: ANTIMATTER & DEUTERIUM REFUELING */}
            {/* ======================================================== */}
            {activeTab === 'antimatter' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="pb-2 border-b border-amber-500/30">
                  <h3 className="font-trek text-base md:text-lg text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" />
                    <span>ANTIMATTER & CRYOGENIC DEUTERIUM REFUELING</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    High-security magnetic containment transfer from station bunker storage toroids into Enterprise warp core fuel pods.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Antimatter Gauge */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-trek font-bold text-slate-200 uppercase text-xs">Antimatter Containment Pods</span>
                      <span className="font-mono-nums font-bold text-cyan-300 text-sm">{Math.round(stationOps.antimatterLevel)}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                        style={{ width: `${stationOps.antimatterLevel}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                      <span>Field Stability: <strong className="text-emerald-400">99.98%</strong></span>
                      <span>Flow Rate: <strong className="text-cyan-300">{stationOps.antimatterFlowRate} L/s</strong></span>
                    </div>
                  </div>

                  {/* Deuterium Gauge */}
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-trek font-bold text-slate-200 uppercase text-xs">Cryogenic Deuterium Slush</span>
                      <span className="font-mono-nums font-bold text-emerald-300 text-sm">{Math.round(stationOps.deuteriumLevel)}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                        style={{ width: `${stationOps.deuteriumLevel}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex justify-between">
                      <span>Temperature: <strong className="text-cyan-300">18.2 K</strong></span>
                      <span>Feed Pressure: <strong className="text-emerald-400">420 kPa</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onRefuelAntimatter}
                  disabled={stationOps.isRefuelingAntimatter || (stationOps.antimatterLevel >= 100 && stationOps.deuteriumLevel >= 100)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-slate-950 font-trek font-extrabold uppercase text-sm tracking-wider shadow-lg shadow-amber-500/30 transition-all"
                >
                  {stationOps.isRefuelingAntimatter ? 'Refueling Antimatter & Deuterium in Progress...' : 'Initiate Antimatter & Deuterium Bunkering'}
                </button>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: PHOTON & QUANTUM TORPEDO RESUPPLY */}
            {/* ======================================================== */}
            {activeTab === 'torpedoes' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="pb-2 border-b border-amber-500/30">
                  <h3 className="font-trek text-base md:text-lg text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    <span>PHOTON TORPEDO MAGAZINE REPLENISHMENT</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Station ordnance cranes cycle the mechanized carousel hoist to replenish Mark VI warhead magazines (max 30 inventory).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono-nums">
                    <span className="font-trek font-bold text-slate-200 uppercase">Torpedo Magazine Inventory:</span>
                    <span className="text-base font-extrabold text-cyan-300">{stationOps.torpedoCount} / 30</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 transition-all duration-300"
                      style={{ width: `${(stationOps.torpedoCount / 30) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  {[
                    { id: 'photon', name: 'Mark VI Photon', desc: 'Standard high-yield antimatter warhead' },
                    { id: 'quantum', name: 'Quantum Torpedo', desc: 'Zero-point vacuum energy cascade' },
                    { id: 'tricobalt', name: 'Tricobalt Device', desc: 'Subspace tear shockwave warhead' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTorpedoType(t.id as any);
                        soundEffects.playLcarsBeep(640, 0.08);
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        selectedTorpedoType === t.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-trek font-bold uppercase text-slate-100">{t.name}</span>
                      <span className="text-[10px]">{t.desc}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onReloadTorpedoes(selectedTorpedoType)}
                  disabled={stationOps.isReloadingTorpedoes || stationOps.torpedoCount >= 30}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-50 text-slate-950 font-trek font-extrabold uppercase text-sm tracking-wider shadow-lg shadow-cyan-500/30 transition-all"
                >
                  {stationOps.isReloadingTorpedoes ? 'Loading Torpedoes via Carousel Hoist...' : `Cycle Hoist & Load ${selectedTorpedoType.toUpperCase()} Torpedoes (30 Max)`}
                </button>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 5: WARP CORE & DILITHIUM MATRIX DIAGNOSTICS */}
            {/* ======================================================== */}
            {activeTab === 'warp_core' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="pb-2 border-b border-amber-500/30">
                  <h3 className="font-trek text-base md:text-lg text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-amber-400" />
                    <span>WARP CORE & DILITHIUM MATRIX REALIGNMENT</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Re-align the Theta-Flux resonance frequency through the dilithium crystal lattice to maximize matter/antimatter reaction efficiency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-mono-nums">
                    <span className="font-trek font-bold text-slate-200 uppercase">Theta-Flux Tuning Frequency:</span>
                    <span className="font-mono text-cyan-300 font-bold text-sm">{dilithiumSliderVal.toFixed(1)} MHz (Target: 248.5 MHz)</span>
                  </div>

                  <input
                    type="range"
                    min="240.0"
                    max="260.0"
                    step="0.1"
                    value={dilithiumSliderVal}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setDilithiumSliderVal(val);
                      onRealignDilithium(val);
                    }}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-950 rounded-lg"
                  />

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Lattice Alignment: <strong className={stationOps.dilithiumAlignmentPercent > 95 ? 'text-emerald-400' : 'text-amber-400'}>{stationOps.dilithiumAlignmentPercent}%</strong></span>
                    <span>Warp Bonus: <strong className="text-cyan-300">+{stationOps.warpEfficiencyBonus}% Speed</strong></span>
                  </div>
                </div>

                {stationOps.warpEfficiencyBonus > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>DILITHIUM HARMONICS LOCKED: Optimal sub-space resonance achieved. Warp speed efficiency increased by +{stationOps.warpEfficiencyBonus}%.</span>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 6: REACTOR COOLANT PURGING */}
            {/* ======================================================== */}
            {activeTab === 'coolant' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="pb-2 border-b border-amber-500/30">
                  <h3 className="font-trek text-base md:text-lg text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-amber-400" />
                    <span>REACTOR COOLANT PURGE & RADIATOR FLUSH</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Flushes toxic tri-polymer coolant from warp nacelle and impulse radiators into space, venting heat buildup and restoring radiator conductivity.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-trek uppercase text-slate-300 font-bold">Coolant Core Temperature</span>
                    <span className="text-2xl font-mono-nums font-black text-cyan-300">{stationOps.coolantTempKelvin} K</span>
                    <span className="text-[11px] text-slate-400">Nominal baseline: 118 K</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-trek uppercase text-slate-300 font-bold">Radiator Heat-Sink Efficiency</span>
                    <span className="text-2xl font-mono-nums font-black text-emerald-400">{stationOps.radiatorEfficiencyPercent}%</span>
                    <span className="text-[11px] text-slate-400">Toxicity: {stationOps.coolantToxicityPercent}%</span>
                  </div>
                </div>

                <button
                  onClick={onPurgeCoolant}
                  disabled={stationOps.isPurgingCoolant || stationOps.coolantTempKelvin <= 120}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 disabled:opacity-50 text-white font-trek font-extrabold uppercase text-sm tracking-wider shadow-lg shadow-cyan-600/30 transition-all"
                >
                  {stationOps.isPurgingCoolant ? 'Venting Coolant Vapor Plume...' : 'Depressurize & Purge Coolant Plume into Space'}
                </button>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 7: CREW TRANSFERS & SHORE LEAVE */}
            {/* ======================================================== */}
            {activeTab === 'crew' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="pb-2 border-b border-amber-500/30">
                  <h3 className="font-trek text-base md:text-lg text-amber-400 uppercase tracking-wider font-extrabold flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    <span>CREW TRANSFERS & SHORE LEAVE ROTATION</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Manage Starfleet duty officer rotation, Spacedock promenade shore leave authorization, and starship medical triage.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-trek uppercase text-slate-200 font-bold">Crew Complement</span>
                      <span className="font-mono-nums font-bold text-slate-100">{stationOps.crewTotal} Personnel</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-trek uppercase text-slate-200 font-bold">Morale & Readiness</span>
                      <span className="font-mono-nums font-bold text-emerald-400">{stationOps.crewMoralePercent}%</span>
                    </div>
                    <button
                      onClick={onGrantShoreLeave}
                      disabled={stationOps.shoreLeaveGranted}
                      className="py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-trek font-bold uppercase text-xs transition-all shadow"
                    >
                      {stationOps.shoreLeaveGranted ? 'Shore Leave Authorized' : 'Authorize Promenade Shore Leave (+Morale)'}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-trek uppercase text-slate-200 font-bold">Sickbay & Medical Triage</span>
                      <span className="font-mono-nums font-bold text-cyan-300">
                        {stationOps.medicalTriageComplete ? 'ALL OFFICERS FIT' : 'TRIAGE REQUIRED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Starbase medical division provides specialized surgical facilities and emergency bio-bed treatment.
                    </p>
                    <button
                      onClick={onTriageMedical}
                      disabled={stationOps.medicalTriageComplete}
                      className="py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-trek font-bold uppercase text-xs transition-all shadow"
                    >
                      {stationOps.medicalTriageComplete ? 'Medical Clearance Complete' : 'Perform Full Medical Clearance'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ======================================================== */}
        {/* LCARS BOTTOM RUNNER FOOTER */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-amber-500/30 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-amber-300 font-bold">SPACEDOCK OPS SYSTEM:</span>
            <span>All station personnel and autonomous drones under command authorization.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-trek font-bold uppercase text-[10px] tracking-wider transition-colors"
          >
            RETURN TO FLIGHT HUD [ESC]
          </button>
        </div>

      </div>
    </div>
  );
};
