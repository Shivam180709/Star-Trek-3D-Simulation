/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { SimulationEngine } from './three/simulationEngine';
import {
  CameraViewMode,
  AlertLevel,
  ShipState,
  CelestialTarget,
  ShipSubsystem,
  SolarSystem,
  TacticalLogEvent,
  StarfleetMission,
  MissionPerformanceReport,
  OfficerProfileRecord,
  BridgeStationId,
} from './types/simulation';
import { LCARSHeader } from './components/LCARSHeader';
import { BridgeCommandHUD } from './components/BridgeCommandHUD';
import { FlightHUD } from './components/FlightHUD';
import { LCARSControls } from './components/LCARSControls';
import { ShipInspectionModal } from './components/ShipInspectionModal';
import { SensorScanner } from './components/SensorScanner';
import { NavigationConsole } from './components/NavigationConsole';
import { TacticalRadar } from './components/TacticalRadar';
import { ControlsHelpModal } from './components/ControlsHelpModal';
import { TacticalLogConsole } from './components/TacticalLogConsole';
import { EnterpriseDestructionModal } from './components/EnterpriseDestructionModal';
import { StarSystemMapModal } from './components/StarSystemMapModal';
import { LCARSBattleThemeWidget } from './components/LCARSBattleThemeWidget';
import { LCARSVoiceSettingsModal } from './components/LCARSVoiceSettingsModal';
import { LCARSObjectDetailModal } from './components/LCARSObjectDetailModal';
import { SpeciesDatabaseModal } from './components/SpeciesDatabaseModal';
import { PlanetaryScannerModal } from './components/PlanetaryScannerModal';
import {
  calculateMissionPerformanceReport,
  officerProfileStore,
} from './data/starfleetMissionsData';
import { getObjectDetails } from './data/celestialObjectDatabase';
import { STAR_TREK_SOLAR_SYSTEMS } from './three/solarSystems';
import { battleThemeManager } from './audio/battleThemeManager';
import { computerVoice } from './audio/computerVoice';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  const prevDockedRef = useRef<boolean>(false);
  const prevInProximityRef = useRef<boolean>(false);

  const [shipState, setShipState] = useState<ShipState | null>(null);
  const [currentView, setCurrentView] = useState<CameraViewMode>('chase');
  const [targets, setTargets] = useState<CelestialTarget[]>([]);
  const [subsystems, setSubsystems] = useState<ShipSubsystem[]>([]);
  const [solarSystems, setSolarSystems] = useState<SolarSystem[]>(STAR_TREK_SOLAR_SYSTEMS);
  const [enemies, setEnemies] = useState<any[]>([]);
  const [planets, setPlanets] = useState<any[]>([]);
  const [combatAssist, setCombatAssist] = useState<boolean>(true);

  // Real-time Tactical Combat Logs
  const [logs, setLogs] = useState<TacticalLogEvent[]>([
    {
      id: 'init_1',
      timestamp: new Date().toTimeString().split(' ')[0],
      stardate: 'SD 47120.4',
      category: 'TACTICAL',
      type: 'info',
      message: 'USS Enterprise NCC-1701 Systems Nominal',
      details: 'All main computer duotronic relays active. Multiphasic shields online.',
    },
    {
      id: 'init_2',
      timestamp: new Date().toTimeString().split(' ')[0],
      stardate: 'SD 47120.5',
      category: 'DEFENSE',
      type: 'success',
      message: 'Shields at 100%',
      details: 'Deflector array running at maximum harmonic efficiency.',
    },
  ]);

  // Modals state
  const [isInspectionOpen, setIsInspectionOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState<boolean>(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isLogConsoleOpen, setIsLogConsoleOpen] = useState<boolean>(false);
  const [isLogDocked, setIsLogDocked] = useState<boolean>(false);
  const [isRadarScannerOpen, setIsRadarScannerOpen] = useState<boolean>(true);
  const [isBattleThemeOpen, setIsBattleThemeOpen] = useState<boolean>(false);
  const [isBattleThemePlaying, setIsBattleThemePlaying] = useState<boolean>(false);
  const [isComputerVoiceEnabled, setIsComputerVoiceEnabled] = useState<boolean>(computerVoice.isVoiceEnabled());
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState<boolean>(false);
  const [activeVoiceText, setActiveVoiceText] = useState<string>('');
  const [isObjectDetailModalOpen, setIsObjectDetailModalOpen] = useState<boolean>(false);
  const [isSpeciesDbOpen, setIsSpeciesDbOpen] = useState<boolean>(false);
  const [isPlanetaryScannerOpen, setIsPlanetaryScannerOpen] = useState<boolean>(false);
  const [isStationOpsOpen, setIsStationOpsOpen] = useState<boolean>(false);

  // Starfleet Missions & Science Exhibition 6-Digit Officer Profile State
  const [isMissionCommandOpen, setIsMissionCommandOpen] = useState<boolean>(false);
  const [isMissionWorkstationOpen, setIsMissionWorkstationOpen] = useState<boolean>(false);
  const [isMissionDebriefOpen, setIsMissionDebriefOpen] = useState<boolean>(false);
  const [isOfficerProfileOpen, setIsOfficerProfileOpen] = useState<boolean>(false);
  const [activeMission, setActiveMission] = useState<StarfleetMission | null>(null);
  const [lastMissionReport, setLastMissionReport] = useState<MissionPerformanceReport | null>(null);
  const [activeOfficerCode, setActiveOfficerCode] = useState<string | null>(null);
  const [missionsCompletedCount, setMissionsCompletedCount] = useState<number>(0);

  // Compute selected object detailed astrometric dossier automatically
  const selectedObjectInfo = useMemo(() => {
    const targetId = shipState?.selectedTargetId || shipState?.lockedEnemy?.id || 'sol_earth';
    return getObjectDetails(targetId, shipState?.position, enemies);
  }, [shipState?.selectedTargetId, shipState?.lockedEnemy?.id, shipState?.position, enemies]);

  // Subscribe to Computer Voice telemetry state
  useEffect(() => {
    computerVoice.onEnabledChange((enabled) => {
      setIsComputerVoiceEnabled(enabled);
    });
    return computerVoice.subscribe((speaking, text) => {
      setActiveVoiceText(speaking ? text : '');
    });
  }, []);

  // Subscribe to Battle Theme Soundtrack state
  useEffect(() => {
    return battleThemeManager.subscribe((state) => {
      setIsBattleThemePlaying((prev) => (prev !== state.isPlaying ? state.isPlaying : prev));
    });
  }, []);

  // Automatic Battle Theme Trigger when fighting enemy waves
  // Plays Star Trek Main Theme from YouTube (ID: oIyo8oC2cCE) cued to 40 seconds
  const isFightingWave = Boolean(
    shipState &&
      !shipState.isDestroyed &&
      shipState.hullIntegrity > 0 &&
      ((shipState.combatWaveState?.status === 'active' && (shipState.combatWaveState?.enemiesAlive ?? 1) > 0) ||
        (shipState.isUnderAttack && enemies.some((e) => e.isAlive)))
  );

  const prevFightingWaveRef = useRef<boolean>(false);

  useEffect(() => {
    if (!battleThemeManager.getAutoPlayOnCombat()) return;

    if (shipState?.isDestroyed || (shipState?.hullIntegrity ?? 100) <= 0) {
      battleThemeManager.stop();
      prevFightingWaveRef.current = false;
      return;
    }

    if (isFightingWave !== prevFightingWaveRef.current) {
      prevFightingWaveRef.current = isFightingWave;
      if (isFightingWave) {
        battleThemeManager.handleCombatStart();
      } else {
        battleThemeManager.handleCombatEnd();
      }
    }
  }, [isFightingWave, shipState?.isDestroyed, shipState?.hullIntegrity]);

  // Initialize simulation engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new SimulationEngine(
      containerRef.current,
      (state) => {
        setShipState(state);
        if (engineRef.current) {
          setEnemies(engineRef.current.getEnemyFleet());
        }
        prevDockedRef.current = !!state.isDocked;

        // Auto-expand In-HUD Mission Console when entering proximity zone (<= 520 km)
        const nowInProximity = Boolean(state.missionWaypoint?.isInProximity);
        if (nowInProximity && !prevInProximityRef.current && state.missionWaypoint?.status !== 'completed') {
          setIsMissionCommandOpen(false);
          setIsMissionWorkstationOpen(true);
        }
        prevInProximityRef.current = nowInProximity;
      },
      (event) => {
        setTimeout(() => {
          setLogs((prev) => [event, ...prev.slice(0, 49)]);
        }, 0);
      },
      () => {
        setIsLogConsoleOpen((prev) => !prev);
      }
    );
    engineRef.current = engine;

    setTargets(engine.getTargets());
    setSubsystems(engine.getSubsystems());
    setSolarSystems(engine.getSolarSystems());
    setPlanets(engine.getPlanets());
    setEnemies(engine.getEnemyFleet());

    // Update targets, enemies & planets distance periodically
    const targetInterval = setInterval(() => {
      if (engineRef.current) {
        setTargets(engineRef.current.getTargets());
        setEnemies(engineRef.current.getEnemyFleet());
        setPlanets(engineRef.current.getPlanets());
      }
    }, 600);

    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const targetEl = e.target as HTMLElement | null;
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        (targetEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetEl.tagName) || targetEl.isContentEditable)) ||
        (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable))
      ) {
        return;
      }

      // Warp Drive Shortcuts: Ctrl + Alt + 1..9 (Engage Warp Factor) & Ctrl + Alt + R (Drop Out of Warp)
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        const numMatch = e.code.match(/^(?:Digit|Numpad)([1-9])$/);
        const factorNum = numMatch ? parseInt(numMatch[1], 10) : (e.key >= '1' && e.key <= '9' ? parseInt(e.key, 10) : null);
        if (factorNum !== null) {
          e.preventDefault();
          engineRef.current?.engageWarp(factorNum);
          return;
        }

        if (e.code === 'KeyR' || e.key.toLowerCase() === 'r' || e.code === 'Digit0' || e.code === 'Numpad0' || e.key === '0') {
          e.preventDefault();
          engineRef.current?.dropWarp();
          return;
        }
      }

      if (e.code === 'Escape' || e.code === 'Backspace') {
        if (engineRef.current?.getIsWarping() || shipState?.activeCoursePlot) {
          engineRef.current?.dropWarp();
        } else if (shipState?.selectedTargetId || shipState?.lockedEnemy) {
          engineRef.current?.clearSelection();
        }
      } else if (e.key === 'j' || e.key === 'J') {
        setIsMissionCommandOpen((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        setIsLogConsoleOpen((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        setIsRadarScannerOpen((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMapModalOpen((prev) => !prev);
      } else if (e.key === 'n' || e.key === 'N') {
        setIsNavigationOpen((prev) => !prev);
      } else if (e.key === 'b' || e.key === 'B') {
        if (e.altKey) {
          e.preventDefault();
          battleThemeManager.playFromTime(38);
        } else {
          battleThemeManager.toggle();
        }
      } else if (e.key === 'v' || e.key === 'V') {
        const next = computerVoice.toggle();
        setIsComputerVoiceEnabled(next);
      } else if (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z') {
        engineRef.current?.clearSelection();
      } else if (e.key === 'x' || e.key === 'X') {
        setIsSpeciesDbOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);

    return () => {
      window.removeEventListener('keydown', handleGlobalKey);
      clearInterval(targetInterval);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Handlers
  const handleDock = useCallback((stationId?: string) => {
    engineRef.current?.dockAtStation(stationId);
  }, []);

  const handleUndock = useCallback(() => {
    engineRef.current?.undockFromStation();
  }, []);

  const handleDeployRepairDrones = useCallback((count: number, mode: 'ablative' | 'structural' | 'microweld' | 'overhaul') => {
    engineRef.current?.deployRepairDrones(count, mode);
  }, []);

  const handleRecallRepairDrones = useCallback(() => {
    engineRef.current?.recallRepairDrones();
  }, []);

  const handleToggleClamps = useCallback(() => {
    engineRef.current?.toggleDockingClamps();
  }, []);

  const handleToggleShorePower = useCallback(() => {
    engineRef.current?.toggleShorePower();
  }, []);

  const handleRefuelAntimatter = useCallback(() => {
    engineRef.current?.refuelAntimatter();
  }, []);

  const handleReloadTorpedoes = useCallback((type: 'photon' | 'quantum' | 'tricobalt') => {
    engineRef.current?.reloadTorpedoes(type);
  }, []);

  const handleRealignDilithium = useCallback((frequency: number) => {
    engineRef.current?.realignDilithiumMatrix(frequency);
  }, []);

  const handlePurgeCoolant = useCallback(() => {
    engineRef.current?.purgeReactorCoolant();
  }, []);

  const handleGrantShoreLeave = useCallback(() => {
    engineRef.current?.grantCrewShoreLeave();
  }, []);

  const handleTriageMedical = useCallback(() => {
    engineRef.current?.triageCrewMedical();
  }, []);

  const handleTestDamageDemo = useCallback(() => {
    engineRef.current?.testDamageForDemo();
  }, []);

  const handleGoToNearestSpaceDock = useCallback(() => {
    return engineRef.current?.goToNearestSpaceDock();
  }, []);

  const handleToggleMap = useCallback(() => {
    setIsMapModalOpen((prev) => !prev);
  }, []);

  const handleSetAlert = useCallback((level: AlertLevel) => {
    engineRef.current?.setAlertLevel(level);
  }, []);

  const handleSetCameraView = useCallback((mode: CameraViewMode) => {
    setCurrentView(mode);
    engineRef.current?.setCameraView(mode);
  }, []);

  const handleToggleBridgeInterior = useCallback(() => {
    setCurrentView((prev) => {
      const next = prev === 'interior_bridge' ? 'chase' : 'interior_bridge';
      engineRef.current?.setCameraView(next);
      return next;
    });
  }, []);

  const handleSelectBridgeStation = useCallback((station: BridgeStationId) => {
    setCurrentView('interior_bridge');
    engineRef.current?.setBridgeStation(station);
  }, []);

  const handleResetBridgeLook = useCallback(() => {
    engineRef.current?.resetBridgeLookAngle();
  }, []);

  const handleAdjustBridgeLook = useCallback((dYaw: number, dPitch: number) => {
    engineRef.current?.adjustBridgeLookAngle(dYaw, dPitch);
  }, []);

  const handleSetShipHeadingAndPitch = useCallback((headingDeg: number, pitchDeg: number) => {
    engineRef.current?.setShipHeadingAndPitch(headingDeg, pitchDeg);
  }, []);

  const handleSyncBridgeHardwareTelemetry = useCallback(
    (params: {
      warpFactor?: number;
      throttlePercent?: number;
      shieldFreqMhz?: number;
      shieldsRaised?: boolean;
      wavelengthNm?: number;
      subspaceFreqMhz?: number;
      headingDeg?: number;
      pitchDeg?: number;
    }) => {
      engineRef.current?.syncBridgeHardwareTelemetry(params);
    },
    []
  );

  const handleSetThrottle = useCallback((percent: number) => {
    engineRef.current?.setThrottle(percent);
  }, []);

  const handleSetWarpFactor = useCallback((factor: number) => {
    engineRef.current?.setWarpFactor(factor);
  }, []);

  const handleToggleWarp = useCallback(() => {
    engineRef.current?.toggleWarp();
  }, []);

  const handleDropWarp = useCallback(() => {
    engineRef.current?.dropWarp();
  }, []);

  const handleClearTarget = useCallback(() => {
    engineRef.current?.clearSelection();
  }, []);

  const handleStartPhaser = useCallback(() => {
    engineRef.current?.startPhaserFiring();
  }, []);

  const handleStopPhaser = useCallback(() => {
    engineRef.current?.stopPhaserFiring();
  }, []);

  const handleFireTorpedo = useCallback(() => {
    engineRef.current?.firePhotonTorpedo();
  }, []);

  const handleTriggerBoost = useCallback(() => {
    engineRef.current?.triggerEvasiveBoost();
  }, []);

  const handleToggleComputerVoice = useCallback(() => {
    const next = computerVoice.toggle();
    setIsComputerVoiceEnabled(next);
  }, []);

  const handleToggleShields = useCallback(() => {
    if (!shipState) return;
    engineRef.current?.setShields(!shipState.shieldsRaised);
  }, [shipState]);

  const handleToggleAutoPilot = useCallback(() => {
    engineRef.current?.toggleAutoPilot();
  }, []);

  const handleSelectTarget = useCallback((targetId: string) => {
    engineRef.current?.setSelectedTarget(targetId);
  }, []);

  const handleFocusSubsystem = useCallback((subsystemId: string) => {
    setCurrentView('orbit');
    engineRef.current?.focusSubsystem(subsystemId);
  }, []);

  // Course Plotting
  const handleSetCourse = useCallback((systemId: string, planetId?: string, warpFactor?: number) => {
    engineRef.current?.setCourseToSolarSystem(systemId, planetId, warpFactor);
    setIsNavigationOpen(false);
    setIsMapModalOpen(false);
  }, []);

  const handleSetCoordinatesCourse = useCallback((coords: [number, number, number], systemId?: string, warpFactor?: number, label?: string) => {
    engineRef.current?.setCourseToCoordinates(coords, systemId, warpFactor, label);
    setIsNavigationOpen(false);
    setIsMapModalOpen(false);
  }, []);

  const handleCancelCourse = useCallback(() => {
    engineRef.current?.cancelCourse();
  }, []);

  const handleQuickPlotCourse = useCallback((targetId: string) => {
    for (const sys of STAR_TREK_SOLAR_SYSTEMS) {
      if (sys.planets.some((p) => p.id === targetId)) {
        handleSetCourse(sys.id, targetId);
        return;
      }
      if (`${sys.id}_primary_star` === targetId) {
        handleSetCourse(sys.id);
        return;
      }
    }
    handleSelectTarget(targetId);
  }, [handleSetCourse, handleSelectTarget]);

  const handleTargetHostile = useCallback(() => {
    engineRef.current?.targetNextHostile();
  }, []);

  const handleSummonHostiles = useCallback(() => {
    engineRef.current?.summonHostileFleet();
    battleThemeManager.handleCombatStart();
  }, []);

  const handleRestartSimulation = useCallback((retryCurrentWave?: boolean) => {
    engineRef.current?.restartSimulation(retryCurrentWave);
    if (!retryCurrentWave) {
      setEnemies([]);
    } else if (engineRef.current) {
      setEnemies(engineRef.current.getEnemyFleet());
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    engineRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    engineRef.current?.zoomOut();
  }, []);

  const handleResetZoom = useCallback(() => {
    engineRef.current?.resetZoom();
  }, []);

  const handleToggleCombatAssist = useCallback(() => {
    engineRef.current?.toggleCombatAssist();
    setCombatAssist((prev) => !prev);
  }, []);

  const handleLockEnemy = useCallback((enemyId: string) => {
    engineRef.current?.setLockedEnemy(enemyId);
  }, []);

  // --- Starfleet Missions & 6-Digit Exhibition Officer Profile Handlers (Integrated in FlightHUD) ---
  const handleAcceptMission = useCallback((mission: StarfleetMission) => {
    setActiveMission(mission);
    setLastMissionReport(null);
    prevInProximityRef.current = false;
    engineRef.current?.acceptStarfleetMission(mission);
    setIsMissionCommandOpen(false);
  }, []);

  const handleAbortMission = useCallback(() => {
    setActiveMission(null);
    setIsMissionWorkstationOpen(false);
    setIsMissionCommandOpen(false);
    prevInProximityRef.current = false;
    engineRef.current?.abortStarfleetMission();
  }, []);

  const handleSetMissionShieldHarmonics = useCallback((efficiencyPercent: number) => {
    engineRef.current?.setMissionShieldHarmonics(efficiencyPercent);
  }, []);

  const handleStartPlanetaryDefenseWave = useCallback(() => {
    engineRef.current?.startPlanetaryDefenseWave();
    battleThemeManager.handleCombatStart();
  }, []);

  const handleFireDeflectorBeam = useCallback(
    (coords?: [number, number, number], colorHex?: number, duration?: number) => {
      engineRef.current?.fireDeflectorParticleBeam(coords, colorHex, duration);
    },
    []
  );

  const handleTriggerHazardShake = useCallback((intensity?: number) => {
    engineRef.current?.triggerHazardShake(intensity);
  }, []);

  const handleTriggerMission3DAction = useCallback(
    (action: 'sensor_pulse' | 'launch_probe' | 'activate_node' | 'stabilize_field', nodeIndex?: number) => {
      engineRef.current?.triggerMission3DAction(action, nodeIndex);
    },
    []
  );

  const handleCompleteMission = useCallback(
    (metrics: {
      accuracyScore: number;
      tacticalEfficiencyScore: number;
      diplomaticOrScienceScore: number;
      elapsedSeconds: number;
      bonusCompleted: boolean;
    }) => {
      if (!activeMission || !engineRef.current) return;

      const currentProg = shipState?.progression || {
        xp: 0,
        level: 1,
        rank: 'Ensign' as const,
        nextLevelXp: 500,
        totalEnemiesDestroyed: 0,
        scoutsDestroyed: 0,
        cruisersDestroyed: 0,
        mothershipsDestroyed: 0,
        activeThreatLevel: 'Standard' as const,
      };

      const finalReport = calculateMissionPerformanceReport(
        activeMission,
        metrics,
        currentProg
      );

      // Award XP in SimulationEngine & AdaptiveDifficultyTracker
      engineRef.current.awardMissionXp(
        finalReport.totalXpEarned,
        activeMission.title
      );

      const nextCount = missionsCompletedCount + 1;
      setMissionsCompletedCount(nextCount);

      // Sync to 6-Digit Officer Profile if active
      if (activeOfficerCode) {
        officerProfileStore.syncProfile(
          activeOfficerCode,
          {
            ...currentProg,
            xp: finalReport.newXp,
            level: finalReport.newLevel,
            rank: finalReport.newRank,
            nextLevelXp: finalReport.nextLevelXp,
          },
          shipState?.adaptiveDifficulty?.combatRating ?? 100,
          {
            id: activeMission.id,
            title: activeMission.title,
            archetype: activeMission.archetype,
            grade: finalReport.grade,
            xpEarned: finalReport.totalXpEarned,
          }
        );
      }

      setIsMissionWorkstationOpen(false);
      setLastMissionReport(finalReport);
      setActiveMission(null);
    },
    [activeMission, shipState?.progression, shipState?.adaptiveDifficulty?.combatRating, missionsCompletedCount, activeOfficerCode]
  );

  const handleProfileActivated = useCallback((profile: OfficerProfileRecord) => {
    setActiveOfficerCode(profile.code);
    setMissionsCompletedCount(profile.missionsCompleted);
    engineRef.current?.restoreOfficerProfileToEngine(profile);
  }, []);

  const handleProfileDisconnected = useCallback(() => {
    setActiveOfficerCode(null);
    engineRef.current?.setActiveOfficerCode(null);
  }, []);

  const enemiesAliveCount = useMemo(
    () => enemies.filter((e) => e.isAlive).length,
    [enemies]
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-slate-100 flex flex-col font-sans select-none">
      {/* 3D WebGL Canvas Layer */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Top LCARS Navigation & Alert Status Bar */}
      <LCARSHeader
        shipState={shipState}
        onSetAlert={handleSetAlert}
        onGAlertAction={() => engineRef.current?.handleGAlertAction()}
        onToggleInspection={() => setIsInspectionOpen((prev) => !prev)}
        onToggleScanner={() => setIsScannerOpen((prev) => !prev)}
        onToggleHelp={() => setIsHelpOpen((prev) => !prev)}
        onToggleLog={() => setIsLogConsoleOpen((prev) => !prev)}
        onToggleTacticalScanner={() => setIsRadarScannerOpen((prev) => !prev)}
        onToggleBattleTheme={() => battleThemeManager.toggle()}
        onOpenBattleThemeSettings={() => setIsBattleThemeOpen(true)}
        onOpenVoiceSettings={() => setIsVoiceSettingsOpen(true)}
        onToggleComputerVoice={handleToggleComputerVoice}
        onToggleSpeciesDb={() => setIsSpeciesDbOpen((prev) => !prev)}
        onOpenPlanetaryScanner={() => setIsPlanetaryScannerOpen(true)}
        onToggleMissions={() => setIsMissionCommandOpen((prev) => !prev)}
        onOpenOfficerProfile={() => setIsOfficerProfileOpen((prev) => !prev)}
        onToggleBridgeInterior={handleToggleBridgeInterior}
        isBridgeInteriorActive={currentView === 'interior_bridge'}
        isMissionsOpen={isMissionCommandOpen}
        hasActiveMission={Boolean(activeMission && shipState?.missionWaypoint)}
        activeOfficerCode={activeOfficerCode}
        isComputerVoiceEnabled={isComputerVoiceEnabled}
        isInspectionOpen={isInspectionOpen}
        isScannerOpen={isScannerOpen}
        isLogOpen={isLogConsoleOpen}
        isTacticalScannerOpen={isRadarScannerOpen}
        isBattleThemePlaying={isBattleThemePlaying}
        isSpeciesDbOpen={isSpeciesDbOpen}
        logCount={logs.length}
      />

      {/* 3D USS Enterprise Bridge Interior & Crew Command System Overlay */}
      {currentView === 'interior_bridge' && (
        <BridgeCommandHUD
          shipState={shipState}
          activeStation={shipState?.bridgeStation || 'captain'}
          targets={targets}
          enemies={enemies}
          activeMission={activeMission}
          onSelectStation={handleSelectBridgeStation}
          onExitBridgeToChase={() => handleSetCameraView('chase')}
          onResetLook={handleResetBridgeLook}
          onAdjustLook={handleAdjustBridgeLook}
          onSetHeadingAndPitch={handleSetShipHeadingAndPitch}
          onSyncHardwareTelemetry={handleSyncBridgeHardwareTelemetry}
          onSetThrottle={handleSetThrottle}
          onSetWarpFactor={handleSetWarpFactor}
          onToggleWarp={handleToggleWarp}
          onTriggerBoost={handleTriggerBoost}
          onToggleShields={handleToggleShields}
          onSetShieldHarmonics={handleSetMissionShieldHarmonics}
          onStartPhaser={handleStartPhaser}
          onStopPhaser={handleStopPhaser}
          onFireTorpedo={handleFireTorpedo}
          onTargetHostile={handleTargetHostile}
          onLockEnemy={handleLockEnemy}
          onSelectTarget={handleSelectTarget}
          onQuickPlotCourse={handleQuickPlotCourse}
          onSetAlert={handleSetAlert}
          onFireDeflectorBeam={handleFireDeflectorBeam}
          onTriggerMission3DAction={handleTriggerMission3DAction}
          onOpenPlanetaryScanner={() => setIsPlanetaryScannerOpen(true)}
          onOpenObjectDetails={() => setIsObjectDetailModalOpen(true)}
          onSetViewscreenZoom={(zoom) => engineRef.current?.setViewscreenZoom(zoom)}
          onToggleMissions={() => setIsMissionCommandOpen((prev) => !prev)}
          onDock={handleDock}
          onUndock={handleUndock}
          onAwardScienceXp={(xp, label) => engineRef.current?.awardMissionXp(xp, label)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onSummonHostiles={handleSummonHostiles}
        />
      )}

      {/* Real-time LCARS Computer Voice Telemetry Audio Comm-Link Banner */}
      {activeVoiceText && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-950/95 border border-sky-400 shadow-2xl shadow-sky-500/50 text-xs backdrop-blur-xl">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-sky-400" />
            </div>
            <span className="font-trek uppercase tracking-widest text-sky-400 font-bold text-[11px]">
              ENTERPRISE NCC-1701 // TACTICAL AUDIO:
            </span>
            <span className="font-mono text-slate-100 font-semibold tracking-wide">
              "{activeVoiceText}"
            </span>
            {/* Real-time Voice Audio Equalizer Waveform */}
            <div className="flex items-end gap-0.5 h-3.5 ml-2">
              <span className="w-0.5 bg-sky-400 animate-pulse h-2" />
              <span className="w-0.5 bg-sky-300 animate-bounce h-3.5" />
              <span className="w-0.5 bg-sky-400 animate-pulse h-1.5" />
              <span className="w-0.5 bg-sky-200 animate-bounce h-2.5" />
            </div>
          </div>
        </div>
      )}

      {/* In-Flight HUD, Telemetry, Ordnance, Space Station Ops, Missions & Real-Time Tactical Alerts */}
      <FlightHUD
        shipState={shipState}
        currentView={currentView}
        targets={targets}
        solarSystems={solarSystems}
        enemies={enemies}
        enemiesAliveCount={enemiesAliveCount}
        onLockEnemy={handleLockEnemy}
        onDisengageWarp={handleDropWarp}
        onSetWarpFactor={handleSetWarpFactor}
        onSummonNextWave={handleSummonHostiles}
        onDock={handleDock}
        onUndock={handleUndock}
        onDeployDrones={handleDeployRepairDrones}
        onRecallDrones={handleRecallRepairDrones}
        onToggleClamps={handleToggleClamps}
        onToggleShorePower={handleToggleShorePower}
        onRefuelAntimatter={handleRefuelAntimatter}
        onReloadTorpedoes={handleReloadTorpedoes}
        onPurgeCoolant={handlePurgeCoolant}
        onGrantShoreLeave={handleGrantShoreLeave}
        onTestDamageDemo={handleTestDamageDemo}
        onToggleNavigation={() => setIsNavigationOpen((prev) => !prev)}
        onGoToNearestSpaceDock={handleGoToNearestSpaceDock}
        onTriggerBoost={handleTriggerBoost}
        onClearTarget={handleClearTarget}
        activeMission={activeMission}
        lastMissionReport={lastMissionReport}
        isMissionScannerOpen={isMissionCommandOpen}
        isMissionConsoleExpanded={isMissionWorkstationOpen}
        isOfficerPopoverOpen={isOfficerProfileOpen}
        activeOfficerCode={activeOfficerCode}
        missionsCompletedCount={missionsCompletedCount}
        onToggleMissionScanner={() => setIsMissionCommandOpen((prev) => !prev)}
        onSetMissionConsoleExpanded={setIsMissionWorkstationOpen}
        onCloseOfficerPopover={() => setIsOfficerProfileOpen(false)}
        onOpenOfficerPopover={() => setIsOfficerProfileOpen(true)}
        onAcceptMission={handleAcceptMission}
        onAbortMission={handleAbortMission}
        onClearDebrief={() => setLastMissionReport(null)}
        onWarpToMissionZone={(sysId, planetId) => handleSetCourse(sysId, planetId, 7.5)}
        onSetShieldHarmonics={handleSetMissionShieldHarmonics}
        onStartPlanetaryDefenseWave={handleStartPlanetaryDefenseWave}
        onFireDeflectorBeam={handleFireDeflectorBeam}
        onTriggerHazardShake={handleTriggerHazardShake}
        onTriggerMission3DAction={handleTriggerMission3DAction}
        onStartPhaser={handleStartPhaser}
        onStopPhaser={handleStopPhaser}
        onFireTorpedo={handleFireTorpedo}
        onTargetHostile={handleTargetHostile}
        onCompleteMission={handleCompleteMission}
        onProfileActivated={handleProfileActivated}
        onProfileDisconnected={handleProfileDisconnected}
        recentLogs={logs}
        onOpenFullLog={() => setIsLogConsoleOpen(true)}
        isScannerOpen={isScannerOpen}
      />

      {/* Real-time Tactical Astrometric Radar Scanner (Hidden in 3D Bridge Interior unless explicitly opened) */}
      {currentView !== 'interior_bridge' && (
        <TacticalRadar
          shipState={shipState}
          enemies={enemies}
          planets={planets}
          onLockEnemy={handleLockEnemy}
          onSelectPlanet={handleSelectTarget}
          isOpen={isRadarScannerOpen}
          onToggleOpen={() => setIsRadarScannerOpen((prev) => !prev)}
          onOpenObjectDetails={() => setIsObjectDetailModalOpen(true)}
          onPlotCourse={handleQuickPlotCourse}
          onDock={handleDock}
          onClearTarget={handleClearTarget}
        />
      )}

      {/* Spacer to push controls to bottom */}
      <div className="flex-1 pointer-events-none" />

      {/* Bottom Tactical Flight & LCARS Controls (Hidden in 3D Bridge Interior so 3D Consoles & Armrests are unobstructed) */}
      {currentView !== 'interior_bridge' && (
        <LCARSControls
          shipState={shipState}
          currentView={currentView}
          onSetCameraView={handleSetCameraView}
          onSetThrottle={handleSetThrottle}
          onSetWarpFactor={handleSetWarpFactor}
          onToggleWarp={handleToggleWarp}
          onStartPhaser={handleStartPhaser}
          onStopPhaser={handleStopPhaser}
          onFireTorpedo={handleFireTorpedo}
          onToggleShields={handleToggleShields}
          onToggleAutoPilot={handleToggleAutoPilot}
          onTargetHostile={handleTargetHostile}
          onSummonHostiles={handleSummonHostiles}
          combatAssist={combatAssist}
          onToggleCombatAssist={handleToggleCombatAssist}
          onTriggerBoost={handleTriggerBoost}
          onToggleTacticalLog={() => setIsLogConsoleOpen((prev) => !prev)}
          onToggleNavigation={() => setIsNavigationOpen((prev) => !prev)}
          isNavigationOpen={isNavigationOpen}
          onToggleMap={handleToggleMap}
          onDock={handleDock}
          onUndock={handleUndock}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
        />
      )}

      {/* Solar Systems & Auto-Course Navigation Console */}
      <NavigationConsole
        isOpen={isNavigationOpen}
        onClose={() => setIsNavigationOpen(false)}
        solarSystems={solarSystems}
        shipState={shipState}
        activeCoursePlot={shipState?.activeCoursePlot ?? null}
        currentSystemId={shipState?.currentSystemId ?? 'sol_system'}
        currentWarpFactor={shipState?.warpFactor ?? 6.0}
        onSetWarpFactor={handleSetWarpFactor}
        onSetCourse={handleSetCourse}
        onSetCoordinatesCourse={handleSetCoordinatesCourse}
        onCancelCourse={handleCancelCourse}
      />

      {/* Astrometrics Cartography // Sector & Planetary Map with Space Station Refit Docks */}
      <StarSystemMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        solarSystems={solarSystems}
        shipState={shipState}
        activeCoursePlot={shipState?.activeCoursePlot ?? null}
        onSetCourse={handleSetCourse}
        onSetCoordinatesCourse={handleSetCoordinatesCourse}
        onCancelCourse={handleCancelCourse}
        onDock={handleDock}
        onUndock={handleUndock}
      />

      {/* Subsystems & Deck-by-Deck 3D Inspection Drawer */}
      <ShipInspectionModal
        isOpen={isInspectionOpen}
        onClose={() => setIsInspectionOpen(false)}
        subsystems={subsystems}
        onFocusSubsystem={handleFocusSubsystem}
      />

      {/* Long-Range Sensor Scanner Drawer */}
      <SensorScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        targets={targets}
        selectedTargetId={shipState?.selectedTargetId ?? null}
        onSelectTarget={handleSelectTarget}
        autoPilot={shipState?.autoPilotToTarget ?? false}
        onToggleAutoPilot={handleToggleAutoPilot}
      />

      {/* Operations & Flight Manual Modal */}
      <ControlsHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Star Trek Combat Battle Theme Audio Console */}
      <LCARSBattleThemeWidget
        isOpen={isBattleThemeOpen}
        onClose={() => setIsBattleThemeOpen(false)}
        isFightingWave={enemies.some((e) => e.isAlive)}
        waveLevel={shipState?.combatWaveState?.level}
      />

      {/* USS Enterprise Computer Voice & Vocal Synthesizer Modal */}
      <LCARSVoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
      />

      {/* Real-time Overlay Tactical Combat Log Console */}
      <TacticalLogConsole
        isOpen={isLogConsoleOpen}
        onClose={() => setIsLogConsoleOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
        isDocked={isLogDocked}
        onToggleDock={() => setIsLogDocked((prev) => !prev)}
      />

      {/* Planetary Spectroscopy & Habitability Sensor Laboratory Modal */}
      <PlanetaryScannerModal
        isOpen={isPlanetaryScannerOpen}
        onClose={() => setIsPlanetaryScannerOpen(false)}
        targetPlanetId={shipState?.selectedTargetId || 'sol_saturn'}
        targetPlanetName={selectedObjectInfo?.name || 'Saturn (Sol VI)'}
        systemName={selectedObjectInfo?.systemName || 'Sol System'}
        objectType={selectedObjectInfo?.visual?.badgeLabel?.toLowerCase() || 'planet'}
        onPlotCourseToTarget={() => {
          if (shipState?.selectedTargetId) {
            handleQuickPlotCourse(shipState.selectedTargetId);
          }
        }}
        onFireDeflectorBeam={handleFireDeflectorBeam}
        onAwardScienceXp={(xp, label) => {
          engineRef.current?.awardMissionXp(xp, label);
        }}
      />

      {/* Astrometric Object Dossier & Know More Detailed Modal */}
      <LCARSObjectDetailModal
        isOpen={isObjectDetailModalOpen}
        onClose={() => setIsObjectDetailModalOpen(false)}
        objectInfo={selectedObjectInfo}
        onPlotCourse={handleQuickPlotCourse}
        onDock={handleDock}
        isDocked={shipState?.isDocked}
      />

      {/* Star Trek Exobiology & Alien Species Database Modal [X] */}
      <SpeciesDatabaseModal
        isOpen={isSpeciesDbOpen}
        onClose={() => setIsSpeciesDbOpen(false)}
        onPlotCourseToSystem={(sysId) => handleSetCourse(sysId, undefined, 7.5)}
        currentSystemId={shipState?.currentSystemId}
      />

      {/* Enterprise Catastrophic Destruction & Mission Restart Modal */}
      {shipState?.isDestroyed && (
        <EnterpriseDestructionModal
          defeatStats={shipState.defeatStats}
          progression={shipState.progression}
          onRestart={handleRestartSimulation}
        />
      )}
    </div>
  );
}
