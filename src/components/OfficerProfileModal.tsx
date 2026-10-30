import React, { useState } from 'react';
import { KeyRound, UserPlus, RotateCcw, ShieldCheck, Award, X, Copy, Check, Sparkles } from 'lucide-react';
import { OfficerProfileRecord, PlayerProgression } from '../types/simulation';
import { officerProfileStore } from '../data/starfleetMissionsData';

interface OfficerProfileModalProps {
  isOpen: boolean;
  activeOfficerCode: string | null;
  progression?: PlayerProgression;
  missionsCompleted: number;
  onClose: () => void;
  onProfileActivated: (profile: OfficerProfileRecord) => void;
  onProfileDisconnected: () => void;
}

export const OfficerProfileModal: React.FC<OfficerProfileModalProps> = ({
  isOpen,
  activeOfficerCode,
  progression,
  onClose,
  onProfileActivated,
  onProfileDisconnected,
}) => {
  const [mode, setMode] = useState<'create' | 'restore'>('create');
  const [callsignInput, setCallsignInput] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentProg: PlayerProgression = progression || {
    xp: 0,
    level: 1,
    rank: 'Ensign',
    nextLevelXp: 500,
    totalEnemiesDestroyed: 0,
    scoutsDestroyed: 0,
    cruisersDestroyed: 0,
    mothershipsDestroyed: 0,
    activeThreatLevel: 'Standard',
  };

  const activeProfile = activeOfficerCode ? officerProfileStore.getProfile(activeOfficerCode) : null;
  const savedProfiles = officerProfileStore.getAllProfiles();

  const handleGenerateNewProfile = () => {
    setErrorMsg(null);
    const created = officerProfileStore.createNewProfile(
      callsignInput,
      currentProg,
      100
    );
    setSuccessMsg(`Created new Starfleet Officer ID: ${created.code} (${created.callsign})`);
    onProfileActivated(created);
  };

  const handleRestoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const sanitized = inputCode.trim();
    if (!/^\d{6}$/.test(sanitized)) {
      setErrorMsg('Please enter a valid 6-digit numeric Starfleet Officer ID.');
      return;
    }

    const found = officerProfileStore.restoreProfile(sanitized);
    if (!found) {
      setErrorMsg(`No Starfleet Officer record found matching 6-digit ID "${sanitized}".`);
      return;
    }

    setSuccessMsg(`Restored Officer ID ${found.code} (${found.rank}, Level ${found.level}).`);
    onProfileActivated(found);
    setInputCode('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4">
      <div className="w-full max-w-xl bg-slate-900/95 border border-cyan-500/40 rounded-lg shadow-[0_0_70px_rgba(34,211,238,0.2)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-7 bg-cyan-400 rounded-sm" />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400">
                SCIENCE EXHIBITION // PERSONNEL TELEMETRY REGISTRY
              </div>
              <h2 className="text-base font-bold uppercase tracking-wider text-white">
                6-Digit Starfleet Officer ID & Progress Restore
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Active Profile Status Card */}
          <div className="p-4 rounded border border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                CURRENT SESSION STATUS
              </div>
              {activeOfficerCode ? (
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-2xl font-black font-mono tracking-[0.2em] text-cyan-300 tabular-nums">
                    #{activeOfficerCode}
                  </span>
                  <button
                    onClick={() => handleCopyCode(activeOfficerCode)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'COPIED' : 'COPY ID'}
                  </button>
                </div>
              ) : (
                <div className="text-sm font-mono text-slate-300 mt-1">
                  Unregistered Exhibition Guest Session (No 6-Digit ID Assigned)
                </div>
              )}
              <div className="text-xs font-mono text-slate-400 mt-1 tabular-nums">
                Rank: <span className="text-amber-300">{currentProg.rank}</span> • Level {currentProg.level} •{' '}
                {currentProg.xp.toLocaleString()} XP
              </div>
            </div>

            {activeOfficerCode && (
              <button
                onClick={() => {
                  onProfileDisconnected();
                  setSuccessMsg('Disconnected Officer ID from active bridge console.');
                }}
                className="px-3 py-1.5 rounded border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-300 text-[11px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
              >
                Switch Visitor
              </button>
            )}
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded border border-slate-800">
            <button
              onClick={() => {
                setMode('create');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                mode === 'create'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create New 6-Digit ID
            </button>
            <button
              onClick={() => {
                setMode('restore');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                mode === 'restore'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Enter Existing 6-Digit ID
            </button>
          </div>

          {/* Create Mode */}
          {mode === 'create' && (
            <div className="p-5 rounded border border-slate-800 bg-slate-950/60 space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Generate Unique Exhibition Officer Code
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click below to generate a unique 6-digit Starfleet Officer ID on demand. Your current XP (
                  <span className="font-mono text-cyan-300">{currentProg.xp} XP</span>), Rank (
                  <span className="font-mono text-amber-300">{currentProg.rank}</span>), and mission grades will be bound to
                  this 6-digit number so you can restore your progress at any time.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">
                  Optional Officer Callsign / Name
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={callsignInput}
                  onChange={(e) => setCallsignInput(e.target.value)}
                  placeholder="e.g. KIRK, SPOCK, or VISITOR-01"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded px-3 py-2 text-xs font-mono uppercase text-white outline-none"
                />
              </div>

              <button
                onClick={handleGenerateNewProfile}
                className="w-full py-3 px-4 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-[0_0_25px_rgba(34,211,238,0.25)]"
              >
                <KeyRound className="w-4 h-4" />
                Generate New 6-Digit Officer Profile Now
              </button>
            </div>
          )}

          {/* Restore Mode */}
          {mode === 'restore' && (
            <form onSubmit={handleRestoreProfile} className="p-5 rounded border border-slate-800 bg-slate-950/60 space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Restore Starfleet Progress by 6-Digit Code
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your 6-digit Starfleet Officer ID below to immediately restore your saved XP, Rank, Level, and
                  completed exhibition directives.
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 482910"
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded px-4 py-2.5 text-lg font-mono tracking-[0.35em] text-center text-white outline-none tabular-nums"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                >
                  Restore Profile
                </button>
              </div>

              {savedProfiles.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2">
                    RECENTLY REGISTERED TERMINAL PROFILES
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {savedProfiles.slice(0, 5).map((p) => (
                      <button
                        type="button"
                        key={p.code}
                        onClick={() => {
                          setInputCode(p.code);
                          const restored = officerProfileStore.restoreProfile(p.code);
                          if (restored) {
                            setSuccessMsg(`Restored Officer ID ${restored.code} (${restored.rank}).`);
                            onProfileActivated(restored);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="font-bold">#{p.code}</span>
                        <span className="text-[10px] text-slate-400">
                          {p.rank} (Lv.{p.level})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="p-3 rounded bg-rose-500/15 border border-rose-500/40 text-xs font-mono text-rose-300">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center gap-2">
              <Award className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeProfile && (
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1">
              <span>Missions Completed on ID #{activeProfile.code}: {activeProfile.missionsCompleted}</span>
              <span>Callsign: {activeProfile.callsign}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
