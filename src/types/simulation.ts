export type CameraViewMode = 
  | 'chase'            // Third-person trailing camera
  | 'bridge'           // Helm / bridge viewscreen POV
  | 'interior_bridge'  // Full 3D interior bridge cabin
  | 'cinematic'        // Sweeping cinematic flyby
  | 'saucer'           // Upper Saucer deck looking forward
  | 'nacelle'          // Mounted on starboard nacelle
  | 'deflector'        // Forward angle beneath deflector
  | 'spacedock_bay'    // Spacedock Interior Hangar Bay looking out to Earth
  | 'beauty'           // 3/4 Starfleet Showcase beauty angle
  | 'bow'              // Front Bow view
  | 'stern'            // Aft Stern view
  | 'registry'         // NCC-1701 Hull Close-up
  | 'orbit';           // Free 360° inspection orbit

export type AlertLevel = 'green' | 'yellow' | 'red';

export interface SolarSystem {
  id: string;
  name: string;
  quadrant: string;
  primaryStar: string;
  spectralType: string;
  centerCoordinates: [number, number, number];
  description: string;
  planets: PlanetData[];
  isWarZone?: boolean;
  territory?: 'federation' | 'non_federation';
  affiliation?: string;
}

export interface PlanetData {
  id: string;
  name: string;
  systemId: string;
  type: 'terran' | 'gas_giant' | 'desert' | 'ice' | 'volcanic' | 'ocean' | 'starbase' | 'moon' | 'anomaly' | 'nebula' | 'wormhole';
  radius: number;
  position: [number, number, number];
  textureColor: string;
  atmosphereColor?: string;
  hasRings?: boolean;
  ringInner?: number;
  ringOuter?: number;
  ringColor?: string;
  description: string;
  orbitalPeriod?: number;
  parentPlanetId?: string;
  orbitalRadius?: number;
}

export interface CollisionSafetyTelemetry {
  targetCoordinates: [number, number, number];
  safeCoordinates: [number, number, number];
  isOffsetApplied: boolean;
  clearanceDistance: number;
  standoffObject?: {
    id: string;
    name: string;
    type: string;
    radius: number;
  };
  approachVector: [number, number, number];
}

export interface CoursePlot {
  targetSystem: SolarSystem;
  targetPlanet: PlanetData;
  destinationPos: [number, number, number];
  requestedCoords?: [number, number, number];
  distance: number;
  etaSeconds: number;
  isEngaged: boolean;
  phase: 'aligning' | 'warping' | 'arrival' | 'standard_orbit';
  safetyTelemetry?: CollisionSafetyTelemetry;
  customCoordinatesTarget?: boolean;
}

export type EnemyFaction = 'klingon' | 'romulan' | 'gorn';

export interface EnemyShipState {
  id: string;
  name: string;
  faction: EnemyFaction;
  shipClass: string;
  position: [number, number, number];
  distanceToPlayer: number;
  shieldPercent: number;
  hullPercent: number;
  isAlive: boolean;
  isHostile: boolean;
  state: 'patrol' | 'engaging' | 'evading';
  isMothership?: boolean;
  rank?: string;
  isElite?: boolean;
  isCloaked?: boolean;
}

export interface AdaptiveCombatMetrics {
  combatRating: number;              // 0 to 250+ (100 baseline)
  playerSuccessRate: number;         // 0 to 100% computed success rate
  skillTier: 'Cadet' | 'Officer' | 'Veteran' | 'Ace' | 'Legendary';
  winStreak: number;
  totalKills: number;
  playerAccuracyPercent: number;     // e.g. 78%
  recentAccuracy?: number;           // Recent combat accuracy percentage
  damageEfficiencyRatio: number;     // damage dealt / damage taken
  adaptiveDamageMultiplier: number;  // 1.0 to 2.4x
  fleetIntelligenceTier: 'Standard' | 'Tactical' | 'Coordinated' | 'Predictive' | 'Apex Swarm';
  fleetIntelligenceLevel: number;    // 1 to 5
  evasionEfficacyPercent: number;    // % of enemy torpedoes successfully avoided
  flankingAggression: number;        // 1.0 to 2.5x flanking speed
  predictiveLeadAim: boolean;        // Whether hostiles lead fire ahead of player
  averageTimeToKill: number;         // Seconds per enemy vessel
}

export interface PlayerProgression {
  level: number;
  rank: 'Ensign' | 'Lieutenant' | 'Lt Commander' | 'Commander' | 'Captain' | 'Fleet Captain' | 'Admiral';
  xp: number;
  nextLevelXp: number;
  totalEnemiesDestroyed: number;
  scoutsDestroyed: number;
  cruisersDestroyed: number;
  mothershipsDestroyed: number;
  activeThreatLevel: 'Standard' | 'Elevated' | 'Severe' | 'Critical' | 'Extreme' | 'Lethal';
}

export interface CombatWaveState {
  level: number;
  status: 'active' | 'cleared' | 'standby';
  activeFaction: EnemyFaction;
  countdown: number;
  totalEnemiesInWave: number;
  enemiesAlive: number;
  mothershipAlive: boolean;
  sectorStatusText: string;
  threatLevel: 'Standard' | 'Elevated' | 'Severe' | 'Critical' | 'Extreme' | 'Lethal';
  difficultyModifier: string;
  armorMultiplier: number;
  firepowerMultiplier: number;
  adaptiveDifficulty?: AdaptiveCombatMetrics;
  progression?: PlayerProgression;
}

export interface TacticalLogEvent {
  id: string;
  timestamp: string;
  stardate: string;
  category: 'WEAPONS' | 'DEFENSE' | 'TACTICAL' | 'NAVIGATION' | 'DAMAGE' | 'SECTOR';
  type: 'info' | 'warning' | 'critical' | 'success' | 'combat';
  message: string;
  details?: string;
}

export interface DefeatStats {
  waveReached: number;
  totalKills: number;
  scoutsDestroyed: number;
  cruisersDestroyed: number;
  mothershipsDestroyed: number;
  combatRating: number;
  skillTier: string;
  accuracyPercent: number;
  evasionPercent: number;
  stardate: string;
  systemName: string;
}

export interface ShipState {
  // Flight dynamics
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  forwardDirection?: { x: number; y: number; z: number };
  rightDirection?: { x: number; y: number; z: number };
  headingAngle?: number;       // Ship yaw angle in horizontal plane
  speed: number;               // Current speed in km/s (impulse) or C multiplier (warp)
  targetSpeed: number;
  throttlePercent: number;     // 0 to 100%
  isWarping: boolean;
  warpFactor: number;          // 1.0 to 9.9
  warpCharge: number;          // 0 to 1 during jump sequence
  flightAssist: boolean;       // Active flight stabilization
  cameraZoom?: number;         // 0.4 to 2.5 POV zoom level
  isBoostActive?: boolean;     // Evasive thruster overdrive
  boostDuration?: number;      // Seconds remaining on boost
  boostCharge?: number;        // 0 to 100% recharge
  
  // Tactical & health / damage
  alertLevel: AlertLevel;
  shieldsRaised: boolean;
  shieldIntegrity: number;     // 0 to 100%
  hullIntegrity: number;       // 0 to 100%
  isDestroyed?: boolean;       // True when catastrophic core breach occurs
  defeatStats?: DefeatStats;   // Summary for game-over / recommission screen
  warpCoreOutput: number;      // 0 to 100%
  impulsePower: number;        // 0 to 100%
  lastDamageTimestamp: number; // for screen shake and shield flare
  isUnderAttack: boolean;
  hasIncomingTorpedo?: boolean;
  
  // Weapons
  isFiringPhasers: boolean;
  torpedoCount: number;
  phaserEnergy: number;        // 0 to 100%
  
  // Navigation & Solar Systems
  stardate?: string;
  currentSystemId: string;
  currentSystemName: string;
  selectedTargetId: string | null;
  selectedTargetPosition?: [number, number, number];
  lockedEnemy: EnemyShipState | null;
  activeCoursePlot: CoursePlot | null;
  autoPilotToTarget: boolean;
  combatWaveState?: CombatWaveState;
  adaptiveDifficulty?: AdaptiveCombatMetrics;
  progression?: PlayerProgression;

  // Space Station & Drydock Refit / Rearm
  isDocked?: boolean;
  dockedStationId?: string;
  dockedStationName?: string;
  canDockAtStation?: {
    id: string;
    name: string;
    distance: number;
    systemName?: string;
  } | null;
  dockingState?: StarbaseDockingState | null;
  navTrajectory?: {
    targetName: string;
    distance: number;
    hasArrived: boolean;
    isNear: boolean;
  } | null;
  blackHoleTransit?: {
    active: boolean;
    phase: 'pulling' | 'infall' | 'singularity' | 'ejection';
    progress: number;
    distance: number;
  } | null;
  stationOperations?: StationOperationsState | null;
  missionWaypoint?: MissionWaypointTelemetry | null;
  activeOfficerCode?: string | null;
  bridgeStation?: BridgeStationId;
  viewscreenTargetId?: string | null;
  viewscreenTargetBearingDeg?: number;
  viewscreenZoom?: number;
}

export type BridgeStationId =
  | 'captain'
  | 'helm'
  | 'tactical'
  | 'science'
  | 'comms'
  | 'engineering'
  | 'overview';

export interface BridgeCrewAdvisory {
  id: string;
  station: BridgeStationId;
  officerName: string;
  officerRank: string;
  officerRole: string;
  uniformColor: 'command_gold' | 'science_blue' | 'operations_red' | 'tactical_amber';
  urgency: 'routine' | 'priority' | 'critical';
  title: string;
  recommendation: string;
  scientificContext?: string;
  manualControlLabel: string;
  delegateOrderLabel: string;
  actionType:
    | 'combat_defense'
    | 'science_sweep'
    | 'comms_hail'
    | 'helm_maneuver'
    | 'engineering_boost';
  timestamp: number;
}

export type MissionArchetype =
  | 'first_contact'
  | 'anomaly_investigation'
  | 'planetary_defense'
  | 'magnetosphere_rescue';

export type MissionStatus =
  | 'briefing'
  | 'en_route'
  | 'in_proximity'
  | 'workstation_active'
  | 'combat_active'
  | 'completed'
  | 'failed';

export interface MissionWaypointTelemetry {
  missionId: string;
  missionTitle: string;
  archetype: MissionArchetype;
  difficulty: number;
  targetName: string;
  systemName: string;
  systemId: string;
  targetCoordinates: [number, number, number];
  distanceKm: number;
  bearingDeg: number;     // -180 to +180 degrees relative to ship nose
  elevationDeg: number;   // -90 to +90 degrees pitch relative to ship nose
  isInProximity: boolean; // True when distanceKm <= 480
  status: MissionStatus;
  shieldHarmonicEfficiency?: number;
  defendedPlanetIntegrity?: number;
}

export interface FirstContactMissionData {
  speciesId: string;
  speciesName: string;
  homeworld: string;
  vesselName: string;
  targetFreqMhz: number;       // e.g. 1420.4 MHz (Hydrogen line) or subspace band
  targetAmplitudeDb: number;   // e.g. 68 dB
  targetPhaseDeg: number;      // e.g. 135 deg
  cipherSequence: {
    prompt: string;
    scientificHint: string;
    options: string[];
    correctIndex: number;
  }[];
  diplomaticExchanges: {
    alienHail: string;
    culturalContext: string;
    choices: {
      label: string;
      strategyTag: string;
      scoreDelta: number; // +40 optimal, +20 neutral, -10 escalatory
      alienResponse: string;
    }[];
  }[];
}

export interface AnomalyInvestigationData {
  anomalyType: 'Emission Nebula' | 'Supernova Remnant' | 'Millisecond Pulsar' | 'Quantum Singularity';
  anomalyClass: string;
  spectralLines: {
    element: string;
    wavelengthNm: number;
    lineType: 'Balmer H-Alpha' | 'Forbidden O-III' | 'Helium-II' | 'Iron K-Shell X-Ray';
    colorHex: string;
  }[];
  targetWavelengthNm: number;
  targetRedshiftZ: number;
  radiationFluxSvHr: number;
  optimalMultipoleOrder: number; // 2 (Dipole), 4 (Quadrupole), 6 (Sextupole), 8 (Octupole)
  optimalMagneticTesla: number;  // e.g. 14.5 T
  probeResonanceWindowMin: number; // e.g. 42%
  probeResonanceWindowMax: number; // e.g. 64%
}

export interface PlanetaryDefenseData {
  hostileFaction: EnemyFaction;
  factionDisplayName: string;
  enemyWaveCount: number;
  disruptorFreqThz: number;      // e.g. 284.6 THz
  optimalShieldFreqThz: number;  // e.g. 284.6 THz
  optimalNutationDeg: number;    // e.g. 90 deg
  outpostName: string;
  planetIntegrityPercent: number;
}

export interface MagnetosphereRescueData {
  crisisType: 'Coronal Mass Ejection Impact' | 'Geomagnetic Core Dynamo Collapse' | 'Runaway Ionospheric Stripping';
  solarWindPressureNpa: number;  // e.g. 48.5 nPa
  magneticFieldStrengthUt: number; // e.g. 11.2 uT (collapsing from 45 uT)
  ionEscapeRateKgSec: number;    // e.g. 1420 kg/s
  recommendedParticle: 'Positron Stream' | 'Graviton Pulse' | 'Baryon Sweep' | 'Inverse Tachyon Beam';
  targetResonanceGhz: number;    // e.g. 44.8 GHz
  targetApertureDeg: number;     // e.g. 28 deg
}

export interface StarfleetMission {
  id: string;
  title: string;
  stardate: string;
  archetype: MissionArchetype;
  archetypeLabel: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  baseXp: number;
  bonusObjectiveText: string;
  targetSystemId: string;
  targetSystemName: string;
  targetPlanetId: string;
  targetPlanetName: string;
  targetCoordinates: [number, number, number];
  status: MissionStatus;
  acceptedTimestamp?: number;
  scienceBriefing: {
    conceptTitle: string;
    formulaOrLaw: string;
    summary: string;
    exhibitionFact: string;
  };
  firstContactData?: FirstContactMissionData;
  anomalyData?: AnomalyInvestigationData;
  defenseData?: PlanetaryDefenseData;
  magnetosphereData?: MagnetosphereRescueData;
}

export interface MissionPerformanceReport {
  missionId: string;
  missionTitle: string;
  archetype: MissionArchetype;
  archetypeLabel: string;
  difficulty: number;
  grade: 'S' | 'A' | 'B' | 'C';
  accuracyScore: number;           // 0 to 100%
  tacticalEfficiencyScore: number; // 0 to 100%
  diplomaticOrScienceScore: number;// 0 to 100%
  elapsedSeconds: number;
  bonusCompleted: boolean;
  bonusObjectiveText: string;
  baseXpEarned: number;
  accuracyBonusXp: number;
  tacticalBonusXp: number;
  speedBonusXp: number;
  totalXpEarned: number;
  previousXp: number;
  newXp: number;
  previousLevel: number;
  newLevel: number;
  previousRank: PlayerProgression['rank'];
  newRank: PlayerProgression['rank'];
  nextLevelXp: number;
  promoted: boolean;
  scientificConceptTitle: string;
  astrophysicsTakeaway: string;
}

export interface OfficerProfileRecord {
  code: string; // 6-digit string e.g. "482915"
  callsign: string;
  xp: number;
  level: number;
  rank: PlayerProgression['rank'];
  missionsCompleted: number;
  missionHistory: {
    id: string;
    title: string;
    archetype: MissionArchetype;
    grade: 'S' | 'A' | 'B' | 'C';
    xpEarned: number;
    timestamp: string;
  }[];
  totalKills: number;
  scoutsDestroyed: number;
  cruisersDestroyed: number;
  mothershipsDestroyed: number;
  combatRating: number;
  updatedAt: string;
}

export interface StationOperationsState {
  isDocked: boolean;
  stationId: string;
  stationName: string;
  activeSubsystem: 'hull' | 'clamps' | 'antimatter' | 'torpedoes' | 'warp_core' | 'coolant' | 'crew';

  // 1. Hull Maintenance & Autonomous Repair Drones
  dronesDeployed: boolean;
  droneCount: number; // 1 to 4 drones
  repairMode: 'ablative' | 'structural' | 'microweld' | 'overhaul';
  repairRatePerSec: number; // e.g. 2.5% / sec
  hullIntegrity: number; // Live 0 to 100%
  scorchCleanedPercent: number; // 0 to 100%
  isRepairComplete: boolean;
  estimatedSecondsRemaining: number;

  // 2. Docking Clamps & Pressurization
  clampsEngaged: boolean;
  clampPressurePsi: number; // 0.0 to 14.7 PSI
  isPressurizing: boolean;
  shorePowerConnected: boolean;
  lifeSupportEqualized: boolean;

  // 3. Antimatter & Deuterium Refueling
  antimatterLevel: number; // 0 to 100%
  deuteriumLevel: number; // 0 to 100%
  isRefuelingAntimatter: boolean;
  isRefuelingDeuterium: boolean;
  containmentFieldIntegrity: number; // e.g. 99.98%
  antimatterFlowRate: number; // L/s

  // 4. Photon & Quantum Torpedo Resupply
  torpedoCount: number; // 0 to 30
  selectedTorpedoType: 'photon' | 'quantum' | 'tricobalt';
  isReloadingTorpedoes: boolean;
  launcher1Status: 'ready' | 'loading' | 'calibrated';
  launcher2Status: 'ready' | 'loading' | 'calibrated';

  // 5. Warp Core & Dilithium Matrix Diagnostics
  dilithiumFrequencyMhz: number; // 240.0 to 260.0 MHz, optimal 248.5
  dilithiumAlignmentPercent: number;
  intermixRatio: number; // 1.00 : 1.00
  plasmaInjectorsCleaned: boolean;
  isDiagnosticRunning: boolean;
  warpEfficiencyBonus: number; // +0 to +15%

  // 6. Reactor Coolant Purging
  coolantTempKelvin: number; // e.g. 340 K -> 118 K
  coolantToxicityPercent: number; // 65% -> 2%
  radiatorEfficiencyPercent: number; // 82% -> 99%
  isPurgingCoolant: boolean;

  // 7. Crew Transfers & Shore Leave
  crewTotal: number; // 430
  crewMoralePercent: number; // 75% -> 100%
  shoreLeaveGranted: boolean;
  medicalTriageComplete: boolean;
  rationsRestocked: boolean;
}

export type DockingProcedureStage =
  | 'none'
  | 'in_range_unhailed'   // Within 5,000m (< 65 units) of starbase
  | 'clearance_granted'   // Hailed traffic control, clearance active, waiting for speed < 10 m/s & approach alignment
  | 'tractor_capturing'   // Speed < 10 m/s & aligned, station tractor beams active, guiding into berth
  | 'gantry_locking'      // Umbilical gantries extending and clamping
  | 'docked_secure';      // Securely moored, cavernous station acoustics and tangible services active

export interface StarfleetDispatch {
  id: string;
  priority: 'FLASH' | 'PRIORITY' | 'ROUTINE';
  stardate: string;
  sender: string;
  senderTitle: string;
  subject: string;
  message: string;
  directive: string;
  tacticalRecon: string;
  timestamp: string;
}

export interface StarbaseDockingState {
  stage: DockingProcedureStage;
  stationId: string;
  stationName: string;
  stationType: 'orbital_drydock' | 'mushroom_spacedock' | 'deep_space_starbase';
  distanceMeters: number;           // Approach distance in meters (e.g. 3,850m)
  speedMps: number;                 // Sublight speed in m/s (e.g. 6.8 m/s)
  speedPermitted: boolean;          // true if speed <= 10 m/s
  vectorAligned: boolean;           // true if ship orientation aligns with approach corridor
  alignmentAngleDeg: number;        // angle to corridor in degrees
  clearanceCode?: string;           // e.g. "CLEARANCE ECHO-7"
  trafficControlMessage: string;    // comm audio/text dispatch
  isTractorActive: boolean;
  umbilicalProgress: number;        // 0 to 100%
  // Tangible Station Services
  hullRepairActive: boolean;
  hullRepairProgress: number;       // 0 to 100%
  torpedoRearmActive: boolean;
  torpedoRearmProgress: number;     // 0 to 100%
  antimatterRefuelActive: boolean;
  antimatterRefuelProgress: number; // 0 to 100%
  activeDispatch?: StarfleetDispatch | null;
}

export interface CelestialTarget {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  distance: number;
  description: string;
  scanned: boolean;
}

export interface ShipSubsystem {
  id: string;
  name: string;
  deck: string;
  section: 'primary' | 'neck' | 'secondary' | 'nacelles';
  position: [number, number, number]; // Relative to ship center
  status: 'Nominal' | 'Active' | 'Standby';
  description: string;
  specs: string;
}

