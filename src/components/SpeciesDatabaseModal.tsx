import React, { useState, useEffect, useMemo } from 'react';
import { StarTrekSpecies, SpeciesCategory, GalacticQuadrant } from '../types/species';
import { STAR_TREK_SPECIES, SPECIES_CATEGORIES } from '../data/speciesDatabase';
import { LCARSSpeciesPortrait } from './LCARSSpeciesPortrait';
import { soundEffects } from '../audio/soundEffects';
import { computerVoice } from '../audio/computerVoice';
import {
  X,
  Search,
  Dna,
  Globe,
  Shield,
  Zap,
  Users,
  Compass,
  Volume2,
  BookOpen,
  History,
  Crown,
  ChevronRight,
  Navigation,
  ArrowUpDown,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';

interface SpeciesDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlotCourseToSystem?: (systemId: string) => void;
  currentSystemId?: string;
}

type TabSection = 'overview' | 'culture' | 'history' | 'tech' | 'government' | 'individuals' | 'diplomacy';

export const SpeciesDatabaseModal: React.FC<SpeciesDatabaseModalProps> = ({
  isOpen,
  onClose,
  onPlotCourseToSystem,
  currentSystemId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SpeciesCategory>('all');
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'quadrant' | 'affiliation'>('popularity');
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(STAR_TREK_SPECIES[0].id);
  const [activeTab, setActiveTab] = useState<TabSection>('overview');
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'detail'>('list');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        soundEffects.playLcarsBeep(650, 0.06);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Selected species object
  const selectedSpecies = useMemo(() => {
    return STAR_TREK_SPECIES.find((s) => s.id === selectedSpeciesId) || STAR_TREK_SPECIES[0];
  }, [selectedSpeciesId]);

  // Filtered and sorted species list
  const filteredSpecies = useMemo(() => {
    let result = STAR_TREK_SPECIES.filter((species) => {
      // Category filter
      if (selectedCategory !== 'all' && species.category !== selectedCategory) {
        return false;
      }

      // Quadrant filter
      if (selectedQuadrant !== 'all' && species.quadrant !== selectedQuadrant) {
        return false;
      }

      // Search query filter (matches name, nativeName, homeworld, traits, tags, notable individuals)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = species.name.toLowerCase().includes(q);
        const matchesNative = species.nativeName?.toLowerCase().includes(q);
        const matchesHomeworld = species.homeworld.name.toLowerCase().includes(q) || species.homeworld.systemName.toLowerCase().includes(q);
        const matchesAffiliation = species.affiliation.toLowerCase().includes(q);
        const matchesTags = species.tags.some((t) => t.toLowerCase().includes(q));
        const matchesIndividuals = species.notableIndividuals.some((i) => i.name.toLowerCase().includes(q));
        const matchesBiology = species.physicalCharacteristics.distinctiveFeatures.some((f) => f.toLowerCase().includes(q));

        if (!matchesName && !matchesNative && !matchesHomeworld && !matchesAffiliation && !matchesTags && !matchesIndividuals && !matchesBiology) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'popularity') {
        return a.popularityRank - b.popularityRank;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'quadrant') {
        return a.quadrant.localeCompare(b.quadrant);
      }
      if (sortBy === 'affiliation') {
        return a.affiliation.localeCompare(b.affiliation);
      }
      return 0;
    });

    return result;
  }, [searchQuery, selectedCategory, selectedQuadrant, sortBy]);

  if (!isOpen) return null;

  // Speak species briefing through Ship Computer Voice
  const handlePlayVoice = (species: StarTrekSpecies) => {
    soundEffects.playLcarsBeep(980, 0.08);
    const text =
      species.voiceBriefing?.audioText ||
      `Species record: ${species.name}. Homeworld: ${species.homeworld.name}. Affiliation: ${species.affiliation}.`;
    
    // Play sound effect and trigger vocal cue
    soundEffects.playLcarsBeep(1200, 0.05);
    computerVoice.testVoice();
  };

  // Check if homeworld can be plotted in current simulation
  const hasPlotCourse = Boolean(
    selectedSpecies.homeworld.systemId && onPlotCourseToSystem
  );

  const handlePlotCourse = () => {
    if (selectedSpecies.homeworld.systemId && onPlotCourseToSystem) {
      soundEffects.playWarpEngage();
      onPlotCourseToSystem(selectedSpecies.homeworld.systemId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none overflow-hidden">
      {/* Main LCARS Modal Container */}
      <div className="relative w-full max-w-7xl h-[98dvh] sm:h-[95dvh] max-h-[98dvh] bg-slate-950 rounded-xl sm:rounded-2xl border-2 border-amber-500/50 shadow-2xl shadow-amber-950/50 flex flex-col overflow-hidden text-slate-100 font-sans">
        
        {/* ========================================================= */}
        {/* TOP LCARS HEADER BANNER */}
        {/* ========================================================= */}
        <div className="flex items-stretch bg-slate-900 border-b border-amber-500/40 shrink-0">
          {/* LCARS Elbow Graphic */}
          <div className="w-16 sm:w-28 bg-amber-500 rounded-br-2xl flex items-center justify-center p-2 shrink-0">
            <span className="text-xs sm:text-sm font-trek uppercase font-bold text-slate-950 tracking-wider">
              LCARS 8412
            </span>
          </div>

          {/* Header Title Section */}
          <div className="flex-1 flex items-center justify-between px-3 sm:px-6 py-2.5">
            <div className="flex items-center gap-3">
              <Dna className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-trek uppercase font-bold text-amber-400 tracking-wider">
                    Starfleet Exobiology & Civilization Database
                  </h2>
                  <span className="hidden md:inline px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono-nums text-amber-300">
                    ALPHA · BETA · GAMMA · DELTA QUADRANTS
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono-nums flex items-center gap-2">
                  <span>RECORD ARCHIVE: STARFLEET COMMAND</span>
                  <span>·</span>
                  <span>{STAR_TREK_SPECIES.length} CIVILIZATIONS CATALOGUED</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                soundEffects.playLcarsBeep(650, 0.05);
                onClose();
              }}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800 hover:bg-red-950/80 hover:text-red-300 text-slate-300 transition-colors border border-slate-700 hover:border-red-500/50 cursor-pointer"
              title="Close Database [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TOOLBAR: SEARCH, CATEGORIES & FILTERS */}
        {/* ========================================================= */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search species, homeworld, traits, figures..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-950/90 border border-amber-500/30 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quadrant & Sorting Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Quadrant Filter */}
            <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
              <Compass className="w-3.5 h-3.5 text-sky-400 ml-1" />
              <select
                value={selectedQuadrant}
                onChange={(e) => {
                  soundEffects.playLcarsBeep(880, 0.04);
                  setSelectedQuadrant(e.target.value);
                }}
                className="bg-transparent text-slate-300 font-mono text-[11px] pr-2 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-200">All Quadrants</option>
                <option value="Alpha Quadrant" className="bg-slate-900 text-slate-200">Alpha Quadrant</option>
                <option value="Beta Quadrant" className="bg-slate-900 text-slate-200">Beta Quadrant</option>
                <option value="Gamma Quadrant" className="bg-slate-900 text-slate-200">Gamma Quadrant</option>
                <option value="Delta Quadrant" className="bg-slate-900 text-slate-200">Delta Quadrant</option>
                <option value="Non-Spatial / Extra-dimensional" className="bg-slate-900 text-slate-200">Non-Spatial</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 ml-1" />
              <select
                value={sortBy}
                onChange={(e) => {
                  soundEffects.playLcarsBeep(880, 0.04);
                  setSortBy(e.target.value as any);
                }}
                className="bg-transparent text-slate-300 font-mono text-[11px] pr-2 focus:outline-none cursor-pointer"
              >
                <option value="popularity" className="bg-slate-900 text-slate-200">Sort: Popularity (Default)</option>
                <option value="name" className="bg-slate-900 text-slate-200">Sort: Alphabetical (A-Z)</option>
                <option value="quadrant" className="bg-slate-900 text-slate-200">Sort: Quadrant</option>
                <option value="affiliation" className="bg-slate-900 text-slate-200">Sort: Affiliation</option>
              </select>
            </div>

            <span className="text-[10px] text-slate-400 font-mono-nums shrink-0 px-1">
              Found: <strong className="text-amber-400">{filteredSpecies.length}</strong>
            </span>
          </div>
        </div>

        {/* Category Pills Strip */}
        <div className="bg-slate-950 border-b border-slate-800/80 px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          {SPECIES_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundEffects.playLcarsBeep(820, 0.04);
                  setSelectedCategory(cat.id);
                }}
                className={`px-3 py-1 rounded-md text-xs font-trek uppercase font-medium whitespace-nowrap transition-colors border cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Mobile / Tablet LCARS View Switcher */}
        <div className="flex lg:hidden bg-slate-900 border-b border-slate-800 p-1.5 shrink-0 gap-1.5">
          <button
            onClick={() => {
              soundEffects.playLcarsBeep(800, 0.03);
              setMobileActiveView('list');
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-trek uppercase font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              mobileActiveView === 'list'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
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
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-trek uppercase font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              mobileActiveView === 'detail'
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Dna className="w-3.5 h-3.5" />
            <span className="truncate">Dossier: {selectedSpecies.name.split(' (')[0]}</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* MAIN BODY: 2-COLUMN LCARS LAYOUT (EXPLORER LIST + DOSSIER) */}
        {/* ========================================================= */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          
          {/* --------------------------------------------------------- */}
          {/* LEFT COLUMN: SPECIES CARD GRID / LIST */}
          {/* --------------------------------------------------------- */}
          <div className={`w-full lg:w-80 xl:w-[380px] bg-slate-950 border-r border-slate-800 flex-col shrink-0 min-h-0 overflow-hidden ${
            mobileActiveView === 'list' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* List Header */}
            <div className="p-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
              <span className="font-trek uppercase tracking-wide text-slate-300">
                Species Index ({filteredSpecies.length})
              </span>
              <span>Sorted by Popularity</span>
            </div>

            {/* Scrollable Species Card Items */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-2.5 space-y-2">
              {filteredSpecies.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  No alien species matching "{searchQuery}". Try adjusting your filters.
                </div>
              ) : (
                filteredSpecies.map((species) => {
                  const isSelected = species.id === selectedSpeciesId;
                  return (
                    <div
                      key={species.id}
                      onClick={() => {
                        soundEffects.playLcarsBeep(isSelected ? 900 : 780, 0.04);
                        setSelectedSpeciesId(species.id);
                        setMobileActiveView('detail');
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 relative group ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/80 shadow-md shadow-amber-950/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      {/* Left Thumbnail */}
                      <div className="shrink-0">
                        <LCARSSpeciesPortrait species={species} size="sm" />
                      </div>

                      {/* Info Overview */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs sm:text-sm font-trek uppercase font-bold truncate ${
                            isSelected ? 'text-amber-400' : 'text-slate-100 group-hover:text-amber-300'
                          }`}>
                            {species.name}
                          </h4>
                          <span className="text-[10px] font-mono-nums text-slate-500 shrink-0">
                            #{species.popularityRank}
                          </span>
                        </div>

                        {species.nativeName && (
                          <div className="text-[10px] text-slate-400 italic truncate font-sans">
                            {species.nativeName}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5 truncate font-mono">
                          <Globe className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{species.homeworld.name}</span>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-trek uppercase font-semibold truncate ${
                            species.affiliation === 'United Federation of Planets'
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : species.affiliation === 'Klingon Empire'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : species.affiliation === 'Romulan Star Empire'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : species.affiliation === 'Borg Collective'
                              ? 'bg-green-950 text-green-300 border border-green-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {species.affiliation.split(' ')[0]}
                          </span>

                          <span className="px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800 text-[9px] font-mono truncate">
                            {species.quadrant.split(' ')[0]}
                          </span>
                        </div>
                      </div>

                      {/* Right Chevron */}
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-amber-400 translate-x-1' : 'text-slate-600 group-hover:text-slate-400'
                      }`} />

                      {/* Active Left Indicator Bar */}
                      {isSelected && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* RIGHT COLUMN: FULL DETAILED EXOBIOLOGY DOSSIER PANEL */}
          {/* --------------------------------------------------------- */}
          <div className={`flex-1 bg-slate-950 flex-col min-h-0 overflow-hidden ${
            mobileActiveView === 'detail' ? 'flex' : 'hidden lg:flex'
          }`}>
            
            {/* On small/medium screens: Quick Return Bar */}
            <div className="lg:hidden flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-slate-800 shrink-0">
              <button
                onClick={() => {
                  soundEffects.playLcarsBeep(700, 0.04);
                  setMobileActiveView('list');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-trek uppercase font-bold shadow transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                <span>← Back to Species List</span>
              </button>
              <span className="text-[11px] font-mono text-slate-300">
                Rank #{selectedSpecies.popularityRank} · {selectedSpecies.quadrant.split(' ')[0]}
              </span>
            </div>

            {/* Dossier Top Banner */}
            <div className="bg-slate-900/80 border-b border-slate-800 p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
              <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="shrink-0">
                  <LCARSSpeciesPortrait
                    species={selectedSpecies}
                    size="md"
                    onPlayVoiceBriefing={() => handlePlayVoice(selectedSpecies)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-xl font-trek uppercase font-bold text-amber-400 truncate">
                      {selectedSpecies.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] sm:text-xs font-mono font-bold border border-slate-700">
                      Rank #{selectedSpecies.popularityRank}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-trek uppercase font-semibold border border-amber-500/40">
                      {selectedSpecies.relationshipWithFederation.status}
                    </span>
                  </div>

                  {selectedSpecies.nativeName && (
                    <div className="text-xs text-slate-400 font-sans italic mt-0.5">
                      Native Designation: <span className="text-slate-200">{selectedSpecies.nativeName}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-300 font-mono flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-sky-400">
                      <Globe className="w-3.5 h-3.5" />
                      {selectedSpecies.homeworld.name} ({selectedSpecies.homeworld.systemName})
                    </span>
                    <span>·</span>
                    <span className="text-amber-300">{selectedSpecies.quadrant}</span>
                    <span>·</span>
                    <span className="text-slate-400">{selectedSpecies.affiliation}</span>
                  </div>

                  {/* Vocal briefing quote */}
                  {selectedSpecies.voiceBriefing && (
                    <div className="mt-2 text-xs text-slate-400 italic flex items-center gap-2 bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800 max-w-xl">
                      <Volume2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="truncate font-sans">
                        "{selectedSpecies.voiceBriefing.quote}" — {selectedSpecies.voiceBriefing.speaker}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: Plot Course & Audio Briefing */}
              <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0 justify-end">
                <button
                  onClick={() => handlePlayVoice(selectedSpecies)}
                  className="flex-1 md:flex-initial px-3 py-1.5 sm:py-2 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-600/50 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
                  title="Play Vocal Species Briefing via Ship's Computer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-trek uppercase tracking-wide">Audio Briefing</span>
                </button>

                {hasPlotCourse && (
                  <button
                    onClick={handlePlotCourse}
                    className="flex-1 md:flex-initial px-3.5 py-1.5 sm:py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border border-amber-300 flex items-center justify-center gap-1.5 text-xs shadow-md shadow-amber-500/30 transition-transform active:scale-95 cursor-pointer"
                    title={`Plot Warp Course to ${selectedSpecies.homeworld.systemName}`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-slate-950" />
                    <span className="font-trek uppercase tracking-wider">Plot Course</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dossier Navigation Tabs */}
            <div className="bg-slate-900 border-b border-slate-800 px-2 sm:px-4 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0 scrollbar-thin">
              {[
                { id: 'overview', label: 'Biology & Homeworld', icon: Dna },
                { id: 'culture', label: 'Culture & Philosophy', icon: BookOpen },
                { id: 'history', label: 'History & Epochs', icon: History },
                { id: 'tech', label: 'Technology & Fleet', icon: Zap },
                { id: 'government', label: 'Government', icon: Crown },
                { id: 'individuals', label: 'Notable Individuals', icon: Users },
                { id: 'diplomacy', label: 'Federation Relations', icon: Shield },
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
                        ? 'border-amber-400 text-amber-400 bg-slate-950/40'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Dossier Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 md:p-6 space-y-5">
              
              {/* TAB 1: OVERVIEW & BIOLOGY */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Physical Characteristics Grid */}
                  <div>
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider mb-3 flex items-center gap-1.5">
                      <Dna className="w-4 h-4" /> Physical Characteristics & Anatomy
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Average Height</span>
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {selectedSpecies.physicalCharacteristics.averageHeight}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Natural Lifespan</span>
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {selectedSpecies.physicalCharacteristics.lifespan}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Blood Chemistry</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {selectedSpecies.physicalCharacteristics.bloodChemistry}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Physical Strength</span>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {selectedSpecies.physicalCharacteristics.physicalStrength}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 sm:col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Sensory Acuity</span>
                        <span className="text-xs font-mono font-medium text-slate-200">
                          {selectedSpecies.physicalCharacteristics.sensoryTraits || 'Standard humanoid range'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Distinctive Morphological Features */}
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                    <span className="text-xs font-trek uppercase font-bold text-sky-400 block mb-2">
                      Morphological & Anatomical Features
                    </span>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                      {selectedSpecies.physicalCharacteristics.distinctiveFeatures.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">·</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Biological Profile Narrative */}
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider">
                      Exobiological Analysis
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {selectedSpecies.biology}
                    </p>
                    <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-sky-500/30 text-xs text-sky-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-sky-200 block font-trek uppercase">Unique Physiological Trait:</strong>
                        <span>{selectedSpecies.physicalCharacteristics.uniqueBiology}</span>
                      </div>
                    </div>
                  </div>

                  {/* Homeworld Details Card */}
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Globe className="w-4 h-4" /> Homeworld Planetary Profile
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Planet Name</span>
                        <span className="text-xs font-mono font-bold text-slate-100">{selectedSpecies.homeworld.name}</span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Stellar System</span>
                        <span className="text-xs font-mono font-bold text-sky-400">{selectedSpecies.homeworld.systemName}</span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                        <span className="text-[10px] text-slate-500 uppercase font-mono block">Planetary Class</span>
                        <span className="text-xs font-mono font-bold text-amber-300">{selectedSpecies.homeworld.classification}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-300">
                      <strong className="text-slate-400 block font-mono text-[10px] uppercase">Climate & Environment:</strong>
                      <p className="mt-0.5">{selectedSpecies.homeworld.climate}</p>
                    </div>
                    <div className="text-xs text-slate-300">
                      <strong className="text-slate-400 block font-mono text-[10px] uppercase">Astrometric Summary:</strong>
                      <p className="mt-0.5">{selectedSpecies.homeworld.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CULTURE & PHILOSOPHY */}
              {activeTab === 'culture' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Cultural Traditions & Social Hierarchy
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {selectedSpecies.culture}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-2">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-300 tracking-wider">
                      Guiding Philosophy & Core Tenets
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-100 font-sans leading-relaxed">
                      {selectedSpecies.philosophy}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-trek uppercase font-bold text-sky-400 tracking-wider">
                      Linguistic Cadence & Dialects
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 font-mono">
                      {selectedSpecies.language}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: HISTORY & CHRONICLES */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4" /> Major Historical Epochs & Milestones
                  </h4>
                  <div className="space-y-3">
                    {selectedSpecies.history.map((epoch, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                          {epoch}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: TECHNOLOGY & STARSHIPS */}
              {activeTab === 'tech' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Technological Capabilities & Propulsion
                    </h4>
                    <p className="text-xs text-sky-300 font-mono">
                      {selectedSpecies.technologicalCapabilities.techLevelSummary}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Warp Speed Status</span>
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {selectedSpecies.technologicalCapabilities.warpDriveStatus}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Propulsion Mechanics</span>
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {selectedSpecies.technologicalCapabilities.propulsion}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Tactical Armaments</span>
                        <span className="text-xs font-mono font-bold text-red-400">
                          {selectedSpecies.technologicalCapabilities.weaponry}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Defensive Shielding</span>
                        <span className="text-xs font-mono font-bold text-sky-400">
                          {selectedSpecies.technologicalCapabilities.defense}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-xs font-trek uppercase font-bold text-sky-400 block mb-2">
                      Signature Innovations & Technologies
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {selectedSpecies.technologicalCapabilities.signatureTech.map((tech, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{tech}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 5: GOVERNMENT & POLITICS */}
              {activeTab === 'government' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Crown className="w-4 h-4" /> State Entity & Governance
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Official State Title</span>
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {selectedSpecies.government.name}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Governmental Structure</span>
                        <span className="text-xs font-mono font-bold text-slate-100">
                          {selectedSpecies.government.structure}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Ruling Authority</span>
                        <span className="text-xs font-mono font-bold text-amber-300">
                          {selectedSpecies.government.rulingBody}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Seat of Power</span>
                        <span className="text-xs font-mono font-bold text-sky-300">
                          {selectedSpecies.government.seatOfPower}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: NOTABLE INDIVIDUALS */}
              {activeTab === 'individuals' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Legendary Historical & Contemporary Figures
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {selectedSpecies.notableIndividuals.map((person, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-trek uppercase font-bold text-amber-400">
                            {person.name}
                          </h5>
                          <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 shrink-0">
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

              {/* TAB 7: FEDERATION RELATIONS */}
              {activeTab === 'diplomacy' && (
                <div className="space-y-5">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-trek uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> Relationship with the United Federation of Planets
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400">Diplomatic Status:</span>
                      <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-trek uppercase font-bold">
                        {selectedSpecies.relationshipWithFederation.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {selectedSpecies.relationshipWithFederation.summary}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-xs font-trek uppercase font-bold text-sky-400 block mb-2">
                      Historic Treaties & Accords
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
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
            <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span>LCARS ARCHIVE RECORD #{selectedSpecies.id.toUpperCase()}-1701</span>
                <span>·</span>
                <span>SECURITY CLEARANCE: STARFLEET GENERAL ORDER 1</span>
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

      </div>
    </div>
  );
};
