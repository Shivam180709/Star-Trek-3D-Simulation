// Starfleet Helm & Operations Manual (Controls & Systems Help Modal)
// Exhaustive, technically accurate Star Trek reference guide detailing:
// - All flight, impulse, warp, and camera controls
// - Exact keyboard shortcuts (Shift for Evasive Boost, W for Warp, Ctrl+Alt+1..9 for Warp Factors, etc.)
// - Full breakdowns of ship systems: Shields, Hull, Green/Yellow/Red Alerts, Phasers, Photon Torpedoes,
//   Astrometric Map, Course Plotting, Battle Themes, and Officer Progression (Ensign to Admiral).

import React, { useState } from 'react';
import {
  X,
  Navigation,
  Crosshair,
  Rocket,
  Shield,
  Layers,
  HelpCircle,
  Video,
  Music,
  Radio,
  Award,
  Zap,
  Globe,
  Compass,
  AlertTriangle,
  RotateCcw,
  Volume2,
} from 'lucide-react';

interface ControlsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsHelpModal: React.FC<ControlsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'warp' | 'tactical' | 'systems' | 'ranks'>('controls');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none font-trek">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-950/98 border border-amber-500/50 rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-sky-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/40 shadow-md">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-bold tracking-wider">
                  Starfleet Technical Order 1701-A
                </span>
                <span className="text-xs text-slate-400 font-mono-nums">USS Enterprise Helm Manual</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide mt-0.5">
                Starfleet Flight Controls, Operations & Systems Manual
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 text-xs uppercase font-bold overflow-x-auto">
          {[
            { id: 'controls', label: 'Flight & Helm Shortcuts', icon: Navigation },
            { id: 'warp', label: 'Warp Drive & Alcubierre Physics', icon: Rocket },
            { id: 'tactical', label: 'Tactical Weapons & Ordnance', icon: Crosshair },
            { id: 'systems', label: 'Ship Systems, Alerts & Map', icon: Shield },
            { id: 'ranks', label: 'Officer Ranks & Progression', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-amber-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs leading-relaxed">
          {/* TAB 1: FLIGHT & HELM SHORTCUTS */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-200">
                <span className="font-bold text-white block mb-0.5">Primary Helm Operation Notice:</span>
                Flight assist automatically stabilizes the starship artificial horizon and clamps pitch elevation to ±65°, preventing the Enterprise from ever flipping upside down during vertical maneuvers.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-mono-nums">
                {/* Attitude & Steering */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-trek text-amber-400 uppercase tracking-wider font-bold flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Attitude & Directional Steering</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Pitch Dive (Down) / Climb (Up)</span>
                      <span className="text-amber-300 font-bold">W / S or ↑ / ↓</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Yaw Steering (Turn Port / Starboard)</span>
                      <span className="text-amber-300 font-bold">A / D or ← / →</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Roll Left / Right</span>
                      <span className="text-amber-300 font-bold">Q / E</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Mouse Yoke Steering</span>
                      <span className="text-amber-300 font-bold">Click + Drag Viewport</span>
                    </div>
                  </div>
                </div>

                {/* Propulsion & Thrusters */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-trek text-sky-400 uppercase tracking-wider font-bold flex items-center gap-2">
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Propulsion & Overdrive</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Toggle Warp Drive (Engage / Disengage)</span>
                      <span className="text-sky-300 font-bold">W key</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Evasive Thruster Boost Overdrive</span>
                      <span className="text-cyan-300 font-bold">Shift (Left or Right)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Impulse Sub-Light Throttle</span>
                      <span className="text-sky-300 font-bold">Stop / 1/4 / 1/2 / Full</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Engage Instant Warp Factor 1 - 9</span>
                      <span className="text-sky-300 font-bold">Ctrl + Alt + [1 .. 9]</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Emergency Drop Out of Warp</span>
                      <span className="text-red-400 font-bold">Ctrl + Alt + R</span>
                    </div>
                  </div>
                </div>

                {/* Tactical & Targeting */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-trek text-red-400 uppercase tracking-wider font-bold flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Tactical & Targeting</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Fire Ship Phaser Banks</span>
                      <span className="text-red-300 font-bold">Spacebar (Hold)</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Launch Photon Torpedo</span>
                      <span className="text-red-300 font-bold">T key</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Cycle / Lock Nearest Hostile Vessel</span>
                      <span className="text-amber-300 font-bold">Tab key</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Cycle Alert Condition (Green / Yellow / Red)</span>
                      <span className="text-amber-300 font-bold">G key</span>
                    </div>
                  </div>
                </div>

                {/* Interface & Navigation Modals */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-trek text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Astrogation & Interface Modals</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Stellar Cartography & 3D Coordinates</span>
                      <span className="text-emerald-300 font-bold">N key</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Galaxy System Map (40 Star Systems)</span>
                      <span className="text-emerald-300 font-bold">M key</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Alien Species Database (35+ Species)</span>
                      <span className="text-emerald-300 font-bold">X key</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Dock / Undock at Starbase (100% Repair)</span>
                      <span className="text-cyan-300 font-bold">U key</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800/80">
                      <span className="text-slate-300 font-trek">Star Trek Battle Theme Soundtrack</span>
                      <span className="text-amber-300 font-bold">B key / Alt + B</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WARP DRIVE & ALCUBIERRE PHYSICS */}
          {activeTab === 'warp' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-sky-500/30 space-y-2">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wide flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  Warp Drive Propulsion & Theoretical Mechanics
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  In Star Trek lore and real theoretical physics (Alcubierre metric, 1994), starships do not accelerate through space in the conventional Newtonian sense. Instead, two matter-antimatter powered warp coils inside twin nacelles generate an asymmetric subspace displacement field. This contracts space-time fabric ahead of the vessel and expands space-time behind it, moving the bubble superluminally while the ship locally remains at rest.
                </p>
              </div>

              {/* Exact Shortcuts and Factors Breakdown */}
              <div className="border border-slate-800 rounded-xl overflow-hidden font-mono-nums">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 text-slate-300 uppercase font-trek text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Warp Factor</th>
                      <th className="p-2.5 text-sky-400">Equivalent Velocity</th>
                      <th className="p-2.5 text-amber-400">Keyboard Shortcut</th>
                      <th className="p-2.5">Subspace Visual Characteristics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-[11.5px]">
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-white">Warp 1.0</td>
                      <td className="p-2.5 text-sky-300">1.0 c (300,000 km/s)</td>
                      <td className="p-2.5 text-amber-300 font-bold">Ctrl + Alt + 1</td>
                      <td className="p-2.5 text-slate-300">Threshold lightspeed boundary. Stable, clear star streaks without field distortion.</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-white">Warp 2.0 – 4.0</td>
                      <td className="p-2.5 text-sky-300">8 c – 64 c</td>
                      <td className="p-2.5 text-amber-300 font-bold">Ctrl + Alt + 2 .. 4</td>
                      <td className="p-2.5 text-slate-300">Inner solar system transit. Cyan subspace field glow and compression rings begin forming.</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-white">Warp 6.0 – 8.0</td>
                      <td className="p-2.5 text-sky-300">216 c – 512 c</td>
                      <td className="p-2.5 text-amber-300 font-bold">Ctrl + Alt + 6 .. 8</td>
                      <td className="p-2.5 text-slate-300">Standard interstellar cruising speed. Custom GLSL subspace distortion shader active with chromatic aberration.</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-white">Warp 9.0 – 9.9</td>
                      <td className="p-2.5 text-sky-300">729 c – 3,053 c</td>
                      <td className="p-2.5 text-amber-300 font-bold">Ctrl + Alt + 9</td>
                      <td className="p-2.5 text-slate-300">Maximum emergency velocity. Blinding electric-white core, intense rainbow prismatic fringes, and relativistic particle shower.</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-red-400">Drop Out of Warp</td>
                      <td className="p-2.5 text-slate-400">Sub-light impulse</td>
                      <td className="p-2.5 text-red-400 font-bold">Ctrl + Alt + R or W</td>
                      <td className="p-2.5 text-slate-300">Instant subspace field collapse. Star streaks smoothly contract back into pinpoint background stars.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TACTICAL WEAPONS & DEFENSE SYSTEMS */}
          {activeTab === 'tactical' && (
            <div className="space-y-4">
              {/* Phasers vs Torpedoes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Phasers */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-red-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wide flex items-center gap-1.5 font-trek">
                      <Zap className="w-4 h-4 text-red-500" />
                      Phaser Banks (PHASed Energy Rectification)
                    </span>
                    <span className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/30">
                      Spacebar (Hold)
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Directed-energy weapon system that releases a continuous, collimated beam of nadion particles at light speed. Nadions trigger rapid subatomic disruption upon target impact, stripping away defensive shields and vaporizing hull armor without physical projectile recoil.
                  </p>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-nums text-slate-400">
                    <span className="text-amber-300 font-bold">Cooldown & Energy:</span> Phaser banks draw from reserve capacitor banks (100% capacity). Sustained fire depletes energy, which auto-recharges once fire is released.
                  </div>
                </div>

                {/* Photon Torpedoes */}
                <div className="p-4 bg-slate-900/60 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5 font-trek">
                      <Crosshair className="w-4 h-4 text-amber-500" />
                      Photon Torpedoes
                    </span>
                    <span className="text-[10px] font-mono-nums px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                      T key
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-white">Photon torpedoes in Star Trek are self-guided, warp-capable projectile weapons that rely on a controlled matter-antimatter annihilation reaction to deliver massive explosive yields.</strong>
                  </p>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Enclosed in an elongated casing shielded by a warp sustainer engine, each torpedo contains deuterium and anti-deuterium kept separate by magnetic containment fields until detonation, releasing tremendous gamma radiation and explosive kinetic shockwaves.
                  </p>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-nums text-slate-400">
                    <span className="text-sky-300 font-bold">Guidance:</span> Torpedoes feature autonomous proximity trajectory seeking, automatically acquiring locked hostile targets or tracking hostiles within 850 km.
                  </div>
                </div>
              </div>

              {/* Defensive Shields & Hull Armor */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wide flex items-center gap-2 font-trek">
                  <Shield className="w-4 h-4" />
                  Multiphasic Deflector Shields & Duranium Hull Integrity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-nums">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <strong className="text-sky-300 block mb-0.5">Multiphasic Shield Grid (0 - 100%)</strong>
                    High-frequency gravimetric forcefield emitted around the hull that absorbs kinetic impacts and dissipates thermal energy from enemy phasers. Recharges automatically when disengaged from combat.
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                    <strong className="text-emerald-300 block mb-0.5">Duranium Hull Armor (0 - 100%)</strong>
                    The physical structure of the vessel. If shields fail, incoming weapon fire directly penetrates structural bulkheads, triggering breach warnings and emergency repairs at orbital starbases.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHIP SYSTEMS, ALERT CONDITIONS & MAP */}
          {activeTab === 'systems' && (
            <div className="space-y-4">
              {/* Alert Conditions */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2 font-trek">
                    <AlertTriangle className="w-4 h-4" />
                    Starfleet Alert Status Levels [Cycle with G Key]
                  </h4>
                  <span className="text-[10px] font-mono-nums text-slate-400">Bridge Protocol</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono-nums">
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      Condition Green
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Normal operational cruise. Shields stand down, sensors running standard survey sweeps, warp core operating at nominal intermix efficiency.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      Condition Yellow
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Heightened readiness. Defensive shields charged and on standby, phaser banks pre-energized, damage control teams stationed on all primary decks.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/50">
                    <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Condition Red (Battle Stations!)
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Combat emergency! Klaxons sound across the vessel, multiphasic shields instantly raised to 100%, torpedo tubes loaded, full tactical authority engaged.
                    </p>
                  </div>
                </div>
              </div>

              {/* Map & Cartography */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wide flex items-center gap-2 font-trek">
                  <Globe className="w-4 h-4" />
                  Galaxy Map [M key] & Stellar Cartography [N key]
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  The Galaxy Map contains all <strong className="text-white">40 Star Trek Solar Systems</strong> spanning Federation, Klingon, Romulan, Cardassian, and Borg space. You can view 3D orbital rings, filter by political territory, and plot automated warp routes with exact transit times.
                </p>
              </div>

              {/* Music & Soundtracks */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2 font-trek">
                  <Music className="w-4 h-4" />
                  Soundtrack & Battle Theme [B key / Alt + B]
                </h4>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Includes authentic Star Trek symphonic orchestration, the iconic Jerry Goldsmith Enterprise fanfare, and dramatic combat themes that dynamically intensify when hostile Klingon Birds-of-Prey or Romulan Warbirds open fire.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: OFFICER RANKS & PROGRESSION */}
          {activeTab === 'ranks' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2 font-trek">
                    <Award className="w-4 h-4" />
                    Starfleet Command Rank & Progression Ladder
                  </h4>
                  <span className="text-[10px] font-mono-nums text-slate-400">Career Records</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  As you explore uncharted star systems, conduct planetary sensor scans, discover alien civilizations in the database, and defend the Federation against hostile incursions, your officer profile gains Experience Points (XP) and earns formal Starfleet promotions:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono-nums text-xs">
                {[
                  { rank: 'Ensign', level: 'Level 1', color: '#94a3b8', role: 'Junior bridge officer certified for basic impulse flight and orbital monitoring.' },
                  { rank: 'Lieutenant Junior Grade', level: 'Level 2', color: '#38bdf8', role: 'Certified for auxiliary deflector dish calibration and sub-light sensor sweeps.' },
                  { rank: 'Lieutenant', level: 'Level 3', color: '#60a5fa', role: 'Full bridge watch officer authorized to plot interstellar warp routes.' },
                  { rank: 'Lieutenant Commander', level: 'Level 4', color: '#f59e0b', role: 'Department head (Chief Engineer, Science Officer) with weapon authorization.' },
                  { rank: 'Commander', level: 'Level 5', color: '#fbbf24', role: 'First Officer (Executive Officer) commanding tactical maneuvers and away teams.' },
                  { rank: 'Captain', level: 'Level 6', color: '#eab308', role: 'Commanding Officer of a starship with total authority over vessel operations.' },
                  { rank: 'Fleet Captain', level: 'Level 7', color: '#fb923c', role: 'Senior captain leading multi-starship task forces on deep space exploration.' },
                  { rank: 'Rear Admiral', level: 'Level 8', color: '#f97316', role: 'Sector commander directing border defense and planetary diplomacy.' },
                  { rank: 'Fleet Admiral', level: 'Level 9+', color: '#ef4444', role: 'Highest command echelon at Starfleet Command on Earth directing all quadrant fleets.' },
                ].map((item) => (
                  <div key={item.rank} className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-trek uppercase text-[11.5px]">{item.rank}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800" style={{ color: item.color }}>
                        {item.level}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[10.5px] leading-relaxed">
                      {item.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono-nums text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Starfleet Operations Command Database Online</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-trek font-extrabold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
