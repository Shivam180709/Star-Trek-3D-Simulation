import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Sparkles, BookOpen, Shield, Zap, Clock, KeyRound, ChevronRight } from 'lucide-react';
import { MissionPerformanceReport, StarfleetMission } from '../types/simulation';

interface StarfleetMissionDebriefModalProps {
  isOpen: boolean;
  report: MissionPerformanceReport | null;
  mission: StarfleetMission | null;
  activeOfficerCode: string | null;
  onClose: () => void;
  onScanNextMission: () => void;
  onOpenOfficerProfile: () => void;
}

const GRADE_STYLES: Record<MissionPerformanceReport['grade'], { color: string; border: string; bg: string; label: string }> = {
  S: {
    color: 'text-amber-300',
    border: 'border-amber-400/60',
    bg: 'bg-amber-500/15',
    label: 'DISTINGUISHED COMMENDATION',
  },
  A: {
    color: 'text-cyan-300',
    border: 'border-cyan-400/60',
    bg: 'bg-cyan-500/15',
    label: 'EXEMPLARY EXECUTION',
  },
  B: {
    color: 'text-emerald-300',
    border: 'border-emerald-400/60',
    bg: 'bg-emerald-500/15',
    label: 'STANDARD STARFLEET PROFICIENCY',
  },
  C: {
    color: 'text-slate-300',
    border: 'border-slate-500/60',
    bg: 'bg-slate-800/60',
    label: 'DIRECTIVE COMPLETED UNDER DURESS',
  },
};

export const StarfleetMissionDebriefModal: React.FC<StarfleetMissionDebriefModalProps> = ({
  isOpen,
  report,
  mission,
  activeOfficerCode,
  onClose,
  onScanNextMission,
  onOpenOfficerProfile,
}) => {
  const [animatedXp, setAnimatedXp] = useState(0);
  const [barProgress, setBarProgress] = useState(0);

  useEffect(() => {
    if (!isOpen || !report) return;
    setAnimatedXp(0);
    const startPct = Math.min(100, Math.round((report.previousXp / Math.max(1, report.nextLevelXp)) * 100));
    const endPct = Math.min(100, Math.round((report.newXp / Math.max(1, report.nextLevelXp)) * 100));
    setBarProgress(startPct);

    const timer1 = setTimeout(() => {
      setBarProgress(endPct);
    }, 250);

    let frame = 0;
    const totalFrames = 32;
    const interval = setInterval(() => {
      frame++;
      const progress = Math.min(1, frame / totalFrames);
      setAnimatedXp(Math.round(report.totalXpEarned * progress));
      if (frame >= totalFrames) clearInterval(interval);
    }, 24);

    return () => {
      clearTimeout(timer1);
      clearInterval(interval);
    };
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const gradeMeta = GRADE_STYLES[report.grade];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4">
      <div className="w-full max-w-3xl bg-slate-900/95 border border-cyan-500/40 rounded-lg shadow-[0_0_80px_rgba(34,211,238,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-8 bg-amber-400 rounded-sm" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-400">
                STARFLEET COMMAND // AFTER-ACTION TELEMETRY DEBRIEFING
              </div>
              <h2 className="text-lg font-bold tracking-wider uppercase text-white">
                {report.missionTitle}
              </h2>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">MISSION ID</div>
            <div className="text-xs text-cyan-300 tabular-nums">{report.missionId}</div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Top Grade + Total XP Banner */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            <div className={`md:col-span-5 p-5 rounded border ${gradeMeta.border} ${gradeMeta.bg} flex items-center gap-4`}>
              <div className={`w-20 h-20 rounded-lg border-2 ${gradeMeta.border} bg-slate-950/80 flex items-center justify-center shrink-0`}>
                <span className={`text-5xl font-black font-mono ${gradeMeta.color}`}>{report.grade}</span>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  PERFORMANCE RATING
                </div>
                <div className={`text-sm font-bold uppercase tracking-wider mt-0.5 ${gradeMeta.color}`}>
                  {gradeMeta.label}
                </div>
                <div className="text-xs text-slate-300 mt-1.5 font-mono tabular-nums">
                  Composite Score: {Math.round((report.accuracyScore + report.tacticalEfficiencyScore + report.diplomaticOrScienceScore) / 3)}%
                </div>
              </div>
            </div>

            {/* Level / Rank Animated Progression */}
            <div className="md:col-span-7 p-5 rounded border border-slate-800 bg-slate-950/75 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                    STARFLEET OFFICER PROGRESSION
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-white uppercase tracking-wider">
                      {report.newRank}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 tabular-nums">
                      LEVEL {report.newLevel}
                    </span>
                    {report.promoted && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-3 h-3" /> PROMOTED!
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[10px] text-slate-400 uppercase">TOTAL XP EARNED</div>
                  <div className="text-2xl font-bold text-amber-400 tabular-nums">
                    +{animatedXp.toLocaleString()} XP
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5 tabular-nums">
                  <span>CUMULATIVE XP: {report.newXp.toLocaleString()}</span>
                  <span>NEXT RANK THRESHOLD: {report.nextLevelXp.toLocaleString()} XP</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-sm overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 transition-all duration-1000 ease-out rounded-xs"
                    style={{ width: `${barProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Itemized XP & Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded p-4 space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> ITEMIZED XP BREAKDOWN
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Directive Base Commendation</span>
                  <span className="text-slate-200 tabular-nums">+{report.baseXpEarned} XP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Calibration & Sensor Accuracy ({report.accuracyScore}%)</span>
                  <span className="text-cyan-300 tabular-nums">+{report.accuracyBonusXp} XP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Tactical & Hull Integrity ({report.tacticalEfficiencyScore}%)</span>
                  <span className="text-emerald-300 tabular-nums">+{report.tacticalBonusXp} XP</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Scientific / Diplomatic Resolution</span>
                  <span className="text-amber-300 tabular-nums">{report.diplomaticOrScienceScore}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Rapid Response & Bonus Objectives</span>
                  <span className="text-purple-300 tabular-nums">+{report.speedBonusXp} XP</span>
                </div>
              </div>
            </div>

            {/* Scientific Exhibition Takeaway */}
            <div className="bg-slate-950/70 border border-slate-800 rounded p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-amber-400 flex items-center gap-2 mb-2">
                  <BookOpen className="w-3.5 h-3.5" /> {report.scientificConceptTitle}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.astrophysicsTakeaway}
                </p>
                {mission && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>SECTOR: {mission.targetSystemName}</span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <Clock className="w-3 h-3 text-cyan-400" /> {report.elapsedSeconds}s ELAPSED
                    </span>
                  </div>
                )}
              </div>

              {/* Exhibition Visitor 6-Digit Profile Notice */}
              <div className="mt-4 p-3 rounded bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-[11px]">
                    {activeOfficerCode ? (
                      <span className="text-slate-300">
                        Synced to Exhibition Officer ID{' '}
                        <strong className="font-mono text-cyan-300 tracking-wider">{activeOfficerCode}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-300">
                        Want to save your XP & Rank for the Science Exhibition? Create a 6-digit Officer ID.
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onOpenOfficerProfile}
                  className="px-2.5 py-1.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
                >
                  {activeOfficerCode ? 'VIEW ID' : 'SAVE ID'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
          >
            Return to Bridge
          </button>

          <button
            onClick={onScanNextMission}
            className="px-5 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.3)]"
          >
            <Award className="w-4 h-4" />
            Scan Deep Space for Next Directive
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
