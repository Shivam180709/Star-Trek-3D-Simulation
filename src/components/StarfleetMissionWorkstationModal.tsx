import React, { useState, useEffect } from 'react';
import {
  StarfleetMission,
  ShipState,
} from '../types/simulation';
import { soundEffects } from '../audio/soundEffects';
import {
  Radio,
  Activity,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Crosshair,
  Sliders,
  Sparkles,
  X,
  BookOpen,
  Minimize2,
} from 'lucide-react';

interface StarfleetMissionWorkstationModalProps {
  isOpen: boolean;
  mission: StarfleetMission | null;
  shipState: ShipState | null;
  enemiesAliveCount: number;
  onMinimizeTo3DFlight: () => void;
  onAbortMission: () => void;
  onSetShieldHarmonics: (efficiencyPercent: number) => void;
  onStartPlanetaryDefenseWave: () => void;
  onFireDeflectorBeam: (coords?: [number, number, number], colorHex?: number, duration?: number) => void;
  onTriggerHazardShake: (intensity?: number) => void;
  onCompleteMission: (metrics: {
    accuracyScore: number;
    tacticalEfficiencyScore: number;
    diplomaticOrScienceScore: number;
    elapsedSeconds: number;
    bonusCompleted: boolean;
  }) => void;
}

export const StarfleetMissionWorkstationModal: React.FC<StarfleetMissionWorkstationModalProps> = ({
  isOpen,
  mission,
  shipState,
  enemiesAliveCount,
  onMinimizeTo3DFlight,
  onAbortMission,
  onSetShieldHarmonics,
  onStartPlanetaryDefenseWave,
  onFireDeflectorBeam,
  onTriggerHazardShake,
  onCompleteMission,
}) => {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [startTime] = useState<number>(() => performance.now());
  const [waveTick, setWaveTick] = useState<number>(0);

  // --- Archetype 1: First Contact & Xenolinguistics State ---
  const [fcFreqMhz, setFcFreqMhz] = useState<number>(1250.0);
  const [fcAmpDb, setFcAmpDb] = useState<number>(45);
  const [fcPhaseDeg, setFcPhaseDeg] = useState<number>(45);
  const [fcCipherAnswers, setFcCipherAnswers] = useState<Record<number, number>>({});
  const [fcDipStep, setFcDipStep] = useState<number>(0);
  const [fcDipScore, setFcDipScore] = useState<number>(50);
  const [fcLastAlienReply, setFcLastAlienReply] = useState<string>('');

  // --- Archetype 2: Astrophysical Anomaly Investigation State ---
  const [anomWavelengthNm, setAnomWavelengthNm] = useState<number>(540.0);
  const [anomRedshiftZ, setAnomRedshiftZ] = useState<number>(0.025);
  const [anomMultipole, setAnomMultipole] = useState<number>(2);
  const [anomTesla, setAnomTesla] = useState<number>(10.0);
  const [probeGaugePos, setProbeGaugePos] = useState<number>(50);
  const [probeLaunched, setProbeLaunched] = useState<boolean>(false);
  const [probeLockScore, setProbeLockScore] = useState<number>(0);

  // --- Archetype 3: Planetary Defense (Enemy Wave) State ---
  const [defShieldFreqThz, setDefShieldFreqThz] = useState<number>(250.0);
  const [defNutationDeg, setDefNutationDeg] = useState<number>(45);
  const [defWaveStarted, setDefWaveStarted] = useState<boolean>(false);
  const [defSimulatedWaveProgress, setDefSimulatedWaveProgress] = useState<number>(0);

  // --- Archetype 4: Planetary Magnetosphere & Ecological Rescue State ---
  const [magParticle, setMagParticle] = useState<string>('Positron Stream');
  const [magResonanceGhz, setMagResonanceGhz] = useState<number>(30.0);
  const [magApertureDeg, setMagApertureDeg] = useState<number>(20);
  const [magBeamFiring, setMagBeamFiring] = useState<boolean>(false);
  const [magStabilizationProgress, setMagStabilizationProgress] = useState<number>(18);
  const [magFlareDrift, setMagFlareDrift] = useState<number>(0);

  // Reset workstation state when mission changes
  useEffect(() => {
    if (!mission) return;
    setStage(1);
    setFcCipherAnswers({});
    setFcDipStep(0);
    setFcDipScore(50);
    setFcLastAlienReply('');
    setProbeLaunched(false);
    setProbeLockScore(0);
    setDefWaveStarted(false);
    setDefSimulatedWaveProgress(0);
    setMagBeamFiring(false);
    setMagStabilizationProgress(18);

    if (mission.firstContactData) {
      setFcFreqMhz(Number((mission.firstContactData.targetFreqMhz - 65.5).toFixed(1)));
      setFcAmpDb(Math.max(25, mission.firstContactData.targetAmplitudeDb - 20));
      setFcPhaseDeg(15);
    }
    if (mission.anomalyData) {
      setAnomWavelengthNm(410.0);
      setAnomRedshiftZ(0.005);
      setAnomMultipole(2);
      setAnomTesla(8.0);
    }
    if (mission.defenseData) {
      setDefShieldFreqThz(Number((mission.defenseData.optimalShieldFreqThz - 32.5).toFixed(1)));
      setDefNutationDeg(0);
    }
    if (mission.magnetosphereData) {
      setMagParticle('Positron Stream');
      setMagResonanceGhz(Number((mission.magnetosphereData.targetResonanceGhz - 12.4).toFixed(1)));
      setMagApertureDeg(12);
    }
  }, [mission?.id]);

  // Continuous animation loop for oscilloscope waves, probe timing gauge, and deflector beam stabilization
  useEffect(() => {
    if (!isOpen || !mission) return;
    const interval = setInterval(() => {
      setWaveTick((prev) => (prev + 1) % 360);

      // Oscillate probe resonance window indicator in Anomaly Stage 3
      if (mission.archetype === 'anomaly_investigation' && stage === 3 && !probeLaunched) {
        const t = performance.now() * 0.0028;
        setProbeGaugePos(Math.round(50 + Math.sin(t) * 44));
      }

      // Advance Magnetosphere Deflector Beam Restoration in Stage 3
      if (mission.archetype === 'magnetosphere_rescue' && stage === 3 && magBeamFiring) {
        const drift = Math.sin(performance.now() * 0.004) * 4.5;
        setMagFlareDrift(Number(drift.toFixed(1)));
        setMagStabilizationProgress((prev) => {
          const next = Math.min(100, prev + 4.5);
          return next;
        });
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isOpen, mission, stage, probeLaunched, magBeamFiring]);

  if (!isOpen || !mission) return null;

  const hullIntegrity = shipState?.hullIntegrity ?? 100;
  const shieldIntegrity = shipState?.shieldIntegrity ?? 100;
  const tacticalEfficiency = Math.round(hullIntegrity * 0.7 + shieldIntegrity * 0.3);

  // ============================================================================
  // ARCHETYPE 1 CALCULATIONS: FIRST CONTACT & XENOLINGUISTICS
  // ============================================================================
  const fcData = mission.firstContactData;
  const fcFreqError = fcData ? Math.abs(fcFreqMhz - fcData.targetFreqMhz) : 0;
  const fcAmpError = fcData ? Math.abs(fcAmpDb - fcData.targetAmplitudeDb) : 0;
  const fcPhaseError = fcData ? Math.abs(fcPhaseDeg - fcData.targetPhaseDeg) : 0;
  const fcWaveLockPercent = fcData
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(100 - fcFreqError * 0.45 - fcAmpError * 0.5 - fcPhaseError * 0.22)
        )
      )
    : 0;

  const fcCipherCorrectCount = fcData
    ? fcData.cipherSequence.reduce((acc, item, idx) => {
        return acc + (fcCipherAnswers[idx] === item.correctIndex ? 1 : 0);
      }, 0)
    : 0;
  const fcCipherAccuracy = fcData
    ? Math.round((fcCipherCorrectCount / Math.max(1, fcData.cipherSequence.length)) * 100)
    : 100;

  // ============================================================================
  // ARCHETYPE 2 CALCULATIONS: ASTROPHYSICAL ANOMALY INVESTIGATION
  // ============================================================================
  const anomData = mission.anomalyData;
  const anomWaveError = anomData ? Math.abs(anomWavelengthNm - anomData.targetWavelengthNm) : 0;
  const anomZError = anomData ? Math.abs(anomRedshiftZ - anomData.targetRedshiftZ) * 1000 : 0;
  const anomSpecAccuracy = anomData
    ? Math.max(0, Math.min(100, Math.round(100 - anomWaveError * 0.35 - anomZError * 0.6)))
    : 0;

  const anomPoleError = anomData ? Math.abs(anomMultipole - anomData.optimalMultipoleOrder) * 12 : 0;
  const anomTeslaError = anomData ? Math.abs(anomTesla - anomData.optimalMagneticTesla) * 2.5 : 0;
  const anomShieldAccuracy = anomData
    ? Math.max(0, Math.min(100, Math.round(100 - anomPoleError - anomTeslaError)))
    : 0;

  // ============================================================================
  // ARCHETYPE 3 CALCULATIONS: PLANETARY DEFENSE (ENEMY WAVE)
  // ============================================================================
  const defData = mission.defenseData;
  const defFreqError = defData ? Math.abs(defShieldFreqThz - defData.optimalShieldFreqThz) : 0;
  const defPhaseError = defData ? Math.abs(defNutationDeg - defData.optimalNutationDeg) : 0;
  const defHarmonicAccuracy = defData
    ? Math.max(0, Math.min(100, Math.round(100 - defFreqError * 0.9 - defPhaseError * 0.25)))
    : 0;

  // ============================================================================
  // ARCHETYPE 4 CALCULATIONS: MAGNETOSPHERE & ECOLOGICAL RESCUE
  // ============================================================================
  const magData = mission.magnetosphereData;
  const magParticleMatch = magData ? magParticle === magData.recommendedParticle : false;
  const magFreqError = magData ? Math.abs(magResonanceGhz - magData.targetResonanceGhz) : 0;
  const magApError = magData ? Math.abs(magApertureDeg - magData.targetApertureDeg) : 0;
  const magBeamAccuracy = magData
    ? Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (magParticleMatch ? 100 : 65) - magFreqError * 1.6 - magApError * 0.9
          )
        )
      )
    : 0;

  // Complete mission handler helper
  const finishMission = (accuracy: number, outcome: number, bonus: boolean) => {
    const elapsedSeconds = Math.max(12, Math.round((performance.now() - startTime) / 1000));
    soundEffects.playPromotionChime();
    onCompleteMission({
      accuracyScore: accuracy,
      tacticalEfficiencyScore: tacticalEfficiency,
      diplomaticOrScienceScore: outcome,
      elapsedSeconds,
      bonusCompleted: bonus,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E] text-slate-100 flex flex-col select-none overflow-hidden">
      {/* Top Telemetry Ribbon (44px) — Science, Space & Biotech Standard */}
      <div className="h-12 px-5 bg-[#111827] border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-trek font-bold text-xs uppercase shrink-0">
            LCARS WORKSTATION
          </div>
          <h2 className="font-trek font-bold text-sm sm:text-base text-white uppercase tracking-wider truncate">
            {mission.title}
          </h2>
          <span className="text-slate-600 hidden md:inline" aria-hidden="true">·</span>
          <span className="text-xs font-mono tabular-nums text-cyan-400 hidden md:inline shrink-0">
            STAGE {stage} OF 3
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums text-slate-300">
            <span>● HULL: {Math.round(hullIntegrity)}%</span>
            <span className="text-slate-600">·</span>
            <span>SHIELDS: {Math.round(shieldIntegrity)}%</span>
          </div>

          <button
            onClick={onMinimizeTo3DFlight}
            className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Minimize Workstation to inspect 3D space scene"
          >
            <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>View 3D Space</span>
          </button>

          <button
            onClick={onAbortMission}
            className="p-1.5 rounded bg-slate-900 hover:bg-red-950 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-colors cursor-pointer"
            title="Abort Mission Directive"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progressive Stage Stepper Ribbon */}
      <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          {[1, 2, 3].map((stepNum) => {
            const isCurrent = stage === stepNum;
            const isDone = stage > stepNum;
            return (
              <div
                key={stepNum}
                className={`flex items-center gap-2 text-xs font-mono tabular-nums ${
                  isCurrent
                    ? 'text-amber-400 font-bold'
                    : isDone
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded flex items-center justify-center text-[11px] border ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {isDone ? '✓' : stepNum}
                </span>
                <span>
                  {mission.archetype === 'first_contact' &&
                    (stepNum === 1
                      ? 'EM Carrier Wave Lock'
                      : stepNum === 2
                      ? 'Universal Translator Matrix'
                      : 'Diplomatic Protocol')}
                  {mission.archetype === 'anomaly_investigation' &&
                    (stepNum === 1
                      ? 'Fraunhofer Spectroscopy'
                      : stepNum === 2
                      ? 'Multipole Radiation Shielding'
                      : 'Quantum Probe Launch')}
                  {mission.archetype === 'planetary_defense' &&
                    (stepNum === 1
                      ? 'Disruptor Harmonic Analysis'
                      : stepNum === 2
                      ? 'Multiphasic Shield Lock'
                      : 'Planetary Defense Engagement')}
                  {mission.archetype === 'magnetosphere_rescue' &&
                    (stepNum === 1
                      ? 'MHD Crisis & Particle Selection'
                      : stepNum === 2
                      ? 'Cyclotron Resonance Alignment'
                      : 'Navigational Deflector Beam Firing')}
                </span>
                {stepNum < 3 && <span className="text-slate-700 ml-2">→</span>}
              </div>
            );
          })}
        </div>

        <div className="text-xs font-mono tabular-nums text-slate-400 hidden lg:block">
          Formula: <span className="text-amber-300">{mission.scienceBriefing.formulaOrLaw}</span>
        </div>
      </div>

      {/* ==========================================================================
          TWO-ZONE SANDBOX WORKSPACE (Left Interactive Stage 65% | Right Controls 35%)
         ========================================================================== */}
      <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
        {/* ========================================================================
            ARCHETYPE 1: FIRST CONTACT & XENOLINGUISTICS
           ======================================================================== */}
        {mission.archetype === 'first_contact' && fcData && (
          <>
            {/* Left Interactive Visual Stage (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-mono uppercase text-amber-400">
                    {fcData.speciesName} · {fcData.vesselName}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {stage === 1 && 'Subspace Electromagnetic Carrier Wave Oscilloscope'}
                    {stage === 2 && 'Universal Translator Xenolinguistic Syntax Matrix'}
                    {stage === 3 && `Live Diplomatic Viewscreen — ${fcData.speciesName}`}
                  </h3>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-400">SIGNAL LOCK</div>
                  <div
                    className={`text-2xl font-bold ${
                      fcWaveLockPercent >= 90
                        ? 'text-emerald-400'
                        : fcWaveLockPercent >= 70
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {fcWaveLockPercent}%
                  </div>
                </div>
              </div>

              {/* Dual-Trace SVG Wave Interference Oscilloscope */}
              <div className="relative h-60 bg-[#07090E] border border-slate-800 rounded-lg overflow-hidden p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400 z-10">
                  <span className="text-amber-400">─── Alien Carrier ({fcData.targetFreqMhz} MHz)</span>
                  <span className="text-cyan-400">─── Enterprise Transceiver ({fcFreqMhz.toFixed(1)} MHz)</span>
                </div>

                <svg className="w-full h-40 overflow-visible" viewBox="0 0 600 140">
                  {/* Coordinate Grid */}
                  <line x1="0" y1="70" x2="600" y2="70" stroke="#1e293b" strokeWidth="1" />
                  <line x1="300" y1="0" x2="300" y2="140" stroke="#1e293b" strokeWidth="1" />
                  {/* Target Alien Waveform (Amber) */}
                  <path
                    d={Array.from({ length: 120 })
                      .map((_, i) => {
                        const x = i * 5;
                        const rad =
                          (i * 0.16 * (fcData.targetFreqMhz / 1200)) +
                          (fcData.targetPhaseDeg * Math.PI) / 180 +
                          waveTick * 0.08;
                        const y = 70 + Math.sin(rad) * (fcData.targetAmplitudeDb * 0.55);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeOpacity="0.75"
                  />
                  {/* Player Tuned Waveform (Cyan) */}
                  <path
                    d={Array.from({ length: 120 })
                      .map((_, i) => {
                        const x = i * 5;
                        const rad =
                          (i * 0.16 * (fcFreqMhz / 1200)) +
                          (fcPhaseDeg * Math.PI) / 180 +
                          waveTick * 0.08;
                        const y = 70 + Math.sin(rad) * (fcAmpDb * 0.55);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />
                </svg>

                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400 z-10">
                  <span>
                    Status:{' '}
                    {fcWaveLockPercent >= 90
                      ? '● CONSTRUCTIVE LOCK NOMINAL'
                      : '▲ PHASE / FREQUENCY DRIFT'}
                  </span>
                  <span>
                    Δf: {fcFreqError.toFixed(1)} MHz · Δφ: {fcPhaseError}°
                  </span>
                </div>
              </div>

              {/* Stage 2: Xenolinguistic Cipher Questions */}
              {stage === 2 && (
                <div className="space-y-3">
                  {fcData.cipherSequence.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                      <div className="text-xs font-mono text-amber-300 font-semibold">
                        {item.prompt}
                      </div>
                      <div className="text-xs text-slate-400">{item.scientificHint}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {item.options.map((opt, optIdx) => {
                          const picked = fcCipherAnswers[idx] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => {
                                soundEffects.playLcarsBeep(780, 0.08);
                                setFcCipherAnswers((prev) => ({ ...prev, [idx]: optIdx }));
                              }}
                              className={`p-2 rounded border text-xs font-mono text-left transition-colors cursor-pointer ${
                                picked
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                                  : 'bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stage 3: High-Stakes Diplomatic Exchange */}
              {stage === 3 && (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-mono uppercase text-cyan-400">
                    Cultural Game-Theory Profile: {fcData.speciesName} ({fcData.homeworld})
                  </div>
                  {fcLastAlienReply && (
                    <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200">
                      <strong>Envoy Response:</strong> "{fcLastAlienReply}"
                    </div>
                  )}
                  {fcDipStep < fcData.diplomaticExchanges.length ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded bg-[#111827] border border-amber-500/30 text-sm text-amber-100">
                        <strong>Incoming Transmission:</strong> "{fcData.diplomaticExchanges[fcDipStep].alienHail}"
                      </div>
                      <div className="text-xs text-slate-400">
                        {fcData.diplomaticExchanges[fcDipStep].culturalContext}
                      </div>
                      <div className="space-y-2">
                        {fcData.diplomaticExchanges[fcDipStep].choices.map((ch, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => {
                              soundEffects.playLcarsAcknowledge();
                              setFcDipScore((prev) => Math.max(0, Math.min(100, prev + ch.scoreDelta)));
                              setFcLastAlienReply(ch.alienResponse);
                              setFcDipStep((prev) => prev + 1);
                            }}
                            className="w-full p-3 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-left transition-all cursor-pointer"
                          >
                            <div className="text-xs sm:text-sm font-medium text-white">{ch.label}</div>
                            <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                              Strategy: {ch.strategyTag}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-center space-y-2">
                      <div className="text-base font-bold text-emerald-300">
                        Diplomatic Protocol Concluded — Accord Rating: {fcDipScore}%
                      </div>
                      <p className="text-xs text-slate-300">
                        All xenolinguistic and diplomatic channels with the {fcData.speciesName} have been logged.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Parameter & Calibration Control Deck (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Subspace Transceiver Parameter Deck
              </div>

              {/* Frequency Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Carrier Frequency (f)</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-cyan-300">{fcFreqMhz.toFixed(1)}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">MHz</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={Math.max(800, Math.round(fcData.targetFreqMhz - 150))}
                  max={Math.round(fcData.targetFreqMhz + 150)}
                  step={0.5}
                  value={fcFreqMhz}
                  onChange={(e) => setFcFreqMhz(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono tabular-nums text-slate-400 flex justify-between">
                  <span>Target Band: {fcData.targetFreqMhz.toFixed(1)} MHz</span>
                  <span>Δ: {fcFreqError.toFixed(1)} MHz</span>
                </div>
              </div>

              {/* Amplitude Gain Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Signal Amplitude Gain (A)</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-amber-300">{fcAmpDb}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">dB</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={1}
                  value={fcAmpDb}
                  onChange={(e) => setFcAmpDb(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono tabular-nums text-slate-400 flex justify-between">
                  <span>Target Gain: {fcData.targetAmplitudeDb} dB</span>
                  <span>Δ: {fcAmpError} dB</span>
                </div>
              </div>

              {/* Phase Angle Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Phase Shift Alignment (φ)</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-emerald-300">{fcPhaseDeg}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">deg</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  step={5}
                  value={fcPhaseDeg}
                  onChange={(e) => setFcPhaseDeg(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono tabular-nums text-slate-400 flex justify-between">
                  <span>Target Phase: {fcData.targetPhaseDeg}°</span>
                  <span>Δ: {fcPhaseError}°</span>
                </div>
              </div>

              {/* Stage Execution CTA */}
              <div className="mt-auto pt-3 border-t border-slate-800">
                {stage === 1 && (
                  <button
                    onClick={() => {
                      soundEffects.playLcarsAcknowledge();
                      setStage(2);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                  >
                    Lock Carrier Wave ({fcWaveLockPercent}%) & Proceed to Translator Matrix →
                  </button>
                )}
                {stage === 2 && (
                  <button
                    onClick={() => {
                      soundEffects.playLcarsAcknowledge();
                      setStage(3);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                  >
                    Commit Syntax Matrix ({fcCipherAccuracy}%) & Open Diplomatic Channel →
                  </button>
                )}
                {stage === 3 && (
                  <button
                    disabled={fcDipStep < fcData.diplomaticExchanges.length}
                    onClick={() => {
                      const combinedAcc = Math.round(fcWaveLockPercent * 0.6 + fcCipherAccuracy * 0.4);
                      const bonus = fcWaveLockPercent >= 92 && fcDipScore >= 85;
                      finishMission(combinedAcc, fcDipScore, bonus);
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-trek font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer ${
                      fcDipStep >= fcData.diplomaticExchanges.length
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Complete First Contact Directive & File Starfleet Debriefing
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========================================================================
            ARCHETYPE 2: ASTROPHYSICAL ANOMALY INVESTIGATION
           ======================================================================== */}
        {mission.archetype === 'anomaly_investigation' && anomData && (
          <>
            {/* Left Interactive Visual Stage (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-mono uppercase text-purple-300">
                    {anomData.anomalyType} · {anomData.anomalyClass}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {stage === 1 && 'High-Dispersion Fraunhofer Absorption & Emission Spectrometer'}
                    {stage === 2 && 'Synchrotron Radiation Flux & Multipole Shielding Envelope'}
                    {stage === 3 && 'Class-VIII Quantum Probe Orbital Resonance Injector'}
                  </h3>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-400">SPECTRAL PRECISION</div>
                  <div className="text-2xl font-bold text-cyan-300">{anomSpecAccuracy}%</div>
                </div>
              </div>

              {/* Optical & X-Ray Emission Spectrum Band */}
              <div className="p-4 rounded-lg bg-[#07090E] border border-slate-800 space-y-3">
                <div className="flex justify-between text-xs font-mono tabular-nums text-slate-400">
                  <span>150 nm (X-Ray / FUV)</span>
                  <span>450 nm (Blue)</span>
                  <span>680 nm (Red H-Alpha)</span>
                </div>
                <div className="relative h-20 rounded overflow-hidden bg-gradient-to-r from-purple-950 via-sky-900 to-red-950 border border-slate-700">
                  {/* Reference Spectral Lines */}
                  {anomData.spectralLines.map((line, idx) => {
                    const leftPct = Math.min(96, Math.max(4, ((line.wavelengthNm - 150) / 550) * 100));
                    return (
                      <div
                        key={idx}
                        style={{ left: `${leftPct}%`, backgroundColor: line.colorHex }}
                        className="absolute top-0 bottom-0 w-1 shadow-[0_0_10px_#fff]"
                        title={`${line.element}: ${line.wavelengthNm} nm`}
                      />
                    );
                  })}
                  {/* Player Tuned Spectrometer Crosshair Marker */}
                  <div
                    style={{
                      left: `${Math.min(98, Math.max(2, ((anomWavelengthNm - 150) / 550) * 100))}%`,
                    }}
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_#22d3ee] flex flex-col items-center justify-between"
                  >
                    <div className="px-1.5 py-0.5 bg-cyan-400 text-slate-950 font-mono text-[10px] font-bold rounded-b">
                      {anomWavelengthNm.toFixed(1)} nm
                    </div>
                  </div>
                </div>

                {/* Spectral Line Legend */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {anomData.spectralLines.map((line, idx) => (
                    <div key={idx} className="p-2 rounded bg-[#111827] border border-slate-800 text-xs font-mono tabular-nums">
                      <div className="font-semibold text-white truncate">{line.element}</div>
                      <div className="text-slate-400">λ = {line.wavelengthNm} nm</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage 2: Multipole Shielding Telemetry */}
              {stage >= 2 && (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-amber-400">
                      Radiation Flux: {anomData.radiationFluxSvHr} Sv/hr
                    </span>
                    <span className="text-xs font-mono tabular-nums text-emerald-400">
                      Shield Harmonic Containment: {anomShieldAccuracy}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Configure the magnetic multipole order ({anomData.optimalMultipoleOrder}-pole recommended) and magnetic flux density ({anomData.optimalMagneticTesla} Tesla) on the right panel to prevent relativistic plasma shear from shaking the hull.
                  </p>
                </div>
              )}

              {/* Stage 3: Quantum Probe Launch Timing Window */}
              {stage === 3 && (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-cyan-300 font-semibold uppercase">
                      Class-VIII Probe Orbital Resonance Window ({anomData.probeResonanceWindowMin}% – {anomData.probeResonanceWindowMax}%)
                    </span>
                    <span className="text-white font-bold">
                      Current Phase: {probeGaugePos}%
                    </span>
                  </div>
                  <div className="relative h-7 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                    {/* Target Green Resonance Window */}
                    <div
                      style={{
                        left: `${anomData.probeResonanceWindowMin}%`,
                        width: `${anomData.probeResonanceWindowMax - anomData.probeResonanceWindowMin}%`,
                      }}
                      className="absolute top-0 bottom-0 bg-emerald-500/30 border-x-2 border-emerald-400"
                    />
                    {/* Oscillating Probe Marker */}
                    <div
                      style={{ left: `${probeGaugePos}%` }}
                      className="absolute top-0 bottom-0 w-2 -ml-1 bg-amber-400 shadow-[0_0_10px_#f59e0b]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {probeLaunched
                        ? `Probe Telemetry Locked! Insertion Accuracy: ${probeLockScore}%`
                        : 'Click "Launch Class-VIII Probe" when the amber marker passes inside the green resonance corridor!'}
                    </span>
                    {!probeLaunched && (
                      <button
                        onClick={() => {
                          const inWindow =
                            probeGaugePos >= anomData.probeResonanceWindowMin &&
                            probeGaugePos <= anomData.probeResonanceWindowMax;
                          const distFromCenter = Math.abs(
                            probeGaugePos -
                              (anomData.probeResonanceWindowMin + anomData.probeResonanceWindowMax) / 2
                          );
                          const score = inWindow
                            ? Math.max(85, Math.round(100 - distFromCenter * 0.8))
                            : Math.max(45, Math.round(80 - distFromCenter * 1.2));
                          setProbeLockScore(score);
                          setProbeLaunched(true);
                          onFireDeflectorBeam(mission.targetCoordinates, 0xa855f7, 4.0);
                          soundEffects.playPhotonTorpedo();
                        }}
                        className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-trek font-bold text-xs uppercase cursor-pointer"
                      >
                        Launch Class-VIII Probe
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Parameter Deck (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Spectrometer & Multipole Shield Controls
              </div>

              {/* Diffraction Wavelength Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Grating Wavelength (λ)</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-cyan-300">{anomWavelengthNm.toFixed(1)}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">nm</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={160}
                  max={700}
                  step={0.5}
                  value={anomWavelengthNm}
                  onChange={(e) => setAnomWavelengthNm(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono tabular-nums text-slate-400 flex justify-between">
                  <span>Primary Emission Line: {anomData.targetWavelengthNm} nm</span>
                  <span>Δλ: {anomWaveError.toFixed(1)} nm</span>
                </div>
              </div>

              {/* Redshift Doppler Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Relativistic Redshift (z)</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-purple-300">{anomRedshiftZ.toFixed(3)}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">z (Δλ/λ₀)</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={0.001}
                  max={0.090}
                  step={0.001}
                  value={anomRedshiftZ}
                  onChange={(e) => setAnomRedshiftZ(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono tabular-nums text-slate-400 flex justify-between">
                  <span>Target Redshift: z = {anomData.targetRedshiftZ.toFixed(3)}</span>
                  <span>v ≈ {Math.round(anomRedshiftZ * 299792)} km/s</span>
                </div>
              </div>

              {/* Magnetic Multipole & Flux Sliders */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Magnetic Multipole Order</span>
                  <span className="font-mono tabular-nums text-base font-bold text-amber-300">
                    {anomMultipole}-Pole (Target: {anomData.optimalMultipoleOrder}-Pole)
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((pole) => (
                    <button
                      key={pole}
                      onClick={() => {
                        setAnomMultipole(pole);
                        if (pole !== anomData.optimalMultipoleOrder) {
                          onTriggerHazardShake(0.35);
                        } else {
                          soundEffects.playLcarsAcknowledge();
                        }
                      }}
                      className={`py-1.5 rounded font-mono text-xs border cursor-pointer ${
                        anomMultipole === pole
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-[#111827] text-slate-300 border-slate-800'
                      }`}
                    >
                      {pole}-Pole
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-slate-300 font-medium">Containment Field (B)</span>
                    <div className="font-mono tabular-nums">
                      <span className="text-lg font-semibold text-emerald-300">{anomTesla.toFixed(1)}</span>
                      <span className="text-xs uppercase text-slate-400 ml-1.5">T</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5.0}
                    max={40.0}
                    step={0.5}
                    value={anomTesla}
                    onChange={(e) => setAnomTesla(parseFloat(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="text-[11px] font-mono tabular-nums text-slate-400">
                    Optimal Flux Density: {anomData.optimalMagneticTesla.toFixed(1)} Tesla
                  </div>
                </div>
              </div>

              {/* Stage Progression CTA */}
              <div className="mt-auto pt-3 border-t border-slate-800">
                {stage === 1 && (
                  <button
                    onClick={() => {
                      soundEffects.playLcarsAcknowledge();
                      setStage(2);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                  >
                    Lock Spectral Lines ({anomSpecAccuracy}%) & Calibrate Radiation Shielding →
                  </button>
                )}
                {stage === 2 && (
                  <button
                    onClick={() => {
                      soundEffects.playLcarsAcknowledge();
                      setStage(3);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer"
                  >
                    Stabilize Multipole Envelope ({anomShieldAccuracy}%) & Arm Class-VIII Probe →
                  </button>
                )}
                {stage === 3 && (
                  <button
                    disabled={!probeLaunched}
                    onClick={() => {
                      const avgAcc = Math.round(anomSpecAccuracy * 0.55 + anomShieldAccuracy * 0.45);
                      const bonus = anomWaveError <= 5.0 && probeLockScore >= 85;
                      finishMission(avgAcc, probeLockScore, bonus);
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-trek font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer ${
                      probeLaunched
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Transmit Anomaly Telemetry & Complete Directive
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========================================================================
            ARCHETYPE 3: PLANETARY DEFENSE (ENEMY WAVE)
           ======================================================================== */}
        {mission.archetype === 'planetary_defense' && defData && (
          <>
            {/* Left Tactical Defense Stage (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-mono uppercase text-red-400">
                    Hostile Threat: {defData.factionDisplayName} · {defData.outpostName}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Multiphasic Shield Impedance & Planetary Defense Grid
                  </h3>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-400">SHIELD REFLECTION</div>
                  <div className="text-2xl font-bold text-cyan-300">{defHarmonicAccuracy}%</div>
                </div>
              </div>

              {/* Disruptor vs Shield Harmonic Waveform Visualizer */}
              <div className="p-4 rounded-lg bg-[#07090E] border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono tabular-nums">
                  <span className="text-red-400">
                    ─── Hostile Disruptor Pulse ({defData.disruptorFreqThz} THz)
                  </span>
                  <span className="text-cyan-400">
                    ─── Enterprise Multiphasic Shield ({defShieldFreqThz.toFixed(1)} THz · {defNutationDeg}°)
                  </span>
                </div>
                <svg className="w-full h-36" viewBox="0 0 600 120">
                  <line x1="0" y1="60" x2="600" y2="60" stroke="#1e293b" strokeWidth="1" />
                  <path
                    d={Array.from({ length: 120 })
                      .map((_, i) => {
                        const x = i * 5;
                        const y =
                          60 +
                          Math.sin(i * 0.22 * (defData.disruptorFreqThz / 260) + waveTick * 0.1) * 42;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                  />
                  <path
                    d={Array.from({ length: 120 })
                      .map((_, i) => {
                        const x = i * 5;
                        const phaseOffset =
                          ((defNutationDeg - defData.optimalNutationDeg) * Math.PI) / 180;
                        const y =
                          60 +
                          Math.sin(
                            i * 0.22 * (defShieldFreqThz / 260) + phaseOffset + waveTick * 0.1
                          ) *
                            42;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y.toFixed(1)}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>

              {/* Planetary Outpost Defense Console */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono uppercase text-amber-400">
                      Protected Facility: {defData.outpostName}
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">
                      {defWaveStarted
                        ? enemiesAliveCount > 0
                          ? `Hostile Vessels Engaging in Sector: ${enemiesAliveCount} Remaining`
                          : 'All Hostile Raiders Neutralized — Sector Secure!'
                        : `Inbound Strike Group: ${defData.enemyWaveCount} Hostile Warships`}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <div className="text-xs text-slate-400">OUTPOST INTEGRITY</div>
                    <div className="text-xl font-bold text-emerald-400">
                      {shipState?.missionWaypoint?.defendedPlanetIntegrity ?? 100}%
                    </div>
                  </div>
                </div>

                {defWaveStarted && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                      <span className="text-slate-300">Tactical Orbital Defense Barrage Progress:</span>
                      <span className="text-cyan-300 font-bold">{defSimulatedWaveProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
                        style={{ width: `${defSimulatedWaveProgress}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          onFireDeflectorBeam(mission.targetCoordinates, 0xf59e0b, 2.5);
                          soundEffects.playPhaserBeam();
                          setDefSimulatedWaveProgress((prev) => Math.min(100, prev + 35));
                        }}
                        className="px-3.5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-trek font-bold text-xs uppercase cursor-pointer"
                      >
                        Fire Collimated Phaser Salvo (+35%)
                      </button>
                      <button
                        onClick={() => {
                          soundEffects.playPhotonTorpedo();
                          setDefSimulatedWaveProgress((prev) => Math.min(100, prev + 45));
                        }}
                        className="px-3.5 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-trek font-bold text-xs uppercase cursor-pointer"
                      >
                        Launch Photon Torpedo Spread (+45%)
                      </button>
                      <button
                        onClick={onMinimizeTo3DFlight}
                        className="px-3.5 py-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-trek font-bold text-xs uppercase cursor-pointer"
                      >
                        Pilot & Dogfight in 3D Viewport
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Shield Harmonics & Defense Controls (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Multiphasic Shield Modulation Controls
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Shield Nutation Frequency</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-cyan-300">{defShieldFreqThz.toFixed(1)}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">THz</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={Math.round(defData.optimalShieldFreqThz - 60)}
                  max={Math.round(defData.optimalShieldFreqThz + 60)}
                  step={0.5}
                  value={defShieldFreqThz}
                  onChange={(e) => setDefShieldFreqThz(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono tabular-nums text-slate-400 flex justify-between">
                  <span>Hostile Disruptor Band: {defData.optimalShieldFreqThz} THz</span>
                  <span>Δf: {defFreqError.toFixed(1)} THz</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Polarization Nutation Phase</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-amber-300">{defNutationDeg}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">deg</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[45, 90, 135, 180].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => {
                        soundEffects.playLcarsBeep(820, 0.07);
                        setDefNutationDeg(deg);
                      }}
                      className={`py-2 rounded font-mono text-xs border cursor-pointer ${
                        defNutationDeg === deg
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-[#111827] text-slate-300 border-slate-800'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-400">
                  Target Destructive Cancellation Phase: {defData.optimalNutationDeg}°
                </div>
              </div>

              <div className="mt-auto pt-3 border-t border-slate-800 space-y-2">
                {!defWaveStarted ? (
                  <button
                    onClick={() => {
                      onSetShieldHarmonics(defHarmonicAccuracy);
                      onStartPlanetaryDefenseWave();
                      setDefWaveStarted(true);
                      setStage(3);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-trek font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 cursor-pointer"
                  >
                    Lock Shield Harmonics ({defHarmonicAccuracy}%) & Engage Hostile Wave
                  </button>
                ) : (
                  <button
                    disabled={defSimulatedWaveProgress < 100 && enemiesAliveCount > 0}
                    onClick={() => {
                      const outpostIntegrity = shipState?.missionWaypoint?.defendedPlanetIntegrity ?? 95;
                      const bonus = defHarmonicAccuracy >= 90 && outpostIntegrity >= 75;
                      finishMission(defHarmonicAccuracy, outpostIntegrity, bonus);
                    }}
                    className={`w-full py-3 px-4 rounded-lg font-trek font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer ${
                      defSimulatedWaveProgress >= 100 || enemiesAliveCount === 0
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {defSimulatedWaveProgress >= 100 || enemiesAliveCount === 0
                      ? 'Confirm Sector Clear & Open Starfleet Debriefing'
                      : 'Neutralize Hostile Wave to Complete Defense Directive'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ========================================================================
            ARCHETYPE 4: PLANETARY MAGNETOSPHERE & ECOLOGICAL RESCUE
           ======================================================================== */}
        {mission.archetype === 'magnetosphere_rescue' && magData && (
          <>
            {/* Left Interactive Magnetosphere Diagram Stage (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-mono uppercase text-cyan-400">
                    {magData.crisisType} · {mission.targetPlanetName}
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Planetary Magnetosphere Dipole & Deflector Particle Projection
                  </h3>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-400">DIPOLE STABILITY</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {Math.round(magStabilizationProgress)}%
                  </div>
                </div>
              </div>

              {/* Interactive SVG Planetary Magnetosphere & Solar Wind Diagram */}
              <div className="relative h-64 bg-[#07090E] border border-slate-800 rounded-lg overflow-hidden p-4 flex flex-col justify-between">
                <div className="flex justify-between text-xs font-mono tabular-nums text-slate-400 z-10">
                  <span className="text-amber-400">
                    Solar Wind Ram Pressure: {magData.solarWindPressureNpa} nPa
                  </span>
                  <span className="text-cyan-300">
                    Deflector Beam Resonance: {magBeamAccuracy}%
                  </span>
                </div>

                <svg className="w-full h-44" viewBox="0 0 600 180">
                  {/* Solar Wind Plasma Vectors from Left */}
                  {[30, 65, 90, 115, 150].map((yPos, idx) => (
                    <line
                      key={idx}
                      x1={10 + ((waveTick * 4 + idx * 30) % 140)}
                      y1={yPos}
                      x2={55 + ((waveTick * 4 + idx * 30) % 140)}
                      y2={yPos}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeOpacity="0.65"
                    />
                  ))}

                  {/* Bow Shock Parabola */}
                  <path
                    d="M 220 15 Q 145 90 220 165"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={2 + (magStabilizationProgress / 100) * 2.5}
                    strokeDasharray="6 4"
                  />

                  {/* Planetary Dipole Magnetic Field Loops */}
                  <ellipse
                    cx="320"
                    cy="90"
                    rx={45 + (magStabilizationProgress / 100) * 35}
                    ry={35 + (magStabilizationProgress / 100) * 32}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeOpacity={0.45 + (magStabilizationProgress / 100) * 0.5}
                  />
                  <ellipse
                    cx="355"
                    cy="90"
                    rx={65 + (magStabilizationProgress / 100) * 45}
                    ry={45 + (magStabilizationProgress / 100) * 35}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeOpacity={0.35 + (magStabilizationProgress / 100) * 0.55}
                  />

                  {/* Exoplanet Core & Atmosphere */}
                  <circle cx="330" cy="90" r="26" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />

                  {/* Enterprise Navigational Deflector Beam from Right */}
                  {magBeamFiring && (
                    <>
                      <line
                        x1="560"
                        y1="90"
                        x2="356"
                        y2="90"
                        stroke="#22d3ee"
                        strokeWidth="6"
                        strokeOpacity="0.85"
                      />
                      <line
                        x1="560"
                        y1="90"
                        x2="356"
                        y2="90"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    </>
                  )}
                  <polygon points="560,84 585,90 560,96" fill="#f59e0b" />
                </svg>

                <div className="flex justify-between text-xs font-mono tabular-nums text-slate-400 z-10">
                  <span>
                    Atmospheric Ion Escape:{' '}
                    {Math.max(
                      0,
                      Math.round(magData.ionEscapeRateKgSec * (1 - magStabilizationProgress / 100))
                    )}{' '}
                    kg/s
                  </span>
                  <span>
                    Magnetic Field: {(magData.magneticFieldStrengthUt + (magStabilizationProgress / 100) * 34).toFixed(1)} μT
                  </span>
                </div>
              </div>

              {/* Real-Time Beam Firing Status */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-cyan-300 uppercase font-semibold">
                    Magnetosphere Restoration Progress
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {Math.round(magStabilizationProgress)}% / 100%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150"
                    style={{ width: `${magStabilizationProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {magStabilizationProgress >= 100
                    ? 'Planetary magnetic dipole fully restored! Atmospheric stripping halted.'
                    : magBeamFiring
                    ? `Firing ${magParticle} from Main Navigational Deflector Dish (Solar flare harmonic drift: ${magFlareDrift} GHz)...`
                    : 'Calibrate particle stream, cyclotron frequency, and aperture on the right deck, then fire the Navigational Deflector beam.'}
                </p>
              </div>
            </div>

            {/* Right Deflector Dish Calibration Deck (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4 bg-[#111827] border border-slate-800 rounded-xl p-5">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Navigational Deflector Dish Emitter Controls
              </div>

              {/* Particle Stream Selector */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Subatomic Particle Stream</span>
                  <span className="font-mono text-amber-400">
                    Rec: {magData.recommendedParticle}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Positron Stream',
                    'Graviton Pulse',
                    'Baryon Sweep',
                    'Inverse Tachyon Beam',
                  ].map((pType) => (
                    <button
                      key={pType}
                      onClick={() => {
                        soundEffects.playLcarsBeep(860, 0.07);
                        setMagParticle(pType);
                      }}
                      className={`p-2 rounded font-mono text-xs border text-left truncate cursor-pointer ${
                        magParticle === pType
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                          : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pType}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cyclotron Resonance Frequency Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Cyclotron Resonance (ω_c)</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-cyan-300">{magResonanceGhz.toFixed(1)}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">GHz</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={20.0}
                  max={75.0}
                  step={0.2}
                  value={magResonanceGhz}
                  onChange={(e) => setMagResonanceGhz(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono tabular-nums text-slate-400 flex justify-between">
                  <span>Target Resonance: {magData.targetResonanceGhz.toFixed(1)} GHz</span>
                  <span>Δ: {magFreqError.toFixed(1)} GHz</span>
                </div>
              </div>

              {/* Beam Focal Aperture Slider */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-300 font-medium">Parabolic Focal Aperture</span>
                  <div className="font-mono tabular-nums">
                    <span className="text-xl font-semibold text-amber-300">{magApertureDeg}</span>
                    <span className="text-xs uppercase text-slate-400 ml-1.5">deg</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={1}
                  value={magApertureDeg}
                  onChange={(e) => setMagApertureDeg(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="text-[11px] font-mono tabular-nums text-slate-400 flex justify-between">
                  <span>Optimal Aperture: {magData.targetApertureDeg}°</span>
                  <span>Δ: {magApError}°</span>
                </div>
              </div>

              {/* Fire Deflector Dish Beam & Complete */}
              <div className="mt-auto pt-3 border-t border-slate-800 space-y-2">
                {magStabilizationProgress < 100 ? (
                  <button
                    onClick={() => {
                      setStage(3);
                      setMagBeamFiring(true);
                      onFireDeflectorBeam(mission.targetCoordinates, 0x06b6d4, 6.5);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 cursor-pointer"
                  >
                    {magBeamFiring
                      ? `Projecting Deflector Particle Stream (${Math.round(magStabilizationProgress)}%)...`
                      : `Fire Main Navigational Deflector Beam (${magBeamAccuracy}% Lock)`}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const bonus = magBeamAccuracy >= 92 && magStabilizationProgress >= 100;
                      finishMission(magBeamAccuracy, 100, bonus);
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-trek font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    Magnetosphere Stabilized (100%) — Open Starfleet Debriefing
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
