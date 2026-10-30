// Planetary Spectroscopic Analysis & Interactive Cosmic Discovery Playground
// Designed for live Science Exhibition visitors: combines real planetary astrophysics
// with fun, plain-English "What If You Visited Here?" interactive simulations,
// a Gravity Jump Tester, and a live 3D Orbital Laser Probe (+75 XP).

import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Radio,
  Sparkles,
  Shield,
  CheckCircle2,
  RotateCcw,
  BarChart3,
  Atom,
  Droplets,
  Rocket,
  Zap,
  Award,
} from 'lucide-react';
import { PlanetaryScienceData, getPlanetaryScienceData } from '../data/planetaryScienceData';
import { soundEffects } from '../audio/soundEffects';

interface PlanetaryScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlanetId?: string;
  targetPlanetName?: string;
  systemName?: string;
  objectType?: string;
  onPlotCourseToTarget?: () => void;
  onFireDeflectorBeam?: (coords?: [number, number, number], colorHex?: number, duration?: number) => void;
  onAwardScienceXp?: (xp: number, label: string) => void;
}

export const PlanetaryScannerModal: React.FC<PlanetaryScannerModalProps> = ({
  isOpen,
  onClose,
  targetPlanetId = 'sol_earth',
  targetPlanetName = 'Earth (Sector 001)',
  systemName = 'Sol System',
  objectType = 'terran',
  onPlotCourseToTarget,
  onFireDeflectorBeam,
  onAwardScienceXp,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'playground' | 'atmosphere' | 'geophysics' | 'habitability'>('playground');

  // Interactive Playground States
  const [earthWeightKg, setEarthWeightKg] = useState<number>(70);
  const [isJumping, setIsJumping] = useState<boolean>(false);
  const [probeLaunched, setProbeLaunched] = useState<boolean>(false);
  const [laserFiredCount, setLaserFiredCount] = useState<number>(0);

  const scienceData: PlanetaryScienceData = getPlanetaryScienceData(
    targetPlanetId,
    targetPlanetName,
    systemName,
    objectType
  );

  // Trigger scanning sequence when modal opens or target changes
  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setScanProgress(0);
      setProbeLaunched(false);
      setLaserFiredCount(0);
      const startTime = Date.now();
      const duration = 900;

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(100, Math.round((elapsed / duration) * 100));
        setScanProgress(progress);

        if (progress >= 100) {
          setIsScanning(false);
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    }
  }, [isOpen, targetPlanetId]);

  if (!isOpen) return null;

  const handleRescan = () => {
    soundEffects.playLcarsBeep(880, 0.12);
    setIsScanning(true);
    setScanProgress(0);
    const startTime = Date.now();
    const duration = 800;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      setScanProgress(progress);

      if (progress >= 100) {
        setIsScanning(false);
        clearInterval(interval);
      }
    }, 30);
  };

  // Interactive Physics Calculations for Visitors
  const gravityG = Math.max(0.05, scienceData.surfaceGravityG || 1.0);
  const planetWeightKg = Math.round(earthWeightKg * gravityG);
  const earthJumpMeters = 0.5;
  const planetJumpMeters = Number((earthJumpMeters / gravityG).toFixed(2));
  const hangTimeSeconds = Number((0.64 / Math.sqrt(gravityG)).toFixed(2));

  // Fun Plain-English "What Happens If You Step Outside?" Generator
  const getHumanSurvivalStory = () => {
    const tempC = scienceData.meanSurfaceTempC;
    const pressure = scienceData.surfacePressureAtm;
    const cls = scienceData.classification.toLowerCase();

    if (cls.includes('gas') || cls.includes('jovian') || pressure > 100) {
      return {
        verdict: '☁️ NO SOLID GROUND — DIAMOND RAIN!',
        color: 'text-amber-300 border-amber-500/40 bg-amber-950/40',
        story: `There is no solid surface to stand on! As you descend into ${scienceData.name}'s clouds, extreme lightning storms zap carbon atoms into literal falling diamonds before ${pressure.toLocaleString()}× Earth pressure squeezes gases into a glowing metallic ocean!`,
      };
    }
    if (scienceData.earthSimilarityIndex >= 0.8) {
      return {
        verdict: '🌿 SHIRT-SLEEVE PARADISE (BREATHABLE!)',
        color: 'text-emerald-300 border-emerald-500/40 bg-emerald-950/40',
        story: `You can step right out of the shuttlecraft without a spacesuit! With a comfortable ${tempC}°C temperature, ${pressure} atm air pressure, and liquid water oceans, ${scienceData.name} feels remarkably like home.`,
      };
    }
    if (tempC > 120) {
      return {
        verdict: '🌋 THERMAL OVEN — SPACESUIT COOLING REQUIRED!',
        color: 'text-orange-300 border-orange-500/40 bg-orange-950/40',
        story: `At ${tempC}°C, a pizza would bake on a rock in seconds! You need a Starfleet Mark-VI thermal-shielded environmental suit to explore the surface without sizzling.`,
      };
    }
    if (tempC < -60) {
      return {
        verdict: '❄️ DEEP-FREEZE CRYO WORLD!',
        color: 'text-cyan-300 border-cyan-500/40 bg-cyan-950/40',
        story: `At a frigid ${tempC}°C, normal water ice is as hard as granite bedrock! Your breath would freeze into tinkling ice crystals in mid-air before hitting the ground.`,
      };
    }
    return {
      verdict: '🧑‍🚀 EXOSUIT & OXYGEN MASK REQUIRED',
      color: 'text-sky-300 border-sky-500/40 bg-sky-950/40',
      story: `Gravity feels ${gravityG > 1.15 ? 'heavier than Earth' : gravityG < 0.85 ? 'bouncy and light' : 'just like Earth'}, and temperature is ${tempC}°C, but the atmosphere lacks enough breathable oxygen (${pressure} atm). Keep your helmet visor locked!`,
    };
  };

  const survival = getHumanSurvivalStory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-950/95 border border-sky-500/60 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-trek">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase font-bold">
                  Interactive Science & Discovery Lab
                </span>
                <span className="text-xs text-slate-400 font-mono-nums">{scienceData.systemName}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide mt-0.5">
                {scienceData.name} · Live Cosmic Explorer
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRescan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-trek uppercase font-bold flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50 cursor-pointer"
              title="Rescan Target Frequency"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Rescan</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scan Progress Bar (Active During Sweep) */}
        {isScanning && (
          <div className="w-full bg-slate-900 border-b border-sky-500/40 p-2.5">
            <div className="flex items-center justify-between text-xs font-mono-nums text-sky-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-spin" />
                <span>MULTISPECTRAL TRIANGULATION IN PROGRESS...</span>
              </span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-sky-500/30">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-300 transition-all duration-75"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Overview Metric Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-900/50 border-b border-slate-800 text-xs font-mono-nums">
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-trek">World Type</div>
            <div className="text-sm font-bold text-sky-300 truncate">{scienceData.classification}</div>
            <div className="text-[10px] text-slate-500">{scienceData.spectralClass}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-trek">Earth-Like Score</div>
            <div className="text-sm font-bold text-amber-300">
              {(scienceData.earthSimilarityIndex * 100).toFixed(0)}% Match
            </div>
            <div className="text-[10px] text-slate-500">Habitability: {scienceData.habitabilityStatus}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-trek">Surface Gravity</div>
            <div className="text-sm font-bold text-slate-100">
              {scienceData.surfaceGravityG.toFixed(2)}× Earth ({scienceData.surfaceGravityMs2.toFixed(1)} m/s²)
            </div>
            <div className="text-[10px] text-slate-500">Air Pressure: {scienceData.surfacePressureAtm} atm</div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-trek">Surface Weather</div>
            <div className="text-sm font-bold text-cyan-300">
              {scienceData.meanSurfaceTempC}°C ({scienceData.meanSurfaceTempK} K)
            </div>
            <div className="text-[10px] text-slate-500">Magnetic Shield: {scienceData.magneticFieldGauss} G</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-slate-800 bg-slate-950 px-4 text-xs font-trek uppercase">
          {[
            { id: 'playground', label: '🎮 Interactive Cosmic Playground', icon: Rocket },
            { id: 'atmosphere', label: 'Atmospheric Gases', icon: Atom },
            { id: 'geophysics', label: 'Core & Magnetic Shield', icon: Shield },
            { id: 'habitability', label: 'Life & Water Check', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playLcarsBeep(740, 0.08);
                  setActiveTab(tab.id as any);
                }}
                className={`py-2.5 px-3.5 font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans">
          {activeTab === 'playground' && (
            <div className="space-y-4">
              {/* 1. What Happens If You Step Outside? */}
              <div className={`p-3.5 rounded-xl border ${survival.color}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-trek uppercase tracking-widest opacity-80">
                    What If You Visited {scienceData.name}?
                  </span>
                  <span className="text-xs font-trek font-extrabold uppercase tracking-wider">
                    {survival.verdict}
                  </span>
                </div>
                <p className="text-xs text-slate-100 leading-relaxed">{survival.story}</p>
              </div>

              {/* 2. Interactive Gravity & Astronaut Jump Simulator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-trek font-bold text-cyan-300 uppercase tracking-wider">
                      🏃 Gravity & Jump Simulator
                    </span>
                    <span className="text-xs font-mono-nums text-amber-300 font-bold">
                      {gravityG.toFixed(2)}× Earth Gravity
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Your Weight on Earth: <strong>{earthWeightKg} kg</strong></span>
                      <span className="text-cyan-300 font-bold">
                        Here: {planetWeightKg} kg ({Math.round(planetWeightKg * 2.205)} lbs)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={120}
                      step={1}
                      value={earthWeightKg}
                      onChange={(e) => setEarthWeightKg(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  {/* Visual Jump Comparison Arena */}
                  <div className="relative h-24 rounded-lg bg-slate-950 border border-slate-800 p-2.5 flex items-end justify-around overflow-hidden">
                    <div className="text-center">
                      <div
                        className={`text-lg transition-transform duration-500 ${
                          isJumping ? '-translate-y-6' : 'translate-y-0'
                        }`}
                      >
                        🧑‍🚀
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-nums mt-1">
                        Earth Jump: <strong className="text-white">0.50m</strong>
                      </div>
                    </div>

                    <div className="h-14 w-px bg-slate-800" />

                    <div className="text-center">
                      <div
                        className="text-lg transition-transform duration-500"
                        style={{
                          transform: isJumping
                            ? `translateY(-${Math.min(54, Math.max(8, Math.round(planetJumpMeters * 36)))}px)`
                            : 'translateY(0px)',
                        }}
                      >
                        🚀
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono-nums mt-1">
                        {scienceData.name.split(' ')[0]} Jump: <strong className="text-amber-300">{planetJumpMeters}m</strong> ({hangTimeSeconds}s airtime)
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      soundEffects.playLcarsBeep(980, 0.14);
                      setIsJumping(true);
                      setTimeout(() => setIsJumping(false), 650);
                    }}
                    className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-trek font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow"
                  >
                    ⚡ Test Astronaut Jump on {scienceData.name.split(' ')[0]}!
                  </button>
                </div>

                {/* 3. Live 3D Orbital Laser & Deep-Core Probe Experiment */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-trek font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />
                        <span>Live 3D Ship-to-Planet Experiment</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                        +75 XP Reward
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Fire a real 3D Spectroscopic Laser Beam from the USS Enterprise in space behind this panel to vaporize upper-atmosphere aerosols and reveal {scienceData.name}'s hidden scientific wonders!
                    </p>
                  </div>

                  {/* Mind-Blowing Cosmic Secrets Unlocked */}
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-purple-500/30 space-y-1.5">
                    <div className="text-[10px] font-trek uppercase text-purple-300 font-bold">
                      💡 Mind-Blowing Cosmic Facts About {scienceData.name}:
                    </div>
                    <ul className="space-y-1 text-xs text-slate-200">
                      {scienceData.scienceHighlights.map((highlight: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">★</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setLaserFiredCount((c) => c + 1);
                        onFireDeflectorBeam?.(undefined, 0x38bdf8, 3.5);
                        soundEffects.playPhaserBeam();
                      }}
                      className="py-2 px-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-trek font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Fire 3D Laser ({laserFiredCount})</span>
                    </button>

                    <button
                      disabled={probeLaunched}
                      onClick={() => {
                        setProbeLaunched(true);
                        onFireDeflectorBeam?.(undefined, 0x10b981, 4.0);
                        onAwardScienceXp?.(75, `Planetary Science Probe: ${scienceData.name}`);
                      }}
                      className={`py-2 px-2.5 rounded-lg font-trek font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        probeLaunched
                          ? 'bg-emerald-950 border border-emerald-400 text-emerald-300'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{probeLaunched ? '✓ +75 XP Claimed!' : 'Launch Probe (+75 XP)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'atmosphere' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-sky-950/30 border border-sky-500/30 text-xs">
                <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wide mb-1 flex items-center gap-1.5 font-trek">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  What Is the Sky Made Of? (Atmospheric Gas Breakdown)
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Every chemical gas absorbs a unique "barcode" of starlight colors. Here is what our sensors found floating in {scienceData.name}'s sky:
                </p>
              </div>

              <div className="space-y-3">
                {scienceData.atmosphereGases.map((gas: any) => (
                  <div key={gas.chemicalFormula} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: gas.color }}
                        />
                        <span className="font-bold text-white">{gas.name}</span>
                        <span className="font-mono-nums text-sky-400 font-bold">({gas.chemicalFormula})</span>
                      </div>
                      <span className="font-mono-nums text-sm font-extrabold text-white">
                        {gas.percentage.toFixed(2)}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-1.5">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, gas.percentage)}%`,
                          backgroundColor: gas.color,
                        }}
                      />
                    </div>

                    <div className="text-xs text-slate-300">
                      💡 <strong>What it does:</strong> {gas.scientificRole}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'geophysics' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide mb-2 flex items-center gap-1.5 font-trek">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Inside the Planet & Invisible Magnetic Forcefield
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed mb-3">
                  {scienceData.geophysicalSummary}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs font-mono-nums">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Magnetic Forcefield:</span>
                    <span className="text-emerald-400 font-bold">{scienceData.magneticFieldGauss} Gauss</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Cosmic Radiation Dose:</span>
                    <span className="text-amber-300 font-bold">{scienceData.radiationLevelRadHr} rad/hr</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Surface Gravity:</span>
                    <span className="text-sky-300 font-bold">{scienceData.surfaceGravityG.toFixed(2)}× Earth</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Air Pressure:</span>
                    <span className="text-cyan-300 font-bold">{scienceData.surfacePressureAtm}× Earth</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'habitability' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="relative w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center shrink-0">
                  <div
                    className={`absolute inset-0 rounded-full border-4 ${
                      scienceData.earthSimilarityIndex > 0.8
                        ? 'border-emerald-400'
                        : scienceData.earthSimilarityIndex > 0.5
                        ? 'border-amber-400'
                        : 'border-red-400'
                    }`}
                  />
                  <div className="text-center font-mono-nums">
                    <div className="text-2xl font-black text-white">
                      {(scienceData.earthSimilarityIndex * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase">Earth Match</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-trek uppercase">Can Life Thrive Here?</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        scienceData.habitabilityStatus === 'Optimal'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : scienceData.habitabilityStatus === 'Marginal'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-red-950 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {scienceData.habitabilityStatus}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Astronomers use the <strong>Earth Similarity Index (ESI)</strong> from 0% to 100% to score how closely an alien world matches Earth's size, gravity, and temperature so liquid water can exist on the surface.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-nums">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span>Liquid Water Oceans/Lakes:</span>
                  </div>
                  <span className={`font-bold ${scienceData.hasLiquidWater ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {scienceData.hasLiquidWater ? 'YES — DETECTED!' : 'NONE FOUND'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Signs of Living Organisms:</span>
                  </div>
                  <span className={`font-bold ${scienceData.biosignaturesDetected ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {scienceData.biosignaturesDetected ? 'CONFIRMED!' : 'NEGATIVE'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono-nums text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Live 3D sensors linked with USS Enterprise main deflector</span>
          </div>

          <div className="flex items-center gap-2">
            {onPlotCourseToTarget && (
              <button
                onClick={() => {
                  onPlotCourseToTarget();
                  onClose();
                }}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-trek font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-sky-500/20 cursor-pointer"
              >
                Set Course & Warp to {scienceData.name.split(' (')[0]}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-trek font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
