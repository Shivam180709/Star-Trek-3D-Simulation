import {
  MissionArchetype,
  StarfleetMission,
  SolarSystem,
  PlanetData,
  MissionPerformanceReport,
  PlayerProgression,
  OfficerProfileRecord,
  EnemyFaction,
} from '../types/simulation';

// ============================================================================
// 1. REAL-WORLD ASTROPHYSICS & XENOLINGUISTICS CATALOG FOR PROCEDURAL MISSIONS
// ============================================================================

const FIRST_CONTACT_CIVILIZATIONS = [
  {
    speciesId: 'vulcan',
    speciesName: 'Vulcan High Command',
    homeworld: 'Vulcan (40 Eridani A)',
    vesselName: 'VSS T\'Plana-Hath (Sh\'ran-Class Science Cruiser)',
    preferredSystemId: 'vulcan_system',
    baseFreqMhz: 1420.4, // Neutral Hydrogen 21-cm hyperfine line
    culturalContext: 'Vulcan diplomacy is governed by Surakian formal logic, non-aggression, and empirical verification. Emotional appeals or martial posturing lower diplomatic trust.',
    exchanges: [
      {
        alienHail: 'Vessel NCC-1701, your subspace carrier wave exhibits a 0.04% harmonic variance. State the logical necessity of your entry into this sector.',
        culturalContext: 'Vulcans test whether an unknown vessel follows disciplined scientific protocols before sharing astrometric telemetry.',
        choices: [
          {
            label: 'Transmit calibrated astrometric logs and propose reciprocal scientific telemetry exchange.',
            strategyTag: 'Empirical Reciprocity (Optimal Game-Theory Equilibrium)',
            scoreDelta: 50,
            alienResponse: 'Your telemetry is precise and internally consistent. The High Command accepts joint spectroscopic mapping.',
          },
          {
            label: 'Declare peaceful intentions and invite their delegation aboard for a cultural reception.',
            strategyTag: 'Emotional Goodwill Appeal',
            scoreDelta: 25,
            alienResponse: 'Social rituals are unnecessary, Captain, though your non-hostile posture is noted.',
          },
          {
            label: 'Maintain tactical shield lock until they disclose their vessel sensor schematics.',
            strategyTag: 'Zero-Sum Deterrence',
            scoreDelta: -10,
            alienResponse: 'Defensive posturing in the absence of threat is illogical. We will limit data transmission accordingly.',
          },
        ],
      },
      {
        alienHail: 'Sensors detect a transient gravimetric shear between our vessels. How do you propose we allocate observational bandwidth?',
        culturalContext: 'In cooperative game theory (Nash Bargaining), symmetric bandwidth partitioning maximizes signal-to-noise ratio for both observers.',
        choices: [
          {
            label: 'Synchronize orthogonal frequency multiplexing (50/50 phase-interleaved interferometer baseline).',
            strategyTag: 'Pareto-Optimal Interferometry',
            scoreDelta: 50,
            alienResponse: 'A dual-baseline VLBI array increases angular resolution by a factor of 4.2. Most logical, Captain.',
          },
          {
            label: 'Yield primary frequency channels to the Vulcan cruiser as a gesture of diplomatic deference.',
            strategyTag: 'Unilateral Concession',
            scoreDelta: 25,
            alienResponse: 'Unnecessary concession reduces combined baseline synthesis, though we acknowledge your courtesy.',
          },
          {
            label: 'Override the band with high-gain Starfleet active radar sweeps.',
            strategyTag: 'Band Dominance',
            scoreDelta: -15,
            alienResponse: 'Your active sweep causes constructive noise interference. Terminating shared link.',
          },
        ],
      },
    ],
  },
  {
    speciesId: 'klingon',
    speciesName: 'Klingon Defense Force',
    homeworld: 'Qo\'noS (First City)',
    vesselName: 'IKS Bortas (D7-Class Battlecruiser)',
    preferredSystemId: 'kronos_system',
    baseFreqMhz: 960.8,
    culturalContext: 'Klingon strategic culture respects directness, strength, and honorable resolve (credible deterrence in game theory). Timidity invites aggression, while unprovoked insult triggers combat.',
    exchanges: [
      {
        alienHail: 'Federation starship! You cross the hunting grounds of the Ninth Fleet. Speak quickly before our disruptor banks reach full charge!',
        culturalContext: 'In deterrence theory, demonstrating calm readiness without escalating weapons locks signals credible resolve.',
        choices: [
          {
            label: 'Hail Commander directly on open visuals: "We stand ready to defend our vessel, yet we come to honor a shared navigational accord."',
            strategyTag: 'Credible Deterrence with Mutual Respect',
            scoreDelta: 50,
            alienResponse: 'Hah! A Captain who looks a warrior in the eye without trembling. Speak your accord!',
          },
          {
            label: 'Power down all tactical systems and offer supplies to avoid confrontation.',
            strategyTag: 'Appeasement Signal',
            scoreDelta: 15,
            alienResponse: 'You bare your throat like prey, Federation! Keep your rations—just stay out of our vector.',
          },
          {
            label: 'Lock photon torpedoes on their bridge and demand they withdraw immediately.',
            strategyTag: 'Brinkmanship Escalation',
            scoreDelta: -15,
            alienResponse: 'You dare lock weapons on a vessel of the Empire?! Only blood answers such arrogance!',
          },
        ],
      },
      {
        alienHail: 'A rogue plasma storm threatens both our ships\' warp nacelles. Do you flee to safe harbor, or ride the shockfront with us?',
        culturalContext: 'Stag Hunt game-theory dynamics: mutual cooperation against an environmental hazard yields the highest payoff and earns lasting warrior respect.',
        choices: [
          {
            label: 'Link navigational deflectors in a harmonic wedge to cleave the plasma shockfront side-by-side.',
            strategyTag: 'Cooperative Stag-Hunt Alliance',
            scoreDelta: 50,
            alienResponse: 'Qapla\'! Today the Enterprise flies with the heart of a Kahless warship! Our telemetry is yours.',
          },
          {
            label: 'Transmit storm coordinates and hold position outside the radiation boundary.',
            strategyTag: 'Cautious Observation',
            scoreDelta: 25,
            alienResponse: 'Caution keeps your hull clean, Starfleet, though it wins no songs in the Great Hall.',
          },
          {
            label: 'Use the plasma storm interference to mask a tactical withdrawal.',
            strategyTag: 'Defection',
            scoreDelta: -10,
            alienResponse: 'Running into the shadows like a Romulan! Expect no favors from the Ninth Fleet.',
          },
        ],
      },
    ],
  },
  {
    speciesId: 'romulan',
    speciesName: 'Romulan Star Empire',
    homeworld: 'Romulus & Remus',
    vesselName: 'IRW Valdore (T\'liss-Class Warbird)',
    preferredSystemId: 'romulan_system',
    baseFreqMhz: 1612.2, // Hydroxyl radical OH maser line
    culturalContext: 'Romulan commanders operate on asymmetric information and Prisoner\'s Dilemma calculus. Transparency paired with verified sensor parity prevents deceptive ambushes.',
    exchanges: [
      {
        alienHail: 'You address Sub-Commander Tal of the Star Empire. Our decloak was a courtesy—do not mistake it for vulnerability.',
        culturalContext: 'Signaling that your tachyon grid already tracked their quantum singularity core removes their information asymmetry advantage.',
        choices: [
          {
            label: 'Acknowledge their courtesy while sharing our gravimetric trace of their quantum singularity core to establish mutual parity.',
            strategyTag: 'Verified Symmetric Deterrence',
            scoreDelta: 50,
            alienResponse: 'Impressive sensor resolution, Captain. Since neither of us holds the element of surprise, let us negotiate as equals.',
          },
          {
            label: 'Request that both ships lower shields simultaneously as a trust exercise.',
            strategyTag: 'Unverified Trust',
            scoreDelta: 20,
            alienResponse: 'A charmingly naive proposal. We shall keep our shields modulated, but we will hear your proposal.',
          },
          {
            label: 'Flood the sector with multiphasic tachyon pulses to force any other cloaked ships to decloak.',
            strategyTag: 'Hostile Counter-Sweep',
            scoreDelta: -10,
            alienResponse: 'An aggressive provocation. Our wingmates will remember your lack of restraint.',
          },
        ],
      },
      {
        alienHail: 'A decaying subspace relay near the Neutral Zone contains astrometric logs claimed by both our governments. What is your disposition?',
        culturalContext: 'Tit-for-Tat with verifiable Simultaneous Data Mirroring prevents unilateral defection in a Prisoner\'s Dilemma.',
        choices: [
          {
            label: 'Execute a simultaneous quantum-entangled burst download so both vessels receive identical unedited archives.',
            strategyTag: 'Verifiable Non-Zero-Sum Mirroring',
            scoreDelta: 50,
            alienResponse: 'An elegant cryptographic solution. Neither side can alter the record. The Praetor will respect your acumen.',
          },
          {
            label: 'Allow the Romulan Warbird to retrieve the core in exchange for a verbal summary.',
            strategyTag: 'Asymmetric Concession',
            scoreDelta: 20,
            alienResponse: 'We gladly accept custody of the core. Our summary will be... appropriately curated.',
          },
          {
            label: 'Destroy the relay with phasers so the Star Empire cannot obtain the telemetry.',
            strategyTag: 'Mutual Denial',
            scoreDelta: -15,
            alienResponse: 'Destroying scientific knowledge out of paranoia? How remarkably short-sighted.',
          },
        ],
      },
    ],
  },
  {
    speciesId: 'andorian',
    speciesName: 'Andorian Imperial Guard',
    homeworld: 'Andoria (Procyon VIII-a Ice Moon)',
    vesselName: 'IGV Kumari (Kumari-Class Battlecruiser)',
    preferredSystemId: 'andoria_system',
    baseFreqMhz: 1180.5,
    culturalContext: 'Andorians value passionate honesty, mutual defense solidarity, and practical action in harsh cryogenic environments.',
    exchanges: [
      {
        alienHail: 'This is General Thy\'lek Shran of the Imperial Guard! Our ice-bore thermal sensors are picking up your warp signature—state your mission!',
        culturalContext: 'Direct, candid communication with concrete operational assistance builds immediate trust with the Imperial Guard.',
        choices: [
          {
            label: 'Respond candidly: "General, we are conducting deep-space magnetospheric surveys and offer full thermal-imaging calibration support."',
            strategyTag: 'Candid Operational Solidarity',
            scoreDelta: 50,
            alienResponse: 'Straight to the point—no diplomatic riddles! Send over your thermal calibration matrices, pink-skin!',
          },
          {
            label: 'Cite formal Starfleet Subspace Subsection 14-B authorizing our survey presence.',
            strategyTag: 'Bureaucratic Formalism',
            scoreDelta: 20,
            alienResponse: 'Spare me the committee regulations! Just keep your deflector wake clear of our patrol lanes.',
          },
          {
            label: 'Refuse to disclose mission parameters citing Starfleet security classification.',
            strategyTag: 'Opaque Secrecy',
            scoreDelta: -10,
            alienResponse: 'Secrecy breeds suspicion in the Procyon sector. Our targeting scanners will stay locked on your hull.',
          },
        ],
      },
      {
        alienHail: 'Subsurface cryovolcanic tremors on our outer listening post are disrupting our subspace transceiver array. Can your engineers assist?',
        culturalContext: 'Offering immediate technical reciprocity cements long-term coalition stability.',
        choices: [
          {
            label: 'Modulate our auxiliary graviton beam to dampen the cryovolcanic fault stress while relaying their comm traffic.',
            strategyTag: 'Active Technical Aid',
            scoreDelta: 50,
            alienResponse: 'Fault stress is dropping by 78%! The Imperial Guard does not forget a debt of honor, Captain.',
          },
          {
            label: 'Transmit engineering schematics so their crew can perform the repairs themselves.',
            strategyTag: 'Passive Advisory',
            scoreDelta: 25,
            alienResponse: 'Your schematics are useful, though we expected hands-on help from a flagship.',
          },
          {
            label: 'Decline involvement to conserve warp core reserves.',
            strategyTag: 'Isolationist Refusal',
            scoreDelta: -10,
            alienResponse: 'So much for Federation camaraderie. We will handle the ice-quakes ourselves.',
          },
        ],
      },
    ],
  },
];

const ANOMALY_PHENOMENA: Array<{
  anomalyType: 'Emission Nebula' | 'Supernova Remnant' | 'Millisecond Pulsar' | 'Quantum Singularity';
  anomalyClass: string;
  conceptTitle: string;
  formulaOrLaw: string;
  summary: string;
  exhibitionFact: string;
  targetWavelengthNm: number;
  targetRedshiftZ: number;
  radiationFluxSvHr: number;
  optimalMultipoleOrder: number;
  optimalMagneticTesla: number;
  spectralLines: {
    element: string;
    wavelengthNm: number;
    lineType: 'Balmer H-Alpha' | 'Forbidden O-III' | 'Helium-II' | 'Iron K-Shell X-Ray';
    colorHex: string;
  }[];
}> = [
  {
    anomalyType: 'Emission Nebula',
    anomalyClass: 'Class-IV Ionized H-II Star-Forming Cloud',
    conceptTitle: 'Atomic Spectroscopy & Balmer H-Alpha Recombination',
    formulaOrLaw: '1/λ = R_H · (1/2² - 1/n²)   |   λ(Hα) = 656.28 nm',
    summary: 'Ultraviolet photons from newborn O-type stars photoionize surrounding hydrogen gas. As free electrons recombine and cascade from energy level n=3 to n=2, they emit characteristic red Balmer H-Alpha photons at 656.3 nm alongside doubly ionized oxygen [O III] at 500.7 nm.',
    exhibitionFact: 'Real astronomers use Fraunhofer absorption and emission lines like cosmic barcodes: every chemical element absorbs and emits light at exact quantum wavelengths, revealing the composition, temperature, and Doppler velocity of nebulae thousands of light-years away.',
    targetWavelengthNm: 656.3,
    targetRedshiftZ: 0.018,
    radiationFluxSvHr: 4.2,
    optimalMultipoleOrder: 4,
    optimalMagneticTesla: 12.5,
    spectralLines: [
      { element: 'Hydrogen (H-Alpha n=3→2)', wavelengthNm: 656.3, lineType: 'Balmer H-Alpha', colorHex: '#ef4444' },
      { element: 'Doubly Ionized Oxygen [O III]', wavelengthNm: 500.7, lineType: 'Forbidden O-III', colorHex: '#10b981' },
      { element: 'Ionized Helium (He II)', wavelengthNm: 468.6, lineType: 'Helium-II', colorHex: '#38bdf8' },
    ],
  },
  {
    anomalyType: 'Supernova Remnant',
    anomalyClass: 'Type II Core-Collapse Shockfront Shell',
    conceptTitle: 'Synchrotron Shock Acceleration & Heavy Nucleosynthesis',
    formulaOrLaw: 'E_max ∝ Z · e · B · R_shock · (v_shock / c)',
    summary: 'When a massive star (>8 solar masses) exhausts its core nuclear fuel, gravitational collapse triggers a rebound shockwave moving at 10,000 km/s, forging iron-peak elements and accelerating relativistic cosmic rays through Fermi shock acceleration.',
    exhibitionFact: 'The calcium in human bones and the iron in our blood\'s hemoglobin were synthesized inside ancient supernova explosions and dispersed across the galaxy by shockwaves just like the remnant your sensors are analyzing.',
    targetWavelengthNm: 500.7,
    targetRedshiftZ: 0.034,
    radiationFluxSvHr: 18.6,
    optimalMultipoleOrder: 6,
    optimalMagneticTesla: 22.0,
    spectralLines: [
      { element: 'Iron XXV K-Alpha X-Ray', wavelengthNm: 185.0, lineType: 'Iron K-Shell X-Ray', colorHex: '#a855f7' },
      { element: 'Forbidden Oxygen [O III]', wavelengthNm: 500.7, lineType: 'Forbidden O-III', colorHex: '#10b981' },
      { element: 'Hydrogen Balmer H-Alpha', wavelengthNm: 656.3, lineType: 'Balmer H-Alpha', colorHex: '#ef4444' },
    ],
  },
  {
    anomalyType: 'Millisecond Pulsar',
    anomalyClass: 'Relativistic Magnetar Neutron Star (B = 10¹⁰ Tesla)',
    conceptTitle: 'Conservation of Angular Momentum & Magnetic Dipole Radiation',
    formulaOrLaw: 'L = I · ω = const   |   P_rad = (2 / 3c³) · m̈²',
    summary: 'A city-sized neutron star (~20 km diameter) containing 1.4 solar masses crushed to nuclear density. Conservation of angular momentum spins the collapsed core hundreds of times per second, sweeping lighthouse beams of coherent synchrotron radiation across space.',
    exhibitionFact: 'A single teaspoon of neutron star matter weighs approximately 1 billion metric tons on Earth, and millisecond pulsars keep time more accurately than atomic clocks—enabling spacecraft X-ray pulsar navigation (XNAV).',
    targetWavelengthNm: 468.6,
    targetRedshiftZ: 0.012,
    radiationFluxSvHr: 32.4,
    optimalMultipoleOrder: 8,
    optimalMagneticTesla: 28.5,
    spectralLines: [
      { element: 'Ionized Helium Cyclotron Line', wavelengthNm: 468.6, lineType: 'Helium-II', colorHex: '#38bdf8' },
      { element: 'Iron K-Shell Synchrotron Peak', wavelengthNm: 185.0, lineType: 'Iron K-Shell X-Ray', colorHex: '#a855f7' },
      { element: 'Hydrogen Lyman/Balmer Edge', wavelengthNm: 656.3, lineType: 'Balmer H-Alpha', colorHex: '#ef4444' },
    ],
  },
  {
    anomalyType: 'Quantum Singularity',
    anomalyClass: 'Kerr-Newman Rotating Micro-Singularity',
    conceptTitle: 'General Relativistic Gravitational Redshift & Event Horizons',
    formulaOrLaw: 'R_s = 2GM / c²   |   z_grav = (1 - R_s / r)^(-1/2) - 1',
    summary: 'A localized spacetime curvature where mass-energy is compressed within its Schwarzschild radius. Photons climbing out of the steep gravitational potential well lose energy, shifting their spectral wavelengths toward the red end of the spectrum (gravitational redshift).',
    exhibitionFact: 'Einstein\'s General Relativity predicts that clocks tick slower in strong gravitational fields (gravitational time dilation)—an effect that real GPS satellites orbiting Earth must correct by 38 microseconds every single day.',
    targetWavelengthNm: 656.3,
    targetRedshiftZ: 0.062,
    radiationFluxSvHr: 41.0,
    optimalMultipoleOrder: 8,
    optimalMagneticTesla: 34.0,
    spectralLines: [
      { element: 'Redshifted H-Alpha Accretion Ring', wavelengthNm: 656.3, lineType: 'Balmer H-Alpha', colorHex: '#ef4444' },
      { element: 'Relativistic Iron K-Line', wavelengthNm: 185.0, lineType: 'Iron K-Shell X-Ray', colorHex: '#a855f7' },
      { element: 'Ionized He-II Ergosphere Jet', wavelengthNm: 468.6, lineType: 'Helium-II', colorHex: '#38bdf8' },
    ],
  },
];

const MAGNETOSPHERE_CRISES: Array<{
  crisisType: 'Coronal Mass Ejection Impact' | 'Geomagnetic Core Dynamo Collapse' | 'Runaway Ionospheric Stripping';
  conceptTitle: string;
  formulaOrLaw: string;
  summary: string;
  exhibitionFact: string;
  solarWindPressureNpa: number;
  magneticFieldStrengthUt: number;
  ionEscapeRateKgSec: number;
  recommendedParticle: 'Positron Stream' | 'Graviton Pulse' | 'Baryon Sweep' | 'Inverse Tachyon Beam';
  targetResonanceGhz: number;
  targetApertureDeg: number;
}> = [
  {
    crisisType: 'Coronal Mass Ejection Impact',
    conceptTitle: 'Magnetohydrodynamics (MHD) & Lorentz Force Deflection',
    formulaOrLaw: 'F_Lorentz = q · (E + v × B)   |   P_ram = ρ_sw · v_sw² ≈ B² / (2μ₀)',
    summary: 'A massive solar coronal mass ejection (CME) is slamming into the planet\'s magnetosphere at 1,800 km/s. When solar wind ram pressure exceeds magnetic pressure at the magnetopause, magnetic reconnection strips the ozone layer and floods the biosphere with energetic protons.',
    exhibitionFact: 'Earth\'s magnetic field acts as a planetary Lorentz force shield, deflecting charged solar wind particles toward the poles where they excite oxygen and nitrogen atoms to create the Aurora Borealis and Aurora Australis.',
    solarWindPressureNpa: 54.2,
    magneticFieldStrengthUt: 12.4,
    ionEscapeRateKgSec: 1680,
    recommendedParticle: 'Positron Stream',
    targetResonanceGhz: 42.5,
    targetApertureDeg: 28,
  },
  {
    crisisType: 'Geomagnetic Core Dynamo Collapse',
    conceptTitle: 'Planetary Geodynamo & Magnetic Induction Equation',
    formulaOrLaw: '∂B/∂t = ∇ × (v × B) + η∇²B   (Magnetic Reynolds Number R_m ≫ 1)',
    summary: 'Convective circulation in the planet\'s liquid iron-nickel outer core is stalling due to mantle thermal stratification. Without a self-sustaining Coriolis geodynamo, the planetary dipole field is decaying exponentially, exposing the surface ocean to cosmic radiation.',
    exhibitionFact: 'Mars lost its global magnetic dynamo roughly 4 billion years ago as its smaller core cooled; without magnetic protection, the solar wind gradually sputtered away most of Mars\'s ancient thick atmosphere into space.',
    solarWindPressureNpa: 31.8,
    magneticFieldStrengthUt: 6.8,
    ionEscapeRateKgSec: 2150,
    recommendedParticle: 'Graviton Pulse',
    targetResonanceGhz: 58.0,
    targetApertureDeg: 18,
  },
  {
    crisisType: 'Runaway Ionospheric Stripping',
    conceptTitle: 'Ionospheric Plasma Cyclotron Resonance & Escape Velocity',
    formulaOrLaw: 'ω_c = |q|·B / m   |   v_esc = √(2GM / R)',
    summary: 'Extreme ultraviolet (XUV) stellar flares are super-heating the exoplanet\'s upper thermosphere and ionosphere, accelerating oxygen and hydrogen ions above planetary escape velocity through ambipolar electric field outflow.',
    exhibitionFact: 'In plasma physics, charged particles spiral tightly around magnetic field lines at their Cyclotron Resonance Frequency (ω_c = qB/m). Injecting a tuned harmonic carrier wave traps escaping ions in closed magnetic bottle loops.',
    solarWindPressureNpa: 44.0,
    magneticFieldStrengthUt: 14.5,
    ionEscapeRateKgSec: 1940,
    recommendedParticle: 'Baryon Sweep',
    targetResonanceGhz: 36.2,
    targetApertureDeg: 34,
  },
];

// ============================================================================
// 2. PROCEDURAL MISSION GENERATOR
// ============================================================================

let missionCounter = 100;

export function generateProceduralStarfleetMission(
  systems: SolarSystem[],
  currentSystemId?: string,
  preferredArchetype?: MissionArchetype
): StarfleetMission {
  missionCounter++;
  const archetypes: MissionArchetype[] = [
    'first_contact',
    'anomaly_investigation',
    'planetary_defense',
    'magnetosphere_rescue',
  ];

  const archetype =
    preferredArchetype || archetypes[Math.floor(Math.random() * archetypes.length)];

  // Filter valid systems with planets (excluding empty void sectors if possible, or including them for anomalies)
  const populatedSystems = systems.filter((s) => s.planets && s.planets.length > 0);
  const candidateSystems = populatedSystems.length > 0 ? populatedSystems : systems;

  // Pick a random system and planet
  let targetSystem = candidateSystems[Math.floor(Math.random() * candidateSystems.length)];
  let targetPlanet: PlanetData =
    targetSystem.planets[Math.floor(Math.random() * targetSystem.planets.length)];

  const difficulty = (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const baseXp = 350 + difficulty * 160;
  const stardate = (47410 + Math.random() * 500).toFixed(1);

  // Offset waypoint coordinates safely in orbital proximity of the target planet
  const r = Math.max(targetPlanet.radius || 35, 30);
  const angle = Math.random() * Math.PI * 2;
  const standoff = r * 2.8 + 150;
  const waypointCoords: [number, number, number] = [
    Math.round(targetPlanet.position[0] + Math.cos(angle) * standoff),
    Math.round(targetPlanet.position[1] + 24),
    Math.round(targetPlanet.position[2] + Math.sin(angle) * standoff),
  ];

  if (archetype === 'first_contact') {
    const civ =
      FIRST_CONTACT_CIVILIZATIONS[
        Math.floor(Math.random() * FIRST_CONTACT_CIVILIZATIONS.length)
      ];
    // Try to match civilization's home/border system if available, or random frontier system
    const matchedSys = candidateSystems.find((s) => s.id === civ.preferredSystemId);
    if (matchedSys && matchedSys.planets.length > 0 && Math.random() < 0.65) {
      targetSystem = matchedSys;
      targetPlanet = matchedSys.planets[0];
      const pr = Math.max(targetPlanet.radius || 35, 30);
      waypointCoords[0] = Math.round(targetPlanet.position[0] + pr * 2.8 + 140);
      waypointCoords[1] = Math.round(targetPlanet.position[1] + 22);
      waypointCoords[2] = Math.round(targetPlanet.position[2] - 110);
    }

    const freqJitter = Math.round((Math.random() * 40 - 20) * 10) / 10;
    const targetFreqMhz = Number((civ.baseFreqMhz + freqJitter).toFixed(1));
    const targetAmplitudeDb = Math.round(55 + Math.random() * 35);
    const targetPhaseDeg = Math.round((Math.floor(Math.random() * 11) + 2) * 15); // 30 to 180 deg in 15-deg steps

    return {
      id: `mission_${missionCounter}_${Date.now()}`,
      title: `Operation Xenologue: ${civ.speciesName} Envoy`,
      stardate,
      archetype: 'first_contact',
      archetypeLabel: 'First Contact & Xenolinguistics',
      difficulty,
      baseXp,
      bonusObjectiveText: 'Achieve ≥ 92% Carrier Wave Lock & Peaceful Pareto-Optimal Accord',
      targetSystemId: targetSystem.id,
      targetSystemName: targetSystem.name,
      targetPlanetId: targetPlanet.id,
      targetPlanetName: targetPlanet.name,
      targetCoordinates: waypointCoords,
      status: 'briefing',
      scienceBriefing: {
        conceptTitle: 'Electromagnetic Wave Superposition & Xenolinguistic Information Theory',
        formulaOrLaw: 'y(t) = A · sin(2πf·t + φ)   |   λ = c / f   (21 cm H-I Line = 1420.4 MHz)',
        summary: `An encrypted subspace hail from the ${civ.vesselName} has been detected near ${targetPlanet.name}. Before opening visual diplomacy, your science officer must match the carrier wave's frequency (f), amplitude (A), and phase angle (φ) for constructive interference, then decode their mathematical syntax matrix.`,
        exhibitionFact: 'In real SETI (Search for Extraterrestrial Intelligence), scientists scan the "Water Hole" radio band between 1420 MHz (Neutral Hydrogen) and 1666 MHz (Hydroxyl OH), using universal prime numbers and atomic constants to bridge language barriers.',
      },
      firstContactData: {
        speciesId: civ.speciesId,
        speciesName: civ.speciesName,
        homeworld: civ.homeworld,
        vesselName: civ.vesselName,
        targetFreqMhz,
        targetAmplitudeDb,
        targetPhaseDeg,
        cipherSequence: [
          {
            prompt: 'Step 1 — Alien Math Handshake: [ 2 · 3 · 5 · 7 · 11 · ?? ] — Pick the next Prime Number:',
            scientificHint: '💡 Fun Science: Nature never makes Prime Numbers by accident! Sending 2, 3, 5, 7, 11, 13 proves to aliens that we are intelligent beings.',
            options: ['1101 (Prime Number 13 — Correct!)', '1100 (Number 12 — Divisible by 2,3,4,6)', '1111 (Number 15 — Divisible by 3,5)'],
            correctIndex: 0,
          },
          {
            prompt: 'Step 2 — Cosmic Ruler: [ Hydrogen Atom Radio Wave = ???? ] — Pick the universal wavelength:',
            scientificHint: '💡 Fun Science: Aliens don\'t know what a "meter" or "mile" is, so scientists use the 21.1 cm radio wave of Hydrogen—the most common atom in the universe!',
            options: ['21.1 cm (Universal Hydrogen Wave)', '500.7 nm (Green Oxygen Glow)', '1.00 AU (Earth-Sun Distance)'],
            correctIndex: 0,
          },
        ],
        diplomaticExchanges: civ.exchanges,
      },
    };
  }

  if (archetype === 'anomaly_investigation') {
    const phenom =
      ANOMALY_PHENOMENA[Math.floor(Math.random() * ANOMALY_PHENOMENA.length)];

    // If investigating an Emission Nebula, prefer systems that contain a cosmic nebula or colorful gas cloud
    if (phenom.anomalyType === 'Emission Nebula') {
      const nebulaSystems = candidateSystems.filter((s) =>
        s.planets.some((p) => p.type === 'nebula' || p.name.toLowerCase().includes('nebula') || p.name.toLowerCase().includes('patch'))
      );
      if (nebulaSystems.length > 0 && Math.random() < 0.7) {
        targetSystem = nebulaSystems[Math.floor(Math.random() * nebulaSystems.length)];
        const nebPlanet = targetSystem.planets.find((p) => p.type === 'nebula') || targetSystem.planets[0];
        targetPlanet = nebPlanet;
        const nr = Math.max(targetPlanet.radius || 45, 40);
        waypointCoords[0] = Math.round(targetPlanet.position[0] + Math.cos(angle) * (nr * 1.6 + 90));
        waypointCoords[1] = Math.round(targetPlanet.position[1] + 18);
        waypointCoords[2] = Math.round(targetPlanet.position[2] + Math.sin(angle) * (nr * 1.6 + 90));
      }
    }

    return {
      id: `mission_${missionCounter}_${Date.now()}`,
      title: `Deep-Space Survey: ${phenom.anomalyType} at ${targetPlanet.name}`,
      stardate,
      archetype: 'anomaly_investigation',
      archetypeLabel: 'Astrophysical Anomaly Investigation',
      difficulty,
      baseXp,
      bonusObjectiveText: 'Lock All 3 Element Color Lines & Launch 3D Probes in Green Window',
      targetSystemId: targetSystem.id,
      targetSystemName: targetSystem.name,
      targetPlanetId: targetPlanet.id,
      targetPlanetName: targetPlanet.name,
      targetCoordinates: waypointCoords,
      status: 'briefing',
      scienceBriefing: {
        conceptTitle: phenom.conceptTitle,
        formulaOrLaw: phenom.formulaOrLaw,
        summary: phenom.summary,
        exhibitionFact: phenom.exhibitionFact,
      },
      anomalyData: {
        anomalyType: phenom.anomalyType,
        anomalyClass: phenom.anomalyClass,
        spectralLines: phenom.spectralLines,
        targetWavelengthNm: phenom.targetWavelengthNm,
        targetRedshiftZ: phenom.targetRedshiftZ,
        radiationFluxSvHr: phenom.radiationFluxSvHr,
        optimalMultipoleOrder: phenom.optimalMultipoleOrder,
        optimalMagneticTesla: phenom.optimalMagneticTesla,
        probeResonanceWindowMin: 35,
        probeResonanceWindowMax: 68,
      },
    };
  }

  if (archetype === 'planetary_defense') {
    const factions: Array<{ faction: EnemyFaction; displayName: string; baseFreq: number }> = [
      { faction: 'klingon', displayName: 'Klingon Raider Strike Wing', baseFreq: 264.5 },
      { faction: 'romulan', displayName: 'Romulan Plasma Warbird Cell', baseFreq: 312.0 },
      { faction: 'gorn', displayName: 'Gorn Hegemony Siege Flotilla', baseFreq: 228.4 },
    ];
    const pickedFaction = factions[Math.floor(Math.random() * factions.length)];
    const disruptorFreqThz = Number((pickedFaction.baseFreq + (Math.floor(Math.random() * 16) - 8) * 2.5).toFixed(1));
    const optimalNutationDeg = [45, 90, 135, 180][Math.floor(Math.random() * 4)];
    const enemyWaveCount = Math.min(5, 2 + Math.floor(difficulty / 2));

    return {
      id: `mission_${missionCounter}_${Date.now()}`,
      title: `Planetary Defense: Shield ${targetPlanet.name} Outpost`,
      stardate,
      archetype: 'planetary_defense',
      archetypeLabel: 'Planetary Defense (Enemy Wave)',
      difficulty,
      baseXp: baseXp + 100,
      bonusObjectiveText: 'Tune Shield Harmonics ≥ 90% & Preserve Outpost Integrity above 75%',
      targetSystemId: targetSystem.id,
      targetSystemName: targetSystem.name,
      targetPlanetId: targetPlanet.id,
      targetPlanetName: targetPlanet.name,
      targetCoordinates: waypointCoords,
      status: 'briefing',
      scienceBriefing: {
        conceptTitle: 'Multiphasic Wave Reflection, Impedance Matching & Tactical Optics',
        formulaOrLaw: 'R = |(Z₂ - Z₁) / (Z₂ + Z₁)|²   |   Δφ = 180° (Destructive Phase Cancellation)',
        summary: `Long-range tachyon sensors detect an incoming ${pickedFaction.displayName} converging on ${targetPlanet.name} Research Outpost. By matching the Enterprise's multiphasic shield frequency to the hostiles' ${disruptorFreqThz} THz directed-energy emitters, our shields reflect up to 65% of incoming plasma energy.`,
        exhibitionFact: 'Anti-reflective optical coatings, noise-canceling headphones, and electromagnetic stealth metamaterials all rely on wave phase cancellation and impedance matching—tuning a barrier\'s resonant frequency to neutralize incoming energy waves.',
      },
      defenseData: {
        hostileFaction: pickedFaction.faction,
        factionDisplayName: pickedFaction.displayName,
        enemyWaveCount,
        disruptorFreqThz,
        optimalShieldFreqThz: disruptorFreqThz,
        optimalNutationDeg,
        outpostName: `${targetPlanet.name} Astrophysical Observatory`,
        planetIntegrityPercent: 100,
      },
    };
  }

  // Archetype 4: Planetary Magnetosphere & Ecological Rescue
  const crisis =
    MAGNETOSPHERE_CRISES[Math.floor(Math.random() * MAGNETOSPHERE_CRISES.length)];

  return {
    id: `mission_${missionCounter}_${Date.now()}`,
    title: `Ecological Rescue: ${targetPlanet.name} Magnetosphere`,
    stardate,
    archetype: 'magnetosphere_rescue',
    archetypeLabel: 'Planetary Magnetosphere & Ecological Rescue',
    difficulty,
    baseXp,
    bonusObjectiveText: 'Calibrate Deflector Cyclotron Beam ≥ 92% & Restore Planetary Dipole to 100%',
    targetSystemId: targetSystem.id,
    targetSystemName: targetSystem.name,
    targetPlanetId: targetPlanet.id,
    targetPlanetName: targetPlanet.name,
    targetCoordinates: waypointCoords,
    status: 'briefing',
    scienceBriefing: {
      conceptTitle: crisis.conceptTitle,
      formulaOrLaw: crisis.formulaOrLaw,
      summary: `${targetPlanet.name} in the ${targetSystem.name} is experiencing a critical ${crisis.crisisType}. You must pilot the Enterprise into low orbital proximity, configure the Main Navigational Deflector Dish to emit a high-energy ${crisis.recommendedParticle}, and lock cyclotron resonance at ${crisis.targetResonanceGhz} GHz to re-stabilize the magnetosphere.`,
      exhibitionFact: crisis.exhibitionFact,
    },
    magnetosphereData: {
      crisisType: crisis.crisisType,
      solarWindPressureNpa: crisis.solarWindPressureNpa,
      magneticFieldStrengthUt: crisis.magneticFieldStrengthUt,
      ionEscapeRateKgSec: crisis.ionEscapeRateKgSec,
      recommendedParticle: crisis.recommendedParticle,
      targetResonanceGhz: crisis.targetResonanceGhz,
      targetApertureDeg: crisis.targetApertureDeg,
    },
  };
}

// ============================================================================
// 3. PERFORMANCE-BASED XP & GRADE EVALUATION ENGINE
// ============================================================================

export function calculateMissionPerformanceReport(
  mission: StarfleetMission,
  metrics: {
    accuracyScore: number;           // 0 to 100
    tacticalEfficiencyScore: number; // 0 to 100 (e.g. hull integrity & shield management)
    diplomaticOrScienceScore: number;// 0 to 100
    elapsedSeconds: number;
    bonusCompleted: boolean;
  },
  previousProgression: PlayerProgression
): MissionPerformanceReport {
  const accuracy = Math.max(0, Math.min(100, Math.round(metrics.accuracyScore)));
  const tactical = Math.max(0, Math.min(100, Math.round(metrics.tacticalEfficiencyScore)));
  const outcome = Math.max(0, Math.min(100, Math.round(metrics.diplomaticOrScienceScore)));

  const compositeScore = accuracy * 0.4 + outcome * 0.35 + tactical * 0.25 + (metrics.bonusCompleted ? 5 : 0);

  let grade: 'S' | 'A' | 'B' | 'C' = 'B';
  if (compositeScore >= 90) {
    grade = 'S';
  } else if (compositeScore >= 78) {
    grade = 'A';
  } else if (compositeScore >= 62) {
    grade = 'B';
  } else {
    grade = 'C';
  }

  const baseXpEarned = mission.baseXp;
  const accuracyBonusXp = Math.round((accuracy / 100) * (180 + mission.difficulty * 45));
  const tacticalBonusXp = Math.round((tactical / 100) * (140 + mission.difficulty * 35));
  const speedBonus = metrics.elapsedSeconds <= 180 ? 150 : metrics.elapsedSeconds <= 300 ? 85 : 40;
  const speedBonusXp = speedBonus + (metrics.bonusCompleted ? 180 : 0);

  const totalXpEarned = baseXpEarned + accuracyBonusXp + tacticalBonusXp + speedBonusXp;

  const previousXp = previousProgression.xp;
  const newXp = previousXp + totalXpEarned;
  const thresholds = [0, 500, 1300, 2500, 4200, 6800, 10500, 16000];
  const ranks: PlayerProgression['rank'][] = [
    'Ensign',
    'Lieutenant',
    'Lt Commander',
    'Commander',
    'Captain',
    'Fleet Captain',
    'Admiral',
  ];

  let newLevel = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (newXp >= thresholds[i]) {
      newLevel = i + 1;
    } else {
      break;
    }
  }
  newLevel = Math.min(7, newLevel);
  const newRank = ranks[Math.min(ranks.length - 1, newLevel - 1)];
  const nextLevelXp = thresholds[Math.min(thresholds.length - 1, newLevel)] || newLevel * 2500;

  return {
    missionId: mission.id,
    missionTitle: mission.title,
    archetype: mission.archetype,
    archetypeLabel: mission.archetypeLabel,
    difficulty: mission.difficulty,
    grade,
    accuracyScore: accuracy,
    tacticalEfficiencyScore: tactical,
    diplomaticOrScienceScore: outcome,
    elapsedSeconds: Math.max(1, Math.round(metrics.elapsedSeconds)),
    bonusCompleted: metrics.bonusCompleted,
    bonusObjectiveText: mission.bonusObjectiveText,
    baseXpEarned,
    accuracyBonusXp,
    tacticalBonusXp,
    speedBonusXp,
    totalXpEarned,
    previousXp,
    newXp,
    previousLevel: previousProgression.level,
    newLevel,
    previousRank: previousProgression.rank,
    newRank,
    nextLevelXp,
    promoted: newLevel > previousProgression.level,
    scientificConceptTitle: mission.scienceBriefing.conceptTitle,
    astrophysicsTakeaway: `${mission.scienceBriefing.summary} ${mission.scienceBriefing.exhibitionFact}`,
  };
}

// ============================================================================
// 4. ON-DEMAND 6-DIGIT OFFICER ID PROFILE REGISTRY (SCIENCE EXHIBITION SYSTEM)
// ============================================================================

const STORAGE_KEY = 'starfleet_exhibition_profiles_v1';

class OfficerProfileManager {
  private loadRegistry(): Record<string, OfficerProfileRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  private saveRegistry(registry: Record<string, OfficerProfileRecord>): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    } catch {
      // Ignore storage quota issues
    }
  }

  /**
   * Generates a unique 6-digit numeric code ONLY when explicitly requested by the user.
   * Also encodes a self-healing checksum/tier in the digits so even if entered on a fresh
   * exhibition kiosk, a valid 6-digit code can reconstruct the officer's progression!
   */
  public createNewProfile(
    callsign: string,
    progression: PlayerProgression,
    combatRating: number = 100
  ): OfficerProfileRecord {
    const registry = this.loadRegistry();

    // Generate unique 6-digit code (100000 - 999999)
    let code = '';
    for (let attempt = 0; attempt < 50; attempt++) {
      const randomPrefix = Math.floor(1000 + Math.random() * 8999); // 4 digits
      // Encode level (1..7) and XP hundred-tier into last 2 digits for portable fallback
      const xpTier = Math.min(9, Math.floor(progression.xp / 600));
      const lvlDigit = Math.min(7, Math.max(1, progression.level));
      const candidate = `${randomPrefix}${lvlDigit}${xpTier}`;
      if (!registry[candidate]) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      code = String(Math.floor(100000 + Math.random() * 899999));
    }

    const cleanCallsign = callsign.trim() || `OFFICER-${code.slice(0, 3)}`;
    const record: OfficerProfileRecord = {
      code,
      callsign: cleanCallsign.toUpperCase(),
      xp: progression.xp,
      level: progression.level,
      rank: progression.rank,
      missionsCompleted: 0,
      missionHistory: [],
      totalKills: progression.totalEnemiesDestroyed || 0,
      scoutsDestroyed: progression.scoutsDestroyed || 0,
      cruisersDestroyed: progression.cruisersDestroyed || 0,
      mothershipsDestroyed: progression.mothershipsDestroyed || 0,
      combatRating: combatRating || 100,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    registry[code] = record;
    this.saveRegistry(registry);
    return record;
  }

  /**
   * Restores an Officer Profile from a 6-digit numeric code.
   */
  public restoreProfile(rawCode: string): OfficerProfileRecord | null {
    const cleaned = rawCode.replace(/\D/g, '').trim();
    if (cleaned.length !== 6) return null;

    const registry = this.loadRegistry();
    if (registry[cleaned]) {
      return registry[cleaned];
    }

    // Portable Exhibition Kiosk Fallback:
    // If the visitor enters their valid 6-digit code on a different browser/kiosk where localStorage
    // doesn't have the key yet, reconstruct their level/XP from the encoded 5th & 6th digits!
    const lvlDigit = parseInt(cleaned[4], 10);
    const xpTier = parseInt(cleaned[5], 10);
    const thresholds = [0, 500, 1300, 2500, 4200, 6800, 10500, 16000];
    const ranks: PlayerProgression['rank'][] = [
      'Ensign',
      'Lieutenant',
      'Lt Commander',
      'Commander',
      'Captain',
      'Fleet Captain',
      'Admiral',
    ];

    const restoredLevel = Math.min(7, Math.max(1, isNaN(lvlDigit) ? 1 : lvlDigit));
    const baseLevelXp = thresholds[restoredLevel - 1] || 0;
    const restoredXp = Math.max(baseLevelXp, xpTier * 600);
    const restoredRank = ranks[restoredLevel - 1] || 'Ensign';

    const portableRecord: OfficerProfileRecord = {
      code: cleaned,
      callsign: `STARFLEET-${cleaned.slice(0, 3)}`,
      xp: restoredXp,
      level: restoredLevel,
      rank: restoredRank,
      missionsCompleted: Math.max(0, restoredLevel - 1),
      missionHistory: [],
      totalKills: (restoredLevel - 1) * 3,
      scoutsDestroyed: restoredLevel - 1,
      cruisersDestroyed: Math.max(0, restoredLevel - 1),
      mothershipsDestroyed: restoredLevel >= 4 ? 1 : 0,
      combatRating: 100 + (restoredLevel - 1) * 15,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    registry[cleaned] = portableRecord;
    this.saveRegistry(registry);
    return portableRecord;
  }

  /**
   * Updates an active 6-digit profile whenever XP, rank, or mission history changes.
   */
  public syncProfile(
    code: string,
    progression: PlayerProgression,
    combatRating: number,
    completedMission?: {
      id: string;
      title: string;
      archetype: MissionArchetype;
      grade: 'S' | 'A' | 'B' | 'C';
      xpEarned: number;
    }
  ): OfficerProfileRecord | null {
    if (!code || code.length !== 6) return null;
    const registry = this.loadRegistry();
    const existing = registry[code];
    if (!existing) return null;

    const nextHistory = [...(existing.missionHistory || [])];
    let nextCompleted = existing.missionsCompleted || 0;
    if (completedMission && !nextHistory.some((m) => m.id === completedMission.id)) {
      nextHistory.unshift({
        ...completedMission,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      nextCompleted += 1;
    }

    const updated: OfficerProfileRecord = {
      ...existing,
      xp: progression.xp,
      level: progression.level,
      rank: progression.rank,
      missionsCompleted: nextCompleted,
      missionHistory: nextHistory.slice(0, 25),
      totalKills: progression.totalEnemiesDestroyed,
      scoutsDestroyed: progression.scoutsDestroyed,
      cruisersDestroyed: progression.cruisersDestroyed,
      mothershipsDestroyed: progression.mothershipsDestroyed,
      combatRating,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    registry[code] = updated;
    this.saveRegistry(registry);
    return updated;
  }

  public getProfile(code: string): OfficerProfileRecord | null {
    const registry = this.loadRegistry();
    return registry[code] || null;
  }

  public getAllProfiles(): OfficerProfileRecord[] {
    const registry = this.loadRegistry();
    return Object.values(registry).sort((a, b) => b.xp - a.xp);
  }
}

export const officerProfileStore = new OfficerProfileManager();
