import React, { useState, useEffect, useMemo } from 'react';
import { StarTrekSpecies, SpeciesCategory, SpeciesGalleryImage } from '../types/species';
import { STAR_TREK_SPECIES, SPECIES_CATEGORIES } from '../data/speciesDatabase';
import { LCARSSpeciesPortrait } from './LCARSSpeciesPortrait';
import { soundEffects } from '../audio/soundEffects';
import {
  X,
  Search,
  Dna,
  Globe,
  Shield,
  Zap,
  Users,
  Compass,
  BookOpen,
  History,
  Crown,
  ChevronRight,
  ChevronLeft,
  Navigation,
  ArrowUpDown,
  CheckCircle,
  Sparkles,
  Camera,
  Maximize2,
  Quote,
  Activity,
} from 'lucide-react';

interface SpeciesDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlotCourseToSystem?: (systemId: string) => void;
  currentSystemId?: string;
}

type TabSection = 'overview' | 'gallery' | 'culture' | 'history' | 'tech' | 'government' | 'individuals' | 'diplomacy';

export const SpeciesDatabaseModal: React.FC<SpeciesDatabaseModalProps> = ({
  isOpen,
  onClose,
  onPlotCourseToSystem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SpeciesCategory>('all');
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'quadrant' | 'affiliation'>('popularity');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(STAR_TREK_SPECIES[0].id);
  const [activeTab, setActiveTab] = useState<TabSection>('overview');
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'detail'>('list');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

  // Selected species object
  const selectedSpecies = useMemo(() => {
    return STAR_TREK_SPECIES.find((s) => s.id === selectedSpeciesId) || STAR_TREK_SPECIES[0];
  }, [selectedSpeciesId]);

  // Build normalized gallery list for the active species
  const speciesGallery: SpeciesGalleryImage[] = useMemo(() => {
    if (selectedSpecies.images.gallery && selectedSpecies.images.gallery.length > 0) {
      return selectedSpecies.images.gallery;
    }
    const items: SpeciesGalleryImage[] = [];
    if (selectedSpecies.images.primary) {
      items.push({
        url: selectedSpecies.images.primary,
        title: `${selectedSpecies.name} — Primary Visual Record`,
        caption: selectedSpecies.images.caption,
        tag: 'PRIMARY',
      });
    }
    if (
      selectedSpecies.images.bannerOrScene &&
      selectedSpecies.images.bannerOrScene !== selectedSpecies.images.primary
    ) {
      items.push({
        url: selectedSpecies.images.bannerOrScene,
        title: `${selectedSpecies.homeworld.name} & Civilization Context`,
        caption: `Archival reconnaissance imagery of ${selectedSpecies.name} civilization and ${selectedSpecies.homeworld.name}.`,
        tag: 'ARCHIVE',
      });
    }
    if (
      selectedSpecies.images.fallback &&
      selectedSpecies.images.fallback !== selectedSpecies.images.primary &&
      selectedSpecies.images.fallback !== selectedSpecies.images.bannerOrScene
    ) {
      items.push({
        url: selectedSpecies.images.fallback,
        title: `${selectedSpecies.name} — Supplemental Record`,
        caption: `Secondary exobiological visual reference for ${selectedSpecies.name}.`,
        tag: 'SUPPLEMENTAL',
      });
    }
    return items;
  }, [selectedSpecies]);

  // Reset gallery index when switching species
  useEffect(() => {
    setActiveImageIndex(0);
    setLightboxOpen(false);
  }, [selectedSpeciesId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        soundEffects.playLcarsBeep(650, 0.06);
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else {
          onClose();
        }
      } else if (lightboxOpen && speciesGallery.length > 1) {
        if (e.key === 'ArrowRight') {
          setActiveImageIndex((prev) => (prev + 1) % speciesGallery.length);
        } else if (e.key === 'ArrowLeft') {
          setActiveImageIndex((prev) => (prev - 1 + speciesGallery.length) % speciesGallery.length);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, lightboxOpen, speciesGallery.length]);

  // Filtered and sorted species list
  const filteredSpecies = useMemo(() => {
    const result = STAR_TREK_SPECIES.filter((species) => {
      if (selectedCategory !== 'all' && species.category !== selectedCategory) {
        return false;
      }
      if (selectedQuadrant !== 'all' && species.quadrant !== selectedQuadrant) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = species.name.toLowerCase().includes(q);
        const matchesNative = species.nativeName?.toLowerCase().includes(q);
        const matchesHomeworld =
          species.homeworld.name.toLowerCase().includes(q) ||
          species.homeworld.systemName.toLowerCase().includes(q);
        const matchesAffiliation = species.affiliation.toLowerCase().includes(q);
        const matchesTags = species.tags.some((t) => t.toLowerCase().includes(q));
        const matchesIndividuals = species.notableIndividuals.some((i) => i.name.toLowerCase().includes(q));
        const matchesBiology = species.physicalCharacteristics.distinctiveFeatures.some((f) =>
          f.toLowerCase().includes(q)
        );

        if (
          !matchesName &&
          !matchesNative &&
          !matchesHomeworld &&
          !matchesAffiliation &&
          !matchesTags &&
          !matchesIndividuals &&
          !matchesBiology
        ) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'popularity') return a.popularityRank - b.popularityRank;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'quadrant') return a.quadrant.localeCompare(b.quadrant);
      if (sortBy === 'affiliation') return a.affiliation.localeCompare(b.affiliation);
      return 0;
    });

    return result;
  }, [searchQuery, selectedCategory, selectedQuadrant, sortBy]);

  if (!isOpen) return null;

  // Dynamic accent theme based on species affiliation
  const getAffiliationTheme = (affiliation: string) => {
    switch (affiliation) {
      case 'United Federation of Planets':
        return {
          accentText: 'text-sky-400',
          accentBorder: 'border-sky-500/40',
          accentBg: 'bg-sky-500/10',
          barColor: 'bg-sky-400',
          statusColor: 'text-sky-300',
        };
      case 'Klingon Empire':
        return {
          accentText: 'text-red-400',
          accentBorder: 'border-red-500/40',
          accentBg: 'bg-red-500/10',
          barColor: 'bg-red-500',
          statusColor: 'text-red-300',
        };
      case 'Romulan Star Empire':
        return {
          accentText: 'text-emerald-400',
          accentBorder: 'border-emerald-500/40',
          accentBg: 'bg-emerald-500/10',
          barColor: 'bg-emerald-500',
          statusColor: 'text-emerald-300',
        };
      case 'Borg Collective':
        return {
          accentText: 'text-green-400',
          accentBorder: 'border-green-500/40',
          accentBg: 'bg-green-500/10',
          barColor: 'bg-green-500',
          statusColor: 'text-green-300',
        };
      default:
        return {
          accentText: 'text-amber-400',
          accentBorder: 'border-amber-500/40',
          accentBg: 'bg-amber-500/10',
          barColor: 'bg-amber-400',
          statusColor: 'text-amber-300',
        };
    }
  };

  const activeTheme = getAffiliationTheme(selectedSpecies.affiliation);
  const currentGalleryItem = speciesGallery[activeImageIndex] || speciesGallery[0];

  const hasPlotCourse = Boolean(selectedSpecies.homeworld.systemId && onPlotCourseToSystem);

  const handlePlotCourse = () => {
    if (selectedSpecies.homeworld.systemId && onPlotCourseToSystem) {
      soundEffects.playWarpEngage();
      onPlotCourseToSystem(selectedSpecies.homeworld.systemId);
      onClose();
    }
  };

  const handleNextImage = () => {
    if (speciesGallery.length <= 1) return;
    soundEffects.playLcarsBeep(840, 0.04);
    setActiveImageIndex((prev) => (prev + 1) % speciesGallery.length);
  };

  const handlePrevImage = () => {
    if (speciesGallery.length <= 1) return;
    soundEffects.playLcarsBeep(760, 0.04);
    setActiveImageIndex((prev) => (prev - 1 + speciesGallery.length) % speciesGallery.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none overflow-hidden">
      {/* Main LCARS Exobiology Console Container */}
      <div className="relative w-full max-w-[1440px] h-[98dvh] sm:h-[96dvh] bg-[#07090E] rounded-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* ========================================================= */}
        {/* TOP TELEMETRY & COMMAND RIBBON */}
        {/* ========================================================= */}
        <div className="flex items-stretch bg-slate-900/95 border-b border-slate-800 shrink-0">
          {/* LCARS Archival Index Block */}
          <div className="w-20 sm:w-32 bg-amber-500 flex flex-col justify-center px-3 py-2 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-950/80 font-bold leading-none">
              ARCHIVE
            </span>
            <span className="text-xs sm:text-sm font-trek uppercase font-bold text-slate-950 tracking-wider mt-0.5">
              EXO-8412
            </span>
          </div>

          {/* Header Title & Calibration Telemetry */}
          <div className="flex-1 flex items-center justify-between px-3 sm:px-5 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <Dna className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm sm:text-base font-trek uppercase font-bold text-slate-100 tracking-wider truncate">
                    Starfleet Exobiology & Civilization Database
                  </h2>
                  <span className="hidden xl:inline text-[11px] font-mono tabular-nums text-sky-400 border-l border-slate-700 pl-3">
                    QUADRANT TELEMETRY: ALPHA · BETA · GAMMA · DELTA
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums flex items-center gap-2">
                  <span>STARFLEET SCIENCE DIVISION</span>
                  <span>·</span>
                  <span>{STAR_TREK_SPECIES.length} SPECIES CATALOGUED</span>
                  <span>·</span>
                  <span className="text-emerald-400">● OPTICAL ARCHIVE ONLINE</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                soundEffects.playLcarsBeep(650, 0.05);
                onClose();
              }}
              className="px-2.5 py-1.5 rounded bg-slate-800/90 hover:bg-red-950/80 hover:text-red-300 text-slate-300 transition-colors border border-slate-700 hover:border-red-500/50 flex items-center gap-1.5 text-xs font-mono cursor-pointer shrink-0"
              title="Close Database [Esc]"
            >
              <span className="hidden sm:inline text-[11px] uppercase tracking-wider">ESC</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILTER & SEARCH CONTROL BAR */}
        {/* ========================================================= */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-3 py-2 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search species, homeworld, anatomy, figures..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Strip */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {SPECIES_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      soundEffects.playLcarsBeep(820, 0.04);
                      setSelectedCategory(cat.id);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-trek uppercase whitespace-nowrap transition-colors border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quadrant & Sort Controls */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 bg-slate-950 rounded px-2 py-1 border border-slate-800 text-xs">
              <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <select
                value={selectedQuadrant}
                onChange={(e) => {
                  soundEffects.playLcarsBeep(880, 0.04);
                  setSelectedQuadrant(e.target.value);
                }}
                className="bg-transparent text-slate-300 font-mono text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Quadrants</option>
                <option value="Alpha Quadrant" className="bg-slate-900 text-slate-200">Alpha Quadrant</option>
                <option value="Beta Quadrant" className="bg-slate-900 text-slate-200">Beta Quadrant</option>
                <option value="Gamma Quadrant" className="bg-slate-900 text-slate-200">Gamma Quadrant</option>
                <option value="Delta Quadrant" className="bg-slate-900 text-slate-200">Delta Quadrant</option>
                <option value="Non-Spatial / Extra-dimensional" className="bg-slate-900 text-slate-200">Non-Spatial</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 rounded px-2 py-1 border border-slate-800 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => {
                  soundEffects.playLcarsBeep(880, 0.04);
                  setSortBy(e.target.value as any);
                }}
                className="bg-transparent text-slate-300 font-mono text-[11px] focus:outline-none cursor-pointer"
              >
                <option value="popularity" className="bg-slate-900 text-slate-200">Sort: Priority Index</option>
                <option value="name" className="bg-slate-900 text-slate-200">Sort: Name (A-Z)</option>
                <option value="quadrant" className="bg-slate-900 text-slate-200">Sort: Quadrant</option>
                <option value="affiliation" className="bg-slate-900 text-slate-200">Sort: Affiliation</option>
              </select>
            </div>

            <div className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0 pl-1">
              RECORDS: <strong className="text-amber-400">{filteredSpecies.length}</strong>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet View Switcher */}
        <div className="flex lg:hidden bg-slate-900 border-b border-slate-800 p-1.5 shrink-0 gap-1.5">
          <button
            onClick={() => {
              soundEffects.playLcarsBeep(800, 0.03);
              setMobileActiveView('list');
            }}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-trek uppercase font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              mobileActiveView === 'list'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Species Index ({filteredSpecies.length})</span>
          </button>
          <button
            onClick={() => {
              soundEffects.playLcarsBeep(800, 0.03);
              setMobileActiveView('detail');
            }}
            className={`flex-1 py-1.5 px-3 rounded text-xs font-trek uppercase font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              mobileActiveView === 'detail'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span className="truncate">Dossier: {selectedSpecies.name.split(' (')[0]}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* MAIN WORKSPACE: ASYMMETRIC SPLIT CONSOLE */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          
          {/* --------------------------------------------------------- */}
          {/* LEFT COLUMN: SPECIES DIRECTORY LIST (340px) */}
          {/* --------------------------------------------------------- */}
          <div
            className={`w-full lg:w-[330px] xl:w-[360px] bg-[#07090E] border-r border-slate-800 flex-col shrink-0 min-h-0 overflow-hidden ${
              mobileActiveView === 'list' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
              <span className="uppercase tracking-wider text-slate-300 font-semibold">
                CIVILIZATION INDEX
              </span>
              <span className="tabular-nums">{filteredSpecies.length} ENTRIES</span>
            </div>

            {/* Scrollable Species List with visible scrollbar */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #0f172a' }}
            >
              {filteredSpecies.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  No civilization records match "{searchQuery}".
                </div>
              ) : (
                filteredSpecies.map((species) => {
                  const isSelected = species.id === selectedSpeciesId;
                  const photoCount = species.images.gallery?.length || 1;
                  return (
                    <div
                      key={species.id}
                      onClick={() => {
                        soundEffects.playLcarsBeep(isSelected ? 900 : 780, 0.04);
                        setSelectedSpeciesId(species.id);
                        setMobileActiveView('detail');
                      }}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-3 relative group ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500/70'
                          : 'bg-slate-900/35 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-amber-400 rounded-r" />
                      )}

                      {/* Left Thumbnail */}
                      <div className="shrink-0">
                        <LCARSSpeciesPortrait species={species} size="sm" />
                      </div>

                      {/* Metadata Summary */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4
                            className={`text-xs sm:text-sm font-trek uppercase font-bold truncate ${
                              isSelected ? 'text-amber-400' : 'text-slate-100 group-hover:text-amber-300'
                            }`}
                          >
                            {species.name}
                          </h4>
                          <span className="text-[10px] font-mono tabular-nums text-slate-500 shrink-0">
                            #{String(species.popularityRank).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5 truncate font-mono">
                          <Globe className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{species.homeworld.name}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1 text-[10px] font-mono text-slate-400">
                          <span className="truncate text-slate-400">
                            {species.affiliation}
                          </span>
                          {photoCount > 1 && (
                            <span className="shrink-0 flex items-center gap-1 text-sky-400 tabular-nums">
                              <Camera className="w-2.5 h-2.5" />
                              {photoCount}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* RIGHT COLUMN: EXOBIOLOGY DOSSIER & MULTI-IMAGE SHOWCASE */}
          {/* --------------------------------------------------------- */}
          <div
            className={`flex-1 bg-[#07090E] flex-col min-h-0 overflow-hidden ${
              mobileActiveView === 'detail' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Mobile Quick Return Bar */}
            <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
              <button
                onClick={() => {
                  soundEffects.playLcarsBeep(700, 0.04);
                  setMobileActiveView('list');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500 text-slate-950 text-xs font-trek uppercase font-bold cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Index</span>
              </button>
              <span className="text-[11px] font-mono tabular-nums text-slate-400">
                RECORD #{String(selectedSpecies.popularityRank).padStart(2, '0')} · {selectedSpecies.quadrant}
              </span>
            </div>

            {/* ======================================================= */}
            {/* DOSSIER HEADER & NAVIGATION TABS */}
            {/* ======================================================= */}
            <div className="bg-slate-900/70 border-b border-slate-800 px-4 sm:px-6 pt-3.5 pb-0 shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono tabular-nums text-amber-400 font-semibold">
                      FILE #{String(selectedSpecies.popularityRank).padStart(2, '0')}
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className={`text-xs font-mono uppercase tracking-wider ${activeTheme.accentText}`}>
                      {selectedSpecies.affiliation}
                    </span>
                    <span className="text-slate-700">|</span>
                    <span className="text-xs font-mono text-slate-400">
                      STATUS: <strong className="text-slate-200">{selectedSpecies.relationshipWithFederation.status.toUpperCase()}</strong>
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3 mt-1 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-trek uppercase font-bold text-slate-100 tracking-wide">
                      {selectedSpecies.name}
                    </h3>
                    {selectedSpecies.nativeName && (
                      <span className="text-xs font-mono text-slate-400">
                        [{selectedSpecies.nativeName}]
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-sky-400">
                      <Globe className="w-3.5 h-3.5" />
                      {selectedSpecies.homeworld.name} ({selectedSpecies.homeworld.systemName})
                    </span>
                    <span>·</span>
                    <span>{selectedSpecies.quadrant}</span>
                    <span>·</span>
                    <span>{selectedSpecies.homeworld.classification.split(' (')[0]}</span>
                  </div>
                </div>

                {/* Action Bar: Visual Gallery Count & Plot Course */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      soundEffects.playLcarsBeep(820, 0.04);
                      setActiveTab(activeTab === 'gallery' ? 'overview' : 'gallery');
                    }}
                    className={`px-3 py-1.5 rounded border text-xs font-trek uppercase font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'gallery'
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-slate-950 text-sky-300 border-sky-500/40 hover:bg-sky-950/60'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Optical Archive ({speciesGallery.length})</span>
                  </button>

                  {hasPlotCourse && (
                    <button
                      onClick={handlePlotCourse}
                      className="px-3.5 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border border-amber-300 flex items-center gap-1.5 text-xs transition-transform active:scale-95 cursor-pointer"
                      title={`Plot Warp Course to ${selectedSpecies.homeworld.systemName}`}
                    >
                      <Navigation className="w-3.5 h-3.5 text-slate-950" />
                      <span className="font-trek uppercase tracking-wider">Plot Course</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none border-t border-slate-800/80 pt-1">
                {[
                  { id: 'overview', label: 'Dossier & Visuals', icon: Dna },
                  { id: 'gallery', label: `Photo Archive (${speciesGallery.length})`, icon: Camera },
                  { id: 'culture', label: 'Culture & Ethos', icon: BookOpen },
                  { id: 'history', label: 'Historical Timeline', icon: History },
                  { id: 'tech', label: 'Technology & Fleet', icon: Zap },
                  { id: 'government', label: 'Governance', icon: Crown },
                  { id: 'individuals', label: 'Notable Figures', icon: Users },
                  { id: 'diplomacy', label: 'Diplomatic Relations', icon: Shield },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        soundEffects.playLcarsBeep(780, 0.03);
                        setActiveTab(tab.id as TabSection);
                      }}
                      className={`py-2 px-2.5 sm:px-3 border-b-2 text-[11px] sm:text-xs font-trek uppercase font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 text-amber-400 bg-slate-950/50'
                          : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ======================================================= */}
            {/* SCROLLABLE DOSSIER CONTENT AREA */}
            {/* ======================================================= */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#475569 #0f172a' }}
            >
              {/* ------------------------------------------------------- */}
              {/* TAB 1: OVERVIEW (HERO GALLERY + ANATOMY + HOMEWORLD) */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* TOP SPLIT: INTERACTIVE MULTI-PHOTO SHOWCASE + BIOMETRIC SUMMARY */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
                    
                    {/* Left 7 Cols: Interactive Optical Gallery Viewer */}
                    <div className="xl:col-span-7 bg-slate-900/50 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
                      {/* Optical Viewer Header Bar */}
                      <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center gap-2 text-sky-400">
                          <Camera className="w-3.5 h-3.5" />
                          <span className="uppercase tracking-wider font-semibold">
                            OPTICAL RECORD {String(activeImageIndex + 1).padStart(2, '0')} / {String(speciesGallery.length).padStart(2, '0')}
                          </span>
                          {currentGalleryItem?.tag && (
                            <span className="text-slate-400 border-l border-slate-700 pl-2">
                              {currentGalleryItem.tag}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            soundEffects.playLcarsBeep(860, 0.04);
                            setLightboxOpen(true);
                          }}
                          className="text-slate-300 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Inspect Full-Resolution Photograph"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="uppercase text-[10px]">Expand</span>
                        </button>
                      </div>

                      {/* Main Image Viewport */}
                      <div className="relative h-64 sm:h-80 bg-slate-950 flex items-center justify-center overflow-hidden group">
                        {currentGalleryItem ? (
                          <img
                            key={currentGalleryItem.url}
                            src={currentGalleryItem.url}
                            alt={currentGalleryItem.title}
                            referrerPolicy="no-referrer"
                            onClick={() => setLightboxOpen(true)}
                            className="w-full h-full object-contain bg-slate-950 cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <LCARSSpeciesPortrait species={selectedSpecies} size="lg" />
                        )}

                        {/* Subtle Corner Reticles */}
                        <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-sky-400/50 pointer-events-none" />
                        <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-sky-400/50 pointer-events-none" />
                        <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-sky-400/50 pointer-events-none" />
                        <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-sky-400/50 pointer-events-none" />

                        {/* Prev / Next Navigation Buttons when multiple images exist */}
                        {speciesGallery.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevImage}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded bg-slate-950/85 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 transition-colors cursor-pointer"
                              title="Previous Image"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleNextImage}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded bg-slate-950/85 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 transition-colors cursor-pointer"
                              title="Next Image"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Active Image Caption & Filmstrip Thumbnails */}
                      <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 space-y-3">
                        <div>
                          <div className="text-xs font-trek uppercase font-bold text-amber-400">
                            {currentGalleryItem?.title || selectedSpecies.name}
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                            {currentGalleryItem?.caption || selectedSpecies.images.caption}
                          </p>
                        </div>

                        {/* Multi-Image Thumbnail Strip */}
                        {speciesGallery.length > 1 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                            {speciesGallery.map((img, idx) => {
                              const isCurrent = idx === activeImageIndex;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    soundEffects.playLcarsBeep(800 + idx * 30, 0.03);
                                    setActiveImageIndex(idx);
                                  }}
                                  className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded overflow-hidden border transition-all shrink-0 cursor-pointer ${
                                    isCurrent
                                      ? 'border-amber-400 ring-1 ring-amber-400/60 opacity-100'
                                      : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                                  }`}
                                  title={img.title}
                                >
                                  <img
                                    src={img.url}
                                    alt={img.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover object-top"
                                  />
                                  <span className="absolute bottom-0 right-0 px-1 bg-slate-950/90 text-[9px] font-mono tabular-nums text-slate-300">
                                    {idx + 1}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right 5 Cols: Biometric Scan & Key Physiological Telemetry */}
                    <div className="xl:col-span-5 flex flex-col justify-between bg-slate-900/40 border border-slate-800 rounded-lg p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 block">
                            BIOMETRIC & PHYSIOLOGICAL TELEMETRY
                          </span>
                          <h4 className="text-sm font-trek uppercase font-bold text-slate-100 mt-0.5">
                            Anatomical Parameters
                          </h4>
                        </div>
                        <LCARSSpeciesPortrait
                          species={selectedSpecies}
                          size="sm"
                          customImageSrc={currentGalleryItem?.url}
                        />
                      </div>

                      {/* Key Biometric Readouts */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800/90">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Average Stature
                          </span>
                          <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-100 mt-0.5 block">
                            {selectedSpecies.physicalCharacteristics.averageHeight}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800/90">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Mean Lifespan
                          </span>
                          <span className="text-xs sm:text-sm font-mono tabular-nums font-bold text-slate-100 mt-0.5 block">
                            {selectedSpecies.physicalCharacteristics.lifespan}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800/90 col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Hematology / Blood Chemistry
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                            {selectedSpecies.physicalCharacteristics.bloodChemistry}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800/90 col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Musculoskeletal Output
                          </span>
                          <span className="text-xs font-mono font-semibold text-amber-300 mt-0.5 block">
                            {selectedSpecies.physicalCharacteristics.physicalStrength}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800/90 col-span-2">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Sensory Spectrum
                          </span>
                          <span className="text-xs font-mono text-slate-300 mt-0.5 block">
                            {selectedSpecies.physicalCharacteristics.sensoryTraits || 'Standard humanoid baseline'}
                          </span>
                        </div>
                      </div>

                      {/* Archival Quote Citation (replaces old Audio Briefing) */}
                      {selectedSpecies.voiceBriefing && (
                        <div className="p-3 bg-slate-950 border-l-2 border-amber-400 rounded-r text-xs space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                            <Quote className="w-3 h-3" />
                            <span>Archival Historical Citation</span>
                          </div>
                          <p className="text-slate-200 italic font-sans leading-relaxed">
                            "{selectedSpecies.voiceBriefing.quote}"
                          </p>
                          <div className="text-[11px] font-mono text-slate-400">
                            — {selectedSpecies.voiceBriefing.speaker}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MORPHOLOGICAL FEATURES & EXOBIOLOGICAL NARRATIVE */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-5 p-4 bg-slate-900/40 rounded-lg border border-slate-800 space-y-3">
                      <h4 className="text-xs font-trek uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4" /> Distinctive Morphological Markers
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {selectedSpecies.physicalCharacteristics.distinctiveFeatures.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="text-amber-400 font-mono font-bold">0{i + 1}</span>
                            <span className="leading-relaxed">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="lg:col-span-7 p-4 bg-slate-900/40 rounded-lg border border-slate-800 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                          <Dna className="w-4 h-4" /> Exobiological & Evolutionary Analysis
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                          {selectedSpecies.biology}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950 rounded border border-sky-500/30 text-xs text-sky-200 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 block">
                            Specialized Physiological Adaptation
                          </span>
                          <span className="text-slate-200 mt-0.5 block leading-relaxed">
                            {selectedSpecies.physicalCharacteristics.uniqueBiology}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HOMEWORLD ASTROMETRIC PROFILE */}
                  <div className="p-4 bg-slate-900/40 rounded-lg border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                        <Globe className="w-4 h-4" /> Homeworld Planetary Telemetry
                      </h4>
                      {selectedSpecies.homeworld.coordinates && (
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                          {selectedSpecies.homeworld.coordinates}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Primary World</span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-slate-100 mt-0.5 block">
                          {selectedSpecies.homeworld.name}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Stellar System</span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-sky-400 mt-0.5 block">
                          {selectedSpecies.homeworld.systemName}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Planetary Class</span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 mt-0.5 block">
                          {selectedSpecies.homeworld.classification}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs text-slate-300">
                      <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                        <span className="text-slate-400 block font-mono text-[10px] uppercase">
                          Biosphere & Climate
                        </span>
                        <p className="mt-1 leading-relaxed">{selectedSpecies.homeworld.climate}</p>
                      </div>
                      <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                        <span className="text-slate-400 block font-mono text-[10px] uppercase">
                          Planetary Overview
                        </span>
                        <p className="mt-1 leading-relaxed">{selectedSpecies.homeworld.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB 2: DEDICATED MULTI-IMAGE PHOTO ARCHIVE GRID */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'gallery' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-2">
                        <Camera className="w-4 h-4" /> Starfleet Optical Reconnaissance Archive — {selectedSpecies.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        Click any visual record below to inspect in high-resolution full-frame view.
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-sky-400">
                      {speciesGallery.length} RECORDS AVAILABLE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {speciesGallery.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          soundEffects.playLcarsBeep(860, 0.04);
                          setActiveImageIndex(idx);
                          setLightboxOpen(true);
                        }}
                        className="bg-slate-900/60 border border-slate-800 hover:border-amber-500/60 rounded-lg overflow-hidden flex flex-col cursor-pointer group transition-all"
                      >
                        <div className="relative h-52 bg-slate-950 overflow-hidden">
                          <img
                            src={img.url}
                            alt={img.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/90 border border-slate-700 text-[10px] font-mono tabular-nums text-sky-400">
                            REC #{String(idx + 1).padStart(2, '0')} {img.tag ? `· ${img.tag}` : ''}
                          </div>
                          <div className="absolute bottom-2 right-2 p-1.5 rounded bg-slate-950/85 border border-slate-700 text-slate-300 group-hover:text-amber-400">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-1.5">
                          <h5 className="text-xs sm:text-sm font-trek uppercase font-bold text-amber-400 group-hover:text-amber-300">
                            {img.title}
                          </h5>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {img.caption}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB 3: CULTURE & PHILOSOPHY */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'culture' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Cultural Traditions & Social Structure
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {selectedSpecies.culture}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/50 border-l-2 border-amber-400 rounded-r-lg border-y border-r border-slate-800 space-y-2">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-300 tracking-wider">
                      Guiding Philosophy & Core Ethos
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed">
                      {selectedSpecies.philosophy}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-2">
                    <h4 className="text-xs font-trek uppercase font-bold text-sky-400 tracking-wider">
                      Xenolinguistic Cadence & Dialects
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 font-mono">
                      {selectedSpecies.language}
                    </p>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB 4: HISTORY & CHRONICLES */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4" /> Major Historical Epochs & Milestones
                  </h4>
                  <div className="space-y-3">
                    {selectedSpecies.history.map((epoch, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-900/50 rounded-lg border border-slate-800 flex items-start gap-3.5 hover:border-slate-700 transition-colors"
                      >
                        <div className="px-2 py-1 bg-slate-950 border border-amber-500/40 text-amber-400 text-xs font-mono tabular-nums font-bold shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                          {epoch}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB 5: TECHNOLOGY & STARSHIPS */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'tech' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-3">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Technological Assessment & Fleet Capabilities
                    </h4>
                    <p className="text-xs text-sky-300 font-mono">
                      {selectedSpecies.technologicalCapabilities.techLevelSummary}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Warp Propulsion</span>
                        <span className="text-xs font-mono font-bold text-slate-100 mt-0.5 block">
                          {selectedSpecies.technologicalCapabilities.warpDriveStatus}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Reactor Architecture</span>
                        <span className="text-xs font-mono font-bold text-slate-100 mt-0.5 block">
                          {selectedSpecies.technologicalCapabilities.propulsion}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Primary Armaments</span>
                        <span className="text-xs font-mono font-bold text-red-400 mt-0.5 block">
                          {selectedSpecies.technologicalCapabilities.weaponry}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Defensive Systems</span>
                        <span className="text-xs font-mono font-bold text-sky-400 mt-0.5 block">
                          {selectedSpecies.technologicalCapabilities.defense}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                    <span className="text-xs font-trek uppercase font-bold text-sky-400 block mb-2.5">
                      Signature Scientific & Tactical Innovations
                    </span>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-200">
                      {selectedSpecies.technologicalCapabilities.signatureTech.map((tech, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 bg-slate-950/60 rounded border border-slate-800/80">
                          <span className="text-amber-400 font-mono font-bold">·</span>
                          <span>{tech}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB 6: GOVERNMENT & POLITICS */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'government' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-3">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Crown className="w-4 h-4" /> Sovereign State & Political Structure
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Official State Entity</span>
                        <span className="text-xs font-mono font-bold text-slate-100 mt-0.5 block">
                          {selectedSpecies.government.name}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Constitutional Form</span>
                        <span className="text-xs font-mono font-bold text-slate-100 mt-0.5 block">
                          {selectedSpecies.government.structure}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Executive / Ruling Body</span>
                        <span className="text-xs font-mono font-bold text-amber-300 mt-0.5 block">
                          {selectedSpecies.government.rulingBody}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Capital / Seat of Power</span>
                        <span className="text-xs font-mono font-bold text-sky-300 mt-0.5 block">
                          {selectedSpecies.government.seatOfPower}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB 7: NOTABLE INDIVIDUALS */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'individuals' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Prominent Historical & Contemporary Figures
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {selectedSpecies.notableIndividuals.map((person, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-trek uppercase font-bold text-amber-400">
                            {person.name}
                          </h5>
                          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 bg-slate-950 border border-slate-800 shrink-0">
                            {person.era.split(' (')[0]}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-sky-300 font-semibold">
                          {person.title}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {person.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------- */}
              {/* TAB 8: FEDERATION DIPLOMATIC RELATIONS */}
              {/* ------------------------------------------------------- */}
              {activeTab === 'diplomacy' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 space-y-3">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Diplomatic Standing with the United Federation of Planets
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-400">CURRENT STATUS:</span>
                      <span className="text-amber-300 font-bold uppercase">
                        ● {selectedSpecies.relationshipWithFederation.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {selectedSpecies.relationshipWithFederation.summary}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                    <span className="text-xs font-trek uppercase font-bold text-sky-400 block mb-2.5">
                      Ratified Interstellar Treaties & Accords
                    </span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {selectedSpecies.relationshipWithFederation.treaties.map((treaty, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono">{treaty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Telemetry */}
            <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span>ARCHIVE RECORD #{selectedSpecies.id.toUpperCase()}-1701</span>
                <span>·</span>
                <span>CLEARANCE: STARFLEET EXOBIOLOGY DIRECTIVE</span>
              </div>
              <button
                onClick={() => {
                  soundEffects.playLcarsBeep(650, 0.05);
                  onClose();
                }}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-xs font-trek uppercase cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FULL-FRAME OPTICAL ARCHIVE LIGHTBOX OVERLAY */}
        {/* ========================================================= */}
        {lightboxOpen && currentGalleryItem && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
            onClick={() => setLightboxOpen(false)}
          >
            <div
              className="relative max-w-5xl w-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Header */}
              <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-amber-400 font-bold uppercase">
                    {selectedSpecies.name}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-sky-400 tabular-nums">
                    IMAGE {String(activeImageIndex + 1).padStart(2, '0')} OF {String(speciesGallery.length).padStart(2, '0')}
                  </span>
                </div>
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="p-1 rounded bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lightbox Image Stage */}
              <div className="relative h-[60dvh] sm:h-[68dvh] bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={currentGalleryItem.url}
                  alt={currentGalleryItem.title}
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />

                {speciesGallery.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-slate-900/90 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-slate-900/90 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Lightbox Caption & Thumbnails */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-trek uppercase font-bold text-amber-400">
                    {currentGalleryItem.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {currentGalleryItem.caption}
                  </p>
                </div>

                {speciesGallery.length > 1 && (
                  <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
                    {speciesGallery.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-12 h-9 rounded overflow-hidden border cursor-pointer transition-all ${
                          idx === activeImageIndex
                            ? 'border-amber-400 ring-1 ring-amber-400'
                            : 'border-slate-700 opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
