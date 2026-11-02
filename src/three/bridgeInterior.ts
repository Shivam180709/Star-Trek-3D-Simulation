import * as THREE from 'three';
import {
  formatAstronomicalDistance,
  formatStarshipVelocity,
} from '../utils/scaleFormatters';
import { BridgeStationId } from '../types/simulation';

export interface BridgeStationCameraPreset {
  id: BridgeStationId;
  label: string;
  officerName: string;
  officerTitle: string;
  eyePos: THREE.Vector3;
  lookTarget: THREE.Vector3;
  fov: number;
}

export type Bridge3DConsoleAction =
  // Station switching
  | { type: 'switch_station'; stationId: BridgeStationId }
  // Captain's Chair Left Armrest (100-unit Master Power Pool & Alert Levels)
  | { type: 'power_pool'; channel: 'engines' | 'shields' | 'weapons'; value: number }
  | { type: 'set_alert'; level: 'green' | 'yellow' | 'red' }
  // Captain's Chair Right Armrest (Crew Advisory & Delegation)
  | { type: 'advisory_manual' }
  | { type: 'advisory_delegate' }
  | { type: 'request_officer_report'; stationId: BridgeStationId }
  // Lt. Sulu's Helm & Navigation Console
  | { type: 'heading'; headingDeg: number }
  | { type: 'pitch'; pitchDeg: number }
  | { type: 'level_horizon' }
  | { type: 'throttle'; percent: number }
  | { type: 'toggle_inertial_dampeners' }
  | { type: 'warp_factor'; factor: number }
  | { type: 'toggle_warp' }
  | { type: 'trigger_boost' }
  | { type: 'alcubierre_contraction'; percent: number }
  | { type: 'alcubierre_expansion'; percent: number }
  | { type: 'lock_orbital_velocity' }
  // Cmdr. Spock's Science Console
  | { type: 'science_wavelength'; wavelengthNm: number }
  | { type: 'science_amplitude'; amplitudePct: number }
  | { type: 'science_deflector_slider'; particlePct: number }
  | { type: 'science_fire_deflector' }
  | { type: 'science_auto_align' }
  // Ensign Chekov's Tactical Console
  | { type: 'tactical_shield_freq'; freqMhz: number }
  | { type: 'tactical_quadrant_shield'; quadrant: 'forward' | 'aft' | 'port' | 'starboard' | 'balance' }
  | { type: 'tactical_toggle_shields' }
  | { type: 'tactical_toggle_armed' }
  | { type: 'tactical_subsystem_target'; subsystem: 'engines' | 'weapons' }
  | { type: 'tactical_fire_phaser' }
  | { type: 'tactical_fire_torpedo' }
  | { type: 'tactical_cycle_hostile' }
  | { type: 'tactical_prev_hostile' }
  | { type: 'tactical_pinpoint_target' }
  | { type: 'tactical_summon_fleet' }
  | { type: 'tactical_vent_heat' }
  // Lt. Uhura's Communications Console
  | { type: 'comms_carrier_freq'; freqMhz: number }
  | { type: 'comms_bandpass_filter'; filterPct: number }
  | { type: 'comms_hail'; mode: 'standard' | 'scientific' | 'alliance' }
  // Lt. Cmdr. Scott's Engineering Console
  | { type: 'engineering_intermix'; ratioPct: number }
  | { type: 'engineering_purge_coolant' }
  | { type: 'engineering_emergency_repair' };

export type SuluConsoleControlAction = Bridge3DConsoleAction;

export interface BridgeHardwareState {
  // Master 100-unit Power Pool (Captain Left Armrest)
  powerEngines: number;
  powerShields: number;
  powerWeapons: number;
  alertLevel: 'green' | 'yellow' | 'red';

  // Crew Advisory (Captain Right Armrest)
  advisoryStation: BridgeStationId;
  advisoryOfficer: string;
  advisoryTitle: string;
  advisoryQuote: string;
  advisoryScienceNote: string;
  advisoryUrgency: 'routine' | 'priority' | 'critical';
  lastCommandFeedback: string;

  // Helm & Navigation (Lt. Sulu)
  headingDeg: number;
  pitchDeg: number;
  throttlePercent: number;
  inertialDampeners: boolean;
  warpFactor: number;
  isWarping: boolean;
  isBoostActive: boolean;
  speedKms: number;
  alcubierreContraction: number;
  alcubierreExpansion: number;
  optimalContraction: number;
  optimalExpansion: number;
  orbitalVelocityLocked: boolean;
  targetDistanceKm: number;

  // Science (Cmdr. Spock)
  wavelengthNm: number;
  amplitudePct: number;
  targetWavelengthNm: number;
  targetAmplitudePct: number;
  deflectorParticlePct: number;
  scienceWaveMatchPct: number;
  scienceScanComplete: boolean;
  scienceCardTitle: string;
  scienceCardFormula: string;
  scienceCardFact1: string;
  scienceCardFact2: string;

  // Tactical (Ensign Chekov)
  shieldFreqMhz: number;
  optimalShieldFreqMhz: number;
  shieldsRaised: boolean;
  shieldIntegrity: number;
  hullIntegrity: number;
  shieldQuadrants: {
    forward: number;
    aft: number;
    port: number;
    starboard: number;
  };
  weaponsArmed: boolean;
  phaserHeatPct: number;
  isFiringPhasers: boolean;
  torpedoCount: number;
  torpedoLockSeconds: number;
  enemySubsystemTarget: 'engines' | 'weapons';
  lockedEnemyName: string | null;
  aliveHostilesCount: number;

  // Comms (Lt. Uhura)
  carrierFreqMhz: number;
  targetCarrierFreqMhz: number;
  bandpassFilterPct: number;
  targetBandpassPct: number;
  signalClarityPct: number;
  diplomaticTrustPct: number;
  translatedMessage: string;
  commsStatusBanner: string;

  // Engineering (Lt. Cmdr. Scott)
  intermixRatioPct: number;
  coolantTempK: number;

  // Main Viewscreen Corner Telemetry
  targetName: string;
  targetClassification: string;
  targetAtmosphere: string;
  targetGravity: string;
  targetPopulation: string;
  targetBearingDeg: number;
  viewscreenZoom: number;
}

export interface BridgeInteriorComponents {
  root: THREE.Group;
  overheadDomeLight: THREE.PointLight;
  alertRedLight: THREE.PointLight;
  viewscreenMesh: THREE.Mesh;
  viewscreenHudMesh: THREE.Mesh;
  viewscreenGroup: THREE.Group;
  viewscreenRenderTarget: THREE.WebGLRenderTarget;
  viewscreenCamera: THREE.PerspectiveCamera;
  captainChair: THREE.Group;
  helmConsole: THREE.Group;
  suluConsoleMesh: THREE.Mesh;
  interactiveConsoleMeshes: THREE.Mesh[];
  stationGroups: Map<BridgeStationId, THREE.Group>;
  interactiveHitboxes: THREE.Object3D[];
  stationPresets: Record<BridgeStationId, BridgeStationCameraPreset>;
  highlightStation: (stationId: BridgeStationId | null) => void;
  setActiveStation: (stationId: BridgeStationId) => void;
  setViewscreenZoom: (zoom: number) => void;
  resolveConsoleHit: (
    mesh: THREE.Object3D,
    u: number,
    v: number
  ) => { controlId: string; action: Bridge3DConsoleAction } | null;
  resolveSuluConsoleUV: (
    u: number,
    v: number
  ) => { controlId: string; action: Bridge3DConsoleAction } | null;
  setHoveredControl: (controlId: string | null) => void;
  setSuluHoveredControl: (controlId: string | null) => void;
  getHardwareState: () => BridgeHardwareState;
  setHardwareTelemetry: (params: Partial<BridgeHardwareState>) => void;
  update: (delta: number, isRedAlert: boolean, isWarping: boolean) => void;
}

interface MannequinRig {
  group: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  baseTorsoY: number;
  phaseOffset: number;
  primarySeatStationId?: BridgeStationId;
}

type EnterpriseCrewCharacterId =
  | 'kirk'
  | 'spock'
  | 'sulu'
  | 'chekov'
  | 'uhura'
  | 'scotty'
  | 'navigator'
  | 'science_specialist'
  | 'ops_specialist';

/**
 * Builds a high-detail 3D USS Enterprise Starfleet Crew Member (TOS/Kelvin aesthetic)
 * with division-colored velour tunics (Command Gold, Sciences Blue, Operations Red),
 * black V-neck collars, gold cuff rank braids, Starfleet Delta chest insignia,
 * tailored trousers/skirt, glossy black calf boots, realistic skin tones, facial features
 * (eyes, irises, eyebrows, nose, mouth, ears), character-specific hairstyles,
 * Spock's pointed Vulcan ears & arched eyebrows + science tricorder, and Uhura's silver earpiece.
 */
function buildArticulatedMannequin(config: {
  name: string;
  characterId?: EnterpriseCrewCharacterId;
  pose: 'captain_seated' | 'console_seated' | 'standing_console' | 'relaxed_seated';
  phaseOffset: number;
  primarySeatStationId?: BridgeStationId;
}): MannequinRig {
  const group = new THREE.Group();
  group.name = `Crew_${config.name}`;

  const charId: EnterpriseCrewCharacterId =
    config.characterId ||
    (config.primarySeatStationId === 'captain'
      ? 'kirk'
      : config.primarySeatStationId === 'science'
      ? 'spock'
      : config.primarySeatStationId === 'helm'
      ? 'sulu'
      : config.primarySeatStationId === 'tactical'
      ? 'chekov'
      : config.primarySeatStationId === 'comms'
      ? 'uhura'
      : config.primarySeatStationId === 'engineering'
      ? 'scotty'
      : 'science_specialist');

  // Authentic Starfleet Division Colors & Character Appearance Profiles
  const profiles: Record<
    EnterpriseCrewCharacterId,
    {
      divisionColor: number;
      skinColor: number;
      hairColor: number;
      lipColor: number;
      eyeIrisColor: number;
      rankBraids: number;
      isSkirtUniform?: boolean;
      isVulcan?: boolean;
      hasCommsEarpiece?: boolean;
      hasTricorder?: boolean;
      hasMustache?: boolean;
      hairStyle: 'kirk_part' | 'spock_bowl' | 'sulu_straight' | 'chekov_wavy' | 'uhura_updo' | 'scotty_combed';
    }
  > = {
    kirk: {
      divisionColor: 0xd9a31e, // Command Gold
      skinColor: 0xebb692,
      hairColor: 0x5c3c20,
      lipColor: 0xc27d68,
      eyeIrisColor: 0x6b5328,
      rankBraids: 3, // Captain
      hairStyle: 'kirk_part',
    },
    spock: {
      divisionColor: 0x0284c7, // Sciences Blue
      skinColor: 0xe3b68f,
      hairColor: 0x0f1319,
      lipColor: 0xb87b68,
      eyeIrisColor: 0x2b1d12,
      rankBraids: 2, // Commander
      isVulcan: true,
      hasTricorder: true,
      hairStyle: 'spock_bowl',
    },
    sulu: {
      divisionColor: 0xd9a31e, // Command Gold
      skinColor: 0xdfa77c,
      hairColor: 0x10141c,
      lipColor: 0xb87662,
      eyeIrisColor: 0x241810,
      rankBraids: 2, // Lieutenant
      hairStyle: 'sulu_straight',
    },
    chekov: {
      divisionColor: 0xd9a31e, // Command Gold
      skinColor: 0xf1c2a0,
      hairColor: 0x3b2416,
      lipColor: 0xc8806c,
      eyeIrisColor: 0x3d281a,
      rankBraids: 1, // Ensign
      hairStyle: 'chekov_wavy',
    },
    uhura: {
      divisionColor: 0xdc2626, // Operations Red
      skinColor: 0x7d492d,
      hairColor: 0x0d1017,
      lipColor: 0x993b3b,
      eyeIrisColor: 0x21140d,
      rankBraids: 2, // Lieutenant
      isSkirtUniform: true,
      hasCommsEarpiece: true,
      hairStyle: 'uhura_updo',
    },
    scotty: {
      divisionColor: 0xdc2626, // Operations / Engineering Red
      skinColor: 0xebc0a0,
      hairColor: 0x3a2418,
      lipColor: 0xc07c6a,
      eyeIrisColor: 0x3b4d5e,
      rankBraids: 2, // Lt. Commander
      hasMustache: true,
      hairStyle: 'scotty_combed',
    },
    navigator: {
      divisionColor: 0xd9a31e, // Command Gold
      skinColor: 0xeab896,
      hairColor: 0x784f2a,
      lipColor: 0xc07d68,
      eyeIrisColor: 0x335c67,
      rankBraids: 2,
      hairStyle: 'kirk_part',
    },
    science_specialist: {
      divisionColor: 0x0284c7, // Sciences Blue
      skinColor: 0xe6b594,
      hairColor: 0x291c14,
      lipColor: 0xbf7a68,
      eyeIrisColor: 0x2c4c3e,
      rankBraids: 1,
      hairStyle: 'sulu_straight',
    },
    ops_specialist: {
      divisionColor: 0xdc2626, // Operations Red
      skinColor: 0xc68b63,
      hairColor: 0x161920,
      lipColor: 0xa46252,
      eyeIrisColor: 0x261911,
      rankBraids: 1,
      hairStyle: 'scotty_combed',
    },
  };

  const prof = profiles[charId];

  // Tunic Fabric Material (Rich Starfleet Velour sheen)
  const tunicMat = new THREE.MeshStandardMaterial({
    color: prof.divisionColor,
    roughness: 0.62,
    metalness: 0.08,
  });

  // Black Collar & Trousers Material
  const blackTrousersMat = new THREE.MeshStandardMaterial({
    color: 0x11151c,
    roughness: 0.68,
    metalness: 0.1,
  });

  // Glossy Black Starfleet Boots Material
  const blackBootsMat = new THREE.MeshStandardMaterial({
    color: 0x0b0e14,
    roughness: 0.24,
    metalness: 0.35,
  });

  // Skin Material
  const skinMat = new THREE.MeshStandardMaterial({
    color: prof.skinColor,
    roughness: 0.52,
    metalness: 0.04,
  });

  // Hair Material
  const hairMat = new THREE.MeshStandardMaterial({
    color: prof.hairColor,
    roughness: 0.46,
    metalness: 0.12,
  });

  // Gold Starfleet Insignia & Sleeve Braid Material
  const goldInsigniaMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xb45309,
    emissiveIntensity: 0.25,
    metalness: 0.85,
    roughness: 0.22,
  });

  // Silver Chrome Material (Uhura earpiece, tricorder trim)
  const silverChromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.9,
    roughness: 0.18,
  });

  const isSeated = config.pose !== 'standing_console';
  const hipY = isSeated ? 0.52 : 0.94;

  // Pelvis / Lower Tunic Hem or Duty Skirt
  const pelvis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.158, 0.142, 0.19, 18),
    prof.isSkirtUniform ? tunicMat : blackTrousersMat
  );
  pelvis.scale.set(1.15, 1, 0.8);
  pelvis.position.set(0, hipY, 0);
  group.add(pelvis);

  if (prof.isSkirtUniform) {
    // Classic Starfleet Operations Duty Skirt flare
    const skirtHem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.19, 0.16, 20),
      tunicMat
    );
    skirtHem.scale.set(1.12, 1, 0.85);
    skirtHem.position.set(0, hipY - 0.08, -0.05);
    if (isSeated) skirtHem.rotation.x = 0.45;
    group.add(skirtHem);
  }

  // Belt / Tunic Hem Band
  const beltBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.154, 0.156, 0.045, 18),
    tunicMat
  );
  beltBand.scale.set(1.15, 1, 0.8);
  beltBand.position.set(0, hipY + 0.09, 0);
  group.add(beltBand);

  // Legs (Trousers or Tights/Legs + Glossy Black Starfleet Calf Boots)
  const upperLegMat = prof.isSkirtUniform ? skinMat : blackTrousersMat;
  for (const side of [-1, 1]) {
    const hipX = side * 0.112;
    const hipJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 14, 14),
      prof.isSkirtUniform ? tunicMat : blackTrousersMat
    );
    hipJoint.position.set(hipX, hipY - 0.03, 0);
    group.add(hipJoint);

    if (isSeated) {
      // Seated Thigh extending forward (-Z)
      const thigh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.074, 0.06, 0.42, 14),
        upperLegMat
      );
      thigh.rotation.x = Math.PI / 2 - 0.08;
      thigh.position.set(hipX * 1.04, hipY - 0.01, -0.2);
      group.add(thigh);

      // Knee Joint
      const kneeJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.058, 14, 14),
        upperLegMat
      );
      kneeJoint.position.set(hipX * 1.06, hipY - 0.03, -0.4);
      group.add(kneeJoint);

      // Upper Calf + Tall Glossy Black Starfleet Boot
      const upperCalf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.054, 0.16, 14),
        upperLegMat
      );
      upperCalf.position.set(hipX * 1.06, 0.38, -0.41);
      upperCalf.rotation.x = -0.06;
      group.add(upperCalf);

      const bootShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.056, 0.044, 0.30, 14),
        blackBootsMat
      );
      bootShaft.position.set(hipX * 1.06, 0.18, -0.425);
      bootShaft.rotation.x = -0.06;
      group.add(bootShaft);

      const bootFoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.095, 0.065, 0.22),
        blackBootsMat
      );
      bootFoot.position.set(hipX * 1.06, 0.032, -0.50);
      group.add(bootFoot);
    } else {
      // Standing Leg
      const thigh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.078, 0.062, 0.44, 14),
        upperLegMat
      );
      thigh.position.set(hipX * 1.05, hipY - 0.24, 0);
      group.add(thigh);

      const kneeJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.058, 14, 14),
        upperLegMat
      );
      kneeJoint.position.set(hipX * 1.05, hipY - 0.46, 0);
      group.add(kneeJoint);

      const bootShaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.058, 0.045, 0.44, 14),
        blackBootsMat
      );
      bootShaft.position.set(hipX * 1.05, 0.24, 0.01);
      group.add(bootShaft);

      const bootFoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.065, 0.22),
        blackBootsMat
      );
      bootFoot.position.set(hipX * 1.05, 0.032, -0.05);
      group.add(bootFoot);
    }
  }

  // Upper Torso in Starfleet Division Tunic
  const torso = new THREE.Group();
  torso.position.set(0, hipY + 0.11, 0);

  const abdomen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.145, 0.24, 18),
    tunicMat
  );
  abdomen.scale.set(1.12, 1, 0.78);
  abdomen.position.y = 0.12;
  torso.add(abdomen);

  const upperChest = new THREE.Mesh(
    new THREE.CylinderGeometry(0.205, 0.165, 0.36, 20),
    tunicMat
  );
  upperChest.scale.set(1.18, 1, 0.8);
  upperChest.position.y = 0.40;
  torso.add(upperChest);

  // Iconic Black V-Neck Starfleet Collar & Undershirt
  const blackCollarRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.088, 0.115, 0.08, 18),
    blackTrousersMat
  );
  blackCollarRing.scale.set(1.1, 1, 0.92);
  blackCollarRing.position.set(0, 0.56, -0.01);
  torso.add(blackCollarRing);

  const vNeckPlacket = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.12, 4),
    blackTrousersMat
  );
  vNeckPlacket.rotation.x = Math.PI;
  vNeckPlacket.rotation.y = Math.PI / 4;
  vNeckPlacket.position.set(0, 0.50, -0.145);
  torso.add(vNeckPlacket);

  // Gold Starfleet Delta Insignia Badge on Left Chest (x = +0.095 in local torso coords, facing -Z)
  const deltaBadge = new THREE.Mesh(
    new THREE.ConeGeometry(0.026, 0.058, 3),
    goldInsigniaMat
  );
  deltaBadge.scale.set(1.0, 1.0, 0.35);
  deltaBadge.rotation.x = -0.15;
  deltaBadge.position.set(0.095, 0.45, -0.162);
  torso.add(deltaBadge);

  // Optional Spock Science Tricorder Strap & Shoulder Case
  if (prof.hasTricorder) {
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.012, 8, 24),
      blackTrousersMat
    );
    strap.scale.set(0.75, 1.35, 0.8);
    strap.rotation.z = 0.52;
    strap.position.set(-0.02, 0.34, 0);
    torso.add(strap);

    const tricorderBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.05),
      silverChromeMat
    );
    tricorderBox.position.set(-0.19, 0.12, -0.06);
    torso.add(tricorderBox);
  }

  // Sculpted Human/Vulcan Head, Facial Features & Hairstyle
  const head = new THREE.Group();
  head.position.set(0, 0.60, 0);

  const neckCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.064, 0.10, 16),
    skinMat
  );
  neckCyl.position.y = 0.04;
  head.add(neckCyl);

  // Cranium / Face Sphere
  const cranium = new THREE.Mesh(
    new THREE.SphereGeometry(0.126, 24, 22),
    skinMat
  );
  cranium.scale.set(0.88, 1.10, 0.96);
  cranium.position.set(0, 0.165, -0.01);
  head.add(cranium);

  // Sculpted Jaw / Chin contour
  const jaw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.082, 0.056, 0.09, 16),
    skinMat
  );
  jaw.scale.set(0.95, 1, 0.92);
  jaw.position.set(0, 0.105, -0.025);
  head.add(jaw);

  // Sculpted 3D Nose Bridge & Tip (facing forward -Z)
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.052, 12),
    skinMat
  );
  nose.rotation.x = -Math.PI / 2 + 0.35;
  nose.position.set(0, 0.16, -0.135);
  head.add(nose);

  // Eyes (White Sclera + Colored Iris + Dark Pupil) & Character Eyebrows
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const irisMat = new THREE.MeshBasicMaterial({ color: prof.eyeIrisColor });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
  const lipMat = new THREE.MeshStandardMaterial({
    color: prof.lipColor,
    roughness: 0.45,
  });

  for (const side of [-1, 1]) {
    const eyeX = side * 0.042;
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 12), scleraMat);
    sclera.scale.set(1.15, 0.85, 0.65);
    sclera.position.set(eyeX, 0.182, -0.118);
    head.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.010, 10, 10), irisMat);
    iris.scale.set(1, 1, 0.5);
    iris.position.set(eyeX, 0.182, -0.126);
    head.add(iris);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 8, 8), pupilMat);
    pupil.position.set(eyeX, 0.182, -0.130);
    head.add(pupil);

    // Eyebrows (Spock has sharply upswept Vulcan eyebrows!)
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, 0.007, 0.012),
      hairMat
    );
    brow.position.set(eyeX, 0.205, -0.122);
    brow.rotation.z = prof.isVulcan ? side * 0.36 : side * 0.07;
    head.add(brow);

    // Ears (Spock has iconic pointed Vulcan ears!)
    if (prof.isVulcan) {
      const vulcanEar = new THREE.Mesh(
        new THREE.ConeGeometry(0.022, 0.078, 10),
        skinMat
      );
      vulcanEar.position.set(side * 0.115, 0.185, -0.005);
      vulcanEar.rotation.z = -side * 0.22;
      vulcanEar.rotation.x = -0.15;
      head.add(vulcanEar);
    } else {
      const humanEar = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 10, 10),
        skinMat
      );
      humanEar.scale.set(0.45, 1.15, 0.75);
      humanEar.position.set(side * 0.112, 0.165, -0.005);
      head.add(humanEar);
    }
  }

  // Mouth / Lips
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.009, 0.012),
    lipMat
  );
  mouth.position.set(0, 0.115, -0.122);
  head.add(mouth);

  // Optional Mustache (Scotty)
  if (prof.hasMustache) {
    const mustache = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, 0.010, 0.014),
      hairMat
    );
    mustache.position.set(0, 0.126, -0.125);
    head.add(mustache);
  }

  // Iconic Silver Starfleet Subspace Earpiece for Lt. Uhura
  if (prof.hasCommsEarpiece) {
    const earCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.008, 0.055, 12),
      silverChromeMat
    );
    earCylinder.rotation.z = Math.PI / 3;
    earCylinder.rotation.y = -0.35;
    earCylinder.position.set(-0.128, 0.155, -0.02);
    head.add(earCylinder);

    const earTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 10, 10),
      silverChromeMat
    );
    earTip.position.set(-0.148, 0.142, -0.032);
    head.add(earTip);
  }

  // Character-Specific Sculpted 3D Hairstyles
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.131, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat
  );
  hairCap.scale.set(0.90, 1.12, 0.99);
  hairCap.position.set(0, 0.172, 0.005);
  hairCap.rotation.x = -0.22;
  head.add(hairCap);

  if (prof.hairStyle === 'spock_bowl') {
    // Sharp straight Vulcan bangs across forehead + sideburns
    const vulcanBangs = new THREE.Mesh(
      new THREE.CylinderGeometry(0.116, 0.118, 0.052, 20, 1, false, Math.PI * 0.65, Math.PI * 0.7),
      hairMat
    );
    vulcanBangs.scale.set(0.92, 1, 1.02);
    vulcanBangs.position.set(0, 0.232, -0.018);
    head.add(vulcanBangs);

    for (const side of [-1, 1]) {
      const sideburn = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.055, 0.026),
        hairMat
      );
      sideburn.position.set(side * 0.105, 0.178, -0.045);
      head.add(sideburn);
    }
  } else if (prof.hairStyle === 'kirk_part') {
    // Classic Captain Kirk side-parted pompadour wave
    const frontWave = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 14, 12),
      hairMat
    );
    frontWave.scale.set(1.45, 0.58, 0.85);
    frontWave.position.set(0.018, 0.275, -0.068);
    frontWave.rotation.z = -0.15;
    head.add(frontWave);
  } else if (prof.hairStyle === 'uhura_updo') {
    // Tall sculpted 1960s Starfleet bouffant updo + swept bangs
    const bouffantCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.108, 18, 16),
      hairMat
    );
    bouffantCrown.scale.set(0.92, 1.25, 1.05);
    bouffantCrown.position.set(0, 0.285, 0.035);
    head.add(bouffantCrown);

    const sweptBang = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 14, 12),
      hairMat
    );
    sweptBang.scale.set(1.5, 0.55, 0.8);
    sweptBang.position.set(-0.015, 0.258, -0.068);
    sweptBang.rotation.z = 0.18;
    head.add(sweptBang);
  } else if (prof.hairStyle === 'chekov_wavy') {
    // Fuller wavy mop-top hair for Ensign Chekov
    const mopTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.136, 18, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    mopTop.scale.set(0.96, 1.08, 1.02);
    mopTop.position.set(0, 0.182, -0.008);
    head.add(mopTop);
  }

  torso.add(head);

  // Arms in Starfleet Tunic Sleeves with Gold Rank Cuff Braids & Skin-toned Hands
  const createCrewArm = (side: -1 | 1) => {
    const armGroup = new THREE.Group();
    armGroup.position.set(side * 0.255, 0.51, 0);

    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 14), tunicMat);
    armGroup.add(shoulderBall);

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.046, 0.30, 14), tunicMat);
    const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 14), tunicMat);

    // Forearm sleeve group with gold rank braids near the cuff
    const forearmGroup = new THREE.Group();
    const forearmMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.038, 0.28, 14),
      tunicMat
    );
    forearmGroup.add(forearmMesh);

    // Gold Starfleet Rank Braids around the lower sleeve cuff
    for (let b = 0; b < prof.rankBraids; b++) {
      const braid = new THREE.Mesh(
        new THREE.TorusGeometry(0.040, 0.0045, 8, 20),
        goldInsigniaMat
      );
      braid.rotation.x = Math.PI / 2;
      braid.position.y = -0.095 + b * 0.022;
      forearmGroup.add(braid);
    }

    const wristBall = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 12), skinMat);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.028, 0.10), skinMat);

    if (config.pose === 'captain_seated') {
      // Hands resting naturally on the Captain's Chair armrests
      upperArm.position.set(side * 0.03, -0.14, -0.02);
      upperArm.rotation.x = 0.18;
      upperArm.rotation.z = -side * 0.18;

      elbowBall.position.set(side * 0.06, -0.28, -0.05);

      forearmGroup.position.set(side * 0.04, -0.30, -0.20);
      forearmGroup.rotation.x = Math.PI / 2 - 0.1;
      forearmGroup.rotation.y = side * 0.1;

      wristBall.position.set(side * 0.02, -0.31, -0.34);
      hand.position.set(side * 0.02, -0.31, -0.40);
    } else if (config.pose === 'relaxed_seated') {
      upperArm.position.set(side * 0.02, -0.14, -0.04);
      upperArm.rotation.x = 0.28;
      elbowBall.position.set(side * 0.03, -0.27, -0.09);
      forearmGroup.position.set(0, -0.36, -0.22);
      forearmGroup.rotation.x = 1.05;
      forearmGroup.rotation.z = side * 0.22;
      wristBall.position.set(-side * 0.03, -0.42, -0.33);
      hand.position.set(-side * 0.04, -0.43, -0.38);
    } else {
      // Reaching forward onto the sloped 3D station console dials & buttons
      upperArm.position.set(0, -0.12, -0.09);
      upperArm.rotation.x = 0.62;

      elbowBall.position.set(0, -0.23, -0.18);

      forearmGroup.position.set(-side * 0.03, -0.25, -0.33);
      forearmGroup.rotation.x = 1.38;
      forearmGroup.rotation.z = -side * 0.16;

      wristBall.position.set(-side * 0.05, -0.26, -0.47);
      hand.position.set(-side * 0.06, -0.26, -0.53);
    }

    armGroup.add(upperArm, elbowBall, forearmGroup, wristBall, hand);
    return armGroup;
  };

  const leftArm = createCrewArm(-1);
  const rightArm = createCrewArm(1);
  torso.add(leftArm, rightArm);

  if (config.pose === 'console_seated' || config.pose === 'standing_console') {
    torso.rotation.x = -0.1; // Slight forward lean toward console
  }

  group.add(torso);

  return {
    group,
    head,
    torso,
    leftArm,
    rightArm,
    baseTorsoY: hipY + 0.11,
    phaseOffset: config.phaseOffset,
    primarySeatStationId: config.primarySeatStationId,
  };
}

/**
 * Builds an authentic TOS/Reference Mid-Century Black Contoured Swivel Chair on a 4-Star Chrome Base
 */
function buildBridgeSwivelChair(): THREE.Group {
  const chair = new THREE.Group();

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.88,
    roughness: 0.2,
  });
  const blackUpholsteryMat = new THREE.MeshStandardMaterial({
    color: 0x161920,
    roughness: 0.42,
    metalness: 0.2,
  });
  const blueGrayShellMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.38,
    metalness: 0.45,
  });

  // Central vertical pedestal post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.44, 14), chromeMat);
  post.position.y = 0.24;
  chair.add(post);

  // 4-star chrome base legs
  for (let i = 0; i < 4; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.028, 0.62), chromeMat);
    leg.position.y = 0.04;
    leg.rotation.y = (i * Math.PI) / 4;
    chair.add(leg);
  }

  // Contoured Seat Cushion & Lower Shell
  const seatShell = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.07, 18), blueGrayShellMat);
  seatShell.scale.set(1.05, 1, 1.08);
  seatShell.position.y = 0.46;
  chair.add(seatShell);

  const seatPad = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.06, 18), blackUpholsteryMat);
  seatPad.scale.set(1.0, 1, 1.05);
  seatPad.position.y = 0.50;
  chair.add(seatPad);

  // High Tapered Backrest (matching the tall tapered black/blue-grey chairs in the reference image)
  const backShell = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.68, 0.06), blueGrayShellMat);
  backShell.position.set(0, 0.84, 0.23);
  backShell.rotation.x = 0.12;
  chair.add(backShell);

  const backPad = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.64, 0.06), blackUpholsteryMat);
  backPad.position.set(0, 0.84, 0.20);
  backPad.rotation.x = 0.12;
  chair.add(backPad);

  return chair;
}

/**
 * Draws an authentic backlit Starfleet acrylic keycap ("jelly-bean" / beveled translucent switch)
 * with recessed dark bezel, internal emissive gradient, and top glass specular highlight.
 */
function drawStarfleetKeycap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colorHex: string,
  label?: string,
  isHovered: boolean = false,
  isActive: boolean = false,
  subLabel?: string
) {
  // Recessed dark mounting slot
  ctx.fillStyle = '#05070c';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

  // Outer metallic/beveled rim
  ctx.fillStyle = isHovered ? '#ffffff' : isActive ? colorHex : '#1e2430';
  ctx.fillRect(x, y, w, h);

  // Inner translucent acrylic cap
  const pad = isActive || isHovered ? 2 : 3;
  const ix = x + pad;
  const iy = y + pad;
  const iw = Math.max(4, w - pad * 2);
  const ih = Math.max(4, h - pad * 2);

  const grad = ctx.createLinearGradient(ix, iy, ix, iy + ih);
  if (isActive) {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.28, colorHex);
    grad.addColorStop(1, colorHex);
  } else if (isHovered) {
    grad.addColorStop(0, colorHex);
    grad.addColorStop(1, '#1e293b');
  } else {
    grad.addColorStop(0, colorHex);
    grad.addColorStop(0.85, '#0f141e');
    grad.addColorStop(1, '#070a10');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(ix, iy, iw, ih);

  // Top specular glass highlight strip
  ctx.fillStyle = isActive ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.28)';
  ctx.fillRect(ix + 2, iy + 2, Math.max(2, iw - 4), Math.max(2, Math.min(6, ih * 0.22)));

  // Crisp border line
  ctx.strokeStyle = isHovered ? '#ffffff' : colorHex;
  ctx.lineWidth = isActive || isHovered ? 2.2 : 1.2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

  if (label) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = isActive ? '#020617' : '#ffffff';
    ctx.font = `bold ${subLabel ? 13 : 12}px monospace`;
    ctx.fillText(label, x + w / 2, subLabel ? y + h * 0.46 : y + h * 0.58);
    if (subLabel) {
      ctx.fillStyle = isActive ? '#090d16' : '#fef08a';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(subLabel, x + w / 2, y + h * 0.78);
    }
    ctx.restore();
  }
}

/**
 * Draws the iconic curved fan-shaped / concentric arc bank of glowing Starfleet console buttons
 * seen on the perimeter and helm consoles in the Enterprise bridge reference video/images.
 */
function drawRadialButtonArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
  cols: number,
  rows: number,
  palette: string[],
  seed: number = 0
) {
  const rowStep = (outerR - innerR) / Math.max(1, rows);
  const colStep = (endDeg - startDeg) / Math.max(1, cols);
  const gapDeg = Math.min(1.6, colStep * 0.18);
  const gapR = Math.min(4, rowStep * 0.18);

  for (let r = 0; r < rows; r++) {
    const r0 = innerR + r * rowStep + gapR * 0.5;
    const r1 = innerR + (r + 1) * rowStep - gapR * 0.5;
    for (let c = 0; c < cols; c++) {
      const a0 = ((startDeg + c * colStep + gapDeg * 0.5 - 90) * Math.PI) / 180;
      const a1 = ((startDeg + (c + 1) * colStep - gapDeg * 0.5 - 90) * Math.PI) / 180;
      const color = palette[(r * 5 + c * 3 + seed) % palette.length];
      const isLit = (r * 7 + c * 11 + seed) % 4 !== 0;

      ctx.beginPath();
      ctx.arc(cx, cy, r1, a0, a1, false);
      ctx.arc(cx, cy, r0, a1, a0, true);
      ctx.closePath();

      ctx.fillStyle = isLit ? color : '#161b24';
      ctx.fill();
      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      if (isLit) {
        // Inner specular highlight arc
        ctx.beginPath();
        ctx.arc(cx, cy, r1 - 2, a0 + 0.01, a1 - 0.01, false);
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
}

/**
 * Helper to draw a machined Starfleet rotary dial gauge on a 2D CanvasTexture
 */
function drawCanvasRotaryKnob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  normValue: number,
  optNorm: number | null,
  label: string,
  valText: string,
  accentHex: string,
  isHovered: boolean
) {
  // Recessed dark dial well
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2);
  ctx.fillStyle = '#05070c';
  ctx.fill();
  ctx.strokeStyle = '#262f3d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Illuminated LED scale ticks around the perimeter
  const curDeg = -135 + Math.max(0, Math.min(1, normValue)) * 270;
  for (let i = 0; i <= 24; i++) {
    const deg = -135 + i * (270 / 24);
    const rad = ((deg - 90) * Math.PI) / 180;
    const r1 = radius + 4;
    const r2 = radius + (i % 4 === 0 ? 14 : 9);
    const isLit = deg <= curDeg + 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
    ctx.lineTo(cx + Math.cos(rad) * r2, cy + Math.sin(rad) * r2);
    ctx.strokeStyle = isLit ? accentHex : '#334155';
    ctx.lineWidth = i % 4 === 0 ? 3.2 : 1.8;
    ctx.stroke();
  }

  // Target optimal harmonic marker
  if (optNorm !== null) {
    const optDeg = -135 + Math.max(0, Math.min(1, optNorm)) * 270;
    const optRad = ((optDeg - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(optRad) * (radius + 11), cy + Math.sin(optRad) * (radius + 11), 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Outer machined metallic knurled ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  const ringGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  ringGrad.addColorStop(0, isHovered ? '#ffffff' : '#64748b');
  ringGrad.addColorStop(0.5, '#1e293b');
  ringGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = ringGrad;
  ctx.fill();
  ctx.strokeStyle = isHovered ? '#ffffff' : accentHex;
  ctx.lineWidth = isHovered ? 3.5 : 2.5;
  ctx.stroke();

  // Inner anodized cap
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.74, 0, Math.PI * 2);
  ctx.fillStyle = '#090d16';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Glowing pointer needle
  const curRad = ((curDeg - 90) * Math.PI) / 180;
  const px = cx + Math.cos(curRad) * (radius * 0.84);
  const py = cy + Math.sin(curRad) * (radius * 0.84);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(px, py);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Center brushed chrome cap
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#94a3b8';
  ctx.fill();

  // Label plate above
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, cx, cy - radius - 20);

  // Digital readout pill below
  const pillW = Math.max(130, ctx.measureText(valText).width + 24);
  ctx.fillStyle = '#05070c';
  ctx.fillRect(cx - pillW / 2, cy + radius + 10, pillW, 24);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(cx - pillW / 2, cy + radius + 10, pillW, 24);

  ctx.fillStyle = accentHex;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(valText, cx, cy + radius + 27);
  ctx.textAlign = 'left';
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 4
) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
      line = words[n] + ' ';
      lineCount++;
      if (lineCount >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line.trim(), x, y + lineCount * lineHeight);
  }
}

export function buildBridgeInterior(): BridgeInteriorComponents {
  const root = new THREE.Group();
  root.name = 'BridgeInterior';

  // Bridge Dimensions matching the 12-sided radial architecture in the reference image
  const bridgeRadius = 12.6;
  const pitRadius = 5.65;
  const walkwayHeight = 0.44;
  const bridgeHeight = 5.4;

  const stationGroups = new Map<BridgeStationId, THREE.Group>();
  const interactiveHitboxes: THREE.Object3D[] = [];
  const interactiveConsoleMeshes: THREE.Mesh[] = [];
  const mannequinRigs: MannequinRig[] = [];
  const stationRingBeacons = new Map<BridgeStationId, THREE.Mesh>();

  let hoveredControlId: string | null = null;

  // Unified Hardware & Gameplay State across all 3D Bridge Consoles
  const hw: BridgeHardwareState = {
    powerEngines: 34,
    powerShields: 33,
    powerWeapons: 33,
    alertLevel: 'green',

    advisoryStation: 'science',
    advisoryOfficer: 'CMDR. SPOCK (SCIENCE)',
    advisoryTitle: 'SECTOR 001 ASTROMETRIC & SPECTROSCOPIC TELEMETRY',
    advisoryQuote:
      '"Captain, sensors are locked on our forward viewscreen target. Recommend calibrating spectroscopic wavelength or balancing the Alcubierre warp bubble."',
    advisoryScienceNote:
      'Spectroscopic emission lines (E = hc/λ) identify planetary atmospheres & quantum anomalies.',
    advisoryUrgency: 'routine',
    lastCommandFeedback: 'MASTER POWER POOL NOMINAL (100/100 UNITS)',

    headingDeg: 0,
    pitchDeg: 0,
    throttlePercent: 0,
    inertialDampeners: true,
    warpFactor: 4.0,
    isWarping: false,
    isBoostActive: false,
    speedKms: 0,
    alcubierreContraction: 68,
    alcubierreExpansion: 68,
    optimalContraction: 68,
    optimalExpansion: 68,
    orbitalVelocityLocked: false,
    targetDistanceKm: 1120,

    wavelengthNm: 656,
    amplitudePct: 75,
    targetWavelengthNm: 656,
    targetAmplitudePct: 75,
    deflectorParticlePct: 60,
    scienceWaveMatchPct: 100,
    scienceScanComplete: true,
    scienceCardTitle: 'BALMER H-ALPHA & CLASS-M BIOSPHERE SPECTROSCOPY',
    scienceCardFormula: 'λ = 656.28 nm (n=3 → n=2) | E = hc / λ = 1.89 eV',
    scienceCardFact1:
      'Deep N2-O2 atmosphere with liquid H2O ocean absorption bands and active magnetosphere.',
    scienceCardFact2:
      'Navigational Deflector positron sweep confirms zero hazardous subspace radiation.',

    shieldFreqMhz: 254.0,
    optimalShieldFreqMhz: 254.0,
    shieldsRaised: false,
    shieldIntegrity: 100,
    hullIntegrity: 100,
    shieldQuadrants: {
      forward: 100,
      aft: 100,
      port: 100,
      starboard: 100,
    },
    weaponsArmed: false,
    phaserHeatPct: 8,
    isFiringPhasers: false,
    torpedoCount: 24,
    torpedoLockSeconds: 3.0,
    enemySubsystemTarget: 'weapons',
    lockedEnemyName: null,
    aliveHostilesCount: 0,

    carrierFreqMhz: 184.0,
    targetCarrierFreqMhz: 184.0,
    bandpassFilterPct: 75,
    targetBandpassPct: 75,
    signalClarityPct: 98,
    diplomaticTrustPct: 88,
    translatedMessage:
      '"STARFLEET COMMAND // SECTOR 001: USS Enterprise NCC-1701 cleared for scientific exploration & orbital operations."',
    commsStatusBanner: 'SUBSPACE CARRIER LOCKED · UNIVERSAL TRANSLATOR ONLINE',

    intermixRatioPct: 100,
    coolantTempK: 142,

    targetName: 'EARTH (SOL III)',
    targetClassification: 'Class-M Terrestrial Planet',
    targetAtmosphere: 'Breathable N2-O2 (78% N2, 21% O2)',
    targetGravity: '1.0 G (9.81 m/s²)',
    targetPopulation: '9.2 Billion (Federation Capital)',
    targetBearingDeg: 0,
    viewscreenZoom: 1.0,
  };

  // ---------------------------------------------------------------------------
  // CORE PBR MATERIALS MATCHING THE REFERENCE IMAGE PALETTE
  // ---------------------------------------------------------------------------
  // Dark matte-grey flooring (#2b2f36)
  const matteGreyFloorMat = new THREE.MeshStandardMaterial({
    color: 0x2b2f36,
    roughness: 0.72,
    metalness: 0.22,
  });

  // Darker charcoal pit step & console pedestal base (#1c2026)
  const darkPedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1c2026,
    roughness: 0.55,
    metalness: 0.35,
  });

  // Brushed metallic-silver outer bulkheads & upper monitor frames (#8a95a5, metalness: 0.6, roughness: 0.35)
  const brushedSilverBulkheadMat = new THREE.MeshStandardMaterial({
    color: 0x8a95a5,
    metalness: 0.6,
    roughness: 0.35,
  });

  // Slightly darker slate-silver for recessed upper monitor panels (#5a6575)
  const recessedMonitorFrameMat = new THREE.MeshStandardMaterial({
    color: 0x525d6d,
    metalness: 0.55,
    roughness: 0.4,
  });

  // Console body charcoal-black (#15181e)
  const consoleBodyMat = new THREE.MeshStandardMaterial({
    color: 0x15181e,
    roughness: 0.38,
    metalness: 0.55,
  });

  // Iconic Red-Orange safety railings & console trim (#d9532f)
  const redOrangeTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd9532f,
    emissive: 0x7c2d12,
    emissiveIntensity: 0.18,
    roughness: 0.32,
    metalness: 0.35,
  });

  // Dark stanchion post material (#1f242b)
  const darkStanchionMat = new THREE.MeshStandardMaterial({
    color: 0x1f242b,
    metalness: 0.7,
    roughness: 0.3,
  });

  // Chrome ladder & trim material
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.88,
    roughness: 0.2,
  });

  // Under-desk cyan accent lighting (#38bdf8)
  const underDeskCyanGlowMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
  });

  // ---------------------------------------------------------------------------
  // 1. 12-SIDED POLYGONAL / CIRCULAR ARENA, SUNKEN PIT & STEP-LADDERS
  // ---------------------------------------------------------------------------
  // Sunken Central Pit Floor (y = 0)
  const pitFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius + 0.1, pitRadius + 0.1, 0.2, 12),
    matteGreyFloorMat
  );
  pitFloor.position.y = -0.1;
  pitFloor.rotation.y = Math.PI / 12;
  root.add(pitFloor);

  // Elevated Perimeter Walkway Floor (12-sided polygon ring at y = walkwayHeight = 0.44m)
  const walkwayFloorGeo = new THREE.RingGeometry(pitRadius, bridgeRadius + 0.6, 12, 1);
  const walkwayFloor = new THREE.Mesh(walkwayFloorGeo, matteGreyFloorMat);
  walkwayFloor.rotation.x = -Math.PI / 2;
  walkwayFloor.rotation.z = Math.PI / 12;
  walkwayFloor.position.y = walkwayHeight;
  root.add(walkwayFloor);

  // Vertical Pit Riser Wall (12-sided step wall between y = 0 and y = 0.44)
  const pitRiserWall = new THREE.Mesh(
    new THREE.CylinderGeometry(pitRadius, pitRadius, walkwayHeight, 12, 1, true),
    darkPedestalMat
  );
  pitRiserWall.material.side = THREE.DoubleSide;
  pitRiserWall.position.y = walkwayHeight / 2;
  pitRiserWall.rotation.y = Math.PI / 12;
  root.add(pitRiserWall);

  // Central Stepped Command Platform inside the Pit (supports Captain's Chair, Helm Island & rear-right walkway bridge)
  const centerPlatform = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.22, 4.8),
    darkPedestalMat
  );
  centerPlatform.position.set(0, 0.11, -0.35);
  root.add(centerPlatform);

  // Connecting angled walkway ramp from behind the Captain's Chair to the Starboard-Aft Turbolift walkway (matching reference image!)
  const aftBridgeRamp = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, walkwayHeight, 3.6),
    darkPedestalMat
  );
  aftBridgeRamp.position.set(1.65, walkwayHeight / 2, 3.3);
  aftBridgeRamp.rotation.y = 0.55;
  root.add(aftBridgeRamp);

  const aftRampTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, 0.02, 3.55),
    matteGreyFloorMat
  );
  aftRampTop.position.set(1.65, walkwayHeight + 0.01, 3.3);
  aftRampTop.rotation.y = 0.55;
  root.add(aftRampTop);

  // Two Metallic Step-Ladders with Handrails on the Port-Aft and Port-Forward / Starboard sides
  const buildStepLadder = (angleRad: number) => {
    const ladderGroup = new THREE.Group();
    const r = pitRadius - 0.18;
    ladderGroup.position.set(Math.sin(angleRad) * r, 0, Math.cos(angleRad) * r);
    ladderGroup.rotation.y = angleRad;

    // 3 horizontal silver metallic steps
    for (let s = 0; s < 3; s++) {
      const stepTread = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 0.04, 0.22),
        chromeMat
      );
      stepTread.position.set(0, 0.11 + s * 0.13, -s * 0.12);
      ladderGroup.add(stepTread);
    }

    // Twin side stringers & low handrails
    for (const sx of [-0.88, 0.88]) {
      const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.08), chromeMat);
      stringer.position.set(sx, 0.24, -0.12);
      stringer.rotation.x = -0.58;
      ladderGroup.add(stringer);
    }

    root.add(ladderGroup);
  };

  // Place step-ladders at the Port-Aft (-2.25 rad) and Port-Forward (-0.82 rad) entry gaps
  buildStepLadder(-2.22);
  buildStepLadder(-0.78);

  // ---------------------------------------------------------------------------
  // 2. ICONIC SEGMENTED RED-ORANGE SAFETY RAILINGS (#d9532f)
  // ---------------------------------------------------------------------------
  // Build polygonal segmented railings around the pit perimeter leaving clean entry gaps
  const buildSegmentedSafetyRailing = (angles: number[]) => {
    const railR = pitRadius - 0.08;
    const railTopY = walkwayHeight + 0.72;

    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      const px = Math.sin(a) * railR;
      const pz = Math.cos(a) * railR;

      // Dark angled vertical stanchion post (#1f242b)
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.76, 0.12),
        darkStanchionMat
      );
      post.position.set(px, walkwayHeight + 0.36, pz);
      post.rotation.y = a;
      root.add(post);

      if (i < angles.length - 1) {
        const aNext = angles[i + 1];
        const nx = Math.sin(aNext) * railR;
        const nz = Math.cos(aNext) * railR;

        const midX = (px + nx) / 2;
        const midZ = (pz + nz) / 2;
        const segLen = Math.hypot(nx - px, nz - pz) + 0.08;
        const segYaw = Math.atan2(nx - px, nz - pz);

        // Flat-topped Red-Orange Safety Rail (#d9532f) matching reference image
        const railBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, 0.075, segLen),
          redOrangeTrimMat
        );
        railBar.position.set(midX, railTopY, midZ);
        railBar.rotation.y = segYaw;
        root.add(railBar);
      }
    }
  };

  // 4 distinct polygonal railing segments matching the reference image:
  // 1. Rear-Center / Rear-Left segment (behind Captain's Chair & Science)
  buildSegmentedSafetyRailing([2.52, 2.86, 3.18, 3.50, 3.74]);
  // 2. Port-Side segment (between the two Port step-ladders)
  buildSegmentedSafetyRailing([-1.92, -1.58, -1.24, -1.02]);
  // 3. Forward-Center / Forward-Starboard segment
  buildSegmentedSafetyRailing([-0.42, -0.08, 0.28, 0.62]);
  // 4. Starboard-Side segment
  buildSegmentedSafetyRailing([1.05, 1.38, 1.72, 2.02]);

  // ---------------------------------------------------------------------------
  // 3. 12-SIDED BRUSHED METALLIC OUTER BULKHEADS, ARCHITECTURAL CEILING DOME
  //    (ROOF WITH 12 RADIAL RIBS & CENTRAL SKYLIGHT OCULUS) & TURBOLIFT ALCOVE
  // ---------------------------------------------------------------------------
  brushedSilverBulkheadMat.side = THREE.DoubleSide;
  recessedMonitorFrameMat.side = THREE.DoubleSide;

  // Outer 12-sided polygonal structural rim & wall
  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(bridgeRadius + 0.45, bridgeRadius + 0.45, bridgeHeight, 12, 1, true),
    brushedSilverBulkheadMat
  );
  outerWall.position.y = bridgeHeight / 2;
  outerWall.rotation.y = Math.PI / 12;
  root.add(outerWall);

  // --- COMPLETE 3D BRIDGE ROOF / OVERHEAD CEILING DOME ASSEMBLY ---
  const ceilingGroup = new THREE.Group();
  ceilingGroup.name = 'BridgeCeilingRoofDome';

  // 1. Outer 12-Sided Recessed Soffit Ring (from outer wall r=13.1m inward to r=7.6m at y=bridgeHeight)
  const outerSoffitMat = new THREE.MeshStandardMaterial({
    color: 0x3b4454,
    metalness: 0.62,
    roughness: 0.38,
    side: THREE.DoubleSide,
  });
  const outerCeilingRing = new THREE.Mesh(
    new THREE.RingGeometry(7.5, bridgeRadius + 0.65, 12, 1),
    outerSoffitMat
  );
  outerCeilingRing.rotation.x = Math.PI / 2;
  outerCeilingRing.rotation.z = Math.PI / 12;
  outerCeilingRing.position.y = bridgeHeight;
  ceilingGroup.add(outerCeilingRing);

  // 2. Illuminated Perimeter Cove Light Ring (at r=7.55m, y=bridgeHeight - 0.04m)
  const ceilingCoveGlowMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    side: THREE.DoubleSide,
  });
  const outerCoveLightRing = new THREE.Mesh(
    new THREE.RingGeometry(7.25, 7.6, 24, 1),
    ceilingCoveGlowMat
  );
  outerCoveLightRing.rotation.x = Math.PI / 2;
  outerCoveLightRing.position.y = bridgeHeight - 0.03;
  ceilingGroup.add(outerCoveLightRing);

  // 3. Upper Vaulted Bridge Roof Dome (enclosing the entire bridge overhead from r=7.6m up to apex y=6.85m)
  const upperDomeMat = new THREE.MeshStandardMaterial({
    color: 0x262d3a,
    metalness: 0.55,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });
  const upperRoofVault = new THREE.Mesh(
    new THREE.CylinderGeometry(3.4, 7.65, 1.35, 24, 1, true),
    upperDomeMat
  );
  upperRoofVault.position.y = bridgeHeight + 0.67;
  ceilingGroup.add(upperRoofVault);

  // Solid Top Cap above the central skylight oculus so zero external stars/skybox ever leak through the roof
  const roofTopCap = new THREE.Mesh(
    new THREE.CircleGeometry(3.55, 24),
    new THREE.MeshStandardMaterial({
      color: 0x1e2530,
      metalness: 0.6,
      roughness: 0.35,
      side: THREE.DoubleSide,
    })
  );
  roofTopCap.rotation.x = Math.PI / 2;
  roofTopCap.position.y = bridgeHeight + 1.36;
  ceilingGroup.add(roofTopCap);

  // 4. 12 Radial Structural Ceiling Ribs / Arch Girders (spanning from the 12 bulkhead corners to the central oculus)
  const ribGirderMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.72,
    roughness: 0.28,
  });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const ribGroup = new THREE.Group();
    ribGroup.rotation.y = angle;

    // Lower horizontal soffit beam (from r=7.5m to r=12.6m at y=bridgeHeight - 0.08m)
    const lowerBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.18, 5.2),
      ribGirderMat
    );
    lowerBeam.position.set(0, bridgeHeight - 0.08, 10.05);
    ribGroup.add(lowerBeam);

    // Angled upper vault girder (rising from r=7.5m, y=5.4m to r=3.3m, y=6.72m)
    const upperBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.16, 4.45),
      ribGirderMat
    );
    upperBeam.position.set(0, bridgeHeight + 0.66, 5.4);
    upperBeam.rotation.x = 0.305;
    ribGroup.add(upperBeam);

    // Glowing cyan/warm LED strip along the underside of each radial rib
    const ribLightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.03, 4.8),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    );
    ribLightStrip.position.set(0, bridgeHeight - 0.18, 10.0);
    ribGroup.add(ribLightStrip);

    ceilingGroup.add(ribGroup);
  }

  // 5. Concentric Architectural Compression Rings & Central Illuminated Skylight Oculus
  const oculusRim = new THREE.Mesh(
    new THREE.TorusGeometry(3.38, 0.14, 12, 36),
    ribGirderMat
  );
  oculusRim.rotation.x = Math.PI / 2;
  oculusRim.position.y = bridgeHeight + 1.28;
  ceilingGroup.add(oculusRim);

  const midVaultRim = new THREE.Mesh(
    new THREE.TorusGeometry(5.5, 0.1, 10, 36),
    ribGirderMat
  );
  midVaultRim.rotation.x = Math.PI / 2;
  midVaultRim.position.y = bridgeHeight + 0.65;
  ceilingGroup.add(midVaultRim);

  // Frosted Illuminated Central Skylight Diffuser Disc (glows warm daylight in normal cruise, pulses red in Red Alert!)
  const skylightDiffuserMat = new THREE.MeshBasicMaterial({
    color: 0xf8fafc,
    side: THREE.DoubleSide,
  });
  const skylightDisc = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 3.32, 32, 1),
    skylightDiffuserMat
  );
  skylightDisc.rotation.x = Math.PI / 2;
  skylightDisc.position.y = bridgeHeight + 1.32;
  ceilingGroup.add(skylightDisc);

  // Central Overhead Sensor & Astrometric Hub Core inside the Skylight Oculus
  const oculusCenterHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.65, 0.28, 24),
    darkPedestalMat
  );
  oculusCenterHub.position.y = bridgeHeight + 1.24;
  ceilingGroup.add(oculusCenterHub);

  const oculusCenterBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  oculusCenterBeacon.position.y = bridgeHeight + 1.08;
  ceilingGroup.add(oculusCenterBeacon);

  root.add(ceilingGroup);

  // Ambient lighting inside the bridge so brushed silver & satin metallic mannequins gleam at 60 FPS
  const overheadDomeLight = new THREE.PointLight(0xf1f5f9, 3.2, 42);
  overheadDomeLight.position.set(0, bridgeHeight + 0.9, 0);
  root.add(overheadDomeLight);

  const bridgeHemiLight = new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 1.35);
  root.add(bridgeHemiLight);

  const forwardConsoleFillLight = new THREE.PointLight(0xbae6fd, 1.6, 26);
  forwardConsoleFillLight.position.set(0, 3.8, -4.5);
  root.add(forwardConsoleFillLight);

  const aftFillLight = new THREE.PointLight(0xe2e8f0, 1.4, 26);
  aftFillLight.position.set(0, 3.8, 5.5);
  root.add(aftFillLight);

  const alertRedLight = new THREE.PointLight(0xef4444, 0.0, 38);
  alertRedLight.position.set(0, bridgeHeight - 0.4, 0);
  root.add(alertRedLight);

  // --- REAR-RIGHT RECESSED TURBOLIFT ALCOVE WITH PERFORATED GRID WALL & SLIDING DOUBLE DOORS ---
  const turboAngle = 2.58; // Rear-right sector matching the reference image!
  const turboGroup = new THREE.Group();
  turboGroup.position.set(
    Math.sin(turboAngle) * (bridgeRadius - 0.55),
    walkwayHeight,
    Math.cos(turboAngle) * (bridgeRadius - 0.55)
  );
  turboGroup.rotation.y = turboAngle + Math.PI; // Faces inward toward the center pit

  // Procedural Perforated Grid Wall Texture for the Turbolift Alcove
  const perfCanvas = document.createElement('canvas');
  perfCanvas.width = 256;
  perfCanvas.height = 256;
  const perfCtx = perfCanvas.getContext('2d')!;
  perfCtx.fillStyle = '#8a95a5';
  perfCtx.fillRect(0, 0, 256, 256);
  perfCtx.fillStyle = '#2b2f36';
  for (let py = 8; py < 256; py += 12) {
    for (let px = 8; px < 256; px += 12) {
      perfCtx.beginPath();
      perfCtx.arc(px, py, 2.8, 0, Math.PI * 2);
      perfCtx.fill();
    }
  }
  const perfTex = new THREE.CanvasTexture(perfCanvas);
  perfTex.wrapS = THREE.RepeatWrapping;
  perfTex.wrapT = THREE.RepeatWrapping;
  perfTex.repeat.set(3, 3);
  perfTex.colorSpace = THREE.SRGBColorSpace;

  const perfWallMat = new THREE.MeshStandardMaterial({
    map: perfTex,
    metalness: 0.55,
    roughness: 0.4,
  });

  // Recessed Alcove Back Wall (Perforated Grid)
  const alcoveBack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.4, 0.16), perfWallMat);
  alcoveBack.position.set(0, 2.2, -0.45);
  turboGroup.add(alcoveBack);

  // Left & Right Brushed Silver Alcove Side Pilasters
  for (const sx of [-1.65, 1.65]) {
    const pilaster = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 4.6, 1.15),
      brushedSilverBulkheadMat
    );
    pilaster.position.set(sx, 2.3, -0.1);
    turboGroup.add(pilaster);
  }

  // Top Header Lintel
  const turboHeader = new THREE.Mesh(
    new THREE.BoxGeometry(3.75, 0.45, 1.15),
    brushedSilverBulkheadMat
  );
  turboHeader.position.set(0, 4.5, -0.1);
  turboGroup.add(turboHeader);

  // Sliding Metallic Double Doors (#7d8796)
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x7d8796,
    metalness: 0.68,
    roughness: 0.28,
  });
  for (const sx of [-0.56, 0.56]) {
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.08, 3.65, 0.12), doorMat);
    doorPanel.position.set(sx, 1.83, -0.35);
    turboGroup.add(doorPanel);
  }

  // Center Door Seam & Metallic Door Frame
  const doorSeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 3.68, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x0f172a })
  );
  doorSeam.position.set(0, 1.83, -0.35);
  turboGroup.add(doorSeam);

  // Illuminated Red-Orange Intercom Plaque on the Left Pilaster (matching reference image!)
  const intercomPlaque = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.58, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0x111827,
      emissive: 0xff6600,
      emissiveIntensity: 0.45,
    })
  );
  intercomPlaque.position.set(-1.65, 2.55, 0.49);
  turboGroup.add(intercomPlaque);

  // External Cylindrical Turbolift Housing & Hemispherical Dome on the outside of the bulkhead
  const extTurboCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 1.85, 4.6, 28),
    brushedSilverBulkheadMat
  );
  extTurboCylinder.position.set(0, 2.3, -2.25);
  turboGroup.add(extTurboCylinder);

  const extTurboDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.75, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    recessedMonitorFrameMat
  );
  extTurboDome.position.set(0, 4.55, -2.25);
  turboGroup.add(extTurboDome);

  root.add(turboGroup);

  // ---------------------------------------------------------------------------
  // 4. FORWARD PANORAMIC MAIN VIEWSCREEN + EMBEDDED DIEGETIC HUD OVERLAY
  // ---------------------------------------------------------------------------
  const viewscreenRenderTarget = new THREE.WebGLRenderTarget(1280, 640, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  });
  viewscreenRenderTarget.texture.colorSpace = THREE.SRGBColorSpace;

  const viewscreenCamera = new THREE.PerspectiveCamera(52, 2.0, 0.8, 52000);

  const viewscreenGroup = new THREE.Group();
  // Positioned on the forward bulkhead above the lower forward sensor console, matching reference image!
  viewscreenGroup.position.set(0, 3.18, 0);

  const screenRadius = bridgeRadius - 0.55;
  const screenArc = 0.62; // Framed cleanly in the forward bulkhead sector
  const screenHeight = 2.65;
  const curvedScreenGeo = new THREE.CylinderGeometry(
    screenRadius,
    screenRadius,
    screenHeight,
    40,
    1,
    true,
    Math.PI - screenArc / 2,
    screenArc
  );
  const uvAttr = curvedScreenGeo.attributes.uv;
  for (let i = 0; i < uvAttr.count; i++) {
    uvAttr.setX(i, 1.0 - uvAttr.getX(i));
  }
  uvAttr.needsUpdate = true;

  const viewscreenMat = new THREE.MeshBasicMaterial({
    map: viewscreenRenderTarget.texture,
    side: THREE.BackSide,
    toneMapped: false,
  });
  const viewscreenMesh = new THREE.Mesh(curvedScreenGeo, viewscreenMat);
  viewscreenGroup.add(viewscreenMesh);

  // Brushed Silver Bulkhead Frame around the Main Viewscreen
  for (const yOff of [-screenHeight / 2 - 0.12, screenHeight / 2 + 0.12]) {
    const bezelArc = new THREE.Mesh(
      new THREE.TorusGeometry(screenRadius, 0.14, 10, 40, screenArc + 0.04),
      brushedSilverBulkheadMat
    );
    bezelArc.rotation.x = Math.PI / 2;
    bezelArc.rotation.z = -Math.PI / 2 - (screenArc + 0.04) / 2;
    bezelArc.position.y = yOff;
    viewscreenGroup.add(bezelArc);
  }

  // --- EMBEDDED 3D MAIN VIEWSCREEN TELEMETRY & TACTICAL RETICLE OVERLAY ---
  const vsHudCanvas = document.createElement('canvas');
  vsHudCanvas.width = 1280;
  vsHudCanvas.height = 640;
  const vsHudCtx = vsHudCanvas.getContext('2d')!;
  const vsHudTex = new THREE.CanvasTexture(vsHudCanvas);
  vsHudTex.colorSpace = THREE.SRGBColorSpace;

  const curvedHudGeo = new THREE.CylinderGeometry(
    screenRadius - 0.04,
    screenRadius - 0.04,
    screenHeight,
    40,
    1,
    true,
    Math.PI - screenArc / 2,
    screenArc
  );
  const hudUvAttr = curvedHudGeo.attributes.uv;
  for (let i = 0; i < hudUvAttr.count; i++) {
    hudUvAttr.setX(i, 1.0 - hudUvAttr.getX(i));
  }
  hudUvAttr.needsUpdate = true;

  const viewscreenHudMesh = new THREE.Mesh(
    curvedHudGeo,
    new THREE.MeshBasicMaterial({
      map: vsHudTex,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  );
  viewscreenGroup.add(viewscreenHudMesh);

  const redrawViewscreen3DOverlay = () => {
    const ctx = vsHudCtx;
    ctx.clearRect(0, 0, 1280, 640);

    // 1. TOP-LEFT CORNER: Sleek, Semi-Transparent Target Telemetry Readout
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(28, 22, 635, 96);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 22, 635, 96);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(28, 22, 12, 96);

    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `MAIN VIEWSCREEN TELEMETRY // MAG ${hw.viewscreenZoom.toFixed(1)}X · BRG ${String(
        (hw.targetBearingDeg + 360) % 360
      ).padStart(3, '0')}°`,
      52,
      46
    );

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    const primaryLine = `${hw.targetName.toUpperCase()} — ${hw.targetClassification}`;
    ctx.fillText(primaryLine.slice(0, 48), 52, 74);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 15px monospace';
    const secondaryLine = `${hw.targetAtmosphere} | Grav: ${hw.targetGravity} | Dist: ${formatAstronomicalDistance(hw.targetDistanceKm, 'standard')}`;
    ctx.fillText(secondaryLine.slice(0, 62), 52, 102);

    // 2. TOP-RIGHT CORNER: Master Power Pool, Orbit Lock & Alert Status
    ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
    ctx.fillRect(820, 22, 432, 96);
    ctx.strokeStyle =
      hw.alertLevel === 'red'
        ? '#ef4444'
        : hw.orbitalVelocityLocked
        ? '#10b981'
        : 'rgba(245, 158, 11, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(820, 22, 432, 96);

    ctx.fillStyle =
      hw.alertLevel === 'red'
        ? '#f87171'
        : hw.alertLevel === 'yellow'
        ? '#fde047'
        : '#34d399';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(
      `ALERT: ${hw.alertLevel.toUpperCase()} // ${
        hw.orbitalVelocityLocked
          ? 'ORBITAL VELOCITY LOCKED'
          : formatStarshipVelocity(hw.isWarping, hw.warpFactor, hw.throttlePercent, hw.isBoostActive, true)
      }`,
      838,
      48
    );

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `POWER POOL: ENG ${hw.powerEngines}% | SHD ${hw.powerShields}% | WPN ${hw.powerWeapons}%`,
      838,
      74
    );

    ctx.fillStyle = hw.weaponsArmed ? '#f87171' : '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(
      `SHIELDS: ${Math.round(hw.shieldIntegrity)}% · HULL: ${Math.round(hw.hullIntegrity)}% · WEAPONS: ${
        hw.weaponsArmed ? 'ARMED (-40% DIPLOMACY)' : 'SAFE'
      }`,
      838,
      100
    );

    // 3. CENTER TACTICAL RETICLE: 3-Second Torpedo Lock, Subsystem Targeting & Phaser Thermal Heat Bar
    if (hw.weaponsArmed || hw.aliveHostilesCount > 0 || hw.lockedEnemyName || hw.isFiringPhasers) {
      const rcx = 640;
      const rcy = 340;
      const lockFrac = Math.max(0, Math.min(1, hw.torpedoLockSeconds / 3.0));
      const isLocked = lockFrac >= 0.99;

      ctx.beginPath();
      ctx.arc(rcx, rcy, 78, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rcx, rcy, 78, -Math.PI / 2, -Math.PI / 2 + lockFrac * Math.PI * 2);
      ctx.strokeStyle = isLocked ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rcx - 24, rcy);
      ctx.lineTo(rcx + 24, rcy);
      ctx.moveTo(rcx, rcy - 24);
      ctx.lineTo(rcx, rcy + 24);
      ctx.strokeStyle = isLocked ? '#10b981' : '#fde047';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      ctx.fillRect(450, 434, 380, 64);
      ctx.strokeStyle = isLocked ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(450, 434, 380, 64);

      ctx.fillStyle = isLocked ? '#34d399' : '#fde047';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isLocked
          ? `TORPEDO LOCK ACQUIRED (3.0s) // ${hw.lockedEnemyName || 'PRIMARY TARGET'}`
          : `ACQUIRING TORPEDO LOCK... ${hw.torpedoLockSeconds.toFixed(1)}s / 3.0s`,
        rcx,
        456
      );

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `SUBSYSTEM TARGET: [${hw.enemySubsystemTarget.toUpperCase()}] · TORPEDOES: ${hw.torpedoCount}`,
        rcx,
        482
      );

      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      ctx.fillRect(450, 506, 380, 26);
      const heatW = Math.round((Math.min(100, hw.phaserHeatPct) / 100) * 372);
      ctx.fillStyle = hw.phaserHeatPct > 80 ? '#ef4444' : hw.phaserHeatPct > 50 ? '#f59e0b' : '#38bdf8';
      ctx.fillRect(454, 510, heatW, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`PHASER THERMAL HEAT: ${Math.round(hw.phaserHeatPct)}%`, rcx, 524);
      ctx.textAlign = 'left';
    }

    vsHudTex.needsUpdate = true;
  };

  root.add(viewscreenGroup);

  // ---------------------------------------------------------------------------
  // 5. CONTINUOUS CURVED PERIMETER CONSOLE RING, UPPER MONITOR BANK,
  //    ANIMATED MIDDLE FASCIA STATUS MATRICES & RADIAL 3D BUTTON BANKS
  // ---------------------------------------------------------------------------
  // Create a high-detail CanvasTexture for auxiliary upper dual monitors (matching reference LCARS/CRT frames)
  const createAuxMonitorTexture = (title: string, mode: 'starchart' | 'waveform' | 'schem') => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#04060c';
    ctx.fillRect(0, 0, 512, 256);

    // Classic Starfleet Amber/Orange LCARS Outer Bezel (#ff9900)
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 244);

    // Corner L-bar accents
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(6, 6, 42, 28);
    ctx.fillRect(48, 6, 458, 24);
    ctx.fillStyle = '#04060c';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(title, 56, 23);

    // Side status pills inside monitor
    const pillPalette = ['#ff9900', '#ffcc00', '#38bdf8', '#22c55e', '#ef4444'];
    for (let p = 0; p < 6; p++) {
      ctx.fillStyle = pillPalette[p % pillPalette.length];
      ctx.fillRect(14, 40 + p * 33, 28, 22);
    }

    if (mode === 'starchart') {
      const grad = ctx.createRadialGradient(270, 142, 8, 270, 142, 145);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.65)');
      grad.addColorStop(0.45, 'rgba(249, 115, 22, 0.28)');
      grad.addColorStop(1, 'rgba(4, 6, 12, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(50, 36, 446, 204);

      // Astrometric coordinate grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.lineWidth = 1;
      for (let gx = 80; gx < 490; gx += 55) {
        ctx.beginPath();
        ctx.moveTo(gx, 38);
        ctx.lineTo(gx, 238);
        ctx.stroke();
      }
      for (let gy = 65; gy < 235; gy += 45) {
        ctx.beginPath();
        ctx.moveTo(52, gy);
        ctx.lineTo(492, gy);
        ctx.stroke();
      }

      // Concentric target rings
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.55)';
      ctx.beginPath();
      ctx.arc(270, 142, 48, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(270, 142, 86, 0, Math.PI * 2);
      ctx.stroke();

      for (let s = 0; s < 65; s++) {
        ctx.fillStyle = s % 5 === 0 ? '#fde047' : s % 7 === 0 ? '#38bdf8' : '#ffffff';
        ctx.fillRect(56 + ((s * 73) % 430), 42 + ((s * 43) % 190), s % 4 === 0 ? 3 : 2, s % 4 === 0 ? 3 : 2);
      }
    } else if (mode === 'waveform') {
      ctx.strokeStyle = 'rgba(255, 153, 0, 0.2)';
      ctx.lineWidth = 1;
      for (let gx = 60; gx < 490; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 40);
        ctx.lineTo(gx, 238);
        ctx.stroke();
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      for (let x = 54; x < 490; x += 3) {
        const y = 115 + Math.sin(x * 0.055) * 38 * Math.cos(x * 0.018);
        if (x === 54) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 54; x < 490; x += 3) {
        const y = 185 + Math.cos(x * 0.08) * 24;
        if (x === 54) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      // Ship systems schematic & telemetry bars
      const barCols = ['#22c55e', '#ff9900', '#38bdf8', '#ffcc00', '#ef4444'];
      for (let r = 0; r < 5; r++) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(58, 48 + r * 38, 424, 24);
        const w = 220 + ((r * 67) % 190);
        ctx.fillStyle = barCols[r % barCols.length];
        ctx.fillRect(60, 50 + r * 38, w, 20);
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const auxStarChartTex = createAuxMonitorTexture('SECTOR 001 ASTROMETRICS // DEEP SPACE SCAN', 'starchart');
  const auxWaveformTex = createAuxMonitorTexture('SUBSPACE HARMONIC TELEMETRY // CHANNEL A', 'waveform');
  const auxSchemTex = createAuxMonitorTexture('EPS POWER DISTRIBUTION // DECK 1 NOMINAL', 'schem');

  // Live Animated Middle Fascia Status Matrix CanvasTexture (green/yellow/orange/red indicator blocks matching reference!)
  const midFasciaCanvas = document.createElement('canvas');
  midFasciaCanvas.width = 1024;
  midFasciaCanvas.height = 128;
  const midFasciaCtx = midFasciaCanvas.getContext('2d')!;
  const midFasciaTex = new THREE.CanvasTexture(midFasciaCanvas);
  midFasciaTex.colorSpace = THREE.SRGBColorSpace;

  const redrawMidFasciaMatrix = (timeSec: number) => {
    const ctx = midFasciaCtx;
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, 1024, 128);

    // Top and bottom brushed chrome trim lines
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 1024, 4);
    ctx.fillRect(0, 124, 1024, 4);

    const statusColors = ['#22c55e', '#ff9900', '#ffcc00', '#ef4444', '#38bdf8', '#f97316'];
    const tick = Math.floor(timeSec * 3.5);

    // 4 distinct instrument clusters across the middle fascia strip
    for (let block = 0; block < 4; block++) {
      const bx = 14 + block * 252;
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(bx, 10, 240, 108);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, 10, 240, 108);

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          const idx = block * 32 + r * 8 + c;
          const isLit = (idx * 7 + tick + r * 3) % 5 !== 0;
          const colHex =
            hw.alertLevel === 'red' && (idx + tick) % 3 === 0
              ? '#ef4444'
              : statusColors[(idx + r * 2) % statusColors.length];
          ctx.fillStyle = isLit ? colHex : '#141923';
          ctx.fillRect(bx + 10 + c * 28, 18 + r * 24, 22, 18);
          if (isLit) {
            ctx.fillStyle = 'rgba(255,255,255,0.38)';
            ctx.fillRect(bx + 12 + c * 28, 20 + r * 24, 18, 4);
          }
        }
      }
    }
    midFasciaTex.needsUpdate = true;
  };

  // Live Animated Rotating Radial Moiré Sensor Wheel CanvasTexture (for Science Alcove Fascia, matching reference!)
  const moireCanvas = document.createElement('canvas');
  moireCanvas.width = 256;
  moireCanvas.height = 256;
  const moireCtx = moireCanvas.getContext('2d')!;
  const moireScopeTex = new THREE.CanvasTexture(moireCanvas);
  moireScopeTex.colorSpace = THREE.SRGBColorSpace;

  const redrawMoireScope = (timeSec: number) => {
    const ctx = moireCtx;
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, 256, 256);

    const cx = 128;
    const cy = 128;
    const r = 114;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    // Alternating high-contrast radial black/white/cyan Moiré wedges rotating in opposite directions
    const numWedges = 36;
    for (let i = 0; i < numWedges; i++) {
      const a0 = (i / numWedges) * Math.PI * 2 + timeSec * 0.85;
      const a1 = ((i + 0.5) / numWedges) * Math.PI * 2 + timeSec * 0.85;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : '#38bdf8';
      ctx.fill();
    }

    // Counter-rotating concentric interference rings
    for (let ringR = 22; ringR < r; ringR += 18) {
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(-timeSec * 1.6) * 6,
        cy + Math.sin(-timeSec * 1.6) * 6,
        ringR,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = '#05070c';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // Center glowing core
    const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.5, '#ff9900');
    coreGrad.addColorStop(1, 'rgba(5, 7, 12, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Outer chrome ring border
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 6;
    ctx.stroke();

    moireScopeTex.needsUpdate = true;
  };

  redrawMidFasciaMatrix(0);
  redrawMoireScope(0);

  // Build the 12-Sector Perimeter Console Ring around the outer wall (skipping Sector 5 which is the Rear-Right Turbolift Alcove)
  const totalSectors = 12;
  const consoleInnerR = 10.25;
  const consoleOuterR = 12.15;

  // InstancedMesh for hundreds of glowing 3D Starfleet backlit keycap buttons arranged in curved radial arcs across all perimeter sectors
  const microBtnGeo = new THREE.BoxGeometry(0.072, 0.028, 0.052);
  const microBtnMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const maxMicroBtns = 720;
  const microBtnInstanced = new THREE.InstancedMesh(microBtnGeo, microBtnMat, maxMicroBtns);
  const btnColors = [
    new THREE.Color(0xff9900), // Starfleet Warm Amber
    new THREE.Color(0xffcc00), // Command Gold
    new THREE.Color(0xff4d1a), // Red-Orange
    new THREE.Color(0x38bdf8), // Science Cyan
    new THREE.Color(0x22c55e), // Operations Emerald
    new THREE.Color(0xf8fafc), // Crisp White
  ];
  let btnInstanceIdx = 0;
  const dummyMat4 = new THREE.Matrix4();
  const dummyPos = new THREE.Vector3();
  const dummyQuat = new THREE.Quaternion();
  const dummyScale = new THREE.Vector3(1, 1, 1);

  for (let s = 0; s < totalSectors; s++) {
    // Sector angle: s=0 is Forward (0 rad, z = -R), going clockwise
    const sectorAngle = (s / totalSectors) * Math.PI * 2;
    // Skip the Rear-Right Turbolift Alcove sector (around 2.58 rad, which is s = 5)
    if (s === 5) continue;

    const sectorGroup = new THREE.Group();
    const midR = (consoleInnerR + consoleOuterR) / 2;
    sectorGroup.position.set(
      Math.sin(sectorAngle) * midR,
      walkwayHeight,
      -Math.cos(sectorAngle) * midR
    );
    sectorGroup.rotation.y = -sectorAngle;
    root.add(sectorGroup);

    const segWidth = 5.42;

    // 1. Lower Console Base Kickplate & Sculpted Dark Charcoal Desk Body
    const baseBox = new THREE.Mesh(new THREE.BoxGeometry(segWidth, 0.92, 1.55), consoleBodyMat);
    baseBox.position.set(0, 0.46, 0);
    sectorGroup.add(baseBox);

    // 2. Recessed Glowing Under-Desk Cyan Accent Light Panel + Side Knee-Well Trim (matching reference image!)
    const cyanPanelBack = new THREE.Mesh(
      new THREE.BoxGeometry(segWidth * 0.52, 0.34, 0.04),
      darkPedestalMat
    );
    cyanPanelBack.position.set(0, 0.34, 0.77);
    sectorGroup.add(cyanPanelBack);

    const cyanPanel = new THREE.Mesh(new THREE.PlaneGeometry(segWidth * 0.48, 0.28), underDeskCyanGlowMat);
    cyanPanel.position.set(0, 0.34, 0.795);
    sectorGroup.add(cyanPanel);

    // 3. Iconic Red-Orange Front Bullnose & Side Divider Trim (#d9532f)
    const orangeTrim = new THREE.Mesh(new THREE.BoxGeometry(segWidth + 0.04, 0.145, 0.095), redOrangeTrimMat);
    orangeTrim.position.set(0, 0.86, 0.765);
    sectorGroup.add(orangeTrim);

    // Angled Red-Orange Sidecheek Ribs between adjacent perimeter bays
    for (const sx of [-segWidth / 2 + 0.04, segWidth / 2 - 0.04]) {
      const cheekRib = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.22, 1.38),
        redOrangeTrimMat
      );
      cheekRib.position.set(sx, 1.03, 0.12);
      cheekRib.rotation.x = 0.34;
      sectorGroup.add(cheekRib);
    }

    // 4. Sloped Dark Obsidian Desk Surface
    const deskSlope = new THREE.Mesh(new THREE.BoxGeometry(segWidth, 0.08, 1.35), consoleBodyMat);
    deskSlope.position.set(0, 1.02, 0.12);
    deskSlope.rotation.x = 0.34;
    sectorGroup.add(deskSlope);

    // Populate this sector's sloped desk with curved radial arc banks of glowing 3D Starfleet micro-buttons
    sectorGroup.updateMatrixWorld(true);
    for (const clusterCenterX of [-1.85, 1.85]) {
      for (let row = 0; row < 4; row++) {
        const arcR = 0.32 + row * 0.095;
        for (let col = 0; col < 7; col++) {
          if (btnInstanceIdx >= maxMicroBtns) break;
          const a = ((col - 3) / 3.5) * 0.68;
          const lx = clusterCenterX + Math.sin(a) * arcR;
          const lzOffset = Math.cos(a) * arcR - 0.42;
          const localBtnPos = new THREE.Vector3(
            lx,
            1.065 - lzOffset * Math.sin(0.34),
            0.14 + lzOffset * Math.cos(0.34)
          );
          localBtnPos.applyMatrix4(sectorGroup.matrixWorld);
          dummyPos.copy(localBtnPos);
          dummyQuat.setFromEuler(new THREE.Euler(0.34, -sectorAngle - a * 0.35, 0, 'YXZ'));
          dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
          microBtnInstanced.setMatrixAt(btnInstanceIdx, dummyMat4);
          microBtnInstanced.setColorAt(
            btnInstanceIdx,
            btnColors[(s * 7 + row * 5 + col * 3) % btnColors.length]
          );
          btnInstanceIdx++;
        }
      }
    }

    // 5. Middle Vertical Status Matrix Band (between sloped desk and upper monitors, matching reference image!)
    const midFascia = new THREE.Mesh(new THREE.BoxGeometry(segWidth, 0.64, 0.34), consoleBodyMat);
    midFascia.position.set(0, 1.48, -0.52);
    sectorGroup.add(midFascia);

    const midScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(segWidth * 0.92, 0.48),
      new THREE.MeshBasicMaterial({ map: midFasciaTex, toneMapped: false })
    );
    midScreen.position.set(0, 1.48, -0.345);
    sectorGroup.add(midScreen);

    // Upper-lip Red-Orange Molding Strip separating Middle Fascia from Upper Bulkhead Monitors
    const midTopOrangeLip = new THREE.Mesh(
      new THREE.BoxGeometry(segWidth, 0.06, 0.38),
      redOrangeTrimMat
    );
    midTopOrangeLip.position.set(0, 1.81, -0.52);
    sectorGroup.add(midTopOrangeLip);

    // For non-viewscreen sectors, add the angled Brushed-Silver Upper Bulkhead Monitor Housing
    if (s !== 0) {
      const upperFrame = new THREE.Mesh(
        new THREE.BoxGeometry(segWidth - 0.10, 1.58, 0.36),
        brushedSilverBulkheadMat
      );
      upperFrame.position.set(0, 2.72, -0.68);
      upperFrame.rotation.x = 0.14;
      sectorGroup.add(upperFrame);

      const innerRecess = new THREE.Mesh(
        new THREE.BoxGeometry(segWidth - 0.38, 1.36, 0.12),
        recessedMonitorFrameMat
      );
      innerRecess.position.set(0, 2.70, -0.53);
      innerRecess.rotation.x = 0.14;
      sectorGroup.add(innerRecess);

      // Center vertical brushed-silver mullion dividing the Dual Upper Monitors
      const centerMullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 1.40, 0.16),
        brushedSilverBulkheadMat
      );
      centerMullion.position.set(0, 2.70, -0.50);
      centerMullion.rotation.x = 0.14;
      sectorGroup.add(centerMullion);

      // Decorative dual upper monitors on auxiliary sectors (overridden by live interactive canvases on the 4 main perimeter stations)
      for (const mx of [-1.26, 1.26]) {
        const texChoice =
          mx < 0
            ? s % 2 === 0
              ? auxStarChartTex
              : auxSchemTex
            : s % 3 === 0
            ? auxSchemTex
            : auxWaveformTex;
        const auxMon = new THREE.Mesh(
          new THREE.PlaneGeometry(2.08, 1.06),
          new THREE.MeshBasicMaterial({
            map: texChoice,
            toneMapped: false,
          })
        );
        auxMon.position.set(mx, 2.70, -0.46);
        auxMon.rotation.x = 0.14;
        sectorGroup.add(auxMon);
      }
    }
  }

  microBtnInstanced.count = btnInstanceIdx;
  microBtnInstanced.instanceMatrix.needsUpdate = true;
  if (microBtnInstanced.instanceColor) microBtnInstanced.instanceColor.needsUpdate = true;
  root.add(microBtnInstanced);

  // ---------------------------------------------------------------------------
  // 6. CENTER PEDESTAL: CAPTAIN'S CHAIR (`captain`) WITH EMBEDDED ARMREST CONTROLS
  // ---------------------------------------------------------------------------
  const captainChair = new THREE.Group();
  captainChair.position.set(0, 0.22, 1.15);
  captainChair.name = 'Station_captain';

  // Tiered dark-grey & silver pedestal base matching the reference image
  const chairPedestalTier1 = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.22, 1.38),
    darkPedestalMat
  );
  chairPedestalTier1.position.y = 0.11;
  captainChair.add(chairPedestalTier1);

  const chairPedestalTier2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.34, 0.96),
    brushedSilverBulkheadMat
  );
  chairPedestalTier2.position.y = 0.38;
  captainChair.add(chairPedestalTier2);

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.16, 1.05), consoleBodyMat);
  seatCushion.position.y = 0.56;
  captainChair.add(seatCushion);

  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.05, 0.18), consoleBodyMat);
  backrest.position.set(0, 1.12, 0.46);
  backrest.rotation.x = 0.08;
  captainChair.add(backrest);

  // Iconic Angled Metallic-Silver Wedge Armrests (#8a95a5) + Red-Orange Front Accents matching the reference image!
  for (const side of [-1, 1]) {
    const armWedge = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.44, 1.18),
      brushedSilverBulkheadMat
    );
    armWedge.position.set(side * 0.68, 0.72, -0.02);
    captainChair.add(armWedge);

    const armFrontAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.14, 0.05),
      redOrangeTrimMat
    );
    armFrontAccent.position.set(side * 0.68, 0.78, -0.60);
    captainChair.add(armFrontAccent);
  }

  // --- CAPTAIN LEFT ARMREST 3D PAD: 100-Unit Master Power Pool (3 Linked Sliders) + Alerts ---
  const capLeftCanvas = document.createElement('canvas');
  capLeftCanvas.width = 512;
  capLeftCanvas.height = 512;
  const capLeftCtx = capLeftCanvas.getContext('2d')!;
  const capLeftTex = new THREE.CanvasTexture(capLeftCanvas);
  capLeftTex.colorSpace = THREE.SRGBColorSpace;
  capLeftTex.anisotropy = 4;

  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.66, 0.96, -0.18);
  leftArmGroup.rotation.set(-Math.PI / 2 + 0.48, 0.18, 0);
  captainChair.add(leftArmGroup);

  const leftArmBezel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.04), consoleBodyMat);
  leftArmBezel.position.z = -0.022;
  leftArmGroup.add(leftArmBezel);

  const captainLeftArmPadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.48),
    new THREE.MeshBasicMaterial({ map: capLeftTex, toneMapped: false })
  );
  captainLeftArmPadMesh.userData.consoleSurfaceId = 'captain_left';
  leftArmGroup.add(captainLeftArmPadMesh);
  interactiveConsoleMeshes.push(captainLeftArmPadMesh);

  // Physical 3D Slider Caps on Left Armrest
  const leftSliderCaps: THREE.Mesh[] = [];
  const sliderColors = [0xf59e0b, 0x38bdf8, 0xef4444];
  for (let i = 0; i < 3; i++) {
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.04, 0.03),
      new THREE.MeshStandardMaterial({
        color: sliderColors[i],
        emissive: sliderColors[i],
        emissiveIntensity: 0.75,
        metalness: 0.7,
      })
    );
    cap.position.set(-0.16 + i * 0.16, 0.02, 0.018);
    cap.userData.delegateSurface = captainLeftArmPadMesh;
    leftArmGroup.add(cap);
    leftSliderCaps.push(cap);
  }

  const redrawCaptainLeftArmrest = () => {
    const ctx = capLeftCtx;
    ctx.fillStyle = '#070a10';
    ctx.fillRect(0, 0, 512, 512);

    // Outer metallic Starfleet bezel frame
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 504);

    ctx.fillStyle = '#ff9900';
    ctx.fillRect(12, 10, 488, 36);
    ctx.fillStyle = '#05070c';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('LEFT ARMREST // 100-UNIT POWER POOL', 22, 34);

    const channels = [
      { id: 'pwr_engines', label: 'ENGINES', val: hw.powerEngines, x: 32, color: '#ff9900' },
      { id: 'pwr_shields', label: 'SHIELDS', val: hw.powerShields, x: 186, color: '#38bdf8' },
      { id: 'pwr_weapons', label: 'WPN/SNS', val: hw.powerWeapons, x: 340, color: '#ef4444' },
    ];

    channels.forEach((ch, idx) => {
      const isHov = hoveredControlId === ch.id;
      ctx.fillStyle = '#0c1018';
      ctx.fillRect(ch.x, 58, 138, 314);
      ctx.strokeStyle = isHov ? '#ffffff' : ch.color;
      ctx.lineWidth = isHov ? 3 : 2;
      ctx.strokeRect(ch.x, 58, 138, 314);

      drawStarfleetKeycap(ctx, ch.x + 8, 64, 122, 28, ch.color, ch.label, isHov, true);

      // Segmented backlit LED fader track
      ctx.fillStyle = '#04060a';
      ctx.fillRect(ch.x + 26, 98, 86, 222);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(ch.x + 26, 98, 86, 222);

      const totalSegs = 16;
      const litSegs = Math.round((Math.max(0, Math.min(100, ch.val)) / 100) * totalSegs);
      for (let s = 0; s < totalSegs; s++) {
        const sy = 304 - s * 13;
        const isLit = s < litSegs;
        ctx.fillStyle = isLit ? ch.color : '#141a24';
        ctx.fillRect(ch.x + 32, sy, 74, 10);
        if (isLit) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(ch.x + 34, sy + 1, 70, 3);
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(ch.val)}%`, ch.x + 69, 354);
      ctx.textAlign = 'left';

      if (leftSliderCaps[idx]) {
        const norm = (ch.val - 50) / 100;
        leftSliderCaps[idx].position.y = 0.02 + norm * 0.20;
      }
    });

    const alerts: { id: string; level: 'green' | 'yellow' | 'red'; label: string; x: number; hex: string }[] = [
      { id: 'alert_green', level: 'green', label: 'GREEN ALERT', x: 18, hex: '#22c55e' },
      { id: 'alert_yellow', level: 'yellow', label: 'YELLOW ALERT', x: 182, hex: '#ffcc00' },
      { id: 'alert_red', level: 'red', label: 'RED ALERT', x: 346, hex: '#ef4444' },
    ];

    for (const al of alerts) {
      const isAct = hw.alertLevel === al.level;
      const isHov = hoveredControlId === al.id;
      drawStarfleetKeycap(
        ctx,
        al.x,
        386,
        148,
        112,
        al.hex,
        al.label,
        isHov,
        isAct,
        isAct ? '[CONDITION ACTIVE]' : 'CLICK TO ENGAGE'
      );
    }

    capLeftTex.needsUpdate = true;
  };

  // --- CAPTAIN RIGHT ARMREST 3D PAD: Crew Advisory Display + [Take Manual Control] & [Order Officer] ---
  const capRightCanvas = document.createElement('canvas');
  capRightCanvas.width = 512;
  capRightCanvas.height = 512;
  const capRightCtx = capRightCanvas.getContext('2d')!;
  const capRightTex = new THREE.CanvasTexture(capRightCanvas);
  capRightTex.colorSpace = THREE.SRGBColorSpace;
  capRightTex.anisotropy = 4;

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.66, 0.96, -0.18);
  rightArmGroup.rotation.set(-Math.PI / 2 + 0.48, -0.18, 0);
  captainChair.add(rightArmGroup);

  const rightArmBezel = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.52, 0.04), consoleBodyMat);
  rightArmBezel.position.z = -0.022;
  rightArmGroup.add(rightArmBezel);

  const captainRightArmPadMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.48),
    new THREE.MeshBasicMaterial({ map: capRightTex, toneMapped: false })
  );
  captainRightArmPadMesh.userData.consoleSurfaceId = 'captain_right';
  rightArmGroup.add(captainRightArmPadMesh);
  interactiveConsoleMeshes.push(captainRightArmPadMesh);

  const redrawCaptainRightArmrest = () => {
    const ctx = capRightCtx;
    ctx.fillStyle = '#070a10';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 504);

    const officerTabs: { id: string; st: BridgeStationId; label: string; x: number; hex: string }[] = [
      { id: 'poll_helm', st: 'helm', label: 'SULU', x: 12, hex: '#ffcc00' },
      { id: 'poll_sci', st: 'science', label: 'SPOCK', x: 134, hex: '#38bdf8' },
      { id: 'poll_tac', st: 'tactical', label: 'CHEKOV', x: 256, hex: '#ef4444' },
      { id: 'poll_comms', st: 'comms', label: 'UHURA', x: 378, hex: '#22c55e' },
    ];

    for (const tab of officerTabs) {
      const isSel = hw.advisoryStation === tab.st;
      const isHov = hoveredControlId === tab.id;
      drawStarfleetKeycap(ctx, tab.x, 10, 118, 44, tab.hex, tab.label, isHov, isSel);
    }

    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(12, 64, 488, 218);
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(12, 64, 488, 218);

    ctx.fillStyle = '#ff9900';
    ctx.fillRect(12, 64, 488, 28);
    ctx.fillStyle = '#05070c';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`CREW ADVISORY // ${hw.advisoryOfficer}`, 22, 83);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(hw.advisoryTitle.slice(0, 42), 24, 116);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px monospace';
    wrapCanvasText(ctx, hw.advisoryQuote, 24, 146, 464, 22, 4);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(hw.lastCommandFeedback.slice(0, 52), 24, 268);

    const isManHov = hoveredControlId === 'advisory_manual';
    drawStarfleetKeycap(
      ctx,
      12,
      294,
      488,
      96,
      '#38bdf8',
      `[ TAKE MANUAL CONTROL -> ${hw.advisoryStation.toUpperCase()} ]`,
      isManHov,
      false,
      'FLY CAMERA TO 3D CONSOLE · 100% EFFICIENCY (+150 XP)'
    );

    const isDelHov = hoveredControlId === 'advisory_delegate';
    drawStarfleetKeycap(
      ctx,
      12,
      402,
      488,
      98,
      '#ff9900',
      '[ ORDER OFFICER TO EXECUTE ]',
      isDelHov,
      false,
      'AI EXECUTES TASK AT 75% EFFICIENCY · STAY IN CHAIR'
    );

    capRightTex.needsUpdate = true;
  };

  // Articulated Metallic Mannequin Seated in the Captain's Chair (Auto-hidden when activeStation === 'captain')
  const captainMannequin = buildArticulatedMannequin({
    name: 'Captain_Kirk',
    pose: 'captain_seated',
    phaseOffset: 0.0,
    primarySeatStationId: 'captain',
  });
  captainMannequin.group.position.set(0, 0.12, -0.02);
  captainChair.add(captainMannequin.group);
  mannequinRigs.push(captainMannequin);

  const captainHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 2.2, 2.2),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  captainHitbox.position.y = 1.1;
  captainHitbox.userData.bridgeStationId = 'captain';
  captainChair.add(captainHitbox);
  interactiveHitboxes.push(captainHitbox);

  const captainBeacon = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.035, 10, 32),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.55 })
  );
  captainBeacon.rotation.x = Math.PI / 2;
  captainBeacon.position.y = 0.03;
  captainChair.add(captainBeacon);
  stationRingBeacons.set('captain', captainBeacon);

  stationGroups.set('captain', captainChair);
  root.add(captainChair);

  // ---------------------------------------------------------------------------
  // 7. FORWARD HELM & NAVIGATION ISLAND (`helm`) WITH RED-ORANGE TRIM,
  //    CENTRAL SILVER PILLAR, ASTROGATION DOME & CURVED STARFLEET KEYCAP ARCS
  // ---------------------------------------------------------------------------
  const helmConsole = new THREE.Group();
  helmConsole.position.set(0, 0.22, -1.85);
  helmConsole.name = 'Station_helm';

  // Stepped dark base & sculpted brushed-silver central support pillar (matching reference image!)
  const helmSteppedBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.68, 0.24, 1.58),
    darkPedestalMat
  );
  helmSteppedBase.position.set(0, 0.12, 0.05);
  helmConsole.add(helmSteppedBase);

  const helmCentralPillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.96, 0.84),
    brushedSilverBulkheadMat
  );
  helmCentralPillar.position.set(0, 0.56, -0.24);
  helmConsole.add(helmCentralPillar);

  const helmSubPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(1.92, 0.72, 0.94),
    consoleBodyMat
  );
  helmSubPedestal.position.set(0, 0.52, 0.08);
  helmConsole.add(helmSubPedestal);

  // T-Shaped Angled Dual Console Desk Body with Red-Orange Side & Front Trim (#d9532f)
  const helmDeskBody = new THREE.Mesh(
    new THREE.BoxGeometry(3.48, 0.28, 1.20),
    consoleBodyMat
  );
  helmDeskBody.position.set(0, 0.98, 0.12);
  helmDeskBody.rotation.x = 0.26;
  helmConsole.add(helmDeskBody);

  // Red-Orange Front, Rear & Side Trim around the Helm/Navigation Island (#d9532f)
  const helmFrontOrangePanel = new THREE.Mesh(
    new THREE.BoxGeometry(3.50, 0.24, 0.06),
    redOrangeTrimMat
  );
  helmFrontOrangePanel.position.set(0, 0.84, -0.45);
  helmFrontOrangePanel.rotation.x = 0.26;
  helmConsole.add(helmFrontOrangePanel);

  const helmRearOrangeLip = new THREE.Mesh(
    new THREE.BoxGeometry(3.50, 0.09, 0.05),
    redOrangeTrimMat
  );
  helmRearOrangeLip.position.set(0, 1.02, 0.71);
  helmRearOrangeLip.rotation.x = 0.26;
  helmConsole.add(helmRearOrangeLip);

  for (const sx of [-1.75, 1.75]) {
    const sideOrangeTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.27, 1.22),
      redOrangeTrimMat
    );
    sideOrangeTrim.position.set(sx, 0.98, 0.12);
    sideOrangeTrim.rotation.x = 0.26;
    helmConsole.add(sideOrangeTrim);
  }

  // Central Astrogation Sight Hood & Illuminated Compass Dome between Helm (left) and Navigation (right)
  const astroHoodBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.12, 24),
    brushedSilverBulkheadMat
  );
  astroHoodBase.position.set(0, 1.21, -0.22);
  astroHoodBase.rotation.x = 0.26;
  helmConsole.add(astroHoodBase);

  const astroGlowLens = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.95,
      roughness: 0.15,
      metalness: 0.2,
    })
  );
  astroGlowLens.position.set(0, 1.25, -0.21);
  astroGlowLens.rotation.x = 0.26;
  helmConsole.add(astroGlowLens);

  // Interactive 3D CanvasTexture on Lt. Sulu's Sloped Desk Surface
  const suluCanvas = document.createElement('canvas');
  suluCanvas.width = 1024;
  suluCanvas.height = 512;
  const suluCtx = suluCanvas.getContext('2d')!;
  const suluConsoleTex = new THREE.CanvasTexture(suluCanvas);
  suluConsoleTex.colorSpace = THREE.SRGBColorSpace;
  suluConsoleTex.anisotropy = 4;

  const suluConsoleMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.32, 1.08),
    new THREE.MeshBasicMaterial({ map: suluConsoleTex, toneMapped: false })
  );
  suluConsoleMesh.position.set(0, 1.135, 0.14);
  suluConsoleMesh.rotation.x = -Math.PI / 2 + 0.26;
  suluConsoleMesh.userData.consoleSurfaceId = 'helm_desk';
  helmConsole.add(suluConsoleMesh);
  interactiveConsoleMeshes.push(suluConsoleMesh);

  // Physical 3D Hardware Mounted Directly onto Sulu's 3D Console Surface
  const suluHardwareGroup = new THREE.Group();
  suluHardwareGroup.position.copy(suluConsoleMesh.position);
  suluHardwareGroup.rotation.copy(suluConsoleMesh.rotation);
  helmConsole.add(suluHardwareGroup);

  const knobMatCyan = new THREE.MeshStandardMaterial({
    color: 0x00d2ff,
    emissive: 0x0284c7,
    emissiveIntensity: 0.8,
    metalness: 0.8,
    roughness: 0.2,
  });
  const knobMatAmber = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    metalness: 0.8,
    roughness: 0.2,
  });

  const alcubierreContractKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 0.05, 24),
    knobMatCyan
  );
  alcubierreContractKnob.rotation.x = Math.PI / 2;
  alcubierreContractKnob.position.set(0.15, 0.16, 0.025);
  suluHardwareGroup.add(alcubierreContractKnob);

  const alcubierreExpandKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 0.05, 24),
    knobMatAmber
  );
  alcubierreExpandKnob.rotation.x = Math.PI / 2;
  alcubierreExpandKnob.position.set(0.58, 0.16, 0.025);
  suluHardwareGroup.add(alcubierreExpandKnob);

  const dampenerSwitchMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, emissiveIntensity: 0.8 })
  );
  dampenerSwitchMesh.position.set(-0.42, -0.26, 0.022);
  suluHardwareGroup.add(dampenerSwitchMesh);

  const warpThrottleLeverGroup = new THREE.Group();
  warpThrottleLeverGroup.position.set(1.05, 0.24, 0.03);
  const leverStalk = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.11), chromeMat);
  leverStalk.position.z = 0.05;
  warpThrottleLeverGroup.add(leverStalk);
  const leverGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.16, 16), knobMatCyan);
  leverGrip.rotation.z = Math.PI / 2;
  leverGrip.position.z = 0.11;
  warpThrottleLeverGroup.add(leverGrip);
  suluHardwareGroup.add(warpThrottleLeverGroup);

  const redrawSulu3DConsole = () => {
    const ctx = suluCtx;
    // Deep Starfleet Obsidian Desk Plate (#07090f)
    ctx.fillStyle = '#07090f';
    ctx.fillRect(0, 0, 1024, 512);

    // Top Header Bar with Starfleet Amber LCARS Strip
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(14, 10, 355, 34);
    ctx.fillStyle = '#05070c';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('LT. SULU // 3D HELM & ASTROGATION', 24, 32);

    const cErr = Math.abs(hw.alcubierreContraction - hw.optimalContraction);
    const eErr = Math.abs(hw.alcubierreExpansion - hw.optimalExpansion);
    const bubbleStability = Math.max(0, Math.min(100, Math.round(100 - (cErr + eErr) * 1.1)));

    ctx.fillStyle = '#0c111d';
    ctx.fillRect(378, 10, 632, 34);
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 2;
    ctx.strokeRect(378, 10, 632, 34);
    ctx.fillStyle = hw.orbitalVelocityLocked ? '#22c55e' : '#38bdf8';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      `HDG ${String(Math.round(hw.headingDeg)).padStart(3, '0')}° · PITCH ${
        hw.pitchDeg >= 0 ? '+' : ''
      }${Math.round(hw.pitchDeg)}° · ALCUBIERRE BUBBLE: ${bubbleStability}% · ${
        hw.orbitalVelocityLocked ? 'ORBIT LOCKED' : formatAstronomicalDistance(hw.targetDistanceKm, 'compact')
      }`,
      392,
      32
    );

    // ZONE 1 (x: 14..244, y: 54..410): 360° HEADING COMPASS, RADIAL BUTTON ARC & PITCH
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(14, 54, 230, 356);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 54, 230, 356);

    // Curved fan-shaped Starfleet backlit button arc crowning the Helm Compass
    drawRadialButtonArc(
      ctx,
      129,
      176,
      82,
      104,
      -68,
      68,
      9,
      2,
      ['#ff9900', '#ffcc00', '#38bdf8', '#ff4d1a', '#22c55e'],
      1
    );

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('360° ASTROGATION COMPASS', 129, 72);

    const cx = 129;
    const cy = 176;
    const r = 72;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = hoveredControlId === 'heading' ? '#1e293b' : '#04060a';
    ctx.fill();
    ctx.strokeStyle = hoveredControlId === 'heading' ? '#ffffff' : '#ff9900';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Compass degree ticks
    for (let d = 0; d < 360; d += 15) {
      const tr = ((d - 90) * Math.PI) / 180;
      const rIn = d % 45 === 0 ? r - 12 : r - 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(tr) * rIn, cy + Math.sin(tr) * rIn);
      ctx.lineTo(cx + Math.cos(tr) * (r - 2), cy + Math.sin(tr) * (r - 2));
      ctx.strokeStyle = d % 90 === 0 ? '#ffcc00' : '#475569';
      ctx.lineWidth = d % 45 === 0 ? 2 : 1;
      ctx.stroke();
    }

    const hRad = ((hw.headingDeg - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hRad) * (r - 10), cy + Math.sin(hRad) * (r - 10));
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`${String(Math.round(hw.headingDeg)).padStart(3, '0')}°`, cx, cy + 5);

    ctx.fillStyle = '#04060a';
    ctx.fillRect(28, 290, 202, 52);
    ctx.strokeStyle = hoveredControlId === 'pitch' ? '#ffffff' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 290, 202, 52);
    const pNorm = Math.max(-1, Math.min(1, hw.pitchDeg / 60));
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(129 + Math.min(0, pNorm * 88), 296, Math.abs(pNorm * 88) + 4, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`PITCH VECTOR (${Math.round(hw.pitchDeg)}°)`, cx, 321);
    ctx.textAlign = 'left';

    const isLvlHov = hoveredControlId === 'level_horizon';
    drawStarfleetKeycap(
      ctx,
      28,
      354,
      202,
      46,
      '#22c55e',
      'LEVEL HORIZON (0° PITCH)',
      isLvlHov,
      Math.abs(hw.pitchDeg) < 1
    );

    // ZONE 2 (x: 256..478, y: 54..410): STARFLEET BACKLIT IMPULSE KEYCAPS & INERTIAL DAMPENERS
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(256, 54, 222, 356);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(256, 54, 222, 356);

    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('IMPULSE THRUST KEYCAPS', 284, 74);

    const impBtns = [
      { id: 'imp_100', label: 'FULL IMPULSE (100%)', val: 100, y: 86, col: '#ff4d1a' },
      { id: 'imp_75', label: '3/4 IMPULSE (75%)', val: 75, y: 134, col: '#ff9900' },
      { id: 'imp_50', label: '1/2 IMPULSE (50%)', val: 50, y: 182, col: '#ffcc00' },
      { id: 'imp_25', label: '1/4 IMPULSE (25%)', val: 25, y: 230, col: '#22c55e' },
      { id: 'imp_0', label: 'ALL STOP (0%)', val: 0, y: 278, col: '#38bdf8' },
    ];

    for (const b of impBtns) {
      const isSel = !hw.isWarping && Math.abs(hw.throttlePercent - b.val) < 12;
      const isHov = hoveredControlId === b.id;
      drawStarfleetKeycap(ctx, 268, b.y, 198, 42, b.col, b.label, isHov, isSel);
    }

    const isDampHov = hoveredControlId === 'toggle_dampeners';
    drawStarfleetKeycap(
      ctx,
      268,
      332,
      198,
      68,
      hw.inertialDampeners ? '#22c55e' : '#ef4444',
      'INERTIAL DAMPENERS',
      isDampHov,
      hw.inertialDampeners,
      hw.inertialDampeners ? 'SWITCH: ONLINE [ON]' : 'SWITCH: DRIFT [OFF]'
    );

    // ZONE 3 (x: 490..774, y: 54..410): ALCUBIERRE WARP BUBBLE 3D ROTARY KNOBS & ORBITAL VELOCITY GAUGE
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(490, 54, 284, 356);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(490, 54, 284, 356);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('ALCUBIERRE WARP FIELD METRIC', 528, 74);

    drawCanvasRotaryKnob(
      ctx,
      562,
      160,
      44,
      hw.alcubierreContraction / 100,
      hw.optimalContraction / 100,
      'FWD CONTRACT',
      `${Math.round(hw.alcubierreContraction)}%`,
      '#38bdf8',
      hoveredControlId === 'alcubierre_contraction'
    );

    drawCanvasRotaryKnob(
      ctx,
      702,
      160,
      44,
      hw.alcubierreExpansion / 100,
      hw.optimalExpansion / 100,
      'REAR EXPAND',
      `${Math.round(hw.alcubierreExpansion)}%`,
      '#ff9900',
      hoveredControlId === 'alcubierre_expansion'
    );

    alcubierreContractKnob.rotation.y = ((hw.alcubierreContraction - 50) / 50) * 2.1;
    alcubierreExpandKnob.rotation.y = ((hw.alcubierreExpansion - 50) / 50) * 2.1;
    dampenerSwitchMesh.position.x = hw.inertialDampeners ? -0.38 : -0.46;
    (dampenerSwitchMesh.material as THREE.MeshStandardMaterial).color.setHex(
      hw.inertialDampeners ? 0x10b981 : 0xef4444
    );

    const isOrbHov = hoveredControlId === 'lock_orbit';
    ctx.fillStyle = '#05070c';
    ctx.fillRect(502, 248, 260, 152);
    ctx.strokeStyle = hw.orbitalVelocityLocked ? '#22c55e' : isOrbHov ? '#ffffff' : '#334155';
    ctx.lineWidth = hw.orbitalVelocityLocked ? 3 : 2;
    ctx.strokeRect(502, 248, 260, 152);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('ORBITAL VELOCITY BRACKET', 540, 268);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(516, 280, 232, 42);

    const bracketX = 516 + Math.round(0.30 * 232);
    const bracketW = Math.round(0.25 * 232);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.fillRect(bracketX, 280, bracketW, 42);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bracketX, 280, bracketW, 42);

    const curSpdNorm = hw.isWarping ? 1.0 : Math.max(0, Math.min(1, hw.throttlePercent / 100));
    const markerX = 516 + Math.round(curSpdNorm * 226);
    ctx.fillStyle = hw.orbitalVelocityLocked ? '#22c55e' : '#ffcc00';
    ctx.fillRect(markerX, 276, 8, 50);

    drawStarfleetKeycap(
      ctx,
      516,
      334,
      232,
      54,
      '#22c55e',
      hw.orbitalVelocityLocked ? '✓ STANDARD ORBIT LOCKED' : 'LOCK STANDARD ORBIT',
      isOrbHov,
      hw.orbitalVelocityLocked,
      'v = √(GM/r) CENTRIPETAL MATCH'
    );

    // ZONE 4 (x: 786..1010, y: 54..410): 3D SLIDING WARP THROTTLE LEVER & ENGAGE
    ctx.fillStyle = '#0b0f17';
    ctx.fillRect(786, 54, 224, 356);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(786, 54, 224, 356);

    ctx.fillStyle = '#ff9900';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`WARP THROTTLE: W${hw.warpFactor.toFixed(1)}`, 812, 74);

    ctx.fillStyle = '#04060a';
    ctx.fillRect(800, 88, 196, 74);
    ctx.strokeStyle = hoveredControlId === 'warp_slider' ? '#ffffff' : '#ff9900';
    ctx.lineWidth = 2;
    ctx.strokeRect(800, 88, 196, 74);

    const wfNorm = Math.max(0, Math.min(1, (hw.warpFactor - 1.0) / 8.9));
    // Segmented backlit warp factor bar
    for (let s = 0; s < 12; s++) {
      const sx = 806 + s * 15.5;
      const isLit = s / 12 <= wfNorm + 0.04;
      ctx.fillStyle = isLit ? (s >= 9 ? '#ef4444' : s >= 5 ? '#ff9900' : '#38bdf8') : '#141a24';
      ctx.fillRect(sx, 96, 12, 58);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`WARP FACTOR ${hw.warpFactor.toFixed(1)}`, 834, 132);

    warpThrottleLeverGroup.position.x = 0.85 + wfNorm * 0.45;

    const isWarpHov = hoveredControlId === 'toggle_warp';
    drawStarfleetKeycap(
      ctx,
      800,
      176,
      196,
      116,
      hw.isWarping ? '#ef4444' : '#38bdf8',
      hw.isWarping ? '[ DROP TO SUBLIGHT ]' : '[ ENGAGE WARP DRIVE ]',
      isWarpHov,
      hw.isWarping,
      bubbleStability >= 85 ? 'BUBBLE BALANCED (100%)' : `BUBBLE STABILITY ${bubbleStability}%`
    );

    const isBoostHov = hoveredControlId === 'trigger_boost';
    drawStarfleetKeycap(
      ctx,
      800,
      306,
      196,
      94,
      '#ff9900',
      hw.isBoostActive ? 'OVERDRIVE ACTIVE!' : 'EVASIVE THRUSTER BOOST',
      isBoostHov,
      hw.isBoostActive,
      '[SHIFT] IMPULSE SURGE'
    );

    // Bottom Starfleet Jelly-Bean Indicator Strip + Telemetry Legend
    ctx.fillStyle = '#090d16';
    ctx.fillRect(14, 420, 996, 78);
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(14, 420, 996, 78);

    const stripCols = ['#ff9900', '#ffcc00', '#ff4d1a', '#38bdf8', '#22c55e', '#f8fafc'];
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = stripCols[i % stripCols.length];
      ctx.fillRect(26 + i * 40.5, 428, 32, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(28 + i * 40.5, 430, 28, 4);
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(
      'FLIGHT CONTROLS: [W/S] PITCH · [A/D] YAW · [Q/E] ROLL · KEYS [1–6] STATIONS · [0] CUTAWAY OVERVIEW',
      38,
      478
    );

    suluConsoleTex.needsUpdate = true;
  };

  // Two Black Mid-Century Swivel Chairs at the Helm & Navigation Island
  const helmChairLeft = buildBridgeSwivelChair();
  helmChairLeft.position.set(-0.88, 0.22, 0.88);
  helmConsole.add(helmChairLeft);

  const navChairRight = buildBridgeSwivelChair();
  navChairRight.position.set(0.88, 0.22, 0.88);
  helmConsole.add(navChairRight);

  // Lt. Hikaru Sulu Seated at the Left Helm Seat (Auto-hidden when activeStation === 'helm')
  const helmMannequin = buildArticulatedMannequin({
    name: 'Helmsman_Sulu',
    characterId: 'sulu',
    pose: 'console_seated',
    phaseOffset: 0.8,
    primarySeatStationId: 'helm',
  });
  helmMannequin.group.position.set(-0.88, 0.26, 0.86);
  helmConsole.add(helmMannequin.group);
  mannequinRigs.push(helmMannequin);

  // Astrogation / Navigation Officer Seated at the Right Navigation Seat
  const navOfficer = buildArticulatedMannequin({
    name: 'Navigator_Kyle',
    characterId: 'navigator',
    pose: 'console_seated',
    phaseOffset: 1.9,
  });
  navOfficer.group.position.set(0.88, 0.26, 0.86);
  helmConsole.add(navOfficer.group);
  mannequinRigs.push(navOfficer);

  const helmHitbox = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 2.2, 2.4),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  helmHitbox.position.set(0, 1.1, 0.2);
  helmHitbox.userData.bridgeStationId = 'helm';
  helmConsole.add(helmHitbox);
  interactiveHitboxes.push(helmHitbox);

  const helmBeacon = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.035, 10, 36),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.45 })
  );
  helmBeacon.rotation.x = Math.PI / 2;
  helmBeacon.position.set(0, 0.24, 0.35);
  helmConsole.add(helmBeacon);
  stationRingBeacons.set('helm', helmBeacon);

  stationGroups.set('helm', helmConsole);
  root.add(helmConsole);

  // ---------------------------------------------------------------------------
  // 8. PERIMETER ALCOVE STATIONS: SCIENCE (SPOCK), COMMS (UHURA),
  //    TACTICAL (CHEKOV), AND ENGINEERING (SCOTTY)
  //    Aligned with the reference image's perimeter layout!
  // ---------------------------------------------------------------------------
  interface PerimeterStationSetup {
    id: BridgeStationId;
    angleRad: number; // Radial angle around the 12-sided perimeter (0 = Forward, PI = Aft)
    accentColor: number;
    hasCircularScope?: boolean;
  }

  // Exact radial positions matching the reference diagrams:
  // - Science (`science`): Rear-Center / Rear-Port Alcove (angle = 3.14 rad, top-center in the cutaway reference!)
  // - Comms (`comms`): Rear-Starboard Alcove right next to the Turbolift (angle = 1.96 rad)
  // - Tactical (`tactical`): Forward-Starboard Alcove (angle = 1.05 rad)
  // - Engineering (`engineering`): Forward-Port Alcove (angle = 4.58 rad)
  const perimeterConfigs: PerimeterStationSetup[] = [
    {
      id: 'science',
      angleRad: 3.14, // Top-center / Aft-Port Science Alcove with circular Moiré scope & Spock's hooded viewer!
      accentColor: 0x38bdf8,
      hasCircularScope: true,
    },
    {
      id: 'tactical',
      angleRad: 1.05, // Starboard-Forward Tactical & Defense Alcove
      accentColor: 0xef4444,
    },
    {
      id: 'comms',
      angleRad: 1.96, // Starboard-Aft Communications Alcove (adjacent to Turbolift, exact match to reference!)
      accentColor: 0x10b981,
    },
    {
      id: 'engineering',
      angleRad: 4.58, // Port Perimeter Engineering & Systems Alcove
      accentColor: 0xf97316,
    },
  ];

  const stationCanvases = new Map<
    BridgeStationId,
    {
      deskCanvas: HTMLCanvasElement;
      deskCtx: CanvasRenderingContext2D;
      deskTex: THREE.CanvasTexture;
      upperCanvas: HTMLCanvasElement;
      upperCtx: CanvasRenderingContext2D;
      upperTex: THREE.CanvasTexture;
      knob1?: THREE.Mesh;
      knob2?: THREE.Mesh;
      sliderCap?: THREE.Mesh;
    }
  >();

  for (const cfg of perimeterConfigs) {
    const stGroup = new THREE.Group();
    stGroup.name = `Station_${cfg.id}`;
    const stationR = 11.12;
    stGroup.position.set(
      Math.sin(cfg.angleRad) * stationR,
      walkwayHeight,
      -Math.cos(cfg.angleRad) * stationR
    );
    // Rotate so local -Z faces outward into the perimeter console wall, and local +Z faces inward toward the pit
    stGroup.rotation.y = -cfg.angleRad;

    // Interactive Desk Canvas (1024x512) mounted directly onto the sloped perimeter console desk
    const deskCanvas = document.createElement('canvas');
    deskCanvas.width = 1024;
    deskCanvas.height = 512;
    const deskCtx = deskCanvas.getContext('2d')!;
    const deskTex = new THREE.CanvasTexture(deskCanvas);
    deskTex.colorSpace = THREE.SRGBColorSpace;
    deskTex.anisotropy = 4;

    const deskSurfaceMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.28, 1.32),
      new THREE.MeshBasicMaterial({ map: deskTex, toneMapped: false })
    );
    deskSurfaceMesh.position.set(0, 1.08, 0.14);
    deskSurfaceMesh.rotation.x = -Math.PI / 2 + 0.34;
    deskSurfaceMesh.userData.consoleSurfaceId = `${cfg.id}_desk`;
    stGroup.add(deskSurfaceMesh);
    interactiveConsoleMeshes.push(deskSurfaceMesh);

    // Hardware group aligned with desk surface for physical 3D rotary knobs & sliders
    const hwGroup = new THREE.Group();
    hwGroup.position.copy(deskSurfaceMesh.position);
    hwGroup.rotation.copy(deskSurfaceMesh.rotation);
    stGroup.add(hwGroup);

    const knob1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.055, 24),
      new THREE.MeshStandardMaterial({
        color: cfg.accentColor,
        emissive: cfg.accentColor,
        emissiveIntensity: 0.85,
        metalness: 0.85,
      })
    );
    knob1.rotation.x = Math.PI / 2;
    knob1.position.set(-0.98, 0.02, 0.03);
    hwGroup.add(knob1);

    let knob2: THREE.Mesh | undefined;
    if (cfg.id === 'science') {
      knob2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.13, 0.055, 24),
        new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x9333ea,
          emissiveIntensity: 0.85,
          metalness: 0.85,
        })
      );
      knob2.rotation.x = Math.PI / 2;
      knob2.position.set(-0.22, 0.02, 0.03);
      hwGroup.add(knob2);
    }

    const sliderCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.06, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.85,
        metalness: 0.8,
      })
    );
    sliderCap.position.set(0.65, 0.12, 0.028);
    hwGroup.add(sliderCap);

    // Circular Rotating Moiré Sensor Scope + Spock's Angled Hooded Viewer on Science Fascia (matching reference!)
    if (cfg.hasCircularScope) {
      const scopeRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.27, 0.27, 0.06, 32),
        chromeMat
      );
      scopeRing.rotation.x = Math.PI / 2;
      scopeRing.position.set(-0.78, 1.48, -0.32);
      stGroup.add(scopeRing);

      const scopeFace = new THREE.Mesh(
        new THREE.CircleGeometry(0.24, 32),
        new THREE.MeshBasicMaterial({ map: moireScopeTex, toneMapped: false })
      );
      scopeFace.position.set(-0.78, 1.48, -0.285);
      stGroup.add(scopeFace);

      // Iconic Spock Angled 3D Hooded Sensor Viewer extending from the right Science fascia
      const viewerGroup = new THREE.Group();
      viewerGroup.position.set(0.88, 1.38, -0.18);
      viewerGroup.rotation.x = 0.42;
      viewerGroup.rotation.y = -0.18;

      const viewerBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.14, 0.42, 20),
        brushedSilverBulkheadMat
      );
      viewerBarrel.rotation.x = Math.PI / 2;
      viewerGroup.add(viewerBarrel);

      const viewerHood = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.18, 0.18),
        consoleBodyMat
      );
      viewerHood.position.set(0, 0.02, 0.22);
      viewerGroup.add(viewerHood);

      const viewerLens = new THREE.Mesh(
        new THREE.PlaneGeometry(0.18, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      viewerLens.position.set(0, 0.02, 0.312);
      viewerGroup.add(viewerLens);

      stGroup.add(viewerGroup);
    }

    // Upper Perimeter Video Monitor Mounted in the Angled Brushed-Silver Upper Bulkhead Frame
    const upperCanvas = document.createElement('canvas');
    upperCanvas.width = 1024;
    upperCanvas.height = 512;
    const upperCtx = upperCanvas.getContext('2d')!;
    const upperTex = new THREE.CanvasTexture(upperCanvas);
    upperTex.colorSpace = THREE.SRGBColorSpace;
    upperTex.anisotropy = 4;

    const upperMonitorGroup = new THREE.Group();
    upperMonitorGroup.position.set(0, 2.32, -0.48);
    upperMonitorGroup.rotation.x = 0.14;
    stGroup.add(upperMonitorGroup);

    const upperBezel = new THREE.Mesh(
      new THREE.BoxGeometry(3.26, 1.44, 0.08),
      brushedSilverBulkheadMat
    );
    upperBezel.position.set(0, 0, -0.05);
    upperMonitorGroup.add(upperBezel);

    // For Tactical Station: Mount a Live 3D Copy of the Main Viewscreen (viewscreenRenderTarget.texture)
    // directly behind the left viewport window (x: 20..496, y: 62..362 of the 1024x512 canvas)
    if (cfg.id === 'tactical') {
      const pipW = (476 / 1024) * 3.12;
      const pipH = (300 / 512) * 1.34;
      const pipCenterX = ((258 - 512) / 1024) * 3.12;
      const pipCenterY = ((256 - 212) / 512) * 1.34;
      const tacticalLiveFeedMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(pipW, pipH),
        new THREE.MeshBasicMaterial({ map: viewscreenRenderTarget.texture, toneMapped: false })
      );
      tacticalLiveFeedMesh.position.set(pipCenterX, pipCenterY, -0.006);
      upperMonitorGroup.add(tacticalLiveFeedMesh);
    }

    const upperMonitorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.12, 1.34),
      new THREE.MeshBasicMaterial({ map: upperTex, transparent: true, toneMapped: false })
    );
    upperMonitorMesh.position.set(0, 0, 0);
    upperMonitorMesh.userData.consoleSurfaceId = `${cfg.id}_upper`;
    upperMonitorGroup.add(upperMonitorMesh);
    interactiveConsoleMeshes.push(upperMonitorMesh);

    // Black Swivel Chair in front of each perimeter console
    const stChair = buildBridgeSwivelChair();
    stChair.position.set(0, 0, 1.02);
    stGroup.add(stChair);

    // Starfleet Senior Officer Seated at the Console (Auto-hidden when activeStation === cfg.id!)
    const seatedMannequin = buildArticulatedMannequin({
      name: `Officer_${cfg.id}`,
      pose: 'console_seated',
      phaseOffset: cfg.angleRad,
      primarySeatStationId: cfg.id,
    });
    seatedMannequin.group.position.set(0, 0.04, 1.0);
    stGroup.add(seatedMannequin.group);
    mannequinRigs.push(seatedMannequin);

    const stHitbox = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 2.8, 2.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    stHitbox.position.set(0, 1.4, 0.4);
    stHitbox.userData.bridgeStationId = cfg.id;
    stGroup.add(stHitbox);
    interactiveHitboxes.push(stHitbox);

    const stBeacon = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.035, 10, 32),
      new THREE.MeshBasicMaterial({ color: cfg.accentColor, transparent: true, opacity: 0.5 })
    );
    stBeacon.rotation.x = Math.PI / 2;
    stBeacon.position.set(0, 0.03, 0.95);
    stGroup.add(stBeacon);
    stationRingBeacons.set(cfg.id, stBeacon);

    stationCanvases.set(cfg.id, {
      deskCanvas,
      deskCtx,
      deskTex,
      upperCanvas,
      upperCtx,
      upperTex,
      knob1,
      knob2,
      sliderCap,
    });

    stationGroups.set(cfg.id, stGroup);
    root.add(stGroup);
  }

  // Additional Standing & Seated Starfleet Bridge Crew Specialists around the Perimeter
  const standingObserverMannequin = buildArticulatedMannequin({
    name: 'Science_Specialist',
    characterId: 'science_specialist',
    pose: 'standing_console',
    phaseOffset: 2.1,
  });
  standingObserverMannequin.group.position.set(-4.6, walkwayHeight, 8.2);
  standingObserverMannequin.group.rotation.y = 2.65;
  root.add(standingObserverMannequin.group);
  mannequinRigs.push(standingObserverMannequin);

  const auxChair1 = buildBridgeSwivelChair();
  auxChair1.position.set(-3.2, walkwayHeight, 8.8);
  auxChair1.rotation.y = 2.8;
  root.add(auxChair1);

  const auxChair2 = buildBridgeSwivelChair();
  auxChair2.position.set(7.4, walkwayHeight, -5.2);
  auxChair2.rotation.y = -0.95;
  root.add(auxChair2);

  const auxForegroundChair = buildBridgeSwivelChair();
  auxForegroundChair.position.set(4.6, walkwayHeight, -6.4);
  auxForegroundChair.rotation.y = -0.45;
  root.add(auxForegroundChair);

  const auxSeatedMannequin = buildArticulatedMannequin({
    name: 'Operations_Specialist',
    characterId: 'ops_specialist',
    pose: 'relaxed_seated',
    phaseOffset: 4.4,
  });
  auxSeatedMannequin.group.position.set(4.6, walkwayHeight + 0.04, -6.4);
  auxSeatedMannequin.group.rotation.y = -0.45;
  root.add(auxSeatedMannequin.group);
  mannequinRigs.push(auxSeatedMannequin);

  // ---------------------------------------------------------------------------
  // 9. CAMERA POV PRESETS: FIRST-PERSON STATION POVS + 3/4 CUTAWAY BRIDGE OVERVIEW
  //    Lower half of screen = Embedded 3D Desk Controls
  //    Upper half of screen = Live Upper Video Monitors / Main Viewscreen
  // ---------------------------------------------------------------------------
  const computePerimeterPreset = (
    id: BridgeStationId,
    label: string,
    officerName: string,
    officerTitle: string
  ): BridgeStationCameraPreset => {
    const stGroup = stationGroups.get(id)!;
    stGroup.updateMatrixWorld(true);
    // Positioned at the exact eye position of the seated station mannequin looking at the 3D desk & upper monitor!
    const localEye = new THREE.Vector3(0, 1.82, 1.48);
    const localLook = new THREE.Vector3(0, 1.56, -1.25);
    return {
      id,
      label,
      officerName,
      officerTitle,
      eyePos: localEye.applyMatrix4(stGroup.matrixWorld),
      lookTarget: localLook.applyMatrix4(stGroup.matrixWorld),
      fov: 58,
    };
  };

  const stationPresets: Record<BridgeStationId, BridgeStationCameraPreset> = {
    captain: {
      id: 'captain',
      label: "Captain's Chair",
      officerName: 'Capt. James T. Kirk',
      officerTitle: 'Commanding Officer // Center Pedestal (3D Armrest Controls)',
      eyePos: new THREE.Vector3(0, 1.68, 1.32),
      lookTarget: new THREE.Vector3(0, 1.25, -6.5),
      fov: 60,
    },
    helm: {
      id: 'helm',
      label: 'Helm & Navigation',
      officerName: 'Lt. Hikaru Sulu',
      officerTitle: 'Chief Helmsman // Forward Island 3D Console',
      eyePos: new THREE.Vector3(-0.32, 1.88, -0.58),
      lookTarget: new THREE.Vector3(-0.18, 1.38, -6.8),
      fov: 58,
    },
    science: computePerimeterPreset(
      'science',
      'Science Station',
      'Cmdr. Spock',
      'Chief Science Officer // 3D Spectrometer & Wave Monitor'
    ),
    tactical: computePerimeterPreset(
      'tactical',
      'Tactical & Defense',
      'Ensign Pavel Chekov',
      'Chief Tactical Officer // 3D 4-Quadrant Shields & Weapons'
    ),
    comms: computePerimeterPreset(
      'comms',
      'Communications',
      'Lt. Nyota Uhura',
      'Chief Communications Officer // 3D Subspace Tuner & Diplomacy'
    ),
    engineering: computePerimeterPreset(
      'engineering',
      'Engineering Alcove',
      'Lt. Cmdr. Montgomery Scott',
      'Chief Engineering Officer // 3D Warp Intermix & Damage Control'
    ),
    overview: {
      id: 'overview',
      label: 'Bridge Cutaway Overview',
      officerName: 'USS Enterprise NCC-1701',
      officerTitle: 'Deck 1 Main Bridge // 3/4 Cutaway Panorama (Click Any Station or Press 1–6)',
      eyePos: new THREE.Vector3(-4.15, 5.05, -6.65),
      lookTarget: new THREE.Vector3(0.35, 0.85, 1.35),
      fov: 50,
    },
  };

  // ---------------------------------------------------------------------------
  // 10. REDRAW FUNCTIONS FOR SCIENCE, TACTICAL, COMMS & ENGINEERING 3D CONSOLES
  // ---------------------------------------------------------------------------
  const redrawScience3DStation = () => {
    const sc = stationCanvases.get('science');
    if (!sc) return;

    const wDiff = Math.abs(hw.wavelengthNm - hw.targetWavelengthNm) / 370;
    const aDiff = Math.abs(hw.amplitudePct - hw.targetAmplitudePct) / 90;
    hw.scienceWaveMatchPct = Math.max(
      0,
      Math.min(100, Math.round((1 - (wDiff * 0.65 + aDiff * 0.35)) * 100))
    );
    hw.scienceScanComplete = hw.scienceWaveMatchPct >= 88;

    if (sc.knob1) sc.knob1.rotation.y = ((hw.wavelengthNm - 380) / 370) * 4.2 - 2.1;
    if (sc.knob2) sc.knob2.rotation.y = ((hw.amplitudePct - 10) / 90) * 4.2 - 2.1;
    if (sc.sliderCap) sc.sliderCap.position.x = 0.25 + (hw.deflectorParticlePct / 100) * 0.85;

    const dctx = sc.deskCtx;
    dctx.fillStyle = '#07090f';
    dctx.fillRect(0, 0, 1024, 512);

    // Top LCARS / TOS Brushed Header Strip
    dctx.fillStyle = '#38bdf8';
    dctx.fillRect(14, 10, 380, 36);
    dctx.fillStyle = '#020617';
    dctx.font = 'bold 17px monospace';
    dctx.fillText('CMDR. SPOCK // 3D SCIENCE DESK', 24, 34);

    dctx.fillStyle = '#0f172a';
    dctx.fillRect(402, 10, 608, 36);
    dctx.strokeStyle = '#38bdf8';
    dctx.lineWidth = 2;
    dctx.strokeRect(402, 10, 608, 36);
    dctx.fillStyle = hw.scienceScanComplete ? '#10b981' : '#fde047';
    dctx.font = 'bold 15px monospace';
    dctx.fillText(
      `WAVE ALIGNMENT: ${hw.scienceWaveMatchPct}% ${
        hw.scienceScanComplete ? '[SPECTROSCOPIC LOCK COMPLETE]' : '[TURN 3D KNOBS TO MATCH WAVE]'
      }`,
      418,
      33
    );

    // Left Panel: Wavelength Rotary Dial + Curved Starfleet Keycap Arc
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(16, 58, 300, 352);
    dctx.strokeStyle = '#38bdf8';
    dctx.lineWidth = 2;
    dctx.strokeRect(16, 58, 300, 352);

    drawRadialButtonArc(
      dctx,
      166,
      220,
      104,
      122,
      -62,
      62,
      8,
      2,
      ['#38bdf8', '#fde047', '#f97316', '#38bdf8', '#10b981'],
      1
    );

    drawCanvasRotaryKnob(
      dctx,
      166,
      220,
      86,
      (hw.wavelengthNm - 380) / 370,
      (hw.targetWavelengthNm - 380) / 370,
      '3D KNOB 1: WAVELENGTH (λ)',
      `${Math.round(hw.wavelengthNm)} nm (Target: ${hw.targetWavelengthNm} nm)`,
      '#38bdf8',
      hoveredControlId === 'sci_wavelength'
    );

    // Center Panel: Amplitude Rotary Dial + Curved Starfleet Keycap Arc
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(330, 58, 300, 352);
    dctx.strokeStyle = '#a855f7';
    dctx.lineWidth = 2;
    dctx.strokeRect(330, 58, 300, 352);

    drawRadialButtonArc(
      dctx,
      480,
      220,
      104,
      122,
      -62,
      62,
      8,
      2,
      ['#c084fc', '#38bdf8', '#fde047', '#ef4444', '#10b981'],
      4
    );

    drawCanvasRotaryKnob(
      dctx,
      480,
      220,
      86,
      (hw.amplitudePct - 10) / 90,
      (hw.targetAmplitudePct - 10) / 90,
      '3D KNOB 2: AMPLITUDE (A)',
      `${Math.round(hw.amplitudePct)}% (Target: ${hw.targetAmplitudePct}%)`,
      '#c084fc',
      hoveredControlId === 'sci_amplitude'
    );

    // Right Panel: Deflector Particle Slider & Illuminated Acrylic Keycaps
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(644, 58, 364, 352);
    dctx.strokeStyle = '#fde047';
    dctx.lineWidth = 2;
    dctx.strokeRect(644, 58, 364, 352);

    dctx.fillStyle = '#fde047';
    dctx.font = 'bold 14px monospace';
    dctx.fillText('DEFLECTOR DISH PARTICLE SLIDER', 686, 86);

    dctx.fillStyle = '#020617';
    dctx.fillRect(664, 104, 324, 70);
    dctx.strokeStyle = hoveredControlId === 'sci_deflector_slider' ? '#ffffff' : '#f59e0b';
    dctx.strokeRect(664, 104, 324, 70);

    const deflSegs = 16;
    const activeDeflSegs = Math.round((hw.deflectorParticlePct / 100) * deflSegs);
    for (let s = 0; s < deflSegs; s++) {
      dctx.fillStyle = s < activeDeflSegs ? (s > 12 ? '#ef4444' : '#f59e0b') : '#1e293b';
      dctx.fillRect(670 + s * 19.6, 110, 16, 58);
    }
    dctx.fillStyle = '#ffffff';
    dctx.font = 'bold 15px monospace';
    dctx.fillText(`PARTICLE FLUX: ${Math.round(hw.deflectorParticlePct)}% POSITRON`, 694, 145);

    drawStarfleetKeycap(
      dctx,
      664,
      194,
      324,
      98,
      '#38bdf8',
      '[ PULSE 3D DEFLECTOR BEAM ]',
      hoveredControlId === 'sci_fire_deflector',
      true,
      'PROJECT CYCLOTRON STREAM INTO SPACE'
    );

    drawStarfleetKeycap(
      dctx,
      664,
      306,
      324,
      88,
      '#10b981',
      '[ LOCK SPECTRAL HARMONICS ]',
      hoveredControlId === 'sci_auto_align',
      hw.scienceScanComplete,
      'COMPLETE SCAN & DISPLAY SCIENCE CARD'
    );

    // Bottom Strip: Telemetry Readout + 24 Illuminated Starfleet Jelly-Bean Indicator Blocks
    dctx.fillStyle = '#0f172a';
    dctx.fillRect(16, 418, 992, 46);
    dctx.strokeStyle = '#334155';
    dctx.strokeRect(16, 418, 992, 46);
    dctx.fillStyle = '#7dd3fc';
    dctx.font = 'bold 13px monospace';
    dctx.fillText(
      `TARGET: ${hw.targetName.toUpperCase()} (${hw.targetClassification}) · SEE UPPER MONITOR FOR LIVE OSCILLOSCOPE & EXHIBITION CARD`,
      28,
      446
    );

    const sciBankPalette = ['#38bdf8', '#fde047', '#10b981', '#f97316', '#c084fc', '#ef4444'];
    for (let i = 0; i < 24; i++) {
      drawStarfleetKeycap(
        dctx,
        16 + i * 41.4,
        470,
        37,
        32,
        sciBankPalette[i % sciBankPalette.length],
        undefined,
        false,
        (i + Math.floor(animClock * 3)) % 3 !== 0
      );
    }

    sc.deskTex.needsUpdate = true;

    const uctx = sc.upperCtx;
    uctx.fillStyle = '#020617';
    uctx.fillRect(0, 0, 1024, 512);

    // LCARS Amber/Cyan Header Bar matching reference bridge screens
    uctx.fillStyle = '#ff9900';
    uctx.fillRect(14, 10, 210, 38);
    uctx.fillStyle = '#0284c7';
    uctx.fillRect(232, 10, 778, 38);
    uctx.fillStyle = '#020617';
    uctx.font = 'bold 16px monospace';
    uctx.fillText('LCARS // SCI-01', 26, 35);
    uctx.fillStyle = '#ffffff';
    uctx.font = 'bold 16px monospace';
    uctx.fillText(
      `SPECTROSCOPIC WAVE-MATCHING OSCILLOSCOPE (${hw.scienceWaveMatchPct}% MATCH)`,
      248,
      35
    );

    uctx.fillStyle = '#090d16';
    uctx.fillRect(16, 60, 496, 434);
    uctx.strokeStyle = '#ff9900';
    uctx.lineWidth = 2.5;
    uctx.strokeRect(16, 60, 496, 434);

    uctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
    uctx.lineWidth = 1;
    for (let gx = 40; gx < 500; gx += 45) {
      uctx.beginPath();
      uctx.moveTo(gx, 70);
      uctx.lineTo(gx, 420);
      uctx.stroke();
    }
    uctx.beginPath();
    uctx.moveTo(24, 245);
    uctx.lineTo(504, 245);
    uctx.stroke();

    uctx.save();
    uctx.setLineDash([8, 6]);
    uctx.beginPath();
    const targetFreq = (hw.targetWavelengthNm - 300) / 14000;
    const targetAmp = (hw.targetAmplitudePct / 100) * 125;
    for (let x = 28; x <= 500; x += 4) {
      const y = 245 + Math.sin((x - 28) * targetFreq * Math.PI * 2 + animClock * 2.5) * targetAmp;
      if (x === 28) uctx.moveTo(x, y);
      else uctx.lineTo(x, y);
    }
    uctx.strokeStyle = '#fde047';
    uctx.lineWidth = 3;
    uctx.stroke();
    uctx.restore();

    uctx.beginPath();
    const userFreq = (hw.wavelengthNm - 300) / 14000;
    const userAmp = (hw.amplitudePct / 100) * 125;
    for (let x = 28; x <= 500; x += 4) {
      const y = 245 + Math.sin((x - 28) * userFreq * Math.PI * 2 + animClock * 2.5) * userAmp;
      if (x === 28) uctx.moveTo(x, y);
      else uctx.lineTo(x, y);
    }
    uctx.strokeStyle = hw.scienceScanComplete ? '#10b981' : '#38bdf8';
    uctx.lineWidth = 4;
    uctx.stroke();

    uctx.fillStyle = '#fde047';
    uctx.font = 'bold 13px monospace';
    uctx.fillText(`--- TARGET WAVE: λ=${hw.targetWavelengthNm}nm, A=${hw.targetAmplitudePct}%`, 30, 450);
    uctx.fillStyle = hw.scienceScanComplete ? '#34d399' : '#38bdf8';
    uctx.fillText(
      `━━━ SCANNER WAVE: λ=${Math.round(hw.wavelengthNm)}nm, A=${Math.round(hw.amplitudePct)}%`,
      30,
      476
    );

    uctx.fillStyle = hw.scienceScanComplete ? 'rgba(6, 78, 59, 0.35)' : 'rgba(15, 23, 42, 0.95)';
    uctx.fillRect(526, 60, 482, 434);
    uctx.strokeStyle = hw.scienceScanComplete ? '#10b981' : '#ff9900';
    uctx.lineWidth = 2.5;
    uctx.strokeRect(526, 60, 482, 434);

    uctx.fillStyle = hw.scienceScanComplete ? '#10b981' : '#ff9900';
    uctx.fillRect(526, 60, 482, 38);
    uctx.fillStyle = '#020617';
    uctx.font = 'bold 15px monospace';
    uctx.fillText(
      hw.scienceScanComplete
        ? '★ SCIENCE EXHIBITION CARD // TELEMETRY UNLOCKED'
        : 'SCIENCE EXHIBITION CARD // ALIGN WAVES TO UNLOCK',
      540,
      85
    );

    uctx.fillStyle = '#ffffff';
    uctx.font = 'bold 17px monospace';
    uctx.fillText(hw.targetName.toUpperCase(), 544, 128);

    uctx.fillStyle = '#38bdf8';
    uctx.font = 'bold 14px monospace';
    uctx.fillText(hw.scienceCardTitle.slice(0, 44), 544, 156);

    uctx.fillStyle = '#020617';
    uctx.fillRect(544, 172, 446, 48);
    uctx.strokeStyle = '#38bdf8';
    uctx.strokeRect(544, 172, 446, 48);
    uctx.fillStyle = '#fde047';
    uctx.font = 'bold 14px monospace';
    uctx.fillText(hw.scienceCardFormula.slice(0, 46), 558, 202);

    uctx.fillStyle = '#e2e8f0';
    uctx.font = '14px monospace';
    wrapCanvasText(
      uctx,
      `• ATMOSPHERE & SPECTRUM: ${hw.targetAtmosphere}. ${hw.scienceCardFact1}`,
      544,
      248,
      442,
      22,
      4
    );

    uctx.fillStyle = '#a7f3d0';
    wrapCanvasText(
      uctx,
      `• ASTROPHYSICS INSIGHT: ${hw.scienceCardFact2} Surface Gravity: ${hw.targetGravity}.`,
      544,
      352,
      442,
      22,
      4
    );

    sc.upperTex.needsUpdate = true;
  };

  const redrawTactical3DStation = () => {
    const tc = stationCanvases.get('tactical');
    if (!tc) return;

    if (tc.knob1) {
      tc.knob1.rotation.y = ((hw.shieldFreqMhz - 140) / 200) * 4.2 - 2.1;
    }

    const freqDiff = Math.abs(hw.shieldFreqMhz - hw.optimalShieldFreqMhz);
    const shieldEff = Math.max(20, Math.min(100, Math.round(100 - freqDiff * 1.2)));

    const dctx = tc.deskCtx;
    dctx.fillStyle = '#07090f';
    dctx.fillRect(0, 0, 1024, 512);

    dctx.fillStyle = '#ef4444';
    dctx.fillRect(14, 10, 380, 36);
    dctx.fillStyle = '#ffffff';
    dctx.font = 'bold 17px monospace';
    dctx.fillText('ENSIGN CHEKOV // 3D TACTICAL DESK', 24, 34);

    dctx.fillStyle = '#0f172a';
    dctx.fillRect(402, 10, 608, 36);
    dctx.strokeStyle = '#ef4444';
    dctx.lineWidth = 2;
    dctx.strokeRect(402, 10, 608, 36);
    dctx.fillStyle = hw.weaponsArmed ? '#f87171' : '#34d399';
    dctx.font = 'bold 14px monospace';
    dctx.fillText(
      `SHIELD EFFICIENCY: ${shieldEff}% · WEAPONS: ${
        hw.weaponsArmed ? 'ARMED (COMBAT HOT)' : 'SAFE (DIPLOMATIC GREEN)'
      }`,
      418,
      33
    );

    // Left Panel: Shield Harmonics Dial + Radial Button Arc + Raise Shields Keycap
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(16, 58, 294, 352);
    dctx.strokeStyle = '#38bdf8';
    dctx.lineWidth = 2;
    dctx.strokeRect(16, 58, 294, 352);

    drawRadialButtonArc(
      dctx,
      163,
      206,
      98,
      116,
      -62,
      62,
      8,
      2,
      ['#38bdf8', '#fde047', '#ef4444', '#f97316', '#10b981'],
      2
    );

    drawCanvasRotaryKnob(
      dctx,
      163,
      206,
      82,
      (hw.shieldFreqMhz - 140) / 200,
      (hw.optimalShieldFreqMhz - 140) / 200,
      'SHIELD HARMONIC DIAL',
      `${hw.shieldFreqMhz.toFixed(1)} MHz (Opt: ${hw.optimalShieldFreqMhz.toFixed(1)})`,
      '#38bdf8',
      hoveredControlId === 'tac_shield_freq'
    );

    drawStarfleetKeycap(
      dctx,
      32,
      336,
      262,
      60,
      '#38bdf8',
      hw.shieldsRaised ? `SHIELDS RAISED (${Math.round(hw.shieldIntegrity)}%)` : 'RAISE MULTIPHASIC SHIELDS',
      hoveredControlId === 'tac_toggle_shields',
      hw.shieldsRaised,
      'TOGGLE DEFLECTOR SCREEN'
    );

    // Center Panel: 4-Quadrant Shield Rebalancing + Subsystem Target Keycaps
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(322, 58, 346, 352);
    dctx.strokeStyle = '#f59e0b';
    dctx.lineWidth = 2;
    dctx.strokeRect(322, 58, 346, 352);

    dctx.fillStyle = '#fde047';
    dctx.font = 'bold 14px monospace';
    dctx.textAlign = 'center';
    dctx.fillText('4-QUADRANT SHIELD REBALANCING (CLICK ARC)', 495, 82);
    dctx.textAlign = 'left';

    const quads = [
      { id: 'quad_fwd', key: 'forward' as const, label: 'FORWARD', val: hw.shieldQuadrants.forward, x: 420, y: 96, w: 150, h: 62 },
      { id: 'quad_aft', key: 'aft' as const, label: 'AFT', val: hw.shieldQuadrants.aft, x: 420, y: 278, w: 150, h: 62 },
      { id: 'quad_port', key: 'port' as const, label: 'PORT', val: hw.shieldQuadrants.port, x: 334, y: 170, w: 96, h: 96 },
      { id: 'quad_stbd', key: 'starboard' as const, label: 'STBD', val: hw.shieldQuadrants.starboard, x: 560, y: 170, w: 96, h: 96 },
    ];

    for (const q of quads) {
      drawStarfleetKeycap(
        dctx,
        q.x,
        q.y,
        q.w,
        q.h,
        '#38bdf8',
        q.label,
        hoveredControlId === q.id,
        q.val >= 100,
        `${Math.round(q.val)}%`
      );
    }

    drawStarfleetKeycap(
      dctx,
      440,
      170,
      110,
      96,
      '#fde047',
      'NCC-1701',
      hoveredControlId === 'quad_bal',
      true,
      '[EQUALIZE]'
    );

    const isSubEng = hw.enemySubsystemTarget === 'engines';
    drawStarfleetKeycap(
      dctx,
      336,
      350,
      154,
      48,
      '#f59e0b',
      'TARGET: ENGINES',
      hoveredControlId === 'sub_eng',
      isSubEng
    );

    drawStarfleetKeycap(
      dctx,
      500,
      350,
      154,
      48,
      '#ef4444',
      'TARGET: WEAPONS',
      hoveredControlId === 'sub_wpn',
      !isSubEng
    );

    // Right Panel: 3D Illuminated Acrylic Weapon Triggers
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(680, 58, 328, 352);
    dctx.strokeStyle = '#ef4444';
    dctx.lineWidth = 2;
    dctx.strokeRect(680, 58, 328, 352);

    dctx.fillStyle = '#f87171';
    dctx.font = 'bold 14px monospace';
    dctx.textAlign = 'center';
    dctx.fillText('3D WEAPON TRIGGERS', 844, 82);
    dctx.textAlign = 'left';

    drawStarfleetKeycap(
      dctx,
      696,
      94,
      296,
      84,
      hw.isFiringPhasers ? '#fde047' : '#ef4444',
      '[ FIRE PHASER ARRAY ]',
      hoveredControlId === 'tac_fire_phaser',
      true,
      `THERMAL HEAT: ${Math.round(hw.phaserHeatPct)}% · [SPACE]`
    );

    const lockReady = hw.torpedoLockSeconds >= 2.95;
    drawStarfleetKeycap(
      dctx,
      696,
      192,
      296,
      84,
      lockReady ? '#ef4444' : '#f97316',
      `[ LAUNCH TORPEDO (${hw.torpedoCount}) ]`,
      hoveredControlId === 'tac_fire_torpedo',
      lockReady,
      lockReady ? '3.0s GUIDANCE LOCK READY [T]' : `LOCKING: ${hw.torpedoLockSeconds.toFixed(1)}s / 3.0s`
    );

    drawStarfleetKeycap(
      dctx,
      696,
      290,
      296,
      52,
      hw.weaponsArmed ? '#ef4444' : '#10b981',
      hw.weaponsArmed ? 'WEAPONS ARMED (-40% DIPLOMACY)' : 'WEAPONS SAFE (+DIPLOMATIC TRUST)',
      hoveredControlId === 'tac_toggle_armed',
      true
    );

    drawStarfleetKeycap(
      dctx,
      696,
      352,
      144,
      48,
      '#38bdf8',
      'NEXT TARGET [TAB]',
      hoveredControlId === 'tac_cycle',
      true
    );

    drawStarfleetKeycap(
      dctx,
      848,
      352,
      144,
      48,
      '#fde047',
      'VENT PHASER HEAT',
      hoveredControlId === 'tac_vent',
      hw.phaserHeatPct > 10
    );

    // Bottom Strip + 24 Starfleet Indicator Blocks
    dctx.fillStyle = '#0f172a';
    dctx.fillRect(16, 418, 992, 46);
    dctx.strokeStyle = '#334155';
    dctx.strokeRect(16, 418, 992, 46);
    dctx.fillStyle = '#fca5a5';
    dctx.font = 'bold 13px monospace';
    dctx.fillText(
      `HOSTILES IN SECTOR: ${hw.aliveHostilesCount} · LOCKED: ${
        hw.lockedEnemyName || 'NONE'
      } · SUBSYSTEM: ${hw.enemySubsystemTarget.toUpperCase()}`,
      28,
      446
    );

    const tacBankPalette = ['#ef4444', '#f97316', '#fde047', '#38bdf8', '#ef4444', '#10b981'];
    for (let i = 0; i < 24; i++) {
      drawStarfleetKeycap(
        dctx,
        16 + i * 41.4,
        470,
        37,
        32,
        tacBankPalette[i % tacBankPalette.length],
        undefined,
        false,
        i % 2 === 0 || hw.weaponsArmed
      );
    }

    tc.deskTex.needsUpdate = true;

    // B. TACTICAL UPPER WALL MONITOR (1024x512):
    // Left Half = LIVE 3D COPY OF MAIN VIEWSCREEN with Pinpoint Target Reticle, Quick-Switch & Torpedo Trigger!
    // Right Half = Phaser Thermal Heat Bar & Enemy Subsystem Targeting (Engines vs Weapons)
    const uctx = tc.upperCtx;
    uctx.clearRect(0, 0, 1024, 512);
    uctx.fillStyle = '#020617';
    uctx.fillRect(0, 0, 1024, 512);

    uctx.fillStyle = '#ff9900';
    uctx.fillRect(14, 10, 210, 38);
    uctx.fillStyle = '#dc2626';
    uctx.fillRect(232, 10, 778, 38);
    uctx.fillStyle = '#020617';
    uctx.font = 'bold 16px monospace';
    uctx.fillText('LCARS // TAC-04', 26, 35);
    uctx.fillStyle = '#ffffff';
    uctx.font = 'bold 16px monospace';
    uctx.fillText(
      'LIVE VIEWSCREEN TARGET FEED, PINPOINT LOCK & SUBSYSTEMS',
      248,
      35
    );

    // Clear alpha so the live 3D `tacticalLiveFeedMesh` (viewscreenRenderTarget.texture) shines right through!
    uctx.clearRect(20, 62, 476, 300);

    uctx.strokeStyle = hw.lockedEnemyName ? '#ef4444' : '#ff9900';
    uctx.lineWidth = 3;
    uctx.strokeRect(20, 62, 476, 300);

    uctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
    uctx.fillRect(22, 64, 472, 30);
    uctx.fillStyle = '#38bdf8';
    uctx.font = 'bold 13px monospace';
    uctx.fillText(
      `● LIVE 3D VIEWSCREEN FEED // ${
        hw.lockedEnemyName ? `LOCKED: ${hw.lockedEnemyName.toUpperCase()}` : `TRACKING: ${hw.targetName.toUpperCase()}`
      }`,
      30,
      84
    );

    const rcx = 258;
    const rcy = 206;
    const lockNorm = Math.max(0, Math.min(1, hw.torpedoLockSeconds / 3.0));
    const locked = lockNorm >= 0.99;

    uctx.beginPath();
    uctx.arc(rcx, rcy, 68, 0, Math.PI * 2);
    uctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    uctx.lineWidth = 2.5;
    uctx.stroke();

    uctx.beginPath();
    uctx.arc(rcx, rcy, 68, -Math.PI / 2, -Math.PI / 2 + lockNorm * Math.PI * 2);
    uctx.strokeStyle = locked ? '#10b981' : '#f59e0b';
    uctx.lineWidth = 6;
    uctx.stroke();

    const bLen = 18;
    const bOff = 52;
    uctx.strokeStyle = locked ? '#10b981' : '#fde047';
    uctx.lineWidth = 2.5;
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      uctx.beginPath();
      uctx.moveTo(rcx + sx * bOff, rcy + sy * (bOff - bLen));
      uctx.lineTo(rcx + sx * bOff, rcy + sy * bOff);
      uctx.lineTo(rcx + sx * (bOff - bLen), rcy + sy * bOff);
      uctx.stroke();
    }

    uctx.beginPath();
    uctx.moveTo(rcx - 28, rcy);
    uctx.lineTo(rcx + 28, rcy);
    uctx.moveTo(rcx, rcy - 28);
    uctx.lineTo(rcx, rcy + 28);
    uctx.strokeStyle = locked ? '#10b981' : '#ef4444';
    uctx.lineWidth = 2;
    uctx.stroke();

    uctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
    uctx.fillRect(22, 324, 472, 36);
    uctx.fillStyle = locked ? '#10b981' : '#fde047';
    uctx.font = 'bold 13px monospace';
    uctx.textAlign = 'center';
    uctx.fillText(
      locked
        ? `✓ PINPOINT LOCK ACQUIRED (3.0s) · DIST: ${formatAstronomicalDistance(hw.targetDistanceKm, 'compact')}`
        : `LOCKING TARGET: ${hw.torpedoLockSeconds.toFixed(1)}s / 3.0s · CLICK FEED TO PINPOINT`,
      rcx,
      347
    );
    uctx.textAlign = 'left';

    const tacUpperBtns = [
      { id: 'tac_prev_target', label: '◄ PREV TARGET', x: 20, y: 370, w: 148, h: 56, hex: '#38bdf8' },
      { id: 'tac_pinpoint', label: '🎯 PINPOINT LOCK', x: 176, y: 370, w: 164, h: 56, hex: '#10b981' },
      { id: 'tac_next_target', label: 'NEXT TARGET ►', x: 348, y: 370, w: 148, h: 56, hex: '#38bdf8' },
    ];
    for (const b of tacUpperBtns) {
      drawStarfleetKeycap(
        uctx,
        b.x,
        b.y,
        b.w,
        b.h,
        b.hex,
        b.label,
        hoveredControlId === b.id,
        true
      );
    }

    drawStarfleetKeycap(
      uctx,
      20,
      434,
      296,
      60,
      locked ? '#ef4444' : '#f97316',
      `[ 🚀 LAUNCH TORPEDO (${hw.torpedoCount}) ]`,
      hoveredControlId === 'tac_upper_torpedo',
      locked
    );

    const hasHostiles = hw.aliveHostilesCount > 0;
    drawStarfleetKeycap(
      uctx,
      324,
      434,
      172,
      60,
      hasHostiles ? '#ef4444' : '#fde047',
      hasHostiles ? '[ ⚡ FIRE PHASER ]' : '[ ⚔ SUMMON FLEET ]',
      hoveredControlId === 'tac_upper_aux',
      true
    );

    uctx.fillStyle = '#090d16';
    uctx.fillRect(516, 60, 492, 434);
    uctx.strokeStyle = '#ff9900';
    uctx.lineWidth = 2.5;
    uctx.strokeRect(516, 60, 492, 434);

    uctx.fillStyle = '#fde047';
    uctx.font = 'bold 16px monospace';
    uctx.fillText(`PHASER THERMAL HEAT BAR: ${Math.round(hw.phaserHeatPct)}%`, 538, 98);

    uctx.fillStyle = '#020617';
    uctx.fillRect(538, 114, 448, 54);
    uctx.strokeStyle = '#475569';
    uctx.strokeRect(538, 114, 448, 54);

    const hFill = Math.round((Math.min(100, hw.phaserHeatPct) / 100) * 440);
    uctx.fillStyle = hw.phaserHeatPct > 80 ? '#ef4444' : hw.phaserHeatPct > 50 ? '#f59e0b' : '#10b981';
    uctx.fillRect(542, 118, hFill, 46);

    uctx.fillStyle = '#94a3b8';
    uctx.font = '13px monospace';
    uctx.fillText(
      hw.phaserHeatPct > 80
        ? 'WARNING: NADION EMITTERS NEAR THERMAL OVERLOAD!'
        : 'THERMAL DISSIPATION NOMINAL · READY FOR CONTINUOUS FIRE',
      538,
      192
    );

    uctx.fillStyle = '#38bdf8';
    uctx.font = 'bold 16px monospace';
    uctx.fillText('ENEMY SUBSYSTEM TARGETING (CLICK TO SWITCH):', 538, 240);

    const engSel = hw.enemySubsystemTarget === 'engines';
    drawStarfleetKeycap(
      uctx,
      538,
      260,
      448,
      96,
      '#f59e0b',
      `${engSel ? '▶ [ACTIVE] ' : ''}SUBSYSTEM: HOSTILE ENGINES & WARP DRIVE`,
      hoveredControlId === 'sub_eng',
      engSel,
      'Disables enemy impulse evasion & cuts hostile speed by 50%.'
    );

    const wpnSel = hw.enemySubsystemTarget === 'weapons';
    drawStarfleetKeycap(
      uctx,
      538,
      372,
      448,
      96,
      '#ef4444',
      `${wpnSel ? '▶ [ACTIVE] ' : ''}SUBSYSTEM: HOSTILE WEAPONS & DISRUPTORS`,
      hoveredControlId === 'sub_wpn',
      wpnSel,
      'Destabilizes enemy disruptor banks & cuts incoming fire by 45%.'
    );

    tc.upperTex.needsUpdate = true;
  };

  const redrawComms3DStation = () => {
    const cc = stationCanvases.get('comms');
    if (!cc) return;

    const fErr = Math.abs(hw.carrierFreqMhz - hw.targetCarrierFreqMhz) / 100;
    const bErr = Math.abs(hw.bandpassFilterPct - hw.targetBandpassPct) / 100;
    hw.signalClarityPct = Math.max(
      5,
      Math.min(100, Math.round((1 - (fErr * 0.65 + bErr * 0.35)) * 100))
    );

    if (cc.knob1) {
      cc.knob1.rotation.y = ((hw.carrierFreqMhz - 80) / 180) * 4.2 - 2.1;
    }
    if (cc.sliderCap) {
      cc.sliderCap.position.x = -0.15 + (hw.bandpassFilterPct / 100) * 0.85;
    }

    const dctx = cc.deskCtx;
    dctx.fillStyle = '#07090f';
    dctx.fillRect(0, 0, 1024, 512);

    dctx.fillStyle = '#10b981';
    dctx.fillRect(14, 10, 380, 36);
    dctx.fillStyle = '#020617';
    dctx.font = 'bold 17px monospace';
    dctx.fillText('LT. UHURA // 3D SUBSPACE COMMS DESK', 24, 34);

    dctx.fillStyle = '#0f172a';
    dctx.fillRect(402, 10, 608, 36);
    dctx.strokeStyle = '#10b981';
    dctx.lineWidth = 2;
    dctx.strokeRect(402, 10, 608, 36);
    dctx.fillStyle = hw.weaponsArmed ? '#f87171' : '#34d399';
    dctx.font = 'bold 14px monospace';
    dctx.fillText(
      `SIGNAL CLARITY: ${hw.signalClarityPct}% · DIPLOMATIC TRUST: ${Math.round(hw.diplomaticTrustPct)}%`,
      418,
      33
    );

    // Left Panel: Carrier Frequency Wheel + Radial Starfleet Arc
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(16, 58, 324, 352);
    dctx.strokeStyle = '#10b981';
    dctx.lineWidth = 2;
    dctx.strokeRect(16, 58, 324, 352);

    drawRadialButtonArc(
      dctx,
      178,
      220,
      104,
      122,
      -62,
      62,
      8,
      2,
      ['#10b981', '#fde047', '#38bdf8', '#f97316', '#10b981'],
      0
    );

    drawCanvasRotaryKnob(
      dctx,
      178,
      220,
      88,
      (hw.carrierFreqMhz - 80) / 180,
      (hw.targetCarrierFreqMhz - 80) / 180,
      'CARRIER FREQUENCY WHEEL',
      `${hw.carrierFreqMhz.toFixed(1)} MHz (Target: ${hw.targetCarrierFreqMhz.toFixed(1)})`,
      '#10b981',
      hoveredControlId === 'comms_freq'
    );

    // Center Panel: Bandpass Noise Filter Fader + Live Subspace Waveform Scope
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(354, 58, 330, 352);
    dctx.strokeStyle = '#38bdf8';
    dctx.lineWidth = 2;
    dctx.strokeRect(354, 58, 330, 352);

    dctx.fillStyle = '#38bdf8';
    dctx.font = 'bold 14px monospace';
    dctx.fillText('BANDPASS NOISE FILTER FADER', 402, 86);

    dctx.fillStyle = '#020617';
    dctx.fillRect(374, 112, 290, 80);
    dctx.strokeStyle = hoveredControlId === 'comms_filter' ? '#ffffff' : '#38bdf8';
    dctx.strokeRect(374, 112, 290, 80);

    const optFilterX = 374 + Math.round((hw.targetBandpassPct / 100) * 290);
    dctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
    dctx.fillRect(optFilterX - 20, 112, 40, 80);

    const faderW = Math.round((hw.bandpassFilterPct / 100) * 282);
    dctx.fillStyle = '#0284c7';
    dctx.fillRect(378, 116, faderW, 72);
    dctx.fillStyle = '#ffffff';
    dctx.font = 'bold 15px monospace';
    dctx.fillText(
      `FILTER: ${Math.round(hw.bandpassFilterPct)}% (Opt: ${hw.targetBandpassPct}%)`,
      406,
      158
    );

    dctx.fillStyle = '#020617';
    dctx.fillRect(374, 216, 290, 172);
    dctx.strokeStyle = '#334155';
    dctx.strokeRect(374, 216, 290, 172);

    dctx.beginPath();
    const staticAmp = ((100 - hw.signalClarityPct) / 100) * 48;
    for (let x = 384; x <= 654; x += 4) {
      const cleanY = Math.sin((x - 384) * 0.06 + animClock * 4) * 26;
      const noiseY = Math.sin(x * 1.9 + animClock * 19) * staticAmp;
      const py = 302 + cleanY + noiseY;
      if (x === 384) dctx.moveTo(x, py);
      else dctx.lineTo(x, py);
    }
    dctx.strokeStyle = hw.signalClarityPct >= 85 ? '#10b981' : '#f59e0b';
    dctx.lineWidth = 2.5;
    dctx.stroke();

    dctx.fillStyle = '#e2e8f0';
    dctx.font = 'bold 13px monospace';
    dctx.fillText(
      hw.signalClarityPct >= 85 ? 'STATIC CLEARED — SIGNAL LOCKED' : 'TUNE WHEEL & FADER TO CLEAR STATIC',
      388,
      376
    );

    // Right Panel: Diplomatic Hailing Protocols (Illuminated Acrylic Keycaps)
    dctx.fillStyle = '#0b101b';
    dctx.fillRect(698, 58, 310, 352);
    dctx.strokeStyle = '#f59e0b';
    dctx.lineWidth = 2;
    dctx.strokeRect(698, 58, 310, 352);

    dctx.fillStyle = '#fde047';
    dctx.font = 'bold 14px monospace';
    dctx.textAlign = 'center';
    dctx.fillText('DIPLOMATIC HAILING PROTOCOLS', 853, 84);
    dctx.textAlign = 'left';

    const hailBtns = [
      {
        id: 'comms_hail_std',
        label: '[ OPEN HAILING FREQUENCIES ]',
        sub: hw.weaponsArmed ? '⚠ WEAPONS ARMED (-40% TRUST!)' : 'STANDARD FEDERATION GREETING',
        y: 100,
        hex: hw.weaponsArmed ? '#ef4444' : '#38bdf8',
      },
      {
        id: 'comms_hail_sci',
        label: '[ TRANSMIT SCIENCE TELEMETRY ]',
        sub: 'SHARE ASTROMETRIC DATA (+25% TRUST)',
        y: 204,
        hex: '#10b981',
      },
      {
        id: 'comms_hail_all',
        label: '[ PROPOSE PEACEFUL ACCORD ]',
        sub: 'ESTABLISH MUTUAL NON-AGGRESSION',
        y: 308,
        hex: '#fde047',
      },
    ];

    for (const hb of hailBtns) {
      drawStarfleetKeycap(
        dctx,
        714,
        hb.y,
        278,
        88,
        hb.hex,
        hb.label,
        hoveredControlId === hb.id,
        true,
        hb.sub
      );
    }

    // Bottom Strip + 24 Starfleet Indicator Blocks
    dctx.fillStyle = '#0f172a';
    dctx.fillRect(16, 418, 992, 46);
    dctx.strokeStyle = '#334155';
    dctx.strokeRect(16, 418, 992, 46);
    dctx.fillStyle = hw.weaponsArmed ? '#fca5a5' : '#6ee7b7';
    dctx.font = 'bold 13px monospace';
    dctx.fillText(hw.commsStatusBanner.slice(0, 82), 28, 446);

    const commsBankPalette = ['#10b981', '#38bdf8', '#fde047', '#f97316', '#10b981', '#c084fc'];
    for (let i = 0; i < 24; i++) {
      drawStarfleetKeycap(
        dctx,
        16 + i * 41.4,
        470,
        37,
        32,
        commsBankPalette[i % commsBankPalette.length],
        undefined,
        false,
        (i + Math.floor(animClock * 4)) % 2 === 0
      );
    }

    cc.deskTex.needsUpdate = true;

    const uctx = cc.upperCtx;
    uctx.fillStyle = '#020617';
    uctx.fillRect(0, 0, 1024, 512);

    uctx.fillStyle = '#ff9900';
    uctx.fillRect(14, 10, 210, 38);
    uctx.fillStyle = '#059669';
    uctx.fillRect(232, 10, 778, 38);
    uctx.fillStyle = '#020617';
    uctx.font = 'bold 16px monospace';
    uctx.fillText('LCARS // COM-05', 26, 35);
    uctx.fillStyle = '#ffffff';
    uctx.font = 'bold 16px monospace';
    uctx.fillText(
      'UNIVERSAL TRANSLATOR NODES & LIVE DIPLOMATIC TRUST METER',
      248,
      35
    );

    uctx.fillStyle = '#090d16';
    uctx.fillRect(16, 58, 992, 194);
    uctx.strokeStyle = '#ff9900';
    uctx.lineWidth = 2.5;
    uctx.strokeRect(16, 58, 992, 194);

    const nodes = ['PHONEME LOCK', 'SYNTAX TREE', 'SEMANTIC MAP', 'BASE-12 MATH', 'CULTURAL ID', 'INTENT MATRIX'];
    nodes.forEach((nLabel, idx) => {
      const threshold = (idx + 1) * 14;
      const isDecoded = hw.signalClarityPct >= threshold;
      const nx = 32 + idx * 160;
      drawStarfleetKeycap(
        uctx,
        nx,
        74,
        146,
        68,
        isDecoded ? '#10b981' : '#38bdf8',
        nLabel,
        false,
        isDecoded,
        isDecoded ? '✓ DECODED' : 'STATIC...'
      );
    });

    uctx.fillStyle = '#020617';
    uctx.fillRect(32, 154, 960, 84);
    uctx.strokeStyle = '#38bdf8';
    uctx.strokeRect(32, 154, 960, 84);
    uctx.fillStyle = '#e2e8f0';
    uctx.font = 'bold 14px monospace';
    wrapCanvasText(
      uctx,
      hw.signalClarityPct >= 75
        ? hw.translatedMessage
        : '[ENCRYPTED SUBSPACE STATIC]: ░▒▓█ Tune Carrier Frequency Wheel & Bandpass Filter Fader on Comms Desk to decode transmission █▓▒░',
      46,
      182,
      930,
      22,
      2
    );

    uctx.fillStyle = '#090d16';
    uctx.fillRect(16, 266, 992, 230);
    uctx.strokeStyle = hw.weaponsArmed ? '#ef4444' : '#ff9900';
    uctx.lineWidth = 2.5;
    uctx.strokeRect(16, 266, 992, 230);

    uctx.fillStyle = '#ffffff';
    uctx.font = 'bold 18px monospace';
    uctx.fillText(`LIVE DIPLOMATIC TRUST METER: ${Math.round(hw.diplomaticTrustPct)}%`, 36, 302);

    uctx.fillStyle = '#020617';
    uctx.fillRect(36, 318, 952, 56);
    uctx.strokeStyle = '#475569';
    uctx.strokeRect(36, 318, 952, 56);

    const trustW = Math.round((Math.max(0, Math.min(100, hw.diplomaticTrustPct)) / 100) * 944);
    uctx.fillStyle =
      hw.diplomaticTrustPct >= 70
        ? '#10b981'
        : hw.diplomaticTrustPct >= 40
        ? '#f59e0b'
        : '#ef4444';
    uctx.fillRect(40, 322, trustW, 48);

    if (hw.weaponsArmed || hw.isFiringPhasers) {
      uctx.fillStyle = 'rgba(185, 28, 28, 0.85)';
      uctx.fillRect(36, 392, 952, 86);
      uctx.strokeStyle = '#fca5a5';
      uctx.strokeRect(36, 392, 952, 86);
      uctx.fillStyle = '#ffffff';
      uctx.font = 'bold 16px monospace';
      uctx.fillText(
        '⚠ TACTICAL LINK WARNING: PHASERS / WEAPONS ARE ARMED AT TACTICAL!',
        54,
        426
      );
      uctx.fillStyle = '#fde047';
      uctx.font = 'bold 14px monospace';
      uctx.fillText(
        'Hailing while Phasers are armed reduces Alien Diplomatic Trust by -40%! Disarm weapons at Tactical for peaceful First Contact.',
        54,
        456
      );
    } else {
      uctx.fillStyle = 'rgba(6, 78, 59, 0.65)';
      uctx.fillRect(36, 392, 952, 86);
      uctx.strokeStyle = '#34d399';
      uctx.strokeRect(36, 392, 952, 86);
      uctx.fillStyle = '#6ee7b7';
      uctx.font = 'bold 16px monospace';
      uctx.fillText(
        '✓ TACTICAL LINK NOMINAL: WEAPONS SAFE — DIPLOMATIC POSTURE VERIFIED (+TRUST BONUS)',
        54,
        426
      );
      uctx.fillStyle = '#e2e8f0';
      uctx.font = '14px monospace';
      uctx.fillText(
        'Alien sensors confirm Enterprise weapons are powered down. Hailing with clear signal builds +25% Diplomatic Trust.',
        54,
        456
      );
    }

    cc.upperTex.needsUpdate = true;
  };

  const redrawEngineering3DStation = () => {
    const ec = stationCanvases.get('engineering');
    if (!ec) return;

    if (ec.knob1) {
      ec.knob1.rotation.y = ((hw.intermixRatioPct - 50) / 50) * 2.1;
    }

    const dctx = ec.deskCtx;
    dctx.fillStyle = '#07090f';
    dctx.fillRect(0, 0, 1024, 512);

    dctx.fillStyle = '#f97316';
    dctx.fillRect(14, 10, 420, 36);
    dctx.fillStyle = '#020617';
    dctx.font = 'bold 17px monospace';
    dctx.fillText('LT. CMDR. SCOTT // 3D ENGINEERING DESK', 24, 34);

    dctx.fillStyle = '#0f172a';
    dctx.fillRect(442, 10, 568, 36);
    dctx.strokeStyle = '#f97316';
    dctx.lineWidth = 2;
    dctx.strokeRect(442, 10, 568, 36);
    dctx.fillStyle = '#fde047';
    dctx.font = 'bold 14px monospace';
    dctx.fillText(
      `CORE TEMP: ${Math.round(hw.coolantTempK)} K · HULL: ${Math.round(hw.hullIntegrity)}% · SHIELDS: ${Math.round(hw.shieldIntegrity)}%`,
      458,
      33
    );

    dctx.fillStyle = '#0b101b';
    dctx.fillRect(16, 58, 364, 352);
    dctx.strokeStyle = '#f97316';
    dctx.lineWidth = 2;
    dctx.strokeRect(16, 58, 364, 352);

    drawRadialButtonArc(
      dctx,
      198,
      230,
      108,
      126,
      -62,
      62,
      9,
      2,
      ['#f97316', '#fde047', '#ef4444', '#10b981', '#38bdf8'],
      3
    );

    drawCanvasRotaryKnob(
      dctx,
      198,
      230,
      92,
      (hw.intermixRatioPct - 50) / 75,
      100 / 125,
      'M/AM INTERMIX RATIO',
      `${Math.round(hw.intermixRatioPct)}%`,
      '#f97316',
      hoveredControlId === 'eng_intermix'
    );

    drawStarfleetKeycap(
      dctx,
      400,
      78,
      604,
      146,
      '#38bdf8',
      '[ PURGE WARP CORE COOLANT LOOP ]',
      hoveredControlId === 'eng_purge',
      true,
      `CORE TEMP: ${Math.round(hw.coolantTempK)} K · VENT THERMAL BUILDUP`
    );

    drawStarfleetKeycap(
      dctx,
      400,
      248,
      604,
      146,
      '#10b981',
      '[ AUXILIARY DAMAGE CONTROL & SHIELD SHUNT ]',
      hoveredControlId === 'eng_repair',
      true,
      `HULL: ${Math.round(hw.hullIntegrity)}% · SHIELDS: ${Math.round(hw.shieldIntegrity)}% (REINFORCE)`
    );

    // Bottom Strip of 24 Illuminated Starfleet Engineering Indicator Blocks
    const engBankPalette = ['#f97316', '#fde047', '#ef4444', '#10b981', '#38bdf8'];
    for (let i = 0; i < 24; i++) {
      drawStarfleetKeycap(
        dctx,
        16 + i * 41.4,
        464,
        37,
        36,
        engBankPalette[i % engBankPalette.length],
        undefined,
        false,
        i % 3 !== 2
      );
    }

    ec.deskTex.needsUpdate = true;

    const uctx = ec.upperCtx;
    uctx.fillStyle = '#020617';
    uctx.fillRect(0, 0, 1024, 512);
    uctx.fillStyle = '#ff9900';
    uctx.fillRect(14, 10, 210, 38);
    uctx.fillStyle = '#ea580c';
    uctx.fillRect(232, 10, 778, 38);
    uctx.fillStyle = '#020617';
    uctx.font = 'bold 16px monospace';
    uctx.fillText('LCARS // ENG-06', 26, 35);
    uctx.fillStyle = '#ffffff';
    uctx.font = 'bold 16px monospace';
    uctx.fillText('DILITHIUM MATRIX & STRUCTURAL INTEGRITY', 248, 35);

    const bars = [
      { label: 'MATTER / ANTIMATTER INTERMIX', val: hw.intermixRatioPct, hex: '#f97316', y: 90 },
      { label: 'HULL STRUCTURAL INTEGRITY', val: hw.hullIntegrity, hex: '#10b981', y: 190 },
      { label: 'MULTIPHASIC SHIELD GRID', val: hw.shieldIntegrity, hex: '#38bdf8', y: 290 },
      { label: 'MASTER ENGINE POWER ALLOCATION', val: hw.powerEngines, hex: '#eab308', y: 390 },
    ];
    for (const b of bars) {
      uctx.fillStyle = '#e2e8f0';
      uctx.font = 'bold 15px monospace';
      uctx.fillText(`${b.label}: ${Math.round(b.val)}%`, 40, b.y);
      uctx.fillStyle = '#0f172a';
      uctx.fillRect(40, b.y + 14, 940, 44);
      uctx.strokeStyle = '#ff9900';
      uctx.lineWidth = 1.5;
      uctx.strokeRect(40, b.y + 14, 940, 44);
      uctx.fillStyle = b.hex;
      uctx.fillRect(44, b.y + 18, Math.round((Math.min(100, b.val) / 100) * 932), 36);
    }
    ec.upperTex.needsUpdate = true;
  };

  let animClock = 0;

  const redrawAll3DConsoles = () => {
    redrawViewscreen3DOverlay();
    redrawCaptainLeftArmrest();
    redrawCaptainRightArmrest();
    redrawSulu3DConsole();
    redrawScience3DStation();
    redrawTactical3DStation();
    redrawComms3DStation();
    redrawEngineering3DStation();
  };

  redrawAll3DConsoles();

  // ---------------------------------------------------------------------------
  // 11. 3D UV HIT RESOLVER ACROSS ALL BRIDGE CONSOLES & ARMRESTS
  // ---------------------------------------------------------------------------
  const resolveSuluConsoleUV = (
    u: number,
    v: number
  ): { controlId: string; action: Bridge3DConsoleAction } | null => {
    const px = u * 1024;
    const py = (1 - v) * 512;

    if (px >= 14 && px <= 244) {
      if (py >= 58 && py <= 265) {
        const dx = px - 129;
        const dy = py - 176;
        const deg = (Math.round((Math.atan2(dx, -dy) * 180) / Math.PI) + 360) % 360;
        return { controlId: 'heading', action: { type: 'heading', headingDeg: deg } };
      }
      if (py >= 288 && py <= 348) {
        const pitchDeg = Math.round(Math.max(-60, Math.min(60, ((px - 129) / 88) * 60)));
        return { controlId: 'pitch', action: { type: 'pitch', pitchDeg } };
      }
      if (py >= 352 && py <= 406) {
        return { controlId: 'level_horizon', action: { type: 'level_horizon' } };
      }
    }

    if (px >= 256 && px <= 478) {
      if (py >= 86 && py <= 132) return { controlId: 'imp_100', action: { type: 'throttle', percent: 100 } };
      if (py >= 134 && py <= 180) return { controlId: 'imp_75', action: { type: 'throttle', percent: 75 } };
      if (py >= 182 && py <= 228) return { controlId: 'imp_50', action: { type: 'throttle', percent: 50 } };
      if (py >= 230 && py <= 276) return { controlId: 'imp_25', action: { type: 'throttle', percent: 25 } };
      if (py >= 278 && py <= 326) return { controlId: 'imp_0', action: { type: 'throttle', percent: 0 } };
      if (py >= 330 && py <= 406) {
        return { controlId: 'toggle_dampeners', action: { type: 'toggle_inertial_dampeners' } };
      }
    }

    if (px >= 490 && px <= 774) {
      if (py >= 80 && py <= 238) {
        if (px < 632) {
          const dx = px - 562;
          const dy = py - 162;
          let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
          deg = Math.max(-135, Math.min(135, deg));
          const pct = Math.round(((deg + 135) / 270) * 100);
          return {
            controlId: 'alcubierre_contraction',
            action: { type: 'alcubierre_contraction', percent: pct },
          };
        } else {
          const dx = px - 702;
          const dy = py - 162;
          let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
          deg = Math.max(-135, Math.min(135, deg));
          const pct = Math.round(((deg + 135) / 270) * 100);
          return {
            controlId: 'alcubierre_expansion',
            action: { type: 'alcubierre_expansion', percent: pct },
          };
        }
      }
      if (py >= 246 && py <= 406) {
        return { controlId: 'lock_orbit', action: { type: 'lock_orbital_velocity' } };
      }
    }

    if (px >= 786 && px <= 1010) {
      if (py >= 86 && py <= 168) {
        const wfNorm = Math.max(0, Math.min(1, (px - 804) / 188));
        const factor = Number((1.0 + wfNorm * 8.9).toFixed(1));
        return { controlId: 'warp_slider', action: { type: 'warp_factor', factor } };
      }
      if (py >= 174 && py <= 296) {
        return { controlId: 'toggle_warp', action: { type: 'toggle_warp' } };
      }
      if (py >= 302 && py <= 406) {
        return { controlId: 'trigger_boost', action: { type: 'trigger_boost' } };
      }
    }

    return null;
  };

  const resolveConsoleHit = (
    mesh: THREE.Object3D,
    u: number,
    v: number
  ): { controlId: string; action: Bridge3DConsoleAction } | null => {
    const surfaceId = mesh.userData.consoleSurfaceId as string | undefined;
    if (!surfaceId) return null;

    if (surfaceId === 'helm_desk') {
      return resolveSuluConsoleUV(u, v);
    }

    if (surfaceId === 'captain_left') {
      const px = u * 512;
      const py = (1 - v) * 512;

      if (py >= 60 && py <= 370) {
        const val = Math.round(Math.max(10, Math.min(80, ((316 - py) / 214) * 100)));
        if (px >= 24 && px <= 174) {
          return { controlId: 'pwr_engines', action: { type: 'power_pool', channel: 'engines', value: val } };
        }
        if (px >= 178 && px <= 328) {
          return { controlId: 'pwr_shields', action: { type: 'power_pool', channel: 'shields', value: val } };
        }
        if (px >= 332 && px <= 490) {
          return { controlId: 'pwr_weapons', action: { type: 'power_pool', channel: 'weapons', value: val } };
        }
      }

      if (py >= 384 && py <= 502) {
        if (px < 174) return { controlId: 'alert_green', action: { type: 'set_alert', level: 'green' } };
        if (px < 338) return { controlId: 'alert_yellow', action: { type: 'set_alert', level: 'yellow' } };
        return { controlId: 'alert_red', action: { type: 'set_alert', level: 'red' } };
      }
      return null;
    }

    if (surfaceId === 'captain_right') {
      const px = u * 512;
      const py = (1 - v) * 512;

      if (py >= 8 && py <= 58) {
        if (px < 132) return { controlId: 'poll_helm', action: { type: 'request_officer_report', stationId: 'helm' } };
        if (px < 254) return { controlId: 'poll_sci', action: { type: 'request_officer_report', stationId: 'science' } };
        if (px < 376) return { controlId: 'poll_tac', action: { type: 'request_officer_report', stationId: 'tactical' } };
        return { controlId: 'poll_comms', action: { type: 'request_officer_report', stationId: 'comms' } };
      }
      if (py >= 290 && py <= 392) {
        return { controlId: 'advisory_manual', action: { type: 'advisory_manual' } };
      }
      if (py >= 398 && py <= 502) {
        return { controlId: 'advisory_delegate', action: { type: 'advisory_delegate' } };
      }
      return null;
    }

    if (surfaceId === 'science_desk') {
      const px = u * 1024;
      const py = (1 - v) * 512;

      if (px >= 16 && px <= 316 && py >= 58 && py <= 410) {
        const dx = px - 166;
        const dy = py - 220;
        let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
        deg = Math.max(-135, Math.min(135, deg));
        const wavelengthNm = Math.round(380 + ((deg + 135) / 270) * 370);
        return { controlId: 'sci_wavelength', action: { type: 'science_wavelength', wavelengthNm } };
      }

      if (px >= 330 && px <= 630 && py >= 58 && py <= 410) {
        const dx = px - 480;
        const dy = py - 220;
        let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
        deg = Math.max(-135, Math.min(135, deg));
        const amplitudePct = Math.round(10 + ((deg + 135) / 270) * 90);
        return { controlId: 'sci_amplitude', action: { type: 'science_amplitude', amplitudePct } };
      }

      if (px >= 644 && px <= 1008) {
        if (py >= 94 && py <= 182) {
          const particlePct = Math.round(Math.max(0, Math.min(100, ((px - 668) / 316) * 100)));
          return { controlId: 'sci_deflector_slider', action: { type: 'science_deflector_slider', particlePct } };
        }
        if (py >= 190 && py <= 296) {
          return { controlId: 'sci_fire_deflector', action: { type: 'science_fire_deflector' } };
        }
        if (py >= 302 && py <= 402) {
          return { controlId: 'sci_auto_align', action: { type: 'science_auto_align' } };
        }
      }
      return null;
    }

    if (surfaceId === 'tactical_desk') {
      const px = u * 1024;
      const py = (1 - v) * 512;

      if (px >= 16 && px <= 310) {
        if (py >= 58 && py <= 328) {
          const dx = px - 163;
          const dy = py - 206;
          let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
          deg = Math.max(-135, Math.min(135, deg));
          const freqMhz = Number((140 + ((deg + 135) / 270) * 200).toFixed(1));
          return { controlId: 'tac_shield_freq', action: { type: 'tactical_shield_freq', freqMhz } };
        }
        if (py >= 332 && py <= 404) {
          return { controlId: 'tac_toggle_shields', action: { type: 'tactical_toggle_shields' } };
        }
      }

      if (px >= 322 && px <= 668) {
        if (py >= 92 && py <= 162 && px >= 415 && px <= 575) {
          return { controlId: 'quad_fwd', action: { type: 'tactical_quadrant_shield', quadrant: 'forward' } };
        }
        if (py >= 274 && py <= 344 && px >= 415 && px <= 575) {
          return { controlId: 'quad_aft', action: { type: 'tactical_quadrant_shield', quadrant: 'aft' } };
        }
        if (py >= 166 && py <= 270 && px >= 330 && px <= 434) {
          return { controlId: 'quad_port', action: { type: 'tactical_quadrant_shield', quadrant: 'port' } };
        }
        if (py >= 166 && py <= 270 && px >= 556 && px <= 660) {
          return { controlId: 'quad_stbd', action: { type: 'tactical_quadrant_shield', quadrant: 'starboard' } };
        }
        if (py >= 166 && py <= 270 && px >= 436 && px <= 554) {
          return { controlId: 'quad_bal', action: { type: 'tactical_quadrant_shield', quadrant: 'balance' } };
        }
        if (py >= 346 && py <= 404) {
          if (px < 495) {
            return { controlId: 'sub_eng', action: { type: 'tactical_subsystem_target', subsystem: 'engines' } };
          }
          return { controlId: 'sub_wpn', action: { type: 'tactical_subsystem_target', subsystem: 'weapons' } };
        }
      }

      if (px >= 680 && px <= 1008) {
        if (py >= 90 && py <= 182) {
          return { controlId: 'tac_fire_phaser', action: { type: 'tactical_fire_phaser' } };
        }
        if (py >= 188 && py <= 280) {
          return { controlId: 'tac_fire_torpedo', action: { type: 'tactical_fire_torpedo' } };
        }
        if (py >= 286 && py <= 346) {
          return { controlId: 'tac_toggle_armed', action: { type: 'tactical_toggle_armed' } };
        }
        if (py >= 350 && py <= 404) {
          if (px < 844) {
            return { controlId: 'tac_cycle', action: { type: 'tactical_cycle_hostile' } };
          }
          return { controlId: 'tac_vent', action: { type: 'tactical_vent_heat' } };
        }
      }
      return null;
    }

    if (surfaceId === 'tactical_upper') {
      const px = u * 1024;
      const py = (1 - v) * 512;

      if (px >= 16 && px <= 504) {
        if (py >= 60 && py <= 364) {
          return { controlId: 'tac_pinpoint', action: { type: 'tactical_pinpoint_target' } };
        }
        if (py >= 368 && py <= 430) {
          if (px < 172) {
            return { controlId: 'tac_prev_target', action: { type: 'tactical_prev_hostile' } };
          }
          if (px < 344) {
            return { controlId: 'tac_pinpoint', action: { type: 'tactical_pinpoint_target' } };
          }
          return { controlId: 'tac_next_target', action: { type: 'tactical_cycle_hostile' } };
        }
        if (py >= 432 && py <= 498) {
          if (px < 320) {
            return { controlId: 'tac_upper_torpedo', action: { type: 'tactical_fire_torpedo' } };
          }
          if (hw.aliveHostilesCount > 0) {
            return { controlId: 'tac_upper_aux', action: { type: 'tactical_fire_phaser' } };
          }
          return { controlId: 'tac_upper_aux', action: { type: 'tactical_summon_fleet' } };
        }
      }

      if (px >= 530 && px <= 990) {
        if (py >= 256 && py <= 360) {
          return { controlId: 'sub_eng', action: { type: 'tactical_subsystem_target', subsystem: 'engines' } };
        }
        if (py >= 368 && py <= 474) {
          return { controlId: 'sub_wpn', action: { type: 'tactical_subsystem_target', subsystem: 'weapons' } };
        }
      }
      return null;
    }

    if (surfaceId === 'comms_desk') {
      const px = u * 1024;
      const py = (1 - v) * 512;

      if (px >= 16 && px <= 340 && py >= 58 && py <= 410) {
        const dx = px - 178;
        const dy = py - 220;
        let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
        deg = Math.max(-135, Math.min(135, deg));
        const freqMhz = Number((80 + ((deg + 135) / 270) * 180).toFixed(1));
        return { controlId: 'comms_freq', action: { type: 'comms_carrier_freq', freqMhz } };
      }

      if (px >= 354 && px <= 684 && py >= 96 && py <= 205) {
        const filterPct = Math.round(Math.max(0, Math.min(100, ((px - 378) / 282) * 100)));
        return { controlId: 'comms_filter', action: { type: 'comms_bandpass_filter', filterPct } };
      }

      if (px >= 698 && px <= 1008) {
        if (py >= 96 && py <= 192) {
          return { controlId: 'comms_hail_std', action: { type: 'comms_hail', mode: 'standard' } };
        }
        if (py >= 200 && py <= 296) {
          return { controlId: 'comms_hail_sci', action: { type: 'comms_hail', mode: 'scientific' } };
        }
        if (py >= 304 && py <= 402) {
          return { controlId: 'comms_hail_all', action: { type: 'comms_hail', mode: 'alliance' } };
        }
      }
      return null;
    }

    if (surfaceId === 'engineering_desk') {
      const px = u * 1024;
      const py = (1 - v) * 512;
      if (px < 380) {
        const dx = px - 198;
        const dy = py - 230;
        let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
        deg = Math.max(-135, Math.min(135, deg));
        const ratioPct = Math.round(50 + ((deg + 135) / 270) * 75);
        return { controlId: 'eng_intermix', action: { type: 'engineering_intermix', ratioPct } };
      }
      if (py < 235) {
        return { controlId: 'eng_purge', action: { type: 'engineering_purge_coolant' } };
      }
      return { controlId: 'eng_repair', action: { type: 'engineering_emergency_repair' } };
    }

    return null;
  };

  let activeStationId: BridgeStationId = 'captain';
  let hoveredStationId: BridgeStationId | null = null;

  const highlightStation = (stationId: BridgeStationId | null) => {
    hoveredStationId = stationId;
    for (const [id, beacon] of stationRingBeacons.entries()) {
      const mat = beacon.material as THREE.MeshBasicMaterial;
      if (id === hoveredStationId || id === activeStationId) {
        mat.opacity = 0.95;
        beacon.scale.setScalar(1.08);
      } else {
        mat.opacity = 0.35;
        beacon.scale.setScalar(1.0);
      }
    }
  };

  const setActiveStation = (stationId: BridgeStationId) => {
    activeStationId = stationId;
    highlightStation(hoveredStationId);
    // Automatically hide the articulated mannequin occupying the active station's seat
    // so it never blocks the player's First-Person POV camera, while keeping all other
    // station mannequins visible around the bridge (and ALL visible in 'overview' mode)!
    for (const rig of mannequinRigs) {
      if (rig.primarySeatStationId) {
        rig.group.visible = rig.primarySeatStationId !== activeStationId;
      }
    }
    if (root.visible) {
      redrawAll3DConsoles();
      consolesDirty = false;
    } else {
      consolesDirty = true;
    }
  };

  let consolesDirty = false;
  let lastTelemetryConsoleRedrawMs = 0;

  const redrawActiveStationConsoles = () => {
    redrawViewscreen3DOverlay();
    switch (activeStationId) {
      case 'captain':
        redrawCaptainLeftArmrest();
        redrawCaptainRightArmrest();
        redrawSulu3DConsole();
        break;
      case 'helm':
        redrawSulu3DConsole();
        break;
      case 'science':
        redrawScience3DStation();
        break;
      case 'tactical':
        redrawTactical3DStation();
        break;
      case 'comms':
        redrawComms3DStation();
        break;
      case 'engineering':
        redrawEngineering3DStation();
        break;
      case 'overview':
      default:
        redrawAll3DConsoles();
        break;
    }
  };

  // Initialize visibility for default 'captain' station
  setActiveStation('captain');

  const setViewscreenZoom = (zoom: number) => {
    const clamped = Math.max(1, Math.min(6, zoom));
    hw.viewscreenZoom = clamped;
    viewscreenCamera.fov = 52 / clamped;
    viewscreenCamera.updateProjectionMatrix();
    if (root.visible) {
      redrawViewscreen3DOverlay();
    } else {
      consolesDirty = true;
    }
  };

  const setHoveredControl = (controlId: string | null) => {
    if (hoveredControlId !== controlId) {
      hoveredControlId = controlId;
      if (root.visible) {
        redrawActiveStationConsoles();
      } else {
        consolesDirty = true;
      }
    }
  };

  const getHardwareState = (): BridgeHardwareState => ({
    ...hw,
    shieldQuadrants: { ...hw.shieldQuadrants },
  });

  const setHardwareTelemetry = (params: Partial<BridgeHardwareState>) => {
    let changed = false;
    for (const key of Object.keys(params) as (keyof BridgeHardwareState)[]) {
      const val = params[key];
      if (val !== undefined && hw[key] !== val) {
        (hw as any)[key] = val;
        changed = true;
      }
    }
    if (changed) {
      if (!root.visible) {
        consolesDirty = true;
        return;
      }
      const now = performance.now();
      if (now - lastTelemetryConsoleRedrawMs >= 90) {
        lastTelemetryConsoleRedrawMs = now;
        consolesDirty = false;
        redrawActiveStationConsoles();
      } else {
        consolesDirty = true;
      }
    }
  };

  let lastOscilloscopeRedraw = 0;

  const update = (delta: number, isRedAlert: boolean, isWarping: boolean) => {
    if (!root.visible) return;

    if (consolesDirty) {
      const now = performance.now();
      if (now - lastTelemetryConsoleRedrawMs >= 90) {
        lastTelemetryConsoleRedrawMs = now;
        consolesDirty = false;
        redrawAll3DConsoles();
      }
    }

    animClock += delta;

    if (isRedAlert) {
      const pulse = (Math.sin(animClock * 7.5) + 1) * 0.5;
      alertRedLight.intensity = 1.2 + pulse * 2.2;
      overheadDomeLight.intensity = 1.6 + (1 - pulse) * 0.9;
      skylightDiffuserMat.color.setHex(pulse > 0.45 ? 0xef4444 : 0x7f1d1d);
      ceilingCoveGlowMat.color.setHex(pulse > 0.45 ? 0xf87171 : 0x991b1b);
    } else {
      alertRedLight.intensity = 0;
      overheadDomeLight.intensity = isWarping ? 3.5 : 3.0;
      skylightDiffuserMat.color.setHex(0xf8fafc);
      ceilingCoveGlowMat.color.setHex(0xbae6fd);
    }

    // Subtle idle animations on all articulated Starfleet crew figures (head turns, breathing, console operation)
    for (const rig of mannequinRigs) {
      const t = animClock * 1.4 + rig.phaseOffset;
      rig.head.rotation.y = Math.sin(t * 0.7) * 0.16;
      rig.head.rotation.x = Math.cos(t * 0.5) * 0.05;
      rig.torso.position.y = rig.baseTorsoY + Math.sin(t * 1.6) * 0.008;
      rig.leftArm.rotation.x = Math.sin(t * 2.2) * 0.04;
      rig.rightArm.rotation.x = Math.cos(t * 2.4) * 0.04;
    }

    // Live animation refresh for Perimeter Middle Fascia Status Matrix, Rotating Moiré Sensor Wheel,
    // Science Oscilloscope, and Comms Waveform
    if (animClock - lastOscilloscopeRedraw > 0.10) {
      lastOscilloscopeRedraw = animClock;
      redrawMidFasciaMatrix(animClock);
      redrawMoireScope(animClock);
      if (activeStationId === 'science' || activeStationId === 'overview') {
        redrawScience3DStation();
      }
      if (activeStationId === 'comms' || activeStationId === 'overview') {
        redrawComms3DStation();
      }
    }
  };

  return {
    root,
    overheadDomeLight,
    alertRedLight,
    viewscreenMesh,
    viewscreenHudMesh,
    viewscreenGroup,
    viewscreenRenderTarget,
    viewscreenCamera,
    captainChair,
    helmConsole,
    suluConsoleMesh,
    interactiveConsoleMeshes,
    stationGroups,
    interactiveHitboxes,
    stationPresets,
    highlightStation,
    setActiveStation,
    setViewscreenZoom,
    resolveConsoleHit,
    resolveSuluConsoleUV,
    setHoveredControl,
    setSuluHoveredControl: setHoveredControl,
    getHardwareState,
    setHardwareTelemetry,
    update,
  };
}
