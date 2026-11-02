// Starfleet Starbase & Deep Space Spacedock 3D Mesh Models
// Monumental Deep-Space Citadel Outpost (Exterior Architecture & Interior Cavernous Hangar Bay)
// Features Interactive Hydraulic Clamps, Overhead Traveling Cranes, and Autonomous 3D Repair Drone Swarms
import * as THREE from 'three';

export interface RepairDrone {
  root: THREE.Group;
  homePos: THREE.Vector3;
  targetPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  shipOffset: THREE.Vector3;
  weldingBeam: THREE.Line;
  beamGeo: THREE.BufferGeometry;
  sparkEmitter: THREE.Points;
  sparkGeo: THREE.BufferGeometry;
  sparkVelocities: Float32Array;
  sparkLifetimes: Float32Array;
  sparkMaxLifetimes: Float32Array;
  isWelding: boolean;
  timer: number;
  targetIndex: number;
}

interface DockingClampPair {
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  retractedX: number;
  extendedX: number;
  currentX: number;
  targetX: number;
  leftBeacon: THREE.Mesh;
  rightBeacon: THREE.Mesh;
}

interface StarbaseInstance {
  id: string;
  root: THREE.Group;
  lod?: THREE.LOD;
  rotatingParts?: THREE.Object3D[];
  beacons?: THREE.Mesh[];
  forcefieldDoors?: THREE.Mesh[];
  berthLocalOffset?: THREE.Vector3;
  dockingClamps?: DockingClampPair[];
  craneTrolley?: THREE.Group;
  craneZ?: number;
  craneSpeed?: number;
  repairDrones?: RepairDrone[];
  dronesActive?: boolean;
  dronesCount?: number;
  coolantEmitter?: THREE.Points;
  coolantGeo?: THREE.BufferGeometry;
  coolantVelocities?: Float32Array;
  coolantLifetimes?: Float32Array;
  coolantActive?: boolean;
  coolantTimer?: number;
  workBees?: { group: THREE.Object3D; orbitRadius: number; speed: number; angle: number; y: number }[];
}

const activeStarbases: StarbaseInstance[] = [];

/**
 * Returns the exact internal docking berth position and orientation inside Spacedock.
 * Berthed starships sit majestically on the illuminated runway centerline,
 * oriented forward looking out through the atmospheric force-field doors into deep space!
 */
export function getSpacedockBerthTransform(
  stationId: string,
  stationWorldPos: THREE.Vector3,
  scaleRadius: number
): { position: THREE.Vector3; orientation: THREE.Quaternion; forward: THREE.Vector3 } {
  const sb = activeStarbases.find((s) => s.id === stationId);
  const baseScale = scaleRadius * 0.55;

  const bayFloorY = baseScale * 0.58;
  const localBerth = sb?.berthLocalOffset || new THREE.Vector3(0, bayFloorY + 2.2, -baseScale * 0.35);
  const worldPos = localBerth.clone();
  if (sb?.root) {
    worldPos.applyQuaternion(sb.root.quaternion).add(stationWorldPos);
  } else {
    worldPos.add(stationWorldPos);
  }

  const forwardDir = new THREE.Vector3(0, 0, 1);
  if (sb?.root) {
    forwardDir.applyQuaternion(sb.root.quaternion);
  }

  const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), forwardDir);

  return {
    position: worldPos,
    orientation,
    forward: forwardDir,
  };
}

/**
 * Control Repair Drone swarm deployment, count, and target tracking
 */
export function setStationDronesState(
  stationId: string,
  active: boolean,
  droneCount: number,
  shipWorldPos: THREE.Vector3,
  shipQuat: THREE.Quaternion
): void {
  const sb = activeStarbases.find((s) => s.id === stationId);
  if (!sb || !sb.repairDrones) return;

  sb.dronesActive = active;
  sb.dronesCount = Math.max(1, Math.min(4, droneCount));

  // Ship target anchor points in local coordinates
  const hullWeldTargets = [
    new THREE.Vector3(0, 0.9, -6.2),    // 1. Saucer forward bow
    new THREE.Vector3(4.8, 0.4, -2.2),  // 2. Starboard saucer rim
    new THREE.Vector3(-4.8, 0.4, -2.2), // 3. Port saucer rim
    new THREE.Vector3(0, 2.3, -1.5),    // 4. Dorsal bridge / neck
    new THREE.Vector3(2.4, -1.4, 2.8),  // 5. Secondary hull starboard
    new THREE.Vector3(-2.4, -1.4, 2.8), // 6. Secondary hull port
    new THREE.Vector3(3.6, 1.6, 4.8),   // 7. Starboard nacelle pylon
    new THREE.Vector3(-3.6, 1.6, 4.8),  // 8. Port nacelle pylon
  ];

  sb.repairDrones.forEach((drone, idx) => {
    if (active && idx < sb.dronesCount!) {
      drone.isWelding = true;
      drone.weldingBeam.visible = true;
      drone.sparkEmitter.visible = true;

      // Assign target weld point on ship
      const targetIdx = (idx * 2 + Math.floor(drone.timer * 0.2)) % hullWeldTargets.length;
      drone.targetIndex = targetIdx;
      const localWeld = hullWeldTargets[targetIdx].clone();
      const worldWeld = localWeld.clone().applyQuaternion(shipQuat).add(shipWorldPos);

      // Drone stands off ~1.8 units away along surface normal
      const standoff = new THREE.Vector3(
        localWeld.x > 0 ? 1.6 : localWeld.x < 0 ? -1.6 : 0,
        localWeld.y > 0 ? 1.4 : -1.2,
        localWeld.z < 0 ? -1.4 : 1.4
      ).normalize().multiplyScalar(1.8).applyQuaternion(shipQuat);

      drone.targetPos.copy(worldWeld).add(standoff);
      drone.shipOffset.copy(worldWeld);
    } else {
      drone.isWelding = false;
      drone.weldingBeam.visible = false;
      drone.sparkEmitter.visible = false;
      drone.targetPos.copy(drone.homePos);
    }
  });
}

/**
 * Control Hydraulic Docking Clamps (engage = extend inward to ship; disengage = retract)
 */
export function setStationClampsState(stationId: string, engaged: boolean): void {
  const sb = activeStarbases.find((s) => s.id === stationId);
  if (!sb || !sb.dockingClamps) return;

  for (const clamp of sb.dockingClamps) {
    clamp.targetX = engaged ? clamp.extendedX : clamp.retractedX;
    const col = engaged ? 0x10b981 : 0xf59e0b;
    (clamp.leftBeacon.material as THREE.MeshBasicMaterial).color.setHex(col);
    (clamp.rightBeacon.material as THREE.MeshBasicMaterial).color.setHex(col);
  }
}

/**
 * Trigger High-Pressure Coolant Vapor Venting Plume
 */
export function triggerStationCoolantPurge(stationId: string, _shipWorldPos: THREE.Vector3): void {
  const sb = activeStarbases.find((s) => s.id === stationId);
  if (!sb || !sb.coolantEmitter) return;

  sb.coolantActive = true;
  sb.coolantTimer = 5.0; // 5 seconds of active coolant venting
  sb.coolantEmitter.visible = true;
}

/**
 * Builds a Starfleet Miniature Moored Starship (Excelsior, Miranda, or Olympic class)
 */
function buildMiniatureMooredStarship(shipType: 'excelsior' | 'miranda' | 'olympic', scale: number): THREE.Group {
  const ship = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.62,
    roughness: 0.35,
  });
  const darkDetailMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    metalness: 0.72,
    roughness: 0.38,
  });
  const warpBlueMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const impulseRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const deflectorCyanMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  if (shipType === 'olympic') {
    // Olympic-class Medical / Science Starship with prominent spherical primary hull
    const sphereSaucer = new THREE.Mesh(new THREE.SphereGeometry(scale * 1.5, 14, 12), hullMat);
    ship.add(sphereSaucer);

    const engTube = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.45, scale * 0.35, scale * 2.2, 10), darkDetailMat);
    engTube.rotation.x = Math.PI / 2;
    engTube.position.set(0, -scale * 0.3, -scale * 1.4);
    ship.add(engTube);

    [-scale * 0.85, scale * 0.85].forEach((nx) => {
      const nac = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.14, scale * 0.14, scale * 2.1, 8), darkDetailMat);
      nac.rotation.x = Math.PI / 2;
      nac.position.set(nx, scale * 0.2, -scale * 1.5);
      ship.add(nac);

      const glow = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.08, scale * 0.08, scale * 1.5), warpBlueMat);
      glow.position.set(nx, scale * 0.2, -scale * 1.5);
      ship.add(glow);
    });

    return ship;
  }

  // Saucer Hull for Excelsior & Miranda
  const saucerGeo = new THREE.CylinderGeometry(scale * 1.8, scale * 2.0, scale * 0.35, 18);
  const saucer = new THREE.Mesh(saucerGeo, hullMat);
  ship.add(saucer);

  const bridgeDome = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.35, 10, 8), hullMat);
  bridgeDome.position.y = scale * 0.22;
  ship.add(bridgeDome);

  if (shipType === 'excelsior') {
    // Excelsior secondary hull & long elegant nacelles
    const engGeo = new THREE.CylinderGeometry(scale * 0.55, scale * 0.4, scale * 2.6, 12);
    const eng = new THREE.Mesh(engGeo, hullMat);
    eng.rotation.x = Math.PI / 2;
    eng.position.set(0, -scale * 0.5, -scale * 1.2);
    ship.add(eng);

    const deflector = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.3, scale * 0.3, scale * 0.1, 10), deflectorCyanMat);
    deflector.rotation.x = Math.PI / 2;
    deflector.position.set(0, -scale * 0.5, scale * 0.1);
    ship.add(deflector);

    [-scale * 0.95, scale * 0.95].forEach((nx) => {
      const nacGeo = new THREE.CylinderGeometry(scale * 0.15, scale * 0.15, scale * 2.8, 8);
      const nac = new THREE.Mesh(nacGeo, darkDetailMat);
      nac.rotation.x = Math.PI / 2;
      nac.position.set(nx, -scale * 0.15, -scale * 1.4);
      ship.add(nac);

      const glow = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.08, scale * 0.08, scale * 2.0), warpBlueMat);
      glow.position.set(nx, -scale * 0.15, -scale * 1.4);
      ship.add(glow);
    });
  } else {
    // Miranda class rollbar weapons pod
    const rollbarGeo = new THREE.TorusGeometry(scale * 1.4, scale * 0.1, 8, 16, Math.PI);
    const rollbar = new THREE.Mesh(rollbarGeo, darkDetailMat);
    rollbar.position.set(0, scale * 0.35, -scale * 0.8);
    ship.add(rollbar);

    const podGeo = new THREE.BoxGeometry(scale * 1.6, scale * 0.25, scale * 0.5);
    const pod = new THREE.Mesh(podGeo, hullMat);
    pod.position.set(0, scale * 0.9, -scale * 0.8);
    ship.add(pod);

    [-scale * 1.1, scale * 1.1].forEach((nx) => {
      const nacGeo = new THREE.CylinderGeometry(scale * 0.16, scale * 0.16, scale * 2.0, 8);
      const nac = new THREE.Mesh(nacGeo, darkDetailMat);
      nac.rotation.x = Math.PI / 2;
      nac.position.set(nx, -scale * 0.45, -scale * 0.9);
      ship.add(nac);
    });
  }

  const imp = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.45, scale * 0.12, scale * 0.1), impulseRedMat);
  imp.position.set(0, 0, -scale * 1.8);
  ship.add(imp);

  return ship;
}

/**
 * Builds a Starfleet Orbital Work-Bee / Utility Service Tug
 */
function buildWorkBeeTug(scale: number): THREE.Group {
  const tug = new THREE.Group();
  const yellowMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.4,
    roughness: 0.3,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.8,
    roughness: 0.4,
  });
  const canopyMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });

  // Main boxy utility pod
  const body = new THREE.Mesh(new THREE.BoxGeometry(scale * 1.2, scale * 0.8, scale * 1.8), yellowMat);
  tug.add(body);

  // Front glass viewport
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.9, scale * 0.45, scale * 0.2), canopyMat);
  canopy.position.set(0, scale * 0.15, scale * 0.9);
  tug.add(canopy);

  // Manipulator arms
  [-scale * 0.4, scale * 0.4].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(scale * 0.06, scale * 0.06, scale * 0.9, 6), darkMat);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(ax, -scale * 0.2, scale * 1.2);
    tug.add(arm);
  });

  // Aft RCS thrusters
  const thruster = new THREE.Mesh(new THREE.BoxGeometry(scale * 0.6, scale * 0.25, scale * 0.1), thrusterMat);
  thruster.position.set(0, 0, -scale * 0.95);
  tug.add(thruster);

  return tug;
}

/**
 * Builds a Starfleet Autonomous Repair Drone Model with Articulated Welder & Particles
 */
function buildRepairDrone(
  bayGroup: THREE.Group,
  baseScale: number,
  alcovePos: THREE.Vector3
): RepairDrone {
  const root = new THREE.Group();
  root.position.copy(alcovePos);
  bayGroup.add(root);

  const droneScale = Math.max(0.75, baseScale * 0.075);

  const podMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    metalness: 0.85,
    roughness: 0.25,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.5,
    roughness: 0.35,
  });
  const sensorEyeMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // Central compact spherical chassis
  const chassis = new THREE.Mesh(new THREE.SphereGeometry(droneScale * 0.48, 12, 10), podMat);
  root.add(chassis);

  // Caution hazard belly stripe
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(droneScale * 0.5, droneScale * 0.06, 6, 16), stripeMat);
  stripe.rotation.x = Math.PI / 2;
  root.add(stripe);

  // Optical sensor dome
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(droneScale * 0.12, droneScale * 0.12, droneScale * 0.18, 8), sensorEyeMat);
  eye.rotation.x = Math.PI / 2;
  eye.position.set(0, 0, droneScale * 0.45);
  root.add(eye);

  // Twin micro-thrusters
  [-droneScale * 0.32, droneScale * 0.32].forEach((tx) => {
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(droneScale * 0.08, droneScale * 0.12, droneScale * 0.22, 6), thrusterMat);
    jet.rotation.x = Math.PI / 2;
    jet.position.set(tx, 0, -droneScale * 0.45);
    root.add(jet);
  });

  // Articulated robotic welding arm extending forward
  const armBase = new THREE.Mesh(new THREE.CylinderGeometry(droneScale * 0.06, droneScale * 0.06, droneScale * 0.45, 6), podMat);
  armBase.rotation.x = Math.PI / 3;
  armBase.position.set(0, -droneScale * 0.25, droneScale * 0.4);
  root.add(armBase);

  const armTip = new THREE.Mesh(new THREE.CylinderGeometry(droneScale * 0.04, droneScale * 0.05, droneScale * 0.35, 6), stripeMat);
  armTip.rotation.x = Math.PI / 4;
  armTip.position.set(0, -droneScale * 0.45, droneScale * 0.65);
  root.add(armTip);

  // High-Intensity Cyan Laser Welding Beam
  const beamPts = [new THREE.Vector3(0, -droneScale * 0.55, droneScale * 0.75), new THREE.Vector3(0, 0, 0)];
  const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPts);
  const beamMat = new THREE.LineBasicMaterial({
    color: 0x67e8f9,
    linewidth: 3,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const weldingBeam = new THREE.Line(beamGeo, beamMat);
  weldingBeam.visible = false;
  bayGroup.add(weldingBeam);

  // Dynamic Welding Spark Particle System (40 bright energetic particles spraying at weld point)
  const sparkCount = 40;
  const sparkPositions = new Float32Array(sparkCount * 3);
  const sparkVelocities = new Float32Array(sparkCount * 3);
  const sparkLifetimes = new Float32Array(sparkCount);
  const sparkMaxLifetimes = new Float32Array(sparkCount);

  for (let i = 0; i < sparkCount; i++) {
    sparkPositions[i * 3] = 0;
    sparkPositions[i * 3 + 1] = 0;
    sparkPositions[i * 3 + 2] = 0;
    sparkVelocities[i * 3] = (Math.random() - 0.5) * 8.0;
    sparkVelocities[i * 3 + 1] = Math.random() * 6.0 + 2.0;
    sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 8.0;
    sparkLifetimes[i] = Math.random();
    sparkMaxLifetimes[i] = 0.35 + Math.random() * 0.45;
  }

  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparkMat = new THREE.PointsMaterial({
    color: 0xfff7ed,
    size: Math.max(0.25, baseScale * 0.022),
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sparkEmitter = new THREE.Points(sparkGeo, sparkMat);
  sparkEmitter.visible = false;
  bayGroup.add(sparkEmitter);

  return {
    root,
    homePos: alcovePos.clone(),
    targetPos: alcovePos.clone(),
    currentPos: alcovePos.clone(),
    shipOffset: new THREE.Vector3(),
    weldingBeam,
    beamGeo,
    sparkEmitter,
    sparkGeo,
    sparkVelocities,
    sparkLifetimes,
    sparkMaxLifetimes,
    isWelding: false,
    timer: Math.random() * 10,
    targetIndex: 0,
  };
}

/**
 * Builds the Master Monumental Deep Space Spacedock Superstructure
 * Combines upgraded exterior citadel architecture with a cavernous, living interior hangar bay
 */
export function buildMonumentalSpacedock(
  id: string,
  position: [number, number, number],
  scaleRadius: number
): { root: THREE.Group } {
  const root = new THREE.Group();
  root.position.set(...position);

  const baseScale = scaleRadius * 0.55;

  // Cinematic PBR Exterior Materials
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xcfd8dc,
    metalness: 0.72,
    roughness: 0.38,
  });
  const darkPlatingMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.82,
    roughness: 0.42,
  });
  const accentGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.6,
    roughness: 0.3,
  });
  const windowCyanMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const windowAmberMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
  const beaconYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const beaconRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const beaconGreen = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const forcefieldCyanMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const antimatterGlowMat = new THREE.MeshBasicMaterial({
    color: 0x00f7ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  const rotatingParts: THREE.Object3D[] = [];
  const beacons: THREE.Mesh[] = [];
  const forcefieldDoors: THREE.Mesh[] = [];
  const dockingClamps: DockingClampPair[] = [];
  const workBees: { group: THREE.Object3D; orbitRadius: number; speed: number; angle: number; y: number }[] = [];

  // ==========================================
  // PART A: UPGRADED EXTERIOR ARCHITECTURE
  // ==========================================
  const exteriorGroup = new THREE.Group();

  // 1. Primary Upper Mushroom Saucer Dome
  const domeRadius = baseScale * 2.2;
  const domeGeo = new THREE.CylinderGeometry(domeRadius * 0.45, domeRadius, baseScale * 0.75, 36);
  const dome = new THREE.Mesh(domeGeo, hullMat);
  dome.position.y = baseScale * 0.85;
  exteriorGroup.add(dome);

  // 24 Radial Armor Facet Plating Wedges on Upper Dome Slope
  const facetCount = 24;
  for (let f = 0; f < facetCount; f++) {
    const fAngle = (f / facetCount) * Math.PI * 2;
    const fRadius = domeRadius * 0.76;
    const facet = new THREE.Mesh(
      new THREE.BoxGeometry(baseScale * 0.22, baseScale * 0.08, baseScale * 0.65),
      f % 2 === 0 ? darkPlatingMat : hullMat
    );
    facet.position.set(Math.cos(fAngle) * fRadius, baseScale * 0.95, Math.sin(fAngle) * fRadius);
    facet.rotation.y = -fAngle;
    facet.rotation.x = 0.25;
    exteriorGroup.add(facet);
  }

  // Stepped Concentric Terraces on Top Dome
  const topTerrace1 = new THREE.Mesh(
    new THREE.CylinderGeometry(domeRadius * 0.6, domeRadius * 0.8, baseScale * 0.22, 32),
    darkPlatingMat
  );
  topTerrace1.position.y = baseScale * 1.25;
  exteriorGroup.add(topTerrace1);

  const topTerrace2 = new THREE.Mesh(
    new THREE.CylinderGeometry(domeRadius * 0.25, domeRadius * 0.45, baseScale * 0.2, 28),
    hullMat
  );
  topTerrace2.position.y = baseScale * 1.45;
  exteriorGroup.add(topTerrace2);

  // Upper Command Citadel Spire with Rotating Sensor Dish
  const antennaSpire = new THREE.Mesh(
    new THREE.CylinderGeometry(baseScale * 0.025, baseScale * 0.065, baseScale * 1.6, 8),
    darkPlatingMat
  );
  antennaSpire.position.y = baseScale * 2.3;
  exteriorGroup.add(antennaSpire);

  // Rotating Parabolic Subspace Dish
  const dishGroup = new THREE.Group();
  dishGroup.position.set(0, baseScale * 1.85, 0);
  const dishMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(baseScale * 0.28, baseScale * 0.04, baseScale * 0.08, 16),
    darkPlatingMat
  );
  dishMesh.rotation.x = Math.PI / 4;
  dishGroup.add(dishMesh);
  exteriorGroup.add(dishGroup);
  rotatingParts.push(dishGroup);

  // Antenna cross-trusses & beacons
  [-1, 1].forEach((dir) => {
    const crossBar = new THREE.Mesh(
      new THREE.CylinderGeometry(baseScale * 0.015, baseScale * 0.015, baseScale * 0.65, 6),
      darkPlatingMat
    );
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.set(0, baseScale * (2.1 + dir * 0.2), 0);
    exteriorGroup.add(crossBar);

    const antTip = new THREE.Mesh(new THREE.SphereGeometry(baseScale * 0.04, 8, 8), beaconRed);
    antTip.position.set(dir * baseScale * 0.32, baseScale * (2.1 + dir * 0.2), 0);
    exteriorGroup.add(antTip);
    beacons.push(antTip);
  });

  const spireTipBeacon = new THREE.Mesh(new THREE.SphereGeometry(baseScale * 0.05, 8, 8), beaconYellow);
  spireTipBeacon.position.y = baseScale * 3.1;
  exteriorGroup.add(spireTipBeacon);
  beacons.push(spireTipBeacon);

  // 2. Primary Saucer Equator Ring & Window Tiers
  const equatorRingGeo = new THREE.TorusGeometry(domeRadius * 1.02, baseScale * 0.16, 12, 40);
  const equatorRing = new THREE.Mesh(equatorRingGeo, darkPlatingMat);
  equatorRing.rotation.x = Math.PI / 2;
  equatorRing.position.y = baseScale * 0.52;
  exteriorGroup.add(equatorRing);

  // Glowing Horizontal Window Bands around Saucer Perimeter
  const winBand1 = new THREE.Mesh(
    new THREE.CylinderGeometry(domeRadius * 0.94, domeRadius * 0.94, baseScale * 0.04, 36, 1, true),
    windowCyanMat
  );
  winBand1.position.y = baseScale * 0.68;
  exteriorGroup.add(winBand1);

  const winBand2 = new THREE.Mesh(
    new THREE.CylinderGeometry(domeRadius * 0.75, domeRadius * 0.75, baseScale * 0.035, 32, 1, true),
    windowAmberMat
  );
  winBand2.position.y = baseScale * 0.98;
  exteriorGroup.add(winBand2);

  // 3. Perimeter Mooring Rings & Docked Fleet (16 Articulated Slips)
  const mooringRadius = domeRadius * 1.48;
  const numMooringPylons = 16;

  for (let m = 0; m < numMooringPylons; m++) {
    const angle = (m / numMooringPylons) * Math.PI * 2;
    const px = Math.cos(angle) * mooringRadius;
    const pz = Math.sin(angle) * mooringRadius;

    // Cantilevered radial structural pylon
    const pylonGeo = new THREE.CylinderGeometry(baseScale * 0.035, baseScale * 0.06, mooringRadius - domeRadius, 6);
    const pylon = new THREE.Mesh(pylonGeo, darkPlatingMat);
    pylon.rotation.z = Math.PI / 2;
    pylon.rotation.y = -angle;
    pylon.position.set(
      Math.cos(angle) * (domeRadius + (mooringRadius - domeRadius) / 2),
      baseScale * 0.52,
      Math.sin(angle) * (domeRadius + (mooringRadius - domeRadius) / 2)
    );
    exteriorGroup.add(pylon);

    // Circular Mooring Ring Slip
    const ringGeo = new THREE.TorusGeometry(baseScale * 0.38, baseScale * 0.045, 8, 20);
    const mooringRing = new THREE.Mesh(ringGeo, hullMat);
    mooringRing.rotation.x = Math.PI / 2;
    mooringRing.position.set(px, baseScale * 0.52, pz);
    exteriorGroup.add(mooringRing);

    // Flashing navigation beacon on each mooring ring
    const bColor = m % 2 === 0 ? beaconYellow : beaconRed;
    const ringBeacon = new THREE.Mesh(new THREE.SphereGeometry(baseScale * 0.035, 6, 6), bColor);
    ringBeacon.position.set(px, baseScale * 0.58, pz);
    exteriorGroup.add(ringBeacon);
    beacons.push(ringBeacon);

    // Docked miniature Federation starships in designated slips
    if (m === 2) {
      const dockedShip = buildMiniatureMooredStarship('excelsior', baseScale * 0.16);
      dockedShip.position.set(px, baseScale * 0.52, pz);
      dockedShip.rotation.y = angle + Math.PI / 2;
      exteriorGroup.add(dockedShip);
    } else if (m === 6) {
      const dockedShip = buildMiniatureMooredStarship('miranda', baseScale * 0.16);
      dockedShip.position.set(px, baseScale * 0.52, pz);
      dockedShip.rotation.y = angle + Math.PI / 2;
      exteriorGroup.add(dockedShip);
    } else if (m === 10) {
      const dockedShip = buildMiniatureMooredStarship('olympic', baseScale * 0.16);
      dockedShip.position.set(px, baseScale * 0.52, pz);
      dockedShip.rotation.y = angle + Math.PI / 2;
      exteriorGroup.add(dockedShip);
    }
  }

  // Patrolling Work-Bee Utility Tugs (Circling outer perimeter)
  for (let w = 0; w < 3; w++) {
    const bee = buildWorkBeeTug(baseScale * 0.12);
    exteriorGroup.add(bee);
    workBees.push({
      group: bee,
      orbitRadius: domeRadius * (1.15 + w * 0.18),
      speed: 0.08 + w * 0.04,
      angle: (w / 3) * Math.PI * 2,
      y: baseScale * (0.35 + w * 0.25),
    });
  }

  // 4. Mid-Section Spherical Habitat Citadel
  const midBulbRadius = baseScale * 1.55;
  const midBulbGeo = new THREE.SphereGeometry(midBulbRadius, 28, 20, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.65);
  const midBulb = new THREE.Mesh(midBulbGeo, hullMat);
  midBulb.position.y = -baseScale * 0.1;
  exteriorGroup.add(midBulb);

  // 5. Giant Toroidal Antimatter Magnetic Storage Core (Surrounding mid-shaft)
  const antimatterTorusGeo = new THREE.TorusGeometry(baseScale * 1.15, baseScale * 0.14, 12, 32);
  const antimatterTorus = new THREE.Mesh(antimatterTorusGeo, darkPlatingMat);
  antimatterTorus.rotation.x = Math.PI / 2;
  antimatterTorus.position.y = -baseScale * 0.85;
  exteriorGroup.add(antimatterTorus);

  // 16 Glowing Cerulean Blue Magnetic Containment Choke Coils
  const coilCount = 16;
  for (let c = 0; c < coilCount; c++) {
    const cAng = (c / coilCount) * Math.PI * 2;
    const coil = new THREE.Mesh(new THREE.BoxGeometry(baseScale * 0.08, baseScale * 0.22, baseScale * 0.16), antimatterGlowMat);
    coil.position.set(Math.cos(cAng) * baseScale * 1.15, -baseScale * 0.85, Math.sin(cAng) * baseScale * 1.15);
    coil.rotation.y = -cAng;
    exteriorGroup.add(coil);
  }

  // 6. Central Engineering Pylon & Heavy Coolant Radiator Heat-Sink Fins
  const shaftRadius = baseScale * 0.65;
  const shaftHeight = baseScale * 3.2;
  const shaftGeo = new THREE.CylinderGeometry(shaftRadius * 0.85, shaftRadius * 0.95, shaftHeight, 24);
  const shaft = new THREE.Mesh(shaftGeo, darkPlatingMat);
  shaft.position.y = -baseScale * 2.2;
  exteriorGroup.add(shaft);

  // 6 Heavy Coolant Radiator Heat-Sink Fins (Extending radially along the lower shaft)
  const finCount = 6;
  for (let f = 0; f < finCount; f++) {
    const finAngle = (f / finCount) * Math.PI * 2;
    const finGeo = new THREE.BoxGeometry(baseScale * 0.05, baseScale * 1.8, baseScale * 0.65);
    const fin = new THREE.Mesh(finGeo, darkPlatingMat);
    fin.position.set(Math.cos(finAngle) * baseScale * 0.85, -baseScale * 2.3, Math.sin(finAngle) * baseScale * 0.85);
    fin.rotation.y = -finAngle;
    exteriorGroup.add(fin);
  }

  // 7. Lower Sensor Bulb Sphere & Bottom Antenna Array
  const botBulbRadius = baseScale * 0.88;
  const botBulbGeo = new THREE.SphereGeometry(botBulbRadius, 20, 16);
  const botBulb = new THREE.Mesh(botBulbGeo, hullMat);
  botBulb.position.y = -baseScale * 4.1;
  exteriorGroup.add(botBulb);

  const botSpireGeo = new THREE.CylinderGeometry(baseScale * 0.02, baseScale * 0.08, baseScale * 1.4, 8);
  const botSpire = new THREE.Mesh(botSpireGeo, darkPlatingMat);
  botSpire.position.y = -baseScale * 5.1;
  exteriorGroup.add(botSpire);

  const botBeacon = new THREE.Mesh(new THREE.SphereGeometry(baseScale * 0.05, 8, 8), beaconRed);
  botBeacon.position.y = -baseScale * 5.8;
  exteriorGroup.add(botBeacon);
  beacons.push(botBeacon);

  // ==========================================
  // PART B: UPGRADED INTERIOR HANGAR BAY (Cavernous Berth)
  // ==========================================
  const interiorBayGroup = new THREE.Group();
  const bayFloorY = baseScale * 0.58;
  const bayLength = Math.max(88, baseScale * 5.6);
  const bayWidth = Math.max(44, baseScale * 3.2);
  const bayHeight = Math.max(26, baseScale * 2.2);

  // 1. Runway Deck Floor with Glowing Guidance Lines
  const floorGeo = new THREE.BoxGeometry(bayWidth, baseScale * 0.12, bayLength);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.85,
    roughness: 0.32,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(0, bayFloorY, 0);
  interiorBayGroup.add(floorMesh);

  // Runway Centerline & Margins
  const centerlineGeo = new THREE.PlaneGeometry(baseScale * 0.09, bayLength * 0.95);
  const centerlineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide });
  const centerline = new THREE.Mesh(centerlineGeo, centerlineMat);
  centerline.rotation.x = -Math.PI / 2;
  centerline.position.set(0, bayFloorY + baseScale * 0.065, 0);
  interiorBayGroup.add(centerline);

  [-bayWidth * 0.38, bayWidth * 0.38].forEach((edgeX) => {
    const edgeLineGeo = new THREE.PlaneGeometry(baseScale * 0.045, bayLength * 0.94);
    const edgeLineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const edgeLine = new THREE.Mesh(edgeLineGeo, edgeLineMat);
    edgeLine.rotation.x = -Math.PI / 2;
    edgeLine.position.set(edgeX, bayFloorY + baseScale * 0.065, 0);
    interiorBayGroup.add(edgeLine);
  });

  // 2. 8 Trapezoidal Arch Ribs with Vertical LED Strip Lights
  const ribCount = 8;
  const ribSpacing = bayLength / (ribCount + 0.5);
  const halfW = bayWidth * 0.48;
  const topW = bayWidth * 0.34;
  const archH = bayHeight;

  for (let r = 0; r < ribCount; r++) {
    const ribZ = -bayLength * 0.48 + r * ribSpacing;
    const ribGroup = new THREE.Group();
    ribGroup.position.z = ribZ;

    const ribMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.35,
    });
    const stripLightMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      side: THREE.DoubleSide,
    });

    // Pillars & Roof Beam
    const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(baseScale * 0.16, archH, baseScale * 0.22), ribMat);
    leftPillar.position.set(-halfW, bayFloorY + archH / 2, 0);
    ribGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(baseScale * 0.16, archH, baseScale * 0.22), ribMat);
    rightPillar.position.set(halfW, bayFloorY + archH / 2, 0);
    ribGroup.add(rightPillar);

    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(topW * 2, baseScale * 0.16, baseScale * 0.25), ribMat);
    topBeam.position.set(0, bayFloorY + archH, 0);
    ribGroup.add(topBeam);

    // Vertical LED Strip Lights
    [-halfW + baseScale * 0.05, halfW - baseScale * 0.05].forEach((lx) => {
      const stripMesh = new THREE.Mesh(new THREE.PlaneGeometry(baseScale * 0.045, archH * 0.88), stripLightMat);
      stripMesh.position.set(lx, bayFloorY + archH * 0.48, baseScale * 0.12);
      ribGroup.add(stripMesh);
    });

    // Multi-tier Catwalk Concourse Galleries with Illuminated Amber Windows
    if (r === 1 || r === 3 || r === 5 || r === 7) {
      [-halfW * 0.92, halfW * 0.92].forEach((cx) => {
        const catwalk = new THREE.Mesh(
          new THREE.BoxGeometry(baseScale * 0.42, baseScale * 0.08, ribSpacing * 0.85),
          darkPlatingMat
        );
        catwalk.position.set(cx, bayFloorY + archH * 0.45, 0);
        ribGroup.add(catwalk);

        const winStrip = new THREE.Mesh(
          new THREE.BoxGeometry(baseScale * 0.08, baseScale * 0.22, ribSpacing * 0.75),
          windowAmberMat
        );
        winStrip.position.set(cx, bayFloorY + archH * 0.62, 0);
        ribGroup.add(winStrip);
      });
    }

    // 3. Articulated Hydraulic Docking Gantry Clamps (Mounted on ribs 2 & 5)
    if (r === 2 || r === 5) {
      const leftArm = new THREE.Group();
      const rightArm = new THREE.Group();

      const clampMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.85,
        roughness: 0.3,
      });

      // Clamp arm geometry
      const armGeo = new THREE.BoxGeometry(baseScale * 0.75, baseScale * 0.12, baseScale * 0.25);
      const leftBar = new THREE.Mesh(armGeo, clampMat);
      leftArm.add(leftBar);
      const rightBar = new THREE.Mesh(armGeo, clampMat);
      rightArm.add(rightBar);

      // Magnetic clamp pads
      const padGeo = new THREE.BoxGeometry(baseScale * 0.12, baseScale * 0.35, baseScale * 0.55);
      const leftPad = new THREE.Mesh(padGeo, darkPlatingMat);
      leftPad.position.x = baseScale * 0.38;
      leftArm.add(leftPad);

      const rightPad = new THREE.Mesh(padGeo, darkPlatingMat);
      rightPad.position.x = -baseScale * 0.38;
      rightArm.add(rightPad);

      // Status indicator beacon on pad
      const lBeacon = new THREE.Mesh(new THREE.SphereGeometry(baseScale * 0.04, 6, 6), beaconGreen);
      lBeacon.position.set(baseScale * 0.42, 0, 0);
      leftArm.add(lBeacon);

      const rBeacon = new THREE.Mesh(new THREE.SphereGeometry(baseScale * 0.04, 6, 6), beaconGreen);
      rBeacon.position.set(-baseScale * 0.42, 0, 0);
      rightArm.add(rBeacon);

      const retractedX = halfW * 0.95;
      const extendedX = halfW * 0.52;

      leftArm.position.set(-extendedX, bayFloorY + baseScale * 0.35, 0);
      rightArm.position.set(extendedX, bayFloorY + baseScale * 0.35, 0);

      ribGroup.add(leftArm);
      ribGroup.add(rightArm);

      dockingClamps.push({
        leftArm,
        rightArm,
        retractedX,
        extendedX,
        currentX: extendedX,
        targetX: extendedX,
        leftBeacon: lBeacon,
        rightBeacon: rBeacon,
      });
    }

    interiorBayGroup.add(ribGroup);
  }

  // 4. Overhead Heavy Traveling Crane Rig (Patrolling longitudinal roof rails)
  const craneGroup = new THREE.Group();
  const craneMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.3,
  });
  const craneRailMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.9,
    roughness: 0.25,
  });

  // Longitudinal roof rails
  [-topW * 0.85, topW * 0.85].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(baseScale * 0.08, baseScale * 0.08, bayLength * 0.92), craneRailMat);
    rail.position.set(rx, bayFloorY + archH - baseScale * 0.08, 0);
    interiorBayGroup.add(rail);
  });

  // Traveling crane bridge & hoist trolley
  const craneBridge = new THREE.Mesh(new THREE.BoxGeometry(topW * 1.8, baseScale * 0.12, baseScale * 0.35), craneMat);
  craneGroup.add(craneBridge);

  // Hoist trolley with floodlights
  const hoist = new THREE.Mesh(new THREE.BoxGeometry(baseScale * 0.45, baseScale * 0.25, baseScale * 0.45), darkPlatingMat);
  hoist.position.y = -baseScale * 0.15;
  craneGroup.add(hoist);

  // 4 Downward Warm Industrial Work Floodlights
  const floodlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  [-baseScale * 0.15, baseScale * 0.15].forEach((fx) => {
    [-baseScale * 0.15, baseScale * 0.15].forEach((fz) => {
      const lamp = new THREE.Mesh(new THREE.CylinderGeometry(baseScale * 0.04, baseScale * 0.06, baseScale * 0.08, 8), floodlightMat);
      lamp.position.set(fx, -baseScale * 0.3, fz);
      craneGroup.add(lamp);
    });
  });

  craneGroup.position.set(0, bayFloorY + archH - baseScale * 0.16, -baseScale * 0.35);
  interiorBayGroup.add(craneGroup);

  // 5. Giant Atmospheric Force-Field Bay Doors (Outer Portal framing space)
  const doorPortalZ = bayLength * 0.49;
  const portalTop = new THREE.Mesh(new THREE.BoxGeometry(bayWidth * 0.9, baseScale * 0.25, baseScale * 0.25), darkPlatingMat);
  portalTop.position.set(0, bayFloorY + bayHeight, doorPortalZ);
  interiorBayGroup.add(portalTop);

  const forcefieldMesh = new THREE.Mesh(new THREE.PlaneGeometry(bayWidth * 0.82, bayHeight * 0.96), forcefieldCyanMat);
  forcefieldMesh.position.set(0, bayFloorY + bayHeight * 0.5, doorPortalZ - baseScale * 0.02);
  interiorBayGroup.add(forcefieldMesh);
  forcefieldDoors.push(forcefieldMesh);

  // 6. Autonomous 3D Repair Drone Swarm (4 Industrial Service Drones in Bay Wall Alcoves)
  const repairDrones: RepairDrone[] = [];
  const droneAlcovePositions = [
    new THREE.Vector3(-halfW * 0.82, bayFloorY + archH * 0.65, -bayLength * 0.28),
    new THREE.Vector3(halfW * 0.82, bayFloorY + archH * 0.65, -bayLength * 0.28),
    new THREE.Vector3(-halfW * 0.82, bayFloorY + archH * 0.55, bayLength * 0.15),
    new THREE.Vector3(halfW * 0.82, bayFloorY + archH * 0.55, bayLength * 0.15),
  ];

  droneAlcovePositions.forEach((alcove) => {
    const drone = buildRepairDrone(interiorBayGroup, baseScale, alcove);
    repairDrones.push(drone);
  });

  // 7. High-Pressure Reactor Coolant Vapor Emitter (Venting plume into space)
  const coolantParticleCount = 80;
  const coolantPos = new Float32Array(coolantParticleCount * 3);
  const coolantVelocities = new Float32Array(coolantParticleCount * 3);
  const coolantLifetimes = new Float32Array(coolantParticleCount);

  for (let i = 0; i < coolantParticleCount; i++) {
    coolantPos[i * 3] = 0;
    coolantPos[i * 3 + 1] = bayFloorY - baseScale * 0.2;
    coolantPos[i * 3 + 2] = -baseScale * 0.35;
    coolantVelocities[i * 3] = (Math.random() - 0.5) * 6.0;
    coolantVelocities[i * 3 + 1] = -Math.random() * 5.0 - 2.0;
    coolantVelocities[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
    coolantLifetimes[i] = 1.0;
  }

  const coolantGeo = new THREE.BufferGeometry();
  coolantGeo.setAttribute('position', new THREE.BufferAttribute(coolantPos, 3));
  const coolantMat = new THREE.PointsMaterial({
    color: 0xe0f2fe,
    size: Math.max(0.45, baseScale * 0.04),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const coolantEmitter = new THREE.Points(coolantGeo, coolantMat);
  coolantEmitter.visible = false;
  interiorBayGroup.add(coolantEmitter);

  // --- Spacedock Level of Detail (LOD) ---
  const spacedockLOD = new THREE.LOD();
  const highLodGroup = new THREE.Group();
  highLodGroup.add(exteriorGroup);
  highLodGroup.add(interiorBayGroup);
  spacedockLOD.addLevel(highLodGroup, 0);

  // Streamlined Low-Poly Exterior Silhouette
  const lowLodGroup = new THREE.Group();
  const lowDome = new THREE.Mesh(new THREE.CylinderGeometry(domeRadius * 0.45, domeRadius, baseScale * 0.75, 16), hullMat);
  lowDome.position.y = baseScale * 0.85;
  lowLodGroup.add(lowDome);

  const lowEquator = new THREE.Mesh(new THREE.TorusGeometry(domeRadius * 1.02, baseScale * 0.16, 8, 20), darkPlatingMat);
  lowEquator.rotation.x = Math.PI / 2;
  lowEquator.position.y = baseScale * 0.52;
  lowLodGroup.add(lowEquator);

  const lowStalk = new THREE.Mesh(new THREE.CylinderGeometry(baseScale * 0.42, baseScale * 0.35, baseScale * 3.5, 10), hullMat);
  lowStalk.position.y = -baseScale * 1.8;
  lowLodGroup.add(lowStalk);

  const lowBulb = new THREE.Mesh(new THREE.SphereGeometry(botBulbRadius, 10, 8), hullMat);
  lowBulb.position.y = -baseScale * 4.1;
  lowLodGroup.add(lowBulb);

  spacedockLOD.addLevel(lowLodGroup, 1400);
  root.add(spacedockLOD);

  // Berth point: centered along the illuminated runway inside the bay
  const berthLocalOffset = new THREE.Vector3(0, bayFloorY + 2.2, -baseScale * 0.35);

  activeStarbases.push({
    id,
    root,
    lod: spacedockLOD,
    rotatingParts,
    beacons,
    forcefieldDoors,
    berthLocalOffset,
    dockingClamps,
    craneTrolley: craneGroup,
    craneZ: -baseScale * 0.35,
    craneSpeed: 1.2,
    repairDrones,
    dronesActive: false,
    dronesCount: 2,
    coolantEmitter,
    coolantGeo,
    coolantVelocities,
    coolantLifetimes,
    coolantActive: false,
    coolantTimer: 0,
    workBees,
  });

  return { root };
}

/**
 * Builds a Starfleet Orbital Drydock Frame
 */
export function buildStarfleetOrbitalDrydock(
  id: string,
  position: [number, number, number],
  scaleRadius: number
): { root: THREE.Group } {
  const root = new THREE.Group();
  root.position.set(...position);

  const baseScale = scaleRadius * 0.9;
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.8,
    roughness: 0.35,
  });
  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.9,
    roughness: 0.3,
  });
  const beaconYellow = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const beaconRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  const beacons: THREE.Mesh[] = [];

  const gantryLength = baseScale * 4.5;
  const gantryRadius = baseScale * 0.05;
  const gantryDistance = baseScale * 1.5;

  const positions: [number, number][] = [
    [gantryDistance, gantryDistance * 0.6],
    [-gantryDistance, gantryDistance * 0.6],
    [gantryDistance, -gantryDistance * 0.6],
    [-gantryDistance, -gantryDistance * 0.6],
  ];

  positions.forEach(([gx, gy]) => {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(gantryRadius, gantryRadius, gantryLength, 8), frameMat);
    beam.rotation.x = Math.PI / 2;
    beam.position.set(gx, gy, 0);
    root.add(beam);

    const b1 = new THREE.Mesh(new THREE.SphereGeometry(gantryRadius * 2, 8, 8), beaconYellow);
    b1.position.set(gx, gy, gantryLength / 2);
    root.add(b1);
    beacons.push(b1);

    const b2 = new THREE.Mesh(new THREE.SphereGeometry(gantryRadius * 2, 8, 8), beaconRed);
    b2.position.set(gx, gy, -gantryLength / 2);
    root.add(b2);
    beacons.push(b2);
  });

  const ribCount = 7;
  for (let i = 0; i < ribCount; i++) {
    const zOffset = -gantryLength * 0.45 + (i * gantryLength * 0.9) / (ribCount - 1);
    const ribGroup = new THREE.Group();
    ribGroup.position.z = zOffset;

    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(gantryRadius * 0.7, gantryRadius * 0.7, gantryDistance * 2, 6), frameMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.y = gantryDistance * 0.6;
    ribGroup.add(topBar);

    const botBar = new THREE.Mesh(new THREE.CylinderGeometry(gantryRadius * 0.7, gantryRadius * 0.7, gantryDistance * 2, 6), frameMat);
    botBar.rotation.z = Math.PI / 2;
    botBar.position.y = -gantryDistance * 0.6;
    ribGroup.add(botBar);

    const leftTruss = new THREE.Mesh(new THREE.CylinderGeometry(gantryRadius * 0.7, gantryRadius * 0.7, gantryDistance * 1.2, 6), darkMetalMat);
    leftTruss.position.x = -gantryDistance;
    ribGroup.add(leftTruss);

    const rightTruss = new THREE.Mesh(new THREE.CylinderGeometry(gantryRadius * 0.7, gantryRadius * 0.7, gantryDistance * 1.2, 6), darkMetalMat);
    rightTruss.position.x = gantryDistance;
    ribGroup.add(rightTruss);

    root.add(ribGroup);
  }

  activeStarbases.push({
    id,
    root,
    beacons,
  });

  return { root };
}

/**
 * Updates lighting, slow rotational drift, hydraulic clamps, traveling crane,
 * patrolling work-bees, coolant venting plumes, and autonomous repair drone welding swarms!
 */
export function updateAllStarbaseAmbience(
  delta: number,
  time: number,
  _shipPos: THREE.Vector3,
  _isDocked: boolean,
  _isRepairing: boolean,
  dockedStationId: string | null,
  camera?: THREE.Camera
): void {
  const beaconPhase = Math.sin(time * 3);
  const forcefieldPulse = 0.45 + 0.15 * Math.sin(time * 4.5);

  for (const base of activeStarbases) {
    // Skip per-frame animations for starbases in hidden solar systems
    let parentObj: THREE.Object3D | null = base.root;
    let isVisibleInScene = true;
    while (parentObj) {
      if (!parentObj.visible) {
        isVisibleInScene = false;
        break;
      }
      parentObj = parentObj.parent;
    }
    if (!isVisibleInScene) continue;

    if (camera && base.lod) {
      base.lod.update(camera);
    }

    // Gentle station rotation
    if (base.rotatingParts) {
      for (const part of base.rotatingParts) {
        part.rotation.y += delta * 0.02;
      }
    }

    // Flash/pulse warning beacons
    if (base.beacons) {
      const scaleVal = 0.85 + 0.35 * (beaconPhase > 0 ? 1 : 0.2);
      for (const b of base.beacons) {
        b.scale.setScalar(scaleVal);
      }
    }

    // Shimmer atmospheric containment force-field
    if (base.forcefieldDoors) {
      for (const ff of base.forcefieldDoors) {
        (ff.material as THREE.MeshBasicMaterial).opacity = forcefieldPulse;
      }
    }

    // Orbiting Work-Bee utility tugs
    if (base.workBees) {
      for (const wb of base.workBees) {
        wb.angle += delta * wb.speed;
        wb.group.position.set(
          Math.cos(wb.angle) * wb.orbitRadius,
          wb.y + Math.sin(wb.angle * 2) * 0.5,
          Math.sin(wb.angle) * wb.orbitRadius
        );
        wb.group.rotation.y = -wb.angle + Math.PI / 2;
      }
    }

    // Animate Hydraulic Docking Clamps smoothly toward target extension
    if (base.dockingClamps) {
      for (const clamp of base.dockingClamps) {
        if (Math.abs(clamp.currentX - clamp.targetX) > 0.02) {
          clamp.currentX += (clamp.targetX - clamp.currentX) * Math.min(1, delta * 3.5);
          clamp.leftArm.position.x = -clamp.currentX;
          clamp.rightArm.position.x = clamp.currentX;
        }
      }
    }

    // Animate Overhead Traveling Crane Rig
    if (base.craneTrolley && base.craneZ !== undefined && base.craneSpeed !== undefined) {
      base.craneZ += delta * base.craneSpeed;
      if (base.craneZ > 12) {
        base.craneZ = 12;
        base.craneSpeed = -Math.abs(base.craneSpeed);
      } else if (base.craneZ < -16) {
        base.craneZ = -16;
        base.craneSpeed = Math.abs(base.craneSpeed);
      }
      base.craneTrolley.position.z = base.craneZ;
    }

    // Animate High-Pressure Coolant Vapor Plume
    if (base.coolantActive && base.coolantEmitter && base.coolantGeo && base.coolantVelocities && base.coolantLifetimes) {
      base.coolantTimer = (base.coolantTimer || 0) - delta;
      if (base.coolantTimer <= 0) {
        base.coolantActive = false;
        base.coolantEmitter.visible = false;
      } else {
        const posAttr = base.coolantGeo.attributes.position as THREE.BufferAttribute;
        const count = posAttr.count;
        for (let p = 0; p < count; p++) {
          base.coolantLifetimes[p] += delta * 1.8;
          if (base.coolantLifetimes[p] > 1.0) {
            base.coolantLifetimes[p] = 0.0;
            posAttr.setXYZ(p, (Math.random() - 0.5) * 2.0, 0, (Math.random() - 0.5) * 2.0);
          } else {
            const x = posAttr.getX(p) + base.coolantVelocities[p * 3] * delta;
            const y = posAttr.getY(p) + base.coolantVelocities[p * 3 + 1] * delta;
            const z = posAttr.getZ(p) + base.coolantVelocities[p * 3 + 2] * delta;
            posAttr.setXYZ(p, x, y, z);
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // Animate Autonomous 3D Repair Drone Swarms
    if (base.repairDrones && base.id === dockedStationId) {
      const activeCount = base.dronesActive ? (base.dronesCount || 2) : 0;

      base.repairDrones.forEach((drone, idx) => {
        drone.timer += delta;

        // Smooth flight translation towards target position
        const lerpSpeed = Math.min(1, delta * 3.2);
        drone.currentPos.lerp(drone.targetPos, lerpSpeed);
        drone.root.position.copy(drone.currentPos);

        // Turn drone to face ship weld point or flight direction
        if (drone.isWelding && idx < activeCount) {
          drone.root.lookAt(drone.shipOffset);

          // Update Laser Welding Beam endpoints (drone tip -> ship hull weld point)
          const beamPos = drone.beamGeo.attributes.position as THREE.BufferAttribute;
          beamPos.setXYZ(0, drone.currentPos.x, drone.currentPos.y, drone.currentPos.z);
          beamPos.setXYZ(1, drone.shipOffset.x, drone.shipOffset.y, drone.shipOffset.z);
          beamPos.needsUpdate = true;

          // Pulse beam glow
          const beamMat = drone.weldingBeam.material as THREE.LineBasicMaterial;
          beamMat.opacity = 0.75 + 0.25 * Math.sin(time * 30 + idx * 2.5);

          // Position spark emitter at weld impact point
          drone.sparkEmitter.position.copy(drone.shipOffset);

          // Animate welding spark particles
          const sparkPos = drone.sparkGeo.attributes.position as THREE.BufferAttribute;
          const sCount = sparkPos.count;
          for (let s = 0; s < sCount; s++) {
            drone.sparkLifetimes[s] += delta;
            if (drone.sparkLifetimes[s] > drone.sparkMaxLifetimes[s]) {
              drone.sparkLifetimes[s] = 0;
              sparkPos.setXYZ(s, 0, 0, 0);
              drone.sparkVelocities[s * 3] = (Math.random() - 0.5) * 7.0;
              drone.sparkVelocities[s * 3 + 1] = Math.random() * 5.0 + 1.5;
              drone.sparkVelocities[s * 3 + 2] = (Math.random() - 0.5) * 7.0;
            } else {
              const sx = sparkPos.getX(s) + drone.sparkVelocities[s * 3] * delta;
              const sy = sparkPos.getY(s) + drone.sparkVelocities[s * 3 + 1] * delta;
              const sz = sparkPos.getZ(s) + drone.sparkVelocities[s * 3 + 2] * delta;
              sparkPos.setXYZ(s, sx, sy, sz);
            }
          }
          sparkPos.needsUpdate = true;
        } else {
          drone.weldingBeam.visible = false;
          drone.sparkEmitter.visible = false;
        }
      });
    }
  }
}
