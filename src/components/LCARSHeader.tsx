import React, { useState, useEffect } from 'react';
import { AlertLevel, ShipState } from '../types/simulation';
import { soundEffects } from '../audio/soundEffects';
import { computerVoice } from '../audio/computerVoice';
import { Shield, AlertTriangle, Volume2, VolumeX, Eye, HelpCircle, Radio, Crosshair, Music, Sliders, Bot, Dna, Award, Activity, MoreHorizontal, ChevronDown, X, Compass, KeyRound } from 'lucide-react';

interface LCARSHeaderProps {
  shipState: ShipState | null;
  onSetAlert: (level: AlertLevel) => void;
  onGAlertAction?: () => void;
  onToggleInspection: () => void;
  onToggleScanner: () => void;
  onToggleHelp: () => void;
  onToggleLog?: () => void;
  onToggleTacticalScanner?: () => void;
  onToggleBattleTheme?: () => void;
  onOpenBattleThemeSettings?: () => void;
  onOpenVoiceSettings?: () => void;
  onGoToNearestSpaceDock?: () => void;
  onToggleComputerVoice?: () => void;
  onToggleSpeciesDb?: () => void;
  onOpenPlanetaryScanner?: () => void;
  onToggleMissions?: () => void;
  onOpenOfficerProfile?: () => void;
  onOpenCommendation?: () => void;
  onToggleBridgeInterior?: () => void;
  isBridgeInteriorActive?: boolean;
  isMissionsOpen?: boolean;
  hasActiveMission?: boolean;
  activeOfficerCode?: string | null;
  isComputerVoiceEnabled?: boolean;
  isInspectionOpen: boolean;
  isScannerOpen: boolean;
  isLogOpen?: boolean;
  isTacticalScannerOpen?: boolean;
  isBattleThemePlaying?: boolean;
  isSpeciesDbOpen?: boolean;
  logCount?: number;
}

export const LCARSHeader: React.FC<LCARSHeaderProps> = ({
  shipState,
  onSetAlert,
  onGAlertAction,
  onToggleInspection,
  onToggleScanner,
  onToggleHelp,
  onToggleLog,
  onToggleTacticalScanner,
  onToggleBattleTheme,
  onOpenBattleThemeSettings,
  onOpenVoiceSettings,
  onGoToNearestSpaceDock,
  onToggleComputerVoice,
  onToggleSpeciesDb,
  onOpenPlanetaryScanner,
  onToggleMissions,
  onOpenOfficerProfile,
  onOpenCommendation,
  onToggleBridgeInterior,
  isBridgeInteriorActive = false,
  isMissionsOpen = false,
  hasActiveMission = false,
  activeOfficerCode = null,
  isComputerVoiceEnabled = true,
  isInspectionOpen,
  isScannerOpen,
  isLogOpen,
  isTacticalScannerOpen = true,
  isBattleThemePlaying = false,
  isSpeciesDbOpen = false,
  logCount,
}) => {
  const [stardate, setStardate] = useState('7412.4');
  const [isMuted, setIsMuted] = useState(soundEffects.getMuted());
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  useEffect(() => {
    // Generate authentic Trek stardate based on real time
    const updateStardate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const startOfYear = new Date(year, 0, 1).getTime();
      const fraction = (now.getTime() - startOfYear) / (365.25 * 24 * 3600 * 1000);
      const sd = ((year - 2000) * 100 + fraction * 1000).toFixed(1);
      setStardate(sd);
    };
    updateStardate();
    const interval = setInterval(updateStardate, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    soundEffects.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (!nextMuted) {
      soundEffects.playLcarsBeep(880, 0.05);
    }
  };

  const alertLevel = shipState?.alertLevel || 'green';

  return (
    <header className="relative z-50 h-14 sm:h-16 flex items-center justify-between px-2 sm:px-3 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/30 text-slate-100 select-none gap-1 sm:gap-2">
      {/* Zone 1: Starfleet Flagship Brand */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* LCARS Elbow Accent */}
        <div className="hidden sm:flex items-center">
          <div className="w-8 sm:w-10 h-6 sm:h-7 rounded-tl-xl bg-amber-500 flex items-center justify-center text-slate-950 font-trek font-bold text-xs">
            1701
          </div>
          <div className="w-2 sm:w-2.5 h-6 sm:h-7 bg-amber-400 border-l border-slate-950" />
        </div>

        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="font-trek font-bold text-sm sm:text-base tracking-wider text-amber-400 uppercase truncate">
              Enterprise
            </h1>
            <span className="text-[10px] sm:text-xs font-mono-nums text-slate-400">NCC-1701</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1">
            <span className="hidden xl:inline">Constitution Refit</span>
            <span className="hidden xl:inline" aria-hidden="true">·</span>
            <span>Stardate {stardate}</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Ship Tactical Status & Alert Level Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Alert Level Segmented Controls */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5" title="Alert Status [G key to cycle]">
          <button
            onClick={() => onSetAlert('green')}
            className={`px-2 sm:px-2.5 py-1 text-xs font-trek uppercase rounded transition-colors ${
              alertLevel === 'green'
                ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
            title="Condition Green - Standard Cruise [G key to cycle]"
          >
            Green
          </button>
          <button
            onClick={() => onSetAlert('yellow')}
            className={`px-2 sm:px-2.5 py-1 text-xs font-trek uppercase rounded transition-colors ${
              alertLevel === 'yellow'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-amber-400'
            }`}
            title="Condition Yellow - Standby Alert [G key to cycle]"
          >
            Yellow
          </button>
          <button
            onClick={() => onSetAlert('red')}
            className={`px-2 sm:px-2.5 py-1 text-xs font-trek uppercase rounded transition-colors flex items-center gap-1 ${
              alertLevel === 'red'
                ? 'bg-red-600 text-white font-semibold animate-pulse shadow-sm shadow-red-500/50'
                : 'text-slate-400 hover:text-red-400'
            }`}
            title="Condition Red - Battle Stations! [G key to cycle]"
          >
            <AlertTriangle className="w-3 h-3" />
            Red
          </button>
          <button
            type="button"
            onClick={onGAlertAction}
            className="hidden xl:inline text-[9px] text-slate-400 hover:text-amber-300 font-mono-nums px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors font-bold cursor-pointer"
            title="Press G once for Yellow Alert, double-press G for Red Alert"
          >
            [G]
          </button>
        </div>
      </div>

      {/* Zone 3: Modal Actions, Tools & Sound Controls with Guaranteed Top-Right Access */}
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 justify-end">
        {/* Scrollable / Collapsible Action Buttons Group */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-w-0 pr-1">
          {/* Dedicated 3D Bridge Interior & Crew Command Toggle Button */}
          {onToggleBridgeInterior && (
            <button
              onClick={onToggleBridgeInterior}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all border cursor-pointer ${
                isBridgeInteriorActive
                  ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.55)]'
                  : 'bg-sky-500/20 text-sky-200 border-sky-400/70 hover:bg-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
              }`}
              title="Enter/Exit 3D USS Enterprise Bridge Interior & Crew Command System"
            >
              <span className="text-sm leading-none">🏛️</span>
              <span className="font-trek uppercase tracking-wider">
                {isBridgeInteriorActive ? 'Exit 3D Bridge' : '3D Bridge'}
              </span>
            </button>
          )}

          {/* Dedicated Starfleet Missions Command Button [J] */}
          {onToggleMissions && (
            <button
              onClick={onToggleMissions}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all border cursor-pointer ${
                isMissionsOpen
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.45)]'
                  : hasActiveMission
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/70 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/60 hover:bg-amber-500/30'
              }`}
              title="Starfleet Mission Command & Deep Space Directive Scanner [J]"
            >
              <Compass className={`w-3.5 h-3.5 ${hasActiveMission ? 'text-cyan-300 animate-spin' : 'text-amber-400'}`} />
              <span className="font-trek uppercase tracking-wider">Missions</span>
              {hasActiveMission && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
              <span className="text-[9px] font-mono font-bold opacity-80">[J]</span>
            </button>
          )}

          {/* On-Demand 6-Digit Exhibition Officer ID & Rank Button */}
          {onOpenOfficerProfile && (
            <button
              onClick={onOpenOfficerProfile}
              className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border cursor-pointer ${
                activeOfficerCode
                  ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 hover:bg-cyan-900/80'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-cyan-400/50 hover:text-cyan-300'
              }`}
              title="Science Exhibition 6-Digit Officer ID & XP/Rank Profile Restore"
            >
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline font-mono text-[11px] tabular-nums">
                {activeOfficerCode ? `ID #${activeOfficerCode}` : 'Officer ID'}
              </span>
              {shipState?.progression && (
                <span className="hidden xl:inline text-[10px] font-mono text-amber-300 tabular-nums pl-1 border-l border-slate-700">
                  Lv.{shipState.progression.level}
                </span>
              )}
            </button>
          )}

          {/* Printable / Exportable Starfleet Officer Science Certificate Button */}
          {onOpenCommendation && (
            <button
              onClick={onOpenCommendation}
              className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border bg-amber-500/15 text-amber-300 border-amber-400/50 hover:bg-amber-500/25 cursor-pointer"
              title="View / Print Starfleet Officer Science Certificate & Mission Commendation Card"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline font-trek uppercase tracking-wide">Certificate</span>
            </button>
          )}

          {/* Tactical Combat Radar Toggle */}
          {onToggleTacticalScanner && (
            <button
              onClick={onToggleTacticalScanner}
              className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border ${
                isTacticalScannerOpen
                  ? 'bg-sky-500 text-slate-950 font-bold border-sky-400 shadow-sm shadow-sky-500/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
              title="Toggle 360° Tactical Combat Radar [R]"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden lg:inline font-trek uppercase tracking-wide">Radar</span>
              <span className="text-[9px] font-mono font-bold text-sky-400">[R]</span>
            </button>
          )}

          {/* Interactive Planetary Spectroscopy Scanner (Large screens) */}
          {onOpenPlanetaryScanner && (
            <button
              onClick={onOpenPlanetaryScanner}
              className="hidden 2xl:flex shrink-0 items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border bg-sky-500/15 text-sky-300 border-sky-400/40 hover:bg-sky-500/25"
              title="Planetary Spectroscopy & Atmospheric Science Scanner"
            >
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-trek uppercase tracking-wide">Spectrometer</span>
            </button>
          )}

          {/* Complete Ship Inspection */}
          <button
            onClick={onToggleInspection}
            className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors border ${
              isInspectionOpen
                ? 'bg-amber-500 text-slate-950 font-semibold border-amber-400 shadow-sm shadow-amber-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
            }`}
            title="Ship Inspection: Decks & Subsystems"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden xl:inline font-trek uppercase tracking-wide">Inspect</span>
          </button>

          {/* Star Trek Alien Species Database [X] */}
          {onToggleSpeciesDb && (
            <button
              onClick={onToggleSpeciesDb}
              className={`hidden md:flex shrink-0 items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-xs font-medium transition-colors border ${
                isSpeciesDbOpen
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm shadow-amber-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              }`}
              title="Star Trek Exobiology & Alien Species Database [X]"
            >
              <Dna className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline font-trek uppercase tracking-wide">Species</span>
              <span className="text-[9px] font-mono text-amber-400 font-bold">[X]</span>
            </button>
          )}

          {/* Tactical Combat Log Console */}
          {onToggleLog && (
            <button
              onClick={onToggleLog}
              className={`hidden md:flex shrink-0 items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-xs font-medium transition-colors border ${
                isLogOpen
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm shadow-amber-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              }`}
              title="Tactical Combat Telemetry Log Console"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden lg:inline font-trek uppercase tracking-wide">Log</span>
              {logCount && logCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold font-mono">
                  {logCount}
                </span>
              ) : null}
            </button>
          )}

          {/* Battle Theme Soundtrack Quick Toggle [B] */}
          {onToggleBattleTheme && (
            <div className="hidden lg:flex shrink-0 items-center bg-slate-900 border border-slate-800 rounded overflow-hidden">
              <button
                onClick={onToggleBattleTheme}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                  isBattleThemePlaying
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/50 animate-pulse'
                    : 'text-amber-300 hover:bg-slate-800'
                }`}
                title="Star Trek Theme Song (Loop) - Press [B] to Turn ON / OFF"
              >
                <Music className={`w-3.5 h-3.5 ${isBattleThemePlaying ? 'animate-bounce text-slate-950' : 'text-amber-400'}`} />
                <span className="hidden xl:inline font-trek uppercase tracking-wide">
                  {isBattleThemePlaying ? 'Theme: ON' : 'Theme'}
                </span>
                <span className="text-[9px] font-bold text-amber-400 font-mono">[B]</span>
              </button>
              {onOpenBattleThemeSettings && (
                <button
                  onClick={onOpenBattleThemeSettings}
                  className="px-1.5 py-1.5 text-slate-400 hover:text-amber-300 border-l border-slate-800 hover:bg-slate-800 transition-colors"
                  title="Combat Theme Soundtrack Audio Settings Console"
                >
                  <Sliders className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Ship Computer Voice Toggle & Test Console [V] */}
          {onToggleComputerVoice && (
            <div className="hidden xl:flex shrink-0 items-center bg-slate-900 border border-slate-800 rounded overflow-hidden">
              <button
                onClick={onToggleComputerVoice}
                className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                  isComputerVoiceEnabled
                    ? 'bg-sky-500/20 text-sky-300'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
                title={
                  isComputerVoiceEnabled
                    ? "Ship Computer: USS Enterprise Tactical Voice [Press V to Mute]"
                    : "Ship Computer: USS Enterprise Tactical Voice [Press V to Enable]"
                }
              >
                <Bot className={`w-3.5 h-3.5 ${isComputerVoiceEnabled ? 'text-sky-400' : 'text-slate-500'}`} />
                <span className="hidden 2xl:inline font-trek uppercase tracking-wide">
                  {isComputerVoiceEnabled ? 'Voice' : 'Voice: OFF'}
                </span>
                <span className="text-[9px] font-bold text-sky-400 font-mono">[V]</span>
              </button>
              {isComputerVoiceEnabled && (
                <>
                  <button
                    onClick={() => {
                      soundEffects.setMuted(false);
                      const ctx = soundEffects.getAudioContext();
                      if (ctx && ctx.state === 'suspended') {
                        ctx.resume().catch(() => {});
                      }
                      computerVoice.testVoice();
                    }}
                    className="px-1.5 py-1.5 text-[10px] font-trek uppercase tracking-wider text-sky-400 hover:text-white hover:bg-sky-500/30 border-l border-slate-800 transition-colors font-bold cursor-pointer"
                    title="Test USS Enterprise Computer Voice Audio Now"
                  >
                    Test
                  </button>
                  {onOpenVoiceSettings && (
                    <button
                      onClick={onOpenVoiceSettings}
                      className="px-1.5 py-1.5 text-slate-400 hover:text-sky-300 border-l border-slate-800 hover:bg-slate-800 transition-colors"
                      title="LCARS Voice Telemetry & Starfleet MP3 Soundbank Settings"
                    >
                      <Sliders className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ALWAYS-VISIBLE TOP-RIGHT COMMAND CLUSTER (Never scrolls away or gets cut off!) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pl-1 border-l border-slate-800">
          {/* Audio Mute Toggle */}
          <button
            onClick={toggleSound}
            className="shrink-0 p-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Flight Manual & Keyboard Shortcuts */}
          <button
            onClick={onToggleHelp}
            className="shrink-0 flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-slate-900 border border-amber-500/50 rounded text-amber-300 hover:text-white hover:bg-amber-500/20 transition-colors"
            title="Starfleet Operations & Helm Help Manual (All Controls, Shortcuts, Lore & Systems)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-trek uppercase text-xs">Help</span>
          </button>

          {/* LCARS Tools Quick-Access Overflow Menu (Guarantees 100% accessibility on any screen size) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsToolsMenuOpen((prev) => !prev)}
              className={`p-1.5 rounded transition-colors border flex items-center justify-center ${
                isToolsMenuOpen
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:text-white'
              }`}
              title="LCARS Top-Right System Tools Menu"
              aria-label="System Tools Menu"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

          {/* LCARS Tools Floating Dropdown Panel */}
          {isToolsMenuOpen && (
            <div className="fixed sm:absolute top-14 sm:top-full right-2 sm:right-0 mt-2 w-80 max-w-[calc(100vw-16px)] bg-slate-950 border-2 border-amber-500/70 rounded-xl shadow-2xl shadow-black/90 p-2 z-[70] flex flex-col gap-1 text-xs select-none">
              <div className="flex items-center justify-between pb-1.5 px-2 border-b border-slate-800">
                <span className="font-trek font-bold text-amber-400 tracking-wider uppercase text-[11px]">
                  LCARS Tactical Tools
                </span>
                <button
                  onClick={() => setIsToolsMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto py-1">
                {/* Printable Science Certificate */}
                {onOpenCommendation && (
                  <button
                    onClick={() => {
                      onOpenCommendation();
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold"
                  >
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>View / Print Mission Commendation</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300">CERT</span>
                  </button>
                )}

                {/* Radar */}
                {onToggleTacticalScanner && (
                  <button
                    onClick={() => {
                      onToggleTacticalScanner();
                      setIsToolsMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors ${
                      isTacticalScannerOpen ? 'bg-sky-500/25 text-sky-300 font-bold' : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                      <span>360° Tactical Combat Radar</span>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400">[R]</span>
                  </button>
                )}

                {/* Spectrometer */}
                {onOpenPlanetaryScanner && (
                  <button
                    onClick={() => {
                      onOpenPlanetaryScanner();
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors hover:bg-slate-900 text-slate-300"
                  >
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-sky-400" />
                      <span>Atmospheric Spectrometer</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">SCAN</span>
                  </button>
                )}

                {/* Inspect Ship */}
                <button
                  onClick={() => {
                    onToggleInspection();
                    setIsToolsMenuOpen(false);
                  }}
                  className={`flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors ${
                    isInspectionOpen ? 'bg-amber-500/25 text-amber-300 font-bold' : 'hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Inspect Ship & Subsystems</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">3D</span>
                </button>

                {/* Species DB */}
                {onToggleSpeciesDb && (
                  <button
                    onClick={() => {
                      onToggleSpeciesDb();
                      setIsToolsMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors ${
                      isSpeciesDbOpen ? 'bg-amber-500/25 text-amber-300 font-bold' : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Dna className="w-3.5 h-3.5 text-amber-400" />
                      <span>Alien Species Database</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">[X]</span>
                  </button>
                )}

                {/* Tactical Log */}
                {onToggleLog && (
                  <button
                    onClick={() => {
                      onToggleLog();
                      setIsToolsMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors ${
                      isLogOpen ? 'bg-amber-500/25 text-amber-300 font-bold' : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      <span>Combat Telemetry Log</span>
                    </div>
                    {logCount ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold font-mono">
                        {logCount}
                      </span>
                    ) : null}
                  </button>
                )}

                {/* Battle Theme Music */}
                {onToggleBattleTheme && (
                  <div className="flex items-center justify-between px-2.5 py-2 rounded bg-slate-900/60 border border-slate-800">
                    <button
                      onClick={onToggleBattleTheme}
                      className="flex items-center gap-2 text-left text-slate-300 hover:text-white"
                    >
                      <Music className={`w-3.5 h-3.5 ${isBattleThemePlaying ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
                      <span>Theme Music [B]</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold ${isBattleThemePlaying ? 'text-amber-400' : 'text-slate-500'}`}>
                        {isBattleThemePlaying ? 'ON' : 'OFF'}
                      </span>
                      {onOpenBattleThemeSettings && (
                        <button
                          onClick={() => {
                            onOpenBattleThemeSettings();
                            setIsToolsMenuOpen(false);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Computer Voice */}
                {onToggleComputerVoice && (
                  <div className="flex items-center justify-between px-2.5 py-2 rounded bg-slate-900/60 border border-slate-800">
                    <button
                      onClick={onToggleComputerVoice}
                      className="flex items-center gap-2 text-left text-slate-300 hover:text-white"
                    >
                      <Bot className={`w-3.5 h-3.5 ${isComputerVoiceEnabled ? 'text-sky-400' : 'text-slate-500'}`} />
                      <span>Computer Voice [V]</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono font-bold ${isComputerVoiceEnabled ? 'text-sky-400' : 'text-slate-500'}`}>
                        {isComputerVoiceEnabled ? 'ON' : 'OFF'}
                      </span>
                      {isComputerVoiceEnabled && (
                        <button
                          onClick={() => {
                            soundEffects.setMuted(false);
                            computerVoice.testVoice();
                          }}
                          className="px-1.5 py-0.5 text-[9px] font-trek uppercase text-sky-400 hover:bg-sky-500/20 rounded border border-sky-500/40 font-bold"
                        >
                          Test
                        </button>
                      )}
                      {onOpenVoiceSettings && (
                        <button
                          onClick={() => {
                            onOpenVoiceSettings();
                            setIsToolsMenuOpen(false);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800"
                        >
                          <Sliders className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Sound Mute */}
                <button
                  onClick={toggleSound}
                  className="flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors hover:bg-slate-900 text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>Master Audio</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${isMuted ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isMuted ? 'MUTED' : 'ACTIVE'}
                  </span>
                </button>

                {/* Help */}
                <button
                  onClick={() => {
                    onToggleHelp();
                    setIsToolsMenuOpen(false);
                  }}
                  className="flex items-center justify-between px-2.5 py-2 rounded text-left transition-colors hover:bg-slate-900 text-amber-300 font-bold"
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Flight Manual & Controls Help</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400">[?]</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);
};
