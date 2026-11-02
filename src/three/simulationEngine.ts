import * as THREE from 'three';
import {
  CameraViewMode,
  AlertLevel,
  ShipState,
  CelestialTarget,
  ShipSubsystem,
  SolarSystem,
  PlanetData,
  CoursePlot,
  EnemyShipState,
  TacticalLogEvent,
  DefeatStats,
  CollisionSafetyTelemetry,
  StationOperationsState,
  StarfleetMission,
  MissionWaypointTelemetry,
  OfficerProfileRecord,
  BridgeStationId,
} from '../types/simulation';
import {
  STAR_TREK_SOLAR_SYSTEMS,
  calculateSafeCoordinates,
  getAllUniversalCelestialBodies,
} from './solarSystems';
import { buildEnterpriseModel, EnterpriseComponents } from './shipModel';
import { buildSpaceEnvironment, SpaceEnvironment, getSystemStarColor } from './spaceScene';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildBridgeInterior, BridgeInteriorComponents, Bridge3DConsoleAction } from './bridgeInterior';
import { WarZoneCombatManager } from './enemyShips';
import { getObjectDetails } from '../data/celestialObjectDatabase';
import { soundEffects } from '../audio/soundEffects';
import { computerVoice } from '../audio/computerVoice';
import { formatAstronomicalDistance, calculateWarpTransitTelemetry } from '../utils/scaleFormatters';
import { battleThemeManager } from '../audio/battleThemeManager';
import {
  getSpacedockBerthTransform,
  setStationDronesState,
  setStationClampsState,
  triggerStationCoolantPurge,
} from './starbaseModels';
import { NavPathGuide } from './navPathGuide';

export class SimulationEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private enterprise: EnterpriseComponents;
  private bridgeInterior: BridgeInteriorComponents;
  private space: SpaceEnvironment;
  private combatManager: WarZoneCombatManager;
  private navPathGuide: NavPathGuide;

  // Station Operations State (Interactive Spacedock Subsystems)
  private stationOpsState: StationOperationsState | null = null;

  // Camera State
  private viewMode: CameraViewMode = 'chase';
  private targetCameraPos: THREE.Vector3 = new THREE.Vector3();
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();
  private orbitAngle: { theta: number; phi: number; radius: number } = {
    theta: 0.35,
    phi: 0.35,
    radius: 54,
  };
  private bridgeLookAngle = { yaw: 0, pitch: 0 };
  private smoothedBridgeLookAngle = { yaw: 0, pitch: 0 };
  private activeBridgeStation: BridgeStationId = 'captain';
  private currentBridgeLocalEye: THREE.Vector3 = new THREE.Vector3(0, 1.88, 1.82);
  private currentBridgeLocalLook: THREE.Vector3 = new THREE.Vector3(0, 1.24, -6.5);
  private currentBridgeCameraQuat: THREE.Quaternion = new THREE.Quaternion();
  private isBridgeQuatInitialized: boolean = false;
  private activeDraggingConsoleMesh: THREE.Object3D | null = null;
  private torpedoLockTimer: number = 3.0;
  private phaserThermalHeat: number = 8;
  private lastCompletedScienceTargetId: string | null = null;
  private viewscreenZoom: number = 1;
  private isPointerDown: boolean = false;
  private lastPointerPos = { x: 0, y: 0 };
  private focusedSubsystemKey: string | null = null;
  private screenShakeIntensity: number = 0;

  // Ship Flight Dynamics (Smooth & Stable)
  // Initial spawn position: High orbital approach over Earth in Sol System (safe distance from the Sun)
  private position: THREE.Vector3 = new THREE.Vector3(0, 25, -1120);
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private orientation: THREE.Quaternion = new THREE.Quaternion();
  private forwardVector: THREE.Vector3 = new THREE.Vector3(0, 0, -1);
  private upVector: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  private rightVector: THREE.Vector3 = new THREE.Vector3(1, 0, 0);

  // Rotation rates with stable inertial damping
  private pitchRate: number = 0;
  private yawRate: number = 0;
  private rollRate: number = 0;
  private flightAssist: boolean = true;
  private combatAssist: boolean = true;
  private cameraZoom: number = 1.0; // 0.4 (close) to 2.5 (wide tactical overview)

  // Engine & Warp State
  private throttlePercent: number = 0; // Default Full Stop on load
  private isWarping: boolean = false;
  private warpFactor: number = 4.0;
  private warpChargeProgress: number = 0;

  // Tactical & Health Damage System
  private alertLevel: AlertLevel = 'green';
  private gPressTimer: number | null = null;
  private lastGPressTime: number = 0;
  private shieldsRaised: boolean = false; // Lowered / down by default as requested
  private shieldIntegrity: number = 100;
  private hullIntegrity: number = 100;
  private isDestroyed: boolean = false;
  private defeatStats?: DefeatStats;
  private lastDamageTime: number = 0;
  private isUnderAttack: boolean = false;
  private isFiringPhasers: boolean = false;
  private phaserEnergy: number = 100;
  private torpedoCount: number = 24;
  private torpedoRechargeTimer: number = 0;
  private lastBroadcastTime: number = 0;

  // Target locking system
  private lockedEnemyId: string | null = null;
  private currentSystemId: string = 'sol_system';
  private selectedTargetId: string | null = 'sol_earth';
  private activeCoursePlot: CoursePlot | null = null;
  private autoPilot: boolean = false;
  private lastLoggedShieldBracket: number = 100;

  // Evasive Thrusters Boost System
  private isBoostActive: boolean = false;
  private boostDuration: number = 0;
  private boostCharge: number = 100;

  // Space Station Docking & Starship Repair / Rearm System
  private isDocked: boolean = false;
  private dockedStationId: string | null = null;
  private dockedStationName: string | null = null;
  private canDockAtStation: { id: string; name: string; distance: number; systemName?: string } | null = null;
  private undockCooldown: number = 0;

  // Black Hole Gravitational Pull & White Hole Ejection State
  private blackHoleTransit: {
    active: boolean;
    phase: 'pulling' | 'infall' | 'singularity' | 'ejection';
    progress: number;
    distance: number;
  } | null = null;
  private blackHoleTransitTimer: number = 0;
  private blackHoleEjectedApplied: boolean = false;
  private blackHoleWarningLogged: boolean = false;

  // Starfleet Missions & Science Exhibition System State
  private activeMission: StarfleetMission | null = null;
  private missionWaypoint: MissionWaypointTelemetry | null = null;
  private activeOfficerCode: string | null = null;
  private missionShieldHarmonicEfficiency: number = 0; // 0 to 100% reflection bonus
  private defendedPlanetIntegrity: number = 100;
  private missionDefenseWaveActive: boolean = false;
  private missionVfxGroup: THREE.Group;
  private deflectorBeamGroup: THREE.Group;
  private deflectorBeamTimer: number = 0;
  private deflectorBeamTarget: THREE.Vector3 = new THREE.Vector3();

  // Keyboard input states
  private keysPressed: { [key: string]: boolean } = {};

  // Interactive 3D Raycasting & Pointer Selection
  private raycaster = new THREE.Raycaster();
  private pointerDownPos = { x: 0, y: 0 };

  // Animation frame request ID
  private animFrameId: number | null = null;
  private onStateChangeCallback?: (state: ShipState) => void;
  private onLogEventCallback?: (event: TacticalLogEvent) => void;
  private onToggleLogConsoleCallback?: () => void;

  // Cinematic Lighting & Contrast Rig (Matching Shivam180709/Enterprise-Model)
  private shipKeyStar: THREE.DirectionalLight;
  private shipRimLight: THREE.DirectionalLight;
  private shipHemiLight: THREE.HemisphereLight;
  private shipUnderWarm: THREE.DirectionalLight;
  private currentExposure: number = 0.80;
  private currentLightIntensity: number = 0.75;
  private currentAmbientFill: number = 0.12;
  private shiftKeyDownTime: number = 0;

  constructor(
    container: HTMLDivElement,
    onStateChange?: (state: ShipState) => void,
    onLogEvent?: (event: TacticalLogEvent) => void,
    onToggleLogConsole?: () => void
  ) {
    this.container = container;
    this.onStateChangeCallback = onStateChange;
    this.onLogEventCallback = onLogEvent;
    this.onToggleLogConsoleCallback = onToggleLogConsole;

    // 1. Scene & Renderer setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020617);

    const width = Math.max(container.clientWidth || window.innerWidth || 800, 320);
    const height = Math.max(container.clientHeight || window.innerHeight || 600, 240);

    this.camera = new THREE.PerspectiveCamera(54, width / height, 0.8, 52000);
    this.camera.position.set(0, 12, 38);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.80;
    this.container.appendChild(this.renderer.domElement);

    // RoomEnvironment for Subtle Metallic Reflections (calibrated low so it never floods the ship)
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      const roomEnv = new RoomEnvironment();
      this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
      if ('environmentIntensity' in this.scene) {
        (this.scene as any).environmentIntensity = 0.06;
      }
      pmremGenerator.dispose();
      roomEnv.dispose();
    } catch {
      // Fallback
    }

    // Balanced Cinematic Star Lighting Rig (calibrated for deep space contrast)
    this.shipKeyStar = new THREE.DirectionalLight(0xfffbf2, 0.75);
    this.shipKeyStar.position.set(38, 44, -28);
    this.scene.add(this.shipKeyStar);

    this.shipRimLight = new THREE.DirectionalLight(0x4488ff, 0.28);
    this.shipRimLight.position.set(-42, 18, 32);
    this.scene.add(this.shipRimLight);

    this.shipHemiLight = new THREE.HemisphereLight(0x182436, 0x020406, 0.12);
    this.scene.add(this.shipHemiLight);

    this.shipUnderWarm = new THREE.DirectionalLight(0xff8833, 0.08);
    this.shipUnderWarm.position.set(0, -32, -12);
    this.scene.add(this.shipUnderWarm);

    this.clock = new THREE.Clock();

    // 2. Initialize 3D Enterprise, Bridge Interior, Space & Combat Fleet
    this.enterprise = buildEnterpriseModel();
    this.scene.add(this.enterprise.root);

    this.bridgeInterior = buildBridgeInterior();
    this.scene.add(this.bridgeInterior.root);
    this.bridgeInterior.root.visible = false;

    this.space = buildSpaceEnvironment(this.scene);
    this.navPathGuide = new NavPathGuide(this.scene);

    // Initialize 3D Mission Anomaly VFX & Navigational Deflector Particle Beam Groups
    this.missionVfxGroup = new THREE.Group();
    this.missionVfxGroup.visible = false;
    this.scene.add(this.missionVfxGroup);

    this.deflectorBeamGroup = new THREE.Group();
    this.deflectorBeamGroup.visible = false;
    this.scene.add(this.deflectorBeamGroup);

    // War Zone Combat Fleet with War Levels and Single-Faction territory enforcement
    this.combatManager = new WarZoneCombatManager(this.scene, this.space.explosionManager);
    this.combatManager.onLogEvent = (cat, type, msg, det) => {
      this.addLogEvent(cat, type, msg, det);
    };
    // Sol system starts peaceful and secure - no unwanted immediate enemy attacks
    this.combatManager.waveStatus = 'standby';
    this.combatManager.sectorStatusText = 'Sector 001 Earth · Territory Secure';

    // Initial shield visibility - down by default
    (this.enterprise.shieldBubble.material as THREE.MeshStandardMaterial).opacity = 0.0;

    // 3. Attach Event Listeners
    this.bindEvents();

    // Start background sound synced to initial Full Stop (0% throttle)
    soundEffects.startImpulseHum();
    soundEffects.updateImpulseHum(this.throttlePercent, false);
    soundEffects.stopRedAlert();

    // 4. Start Render Loop
    this.animate = this.animate.bind(this);
    this.animFrameId = requestAnimationFrame(this.animate);

    // Initial broadcast
    this.broadcastState();
  }

  private handleBlur = () => {
    this.keysPressed = {};
  };

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);

    this.container.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    this.container.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.gPressTimer !== null) {
      clearTimeout(this.gPressTimer);
      this.gPressTimer = null;
    }
    soundEffects.stopRedAlert();
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.container.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.container.removeEventListener('wheel', this.handleWheel);

    this.combatManager.dispose();
    this.space.explosionManager.dispose();
    this.navPathGuide.dispose();
    this.bridgeInterior.viewscreenRenderTarget.dispose();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const targetEl = e.target as HTMLElement | null;
    const activeEl = document.activeElement as HTMLElement | null;
    if (
      (targetEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetEl.tagName) || targetEl.isContentEditable)) ||
      (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable))
    ) {
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    this.keysPressed[e.key.toLowerCase()] = true;
    this.keysPressed[e.code] = true;

    // Prevent key-repeat from spamming triggers like torpedoes or modal toggles
    if (e.repeat) {
      return;
    }

    // --- WARP DRIVE SHORTCUTS: Ctrl + Alt + 1..9 (Engage Warp) & Ctrl + Alt + R (Drop Warp) ---
    if ((e.ctrlKey || e.metaKey) && e.altKey) {
      // Check 1 through 9 for instant warp factor engage
      const numMatch = e.code.match(/^(?:Digit|Numpad)([1-9])$/);
      const factorNum = numMatch ? parseInt(numMatch[1], 10) : (e.key >= '1' && e.key <= '9' ? parseInt(e.key, 10) : null);
      if (factorNum !== null) {
        e.preventDefault();
        this.engageWarp(factorNum);
        this.addLogEvent(
          'NAVIGATION',
          'info',
          `Warp Drive Engaged: Warp Factor ${factorNum} [Ctrl+Alt+${factorNum}]`,
          `Antimatter intermix set for Factor ${factorNum}. Subspace displacement active.`
        );
        return;
      }

      // Ctrl + Alt + R or Ctrl + Alt + 0: Drop out of warp / disengage
      if (e.code === 'KeyR' || e.key.toLowerCase() === 'r' || e.code === 'Digit0' || e.code === 'Numpad0' || e.key === '0') {
        e.preventDefault();
        this.dropWarp();
        this.addLogEvent(
          'NAVIGATION',
          'info',
          'Warp Drive Disengaged [Ctrl+Alt+R]',
          'Subspace displacement collapsed. Manual helm control restored (W,S,A,D).'
        );
        return;
      }
    }

    if (e.code === 'Space') {
      this.startPhaserFiring();
    } else if (e.code === 'KeyT') {
      this.firePhotonTorpedo();
    } else if (e.code === 'KeyC') {
      this.cycleCameraView();
    } else if (e.code === 'KeyG') {
      this.cycleAlertLevel();
    } else if (
      this.viewMode === 'interior_bridge' &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey &&
      ['1', '2', '3', '4', '5', '6', '7'].includes(e.key)
    ) {
      e.preventDefault();
      if (e.key === '1') {
        this.cycleBridgeStation();
      } else {
        const mapKeyToStation: Record<string, BridgeStationId> = {
          '2': 'helm',
          '3': 'science',
          '4': 'tactical',
          '5': 'comms',
          '6': 'engineering',
          '7': 'overview',
        };
        const st = mapKeyToStation[e.key];
        if (st) this.setBridgeStation(st);
      }
    } else if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      this.zoomIn();
    } else if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      this.zoomOut();
    } else if (e.code === 'Digit0' || e.code === 'Numpad0') {
      this.resetZoom();
    } else if (e.code === 'Tab') {
      e.preventDefault();
      this.targetNextHostile();
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      this.shiftKeyDownTime = performance.now();
      this.triggerEvasiveBoost();
    } else if (e.code === 'KeyZ' || e.key.toLowerCase() === 'z') {
      this.clearSelection();
    } else if (e.code === 'Escape' || e.code === 'Backspace') {
      if (this.isWarping || this.activeCoursePlot) {
        this.dropWarp();
      } else if (this.selectedTargetId || this.lockedEnemyId) {
        this.clearSelection();
      }
    } else if (e.code === 'KeyU') {
      if (this.isDocked) {
        this.undockFromStation();
      } else {
        this.dockAtStation();
      }
    } else if (e.code === 'KeyL') {
      this.onToggleLogConsoleCallback?.();
    } else if (e.code === 'KeyR' && e.shiftKey) {
      this.setAlertLevel(this.alertLevel === 'red' ? 'green' : 'red');
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.key.toLowerCase()] = false;
    this.keysPressed[e.code] = false;

    const targetEl = e.target as HTMLElement | null;
    if (targetEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetEl.tagName) || targetEl.isContentEditable)) {
      return;
    }

    if (e.code === 'Space') {
      this.stopPhaserFiring();
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      const holdTime = performance.now() - this.shiftKeyDownTime;
      if (holdTime > 200 && this.isBoostActive) {
        this.stopEvasiveBoost();
      }
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.activeDraggingConsoleMesh = null;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
    this.pointerDownPos = { x: e.clientX, y: e.clientY };

    // Raycast against all interactive 3D Bridge Consoles & Armrests when inside Bridge Interior mode
    if (this.viewMode === 'interior_bridge' && this.renderer?.domElement && this.camera) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      this.raycaster.setFromCamera(mouse, this.camera);
      const consoleHits = this.raycaster.intersectObjects(this.bridgeInterior.interactiveConsoleMeshes, false);
      if (consoleHits.length > 0 && consoleHits[0].uv) {
        const hit = consoleHits[0];
        const resolved = this.bridgeInterior.resolveConsoleHit(hit.object, hit.uv!.x, hit.uv!.y);
        if (resolved) {
          this.activeDraggingConsoleMesh = hit.object;
          this.executeBridge3DConsoleAction(resolved.action, false);
        }
      }
    }
  };

  private lastHoverRaycastMs = 0;

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) {
      // Hover highlight for all 3D Console controls & 3D Bridge Stations when inside Bridge Interior mode
      if (this.viewMode === 'interior_bridge' && this.renderer?.domElement && this.camera) {
        const now = performance.now();
        if (now - this.lastHoverRaycastMs < 32) return;
        this.lastHoverRaycastMs = now;

        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        this.raycaster.setFromCamera(mouse, this.camera);

        // 1. Check all interactive 3D console surfaces first
        const consoleHits = this.raycaster.intersectObjects(this.bridgeInterior.interactiveConsoleMeshes, false);
        if (consoleHits.length > 0 && consoleHits[0].uv) {
          const hit = consoleHits[0];
          const resolved = this.bridgeInterior.resolveConsoleHit(hit.object, hit.uv!.x, hit.uv!.y);
          this.bridgeInterior.setHoveredControl(resolved ? resolved.controlId : null);
          if (resolved) {
            this.container.style.cursor = 'pointer';
            return;
          }
        } else {
          this.bridgeInterior.setHoveredControl(null);
        }

        // 2. Check 3D Bridge Station hitboxes
        const hits = this.raycaster.intersectObjects(this.bridgeInterior.interactiveHitboxes, false);
        if (hits.length > 0 && hits[0].object.userData.bridgeStationId) {
          const stId = hits[0].object.userData.bridgeStationId as BridgeStationId;
          this.bridgeInterior.highlightStation(stId);
          this.container.style.cursor = 'pointer';
        } else {
          this.bridgeInterior.highlightStation(null);
          this.container.style.cursor = 'grab';
        }
      }
      return;
    }

    // Continuous dragging on any 3D Console rotary knob, slider, or lever
    if (this.activeDraggingConsoleMesh && this.viewMode === 'interior_bridge' && this.renderer?.domElement && this.camera) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      this.raycaster.setFromCamera(mouse, this.camera);
      const consoleHits = this.raycaster.intersectObject(this.activeDraggingConsoleMesh, false);
      if (consoleHits.length > 0 && consoleHits[0].uv) {
        const resolved = this.bridgeInterior.resolveConsoleHit(
          this.activeDraggingConsoleMesh,
          consoleHits[0].uv.x,
          consoleHits[0].uv.y
        );
        if (resolved) {
          this.executeBridge3DConsoleAction(resolved.action, true);
        }
      }
      return;
    }

    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };

    if (this.viewMode === 'orbit') {
      this.orbitAngle.theta -= dx * 0.008;
      this.orbitAngle.phi = Math.max(0.05, Math.min(Math.PI * 0.95, this.orbitAngle.phi - dy * 0.008));
    } else if (this.viewMode === 'interior_bridge') {
      // Natural 360-degree horizontal pan & full vertical pitch look around the 3D bridge (including up to the roof dome)
      this.bridgeLookAngle.yaw += dx * 0.0045;
      this.bridgeLookAngle.pitch = Math.max(-1.45, Math.min(1.45, this.bridgeLookAngle.pitch + dy * 0.0045));
    } else {
      // Stable steering with damped sensitivity
      this.yawRate = THREE.MathUtils.clamp(this.yawRate - dx * 0.00018, -0.6, 0.6);
      this.pitchRate = THREE.MathUtils.clamp(this.pitchRate - dy * 0.00018, -0.6, 0.6);
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    const wasDraggingConsole = this.activeDraggingConsoleMesh !== null;
    this.isPointerDown = false;
    this.activeDraggingConsoleMesh = null;
    if (wasDraggingConsole) return;

    const dragDistance = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    if (dragDistance < 6) {
      this.handleRaycastClick(e.clientX, e.clientY);
    }
  };

  // Interactive 3D Object Selection via Mouse Click
  private handleRaycastClick(clientX: number, clientY: number) {
    if (!this.renderer?.domElement || !this.camera) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, this.camera);

    // 0. If inside 3D Bridge Interior, check if user clicked a 3D Bridge Station or Senior Officer
    if (this.viewMode === 'interior_bridge') {
      const stationHits = this.raycaster.intersectObjects(this.bridgeInterior.interactiveHitboxes, false);
      if (stationHits.length > 0 && stationHits[0].object.userData.bridgeStationId) {
        const stationId = stationHits[0].object.userData.bridgeStationId as BridgeStationId;
        this.setBridgeStation(stationId);
        return;
      }
    }

    // 1. Check hostile enemy combat vessels
    const enemyMeshes: THREE.Object3D[] = [];
    const enemyMap = new Map<THREE.Object3D, string>();
    for (const enemy of this.combatManager.enemyShips) {
      if (enemy.isAlive && enemy.mesh) {
        enemyMeshes.push(enemy.mesh);
        enemyMap.set(enemy.mesh, enemy.id);
      }
    }
    if (enemyMeshes.length > 0) {
      const enemyHits = this.raycaster.intersectObjects(enemyMeshes, true);
      if (enemyHits.length > 0) {
        let topHit: THREE.Object3D | null = enemyHits[0].object;
        while (topHit && !enemyMap.has(topHit) && topHit.parent) {
          topHit = topHit.parent;
        }
        if (topHit && enemyMap.has(topHit)) {
          const enemyId = enemyMap.get(topHit)!;
          this.setLockedEnemy(enemyId);
          this.setSelectedTarget(enemyId);
          soundEffects.playLcarsAcknowledge();
          return;
        }
      }
    }

    // 2. Check celestial target meshes (planets, stars, starbases, spacedocks, anomalies) in the visible solar system
    const targetRoots: THREE.Object3D[] = [];
    const rootToId = new Map<THREE.Object3D, string>();
    for (const [id, mesh] of this.space.targetMeshes) {
      if (!mesh.visible || (mesh.parent && !mesh.parent.visible)) continue;
      targetRoots.push(mesh);
      rootToId.set(mesh, id);
    }

    if (targetRoots.length > 0) {
      const celestialHits = this.raycaster.intersectObjects(targetRoots, true);
      if (celestialHits.length > 0) {
        let topObj: THREE.Object3D | null = celestialHits[0].object;
        while (topObj && !rootToId.has(topObj) && topObj.parent) {
          topObj = topObj.parent;
        }
        if (topObj && rootToId.has(topObj)) {
          const targetId = rootToId.get(topObj)!;
          this.setSelectedTarget(targetId);
          soundEffects.playLcarsAcknowledge();
          return;
        }
      }
    }
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (this.viewMode === 'orbit') {
      this.orbitAngle.radius = Math.max(14, Math.min(240, this.orbitAngle.radius + e.deltaY * 0.08));
    } else {
      // Smooth POV Camera Zoom In / Zoom Out
      const zoomStep = Math.sign(e.deltaY) * 0.08;
      this.setCameraZoom(this.cameraZoom + zoomStep);
    }
  };

  // --- Flight & Engine Logic ---
  public setThrottle(percent: number) {
    this.throttlePercent = Math.max(0, Math.min(100, percent));
    soundEffects.updateImpulseHum(this.throttlePercent, this.isWarping);
    soundEffects.playLcarsBeep(720, 0.04);
    this.broadcastState();
  }

  public calculateAccurateEta(dist: number, warpFactor: number, _currentSpeed?: number): number {
    if (dist <= 150) return 0;
    const telemetry = calculateWarpTransitTelemetry(dist, warpFactor);
    return telemetry.seconds;
  }

  public setWarpFactor(factor: number) {
    this.warpFactor = Math.max(1.0, Math.min(9.9, Math.round(factor * 10) / 10));
    soundEffects.playLcarsBeep(880, 0.05);

    // If active course navigation is engaged, immediately update remaining distance and recalculate ETA accurately
    if (this.activeCoursePlot && this.activeCoursePlot.isEngaged) {
      const dest = new THREE.Vector3(...this.activeCoursePlot.destinationPos);
      const dist = this.position.distanceTo(dest);
      this.activeCoursePlot.distance = Math.round(dist);
      this.activeCoursePlot.etaSeconds = this.calculateAccurateEta(dist, this.warpFactor, this.velocity.length());
      computerVoice.onWarpFactorChanged(this.warpFactor, this.activeCoursePlot.etaSeconds);
    } else {
      computerVoice.onWarpFactorChanged(this.warpFactor);
    }

    this.broadcastState(true);
  }

  public toggleWarp() {
    if (this.isWarping || this.activeCoursePlot) {
      this.dropWarp();
    } else {
      this.engageWarp();
    }
  }

  public engageWarp(factor?: number) {
    if (factor !== undefined) {
      this.warpFactor = Math.max(1.0, Math.min(9.9, Math.round(factor * 10) / 10));
    }
    if (!this.isWarping) {
      this.isWarping = true;
      soundEffects.playWarpEngage();
      this.warpChargeProgress = 0;
      this.space.warpEffect?.triggerWarpEngagementFlash();
      soundEffects.updateImpulseHum(this.throttlePercent, this.isWarping);
      computerVoice.onWarpEngaged(this.warpFactor);
      this.broadcastState(true);
    } else if (factor !== undefined) {
      this.broadcastState();
    }
  }

  public dropWarp() {
    this.isWarping = false;
    this.warpChargeProgress = 0;
    if (this.activeCoursePlot) {
      this.activeCoursePlot.isEngaged = false;
      this.activeCoursePlot = null;
    }
    this.autoPilot = false;
    // Ensure impulse throttle is immediately active for manual flight (W,S,A,D)
    if (this.throttlePercent <= 5) {
      this.throttlePercent = 25;
    }
    // Flush key state so modifier keys don't leave controls stuck
    this.keysPressed = {};
    soundEffects.playLcarsAcknowledge();
    this.space.warpEffect?.triggerWarpExitFlash();
    soundEffects.updateImpulseHum(this.throttlePercent, false);
    computerVoice.onWarpDropped();
    this.broadcastState(true);
  }

  public getIsWarping(): boolean {
    return this.isWarping;
  }

  public setAlertLevel(level: AlertLevel) {
    if (this.alertLevel === level) {
      if (level === 'red') {
        soundEffects.startRedAlert();
      } else {
        soundEffects.stopRedAlert();
      }
      return;
    }
    this.alertLevel = level;
    computerVoice.onAlertStatusShift(level);
    if (level === 'red') {
      soundEffects.startRedAlert();
      // Silently engage shield bubble without triggering conflicting voice announcement
      this.shieldsRaised = true;
      const shieldMat = this.enterprise.shieldBubble.material as THREE.MeshStandardMaterial;
      if (shieldMat) shieldMat.opacity = 0.32;
    } else {
      soundEffects.stopRedAlert();
      soundEffects.playLcarsAcknowledge();
    }
    this.broadcastState();
  }

  // G key or UI alert toggle: Single click -> Yellow Alert, Double click -> Red Alert
  public handleGAlertAction() {
    const now = performance.now();
    const timeSinceLast = now - this.lastGPressTime;

    if (this.lastGPressTime > 0 && timeSinceLast < 350) {
      // Double click confirmed!
      if (this.gPressTimer !== null) {
        clearTimeout(this.gPressTimer);
        this.gPressTimer = null;
      }
      this.lastGPressTime = 0;
      this.setAlertLevel('red');
      this.addLogEvent(
        'DEFENSE',
        'critical',
        'Condition RED Engaged [Double-Tap G]',
        'Battle stations! Multiphasic shields raised, tactical weapons systems hot.'
      );
    } else {
      // First click: wait 280ms to check if a second click arrives
      this.lastGPressTime = now;
      if (this.gPressTimer !== null) {
        clearTimeout(this.gPressTimer);
      }
      this.gPressTimer = window.setTimeout(() => {
        this.gPressTimer = null;
        // Single click confirmed:
        // Switch to Yellow Alert (or stand down to Green if already in Yellow or Red)
        if (this.alertLevel === 'yellow') {
          this.setAlertLevel('green');
          this.addLogEvent(
            'DEFENSE',
            'info',
            'Condition GREEN Restored [Single-Tap G]',
            'Stand down to standard cruising posture.'
          );
        } else if (this.alertLevel === 'red') {
          this.setAlertLevel('green');
          this.addLogEvent(
            'DEFENSE',
            'info',
            'Condition GREEN Restored [Single-Tap G]',
            'Battle stations cleared. Starship returned to Condition Green.'
          );
        } else {
          this.setAlertLevel('yellow');
          this.addLogEvent(
            'DEFENSE',
            'warning',
            'Condition YELLOW Engaged [Single-Tap G]',
            'Yellow Alert active. Defensive grid and warp core on standby.'
          );
        }
      }, 280);
    }
  }

  public cycleAlertLevel() {
    this.handleGAlertAction();
  }

  // Camera POV Zoom In / Zoom Out methods
  public setCameraZoom(zoom: number) {
    this.cameraZoom = THREE.MathUtils.clamp(zoom, 0.4, 2.5);
    this.broadcastState();
  }

  public zoomIn(amount: number = 0.15) {
    this.setCameraZoom(this.cameraZoom - amount);
  }

  public zoomOut(amount: number = 0.15) {
    this.setCameraZoom(this.cameraZoom + amount);
  }

  public resetZoom() {
    this.setCameraZoom(1.0);
  }

  public getCameraZoom(): number {
    return this.cameraZoom;
  }

  public setShields(raised: boolean) {
    this.shieldsRaised = raised;
    soundEffects.playShieldToggle(raised);
    computerVoice.onShieldsToggled(raised);
    const shieldMat = this.enterprise.shieldBubble.material as THREE.MeshStandardMaterial;
    shieldMat.opacity = raised ? 0.32 : 0.0;
    this.broadcastState();
  }

  public setCameraView(mode: CameraViewMode) {
    this.viewMode = mode;
    this.focusedSubsystemKey = null;

    if (mode === 'interior_bridge') {
      this.bridgeInterior.root.visible = true;
      this.enterprise.root.visible = false;
      this.bridgeInterior.setActiveStation(this.activeBridgeStation);
      this.bridgeLookAngle = { yaw: 0, pitch: 0 };
      this.smoothedBridgeLookAngle = { yaw: 0, pitch: 0 };
      const preset =
        this.bridgeInterior.stationPresets[this.activeBridgeStation] ||
        this.bridgeInterior.stationPresets.captain;
      this.currentBridgeLocalEye.copy(preset.eyePos);
      this.currentBridgeLocalLook.copy(preset.lookTarget);
    } else {
      this.bridgeInterior.root.visible = false;
      this.enterprise.root.visible = true;
      this.camera.up.set(0, 1, 0);
    }

    soundEffects.playLcarsBeep(980, 0.04);
    this.broadcastState(true);
  }

  public setBridgeStation(stationId: BridgeStationId) {
    if (this.viewMode !== 'interior_bridge') {
      this.viewMode = 'interior_bridge';
      this.bridgeInterior.root.visible = true;
      this.enterprise.root.visible = false;
    }
    this.activeBridgeStation = stationId;
    this.bridgeInterior.setActiveStation(stationId);
    this.bridgeLookAngle = { yaw: 0, pitch: 0 };
    this.smoothedBridgeLookAngle = { yaw: 0, pitch: 0 };
    soundEffects.playLcarsAcknowledge();
    const preset = this.bridgeInterior.stationPresets[stationId];
    if (preset) {
      this.addLogEvent(
        'NAVIGATION',
        'info',
        `Bridge Station Transfer: ${preset.label} [Key 1]`,
        `First-person POV transferred to ${preset.officerName} (${preset.officerTitle}).`
      );
    }
    this.broadcastState(true);
  }

  public cycleBridgeStation() {
    const stationOrder: BridgeStationId[] = [
      'captain',
      'helm',
      'science',
      'tactical',
      'comms',
      'engineering',
      'overview',
    ];
    if (this.viewMode !== 'interior_bridge') {
      this.setBridgeStation(this.activeBridgeStation || 'captain');
      return;
    }
    const idx = stationOrder.indexOf(this.activeBridgeStation);
    const nextStation = stationOrder[(idx + 1) % stationOrder.length];
    this.setBridgeStation(nextStation);
  }

  public getBridgeStation(): BridgeStationId {
    return this.activeBridgeStation;
  }

  public setViewscreenZoom(zoom: number) {
    this.viewscreenZoom = Math.max(1, Math.min(4, zoom));
    this.bridgeInterior.setViewscreenZoom(this.viewscreenZoom);
    soundEffects.playLcarsBeep(940, 0.04);
    this.broadcastState(true);
  }

  private executeBridge3DConsoleAction(action: Bridge3DConsoleAction, isDrag: boolean) {
    const hw = this.bridgeInterior.getHardwareState();
    const currentHdg = ((Math.atan2(this.forwardVector.x, -this.forwardVector.z) * 180) / Math.PI + 360) % 360;
    const currentPitch = Math.asin(THREE.MathUtils.clamp(this.forwardVector.y, -1, 1)) * (180 / Math.PI);

    switch (action.type) {
      case 'switch_station': {
        if (!isDrag) this.setBridgeStation(action.stationId);
        break;
      }

      // 1. CAPTAIN LEFT ARMREST: Linked 100-Unit Master Power Pool & Alerts
      case 'power_pool': {
        const targetVal = Math.max(10, Math.min(80, action.value));
        const remainder = 100 - targetVal;
        let pEng = hw.powerEngines;
        let pShd = hw.powerShields;
        let pWpn = hw.powerWeapons;

        if (action.channel === 'engines') {
          pEng = targetVal;
          const sumOther = Math.max(1, pShd + pWpn);
          pShd = Math.round((pShd / sumOther) * remainder);
          pWpn = 100 - pEng - pShd;
        } else if (action.channel === 'shields') {
          pShd = targetVal;
          const sumOther = Math.max(1, pEng + pWpn);
          pEng = Math.round((pEng / sumOther) * remainder);
          pWpn = 100 - pShd - pEng;
        } else {
          pWpn = targetVal;
          const sumOther = Math.max(1, pEng + pShd);
          pEng = Math.round((pEng / sumOther) * remainder);
          pShd = 100 - pWpn - pEng;
        }

        this.bridgeInterior.setHardwareTelemetry({
          powerEngines: pEng,
          powerShields: pShd,
          powerWeapons: pWpn,
          lastCommandFeedback: `POWER POOL REBALANCED: ENG ${pEng}% · SHD ${pShd}% · WPN ${pWpn}%`,
        });
        if (!isDrag) soundEffects.playLcarsBeep(760, 0.03);
        break;
      }

      case 'set_alert': {
        if (!isDrag) {
          this.setAlertLevel(action.level);
          this.bridgeInterior.setHardwareTelemetry({
            alertLevel: action.level,
            lastCommandFeedback: `ALERT CONDITION SET TO ${action.level.toUpperCase()}`,
          });
        }
        break;
      }

      // 2. CAPTAIN RIGHT ARMREST: Crew Advisory [Take Manual Control] & [Order Officer to Execute]
      case 'request_officer_report': {
        if (isDrag) return;
        soundEffects.playLcarsBeep(860, 0.04);
        const st = action.stationId;
        if (st === 'helm') {
          this.bridgeInterior.setHardwareTelemetry({
            advisoryStation: 'helm',
            advisoryOfficer: 'LT. HIKARU SULU (HELM)',
            advisoryTitle: `HELM & ALCUBIERRE WARP BUBBLE // ${hw.targetName}`,
            advisoryQuote: `"Captain, Alcubierre contraction/expansion dials are ready on my 3D console, and orbital velocity bracket is calibrated for ${hw.targetName}."`,
            advisoryUrgency: 'routine',
            lastCommandFeedback: 'SULU REPORTING: READY FOR MANUAL OR AI HELM EXECUTION',
          });
        } else if (st === 'science') {
          this.bridgeInterior.setHardwareTelemetry({
            advisoryStation: 'science',
            advisoryOfficer: 'CMDR. SPOCK (SCIENCE)',
            advisoryTitle: `SPECTROSCOPIC WAVE SCAN // ${hw.targetName}`,
            advisoryQuote: `"Captain, target emission signature is at λ=${hw.targetWavelengthNm}nm, Amplitude ${hw.targetAmplitudePct}%. Align the 3D Science knobs or order me to run the sweep."`,
            advisoryUrgency: 'priority',
            lastCommandFeedback: 'SPOCK REPORTING: SPECTROMETER READY',
          });
        } else if (st === 'tactical') {
          this.bridgeInterior.setHardwareTelemetry({
            advisoryStation: 'tactical',
            advisoryOfficer: 'ENSIGN CHEKOV (TACTICAL)',
            advisoryTitle:
              hw.aliveHostilesCount > 0
                ? `HOSTILE INTERCEPT (${hw.aliveHostilesCount} WARSHIPS)`
                : '4-QUADRANT SHIELDS & ORDNANCE',
            advisoryQuote: `"Captain! Optimal shield harmonic is ${hw.optimalShieldFreqMhz.toFixed(1)} MHz. We can target enemy ${hw.enemySubsystemTarget.toUpperCase()} or rebalance our 4 shield quadrants!"`,
            advisoryUrgency: hw.aliveHostilesCount > 0 ? 'critical' : 'priority',
            lastCommandFeedback: 'CHEKOV REPORTING: TACTICAL CONSOLE STANDING BY',
          });
        } else if (st === 'comms') {
          this.bridgeInterior.setHardwareTelemetry({
            advisoryStation: 'comms',
            advisoryOfficer: 'LT. NYOTA UHURA (COMMS)',
            advisoryTitle: `SUBSPACE CARRIER ${hw.targetCarrierFreqMhz.toFixed(1)} MHz`,
            advisoryQuote: `"Captain, incoming subspace transmission on ${hw.targetCarrierFreqMhz.toFixed(1)} MHz. Ensure Tactical weapons are disarmed before hailing to preserve Diplomatic Trust!"`,
            advisoryUrgency: 'routine',
            lastCommandFeedback: 'UHURA REPORTING: TRANSLATOR MATRIX ONLINE',
          });
        }
        break;
      }

      case 'advisory_manual': {
        if (isDrag) return;
        soundEffects.playLcarsAcknowledge();
        const targetStation = hw.advisoryStation || 'helm';
        this.setBridgeStation(targetStation);
        this.combatManager.adaptiveTracker.addXp(75, (cat, type, msg, det) =>
          this.addLogEvent(cat, type, msg, det)
        );
        this.bridgeInterior.setHardwareTelemetry({
          lastCommandFeedback: `MANUAL CONTROL ENGAGED AT ${targetStation.toUpperCase()} (100% EFF + 75 XP)`,
        });
        this.addLogEvent(
          'NAVIGATION',
          'success',
          `Captain Assumed Manual Control of ${targetStation.toUpperCase()} (+75 XP)`,
          '100% station efficiency unlocked via direct 3D console operation.'
        );
        break;
      }

      case 'advisory_delegate': {
        if (isDrag) return;
        soundEffects.playLcarsAcknowledge();
        const st = hw.advisoryStation;
        if (st === 'helm') {
          const optC = hw.optimalContraction;
          const optE = hw.optimalExpansion;
          this.setThrottle(42);
          this.bridgeInterior.setHardwareTelemetry({
            alcubierreContraction: optC,
            alcubierreExpansion: optE,
            orbitalVelocityLocked: true,
            lastCommandFeedback: 'SULU EXECUTED ORBITAL & WARP BUBBLE LOCK (75% EFF)',
          });
          computerVoice.testVoice('Aye Captain! Alcubierre warp bubble balanced and standard orbital velocity locked.');
        } else if (st === 'science') {
          this.bridgeInterior.setHardwareTelemetry({
            wavelengthNm: hw.targetWavelengthNm,
            amplitudePct: hw.targetAmplitudePct,
            scienceWaveMatchPct: 95,
            scienceScanComplete: true,
            lastCommandFeedback: 'SPOCK COMPLETED SPECTROSCOPIC SWEEP (75% EFF + 60 XP)',
          });
          this.fireDeflectorParticleBeam(undefined, 0x38bdf8, 2.8);
          this.combatManager.adaptiveTracker.addXp(60, (cat, type, msg, det) =>
            this.addLogEvent(cat, type, msg, det)
          );
          computerVoice.testVoice('Spectroscopic wave alignment complete, Captain. Science Exhibition card updated.');
        } else if (st === 'tactical') {
          this.setShields(true);
          this.setMissionShieldHarmonics(75);
          this.bridgeInterior.setHardwareTelemetry({
            shieldFreqMhz: hw.optimalShieldFreqMhz,
            shieldsRaised: true,
            lastCommandFeedback: 'CHEKOV MODULATED SHIELDS & FIRED SALVO (75% EFF)',
          });
          if (this.combatManager.enemyShips.some((e) => e.isAlive)) {
            if (!this.lockedEnemyId) this.targetNextHostile();
            this.firePhotonTorpedo();
          }
          computerVoice.testVoice('Aye Captain! Multiphasic shields tuned to optimal frequency.');
        } else if (st === 'comms') {
          const trustDelta = hw.weaponsArmed ? -40 : 18;
          const nextTrust = Math.max(0, Math.min(100, hw.diplomaticTrustPct + trustDelta));
          this.bridgeInterior.setHardwareTelemetry({
            carrierFreqMhz: hw.targetCarrierFreqMhz,
            bandpassFilterPct: hw.targetBandpassPct,
            signalClarityPct: 96,
            diplomaticTrustPct: nextTrust,
            lastCommandFeedback: `UHURA HAILED TARGET (75% EFF · TRUST ${nextTrust}%)`,
          });
          computerVoice.testVoice('Subspace carrier locked and Universal Translator matrix active, Captain.');
        }
        break;
      }

      // 3. LT. SULU'S 3D HELM & NAVIGATION CONSOLE
      case 'heading': {
        this.setShipHeadingAndPitch(action.headingDeg, currentPitch);
        if (!isDrag) soundEffects.playLcarsBeep(780, 0.03);
        break;
      }
      case 'pitch': {
        this.setShipHeadingAndPitch(currentHdg, action.pitchDeg);
        if (!isDrag) soundEffects.playLcarsBeep(820, 0.03);
        break;
      }
      case 'level_horizon': {
        if (!isDrag) {
          this.setShipHeadingAndPitch(currentHdg, 0);
          soundEffects.playLcarsAcknowledge();
        }
        break;
      }
      case 'throttle': {
        if (!isDrag) {
          if (this.isWarping) this.dropWarp();
          this.setThrottle(action.percent);
          const inGreenBracket = action.percent >= 30 && action.percent <= 55;
          this.bridgeInterior.setHardwareTelemetry({
            orbitalVelocityLocked: inGreenBracket,
          });
        }
        break;
      }
      case 'toggle_inertial_dampeners': {
        if (!isDrag) {
          this.flightAssist = !this.flightAssist;
          soundEffects.playLcarsAcknowledge();
          this.bridgeInterior.setHardwareTelemetry({
            inertialDampeners: this.flightAssist,
          });
          this.addLogEvent(
            'NAVIGATION',
            'info',
            this.flightAssist
              ? 'Inertial Dampeners Online [3D Helm Switch]'
              : 'Inertial Dampeners Decoupled — Newtonian Drift Active'
          );
          this.broadcastState(true);
        }
        break;
      }
      case 'alcubierre_contraction': {
        this.bridgeInterior.setHardwareTelemetry({
          alcubierreContraction: action.percent,
        });
        if (!isDrag) soundEffects.playLcarsBeep(740, 0.02);
        break;
      }
      case 'alcubierre_expansion': {
        this.bridgeInterior.setHardwareTelemetry({
          alcubierreExpansion: action.percent,
        });
        if (!isDrag) soundEffects.playLcarsBeep(800, 0.02);
        break;
      }
      case 'lock_orbital_velocity': {
        if (!isDrag) {
          if (this.isWarping) this.dropWarp();
          this.setThrottle(42); // Right inside the 30%..55% Green Orbital Bracket!
          this.bridgeInterior.setHardwareTelemetry({
            throttlePercent: 42,
            orbitalVelocityLocked: true,
          });
          soundEffects.playLcarsAcknowledge();
          computerVoice.onOrbitalEntry(hw.targetName);
          this.addLogEvent(
            'NAVIGATION',
            'success',
            `Standard Orbital Velocity Locked around ${hw.targetName}`,
            'Impulse velocity matched to green orbital bracket (v = √(GM/r)). Centripetal trajectory stabilized.'
          );
        }
        break;
      }
      case 'warp_factor': {
        this.setWarpFactor(action.factor);
        const opt = Math.round(45 + action.factor * 5);
        this.bridgeInterior.setHardwareTelemetry({
          optimalContraction: opt,
          optimalExpansion: opt,
        });
        break;
      }
      case 'toggle_warp': {
        if (!isDrag) {
          this.toggleWarp();
        }
        break;
      }
      case 'trigger_boost': {
        if (!isDrag) {
          this.triggerEvasiveBoost();
        }
        break;
      }

      // 4. CMDR. SPOCK'S 3D SCIENCE CONSOLE & UPPER MONITOR
      case 'science_wavelength': {
        this.bridgeInterior.setHardwareTelemetry({
          wavelengthNm: action.wavelengthNm,
        });
        this.checkScienceWaveCompletion(action.wavelengthNm, hw.amplitudePct, isDrag);
        break;
      }
      case 'science_amplitude': {
        this.bridgeInterior.setHardwareTelemetry({
          amplitudePct: action.amplitudePct,
        });
        this.checkScienceWaveCompletion(hw.wavelengthNm, action.amplitudePct, isDrag);
        break;
      }
      case 'science_deflector_slider': {
        this.bridgeInterior.setHardwareTelemetry({
          deflectorParticlePct: action.particlePct,
        });
        if (!isDrag) soundEffects.playLcarsBeep(780, 0.03);
        break;
      }
      case 'science_fire_deflector': {
        if (!isDrag) {
          this.fireDeflectorParticleBeam(undefined, 0x38bdf8, 3.2);
          this.triggerMission3DAction('sensor_pulse');
        }
        break;
      }
      case 'science_auto_align': {
        if (!isDrag) {
          this.bridgeInterior.setHardwareTelemetry({
            wavelengthNm: hw.targetWavelengthNm,
            amplitudePct: hw.targetAmplitudePct,
            scienceWaveMatchPct: 100,
            scienceScanComplete: true,
          });
          this.fireDeflectorParticleBeam(undefined, 0x10b981, 2.8);
          this.checkScienceWaveCompletion(hw.targetWavelengthNm, hw.targetAmplitudePct, false);
        }
        break;
      }

      // 5. ENSIGN CHEKOV'S 3D TACTICAL CONSOLE & UPPER MONITOR
      case 'tactical_shield_freq': {
        const diff = Math.abs(action.freqMhz - hw.optimalShieldFreqMhz);
        const eff = Math.max(20, Math.min(100, Math.round(100 - diff * 1.2)));
        this.missionShieldHarmonicEfficiency = eff;
        this.bridgeInterior.setHardwareTelemetry({
          shieldFreqMhz: action.freqMhz,
        });
        if (!isDrag) soundEffects.playLcarsBeep(820, 0.03);
        break;
      }
      case 'tactical_quadrant_shield': {
        if (isDrag) return;
        soundEffects.playLcarsBeep(880, 0.04);
        const q = { ...hw.shieldQuadrants };
        if (action.quadrant === 'balance') {
          q.forward = 100;
          q.aft = 100;
          q.port = 100;
          q.starboard = 100;
        } else {
          const boostKey = action.quadrant;
          q[boostKey] = Math.min(150, q[boostKey] + 24);
          const others = (['forward', 'aft', 'port', 'starboard'] as const).filter((k) => k !== boostKey);
          others.forEach((k) => {
            q[k] = Math.max(60, q[k] - 8);
          });
        }
        this.bridgeInterior.setHardwareTelemetry({ shieldQuadrants: q });
        if (!this.shieldsRaised) this.setShields(true);
        break;
      }
      case 'tactical_toggle_shields': {
        if (!isDrag) {
          this.setShields(!this.shieldsRaised);
        }
        break;
      }
      case 'tactical_toggle_armed': {
        if (!isDrag) {
          const nextArmed = !hw.weaponsArmed;
          soundEffects.playLcarsAcknowledge();
          this.bridgeInterior.setHardwareTelemetry({
            weaponsArmed: nextArmed,
            commsStatusBanner: nextArmed
              ? '⚠ TACTICAL WEAPONS ARMED: HAILING INCURS -40% DIPLOMATIC TRUST PENALTY!'
              : '✓ TACTICAL WEAPONS DISARMED: PEACEFUL DIPLOMATIC HAILING READY',
          });
          this.addLogEvent(
            'WEAPONS',
            nextArmed ? 'warning' : 'info',
            nextArmed
              ? 'Tactical Weapons Armed [Phaser & Torpedo Banks Hot]'
              : 'Tactical Weapons Disarmed [Diplomatic Safe Posture]'
          );
        }
        break;
      }
      case 'tactical_subsystem_target': {
        if (!isDrag) {
          soundEffects.playLcarsBeep(920, 0.04);
          this.bridgeInterior.setHardwareTelemetry({
            enemySubsystemTarget: action.subsystem,
          });
          this.addLogEvent(
            'WEAPONS',
            'combat',
            `Tactical Subsystem Target Locked: Hostile ${action.subsystem.toUpperCase()}`,
            action.subsystem === 'engines'
              ? 'Targeting enemy impulse & warp manifolds to reduce hostile speed by 50%.'
              : 'Targeting enemy disruptor emitters to reduce incoming weapon damage by 45%.'
          );
        }
        break;
      }
      case 'tactical_fire_phaser': {
        if (!isDrag) {
          if (this.phaserThermalHeat >= 95) {
            soundEffects.playLcarsBeep(420, 0.12);
            this.addLogEvent('WEAPONS', 'warning', 'Phaser Banks Overheated! Vent thermal heat on Tactical desk.');
            return;
          }
          this.bridgeInterior.setHardwareTelemetry({ weaponsArmed: true });
          this.startPhaserFiring();
          setTimeout(() => this.stopPhaserFiring(), 1400);
        }
        break;
      }
      case 'tactical_fire_torpedo': {
        if (!isDrag) {
          this.bridgeInterior.setHardwareTelemetry({ weaponsArmed: true });
          this.firePhotonTorpedo();
        }
        break;
      }
      case 'tactical_cycle_hostile': {
        if (!isDrag) {
          const aliveEnemies = this.combatManager.enemyShips.filter((e) => e.isAlive);
          if (aliveEnemies.length > 0) {
            this.targetNextHostile();
            this.torpedoLockTimer = 0.0;
          } else {
            // Cycle local solar system targets so the player can also switch planetary/station targets
            const curSys = this.space.systems.find((s) => s.id === this.currentSystemId);
            if (curSys && curSys.planets.length > 0) {
              const idx = curSys.planets.findIndex((p) => p.id === this.selectedTargetId);
              const nextP = curSys.planets[(idx + 1) % curSys.planets.length];
              this.setSelectedTarget(nextP.id);
              this.torpedoLockTimer = 0.0;
              soundEffects.playTargetLock();
            }
          }
        }
        break;
      }
      case 'tactical_prev_hostile': {
        if (!isDrag) {
          const aliveEnemies = this.combatManager.enemyShips.filter((e) => e.isAlive);
          if (aliveEnemies.length > 0) {
            const idx = aliveEnemies.findIndex((e) => e.id === this.lockedEnemyId);
            const prevIdx = idx <= 0 ? aliveEnemies.length - 1 : idx - 1;
            this.setLockedEnemy(aliveEnemies[prevIdx].id);
            this.torpedoLockTimer = 0.0;
            soundEffects.playTargetLock();
          } else {
            const curSys = this.space.systems.find((s) => s.id === this.currentSystemId);
            if (curSys && curSys.planets.length > 0) {
              const idx = curSys.planets.findIndex((p) => p.id === this.selectedTargetId);
              const prevIdx = idx <= 0 ? curSys.planets.length - 1 : idx - 1;
              this.setSelectedTarget(curSys.planets[prevIdx].id);
              this.torpedoLockTimer = 0.0;
              soundEffects.playTargetLock();
            }
          }
        }
        break;
      }
      case 'tactical_pinpoint_target': {
        if (!isDrag) {
          let aliveEnemies = this.combatManager.enemyShips.filter((e) => e.isAlive);
          if (aliveEnemies.length === 0) {
            // Automatically summon a hostile patrol if none are in sector so the user can immediately see & pinpoint an enemy ship!
            this.summonHostileFleet();
            aliveEnemies = this.combatManager.enemyShips.filter((e) => e.isAlive);
          }
          if (aliveEnemies.length > 0) {
            const targetEnemy =
              aliveEnemies.find((e) => e.id === this.lockedEnemyId) || aliveEnemies[0];
            this.setLockedEnemy(targetEnemy.id);
            this.torpedoLockTimer = 3.0; // Instant pinpoint lock acquired!
            this.bridgeInterior.setHardwareTelemetry({
              weaponsArmed: true,
              torpedoLockSeconds: 3.0,
              lockedEnemyName: targetEnemy.name,
            });
            soundEffects.playTargetLock();
            this.addLogEvent(
              'WEAPONS',
              'combat',
              `Pinpoint Target Lock Acquired: ${targetEnemy.name}`,
              'Live 3D Tactical Viewscreen tracking locked hostile vessel. Torpedo tubes ready!'
            );
          }
        }
        break;
      }
      case 'tactical_summon_fleet': {
        if (!isDrag) {
          this.summonHostileFleet();
          const firstAlive = this.combatManager.enemyShips.find((e) => e.isAlive);
          if (firstAlive) {
            this.setLockedEnemy(firstAlive.id);
            this.torpedoLockTimer = 0.0;
          }
          this.bridgeInterior.setHardwareTelemetry({ weaponsArmed: true });
        }
        break;
      }
      case 'tactical_vent_heat': {
        if (!isDrag) {
          this.phaserThermalHeat = Math.max(5, this.phaserThermalHeat - 60);
          soundEffects.playLcarsAcknowledge();
          this.bridgeInterior.setHardwareTelemetry({ phaserHeatPct: this.phaserThermalHeat });
          this.addLogEvent('WEAPONS', 'info', 'Phaser Nadion Thermal Emitters Vented — Heat Restored to Nominal');
        }
        break;
      }

      // 6. LT. UHURA'S 3D COMMUNICATIONS CONSOLE & UPPER MONITOR
      case 'comms_carrier_freq': {
        this.bridgeInterior.setHardwareTelemetry({
          carrierFreqMhz: action.freqMhz,
        });
        if (!isDrag) soundEffects.playLcarsBeep(760, 0.02);
        break;
      }
      case 'comms_bandpass_filter': {
        this.bridgeInterior.setHardwareTelemetry({
          bandpassFilterPct: action.filterPct,
        });
        if (!isDrag) soundEffects.playLcarsBeep(820, 0.02);
        break;
      }
      case 'comms_hail': {
        if (isDrag) return;
        soundEffects.playLcarsAcknowledge();
        const isArmed = hw.weaponsArmed || this.isFiringPhasers;
        let trustDelta = 0;
        let msg = '';
        let banner = '';

        if (isArmed) {
          // Hailing while Phasers/Weapons are armed reduces alien trust by 40%!
          trustDelta = -40;
          msg = `"ALERT // ALIEN VESSEL RESPONSE: 'Enterprise, your phaser banks are armed while hailing! We interpret this as a hostile provocation!'"`;
          banner = '⚠ HAILED WITH WEAPONS ARMED: ALIEN DIPLOMATIC TRUST DROPPED BY -40%!';
          this.addLogEvent(
            'TACTICAL',
            'warning',
            'Diplomatic Incident: Hailed while Tactical Weapons were Armed (-40% Trust)',
            'Disarm weapons on Ensign Chekov’s Tactical Console before hailing to restore trust.'
          );
        } else if (hw.signalClarityPct < 70) {
          trustDelta = 5;
          msg = `"[SUBSPACE STATIC]: Carrier signal clarity (${hw.signalClarityPct}%) is too noisy. Tune the 3D Carrier Frequency Wheel to ${hw.targetCarrierFreqMhz.toFixed(1)} MHz and Bandpass Filter to ${hw.targetBandpassPct}%."`;
          banner = 'TUNE CARRIER WHEEL & BANDPASS FADER TO CLEAR SUBSPACE STATIC';
        } else {
          trustDelta = action.mode === 'scientific' ? 28 : action.mode === 'alliance' ? 32 : 20;
          msg =
            action.mode === 'scientific'
              ? `"TRANSLATED DISPATCH // ${hw.targetName.toUpperCase()}: 'We welcome your peaceful spectroscopic data exchange, Enterprise. Scientific telemetry link established!'"`
              : `"TRANSLATED DISPATCH // ${hw.targetName.toUpperCase()}: 'Greetings, Captain Kirk and Lt. Uhura. Your peaceful posture is verified. You are cleared for standard orbit.'"`;
          banner = `✓ UNIVERSAL TRANSLATOR LOCKED: DIPLOMATIC TRUST +${trustDelta}%!`;
          this.combatManager.adaptiveTracker.addXp(80, (cat, type, m, det) =>
            this.addLogEvent(cat, type, m, det)
          );
        }

        const nextTrust = Math.max(0, Math.min(100, hw.diplomaticTrustPct + trustDelta));
        this.bridgeInterior.setHardwareTelemetry({
          diplomaticTrustPct: nextTrust,
          translatedMessage: msg,
          commsStatusBanner: banner,
        });
        break;
      }

      // 7. LT. CMDR. SCOTT'S 3D ENGINEERING CONSOLE
      case 'engineering_intermix': {
        this.bridgeInterior.setHardwareTelemetry({ intermixRatioPct: action.ratioPct });
        if (!isDrag) soundEffects.playLcarsBeep(700, 0.02);
        break;
      }
      case 'engineering_purge_coolant': {
        if (!isDrag) {
          this.phaserThermalHeat = 5;
          soundEffects.playLcarsAcknowledge();
          this.bridgeInterior.setHardwareTelemetry({
            coolantTempK: 118,
            phaserHeatPct: 5,
          });
          this.addLogEvent('DEFENSE', 'success', 'Scotty Purged Warp & Phaser Coolant Loops (118 K)');
        }
        break;
      }
      case 'engineering_emergency_repair': {
        if (!isDrag) {
          this.hullIntegrity = Math.min(100, this.hullIntegrity + 18);
          this.shieldIntegrity = Math.min(100, this.shieldIntegrity + 25);
          soundEffects.playLcarsAcknowledge();
          this.addLogEvent(
            'DEFENSE',
            'success',
            `Emergency Damage Control Shunt: Hull ${Math.round(this.hullIntegrity)}%, Shields ${Math.round(this.shieldIntegrity)}%`
          );
          this.broadcastState(true);
        }
        break;
      }
    }
  }

  private checkScienceWaveCompletion(wavelengthNm: number, amplitudePct: number, isDrag: boolean) {
    const hw = this.bridgeInterior.getHardwareState();
    const wDiff = Math.abs(wavelengthNm - hw.targetWavelengthNm) / 370;
    const aDiff = Math.abs(amplitudePct - hw.targetAmplitudePct) / 90;
    const matchPct = Math.max(0, Math.min(100, Math.round((1 - (wDiff * 0.65 + aDiff * 0.35)) * 100)));

    if (matchPct >= 88 && this.lastCompletedScienceTargetId !== this.selectedTargetId) {
      this.lastCompletedScienceTargetId = this.selectedTargetId;
      soundEffects.playLcarsAcknowledge();
      this.combatManager.adaptiveTracker.addXp(100, (cat, type, msg, det) =>
        this.addLogEvent(cat, type, msg, det)
      );
      this.addLogEvent(
        'NAVIGATION',
        'success',
        `SPECTROSCOPIC WAVE MATCHED (${matchPct}%): ${hw.targetName} (+100 Science XP)`,
        'Science Exhibition Educational Card unlocked on Cmdr. Spock’s Upper Science Monitor!'
      );
    } else if (!isDrag) {
      soundEffects.playLcarsBeep(820, 0.02);
    }
  }

  public resetBridgeLookAngle() {
    this.bridgeLookAngle = { yaw: 0, pitch: 0 };
    soundEffects.playLcarsBeep(820, 0.04);
  }

  public adjustBridgeLookAngle(dYaw: number, dPitch: number) {
    this.bridgeLookAngle.yaw += dYaw;
    this.bridgeLookAngle.pitch = THREE.MathUtils.clamp(this.bridgeLookAngle.pitch + dPitch, -0.95, 0.95);
  }

  public setShipHeadingAndPitch(headingDeg: number, pitchDeg: number) {
    if (this.isDocked) return;
    if (this.activeCoursePlot) {
      this.activeCoursePlot.isEngaged = false;
      this.activeCoursePlot = null;
    }
    const yawRad = THREE.MathUtils.degToRad(-headingDeg);
    const pitchRad = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(pitchDeg, -65, 65));
    this.orientation.setFromEuler(new THREE.Euler(pitchRad, yawRad, 0, 'YXZ'));
    this.orientation.normalize();
    this.forwardVector.set(0, 0, -1).applyQuaternion(this.orientation);
    this.upVector.set(0, 1, 0).applyQuaternion(this.orientation);
    this.rightVector.set(1, 0, 0).applyQuaternion(this.orientation);
    this.bridgeInterior.setHardwareTelemetry({ headingDeg, pitchDeg });
    this.broadcastState();
  }

  public syncBridgeHardwareTelemetry(params: {
    warpFactor?: number;
    throttlePercent?: number;
    shieldFreqMhz?: number;
    shieldsRaised?: boolean;
    wavelengthNm?: number;
    subspaceFreqMhz?: number;
    headingDeg?: number;
    pitchDeg?: number;
  }) {
    this.bridgeInterior.setHardwareTelemetry(params);
  }

  public cycleCameraView() {
    const modes: CameraViewMode[] = [
      'chase',
      'interior_bridge',
      'bridge',
      'beauty',
      'bow',
      'stern',
      'registry',
      'cinematic',
      'saucer',
      'nacelle',
      'deflector',
      'spacedock_bay',
      'orbit',
    ];
    const currentIndex = modes.indexOf(this.viewMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setCameraView(modes[nextIndex]);
  }

  public focusSubsystem(subsystemId: string) {
    this.viewMode = 'orbit';
    this.focusedSubsystemKey = subsystemId;
    this.bridgeInterior.root.visible = false;
    this.enterprise.root.visible = true;
    soundEffects.playLcarsAcknowledge();
    this.broadcastState();
  }

  public setOnLogEvent(callback: (event: TacticalLogEvent) => void) {
    this.onLogEventCallback = callback;
  }

  public addLogEvent(
    category: TacticalLogEvent['category'],
    type: TacticalLogEvent['type'],
    message: string,
    details?: string
  ) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const stardate = `SD ${(47000 + (now.getTime() % 100000) / 100).toFixed(1)}`;
    const event: TacticalLogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      stardate,
      category,
      type,
      message,
      details,
    };
    if (this.onLogEventCallback) {
      setTimeout(() => {
        this.onLogEventCallback?.(event);
      }, 0);
    }
  }

  // --- TARGETING SYSTEM ---
  public targetNextHostile() {
    const aliveEnemies = this.combatManager.enemyShips.filter((e) => e.isAlive);
    if (aliveEnemies.length === 0) return;

    if (!this.lockedEnemyId) {
      this.lockedEnemyId = aliveEnemies[0].id;
    } else {
      const idx = aliveEnemies.findIndex((e) => e.id === this.lockedEnemyId);
      const nextIdx = (idx + 1) % aliveEnemies.length;
      this.lockedEnemyId = aliveEnemies[nextIdx].id;
    }

    const enemy = this.combatManager.enemyShips.find((e) => e.id === this.lockedEnemyId);
    if (enemy && enemy.isAlive) {
      const dist = Math.round(enemy.mesh.position.distanceTo(this.position));
      computerVoice.onHostileClassified(enemy.name, !!enemy.isElite);
      this.addLogEvent(
        'WEAPONS',
        'combat',
        'Torpedo Lock Achieved',
        `Locked on ${enemy.name} (${enemy.shipClass}) - Range: ${dist} km`
      );
    }

    soundEffects.playTargetLock();
    soundEffects.playTargetLockAchieved();
    this.broadcastState();
  }

  public setLockedEnemy(enemyId: string | null) {
    if (this.lockedEnemyId !== enemyId && enemyId !== null) {
      this.torpedoLockTimer = 0.0; // Start 3-second torpedo guidance lock!
    }
    this.lockedEnemyId = enemyId;
    if (enemyId) {
      soundEffects.playTargetLock();
      soundEffects.playTargetLockAchieved();
      const enemy = this.combatManager.enemyShips.find((e) => e.id === enemyId);
      if (enemy && enemy.isAlive) {
        const dist = Math.round(enemy.mesh.position.distanceTo(this.position));
        this.addLogEvent(
          'WEAPONS',
          'combat',
          'Torpedo Lock Sequence Initiated (3.0s)',
          `Locking onto ${enemy.name} (${enemy.shipClass}) - Range: ${dist} km`
        );
      }
    }
    this.broadcastState();
  }

  public triggerEvasiveBoost() {
    if (this.isWarping) return;
    if (this.isBoostActive) {
      this.stopEvasiveBoost();
    } else {
      this.startEvasiveBoost();
    }
  }

  public startEvasiveBoost() {
    if (this.isWarping || this.isBoostActive || this.boostCharge <= 5) return;
    this.isBoostActive = true;
    this.screenShakeIntensity = 0.35;
    soundEffects.playEvasiveBoost();
    computerVoice.onEvasiveBoostTriggered();
    this.addLogEvent(
      'DEFENSE',
      'info',
      'Evasive Thrusters Overdrive Engaged',
      `Impulse manifold capacitors discharging from ${Math.round(this.boostCharge)}%. Disruptor deflection and thruster burst active.`
    );
    this.broadcastState(true);
  }

  public stopEvasiveBoost() {
    if (!this.isBoostActive) return;
    this.isBoostActive = false;
    soundEffects.playLcarsBeep(520, 0.05);
    this.addLogEvent(
      'DEFENSE',
      'info',
      'Evasive Boost Disengaged',
      `Overdrive stopped at ${Math.round(this.boostCharge)}%. Impulse capacitors recharging at +1.5%/s.`
    );
    this.broadcastState(true);
  }

  public clearSelection() {
    this.selectedTargetId = null;
    this.lockedEnemyId = null;
    if (this.activeCoursePlot) {
      this.activeCoursePlot.isEngaged = false;
      this.activeCoursePlot = null;
      if (this.isWarping) {
        this.dropWarp();
      }
    }
    this.navPathGuide.update(this.position, this.forwardVector, null, 30, 0.016, 0);
    soundEffects.playLcarsBeep(450, 0.05);
    this.addLogEvent(
      'NAVIGATION',
      'info',
      'Target Deselected [Z]',
      'All navigational tracks, destination waypoints, and weapons locks cleared.'
    );
    this.broadcastState(true);
  }

  public setSelectedTarget(targetId: string | null) {
    this.selectedTargetId = targetId;
    soundEffects.playLcarsBeep(650, 0.05);
    this.broadcastState();
  }

  public toggleAutoPilot() {
    this.autoPilot = !this.autoPilot;
    soundEffects.playLcarsAcknowledge();
    this.broadcastState();
  }

  public toggleCombatAssist() {
    this.combatAssist = !this.combatAssist;
    soundEffects.playLcarsAcknowledge();
    this.broadcastState();
  }

  public getCombatAssist(): boolean {
    return this.combatAssist;
  }

  // --- SPACE STATION DOCKING, REPAIR & TORPEDO REFILL SYSTEM ---
  public dockAtStation(stationId?: string): boolean {
    let targetPlanet = stationId
      ? this.space.planets.find((p) => p.id === stationId && p.type === 'starbase')
      : null;

    if (!targetPlanet && this.canDockAtStation) {
      targetPlanet = this.space.planets.find((p) => p.id === this.canDockAtStation?.id);
    }

    if (!targetPlanet) {
      // Find closest starbase within 780 units
      let closest: typeof this.space.planets[0] | null = null;
      let minD = 780;
      for (const p of this.space.planets) {
        if (p.type === 'starbase') {
          const mesh = this.space.targetMeshes.get(p.id);
          const pos = mesh ? mesh.position : new THREE.Vector3(...p.position);
          const d = this.position.distanceTo(pos);
          if (d < minD) {
            minD = d;
            closest = p;
          }
        }
      }
      targetPlanet = closest;
    }

    if (!targetPlanet) {
      this.addLogEvent('NAVIGATION', 'warning', 'No space station or orbital dock in docking range.', 'Navigate within 780 km of an orbital starbase and press [U].');
      return false;
    }

    this.undockCooldown = 0;

    this.isDocked = true;
    this.dockedStationId = targetPlanet.id;
    this.dockedStationName = targetPlanet.name;
    this.isWarping = false;
    this.setThrottle(0);
    this.velocity.set(0, 0, 0);

    // Position starship securely inside Spacedock cavernous hangar bay or alongside drydock mooring rings
    const mesh = this.space.targetMeshes.get(targetPlanet.id);
    const stationPos = mesh ? mesh.position : new THREE.Vector3(...targetPlanet.position);

    if (targetPlanet.id !== 'deep_space_nine') {
      // Berth directly inside the illuminated Spacedock Hangar Bay
      const berth = getSpacedockBerthTransform(targetPlanet.id, stationPos, targetPlanet.radius);
      this.position.copy(berth.position);
      this.orientation.copy(berth.orientation);
      this.setCameraView('spacedock_bay');
    } else {
      const offsetDir = this.position.clone().sub(stationPos);
      offsetDir.y = 0;
      if (offsetDir.lengthSq() < 0.1) offsetDir.set(0, 0, 1);
      offsetDir.normalize();
      this.position.copy(stationPos).add(offsetDir.multiplyScalar(targetPlanet.radius + 32));
      const lookDir = offsetDir.clone().negate();
      const targetYaw = Math.atan2(-lookDir.x, -lookDir.z);
      this.orientation.setFromEuler(new THREE.Euler(0, targetYaw, 0, 'YXZ'));
    }

    // Preserve current Hull, Shields, Torpedoes, Evasive Boost, and Phaser Energy so the user interactively restores them via the HUD!
    const currentHull = Math.round(this.hullIntegrity);
    this.alertLevel = 'green';
    this.isUnderAttack = false;
    this.combatManager.hasIncomingTorpedo = false;

    this.stationOpsState = {
      isDocked: true,
      stationId: targetPlanet.id,
      stationName: targetPlanet.name,
      activeSubsystem: 'hull',
      dronesDeployed: false,
      droneCount: 2,
      repairMode: 'structural',
      repairRatePerSec: 3.5,
      hullIntegrity: this.hullIntegrity,
      scorchCleanedPercent: this.hullIntegrity >= 100 ? 100 : Math.max(0, (this.hullIntegrity - 30) * 1.43),
      isRepairComplete: this.hullIntegrity >= 100,
      estimatedSecondsRemaining: this.hullIntegrity >= 100 ? 0 : Math.ceil((100 - this.hullIntegrity) / 3.5),
      clampsEngaged: true,
      clampPressurePsi: 14.7,
      isPressurizing: false,
      shorePowerConnected: true,
      lifeSupportEqualized: true,
      antimatterLevel: Math.round(this.boostCharge),
      deuteriumLevel: Math.round(this.shieldIntegrity),
      isRefuelingAntimatter: false,
      isRefuelingDeuterium: false,
      containmentFieldIntegrity: 99.98,
      antimatterFlowRate: 0,
      torpedoCount: this.torpedoCount,
      selectedTorpedoType: 'photon',
      isReloadingTorpedoes: false,
      launcher1Status: 'ready',
      launcher2Status: 'ready',
      dilithiumFrequencyMhz: 248.5,
      dilithiumAlignmentPercent: 98.4,
      intermixRatio: 1.0,
      plasmaInjectorsCleaned: false,
      isDiagnosticRunning: false,
      warpEfficiencyBonus: 0,
      coolantTempKelvin: 285,
      coolantToxicityPercent: 42,
      radiatorEfficiencyPercent: 88,
      isPurgingCoolant: false,
      crewTotal: 430,
      crewMoralePercent: 82,
      shoreLeaveGranted: false,
      medicalTriageComplete: false,
      rationsRestocked: true,
    };

    setStationClampsState(targetPlanet.id, true);

    soundEffects.stopRedAlert();
    soundEffects.playLcarsAcknowledge();
    soundEffects.playLcarsBeep(980, 0.25);
    computerVoice.onDockingInitiated(targetPlanet.name);

    this.addLogEvent(
      'DEFENSE',
      'success',
      `Docked securely at ${targetPlanet.name}. Gantry clamps locked.`,
      `Hull: ${currentHull}% · Shields: ${Math.round(this.shieldIntegrity)}% · Torpedoes: ${this.torpedoCount}/30 · Boost: ${Math.round(this.boostCharge)}%. Use HUD Station Controls to repair & resupply.`
    );

    this.broadcastState(true);
    return true;
  }

  public undockFromStation(): void {
    if (!this.isDocked) return;
    const name = this.dockedStationName || 'Starbase';
    const stationId = this.dockedStationId;

    if (stationId) {
      setStationDronesState(stationId, false, 0, this.position, this.orientation);
      setStationClampsState(stationId, false);
    }
    this.stationOpsState = null;

    this.isDocked = false;
    this.dockedStationId = null;
    this.dockedStationName = null;
    this.undockCooldown = 5.0; // 5-second cooldown to guarantee ship does not instantly re-dock
    this.canDockAtStation = null;
    computerVoice.onUndockingDepart();

    // Determine outward trajectory pointing cleanly away from the station center
    let stationPos: THREE.Vector3 | null = null;
    let stationRadius = 24;
    if (stationId) {
      const pData = this.space.planets.find((p) => p.id === stationId);
      if (pData) {
        stationRadius = pData.radius;
        const mesh = this.space.targetMeshes.get(stationId);
        stationPos = mesh ? mesh.position.clone() : new THREE.Vector3(...pData.position);
      }
    }

    let outward: THREE.Vector3;
    if (stationId?.includes('spacedock')) {
      // Emerge forward through the atmospheric force-field doors into open space
      outward = this.forwardVector.clone().normalize();
      this.position.add(outward.clone().multiplyScalar(stationRadius * 1.6 + 60));
      this.setCameraView('chase');
    } else {
      if (stationPos) {
        outward = this.position.clone().sub(stationPos).normalize();
        if (outward.lengthSq() < 0.1) outward.set(0, 0, 1);
        this.position.copy(stationPos).add(outward.clone().multiplyScalar(stationRadius + 95));
      } else {
        outward = this.forwardVector.clone();
        this.position.add(outward.clone().multiplyScalar(85));
      }
      this.orientation.setFromUnitVectors(new THREE.Vector3(0, 0, -1), outward);
      this.setCameraView('chase');
    }
    this.forwardVector.copy(outward);

    // Separation impulse burn away from spacedock
    this.velocity.copy(outward).multiplyScalar(42);
    this.setThrottle(25);

    soundEffects.playLcarsAcknowledge();
    soundEffects.playLcarsBeep(640, 0.12);

    this.addLogEvent(
      'NAVIGATION',
      'info',
      `Mooring clamps released from ${name}. Separation thrusters engaged.`,
      'All umbilicals detached. Ship is safely clear of station perimeter and under manual helm control.'
    );

    this.broadcastState(true);
  }

  public isShipDocked(): boolean {
    return this.isDocked;
  }

  // --- DAMAGE & IMPACT SYSTEM ---
  public applyDamageToEnterprise(amount: number) {
    if (this.isDestroyed) return;

    // Evasive Thrusters Overdrive deflection chance (75% deflection)
    if (this.isBoostActive && Math.random() < 0.75) {
      soundEffects.playShieldToggle(true);
      this.addLogEvent('DEFENSE', 'success', 'Evasive Overdrive Deflection', 'Hostile fire deflected by high-frequency impulse wake!');
      return;
    }

    const effectiveAmount = this.isBoostActive ? amount * 0.35 : amount;

    this.lastDamageTime = performance.now();
    this.screenShakeIntensity = Math.min(0.8, this.screenShakeIntensity + 0.35);
    this.isUnderAttack = true;

    // Track combat telemetry for adaptive hostile scaling
    this.combatManager.adaptiveTracker.recordDamageTaken(effectiveAmount);

    // Cancel any pending single-tap G timer when taking damage
    if (this.gPressTimer !== null) {
      clearTimeout(this.gPressTimer);
      this.gPressTimer = null;
    }

    // Automatic red alert when taking unexpected fire / damage
    if (this.alertLevel !== 'red') {
      this.setAlertLevel('red');
      this.addLogEvent(
        'DEFENSE',
        'critical',
        'RED ALERT: IMPACT DETECTED',
        'Enterprise taking combat damage. Automated battle stations protocol engaged.'
      );
    }

    if (this.shieldsRaised && this.shieldIntegrity > 0) {
      const prevShield = this.shieldIntegrity;
      // Apply Multiphasic Shield Harmonic Modulation reduction (up to 65% damage reflection when calibrated!)
      const harmonicReduction = this.missionShieldHarmonicEfficiency > 0
        ? 1.0 - (this.missionShieldHarmonicEfficiency / 100) * 0.65
        : 1.0;
      this.shieldIntegrity = Math.max(0, this.shieldIntegrity - effectiveAmount * 0.65 * harmonicReduction);
      soundEffects.playShieldHit();
      computerVoice.onShieldsChanged(this.shieldIntegrity, prevShield);

      // Shield flare visual (shifts to bright cyan when harmonic modulation is active)
      const shieldMat = this.enterprise.shieldBubble.material as THREE.MeshStandardMaterial;
      shieldMat.opacity = 0.72;
      if (this.missionShieldHarmonicEfficiency >= 75) {
        shieldMat.emissive.setHex(0x06b6d4);
      }

      // Real-time Tactical Notifications on Shield Thresholds
      if (prevShield > 50 && this.shieldIntegrity <= 50 && this.shieldIntegrity > 20) {
        this.addLogEvent('DEFENSE', 'critical', 'Shields at 50%', 'Warning: Deflector shield capacity reduced to 50%');
      } else if (prevShield > 20 && this.shieldIntegrity <= 20 && this.shieldIntegrity > 0) {
        this.addLogEvent('DEFENSE', 'critical', 'Shields Critical at 20%!', 'Deflector grid near total failure!');
      }

      if (this.shieldIntegrity <= 0) {
        this.shieldIntegrity = 0;
        soundEffects.playShieldToggle(false);
        this.addLogEvent('DEFENSE', 'critical', 'Shields Down!', 'Multiphasic shielding collapsed! Hull taking direct fire!');
      }
    } else {
      // Direct hull hit
      this.hullIntegrity = Math.max(0, this.hullIntegrity - effectiveAmount * 0.85);
      soundEffects.playHullImpact();
      computerVoice.onStructuralBreach(this.hullIntegrity);
      this.space.triggerExplosion(this.position, 1.2);
      this.addLogEvent('DAMAGE', 'critical', 'Direct Hull Impact', `Structural integrity at ${Math.round(this.hullIntegrity)}%`);

      if (this.hullIntegrity <= 0) {
        this.hullIntegrity = 0;
        this.isDestroyed = true;
        this.isFiringPhasers = false;
        this.space.stopPhasers();
        this.throttlePercent = 0;
        this.velocity.set(0, 0, 0);

        // Critical defeat recorded in adaptive system
        this.combatManager.adaptiveTracker.recordPlayerDefeat((cat, type, msg, det) => {
          this.addLogEvent(cat, type, msg, det);
        });

        // Massive catastrophic explosion VFX and Core Breach Alarm
        this.space.triggerExplosion(this.position, 6.0);
        soundEffects.playExplosion(this.position);
        soundEffects.playCoreBreachAlarm();

        const currentSys = this.space.systems.find((s) => s.id === this.currentSystemId);
        const tracker = this.combatManager.adaptiveTracker;
        const accuracy = tracker.torpedoesFired > 0
          ? Math.min(100, Math.round((tracker.torpedoesHit / tracker.torpedoesFired) * 100))
          : 80;
        const evasion = tracker.enemyTorpedoesSpawned > 0
          ? Math.min(100, Math.round((tracker.enemyTorpedoesDodged / tracker.enemyTorpedoesSpawned) * 100))
          : 85;

        this.defeatStats = {
          waveReached: this.combatManager.combatWave,
          totalKills: tracker.totalKills,
          scoutsDestroyed: tracker.scoutsDestroyed,
          cruisersDestroyed: tracker.cruisersDestroyed,
          mothershipsDestroyed: tracker.mothershipsDestroyed,
          combatRating: tracker.combatRating,
          skillTier: tracker.skillTier,
          accuracyPercent: accuracy,
          evasionPercent: evasion,
          stardate: (45000 + (performance.now() / 10000)).toFixed(1),
          systemName: currentSys ? currentSys.name : 'Unknown Sector',
        };

        this.addLogEvent('DAMAGE', 'critical', 'CATASTROPHIC CORE BREACH', 'USS Enterprise NCC-1701 lost in action.');
      }
    }

    this.broadcastState();
  }

  public restartSimulation(retryCurrentWave: boolean = false) {
    this.isDestroyed = false;
    this.defeatStats = undefined;
    this.hullIntegrity = 100;
    this.shieldIntegrity = 100;
    this.shieldsRaised = false; // Down by default
    (this.enterprise.shieldBubble.material as THREE.MeshStandardMaterial).opacity = 0.0;
    this.torpedoCount = 24;
    this.phaserEnergy = 100;
    this.isBoostActive = false;
    this.boostDuration = 0;
    this.boostCharge = 100;
    this.throttlePercent = 0; // Default Full Stop (0% impulse)
    this.isWarping = false;
    this.warpFactor = 4.0;
    this.velocity.set(0, 0, 0);
    this.position.set(0, 25, -1120);
    this.orientation.identity();
    this.forwardVector.set(0, 0, -1);
    this.upVector.set(0, 1, 0);
    this.rightVector.set(1, 0, 0);
    this.pitchRate = 0;
    this.yawRate = 0;
    this.rollRate = 0;
    this.lockedEnemyId = null;
    this.selectedTargetId = 'sol_earth';
    this.currentSystemId = 'sol_system';
    this.activeCoursePlot = null;
    this.autoPilot = false;
    this.cameraZoom = 1.0;
    this.blackHoleTransit = null;
    this.blackHoleTransitTimer = 0;
    this.blackHoleEjectedApplied = false;
    this.blackHoleWarningLogged = false;
    this.space.setActiveSystem?.('sol_system');
    this.space.updateSpacetimeWarpEffect?.(0, 0, false, 'pulling', 0, this.position, this.orientation);

    // Completely wipe all hostile ships and projectiles from 3D scene
    this.combatManager.clearAllHostiles();

    if (retryCurrentWave) {
      this.combatManager.retryWave();
      this.combatManager.spawnWave(this.position, this.currentSystemId, this.combatManager.combatWave);
      this.setAlertLevel('red');
    } else {
      // Complete reset to original starting state: 0 enemies, territory secure in Sol System, all progress (XP, Destroyed, ranks) reset
      this.combatManager.resetToInitialStandby();
      this.setAlertLevel('green');
    }

    soundEffects.stopRedAlert();
    soundEffects.playLcarsAcknowledge();
    soundEffects.playWarpEngage();
    this.addLogEvent(
      'SECTOR',
      'success',
      'USS Enterprise Re-Commissioned',
      retryCurrentWave
        ? `Systems restored. Re-engaging Wave ${this.combatManager.combatWave}!`
        : 'All systems, XP, and hostile casualty telemetry reset to initial Starfleet exploration status at Sector 001 Earth.'
    );
    this.broadcastState(true);
  }

  // --- PLANETARY COLLISION CHECK ---
  private checkPlanetaryCollisions() {
    for (const [id, tMesh] of this.space.targetMeshes) {
      // Find actual planet data if available for precise collision radius
      const planetData = this.space.planets.find((p) => p.id === id);
      let boundRadius = 32;

      if (planetData) {
        boundRadius = planetData.radius + 6;
      } else if (id.includes('earth') || id.includes('giant') || id.includes('kronos') || id.includes('vulcan')) {
        boundRadius = 55;
      } else if (id.includes('spacedock') || id.includes('outpost') || id.includes('station')) {
        boundRadius = 24;
      } else if (id.includes('asteroid')) {
        boundRadius = 26;
      }

      const dist = this.position.distanceTo(tMesh.position);

      // Black Hole & White Hole Singularities:
      // Do not treat event horizons as solid rocky surfaces; allow gravitational capture mechanic to pull the ship in smoothly!
      if (id === 'sol_black_hole' || id === 'kronos_white_hole') {
        if (id === 'sol_black_hole' && this.isWarping && dist < 330) {
          this.isWarping = false;
          this.velocity.multiplyScalar(0.15);
          if (this.activeCoursePlot) {
            this.activeCoursePlot.isEngaged = false;
            this.activeCoursePlot = null;
          }
          soundEffects.playLcarsBeep(440, 0.15);
          soundEffects.updateImpulseHum(this.throttlePercent, false);
        }
        continue;
      }

      // Proximity warp drop safety: If warping close to any celestial body's danger zone, emergency drop from warp before collision
      if (this.isWarping && dist < boundRadius + 80) {
        this.isWarping = false;
        this.velocity.multiplyScalar(0.05);
        if (this.activeCoursePlot) {
          this.activeCoursePlot.isEngaged = false;
          this.activeCoursePlot = null;
        }
        soundEffects.playLcarsBeep(440, 0.15);
        soundEffects.updateImpulseHum(0, false);
      }

      // Starbase / Spacedock Proximity Buffer (Protective tractor buffer prevents collision damage, no auto-dock)
      if (planetData?.type === 'starbase' || id.includes('spacedock') || id.includes('station') || id.includes('dock')) {
        if (dist < boundRadius) {
          const repulsion = this.position.clone().sub(tMesh.position);
          if (repulsion.lengthSq() < 0.1) repulsion.set(0, 0, 1);
          repulsion.normalize();
          this.position.copy(tMesh.position).add(repulsion.clone().multiplyScalar(boundRadius + 6));
          this.velocity.multiplyScalar(0.2);
        }
        continue;
      }

      if (dist < boundRadius) {
        // Physical crash into planet
        const repulsion = this.position.clone().sub(tMesh.position);
        if (repulsion.lengthSq() < 0.1) {
          repulsion.set(0, 1, 0);
        }
        repulsion.normalize();
        
        // Push ship safely out of the planet surface
        this.position.copy(tMesh.position).add(repulsion.clone().multiplyScalar(boundRadius + 15));

        // Bounce velocity
        this.velocity.reflect(repulsion).multiplyScalar(0.25);

        // Crash damage
        soundEffects.playPlanetCollision();
        this.applyDamageToEnterprise(25);
        this.space.triggerExplosion(this.position, 2.0);

        // Drop out of warp immediately
        if (this.isWarping) {
          this.isWarping = false;
          this.setThrottle(0);
        }
        break;
      }
    }
  }

  // --- UNIVERSAL 3D COORDINATE NAVIGATION WITH COLLISION SAFETY ---
  public setCourseToCoordinates(
    coords: [number, number, number],
    systemId?: string,
    preferredWarpFactor?: number,
    targetLabel?: string
  ) {
    const targetSys = systemId
      ? this.space.systems.find((s) => s.id === systemId) || this.space.systems[0]
      : this.space.systems.find((s) => s.id === this.currentSystemId) || this.space.systems[0];

    const shipPosTuple: [number, number, number] = [this.position.x, this.position.y, this.position.z];

    // Compute automatic collision safety buffer and standoff point
    const safety = calculateSafeCoordinates(coords, shipPosTuple, targetSys.id, 140);
    const destPos = safety.safePos;
    const safeDestVec = new THREE.Vector3(...destPos);
    const currentDist = this.position.distanceTo(safeDestVec);

    // Set or preserve warp factor
    if (preferredWarpFactor !== undefined && preferredWarpFactor >= 1.0 && preferredWarpFactor <= 9.9) {
      this.warpFactor = Math.round(preferredWarpFactor * 10) / 10;
    } else if (this.warpFactor < 3.0) {
      this.warpFactor = 6.0;
    }

    // Determine target planet/body surrogate for telemetry
    let repPlanet: PlanetData;
    if (safety.standoffObject) {
      const matched = targetSys.planets.find((p) => p.id === safety.standoffObject!.id);
      if (matched) {
        repPlanet = matched;
      } else {
        repPlanet = {
          id: safety.standoffObject.id,
          name: safety.standoffObject.name,
          systemId: targetSys.id,
          type: (safety.standoffObject.type as any) || 'terran',
          radius: safety.standoffObject.radius,
          position: safety.standoffObject.position,
          textureColor: '#38bdf8',
          description: 'Orbital standoff destination outside ' + safety.standoffObject.name,
        };
      }
    } else {
      repPlanet = {
        id: 'nav_coords_target',
        name: targetLabel || ('Coordinates [' + Math.round(coords[0]) + ', ' + Math.round(coords[1]) + ', ' + Math.round(coords[2]) + ']'),
        systemId: targetSys.id,
        type: 'anomaly',
        radius: 20,
        position: destPos,
        textureColor: '#38bdf8',
        description: 'Deep space navigational waypoint at Universal [' + Math.round(coords[0]) + ', ' + Math.round(coords[1]) + ', ' + Math.round(coords[2]) + ']',
      };
    }

    const safetyTelemetry: CollisionSafetyTelemetry = {
      targetCoordinates: coords,
      safeCoordinates: destPos,
      isOffsetApplied: safety.isOffsetApplied,
      clearanceDistance: safety.clearanceDistance,
      standoffObject: safety.standoffObject ? {
        id: safety.standoffObject.id,
        name: safety.standoffObject.name,
        type: safety.standoffObject.type,
        radius: safety.standoffObject.radius,
      } : undefined,
      approachVector: safety.approachVector,
    };

    this.activeCoursePlot = {
      targetSystem: targetSys,
      targetPlanet: repPlanet,
      destinationPos: destPos,
      requestedCoords: coords,
      distance: Math.round(currentDist),
      etaSeconds: this.calculateAccurateEta(currentDist, this.warpFactor),
      isEngaged: true,
      phase: 'aligning',
      safetyTelemetry,
      customCoordinatesTarget: true,
    };

    this.selectedTargetId = repPlanet.id;

    if (targetSys.id === this.currentSystemId) {
      this.space.setActiveSystem?.(targetSys.id);
    }

    soundEffects.playLcarsAcknowledge();
    soundEffects.playWarpEngage();

    if (safety.isOffsetApplied && safety.standoffObject) {
      this.addLogEvent(
        'NAVIGATION',
        'warning',
        'Collision Safety Active: Proximity override for ' + safety.standoffObject.name,
        'Calculated safe orbital standoff at [' + destPos[0] + ', ' + destPos[1] + ', ' + destPos[2] + '], maintaining ' + safety.clearanceDistance + ' km perimeter clearance.'
      );
      computerVoice.onCourseLocked(safety.standoffObject.name + ' Safe Orbit', currentDist);
    } else {
      this.addLogEvent(
        'NAVIGATION',
        'info',
        'Navigation Course Plotted to Coordinates [' + coords[0] + ', ' + coords[1] + ', ' + coords[2] + ']',
        'Direct warp transit engaged at Warp ' + this.warpFactor.toFixed(1) + '. Distance: ' + formatAstronomicalDistance(currentDist, 'standard') + '.'
      );
      computerVoice.onCourseLocked(repPlanet.name, currentDist);
    }

    this.broadcastState(true);
  }

  // --- AUTOMATED COURSE PLOTTER TO ANY SOLAR SYSTEM ---
  public setCourseToSolarSystem(systemId: string, planetId?: string, preferredWarpFactor?: number) {
    const system = this.space.systems.find((s) => s.id === systemId);
    if (!system) return;

    const targetPlanet = planetId
      ? system.planets.find((p) => p.id === planetId) || system.planets[0]
      : system.planets[0];

    const planetCenter = new THREE.Vector3(...targetPlanet.position);

    let safeDestPos: THREE.Vector3;
    if (targetPlanet.type === 'starbase') {
      // Approach space stations strictly at their exact Y altitude (+165 units along Z in front of docking bay doors)
      // so the station is NEVER stuck above or below the starship!
      safeDestPos = new THREE.Vector3(planetCenter.x, planetCenter.y, planetCenter.z + 165);
    } else {
      // Calculate horizontal approach vector from current ship position towards the planet
      const offsetFromPlanet = this.position.clone().sub(planetCenter);
      offsetFromPlanet.y = 0; // Keep approach level with planet equator so target is never far above/below
      if (offsetFromPlanet.lengthSq() < 100) {
        offsetFromPlanet.set(0, 0, 1);
      }
      offsetFromPlanet.normalize();

      const planetRadius = targetPlanet.radius || 45;
      const ringRadius = (targetPlanet.hasRings && targetPlanet.ringOuter) ? targetPlanet.ringOuter : 0;
      const safeOrbitRadius = targetPlanet.id === 'sol_black_hole'
        ? 310
        : Math.max(planetRadius * 2.6 + 110, ringRadius + 130, 230);

      safeDestPos = planetCenter.clone().add(offsetFromPlanet.multiplyScalar(safeOrbitRadius));
    }

    const destPos: [number, number, number] = [
      Math.round(safeDestPos.x),
      Math.round(safeDestPos.y),
      Math.round(safeDestPos.z),
    ];

    const currentDist = this.position.distanceTo(safeDestPos);

    // Set or preserve warp factor
    if (preferredWarpFactor !== undefined && preferredWarpFactor >= 1.0 && preferredWarpFactor <= 9.9) {
      this.warpFactor = Math.round(preferredWarpFactor * 10) / 10;
    } else if (this.warpFactor < 3.0) {
      this.warpFactor = 6.0;
    }

    this.activeCoursePlot = {
      targetSystem: system,
      targetPlanet,
      destinationPos: destPos,
      distance: Math.round(currentDist),
      etaSeconds: this.calculateAccurateEta(currentDist, this.warpFactor),
      isEngaged: true,
      phase: 'aligning',
    };

    this.selectedTargetId = targetPlanet.id;
    // Activate target system meshes so destination starbase/planet is always loaded in 3D
    if (system.id === this.currentSystemId) {
      this.space.setActiveSystem?.(system.id);
    }

    soundEffects.playLcarsAcknowledge();
    soundEffects.playWarpEngage();
    computerVoice.onCourseLocked(targetPlanet.name, currentDist);

    this.broadcastState(true);
  }

  public cancelCourse() {
    if (this.activeCoursePlot) {
      this.activeCoursePlot.isEngaged = false;
      this.activeCoursePlot = null;
    }
    if (this.isWarping) {
      this.dropWarp();
    } else {
      if (this.throttlePercent <= 5) {
        this.throttlePercent = 25;
      }
      this.keysPressed = {};
      this.broadcastState(true);
    }
    soundEffects.playLcarsBeep(600, 0.08);
  }

  // Set warp course to nearest orbital space dock (without auto-starting repairs/refills)
  public goToNearestSpaceDock(): { name: string; distance: number; directDocked: boolean } | null {
    if (this.isDocked) {
      soundEffects.playLcarsAcknowledge();
      this.broadcastState(true);
      return { name: this.dockedStationName || 'Space Dock', distance: 0, directDocked: true };
    }

    // Search all starbases across all systems, preferring one in the current solar system if present
    const allStarbases = this.space.planets.filter((p) => p.type === 'starbase');
    if (allStarbases.length === 0) {
      this.addLogEvent('NAVIGATION', 'warning', 'No Starbase Space Dock cataloged in navigational charts.');
      return null;
    }

    let closest = allStarbases[0];
    let minD = Infinity;

    for (const sb of allStarbases) {
      const mesh = this.space.targetMeshes.get(sb.id);
      const pos = mesh ? mesh.position : new THREE.Vector3(...sb.position);
      const d = this.position.distanceTo(pos);
      if (d < minD) {
        minD = d;
        closest = sb;
      }
    }

    const distKm = Math.round(minD);
    const system = this.space.systems.find((s) => s.id === closest.systemId);
    const systemName = system?.name || 'Local Sector';

    // If already in docking proximity (<= 480 km), dock immediately (user controls repairs & refills in HUD)
    if (minD <= 480) {
      this.dockAtStation(closest.id);
      soundEffects.playLcarsAcknowledge();
      return { name: closest.name, distance: distKm, directDocked: true };
    }

    // Otherwise, plot automated warp course directly to space dock approach plane
    this.setCourseToSolarSystem(closest.systemId, closest.id, 8.5);
    this.addLogEvent(
      'NAVIGATION',
      'info',
      `Auto-Navigation engaged to Space Dock: ${closest.name} (${systemName}) at Warp 8.5.`,
      `Distance: ${formatAstronomicalDistance(distKm, 'standard')}. Enterprise will arrive level with the docking bay doors.`
    );
    soundEffects.playLcarsAcknowledge();
    soundEffects.playWarpEngage();
    this.broadcastState(true);

    return { name: closest.name, distance: distKm, directDocked: false };
  }

  // Summon next hostile wave immediately
  public summonHostileFleet() {
    this.combatManager.spawnWave(this.position, this.currentSystemId, this.combatManager.combatWave + 1);
    this.broadcastState(true);
  }

  public getCombatWave(): number {
    return this.combatManager.combatWave;
  }

  public getTotalHostilesDestroyed(): number {
    return this.combatManager.totalHostilesDestroyed;
  }

  public getSectorStatus(): string {
    return this.combatManager.sectorStatusText;
  }

  // Weapons actions with 3D Spatial Audio
  public startPhaserFiring() {
    if (this.phaserEnergy <= 5) return;
    this.isFiringPhasers = true;
    const leftP = this.enterprise.phaserOriginLeft.clone().applyQuaternion(this.orientation).add(this.position);
    soundEffects.playPhaserBeam(leftP);
    this.broadcastState();
  }

  public stopPhaserFiring() {
    this.isFiringPhasers = false;
    this.space.stopPhasers();
    this.broadcastState();
  }

  public firePhotonTorpedo() {
    if (this.torpedoCount <= 0) {
      computerVoice.onTorpedoFired(0);
      return;
    }
    this.torpedoCount -= 1;
    computerVoice.onTorpedoFired(this.torpedoCount);

    // Track combat telemetry for player accuracy and success metrics
    this.combatManager.adaptiveTracker.recordTorpedoFired();

    const launchPos = this.enterprise.torpedoOrigin.clone().applyQuaternion(this.orientation).add(this.position);
    soundEffects.playPhotonTorpedo(launchPos);

    let targetDir = this.forwardVector.clone();
    let targetEnemyId: string | null = null;
    let targetStaticPos: THREE.Vector3 | null = null;

    // Autonomous Warhead Guidance: if no hostile is locked, auto-acquire closest hostile in forward firing arc
    if (!this.lockedEnemyId) {
      const aliveEnemies = this.combatManager.enemyShips.filter((e) => e.isAlive);
      if (aliveEnemies.length > 0) {
        let bestEnemy: typeof aliveEnemies[0] | null = null;
        let bestScore = -Infinity;
        for (const enemy of aliveEnemies) {
          const toEnemy = enemy.mesh.position.clone().sub(launchPos);
          const dist = toEnemy.length();
          const dir = toEnemy.clone().normalize();
          const dot = this.forwardVector.dot(dir);
          // Score prioritizing forward firing cone and closer range
          const score = dot * 3.5 - (dist / 1400);
          if (score > bestScore) {
            bestScore = score;
            bestEnemy = enemy;
          }
        }
        if (bestEnemy) {
          this.lockedEnemyId = bestEnemy.id;
        }
      }
    }

    if (this.lockedEnemyId) {
      const enemy = this.combatManager.enemyShips.find((e) => e.id === this.lockedEnemyId);
      if (enemy && enemy.isAlive) {
        targetEnemyId = enemy.id;
        targetDir = enemy.mesh.position.clone().sub(launchPos).normalize();
      }
    } else if (this.selectedTargetId) {
      const targetObj = this.space.targetMeshes.get(this.selectedTargetId);
      if (targetObj) {
        targetStaticPos = targetObj.position;
        targetDir = targetObj.position.clone().sub(launchPos).normalize();
      }
    }

    this.space.launchTorpedo(launchPos, targetDir, targetEnemyId, targetStaticPos);
    this.addLogEvent(
      'WEAPONS',
      'info',
      'Photon Torpedo Launched',
      targetEnemyId ? 'Antimatter warhead tracking locked hostile' : 'Direct fire ballistic trajectory'
    );
    this.broadcastState(true);
  }

  // --- Main Animation Loop ---
  private animate() {
    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (this.isDestroyed) {
      this.updateCamera(delta, this.clock.getElapsedTime());
      this.renderer.render(this.scene, this.camera);
      this.animFrameId = requestAnimationFrame(this.animate);
      return;
    }

    // Countdown undock cooldown timer
    if (this.undockCooldown > 0) {
      this.undockCooldown = Math.max(0, this.undockCooldown - delta);
    }

    // Evasive Thrusters Boost: discharges while in use; when not docked, slowly recharges in flight
    if (this.isBoostActive) {
      this.boostCharge = Math.max(0, this.boostCharge - delta * 7.7);
      this.boostDuration = (this.boostCharge / 100) * 13.0;
      if (this.boostCharge <= 0) {
        this.stopEvasiveBoost();
      }
    } else if (!this.isDocked && this.boostCharge < 100) {
      this.boostCharge = Math.min(100, this.boostCharge + delta * 1.2);
      this.boostDuration = (this.boostCharge / 100) * 13.0;
    }

    // Auto stand-down to yellow alert when all hostiles in wave are eliminated
    if (this.combatManager.waveStatus === 'cleared' && this.alertLevel === 'red' && this.isUnderAttack) {
      this.setAlertLevel('yellow');
    }

    // 1. Passive Shield Recharge in open flight (when docked, player controls shield/hull/torpedo restoration via HUD)
    const now = performance.now();
    if (!this.isDocked && now - this.lastDamageTime > 2500) {
      this.isUnderAttack = false;
      if (this.shieldsRaised && this.shieldIntegrity < 100) {
        const prev = this.shieldIntegrity;
        this.shieldIntegrity = Math.min(100, this.shieldIntegrity + delta * 6.0);
        if (prev < 100 && this.shieldIntegrity >= 100) {
          this.addLogEvent('DEFENSE', 'success', 'Shields at 100%', 'Multiphasic shield grid recharged to nominal status.');
          this.lastLoggedShieldBracket = 100;
        }
      }
    }

    // Helper to build a horizon-level upright quaternion facing any 3D unit vector (never flips upside down!)
    const makeUprightQuaternion = (dir: THREE.Vector3): THREE.Quaternion => {
      const yaw = Math.atan2(-dir.x, -dir.z);
      const pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -0.92, 0.92));
      return new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
    };

    // Combat Assist Dogfight Auto-Alignment
    if (this.combatAssist && this.lockedEnemyId && !this.isWarping && !this.activeCoursePlot) {
      const enemy = this.combatManager.enemyShips.find((e) => e.id === this.lockedEnemyId);
      if (enemy && enemy.isAlive) {
        const toEnemy = enemy.mesh.position.clone().sub(this.position).normalize();
        const targetQuat = makeUprightQuaternion(toEnemy);
        const steerStrength = this.isFiringPhasers ? 2.8 : 1.4;
        this.orientation.slerp(targetQuat, delta * steerStrength);
      }
    }

    // Decay screen shake
    this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - delta * 2.5);

    // 2. Automatic Course Navigation Flight Logic (Never gets stuck in 'aligning'!)
    if (this.activeCoursePlot && this.activeCoursePlot.isEngaged) {
      const dest = new THREE.Vector3(...this.activeCoursePlot.destinationPos);
      const toDest = dest.clone().sub(this.position);
      const dist = toDest.length();
      this.activeCoursePlot.distance = Math.round(dist);

      const desiredDir = dist > 0.001 ? toDest.clone().normalize() : new THREE.Vector3(0, 0, -1);
      const targetQuat = makeUprightQuaternion(desiredDir);

      if (this.activeCoursePlot.phase === 'aligning') {
        this.orientation.slerp(targetQuat, delta * 6.5);
        this.forwardVector.set(0, 0, -1).applyQuaternion(this.orientation);
        const forwardDot = this.forwardVector.dot(desiredDir);

        if (forwardDot > 0.85 || dist < 350) {
          this.orientation.copy(targetQuat);
          this.activeCoursePlot.phase = 'warping';
          this.isWarping = true;
          this.warpChargeProgress = 0.25;
          soundEffects.playWarpEngage();
          soundEffects.updateImpulseHum(this.throttlePercent, true);
        }
      } else if (this.activeCoursePlot.phase === 'warping') {
        this.orientation.slerp(targetQuat, delta * 5.0);
        this.activeCoursePlot.etaSeconds = this.calculateAccurateEta(dist, this.warpFactor, this.velocity.length());

        const stepDist = this.velocity.length() * delta;

        // Activate destination system when approaching within 15,000 units
        if (dist < 15000 && this.currentSystemId !== this.activeCoursePlot.targetSystem.id) {
          this.currentSystemId = this.activeCoursePlot.targetSystem.id;
          this.space.setActiveSystem?.(this.currentSystemId);
        }

        // Arrival detection: reached safe orbit standoff distance in space
        if (dist <= Math.max(140, stepDist * 1.5) || toDest.dot(this.forwardVector) < 0) {
          this.activeCoursePlot.phase = 'standard_orbit';
          this.activeCoursePlot.isEngaged = false;
          this.activeCoursePlot.distance = 0;
          this.activeCoursePlot.etaSeconds = 0;

          this.isWarping = false;
          this.space.warpEffect?.triggerWarpExitFlash();
          this.throttlePercent = 0; // Stop cleanly at destination so player doesn't overshoot station
          this.velocity.set(0, 0, 0);
          this.position.copy(dest);

          // Turn Enterprise to face planet or space station directly on the horizontal plane
          const planetCenter = new THREE.Vector3(...this.activeCoursePlot.targetPlanet.position);
          const toPlanet = planetCenter.clone().sub(dest).normalize();
          if (toPlanet.lengthSq() > 0.01) {
            this.orientation.copy(makeUprightQuaternion(toPlanet));
          }

          const targetStation = this.activeCoursePlot.targetPlanet;
          this.currentSystemId = this.activeCoursePlot.targetSystem.id;
          this.space.setActiveSystem?.(this.currentSystemId);

          soundEffects.playLcarsAcknowledge();
          soundEffects.updateImpulseHum(this.throttlePercent, false);
          computerVoice.onOrbitalEntry(targetStation.name);
          this.activeCoursePlot = null;
          this.broadcastState(true);
        }
      }
    }

    // 3. Update Space Station & Docking Proximity (780 km range, level or vertical)
    let nearestStation: { id: string; name: string; distance: number; systemName?: string } | null = null;
    if (!this.isDocked && this.undockCooldown <= 0) {
      let minStationDist = Infinity;
      const currentSys = this.space.systems.find((s) => s.id === this.currentSystemId);

      for (const p of this.space.planets) {
        if (p.type === 'starbase') {
          const mesh = this.space.targetMeshes.get(p.id);
          const pos = mesh ? mesh.position : new THREE.Vector3(...p.position);
          const dist = this.position.distanceTo(pos);
          if (dist <= 780 && dist < minStationDist) {
            minStationDist = dist;
            nearestStation = {
              id: p.id,
              name: p.name,
              distance: Math.round(dist),
              systemName: currentSys?.name,
            };
          }
        }
      }
    }
    this.canDockAtStation = nearestStation;

    // Stable free flight: keep current solar system active out to 24,000 units
    if (!this.activeCoursePlot || !this.activeCoursePlot.isEngaged) {
      const currentSys = this.space.systems.find((s) => s.id === this.currentSystemId);
      if (currentSys) {
        const curDx = currentSys.centerCoordinates[0] - this.position.x;
        const curDz = currentSys.centerCoordinates[2] - this.position.z;
        if (curDx * curDx + curDz * curDz > 576000000) {
          for (const sys of this.space.systems) {
            const dx = sys.centerCoordinates[0] - this.position.x;
            const dz = sys.centerCoordinates[2] - this.position.z;
            if (dx * dx + dz * dz < 256000000) {
              this.currentSystemId = sys.id;
              this.space.setActiveSystem?.(sys.id);
              break;
            }
          }
        }
      }
    }

    // 4. Responsive 3D Flight Steering Model (W/Up = Climb Upwards, S/Down = Dive Downwards, Holds Pitch Angle!)
    const isW = this.keysPressed['w'] || this.keysPressed['KeyW'] || this.keysPressed['arrowup'] || this.keysPressed['ArrowUp'];
    const isS = this.keysPressed['s'] || this.keysPressed['KeyS'] || this.keysPressed['arrowdown'] || this.keysPressed['ArrowDown'];
    const isA = this.keysPressed['a'] || this.keysPressed['KeyA'] || this.keysPressed['arrowleft'] || this.keysPressed['ArrowLeft'];
    const isD = this.keysPressed['d'] || this.keysPressed['KeyD'] || this.keysPressed['arrowright'] || this.keysPressed['ArrowRight'];
    const isQ = this.keysPressed['q'] || this.keysPressed['KeyQ'];
    const isE = this.keysPressed['e'] || this.keysPressed['KeyE'];
    const isVertUp = this.keysPressed['PageUp'] || this.keysPressed['pageup'];
    const isVertDown = this.keysPressed['PageDown'] || this.keysPressed['pagedown'];

    // If user manually presses helm keys while course plot is still aligning, cancel auto-align so ship is never stuck
    if (this.activeCoursePlot && this.activeCoursePlot.phase === 'aligning' && (isW || isS || isA || isD)) {
      this.activeCoursePlot.isEngaged = false;
      this.activeCoursePlot = null;
    }

    if (!this.activeCoursePlot || !this.activeCoursePlot.isEngaged) {
      if (this.combatAssist && this.lockedEnemyId) {
        const enemy = this.combatManager.enemyShips.find((e) => e.id === this.lockedEnemyId);
        if (enemy && enemy.isAlive) {
          const toEnemy = enemy.mesh.position.clone().sub(this.position).normalize();
          const enemyQuat = makeUprightQuaternion(toEnemy);
          this.orientation.slerp(enemyQuat, delta * 2.8);
        }
      }

      const currentPitchElevation = this.forwardVector.y; // -1 (down) to +1 (up)

      // W / ArrowUp pitches nose UP (+0.85) to climb toward stations/planets above; S / ArrowDown pitches nose DOWN (-0.85)
      let rawPitch = isW ? 0.85 : isS ? -0.85 : 0;

      if (rawPitch > 0 && currentPitchElevation > 0.90) {
        rawPitch *= Math.max(0, (0.95 - currentPitchElevation) / 0.05);
      } else if (rawPitch < 0 && currentPitchElevation < -0.90) {
        rawPitch *= Math.max(0, (currentPitchElevation - (-0.95)) / 0.05);
      }

      const targetYaw = isA ? 0.75 : isD ? -0.75 : 0;
      const targetRoll = isQ ? 0.75 : isE ? -0.75 : targetYaw * 0.25;

      const steerSpeed = this.isBoostActive ? 10.0 : 6.0;
      this.pitchRate = THREE.MathUtils.lerp(this.pitchRate, rawPitch, delta * steerSpeed);
      this.yawRate = THREE.MathUtils.lerp(this.yawRate, targetYaw, delta * steerSpeed);
      this.rollRate = THREE.MathUtils.lerp(this.rollRate, targetRoll, delta * steerSpeed);

      // Hold the user's chosen pitch angle when W/S is released (do NOT force nose back to y=0!)
      if (rawPitch === 0) {
        this.pitchRate = THREE.MathUtils.lerp(this.pitchRate, 0, delta * 8.0);
      }
      if (targetYaw === 0 && targetRoll === 0) {
        this.rollRate = THREE.MathUtils.lerp(this.rollRate, 0, delta * 7.0);
        this.yawRate = THREE.MathUtils.lerp(this.yawRate, 0, delta * 7.0);
      }

      // Direct vertical thruster boost when holding W/S or PageUp/PageDown so ship can climb/descend even at low throttle
      if (!this.isDocked && !this.isWarping) {
        if (isW || isVertUp) {
          this.position.y += 38 * delta;
        } else if (isS || isVertDown) {
          this.position.y -= 38 * delta;
        }
      }
    }

    // Apply Rotations stably in YXZ order and keep roll level without resetting yaw or pitch!
    const currentEuler = new THREE.Euler().setFromQuaternion(this.orientation, 'YXZ');
    currentEuler.x = THREE.MathUtils.clamp(currentEuler.x + this.pitchRate * delta, -1.35, 1.35);
    currentEuler.y = currentEuler.y + this.yawRate * delta;
    currentEuler.z = THREE.MathUtils.lerp(currentEuler.z + this.rollRate * delta, 0, delta * 4.5);
    this.orientation.setFromEuler(currentEuler);
    this.orientation.normalize();

    // Update coordinate axes
    this.forwardVector.set(0, 0, -1).applyQuaternion(this.orientation);
    this.upVector.set(0, 1, 0).applyQuaternion(this.orientation);
    this.rightVector.set(1, 0, 0).applyQuaternion(this.orientation);

    // 5. Flight Speed & Velocity Update
    let currentSpeed = 0;
    if (this.isWarping) {
      this.warpChargeProgress = Math.min(1.0, this.warpChargeProgress + delta * 1.5);
      let warpSpeed = Math.pow(this.warpFactor, 2.6) * 115;

      // Match course transit speed to calculateWarpTransitTelemetry so actual arrival time matches the displayed ETA
      if (this.activeCoursePlot && this.activeCoursePlot.isEngaged) {
        const dest = new THREE.Vector3(...this.activeCoursePlot.destinationPos);
        const remDist = this.position.distanceTo(dest);
        const telemetry = calculateWarpTransitTelemetry(remDist, this.warpFactor);
        warpSpeed = Math.max(140, telemetry.sceneSpeedUnitsPerSec * 1.15);
      }

      currentSpeed = warpSpeed * this.warpChargeProgress;
    } else if (this.isDocked) {
      currentSpeed = 0;
    } else {
      const effectiveThrottle = this.isBoostActive ? Math.max(this.throttlePercent, 90) : this.throttlePercent;
      currentSpeed = (effectiveThrottle / 100) * (this.isBoostActive ? 260 : 85);
    }

    const desiredVelocity = this.forwardVector.clone().multiplyScalar(currentSpeed);
    this.velocity.lerp(desiredVelocity, delta * (this.isBoostActive ? 10.0 : (this.isDocked ? 12.0 : 5.5)));
    if (this.isDocked) {
      this.velocity.set(0, 0, 0);
    }
    this.position.addScaledVector(this.velocity, delta);

    // Planetary collision check!
    this.checkPlanetaryCollisions();

    // Black Hole Gravitational Pull, Spacetime-Warping Singularity Transit, and White Hole Ejection into Qo'noS!
    this.updateBlackHoleGravitationalMechanic(delta);

    // Apply position & rotation to 3D Enterprise root & Bridge Interior root
    this.enterprise.root.position.copy(this.position);
    this.enterprise.root.quaternion.copy(this.orientation);

    this.bridgeInterior.root.position.copy(this.position);
    this.bridgeInterior.root.quaternion.copy(this.orientation);

    // 5. Enterprise Engine, Hull Damage Shader (< 50% Integrity) & Visuals Update with Distinct Warp Factors
    const time = this.clock.getElapsedTime();
    this.enterprise.controller.setHullIntegrity(this.hullIntegrity);
    this.enterprise.controller.setAlertMode(this.alertLevel === 'red' ? 'red' : this.alertLevel === 'yellow' ? 'yellow' : 'normal');
    this.enterprise.controller.setWarpActive(this.isWarping);
    this.enterprise.controller.update(delta, time);

    const factorNorm = Math.min(1.0, Math.max(0.1, this.warpFactor / 9.9));
    const warpIntensity = this.isWarping
      ? 2.8 + factorNorm * 3.4 + Math.sin(time * (16 + factorNorm * 22)) * (0.8 + factorNorm * 0.8)
      : 1.0;

    const bussardPulse = 1.8 + Math.sin(time * (6 + (this.isWarping ? factorNorm * 18 : 0))) * 0.5;
    (this.enterprise.bussardLeft.material as THREE.MeshStandardMaterial).emissiveIntensity = bussardPulse * warpIntensity;
    (this.enterprise.bussardRight.material as THREE.MeshStandardMaterial).emissiveIntensity = bussardPulse * warpIntensity;
    this.enterprise.bussardGlowLeft.intensity = 2.4 * warpIntensity;
    this.enterprise.bussardGlowRight.intensity = 2.4 * warpIntensity;

    const coilIntensity = this.isWarping
      ? 3.6 + factorNorm * 4.6 + Math.sin(time * (24 + factorNorm * 32)) * (1.2 + factorNorm * 1.5)
      : 1.2;
    (this.enterprise.warpCoilsLeft.material as THREE.MeshStandardMaterial).emissiveIntensity = coilIntensity;
    (this.enterprise.warpCoilsRight.material as THREE.MeshStandardMaterial).emissiveIntensity = coilIntensity;

    // Warp coil energetic plasma color shift:
    if (this.isWarping) {
      if (this.warpFactor >= 9.0) {
        (this.enterprise.warpCoilsLeft.material as THREE.MeshStandardMaterial).emissive.setHex(0xe0f2fe);
        (this.enterprise.warpCoilsRight.material as THREE.MeshStandardMaterial).emissive.setHex(0xe0f2fe);
      } else if (this.warpFactor >= 6.0) {
        (this.enterprise.warpCoilsLeft.material as THREE.MeshStandardMaterial).emissive.setHex(0x38bdf8);
        (this.enterprise.warpCoilsRight.material as THREE.MeshStandardMaterial).emissive.setHex(0x38bdf8);
      } else {
        (this.enterprise.warpCoilsLeft.material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
        (this.enterprise.warpCoilsRight.material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
      }
    } else {
      (this.enterprise.warpCoilsLeft.material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
      (this.enterprise.warpCoilsRight.material as THREE.MeshStandardMaterial).emissive.setHex(0x0284c7);
    }

    const deflectorPulse = 2.4 + Math.sin(time * 6) * 0.4;
    (this.enterprise.deflectorDish.material as THREE.MeshStandardMaterial).emissiveIntensity = deflectorPulse * warpIntensity;
    this.enterprise.deflectorGlow.intensity = 3.2 * warpIntensity;

    const impulseGlowAmount = (this.throttlePercent / 100) * 2.8;
    (this.enterprise.impulseEngine.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + impulseGlowAmount;
    this.enterprise.impulseGlow.intensity = 0.5 + impulseGlowAmount;

    // Shield Bubble visual ripple
    if (this.shieldsRaised) {
      const shieldMat = this.enterprise.shieldBubble.material as THREE.MeshStandardMaterial;
      const baseOpacity = 0.22 * (this.shieldIntegrity / 100);
      shieldMat.opacity = THREE.MathUtils.lerp(shieldMat.opacity, baseOpacity, delta * 3);
      if (this.alertLevel === 'red' || this.isUnderAttack) {
        shieldMat.emissive.setHex(0xef4444);
        shieldMat.color.setHex(0xf87171);
      } else {
        shieldMat.emissive.setHex(0x0284c7);
        shieldMat.color.setHex(0x38bdf8);
      }
    }

    if (this.viewMode === 'interior_bridge') {
      this.bridgeInterior.update(delta, this.alertLevel === 'red', this.isWarping);
    }

    // 6. Combat AI & Enemy Fleet Update with full 3D velocity vector for predictive lead-aiming
    this.combatManager.update(delta, this.position, this.velocity, this.currentSystemId, (damage) => {
      this.applyDamageToEnterprise(damage);
    });

    // 6B. Update Live Station Operations Subsystems & Gradual Procedural Drone Repairs (When Docked)
    if (this.isDocked && this.stationOpsState) {
      // Drones gradually restore hull integrity over time rather than instant static fix
      if (this.stationOpsState.dronesDeployed && this.hullIntegrity < 100) {
        const rate = this.stationOpsState.repairRatePerSec;
        this.hullIntegrity = Math.min(100, this.hullIntegrity + rate * delta);
        this.enterprise.controller.setHullIntegrity(this.hullIntegrity);
        this.stationOpsState.hullIntegrity = this.hullIntegrity;
        this.stationOpsState.estimatedSecondsRemaining = Math.max(0, Math.ceil((100 - this.hullIntegrity) / rate));
        this.stationOpsState.scorchCleanedPercent = Math.min(100, Math.max(0, (this.hullIntegrity - 30) * 1.43));
        if (this.hullIntegrity >= 100) {
          this.stationOpsState.isRepairComplete = true;
          this.stationOpsState.dronesDeployed = false;
          if (this.dockedStationId) {
            setStationDronesState(this.dockedStationId, false, 0, this.position, this.orientation);
          }
          soundEffects.playLcarsAcknowledge();
          soundEffects.playLcarsBeep(880, 0.2);
          this.addLogEvent(
            'DEFENSE',
            'success',
            'Hull restoration complete (100%). Procedural scorch marks and structural breaches sealed to frontline Starfleet standards.',
            'Repair drones recalled to hangar alcoves.'
          );
        }
      }

      if (this.stationOpsState.isRefuelingAntimatter) {
        this.stationOpsState.antimatterLevel = Math.min(100, this.stationOpsState.antimatterLevel + delta * 18);
        this.stationOpsState.deuteriumLevel = Math.min(100, this.stationOpsState.deuteriumLevel + delta * 18);
        this.stationOpsState.antimatterFlowRate = 22.5;
        this.boostCharge = Math.min(100, this.boostCharge + delta * 18);
        this.boostDuration = (this.boostCharge / 100) * 13.0;
        this.shieldIntegrity = Math.min(100, this.shieldIntegrity + delta * 18);
        this.phaserEnergy = Math.min(100, this.phaserEnergy + delta * 22);
        if (
          this.stationOpsState.antimatterLevel >= 100 &&
          this.boostCharge >= 100 &&
          this.shieldIntegrity >= 100
        ) {
          this.stationOpsState.isRefuelingAntimatter = false;
          this.stationOpsState.isRefuelingDeuterium = false;
          this.stationOpsState.antimatterFlowRate = 0;
          soundEffects.playLcarsAcknowledge();
          this.addLogEvent(
            'DEFENSE',
            'success',
            'Antimatter pods, Evasive Boost Overdrive, and Multiphasic Shields recharged to 100%.'
          );
        }
      }

      if (this.stationOpsState.isReloadingTorpedoes) {
        this.torpedoCount = Math.min(30, this.torpedoCount + delta * 5);
        this.stationOpsState.torpedoCount = Math.round(this.torpedoCount);
        if (this.torpedoCount >= 30) {
          this.stationOpsState.isReloadingTorpedoes = false;
          soundEffects.playLcarsAcknowledge();
          this.addLogEvent('WEAPONS', 'success', `Photon torpedo magazines fully reloaded (30/30 ${this.stationOpsState.selectedTorpedoType.toUpperCase()} warheads loaded).`);
        }
      }

      if (this.stationOpsState.isPurgingCoolant) {
        this.stationOpsState.coolantTempKelvin = Math.max(118, this.stationOpsState.coolantTempKelvin - delta * 45);
        this.stationOpsState.coolantToxicityPercent = Math.max(2, this.stationOpsState.coolantToxicityPercent - delta * 20);
        this.stationOpsState.radiatorEfficiencyPercent = Math.min(99, this.stationOpsState.radiatorEfficiencyPercent + delta * 8);
        if (this.stationOpsState.coolantTempKelvin <= 118) {
          this.stationOpsState.isPurgingCoolant = false;
          soundEffects.playLcarsAcknowledge();
          this.addLogEvent('DEFENSE', 'success', 'Warp core reactor coolant loop purged. Radiators operating at 99% thermal efficiency.');
        }
      }

      // Update active drone orientation and target tracking every frame
      if (this.dockedStationId && this.stationOpsState.dronesDeployed) {
        setStationDronesState(
          this.dockedStationId,
          true,
          this.stationOpsState.droneCount,
          this.position,
          this.orientation
        );
      }
    }

    // 7. Tactical Weapons Fire targeting enemy ships or objects
    let targetWorldPos: THREE.Vector3 | null = null;

    if (this.lockedEnemyId) {
      const enemy = this.combatManager.enemyShips.find((e) => e.id === this.lockedEnemyId);
      if (enemy && enemy.isAlive) {
        targetWorldPos = enemy.mesh.position;
      } else {
        this.lockedEnemyId = null;
      }
    } else if (this.selectedTargetId) {
      const targetObj = this.space.targetMeshes.get(this.selectedTargetId);
      if (targetObj) targetWorldPos = targetObj.position;
    }

    // Update 3-Second Torpedo Guidance Lock Timer & Phaser Thermal Heat Bar
    const hwState = this.bridgeInterior.getHardwareState();
    const wpnPowerScale = Math.max(0.5, hwState.powerWeapons / 33);
    if (this.lockedEnemyId || this.selectedTargetId) {
      this.torpedoLockTimer = Math.min(3.0, this.torpedoLockTimer + delta * wpnPowerScale);
    } else {
      this.torpedoLockTimer = 0.0;
    }

    if (this.isFiringPhasers && this.phaserEnergy > 0) {
      this.phaserEnergy = Math.max(0, this.phaserEnergy - delta * 14);
      this.phaserThermalHeat = Math.min(100, this.phaserThermalHeat + delta * 24);
      const leftP = this.enterprise.phaserOriginLeft.clone().applyQuaternion(this.orientation).add(this.position);
      const rightP = this.enterprise.phaserOriginRight.clone().applyQuaternion(this.orientation).add(this.position);
      this.space.firePhasers(leftP, rightP, targetWorldPos, this.forwardVector);

      // Heavy Flagship Phaser beam damage against locked hostile
      if (this.lockedEnemyId) {
        const destroyed = this.combatManager.hitEnemy(this.lockedEnemyId, delta * 58 * wpnPowerScale);
        if (destroyed) {
          this.lockedEnemyId = null;
          this.broadcastState(true);
        }
      }

      if (this.phaserEnergy <= 0 || this.phaserThermalHeat >= 99) {
        this.stopPhaserFiring();
      }
    } else {
      this.phaserEnergy = Math.min(100, this.phaserEnergy + delta * 16 * wpnPowerScale);
      this.phaserThermalHeat = Math.max(6, this.phaserThermalHeat - delta * 12 * wpnPowerScale);
    }

    // 8. Camera Choreography (Stable, No High-Frequency Jitter)
    this.updateCamera(delta, time);

    // 9. Update Space Environment with swept torpedo hit detection against enemy warships!
    this.space.update(
      delta,
      this.isWarping,
      this.warpFactor,
      this.position,
      this.orientation,
      this.camera,
      (torpedoPos, prevPos) => {
        const hitRes = this.combatManager.checkTorpedoHits(torpedoPos, prevPos, 80);
        if (hitRes.hit) {
          // If player did not have a target locked, immediately lock onto the hit enemy so their shield gauge is visible!
          if (!this.lockedEnemyId && hitRes.enemyId) {
            this.lockedEnemyId = hitRes.enemyId;
          }
          if (hitRes.destroyed && hitRes.enemyId === this.lockedEnemyId) {
            this.lockedEnemyId = null;
          }
          this.broadcastState(true);
          return true;
        }
        return false;
      },
      (enemyId, currentPos) => {
        if (enemyId) {
          const enemy = this.combatManager.enemyShips.find((e) => e.id === enemyId && e.isAlive);
          if (enemy) return enemy.mesh.position;
        }
        // Autonomous proximity seeking for torpedoes without explicit target or if target is dead:
        if (currentPos) {
          const aliveEnemies = this.combatManager.enemyShips.filter((e) => e.isAlive);
          let closest: typeof aliveEnemies[0] | null = null;
          let minDist = 850;
          for (const e of aliveEnemies) {
            const d = e.mesh.position.distanceTo(currentPos);
            if (d < minDist) {
              minDist = d;
              closest = e;
            }
          }
          if (closest) return closest.mesh.position;
        }
        return null;
      }
    );

    // 9B. Update Navigational Dotted-Line Path to Selected Destination
    let targetNavPos: THREE.Vector3 | null = null;
    let targetNavRadius = 30;

    if (this.lockedEnemyId) {
      const enemy = this.combatManager.enemyShips.find((e) => e.id === this.lockedEnemyId && e.isAlive);
      if (enemy) {
        targetNavPos = enemy.mesh.position;
        targetNavRadius = 20;
      }
    } else if (this.selectedTargetId) {
      const tMesh = this.space.targetMeshes.get(this.selectedTargetId);
      if (tMesh) {
        targetNavPos = tMesh.position;
      } else {
        const planet = this.space.planets.find((p) => p.id === this.selectedTargetId);
        if (planet) {
          targetNavPos = new THREE.Vector3(...planet.position);
          targetNavRadius = planet.radius || 30;
        }
      }
      if (targetNavPos) {
        const planet = this.space.planets.find((p) => p.id === this.selectedTargetId);
        if (planet) targetNavRadius = planet.radius || 30;
      }
    }

    this.navPathGuide.update(this.position, this.forwardVector, targetNavPos, targetNavRadius, delta, time);

    // 9C. Update Starfleet Mission Waypoint Compass Telemetry & 3D Mission VFX
    this.updateStarfleetMissionState(delta, time);

    // 10. Throttled UI State Broadcast (15 Hz - Eliminates React render lag!)
    this.broadcastState();

    // 11. Dynamic Surround-Based Lighting & Contrast Rig (Matching Shivam180709/Enterprise-Model)
    this.updateSurroundLighting(delta);

    // 12. Render with runtime protection (including Live Forward Viewscreen Pass when inside 3D Bridge)
    try {
      if (this.viewMode === 'interior_bridge') {
        // Render live outer-space camera onto the curved Main Viewscreen & Tactical Upper Monitor Live Feed!
        const vsCam = this.bridgeInterior.viewscreenCamera;
        const bowEye = this.position
          .clone()
          .add(this.forwardVector.clone().multiplyScalar(14))
          .add(this.upVector.clone().multiplyScalar(3.5));

        let bowLook = bowEye.clone().add(this.forwardVector.clone().multiplyScalar(500));

        // When an enemy ship is locked (or when at Tactical Station), track the locked enemy or selected target
        // so the player can clearly see and pinpoint the target on the Live Tactical Viewscreen & Main Viewscreen!
        if (this.lockedEnemyId) {
          const lockedEnemy = this.combatManager.enemyShips.find(
            (e) => e.id === this.lockedEnemyId && e.isAlive && e.mesh
          );
          if (lockedEnemy && lockedEnemy.mesh) {
            const toEnemy = lockedEnemy.mesh.position.clone().sub(bowEye);
            if (this.activeBridgeStation === 'tactical' || this.forwardVector.dot(toEnemy.clone().normalize()) > 0.25) {
              bowLook.copy(lockedEnemy.mesh.position);
            }
          }
        } else if (this.activeBridgeStation === 'tactical' && this.selectedTargetId) {
          const tMesh = this.space.targetMeshes.get(this.selectedTargetId);
          if (tMesh) {
            bowLook.copy(tMesh.position);
          }
        }

        vsCam.position.copy(bowEye);
        vsCam.up.copy(this.upVector);
        vsCam.lookAt(bowLook);

        this.bridgeInterior.root.visible = false;
        this.renderer.setRenderTarget(this.bridgeInterior.viewscreenRenderTarget);
        this.renderer.render(this.scene, vsCam);
        this.renderer.setRenderTarget(null);
        this.bridgeInterior.root.visible = true;
      }

      this.renderer.render(this.scene, this.camera);
    } catch (renderErr) {
      this.renderer.setRenderTarget(null);
      console.warn('Frame render error caught:', renderErr);
    }

    this.animFrameId = requestAnimationFrame(this.animate);
  }

  /**
   * Adapts lighting intensity, tone mapping exposure, stellar key light color,
   * and deep space contrast according to the ship's surrounding environment:
   * - Drydock: Soft balanced station floodlighting and gentle reflections
   * - Solar: Brilliant solar radiation, sharp key light from primary star, specular glints
   * - Deep Space: Deep obsidian contrast, low ambient fill, crisp cool blue rim light
   * - Cinematic: Standard balanced deep-space cruise matching reference
   */
  private updateSurroundLighting(delta: number) {
    let targetExposure = 0.80;
    let targetLightIntensity = 0.75;
    let targetAmbientFill = 0.12;
    const starColorHex = getSystemStarColor(this.currentSystemId);
    const targetStarColor = new THREE.Color(starColorHex);

    const distToCenter = this.position.length();

    if (this.isDocked || (this.canDockAtStation && this.canDockAtStation.distance < 1200)) {
      // Drydock / Starbase approach: soft ambient fill, balanced reflections
      targetExposure = 0.88;
      targetLightIntensity = 0.60;
      targetAmbientFill = 0.28;
      targetStarColor.setHex(0xf8fafc);
    } else if (distToCenter < 3200) {
      // Solar proximity - approaching system primary star
      const solarFactor = 1.0 - Math.min(1.0, distToCenter / 3200);
      targetExposure = THREE.MathUtils.lerp(0.80, 1.00, solarFactor);
      targetLightIntensity = THREE.MathUtils.lerp(0.75, 0.95, solarFactor);
      targetAmbientFill = THREE.MathUtils.lerp(0.12, 0.20, solarFactor);
    } else if (distToCenter > 6500 || this.currentSystemId === 'briar_patch_sector' || this.currentSystemId === 'mutara_sector') {
      // Deep Space / Nebula void: high contrast, razor-sharp edge definition
      targetExposure = 0.68;
      targetLightIntensity = 0.65;
      targetAmbientFill = 0.06;
    }

    // Smoothly damp lighting and tone mapping transitions
    const dampRate = Math.min(1.0, delta * 2.8);
    this.currentExposure = THREE.MathUtils.lerp(this.currentExposure, targetExposure, dampRate);
    this.currentLightIntensity = THREE.MathUtils.lerp(this.currentLightIntensity, targetLightIntensity, dampRate);
    this.currentAmbientFill = THREE.MathUtils.lerp(this.currentAmbientFill, targetAmbientFill, dampRate);

    this.renderer.toneMappingExposure = this.currentExposure;
    this.shipKeyStar.intensity = this.currentLightIntensity;
    this.shipKeyStar.color.lerp(targetStarColor, dampRate);
    this.shipHemiLight.intensity = this.currentAmbientFill;
    this.shipRimLight.intensity = this.currentAmbientFill * 2.2;

    // Anchor cinematic lighting rig relative to Enterprise position
    this.shipKeyStar.position.copy(this.position).add(new THREE.Vector3(38, 44, -28));
    this.shipRimLight.position.copy(this.position).add(new THREE.Vector3(-42, 18, 32));
    this.shipUnderWarm.position.copy(this.position).add(new THREE.Vector3(0, -32, -12));
  }

  private updateCamera(delta: number, time: number) {
    const shipPos = this.position;
    const forward = this.forwardVector;
    const up = this.upVector;
    const right = this.rightVector;

    // Constant, stable camera FOV during normal flight, with dramatic relativistic lensing FOV expansion inside the Black Hole's spacetime warp!
    let targetFov = 54 + (this.isBoostActive ? 6 : 0);
    if (this.viewMode === 'interior_bridge') {
      const stationPreset = this.bridgeInterior.stationPresets[this.activeBridgeStation];
      if (stationPreset) targetFov = stationPreset.fov;
    }
    if (this.blackHoleTransit?.active) {
      if (this.blackHoleTransit.phase === 'pulling') {
        targetFov = 54 + this.blackHoleTransit.progress * 18;
      } else if (this.blackHoleTransit.phase === 'infall') {
        targetFov = 72 + this.blackHoleTransit.progress * 26;
      } else if (this.blackHoleTransit.phase === 'singularity') {
        targetFov = 98 + Math.sin(time * 18) * 4;
      } else if (this.blackHoleTransit.phase === 'ejection') {
        targetFov = THREE.MathUtils.lerp(96, 54, this.blackHoleTransit.progress);
      }
    }
    const effectiveFov = (this.viewMode === 'bridge' || this.viewMode === 'interior_bridge')
      ? THREE.MathUtils.clamp(targetFov * this.cameraZoom, 26, 108)
      : targetFov;
    if (Math.abs(this.camera.fov - effectiveFov) > 0.1) {
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, effectiveFov, delta * (this.blackHoleTransit?.active ? 7.0 : 4.0));
      this.camera.updateProjectionMatrix();
    }

    switch (this.viewMode) {
      case 'interior_bridge': {
        const preset =
          this.bridgeInterior.stationPresets[this.activeBridgeStation] ||
          this.bridgeInterior.stationPresets.captain;

        // Smoothly interpolate local eye position, local look target, and look-around angles in Bridge-Local space
        const posLerp = Math.min(1.0, delta * 8.0);
        const lookLerp = Math.min(1.0, delta * 14.0);
        this.currentBridgeLocalEye.lerp(preset.eyePos, posLerp);
        this.currentBridgeLocalLook.lerp(preset.lookTarget, posLerp);

        this.smoothedBridgeLookAngle.yaw = THREE.MathUtils.lerp(
          this.smoothedBridgeLookAngle.yaw,
          this.bridgeLookAngle.yaw,
          lookLerp
        );
        this.smoothedBridgeLookAngle.pitch = THREE.MathUtils.lerp(
          this.smoothedBridgeLookAngle.pitch,
          this.bridgeLookAngle.pitch,
          lookLerp
        );

        // Apply 360-degree look-around yaw & pitch offset relative to the station's base look direction
        const baseDirLocal = this.currentBridgeLocalLook
          .clone()
          .sub(this.currentBridgeLocalEye)
          .normalize();
        const baseYaw = Math.atan2(baseDirLocal.x, -baseDirLocal.z);
        const basePitch = Math.asin(THREE.MathUtils.clamp(baseDirLocal.y, -0.95, 0.95));

        const finalYaw = baseYaw - this.smoothedBridgeLookAngle.yaw;
        const finalPitch = THREE.MathUtils.clamp(
          basePitch + this.smoothedBridgeLookAngle.pitch,
          -1.42,
          1.42
        );

        const rotatedLookLocal = new THREE.Vector3(
          Math.sin(finalYaw) * Math.cos(finalPitch),
          Math.sin(finalPitch),
          -Math.cos(finalYaw) * Math.cos(finalPitch)
        );
        const lookWorld = rotatedLookLocal.clone().applyQuaternion(this.orientation);

        // Apply POV Zoom In / Zoom Out dolly offset (matching outside ship POV zoom!)
        const zoomDolly = (1.0 - this.cameraZoom) * 1.15;
        const bridgeWorldEye = this.currentBridgeLocalEye
          .clone()
          .applyQuaternion(this.orientation)
          .add(shipPos)
          .add(lookWorld.clone().multiplyScalar(zoomDolly));

        this.targetCameraPos.copy(bridgeWorldEye);
        this.targetLookAt.copy(bridgeWorldEye).add(lookWorld.multiplyScalar(40));
        break;
      }

      case 'chase': {
        // Iconic third-person flight chase camera:
        // Positioned behind and slightly above the twin warp nacelles & glowing impulse engines,
        // looking forward over the primary saucer with U.S.S. ENTERPRISE & NCC-1701 clearly visible,
        // perfectly framing the flight path and combat reticle ahead!
        const dist = 34 * this.cameraZoom;
        const height = 9.2 * Math.max(0.6, Math.sqrt(this.cameraZoom));
        const offset = forward.clone().multiplyScalar(-dist).add(up.clone().multiplyScalar(height));
        this.targetCameraPos.copy(shipPos).add(offset);
        this.targetLookAt.copy(shipPos).add(forward.clone().multiplyScalar(28));
        break;
      }

      case 'bridge': {
        const bridgeOffset = up.clone().multiplyScalar(5.5).add(forward.clone().multiplyScalar(8.2));
        this.targetCameraPos.copy(shipPos).add(bridgeOffset);
        this.targetLookAt.copy(shipPos).add(bridgeOffset).add(forward.clone().multiplyScalar(200));
        break;
      }

      case 'beauty': {
        // 3/4 Cinematic Starfleet showcase beauty angle
        const beautyOffset = right.clone().multiplyScalar(26 * this.cameraZoom)
          .add(up.clone().multiplyScalar(9.5 * Math.sqrt(this.cameraZoom)))
          .add(forward.clone().multiplyScalar(22 * this.cameraZoom));
        this.targetCameraPos.copy(shipPos).add(beautyOffset);
        this.targetLookAt.copy(shipPos);
        break;
      }

      case 'bow': {
        // Direct head-on front bow angle
        const bowOffset = forward.clone().multiplyScalar(36 * this.cameraZoom)
          .add(up.clone().multiplyScalar(1.5));
        this.targetCameraPos.copy(shipPos).add(bowOffset);
        this.targetLookAt.copy(shipPos);
        break;
      }

      case 'stern': {
        // Direct aft stern angle looking into impulse and nacelle exhausts
        const sternOffset = forward.clone().multiplyScalar(-38 * this.cameraZoom)
          .add(up.clone().multiplyScalar(2.5));
        this.targetCameraPos.copy(shipPos).add(sternOffset);
        this.targetLookAt.copy(shipPos);
        break;
      }

      case 'registry': {
        // Close-up inspection focused directly on the bold NCC-1701 decal and bridge
        const regOffset = up.clone().multiplyScalar(13 * Math.sqrt(this.cameraZoom))
          .add(forward.clone().multiplyScalar(4 * this.cameraZoom));
        this.targetCameraPos.copy(shipPos).add(regOffset);
        this.targetLookAt.copy(shipPos).add(forward.clone().multiplyScalar(9));
        break;
      }

      case 'cinematic': {
        const cinRadius = 55 * this.cameraZoom;
        const angle = time * 0.15;
        const cx = Math.sin(angle) * cinRadius;
        const cz = Math.cos(angle) * cinRadius;
        const cy = (Math.sin(time * 0.2) * 14 + 6) * Math.sqrt(this.cameraZoom);
        this.targetCameraPos.set(shipPos.x + cx, shipPos.y + cy, shipPos.z + cz);
        this.targetLookAt.copy(shipPos);
        break;
      }

      case 'saucer': {
        const saucerOffset = up.clone().multiplyScalar(6.5 * Math.sqrt(this.cameraZoom)).add(forward.clone().multiplyScalar(2.0 * this.cameraZoom));
        this.targetCameraPos.copy(shipPos).add(saucerOffset);
        this.targetLookAt.copy(shipPos).add(forward.clone().multiplyScalar(60));
        break;
      }

      case 'nacelle': {
        const nacelleOffset = right.clone().multiplyScalar(8.8 * Math.sqrt(this.cameraZoom))
          .add(up.clone().multiplyScalar(7.2 * Math.sqrt(this.cameraZoom)))
          .add(forward.clone().multiplyScalar(-10.0 * this.cameraZoom));
        this.targetCameraPos.copy(shipPos).add(nacelleOffset);
        this.targetLookAt.copy(shipPos).add(forward.clone().multiplyScalar(60));
        break;
      }

      case 'deflector': {
        const deflOffset = forward.clone().multiplyScalar(24 * this.cameraZoom).add(up.clone().multiplyScalar(-4.5 * Math.sqrt(this.cameraZoom)));
        this.targetCameraPos.copy(shipPos).add(deflOffset);
        this.targetLookAt.copy(shipPos).add(forward.clone().multiplyScalar(4));
        break;
      }

      case 'spacedock_bay': {
        // Spacedock Interior Hangar Bay view:
        // Positioned behind the Enterprise along the illuminated hangar bay runway,
        // looking through the illuminated gantry ribs toward the atmospheric force-field doors and space!
        const bayBackOffset = forward.clone().multiplyScalar(-34 * this.cameraZoom).add(up.clone().multiplyScalar(9.5 * Math.sqrt(this.cameraZoom)));
        this.targetCameraPos.copy(shipPos).add(bayBackOffset);
        this.targetLookAt.copy(shipPos).add(forward.clone().multiplyScalar(80));
        break;
      }

      case 'orbit': {
        let centerPoint = shipPos.clone();

        if (this.focusedSubsystemKey && this.enterprise.subsystemNodes.has(this.focusedSubsystemKey)) {
          const localNode = this.enterprise.subsystemNodes.get(this.focusedSubsystemKey)!;
          const worldNode = localNode.clone().applyQuaternion(this.orientation).add(shipPos);
          centerPoint.copy(worldNode);
          this.orbitAngle.radius = Math.min(this.orbitAngle.radius, 32);
        }

        const r = this.orbitAngle.radius * this.cameraZoom;
        const ox = r * Math.sin(this.orbitAngle.phi) * Math.sin(this.orbitAngle.theta);
        const oy = r * Math.cos(this.orbitAngle.phi);
        const oz = r * Math.sin(this.orbitAngle.phi) * Math.cos(this.orbitAngle.theta);

        this.targetCameraPos.copy(centerPoint).add(new THREE.Vector3(ox, oy, oz));
        this.targetLookAt.copy(centerPoint);
        break;
      }
    }

    // Apply subtle screen shake if damaged
    if (this.screenShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * (this.viewMode === 'interior_bridge' ? 0.35 : 1.5);
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * (this.viewMode === 'interior_bridge' ? 0.35 : 1.5);
      this.targetCameraPos.x += shakeX;
      this.targetCameraPos.y += shakeY;
    }

    // Camera positioning:
    // In interior_bridge, use smooth Vector3.lerp for position and Quaternion.slerp for rotation!
    if (this.viewMode === 'interior_bridge') {
      this.camera.position.copy(this.targetCameraPos);
      this.camera.up.copy(this.upVector);

      const lookMat = new THREE.Matrix4().lookAt(
        this.camera.position,
        this.targetLookAt,
        this.upVector
      );
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMat);
      if (!this.isBridgeQuatInitialized) {
        this.currentBridgeCameraQuat.copy(targetQuat);
        this.isBridgeQuatInitialized = true;
      } else {
        this.currentBridgeCameraQuat.slerp(targetQuat, Math.min(1.0, delta * 12.0));
      }
      this.camera.quaternion.copy(this.currentBridgeCameraQuat);
    } else if (this.isWarping) {
      this.isBridgeQuatInitialized = false;
      this.camera.position.copy(this.targetCameraPos);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(this.targetLookAt);
    } else {
      this.isBridgeQuatInitialized = false;
      this.camera.position.lerp(this.targetCameraPos, delta * 8.5);
      this.camera.up.set(0, 1, 0);
      this.camera.lookAt(this.targetLookAt);
    }

    // Update 3D Positional Spatial Audio listener orientation & thruster sound
    soundEffects.updateListener(this.camera.position, this.forwardVector, this.upVector);
    soundEffects.updateImpulseHum(this.throttlePercent, this.isWarping);
  }

  private broadcastState(force: boolean = false) {
    if (!this.onStateChangeCallback) return;

    const now = performance.now();
    // Throttle React state updates to 15 Hz unless forced
    if (!force && now - this.lastBroadcastTime < 60) {
      return;
    }
    this.lastBroadcastTime = now;

    const liveSceneSpeed =
      this.isDocked || (!this.isWarping && !this.isBoostActive && this.throttlePercent <= 0 && this.velocity.length() < 0.5)
        ? 0
        : this.velocity.length();
    const displaySpeed = Math.round(liveSceneSpeed * (149597870.7 / 235));

    const currentSys = this.space.systems.find((s) => s.id === this.currentSystemId);
    const lockedEnemy = this.lockedEnemyId
      ? this.combatManager.enemyShips.find((e) => e.id === this.lockedEnemyId)?.toState(this.position) || null
      : null;

    let selectedTargetPosition: [number, number, number] | undefined = undefined;
    if (this.lockedEnemyId) {
      const e = this.combatManager.enemyShips.find((en) => en.id === this.lockedEnemyId);
      if (e && e.mesh) {
        selectedTargetPosition = [Math.round(e.mesh.position.x), Math.round(e.mesh.position.y), Math.round(e.mesh.position.z)];
      }
    } else if (this.selectedTargetId) {
      const mesh = this.space.targetMeshes.get(this.selectedTargetId);
      if (mesh) {
        selectedTargetPosition = [Math.round(mesh.position.x), Math.round(mesh.position.y), Math.round(mesh.position.z)];
      } else {
        const p = this.space.planets.find((pl) => pl.id === this.selectedTargetId);
        if (p) selectedTargetPosition = [...p.position];
      }
    } else if (this.activeCoursePlot?.destinationPos) {
      selectedTargetPosition = [...this.activeCoursePlot.destinationPos];
    }

    // Detect whatever celestial body or hostile ship is currently visible on the Forward Main Viewscreen
    let viewscreenTargetId: string | null = null;
    let viewscreenTargetBearingDeg: number = 0;
    let bestViewScore = -1;

    // 1. Check alive hostile vessels in front of the bow
    for (const enemy of this.combatManager.enemyShips) {
      if (enemy.isAlive && enemy.mesh) {
        const toE = enemy.mesh.position.clone().sub(this.position);
        const dist = toE.length();
        if (dist > 1 && dist < 8500) {
          const dir = toE.clone().normalize();
          const dot = this.forwardVector.dot(dir);
          if (dot > 0.82 && dot > bestViewScore) {
            bestViewScore = dot;
            viewscreenTargetId = enemy.id;
            viewscreenTargetBearingDeg = Math.round(
              Math.atan2(this.rightVector.dot(dir), dot) * (180 / Math.PI)
            );
          }
        }
      }
    }

    // 2. Check planets, starbases, moons, and anomalies in the current solar system
    if (currentSys) {
      for (const p of currentSys.planets) {
        const mesh = this.space.targetMeshes.get(p.id);
        const pos = mesh ? mesh.position : new THREE.Vector3(...p.position);
        const toP = pos.clone().sub(this.position);
        const dist = toP.length();
        if (dist > 1 && dist < 28000) {
          const dir = toP.clone().normalize();
          const dot = this.forwardVector.dot(dir);
          // Weight by angular alignment so whatever planet/starbase is centered on the viewscreen wins
          const score = dot - (dist / 120000);
          if (dot > 0.78 && score > bestViewScore) {
            bestViewScore = score;
            viewscreenTargetId = p.id;
            viewscreenTargetBearingDeg = Math.round(
              Math.atan2(this.rightVector.dot(dir), dot) * (180 / Math.PI)
            );
          }
        }
      }

      // 3. Also check the primary star of the current system
      const starPos = new THREE.Vector3(...currentSys.centerCoordinates);
      const toStar = starPos.clone().sub(this.position);
      const starDist = toStar.length();
      if (starDist > 1 && starDist < 32000) {
        const dir = toStar.clone().normalize();
        const dot = this.forwardVector.dot(dir);
        const score = dot - 0.04;
        if (dot > 0.84 && score > bestViewScore) {
          bestViewScore = score;
          viewscreenTargetId = `${currentSys.id}_primary_star`;
          viewscreenTargetBearingDeg = Math.round(
            Math.atan2(this.rightVector.dot(dir), dot) * (180 / Math.PI)
          );
        }
      }
    }

    // Fallback to selectedTargetId if nothing is directly in the narrow center cone
    if (!viewscreenTargetId) {
      viewscreenTargetId = this.lockedEnemyId || this.selectedTargetId || 'sol_earth';
    }

    // Sync live telemetry to all 3D Diegetic Bridge Consoles & 3D Main Viewscreen Corner Overlay
    const liveHeadingDeg = Math.round(
      ((Math.atan2(this.forwardVector.x, -this.forwardVector.z) * 180) / Math.PI + 360) % 360
    );
    const livePitchDeg = Math.round(
      Math.asin(THREE.MathUtils.clamp(this.forwardVector.y, -1, 1)) * (180 / Math.PI)
    );
    const enemyStates = this.combatManager.getEnemyStates(this.position);
    const aliveHostilesCount = enemyStates.filter((e) => e.isAlive).length;
    const details = getObjectDetails(
      viewscreenTargetId || this.selectedTargetId || 'sol_earth',
      { x: this.position.x, y: this.position.y, z: this.position.z },
      enemyStates
    );

    // Compute target spectroscopic wavelength & amplitude from target ID hash so each planet/anomaly has a distinct signature
    const targetKey = details?.id || 'sol_earth';
    let hash = 0;
    for (let i = 0; i < targetKey.length; i++) {
      hash = (hash * 31 + targetKey.charCodeAt(i)) % 1000;
    }
    const targetWaveNm = targetKey === 'sol_earth' ? 656 : 420 + (hash % 290);
    const targetAmpPct = targetKey === 'sol_earth' ? 75 : 35 + (hash % 55);
    const orbitalLocked =
      !this.isWarping &&
      this.throttlePercent >= 30 &&
      this.throttlePercent <= 55 &&
      (details?.distanceKm ?? 2000) < 2800;

    this.bridgeInterior.setHardwareTelemetry({
      warpFactor: this.warpFactor,
      throttlePercent: this.throttlePercent,
      inertialDampeners: this.flightAssist,
      isWarping: this.isWarping,
      isBoostActive: this.isBoostActive,
      speedKms: displaySpeed,
      headingDeg: liveHeadingDeg,
      pitchDeg: livePitchDeg,
      alertLevel: this.alertLevel,
      shieldsRaised: this.shieldsRaised,
      shieldIntegrity: this.shieldIntegrity,
      hullIntegrity: this.hullIntegrity,
      isFiringPhasers: this.isFiringPhasers,
      phaserHeatPct: this.phaserThermalHeat,
      torpedoCount: this.torpedoCount,
      torpedoLockSeconds: Number(this.torpedoLockTimer.toFixed(1)),
      lockedEnemyName: lockedEnemy?.name || null,
      aliveHostilesCount,
      orbitalVelocityLocked: orbitalLocked,
      targetName: details?.shortName || lockedEnemy?.name || 'EARTH',
      targetClassification: details?.characteristics?.classification || 'Class-M Terrestrial Planet',
      targetAtmosphere: details?.characteristics?.atmosphere || 'Breathable N2-O2 Atmosphere',
      targetGravity: details?.characteristics?.surfaceGravity || '1.0 G',
      targetPopulation: details?.characteristics?.population || 'Cataloged Sector Body',
      targetDistanceKm: details?.distanceKm ?? 1120,
      targetBearingDeg: viewscreenTargetBearingDeg,
      targetWavelengthNm: targetWaveNm,
      targetAmplitudePct: targetAmpPct,
      scienceCardTitle: `${(details?.characteristics?.classification || 'CELESTIAL').toUpperCase()} SPECTROSCOPY`,
      scienceCardFormula: `λ = ${targetWaveNm} nm | E = hc/λ | Grav: ${details?.characteristics?.surfaceGravity || '1.0 G'}`,
      scienceCardFact1: details?.briefDescription || 'Spectroscopic absorption bands confirm primary elemental composition.',
      scienceCardFact2: `Affiliation: ${details?.characteristics?.affiliation || 'Starfleet Catalog'} · Status: ${details?.characteristics?.status || 'Active'}`,
    });

    const state: ShipState = {
      position: { x: Math.round(this.position.x), y: Math.round(this.position.y), z: Math.round(this.position.z) },
      velocity: { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z },
      rotation: { pitch: this.pitchRate, yaw: this.yawRate, roll: this.rollRate },
      forwardDirection: { x: this.forwardVector.x, y: this.forwardVector.y, z: this.forwardVector.z },
      rightDirection: { x: this.rightVector.x, y: this.rightVector.y, z: this.rightVector.z },
      headingAngle: Math.atan2(this.forwardVector.x, -this.forwardVector.z),
      speed: displaySpeed,
      targetSpeed: this.throttlePercent,
      throttlePercent: this.throttlePercent,
      isWarping: this.isWarping,
      warpFactor: this.warpFactor,
      warpCharge: this.warpChargeProgress,
      flightAssist: this.flightAssist,
      cameraZoom: Number(this.cameraZoom.toFixed(2)),
      isBoostActive: this.isBoostActive,
      boostDuration: Number(this.boostDuration.toFixed(1)),
      boostCharge: Math.round(this.boostCharge),
      alertLevel: this.alertLevel,
      shieldsRaised: this.shieldsRaised,
      shieldIntegrity: Math.round(this.shieldIntegrity),
      hullIntegrity: Math.round(this.hullIntegrity),
      isDestroyed: this.isDestroyed,
      defeatStats: this.defeatStats,
      warpCoreOutput: this.isWarping ? 96 : 45,
      impulsePower: this.throttlePercent,
      lastDamageTimestamp: this.lastDamageTime,
      isUnderAttack: this.isUnderAttack,
      hasIncomingTorpedo: this.combatManager.hasIncomingTorpedo,
      isFiringPhasers: this.isFiringPhasers,
      torpedoCount: this.torpedoCount,
      phaserEnergy: Math.round(this.phaserEnergy),
      currentSystemId: this.currentSystemId,
      currentSystemName: currentSys?.name || 'Sol System (Sector 001)',
      selectedTargetId: this.selectedTargetId,
      selectedTargetPosition,
      lockedEnemy,
      activeCoursePlot: this.activeCoursePlot,
      autoPilotToTarget: this.autoPilot,
      combatWaveState: this.combatManager.getCombatWaveState(),
      adaptiveDifficulty: this.combatManager.adaptiveTracker.getMetrics(),
      progression: this.combatManager.adaptiveTracker.getProgression(),
      isDocked: this.isDocked,
      dockedStationId: this.dockedStationId || undefined,
      dockedStationName: this.dockedStationName || undefined,
      canDockAtStation: this.canDockAtStation,
      blackHoleTransit: this.blackHoleTransit,
      stationOperations: this.stationOpsState ? { ...this.stationOpsState } : null,
      missionWaypoint: this.missionWaypoint ? { ...this.missionWaypoint } : null,
      activeOfficerCode: this.activeOfficerCode,
      bridgeStation: this.activeBridgeStation,
      viewscreenTargetId,
      viewscreenTargetBearingDeg,
      viewscreenZoom: this.viewscreenZoom,
    };

    this.onStateChangeCallback(state);
  }

  // --- Starfleet Science Exhibition Missions & 6-Digit Officer Profile Methods ---
  public acceptStarfleetMission(mission: StarfleetMission): void {
    this.activeMission = {
      ...mission,
      status: 'en_route',
      acceptedTimestamp: performance.now(),
    };
    this.missionShieldHarmonicEfficiency = 0;
    this.defendedPlanetIntegrity = 100;
    this.missionDefenseWaveActive = false;

    // Select the target planet so sensors highlight it, WITHOUT auto-teleporting (manual flight phase!)
    this.selectedTargetId = mission.targetPlanetId;
    this.buildMission3DVfx(mission);

    soundEffects.playLcarsAcknowledge();
    soundEffects.playLcarsBeep(880, 0.16);
    this.addLogEvent(
      'NAVIGATION',
      'info',
      `STARFLEET DIRECTIVE ACCEPTED: ${mission.title}`,
      `Manual Flight Phase Active: Follow HUD Compass Bearing to ${mission.targetPlanetName} (${mission.targetSystemName}) and approach within 480 km.`
    );
    this.broadcastState(true);
  }

  public abortStarfleetMission(): void {
    this.activeMission = null;
    this.missionWaypoint = null;
    this.missionShieldHarmonicEfficiency = 0;
    this.missionDefenseWaveActive = false;
    this.missionVfxGroup.visible = false;
    this.deflectorBeamGroup.visible = false;
    this.deflectorBeamTimer = 0;
    soundEffects.playLcarsBeep(480, 0.1);
    this.addLogEvent('NAVIGATION', 'warning', 'Starfleet Directive aborted. Waypoint telemetry cleared.');
    this.broadcastState(true);
  }

  public setMissionStatus(status: StarfleetMission['status']): void {
    if (!this.activeMission) return;
    this.activeMission.status = status;
    if (this.missionWaypoint) {
      this.missionWaypoint.status = status;
    }
    this.broadcastState(true);
  }

  public setMissionShieldHarmonics(efficiencyPercent: number): void {
    this.missionShieldHarmonicEfficiency = Math.max(0, Math.min(100, Math.round(efficiencyPercent)));
    this.shieldsRaised = true;
    const shieldMat = this.enterprise.shieldBubble.material as THREE.MeshStandardMaterial;
    if (shieldMat) {
      shieldMat.opacity = 0.36;
      shieldMat.emissive.setHex(0x06b6d4);
    }
    soundEffects.playShieldToggle(true);
    this.addLogEvent(
      'DEFENSE',
      'success',
      `Multiphasic Shield Harmonics Locked: ${this.missionShieldHarmonicEfficiency}% Reflection Efficiency`,
      'Incoming directed-energy weapon impact damage reduced via destructive phase cancellation.'
    );
    this.broadcastState(true);
  }

  public startPlanetaryDefenseWave(): void {
    if (!this.activeMission) return;
    this.activeMission.status = 'combat_active';
    this.missionDefenseWaveActive = true;
    this.defendedPlanetIntegrity = 100;
    this.setAlertLevel('red');
    this.shieldsRaised = true;
    const waveLvl = Math.max(1, Math.min(4, this.activeMission.difficulty));
    const exactCount = this.activeMission.defenseData?.enemyWaveCount || 3;
    const validFaction = this.activeMission.defenseData?.hostileFaction;
    const missionAnchor = new THREE.Vector3(...this.activeMission.targetCoordinates);
    this.combatManager.spawnWave(this.position, this.currentSystemId, waveLvl, {
      forceFaction: validFaction,
      customAnchorPos: missionAnchor,
      exactShipCount: exactCount,
    });
    // Automatically lock onto the first hostile vessel so player weapons are immediately ready
    const firstHostile = this.combatManager.enemyShips.find((s) => s.isAlive);
    if (firstHostile) {
      this.setLockedEnemy(firstHostile.id);
    }
    battleThemeManager.handleCombatStart();
    this.addLogEvent(
      'TACTICAL',
      'combat',
      `PLANETARY DEFENSE ENGAGED: ${exactCount} Hostile Vessels Inbound at ${this.activeMission.targetPlanetName}`,
      `Destroy all ${exactCount} hostile vessels to secure ${this.activeMission.defenseData?.outpostName || 'the orbital outpost'}!`
    );
    this.broadcastState(true);
  }

  public fireDeflectorParticleBeam(
    targetCoords?: [number, number, number],
    colorHex: number = 0x06b6d4,
    durationSeconds: number = 5.5
  ): void {
    const dest = targetCoords
      ? new THREE.Vector3(...targetCoords)
      : this.activeMission
      ? new THREE.Vector3(...this.activeMission.targetCoordinates)
      : this.position.clone().add(this.forwardVector.clone().multiplyScalar(280));

    this.deflectorBeamTarget.copy(dest);
    this.deflectorBeamTimer = durationSeconds;
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, 0.32);

    // Clear and rebuild high-energy collimated particle beam meshes
    while (this.deflectorBeamGroup.children.length > 0) {
      const child = this.deflectorBeamGroup.children[0];
      this.deflectorBeamGroup.remove(child);
    }

    const coreGeo = new THREE.CylinderGeometry(0.45, 1.35, 1, 16, 1, true);
    coreGeo.translate(0, 0.5, 0);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.deflectorBeamGroup.add(coreMesh);

    const outerGeo = new THREE.CylinderGeometry(1.4, 4.8, 1, 20, 1, true);
    outerGeo.translate(0, 0.5, 0);
    outerGeo.rotateX(Math.PI / 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    this.deflectorBeamGroup.add(outerMesh);

    this.deflectorBeamGroup.visible = true;
    soundEffects.playPhaserBeam(this.position);
    soundEffects.playLcarsBeep(960, 0.22);
    this.addLogEvent(
      'TACTICAL',
      'success',
      'MAIN NAVIGATIONAL DEFLECTOR BEAM FIRING',
      'High-energy cyclotron particle stream projected into planetary magnetosphere.'
    );
    this.broadcastState(true);
  }

  public triggerHazardShake(intensity: number = 0.45): void {
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    soundEffects.playHullImpact();
  }

  public awardMissionXp(totalXp: number, missionTitle: string): void {
    this.combatManager.adaptiveTracker.addXp(totalXp, (cat, type, msg, det) => {
      this.addLogEvent(cat, type, msg, det);
    });
    soundEffects.playLcarsAcknowledge();
    this.addLogEvent(
      'TACTICAL',
      'success',
      `MISSION COMPLETED: ${missionTitle} (+${totalXp} XP)`,
      `Officer Progression updated: Level ${this.combatManager.adaptiveTracker.playerLevel} (${this.combatManager.adaptiveTracker.playerRank}).`
    );
    this.activeMission = null;
    this.missionWaypoint = null;
    this.missionVfxGroup.visible = false;
    this.deflectorBeamGroup.visible = false;
    this.broadcastState(true);
  }

  public setActiveOfficerCode(code: string | null): void {
    this.activeOfficerCode = code;
    this.broadcastState(true);
  }

  public restoreOfficerProfileToEngine(record: OfficerProfileRecord): void {
    this.activeOfficerCode = record.code;
    this.combatManager.adaptiveTracker.loadProfileState(
      record.xp,
      record.totalKills,
      record.scoutsDestroyed,
      record.cruisersDestroyed,
      record.mothershipsDestroyed,
      record.combatRating
    );
    soundEffects.playPromotionChime();
    this.addLogEvent(
      'TACTICAL',
      'success',
      `OFFICER PROFILE RESTORED [ID: ${record.code}]`,
      `Welcome back, ${record.rank} ${record.callsign} (Level ${record.level} · ${record.xp.toLocaleString()} XP).`
    );
    this.broadcastState(true);
  }

  public triggerMission3DAction(
    action: 'sensor_pulse' | 'launch_probe' | 'activate_node' | 'stabilize_field',
    nodeIndex: number = 0
  ): void {
    const targetCoords = this.activeMission?.targetCoordinates;
    const targetVec = targetCoords
      ? new THREE.Vector3(...targetCoords)
      : this.position.clone().add(this.forwardVector.clone().multiplyScalar(180));

    // Activate or recolor specific 3D sub-nodes inside missionVfxGroup
    const nodeContainer = this.missionVfxGroup.getObjectByName(`mission_node_${nodeIndex}`);
    if (nodeContainer) {
      nodeContainer.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mat = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
          if (mat && 'color' in mat) {
            mat.color.setHex(0x10b981);
          }
          if (mat && 'emissive' in mat) {
            (mat as THREE.MeshStandardMaterial).emissive.setHex(0x10b981);
            (mat as THREE.MeshStandardMaterial).emissiveIntensity = 1.8;
          }
        }
      });
    }

    if (action === 'sensor_pulse') {
      soundEffects.playLcarsAcknowledge();
      soundEffects.playLcarsBeep(1120, 0.16);
      this.fireDeflectorParticleBeam(
        [targetVec.x, targetVec.y, targetVec.z],
        0x22d3ee,
        2.2
      );
    } else if (action === 'launch_probe') {
      soundEffects.playPhotonTorpedo(this.position);
      soundEffects.playLcarsBeep(980, 0.2);
      this.fireDeflectorParticleBeam(
        [targetVec.x + (nodeIndex - 1) * 22, targetVec.y + 8, targetVec.z],
        0xa855f7,
        2.8
      );
      this.space.triggerExplosion(targetVec, 1.4);
      this.addLogEvent(
        'NAVIGATION',
        'success',
        `CLASS-VIII SCIENCE PROBE LAUNCHED → Telemetry Node 0${nodeIndex + 1}`,
        'Direct quantum telemetry link established with orbital phenomenon.'
      );
    } else if (action === 'activate_node') {
      soundEffects.playShieldToggle(true);
      soundEffects.playLcarsBeep(1240, 0.18);
      this.fireDeflectorParticleBeam(
        [targetVec.x + Math.cos(nodeIndex * 2.1) * 45, targetVec.y + 12, targetVec.z + Math.sin(nodeIndex * 2.1) * 45],
        0x10b981,
        3.0
      );
      this.addLogEvent(
        'DEFENSE',
        'success',
        `ORBITAL DEFENSE SATELLITE 0${nodeIndex + 1} ONLINE`,
        'Automated phaser & multiphasic shield relay synchronized in 3D orbit.'
      );
    } else if (action === 'stabilize_field') {
      soundEffects.playPhaserBeam(this.position);
      soundEffects.playLcarsAcknowledge();
      this.fireDeflectorParticleBeam(
        [targetVec.x, targetVec.y + (nodeIndex - 1) * 28, targetVec.z],
        0x10b981,
        4.5
      );
      // Turn the entire magnetosphere cage emerald-cyan
      this.missionVfxGroup.traverse((obj) => {
        if (obj.name === 'magneto_ring' && (obj as THREE.Mesh).isMesh) {
          const m = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial;
          m.color.setHex(0x10b981);
          m.opacity = 0.78;
        }
      });
    }
    this.broadcastState(true);
  }

  private createNebulaCloudTexture(innerRgba: string, midRgba: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.25, innerRgba);
      grad.addColorStop(0.62, midRgba);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  private buildMission3DVfx(mission: StarfleetMission): void {
    while (this.missionVfxGroup.children.length > 0) {
      this.missionVfxGroup.remove(this.missionVfxGroup.children[0]);
    }

    const pos = new THREE.Vector3(...mission.targetCoordinates);
    this.missionVfxGroup.position.copy(pos);

    const primaryColor =
      mission.archetype === 'anomaly_investigation'
        ? 0xd946ef
        : mission.archetype === 'magnetosphere_rescue'
        ? 0xf59e0b
        : mission.archetype === 'first_contact'
        ? 0x22d3ee
        : 0xef4444;

    // 1. Base Holographic Waypoint Perimeter Ring
    const ringGeo = new THREE.TorusGeometry(64, 1.2, 16, 84);
    const ringMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const baseRing = new THREE.Mesh(ringGeo, ringMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.name = 'outer_beacon_ring';
    this.missionVfxGroup.add(baseRing);

    // 2. Archetype-Specific Stunning 3D Space Environment & Interactive Structures
    if (mission.archetype === 'first_contact') {
      const speciesName = mission.firstContactData?.speciesName || 'Vulcans';
      const isVulcan = speciesName.includes('Vulcan');
      const isKlingon = speciesName.includes('Klingon');
      const isRomulan = speciesName.includes('Romulan');
      const isTholian = speciesName.includes('Tholian');

      const hullHex = isVulcan
        ? 0x991b1b
        : isKlingon
        ? 0x14532d
        : isRomulan
        ? 0x065f46
        : isTholian
        ? 0xd97706
        : 0x1e3a8a;
      const glowHex = isVulcan
        ? 0xfbbf24
        : isKlingon
        ? 0xef4444
        : isRomulan
        ? 0x10b981
        : isTholian
        ? 0xf59e0b
        : 0x38bdf8;

      const envoyShip = new THREE.Group();
      envoyShip.name = 'envoy_cruiser';

      const hullMat = new THREE.MeshStandardMaterial({
        color: hullHex,
        metalness: 0.78,
        roughness: 0.25,
        emissive: hullHex,
        emissiveIntensity: 0.35,
      });
      const glowMat = new THREE.MeshBasicMaterial({
        color: glowHex,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
      });

      // Primary sculpted command hull
      const mainHull = new THREE.Mesh(new THREE.CylinderGeometry(9, 16, 6, 28), hullMat);
      mainHull.scale.set(1.4, 0.48, 2.3);
      envoyShip.add(mainHull);

      if (isVulcan) {
        // Iconic Vulcan Annular Warp Ring
        const vulcanRing = new THREE.Mesh(new THREE.TorusGeometry(26, 2.2, 16, 64), glowMat);
        vulcanRing.position.set(0, 2, 6);
        envoyShip.add(vulcanRing);
      } else {
        // Swept wing pylons
        const wing = new THREE.Mesh(new THREE.BoxGeometry(44, 1.6, 12), hullMat);
        wing.position.set(0, -1, 4);
        envoyShip.add(wing);

        // Twin glowing warp nacelles
        for (const side of [-21, 21]) {
          const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 30, 16), hullMat);
          nacelle.rotation.x = Math.PI / 2;
          nacelle.position.set(side, -1, 4);
          envoyShip.add(nacelle);

          const coilGlow = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 22, 16), glowMat);
          coilGlow.rotation.x = Math.PI / 2;
          coilGlow.position.set(side, -1, 4);
          envoyShip.add(coilGlow);
        }
      }

      // Colorful Subspace Harmonic Field Halo around the Envoy Ship
      const commAuraTex = this.createNebulaCloudTexture('rgba(34, 211, 238, 0.55)', 'rgba(168, 85, 247, 0.2)');
      for (let c = 0; c < 6; c++) {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: commAuraTex,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        const angle = (c / 6) * Math.PI * 2;
        sprite.position.set(Math.cos(angle) * 35, (c % 2 === 0 ? 1 : -1) * 10, Math.sin(angle) * 35);
        sprite.scale.set(85, 85, 1);
        this.missionVfxGroup.add(sprite);
      }

      // 3 Interactive Subspace Transceiver Nodes around the Envoy Vessel
      for (let i = 0; i < 3; i++) {
        const nodeGroup = new THREE.Group();
        nodeGroup.name = `mission_node_${i}`;
        const angle = (i * Math.PI * 2) / 3;
        nodeGroup.position.set(Math.cos(angle) * 42, 10, Math.sin(angle) * 42);
        const orb = new THREE.Mesh(
          new THREE.OctahedronGeometry(4.5, 1),
          new THREE.MeshBasicMaterial({ color: glowHex, wireframe: true })
        );
        nodeGroup.add(orb);
        this.missionVfxGroup.add(nodeGroup);
      }

      this.missionVfxGroup.add(envoyShip);
    } else if (mission.archetype === 'anomaly_investigation') {
      const anomalyType = mission.anomalyData?.anomalyType || 'Emission Nebula';

      // Create Lush, Colorful Multi-Layered 3D Volumetric Nebula Clouds directly around the mission site!
      const cloudPalettes: [string, string][] =
        anomalyType === 'Emission Nebula'
          ? [
              ['rgba(236, 72, 153, 0.75)', 'rgba(168, 85, 247, 0.32)'], // Vibrant Hydrogen-Alpha Pink/Magenta
              ['rgba(34, 211, 238, 0.72)', 'rgba(59, 130, 246, 0.28)'], // Doubly-Ionized Oxygen O-III Cyan/Blue
              ['rgba(250, 204, 21, 0.62)', 'rgba(249, 115, 22, 0.25)'], // Ionized Sulfur Gold/Amber
              ['rgba(192, 132, 252, 0.7)', 'rgba(124, 58, 237, 0.3)'], // Deep Violet Stellar Nursery
            ]
          : anomalyType === 'Supernova Remnant'
          ? [
              ['rgba(249, 115, 22, 0.78)', 'rgba(239, 68, 68, 0.32)'],
              ['rgba(56, 189, 248, 0.72)', 'rgba(168, 85, 247, 0.3)'],
              ['rgba(250, 204, 21, 0.7)', 'rgba(220, 38, 38, 0.25)'],
            ]
          : anomalyType === 'Millisecond Pulsar'
          ? [
              ['rgba(56, 189, 248, 0.78)', 'rgba(99, 102, 241, 0.32)'],
              ['rgba(168, 85, 247, 0.7)', 'rgba(14, 165, 233, 0.28)'],
            ]
          : [
              ['rgba(168, 85, 247, 0.8)', 'rgba(236, 72, 153, 0.35)'],
              ['rgba(245, 158, 11, 0.72)', 'rgba(124, 58, 237, 0.3)'],
            ];

      const textures = cloudPalettes.map(([inner, mid]) => this.createNebulaCloudTexture(inner, mid));
      const nebulaCloudGroup = new THREE.Group();
      nebulaCloudGroup.name = 'volumetric_nebula_clouds';

      const cloudCount = anomalyType === 'Emission Nebula' ? 28 : 18;
      for (let i = 0; i < cloudCount; i++) {
        const tex = textures[i % textures.length];
        const spriteMat = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          opacity: anomalyType === 'Emission Nebula' ? 0.68 : 0.52,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        const radius = i < 6 ? 18 + Math.random() * 35 : 40 + Math.random() * 115;
        const theta = (i / cloudCount) * Math.PI * 2 + Math.random() * 0.6;
        const phi = (Math.random() - 0.5) * 1.4;
        sprite.position.set(
          Math.cos(theta) * Math.cos(phi) * radius,
          Math.sin(phi) * radius * 0.65,
          Math.sin(theta) * Math.cos(phi) * radius
        );
        const scale = (anomalyType === 'Emission Nebula' ? 110 : 85) + Math.random() * 95;
        sprite.scale.set(scale, scale, 1);
        nebulaCloudGroup.add(sprite);
      }
      this.missionVfxGroup.add(nebulaCloudGroup);

      // Phenomenon-Specific Central 3D Structure
      if (anomalyType === 'Quantum Singularity') {
        // Black Hole Event Horizon + Relativistic Glowing Accretion Disk
        const eventHorizon = new THREE.Mesh(
          new THREE.SphereGeometry(15, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0x020617 })
        );
        eventHorizon.name = 'anomaly_core';
        this.missionVfxGroup.add(eventHorizon);

        const photonRing = new THREE.Mesh(
          new THREE.TorusGeometry(16.5, 1.2, 16, 64),
          new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
          })
        );
        this.missionVfxGroup.add(photonRing);

        for (let r = 0; r < 4; r++) {
          const diskRing = new THREE.Mesh(
            new THREE.RingGeometry(19 + r * 7, 25 + r * 7, 64),
            new THREE.MeshBasicMaterial({
              color: r % 2 === 0 ? 0xf97316 : 0xc084fc,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.75 - r * 0.12,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            })
          );
          diskRing.rotation.x = Math.PI / 2 - 0.22;
          this.missionVfxGroup.add(diskRing);
        }
      } else if (anomalyType === 'Supernova Remnant') {
        // Expanding Filamentary Shockwave Shells + Neutron Star Core
        const coreMesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(13, 2),
          new THREE.MeshBasicMaterial({
            color: 0xfef08a,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
          })
        );
        coreMesh.name = 'anomaly_core';
        this.missionVfxGroup.add(coreMesh);

        const shellColors = [0xf97316, 0x38bdf8, 0xec4899];
        shellColors.forEach((col, idx) => {
          const filamentShell = new THREE.Mesh(
            new THREE.IcosahedronGeometry(26 + idx * 14, 2),
            new THREE.MeshBasicMaterial({
              color: col,
              wireframe: true,
              transparent: true,
              opacity: 0.65 - idx * 0.12,
              blending: THREE.AdditiveBlending,
            })
          );
          filamentShell.rotation.set(idx * 0.7, idx * 1.1, 0);
          this.missionVfxGroup.add(filamentShell);
        });
      } else {
        // Emission Nebula Stellar Nursery Core OR Millisecond Pulsar with Twin Lighthouse Beams
        const coreMesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(14, 3),
          new THREE.MeshBasicMaterial({
            color: anomalyType === 'Millisecond Pulsar' ? 0x38bdf8 : 0xf472b6,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
          })
        );
        coreMesh.name = 'anomaly_core';
        this.missionVfxGroup.add(coreMesh);

        // Twin Relativistic Polar Jets
        const jetGeo = new THREE.ConeGeometry(11, 135, 24, 1, true);
        const jetMat = new THREE.MeshBasicMaterial({
          color: anomalyType === 'Millisecond Pulsar' ? 0x22d3ee : 0xe879f9,
          transparent: true,
          opacity: 0.58,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const upperJet = new THREE.Mesh(jetGeo, jetMat);
        upperJet.position.y = 67;
        this.missionVfxGroup.add(upperJet);

        const lowerJet = new THREE.Mesh(jetGeo, jetMat);
        lowerJet.rotation.x = Math.PI;
        lowerJet.position.y = -67;
        this.missionVfxGroup.add(lowerJet);
      }

      // 3 Orbiting 3D Quantum Telemetry Beacons
      for (let i = 0; i < 3; i++) {
        const nodeGroup = new THREE.Group();
        nodeGroup.name = `mission_node_${i}`;
        const angle = (i * Math.PI * 2) / 3;
        nodeGroup.position.set(Math.cos(angle) * 48, (i - 1) * 14, Math.sin(angle) * 48);
        const sensorCore = new THREE.Mesh(
          new THREE.OctahedronGeometry(5, 0),
          new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xf59e0b,
            emissiveIntensity: 1.4,
            roughness: 0.2,
            metalness: 0.8,
          })
        );
        const sensorHalo = new THREE.Mesh(
          new THREE.TorusGeometry(8, 0.55, 10, 32),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
        );
        nodeGroup.add(sensorCore, sensorHalo);
        this.missionVfxGroup.add(nodeGroup);
      }
    } else if (mission.archetype === 'planetary_defense') {
      // Starfleet Orbital Research Outpost + Shield Perimeter + 3 Orbital Defense Satellites
      const outpost = new THREE.Group();
      outpost.name = 'defense_outpost';
      const stationMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.75,
        roughness: 0.25,
      });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(14, 24, 16), stationMat);
      dome.scale.set(1.4, 0.65, 1.4);
      outpost.add(dome);

      const spire = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.8, 38, 16), stationMat);
      outpost.add(spire);

      const habRing = new THREE.Mesh(
        new THREE.TorusGeometry(25, 2.5, 16, 48),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.9,
          metalness: 0.6,
          roughness: 0.35,
        })
      );
      habRing.rotation.x = Math.PI / 2;
      outpost.add(habRing);

      // Translucent Planetary Outpost Defense Shield Dome
      const shieldDome = new THREE.Mesh(
        new THREE.SphereGeometry(34, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          wireframe: true,
          transparent: true,
          opacity: 0.28,
          blending: THREE.AdditiveBlending,
        })
      );
      outpost.add(shieldDome);
      this.missionVfxGroup.add(outpost);

      // 3 Orbital Defense Satellites
      for (let i = 0; i < 3; i++) {
        const satGroup = new THREE.Group();
        satGroup.name = `mission_node_${i}`;
        const angle = (i * Math.PI * 2) / 3;
        satGroup.position.set(Math.cos(angle) * 52, 12, Math.sin(angle) * 52);

        const satBody = new THREE.Mesh(
          new THREE.CylinderGeometry(2.5, 3.5, 10, 12),
          new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 1.0,
            metalness: 0.75,
            roughness: 0.25,
          })
        );
        const satRing = new THREE.Mesh(
          new THREE.TorusGeometry(6.5, 0.6, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 })
        );
        satRing.rotation.x = Math.PI / 2;
        satGroup.add(satBody, satRing);
        this.missionVfxGroup.add(satGroup);
      }
    } else {
      // Archetype 4: Planetary Magnetosphere Dipole Cage & Solar Storm Core
      for (let i = 0; i < 6; i++) {
        const magRing = new THREE.Mesh(
          new THREE.TorusGeometry(42 + i * 4.5, 0.85, 12, 64),
          new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0xef4444 : 0xf59e0b,
            transparent: true,
            opacity: 0.68,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        magRing.rotation.y = (i * Math.PI) / 6;
        magRing.name = 'magneto_ring';
        this.missionVfxGroup.add(magRing);
      }

      // Glowing Solar Storm / Coronal Mass Ejection Plasma Clouds
      const cmeTex = this.createNebulaCloudTexture('rgba(249, 115, 22, 0.72)', 'rgba(239, 68, 68, 0.3)');
      for (let c = 0; c < 10; c++) {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: cmeTex,
            transparent: true,
            opacity: 0.55,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        const angle = (c / 10) * Math.PI * 2;
        sprite.position.set(Math.cos(angle) * 48, (Math.random() - 0.5) * 40, Math.sin(angle) * 48);
        sprite.scale.set(78, 78, 1);
        this.missionVfxGroup.add(sprite);
      }

      // 3 Polar/Equatorial Cusp Nodes
      const cuspOffsets: [number, number, number][] = [
        [0, 40, 0],
        [42, 0, 0],
        [0, -40, 0],
      ];
      cuspOffsets.forEach((off, i) => {
        const cuspGroup = new THREE.Group();
        cuspGroup.name = `mission_node_${i}`;
        cuspGroup.position.set(off[0], off[1], off[2]);
        const cuspOrb = new THREE.Mesh(
          new THREE.SphereGeometry(4.8, 16, 16),
          new THREE.MeshBasicMaterial({
            color: 0xef4444,
            transparent: true,
            opacity: 0.92,
            blending: THREE.AdditiveBlending,
          })
        );
        cuspGroup.add(cuspOrb);
        this.missionVfxGroup.add(cuspGroup);
      });
    }

    // 3. Multi-Colored Volumetric Star-Forming & Ionized Particle Cloud around Mission Zone
    const particleCount = mission.archetype === 'anomaly_investigation' ? 750 : 320;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color(0x22d3ee),
      new THREE.Color(0xe879f9),
      new THREE.Color(0xfbbf24),
      new THREE.Color(0x38bdf8),
      new THREE.Color(0xa855f7),
    ];
    for (let i = 0; i < particleCount; i++) {
      const r = 16 + Math.random() * (mission.archetype === 'anomaly_investigation' ? 135 : 68);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const pMat = new THREE.PointsMaterial({
      size: 3.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.missionVfxGroup.add(new THREE.Points(pGeo, pMat));
    this.missionVfxGroup.visible = true;
  }

  private updateStarfleetMissionState(delta: number, time: number): void {
    // Animate Deflector Dish Particle Beam if active
    if (this.deflectorBeamTimer > 0) {
      this.deflectorBeamTimer = Math.max(0, this.deflectorBeamTimer - delta);
      const dishLocal = new THREE.Vector3(0, -2.4, -7.8);
      const dishWorld = dishLocal.applyQuaternion(this.orientation).add(this.position);
      const beamVec = this.deflectorBeamTarget.clone().sub(dishWorld);
      const beamLen = Math.max(10, beamVec.length());
      this.deflectorBeamGroup.position.copy(dishWorld);
      this.deflectorBeamGroup.lookAt(this.deflectorBeamTarget);
      this.deflectorBeamGroup.scale.set(
        1 + Math.sin(time * 28) * 0.18,
        1 + Math.cos(time * 28) * 0.18,
        beamLen
      );
      if (this.deflectorBeamTimer <= 0) {
        this.deflectorBeamGroup.visible = false;
      }
    }

    if (!this.activeMission) {
      this.missionWaypoint = null;
      return;
    }

    // Rotate 3D mission structures & interactive orbital nodes
    if (this.missionVfxGroup.visible) {
      this.missionVfxGroup.rotation.y = time * 0.28;
      const core = this.missionVfxGroup.getObjectByName('anomaly_core');
      if (core) {
        const pulse = 1 + Math.sin(time * 6.5) * 0.18;
        core.scale.set(pulse, pulse, pulse);
      }
      const nebulaClouds = this.missionVfxGroup.getObjectByName('volumetric_nebula_clouds');
      if (nebulaClouds) {
        nebulaClouds.rotation.y = -time * 0.12;
      }
      for (let i = 0; i < 3; i++) {
        const node = this.missionVfxGroup.getObjectByName(`mission_node_${i}`);
        if (node) {
          node.rotation.y = time * 1.8;
          node.rotation.x = time * 1.1;
        }
      }
    }

    // Compute live 3D vector to mission target coordinates
    let targetWorld = new THREE.Vector3(...this.activeMission.targetCoordinates);
    const planetMesh = this.space.targetMeshes.get(this.activeMission.targetPlanetId);
    if (planetMesh) {
      // Keep waypoint anchored near the live orbital position of the target planet
      targetWorld = planetMesh.position.clone().add(new THREE.Vector3(0, 18, (planetMesh.scale.x || 35) * 2.2 + 80));
      this.activeMission.targetCoordinates = [
        Math.round(targetWorld.x),
        Math.round(targetWorld.y),
        Math.round(targetWorld.z),
      ];
      this.missionVfxGroup.position.copy(targetWorld);
    }

    const toTarget = targetWorld.clone().sub(this.position);
    const distanceKm = Math.round(toTarget.length());
    const dirToTarget = toTarget.lengthSq() > 0.001 ? toTarget.clone().normalize() : new THREE.Vector3(0, 0, -1);

    // Project direction into ship's local coordinate frame for HUD Directional Compass Arrow
    const localForwardDot = this.forwardVector.dot(dirToTarget);
    const localRightDot = this.rightVector.dot(dirToTarget);
    const localUpDot = this.upVector.dot(dirToTarget);

    const bearingDeg = Math.round(Math.atan2(localRightDot, localForwardDot) * (180 / Math.PI));
    const elevationDeg = Math.round(Math.asin(Math.max(-1, Math.min(1, localUpDot))) * (180 / Math.PI));

    const isInProximity = distanceKm <= 520;

    // Trigger proximity arrival transition when manually piloting within 520 km
    if (isInProximity && !this.isWarping && this.activeMission.status === 'en_route') {
      this.activeMission.status = 'in_proximity';
      soundEffects.playLcarsAcknowledge();
      soundEffects.playLcarsBeep(1040, 0.25);
      this.addLogEvent(
        'NAVIGATION',
        'success',
        `MISSION PROXIMITY ZONE REACHED: ${this.activeMission.targetPlanetName}`,
        '3D Mission Phenomenon in visual range! Interactive HUD Console expanded for live operations.'
      );
      this.broadcastState(true);
    }

    // Track Planetary Defense wave progress if active — keep mission open until player completes Stage 3 & Debrief!
    if (this.activeMission.archetype === 'planetary_defense' && this.missionDefenseWaveActive) {
      const aliveEnemies = this.combatManager.enemyShips.filter((e) => e.isAlive);
      const aliveCount = aliveEnemies.length;
      if (aliveCount > 0) {
        // Hostiles slowly chip away at outpost perimeter if not engaged
        this.defendedPlanetIntegrity = Math.max(18, this.defendedPlanetIntegrity - delta * 0.35 * aliveCount);
      } else if (this.combatManager.waveStatus === 'cleared') {
        this.missionDefenseWaveActive = false;
        this.activeMission.status = 'in_proximity';
        soundEffects.playPromotionChime();
        this.addLogEvent(
          'TACTICAL',
          'success',
          `ALL HOSTILE VESSELS NEUTRALIZED AT ${this.activeMission.targetPlanetName.toUpperCase()}`,
          'Sector perimeter secured! Activate the 3D Orbital Defense Satellites in the HUD to complete your mission debrief.'
        );
        this.broadcastState(true);
      }
    }

    this.missionWaypoint = {
      missionId: this.activeMission.id,
      missionTitle: this.activeMission.title,
      archetype: this.activeMission.archetype,
      difficulty: this.activeMission.difficulty,
      targetName: this.activeMission.targetPlanetName,
      systemName: this.activeMission.targetSystemName,
      systemId: this.activeMission.targetSystemId,
      targetCoordinates: this.activeMission.targetCoordinates,
      distanceKm,
      bearingDeg,
      elevationDeg,
      isInProximity,
      status: this.activeMission.status,
      shieldHarmonicEfficiency: this.missionShieldHarmonicEfficiency,
      defendedPlanetIntegrity: Math.round(this.defendedPlanetIntegrity),
    };
  }

  // --- Station Operations Subsystems Control Methods ---
  public getStationOperations(): StationOperationsState | null {
    return this.stationOpsState ? { ...this.stationOpsState } : null;
  }

  public setStationOperationsSubsystem(subsystem: StationOperationsState['activeSubsystem']): void {
    if (!this.stationOpsState) return;
    this.stationOpsState.activeSubsystem = subsystem;
    soundEffects.playLcarsBeep(680, 0.08);
    this.broadcastState(true);
  }

  public deployRepairDrones(count: number = 2, mode: 'ablative' | 'structural' | 'microweld' | 'overhaul' = 'structural'): void {
    if (!this.isDocked || !this.stationOpsState) return;
    this.stationOpsState.dronesDeployed = true;
    this.stationOpsState.droneCount = Math.max(1, Math.min(4, count));
    this.stationOpsState.repairMode = mode;
    const modeMultiplier = mode === 'overhaul' ? 1.8 : mode === 'structural' ? 1.4 : mode === 'ablative' ? 1.1 : 1.0;
    this.stationOpsState.repairRatePerSec = 1.6 * this.stationOpsState.droneCount * modeMultiplier;
    this.stationOpsState.isRepairComplete = false;

    if (this.dockedStationId) {
      setStationDronesState(this.dockedStationId, true, this.stationOpsState.droneCount, this.position, this.orientation);
    }
    soundEffects.playLcarsAcknowledge();
    soundEffects.playLcarsBeep(720, 0.15);
    this.addLogEvent(
      'DEFENSE',
      'info',
      `Deploying ${this.stationOpsState.droneCount} autonomous repair drones (${mode.toUpperCase()} protocol).`,
      `Repair rate: +${this.stationOpsState.repairRatePerSec.toFixed(1)}%/sec. Drones projecting laser welding arcs to hull breaches.`
    );
    this.broadcastState(true);
  }

  public recallRepairDrones(): void {
    if (!this.stationOpsState) return;
    this.stationOpsState.dronesDeployed = false;
    if (this.dockedStationId) {
      setStationDronesState(this.dockedStationId, false, 0, this.position, this.orientation);
    }
    soundEffects.playLcarsBeep(520, 0.1);
    this.addLogEvent('DEFENSE', 'info', `Repair drones recalled to bay maintenance alcoves. Current hull: ${Math.round(this.hullIntegrity)}%.`);
    this.broadcastState(true);
  }

  public toggleDockingClamps(): void {
    if (!this.isDocked || !this.stationOpsState) return;
    const nextEngaged = !this.stationOpsState.clampsEngaged;
    this.stationOpsState.clampsEngaged = nextEngaged;
    this.stationOpsState.clampPressurePsi = nextEngaged ? 14.7 : 0.0;
    if (this.dockedStationId) {
      setStationClampsState(this.dockedStationId, nextEngaged);
    }
    soundEffects.playLcarsAcknowledge();
    this.addLogEvent(
      'NAVIGATION',
      'info',
      nextEngaged ? 'Primary magnetic mooring clamps locked and pressurized (14.7 PSI).' : 'Primary magnetic mooring clamps disengaged and retracted.'
    );
    this.broadcastState(true);
  }

  public toggleShorePower(): void {
    if (!this.isDocked || !this.stationOpsState) return;
    this.stationOpsState.shorePowerConnected = !this.stationOpsState.shorePowerConnected;
    soundEffects.playLcarsAcknowledge();
    this.addLogEvent(
      'DEFENSE',
      'info',
      this.stationOpsState.shorePowerConnected
        ? 'Station auxiliary shore power connected. Starship internal reactor stress reduced to standby.'
        : 'Shore power umbilical disconnected. Starship operating on internal reactor core.'
    );
    this.broadcastState(true);
  }

  public refuelAntimatter(): void {
    if (!this.isDocked || !this.stationOpsState) return;
    this.stationOpsState.isRefuelingAntimatter = true;
    this.stationOpsState.isRefuelingDeuterium = true;
    soundEffects.playLcarsAcknowledge();
    soundEffects.playLcarsBeep(840, 0.15);
    this.addLogEvent('DEFENSE', 'info', 'Antimatter magnetic containment transfer initiated. Deuterium slush cryogenic feed online.');
    this.broadcastState(true);
  }

  public reloadTorpedoes(type: 'photon' | 'quantum' | 'tricobalt' = 'photon'): void {
    if (!this.isDocked || !this.stationOpsState) return;
    this.stationOpsState.selectedTorpedoType = type;
    this.stationOpsState.isReloadingTorpedoes = true;
    soundEffects.playLcarsAcknowledge();
    soundEffects.playLcarsBeep(920, 0.18);
    this.addLogEvent('WEAPONS', 'info', `Automated magazine carousel hoist active. Loading Mark VI ${type.toUpperCase()} torpedoes.`);
    this.broadcastState(true);
  }

  public realignDilithiumMatrix(frequency: number): void {
    if (!this.isDocked || !this.stationOpsState) return;
    this.stationOpsState.dilithiumFrequencyMhz = frequency;
    const error = Math.abs(frequency - 248.5);
    const alignment = Math.max(70, Math.min(100, 100 - error * 8));
    this.stationOpsState.dilithiumAlignmentPercent = Number(alignment.toFixed(1));
    this.stationOpsState.warpEfficiencyBonus = alignment > 95 ? 15 : alignment > 88 ? 10 : 0;
    this.stationOpsState.plasmaInjectorsCleaned = true;
    soundEffects.playLcarsAcknowledge();
    this.addLogEvent(
      'DEFENSE',
      'success',
      `Dilithium crystal lattice realigned to ${frequency.toFixed(1)} MHz. Matrix alignment: ${alignment.toFixed(1)}%.`,
      alignment > 95 ? 'Warp drive harmonics optimized: +15% warp efficiency bonus active.' : 'Alignment within acceptable Starfleet tolerances.'
    );
    this.broadcastState(true);
  }

  public purgeReactorCoolant(): void {
    if (!this.isDocked || !this.stationOpsState) return;
    this.stationOpsState.isPurgingCoolant = true;
    if (this.dockedStationId) {
      triggerStationCoolantPurge(this.dockedStationId, this.position);
    }
    soundEffects.playLcarsAcknowledge();
    soundEffects.playLcarsBeep(560, 0.2);
    this.addLogEvent(
      'DEFENSE',
      'warning',
      'Depressurizing reactor coolant loop. Venting toxic tri-polymer residue into interstellar void.',
      'High-pressure coolant vapor plume active at radiator exhaust ports.'
    );
    this.broadcastState(true);
  }

  public grantCrewShoreLeave(): void {
    if (!this.isDocked || !this.stationOpsState) return;
    this.stationOpsState.shoreLeaveGranted = true;
    this.stationOpsState.crewMoralePercent = 100;
    soundEffects.playLcarsAcknowledge();
    this.addLogEvent(
      'TACTICAL',
      'success',
      'Shore leave authorized on Spacedock promenade. Crew morale and combat readiness restored to 100%.',
      'Duty officer rotation complete. +10% phaser recharge rate bonus active.'
    );
    this.broadcastState(true);
  }

  public triageCrewMedical(): void {
    if (!this.isDocked || !this.stationOpsState) return;
    this.stationOpsState.medicalTriageComplete = true;
    soundEffects.playLcarsAcknowledge();
    this.addLogEvent('TACTICAL', 'success', 'Starbase medical personnel report all duty officers cleared for frontline service.');
    this.broadcastState(true);
  }

  // Debug/Test helper to apply 42% hull damage so user can immediately test and enjoy procedural drone repairs!
  public testDamageForDemo(): void {
    this.applyDamageToEnterprise(45);
    if (this.stationOpsState) {
      this.stationOpsState.hullIntegrity = this.hullIntegrity;
      this.stationOpsState.isRepairComplete = false;
      this.stationOpsState.estimatedSecondsRemaining = Math.ceil((100 - this.hullIntegrity) / (this.stationOpsState.repairRatePerSec || 2.5));
    }
    soundEffects.playLcarsBeep(440, 0.2);
    this.broadcastState(true);
  }

  /**
   * Handles the Sol System Black Hole ('sol_black_hole') gravitational capture zone,
   * multi-second relativistic spacetime-warping visual tunnel, and White Hole ('kronos_white_hole')
   * ejection directly into the Qo'noS system ('kronos_system').
   */
  private updateBlackHoleGravitationalMechanic(delta: number) {
    // Sol Black Hole placed 21 AU beyond Pluto [7400, 65, 5600] outside the Sol planetary system
    const bhPos = new THREE.Vector3(11335, 110, 8600);
    // Qo'noS White Dwarf / White Hole placed 21 AU beyond Boreth [77460, 2036, -86209] outside the Qo'noS planetary system
    const whPos = new THREE.Vector3(79100, 2400, -90900);
    const qonosPos = new THREE.Vector3(77230, 1337, -81583);

    // 1. If currently locked inside the Event Horizon / Einstein-Rosen Bridge transit sequence (0s -> 4.8s):
    if (this.blackHoleTransitTimer > 0) {
      this.blackHoleTransitTimer += delta;
      const t = this.blackHoleTransitTimer;

      if (t < 1.5) {
        // PHASE 1: INFALL INTO THE EVENT HORIZON (0.0s -> 1.5s)
        const prog = Math.min(1.0, t / 1.5);
        const toBH = bhPos.clone().sub(this.position);
        const dist = toBH.length();
        const dir = dist > 0.001 ? toBH.clone().normalize() : new THREE.Vector3(0, 0, -1);

        // Relativistic spiral infall into the pitch-black singularity
        const tangent = new THREE.Vector3(-dir.z, 0.15, dir.x).normalize();
        const pullSpeed = 240 + prog * 380;
        const swirlSpeed = (1.0 - prog * 0.5) * 140;
        this.position.addScaledVector(dir, Math.min(dist, pullSpeed * delta));
        this.position.addScaledVector(tangent, swirlSpeed * delta);

        const lookQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
        this.orientation.slerp(lookQuat, delta * 5.5);
        this.orientation.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, delta * (1.8 + prog * 3.5))));
        this.orientation.normalize();

        this.screenShakeIntensity = 0.45 + prog * 0.45;
        this.space.updateSpacetimeWarpEffect?.(
          delta,
          this.clock.getElapsedTime(),
          true,
          'infall',
          0.35 + prog * 0.65,
          this.position,
          this.orientation
        );

        this.blackHoleTransit = {
          active: true,
          phase: 'infall',
          progress: Number(prog.toFixed(2)),
          distance: Math.round(dist),
        };
      } else if (t < 3.4) {
        // PHASE 2: SPACETIME SINGULARITY WARP TUNNEL (1.5s -> 3.4s)
        const prog = Math.min(1.0, (t - 1.5) / 1.9);
        this.screenShakeIntensity = 0.85;

        // Spin ship gently along roll axis inside the relativistic Einstein-Rosen bridge
        this.orientation.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, delta * 4.2)));
        this.orientation.normalize();

        // At midpoint (2.3s), transition across spacetime from Sol Black Hole to Qo'noS White Hole!
        if (t >= 2.3 && this.currentSystemId !== 'kronos_system') {
          this.currentSystemId = 'kronos_system';
          this.space.setActiveSystem?.('kronos_system');
          this.position.copy(whPos);
          const toQonos = qonosPos.clone().sub(whPos).normalize();
          this.orientation.setFromUnitVectors(new THREE.Vector3(0, 0, -1), toQonos);
          this.forwardVector.copy(toQonos);
          this.velocity.set(0, 0, 0);
          this.space.warpEffect?.triggerWarpEngagementFlash();
        }

        this.space.updateSpacetimeWarpEffect?.(
          delta,
          this.clock.getElapsedTime(),
          true,
          'singularity',
          1.0,
          this.position,
          this.orientation
        );

        this.blackHoleTransit = {
          active: true,
          phase: 'singularity',
          progress: Number(prog.toFixed(2)),
          distance: 0,
        };
      } else if (t < 4.8) {
        // PHASE 3: WHITE HOLE / WHITE DWARF RELATIVISTIC EJECTION INTO QO'NOS (3.4s -> 4.8s)
        const prog = Math.min(1.0, (t - 3.4) / 1.4);

        if (!this.blackHoleEjectedApplied) {
          this.blackHoleEjectedApplied = true;
          this.currentSystemId = 'kronos_system';
          this.space.setActiveSystem?.('kronos_system');
          this.selectedTargetId = 'qonos_prime';
          this.space.warpEffect?.triggerWarpExitFlash();
          soundEffects.playWarpEngage();
          soundEffects.playLcarsAcknowledge();
          // Stop the Star Trek theme song 3 seconds after coming out of the White Dwarf!
          battleThemeManager.stopAfterWhiteHoleEjection(3000);
          this.addLogEvent(
            'NAVIGATION',
            'success',
            "WHITE HOLE EJECTION: Emerged in Qo'noS System (Klingon Homeworld)",
            "Ejected from the Qo'noS White Dwarf Singularity 21 AU outside the Qo'noS system after traversing the Sol Black Hole bridge."
          );
        }

        // Propel vessel rapidly outward from the White Hole toward Qo'noS Prime to a safe 480-unit standoff
        const ejectDir = qonosPos.clone().sub(whPos).normalize();
        ejectDir.y += 0.08;
        ejectDir.normalize();

        const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), ejectDir);
        this.orientation.slerp(targetQuat, delta * 6.0);
        this.forwardVector.set(0, 0, -1).applyQuaternion(this.orientation);
        this.upVector.set(0, 1, 0).applyQuaternion(this.orientation);
        this.rightVector.set(1, 0, 0).applyQuaternion(this.orientation);

        const ejectSpeed = (1.0 - prog * 0.72) * 460;
        this.position.addScaledVector(ejectDir, ejectSpeed * delta);
        this.velocity.copy(ejectDir).multiplyScalar(65);
        this.screenShakeIntensity = (1.0 - prog) * 0.45;

        this.space.updateSpacetimeWarpEffect?.(
          delta,
          this.clock.getElapsedTime(),
          true,
          'ejection',
          prog,
          this.position,
          this.orientation
        );

        this.blackHoleTransit = {
          active: true,
          phase: 'ejection',
          progress: Number(prog.toFixed(2)),
          distance: Math.round(this.position.distanceTo(whPos)),
        };
      } else {
        // Complete transit cleanly in Qo'noS system
        this.blackHoleTransitTimer = 0;
        this.blackHoleTransit = null;
        this.blackHoleEjectedApplied = false;
        this.blackHoleWarningLogged = false;
        this.throttlePercent = 25;
        this.space.updateSpacetimeWarpEffect?.(delta, this.clock.getElapsedTime(), false, 'pulling', 0, this.position, this.orientation);
        this.broadcastState(true);
      }
      return;
    }

    // 2. Check if Enterprise is in Sol System and within the Black Hole's gravitational capture radius (< 760 units)
    if (this.currentSystemId === 'sol_system' && !this.isDocked) {
      const toBH = bhPos.clone().sub(this.position);
      const distToBH = toBH.length();

      if (distToBH <= 245) {
        // Crossed Event Horizon capture boundary! Lock into Singularity Infall -> White Hole Ejection sequence
        this.blackHoleTransitTimer = 0.001;
        this.blackHoleEjectedApplied = false;
        this.isWarping = false;
        if (this.activeCoursePlot) {
          this.activeCoursePlot.isEngaged = false;
          this.activeCoursePlot = null;
        }
        soundEffects.playWarpEngage();
        soundEffects.playShieldHit();
        // Play the Star Trek theme song starting from 42 seconds during the Black Hole travel!
        battleThemeManager.playBlackHoleTransitTheme();
        this.space.warpEffect?.triggerWarpEngagementFlash();
        this.addLogEvent(
          'NAVIGATION',
          'critical',
          'EVENT HORIZON CROSSED: Entering Sol Black Hole Singularity',
          "Extreme gravitational lensing and spacetime curvature detected! Transit to Qo'noS White Hole initiated."
        );
        this.broadcastState(true);
        return;
      } else if (distToBH < 760) {
        // Inside Gravitational Pull Zone (245 < distToBH < 760):
        // Draw the starship inward with escalating relativistic tidal force
        const pullFactor = Math.pow(1.0 - (distToBH - 245) / (760 - 245), 1.6);
        const dirToBH = toBH.clone().normalize();
        const tangent = new THREE.Vector3(-dirToBH.z, 0.08, dirToBH.x).normalize();

        // Pull velocity increases steeply as ship approaches the event horizon
        const pullSpeed = 38 + pullFactor * 250;
        const swirlSpeed = pullFactor * 65;
        this.position.addScaledVector(dirToBH, pullSpeed * delta);
        this.position.addScaledVector(tangent, swirlSpeed * delta);

        // Gently torque the nose toward the accretion disk & event horizon
        const bhQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), dirToBH);
        this.orientation.slerp(bhQuat, delta * (0.65 + pullFactor * 2.4));
        this.forwardVector.set(0, 0, -1).applyQuaternion(this.orientation);
        this.upVector.set(0, 1, 0).applyQuaternion(this.orientation);
        this.rightVector.set(1, 0, 0).applyQuaternion(this.orientation);

        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, pullFactor * 0.38);

        if (!this.blackHoleWarningLogged) {
          this.blackHoleWarningLogged = true;
          soundEffects.playLcarsBeep(520, 0.12);
          this.addLogEvent(
            'NAVIGATION',
            'warning',
            'GRAVITATIONAL PULL: Approaching Sol Black Hole Event Horizon',
            'Intense gravitational well pulling vessel toward the accretion disk. Fly closer to enter the singularity bridge to Qo\'noS.'
          );
        }

        this.space.updateSpacetimeWarpEffect?.(
          delta,
          this.clock.getElapsedTime(),
          true,
          'pulling',
          pullFactor * 0.35,
          this.position,
          this.orientation
        );

        this.blackHoleTransit = {
          active: true,
          phase: 'pulling',
          progress: Number(pullFactor.toFixed(2)),
          distance: Math.round(distToBH),
        };
        return;
      }
    }

    // Outside gravitational pull radius: ensure spacetime warp effect is turned off
    if (this.blackHoleTransit !== null) {
      this.blackHoleTransit = null;
      this.blackHoleWarningLogged = false;
      this.space.updateSpacetimeWarpEffect?.(delta, this.clock.getElapsedTime(), false, 'pulling', 0, this.position, this.orientation);
    }
  }

  public getSolarSystems(): SolarSystem[] {
    return this.space.systems;
  }

  public getPlanets(): PlanetData[] {
    return this.space.planets.map((p) => {
      const mesh = this.space.targetMeshes.get(p.id);
      if (mesh) {
        return {
          ...p,
          position: [Math.round(mesh.position.x), Math.round(mesh.position.y), Math.round(mesh.position.z)],
        };
      }
      return p;
    });
  }

  public getEnemyFleet(): EnemyShipState[] {
    return this.combatManager.getEnemyStates(this.position);
  }

  public getTargets(): CelestialTarget[] {
    return this.space.planets.map((p) => {
      const mesh = this.space.targetMeshes.get(p.id);
      const dist = mesh ? Math.round(this.position.distanceTo(mesh.position)) : 0;
      return {
        id: p.id,
        name: p.name,
        type: p.type === 'starbase' ? 'starbase' : p.type === 'gas_giant' ? 'gas_giant' : 'planet',
        position: p.position,
        distance: dist,
        description: p.description,
        scanned: true,
      };
    });
  }

  public getSubsystems(): ShipSubsystem[] {
    return [
      {
        id: 'bridge',
        name: 'Main Bridge & Command Module',
        deck: 'Deck 1',
        section: 'primary',
        position: [0, 4.1, 4.2],
        status: 'Nominal',
        description: 'Command center with Captain chair, dual helm navigation station, and circumference LCARS displays.',
        specs: 'Duotronic computer core uplink, emergency blast shielding, 3D bridge interior view active.',
      },
      {
        id: 'phaser_banks',
        name: 'Type VI Heavy Phaser Banks',
        deck: 'Deck 7',
        section: 'primary',
        position: [0, 3.4, 10.4],
        status: this.phaserEnergy > 20 ? 'Active' : 'Standby',
        description: 'Collimated high-energy nadion particle emitters with target tracking and particle burst ignition.',
        specs: 'Output: 2.8 Terawatts per emitter, 360° spherical coverage array.',
      },
      {
        id: 'sensor_array',
        name: 'Primary Planetary Sensor Dome',
        deck: 'Deck 11 (Ventral)',
        section: 'primary',
        position: [0, 0.15, 4.2],
        status: 'Nominal',
        description: 'High-resolution subspace optical, graviton, and spectral sensor scanners.',
        specs: 'Range: 8.5 Light Years, active multi-system astronomical cartography.',
      },
      {
        id: 'impulse_engines',
        name: 'Dual Fusion Impulse Drive',
        deck: 'Decks 7-8 (Aft)',
        section: 'primary',
        position: [0, 2.25, -9.0],
        status: this.throttlePercent > 0 ? 'Active' : 'Standby',
        description: 'Deuterium fusion reactor driving magnetoplasmadynamic thrust manifolds.',
        specs: 'Max Sublight Acceleration: 0.25c (74,948 km/s), inertial damper linkage.',
      },
      {
        id: 'torpedo_bay',
        name: 'Forward Photon Torpedo Launchers',
        deck: 'Dorsal Neck (Deck 13)',
        section: 'neck',
        position: [0, -0.35, 4.4],
        status: this.torpedoCount > 0 ? 'Nominal' : 'Standby',
        description: 'Magnetic acceleration tubes firing matter-antimatter warheads producing high-yield particle explosions.',
        specs: `Magazine: ${this.torpedoCount} Torpedoes loaded. High-density spark/shockwave payload.`,
      },
      {
        id: 'deflector_dish',
        name: 'Navigational Deflector & Subspace Emitter',
        deck: 'Secondary Hull Bow',
        section: 'secondary',
        position: [0, -2.4, 7.8],
        status: 'Active',
        description: 'Classic copper and amber parabolic dish fixture mounted at the front nose of the secondary hull with central emitter spike.',
        specs: 'Copper-bronze bezel housing, subspace particle clearing array, warm amber graviton emitter field.',
      },
      {
        id: 'warp_core',
        name: 'Matter / Antimatter Warp Reactor',
        deck: 'Main Engineering (Deck 14)',
        section: 'secondary',
        position: [0, -2.4, -3.2],
        status: 'Nominal',
        description: 'Dilithium crystal intermix chamber powering interplanetary and interstellar transit.',
        specs: 'Output: 5.2 Exawatts, automated multi-system course navigation lock.',
      },
      {
        id: 'shuttlebay',
        name: 'Main Flight Deck & Shuttlebay',
        deck: 'Secondary Hull Aft (Deck 16)',
        section: 'secondary',
        position: [0, -2.0, -12.4],
        status: 'Nominal',
        description: 'Hangar and maintenance bay with runway approach illumination and atmospheric force field.',
        specs: 'Capacity for Class F shuttlecraft and orbital workpods.',
      },
      {
        id: 'port_nacelle',
        name: 'Port Warp Nacelle & Bussard Ramscoop',
        deck: 'Nacelle Pylon Port',
        section: 'nacelles',
        position: [-9.0, 4.4, 0],
        status: this.isWarping ? 'Active' : 'Standby',
        description: 'Features glowing red Bussard ramscoop collector and radiant blue warp coil grilles.',
        specs: 'Hydrogen ramscoop collector with internal spinning intake plasma blades.',
      },
      {
        id: 'starboard_nacelle',
        name: 'Starboard Warp Nacelle & Bussard Ramscoop',
        deck: 'Nacelle Pylon Starboard',
        section: 'nacelles',
        position: [9.0, 4.4, 0],
        status: this.isWarping ? 'Active' : 'Standby',
        description: 'Synchronized warp field generator maintaining warp bubble stability during factor 1-9 transit.',
        specs: 'Hydrogen ramscoop collector with internal spinning intake plasma blades.',
      },
      {
        id: 'shields',
        name: 'Deflector Shield Grid',
        deck: 'Hull Plating Grid',
        section: 'primary',
        position: [0, 1.0, -1.0],
        status: this.shieldsRaised ? 'Active' : 'Standby',
        description: 'Multiphasic energy barrier protecting hull against weapon impacts and spatial radiation.',
        specs: `Integrity: ${this.shieldIntegrity}%, harmonic modulation grid.`,
      },
    ];
  }
}
