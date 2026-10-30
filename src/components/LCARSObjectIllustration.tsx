// Starfleet LCARS Astrometric Visualizer & Object Illustration Component
// High-fidelity procedural SVG & Canvas celestial renderings matching simulation characteristics

import React from 'react';
import { DetailedObjectInfo } from '../data/celestialObjectDatabase';

interface LCARSObjectIllustrationProps {
  objectInfo: DetailedObjectInfo;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showScanLines?: boolean;
}

export const LCARSObjectIllustration: React.FC<LCARSObjectIllustrationProps> = ({
  objectInfo,
  size = 'sm',
  className = '',
  showScanLines = true,
}) => {
  const pixelSize = size === 'sm' ? 52 : size === 'md' ? 88 : 170;
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  const { category, visual, characteristics } = objectInfo;
  const baseColor = visual.color || '#38bdf8';
  const atmosphereColor = visual.atmosphereColor || '#38bdf8';
  const hasRings = visual.hasRings;
  const ringColor = visual.ringColor || '#cbd5e1';

  return (
    <div
      className={`relative rounded-lg overflow-hidden flex items-center justify-center bg-slate-950 border border-slate-800 shrink-0 ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
    >
      {/* Deep Space Starfield Backdrop */}
      <div className="absolute inset-0 bg-radial from-slate-900 to-slate-950 pointer-events-none" />
      <div className="absolute w-1 h-1 bg-white/60 rounded-full top-2 left-3" />
      <div className="absolute w-0.5 h-0.5 bg-sky-200/50 rounded-full bottom-3 right-4" />
      <div className="absolute w-0.5 h-0.5 bg-amber-200/50 rounded-full top-5 right-2" />
      <div className="absolute w-1 h-1 bg-white/40 rounded-full bottom-2 left-6" />

      {/* SVG Celestial Body / Vessel Render */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full relative z-10 transition-transform duration-500"
      >
        <defs>
          {/* Atmospheric Limb Glow Filter */}
          <filter id={`glow-${objectInfo.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Planetary Radial Gradient Lighting (Sun from top-left) */}
          <radialGradient id={`planet-grad-${objectInfo.id}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="25%" stopColor={baseColor} stopOpacity="1" />
            <stop offset="70%" stopColor={baseColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#050a15" stopOpacity="0.95" />
          </radialGradient>

          {/* Star Solar Flare Radial Gradient */}
          <radialGradient id={`star-grad-${objectInfo.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#fef08a" />
            <stop offset="80%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
        </defs>

        {/* 1. STAR RENDERING */}
        {category === 'star' && (
          <g>
            {/* Corona Rays */}
            <circle cx="50" cy="50" r="38" fill={`url(#star-grad-${objectInfo.id})`} opacity="0.3" filter={`url(#glow-${objectInfo.id})`} />
            <circle cx="50" cy="50" r="32" fill="#f59e0b" opacity="0.4" className="animate-pulse" />
            {/* Solar Core */}
            <circle cx="50" cy="50" r="26" fill={`url(#star-grad-${objectInfo.id})`} />
            {/* Solar Flare Prominences */}
            <path d="M 50 18 Q 54 12 56 16 Q 52 22 50 18" fill="#fef08a" opacity="0.8" />
            <path d="M 76 52 Q 84 56 80 60 Q 74 58 76 52" fill="#f59e0b" opacity="0.8" />
            <path d="M 22 50 Q 14 46 16 42 Q 24 45 22 50" fill="#fef08a" opacity="0.8" />
          </g>
        )}

        {/* 1B. PHOTON TORPEDO ORDNANCE RENDERING */}
        {objectInfo.id.includes('torpedo') && (
          <g transform="rotate(-35 50 50)">
            {/* Fiery exhaust plume */}
            <path d="M 22 47 L 8 44 L 14 50 L 6 53 L 22 53 Z" fill="#ef4444" opacity="0.9" />
            <path d="M 22 48 L 12 47 L 16 50 L 10 52 L 22 52 Z" fill="#f59e0b" opacity="0.95" />
            <circle cx="22" cy="50" r="3" fill="#fef08a" filter={`url(#glow-${objectInfo.id})`} />
            {/* Red Booster Collar */}
            <rect x="22" y="44" width="14" height="12" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
            {/* Booster Segment Bands */}
            <line x1="26" y1="44" x2="26" y2="56" stroke="#7f1d1d" strokeWidth="1.5" />
            <line x1="31" y1="44" x2="31" y2="56" stroke="#7f1d1d" strokeWidth="1.5" />
            {/* Aerodynamic Silver Fuselage */}
            <path d="M 36 44 L 64 45 L 80 50 L 64 55 L 36 56 Z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.2" />
            {/* Nose Cone Tip */}
            <path d="M 72 48 L 86 50 L 72 52 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            {/* Stabilizer Fins */}
            <path d="M 50 44 L 56 36 Q 60 38 58 44 Z" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
            <path d="M 50 56 L 56 64 Q 60 62 58 56 Z" fill="#94a3b8" stroke="#475569" strokeWidth="0.8" />
            <path d="M 40 47 L 34 38 Q 40 40 44 47 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
            <path d="M 40 53 L 34 62 Q 40 60 44 53 Z" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
            {/* Panel Lines */}
            <line x1="48" y1="45" x2="48" y2="55" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="58" y1="46" x2="58" y2="54" stroke="#94a3b8" strokeWidth="0.8" />
          </g>
        )}

        {/* 2. STARBASE & SPACEDOCK RENDERING */}
        {category === 'starbase' && (
          <g>
            {/* Orbital Shield Ring */}
            <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
            {/* Spacedock Mushroom Citadel Dome */}
            <path
              d="M 28 42 C 28 26, 72 26, 72 42 C 72 47, 58 52, 58 56 L 56 74 L 44 74 L 42 56 C 42 52, 28 47, 28 42 Z"
              fill="#1e293b"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* Spacedock Internal Hangar Bay Space Doors */}
            <rect x="44" y="38" width="12" height="6" rx="1.5" fill="#0284c7" className="animate-pulse" opacity="0.8" />
            {/* Antennae Spire */}
            <line x1="50" y1="26" x2="50" y2="16" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="50" cy="15" r="2" fill="#38bdf8" className="animate-ping" />
            {/* Navigation Beacon Lights */}
            <circle cx="28" cy="42" r="1.5" fill="#ef4444" />
            <circle cx="72" cy="42" r="1.5" fill="#10b981" />
            <circle cx="50" cy="74" r="1.5" fill="#f59e0b" />
          </g>
        )}

        {/* 3. ENEMY COMBAT VESSEL RENDERING */}
        {category === 'enemy' && (
          <g>
            {/* Tactical Targeting Box */}
            <rect x="15" y="15" width="70" height="70" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="6,4" opacity="0.6" className="animate-pulse" />
            {/* Heavy Klingon / Romulan Cruiser Silhouette */}
            <path
              d="M 50 20 L 58 35 L 78 45 L 82 52 L 64 56 L 56 78 L 50 72 L 44 78 L 36 56 L 18 52 L 22 45 L 42 35 Z"
              fill="#1e293b"
              stroke={baseColor}
              strokeWidth="1.8"
            />
            {/* Bridge Command Module */}
            <circle cx="50" cy="24" r="3" fill={baseColor} />
            {/* Twin Disruptor Hardpoints */}
            <circle cx="20" cy="48" r="2" fill="#ef4444" className="animate-pulse" />
            <circle cx="80" cy="48" r="2" fill="#ef4444" className="animate-pulse" />
            {/* Warp Nacelle Glow Trails */}
            <line x1="36" y1="58" x2="36" y2="76" stroke="#ef4444" strokeWidth="2" opacity="0.8" />
            <line x1="64" y1="58" x2="64" y2="76" stroke="#ef4444" strokeWidth="2" opacity="0.8" />
          </g>
        )}

        {/* 4. TACTICAL ASTEROID RENDERING */}
        {category === 'asteroid' && (
          <g>
            {/* Irregular Carbonaceous Rock */}
            <path
              d="M 32 25 Q 52 18 68 28 Q 82 42 76 62 Q 68 82 48 78 Q 24 82 22 60 Q 18 40 32 25 Z"
              fill="#334155"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* Impact Craters */}
            <ellipse cx="42" cy="38" rx="6" ry="4" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
            <ellipse cx="62" cy="52" rx="7" ry="5" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
            <ellipse cx="38" cy="62" rx="4" ry="3" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
          </g>
        )}

        {/* 5. ANOMALY / NEBULA RENDERING */}
        {category === 'anomaly' && (
          <g>
            <circle cx="50" cy="50" r="36" fill={baseColor} opacity="0.25" filter={`url(#glow-${objectInfo.id})`} />
            <ellipse cx="48" cy="50" rx="32" ry="20" fill={atmosphereColor} opacity="0.35" transform="rotate(-25 50 50)" />
            <circle cx="50" cy="50" r="14" fill="#ffffff" opacity="0.7" className="animate-pulse" />
            <circle cx="42" cy="44" r="4" fill="#38bdf8" opacity="0.9" />
            <circle cx="58" cy="56" r="3" fill="#ec4899" opacity="0.8" />
          </g>
        )}

        {/* 6. PLANET RENDERING (Default for Terran, Desert, Gas Giant, etc.) */}
        {category === 'planet' && (
          <g>
            {/* Back of Planetary Rings (if has rings) */}
            {hasRings && (
              <ellipse
                cx="50"
                cy="50"
                rx="46"
                ry="13"
                fill="none"
                stroke={ringColor}
                strokeWidth="4"
                opacity="0.45"
                transform="rotate(-22 50 50)"
              />
            )}

            {/* Atmospheric Outer Glow */}
            <circle
              cx="50"
              cy="50"
              r="28.5"
              fill="none"
              stroke={atmosphereColor}
              strokeWidth="2"
              opacity="0.6"
              filter={`url(#glow-${objectInfo.id})`}
            />

            {/* Planet Sphere with 3D Lighting */}
            <circle cx="50" cy="50" r="27" fill={`url(#planet-grad-${objectInfo.id})`} />

            {/* Terran / Class M Continents Overlay */}
            {characteristics.classification.includes('Terran') && (
              <g opacity="0.75">
                <path d="M 38 34 Q 44 32 48 38 Q 44 48 36 44 Z" fill="#15803d" />
                <path d="M 50 42 Q 62 40 58 54 Q 48 56 50 42 Z" fill="#15803d" />
                <path d="M 34 50 Q 40 48 38 60 Q 32 58 34 50 Z" fill="#15803d" />
                {/* Cloud Whirler */}
                <path d="M 32 38 Q 46 36 60 40" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.4" />
                <path d="M 36 54 Q 52 50 64 56" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.45" />
              </g>
            )}

            {/* Gas Giant Atmospheric Bands */}
            {characteristics.classification.includes('Gas') && (
              <g opacity="0.35">
                <line x1="24" y1="42" x2="76" y2="42" stroke="#ffffff" strokeWidth="2" />
                <line x1="23" y1="50" x2="77" y2="50" stroke="#f59e0b" strokeWidth="3" />
                <line x1="25" y1="58" x2="75" y2="58" stroke="#ffffff" strokeWidth="2" />
                {/* Great Storm Spot */}
                <ellipse cx="60" cy="52" rx="4" ry="2.5" fill="#ef4444" opacity="0.8" />
              </g>
            )}

            {/* Lunar Craters for Natural Satellites & Moons */}
            {(characteristics.classification.includes('Moon') || characteristics.classification.includes('Satellite')) && (
              <g opacity="0.65">
                <circle cx="42" cy="40" r="3.5" fill="#1e293b" stroke="#475569" strokeWidth="0.6" />
                <circle cx="58" cy="46" r="4.5" fill="#1e293b" stroke="#475569" strokeWidth="0.6" />
                <circle cx="48" cy="58" r="3" fill="#1e293b" stroke="#475569" strokeWidth="0.6" />
                <circle cx="36" cy="54" r="2" fill="#1e293b" />
                <circle cx="62" cy="34" r="2.2" fill="#1e293b" />
              </g>
            )}

            {/* Front of Planetary Rings (overlapping front of planet) */}
            {hasRings && (
              <ellipse
                cx="50"
                cy="50"
                rx="46"
                ry="13"
                fill="none"
                stroke={ringColor}
                strokeWidth="4"
                strokeDasharray="75 75"
                strokeDashoffset="110"
                opacity="0.85"
                transform="rotate(-22 50 50)"
              />
            )}
          </g>
        )}

        {/* Tactical Crosshair Overlay for Large Mode */}
        {isLg && (
          <g opacity="0.4" stroke="#38bdf8" strokeWidth="0.8">
            <line x1="8" y1="50" x2="16" y2="50" />
            <line x1="84" y1="50" x2="92" y2="50" />
            <line x1="50" y1="8" x2="50" y2="16" />
            <line x1="50" y1="84" x2="50" y2="92" />
          </g>
        )}
      </svg>

      {/* Retro LCARS Holographic CRT Scanlines */}
      {showScanLines && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40 z-20" />
      )}

      {/* Category Mini Pill / Badge in Corner */}
      {!isSm && (
        <div className="absolute bottom-1 right-1.5 z-30 text-[9px] font-mono-nums font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-900/90 border border-slate-700 text-sky-300">
          {visual.badgeLabel}
        </div>
      )}
    </div>
  );
};
