import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, RotateCcw, Volume2, VolumeX, Radio, ExternalLink, X, Zap } from 'lucide-react';
import { battleThemeManager } from '../audio/battleThemeManager';

interface LCARSBattleThemeWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  isFightingWave: boolean;
  waveLevel?: number;
}

export const LCARSBattleThemeWidget: React.FC<LCARSBattleThemeWidgetProps> = ({
  isOpen,
  onClose,
  isFightingWave,
  waveLevel = 1,
}) => {
  const [themeState, setThemeState] = useState({
    isPlaying: false,
    isReady: false,
    isMuted: false,
    volume: 75,
    autoPlayOnCombat: true,
  });

  useEffect(() => {
    return battleThemeManager.subscribe((state) => {
      setThemeState(state);
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="relative w-full max-w-md bg-slate-950 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-amber-400 rounded-sm" />
            <div>
              <h2 className="text-sm font-trek uppercase tracking-wider font-bold text-amber-400 flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Tactical Combat Theme Console</span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono-nums">Starfleet Flagship Audio Uplink</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Console [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Track Banner */}
          <div className="p-3.5 bg-slate-900/70 rounded-xl border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Music className={`w-6 h-6 ${themeState.isPlaying ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="text-xs font-trek uppercase font-bold text-amber-300">
                  Star Trek Main Theme & March
                </div>
                <div className="text-[10px] text-slate-400 font-mono-nums flex items-center gap-2">
                  <span>Theme Loop (Resume / 0:38 Fanfare / 0:00)</span>
                  <span>·</span>
                  <span className="text-sky-400">Jerry Goldsmith / Giacchino</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      themeState.isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
                    }`}
                  />
                  <span className="text-[9.5px] font-mono-nums uppercase font-semibold text-slate-300">
                    {themeState.isPlaying
                      ? 'COMBAT MARCH ACTIVE'
                      : isFightingWave
                      ? 'ENGAGED WITH HOSTILE WAVE'
                      : 'STANDBY (Triggers on Enemy Wave)'}
                  </span>
                </div>
              </div>
            </div>

            <a
              href="https://youtu.be/oIyo8oC2cCE?list=RDoIyo8oC2cCE"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition-colors shrink-0"
              title="Open Track on YouTube"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Equalizer Visualizer Bars */}
          <div className="flex items-end justify-between h-8 px-2 py-1 bg-slate-900/50 rounded-lg border border-slate-800">
            {[40, 75, 55, 95, 30, 85, 60, 100, 45, 90, 70, 80, 50, 65, 85, 40].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-t transition-all duration-150 ${
                  themeState.isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-slate-700 opacity-40'
                }`}
                style={{
                  height: themeState.isPlaying ? `${Math.max(15, (h * (Math.sin(i + Date.now() / 300) + 1.2)) / 2)}%` : '15%',
                }}
              />
            ))}
          </div>

          {/* Controls Bar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => battleThemeManager.toggle()}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg font-trek uppercase tracking-wider text-xs font-bold transition-all ${
                themeState.isPlaying
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
              }`}
              title={themeState.isPlaying ? 'Pause current playback' : 'Resume playback from where it was paused'}
            >
              {themeState.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause [B]</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume [B]</span>
                </>
              )}
            </button>

            {/* Play from 38 Seconds */}
            <button
              onClick={() => battleThemeManager.playFromTime(38)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg font-trek uppercase tracking-wider text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors shadow-sm"
              title="Play starting from 38 seconds [Alt+B] (Main Heroic Brass Fanfare & March)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>0:38 [Alt+B]</span>
            </button>

            {/* Restart from beginning (0:00) */}
            <button
              onClick={() => battleThemeManager.playFromTime(0)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg font-trek uppercase tracking-wider text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Restart playback from the beginning (0:00)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Restart 0:00</span>
            </button>
          </div>

          {/* Volume Slider */}
          <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono-nums text-slate-400">
              <span className="flex items-center gap-1.5">
                <button
                  onClick={() => battleThemeManager.setMuted(!themeState.isMuted)}
                  className="hover:text-amber-400 transition-colors"
                  title={themeState.isMuted ? 'Unmute' : 'Mute'}
                >
                  {themeState.isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>
                <span>Theme Volume</span>
              </span>
              <span className="text-amber-300 font-bold">{themeState.isMuted ? 'MUTED' : `${themeState.volume}%`}</span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={themeState.isMuted ? 0 : themeState.volume}
              onChange={(e) => {
                if (themeState.isMuted) battleThemeManager.setMuted(false);
                battleThemeManager.setVolume(Number(e.target.value));
              }}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Auto Combat Battle Trigger Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
            <div className="flex flex-col">
              <span className="text-xs font-trek uppercase font-bold text-slate-200">
                Auto-Engage During Enemy Waves
              </span>
              <span className="text-[10px] text-slate-400 font-mono-nums">
                Cues Star Trek theme at 0:40 when hostiles spawn
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={themeState.autoPlayOnCombat}
                onChange={(e) => battleThemeManager.setAutoPlayOnCombat(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Combat Wave Status Details */}
          {isFightingWave && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-center flex items-center justify-center gap-2 text-xs font-trek uppercase text-red-300 animate-pulse">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>Wave {waveLevel} Hostile Engagement Active · Battle Music Playing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
