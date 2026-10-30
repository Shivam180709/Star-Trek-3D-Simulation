/**
 * Star Trek Exobiology & Civilization Database Types
 * LCARS Interface Definitions
 */

export type SpeciesAffiliation =
  | 'United Federation of Planets'
  | 'Klingon Empire'
  | 'Romulan Star Empire'
  | 'Cardassian Union'
  | 'Borg Collective'
  | 'Dominion'
  | 'Ferengi Alliance'
  | 'Gorn Hegemony'
  | 'Tholian Assembly'
  | 'Breen Confederacy'
  | 'Independent / Non-Aligned'
  | 'Higher Cosmic Entity';

export type SpeciesCategory =
  | 'all'
  | 'federation'
  | 'alpha_beta_powers'
  | 'rival_hostile'
  | 'gamma_dominion'
  | 'delta_borg'
  | 'cosmic_unique';

export type GalacticQuadrant =
  | 'Alpha Quadrant'
  | 'Beta Quadrant'
  | 'Gamma Quadrant'
  | 'Delta Quadrant'
  | 'Non-Spatial / Extra-dimensional';

export interface NotableIndividual {
  name: string;
  title: string;
  era: string; // e.g. '23rd Century (TOS)', '24th Century (TNG/DS9)'
  summary: string;
  portraitUrl?: string;
}

export interface StarTrekSpecies {
  id: string;
  name: string;
  nativeName?: string;
  popularityRank: number; // 1 for most popular (Humans=1, Klingons=2, Vulcans=3...)
  category: SpeciesCategory;
  affiliation: SpeciesAffiliation;
  quadrant: GalacticQuadrant;
  
  // Homeworld Data
  homeworld: {
    name: string;
    systemName: string;
    systemId?: string; // Links to SolarSystem id in solarSystems.ts
    coordinates?: string;
    classification: string; // e.g. 'Class-M (Terrestrial)', 'Class-Y (Demon)'
    climate: string;
    description: string;
  };

  // Physical & Biological Profile
  physicalCharacteristics: {
    averageHeight: string;
    lifespan: string;
    bloodChemistry: string; // e.g. 'Iron-based (Hemoglobin)', 'Copper-based (Hemocyanin)'
    distinctiveFeatures: string[];
    physicalStrength: string;
    sensoryTraits?: string;
    uniqueBiology: string; // e.g. inner eyelids, redundant anatomy (Brak'lul), telepathy
  };
  biology: string; // Detailed anatomical/biological description

  // Culture & Ideology
  culture: string;
  philosophy: string; // Core philosophical tenets (IDIC, Honor, Rule of Acquisition, etc.)
  language: string;

  // History & Milestone Epochs
  history: string[]; // Chronological or major historical paragraphs

  // Technological Profile
  technologicalCapabilities: {
    warpDriveStatus: string;
    signatureTech: string[];
    weaponry: string;
    defense: string;
    propulsion: string;
    techLevelSummary: string;
  };

  // Government & Social Structure
  government: {
    name: string;
    structure: string;
    rulingBody: string;
    seatOfPower: string;
  };

  // Prominent Figures
  notableIndividuals: NotableIndividual[];

  // Federation Diplomatic Status
  relationshipWithFederation: {
    status:
      | 'Founding Member'
      | 'Full Member'
      | 'Allied Power'
      | 'Peace Treaty / Non-Aggression'
      | 'Cold War / Tense Truce'
      | 'Active Conflict / Hostile'
      | 'Existential Threat'
      | 'Neutral / Trade Partner';
    treaties: string[];
    summary: string;
  };

  // Imagery & Visuals
  images: {
    primary: string; // Representative portrait
    fallback?: string; // High-reliability backup portrait
    bannerOrScene?: string; // Homeworld / iconic shot
    emblem?: string;
    caption: string;
  };

  // Audio quote for LCARS voice synthesis
  voiceBriefing?: {
    quote: string;
    speaker: string;
    audioText: string;
  };

  tags: string[];
}
