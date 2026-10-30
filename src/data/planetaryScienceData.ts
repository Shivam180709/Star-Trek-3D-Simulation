// Starfleet Science Directorate & Planetary Astrochemistry Database
// Scientific spectroscopic data, atmospheric composition, Earth Similarity Index (ESI),
// and geophysical metrics for school exhibition science showcase.

export interface AtmosphericGas {
  name: string;
  chemicalFormula: string;
  percentage: number;
  color: string;
  scientificRole: string;
}

export interface PlanetaryScienceData {
  id: string;
  name: string;
  systemName: string;
  classification: string;
  spectralClass: string;
  earthSimilarityIndex: number;
  habitabilityStatus: 'Optimal' | 'Marginal' | 'Hostile' | 'Non-Habitable';
  surfaceGravityG: number;
  surfaceGravityMs2: number;
  meanSurfaceTempC: number;
  meanSurfaceTempK: number;
  surfacePressureAtm: number;
  magneticFieldGauss: number;
  radiationLevelRadHr: number;
  hasLiquidWater: boolean;
  biosignaturesDetected: boolean;
  atmosphereGases: AtmosphericGas[];
  geophysicalSummary: string;
  scienceHighlights: string[];
}

export const KNOWN_PLANETARY_SCIENCE_DB: Record<string, Partial<PlanetaryScienceData>> = {
  sol_earth: {
    name: 'Earth (Sector 001)',
    systemName: 'Sol System',
    classification: 'Class M (Terrestrial)',
    spectralClass: 'G2V Primary Orbit',
    earthSimilarityIndex: 1.0,
    habitabilityStatus: 'Optimal',
    surfaceGravityG: 1.0,
    surfaceGravityMs2: 9.81,
    meanSurfaceTempC: 15,
    meanSurfaceTempK: 288.15,
    surfacePressureAtm: 1.0,
    magneticFieldGauss: 0.52,
    radiationLevelRadHr: 0.02,
    hasLiquidWater: true,
    biosignaturesDetected: true,
    atmosphereGases: [
      { name: 'Nitrogen', chemicalFormula: 'N₂', percentage: 78.08, color: '#38bdf8', scientificRole: 'Atmospheric buffer & biological precursor' },
      { name: 'Oxygen', chemicalFormula: 'O₂', percentage: 20.95, color: '#22c55e', scientificRole: 'Active aerobic cellular respiration driver' },
      { name: 'Argon', chemicalFormula: 'Ar', percentage: 0.93, color: '#94a3b8', scientificRole: 'Noble inert gas from radioactive decay' },
      { name: 'Carbon Dioxide', chemicalFormula: 'CO₂', percentage: 0.04, color: '#f59e0b', scientificRole: 'Greenhouse regulator & photosynthesis agent' },
      { name: 'Water Vapor / Trace', chemicalFormula: 'H₂O / Ne', percentage: 0.00, color: '#06b6d4', scientificRole: 'Hydrological cycle dynamic carrier' },
    ],
    geophysicalSummary: 'Standard planetary baseline for terrestrial Class M worlds. Dynamic liquid water oceans cover 71% of surface, shielded by a dipolar iron-core magnetosphere.',
    scienceHighlights: [
      'Strong biogenic ozone (O₃) UV-absorption spectral peak at 9.6 μm.',
      'Active plate tectonics driving planetary carbon-silicate geochemical cycle.',
      'Surface water in triple point equilibrium (ice, liquid ocean, vapor clouds).',
    ],
  },

  sol_mars: {
    name: 'Mars (Sol IV)',
    systemName: 'Sol System',
    classification: 'Class K (Adaptable Desert)',
    spectralClass: 'G2V Primary Orbit',
    earthSimilarityIndex: 0.73,
    habitabilityStatus: 'Marginal',
    surfaceGravityG: 0.38,
    surfaceGravityMs2: 3.72,
    meanSurfaceTempC: -63,
    meanSurfaceTempK: 210.15,
    surfacePressureAtm: 0.006,
    magneticFieldGauss: 0.01,
    radiationLevelRadHr: 2.4,
    hasLiquidWater: false,
    biosignaturesDetected: false,
    atmosphereGases: [
      { name: 'Carbon Dioxide', chemicalFormula: 'CO₂', percentage: 95.32, color: '#f59e0b', scientificRole: 'Primary rarefied greenhouse component' },
      { name: 'Nitrogen', chemicalFormula: 'N₂', percentage: 2.6, color: '#38bdf8', scientificRole: 'Trace residual atmospheric constituent' },
      { name: 'Argon', chemicalFormula: 'Ar', percentage: 1.9, color: '#94a3b8', scientificRole: 'Inert noble gas enrichment' },
      { name: 'Oxygen', chemicalFormula: 'O₂', percentage: 0.13, color: '#22c55e', scientificRole: 'Photochemical dissociation trace product' },
      { name: 'Water Vapor', chemicalFormula: 'H₂O', percentage: 0.05, color: '#06b6d4', scientificRole: 'Localized sublimation from polar ice caps' },
    ],
    geophysicalSummary: 'Hyper-arid desert planet with sub-surface permafrost reserves. Thin atmosphere subject to solar wind stripping due to extinct molten core dynamo.',
    scienceHighlights: [
      'Massive iron oxide (Fe₂O₃) regolith dust producing characteristic vermilion hue.',
      'Home to Olympus Mons, the largest known shield volcano in the solar system (21.9 km altitude).',
      'Subsurface radar reflections indicate briny permafrost reservoirs beneath polar caps.',
    ],
  },

  sol_saturn: {
    name: 'Saturn (Sol VI)',
    systemName: 'Sol System',
    classification: 'Class J (Gas Giant with Rings)',
    spectralClass: 'G2V Primary Orbit',
    earthSimilarityIndex: 0.28,
    habitabilityStatus: 'Non-Habitable',
    surfaceGravityG: 1.06,
    surfaceGravityMs2: 10.44,
    meanSurfaceTempC: -139,
    meanSurfaceTempK: 134.15,
    surfacePressureAtm: 1000.0,
    magneticFieldGauss: 0.21,
    radiationLevelRadHr: 8.5,
    hasLiquidWater: false,
    biosignaturesDetected: false,
    atmosphereGases: [
      { name: 'Hydrogen', chemicalFormula: 'H₂', percentage: 96.3, color: '#818cf8', scientificRole: 'Primordial outer convective envelope' },
      { name: 'Helium', chemicalFormula: 'He', percentage: 3.25, color: '#fb7185', scientificRole: 'Noble gas rain in deeper metallic transition layers' },
      { name: 'Methane', chemicalFormula: 'CH₄', percentage: 0.45, color: '#34d399', scientificRole: 'Infrared absorption producing planetary hues' },
      { name: 'Ammonia', chemicalFormula: 'NH₃', percentage: 0.02, color: '#fbbf24', scientificRole: 'Upper cloud deck condensation crystals' },
    ],
    geophysicalSummary: 'Majestic ringed gas giant with 146 moons. Broad metallic hydrogen transition mantle surrounding a rocky silicate-nickel core.',
    scienceHighlights: [
      'Spectacular ring system spanning 282,000 km, composed of 99% pure water ice particles.',
      'Unique hexagonal persistent jet stream vortex centered at planetary north pole.',
      'Moons Titan and Enceladus harbor subterranean prebiotic water/hydrocarbon oceans.',
    ],
  },

  sol_jupiter: {
    name: 'Jupiter (Sol V)',
    systemName: 'Sol System',
    classification: 'Class J (Gas Supergiant)',
    spectralClass: 'G2V Primary Orbit',
    earthSimilarityIndex: 0.24,
    habitabilityStatus: 'Non-Habitable',
    surfaceGravityG: 2.53,
    surfaceGravityMs2: 24.79,
    meanSurfaceTempC: -108,
    meanSurfaceTempK: 165.15,
    surfacePressureAtm: 2000.0,
    magneticFieldGauss: 4.28,
    radiationLevelRadHr: 450.0,
    hasLiquidWater: false,
    biosignaturesDetected: false,
    atmosphereGases: [
      { name: 'Hydrogen', chemicalFormula: 'H₂', percentage: 89.8, color: '#818cf8', scientificRole: 'Primary envelope & liquid metallic mantle' },
      { name: 'Helium', chemicalFormula: 'He', percentage: 10.2, color: '#fb7185', scientificRole: 'Core-denser gravitational sink' },
      { name: 'Methane', chemicalFormula: 'CH₄', percentage: 0.3, color: '#34d399', scientificRole: 'Deep atmospheric hydrocarbon trace' },
      { name: 'Ammonia & Phosphine', chemicalFormula: 'NH₃ / PH₃', percentage: 0.05, color: '#fbbf24', scientificRole: 'Chromophore agents in Great Red Spot' },
    ],
    geophysicalSummary: 'King of planets: more massive than all other Sol planets combined. Houses a magnetosphere extending beyond Saturn orbit.',
    scienceHighlights: [
      'Great Red Spot: anticyclonic storm raging for over 350 standard Earth years.',
      'Immense radiation belts powered by Io volcanic sulfur plasma torus.',
      'Supercritical metallic hydrogen core generating strongest planetary magnetic field in sector.',
    ],
  },

  vulcan_homeworld: {
    name: 'Vulcan (40 Eridani A II)',
    systemName: 'Vulcan System',
    classification: 'Class M (Arid Mountainous)',
    spectralClass: 'K1V Primary Orbit',
    earthSimilarityIndex: 0.86,
    habitabilityStatus: 'Optimal',
    surfaceGravityG: 1.4,
    surfaceGravityMs2: 13.73,
    meanSurfaceTempC: 38,
    meanSurfaceTempK: 311.15,
    surfacePressureAtm: 0.88,
    magneticFieldGauss: 0.78,
    radiationLevelRadHr: 0.08,
    hasLiquidWater: true,
    biosignaturesDetected: true,
    atmosphereGases: [
      { name: 'Nitrogen', chemicalFormula: 'N₂', percentage: 76.5, color: '#38bdf8', scientificRole: 'Structural atmospheric buffer' },
      { name: 'Oxygen', chemicalFormula: 'O₂', percentage: 21.2, color: '#22c55e', scientificRole: 'Aerobic metabolism for copper-hemocyanin blood' },
      { name: 'Argon', chemicalFormula: 'Ar', percentage: 1.4, color: '#94a3b8', scientificRole: 'Dense noble element accumulation' },
      { name: 'Carbon Dioxide', chemicalFormula: 'CO₂', percentage: 0.6, color: '#f59e0b', scientificRole: 'Arid climate thermoregulation' },
      { name: 'Silicate Aerosols', chemicalFormula: 'SiO₂', percentage: 0.3, color: '#eab308', scientificRole: 'Desert dust particulate suspension' },
    ],
    geophysicalSummary: 'Hot, high-gravity Class M planet with dramatic red basalt mountains and deep canyon seas. Homeworld of the founding Federation species.',
    scienceHighlights: [
      'Higher surface gravity (1.4g) and lower pressure drove rapid respiratory evolution.',
      'Atmospheric copper particulates interact with local flora generating green/copper spectral reflections.',
      'Active volcanic mantle with geothermal power tap grid powering continental cities.',
    ],
  },
};

export function getPlanetaryScienceData(
  targetId: string,
  targetName: string,
  systemName: string = 'Deep Space Sector',
  objectType: string = 'terran'
): PlanetaryScienceData {
  const known = KNOWN_PLANETARY_SCIENCE_DB[targetId];
  if (known) {
    return {
      id: targetId,
      name: known.name || targetName,
      systemName: known.systemName || systemName,
      classification: known.classification || 'Class M (Terrestrial)',
      spectralClass: known.spectralClass || 'G-Type Planetary Orbit',
      earthSimilarityIndex: known.earthSimilarityIndex ?? 0.85,
      habitabilityStatus: known.habitabilityStatus || 'Optimal',
      surfaceGravityG: known.surfaceGravityG ?? 1.0,
      surfaceGravityMs2: known.surfaceGravityMs2 ?? 9.81,
      meanSurfaceTempC: known.meanSurfaceTempC ?? 18,
      meanSurfaceTempK: known.meanSurfaceTempK ?? 291.15,
      surfacePressureAtm: known.surfacePressureAtm ?? 1.0,
      magneticFieldGauss: known.magneticFieldGauss ?? 0.5,
      radiationLevelRadHr: known.radiationLevelRadHr ?? 0.05,
      hasLiquidWater: known.hasLiquidWater ?? true,
      biosignaturesDetected: known.biosignaturesDetected ?? true,
      atmosphereGases: known.atmosphereGases || [
        { name: 'Nitrogen', chemicalFormula: 'N₂', percentage: 77.0, color: '#38bdf8', scientificRole: 'Atmospheric base' },
        { name: 'Oxygen', chemicalFormula: 'O₂', percentage: 21.0, color: '#22c55e', scientificRole: 'Aerobic driver' },
        { name: 'Argon', chemicalFormula: 'Ar', percentage: 1.0, color: '#94a3b8', scientificRole: 'Inert trace' },
        { name: 'Trace / Carbon', chemicalFormula: 'CO₂', percentage: 1.0, color: '#f59e0b', scientificRole: 'Trace thermal equilibrium' },
      ],
      geophysicalSummary: known.geophysicalSummary || 'Habitable terrestrial world with balanced geochemical cycles.',
      scienceHighlights: known.scienceHighlights || [
        'Stable core geodynamo providing adequate radiation shielding.',
        'Spectroscopic biosignature lines consistent with organic carbon chemistry.',
      ],
    };
  }

  const isGas = objectType.includes('gas') || objectType.includes('giant') || objectType === 'gas_giant';
  const isDesert = objectType.includes('desert') || objectType.includes('arid');

  if (isGas) {
    return {
      id: targetId,
      name: targetName,
      systemName,
      classification: 'Class J / T (Gas Giant)',
      spectralClass: 'Substellar Outer Orbit',
      earthSimilarityIndex: 0.22,
      habitabilityStatus: 'Non-Habitable',
      surfaceGravityG: 1.85,
      surfaceGravityMs2: 18.15,
      meanSurfaceTempC: -125,
      meanSurfaceTempK: 148.15,
      surfacePressureAtm: 1500.0,
      magneticFieldGauss: 2.8,
      radiationLevelRadHr: 120.0,
      hasLiquidWater: false,
      biosignaturesDetected: false,
      atmosphereGases: [
        { name: 'Molecular Hydrogen', chemicalFormula: 'H₂', percentage: 88.5, color: '#818cf8', scientificRole: 'Primary gas envelope' },
        { name: 'Helium', chemicalFormula: 'He', percentage: 10.5, color: '#fb7185', scientificRole: 'Noble gas layer' },
        { name: 'Methane', chemicalFormula: 'CH₄', percentage: 0.8, color: '#34d399', scientificRole: 'Hydrocarbon spectral band' },
        { name: 'Ammonia', chemicalFormula: 'NH₃', percentage: 0.2, color: '#fbbf24', scientificRole: 'Cloud crystallization' },
      ],
      geophysicalSummary: 'Massive hydrogen-helium gas giant without a solid surface.',
      scienceHighlights: [
        'Extreme synchrotron radio emissions generated by magnetosphere.',
        'High-velocity equatorial atmospheric counter-rotating zonal bands.',
      ],
    };
  }

  if (isDesert) {
    return {
      id: targetId,
      name: targetName,
      systemName,
      classification: 'Class H / K (Arid Desert)',
      spectralClass: 'High Irradiance Habitable Zone',
      earthSimilarityIndex: 0.68,
      habitabilityStatus: 'Marginal',
      surfaceGravityG: 0.88,
      surfaceGravityMs2: 8.63,
      meanSurfaceTempC: 42,
      meanSurfaceTempK: 315.15,
      surfacePressureAtm: 0.65,
      magneticFieldGauss: 0.25,
      radiationLevelRadHr: 0.45,
      hasLiquidWater: false,
      biosignaturesDetected: false,
      atmosphereGases: [
        { name: 'Carbon Dioxide', chemicalFormula: 'CO₂', percentage: 82.0, color: '#f59e0b', scientificRole: 'Thermal insulator' },
        { name: 'Nitrogen', chemicalFormula: 'N₂', percentage: 14.5, color: '#38bdf8', scientificRole: 'Residual buffer' },
        { name: 'Argon', chemicalFormula: 'Ar', percentage: 2.8, color: '#94a3b8', scientificRole: 'Inert accumulation' },
        { name: 'Oxygen', chemicalFormula: 'O₂', percentage: 0.7, color: '#22c55e', scientificRole: 'Trace photolysis' },
      ],
      geophysicalSummary: 'Arid desert world with high diurnal temperature variation.',
      scienceHighlights: [
        'Extensive silicate sand dunes spanning equatorial continents.',
        'Moderate solar UV penetration through thin atmosphere.',
      ],
    };
  }

  return {
    id: targetId,
    name: targetName,
    systemName,
    classification: 'Class M (Terrestrial Habitable)',
    spectralClass: 'Standard Habitable Goldilocks Zone',
    earthSimilarityIndex: 0.91,
    habitabilityStatus: 'Optimal',
    surfaceGravityG: 1.04,
    surfaceGravityMs2: 10.2,
    meanSurfaceTempC: 19,
    meanSurfaceTempK: 292.15,
    surfacePressureAtm: 1.05,
    magneticFieldGauss: 0.58,
    radiationLevelRadHr: 0.03,
    hasLiquidWater: true,
    biosignaturesDetected: true,
    atmosphereGases: [
      { name: 'Nitrogen', chemicalFormula: 'N₂', percentage: 76.8, color: '#38bdf8', scientificRole: 'Primary atmospheric buffer' },
      { name: 'Oxygen', chemicalFormula: 'O₂', percentage: 21.4, color: '#22c55e', scientificRole: 'Photosynthetic biological marker' },
      { name: 'Argon', chemicalFormula: 'Ar', percentage: 1.1, color: '#94a3b8', scientificRole: 'Inert noble carrier' },
      { name: 'Carbon Dioxide', chemicalFormula: 'CO₂', percentage: 0.4, color: '#f59e0b', scientificRole: 'Geothermal balance' },
      { name: 'Water Vapor', chemicalFormula: 'H₂O', percentage: 0.3, color: '#06b6d4', scientificRole: 'Tropospheric weather systems' },
    ],
    geophysicalSummary: 'Thriving terrestrial world situated within the circumstellar habitable zone with liquid oceans.',
    scienceHighlights: [
      'Strong water vapor absorption lines in near-infrared bands.',
      'Equatorial biosignature spectrum indicates active chlorophyll-like vegetation.',
    ],
  };
}
