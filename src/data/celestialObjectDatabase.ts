// Starfleet Astrometric & Celestial Object Database
// Comprehensive catalog of planets, stars, starbases, spacedocks, anomalies, and tactical vessels

import { STAR_TREK_SOLAR_SYSTEMS } from '../three/solarSystems';
import { PlanetData, SolarSystem } from '../types/simulation';

export type CelestialCategory = 'planet' | 'starbase' | 'star' | 'anomaly' | 'enemy' | 'asteroid';

export interface DetailedObjectInfo {
  id: string;
  name: string;
  shortName: string;
  type: string;
  category: CelestialCategory;
  systemId: string;
  systemName: string;
  quadrant: string;
  description: string;
  briefDescription: string;
  distanceKm: number;
  coordinates: [number, number, number];
  visual: {
    color: string;
    atmosphereColor?: string;
    hasRings?: boolean;
    ringColor?: string;
    iconType: string;
    badgeLabel: string;
    spectralGlow?: string;
  };
  characteristics: {
    classification: string;
    diameter: string;
    surfaceGravity?: string;
    meanTemperature?: string;
    orbitalPeriod?: string;
    atmosphere?: string;
    population?: string;
    affiliation: string;
    defenseSystems?: string;
    dockingAvailable: boolean;
    status: string;
  };
  tacticalNotes: string[];
  historicalLog: string;
}

// Curated lore database for stellar and planetary bodies
export const CELESTIAL_LORE_DATABASE: Record<string, Partial<DetailedObjectInfo>> = {
  // --- Sol System ---
  sol_earth: {
    name: 'Earth (Sector 001)',
    shortName: 'Earth',
    type: 'Class M Terran Planet',
    category: 'planet',
    systemName: 'Sol System',
    quadrant: 'Alpha Quadrant',
    briefDescription: 'Capital homeworld of the United Federation of Planets and headquarters of Starfleet Command.',
    description: 'Earth is a lush, biodiverse Class M world with vast nitrogen-oxygen oceans, temperate continents, and the political heart of the United Federation of Planets. Home to Starfleet Headquarters in San Francisco and the Council of the Federation in Paris.',
    characteristics: {
      classification: 'Class M (Habitable Terran)',
      diameter: '12,742 km',
      surfaceGravity: '1.00 G (Standard)',
      meanTemperature: '15°C (59°F)',
      orbitalPeriod: '365.25 Solar Days',
      atmosphere: '78% Nitrogen, 21% Oxygen, 1% Argon',
      population: '4.2 Billion (Post-Scarcity Utopia)',
      affiliation: 'United Federation of Planets (Capital)',
      defenseSystems: 'Sol Sector Defense Grid, Planetary Deflector Array',
      dockingAvailable: false,
      status: 'Core Homeworld / Nominal Posture',
    },
    tacticalNotes: [
      'High orbital traffic; standard speed limit 0.25 impulse within 50,000 km.',
      'Primary sensor array linked to Starfleet Astrometric Command.',
      'Planetary defense perimeter guarded by orbital weapons platforms.',
    ],
    historicalLog: 'Stardate 47634.4: Earth stands as the cradle of humanity and founding world of the Federation Charter signed in 2161.',
  },

  sol_spacedock: {
    name: 'Starfleet Deep Space Spacedock One',
    shortName: 'Spacedock One',
    type: 'Starfleet Deep Space Outpost Citadel',
    category: 'starbase',
    systemName: 'Sector 001 Deep Space Void',
    quadrant: 'Alpha-Beta Deep Void',
    briefDescription: 'Monumental deep-space Starfleet outpost citadel providing complete starship drydock, repair berths, and tactical command.',
    description: 'Deep Space Spacedock One is a monumental deep-space facility positioned in the dark interstellar void far from any stellar bodies. Capable of internally housing heavy cruisers and capital ships simultaneously, Spacedock One coordinates fleet operations and frontline maintenance with autonomous drone swarms.',
    characteristics: {
      classification: 'Deep Space Citadel (Class V Outpost)',
      diameter: '3,810 m (Height 4,600 m)',
      surfaceGravity: '1.00 G (Artificial Graviton Plating)',
      meanTemperature: '21°C (Internal Climate Controlled)',
      orbitalPeriod: 'Deep Space Inertial Stationkeeping (No Orbit)',
      atmosphere: 'Standard Federation Class M Mixture',
      population: '84,000 Starfleet Personnel & Civilians',
      affiliation: 'Starfleet Tactical Division',
      defenseSystems: 'Multi-phasic Heavy Shields, 48 Twin Phaser Banks, Quantum Torpedo Batteries',
      dockingAvailable: true,
      status: 'Full Fleet Drydock & Replenishment Operational',
    },
    tacticalNotes: [
      'Authorized docking berths available for Constitution, Miranda, and Excelsior class vessels.',
      'Full photon torpedo replenishment and antimatter bunkering supported.',
      'Internal space doors open under standard approach beacon clearance.',
    ],
    historicalLog: 'Stardate 2285.1: Construction completed under Starfleet Engineering Command. Served as departure point for USS Enterprise NCC-1701.',
  },

  sol_utopia_planitia: {
    name: 'Utopia Planitia Orbital Yards',
    shortName: 'Utopia Planitia',
    type: 'Orbital Fleet Construction Yards',
    category: 'starbase',
    systemName: 'Sol System',
    quadrant: 'Alpha Quadrant',
    briefDescription: 'Starfleet premier starship fabrication drydocks orbiting Mars where flagship vessels are designed and assembled.',
    description: 'Utopia Planitia Fleet Yards consists of interconnected orbital gantry arrays and surface design bureaus on Mars. Responsible for the design, construction, and shakedown testing of Federation capital ships including Galaxy and Sovereign class prototypes.',
    characteristics: {
      classification: 'Orbital Industrial Yard Complex',
      diameter: '7,200 m (Array Span)',
      surfaceGravity: '0.38 G / 1.0 G Internal Berths',
      meanTemperature: '20°C (Pressurized Gantry Zones)',
      orbitalPeriod: 'Martian Synchronous Orbit',
      atmosphere: 'Controlled Industrial Environment',
      population: '32,000 Engineers & Architects',
      affiliation: 'Starfleet Design & Construction Bureau',
      defenseSystems: 'Automated Defense Drones, Perimeter Shield Buoys',
      dockingAvailable: true,
      status: 'Active Starship Construction & Maintenance',
    },
    tacticalNotes: [
      'Modular spaceframe assembly gantries equipped with heavy tractor emitters.',
      'Warp core alignment bays with antimatter containment safety interlocks.',
    ],
    historicalLog: 'Stardate 40052.1: Key development cradle for Advanced Starship Propulsion and Multi-vector Assault Mode frameworks.',
  },

  sol_mars: {
    name: 'Mars (Class-N)',
    shortName: 'Mars',
    type: 'Class N Reducing Desert World',
    category: 'planet',
    systemName: 'Sol System',
    quadrant: 'Alpha Quadrant',
    briefDescription: 'Terraformed red planet featuring sprawling biosphere domes and the Olympus Mons geological monument.',
    description: 'The fourth planet of the Sol System, Mars has undergone over a century of climate engineering and terraforming. Major human settlements thrive beneath pressurized geodesic domes and across the canyon floor of Valles Marineris.',
    characteristics: {
      classification: 'Class N (Sub-Terran Terraformed)',
      diameter: '6,779 km',
      surfaceGravity: '0.38 G',
      meanTemperature: '-20°C to 12°C',
      orbitalPeriod: '687 Earth Days',
      atmosphere: 'Thin Carbon Dioxide / Oxygen Mix',
      population: '120 Million Residents',
      affiliation: 'United Federation of Planets',
      defenseSystems: 'Planetary Defense Phasers, Orbital Patrol Craft',
      dockingAvailable: false,
      status: 'Terraforming Phase IV / Nominal',
    },
    tacticalNotes: [
      'Site of perimeter sensor beacons monitoring outbound warp vectors.',
      'Surface mining ops provide tritanium and duranium for Utopia Planitia.',
    ],
    historicalLog: 'Stardate 2154.2: First established terraforming stations built during the early United Earth interstellar expansion.',
  },

  sol_jupiter: {
    name: 'Jupiter (Class-J)',
    shortName: 'Jupiter',
    type: 'Class J Jovian Gas Giant',
    category: 'planet',
    systemName: 'Sol System',
    quadrant: 'Alpha Quadrant',
    briefDescription: 'Enormous gas giant with the famous Great Red Spot cyclonic storm and vast hydrogen-helium mantle.',
    description: 'Jupiter dominates the outer Sol system with its powerful magnetic field and dozens of moons. Atmospheric scoop stations harvest deuterium and tritium from the upper turbulent bands.',
    characteristics: {
      classification: 'Class J (Jovian Gas Giant)',
      diameter: '139,820 km',
      surfaceGravity: '2.53 G (at 1 bar)',
      meanTemperature: '-110°C (Cloud Tops)',
      orbitalPeriod: '11.86 Earth Years',
      atmosphere: '89% Hydrogen, 10% Helium, Traces of Methane',
      population: 'Orbital Scoop Outposts (Uninhabited core)',
      affiliation: 'United Federation of Planets',
      defenseSystems: 'Navigational Warning Buoys',
      dockingAvailable: false,
      status: 'Resource Harvesting Zone',
    },
    tacticalNotes: [
      'Intense synchrotron radiation field requires deflector shielding within 200,000 km.',
      'Great Red Spot storm anticyclone spans over 16,000 km in width.',
    ],
    historicalLog: 'Stardate 2267.3: Jupiter Station established as key research hub for holographic and biological developments.',
  },

  sol_saturn: {
    name: 'Saturn (Class-J)',
    shortName: 'Saturn',
    type: 'Ringed Class J Gas Giant',
    category: 'planet',
    systemName: 'Sol System',
    quadrant: 'Alpha Quadrant',
    briefDescription: 'Breathtaking ringed jewel of Sol system with icy ring structures spanning hundreds of thousands of kilometers.',
    description: 'Saturn is world-renowned for its magnificent icy ring system composed of water ice, silica dust, and carbonaceous grains. Starfleet flight academy trainees often conduct precision navigation runs near Titan.',
    characteristics: {
      classification: 'Class J (Ringed Gas Giant)',
      diameter: '116,460 km',
      surfaceGravity: '1.06 G',
      meanTemperature: '-140°C',
      orbitalPeriod: '29.4 Earth Years',
      atmosphere: '96% Hydrogen, 3% Helium, Methane',
      population: 'Research Outposts on Titan and Enceladus',
      affiliation: 'United Federation of Planets',
      defenseSystems: 'Flight Academy Navigation Beacons',
      dockingAvailable: false,
      status: 'Astrometric Survey & Training Sector',
    },
    tacticalNotes: [
      'Rings span 282,000 km across; collision warning active when entering plane.',
      'Popular proving ground for Starfleet Academy sub-light piloting maneuvers.',
    ],
    historicalLog: 'Stardate 2271.8: Sector traversed during the V\'Ger encounter by the refit USS Enterprise NCC-1701.',
  },

  // --- Vulcan System ---
  vulcan_prime: {
    name: 'Vulcan (40 Eridani A II)',
    shortName: 'Vulcan',
    type: 'Class M Arid / Desert World',
    category: 'planet',
    systemName: 'Vulcan System',
    quadrant: 'Alpha Quadrant',
    briefDescription: 'Homeworld of the Vulcan species, renowned for harsh red deserts, high gravity, and the Vulcan Science Academy.',
    description: 'Vulcan is a hot, arid world with a higher gravity and thinner atmosphere than Earth. Its citizens follow the teachings of Surak, dedicating their lives to pure logic, emotional suppression, and intellectual excellence.',
    characteristics: {
      classification: 'Class M (Arid Highland World)',
      diameter: '14,200 km',
      surfaceGravity: '1.40 G',
      meanTemperature: '38°C (100°F)',
      orbitalPeriod: '260 Vulcan Solar Days',
      atmosphere: '75% Nitrogen, 23% Oxygen, Low Humidity',
      population: '6.0 Billion Vulcans & Diplomats',
      affiliation: 'United Federation of Planets (Co-Founder)',
      defenseSystems: 'Vulcan Defense Directorate Grid',
      dockingAvailable: false,
      status: 'Diplomatic & Scientific Sanctuary',
    },
    tacticalNotes: [
      'High surface gravity increases physical fatigue for non-adapted species.',
      'Mount Seleya sanctuary restricts unauthorized sensor sweeps.',
    ],
    historicalLog: 'Stardate 2063.4: A Vulcan survey ship, the T\'Plana-Hath, made First Contact with Earth after detecting Zephram Cochrane\'s warp signature.',
  },

  vulcan_spacedock: {
    name: '40 Eridani Orbital Refit Complex',
    shortName: 'Vulcan Spacedock',
    type: 'Starfleet Vulcan Orbital Facility',
    category: 'starbase',
    systemName: 'Vulcan System',
    quadrant: 'Alpha Quadrant',
    briefDescription: 'Advanced scientific refit and research starbase co-administered by Starfleet and the Vulcan Science Directorate.',
    description: 'Stationed above Vulcan Prime, this orbital complex specializes in tachyon detection arrays, long-range subspace sensor calibration, and specialized warp field harmonics.',
    characteristics: {
      classification: 'Class IV Orbital Research Outpost',
      diameter: '2,400 m',
      surfaceGravity: '1.0 G (Simulated)',
      meanTemperature: '22°C',
      orbitalPeriod: 'Low Vulcan Orbit',
      atmosphere: 'Class M Standard',
      population: '14,000 Researchers & Technicians',
      affiliation: 'Vulcan Science Academy / Starfleet',
      defenseSystems: 'Graviton Shield Emitters, Particle Beams',
      dockingAvailable: true,
      status: 'Scientific Operations & Drydock Active',
    },
    tacticalNotes: [
      'Excellent sensor calibration services for deep astrogation.',
      'Emergency shield harmonics re-sequencing available in bay 3.',
    ],
    historicalLog: 'Stardate 3110.2: Pioneered early duotronic computer integration for Starfleet vessels.',
  },

  // --- Qo'noS (Kronos) System ---
  kronos_prime: {
    name: 'Qo\'noS (Klingon Homeworld)',
    shortName: 'Qo\'noS',
    type: 'Class M Volcanic / Forest World',
    category: 'planet',
    systemName: 'Qo\'noS System',
    quadrant: 'Beta Quadrant',
    briefDescription: 'Capital world of the Klingon Empire, home to the High Council and fierce warrior clans.',
    description: 'Qo\'noS (pronounced Kronos) is a heavily forested, volcanically active Class M world featuring jagged mountain chains, deep gorges, and the ancient First City where the Chancellor and Great Houses govern.',
    characteristics: {
      classification: 'Class M (High Tectonic / Forest)',
      diameter: '15,100 km',
      surfaceGravity: '1.25 G',
      meanTemperature: '24°C (75°F)',
      orbitalPeriod: '348 Klingon Cycles',
      atmosphere: 'Dense Oxygen-Nitrogen with Trace Sulfur',
      population: '8.4 Billion Klingon Warriors & Civilians',
      affiliation: 'Klingon Empire (Capital)',
      defenseSystems: 'Klingon Imperial Defense Fleet, Orbital Disruptor Batteries',
      dockingAvailable: false,
      status: 'Imperial Sovereign Stronghold',
    },
    tacticalNotes: [
      'Approach strictly monitored by Klingon Defense Force Battlecruisers.',
      'Defensive shields and cloaked orbital mines surround key military corridors.',
    ],
    historicalLog: 'Stardate 2269.4: Founded centuries prior by Kahless the Unforgettable after the overthrow of the tyrant Molor.',
  },

  // --- Romulus System ---
  romulus_prime: {
    name: 'Romulus (Romulan Homeworld)',
    shortName: 'Romulus',
    type: 'Class M Water & Mountain World',
    category: 'planet',
    systemName: 'Romulus System',
    quadrant: 'Beta Quadrant',
    briefDescription: 'Secretive capital world of the Romulan Star Empire, seat of the Romulan Senate and Tal Shiar headquarters.',
    description: 'Romulus is a serene world of sweeping mountain ridges, lush temperate forests, and deep blue seas. Beneath its tranquil surface lies the heavily guarded center of imperial statecraft and covert intelligence.',
    characteristics: {
      classification: 'Class M (Temperate Mountain / Ocean)',
      diameter: '13,800 km',
      surfaceGravity: '1.10 G',
      meanTemperature: '18°C',
      orbitalPeriod: '390 Days',
      atmosphere: 'Class M Standard',
      population: '7.8 Billion Romulans',
      affiliation: 'Romulan Star Empire (Capital)',
      defenseSystems: 'Imperial Warbird Fleets, Plasma Torpedo Defense Grid',
      dockingAvailable: false,
      status: 'Restricted Empire Core',
    },
    tacticalNotes: [
      'Unescorted Federation vessels entering system subject to immediate plasma bombardment.',
      'Cloaked orbital platforms maintain continuous tachyon sweeps.',
    ],
    historicalLog: 'Stardate 2160.1: Settled thousands of years ago by Vulcan dissidents who rejected the teachings of Surak.',
  },

  // --- Tactical Asteroids ---
  asteroid_target_alpha: {
    name: 'Asteroid Alpha (Combat Target)',
    shortName: 'Asteroid Alpha',
    type: 'Class C Carbonaceous Asteroid',
    category: 'asteroid',
    systemName: 'Local Tactical Proving Grounds',
    quadrant: 'Alpha Quadrant',
    briefDescription: 'Dense mineral asteroid designated for weapons calibration, phaser drill, and torpedo testing.',
    description: 'A stable carbonaceous asteroid floating in Starfleet tactical coordinates. Outfitted with sensor transponders for target acquisition, phaser frequency tuning, and hull impact telemetry.',
    characteristics: {
      classification: 'Class C Asteroid (Carbonaceous Rock)',
      diameter: '420 m',
      surfaceGravity: '0.01 G (Microgravity)',
      meanTemperature: '-180°C',
      orbitalPeriod: 'Sub-synchronous Drift',
      atmosphere: 'None (Vacuum)',
      population: 'None (Target Drone Transponders)',
      affiliation: 'Starfleet Tactical Weapons Range',
      defenseSystems: 'Target Sensor Telemetry Beacons',
      dockingAvailable: false,
      status: 'Weapons Drill Target Ready',
    },
    tacticalNotes: [
      'Target lock confirmed by pressing [Space] to test dual phasers or [T] for photon torpedoes.',
      'Displays volumetric shield deflection and particle burst upon impact.',
    ],
    historicalLog: 'Stardate 2270.1: Placed in stable test orbit by Starfleet Ordnance Division.',
  },
};

// Procedural builder for any object (planet, star, enemy, station)
export function getObjectDetails(
  targetId: string | null | undefined,
  shipPos: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  activeEnemies: Array<{
    id: string;
    name: string;
    faction: string;
    shipClass: string;
    hullPercent?: number;
    shieldPercent?: number;
    hullIntegrity?: number;
    shields?: number;
    position: [number, number, number];
  }> = []
): DetailedObjectInfo | null {
  if (!targetId) return null;

  // 1. Check if it's an enemy ship
  const enemy = activeEnemies.find((e) => e.id === targetId);
  if (enemy) {
    const dx = enemy.position[0] - shipPos.x;
    const dy = enemy.position[1] - shipPos.y;
    const dz = enemy.position[2] - shipPos.z;
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));

    const isKlingon = enemy.faction === 'klingon';
    const isRomulan = enemy.faction === 'romulan';
    const hullVal = enemy.hullPercent ?? enemy.hullIntegrity ?? 100;
    const shieldVal = enemy.shieldPercent ?? enemy.shields ?? 100;

    return {
      id: enemy.id,
      name: enemy.name,
      shortName: enemy.name.split(' ')[0] || enemy.name,
      type: `${enemy.faction.toUpperCase()} ${enemy.shipClass} Warship`,
      category: 'enemy',
      systemId: 'combat_zone',
      systemName: 'Combat Engagement Zone',
      quadrant: isKlingon ? 'Beta Quadrant' : isRomulan ? 'Beta Quadrant' : 'Alpha Quadrant',
      briefDescription: `Hostile ${enemy.faction} combat vessel. Armed with heavy disruptor cannons and tracking torpedoes.`,
      description: `Tactical sensor sweep confirms an active hostile ${enemy.faction} warship on intercept vector. Weapons are armed with high-frequency particle disruptors. Shields and hull integrity are under continuous Starfleet telemetry monitoring.`,
      distanceKm: dist,
      coordinates: enemy.position,
      visual: {
        color: isKlingon ? '#ef4444' : isRomulan ? '#10b981' : '#f59e0b',
        badgeLabel: enemy.faction.toUpperCase(),
        iconType: 'crosshair',
        spectralGlow: '#ef4444',
      },
      characteristics: {
        classification: `Warship (${enemy.shipClass})`,
        diameter: isKlingon ? '286 m' : '1,041 m',
        surfaceGravity: 'Artificial Graviton Plating',
        meanTemperature: 'Internal 20°C',
        orbitalPeriod: 'Combat Pursuit Trajectory',
        atmosphere: 'Nitrogen-Oxygen Mix',
        population: isKlingon ? '350 Klingon Warriors' : '1,500 Romulan Centurions',
        affiliation: isKlingon ? 'Klingon Imperial Fleet' : 'Romulan Star Navy',
        defenseSystems: `Disruptors, Heavy Shields (${Math.round(shieldVal)}%), Armor (${Math.round(hullVal)}%)`,
        dockingAvailable: false,
        status: `HOSTILE THREAT ACTIVE · Hull: ${Math.round(hullVal)}%`,
      },
      tacticalNotes: [
        'Maintain evasive maneuvers to minimize disruptor convergence.',
        'Target vulnerable warp nacelle manifolds with photon torpedoes.',
        'Fire dual forward phasers with [Space] and Torpedoes with [T].',
      ],
      historicalLog: `Stardate 2270.5: Hostile warship detected on combat telemetry vector. Starfleet Standing Order 4 applies.`,
    };
  }

  // 2. Check if it's a primary star
  if (targetId.endsWith('_primary_star')) {
    const systemId = targetId.replace('_primary_star', '');
    const system = STAR_TREK_SOLAR_SYSTEMS.find((s) => s.id === systemId);
    if (system) {
      const pos = system.centerCoordinates;
      const dx = pos[0] - shipPos.x;
      const dy = pos[1] - shipPos.y;
      const dz = pos[2] - shipPos.z;
      const dist = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));

      return {
        id: targetId,
        name: `${system.primaryStar} (Primary Star)`,
        shortName: system.primaryStar,
        type: `Stellar Core · Spectral Class ${system.spectralType || 'G2V'}`,
        category: 'star',
        systemId: system.id,
        systemName: system.name,
        quadrant: system.quadrant || 'Alpha Quadrant',
        briefDescription: `Central stellar gravitational anchor of ${system.name}. High luminosity thermonuclear plasma furnace.`,
        description: `${system.primaryStar} is the central star of the ${system.name}. Its thermonuclear core fuses millions of tons of hydrogen into helium every second, powering the biosphere of orbiting worlds and generating intense stellar winds.`,
        distanceKm: dist,
        coordinates: pos,
        visual: {
          color: '#fbbf24',
          badgeLabel: 'STAR',
          iconType: 'sun',
          spectralGlow: '#f59e0b',
        },
        characteristics: {
          classification: `Spectral Class ${system.spectralType || 'G2V Main Sequence'}`,
          diameter: '1,392,700 km',
          surfaceGravity: '27.9 G',
          meanTemperature: '5,500°C (Surface) / 15M°C (Core)',
          orbitalPeriod: 'Galactic Center Orbit (225M Years)',
          atmosphere: 'Photosphere: 73% Hydrogen, 25% Helium',
          population: 'Uninhabited (Solar Corona Outposts)',
          affiliation: system.territory === 'federation' ? 'United Federation of Planets' : 'Independent Space',
          defenseSystems: 'Intense Radiation & Corona Flares',
          dockingAvailable: false,
          status: 'Stable Stellar Fusion',
        },
        tacticalNotes: [
          'Extreme thermal radiation; engage deflector shields when approaching solar corona.',
          'Solar flares may cause temporary sensor static or astrogation interference.',
        ],
        historicalLog: `Astrometric Chart Record: Gravitational center of ${system.name}. Navigational reference beacon alpha.`,
      };
    }
  }

  // 3. Check planets and space stations from all solar systems
  let matchedPlanet: PlanetData | null = null;
  let matchedSystem: SolarSystem | null = null;

  for (const sys of STAR_TREK_SOLAR_SYSTEMS) {
    const found = sys.planets.find((p) => p.id === targetId);
    if (found) {
      matchedPlanet = found;
      matchedSystem = sys;
      break;
    }
  }

  // 4. If matched in solar systems:
  if (matchedPlanet && matchedSystem) {
    const dx = matchedPlanet.position[0] - shipPos.x;
    const dy = matchedPlanet.position[1] - shipPos.y;
    const dz = matchedPlanet.position[2] - shipPos.z;
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));

    // Check if we have curated lore
    const lore = CELESTIAL_LORE_DATABASE[matchedPlanet.id] || {};

    const isStarbase = matchedPlanet.type === 'starbase';
    const isAnomaly = matchedPlanet.type === 'anomaly' || matchedPlanet.type === 'nebula' || matchedPlanet.type === 'wormhole';
    const isGasGiant = matchedPlanet.type === 'gas_giant';
    const isMoon = matchedPlanet.type === 'moon';

    const category: CelestialCategory = isStarbase ? 'starbase' : isAnomaly ? 'anomaly' : 'planet';

    const typeLabel =
      lore.type ||
      (isStarbase
        ? 'Starfleet Orbital Spacedock'
        : isMoon
        ? 'Class D / Class P Natural Satellite Moon'
        : isGasGiant
        ? 'Class J Gas Giant'
        : matchedPlanet.type === 'terran'
        ? 'Class M Terran Planet'
        : matchedPlanet.type === 'desert'
        ? 'Class H / Class N Desert World'
        : matchedPlanet.type === 'ice'
        ? 'Class P Glacial Ice World'
        : matchedPlanet.type === 'volcanic'
        ? 'Class Y Demon / Volcanic World'
        : matchedPlanet.type === 'ocean'
        ? 'Class O Pelagic Ocean World'
        : matchedPlanet.type === 'nebula'
        ? 'Ionized Stellar Nebula'
        : matchedPlanet.type === 'wormhole'
        ? 'Subspace Spatial Wormhole'
        : 'Celestial Body');

    const briefDesc =
      lore.briefDescription ||
      (isStarbase
        ? 'Starfleet strategic orbital outpost providing complete vessel repair, shield recharging, and torpedo supplies.'
        : matchedPlanet.description.length > 120
        ? matchedPlanet.description.slice(0, 117) + '...'
        : matchedPlanet.description);

    return {
      id: matchedPlanet.id,
      name: lore.name || matchedPlanet.name,
      shortName: lore.shortName || matchedPlanet.name.split(' (')[0],
      type: typeLabel,
      category,
      systemId: matchedSystem.id,
      systemName: matchedSystem.name,
      quadrant: matchedSystem.quadrant || 'Alpha Quadrant',
      description: lore.description || matchedPlanet.description,
      briefDescription: briefDesc,
      distanceKm: dist,
      coordinates: matchedPlanet.position,
      visual: {
        color: matchedPlanet.textureColor || '#38bdf8',
        atmosphereColor: matchedPlanet.atmosphereColor,
        hasRings: matchedPlanet.hasRings,
        ringColor: matchedPlanet.ringColor,
        badgeLabel: isStarbase ? 'STARBASE' : isAnomaly ? 'ANOMALY' : isMoon ? 'MOON' : 'PLANET',
        iconType: isStarbase ? 'shield' : isAnomaly ? 'sparkles' : isMoon ? 'moon' : 'globe',
        spectralGlow: matchedPlanet.atmosphereColor || matchedPlanet.textureColor,
      },
      characteristics: {
        classification: lore.characteristics?.classification || `${typeLabel} (${matchedPlanet.type.toUpperCase()})`,
        diameter: lore.characteristics?.diameter || `${Math.round(matchedPlanet.radius * 2 * 25)} km`,
        surfaceGravity: lore.characteristics?.surfaceGravity || (isStarbase ? '1.0 G (Simulated)' : '0.98 G'),
        meanTemperature: lore.characteristics?.meanTemperature || (isStarbase ? '21°C (Internal)' : '18°C'),
        orbitalPeriod: lore.characteristics?.orbitalPeriod || `${matchedPlanet.orbitalPeriod || 365} Days`,
        atmosphere: lore.characteristics?.atmosphere || (isStarbase ? 'Standard Class M Atmosphere' : 'Nitrogen-Oxygen Biosphere'),
        population: lore.characteristics?.population || (isStarbase ? '12,500 Starfleet Personnel' : 'Classified Population'),
        affiliation: lore.characteristics?.affiliation || (matchedSystem.territory === 'federation' ? 'United Federation of Planets' : 'Independent Territory'),
        defenseSystems: lore.characteristics?.defenseSystems || (isStarbase ? 'Orbital Shields, Phaser Arrays' : 'Planetary Defense Grid'),
        dockingAvailable: isStarbase,
        status: lore.characteristics?.status || (isStarbase ? 'Docking Berths Open' : 'Orbital Posture Nominal'),
      },
      tacticalNotes: lore.tacticalNotes || [
        isStarbase
          ? 'Approach within 800 km and press [X] to initiate automated docking umbilical sequence.'
          : 'Standard orbit established at altitude 400 km above equatorial plane.',
        'Sensors report clear subspace telemetry with no hostile interference.',
      ],
      historicalLog: lore.historicalLog || `Astrometric Federation Record: Cataloged under ${matchedSystem.name} Astrometric Cartography.`,
    };
  }

  // 5. Special tactical asteroid fallback
  if (targetId === 'asteroid_target_alpha' || targetId.includes('asteroid')) {
    const lore = CELESTIAL_LORE_DATABASE.asteroid_target_alpha;
    return {
      id: 'asteroid_target_alpha',
      name: lore.name || 'Asteroid Alpha',
      shortName: 'Asteroid Alpha',
      type: lore.type || 'Class C Target Asteroid',
      category: 'asteroid',
      systemId: 'sol_system',
      systemName: 'Sol Proving Grounds',
      quadrant: 'Alpha Quadrant',
      briefDescription: lore.briefDescription || 'Carbonaceous mineral asteroid designated for weapons calibration.',
      description: lore.description || 'Target practice drone asteroid.',
      distanceKm: Math.round(Math.hypot(shipPos.x, shipPos.y, shipPos.z)),
      coordinates: [0, 0, 0],
      visual: {
        color: '#78716c',
        badgeLabel: 'ASTEROID',
        iconType: 'target',
      },
      characteristics: lore.characteristics as any,
      tacticalNotes: lore.tacticalNotes || [],
      historicalLog: lore.historicalLog || '',
    };
  }

  return null;
}
