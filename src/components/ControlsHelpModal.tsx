import React from 'react';
import { X, Navigation, Crosshair, Video, Rocket, Layers } from 'lucide-react';

interface ControlsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsHelpModal: React.FC<ControlsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-slate-950 border border-amber-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-amber-400 rounded-sm" />
            <div>
              <h2 className="text-sm font-trek uppercase tracking-wider font-bold text-amber-400">
                Starfleet Helm & Operations Manual
              </h2>
              <p className="text-xs text-slate-400 font-mono-nums">USS Enterprise NCC-1701 Flight Controls</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Flight Steering */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <h3 className="text-xs font-trek text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-bold">
              <Navigation className="w-3.5 h-3.5" />
              <span>Attitude & Steering Controls</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-nums">
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Pitch Nose Down/Up</span>
                <span className="text-amber-300 font-semibold">W / S or ↑ / ↓</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Yaw Turn Left/Right</span>
                <span className="text-amber-300 font-semibold">A / D or ← / →</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Roll Left / Right</span>
                <span className="text-amber-300 font-semibold">Q / E</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Mouse Yoke Steering</span>
                <span className="text-amber-300 font-semibold">Click + Drag</span>
              </div>
            </div>
          </div>

          {/* Propulsion & Warp */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <h3 className="text-xs font-trek text-sky-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-bold">
              <Rocket className="w-3.5 h-3.5" />
              <span>Propulsion & Warp Drive</span>
            </h3>
            <div className="space-y-1.5 text-xs font-mono-nums">
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Engage Warp Factor 1 - 9</span>
                <span className="text-sky-300 font-semibold font-mono">Ctrl + Alt + 1..9</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Drop Out of Warp / Abort Course (Restores W,S,A,D)</span>
                <span className="text-red-300 font-semibold font-mono">Ctrl + Alt + R</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Impulse Throttle Slider</span>
                <span className="text-sky-300 font-semibold">Mouse Wheel / Presets</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Engage / Drop Out of Warp (UI)</span>
                <span className="text-sky-300 font-semibold">WARP / DROP Button</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Deselect Target / Clear Route & Locks</span>
                <span className="text-emerald-300 font-semibold font-mono">Z key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Warp Factors</span>
                <span className="text-sky-300 font-semibold">Factor 1.0 to 9.9</span>
              </div>
            </div>
          </div>

          {/* Tactical Weapons */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <h3 className="text-xs font-trek text-red-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-bold">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Tactical & Defense Systems</span>
            </h3>
            <div className="space-y-1.5 text-xs font-mono-nums">
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Fire Phaser Banks</span>
                <span className="text-red-300 font-semibold">Spacebar (Hold)</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Launch Photon Torpedo</span>
                <span className="text-red-300 font-semibold">T key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Quick Course Plotter Drawer (Emergency Escape)</span>
                <span className="text-sky-300 font-semibold">N key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Astrometrics Star & Planetary Map</span>
                <span className="text-sky-300 font-semibold">M key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Nearest Space Dock (Auto-Warp Repairs & Refillings)</span>
                <span className="text-cyan-300 font-semibold">Tactical Ordnance HUD</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Star Trek Alien Species Database</span>
                <span className="text-amber-300 font-semibold font-mono">X key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Dock / Undock at Space Station (100% Repair & Reload)</span>
                <span className="text-cyan-300 font-semibold font-mono">U key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Cycle / Lock Hostile Target</span>
                <span className="text-red-300 font-semibold">Tab key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Evasive Thruster Boost (Decreases from 100%, click Stop to hold %)</span>
                <span className="text-cyan-300 font-semibold">Shift key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Toggle Star Trek Theme Song ON / OFF (Loop)</span>
                <span className="text-amber-300 font-semibold">B key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Select Object (Planet, Star, Starbase, Vessel)</span>
                <span className="text-amber-300 font-semibold">Mouse Click / Radar Blip</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Battle Theme Music (Toggle / Start @ 0:38)</span>
                <span className="text-amber-300 font-semibold">B / Alt + B</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Toggle USS Enterprise Computer Voice</span>
                <span className="text-sky-300 font-semibold font-mono">V key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Toggle Tactical Log Overlay</span>
                <span className="text-amber-300 font-semibold">L key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Toggle Tactical Radar Scanner</span>
                <span className="text-sky-300 font-semibold">R key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Dogfight Tracking Assist</span>
                <span className="text-emerald-300 font-semibold">Auto-Track ON / OFF</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Condition Yellow (Standby)</span>
                <span className="text-amber-300 font-semibold font-mono">Single Press G</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Condition Red (Battle Stations)</span>
                <span className="text-red-400 font-semibold font-mono">Double Press G</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Combat Damage Response</span>
                <span className="text-red-300 font-semibold">Auto-Engages Red Alert</span>
              </div>
            </div>
          </div>

          {/* Cameras & Complete Ship Inspection */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
            <h3 className="text-xs font-trek text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-bold">
              <Video className="w-3.5 h-3.5" />
              <span>Camera Views & Ship Inspection</span>
            </h3>
            <div className="space-y-1.5 text-xs font-mono-nums">
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Cycle Camera Perspectives</span>
                <span className="text-emerald-300 font-semibold">C key</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Camera POV Zoom In / Out</span>
                <span className="text-emerald-300 font-semibold">Mouse Scroll / + / - keys</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">Reset Camera Zoom (100%)</span>
                <span className="text-emerald-300 font-semibold">0 key / Double Click</span>
              </div>
              <div className="flex items-center justify-between p-1.5 bg-slate-950/60 rounded">
                <span className="text-slate-400">360° Ship Inspection Orbit</span>
                <span className="text-emerald-300 font-semibold">Inspect Ship / Orbit Cam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-trek font-bold text-xs uppercase tracking-wider rounded transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
