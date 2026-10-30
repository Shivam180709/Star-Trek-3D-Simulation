// Starfleet LCARS Target Telemetry & Object Information Panel
// Positioned below the Tactical Radar, extended vertically to fill available space with rich sensor readouts

import React, { useState } from 'react';
import { DetailedObjectInfo } from '../data/celestialObjectDatabase';
import { LCARSObjectIllustration } from './LCARSObjectIllustration';
import { formatAstronomicalDistance } from '../utils/scaleFormatters';
import {
  Info,
  Navigation,
  Shield,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin,
  Activity,
  Globe,
  Radio,
  Anchor,
  Compass,
} from 'lucide-react';

interface LCARSObjectInfoPanelProps {
  objectInfo: DetailedObjectInfo | null;
  onOpenDetails: () => void;
  onPlotCourse?: (targetId: string) => void;
  onDock?: (stationId: string) => void;
  isDocked?: boolean;
  className?: string;
}

export const LCARSObjectInfoPanel: React.FC<LCARSObjectInfoPanelProps> = ({
  objectInfo,
  onOpenDetails,
  onPlotCourse,
  onDock,
  isDocked = false,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!objectInfo) return null;

  const isEnemy = objectInfo.category === 'enemy';
  const isStarbase = objectInfo.category === 'starbase';
  const isCloseEnoughToDock = isStarbase && objectInfo.distanceKm <= 1200;

  return (
    <div
      className={`w-full mt-2 bg-slate-950/95 backdrop-blur-md rounded-xl border border-sky-500/40 shadow-2xl shadow-sky-950/50 p-2.5 sm:p-3 text-slate-100 select-none pointer-events-auto transition-all flex flex-col ${
        isCollapsed ? 'shrink-0' : 'flex-1 min-h-0'
      } ${className}`}
    >
      {/* LCARS Header Bar */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 text-[10px] font-trek uppercase tracking-wider shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isEnemy
                ? 'bg-red-500 animate-ping'
                : isStarbase
                ? 'bg-amber-400'
                : 'bg-sky-400'
            }`}
          />
          <span className="font-bold text-sky-300 truncate">Target Telemetry</span>
          <span className="text-slate-500 shrink-0">·</span>
          <span className="font-mono-nums text-[9px] text-amber-300 font-semibold shrink-0">
            {formatAstronomicalDistance(objectInfo.distanceKm, 'compact')}
          </span>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-0.5 transition-colors shrink-0 ml-1"
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Main Body (Collapsible & Scrollable if needed) */}
      {!isCollapsed && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
          {/* Scrollable Telemetry Body */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-sky-900/60 scrollbar-track-transparent">
            {/* 1. Object Visual Preview & Title Header */}
            <div className="flex items-start gap-2.5 bg-slate-900/50 p-2 rounded-lg border border-slate-800/80">
              {/* Procedural Holographic Preview */}
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={onOpenDetails}
                title="Click to view full astrometric dossier"
              >
                <LCARSObjectIllustration objectInfo={objectInfo} size="md" className="w-[62px] h-[62px] sm:w-[68px] sm:h-[68px]" />
                <div className="absolute inset-0 bg-sky-500/15 group-hover:bg-sky-500/30 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Info className="w-4 h-4 text-white drop-shadow" />
                </div>
              </div>

              {/* Name, Type & System */}
              <div className="flex-1 min-w-0">
                <h4
                  className="text-xs sm:text-sm font-trek uppercase font-bold text-amber-300 leading-tight hover:text-amber-200 cursor-pointer"
                  onClick={onOpenDetails}
                  title={objectInfo.name}
                >
                  {objectInfo.name}
                </h4>

                <div className="text-[10px] font-trek uppercase text-sky-400 truncate mt-0.5 flex items-center gap-1 font-semibold">
                  {isStarbase ? (
                    <Anchor className="w-3 h-3 text-sky-400 shrink-0" />
                  ) : isEnemy ? (
                    <Crosshair className="w-3 h-3 text-red-400 shrink-0" />
                  ) : (
                    <Globe className="w-3 h-3 text-sky-400 shrink-0" />
                  )}
                  <span className="truncate">{objectInfo.type}</span>
                </div>

                <div className="text-[9px] font-mono-nums text-slate-400 truncate mt-0.5 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                  <span className="truncate">{objectInfo.systemName}</span>
                </div>

                {/* Status Badge */}
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-trek uppercase font-bold tracking-wider ${
                      isEnemy
                        ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                        : isStarbase
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : 'bg-sky-950/80 text-sky-300 border border-sky-500/40'
                    }`}
                  >
                    {isStarbase
                      ? isDocked
                        ? 'DOCKING BERTH ACTIVE'
                        : isCloseEnoughToDock
                        ? 'IN DOCKING RANGE'
                        : 'ORBITAL STARBASE'
                      : isEnemy
                      ? 'HOSTILE CONTACT'
                      : 'STANDARD ORBIT'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Astrometric Lore & Description */}
            <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/90 text-[10px] text-slate-300 leading-relaxed font-sans shadow-inner">
              {objectInfo.description || objectInfo.briefDescription}
            </div>

            {/* 3. LCARS Astrometric Sensor Telemetry Grid */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-trek uppercase tracking-wider text-sky-400 px-0.5 font-bold">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-sky-400" />
                  <span>Astrometric Telemetry Grid</span>
                </span>
                <span className="text-slate-500 font-mono-nums">LCARS-SCAN</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {/* Metric 1: Classification */}
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-trek uppercase text-slate-400 tracking-wider">Classification</span>
                  <span className="text-[9.5px] font-mono-nums font-semibold text-slate-200 truncate">
                    {objectInfo.characteristics?.classification || objectInfo.type}
                  </span>
                </div>

                {/* Metric 2: Diameter / Scale */}
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-trek uppercase text-slate-400 tracking-wider">Dimensions</span>
                  <span className="text-[9.5px] font-mono-nums font-semibold text-amber-300 truncate">
                    {objectInfo.characteristics?.diameter || `${objectInfo.distanceKm > 0 ? 'Tactical Scale' : 'N/A'}`}
                  </span>
                </div>

                {/* Metric 3: Affiliation / Authority */}
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-trek uppercase text-slate-400 tracking-wider">Affiliation</span>
                  <span className="text-[9.5px] font-trek uppercase font-semibold text-sky-300 truncate">
                    {objectInfo.characteristics?.affiliation || 'Known Space'}
                  </span>
                </div>

                {/* Metric 4: Operational Status */}
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-trek uppercase text-slate-400 tracking-wider">Status</span>
                  <span className="text-[9.5px] font-mono-nums font-semibold text-emerald-400 truncate">
                    {objectInfo.characteristics?.dockingAvailable
                      ? '100% Repairs & Refits'
                      : objectInfo.characteristics?.status || 'Active'}
                  </span>
                </div>

                {/* Metric 5: Environment / Atmosphere */}
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-trek uppercase text-slate-400 tracking-wider">Environment</span>
                  <span className="text-[9.5px] font-mono-nums text-slate-300 truncate">
                    {objectInfo.characteristics?.atmosphere || objectInfo.characteristics?.defenseSystems || 'Deep Space'}
                  </span>
                </div>

                {/* Metric 6: Astrometric Coordinates */}
                <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
                  <span className="text-[8px] font-trek uppercase text-slate-400 tracking-wider">Galactic Bearing</span>
                  <span className="text-[9.5px] font-mono-nums text-sky-400 truncate">
                    {Math.round(objectInfo.coordinates[0])}, {Math.round(objectInfo.coordinates[2])}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Tactical Notes & Astrometric Sensor Log */}
            {objectInfo.tacticalNotes && objectInfo.tacticalNotes.length > 0 && (
              <div className="bg-sky-950/30 p-2 rounded-lg border border-sky-500/20 text-[9.5px] space-y-1">
                <div className="flex items-center gap-1 font-trek uppercase font-bold text-sky-400 text-[9px] tracking-wider">
                  <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>Tactical Sensor Log</span>
                </div>
                <div className="text-slate-300 leading-relaxed font-sans">
                  {objectInfo.tacticalNotes[0]}
                </div>
              </div>
            )}
          </div>

          {/* 5. Starfleet Action Buttons (Pinned to Bottom of Panel) */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800 shrink-0">
            {/* Know More Main Button */}
            <button
              onClick={onOpenDetails}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/50 rounded-lg text-[10px] font-trek uppercase font-bold tracking-wider transition-all hover:border-sky-400 shadow-sm"
              title="Open detailed astrometric dossier & characteristics"
            >
              <Info className="w-3.5 h-3.5 text-sky-300" />
              <span>Know More</span>
            </button>

            {/* Quick Plot / Warp / Undock Button */}
            {isDocked && onDock ? (
              <button
                onClick={() => onDock(objectInfo.id)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-trek uppercase font-bold border border-emerald-500/50 bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 transition-colors flex items-center gap-1.5 shadow-sm"
                title="Undock from station [X]"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Undock</span>
              </button>
            ) : onPlotCourse ? (
              <button
                onClick={() => onPlotCourse(objectInfo.id)}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-trek uppercase font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                title="Plot astrogation course and engage warp"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Warp</span>
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
