// Starfleet Astrometric & Tactical Dossier Modal ("Know More" Window)
// Deep scientific, astrometric, and tactical analysis of selected celestial bodies and vessels

import React, { useEffect } from 'react';
import { DetailedObjectInfo } from '../data/celestialObjectDatabase';
import { LCARSObjectIllustration } from './LCARSObjectIllustration';
import { formatAstronomicalDistance } from '../utils/scaleFormatters';
import {
  X,
  Compass,
  Navigation,
  Shield,
  Crosshair,
  Globe,
  Radio,
  Activity,
  Layers,
  Thermometer,
  Users,
  Flag,
  FileText,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface LCARSObjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectInfo: DetailedObjectInfo | null;
  onPlotCourse?: (targetId: string) => void;
  onDock?: (stationId: string) => void;
  isDocked?: boolean;
}

export const LCARSObjectDetailModal: React.FC<LCARSObjectDetailModalProps> = ({
  isOpen,
  onClose,
  objectInfo,
  onPlotCourse,
  onDock,
  isDocked = false,
}) => {
  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !objectInfo) return null;

  const { characteristics, visual, tacticalNotes, historicalLog } = objectInfo;
  const isEnemy = objectInfo.category === 'enemy';
  const isStarbase = objectInfo.category === 'starbase';
  const isStar = objectInfo.category === 'star';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-950 rounded-2xl border-2 border-sky-500/60 shadow-2xl shadow-sky-950/80 flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* LCARS Top Header Graphic Accent */}
        <div className="flex items-stretch bg-slate-900 border-b border-sky-500/50">
          {/* LCARS Amber Left Elbow */}
          <div className="w-16 sm:w-24 bg-amber-500 rounded-br-2xl flex items-center justify-center p-2 shrink-0">
            <span className="text-[11px] font-trek uppercase font-bold text-slate-950 tracking-wider">
              LCARS
            </span>
          </div>

          {/* Header Title Section */}
          <div className="flex-1 flex items-center justify-between px-3 sm:px-4 py-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-trek uppercase font-bold text-sky-300 tracking-wider">
                  Starfleet Astrometric Sensor Dossier
                </span>
                <span className="text-[10px] text-slate-400 font-mono-nums">
                  Sector {objectInfo.systemName} · {objectInfo.quadrant}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Close Dossier [Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Hero Section: Large Illustration & Essential Overview */}
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Visual Viewport with Scanning Frame */}
            <div className="flex flex-col items-center gap-2 mx-auto md:mx-0 shrink-0">
              <div className="relative p-1 bg-slate-900 rounded-xl border border-sky-500/50 shadow-inner">
                <LCARSObjectIllustration objectInfo={objectInfo} size="lg" />
                <div className="absolute top-2 left-2 text-[9px] font-mono-nums text-sky-400 bg-slate-950/80 px-1 rounded border border-sky-500/30">
                  SCAN: OPTICAL 1:1
                </div>
                <div className="absolute bottom-2 left-2 text-[9px] font-mono-nums text-amber-300 bg-slate-950/80 px-1 rounded border border-amber-500/30">
                  RANGE: {formatAstronomicalDistance(objectInfo.distanceKm, 'detailed')}
                </div>
              </div>

              {/* Spectral Class or Category Badge */}
              <div className="flex items-center gap-2 text-xs font-mono-nums text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300 font-bold">
                  {characteristics.classification.split(' (')[0]}
                </span>
              </div>
            </div>

            {/* Name, Classification, and Primary Description */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isEnemy ? 'bg-red-500 animate-ping' : isStarbase ? 'bg-amber-400' : 'bg-sky-400'
                    }`}
                  />
                  <h3 className="text-xl sm:text-2xl font-trek uppercase font-bold text-amber-300 tracking-wide">
                    {objectInfo.name}
                  </h3>
                </div>
                <p className="text-xs font-trek uppercase tracking-wider text-sky-400 mt-0.5">
                  {objectInfo.type}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {objectInfo.description}
              </p>

              {/* Status Bar */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono-nums">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-400">Operational Status:</span>
                <span className="text-emerald-300 font-bold">{characteristics.status}</span>
              </div>
            </div>
          </div>

          {/* Physical & Planetary Characteristics Grid */}
          <div>
            <h4 className="text-xs font-trek uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-2.5 font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>Astrometric & Environmental Specifications</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono-nums">
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 font-trek uppercase">Diameter</div>
                <div className="text-slate-200 font-semibold">{characteristics.diameter}</div>
              </div>

              {characteristics.surfaceGravity && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-trek uppercase">Surface Gravity</div>
                  <div className="text-slate-200 font-semibold">{characteristics.surfaceGravity}</div>
                </div>
              )}

              {characteristics.meanTemperature && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-trek uppercase">Mean Temperature</div>
                  <div className="text-slate-200 font-semibold">{characteristics.meanTemperature}</div>
                </div>
              )}

              {characteristics.orbitalPeriod && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-trek uppercase">Orbital Period</div>
                  <div className="text-slate-200 font-semibold">{characteristics.orbitalPeriod}</div>
                </div>
              )}

              {characteristics.atmosphere && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-trek uppercase">Atmosphere</div>
                  <div className="text-slate-200 font-semibold truncate" title={characteristics.atmosphere}>
                    {characteristics.atmosphere}
                  </div>
                </div>
              )}

              {characteristics.population && (
                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400 font-trek uppercase">Population</div>
                  <div className="text-slate-200 font-semibold truncate" title={characteristics.population}>
                    {characteristics.population}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tactical & Diplomatic Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Affiliation & Defenses */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
              <h5 className="text-xs font-trek uppercase font-bold text-amber-400 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" />
                <span>Affiliation & Defense Profile</span>
              </h5>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-mono-nums">
                  <span className="text-slate-400">Affiliation:</span>
                  <span className="text-slate-200 font-semibold text-right">{characteristics.affiliation}</span>
                </div>
                {characteristics.defenseSystems && (
                  <div className="flex justify-between font-mono-nums">
                    <span className="text-slate-400">Defenses:</span>
                    <span className="text-slate-200 font-semibold text-right">{characteristics.defenseSystems}</span>
                  </div>
                )}
                {isStarbase && (
                  <div className="flex justify-between font-mono-nums">
                    <span className="text-slate-400">Drydock Berths:</span>
                    <span className="text-emerald-400 font-semibold">Available for Constitution Class</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Tactical Sensor Findings */}
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
              <h5 className="text-xs font-trek uppercase font-bold text-sky-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Sensor Findings & Directives</span>
              </h5>
              <ul className="space-y-1 text-xs text-slate-300">
                {tacticalNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-sky-400 font-bold">›</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Starfleet Historical Log Entry */}
          {historicalLog && (
            <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800/80 text-xs font-mono-nums text-slate-400 italic">
              <span className="text-amber-400 not-italic font-bold font-trek uppercase mr-1.5">
                Starfleet Log:
              </span>
              {historicalLog}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-mono-nums text-slate-400">
            <span>Coordinates:</span>
            <span className="text-sky-300">
              [{objectInfo.coordinates[0]}, {objectInfo.coordinates[1]}, {objectInfo.coordinates[2]}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Undock button (if currently docked at starbase) */}
            {isStarbase && onDock && isDocked && (
              <button
                onClick={() => {
                  onDock(objectInfo.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-trek uppercase font-bold border border-emerald-500 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Undock from Station [X]</span>
              </button>
            )}

            {/* Plot Course & Warp button */}
            {onPlotCourse && !isEnemy && (
              <button
                onClick={() => {
                  onPlotCourse(objectInfo.id);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-trek uppercase font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Plot Course & Warp</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-trek uppercase font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              Dismiss [Esc]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
