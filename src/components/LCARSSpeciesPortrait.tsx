import React, { useState } from 'react';
import { StarTrekSpecies } from '../types/species';
import { Shield, Sparkles, Volume2, Eye, Dna, Compass } from 'lucide-react';
import { soundEffects } from '../audio/soundEffects';

interface LCARSSpeciesPortraitProps {
  species: StarTrekSpecies;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTelemetry?: boolean;
  onPlayVoiceBriefing?: () => void;
}

export const LCARSSpeciesPortrait: React.FC<LCARSSpeciesPortraitProps> = ({
  species,
  size = 'md',
  showTelemetry = false,
  onPlayVoiceBriefing,
}) => {
  const [imgError, setImgError] = useState(false);
  const [viewMode, setViewMode] = useState<'photo' | 'biometric'>('photo');
  const [activeImgSrc, setActiveImgSrc] = useState(species.images.primary);

  // Handle image fallback reset on species change
  React.useEffect(() => {
    setImgError(false);
    setActiveImgSrc(species.images.primary);
  }, [species.id, species.images.primary]);

  const handleImgError = () => {
    if (activeImgSrc === species.images.primary && species.images.fallback) {
      setActiveImgSrc(species.images.fallback);
    } else {
      setImgError(true);
    }
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28 sm:w-36 sm:h-36',
    lg: 'w-44 h-44 sm:w-56 sm:h-56',
    xl: 'w-56 h-56 sm:w-72 sm:h-72',
  }[size];

  // Specific color accents per species affiliation
  const getThemeColor = () => {
    switch (species.affiliation) {
      case 'United Federation of Planets':
        return { primary: '#38bdf8', secondary: '#0284c7', text: 'text-sky-400', border: 'border-sky-500/50' };
      case 'Klingon Empire':
        return { primary: '#ef4444', secondary: '#991b1b', text: 'text-red-400', border: 'border-red-500/50' };
      case 'Romulan Star Empire':
        return { primary: '#10b981', secondary: '#047857', text: 'text-emerald-400', border: 'border-emerald-500/50' };
      case 'Borg Collective':
        return { primary: '#22c55e', secondary: '#15803d', text: 'text-green-400', border: 'border-green-500/50' };
      case 'Dominion':
        return { primary: '#a855f7', secondary: '#7e22ce', text: 'text-purple-400', border: 'border-purple-500/50' };
      case 'Cardassian Union':
        return { primary: '#f59e0b', secondary: '#b45309', text: 'text-amber-400', border: 'border-amber-500/50' };
      case 'Ferengi Alliance':
        return { primary: '#fbbf24', secondary: '#d97706', text: 'text-yellow-400', border: 'border-yellow-500/50' };
      case 'Gorn Hegemony':
        return { primary: '#84cc16', secondary: '#4d7c0f', text: 'text-lime-400', border: 'border-lime-500/50' };
      case 'Tholian Assembly':
        return { primary: '#f97316', secondary: '#c2410c', text: 'text-orange-400', border: 'border-orange-500/50' };
      default:
        return { primary: '#38bdf8', secondary: '#0284c7', text: 'text-sky-400', border: 'border-sky-500/50' };
    }
  };

  const theme = getThemeColor();

  // Procedural SVG Biometric Wireframe for each species
  const renderBiometricVector = () => {
    const id = species.id;
    return (
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full bg-slate-950 p-2"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.25" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
          </radialGradient>
          <pattern id={`grid-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke={theme.primary} strokeWidth="0.5" strokeOpacity="0.15" />
          </pattern>
        </defs>

        {/* Background Grid & Radar Sweep */}
        <rect width="200" height="200" fill={`url(#glow-${id})`} />
        <rect width="200" height="200" fill={`url(#grid-${id})`} />
        <circle cx="100" cy="100" r="90" fill="none" stroke={theme.primary} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="60" fill="none" stroke={theme.primary} strokeWidth="0.75" strokeOpacity="0.2" />
        <circle cx="100" cy="100" r="30" fill="none" stroke={theme.primary} strokeWidth="0.75" strokeOpacity="0.2" />

        {/* Target Reticle Crosshairs */}
        <line x1="100" y1="5" x2="100" y2="25" stroke={theme.primary} strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="100" y1="175" x2="100" y2="195" stroke={theme.primary} strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="5" y1="100" x2="25" y2="100" stroke={theme.primary} strokeWidth="1.5" strokeOpacity="0.6" />
        <line x1="175" y1="100" x2="195" y2="100" stroke={theme.primary} strokeWidth="1.5" strokeOpacity="0.6" />

        {/* SPECIES SPECIFIC ANATOMICAL WIREFRAME */}
        {id === 'klingon' && (
          <g transform="translate(100, 100)">
            {/* Klingon Cranial Ridges & Head */}
            <path d="M -30,-45 C -25,-65 25,-65 30,-45 C 40,-25 35,25 25,45 C 10,55 -10,55 -25,45 C -35,25 -40,-25 -30,-45 Z" fill="#450a0a" stroke="#ef4444" strokeWidth="2" />
            {/* Sagittal Bone Crests */}
            <path d="M 0,-62 L 0,-25 M -12,-58 C -8,-45 -8,-35 -12,-25 M 12,-58 C 8,-45 8,-35 12,-25" fill="none" stroke="#fca5a5" strokeWidth="2.5" />
            <path d="M -22,-50 C -15,-40 -15,-30 -20,-20 M 22,-50 C 15,-40 15,-30 20,-20" fill="none" stroke="#fca5a5" strokeWidth="2" />
            {/* Fierce brow & eyes */}
            <path d="M -18,-15 L -5,-10 M 18,-15 L 5,-10" stroke="#f87171" strokeWidth="2.5" />
            <circle cx="-10" cy="-6" r="2.5" fill="#f87171" />
            <circle cx="10" cy="-6" r="2.5" fill="#f87171" />
            {/* Mustache/Beard line */}
            <path d="M -15,18 C -5,28 5,28 15,18 L 8,40 L -8,40 Z" fill="#262626" stroke="#ef4444" strokeWidth="1" />
            {/* Klingon Empire Trilateral Emblem Accent */}
            <polygon points="0,-72 -18,-86 0,-92 18,-86" fill="#ef4444" />
          </g>
        )}

        {id === 'vulcan' && (
          <g transform="translate(100, 100)">
            {/* Vulcan Head & Arched Pointed Ears */}
            <path d="M -28,-40 C -25,-60 25,-60 28,-40 C 35,-15 30,25 20,45 C 5,55 -5,55 -20,45 C -30,25 -35,-15 -28,-40 Z" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="2" />
            {/* Arched Pointed Vulcan Ears */}
            <polygon points="-28,-30 -52,-48 -32,-15" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
            <polygon points="28,-30 52,-48 32,-15" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
            {/* Swept Vulcan Eyebrows */}
            <path d="M -22,-22 Q -12,-28 -4,-18 M 22,-22 Q 12,-28 4,-18" stroke="#bae6fd" strokeWidth="2.5" fill="none" />
            <circle cx="-12" cy="-10" r="2.5" fill="#38bdf8" />
            <circle cx="12" cy="-10" r="2.5" fill="#38bdf8" />
            {/* Serene mouth */}
            <line x1="-8" y1="22" x2="8" y2="22" stroke="#bae6fd" strokeWidth="1.5" />
            {/* IDIC Emblem Accent */}
            <circle cx="0" cy="-78" r="8" fill="none" stroke="#f59e0b" strokeWidth="2" />
            <polygon points="0,-86 -8,-70 8,-70" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
          </g>
        )}

        {id === 'romulan' && (
          <g transform="translate(100, 100)">
            {/* Romulan Head & V-crest */}
            <path d="M -28,-40 C -25,-60 25,-60 28,-40 C 35,-15 30,25 20,45 C 5,55 -5,55 -20,45 C -30,25 -35,-15 -28,-40 Z" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
            {/* Pointed Ears */}
            <polygon points="-28,-28 -50,-44 -30,-12" fill="#047857" stroke="#10b981" strokeWidth="2" />
            <polygon points="28,-28 50,-44 30,-12" fill="#047857" stroke="#10b981" strokeWidth="2" />
            {/* V-shaped Romulan Forehead Crest */}
            <path d="M -16,-38 L 0,-24 L 16,-38" fill="none" stroke="#6ee7b7" strokeWidth="2.5" />
            {/* Angular bangs */}
            <path d="M -22,-45 L 0,-38 L 22,-45" stroke="#10b981" strokeWidth="2" fill="none" />
            {/* Stern eyes */}
            <path d="M -20,-18 L -6,-15 M 20,-18 L 6,-15" stroke="#6ee7b7" strokeWidth="2" />
            <circle cx="-12" cy="-8" r="2.5" fill="#34d399" />
            <circle cx="12" cy="-8" r="2.5" fill="#34d399" />
            {/* Romulan Bird of Prey Emblem */}
            <polygon points="0,-82 -18,-72 0,-68 18,-72" fill="#10b981" />
          </g>
        )}

        {id === 'borg' && (
          <g transform="translate(100, 100)">
            {/* Pale Assimilated Drone Head */}
            <path d="M -28,-45 C -25,-65 25,-65 28,-45 C 35,-20 32,25 22,45 C 10,55 -10,55 -22,45 C -32,25 -35,-20 -28,-45 Z" fill="#1e293b" stroke="#22c55e" strokeWidth="2" />
            {/* Cybernetic Ocular Implants on Left Eye */}
            <circle cx="-12" cy="-10" r="7" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
            <circle cx="-12" cy="-10" r="3" fill="#ef4444" />
            <line x1="-12" y1="-10" x2="-35" y2="-10" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
            {/* Normal eye on right */}
            <circle cx="12" cy="-10" r="2" fill="#94a3b8" />
            {/* Cranial Cybernetic Band & Conduits */}
            <path d="M -25,-35 C 0,-42 15,-40 28,-30" fill="none" stroke="#22c55e" strokeWidth="3" />
            <path d="M -20,10 L -30,30 M -15,18 L -22,40" stroke="#4ade80" strokeWidth="1.5" />
            {/* Borg Green Laser Grid Sweep */}
            <line x1="-80" y1="10" x2="80" y2="10" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.4" />
            {/* Borg Geometric Cube Outline Accent */}
            <rect x="-14" y="-84" width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="1.5" transform="rotate(45 0 -70)" />
          </g>
        )}

        {id === 'gorn' && (
          <g transform="translate(100, 100)">
            {/* Gorn Scaled Reptilian Skull */}
            <path d="M -32,-35 C -25,-70 25,-70 32,-35 C 42,-5 35,35 25,50 C 0,65 -0,65 -25,50 C -35,35 -42,-5 -32,-35 Z" fill="#14532d" stroke="#84cc16" strokeWidth="2" />
            {/* Multi-faceted Compound Diamond Eyes */}
            <polygon points="-24,-18 -12,-26 -12,-10 -24,-2" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            <polygon points="24,-18 12,-26 12,-10 24,-2" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
            {/* Scaled Nostrils & Tooth-lined Jaw */}
            <ellipse cx="-5" cy="18" rx="2" ry="4" fill="#052e16" />
            <ellipse cx="5" cy="18" rx="2" ry="4" fill="#052e16" />
            <path d="M -18,32 L -14,26 L -10,32 L -6,26 L -2,32 L 2,26 L 6,32 L 10,26 L 14,32 L 18,26" fill="none" stroke="#fef08a" strokeWidth="1.5" />
            {/* Dorsal Head Scales */}
            <circle cx="0" cy="-50" r="3" fill="#84cc16" />
            <circle cx="0" cy="-40" r="4" fill="#84cc16" />
            <circle cx="0" cy="-30" r="5" fill="#84cc16" />
          </g>
        )}

        {id === 'ferengi' && (
          <g transform="translate(100, 100)">
            {/* Compact Head */}
            <ellipse cx="0" cy="5" rx="22" ry="32" fill="#78350f" stroke="#fbbf24" strokeWidth="2" />
            {/* Enormous Auditory Lobes (Ears) */}
            <path d="M -20,-15 C -60,-25 -65,25 -22,25 Z" fill="#92400e" stroke="#fbbf24" strokeWidth="2" />
            <path d="M 20,-15 C 60,-25 65,25 22,25 Z" fill="#92400e" stroke="#fbbf24" strokeWidth="2" />
            {/* Lobe creases */}
            <path d="M -30,-5 C -45,0 -45,15 -25,18" fill="none" stroke="#fcd34d" strokeWidth="1.5" />
            <path d="M 30,-5 C 45,0 45,15 25,18" fill="none" stroke="#fcd34d" strokeWidth="1.5" />
            {/* Wrinkled Brow & Sharp Teeth */}
            <path d="M -15,-12 Q 0,-20 15,-12" stroke="#fcd34d" strokeWidth="2" fill="none" />
            <circle cx="-8" cy="-2" r="2.5" fill="#fbbf24" />
            <circle cx="8" cy="-2" r="2.5" fill="#fbbf24" />
            <path d="M -12,22 L 12,22" stroke="#fcd34d" strokeWidth="2" />
            {/* Latinum Slip Glyph Accent */}
            <circle cx="0" cy="-75" r="10" fill="#f59e0b" />
            <rect x="-3" y="-81" width="6" height="12" fill="#78350f" />
          </g>
        )}

        {id === 'andorian' && (
          <g transform="translate(100, 100)">
            {/* Azure Blue Head */}
            <path d="M -26,-40 C -22,-60 22,-60 26,-40 C 32,-15 28,25 20,45 C 5,55 -5,55 -20,45 C -28,25 -32,-15 -26,-40 Z" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
            {/* Paired Articulating Antennae */}
            <path d="M -12,-52 Q -25,-85 -45,-85 Q -32,-70 -16,-48" fill="#3b82f6" stroke="#93c5fd" strokeWidth="2" />
            <path d="M 12,-52 Q 25,-85 45,-85 Q 32,-70 16,-48" fill="#3b82f6" stroke="#93c5fd" strokeWidth="2" />
            {/* Shock White Hair */}
            <path d="M -24,-45 C -15,-60 15,-60 24,-45 C 10,-52 -10,-52 -24,-45 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
            {/* Piercing Eyes */}
            <circle cx="-10" cy="-10" r="2.5" fill="#93c5fd" />
            <circle cx="10" cy="-10" r="2.5" fill="#93c5fd" />
            <line x1="-8" y1="20" x2="8" y2="20" stroke="#93c5fd" strokeWidth="1.5" />
          </g>
        )}

        {id === 'cardassian' && (
          <g transform="translate(100, 100)">
            {/* Cardassian Head */}
            <path d="M -28,-40 C -25,-60 25,-60 28,-40 C 35,-15 30,25 20,45 C 5,55 -5,55 -20,45 C -30,25 -35,-15 -28,-40 Z" fill="#334155" stroke="#f59e0b" strokeWidth="2" />
            {/* Spoon-Shaped Forehead Depression */}
            <ellipse cx="0" cy="-32" rx="7" ry="11" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            {/* Lateral Neck Flanges / Ridges */}
            <path d="M -28,5 C -45,20 -40,45 -22,48" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
            <path d="M 28,5 C 45,20 40,45 22,48" fill="none" stroke="#cbd5e1" strokeWidth="2.5" />
            {/* Eyes & stern mouth */}
            <circle cx="-10" cy="-8" r="2" fill="#fbbf24" />
            <circle cx="10" cy="-8" r="2" fill="#fbbf24" />
            <line x1="-8" y1="22" x2="8" y2="22" stroke="#cbd5e1" strokeWidth="2" />
          </g>
        )}

        {/* DEFAULT / OTHER SPECIES ANATOMICAL OUTLINE */}
        {!['klingon', 'vulcan', 'romulan', 'borg', 'gorn', 'ferengi', 'andorian', 'cardassian'].includes(id) && (
          <g transform="translate(100, 100)">
            {/* General Humanoid / Exobiological Silhouette */}
            <path d="M -26,-40 C -22,-60 22,-60 26,-40 C 32,-15 28,25 20,45 C 5,55 -5,55 -20,45 C -28,25 -32,-15 -26,-40 Z" fill="#0f172a" stroke={theme.primary} strokeWidth="2" />
            <circle cx="-10" cy="-10" r="3" fill={theme.primary} />
            <circle cx="10" cy="-10" r="3" fill={theme.primary} />
            <line x1="-8" y1="20" x2="8" y2="20" stroke={theme.primary} strokeWidth="1.5" />
            {/* Pulse Biometric Wave */}
            <path d="M -40,75 L -15,75 L -8,65 L 0,85 L 8,68 L 15,75 L 40,75" fill="none" stroke={theme.primary} strokeWidth="1.5" />
          </g>
        )}

        {/* Biometric Watermark Data */}
        <text x="10" y="25" fill={theme.primary} fontSize="8" fontFamily="monospace" opacity="0.8">
          BIO-SCAN: {species.id.toUpperCase()}
        </text>
        <text x="10" y="36" fill="#94a3b8" fontSize="7" fontFamily="monospace">
          {species.physicalCharacteristics.bloodChemistry.split(' (')[0]}
        </text>
        <text x="190" y="25" textAnchor="end" fill={theme.primary} fontSize="8" fontFamily="monospace" opacity="0.8">
          STARDATE 7412.4
        </text>
        <text x="190" y="185" textAnchor="end" fill="#94a3b8" fontSize="7" fontFamily="monospace">
          {species.homeworld.name}
        </text>
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* Visual Frame */}
      <div
        className={`relative ${sizeClasses} rounded-xl overflow-hidden bg-slate-950 border-2 ${theme.border} shadow-xl flex items-center justify-center group`}
      >
        {/* Toggle between Photograph and Biometric Scan if image is available */}
        {activeImgSrc && !imgError && viewMode === 'photo' ? (
          <>
            <img
              src={activeImgSrc}
              alt={species.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
              onError={handleImgError}
            />
            {/* CRT Scanline & LCARS Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 pointer-events-none" />
            <div className="absolute top-1.5 left-1.5 px-1 py-0.5 rounded bg-slate-950/80 border border-sky-500/30 text-[9px] font-mono-nums text-sky-400">
              OPTICAL
            </div>
          </>
        ) : (
          renderBiometricVector()
        )}

        {/* Controls Overlay on hover/focus */}
        <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/80 p-0.5 rounded border border-slate-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              soundEffects.playLcarsBeep(750, 0.05);
              setViewMode((prev) => (prev === 'photo' ? 'biometric' : 'photo'));
            }}
            className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
            title={viewMode === 'photo' ? 'Switch to Biometric Wireframe Scan' : 'Switch to Photographic Dossier'}
          >
            {viewMode === 'photo' ? <Dna className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          {onPlayVoiceBriefing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundEffects.playLcarsBeep(980, 0.06);
                onPlayVoiceBriefing();
              }}
              className="p-1 text-slate-300 hover:text-sky-400 transition-colors"
              title="Vocal Computer Dossier Briefing"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Affiliation Badge on Bottom Right */}
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[9px] font-trek uppercase font-bold text-slate-300">
          #{species.popularityRank}
        </div>
      </div>

      {/* Telemetry quick bar if requested */}
      {showTelemetry && (
        <div className="mt-2 w-full text-center">
          <div className="text-xs font-trek uppercase font-bold text-amber-400 truncate">
            {species.name}
          </div>
          <div className="text-[10px] text-slate-400 font-mono-nums truncate">
            {species.homeworld.name} · {species.quadrant.split(' ')[0]}
          </div>
        </div>
      )}
    </div>
  );
};
